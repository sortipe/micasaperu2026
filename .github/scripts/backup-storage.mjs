import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const STORAGE_DIR = join(BACKUP_DIR, `storage-${TIMESTAMP}`);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
  process.exit(1);
}

mkdirSync(STORAGE_DIR, { recursive: true });

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
};

async function listBuckets() {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, { headers });
  if (!res.ok) throw new Error(`Error listing buckets: ${res.statusText}`);
  return res.json();
}

async function listFiles(bucketId, prefix = '') {
  const body = { prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } };
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucketId}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Error listing files in ${bucketId}/${prefix}: ${res.statusText}`);
  return res.json();
}

async function downloadFile(bucketId, filePath, destPath) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketId}/${filePath}`, { headers });
  if (!res.ok) throw new Error(`Error downloading ${bucketId}/${filePath}: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(destPath, buffer);
}

async function backupBucket(bucketId) {
  console.log(`\n📦 Procesando bucket: ${bucketId}`);
  const bucketDir = join(STORAGE_DIR, bucketId);
  mkdirSync(bucketDir, { recursive: true });

  let allFiles = [];
  let offset = 0;
  const limit = 200;

  while (true) {
    const body = { prefix: '', limit, offset, sortBy: { column: 'name', order: 'asc' } };
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucketId}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) break;
    const files = await res.json();
    if (!files.length) break;
    allFiles = allFiles.concat(files);
    offset += limit;
  }

  console.log(`   ${allFiles.length} archivos encontrados`);

  let downloaded = 0;
  for (const file of allFiles) {
    if (file.id === undefined) continue;
    const filePath = file.name;
    const destPath = join(bucketDir, filePath);
    mkdirSync(dirname(destPath), { recursive: true });
    try {
      await downloadFile(bucketId, filePath, destPath);
      downloaded++;
      if (downloaded % 50 === 0) process.stdout.write(`   ${downloaded}/${allFiles.length}...\n`);
    } catch (err) {
      console.error(`   ❌ Error descargando ${filePath}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${downloaded} archivos descargados en ${bucketDir}`);
  return { bucket: bucketId, total: allFiles.length, downloaded };
}

async function main() {
  console.log('========================================');
  console.log('  Backup de Supabase Storage');
  console.log(`  Inicio: ${new Date().toISOString()}`);
  console.log(`  Destino: ${STORAGE_DIR}`);
  console.log('========================================\n');

  const buckets = await listBuckets();
  console.log(`Buckets encontrados: ${buckets.map(b => b.name).join(', ')}`);

  const results = [];
  for (const bucket of buckets) {
    if (bucket.name === undefined) continue;
    const result = await backupBucket(bucket.name);
    results.push(result);
  }

  const summary = {
    timestamp: new Date().toISOString(),
    buckets: results,
    totalFiles: results.reduce((sum, r) => sum + r.total, 0),
    totalDownloaded: results.reduce((sum, r) => sum + r.downloaded, 0),
  };

  const summaryPath = join(STORAGE_DIR, '_summary.json');
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n✅ Backup de Storage completado: ${summary.totalDownloaded}/${summary.totalFiles} archivos`);
  console.log(`📄 Resumen: ${summaryPath}`);
}

main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
