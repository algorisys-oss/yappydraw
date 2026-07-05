import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { VitePWA } from 'vite-plugin-pwa'
import { assemblyScriptPlugin } from './frontend/src/wasm/vite-plugin-as'

export default defineConfig({
  root: 'frontend',
  envDir: '..',  // .env files are in the project root, not in frontend/
  plugins: [solid(), assemblyScriptPlugin(), VitePWA({
    registerType: 'autoUpdate',
    // The tap-version hard-refresh helper unregisters SWs on demand, so
    // autoUpdate is safe alongside it.
    includeAssets: ['favicon.svg', 'logo.png', 'fonts/outline/*.ttf'],
    manifest: {
      name: 'Yappy — Draw, Diagram & Design',
      short_name: 'Yappy',
      description: 'Local-first drawing, diagramming, presentations and Canva-style design studio.',
      theme_color: '#6366f1',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: './',
      icons: [
        { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // The main bundle is ~3MB minified; raise the precache limit so the
      // whole app shell is cached and cold-loads offline.
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      globPatterns: ['**/*.{js,css,html,svg,png,ttf,wasm}'],
      navigateFallback: 'index.html',
      runtimeCaching: [
        {
          // Google Fonts stylesheets + font files: cache-first so display
          // fonts keep rendering offline after first use.
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  })],
  base: './',
  optimizeDeps: {
    // Pre-bundle deps that are only reached via lazy chunks (Elements panel
    // dynamic-imports the full lucide-solid) so the dev server never
    // discovers them mid-session and forces a full page reload.
    include: ['lucide-solid', 'roughjs', 'jspdf', 'pptxgenjs'],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-rendering': ['roughjs', 'lucide-solid'],
          'vendor-export': ['jspdf', 'pptxgenjs'],
          'solid-framework': ['solid-js']
        }
      }
    }
  }
})
