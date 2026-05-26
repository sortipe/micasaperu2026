import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log("Consultando estructura de base de datos...");

  // 1. Obtener información de la tabla settings
  // Para hacer esto de manera genérica sin SQL directo, podemos usar una consulta RPC o una consulta de metadatos si tenemos permisos.
  // Pero más fácil es intentar hacer un insert/update de prueba y ver qué error da.
  console.log("\nPrototipo 1: Consultando settings...");
  const { data: settingsData, error: settingsError } = await supabase.from('settings').select('*');
  console.log("Settings actuales:", settingsData);
  if (settingsError) {
    console.error("Error al obtener settings:", settingsError);
  }

  // 2. Intentar hacer un upsert de prueba
  console.log("\nPrototipo 2: Intentando upsert en settings...");
  const { data: upsertData, error: upsertError } = await supabase
    .from('settings')
    .upsert({ key: 'test_key', value: 'test_val_' + Date.now() }, { onConflict: 'key' })
    .select();
  
  if (upsertError) {
    console.error("Error en upsert de settings:", upsertError);
  } else {
    console.log("Upsert en settings exitoso:", upsertData);
    
    // Limpieza
    const { error: deleteError } = await supabase.from('settings').delete().eq('key', 'test_key');
    console.log("Limpieza de test_key:", deleteError ? "Error: " + deleteError.message : "Éxito");
  }
}

checkDatabase();
