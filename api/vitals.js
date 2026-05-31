export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('[RUM]', JSON.stringify(body));

    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[RUM] Error:', err);
    res.status(400).json({ ok: false });
  }
};
