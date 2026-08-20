---
id: animate
name: Animation Studio
icon: "🎬"
category: Features
description: "Animate-class frame timeline: Stage + layers, keyframes/cels (F5/F6/F7), motion tweens with easing, onion skinning, movie-clip symbols with nested timelines, GIF/MP4 export"
keywords: animation animate flash frame frames timeline keyframe keyframes cel cels blank keyframe span insert frame F5 F6 F7 F8 shift tween motion tween easing ease onion skin skinning ghost playhead scrub fps frame rate loop play pause stop stage movie clip movieclip symbol nested timeline instance loop once single frame first frame frame-by-frame stop motion export gif mp4 webm video convert to symbol label frame label tutorial step by step how to bouncing ball rocket launch intro template templates sample samples squash stretch edit animated object change properties resize timeline panel
---

# Animation Studio — frame-by-frame & tweened animation

A dedicated **Animation** document type in the spirit of Adobe Animate / Flash: a fixed **Stage**, a frame-based **timeline** at the bottom (one row per layer), **keyframes** that own what's on the stage, **motion tweens** between them, **onion skinning**, and **movie-clip symbols** with their own nested timelines. Export the result as a looping GIF or MP4/WebM.

## Start an animation

**Menu → New → New Animation…** Pick a stage size, a frame rate (12 / 24 / 30 fps) and a length. You get a single fixed Stage page and the timeline panel. Draw anywhere on the stage — whatever you create lands on the *current frame's keyframe* of the active layer (the "cel" model: each keyframe owns its own content).

Prefer to start from something finished? **Menu → Templates → Animations** has ready-made samples — *Bouncing Ball* (squash & stretch tweens), *Rocket Launch* (a looping movie-clip flame + frame-by-frame star twinkle) and *YappyDraw Intro* (a 1080×1080 social-media card). Load one, press Enter to play, pull it apart, or Export it straight to GIF. Scriptable too: `Yappy.anim.loadExample('bouncing-ball')`.

## The timeline

- **Rows are layers.** Rename (double-click), hide, lock, add and delete layers on the left; each row's frames run to the right. The top row is the top layer.
- **Filled dot** = keyframe with content · **hollow dot** = blank keyframe · shaded bar = the span the keyframe holds for · **arrow** = a motion tween · red column = the playhead.
- **Click** a cell to move the playhead + select that frame · drag the ruler to **scrub** · drag a keyframe dot to move it · right-click (or **touch & hold** on a tablet) for every frame command.
- **F5** Insert Frame (lengthen the span) · **F6** Insert Keyframe (duplicates the previous cel, so you can nudge it) · **F7** Insert Blank Keyframe · **Shift+F5** Remove Frame · **Shift+F6** Clear Keyframe.
- **After F6 the copy is selected and the Select tool is armed**, so you can drag it straight away — that's the whole point of the key. **F7** deliberately leaves your drawing tool alone, because a blank keyframe means you're about to draw. (Scripting is unaffected: `Yappy.insertKeyframe()` is a pure timeline edit and never changes your tool.)
- **On an iPad or tablet** there are no F-keys — **touch and hold** a frame for about half a second to open the same menu, with Insert Keyframe, Insert Blank Keyframe, motion/shape tweens, frame labels, frame actions, Clear Keyframe and Remove Frame. A hold that turns into a drag scrubs instead, so it never fires by accident.
- **Enter** play/pause · **,** / **.** step one frame · **Alt+,** / **Alt+.** flip *cel to cel* (drawing to drawing, the way you flip paper) · **Alt+Shift+,** / **Alt+Shift+.** jump marker to marker · **Home** / **End** jump to start/end. The **«** and **»** buttons either side of the frame counter flip cels too. Frame rate and length are editable in the timeline header.
- **Selecting a block.** Click a cell to select it; **drag** across cells and rows to paint a rectangular block. Because dragging a keyframe dot *moves* it, hold **Shift** to start a block on a cel — Shift also extends the block from the corner you already had.
- **Zoom.** The frame cells scale: use the zoom cluster in the header (out · **1:1** · in · fit) or hold **Ctrl** and roll the mouse wheel over the grid. The **#** button switches the ruler between frame numbers and **seconds.frames**, which is what you want when timing an animatic to dialogue.
- The panel grows with your layers up to a height cap, then scrolls — **drag its top edge** to resize (remembered between sessions). Frames scroll horizontally and the playhead auto-scrolls into view.

Frame-by-frame animation is just: draw on frame 1, **F6** (or F7 for a fresh empty cel), adjust, repeat — with **Onion** turned on to see ghosts of neighboring frames (red = before, green = after; the counts are adjustable).

## Blocks of cels — copy, paste, and re-timing

Select a block of frames (see above), then right-click it. Everything in this section works on the whole block, across layers.

- **Copy Frames** (Ctrl+Alt+C) · **Cut Frames** (Ctrl+Alt+X) · **Paste Frames** (Ctrl+Alt+V) · **Duplicate Frames** (Ctrl+Alt+D, drops the copy straight after the selection) · **Delete Frames** (removes the cells, pulling later cels left).
- The frame clipboard is **separate from the normal clipboard** — Ctrl+C and Ctrl+V still copy and paste *drawings*, which is what you want far more often while animating. That's why the frame versions add Alt.
- **Pasting overwrites** the destination range rather than pushing it along; use F5 first if you want to make room. A pasted cel owns **its own copies** of the drawings — draw on it and the cel you copied from is untouched.
- **Cel Duration** sets how long the selected cel is exposed (1, 2, 3, 4, 6, 8, 12 frames or a typed value). Everything after it slides to fit.
- **Split Frames → on 2s** re-exposes the selected stretch as cels of that length — the "shoot this on twos" tool. A cel with a drawing in it is copied into each new cel so you can then change them independently; a blank cel splits into blank cels.
- **Insert In-between** drops a blank cel halfway through the selected span, ready for the in-between drawing.
- The **/cel** field in the header is the default exposure for *new* cels. Set it to 2 and every F6/F7 gives you a two-frame cel, so drawing a sequence stays on twos without pressing F5 between drawings. It's saved with the document, not as a personal preference, so a file keeps the timing convention it was drawn on.

## Markers, and playing just part of the shot

**Double-click the ruler** to drop a named marker there; right-click the ruler to rename it, recolour it, or delete it. Markers are for the key beats of a shot — a contact pose, a word of dialogue, an accent.

- A marker belongs to the **ruler**, so it stays on its frame when you retime the cels underneath it. A **frame label** (in the frame properties bar) belongs to a cel and travels with it. Both exist; pick by what you want to happen when the timing changes.
- **Alt+Shift+,** / **Alt+Shift+.** jump from marker to marker.
- Right-click the ruler → **Mark In here** / **Mark Out here** to limit work to one stretch. The excluded frames grey out, and playback, looping, Stop (which rewinds to the in-point) and **video/GIF export** all honour the range. **Clear Play Range** puts it back.

## Your first animation, step by step (a bouncing ball)

This is the exact recipe behind the *Bouncing Ball* template — five minutes from a blank stage to a looping GIF:

1. **Menu → New → New Animation…** — pick *HD 16:9*, 24 fps, 1 second (24 frames). You're on frame 1 of the Layer 1 row.
2. **Draw the ball** near the top of the stage (circle tool, give it a solid fill). It automatically joins frame 1's keyframe — the dot on the timeline turns solid.
3. **Click frame 11** in the timeline, press **F6**. That duplicates the ball onto a new keyframe. **Drag the copy to the floor.**
4. **Click frame 13**, **F6** again — squash the copy (drag the side handle wider, the top handle shorter). That 2-frame squash is what sells the impact.
5. **Frame 15, F6** — restore the round size (or paste the frame-11 pose). **Frame 24, F6** — drag the ball back to the top.
6. **Add the tweens:** right-click the first span → *Create Motion Tween*; with that frame selected pick *easeInQuad* in the header (falls slow-then-fast — gravity). Tween the remaining spans too: linear into/out of the squash, *easeOutQuad* going up.
7. **Enter** to play. Toggle **Loop** and it cycles — because the last pose matches the first, the loop is seamless.
8. **Export** (header button) — it defaults to a GIF of exactly one pass.

Frame-by-frame instead of tweens? Same flow, just skip step 6 and make more keyframes (F6, nudge, repeat) — that's how the Rocket template's stars twinkle.

### Editing a shape in the middle of a tween

Park the playhead anywhere inside a tweened span, then resize, rotate or just drag the shape, and Yappy **splits the span at that frame first** — a new keyframe appears holding exactly the pose you were looking at, and your edit applies to that. Nothing jumps, the shape tracks your cursor one-for-one, and the keyframes at either end of the span are untouched. It's the same thing you'd get by pressing **F6** before editing; you just don't have to remember to.

Three things worth knowing. Nothing happens on a plain *click* — selecting a shape never adds a keyframe; the split waits until you actually grab a handle or move the shape past a few pixels. It costs one extra **Undo** (one step for the edit, one for the keyframe). And **shape** tweens are left alone: a mid-morph outline has no faithful keyframe form, so move the playhead to a real keyframe to edit those.

## Onion skinning — what it is and how to use it

Onion skinning shows **ghost images of nearby frames** under the frame you're editing — named after the translucent onion-paper sheets classical animators flipped between. Red ghosts are frames *before* the playhead, green ghosts are frames *after*; the farther away, the fainter.

- Toggle it with the **Onion** button in the timeline header. The two number fields beside it set how many frames to ghost before / after (try 2 and 2).
- Use it while **drawing the next pose**: F6 or F7 a new keyframe, and draw relative to the red ghost of the previous pose — spacing between ghosts IS your motion speed. Even spacing = constant speed; tightening spacing = ease-in.
- Ghosts appear only while **paused** (playback hides them) and they're never exported.
- **You can't select or grab a ghost.** They're a reference image, not objects on this frame — clicking one, or dragging a selection box across one, only ever picks up what's actually on the current frame. (Before 0.8.171 a selection box did reach them, so a drag could quietly grab a pose the playhead wasn't even on.) To edit what a ghost shows, scrub to its frame.
- They work in both sketch and architectural render styles, and ghost tweened positions too — so you can check a tween's arc frame by frame.

## Out of pegs — move the ghost, not the drawing

Classical animators slide the paper off the peg bar so the previous drawing sits where it helps them draw the next one — under your hand, at the angle you want, without changing what's on the page. That's this.

- Right-click a cel → **Edit Out of Pegs…**. Onion skinning switches on (with no ghosts there'd be nothing to move), and a **pegs ✓** badge appears in the header.
- Now **drag on the canvas** to slide that cel's ghost. **Alt+drag** rotates it, **Shift+drag** scales it — both about the cel's own centre. Press **Esc** (or click the badge) to finish.
- The drawing itself **never moves**. The offset applies only where that cel is drawn as a ghost: playback, export, hit-testing and the HTML player are all completely unaware of it.
- A pegged cel shows a small orange **p** in the timeline. **Reset Out of Pegs** clears that one cel; **Reset All Out of Pegs** clears the document.
- Use it for a head turn: peg the previous ghost onto the volume you're drawing over, draw the new pose in place, then reset. Because the drawing didn't move, the flip plays back correctly the moment you're done.

## Editing animated objects (changing properties)

Everything on the stage is a normal Yappy object — **scrub to the keyframe that owns it, select it, and edit like always** (drag/resize/rotate on canvas, or use the Properties panel for fill, stroke, opacity, text…).

- **Keyframes are independent.** Editing the ball on frame 11 doesn't touch frame 1 — each keyframe owns its own copies (that's the point: it's how poses differ). To restyle the object *everywhere*, either edit each keyframe's copy, or convert it to a **symbol** first — editing a symbol updates every instance on every frame.
- **Tweens read the keyframe copies.** A motion tween interpolates whatever the two endpoint copies say — so "make the ball end up bigger" is just: scrub to the end keyframe, select, resize. The in-between frames update instantly. Tweenable properties: position, size, rotation, opacity, fill and stroke color.
- **Mid-tween frames aren't editable** — they're computed. To pin a pose mid-tween, press **F6** there: the computed pose isn't captured, you get a copy of the span's start pose to adjust (the span splits and both halves keep tweening).
- **Frame properties** (tween on/off, easing, label) live in the timeline header when a frame is selected; **clip instance properties** (loop / play once / single frame, first frame) appear there when a movie-clip instance is selected.
- **Layer basics apply:** hide/lock a row while working on another; a hidden layer still exports hidden, so re-show it before exporting.

## Motion tweens

1. Draw something on a keyframe (one object per layer works best — the tip toast will remind you).
2. **F6** at a later frame, then move / resize / rotate / recolor the copy.
3. Right-click the span → **Create Motion Tween** (or tick **Tween** in the header when the frame is selected). Pick an easing from the dropdown.

Position, size, angle, opacity and fill/stroke colors interpolate between the two keyframes. F6 copies carry a shared identity (`contentId`), which is how the tween knows which object continues into the next keyframe; unmatched objects simply hold.

### Ease curves (custom bezier)

Beyond the named easings, the **curve** button (timeline header, when a tweened frame is selected) opens a bezier editor: presets (In, Out, In-Out, *Overshoot*, *Anticipate*) plus two draggable handles for any curve you like — drag a handle above 1 for overshoot, below 0 for wind-up. A custom curve overrides the named easing; **Clear** falls back to it. Scriptable: ` Yappy.anim.setFrameEaseCurve({ ox, oy, ix, iy })`.

### Motion guides (follow a path)

Make a tween ride a curve instead of a straight line: draw a **line, polyline, pen path or freehand stroke** as the route, select it, then select the tweened keyframe and click **guide: use selection** in the header. Across the span the object's *center* travels the path from its start to its end (easing applies along the path); tick **orient** to rotate it into the direction of travel — a plane banking through a loop. **guide ✕** detaches. Tip: park the guide path on its own hidden layer — hidden layers don't render or export, but guides still steer. API: `Yappy.anim.setFrameGuide(pathId, orient)`.

### Shape tweens (morphing)

A **shape tween** does everything a motion tween does *and morphs the outline* — a square flows into a circle, a star into a heart. Same recipe: F6 a later keyframe, change the copy's *shape* (e.g. select it and use Convert to Shape, or delete-and-draw a different shape then give it the same spot), then right-click the span → **Create Shape Tween** (green arrow in the grid; the header select also switches between motion/shape). The outline is resampled and twist-aligned so the morph doesn't spin. Notes: mid-morph frames render with clean outlines (both render styles); strokes/lines, text and clip instances fall back to plain motion tweening.

## Pose keyframes — animate stick figures (bones & IK)

Drop an **animated stick figure** on the stage (Stick Figures panel) and it becomes poseable per keyframe: select it and the timeline header shows a **Pose** section — a motion-clip picker (walk, run, wave, jump…), a **cycle-phase slider** (the exact instant of the clip this cel holds) and a **flip** button.

- **Same clip on both keyframes** → the tween glides the phase through the cycle: legs stride, feet plant via IK, arms swing — a walk unfolds exactly between your two cels, frame-exact on scrub, playback and export.
- **Different clips** → the tween *blends the skeleton* from one pose to the other (idle melting into a wave), joint by joint.
- Setting a pose pins the figure (*playing: false*) so cels hold still poses; position/size tween as usual, so a figure can walk-cycle *while* a motion guide carries it along a path.

## Movie clips (symbols with their own timeline)

- Select objects → **F8** (or Symbols panel → **Movie clip**) to convert them into a movie-clip symbol; the selection is replaced by an instance. (**Shift+F8** makes a static graphic symbol instead.)
- **Double-click an instance** to edit the clip in place — the timeline panel switches to the *clip's own* timeline. Add keyframes/tweens exactly like the main timeline, then use the banner to finish; every instance updates.
- A clip plays *independently* of the main timeline: one keyframe on the main timeline can hold a looping clip. With an instance selected, the timeline header shows **loop / play once / single frame** and a first-frame offset — so several instances of one clip can run out of phase.

## Scenes — multiple stages in one document

The **scene picker** at the far left of the timeline header splits a film into acts: each scene is its own stage with its *own* timeline, layers' frames, tweens and sounds. **+** adds a scene (blank stage, same fps/length), the dropdown switches (the camera glides to that stage), and the trash deletes a scene together with its contents. Only the active scene's artwork is visible and editable; everything round-trips through save/load. API: ` Yappy.anim.addScene() / setScene(i) / deleteScene(i) / sceneCount()`.

## Sound — the audio row

Between the ruler and the layers sits the **♪ Audio** row. Right-click it (or click the **+** next to "♪ Audio" in the layer column) to **Add Sound** — nine built-in synth effects (coin, jump, hit, powerup, explosion, blip, win, lose, click; they preview as you pick) — or **Import Audio File…** for your own music/voice (up to 4 MB; it's stored inside the document, so the animation stays self-contained).

- Each sound starts at its frame — **drag the amber block** to move it; right-click a block to remove it.
- Sounds play during **playback** (Enter) at the right frames, and loop with the loop toggle. Scrubbing stays silent.
- **MP4/WebM exports include the audio**, mixed at the exact frame offsets. GIFs are silent by nature.
- API: `Yappy.anim.addSound('coin', frame)`, `sounds()`, `moveSound(id, frame)`, `removeSound(id)`.

## Camera — keyframed zooms and pans

The **📷** button captures the *current editor view* as a camera keyframe at the playhead: frame the shot by panning/zooming the canvas, scrub to a frame, click 📷, move to another frame, frame a new shot, 📷 again. During **playback and export** the stage content glides between those shots — the Ken Burns / camera-layer move. While paused you keep your free editing view (📷✕ removes the key at the playhead). Scriptable: ` Yappy.anim.setCameraKey({ frame, x, y, zoom })` (stage coords; zoom 1 = the full stage).

## Frame actions & the HTML player

Right-click a keyframe → **Frame Action** to control playback the way Flash's `stop()` / `gotoAndPlay()` did (a small **a** appears above the dot):

- **Stop** — playback parks on that frame (an intro that holds its end pose).
- **Loop to Frame 1** / **Go to Frame…** — jump the playhead, creating loop sections inside a longer timeline.
- **Next Scene** — chain scenes into a film that plays act by act.
- Actions fire during *playback* (editor and HTML player alike) — scrubbing never triggers them. API: `Yappy.anim.setFrameAction({ kind: 'goto', frame: 0 })`.

**Menu → Export HTML** produces a self-contained web page that plays the animation for real — not a video: it ships the actual renderer, so it loops at full quality, runs frame actions, plays the audio row, and shows minimal restart/pause controls. Share the file anywhere a browser runs.

## Export

**Export** (timeline header, or Ctrl+Shift+E) defaults to a GIF of exactly one timeline pass at your frame rate; MP4/WebM use the same frame-exact renderer. The `.yappy` file stores the timeline, so a saved animation reopens ready to play.

## API

Everything is scriptable via `window.Yappy.anim`:

```
Yappy.anim.newDocument({ width: 1280, height: 720, fps: 24, frames: 48 });
const id = Yappy.createRectangle(100, 100, 80, 80, { backgroundColor: '#f00' });
Yappy.anim.gotoFrame(24);
const [copy] = Yappy.anim.insertKeyframe();     // F6: duplicate the cel
Yappy.updateElement(copy, { x: 500 });
Yappy.anim.setTween('motion', undefined, 0);    // tween the span leaving frame 1
Yappy.anim.setFrameEasing('easeInOutQuad', undefined, 0);
Yappy.anim.play();                              // …pause(), stop(), gotoFrame(f)
Yappy.createSymbol('Ball', [id], 'movieclip');  // F8

// Blocks of cels
Yappy.anim.selectFrames(['layer-1'], 0, 7);     // a rectangle of (rows × frames)
Yappy.anim.copyFrames();                        // …cutFrames(), duplicateFrames(), deleteFrames()
Yappy.anim.pasteFrames(24);                     // overwrites frames 24…
Yappy.anim.splitFrames(2);                      // re-expose the selection on twos
Yappy.anim.setCelDuration(4);                   // hold the selected cel for 4 frames
Yappy.anim.insertInbetween();
Yappy.anim.setNewCelFrames(2);                  // every new cel is 2 frames long

// Flipping, markers, play range
Yappy.anim.stepCel(1);                          // next drawing (not next frame)
Yappy.anim.setMarker('contact', 12, '#ef4444');
Yappy.anim.stepMarker(1);
Yappy.anim.setMarkRange(4, 20);                 // playback + export cover 4…20
Yappy.anim.playRange();                         // → [4, 20]

// Out of pegs (ghost-only; the drawing never moves)
Yappy.anim.setPeg({ x: 40, y: -10, angle: 0.1, scale: 1 });
Yappy.anim.resetAllPegs();
```

## Notes & limits

- Only the current frame's content is selectable/visible on the stage — scrub to reach the rest. Deleting a layer deletes its frames' content (Animate semantics).
- Shape (form-morphing) tweens, motion guides, bones/IK, audio tracks, scenes and an interactive HTML player are on the roadmap; today's tweens cover transform, opacity and color.
- The seconds-based Keyframes dope sheet and Scene Timeline are hidden in animation documents — the frame timeline is the single time driver here.
