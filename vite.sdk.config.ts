import { defineConfig, type Plugin } from 'vite'
import solid from 'vite-plugin-solid'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

// The CDN SDK (frontend/src/sdk): the drawing API without the editor, published to
// cdn/ in the OSS mirror by scripts/publish-oss.sh. ES module only — the heavy
// features stay lazy chunks next to yappy.js, which an IIFE cannot express (it
// would inline all of them into one ~7 MB script).

const mathjaxVersion: string = createRequire(import.meta.url)('mathjax-full/package.json').version

// `virtual:pwa-register` is provided by vite-plugin-pwa, which only the app build
// loads. The SDK never registers a service worker, so a no-op stands in for it.
const noPwa = (): Plugin => ({
  name: 'yappy-sdk-no-pwa',
  resolveId: (id) => (id === 'virtual:pwa-register' ? '\0virtual:pwa-register' : undefined),
  load: (id) => (id === '\0virtual:pwa-register' ? 'export const registerSW = () => async () => {};' : undefined),
})

export default defineConfig({
  plugins: [solid(), noPwa()],
  publicDir: false,
  // Same reason as vite.config.ts: MathJax otherwise reaches for Node's `require`.
  define: { PACKAGE_VERSION: JSON.stringify(mathjaxVersion) },
  build: {
    lib: {
      entry: resolve(__dirname, 'frontend/src/sdk/index.ts'),
      formats: ['es'],
      fileName: () => 'yappy.js',
    },
    outDir: 'dist-sdk',
    emptyOutDir: true,
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      output: { chunkFileNames: 'chunks/[name]-[hash].js', assetFileNames: 'chunks/[name]-[hash][extname]' },
    },
  },
})
