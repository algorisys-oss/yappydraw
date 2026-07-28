/**
 * Math plotting — help doc.
 * `Yappy.plot`: coordinate systems (axes), function graphs, parametric curves,
 * and combining them with the scene script for manim-style explainers.
 */

import type { Component } from 'solid-js';

const PlottingDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Math Plotting</h1>
                <p class="doc-intro">
                    <code>Yappy.plot</code> draws <strong>coordinate systems</strong> and{' '}
                    <strong>function graphs</strong> — the pieces you need for maths, physics and ML
                    explainers. It is the equivalent of manim&rsquo;s <code>Axes</code> and{' '}
                    <code>axes.get_graph(f)</code>. Pair it with <code>Yappy.scene</code> (see the{' '}
                    <strong>Animation</strong> doc) to animate what you plot.
                </p>
            </header>

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
                        <strong>No LaTeX yet.</strong> Axis labels and captions are plain text, so equations
                        must be written in Unicode (<code>L = x²</code>). Fraction bars, integrals with limits
                        and matrices are not available.
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
                        No polar or logarithmic axes, 3D axes, or vector fields yet.
                    </li>
                </ul>
            </section>
        </div>
    );
};

export default PlottingDoc;
