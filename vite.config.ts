import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  base: './',
  build: {
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
