import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectBrand() {
  console.log("=== INSPECCIONANDO FOLDER BRAND EN PROPERTIES ===");
  const { data, error } = await supabase.storage.from('properties').list('brand');
  if (error) {
    console.error("Error al listar brand:", error);
  } else {
    console.log("Archivos en brand/ :");
    data.forEach(f => {
      console.log(`- Nombre: ${f.name}, Creado: ${f.created_at}, Tamaño: ${f.metadata?.size} bytes`);
    });
  }
}

inspectBrand();
