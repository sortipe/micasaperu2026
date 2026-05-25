#!/bin/bash
set -euo pipefail

echo "============================================"
echo "  Smoke Test - Verificación de Build"
echo "============================================"
echo ""

DIST_DIR="${DIST_DIR:-./dist}"

if [ ! -d "$DIST_DIR" ]; then
  echo "❌ ERROR: El directorio $DIST_DIR no existe"
  exit 1
fi
echo "✅ Directorio $DIST_DIR existe"

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "❌ ERROR: index.html no encontrado en $DIST_DIR"
  exit 1
fi
echo "✅ index.html presente"

JS_FILES=$(find "$DIST_DIR/assets" -name '*.js' 2>/dev/null | wc -l)
if [ "$JS_FILES" -eq 0 ]; then
  echo "❌ ERROR: No se encontraron archivos JS en dist/assets/"
  exit 1
fi
echo "✅ Archivos JS encontrados: $JS_FILES"

CSS_FILES=$(find "$DIST_DIR/assets" -name '*.css' 2>/dev/null | wc -l)
if [ "$CSS_FILES" -eq 0 ]; then
  echo "❌ ERROR: No se encontraron archivos CSS en dist/assets/"
  exit 1
fi
echo "✅ Archivos CSS encontrados: $CSS_FILES"

TOTAL_SIZE=$(du -sh "$DIST_DIR" | cut -f1)
echo "✅ Tamaño total del build: $TOTAL_SIZE"

echo ""
echo "Validando referencias en index.html..."
if grep -q 'type="module"' "$DIST_DIR/index.html"; then
  echo "✅ index.html es un módulo ES (type=module presente)"
else
  echo "⚠️  Advertencia: index.html no tiene type=module"
fi

if grep -q '/assets/' "$DIST_DIR/index.html"; then
  echo "✅ index.html referencia correctamente los assets"
else
  echo "⚠️  Advertencia: No se encontraron referencias a /assets/ en index.html"
fi

echo ""
echo "============================================"
echo "  ✅ Smoke Test PASADO - Build válido"
echo "============================================"
