# Stagger Utilities

GSAP-inspired stagger system for animating multiple elements with distributed timing. Supports linear, center-out, edge-in, random, and grid-based distribution patterns.

## calculateStaggerDelays

Core utility — computes normalized delay values (0–1) for N elements.

```javascript
import { calculateStaggerDelays } from './animation';

const delays = calculateStaggerDelays(5, { from: 'center' });
// → [1, 0.5, 0, 0.5, 1]  (center elements start first)

const delays2 = calculateStaggerDelays(4, { from: 'start' });
// → [0, 0.333, 0.666, 1]
```

### StaggerConfig Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `each` | number | — | Per-element delay in ms |
| `amount` | number | — | Total stagger span in ms |
| `from` | string \| number | `'start'` | Distribution pattern |
| `grid` | [cols, rows] | — | 2D grid dimensions |
| `axis` | `'x'` \| `'y'` | — | Axis for grid-based stagger |
| `ease` | EasingName | — | Easing applied to timing distribution |

### Distribution Patterns (`from`)

| Value | Behavior |
|-------|----------|
| `'start'` | First element starts immediately, last starts last |
| `'end'` | Last element starts first, first starts last |
| `'center'` | Center elements start first, edges start last |
| `'edges'` | Edge elements start first, center starts last |
| `'random'` | Random order |
| `number` | Specific index starts first, radial outward |

### Grid-based Stagger

For 2D layouts (e.g., grid of cards):

```javascript
const delays = calculateStaggerDelays(12, {
    from: 'center',
    grid: [4, 3],      // 4 columns × 3 rows
    axis: 'x'          // stagger along x-axis
});
```

## animateElementsStagger

Animate multiple elements toward the same target with staggered timing.

```javascript
Yappy.animateElementsStagger(
    ['id1', 'id2', 'id3'],
    { opacity: 100 },              // target
    { duration: 300 },             // config
    { each: 100, from: 'center' }  // stagger
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementIds` | string[] | Elements to animate |
| `target` | ElementAnimationTarget | Target property values |
| `config` | ElementAnimationConfig | Animation config |
| `stagger` | StaggerConfig \| number | Stagger config or simple delay number |

**Returns**: `string[]` — Array of animation IDs

## animateFrom

Animate element FROM a specified state TO its current state. Sets element to `fromValues` immediately, then animates back.

```javascript
// Element currently at x:400 — animates from x:0 to x:400
Yappy.animateFrom(id, { x: 0, opacity: 0 }, { duration: 500 });
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementId` | string | Element to animate |
| `fromValues` | ElementAnimationTarget | Starting state |
| `config` | ElementAnimationConfig | Animation config |

**Use case**: Entrance animations where you define where the element comes FROM.

## animateFromTo

Full explicit control — animate from one state to another.

```javascript
Yappy.animateFromTo(id,
    { x: 0, opacity: 0 },       // from
    { x: 400, opacity: 100 },   // to
    { duration: 500, easing: 'easeOutBack' }
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementId` | string | Element to animate |
| `fromValues` | ElementAnimationTarget | Starting state |
| `toValues` | ElementAnimationTarget | Ending state |
| `config` | ElementAnimationConfig | Animation config |

## animateElementsFrom

Multi-element `animateFrom` with stagger.

```javascript
Yappy.animateElementsFrom(
    ['id1', 'id2', 'id3'],
    { y: 100, opacity: 0 },
    { duration: 400 },
    { each: 80, from: 'start' }
);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementIds` | string[] | Elements to animate |
| `fromValues` | ElementAnimationTarget | Starting state for all |
| `config` | ElementAnimationConfig | Animation config |
| `stagger` | StaggerConfig \| number | Stagger config |

**Returns**: `string[]` — Array of animation IDs

## Random Utilities

Helper functions for randomization in animations.

| Function | Signature | Description |
|----------|-----------|-------------|
| `random(min, max)` | `(number, number) → number` | Random float in range |
| `randomInt(min, max)` | `(number, number) → number` | Random integer in range |
| `randomPick(array)` | `(T[]) → T` | Random item from array |
| `shuffle(array)` | `(T[]) → T[]` | Shuffle array (Fisher-Yates) |
