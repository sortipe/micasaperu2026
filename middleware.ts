const blockedPatterns = [
  /bot|crawl|scrap|spider|scrapy|curl|wget|python-requests|go-http-client|mass/i,
  /八方|采集|爬虫/i,
];

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;

const ipCounters = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export function middleware(req: Request): Response | undefined {
  const url = new URL(req.url);
  const ip = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';

  const now = Date.now();
  let counter = ipCounters.get(ip);
  if (!counter || now > counter.resetAt) {
    counter = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    ipCounters.set(ip, counter);
  }
  counter.count++;

  if (counter.count > RATE_LIMIT_MAX) {
    return new Response('Demasiadas solicitudes', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  const isKnownBot = userAgent.includes('Googlebot') || userAgent.includes('Bingbot');
  const isImage = /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url.pathname);
  if (!isKnownBot && isImage) {
    const isScraper = blockedPatterns.some(p => p.test(userAgent));
    if (isScraper) {
      return new Response(null, { status: 403 });
    }
  }
}

export const config = {
  matcher: [
    '/((?!assets/|favicon\\.ico|og-image\\.jpg|robots\\.txt|manifest\\.json).*)',
  ],
};
