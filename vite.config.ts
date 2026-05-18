import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      workbox: {
        // ✅ FIX erreur 2MB
        maximumFileSizeToCacheInBytes: 3000000,

        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*$/,
            handler: 'NetworkFirst',

            options: {
              cacheName: 'firestore-data',

              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ✅ OPTIMISATION GROS BUNDLE
  build: {
    chunkSizeWarningLimit: 3000,

    rollupOptions: {
      output: {
        manualChunks: {
          firebase: [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],

          pdf: ['jspdf'],

          reactvendor: [
            'react',
            'react-dom',
          ],

          icons: ['lucide-react'],
        },
      },
    },
  },
});