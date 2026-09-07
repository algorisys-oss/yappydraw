# Dark / Light Theme

## Architecture

Yappy supports four user-facing theme choices: `light`, `dark`, `focus`, and `system`.
The store distinguishes the **user's choice** (`store.theme`) from the **resolved
theme** that drives rendering (`store.resolvedTheme`).

| Layer | What it is | Type |
|-------|-----------|------|
| `store.theme` | What the user picked | `'light' \| 'dark' \| 'focus' \| 'system'` |
| `store.resolvedTheme` | What's actually displayed right now | `'light' \| 'dark' \| 'focus'` |

When the user picks `system`, `resolvedTheme` is computed from
`window.matchMedia('(prefers-color-scheme: dark)')`. A media-query listener
re-resolves live whenever the OS theme changes.

## How dark / focus mode looks dark

Stored colors are **theme-canonical** (light-mode). The actual dark presentation
is achieved by a single CSS filter on the host `<canvas>` element:

```css
filter: invert(93%) hue-rotate(180deg);
```

This is the same trick Excalidraw uses. Black strokes render near-white; colored
shapes get hue-rotated to perceptually-equivalent dark-mode colors; user-stored
backgrounds get inverted automatically. **No stored color values are mutated.**
Round-tripping a scene through a theme switch is byte-identical.

The filter is applied in [`src/components/canvas.tsx`](../frontend/src/components/canvas.tsx)
and is only present when `store.resolvedTheme` is `dark` or `focus`.

## State & toggle

- `store.theme` and `store.resolvedTheme` are both persisted/derived at boot.
- `setTheme(theme)`:
  1. Persists user choice to `localStorage` and `globalSettings.theme`.
  2. Computes `resolved = resolveTheme(theme)`.
  3. Sets `store.theme` and `store.resolvedTheme`.
  4. Sets `document.documentElement.setAttribute('data-theme', resolved)` so CSS
     variables theme the UI chrome.
- `toggleTheme()` cycles `light → dark → focus → system → light`.
- A media-query `change` listener at app boot re-runs `setTheme('system')`
  whenever the OS flips and the user's choice is `system`.

## CSS

- `:root` defines light-mode CSS variables.
- `[data-theme="dark"]` and `[data-theme="focus"]` override panel/toolbar/text
  colors for dark UI chrome.
- The canvas-area appearance is **not** driven by these CSS variables — it's the
  CSS filter on the `<canvas>` element. So new dark-mode adjustments to the
  drawing surface should target the filter, not the variables.

## What does NOT change with theme

- Stored stroke/fill/text/gradient colors on elements — never mutated.
- Default stroke for new shapes is always `#000000` (light-canonical). The CSS
  filter inverts it to white at render time when `dark`/`focus` is active.
- Slide backgrounds are stored as-is and inverted only by the canvas filter.

## Known limitation: embedded raster images

The CSS filter applies to the entire canvas, including any `drawImage`-rendered
raster content. Embedded images therefore appear inverted in dark/focus mode.

**Workaround for v1**: accept this; users with image-heavy decks may prefer
`light` or `system` (when OS is light).

**Planned fix**: pre-invert image bitmaps to an offscreen canvas before drawing
them to the main canvas, so the host CSS filter cancels back to true color.
Marked with a `TODO` in `src/components/canvas.tsx` near the filter style.

## Migration from older theme implementation

Earlier versions stored white (`#ffffff`) as the default stroke when the user
was in `focus` mode. With the new canonical-colors model, that would render as
near-black under the dark-mode filter. A one-time migration in
[`src/store/app-store.ts`](../frontend/src/store/app-store.ts) (gated by the
`theme-canonical-v1` localStorage flag) flips any saved `#ffffff` default
stroke/text back to `#000000` on first run after upgrade.
