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
                        <tr><td><span class="kbd">Shift</span> + click (between points)</td><td>Constrain the <strong>segment</strong> to 15° increments — perfectly horizontal, vertical or 45° lines</td></tr>
                        <tr><td><span class="kbd">Shift</span> + drag (while curving)</td><td><strong>Clock Method</strong> — constrain the Bézier handles to 90°/45° for clean, easily-edited curves</td></tr>
                        <tr><td><span class="kbd">Enter</span> / <span class="kbd">Esc</span> / <strong>double-click</strong></td><td>Finish the path open (not closed) — you can pick it up again later</td></tr>
                        <tr><td><span class="kbd">Backspace</span></td><td>Remove the last anchor while still drawing</td></tr>
                        <tr><td><strong>Click an end anchor of an open path</strong></td><td><strong>Continue that path</strong> from where you stopped</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>Pause a path and come back to it.</strong> You do not have to finish a path in one
                    sitting. Press <span class="kbd">Esc</span> or <span class="kbd">Enter</span> (or just switch
                    tools) and the path stays on the canvas, open, as an ordinary object — style it, move it, save
                    the drawing, close the app. To carry on, pick the <strong>Pen</strong> again and hover over
                    either <em>end</em> of the path: a blue ring appears on the anchor the next click will continue
                    from. Click it and you are back in drawing mode, rubber-band and all, with that anchor as the
                    live end. Clicking the <em>other</em> end then <strong>closes the shape</strong>.
                </p>
                <p class="tip-box">
                    Either end works. Click the <em>start</em> anchor and the path is continued backwards — Yappy
                    reverses the point order behind the scenes (handles and all, so the curve does not change) so
                    that new points still extend the end you clicked. Rotated paths and compound paths (ones with
                    holes) are not resumable this way; edit those with the <strong>Node tool</strong>
                    (<span class="kbd">N</span>) instead.
                </p>
                <p class="tip-box">
                    <strong>Shift does two jobs</strong>, and which one you get depends on whether you are dragging.
                    <strong>Between clicks</strong> it aims the next <em>segment</em>: the point snaps to the nearest
                    <strong>15°</strong> from the previous anchor, so straight horizontals, verticals and 45°
                    diagonals come out exact (the same increment the Line and Arrow tools use, and it overrides
                    Snap to Grid for that click). <strong>Mid-drag</strong> it shapes the <em>handles</em> instead —
                    see the Clock Method below. Clicking the first anchor still closes the path with
                    <span class="kbd">Shift</span> held.
                </p>
                <p class="tip-box">
                    <strong>The Clock Method (90°/45°).</strong> Holding <span class="kbd">Shift</span> while you drag
                    a handle snaps it straight to 12/3/6/9 o'clock (or the diagonals) — the trick pro illustrators
                    use to keep curves smooth and predictable. No keyboard? Switch on the <strong>90°/45°</strong>
                    button in the floating <strong>Pen options bar</strong>, or rest a <strong>second finger</strong>
                    on the canvas while dragging with the stylus (the same Procreate-style constrain modifier used
                    for proportional resize). The <strong>90°/45°</strong> toggle and the second finger constrain
                    segments too, so tablet users get the straight-line behaviour without a keyboard.
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
                    Nodes belong to the <strong>Node tool</strong>, not the Select tool — the same split every
                    other vector editor makes (Illustrator <span class="kbd">V</span> vs <span class="kbd">A</span>,
                    Inkscape <span class="kbd">S</span> vs <span class="kbd">N</span>). Press <span class="kbd">N</span>,
                    or simply <strong>double-click the path</strong>, to reveal its anchors (squares) and Bézier
                    handles (circles). Drag to reshape; use the modifiers below to restructure.
                </p>
                <p class="tip-box">
                    <strong>Why the Select tool shows no anchors.</strong> It used to. On a four-point curve that
                    was handy; on an outlined word or an imported icon it buried the artwork under hundreds of
                    squares you had no intention of touching — and the anchors sitting on the bounding box quietly
                    stole the corner-resize drag. Select is now purely a move / resize / rotate tool. You can still
                    <strong> right-click (or long-press) a path</strong> without leaving it to reach
                    <em> Make Smooth / Corner</em>, <em>Delete Anchor</em> and <em>Insert Point Here</em>.
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

                <h3>The Node tool (Illustrator's “Direct Selection”)</h3>
                <p>
                    Everything above edits <em>one</em> anchor at a time. Press <span class="kbd">N</span> —
                    double-click a path, or
                    Command Palette (<span class="kbd">Ctrl</span>+<span class="kbd">K</span>) →
                    <em> Node Tool / Direct Selection</em>, or the Vector Tools palette →
                    <strong> Nodes</strong> — to switch into the dedicated <strong>Node tool</strong>, which edits
                    <strong> many anchors at once</strong>. It's the same thing Illustrator calls
                    <em> Direct Selection</em> (the white arrow) and Inkscape calls the <em>Node tool</em>; Yappy
                    uses Inkscape's <span class="kbd">N</span> because <span class="kbd">A</span> is already the
                    Arrow tool.
                </p>
                <p>
                    Select a path first — the tool draws anchors for the <strong>selected</strong> path, so with
                    nothing selected there's nothing to edit. You don't have to leave the tool to move on:
                    <strong> click another shape</strong> and it becomes the one you're editing,
                    <strong> Shift-click</strong> to edit several paths at once, and with nothing selected a
                    <strong> drag picks shapes</strong> rather than anchors. Clicking empty space lets go in two
                    stages — the first click drops the selected anchors, a second drops the path — so missing an
                    anchor by a few pixels doesn't cost you your place.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Gesture</th><th>Result</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Click another shape</strong></td><td>Switch to editing that path — no need to leave the tool</td></tr>
                        <tr><td><span class="kbd">Shift</span> + click a shape</td><td>Add it, so several paths edit at once</td></tr>
                        <tr><td><strong>Drag on empty space</strong></td><td>Marquee-select every anchor inside the box (or shapes, if no path is loaded)</td></tr>
                        <tr><td><strong>Click empty space</strong></td><td>Drop the selected anchors; click again to drop the path</td></tr>
                        <tr><td><span class="kbd">Shift</span> + marquee</td><td>Add those anchors to the selection</td></tr>
                        <tr><td><strong>Drag a selected anchor</strong></td><td>Move <em>all</em> selected anchors together</td></tr>
                        <tr><td><strong>Drag a handle</strong></td><td>Reshape that one anchor's curvature</td></tr>
                        <tr><td><span class="kbd">Ctrl</span>/<span class="kbd">⌘</span>+<span class="kbd">A</span></td><td>Select every node of the selected path (as in Inkscape)</td></tr>
                        <tr><td><span class="kbd">Del</span> / <span class="kbd">Backspace</span></td><td>Delete the selected nodes (not the whole shape)</td></tr>
                        <tr><td><span class="kbd">Esc</span></td><td>Clear the node selection; press again to leave the tool</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Pressing <span class="kbd">N</span> again leaves the tool, as does the <strong>✕</strong> in the
                    tool-options bar. Scripted: <code>Yappy.toggleNodeTool(true)</code> /
                    <code> Yappy.toggleNodeTool(false)</code>.
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

            {/* Stroke appearance: align / join / cap */}
            <section class="doc-section">
                <h2>Stroke Alignment, Corners &amp; End Caps</h2>
                <p>
                    Three controls in the <strong>Properties panel</strong> decide how a stroke is actually
                    painted around its outline. They apply to shapes <em>and</em> Pen tool paths, in both the
                    sketch and architectural draw styles.
                </p>

                <h3>Stroke Align — Center / Inside / Outside</h3>
                <p>
                    By default a stroke <strong>straddles</strong> the outline: half its width falls inside the
                    shape, half outside. That's <em>Center</em>. Switch to:
                </p>
                <ul>
                    <li><strong>Inside</strong> — the whole stroke sits <em>within</em> the outline, so the shape
                        never grows past the box you drew. A border stops eating into the space around it.</li>
                    <li><strong>Outside</strong> — the whole stroke sits <em>outside</em> the outline, so a thick
                        border never covers the artwork or fill it frames.</li>
                </ul>
                <p>
                    This is what you want when a region has to line up <em>exactly</em> with a grid or a
                    neighbouring shape — a 12px map border on Center silently overhangs its region by 6px.
                </p>
                <p class="tip-box">
                    <strong>Closed outlines only.</strong> Inside/Outside need an interior to be meaningful, so
                    the control is offered for closed shapes and closed Pen paths. Open paths, lines, arrows and
                    freehand strokes stay centred.
                </p>

                <h3>Corner Style — Sharp / Round / Bevel</h3>
                <p>
                    How the stroke turns a corner. <strong>Miter (Sharp)</strong> extends both edges to a crisp
                    point; <strong>Round</strong> arcs them; <strong>Bevel (Flat)</strong> cuts the corner off
                    square. Sharp suits technical and architectural work, Round softens icons and routes, Bevel
                    keeps very thick strokes from growing long spikes at tight angles.
                </p>

                <h3>End Cap — Butt / Round / Square</h3>
                <p>
                    How an <strong>open</strong> path ends — Pen paths, lines and freehand strokes.
                    <strong> Butt (Flat)</strong> stops the line dead at its last point;
                    <strong> Round</strong> finishes with a half-circle; <strong>Square</strong> with a flat
                    extension. Round and Square both push the line <em>past</em> its final point by half the
                    stroke width, so Butt is the one to use when a route must terminate exactly on a coordinate.
                </p>

                <pre class="code-block"><code>{`const Y = window.Yappy;

// A region whose 12px border stays entirely inside its bounds
Y.createRectangle(100, 100, 200, 140, {
  strokeColor: '#1d4ed8', strokeWidth: 12,
  backgroundColor: '#bfdbfe', fillStyle: 'solid',
  strokeAlign: 'inside',        // 'center' (default) | 'inside' | 'outside'
  strokeLineJoin: 'miter',      // 'round' (default) | 'miter' | 'bevel'
});

// A map route that terminates exactly on its end points
Y.createPath([{ x: 100, y: 300 }, { x: 260, y: 340 }, { x: 400, y: 300 }], {
  strokeColor: '#0f766e', strokeWidth: 14,
  strokeLineCap: 'butt',        // 'round' (default) | 'butt' | 'square'
  strokeLineJoin: 'bevel',
});`}</code></pre>
                <p>
                    All three survive SVG export: corners and caps map straight onto
                    <code> stroke-linejoin</code> / <code>stroke-linecap</code>, and alignment is reproduced with a
                    <code> clipPath</code> (SVG has no <code>stroke-alignment</code> attribute of its own).
                </p>
                <p class="tip-box">
                    <strong>Sketch style is approximate.</strong> In the hand-drawn style rough.js paints its own
                    wobbly multi-pass strokes, so alignment is honoured to within the sketchiness rather than to
                    the pixel. Use the architectural style when the edge has to be exact.
                </p>
            </section>

            {/* Path ops: simplify + compound */}
            <section class="doc-section">
                <h2>Simplify &amp; Compound Paths</h2>
                <p>In the right-click <strong>Path</strong> submenu:</p>
                <table class="api-table">
                    <thead><tr><th>Op</th><th>What it does</th></tr></thead>
                    <tbody>
                        <tr><td><strong>Simplify</strong> <span class="kbd">Ctrl</span>+<span class="kbd">L</span></td><td>Reduces a path's anchor count while preserving its shape (great after Pathfinder/Outline produce dense corners)</td></tr>
                        <tr><td><strong>Smooth</strong></td><td>Rounds off janky corners without dropping anchors — the counterpart to Simplify</td></tr>
                        <tr><td><strong>Join Paths</strong></td><td>Connects 2+ open paths into one by chaining nearest endpoints; auto-closes if the free ends meet</td></tr>
                        <tr><td><strong>Make Compound Path</strong></td><td>Combines 2+ selected shapes into one path; overlapping areas become <em>holes</em> (even-odd) — the way a donut or the letter “O” is built</td></tr>
                        <tr><td><strong>Release Compound Path</strong></td><td>Splits a compound path back into separate, individually editable paths</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>Simplify and Smooth work straight off a freehand stroke.</strong> If what you selected
                    isn’t a path yet — a pencil/fineliner stroke, a star, a cloud — it is converted to an editable path
                    first, as part of the same action. That means one <span class="kbd">Ctrl</span>+
                    <span class="kbd">Z</span> undoes the whole thing, not just half of it. So the natural loop is:
                    scribble a hill with the freehand tool, press <span class="kbd">Ctrl</span>+<span class="kbd">L</span>,
                    and you get a clean, node-editable curve that keeps the hand-drawn wobble.
                </p>
                <pre><code>{`const Y = window.Yappy;
Y.simplifyPath();          // selection; auto-converts non-paths first
Y.smoothPath();            // same, but rounds corners instead of dropping anchors`}</code></pre>
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

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Everything the Pen tool and the right-click <strong>Path</strong> menu do is also
                    available programmatically. The global entry point is <code>window.Yappy</code>
                    (usable as <code>Yappy</code> in the console or a script block). Anchors use the
                    <code> PathAnchor</code> shape <code>{`{ x, y, kind?: 'corner' | 'smooth', inX?, inY?, outX?, outY? }`}</code>,
                    where the handle offsets are relative to the anchor.
                </p>

                <h3>Create &amp; read paths</h3>
                <pre class="code-block"><code>{`// A closed triangle from three corner anchors
const tri = Yappy.createPath([
  { x: 100, y: 100, kind: 'corner' },
  { x: 260, y: 140, kind: 'corner' },
  { x: 140, y: 260, kind: 'corner' },
], { closed: true, strokeColor: '#1e1e1e', strokeWidth: 2 });

// A smooth curve (Bezier handles via out/in offsets)
Yappy.createPath([
  { x: 100, y: 300, kind: 'smooth', outX: 60, outY: -60 },
  { x: 300, y: 300, kind: 'smooth', inX: -60, inY: -60 },
], { closed: false });

// Read an editable path back
const data = Yappy.getPath(tri); // { anchors, closed } or { subpaths }`}</code></pre>

                <h3>Holes &amp; compound paths</h3>
                <pre class="code-block"><code>{`// A donut: outer ring + inner hole (even-odd fill)
Yappy.createMultiPath([
  { closed: true, anchors: [
    { x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }, { x: 0, y: 200 },
  ] },
  { closed: true, anchors: [
    { x: 60, y: 60 }, { x: 140, y: 60 }, { x: 140, y: 140 }, { x: 60, y: 140 },
  ] },
], { backgroundColor: '#4dabf7' });

// Or build/release a compound from existing selected shapes
Yappy.makeCompoundPath([idA, idB]);
Yappy.releaseCompoundPath([compoundId]);`}</code></pre>

                <h3>Convert, combine &amp; derive</h3>
                <pre class="code-block"><code>{`// Any shape -> editable path (in place)
Yappy.convertToPath([shapeId]);

// Boolean (Pathfinder) ops on 2+ ids
Yappy.pathfinder([a, b], 'union');    // 'union' | 'subtract' | 'intersect' | 'exclude'
Yappy.pathfinderRegion([a, b], 'divide'); // 'divide' | 'trim' | 'merge' | 'crop' | 'outline'

// Stroke -> filled outline shape
Yappy.outlineStroke([lineId]);

// Parallel copy, +grows / -shrinks
Yappy.offsetPath([pathId], 10);

// Chain open paths into one (auto-closes if ends meet)
Yappy.joinPaths([p1, p2]);`}</code></pre>

                <h3>Tidy up</h3>
                <pre class="code-block"><code>{`// Reduce anchor count while keeping the shape
Yappy.simplifyPath([pathId]);

// Smooth anchors (strength 0..1, iterations). No ids -> current selection.
Yappy.smoothPath([pathId], 0.5, 2);`}</code></pre>

                <h3>Node editing</h3>
                <p>
                    The Node tool is scriptable as well as clickable. An anchor is addressed by a
                    <strong> NodeRef</strong> — <code>{'{ id, sub, i }'}</code>: the element id, which subpath
                    (0 for a simple path), and the anchor's index within it. Operations act on the current
                    <em> anchor</em> selection, which is separate from the element selection.
                </p>
                <pre class="code-block"><code>{`const Y = window.Yappy;

Y.select(pathId);
Y.toggleNodeTool(true);              // show the anchors

// Take every anchor of the selected path(s), then round them all off.
Y.setNodeSelection(Y.allNodesOfSelection());
Y.setSelectedNodesKind('smooth');

// Nudge just the anchors you pick (element-origin units).
Y.setNodeSelection([{ id: pathId, sub: 0, i: 2 }]);
Y.moveSelectedNodes(0, -20);

// Read positions in WORLD space, e.g. to drive your own layout.
Y.getPathNodes();    // [{ ref, x, y, kind }, ...]
Y.getNodeHandles();  // [{ h, x, y, ax, ay }, ...] for the selected anchors

Y.deleteSelectedNodes();             // a subpath is never taken below 2 anchors
Y.toggleNodeTool(false);`}</code></pre>

                <table class="api-table">
                    <thead>
                        <tr><th>Method</th><th>Purpose</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>toggleNodeTool(active?)</code></td><td>Show/hide the anchors of the selected path(s)</td></tr>
                        <tr><td><code>setNodeSelection(refs)</code></td><td>Replace the anchor selection; refs are <code>{'{ id, sub, i }'}</code></td></tr>
                        <tr><td><code>allNodesOfSelection()</code></td><td>Every anchor of every path in the element selection</td></tr>
                        <tr><td><code>getPathNodes()</code></td><td>Selected paths' anchors in world space — <code>{'{ ref, x, y, kind }'}</code></td></tr>
                        <tr><td><code>getNodeHandles()</code></td><td>Bézier handles of the selected anchors — <code>{'{ h, x, y, ax, ay }'}</code></td></tr>
                        <tr><td><code>moveSelectedNodes(dx, dy)</code></td><td>Move every selected anchor by the same delta</td></tr>
                        <tr><td><code>setSelectedNodesKind(kind)</code></td><td><code>'corner'</code> or <code>'smooth'</code> for the selection</td></tr>
                        <tr><td><code>deleteSelectedNodes()</code></td><td>Delete the selected anchors</td></tr>
                        <tr><td><code>createPath(anchors, opts?)</code></td><td>New single-subpath path; <code>opts.closed</code> fills it</td></tr>
                        <tr><td><code>createMultiPath(subpaths, opts?)</code></td><td>Multi-subpath path (holes / islands, even-odd)</td></tr>
                        <tr><td><code>getPath(id)</code></td><td>Read anchors + <code>closed</code>, or <code>subpaths</code></td></tr>
                        <tr><td><code>convertToPath(ids)</code></td><td>Turn shapes into editable paths in place</td></tr>
                        <tr><td><code>pathfinder(ids, op)</code></td><td>Boolean: union / subtract / intersect / exclude</td></tr>
                        <tr><td><code>pathfinderRegion(ids, op)</code></td><td>Region: divide / trim / merge / crop / outline</td></tr>
                        <tr><td><code>outlineStroke(ids)</code></td><td>Convert a stroke into a filled outline path</td></tr>
                        <tr><td><code>offsetPath(ids, distance)</code></td><td>Parallel copy (+out / −in)</td></tr>
                        <tr><td><code>simplifyPath(ids)</code></td><td>Reduce anchor count, keep shape</td></tr>
                        <tr><td><code>smoothPath(ids?, strength?, iterations?)</code></td><td>Smooth anchors (defaults 0.5, 2)</td></tr>
                        <tr><td><code>makeCompoundPath(ids)</code></td><td>Combine shapes into one compound path</td></tr>
                        <tr><td><code>releaseCompoundPath(ids)</code></td><td>Split a compound back into separate paths</td></tr>
                        <tr><td><code>joinPaths(ids)</code></td><td>Chain open paths by nearest endpoints</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Need a shape with no dedicated helper? The generics
                    <code> Yappy.createElement('path', x, y, w, h, opts)</code> and
                    <code> Yappy.updateElement(id, {`{ ... }`})</code> always work.
                </p>
            </section>
        </div>
    );
};

export default VectorPathsDoc;
