/**
 * Animated Stick Figures — help doc + step-by-step tutorial.
 * Procedural skeletal figures (walk/wave/talk/point/jump/idle) that animate on the
 * canvas, with controls to switch motion, pause, flip, and bake to editable paths.
 */

import type { Component } from 'solid-js';

const StickAnimationDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Animated Stick Figures</h1>
                <p class="doc-intro">
                    Drop a stick figure that actually <strong>moves</strong> — a walk cycle, a wave, a talking
                    gesture — and use it to tell a story on the canvas. Each animated figure is driven by a little
                    skeleton (real joints, bending knees and elbows) with <strong>foot planting</strong>, so it reads
                    as motion, not sliding. It plays live on the canvas and can be <strong>baked</strong> to an
                    editable vector figure at any moment.
                </p>
            </header>

            {/* ─── WHAT ─────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>The motions</h2>
                <p>Six built-in motion clips, each loops smoothly:</p>
                <ul>
                    <li><strong>Idle</strong> — a subtle breathing stand.</li>
                    <li><strong>Walk</strong> — a foot-planted walk cycle (no skating).</li>
                    <li><strong>Wave</strong> — one arm raised, hand waving.</li>
                    <li><strong>Talk</strong> — hands gesturing near the chest.</li>
                    <li><strong>Point</strong> — an arm extended in the facing direction.</li>
                    <li><strong>Jump</strong> — crouch, launch, tuck, land.</li>
                </ul>
            </section>

            {/* ─── TUTORIAL ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Tutorial: create an animation, step by step</h2>
                <ol class="doc-steps">
                    <li>
                        <strong>Open the Stick Figures panel.</strong> Click the walking-person button in the toolbar,
                        or Menu → <strong>Stick Figures</strong>.
                    </li>
                    <li>
                        <strong>Switch to the Animated tab.</strong> In the chip row, click <strong>🎞 Animated</strong>.
                        You'll see the six motions as preview cells.
                    </li>
                    <li>
                        <strong>Add a motion.</strong> Click <strong>Walk</strong> (or any motion). A figure appears on
                        the page and <em>immediately starts moving</em> — it loops on the canvas.
                    </li>
                    <li>
                        <strong>Place &amp; size it.</strong> Drag the figure to position it; drag a corner handle to
                        scale it up or down. The motion keeps playing at any size.
                    </li>
                    <li>
                        <strong>Use the figure controls.</strong> With the figure selected, the panel shows an
                        <strong> Animated figure</strong> section:
                        <ul>
                            <li><strong>Clip chips</strong> — switch the motion (Walk → Wave → Talk…) instantly.</li>
                            <li><strong>Pause / Play</strong> — freeze or resume just this figure.</li>
                            <li><strong>Flip</strong> — face it left or right (so a walker can head either way).</li>
                            <li><strong>Bake</strong> — see step 8.</li>
                        </ul>
                    </li>
                    <li>
                        <strong>Recolour it.</strong> Change the <strong>stroke colour</strong> in the Properties panel
                        to recolour the whole figure. Switch <strong>render style</strong> to <em>Sketch</em> for a
                        hand-drawn look — it still animates.
                    </li>
                    <li>
                        <strong>Build a little scene.</strong> Add a second figure and <strong>Flip</strong> it so the
                        two face each other; give one <em>Talk</em> and the other <em>Idle</em>. Mix in static figures,
                        props (a laptop, a speech bubble) and any other canvas elements — it's one shared canvas.
                    </li>
                    <li>
                        <strong>Bake a pose when you need a still.</strong> Click <strong>Bake</strong> to freeze the
                        current frame into an ordinary editable figure (grouped bezier paths). Ungroup it to tweak a
                        limb, or drop it into a diagram. The original animation is replaced by the baked frame.
                    </li>
                </ol>
                <p class="tip-box">
                    <strong>Pausing everything:</strong> animated figures loop continuously. Pause a single figure with
                    its <em>Pause</em> button, or use the canvas play/pause to freeze the whole scene's clock.
                </p>
            </section>

            {/* ─── WALK A ROUTE ─────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Make a figure walk a route (path-follow)</h2>
                <p>
                    The most powerful storytelling move: have a figure <strong>walk along a path you draw</strong>. It
                    travels the route at a steady pace with its <strong>feet planted</strong> (no sliding) and
                    automatically <strong>faces the direction of travel</strong>.
                </p>
                <ol class="doc-steps">
                    <li><strong>Draw a path</strong> — use the Line, Pen/Curve, or Pencil tool to draw the route the
                        figure should follow (a straight line, an arc, a wavy stroll — anything).</li>
                    <li><strong>Add an animated figure</strong> (Animated tab → any motion) near the path.</li>
                    <li><strong>Select both</strong> — click the figure, then shift-click the path (so the figure
                        <em> and</em> the path are selected together).</li>
                    <li><strong>Click “Walk this path”</strong> in the Animated figure controls. The figure snaps onto
                        the path and walks it end to end, looping, facing the way it's going.</li>
                    <li><strong>Adjust</strong> — reshape the path and the figure re-routes; use <strong>Stop following
                        path</strong> to release it. (Speed follows the path length; a longer path takes longer.)</li>
                </ol>
                <p class="tip-box">
                    Two figures + two paths crossing = a little scene. Add speech bubbles and props to set the stage.
                    API: <code>attachFigureToPath(figureId, pathId, {'{ dur }'})</code>, <code>detachFigurePath(id)</code>.
                </p>
            </section>

            {/* ─── API ──────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Automate it (API)</h2>
                <pre><code>{`const Y = window.Yappy;
Y.listStickFigureClips();                       // [{id:'walk',name:'Walk'}, …]
const a = Y.insertAnimatedFigure('walk', { x: 200, y: 200, width: 160, facing: 1 });
const b = Y.insertAnimatedFigure('talk', { x: 520, y: 200, facing: -1 });
Y.setAnimatedFigureClip('wave', [a]);           // switch clip
Y.flipAnimatedFigure([b]);                       // face the other way
Y.setAnimatedFigurePlaying(false, [a]);          // pause just this one
Y.bakeAnimatedFigure(a);                          // freeze current frame → editable paths`}</code></pre>
                <p class="tip-box">
                    API: <code>listStickFigureClips()</code>, <code>insertAnimatedFigure(clip, opts?)</code>,
                    <code> setAnimatedFigureClip(clip, ids?)</code>, <code>setAnimatedFigurePlaying(playing?, ids?)</code>,
                    <code> flipAnimatedFigure(ids?)</code>, <code>bakeAnimatedFigure(id?)</code>.
                </p>
            </section>

            {/* ─── NOTES ────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Good to know</h2>
                <ul>
                    <li>An animated figure is a single object — move, scale, rotate and recolour it like any shape.</li>
                    <li>It renders procedurally from a skeleton; to hand-edit the artwork, <strong>Bake</strong> it to
                        paths first.</li>
                    <li>A richer <em>storytelling director</em> (timeline, walk-along-a-path, and animated export to
                        video) is on the roadmap; today you compose on the canvas and can bake stills.</li>
                </ul>
            </section>
        </div>
    );
};

export default StickAnimationDoc;
