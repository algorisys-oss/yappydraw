/**
 * Animated Stick Figures — help doc + step-by-step tutorial.
 * Procedural skeletal figures (10 clips: idle/walk/run/wave/talk/point/clap/jump/
 * dance/cheer) that animate on the canvas, with controls to switch motion, pause,
 * flip, and bake to editable paths.
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
                <p>Ten built-in motion clips, each loops smoothly:</p>
                <ul>
                    <li><strong>Idle</strong> — a subtle breathing stand.</li>
                    <li><strong>Walk</strong> / <strong>Run</strong> — foot-planted cycles (no skating); Run leans in
                        and pumps its arms.</li>
                    <li><strong>Wave</strong> — one arm raised, hand waving.</li>
                    <li><strong>Talk</strong> — hands gesturing near the chest.</li>
                    <li><strong>Point</strong> — an arm extended in the facing direction.</li>
                    <li><strong>Clap</strong> — hands meeting in front.</li>
                    <li><strong>Jump</strong> — crouch, launch, tuck, land.</li>
                    <li><strong>Dance</strong> — hip sway with alternating arms.</li>
                    <li><strong>Cheer</strong> — both arms up, pumping.</li>
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
                        You'll see all ten motions as preview cells.
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
                        <br />
                        To <strong>reshape a part</strong>: ungroup the figure and select a single part — its path
                        node handles (small squares) appear and become draggable. Or use the <strong>Reshape</strong>
                        tool to bend whichever part you grab without ungrouping. (Node handles only show for a
                        single selected path, so nothing draggable appears while the whole group is selected.)
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
                    API: <code>attachFigureToPath(figureId, pathId, {'{ dur, loop, autoFace }'})</code>, <code>detachFigurePath(id)</code>.
                </p>
            </section>

            {/* ─── SEQUENCES ────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Chain actions over time (sequences)</h2>
                <p>
                    Give a figure a little script: with it selected, use the <strong>Action sequence</strong> editor in
                    the panel to add <strong>timed steps</strong> — each a motion played for a number of seconds. The
                    figure runs the steps in order and loops.
                </p>
                <ol class="doc-steps">
                    <li><strong>+ Add step</strong> to append a motion; pick the clip from the dropdown and set its
                        duration in seconds.</li>
                    <li>Add more — e.g. <em>Walk 3s → Wave 2s → Talk 2s</em> — for a figure that walks up, waves, then
                        chats, forever.</li>
                    <li>Remove a step with <strong>×</strong>, or <strong>Clear</strong> to go back to a single clip.</li>
                </ol>
                <p class="tip-box">
                    Transitions between steps are <strong>cross-faded</strong> automatically, so the figure eases from
                    one motion into the next instead of snapping. A sequence plays in place; combine figures with
                    different sequences (and path-follow) to stage a whole little scene.
                    API: <code>setFigureSequence([{'{ clip:\'walk\', dur:3 }'}, …], id?)</code>.
                </p>
            </section>

            {/* ─── API ──────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Automate it (API)</h2>
                <pre><code>{`const Y = window.Yappy;
Y.listStickFigureClips();                       // [{id:'walk',name:'Walk'}, …]
const a = Y.insertAnimatedFigure('walk', { x: 200, y: 200, width: 160, facing: 1, speed: 1 });
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

            {/* ─── TIMELINE ─────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Direct the whole scene (Scene Timeline)</h2>
                <p>
                    Click <strong>Scene timeline</strong> in the panel to open a timeline across the bottom of the
                    screen. Every animated figure becomes a <strong>track</strong>, with its action sequence shown as
                    coloured blocks along a time ruler.
                </p>
                <ul>
                    <li><strong>Play / Pause / Restart</strong> and a <strong>Loop</strong> toggle drive all figures
                        together from one clock.</li>
                    <li><strong>Scrub</strong> — drag the red playhead (or click the ruler) to jump to any moment; every
                        figure poses at that instant. Great for lining up a scene or grabbing a frame to bake.</li>
                    <li>Click a track's <strong>label</strong> to select that figure on the canvas.</li>
                    <li><strong>Reorder a step</strong> — drag a block left/right to change the order of actions.</li>
                    <li><strong>Resize a step</strong> — drag the right edge of a block to change how long that motion
                        runs (snaps to ½&nbsp;second).</li>
                    <li><strong>Sync to slides</strong> — on a slides/pages document, toggle the monitor-play button
                        (“Restart the scene when the slide/page changes”) so each slide plays its animation fresh.</li>
                </ul>
                <p class="tip-box">
                    The scene length is set automatically by the longest figure. API:
                    <code> toggleSceneTimeline(true)</code>, <code>playScene()</code>, <code>seekScene(seconds)</code>.
                </p>
            </section>

            {/* ─── EXPORT ───────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Export your animation as a video</h2>
                <p>
                    On a page document (a design/post or slides), <strong>Export → MP4 Video</strong> renders
                    <em> the page itself</em> — exact page bounds at the page's own resolution, animations playing,
                    no workspace around it — for the duration you choose, then downloads an H.264 <code>.mp4</code>
                    (or <code>.webm</code>). Your zoom/pan doesn't matter; the export is framed to the page.
                    API: <code>exportVideo(seconds?, 'mp4' | 'webm')</code>.
                </p>
                <p>
                    Prefer a GIF (auto-plays anywhere, loops forever)? <strong>Export → Animated GIF</strong> does
                    the same page-framed render as a looping <code>.gif</code> (12&nbsp;fps, long side capped at
                    960px — GIFs get huge beyond that). API: <code>exportGif(seconds?, fps?)</code>.
                </p>
                <p>
                    Alternatively, <strong>record the live canvas</strong>: with an animated figure selected, click
                    <strong> Record video</strong> in the panel — it captures whatever is on screen (all figures,
                    sequences and path-follow, exactly as they play) and <strong>Stop &amp; save recording</strong>
                    downloads the file. (A red recording indicator shows while it runs.)
                </p>
                <p class="tip-box">
                    Live recording captures whatever is on screen, so pan/zoom to frame your scene first. API:
                    <code> recordAnimation(seconds?)</code> / <code>stopRecording()</code>. On an infinite-canvas
                    doc, Export → Video also uses live capture (there are no page bounds to frame to).
                </p>
                <p>
                    Prefer a shareable webpage? <strong>Export → HTML</strong> writes a self-contained
                    <code>.html</code> file that <strong>plays the animation</strong> when opened in any browser — the
                    figures walk, wave and follow their paths just like on the canvas.
                    (API: <code>exportHtml(name?)</code>.)
                </p>
            </section>

            {/* ─── NOTES ────────────────────────────────────────────────── */}
            <section class="doc-section">
                <h2>Good to know</h2>
                <ul>
                    <li>An animated figure is a single object — move, scale, rotate and recolour it like any shape.</li>
                    <li>It renders procedurally from a skeleton; to hand-edit the artwork, <strong>Bake</strong> it to
                        paths first.</li>
                    <li>Share a moving animation as a <strong>video</strong> (record) or a self-contained
                        <strong>HTML</strong> page (Export → HTML) that plays it; bake a frame for a still. Image/PDF
                        export captures a single frame.</li>
                </ul>
            </section>
        </div>
    );
};

export default StickAnimationDoc;
