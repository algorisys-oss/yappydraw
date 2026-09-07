# 3D Box Animations

Animations for 3D shape types: `solidBlock`, `perspectiveBlock`, `cylinder`, `isometricCube`, and `openBox`.

## boxRotateReveal

Rotates a 3D shape to reveal a different face.

```javascript
Yappy.boxRotateReveal(id);              // 90° rotation
Yappy.boxRotateReveal(id, 180, 1000);   // 180° over 1s
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `targetAngle` | 90 | Target view angle (degrees, 0–360) |
| `duration` | 800 | Duration in ms |

- **Animated Properties**: `viewAngle`
- **Easing**: `easeInOutCubic`
- **Valid shapes**: `solidBlock`, `perspectiveBlock`, `cylinder`, `isometricCube`

## boxLidOpen

Opens the lid of an open-box shape with organic overshoot.

```javascript
Yappy.boxLidOpen(id);
Yappy.boxLidOpen(id, 1200);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1000 | Duration in ms |

- **Animated Properties**: `openAmount` (0 → 85 → 95 → 90)
- **Valid shapes**: `openBox` only
- **Phases**:
  - 60%: Lid swings open to 85° (`easeOutCubic`)
  - 20%: Overshoots to 95° (`easeOutQuad`)
  - 20%: Settles to 90° with elastic bounce (`easeOutElastic`)

## boxLidClose

Closes the lid of an open-box shape.

```javascript
Yappy.boxLidClose(id);
Yappy.boxLidClose(id, 600);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 800 | Duration in ms |

- **Animated Properties**: `openAmount` (current → 0)
- **Easing**: `easeInOutCubic`
- **Valid shapes**: `openBox` only

## boxOpenReveal

Opens a grouped box and reveals contents inside with stagger.

```javascript
Yappy.boxOpenReveal(groupId);
Yappy.boxOpenReveal(groupId, 2000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `groupId` | (required) | Group ID (not element ID) |
| `duration` | 1500 | Duration in ms |

- **Group structure**: Expects ≥2 children: `[body, lid, ...contents]`
- **Phase 1** (50%): Lid lifts upward and fades out (`easeOutCubic`)
- **Phase 2** (50%): Contents scale in from 30% with 100ms stagger (`easeOutBack`)
- **Animated Properties**: On lid: `y`, `opacity`. On contents: `width`, `height`, `x`, `y`

## boxExplode

Expands a 3D shape outward — unfolded/exploded view effect.

```javascript
Yappy.boxExplode(id);
Yappy.boxExplode(id, 1500);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1200 | Duration in ms |

- **Animated Properties**: `depth` (×2.5), `width` (×1.3), `height` (×1.3), `x`, `y`
- **Easing**: `easeOutBack`
- **Valid shapes**: `solidBlock`, `perspectiveBlock`

## boxCollapse

Reverses an explode — collapses a 3D shape back to compact form.

```javascript
Yappy.boxCollapse(id);
Yappy.boxCollapse(id, 50, 1000);  // Target depth 50, 1s
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `targetDepth` | 50 | Final depth value |
| `duration` | 800 | Duration in ms |

- **Animated Properties**: `depth`, `width` (÷1.3), `height` (÷1.3), `x`, `y`
- **Easing**: `easeInOutCubic`
- **Valid shapes**: `solidBlock`, `perspectiveBlock`

## isometricRotate

Creates a rotation illusion on isometric cubes via keyframe sideRatio animation.

```javascript
Yappy.isometricRotate(id);
Yappy.isometricRotate(id, 3000);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 2000 | Duration in ms |

- **Animated Properties**: `sideRatio` (keyframe: 0 → 100 → 50 → 0 → original)
- **Easing**: Per-segment `easeInOutSine`
- **Valid shapes**: `isometricCube` only
- **Behavior**: Continuous face-rotation illusion via sideRatio keyframes

## depthPulse

Quick depth pop-out effect (expand then bounce back).

```javascript
Yappy.depthPulse(id);
Yappy.depthPulse(id, 800);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 600 | Duration in ms |

- **Animated Properties**: `depth` (original → 1.5× → original)
- **Valid shapes**: `solidBlock`, `perspectiveBlock`, `cylinder`
- **Phases**:
  - 50%: Depth increases to 1.5× (`easeOutQuad`)
  - 50%: Bounces back with elastic settle (`easeOutElastic`)

## Conflict Properties

| Animation | Affected Properties |
|-----------|---------------------|
| boxRotateReveal | `viewAngle` |
| boxLidOpen / boxLidClose | `openAmount` |
| boxOpenReveal | `y`, `opacity`, `width`, `height`, `x` (on children) |
| boxExplode / boxCollapse | `depth`, `width`, `height`, `x`, `y` |
| isometricRotate | `sideRatio` |
| depthPulse | `depth` |
