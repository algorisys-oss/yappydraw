# Design-demo generators (YappyDraw logo/poster videos)

Programmatic, captioned "design-process" videos + logo/poster assets, all built through the
public `window.Yappy` API and driven by Playwright. Each generator opens the **YappyDraw**
editor, choreographs a synthetic cursor + captions like a YouTube-Shorts design short, and
exports a video plus the final artwork (PNG/SVG) and an editable Yappy document (JSON).

> This file is the **prompt/brief archive** — edit it and the scripts to iterate.
> `docs/` and `tests/` are in `.ossignore`, so these stay private (not pushed to OSS).
> Renders land in `media/**`, which **is** tracked in GitHub but **excluded from OSS** (`.ossignore`).

## Generators (scripts)

| Script | What it makes | Output folder |
|---|---|---|
| `tests/algorisys-poster.spec.ts` | Algorisys product poster (HRMS/Payroll/SkillzEngine), live "designed on screen" recording | `media/` |
| `tests/propeak-1.spec.ts` | ProPeak peak-logo, QHD, demonstrates **Image Trace → Line → Pen → Type** | `media/` |
| `tests/propeak-2.spec.ts` | ProPeak **P+P monogram**, YozDesigner white-canvas style (Type→Outlines→Pathfinder Unite→app icon) | `media/` |
| `tests/propeak-variations.spec.ts` | **6-variation** ProPeak exploration board + final hero, intro card | `media/propeak-variations/` |
| `tests/algorisys-logo.spec.ts` | **One** clean Algorisys logo (cube + wordmark) built step-by-step (human process) | `media/algorisys-logo/` |

## How to run

```bash
npx vite                                  # note the port it binds (e.g. 5175)
YAPPY_URL=http://localhost:5175 \
  npx playwright test tests/<generator>.spec.ts --reporter=line --workers=1
```

The dead app-load intro (~12s) is measured and **trimmed** off automatically; an `.mp4`
(`-crf 18`, high quality) and `.webm` are written, plus PNG/SVG/JSON.

## The brief / prompt (reusable)

> Build a **vertical 9:16 (QHD 1440×2560)** design-process short in YappyDraw for **<brand>**.
> Open on the **loaded YappyDraw editor** with a branded intro card (never a blank screen).
> Show a **human designing**: select tools from the toolbar (they highlight), draw the
> **strokes** with a synthetic cursor that glides + click-pulses, reveal **anchors** on
> vector paths, and visibly use **settings** (fill colour, stroke width) via the properties
> panel. Caption each step like a Shorts tutorial. Keep it **simple and iconic** (think
> Nike/Netflix/Adidas/Amazon). **Pure vector — never embed raster images in a logo.** End on
> the finished logo, hold, then export mp4/webm + PNG/SVG + editable JSON to a unique folder.

Per-brand notes:
- **Algorisys** — simple/iconic; identity = a clean **isometric cube** (vector, orange+blue,
  one accent) + "Algorisys" wordmark in a single navy. Simplify the legacy busy multicolour
  wordmark + wireframe cube. One clean logo (not an exploration board).
- **ProPeak** — performance analytics; peak/upward-trend motif; emerald→cyan.

## Reusable engine (inside each `page.evaluate`)

- **Cursor**: a fixed `<div>` SVG pointer; `moveTo(worldX,worldY)` (world→client via `setView(1,OX,OY)`
  identity + pan), `clickFx()` pulse ring.
- **Captions**: bottom pill (`cue(text,color)`); optional top concept label + full-screen `intro` card.
- **Tools**: `ensureTool(kind)` finds the toolbar button by `title` (regex), moves the cursor there,
  clicks it (highlights), and calls `Y.setSelectedTool`.
- **place(kind,wx,wy,fn,pause)**: ensure tool → glide → click → run `fn()` (the create call) → settle.
- **Settings gesture**: move cursor to the right-hand properties panel + `clickFx`, then apply via API.
- **Exports**: `Yappy.exportRegion(0,0,W,H,name,2,false)` → PNG dataURL; `Yappy.exportSVG()`; and
  `Yappy.state` → `{elements,viewState,layers,gridSettings,canvasBackgroundColor,version}` for JSON.
- **Trim**: measure `tBuildStart - tVideoStart`; `ffmpeg -ss <lead>` to drop the load intro; emit mp4+webm.

## Gotchas learned (don't re-hit these)

- **Typed text wraps vertically** if created empty — set the element `width` (= `estW(full,fs)`) up front,
  `autoResize:false`. Single words (no spaces) don't wrap; multi-word do.
- **Image Trace** needs a **dark shape on a light background** (threshold trace), and the image must be
  loaded first (sleep + retry). Trace returns new path ids; delete the source image after.
- **Blob Brush** colour comes from the default style — `updateDefaultStyles({backgroundColor})` before `blobStroke`.
- **z-order**: elements drawn later render on top. After dropping a mark onto a tile created later, `bringToFront([mark])`.
- **Lines** inherit arrowheads — pass `startArrowhead:null,endArrowhead:null`.
- **convertTextToOutlines** is async and returns new path ids (use for a vector "Text → Outlines" beat).
- World→client mapping is identity only at `scale:1`; keep `setView(1,OX,OY)`.

## Ideas to improve

- Real property-panel control clicks (colour swatch / hex input / stroke slider) instead of the
  gesture + API shortcut, for fully authentic "settings" usage.
- Voice-style top subtitles; brand-accurate hex palettes; music-synced pacing.
- A montage step (ffmpeg `tile` filter) for contact sheets (ImageMagick not installed here).
