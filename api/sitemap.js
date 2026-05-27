const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://uxdnhmkoiqqeiaoxeedw.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZG5obWtvaXFxZWlhb3hlZWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTI2MjEsImV4cCI6MjA4NDI2ODYyMX0.Wq509Vq5HwR120QuH_BbJHNKzJj31Vuji5lltm7b5jE";

const BASE_URL = "https://micasaperu.com";

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 10;

function getRateLimitKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
}

function checkRateLimit(req) {
  const ua = req.headers['user-agent'] || '';
  const isCrawler = /googlebot|bingbot|yandexbot|baiduspider|lighthouse|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora\slink\spreview|showyoubot|outbrain|pinterest\/0\.|slackbot|vkShare|W3C_Validator/i.test(ua);
  if (isCrawler) {
    return true; // Bypass rate limit for legitimate search engine bots and preview scrapers
  }
  const key = getRateLimitKey(req);
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(key, entry);
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toXmlDate(dateStr) {
  try { return new Date(dateStr || Date.now()).toISOString().split("T")[0]; }
  catch { return new Date().toISOString().split("T")[0]; }
}

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/pricing", changefreq: "weekly", priority: "0.8" },
  { loc: "/complaints", changefreq: "monthly", priority: "0.4" },
];

const SEARCH_PAGES = [
  { q: "Miraflores", priority: "0.9" },
  { q: "San+Isidro", priority: "0.9" },
  { q: "Santiago+de+Surco", priority: "0.9" },
  { q: "San+Borja", priority: "0.8" },
  { q: "La+Molina", priority: "0.8" },
  { q: "San+Miguel", priority: "0.8" },
  { q: "Magdalena+del+Mar", priority: "0.7" },
  { q: "Lince", priority: "0.7" },
  { q: "Jesus+Maria", priority: "0.7" },
  { q: "Pueblo+Libre", priority: "0.7" },
  { q: "Barranco", priority: "0.7" },
  { q: "Chorrillos", priority: "0.6" },
  { q: "Los+Olivos", priority: "0.7" },
  { q: "San+Martin+de+Porres", priority: "0.6" },
  { q: "Ate", priority: "0.6" },
  { q: "Callao", priority: "0.6" },
  { q: "Arequipa", priority: "0.8" },
  { q: "Trujillo", priority: "0.8" },
  { q: "Cusco", priority: "0.7" },
  { q: "Piura", priority: "0.7" },
  { q: "Tarapoto", priority: "0.6" },
];

const TYPE_PAGES = [
  "?type=Departamento&status=FOR_SALE",
  "?type=Departamento&status=FOR_RENT",
  "?type=Casa&status=FOR_SALE",
  "?type=Casa&status=FOR_RENT",
  "?type=Terreno&status=FOR_SALE",
  "?type=Oficina&status=FOR_RENT",
  "?status=PROJECT",
];

function applySitemapSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Robots-Tag', 'index, follow');
}

export default async (req, res) => {
  applySitemapSecurityHeaders(res);

  if (!checkRateLimit(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).send('Demasiadas solicitudes. Intenta de nuevo en 1 minuto.');
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  const today = new Date().toISOString().split("T")[0];
  let urls = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    urls.push(`  <url>\n    <loc>${BASE_URL}${page.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`);
  }

  // Search keyword pages
  for (const page of SEARCH_PAGES) {
    urls.push(`  <url>\n    <loc>${BASE_URL}/?search=${page.q}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`);
  }

  // Type/category pages
  for (const typePage of TYPE_PAGES) {
    urls.push(`  <url>\n    <loc>${BASE_URL}/${typePage}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`);
  }

  // Programmatic SEO landing pages (150+ combinations)
  const PROGRAMMATIC_DISTRICTS = [
    'miraflores', 'san-isidro', 'surco', 'la-molina', 'san-borja', 'barranco',
    'jesus-maria', 'magdalena-del-mar', 'lince', 'san-miguel', 'chorrillos', 'pueblo-libre'
  ];
  
  const PROGRAMMATIC_TYPES = ['departamentos', 'casas', 'terrenos'];
  const PROGRAMMATIC_STATUSES = ['venta', 'alquiler'];
  
  // Basic combinations: 12 * 3 * 2 = 72 URLs
  for (const dist of PROGRAMMATIC_DISTRICTS) {
    for (const type of PROGRAMMATIC_TYPES) {
      for (const status of PROGRAMMATIC_STATUSES) {
        urls.push(`  <url>\n    <loc>${BASE_URL}/${type}-en-${status}-en-${dist}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`);
      }
    }
  }

  // Premium amenity/intent combinations: 12 districts * 8 premium combos = 96 URLs
  for (const dist of PROGRAMMATIC_DISTRICTS) {
    const amenities = [
      'departamentos-en-venta-en-' + dist + '-con-balcon',
      'departamentos-en-alquiler-en-' + dist + '-con-balcon',
      'departamentos-en-venta-en-' + dist + '-con-terraza',
      'departamentos-en-alquiler-en-' + dist + '-pet-friendly',
      'casas-en-venta-en-' + dist + '-con-jardin',
      'casas-en-alquiler-en-' + dist + '-con-jardin',
      'casas-en-venta-en-' + dist + '-con-piscina',
      'departamentos-en-venta-en-' + dist + '-con-cochera'
    ];
    for (const combo of amenities) {
      urls.push(`  <url>\n    <loc>${BASE_URL}/${combo}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`);
    }
  }

  // Property pages from Supabase
  try {
    const fetchUrl = `${SUPABASE_URL}/rest/v1/properties?select=id,createdAt,featuredImage&status=neq.DRAFT&order=createdAt.desc&limit=5000`;
    const response = await fetch(fetchUrl, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Range-Unit": "items",
        "Range": "0-4999"
      }
    });

    if (response.ok) {
      const properties = await response.json();
      for (const p of properties) {
        const lastmod = toXmlDate(p.createdAt);
        const loc = escapeXml(`${BASE_URL}/properties/${p.id}`);
        let entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>`;
        if (p.featuredImage) {
          entry += `\n    <image:image>\n      <image:loc>${escapeXml(p.featuredImage)}</image:loc>\n    </image:image>`;
        }
        entry += `\n  </url>`;
        urls.push(entry);
      }
    }
  } catch (err) {
    console.error("Error fetching properties for sitemap:", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;

  return res.status(200).send(xml);
};
