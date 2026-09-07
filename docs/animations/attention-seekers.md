# Attention Seekers — Emphasis Animations

Emphasis effects that draw attention to an element without moving it off-screen. Useful for UI feedback, notifications, and interactive highlights.

## bounce

Element bounces vertically (up then settles).

```javascript
Yappy.bounce(id);
Yappy.bounce(id, 450, { intensity: 30 });
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 450 | Duration in ms |
| `intensity` | 20 | Vertical displacement in pixels |

- **Animated Properties**: `y`
- **Easing**: Phase 1 `easeOutQuad` (up), Phase 2 `easeOutBounce` (settle)
- **Phases**: 2-phase — lifts up then bounces back down
- **Infinite loop**: Supported — continues bouncing indefinitely

## pulse

Element scales up uniformly from center then returns.

```javascript
Yappy.pulse(id);
Yappy.pulse(id, 300, { scale: 1.2 });
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 300 | Duration in ms |
| `scale` | 1.1 | Scale multiplier (1.1 = 10% larger) |

- **Animated Properties**: `width`, `height`, `x`, `y`
- **Easing**: Both phases `easeOutQuad`
- **Behavior**: Expands from center, then contracts back
- **Infinite loop**: Supported — continues pulsing

## shakeX

Horizontal oscillation (left-right shake).

```javascript
Yappy.shakeX(id);
Yappy.shakeX(id, 400, { intensity: 15 });
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 400 | Duration in ms |
| `intensity` | 10 | Displacement in pixels |

- **Animated Properties**: `x`
- **Easing**: `linear`
- **Behavior**: 4 alternations (left-right-left-right)
- **Infinite loop**: Persists with `loopCount: Infinity`

## shakeY

Vertical oscillation (up-down shake).

```javascript
Yappy.shakeY(id);
Yappy.shakeY(id, 400, { intensity: 15 });
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 400 | Duration in ms |
| `intensity` | 10 | Displacement in pixels |

- **Animated Properties**: `y`
- **Easing**: `linear`
- **Behavior**: Same as shakeX but on vertical axis

## headShake

Quick horizontal "no" gesture with decreasing amplitude.

```javascript
Yappy.headShake(id);
Yappy.headShake(id, 800);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `x`
- **Easing**: `easeInOutQuad`
- **Phases**: 5 steps — left(-6) → right(+5) → left(-3) → right(+2) → center(0)
- **Behavior**: Diminishing oscillation, each step is 1/5 of total duration

## swing

Rotational rocking motion (like a pendulum).

```javascript
Yappy.swing(id);
Yappy.swing(id, 1200);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `angle`
- **Easing**: `linear`
- **Phases**: 5 steps with diminishing angles — +0.25 → -0.17 → +0.08 → -0.05 → 0

## tada

Celebration effect combining scale and rotation.

```javascript
Yappy.tada(id);
Yappy.tada(id, 1200);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `width`, `height`, `x`, `y`, `angle`
- **Phases**: 3 — shrink+rotate → scale+rotate loop (3×) → restore
- **Behavior**: Creates dramatic celebration emphasis

## wobble

Combined horizontal displacement and angular tilt.

```javascript
Yappy.wobble(id);
Yappy.wobble(id, 1200);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `x`, `angle`
- **Easing**: `linear`
- **Phases**: 5 steps with decreasing displacement — 25% → 20% → 15% → 10% → 0 of width

## jello

Elastic squash-and-stretch deformation.

```javascript
Yappy.jello(id);
Yappy.jello(id, 1200);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `width`, `height`, `x`, `y`
- **Easing**: Phases 1-3 `linear`, Phase 4 `easeOutQuad`
- **Behavior**: Alternates wide-short ↔ narrow-tall (20% → 10% → 5% deformation)

## heartBeat

Double-pulse effect mimicking a heartbeat rhythm.

```javascript
Yappy.heartBeat(id);
Yappy.heartBeat(id, 1500);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1300 | Duration in ms |

- **Animated Properties**: `width`, `height`, `x`, `y`
- **Easing**: Expand `easeOutQuad`, Compress `easeInQuad`
- **Duration split**: 20% + 20% + 40% phases
- **Behavior**: Two quick scale-up pulses (1.3×) followed by longer settle

## Conflict Properties

| Animation | Affected Properties |
|-----------|---------------------|
| bounce | `y` |
| pulse, jello, heartBeat | `width`, `height`, `x`, `y` |
| shakeX, headShake | `x` |
| shakeY | `y` |
| swing | `angle` |
| tada | `width`, `height`, `x`, `y`, `angle` |
| wobble | `x`, `angle` |
