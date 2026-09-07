# Canvas (view) rotation — research & decision

**Date:** 2026-06-18
**Status:** **Implemented (2026-06-20) — scoped "sketch mode".** User feedback confirmed that for larger illustrations, rotating the canvas to draw at one's most confident stroke angle is valuable — flipping the cost/benefit below. Built along the recommended scoped path. See the implementation notes at the end.

## Original decision (2026-06-18, superseded)

We evaluated adding **view rotation** (rotate the whole canvas, Procreate-style) and initially decided **not to build it**.

**Rationale**

- Rotation and infinite canvas are **orthogonal**. Infinite canvas solves *reach* (pan/zoom anywhere); rotation solves *wrist ergonomics* (turn the "paper" so a curve falls at a natural angle while sketching). Having infinite canvas does **not** make rotation redundant — but it also means rotation adds no navigation value.
- YappyDraw is primarily a **diagramming tool** (flowcharts, UML, wireframes, mindmaps), which is read/built **axis-aligned**. The only genuine beneficiary of view rotation is **freehand pen sketching on a tablet** — a secondary use case here.
- The cost is **lopsided**: input is cheap, but the DOM overlays are expensive to make rotation-correct (details below). Poor ROI for the benefit.

## What we learned about the architecture

### Cheap side — input & world-space logic

- **Single screen→world chokepoint:** `getWorldCoordinates()` in `frontend/src/components/canvas.tsx:444`
  (`(clientX - rect.left - panX) / scale`). Adding an inverse-rotation step here (un-rotate about the
  viewport center by `-θ` after subtracting pan, before dividing by scale) makes the entire input path correct.
- Because of that, these are **pure world-space and need no changes** once screen→world accounts for `θ`:
  - Hit-testing — `frontend/src/utils/hit-testing.ts` (already un-rotates by *per-element* `angle`)
  - Marquee / lasso select — `frontend/src/utils/tool-handlers/selection-handler.ts`
  - Object snapping — `frontend/src/utils/object-snapping.ts`
  - Connector routing — `frontend/src/utils/routing.ts`
  - Single-element resize/rotate handles (positions derive from world coords)
- **WASM bridges take only world coords** (hit-testing / snapping / geometry / routing) → **no WASM changes**.
- A few inline screen→world copies would also need the same inverse: `app.tsx` (drag-drop ~733, ~910),
  `utils/tool-handlers/canvas-event-handlers.ts` (~260), `components/status-bar.tsx` (~122),
  `components/minimap.tsx` (~136/~184).

### Render chokepoint

- The main view transform is a single block: `frontend/src/components/canvas.tsx:282-294`
  (`setTransform(1,0,0,1,0,0)` → `translate(panX,panY)` → `scale(scale,scale)`).
  Adding `ctx.rotate(θ)` here rotates **all canvas-rendered content** (shapes, ink, selection overlays,
  grid, slide boundaries) for free. Selection/handle rendering already uses `rotatePoint()` so it composes.

### Expensive side — DOM overlays (the real tax)

~20+ sites compute on-screen position manually as `world * scale + pan`. Difficulty to make rotation-aware:

| Overlay | File | Difficulty |
|---|---|---|
| Rich-text editing | `components/rich-text-editing-overlay.tsx` | Easy (already uses CSS transform; add `rotate()`) |
| Path editor | `components/path-editor-overlay.tsx` | Easy (SVG transform string; add `rotate()`) |
| Minimap viewport rect | `components/minimap.tsx` | Easy (canvas-drawn; transform before draw) |
| Scroll-back button | `components/scroll-back-button.tsx` | Easy (viewport-bounds visibility check) |
| Color-drop HUD | `components/color-drop-hud.tsx` | None (screen-space, follows finger) |
| Context menu | `components/context-menu.tsx` | None (screen-space, cursor-anchored) |
| Video overlay | `components/video-overlay.tsx` | Moderate (drag delta must **un-rotate**) |
| Quick toolbar | `components/quick-toolbar.tsx` | Moderate (rotate about anchor + collision logic) |
| **Text editing** | `components/text-editing-overlay.tsx` | **Hard** — UML section bounds and table-cell grids assume axis-aligned layout |

### ViewState changes if revisited

- Type: `frontend/src/types.ts:524` — `ViewState { scale, panX, panY }`. Add `rotation: number`.
- ~14 init/reset sites in `frontend/src/store/app-store.ts` need `rotation: 0`: the default state,
  `setViewState`, `zoomToFit`, `zoomToSelection`, `zoomToFitSlide`, slide `lastViewState` restore, and template loads.
- Reusable math already exists: `rotatePoint` / `unrotatePoint` in `frontend/src/utils/geometry.ts:177`.

## Recommended path *if* this is ever revisited

1. **Scope it to a tablet "sketch mode"**, not a global feature: rotate the canvas content (render chokepoint)
   + fix the input inverse (`getWorldCoordinates`). That alone gives correct drawing/selection/snapping.
2. **Defer or disable the hard DOM overlays while rotated** (especially text-editing on UML/tables) rather than
   making every overlay rotation-perfect on day one.
3. **First introduce a central transform helper** (e.g. `utils/viewport-transforms.ts` with
   `worldToScreen` / `screenToWorld`) and migrate the ~20 inlined `world*scale+pan` sites to it — the math is
   currently duplicated everywhere, which is what makes rotation risky. Centralizing is the prerequisite.

## Implementation notes (2026-06-20)

Built exactly along the recommended scoped path above.

**Model.** `ViewState.rotation?: number` (radians, default 0). The render CTM is
`Rot(θ, C)·translate(pan)·scale`, where `C` is the viewport centre. `utils/viewport-transforms.ts`
(`worldToScreen`/`screenToWorld`) is the single source of truth and inverts exactly this; when
`rotation` is falsy it reduces to the legacy `world*scale+pan`, so the centralization migration was a
behavioural no-op (shipped first, verified, then rotation layered on).

**Prerequisite refactor (step 0).** Created `viewport-transforms.ts` and migrated the ~20 inlined sites
(input chokepoint, gesture anchor, app.tsx drag-drop, status-bar, canvas-event-handlers, path-editor,
text-editing-overlay ×11, rich-text/video/ds-ops overlays, quick-toolbar). Minimap and scroll-back use a
separate minimap-local / viewport-bounds coordinate system and were intentionally left alone.

**Cheap core.**
- Input: `getWorldCoordinates` → `screenToWorld(..., viewportTransform())`, where `viewportTransform()`
  adds `centerX/centerY = canvasRef.width/2, height/2` (canvas is full-window, so screen px = CSS px 1:1).
- Render: `ctx.rotate` about the centre, applied *outermost* in the existing `save→translate→scale` block
  at `canvas.tsx`. Added `store.viewState.rotation` to the redraw effect's tracked deps.
- World-space logic (hit-test, snap, route, marquee, **all WASM**) needed **no changes**, as predicted.

**Controls.**
- Two-finger twist: `twoFingerMetrics` gained `angle`; `updateGesture` folds rotation into the
  centroid-anchored pinch/pan solve (`pan = Rot(θ,C)⁻¹(centroidNow) − world·scale`). 5° deadzone so pure
  pinch/pan doesn't drift; settles to upright within 3° on release.
- Keyboard: `Shift+,`/`Shift+.` rotate 15°, `Shift+0` resets.
- UI: a compass dial in the status bar (`status-bar.tsx`) — needle tilts with the view, shows degrees,
  click resets. Only visible when rotated.
- Store actions: `rotateView(Δ)` / `resetRotation()` (with a ±2° snap-to-upright detent) in `app-store.ts`;
  `currentViewport()` exposes viewState + window-centre pivot for DOM overlays.

**Scoped-mode boundary (deferred DOM-overlay tax).** While rotated:
- **Text editing is blocked** at the `editingId` setter chokepoint (covers double-click, text-tool
  placement, UML/table cells, and the rich-text overlay) with a "Shift+0 to edit text" toast — the
  UML-section/table-cell layouts assume axis-aligned and aren't rotation-correct yet.
- **Path editing is blocked** at `setPathEditing` (the SVG overlay isn't rotation-aware) with a toast.
- **Quick-toolbar is hidden** (its placement assumes an axis-aligned screen bbox).
- ds-ops-panel and video-overlay anchor correctly via `currentViewport()` (they hang upright off a true
  world point).

**Known v1 limitations** (acceptable for the sketch use case; revisit if needed): minimap viewport rect and
scroll-back-button bounds aren't rotation-aware; the video controls box stays axis-aligned over a rotated
video; fit/zoom-reset operations replace the view and so reset rotation to 0 (consistent, since their
framing math assumes upright).
