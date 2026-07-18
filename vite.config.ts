import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { VitePWA } from 'vite-plugin-pwa'
import { assemblyScriptPlugin } from './frontend/src/wasm/vite-plugin-as'

export default defineConfig({
  root: 'frontend',
  envDir: '..',  // .env files are in the project root, not in frontend/
  plugins: [solid(), assemblyScriptPlugin(), VitePWA({
    // 'prompt' (NOT 'autoUpdate'): autoUpdate emits skipWaiting()+clientsClaim()
    // in the SW, so a freshly-deployed SW activates and evicts the old precache
    // *while the previous page is still fetching its old content-hashed chunks*.
    // Those chunks 404 (gone from cache and from the server), the ESM graph fails
    // to execute, and #root renders empty → the notorious "blank on first load,
    // fine on refresh" bug. 'prompt' keeps the old page on its own consistent
    // precache for its whole lifetime; the new build is applied only on an
    // explicit user action (see utils/pwa.ts → initPWA, or the version-tap
    // hard-refresh). injectRegister:false because we register via registerSW().
    registerType: 'prompt',
    injectRegister: false,
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
      // The OAuth popup returns to /oauth-callback.html?state=…&code=…&iss=…
      // As a *navigation* request with a query string, workbox can't match it
      // against the (query-less) precache key, so it fell through to
      // navigateFallback and served the index.html app shell instead — the
      // callback <script> never ran and the sign-in popup hung on "Connecting…".
      // Exclude the callback (matched against url.pathname) so it hits the
      // network/precache and the real static page loads.
      navigateFallbackDenylist: [/oauth-callback\.html/],
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
