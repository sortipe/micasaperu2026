const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

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
  const isCrawler = /googlebot|bingbot|yandexbot|baiduspider|lighthouse|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|slackbot|pinterest|slurp/i.test(ua);
  if (isCrawler) return true;
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
  { loc: "/", changefreq: "hourly", priority: "1.0" },
  { loc: "/pricing", changefreq: "daily", priority: "0.9" },
  { loc: "/complaints", changefreq: "monthly", priority: "0.5" },
  { loc: "/search", changefreq: "daily", priority: "0.8" },
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
  { q: "San+Juan+de+Lurigancho", priority: "0.6" },
  { q: "Ate", priority: "0.6" },
  { q: "Callao", priority: "0.6" },
  { q: "Surquillo", priority: "0.6" },
  { q: "Brena", priority: "0.6" },
  { q: "Santa+Anita", priority: "0.6" },
  { q: "Rimac", priority: "0.5" },
  { q: "Villa+El+Salvador", priority: "0.5" },
  { q: "Arequipa", priority: "0.8" },
  { q: "Trujillo", priority: "0.8" },
  { q: "Cusco", priority: "0.7" },
  { q: "Piura", priority: "0.7" },
  { q: "Tarapoto", priority: "0.6" },
  { q: "Ica", priority: "0.6" },
];

const TYPE_PAGES = [
  "?type=Departamento&status=FOR_SALE",
  "?type=Departamento&status=FOR_RENT",
  "?type=Casa&status=FOR_SALE",
  "?type=Casa&status=FOR_RENT",
  "?type=Terreno&status=FOR_SALE",
  "?type=Oficina+comercial&status=FOR_RENT",
  "?type=Local+comercial&status=FOR_SALE",
  "?status=PROJECT",
];

const PROGRAMMATIC_DISTRICTS = [
  'miraflores', 'san-isidro', 'surco', 'la-molina', 'san-borja', 'barranco',
  'jesus-maria', 'magdalena-del-mar', 'lince', 'san-miguel', 'chorrillos',
  'pueblo-libre', 'los-olivos', 'san-martin-de-porres', 'san-juan-de-lurigancho',
  'ate', 'surquillo', 'brena', 'santa-anita', 'rimac', 'villa-el-salvador',
  'arequipa', 'trujillo', 'cusco', 'piura', 'tarapoto', 'ica'
];

const PROGRAMMATIC_TYPES = ['departamentos', 'casas', 'terrenos', 'oficinas', 'locales'];
const PROGRAMMATIC_STATUSES = ['venta', 'alquiler'];

const AMENITY_COMBOS = [
  'con-balcon', 'con-terraza', 'con-jardin', 'con-piscina',
  'con-cochera', 'con-ascensor', 'pet-friendly', 'con-seguridad'
];

function applySitemapSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
}

export default async (req, res) => {
  applySitemapSecurityHeaders(res);

  if (!checkRateLimit(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).send('Demasiadas solicitudes.');
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).send('Server config error');
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400");

  const today = new Date().toISOString().split("T")[0];
  let urls = [];

  function addUrl(loc, lastmod, changefreq, priority, image) {
    let entry = `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod || today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>`;
    if (image) {
      entry += `\n    <image:image>\n      <image:loc>${escapeXml(image)}</image:loc>\n    </image:image>`;
    }
    entry += `\n  </url>`;
    urls.push(entry);
  }

  for (const page of STATIC_PAGES) {
    addUrl(`${BASE_URL}${page.loc}`, today, page.changefreq, page.priority);
  }

  for (const page of SEARCH_PAGES) {
    addUrl(`${BASE_URL}/?search=${page.q}`, today, 'daily', page.priority);
  }

  for (const typePage of TYPE_PAGES) {
    addUrl(`${BASE_URL}/${typePage}`, today, 'daily', '0.7');
  }

  for (const dist of PROGRAMMATIC_DISTRICTS) {
    for (const type of PROGRAMMATIC_TYPES) {
      for (const status of PROGRAMMATIC_STATUSES) {
        addUrl(`${BASE_URL}/${type}-en-${status}-en-${dist}/`, today, 'daily', '0.8');
      }
    }
  }

  for (const dist of PROGRAMMATIC_DISTRICTS.slice(0, 15)) {
    for (const amenity of AMENITY_COMBOS) {
      const type = amenity.includes('jardin') ? 'casas' :
                   amenity.includes('piscina') ? 'casas' :
                   amenity.includes('cochera') ? 'departamentos' : 'departamentos';
      const status = amenity.includes('pet-friendly') ? 'alquiler' : 'venta';
      addUrl(`${BASE_URL}/${type}-en-${status}-en-${dist}-${amenity}/`, today, 'daily', '0.7');
    }
  }

  try {
    const fetchUrl = `${SUPABASE_URL}/rest/v1/properties?select=id,createdAt,updated_at,publishedAt,featuredImage,gallery&status=neq.DRAFT&order=createdAt.desc`;
    const response = await fetch(fetchUrl, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      }
    });

    if (response.ok) {
      const properties = await response.json();
      for (const p of properties) {
        const lastmod = toXmlDate(p.updated_at || p.publishedAt || p.createdAt);
        const loc = escapeXml(`${BASE_URL}/properties/${p.id}`);
        const featuredImage = p.featuredImage ? escapeXml(p.featuredImage) : null;

        addUrl(loc, lastmod, 'weekly', '0.7', featuredImage);

        if (p.gallery && Array.isArray(p.gallery)) {
          for (const img of p.gallery.slice(0, 5)) {
            if (img && img !== p.featuredImage) {
              addUrl(loc, lastmod, 'weekly', '0.6', escapeXml(img));
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching properties for sitemap:", err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return res.status(200).send(xml);
};
