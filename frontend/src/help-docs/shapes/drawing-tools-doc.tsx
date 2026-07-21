/**
 * Drawing Tools Documentation
 * Fineliner, Marker, Ink Brush, Pencil
 */

import type { Component } from 'solid-js';

export const DrawingToolsDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Drawing Tools</h1>
                <p class="doc-intro">
                    Freehand drawing tools for sketching, annotating, and adding personal touches
                    to your diagrams. Each tool has unique characteristics for different drawing styles.
                </p>
            </header>

            {/* Tool Overview */}
            <section class="doc-section">
                <h2>Available Tools</h2>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Tool</th>
                            <th>Shortcut</th>
                            <th>Characteristics</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Pencil</strong></td>
                            <td><span class="kbd">P</span> or <span class="kbd">8</span></td>
                            <td>Basic freehand drawing with consistent width</td>
                        </tr>
                        <tr>
                            <td><strong>Fineliner</strong></td>
                            <td>Toolbar</td>
                            <td>Precise, thin strokes for detailed work</td>
                        </tr>
                        <tr>
                            <td><strong>Marker</strong></td>
                            <td>Toolbar</td>
                            <td>Wide, bold strokes for highlighting</td>
                        </tr>
                        <tr>
                            <td><strong>Ink Brush</strong></td>
                            <td>Toolbar</td>
                            <td>Pressure-sensitive, calligraphic strokes</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Pencil */}
            <section class="doc-section">
                <h2>Pencil</h2>
                <p>
                    The default freehand drawing tool. Creates smooth, consistent-width strokes
                    perfect for quick sketches and annotations.
                </p>

                <h3>Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Stroke Width</strong></td>
                            <td>Line thickness (1-20px)</td>
                        </tr>
                        <tr>
                            <td><strong>Color</strong></td>
                            <td>Stroke color</td>
                        </tr>
                        <tr>
                            <td><strong>Opacity</strong></td>
                            <td>Transparency level</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Smooth Lines</h5>
                    <p>
                        Draw slowly for smoother lines. The pencil tool applies automatic
                        smoothing to reduce jagged edges.
                    </p>
                </div>
            </section>

            {/* Fineliner */}
            <section class="doc-section">
                <h2>Fineliner</h2>
                <p>
                    A precision drawing tool that produces thin, consistent strokes.
                    Ideal for detailed illustrations, signatures, and fine annotations.
                </p>

                <h3>Best For</h3>
                <ul>
                    <li>Technical sketches</li>
                    <li>Handwritten labels</li>
                    <li>Fine detail work</li>
                    <li>Signatures</li>
                </ul>
            </section>

            {/* Marker */}
            <section class="doc-section">
                <h2>Marker</h2>
                <p>
                    A bold, wide-stroke tool perfect for highlighting, emphasis,
                    and creating impactful visual elements.
                </p>

                <h3>Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Stroke Width</strong></td>
                            <td>Marker thickness (typically 10-30px)</td>
                        </tr>
                        <tr>
                            <td><strong>Opacity</strong></td>
                            <td>Semi-transparent for highlighter effect</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Highlighter Effect</h5>
                    <p>
                        Set opacity to 40-60% and use bright yellow or green for
                        a realistic highlighter effect over text and shapes.
                    </p>
                </div>
            </section>

            {/* Ink Brush */}
            <section class="doc-section">
                <h2>Ink Brush</h2>
                <p>
                    A calligraphic brush that varies stroke width based on drawing speed.
                    Creates elegant, expressive strokes with an organic feel.
                </p>

                <h3>Characteristics</h3>
                <ul>
                    <li><strong>Speed Sensitivity</strong> - Fast strokes are thinner, slow strokes are thicker</li>
                    <li><strong>Tapered Ends</strong> - Natural stroke start/end tapering</li>
                    <li><strong>Smooth Curves</strong> - Optimized for flowing, continuous lines</li>
                </ul>

                <h3>Best For</h3>
                <ul>
                    <li>Calligraphy and lettering</li>
                    <li>Artistic flourishes</li>
                    <li>Expressive illustrations</li>
                    <li>Asian-style brush strokes</li>
                </ul>
            </section>

            {/* Eraser */}
            <section class="doc-section">
                <h2>Eraser</h2>
                <p>
                    Remove parts of freehand drawings or delete entire elements.
                </p>

                <h3>Modes</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Mode</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Element Eraser</strong></td>
                            <td>Click to delete entire shapes/elements</td>
                        </tr>
                        <tr>
                            <td><strong>Stroke Eraser</strong></td>
                            <td>Erase portions of freehand strokes</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Quick Access</h5>
                    <p>
                        Press <span class="kbd">E</span> or <span class="kbd">7</span> to quickly switch to the eraser tool.
                    </p>
                </div>
            </section>

            {/* Laser Pointer */}
            <section class="doc-section">
                <h2>Laser Pointer</h2>
                <p>
                    A temporary drawing tool for presentations. Strokes fade away after a few seconds,
                    perfect for pointing out elements during screen sharing or presentations.
                </p>

                <h3>Usage</h3>
                <ul>
                    <li>Activate with <span class="kbd">Shift</span>+<span class="kbd">P</span></li>
                    <li>Draw attention to specific areas</li>
                    <li>Strokes automatically fade after ~2 seconds</li>
                    <li>Great for presentations and demos</li>
                </ul>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">P</span> or <span class="kbd">8</span>
                        </div>
                        <span class="shortcut-desc">Pencil tool</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">E</span> or <span class="kbd">7</span>
                        </div>
                        <span class="shortcut-desc">Eraser tool</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span>+<span class="kbd">P</span>
                        </div>
                        <span class="shortcut-desc">Laser pointer</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">[</span> / <span class="kbd">]</span>
                        </div>
                        <span class="shortcut-desc">Decrease/increase brush size</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span>+<span class="kbd">Q</span>
                        </div>
                        <span class="shortcut-desc">Toggle Smart Shapes</span>
                    </div>
                </div>
            </section>

            {/* Smart Shapes */}
            <section class="doc-section">
                <h2>Smart Shapes (hold to correct)</h2>
                <p>
                    Draw a shape freehand with any pen tool (Pencil, Fineliner, Ink Brush, Marker)
                    and <strong>hold the pen still for about half a second</strong> before lifting.
                    The freehand stroke instantly snaps to a clean geometric shape.
                </p>
                <p>
                    Your <strong>pen tool stays active</strong> and nothing is left selected, so you
                    can carry straight on drawing without a trip back to the toolbar or a set of
                    selection handles sitting on top of your work. Switch to <strong>Select</strong>
                    (<span class="kbd">V</span>) and click the shape when you want to move, resize,
                    fill or connect it.
                </p>
                <ul>
                    <li>A roughly straight stroke becomes a <strong>line</strong>.</li>
                    <li>A closed round stroke becomes an <strong>ellipse / circle</strong>.</li>
                    <li>A four-cornered stroke becomes a <strong>rectangle</strong> (or a <strong>diamond</strong> when drawn on its points).</li>
                    <li>A three-cornered stroke becomes a <strong>triangle</strong>.</li>
                </ul>
                <p>
                    It is built to cope with a <strong>mouse or trackpad</strong>, not just a stylus:
                    wobbly edges, a corner you didn't quite close, and running past your own starting
                    point are all recognised normally. Draw roughly — you don't need a steady hand.
                </p>
                <p>
                    If the stroke is genuinely ambiguous it is left as freehand ink, so holding still
                    never forces a wrong shape. Open strokes are only ever turned into a line: an arc
                    or a half-drawn box stays as ink rather than being closed up for you.
                    Toggle the feature with <span class="kbd">Shift</span>+<span class="kbd">Q</span>,
                    from the Command Palette, or in <strong>Settings → Pen &amp; Input</strong>.
                </p>
            </section>

            {/* Pressure Sensitivity */}
            <section class="doc-section">
                <h2>Pressure Sensitivity</h2>
                <p>
                    With an Apple Pencil or other pressure-capable stylus, the <strong>Ink Brush</strong>
                    varies its width with how hard you press — light for fast, fine lines and heavy for
                    bold strokes. Input without pressure (mouse, finger) falls back to velocity-based
                    width. Turn pressure on or off in <strong>Settings → Pen &amp; Input</strong>.
                </p>
            </section>

            {/* Stroke Stabilization */}
            <section class="doc-section">
                <h2>Stroke Stabilization (lazy brush)</h2>
                <p>
                    For confident, clean inking, turn on <strong>stroke stabilization</strong>. The
                    brush trails your cursor on a "pulled string" — small jitter inside the string's
                    length is absorbed, and the line is dragged along only once you pull past it.
                    Higher strength means a longer string: smoother and heavier, with a little more
                    lag. The same Procreate/Krita inking feel, and it works with mouse, finger, and
                    Apple Pencil.
                </p>
                <p>
                    Because you'll flip it on and off as you work, it's available several ways:
                    a quick toggle with <span class="kbd">Shift</span>+<span class="kbd">S</span>,
                    the <strong>stabilization button</strong> in the toolbar (shown while a pen tool
                    is active), the <strong>brush properties panel</strong> (a 0–100% strength slider),
                    the Command Palette, and <strong>Settings → Pen &amp; Input</strong>. The toggle
                    remembers your last strength. It stacks on top of the always-on light smoothing.
                </p>
            </section>

            {/* Touch Gestures */}
            <section class="doc-section">
                <h2>Touch Gestures (iPad &amp; touch)</h2>
                <p>
                    On a touchscreen, multi-finger gestures give you quick, keyboard-free shortcuts
                    while you draw — inspired by Procreate. One finger draws (with palm rejection when
                    an Apple Pencil is paired); extra fingers act as commands.
                </p>
                <ul>
                    <li><strong>Two-finger drag / pinch</strong> — pan and zoom the canvas.</li>
                    <li><strong>Two-finger tap</strong> — undo. Hold two fingers still to keep undoing.</li>
                    <li><strong>Three-finger tap</strong> — redo.</li>
                    <li><strong>Three-finger swipe down</strong> — copy the current selection.</li>
                    <li><strong>Four-finger tap</strong> — toggle Zen mode (hide the UI chrome).</li>
                    <li><strong>Quick pinch-in flick</strong> — zoom to fit.</li>
                </ul>
                <p>
                    A quick two-finger tap no longer nudges the canvas — panning only begins once your
                    fingers actually move, so taps stay crisp commands.
                </p>
            </section>

            {/* ColorDrop */}
            <section class="doc-section">
                <h2>ColorDrop — drag a colour onto a shape</h2>
                <p>
                    Open the colour palette and <strong>drag a swatch onto any shape</strong> to set its
                    fill — a colour chip follows your finger and the shape under it is filled on release.
                    A plain tap on a swatch still sets the stroke colour (<span class="kbd">Shift</span>+click
                    for fill on desktop). On desktop you can also drag a swatch onto a shape with the mouse.
                </p>
            </section>

            {/* Text sizing */}
            <section class="doc-section">
                <h2>Text sizing — auto width vs fixed width</h2>
                <p>
                    A text box has two sizing modes, shown as the <strong>Auto Resize</strong> toggle in the
                    Properties panel (Text group):
                </p>
                <ul>
                    <li>
                        <strong>Auto Resize on — auto width.</strong> The box hugs the text and never wraps; it
                        grows and shrinks as you type. Only your own line breaks split lines. This is what you
                        get when you <strong>click</strong> with the Text tool.
                    </li>
                    <li>
                        <strong>Auto Resize off — fixed width.</strong> The width you set is held, the text wraps
                        inside it, and the height re-flows to fit. This is what you get when you
                        <strong> drag out a box</strong> with the Text tool.
                    </li>
                </ul>
                <p class="tip-box">
                    <strong>Dragging the left or right handle switches an auto-width box to fixed width</strong>
                    — the width you drag to is the width you keep, and the text wraps into it (as in Figma). Use
                    the Auto Resize toggle to go back: the box snaps in to hug the text again. Corner and
                    top/bottom handles resize the box freely and never change the font size.
                </p>
            </section>

            {/* Text on Path */}
            <section class="doc-section">
                <h2>Text on Path (Curved Text)</h2>
                <p>
                    Any path-like element can carry a text label that follows its shape. Double-click the
                    element to type, then toggle <strong>Curved Text</strong> in the quick toolbar to make
                    the text flow along the path.
                </p>
                <ul>
                    <li><strong>Pen strokes</strong> (Fineliner, Ink Brush, Marker) — text follows the stroke you drew.</li>
                    <li><strong>Connectors</strong> — lines, arrows, bezier curves, elbows, and polylines.</li>
                    <li><strong>Closed shapes</strong> — rectangle, circle, diamond, triangle, polygons, etc.; the text wraps around the outline.</li>
                </ul>
                <p>
                    With Curved Text off, the label stays a normal centered caption. On closed shapes you
                    can nudge where the text starts and whether it sits on or just outside the outline.
                </p>
            </section>

            {/* Scripting (API) */}
            <section class="doc-section">
                <h2>Scripting (API)</h2>
                <p>
                    The freehand tools (Pencil, Fineliner, Marker, Ink Brush) are primarily
                    <em> interactive</em> — you draw with a pointer or stylus. For programmatic strokes,
                    the global <code>window.Yappy</code> (usable as <code>Yappy</code>) exposes a few
                    ways to commit ink from a list of world points.
                </p>
                <pre class="code-block"><code>{`// Blob brush: filled stroke from world points (radius = half-thickness).
// Same-colour overlaps merge into one shape.
Yappy.blobStroke([
  { x: 100, y: 100 }, { x: 160, y: 130 }, { x: 220, y: 100 },
], 14);

// A vector "pen" stroke as an open path (crisp, fully editable)
Yappy.createPath([
  { x: 100, y: 220, kind: 'smooth', outX: 40, outY: -40 },
  { x: 240, y: 220, kind: 'smooth', inX: -40, inY: -40 },
], { closed: false, strokeColor: '#1e1e1e', strokeWidth: 3 });`}</code></pre>
                <table class="api-table">
                    <thead>
                        <tr><th>Method</th><th>Purpose</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><code>blobStroke(points, radius?)</code></td><td>Commit a filled brush stroke (default radius 14)</td></tr>
                        <tr><td><code>createPath(anchors, opts?)</code></td><td>A crisp, editable vector stroke as a path</td></tr>
                        <tr><td><code>toggleBlobBrush(active?)</code></td><td>Turn the blob brush tool on/off</td></tr>
                        <tr><td><code>togglePathEraser(active?)</code></td><td>Turn the path eraser on/off</td></tr>
                        <tr><td><code>pathErase(points, radius?)</code></td><td>Carve an eraser swath out of overlapping shapes</td></tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    For the full vector-path scripting surface (smoothing, simplifying, outlining a stroke
                    into a filled shape), see the <strong>Vector Paths</strong> help page.
                </p>
            </section>
        </div>
    );
};

export default DrawingToolsDoc;
