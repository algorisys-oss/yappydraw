# Stick-Figure Vector Library — Plan (drawify-style)

Status: **planning / awaiting sourcing decision** · Date: 2026-07-08 · Refs:
`~/Pictures/art-templates/all_conversation_images/` (09–15 catalog sheets, 01/04 scene composites)

## TL;DR
A searchable, categorized panel of reusable, **editable** stick-figure illustrations you drag
onto the canvas — like drawify.com. Yappy already has all the machinery (SVG→editable vectors,
symbols, groups, a draggable/searchable panel pattern), so this is **assembly, not new engines**.
The one gating decision is **where the vector art comes from** (the reference sheets are raster).

## What the references show
- **Catalog sheets (09–15):** titled grid "cheat sheets," "Category N of 6," 15–20 numbered
  poses each; sheet 15 is a master poster (~25 sub-categories + Male/Female/Boy/Girl variants).
  These are the *spec*, not shippable art (raster/AI-rendered).
- **Scene composites (01, 04):** a detailed background with 1–2 stick figures dropped on top at a
  chosen scale — the intended end use.
- **6 primary categories:** Daily Actions & Emotions · Office & Workplace · Meetings/Conferences/
  Workshops · Street/Travel/Public · Gatherings/Social/Family · Special Situations & Services.
  Plus props (laptop, phone, mic, chart), vehicles, and character variants.
- **Style:** bold uniform black outline, round hollow head, stick limbs; two tiers — pure
  monochrome and "drawify-style" with flat color accents (hair/tie/props). Multi-person cells are
  just several figures + a prop grouped together.

## Existing machinery to reuse (file:line)
- **SVG → editable elements:** `svgToElements()` `utils/svg-import.ts:389`, `importSvgToCanvas()`
  `:476` — each SVG path becomes a normal `path` `DrawingElement` with `backgroundColor`/
  `strokeColor`, so dropped figures are **recolorable/editable for free**.
- **Symbols:** `SymbolDef` `types.ts:24`; `createSymbol` `app-store.ts:2793`, `placeInstance`
  `:2819`, `detachInstance` (→ editable group) `:2851`; `SymbolInstanceRenderer`
  `shapes/renderers/symbol-instance-renderer.ts:14`; `symbols-panel.tsx`.
- **Groups:** `groupIds` `types.ts:394`, `groupSelected()` `app-store.ts:2396`.
- **Panel pattern to copy:** `components/elements-panel.tsx` — draggable, tabbed, searchable grid,
  lucide→SVG drop (`:117`), drag-to-canvas MIME (`:304-311`).
- **Inline offline data pattern:** `templates/registry.ts` (`searchTemplates:204`, categories),
  `templates/data/designs/*` — inline TS modules, code-split, PWA-friendly (no fetches).
- **Recolor/swatches:** `recolor-panel.tsx:16`, `Swatch` `types.ts:35`.
- **Existing procedural people** (distinct, optional building blocks): `PeopleRenderer`
  `shapes/renderers/people-renderer.ts:7`, element types `stickFigure`/`sittingPerson`/… `types.ts:5`.

## Data model
A new inline library under `frontend/src/library/stick-figures/`:
```
StickAsset = { id, name, category, tags[], variant?, svg /*inline SVG*/, w, h }
```
On drop: `svgToElements(asset.svg, {x,y,targetWidth})` → add elements → `groupSelected()` → one
**editable, recolorable group**. Optional "Add to Symbols" registers a linked `SymbolDef`.
Author SVGs with semantic ids/classes (skin/hair/accent) to enable one-click part-recolor later.

## The KEY open question — art sourcing (gates everything)
The catalog sheets are raster; we need real SVG. Options:
1. **Hand-author a small SVG set** — best quality/consistency/recolor control; slow. (~24 for MVP.)
2. **License a drawify-style SVG pack** — fastest breadth; needs redistribution-license review
   (repo publishes to an OSS mirror).
3. **AI-generate + auto-trace** (potrace/Inkscape) — scales to hundreds; noisy paths, heavy
   cleanup, poor recolor semantics.
4. **Procedural** from Yappy primitives — native/editable, no licensing; limited poses,
   engineering-heavy per pose.
**Recommendation:** MVP via (1) ~24 figures across the 6 categories, architected so (2)/(3) can
bulk-fill later.

## Phases
- **Phase 0 — Spike & sourcing (S + external art; risk HIGH):** lock `StickAsset` schema, 3–5
  sample SVGs, signed-off sourcing path.
- **Phase 1 — MVP (M; risk LOW):** library data module + registry (mirror `templates/registry.ts`)
  + `stick-figure-panel.tsx` (copy Elements panel) with search + category tabs + thumbnail grid;
  click/drag → drop-as-editable-group; store toggle + menu entry + lazy mount in `app.tsx`.
- **Phase 2 — Full catalog (L; risk MED, art volume):** all 6 categories + variants + props +
  multi-figure scene bundles; opt-in "Add to Symbols."
- **Phase 3 — Recolor ergonomics (M; risk LOW):** semantic part tagging + one-click figure
  recolor; monochrome/colored style toggle; favorites/recents/keyboard nav.

**Recommended MVP slice:** Phase 0 + Phase 1.

## Repo-convention obligations (CLAUDE.md)
- **api.ts:** add `insertStickFigure(assetId, opts?)` / `listStickFigures(category?)` (imports
  `importSvgToCanvas` at `api.ts:39`).
- **Help docs:** new `help-docs/features/stick-library-doc.tsx` (model on `symbols-doc.tsx`),
  register in `help-page.tsx`; hotkeys in `help-dialog.tsx` if any.
- **Render-style parity:** dropped `path` elements must fill **and** stroke in both `sketch` and
  `architectural` (importer sets `renderStyle:'architectural'` `svg-import.ts:463` — verify sketch).
- **Ship flow:** repograph refresh, `docs/learnings.md`, release note. WASM parity **not** triggered.

## Independence
Unrelated to the game-engine work; belongs on its own branch off `main`.
