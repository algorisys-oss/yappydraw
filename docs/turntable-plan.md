# Turntable — rotate 2D vector art in "3D" — Plan

Status: **Phase 0+1 SHIPPED** (v0.8.74) · **Phase 2 SHIPPED** (v0.8.75: auto-axis + back-face
reveal + group rig; boolean self-occlusion trim deferred) · **Phase 4 built** (keyframable
yaw/pitch → spin animation + export) · **Phase 3a+3b (AI) SHIPPED** (v0.8.78 Vision→SVG, v0.8.79
image→trace; browser-direct BYO-key) · **ROADMAP COMPLETE** · Date: 2026-07-11 · Inspired by
**Adobe Project Turntable** (Adobe MAX Sneaks 2024; shipped into Illustrator Mar 2026):
spin a flat 2D vector illustration around as if it were a 3D object, and at every angle
it stays clean, **fully editable 2D vector** art — with AI inventing the geometry that
was hidden (the "2-legged horse → 4 legs when turned" trick).

## TL;DR
Let a user grab a selected vector shape (or group), **drag a slider to rotate it about a
vertical (or tilt) axis**, and settle on a new angle that is a clean, editable `path`.
Yappy already has the *substrate* for this — editable vector paths, shape→path,
2.5D extrude, and a scrubbable time evaluator — so the interactive rig + bake-out is
mostly reuse. The genuinely hard part is **reconstructing occluded geometry** at the new
angle. We stage that: **deterministic pseudo-3D** first (real, ships without AI), then
**symmetry-based gap-fill**, then an **optional AI reconstruction** tier for the true
"reimagine from a new viewpoint" magic.

## Why this fits Yappy (and where it doesn't yet)
- **We own the vector substrate.** The editable vector-path keystone is feature-complete
  (`docs/vector-path-tool-spec.md`): `type: 'path'` with `PathAnchor[]` (corner/smooth +
  bezier handles, `closed`), `shapeToPath()` to convert any shape, pathfinder booleans,
  offset/outline. Turntable output is *just another editable path* — nothing new to store.
- **We already fake depth.** `utils/extrude.ts` does 2.5D: `isExtrudeTilted`, tilt X/Y,
  `extrudeGeometry()` projects a front polygon + walls. Turntable is the same family of
  math (project anchors through a rotation, reproject to screen) — but rotating the art
  *itself*, not extruding a wall behind it.
- **We have a per-frame evaluator + a slider-driven animation model.** The AE work
  shipped a `seek(t)` evaluator, dope sheet, graph editor, keyframable effects
  (`docs/after-effects-plan.md`, Phases 0–4 SHIPPED). Orbit/spin already animate per
  frame via `utils/animation-utils.ts calculateAllAnimatedStates`. A Turntable angle is
  a keyframable scalar → it plugs straight into scrub/playback/export with no new clock.
- **What we do NOT have:** any notion of *depth per anchor*, occlusion/z-order between
  subpaths, or reconstruction of hidden parts. Yappy's only rotation is whole-element
  `angle` about a pivot (`utils/transform-pivot.ts`) — a flat spin in the picture plane,
  not an out-of-plane turn. That gap is the whole design problem below.

## The core design decision
**Turntable is a live, re-applicable transform on a path/group — not a new element type**
(contrast the stick-figure rig, which needed `type:'stickRig'` for a bone hierarchy).
A turntable state is a small set of scalars on the element:

```
turntable?: {
  axis: 'y' | 'x' | 'free',   // vertical spin (default), vertical tilt, or both
  yaw: number,                 // degrees around the vertical axis (the slider)
  pitch: number,               // degrees of tilt (secondary slider)
  depthModel: 'flat' | 'symmetry' | 'heightfield' | 'ai', // how per-anchor z is derived
  baked?: boolean,             // once the user commits, we replace anchors and drop this
}
```

Rendered live via the evaluator; **Bake** replaces the element's `anchors` with the
projected+reconstructed path at the current `yaw/pitch` (single undo), same as
`convertToPath`/`outlineStroke` replace-in-place. This keeps the model tiny and makes
every angle a real editable vector, which is the defining Turntable property.

### How rotation actually works (the geometry)
A flat path has no z, so we **assign a depth `z` to each anchor**, rotate the 3D point
about the chosen axis, and project back to 2D:
1. **Depth model** produces `z(anchor)`:
   - `flat` — every anchor `z=0`. Rotating a flat sheet about Y just foreshortens it
     (a cos(yaw) horizontal squash + perspective). Trivial, always correct, no magic —
     good default and the honest floor.
   - `symmetry` — detect a symmetry axis (vertical mirror is the common case for
     characters/logos); pair mirrored anchors and give the pair a depth bulge so the
     shape reads as having a front/back. This is what lets a turned figure look round.
   - `heightfield` — treat luminance/fill as a bump map for a subtle relief (later).
   - `ai` — a model returns a redrawn path (or a depth field) for the target viewpoint.
2. **Rotate** each `(x, y, z)` about the axis by `yaw`/`pitch` (standard rotation matrix),
   apply a light perspective divide (reuse the extrude projection constants for
   consistency), reproject to `(x', y')`.
3. **Occlusion / z-order** — for multi-subpath art, sort subpaths by rotated mean-z so
   back parts draw behind front parts; reveal mirror-hidden subpaths (the 4th leg) when
   they rotate into view.
4. **Re-fit anchors** — the rotated control points *are* the new bezier anchors, so the
   output stays a clean editable path (no re-sampling needed for `flat`/`symmetry`).

## Phases (ship value early, defer the AI)

| Phase | Scope | Reuses / touches | Size |
|---|---|---|---|
| **0 — Spike** | Prove the pipeline on one symmetric closed path: assign `z` from vertical-mirror pairing, rotate about Y, reproject, render live under a temp slider. Throwaway UI. Answer: does `symmetry` read as "3D" on real art? | `extrude.ts` projection math, `path-utils.ts` sampling, a scratch overlay | S |
| **1 — Deterministic turntable (flat + symmetry)** | The real feature for simple/symmetric shapes: `turntable` state on element, live render via the evaluator, **yaw slider + tilt** in the property panel, **Bake to path**, subpath z-order occlusion. No AI, no gap invention beyond mirror reveal. Ships as "rotate this shape in 3D". | evaluator (`animation-utils`/AE `seek`), property-panel controls (`config/properties.ts`), replace-in-place (`convertToPath` pattern), `api.ts` | L |
| **2 — Symmetry gap-fill + multi-part** | Infer the hidden half from a detected symmetry so turning reveals occluded parts cleanly (the horse's 4th leg); handle groups/`multi` geometry; per-subpath depth; smarter z-order & self-occlusion trimming (boolean-subtract hidden regions using the existing pathfinder). | pathfinder booleans, `shape-to-path`, symmetry detector (new, small) | L |
| **3 — AI reconstruction (premium, optional)** | The true Project-Turntable magic: send the current art + target viewpoint to a model that **reimagines** the drawing from that angle and returns editable vector (or a raster we vectorize). Server-side, keyed, premium-gated; degrades to Phase 1/2 offline. | existing AI plumbing (see `docs/canva-features-plan.md` AI rounds), `api.ts` | XL |
| **4 — Motion & export** | Keyframe `yaw`/`pitch` on the dope sheet → a rotating turntable animation; export to HTML/video via the shipped recorder. Mostly free once Phase 1 is on the evaluator. | AE dope sheet/graph editor, `utils/video-recorder.ts`, `export-to-html.ts` | S–M |

Recommended first deliverable: **Phase 0 spike, then Phase 1**. Phase 1 alone is a
genuine, demoable feature ("turn a 2D shape in 3D, keep it editable") without any AI cost.

### Phase 0+1 — SHIPPED 2026-07-12 (as implemented)
Built together (substrate was solid enough to skip throwaway UI). What landed:
- **Model** — `Turntable` interface (`axis`/`yaw`/`pitch`/`depthModel`/`depthScale`/`axisX`/
  `perspective`/`baked`) + optional `turntable?` field on `DrawingElement` (`types.ts`).
- **Math** — `utils/turntable.ts`: `applyTurntable(el) → PathSubpath[]`, per-anchor depth
  (`flat` = z0 foreshorten; `symmetry` = parabolic cylinder bulge about the mirror axis),
  yaw→pitch rotation, ortho/perspective projection, handle-aware, subpath z-order sort.
- **Live render** — hooked at `shape-geometry.ts` `case 'path'` (`applyTurntable(el) ??
  getPathSubpaths(el)`), so sketch + architectural + SVG export all inherit it for free.
- **Store** — `setTurntable`/`clearTurntable`/`bakeTurntable` (mirror the Extrude pattern;
  auto-`convertToPath` on add; Bake = replace-in-place, single undo).
- **UI** — `TurntableEditor` in `property-panel.tsx` (yaw/pitch/depth/persp sliders, volume
  model select, Bake/Remove) under group **TURNTABLE (3D SPIN)**.
- **API** — `Yappy.turntable({...})`, `Yappy.clearTurntable()`, `Yappy.bakeTurntable()`.
- **Migration** — `turntable` passthrough added; also fixed a latent `pathSubpaths` drop.
- **Docs** — help `effects-doc.tsx` "Turntable" section; `docs/learnings.md`.
- **Not done (deferred as planned):** symmetry gap-fill / hidden-part reveal (P2), AI
  reconstruction (P3), keyframing yaw on the dope sheet (P4 — field ready via dotted key).

### Phase 2 — BUILT 2026-07-12 (as implemented)
- **Auto mirror-axis detection** — `detectMirrorAxisX(subs, fallback)`: centroid seed + a small
  reflection-error search; the `symmetry` model uses it when `axisX` is unset (better default
  look, no manual axis needed).
- **Symmetry back-face reveal** — `Turntable.reveal`: builds a mirrored back layer (−z) alongside
  the front (+z); both are z-sorted so a strong turn shows the occluded far side (reads as a
  closed 3D volume). Toggle in the panel under the Symmetry model.
- **Group / multi-element rig** — a 2+-selection shares ONE turntable: `Turntable.cx/cy` hold the
  selection-centre in each member's local frame, so every member *orbits* the common axis
  (position + shape), not just spins in place. `setTurntable` computes the shared centre and pins
  it per member; the panel shows **TURNTABLE — GROUP**; default depth model is `flat` for groups.
- **Bake bounds-normalize** — `bakeTurntable` now re-tightens each element's bbox (shift anchors
  to origin, push offset onto `x/y` + `w/h`) so a rotated/orbited element's selection box is
  correct after baking.
- **Panel gating** — the editor renders only for turntable-capable shapes (`canTurntable`: a path
  or anything `shapeToPath` accepts); hidden for text/connectors/tables/etc.
- **Deferred (Phase 2.5 polish):** boolean self-occlusion trimming (pathfinder-subtract the
  hidden regions). z-order draw-sorting is in; explicit hidden-region clipping is not — low
  visual payoff vs. the pathfinder complexity, revisit if needed.

### Phase 4 — BUILT 2026-07-12 (motion & export)
- **Keyframable `turntable.yaw` / `turntable.pitch`** — registered as `TURNTABLE_PROPS` in
  `keyframe-panel.tsx` (mirrors `EXTRUDE_PROPS`), exposed on the dope sheet when the element has
  a turntable. Keyframe yaw 0→360 for a rotating-turntable loop.
- **Free scrub / playback / export** — the composition evaluator's `resolveNestedOverrides`
  deep-merges `{ turntable: { ...el.turntable, yaw } }` per frame (verified: 0→90→180→360 while
  preserving depthModel/depthScale/cx), and the same render path feeds video/HTML export — no
  new clock or exporter work. Nothing else to build for motion.
- **One-click "Spin 360°"** (v0.8.77) — `spinTurntable360(ids, {seconds, turns})` ensures a
  turntable then authors a clean linear `turntable.yaw` 0→360° track across the story duration
  (loops seamlessly). Panel button **↻ Spin 360°** + `Yappy.spinTurntable360()`. Works on groups.

**Remaining:** only **Phase 3 (AI reconstruction)** — reimagine occluded geometry from the new
viewpoint; degrades to Phase 1/2 when no key/offline.

### Phase 3 — AI reconstruction — SCOPED 2026-07-12 (grounded in the actual AI plumbing)

**Reality corrections vs. the original Phase-3 row** (from an audit of `frontend/src/ai/*`):
- **There is NO AI backend.** Every AI feature is **browser → provider direct**, keyed from a
  user-pasted API key in localStorage (`ai/ai-settings.ts` `getActiveProviderConfig`,
  `hasAnyApiKey`), through one transport: `ai/ai-providers.ts` `callLLM(LLMRequest)` (OpenAI /
  Gemini / Anthropic; vision via `images: ImageContent[]`). The backend is a file-CRUD store only.
- **There is NO premium / subscription / entitlement / metering** anywhere. So the original
  "server-side, keyed, premium-gated" has **no substrate** — building it would be net-new infra
  (a server proxy + a billing/entitlement system) unrelated to this feature. **Recommendation:
  drop "premium/server" and follow the house pattern — browser-direct, BYO-key, degrade-to-
  deterministic when no key.** Same UX as every other AI feature.
- **No image model returns vector** (image gen is raster: OpenAI `gpt-image-1`/`dall-e-3`). But a
  production raster→vector tracer exists (`utils/image-trace.ts` + `app-store.ts traceImage`), so
  "vectorize the raster" is a real, tested route.

**Two viable approaches (genuine quality/cost trade-off):**
- **3a — Vision-LLM → editable SVG (cleaner, cheaper, ships first).** Rasterize the current art
  (`ai/image-utils.ts processImageForVision` / `utils/export.ts exportRegion`) → `callLLM` on the
  active vision provider with a `build3DVisionSystemPrompt`-style instruction ("redraw this 2D
  vector art as seen rotated N° about the vertical axis; return SVG path(s)") → parse the SVG into
  `type:'path'` elements (reuse the SVG-import path). *Pros:* editable vector directly; reuses the
  `drawing-engine.ts generateDiagramFromSketch` vision precedent almost verbatim; all 3 providers;
  cheap. *Cons:* LLM-drawn geometry is crude for complex/organic art — good for logos/simple
  characters, weak for detailed scenes.
- **3b — Image reimagine → trace (more faithful, messier vectors, later).** Rasterize → OpenAI
  image-edit (`canva-ai.ts magicEditImage`/`postImageEdit`) with a "rotate to this viewpoint"
  instruction → raster back → `traceImage` → editable paths. *Pros:* best at *inventing* occluded
  geometry (the "2-legged horse → 4 legs" magic). *Cons:* OpenAI-only; traced output is many-anchor
  / colour-quantized (loses the clean-vector promise); weak control over the exact angle;
  non-deterministic.

**Integration (both approaches):**
- A **one-shot** "Reconstruct with AI" action — NOT a live slider or a keyframable channel (AI is
  slow, costly, and non-deterministic, so it can't drive per-frame playback). It takes the current
  `turntable.yaw`/`pitch` as the target viewpoint and produces a new editable path.
- Result handling: **insert as a new element** beside the original (safer than replace; original
  stays), single undo. Async with a spinner/toast.
- **Degrade-to-deterministic:** no key / offline / failure → toast + fall back to the deterministic
  `bakeTurntable` (Phases 1/2). Matches the `hasAnyApiKey`→toast pattern.
- Surface: panel button + `Yappy.reconstructTurntableAI(id, { yaw, pitch })`. A `depthModel:'ai'`
  enum value is NOT needed (AI is a bake-time action, not a live depth model).

**Reuse map (all production-tested, do NOT rebuild):** transport `callLLM`+`images`; keys/gating
`ai-settings.ts`; rasterize `processImageForVision`/`exportRegion`; vector-return SVG-import (3a)
or `image-trace.ts traceImage` (3b); insert `canva-ai.ts insertImageElement`/`makePathFromWorldSubs`;
prompt precedent `drawing-engine.ts generateDiagramFromSketch` + `system-prompt.ts build3DVisionSystemPrompt`.

**Risks / expectations:** LLM geometry fidelity (3a) and trace messiness + OpenAI-only (3b); cost
& latency per call; run-to-run non-determinism (hence one-shot, not animatable). Frame it in-app as
**experimental / best-effort**. Sizing: **3a ≈ M** (mostly reuse), **3b ≈ M–L**.

**DECISIONS LOCKED (2026-07-12):** (1) **3a — Vision→SVG**; (2) **browser-direct BYO-key** (no
server/premium); (3) **insert the AI result as a NEW element** beside the original. Build 3a now;
3b (image→trace) remains an optional future follow-up.

### Phase 3a — BUILT 2026-07-12 (v0.8.78)
- **`ai/turntable-ai.ts`** `reconstructTurntableAI(id, {yaw,pitch})`: rasterize the element region
  (`exportRegion`, download=false) → `parseDataURL` → `callLLM` on the active vision provider with a
  new SVG-out system prompt (redraw at the target viewpoint, invent newly-visible parts) →
  `extractSvg` (tolerates fences/prose) → `svgToElements` placed beside the original → insert with
  one undo (`pushToHistory` + `batch(setStore)`). BYO-key gated (`getApiKey`); toast on no-key/
  failure; the source is never modified.
- **UI/API:** panel button **✨ Reconstruct with AI** (single shape only, lazy-imports the AI
  module so it stays out of the main bundle) + `Yappy.reconstructTurntableAI({yaw,pitch})`.
- **Verified:** typecheck + build clean; `extractSvg` unit-tested across raw / fenced(svg,xml) /
  prose-wrapped / no-svg. The live model call + `svgToElements`/`exportRegion` (browser-only APIs)
  need an API key to exercise end-to-end in-app.
- **Deferred:** isolating the source render from overlapping neighbours (currently `exportRegion`
  of the AABB).

### Phase 3b — BUILT 2026-07-12 (v0.8.79) — image reimagine → auto-trace
- **`ai/turntable-ai.ts reconstructTurntableAIImage(id,{yaw,pitch})`**: rasterize the source
  (`exportRegion`) → OpenAI `images/edits` (`gpt-image-1`, inline `postImageEdit`) with a
  "rotate to this viewpoint, invent newly-visible parts" prompt → returned raster →
  `traceRasterAsPaths` (new store action) → colour paths inserted beside the original (grouped,
  single undo). OpenAI-only; more pictorially faithful than 3a but messier (colour-quantized,
  many-anchor) vectors.
- **`store/app-store.ts traceRasterAsPaths(sourceId, rasterDataURL, {colors,simplify})`**: loads
  the raster, `traceImageDataColor` (the shipped Trace primitive) → `makePathFromWorldSubs`
  beside the source, sized to it. Kept in the store because `makePathFromWorldSubs` is store-private.
- **UI/API:** the panel now shows two buttons — **✨ AI Redraw** (3a, vector) and **✨ AI Reimagine**
  (3b, image→trace). `Yappy.reconstructTurntableAI({yaw,pitch,mode:'vector'|'image'})`.
- **Verified:** typecheck + build clean; reuses only production-tested primitives (`traceImageDataColor`
  from the shipped Trace feature, coordinate mapping mirrors `traceImage`, `postImageEdit` mirrors
  Magic Edit). Live OpenAI round-trip needs a key to exercise end-to-end in-app.

**Turntable roadmap COMPLETE** — Phases 1, 2, 3a, 3b, 4 all shipped. No planned work remains.

## Reuse map (do NOT rebuild)
- **Depth/projection math** — `utils/extrude.ts` (`extrudeGeometry`, tilt projection).
- **Path model & sampling** — `PathAnchor`/`type:'path'` (types.ts), `utils/math/path-utils.ts`
  (`parsePath`, `getPointOnPath`, smooth/unsmooth), `utils/shape-to-path.ts`.
- **Replace-in-place + undo** — the `convertToPath` / `outlineStroke` app-store pattern.
- **Live per-frame render** — `utils/animation-utils.ts calculateAllAnimatedStates` and
  the AE `seek(t)` evaluator (`docs/after-effects-plan.md`); drive `yaw` from `window.yappyGlobalTime`.
- **Occlusion via booleans** — pathfinder (subtract hidden regions) from the vector keystone.
- **Property panel & API** — `config/properties.ts`, `config/quick-toolbar-config.ts`, `api.ts`.
- **Motion/export** — dope sheet + graph editor, `utils/video-recorder.ts`, `utils/export-to-html.ts`.

## Cross-cutting requirements (from CLAUDE.md)
- **Render-style parity** — the baked/live turntable path must render fill **and** stroke
  in **both** `sketch` (rough.js) and `architectural` modes. Path geometry is a
  self-contained `Path2D` → fill via `renderer.fillPath(d)`, stroke via
  `renderer.strokePath(d)` (the `beginPath()+renderGeometry()` pattern drops the stroke).
- **WASM parity** — if any depth/rotation math lands in `utils/geometry.ts` (or a new
  hot util reachable from hit-testing/routing/snapping), mirror it in
  `wasm/assemblyscript/assembly/` + `wasm/bridge/`. Bake-out to a plain path means
  hit-testing/snapping need no turntable awareness once baked.
- **Docs/help/api** — new `turntable` field → `utils/migration.ts` passthrough; property
  controls → help doc (`frontend/src/help-docs/`) + hotkeys (`components/help-dialog.tsx`);
  `Yappy.turntable(id, {yaw,pitch})` / `Yappy.bakeTurntable(id)` in `api.ts` + `docs/api.md`.

## Open questions
- **Symmetry detection robustness** — auto-detect the mirror axis, or let the user set it
  (drag an axis line)? Lean **user-set with an auto-guess**, since arbitrary art won't be
  cleanly symmetric.
- **Perspective vs orthographic** — a perspective divide reads more "3D" but distorts
  editable anchors more; orthographic keeps anchors tidy. Offer a toggle; default ortho.
- **Where does AI run** — reuse whatever backend the Canva AI rounds use; must degrade
  gracefully to Phase 1/2 when no key/offline (Yappy is offline-first / PWA).
- **Scope of "group" turntable** — Phase 1 single path; groups/`multi` deferred to Phase 2.

## Key files (entry points when we start)
- `frontend/src/types.ts` — add the `turntable` field to the element model.
- `frontend/src/utils/extrude.ts` — projection math to generalize into a rotate-about-axis.
- `frontend/src/utils/shape-to-path.ts` + `utils/math/path-utils.ts` — anchors in/out.
- `frontend/src/utils/animation-utils.ts` (+ AE evaluator) — live per-frame yaw.
- `frontend/src/app-store` (convertToPath/outlineStroke neighbours) — bake-in-place + undo.
- `frontend/src/config/properties.ts` — yaw/tilt sliders + Bake button.
- `frontend/src/api.ts` + `docs/api.md` — scripting surface.

## References
- Adobe Project Turntable — [Adobe Research](https://research.adobe.com/news/turntable-and-project-turn-style-a-fresh-spin-on-your-original-art/),
  [9to5Mac (shipped in Illustrator, up to 74 editable views)](https://9to5mac.com/2026/03/30/adobe-illustrator-now-lets-you-rotate-2d-vectors-in-3d-space/),
  [Creative Bloq](https://www.creativebloq.com/design/adobes-new-image-rotation-tool-is-one-of-the-most-impressive-ai-concepts-weve-seen).
- Internal: `docs/vector-path-tool-spec.md` (path substrate), `docs/after-effects-plan.md`
  (evaluator/dope sheet), `docs/canva-features-plan.md` (AI plumbing),
  `docs/stick-figure-animation-plan.md` (new-element-vs-transform decision precedent).
