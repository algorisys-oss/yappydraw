# Product Hunt assets

Everything here was made **in YappyDraw**, by two routes:

- **`*.json`** are DSL sources rendered through the app's own pipeline
  (DSL → IR → layout → `api.ts` → SVG export), the same path the Medium article's
  figures used.
- **The product shots** are real screenshots of the app doing the thing, captured at
  Product Hunt's exact gallery size.

`thumbnail.svg` is the 240×240 feed icon, built from the app's own logo mark
(`frontend/src/components/yappy-logo-mark.tsx`) so the icon in the feed is the one in
the header. Deliberately not hand-drawn: sketch strokes turn to mush at 240px.

## The gallery

Output lands in `media/producthunt/` (gitignored, so binaries stay out of the repo).

| File | Slot | Made by |
|---|---|---|
| `00-thumbnail-240.png` | Feed thumbnail, 240×240 | logo mark |
| `01-hero.png` | Gallery 1 — the pitch, and what it does | DSL |
| `02-text-to-drawing.png` | Gallery 2 — Mermaid in, editable drawing out | DSL |
| `03-comic-studio.png` | Gallery 3 — screenplay to comic strip | app |
| `04-inflate-3d.png` | Gallery 4 — flat circles, lit in one call | app |
| `05-stick-figures.png` | Gallery 5 — the stick-figure library | app |
| `06-sketch-style.png` | Gallery 6 — the hand-drawn render style | app |

All gallery frames are exactly **1270×760 PNG**, each far under the 3MB cap.

Order matters. `01-hero` is the first impression, and `03-comic-studio` is the frame
most likely to earn a click, so keep it early rather than burying it.

## Regenerating

```bash
npx vite --port 5223 --strictPort &            # the renderer drives a real app
npm run render:dsl -- docs/producthunt-assets/*.json -d media/producthunt
node articles/vibe-architecting-yappydraw/images/svg2png.mjs media/producthunt/*.svg
```

Then fit each PNG to 1270×760. The SVG exporter crops to the real drawn bounds, which
is right for an article figure and wrong for a fixed-size gallery slot.

## Two things learned making these

- **`zoomToFit` does not allow for the top bar and the status bar.** The first take of
  `06-sketch-style` ran off the bottom edge and the boxes were cut in half. The fix is
  to compute the content bounds and call `setView` with margin rather than trusting the
  fit.
- **Toasts land in screenshots.** "Inflate applied" sat in the middle of `04` on the
  first pass. They are now removed from the DOM immediately before capture rather than
  waited out, since their timing is not ours to control.
