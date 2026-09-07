# YappyDraw DSL + Mermaid Adapter Architecture

## Overview

YappyDraw DSL is a declarative format for creating diagrams programmatically. It uses an **intermediate representation (IR)** that decouples source formats from the rendering engine.

```
Mermaid text  ──→  MermaidAdapter  ──┐
PlantUML text ──→  PlantUMLAdapter ──┼──→  DSL IR  ──→  DSLEngine  ──→  YappyAPI  ──→  Canvas
User DSL text ──→  DSL Parser      ──┘
```

## Design Decisions

1. **Hybrid format** — JSON for adapters/programmatic use, compact text syntax for human authoring. Both parse to the same IR.
2. **IR maps closely to YappyAPI** — Shape names (with aliases) map directly to `ElementType`. Style properties match `ElementOptions`. The engine is a thin loop calling `createElement()` and `connect()`.
3. **Layout is separate from parsing** — Parser produces IR with logical structure (nodes + edges). Layout engine computes coordinates.
4. **No external parser generators** — Hand-written regex-based parsers. Keeps bundle small.
5. **Reuse existing code** — Tree layout wraps `MindmapLayoutEngine`. Element creation goes through `YappyAPI`.
6. **Progressive build** — Phase 1 delivers working JSON DSL via console API. Each phase adds capabilities.

---

## File Structure

```
src/dsl/
  index.ts                          # Public exports
  types.ts                          # DSLDiagram, DSLNode, DSLEdge IR interfaces
  shape-aliases.ts                  # Alias map + resolveShapeType()
  shape-defaults.ts                 # Default w/h per ElementType

  parser/
    index.ts                        # parseDSL() — auto-detect JSON vs text
    json-parser.ts                  # JSON.parse + validate
    text-parser.ts                  # Compact text syntax parser (Phase 4)
    schema-validator.ts             # Lightweight IR validation

  engine/
    dsl-engine.ts                   # renderDiagram() — IR → canvas elements via YappyAPI
    render-helpers.ts               # Style merging, shape routing

  layout/
    types.ts                        # LayoutResult, NodePosition
    layout-manager.ts               # Strategy dispatcher
    strategies/
      tree-layout.ts                # Wraps MindmapLayoutEngine
      grid-layout.ts                # Row/col placement
      sequence-layout.ts            # Vertical timeline
      swimlane-layout.ts            # BPMN pool/lane
      force-layout.ts               # Fruchterman-Reingold

  adapters/
    adapter-interface.ts            # DSLAdapter interface
    adapter-registry.ts             # Singleton registry + auto-detection
    mermaid/
      mermaid-adapter.ts            # Dispatch by diagram type
      flowchart-parser.ts           # graph TD/LR → DSL IR
      sequence-parser.ts            # sequenceDiagram → DSL IR
      class-parser.ts               # classDiagram → DSL IR
      state-parser.ts               # stateDiagram → DSL IR

src/components/
  dsl-import-dialog.tsx             # Import dialog UI
  dsl-import-dialog.css             # Dialog styles
```

---

## DSL IR Format (JSON)

### Example: Simple Flowchart

```json
{
  "version": 1,
  "meta": { "title": "Login Flow" },
  "layout": { "strategy": "tree-down" },
  "nodes": [
    { "id": "start", "shape": "circle", "label": "Start" },
    { "id": "login", "shape": "rect", "label": "Login Form" },
    { "id": "check", "shape": "decision", "label": "Valid?" },
    { "id": "ok", "shape": "rect", "label": "Dashboard" },
    { "id": "fail", "shape": "rect", "label": "Error", "style": { "backgroundColor": "#fecaca" } }
  ],
  "edges": [
    { "from": "start", "to": "login" },
    { "from": "login", "to": "check" },
    { "from": "check", "to": "ok", "label": "Yes" },
    { "from": "check", "to": "fail", "label": "No" }
  ]
}
```

### Shape Aliases

| Alias | ElementType | Category |
|-------|------------|----------|
| `rect`, `box`, `process` | `rectangle` | Flowchart |
| `oval`, `ellipse` | `circle` | Flowchart |
| `decision`, `condition` | `diamond` | Flowchart |
| `terminal` | `capsule` | Flowchart |
| `io` | `parallelogram` | Flowchart |
| `start-event`, `end-event`, `task` | `bpmn*` | BPMN |
| `gateway`, `xor-gateway` | `bpmnExclusiveGateway` | BPMN |
| `class`, `interface`, `actor` | `uml*` | UML |
| `db`, `server`, `lb`, `queue` | infra types | Infrastructure |
| `array`, `stack`, `linked-list` | `ds*` | Data Structures |
| `note`, `sticky` | `stickyNote` | Common |

All literal `ElementType` names are also accepted (e.g., `bpmnStartEvent`).

### Layout Strategies

| Strategy | Description | Status |
|----------|-------------|--------|
| `manual` | Explicit x/y coordinates, auto-grid fallback | Done |
| `tree-down` | Top-to-bottom tree layout | Done |
| `tree-right` | Left-to-right tree layout | Done |
| `tree-up` / `tree-left` | Bottom-up / right-to-left | Done |
| `grid` | Row-major grid placement | Done |
| `sequence` | UML sequence diagram layout | Done |
| `radial` | Radial tree layout | Done |
| `mindmap-right` | Mindmap layout | Done |
| `byte-grid` | Linear run of bit/byte cells, grouped into named spans | Done |
| `force` | Force-directed graph layout | Phase 8 |
| `swimlane` | BPMN pool/lane layout | Phase 8 |

`grid` and `byte-grid` also honour `layout.targetWidth` — see Width-aware Layout below.

---

## Palette + Determinism

Two diagram-level fields serve programmatic and batch rendering.

`palette` declares named colour roles. Styles reference them as `@role`. Each role becomes a
document swatch via `ensureSwatch` (create-or-update by name, no toast, does not touch the active
drawing colour), and elements that use a role are linked through `fillSwatchId` / `strokeSwatchId`,
so recolouring the role updates the diagram. The object form carries a `dark` counterpart which the
themeable SVG export turns into a `prefers-color-scheme` override.

```json
{
  "palette": { "danger": "#ef4444", "live": { "light": "#2563eb", "dark": "#60a5fa" } },
  "nodes": [{ "id": "a", "shape": "rectangle", "style": { "backgroundColor": "@danger" } }]
}
```

Resolution happens in `engine/palette.ts` and runs on the merged style, after defaults, so a role in
`defaults.node` resolves too. An unknown role warns and is left as-is rather than aborting.

`meta.seed` makes a render reproducible. `engine/seed.ts` derives each element's rough.js seed with
FNV-1a over (diagram seed, element key), keyed by DSL id rather than index so adding a node does not
reshuffle its siblings. `style.seed` on a node or edge overrides it. Without `meta.seed` the API
assigns a random seed per element, which is the right interactive behaviour.

Both fields must be copied explicitly in `parser/json-parser.ts`: that parser builds an allowlist
object, so any new top-level field is silently dropped until it is added there.

## byte-grid Layout

`layout: { strategy: 'byte-grid' }` draws a linear run of bit or byte cells: a float split into
sign/exponent/mantissa, a struct with its padding runs, a file header's magic bytes. No general
graph layout produces this shape.

The author declares one node per SPAN, not per cell. A span's size comes from `properties.cells`
(an array giving both count and face values) or `properties.bits` / `bytes` / `size` (a count of
blank cells).

```json
{
  "layout": { "strategy": "byte-grid", "columns": 32, "cellSize": 28 },
  "nodes": [
    { "id": "sign", "label": "sign",     "properties": { "bits": 1 } },
    { "id": "exp",  "label": "exponent", "properties": { "bits": 8 } },
    { "id": "mant", "label": "mantissa", "properties": { "bits": 23 } }
  ]
}
```

`expandByteGrid` (layout/strategies/byte-grid-layout.ts) runs first in `renderDiagram` and rewrites
the diagram: each span becomes one rectangle per cell with explicit coordinates, plus a label box
per span and one per gutter row. It then sets `strategy: 'manual'`, so the existing manual-layout
path places everything and no other stage knows this strategy exists. Cells are ordinary elements,
so sketch rendering, palette links, seeding and themed export all work with no special case.

Config: `cellSize`, `columns`, `rowGap`, `gutter` (`none`/`hex`/`dec`), `gutterWidth`, `unit`,
`labelFontSize`, `cellFontSize`, `labelColor`.

Two constraints learned the hard way. Labels are borderless rectangles with `containerText`, not
`text` nodes, because a text node anchors at its x and overruns its neighbours; and they keep a real
`strokeColor` because container text is painted in it. Structural ink is registered as an `ink`
palette role (default light `#1e293b`, dark `#e2e8f0`) rather than a literal, so borders and labels
theme along with the cells. A diagram that declares its own `ink` role keeps it.

Because spans describe cells rather than shapes, `schema-validator` makes `shape` optional for this
strategy.

JSON form only. The text syntax routes unknown inline keys to `style` (`splitInlineProps`), and
`bits` / `bytes` / `cells` are not in `PROPERTY_PREFIXES`, so a span written in text syntax has no
size and is not a span.

### Pointing at one cell

An edge endpoint may be `span#n` — cell `n` of the span named `span`:

```json
{ "nodes": [
    { "id": "f", "label": "flags", "properties": { "bits": 8 } },
    { "id": "note", "shape": "rectangle", "label": "the sign bit", "x": 120, "y": 260 }
  ],
  "edges": [{ "from": "note", "to": "f#0" }] }
```

Cells are generated during expansion, so their ids do not exist when the author writes the file and
an edge cannot name one directly. Without this a byte diagram cannot carry a callout, which is most
of what it is for: the arrow that says "this is the bit that matters" has nothing to attach to.

`resolveCellRef` rewrites the endpoint to the generated id after expansion. `schema-validator`
checks the reference where the span sizes are still visible, so `f#9` on an 8-bit span is an error
rather than an arrow that silently goes nowhere.

Two things a callout does NOT get. It is a passthrough node with explicit coordinates, so
`targetWidth` does not move it: a callout placed to the right of a grid widens the diagram past the
budget, and at 375px it has to go underneath. And its position is in canvas units, so it has to be
authored against the grid's own geometry (`origin`, `cellSize`, `rowGap`).

## Width-aware Layout

`targetWidth` lays a diagram out to fit a given width in px, so one source renders at several
breakpoints. It reflows — same node size, fewer columns, more rows — and never scales anything down:
a 32-column bit grid squeezed into 375px puts every cell at 9px, which is a picture of a grid rather
than a readable one.

Two ways in, and the render option wins:

```js
// in the source, as a default
{ "layout": { "strategy": "byte-grid", "columns": 32, "targetWidth": 375 } }

// at render time, so the same file gives both breakpoints
Yappy.importDSL(src, { targetWidth: 375 });
```

From the CLI, `render-dsl.mjs --width 375,900` renders every source once per width into
`<name>.<width>.svg`.

`resolveTargetWidth` and `fitColumns` live in `layout/width.ts`. `fitColumns` takes the available
width, the item width, the gap, the authored column count and a snap mode:

- `halve` (byte-grid) keeps halving the authored count until it fits: 32 → 16 → 8. Taking the raw
  maximum instead would wrap a 32-bit word at 11 columns, splitting it mid-byte and putting the same
  field in a different column on every row.
- `free` (grid) takes the raw maximum, for grids of unrelated items where no column carries meaning.

`targetWidth` is a budget, not a promise. Content that cannot fit at one column stays wide and the
page scrolls it; an unreadable diagram that fits is worse than a readable one that scrolls. The
budget subtracts `EXPORT_MARGIN` (8px) so the exported SVG, not the layout box, is what lands inside
it — the export crops with 2px of padding and a sketch stroke wobbles outside its shape.

Honoured by `byte-grid` and `grid`, the two strategies whose geometry is "how many of these fit
across". The others ignore it and render at natural width rather than pretending.

Plumbing, all of which had to be touched for the field to arrive: `DSLLayoutConfig` and
`RenderOptions` in `dsl/types.ts`, `LayoutConfig` in `layout/types.ts`, `targetwidth` in the
text parser's frontmatter allowlist, and the `computeLayout` / `expandByteGrid` signatures.

## DSL Text Syntax [DONE]

```
---
title: Login Flow
layout: tree-down
---

# Nodes
start [circle] "Start"
login [rect] "Login Form"
check [decision] "Valid?"
ok [circle] "Dashboard"
fail [rect] "Error" { backgroundColor: "#fecaca" }

# Edges
start -> login
login -> check
check -> ok "Yes"
check -> fail "No"
```

**Grammar:**
- `---` delimited frontmatter for meta/layout
- `#` lines are comments/headers (ignored)
- **Node**: `<id> [<shape>] "<label>" { <style JSON> }`
- **Edge**: `<from> -> <to> "<label>"` — operators: `->` arrow, `--` line, `~>` bezier, `=>` elbow

---

## API Usage

### Console / Programmatic

```javascript
// Import from JSON DSL
Yappy.importDSL(JSON.stringify({
  version: 1,
  layout: { strategy: "manual" },
  nodes: [
    { id: "a", shape: "rect", label: "Hello", x: 100, y: 100 },
    { id: "b", shape: "circle", label: "World", x: 400, y: 100 }
  ],
  edges: [{ from: "a", to: "b" }]
}));

// Parse without rendering (validation)
const result = Yappy.parseDSL(jsonString);
if (result.success) {
  console.log("Valid diagram:", result.diagram);
} else {
  console.error("Errors:", result.errors);
}
```

---

## Implementation Phases

### Phase 1: Foundation — IR + JSON Parser + Engine [DONE]
**Files created:** `src/dsl/types.ts`, `shape-aliases.ts`, `shape-defaults.ts`, `parser/index.ts`, `parser/json-parser.ts`, `parser/schema-validator.ts`, `engine/dsl-engine.ts`, `engine/render-helpers.ts`, `index.ts`
**Modified:** `src/api.ts` — added `importDSL()`, `parseDSL()`

- DSLDiagram IR interfaces
- Shape alias map (60+ friendly names → ElementType)
- Shape defaults (width/height per type)
- JSON parser + schema validator (duplicate IDs, unknown node refs, invalid strategies)
- DSL engine: node creation, edge creation, pool creation, style merging
- Auto-grid fallback for unpositioned nodes
- `Yappy.importDSL()` and `Yappy.parseDSL()` on console API

### Phase 2: Tree Layout [DONE]
**Files created:** `layout/types.ts`, `layout/layout-manager.ts`, `layout/strategies/tree-layout.ts`

- LayoutManager dispatches: manual, tree-down/up/right/left, radial, mindmap-right, grid
- Tree layout: builds virtual tree from DSL edges, finds roots, computes positions
- Handles multiple disconnected trees and orphan nodes
- Grid layout: row-major with configurable columns
- Integrated into DSL engine (replaced inline position computation)

### Phase 3: Sequence Layout [DONE]
**Files created:** `layout/strategies/sequence-layout.ts`

- Sequence layout: horizontal lifeline placement with vertical message spacing
- Wired into layout manager

### Phase 4: Compact Text Parser [DONE]
**Files created:** `parser/text-parser.ts`

- Regex-based line-by-line parser with auto-detection (JSON vs text)
- Frontmatter (`---` delimited) for title, layout, spacing
- Node: `id [shape] "label" { style }` — shape defaults to rect
- Edge operators: `->` arrow, `--` line, `~>` bezier, `=>` elbow
- Inline styles: `{ backgroundColor: "#fecaca", strokeWidth: 3 }`
- Indentation-based children for mindmaps/org charts
- Pool/lane declarations + `@poolId/laneId` assignment
- Comments (`#`) and empty line handling
- 9 Playwright tests: parsing, frontmatter, edge operators, styles, hierarchy, pools, end-to-end

### Phase 5: UI — Import Dialog
**New files:** `src/components/dsl-import-dialog.tsx`, `dsl-import-dialog.css`
**Modified:** `menu.tsx`, `command-registry.ts`

- Modal dialog: textarea, format auto-detect + tabs, layout override dropdown, error panel
- Wire into menu ("Import from Text") and command palette
- **Test:** End-to-end: open dialog → paste text → click Import → see diagram

### Phase 6: Mermaid Adapter — Flowchart
**New files:** `adapters/adapter-interface.ts`, `adapter-registry.ts`, `mermaid/mermaid-adapter.ts`, `mermaid/flowchart-parser.ts`, `mermaid/mermaid-utils.ts`

- Define adapter interface + registry
- Mermaid flowchart parser (`graph TD/LR`, nodes, edges, subgraphs)
- Map Mermaid node shapes: `[text]`→rect, `{text}`→diamond, `(text)`→circle, `[(text)]`→database
- Map edge operators: `-->`→arrow, `---`→line, `-.->` →dashed arrow
- Register adapter, wire auto-detection
- Add `importMermaid()` to YappyAPI
- **Test:** Paste Mermaid flowchart in import dialog

### Phase 7: Mermaid — Sequence, Class, State
**New files:** `mermaid/sequence-parser.ts`, `mermaid/class-parser.ts`, `mermaid/state-parser.ts`

- Sequence: participants → lifelines, messages → edges
- Class: class definitions → `umlClass` with sections, relationships → edges
- State: `[*]` → start/end circles, states → `umlState`, transitions → labeled edges
- **Test:** Each diagram type independently

### Phase 8: Swimlane + Force Layouts
**New files:** `layout/strategies/swimlane-layout.ts`, `layout/strategies/force-layout.ts`

- Swimlane: create pool, divide into lanes, place nodes within assigned lanes
- Force-directed: Fruchterman-Reingold algorithm (~100 iterations, no dependency)
- **Test:** BPMN pool diagrams + network graphs

### Phase 9: Polish
- DSL export: serialize canvas elements back to DSL IR (round-tripping)
- Example snippets in import dialog
- Keyboard shortcut (`Ctrl+Shift+I`) for import
- Edge cases: duplicate IDs, missing nodes, cyclic graphs
- Update help docs

---

## Verification Checklist

1. Console API: `Yappy.importDSL(jsonString)` creates correct elements
2. Text syntax: Compact text parses to same IR as equivalent JSON
3. Tree layout: 5-node flowchart renders top-to-bottom with no overlaps
4. Mermaid flowchart: Standard `graph TD` renders correctly
5. Mermaid sequence: Participants as lifelines, messages as arrows
6. Import dialog: Paste → auto-detect → Import → elements on canvas → zoom to fit
7. Pool containment: BPMN diagram with pools assigns nodes to correct lanes
8. Error handling: Invalid DSL shows user-friendly parse errors with line numbers
9. Round-trip: Export → re-import produces equivalent diagram
