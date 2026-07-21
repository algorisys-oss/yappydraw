/**
 * Animation Documentation
 * Comprehensive guide to the Yappy animation system
 */

import type { Component } from 'solid-js';

export const AnimationDoc: Component = () => {
    return (
        <div class="doc-container">
            {/* Header */}
            <header class="doc-header">
                <h1>Animations</h1>
                <p class="doc-intro">
                    Add life to your diagrams with powerful animation capabilities.
                    Yappy supports 40+ animation presets, keyframe animations, path animations,
                    shape morphing, and spring physics for natural motion.
                </p>
            </header>

            {/* Key Features */}
            <section class="doc-section">
                <h2>Key Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h4>40+ Presets</h4>
                        <p>Entrance, exit, and emphasis animations inspired by Animate.css</p>
                    </div>
                    <div class="feature-card">
                        <h4>Keyframes</h4>
                        <p>Create custom animations with precise control over timing and values</p>
                    </div>
                    <div class="feature-card">
                        <h4>Path Animation</h4>
                        <p>Animate elements along any SVG path with auto-rotation</p>
                    </div>
                    <div class="feature-card">
                        <h4>Shape Morphing</h4>
                        <p>Smoothly transform one shape into another</p>
                    </div>
                    <div class="feature-card">
                        <h4>Spring Physics</h4>
                        <p>Natural, physics-based motion with bounce and settle</p>
                    </div>
                    <div class="feature-card">
                        <h4>Recording</h4>
                        <p>Export animations as MP4, WebM or animated GIF</p>
                    </div>
                </div>
            </section>

            {/* Keyframes Timeline (After Effects–style) */}
            <section class="doc-section">
                <h2>Keyframes Timeline (dope sheet)</h2>
                <p>
                    The <strong>Keyframes</strong> panel is an After&nbsp;Effects–style, absolute-time
                    timeline for the selected element. Unlike the trigger-based presets above, keyframes
                    live on a scrubbable playhead: every property is evaluated at time&nbsp;<em>t</em> and
                    previewed live on the canvas (and in exported video). Open it from
                    <strong> Menu → View → Keyframes</strong> or with <kbd>Alt</kbd>+<kbd>K</kbd>.
                </p>

                <h3>Authoring keyframes</h3>
                <ol>
                    <li>Select an element — its animatable properties appear as track rows
                        (Position&nbsp;X/Y, Width, Height, Rotation, Opacity, Fill, Stroke).</li>
                    <li>Move the playhead (drag the ruler) to the time you want.</li>
                    <li>Set the property to the value you want (e.g. move/resize/recolor the element),
                        then click the <strong>◆ stopwatch</strong> on that property row to record a
                        keyframe at the playhead. Repeat at a later time to create motion.</li>
                    <li>Press <strong>Play</strong> to preview, or scrub the ruler. Values between
                        keyframes are interpolated (colours blend in hex; rotation in degrees).</li>
                </ol>

                <h3>Animating effects</h3>
                <p>
                    Beyond transform and colour, the panel keyframes <strong>live-effect parameters</strong>:
                    <strong> Feather</strong> (soft edges — on any shape), <strong>Stroke Width</strong>,
                    <strong> Blur</strong> (images/video), and — once the effect is enabled on the element —
                    <strong> Glow</strong> (radius + colour) and <strong>Shadow</strong> (blur, X/Y offset,
                    colour). Effect params start at 0 ("off"), so you can key a glow or feather that reveals
                    over time. Example: <code>Yappy.addKeyframe(id, 'featherRadius', 0, 0)</code> then
                    <code> Yappy.addKeyframe(id, 'featherRadius', 2, 30)</code> blurs the shape in over 2s.
                </p>
                <p>
                    <strong>3D &amp; warp.</strong> Nested effect params animate too, via dotted paths:
                    <strong> Extrude Depth / Angle / Tilt / Bevel</strong> (when the shape has 3D Extrude)
                    and <strong>Warp Bend</strong> (on a warp preset) appear as rows once the effect is on —
                    e.g. <code>Yappy.addKeyframe(id, 'extrude.depth', 0, 0)</code> then
                    <code> (id, 'extrude.depth', 2, 70)</code> grows a solid out of the flat shape.
                </p>
                <p>
                    <strong>Adjustment layers.</strong> Add one from <em>Menu → View → Add Adjustment
                    Layer</em> (or <code>Yappy.createAdjustmentLayer()</code>): a rectangular region that
                    applies a CSS filter (blur / brightness / contrast / saturate / hue) to everything drawn
                    <em> beneath</em> it — and its filter params are keyframable, so you can sweep a blur or a
                    colour grade across your artwork over time. (It's an authoring gizmo, so it isn't drawn
                    in PNG/SVG export yet.)
                </p>

                <h3>Editing keyframes</h3>
                <table class="api-table">
                    <thead>
                        <tr><th>Action</th><th>How</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Add / update a key</td><td>Click the ◆ stopwatch on the property row (records the current value at the playhead)</td></tr>
                        <tr><td>Retime a key</td><td>Drag its diamond left/right (snaps to 0.05&nbsp;s)</td></tr>
                        <tr><td>Delete a key</td><td>Double-click the diamond, or select it and press <kbd>Del</kbd></td></tr>
                        <tr><td>Scrub</td><td>Drag the ruler, or click an empty lane at the target time</td></tr>
                        <tr><td>Duration</td><td>Edit the <em>dur</em> field in the panel header</td></tr>
                        <tr><td>Undo / redo</td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> — keyframe edits are in the history stack</td></tr>
                    </tbody>
                </table>

                <div class="code-block">
                    <pre>{`// Scripting the timeline (window.Yappy)
const id = Yappy.createRectangle(100, 100, 80, 60);
Yappy.addKeyframe(id, 'x', 0, 100);        // t = 0s
Yappy.addKeyframe(id, 'x', 2, 400);        // t = 2s
Yappy.addKeyframe(id, 'opacity', 0, 100);
Yappy.addKeyframe(id, 'opacity', 2, 0, 'easeInQuad');
Yappy.toggleKeyframePanel(true);
Yappy.seekScene(1);                         // scrub to 1s (x = 250, opacity ≈ 50)
Yappy.evaluateComposition(1);               // → Map(id → { x, opacity })`}</pre>
                </div>

                <h3>Easing &amp; the graph editor</h3>
                <p>
                    Click a keyframe diamond to select it — an <strong>Easing</strong> popover opens for the
                    segment entering that key. Pick a preset, or drag the two handles in the bezier graph to
                    shape the timing curve by hand (overshoot is allowed — drag a handle above the box).
                </p>
                <table class="api-table">
                    <thead>
                        <tr><th>Preset</th><th>Feel</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Linear</td><td>Constant speed</td></tr>
                        <tr><td>Ease In</td><td>Slow start, accelerate</td></tr>
                        <tr><td>Ease Out</td><td>Fast start, decelerate</td></tr>
                        <tr><td>Ease In-Out</td><td>Ease at both ends (natural)</td></tr>
                        <tr><td>Hold</td><td>Stepped — the value jumps at the keyframe with no interpolation (shown as a square marker)</td></tr>
                    </tbody>
                </table>
                <div class="code-block">
                    <pre>{`// Easing is stored per keyframe (on the segment entering it):
Yappy.addKeyframe(id, 'x', 2, 400, 'easeInQuad');   // named easing
// or set bezier handles / hold directly on the track:
Yappy.setCompositionTracks([{ elementId: id, property: 'x', keys: [
  { t: 0, value: 0 },
  { t: 2, value: 400, ease: { ox: 0.42, oy: 0, ix: 0.58, iy: 1 } }, // ease in-out
  { t: 3, value: 400, hold: true },                                  // stepped
]}]);`}</pre>
                </div>

                <h3>Transform parenting &amp; null objects</h3>
                <p>
                    Make one element inherit another's animated motion. With an element selected, pick a
                    <strong> Parent</strong> in the Keyframes panel header — it now follows the parent's
                    animated <em>position, rotation and scale</em> (a child with no keyframes of its own still
                    moves when its parent animates). Great for rigs: parent several parts to one controller
                    and animate just the controller.
                </p>
                <p>
                    A <strong>null object</strong> (the ⊕ button, or <code>Yappy.createNull()</code>) is an
                    invisible controller — it shows as a small crosshair while editing, follows every
                    parenting rule, and never appears in exports or presentations. Parent your layers to a
                    null and keyframe the null to move the whole group as one.
                </p>
                <div class="code-block">
                    <pre>{`const ctrl = Yappy.createNull(200, 200);      // invisible controller
const box = Yappy.createRectangle(400, 300, 80, 60);
Yappy.setTransformParent(box, ctrl);          // box now follows ctrl
Yappy.addKeyframe(ctrl, 'angle', 0, 0);
Yappy.addKeyframe(ctrl, 'angle', 2, Math.PI/2); // box swings with it`}</pre>
                </div>

                <div class="tip-box">
                    <strong>Note:</strong> the Keyframes timeline shares the playhead clock with the Scene
                    Timeline, so only one is open at a time. Keyframe values override the stored element at
                    render time without changing it — clearing the tracks restores the original. Transform
                    parenting is separate from mind-map parent/child hierarchy.
                </div>
            </section>

            {/* Animation Presets */}
            <section class="doc-section">
                <h2>Animation Presets</h2>
                <p>Yappy includes a rich library of animation presets organized by category:</p>

                <h3>Entrance Animations</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Animations</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Fade</strong></td>
                            <td>fadeIn, fadeInDown, fadeInUp, fadeInLeft, fadeInRight, fadeInTopLeft, fadeInTopRight, fadeInBottomLeft, fadeInBottomRight</td>
                        </tr>
                        <tr>
                            <td><strong>Slide</strong></td>
                            <td>slideInDown, slideInUp, slideInLeft, slideInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Bounce</strong></td>
                            <td>bounceIn, bounceInDown, bounceInUp, bounceInLeft, bounceInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Zoom</strong></td>
                            <td>zoomIn, zoomInDown, zoomInUp, zoomInLeft, zoomInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Back</strong></td>
                            <td>backInDown, backInUp, backInLeft, backInRight</td>
                        </tr>
                        <tr>
                            <td><strong>Rotate</strong></td>
                            <td>rotateIn, rotateInDownLeft, rotateInDownRight, rotateInUpLeft, rotateInUpRight</td>
                        </tr>
                        <tr>
                            <td><strong>Text</strong></td>
                            <td>typewriter, typewriterCursor, wordByWord, textScramble, lineByLine</td>
                        </tr>
                        <tr>
                            <td><strong>Table</strong></td>
                            <td>tableRowReveal, tableColReveal, tableCellFill, tableHeatmapFadeIn, tableRowHighlight, tableColPulse, tableGridDraw, tableHeaderSlam, tableCountUp, tableAccordion, tableCellsAssemble, tableLightningSplit</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Exit Animations</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Animations</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Fade</strong></td>
                            <td>fadeOut, fadeOutDown, fadeOutUp, fadeOutLeft, fadeOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Slide</strong></td>
                            <td>slideOutDown, slideOutUp, slideOutLeft, slideOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Bounce</strong></td>
                            <td>bounceOut, bounceOutDown, bounceOutUp, bounceOutLeft, bounceOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Zoom</strong></td>
                            <td>zoomOut, zoomOutDown, zoomOutUp, zoomOutLeft, zoomOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Back</strong></td>
                            <td>backOutDown, backOutUp, backOutLeft, backOutRight</td>
                        </tr>
                        <tr>
                            <td><strong>Rotate</strong></td>
                            <td>rotateOut, rotateOutDownLeft, rotateOutDownRight, rotateOutUpLeft, rotateOutUpRight</td>
                        </tr>
                        <tr>
                            <td><strong>Text</strong></td>
                            <td>textDelete</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Emphasis Animations (Attention Seekers)</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Animation</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>bounce</strong></td>
                            <td>Element bounces up and down</td>
                        </tr>
                        <tr>
                            <td><strong>flash</strong></td>
                            <td>Element flashes (opacity pulses)</td>
                        </tr>
                        <tr>
                            <td><strong>pulse</strong></td>
                            <td>Element scales up and back</td>
                        </tr>
                        <tr>
                            <td><strong>rubberBand</strong></td>
                            <td>Element stretches and snaps back</td>
                        </tr>
                        <tr>
                            <td><strong>shakeX / shakeY</strong></td>
                            <td>Element shakes horizontally/vertically</td>
                        </tr>
                        <tr>
                            <td><strong>headShake</strong></td>
                            <td>Element shakes side to side (like saying "no")</td>
                        </tr>
                        <tr>
                            <td><strong>swing</strong></td>
                            <td>Element swings like a pendulum</td>
                        </tr>
                        <tr>
                            <td><strong>tada</strong></td>
                            <td>Element does a "ta-da!" reveal</td>
                        </tr>
                        <tr>
                            <td><strong>wobble</strong></td>
                            <td>Element wobbles back and forth</td>
                        </tr>
                        <tr>
                            <td><strong>jello</strong></td>
                            <td>Element jiggles like jello</td>
                        </tr>
                        <tr>
                            <td><strong>heartBeat</strong></td>
                            <td>Element pulses like a heartbeat</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Text Animations */}
            <section class="doc-section">
                <h2>Text Animations</h2>
                <p>Special animations designed specifically for text elements:</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Animation</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>typewriter</strong></td>
                            <td>Classic letter-by-letter reveal effect, like typing on a keyboard</td>
                        </tr>
                        <tr>
                            <td><strong>typewriterCursor</strong></td>
                            <td>Letter-by-letter reveal with a blinking cursor</td>
                        </tr>
                        <tr>
                            <td><strong>wordByWord</strong></td>
                            <td>Reveals text one word at a time</td>
                        </tr>
                        <tr>
                            <td><strong>textScramble</strong></td>
                            <td>Hacker/decode effect - characters scramble randomly then resolve to the final text</td>
                        </tr>
                        <tr>
                            <td><strong>lineByLine</strong></td>
                            <td>Reveals text one line at a time - perfect for lists and multi-line content</td>
                        </tr>
                        <tr>
                            <td><strong>textDelete</strong></td>
                            <td>Exit animation - erases text character by character from the end</td>
                        </tr>
                        <tr>
                            <td><strong>charByChar</strong></td>
                            <td>Per-character reveal with stagger - like GSAP's SplitText</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Note</h5>
                    <p>
                        Text animations work on <strong>text elements</strong> and any <strong>shape with container text</strong>
                        (double-click a shape to add text inside it). For best results, use longer durations (1-3 seconds)
                        to make the text reveal readable.
                    </p>
                </div>

                <h3>API Usage</h3>
                <div class="code-block">
{`// Typewriter effect over 2 seconds
typewriter(textElementId, 2000);

// Word by word reveal
wordByWord(textElementId, 3000);

// Hacker decode effect
textScramble(textElementId, 1500);

// Per-character reveal with stagger (GSAP-like)
charByChar(textElementId, 1500, { each: 50, from: 'center' });

// Count up animation (for numbers)
textCountUp(textElementId, 0, 1000, 2000, {
    params: { suffix: '+', useCommas: true }
});`}
                </div>
            </section>

            {/* Table Animations */}
            <section class="doc-section">
                <h2>Table Animations</h2>
                <p>Special animations designed specifically for table elements, leveraging the table's internal structure (rows, columns, cells):</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Preset</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>tableRowReveal</strong></td>
                            <td>Rows appear one at a time from top to bottom</td>
                        </tr>
                        <tr>
                            <td><strong>tableColReveal</strong></td>
                            <td>Columns appear one at a time from left to right</td>
                        </tr>
                        <tr>
                            <td><strong>tableCellFill</strong></td>
                            <td>Cells fill in one at a time in row-major order</td>
                        </tr>
                        <tr>
                            <td><strong>tableHeatmapFadeIn</strong></td>
                            <td>Cells fade in with randomized stagger for a heatmap-like effect</td>
                        </tr>
                        <tr>
                            <td><strong>tableRowHighlight</strong></td>
                            <td>A highlight color sweeps through each row</td>
                        </tr>
                        <tr>
                            <td><strong>tableColPulse</strong></td>
                            <td>A highlight color pulses through each column</td>
                        </tr>
                        <tr>
                            <td><strong>tableGridDraw</strong></td>
                            <td>Border draws first, then grid lines appear, then cell backgrounds and text fade in</td>
                        </tr>
                        <tr>
                            <td><strong>tableHeaderSlam</strong></td>
                            <td>Header row drops in with a bounce effect, then body rows fade in</td>
                        </tr>
                        <tr>
                            <td><strong>tableCountUp</strong></td>
                            <td>Numeric cells count up from 0 to their final value</td>
                        </tr>
                        <tr>
                            <td><strong>tableAccordion</strong></td>
                            <td>Rows expand one at a time from collapsed to full height</td>
                        </tr>
                        <tr>
                            <td><strong>tableCellsAssemble</strong></td>
                            <td>Cells fly in from scattered positions and assemble into the table</td>
                        </tr>
                        <tr>
                            <td><strong>tableLightningSplit</strong></td>
                            <td>Table splits along a zigzag lightning bolt crack, halves slam together with a flash</td>
                        </tr>
                    </tbody>
                </table>

                <h3>API Usage</h3>
                <div class="code-block">
{`// Row-by-row reveal over 1.2 seconds
tableRowReveal(tableElementId, 1200);

// Grid draws in over 1.8 seconds
tableGridDraw(tableElementId, 1800);

// Numeric cells count up from 0
tableCountUp(tableElementId, 1500);

// Header slams in with bounce
tableHeaderSlam(tableElementId, 1200);

// Cells fly in and assemble into the table
tableCellsAssemble(tableElementId, 1800);

// Lightning splits and slams the table together
tableLightningSplit(tableElementId, 1500);`}
                </div>
            </section>

            {/* GSAP-like Stagger Features */}
            <section class="doc-section">
                <h2>Advanced Stagger (GSAP-like)</h2>
                <p>
                    Yappy includes GSAP-inspired stagger utilities for animating multiple elements
                    with sophisticated timing patterns.
                </p>

                <h3>Using Stagger from the UI</h3>
                <p>Select multiple elements to access stagger animations in the Animation Panel:</p>
                <ol>
                    <li><strong>Select multiple elements</strong> - Use Shift+click or drag a selection box</li>
                    <li><strong>Open Animation Panel</strong> - Located in the right sidebar Properties panel</li>
                    <li><strong>Configure stagger settings:</strong>
                        <ul>
                            <li><strong>Effect</strong> - Choose any preset (fadeIn, slideInLeft, drawIn, shakeX, revolve, glitch, …); it is applied to <em>each</em> member of the selection/group</li>
                            <li><strong>Distribution</strong> - How elements animate (From Start, Center, Edges, Random)</li>
                            <li><strong>Stagger (ms)</strong> - Delay between each element starting</li>
                            <li><strong>Duration (ms)</strong> - How long each animation lasts</li>
                            <li><strong>Easing</strong> - Animation timing curve</li>
                        </ul>
                    </li>
                    <li><strong>Preview</strong> - Test the animation without saving</li>
                    <li><strong>Apply</strong> - Save animations to elements (works in presentations)</li>
                </ol>

                <div class="tip-box">
                    <h5>Tip</h5>
                    <p>
                        The <strong>Apply</strong> button saves animations to each element with calculated delays,
                        so they'll play correctly in presentation mode. Use <strong>Clear All Animations</strong>
                        to remove animations from all selected elements.
                    </p>
                </div>

                <div class="tip-box">
                    <h5>Groups &amp; drawIn</h5>
                    <p>
                        Selecting a <strong>group</strong> is a multi-selection, so presets apply to every member.
                        You can also use <strong>Add Animation</strong> to add a preset to the whole group at once.
                        The <strong>drawIn</strong> / <strong>drawOut</strong> reveal works on vector paths and
                        freehand strokes (fineliner, ink brush, marker) as well as shapes — the outline traces on
                        progressively rather than just fading in.
                    </p>
                </div>

                <h3>Stagger Distribution Modes</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Mode</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>start</strong></td>
                            <td>Sequential from first to last element (default)</td>
                        </tr>
                        <tr>
                            <td><strong>end</strong></td>
                            <td>Sequential from last to first element</td>
                        </tr>
                        <tr>
                            <td><strong>center</strong></td>
                            <td>Start from center, expand outward</td>
                        </tr>
                        <tr>
                            <td><strong>edges</strong></td>
                            <td>Start from edges, converge to center</td>
                        </tr>
                        <tr>
                            <td><strong>random</strong></td>
                            <td>Random order for organic feel</td>
                        </tr>
                        <tr>
                            <td><strong>number</strong></td>
                            <td>Start from specific index</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Stagger Configuration</h3>
                <div class="code-block">
{`// Stagger from center with easing
animateElementsStagger(elementIds, { opacity: 100 }, { duration: 500 }, {
    each: 100,        // 100ms between each element
    from: 'center',   // Start from center
    ease: 'easeOutQuad'  // Ease the stagger timing
});

// Grid-based stagger (for elements in a grid layout)
animateElementsStagger(elementIds, { y: 0 }, { duration: 300 }, {
    amount: 800,      // Total stagger time
    grid: [4, 3],     // 4 columns, 3 rows
    from: 'center'    // Radial from center
});

// animateFrom - animate FROM a state TO current
animateFrom(elementId, { opacity: 0, y: 50 }, { duration: 500 });

// animateFromTo - full control
animateFromTo(elementId,
    { x: -200, opacity: 0 },
    { x: 100, opacity: 100 },
    { duration: 500 }
);

// Staggered "from" animation
animateElementsFrom(elementIds,
    { y: 50, opacity: 0 },
    { duration: 400 },
    { each: 100, from: 'start' }
);`}
                </div>

                <h3>Random Utilities</h3>
                <div class="code-block">
{`// Random value in range
const delay = random(100, 500);  // 100-500ms

// Random integer
const count = randomInt(1, 10);  // 1-10

// Pick random from array
const easing = randomPick(['easeOutQuad', 'easeOutCubic', 'easeOutElastic']);

// Shuffle array
const shuffledIds = shuffle(elementIds);`}
                </div>
            </section>

            {/* Easing Functions */}
            <section class="doc-section">
                <h2>Easing Functions</h2>
                <p>Control the timing and feel of animations with easing functions:</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Functions</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Linear</strong></td>
                            <td>linear</td>
                            <td>Constant speed, no acceleration</td>
                        </tr>
                        <tr>
                            <td><strong>Quadratic</strong></td>
                            <td>easeInQuad, easeOutQuad, easeInOutQuad</td>
                            <td>Gentle acceleration/deceleration</td>
                        </tr>
                        <tr>
                            <td><strong>Cubic</strong></td>
                            <td>easeInCubic, easeOutCubic, easeInOutCubic</td>
                            <td>More pronounced curve</td>
                        </tr>
                        <tr>
                            <td><strong>Exponential</strong></td>
                            <td>easeInExpo, easeOutExpo, easeInOutExpo</td>
                            <td>Dramatic start/end</td>
                        </tr>
                        <tr>
                            <td><strong>Bounce</strong></td>
                            <td>easeInBounce, easeOutBounce, easeInOutBounce</td>
                            <td>Bouncing ball effect</td>
                        </tr>
                        <tr>
                            <td><strong>Elastic</strong></td>
                            <td>easeInElastic, easeOutElastic</td>
                            <td>Spring-like overshoot</td>
                        </tr>
                        <tr>
                            <td><strong>Back</strong></td>
                            <td>easeInBack, easeOutBack</td>
                            <td>Overshoots then settles</td>
                        </tr>
                        <tr>
                            <td><strong>Spring</strong></td>
                            <td>easeSpring</td>
                            <td>Physics-based spring motion</td>
                        </tr>
                    </tbody>
                </table>

                <div class="tip-box">
                    <h5>Tip: Choosing the Right Easing</h5>
                    <p>
                        <strong>easeOut</strong> - Best for entrances (fast start, gentle end)<br />
                        <strong>easeIn</strong> - Best for exits (gentle start, fast end)<br />
                        <strong>easeInOut</strong> - Best for emphasis or continuous motion<br />
                        <strong>spring</strong> - Best for natural, organic feel
                    </p>
                </div>
            </section>

            {/* Spring Physics */}
            <section class="doc-section">
                <h2>Spring Physics</h2>
                <p>Create natural, physics-based motion using spring dynamics:</p>

                <h3>Spring Parameters</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Default</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>stiffness</strong></td>
                            <td>170</td>
                            <td>Spring tension (100-300). Higher = snappier motion</td>
                        </tr>
                        <tr>
                            <td><strong>damping</strong></td>
                            <td>26</td>
                            <td>Friction/resistance (10-40). Higher = less bounce</td>
                        </tr>
                        <tr>
                            <td><strong>mass</strong></td>
                            <td>1</td>
                            <td>Object weight (0.5-2). Higher = slower, heavier feel</td>
                        </tr>
                        <tr>
                            <td><strong>velocity</strong></td>
                            <td>0</td>
                            <td>Initial velocity. Add momentum to the start</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Create a custom spring
Yappy.animateElement(id, { x: 500 }, {
    easing: Yappy.createSpring(200, 20, 1, 0)
});

// Use default spring
Yappy.animateElement(id, { y: 300 }, {
    easing: 'easeSpring'
});`}
                </div>
            </section>

            {/* Path Animation */}
            <section class="doc-section">
                <h2>Path Animation</h2>
                <p>Animate elements along any SVG path:</p>

                <h3>Basic Usage</h3>
                <div class="code-block">
{`// Animate along a curved path
const pathData = "M 0 0 C 100 0 100 100 200 100";
Yappy.animateAlongPath(elementId, pathData, {
    duration: 2000,
    orientToPath: true,  // Auto-rotate to follow path
    isRelative: true     // Path is relative to element position
});`}
                </div>

                <h3>Options</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Option</th>
                            <th>Default</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>orientToPath</strong></td>
                            <td>false</td>
                            <td>Rotate element to follow path direction</td>
                        </tr>
                        <tr>
                            <td><strong>isRelative</strong></td>
                            <td>false</td>
                            <td>Treat path coordinates as relative to element</td>
                        </tr>
                        <tr>
                            <td><strong>startOffset</strong></td>
                            <td>0</td>
                            <td>Start position on path (0-1)</td>
                        </tr>
                        <tr>
                            <td><strong>endOffset</strong></td>
                            <td>1</td>
                            <td>End position on path (0-1)</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Shape Morphing */}
            <section class="doc-section">
                <h2>Shape Morphing</h2>
                <p>Smoothly transform one shape into another:</p>

                <div class="code-block">
{`// Morph a rectangle into an ellipse
Yappy.animateMorph(rectId, 'ellipse', {
    duration: 800,
    easing: 'easeInOutCubic'
});

// Supported shape targets:
// rectangle, ellipse, diamond, triangle, star, hexagon, etc.`}
                </div>

                <div class="tip-box">
                    <h5>Tip</h5>
                    <p>
                        For best results, morph between shapes with similar complexity.
                        Morphing a simple rectangle to a complex star will work, but
                        the intermediate frames may look unusual.
                    </p>
                </div>
            </section>

            {/* Keyframe Animation */}
            <section class="doc-section">
                <h2>Keyframe Animation</h2>
                <p>Create precise, multi-step animations with keyframes:</p>

                <div class="code-block">
{`// Animate X position through keyframes
Yappy.animateElementKeyframes(elementId, 'x', [
    { offset: 0, value: 100 },
    { offset: 0.5, value: 300, easing: 'easeOutBounce' },
    { offset: 1, value: 200, easing: 'easeInOutCubic' }
], { duration: 2000 });

// Animate multiple properties
Yappy.animateElementKeyframes(elementId, 'opacity', [
    { offset: 0, value: 100 },
    { offset: 0.3, value: 50 },
    { offset: 1, value: 100 }
], { duration: 1000, loop: true });`}
                </div>

                <h3>Keyframe Properties</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>offset</strong></td>
                            <td>Position in timeline (0-1)</td>
                        </tr>
                        <tr>
                            <td><strong>value</strong></td>
                            <td>Target value at this keyframe</td>
                        </tr>
                        <tr>
                            <td><strong>easing</strong></td>
                            <td>Easing function to use when transitioning TO this keyframe</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Animatable Properties */}
            <section class="doc-section">
                <h2>Animatable Properties</h2>
                <p>The following element properties can be animated:</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>x, y</strong></td>
                            <td>number</td>
                            <td>Position coordinates</td>
                        </tr>
                        <tr>
                            <td><strong>width, height</strong></td>
                            <td>number</td>
                            <td>Element dimensions</td>
                        </tr>
                        <tr>
                            <td><strong>opacity</strong></td>
                            <td>number</td>
                            <td>Transparency (0-100)</td>
                        </tr>
                        <tr>
                            <td><strong>angle</strong></td>
                            <td>number</td>
                            <td>Rotation in degrees</td>
                        </tr>
                        <tr>
                            <td><strong>strokeWidth</strong></td>
                            <td>number</td>
                            <td>Border thickness</td>
                        </tr>
                        <tr>
                            <td><strong>roughness</strong></td>
                            <td>number</td>
                            <td>Hand-drawn effect intensity</td>
                        </tr>
                        <tr>
                            <td><strong>drawProgress</strong></td>
                            <td>number</td>
                            <td>Progressive draw (0-1)</td>
                        </tr>
                        <tr>
                            <td><strong>strokeColor</strong></td>
                            <td>hex color</td>
                            <td>Border color</td>
                        </tr>
                        <tr>
                            <td><strong>backgroundColor</strong></td>
                            <td>hex color</td>
                            <td>Fill color</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Recording & Export */}
            <section class="doc-section">
                <h2>Recording &amp; Export (MP4, WebM, GIF)</h2>
                <p>
                    Open <strong>Menu → Export</strong> (<span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+
                    <span class="kbd">E</span>), pick <strong>MP4 Video</strong>, <strong>WebM Video</strong> or
                    <strong> Animated GIF</strong>, set the <strong>Duration</strong> in seconds, and export. The file
                    downloads when it's done.
                </p>

                <h3>Two different things happen, depending on the document</h3>
                <p>
                    This is the part worth knowing before you record — the same buttons behave differently on a
                    presentation/design page than on the infinite canvas.
                </p>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Document</th>
                            <th>What you get</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Presentation or Design</strong><br />(pages)</td>
                            <td>
                                An <strong>offline render of the page</strong> — exactly the page bounds at its own
                                resolution, animations playing, with no workspace grey, no neighbouring pages, and no
                                dependence on your current zoom or pan. You don't have to play anything: the export
                                drives the animation clock itself. Runs for the duration you set, then stops.
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Infinite canvas</strong></td>
                            <td>
                                A <strong>live screen capture</strong> of the canvas as you see it — your zoom, pan and
                                anything you do while it runs. It keeps going until you stop it (see below), so the
                                Duration field doesn't apply. GIF isn't offered here, because there are no page bounds
                                to frame it to.
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    For a clean animation file, export from a <strong>presentation or design page</strong>. Use live
                    capture when you want the recording to show what you're <em>doing</em> — a walkthrough, a demo, or
                    the whole presentation played end to end.
                </p>

                <h3>Live screen capture</h3>
                <p>
                    Start it from <strong>Menu → Export → MP4/WebM</strong> on an infinite-canvas document, or from a
                    script with <code>Yappy.recordAnimation()</code>. A red <strong>REC</strong> badge with a timer
                    appears at the top of the canvas — press its <strong>Stop</strong> button to finish and download.
                </p>
                <p>
                    It records the <strong>canvas surface only</strong>, at 60fps. Toolbars, panels, dialogs and the
                    REC badge are normal page UI and never appear in the recording, so you get a clean picture of the
                    drawing even while you work around it.
                </p>
                <h4>Recording a whole presentation</h4>
                <p>
                    Press <span class="kbd">F5</span> to present, then hit the <strong>Record</strong> button
                    (a video camera) in the presentation toolbar at the bottom of the screen. It turns into a red
                    <strong> Stop</strong> square — press it again to finish and download the MP4. Because it captures
                    the canvas as you drive it, everything you do lands in the file: slide transitions, build steps,
                    animations, laser pointer and ink annotations.
                </p>
                <p class="tip-box">
                    Recording is the <em>only</em> way to capture a whole deck. The page export renders a single page,
                    so it can't follow you across slides. The presentation toolbar stops auto-hiding while recording so
                    the Stop button is always reachable.
                </p>
                <p>
                    From a script you can also give it a fixed length, which stops and saves automatically:
                </p>
                <pre class="code-block"><code>{`Yappy.startRecording('mp4');       // runs until you Stop it
Yappy.startRecording('mp4', 15);   // auto-stops after 15 seconds
Yappy.stopRecording();             // stop + download now`}</code></pre>

                <h3>Page export from a script</h3>
                <pre class="code-block"><code>{`await Yappy.exportVideo(8, 'mp4');   // 8s MP4 of the ACTIVE page
await Yappy.exportVideo(8, 'webm');
await Yappy.exportGif(5, 24);        // 5s GIF at 24 fps`}</code></pre>

                <h3>Formats &amp; limits</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Format</th>
                            <th>Use it for</th>
                            <th>Limits</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>MP4</strong> (H.264)</td>
                            <td>Sharing anywhere — messaging apps, video editors, Windows/macOS players</td>
                            <td>Up to 120s; long side capped at 1920px</td>
                        </tr>
                        <tr>
                            <td><strong>WebM</strong> (VP9)</td>
                            <td>The web; smaller files at the same quality</td>
                            <td>Up to 120s; long side capped at 1920px</td>
                        </tr>
                        <tr>
                            <td><strong>Animated GIF</strong></td>
                            <td>Loops forever; drops into docs, chat and README files with no player</td>
                            <td>
                                Up to 30s; long side capped at 960px (GIFs get enormous beyond that); 256 colours.
                                12 fps from the dialog — pass your own to <code>Yappy.exportGif(seconds, fps)</code>
                                for smoother motion.
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p class="tip-box">
                    Recording a <strong>time-lapse</strong> of your drawing process is a separate feature —
                    see <em>Menu → Record Time-lapse</em> (<span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+
                    <span class="kbd">T</span>), not this export.
                </p>
            </section>

            {/* API Reference */}
            <section class="doc-section">
                <h2>API Reference</h2>
                <p>
                    Every method below lives on the global <code>window.Yappy</code> object, so you can
                    drive animations from the browser console or a script (e.g.
                    <code> Yappy.animateElement(id, &#123; x: 400 &#125;, &#123; duration: 800 &#125;)</code>).
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code>animateElement(id, target, config)</code></td>
                            <td>Animate element properties</td>
                        </tr>
                        <tr>
                            <td><code>animateElements(ids, target, config, stagger)</code></td>
                            <td>Animate multiple elements with stagger</td>
                        </tr>
                        <tr>
                            <td><code>animateElementKeyframes(id, prop, keyframes, config)</code></td>
                            <td>Keyframe animation</td>
                        </tr>
                        <tr>
                            <td><code>animateAlongPath(id, pathData, config)</code></td>
                            <td>Path animation</td>
                        </tr>
                        <tr>
                            <td><code>animateMorph(id, targetShape, config)</code></td>
                            <td>Shape morphing</td>
                        </tr>
                        <tr>
                            <td><code>playEntranceAnimation(id, options?)</code></td>
                            <td>Play the element's configured entrance animation</td>
                        </tr>
                        <tr>
                            <td><code>playExitAnimation(id, options?)</code></td>
                            <td>Play the element's configured exit animation</td>
                        </tr>
                        <tr>
                            <td><code>stopAllElementAnimations(id)</code></td>
                            <td>Stop all animations on element</td>
                        </tr>
                        <tr>
                            <td><code>createSpring(stiffness, damping, mass, velocity)</code></td>
                            <td>Create custom spring easing</td>
                        </tr>
                        <tr>
                            <td><code>typewriter(id, duration, config)</code></td>
                            <td>Letter-by-letter text reveal</td>
                        </tr>
                        <tr>
                            <td><code>wordByWord(id, duration, config)</code></td>
                            <td>Word-by-word text reveal</td>
                        </tr>
                        <tr>
                            <td><code>textScramble(id, duration, config)</code></td>
                            <td>Hacker decode text effect</td>
                        </tr>
                        <tr>
                            <td><code>textCountUp(id, start, end, duration, config)</code></td>
                            <td>Animated number counting</td>
                        </tr>
                        <tr>
                            <td><code>lineByLine(id, duration, config)</code></td>
                            <td>Line-by-line text reveal</td>
                        </tr>
                        <tr>
                            <td><code>charByChar(id, duration, stagger, config)</code></td>
                            <td>Per-character reveal with stagger</td>
                        </tr>
                        <tr>
                            <td><code>animateElementsStagger(ids, target, config, stagger)</code></td>
                            <td>Animate multiple elements with advanced stagger</td>
                        </tr>
                        <tr>
                            <td><code>animateFrom(id, fromValues, config)</code></td>
                            <td>Animate from specified values to current</td>
                        </tr>
                        <tr>
                            <td><code>animateFromTo(id, from, to, config)</code></td>
                            <td>Animate between two specified states</td>
                        </tr>
                        <tr>
                            <td><code>animateElementsFrom(ids, from, config, stagger)</code></td>
                            <td>Staggered "from" animation for multiple elements</td>
                        </tr>
                        <tr>
                            <td><code>random(min, max)</code></td>
                            <td>Generate random value in range</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Click-to-Advance (Interactive Presentations) */}
            <section class="doc-section">
                <h2>Click-to-Advance (Interactive Presentations)</h2>
                <p>
                    Build step-by-step interactive presentations where each click reveals the next visual.
                    Perfect for teaching CS concepts, explaining algorithms, or walking through diagrams.
                </p>

                <h3>Animation Triggers</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Trigger</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>On Load</strong></td>
                            <td>Plays automatically when the slide loads or presentation starts</td>
                        </tr>
                        <tr>
                            <td><strong>On Click</strong></td>
                            <td>Plays when the presenter clicks (or presses Space/Enter/Arrow). Each "On Click" animation creates a new step</td>
                        </tr>
                        <tr>
                            <td><strong>After Previous</strong></td>
                            <td>Plays automatically after the previous animation finishes. Chains onto the same step</td>
                        </tr>
                        <tr>
                            <td><strong>With Previous</strong></td>
                            <td>Plays simultaneously with the previous animation. Runs in parallel within the same step</td>
                        </tr>
                    </tbody>
                </table>

                <h3>How to Build an Interactive Diagram</h3>
                <ol>
                    <li><strong>Create your shapes</strong> - Draw the elements of your diagram (works on both slides and infinite canvas)</li>
                    <li><strong>Add animations</strong> - Select each element, open Animation Panel, and add a preset (e.g., fadeIn, slideInLeft)</li>
                    <li><strong>Set triggers</strong> - For step-by-step reveals:
                        <ul>
                            <li>Set the first animation to <strong>On Click</strong> (Step 1)</li>
                            <li>Chain follow-up effects with <strong>After Previous</strong> (same step, sequential)</li>
                            <li>Run parallel effects with <strong>With Previous</strong> (same step, simultaneous)</li>
                            <li>Set the next reveal to <strong>On Click</strong> (Step 2), and so on</li>
                        </ul>
                    </li>
                    <li><strong>Present</strong> - Enter presentation mode (F5) and click/press Space to advance through each step</li>
                </ol>

                <h3>Start Hidden</h3>
                <p>
                    Each animation has a <strong>"Start hidden in presentation"</strong> checkbox.
                    When enabled, the element is invisible when the presentation starts and only
                    appears when its animation step fires. This is essential for step-by-step reveals.
                </p>
                <p>
                    <strong>Smart default:</strong> On Click animations default to start hidden (checked),
                    while On Load animations default to visible (unchecked). You can override this per animation.
                </p>

                <h3>Step Numbers in Animation Panel</h3>
                <p>
                    Each animation shows a numbered badge indicating which click-step it belongs to.
                    Blue badges mark <strong>On Click</strong> triggers (step boundaries), while dimmed badges show
                    chained animations (After Previous / With Previous) that belong to the same step.
                    Animations with <strong>On Load</strong> trigger show "auto" since they play immediately.
                </p>

                <h3>Infinite Canvas Presentations</h3>
                <p>
                    Click-to-advance works on both slides and infinite canvas mode. On infinite canvas:
                </p>
                <ul>
                    <li><strong>Click</strong> empty space to advance to the next animation step</li>
                    <li><strong>Drag</strong> to pan around the canvas</li>
                    <li>The presentation HUD shows <strong>Step X / Y</strong> progress</li>
                    <li>Use <strong>Space</strong>, <strong>Enter</strong>, or <strong>Arrow Right</strong> to advance</li>
                    <li>Use <strong>Arrow Left</strong> or <strong>Backspace</strong> to go back</li>
                </ul>

                <h3>Example: Teaching a Stack Data Structure</h3>
                <div class="code-block">
{`Step 1 (On Click):  Show empty stack frame       → fadeIn
Step 2 (On Click):  Push value "42"              → slideInDown
  (After Previous): Arrow points to top           → fadeIn
Step 3 (On Click):  Push value "17"              → slideInDown
  (With Previous):  Previous arrow moves down     → property animation (y)
  (After Previous): New arrow points to top       → fadeIn
Step 4 (On Click):  Pop value "17"               → slideOutUp
  (After Previous): Arrow updates                 → fadeIn`}
                </div>

                <div class="tip-box">
                    <h5>Tip: Presentation Advancement Order</h5>
                    <p>
                        When you click during a presentation, YappyDraw checks in this order:
                        <br />1. <strong>Display States</strong> - If there are state transitions, advance to the next state
                        <br />2. <strong>Build Animations</strong> - If there are pending On Click animations, play the next one
                        <br />3. <strong>Next Slide</strong> - If all animations are done, move to the next slide
                    </p>
                </div>
            </section>

            {/* 3D Box Animations */}
            <section class="doc-section">
                <h2>3D Box Animations</h2>
                <p>Special animation presets for 3D shapes (openBox, solidBlock, etc.):</p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Preset</th>
                            <th>Applies To</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>boxLidOpen</strong></td>
                            <td>openBox</td>
                            <td>Opens the lid with overshoot and settle physics</td>
                        </tr>
                        <tr>
                            <td><strong>boxLidClose</strong></td>
                            <td>openBox</td>
                            <td>Smoothly closes the lid</td>
                        </tr>
                        <tr>
                            <td><strong>boxLidOpenClose</strong></td>
                            <td>openBox</td>
                            <td>Opens then closes the lid in a cycle. Supports looping for continuous animation</td>
                        </tr>
                        <tr>
                            <td><strong>boxRotateReveal</strong></td>
                            <td>All 3D shapes</td>
                            <td>Rotates the view angle to reveal the 3D form</td>
                        </tr>
                        <tr>
                            <td><strong>boxExplode</strong></td>
                            <td>All 3D shapes</td>
                            <td>Expands the shape outward with increased depth</td>
                        </tr>
                        <tr>
                            <td><strong>boxCollapse</strong></td>
                            <td>All 3D shapes</td>
                            <td>Shrinks the shape inward (reverse of explode)</td>
                        </tr>
                        <tr>
                            <td><strong>depthPulse</strong></td>
                            <td>All 3D shapes</td>
                            <td>Pulses the depth for a breathing effect</td>
                        </tr>
                        <tr>
                            <td><strong>isometricRotate</strong></td>
                            <td>isometricCube</td>
                            <td>Rotates the isometric cube faces</td>
                        </tr>
                    </tbody>
                </table>

                <h3>3D View Angle Control</h3>
                <p>
                    Use <strong>Alt + Drag</strong> on any 3D shape to interactively adjust its orientation:
                </p>
                <ul>
                    <li><strong>Horizontal drag</strong> - Changes the view angle (rotation direction)</li>
                    <li><strong>Vertical drag</strong> - Changes the depth (drag down for more depth, up for less)</li>
                    <li>Hold <strong>Shift</strong> while dragging to snap to 5-degree / 5-unit increments</li>
                </ul>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Space</span>
                        </div>
                        <span class="shortcut-desc">Play/Pause animation</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Esc</span>
                        </div>
                        <span class="shortcut-desc">Stop animation</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Alt</span> + <span class="kbd">S</span>
                        </div>
                        <span class="shortcut-desc">Toggle Display States panel</span>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AnimationDoc;
