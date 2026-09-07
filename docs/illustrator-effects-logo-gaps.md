# Illustrator "Effects" + "Logo Process" videos — gap analysis

Review of two more videos (in `/temp/downloads/todo`) against YappyDraw, audited
**2026-06-27**. Prep for the **v1 release** pass (to be done together).

- **Video A — "All 20+ Effects in Adobe Illustrator Explained"** (`XeQo6fT0n_o`)
- **Video B — "The Illustrator Tips That Changed My Logo Design Process"** (`0JmAzciKYx0`)

Legend: **✅ have it · 🟡 partial / destructive equivalent · ❌ missing · ☁️ out of scope**

---

## The headline finding (Video A)

Illustrator's whole **Effects** system is **non-destructive live effects** stacked in the
**Appearance Panel** — you can reorder, hide, edit or delete an effect at any time, and
apply effects to an individual fill/stroke rather than the whole object.

YappyDraw **has an Appearance stack** (extra fills/strokes via `setAppearance`/
`addAppearanceFill`/`addAppearanceStroke`) and many of the *operations* below — **but
they're destructive** (they bake geometry into a new `path`). So the big architectural
gap is **live, re-editable effects in the appearance stack**, not the individual maths
(much of which already exists). That's the single biggest "Illustrator-parity" item left.

### Effect-by-effect

| # | Effect | Status | YappyDraw |
|---|---|---|---|
| 1 | **3D & Materials** (extrude/revolve, materials, lighting) | ❌ | No true 3D; `togglePerspectiveGrid`/`projectToPlane` only fake 2-pt perspective |
| 2 | Classic 3D | ❌ | — |
| 3 | **Convert to Shape** (rect/rounded/ellipse, auto-size box behind text) | ❌ | — |
| 4 | **Crop Marks** (per-object) | 🟡 | New `setBleed` draws crop marks per **artboard**, not per object |
| 5 | **Free Distort** (4-corner perspective) | 🟡 | Free-Transform shear + envelope/perspective warp exist; no 4-corner distort effect |
| 6 | **Pucker & Bloat** | 🟡 | `distort('pucker'/'bloat')` — **destructive** |
| 7 | **Roughen** | 🟡 | `distort('roughen')` — destructive |
| 8 | **Transform** (with **copies** → patterns) | 🟡 | `radialRepeat`/`gridRepeat`/`mirrorCopy`/`transformAgain` — destructive, not a live stacked effect |
| 9 | **Tweak** | ❌ | — |
| 10 | **Twist** | 🟡 | `distort('twirl')` ≈ twist — destructive |
| 11 | **Zig Zag** | 🟡 | `distort('zigzag')` — destructive |
| 12 | **Offset Path** | ✅ | `offsetPath(ids, dist)` (destructive, but so is using it) |
| 13 | **Outline Object** | ❌ | niche |
| 14 | **Outline Stroke** | ✅ | `outlineStroke(ids)` |
| 15 | **Pathfinder** (non-destructive effect) | 🟡 | `pathfinder`/`pathfinderRegion` exist but **destructive**; no Hard/Soft Mix, Trap |
| 16 | **Rasterize** (non-destructive) | ❌ | export rasterizes, but no live rasterize effect |
| 17 | **Drop Shadow** | ✅ | `shadowEnabled`/`shadowColor`/`shadowBlur`/offset on every element |
| 18 | **Feather** (soft fade edges) | ❌ | — |
| 19 | **Inner Glow** | ❌ | — |
| 20 | **Outer Glow** | 🟡 | ≈ Drop Shadow with 0 offset (can fake) |
| 21 | **Round Corners** | ✅ | `roundness` / live corner radius |
| 22 | **Scribble** | 🟡 | Sketch render-style (rough.js) gives a hand-drawn look, but no dedicated Scribble effect with angle/overlap/spacing |
| 23 | **SVG Filters** | ☁️ | web-only XML filters; niche |
| 24 | **Warp** (envelope distort) | ✅ | `toggleEnvelopeWarp`/`applyMeshWarp`/`togglePuppetWarp` |

**Takeaways:** the maths for Pucker/Bloat/Roughen/Twist/ZigZag/Offset/OutlineStroke/Warp/
repeat already exists — destructively. The genuinely missing *operations* worth adding are
**Feather**, **Inner/Outer Glow** (proper), **Scribble**, **Convert to Shape**, **Tweak**,
**per-object Crop Marks**, and **Free Distort (4-corner)**. The genuinely missing
*architecture* is **non-destructive live effects in the Appearance Panel**.

---

## Video B — logo process tips

| Tip | Status | YappyDraw |
|---|---|---|
| Round outer corner first, then inner (independent corner radii) | 🟡 | per-element `roundness`; no per-corner live widgets |
| **Split Into Grid** (Object › Path › Split Into Grid: N×M) | ❌ | no grid-split of a rectangle |
| **Convert shapes → Guides** (Cmd+5) + toggle guides | 🟡 | `addGuide(axis,pos)` for ruler guides only; can't turn a selected shape into guides |
| Clear-space + **Fit artboard to selected art** + export | ✅ | **shipped this session** — `fitArtboardToArtwork` + `exportArtboard` |
| Negative-space / inverted logo (Shape Builder) | ✅ | `toggleShapeBuilder` (Shift+M) |
| **Rearrange artboards** (columns + spacing) | ✅ | **shipped this session** — `rearrangeArtboards(cols, gap)` |
| **Create Swatch Info** (labelled swatch sheet w/ RGB/HSL/CMYK/Pantone) | ❌ | swatch **groups** shipped; no generated labelled swatch-sheet artboard |
| **Edit Similar Shapes together** (live Global Edit across artboards) | ❌ | `selectSimilar` selects, but no *live linked* edit-all |

Video B is mostly **already covered** (fit-artboard, rearrange-artboards, shape-builder all
shipped this session). New gaps it surfaces: **Split Into Grid**, **Convert to Guides**,
**Create Swatch Info sheet**, **live Global Edit**, **per-corner rounding**.

---

## Recommended scope for the v1 release pass (let's decide together)

> ### Update — Tier 1 shipped (2026-06-27)
> Implemented & e2e-verified (`tests/tier1-effects.spec.ts`, 7/7), zero regressions
> (52 render/feature specs green; the 6 prior "failures" were stale test selectors +
> the YAPPY_URL convention, now fixed):
> - **Convert to Shape** `Yappy.convertToShape('rectangle'|'rounded'|'ellipse')`
> - **Split Into Grid** `Yappy.splitIntoGrid(rows, cols, gap, id)` + **Convert to Guides** `Yappy.convertToGuides()`
> - **Feather** `Yappy.setFeather(px)` + **Outer Glow** `Yappy.setGlow({color,blur})` (Inner Glow deferred)
> - **Scribble** `Yappy.scribble({spacing,angle})`
> - **Per-object Crop Marks** `Yappy.toggleObjectCropMarks()`
> - **Create Swatch Info** `Yappy.createSwatchInfoSheet()`
> All on the Command Palette; help doc added ("Effects & Colour Tools").

**Tier 1 — high value, tractable (pure-data / bounded render):**
1. **Convert to Shape** (rect/rounded/ellipse from any object) — easy, useful.
2. **Split Into Grid** (rectangle → N×M cells) + **Convert to Guides** — logo workflow staples.
3. **Feather** + proper **Outer/Inner Glow** (element props + a blur pass) — completes the shadow/glow family.
4. **Scribble** effect (fill → scribbled strokes with angle/overlap/spacing).
5. **Per-object Crop Marks** (reuse the new crop-mark drawing around any selection's bbox).
6. **Create Swatch Info** sheet (generate a labelled swatches artboard).

**Tier 2 — bigger, architectural:**
7. **Non-destructive live effects in the Appearance Panel** — re-editable Pucker/Bloat/
   Roughen/ZigZag/Twist/Transform-with-copies/Offset stacked per fill/stroke. This is the
   marquee feature but a real architecture change (store an `effects[]` stack per
   fill/appearance entry and apply at render time).
8. **Live Global Edit** (edit-all-similar across artboards).
9. **3D & Materials** (extrude/revolve) — large; likely a v2 item.

**Out of scope:** SVG XML filters, Adobe-cloud/AI bits.

> Nothing here is implemented yet — this doc is the menu for the v1 pass we'll do together.
