
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
 * Comprime una imagen en el lado del cliente utilizando HTML5 Canvas.
 * Reduce las dimensiones máximas a maxWidth/maxHeight conservando la relación de aspecto,
 * y aplica compresión JPEG de calidad especificada.
 * Si ocurre un error o el archivo no es una imagen, devuelve el archivo original de forma segura.
 */
export const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<File> => {
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

    // Límite de tiempo de seguridad de 8 segundos. Si la compresión tarda más, 
    // liberamos la promesa resolviendo con el archivo original para que no se quede congelado
    const timeoutId = setTimeout(() => {
      console.warn("Límite de tiempo en compresión excedido. Subiendo archivo original.");
      resolve(file);
    }, 8000);

    const cleanResolve = (result: File) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
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

            // Dibujar la imagen escalada en el canvas
            ctx.drawImage(img, 0, 0, width, height);

            // Exportar a blob JPEG con calidad comprimida
            canvas.toBlob((blob) => {
              try {
                if (!blob) {
                  cleanResolve(file);
                  return;
                }

                // Crear un nuevo File a partir del Blob manteniendo el nombre original
                // Usamos extensión .jpg para asegurar que el tipo MIME sea JPEG comprimido
                const originalName = file.name;
                const dotIndex = originalName.lastIndexOf('.');
                const baseName = dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
                const newName = `${baseName}.jpg`;

                let compressedFile: File;
                try {
                  compressedFile = new File([blob], newName, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                } catch (fileCtrErr) {
                  // Fallback para navegadores/híbridos que no admiten constructor File
                  // Le inyectamos los atributos requeridos al Blob para usarlo como File
                  const augmentedBlob = blob as any;
                  augmentedBlob.name = newName;
                  augmentedBlob.lastModified = Date.now();
                  compressedFile = augmentedBlob as File;
                }
                
                cleanResolve(compressedFile);
              } catch (callbackErr) {
                console.error("Error en callback de toBlob de compresión:", callbackErr);
                cleanResolve(file);
              }
            }, 'image/jpeg', quality);
          } catch (err) {
            console.error("Error al procesar Canvas de imagen:", err);
            cleanResolve(file);
          }
        };
        img.onerror = () => cleanResolve(file);
      };
      reader.onerror = () => cleanResolve(file);
    } catch (err) {
      console.error("Error general al leer archivo de imagen:", err);
      cleanResolve(file);
    }
  });
};

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
    detectSessionInUrl: true,
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
*/
