/**
 * Workspace & Productivity — help doc.
 * Smart toolbar, align & distribute, the history panel, and export (incl. true
 * vector SVG).
 */

import type { Component } from 'solid-js';

const WorkspaceDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Workspace &amp; Productivity</h1>
                <p class="doc-intro">
                    The everyday helpers: the floating <strong>smart toolbar</strong>, <strong>align &amp;
                    distribute</strong>, a scrubbing <strong>history</strong> panel, and <strong>export</strong>
                    (including true-vector SVG).
                </p>
            </header>

            {/* ─── SMART TOOLBAR ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Smart toolbar</h2>
                <p>
                    Select an object and a compact <strong>quick-properties toolbar</strong> floats next to it with the
                    controls that matter for that object type — fill &amp; stroke colour, opacity, stroke style, and (for
                    anything that can hold text) <strong>font &amp; font size</strong>, alignment, and bold/italic. It's
                    the fastest way to restyle without opening the full Properties panel.
                </p>
                <p class="tip-box">
                    The toolbar adapts to what's selected: shapes show fill/stroke/roundness + text controls; connectors
                    show line width, type and arrowheads; text shows font, size and weight; images show filter presets.
                    Collapse it to a tiny chip with the slider icon; toggle it in Settings.
                </p>
                <p>
                    <strong>Type an exact value on any mini-slider.</strong> Drag the little sliders (font size, opacity,
                    …) for a quick nudge, or <strong>tap/click the number</strong> beside a slider to type a precise
                    value — press <strong>Enter</strong> to apply, <strong>Esc</strong> to cancel. Values clamp to the
                    slider's range automatically.
                </p>
            </section>

            {/* ─── ALIGN & DISTRIBUTE ─────────────────────────────────── */}
            <section class="doc-section">
                <h2>Align &amp; distribute</h2>
                <p>
                    Select two or more objects → the <strong>Alignment</strong> group in the Properties panel. Align
                    left/centre/right and top/middle/bottom; distribute spreads three or more objects evenly.
                </p>
                <h3>Align to a key object</h3>
                <p>
                    Toggle the <strong>crosshair</strong> button to align <em>to the key object</em> — the
                    <strong> last-selected</strong> object stays put and everything else lines up to it (instead of to
                    the selection's bounding box). Great for snapping a row of items to one anchor.
                </p>
                <h3>Distribute spacing</h3>
                <p>
                    The two <strong>space-around</strong> buttons distribute by <em>gap</em>, not centre: they make the
                    edge-to-edge spacing between objects equal (first/last stay put). Type a number in the
                    <strong> gap</strong> box to pack the objects with that exact pixel gap instead.
                </p>
                <p class="tip-box">
                    Centre distribution equalizes object <em>centres</em>; spacing distribution equalizes the
                    <em> gaps</em> — use spacing when objects are different sizes and you want even whitespace.
                </p>
            </section>

            {/* ─── MEASURE ────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Measure tool</h2>
                <p>
                    Turn it on from ☰ → View → <strong>Measure Tool</strong> (or <code>Yappy.toggleMeasure()</code>),
                    then <strong>drag</strong> anywhere on the canvas to lay down a measuring line. A readout shows the
                    <strong> length</strong> (in canvas units) and the <strong>angle</strong> from horizontal. The line
                    stays until your next drag; press <strong>Esc</strong> to exit.
                </p>
            </section>

            {/* ─── BLEND ──────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Blend</h2>
                <p>
                    Select exactly <strong>two</strong> objects, then right-click → <strong>Blend</strong> → choose a
                    step count (2–16). Yappy creates that many in-between copies, smoothly interpolating
                    <strong> position, size, rotation, colour, opacity and stroke width</strong> from the first object
                    to the second — a graduated chain (e.g. a small red circle blending into a large blue one).
                </p>
                <p class="tip-box">
                    The blend uses the first object's shape for the steps (it grows/recolours toward the second), so
                    it's ideal for graduated copies along a line. <code>Yappy.blend(steps)</code>.
                </p>
                <h3>Smooth Morph blend</h3>
                <p>
                    Right-click two shapes → <strong>Blend ▸ Smooth Morph</strong> to interpolate their
                    <em> outlines</em> point-for-point — so a circle actually <strong>morphs into a star</strong>
                    (not just grows/recolours). Each step is a new editable <strong>path</strong>; colours blend
                    too. <code>Yappy.blendMorph(steps)</code>. Great for shape-transition sequences and
                    logo/letter morphs.
                </p>
                <h3>Blend along a spine</h3>
                <p>
                    Select <strong>two objects plus a path or line</strong> (the spine), then right-click →
                    <strong> Blend Along Spine</strong> → step count. The in-between copies are distributed
                    <em> along the path</em> (evenly by arc length) and auto-rotated to follow its tangent —
                    Illustrator's <em>Blend + Replace Spine</em>. Great for beads-on-a-string, ribbons, and
                    text/shape trails that curve. <code>Yappy.blendAlongPath(steps, orient)</code>.
                </p>
                <p class="tip-box">
                    The steps interpolate size / colour / rotation / opacity between the two ends (using the first
                    object's shape). Draw the spine with the Pen, Line, or Pencil, then select all three.
                </p>
            </section>

            {/* ─── HISTORY PANEL ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>History panel</h2>
                <p>
                    Open it with <strong>Alt+H</strong> (or View → <strong>History Panel</strong>) to see the document's
                    timeline — past states, the current state, and any redoable future states. <strong>Click any
                    row</strong> to jump straight to that point (it undoes/redoes the difference for you). Each row shows
                    its object count; the current state is highlighted and future states are dimmed.
                </p>
                <p class="tip-box">
                    A faster way to scrub than tapping Undo/Redo repeatedly — jump back several steps, inspect, and jump
                    forward again in one click.
                </p>
            </section>

            {/* ─── EXPORT ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Export</h2>
                <p>
                    From the menu (or right-click → Export) save your work as <strong>PNG</strong>, <strong>JPG</strong>,
                    <strong> SVG</strong>, <strong>PDF</strong> or copy it to the clipboard — the whole canvas or just the
                    selection. <strong>Artboards</strong> export their region to a fixed-size PNG (see the Artboards doc).
                </p>
                <h3>True-vector SVG</h3>
                <p>
                    SVG export is real <strong>vector</strong>: shapes become <code>&lt;path&gt;</code>s, text becomes
                    <code> &lt;text&gt;</code>, and gradients &amp; gradient-mesh fills export as proper
                    <code> &lt;linearGradient&gt;</code>/<code>&lt;radialGradient&gt;</code>/<code>&lt;pattern&gt;</code>
                    definitions — so the file stays crisp at any size and is editable in Illustrator, Inkscape or the
                    browser. Sketch-style strokes export as vector too (via rough.js). A few highly decorative shapes
                    fall back to an embedded raster image.
                </p>
                <p class="tip-box">
                    Choose <strong>SVG</strong> for logos, icons and anything you'll scale or re-edit;
                    <strong> PNG</strong> (2×) for crisp raster output; <strong>PDF</strong> for print.
                </p>
            </section>

            {/* ─── SCRIPTING (API) ────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Every workspace helper is scriptable from the global <code>window.Yappy</code> object — paste
                    these into the browser console. History, view-fit, blends and repeat/transform commands act on
                    the current selection unless you pass explicit ids.
                </p>
                <pre class="code-block"><code>{`const Y = window.Yappy;

// History
Y.undo();                 // step back
Y.redo();                 // step forward

// Fit the whole drawing to the viewport
await Y.zoomToFit();`}</code></pre>
                <h3>Blends</h3>
                <pre class="code-block"><code>{`// select exactly two objects first, then:
Y.blend(6);               // 6 graduated in-between copies
Y.blendMorph(8);          // 8 outline-morph steps (editable paths)

// two objects + a path/line (the spine) selected:
Y.blendAlongPath(10, true); // 10 copies along the spine, orient to tangent`}</code></pre>
                <h3>Repeat &amp; transform</h3>
                <pre class="code-block"><code>{`// operate on the current selection
Y.radialRepeat(8, { radius: 160, faceCenter: true }); // 8 around a ring
Y.gridRepeat(3, 4, { gapX: 20, gapY: 20 });           // 3×4 grid of copies
Y.mirrorCopy('horizontal');                           // mirrored duplicate
Y.transformAgain();                                   // repeat the last move/scale/rotate`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Method</th><th>What it does</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>undo()</code> / <code>redo()</code></td><td>Step through the history timeline.</td></tr>
                        <tr><td><code>zoomToFit()</code></td><td>Fit all artwork to the viewport (async).</td></tr>
                        <tr><td><code>blend(steps?, ids?)</code></td><td>Graduated blend between two objects.</td></tr>
                        <tr><td><code>blendMorph(steps?, ids?)</code></td><td>Outline-morph blend (new editable paths).</td></tr>
                        <tr><td><code>blendAlongPath(steps?, orient?, ids?)</code></td><td>Distribute the blend along a selected spine.</td></tr>
                        <tr><td><code>radialRepeat(count, opts?)</code></td><td>Copies arranged around a ring.</td></tr>
                        <tr><td><code>gridRepeat(rows, cols, opts?)</code></td><td>Copies in a grid.</td></tr>
                        <tr><td><code>mirrorCopy(axis)</code></td><td>Mirrored duplicate (<code>'horizontal'</code>/<code>'vertical'</code>).</td></tr>
                        <tr><td><code>transformAgain()</code></td><td>Re-apply the last transform.</td></tr>
                        <tr><td><code>loadDocument(doc)</code></td><td>Replace the document with a saved JSON snapshot.</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Save/restore the whole document as JSON: grab it with a snapshot and reload it later with
                    <code> Y.loadDocument(json)</code> — handy for programmatic scene resets.
                </p>
            </section>
        </div>
    );
};

export default WorkspaceDoc;
