/**
 * Vector Paths Documentation
 * Pen tool, node editing, Convert to Path, Pathfinder booleans,
 * Outline Stroke, Offset Path, and multi-subpath holes.
 */

import type { Component } from 'solid-js';

export const VectorPathsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Vector Paths</h1>
                <p class="doc-intro">
                    Draw and edit fully-editable Bézier paths — the same foundation Illustrator-class
                    vector work is built on. Create paths with the Pen tool, reshape them node-by-node,
                    convert any shape into a path, combine paths with boolean (Pathfinder) operations,
                    and derive new paths with Outline Stroke and Offset Path. Every path renders in both
                    the <strong>Sketch</strong> and <strong>Architectural</strong> drawing styles.
                </p>
            </header>

            {/* Pen tool */}
            <section class="doc-section">
                <h2>The Pen Tool</h2>
                <p>
                    Pick the <strong>Pen / Vector Path</strong> tool (the pen-nib icon) from the toolbar,
                    then build a path point by point. Click to drop corner points; click-and-drag to drop
                    a smooth point with curve handles that follow your drag.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Gesture</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Click</strong></td><td>Add a <em>corner</em> anchor (straight segment)</td></tr>
                        <tr><td><strong>Click + drag</strong></td><td>Add a <em>smooth</em> anchor; the drag sets the Bézier handles (curved segment)</td></tr>
                        <tr><td><strong>Click the first anchor</strong></td><td>Close the path into a filled shape</td></tr>
                        <tr><td><span class="kbd">Shift</span> + drag (while curving)</td><td><strong>Clock Method</strong> — constrain the Bézier handles to 90°/45° for clean, easily-edited curves</td></tr>
                        <tr><td><span class="kbd">Enter</span> / <span class="kbd">Esc</span> / <strong>double-click</strong></td><td>Finish the path open (not closed)</td></tr>
                        <tr><td><span class="kbd">Backspace</span></td><td>Remove the last anchor while still drawing</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>The Clock Method (90°/45°).</strong> Holding <span class="kbd">Shift</span> while you drag
                    a handle snaps it straight to 12/3/6/9 o'clock (or the diagonals) — the trick pro illustrators
                    use to keep curves smooth and predictable. No keyboard? Switch on the <strong>90°/45°</strong>
                    button in the floating <strong>Pen options bar</strong>, or rest a <strong>second finger</strong>
                    on the canvas while dragging with the stylus (the same Procreate-style constrain modifier used
                    for proportional resize).
                </p>
                <p class="tip-box">
                    A path carries the usual <strong>stroke</strong> (color / width / style), <strong>fill</strong>
                    (solid or gradient), and <strong>text</strong> properties — set them in the property panel
                    like any other shape.
                </p>
            </section>

            {/* Node editing */}
            <section class="doc-section">
                <h2>Editing Nodes</h2>
                <p>
                    Select a path with the <strong>Select</strong> tool to reveal its anchors (squares) and
                    Bézier handles (circles). Drag to reshape; use the modifiers below to restructure.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Gesture</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Drag an anchor</strong></td><td>Move the point (its handles travel with it)</td></tr>
                        <tr><td><strong>Drag a handle</strong></td><td>Reshape the curve (smooth = mirrored, corner = independent)</td></tr>
                        <tr><td><span class="kbd">Shift</span> + drag a handle</td><td>Constrain the handle to 90°/45° (Clock Method)</td></tr>
                        <tr><td><span class="kbd">Alt</span> + click an anchor</td><td>Convert <em>corner ↔ smooth</em></td></tr>
                        <tr><td><span class="kbd">Alt</span> + click a segment</td><td>Insert a new anchor on the segment</td></tr>
                        <tr><td><span class="kbd">Ctrl</span>/<span class="kbd">⌘</span> + click an anchor</td><td>Delete that anchor</td></tr>
                    </tbody>
                </table>

                <h3>On a tablet (no keyboard)</h3>
                <p>
                    Every node-editing action above has a touch equivalent, so you never need a modifier key
                    on an iPad or touch device:
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Touch gesture</th><th>Result</th><th>Desktop equivalent</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Tap an anchor</strong></td><td>Toggle <em>smooth ↔ corner</em></td><td><span class="kbd">Alt</span>-click</td></tr>
                        <tr><td><strong>Long-press an anchor</strong></td><td>Menu: <em>Make Smooth/Corner</em>, <em>Delete Anchor</em></td><td><span class="kbd">Alt</span> / <span class="kbd">Ctrl</span>-click</td></tr>
                        <tr><td><strong>Long-press the outline</strong></td><td>Menu: <em>Insert Point Here</em></td><td><span class="kbd">Alt</span>-click a segment</td></tr>
                        <tr><td><strong>90°/45° toggle</strong> or <strong>second finger</strong></td><td>Constrain handles (Clock Method)</td><td>Hold <span class="kbd">Shift</span></td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Tapping an anchor toggles its type; <em>dragging</em> it moves it — a small movement threshold
                    keeps the two apart, so a deliberate drag never accidentally flips the point.
                </p>

                <p class="tip-box">
                    Move, resize, rotate, align, snapping, and undo/redo all work on paths exactly as they do
                    for other shapes.
                </p>
            </section>

            {/* Convert to Path */}
            <section class="doc-section">
                <h2>Convert to Path</h2>
                <p>
                    Turn any shape into an editable vector path <strong>in place</strong> — same position,
                    z-order, style, and connections. Select one or more shapes, right-click, and choose
                    <strong> Path → Convert to Path</strong>.
                </p>
                <ul>
                    <li>Rectangles → 4 corner anchors</li>
                    <li>Circles / ellipses → 4 smooth Bézier anchors</li>
                    <li>Polygons &amp; stars → exact corner anchors</li>
                    <li>Complex shapes → outline sampled and simplified into anchors</li>
                </ul>
                <p>Once converted, every node is editable with the gestures above.</p>
            </section>

            {/* Pathfinder */}
            <section class="doc-section">
                <h2>Pathfinder (Boolean Operations)</h2>
                <p>
                    Combine two or more overlapping shapes into a new path. Select the shapes, right-click,
                    and open the <strong>Pathfinder</strong> submenu. Order matters for Subtract — the
                    back-most (lowest) shape is the base that the others are removed from.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Operation</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Unite</strong></td><td>Merge all shapes into one outline</td></tr>
                        <tr><td><strong>Subtract</strong></td><td>Remove the front shapes from the back-most shape</td></tr>
                        <tr><td><strong>Intersect</strong></td><td>Keep only the overlapping region</td></tr>
                        <tr><td><strong>Exclude</strong></td><td>Keep everything <em>except</em> the overlap</td></tr>
                    </tbody>
                </table>
            </section>

            {/* Outline & Offset */}
            <section class="doc-section">
                <h2>Outline Stroke &amp; Offset Path</h2>
                <p>
                    Both live in the right-click <strong>Path</strong> submenu.
                </p>
                <h3>Outline Stroke</h3>
                <p>
                    Converts a stroked line or path into a <em>filled</em> shape of the stroke itself
                    (thickness = the current stroke width). The original element is replaced; the new path
                    is filled with the old stroke color. Great for giving a brush-like outline real, editable
                    geometry you can then recolor or combine.
                </p>
                <h3>Offset Path</h3>
                <p>
                    Creates a parallel copy of the path, expanded or contracted by a fixed distance, while
                    keeping the original. <strong>Offset Path (+10)</strong> grows the outline outward by
                    10px; <strong>Offset Path (−10)</strong> shrinks it inward. Handy for concentric outlines,
                    padding, and inset/outset effects.
                </p>
            </section>

            {/* Path ops: simplify + compound */}
            <section class="doc-section">
                <h2>Simplify &amp; Compound Paths</h2>
                <p>In the right-click <strong>Path</strong> submenu:</p>
                <table class="api-table">
                    <thead><tr><th>Op</th><th>What it does</th></tr></thead>
                    <tbody>
                        <tr><td><strong>Simplify</strong></td><td>Reduces a path's anchor count while preserving its shape (great after Pathfinder/Outline produce dense corners)</td></tr>
                        <tr><td><strong>Join Paths</strong></td><td>Connects 2+ open paths into one by chaining nearest endpoints; auto-closes if the free ends meet</td></tr>
                        <tr><td><strong>Make Compound Path</strong></td><td>Combines 2+ selected shapes into one path; overlapping areas become <em>holes</em> (even-odd) — the way a donut or the letter “O” is built</td></tr>
                        <tr><td><strong>Release Compound Path</strong></td><td>Splits a compound path back into separate, individually editable paths</td></tr>
                    </tbody>
                </table>
            </section>

            {/* Export */}
            <section class="doc-section">
                <h2>Exporting as Vector</h2>
                <p>
                    Export to <strong>SVG</strong> (Export dialog → SVG) writes every shape and path as a
                    real, scalable <em>&lt;path&gt;</em> — including compound holes (even-odd), rotation, and
                    flips. Sketch-style shapes export as vector rough strokes; architectural shapes export as
                    clean paths. The result opens losslessly in Illustrator, Inkscape, or any browser, with no
                    pixelation.
                </p>
            </section>

            {/* Holes / multi-subpath */}
            <section class="doc-section">
                <h2>Holes &amp; Compound Paths</h2>
                <p>
                    A single path can hold <strong>multiple subpaths</strong> — letting it have holes (a donut,
                    the counter of an “O”) or several disjoint islands. Holes are produced automatically:
                </p>
                <ul>
                    <li><strong>Subtract</strong> a shape from the middle of another → the result keeps the hole.</li>
                    <li><strong>Outline Stroke</strong> on a closed loop → keeps the inner edge as a hole.</li>
                </ul>
                <p>
                    Compound paths fill with the <strong>even-odd</strong> rule, so overlapping closed subpaths
                    punch holes. Clicking <em>inside a hole</em> clicks through it (it selects whatever is behind,
                    not the path) — matching what you see. Resize, rotate, and both drawing styles work on
                    compound paths just like simple ones.
                </p>
                <p class="tip-box">
                    Compound paths are <strong>fully node-editable</strong> — select one and every subpath's
                    anchors (including the hole's) can be dragged, converted (Alt-click), deleted (Ctrl/⌘-click),
                    and have new anchors inserted (Alt-click a segment), just like a simple path.
                </p>
            </section>
        </div>
    );
};

export default VectorPathsDoc;
