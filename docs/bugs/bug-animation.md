Findings
1. Bug: Infinite spin never stops when sequence completes
In sequence-animator.ts:280-297, animateAutoSpin with iterations === Infinity:

Calls onComplete() immediately via setTimeout(..., 0) to unblock the sequence
Creates the actual spin animation with onComplete: undefined so it runs forever
The spin registers in activeAnimations and keeps running
When the entire sequence finishes, onAllComplete (line 63-92) only cleans up sequence tracking state (activeSequences, isPreviewing, forceTicker). It does not call stopAllElementAnimations(elementId). Result:

The element keeps spinning after the preview "ends"
State restoration (updateElement(elementId, originalState)) is immediately overwritten by the still-running spin on the next frame
Subsequent animations that target angle will stop the spin via stopConflictingAnimations, but capture whatever arbitrary mid-spin angle value was current
2. Bug: Multi-iteration spin snaps at loop boundaries
In sequence-animator.ts:298-313, for iterations > 1:


spinConfig.loop = true;
spinConfig.loopCount = iterations;
spinConfig.duration = config.duration / iterations;
const singleEndAngle = startAngle + rotationPerIteration;
animateElement(elementId, { angle: singleEndAngle }, spinConfig);
Each loop iteration interpolates from startAngle to startAngle + 2π. At the loop boundary in animation-engine.ts:253-256, startTime is reset and progress jumps from 1 back to 0, snapping the angle from startAngle + 2π back to startAngle. Visually, the element rotates 360 degrees, then snaps back to 0 and repeats — instead of smoothly rotating 720+ degrees continuously.

3. Active slide optimization: Already correct
Presentation mode: slideBuildManager.init(slideIndex) at slide-build-manager.ts:26 uses getElementsOnSlide() — only active slide elements get animated
Preview mode: slide-control-toolbar.tsx:50-55 filters by getElementsOnSlide(store.activeSlideIndex, ...)
Render loop: canvas.tsx:415-441 already filters elementsToAnimate to active slide + buffer in slides mode
Slide transitions: slideBuildManager.reset() calls sequenceAnimator.stopAll() before initializing the new slide, ensuring old slide animations don't persist
Active slide filtering is working correctly. No changes needed here.

4. Secondary issue: Preset animations capture live element values
Presets like swing, wobble, tada capture element.angle at the moment they start (e.g., element-animator.ts:696: const originalAngle = element.angle). If a prior animation (like an infinite spin) left the angle at an arbitrary value before being stopped, these presets oscillate around that wrong angle instead of the element's intended angle.

Recommended Fixes
In onAllComplete: Call stopAllElementAnimations(elementId) before restoring state, ensuring infinite animations are cleaned up
In animateAutoSpin: For multi-iteration spins, use a single animation from startAngle to startAngle + totalRotation instead of looping (same approach already used for single iterations)
