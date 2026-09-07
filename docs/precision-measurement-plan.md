# Precision & measurement in Yappy — plan

> **TL;DR.** Yappy already has a strong precision *foundation* — a Measure tool (distance + angle),
> object snapping (alignment guides, WASM-accelerated), equal-spacing detection with **gap labels**,
> draggable ruler guides, grid + snap-to-grid, perspective grid, and a minimap. What's missing to make
> precise, confident *on-object* work feel like Illustrator/Figma is (1) a **live transform HUD**
> (W×H / X,Y / angle badge while you move·resize·rotate — the single biggest win, and it doesn't exist
> today), (2) **measure-to-neighbor on Alt/Option-hover** (on-demand dimension lines to adjacent
> objects and artboard edges), (3) a **richer Measure readout** (the Δx/Δy/diagonal/angle right-triangle
> + area/perimeter), and (4) **smart-guide completeness** (anchor-point / path-intersection / fixed-angle
> snapping). Everything builds on infrastructure that already exists.
> **Date:** 2026-07-11. Complexity: **M** (mostly gap-closing; each phase ships independently).

## 1. Goal

Make it effortless to work *precisely on the object*: always know an element's exact size, position,
and angle while transforming it; measure gaps to neighbors and edges on demand; and snap to the points
that matter (edges, centers, anchors, intersections, fixed angles). Target the general design/diagram
user — not a full CAD dimensioning suite (that's an optional tail phase).

## 2. Current state (validated against the code)

Yappy is already well-equipped; **do not rebuild these**:

- **Measure tool** — `components/measure-overlay.tsx` (gated on `store.measureActive`, toggled via
  `toggleMeasure`). Drag on canvas to read `distance px · angle °`, line persists until next drag,
  Esc/toggle exits.
- **Object snapping** — `utils/object-snapping.ts` → `getSnappingGuides()` returning
  `SnappedResult { dx, dy, guides: SnappingGuide[] }`; threshold-based edge/center alignment,
  WASM-accelerated (with a JS fallback — keep them in sync per CLAUDE.md).
- **Equal-spacing** — `utils/spacing.ts` → `getSpacingGuides()` (`SpacingGuide` / `SpacingResult`),
  rendered by `utils/snap-renderer.ts` → `renderSpacingGuides()` with measurement lines, ticks, and
  **gap labels** (the Figma-style equal-distance indicators).
- **Rulers + draggable guides** — `components/ruler-overlay.tsx`; `store.guides` with
  `addGuide/updateGuide/removeGuide/clearGuides` (also on the scripting API).
- **Grid + snap-to-grid** (`toggleGrid`, `toggleSnapToGrid`), **perspective grid**
  (`togglePerspectiveGrid`), **minimap**, **rulers**.

### What's missing (the gap)

1. **Live transform HUD.** No badge shows an element's **W×H**, position **X,Y**, or **angle** while you
   drag / resize / rotate. Confirmed absent. Every precise editor has this; it's the biggest
   confidence win and the cheapest to add (the bounds are already computed during transforms).
2. **Measure-to-neighbor on hover.** Equal-spacing shows *during* a drag; there's no **on-demand**
   inspection (Figma's Alt/Option-hover) that draws pixel gaps from the selected object to a hovered
   object and to the artboard edges without moving anything.
3. **Richer Measure readout ("the triangle").** The Measure tool shows only `distance · angle`. The
   Illustrator Info-panel behavior decomposes it into **Δx (W), Δy (H), diagonal (D), angle** — the
   right triangle — and for a *selected shape* also **area / perimeter**.
4. **Smart-guide completeness.** Snapping is edge/center of bounding boxes. Missing: snap to **anchor
   points** and **path intersections**, and **fixed-angle** constraint (15°/45°/90° with construction
   lines) while drawing/rotating.
5. *(Optional tail)* **Persistent dimension annotations** — CAD-style dimension lines you place that
   stay and auto-update; for a technical-drawing/architectural audience.

## 3. Phased delivery (each phase ships independently)

| Phase | Deliverable | Leverages | Effort |
|---|---|---|---|
| **1 — Live transform HUD** ✅ **(shipped v0.8.64)** | A screen-space badge that follows the selection during move/resize/rotate showing **W×H**, **X,Y**, **∠**. Idle (just selected): show W×H + position. Updates every pointer move. Built as `components/transform-hud.tsx` (+ css), mounted in `app.tsx` by the other overlays; purely store-derived (no listeners), `pointer-events:none`, hidden in presentation mode + while the Measure tool is active. *v1 note: a rotated single element anchors the badge under its un-rotated frame bottom (`getSelectionBoundingBox` ignores rotation) — refinable later.* | `viewport-transforms` (world→screen), `getSelectionBoundingBox`, the `measure-overlay` overlay pattern | S–M |
| **2 — Measure-to-neighbor (Alt-hover)** 🛠️ **(BUILT on `dev`, pending ship)** | Hold Alt/Option and hover another object → red dimension lines with px gaps between the selection and that object, plus distances to the four artboard edges. Read-only inspection, no move. Built as pure geometry `utils/measure-gap.ts` (`measureGap`/`measureEdges`/`getMeasureSegments`) + `snap-renderer.renderMeasureGaps` (measure-red `#ff3b30`, own grammar so it reads as inspection not snapping); Alt-idle-hover detection in `canvas.tsx` (`e.buttons===0 && e.altKey`, topmost non-locked hit) drives a transient `measureGuides` signal through the existing render-params path — no store/history surface. Artboard = the explicit artboard under the selection centre, else the active slide for paged docs, else none. Scripting: `Yappy.measureBetween(idA, idB, includeArtboardEdges?)`. *v1: axis-aligned bbox (rotation ignored); no click-to-pin, angular/radial come with Phase 3/dimension follow-ups.* | `getMeasureSegments`, `renderMeasureGaps` (mirrors `renderSpacingGuides`) | M |
| **3 — Richer Measure readout** 🛠️ **(BUILT on `dev`, pending ship)** | Extend the Measure tool: show **Δx, Δy, diagonal, angle** (draw the right triangle), and when a single shape is selected show **W/H, area, perimeter**. Built as pure `utils/measure-readout.ts` (`measureLine` → dx/dy/dist/angle with −0 normalised; `shapeMetrics` → shape-aware area/perimeter: circle = πab + Ramanujan circumference, line/arrow = segment length, else bbox) + dashed Δx/Δy triangle legs & leg labels + a `.measure-metrics` card anchored at the selection's top-left in `measure-overlay.tsx`. Scripting: `Yappy.measureShape(id)`. *Deferred: click-two-anchor-points measuring (still free-drag only).* | `measure-overlay.tsx`, geometry utils | S–M |
| **4a — Fixed-angle constraint** 🛠️ **(BUILT on `dev`, pending ship)** | **Shift + 15°** increment snapping while **drawing** a line/arrow, **rotating** an element, and dragging the **Measure** line; the drawn/measure line + the transform-HUD angle act as the construction/readout. Built as pure `utils/angle-constrain.ts` (`constrainToAngle` keeps drag length, snaps to the nearest step, returns the locked display angle; `snapAngleRad` for rotation handles). Wired into `draw-handler.drawOnMove` (line/arrow/bezier; takes precedence over grid snap), the rotate branch in `selection-handler`, and `measure-overlay`. No `object-snapping.ts` change → no WASM parity needed. | `angle-constrain.ts` (new) | S–M |
| **4b — Anchor-point snapping** 🛠️ **(BUILT on `dev`, pending ship)** | "Snap to point": dragging an element locks its bbox anchors (corners / edge-mids / centre) **and** true path anchors onto another element's matching anchors when within threshold on **both** axes — the intentional corner-to-corner snap, distinct from 1-D edge/centre alignment. Built as a **new** pure `utils/point-snapping.ts` (`getPointSnap`) — deliberately **not** in `object-snapping.ts`, so **no WASM-parity burden** (a new function has no WASM twin to diverge from; a port can come later if it ever profiles hot — snapping is cheap per the perf note). Integrated into `selection-handler.handleMove` ahead of axis/spacing snap (point wins when a corner locks), with a magenta diamond marker (`renderPointSnapMarker`). Fixed a latent double-count: getPointSnap reads the **original** pre-drag positions (`initialPositions`), since `updateElement` mutates the store every frame. | `point-snapping.ts` (new) | M |
| **4c — Path-intersection snapping** 🛠️ **(BUILT on `dev`, pending ship)** | Snap the dragged anchor onto points where two *static* outlines cross. Built as a **new** pure `utils/path-intersection.ts` (`elementSegments` approximates each outline — bbox edges / ellipse polygon / line segment / path polyline; `getIntersectionPoints` does pairwise segment intersection with a bbox broad-phase + dup-merge). Crossings are computed **once per drag** (statics don't move — cached on `pState.intersectionSnapPoints`) and passed to `getPointSnap` as `extraTargets`, so a corner can lock onto a crossing exactly like onto an anchor. Still JS-only (new module, no `object-snapping.ts` change) → no WASM burden. *v1: non-path/non-ellipse shapes use their bbox edges (true concave outlines approximated).* | `path-intersection.ts` (new) | M |

**Status: the Precision & Measurement plan is COMPLETE, incl. the polish pass (v0.8.95).** All phases + follow-up polish are shipped/built:
- **Units (px/mm/in)** — `utils/units.ts` (`pxToUnit`/`formatLength`/`formatArea`), `globalSettings.measurementUnit`, Settings → Measurement Units, `Yappy.setMeasurementUnit`. Threaded through the HUD, Measure tool, gap measuring, and dimension labels. (The Measure line keeps ≥1 decimal as the precision readout.)
- **Angular/radial dimensions** — `measure: 'radius'|'diameter'|'angle'` in `dimension-geometry.ts` (+ renderer arc/spoke drawing, context-menu entries, API).
- **Rotation-aware bounds** — dimension geometry rotates its edge + outward normal by the element angle; the transform HUD badge sits under a single rotated element's true corners.
- **True concave outlines for intersection** — `getIntersectionPoints(elements, outlineOf?)` takes a `shapeToPath`-backed (rotated) outline supplier, so triangles/stars/diamonds cross on their real edges, not their bbox.

Dimension **export inclusion** is now DONE (v0.8.96, opt-in): `globalSettings.exportIncludeDimensions` + Settings toggle + `Yappy.setExportIncludeDimensions`. Raster paths (PNG/JPG/PDF) replay `renderDimensions` onto the world-space export ctx via `paintDimensions`; SVG emits real vector nodes via `utils/dimension-svg.ts` (`appendDimensionSvg`, mirrors the canvas renderer). Only a real-world scale/calibration workflow remains — an explicit non-goal for this arc.
| **5 — Dimension annotations** ✅ **(shipped v0.8.66)** | Persistent linear dimension lines attached to an element (width/height) that auto-update on move/resize/animate; extension lines + arrowheads + live px label. Built as a persisted `store.dimensionAnnotations` collection rendered as a world-space **overlay** (`utils/dimension-geometry.ts` + `dimension-renderer.ts`), not a new element type — same pragmatic call as null objects; the label is neutral chrome so the sketch/architectural split doesn't apply. Right-click → **Dimensions ▸ Add Width/Height**; API `addDimension`/`removeDimension`/`getDimensionValue`. *v1: axis-aligned bbox (rotation ignored); no angular/radial, no on-canvas drag-reposition, not yet in PNG/SVG export.* | overlay pattern (`snap-renderer`), history snapshot, doc serialization | L |

## 4. Design notes & decisions

- **HUD renders in screen space, reports world units.** Position the badge from the selection's world
  bounds via `viewport-transforms` (world→screen); the *numbers* are world units (so they don't change
  with zoom). Read live values from the active transform (pointer-state / selection-handler) during a
  gesture, and from the element bounds when idle. Implement as an overlay component (same pattern as
  `measure-overlay.tsx` / `ruler-overlay.tsx`), not baked into the canvas render.
- **Units.** Start with px (world units). Leave a hook for a future unit setting (px/mm/in/%) — a single
  format function so all readouts (HUD, measure, dimensions) share it.
- **Rotation readout convention.** Match the existing Measure tool: angle from +x axis, CCW-positive
  (screen-y negated) — `measure-overlay.tsx` already does this; reuse the same helper so HUD and Measure
  agree.
- **WASM parity.** Phase 4 adds geometry to `object-snapping.ts`; the AssemblyScript module
  (`wasm/assemblyscript/assembly/`) + bridge must produce identical results (CLAUDE.md rule). Anchor /
  intersection snapping is real geometry — write the JS first, mirror to WASM, and diff.
- **Both render styles (Phase 5 only).** Overlays (HUD, measure, hover lines) are UI chrome and don't go
  through the sketch/architectural split. But *dimension annotations* (Phase 5) are real elements and
  must render in **both** `sketch` and `architectural` (CLAUDE.md invariant).
- **Perf.** Overlays are cheap (a badge + a few lines per frame). The only watch-item is Phase 2/4
  recomputing neighbor geometry on every hover/drag move — reuse the existing threshold/broad-phase from
  `object-snapping.ts` and cache per-gesture rather than scanning all elements each pointer event.
- **Don't fight the existing spacing renderer.** Phase 2 should *extend* `snap-renderer` with an
  inspect/hover mode, not add a parallel renderer — one place draws all measurement lines.
- **Undo.** Overlays and measuring are transient (no history). Only Phase 5 dimension annotations create
  undoable elements (snapshot on placement, like any element add).

## 5. Non-goals (scope boundaries)

- Not a CAD dimensioning suite. Phase 5 is **optional/last**, and even then it's basic linear/angular
  dimensions, not tolerances/GD&T.
- No real-world scale / unit-calibration workflow in the initial arc (leave the units hook, don't build
  the UI).
- The Measure tool stays a *transient inspection* tool; it doesn't create persistent annotations (that's
  Phase 5's separate feature).

## 6. Open questions (resolve before Phase 1)

1. **HUD placement** — fixed corner of the selection bounds (e.g. below-center, like Figma) vs. following
   the cursor? (Below-center of the bbox is the common, least-jumpy choice.)
2. **What the idle HUD shows** — always-on when something is selected, or only during an active
   gesture? (Figma: always when selected; Illustrator: mostly during transform. Recommend always-when-
   selected, toggleable.)
3. **Alt vs. a dedicated toggle** for measure-to-neighbor — Alt/Option-hover is the Figma muscle memory;
   confirm it doesn't collide with an existing Alt modifier in Yappy's drag handlers.
4. **Rotation HUD** — show absolute angle, delta from start, or both during a rotate gesture?

## 7. Suggested first step

Ship **Phase 1 (live transform HUD)** as a small, self-contained spike: a `transform-hud.tsx` overlay
that reads the selection's world bounds + active-gesture state and renders a W×H / X,Y / ∠ badge in
screen space. It's high-impact, low-risk, touches no geometry/WASM, and it doubles as the readout badge
the After Effects scrubber will want later — so it pays off twice.
