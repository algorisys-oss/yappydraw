/**
 * Animation Studio — help doc for the Animate-class frame-timeline mode:
 * the Stage, layers-as-rows, keyframes/cels (F5/F6/F7), motion tweens,
 * onion skinning, movie-clip symbols and GIF/video export.
 */

import type { Component } from 'solid-js';

const AnimateDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1>Animation Studio — frame-by-frame &amp; tweened animation</h1>
                <p class="doc-intro">
                    A dedicated <strong>Animation</strong> document type in the spirit of Adobe Animate /
                    Flash: a fixed <strong>Stage</strong>, a frame-based <strong>timeline</strong> at the
                    bottom (one row per layer), <strong>keyframes</strong> that own what's on the stage,
                    <strong> motion tweens</strong> between them, <strong>onion skinning</strong>, and
                    <strong> movie-clip symbols</strong> with their own nested timelines. Export the result
                    as a looping GIF or MP4/WebM.
                </p>
            </header>

            <section class="doc-section">
                <h2>Start an animation</h2>
                <p>
                    <strong>Menu → New → New Animation…</strong> Pick a stage size, a frame rate
                    (12 / 24 / 30&nbsp;fps) and a length. You get a single fixed Stage page and the
                    timeline panel. Draw anywhere on the stage — whatever you create lands on the
                    <em> current frame's keyframe</em> of the active layer (the "cel" model: each keyframe
                    owns its own content).
                </p>
                <p>
                    Prefer to start from something finished? <strong>Menu → Templates → Animations</strong>
                    has ready-made samples — <em>Bouncing Ball</em> (squash &amp; stretch tweens),
                    <em> Rocket Launch</em> (a looping movie-clip flame + frame-by-frame star twinkle) and
                    <em> YappyDraw Intro</em> (a 1080×1080 social-media card). Load one, press Enter to
                    play, pull it apart, or Export it straight to GIF.
                    Scriptable too: <code>Yappy.anim.loadExample('bouncing-ball')</code>.
                </p>
            </section>

            <section class="doc-section">
                <h2>The timeline</h2>
                <ul>
                    <li><strong>Rows are layers.</strong> Rename (double-click), hide, lock, add and delete
                        layers on the left; each row's frames run to the right. The top row is the top layer.</li>
                    <li><strong>Filled dot</strong> = keyframe with content · <strong>hollow dot</strong> =
                        blank keyframe · shaded bar = the span the keyframe holds for · <strong>arrow</strong> =
                        a motion tween · red column = the playhead.</li>
                    <li><strong>Click</strong> a cell to move the playhead + select that frame · drag the
                        ruler to <strong>scrub</strong> · drag a keyframe dot to move it · right-click for
                        every frame command.</li>
                    <li><strong>F5</strong> Insert Frame (lengthen the span) · <strong>F6</strong> Insert
                        Keyframe (duplicates the previous cel, so you can nudge it) · <strong>F7</strong>
                        Insert Blank Keyframe · <strong>Shift+F5</strong> Remove Frame ·
                        <strong> Shift+F6</strong> Clear Keyframe.</li>
                    <li><strong>Enter</strong> play/pause · <strong>,</strong> / <strong>.</strong> step one
                        frame · <strong>Home</strong> / <strong>End</strong> jump to start/end. Frame rate and
                        length are editable in the timeline header.</li>
                    <li>The panel grows with your layers up to a height cap, then scrolls — <strong>drag its
                        top edge</strong> to resize (remembered between sessions). Frames scroll horizontally
                        and the playhead auto-scrolls into view.</li>
                </ul>
                <p>
                    Frame-by-frame animation is just: draw on frame 1, <strong>F6</strong> (or F7 for a
                    fresh empty cel), adjust, repeat — with <strong>Onion</strong> turned on to see ghosts
                    of neighboring frames (red = before, green = after; the counts are adjustable).
                </p>
            </section>

            <section class="doc-section">
                <h2>Your first animation, step by step (a bouncing ball)</h2>
                <p>
                    This is the exact recipe behind the <em>Bouncing Ball</em> template — five minutes
                    from a blank stage to a looping GIF:
                </p>
                <ol>
                    <li><strong>Menu → New → New Animation…</strong> — pick <em>HD 16:9</em>, 24&nbsp;fps,
                        1&nbsp;second (24 frames). You're on frame 1 of the Layer 1 row.</li>
                    <li><strong>Draw the ball</strong> near the top of the stage (circle tool, give it a
                        solid fill). It automatically joins frame 1's keyframe — the dot on the timeline
                        turns solid.</li>
                    <li><strong>Click frame 11</strong> in the timeline, press <strong>F6</strong>. That
                        duplicates the ball onto a new keyframe. <strong>Drag the copy to the floor.</strong></li>
                    <li><strong>Click frame 13</strong>, <strong>F6</strong> again — squash the copy
                        (drag the side handle wider, the top handle shorter). That 2-frame squash is what
                        sells the impact.</li>
                    <li><strong>Frame 15, F6</strong> — restore the round size (or paste the frame-11 pose).
                        <strong>Frame 24, F6</strong> — drag the ball back to the top.</li>
                    <li><strong>Add the tweens:</strong> right-click the first span →
                        <em>Create Motion Tween</em>; with that frame selected pick
                        <em>easeInQuad</em> in the header (falls slow-then-fast — gravity). Tween the
                        remaining spans too: linear into/out of the squash, <em>easeOutQuad</em> going up.</li>
                    <li><strong>Enter</strong> to play. Toggle <strong>Loop</strong> and it cycles —
                        because the last pose matches the first, the loop is seamless.</li>
                    <li><strong>Export</strong> (header button) — it defaults to a GIF of exactly one pass.</li>
                </ol>
                <p>
                    Frame-by-frame instead of tweens? Same flow, just skip step 6 and make more keyframes
                    (F6, nudge, repeat) — that's how the Rocket template's stars twinkle.
                </p>
            </section>

            <section class="doc-section">
                <h2>Onion skinning — what it is and how to use it</h2>
                <p>
                    Onion skinning shows <strong>ghost images of nearby frames</strong> under the frame
                    you're editing — named after the translucent onion-paper sheets classical animators
                    flipped between. <span style={{ color: '#dc2626' }}>Red ghosts</span> are frames
                    <em> before</em> the playhead, <span style={{ color: '#16a34a' }}>green ghosts</span> are
                    frames <em>after</em>; the farther away, the fainter.
                </p>
                <ul>
                    <li>Toggle it with the <strong>Onion</strong> button in the timeline header. The two
                        number fields beside it set how many frames to ghost before / after (try 2 and 2).</li>
                    <li>Use it while <strong>drawing the next pose</strong>: F6 or F7 a new keyframe, and
                        draw relative to the red ghost of the previous pose — spacing between ghosts IS your
                        motion speed. Even spacing = constant speed; tightening spacing = ease-in.</li>
                    <li>Ghosts appear only while <strong>paused</strong> (playback hides them) and they're
                        never exported.</li>
                    <li>They work in both sketch and architectural render styles, and ghost tweened
                        positions too — so you can check a tween's arc frame by frame.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Editing animated objects (changing properties)</h2>
                <p>
                    Everything on the stage is a normal Yappy object — <strong>scrub to the keyframe that
                    owns it, select it, and edit like always</strong> (drag/resize/rotate on canvas, or use
                    the Properties panel for fill, stroke, opacity, text…).
                </p>
                <ul>
                    <li><strong>Keyframes are independent.</strong> Editing the ball on frame 11 doesn't
                        touch frame 1 — each keyframe owns its own copies (that's the point: it's how poses
                        differ). To restyle the object <em>everywhere</em>, either edit each keyframe's copy,
                        or convert it to a <strong>symbol</strong> first — editing a symbol updates every
                        instance on every frame.</li>
                    <li><strong>Tweens read the keyframe copies.</strong> A motion tween interpolates
                        whatever the two endpoint copies say — so "make the ball end up bigger" is just:
                        scrub to the end keyframe, select, resize. The in-between frames update instantly.
                        Tweenable properties: position, size, rotation, opacity, fill and stroke color.</li>
                    <li><strong>Mid-tween frames aren't editable</strong> — they're computed. To pin a pose
                        mid-tween, press <strong>F6</strong> there: the computed pose isn't captured, you get
                        a copy of the span's start pose to adjust (the span splits and both halves keep
                        tweening).</li>
                    <li><strong>Frame properties</strong> (tween on/off, easing, label) live in the timeline
                        header when a frame is selected; <strong>clip instance properties</strong> (loop /
                        play once / single frame, first frame) appear there when a movie-clip instance is
                        selected.</li>
                    <li><strong>Layer basics apply:</strong> hide/lock a row while working on another; a
                        hidden layer still exports hidden, so re-show it before exporting.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Motion tweens</h2>
                <ol>
                    <li>Draw something on a keyframe (one object per layer works best — the tip toast will
                        remind you).</li>
                    <li><strong>F6</strong> at a later frame, then move / resize / rotate / recolor the copy.</li>
                    <li>Right-click the span → <strong>Create Motion Tween</strong> (or tick
                        <strong> Tween</strong> in the header when the frame is selected). Pick an easing
                        from the dropdown.</li>
                </ol>
                <p>
                    Position, size, angle, opacity and fill/stroke colors interpolate between the two
                    keyframes. F6 copies carry a shared identity (<code>contentId</code>), which is how the
                    tween knows which object continues into the next keyframe; unmatched objects simply hold.
                </p>
                <h3>Ease curves (custom bezier)</h3>
                <p>
                    Beyond the named easings, the <strong>curve</strong> button (timeline header, when a
                    tweened frame is selected) opens a bezier editor: presets (In, Out, In-Out,
                    <em> Overshoot</em>, <em>Anticipate</em>) plus two draggable handles for any curve you
                    like — drag a handle above 1 for overshoot, below 0 for wind-up. A custom curve
                    overrides the named easing; <strong>Clear</strong> falls back to it. Scriptable:
                    <code> Yappy.anim.setFrameEaseCurve(&#123; ox, oy, ix, iy &#125;)</code>.
                </p>
                <h3>Motion guides (follow a path)</h3>
                <p>
                    Make a tween ride a curve instead of a straight line: draw a <strong>line, polyline,
                    pen path or freehand stroke</strong> as the route, select it, then select the tweened
                    keyframe and click <strong>guide: use selection</strong> in the header. Across the span
                    the object's <em>center</em> travels the path from its start to its end (easing applies
                    along the path); tick <strong>orient</strong> to rotate it into the direction of travel —
                    a plane banking through a loop. <strong>guide ✕</strong> detaches. Tip: park the guide
                    path on its own hidden layer — hidden layers don't render or export, but guides still
                    steer. API: <code>Yappy.anim.setFrameGuide(pathId, orient)</code>.
                </p>
                <h3>Shape tweens (morphing)</h3>
                <p>
                    A <strong>shape tween</strong> does everything a motion tween does <em>and morphs the
                    outline</em> — a square flows into a circle, a star into a heart. Same recipe: F6 a later
                    keyframe, change the copy's <em>shape</em> (e.g. select it and use Convert to Shape, or
                    delete-and-draw a different shape then give it the same spot), then right-click the span →
                    <strong> Create Shape Tween</strong> (green arrow in the grid; the header select also
                    switches between motion/shape). The outline is resampled and twist-aligned so the morph
                    doesn't spin. Notes: mid-morph frames render with clean outlines (both render styles);
                    strokes/lines, text and clip instances fall back to plain motion tweening.
                </p>
            </section>

            <section class="doc-section">
                <h2>Pose keyframes — animate stick figures (bones &amp; IK)</h2>
                <p>
                    Drop an <strong>animated stick figure</strong> on the stage (Stick Figures panel) and
                    it becomes poseable per keyframe: select it and the timeline header shows a
                    <strong> Pose</strong> section — a motion-clip picker (walk, run, wave, jump…), a
                    <strong> cycle-phase slider</strong> (the exact instant of the clip this cel holds) and a
                    <strong> flip</strong> button.
                </p>
                <ul>
                    <li><strong>Same clip on both keyframes</strong> → the tween glides the phase through
                        the cycle: legs stride, feet plant via IK, arms swing — a walk unfolds exactly
                        between your two cels, frame-exact on scrub, playback and export.</li>
                    <li><strong>Different clips</strong> → the tween <em>blends the skeleton</em> from one
                        pose to the other (idle melting into a wave), joint by joint.</li>
                    <li>Setting a pose pins the figure (<em>playing: false</em>) so cels hold still poses;
                        position/size tween as usual, so a figure can walk-cycle <em>while</em> a motion
                        guide carries it along a path.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Movie clips (symbols with their own timeline)</h2>
                <ul>
                    <li>Select objects → <strong>F8</strong> (or Symbols panel → <strong>Movie clip</strong>)
                        to convert them into a movie-clip symbol; the selection is replaced by an instance.
                        (<strong>Shift+F8</strong> makes a static graphic symbol instead.)</li>
                    <li><strong>Double-click an instance</strong> to edit the clip in place — the timeline
                        panel switches to the <em>clip's own</em> timeline. Add keyframes/tweens exactly like
                        the main timeline, then use the banner to finish; every instance updates.</li>
                    <li>A clip plays <em>independently</em> of the main timeline: one keyframe on the main
                        timeline can hold a looping clip. With an instance selected, the timeline header shows
                        <strong> loop / play once / single frame</strong> and a first-frame offset — so several
                        instances of one clip can run out of phase.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Scenes — multiple stages in one document</h2>
                <p>
                    The <strong>scene picker</strong> at the far left of the timeline header splits a film
                    into acts: each scene is its own stage with its <em>own</em> timeline, layers'
                    frames, tweens and sounds. <strong>+</strong> adds a scene (blank stage, same
                    fps/length), the dropdown switches (the camera glides to that stage), and the trash
                    deletes a scene together with its contents. Only the active scene's artwork is
                    visible and editable; everything round-trips through save/load. API:
                    <code> Yappy.anim.addScene() / setScene(i) / deleteScene(i) / sceneCount()</code>.
                </p>
            </section>

            <section class="doc-section">
                <h2>Sound — the audio row</h2>
                <p>
                    Between the ruler and the layers sits the <strong>♪ Audio</strong> row. Right-click it
                    (or click the <strong>+</strong> next to "♪ Audio" in the layer column) to
                    <strong> Add Sound</strong> — nine built-in synth effects (coin, jump, hit, powerup,
                    explosion, blip, win, lose, click; they preview as you pick) — or
                    <strong> Import Audio File…</strong> for your own music/voice (up to 4&nbsp;MB; it's
                    stored inside the document, so the animation stays self-contained).
                </p>
                <ul>
                    <li>Each sound starts at its frame — <strong>drag the amber block</strong> to move it;
                        right-click a block to remove it.</li>
                    <li>Sounds play during <strong>playback</strong> (Enter) at the right frames, and loop
                        with the loop toggle. Scrubbing stays silent.</li>
                    <li><strong>MP4/WebM exports include the audio</strong>, mixed at the exact frame
                        offsets. GIFs are silent by nature.</li>
                    <li>API: <code>Yappy.anim.addSound('coin', frame)</code>, <code>sounds()</code>,
                        <code>moveSound(id, frame)</code>, <code>removeSound(id)</code>.</li>
                </ul>
            </section>

            <section class="doc-section">
                <h2>Export</h2>
                <p>
                    <strong>Export</strong> (timeline header, or Ctrl+Shift+E) defaults to a GIF of exactly
                    one timeline pass at your frame rate; MP4/WebM use the same frame-exact renderer. The
                    <code>.yappy</code> file stores the timeline, so a saved animation reopens ready to play.
                </p>
            </section>

            <section class="doc-section">
                <h2>API</h2>
                <p>
                    Everything is scriptable via <code>window.Yappy.anim</code>:
                </p>
                <pre><code>{`Yappy.anim.newDocument({ width: 1280, height: 720, fps: 24, frames: 48 });
const id = Yappy.createRectangle(100, 100, 80, 80, { backgroundColor: '#f00' });
Yappy.anim.gotoFrame(24);
const [copy] = Yappy.anim.insertKeyframe();     // F6: duplicate the cel
Yappy.updateElement(copy, { x: 500 });
Yappy.anim.setTween('motion', undefined, 0);    // tween the span leaving frame 1
Yappy.anim.setFrameEasing('easeInOutQuad', undefined, 0);
Yappy.anim.play();                              // …pause(), stop(), gotoFrame(f)
Yappy.createSymbol('Ball', [id], 'movieclip');  // F8`}</code></pre>
            </section>

            <section class="doc-section">
                <h2>Notes &amp; limits</h2>
                <ul>
                    <li>Only the current frame's content is selectable/visible on the stage — scrub to reach
                        the rest. Deleting a layer deletes its frames' content (Animate semantics).</li>
                    <li>Shape (form-morphing) tweens, motion guides, bones/IK, audio tracks, scenes and an
                        interactive HTML player are on the roadmap; today's tweens cover transform, opacity
                        and color.</li>
                    <li>The seconds-based Keyframes dope sheet and Scene Timeline are hidden in animation
                        documents — the frame timeline is the single time driver here.</li>
                </ul>
            </section>
        </div>
    );
};

export default AnimateDoc;
