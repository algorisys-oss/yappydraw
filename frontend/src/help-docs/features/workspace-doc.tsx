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

            {/* ─── TOOLBAR POSITION ───────────────────────────────────── */}
            <section class="doc-section">
                <h2>Where the toolbar lives</h2>
                <p>
                    The tool column is docked to the <strong>left edge</strong> by default, and the canvas starts after
                    it rather than underneath. The button at the top of the column moves it: each click steps to the
                    next position — <strong>left → top → right → bottom → floating</strong> — and its icon shows where
                    the bar currently sits. A docked bar reserves its edge; <strong>floating</strong> puts it back to a
                    draggable overlay you can park anywhere (drag the grip, or drag its resize grip to wrap the icons
                    into a compact grid).
                </p>
                <p class="tip-box">
                    The position sticks between sessions. Scripted: <code>Yappy.getState().globalSettings.toolbarDock</code>
                    reports it.
                </p>
            </section>

            {/* ─── GUIDED TOUR ────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Guided tour</h2>
                <p>
                    On your <strong>first visit</strong> a short <strong>spotlight tour</strong> highlights the main
                    areas — toolbar, canvas, Properties panel, and the settings/help cluster. Step through with
                    <strong> Next</strong>/<strong>Back</strong> (or <strong>→</strong>/<strong>←</strong>), or
                    <strong> Skip</strong> (<strong>Esc</strong>) anytime. It only auto-runs once.
                </p>
                <p class="tip-box">
                    Replay it whenever you like from <strong>Help (?) → “Take the tour”</strong>, or from a script with
                    <code>window.Yappy.startTour()</code>.
                </p>
            </section>

            {/* ─── WHAT'S NEW ─────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>What's new</h2>
                <p>
                    Click the <strong>version number</strong> in the bottom-right status bar to open the
                    <strong> What's new</strong> popup — a running list of recent updates in plain language. A small dot
                    appears on the version when there are changes since you last looked. The popup also has a
                    <strong> Reload latest</strong> button that clears the cache and reloads the newest build (handy on
                    iPad/iOS). Open it from a script with <code>window.Yappy.showWhatsNew()</code>.
                </p>
            </section>

            {/* ─── PROPERTIES PANEL ───────────────────────────────────── */}
            <section class="doc-section">
                <h2>Properties panel</h2>
                <p>
                    Press <strong>Alt+Enter</strong> (or the sliders button in the top bar) to toggle the
                    <strong> Properties</strong> panel, which docks to the right edge. It shows the controls for whatever
                    is selected — fill, stroke, size, text, effects, animation — or the defaults for the active drawing
                    tool when nothing is selected.
                </p>
                <p class="tip-box">
                    With <strong>nothing selected</strong> and the Select tool active, Alt+Enter opens
                    <strong> Canvas properties</strong> (background, grid, texture, page size) — the same thing you get
                    from <em>right-click → Canvas Settings</em>. Clicking an empty spot on the canvas dismisses it.
                </p>
                <p>
                    The panel <strong>never opens by itself</strong>. Picking a drawing tool leaves it exactly as you
                    left it, so a long brainstorming session isn't interrupted by a panel sliding in on every tool
                    switch. Open it deliberately with Alt+Enter, the sliders button, or by
                    <strong> right-clicking a tool group</strong> in the toolbar (which opens the panel on that tool's
                    defaults) — and once it's open it stays docked while you work.
                </p>
                <p>
                    Properties is a <strong>dockable panel</strong> like Layers, History or Swatches, so it is not
                    stuck on the right. Drag its title bar to the left or right edge to dock it there, drop it
                    anywhere else to float it, drag the zone's inner edge to resize, and use the title-bar buttons to
                    dock left / dock right / float / collapse to the title bar / close. Your arrangement is saved and
                    comes back next time. <em>Duplicate</em> and <em>Delete</em> sit just below the title bar, with the
                    object's properties, because they act on the selection rather than on the panel.
                </p>
            </section>

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

            {/* ─── TRANSFORM PANEL ────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Transform — numeric position, size &amp; rotation</h2>
                <p>
                    Select a single object → the <strong>Transform</strong> group in the Properties panel shows
                    editable <strong>X</strong>/<strong>Y</strong> (position), <strong>W</strong>/<strong>H</strong>
                    (size), and <strong>∠</strong> (rotation, in degrees). Type a value and press <strong>Enter</strong>
                    (or click away) to apply — each edit is a single undo step, and the fields track the object live as
                    you drag or rotate it on canvas. Resizing rescales the object's geometry (pen points, path anchors,
                    text size) exactly like a handle drag.
                </p>
                <pre><code>{`Yappy.setElementTransform(id, { x: 120, y: 80 });      // move
Yappy.setElementTransform(id, { width: 240, height: 160 }); // resize
Yappy.setElementTransform(id, { angle: Math.PI / 4 });      // rotate 45° (radians)`}</code></pre>
            </section>

            {/* ─── CUSTOM STROKE DASHES ───────────────────────────────── */}
            <section class="doc-section">
                <h2>Custom stroke dashes</h2>
                <p>
                    Beyond the <strong>Stroke Style</strong> preset (solid / dashed / dotted), the
                    <strong> Stroke Dash</strong> group lets you type <em>any</em> dash pattern — a comma- or
                    space-separated list of on/off pixel lengths. <code>12, 4</code> is a simple dash;
                    <code> 12, 5, 2, 5</code> is a dash-dot. A live preview shows exactly what renders, and quick
                    chips (Dash / Dot / Dash-dot / Long) fill common patterns. <strong>Clear</strong> reverts to the
                    Stroke Style preset. Custom dashes render in both draw styles and export to SVG as
                    <code> stroke-dasharray</code>.
                </p>
                <pre><code>{`Yappy.setStrokeDash([12, 4, 3, 4]);   // dash-dot on the selection
Yappy.setStrokeDash([], ids);         // clear (revert to the Stroke Style preset)`}</code></pre>
                <p class="tip-box">
                    Appearance-stack strokes (Appearance panel) have their own compact <em>dash</em> field, so each
                    stacked stroke can carry a different custom pattern.
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

            {/* ─── SAVING ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Saving to My Drawings</h2>
                <p>
                    <span class="kbd">Ctrl</span>+<span class="kbd">S</span> saves the current drawing to
                    <strong> My Drawings</strong>, the local library in your browser. The first time you save an
                    untitled drawing you're asked for a <strong>name</strong>; after that the same shortcut saves
                    silently over that name, so you can hit it as often as you like while you work.
                </p>
                <p>
                    Each drawing keeps its own entry. <strong>File → New</strong> starts a fresh document, so the
                    next save creates a new entry rather than replacing the one you just made — but re-saving a
                    drawing you have open updates it in place instead of piling up copies. Open, rename and delete
                    entries from <strong>File → My Drawings…</strong>.
                </p>
                <p class="tip-box">
                    My Drawings lives in this browser's storage — convenient, but not a backup. For anything you
                    care about keeping, also use <strong>Export / Save…</strong>
                    (<span class="kbd">Ctrl</span>+<span class="kbd">Alt</span>+<span class="kbd">S</span>) to write a
                    <code> .yappy</code> file, or save to the cloud.
                </p>
            </section>

            {/* ─── SETTINGS ───────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Settings — Pen &amp; Input</h2>
                <p>
                    Open <strong>Settings</strong> from the gear button in the top bar (next to the Properties
                    toggle and Help) or from the menu.
                    It is organised into categories — <strong>General</strong>, <strong>Pen &amp; Input</strong>,
                    <strong>Defaults</strong> (text and shape), <strong>Mindmap</strong>,
                    <strong>Time-lapse</strong> and <strong>Cloud Storage</strong> — pick one on the left to see just
                    its settings. If you know what you want but not where it lives, type in the
                    <strong> search box</strong> at the top: it looks across every category at once and shows only the
                    matching controls.
                </p>
                <p class="tip-box">
                    The <strong>Help</strong> dialog (<strong>?</strong>) searches too — its box filters the keyboard
                    shortcuts by name <em>or</em> by keys, so &ldquo;duplicate&rdquo; and &ldquo;ctrl+d&rdquo; both
                    find the same row.
                </p>
                <p>
                    Two options control how the canvas greets you:
                </p>
                <ul>
                    <li>
                        <strong>Default Tool</strong> — which tool is active when Yappy opens:
                        <strong> Ink Brush</strong> (the default), <strong>Fineliner</strong> or <strong>Select</strong>.
                        Changing it switches you to that tool right away, so the toolbar matches, and it sticks for
                        next time.
                    </li>
                    <li>
                        <strong>Canvas Pointer</strong> — the cursor shown over the canvas while a drawing tool is
                        active: <strong>Crosshair (+)</strong> (the default, easiest to aim),
                        <strong> Concentric circle</strong>, or <strong>Arrow</strong>. Select and Pan keep their own
                        cursors, and hovering a resize or rotate handle always shows that handle's cursor.
                    </li>
                </ul>
                <p>
                    Both are per-browser preferences, remembered across sessions, and scriptable:
                    <code> Yappy.setDefaultTool('fineliner')</code> and
                    <code> Yappy.setPointerStyle('circle')</code>.
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
                <h3>Excalidraw import &amp; export</h3>
                <p>
                    Yappy round-trips with <strong>Excalidraw</strong>. <strong>Export to Excalidraw</strong> (in the
                    Save/Export panel) writes a <code>.excalidraw</code> file you can open in Excalidraw — rectangles,
                    ellipses, diamonds, lines, arrows, text, images and pen strokes map across directly; Yappy-only
                    shapes (UML, BPMN, icons, …) are exported as their outline so they still look right. To
                    <strong> import</strong>, just open a <code>.excalidraw</code> file from the menu — its elements are
                    added to your current drawing. From a script: <code>window.Yappy.exportExcalidraw()</code> and
                    <code> window.Yappy.importExcalidraw(json)</code>.
                </p>
                <p>
                    The native Yappy document format is an open, documented JSON (see
                    <code> docs/yappy-format-spec.md</code>) so other tools can read and write Yappy files too.
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
                        <tr><td><code>setElementTransform(id, &#123;x,y,width,height,angle&#125;)</code></td><td>Numeric position / size / rotation (angle in radians).</td></tr>
                        <tr><td><code>setStrokeDash(pattern?, ids?)</code></td><td>Custom dash pattern (on/off px array); empty/omitted clears it.</td></tr>
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
