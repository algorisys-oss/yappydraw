# Yappy → Illustrator-Power Roadmap

> **Canonical, operationalized version:** [docs/vector-illustration-roadmap.md](docs/vector-illustration-roadmap.md)
> (validated current-state corrections, sprint-ready Tier 1 sequencing, and a
> reusable-building-blocks table). Keystone deep-dive:
> [docs/vector-path-tool-spec.md](docs/vector-path-tool-spec.md). This root file is the
> original brief; keep edits in the `docs/` versions going forward.

Prioritized feature roadmap for moving Yappy toward Adobe Illustrator-class
vector power. Capabilities below were verified against `.repograph/index.txt`
and `frontend/src/types.ts`. Complexity: **S**mall / **M**edium / **L**arge / **XL**.

Reference codebases for these features live at `/home/rajesh/opensource/graphics/inkscape`
(vector paths, pathfinder/boolean ops, LPE, SVG, 2geom) and `.../krita` (brush
engines, stylus input, layers/masks) — see CLAUDE.md.

---

## What Yappy already has

- **Shapes** — ~150 `ElementType`s (`types.ts:2`): geometric, UML, BPMN, data
  structures, wireframe/UI, sketchnote, infra/cloud, charts. Per-family renderers
  under `shapes/renderers/*` via `register-shapes.ts` + `RenderPipeline`.
- **Freehand pens** (fineliner/inkbrush/marker) with pressure (`pressures?: number[]`)
  + velocity width; **smart-shape recognition** (hold-to-correct, `utils/shape-recognition.ts`).
- **Connectors** — line/arrow/bezier/elbow/polyline with bindings + `controlPoints`,
  WASM elbow routing.
- **Text + rich text**, **text-on-path / curved text** (`utils/text-on-path.ts`),
  **tables**, **images** (filters/effects), **video**.
- **Fills/strokes** — linear/radial/conic gradients (multi-stop, draggable handles),
  image fill, blend modes, shadows. *Single* fill + single stroke per element.
- **Layers + groups**, **minimap**, **slides/presentation** (transitions, morph,
  keyframes, motion paths, flow), **align/distribute**, **grid + snapping + object
  snapping**, **crop**, **non-destructive partial erase**.
- **Templates**, **AI generation**, **DSL/Mermaid import**, **export** PNG/JPG/PDF/
  PPTX/HTML **and SVG** (`utils/export.ts:153` — rough.js-per-shape with raster
  fallback, so a *quality* gap, not missing), **WASM** geometry/hit-test/routing/
  snapping/sketch, **scripting API** (`api.ts`).

## Architecture facts that drive complexity

- Flat `DrawingElement` model with a **single** stroke/fill — no appearance stack,
  no multiple fills/strokes, no swatch references.
- **No editable freeform vector-path element.** Anchor/handle editing exists only
  for connector `controlPoints` and animation motion paths (`path-editor-overlay.tsx`
  + `math/path-utils.ts`, M/L/Q/C).
- Geometry/hit-test is shape-type-specific with JS↔WASM parity (`utils/geometry.ts`
  ↔ `wasm/assemblyscript/assembly/geometry.ts`, etc.). New geometric types need
  parity in both, or a generic path fallback.
- Property editing is declarative (`config/properties.ts`, `config/quick-toolbar-config.ts`
  → `property-panel.tsx`/`quick-toolbar.tsx`) — new properties are cheap to surface.
- Manipulation lives in `selection-handler.ts` (`handleControlPointDrag`, `handleSegmentDrag`,
  `handleResize`). Anchor infra already exists (`utils/anchor-points.ts`, `handle-detection.ts`).

---

## Tier 1 — High impact, fits the architecture

1. **Editable vector path element (`pen`/`path` type)** — *the* keystone gap; most
   items below depend on it. Store M/L/C/Z segments (extend `math/path-utils.ts`),
   reuse `path-editor-overlay.tsx` UX bound to a *shape* (not an animation);
   add/delete/convert-anchor + handle drag in `selection-handler.ts`; generic path
   renderer + geometry/hit-test WASM parity. **L**
2. **Pathfinder booleans** (union/subtract/intersect/exclude) + outline-stroke +
   offset-path — sample shape outlines (renderer `definePath`/`shape-geometry.ts`) →
   polygon clipping (martinez/polygon-clipping or small WASM kernel) → new path
   element. Reference: Inkscape `src/path/path-boolop.cpp`. **M–L** (needs #1)
3. **Clipping & opacity masks** — add `clipTargetId`/`maskId`; reuse the renderer's
   existing `clipPath` primitive (`IRenderer.ts`, used for image fills) at element
   level in `RenderPipeline`/`shape-renderer.ts`. **M**
4. **Variable-width stroke profiles + dash presets + richer arrowheads** — extend
   `RenderPipeline.applyStrokeStyle`; pressure-width is the precedent. Dash/arrow
   presets via `config/properties.ts`. **M** (S for presets alone)
5. **Eyedropper + Swatches / global colors** — eyedropper builds on `copyStyle`/
   `pasteStyle` (`object-context-actions.ts`); global swatches = doc-level palette
   (model after `config/color-palettes.ts`) with `swatchId` refs for live re-tint.
   **S** (eyedropper) / **M** (global swatches)
6. **Reusable symbols / instances** — symbol library + instances referencing a
   symbol id with an override layer; extends grouping/hierarchy (`hierarchy.ts`,
   `reparent.ts`). **L**
7. **Align-to-key-object + distribute-by-spacing** — incremental on `utils/alignment.ts`
   + `utils/spacing.ts` + `AlignmentControls`. **S**
8. **Path-based SVG export** — implement an `SvgRenderer` against the existing
   `IRenderer` abstraction (one impl covers all shapes) to replace the raster
   fallback in `export.ts:153`. **M–L**

## Tier 2 — Valuable, larger

9. **Free transform + distort / shear / reflect around a reference point +
   transform-again** — extend `selection-handler.ts handleResize` (already does
   rotate/skew) to a general matrix + movable reference + repeat-last command. **L**
10. **Envelope / warp distort** — mesh-warp a sampled path; reuses `math/morph-utils.ts`
    (`resamplePolygon`) + #1. **L–XL**
11. **Pattern fills + multiple fills/strokes (appearance stack)** — pattern fill =
    tiled symbol (builds on `backgroundImageFit:'tile'`); multiple fills/strokes
    requires moving from scalar style fields to `fills[]`/`strokes[]` across the
    whole `RenderPipeline` + `properties.ts` (+ migration). **L** / **XL**
12. **Gradient mesh** — new fill type with its own editor and likely a WASM
    rasterizer. **XL**
13. **Image trace / vectorize** — raster→vector (potrace-style) emitting #1 path
    elements; optional WASM. Reference: Inkscape `src/trace/`. **L–XL**
14. **Artboards** — the `slides` system is already a multi-frame substrate;
    re-skin slides as design artboards (per-artboard bounds + export). **M–L**
15. **Appearance panel + graphic styles + isolation mode** — depend on the
    appearance stack (#11); graphic styles = saved appearance presets; isolation =
    focus filter over the existing hierarchy. **L** (after #11)

## Tier 3 — Nice to have / niche

- **Join / average / simplify anchors** — utilities on #1 paths. **S–M**
- **Recolor artwork** (bulk hue remap) — extends `object-context-actions.ts` + #5. **M**
- **Blend tool / spin** (interpolated in-betweens) — reuse morph interpolation. **M**
- **Live shapes / repeat radial-grid patterns** — store generators. **M**
- **Rulers + persistent draggable guides** — grid/snap exists; add guide objects + ruler UI. **M**
- **Measure tool** — renderer already referenced in `selection-handler.ts`; surface as a tool. **S**
- **Undo-history panel** — `app-store.ts` already has `HistorySnapshot` + `pushToHistory`; UI only. **S**
- **CMYK / OpenType / area-type / text-wrap / convert-text-to-outlines** —
  convert-to-outlines is easy once #1 exists (glyph outline → path). **M–L** each

---

## Suggested sequencing

1. **Editable vector path element (#1)** first — #2, #8, #10, #13, and
   convert-to-outlines all depend on it.
2. **Appearance-model refactor (#11/#15)** as the second foundation — multiple
   fills, graphic styles, and the appearance panel all hang off it.
3. **Quick wins in parallel** — #4 dash/arrow presets, #5 eyedropper, #7
   align-to-key, undo-history panel (isolated, well-factored config/UI surfaces).

## Key files

- `frontend/src/types.ts` — model: path / appearance / symbol / mask fields
- `frontend/src/shapes/base/render-pipeline.ts` — fills/strokes/clip/gradient (appearance, masks, variable stroke)
- `frontend/src/utils/tool-handlers/selection-handler.ts` — anchor/handle/free-transform editing
- `frontend/src/utils/math/path-utils.ts` + `frontend/src/components/path-editor-overlay.tsx` — reuse for the editable vector-path tool
- `frontend/src/rendering/IRenderer.ts` — implement `SvgRenderer` for path-based SVG export; `frontend/src/utils/export.ts:153`
