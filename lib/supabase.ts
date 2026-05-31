
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

/**
 * Detecta si el navegador soporta WebP de forma nativa.
 * Retorna 'image/webp' si hay soporte, 'image/jpeg' como fallback.
 */
const getOptimalMimeType = (): Promise<'image/webp' | 'image/jpeg'> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    // toDataURL con WebP retorna una string que comienza con 'data:image/webp' si hay soporte
    const result = canvas.toDataURL('image/webp');
    resolve(result.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg');
  });
};

/**
 * Comprime una imagen en el lado del cliente utilizando HTML5 Canvas.
 * - Convierte automáticamente a WebP si el navegador lo soporta (30-50% menos peso que JPEG).
 * - Si no hay soporte WebP, usa JPEG de alta calidad como fallback seguro.
 * - Reduce las dimensiones máximas a maxWidth/maxHeight conservando la relación de aspecto.
 * - Si ocurre un error o el archivo no es una imagen, devuelve el archivo original de forma segura.
 */
export const compressImage = (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.82): Promise<File> => {
  return new Promise((resolve) => {
    // Si no es una imagen o es un GIF/SVG, resolver con el archivo original directamente
    if (!file.type || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }
    if (file.type === 'image/gif' || file.type.includes('svg')) {
      resolve(file);
      return;
    }
    // Si ya es WebP y pesa menos de 500KB, no recomprimir
    if (file.type === 'image/webp' && file.size < 500 * 1024) {
      resolve(file);
      return;
    }

    // Límite de tiempo de seguridad de 10 segundos.
    const timeoutId = setTimeout(() => {
      console.warn("Límite de tiempo en compresión excedido. Subiendo archivo original.");
      resolve(file);
    }, 10000);

    const cleanResolve = (result: File) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    getOptimalMimeType().then((outputMime) => {
      try {
        const reader = new FileReader();

        reader.onload = (event) => {
          const img = new Image();

          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              // Mantener la relación de aspecto y limitar tamaño máximo
              if (width > height) {
                if (width > maxWidth) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = Math.round((width * maxHeight) / height);
                  height = maxHeight;
                }
              }

              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              if (!ctx) {
                cleanResolve(file);
                return;
              }

              // Fondo blanco para evitar transparencias negras en JPEG
              if (outputMime === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
              }

              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob((blob) => {
                try {
                  if (!blob) {
                    cleanResolve(file);
                    return;
                  }

                  // Si la versión comprimida es mayor que el original, usar el original
                  if (blob.size >= file.size) {
                    cleanResolve(file);
                    return;
                  }

                  const originalName = file.name || 'image';
                  const dotIndex = originalName.lastIndexOf('.');
                  const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
                  const ext = outputMime === 'image/webp' ? 'webp' : 'jpg';
                  const newName = `${baseName}.${ext}`;

                  let compressedFile: File;
                  try {
                    compressedFile = new File([blob], newName, {
                      type: outputMime,
                      lastModified: Date.now(),
                    });
                  } catch {
                    // Fallback para WebViews donde File() no está disponible
                    const augmentedBlob = blob as any;
                    augmentedBlob.name = newName;
                    augmentedBlob.lastModified = Date.now();
                    compressedFile = augmentedBlob as File;
                  }

                  const savedKB = Math.round((file.size - blob.size) / 1024);
                  console.info(`Imagen comprimida a ${ext.toUpperCase()}: ${Math.round(blob.size / 1024)}KB (ahorró ${savedKB}KB)`);
                  cleanResolve(compressedFile);
                } catch (callbackErr) {
                  console.error("Error en callback de toBlob:", callbackErr);
                  cleanResolve(file);
                }
              }, outputMime, quality);
            } catch (err) {
              console.error("Error al procesar Canvas de imagen:", err);
              cleanResolve(file);
            }
          };

          img.onerror = () => {
            console.error("Error al cargar elemento de imagen.");
            cleanResolve(file);
          };

          img.src = event.target?.result as string;
        };

        reader.onerror = () => {
          console.error("Error al leer archivo mediante FileReader.");
          cleanResolve(file);
        };

        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Error general al leer archivo de imagen:", err);
        cleanResolve(file);
      }
    });
  });
};

// ⚠️ SECURITY: Credentials must come from environment variables — never hardcoded.
// If VITE_ env vars are missing, the app runs in demo mode with a null client.
const supabaseUrl = envUrl;
const supabaseAnonKey = envKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Running without a live Supabase connection. Set these variables in your .env file.'
  );
}

if (FORCE_DEMO_MODE) {
  console.info('Supabase DISCONNECTED (Forced Demo Mode). Using mock data.');
} else if (isSupabaseConfigured) {
  console.info('Supabase CONNECTED successfully.');
} else {
  console.info('Supabase env vars not set. Features requiring backend will be unavailable.');
}

// In-memory mutex to replace navigator.locks which deadlocks on WebViews
let isAuthLockAcquired = false;
const authLockQueue: Array<() => void> = [];

const acquireAuthLock = async (): Promise<void> => {
  if (!isAuthLockAcquired) {
    isAuthLockAcquired = true;
    return;
  }
  return new Promise(resolve => authLockQueue.push(resolve));
};

const releaseAuthLock = () => {
  if (authLockQueue.length > 0) {
    const next = authLockQueue.shift();
    if (next) next();
  } else {
    isAuthLockAcquired = false;
  }
};

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Custom JS mutex to bypass buggy navigator.locks while maintaining thread safety
    lock: async (_name, _acquireTimeout, fn) => {
      await acquireAuthLock();
      try {
        return await fn();
      } finally {
        releaseAuthLock();
      }
    },
    storage: {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (err) {
          console.error("Supabase Storage Error (getItem):", err);
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (err) {
          console.error("Supabase Storage Error (setItem):", err);
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (err) {
          console.error("Supabase Storage Error (removeItem):", err);
          return Promise.resolve();
        }
      },
    },
    storageKey: 'micasaperu-auth-session',
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

  -- 3. TABLA PARA REGISTRO DE CONSENTIMIENTO (Ley 29733 - Art. 5)
  CREATE TABLE IF NOT EXISTS public.consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_version TEXT NOT NULL,
    preferences JSONB NOT NULL,
    user_agent TEXT,
    ip_hash TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Insert consent logs anon" ON public.consent_logs FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY "Select own consent logs" ON public.consent_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

  -- 4. TABLA PARA SOLICITUDES ARCO (Ley 29733 - Art. 8, 9)
  CREATE TABLE IF NOT EXISTS public.data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT,
    request_type TEXT NOT NULL CHECK (request_type IN ('ACCESS', 'RECTIFICATION', 'CANCELLATION', 'OPPOSITION', 'DATA_EXPORT', 'ACCOUNT_DELETION')),
    description TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ALTER TABLE public.data_requests ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Insert own data requests" ON public.data_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Select own data requests" ON public.data_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
*/
