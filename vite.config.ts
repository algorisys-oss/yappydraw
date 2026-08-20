import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { VitePWA } from 'vite-plugin-pwa'
import { assemblyScriptPlugin } from './frontend/src/wasm/vite-plugin-as'
import { helpMarkdownPlugin } from './frontend/src/help-docs/vite-plugin-help-md'
import { createRequire } from 'node:module'

// Read MathJax's real version rather than hardcoding it, so the `PACKAGE_VERSION`
// define below can't drift from the installed package (see the comment on `define`).
const mathjaxVersion: string = createRequire(import.meta.url)('mathjax-full/package.json').version

export default defineConfig({
  root: 'frontend',
  envDir: '..',  // .env files are in the project root, not in frontend/
  plugins: [solid(), assemblyScriptPlugin(), helpMarkdownPlugin(), VitePWA({
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
    // NOTE: `fonts/outline/*.ttf` used to be listed here. `includeAssets` force-adds files to
    // the precache regardless of `globPatterns`/`globIgnores`, so it beat every attempt to
    // exclude them from the workbox block below — worth remembering, because the failure is
    // silent: the build succeeds and the files are simply still there.
    // They are the Create Outlines glyph binaries, several MB, fetched lazily and only when
    // someone actually converts text to vectors. Precaching them cost every visitor that
    // download up front for a feature most never touch. Trade-off accepted: converting text
    // to outlines now needs the network the first time (it is cached normally afterwards).
    // These are NOT the fonts the app renders with — those come from CSS — so display and
    // offline drawing are unaffected.
    includeAssets: ['favicon.svg', 'logo.png'],
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
      // The Create Outlines glyph binaries (fonts/outline/) are several MB and are fetched
      // lazily — only when someone actually converts text to vectors, and then cached by
      // the browser like any other request. Precaching them made every visitor download
      // megabytes of font data up front for a feature most never touch. They are NOT the
      // fonts the app renders with (those come from CSS), so nothing here affects display.
      // Filtered here rather than with `globIgnores`, which vite-plugin-pwa does not pass
      // through — every pattern tried left all 15 files in the manifest. A manifestTransform
      // runs on the final entry list, so it cannot be silently ignored, and the assertion is
      // visible: grep the built sw.js for `fonts/outline` and expect nothing.
      // Heavy chunks behind a lazy `import()` — export to HTML player / PDF / PPTX /
      // image, MathJax, the help docs and the docs search index. Same argument as the
      // outline fonts above, but bigger: they were 5.1MB of a 9.6MB precache, and
      // because every filename is content-hashed, EVERY deploy invalidated all 220
      // entries — so each release made returning visitors re-download the whole
      // 9.6MB in the background. Shipping several times a day, that is most of the
      // "why is it slow" report.
      //
      // None of these are on the boot path (verified: grep the entry chunk for their
      // names — no static import), so excluding them costs nothing online: they are
      // fetched on first use and then kept by the runtimeCaching rule below. The
      // trade-off, accepted knowingly: the FIRST use of export/help/maths while
      // offline now needs the network.
      manifestTransforms: [
        (entries) => {
          // `svg-*.js` here is MathJax's SVG *output renderer* (it imports TeXAtom —
          // see utils/tex.ts, which lazy-imports mathjax-full/js/output/svg.js), not
          // any of our own SVG code. At 1.2MB it was the second-largest thing in the
          // precache, downloaded by everyone, used only by people who type LaTeX.
          // `helpdoc-` replaced `-doc-` when the help documents moved from
          // `*-doc.tsx` to Markdown; the prefix is assigned in the rollup output
          // config below, so it no longer depends on a document's filename.
          const LAZY_HEAVY = /(export-game|jspdf|pptxgen|html2canvas|AllPackages|BaseConfiguration|Factory-|TeXAtom|mathjax|\/svg-|helpdoc-|search-)/i
          return {
            manifest: entries.filter(e => !e.url.includes('fonts/outline/') && !LAZY_HEAVY.test(e.url)),
            warnings: [],
          }
        },
      ],
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
          // The lazy chunks dropped from the precache above. Cache-first is safe
          // because every filename carries a content hash — a given URL can never
          // change meaning — so first use fetches, and every use after that is
          // offline-capable, without charging the download to people who never
          // open the exporter. Precached URLs never reach here: workbox's
          // precache route matches first.
          urlPattern: ({ url }) => /\/assets\/.+\.(js|css)$/.test(url.pathname),
          handler: 'CacheFirst',
          options: {
            cacheName: 'yappy-lazy-chunks',
            expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
            // 200 only — NOT the usual [0, 200]. These are same-origin assets, so a
            // legitimate response is always a real 200; status 0 here would be an
            // opaque/failed one, and storing that in a *CacheFirst* cache with a
            // 30-day life poisons the URL permanently — every later load is served
            // an unparseable body and the chunk import fails for a month.
            cacheableResponse: { statuses: [200] },
          },
        },
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
  // MathJax's `js/components/version.js` reads its own version with
  // `eval('require')(...package.json)` — a Node-only trick that throws
  // "require is not defined" in a browser. It is guarded by
  // `typeof PACKAGE_VERSION === 'undefined'`, so defining the constant at build
  // time skips that branch entirely. Must be mirrored in
  // `optimizeDeps.esbuildOptions.define` below: `define` here covers the Rollup
  // production build, that one covers the dev-server pre-bundle.
  define: {
    PACKAGE_VERSION: JSON.stringify(mathjaxVersion),
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { PACKAGE_VERSION: JSON.stringify(mathjaxVersion) },
    },
    // Pre-bundle deps that are only reached via lazy chunks (Elements panel
    // dynamic-imports the full lucide-solid) so the dev server never
    // discovers them mid-session and forces a full page reload.
    // `mathjax-full` ships CommonJS under js/ with no ESM build, and `Yappy.tex`
    // reaches it only through a dynamic import — without pre-bundling, the browser
    // hits its bare `require(...)` and throws "require is not defined".
    include: [
      'lucide-solid', 'roughjs', 'jspdf', 'pptxgenjs',
      'mathjax-full/js/mathjax.js',
      'mathjax-full/js/input/tex.js',
      'mathjax-full/js/output/svg.js',
      'mathjax-full/js/adaptors/liteAdaptor.js',
      'mathjax-full/js/handlers/html.js',
      'mathjax-full/js/input/tex/AllPackages.js',
    ],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // NOTE: jspdf/pptxgenjs are deliberately NOT listed here. A manualChunks
        // entry forces those modules into a chunk that is reachable from the entry,
        // which put ~744 kB of export-only vendor code on the cold-load critical path
        // even after exportToPdf/exportToPptx switched to dynamic imports. Left to
        // Rollup, they land in a chunk pulled in only when an export actually runs.
        manualChunks: {
          // lucide-solid is NOT listed: naming it forces the ENTIRE icon package into
          // the chunk, defeating tree-shaking of the ~40 icons actually imported at
          // startup. The Elements panel dynamic-imports the full package separately.
          'vendor-rendering': ['roughjs'],
          'solid-framework': ['solid-js']
        },
        // Help documents get a `helpdoc-` prefix so the precache filter above can
        // recognise them by name. They used to be `*-doc.tsx`, which the filter
        // matched as `-doc-`; converting them to Markdown renamed every chunk to
        // `<slug>-<hash>.js` and quietly put all 31 back into the precache
        // (+586 KiB for every visitor). Naming them here makes the exclusion
        // independent of what a document happens to be called.
        chunkFileNames: (chunk) => {
          const id = chunk.facadeModuleId ?? ''
          return id.includes('/help-docs/') && /\.md(\?|$)/.test(id)
            ? 'assets/helpdoc-[name]-[hash].js'
            : 'assets/[name]-[hash].js'
        }
      }
    }
  }
})
