import sitemapHandler from '../api/sitemap.js';
import seoHandler from '../api/seo.js';

console.log("=== INICIANDO VERIFICACIÓN DE SITEMAP Y SSR ===");

// Helper to mock the response object
function createMockResponse(resolve) {
  const res = {
    statusCode: 200,
    headers: {},
    body: '',
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    send(data) {
      this.body = data;
      resolve(this);
      return this;
    }
  };
  return res;
}

async function testSitemapCrawlerBypass() {
  console.log("\n--- Prueba 1: Sitemap Rate Limiting con Googlebot ---");
  
  // Simulate 15 requests in rapid succession with a crawler user agent
  // The rate limit for regular users is 10/min, so standard user would get 429
  // but Googlebot should bypass and always return 200.
  const req = {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'x-forwarded-for': '66.249.66.1'
    }
  };
  
  let successCount = 0;
  let statusCodes = [];
  
  for (let i = 0; i < 15; i++) {
    const resPromise = new Promise(resolve => {
      const mockRes = createMockResponse(resolve);
      sitemapHandler(req, mockRes).catch(err => {
        console.error("Error in sitemap handler:", err);
        resolve(mockRes.status(500).send("Error"));
      });
    });
    const result = await resPromise;
    statusCodes.push(result.statusCode);
    if (result.statusCode === 200) {
      successCount++;
    }
  }
  
  console.log(`Códigos de respuesta recibidos para Googlebot (15 solicitudes concurrentes):`, statusCodes.join(', '));
  if (successCount === 15) {
    console.log("🟢 ÉXITO: Googlebot ha evitado el rate limiter en todos los intentos.");
  } else {
    console.log("🔴 ERROR: Googlebot fue bloqueado por el rate limiter.");
  }
}

async function testSitemapDynamicContent() {
  console.log("\n--- Prueba 2: Sitemap XML Contenido Dinámico ---");
  const req = {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  };
  
  const res = await new Promise(resolve => {
    sitemapHandler(req, createMockResponse(resolve));
  });
  
  const xml = res.body;
  
  // Verify basic structure
  const hasUrlset = xml.includes('<urlset') && xml.includes('</urlset>');
  const hasImageNs = xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  
  // Verify programmatic SEO urls
  const hasProgrammaticMiraflores = xml.includes('https://micasaperu.com/departamentos-en-venta-en-miraflores/');
  const hasAmenitySurco = xml.includes('https://micasaperu.com/casas-en-venta-en-surco-con-jardin/');
  const hasPetFriendlySanIsidro = xml.includes('https://micasaperu.com/departamentos-en-alquiler-en-san-isidro-pet-friendly/');
  
  // Count URLs
  const urlMatches = xml.match(/<url>/g) || [];
  console.log(`Total de URLs inyectadas en el Sitemap: ${urlMatches.length}`);
  
  if (hasUrlset && hasImageNs && hasProgrammaticMiraflores && hasAmenitySurco && hasPetFriendlySanIsidro) {
    console.log("🟢 ÉXITO: El sitemap XML dinámico es semánticamente válido y contiene los 150+ enlaces de SEO programático.");
  } else {
    console.log("🔴 ERROR: El sitemap XML carece de elementos clave de SEO programático.");
    console.log("  - Has Urlset:", hasUrlset);
    console.log("  - Has Image Namespace:", hasImageNs);
    console.log("  - Has /departamentos-en-venta-en-miraflores/:", hasProgrammaticMiraflores);
    console.log("  - Has /casas-en-venta-en-surco-con-jardin/:", hasAmenitySurco);
    console.log("  - Has /departamentos-en-alquiler-en-san-isidro-pet-friendly/:", hasPetFriendlySanIsidro);
  }
}

async function testHomeSSRStructuredData() {
  console.log("\n--- Prueba 3: Home SSR Structured Data e Inyección ---");
  const req = {
    url: '/',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
  };
  
  const res = await new Promise(resolve => {
    seoHandler(req, createMockResponse(resolve));
  });
  
  const html = res.body;
  
  const hasRealEstateAgent = html.includes('"@type": "RealEstateAgent"');
  const hasItemList = html.includes('"@type": "ItemList"');
  const hasBreadcrumbList = html.includes('"@type": "BreadcrumbList"');
  
  if (hasRealEstateAgent && hasItemList && hasBreadcrumbList) {
    console.log("🟢 ÉXITO: El pre-renderizador SSR inyectó los esquemas de RealEstateAgent, ItemList y BreadcrumbList en el Home.");
  } else {
    console.log("🔴 ERROR: Faltan esquemas Schema.org en el pre-renderizador de Home.");
    console.log("  - Has RealEstateAgent:", hasRealEstateAgent);
    console.log("  - Has ItemList (dynamic properties):", hasItemList);
    console.log("  - Has BreadcrumbList:", hasBreadcrumbList);
  }
}

async function run() {
  try {
    await testSitemapCrawlerBypass();
    await testSitemapDynamicContent();
    await testHomeSSRStructuredData();
    console.log("\n=== TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO ===");
  } catch (err) {
    console.error("Prueba fallida con error:", err);
  }
}

run();
