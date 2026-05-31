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
    return { url, count: data.count, metrics: avg };
  });
  console.log('[RUM] Flush:', JSON.stringify(summary));
}

setInterval(flushBuffer, FLUSH_INTERVAL).unref();

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body && body.name && typeof body.value === 'number') {
      METRICS_BUFFER.push(body);
      if (METRICS_BUFFER.length >= BUFFER_MAX) flushBuffer();
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[RUM] Error:', err);
    res.status(400).json({ ok: false });
  }
};
