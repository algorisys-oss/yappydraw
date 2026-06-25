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
                    Builder</strong>. <strong>Drag a stroke across</strong> the shapes you want to fuse — they highlight
                    and, on release, <strong>merge into one path</strong>. Hold <strong>Alt</strong> while dragging to
                    <strong> delete</strong> the shapes you cross instead. <strong>Esc</strong> exits.
                </p>
                <p class="tip-box">
                    It's built on the Pathfinder engine, so the merge is a true boolean union producing an editable
                    vector path. For precise set operations on exactly two shapes, the right-click
                    <strong> Pathfinder</strong> (union / subtract / intersect / exclude) is also there.
                    (<code>Yappy.toggleShapeBuilder()</code>.)
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
                        <tr><td>Fonts</td><td>Works with the bundled font families (the ones in the font picker). Italic text outlines upright in this version.</td></tr>
                        <tr><td>Layout</td><td>Honours font size, weight, alignment, and hard line breaks. (No soft-wrap — break lines yourself for multi-line marks.)</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>Monogram recipe:</strong> type the letters → <em>Create Outlines</em> →
                    reposition / overlap the glyphs → select all → <em>Pathfinder → Unite</em> for a single
                    welded mark, or <em>Offset Path</em> for an outlined badge.
                </p>
            </section>

            {/* Symmetry guide */}
            <section class="doc-section">
                <h2>Symmetry Guide</h2>
                <p>
                    A persistent reflection axis for building symmetric marks. Toggle it with
                    <span class="kbd">Alt</span>+<span class="kbd">Y</span> (or the Command Palette) — a dashed
                    line appears at the centre of your view. <strong>Drag the line</strong> to reposition it,
                    and switch between a vertical (left↔right) or horizontal (up↕down) axis from the Command
                    Palette (<em>Symmetry Guide: Switch Axis</em>).
                </p>
                <p>
                    Draw one half of your mark, select it, then run <strong>Mirror Across Symmetry Guide</strong>
                    (Command Palette, or right-click → <em>Repeat &amp; Mirror</em>) to drop a reflected copy on
                    the other side. Unlike <em>Mirror Copy</em> (which reflects across the selection's own edge),
                    this reflects across the shared guide — so every half you mirror lines up on the same axis.
                </p>
                <p class="tip-box">
                    The guide is a construction aid: it doesn't auto-mirror while you draw — you mirror on
                    demand, which keeps you in control of when each half is duplicated.
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
                    a precise mirror-about-a-point, distinct from <em>Flip Horizontal/Vertical</em> which mirror
                    about the shape's own centre.
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
        </div>
    );
};

export default LogoToolkitDoc;
