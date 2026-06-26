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
            </header>

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
                    <li><strong>Scissors</strong> — <em>click once on a path</em>. The path is split at the
                        nearest anchor: a closed shape opens there into a single open path; an open path
                        splits into two. Non-path shapes are converted to a path first.</li>
                </ul>
                <p>Press <span class="kbd">Esc</span> to exit the tool.</p>
                <pre class="code-block"><code>{`// slice a rectangle in half with a vertical knife line
const r = Yappy.createRectangle(100, 100, 200, 120, { backgroundColor: '#3b82f6' });
Yappy.knife({ x: 200, y: 60 }, { x: 200, y: 260 }, [r]);  // → two pieces

// open a closed path at a point (Scissors)
const box = Yappy.createRectangle(100, 100, 120, 120, {});
Yappy.splitPath(box, { x: 100, y: 100 });   // opens at the nearest corner`}</code></pre>
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
Yappy.createPolarGrid(300, 300, 140, 4, 12);`}</code></pre>
                <p class="tip-box">
                    Grids return one <strong>group</strong> so they move as a unit — double-click to enter the
                    group and edit individual lines, or ungroup (<span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">G</span>).
                    A spiral pairs nicely with <strong>Width</strong>-style tapering via the inkbrush, and an
                    arc is the basis for <strong>Type on a Path</strong>.
                </p>
            </section>

            {/* Vertical Type */}
            <section class="doc-section">
                <h2>↕ Vertical Type</h2>
                <p>
                    Select a text object, then right-click → <strong>Vertical Type</strong> to stack its
                    characters top-to-bottom. Each line you type (each <code>\n</code>) becomes its own
                    column, laid out left-to-right — the classic vertical-signage / CJK orientation. Toggle
                    it off the same way.
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

            {/* Parity reference */}
            <section class="doc-section">
                <h2>Where these map in Illustrator</h2>
                <table class="api-table">
                    <thead>
                        <tr><th>Illustrator tool</th><th>In Yappy</th></tr>
                    </thead>
                    <tbody>
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
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default IllustratorToolsDoc;
