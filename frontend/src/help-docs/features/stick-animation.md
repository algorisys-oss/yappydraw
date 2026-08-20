---
id: stick-animation
name: Animated Stick Figures
icon: "🎞"
category: Design
description: "Skeletal animated stick figures for storytelling: walk/wave/talk/point/jump/idle motions, play/pause, flip, switch clip, bake to editable paths — with a step-by-step tutorial"
keywords: animate animation animated stick figure motion clip walk walking cycle run running wave waving talk talking gesture point pointing clap clapping jump jumping dance dancing cheer cheering idle breathe skeleton rig joints forward kinematics foot planting ik bend knee elbow storytelling story sequence action timeline scene playhead scrub track record video webm export html loop play pause flip facing left right bake freeze frame convert to paths procedural insertAnimatedFigure setAnimatedFigureClip setFigureSequence flipAnimatedFigure bakeAnimatedFigure recordAnimation exportHtml toggleSceneTimeline seekScene tutorial step by step
---

# Animated Stick Figures

Drop a stick figure that actually **moves** — a walk cycle, a wave, a talking gesture — and use it to tell a story on the canvas. Each animated figure is driven by a little skeleton (real joints, bending knees and elbows) with **foot planting**, so it reads as motion, not sliding. It plays live on the canvas and can be **baked** to an editable vector figure at any moment.

## The motions

Twenty built-in motion clips, each loops smoothly.

**Movement & expression**

- **Idle** — a subtle breathing stand.
- **Walk** / **Run** — foot-planted cycles (no skating); Run leans in and pumps its arms.
- **Wave** — one arm raised, hand waving.
- **Talk** — hands gesturing near the chest.
- **Point** — an arm extended in the facing direction.
- **Clap** — hands meeting in front.
- **Jump** — crouch, launch, tuck, land.
- **Dance** — hip sway with alternating arms.
- **Cheer** — both arms up, pumping.

**Daily actions**

- **Sit** — seated and breathing, hands on the thighs. Add a chair or bench behind it from the Props category.
- **Type** — seated at a desk, hands tapping. Pair it with the laptop prop.
- **Squat** — a full squat cycle, hips back, feet planted.
- **Lift weights** — a bicep curl, both arms together.
- **Stretch** — reach overhead and ease back down.
- **Kick** — one leg swings forward and back.
- **Cook** — leaning over the hob, one hand stirring in circles.
- **Sweep** — both hands on a broom, pushing forward and back.
- **Drink** — raise a cup to the mouth, tip, lower.
- **Think** — hand at the chin, slow head tilt.

:::tip
The rig is drawn in **side profile**, so every clip is authored to read from the side — that's why Sit, Cook and Type look right next to a prop facing the same way. Use **Flip** to turn a figure around.
:::

## Tutorial: create an animation, step by step

1. **Open the Stick Figures panel.** Click the walking-person button in the toolbar, or Menu → **Stick Figures**.
2. **Switch to the Animated tab.** In the chip row, click **🎞 Animated**. You'll see all ten motions as preview cells.
3. **Add a motion.** Click **Walk** (or any motion). A figure appears on the page and *immediately starts moving* — it loops on the canvas.
4. **Place & size it.** Drag the figure to position it; drag a corner handle to scale it up or down. The motion keeps playing at any size.
5. **Use the figure controls.** With the figure selected, the panel shows an **Animated figure** section:

   - **Clip chips** — switch the motion (Walk → Wave → Talk…) instantly.
   - **Pause / Play** — freeze or resume just this figure.
   - **Flip** — face it left or right (so a walker can head either way).
   - **Bake** — see step 8.
6. **Recolour it.** Change the **stroke colour** in the Properties panel to recolour the whole figure. Switch **render style** to *Sketch* for a hand-drawn look — it still animates.
7. **Build a little scene.** Add a second figure and **Flip** it so the two face each other; give one *Talk* and the other *Idle*. Mix in static figures, props (a laptop, a speech bubble) and any other canvas elements — it's one shared canvas.
8. **Bake a pose when you need a still.** Click **Bake** to freeze the current frame into an ordinary editable figure (grouped bezier paths). Ungroup it to tweak a limb, or drop it into a diagram. The original animation is replaced by the baked frame. <br /> To **reshape a part**: ungroup the figure and select a single part — its path node handles (small squares) appear and become draggable. Or use the **Reshape** tool to bend whichever part you grab without ungrouping. (Node handles only show for a single selected path, so nothing draggable appears while the whole group is selected.)

:::tip
**Pausing everything:** animated figures loop continuously. Pause a single figure with its *Pause* button, or use the canvas play/pause to freeze the whole scene's clock.
:::

## Make a figure walk a route (path-follow)

The most powerful storytelling move: have a figure **walk along a path you draw**. It travels the route at a steady pace with its **feet planted** (no sliding) and automatically **faces the direction of travel**.

1. **Draw a path** — use the Line, Pen/Curve, or Pencil tool to draw the route the figure should follow (a straight line, an arc, a wavy stroll — anything).
2. **Add an animated figure** (Animated tab → any motion) near the path.
3. **Select both** — click the figure, then shift-click the path (so the figure *and* the path are selected together).
4. **Click “Walk this path”** in the Animated figure controls. The figure snaps onto the path and walks it end to end, looping, facing the way it's going.
5. **Adjust** — reshape the path and the figure re-routes; use **Stop following path** to release it.
6. **Set the pace** — **Lap time** is how many seconds one trip along the route takes at 1×, and the **Speed** slider scales it. Reshaping the path keeps the same lap time, so a longer route simply means a faster walk.

:::tip
Two figures + two paths crossing = a little scene. Add speech bubbles and props to set the stage. API: `attachFigureToPath(figureId, pathId, { dur, loop, autoFace })`, ` setFigurePathDuration(dur, id?)`, `detachFigurePath(id)`.
:::

## Chain actions over time (sequences)

Give a figure a little script: with it selected, use the **Action sequence** editor in the panel to add **timed steps** — each a motion played for a number of seconds. The figure runs the steps in order and loops.

1. **+ Add step** to append a motion; pick the clip from the dropdown and set its duration in seconds.
2. Add more — e.g. *Walk 3s → Wave 2s → Talk 2s* — for a figure that walks up, waves, then chats, forever.
3. Remove a step with **×**, or **Clear** to go back to a single clip.

:::tip
Transitions between steps are **cross-faded** automatically, so the figure eases from one motion into the next instead of snapping. A sequence plays in place; combine figures with different sequences (and path-follow) to stage a whole little scene. API: `setFigureSequence([{ clip:'walk', dur:3 }, …], id?)`.
:::

## Automate it (API)

```
const Y = window.Yappy;
Y.listStickFigureClips();                       // [{id:'walk',name:'Walk'}, …]
const a = Y.insertAnimatedFigure('walk', { x: 200, y: 200, width: 160, facing: 1, speed: 1 });
const b = Y.insertAnimatedFigure('talk', { x: 520, y: 200, facing: -1 });
Y.setAnimatedFigureClip('wave', [a]);           // switch clip
Y.flipAnimatedFigure([b]);                       // face the other way
Y.setAnimatedFigurePlaying(false, [a]);          // pause just this one
Y.bakeAnimatedFigure(a);                          // freeze current frame → editable paths

// Speed
Y.setAnimatedFigureSpeed(2, [a]);                 // 2x — clips, sequences AND path-following
Y.setFigurePathDuration(8, a);                    // 8s for one lap of the route, at 1x

// Faces & hair (same call as for dropped library figures)
Y.setStickFace({ face: 'excited', hair: 'spiky' }, [a]);
Y.insertAnimatedFigure('walk', { face: 'happy', hair: 'long', headFill: true });
```

:::tip
API: `listStickFigureClips()`, `insertAnimatedFigure(clip, opts?)`, ` setAnimatedFigureClip(clip, ids?)`, `setAnimatedFigurePlaying(playing?, ids?)`, ` flipAnimatedFigure(ids?)`, `bakeAnimatedFigure(id?)`, ` setAnimatedFigureSpeed(speed, ids?)`, `setFigurePathDuration(dur, id?)`, ` setStickFace(opts, ids?)`, `getStickFace(ids?)`.
:::

## Give it a face

An animated figure wears an expression and hair just like a library figure. Select it and use the **Face & hair** section (bottom of the Stick Figures panel, and in **Properties**) to pick from 12 expressions and 10 hair styles.

Nothing has to be regenerated — the face is drawn from the head's live position every frame, so it keeps up with the motion, follows the figure when you **Flip** it, and comes along when you **Bake** the frame to editable paths.

:::tip
Chain it with a sequence for simple acting: Walk with a *neutral* face, then switch to *surprised* from a script at the moment something happens.
:::

## Direct the whole scene (Scene Timeline)

Click **Scene timeline** in the panel to open a timeline across the bottom of the screen. Every animated figure becomes a **track**, with its action sequence shown as coloured blocks along a time ruler.

- **Play / Pause / Restart** and a **Loop** toggle drive all figures together from one clock.
- **Scrub** — drag the red playhead (or click the ruler) to jump to any moment; every figure poses at that instant. Great for lining up a scene or grabbing a frame to bake.
- Click a track's **label** to select that figure on the canvas.
- **Reorder a step** — drag a block left/right to change the order of actions.
- **Resize a step** — drag the right edge of a block to change how long that motion runs (snaps to ½ second).
- **Sync to slides** — on a slides/pages document, toggle the monitor-play button (“Restart the scene when the slide/page changes”) so each slide plays its animation fresh.

:::tip
The scene length is set automatically by the longest figure. API: ` toggleSceneTimeline(true)`, `playScene()`, `seekScene(seconds)`.
:::

## Export your animation as a video

On a page document (a design/post or slides), **Export → MP4 Video** renders *the page itself* — exact page bounds at the page's own resolution, animations playing, no workspace around it — for the duration you choose, then downloads an H.264 `.mp4` (or `.webm`). Your zoom/pan doesn't matter; the export is framed to the page. API: `exportVideo(seconds?, 'mp4' | 'webm')`.

Prefer a GIF (auto-plays anywhere, loops forever)? **Export → Animated GIF** does the same page-framed render as a looping `.gif` (12 fps, long side capped at 960px — GIFs get huge beyond that). API: `exportGif(seconds?, fps?)`.

Alternatively, **record the live canvas**: with an animated figure selected, click **Record video** in the panel — it captures whatever is on screen (all figures, sequences and path-follow, exactly as they play) and **Stop & save recording** downloads the file. (A red recording indicator shows while it runs.)

:::tip
Live recording captures whatever is on screen, so pan/zoom to frame your scene first. API: ` recordAnimation(seconds?)` / `stopRecording()`. On an infinite-canvas doc, Export → Video also uses live capture (there are no page bounds to frame to).
:::

Prefer a shareable webpage? **Export → HTML** writes a self-contained `.html` file that **plays the animation** when opened in any browser — the figures walk, wave and follow their paths just like on the canvas. (API: `exportHtml(name?)`.) The player is interactive: presentations advance with **→ / Space** (back with ←, Home/End jump to first/last slide) or the on-screen arrows, and an infinite-canvas export opens auto-framed to your content.

## Good to know

- An animated figure is a single object — move, scale, rotate and recolour it like any shape.
- It renders procedurally from a skeleton; to hand-edit the artwork, **Bake** it to paths first.
- Share a moving animation as a **video** (record) or a self-contained **HTML** page (Export → HTML) that plays it; bake a frame for a still. Image/PDF export captures a single frame.
