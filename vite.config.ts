import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { assemblyScriptPlugin } from './frontend/src/wasm/vite-plugin-as'

export default defineConfig({
  root: 'frontend',
  envDir: '..',  // .env files are in the project root, not in frontend/
  plugins: [solid(), assemblyScriptPlugin()],
  base: './',
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
