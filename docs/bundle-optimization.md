# Bundle Optimization & Performance

This document outlines the strategies used to keep the Yappy bundle small and the application performant.

## Problem: Large Bundle Warnings
As the application grew to include heavy libraries for PDF generation (`jspdf`), PowerPoint exporting (`pptxgenjs`), and complex UI rendering (`roughjs`, `lucide-solid`), the initial JavaScript bundle exceeded the recommended 500kB size. This led to slower "Time to Interactive" (TTI) for users on slower connections.

## Strategies Implemented

### 1. Dynamic Imports (Lazy Loading)
We use SolidJS `lazy` to split the application into multiple chunks. The browser only downloads code when it is actually needed.

- **Dialog Chunks**: Components like `HelpDialog`, `SaveDialog`, and `FileOpenDialog` are loaded on-demand.
- **Export Engine**: The `ExportDialog`, which imports `jspdf` and `html2canvas`, is entirely isolated. Users who only draw and never export will never download these libraries.
- **Presentation Mode**: The `PresentationControls` and slide-related toolbars are only loaded if the user is working on a presentation or enters presentation mode.

### 2. Manual Vendor Chunking
We explicitly configure Vite/Rollup to group third-party libraries into logical clusters. This improves cache stability.

```typescript
// vite.config.ts
manualChunks: {
  'vendor-rendering': ['roughjs', 'lucide-solid'],
  'vendor-export': ['jspdf', 'pptxgenjs', 'html2canvas'],
  'solid-framework': ['solid-js']
}
```

- **Benefit**: If you update a UI component, the user only re-downloads a tiny app chunk. The heavy `vendor-rendering` chunk remains cached in their browser.

### 3. Progressive Reveal
The application prioritizes the **Canvas** and **Main Toolbar**. These are the only components included in the initial critical path. Everything else is fetched in the background or upon interaction.

## Verification
To verify the bundle size and organization, run:
```bash
bun run build
```
The output logs will show the individual chunk sizes. Aim for all chunks to be under **500kB**.
