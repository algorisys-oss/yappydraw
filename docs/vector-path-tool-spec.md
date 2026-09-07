# Keystone Spec — Editable Vector Path + Pen Tool

> **Tier 1 #1** of the [Vector Illustration Roadmap](vector-illustration-roadmap.md).
> This is *the* keystone: pathfinder booleans, outline-stroke/offset, envelope-warp,
> shape→path conversion, and convert-text-to-outlines all depend on having a generic,
> editable vector-path element. **Date:** 2026-06-24.
> **Status:** ALL phases shipped & verified — 1 (model/render/hit-test/resize/API),
> 2 (Pen tool), 3 + 3b (full node editing), **4 (WASM hit-test parity)**, and
> 5 (pathfinder booleans). The editable vector path keystone is feature-complete.
>
> ✅ **Convert to Path** (follow-on): any shape → an editable `path` in place (same id /
> z-order / style / bindings). `utils/shape-to-path.ts` produces clean anchors —
> ellipse/circle → 4 smooth Bézier anchors, rectangle → 4 corners, polygonal shapes →
> exact corner anchors, arbitrary `path`/`multi` geometry → sampled outline simplified
> with Ramer–Douglas–Peucker. `app-store.convertToPath` + `api.convertToPath` +
> right-click "Convert to Path". Verified: rect→4 corners, circle→4 smooth, star→10
> anchors, all node-editable.
>
> ✅ **Outline Stroke & Offset Path** (`utils/path-offset.ts` + `outlineStroke` /
> `offsetPath` in app-store + `api.outlineStroke` / `api.offsetPath` + a right-click
> **Path** submenu — Outline Stroke, Offset Path (+10/−10)). *Outline stroke* turns a
> stroked centerline into a filled `path` outline via the **Minkowski sum** of the
> polyline with a disk of radius `strokeWidth/2` (union of a rectangle per segment + a
> disk per vertex for round joins/caps, through `polygon-clipping`); the source element is
> replaced, filled with its stroke color, no stroke. *Offset path* adds a **parallel**
> `path` displaced by ±distance (miter-bisector with a bevel clamp, oriented by signed
> area so `+` always grows outward), keeping the original. Both flatten curves to a
> polyline first (corner anchors out). **Known limits:** inner-ring holes are dropped
> (single-subpath limitation, same as the booleans). Verified in-app: a 16px line →
> 216×16 filled outline; a 120² closed square offset +20 → 160², −20 → 80².
>
> ✅ **Multi-subpath paths (holes / compound paths)** (`pathSubpaths?: {anchors,closed}[]`
> on `DrawingElement`, superseding the single `pathAnchors`/`pathClosed`). A path can now
> hold multiple subpaths so it can have **holes** (donut, the counter of an “O”) or disjoint
> islands. Central helpers: `getPathSubpaths(el)` (normalize) and `subpathsToPathData()`
> (concatenate per-subpath `d`); geometry flags `evenOdd` when >1 subpath, and the renderer
> fills with the **even-odd** rule (`fillPath(d, 'evenodd')` → Canvas `ctx.fill(path2d,
> 'evenodd')`; rough.js solid fill respects it too, so **both** sketch and architectural
> styles show the hole). Hit-testing does even-odd across subpaths (XOR of point-in-polygon
> over each closed subpath), so clicking a hole clicks through. Holes are **produced
> automatically**: `runBooleanOp` now returns `Poly[]` (outer ring + holes) via
> `polyToPathSubpaths`, and `computeOutlineStroke`/`computeOffsetPath` return `Poly[]` too —
> so **Subtract** and closed-loop **Outline Stroke** keep their inner rings instead of
> dropping them. `app-store.buildPathFromPoly` emits a node-editable single-anchor path for a
> simple ring, or a `pathSubpaths` compound path when holes are present. `api.createMultiPath`
> creates one directly. Resize scales subpaths (`scalePathSubpaths`). **Bonus fix:** a
> zero-area marquee no longer selects by bounding box, so clicking a hole (or any shape's
> transparent bbox corner) clicks through. Verified in-app (both styles, hit-test, drag-marquee
> intact). **Per-node editing of compound paths** is supported: anchors are addressed by
> `(subpath, index)` (handle ids `path-{kind}-{sub}-{i}`), so every subpath's nodes draw and
> drag, Alt-click converts corner↔smooth, Ctrl-click deletes, and Alt-click a segment inserts —
> on holes and islands alike. A shared read/write layer (`editableSubpaths` /
> `writeEditableSubpaths`) re-normalizes all subpaths to a combined bbox and collapses back to a
> node-editable single-subpath path when only one ring remains.
>
> ✅ **WASM hit-test parity:** `path` is registered as a `SHAPE_COMPLEX` shape in
> `wasm/bridge/hit-testing-bridge.ts`, so WASM does the broad-phase (bbox cull) and
> delegates the narrow phase to JS — reusing the *same* exported `hitTestPathElement`
> the JS-only path uses. No AssemblyScript change needed; results are identical by
> construction. Verified in-app: hit-testing a path with `?wasm=on` vs off gives
> identical results (interior hit, far miss, bbox-region consistent — matching the
> existing convention for other complex shapes like lines).
>
> ✅ **Pathfinder booleans** (`utils/path-boolean.ts` + `applyPathfinder` in app-store +
> `api.pathfinder` + a right-click "Pathfinder" submenu for ≥2 selected): **Unite /
> Subtract / Intersect / Exclude** via the MIT `polygon-clipping` lib. Each element is
> flattened to world polygons (curves sampled), the op is run, and the result rings
> become new editable `path` elements. **Known limits (Phase 5a):** curves are sampled to
> polygons (corner anchors out, some fidelity loss); inner-ring *holes* are dropped
> (a single-subpath path can't render them yet); arc-based (`A`) shapes flatten roughly
> (path elements/pen output use only L/C, so they're exact).
>
> ✅ **Node editing** (a selected path shows anchors + Bézier handles): drag an anchor to
> move it (handles travel with it), drag a handle to reshape (smooth = mirrored, corner =
> independent), **Alt-click** an anchor to convert corner↔smooth. Implemented across
> `handle-detection.ts` (high-priority `path-anchor/in/out` detection, before the bbox
> resize handles so an extreme anchor is node-edited not resized), `selection-renderer.ts`
> (anchor squares + handle circles/lines), and `selection-handler.ts`
> (`handlePathNodeDrag` + `convertPathAnchor`, re-normalizing to the bbox on every edit).
> Gestures also include **Ctrl/Cmd-click an anchor to delete** it (`deletePathAnchor`) and
> **Alt-click a segment to insert** an anchor (`insertPathAnchorAt`, de Casteljau split that
> preserves the curve; straight segments insert a plain corner).
>
> ✅ **Pen tool** (`utils/tool-handlers/pen-path-handler.ts`, tool id `'path'`): click =
> corner anchor, click-drag = smooth anchor (drag sets symmetric handles), click the
> first anchor = close, Enter/Esc/double-click = finish, Backspace = undo last anchor;
> live rubber-band preview. Dispatched from `canvas.tsx` like the polyline tool; toolbar
> button (PenTool icon) in both brainstorm and full modes.
>
> ✅ **Resize now works:** the resize handler scales each anchor (and its in/out Bézier
> handles) by the bbox delta — same mechanism point-based shapes use for `points`
> (`scalePathAnchors` in `selection-handler.ts`; initial anchors are snapshotted at
> drag-start alongside `points`). Move/rotate/select/style/persist all work.

## Goal

A first-class **`path`** element the user creates with a **Pen** tool (click for
corners, drag for curves) and edits node-by-node (move/insert/delete anchors, drag
Bézier handles, convert corner↔smooth, open/close). It renders through the existing
appearance pipeline (so gradients, blend modes, shadows, dashes work for free) and
participates in selection/transform/align/snapping like any other element.

## Why it's tractable here

The hard parts already exist and are reusable:
- **SVG path math** — `utils/math/path-utils.ts` parses `M/L/Q/C/Z`, estimates segment
  length, samples points along the path (`getPointOnPath`), and smooths/unsmooths.
- **Node-edit UX** — `components/path-editor-overlay.tsx` already drags anchors and
  control points, inserts points, and toggles smooth/corner — but is currently bound to
  an *animation* `pathData`. We rebind it to a *shape* path.
- **Anchor/handle infra** — `utils/anchor-points.ts`, `utils/handle-detection.ts`,
  and `selection-handler.ts` `handleControlPointDrag` / `handleSegmentDrag`.
- **Appearance render** — `shapes/base/render-pipeline.ts` + `rendering/IRenderer.ts`
  already do fill/stroke/gradient/`clipPath` for every shape.

The genuinely new work is: the **`path` data model**, the **Pen creation tool**, a
**generic path renderer + hit-test**, and **JS↔WASM geometry parity**.

---

## 1. Data model (`frontend/src/types.ts` + `utils/migration.ts`)

Add `'path'` to the `ElementType` union and store an **editable anchor list** (not a
raw `d` string — a `d` string is derived for rendering/export):

```ts
type PathAnchorKind = 'corner' | 'smooth';
interface PathAnchor {
  x: number; y: number;            // anchor position, RELATIVE to element origin (x,y)
  inX?: number; inY?: number;      // incoming Bézier handle, relative to the anchor (absent = no handle)
  outX?: number; outY?: number;    // outgoing Bézier handle, relative to the anchor
  kind: PathAnchorKind;            // smooth = handles kept collinear; corner = independent
}
// On DrawingElement:
pathAnchors?: PathAnchor[];
pathClosed?: boolean;
```

Notes:
- Coordinates relative to `element.x/element.y` — matches the existing `points`
  convention so move/flip/group/snapping keep working unchanged.
- `width`/`height` are the anchor bbox (kept in sync on every edit) so resize handles,
  selection box, and snapping operate exactly as for other shapes.
- **Migration:** add a passthrough line in `utils/migration.ts` `normalizeElement`
  (`...(el.pathAnchors !== undefined && { pathAnchors: el.pathAnchors })`,
  `...(el.pathClosed !== undefined && { pathClosed: el.pathClosed })`) — same pattern as
  `parentId`/`mindmapDir`.

### Anchor ↔ SVG `d`

Add two helpers to `utils/math/path-utils.ts` (it already parses `d`):
- `anchorsToPathData(anchors, closed, ox, oy): string` — emit `M`, then per segment a
  cubic `C` when either endpoint has a handle else a line `L`, then `Z` if closed.
  (Add `ox/oy` = element origin so output is absolute, matching `parsePath`.)
- `pathDataToAnchors(d): { anchors, closed }` — inverse, for SVG import and
  shape→path conversion. Reuse the existing `parsePath` tokens.

Keeping the editable model as anchors + deriving `d` on demand avoids re-parsing on
every drag and keeps node editing exact.

## 2. Pen tool — creation (`utils/tool-handlers/draw-handler.ts`, new tool `'pen'`)

Add `'pen'` to `ToolType` and a toolbar entry (near the bezier/pen-tool group). Pen is a
**multi-click** tool with its own in-progress state (mirror how polyline/bezier
multi-point creation is staged today):

| Gesture | Result |
|---------|--------|
| Click empty canvas | Add a **corner** anchor (no handles) |
| Click-drag | Add a **smooth** anchor; the drag sets `out` handle, `in` = mirror (symmetric) |
| Move (between clicks) | Live **rubber-band** preview segment from last anchor → cursor |
| Click the **first** anchor | **Close** the path (`pathClosed = true`), finish |
| `Enter` / double-click | Finish as an **open** path |
| `Esc` | Cancel the in-progress path |
| `Backspace` | Remove the last-placed anchor while drawing |
| Hold `Space` | Pan (existing behavior), pen state preserved |

On finish: commit one `path` element (single history entry), recompute bbox, select it.
Reuse `pushStabilizedSample`/snapping for anchor placement so Pen snaps to grid/objects
like other tools.

## 3. Editing — reuse `path-editor-overlay.tsx`

Enter **path-edit mode** by double-clicking a selected `path` (same entry pattern as the
text/table editors via the canvas double-click handler). Generalize the overlay so it
operates on a shape's `pathAnchors` instead of an animation `pathData`:

| Gesture | Result |
|---------|--------|
| Drag anchor | Move the anchor (handles move with it) — reuse overlay drag + `handleControlPointDrag` |
| Drag a handle | Reshape the curve; for `smooth` anchors keep the opposite handle collinear |
| `Alt`-drag a handle | Break symmetry → mark anchor `corner`, move that handle independently |
| `Alt`-click an anchor | Convert `corner` ↔ `smooth` (smooth derives handles from neighbor tangents — reuse Catmull-Rom logic already in the overlay) |
| Click a segment | **Insert** an anchor at that parameter (reuse the overlay's add-point + `getPointOnPath`) |
| Select anchor + `Del` | **Delete** the anchor (re-knit neighbors) |
| Drag first onto last (or a "close" toggle) | Open ↔ close the path |

Every edit updates `pathAnchors`, recomputes `width/height` (bbox) and the derived `d`,
and records history. The overlay already renders anchors/handles; we add the
corner/smooth visual distinction (square vs round) used by every vector editor.

## 4. Rendering, hit-test, bbox

**Render** — one generic path renderer registered like other shapes
(`shapes/register-shapes.ts` → `RenderPipeline`):
- `definePath(ctx)` = the serialized `d` (via `anchorsToPathData`), then the standard
  pipeline applies fill (incl. gradients), stroke (width/dash), opacity, blend mode,
  shadow, and the existing `clipPath` primitive. No special-casing — appearance comes
  for free.
- Rough.js/sketch styling: render the sampled polyline through the existing rough path
  call so `renderStyle: 'sketch'` works (same as freehand strokes).

**Hit-test + geometry** (`utils/geometry.ts`, `utils/hit-testing.ts`):
- Phase 1 (JS-only, ship first): sample `d` to a polyline via `path-utils.ts`; bbox =
  anchor+handle extents; stroke hit = distance-to-polyline ≤ tolerance; fill hit =
  point-in-polygon on the sampled outline. Selection/move/resize/align/snapping then
  work with no further changes (they use bbox + points).
- Phase 2 (per CLAUDE.md WASM-parity rule): mirror the sampler/hit-test in
  `wasm/assemblyscript/assembly/geometry.ts` + bridge in `wasm/bridge/`, so the JS and
  WASM paths produce identical results.

## 5. Properties & API

- **Property panel** — `path` reuses the standard stroke/fill/opacity/gradient groups via
  `config/properties.ts` (declarative — minimal new config). Add an "Edit Path" action
  (enter node-edit mode) and an "Open/Close" toggle.
- **Scripting API** — add to `api.ts`: `createPath(anchors, { closed?, ...style })` →
  id, and `getPath(id)` → `{ anchors, closed }`. Lets tests/automation build paths
  headlessly (used by the verification below).

## 6. Build phases (incremental, each independently verifiable)

1. **Model + render (read-only):** `path` type, `pathAnchors`/`pathClosed`, migration,
   `anchorsToPathData`, generic renderer, JS hit-test/bbox, `createPath`/`getPath` API.
   Verify: `createPath(...)` renders + selects/moves/aligns like any shape.
2. **Pen tool (creation):** the multi-click tool + rubber-band preview + close/finish.
   Verify: draw corners and curves by mouse; one undo removes the whole path.
3. **Node editing:** rebind `path-editor-overlay.tsx`; move/insert/delete anchors,
   drag handles, convert corner↔smooth, open/close. Verify: each op updates `d`/bbox.
4. **WASM parity:** port hit-test/sampler; confirm JS == WASM.
5. **First payoff — booleans (#2):** sample two path outlines → polygon clipping
   (`polygon-clipping`/`martinez` or a small WASM kernel; weigh licensing +
   curve→polygon tolerance + self-intersection handling) → emit a new `path`. Then
   outline-stroke / offset-path, then **convert-shape-to-path** (serialize any renderer's
   outline via `pathDataToAnchors`).

## 7. Risks / decisions to settle before coding

- **Booleans library** — `polygon-clipping` (MIT, robust) vs `martinez` vs a bespoke
  WASM kernel. Curves are clipped as sampled polygons → pick a tolerance and re-fit
  curves after, or accept polyline results initially.
- **WASM parity cost** — Phase 1 ships JS-only; don't block the tool on WASM. Land
  parity before the path element is heavily used in large docs.
- **Sketch rendering of filled paths** — confirm rough.js fills behave on arbitrary
  closed paths (freehand inkbrush already fills polygons, so precedent exists).
- **Overlay generalization** — `path-editor-overlay.tsx` assumes an animation context;
  refactor its data source to a shape adapter so both animation paths and shape paths
  share it (avoid forking the component).

## 8. Verification (when built)

Drive the running app via Playwright + `window.Yappy` (the approach used for recent
mindmap/connector fixes):
- `createPath([...])` → `getPath` returns the anchors; screenshot shows the rendered
  fill+stroke; move/align behaves like other shapes.
- Pen tool: scripted mouse clicks/drags produce a path whose `d` matches expectation.
- Node edit: insert/delete/convert an anchor → assert `pathAnchors` + bbox change.
- Boolean: union two overlapping paths → one path whose area/bbox matches; round-trip
  path-based SVG export and re-import for fidelity.

## Key files (touch list)

- `frontend/src/types.ts` — `'path'` type, `pathAnchors`/`pathClosed`.
- `frontend/src/utils/migration.ts` — passthrough for the new fields.
- `frontend/src/utils/math/path-utils.ts` — `anchorsToPathData` / `pathDataToAnchors`.
- `frontend/src/utils/tool-handlers/draw-handler.ts` — Pen tool creation.
- `frontend/src/components/path-editor-overlay.tsx` — generalize to shape paths.
- `frontend/src/utils/tool-handlers/selection-handler.ts` — anchor/handle drag, edit entry.
- `frontend/src/shapes/register-shapes.ts` + `shapes/base/render-pipeline.ts` — generic path renderer.
- `frontend/src/utils/geometry.ts` / `utils/hit-testing.ts` (+ `wasm/assemblyscript/assembly/`, `wasm/bridge/`) — sample/hit-test + WASM parity.
- `frontend/src/config/properties.ts` — surface path properties + Edit/Open-Close actions.
- `frontend/src/api.ts` — `createPath` / `getPath`.
