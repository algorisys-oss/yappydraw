# Unified Element Search — plan

**Status:** Phases 1–4 SHIPPED (Phase 1 v0.8.87; Phases 2–3 v0.8.88; Phase 4 v0.8.90,
2026-07-13): unified box, OpenMoji illustrations + keyword-alias map, `api.ts`
`searchElements`/`insertElement`, Alt+E hotkey, and **templates in the feed** (Templates
chip + `templatePreviewSvg` thumbnails wrapping `searchTemplates`) with a new
**greeting-card design pack** (birthday / thank-you / congrats / party invite /
anniversary / new baby). This completes Canva's element + template two-tier search.
**Goal:** One search box in the Elements panel that fans a single query across
**icons + illustrations + photos + shapes** and returns a **blended grid** —
Canva's "type a word → get everything" behaviour. Closes two gaps vs Canva:
(1) no unified cross-type search, (2) filename-only matching instead of semantic
keywords (`love` → heart).

**Decisions (locked):**
- Illustration source: **bundled OpenMoji** (~4,000 open SVG, CC BY-SA 4.0),
  inlined offline like the stick-figure library. Editable vectors via
  `importSvgToCanvas` — a genuine edge over Canva's flat graphics.
- Search UX: **fully blended feed** with type-filter chips (All · Icons ·
  Illustrations · Photos · Shapes). Replaces the current 3-tab layout.

**Out of scope (phase 1):** 3D elements (no open source; extrude/turntable already
differentiate), video/audio/stickers, ML embeddings (alias map covers the 80%).

---

## Architecture

New module `library/elements/`:

- `search.ts` — provider interface + fan-out/merge.
  ```ts
  type AssetKind = 'icon' | 'illustration' | 'photo' | 'shape';
  interface AssetHit {
    kind: AssetKind; id: string; label: string;
    thumbSvg?: string;   // icons, illustrations, shapes
    thumbUrl?: string;   // photos
    insert(at?: {x:number;y:number}): void | Promise<void>;
  }
  interface AssetProvider {
    kind: AssetKind;
    search(q: string): AssetHit[] | Promise<AssetHit[]>;
  }
  export async function searchElements(q: string, kinds?: AssetKind[]): Promise<AssetHit[]>;
  ```
  `searchElements` runs every enabled provider, renders offline results (icons /
  illustrations / shapes) immediately and streams photo results in when they
  resolve (mirror the existing Photos loading/error/empty states).

- `aliases.ts` — `Record<string, string[]>` mapping natural words → asset
  names/tags (`love: ['Heart','heart'], money: ['DollarSign','coin'], …`).
  Highest-leverage relevance win; hand-curated, grows over time.

- `illustrations/` — bundled OpenMoji subset:
  - `assets.ts` — `{ id, name, tags[], svg }[]` (inlined SVG strings).
  - `registry.ts` — `searchIllustrations(q)` = clone of
    `stick-figures/registry.ts::searchStickAssets` (name + tags match).
  - `LICENSE` / attribution note (CC BY-SA 4.0 — keep source link on inserted
    elements via the element `link`/`tag` fields, same as stock photos).

### Providers (each wraps an existing capability)
| Provider | Wraps | Search over |
|---|---|---|
| Icons | Lucide (`elements-panel.tsx` `iconToSvgText`) | name + **alias map** |
| Illustrations | new bundled OpenMoji | name + tags |
| Photos | `utils/stock-photos.ts::searchStockPhotos` | Wikimedia API (async) |
| Shapes | static SHAPES/FRAMES list | name + alias map |

---

## Phases

### Phase 1 — provider interface + blended panel UI
- Add `library/elements/search.ts` with the 4 providers (photos/icons/shapes wrap
  existing code; illustrations stubbed to `[]` until Phase 2).
- Rewrite `components/elements-panel.tsx`: remove the 3-tab switch, add one search
  box + type-filter chips + a single blended grid that renders mixed cells
  (`thumbSvg` vs `thumbUrl`). Keep the Fonts tab as a separate small section or a
  chip. Reuse the existing photo drag-to-canvas + loading/error/empty patterns.
- `elements-panel.css` — grid handles mixed cell types.
- **Verify both render styles** on inserted icons/shapes (sketch + architectural).

### Phase 2 — alias map + OpenMoji library
- Build `aliases.ts` (start ~80 common words; measurable relevance jump).
- Bundle OpenMoji subset into `illustrations/assets.ts` + `registry.ts`; wire the
  IllustrationProvider. Insert via `importSvgToCanvas` (editable vectors), keep
  attribution on the element (`link`/`tag`).
- Confirm bundle size is acceptable (subset, lazy-import the panel like Lucide
  today — `createResource(() => isPanelOpen('elements'))`).

### Phase 3 — docs, API, polish
- `api.ts` — expose `YappyAPI.searchElements(q)` + `insertElement(hit)` so it's
  scriptable (per CLAUDE.md: update api.ts when features are added).
- Help: update `help-docs/features/` (add/refresh an "Elements search" doc) and
  the hotkeys list in `components/help-dialog.tsx`.
- `docs/learnings.md` + `docs/bugs/bug-fixes.md` as applicable.
- Repograph refresh + `npm run build`; run the elements-panel e2e path.

---

## Files touched
| File | Change |
|---|---|
| `components/elements-panel.tsx` | Blended search UI (largest change) |
| `components/elements-panel.css` | Mixed-cell grid |
| `library/elements/search.ts` | **new** provider interface + fan-out |
| `library/elements/aliases.ts` | **new** keyword→name map |
| `library/elements/illustrations/*` | **new** OpenMoji library + registry |
| `api.ts` | `searchElements` / `insertElement` |
| `help-docs/features/*`, `components/help-dialog.tsx` | document search |
| `docs/learnings.md`, `docs/bugs/bug-fixes.md` | learnings / fixes |

## Reuse (do NOT rebuild)
- `stock-photos.ts` — photo search/insert/drag, verbatim.
- `svg-import.ts::importSvgToCanvas({x,y,targetWidth})` — icon & illustration insert.
- `stick-figures/registry.ts::searchStickAssets` — template for tag search.
- Panel lazy-load + loading/error/empty patterns already in `elements-panel.tsx`.

## Risks / open items
- Bundle weight of OpenMoji — mitigate with a curated subset + panel lazy-load.
- CC BY-SA attribution: keep source link on inserted elements (already the
  stock-photo convention).
- Render-style parity: imported SVG illustrations must fill **and** stroke in both
  sketch and architectural modes (CLAUDE.md path-geometry gotcha).

---

## Phase 4 — templates in the unified feed (Canva's second tier)

**Why:** Canva's search is two-tier — *elements* (graphics/shapes/photos/icons)
**and** *templates* (whole designs: "birthday card", "poster", "quote card"). Phases
1–3 deliver the element tier only. Yappy already has the template half — a mature
`TemplateRegistry.searchTemplates(q)` (`templates/registry.ts`, matches
name/description/**tags**) and ~33 Canva-style design docs
(`templates/data/designs/*`) — but it lives behind a **separate** search box
(`components/template-browser.tsx`). This phase unifies the two so one query returns
both, closing the last real gap vs Canva. Independent-review finding, 2026-07-13.

- **New `TemplateProvider` (`kind: 'template'`)** in `search.ts`, wrapping the
  existing `searchTemplates(q)` — **do not** rebuild template search. Each `AssetHit`
  carries a page-preview `thumbSvg`/`thumbUrl` (reuse `template-browser.tsx`'s
  `designPreviewStyle` mini-preview) and an `insert()` that loads the design via the
  existing template-load path (`menu.tsx` `loadTemplateAction` / `handleTemplateSelect`).
  - The `AssetProvider` interface was designed to absorb new kinds without touching
    the panel — this should be additive: register the provider, add a `Templates`
    filter chip, done.
  - Ranking nuance: templates are heavier hits than a single icon — cap count and/or
    float them into their own chip so a query like `star` doesn't bury the star icon
    under star-themed posters.
- **Author a greeting/card design pack** (separate, parallel task): the catalog has
  social/business designs but **no cards family**. Add birthday / thank-you /
  invitation / congrats designs in the same `makeDesign(...)` style
  (`templates/data/designs/`), with tags (`birthday`, `card`, `greeting`, `invite`)
  so they surface in both the unified feed and the template browser.
- **Consider deduping the two search UIs** once the provider lands — the standalone
  template-browser search can stay (it's category-scoped), but the Elements-panel
  feed becomes the single "type a word, get everything" entry point.
- Reuse (do NOT rebuild): `searchTemplates`, the template-load action, and
  `template-browser.tsx`'s preview rendering. api.ts: extend `searchElements` to
  include template hits (or a `kinds: ['template']` filter).

**Out of scope here / deferred:** semantic template ranking, AI-generated
one-off templates from the query (the Design Generator already covers bespoke).
