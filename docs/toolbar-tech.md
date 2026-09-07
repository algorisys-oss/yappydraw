# Toolbar Grouped Tool Dropdowns - Technical Notes

## Problem

Grouped toolbar tools (pen, UML, shapes, sketchnote, infra, wireframe, math, mindmap, technical) were not working on mobile. The dropdown submenus would either not appear or could not be interacted with.

## Root Cause

Two issues combined to break the dropdowns on mobile:

### 1. CSS `transform` breaks `position: fixed` descendants

The `.toolbar-container` uses a CSS `transform` for centering and drag positioning:

```css
transform: translateX(-50%) translate(${position().x}px, ${position().y}px)
```

Per CSS spec, when an ancestor has `transform`, any descendant with `position: fixed` is positioned **relative to that ancestor** instead of the viewport. This means dropdowns rendered inside the toolbar are constrained to the toolbar's coordinate space.

### 2. Mobile `overflow-x: auto` clips fixed-position descendants

On mobile, the toolbar has `overflow-x: auto` for horizontal scrolling. Combined with the `transform` issue above, the "fixed" dropdowns are treated as absolutely positioned within the toolbar and get clipped by the overflow.

## Fix Applied

### Phase 1: Portal rendering (escaping the DOM tree)

Used SolidJS `<Portal>` to render dropdown content into `document.body`, escaping the toolbar's `transform` and `overflow` constraints entirely. Changed dropdown CSS from `position: absolute` to `position: fixed` and computed position inline using `getBoundingClientRect()`.

### Phase 2: Backdrop removal (fixing click interception)

The initial Portal implementation used a full-viewport transparent backdrop div for outside-click detection:

```html
<!-- BROKEN: backdrop intercepts all pointer events -->
<Portal>
    <div class="dropdown-backdrop" />       <!-- z-index: 1000, covers viewport -->
    <div class="pen-tool-dropdown">...</div> <!-- z-index: 1001 -->
</Portal>
```

Despite the dropdown having a higher `z-index`, the backdrop intercepted pointer events and prevented any dropdown item from being clicked. Neither SolidJS delegated events (`onClick`) nor native events (`on:click`) could work around this.

**The fix**: Replaced the backdrop with a `document.addEventListener('pointerdown', ...)` listener inside a `createEffect`, with proper cleanup via `onCleanup`:

```tsx
createEffect(() => {
    if (isOpen()) {
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (buttonRef?.contains(target) || dropdownRef?.contains(target)) return;
            setIsOpen(false);
        };
        document.addEventListener('pointerdown', handler);
        onCleanup(() => document.removeEventListener('pointerdown', handler));
    }
});
```

Key design decisions:
- **`pointerdown`** instead of `click`: fires before `click`, works on both touch and mouse, avoids race conditions with the toggle button's `onClick` handler
- **`buttonRef` and `dropdownRef` containment checks**: prevents the outside-click handler from closing the menu when clicking within the dropdown or on the toggle button itself
- **`onCleanup` inside reactive `createEffect`**: SolidJS automatically runs cleanup when the effect re-runs (i.e., when `isOpen()` changes), ensuring no stale listeners

## Files Changed

All 9 tool group components follow the same pattern:
- `pen-tool-group.tsx`
- `uml-tool-group.tsx`
- `shape-tool-group.tsx`
- `sketchnote-tool-group.tsx`
- `infra-tool-group.tsx`
- `wireframe-tool-group.tsx`
- `math-tool-group.tsx`
- `mindmap-tool-group.tsx`
- `technical-tool-group.tsx`

Shared CSS: `pen-tool-group.css` (removed `.dropdown-backdrop` rule, `.pen-tool-dropdown` uses `position: fixed`)

## Key Takeaways

1. **CSS `transform` on ancestors breaks `position: fixed`** - this is per spec, not a bug. Use `<Portal>` to render fixed-position content outside the transformed ancestor.
2. **Full-viewport backdrop divs can block pointer events** even when sibling elements have higher z-index. Prefer document-level event listeners for outside-click detection.
3. **SolidJS event delegation** (`onClick`) does not propagate across Portal boundaries. Use native event binding (`on:click`) for elements rendered via `<Portal>`.
4. **`pointerdown`** is preferred over `click` for outside-click detection to avoid timing issues with the same click event that opens the menu.
