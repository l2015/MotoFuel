import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

const DATA_PATH = fileURLToPath(new URL('./public/data/motorcycles.json', import.meta.url))

/**
 * 构建时把真实数据规模注入 index.html。
 * 这些数字原本硬编码在 SEO / Open Graph / JSON-LD 里（173 品牌、1779 车型、47 万条），
 * 但数据每周自动更新，早就和真实值（163 / 1712 / 42 万）对不上了。
 */
function dataStatsPlugin(): Plugin {
  return {
    name: 'motofuel:data-stats',
    transformIndexHtml(html) {
      const parsed = JSON.parse(readFileSync(DATA_PATH, 'utf-8')) as {
        data: { brand: string; samples: number }[]
      }
      const models = parsed.data.length
      const brands = new Set(parsed.data.map(row => row.brand)).size
      const samplesWan = Math.round(
        parsed.data.reduce((sum, row) => sum + row.samples, 0) / 10000
      )

      const replaced = html
        .replaceAll('%MODELS_RAW%', String(models))
        .replaceAll('%MODELS%', models.toLocaleString('en-US'))
        .replaceAll('%BRANDS%', String(brands))
        .replaceAll('%SAMPLES_WAN%', String(samplesWan))

      const leftover = replaced.match(/%[A-Z_]+%/g)
      if (leftover) {
        throw new Error(`index.html 存在未替换的占位符: ${leftover.join(', ')}`)
      }
      return replaced
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GA_MEASUREMENT_ID__: JSON.stringify(process.env.GA_MEASUREMENT_ID || ''),
  },
  plugins: [
    dataStatsPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'MotoFuel 摩托车油耗分析',
        short_name: 'MotoFuel',
        description: '摩托车油耗数据分析平台 - 跨排量油耗排行、品牌对比和可视化分析',
        lang: 'zh-CN',
        theme_color: '#fffef9',
        background_color: '#fffef9',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Android 自适应图标需要 maskable：内容留在中心安全区内，由系统裁圆/裁圆角
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
