# Illustrator Text-Effects — Gap Analysis & Parity Plan

> **Source:** 20 Adobe Illustrator text-effect tutorials (`~/temp/downloads/todo/*.mp4`).
> **Date:** 2026-07-10. Analysed from the techniques named in each tutorial (title +
> stated tools) cross-referenced against Yappy's current capabilities in
> `frontend/src/api.ts`, `store/app-store.ts`, `utils/envelope-warp.ts`, and the
> vector toolkit. Complements [vector-illustration-roadmap.md](vector-illustration-roadmap.md)
> — that roadmap's Tier 1/2 delivered the *shape* toolkit; this doc targets the
> *text-effect* production techniques those tutorials exercise.

## 1. The tutorials → the techniques they require

| # | Tutorial | Core Illustrator technique(s) |
|---|----------|-------------------------------|
| 1 | Blend Text | **Blend tool** (smooth/steps), **Replace Spine**, Scissors |
| 2 | Flip Text | Blend, **Reflect**, Gradient |
| 3 | Glow Text | **Global Swatch**, **Appearance panel** (multiple fills/blurs) |
| 4 | Pattern Text | **Symbol**, **3D Extrude & Bevel**, **Transform effect** |
| 5 | Retro 3D Text (P1+P2) | **3D Extrude & Bevel** |
| 6 | Retro Striped Text | Pattern/line fill + **clipping mask** + blend |
| 7 | Retro Vintage | Appearance + texture/halftone |
| 8 | Spine Text | **Replace Spine** + Blend |
| 9 | Steps Text | **Vanishing Point / 3D Rotate** (perspective steps) |
| 10 | Transform Text (Rotate/Scale/Move) | **Transform effect + Copies** |
| 11 | Transform Text (Shear) | **Shear** + Appearance |
| 12 | Vintage — Alternate Letters | **OpenType alternate glyphs** |
| 13 | Vintage — Appearance & Transform | **Appearance** + **Transform effect** |
| 14 | Warp — Make To Top Object | **Envelope Distort → Make with Top Object** |
| 15 | Warp — Make with Mesh | **Envelope Distort → Make with Mesh** |
| 16 | Warp — Make with Warp | **Named warp presets** (Arc/Flag/Wave/…) |
| 17 | Warp Text to 3D Shapes | Envelope onto a 3D face / project |
| 18 | Wave Text | **Mesh warp** + **Transform effect** |

## 2. Capability matrix (current state)

Legend: ✅ Have · ⚠️ Partial · ❌ Missing

| Capability | State | Where / gap | Powers |
|---|---|---|---|
| Appearance stack (multiple fills/strokes) | ✅ | `addAppearanceFill/Stroke`, appearance panel | Glow, Vintage, Flip, Transform |
| Global swatches (live-linked) | ✅ | `createSwatch`/`swatchId` live-link | Glow |
| Gradient fills (linear/radial/conic, mesh) | ✅ | gradient editor + mesh gradient | Flip, Glow, Retro |
| Reflect / flip about an axis | ✅ | `flipSelected(dir, axisValue)` | Flip |
| Convert text → outlines | ✅ | `convertTextToOutlines` (opentype.js) | most |
| Type on path / spine (attach) | ✅ | `attachTextToPath`, `toggleTypeOnPath` | Spine (partial) |
| Scissors / split path at point | ✅ | `splitPath`, `knife` | Blend, Spine |
| Symbols / instances | ✅ | `createSymbol`/`placeInstance` | Pattern |
| Pattern fills (+ from selection) | ✅ | `applyPatternFill`, pattern swatches | Pattern, Striped |
| Clipping & opacity masks | ✅ | `makeClippingMask`/`makeOpacityMask` | Striped, Retro |
| Envelope distort — **free / mesh** (drag) | ✅ | `toggleEnvelopeWarp`, `applyMeshWarp` (R×C) | Warp-Mesh, Wave (partial) |
| Shear / skew | ✅ | `shearX/shearY` decomposed + gesture | Transform-Shear |
| Blur (full-element Gaussian) + outer glow | ✅ | `setFeather(r)` = `filter: blur()` on the whole element; `setGlow({color,blur})` = halo. **Correction:** Blur was NOT missing. | Glow (largely covered) |
| Per-appearance-fill blur (each stacked fill its own blur) | ⚠️ | blur is a whole-element property, not per-`PaintFill` | Glow (multi-layer refinement only) |
| **Blend — along a spine / replace-spine / reverse** | ⚠️ | `blendShapes` = destructive **bbox-lerp only** | Blend, Spine, Flip |
| **Blend — smooth (shape-morph outlines)** | ❌ | no anchor-correspondence morph | Blend |
| **Live Transform effect (Copies, re-editable)** | ❌ | only destructive `radialRepeat`/`gridRepeat`/`mirrorCopy`/`transformAgain` | Steps, Vintage, Transform×2, Wave, Pattern |
| **Named warp presets** (Arc/Arch/Flag/Wave/Rise/Fish/Bulge/Shell/Squeeze/Inflate/Fisheye/Twist) | ❌ | envelope engine is free-drag only | Warp-Warp, Wave |
| **Envelope — Make with Top Object** | ❌ | can't use a selected shape as the envelope | Warp-TopObject |
| **3D — Extrude & Bevel / Revolve / Rotate (live)** | ❌ | only static `isometricCube`/`perspectiveBlock` + `projectToPlane` | Retro-3D×2, Pattern, Warp-to-3D, Steps |
| **OpenType alternate glyphs / stylistic sets** | ❌ | no GSUB glyph substitution UI | Vintage-Alternates |
| **Non-destructive live-effect framework** (geometry effects re-editable in a stack) | ⚠️ | appearance stack covers *paint* only, not geometry effects | every "effect"-based tutorial |

## 3. The real gap = 6 missing primitives

Ranked by **leverage** (tutorials unlocked) × **tractability** (reuse of existing engines):

| P | Primitive | Leverage | Size | Reuse foundation |
|---|-----------|----------|------|------------------|
| **A** | **Live Transform effect (with Copies)** | Steps, Vintage, Transform×2, Wave, Pattern (6) | M | `transformAgain` + appearance stack + `setElementTransform`; needs a *live, stacked, re-editable* transform node carrying a `copies` count |
| **B** | **Named warp presets + Make-with-Top-Object** | Warp-Warp, Warp-TopObject, Wave (3) | M | `utils/envelope-warp.ts` already deforms a sampled outline by a control grid — add parametric deformers (arc/flag/wave/…) + accept an arbitrary top shape as the envelope |
| **C** | **Blend upgrades** (spine, replace/reverse-spine, smooth shape-morph) | Blend, Spine, Flip (3) | M | `blendShapes` + `splitPath` + path sampler (`path-follow.ts`/`path-utils`) + boolean anchor-correspondence |
| **D** | **3D Extrude & Bevel / Revolve / Rotate (live)** | Retro-3D×2, Warp-to-3D, Pattern, Steps (5) | **XL** | `projectToPlane` + perspective grid as a starting point; needs an actual extrusion mesh + lighting. Biggest lift, biggest "wow" |
| **E** | **Stackable Blur effect** (Gaussian) for glow | Glow (1) | S | offscreen canvas + `filter: blur()` already used for opacity masks |
| **F** | **OpenType alternate glyphs / stylistic sets** | Vintage-Alternates (1) | M | opentype.js exposes GSUB; needs a glyph-alternates picker UI |

**Insight:** primitives **A** and **B** alone unlock **9 of the 18** effect tutorials and reuse engines that already exist — highest ROI. **D (3D)** is the single largest lever (5 tutorials) but is an XL build. **E** is a quick win. **C** is medium. **F** is niche.

## 4. Phased plan

> **Status (2026-07-10):** Phase 1 **Transform effect — SHIPPED (core).** Live, non-destructive
> `el.transformEffect` renders N accumulating copies (move/rotate/uniform-scale/reflect) in BOTH
> render styles via element-clone + re-`renderElement` (`utils/transform-effect.ts`, hook at
> `canvas-renderer.ts`). `setTransformEffect`/`clearTransformEffect`/`expandTransformEffect` in
> app-store + `api.ts`; context-menu presets (Radial Fan / Rosette / Spiral / Echo) under
> Repeat & Mirror; migration passthrough; help doc (`effects-doc`); **property-panel editor**
> (TRANSFORM EFFECT group: Copies/Rotate/Scale/Move X-Y/Pivot X-Y sliders with live drag, Reflect
> toggles, Add/Expand/Remove). Verified in-app (fan, spiral, both styles, Expand→15 elements, panel
> live-adjust). **Remaining Phase 1:** generalize to an `el.effects[]` stack, add the **Blur**
> effect, non-uniform-scale + shear-decompose Expand.

### Phase 1 — Live Effect foundation + Transform effect + Blur *(unlocks 7 tutorials)*
The keystone: a **non-destructive live-effect stack** (`el.effects: LiveEffect[]`), evaluated at
render time (mirrors how `el.warp` and `el.appearance` already layer over the base shape), re-editable
in the Appearance panel, and bakeable (reuse the `bakeWarp` "Expand" pattern).
- **Transform effect** node: move/scale/rotate/reflect + **Copies N** + per-copy accumulation + "random" seed. Renders N ghost copies live; Expand → real elements.
- **Blur effect** node (Gaussian) — reuse the opacity-mask offscreen+filter path.
- Wire both into the Appearance panel (add/remove/reorder/toggle), `api.ts` (`addTransformEffect`, `addBlurEffect`, `expandEffects`), and SVG export (`<feGaussianBlur>` / expanded copies).
- **Delivers:** Steps, Vintage (13), Transform (10 & 11), Wave, Glow, Pattern (partial).

> **Status (2026-07-10):** Phase 2 **Warp presets — SHIPPED.** `applyWarpPreset(preset, bend)` +
> `WARP_PRESETS` (Arc/Arch/Flag/Wave/Rise/Bulge) generate a displaced control grid via
> `warpPresetGrid` in `utils/envelope-warp.ts`, stored on `el.warp` (with `preset`+`bend` so it's
> live/re-editable), rendered by the existing warp path in BOTH styles, bakeable via `bakeWarp`.
> Context-menu (Path ▸ Warp Preset) + API + help doc (`illustrator-tools-doc`). Verified in-app
> (all 6 presets deform text in both styles; live re-bend). **Make with Top Object SHIPPED**
> (`envelopeWithTopObject`/`Yappy.envelopeWithTopObject` — silhouette warp grid via `silhouetteWarpGrid`;
> top shape consumed, artwork scaled to its bbox + squeezed into its outline; context menu). **Remaining
> Phase 2:** more presets (Fish/Shell/Squeeze/Inflate/Fisheye/Twist).

### Phase 2 — Warp presets + Make-with-Top-Object *(unlocks 3)*
Extend `utils/envelope-warp.ts`:
- **Named warp presets** — parametric deformers `Arc, Arch, Flag, Wave, Rise, Fish, Bulge, Shell (upper/lower), Squeeze, Inflate, Fisheye, Twist` with `bend` + H/V `distortion` sliders; store as `el.warp.preset` so it stays live & re-editable, Expand bakes to a path.
- **Make with Top Object** — use the frontmost selected shape's outline as the envelope target; map the lower artwork into it (inverse bilinear / boundary-warp).
- **Delivers:** Warp-Warp (16), Warp-TopObject (14), and completes Wave (18).

> **Status (2026-07-10):** Phase 3 **blend-along-a-spine — SHIPPED.** `blendAlongPath(ids, steps,
> orient)` distributes `steps` interpolated copies of two shapes along a selected path/line by arc
> length (reusing `elementPathSample`/`sampleAt`), auto-oriented to the tangent, interpolating
> size/colour/opacity/stroke. Context menu (*Blend Along Spine*, shown for 2 shapes + 1 spine) +
> API + help doc (`workspace-doc`). Verified in-app (circle→star trail along a curve). **smooth shape-morph SHIPPED** (`blendShapesMorph`/
> `Yappy.blendMorph`: resample+align both outlines, lerp point-for-point → true circle→star morph;
> context menu Blend ▸ Smooth Morph). **Remaining Phase 3:** live blend (`el.blend`) + Replace/Reverse Spine.

### Phase 3 — Blend upgrades *(unlocks 3)*
- **Blend along a spine** — after `blendShapes`, distribute the intermediates along a selected path (reuse `path-follow.ts` arc-length sampler); auto-orient to the tangent.
- **Replace / Reverse Spine** — swap the blend's spine for another path / reverse direction (Illustrator's Object ▸ Blend ▸ Replace Spine).
- **Smooth (shape) blend** — interpolate *outlines* by anchor correspondence (resample both to equal anchor counts, lerp positions) so two *different* glyphs/shapes morph, not just bbox-lerp.
- Make blend **live** (`el.blend = {aId,bId,steps,spineId}`) so editing an end updates the chain.
- **Delivers:** Blend (1), Spine (8), Flip (2, the blended-shadow half).

> **Status (2026-07-10):** Phase 4 **3D Extrude — SHIPPED (core, live).** `el.extrude` draws a shaded
> back face + side walls behind the shape at render time (`utils/extrude.ts` via `elementToMultiPolygon`
> world outlines + nonzero-winding walls), re-editable, both render styles. `setExtrude`/`clearExtrude`
> in app-store + api.ts; property-panel *3D EXTRUDE* editor (Depth/Angle/Shade sliders); context-menu
> *3D Extrude* presets; migration passthrough; help doc (`effects-doc`). Verified in-app (star/circle
> get real depth in both styles). **Known limit:** text extrudes its bbox — Convert to Outlines first for
> 3D letters. **Now also shipped:** 3D **Tilt (rotX/rotY)** foreshortening (full tilted-solid render) + **Expand to Faces** (`expandExtrude` → back/side-union/front editable paths, SVG-exportable). **Remaining Phase 4:** bevel profile, true Revolve, front-face lighting/gradients when tilted.

### Phase 4 — 3D Extrude & Bevel / Revolve / Rotate *(unlocks 5)* — **XL, schedule separately**
- Live `extrude3D` effect: extrude a 2D path outline to a depth, front/back faces + side walls, bevel profile, single directional light + ambient; **3D Rotate** (X/Y/Z) via a small matrix; **Revolve** for the lathe cases.
- Start from `projectToPlane` + perspective grid for the *Rotate/Vanishing-Point* subset (Steps #9, Warp-to-3D #17) which need rotation but not full extrusion — ship that slice first as **Phase 4a**, full extrude/bevel as **4b**.
- **Delivers:** Retro-3D (5), Pattern (4, the extruded logo), Warp-to-3D (17), Steps (9).

### Phase 5 — OpenType alternates *(unlocks 1, niche)*
- Read GSUB stylistic sets / `salt`/`swsh` from opentype.js; per-glyph alternate picker in Touch-Type mode.
- **Delivers:** Vintage-Alternates (12).

**Recommended sequencing:** 1 → 2 → 3 → (4a slice) → 4b → 5. Phases 1–3 are all Medium, reuse existing engines, and together cover **13 of 18** tutorials; do them first.

## 5. Documentation plan (the "doc gap")

Per CLAUDE.md, every shipped feature must update the web help doc (`frontend/src/help-docs/`),
the hotkeys list (`components/help-dialog.tsx`), and `api.ts`. New/changed docs per phase:

| Phase | Help doc to add/update (`help-docs/…`) | `api.ts` additions | Hotkeys |
|-------|----------------------------------------|--------------------|---------|
| 1 | **New** `features/live-effects-doc.tsx` (Appearance-stack effects: Transform-with-Copies, Blur; Expand). Update `appearance-stack-doc` cross-links. | `addTransformEffect`, `addBlurEffect`, `listEffects`, `expandEffects` | Effect menu shortcut; ⌘/Ctrl-D "Transform Again" note |
| 2 | **New** `features/warp-effects-doc.tsx` (named presets, sliders, Make-with-Top-Object, Mesh recap) — or extend the existing envelope/free-transform doc. | `applyWarpPreset(style, {bend,distortH,distortV})`, `envelopeWithTopObject` | — |
| 3 | **New/extend** `features/blend-doc.tsx` (steps vs smooth, spine, replace/reverse spine). | `blendAlongPath`, `replaceSpine`, `reverseSpine`, `blendSmooth` | — |
| 4 | **New** `features/3d-effects-doc.tsx` (Extrude & Bevel, Revolve, 3D Rotate; known limits). | `extrude3D`, `revolve3D`, `rotate3D` | — |
| 5 | Extend `shapes/text-*` or Touch-Type doc with **Alternate Glyphs**. | `listGlyphAlternates`, `setGlyphAlternate` | — |

**Pre-existing doc debt to clear alongside (found during the pen/path review):**
- **Draggable in-shape text label** (v0.8.45, `textOffsetX/Y` + grab-dot) is **not yet documented** — add drag-to-reposition steps to the text/label help doc.
- Confirm the **Vector Paths** doc mentions Pathfinder is menu-only (no panel button) if that stays true.
- After the API-robustness fix (createElement type aliasing), note valid shape-type names in the `api.ts` doc/reference so scripters don't reach for `'ellipse'`.

## 5b. Logo-design video (reviewed 2026-07-10 — no new gaps)

`3 Advanced logo design techniques ｜ Adobe Illustrator [bPrFoxDX-XM].mp4` — **reviewed by
frame extraction** (ffmpeg contact sheets across the 14.5-min video). The 3 techniques:

| # | Technique (as shown) | Yappy status |
|---|----------------------|--------------|
| 1 | **Rotational symmetry** — rotate-a-copy around a centre + **Transform Again (⌘D)**; builds the pinwheel mark, radial starburst, and hex-packed dot patterns | ✅ Have (`radialRepeat`, `transformAgain`, `mirrorCopy`) — destructive, which is fine for logo work; **Phase 1** makes it live |
| 2 | **Pathfinder + bounding-shape construction** — intersect / minus-front / divide against a hexagon boundary, built in **Outline view (⌘Y)** with radial guides | ✅ Have (full Pathfinder + region ops, outline view, guides + snapping) |
| 3 | **Stroke/line Blend along a spine** — concentric-line blend flowing into a "1" letterform via a Replace-Spine curve; stripe fill | ⚠️ **Phase 3** (blend-along-spine + replace-spine) — today's blend is bbox-lerp only |

**Conclusion: the logo video introduces NO new primitives** — it's covered by *existing*
capabilities (1, 2) plus **Phase 3** (3). One tiny enhancement worth noting: **rotate-copy
around an arbitrary reference point** (make `radialRepeat` / the Phase-1 Transform effect honour
a custom pivot via `setTransformPivot`, not just the selection centre). Add to Phase 1 scope.

## 6. Notes / decisions to settle before coding
- **Live-effect vs bake:** Illustrator effects are live & re-editable. Yappy's `warp`/`appearance`
  already prove the "layer over base shape at render time + Expand to bake" pattern — Phase 1 should
  generalize that into one `el.effects[]` stack rather than one-off fields, so Transform/Blur/Warp/3D
  all share it. **This is the true keystone.**
- **Both render styles:** every new effect must render in **sketch *and* architectural** (CLAUDE.md
  parity rule) and export to SVG (Transform→copies, Blur→`feGaussianBlur`, Warp→baked path).
- **WASM parity:** deformers/3D that touch geometry/hit-test need the JS↔WASM parity pass per CLAUDE.md.
- **3D scope:** decide raster-composited vs true vector faces; vector faces keep everything editable
  and SVG-exportable but are far more work. Recommend vector faces for extrude, raster only if needed.
