
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

// FORCE_DEMO_MODE: Set to true to disconnect from live Supabase and use mock data
const FORCE_DEMO_MODE = false;

// We consider it configured if we have non-placeholder values and NOT in force demo mode
export const isSupabaseConfigured = !FORCE_DEMO_MODE && !!envUrl && envUrl !== 'YOUR_SUPABASE_URL_HERE' && !!envKey;

const supabaseUrl = envUrl || 'https://uxdnhmkoiqqeiaoxeedw.supabase.co';
const supabaseAnonKey = envKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZG5obWtvaXFxZWlhb3hlZWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTI2MjEsImV4cCI6MjA4NDI2ODYyMX0.Wq509Vq5HwR120QuH_BbJHNKzJj31Vuji5lltm7b5jE';

if (FORCE_DEMO_MODE) {
  console.info('Supabase DISCONNECTED (Forced Demo Mode). Using mock data.');
} else if (isSupabaseConfigured) {
  console.info('Supabase CONNECTED successfully.');
} else {
  console.info('Using hardcoded Supabase connection (VITE_ environment variables missing).');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/* 
  INSTRUCCIONES DE BASE DE DATOS:
  Para que todas las funciones de "Mi Casa Perú" operen correctamente, 
  ejecuta estos comandos en el SQL Editor de Supabase:

  -- 1. Campos para Mensajes (Inquiries)
  ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS "senderDni" TEXT;
  ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS "propertyTitle" TEXT;
  ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN DEFAULT false;

  -- 2. Campos Avanzados para Propiedades
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deliveryMonth" TEXT;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "deliveryYear" INTEGER;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "builtArea" NUMERIC;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "terrainArea" NUMERIC;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "floors" INTEGER;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "maintenanceFee" NUMERIC;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "parkingCovered" BOOLEAN DEFAULT false;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "allowAdsUsage" BOOLEAN DEFAULT false;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "lat" NUMERIC;
  ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS "lng" NUMERIC;
*/
