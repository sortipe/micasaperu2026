import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://uxdnhmkoiqqeiaoxeedw.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZG5obWtvaXFxZWlhb3hlZWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTI2MjEsImV4cCI6MjA4NDI2ODYyMX0.Wq509Vq5HwR120QuH_BbJHNKzJj31Vuji5lltm7b5jE";

const CACHE_TTL = 300;
const cache = new Map();
const pendingFetches = new Map();

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 30;

function getRateLimitKey(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';
  return ip;
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toISODate(dateStr) {
  try { return new Date(dateStr || Date.now()).toISOString(); } catch { return new Date().toISOString(); }
}

function generateBreadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function injectSsrDom(html, ssrContent) {
  if (!ssrContent) return html;
  // Use a class instead of inline styles for hiding, and prefer visually-hidden (accessible) or just let it render!
  // Since React will nuke the #root element anyway, we can just inject it there to avoid Google cloaking penalties.
  const wrappedContent = `<div id="seo-ssr-content" class="ssr-fallback-content">${ssrContent}</div>`;
  // We place it right inside #root so it acts as the initial DOM before React's createRoot takes over.
  return html.replace('<div id="root">', `<div id="root">\n${wrappedContent}`);
}

function parseProgrammaticUrl(pathname) {
  const path = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const parts = path.split('-en-');
  if (parts.length < 2) return null;

  let type = null;
  let status = null;
  let district = null;
  let amenity = null;

  let rawType = '';
  let rawStatus = '';
  let districtSlug = '';
  let amenitySlug = null;

  const knownTypes = {
    'departamento': 'Departamento', 'departamentos': 'Departamento',
    'casa': 'Casa', 'casas': 'Casa',
    'terreno': 'Terreno', 'terrenos': 'Terreno',
    'oficina': 'Oficina comercial', 'oficinas': 'Oficina comercial',
    'local': 'Local comercial', 'locales': 'Local comercial',
    'habitacion': 'Habitación', 'habitaciones': 'Habitación',
    'lote': 'Lote', 'lotes': 'Lote',
    'cochera': 'Cochera', 'cocheras': 'Cochera',
    'proyecto': 'Proyectos de lotes', 'proyectos': 'Proyectos de lotes'
  };

  const knownStatus = {
    'venta': 'FOR_SALE', 'ventas': 'FOR_SALE',
    'alquiler': 'FOR_RENT', 'alquileres': 'FOR_RENT',
    'temporal': 'TEMPORAL', 'temporales': 'TEMPORAL',
    'proyecto': 'PROJECT', 'proyectos': 'PROJECT',
    'traspaso': 'TRASPASO', 'traspasos': 'TRASPASO'
  };

  const knownDistricts = {
    'miraflores': 'Miraflores',
    'san-isidro': 'San Isidro', 'san isidro': 'San Isidro',
    'santiago-de-surco': 'Santiago de Surco', 'santiago de surco': 'Santiago de Surco',
    'surco': 'Santiago de Surco',
    'la-molina': 'La Molina', 'la molina': 'La Molina',
    'san-borja': 'San Borja', 'san borja': 'San Borja',
    'los-olivos': 'Los Olivos', 'los olivos': 'Los Olivos',
    'san-martin-de-porres': 'San Martín de Porres', 'san martin de porres': 'San Martín de Porres', 'smp': 'San Martín de Porres',
    'san-juan-de-lurigancho': 'San Juan de Lurigancho', 'san juan de lurigancho': 'San Juan de Lurigancho', 'sjl': 'San Juan de Lurigancho',
    'barranco': 'Barranco',
    'jesus-maria': 'Jesús María', 'jesus maria': 'Jesús María',
    'magdalena-del-mar': 'Magdalena del Mar', 'magdalena del mar': 'Magdalena del Mar', 'magdalena': 'Magdalena del Mar',
    'pueblo-libre': 'Pueblo Libre', 'pueblo libre': 'Pueblo Libre',
    'lince': 'Lince',
    'chorrillos': 'Chorrillos',
    'san-miguel': 'San Miguel', 'san miguel': 'San Miguel',
    'surquillo': 'Surquillo',
    'ate': 'Ate',
    'breña': 'Breña', 'brena': 'Breña',
    'santa-anita': 'Santa Anita', 'santa anita': 'Santa Anita',
    'villa-el-salvador': 'Villa El Salvador', 'villa el salvador': 'Villa El Salvador', 'ves': 'Villa El Salvador',
    'rimac': 'Rímac', 'rímac': 'Rímac',
    'arequipa': 'Arequipa',
    'trujillo': 'Trujillo',
    'cusco': 'Cusco',
    'tarapoto': 'Tarapoto'
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    if (knownTypes[part]) {
      type = knownTypes[part];
      rawType = part;
      continue;
    }

    if (knownStatus[part]) {
      status = knownStatus[part];
      rawStatus = part;
      continue;
    }

    let districtCandidate = part;

    if (part.includes('-con-')) {
      const subParts = part.split('-con-');
      districtCandidate = subParts[0];
      amenitySlug = 'con-' + subParts[1];
    } else if (part.includes('-pet-friendly')) {
      const subParts = part.split('-pet-friendly');
      districtCandidate = subParts[0];
      amenitySlug = 'pet-friendly';
    } else {
      const knownAmenities = ['jardin', 'balcon', 'piscina', 'terraza', 'cochera', 'ascensor', 'seguridad'];
      for (const amen of knownAmenities) {
        if (part.endsWith('-' + amen)) {
          districtCandidate = part.substring(0, part.length - amen.length - 1);
          amenitySlug = amen;
          break;
        }
      }
    }

    if (knownDistricts[districtCandidate]) {
      district = knownDistricts[districtCandidate];
      districtSlug = districtCandidate;
    } else {
      district = districtCandidate.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      districtSlug = districtCandidate;
    }
  }

  if (!district || (!type && !status)) {
    return null;
  }

  if (!type) {
    type = 'Departamento';
    rawType = 'departamentos';
  }
  if (!status) {
    status = 'FOR_SALE';
    rawStatus = 'venta';
  }

  if (amenitySlug) {
    if (amenitySlug.includes('jardin')) amenity = 'Áreas verdes';
    else if (amenitySlug.includes('balcon')) amenity = 'Balcón con vista';
    else if (amenitySlug.includes('piscina')) amenity = 'Piscina';
    else if (amenitySlug.includes('terraza')) amenity = 'Terraza';
    else if (amenitySlug.includes('pet-friendly') || amenitySlug.includes('mascotas')) amenity = 'Pet friendly';
    else if (amenitySlug.includes('cochera') || amenitySlug.includes('estacionamiento')) amenity = 'Estacionamiento techado';
    else if (amenitySlug.includes('ascensor')) amenity = 'Ascensor';
    else if (amenitySlug.includes('seguridad')) amenity = 'Sistema de seguridad';
  }

  return {
    type,
    status,
    district,
    amenity,
    slugs: {
      type: rawType,
      status: rawStatus,
      district: districtSlug,
      amenity: amenitySlug
    }
  };
}

const SEARCH_KEYWORD_PAGES = [
  { q: 'Miraflores', title: 'Departamentos en Venta en Miraflores, Lima | Mi Casa Perú', desc: 'Encuentra departamentos y casas en venta en Miraflores, Lima. El distrito más exclusivo de Lima con vista al mar, bares y restaurantes.' },
  { q: 'San+Isidro', title: 'Departamentos en Alquiler en San Isidro, Lima | Mi Casa Perú', desc: 'Departamentos en alquiler en San Isidro, el centro financiero de Lima. Ideal para ejecutivos y familias cerca a los mejores colegios.' },
  { q: 'Santiago+de+Surco', title: 'Casas y Departamentos en Venta en Surco, Lima | Mi Casa Perú', desc: 'Encuentra las mejores propiedades en Santiago de Surco. Casas amplias, departamentos modernos y zonas residenciales exclusivas.' },
  { q: 'San+Borja', title: 'Departamentos en San Borja, Lima | Mi Casa Perú', desc: 'Departamentos en venta y alquiler en San Borja. Distrito seguro y familiar con amplias áreas verdes y buena conectividad.' },
  { q: 'La+Molina', title: 'Casas en Venta en La Molina, Lima | Mi Casa Perú', desc: 'Casas y quintas en venta en La Molina. La mejor zona residencial campestre de Lima con seguridad y áreas verdes.' },
  { q: 'San+Miguel', title: 'Departamentos en San Miguel, Lima | Mi Casa Perú', desc: 'Departamentos en venta y alquiler en San Miguel. Cerca de la UPC, la Marina y el Real Plaza.' },
  { q: 'Los+Olivos', title: 'Departamentos en Los Olivos, Lima | Mi Casa Perú', desc: 'Encuentra departamentos y casas en Los Olivos, el distrito más poblado de Lima Norte con gran plusvalía.' },
  { q: 'Arequipa', title: 'Inmuebles en Arequipa | Mi Casa Perú', desc: 'Casas, departamentos y terrenos en venta y alquiler en Arequipa. La ciudad blanca te espera con las mejores propiedades.' },
  { q: 'Trujillo', title: 'Casas y Departamentos en Trujillo, La Libertad | Mi Casa Perú', desc: 'Inmuebles en venta y alquiler en Trujillo, la capital de la primavera. Encuentra propiedades en La Libertad.' },
  { q: 'Cusco', title: 'Propiedades en Cusco | Mi Casa Perú', desc: 'Casas, departamentos y terrenos en venta en Cusco. La capital histórica del Perú con propiedades de gran valor.' },
];

const TYPE_SEARCH_PAGES = [
  { type: 'Departamento', status: 'FOR_SALE', title: 'Departamentos en Venta en Lima | Mi Casa Perú', desc: 'Los mejores departamentos en venta en Lima. Desde Miraflores hasta San Juan de Lurigancho, encuentra el depa ideal para ti.' },
  { type: 'Departamento', status: 'FOR_RENT', title: 'Departamentos en Alquiler en Lima | Mi Casa Perú', desc: 'Alquiler de departamentos en Lima. Corta y larga estadía en los mejores distritos de la capital.' },
  { type: 'Casa', status: 'FOR_SALE', title: 'Casas en Venta en Lima | Mi Casa Perú', desc: 'Casas en venta en Lima. Casas independientes, quintas y mansiones en los mejores distritos de Lima.' },
  { type: 'Casa', status: 'FOR_RENT', title: 'Casas en Alquiler en Lima | Mi Casa Perú', desc: 'Alquiler de casas en Lima. Encuentra la casa perfecta para tu familia en zonas residenciales.' },
  { type: 'Terreno', status: 'FOR_SALE', title: 'Terrenos en Venta en Lima | Mi Casa Perú', desc: 'Terrenos y lotes en venta en Lima y Perú. Invierte en el terreno ideal para tu proyecto.' },
  { type: 'Oficina', status: 'FOR_RENT', title: 'Oficinas en Alquiler en Lima | Mi Casa Perú', desc: 'Alquiler de oficinas en Lima. Locales comerciales y espacios de trabajo en las mejores zonas corporativas.' },
  { q: 'PROJECT', title: 'Proyectos Inmobiliarios en Lima | Mi Casa Perú', desc: 'Los mejores proyectos inmobiliarios en Lima y Perú. Departamentos de estreno, casas nuevas y desarrollos verticales.' },
];

async function fetchWithCache(url) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && (now - cached.timestamp) < CACHE_TTL * 1000) {
    return cached.data;
  }
  if (pendingFetches.has(url)) {
    return pendingFetches.get(url);
  }
  const promise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      if (!response.ok) return null;
      const data = await response.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data;
    } finally {
      pendingFetches.delete(url);
    }
  })();
  pendingFetches.set(url, promise);
  return promise;
}

function replaceMeta(html, title, description, canonical, ogImage, lastmod, keywords) {
  const today = new Date().toISOString().split('T')[0];
  const lm = lastmod ? lastmod.split('T')[0] : today;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+[^>]*name=["']?description["']?[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  if (keywords) {
    html = html.replace(/<meta\s+[^>]*name=["']?keywords["']?[^>]*>/i, `<meta name="keywords" content="${escapeHtml(keywords)}">`);
  }
  html = html.replace(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`);
  const metaTags = `
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(ogImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Mi Casa Perú">
    <meta property="og:locale" content="es_PE">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(ogImage)}">
    <meta name="twitter:site" content="@micasaperu">
    <meta name="last-modified" content="${lm}">
    <meta http-equiv="last-modified" content="${lm}">`;
  html = html.replace('</head>', `${metaTags}\n</head>`);
  return html;
}

function applySecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://sdk.mercadopago.com; connect-src 'self' https://uxdnhmkoiqqeiaoxeedw.supabase.co https://api.mercadopago.com https://nominatim.openstreetmap.org; img-src 'self' data: blob: https://uxdnhmkoiqqeiaoxeedw.supabase.co https://images.unsplash.com https://ui-avatars.com https://*.basemaps.cartocdn.com https://*.google.com https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://challenges.cloudflare.com https://www.mercadopago.com; object-src 'none'; upgrade-insecure-requests; frame-ancestors 'none'; form-action 'self'; base-uri 'self';");
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Robots-Tag', 'index, follow');
}

export default async (req, res) => {
  applySecurityHeaders(res);
  
  if (!checkRateLimit(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).send('Demasiadas solicitudes. Intenta de nuevo en 1 minuto.');
  }

  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  res.setHeader('X-RateLimit-Remaining', String(
    RATE_LIMIT_MAX - (rateLimitMap.get(getRateLimitKey(req))?.count || 0)
  ));

  let indexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(process.cwd(), 'index.html');
  }
  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    console.error("Error reading index.html:", err);
    return res.status(500).send("Internal Server Error");
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');

  const url = new URL(req.url, 'https://micasaperu.com');
  const pathRoute = url.pathname;

  // ---- PROGRAMMATIC SEO ROUTING ----
  const progRoute = parseProgrammaticUrl(pathRoute);
  if (progRoute) {
    // 1. Fetch matching properties from Supabase to create an ItemList structured schema!
    // Construct Supabase SELECT URL using URLSearchParams for secure, auto-encoded parameter construction
    const params = new URLSearchParams({
      status: `eq.${progRoute.status}`,
      type: `eq.${progRoute.type}`,
      district: `eq.${progRoute.district}`,
      select: '*'
    });
    let fetchUrl = `${SUPABASE_URL}/rest/v1/properties?${params.toString()}`;
    
    let properties = [];
    try {
      const data = await fetchWithCache(fetchUrl);
      if (data) {
        // Filter by amenity in memory if specified
        if (progRoute.amenity) {
          properties = data.filter(p => p.features && p.features.includes(progRoute.amenity));
        } else {
          properties = data;
        }
      }
    } catch (e) {
      console.error("Error fetching programmatic properties:", e);
    }
    
    // 2. Build beautiful titles, descriptions, and keywords
    const typeLabelPlural = progRoute.type === 'Departamento' ? 'Departamentos' :
      progRoute.type === 'Casa' ? 'Casas' :
      progRoute.type === 'Terreno' ? 'Terrenos' :
      progRoute.type === 'Oficina comercial' ? 'Oficinas' :
      progRoute.type === 'Local comercial' ? 'Locales' : progRoute.type + 's';
      
    const operationLabel = progRoute.status === 'FOR_RENT' ? 'en Alquiler' : 'en Venta';
    const amenityLabel = progRoute.amenity ? ` con ${progRoute.amenity.toLowerCase()}` : '';
    
    const title = `${typeLabelPlural} ${operationLabel} en ${progRoute.district}${amenityLabel} | Mi Casa Perú`;
    const description = `¿Buscas ${typeLabelPlural.toLowerCase()} ${operationLabel.toLowerCase()} en ${progRoute.district}${amenityLabel}? Encuentra ${properties.length > 0 ? properties.length : 'las mejores'} opciones de particulares, corredores y constructoras en el portal inmobiliario líder del Perú.`;
    const canonicalUrl = `https://micasaperu.com${pathRoute}`;
    const ogImage = properties.length > 0 && properties[0].featuredImage ? properties[0].featuredImage : 'https://micasaperu.com/og-image.jpg';
    const lastmod = new Date().toISOString();
    const keywords = `${typeLabelPlural.toLowerCase()} en ${progRoute.district.toLowerCase()}${amenityLabel ? ', ' + typeLabelPlural.toLowerCase() + ' con ' + progRoute.amenity.toLowerCase() : ''}, ${progRoute.type.toLowerCase()}s ${operationLabel.toLowerCase()} ${progRoute.district.toLowerCase()}`;
    
    html = replaceMeta(html, title, description, canonicalUrl, ogImage, lastmod, keywords);
    
    // 3. Inject ItemList schema to show the search results in Google Rich Snippets!
    const breadcrumb = generateBreadcrumb([
      { name: 'Inicio', url: 'https://micasaperu.com' },
      { name: `${typeLabelPlural} ${operationLabel}`, url: `https://micasaperu.com/?type=${encodeURIComponent(progRoute.type)}&status=${progRoute.status}` },
      { name: `${progRoute.district}`, url: canonicalUrl }
    ]);
    
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': title,
      'numberOfItems': properties.length,
      'itemListElement': properties.slice(0, 10).map((p, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'url': `https://micasaperu.com/properties/${p.id}`,
        'name': p.title
      }))
    };
    
    const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);
    
    const ssrHtml = `
      <header>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </header>
      <main>
        <ul>
          ${properties.map(p => `
            <li>
              <article>
                <h2><a href="https://micasaperu.com/properties/${p.id}">${escapeHtml(p.title)}</a></h2>
                <p>${escapeHtml(p.description || '')}</p>
                <p>Precio: ${p.priceUSD ? '$' + p.priceUSD : (p.pricePEN ? 'S/' + p.pricePEN : 'Consultar')}</p>
                <p>Ubicación: ${escapeHtml(p.district || '')}</p>
              </article>
            </li>
          `).join('')}
        </ul>
      </main>
    `;
    html = injectSsrDom(html, ssrHtml);
    
    return res.send(html);
  }

  // ---- 404 handling ----
  const staticPatterns = ['/pricing', '/complaints', '/complaints/', '/search', '/login', '/cart'];
  const isLikelyPage = !pathRoute.includes('.') || pathRoute.endsWith('/');
  if (isLikelyPage && !staticPatterns.includes(pathRoute) && !pathRoute.startsWith('/properties/') && !pathRoute.startsWith('/propiedades/') && !pathRoute.startsWith('/propiedad/') && pathRoute !== '/') {
    res.setHeader('X-Robots-Tag', 'noindex');
  }

  // ---- Detect property ID ----
  let propertyId = url.searchParams.get('propertyId') || url.searchParams.get('id');
  if (!propertyId) {
    const parts = pathRoute.split('/');
    if ((parts[1] === 'properties' || parts[1] === 'propiedades' || parts[1] === 'propiedad') && parts[2]) {
      propertyId = parts[2];
    }
  }
  // Enforce strict UUID validation in all cases to prevent any URL parameter injection
  if (propertyId) {
    propertyId = propertyId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)) {
      propertyId = null;
    }
  }

  // ---- Detect search params ----
  const searchQuery = url.searchParams.get('search');
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status');

  // ---- PROPERTY DETAIL PAGE (Highest priority) ----
  if (propertyId) {
    try {
      const fetchUrl = `${SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}&select=*`;
      const data = await fetchWithCache(fetchUrl);

      if (data && data.length > 0) {
        const property = data[0];
        const formattedPricePEN = property.pricePEN ? `S/ ${property.pricePEN.toLocaleString('es-PE')}` : '';
        const formattedPriceUSD = property.priceUSD ? `$ ${property.priceUSD.toLocaleString('en-US')}` : '';
        const priceString = [formattedPriceUSD, formattedPricePEN].filter(Boolean).join(' / ');
        const operationType = property.status === 'FOR_RENT' ? 'Alquiler' :
          property.status === 'FOR_SALE' ? 'Venta' :
            property.status === 'PROJECT' ? 'Proyecto' : 'Traspaso/Otro';

        const title = `${property.title} | ${property.district}, ${property.department} - Mi Casa Perú`;
        const description = `Increíble ${property.type} en ${operationType} en ${property.district} por ${priceString}. ${property.bedrooms} dormitorios, ${property.bathrooms} baños, ${property.constructionArea || property.terrainArea || 0} m². ¡Contáctanos hoy!`;
        const canonicalUrl = `https://micasaperu.com/properties/${property.id}`;
        const ogImage = property.featuredImage || "https://micasaperu.com/og-image.jpg";
        const lastmod = toISODate(property.updated_at || property.publishedAt || property.createdAt);

        const keywords = `${property.type} en ${property.district}, ${property.type} ${operationType} ${property.department}, inmobiliaria ${property.district}, ${property.title}`;

        html = replaceMeta(html, title, description, canonicalUrl, ogImage, lastmod, keywords);

        const schemaType = property.type === 'Departamento' ? 'Apartment' :
          property.type === 'Casa' ? 'SingleFamilyResidence' : 'House';

        const realEstateSchema = {
          '@context': 'https://schema.org',
          '@type': schemaType,
          'name': property.title,
          'description': property.description,
          'image': property.gallery && property.gallery.length > 0 ? property.gallery : [property.featuredImage],
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': property.address || '',
            'addressLocality': property.district || '',
            'addressRegion': property.department || '',
            'addressCountry': 'PE'
          },
          ...(property.lat && property.lng ? {
            'geo': { '@type': 'GeoCoordinates', 'latitude': property.lat, 'longitude': property.lng }
          } : {}),
          'numberOfRooms': property.bedrooms || 0,
          'numberOfBathroomsTotal': property.bathrooms || 0,
          'floorSize': { '@type': 'QuantitativeValue', 'value': property.constructionArea || property.terrainArea || 0, 'unitCode': 'MTK' },
          'offers': {
            '@type': 'Offer',
            'priceCurrency': property.priceUSD ? 'USD' : 'PEN',
            'price': property.priceUSD || property.pricePEN || 0,
            'availability': 'https://schema.org/InStock',
            'url': canonicalUrl
          }
        };

        const breadcrumb = generateBreadcrumb([
          { name: 'Inicio', url: 'https://micasaperu.com' },
          { name: `${property.type} en ${operationType}`, url: `https://micasaperu.com/?type=${encodeURIComponent(property.type)}&status=${property.status}` },
          { name: property.title, url: canonicalUrl }
        ]);

        const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(realEstateSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n`;
        html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, schemaScript);
        
        const ssrHtml = `
          <article>
            <header>
              <h1>${escapeHtml(property.title)}</h1>
              <p>Precio: ${escapeHtml(priceString)}</p>
            </header>
            <section>
              <img src="${escapeHtml(ogImage)}" alt="${escapeHtml(property.title)}" />
              <p>${escapeHtml(property.description || '')}</p>
              <ul>
                <li>Dormitorios: ${property.bedrooms || 0}</li>
                <li>Baños: ${property.bathrooms || 0}</li>
                <li>Área: ${property.constructionArea || property.terrainArea || 0} m²</li>
                <li>Ubicación: ${escapeHtml(property.district || '')}, ${escapeHtml(property.department || '')}</li>
              </ul>
            </section>
          </article>
        `;
        html = injectSsrDom(html, ssrHtml);
      } else {
        // Property not found — serve generic but indexed
        html = replaceMeta(html,
          'Inmueble no encontrado | Mi Casa Perú',
          'El inmueble que buscas no está disponible. Explora otras propiedades en venta y alquiler en Lima y Perú.',
          `https://micasaperu.com/properties/${propertyId}`,
          'https://micasaperu.com/og-image.jpg',
          new Date().toISOString());
        res.setHeader('X-Robots-Tag', 'noindex');
      }
    } catch (err) {
      console.error("Error fetching property:", err);
      html = replaceMeta(html,
        'Mi Casa Perú - Portal Inmobiliario del Perú',
        'Encuentra casas, departamentos, terrenos y oficinas en venta y alquiler en Lima y todo el Perú.',
        `https://micasaperu.com/properties/${propertyId}`,
        'https://micasaperu.com/og-image.jpg',
        new Date().toISOString());
    }
    return res.send(html);
  }

  // ---- SEARCH / CATEGORY PAGES ----
  if (searchQuery) {
    const decodedQuery = decodeURIComponent(searchQuery).replace(/\+/g, ' ');
    const page = SEARCH_KEYWORD_PAGES.find(p => p.q === searchQuery);
    if (page) {
      const canonicalUrl = `https://micasaperu.com/?search=${searchQuery}`;
      const ogImage = 'https://micasaperu.com/og-image.jpg';
      html = replaceMeta(html, page.title, page.desc, canonicalUrl, ogImage, new Date().toISOString());
    } else {
      html = replaceMeta(html,
        `${decodedQuery} — Propiedades en Venta y Alquiler | Mi Casa Perú`,
        `Encuentra las mejores propiedades en ${decodedQuery}. Casas, departamentos y terrenos en venta y alquiler en ${decodedQuery}, Perú.`,
        `https://micasaperu.com/?search=${searchQuery}`,
        'https://micasaperu.com/og-image.jpg',
        new Date().toISOString());
    }
    return res.send(html);
  }

  if (typeParam) {
    const page = TYPE_SEARCH_PAGES.find(p => p.type === typeParam && p.status === statusParam) ||
      TYPE_SEARCH_PAGES.find(p => p.q === statusParam);
    if (page) {
      const params = new URLSearchParams({ type: typeParam });
      if (statusParam) params.set('status', statusParam);
      const canonicalUrl = `https://micasaperu.com/?${params.toString()}`;
      html = replaceMeta(html, page.title, page.desc, canonicalUrl, 'https://micasaperu.com/og-image.jpg', new Date().toISOString());
    } else {
      html = replaceMeta(html,
        `${typeParam} en ${statusParam === 'FOR_RENT' ? 'Alquiler' : 'Venta'} | Mi Casa Perú`,
        `Encuentra ${typeParam} en ${statusParam === 'FOR_RENT' ? 'alquiler' : 'venta'} en Lima y Perú. La mejor selección de inmuebles en el portal líder del Perú.`,
        `https://micasaperu.com/?type=${encodeURIComponent(typeParam)}&status=${statusParam || 'FOR_SALE'}`,
        'https://micasaperu.com/og-image.jpg',
        new Date().toISOString());
    }
    return res.send(html);
  }

  // ---- STATIC PAGES ----
  let title = 'Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos en Lima y Perú';
  let description = 'El portal inmobiliario líder en el Perú. Encuentra departamentos, casas, terrenos y locales comerciales en venta y alquiler directo de dueños, corredores y constructoras en Lima y todo el Perú.';
  let canonicalUrl = 'https://micasaperu.com';
  let ogImage = 'https://micasaperu.com/og-image.jpg';
  let keywords = 'micasaperu, departamentos en venta lima, alquilar departamento lima, inmuebles en peru, casas en venta peru, dueños directos peru, inmobiliaria peru, bienes raices lima, casas en alquiler lima, departamentos miraflores, casas san isidro, inmuebles surco';

  if (pathRoute === '/pricing') {
    title = 'Planes y Publicidad Inmobiliaria | Mi Casa Perú';
    description = 'Publica tus propiedades en Mi Casa Perú. Contamos con planes ideales para propietarios dueños directos, corredores e inmobiliarias. ¡Vende o alquila rápido en Lima y Perú!';
    keywords = 'publicar propiedad peru, planes inmobiliarios peru, anunciar departamento lima, publicar casa en venta peru, portal inmobiliario peru, corredores inmobiliarios';
    canonicalUrl = 'https://micasaperu.com/pricing';
  } else if (pathRoute === '/complaints') {
    title = 'Libro de Reclamaciones | Mi Casa Perú';
    description = 'Ponemos a tu disposición nuestro Libro de Reclamaciones digital de acuerdo al reglamento de INDECOPI en Perú. Ley 29571 - Código de Protección y Defensa del Consumidor.';
    keywords = 'libro de reclamaciones, indecopi peru, reclamaciones inmobiliaria, defensa del consumidor peru';
    canonicalUrl = 'https://micasaperu.com/complaints';
  }

  html = replaceMeta(html, title, description, canonicalUrl, ogImage, new Date().toISOString(), keywords);

  // Breadcrumb, RealEstateAgent, and ItemList for home
  if (pathRoute === '/') {
    let properties = [];
    try {
      const fetchUrl = `${SUPABASE_URL}/rest/v1/properties?status=neq.DRAFT&order=createdAt.desc&limit=10`;
      const data = await fetchWithCache(fetchUrl);
      if (data) properties = data;
    } catch (e) {
      console.error("Error fetching recent properties for home pre-render:", e);
    }

    const breadcrumb = generateBreadcrumb([
      { name: 'Inicio', url: 'https://micasaperu.com' }
    ]);

    const realEstateAgentSchema = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      'name': 'Mi Casa Perú',
      'image': 'https://micasaperu.com/logo-1774974008886.png',
      'url': 'https://micasaperu.com',
      'telephone': '+51900000000',
      'priceRange': '$$',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Lince',
        'addressLocality': 'Lima',
        'addressRegion': 'Lima',
        'addressCountry': 'PE'
      }
    };

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Propiedades Inmobiliarias Recientes en Perú',
      'numberOfItems': properties.length,
      'itemListElement': properties.map((p, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'url': `https://micasaperu.com/properties/${p.id}`,
        'name': p.title
      }))
    };

    const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(realEstateAgentSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>\n`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);
    
    const ssrHtml = `
      <main>
        <h1>Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos en Lima y Perú</h1>
        <p>El portal inmobiliario líder en el Perú.</p>
        <h2>Propiedades Recientes</h2>
        <ul>
          ${properties.map(p => `
            <li>
              <a href="https://micasaperu.com/properties/${p.id}">${escapeHtml(p.title)}</a>
            </li>
          `).join('')}
        </ul>
      </main>
    `;
    html = injectSsrDom(html, ssrHtml);
  }

  return res.send(html);
};
