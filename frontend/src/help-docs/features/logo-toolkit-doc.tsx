/**
 * Logo & Design Toolkit Documentation
 * Repeat & symmetry (radial / grid / mirror / transform-again), and Text → Outlines.
 * Built up phase by phase.
 */

import type { Component } from 'solid-js';

export const LogoToolkitDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Logo &amp; Design Toolkit</h1>
                <p class="doc-intro">
                    A set of construction tools for building logos, monograms, and symmetric marks —
                    the moves you see in pro logo-design timelapses. Arrange copies in rings and grids,
                    mirror artwork into symmetric pairs, and replay transforms to step-and-repeat. Pair
                    these with the <strong>Rulers &amp; Guides</strong> (Alt+R) and the
                    <strong> Vector Paths</strong> tools (Pathfinder, Offset, Outline Stroke) for a full
                    vector workflow.
                </p>
            </header>

            {/* Shape Builder */}
            <section class="doc-section">
                <h2>Shape Builder</h2>
                <p>
                    The fastest way to build a custom silhouette from simple shapes. Overlap a few primitives
                    (circles, rectangles, the pen tool…), select them all (≥2), then right-click → <strong>Shape
                    Builder</strong>. <strong>Drag a stroke across</strong> the regions you want to fuse — they highlight
                    and, on release, <strong>merge into one path</strong>. Hold <strong>Alt</strong> while dragging to
                    <strong> delete</strong> the regions you cross instead. <strong>Esc</strong> exits.
                </p>
                <p>
                    It works at the <strong>face level</strong>, exactly like Illustrator: the selection is broken into
                    its <em>atomic regions</em>. Two overlapping circles become <em>three</em> faces — the left crescent,
                    the central lens, and the right crescent — and you can act on each independently. Paint across the
                    lens with <strong>Alt</strong> to <strong>punch it out</strong> (carve a notch), or drag across one
                    crescent + the lens to fuse just those. Every region you <em>don't</em> touch is kept as its own
                    path. When the shapes don't overlap it falls back to merging whole shapes.
                </p>
                <p>
                    On a <strong>tablet</strong> (no Alt key), use the on-screen <strong>Merge / Delete</strong>
                    toggle in the hint bar to switch modes, then drag; tap <strong>Done</strong> to exit. Results
                    keep their original stacking order, and rotated shapes are handled correctly.
                </p>
                <p class="tip-box">
                    It's built on the Pathfinder engine, so each result is a true boolean region producing an editable
                    vector path. For precise set operations on exactly two shapes, the right-click
                    <strong> Pathfinder</strong> (union / subtract / intersect / exclude) is also there.
                    (<code>Yappy.toggleShapeBuilder()</code>.)
                </p>
                <h3>Compound Shapes — non-destructive booleans</h3>
                <p>
                    <strong>Pathfinder</strong> flattens and consumes the source shapes. When you want to keep them
                    editable, use <strong>Compound Shapes</strong> instead: right-click ≥2 shapes →
                    <strong> Make Compound Shape ▸ Unite / Minus Front / Intersect / Exclude</strong>. The result is one
                    object that <em>retains its sources</em>, so you can:
                </p>
                <ul>
                    <li><strong>Change the operation</strong> at any time — right-click the compound →
                        <strong> Compound Shape ▸ Op: …</strong> (the result re-evaluates live).</li>
                    <li><strong>Edit the sources in place</strong> — double-click the compound (or Compound
                        Shape ▸ Edit Contents) to explode it into its editable shapes; move/edit them and
                        press <span class="kbd">Esc</span> to rebuild the compound.</li>
                    <li><strong>Release</strong> it back into the original editable shapes.</li>
                    <li><strong>Expand</strong> it to flatten to a plain path (same as Pathfinder).</li>
                </ul>
                <p class="tip-box">
                    Scripting: <code>Yappy.makeCompound(ids, 'union'|'subtract'|'intersect'|'exclude')</code>,
                    <code> setCompoundOp(id, op)</code>, <code>releaseCompound(id)</code>, <code>expandCompound(id)</code>,
                    <code> editCompound(id)</code> / <code>finishCompoundEdit(save)</code>.
                </p>
            </section>

            {/* Repeat & symmetry */}
            <section class="doc-section">
                <h2>Repeat &amp; Symmetry</h2>
                <p>
                    Select one or more elements (or a group), then open
                    <strong> Repeat &amp; Mirror</strong> from the right-click menu, or run any of the
                    commands from the Command Palette (<span class="kbd">Ctrl</span>+<span class="kbd">K</span>).
                    Every operation works on the whole selection as one rigid unit and keeps copies grouped
                    with each other.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Command</th><th>Shortcut</th><th>What it does</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Repeat → Radial</strong></td>
                            <td>—</td>
                            <td>Arranges <em>N</em> copies evenly around the selection centre. Set the
                                <em> Count</em>, a <em>Radius</em> to push them out into a ring (0 = rotate
                                in place), and <em>Face center</em> to orient each copy outward. Radius 0
                                with Count 2 makes a 180° rotational mark (e.g. a yin-yang leaf).</td>
                        </tr>
                        <tr>
                            <td><strong>Repeat → Grid</strong></td>
                            <td>—</td>
                            <td>Tiles the selection into <em>Rows × Columns</em> with an adjustable
                                <em> Gap</em>.</td>
                        </tr>
                        <tr>
                            <td><strong>Mirror Copy →</strong></td>
                            <td>—</td>
                            <td>Duplicates the selection reflected across its <em>right</em> edge, so the
                                mirror sits adjacent and forms a horizontally-symmetric pair.</td>
                        </tr>
                        <tr>
                            <td><strong>Mirror Copy ↓</strong></td>
                            <td>—</td>
                            <td>Same, reflected across the <em>bottom</em> edge (vertical symmetry).</td>
                        </tr>
                        <tr>
                            <td><strong>Transform Again</strong></td>
                            <td><span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">D</span></td>
                            <td>Clones the selection and replays your last move or duplicate. Duplicate
                                (<span class="kbd">Ctrl</span>+<span class="kbd">D</span>) once, nudge it,
                                then press Transform Again repeatedly to step-and-repeat in the same
                                direction.</td>
                        </tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>Build a symmetric mark fast:</strong> draw one half, run <em>Mirror Copy →</em>,
                    then select both halves and use <em>Pathfinder → Unite</em> (in the Vector Paths tools)
                    to weld them into a single clean shape.
                </p>
                <p class="tip-box">
                    <strong>Build a radial/mandala mark:</strong> draw one petal/element, run
                    <em> Repeat → Radial</em> with a count of 6–12 and <em>Face center</em> on. Increase the
                    radius to spread the instances into a ring.
                </p>
            </section>

            {/* Text → Outlines */}
            <section class="doc-section">
                <h2>Text → Outlines</h2>
                <p>
                    Turn a text element into a fully-editable vector <strong>path</strong> of its glyph
                    shapes — the Illustrator "Create Outlines" move, and the foundation of wordmark and
                    monogram design. Select a text element and run <strong>Create Outlines</strong> from the
                    right-click <em>Path</em> submenu, the Command Palette, or press
                    <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">O</span>.
                </p>
                <p>
                    The result is a real vector path: the counters (the holes in <em>o, e, a, g, D…</em>)
                    become separate subpaths punched out with the even-odd fill rule, and every contour is
                    node-editable. Because it's now a path, the whole vector toolkit applies — reshape nodes,
                    combine letters with <strong>Pathfinder</strong> booleans, add <strong>Offset Path</strong>
                    borders, and weld with <strong>Outline Stroke</strong>.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Note</th><th>Detail</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Editable</td><td>Drag anchors and Bézier handles like any path; counters stay as holes.</td></tr>
                        <tr><td>Colour</td><td>The path inherits the text colour as a solid fill (no stroke).</td></tr>
                        <tr><td>Fonts</td><td>Works with the bundled families <strong>and any font you add from a file</strong> (<em>＋ Add font…</em>, .ttf / .otf / .woff).</td></tr>
                        <tr><td>Italics</td><td>Outlined from the family's real italic face where there is one (Inter, Poppins, Merriweather, Source Code Pro, JetBrains Mono) — a true italic is a different design, not a sloped roman. Families with no italic face (Virgil, Marker, Caveat) are slanted by the same amount the browser uses, so the vector matches the text it replaced.</td></tr>
                        <tr><td>Layout</td><td>Honours font size, weight, alignment, and hard line breaks. (No soft-wrap — break lines yourself for multi-line marks.)</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>Google fonts can't be outlined.</strong> A font added by name from the Google
                    Fonts browser arrives as a web font — the browser renders it, but hands us nothing we
                    can read the glyph shapes out of (it's WOFF2, which is Brotli-compressed and can't be
                    parsed client-side). To outline a Google font, download the family from
                    <em> fonts.google.com</em> and add the .ttf with <strong>＋ Add font…</strong>; the
                    outline then comes from the real typeface. Earlier versions quietly substituted a
                    default sans-serif here, which produced the right letters in the wrong face — it now
                    tells you instead and leaves your text alone.
                </p>
                <p class="tip-box">
                    <strong>Monogram recipe:</strong> type the letters → <em>Create Outlines</em> →
                    reposition / overlap the glyphs → select all → <em>Pathfinder → Unite</em> for a single
                    welded mark, or <em>Offset Path</em> for an outlined badge.
                </p>
            </section>

            {/* Symmetry */}
            <section class="doc-section">
                <h2>Symmetry</h2>
                <p>
                    <strong>Live symmetry: whatever you draw is mirrored as you draw it.</strong> The copies
                    track your stroke while the pointer is still down, so you see the whole mark forming rather
                    than half of it. Every drawing tool is covered — freehand, pen and polyline as well as
                    rectangles, ellipses, connectors and the rest.
                </p>
                <p>
                    Turn it on from the <strong>footer buttons</strong> (mirror left/right, mirror up/down, and
                    a crosshair to move the axis), with <span class="kbd">Alt</span>+<span class="kbd">Y</span>,
                    from the Command Palette, or in the <em>Symmetry</em> section of the Canvas panel. Dashed
                    axes appear at the centre of your view.
                </p>

                <h3>Modes</h3>
                <table class="api-table">
                    <thead><tr><th>Mode</th><th>What you get</th></tr></thead>
                    <tbody>
                        <tr><td><strong>Vertical</strong></td><td>Mirrors left ↔ right across a vertical axis. 2 copies.</td></tr>
                        <tr><td><strong>Horizontal</strong></td><td>Mirrors up ↕ down across a horizontal axis. 2 copies.</td></tr>
                        <tr><td><strong>Both</strong></td><td>4-way quadrant — vertical + horizontal + 180°. 4 copies.</td></tr>
                        <tr><td><strong>Radial</strong></td><td>Mandala: 2–24 spokes evenly around the centre.</td></tr>
                    </tbody>
                </table>

                <h3>Setting the axis / centre point</h3>
                <p>
                    Press <span class="kbd">Alt</span>+<span class="kbd">Shift</span>+<span class="kbd">Y</span>
                    (or <em>Move axis</em> in the Canvas panel) to show the centre handle, then drag it wherever
                    you want the mirror line or mandala centre. Replication is suspended while you're moving the
                    axis, so you can reposition without leaving stray copies. Press it again when you're done.
                </p>
                <p>
                    <strong>Angle</strong> tilts the mirror lines (−90°…90°) or offsets the radial spokes, so
                    symmetry doesn't have to be screen-aligned. <strong>Spokes</strong> sets the mandala count.
                </p>

                <h3>Working with the result</h3>
                <p>
                    Every instance of a mark is <strong>grouped with the original</strong>, so it moves, styles
                    and undoes as one object. To un-link them, ungroup as normal.
                </p>
                <p>
                    For marks drawn <em>before</em> you switched symmetry on, select them and run
                    <strong> Mirror Across Symmetry Axis</strong> (Command Palette, or right-click →
                    <em> Repeat &amp; Mirror</em>). Unlike <em>Mirror Copy</em> (which reflects across the
                    selection's own edge), this reflects across the shared axis — so every half lines up.
                </p>
                <p class="tip-box">
                    A stroke you abandon takes its mirror copies with it — a stray click that produces no shape
                    doesn't leave mirrored copies of nothing behind.
                </p>
            </section>

            {/* Node tool */}
            <section class="doc-section">
                <h2>Editing Nodes</h2>
                <p>
                    Open <strong>Vector Tools → Path → Nodes</strong> to edit a path's points directly. Every
                    anchor appears on the selected path: <strong>squares are corners, circles are smooth
                    nodes</strong>, so you can read a path's shape at a glance.
                </p>
                <p>
                    Selected a rectangle or an ellipse instead of a path? The bar offers
                    <strong> Convert to Path</strong> — one click and it becomes curve-editable.
                </p>

                <h3>Selecting nodes</h3>
                <p>
                    Click a node to select it, <span class="kbd">Shift</span>-click to add or remove one, or
                    <strong> drag a box</strong> across the canvas to rubber-band several at once.
                    <span class="kbd">Ctrl</span>+<span class="kbd">A</span> selects them all;
                    <span class="kbd">Esc</span> clears the selection, and pressing it again leaves the mode.
                </p>

                <h3>Editing</h3>
                <table class="api-table">
                    <thead><tr><th>Do this</th><th>Get that</th></tr></thead>
                    <tbody>
                        <tr><td>Drag any selected node</td><td>moves <em>every</em> selected node together</td></tr>
                        <tr><td><strong>Corner</strong> / <strong>Smooth</strong></td><td>changes the node type across the whole selection</td></tr>
                        <tr><td><strong>Delete</strong> (or <span class="kbd">Del</span>)</td><td>removes every selected node</td></tr>
                        <tr><td><span class="kbd">Alt</span>-click a segment</td><td>inserts a node at that point</td></tr>
                        <tr><td>Drag a segment between two nodes</td><td>bends it into a curve</td></tr>
                        <tr><td>Drag a smooth node's <strong>handle</strong></td><td>bends the curve; the opposite handle mirrors</td></tr>
                        <tr><td><span class="kbd">Alt</span>-drag a handle</td><td>breaks the mirror — gives a smooth node a cusp</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Turning a rectangle into a curvy blob is: Convert to Path → <span class="kbd">Ctrl</span>+
                    <span class="kbd">A</span> → <strong>Smooth</strong>. A path is never reduced below two
                    nodes, so Delete can't leave you with nothing.
                </p>
                <p>
                    A whole multi-node drag is a single undo step. <strong>Nodes</strong> sits alongside
                    <em> Curvature</em> (draw a curve through points you click) and <em>Reshape</em> (bend a
                    path without touching individual nodes) — three different jobs.
                </p>
            </section>

            {/* Fill mode */}
            <section class="doc-section">
                <h2>Fill Mode</h2>
                <p>
                    The <strong>paint-bucket button in the footer</strong> toggles fill mode (also on the tool
                    options bar as <strong>Fill</strong>). With it on, a freehand stroke (Pencil, Ink Brush,
                    Marker) draws as a <strong>solid filled silhouette</strong> in its own colour instead of a
                    line — the Alchemy-style way of blocking in shapes fast, where you scribble a rough outline
                    and get a filled mass.
                </p>
                <p>
                    The fill appears <strong>as you draw</strong>, not when you let go: the silhouette closes
                    itself across the gap between where you started and where the pointer is now, so you can see
                    the mass you are making and adjust mid-stroke. With symmetry on, every mirrored copy fills
                    live too — the quick route to a symmetrical silhouette or a mandala of solid petals.
                </p>
                <p>
                    The stroke is still drawn on top of the fill, so thin necks and the brush's taper stay
                    readable.
                </p>
                <h3>Changing the colour afterwards</h3>
                <p>
                    A filled stroke has <em>two</em> colours: the <strong>Background</strong> is the filled
                    body, and the <strong>Stroke</strong> is the outline drawn on top. Select the mark and
                    change either one in the Properties panel — they are independent, so you can keep a dark
                    outline around a light fill, or recolour the mass without touching its edge.
                </p>
                <p class="tip-box">
                    The fill starts out matching the stroke colour you drew with, because that is what a
                    silhouette should look like the moment it lands. That is only a starting value — it is a
                    normal Background colour from then on, and nothing re-derives it from the stroke.
                    (Before v0.8.191 the Background control was not offered for freehand marks at all, so a
                    filled stroke was stuck on the colour it was drawn in.)
                </p>
                <p>
                    The setting persists across sessions and is saved with the document, alongside the
                    symmetry mode, axis position, spoke count, tilt and the move-axis state — reopen a
                    drawing and it comes back set up the way you left it. Turn fill mode off to go back to
                    normal line strokes; existing marks are unaffected.
                </p>
            </section>

            {/* Free Transform */}
            <section class="doc-section">
                <h2>Free Transform</h2>
                <p>
                    <strong>Rotation-aware resize.</strong> Rotate a shape, then drag any corner or edge
                    handle — it now scales along the shape's <em>own</em> axes (not the screen's), and the
                    handle opposite the one you drag stays pinned. Hold <span class="kbd">Shift</span> to keep
                    the aspect ratio. This makes adjusting a tilted wordmark or emblem feel natural instead of
                    skewing off-axis.
                </p>
                <p>
                    <strong>Custom rotation point.</strong> By default a shape rotates about its centre. To
                    rotate about a different point, right-click (or long-press on a tablet) and choose
                    <em>Set Rotation Point Here</em> — a crosshair (⊕) appears at that spot. Drag the crosshair
                    to fine-tune it, then drag the rotate handle and the shape orbits that point. Right-click →
                    <em>Reset Rotation Point</em> returns it to the centre.
                </p>
                <p class="tip-box">
                    The rotation point is per-selection and resets automatically when you select something else.
                    It's perfect for swinging a motif around a shared hub — place the point at the hub, then
                    rotate-and-duplicate to build a radial mark by hand.
                </p>
                <p>
                    <strong>Numeric position &amp; size.</strong> The Properties panel's <em>Dimensions</em> group
                    has editable <strong>X / Y / W / H</strong> fields (alongside Angle). Type exact values for
                    pixel-perfect placement and sizing — and W/H scale a shape's vector geometry (pen points,
                    path anchors) right along with it, so paths stay crisp.
                </p>
                <p>
                    <strong>Reflect across the rotation point.</strong> With a rotation point set, right-click →
                    <em>Reflect Across Point →</em> (or <em>↓</em>) mirrors the selection to the other side of it —
                    a precise mirror-about-a-point, distinct from <em>Flip Horizontal/Vertical</em>
                    (<span class="kbd">Shift</span>+<span class="kbd">H</span> /
                    <span class="kbd">Shift</span>+<span class="kbd">V</span>).
                </p>
                <p>
                    <strong>What Flip mirrors about.</strong> One object flips about <em>its own centre</em>, so it
                    turns in place. Flip <em>several</em> at once and they mirror about the centre of the whole
                    selection — so the objects swap sides as a group rather than each spinning where it sits. Flip
                    the group again to get back exactly where you started.
                </p>
                <p class="doc-note">
                    <strong>Vector geometry flips with the shape.</strong> On a pen path or pencil stroke, Flip
                    mirrors the stored anchors and their Bézier handles — so the anchor squares stay on the
                    outline and the path is immediately editable (and exports) in its new orientation. Curved
                    connectors take their control points along too. Nothing needs baking or re-drawing after a
                    flip.
                </p>
                <p>
                    <strong>Envelope distort.</strong> Right-click → <em>Path → Envelope Distort</em> to wrap a
                    shape in a 4-corner cage — drag the <strong>orange corner handles</strong> to bend it into a
                    perspective or free-distort quad (great for ribbons, badges, and faux-3D wordmarks).
                    Non-path shapes are converted to an editable path automatically; choose
                    <em>Remove Envelope Distort</em> to clear the cage. Works in both render styles and exports to SVG.
                </p>
                <p>
                    <strong>Mesh warp.</strong> For finer control, right-click → <em>Path → Mesh Warp</em> and pick a
                    grid (2×2 up to 5×5). Dragging the <strong>interior</strong> control points bulges and waves the
                    middle of the shape — distortions a 4-corner cage can't make (think flowing ribbons, fish-eye
                    badges, organic blobs). Hit-testing and SVG export follow the mesh. Toggle
                    <em>Mesh: Smooth</em> for flowing bicubic curves (vs sharp straight cells). <strong>Images</strong>
                    warp too — the bitmap is texture-mapped through the mesh (great for mockups on curved surfaces).
                </p>
                <p>
                    <strong>Remove vs. Apply.</strong> The warp is non-destructive: <em>Remove Envelope Distort</em>
                    drops the cage and reverts to the original shape. To keep the distortion instead, use
                    <em>Apply / Bake Warp</em> — it commits the warp (a path's outline becomes new anchors; an image
                    rasterizes to a new bitmap) and removes the cage. Warped images also export to SVG now (baked to a
                    bitmap, since SVG can't express a freeform image warp).
                </p>
                <p>
                    <strong>Shear (slant).</strong> Hold <span class="kbd">Ctrl</span> (or <span class="kbd">Cmd</span>)
                    and drag a <strong>side</strong> handle to slant the shape — drag the top/bottom handle sideways
                    for horizontal shear, the left/right handle up/down for vertical shear. For exact values, type
                    into the <strong>Shear X / Shear Y</strong> fields in the Dimensions panel. Shear renders in both
                    Sketch and Architectural styles and exports to SVG as a true matrix transform — great for
                    italic/oblique wordmarks and isometric-looking marks.
                </p>
            </section>

            {/* Hands-on examples */}
            <section class="doc-section">
                <h2>Hands-on Examples (console)</h2>
                <p>
                    Paste these into the browser DevTools console (the <code>Yappy</code> API) to build a scene,
                    then tweak it on the canvas. Most transform/warp features are also on the right-click menu.
                </p>

                <p><strong>Numeric transform &amp; reflect across a pivot:</strong></p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const id = Y.createRectangle(200, 160, 180, 120, { backgroundColor:'#3b82f6', fillStyle:'solid' });
Y.setSelected([id]);
Y.setElementTransform(id, { x: 240, y: 180, width: 220, height: 100 }); // exact position/size
Y.setRotationPivot(240, 240);          // drop a custom rotation pivot (⊕)
Y.flipSelection('horizontal', 240);    // reflect across x = 240 (the pivot)`}</code></pre>

                <p><strong>Shear (slant) for an oblique wordmark:</strong></p>
                <pre><code>{`const r = Y.createRectangle(180, 160, 220, 120,
  { renderStyle:'architectural', backgroundColor:'#f59e0b', fillStyle:'solid' });
Y.updateElement(r, { shearX: 0.4 });   // horizontal slant; shearY slants vertically
// (or: Ctrl/Cmd + drag a side handle on the canvas)`}</code></pre>

                <p><strong>Envelope distort (4-corner) — wrap a shape in a draggable cage:</strong></p>
                <pre><code>{`const p = Y.createPath(
  [{x:0,y:0},{x:200,y:0},{x:200,y:150},{x:0,y:150}],
  { x:200, y:170, closed:true, renderStyle:'architectural', backgroundColor:'#22c55e', fillStyle:'solid' });
Y.setSelected([p]);
Y.toggleEnvelopeWarp();                 // 2×2 cage; corners are centred-local [-w/2..w/2]
const g = structuredClone(Y.getElement(p).warp);  // ⚠ clone — warp is a read-only proxy
g.points[1] = { x: 150, y: -120 };      // pull the top-right corner out
Y.updateElement(p, { warp: g });        // drag the orange corner handles to fine-tune`}</code></pre>

                <p><strong>Mesh warp (3×3) with bicubic smoothing — a flowing bulge:</strong></p>
                <pre><code>{`Y.setSelected([p]);
Y.applyMeshWarp(3, 3);                   // 9 control points
const m = structuredClone(Y.getElement(p).warp);
m.points[4] = { x: 40, y: -40 };         // bulge the CENTRE point (a 4-corner cage can't)
m.smooth = true;                         // Catmull-Rom curves instead of straight cells
Y.updateElement(p, { warp: m });
// Apply / Bake Warp to commit it: Y.bakeWarp([p])  (Remove instead reverts)`}</code></pre>

                <p><strong>Warp an image (texture-mapped) then bake to a bitmap:</strong></p>
                <pre><code>{`const c = document.createElement('canvas'); c.width=c.height=200;
const x=c.getContext('2d');
for (let j=0;j<8;j++) for (let i=0;i<8;i++){ x.fillStyle=(i+j)%2?'#1d4ed8':'#fde68a'; x.fillRect(i*25,j*25,25,25); }
const im = Y.createImage(420, 170, c.toDataURL(), 200, 200, {});
setTimeout(() => {                       // let the image load first
  Y.setSelected([im]); Y.applyMeshWarp(3,3);
  const w = structuredClone(Y.getElement(im).warp);
  w.points[1] = { x:0, y:-70 }; w.points[4] = { x:25, y:15 }; w.smooth = true;
  Y.updateElement(im, { warp: w });
  // Y.bakeWarp([im]);                    // rasterize the distortion into a new bitmap
}, 400);`}</code></pre>
                <p class="tip-box">
                    <strong>Two gotchas when scripting warps:</strong> (1) clone the warp with
                    <code> structuredClone</code> before editing it — <code>getElement(...).warp</code> is a
                    read-only reactive proxy and mutating it in place silently no-ops. (2) For images, wait for the
                    bitmap to load (it’s async) before warping/baking.
                </p>
            </section>

            {/* Recipes */}
            <section class="doc-section">
                <h2>Worked Recipes</h2>
                <table class="api-table">
                    <thead>
                        <tr><th>Goal</th><th>Steps</th></tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Rotational 2-up mark</td>
                            <td>Select the element → <em>Repeat → Radial</em>, Count 2, Radius 0.</td>
                        </tr>
                        <tr>
                            <td>Flower / mandala</td>
                            <td>Select one petal → <em>Repeat → Radial</em>, Count 8, Radius ~120, Face center on.</td>
                        </tr>
                        <tr>
                            <td>Pattern swatch</td>
                            <td>Select a motif → <em>Repeat → Grid</em>, e.g. 4 × 6, Gap 16.</td>
                        </tr>
                        <tr>
                            <td>Symmetric emblem</td>
                            <td>Draw the left half → <em>Mirror Copy →</em> → select both → Pathfinder Unite.</td>
                        </tr>
                        <tr>
                            <td>Linear array</td>
                            <td>Duplicate (<span class="kbd">Ctrl</span>+<span class="kbd">D</span>) → drag/nudge the copy →
                                <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">D</span> a few times.</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    Every toolkit move is also on the global <code>window.Yappy</code> object — paste these into
                    the browser DevTools console to build marks programmatically (or drive them from a script).
                    All calls act on the current selection unless an id list is passed.
                </p>

                <p><strong>Repeat &amp; symmetry</strong> — rings, grids, mirrors and step-and-repeat:</p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const petal = Y.createStar(300, 180, 60, 120, 3, { backgroundColor:'#8b5cf6' });
Y.setSelected([petal]);
Y.radialRepeat(8, { radius: 120, faceCenter: true }); // 8 copies in a ring, facing out
Y.gridRepeat(3, 4, { gapX: 16, gapY: 16 });           // tile as rows × cols
Y.mirrorCopy('horizontal');                           // reflect across the right edge
Y.transformAgain();                                   // replay the last move/duplicate`}</code></pre>

                <p><strong>Symmetry guide</strong> — a shared reflection axis to mirror halves onto:</p>
                <pre><code>{`Y.toggleSymmetryGuide(true);      // show the axis (optional 2nd arg = position)
Y.setSymmetryAxis('vertical');    // 'vertical' (left↔right) or 'horizontal'
Y.setSelected([petal]);
Y.mirrorAcrossSymmetry();         // drop a reflected copy across the guide`}</code></pre>

                <p><strong>Text → Outlines</strong> and <strong>Shape Builder</strong>:</p>
                <pre><code>{`const t = Y.createText(160, 200, 'AB', { fontSize: 96 });
const [outline] = Y.convertTextToOutlines([t]);   // glyphs → editable vector path (counters as holes)
Y.toggleShapeBuilder(true);                       // arm Shape Builder, then drag across regions on canvas`}</code></pre>
                <p class="tip-box">
                    Warp / envelope / mesh / shear scripting lives in <strong>Hands-on Examples</strong> above
                    (<code>setElementTransform</code>, <code>toggleEnvelopeWarp</code>, <code>applyMeshWarp</code>,
                    <code> bakeWarp</code>). Pathfinder booleans and Offset/Outline Stroke are in the
                    <strong> Vector Paths</strong> doc.
                </p>
            </section>
        </div>
    );
};

export default LogoToolkitDoc;
