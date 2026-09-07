# Dark mode — how canvas colours are themed

## Goal
A near-**black** drawing should read as **light** on the dark canvas (and white → dark),
while **saturated** colours (yellow, red, blue, …) stay **true**. Stored colours never change
(WYSIWYG); theming is a *display-time* transform only.

## How it works now (per-colour, render-time)
All canvas colours pass through **`RenderPipeline.adjustColor(color, isDarkMode)`**
(`frontend/src/shapes/base/render-pipeline.ts`). In dark/focus mode it:

1. parses the colour (`#rgb`/`#rrggbb`/`#rrggbbaa`/`rgb()`/`rgba()`; `transparent` passes through),
2. converts to HSL,
3. **inverts lightness weighted by how grey the colour is**:
   ```
   newL = L + (1 - 2·L) · (1 - S)
   ```
   - S ≈ 0 (grey/black/white) → full lightness swap (black ↔ white)
   - S ≈ 1 (vivid)           → unchanged (true colour)
4. keeps hue & saturation, returns rgb/rgba. Results are cached per input string.

`isDarkMode` = `resolvedTheme === 'dark' || resolvedTheme === 'focus'`.

## Where it's applied
- **Shapes / strokes / fills / text** — already routed through `adjustColor` in the render pipeline.
- **Canvas background** — `renderWorkspaceBackground` (`utils/canvas-renderer.ts`).
- **Grid** — `renderGrid`; **canvas textures** (notebook/dots/grid/graph) — `renderCanvasTexture`.
- **Text-editing overlays** — `text-editing-overlay.tsx`, `rich-text-editing-overlay.tsx` apply
  `adjustColor` to the editing text colour so it matches the committed result.

## What was replaced (history)
Previously dark mode was a **global CSS filter** `invert(93%) hue-rotate(180deg)` on the host
`<canvas>` (and mirrored on the text overlays + texture div). That flips black↔white but is lossy
for saturated colours — e.g. **yellow `#fcc419` came out brown** — because `invert` flips lightness
for *every* pixel and `hue-rotate` only approximately restores hue. The filter has been removed from
the main canvas; per-colour `adjustColor` replaces it. (A separate decorative DOM paper/dots overlay
in `canvas.tsx` still uses its own filter — it's self-contained.)

Bonus: embedded **images now render true-colour** in dark mode (the old filter inverted them too).

## Exports / WYSIWYG
Export paths render with `isDarkMode = false`, so PNG/SVG exports are always true-colour
(light-mode canonical) regardless of the editor theme.

## How to tweak later
- **Make colours swap harder/softer:** change the weight in `adjustColor` — e.g. use `(1 - S)^k`
  (k>1 preserves more mid-saturation colours; k<1 swaps more of them).
- **Threshold instead of smooth blend:** swap lightness only when `S < someThreshold`.
- **Per-property control:** `adjustColor` receives the raw colour only; pass extra context if you
  want different rules for strokes vs fills vs text.
- **Turn dark theming off entirely (true WYSIWYG dark):** make `adjustColor` return `color`
  unconditionally and give the canvas a dark background — but then default black strokes vanish on dark.
- **Quick visual check:** drop a yellow + a black shape, toggle theme; yellow must stay yellow,
  black must go light, canvas must go dark.
