/**
 * Masks, Appearance & Image Trace — help doc.
 * Clipping masks (#3), the appearance stack (#11), and image trace (#13).
 */

import type { Component } from 'solid-js';

const MasksAppearanceTraceDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Masks, Appearance &amp; Image Trace</h1>
                <p class="doc-intro">
                    Three Illustrator-class tools: <strong>clipping masks</strong> (show artwork through a shape),
                    the <strong>appearance stack</strong> (extra fills/strokes on one object), and
                    <strong> image trace</strong> (turn a bitmap into editable vectors).
                </p>
            </header>

            {/* ─── CLIPPING MASKS ─────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Clipping Masks</h2>
                <p>
                    A clipping mask uses the <strong>top</strong> shape as a “window”: only the parts of the
                    object(s) underneath that fall <em>inside</em> that shape’s outline stay visible — everything
                    outside is hidden. The mask shape stops drawing its own fill and instead just defines the
                    visible region. It’s fully <strong>non-destructive</strong>: nothing is deleted, so you can
                    <em> Release</em> it any time to get the original objects back.
                </p>

                <h3>How to use it</h3>
                <table class="api-table">
                    <thead><tr><th>Step</th><th>Action</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td>Place your content (image / shape / group), then draw the mask shape <strong>on top</strong> of it.</td></tr>
                        <tr><td>2</td><td>Select <strong>both</strong> (marquee-drag, or click one and <span class="kbd">Shift</span>-click the other). The status bar shows “2 selected”.</td></tr>
                        <tr><td>3</td><td>Right-click → <strong>Make Clipping Mask</strong> (<span class="kbd">Ctrl</span>+<span class="kbd">7</span>). The topmost object becomes the mask.</td></tr>
                        <tr><td>4</td><td>To undo it: select the result → right-click → <strong>Release Clipping Mask</strong> (<span class="kbd">Ctrl</span>+<span class="kbd">Alt</span>+<span class="kbd">7</span>).</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    The menu item only appears when <strong>2 or more objects are selected</strong>. The mask and
                    its content are <strong>grouped</strong>, so they move together as one unit. Drag the photo
                    <em>behind</em> the mask anytime to re-frame it — like a live, adjustable crop.
                </p>

                <h3>Opacity masks (soft fades)</h3>
                <p>
                    A <strong>clipping mask</strong> is a hard cut — inside the shape or out. An
                    <strong> opacity mask</strong> is soft: the <em>brightness</em> of the mask becomes the
                    content’s transparency — <strong>white = fully visible, black = invisible, grays = partial</strong>.
                    Put a <strong>white→black gradient</strong> on top and choose right-click →
                    <strong> Make Opacity Mask</strong> to fade artwork out, feather an edge, or blend two images.
                </p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const art  = Y.createRectangle(150, 160, 300, 180, { backgroundColor:'#2563eb', fillStyle:'solid' });
const fade = Y.createRectangle(150, 160, 300, 180,   // white→black gradient = the mask
  { fillStyle:'linear', gradientType:'linear', gradientStart:'#fff', gradientEnd:'#000', gradientAngle:0 });
Y.setSelected([art, fade]);
Y.makeOpacityMask();                 // → the blue fades from solid (left) to clear (right)`}</code></pre>

                <h3>Clipping mask vs. eraser / crop</h3>
                <table class="api-table">
                    <thead><tr><th></th><th>Clipping mask</th><th>Eraser / crop</th></tr></thead>
                    <tbody>
                        <tr><td>Reversible</td><td>✅ fully (Release)</td><td>❌ destructive</td></tr>
                        <tr><td>Re-editable</td><td>✅ move/resize mask &amp; content independently</td><td>❌</td></tr>
                        <tr><td>Works on</td><td>shapes, images, groups, traced paths, warped art</td><td>raster-focused</td></tr>
                    </tbody>
                </table>

                <h3>What it’s for</h3>
                <ul>
                    <li><strong>Photo in a shape</strong> — avatars (photo in a circle), hexagon photo grids, pictures inside device mockups.</li>
                    <li><strong>Image-filled text / logos</strong> — place a texture or photo under big text-outlines and clip → letters painted with that image (chrome / watercolor type).</li>
                    <li><strong>Frame to an edge</strong> — draw freely past your card/poster boundary, then clip everything to a rectangle so nothing spills — without erasing the overflow.</li>
                    <li><strong>Reveal / spotlight effects</strong> — show just a slice of a busy illustration through a shape.</li>
                    <li><strong>Adjustable crops</strong> — because it’s live, reframe or resize anytime.</li>
                </ul>

                <h3>Examples</h3>
                <p>Run these in the browser console (the <code>Yappy</code> API). Each builds a small scene you can then tweak on the canvas.</p>

                <p><strong>1 — Blue rectangle clipped to a star (the basic idea):</strong></p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const rect = Y.createRectangle(150, 150, 260, 200,
  { backgroundColor: '#1d4ed8', fillStyle: 'solid' });
const star = Y.createStar(180, 160, 200, 200, 5,
  { backgroundColor: '#000' });   // top object = the mask
Y.setSelected([rect, star]);
Y.makeClippingMask();              // → a blue star (rect shows only through the star)`}</code></pre>

                <p><strong>2 — Circular avatar (photo clipped to a circle):</strong></p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
// (use any image data URL; here a quick gradient stands in for a photo)
const c = document.createElement('canvas'); c.width = c.height = 240;
const g = c.getContext('2d');
const grad = g.createLinearGradient(0,0,240,240);
grad.addColorStop(0,'#f59e0b'); grad.addColorStop(1,'#db2777');
g.fillStyle = grad; g.fillRect(0,0,240,240);
const photo = Y.createImage(160, 140, c.toDataURL(), 240, 240, {});
const circle = Y.createCircle(180, 160, 200, 200, { backgroundColor:'#000' });
Y.setSelected([photo, circle]);
Y.makeClippingMask();              // → the photo inside a circle; drag to re-frame`}</code></pre>

                <p><strong>3 — Confine artwork to a frame:</strong></p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
// a few shapes that overflow a frame
const a = Y.createCircle(80, 120, 160, 160, { backgroundColor:'#22c55e', fillStyle:'solid' });
const b = Y.createCircle(260, 220, 160, 160, { backgroundColor:'#3b82f6', fillStyle:'solid' });
const frame = Y.createRectangle(120, 140, 220, 160, { backgroundColor:'#000' }); // top = mask
Y.setSelected([a, b, frame]);
Y.makeClippingMask();              // → only what's inside the rectangle shows`}</code></pre>
                <p class="tip-box">
                    <strong>Pro combo:</strong> clip a <em>warped</em> image, art that has an <em>appearance stack</em>,
                    or the output of <em>Image Trace</em> — masks compose with everything else.
                </p>
            </section>

            {/* ─── APPEARANCE STACK ───────────────────────────────────── */}
            <section class="doc-section">
                <h2>Appearance Stack</h2>
                <p>
                    Give one object <strong>multiple fills and strokes</strong>, drawn over its base shape from
                    bottom to top. Great for outline / neon / double-border effects and translucent overlays —
                    on a single object, no duplicating. Works in both <strong>Sketch</strong> and
                    <strong> Architectural</strong> styles.
                </p>
                <p>
                    Right-click → <strong>Appearance</strong> → <em>Add Fill</em> / <em>Add Stroke</em> /
                    <em> Clear Appearance</em>. For exact control use the API.
                </p>

                <h3>Examples</h3>
                <p><strong>Neon double-stroke (architectural):</strong></p>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const r = Y.createRectangle(140, 150, 220, 150,
  { renderStyle:'architectural', backgroundColor:'#0f172a', fillStyle:'solid' });
Y.setAppearance({
  strokes: [ { color:'#22d3ee', width:14, opacity:0.9 },   // wide glow
             { color:'#a5f3fc', width:5 } ],               // bright core
  fills:   [ { color:'#22d3ee', opacity:0.12 } ]           // faint inner tint
}, [r]);`}</code></pre>

                <p><strong>Dashed accent over a sketch shape:</strong></p>
                <pre><code>{`const id = Y.createCircle(420, 150, 180, 140,
  { renderStyle:'sketch', backgroundColor:'#fef9c3', strokeColor:'#854d0e', fillStyle:'solid' });
Y.setSelected([id]);
Y.addAppearanceStroke({ color:'#dc2626', width:8, dash:'dashed' });
Y.addAppearanceFill({ color:'#16a34a', opacity:0.25 });`}</code></pre>
                <p class="tip-box">
                    Each fill/stroke takes <code>color</code>, <code>opacity</code> (0–1) and, for strokes,
                    <code>width</code> and <code>dash</code> (<code>solid</code>/<code>dashed</code>/<code>dotted</code>).
                    <code>Y.clearAppearance()</code> removes the stack; the base fill/stroke always remain.
                </p>

                <h3>Graphic Styles</h3>
                <p>
                    Save an object's whole look — fill, stroke, gradient/mesh, appearance stack, shadow, opacity — as a
                    named <strong>graphic style</strong>, then apply it to other objects in one click. Open the panel
                    with <strong>Alt+G</strong> (or View → <strong>Graphic Styles</strong>): the <strong>+</strong>
                    saves the selection's style; click a card (or its 🎨) to apply it to the current selection; ↻
                    redefines it from the selection; 🗑 deletes it. Styles are stored in the document, so they travel
                    with the file. (Right-click → <strong>Save as Graphic Style</strong>; API
                    <code>createGraphicStyle</code>/<code>applyGraphicStyle</code>.)
                </p>
                <h3>Global swatches</h3>
                <p>
                    A document <strong>colour palette</strong> with live links. Open it with <strong>Alt+W</strong>
                    (or View → <strong>Swatches</strong>): <strong>+</strong> adds a swatch (from the selection's fill);
                    click a chip to fill the selection and set it as the active colour for new shapes (the little
                    corner dot recolours the swatch itself); the
                    <strong> S</strong> button applies it as a stroke. Objects you apply a swatch to are
                    <strong> linked</strong> — recolour the swatch and every linked object updates at once. Editing an
                    object's colour directly breaks its link. Swatches are saved in the document.
                </p>

                <h3>Eyedropper</h3>
                <p>
                    Select the object(s) you want to restyle, then right-click → <strong>Eyedropper — pick style
                    from…</strong> and click any other object: its full look (fill, stroke, gradient/mesh, appearance,
                    shadow) is copied onto your selection. <strong>Esc</strong> cancels. It's a quick one-shot copy —
                    for a look you'll reuse repeatedly, save a <strong>graphic style</strong> instead.
                </p>
            </section>

            {/* ─── GRADIENT MESH ──────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Gradient Mesh</h2>
                <p>
                    Fill a shape with a smooth multi-colour <strong>mesh</strong> — a grid of coloured nodes that
                    blend bilinearly across the shape. Unlike a linear/radial gradient (one axis), a mesh lets
                    colour vary in <strong>both</strong> directions, so you can model soft shading, sheens and
                    multi-point colour blends. The fill is clipped to the shape outline and renders identically in
                    both <strong>Sketch</strong> and <strong>Architectural</strong> styles.
                </p>
                <h3>How to use it</h3>
                <p>
                    Select a shape and set <strong>Fill → Gradient Mesh</strong> in the Properties panel (or
                    right-click → <strong>Appearance</strong> → <em>Gradient Mesh Fill</em>). A
                    <strong> GRADIENT MESH</strong> editor appears: bump the <em>Rows</em>/<em>Cols</em> steppers to
                    add nodes, then click any swatch to recolour that node. <em>Remove mesh</em> reverts to a solid
                    fill.
                </p>
                <p>
                    For direct editing, click <strong>Edit on canvas</strong> (in the mesh editor) — the node grid
                    appears right on the shape as colour dots. <strong>Drag</strong> a dot to reshape the mesh
                    (warp the colour flow); <strong>click</strong> a dot (without dragging) to recolour it. Boundary
                    nodes slide along the edge and interior nodes move freely, so the fill always covers the shape.
                    <em>Reset nodes</em> returns the grid to even spacing; double-click the background to exit.
                    (<code>Yappy.toggleMeshEdit()</code>, <code>setMeshNodePosition(r,c,x,y)</code>.)
                </p>
                <h3>Example</h3>
                <pre><code>{`const Y = window.Yappy; Y.clear();
const id = Y.createCircle(180, 150, 300, 230, { backgroundColor:'#8b5cf6', fillStyle:'solid' });
Y.applyMeshGradient(3, 3, [id]);              // 3×3 node grid, seeded from the fill colour
// recolour the four corners + a bright centre
Y.setMeshNodeColor(0,0,'#ef4444',[id]); Y.setMeshNodeColor(0,2,'#f59e0b',[id]);
Y.setMeshNodeColor(2,0,'#3b82f6',[id]); Y.setMeshNodeColor(2,2,'#10b981',[id]);
Y.setMeshNodeColor(1,1,'#ffffff',[id]);
Y.setMeshSize(4, 4, [id]);                    // grow the grid (colours preserved)`}</code></pre>
                <p class="tip-box">
                    Nodes are laid out on an even grid over the shape's bounding box (positions are derived, so only
                    colours are stored — they survive save/load). <code>applyMeshGradient(rows, cols)</code>,
                    <code> setMeshSize(rows, cols)</code>, <code>setMeshNodeColor(row, col, color)</code> and
                    <code> clearMeshGradient()</code> all default to the current selection.
                </p>
            </section>

            {/* ─── IMAGE TRACE ────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Image Trace</h2>
                <p>
                    Turn a bitmap (logo, silhouette, line art, scanned sketch) into an <strong>editable vector
                    path</strong> you can recolor, reshape, boolean, or warp. Yappy thresholds the image and traces
                    its contours; <strong>holes</strong> (like the middle of an “O” or a donut) come out as real
                    holes via the even-odd fill rule.
                </p>
                <p>
                    Right-click an image → <strong>Image Trace</strong>. <strong>B&amp;W</strong> traces a single
                    silhouette path (with holes); <strong>Colour — 6 / 12 / 16</strong> quantizes the image into that
                    many colours and traces <em>one filled path per colour</em> (stacked, grouped).
                    <strong> Centre-line</strong> is for line art — it finds the <em>skeleton</em> (centre) of strokes
                    and emits thin <em>open</em> paths instead of filled outlines (ideal for hand-drawn lines, signatures,
                    maps). The new paths are placed over the image; <strong>delete the image</strong> to keep just the vectors.
                </p>

                <h3>Example</h3>
                <pre><code>{`const Y = window.Yappy; Y.clear();
// make a black ring (donut) bitmap so the trace has a hole
const c = document.createElement('canvas'); c.width = c.height = 200;
const x = c.getContext('2d');
x.fillStyle = '#fff'; x.fillRect(0,0,200,200);
x.fillStyle = '#000'; x.beginPath(); x.arc(100,100,80,0,7); x.fill();
x.fillStyle = '#fff'; x.beginPath(); x.arc(100,100,40,0,7); x.fill();
const img = Y.createImage(160, 140, c.toDataURL(), 200, 200, {});
setTimeout(() => {                 // let the image load first
  const [path] = Y.traceImage();   // → a vector path with a hole
  Y.updateElement(path, { backgroundColor: '#dc2626' }); // recolor to see it
}, 400);`}</code></pre>

                <table class="api-table">
                    <thead><tr><th>Option</th><th>Effect</th></tr></thead>
                    <tbody>
                        <tr><td><code>threshold</code> (0–255, default 128)</td><td>Lower = trace lighter areas too; higher = only the darkest. Adjust for contrast.</td></tr>
                        <tr><td><code>simplify</code> (default 1.0)</td><td>Lower (e.g. 0.4) = more anchors / higher fidelity; higher = smoother, fewer points.</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Best on high-contrast art (logos, silhouettes, B&amp;W line work). For photos, threshold-trace
                    gives a stylized silhouette. After tracing, edit the path with the node tools, run Pathfinder
                    booleans, apply an appearance stack, or clip it as a mask.
                </p>
            </section>
        </div>
    );
};

export default MasksAppearanceTraceDoc;
