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

export default async (req, res) => {
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
      // Validate UUID format
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)) {
        propertyId = null;
      }
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

  // Breadcrumb for home
  if (pathRoute === '/') {
    const breadcrumb = generateBreadcrumb([
      { name: 'Inicio', url: 'https://micasaperu.com' }
    ]);
    html = html.replace('</head>', `\n<script type="application/ld+json">${JSON.stringify(breadcrumb)}\n</script>\n</head>`);
  }

  return res.send(html);
};
