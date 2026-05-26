import { parseProgrammaticUrl } from '../lib/seoUtils.ts';

console.log("=== INICIANDO PRUEBAS AUTOMATIZADAS DE SEO PROGRAMÁTICO ===");

const testUrls = [
  '/departamentos-en-venta-en-miraflores/',
  '/casas-en-surco-con-jardin/',
  '/alquileres-en-san-isidro-pet-friendly/',
  '/departamentos-en-venta-en-miraflores-con-balcon/',
  '/casas-en-venta-en-la-molina/',
  '/terrenos-en-venta-en-tarapoto/',
  '/habitaciones-en-alquiler-en-lince-con-seguridad/'
];

testUrls.forEach(url => {
  console.log(`\nProbando URL: "${url}"`);
  const result = parseProgrammaticUrl(url);
  if (result) {
    console.log("🟢 Éxito al parsear:");
    console.log(`  - Tipo: ${result.type}`);
    console.log(`  - Operación: ${result.status}`);
    console.log(`  - Distrito: ${result.district}`);
    console.log(`  - Amenity: ${result.amenity || 'Ninguno'}`);
  } else {
    console.log("🔴 Error al parsear URL");
  }
});

console.log("\n=== PRUEBAS COMPLETADAS ===");
