# Vector Illustration Roadmap (Illustrator-class)

> **Canonical, operationalized version** of the repo-root `roadmap.md`
> ("Yappy → Illustrator-Power Roadmap"). This doc adds validated current-state
> corrections, a sprint-ready sequencing of Tier 1, and a reusable-building-blocks
> table. Keystone deep-dive lives in [vector-path-tool-spec.md](vector-path-tool-spec.md).
>
> **Date:** 2026-06-24 · Verified against `.repograph/index.txt`, `frontend/src/types.ts`,
> and three codebase exploration passes. Complexity: **S**mall / **M**edium / **L**arge / **XL**.

Reference codebases (read-only, see CLAUDE.md): Inkscape
`/home/rajesh/opensource/graphics/inkscape` (vector paths, pathfinder/boolean ops,
LPE, SVG, 2geom) and Krita `.../krita` (brush engines, stylus, layers/masks).

---

## 1. Where Yappy stands today (validated)

**Strong — at or near Illustrator parity:**
- **Transforms** — move, 8-point resize, rotate, flip H/V
  (`utils/tool-handlers/selection-handler.ts`, `utils/handle-detection.ts`,
  `utils/object-context-actions.ts` `flipSelected`).
- **Alignment** — 6-way (left/center/right/top/middle/bottom) + distribute H/V
  (`utils/alignment.ts`, `property-panel.tsx` AlignmentControls).
- **Structure** — groups (nested via `groupIds`), layers, z-order, lock, hide
  (`store/app-store.ts`, `components/layer-panel.tsx`).
- **Snapping** — object (edges/centers, WASM-accelerated) + grid + smart spacing guides
  (`utils/object-snapping.ts`, `utils/snap-renderer.ts`).
- **Selection** — marquee, lasso, select-by-same-property, multi-select transform box.
- **Style** — copy/paste style, stroke width/style, opacity, corner radius, 8 arrowheads,
  color palettes (`utils/object-context-actions.ts`, `config/color-palettes.ts`).
- **Fills** — linear/radial/conic gradients, multi-stop editor, 50+ presets, image fill,
  18 blend modes (`config/gradient-presets.ts`).
- **Drawing** — freehand pens (fineliner/inkbrush/marker) with pressure, velocity,
  stabilization; smart-shape recognition.
- **Scale** — ~150 shape types; scripting API (`api.ts`, `window.Yappy`); WASM
  geometry/hit-test/routing/snapping.

**Partial (the roadmap's quick-win surface):**
- **Skew/shear** — only `perspectiveBlock`, not general shapes.
- ~~**Numeric transform input** — angle only; no X/Y/W/H/scale fields~~ **DONE (0.8.81):** the
  **Transform** section in the property panel gives X/Y/W/H + rotation° fields (`TransformControls`),
  and `setElementTransform` accepts `angle`.
- **Distribute** — distributes *centers* only (no equal-gap / edge variants).
- ~~**Dashes** — solid/dashed/dotted presets only (no custom dash-pattern UI)~~ **DONE (0.8.82):**
  custom on/off pixel dash arrays (`strokeDashArray` / `PaintStroke.dashArray`) via the Stroke Dash
  panel + `setStrokeDash` API; shared `utils/stroke-dash.ts` resolver covers canvas + SVG export.
- **Align target** — selection bounding box only (no align-to-canvas / key-object).
- ~~**SVG export** — rough.js-per-shape with a **raster fallback**~~ **DONE (0.27.58–60):**
  shapes/paths now serialize to real `<path>`s (sketch → rough vector, architectural →
  clean path, even-odd holes, rotation/flip); raster fallback only for shapes with no
  geometry. `utils/export.ts`.

**Done since this doc (keystone + path toolkit):**
- ✅ **Editable vector path + Pen tool**, **node editing** (simple *and* compound/holes),
  **Convert to Path**, **WASM hit-test parity**.
- ✅ **Pathfinder booleans** (unite/subtract/intersect/exclude).
- ✅ **Path ops** — outline-stroke, offset-path, **simplify, join, make/release compound path**.
- ✅ **Multi-subpath / compound paths** (holes via even-odd), even-odd hit-test.
- ✅ **True vector SVG export** (above).

**Still missing (the remaining Illustrator work):**
- ✅ **Artboards** (#14) — DONE (0.27.85): `store.artboards` labelled export-region frames
  (`renderLayersAndElements` pass) + presets + `addArtboard('selection')`; per-board PNG
  region export (`exportArtboard`). Right-click → Artboards. Persisted + undoable. Deferred:
  on-canvas drag/resize handles.
- ✅ **Symbols / instances** (#6) — DONE (0.27.84): `SymbolDef` in `store.symbols` + a
  `symbolInstance` rendered live from the def. Right-click → Create Symbol / Detach Instance;
  API `createSymbol/placeInstance/redefineSymbol/detachInstance`. Persisted + undoable.
  Deferred: edit-in-place mode + Symbols panel UI.
- ✅ **Clipping masks** (#3) — DONE (0.27.74): right-click → Make/Release Clipping Mask
  (Ctrl+7 / Ctrl+Alt+7); top object clips the rest to its outline (`utils/clip-mask.ts`,
  one hook in the render loop; clip-aware hit-test). Opacity masks DONE 0.27.80 (offscreen + luminanceToAlpha).
- ✅ **Appearance stack** (#11) — core DONE (0.27.75): `el.appearance.{fills,strokes}` drawn
  over the base shape (additive post-pass, both styles via `RenderPipeline.renderAppearance`).
  API + right-click → Appearance + a reorderable Appearance panel section (0.27.81). SVG export of extras DONE 0.27.79.
  **Pattern stack-fills DONE (0.5.13):** a `PaintFill` can carry a `PatternFill` (built-in motif or library
  swatch), rendered clipped in both styles via a per-fill picker in the Appearance panel. SVG export emits a
  real tiling `<pattern>` for architectural appearance fills (0.5.14, via the shared `svgPatternDef` helper);
  sketch SVG approximates with the foreground colour (rough.js can't reference a pattern).
- ✅ **Image trace** (#13) — DONE (0.27.76): threshold trace (marching squares + stitch + RDP)
  vectorizes a bitmap into an editable `path` with even-odd holes (`utils/image-trace.ts`).
  Right-click image → Image Trace (B&W + colour 6/12/16); API Yappy.traceImage({colors}). Centre-line trace DONE 0.27.83 (Zhang–Suen skeleton).
- ✅ **Free transform** — DONE (0.27.65–0.27.68): rotation-aware resize, movable rotation
  pivot, numeric X/Y/W/H panel, reflect-across-pivot, and **shear** (decomposed `shearX`/
  `shearY` with WASM/export parity + Ctrl-drag-side-handle gesture). Remaining adjacent
  work: **envelope-warp** (per-corner / mesh distort — needs a 4-point quad the decomposed
  model can't hold; build alongside #10).
- ✅ **Envelope-warp + mesh-warp** — DONE (0.27.69–0.27.70): non-affine free-distort by an
  R×C control-point grid (`utils/envelope-warp.ts`). Right-click → Path → *Envelope Distort*
  (2×2) or *Mesh Warp →* 2/3/4/5× (interior control points). Warp-aware render (both styles),
  hit-test (cell search + inverse bilinear), SVG export; legacy 4-corner `{corners}` read as
  a 2×2 grid. **Bicubic smoothing** (0.27.71, Catmull-Rom grid subdivision) + **image warp**
  (0.27.72, per-triangle texture mapping), warped-image SVG export + **Apply/Bake Warp**
  (0.27.73, Illustrator "Expand" — paths→anchors, images→raster) all done. Warp track complete.
- ~~**Free transform / envelope-warp.**~~ *Phase 1a done (0.27.65): rotation-aware resize —
  resizing a rotated element scales along its own axes with the opposite handle pinned
  (`selection-handler.ts` `handleResize`, `RESIZE_ANCHOR_SIGNS`). Phase 1b done (0.27.66):
  movable rotation pivot — right-click / long-press → "Set Rotation Point Here", draggable
  crosshair, rotation orbits about it (`utils/transform-pivot.ts`). Phase 2 done (0.27.67):
  numeric X/Y/W/H panel fields (W/H scale relative geometry via `utils/geometry-scale.ts`
  + `setElementTransform`) and reflect-across-pivot (`flipSelected(dir, axisValue)`). Next:
  shear (`shearX/shearY` decomposed fields) and transform-again wiring.*
- ✅ **Pattern fills** (#11 sub-item) — DONE (0.5.10): `fillStyle: 'pattern'` + `el.patternFill`
  (`utils/pattern-fill.ts`) — 5 seamless motifs (stripes/grid/dots/checker/crosshatch) with
  colour/background/scale/spacing/thickness/angle. Rasterized-tile-into-shape-clip render (mirrors
  mesh/image, so both styles + the SVG exporter get it free); true-vector `<pattern>` SVG export
  (`utils/svg-paint.ts`). Right-panel PatternEditor + `Yappy.applyPatternFill/setPatternFill`.
  Pattern-from-selection DONE (0.5.11): `createPatternFromSelection` captures selected artwork into a
  raster tile (`utils/pattern-capture.ts`) and spawns a preview rect with a `type:'custom'` pattern;
  right-click → *Make Pattern from Selection*. Reusable pattern-swatch library DONE (0.5.12):
  doc-level `store.patterns` (named `PatternFill`s) with a draggable **Patterns** panel
  (`components/patterns-panel.tsx`, Alt+P) — capture artwork (＋), save a shape's pattern (*Save to
  Library*), apply/redefine/rename/delete; persisted + undoable; API
  `addPatternSwatchFromSelection/savePatternSwatchFromElement/applyPatternSwatch/…`. Live-link swatch
  propagation DONE (0.5.13): `el.patternSwatchId` (cf. `fillSwatchId`) — redefining a swatch updates all
  linked shapes; direct pattern edits break the link. Multiple fills/strokes ships via the appearance
  stack (above), now incl. pattern stack-fills (0.5.13). Gradient-mesh is already separate/done.
- **Rulers + persistent draggable guides; image trace; symbols/instances.**

## 2. Architecture facts that drive complexity

- Flat `DrawingElement` with a **single** stroke/fill — no appearance stack, no
  multiple fills/strokes, no swatch references.
- **No editable freeform vector-path element.** Anchor/handle editing exists only for
  connector `controlPoints` and animation motion paths (`path-editor-overlay.tsx` +
  `utils/math/path-utils.ts`, M/L/Q/C/Z).
- Geometry/hit-test is shape-type-specific with JS↔WASM parity (`utils/geometry.ts` ↔
  `wasm/assemblyscript/assembly/geometry.ts`). New geometric types need parity in both,
  or a generic path fallback.
- Property editing is declarative (`config/properties.ts`,
  `config/quick-toolbar-config.ts` → `property-panel.tsx`/`quick-toolbar.tsx`) — new
  properties are cheap to surface.
- Manipulation lives in `utils/tool-handlers/selection-handler.ts`
  (`handleControlPointDrag`, `handleSegmentDrag`, `handleResize`); anchor infra exists
  (`utils/anchor-points.ts`, `utils/handle-detection.ts`).

## 3. Tier 1 — high impact, fits the architecture

| # | Feature | Size | Notes |
|---|---------|------|-------|
| 1 | **Editable vector path element (`pen`/`path`)** | L | The keystone — see [vector-path-tool-spec.md](vector-path-tool-spec.md). Most items below depend on it. |
| 2 | **Pathfinder booleans** + outline-stroke + offset-path | M–L | Sample shape outlines → polygon clipping → new `path`. Ref: Inkscape `src/path/path-boolop.cpp`. Needs #1. |
| 3 | **Clipping & opacity masks** | M | Add `clipTargetId`/`maskId`; reuse renderer's existing `clipPath` primitive at element level. |
| 4 | **Variable-width strokes + dash/arrow presets** | M (S for presets) | Extend `RenderPipeline.applyStrokeStyle`; pressure-width is the precedent; presets via `config/properties.ts`. |
| 5 | **Eyedropper + global swatches** | S / M | Eyedropper builds on `copyStyle`/`pasteStyle`; global swatches = doc-level palette with `swatchId` refs. |
| 6 | **Symbols / instances** | L | Symbol library + instance refs with an override layer; extends `hierarchy.ts`/`reparent.ts`. |
| 7 | **Align-to-key-object + distribute-by-spacing** | S | Incremental on `utils/alignment.ts` + AlignmentControls. |
| 8 | **Path-based SVG export** | M–L | Implement an `SvgRenderer` against `IRenderer` to replace the raster fallback in `utils/export.ts`. |

## 4. Tier 2 — valuable, larger

- **9. Free transform + distort/shear/reflect + transform-again** (L) — generalize
  `handleResize` to a matrix with a movable reference point and a repeat-last command.
- **10. Envelope / warp distort** (L–XL) — mesh-warp a sampled path; reuses
  `math/morph-utils.ts` + #1.
- **11. Pattern fills + multiple fills/strokes (appearance stack)** (L / XL) — pattern =
  tiled symbol; multiple fills/strokes requires `fills[]`/`strokes[]` across
  `RenderPipeline` + `properties.ts` + migration. *Second foundation.*
- **12. Gradient mesh** (XL) — new fill type + editor + likely WASM rasterizer.
- **13. Image trace / vectorize** (L–XL) — raster→vector emitting #1 paths. Ref:
  Inkscape `src/trace/`.
- **14. Artboards** (M–L) — re-skin the existing `slides` multi-frame system.
- **15. Appearance panel + graphic styles + isolation mode** (L, after #11).

## 5. Tier 3 — nice to have / niche

Join/average/simplify anchors (S–M, on #1) · recolor artwork (M) · blend tool (M) ·
live shapes / radial-grid repeat (M) · rulers + persistent guides (M) · measure tool (S) ·
undo-history panel (S, UI only — `HistorySnapshot`/`pushToHistory` exist) ·
convert-text-to-outlines (M–L, easy once #1 exists) · CMYK / OpenType / area-type.

## 6. Sequencing & status

**Status:** roadmap accepted; nothing in Tier 1+ started yet (current vector work is the
existing freehand pens + connector control points only).

1. **Keystone first — #1 editable vector path** ([spec](vector-path-tool-spec.md)). #2,
   #8, #10, #13, and convert-to-outlines all depend on it.
2. **Appearance-model refactor (#11 → #15)** as the second foundation — multiple fills,
   graphic styles, and the appearance panel hang off it.
3. **Quick-wins track, in parallel** (independent, low-risk, mostly config/UI over
   existing logic):
   - Numeric **X/Y/W/H/angle** transform panel (extend `config/properties.ts`).
   - **Align-to-canvas + align-to-key-object** and **distribute-by-spacing** (#7).
   - **Dash / arrowhead presets** (#4, presets-only slice).
   - **Eyedropper** (#5) over `copyStyle`/`pasteStyle`.
   - **Undo-history panel** (Tier 3, UI only).

## 7. Reusable building blocks (extend, don't rebuild)

| Capability to add | Reuse / extend |
|-------------------|----------------|
| Path geometry & sampling | `utils/math/path-utils.ts` (`parsePath` M/L/Q/C/Z, length, `getPointOnPath`, smooth/unsmooth) |
| Node/anchor editing UX | `components/path-editor-overlay.tsx` (anchor + control-point drag, add point, smooth/corner toggle) — rebind from animation path to shape path |
| Anchor/handle hit-testing | `utils/anchor-points.ts`, `utils/handle-detection.ts` |
| Drag manipulation | `selection-handler.ts` `handleControlPointDrag` / `handleSegmentDrag` / `handleResize` |
| Fill/stroke/clip/gradient render | `shapes/base/render-pipeline.ts`, `rendering/IRenderer.ts` (`clipPath` primitive used for image fills) |
| New properties in panels | `config/properties.ts`, `config/quick-toolbar-config.ts` |
| New element field persistence | `utils/migration.ts` (passthrough, e.g. `parentId`/`mindmapDir`) |
| SVG export | `rendering/IRenderer.ts` (implement `SvgRenderer`), `utils/export.ts` |
| Style copy / global colors | `utils/object-context-actions.ts` (`copyStyle`/`pasteStyle`), `config/color-palettes.ts` |

## 8. Key files

- `frontend/src/types.ts` — model: path / appearance / symbol / mask fields.
- `frontend/src/shapes/base/render-pipeline.ts` — fills/strokes/clip/gradient (appearance, masks, variable stroke).
- `frontend/src/utils/tool-handlers/selection-handler.ts` — anchor/handle/free-transform editing.
- `frontend/src/utils/math/path-utils.ts` + `frontend/src/components/path-editor-overlay.tsx` — reuse for the editable vector-path tool.
- `frontend/src/rendering/IRenderer.ts` — implement `SvgRenderer` for path-based SVG export; `frontend/src/utils/export.ts`.
