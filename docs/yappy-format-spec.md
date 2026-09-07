# The Yappy Document Format (open specification)

This document describes the on-disk / on-wire format of a **Yappy** drawing so that other tools can
read and write it. The format is a plain JSON object (optionally gzip-compressed). It is stable at
`version: 4`; older versions are auto-migrated on load.

> Status: this spec is descriptive of the shipping format. Field names and semantics match the
> `SlideDocument` and `DrawingElement` types in the source (`frontend/src/types/slide-types.ts`,
> `frontend/src/types.ts`). Where a field is optional, omitting it is safe — the app fills a default.

If you just want interop with a rough.js-style editor, Yappy also reads and writes the
**Excalidraw** `.excalidraw` format directly (see [Excalidraw interop](#excalidraw-interop)).

---

## 1. File encoding

| Extension | Encoding |
|-----------|----------|
| `.yappy`  | **gzip-compressed** UTF-8 JSON of the document object |
| `.json`   | Plain UTF-8 `JSON.stringify(document, null, 2)` |

Both decode to the same object. Readers should try gzip first for `.yappy` and fall back to plain
text; writers may emit either.

---

## 2. Top-level document (`SlideDocument`, version 4)

```jsonc
{
  "version": 4,
  "metadata": {
    "name": "My drawing",
    "createdAt": "2026-01-01T00:00:00.000Z",   // ISO string, optional
    "updatedAt": "2026-01-01T00:00:00.000Z",   // optional
    "docType": "infinite"                        // "infinite" | "slides" | "design" | "game"
  },
  "elements": [ /* DrawingElement[] — see §3, the actual content */ ],
  "layers":   [ /* Layer[] — see §4 */ ],
  "slides":   [ /* Slide[] — see §5; at least one */ ],
  "globalSettings": { /* optional: theme, default styles, units */ },
  "gridSettings":   { /* optional */ },

  // Optional feature payloads — omit if unused:
  "states": [], "symbols": [], "artboards": [], "graphicStyles": [],
  "swatches": [], "patterns": [], "dimensionAnnotations": [],
  "gameScript": "", "sceneBehaviors": [], "gameVars": [], "blueprints": null
}
```

Notes:
- **`docType` lives at `metadata.docType`**, not at the top level. `infinite` = one boundless canvas;
  `slides` = a presentation; `design` = fixed page sizes; `game` = the game builder.
- There is **no top-level `canvasBackgroundColor` or `viewState`**. Background colour is **per slide**
  (`Slide.backgroundColor`); the app derives the canvas background from `slides[0]`. View pan/zoom is
  not part of the document (it is session state).
- A minimal valid document needs `version`, `elements`, `layers`, and `slides` (with one slide and
  one layer). Everything else is optional.

---

## 3. Elements (`DrawingElement`)

`elements` is a **flat array** in world-space. Each element carries its own `layerId`. Z-order is
array order (later = on top).

### 3.1 Required fields (every element)

| Field | Type | Meaning |
|-------|------|---------|
| `id` | `string` | Unique within the document. |
| `type` | `string` | Element kind — see §3.3. |
| `x`, `y` | `number` | Top-left corner, world pixels. |
| `width`, `height` | `number` | Size in pixels. |
| `angle` | `number` | Rotation in **radians**, about the element centre. |
| `strokeColor` | `string` | CSS colour. |
| `backgroundColor` | `string` | CSS colour or `"transparent"`. |
| `fillStyle` | `string` | See §3.4. |
| `strokeWidth` | `number` | Pixels. |
| `strokeStyle` | `"solid" \| "dashed" \| "dotted"` | |
| `roughness` | `number` | rough.js roughness (0–2 typical). |
| `opacity` | `number` | **0–100** (not 0–1). |
| `renderStyle` | `"sketch" \| "architectural"` | Hand-drawn vs. clean lines. |
| `seed` | `number` | rough.js RNG seed (keeps the sketch look stable). |
| `roundness` | `null \| { "type": number }` | Corner rounding. |
| `locked` | `boolean` | |
| `link` | `string \| null` | Optional hyperlink. |
| `layerId` | `string` | References a `Layer.id` (see §4). Use `"default-layer"` if unsure. |

### 3.2 Common optional fields

- **Text:** `text`, `fontSize`, `fontFamily` (`"hand-drawn" | "sans-serif" | "monospace" | "serif" |
  "caveat" | "poppins" | "marker" | "code"`), `fontWeight`, `fontStyle`, `textAlign`
  (`"left"|"center"|"right"`), `verticalAlign` (`"top"|"middle"|"bottom"`), `letterSpacing`,
  `textColor`, `richText` (span runs). For a shape with an inline label use `containerText` (the
  label string) rather than `text`.
- **Lines / arrows:** `points` (see §3.5), `curveType` (`"straight"|"bezier"|"elbow"`),
  `startArrowhead` / `endArrowhead` (`"arrow"|"triangle"|"diamond"|"diamondFilled"|"circle"|"dot"|
  "bar"|"crowsfoot"|null`).
- **Vector paths** (`type: "path"`): `pathSubpaths` (preferred) or `pathAnchors` — see §3.6.
- **Image** (`type: "image"`): `dataURL` (a `data:` URI) or `fileId`, `mimeType`, `scale: [x,y]`.
- **Fills:** `gradientStops`, `gradientType`, `patternFill`, `meshGradient`, `backgroundImage`.
- **Structure/bindings:** `groupIds: string[]`, `parentId` (mindmap tree), `boundElements`,
  `startBinding` / `endBinding` — see §3.7.
- **Transform/effects:** `flipX`, `flipY`, `shearX`, `shearY`, `borderRadius`, `shadowEnabled`
  (+ shadow props), `blendMode`.

### 3.3 Element types

`type` is a large union (~300 members). The **portable core** (understood by most importers,
including the Excalidraw bridge) is:

`rectangle`, `circle`, `diamond`, `triangle`, `line`, `arrow`, `bezier`, `text`, `richtext`, `image`,
`path`, and the freehand pens `fineliner` / `inkbrush` / `marker`.

Beyond that, Yappy has hundreds of semantic shapes (flowchart, UML, BPMN, cloud/infra, UI wireframe,
charts, data-structures, people/icons, stick figures). A foreign importer that doesn't recognise a
`type` should fall back to drawing the element's **bounding box** or its path outline (if present)
using the common stroke/fill fields — every element carries those.

### 3.4 `fillStyle`

`"solid"`, `"hachure"`, `"cross-hatch"`, `"zigzag"`, `"zigzag-line"`, `"dots"`, `"dashed"`, plus the
rich fills `"linear"`, `"radial"`, `"conic"` (gradients — see `gradientStops`), `"image"`, `"mesh"`,
`"pattern"`. Importers that only support flat fills should treat anything they don't recognise as
`"solid"`.

### 3.5 `points` encoding (lines, arrows, pens)

`points` may be either:
- **Flat:** `[x0, y0, x1, y1, …]` (numbers), with `pointsEncoding: "flat"`. This is what the app
  writes for freehand pens.
- **Objects:** `[{ "x": …, "y": …, "p"?: pressure, "t"?: time }, …]`.

**All point coordinates are relative to the element's `x,y` origin**, not absolute. (Same convention
as Excalidraw's linear elements.)

### 3.6 Vector paths

`pathSubpaths: [{ "anchors": PathAnchor[], "closed": boolean }, …]` — multiple subpaths enable holes
via the even-odd rule. `pathAnchors` is the single-subpath legacy form. A `PathAnchor` is:

```jsonc
{ "x": 0, "y": 0, "inX": 0, "inY": 0, "outX": 0, "outY": 0, "kind": "corner" | "smooth" }
```

`in*/out*` are Bézier control-handle offsets (relative to the anchor); `kind` distinguishes corners
from smooth points. **Anchor coordinates are relative to the element origin.**

### 3.7 Bindings & grouping

- `groupIds: string[]` — elements sharing a group id move together.
- `boundElements: [{ "id": string, "type": "arrow" | "text" | "organicBranch" }] | null` — children
  bound to this element (e.g. an arrow bound to a shape, or a text label).
- `startBinding` / `endBinding: { "elementId": string, "focus": number, "gap": number } | null` — on a
  connector, which elements its ends attach to.
- `parentId: string | null` — mindmap/hierarchy parent.

When importing, **regenerate ids** and rewrite every cross-reference (`boundElements[].id`,
`start/endBinding.elementId`, `containerId`, `parentId`, and `groupIds` if you renumber groups).

---

## 4. Layers (`Layer`)

```jsonc
{ "id": "default-layer", "name": "Layer 1", "visible": true, "locked": false,
  "opacity": 1, "order": 0, "backgroundColor": "transparent" }
```

`opacity` here is **0–1** (unlike element opacity, which is 0–100). Every element's `layerId` must
match a layer `id`. The default layer id is the literal `"default-layer"`. Tools that have no layer
concept can emit a single default layer and put every element on it.

---

## 5. Slides / pages (`Slide`)

```jsonc
{ "id": "slide-1", "name": "Slide 1", "order": 0,
  "spatialPosition": { "x": 0, "y": 0 },       // where this page sits in world space
  "dimensions": { "width": 1920, "height": 1080 },
  "backgroundColor": "#ffffff",                 // optional; this is the canvas background
  "fillStyle": "solid", "gradientStops": [],    // optional page fill
  "transition": { … }, "lastViewState": { … }   // optional
}
```

For `docType: "infinite"` there is a single default page and elements simply live at their world
coordinates. For `slides` / `design`, each page occupies its own region of world space via
`spatialPosition`, and elements belong to whichever page contains them.

---

## 6. Coordinate system

- World-space **pixels**; origin top-left; `x,y` is an element's top-left corner.
- `angle` in **radians**, about the element centre.
- `points` and path anchors are **relative to the element origin**.
- Element `opacity` is **0–100**; layer `opacity` is **0–1**.
- No document-level pan/zoom is baked into coordinates.

---

## 7. Minimal example

```json
{
  "version": 4,
  "metadata": { "name": "hello", "docType": "infinite" },
  "layers": [
    { "id": "default-layer", "name": "Layer 1", "visible": true, "locked": false, "opacity": 1, "order": 0 }
  ],
  "slides": [
    { "id": "slide-1", "name": "Page 1", "order": 0,
      "spatialPosition": { "x": 0, "y": 0 }, "dimensions": { "width": 1920, "height": 1080 },
      "backgroundColor": "#ffffff" }
  ],
  "elements": [
    {
      "id": "rect-1", "type": "rectangle",
      "x": 100, "y": 100, "width": 200, "height": 120, "angle": 0,
      "strokeColor": "#1e1e1e", "backgroundColor": "#a5d8ff",
      "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid",
      "roughness": 1, "opacity": 100, "renderStyle": "sketch", "seed": 12345,
      "roundness": { "type": 3 }, "locked": false, "link": null,
      "layerId": "default-layer"
    },
    {
      "id": "text-1", "type": "text",
      "x": 120, "y": 130, "width": 160, "height": 30, "angle": 0,
      "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
      "fillStyle": "solid", "strokeWidth": 1, "strokeStyle": "solid",
      "roughness": 1, "opacity": 100, "renderStyle": "sketch", "seed": 222,
      "roundness": null, "locked": false, "link": null,
      "layerId": "default-layer",
      "text": "Hello", "fontSize": 20, "fontFamily": "hand-drawn", "textAlign": "left"
    }
  ]
}
```

This loads as a rounded blue rectangle with a "Hello" label on an infinite canvas.

---

## 8. Excalidraw interop

Yappy reads and writes Excalidraw `.excalidraw` (schema version 2) natively, which is often the
easiest interchange path for rough.js-style editors:

- **Export:** *Menu → Save/Export → Export to Excalidraw*, or `window.Yappy.exportExcalidraw()` →
  `{ json, downgraded }`. The core primitives map 1:1; `path` and Yappy-only shapes are emitted as
  closed `line` polygons (outline + fill preserved) — `downgraded` counts how many.
- **Import:** open a `.excalidraw` file from *Menu → Open*, or `window.Yappy.importExcalidraw(json)`.
  Excalidraw `rectangle` / `ellipse` / `diamond` / `line` / `arrow` / `text` / `image` / `freedraw`
  map to the corresponding Yappy types; ids and bindings are rewritten.

Because both apps share the world-space-pixels + radians convention, geometry needs no conversion.

---

## 9. Versioning & migration

The current document version is `4`. The app migrates `2`/`3`/legacy documents to `4` on load
(adding `slides`/`layers`, moving flat properties into the new structure). New writers should emit
`version: 4`. If a future version bumps the number, unknown newer versions should be treated as
best-effort (read the fields you recognise).
