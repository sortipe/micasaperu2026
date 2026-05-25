import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testStorage() {
  console.log("Iniciando prueba de conexión con Supabase Storage...");
  console.log("Supabase URL:", process.env.VITE_SUPABASE_URL);

  // 1. Listar buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("Error al listar buckets:", bucketsError);
    return;
  }
  console.log("Buckets disponibles:", buckets.map(b => b.name));

  // 2. Intentar listar archivos en el bucket 'properties'
  const { data: files, error: filesError } = await supabase.storage.from('properties').list('', { limit: 5 });
  if (filesError) {
    console.error("Error al listar archivos del bucket 'properties':", filesError);
    return;
  }
  console.log("Archivos encontrados en la raíz del bucket 'properties' (máx 5):", files.map(f => f.name));

  // 3. Crear un archivo de prueba ficticio y subirlo
  const content = 'Test storage file content ' + Date.now();
  const blob = Buffer.from(content, 'utf-8');
  const testFileName = `test_file_${Date.now()}.txt`;
  
  console.log(`Intentando subir archivo de prueba: ${testFileName}`);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('properties')
    .upload(`test_folder/${testFileName}`, blob, {
      contentType: 'text/plain',
      upsert: true
    });

  if (uploadError) {
    console.error("Error al subir archivo de prueba:", uploadError);
  } else {
    console.log("Archivo de prueba subido correctamente! Datos de subida:", uploadData);
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('properties')
      .getPublicUrl(`test_folder/${testFileName}`);
    console.log("URL pública del archivo de prueba:", urlData.publicUrl);

    // Limpiar el archivo de prueba
    console.log("Eliminando archivo de prueba...");
    const { error: deleteError } = await supabase.storage
      .from('properties')
      .remove([`test_folder/${testFileName}`]);
    if (deleteError) {
      console.error("Error al eliminar archivo de prueba:", deleteError);
    } else {
      console.log("Archivo de prueba eliminado correctamente para limpieza.");
    }
  }
}

testStorage();
