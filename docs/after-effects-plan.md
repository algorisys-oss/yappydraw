# After Effects–class motion in Yappy — plan

> **TL;DR.** Yappy already owns most of the animation *engine* (per-property keyframes,
> an easing library incl. springs, interpolation, a `Timeline` sequencer, morph/Magic-Move,
> text animators, and a webm/mp4 recording path). What's missing to feel like After Effects is
> (1) an **absolute-time timeline model + a `seek(t)` evaluator** (the current engine is
> trigger/duration-based and only plays *forward*), (2) a **universal keyframe timeline / dope-sheet
> UI** (none exists today), (3) a **graph/easing-curve editor**, and (4) a few model features —
> **parenting/null objects** and **keyframable effect params**. Build the motion-graphics/explainer
> subset (Phases 1–4); leave AE's deep end (expressions, pre-comps, mattes) for later.
> **Date:** 2026-07-11. Complexity: **XL** (multi-phase; each phase ships value on its own).

## 1. Goal

Any element property (transform, opacity, color, stroke, and eventually effect params) is
**keyframable on an absolute-time timeline** with a **scrubbable playhead**, **per-keyframe easing
curves** (graph editor), and **transform parenting**. Playback previews live on the canvas and the
same evaluation drives the existing video export. The target user is the **motion-graphics /
explainer-video** author (Yappy's Canva/explainer audience), *not* a full VFX compositor.

## 2. Current state (validated against the code)

Yappy is much closer than a from-scratch build. What already exists:

- **Data model** (`frontend/src/types/motion-types.ts`): `ElementAnimation` union with
  `KeyframeAnimation { property, keyframes: AnimationKeyframe[] }` where
  `AnimationKeyframe = { offset: 0..1, value, easing? }`, plus `PropertyAnimation`, `PathAnimation`,
  `RotateAnimation`, `AutoSpinAnimation`, `MorphAnimation`, `PresetAnimation`. Animations attach to
  elements via `DrawingElement.animations?: ElementAnimation[]` (`types.ts:655`).
- **Engine** (`frontend/src/utils/animation/`): `Timeline` class (`timeline.ts` — `.add/.parallel/
  .delay/.call/.play/.pause/.stop/.reset`), `orchestrator`, `element-animator`, `sequence-animator`
  (staggered builds), `morph-animator` (shape/position morph), `pixel-effect-animator` (image
  reveals), `slide-build-manager` + `slide-transition-manager`, `state-manager`.
- **Easing** (`animation-types.ts`): `easings`, `getEasing`, `lerp`, `lerpColor`, **`createSpring`**
  (spring physics — AE doesn't ship this natively).
- **Text animators**: typewriter / word-by-word / char-by-char / kinetic typography (AE's
  per-character text animators, already shipping).
- **Comp-level morphing**: `DisplayState` (`motion-types.ts`) — Keynote-Magic-Move between captured
  canvas states; complements keyframes.
- **A timeline UI seed**: `scene-timeline.tsx` — a bottom transport with `storyTime` / `storyDuration`
  / `storyPlaying` / `storyLoop`, a track model (`FigTrack`), pixels-per-second mapping, a RAF
  playback loop, and click-to-scrub. Currently scoped to *animated stick-figure clips*, but it is the
  reusable skeleton for the dope sheet.
- **Render/output**: `recording-manager.ts` → webm/mp4 capture of the canvas. The "render" side of AE
  is already covered.

### What's genuinely missing (the gap)

1. **Absolute-time semantics + random-access `seek(t)`.** Today's model is *trigger + duration + delay*
   (`trigger: on-load | on-click | after-prev …`), and `Timeline.play()` runs *forward* — there is no
   "evaluate every element at time t" function. AE needs a deterministic
   **`evaluateAt(t) → per-element property overrides`**, independent of triggers, driving both the
   scrubber preview and the frame-exact render.
2. **A universal keyframe timeline / dope-sheet UI.** Confirmed: no keyframe-editing component exists
   (keyframing is preset-driven through the embedded animation panel). No track rows per
   element/property, no draggable keyframe diamonds, no playhead over arbitrary elements.
3. **A graph / easing-curve editor.** The engine has easing *names*; AE-style per-segment **bezier
   handles** need a small model addition + a curve-editing UI.
4. **Transform parenting / null objects.** No `parentId` / null-object concept on `DrawingElement`
   (the stick-figure rig proves hierarchical transforms internally, but there's no general element
   parenting).
5. **Keyframable effect params.** Only image pixel-reveals animate today; glow / blur / extrude / warp
   params are static live-effects, not yet keyframable over time.

## 3. Core architecture — the spine

Everything hangs off two new pieces:

### 3a. Absolute-time timeline model

Introduce a document-level **Composition** (reuse/extend the existing `story*` fields rather than a
new store if possible):

```ts
interface Composition {
  id: string;
  duration: number;   // seconds (already have store.storyDuration)
  fps: number;        // 30 default — needed for frame-exact export + snapping
  // playhead = store.storyTime (already exists)
}
```

Extend keyframes so a track lives in **absolute time**, not a normalized 0..1 window:

```ts
interface TimedKeyframe { t: number; value: number | string; ease?: BezierEase } // t in seconds
interface PropertyTrack { elementId: string; property: string; keys: TimedKeyframe[] }
type BezierEase = { ox: number; oy: number; ix: number; iy: number } // out/in tangent handles
```

Keep the existing normalized `KeyframeAnimation` for *presentation/trigger* animations (it's a
different, still-useful mode); the new `PropertyTrack[]` is the AE-mode source of truth. A one-time
**adapter** can lift an existing `KeyframeAnimation` (offset 0..1 + duration/delay) onto an absolute
`PropertyTrack` so nothing is thrown away.

### 3b. The `seek(t)` evaluator (the single most important function)

```ts
// Pure, deterministic. No side effects on the store; returns overrides to apply for rendering.
function evaluateCompositionAt(t: number, tracks: PropertyTrack[]): Map<elementId, Partial<DrawingElementState>>
```

- For each track, find the bracketing keyframes around `t`, interpolate with the segment's
  `BezierEase` (reuse `lerp`/`lerpColor`/`getEasing`).
- Compose with **parenting** (Phase 3): resolve a child's world transform from its parent chain.
- The canvas renderer applies the returned overrides as a transient layer (same pattern the live
  transform/extrude effects already use — render-time overrides, element cache bypassed for animated
  ids). The scrubber, playback RAF loop, and the export encoder all call the *same* evaluator → WYSIWYG.

This decouples "what the animation is" (data) from "when it fires" (trigger/presentation) from "what
it looks like at time t" (evaluator) — which is exactly the separation AE has and Yappy currently lacks.

## 4. Phased delivery (each phase ships independently)

| Phase | Deliverable | Leverages | Effort |
|---|---|---|---|
| **0 — Spine** ✅ SHIPPED | `PropertyTrack`/`TimedKeyframe`/`BezierEase`/`Composition` model + pure `evaluateCompositionAt(t)` + render-time override hook; adapter from existing `KeyframeAnimation`. No UI yet — proved by scrubbing `store.storyTime` over a hand-authored track. | `lerp`/`getEasing`, existing render-override pattern | M |
| **1 — Dope sheet** ✅ SHIPPED | Universal keyframe timeline panel: select element → track rows with draggable keyframe diamonds, a playhead, play/scrub/loop. Set a keyframe = record current property value at `t`. | `scene-timeline.tsx` UI skeleton, `storyTime/Duration/Playing/Loop`, Phase 0 evaluator | L–XL |
| **2 — Graph editor** ✅ SHIPPED | Bezier easing handles per keyframe segment; a curve-editing view; presets (ease in/out, hold, linear). | `BezierEase` from Phase 0 | M–L |
| **3 — Parenting / nulls** ✅ SHIPPED | `transformParentId` on elements + null-object gizmo; evaluator resolves parent chains (affine composition); parent-selector UI. | stick-rig hierarchy concepts | L |
| **4 — Keyframable effects + adjustment layers** ✅ SHIPPED | Flat effect params (v0.8.68) + **nested effects via dotted-path tracks** (`extrude.depth`, `warp.bend`) + **adjustment layers** (a region that filters everything beneath it) — all v0.8.69. | live-effects stack + evaluator dotted-path resolver | L |
| **5 — Advanced (optional / later)** | Pre-comps (nest a composition as a layer), track mattes (alpha/luma), expressions (property linking), motion blur, time remapping. | — | XL |

## 5. Key risks & decisions

- **Two animation modes coexisting.** Yappy already has a *presentation* animation model (triggers,
  slide builds). The AE timeline is a *second* mode. Decide the relationship early: keep them separate
  (a "Timeline" panel vs. the per-element "Animate on click" presets) with the adapter bridging them,
  rather than trying to unify into one model on day one.
- **`Timeline` class is play-forward, not seekable.** Don't retrofit `seek()` into the promise-based
  `Timeline`; author the pure `evaluateCompositionAt(t)` fresh (Phase 0) and let `Timeline` remain the
  trigger/sequence runtime for presentation mode.
- **Render-time overrides must go through the same hook as export.** The canvas preview and the
  `recording-manager` encoder must both apply evaluator output, or the exported video won't match the
  scrub preview. Grep every element-render surface (per CLAUDE.md's export-parity rule) when wiring the
  override layer.
- **Both render styles.** Animated shapes still must render in `sketch` and `architectural` (CLAUDE.md
  invariant). The evaluator only produces property overrides — the existing dual-style renderer handles
  the rest — but verify rough.js seed stability during animation (a changing seed = per-frame jitter).
- **Perf.** Canvas 2D + per-element cache is fine for authoring/preview at explainer scale. If real-time
  playback of *many keyframed effects* gets heavy, that's the one place a targeted **WebGL effect-
  compositing layer** earns its keep (see the WebGL discussion) — not the vector core.
- **Undo/history granularity.** Dragging a keyframe or a bezier handle should be one history entry per
  gesture (snapshot on gesture start), mirroring the existing colour-picker/drag pattern.

## 6. Non-goals (scope boundaries)

- Not cloning all of After Effects. **Phase 5 is explicitly "later, if users pull us there."**
- No expression language, 3D layers/cameras, or a full effects marketplace in the initial arc.
- The bottom **scene-timeline** stays a full-width transport bar (it's why it wasn't docked); the new
  dope sheet is a richer sibling, not a replacement — decide whether they merge in Phase 1.

## 7. Open questions (resolve before Phase 1)

1. **Composition scope** — one timeline per *slide/page*, or one per document? (Slides already have
   builds/transitions; a per-slide comp is probably right.)
2. **Merge or split** the new dope sheet and the existing `scene-timeline`?
3. **Keyframe authoring UX** — auto-keyframe on property change (AE's "stopwatch on" mode) vs. explicit
   "add keyframe" only? Auto-keyframe is more AE-like but riskier for accidental keys.
4. **fps** — fixed 30, or user-selectable per composition (affects export + snapping)?

## 8. Suggested first step

Ship **Phase 0** as a spike: add the `PropertyTrack` type + `evaluateCompositionAt(t)` + the render
override hook, and prove it by hand-authoring one position/opacity track and scrubbing `store.storyTime`.
That de-risks the whole plan (it's the spine) in a small, self-contained change before any UI work.

## 9. Phase 0 — as built (2026-07-11)

Landed the spine end-to-end, no UI:

- **Model** (`types/motion-types.ts`): `BezierEase`, `TimedKeyframe`, `PropertyTrack`, `Composition`.
  The `DisplayState`-style `Partial<DrawingElementState>` is reused as the evaluator's override shape.
- **Evaluator** (`utils/animation/composition-evaluator.ts`): pure `evaluateCompositionAt(t, tracks) →
  Map<id, Partial<DrawingElementState>>`. Binary-searches the bracketing segment, holds outside range
  (AE default), interpolates numbers via `lerp` and colors via `lerpColor`. Per-segment easing: a
  keyframe's `ease` (cubic-bezier handles, solved with Newton→bisection like CSS `cubic-bezier()`) wins
  over its named `easing`; the segment's easing belongs to the RIGHT keyframe. Also ships
  `keyframeAnimationToTrack()` (offset 0..1 → `delay + offset*duration` seconds) and
  `applyCompositionOverrides()` (merges into the render-time `animatedStates` map; composition wins over
  orbit/spin).
- **Render hook**: `store.compositionTracks` (transient) → merged into `animatedStates` at
  `components/canvas.tsx` right after `calculateAllAnimatedStates`, driven by `storyTime` when the Scene
  Timeline is open (same clock convention as the stick-rig renderer). The render spread at
  `canvas-renderer.ts` changed from a fixed `{x,y,angle}` copy to a generic `{ ...el, ...animState }` so
  overrides can carry opacity/size/color/text; `animation-utils.ts` opacity default switched `|| 100` →
  `?? 100` so a genuine 0 survives. Export parity is automatic — `recording-manager` captures the live
  `canvasRef` stream, i.e. the same `draw()` path.
- **API** (`api.ts`): `setCompositionTracks` / `getCompositionTracks` / `clearComposition` /
  `addKeyframe(id, prop, t, value, easing?)` / `evaluateComposition(t)`.
- **Tests**: `composition-evaluator.test.ts` (11 unit tests: hold/lerp/color/named+bezier easing/adapter)
  + `tests/composition-evaluator.spec.ts` (e2e: scrub proves override fires AND the stored element is
  untouched — the purity claim — plus a t=0≠t=1 canvas-pixel check).

**Not yet done / known gaps:** hit-testing paths (`canvas-event-handlers`, `selection-handler`) do NOT
apply composition overrides — clicking a composition-moved element hits its stored position (fine for
authoring; revisit later). `compositionTracks` is not yet persisted to the document. Only
x/y/width/height/opacity/angle/colors are wired as override channels.

## 10. Phase 1 — as built (2026-07-11)

Shipped the universal dope-sheet UI on top of the Phase 0 spine:

- **Panel** (`components/keyframe-panel.tsx` + `.css`): a bottom transport bar (sibling of
  `scene-timeline`, mutually exclusive with it so only one play-controller drives the shared
  `storyTime`/`storyDuration`/`storyPlaying`/`storyLoop` clock). Targets the **first selected element**.
  Rows for the 8 animatable channels (Position X/Y, Width, Height, Rotation, Opacity, Fill, Stroke),
  each with a ◆ stopwatch (add key at playhead), a live evaluated value readout, and a lane of draggable
  keyframe diamonds. Ruler + red playhead scrub; a `dur` field edits the composition length.
- **Interactions**: stopwatch records the element's **stored** property value at the snapped playhead
  time (0.05 s grid) — *not* the evaluated value, or a second key would just clone the first's held
  value (bug found + fixed in the e2e). Drag a diamond to retime (one history entry per gesture, tracked
  by identity across the re-sort); double-click or Del deletes; click an empty lane seeks.
- **Store/history**: new `showKeyframePanel` flag + `toggleKeyframePanel()` (closes the Scene Timeline
  when opened). `compositionTracks` added to the history snapshot (`captureSnapshot`/`restoreSnapshot`)
  so keyframe edits undo/redo. Note `restoreSnapshot` clears selection, so an undo collapses the panel
  until the element is re-selected — acceptable, pre-existing global behavior.
- **Entry points**: Menu → View → **Keyframes**, hotkey **Alt+K** (distinct from Ctrl/Cmd+K palette),
  API `Yappy.toggleKeyframePanel()`. Help doc + hotkey list updated.
- **Tests**: `tests/keyframe-panel.spec.ts` (e2e: add via stopwatch → interpolation → drag-retime →
  double-click delete → undo restores from history). Build + all specs green.

**Deferred to later phases:** Property panel doesn't yet show/edit the *animated* value at the playhead
(you set the stored value, then stopwatch) — the natural "auto-keyframe / stopwatch-armed" mode is still
open. Multi-element dope sheet, twirl-down groups, and persistence still open.

## 11. Phase 2 — as built (2026-07-11)

Shipped the easing / graph editor on top of the Phase 1 dope sheet:

- **Model + evaluator**: added `hold?: boolean` to `TimedKeyframe`. The evaluator short-circuits a
  segment whose RIGHT key has `hold` to the LEFT key's value (AE stepped/hold — value jumps at the key).
  Bezier `ease` and named `easing` were already supported from Phase 0; no evaluator change needed for
  those. Framing stays consistent: easing/ease/hold all describe the segment ENTERING a keyframe (stored
  on the later key).
- **Easing popover** (`keyframe-panel.tsx`): selecting a diamond opens a floating card anchored above the
  panel near the key (`selAnchorX` captured on pointer-down, clamped to the viewport). Contains 5
  **presets** (Linear / Ease In / Ease Out / Ease In-Out / Hold) with active-state highlight
  (`matchPreset`), and a **bezier graph editor** — an SVG unit square with the linear reference diagonal,
  the easing curve, two handle stems, and two draggable handle circles. Handle drag maps client-rect
  fractions → normalized `[0,1]` (x clamped to [0,1]; y allowed `[-0.4,1.4]` for overshoot), writing
  `ease` live (one history entry per gesture); presets/handles clear `hold`, and Hold clears `ease`.
  Only shown for keys with an incoming segment (index > 0). Hold keys render as an **amber square**
  instead of a diamond.
- **Tests**: 2 new unit tests (hold stepping, ease-out shape) → `composition-evaluator.test.ts` now 13.
  `tests/keyframe-easing.spec.ts` (e2e: select key → Ease In (<45) / Ease Out (>55) presets → drag the
  incoming handle reshapes the curve → Hold makes it stepped + square marker). Build + all specs green.
- **Docs**: help doc gains an "Easing & the graph editor" subsection with the preset table + API snippet.

**Closed in v0.8.70:** `compositionTracks` document persistence (saved to auto-save + `.yappy`, restored
on load — dimensions too, which had the same gap), adjustment-layer support in **raster** export, and
`transformEffect.*` / stroke-gradient / fill-gradient keyframe rows. **Still open:** Property-panel
animated-value editing / auto-keyframe, hit-testing overrides, adjustment layers in **SVG** export.

## 14. Phase 4 completion — nested effects + adjustment layers (2026-07-11, v0.8.69)

- **Nested-effect keyframing (dotted paths).** `PropertyTrack.property` now accepts a dotted path
  (`"extrude.depth"`, `"warp.bend"`). The evaluator still writes the key generically; a new
  `resolveNestedOverrides(overrides, elMap)` (called in `applyCompositionOverrides` and
  `api.evaluateComposition`) turns dotted keys into a COMPLETE nested object — it clones the element's
  current nested value and sets the sub-field(s), so the shallow render spread `{ ...el, ...animState }`
  applies a full `extrude`/`warp` object. The panel exposes Extrude Depth/Angle/Tilt/Bevel (when
  `el.extrude`) and Warp Bend (when `el.warp.preset`), read via a `getPath()` dotted accessor.
- **Adjustment layers.** `isAdjustmentLayer` flag on a rectangle. In the canvas render loop it snapshots
  the composite drawn so far into a scratch canvas and re-draws it back through its CSS filter
  (`buildFilterString`), clipped to its bounds — filtering everything beneath. A dashed gizmo marks it
  while authoring (hidden in presentation/embed; excluded from export). Its filter params
  (Blur/Brightness/Contrast/Saturate/HueRotate) are keyframable. `Yappy.createAdjustmentLayer()` +
  Menu → View → Add Adjustment Layer.
- **Tests**: `keyframe-nested-effects.spec.ts` (extrude.depth interpolates + base field preserved +
  canvas differs), `adjustment-layer.spec.ts` (brightness filters the region + keyframable + canvas
  animates). Both visually confirmed.
- **Deferred**: adjustment-layer effect in raster/SVG export; nested keyframing for `transformEffect.*`
  / `strokeGradient.angle` (same dotted-path mechanism, just add the panel rows).

## 13. Phase 4 — keyframable effect params — as built (2026-07-11, v0.8.68)

Live-effect parameters are now keyframable on the timeline **with zero engine changes** — the win is
that flat effect fields ride the same generic override path the transform props already use:

- The render pipeline reads effect fields straight off the element
  (`render-pipeline.ts:150-170`: `shadowBlur`/`glowBlur`/`featherRadius`/…), the render spread is
  `{ ...el, ...animState }`, and a keyframed element bypasses the element cache
  (`shouldCache = !animState`) — so an overridden effect field takes effect live. The evaluator writes
  any track's `property` key generically, so no evaluator change was needed.
- **Panel** (`keyframe-panel.tsx`): `ANIMATABLE_PROPS` → a dynamic `animatablePropsFor(el)` = base
  transform/appearance (now incl. **Stroke Width**) + **Feather** (any shape) + **Blur** (image/video)
  + **Glow Radius/Color** (when `glowEnabled`) + **Shadow Blur/X/Y/Color** (when `shadowEnabled`).
  Numeric effect params default to **0** in the readout and stopwatch, so you can keyframe them from
  "off" (undefined) — the fix that makes a feather/glow *reveal* authorable.
- **Deferred:** nested effects (`extrude.depth`, `warp.bend`, `transformEffect.*`, `strokeGradient.angle`)
  need `PropertyTrack.property` to accept a dotted path + a deep-set in the evaluator + a nested merge in
  the render spread. Adjustment layers (an element that applies effects to layers beneath) also deferred.
- **Tests**: `tests/keyframe-effects.spec.ts` (e2e: feather interpolates 0→15→30 and the canvas differs
  sharp-vs-soft; enabling glow surfaces the Glow Radius row; glow keyframes interpolate + repaint).

## 12. Phase 3 — as built (2026-07-11)

Shipped AE transform parenting + null objects:

- **New field, not `parentId`.** Added `transformParentId?: string | null` (+ `isNullObject?: boolean`)
  to `DrawingElement`. The existing `parentId` is the **mindmap tree** (collapse, focus dimming,
  translation-only drag-follow) — overloading it would collide, so AE parenting is a separate concern
  layered purely in the evaluator/override stage (confirmed by an Explore pass over every `parentId`
  reader).
- **Affine parent composition** (`composition-evaluator.ts` → `resolveParentedPoses`, pure): each
  element gets an `ownDelta` matrix (rest pose → own-animated pose = `T(Cₐ)·R(Δθ)·S(w/w₀,h/h₀)·T(-C_b)`);
  a child's `worldDelta = parentWorldDelta ∘ ownDelta`, composed up the chain (memoised, cycle-guarded).
  The composed matrix is decomposed back to x/y/width/height/angle. So a child inherits the parent's
  animated **position, rotation, AND scale** (a child with no own tracks still follows an animated
  parent). Wired into `applyCompositionOverrides` (render path) and `api.evaluateComposition` (inspection)
  — both use the composed result when any element has a `transformParentId`, else the flat per-element eval.
- **Null objects**: `isNullObject` elements render as a small crosshair+dashed-box gizmo
  (`render-element.ts renderNullGizmo`), are **skipped in presentation/embed** (`canvas-renderer.ts`),
  and **excluded from export** (`export.ts` filters them). `Yappy.createNull(x?,y?)` creates one; a ⊕
  button in the Keyframes header drops one at the viewport centre.
- **Pick-whip UI**: the Keyframes panel header gains a **Parent** `<select>` for the focused element
  (candidates exclude self + descendants to prevent cycles), plus `Yappy.setTransformParent(child, parent)`.
- **Bug fixed en route**: the canvas composition clock was gated on `showSceneTimeline` only, so scrubbing
  the **Keyframes** playhead never re-rendered the canvas (earlier phases' e2e checked the evaluator/DOM,
  not pixels, so it slipped through). Now `compTime = (showSceneTimeline || showKeyframePanel) ? storyTime
  : freeClock`. A canvas-pixel diff was added to the Phase 3 e2e to lock this in.
- **Tests**: `composition-evaluator.test.ts` now 18 (added translate-follow, rotation-orbit, chain, scale
  inheritance, cycle-safety). `tests/keyframe-parenting.spec.ts` (e2e: child follows an animated null in
  position+rotation, has no own tracks, canvas re-renders on scrub, and the Parent selector clears the
  link). Build + all specs green.

**Deferred:** null objects are a flagged `rectangle` (not a first-class `ElementType`) to avoid touching
~200 type switches — fine for the transform-holder role. Full pre-comp nesting is Phase 5.
