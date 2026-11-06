import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GA_MEASUREMENT_ID__: JSON.stringify(process.env.GA_MEASUREMENT_ID || ''),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MotoFuel 摩托车油耗分析',
        short_name: 'MotoFuel',
        description: '摩托车油耗数据分析平台 - 跨排量油耗排行、品牌对比和可视化分析',
        theme_color: '#f8fafc',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // 注意：不要用 json —— 数据文件 motorcycles.json 一旦进 precache，
        // 新数据部署后回访用户会继续读到 SW 里的旧副本，表现为"数据没更新"。
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // 数据文件改为网络优先：在线时总是取最新，离线/超时才回退缓存
            urlPattern: /\/data\/motorcycles\.json$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'motorcycle-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 2, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.xiaoxiongyouhao\.com\//,
            handler: 'CacheFirst',
            options: { cacheName: 'external-images', expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 } },
          },
        ],
      },
    }),
  ],
  base: '/MotoFuel/',
})
