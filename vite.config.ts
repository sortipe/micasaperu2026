import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
              'vendor-swiper': ['swiper'],
              'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
              'vendor-lucide': ['lucide-react'],
            },
            assetFileNames: (assetInfo) => {
              const name = assetInfo.name || '';
              if (name.endsWith('.css')) return 'assets/index.[hash].css';
              if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(name)) return 'assets/img/[name]-[hash][extname]';
              if (/\.(woff2?|eot|ttf|otf)$/.test(name)) return 'assets/fonts/[name]-[hash][extname]';
              return 'assets/[name]-[hash][extname]';
            }
          }
        },
        target: 'es2020',
        minify: 'esbuild',
        cssMinify: true,
        sourcemap: false,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 500,
      }
    };
});
