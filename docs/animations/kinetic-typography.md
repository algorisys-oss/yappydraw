# Kinetic Typography

Splits a text element into individual word elements and animates each word independently with staggered timing. A signature motion graphics technique where words move through space independently.

## Usage

```javascript
const id = Yappy.createText(100, 200, 'Motion Graphics Are Awesome');

Yappy.kineticBounceIn(id);           // Words bounce up from below
Yappy.kineticDropIn(id);             // Words fall from above
Yappy.kineticScaleReveal(id);        // Words scale from center outward
Yappy.kineticSlideIn(id);            // Alternating left/right slides
Yappy.kineticFadeUp(id, 2000);       // Gentle fade + float up (2s)
```

## Available Presets

| Preset | Effect | Easing | Stagger Pattern |
|--------|--------|--------|-----------------|
| `kineticBounceIn` | Words start below, bounce up | `easeOutBounce` | left → right |
| `kineticDropIn` | Words fall from above | `easeOutBounce` | left → right |
| `kineticScaleReveal` | Words scale from 0 at center | `easeOutBack` | center → edges |
| `kineticSlideIn` | Odd words from left, even from right | `easeOutCubic` | left → right |
| `kineticFadeUp` | Words fade in and float up gently | `easeOutQuad` | left → right |

### Parameters

All presets share the same signature:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `duration` | 1500 | Total animation duration in ms |

## How It Works

### Architecture: Split → Animate → Deferred Restore

The kinetic typography system follows a 3-phase lifecycle:

**Phase 1 — Split (`getOrSplitWords`)**
1. Reads text from the element (`text` or `containerText`)
2. Splits by `\n` (paragraphs) then word-wraps within element width (matches `text-renderer.ts`)
3. Measures each word's start position **within the full line string** using `ctx.measureText(prefix)` — this preserves cumulative kerning from the canvas renderer
4. Handles `textAlign` (left/center/right) to match original text positioning
5. Creates individual `text` elements at precise (x, y) offsets
6. Groups all word elements via shared `groupIds`
7. Saves **full element state snapshot** (x, y, width, height, opacity, angle) for precise restore
8. Hides original element (opacity → 0), keeps it in store
9. Caches word IDs + state for replay

**Phase 2 — Animate (`runKineticAnimation`)**
1. Sets all word elements to their "from" state (off-screen, invisible, etc.)
2. Creates a single `animationEngine` instance for the entire animation
3. On each frame, computes per-word progress based on stagger timing
4. Applies easing and interpolates between "from" and "to" states per word

**Phase 3 — Deferred Restore (on animation complete)**
1. Snaps all words to their final "to" positions — words stay visible as final state
2. Calls `config.onComplete` immediately (sequence animator can schedule its restore)
3. After 1 second delay: restores original element to exact saved state, removes word elements
4. Clears the word cache

### Why Deferred Restore?

Individual canvas `fillText("Hello")` + `fillText("World")` calls can never pixel-match a single `fillText("Hello World")` due to canvas subpixel rendering and font hinting differences. Even with precise kerning-aware positioning, a tiny visual shift is unavoidable on swap. The deferred approach (1s) ensures the swap happens well after the user's attention has moved on from the animation completion moment.

### Precise Word Positioning

Word positions are calculated to match exactly where `text-renderer.ts` renders each word:

1. **Line-context measurement**: Instead of summing individual word widths (`wordWidth + spaceWidth`), we measure each word's offset within the full line string (`measureText("Hello World".slice(0, wordStart))`). This preserves cumulative kerning.

2. **Text alignment**: Handles `left`, `center`, and `right` alignment by calculating `lineStartX` the same way as the text renderer.

3. **Renderer padding offset**: Each word element's text renderer adds `padding = 4px` internally. Word element `x` is set to `lineStartX + wordOffset - padding` so that the rendered text appears at the correct position.

4. **Multiline support**: Splits on `\n` first, then word-wraps within `element.width - padding * 2` to match how `text-renderer.ts` wraps text. Each line's words are positioned at the correct `y` offset.

### Single Animation Engine Pattern

All word elements are driven by a **single** `animationEngine.create()` call (the "charByChar pattern"). This avoids conflicts that arise from multiple simultaneous `animateElement()` calls on freshly created elements.

### Word Cache

A `kineticWordCache` map stores `originalElementId → { wordIds, originalState }`. This enables:
- **Replay**: If cached words still exist in the store, they're reused without re-splitting
- **Precise restore**: Full element state snapshot (x, y, width, height, opacity, angle) ensures exact restoration
- **Staleness detection**: If word elements are gone (e.g., after undo), the cache is cleared, original element is restored, and a fresh split occurs

## Conflict Properties

Kinetic animations modify `x`, `y`, `width`, `height`, and `opacity` on word elements (not the original element). Since word elements are freshly created, conflicts with existing animations are unlikely.

The original element only has its `opacity` modified (hidden during animation, restored after).

## Known Issues & Learnings

### Issue: Elements Hidden Immediately (Fixed)
**Symptom**: Text element disappears instantly with no animation.
**Root Cause**: Original implementation used N separate `animateElement()` calls (one per word). Multiple animation engine entries conflicted on freshly created elements.
**Fix**: Single `animationEngine.create()` with per-frame `onUpdate` callback (charByChar pattern).

### Issue: Animation Only Plays Once (Fixed)
**Symptom**: First play works, replay does nothing.
**Root Cause**: `splitTextToWords` removed the original element. On replay, element ID didn't exist.
**Fix**: `kineticWordCache` map stores word IDs. Replay reuses cached words if they still exist.

### Issue: Animation Effects Lost After Restore (Fixed)
**Symptom**: After animation with "restore after" enabled, element's animation data lost.
**Root Cause**: Original element was REMOVED from store, destroying its animation data. Sequence animator couldn't find it.
**Fix**: HIDE (opacity 0) instead of remove. Element stays in store, sequence animator can restore.

### Issue: Visual Jerk on Animation Complete (Fixed — Multi-part)
**Symptom**: Text jumps/shifts when animation finishes.
**Root Cause**: Multiple compounding precision issues:

1. **Padding double-count** — Word elements positioned at `element.x + padding`, but the word element's own text renderer adds another `padding` offset. Every word was 4px too far right.
   *Fix*: Position word elements at `lineStartX + wordOffset - padding` to account for renderer's internal padding.

2. **Individual word measurement** — Summing `wordWidth + spaceWidth` loses cumulative kerning that the canvas uses when rendering a full line string.
   *Fix*: Measure each word's start position within the full line using `measureText(prefix)`.

3. **Text alignment ignored** — Word positions assumed left-alignment. Center/right aligned text had completely wrong positions.
   *Fix*: Calculate `lineStartX` based on element's `textAlign`, matching `text-renderer.ts`.

4. **Canvas subpixel mismatch** — Individual `fillText` calls can never pixel-match a continuous string due to font hinting differences.
   *Fix*: Deferred restore (1s delay). Words stay visible as final state. Swap happens after user's attention has moved on.

5. **Partial state restore** — Only opacity was saved/restored. If anything changed during animation, the element shifted on restore.
   *Fix*: Save full state snapshot (x, y, width, height, opacity, angle) before animation, restore all of it.

### Issue: Single-Line Layout for Multiline Text (Fixed)
**Symptom**: All words placed on one horizontal line regardless of original text wrapping.
**Root Cause**: `getOrSplitWords` split by whitespace and only advanced `currentX`, never wrapping to new lines.
**Fix**: Replicate `text-renderer.ts` layout — split on `\n`, word-wrap within element width, position per-line with `lineHeight` and vertical centering.

## Notes

- Only available for `text` type elements
- Supports multiline text (explicit newlines and word-wrapped)
- Supports all text alignments (left, center, right)
- Undo (Ctrl+Z) restores the original text element (single history entry)
- The split uses `pushToHistory()` for a clean undo point
- Word elements are temporary — removed ~1s after animation completes
- After cleanup, the original text element is restored to its exact pre-animation state
