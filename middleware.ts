const blockedPatterns = [
  /bot|crawl|scrap|spider|scrapy|curl|wget|python-requests|go-http-client|mass/i,
  /八方|采集|爬虫/i,
  /mj12bot|semrush|ahrefs|dotbot|majestic|rogerbot/i,
];

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;
const STRICT_RATE_LIMIT_MAX = 20;

interface Counter {
  count: number;
  resetAt: number;
}

const ipCounters = new Map<string, Counter>();
const blockedIPs = new Map<string, number>();

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

function isRateLimited(ip: string, max: number): boolean {
  const now = Date.now();
  const blocked = blockedIPs.get(ip);
  if (blocked && now < blocked) return true;
  if (blocked && now >= blocked) blockedIPs.delete(ip);

  let counter = ipCounters.get(ip);
  if (!counter || now > counter.resetAt) {
    counter = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    ipCounters.set(ip, counter);
  }
  counter.count++;

  if (counter.count > max) {
    return true;
  }
  return false;
}

export function middleware(req: Request): Response | undefined {
  const url = new URL(req.url);
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';

  // Cloudflare Origin Shielding check
  const bypassToken = process.env.CLOUDFLARE_BYPASS_TOKEN;
  const requestBypassToken = req.headers.get('x-cloudflare-bypass-token');
  if (bypassToken && requestBypassToken !== bypassToken) {
    console.warn(`[SECURITY] Direct origin access blocked for IP: ${ip}`);
    return new Response('Access Denied', { status: 403 });
  }

  // Strict rate limit for API endpoints
  if (url.pathname.startsWith('/api/')) {
    if (isRateLimited(ip, STRICT_RATE_LIMIT_MAX)) {
      console.warn(`[SECURITY] API rate limit exceeded for IP: ${ip}`);
      return new Response('Demasiadas solicitudes', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  } else {
    // General rate limit
    if (isRateLimited(ip, RATE_LIMIT_MAX)) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
      return new Response('Demasiadas solicitudes', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  // Bot/scraper detection for image URLs
  const isKnownBot = userAgent.includes('Googlebot') || userAgent.includes('Bingbot');
  const isImage = /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url.pathname);
  if (!isKnownBot && isImage) {
    const isScraper = blockedPatterns.some(p => p.test(userAgent));
    if (isScraper) {
      console.warn(`[SECURITY] Scraper blocked: ${userAgent.substring(0, 80)} from IP: ${ip}`);
      return new Response(null, { status: 403 });
    }
  }

  // Block direct access to sensitive paths
  const sensitivePaths = ['/.env', '/.git', '/node_modules', '/scratch', '/backups', '/.vercel'];
  if (sensitivePaths.some(p => url.pathname.startsWith(p))) {
    return new Response('Not Found', { status: 404 });
  }
}

export const config = {
  matcher: [
    '/((?!assets/|favicon\\.ico|og-image\\.jpg|robots\\.txt|manifest\\.json).*)',
  ],
};
