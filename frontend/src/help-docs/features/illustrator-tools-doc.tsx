/**
 * Illustrator-class Tools Documentation
 * The vector-illustration tools added for Adobe-Illustrator parity: Magic Wand,
 * Distort & Transform, Knife & Scissors, generative shapes (Spiral/Arc/Grids),
 * Vertical Type, and the Symbol Sprayer. Detailed, with runnable API examples.
 */

import type { Component } from 'solid-js';

export const IllustratorToolsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Illustrator-class Tools</h1>
                <p class="doc-intro">
                    A toolkit of vector-illustration tools mapped from Adobe Illustrator: select-similar
                    (Magic Wand), the Distort &amp; Transform / Liquify family, Knife &amp; Scissors cutting,
                    generative shapes (spiral, arc, grids), Vertical Type, and the Symbol Sprayer. Every
                    tool has a right-click / panel entry <em>and</em> a scripting API on the global
                    <code> Yappy</code> object — paste the examples into the browser console to try them.
                </p>
                <p class="tip-box">
                    <strong>Where are these tools?</strong> Open the <strong>Vector Tools palette</strong> — click the
                    <strong> shapes button</strong> in the <strong>top bar</strong> (next to the
                    <span class="kbd">⌘</span> Commands button, left of Settings) for a
                    one-tap floating palette grouped by Build / Path / Paint / Warp / Symbol; the active tool
                    highlights. <strong>Shape Builder</strong> sits right beside it. On a phone the same three are
                    under <em>Menu → View</em>. Everything is also in the <strong>Command Palette</strong>
                    (<span class="kbd">Ctrl</span>/<span class="kbd">Cmd</span>+<span class="kbd">K</span> → type a name).
                    The right-click menu works too, but only when you click directly on a filled shape — so for
                    unfilled outlines (common with Live Paint) use the palette.
                </p>
            </header>

            {/* Combining shapes — the inner loop of logo work */}
            <section class="doc-section">
                <h2>⬤ Combining shapes — Unite, Subtract, Intersect, Exclude</h2>
                <p>
                    Building a logo or icon is mostly <em>combining</em> shapes, so these can live
                    where your hands already are rather than behind a menu. Turn on the{' '}
                    <strong>Pathfinder strip</strong> and a small toolbar appears{' '}
                    <strong>right above the selection</strong> whenever two or more shapes are
                    selected:
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Operation</th><th>Shortcut</th><th>What it does</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Unite</strong></td><td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>U</kbd></td><td>Merge everything into one shape</td></tr>
                        <tr><td><strong>Subtract</strong></td><td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd></td><td>Minus front — cut the top shape out of the one below</td></tr>
                        <tr><td><strong>Intersect</strong></td><td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>I</kbd></td><td>Keep only the overlap</td></tr>
                        <tr><td><strong>Exclude</strong></td><td><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd></td><td>Keep everything <em>except</em> the overlap</td></tr>
                    </tbody>
                </table>
                <p>
                    Inkscape users: the familiar <kbd>Ctrl</kbd>+<kbd>+</kbd>/<kbd>−</kbd>/<kbd>*</kbd>/<kbd>^</kbd>{' '}
                    can&rsquo;t be used here — the browser reserves those for page zoom — so the
                    same four operations are on <kbd>Ctrl</kbd>+<kbd>Alt</kbd> instead.
                </p>

                <h3>❖ Keep editable — non-destructive combining</h3>
                <p>
                    The <strong>❖</strong> toggle at the end of the strip switches from a
                    destructive combine to a <strong>compound shape</strong>: the originals are
                    kept inside it, so you can change the operation or release it later instead of
                    undoing back through your work. Illustrator hides this behind Alt-clicking a
                    Pathfinder button; here it&rsquo;s a visible switch that remembers your choice.
                </p>
                <p>
                    Right-click → <em>Pathfinder</em> still has the region operations —{' '}
                    <strong>Divide, Trim, Merge, Crop, Outline</strong> — which are occasional,
                    deliberate choices rather than inner-loop ones. They&rsquo;re also on the
                    strip&rsquo;s second row.
                </p>

                <h3>Turning the strip on and off</h3>
                <p>
                    The strip is <strong>off by default</strong>, because selecting two objects is
                    something you do constantly — to move them, align them, group them, recolour
                    them, or because a rubber-band grabbed one more than you meant. Popping a
                    floating panel of destructive operations over your artwork every time you did
                    that was more often in the way than useful.
                </p>
                <p>
                    Switch it on with the <strong>Pathfinder</strong> button in the top bar (next to
                    Shape Builder), <em>View → Pathfinder Strip</em>, right-click →{' '}
                    <em>Show Pathfinder Strip</em>, or the Command Palette
                    (<kbd>Ctrl</kbd>+<kbd>K</kbd> → &ldquo;Pathfinder Strip&rdquo;). It stays pinned
                    across selections and across sessions, so if you&rsquo;re doing a run of boolean
                    work you turn it on once. Also in <em>Settings → Canvas → Pathfinder Strip</em>.
                </p>
                <p class="tip-box">
                    <strong>The four shortcuts work whether or not the strip is showing.</strong>{' '}
                    <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>U</kbd>/<kbd>D</kbd>/<kbd>I</kbd>/<kbd>X</kbd>{' '}
                    act on the current selection with no panel at all — which is the point of having
                    them — and right-click → <em>Pathfinder</em> has every operation either way.
                </p>

                <h3>⬣ Shape Builder — combine by hand</h3>
                <p>
                    For anything beyond a single operation, <strong>Shape Builder</strong>{' '}
                    (<kbd>Shift</kbd>+<kbd>M</kbd>, or the icon in the main toolbar) is usually
                    faster than picking operations one at a time: select your shapes, then{' '}
                    <strong>drag across regions to merge them</strong>, or{' '}
                    <kbd>Alt</kbd>+drag across a region to delete it. It&rsquo;s the quickest way to
                    carve a finished silhouette out of a pile of overlapping circles and rectangles.
                </p>
                <p>
                    A <strong>badge follows the cursor</strong> so you always know which one you are about
                    to do: a blue <strong>+</strong> for merge, a red <strong>−</strong> for delete. It
                    updates the moment you press or release <kbd>Alt</kbd> — before you start the stroke,
                    not after — and the region highlight and the drag line take the same colour.
                </p>
                <p>
                    <strong><kbd>Shift</kbd>+drag draws a box</strong> instead of a stroke, and takes every
                    region the box touches — quicker than threading a line through a dozen small pieces.
                    <kbd>Shift</kbd>+<kbd>Alt</kbd>+drag does the same in delete mode. The box also catches
                    a region <em>larger</em> than itself, so you can rubber-band a small detail sitting
                    inside a big background shape. Whether it is a box or a stroke is decided when you
                    press: letting go of <kbd>Shift</kbd> mid-drag won't switch you.
                </p>
                <div class="code-block">
                    <pre>{`// the same operations from the API
Yappy.pathfinder([idA, idB], 'union');        // 'subtract' | 'intersect' | 'exclude'
Yappy.pathfinderRegion([idA, idB], 'divide'); // 'trim' | 'merge' | 'crop' | 'outline'

// non-destructive: sources survive, operation can change later
Yappy.makeCompound([idA, idB], 'subtract');
Yappy.setCompoundOp(id, 'intersect');
Yappy.releaseCompound(id);`}</pre>
                </div>
            </section>

            {/* Tablet & touch */}
            <section class="doc-section">
                <h2>📱 On a tablet (iPad / touch)</h2>
                <p>
                    All of these tools are built on pointer events, so they work with a finger or stylus. A few
                    touch-specific notes:
                </p>
                <ul class="doc-list">
                    <li><strong>Open the toolset</strong> with the <strong>⌘ Command</strong> button in the
                        toolbar (top-left). The right-click menu and <span class="kbd">Ctrl</span>+<span class="kbd">K</span>
                        aren't available without a mouse/keyboard, so this button is your gateway to every tool —
                        tap it, then tap the tool you want.</li>
                    <li><strong>Shape Builder</strong> has an on-screen <strong>Merge / Delete</strong> toggle
                        (no <span class="kbd">Alt</span> key needed) — tap it to switch modes, then drag across
                        regions. Tap <strong>Done</strong> to exit.</li>
                    <li><strong>Every tool overlay</strong> (Knife, Width, Live Paint, Sprayer…) has a
                        <strong> Done</strong> button or exits when you tap another tool — you're never stuck.</li>
                    <li>While a tool is active it captures the canvas, so pinch-zoom/pan pauses; tap
                        <strong> Done</strong> or another tool to get gestures back.</li>
                </ul>
            </section>

            {/* Magic Wand */}
            <section class="doc-section">
                <h2>🪄 Magic Wand — Select Similar</h2>
                <p>
                    Select one object, then right-click → <strong>Select Similar (Magic Wand)</strong> to
                    grab every other object that shares its <strong>fill colour</strong>. Great for
                    recolouring or restyling all the “same” pieces of a drawing at once. Locked objects and
                    objects on hidden layers are skipped.
                </p>
                <pre class="code-block"><code>{`// select everything that shares the first selected object's fill
Yappy.selectSimilar();

// match by stroke colour instead, from a specific object
Yappy.selectSimilar('rect-3', 'stroke');

// match BOTH fill and stroke
Yappy.selectSimilar(undefined, 'both');`}</code></pre>
                <p class="tip-box">
                    Combine it with <strong>Recolor Artwork</strong> (right-click → Recolor Artwork…): Magic
                    Wand to grab all the blue shapes, then shift their hue together.
                </p>
            </section>

            {/* Lock / Unlock */}
            <section class="doc-section">
                <h2>🔒 Locking objects — and getting them back</h2>
                <p>
                    Select something and press <span class="kbd">Ctrl+Shift+L</span> (or right-click →
                    <strong> Lock</strong>) to pin it in place. A locked object still draws, but the canvas
                    stops seeing it: you can't click it, drag it, resize it, or catch it in a marquee. That's
                    the point — it's how you stop a background photo or a finished layout element from
                    getting nudged while you work on top of it.
                </p>
                <p>
                    Which raises the obvious question: if you can't select it, how do you unlock it? Three ways:
                </p>
                <table class="api-table">
                    <thead><tr><th>Way in</th><th>How</th><th>When</th></tr></thead>
                    <tbody>
                        <tr>
                            <td><strong>Right-click the object</strong></td>
                            <td>Right-click straight on it → <em>Unlock “…”</em></td>
                            <td>You can see it and want just that one. The right-click menu works from the
                                point under your cursor rather than from the selection, so it can reach a
                                locked object even though nothing can select one. Several locked objects
                                stacked up? They're listed individually, topmost first.</td>
                        </tr>
                        <tr>
                            <td><strong>Unlock All</strong></td>
                            <td><span class="kbd">Ctrl+Alt+2</span>, or right-click → <em>Unlock All (n)</em></td>
                            <td>You've lost track of what's locked, or it's scrolled off-screen. The count in
                                the menu tells you how many are out there.</td>
                        </tr>
                        <tr>
                            <td><strong>Layer lock</strong></td>
                            <td>The padlock in the Layers panel (<span class="kbd">Alt+L</span>)</td>
                            <td>Locking a whole <em>layer</em> is separate from locking individual objects, and
                                is undone from the same padlock you locked it with.</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    Unlocking always <strong>selects</strong> what it freed, so you can get straight on with
                    whatever you unlocked it for.
                </p>
                <pre class="code-block"><code>{`Yappy.setLocked([bgId], true);   // pin a background out of the way
Yappy.getLocked();               // → ['img-2']  (ids of everything locked)
Yappy.unlockAll();               // → 1          (frees them and selects them)`}</code></pre>
                <p class="tip-box">
                    <strong>Note:</strong> <span class="kbd">Ctrl+Shift+L</span> toggles lock on the
                    <em> selection</em>, so it can lock but never unlock — a locked object isn't in any
                    selection. Use <span class="kbd">Ctrl+Alt+2</span> or the right-click menu instead.
                </p>
            </section>

            {/* Distort & Transform */}
            <section class="doc-section">
                <h2>〰️ Distort &amp; Transform (Liquify)</h2>
                <p>
                    Select one or more shapes, then right-click → <strong>Distort &amp; Transform</strong>
                    and pick an effect. Each one replaces the shape with a distorted, editable
                    <strong> path</strong>, so you can keep stacking effects or node-edit the result. These
                    cover Illustrator's Effect → Distort &amp; Transform menu and the intent of the Liquify
                    brushes as predictable, one-click filters.
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Effect</th><th>What it does</th><th>Good for</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Pucker</strong></td><td>Pulls edge midpoints inward (spiky star).</td><td>Stars, sparkles, sea-urchins.</td></tr>
                        <tr><td><strong>Bloat</strong></td><td>Pushes edge midpoints outward (balloon).</td><td>Blobs, petals, puffy badges.</td></tr>
                        <tr><td><strong>Twirl</strong></td><td>Rotates points around the centre, stronger near it.</td><td>Swirls, spiral motifs.</td></tr>
                        <tr><td><strong>Zig-Zag</strong></td><td>Ridges the outline in/out (a.k.a. Scallop).</td><td>Stamps, tickets, gears.</td></tr>
                        <tr><td><strong>Crystallize</strong></td><td>Pushes alternating points outward into spikes.</td><td>Bursts, shattered looks.</td></tr>
                        <tr><td><strong>Roughen</strong></td><td>Randomly jitters the outline (a.k.a. Wrinkle).</td><td>Hand-torn paper, grunge.</td></tr>
                    </tbody>
                </table>
                <pre class="code-block"><code>{`// turn a circle into a spiky star
const c = Yappy.createCircle(200, 200, 160, 160, { backgroundColor: '#f59e0b' });
Yappy.setSelected([c]);
Yappy.distort('pucker', 0.4);

// a puffy badge from a rectangle
const r = Yappy.createRectangle(120, 120, 160, 120, { backgroundColor: '#10b981' });
Yappy.setSelected([r]);
Yappy.distort('bloat', 0.3);

// amount is 0..1 relative to the shape's size
Yappy.distort('zigzag', 0.12);   // subtle ridges
Yappy.distort('roughen', 0.08);  // light grunge`}</code></pre>
                <p class="tip-box">
                    Effects are <em>deterministic</em> — the same shape + amount always gives the same
                    result, so they're safe to script and reproduce. Distort is destructive (it bakes a new
                    path); duplicate first (<span class="kbd">Ctrl</span>+<span class="kbd">D</span>) if you
                    want to keep the original.
                </p>
            </section>

            {/* Warp Presets */}
            <section class="doc-section">
                <h2>〜 Warp Presets — Make with Warp</h2>
                <p>
                    Bend a shape or text along a named envelope — Illustrator's <em>Object → Envelope Distort
                    → Make with Warp</em>. Select an object, right-click → <strong>Path → Warp Preset</strong>,
                    and pick a style. That first click applies a <strong>50% bend</strong>; how much it bends is
                    then yours to set, live, from the Properties panel (below). Renders in both
                    <strong> Sketch</strong> and <strong>Architectural</strong> styles.
                </p>
                <h3>Controlling how much it bends</h3>
                <p>
                    With the warped object selected, open the <strong>Properties</strong> panel
                    (<span class="kbd">Alt</span>+<span class="kbd">Enter</span>, the sliders button in the top
                    bar, or <em>Menu → Panels → Properties Panel</em>) — it grows a <strong>WARP PRESET</strong>
                    section. This is where the bend lives; the right-click menu only starts the warp. Everything
                    stays editable from here for as long as you haven't baked it:
                </p>
                <table class="api-table">
                    <thead><tr><th>Control</th><th>What it does</th></tr></thead>
                    <tbody>
                        <tr><td><strong>Style</strong></td><td>Switch between Arc / Arch / Flag / Wave / Rise / Bulge <em>after</em> the fact — the object re-warps from its original outline, so swapping styles never compounds.</td></tr>
                        <tr><td><strong>Bend</strong></td><td>Drag from <strong>−100%</strong> to <strong>+100%</strong>. The shape re-warps as you drag. <strong>0%</strong> is flat (undeformed); <strong>negative</strong> bends the other way — a Wave inverts its humps, an Arc becomes a frown instead of a rainbow.</td></tr>
                        <tr><td><strong>Bake</strong></td><td>Freeze the warp into permanent geometry. The anchors move to where the bend put them and the WARP PRESET section disappears — after this, the bend is no longer adjustable.</td></tr>
                        <tr><td><strong>Remove</strong></td><td>Drop the warp and go back to the unbent outline.</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    <strong>Drag, don't re-apply.</strong> Re-picking a preset from the right-click menu always
                    resets the bend to 50% — it's the "start a warp" action. Once a warp exists, use the
                    <strong>Bend</strong> slider: it re-warps live as you drag, is the only way to get the values
                    in between, and a whole drag counts as <strong>one</strong> undo step, so
                    <span class="kbd">Ctrl</span>+<span class="kbd">Z</span> returns you to the bend you started
                    the drag from rather than unwinding it a notch at a time.
                </p>
                <p class="doc-note">
                    <strong>Text and non-path shapes convert to a path</strong> when you warp them. That is what
                    lets the outline bend — but it means a warped headline is no longer editable text (you can't
                    retype it), and a warped rectangle is no longer a rectangle (its corner-radius and shape
                    properties are gone). Warp last, after the wording and styling are settled, or keep an
                    unwarped copy on a hidden layer.
                </p>
                <table class="api-table">
                    <thead><tr><th>Preset</th><th>Shape</th></tr></thead>
                    <tbody>
                        <tr><td><strong>Arc</strong></td><td>Whole object bows into a rainbow.</td></tr>
                        <tr><td><strong>Arch</strong></td><td>Top edge arcs up, base held.</td></tr>
                        <tr><td><strong>Flag</strong></td><td>Single S-wave across the width.</td></tr>
                        <tr><td><strong>Wave</strong></td><td>Double wave (two humps).</td></tr>
                        <tr><td><strong>Rise</strong></td><td>Linear slope — one side rises.</td></tr>
                        <tr><td><strong>Bulge</strong></td><td>Fattens the middle (top up, bottom down).</td></tr>
                    </tbody>
                </table>
                <pre class="code-block"><code>{`const t = Yappy.createElement('text', 200, 200, 360, 120, { containerText: 'WARP', fontSize: 96 });
Yappy.setSelected([t]);
Yappy.applyWarpPreset('arc', 0.6);   // bend -1..1 (the slider's -100%..100%)
Yappy.applyWarpPreset('arc', 0.15);  // same preset, gentler — what dragging Bend does
Yappy.applyWarpPreset('flag', -0.5); // negative bends the other way
Yappy.bakeWarp();                    // make it permanent geometry`}</code></pre>
                <p class="tip-box">
                    For a fully custom envelope, use <strong>Mesh Warp</strong> (drag the orange control
                    points) or <strong>Envelope Distort</strong> (4-corner) in the same Path menu.
                </p>
                <h3>Make with Top Object</h3>
                <p>
                    Select some <strong>artwork plus a shape on top</strong>, then right-click →
                    <strong> Envelope: Make with Top Object</strong>. The top shape becomes the envelope
                    (consumed), and the artwork is squeezed into its <em>silhouette</em> — text into a heart,
                    a logo into a circle, etc. <code>Yappy.envelopeWithTopObject()</code>. Bake with
                    <strong> Apply / Bake Warp</strong> to make it permanent.
                </p>
            </section>

            {/* Knife & Scissors */}
            <section class="doc-section">
                <h2>✂️ Knife &amp; Scissors</h2>
                <p>
                    Right-click → <strong>Knife / Scissors</strong> to enter the cut tool. It does two
                    things depending on your gesture:
                </p>
                <ul class="doc-list">
                    <li><strong>Knife</strong> — <em>drag a line</em> across one or more shapes. Every shape
                        the line crosses is sliced into separate, fully-closed pieces. With nothing selected
                        it cuts all crossed shapes; with a selection it only cuts those.</li>
                    <li><strong>Scissors</strong> — <em>click once on a path</em>, and it cuts
                        <strong> exactly where you clicked</strong>, including in the middle of a curve.
                        A closed shape opens there into a single open path; an open path splits into two.
                        Non-path shapes are converted to a path first, and cutting one ring of a compound
                        path (the counter of an <em>o</em>, the hole in a donut) leaves the other rings
                        alone.</li>
                </ul>
                <p>Press <span class="kbd">Esc</span> to exit the tool.</p>
                <p class="doc-note">
                    <strong>Rounded corners survive the cut.</strong> Cutting converts the shape to a path
                    first, and that conversion now carries the corner radius across as real arcs — so slicing
                    a rounded rectangle (a packaging panel, a UI card) leaves the uncut corners as round as
                    they were instead of squaring them off. The same applies anywhere else a shape becomes a
                    path: Warp presets, Pathfinder, Convert to Path.
                </p>
                <p class="tip-box">
                    <strong>Cutting doesn't move the shape, and the pieces are still curves.</strong> The
                    Scissors subdivides the curve at the cut point rather than approximating it, so the two
                    halves trace exactly the outline the original did — cut a circle anywhere and the pieces
                    still sit on a perfect circle. The Knife has to work on polygons internally, so its
                    pieces are re-fitted to curves on the way out: cut a circle in half and you get two
                    corner points at the ends of the straight cut and a handful of <em>smooth</em> points
                    along the arc, rather than the dozens of corner points the overlap maths produced. Real
                    corners — the shape's own, and the cut edge itself — stay sharp, so a knifed rectangle
                    keeps square corners and flat sides. Shapes with holes keep their holes.
                </p>
                <pre class="code-block"><code>{`// slice a rectangle in half with a vertical knife line
const r = Yappy.createRectangle(100, 100, 200, 120, { backgroundColor: '#3b82f6' });
Yappy.knife({ x: 200, y: 60 }, { x: 200, y: 260 }, [r]);  // → two pieces

// cut a circle open at its 45° point — not at whichever anchor happens to be nearest
const circle = Yappy.createPath(circleAnchors, { closed: true });
Yappy.splitPath(circle, { x: 370.7, y: 229.3 });   // opens exactly there`}</code></pre>
            </section>

            {/* Generative shapes */}
            <section class="doc-section">
                <h2>➕ Generative Shapes — Spiral, Arc, Grids</h2>
                <p>
                    Right-click on empty canvas → <strong>Insert</strong> to drop a spiral, arc,
                    rectangular grid, or polar grid at the cursor. Each is a real, editable
                    path/line set you can restyle or node-edit. They're also fully parameterised in the API:
                </p>
                <pre class="code-block"><code>{`// Archimedean spiral: centre, radius, turns, decay(0..1 tightens turns)
Yappy.createSpiral(300, 300, 120, 4, 0.15);

// circular arc: centre, radius, start°, end° (clockwise from +x)
Yappy.createArc(300, 300, 120, 0, 270);

// rectangular grid: x, y, w, h, rows, cols  (a grouped set of lines)
Yappy.createRectGrid(100, 100, 240, 180, 4, 6);

// polar grid: centre, radius, rings, spokes
Yappy.createPolarGrid(300, 300, 140, 4, 12);

// full-composition texture overlay: 'noise' (film grain) or 'grunge' (soft blotches)
Yappy.addTextureOverlay('noise');
Yappy.addTextureOverlay('grunge', { opacity: 20, color: '#2b1d14', scale: 1.5 });`}</code></pre>
                <p class="tip-box">
                    Grids return one <strong>group</strong> so they move as a unit — double-click to enter the
                    group and edit individual lines, or ungroup (<span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">G</span>).
                    A spiral pairs nicely with <strong>Width</strong>-style tapering via the inkbrush, and an
                    arc is the basis for <strong>Type on a Path</strong>.
                </p>
                <p class="tip-box">
                    <strong>Noise Texture</strong> / <strong>Grunge Texture</strong> (Vector Tools → Insert) cover the
                    active artboard — else the page, else your artwork’s bounding box — with a procedural grain
                    rectangle already set to <em>Multiply</em> at 14% opacity. It’s the one-click version of importing
                    a grungy photo, stretching it over the picture and dialling the opacity down, and it keeps large
                    flat colour areas from reading as dead. See <strong>Masks, Appearance &amp; Trace → Pattern
                    Fills</strong> for the per-shape controls.
                </p>
            </section>

            {/* Vertical Type */}
            <section class="doc-section">
                <h2>↕ Vertical Type</h2>
                <p>
                    Select a text object, then right-click → <strong>Vertical Type</strong> to stack its
                    characters top-to-bottom. Each line you type (each <code>\n</code>) becomes its own
                    column, and columns advance <strong>right→left</strong> — the classic vertical-signage /
                    CJK orientation. The text box <strong>resizes to fit</strong> the columns, so the selection
                    bounds and hit-area match exactly; editing the text re-flows and re-sizes it, and
                    <strong> Vertical Align</strong> (top / middle / bottom) positions the columns. Toggle it
                    off to re-flow back to a normal horizontal box.
                </p>
                <pre class="code-block"><code>{`const t = Yappy.createText(160, 120, 'SALE\\nNOW', { fontSize: 40 });
Yappy.setTextVertical(t, true);   // stack vertically
Yappy.setTextVertical(t);         // toggle back to horizontal`}</code></pre>
            </section>

            {/* Symbol Sprayer */}
            <section class="doc-section">
                <h2>🫧 Symbol Sprayer</h2>
                <p>
                    Make a <strong>Symbol</strong> first (select artwork → Symbols panel → <em>＋</em>, or
                    <code> Yappy.createSymbol()</code>). Then in the Symbols panel click the
                    <strong> spray-can</strong> button on that symbol and <strong>drag on the canvas</strong> —
                    instances scatter along your stroke, spaced by the brush radius (drag slower for denser
                    coverage) with random size variation. Press <span class="kbd">Esc</span> to stop.
                </p>
                <p>
                    Because every dab is an ordinary symbol <em>instance</em>, redefining the symbol updates
                    them all at once, and you can move, rotate, or recolour any of them with the normal tools.
                </p>
                <pre class="code-block"><code>{`// build a symbol from a shape
const dot = Yappy.createCircle(0, 0, 24, 24, { backgroundColor: '#8b5cf6' });
const sym = Yappy.createSymbol('confetti', [dot]);

// arm the sprayer (then drag on canvas), or spray programmatically:
Yappy.toggleSymbolSprayer(sym);
Yappy.spraySymbols(sym, [
  { x: 200, y: 200 }, { x: 240, y: 215 }, { x: 285, y: 235 }, { x: 330, y: 250 },
], { scaleJitter: 0.3 });`}</code></pre>
            </section>

            {/* Live Paint */}
            <section class="doc-section">
                <h2>🪣 Live Paint Bucket</h2>
                <p>
                    Draw overlapping shapes (even unfilled outlines), select them all (≥2), then right-click →
                    <strong> Live Paint Bucket</strong>. The shapes become a <strong>Live Paint group</strong>
                    and the cursor turns into a bucket — <strong>click any enclosed region</strong> to flood it
                    with the active fill colour, just like colouring a line drawing. Two overlapping circles give
                    three paintable regions (two crescents + the central lens); three give seven.
                </p>
                <p>
                    The fills are <strong>live</strong>: drag, scale, or rotate any source outline and every
                    region recolours and reshapes to follow — the colour stays pinned to “the lens”, “that
                    crescent”, and so on. The region fills sit beneath the outlines and are inert (you always
                    grab the source shapes), so you can keep tweaking the artwork and the colouring keeps up.
                </p>
                <pre class="code-block"><code>{`// outline art → live paint group → flood regions
const a = Yappy.createCircle(120, 160, 140, 140, { backgroundColor: 'transparent', strokeColor: '#111' });
const b = Yappy.createCircle(210, 160, 140, 140, { backgroundColor: 'transparent', strokeColor: '#111' });
Yappy.makeLivePaint([a, b]);
Yappy.livePaintFill({ x: 215, y: 230 }, '#22c55e');  // the overlap lens
Yappy.livePaintFill({ x: 160, y: 230 }, '#3b82f6');  // left crescent

// move a source — the fills follow automatically
Yappy.updateElement(b, { x: 230 });

// bake it back to plain shapes when you're happy
Yappy.releaseLivePaint(/* groupId */);`}</code></pre>
                <p class="tip-box">
                    Live Paint shares the same atomic-region engine as the <strong>Shape Builder</strong> — Shape
                    Builder <em>merges/deletes</em> regions into new geometry, Live Paint <em>colours</em> them
                    while keeping the originals editable. Bounded to 8 source shapes per group.
                </p>
            </section>

            {/* Width tool */}
            <section class="doc-section">
                <h2>🖊 Width Tool — variable-width strokes</h2>
                <p>
                    Select an open path, then right-click → <strong>Width Tool</strong>. Press on the path and
                    <strong> drag away from it</strong> — the drag distance becomes the stroke width at that
                    point, so the line swells and tapers like a calligraphic nib or a brush stroke. Add as many
                    width points as you like; the thickness interpolates smoothly between them. Press
                    <span class="kbd">Esc</span> to exit, and right-click → <strong>Reset Width</strong> to go
                    back to a uniform stroke.
                </p>
                <pre class="code-block"><code>{`// a calligraphic stroke: thin → thick → thin
const s = Yappy.createPath([
  { x: 80, y: 240, kind: 'smooth' },
  { x: 240, y: 120, kind: 'smooth' },
  { x: 400, y: 240, kind: 'smooth' },
], { strokeColor: '#0f172a', strokeWidth: 3 });
Yappy.setWidthPoint(s, 0.0, 2);    // t (0..1 along the path), width
Yappy.setWidthPoint(s, 0.5, 44);
Yappy.setWidthPoint(s, 1.0, 2);

Yappy.clearWidthProfile([s]);      // back to a uniform stroke`}</code></pre>
                <p class="tip-box">
                    The variable stroke renders as a filled ribbon, so it exports as true vector and prints
                    crisply. Width applies to <strong>open paths</strong> (the calligraphy use-case); closed
                    shapes keep their uniform stroke.
                </p>
            </section>

            {/* Advanced tools batch */}
            <section class="doc-section">
                <h2>✒️ Curvature &amp; Reshape</h2>
                <p>
                    <strong>Curvature</strong> (Command Palette → “Curvature”) lets you click a series of points
                    and fits a smooth curve <em>through</em> them, updating live — click the first point to close,
                    Enter/double-click to finish, Backspace to undo a point. <strong>Reshape</strong> grabs the
                    nearest point on a path and bends it (neighbours follow with a falloff) while the path's
                    endpoints stay pinned.
                </p>
                <pre class="code-block"><code>{`Yappy.createCurvature([{x:80,y:200},{x:200,y:120},{x:320,y:200}]);  // smooth path through points
Yappy.toggleReshapeTool(true);   // then drag a path to bend it`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>🖌 Blob Brush &amp; Path Eraser</h2>
                <p>
                    <strong>Blob Brush</strong> paints filled shapes — drag to lay down a stroke and it becomes a
                    filled path; overlapping strokes of the <em>same colour</em> merge into one organic blob.
                    <strong> Path Eraser</strong> is the destructive counterpart: drag to carve a swath out of
                    shapes by boolean difference (splitting or notching real geometry). <span class="kbd">[</span>
                    <span class="kbd">]</span> resize either brush.
                </p>
            </section>

            <section class="doc-section">
                <h2>📌 Puppet Warp</h2>
                <p>
                    Select a shape and turn on <strong>Puppet Warp</strong>: click it to drop pins, then drag a pin
                    to bend the mesh around it while the other pins anchor their regions. Alt-click a pin to remove
                    it. It drives the same smooth mesh-warp the Envelope tool uses, so the deformation is fluid.
                </p>
                <pre class="code-block"><code>{`const r = Yappy.createRectangle(120,120,200,140,{ backgroundColor:'#c4b5fd' });
Yappy.togglePuppetWarp(true);
Yappy.addPuppetPin(r,120,120); Yappy.addPuppetPin(r,320,120);     // anchors
const c = Yappy.addPuppetPin(r,220,190); Yappy.movePuppetPin(r,c,300,110); // pull`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>📐 Perspective Grid</h2>
                <p>
                    Turn on the <strong>Perspective Grid</strong> (Vector Tools palette, or the command palette)
                    for a perspective drawing aid — a horizon with its vanishing points and converging guides.
                    Drag a vanishing point or the horizon to set up the scene; the grid is anchored to the
                    drawing, so it pans and zooms with your artwork. With a shape selected, the
                    <strong>Left / Floor / Right</strong> buttons project it onto that plane (foreshortened
                    toward the vanishing points). <span class="kbd">Esc</span> or <strong>Done ✕</strong> exits.
                </p>
                <h3>Settings (the ⚙ button)</h3>
                <ul class="doc-list">
                    <li><strong>Mode</strong> — <strong>1-pt</strong> (one vanishing point, plus free horizontals
                        and verticals), <strong>2-pt</strong> (left + right vanishing points, verticals stay
                        vertical) or <strong>3-pt</strong> (a third vanishing point below the horizon, so
                        verticals converge too). The <strong>3rd VP</strong> slider sets how far below the horizon
                        that point sits — drag its handle directly when it is on screen.</li>
                    <li><strong>Density</strong> — how many guides are drawn per fan (4–40). Display only;
                        snapping does not care how many lines you can see.</li>
                    <li><strong>Snap to perspective lines</strong> — on by default, with a
                        <strong>Tolerance</strong> (how far off a ray you can be and still be captured) and a
                        <strong>Strength</strong>.</li>
                    <li><strong>Reset grid</strong> — puts the vanishing points back on the current view.</li>
                </ul>
                <p>
                    Everything here is remembered between sessions, so you set the scene up once.
                </p>
                <h3>Soft snap</h3>
                <p>
                    While the grid is on, the <strong>line</strong>, <strong>arrow</strong>, <strong>curve</strong>
                    and <strong>pen</strong> tools are pulled toward the nearest perspective ray — including the
                    pen's Bézier <em>handles</em>, which is what lets a curve leave an anchor in perspective.
                    The pull is deliberately <em>soft</em>: at <strong>100%</strong> strength a segment locks onto
                    the ray, and below that it is only biased toward it, so freehand-feeling curves stay
                    drawable. Rectangles and other box shapes are left alone (a box has no single direction to
                    aim), and freehand pen/brush strokes are never snapped.
                </p>
                <p class="doc-note">
                    <strong>Precedence.</strong> A connector snapping to a shape wins over the grid;
                    <span class="kbd">Shift</span> gives you the plain 15° constraint instead; the grid beats
                    grid-snap (which would otherwise drag the endpoint straight back off the ray); and
                    <span class="kbd">Alt</span> ignores the grid entirely for that stroke.
                </p>
                <pre class="code-block"><code>{`Yappy.togglePerspectiveGrid(true);
Yappy.setPerspectiveGrid({ mode: 3, density: 20, snapAngle: 10, snapStrength: 1 });
Yappy.getPerspectiveGrid();     // current config
Yappy.projectToPlane('right');  // foreshorten the selection onto the right wall
Yappy.resetPerspectiveGrid();`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>✦ Lens Flare, Touch Type &amp; Slice</h2>
                <ul class="doc-list">
                    <li><strong>Lens Flare</strong> (right-click canvas → Insert → Lens Flare): a glow + rays + halo
                        rings + ghost reflections, grouped.</li>
                    <li><strong>Touch Type</strong> — per-letter styling on a single-line text element <em>or</em> a
                        <strong>shape's label</strong> (right-click → Touch Type, or the command palette). <strong>Select
                        several letters at once</strong>: <span class="kbd">Shift</span>-click to extend a range, or
                        <strong>drag a box</strong> across glyphs (<span class="kbd">Ctrl/Cmd</span>+<span class="kbd">A</span>
                        selects all). Then drag to move, <span class="kbd">[</span><span class="kbd">]</span> scale,
                        <span class="kbd">,</span> <span class="kbd">.</span> rotate, or use the floating
                        <strong>A−/A+/↺/↻</strong> buttons, <strong>colour swatch</strong> and <strong>font dropdown</strong>
                        — all applied to every selected glyph. <span class="kbd">Ctrl/⌘</span>-click adds any individual
                        letter (discontiguous). On tablets, <strong>pinch&nbsp;to&nbsp;scale</strong> and
                        <strong>two-finger&nbsp;twist</strong> work too. <strong>Exit</strong> by clicking outside the
                        element, pressing <span class="kbd">Esc</span>, or <strong>Done&nbsp;✕</strong>.</li>
                    <li><strong>Custom &amp; Google fonts</strong>: the <strong>Font</strong> dropdown (property panel
                        and the Touch Type controls) is searchable — type to filter, <span class="kbd">↑</span>/<span class="kbd">↓</span> +
                        <span class="kbd">Enter</span> to apply, each row previewed in its own face — and it stays on
                        screen no matter how many fonts you've added. From it choose <strong>＋ Add font…</strong> to
                        upload a <code>.ttf/.otf/.woff/.woff2</code>,
                        or <strong>🔍 Google Fonts…</strong> to search a curated list of popular Google Fonts. The
                        picker docks to the right with the canvas still visible: each click — or
                        <span class="kbd">↑</span>/<span class="kbd">↓</span> + <span class="kbd">Enter</span> from
                        the search box — applies the font to your selection live (marked <em>✓ applied</em>), so you
                        can try fonts back-to-back and close with <strong>Done</strong>, <span class="kbd">Esc</span>,
                        or ✕ when happy. Added fonts load immediately, persist across reloads, and work like any
                        built-in font.</li>
                    <li><strong>Font Family and Font Style are two dropdowns</strong>, as in Illustrator. Font files
                        are named <code>Family-Weight</code> (<code>Montserrat-Light</code>,
                        <code>Montserrat-SemiBoldItalic</code>), so adding a whole family used to fill the list with
                        entries that looked like unrelated typefaces. They are now grouped: <strong>Font</strong>
                        lists each family once, and <strong>Style</strong> beneath it lists that family's weights and
                        italics (<em>Light, Regular, SemiBold, Bold Italic…</em>). Switching family keeps the style
                        you were in wherever the new family has it — Montserrat SemiBold → a family whose heaviest is
                        Bold lands on Bold rather than resetting to Regular. The <strong>Style</strong> row only
                        appears when the family actually has more than one style. The <strong>Bold</strong> and
                        <strong>Italic</strong> buttons still work and are a two-state view of the same thing: Bold
                        lights up for anything SemiBold or heavier.</li>
                    <li><strong>Weight is the full 100–900 axis</strong> (<code>fontWeight: 300</code> for Light,
                        <code>600</code> for SemiBold, …), not just on/off bold, so Light and Black are reachable from
                        the API as well as the Style dropdown. The old <code>fontWeight: true</code> and
                        <code>'bold'</code> still work and mean 700 — documents made before this keep rendering
                        exactly as they did.</li>
                    <li><strong>Letter spacing</strong>: the <strong>Letter Spacing</strong> property (Text group)
                        tightens or loosens tracking on text elements, <strong>shape labels</strong> and
                        <strong>connector labels</strong> alike, applied through measurement, wrapping, in-place
                        editing and drawing (<code>Yappy.createElement(type, x, y, w, h, {'{'} letterSpacing: 2 {'}'})</code>).</li>
                    <li><strong>Line spacing (leading)</strong>: the <strong>Line Spacing</strong> property (Text
                        group) sets how far apart the lines sit, as a <em>multiple of the font size</em> like CSS
                        <code>line-height</code> — <strong>1.2</strong> unless you change it, <code>1</code> for
                        solid setting, <code>2</code> for double-spaced. A multiple rather than a pixel value, so
                        resizing the text keeps the spacing proportional and it still means something when
                        rich-text runs on the same line have different sizes. Applies to text elements, shape
                        labels and rich text, and follows through wrapping, auto-height, in-place editing and
                        SVG/PNG/PDF export (<code>Yappy.createElement(type, x, y, w, h, {'{'} lineHeight: 1.6 {'}'})</code>).</li>
                    <li><strong>Slice</strong> (Command Palette → Slice): drag a rectangle to export exactly that
                        region as a PNG (<code>Yappy.exportRegion(x,y,w,h)</code>). Artboards remain for persistent
                        named export regions.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>📊 Graph data · 🫧 Symbolism brush · 🪣 Live Paint Selection</h2>
                <ul class="doc-list">
                    <li><strong>Graph tool</strong>: bar &amp; pie charts are data-driven — right-click a chart →
                        “Edit Chart Data…”, or <code>Yappy.setChartData(id, [10,80,45,95])</code>.</li>
                    <li><strong>Symbolism brush</strong> (the symbol sub-tools): brush over sprayed symbol instances
                        to <em>Sizer</em> (scale), <em>Spinner</em> (rotate), <em>Shifter</em> (nudge),
                        <em> Screener</em> (fade), <em>Stainer</em> (tint) or <em>Styler</em> — pick a mode in the
                        hint bar, <span class="kbd">[</span><span class="kbd">]</span> resize, Alt reverses.</li>
                    <li><strong>Live Paint Selection</strong>: in the Live Paint tool the face under the cursor
                        highlights; click to fill it, or <strong>Alt-click to clear</strong> that face's colour.</li>
                </ul>
            </section>

            {/* Parity reference */}
            <section class="doc-section">
                <h2>✒️ Pen / Vector Path — anchors, curves &amp; the Clock Method</h2>
                <p>
                    Grab the <strong>Pen</strong> (<span class="kbd">P</span>): <em>click</em> drops a corner
                    anchor, <em>click-drag</em> drops a smooth anchor and pulls out its Bézier handles, and
                    clicking the first anchor closes the path. <span class="kbd">Enter</span>/<span class="kbd">Esc</span>
                    (or double-click) finishes; <span class="kbd">Backspace</span> removes the last anchor.
                </p>
                <p>
                    <strong>Straight segments (15° constrain).</strong> Hold <span class="kbd">Shift</span>
                    <em>between</em> clicks and the next point snaps to the nearest <strong>15°</strong> from the
                    previous anchor, so perfectly horizontal, vertical and 45° segments are one click rather than a
                    steady hand. It's the same increment the Line and Arrow tools use, and it takes precedence over
                    Snap to Grid for that click (the grid would pull the point back off the angle). The rubber-band
                    preview shows the constrained position, so what you see is where the anchor lands — and
                    clicking the first anchor still closes the path with <span class="kbd">Shift</span> held.
                </p>
                <p>
                    <strong>Clock Method (90°/45° constrain).</strong> Hold <span class="kbd">Shift</span> while
                    dragging a handle to snap it to the nearest 45° — straight to 12/3/6/9 o'clock for clean,
                    editable curves. Don't have a keyboard? Toggle the <strong>90°/45°</strong> button in the
                    floating Pen bar, or rest a <strong>second finger</strong> on the canvas while you drag with
                    the stylus (the Procreate-style constrain modifier). Both constrain modes share that toggle,
                    so tablet users get straight segments as well as clean handles.
                </p>
                <p class="doc-note">
                    <strong>Shift means two things.</strong> Which one you get depends on whether the button is
                    down: <em>between</em> clicks it aims the segment (15°), <em>during</em> a drag it aims the
                    handles (45°). They never apply at once, so there is nothing to switch between.
                </p>
                <p>
                    <strong>Breaking a handle (cusps).</strong> A smooth anchor keeps its two handles in
                    line with each other — move one and the other swings to stay opposite. Hold
                    <span class="kbd">Alt</span> while dragging a handle to <strong>break that pairing</strong>:
                    the handle you are dragging moves on its own and the other stays put, so one side of the
                    anchor can curve while the other runs straight into it. That's how you get a teardrop, a
                    petal tip, or the sharp join in a script letterform.
                </p>
                <p>
                    It works in both places you touch a handle — while <em>drawing</em> with the Pen (hold
                    <span class="kbd">Alt</span> partway through the drag that pulls the handles out), and when
                    <em>editing</em> an existing anchor with the Selection or Node tool. The break is permanent,
                    not just for that drag: the anchor becomes a <em>corner</em>, so letting go of
                    <span class="kbd">Alt</span> won't snap the two sides back into line. To pair them up again,
                    <span class="kbd">Alt</span>-click the anchor to convert it back to smooth.
                </p>
                <p>
                    <strong>Editing anchors</strong> (Selection tool, with the path selected):
                </p>
                <table class="api-table">
                    <thead><tr><th>Action</th><th>Desktop</th><th>Tablet / touch</th></tr></thead>
                    <tbody>
                        <tr><td>Smooth ↔ Corner</td><td><span class="kbd">Alt</span>-click the anchor</td><td><strong>Tap</strong> the anchor, or long-press → <em>Make Smooth/Corner</em></td></tr>
                        <tr><td>Break the handle pair (cusp)</td><td><span class="kbd">Alt</span>-drag the <em>handle</em></td><td>Long-press the anchor → <em>Make Corner</em>, then drag each handle</td></tr>
                        <tr><td>Delete anchor</td><td><span class="kbd">Ctrl/⌘</span>-click the anchor</td><td>Long-press the anchor → <em>Delete Anchor</em></td></tr>
                        <tr><td>Insert anchor</td><td><span class="kbd">Alt</span>-click the path outline</td><td>Long-press the outline → <em>Insert Point Here</em></td></tr>
                        <tr><td>Constrain handles 90°/45°</td><td>Hold <span class="kbd">Shift</span> while dragging</td><td><strong>90°/45°</strong> toggle, or second-finger contact</td></tr>
                        <tr><td>Constrain segment to 15° (Pen, while drawing)</td><td>Hold <span class="kbd">Shift</span> between clicks</td><td><strong>90°/45°</strong> toggle, or second-finger contact</td></tr>
                    </tbody>
                </table>
                <p class="doc-note">
                    <strong>Alt on an anchor vs. Alt on a handle.</strong> They do different things, and which
                    one you get depends on what is under the cursor: on the <em>anchor dot</em>,
                    <span class="kbd">Alt</span>-click converts smooth ↔ corner; on the <em>handle</em> at the
                    end of a control arm, <span class="kbd">Alt</span>-drag breaks the pair.
                </p>

                <h3>◜ Live Corners — round the corners of any path</h3>
                <p>
                    Rectangles have their own <strong>Roundness</strong> and four independent
                    <strong> Corner</strong> sliders. Everything else with corners — pen paths, polygons,
                    stars, triangles, traced artwork, anything you converted to a path — rounds through
                    <strong> Vector Tools → Corners</strong>. Drag the <strong>Radius</strong> slider and the
                    corners fillet live.
                </p>
                <ul class="doc-list">
                    <li><strong>It is non-destructive.</strong> The radius is stored on the anchor and the
                        rounded outline is rebuilt every time the path is drawn — so the anchor you edit is
                        still the original sharp corner. Move it, and the rounding follows. Set the radius
                        back to 0 (or hit <strong>Reset corners</strong>) and the corner returns exactly.</li>
                    <li><strong>Some corners or all of them.</strong> With nothing but the object selected,
                        every corner rounds. Select individual anchors with the <strong>Nodes</strong> tool
                        first and only those round — the panel header tells you which scope you are in.</li>
                    <li><strong>Radius is in pixels</strong>, not a percentage. A rectangle's roundness is a
                        percent of its shorter side so it survives resizing; an open path has no
                        &ldquo;shorter side&rdquo;, so paths use real units.</li>
                    <li><strong>It clamps itself.</strong> A corner can never eat more than half of either
                        neighbouring segment, so two rounded corners on a short edge shrink together instead
                        of crossing over. Drag past the limit and it simply maxes out.</li>
                    <li><strong>Corners between curves</strong> round too. The trim distance comes from the
                        angle, so an obtuse elbow and a sharp spike with the same radius look like the same
                        amount of rounding.</li>
                    <li>Applying it to a non-path shape <strong>converts it to a path first</strong> (the same
                        thing Illustrator does to a live shape). Rectangles and diamonds are left alone —
                        they'd lose their own corner controls.</li>
                </ul>
                <div class="code-block">
                    <pre>{`// Live Corners from the API
Yappy.setPathCornerRadius(12);              // all corners of the selection
Yappy.setPathCornerRadius(12, [pathId]);    // a specific path
Yappy.setPathCornerRadius(0);               // un-round

// only certain anchors: {id, sub, i} — sub = subpath index, i = anchor index
Yappy.setPathCornerRadius(20, [pathId], [{ id: pathId, sub: 0, i: 1 }]);

// read it back: value is null when the scoped corners disagree
const { value, max, count } = Yappy.getPathCornerRadius();`}</pre>
                </div>
            </section>

            <section class="doc-section">
                <h2>📐 On-canvas measurement</h2>
                <p>
                    <strong>Transform HUD.</strong> Select anything and a small badge rides just below it
                    showing its live <strong>W × H</strong> and position <strong>X, Y</strong> — plus the
                    <strong> rotation ∠</strong> when a single object is turned. It updates as you drag,
                    resize, or rotate, so you always know the exact size and placement without opening a
                    panel. A multi-selection reports its combined bounding box. (The badge is passive — it
                    never blocks the canvas — and hides in Presentation mode.)
                </p>
                <p>
                    <strong>Measure tool</strong> (View menu → <em>Measure</em>): drag a line across the
                    canvas to read its <strong>distance</strong> and <strong>angle</strong>. For a diagonal drag
                    it also draws the <strong>right triangle</strong> with its <strong>Δx</strong> and
                    <strong> Δy</strong> legs labelled, so you can read the horizontal and vertical spans at a
                    glance. If you <em>select a single shape first</em>, the tool shows a card with that shape's
                    <strong> W/H, area, and perimeter</strong> (circles/ellipses use true πab area and
                    circumference; lines report their length). Pair it with
                    <strong> Rulers &amp; Guides</strong> (<span class="kbd">Alt</span>+<span class="kbd">R</span>),
                    <strong>Snap to Grid</strong> (<span class="kbd">Shift</span>+<span class="kbd">;</span>),
                    and the alignment/equal-spacing guides that appear while you drag for precise layout.
                    Scripting: <code>Yappy.measureShape(id)</code> returns
                    <code>{'{ width, height, area, perimeter }'}</code>. <span class="kbd">Esc</span> exits.
                </p>
                <p>
                    <strong>Snap to point.</strong> With object snapping on, dragging an element makes its
                    corners, edge midpoints, centre — and the anchor points of vector paths — <strong>snap
                    onto another element's matching points</strong> when they line up on both axes. A small
                    magenta diamond marks where it locked, so you can butt shapes corner-to-corner (or onto a
                    path anchor) exactly, not just align a single edge. It also snaps to
                    <strong> path intersections</strong> — the points where two other objects' outlines
                    cross — so you can drop a corner right where two lines or edges meet. Hold
                    <span class="kbd">Shift</span> while dragging to suspend snapping.
                </p>
                <p>
                    <strong>Fixed-angle constraint</strong> (<span class="kbd">Shift</span>). Hold
                    <span class="kbd">Shift</span> to lock to clean <strong>15° increments</strong> while you
                    <strong> draw a line/arrow</strong>, <strong>rotate</strong> an element, or drag the
                    <strong> Measure</strong> line — perfect horizontals, verticals, and 45° diagonals without
                    guessing. The drag keeps its length; only the angle snaps. The rotation angle shows live in
                    the transform badge, and the Measure line reports the locked angle.
                </p>
                <p>
                    <strong>Measure to a neighbour</strong> (<span class="kbd">Alt</span>-hover). With one or
                    more objects selected, hold <span class="kbd">Alt</span> and hover another object: red
                    dimension lines show the exact <strong>pixel gaps</strong> between your selection and that
                    object, plus the distance from the selection to each edge of its <strong>artboard</strong>
                    (or page). It's a read-only inspection — nothing moves — and the lines vanish the moment you
                    release <span class="kbd">Alt</span> or move off. This is the Illustrator/Figma
                    "measure-the-gap" gesture. Scripting:
                    <code>Yappy.measureBetween(idA, idB, includeArtboardEdges?)</code> returns the same gap
                    segments (distance, orientation, kind). <em>(v1: axis-aligned bounding boxes.)</em>
                </p>
                <p>
                    <strong>Dimension annotations.</strong> Right-click a shape →
                    <strong> Dimensions ▸ Add Width</strong> or <strong>Add Height</strong> to attach a
                    persistent, CAD-style dimension line (extension lines, arrowheads, and a px label). Unlike
                    the Measure tool (a transient readout), a dimension <em>stays on the drawing</em> and
                    <strong> auto-updates</strong> as you move, resize, or animate the shape — width dimensions
                    sit below, height dimensions to the right. Remove them via
                    <strong> Dimensions ▸ Remove Dimensions</strong>. Dimensions are now
                    <strong> rotation-aware</strong> (they follow a rotated element's edges), and beyond
                    width/height you can add <strong>Radius</strong> / <strong>Diameter</strong> (on
                    circles/ellipses) and an <strong>Angle</strong> dimension that draws the element's
                    rotation as an arc. Scripting:
                    <code>Yappy.addDimension(id, 'width'|'height'|'radius'|'diameter'|'angle')</code>. They're
                    saved with the document. Turn on <strong>Settings → Include Dimensions in Exports</strong>
                    (opt-in) to bake them into exported <strong>PNG / JPG / SVG / PDF</strong> — SVG keeps them
                    as real vector lines and text. Scripting: <code>Yappy.setExportIncludeDimensions(true)</code>.
                </p>
                <p>
                    <strong>Measurement units.</strong> Settings → <em>Measurement Units</em> switches every
                    readout — the transform badge, the Measure tool, gap measuring, and dimension annotations —
                    between <strong>px</strong>, <strong>mm</strong>, and <strong>in</strong> (96 px = 1 in).
                    Scripting: <code>Yappy.setMeasurementUnit('px'|'mm'|'in')</code>.
                </p>
            </section>

            <section class="doc-section">
                <h2>Where these map in Illustrator</h2>
                <table class="api-table">
                    <thead>
                        <tr><th>Illustrator tool</th><th>In Yappy</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Pen / Vector Path (P)</td><td>Toolbar pen-nib (P) — click anchors, drag for Bézier handles; anchors &amp; handles show live, click first anchor to close</td></tr>
                        <tr><td>Shape Builder (Shift+M)</td><td>Right-click → Shape Builder (face-level)</td></tr>
                        <tr><td>Magic Wand (Y)</td><td>Right-click → Select Similar</td></tr>
                        <tr><td>Live Paint Bucket (K)</td><td>Right-click → Live Paint Bucket (click regions)</td></tr>
                        <tr><td>Effect → Distort &amp; Transform / Liquify</td><td>Right-click → Distort &amp; Transform</td></tr>
                        <tr><td>Knife</td><td>Cut tool — drag a line</td></tr>
                        <tr><td>Scissors (C)</td><td>Cut tool — click a path</td></tr>
                        <tr><td>Spiral / Arc / Rectangular &amp; Polar Grid</td><td>Right-click empty canvas → Insert</td></tr>
                        <tr><td>Vertical Type</td><td>Right-click text → Vertical Type</td></tr>
                        <tr><td>Symbol Sprayer (Shift+S)</td><td>Symbols panel → spray-can</td></tr>
                        <tr><td>Width Tool (Shift+W)</td><td>Right-click path → Width Tool</td></tr>
                        <tr><td>Curvature (Shift+~)</td><td>Command Palette → Curvature</td></tr>
                        <tr><td>Reshape</td><td>Command Palette → Reshape</td></tr>
                        <tr><td>Blob Brush (Shift+B)</td><td>Command Palette → Blob Brush</td></tr>
                        <tr><td>Eraser / Path Eraser</td><td>Command Palette → Path Eraser (destructive)</td></tr>
                        <tr><td>Puppet Warp</td><td>Command Palette → Puppet Warp</td></tr>
                        <tr><td>Perspective Grid</td><td>Vector Tools → Warp → Perspective Grid, or Command Palette</td></tr>
                        <tr><td>Flare</td><td>Insert → Lens Flare</td></tr>
                        <tr><td>Grain / texture overlay</td><td>Vector Tools → Insert → Noise Texture / Grunge Texture</td></tr>
                        <tr><td>Touch Type (Shift+T)</td><td>Right-click text → Touch Type</td></tr>
                        <tr><td>Slice (Shift+K)</td><td>Command Palette → Slice</td></tr>
                        <tr><td>Graph tools (J)</td><td>Chart shapes → Edit Chart Data…</td></tr>
                        <tr><td>Symbolism sub-tools (Shift+S)</td><td>Command Palette → Symbolism Brush</td></tr>
                        <tr><td>Live Paint Selection (Shift+L)</td><td>Live Paint → hover/Alt-click faces</td></tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default IllustratorToolsDoc;
