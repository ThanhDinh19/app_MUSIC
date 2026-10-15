import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const API_TARGET = 'http://localhost:4000';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        id: '/',
        name: 'Nocturne — Nghe nhạc theo tâm trạng',
        short_name: 'Nocturne',
        description: 'Ứng dụng nghe nhạc theo tâm trạng: playlist, yêu thích, lịch sử nghe và trình phát luôn sẵn sàng.',
        lang: 'vi',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        theme_color: '#141a36',
        background_color: '#0c1024',
        categories: ['music', 'entertainment'],
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Tìm kiếm', short_name: 'Tìm kiếm', url: '/search', icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
          { name: 'Thư viện', short_name: 'Thư viện', url: '/library', icons: [{ src: '/icons/pwa-192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/media\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Dữ liệu API: ưu tiên mạng, mất mạng thì dùng bản đã lưu → vẫn duyệt được thư viện khi offline.
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nocturne-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Ảnh bìa, ảnh nghệ sĩ: hầu như không đổi → lấy từ cache trước.
            urlPattern: ({ url }) => url.pathname.startsWith('/media/') && /\.(jpe?g|png|webp|svg)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'nocturne-artwork',
              expiration: { maxEntries: 400, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // File nhạc (/media/audio) KHÔNG đi qua service worker để trình duyệt tự stream bằng Range request.
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': API_TARGET,
      '/media': API_TARGET,
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/api': API_TARGET,
      '/media': API_TARGET,
    },
  },
});
