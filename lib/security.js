// Shared security utilities for Vercel serverless functions

const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;
const rateLimitMap = new Map();

export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

export function checkRateLimit(req, options = {}) {
  const { max = RATE_LIMIT_MAX, window = RATE_LIMIT_WINDOW } = options;
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /googlebot|bingbot|yandexbot|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|slackbot|pinterest|slurp|duckduckbot|applebot|whatsapp/i.test(ua);
  if (isCrawler) return { allowed: true };
  const key = getClientIp(req);
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + window };
    rateLimitMap.set(key, entry);
  }
  entry.count++;
  return {
    allowed: entry.count <= max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
  };
}

export function applySecurityHeaders(res, options = {}) {
  const { isApi = false, noindex = false } = options;
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Cross-Origin-Opener-Policy', isApi ? 'same-origin' : 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (noindex) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
}

export function validateContentType(req, allowedTypes = ['application/json']) {
  const contentType = req.headers['content-type'] || '';
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    return allowedTypes.some(t => contentType.startsWith(t));
  }
  return true;
}

export function sanitizeString(str, maxLength = 1000) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

export function validateUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export function createCSPReportOnly() {
  return "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://sdk.mercadopago.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com; connect-src 'self' https://*.supabase.co; frame-src 'self' https://challenges.cloudflare.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; report-uri https://micasaperu.com/api/csp-report;";
}
