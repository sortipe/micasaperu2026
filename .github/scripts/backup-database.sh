#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/supabase-db-${TIMESTAMP}.dump"
LOG_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.log"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando backup de base de datos..." | tee -a "$LOG_FILE"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "ERROR: SUPABASE_DB_URL no está configurada" | tee -a "$LOG_FILE"
  exit 1
fi

pg_dump \
  --dbname="$SUPABASE_DB_URL" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_FILE" 2>&1 | tee -a "$LOG_FILE"

if [ -f "$BACKUP_FILE" ]; then
  FILE_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completado: $BACKUP_FILE (${FILE_SIZE} bytes)" | tee -a "$LOG_FILE"

  gzip -9 "$BACKUP_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup comprimido: ${BACKUP_FILE}.gz" | tee -a "$LOG_FILE"
else
  echo "ERROR: No se generó el archivo de backup" | tee -a "$LOG_FILE"
  exit 1
fi
