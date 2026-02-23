import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  root: 'frontend',
  plugins: [solid()],
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
