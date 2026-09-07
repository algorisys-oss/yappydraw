# Image Pixel Effects - Integration Guide

## Overview

Pixel effects are now fully integrated into Yappy's animation system. They work just like other animation presets (fadeIn, bounce, etc.) but are specifically designed for images.

## How to Use

### Method 1: Quick Preview Buttons (Property Panel)

When you select an image:

1. Look for **"PIXEL EFFECTS - QUICK PREVIEW"** section in the Property Panel
2. Click any emoji button to immediately preview that effect:
   - ▶️ Left→Right
   - ✨ Dissolve
   - 🌊 Wave
   - 📺 Scan Lines
   - ⚡ Glitch
   - ▦ Block
   - 🌀 Spiral
   - 🎭 Curtain
   - 🎲 Random

**Note**: These buttons are for quick previews only. For persistent effects with triggers, use the Animation Panel (Method 2).

### Method 2: Animation Panel (With Triggers)

This is the recommended method for presentation mode and persistent effects:

1. **Select your image**
2. **Open the Animation Panel** (appears below property panel)
3. **Click "+ Add Animation"**
4. **Choose a pixel effect preset** from the dropdown:
   - pixelRevealLTR (Left→Right)
   - pixelRevealRTL (Right→Left)
   - pixelRevealTTB (Top→Bottom)
   - pixelRevealBTT (Bottom→Top)
   - pixelDissolve
   - pixelRandomScatter
   - pixelWaveCenter
   - pixelWaveCorner
   - pixelScanLines
   - pixelBlockReveal
   - pixelSpiral
   - pixelGlitch
   - pixelCurtainV (Vertical Curtain)
   - pixelCurtainH (Horizontal Curtain)

5. **Set the trigger**:
   - **on-load**: Effect plays when slide loads
   - **on-click**: Effect plays when user clicks the image
   - **on-hover**: Effect plays on mouse hover
   - **programmatic**: Triggered via API
   - **after-prev**: Plays after previous animation
   - **with-prev**: Plays simultaneously with previous animation

6. **Adjust settings**:
   - Duration: How long the effect lasts
   - Delay: Wait time before starting
   - Easing: Animation curve (easeOutCubic recommended)
   - Repeat: Loop count (-1 for infinite)
   - Restore After: Return to original state when done

### Method 3: API (Programmatic)

```javascript
// Quick preset
Yappy.pixelRevealLTR(imageId, 2000);

// Custom configuration
Yappy.animatePixelEffect(imageId, {
    effectType: 'glitch',
    duration: 1500,
    easing: 'easeInOutCubic',
    params: { glitchIntensity: 0.8 }
});

// Add as an animation (with trigger support)
Yappy.updateElement(imageId, {
    animations: [{
        id: 'anim-1',
        type: 'preset',
        name: 'pixelGlitch',
        trigger: 'on-load',    // Plays when slide loads
        duration: 1200,
        delay: 0,
        easing: 'easeInOutCubic',
        repeat: 0
    }]
});
```

## Available Effects

| Effect | Function Name | Description | Best For |
|--------|---------------|-------------|----------|
| Left→Right | `pixelRevealLTR` | Sequential reveal left to right | Headers, titles |
| Right→Left | `pixelRevealRTL` | Sequential reveal right to left | RTL content |
| Top→Bottom | `pixelRevealTTB` | Sequential reveal top to bottom | Vertical reveals |
| Bottom→Top | `pixelRevealBTT` | Sequential reveal bottom to top | Rising effects |
| Dissolve | `pixelDissolve` | Smooth random dissolve | Transitions, fades |
| Random Scatter | `pixelRandomScatter` | Random pixel assembly | Chaotic reveals |
| Wave Center | `pixelWaveCenter` | Expanding ripple from center | Dramatic reveals |
| Wave Corner | `pixelWaveCorner` | Wave from top-left | Diagonal wipes |
| Scan Lines | `pixelScanLines` | CRT-style horizontal scanning | Retro/tech themes |
| Block Reveal | `pixelBlockReveal` | Grid-based tile reveal | Mosaic effects |
| Spiral | `pixelSpiral` | Spiral pattern from center | Hypnotic reveals |
| Glitch | `pixelGlitch` | Digital corruption/assembly | Tech/error aesthetics |
| Curtain V | `pixelCurtainV` | Vertical curtain opening | Stage curtains |
| Curtain H | `pixelCurtainH` | Horizontal curtain opening | Widescreen reveals |

## Use Cases

### Presentation Mode

Add images with on-load triggers:

1. Add image to slide
2. Open Animation Panel
3. Add animation: `pixelWaveCenter`
4. Set trigger: `on-load`
5. Set duration: 2000ms
6. Enter presentation mode → Image reveals with wave effect

### Interactive Diagrams

Use on-click triggers for interactive reveals:

1. Add multiple images
2. For each image, add `pixelGlitch` animation
3. Set trigger: `on-click`
4. In presentation mode, click each image to reveal it

### Loading Effects

Combine with image loading:

```javascript
// In your code
const img = Yappy.addImage({ dataURL: '...' });

// Add on-load animation
Yappy.updateElement(img.id, {
    animations: [{
        id: 'load-reveal',
        type: 'preset',
        name: 'pixelDissolve',
        trigger: 'on-load',
        duration: 1500,
        easing: 'easeInOutCubic'
    }]
});
```

## Performance Tips

1. **Image size**: Keep images under 1000x1000px for smooth animations
2. **Multiple effects**: Avoid running pixel effects on multiple large images simultaneously
3. **Duration**: Longer durations (2000-3000ms) are smoother than quick ones
4. **Easing**: Use `easeOutCubic` or `easeInOutCubic` for most effects

## Troubleshooting

**Effect doesn't play:**
- Ensure image is fully loaded
- Check that animation trigger is correct
- Verify element type is 'image'

**Effect is choppy:**
- Reduce image size
- Increase duration
- Close other running animations

**Effect doesn't clear:**
- Set `restoreAfter: true` in animation config
- Manually clear with `Yappy.stopPixelEffect(imageId, animId, true)`

## Technical Details

- **Renderer**: Pixel effects use `CanvasRenderingContext2D` and ImageData API
- **Mask-based**: Effects generate visibility masks composited with source image
- **Deterministic**: Seeded randomness ensures consistent playback
- **Animation Engine**: Integrates with Yappy's core animation engine
- **Frame-based**: Renders on every frame while active

## Future Enhancements

Potential additions:
- Custom pixel shaders
- Particle-based reveals
- Morphing between images
- Color-based reveals
- 3D transform effects
- Interactive scrubbing in timeline editor
