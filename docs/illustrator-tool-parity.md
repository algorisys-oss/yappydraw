# Adobe Illustrator tool parity — audit & implementation plan

Source: walkthrough video "All 80+ Adobe Illustrator Tools Explained in 20 Minutes"
(`/home/rajesh/temp/downloads/…iQWTSupSrko.mp4`). Audited the Yappy codebase against
the full Illustrator toolbar. This file records the gap analysis and the build-out
that followed.

Status legend: **FULL** (clear equivalent), **PARTIAL** (limited/different UX),
**MISSING** (no equivalent at audit time), **NEW** (added in this build-out).

## Already supported at audit time (FULL)

Selection · Group Selection · Lasso · Pen · Add/Delete/Convert Anchor · Type ·
Type-on-Path · Line · Rectangle · Rounded Rectangle · Ellipse · Polygon · Star ·
Paintbrush (fineliner) · Pencil (marker) · Smooth · Join · Eraser · Rotate ·
Reflect/Mirror · Scale · Shear · Free Transform · Envelope/Mesh Warp · Gradient ·
Gradient Mesh · Eyedropper · Swatches · Recolor Artwork · Shape Builder · Pathfinder
(union/minus/intersect/exclude) · Blend · Measure · Align/Distribute · Clipping Mask ·
Compound Path · Offset Path · Outline Stroke · Text-to-Outlines · Image Trace ·
Artboard · Hand/Pan · Rotate View · Zoom · Rulers/Guides · Symbols · Layers · SVG export

## Gaps at audit time

PARTIAL: Direct Selection (anchor-only), Blob Brush (no true blob smoothing),
Reshape (path nodes only), Symbol tools (place only — no sprayer/shifter/sizer/…),
Graphs (static shapes, no tool UI).

MISSING: Magic Wand · Curvature · Vertical Type · Touch Type · Arc · Spiral ·
Rectangular Grid · Polar Grid · Flare · Path Eraser · Shaper · Scissors · Knife ·
Width/Variable Stroke · Puppet Warp · Twirl · Pucker · Bloat · Scallop · Crystallize ·
Wrinkle · Live Paint Bucket · Live Paint Selection · Perspective Grid · Perspective
Selection · Slice · Symbol Sprayer (and the 7 symbolism sub-tools).

## Build-out (this batch)

Implemented now, each with render-style parity, API surface, and an e2e test:

- **Face-level Shape Builder** — Shape Builder now decomposes the selection into atomic
  faces (the lens of two overlapping circles is its own region) and merges/deletes the
  faces a stroke crosses; falls back to whole-shape union when shapes don't overlap.
- **Magic Wand** — select-similar by fill (and optionally stroke) colour.
- **Distort & Transform effects** — Pucker & Bloat, Twirl, Zig-Zag (= Scallop), Roughen
  (= Wrinkle), Crystallize, applied to selected paths/shapes (Illustrator's Effect →
  Distort & Transform family). Covers the liquify intent as deterministic path filters.
- **Scissors & Knife** — Scissors splits a path into two at a clicked point; Knife cuts
  shape(s) along a drawn line into separate pieces.
- **Generative shapes** — Spiral, Arc, Rectangular Grid, Polar Grid as path generators.
- **Vertical Type** — vertical text orientation.
- **Symbol Sprayer** — spray symbol instances along a drag.

## Build-out (second batch)

- **Live Paint Bucket** ✅ — make a Live Paint group from ≥2 overlapping outlines, click any
  atomic region to flood it; fills are locked paths beneath the outlines kept live by a
  guarded engine effect (drag a source → fills follow). Built on `computeShapeFaces`.
- **Width tool** ✅ — variable-width strokes on open paths via a `widthProfile` ({t, width}),
  rendered as a filled ribbon (`utils/variable-width.ts`); drag across a path to swell it.

## Build-out (third batch — full Illustrator-class coverage)

All high-value + niche deferrals are now implemented (each tested, in the Command Palette):
- **Curvature** — smooth path through clicked points (Catmull-Rom→Bézier).
- **Reshape** — bend a path at a point, endpoints pinned (cosine falloff).
- **Blob Brush** — paint filled shapes; same-colour overlaps merge (union of disks).
- **Path Eraser** — destructively carve a swath out of shapes (boolean difference).
- **Puppet Warp** — pins drive the mesh-warp grid via Shepard/RBF interpolation.
- **Perspective Grid** — 2-point grid + project shapes onto a plane (4-corner warp).
- **Lens Flare** — generated glow + rays + halo rings + ghosts.
- **Touch Type** — per-glyph {dx,dy,scale,rot} on single-line text.
- **Slice** — drag a region → PNG export (`exportRegion`).
- **Graph tools** — data-driven bar/pie charts + Edit Chart Data.
- **Symbolism brush** — Sizer/Spinner/Shifter/Screener/Stainer/Styler over instances.
- **Live Paint Selection** — hover-highlight + Alt-click to clear faces.

## Deferred (with rationale)
- **Perspective Grid / Selection** — full 1/2/3-point perspective drawing surface; large,
  niche. 3D-block shapes already cover the common case.
- **Puppet Warp** — pin-based mesh deform; Envelope/Mesh Warp already covers free distort.
- **Curvature / Touch Type / Flare / Shaper / Path Eraser** — niche; Pen + node tools +
  Smooth/Simplify cover the underlying needs.
- **Symbol sub-tools** (Shifter/Sizer/Spinner/Stainer/Screener/Styler) — once instances
  are sprayed, they are ordinary elements editable with the standard transform/colour
  tools; the dedicated symbolism brushes are low-value.
- **Graph tool UIs** — chart *shapes* exist; an interactive data-entry graph tool is a
  separate product surface.
- **Slice** — Artboards provide labelled export regions.
