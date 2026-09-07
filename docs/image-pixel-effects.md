# Image Pixel Effects

Animated pixel-by-pixel reveal and transformation effects for images in Yappy.

## Overview

Image pixel effects allow you to animate images being revealed or transformed pixel-by-pixel with various patterns. Each effect creates a unique visual appearance as the image materializes on the canvas.

## Available Effects

### Sequential Reveal
- **sequential-ltr**: Left to Right reveal
- **sequential-rtl**: Right to Left reveal
- **sequential-ttb**: Top to Bottom reveal
- **sequential-btt**: Bottom to Top reveal

### Pattern-Based
- **random-pixels**: Random scattered pixel appearance
- **dissolve**: Smooth random dissolve in/out
- **block-reveal**: Grid-based tile reveal
- **spiral**: Spiral pattern from center outward

### Wave Effects
- **wave-center**: Expanding ripple from center
- **wave-corner**: Wave from top-left corner
- **curtain-vertical**: Vertical curtain opening from center
- **curtain-horizontal**: Horizontal curtain opening from center

### Special Effects
- **scan-lines**: Retro CRT-style horizontal scanning
- **glitch**: Digital corruption/assembly effect

## Usage

### Using Presets (Recommended)

The easiest way to apply pixel effects:

```javascript
// Get an image element
const imageElement = Yappy.state.elements.find(el => el.type === 'image');

// Apply a preset effect
Yappy.pixelEffectPresets.dissolveIn(imageElement.id);

// Or with callback
Yappy.pixelEffectPresets.waveReveal(imageElement.id, () => {
    console.log('Animation complete!');
});
```

**Available Presets:**
- `revealLTR(elementId, onComplete?)` - Quick left-to-right reveal (1.5s)
- `dissolveIn(elementId, onComplete?)` - Dissolve in effect (2s)
- `waveReveal(elementId, onComplete?)` - Wave from center with ripples (1.8s)
- `scanLines(elementId, onComplete?)` - Retro scan line reveal (2.5s)
- `glitch(elementId, onComplete?)` - Digital glitch assembly (1.2s)
- `blockReveal(elementId, onComplete?)` - Block tile reveal (2s)
- `spiral(elementId, onComplete?)` - Spiral reveal (2.2s)
- `curtainOpen(elementId, onComplete?)` - Vertical curtain open (1.5s)
- `randomScatter(elementId, onComplete?)` - Random pixel scatter (1.8s)

### Custom Configuration

For full control over the effect:

```javascript
// Apply custom pixel effect
const animId = Yappy.animatePixelEffect('image-element-id', {
    effectType: 'wave-center',
    duration: 3000,
    easing: 'easeOutCubic',
    reverse: false,
    params: {
        waveCount: 3  // Multiple wave ripples
    },
    onComplete: () => {
        console.log('Effect finished!');
    }
});

// Stop the effect later
Yappy.stopPixelEffect('image-element-id', animId, true); // true = reset
```

### Effect Parameters

Different effects support different parameters:

```javascript
// Scan lines with custom line height
Yappy.animatePixelEffect(imageId, {
    effectType: 'scan-lines',
    params: {
        lineHeight: 5  // Thicker scan lines
    }
});

// Block reveal with custom block size
Yappy.animatePixelEffect(imageId, {
    effectType: 'block-reveal',
    params: {
        blockSize: 32  // Larger blocks
    }
});

// Glitch effect with intensity
Yappy.animatePixelEffect(imageId, {
    effectType: 'glitch',
    params: {
        glitchIntensity: 0.8  // 0-1, higher = more glitchy
    }
});

// Wave with multiple ripples
Yappy.animatePixelEffect(imageId, {
    effectType: 'wave-center',
    params: {
        waveCount: 5
    }
});
```

### Reverse Effects

Animate from visible to hidden:

```javascript
// Dissolve out instead of in
Yappy.animatePixelEffect(imageId, {
    effectType: 'dissolve',
    reverse: true,  // Animate from 1 to 0
    duration: 1500
});
```

## Complete Example

```javascript
// Create an image element
const img = Yappy.addImage({
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    dataURL: 'data:image/png;base64,...'
});

// Wait for image to load, then apply effect
setTimeout(() => {
    // Apply glitch reveal effect
    Yappy.pixelEffectPresets.glitch(img.id, () => {
        console.log('Image revealed with glitch effect!');

        // After 2 seconds, dissolve it out
        setTimeout(() => {
            Yappy.animatePixelEffect(img.id, {
                effectType: 'dissolve',
                reverse: true,
                duration: 2000,
                onComplete: () => {
                    console.log('Image dissolved out');
                }
            });
        }, 2000);
    });
}, 100);
```

## Effect Parameters Reference

| Effect Type | Parameters | Description |
|------------|------------|-------------|
| `scan-lines` | `lineHeight: number` | Height of each scan line in pixels (default: 2) |
| `block-reveal` | `blockSize: number` | Size of each block in pixels (default: 16) |
| `glitch` | `glitchIntensity: number` | Glitch intensity 0-1 (default: 0.5) |
| `wave-center`, `wave-corner` | `waveCount: number` | Number of wave ripples (default: 1) |

## Easing Options

All standard Yappy easings are supported:

- `linear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
- `easeOutBounce`, `easeInBounce`, `easeInOutBounce`
- `easeOutElastic`, `easeInElastic`
- `easeOutBack`, `easeInBack`
- `easeSpring`

## Performance Notes

- Pixel effects use `getImageData()` and `putImageData()`, which can be CPU-intensive for large images
- For best performance, use reasonable image sizes (< 1000x1000px)
- Effects are only applied during animation; once complete, normal rendering resumes
- Effects work only with Canvas renderer (not with other rendering backends)

## Combining with Other Effects

Pixel effects can be combined with CSS filters:

```javascript
// Apply both CSS filter and pixel effect
Yappy.updateElement(imageId, {
    filterBrightness: 120,
    filterContrast: 110
});

// Then animate the pixel reveal
Yappy.pixelEffectPresets.waveReveal(imageId);
```

## Use Cases

- **Presentation slides**: Reveal images with dramatic effects
- **Loading transitions**: Visual feedback while images load
- **Interactive demos**: Engaging image transitions
- **Storytelling**: Build images piece by piece
- **Retro effects**: CRT scan lines, glitch effects for vintage feel
- **Creative transitions**: Unique ways to show/hide images

## Future Enhancements

Potential additions:
- Custom pixel shaders
- Particle-based reveals
- Morphing between images
- 3D transform effects
- Color-based reveals (reveal by brightness, hue, etc.)
