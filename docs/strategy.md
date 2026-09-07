# YappyDraw — product strategy & roadmap

A strategic read of where YappyDraw sits in the market and where to invest next,
mapped to the code that already exists. Opinionated; validate against real users.
(Author: design/UX + competitive analysis, 2026-06-27.)

## The core thesis: sharpen the wedge

YappyDraw currently straddles three *already-won* markets at once — Illustrator
(precise vector), Figma (UI/design systems), Excalidraw/Miro (sketch + diagram).
The recent Illustrator-parity work raised the credibility floor, but **parity is
not a wedge**: Inkscape/Penpot give it away, Affinity sells it cheaply with two
decades of polish. We won't out-Illustrator Illustrator.

The genuinely differentiated, hard-to-copy assets are narrower and more valuable:

1. **A clean, scriptable `window.Yappy` API** (`frontend/src/api.ts`). Almost no
   design tool is fully programmable. This is the moat — it powers AI generation,
   data-driven graphics, templating, embedding and automation.
2. **AI + a DSL** (`generateDiagram`, the DSL parser/engine). Natural-language →
   editable DSL → diagram (round-trippable) beats "AI makes a flat picture."
3. **Dual sketch ↔ architectural rendering** per shape (rough.js vs clean canvas).
   The "wireframe now, polish later, same file" story Excalidraw and Illustrator
   each only do *half* of.
4. **Diagramming breadth in one canvas** — BPMN/UML/flowchart/infra/data-structures/
   mindmap + freeform sketch (a credible diagrams.net / Whimsical competitor).

**Reframe the product as:** *the programmable, AI-native canvas for sketching,
diagramming and design* — and let Illustrator-parity be the floor, not the roadmap.

## Competitive landscape (where we win / lose)

| Tool | Their strength | Our angle |
|---|---|---|
| Illustrator / Affinity / Inkscape | precise vector, print | floor only — don't compete head-on |
| Figma / Penpot | components, multiplayer, design systems | we lack collab + real components (gap) |
| Excalidraw / tldraw | hand-drawn sketch, multiplayer, "make real" | we add precision + diagram breadth + API |
| Miro / FigJam | infinite whiteboard, collab | we add real vector + scripting |
| diagrams.net / Whimsical / Mermaid | diagram types, text→diagram | our DSL+AI+API is a better foundation |
| Procreate / Concepts | stylus drawing | we have tablet/pressure; not our wedge |

The recurring theme: the **sticky** features in this category are *collaboration,
components, and import* — not more effects.

## Roadmap — 3 horizons

### NOW — harden the base, sharpen the wedge (weeks)
- **Test-suite health.** Today's sweep showed a single bad import made the *whole*
  suite uncollectable (green subsets hid a red whole). Finish standardising specs
  on `YAPPY_URL` + the new `playwright.config.ts` webServer; clear the
  `docs/bugs/known-test-failures.md` backlog. Confidence-to-ship is a feature.
- **Promote the API to a product.** Stabilise + version `window.Yappy`, publish a
  reference + recipes ("draw with code", "data → diagram", "automate exports").
  This is the moat; treat it like one.
- **AI prompt-to-EDIT** (not just create). Orchestrate our *own* API:
  "tidy this diagram", "recolor to brand", "convert to dark mode", "make a
  swimlane". We already have recolor/palette/distort/align primitives —
  AI calling them is the high-leverage pattern.
- **Import is a growth lever.** Mermaid/PlantUML import (instant diagram-crowd
  credibility), SVG round-trip. Builds on the DSL + `convertToPath`/export code.
- **Decide on non-destructive effects** (the Appearance-Panel architecture). It's
  the only Illustrator item worth the big refactor — it makes every distort/
  pathfinder/transform re-editable. Don't start casually; do scope it.

### NEXT — make it sticky (months)
- **Real-time multiplayer.** Table stakes now (Figma/Excalidraw/tldraw/Miro).
  This is the #1 strategic gap — bigger than any Tier-2 effect. CRDT (yjs) over
  the existing store; the spatial/infinite-canvas model is already there.
- **Components & variants with overrides.** Extend Symbols
  (`createSymbol`/`placeInstance`/`redefineSymbol`) into Figma-style components +
  variants. The feature people *switch for* — and reusable diagram nodes need it.
- **Auto-layout / "beautify my messy diagram."** The universal diagramming pain;
  with API + AI we can do graph layout better than incumbents.
- **Data → diagram/chart.** CSV/JSON → chart/flow via the API (chart shapes exist).

### LATER — expand (opportunistic)
- Template/asset marketplace + a plugin API (the `window.Yappy` API is the natural
  substrate). Image/sketch → clean vector (trace + AI cleanup). Style transfer.
- Heavy Illustrator items (3D & Materials, SVG filters, CMYK/print) **only** if a
  pro-vector or print market actually materialises.

## What to de-prioritise
- The long tail of Illustrator effects (3D, SVG filters, Tweak, Outline Object).
- Pixel-precise print (CMYK, advanced bleed) unless print is a target segment.
- Anything that widens the **render-parity tax** (sketch+architectural) or the
  **WASM/JS dual-path** without serving the wedge — both double maintenance.

## Watch-outs (engineering)
- Every shape/feature must render in **both** styles (CLAUDE.md rule) — a real per-
  feature tax. Budget for it or narrow the styles.
- The destructive distort/pathfinder ops vs Illustrator's non-destructive model is
  a fork in the road: pick deliberately.
- Keep the API **stable and versioned** — if it becomes the product/plugin surface,
  breaking it breaks users and AI prompts alike.
