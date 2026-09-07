# Basic Presets — Fade & Scale

Core entrance/exit animations for opacity and scale transitions.

## fadeIn

Fades element from invisible to fully visible.

```javascript
Yappy.fadeIn(id);           // 300ms default
Yappy.fadeIn(id, 500);      // Custom duration
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 300 | Duration in ms |

- **Animated Properties**: `opacity` (0 → 100)
- **Easing**: `easeOutQuad`

## fadeOut

Fades element from visible to invisible.

```javascript
Yappy.fadeOut(id);
Yappy.fadeOut(id, 500);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 300 | Duration in ms |

- **Animated Properties**: `opacity` (current → 0)
- **Easing**: `easeOutQuad`

## scaleIn

Scales element up from zero at its center point, with fade-in.

```javascript
Yappy.scaleIn(id);
Yappy.scaleIn(id, 400);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 300 | Duration in ms |

- **Animated Properties**: `width`, `height`, `x`, `y`, `opacity`
- **Easing**: `easeOutBack` (slight overshoot for pop)
- **Behavior**: Captures center point, scales from 0×0 → original size while maintaining center position

## scaleOut

Scales element down to zero at its center point, with fade-out.

```javascript
Yappy.scaleOut(id);
Yappy.scaleOut(id, 400);
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 300 | Duration in ms |

- **Animated Properties**: `width`, `height`, `x`, `y`, `opacity`
- **Easing**: `easeInBack`
- **Behavior**: Collapses toward center, opacity fades to 0

## Conflict Properties

| Animation | Affected Properties |
|-----------|---------------------|
| fadeIn / fadeOut | `opacity` |
| scaleIn / scaleOut | `width`, `height`, `x`, `y`, `opacity` |

These will conflict with any other animation targeting the same properties on the same element.

## Common Config Options

All basic presets accept `ElementAnimationConfig`:

```javascript
Yappy.fadeIn(id, 300, {
    delay: 200,          // Start after 200ms
    loop: true,          // Repeat
    alternate: true,     // Ping-pong on loop
    onComplete: () => {} // Callback when done
});
```
