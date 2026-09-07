# Inflate 3D — spec

*Illustrator's `Effect ▸ 3D and Materials ▸ Inflate`, without a 3D engine.*

Status: **implemented, phase 1** (see "Not in phase 1" at the end).

## What it is

Puff a flat closed shape into a lit, rounded body. The shape's own outline is unchanged —
what changes is the fill: instead of one colour it becomes a shaded surface, as if the
silhouette had been inflated like a balloon and lit from a chosen direction.

It is the third member of Yappy's 3D set and the only one that adds **form** rather than
**depth or rotation**:

| effect | what it does |
|---|---|
| 3D Extrude | pushes the shape back, adding side walls and a back face |
| Turntable | spins the flat path in pseudo-3D, staying editable vector |
| **Inflate** | **rounds the shape's interior into a lit surface** |

## Why it does not need a 3D engine

Inflate is a **height field**, not geometry:

1. Rasterise the shape's outline to a mask.
2. Distance transform the mask — every interior pixel learns how far it is from the edge.
3. Map distance to height with a dome profile, `h = R·√(1 − (1 − t)²)` where `t = d / dmax`.
   Zero at the rim, maximum along the shape's spine. This is the "inflation".
4. Blur the height field. The distance transform creases along the shape's medial axis, and
   the crease is visible as a starburst once you differentiate. The silhouette does not move
   (the mask still clips), so blurring costs nothing but removes the artefact.
5. Differentiate for a surface normal, shade it with one light — Lambert diffuse plus a
   Blinn-Phong highlight — and multiply by the albedo.

The whole thing is one raster pass over the element's own box, which is the same shape as
`rasterizeMesh` and `rasterizePatternBuffer`. It therefore drops into the slot those already
occupy (`applyComplexFills`) and inherits sketch/architectural parity, per-page clipping,
PNG export and the SVG `<pattern>` path for free.

## Model

```ts
interface Inflate3D {
    bulge: number;        // 0..2   dome height, as a multiple of the inscribed radius
    softness?: number;    // 0..1   extra smoothing of the form (default 0.25)
    lightAngle: number;   // deg    direction the light comes FROM, 0 = right, CCW positive
    lightHeight: number;  // 0..90  degrees above the page; 90 = straight on, flat
    intensity?: number;   // 0..1   key light strength (default 0.75)
    ambient?: number;     // 0..1   fill light — sets how dark the unlit side goes (default 0.4)
    roughness?: number;   // 0..1   0 = tight glossy highlight, 1 = matte (default 0.35)
    metallic?: number;    // 0..1   tints the highlight toward the fill colour (default 0)
    highlight?: string;   // specular colour (default '#ffffff')
}
```

`hasInflate(el)` is `bulge > 0`, matching `hasExtrude`'s `depth > 0`.

### Albedo — what gets shaded

The surface colour, before light:

- `backgroundColor` — the normal case.
- `backgroundImage`, when `fillStyle === 'image'` — the **material**. This is what the
  Illustrator workflow calls applying a graphic: the texture is fitted to the element box and
  shaded as the surface, so a hand-painted skin becomes a lit 3D object.

The element's stroke still draws normally, in whichever render style is active.

### Light lives on the page, not on the object

The buffer is built in element-local space and drawn inside the element's rotation, so a
rotated element would otherwise carry its lighting around with it — rotate a shape and the
highlight would rotate too, which reads as the light being glued to the object. `el.angle` is
subtracted from `lightAngle` so the light stays put on the page while the object turns under it.

## Rendering

`hasInflate(el)` suppresses the flat fill in `buildRenderOptions` (exactly as a complex
fillStyle does) and `applyComplexFills` paints the shaded buffer instead, clipped to the
shape geometry. Both render styles then stroke over it as usual — sketch through RoughJS,
architectural through the clean path — so parity is structural rather than something to
remember.

### Cost and caching

One rasterisation is ~30–60 ms for a 384 px buffer, which is far too slow per frame, so the
result is cached per element under a hash of everything that can change it: the geometry path,
the box, the inflate parameters, the albedo (colour, image identity, whether the image has
finished loading), and dark mode. Dragging a slider re-rasterises; panning, zooming, selecting
and redrawing anything else do not.

The buffer is capped at 384 px on its long side and scaled up on draw. Shading is smooth and
low-frequency, so upscaling is invisible — the same argument `rasterizeMesh` makes at 256.

## Not in phase 1

Recorded so the boundary is deliberate rather than accidental:

- **Gradient / pattern / mesh albedo.** Only a solid colour or an image is shaded. Supporting
  arbitrary fills means rendering the element's existing fill to an offscreen buffer first,
  which is a recursion through the render pipeline rather than a small change.
- **Contact shadow.** The video's ground shadow is the existing **Drop Shadow** (offset +
  blur), which composes with Inflate today. A perspective-squashed contact shadow driven by
  the light's own angle and height is a separate effect.
- **Self-occlusion, perspective, real materials.** Inflate is 2.5D. It is excellent for blobs
  — fruit, badges, stickers, buttons, logo marks — and poor for concave forms or anything that
  needs to rotate. Illustrator's Inflate has the same ceiling.
- **Expand/bake.** Extrude bakes to face paths because those *are* paths. An inflated surface
  is a raster; baking it would mean emitting an image element. Worth doing, not yet done.
