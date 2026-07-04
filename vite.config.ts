import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { assemblyScriptPlugin } from './frontend/src/wasm/vite-plugin-as'

export default defineConfig({
  root: 'frontend',
  envDir: '..',  // .env files are in the project root, not in frontend/
  plugins: [solid(), assemblyScriptPlugin()],
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
