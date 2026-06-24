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
