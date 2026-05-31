import { applySecurityHeaders, validateContentType } from '../lib/security.js';

export default async (req, res) => {
  applySecurityHeaders(res, { isApi: true, noindex: true });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateContentType(req)) {
    return res.status(415).json({ error: 'Unsupported Content-Type' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.warn('[CSP-REPORT] Violation:', JSON.stringify({
      blockedURI: body?.['csp-report']?.['blocked-uri'] || 'unknown',
      violatedDirective: body?.['csp-report']?.['violated-directive'] || 'unknown',
      documentURI: body?.['csp-report']?.['document-uri']?.substring(0, 200) || 'unknown',
      userAgent: req.headers['user-agent']?.substring(0, 100) || 'unknown',
    }));
    res.status(204).end();
  } catch (err) {
    console.error('[CSP-REPORT] Error:', err);
    res.status(204).end();
  }
};
