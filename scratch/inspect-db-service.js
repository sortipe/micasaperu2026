import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  console.log("=== DIAGNÓSTICO CON SERVICE ROLE ===");
  
  // 1. Obtener lista de usuarios de profiles
  console.log("\n1. Consultando perfiles de usuario:");
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) {
    console.error("Error al obtener perfiles:", pError);
  } else {
    console.log(`Perfiles encontrados (${profiles.length}):`);
    profiles.forEach(p => {
      console.log(`- ID: ${p.id}, Nombre: ${p.name}, Rol: ${p.role}`);
    });
  }

  // 2. Obtener estructura de settings
  console.log("\n2. Consultando settings actuales:");
  const { data: settings, error: sError } = await supabase.from('settings').select('*');
  if (sError) {
    console.error("Error al obtener settings:", sError);
  } else {
    console.log(`Settings actuales (${settings.length}):`);
    settings.forEach(s => {
      console.log(`- Clave: ${s.key}, Valor: ${s.value ? s.value.substring(0, 50) + (s.value.length > 50 ? '...' : '') : 'null'}`);
    });
  }

  // 3. Obtener buckets de almacenamiento
  console.log("\n3. Consultando buckets de almacenamiento:");
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  if (bError) {
    console.error("Error al listar buckets:", bError);
  } else {
    console.log("Buckets encontrados:");
    buckets.forEach(b => {
      console.log(`- Nombre: ${b.name}, Público: ${b.public}`);
    });
  }

  // 4. Consultar políticas
  console.log("\n4. Consultando RPC exec_sql si existe...");
  try {
    const { data: policies, error: polError } = await supabase.rpc('exec_sql', { sql: "SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public';" });
    if (polError) {
      console.log("RPC exec_sql no disponible (esperable).");
    } else {
      console.log("Políticas encontradas:", policies);
    }
  } catch (e) {
    console.log("Error al invocar RPC exec_sql:", e.message);
  }
}

inspect();
