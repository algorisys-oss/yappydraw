# Animation System

Yappy includes a powerful animation system for animating element properties with various easing functions and timeline sequencing.

## Quick Start

```javascript
const id = Yappy.createRectangle(100, 100, 100, 100);
Yappy.animateElement(id, { x: 400 }, { duration: 500, easing: 'easeOutBounce' });
```

## Preset Categories

| Category | Presets | Docs |
|----------|---------|------|
| **Basic** | fadeIn, fadeOut, scaleIn, scaleOut | [basic-presets.md](basic-presets.md) |
| **Attention Seekers** | bounce, pulse, shakeX, shakeY, headShake, swing, tada, wobble, jello, heartBeat | [attention-seekers.md](attention-seekers.md) |
| **Slides** | slideInLeft/Right/Up/Down, slideOutLeft/Right/Up/Down | [slide-presets.md](slide-presets.md) |
| **Text** | typewriter, typewriterCursor, wordByWord, textScramble, textDelete, textReplace, textCountUp, lineByLine, charByChar | [text-animations.md](text-animations.md) |
| **3D Box** | boxRotateReveal, boxLidOpen, boxLidClose, boxOpenReveal, boxExplode, boxCollapse, isometricRotate, depthPulse | [3d-box-animations.md](3d-box-animations.md) |
| **Glitch** | glitch | [glitch-effect.md](glitch-effect.md) |
| **Kinetic Typography** | kineticBounceIn, kineticDropIn, kineticScaleReveal, kineticSlideIn, kineticFadeUp | [kinetic-typography.md](kinetic-typography.md) |
| **Stagger & Multi-Element** | calculateStaggerDelays, animateElementsStagger, animateFrom, animateFromTo, animateElementsFrom | [stagger-utilities.md](stagger-utilities.md) |
| **Draw** | drawIn, drawOut | [draw-animation.md](draw-animation.md) |
| **Shape Morphing** | morphShape | [shape-morphing.md](shape-morphing.md) |
| **Auto Animate** | slide transitions | [auto-animate.md](auto-animate.md) |

## animateElement()

Animate any numeric or color property:

```javascript
Yappy.animateElement(elementId, targetProperties, config);
```

**Animatable properties:** `x`, `y`, `width`, `height`, `opacity`, `angle`, `strokeWidth`, `roughness`, `drawProgress`, `strokeColor`, `backgroundColor`

**Config options:**
| Option | Type | Description |
|--------|------|-------------|
| `duration` | number | Duration in milliseconds (required) |
| `easing` | string | Easing function name |
| `delay` | number | Delay before start (ms) |
| `loop` | boolean | Repeat the animation |
| `loopCount` | number | Number of loops |
| `alternate` | boolean | Ping-pong on loop |
| `onStart` | function | Called when started |
| `onComplete` | function | Called when finished |

## Easing Functions

Available easings: `linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInExpo`, `easeOutExpo`, `easeInOutExpo`, `easeOutBounce`, `easeInBounce`, `easeInOutBounce`, `easeOutElastic`, `easeInElastic`, `easeOutBack`, `easeInBack`

## Timeline

Sequence multiple animations:

```javascript
const timeline = Yappy.createTimeline();

timeline
  .add(() => Yappy.animateElement(id1, { x: 200 }, { duration: 300 }))
  .delay(100)
  .add(() => Yappy.animateElement(id2, { x: 300 }, { duration: 300 }))
  .parallel(
    () => Yappy.fadeIn(id3),
    () => Yappy.fadeIn(id4)
  )
  .play();

timeline.pause();
timeline.stop();
```

## Multiple Elements

Animate multiple elements with stagger:

```javascript
Yappy.animateElements(['id1', 'id2', 'id3'], { opacity: 50 }, { duration: 300 }, 100);
```

## Selective Conflict Resolution

Yappy uses smart property-based conflict resolution. Instead of stopping all animations on an element when a new one starts, it only stops animations that affect the **same properties**.

- **Simultaneous**: You can run `Auto Spin` (angle) and `ZoomIn` (x, y, width, height, opacity) at the same time.
- **Automatic Cleanup**: Starting `SlideIn` (x, y) while `Move` (x, y) is running stops the Move but leaves other animations (like Spin) alone.

### Conflict Properties Table

| Animation | Affected Properties |
|-----------|---------------------|
| Move / Slide | `x`, `y` |
| Resize / Zoom | `width`, `height`, `x`, `y` |
| Fade | `opacity` |
| Rotate / Spin | `angle` |
| Glitch | `x`, `y`, `opacity` |
| Morph | `points`, `type` |
| Path | `x`, `y`, `angle` (optional) |

## Animation Sequencing

The `trigger` property controls execution flow:

- `on-load`: Starts immediately when slide/canvas loads.
- `after-prev`: Waits for previous animation to finish.
- `with-prev`: Starts simultaneously with previous animation.

An animation with **Loop Infinitely** (`repeat: -1`) **blocks** `after-prev` successors. Use `with-prev` to run animations concurrently with infinite ones.

| Sequence | Behavior |
|----------|----------|
| pulse (infinite) → shakeX (after-prev) | Only pulse runs. shakeX never starts. |
| shakeX (finite) → pulse (infinite) | shakeX plays, finishes, then pulse loops forever. |
| shakeX (infinite) → autoSpin (with-prev) | Both start simultaneously and loop forever. |

## Looping and Iterations

- `iterations: N` — run N times, then trigger `onComplete`
- `repeat: -1` (Loop Infinitely) — loops until manually stopped
- **shakeX/shakeY**: Use `loopCount: Infinity` for infinite oscillation
- **bounce/pulse**: Recursively restart their multi-step cycle
- **Auto-Spin**: Has a separate Iterations dropdown (1/2/3/5/infinite)

## Advanced Control

### Restore State After Finish
- `restoreAfter: true`: Element reverts to pre-animation state on finish
- `restoreAfter: false`: Element stays at final animated values
- For infinite animations, `restoreAfter` has no effect during playback
- Persisted in animation JSON (standard boolean serialization)

## Performance Optimization

### Spatial Animation Culling
- **Slide Filtering**: Continuous animations only calculated for elements on the active slide
- **Dependency Awareness**: Off-slide animation dependencies are automatically included
- **Buffer Zone**: 200px spatial buffer prevents visible pop-in

## Stopping Animations

```javascript
const animId = Yappy.animateElement(id, { x: 500 }, { duration: 1000 });
Yappy.pauseElementAnimation(animId);
Yappy.resumeElementAnimation(animId);
Yappy.stopElementAnimation(animId);

sequenceAnimator.stopAll();
animationEngine.stopAll();
```
