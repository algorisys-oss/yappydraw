# PPTX import parity plan

Status: **P1–P3 shipped (v0.8.304); P4a + 100 % stacking + combination charts (v0.8.305); P4b (v0.8.306)** (2026-11-05). Next: P5 (animations). Branch to use: `feat/pptx-parity`.

## Goal

Close the gaps the help page lists under *Opening PowerPoint files ▸ Not imported yet*
(`frontend/src/help-docs/features/workspace.md`), using DeckCraft as the reference
implementation. "Parity" here means: everything a real deck contains comes in **looking right**,
and comes in **editable** wherever Yappy has a matching object. It does not mean Yappy grows a
PowerPoint feature for every OOXML construct.

**Out of scope (decided 2026-11-04): legacy binary `.ppt`** — no reader, no special handling.
DeckCraft doesn't read it either (its `cfb.rs` only detects password-protected packages). Users
convert to `.pptx` with PowerPoint or LibreOffice first.

## Reference

DeckCraft — `/home/rajesh/opensource/storytold/office/deckcraft` (Rust, MIT/Apache, read-only).
Our importer already follows its reader (`frontend/src/utils/pptx/read.ts` header credits
`crates/pptx/src/read.rs`, `model/src/resolve.rs`, `color/src/lib.rs`), so this extends an
existing port rather than starting one. Port by **translating to TypeScript**, not by compiling
the crates to WASM: the parsing is small next to a second toolchain beside AssemblyScript, and the
TS reader is injectable-parser + bun-testable today. Keep the MIT/Apache attribution in each
ported file's header and in `ATTRIBUTION`/licence notes.

| Area | DeckCraft source | Lines |
|---|---|---|
| EMF/WMF/EMF+ | `crates/metafile/src/*` (+ `render/src/metafile.rs`) | ~7.2k (2k of it tests) |
| Charts, classic | `crates/pptx/src/read/chart.rs`, `render/src/chart.rs`, `render/src/radar.rs` | 862 + 1.5k + 190 |
| Charts, 2016 (`cx:`) | `crates/pptx/src/read/chartex.rs`, `render/src/chartex.rs` | 180 + 660 |
| Animation timing | `crates/pptx/src/read/timing.rs` (+ tests `trigger_steps.rs`, `parent_delays.rs`, `media_timing.rs`) | 370 |
| WordArt warps | `crates/geom/src/warp.rs`, `render/src/warp.rs` | 1k + 230 |
| OLE objects, media | `crates/pptx/src/read/shapes.rs`, tests `ole.rs`, `corpus_media.rs` | — |

## Where Yappy stands (verified in code)

- **Pictures**: `Media.ext` already recognises `emf`/`wmf`/`tiff`; `to-yappy.ts:598` turns them
  into a placeholder with a warning.
- **Charts**: `ChartKind = column | bar | line | area | pie | doughnut`
  (`utils/chart/chart-layout.ts:8`). `read.ts` `PLOTS` maps only those; everything else hits the
  labelled placeholder frame (`read.ts:1269`).
- **Embedded objects**: same placeholder frame; the OLE object's preview picture is ignored.
- **Media**: not read at all. Yappy *has* a `video` element (`types.ts:671`, direct URL / data,
  autoplay, loop, muted) but no audio element.
- **Animations**: `animsOf` (`read.ts:1553`) skips motion paths, triggered sequences and
  `txEl` paragraph builds. Yappy's animation model already has a `path` motion type
  (`animation-types.ts:217`, SVG `d`, `orientToPath`, `isRelative`).
- **WordArt**: `prstTxWarp` is ignored, text comes in flat. Yappy has envelope/mesh warp
  (`utils/envelope-warp.ts`, `el.warp`) and text-on-path.
- **Speaker notes**: plain text only. **Paragraph alignment**: imported and rendered, but no UI.

## Phases

Ordered by value per effort. Each phase ships on its own (own release, own help-doc update).

### P1 — EMF/WMF pictures *(highest value, self-contained)*

Older decks and anything pasted from Office/Visio use them for logos and diagrams; today each one
is a grey box.

- Port `crates/metafile` to `frontend/src/utils/metafile/` (`emf.ts`, `wmf.ts`, `emfplus.ts`,
  `canvas.ts` for the DC state, `dib.ts` for embedded bitmaps). Output the same neutral model:
  filled/stroked paths, pattern fills, RGBA bitmaps, text runs, rect clips.
- Convert that model to **SVG** (paths, `<image>` for DIBs, `<text>` with the named font,
  `clipPath` for clip rects) and import it as an `svg` picture. That keeps the vector quality, works
  in both render styles and every exporter for free, and avoids a new element type. Option to
  ungroup it into editable paths later (Yappy's SVG import already does that).
- Keep DeckCraft's limits (item cap, bitmap pixel cap, save-stack depth, byte budget) and its
  "shorter picture, never a throw" rule.
- Tests: port the relevant cases of `metafile/src/tests.rs` to `utils/metafile/*.test.ts`; add a
  few real EMF/WMF fixtures from the LibreOffice corpus.
- Effort: largest port, lowest design risk. ~1 week.

**P1 as built (2026-11-04).** `frontend/src/utils/metafile/` ports DeckCraft's reader file by file
(`bytes`, `geom`, `clip`, `cliprect`, `dib`, `text`, `canvas`, `emf`, `wmf`, `emfplus`), plus
`svg.ts` (Picture → SVG), `png.ts` (sync PNG encoder) and `encoded.ts` (EMF+ PNG/JPEG/GIF kept
encoded instead of decoded). `metafileToSvgImage` is what `to-yappy.ts` `decodeImages` calls, so
pictures, crops, picture fills, slide backgrounds and grayscale all get it. Tests:
`metafile.test.ts`, 95 cases (DeckCraft's, ported, plus additions).

Beyond DeckCraft, each with a test: EXTSELECTCLIPRGN in device units; an EMF window with no
viewport draws 1:1; "dual" EMF+ files with no EMF drawing play their EMF+ records; palettes
(PALETTEINDEX); SELECTCLIPPATH (convex exact, else bounding box); FILLRGN/PAINTRGN/FRAMERGN;
ANGLEARC; POLYDRAW; SETARCDIRECTION; XML-invalid characters dropped from text.

Checked against LibreOffice on its 84 `emfio` test files plus 37 Inkscape outputs: all 121 parse,
84 match closely; the rest are LibreOffice's own approximations (hatches, transparent text
backgrounds), text-metric noise, or the gaps below. In the app: five decks with EMF/WMF pictures
render in both styles, after a PPTX round trip, and as vector PDF.

Still open from P1: WMF META_BITBLT/STRETCHBLT with device-dependent bitmaps (one test file);
rotated clip rectangles (taken as their bounding box); EMF+ custom line caps; non-convex clip
paths are their bounding box. PPTX export writes an imported metafile back as a PNG (the
exporter rasterises SVG images), not as the original EMF.

### P2 — TIFF and OLE previews *(small)*

- **TIFF**: decode baseline TIFF (uncompressed, PackBits, LZW, Deflate; strips and tiles; 8-bit
  RGB/RGBA/grey/palette) to PNG at import. Anything else stays a placeholder with the existing
  warning. Check DeckCraft's decoder (`engine/src/cmd/insert/picture.rs` → its image crate) before
  writing one; `fflate` already covers Deflate.
- **OLE objects**: `p:graphicFrame/…/p:oleObj` carries a fallback picture (`p:pic`, often EMF —
  hence after P1). Import that picture with the frame's alt text; warn that the object itself
  (Excel sheet, Visio drawing) can't be edited. See DeckCraft `tests/it/ole.rs`.

**P2 as built (2026-11-05).** `frontend/src/utils/tiff.ts` is our own baseline decoder (DeckCraft
uses the `image` crate, nothing to port): first image, strips or tiles, none/LZW/Deflate/PackBits,
predictor 2, grey 1–16 bit either polarity, palette, RGB/RGBA 8/16 bit (associated alpha
unpremultiplied), CMYK 8 bit. JPEG-in-TIFF, YCbCr, planar, float and BigTIFF return null and keep
the placeholder. `decodeImages` encodes the result as a PNG data URL. OLE: `previewOf` in
`read.ts` takes the `oleObj/p:pic` fallback (2010+) or the VML `v:imagedata` by `spid` (2007;
`vmlDrawing` and `legacyDrawing` relationships), keeps the fallback pic's fill/outline as a shape
behind it, and warns with the progId; other unmodelled frames with a picture get it too. Checked
against Pillow (30-file matrix + LZW stress) and against LibreOffice on six corpus decks with OLE
objects (Word, Excel sheet, Excel chart, MathType equation) in both styles and through a PPTX round
trip. Open: the object itself is not written back on export (the picture is), so a PowerPoint
round trip turns the object into a plain picture.

### P3 — Media

- **Video** (`p:pic` with `a:videoFile` / `p14:media`): extract the part, import as Yappy's `video`
  element with the poster frame from the `p:pic` blip, and map `p:timing` media nodes to
  autoplay/loop/muted. Linked (external) videos use the URL.
- **Audio** (`a:audioFile`, `a:wavAudioFile`): Yappy has no audio element. Options: (a) a `video`
  element showing the speaker icon picture, playing audio only; (b) a small new `audio` element.
  Decided: (a).
- Size: media can be tens of MB inside the document. Respect `MAX_PART_BYTES`; above a soft cap
  (e.g. 50 MB) keep the poster and warn instead of embedding. Check the save path and IndexedDB
  quota with a large deck.
- Formats the browser can't play (WMV, AVI, legacy codecs) keep the poster and get a warning; no
  transcoding (DeckCraft's codecs exist because it has no browser).
- Export: `from-yappy.ts` should write video back out, or the round trip loses it. Scope with P3.

**P3 as built (2026-11-05).** `read.ts` `clipOf` reads `p14:media` first, then
`a:videoFile`/`a:audioFile`/`a:quickTimeFile`, then `a:wavAudioFile`; `applyMediaTiming` copies
`cMediaNode` mute/loop and an un-clicked `playFrom` (autoplay) from the timing tree. `to-yappy.ts`
`mediaElements` makes a `video` element: playable formats (`video-utils.ts` `clipMime`) as a data
URL, links kept, audio with a speaker-icon poster and a 320 px player bar; WMV/AVI/MPEG/WMA/MIDI,
clips over 25 MB or past 50 MB per deck, and local-file links keep the poster with a warning.
`from-yappy.ts` `mediaItem` writes clips back (`p14:media` + `a:videoFile`/`a:audioFile`,
`cMediaNode`, autoplay `playFrom`); YouTube/Vimeo go as a linked picture. Checked on six corpus
decks (`temp/media-e2e.mjs`: both styles, autoplay, click to play, export → reimport, LibreOffice
opens the export). Fixed on the way: #477–#479. Not done: trim and fade on a clip, play across
slides, bookmarks.

### P4 — More chart types

Two layers here: reading (cheap, DeckCraft has it) and drawing (Yappy's chart renderer has to learn
each type).

- P4a: **scatter** (incl. lines/smooth), **bubble**, **radar** / filled radar, **stock** (HLC, OHLC
  as a line + high-low bars). Extend `ChartKind`, `ChartSpec` (x values for scatter/bubble,
  sizes for bubble), the layout and renderer in `utils/chart/`, the data-editing dialog, and
  `chart-xml.ts` so export writes them back. Port reading from `read/chart.rs`; draw following
  `render/chart.rs` / `radar.rs`.
- P4b: **2016 types** (`cx:` / chartex): waterfall, funnel, histogram, pareto, box & whisker,
  treemap, sunburst. These need new layouts each. Decided: read the cached values and draw them once
  as a **static vector group**, data kept in alt text. Native editable charts later, per demand.

  **As built (2026-11-05).** `utils/chart/chartex-layout.ts` lays each out as chart ops (waterfall
  with subtotals and connectors; funnel; histogram bins — width, count or Scott's rule, `[a, b]` then
  `(a, b]` — or category sums; Pareto sorted with a cumulative line on a 0–100 % axis; box & whisker
  with exclusive/inclusive quartiles, 1.5 IQR whiskers, mean, outliers; squarified treemap with
  group banners; sunburst rings), `utils/pptx/chartex-items.ts` turns ops into a group of shapes,
  `read.ts` `chartexOf` reads `cx:chartData` (levels, values), `layoutPr` (subtotals, binning,
  quartile method), title, legend and the theme accents. `resolveMc` takes a `cx*` Choice and keeps
  its Fallback (`MC_FALLBACK`) for region maps and parts without cached values (Excel's own files
  keep chart data in the sheet: `_xlchart.v1.0` defined names). Checked on LibreOffice's 18 chartEx
  test files (caches filled from their workbooks with `temp/cx-fill.ts`) and two PowerPoint decks,
  both styles, and a PPTX round trip opened in LibreOffice.
- Also fix while here: combination charts (today first type only) and true 100 % stacking.

**P4a as built (2026-11-05).** `ChartKind` gains `scatter`, `bubble`, `radar`, `filledRadar`,
`stock`; `ChartSeries.sizes` (bubble area) and `ChartSpec.lines`/`smooth` (scatter). Scatter and
bubble read the category column as X values (`xValue`; none numeric → 1, 2, 3…). Layout:
`layoutXY` (value X axis, 1/6 auto-range rule so years don't start at 0, Catmull-Rom `smoothPoints`,
bubbles ∝ √size, largest ¼ of the plot), `layoutRadar` (after DeckCraft `radar.rs`), `layoutStock`
(high-low line; 4 series → up/down box, 3 → close tick). Renderer: outlined rects and translucent
outlined dots, both styles. Read: `xVal`/`yVal`/`bubbleSize`, `scatterStyle` + per-series
`ln/noFill`, `radarStyle`, same-type plot groups merged (#481), Y from the vertical `valAx`, series
with their own X stacked into one column, date category caches formatted (#480). Write: native
`scatterChart` (two `valAx`), `bubbleChart`, `radarChart`, `stockChart` (`hiLowLines`,
`upDownBars`; not 3–4 series → line chart), workbook with numeric X and bubble size columns. Dialog:
the new kinds, X column, Y/Size per bubble series, Lines/Smooth, notes; all five locales. Checked on
27 LibreOffice chart test files (pptx/xlsx/docx, `temp/xy-corpus.ts`) against LibreOffice's own
rendering, and exports opened in LibreOffice. Not done: secondary axes, trendlines, error bars,
marker shapes, axis titles.

**100 % stacking and combination charts (2026-11-05).** `ChartSpec.percent`; `ChartSeries.kind`
('column' | 'line' | 'area') and `secondary`, honoured on column, line and area charts
(`canCombine`, `seriesKind`, `onSecondary`). `layoutAxes` rewritten around per-series type and
axis: a range per axis, a right-hand tick column, areas → columns → lines, stacks only for the
chart's own type, 100 % by each category's total of magnitudes. Read: column/line/area groups
combine, the primary axis is the first group's (also the range source), other types dropped with
a warning. Write: a plot group per type and axis, unique series indices, a hidden second `catAx`
and a right `valAx` (`crosses max`), `percentStacked` + `0%` axis format. Dialog: 100 %, per-series
type and Right axis. Known gap: LibreOffice's `tdf140489` (area + line + scatter on dates) comes in
with the scatter part dropped and values that don't match LibreOffice's axis.

### P5 — Animations: motion paths, by-paragraph, triggers

- **Motion paths** (`p:animMotion path="M … E"`): PowerPoint paths are relative to the slide
  (fractions of slide width/height) and start at the shape's position. Convert to SVG `d` in
  pixels, set `isRelative`, map `rAng`/`ptsTypes`/`origin` and auto-rotate. Model mapping already
  exists. Export back in `anim-map.ts`.
- **By-paragraph builds** (`bldP build="p"`, `txEl/pRg`): Yappy has no per-paragraph animation
  target. Options: split the text box into one text box per paragraph on import (looks identical,
  changes editing) or add a paragraph-range target to the animation model. Decided: the model change;
  splitting is lossy.
- **Triggers** (interactive sequences, `tgtEl` on `stCondLst`): needs "play when shape X is
  clicked" in the slide player. Check whether Yappy's click actions can host it; otherwise
  import them as on-click effects in the main sequence and warn.
- Port DeckCraft's `trigger_steps`, `parent_delays` and `media_timing` tests as fixtures; they
  encode the timing edge cases (nested delays, grouping).

### P6 — WordArt warps

- Port `crates/geom/src/warp.rs`: the 40 `prstTxWarp` presets as fill bands and follow bands,
  with DeckCraft's measured guide curves.
- Fill-band presets (`textInflate`, `textWave1`, `textSlantUp`, …) can map onto Yappy's
  envelope/mesh warp **if** `el.warp` applies to text elements and their exports. Follow-band
  presets (`textArchUp`, `textCircle`, …) map onto text-on-path. **Verify both before
  committing to this path**; the fallback is a new `textWarp` attribute rendered in both sketch and
  architectural styles (CLAUDE.md render parity).
- Keep the text editable; the warp is a property, not baked outlines.

### P7 — Small leftovers

- Speaker notes: keep bold/italic and bullet levels if the notes pane can show rich text;
  otherwise leave plain.
- A paragraph-alignment control in the text toolbar (today the alignment imports but can't be
  edited per paragraph).

## Verification (every phase)

- Unit tests next to the code (`bun test` via `npm test`), with fixtures, including DeckCraft's
  test cases where they port.
- **Corpus run**: LibreOffice `sd/qa/unit/data/pptx` (~440 decks) through
  `temp/pptx-corpus-*.{ts,mjs}`. Record the warning counts per category before and after each
  phase; the phase's category should fall to (near) zero with no new crashes or new warnings
  elsewhere.
- Visual check of a handful of affected decks in **both** sketch and architectural styles, and in
  PNG/PDF/PPTX/HTML-player exports (rebuild the player when shapes/renderers change).
- Hostile-input check: truncated and oversized EMF/TIFF/media parts must give warnings, never a
  throw past `readPptx`.

## Docs per phase

Update `workspace.md` ▸ *Opening PowerPoint files* (move each item out of *Not imported yet*), the
chart / animation / video help pages it touches, `api.ts` comments for `importPPTX` and any new
chart kinds or animation fields, `whats-new.ts`, and the release note.

## Decisions (2026-11-04)

1. **Audio** (P3): plays through a `video` element showing the deck's speaker-icon picture. A
   dedicated `audio` element only if that proves awkward.
2. **2016 chart types** (P4b): drawn once as a static vector group from the cached values, data in
   alt text. Native editable versions later, per demand.
3. **By-paragraph builds** (P5): the animation model gets a paragraph-range target. Splitting text
   boxes was rejected: it looks right but changes how the text edits afterwards.
4. **Release**: phase by phase, each phase its own release; no Dev Mode gate, since every phase is
   complete in itself.
5. **Legacy `.ppt`**: out of scope (see top).

## Estimate

P1 ~1 week · P2 2–3 days · P3 ~1 week · P4a ~1.5 weeks, P4b 3 days static / 3+ weeks native ·
P5 ~1.5 weeks · P6 ~1 week · P7 2–3 days. Roughly 6–8 weeks for everything with static 2016 charts.
