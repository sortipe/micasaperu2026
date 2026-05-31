import { checkRateLimit, applySecurityHeaders, validateContentType, getClientIp, sanitizeString } from '../lib/security.js';

export default async function handler(req, res) {
  applySecurityHeaders(res, { isApi: true, noindex: true });

  const rateCheck = checkRateLimit(req, { max: 20 });
  res.setHeader('X-RateLimit-Limit', '20');
  res.setHeader('X-RateLimit-Remaining', String(rateCheck.remaining));
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Demasiadas solicitudes.' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateContentType(req)) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const token = body?.token ? sanitizeString(body.token, 2048) : '';
  if (!token || token.length < 10) {
    return res.status(400).json({ error: 'Token inválido' });
  }

  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';

  try {
    const remoteIp = getClientIp(req);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token, remoteip: remoteIp }),
    });

    const result = await response.json();

    if (result.success) {
      return res.status(200).json({ success: true });
    }
    console.warn('[SECURITY] Turnstile verification failed:', result['error-codes']);
    return res.status(400).json({ success: false, error: 'Verificación fallida' });
  } catch (err) {
    console.error('[SECURITY] Turnstile verification error:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
