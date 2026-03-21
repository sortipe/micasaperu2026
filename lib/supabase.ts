
import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate URL to prevent crash
const isValidUrl = (url: string | undefined) => {
  if (!url || url === 'YOUR_SUPABASE_URL_HERE') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isSupabaseConfigured = isValidUrl(envUrl) && !!envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY_HERE';

const supabaseUrl = isSupabaseConfigured ? envUrl : 'https://uxdnhmkoiqqeiaoxeedw.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? envKey : 'sb_publishable_RzdcCn5v-Xx-51FNP7F3fQ_X08NUO-h';

if (!isSupabaseConfigured) {
  console.warn('WARNING: Invalid or missing VITE_SUPABASE_URL. Using placeholder to prevent crash.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/* 
  INSTRUCCIONES DE BASE DE DATOS:
  Si tienes errores de columnas faltantes, ejecuta esto en el SQL Editor de Supabase:
  
  ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS "senderDni" TEXT;
  ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS "propertyTitle" TEXT;
  ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false;

  -- Si quieres habilitar campos avanzados (Entrega, Área Construida, etc.), ejecuta esto:
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deliveryMonth" TEXT;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deliveryYear" INTEGER;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "builtArea" NUMERIC;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "floors" INTEGER;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parkingCovered" BOOLEAN DEFAULT false;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "allowAdsUsage" BOOLEAN DEFAULT false;
*/
