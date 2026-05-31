import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[seo.js] FATAL: Missing Supabase env vars');
}

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
  const isCrawler = /googlebot|bingbot|yandexbot|baiduspider|lighthouse|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|slackbot|pinterest|slurp|duckduckbot|applebot|whatsapp/i.test(ua);
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function optimizeImageUrl(url, options = {}) {
  if (!url) return url;
  const { width, quality = 75 } = options;
  if (url.includes('images.unsplash.com')) {
    const sep = url.includes('?') ? '&' : '?';
    const params = [];
    if (width) params.push(`w=${width}`);
    params.push(`q=${quality}`);
    if (!url.includes('auto=format')) params.push('auto=format');
    if (!url.includes('fm=')) params.push('fm=webp');
    return url + sep + params.join('&');
  }
  if (url.includes('/storage/v1/object/public/')) {
    const sep = url.includes('?') ? '&' : '?';
    const params = [];
    if (width) params.push(`width=${width}`);
    params.push('format=webp');
    params.push('resize=cover');
    return url + sep + params.join('&');
  }
  return url;
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
  const wrappedContent = `<div id="seo-ssr-content" class="ssr-fallback-content">${ssrContent}</div>`;
  return html.replace('<div id="root">', `<div id="root">\n${wrappedContent}`);
}

function injectHreflang(html) {
  const hreflang = `
    <link rel="alternate" href="https://micasaperu.com" hreflang="x-default">
    <link rel="alternate" href="https://micasaperu.com" hreflang="es-PE">`;
  return html.replace('</head>', `${hreflang}\n</head>`);
}

function replaceMeta(html, title, description, canonical, ogImage, lastmod, keywords, noindex) {
  const today = new Date().toISOString().split('T')[0];
  const lm = lastmod ? lastmod.split('T')[0] : today;
  const robotsContent = noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+[^>]*name=["']?description["']?[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);

  const canonicalTag = `<link rel="canonical" href="${escapeHtml(canonical)}">`;
  html = html.replace(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/i, canonicalTag);

  const metaTags = `
    <meta name="robots" content="${robotsContent}">
    <meta name="googlebot" content="${robotsContent}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(ogImage)}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${escapeHtml(canonical)}">
    <meta property="og:type" content="${noindex ? 'website' : 'website'}">
    <meta property="og:site_name" content="Mi Casa Perú">
    <meta property="og:locale" content="es_PE">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(ogImage)}">
    <meta name="twitter:site" content="@micasaperu">
    <meta name="last-modified" content="${lm}">
    <meta http-equiv="last-modified" content="${lm}">
    <meta name="revised" content="${lm}">`;
  html = html.replace('</head>', `${metaTags}\n</head>`);
  return html;
}

function applySecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).host : 'uxdnhmkoiqqeiaoxeedw.supabase.co';
  res.setHeader('Content-Security-Policy',
    `default-src 'self'; ` +
    `script-src 'self' https://challenges.cloudflare.com https://sdk.mercadopago.com; ` +
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://api.mercadopago.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org; ` +
    `img-src 'self' data: blob: https://${supabaseHost} https://images.unsplash.com https://ui-avatars.com https://*.basemaps.cartocdn.com https://*.google.com https://*.googleapis.com https://*.tile.openstreetmap.org; ` +
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ` +
    `font-src 'self' data: https://fonts.gstatic.com; ` +
    `frame-src 'self' https://challenges.cloudflare.com https://www.mercadopago.com; ` +
    `object-src 'none'; upgrade-insecure-requests; frame-ancestors 'none'; form-action 'self'; base-uri 'self';`
  );
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), interest-cohort=(), accelerometer=(), battery=(), display-capture=(), usb=()'
  );
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-Robots-Tag', 'index, follow');
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
    'tarapoto': 'Tarapoto',
    'ica': 'Ica',
    'piura': 'Piura'
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

  if (!district || (!type && !status)) return null;

  if (!type) { type = 'Departamento'; rawType = 'departamentos'; }
  if (!status) { status = 'FOR_SALE'; rawStatus = 'venta'; }

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

  return { type, status, district, amenity, slugs: { type: rawType, status: rawStatus, district: districtSlug, amenity: amenitySlug } };
}

async function fetchWithCache(url) {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && (now - cached.timestamp) < CACHE_TTL * 1000) return cached.data;
  if (pendingFetches.has(url)) return pendingFetches.get(url);
  const promise = (async () => {
    try {
      const response = await fetch(url, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (!response.ok) return null;
      const data = await response.json();
      cache.set(url, { data, timestamp: Date.now() });
      return data;
    } finally { pendingFetches.delete(url); }
  })();
  pendingFetches.set(url, promise);
  return promise;
}

export default async (req, res) => {
  applySecurityHeaders(res);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).send('Internal Server Error: Missing configuration.');
  }

  if (!checkRateLimit(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).send('Demasiadas solicitudes.');
  }

  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));

  let indexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(process.cwd(), 'index.html');
  }
  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    return res.status(500).send("Internal Server Error");
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');

  html = injectHreflang(html);

  const url = new URL(req.url, 'https://micasaperu.com');
  const pathRoute = url.pathname;

  // ---- PROGRAMMATIC SEO ROUTING ----
  const progRoute = parseProgrammaticUrl(pathRoute);
  if (progRoute) {
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
        properties = progRoute.amenity ? data.filter(p => p.features && p.features.includes(progRoute.amenity)) : data;
      }
    } catch (e) {
      console.error("Error fetching programmatic properties:", e);
    }

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

    const breadcrumb = generateBreadcrumb([
      { name: 'Inicio', url: 'https://micasaperu.com' },
      { name: `${typeLabelPlural} ${operationLabel}`, url: `https://micasaperu.com/?type=${encodeURIComponent(progRoute.type)}&status=${progRoute.status}` },
      { name: `${progRoute.district}`, url: canonicalUrl }
    ]);

    // WebSite schema
    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Mi Casa Perú',
      'url': 'https://micasaperu.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://micasaperu.com/?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    };

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

    const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(websiteSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);

    const ssrHtml = `
      <header>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </header>
      <main>
        <ul>
          ${properties.slice(0, 20).map(p => `
            <li>
              <article>
                <h2><a href="https://micasaperu.com/properties/${p.id}">${escapeHtml(p.title)}</a></h2>
                ${p.featuredImage ? `<img src="${escapeHtml(optimizeImageUrl(p.featuredImage, { width: 400 }))}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="300" />` : ''}
                <p>${escapeHtml((p.description || '').substring(0, 200))}</p>
                <p>Precio: ${p.priceUSD ? '$' + p.priceUSD.toLocaleString('en-US') : ''}${p.pricePEN ? ' S/' + p.pricePEN.toLocaleString('es-PE') : ''}</p>
                <p>Ubicación: ${escapeHtml(p.district || '')}, ${escapeHtml(p.department || '')}</p>
                <p>${p.bedrooms || 0} dormitorios | ${p.bathrooms || 0} baños | ${p.builtArea || p.constructionArea || p.terrainArea || 0} m²</p>
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
  const staticPatterns = ['/pricing', '/complaints', '/search', '/login', '/cart'];
  const isLikelyPage = !pathRoute.includes('.') || pathRoute.endsWith('/');
  if (isLikelyPage && !staticPatterns.includes(pathRoute) &&
      !pathRoute.startsWith('/properties/') && !pathRoute.startsWith('/propiedades/') &&
      !pathRoute.startsWith('/propiedad/') && pathRoute !== '/' && pathRoute !== '') {
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
  if (propertyId) {
    propertyId = propertyId.trim();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)) {
      propertyId = null;
    }
  }

  const searchQuery = url.searchParams.get('search');
  const typeParam = url.searchParams.get('type');
  const statusParam = url.searchParams.get('status');

  // ---- PROPERTY DETAIL PAGE ----
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

        const propertyTypeSchema = property.type === 'Departamento' ? 'https://schema.org/Apartment' :
          property.type === 'Casa' ? 'https://schema.org/SingleFamilyResidence' :
          property.type === 'Terreno' ? 'https://schema.org/Land' :
          property.type === 'Oficina' || property.type === 'Local Comercial' ? 'https://schema.org/Office' :
          'https://schema.org/House';

        const realEstateSchema = {
          '@context': 'https://schema.org',
          '@type': 'RealEstateListing',
          'name': property.title,
          'description': property.description,
          'image': property.gallery && property.gallery.length > 0 ? property.gallery : [property.featuredImage],
          'url': canonicalUrl,
          'datePosted': property.published_at || property.publishedAt || property.created_at || property.createdAt || new Date().toISOString().split('T')[0],
          ...(property.status === 'FOR_RENT' ? { 'leaseLength': property.deliveryMonth && property.deliveryYear ? `Hasta ${property.deliveryMonth} ${property.deliveryYear}` : 'Mensual' } : {}),
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': property.address || '',
            'addressLocality': property.district || '',
            'addressRegion': property.department || '',
            'addressCountry': 'PE'
          },
          ...(property.lat && property.lng ? { 'geo': { '@type': 'GeoCoordinates', 'latitude': property.lat, 'longitude': property.lng } } : {}),
          'numberOfBedrooms': property.bedrooms || 0,
          'numberOfBathroomsTotal': property.bathrooms || 0,
          'floorSize': { '@type': 'QuantitativeValue', 'value': property.constructionArea || property.terrainArea || 0, 'unitCode': 'MTK' },
          'propertyType': propertyTypeSchema,
          'offers': {
            '@type': 'Offer',
            'priceCurrency': property.priceUSD ? 'USD' : 'PEN',
            'price': property.priceUSD || property.pricePEN || 0,
            'availability': 'https://schema.org/InStock',
            'url': canonicalUrl
          },
          'seller': { '@type': 'RealEstateAgent', 'name': property.agentName || 'Mi Casa Perú', 'url': 'https://micasaperu.com' }
        };

        const breadcrumb = generateBreadcrumb([
          { name: 'Inicio', url: 'https://micasaperu.com' },
          { name: `${property.type} en ${operationType}`, url: `https://micasaperu.com/?type=${encodeURIComponent(property.type)}&status=${property.status}` },
          { name: property.title, url: canonicalUrl }
        ]);

        const websiteSchema = {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': 'Mi Casa Perú',
          'url': 'https://micasaperu.com',
          'potentialAction': { '@type': 'SearchAction', 'target': { '@type': 'EntryPoint', 'urlTemplate': 'https://micasaperu.com/?search={search_term_string}' }, 'query-input': 'required name=search_term_string' }
        };

        const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(realEstateSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(websiteSchema, null, 2)}\n</script>\n`;
        html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, schemaScript);

        function optGallery(imgUrl, idx) {
          const optUrl = optimizeImageUrl(imgUrl, { width: 800 });
          return `<img src="${escapeHtml(optUrl)}" alt="${escapeHtml(property.title)} - Foto ${idx + 1}" loading="lazy" width="800" height="600" />`;
        }
        const galleryHtml = property.gallery && property.gallery.length > 0
          ? property.gallery.slice(0, 5).map((img, i) => optGallery(img, i)).join('')
          : (property.featuredImage ? `<img src="${escapeHtml(optimizeImageUrl(property.featuredImage, { width: 800 }))}" alt="${escapeHtml(property.title)}" width="800" height="600" />` : '');

        const ssrHtml = `
          <article>
            <header>
              <h1>${escapeHtml(property.title)}</h1>
              <p>Precio: ${escapeHtml(priceString)}</p>
              <p>${operationType} | ${escapeHtml(property.district)}, ${escapeHtml(property.department)}</p>
            </header>
            <section>
              ${galleryHtml}
              <p>${escapeHtml((property.description || '').substring(0, 500))}</p>
              <ul>
                <li>Dormitorios: ${property.bedrooms || 0}</li>
                <li>Baños: ${property.bathrooms || 0}</li>
                <li>Estacionamiento: ${property.parking || 0}</li>
                <li>Área construida: ${property.builtArea || property.constructionArea || 0} m²</li>
                <li>Área de terreno: ${property.terrainArea || 0} m²</li>
                <li>Ubicación: ${escapeHtml(property.district || '')}, ${escapeHtml(property.department || '')}</li>
                <li>Dirección: ${escapeHtml(property.address || '')}</li>
                <li>Año de construcción: ${property.yearBuilt || 'No especificado'}</li>
              </ul>
              ${property.lat && property.lng ? `<p>Coordenadas: ${property.lat}, ${property.lng}</p>` : ''}
            </section>
          </article>
        `;
        html = injectSsrDom(html, ssrHtml);
      } else {
        html = replaceMeta(html,
          'Inmueble no encontrado | Mi Casa Perú',
          'El inmueble que buscas no está disponible. Explora otras propiedades en venta y alquiler en Lima y Perú.',
          `https://micasaperu.com/properties/${propertyId}`,
          'https://micasaperu.com/og-image.jpg',
          new Date().toISOString(), null, true);
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
    const canonicalUrl = `https://micasaperu.com/?search=${searchQuery}`;
    const ogImage = 'https://micasaperu.com/og-image.jpg';
    const title = `${decodedQuery} — Propiedades en Venta y Alquiler | Mi Casa Perú`;
    const description = `Encuentra las mejores propiedades en ${decodedQuery}. Casas, departamentos y terrenos en venta y alquiler en ${decodedQuery}, Perú.`;
    html = replaceMeta(html, title, description, canonicalUrl, ogImage, new Date().toISOString(), `${decodedQuery}, propiedades ${decodedQuery}, inmuebles ${decodedQuery}`);
    return res.send(html);
  }

  if (typeParam) {
    const typeInfo = { type: typeParam, status: statusParam || 'FOR_SALE' };
    const operationLabel = typeInfo.status === 'FOR_RENT' ? 'Alquiler' : 'Venta';
    const title = `${typeParam} en ${operationLabel} | Mi Casa Perú`;
    const description = `Encuentra ${typeParam.toLowerCase()} en ${operationLabel.toLowerCase()} en Lima y Perú. La mejor selección de inmuebles en el portal líder del Perú.`;
    const canonicalUrl = `https://micasaperu.com/?type=${encodeURIComponent(typeParam)}&status=${typeInfo.status}`;
    html = replaceMeta(html, title, description, canonicalUrl, 'https://micasaperu.com/og-image.jpg', new Date().toISOString(), `${typeParam} ${operationLabel.toLowerCase()}, ${typeParam.toLowerCase()}`);
    return res.send(html);
  }

  // ---- STATIC PAGES ----
  let title = 'Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos en Lima y Perú';
  let description = 'El portal inmobiliario líder en el Perú. Encuentra departamentos, casas, terrenos y locales comerciales en venta y alquiler directo de dueños, corredores y constructoras en Lima y todo el Perú.';
  let canonicalUrl = 'https://micasaperu.com';
  let ogImage = 'https://micasaperu.com/og-image.jpg';
  let keywords = 'micasaperu, departamentos en venta lima, alquilar departamento lima, inmuebles en peru, casas en venta peru, dueños directos peru, inmobiliaria peru, bienes raices lima';

  if (pathRoute === '/pricing') {
    title = 'Planes y Publicidad Inmobiliaria | Publica tu Propiedad en Mi Casa Perú';
    description = 'Publica tus propiedades en Mi Casa Perú. Planes desde S/100 para dueños directos, corredores e inmobiliarias. Destaca tu anuncio, llega a más compradores y vende o alquila más rápido en Lima y Perú.';
    keywords = 'publicar propiedad peru, planes inmobiliarios peru, anunciar departamento lima, publicar casa en venta peru, portal inmobiliario peru, precios publicacion inmobiliaria, cuanto cuesta publicar una propiedad peru';
    canonicalUrl = 'https://micasaperu.com/pricing';
  } else if (pathRoute === '/complaints') {
    title = 'Libro de Reclamaciones | Mi Casa Perú - INDECOPI';
    description = 'Ponemos a tu disposición nuestro Libro de Reclamaciones digital de acuerdo al reglamento de INDECOPI en Perú. Ley 29571 - Código de Protección y Defensa del Consumidor. Presenta tu reclamo o queja de manera formal.';
    keywords = 'libro de reclamaciones, indecopi peru, reclamaciones inmobiliaria, defensa del consumidor peru, ley 29571, reclamo formal peru';
    canonicalUrl = 'https://micasaperu.com/complaints';
  } else if (pathRoute === '/search') {
    title = 'Buscador de Inmuebles - Casas, Departamentos y Terrenos | Mi Casa Perú';
    description = 'Busca y encuentra las mejores propiedades en venta y alquiler en todo el Perú. Filtra por distrito, precio, tipo de inmueble, dormitorios, baños y más. El buscador inmobiliario más completo del Perú.';
    keywords = 'buscador inmuebles peru, encontrar casa, buscar departamento, propiedades lima, filtros busqueda inmobiliaria';
    canonicalUrl = 'https://micasaperu.com/search';
  }

  html = replaceMeta(html, title, description, canonicalUrl, ogImage, new Date().toISOString(), keywords);

  // ---- HOME PAGE with schemas ----
  if (pathRoute === '/') {
    let properties = [];
    try {
      const fetchUrl = `${SUPABASE_URL}/rest/v1/properties?status=neq.DRAFT&order=createdAt.desc&limit=10`;
      const data = await fetchWithCache(fetchUrl);
      if (data) properties = data;
    } catch (e) {
      console.error("Error fetching properties for home:", e);
    }

    const breadcrumb = generateBreadcrumb([{ name: 'Inicio', url: 'https://micasaperu.com' }]);

    const websiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Mi Casa Perú',
      'url': 'https://micasaperu.com',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': { '@type': 'EntryPoint', 'urlTemplate': 'https://micasaperu.com/?search={search_term_string}' },
        'query-input': 'required name=search_term_string'
      }
    };

    const organizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      'name': 'Mi Casa Perú',
      'image': 'https://micasaperu.com/og-image.jpg',
      'url': 'https://micasaperu.com',
      'telephone': '+51900000000',
      'priceRange': '$$',
      'description': 'Portal inmobiliario líder en Perú para comprar, vender y alquilar propiedades.',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Av. Benavides 768, Int. 1303',
        'addressLocality': 'Miraflores',
        'addressRegion': 'Lima',
        'addressCountry': 'PE'
      },
      'sameAs': ['https://facebook.com/micasaperu', 'https://instagram.com/micasaperu', 'https://linkedin.com/company/micasaperu'],
      'contactPoint': {
        '@type': 'ContactPoint',
        'contactType': 'customer service',
        'email': 'hola@micasaperu.com',
        'availableLanguage': ['Spanish', 'English']
      }
    };

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'Propiedades Inmobiliarias Recientes en Perú',
      'numberOfItems': properties.length,
      'itemListElement': properties.slice(0, 10).map((p, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'url': `https://micasaperu.com/properties/${p.id}`,
        'name': p.title
      }))
    };

    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      'name': 'Mi Casa Perú',
      'image': 'https://micasaperu.com/og-image.jpg',
      'address': { '@type': 'PostalAddress', 'addressLocality': 'Miraflores, Lima', 'addressCountry': 'PE' },
      'telephone': '+51900000000',
      'openingHours': 'Mo-Fr 09:00-18:00'
    };

    const schemaScript = `\n<script type="application/ld+json">\n${JSON.stringify(organizationSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(localBusinessSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(websiteSchema, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(breadcrumb, null, 2)}\n</script>\n<script type="application/ld+json">\n${JSON.stringify(itemListSchema, null, 2)}\n</script>\n`;
    html = html.replace('</head>', `${schemaScript}\n</head>`);

    const ssrHtml = `
      <main>
        <h1>Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos en Lima y Perú</h1>
        <p>El portal inmobiliario líder en el Perú. Explora miles de propiedades en venta y alquiler directo de dueños, corredores y constructoras.</p>
        <h2>Propiedades Recientes en Perú</h2>
        <ul>
          ${properties.slice(0, 10).map(p => `
            <li>
              ${p.featuredImage ? `<img src="${escapeHtml(optimizeImageUrl(p.featuredImage, { width: 400 }))}" alt="${escapeHtml(p.title)}" loading="lazy" width="400" height="300" />` : ''}
              <a href="https://micasaperu.com/properties/${p.id}"><strong>${escapeHtml(p.title)}</strong></a>
              <p>${escapeHtml(p.district || '')} - ${p.priceUSD ? '$' + p.priceUSD.toLocaleString('en-US') : ''}${p.pricePEN ? ' S/' + p.pricePEN.toLocaleString('es-PE') : ''}</p>
            </li>
          `).join('')}
        </ul>
        <h2>Buscar por Tipo de Inmueble</h2>
        <ul>
          <li><a href="https://micasaperu.com/?type=Departamento&status=FOR_SALE">Departamentos en Venta</a></li>
          <li><a href="https://micasaperu.com/?type=Departamento&status=FOR_RENT">Departamentos en Alquiler</a></li>
          <li><a href="https://micasaperu.com/?type=Casa&status=FOR_SALE">Casas en Venta</a></li>
          <li><a href="https://micasaperu.com/?type=Casa&status=FOR_RENT">Casas en Alquiler</a></li>
          <li><a href="https://micasaperu.com/?type=Terreno&status=FOR_SALE">Terrenos en Venta</a></li>
          <li><a href="https://micasaperu.com/departamentos-en-venta-en-miraflores/">Departamentos en Miraflores</a></li>
          <li><a href="https://micasaperu.com/departamentos-en-venta-en-san-isidro/">Departamentos en San Isidro</a></li>
          <li><a href="https://micasaperu.com/departamentos-en-alquiler-en-surco/">Departamentos en Surco</a></li>
          <li><a href="https://micasaperu.com/casas-en-venta-en-la-molina/">Casas en La Molina</a></li>
        </ul>
      </main>
    `;
    html = injectSsrDom(html, ssrHtml);
  }

  return res.send(html);
};
