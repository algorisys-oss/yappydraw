# Glitch Effect

A digital distortion preset inspired by After Effects CRT/VHS glitch. Simulates signal interference with rapid position jitter, opacity flicker, and "signal loss" blackout moments.

## Usage

```javascript
Yappy.glitch(id);              // Default: 600ms, intensity 15
Yappy.glitch(id, 400);         // Faster glitch (400ms)
Yappy.glitch(id, 800, { intensity: 25 }); // Stronger offsets
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 600 | Total effect duration in ms |
| `intensity` | 15 | Position displacement in pixels (scales all offsets) |

All position offsets are scaled by `intensity / 15`, so `intensity: 30` doubles the displacement.

## How It Works

The effect chains 8 rapid animation phases with linear easing (no smoothing = staccato digital feel):

| Phase | Duration | X Offset | Y Offset | Opacity | Effect |
|-------|----------|----------|----------|---------|--------|
| 1 | 8% | +12 | -3 | 80 | Shift right |
| 2 | 8% | -8 | +2 | 100 | Snap left |
| 3 | 12% | +15 | +4 | 20 | Signal loss |
| 4 | 8% | -3 | -1 | 100 | Quick recovery |
| 5 | 12% | -10 | +3 | 60 | Partial signal loss |
| 6 | 8% | +6 | -2 | 100 | Snap right |
| 7 | 12% | +4 | +1 | 30 | Signal loss again |
| 8 | 32% | 0 | 0 | original | Settle back |

## Implementation

Uses 8 chained `animateElement` calls with `onComplete` callbacks. Each phase animates `x`, `y`, and `opacity` simultaneously. All phases use `linear` easing for the characteristic staccato digital feel.

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ ... ──→ Phase 8 (settle)
    ↑ each onComplete triggers the next phase
```

## Conflict Properties

Animates `x`, `y`, and `opacity`. Will conflict with:
- Move / Slide animations (`x`, `y`)
- Fade animations (`opacity`)
- Zoom animations (`x`, `y`)

## Tips

- Chain with `fadeIn` for a "signal acquired" entrance: `fadeIn → glitch (after-prev)`
- Use with `loop: true` for a continuous interference effect
- Combine with `textScramble` on text elements for a full digital corruption look
- Lower `intensity` (5–8) for subtle UI jitter, higher (25–40) for dramatic effect
- Works on any element type (shapes, text, images, groups)
