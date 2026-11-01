# Slides documents: feature gaps against DeckCraft

**Date:** 2026-10-31 · **Status:** backlog / reference. Nothing here is scheduled or built.

This is a list of presentation features Yappy's **slides** documents could add, using DeckCraft
as the reference for what a full presentation app covers. It is meant for picking from later.
Every "Yappy today" entry was checked against the code on `dev` (after v0.8.292), not taken from
docs alone. Where code and docs disagree, the code wins and the doc is noted.

**Sources**

- DeckCraft (Rust, MIT OR Apache-2.0), read-only clone: `README.md`, `docs/parity-checklist.md`
  (191 features scored against PowerPoint for Mac), `docs/file-format-parity.md`,
  `docs/slideshow-parity.md`, `docs/animation-parity.md`, `docs/architecture.md`, and the crates
  `model`, `pptx`, `anim`, `text`, `render`, `metafile`, `pdf`, `engine/src/cmd/*`.
- Yappy: `frontend/src/types/slide-types.ts`, `types.ts`, `types/motion-types.ts`,
  `store/app-store.ts`, `api.ts`, `components/slide-navigator.tsx`, `presentation-controls.tsx`,
  `export-dialog.tsx`, `utils/animation/slide-build-manager.ts`, `slide-transition-manager.ts`,
  `utils/pptx/*`, `utils/canvas-renderer.ts`, help docs `features/animation.md`,
  `features/workspace.md` (PPTX section), `features/design-studio.md`, plus `docs/slides.md`
  and `todo.md` Phase 73.

**How to read the table.** *Has* = shipped and usable. *Partial* = some of it exists, or it exists
in a different form. *Missing* = not found in the code. Effort is rough: **S** about a day,
**M** a few days to a week, **L** more than a week. "RT" in the value column means it also
improves the PowerPoint round trip.

## Feature table

### Structure: masters, layouts, themes, slide setup

| Feature | DeckCraft | Yappy today | Value for Yappy users | Effort |
|---|---|---|---|---|
| Slide master (shared artwork on every slide) | Has: masters with their own shapes, Slide Master view (`engine/src/cmd/design/master_view.rs`) | **Partial**: a layer marked "Use as Slide Master" repeats on every slide (`Layer.isMaster`, `types.ts:1109`; `docs/slides.md` §2). One master per deck, no per-layout variation, no "hide background graphics" per slide | Medium. Logos and footers already work; per-slide opt-out is the common missing piece. RT | S (opt-out) / L (real masters) |
| Layouts with placeholders (title, content, two-column…) that inherit position and formatting | Has: 11 layouts, placeholder inheritance slide → layout → master → theme (`model/src/resolve.rs`) | **Partial**: layout *generators* exist (`utils/slide-element-factory.ts`: title, content, two-column, quote, section, metrics, timeline…) used by templates, AI and Markdown import, but they drop plain elements; there is no "New slide by layout" picker and no placeholder that keeps its link to a layout. PPTX import resolves master/layout styling once, then flattens it | High. "New slide → Title and Content" is the most-used command in any deck tool. RT (placeholders are what make an exported deck re-themeable in PowerPoint) | M (picker on existing generators) / L (live placeholders) |
| Themes: colour scheme + font scheme, switchable | Has: 8 themes, colour and font schemes, variants, browse `.thmx`/`.pptx` themes | **Partial**: presentation templates carry a `SlidePalette` (`types/template-types.ts:70`); document swatches link colours (`fillSwatchId`); colour palettes in settings. No font scheme, and no "apply theme to this deck" that restyles existing slides | High for people making several decks. RT (theme colours/fonts are how PowerPoint users restyle) | M |
| Slide size presets and custom size | Has | **Has**: `setPageSize(w,h, applyAll)` and `getPageSizePresets()` (`api.ts:3810`). `todo.md` Phase 73 still lists "Aspect Ratio Options" as open; that line is stale | — | — |
| Slide backgrounds (colour, gradient, picture) | Has, plus pattern | **Has**: `Slide.fillStyle`, `gradientStops`, `backgroundImage`, `canvasTexture` (`slide-types.ts:53`); `updateSlideBackground` | — | — |
| Header and footer: slide number, date, footer text | Has, as fields (`text/src/datetime.rs`, `engine/src/cmd/insert/text_fields.rs`) | **Partial**: `=Page ${slideNumber} of ${totalSlides}` formula text (`canvas-renderer.ts:1086`, `docs/slides.md` §3). No date field, no Insert → Header & Footer dialog, no "don't show on title slide". The `=` prefix is undiscoverable, and no help-docs page explains it (only `docs/slides.md`) | Medium. Every deck that gets printed or shared needs numbers. RT if written as `a:fld` | S |
| Sections (named groups of slides, collapse in the navigator) | Has | **Missing**: `Slide` has no section field; navigator is a flat list | Medium for decks over ~20 slides. RT (`p14:sectionLst`) | S–M |
| Hide slide (skip in the show, keep in the file) | Has | **Missing**: no hidden flag on `Slide` | Medium. Cheap and commonly expected. RT (`show="0"`) | S |

### Authoring views and slide management

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| Thumbnail navigator: add, duplicate, delete, reorder | Has | **Has**: `components/slide-navigator.tsx` (drag reorder, context menu insert above/below, duplicate) | — | — |
| Slide sorter / grid view | Has, with each slide's transition shown | **Missing**: `todo.md` "Slide Overview / Grid View" open; navigator has no grid mode. (Slides sit on one spatial canvas, so zooming out is a rough stand-in) | Medium. Reordering a long deck in a vertical strip is slow | S–M |
| Outline view (edit all slide titles/bullets as text) | Has; also slides from outline, outline export (RTF/TXT) | **Partial**: Markdown → slides import exists (`utils/markdown-to-slides.ts`, `importMarkdownSlides`). No outline view or outline export. (`store.outlineView` is a wireframe draw mode, unrelated) | Medium; good for writers who draft in text | M |
| Notes page / reading view | Has | **Missing** (no notes, see below) | Low on its own | S after notes |
| Find and replace across slides | Has (`engine/src/cmd/find.rs`) | **Missing** for text. Element Search (Alt+E) searches the asset library, not the deck | Medium | S–M |
| Reuse slides from another file / paste slides between decks | Has (`engine/src/cmd/reuse.rs`) | **Missing**: opening a `.pptx` replaces the document | Medium | M |
| Design Ideas (offline layout suggestions for the current slide) | Has (`engine/src/cmd/ideas.rs`: picture full-bleed, half, framed, text-only) | **Partial in spirit**: AI deck generation (`ai/slide-generator.ts`) and Magic Resize for design pages; nothing that rearranges one existing slide | Medium; nice "make it look better" button with no AI dependency | M |
| Spell check, autocorrect, thesaurus | Has (`engine/src/spell.rs`, `thesaurus.rs`) | **Missing** (only the browser's own spellcheck in text inputs) | Low–medium; the browser covers some of it | M |

### Speaker support and the slide show

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| **Speaker notes** per slide | Has; notes keep formatting; notes master | **Has** (feat/speaker-notes, 2026-11-01): `Slide.notes` (plain text), a docked notes pane under the canvas, PPTX notes read + written in both export modes, Markdown `Note:` / `<!-- -->`, template slides, `get/setSlideNotes`. Formatting inside notes is not kept | Done. RT | — |
| **Presenter view** (current + next slide, notes, timer, clock) | Has (egui viewport; timer pause/reset, notes size, see-all-slides) | **Has** (feat/speaker-notes, 2026-11-01): Alt+F5 / HUD button opens a same-origin popup the editor renders into (shares the store, no channel needed); current + next slide, notes with size control, timer, clock, keys. No see-all-slides grid; current-slide picture ignores build state | Done | — |
| Full-screen show, from start / from current | Has | **Has**: F5, Shift+F5, Esc (`help-dialog.tsx:204`); `togglePresentationMode` | — | — |
| Build steps (on click / with previous / after previous), start hidden | Has, plus by-paragraph builds | **Has**: `AnimationTrigger` `on-click`, `with-prev`, `after-prev`, `on-load`, `on-hover` (`types/motion-types.ts:3`); `slide-build-manager.ts`; "Start hidden in presentation" (`animation.md` § Click-to-Advance) | — | — |
| By-paragraph text builds (bullet by bullet) | Has | **Missing**: animations target whole elements | Medium; standard for bullet slides. RT (`bldP`) | M |
| Laser, ink, highlighter, eraser during the show | Has (pen, laser; highlighter partial) | **Has**: laser (Shift+P), ink, highlighter, eraser (`docs/slides.md` §1; `minor-handlers.ts`). Plus Spotlight, which DeckCraft lacks | — | — |
| Black / white screen (B / W keys) | Has | **Missing**: B and W are not bound in the show | Low; cheap | S |
| Go to slide by number, see-all-slides grid in the show | Has | **Missing** (Home/End and arrows only, per whats-new 0.8.105 for HTML export) | Low–medium | S |
| Auto-advance after N seconds, loop until Esc (kiosk) | Has (Set Up Slide Show) | **Missing**: no per-slide advance time; `todo.md` lists "Auto-advance Timer". (The API has a kiosk note at `api.ts:3756` for embedding, not a looping show) | Medium for unattended screens and recorded decks. RT (`advTm`) | S |
| Rehearse timings | Has | **Missing** | Low | S after auto-advance |
| Custom shows (subset/order of slides) | Has | **Missing** | Low | S–M |
| Hyperlinks and actions: link to URL, jump to slide, end show | Has (`engine/src/cmd/insert/links.rs`; safe URL schemes only in the show) | **Has** (feat/speaker-notes, 2026-11-01): `link` holds a URL, `#slide:<id>` or `#next/#previous/#first/#last/#end` (`utils/slide-links.ts`); clicking in the show follows it; Link ▸ menu; PPTX `hlinkClick` written and read. Safe schemes only. No run-level (single word) links | Done. RT | — |
| Zoom links (summary/section/slide zoom) | Partial | **Partial in spirit**: slides live on one spatial canvas, so a Prezi-style "fly to slide" is natural but not exposed as an object | Medium; fits Yappy's spatial model better than PowerPoint's | M |

### Motion: transitions and animations

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| Transition gallery | Has: fade, push, wipe, split, cover, uncover, zoom, 3-D effects, Morph; effect options; transition sounds (`anim/src/transition_fx.rs`, `transition_geom.rs`) | **Partial**: 8 types (none, fade, slide ×4, zoom in/out) with duration and easing (`slide-types.ts:8`, `slide-transition-manager.ts`) | Medium. Wipe, cover/uncover and split are cheap canvas composites and map 1:1 to PPTX. RT | S–M |
| Morph (match shapes across consecutive slides and tween them) | Has (`anim/src/morph.rs`, `geom/src/morph.rs`) | **Partial**: Display States "Magic Move" tweens one diagram between named states on the same slide (`DisplayState`, `types/motion-types.ts:111`; `morph-animator.ts`). No cross-slide matching | **High**: the single most-requested "modern" transition, and Yappy's element model (stable ids, names) makes matching easy. RT (`p159:morph`) | M |
| Entrance / emphasis / exit / motion-path effects | Has | **Has**, and broader: 100+ presets, keyframes, paths, spin/orbit (`features/animation.md`) | — | — |
| Animation pane (ordered list, reorder, timing) | Partial | **Partial**: Sequence builder and per-element animation panel (`animation.md` §355); no single deck-ordered list for the slide | Medium | M |
| Animations in PPTX export/import | Has: flat list ↔ PowerPoint timing tree (`pptx/src/write/timing.rs`, `read/timing.rs`, `model/src/anim.rs`, ids in `pptx/src/maps.rs`) | **Missing**: export writes transitions only (`pptx/deck.ts:159` `TransitionKind = fade/push/zoom`); import skips animations | **High** for anyone who builds in Yappy and presents in PowerPoint (or the reverse). RT | L (M for the common entrance/exit subset) |

### Content objects

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| Tables (styles, merge/split, cell formatting) | Has, table styles generated from theme accents (`pptx/src/tables.rs`, `model/src/table.rs`) | **Has** natively: `table` element with data, header, per-cell formats, merged cells (`types.ts:1036–1051`), plus table animations. **PPTX gap**: export sends it as grouped shapes (via recorded draw ops in `from-yappy.ts` `shapeItem`), import turns `a:tbl` into a group of cells (`read.ts:924`). Neither side is a real PowerPoint table | Medium. Export as native `a:tbl` makes tables editable in PowerPoint. RT | M |
| Charts with editable data | Has: column, bar, line, area, pie, doughnut, scatter + partial others; trendlines; PPTX chart parts read and written (`model/src/chart.rs`, `pptx/src/read/chart.rs`, `write/chart.rs`, `render/chart.rs`) | **Partial**: `barChart`, `pieChart`, `xyChart`, `quadrantChart`, `ganttChart` elements, mostly from Mermaid DSL or the Graph tool (`types.ts:879–891`). No data grid, no line/area/scatter types. PPTX: export is shapes/picture, import shows a labelled frame | **High** for business decks; charts are the top import gap after notes. RT | L |
| SmartArt | Partial (insert basics, layout, text pane; `pptx/src/dgm.rs`, `engine/src/cmd/smartart/`) | **Partial**: imported as its drawn shapes (v0.8.292). Yappy's mindmap, flowchart and layered auto-layout already cover the use case natively | Low; Yappy's diagrams are stronger | — |
| Pictures: crop, transparency, corrections, alt text | Has | **Has** crop, filters, opacity. Alt text: **Partial**, see Accessibility | — | — |
| SVG pictures | Missing | **Has** (Yappy is vector-native) | Ahead | — |
| EMF/WMF pictures | Partial: drawn as vectors (`crates/metafile`) | **Missing**: placeholders on import (`workspace.md`) | Medium for older corporate decks. RT | L |
| Video on a slide | Has, decoded in-app, play in click sequence, trim, fade, loop | **Partial**: `video` element with URL/YouTube/Vimeo, poster, autoplay on slide entry (`app-store.ts:2824`). Exported to PPTX as a poster picture (`from-yappy.ts:346` `RASTER_TYPES`); no click-sequence play, no trim | Medium. RT | M |
| Audio on a slide (narration, background music, play across slides) | Has | **Missing** for slides. Audio clips exist only on the Animation-mode timeline (`api.ts:5138`) | Low–medium | M |
| Equations | Missing | **Has** (MathJax/LaTeX) | Ahead | — |
| Icons / stock content | Has (Lucide) | **Has** and broader (Element Search: icons, illustrations, photos) | Ahead | — |

### Text

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| Bullets, numbering, levels, per-paragraph alignment | Has | **Has** (v0.8.290–.292; `design-studio.md` §182–184). Per-paragraph alignment renders but has no UI control yet (`workspace.md` PPTX section) | Small UI gap | S |
| Autofit (shrink text on overflow / resize shape to fit) | Has (`crates/text/src/layout.rs`) | **Partial**: `autoResize` hugs the text (`types.ts:710`); no shrink-on-overflow. `normAutofit` is read only for import (`pptx/read.ts`) | Medium; placeholders without shrink-to-fit overflow constantly. RT | M |
| Text columns | Has | **Missing** (`textColumns` not found) | Low–medium. RT (`numCol`) | M |
| Vertical text | Has | **Has**: `verticalText` (`types.ts:586`); exported to PPTX as a picture (`from-yappy.ts:361`) | Low; could export as `vert="eaVert"`. RT | S |
| Fields (date, slide number) | Has | **Partial**, see Header and footer | | |
| Embedded fonts (PPTX) | Has: reads/writes `p:embeddedFontLst` | **Missing** (listed known gap; fonts substitute in PowerPoint, `workspace.md`) | Medium for fidelity of custom-font decks. RT | M |

### Review, accessibility, collaboration

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| Comments (add, reply, resolve) | Has, threaded, round-trips PPTX (`engine/src/cmd/review.rs`) | **Missing** for slides. (`umlNote` / sticky notes are content, not review comments) | Medium; mainly useful once collaboration exists. RT | M |
| Alt text on objects | Has, in the Selection pane | **Partial**: `altText` is read from and written to PPTX for pictures only, as an untyped property (`(el as any).altText`, `from-yappy.ts:446`, `to-yappy.ts:485`). No UI, not on shapes, not in SVG/PDF/HTML exports | Medium; legal requirement for some users (schools, public sector). RT | S |
| Accessibility checker (missing alt text, reading order, contrast, empty titles) | Has (`review.accessibility` in `engine/src/cmd/review.rs:249`) | **Missing** | Medium; Yappy already has contrast tooling in tests that could be reused | S–M |
| Reading order (selection pane order = screen-reader order) | Has | **Partial**: the layer/object tree orders elements; nothing labels it as reading order or carries it to exports | Low–medium | S |
| Real-time collaboration | Missing | **Missing**: decisions locked, nothing built (`docs/collaboration-plan.md`) | Out of scope for this list | L |
| Compare presentations | Partial (`engine/src/compare.rs`) | Missing | Low | M |

### Export and import

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| PDF export, one page per slide | Has, raster slide art + real text layer, links, bookmarks | **Has**, and ahead: vector PDF, CMYK, PDF/X (`export-dialog.tsx`, `features/workspace.md` §756) | — | — |
| PDF notes pages and handouts (2/3/6/9 per page) | Has | **Missing** (no notes; no handout layout) | Medium after notes; handouts are a common print ask | S–M |
| PNG/JPEG per slide | Has | **Has**: Current Page Only, `exportPageToPng` | — | — |
| Animated GIF / video of the deck | GIF yes (one frame per slide), no video | **Has**, ahead: page MP4/GIF with animations; whole-deck recording from the show (`animation.md` §602) | — | — |
| HTML presentation export | Missing (web build is the app) | **Has**: self-contained HTML player with keyboard navigation (`whats-new.ts` 0.8.105) | Ahead | — |
| PPTX export (editable) | Has | **Has** (v0.8.292): native shapes, text, lists, connectors, backgrounds, transitions; rasterizes what PowerPoint can't draw. Gaps: notes, animations, native tables, charts, hidden slides, sections, links | RT items above | — |
| PPTX import | Has, broad; unknown XML kept and written back (`ShapeKind::Opaque`) | **Partial, Dev Mode**: shapes, text, bullets, SmartArt-as-shapes, connectors, pictures, tables-as-groups, master artwork, backgrounds, transitions. Skipped: charts, EMF/WMF/TIFF, animations, notes, audio/video, fonts | High; see the recommended order | — |
| Keep unknown PPTX parts for round trip | Has (`Opaque` shapes, kept chart parts) | **Missing**: import → edit → export loses anything Yappy didn't model | Medium; matters only once import leaves Dev Mode | L |
| `.potx` templates / `.ppsx` shows | Has | **Partial**: import accepts `.potx`/`.ppsx`; export writes `.pptx` only | Low | S |
| PDF import (pages as slide backgrounds) | Missing | Missing (`todo.md` Phase 73) | Low–medium | M |
| ODP, legacy `.ppt` | Missing | Missing | Low | L |

### Automation (both apps are strong here)

| Feature | DeckCraft | Yappy today | Value | Effort |
|---|---|---|---|---|
| Scriptable commands (CLI, MCP) | Has: 320 commands, CLI, JSON control channel, MCP | **Has**: `window.Yappy` API (`api.ts`), MCP server (`backend/mcp`), AI deck generation | Keep every new slide feature on `api.ts` | — |
| Headless render/convert | Has (`deckcraft-cli render/convert`) | Partial (browser-only) | Low | — |

### Help docs gap (Yappy-side, not a feature)

There is **no help page for slides**. Slide topics are spread over `features/animation.md`
(click-to-advance, recording), `features/design-studio.md` (pages), and `features/workspace.md`
(PPTX). The Slide Master layer and `${slideNumber}` fields are documented only in
`docs/slides.md`, which users never see. A `help-docs/features/slides.md` page should come with
the first item below.

## Recommended order

Favours solo-user value and work that also closes a PowerPoint round-trip gap.

1. ~~**Speaker notes** (S)~~ — done on `feat/speaker-notes` (2026-11-01).
2. ~~**Presenter view** (M)~~ — done on `feat/speaker-notes` (2026-11-01).
3. ~~**Links that work in the show, including jump-to-slide** (S–M)~~ — done on `feat/speaker-notes` (2026-11-01).
4. ~~**Slide layouts picker + header/footer fields** (M)~~ — layouts picker done, `${date}` added,
   fields and master artwork now in every export (feat/speaker-notes, 2026-11-01). Still open:
   live placeholders linked to a layout, a Header & Footer dialog, and writing fields to PPTX
   as `a:fld` (they go out as resolved text).
5. **Hide slide, sections, auto-advance/loop** (S each): small flags on `Slide`, all with direct
   PPTX equivalents (`show="0"`, `p14:sectionLst`, `advTm`).
6. **Morph across slides** (M): match elements by name/id/text between consecutive slides and
   tween them with the existing morph animator. A standout feature that writes `p159:morph`.
7. **Animations in PPTX export (then import)** (L; M for entrance/exit): build the PowerPoint
   timing tree from Yappy's build steps. Port the mapping from DeckCraft (see below).
8. **Charts with a data grid, round-tripped as PPTX charts** (L): biggest remaining import gap for
   business decks. Do after the above because it is the largest item.

Close behind: native PPTX tables (M), alt text UI + accessibility checker (S–M), more transitions
(wipe/cover/uncover/split, S–M), shrink-on-overflow autofit (M).

## DeckCraft code worth porting

DeckCraft is Rust, Yappy is TypeScript, so "porting" means translating the logic and tables, not
reusing the code. Paths are relative to the DeckCraft repo root.

| Area | DeckCraft files | What to take |
|---|---|---|
| Animation ↔ PPTX timing tree | `crates/pptx/src/write/timing.rs`, `crates/pptx/src/read/timing.rs`, `crates/model/src/anim.rs`, `crates/pptx/src/maps.rs` | How a flat ordered effect list becomes `p:timing` (`p:par`/`p:seq`, click groups, `presetID`/`presetClass`) and back; the preset-number maps. Yappy's `on-click`/`with-prev`/`after-prev` map straight onto it |
| Transitions | `crates/anim/src/transition_fx.rs`, `transition_geom.rs`, `transition.rs` | Effect geometry "as measured on PowerPoint" (wipe, split, cover, uncover, push, 3-D). The 2-D ones translate to canvas clip/translate composites in `slide-transition-manager.ts` |
| Morph | `crates/anim/src/morph.rs` (`morph_pairs`, `morph_xfrm`, `morph_crop`, `morph_frame`), `crates/geom/src/morph.rs` | Matching rules between two slides (name, then text, then type), box/colour/crop interpolation |
| Placeholder inheritance | `crates/model/src/resolve.rs` | slide → layout → master → theme property resolution; useful if live layouts are built, and to improve import |
| Charts | `crates/model/src/chart.rs`, `crates/pptx/src/read/chart.rs`, `read/chartex.rs`, `write/chart.rs`, `crates/render/src/chart.rs`, `crates/model/src/trendline.rs`, `crates/model/src/numfmt.rs` | Chart model, `c:chartSpace` read/write including the embedded workbook part, axis/number formatting |
| Table styles | `crates/pptx/src/tables.rs`, `crates/model/src/table.rs` | Style GUIDs ↔ ids and generating `tableStyles.xml` from theme accents, for native `a:tbl` export |
| EMF/WMF | `crates/metafile/src/{emf,wmf,emfplus,canvas,clip,dib,text}.rs` | Record parser into a neutral vector model; the canvas layer maps almost directly onto Canvas2D/Path2D |
| SmartArt | `crates/pptx/src/dgm.rs`, `crates/engine/src/cmd/smartart/layout.rs` | Only if live SmartArt is ever wanted; Yappy's own diagram layouts may be the better path |
| Text fields and autofit | `crates/text/src/datetime.rs`, `crates/engine/src/cmd/insert/text_fields.rs`, `crates/text/src/layout.rs`, `crates/text/src/autonum.rs` | Date-field formats PowerPoint uses; shrink-on-overflow loop; auto-number schemes (already partly done in Yappy) |
| Accessibility checker, comments | `crates/engine/src/cmd/review.rs` (`accessibility` at line 249) | The list of checks and how comments are stored for PPTX |
| Design Ideas | `crates/engine/src/cmd/ideas.rs` | Offline single-slide re-layout rules (picture full-bleed, half, framed, text-only) |
| Reuse slides | `crates/engine/src/cmd/reuse.rs` | Inserting slides from another deck while remapping masters and media |
| PPTX round-trip tests | `crates/pptx/tests/it/roundtrip.rs` | The case list is a good checklist for Yappy's `write.test.ts` / `read.test.ts` |

**Licence.** DeckCraft is dual-licensed **MIT OR Apache-2.0** (`LICENSE-MIT`, `LICENSE-APACHE`,
`NOTICE`). Both are compatible with Yappy's AGPL. Translating its logic is a derivative work, so
any ported file should carry a header comment naming DeckCraft, its copyright line
("Copyright (c) 2026 ArtCraft Team and the DeckCraft contributors"), the licence chosen (MIT is
the simpler one to comply with) and the source path, and the MIT notice should be added to the
project's third-party notices. Do not copy the ArtCraft names, logos or anything under
`docs/brand/` (trademarked, not open source), and check `ATTRIBUTION.md` before taking any asset,
since bundled fonts and Lucide icons have their own licences.
