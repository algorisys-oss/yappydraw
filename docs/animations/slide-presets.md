# Slide Presets — Directional Entrance & Exit

Slide elements in/out from any edge of the viewport with an opacity fade.

## Entrance Presets

### slideInLeft

```javascript
Yappy.slideInLeft(id);
Yappy.slideInLeft(id, 500);
```

- **Start position**: `-element.width - 50` (off-screen left)
- **Animated Properties**: `x`, `opacity`
- **Easing**: `easeOutQuad`

### slideInRight

```javascript
Yappy.slideInRight(id);
```

- **Start position**: `window.innerWidth + 50` (off-screen right)
- **Animated Properties**: `x`, `opacity`
- **Easing**: `easeOutQuad`

### slideInUp

```javascript
Yappy.slideInUp(id);
```

- **Start position**: `-element.height - 50` (off-screen top)
- **Animated Properties**: `y`, `opacity`
- **Easing**: `easeOutQuad`

### slideInDown

```javascript
Yappy.slideInDown(id);
```

- **Start position**: `window.innerHeight + 50` (off-screen bottom)
- **Animated Properties**: `y`, `opacity`
- **Easing**: `easeOutQuad`

## Exit Presets

### slideOutLeft

```javascript
Yappy.slideOutLeft(id);
```

- **End position**: `-element.width` (off-screen left)
- **Animated Properties**: `x`, `opacity`
- **Easing**: `easeInQuad`

### slideOutRight

```javascript
Yappy.slideOutRight(id);
```

- **End position**: `window.innerWidth + 100` (off-screen right)
- **Animated Properties**: `x`, `opacity`
- **Easing**: `easeInQuad`

### slideOutUp

```javascript
Yappy.slideOutUp(id);
```

- **End position**: `-element.height` (off-screen top)
- **Animated Properties**: `y`, `opacity`
- **Easing**: `easeInQuad`

### slideOutDown

```javascript
Yappy.slideOutDown(id);
```

- **End position**: `window.innerHeight + 100` (off-screen bottom)
- **Animated Properties**: `y`, `opacity`
- **Easing**: `easeInQuad`

## Common Parameters

All slide presets share the same signature:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 300 | Duration in ms |

## Conflict Properties

All slide presets animate `x` or `y` (and `opacity`). They conflict with:
- Move animations (`x`, `y`)
- Fade animations (`opacity`)
- Other slide presets on the same axis

## Tips

- Pair entrance + exit for complete transitions: `slideInLeft` → `slideOutRight`
- Combine with stagger for sequential multi-element slides
- Use `delay` to offset slides in a sequence
