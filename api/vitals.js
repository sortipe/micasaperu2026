import { checkRateLimit, applySecurityHeaders, validateContentType, sanitizeString } from '../lib/security.js';

const METRICS_BUFFER = [];
const FLUSH_INTERVAL = 60000;
const BUFFER_MAX = 100;

function flushBuffer() {
  if (METRICS_BUFFER.length === 0) return;
  const batch = METRICS_BUFFER.splice(0, METRICS_BUFFER.length);
  const byPath = {};
  for (const m of batch) {
    if (!byPath[m.url]) byPath[m.url] = { metrics: {}, count: 0 };
    byPath[m.url].count++;
    if (!byPath[m.url].metrics[m.name]) byPath[m.url].metrics[m.name] = [];
    byPath[m.url].metrics[m.name].push(m.value);
  }
  const summary = Object.entries(byPath).map(([url, data]) => {
    const avg = {};
    for (const [name, values] of Object.entries(data.metrics)) {
      const sorted = values.sort((a, b) => a - b);
      avg[name] = {
        avg: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
        p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
        p75: sorted[Math.floor(sorted.length * 0.75)] || 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
        count: values.length,
      };
    }
    return { url: sanitizeString(url, 200), count: data.count, metrics: avg };
  });
  console.log('[RUM] Flush:', JSON.stringify(summary));
}

setInterval(flushBuffer, FLUSH_INTERVAL).unref();

export default async (req, res) => {
  applySecurityHeaders(res, { isApi: true, noindex: true });

  const rateCheck = checkRateLimit(req, { max: 100 });
  res.setHeader('X-RateLimit-Limit', '100');
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

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!body || typeof body.name !== 'string' || typeof body.value !== 'number') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Validate metric name to prevent injection
    const validMetrics = ['CLS', 'FCP', 'INP', 'LCP', 'TTFB'];
    if (!validMetrics.includes(body.name)) {
      return res.status(400).json({ error: 'Invalid metric name' });
    }

    // Sanitize and validate value bounds
    const value = Math.abs(body.value);
    if (value > 1000000 || value < 0) {
      return res.status(400).json({ error: 'Invalid metric value' });
    }

    METRICS_BUFFER.push({
      name: body.name,
      value: value,
      rating: body.rating || 'unknown',
      url: sanitizeString(body.url || '/', 200),
      timestamp: Date.now(),
    });

    if (METRICS_BUFFER.length >= BUFFER_MAX) flushBuffer();

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[RUM] Error:', err);
    res.status(400).json({ error: 'Invalid request' });
  }
};
