---
id: plotting
name: Maths & Plotting
icon: "📈"
category: Features
description: LaTeX equations as vectors, plus axes, function graphs, vector fields and polar grids
keywords: latex tex mathjax equation equations formula math maths mathematics typeset fraction integral matrix matrices sqrt radical subscript superscript greek pi sigma partial derivative symbol per-symbol texpart plot plotting graph function curve axes axis coordinate system number line parametric lissajous cardioid polar grid vector field arrows gradient descent phase portrait sine cosine sin cos tan exponential parabola manim c2p sample samples domain pole asymptote tick label explainer scene script play wait animate expression valuetracker updater
---

# Maths & Plotting

`Yappy.tex` typesets **LaTeX equations** as vector artwork, and `Yappy.plot` draws **coordinate systems**, **function graphs** and **vector fields** — the pieces you need for maths, physics and ML explainers. Together they are the equivalent of manim’s `Tex`, `Axes` and `axes.get_graph(f)`. Pair them with `Yappy.scene` (see the **Animation** doc) to animate what you draw.

## Equations (`Yappy.tex`)

Typeset real TeX — fraction bars, integrals with limits, matrices, aligned derivations — as **vector paths**. Each glyph is an ordinary path element, so an equation scales, restyles, animates and exports like any other artwork. (Before this, equations had to be faked in Unicode: `L = x²` worked, `∂L/∂w` as a proper stacked fraction did not.)

`tex()` is **async** — MathJax is about 1 MB and is loaded lazily on first use, then cached, so it never slows down app startup.

```
                    const eq = await Yappy.tex(200, 200, 'e^{i\\\\pi} + 1 = 0', { fontSize: 48 });
eq.ids      // one path per glyph, in reading order
eq.parts    // [{ index, char: 'e' }, … , { char: 'π' }, …]
eq.groupId  // ties the glyphs together

// address a single symbol — manim's equation[R"\\pi"]
Yappy.texPart(eq.groupId, 'π').forEach(id =>
    Yappy.updateElement(id, { backgroundColor: '#dc2626' }));

Yappy.texPart(eq.groupId, 0);   // …or by index
Yappy.texParts(eq.groupId);     // every glyph, in order
```

| Option | Default | Meaning |
| --- | --- | --- |
| `fontSize` | 32 | Cap height of the equation, in px |
| `display` | true | Display (centred) vs inline style |
| `group` | true | Group the glyphs so the equation drags as one object |
| `backgroundColor` | slate-900 | Glyph colour — they are *filled* shapes, not stroked text |

Symbols are keyed by the character they **render as** (`'π'`, `'='`, `'w'`) or by index — not by LaTeX source, which MathJax does not map back. Invalid TeX shows a toast and creates nothing rather than failing silently.

### Morphing one equation into another

`Yappy.texTransform(from, to)` is manim’s `TransformMatchingTex`: symbols that appear in both equations **glide to their new positions** while the rest cross-fades. It is the move that makes a derivation read as one continuous idea rather than a slideshow.

```
                    const a = await Yappy.tex(200, 200, 'a^2 + b^2 = c^2', { fontSize: 54 });
const b = await Yappy.tex(200, 200, 'c = \\sqrt{a^2 + b^2}', { fontSize: 54 });

Yappy.texTransform(a.groupId, b.groupId, { duration: 1.5 });
// → { matched: 7, faded: 1, introduced: 2 }

Yappy.toggleSceneTimeline(true);
Yappy.playScene(true);
```

Create the target equation first — it is held invisible until the morph runs, and is what you are left with afterwards, so morphs chain. Glyphs pair by rendered character in reading order, so repeated symbols match left-to-right (the first `x` with the first `x`). It schedules on the `Yappy.scene` playhead and advances it, so it sequences with `scene.play`/`wait` like any other step.

| Option | Default | Meaning |
| --- | --- | --- |
| `duration` | 1 | Seconds the morph takes |
| `easing` | — | Named easing for the glide |
| `fadeRatio` | 0.5 | Fraction of the duration the fades occupy, so the glide reads as the main event |

## What it’s for

You could always draw a curve — `createPath` accepts any list of points. What was missing was something that owns the **unit → pixel mapping**, so plotting `sin(x)` meant hand-writing the arithmetic, the tick marks and the labels: about 25 lines and 19 elements for one curve. An *axes* object holds that mapping so a graph becomes one call.

## Creating axes

`Yappy.plot.axes(options)` draws the axis lines, tick marks and numeric labels, and returns an **AxesSpec** — a plain object (no functions inside), so it survives `JSON.stringify`, the embed bridge and a saved document.

| Option | Default | Meaning |
| --- | --- | --- |
| `ox`, `oy` | 480, 340 | Pixel position of the origin (0, 0) |
| `sx`, `sy` | 70, 70 | Pixels per unit on each axis |
| `xMin`, `xMax` | −4, 4 | Horizontal range in coordinates |
| `yMin`, `yMax` | −3, 3 | Vertical range in coordinates |
| `step` | 1 | Units between tick marks |
| `scale` | 'linear' | `'linear'` or `'log'` — sets both axes |
| `xScale`, `yScale` | — | Per-axis override; `{ yScale: 'log' }` gives a semi-log plot |
| `ticks`, `labels` | true | Draw tick marks / numeric labels |
| `minorTicks` | true | Log axes: mark the unlabelled 2…9 inside each decade |
| `color`, `labelColor`, `fontSize` | slate, slate, 14 | Styling |

```
                    const ax = Yappy.plot.axes({ xMin: -4, xMax: 4, yMin: -2, yMax: 2 });

Yappy.plot.point(ax, Math.PI / 2, 1);   // coords → pixels (manim's c2p)
Yappy.plot.coords(ax, 450, 250);        // pixels → coords (the inverse)
ax.elementIds;                          // ids of the lines/ticks/labels drawn
```

## Logarithmic axes

Set `scale: 'log'` for a log-log plot, or one of `xScale` / `yScale` for a semi-log one. On a log axis `sx` / `sy` means **pixels per decade** rather than per unit, ticks are placed one per decade (with the unlabelled 2…9 inside each), and curves are sampled *geometrically* — uniform sampling would crowd nearly every point into the last decade and draw the first ones from two or three samples.

```
                    // log-log: y = x and y = x² become straight lines of slope 1 and 2
const ax = Yappy.plot.axes({ xMin: 1, xMax: 1000, yMin: 1, yMax: 1000, scale: 'log' });
Yappy.plot.graph(ax, x => x);
Yappy.plot.graph(ax, x => x * x);

// semi-log: exponential growth becomes a straight line
const semi = Yappy.plot.axes({ xMin: 0, xMax: 5, yMin: 1, yMax: 1e5, yScale: 'log' });
Yappy.plot.graph(semi, x => Math.pow(10, x));
```

A log axis has no zero, so its axis line runs along the low edge rather than through the origin, and its range must be positive — a zero or negative bound is clamped to a small positive value instead of producing `NaN`. `point()` and `coords()` account for the scaling, so never do the arithmetic yourself.

## Plotting functions

`plot.graph(axes, fn, options)` samples `y = f(x)` across the axes’ x-range and returns a path element id. `fn` may be a real function *or* a string body in `x` — the string form is there so plots can be driven across the embed bridge, where functions cannot be sent.

```
                    Yappy.plot.graph(ax, Math.sin, { strokeColor: '#2563eb', strokeWidth: 3 });
Yappy.plot.graph(ax, x => x * x, { strokeColor: '#ef4444' });
Yappy.plot.graph(ax, 'Math.exp(-x*x)', { strokeColor: '#16a34a' });   // string form

// restrict the domain and control smoothness
Yappy.plot.graph(ax, Math.tan, { from: -1.4, to: 1.4, samples: 400 });
```

| Option | Default | Meaning |
| --- | --- | --- |
| `from`, `to` | axes x-range | Domain to sample |
| `samples` | 240 | Sample count — raise it for tight wiggles |
| …plus any normal element option (`strokeColor`, `strokeWidth`, `backgroundColor`, `renderStyle`…) |  |  |

**Poles are handled.** A non-finite sample (`1/x` at 0, the square root of a negative, `tan`’s asymptotes) *splits* the curve into separate subpaths instead of drawing a near-vertical spike from +∞ to −∞. If nothing in the range is finite, no element is created and the call returns `null`.

## Parametric curves

`plot.parametric(axes, fx, fy, options)` plots `(x(t), y(t))` over `[from, to]` (default `0 … 2π`). Both functions take `t`.

```
                    // unit circle
Yappy.plot.parametric(ax, 'Math.cos(t)', 'Math.sin(t)');

// Lissajous figure
Yappy.plot.parametric(ax, t => Math.sin(3 * t), t => Math.sin(2 * t), {
    samples: 600, strokeColor: '#a855f7',
});
```

## Vector fields & polar grids

`plot.vectorField(axes, fn, options)` draws an arrow at each grid point pointing along `fn(x, y)` — gradient flow, phase portraits, force diagrams. Arrow lengths are **normalised** so the longest vector on the grid is `maxLength` units; without that, one large vector flattens everything else into invisible stubs.

```
                    // rotational field — fn returns [dx, dy]
Yappy.plot.vectorField(ax, (x, y) => [-y, x], { step: 0.5 });

// gradient of x² + y², as two scalar functions (string form works too)
Yappy.plot.vectorField(ax, '2*x', '2*y', { step: 1, strokeColor: '#0ea5e9' });

// polar grid + a cardioid r = 1 + cos θ
Yappy.plot.polarGrid(ax, { ringStep: 1, spokes: 12 });
Yappy.plot.parametric(ax,
    t => (1 + Math.cos(t)) * Math.cos(t),
    t => (1 + Math.cos(t)) * Math.sin(t), { samples: 400 });
```

| Option | Default | Meaning |
| --- | --- | --- |
| `step` | 1 | Grid spacing in coordinate units |
| `maxLength` | step × 0.8 | Length of the longest arrow (others scale down proportionally) |
| `ringStep`, `spokes` | 1, 12 | `polarGrid`: ring spacing and number of radial lines |

## Animating a plot

Combine `plot.point` with `Yappy.scene` to move something along a curve. This is the gradient-descent example shipped in `examples/manim-gradient-descent.js`:

```
                    const ax = Yappy.plot.axes({ ox: 480, oy: 520, sx: 110, sy: 46,
                             xMin: -3, xMax: 3, yMin: 0, yMax: 9 });
Yappy.plot.graph(ax, x => x * x, { strokeColor: '#2563eb', strokeWidth: 3 });

let x = -2.6;
const p0 = Yappy.plot.point(ax, x, x * x);
const ball = Yappy.createCircle(p0.x - 13, p0.y - 13, 26, 26,
                                { backgroundColor: '#ef4444' });

Yappy.scene.reset();
for (let i = 0; i < 12; i++) {            // 12 descent steps
    x = x - 0.18 * (2 * x);               // x ← x − η·∇L
    const p = Yappy.plot.point(ax, x, x * x);
    Yappy.scene.play(ball, { x: p.x - 13, y: p.y - 13 }, { duration: 0.35 });
}
Yappy.toggleSceneTimeline(true);
Yappy.playScene(true);
```

## Known limitations

- **Axis labels are plain text.**`Yappy.tex` typesets real equations, but tick labels themselves are not TeX — place a `tex()` equation next to the axis if you need notation there.
- **Equation symbols are keyed by rendered character**, not LaTeX source. Structural marks with no glyph — fraction bars, radical vinculums — have no `data-c`, so they are not individually addressable.
- **Curves are dense polylines**, not fitted beziers — at the default 240 samples this reads as smooth and stays cheap to edit, but zooming far in reveals the segments. Raise `samples` if you need more.
- **Axes are drawn, not live.** Editing an `AxesSpec` afterwards does not move the elements already on canvas — create fresh axes instead.
- No 3D axes yet — that would need a scene graph and camera, which is a larger piece of work. Log axes, polar grids and vector fields are supported.
