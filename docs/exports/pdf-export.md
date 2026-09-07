# Export to PDF

Browser-based PDF export powered by [jsPDF](https://github.com/parallax/jsPDF). Runs entirely client-side with no server round-trip or WASM runtime required.

## Usage

1. Open the **Export** dialog via **Menu > Export Animation** (or `Ctrl+Shift+E`).
2. Select the **PDF** format radio button.
3. Choose **Scale** (1x / 2x / 3x) and toggle **White Background** as needed.
4. Optionally check **Export Selection Only** to limit the output.
5. Click **Export** -- the browser downloads `yappy_drawing.pdf`.

## How It Works

### Overview

The export reuses the existing Canvas 2D + RoughJS rendering pipeline. Each page of the PDF is produced by:

1. Creating an offscreen `<canvas>` element.
2. Rendering elements onto it with `renderElement(roughCanvas, ctx, element)`.
3. Converting the canvas to a JPEG data URL (`quality = 0.92`).
4. Embedding the JPEG into a jsPDF page via `pdf.addImage()`.

This guarantees pixel-perfect fidelity -- the PDF output matches exactly what the user sees on screen.

### Two Export Modes

The function signature is:

```typescript
exportToPdf(scale: number, background: boolean, onlySelected: boolean): Promise<void>
```

#### 1. Multi-page (Slides Mode)

Activated when `store.docType === 'slides'` and `onlySelected` is `false`.

- Slides are sorted by their `order` field.
- For each slide, elements are filtered using the **spatial bounds check**: an element belongs to a slide when its center point falls inside the slide's rectangle.

```
cx = el.x + el.width / 2
cy = el.y + el.height / 2
isOnSlide = cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH
```

- Each slide becomes a separate PDF page. The first page is created with the jsPDF constructor; subsequent pages are appended with `pdf.addPage()`.
- Page dimensions match the slide's own `dimensions` (default 1920 x 1080 px).
- Orientation (`landscape` / `portrait`) is inferred per-slide from its width vs. height.
- The slide's `backgroundColor` is used as the page background (falls back to `#ffffff`).

#### 2. Single-page (Infinite Mode / Selection)

Activated for infinite-canvas documents, or when **Export Selection Only** is checked.

- If exporting selection, only elements whose IDs are in `store.selection` are included.
- A tight bounding box is calculated across all included elements, with 20 px padding on each side.
- The content is rendered to a single canvas and embedded as one PDF page.
- Page dimensions match the computed bounding box.

### Rendering Pipeline

```
exportToPdf()
  |
  +-- for each slide (or once for single-page):
  |     |
  |     +-- document.createElement('canvas')
  |     +-- canvas.getContext('2d')
  |     +-- ctx.scale(scale, scale)         // apply DPI multiplier
  |     +-- ctx.translate(-originX, -originY) // shift to slide/content origin
  |     +-- rough.canvas(canvas)             // create RoughJS instance
  |     +-- renderElement(rc, ctx, el)       // for each element
  |     +-- canvas.toDataURL('image/jpeg', 0.92)
  |     +-- pdf.addImage(imgData, 'JPEG', 0, 0, w, h)
  |
  +-- pdf.save('yappy_drawing.pdf')
```

## Configuration Options

| Option | Values | Effect |
|--------|--------|--------|
| **Scale** | 1x, 2x, 3x | Multiplies the canvas resolution for sharper output. 2x is a good default. |
| **White Background** | on/off | When on, fills each page with a solid background (slide color in slides mode, white in infinite mode). When off, the background is transparent (appears white in most PDF viewers). |
| **Export Selection Only** | on/off | When checked, exports only the currently selected elements as a single page regardless of document mode. Disabled when nothing is selected. |

## Architecture

### Source Files

| File | Role |
|------|------|
| `src/utils/export.ts` | `exportToPdf()` function -- all PDF generation logic |
| `src/components/export-dialog.tsx` | UI -- format selector, options, export button |

### Dependency

```
jspdf  (npm package, ~280 KB gzipped)
```

jsPDF is a pure-JavaScript PDF generator. No native binaries, no WASM, no server required. It is tree-shaken by Vite and included in the production bundle.

### jsPDF Configuration

```typescript
new jsPDF({
    orientation: 'landscape' | 'portrait',  // inferred from dimensions
    unit: 'px',                             // use pixel coordinates
    format: [width, height],                // custom page size
    hotfixes: ['px_scaling'],               // correct px unit scaling
});
```

The `hotfixes: ['px_scaling']` option is required for jsPDF to correctly interpret pixel units when using `addImage()`. Without it, coordinates would be off by the internal DPI factor.

## Image Encoding

Pages are encoded as **JPEG at 92% quality**. This provides a good balance between file size and visual quality. For a typical 5-slide presentation at 2x scale:

- Each slide canvas is 3840 x 2160 pixels.
- JPEG at 0.92 quality compresses well for drawings with flat colors and sharp lines.
- Total PDF size is typically 1--5 MB depending on content complexity.

PNG encoding (`canvas.toDataURL('image/png')`) could be used instead for lossless output, but results in significantly larger files (5--20 MB for the same content).

## Limitations

- **Raster output**: The PDF embeds raster images, not vector paths. Text is not selectable in the resulting PDF. For vector output, use the SVG export instead.
- **No font embedding**: Text is rasterized as part of the canvas rendering, so font availability on the viewer's machine is irrelevant.
- **Maximum canvas size**: Browsers impose limits on canvas dimensions (typically 16384 x 16384 px). At 3x scale, a 1920 x 1080 slide produces a 5760 x 3240 canvas, which is well within limits. Very large infinite-canvas exports may hit this ceiling.
- **No hyperlinks or bookmarks**: The PDF contains only image content per page -- no interactive elements.
- **JPEG artifacts**: At 0.92 quality, compression artifacts are negligible for most drawings but may be visible on very fine gradients or photographic images.

## Comparison with Other Export Formats

| | PNG | SVG | PDF | WebM/MP4 |
|---|---|---|---|---|
| **Type** | Raster | Vector | Raster (in PDF) | Video |
| **Multi-page** | No | No | Yes | N/A |
| **Scalable** | Via scale option | Infinite | Via scale option | Fixed |
| **File size** | Small--Medium | Small | Medium | Large |
| **Text selectable** | No | Yes | No | No |
| **Use case** | Sharing, embedding | Editing, printing | Presentations, handouts | Demos, recording |
