const fs = require('fs');
const path = require('path');

// Keep environment variables local or use defaults
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://uxdnhmkoiqqeiaoxeedw.supabase.co";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZG5obWtvaXFxZWlhb3hlZWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTI2MjEsImV4cCI6MjA8NDI2ODYyMX0.Wq509Vq5HwR120QuH_BbJHNKzJj31Vuji5lltm7b5jE";

module.exports = async (req, res) => {
  // Read index.html from dist (production output) first, fallback to Process Working Directory
  let indexPath = path.join(process.cwd(), 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    indexPath = path.join(process.cwd(), 'index.html');
  }
  
  let html = '';
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    console.error("Error reading index.html:", err);
    return res.status(500).send("Internal Server Error: index.html not found.");
  }

  // Detect property ID from query parameters or pathname
  let propertyId = req.query.propertyId || req.query.id;
  
  const pathRoute = req.url.split('?')[0];
  if (!propertyId) {
    const pathParts = pathRoute.split('/');
    if ((pathParts[1] === 'properties' || pathParts[1] === 'propiedades' || pathParts[1] === 'propiedad') && pathParts[2]) {
      propertyId = pathParts[2];
    }
  }
  
  if (propertyId) {
    try {
      // Fetch property details directly from Supabase REST API
      const fetchUrl = `${SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}&select=*`;
      const response = await fetch(fetchUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
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
          const keywords = `${property.type} en ${property.district}, ${property.type} ${operationType} ${property.department}, inmobiliaria ${property.district}, ${property.title}`;
          const canonicalUrl = `https://micasaperu.com/properties/${property.id}`;
          const ogImage = property.featuredImage || "https://micasaperu.com/favicon.ico";

          // Dynamic Real Estate Listing Schema
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
              'geo': {
                '@type': 'GeoCoordinates',
                'latitude': property.lat,
                'longitude': property.lng
              }
            } : {}),
            'numberOfRooms': property.bedrooms || 0,
            'numberOfBathroomsTotal': property.bathrooms || 0,
            'floorSize': {
              '@type': 'QuantitativeValue',
              'value': property.constructionArea || property.terrainArea || 0,
              'unitCode': 'MTK'
            },
            'offers': {
              '@type': 'Offer',
              'priceCurrency': property.priceUSD ? 'USD' : 'PEN',
              'price': property.priceUSD || property.pricePEN || 0,
              'availability': 'https://schema.org/InStock',
              'url': canonicalUrl
            }
          };

          // Perform robust regex replacements independent of attribute order or quotes
          html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
          html = html.replace(/<meta\s+[^>]*name=["']?description["']?[^>]*>/i, `<meta name="description" content="${description}">`);
          html = html.replace(/<meta\s+[^>]*name=["']?keywords["']?[^>]*>/i, `<meta name="keywords" content="${keywords}">`);
          html = html.replace(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}">`);

          // Open Graph and Twitter Card tags
          const ogTags = `
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImage}">
`;
          html = html.replace('</head>', `${ogTags}\n</head>`);

          // Replace default Schema structured data script block
          const schemaScript = `
    <script type="application/ld+json">
    ${JSON.stringify(realEstateSchema, null, 2)}
    </script>
`;
          html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/i, schemaScript);
        }
      }
    } catch (err) {
      console.error("Error querying Supabase in Serverless function:", err);
    }
  } else {
    // Intercept path routes (e.g. /pricing) for proper title metadata
    let title = 'Mi Casa Perú - Encuentra Casas, Departamentos y Terrenos';
    let description = 'El portal inmobiliario líder en el Perú. Encuentra departamentos, casas, terrenos y locales comerciales en venta y alquiler directo de dueños, corredores y constructoras.';
    
    if (pathRoute === '/pricing') {
      title = 'Planes y Publicidad Inmobiliaria | Mi Casa Perú';
      description = 'Publica tus propiedades en Mi Casa Perú. Contamos con planes ideales para propietarios dueños directos, corredores e inmobiliarias. ¡Vende o alquila rápido!';
    } else if (pathRoute === '/complaints') {
      title = 'Libro de Reclamaciones | Mi Casa Perú';
      description = 'Ponemos a tu disposición nuestro Libro de Reclamaciones digital de acuerdo al reglamento de INDECOPI en Perú.';
    }

    const canonicalUrl = `https://micasaperu.com${pathRoute === '/' ? '' : pathRoute}`;

    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
    html = html.replace(/<meta\s+[^>]*name=["']?description["']?[^>]*>/i, `<meta name="description" content="${description}">`);
    html = html.replace(/<link\s+[^>]*rel=["']?canonical["']?[^>]*>/i, `<link rel="canonical" href="${canonicalUrl}">`);
  }

  // Send the final compiled index.html
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(html);
};
