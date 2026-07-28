/**
 * Maths & plotting — help doc.
 * `Yappy.tex` (LaTeX → vector paths, per-symbol addressing) and `Yappy.plot`
 * (axes, function graphs, parametric curves, vector fields, polar grids).
 */

import type { Component } from 'solid-js';

const PlottingDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Maths &amp; Plotting</h1>
                <p class="doc-intro">
                    <code>Yappy.tex</code> typesets <strong>LaTeX equations</strong> as vector artwork, and{' '}
                    <code>Yappy.plot</code> draws <strong>coordinate systems</strong>,{' '}
                    <strong>function graphs</strong> and <strong>vector fields</strong> — the pieces you
                    need for maths, physics and ML explainers. Together they are the equivalent of
                    manim&rsquo;s <code>Tex</code>, <code>Axes</code> and <code>axes.get_graph(f)</code>.
                    Pair them with <code>Yappy.scene</code> (see the <strong>Animation</strong> doc) to
                    animate what you draw.
                </p>
            </header>

            {/* ─── LATEX ──────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Equations (<code>Yappy.tex</code>)</h2>
                <p>
                    Typeset real TeX — fraction bars, integrals with limits, matrices, aligned
                    derivations — as <strong>vector paths</strong>. Each glyph is an ordinary path
                    element, so an equation scales, restyles, animates and exports like any other
                    artwork. (Before this, equations had to be faked in Unicode: <code>L = x²</code>{' '}
                    worked, <code>∂L/∂w</code> as a proper stacked fraction did not.)
                </p>
                <p>
                    <code>tex()</code> is <strong>async</strong> — MathJax is about 1&nbsp;MB and is
                    loaded lazily on first use, then cached, so it never slows down app startup.
                </p>
                <div class="code-block">
                    <pre>{`const eq = await Yappy.tex(200, 200, 'e^{i\\\\pi} + 1 = 0', { fontSize: 48 });
eq.ids      // one path per glyph, in reading order
eq.parts    // [{ index, char: 'e' }, … , { char: 'π' }, …]
eq.groupId  // ties the glyphs together

// address a single symbol — manim's equation[R"\\pi"]
Yappy.texPart(eq.groupId, 'π').forEach(id =>
    Yappy.updateElement(id, { backgroundColor: '#dc2626' }));

Yappy.texPart(eq.groupId, 0);   // …or by index
Yappy.texParts(eq.groupId);     // every glyph, in order`}</pre>
                </div>
                <table class="api-table">
                    <thead>
                        <tr><th>Option</th><th>Default</th><th>Meaning</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>fontSize</code></td><td>32</td><td>Cap height of the equation, in px</td></tr>
                        <tr><td><code>display</code></td><td>true</td><td>Display (centred) vs inline style</td></tr>
                        <tr><td><code>group</code></td><td>true</td><td>Group the glyphs so the equation drags as one object</td></tr>
                        <tr><td><code>backgroundColor</code></td><td>slate-900</td><td>Glyph colour — they are <em>filled</em> shapes, not stroked text</td></tr>
                    </tbody>
                </table>
                <p>
                    Symbols are keyed by the character they <strong>render as</strong> (<code>'π'</code>,{' '}
                    <code>'='</code>, <code>'w'</code>) or by index — not by LaTeX source, which MathJax
                    does not map back. Invalid TeX shows a toast and creates nothing rather than failing
                    silently.
                </p>
            </section>

            {/* ─── WHY ────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>What it’s for</h2>
                <p>
                    You could always draw a curve — <code>createPath</code> accepts any list of points. What was
                    missing was something that owns the <strong>unit&nbsp;→&nbsp;pixel mapping</strong>, so
                    plotting <code>sin(x)</code> meant hand-writing the arithmetic, the tick marks and the
                    labels: about 25 lines and 19 elements for one curve. An <em>axes</em> object holds that
                    mapping so a graph becomes one call.
                </p>
            </section>

            {/* ─── AXES ───────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Creating axes</h2>
                <p>
                    <code>Yappy.plot.axes(options)</code> draws the axis lines, tick marks and numeric labels,
                    and returns an <strong>AxesSpec</strong> — a plain object (no functions inside), so it
                    survives <code>JSON.stringify</code>, the embed bridge and a saved document.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Option</th><th>Default</th><th>Meaning</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>ox</code>, <code>oy</code></td><td>480, 340</td><td>Pixel position of the origin (0,&nbsp;0)</td></tr>
                        <tr><td><code>sx</code>, <code>sy</code></td><td>70, 70</td><td>Pixels per unit on each axis</td></tr>
                        <tr><td><code>xMin</code>, <code>xMax</code></td><td>−4, 4</td><td>Horizontal range in coordinates</td></tr>
                        <tr><td><code>yMin</code>, <code>yMax</code></td><td>−3, 3</td><td>Vertical range in coordinates</td></tr>
                        <tr><td><code>step</code></td><td>1</td><td>Units between tick marks</td></tr>
                        <tr><td><code>ticks</code>, <code>labels</code></td><td>true</td><td>Draw tick marks / numeric labels</td></tr>
                        <tr><td><code>color</code>, <code>labelColor</code>, <code>fontSize</code></td><td>slate, slate, 14</td><td>Styling</td></tr>
                    </tbody>
                </table>
                <div class="code-block">
                    <pre>{`const ax = Yappy.plot.axes({ xMin: -4, xMax: 4, yMin: -2, yMax: 2 });

Yappy.plot.point(ax, Math.PI / 2, 1);   // coords → pixels (manim's c2p)
Yappy.plot.coords(ax, 450, 250);        // pixels → coords (the inverse)
ax.elementIds;                          // ids of the lines/ticks/labels drawn`}</pre>
                </div>
            </section>

            {/* ─── GRAPHS ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Plotting functions</h2>
                <p>
                    <code>plot.graph(axes, fn, options)</code> samples <code>y = f(x)</code> across the axes&rsquo;
                    x-range and returns a path element id. <code>fn</code> may be a real function <em>or</em> a
                    string body in <code>x</code> — the string form is there so plots can be driven across the
                    embed bridge, where functions cannot be sent.
                </p>
                <div class="code-block">
                    <pre>{`Yappy.plot.graph(ax, Math.sin, { strokeColor: '#2563eb', strokeWidth: 3 });
Yappy.plot.graph(ax, x => x * x, { strokeColor: '#ef4444' });
Yappy.plot.graph(ax, 'Math.exp(-x*x)', { strokeColor: '#16a34a' });   // string form

// restrict the domain and control smoothness
Yappy.plot.graph(ax, Math.tan, { from: -1.4, to: 1.4, samples: 400 });`}</pre>
                </div>
                <table class="api-table">
                    <thead>
                        <tr><th>Option</th><th>Default</th><th>Meaning</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>from</code>, <code>to</code></td><td>axes x-range</td><td>Domain to sample</td></tr>
                        <tr><td><code>samples</code></td><td>240</td><td>Sample count — raise it for tight wiggles</td></tr>
                        <tr><td colSpan={3}>…plus any normal element option (<code>strokeColor</code>, <code>strokeWidth</code>, <code>backgroundColor</code>, <code>renderStyle</code>…)</td></tr>
                    </tbody>
                </table>
                <p>
                    <strong>Poles are handled.</strong> A non-finite sample (<code>1/x</code> at 0, the square
                    root of a negative, <code>tan</code>&rsquo;s asymptotes) <em>splits</em> the curve into
                    separate subpaths instead of drawing a near-vertical spike from +∞ to −∞. If nothing in the
                    range is finite, no element is created and the call returns <code>null</code>.
                </p>
            </section>

            {/* ─── PARAMETRIC ─────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Parametric curves</h2>
                <p>
                    <code>plot.parametric(axes, fx, fy, options)</code> plots{' '}
                    <code>(x(t),&nbsp;y(t))</code> over <code>[from,&nbsp;to]</code> (default{' '}
                    <code>0&nbsp;…&nbsp;2π</code>). Both functions take <code>t</code>.
                </p>
                <div class="code-block">
                    <pre>{`// unit circle
Yappy.plot.parametric(ax, 'Math.cos(t)', 'Math.sin(t)');

// Lissajous figure
Yappy.plot.parametric(ax, t => Math.sin(3 * t), t => Math.sin(2 * t), {
    samples: 600, strokeColor: '#a855f7',
});`}</pre>
                </div>
            </section>

            {/* ─── VECTOR FIELDS ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Vector fields &amp; polar grids</h2>
                <p>
                    <code>plot.vectorField(axes, fn, options)</code> draws an arrow at each grid point
                    pointing along <code>fn(x,&nbsp;y)</code> — gradient flow, phase portraits, force
                    diagrams. Arrow lengths are <strong>normalised</strong> so the longest vector on the
                    grid is <code>maxLength</code> units; without that, one large vector flattens
                    everything else into invisible stubs.
                </p>
                <div class="code-block">
                    <pre>{`// rotational field — fn returns [dx, dy]
Yappy.plot.vectorField(ax, (x, y) => [-y, x], { step: 0.5 });

// gradient of x² + y², as two scalar functions (string form works too)
Yappy.plot.vectorField(ax, '2*x', '2*y', { step: 1, strokeColor: '#0ea5e9' });

// polar grid + a cardioid r = 1 + cos θ
Yappy.plot.polarGrid(ax, { ringStep: 1, spokes: 12 });
Yappy.plot.parametric(ax,
    t => (1 + Math.cos(t)) * Math.cos(t),
    t => (1 + Math.cos(t)) * Math.sin(t), { samples: 400 });`}</pre>
                </div>
                <table class="api-table">
                    <thead>
                        <tr><th>Option</th><th>Default</th><th>Meaning</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>step</code></td><td>1</td><td>Grid spacing in coordinate units</td></tr>
                        <tr><td><code>maxLength</code></td><td>step × 0.8</td><td>Length of the longest arrow (others scale down proportionally)</td></tr>
                        <tr><td><code>ringStep</code>, <code>spokes</code></td><td>1, 12</td><td><code>polarGrid</code>: ring spacing and number of radial lines</td></tr>
                    </tbody>
                </table>
            </section>

            {/* ─── ANIMATING ──────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Animating a plot</h2>
                <p>
                    Combine <code>plot.point</code> with <code>Yappy.scene</code> to move something along a
                    curve. This is the gradient-descent example shipped in{' '}
                    <code>examples/manim-gradient-descent.js</code>:
                </p>
                <div class="code-block">
                    <pre>{`const ax = Yappy.plot.axes({ ox: 480, oy: 520, sx: 110, sy: 46,
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
Yappy.playScene(true);`}</pre>
                </div>
            </section>

            {/* ─── LIMITS ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Known limitations</h2>
                <ul>
                    <li>
                        <strong>Axis labels are plain text.</strong> <code>Yappy.tex</code> typesets real
                        equations, but tick labels themselves are not TeX — place a <code>tex()</code>
                        equation next to the axis if you need notation there.
                    </li>
                    <li>
                        <strong>Equation symbols are keyed by rendered character</strong>, not LaTeX source.
                        Structural marks with no glyph — fraction bars, radical vinculums — have no
                        <code>data-c</code>, so they are not individually addressable.
                    </li>
                    <li>
                        <strong>Curves are dense polylines</strong>, not fitted beziers — at the default 240
                        samples this reads as smooth and stays cheap to edit, but zooming far in reveals the
                        segments. Raise <code>samples</code> if you need more.
                    </li>
                    <li>
                        <strong>Axes are drawn, not live.</strong> Editing an <code>AxesSpec</code> afterwards
                        does not move the elements already on canvas — create fresh axes instead.
                    </li>
                    <li>
                        No logarithmic axes or 3D axes yet. Polar grids and vector fields are supported;
                        3D would need a scene graph and camera, which is a larger piece of work.
                    </li>
                </ul>
            </section>
        </div>
    );
};

export default PlottingDoc;
