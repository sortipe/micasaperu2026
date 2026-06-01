import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { beasties } from 'vite-plugin-beasties';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        beasties({
          options: {
            preload: 'swap',
            pruneSource: false,
            inlineThreshold: 4096,
            minimumExternalSize: 10240,
          },
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      esbuild: mode === 'production' ? {
        legalComments: 'none',
        drop: ['console', 'debugger'],
      } : {
        legalComments: 'none',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-framer': ['framer-motion'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-leaflet': ['leaflet'],
              'vendor-leaflet-css': ['leaflet/dist/leaflet.css'],
              'vendor-swiper': ['swiper'],
              'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
              'vendor-lucide': ['lucide-react'],
              'vendor-web-vitals': ['web-vitals'],
              'vendor-mercadopago': ['@mercadopago/sdk-react'],
            },
            assetFileNames: (assetInfo) => {
              const name = assetInfo.name || '';
              if (name.endsWith('.css')) return 'assets/index.[hash].css';
              if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(name)) return 'assets/img/[name]-[hash][extname]';
              if (/\.(woff2?|eot|ttf|otf)$/.test(name)) return 'assets/fonts/[name]-[hash][extname]';
              return 'assets/[name]-[hash][extname]';
            }
          },
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false,
          }
        },
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        sourcemap: false,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 300,
        cssCodeSplit: true,
      }
    };
});
