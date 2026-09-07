# Export to PPTX (PowerPoint)

Browser-based PowerPoint export powered by [PptxGenJS](https://github.com/gitbrent/PptxGenJS). Runs entirely client-side with no server or WASM runtime required. Produces `.pptx` files compatible with Microsoft PowerPoint, Google Slides, LibreOffice Impress, and Keynote.

## Usage

1. Open the **Export** dialog via **Menu > Export Animation** (or `Ctrl+Shift+E`).
2. Select the **PPTX** format radio button.
3. Choose **Scale** (1x / 2x / 3x) and toggle **White Background** as needed.
4. Optionally check **Export Selection Only** to limit the output.
5. Click **Export** -- the browser downloads `yappy_drawing.pptx`.

## How It Works

### Overview

The export reuses the existing Canvas 2D + RoughJS rendering pipeline. Each PPTX slide is produced by:

1. Creating an offscreen `<canvas>` element sized to the slide's pixel dimensions multiplied by the scale factor.
2. Rendering elements onto it with `renderElement(roughCanvas, ctx, element)`.
3. Converting the canvas to a PNG data URL.
4. Adding the PNG as a full-slide image via `pptxSlide.addImage()`.

This guarantees pixel-perfect fidelity -- the PPTX output matches exactly what the user sees on screen.

### Two Export Modes

The function signature is:

```typescript
exportToPptx(scale: number, background: boolean, onlySelected: boolean): Promise<void>
```

#### 1. Multi-slide (Slides Mode)

Activated when `store.docType === 'slides'` and `onlySelected` is `false`.

- Slides are sorted by their `order` field.
- The presentation layout is defined using a 10-inch base width, with height derived from the first slide's aspect ratio. For the default 1920x1080 slides, this yields **10" x 5.625"** (standard widescreen).
- For each slide, elements are filtered using the **spatial bounds check**: an element belongs to a slide when its center point falls inside the slide's rectangle.

```
cx = el.x + el.width / 2
cy = el.y + el.height / 2
isOnSlide = cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH
```

- Each Yappy slide becomes a separate PPTX slide.
- The slide's `backgroundColor` is used when the background option is enabled (falls back to `#ffffff`).

#### 2. Single slide (Infinite Mode / Selection)

Activated for infinite-canvas documents, or when **Export Selection Only** is checked.

- If exporting selection, only elements whose IDs are in `store.selection` are included.
- A tight bounding box is calculated across all included elements, with 20 px padding on each side.
- The content is rendered to a single canvas and embedded as one PPTX slide.
- The slide layout dimensions are derived from the content's aspect ratio (10" base width).

### Rendering Pipeline

```
exportToPptx()
  |
  +-- new PptxGenJS()
  +-- pptx.defineLayout({ width, height })   // set slide dimensions in inches
  |
  +-- for each slide (or once for single-slide):
  |     |
  |     +-- document.createElement('canvas')
  |     +-- canvas.getContext('2d')
  |     +-- ctx.scale(scale, scale)             // apply DPI multiplier
  |     +-- ctx.translate(-originX, -originY)   // shift to slide/content origin
  |     +-- rough.canvas(canvas)                // create RoughJS instance
  |     +-- renderElement(rc, ctx, el)          // for each element
  |     +-- canvas.toDataURL('image/png')
  |     +-- pptxSlide.addImage({ data, x, y, w, h })
  |
  +-- pptx.writeFile({ fileName: 'yappy_drawing.pptx' })
```

## Configuration Options

| Option | Values | Effect |
|--------|--------|--------|
| **Scale** | 1x, 2x, 3x | Multiplies the canvas resolution for sharper images inside slides. 2x is a good default. |
| **White Background** | on/off | When on, fills each slide with a solid background (slide color in slides mode, white in infinite mode). When off, the image has a transparent background. |
| **Export Selection Only** | on/off | When checked, exports only the currently selected elements as a single slide regardless of document mode. Disabled when nothing is selected. |

## Architecture

### Source Files

| File | Role |
|------|------|
| `src/utils/export.ts` | `exportToPptx()` function -- all PPTX generation logic |
| `src/components/export-dialog.tsx` | UI -- format selector, options, export button |

### Dependency

```
pptxgenjs  (npm package, ~170 KB gzipped)
```

PptxGenJS is a pure-JavaScript PPTX generator. No native binaries, no WASM, no server required. It produces valid Office Open XML (.pptx) files that conform to the OOXML standard. The library is tree-shaken by Vite and included in the production bundle.

### Slide Dimension Mapping

PptxGenJS uses **inches** as its coordinate system. Yappy slides use **pixels** (default 1920x1080). The conversion uses a fixed 10-inch base width:

```
slideWidthInches  = 10
slideHeightInches = 10 * (pixelHeight / pixelWidth)
```

For the default 1920x1080 slide:
- Width: **10"**
- Height: **5.625"**

This matches the standard PowerPoint widescreen layout (10" x 5.625").

## Image Encoding

Slide images are encoded as **PNG** (lossless). Since PPTX files are ZIP-compressed internally, the PNG images are further compressed within the archive. This provides:

- Lossless quality for sharp lines and text
- No JPEG compression artifacts
- Reasonable file sizes (typically 2--8 MB for a 5-slide deck at 2x scale)

## Compatibility

The exported `.pptx` files are compatible with:

| Application | Support |
|-------------|---------|
| Microsoft PowerPoint (2010+) | Full |
| Google Slides (import) | Full |
| LibreOffice Impress | Full |
| Apple Keynote (import) | Full |
| PowerPoint Online | Full |

## Limitations

- **Raster slides**: Each slide contains a single raster image, not editable vector shapes. The PPTX is intended for viewing/presenting, not further editing in PowerPoint.
- **No text extraction**: Text is rasterized as part of the canvas rendering. It is not selectable or editable within PowerPoint.
- **No animations**: Yappy animations (entrance, flow, spin, etc.) are not exported. Each slide is a static snapshot.
- **No speaker notes**: The export does not include speaker notes or presenter metadata.
- **Maximum canvas size**: Browsers impose limits on canvas dimensions (typically 16384 x 16384 px). At 3x scale, a 1920x1080 slide produces a 5760x3240 canvas, which is well within limits.
- **File size**: At 3x scale with many slides, files can grow large due to high-resolution PNG images embedded in each slide.

## Comparison with PDF Export

| | PDF | PPTX |
|---|---|---|
| **Library** | jsPDF | PptxGenJS |
| **Image format** | JPEG (0.92 quality) | PNG (lossless) |
| **Editable in target app** | No | No (raster images) |
| **Multi-page/slide** | Yes | Yes |
| **File size** | Smaller (JPEG) | Larger (PNG, but ZIP-compressed) |
| **Best for** | Printing, sharing, archival | Presenting, importing into slide decks |
| **Compatibility** | Any PDF viewer | PowerPoint, Google Slides, Keynote |
