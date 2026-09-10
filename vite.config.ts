import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const runtimeEnv = ((globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> }
}).process?.env || {})

const appVersion = runtimeEnv.npm_package_version || '1.18.0'
const gitSha = runtimeEnv.VERCEL_GIT_COMMIT_SHA || runtimeEnv.GITHUB_SHA || 'local'
const buildTime = new Date().toISOString()
const requestedBasePath = runtimeEnv.VITE_BASE_PATH || '/'
const basePath = requestedBasePath.endsWith('/') ? requestedBasePath : `${requestedBasePath}/`

const manualChunks = (id: string) => {
  if (!id.includes('node_modules')) return undefined
  if (/node_modules\/(react|react-dom|react-router|react-router-dom)\//.test(id)) return 'vendor-react'
  if (id.includes('node_modules/@supabase/')) return 'vendor-supabase'
  if (id.includes('node_modules/lucide-react/')) return 'vendor-icons'
  const reactIconsPack = id.match(/node_modules\/react-icons\/([^/]+)\//)?.[1]
  if (reactIconsPack) return `icons-pack-${reactIconsPack}`
  return undefined
}

export default defineConfig({
  base: basePath,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_GIT_SHA': JSON.stringify(gitSha),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5175',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'robots.txt', 'favicon/site.webmanifest', 'favicon/favicon.ico', 'favicon/favicon-16x16.png', 'favicon/favicon-32x32.png', 'favicon/apple-touch-icon.png', 'favicon/android-chrome-192x192.png', 'favicon/android-chrome-512x512.png'],
      manifest: {
        id: basePath,
        name: 'AppForge — Simple, powerful tools',
        short_name: 'AppForge',
        description: 'An open-source toolbox of focused web utilities, media tools, and practical browser apps.',
        start_url: basePath,
        scope: basePath,
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        categories: ['utilities', 'productivity', 'developer'],
        icons: [
          {
            src: 'favicon/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'favicon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Scrapper Pro',
            short_name: 'Scrapper',
            description: 'Search public media sources in AppForge Scrapper Pro.',
            url: `${basePath}apps/scrapper-pro`,
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          },
          {
            name: 'Any → Any Converter',
            short_name: 'Converter',
            description: 'Open the AppForge data converter.',
            url: `${basePath}apps/any-converter`,
            icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/icons-pack-*.js'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/icons-pack-.*\.js$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'appforge-icon-packs',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
