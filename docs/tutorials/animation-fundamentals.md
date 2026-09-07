# Animation Fundamentals: From Interpolation to Spring Physics

> **A comprehensive guide to the mathematical principles and algorithms that power modern animation systems**

## Introduction

Every animation you see—from simple fades to complex morphing shapes—is built on fundamental mathematical principles. Whether you're using CSS animations, JavaScript libraries like GSAP or Framer Motion, or specialized tools like Manim for mathematical visualizations, the underlying concepts are universal.

This guide breaks down animation from first principles: interpolation, easing functions, timing, and physics-based motion. Once you understand these building blocks, you can create any animation effect in any framework.

---

## Table of Contents

1. [The Core Concept: Interpolation](#1-the-core-concept-interpolation)
2. [Time and Progress](#2-time-and-progress)
3. [Easing Functions](#3-easing-functions)
4. [Color Interpolation](#4-color-interpolation)
5. [Transform Animations](#5-transform-animations)
6. [Spring Physics](#6-spring-physics)
7. [Shape Morphing](#7-shape-morphing)
8. [Entrance and Exit Animations](#8-entrance-and-exit-animations)
9. [Keyframe Systems](#9-keyframe-systems)
10. [Advanced Effects](#10-advanced-effects)
11. [Lifecycle: Everything Around the Interpolation](#11-lifecycle-everything-around-the-interpolation)

---

## 1. The Core Concept: Interpolation

### What is Interpolation?

**Interpolation** is finding values *between* two known values. This is the heart of all animation.

```
Given:
- Start value (a) = 0
- End value (b) = 100
- Progress (t) = 0.5 (50% through animation)

Interpolated value = a + (b - a) * t
                    = 0 + (100 - 0) * 0.5
                    = 50
```

### Linear Interpolation (Lerp)

The fundamental formula for smooth transition:

```javascript
Pseudocode:
function lerp(start, end, progress):
  return start + (end - start) * progress

Examples:
lerp(0, 100, 0.0)  = 0     // 0% progress
lerp(0, 100, 0.25) = 25    // 25% progress  
lerp(0, 100, 0.5)  = 50    // 50% progress
lerp(0, 100, 1.0)  = 100   // 100% progress
```

**Visual Representation**:
```
Time:     0%      25%     50%     75%    100%
          ├────────┼────────┼────────┼────────┤
Value:    0       25      50      75      100
          ●        ●       ●       ●        ●
```

### Multi-Property Animation

Animate multiple properties simultaneously:

```javascript
Pseudocode:
function animateProperties(element, from, to, progress):
  element.x = lerp(from.x, to.x, progress)
  element.y = lerp(from.y, to.y, progress)
  element.opacity = lerp(from.opacity, to.opacity, progress)
  element.rotation = lerp(from.rotation, to.rotation, progress)

Example:
from = { x: 0, y: 0, opacity: 0, rotation: 0 }
to = { x: 100, y: 200, opacity: 1, rotation: 360 }
progress = 0.5

Result:
element.x = 50
element.y = 100
element.opacity = 0.5
element.rotation = 180
```

### ⚠️ Units: this guide vs. Yappy's element API

Interpolation does not care what units you use — `lerp` is the same formula for
degrees, radians, or percent. But **the endpoints you feed it must match whatever
consumes the result**, and the two conventions in this guide differ from Yappy's
element API. Copying an example verbatim will "work" while producing something
invisible or barely turned:

| Property   | This guide (DOM/CSS convention) | **Yappy element API**            |
|------------|---------------------------------|----------------------------------|
| `opacity`  | `0` → `1`                       | **`0` → `100`**                  |
| rotation   | degrees (`360`, `rotate(180deg)`) | **`angle`, in radians** (`2π`) |

So the CSS-flavoured `to = { opacity: 1, rotation: 360 }` used throughout these
examples becomes, against a real Yappy element:

```javascript
// Yappy: fully opaque is 100, and a full turn is 2π radians.
Yappy.animateElement(id, {
    to: { opacity: 100, angle: Math.PI * 2 },
    duration: 1000
});

// The same values written the DOM way would be a 1% opaque element
// turned by 360 radians (≈ 57 full spins).
```

Conversions, if you are porting values between the two:

```javascript
yappyOpacity = cssOpacity * 100        // 0.5  → 50
radians      = degrees * (Math.PI / 180)   // 180 → 3.14159…
```

The rest of this guide stays in the DOM convention (`0-1` opacity, degrees),
because that is what most animation literature and the CSS/GSAP examples use.
Where a section shows Yappy API calls, it uses Yappy's units and says so.

### Why This Matters

Every animation library uses interpolation under the hood. When you write:
- CSS: `transition: all 1s linear;`
- GSAP: `gsap.to(element, {x: 100, duration: 1})`
- Framer Motion: `animate={{x: 100}}`

They're all doing: `currentValue = lerp(startValue, endValue, progress)`

---

## 2. Time and Progress

### Converting Time to Progress

Animation engines convert elapsed time into a progress value (0 to 1):

```javascript
Pseudocode:
startTime = getCurrentTime()
duration = 1000  // milliseconds

function updateAnimation():
  currentTime = getCurrentTime()
  elapsedTime = currentTime - startTime
  progress = elapsedTime / duration
  
  // Clamp to [0, 1]
  if progress < 0:
    progress = 0
  if progress > 1:
    progress = 1
    animationComplete = true
  
  // Apply interpolation
  currentValue = lerp(startValue, endValue, progress)
```

**Timeline Visualization**:
```
Time:       0ms     250ms    500ms    750ms   1000ms
            ├────────┼────────┼────────┼────────┤
Progress:   0.0     0.25     0.5      0.75     1.0
```

### Delta Time (Frame-Independent Animation)

For smooth animation regardless of frame rate:

```javascript
Pseudocode:
lastFrameTime = getCurrentTime()

function gameLoop():
  currentTime = getCurrentTime()
  deltaTime = currentTime - lastFrameTime
  lastFrameTime = currentTime
  
  // Update animation by time elapsed
  elapsedTime += deltaTime
  progress = elapsedTime / duration
  
  // Use progress for interpolation
  currentValue = lerp(startValue, endValue, progress)
```

**Why Delta Time Matters**:
```
60 FPS game loop:
  deltaTime ≈ 16.67ms per frame
  After 10 frames: elapsedTime = 166.7ms

30 FPS game loop:
  deltaTime ≈ 33.33ms per frame
  After 5 frames: elapsedTime = 166.65ms

Same elapsed time, different frame counts!
```

### requestAnimationFrame Pattern

The standard web animation loop:

```javascript
Pseudocode (JavaScript-like):
startTime = null

function animate(timestamp):
  if startTime == null:
    startTime = timestamp
  
  elapsedTime = timestamp - startTime
  progress = min(elapsedTime / duration, 1.0)
  
  // Apply eased progress
  easedProgress = easeInOutCubic(progress)
  currentValue = lerp(startValue, endValue, easedProgress)
  
  // Update display
  render(currentValue)
  
  // Continue animation
  if progress < 1.0:
    requestAnimationFrame(animate)

// Start
requestAnimationFrame(animate)
```

---

## 3. Easing Functions

### The Problem with Linear

Linear animation feels mechanical and unnatural. Real-world objects accelerate and decelerate.

```
Linear (boring):
Speed: ━━━━━━━━━━━━━━━━ (constant)

Eased (natural):
Speed: ╱━━━━━━━━━━━━━╲  (accelerate → constant → decelerate)
```

### Easing Function Signature

An easing function transforms linear progress (0 to 1) into eased progress (0 to 1):

```javascript
Pseudocode:
function easeFunction(t):  // t is linear progress [0, 1]
  // Transform t
  return easedT  // still [0, 1] but with different curve
```

### Essential Easing Functions

#### 1. Ease In (Slow Start, Fast End)

```javascript
function easeInQuad(t):
  return t * t

function easeInCubic(t):
  return t * t * t

function easeInQuart(t):
  return t * t * t * t
```

**Visual Curve**:
```
Progress:
1.0 ┤                  ╭─
    │                ╭─
0.5 ┤              ╭─
    │           ╭──
0.0 ┼──────────
    0        0.5      1.0 (time)
    
Slow start → Fast end
```

#### 2. Ease Out (Fast Start, Slow End)

```javascript
function easeOutQuad(t):
  return t * (2 - t)

function easeOutCubic(t):
  return 1 - pow(1 - t, 3)

function easeOutQuart(t):
  return 1 - pow(1 - t, 4)
```

**Visual Curve**:
```
Progress:
1.0 ┼──────────
    │     ╰──╮
0.5 ┤        ╰╮
    │          ╰─╮
0.0 ┤            ╰─
    0        0.5      1.0 (time)
    
Fast start → Slow end
```

#### 3. Ease In-Out (Smooth Both Ends)

```javascript
function easeInOutCubic(t):
  if t < 0.5:
    return 4 * t * t * t
  else:
    return 1 - pow(-2 * t + 2, 3) / 2

function easeInOutQuad(t):
  if t < 0.5:
    return 2 * t * t
  else:
    return 1 - pow(-2 * t + 2, 2) / 2
```

**Visual Curve**:
```
Progress:
1.0 ┤         ╭──────
    │       ╭─
0.5 ┤     ╭─
    │   ╭─
0.0 ┼──
    0        0.5      1.0 (time)
    
Smooth acceleration and deceleration
```

#### 4. Elastic (Bouncy)

```javascript
function easeOutElastic(t):
  c4 = (2 * PI) / 3
  
  if t == 0:
    return 0
  if t == 1:
    return 1
  
  return pow(2, -10 * t) * sin((t * 10 - 0.75) * c4) + 1
```

**Visual Curve**:
```
Progress:
1.2 ┤      ╭╮
1.0 ┤    ╭─╯╰╮╭╮
0.8 ┤   ╱    ╰╯╰──
0.0 ┼──
    0        0.5      1.0 (time)
    
Overshoots then settles
```

#### 5. Bounce (Ball Dropping)

```javascript
function easeOutBounce(t):
  n1 = 7.5625
  d1 = 2.75
  
  if t < 1 / d1:
    return n1 * t * t
  else if t < 2 / d1:
    t -= 1.5 / d1
    return n1 * t * t + 0.75
  else if t < 2.5 / d1:
    t -= 2.25 / d1
    return n1 * t * t + 0.9375
  else:
    t -= 2.625 / d1
    return n1 * t * t + 0.984375
```

**Visual Curve**:
```
Progress:
1.0 ┼─╮  ╭╮╭╮╭──
    │ ╰──╯╰╯╰╯
0.5 ┤
    │
0.0 ┤
    0        0.5      1.0 (time)
    
Multiple bounces settling down
```

### Bezier Curves (Custom Easing)

CSS uses cubic Bezier curves for custom easing:

```javascript
// CSS: cubic-bezier(0.4, 0.0, 0.2, 1)

function cubicBezier(t, p0, p1, p2, p3):
  // Cubic Bezier formula
  u = 1 - t
  return (
    pow(u, 3) * p0 +
    3 * pow(u, 2) * t * p1 +
    3 * u * pow(t, 2) * p2 +
    pow(t, 3) * p3
  )

// For easing, p0=0, p3=1
function customEase(t, x1, y1, x2, y2):
  // Solve for t where bezier.x = t
  // Return bezier.y at that t
  // (Requires iterative solving, simplified here)
  return cubicBezierY(t, 0, y1, y2, 1)
```

### Using Easing Functions

```javascript
Pseudocode:
// Instead of linear:
currentValue = lerp(startValue, endValue, progress)

// Use eased progress:
easedProgress = easeInOutCubic(progress)
currentValue = lerp(startValue, endValue, easedProgress)

Example:
startValue = 0
endValue = 100
progress = 0.5  // Linear 50%

Linear:
  value = lerp(0, 100, 0.5) = 50

Eased (easeInOutCubic):
  easedProgress = easeInOutCubic(0.5) = 0.5  // Happens to be same
  
progress = 0.25:
  Linear: lerp(0, 100, 0.25) = 25
  Eased: lerp(0, 100, easeInOutCubic(0.25)) 
       = lerp(0, 100, 0.125) = 12.5
```

### Complete Reference: Every Easing Used in This Guide

Later sections call `easeIn`, `easeOut`, and `easeInBack`, which are conventional
shorthands rather than functions defined above. Here they are, so nothing in this
guide references something you cannot copy:

```javascript
// "easeIn" / "easeOut" with no family named are the QUADRATIC ones by
// convention — the cheapest curve that still reads as eased.
function easeIn(t):  return easeInQuad(t)     // t * t
function easeOut(t): return easeOutQuad(t)    // t * (2 - t)

// The "back" family overshoots the target and returns. easeOutBack (§8)
// overshoots at the END; easeInBack pulls BACKWARD first — anticipation,
// which is what makes an exit animation feel like a wind-up.
function easeInBack(t):
  c1 = 1.70158
  c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t

function easeInOutBack(t):
  c1 = 1.70158
  c2 = c1 * 1.525
  if t < 0.5:
    return (pow(2*t, 2) * ((c2 + 1) * 2*t - c2)) / 2
  return (pow(2*t - 2, 2) * ((c2 + 1) * (2*t - 2) + c2) + 2) / 2

// Mirror rule: any easeOutX can be derived from its easeInX, and vice versa.
function flip(easeFn):
  return (t) => 1 - easeFn(1 - t)

// So easeOutCubic === flip(easeInCubic). Implement one direction, get both.
```

**A caution about the `back` and `elastic` families:** they return values **outside
`0..1`** — that is the whole point of the overshoot. This is fine for scale and
position, but it will bite you on any **clamped** property:

- `opacity` eased with `easeOutBack` briefly exceeds 1 (or 100 in Yappy) and,
  depending on the renderer, either clips invisibly or throws.
- A `width` eased with `easeInBack` goes **negative** at the start of the
  animation — see the normalization discussion in the graphics guide.

Clamp the *value*, never the easing output, or you lose the overshoot everywhere
you actually wanted it:

```javascript
element.opacity = clamp(lerp(from, to, easeOutBack(t)), 0, 1)
```

---

## 4. Color Interpolation

### RGB Interpolation

Interpolate each color channel independently:

```javascript
Pseudocode:
function lerpColor(colorA, colorB, progress):
  r = lerp(colorA.r, colorB.r, progress)
  g = lerp(colorA.g, colorB.g, progress)
  b = lerp(colorA.b, colorB.b, progress)
  a = lerp(colorA.a, colorB.a, progress)
  
  return rgba(r, g, b, a)

Example:
from = rgba(255, 0, 0, 1)    // Red
to = rgba(0, 0, 255, 1)      // Blue
progress = 0.5

result:
  r = lerp(255, 0, 0.5) = 127.5
  g = lerp(0, 0, 0.5) = 0
  b = lerp(0, 255, 0.5) = 127.5
  a = lerp(1, 1, 0.5) = 1
  
  = rgba(128, 0, 128, 1)  // Purple
```

**Visual**:
```
Red     →    Purple    →    Blue
█████        █████          █████
(255,0,0)    (128,0,128)    (0,0,255)
```

### HSL Interpolation (Better for Hue)

For more natural color transitions:

```javascript
Pseudocode:
function lerpColorHSL(colorA, colorB, progress):
  // Convert RGB to HSL
  hslA = rgbToHsl(colorA)
  hslB = rgbToHsl(colorB)
  
  // Interpolate in HSL space
  h = lerpHue(hslA.h, hslB.h, progress)  // Special hue lerp
  s = lerp(hslA.s, hslB.s, progress)
  l = lerp(hslA.l, hslB.l, progress)
  
  // Convert back to RGB
  return hslToRgb(h, s, l)

// Hue wraps around 360°
function lerpHue(h1, h2, progress):
  diff = h2 - h1
  
  // Take shorter path around color wheel
  if abs(diff) > 180:
    if diff > 0:
      h1 += 360
    else:
      h2 += 360
  
  result = lerp(h1, h2, progress)
  
  // Wrap to [0, 360)
  return result % 360
```

**Why HSL is Better**:
```
RGB: Red → Blue goes through muddy colors
     (255,0,0) → (128,0,128) → (0,0,255)

HSL: Red → Blue goes through vibrant spectrum
     Hue: 0° → 180° → 360° (through cyan, green, etc.)
```

### Caveats Both Methods Share

**1. Hue's "shortest path" is a guess about intent.** Red → cyan is exactly 180°
apart, so the shorter path is a tie and the code above picks one arbitrarily —
users perceive it as the animation randomly choosing to go via green or via
magenta. If the route matters, let the caller specify the direction rather than
always taking the short way.

**2. Greys and blacks have no meaningful hue.** `rgbToHsl` on white, black, or any
grey returns `h = 0` (i.e. red) because hue is undefined at zero saturation. So
animating white → blue in HSL sweeps the hue from *red* to blue and passes through
orange, yellow and green on the way — an obviously wrong rainbow where the user
expected a straight fade. Guard it: when either endpoint has `s ≈ 0` or
`l ≈ 0 or 1`, copy the *other* colour's hue instead of interpolating it.

**3. Neither space is perceptually uniform.** Equal steps in RGB or HSL are not
equal steps to the eye — the midpoint of a light-to-dark fade looks too light,
because both spaces are defined on gamma-encoded values. For fades where this
matters, interpolate in **OKLCH** (or at minimum linear-light RGB): convert,
interpolate, convert back. This is exactly what CSS Color 4's
`color-mix(in oklch, …)` does.

**4. Alpha must be handled separately, and premultiplied.** Fading to
`transparent` where `transparent` is `rgba(0,0,0,0)` drags the colour toward black
as it fades, giving a visible dark tinge at the end. Interpolate toward the *same*
RGB with `a = 0`, not toward black.

**5. Parse before you lerp.** `"#f00"`, `"#ff0000"`, `"red"`, `"rgb(255 0 0)"` and
`"hsl(0 100% 50%)"` are all the same colour and none of them can be interpolated as
a string. Normalize to numeric channels at the *start* of the animation, not per
frame. Yappy's `lerpColor` (used by the keyframe runtime for any string-valued
property) expects hex.

**6. Mismatched types cannot be interpolated at all.** A keyframe track that goes
from a number to a colour string, or from a gradient to a solid, has no meaningful
in-between. Decide the fallback deliberately — Yappy's animator snaps at the
midpoint (`eased < 0.5 ? from : to`) rather than producing `NaN`.

---

## 5. Transform Animations

### Position (Translation)

Simple X/Y interpolation:

```javascript
Pseudocode:
from = { x: 0, y: 0 }
to = { x: 100, y: 200 }

function animate(progress):
  element.x = lerp(from.x, to.x, progress)
  element.y = lerp(from.y, to.y, progress)
```

### Rotation

Interpolate angles (watch for wrapping). **The examples below are in degrees**
because that is what CSS `rotate()` takes; on a Yappy element the same property is
`angle` **in radians**, so substitute `π` for `180` and `2π` for `360` throughout
(see the units callout in §1):

```javascript
Pseudocode:
function lerpRotation(angleA, angleB, progress):
  // Normalize angles to [0, 360)
  angleA = angleA % 360
  angleB = angleB % 360
  
  // Find shortest path
  diff = angleB - angleA
  
  if diff > 180:
    angleA += 360
  else if diff < -180:
    angleB += 360
  
  return lerp(angleA, angleB, progress) % 360

Example:
from = 350°
to = 10°

Without wrapping:
  lerp(350, 10, 0.5) = 180°  // Wrong! Goes the long way

With wrapping:
  diff = 10 - 350 = -340°
  Since diff < -180: to += 360 → 370°
  lerp(350, 370, 0.5) = 360° = 0°  // Correct!
```

**Visual**:
```
Rotation path:
    0° (North)
    │
350°┤ ↻  ┌─10°
    │   │
    └───┘
    
Shortest path: 350° → 360° → 10° (20° rotation)
Not: 350° → 180° → 10° (340° rotation)
```

**The radian version**, for animating a Yappy element's `angle` directly —
identical logic, with `π` where `180` was and `2π` where `360` was:

```javascript
Pseudocode:
const TAU = Math.PI * 2;

function lerpAngleRadians(a, b, progress):
  diff = ((b - a) % TAU + TAU + Math.PI) % TAU - Math.PI   // wrap to [-π, π]
  return a + diff * progress
```

**When you do NOT want the shortest path:** shortest-path wrapping makes
"spin three times" impossible — `0 → 6π` normalizes to `0 → 0` and nothing moves.
Wrap only when you are interpolating an *orientation* (point this arrow at that
thing); interpolate the raw numbers when the number of turns is the point.

### Scale

Interpolate scale factors:

```javascript
Pseudocode:
function animateScale(progress):
  scale = lerp(1.0, 2.0, easeOutElastic(progress))
  
  element.scaleX = scale
  element.scaleY = scale
```

**Bounce Scale Effect**:
```
Scale over time (with elastic easing):
2.0 ┤      ╭╮
    │    ╭─╯╰╮
1.5 ┤   ╱    ╰╮
    │  ╱      ╰╮
1.0 ┼──        ╰─
```

### Combined Transforms

Animate multiple transforms together:

```javascript
Pseudocode:
function animateTransform(progress):
  easedProgress = easeInOutCubic(progress)
  
  x = lerp(0, 100, easedProgress)
  y = lerp(0, 50, easedProgress)
  rotation = lerp(0, 360, easedProgress)
  scale = lerp(0.5, 1.5, easedProgress)
  opacity = lerp(0, 1, easedProgress)
  
  applyTransforms(element, x, y, rotation, scale, opacity)
```

---

## 6. Spring Physics

### What are Springs?

**Spring animations** don't use duration—they use physics! Objects move with *acceleration* and *velocity* until they settle at the target.

```
Traditional easing:
  Position ──────────► Target (arrives at t=duration)

Spring physics:
  Position ~~~○~~~○~~~○~~○~○~●  (oscillates then settles)
  (Velocity and damping determine motion)
```

### Spring Physics Equations

Based on **Hooke's Law** and **damping**:

```javascript
Pseudocode:
// Spring parameters
stiffness = 100      // How "tight" the spring is
damping = 10         // Resistance to motion
mass = 1             // Object mass

// State
position = currentPosition
velocity = 0
target = targetPosition

function updateSpring(deltaTime):
  // Spring force: F = -k * x (Hooke's Law)
  springForce = -stiffness * (position - target)
  
  // Damping force: F = -d * v
  dampingForce = -damping * velocity
  
  // Total force
  force = springForce + dampingForce
  
  // Acceleration: F = ma → a = F/m
  acceleration = force / mass
  
  // Update velocity and position (Euler integration)
  velocity += acceleration * deltaTime
  position += velocity * deltaTime
  
  return position
```

**Step-by-Step Example**:
```
Initial state:
  position = 0
  target = 100
  velocity = 0

Frame 1 (deltaTime = 0.016s):
  springForce = -100 * (0 - 100) = 10000
  dampingForce = -10 * 0 = 0
  acceleration = 10000 / 1 = 10000
  velocity = 0 + 10000 * 0.016 = 160
  position = 0 + 160 * 0.016 = 2.56
  
Frame 2:
  springForce = -100 * (2.56 - 100) = 9744
  dampingForce = -10 * 160 = -1600
  acceleration = (9744 - 1600) / 1 = 8144
  velocity = 160 + 8144 * 0.016 = 290.3
  position = 2.56 + 290.3 * 0.016 = 7.2
  
... continues until velocity ≈ 0 and position ≈ 100
```

### ⚠️ Two things that will break this in production

**1. Units must be consistent — and `deltaTime` is the usual culprit.** The
example uses `deltaTime = 0.016` (**seconds**), but `requestAnimationFrame` hands
you timestamps in **milliseconds**, so `now - last` is `16`, not `0.016`. Feed
milliseconds into these equations and every force is scaled by 1000: the spring
diverges to infinity within a few frames and your element vanishes off-canvas.
Convert once, at the top of the frame:

```javascript
deltaTime = (now - lastTime) / 1000     // ms → seconds
```

Stiffness and damping are then in units per second, which is what the
`stiffness = 170, damping = 26` style presets everyone quotes assume.

**2. Explicit Euler is only conditionally stable — clamp the timestep.** The
integration above assumes acceleration is constant across the step. That holds for
a small `deltaTime`; past roughly `2/√(k/m)` the correction overshoots further than
the error it was correcting, so each frame amplifies the last and the spring
**explodes** rather than settles.

This is not a theoretical concern, because `deltaTime` is not under your control:

- A **background tab** throttles `requestAnimationFrame` to ~1 fps or pauses it
  entirely. Returning to the tab delivers one frame with `deltaTime` of *seconds*.
- A **long GC pause, a heavy re-layout, or a slow machine** produces occasional
  spikes of 100-500 ms.

The symptom is distinctive: everything is fine until you switch tabs, and on
return elements shoot off-screen or freeze at absurd coordinates. Two defences,
and you want both:

```javascript
// a) Clamp: never integrate a step larger than ~2 frames at 30fps.
deltaTime = min(deltaTime, 0.064)

// b) Sub-step: split a large step into several small, stable ones so a
//    slow frame stays accurate instead of merely not-exploding.
STEP = 1/120
while (remaining > 0):
  h = min(STEP, remaining)
  integrate(h)
  remaining -= h
```

Clamping alone silently makes the animation run in slow motion during a stall;
sub-stepping keeps the simulation honest. Also add an explicit **rest check** —
`abs(velocity) < 0.01 and abs(position - target) < 0.01` — then snap to the target
and stop, or the spring keeps burning frames converging by ever-smaller amounts and
never quite finishes.

### Two Ways to Build a Spring: Simulated vs. Closed-Form

Everything above **simulates** the spring: state carries frame to frame, and the
animation ends when it settles rather than at a known time. That is the right
model for **interruptible, gesture-driven** motion — a dragged card that must
retarget mid-flight inherits its current velocity and continues naturally.

The alternative is to solve the damped-oscillator equation **analytically**:
given `t` in `0..1`, return the position directly, no state and no integration.
That turns a spring into an ordinary easing function, which means it drops into
any duration-based animation system unchanged.

**Yappy takes the closed-form route** — `createSpring(stiffness, damping, mass, velocity)`
in [`animation-types.ts`](../../frontend/src/utils/animation/animation-types.ts)
returns an `EasingFunction`, evaluating the under-damped, critically-damped, or
over-damped solution depending on the damping ratio ζ. The trade-offs:

| | Simulated (Euler) | Closed-form (Yappy) |
|---|---|---|
| Timestep stability | Can explode; needs clamping/sub-stepping | **Immune** — no integration at all |
| Frame-rate dependence | Result varies with frame timing | **Deterministic** — vital for frame-exact export |
| Duration | Unknown until it settles | Fixed and known up front |
| Interruption | Natural — carries live velocity | Needs an explicit re-target with a new initial velocity |
| Scrubbing / seeking | Must re-simulate from the start | **O(1)** — evaluate at any `t` |

If your animations are timeline-based, exportable, or scrubbable, prefer
closed-form. Reach for simulation when motion must respond continuously to input
that arrives mid-animation.

### Configurable Spring Feel

Different spring parameters create different feels:

```javascript
// Bouncy spring (low damping)
stiffness = 200
damping = 10
// Result: ~~~○~○~~○~~~○~~~~● (lots of oscillation)

// Gentle spring (high damping)
stiffness = 200
damping = 50
// Result: ╱──────● (smooth settle, little overshoot)

// Slow spring (low stiffness)
stiffness = 50
damping = 10
// Result: ╱~~~~~~~○~~~● (slow approach)

// Snappy spring (high stiffness + high damping)
stiffness = 400
damping = 40
// Result: ╱──● (quick, minimal overshoot)
```

### Critical Damping

The *perfect* damping where there's no oscillation but maximum speed:

```javascript
Pseudocode:
criticalDamping = 2 * sqrt(stiffness * mass)

// Underdamped (damping < critical): Bouncy
// Critically damped (damping = critical): Perfect
// Overdamped (damping > critical): Sluggish
```

**Visual Comparison**:
```
Target = 100

Underdamped:
100 ┤    ╭╮  ╭╮
    │  ╭─╯╰──╯╰──
  0 ┼──
  
Critically Damped:
100 ┤    ╭─────
    │  ╭─
  0 ┼──

Overdamped:
100 ┤        ╭───
    │     ╭──
  0 ┼─────
```

### Presets (Like Framer Motion)

```javascript
// Common spring presets
const springPresets = {
  // Smooth
  gentle: { stiffness: 120, damping: 14 },
  
  // Playful
  wobbly: { stiffness: 180, damping: 12 },
  
  // Fast
  snappy: { stiffness: 400, damping: 30 },
  
  // Slow
  molasses: { stiffness: 80, damping: 20 }
}
```

---

## 7. Shape Morphing

### What is Morphing?

Smoothly transforming one shape into another.

```
Circle → Square:
  ●        ●●        ▄●▄       ▄▄▄       ███
           ●●        ███       ███       ███
                                          
Frames:   0%       25%       50%       75%      100%
```

### SVG Path Morphing

SVG paths can morph if they have the **same number of points**:

```javascript
Pseudocode:
// Two paths with same point count
pathA = "M 50,50 L 100,50 L 100,100 L 50,100 Z"  // Square
pathB = "M 75,25 L 125,75 L 75,125 L 25,75 Z"    // Diamond

// Extract points
pointsA = [[50,50], [100,50], [100,100], [50,100]]
pointsB = [[75,25], [125,75], [75,125], [25,75]]

function morphPath(progress):
  morphedPoints = []
  
  for i in range(pointsA.length):
    x = lerp(pointsA[i].x, pointsB[i].x, progress)
    y = lerp(pointsA[i].y, pointsB[i].y, progress)
    morphedPoints.push([x, y])
  
  return buildPath(morphedPoints)
```

**Point-by-Point Interpolation**:
```
Square (4 points):          Diamond (4 points):
1●──────●2                     ●2
 │      │                     ╱ ╲
 │      │                    ╱   ╲
4●──────●3                 1●     ●3
                             ╲   ╱
                              ╲ ╱
                               ●4

At 50% progress:
Each point is halfway between positions
```

### Point Matching Problem

Different shapes have different point counts:

```
Triangle (3 points) → Square (4 points)
Problem: Can't interpolate 3 points to 4 points directly!

Solution: Add intermediate points
Triangle: A, B, C
Add point: A, B, B', C (now 4 points)

Or use curve subdivision to match point counts
```

### Bézier Curve Morphing

Morph control points of curves:

```javascript
Pseudocode:
// Cubic Bézier: 4 control points
curveA = [P0, P1, P2, P3]
curveB = [Q0, Q1, Q2, Q3]

function morphCurve(progress):
  P0_morphed = lerp(curveA.P0, curveB.Q0, progress)
  P1_morphed = lerp(curveA.P1, curveB.Q1, progress)
  P2_morphed = lerp(curveA.P2, curveB.Q2, progress)
  P3_morphed = lerp(curveA.P3, curveB.Q3, progress)
  
  return cubicBezier(P0_morphed, P1_morphed, P2_morphed, P3_morphed)
```

### Number/Text Morphing

Morph individual digits or letters:

```javascript
Pseudocode:
function morphNumber(from, to, progress):
  current = lerp(from, to, progress)
  
  // Optional: Round to integers for counting effect
  return round(current)

Example:
from = 0
to = 1000
progress = 0.5

result = lerp(0, 1000, 0.5) = 500

// With easing:
easedProgress = easeOutQuad(0.5) = 0.75
result = lerp(0, 1000, 0.75) = 750
```

**Animated Counter**:
```
Frame 0:   0
Frame 1:   42
Frame 2:   156
Frame 3:   398
Frame 4:   721
Frame 5:   942
Frame 6:   1000
```

---

## 8. Entrance and Exit Animations

### Entrance Animations

#### 1. Fade In

```javascript
Pseudocode:
function fadeIn(progress):
  opacity = lerp(0, 1, easeOut(progress))
  element.style.opacity = opacity
```

#### 2. Slide In

```javascript
Pseudocode:
// Slide from left
function slideInLeft(progress):
  x = lerp(-100, 0, easeOutCubic(progress))  // percent
  element.style.transform = `translateX(${x}%)`
  
// Slide from top
function slideInTop(progress):
  y = lerp(-100, 0, easeOutCubic(progress))
  element.style.transform = `translateY(${y}%)`
```

#### 3. Scale In (Pop)

```javascript
Pseudocode:
function scaleIn(progress):
  scale = lerp(0, 1, easeOutBack(progress))
  element.style.transform = `scale(${scale})`

// easeOutBack creates slight overshoot
function easeOutBack(t):
  c1 = 1.70158
  c3 = c1 + 1
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)
```

**Scale with Overshoot**:
```
Scale:
1.1 ┤    ╭╮
1.0 ┤   ╱ ╰──
0.5 ┤  ╱
0.0 ┼──
    0      1.0 (progress)
```

#### 4. Rotate In

```javascript
Pseudocode:
function rotateIn(progress):
  rotation = lerp(180, 0, easeOutCubic(progress))
  opacity = lerp(0, 1, progress)
  
  element.style.transform = `rotate(${rotation}deg)`
  element.style.opacity = opacity
```

#### 5. Blur In

```javascript
Pseudocode:
function blurIn(progress):
  blur = lerp(20, 0, easeOut(progress))  // pixels
  opacity = lerp(0, 1, progress)
  
  element.style.filter = `blur(${blur}px)`
  element.style.opacity = opacity
```

### Exit Animations

Exit animations are typically the *reverse* of entrance:

```javascript
Pseudocode:
// Fade out (reverse of fade in)
function fadeOut(progress):
  opacity = lerp(1, 0, easeIn(progress))
  element.style.opacity = opacity

// Slide out right (reverse of slide in left)
function slideOutRight(progress):
  x = lerp(0, 100, easeInCubic(progress))
  element.style.transform = `translateX(${x}%)`

// Scale out
function scaleOut(progress):
  scale = lerp(1, 0, easeInBack(progress))
  element.style.transform = `scale(${scale})`
```

### Stagger Animations

Animate multiple elements with delay:

```javascript
Pseudocode:
elements = [elem1, elem2, elem3, elem4]
staggerDelay = 100  // ms between each element

function animateStaggered(elapsedTime):
  for i in range(elements.length):
    // Each element starts after delay
    elementStartTime = i * staggerDelay
    elementElapsed = elapsedTime - elementStartTime
    
    if elementElapsed > 0:
      progress = min(elementElapsed / duration, 1.0)
      animateElement(elements[i], progress)
```

**Visual Stagger**:
```
Element 1: ━━━━━━━━━━
Element 2:   ━━━━━━━━━━
Element 3:     ━━━━━━━━━━
Element 4:       ━━━━━━━━━━

Time:      100 200 300 400 500 600 (ms)
```

### Coordinated Entrance

Multiple properties animated together:

```javascript
Pseudocode:
function entranceCombo(progress):
  // Opacity: 0 → 1
  opacity = lerp(0, 1, easeOut(progress))
  
  // Y position: 50px below → 0
  y = lerp(50, 0, easeOutCubic(progress))
  
  // Scale: 0.8 → 1
  scale = lerp(0.8, 1, easeOutBack(progress))
  
  // Blur: 10px → 0px
  blur = lerp(10, 0, easeOut(progress))
  
  element.style.opacity = opacity
  element.style.transform = `translateY(${y}px) scale(${scale})`
  element.style.filter = `blur(${blur}px)`
```

---

## 9. Keyframe Systems

### What are Keyframes?

Define specific values at specific times, interpolate between them.

```
Keyframes:
Time:  0%        30%         70%        100%
       ├─────────┼───────────┼──────────┤
X:     0         100         100        200
Y:     0         0           100        100
       ●─────────●           ●          ●
                  ╲          │
                   ╲         │
                    ╰────────╯
```

### Keyframe Data Structure

```javascript
Pseudocode:
keyframes = [
  { time: 0.0, x: 0, y: 0, scale: 1, opacity: 0 },
  { time: 0.3, x: 100, y: 0, scale: 1.2, opacity: 1 },
  { time: 0.7, x: 100, y: 100, scale: 1, opacity: 1 },
  { time: 1.0, x: 200, y: 100, scale: 1, opacity: 0 }
]
```

### Keyframe Interpolation

Find which keyframes to interpolate between:

```javascript
Pseudocode:
function getValueAtTime(keyframes, property, progress):
  // Find surrounding keyframes
  previousKeyframe = null
  nextKeyframe = null
  
  for i in range(keyframes.length):
    if keyframes[i].time <= progress:
      previousKeyframe = keyframes[i]
    if keyframes[i].time > progress and nextKeyframe == null:
      nextKeyframe = keyframes[i]
      break
  
  // Handle edge cases
  if previousKeyframe == null:
    return keyframes[0][property]
  if nextKeyframe == null:
    return keyframes[keyframes.length - 1][property]
  
  // Calculate local progress between keyframes
  timeRange = nextKeyframe.time - previousKeyframe.time
  localProgress = (progress - previousKeyframe.time) / timeRange
  
  // Interpolate
  startValue = previousKeyframe[property]
  endValue = nextKeyframe[property]
  
  return lerp(startValue, endValue, localProgress)
```

**Example Calculation**:
```
Keyframes:
  [0.0, x=0], [0.3, x=100], [1.0, x=200]

Query: x at progress=0.5

Step 1: Find surrounding keyframes
  previous = [0.3, x=100]
  next = [1.0, x=200]

Step 2: Local progress
  timeRange = 1.0 - 0.3 = 0.7
  localProgress = (0.5 - 0.3) / 0.7 = 0.286

Step 3: Interpolate
  x = lerp(100, 200, 0.286) = 128.6
```

### Per-Keyframe Easing

Each keyframe *segment* can have its own easing. Before writing any code, settle
the question that trips up every keyframe implementation:

> **A keyframe is a point; easing describes a segment between two points. So which
> of the two keyframes owns the easing for the span between them?**

Both answers work, but they are not interchangeable, and mixing them within one
codebase produces animations whose curves are shifted by one segment — a bug that
looks like "the easing is nearly right but the timing feels off".

```
             segment A          segment B
      K0 ─────────────────► K1 ─────────────────► K2

  OUTGOING convention: segment A uses K0's easing  (CSS: animation-timing-function)
  INCOMING convention: segment A uses K1's easing  (After Effects, and Yappy)
```

**Yappy uses the INCOMING convention**: the segment entering a keyframe is eased by
*that* keyframe's easing. `TimedKeyframe.ease` in
[`motion-types.ts`](../../frontend/src/types/motion-types.ts) documents it as
"segment ENTERING this keyframe", and the runtime in
[`element-animator.ts`](../../frontend/src/utils/animation/element-animator.ts)
reads `getEasing(next.easing)` when interpolating from `curr` to `next`.

So the correct code is:

```javascript
Pseudocode:
keyframes = [
  { time: 0.0, x: 0,   easing: null },        // nothing enters the first key
  { time: 0.5, x: 100, easing: "easeOut" },   // eases the 0.0 → 0.5 segment
  { time: 1.0, x: 200, easing: "easeInOut" }  // eases the 0.5 → 1.0 segment
]

function interpolateKeyframe(prev, next, localProgress):
  // INCOMING: the easing belongs to the keyframe we are moving TOWARD.
  easedProgress = applyEasing(localProgress, next.easing)

  return lerp(prev.x, next.x, easedProgress)
```

Consequences worth internalising:

- **The first keyframe's easing is meaningless** — no segment enters it. (Under the
  outgoing convention it is the *last* keyframe's that is ignored.) Do not silently
  drop it on load; a user who set it will expect it back when they re-open the file.
- **CSS is the other convention.** `animation-timing-function` declared inside a
  `0% { }` block eases the segment *leaving* 0%. When importing CSS keyframes
  (next section), shift each easing forward by one keyframe or every curve lands on
  the wrong span.
- **A "hold" (stepped) keyframe follows the same rule** — Yappy's `hold` flag means
  the segment *entering* this key keeps the previous value and then jumps.

### CSS Keyframes Translation

CSS `@keyframes` work the same way:

```css
@keyframes slideAndFade {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  50% {
    transform: translateX(100px);
    opacity: 1;
  }
  100% {
    transform: translateX(200px);
    opacity: 0;
  }
}
```

Corresponds to:
```javascript
keyframes = [
  { time: 0.0, x: 0, opacity: 0 },
  { time: 0.5, x: 100, opacity: 1 },
  { time: 1.0, x: 200, opacity: 0 }
]
```

---

## 10. Advanced Effects

### Shake Animation

Oscillate position with decreasing amplitude:

```javascript
Pseudocode:
function shake(progress, intensity, frequency):
  // Amplitude decreases over time
  amplitude = intensity * (1 - progress)
  
  // Oscillate using sine wave
  offset = amplitude * sin(progress * frequency * 2 * PI)
  
  return offset

Example usage:
function animateShake(progress):
  offset = shake(progress, intensity=10, frequency=4)
  element.x = baseX + offset

// Result:
// ╭╮╭╮
// ╰╯╰╯╮╭╮╭
//     ╰╯╰╯─
```

**Parameters**:
- `intensity`: Maximum shake distance (pixels)
- `frequency`: Number of shakes per animation
- Amplitude decreases: `10 → 8 → 5 → 2 → 0`

### Wave Animation

Create traveling wave effect:

```javascript
Pseudocode:
function wave(x, time, amplitude, wavelength, speed):
  // Sine wave formula
  offset = amplitude * sin((x / wavelength - time * speed) * 2 * PI)
  return offset

// Apply to multiple elements
function animateWave(elements, time):
  for i in range(elements.length):
    x = i * spacing
    offset = wave(x, time, amplitude=20, wavelength=100, speed=2)
    elements[i].y = baseY + offset
```

**Visual Wave**:
```
Frame 1:    ╭─╮   ╭─╮
           ╱   ╰─╯   ╰

Frame 2:  ╭─╮   ╭─╮   
         ╱   ╰─╯   ╰─

Frame 3:╮   ╭─╮   ╭─╮
        ╰─╯   ╰─╯   ╰
```

### Parallax Scrolling

Different layers move at different speeds:

```javascript
Pseudocode:
layers = [
  { element: background, speed: 0.2 },   // Slow
  { element: midground, speed: 0.5 },    // Medium
  { element: foreground, speed: 1.0 }    // Fast (normal)
]

function updateParallax(scrollPosition):
  for layer in layers:
    offset = scrollPosition * layer.speed
    layer.element.y = -offset
```

**Depth Effect**:
```
Scroll distance: 100px

Background:   20px (0.2x) →  feels far
Midground:    50px (0.5x) →  middle depth
Foreground:  100px (1.0x) →  feels close
```

### Elastic Overshoot

Overshoot target then settle:

```javascript
Pseudocode:
function easeOutElastic(t, amplitude=1, period=0.3):
  if t == 0 or t == 1:
    return t
  
  s = period / 4
  return (
    amplitude * 
    pow(2, -10 * t) * 
    sin((t - s) * (2 * PI) / period) + 
    1
  )

Usage:
position = lerp(0, 100, easeOutElastic(progress))

// Result:
//     ╭╮
// ───╱ ╰╮╭╮
//       ╰╯╰──
```

### Inertia / Momentum

Continue motion after input stops:

```javascript
Pseudocode:
velocity = 0
friction = 0.9  // 0-1, higher = less friction

function updateInertia(deltaX, deltaTime):
  // Apply input
  velocity += deltaX / deltaTime
  
  // Apply friction
  velocity *= friction
  
  // Update position
  position += velocity * deltaTime
  
  // Stop when very slow
  if abs(velocity) < 0.1:
    velocity = 0

Visual:
Input stops here ↓
━━━━━━━━━━━━━━━╮
                ╰──╮
                   ╰─╮
                     ╰─  (coasts to stop)
```

### Path Following

Animate along a curve:

```javascript
Pseudocode:
// Define path as series of points
path = [
  {x: 0, y: 0},
  {x: 50, y: 100},
  {x: 150, y: 120},
  {x: 200, y: 50}
]

function getPointOnPath(path, progress):
  // Total segments
  totalSegments = path.length - 1
  
  // Which segment? (0 to totalSegments-1)
  segmentFloat = progress * totalSegments
  segmentIndex = floor(segmentFloat)
  segmentProgress = segmentFloat - segmentIndex
  
  // Clamp to last segment
  if segmentIndex >= totalSegments:
    return path[path.length - 1]
  
  // Interpolate within segment
  start = path[segmentIndex]
  end = path[segmentIndex + 1]
  
  x = lerp(start.x, end.x, segmentProgress)
  y = lerp(start.y, end.y, segmentProgress)
  
  return {x, y}
```

**⚠️ This moves at an uneven speed.** It divides *progress* equally among segments,
not among *distance* — so every segment gets the same slice of time no matter how
long it is. On the path above, the object covers 112 units in the first third of
the animation and 50 in the last third, i.e. it visibly races along the long legs
and crawls through the short ones:

```
Equal TIME per segment (above):     Equal DISTANCE per unit time (below):

●─────────────●──●────────●         ●────●────●────●────●────●
 ↑ long, fast   ↑ short, slow        ↑ uniform speed throughout
```

It also **lurches at every corner**, because the direction changes instantly while
the speed does not. Good enough for a simple primer; wrong for anything that reads
as a vehicle, a camera, or a character.

The fix is **arc-length parameterization**: measure the path once, then look up
position by distance travelled rather than by segment index.

```javascript
Pseudocode:
// 1. ONCE, when the path changes — build a cumulative length table.
function buildArcTable(path):
  lengths = [0]
  total = 0
  for i from 1 to path.length - 1:
    total += distance(path[i-1], path[i])
    lengths.append(total)
  return { lengths, total }

// 2. PER FRAME — binary-search the table for the target distance.
function getPointAtDistance(path, table, progress):
  target = progress * table.total

  i = binarySearch(table.lengths, target)     // last index with length <= target
  if i >= path.length - 1: return last(path)

  segLength = table.lengths[i+1] - table.lengths[i]
  localT = segLength == 0 ? 0 : (target - table.lengths[i]) / segLength

  return {
    x: lerp(path[i].x, path[i+1].x, localT),
    y: lerp(path[i].y, path[i+1].y, localT)
  }
```

Build the table once and cache it — recomputing it every frame turns an O(log n)
lookup into O(n) and defeats the point.

**For curves rather than polylines**, there is no closed-form arc length for a
cubic Bézier, so the standard approach is to *flatten* the curve into many short
line segments (sampling `t` at, say, 100 steps), then apply exactly the table
above. Accuracy is set by the sample count; 100 samples per curve is plenty for
screen-scale motion.

**Orienting the object along the path** — rotating a plane or arrow to face its
direction of travel — falls out of the same machinery: sample slightly ahead and
take `atan2(ahead.y - here.y, ahead.x - here.x)`. Sample *ahead* rather than using
the current segment's direction, or the rotation snaps at each corner instead of
turning through it.

### Orchestration (Sequences)

Run animations in sequence or parallel:

```javascript
Pseudocode:
// Sequential timeline
timeline = [
  { animation: fadeIn, start: 0, duration: 500 },
  { animation: slideIn, start: 500, duration: 800 },
  { animation: scaleUp, start: 1300, duration: 400 }
]

function updateTimeline(elapsedTime):
  for item in timeline:
    if elapsedTime >= item.start:
      animTime = elapsedTime - item.start
      if animTime <= item.duration:
        progress = animTime / item.duration
        item.animation(progress)

// Parallel (all at once)
function updateParallel(progress):
  fadeIn(progress)
  slideIn(progress)
  scaleUp(progress)
```

---

## 11. Lifecycle: Everything Around the Interpolation

Sections 1-10 cover how a value gets from A to B. In a real application that is
perhaps a third of the work — the rest is deciding when an animation starts, what
happens when another one interrupts it, and how it cleans up. These are the parts
that turn into bugs long after the motion itself looks right.

### Delay, Loop, and Ping-Pong

Three parameters cover most timing needs. All three exist in Yappy's
`AnimationConfig`:

```javascript
Pseudocode:
function progressAt(elapsed, config):
  // 1. DELAY — nothing happens, but the animation is "running".
  t = elapsed - config.delay
  if t < 0: return null            // null, not 0 — see the trap below

  // 2. LOOP — how many times round.
  cycle = floor(t / config.duration)
  if cycle >= config.loopCount: return 1.0     // finished; hold the end

  localT = (t % config.duration) / config.duration

  // 3. ALTERNATE (ping-pong) — reverse every odd cycle.
  if config.alternate and cycle is odd:
    localT = 1 - localT

  return localT
```

**The delay trap:** returning `0` during the delay is not the same as returning
`null`. Progress `0` *applies the start value*, which yanks the element to its
starting position the moment the animation is created — before the delay has
elapsed. In a stagger (§8) that is very visible: all ten items jump to their
off-screen start position, then trickle in. If you want elements pre-positioned,
do it deliberately as a separate "set" step rather than as a side effect of
progress-zero.

**Ping-pong with asymmetric easing rarely does what you expect.** Reversing
`localT` also reverses the easing curve, so an `easeOut` outbound becomes an
`easeIn` return. That is usually right for physical motion but wrong for
attention-seekers like a pulse, where you want `easeInOut` in both directions.
Prefer a symmetric easing for anything that ping-pongs.

### Cancellation and Cleanup

Every animation you start is a subscription, and every subscription leaks if you
never cancel it. Return a handle from your animate call and honour it:

```javascript
Pseudocode:
animationId = animate(element, target, config)
engine.stop(animationId)
```

Four cleanup obligations that are easy to miss:

1. **Cancel on element deletion.** An animation holding a reference to a deleted
   element either throws every frame or — worse — silently resurrects a stale
   object into your scene. Stop all animations for an element as part of deleting
   it, not as an afterthought.
2. **Cancel on unmount / document close.** A running `requestAnimationFrame` loop
   keeps its whole closure alive; a per-frame callback that touches a destroyed
   canvas throws once per frame forever.
3. **Decide what "stopped" means for the value.** Three legitimate answers, and you
   must pick per call: freeze where it is (a drag interrupt), snap to the target
   (an interrupted intro that should still end up correct), or revert to the start
   (a cancelled preview). Silently freezing mid-way is the default, and is often
   wrong for the second case.
4. **Stop the rAF loop when nothing is animating.** A loop that runs at 60 Hz
   doing nothing costs battery and, on a laptop, is audible in the fans. Start the
   loop on the first animation and stop it when the last one finishes.

### Pause and Resume

Pausing is not "stop calling update" — the elapsed-time math must not count the
paused interval, or the animation jumps forward on resume by exactly how long it
was paused. Store when the pause started and shift the start time on resume:

```javascript
Pseudocode:
function pause(anim):
  anim.state = 'paused'
  anim.pauseTime = now()

function resume(anim):
  // Slide startTime forward so `now - startTime` is unchanged by the pause.
  elapsedBeforePause = anim.pauseTime - anim.startTime
  anim.startTime = now() - elapsedBeforePause
  anim.pauseTime = null
  anim.state = 'running'
```

This is why animation state should be derived from *timestamps*, not accumulated
per frame: a re-derivable `elapsed` makes pause, resume, and seeking a matter of
adjusting one number, whereas an accumulator has to be corrected everywhere.

### Property Conflict Resolution

The moment two animations can run at once, they can fight over the same property —
and the loser is whichever writes first each frame, so the result is a flicker
rather than a clean win.

```
anim A: x 0 → 500 over 1000ms   ─┐
anim B: x 500 → 0 over 300ms    ─┴─ both write element.x every frame
```

Three workable policies:

- **Last-write-wins per property (recommended, and what Yappy does).** Starting an
  animation stops any *conflicting* existing animation — matched on the property
  set, not on the element. So animating `x` does not disturb an in-flight `opacity`
  animation on the same element, but a second `x` animation cleanly replaces the
  first. This is the behaviour users expect from "click a new destination
  mid-flight".
- **Additive blending** (Core Animation's model): animations contribute *deltas*
  that sum. Powerful for layering a shake on top of a move, but every animation
  must be expressed relative to a base value.
- **Explicit priority**: reject the lower-priority animation. Simple, but usually
  surprising — the user's most recent action is the one that gets ignored.

Whichever you choose, **capture the start value when the animation starts, not when
it is defined.** An animation that stored `from` at definition time will snap
backwards if the element moved in between.

### Restore-After

Attention-seeking animations — a shake, a pulse, a highlight — should leave the
element exactly as they found it. If they instead write their final frame into the
document, they pollute undo history and drift the element a little further on each
repetition.

```javascript
Pseudocode:
function playTemporary(element, animation):
  snapshot = capture(element, animation.affectedProperties)

  run(animation, {
    onComplete: () => restore(element, snapshot)
  })
```

Two details make this trustworthy: restore on **cancellation as well as
completion** (an interrupted shake must not leave the element rotated), and keep
these writes **out of undo history** — a temporary visual effect is not an edit.
Yappy's sequence animator carries a `restoreAfter` flag for exactly this, defaulting
to restoring.

### Accessibility: Reduced Motion

A meaningful number of users experience nausea or vertigo from large or
parallax-style motion; the OS lets them say so, and honouring it is not optional
for a user-facing app.

```javascript
Pseudocode:
prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches

if prefersReduced:
  // Do NOT simply skip the animation — the END STATE still has to be applied,
  // or elements that animate in from opacity 0 stay invisible forever.
  applyFinalValues(element, target)
else:
  animate(element, target, config)
```

The rule of thumb: **reduced motion means "fewer moving pixels", not "no
feedback".** Replace a slide with a fade, drop parallax and auto-playing loops
entirely, but keep the state change legible. Also watch the media query for
changes at runtime rather than reading it once at startup — users toggle it.

Content the user *authors* — an animation they deliberately built in the editor —
is a different case from your app's own UI motion. Reduced motion should quiet
your chrome, not silently refuse to play their document.

### Frame-Exact Export

Playback on screen is real-time and lossy: frames get dropped, `deltaTime` varies,
and nothing bad happens. **Export is neither.** Rendering a 30fps video means
producing exactly 30 images per second of output, each at its precise timestamp,
regardless of how long each one takes to draw.

```javascript
Pseudocode:
// WRONG — real-time playback, captured. Drops and duplicates frames
// whenever rendering falls behind, and the result stutters.
startPlayback()
onEachRafFrame(() => captureFrame())

// RIGHT — drive time explicitly; rendering speed is irrelevant.
for frame from 0 to totalFrames:
  t = frame / fps                 // exact, in seconds
  applyAnimationStateAt(t)        // seek, do not advance
  await render()
  writeFrame()
```

This requirement reaches back into your architecture, which is why it belongs in a
fundamentals guide rather than an export doc:

- **Animation state must be a pure function of time** — `stateAt(t)` — so any
  frame can be produced without replaying the ones before it. Simulation-based
  springs (§6) cannot do this, which is the practical reason Yappy's springs are
  closed-form.
- **`Math.random()` must be seeded**, or a shake looks different on every render
  and, worse, differs between the preview and the export.
- **Async work must be awaited** — images (see the graphics guide) and web fonts
  that have not loaded will be missing from early frames, permanently.

### Yappy API Quick Reference

Putting the conventions from §1 together with the lifecycle above, in the real
API. Note **opacity is 0-100 and `angle` is in radians**:

```javascript
// One-shot property animation. Returns an id you can stop.
const id = Yappy.animateElement(elementId, 
    { x: 500, opacity: 100, angle: Math.PI / 2 },
    { duration: 800, easing: 'easeOutCubic', delay: 100 }
);

// Looping ping-pong — a wobble. Symmetric easing, per the note above.
// `angle` is RADIANS: 0.1 rad ≈ 5.7°.
Yappy.animateElement(elementId,
    { angle: 0.1 },
    { duration: 400, easing: 'easeInOutQuad',
      loop: true, loopCount: 4, alternate: true }
);

// Physics-based, via the closed-form spring easing (§6).
Yappy.animateElement(elementId, { y: 300 }, {
    duration: 1000,
    easing: Yappy.createSpring(170, 26, 1)   // stiffness, damping, mass
});

// Keyframes: `easing` belongs to the segment ENTERING each keyframe (§9),
// and `t` is in seconds.
Yappy.addKeyframe(elementId, 'x', 0.0, 0);
Yappy.addKeyframe(elementId, 'x', 0.5, 200, 'easeOutCubic');
Yappy.addKeyframe(elementId, 'x', 1.0, 100, 'easeInOutQuad');

// Staggered entrance across many elements.
Yappy.animateElementsStagger(ids, { opacity: 100, y: 0 },
    { duration: 600, easing: 'easeOutBack' }, 80);

// Control.
Yappy.animationEngine.pause(id);
Yappy.animationEngine.resume(id);
Yappy.animationEngine.stop(id);
Yappy.animationEngine.stopAll();
```

Check the current signatures in
[`docs/api.md`](../api.md) and
[`element-animator.ts`](../../frontend/src/utils/animation/element-animator.ts)
before relying on any of these — the API surface moves faster than this guide.

---

## Real-World Application: Building an Animation Engine

### Minimal Animation System

```javascript
Pseudocode:
class Animation:
  constructor(element, from, to, duration, easing):
    this.element = element
    this.from = from
    this.to = to
    this.duration = duration
    this.easing = easing
    this.startTime = null
    this.isRunning = false
  
  start():
    this.startTime = getCurrentTime()
    this.isRunning = true
    this.update()
  
  update():
    if not this.isRunning:
      return
    
    currentTime = getCurrentTime()
    elapsedTime = currentTime - this.startTime
    progress = min(elapsedTime / this.duration, 1.0)
    
    // Apply easing
    easedProgress = this.easing(progress)
    
    // Interpolate all properties
    for property in this.from:
      currentValue = lerp(
        this.from[property],
        this.to[property],
        easedProgress
      )
      this.element[property] = currentValue
    
    // Continue or complete
    if progress < 1.0:
      requestAnimationFrame(() => this.update())
    else:
      this.onComplete()
  
  onComplete():
    this.isRunning = false

// Usage:
animation = new Animation(
  element,
  { x: 0, y: 0, opacity: 0 },
  { x: 100, y: 50, opacity: 1 },
  duration = 1000,
  easing = easeInOutCubic
)
animation.start()
```

### Composable Animation Library

Like GSAP or Framer Motion:

```javascript
Pseudocode:
// Simple API
animate(element, {
  x: 100,
  y: 200,
  rotation: 360,
  scale: 1.5
}, {
  duration: 1000,
  easing: "easeInOutCubic",
  onComplete: () => console.log("Done!")
})

// Spring animation
animateSpring(element, {
  x: 100,
  y: 200
}, {
  stiffness: 200,
  damping: 20
})

// Keyframes
animateKeyframes(element, [
  { time: 0, x: 0, y: 0 },
  { time: 0.5, x: 100, y: 0, easing: "easeOut" },
  { time: 1, x: 100, y: 100, easing: "easeIn" }
], {
  duration: 2000
})

// Timeline (sequence)
timeline = createTimeline()
timeline.add(fadeIn(element1), 0)        // Start at 0ms
timeline.add(slideIn(element2), 500)     // Start at 500ms
timeline.add(scaleUp(element3), 800)     // Start at 800ms
timeline.play()
```

---

## Animation Principles (The "Illusion of Life")

These principles from Disney animation apply to UI animation:

### 1. **Ease In / Ease Out**
Objects don't move at constant speed—they accelerate and decelerate.

### 2. **Anticipation**
A small motion in the opposite direction before the main action:
```javascript
// Button click: slight shrink before growing
scale: 1.0 → 0.95 → 1.2 → 1.0
```

### 3. **Follow Through**
Parts continue moving after the main motion stops (like hair or clothing):
```javascript
// Element stops, but shadow continues briefly
```

### 4. **Overshoot and Settle**
Briefly exceed the target, then settle back:
```javascript
easeOutBack // Built-in overshoot
```

### 5. **Squash and Stretch**
Objects deform during motion to appear more alive:
```javascript
// Ball bouncing
scaleY: 1 → 0.7 → 1.3 → 1 (squash → stretch → normal)
```

---

## Performance Considerations

### Hardware-Accelerated Properties — a DOM rule, not a universal one

**In the DOM**, these properties are composited on the GPU and animate smoothly at
60fps:
- `transform` (translate, rotate, scale)
- `opacity`

Avoid animating:
- `width`, `height` (causes layout recalculation)
- `left`, `top` (use `transform: translate()` instead)

**This advice does not transfer to a canvas app**, and applying it there wastes
effort on a distinction that no longer exists. The reason `transform` is cheap in
the DOM is that the browser keeps the element as a pre-rendered layer and the
compositor merely re-positions it — no layout, no repaint. A canvas has no layers
and no layout: **every frame, you clear and redraw**. Animating `x` costs precisely
what animating `width` costs, because both mean "run the draw code again".

So in a canvas-based editor the performance question changes from *which property*
to **how much you redraw**:

| DOM concern | Canvas equivalent |
|---|---|
| Which property (transform vs. layout) | Irrelevant — all properties cost a redraw |
| Avoiding layout thrash | Avoiding **full-scene** redraws |
| Promoting to a GPU layer | **Caching** static content to an offscreen canvas |
| — | **Culling** off-screen elements (see the graphics guide, §19) |

What actually helps, in rough order of payoff:

1. **Redraw once per frame, not once per property.** The classic mistake is a
   `requestRedraw()` inside the property setter, so animating x, y, and opacity on
   30 elements schedules 90 redraws for a single frame. Set a dirty flag; paint
   once in the rAF callback.
2. **Split the static from the moving.** Render the unchanging background —
   grid, locked layers, everything not being animated — to an offscreen canvas
   once, then each frame `drawImage` that and draw only the animating elements on
   top. On a document with thousands of elements this is the difference between
   12 fps and 60.
3. **Limit the redraw region** with `ctx.clip()` to the union of the animating
   elements' bounds (padded for strokes and shadows), when the animation is
   localised.
4. **Hoist expensive per-frame work.** Gradient and pattern objects, measured text
   (graphics guide, §19), and `Path2D` instances should be built once and reused,
   not reconstructed at 60 Hz.

The rAF advice below applies equally to both worlds.

### RequestAnimationFrame

Always use for smooth animations:
```javascript
// Good
function animate():
  update()
  requestAnimationFrame(animate)

// Bad (janky)
setInterval(update, 16)  // Not synced to display refresh
```

### Throttling/Debouncing

Prevent too many animation triggers:
```javascript
Pseudocode:
lastCallTime = 0
throttleMs = 100

function throttledAnimate():
  currentTime = getCurrentTime()
  if currentTime - lastCallTime < throttleMs:
    return  // Ignore this call
  
  lastCallTime = currentTime
  performAnimation()
```

---

## Conclusion

Animation is fundamentally about **interpolation** + **timing** + **easing**. Every animation library—CSS Animations, GSAP, Framer Motion, Manim—implements these core concepts.

**Key Takeaways**:
1. `lerp(start, end, progress)` is the foundation of all animation
2. Easing functions make motion feel natural
3. Spring physics provides organic, physics-based motion
4. Keyframes let you define complex multi-stage animations
5. Understanding these fundamentals lets you build animations in any framework

**Further Study**:
- Experiment with different easing curves
- Try implementing a simple spring physics system
- Build a keyframe animation engine
- Study animations you love and reverse-engineer their math

Happy animating! 🎬✨
