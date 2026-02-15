# Pixel Effects Debugging Guide

## Changes Made

### 1. Fixed Import Issues
- Changed from `import * as pixelEffects` to direct named imports
- Now importing: `pixelRevealLTR`, `pixelDissolve`, `pixelWaveCenter`, etc.

### 2. Fixed updateElement Calls
- Changed from callback pattern `updateElement(id, (el) => ({ ...el }))`
- To direct object: `updateElement(id, { prop: value }, false)`

### 3. Added Debug Logging
- Console logs in button click handlers
- Console logs in pixel-effect-animator showing:
  - When animation starts
  - Effect type and element ID
  - When animation completes

## How to Test

### Step 1: Open DevTools Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console

### Step 2: Add an Image
1. Add an image to canvas
2. Select the image

### Step 3: Click a Pixel Effect Button
1. Look for the "PIXEL EFFECTS - QUICK PREVIEW" section in Property Panel
2. Click any emoji button (e.g., ▶️)

### Step 4: Check Console Output

You should see:
```
Calling pixelRevealLTR
[PixelEffect] Starting sequential-ltr on <element-id>
[PixelEffect] Complete!
```

## Troubleshooting

### Issue: No console output when clicking buttons
**Cause**: Buttons not wired correctly or functions not found
**Fix**: Check browser console for import errors

### Issue: Console shows "Calling pixelRevealLTR" but no animation
**Cause**: Animation engine not starting or updateElement not working
**Check**:
1. Is `animationEngine.start()` being called?
2. Are element properties being updated?
3. Open Elements inspector and check if `pixelEffect` property appears on image element

### Issue: Animation runs but image just disappears
**Cause**: Progress is updating but renderer might not be applying mask correctly
**Check**:
1. Look at image element in store - does it have `pixelEffect` and `pixelEffectProgress`?
2. Is `pixelEffectProgress` changing from 0 to 1?
3. Check if `renderWithPixelEffect` in image-renderer.ts is being called

### Issue: Build errors
**Cause**: TypeScript or import errors
**Fix**: Check build output for specific errors

## Manual Test via Console

You can test the pixel effect directly from browser console:

```javascript
// Get the first image element
const img = Yappy.state.elements.find(el => el.type === 'image');

// Call effect directly
Yappy.pixelRevealLTR(img.id, 1500);

// Or use the low-level animator
Yappy.animatePixelEffect(img.id, {
    effectType: 'sequential-ltr',
    duration: 1500,
    easing: 'easeOutCubic'
});
```

## Checking Element State

```javascript
// Get image element
const img = Yappy.state.elements.find(el => el.type === 'image');

// Check if pixel effect properties are set
console.log('pixelEffect:', img.pixelEffect);
console.log('pixelEffectProgress:', img.pixelEffectProgress);
console.log('pixelEffectParams:', img.pixelEffectParams);
```

## Expected Flow

1. **Click button** → Console: "Calling pixelRevealLTR"
2. **Function called** → Console: "[PixelEffect] Starting sequential-ltr on..."
3. **Element updated** → `pixelEffect` and `pixelEffectProgress` set on element
4. **Animation starts** → `animationEngine.start()` called
5. **Progress updates** → `pixelEffectProgress` goes from 0 → 1 over duration
6. **Renderer checks** → `renderWithPixelEffect()` called each frame
7. **Mask applied** → `generatePixelMask()` creates mask, `applyPixelMaskToImage()` applies it
8. **Animation completes** → Console: "[PixelEffect] Complete!"

## Files to Check

1. [src/components/property-panel.tsx](src/components/property-panel.tsx#L124) - Button handlers
2. [src/utils/animation/pixel-effect-animator.ts](src/utils/animation/pixel-effect-animator.ts#L30) - Animation logic
3. [src/utils/animation/element-animator.ts](src/utils/animation/element-animator.ts#L4960) - Pixel effect functions
4. [src/shapes/renderers/image-renderer.ts](src/shapes/renderers/image-renderer.ts#L50) - Rendering logic
5. [src/utils/image-pixel-effects.ts](src/utils/image-pixel-effects.ts) - Mask generation

## Next Steps

If animations still don't work after checking the console:

1. **Verify imports** - Make sure all pixel effect functions are exported from `src/utils/animation/index.ts`
2. **Check animation engine** - Is it running? Try other animations (fadeIn, bounce) to confirm
3. **Test renderer** - Manually set `pixelEffect` and `pixelEffectProgress` on an image element to see if rendering works
4. **Check canvas context** - The renderer needs CanvasRenderingContext2D to work

## Quick Diagnosis Commands

```javascript
// 1. Test if function exists
console.log(typeof Yappy.pixelRevealLTR); // should be 'function'

// 2. Test animation engine
Yappy.fadeIn(img.id, 500); // Does this work?

// 3. Manually set pixel effect (no animation)
Yappy.updateElement(img.id, {
    pixelEffect: 'sequential-ltr',
    pixelEffectProgress: 0.5
}, false);
// Image should be half-revealed

// 4. Clear effect
Yappy.updateElement(img.id, {
    pixelEffect: undefined,
    pixelEffectProgress: undefined
}, false);
```
