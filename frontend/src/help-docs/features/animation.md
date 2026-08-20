---
id: animation
name: Animation
icon: "🎬"
category: Features
description: Animate elements with presets, keyframes, and spring physics
seoTitle: "Animate a diagram — 40+ presets, keyframes and path animation"
seoDescription: "Animate shapes with entrance, exit and emphasis presets, keyframes, spring physics, shape morphing and motion along a path. Export to MP4, WebM or GIF."
---

# Animations

Add life to your diagrams with powerful animation capabilities. Yappy supports 40+ animation presets, keyframe animations, path animations, shape morphing, and spring physics for natural motion.

## Key Features

:::cards
40+ Presets | Entrance, exit, and emphasis animations inspired by Animate.css
Keyframes | Create custom animations with precise control over timing and values
Path Animation | Animate elements along any SVG path with auto-rotation
Shape Morphing | Smoothly transform one shape into another
Spring Physics | Natural, physics-based motion with bounce and settle
Recording | Export animations as MP4, WebM or animated GIF
:::

## Keyframes Timeline (dope sheet)

The **Keyframes** panel is an After Effects–style, absolute-time timeline for the selected element. Unlike the trigger-based presets above, keyframes live on a scrubbable playhead: every property is evaluated at time *t* and previewed live on the canvas (and in exported video). Open it from **Menu → View → Keyframes** or with <kbd>Alt</kbd>+<kbd>K</kbd>.

### Authoring keyframes

1. Select an element — its animatable properties appear as track rows (Position X/Y, Width, Height, Rotation, Opacity, Fill, Stroke).
2. Move the playhead (drag the ruler) to the time you want.
3. Set the property to the value you want (e.g. move/resize/recolor the element), then click the **◆ stopwatch** on that property row to record a keyframe at the playhead. Repeat at a later time to create motion.
4. Press **Play** to preview, or scrub the ruler. Values between keyframes are interpolated (colours blend in hex; rotation in degrees).

### Animating effects

Beyond transform and colour, the panel keyframes **live-effect parameters**: **Feather** (soft edges — on any shape), **Stroke Width**, **Blur** (images/video), and — once the effect is enabled on the element — **Glow** (radius + colour) and **Shadow** (blur, X/Y offset, colour). Effect params start at 0 ("off"), so you can key a glow or feather that reveals over time. Example: `Yappy.addKeyframe(id, 'featherRadius', 0, 0)` then ` Yappy.addKeyframe(id, 'featherRadius', 2, 30)` blurs the shape in over 2s.

**3D & warp.** Nested effect params animate too, via dotted paths: **Extrude Depth / Angle / Tilt / Bevel** (when the shape has 3D Extrude) and **Warp Bend** (on a warp preset) appear as rows once the effect is on — e.g. `Yappy.addKeyframe(id, 'extrude.depth', 0, 0)` then ` (id, 'extrude.depth', 2, 70)` grows a solid out of the flat shape.

**Adjustment layers.** Add one from *Menu → View → Add Adjustment Layer* (or `Yappy.createAdjustmentLayer()`): a rectangular region that applies a CSS filter (blur / brightness / contrast / saturate / hue) to everything drawn *beneath* it — and its filter params are keyframable, so you can sweep a blur or a colour grade across your artwork over time. (It's an authoring gizmo, so it isn't drawn in PNG/SVG export yet.)

### Editing keyframes

| Action | How |
| --- | --- |
| Add / update a key | Click the ◆ stopwatch on the property row (records the current value at the playhead) |
| Retime a key | Drag its diamond left/right (snaps to 0.05 s) |
| Delete a key | Double-click the diamond, or select it and press <kbd>Del</kbd> |
| Scrub | Drag the ruler, or click an empty lane at the target time |
| Duration | Edit the *dur* field in the panel header |
| Undo / redo | <kbd>Ctrl</kbd>+<kbd>Z</kbd> — keyframe edits are in the history stack |

```
                    // Scripting the timeline (window.Yappy)
const id = Yappy.createRectangle(100, 100, 80, 60);
Yappy.addKeyframe(id, 'x', 0, 100);        // t = 0s
Yappy.addKeyframe(id, 'x', 2, 400);        // t = 2s
Yappy.addKeyframe(id, 'opacity', 0, 100);
Yappy.addKeyframe(id, 'opacity', 2, 0, 'easeInQuad');
Yappy.toggleKeyframePanel(true);
Yappy.seekScene(1);                         // scrub to 1s (x = 250, opacity ≈ 50)
Yappy.evaluateComposition(1);               // → Map(id → { x, opacity })
```

### Scene script — sequencing without doing the time maths

Writing keyframes directly means computing every absolute time yourself. `Yappy.scene` is a **playhead** over the same tracks: each `play()` starts where the previous one ended, exactly like manim’s `self.play()` / `self.wait()`. It produces ordinary composition keyframes, so the timeline, the Keyframes panel, scrubbing and video export all work on the result unchanged.

| Call | What it does |
| --- | --- |
| `scene.play(id, to, opts)` | Animate one element to `to`; advances the playhead by `duration` (default 1 s) |
| `scene.playAll(specs, opts)` | Several elements over the *same* span (manim `AnimationGroup`) |
| `scene.playLagged(ids, to, opts)` | One animation across many elements, offset by `lag` seconds (manim `LaggedStart`) |
| `scene.wait(s)` | Hold — the gap reads as a hold, since a track keeps its last value |
| `scene.at()` | Playhead position, i.e. the scene’s length so far |
| `scene.seek(s)` | Move the playhead without animating (to interleave hand-written keys) |
| `scene.reset()` | Clear every track and rewind to 0 |

```
                    const dot = Yappy.createCircle(100, 300, 24, 24, { backgroundColor: '#ef4444' });
Yappy.scene.reset();
Yappy.scene.play(dot, { x: 600 }, { duration: 2 });     // 0s → 2s
Yappy.scene.wait(1);                                     // hold to 3s
Yappy.scene.play(dot, { opacity: 0 }, { duration: 0.5 }); // 3s → 3.5s
Yappy.scene.at();                                        // → 3.5

Yappy.toggleSceneTimeline(true);
Yappy.playScene(true);                                   // watch it
```

**Easing names are checked.** The default is `easeInOutCubic`. An unrecognised name (`'easeInOut'` is a common guess and is *not* a real name) falls back to linear — `scene.play` logs one console warning listing the valid names rather than quietly flattening your motion.

### Expression tracks — a property driven by the clock

Keyframes describe motion between fixed points. Some motion is easier to *state* than to key: an orbit, a bob, a spin, a readout that tracks a value. `Yappy.setExpression` drives a property from a formula in `t` (seconds) instead — the practical equivalent of manim’s `ValueTracker` plus `always_redraw`.

```
                    Yappy.setExpression(dot, 'y', '300 + 120 * Math.sin(t * 3)');  // bobbing
Yappy.setExpression(dot, 'angle', 't * Math.PI');               // spinning
Yappy.setExpression(dot, 'opacity', '50 + 50 * Math.cos(t)');   // pulsing

Yappy.clearExpression(dot, 'y');
```

The formula is stored as a **string**, not a function, so a composition stays serialisable — it survives save/load and the embed bridge. An expression replaces any keyframes on that property. If it throws or returns a non-finite number the property is simply left alone, and it is not retried, so a typo cannot spam the console sixty times a second.

### Easing & the graph editor

Click a keyframe diamond to select it — an **Easing** popover opens for the segment entering that key. Pick a preset, or drag the two handles in the bezier graph to shape the timing curve by hand (overshoot is allowed — drag a handle above the box).

| Preset | Feel |
| --- | --- |
| Linear | Constant speed |
| Ease In | Slow start, accelerate |
| Ease Out | Fast start, decelerate |
| Ease In-Out | Ease at both ends (natural) |
| Hold | Stepped — the value jumps at the keyframe with no interpolation (shown as a square marker) |

```
                    // Easing is stored per keyframe (on the segment entering it):
Yappy.addKeyframe(id, 'x', 2, 400, 'easeInQuad');   // named easing
// or set bezier handles / hold directly on the track:
Yappy.setCompositionTracks([{ elementId: id, property: 'x', keys: [
  { t: 0, value: 0 },
  { t: 2, value: 400, ease: { ox: 0.42, oy: 0, ix: 0.58, iy: 1 } }, // ease in-out
  { t: 3, value: 400, hold: true },                                  // stepped
]}]);
```

### Transform parenting & null objects

Make one element inherit another's animated motion. With an element selected, pick a **Parent** in the Keyframes panel header — it now follows the parent's animated *position, rotation and scale* (a child with no keyframes of its own still moves when its parent animates). Great for rigs: parent several parts to one controller and animate just the controller.

A **null object** (the ⊕ button, or `Yappy.createNull()`) is an invisible controller — it shows as a small crosshair while editing, follows every parenting rule, and never appears in exports or presentations. Parent your layers to a null and keyframe the null to move the whole group as one.

```
                    const ctrl = Yappy.createNull(200, 200);      // invisible controller
const box = Yappy.createRectangle(400, 300, 80, 60);
Yappy.setTransformParent(box, ctrl);          // box now follows ctrl
Yappy.addKeyframe(ctrl, 'angle', 0, 0);
Yappy.addKeyframe(ctrl, 'angle', 2, Math.PI/2); // box swings with it
```

:::tip
**Note:** the Keyframes timeline shares the playhead clock with the Scene Timeline, so only one is open at a time. Keyframe values override the stored element at render time without changing it — clearing the tracks restores the original. Transform parenting is separate from mind-map parent/child hierarchy.
:::

## Animation Presets

Yappy includes a rich library of animation presets organized by category:

### Entrance Animations

| Category | Animations |
| --- | --- |
| **Fade** | fadeIn, fadeInDown, fadeInUp, fadeInLeft, fadeInRight, fadeInTopLeft, fadeInTopRight, fadeInBottomLeft, fadeInBottomRight |
| **Slide** | slideInDown, slideInUp, slideInLeft, slideInRight |
| **Bounce** | bounceIn, bounceInDown, bounceInUp, bounceInLeft, bounceInRight |
| **Zoom** | zoomIn, zoomInDown, zoomInUp, zoomInLeft, zoomInRight |
| **Back** | backInDown, backInUp, backInLeft, backInRight |
| **Rotate** | rotateIn, rotateInDownLeft, rotateInDownRight, rotateInUpLeft, rotateInUpRight |
| **Text** | typewriter, typewriterCursor, wordByWord, textScramble, lineByLine |
| **Table** | tableRowReveal, tableColReveal, tableCellFill, tableHeatmapFadeIn, tableRowHighlight, tableColPulse, tableGridDraw, tableHeaderSlam, tableCountUp, tableAccordion, tableCellsAssemble, tableLightningSplit |

### Exit Animations

| Category | Animations |
| --- | --- |
| **Fade** | fadeOut, fadeOutDown, fadeOutUp, fadeOutLeft, fadeOutRight |
| **Slide** | slideOutDown, slideOutUp, slideOutLeft, slideOutRight |
| **Bounce** | bounceOut, bounceOutDown, bounceOutUp, bounceOutLeft, bounceOutRight |
| **Zoom** | zoomOut, zoomOutDown, zoomOutUp, zoomOutLeft, zoomOutRight |
| **Back** | backOutDown, backOutUp, backOutLeft, backOutRight |
| **Rotate** | rotateOut, rotateOutDownLeft, rotateOutDownRight, rotateOutUpLeft, rotateOutUpRight |
| **Text** | textDelete |

### Emphasis Animations (Attention Seekers)

| Animation | Description |
| --- | --- |
| **bounce** | Element bounces up and down |
| **flash** | Element flashes (opacity pulses) |
| **pulse** | Element scales up and back |
| **rubberBand** | Element stretches and snaps back |
| **shakeX / shakeY** | Element shakes horizontally/vertically |
| **headShake** | Element shakes side to side (like saying "no") |
| **swing** | Element swings like a pendulum |
| **tada** | Element does a "ta-da!" reveal |
| **wobble** | Element wobbles back and forth |
| **jello** | Element jiggles like jello |
| **heartBeat** | Element pulses like a heartbeat |

## Text Animations

Special animations designed specifically for text elements:

| Animation | Description |
| --- | --- |
| **typewriter** | Classic letter-by-letter reveal effect, like typing on a keyboard |
| **typewriterCursor** | Letter-by-letter reveal with a blinking cursor |
| **wordByWord** | Reveals text one word at a time |
| **textScramble** | Hacker/decode effect - characters scramble randomly then resolve to the final text |
| **lineByLine** | Reveals text one line at a time - perfect for lists and multi-line content |
| **textDelete** | Exit animation - erases text character by character from the end |
| **charByChar** | Per-character reveal with stagger - like GSAP's SplitText |

:::tip Note
Text animations work on **text elements** and any **shape with container text** (double-click a shape to add text inside it). For best results, use longer durations (1-3 seconds) to make the text reveal readable.
:::

### API Usage

```
// Typewriter effect over 2 seconds
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
});
```

## Table Animations

Special animations designed specifically for table elements, leveraging the table's internal structure (rows, columns, cells):

| Preset | Description |
| --- | --- |
| **tableRowReveal** | Rows appear one at a time from top to bottom |
| **tableColReveal** | Columns appear one at a time from left to right |
| **tableCellFill** | Cells fill in one at a time in row-major order |
| **tableHeatmapFadeIn** | Cells fade in with randomized stagger for a heatmap-like effect |
| **tableRowHighlight** | A highlight color sweeps through each row |
| **tableColPulse** | A highlight color pulses through each column |
| **tableGridDraw** | Border draws first, then grid lines appear, then cell backgrounds and text fade in |
| **tableHeaderSlam** | Header row drops in with a bounce effect, then body rows fade in |
| **tableCountUp** | Numeric cells count up from 0 to their final value |
| **tableAccordion** | Rows expand one at a time from collapsed to full height |
| **tableCellsAssemble** | Cells fly in from scattered positions and assemble into the table |
| **tableLightningSplit** | Table splits along a zigzag lightning bolt crack, halves slam together with a flash |

### API Usage

```
// Row-by-row reveal over 1.2 seconds
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
tableLightningSplit(tableElementId, 1500);
```

## Advanced Stagger (GSAP-like)

Yappy includes GSAP-inspired stagger utilities for animating multiple elements with sophisticated timing patterns.

### Using Stagger from the UI

Select multiple elements to access stagger animations in the Animation Panel:

1. **Select multiple elements** - Use Shift+click or drag a selection box
2. **Open Animation Panel** - Located in the right sidebar Properties panel
3. **Configure stagger settings:**

   - **Effect** - Choose any preset (fadeIn, slideInLeft, drawIn, shakeX, revolve, glitch, …); it is applied to *each* member of the selection/group
   - **Distribution** - How elements animate (From Start, Center, Edges, Random)
   - **Stagger (ms)** - Delay between each element starting
   - **Duration (ms)** - How long each animation lasts
   - **Easing** - Animation timing curve
4. **Preview** - Test the animation without saving
5. **Apply** - Save animations to elements (works in presentations)

:::tip Tip
The **Apply** button saves animations to each element with calculated delays, so they'll play correctly in presentation mode. Use **Clear All Animations** to remove animations from all selected elements.
:::

:::tip Groups & drawIn
Selecting a **group** is a multi-selection, so presets apply to every member. You can also use **Add Animation** to add a preset to the whole group at once. The **drawIn** / **drawOut** reveal works on vector paths and freehand strokes (fineliner, ink brush, marker) as well as shapes — the outline traces on progressively rather than just fading in.
:::

:::tip drawIn in Sketch style
In **Sketch** render style the reveal traces the shape's actual hand-drawn strokes, so it finishes on exactly the shape you'd see with no animation — there's no switch from a clean line to a sketchy one at the end. Edges draw one after another in the order a hand would draw them, and the two passes that give a sketch stroke its wobble reveal together rather than tracing the shape twice.

Keep a fixed **seed** on the element (the default) — a shape with a random seed re-rolls its wobble each frame and the reveal will shimmer. In **Architectural** style the reveal traces the clean geometric outline, as before.

Shapes that don't build their sketch geometry through the sketch engine fall back to the geometric-outline reveal automatically, so nothing ever fails to animate.
:::

### Stagger Distribution Modes

| Mode | Description |
| --- | --- |
| **start** | Sequential from first to last element (default) |
| **end** | Sequential from last to first element |
| **center** | Start from center, expand outward |
| **edges** | Start from edges, converge to center |
| **random** | Random order for organic feel |
| **number** | Start from specific index |

### Stagger Configuration

```
// Stagger from center with easing
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
);
```

### Random Utilities

```
// Random value in range
const delay = random(100, 500);  // 100-500ms

// Random integer
const count = randomInt(1, 10);  // 1-10

// Pick random from array
const easing = randomPick(['easeOutQuad', 'easeOutCubic', 'easeOutElastic']);

// Shuffle array
const shuffledIds = shuffle(elementIds);
```

## Easing Functions

Control the timing and feel of animations with easing functions:

| Category | Functions | Description |
| --- | --- | --- |
| **Linear** | linear | Constant speed, no acceleration |
| **Quadratic** | easeInQuad, easeOutQuad, easeInOutQuad | Gentle acceleration/deceleration |
| **Cubic** | easeInCubic, easeOutCubic, easeInOutCubic | More pronounced curve |
| **Exponential** | easeInExpo, easeOutExpo, easeInOutExpo | Dramatic start/end |
| **Bounce** | easeInBounce, easeOutBounce, easeInOutBounce | Bouncing ball effect |
| **Elastic** | easeInElastic, easeOutElastic | Spring-like overshoot |
| **Back** | easeInBack, easeOutBack | Overshoots then settles |
| **Spring** | easeSpring | Physics-based spring motion |

:::tip Tip: Choosing the Right Easing
**easeOut** - Best for entrances (fast start, gentle end)<br /> **easeIn** - Best for exits (gentle start, fast end)<br /> **easeInOut** - Best for emphasis or continuous motion<br /> **spring** - Best for natural, organic feel
:::

## Spring Physics

Create natural, physics-based motion using spring dynamics:

### Spring Parameters

| Parameter | Default | Description |
| --- | --- | --- |
| **stiffness** | 170 | Spring tension (100-300). Higher = snappier motion |
| **damping** | 26 | Friction/resistance (10-40). Higher = less bounce |
| **mass** | 1 | Object weight (0.5-2). Higher = slower, heavier feel |
| **velocity** | 0 | Initial velocity. Add momentum to the start |

### Using the API

```
// Create a custom spring
Yappy.animateElement(id, { x: 500 }, {
    easing: Yappy.createSpring(200, 20, 1, 0)
});

// Use default spring
Yappy.animateElement(id, { y: 300 }, {
    easing: 'easeSpring'
});
```

## Path Animation

Animate elements along any SVG path:

### Basic Usage

```
// Animate along a curved path
const pathData = "M 0 0 C 100 0 100 100 200 100";
Yappy.animateAlongPath(elementId, pathData, {
    duration: 2000,
    orientToPath: true,  // Auto-rotate to follow path
    isRelative: true     // Path is relative to element position
});
```

### Options

| Option | Default | Description |
| --- | --- | --- |
| **orientToPath** | false | Rotate element to follow path direction |
| **isRelative** | false | Treat path coordinates as relative to element |
| **startOffset** | 0 | Start position on path (0-1) |
| **endOffset** | 1 | End position on path (0-1) |

## Shape Morphing

Smoothly transform one shape into another:

```
// Morph a rectangle into an ellipse
Yappy.animateMorph(rectId, 'ellipse', {
    duration: 800,
    easing: 'easeInOutCubic'
});

// Supported shape targets:
// rectangle, ellipse, diamond, triangle, star, hexagon, etc.
```

:::tip Tip
For best results, morph between shapes with similar complexity. Morphing a simple rectangle to a complex star will work, but the intermediate frames may look unusual.
:::

## Keyframe Animation

Create precise, multi-step animations with keyframes:

```
// Animate X position through keyframes
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
], { duration: 1000, loop: true });
```

### Keyframe Properties

| Property | Description |
| --- | --- |
| **offset** | Position in timeline (0-1) |
| **value** | Target value at this keyframe |
| **easing** | Easing function to use when transitioning TO this keyframe |

## Animatable Properties

The following element properties can be animated:

| Property | Type | Description |
| --- | --- | --- |
| **x, y** | number | Position coordinates |
| **width, height** | number | Element dimensions |
| **opacity** | number | Transparency (0-100) |
| **angle** | number | Rotation in degrees |
| **strokeWidth** | number | Border thickness |
| **roughness** | number | Hand-drawn effect intensity |
| **drawProgress** | number | Progressive draw (0-1) |
| **strokeColor** | hex color | Border color |
| **backgroundColor** | hex color | Fill color |

## Recording & Export (MP4, WebM, GIF)

Open **Menu → Export** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+ <kbd>E</kbd>), pick **MP4 Video**, **WebM Video** or **Animated GIF**, set the **Duration** in seconds, and export. The file downloads when it's done.

### Two different things happen, depending on the document

This is the part worth knowing before you record — the same buttons behave differently on a presentation/design page than on the infinite canvas.

| Document | What you get |
| --- | --- |
| **Presentation or Design**<br />(pages) | An **offline render of the page** — exactly the page bounds at its own resolution, animations playing, with no workspace grey, no neighbouring pages, and no dependence on your current zoom or pan. You don't have to play anything: the export drives the animation clock itself. Runs for the duration you set, then stops. |
| **Infinite canvas** | A **live screen capture** of the canvas as you see it — your zoom, pan and anything you do while it runs. It keeps going until you stop it (see below), so the Duration field doesn't apply. The Export dialog offers no GIF here — there are no page bounds to frame one to — but the presentation toolbar's film button captures the viewport as a GIF just fine. |

:::tip
For a clean animation file, export from a **presentation or design page**. Use live capture when you want the recording to show what you're *doing* — a walkthrough, a demo, or the whole presentation played end to end.
:::

### Live screen capture

Start it from **Menu → Export → MP4/WebM** on an infinite-canvas document, or from a script with `Yappy.recordAnimation()`. A red **REC** badge with a timer appears at the top of the canvas — press its **Stop** button to finish and download.

It records the **canvas surface only**, at 60fps. Toolbars, panels, dialogs and the REC badge are normal page UI and never appear in the recording, so you get a clean picture of the drawing even while you work around it.

#### Recording a whole presentation

Press <kbd>F5</kbd> to present, then hit the **Record** button (a video camera) in the presentation toolbar at the bottom of the screen. It turns into a red **Stop** square — press it again to finish and download the MP4. Because it captures the canvas as you drive it, everything you do lands in the file: slide transitions, build steps, animations, laser pointer and ink annotations.

:::tip
Recording is the *only* way to capture a whole deck. The page export renders a single page, so it can't follow you across slides. The presentation toolbar stops auto-hiding while recording so the Stop button is always reachable.
:::

From a script you can also give it a fixed length, which stops and saves automatically:

```
Yappy.recordAnimation();           // runs until you Stop it
Yappy.recordAnimation(15, 'mp4');  // auto-stops after 15 seconds
Yappy.stopRecording();             // stop + download now
```

### Capturing a looping GIF

Next to Record is a **film** button that captures a looping GIF the same way: press it to start, press it again to stop and download. While it runs it shows the elapsed time and the file size as it grows — `0:04 · 210 KB` — because a GIF stores every frame whole, so length costs bytes directly.

It's start/stop rather than a fixed length on purpose. Animations fire on clicks, build steps and conditions, so there's usually no duration to pick in advance — and stopping by hand is what gives a clean loop: press Stop the moment the motion returns to where it began, and the join is invisible. Captures auto-stop at 60 seconds as a backstop.

:::tip
A GIF loops forever with no play button, scrubber or sound — which is exactly why it suits a README, a wiki page or a chat message. For anything longer or more detailed, record the MP4 instead: most social sites re-encode uploaded GIFs to video anyway.
:::

```
Yappy.startGifCapture();     // open-ended; auto-stops at 60s
Yappy.stopGifCapture();      // stop + download
Yappy.captureGif(5, 12);     // fixed 5s at 12fps, for unattended scripts
```

### Page export from a script

```
await Yappy.exportVideo(8, 'mp4');   // 8s MP4 of the ACTIVE page
await Yappy.exportVideo(8, 'webm');
await Yappy.exportGif(5, 24);        // 5s GIF at 24 fps
```

### Formats & limits

| Format | Use it for | Limits |
| --- | --- | --- |
| **MP4** (H.264) | Sharing anywhere — messaging apps, video editors, Windows/macOS players | Up to 120s; long side capped at 1920px |
| **WebM** (VP9) | The web; smaller files at the same quality | Up to 120s; long side capped at 1920px |
| **Animated GIF** | Loops forever; drops into docs, chat and README files with no player | Page export up to 30s; live capture up to 60s. Long side capped at 960px (GIFs get enormous beyond that); 256 colours. Frame rate is set in the export dialog (default 12 — 20–24 suits fast motion). |

:::tip
Recording a **time-lapse** of your drawing process is a separate feature — see *Menu → Record Time-lapse* (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+ <kbd>T</kbd>), not this export.
:::

## API Reference

Every method below lives on the global `window.Yappy` object, so you can drive animations from the browser console or a script (e.g. ` Yappy.animateElement(id, { x: 400 }, { duration: 800 })`).

| Method | Description |
| --- | --- |
| `animateElement(id, target, config)` | Animate element properties |
| `animateElements(ids, target, config, stagger)` | Animate multiple elements with stagger |
| `animateElementKeyframes(id, prop, keyframes, config)` | Keyframe animation |
| `animateAlongPath(id, pathData, config)` | Path animation |
| `animateMorph(id, targetShape, config)` | Shape morphing |
| `playEntranceAnimation(id, options?)` | Play the element's configured entrance animation |
| `playExitAnimation(id, options?)` | Play the element's configured exit animation |
| `stopAllElementAnimations(id)` | Stop all animations on element |
| `createSpring(stiffness, damping, mass, velocity)` | Create custom spring easing |
| `typewriter(id, duration, config)` | Letter-by-letter text reveal |
| `wordByWord(id, duration, config)` | Word-by-word text reveal |
| `textScramble(id, duration, config)` | Hacker decode text effect |
| `textCountUp(id, start, end, duration, config)` | Animated number counting |
| `lineByLine(id, duration, config)` | Line-by-line text reveal |
| `charByChar(id, duration, stagger, config)` | Per-character reveal with stagger |
| `animateElementsStagger(ids, target, config, stagger)` | Animate multiple elements with advanced stagger |
| `animateFrom(id, fromValues, config)` | Animate from specified values to current |
| `animateFromTo(id, from, to, config)` | Animate between two specified states |
| `animateElementsFrom(ids, from, config, stagger)` | Staggered "from" animation for multiple elements |
| `random(min, max)` | Generate random value in range |

## Click-to-Advance (Interactive Presentations)

Build step-by-step interactive presentations where each click reveals the next visual. Perfect for teaching CS concepts, explaining algorithms, or walking through diagrams.

### Animation Triggers

| Trigger | Description |
| --- | --- |
| **On Load** | Plays automatically when the slide loads or presentation starts |
| **On Click** | Plays when the presenter clicks (or presses Space/Enter/Arrow). Each "On Click" animation creates a new step |
| **After Previous** | Plays automatically after the previous animation finishes. Chains onto the same step |
| **With Previous** | Plays simultaneously with the previous animation. Runs in parallel within the same step |

### How to Build an Interactive Diagram

1. **Create your shapes** - Draw the elements of your diagram (works on both slides and infinite canvas)
2. **Add animations** - Select each element, open Animation Panel, and add a preset (e.g., fadeIn, slideInLeft)
3. **Set triggers** - For step-by-step reveals:

   - Set the first animation to **On Click** (Step 1)
   - Chain follow-up effects with **After Previous** (same step, sequential)
   - Run parallel effects with **With Previous** (same step, simultaneous)
   - Set the next reveal to **On Click** (Step 2), and so on
4. **Present** - Enter presentation mode (F5) and click/press Space to advance through each step

### Start Hidden

Each animation has a **"Start hidden in presentation"** checkbox. When enabled, the element is invisible when the presentation starts and only appears when its animation step fires. This is essential for step-by-step reveals.

**Smart default:** On Click animations default to start hidden (checked), while On Load animations default to visible (unchecked). You can override this per animation.

### Step Numbers in Animation Panel

Each animation shows a numbered badge indicating which click-step it belongs to. Blue badges mark **On Click** triggers (step boundaries), while dimmed badges show chained animations (After Previous / With Previous) that belong to the same step. Animations with **On Load** trigger show "auto" since they play immediately.

### Infinite Canvas Presentations

Click-to-advance works on both slides and infinite canvas mode. On infinite canvas:

- **Click** empty space to advance to the next animation step
- **Drag** to pan around the canvas
- The presentation HUD shows **Step X / Y** progress
- Use **Space**, **Enter**, or **Arrow Right** to advance
- Use **Arrow Left** or **Backspace** to go back

### Example: Teaching a Stack Data Structure

```
Step 1 (On Click):  Show empty stack frame       → fadeIn
Step 2 (On Click):  Push value "42"              → slideInDown
  (After Previous): Arrow points to top           → fadeIn
Step 3 (On Click):  Push value "17"              → slideInDown
  (With Previous):  Previous arrow moves down     → property animation (y)
  (After Previous): New arrow points to top       → fadeIn
Step 4 (On Click):  Pop value "17"               → slideOutUp
  (After Previous): Arrow updates                 → fadeIn
```

:::tip Tip: Presentation Advancement Order
When you click during a presentation, YappyDraw checks in this order: <br />1. **Display States** - If there are state transitions, advance to the next state <br />2. **Build Animations** - If there are pending On Click animations, play the next one <br />3. **Next Slide** - If all animations are done, move to the next slide
:::

## 3D Box Animations

Special animation presets for 3D shapes (openBox, solidBlock, etc.):

| Preset | Applies To | Description |
| --- | --- | --- |
| **boxLidOpen** | openBox | Opens the lid with overshoot and settle physics |
| **boxLidClose** | openBox | Smoothly closes the lid |
| **boxLidOpenClose** | openBox | Opens then closes the lid in a cycle. Supports looping for continuous animation |
| **boxRotateReveal** | All 3D shapes | Rotates the view angle to reveal the 3D form |
| **boxExplode** | All 3D shapes | Expands the shape outward with increased depth |
| **boxCollapse** | All 3D shapes | Shrinks the shape inward (reverse of explode) |
| **depthPulse** | All 3D shapes | Pulses the depth for a breathing effect |
| **isometricRotate** | isometricCube | Rotates the isometric cube faces |

### 3D View Angle Control

Use **Alt + Drag** on any 3D shape to interactively adjust its orientation:

- **Horizontal drag** - Changes the view angle (rotation direction)
- **Vertical drag** - Changes the depth (drag down for more depth, up for less)
- Hold **Shift** while dragging to snap to 5-degree / 5-unit increments

## Keyboard Shortcuts

:::shortcuts
Space | Play/Pause animation
Esc | Stop animation
Alt + S | Toggle Display States panel
:::
