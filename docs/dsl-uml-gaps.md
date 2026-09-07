# DSL → SVG gaps for UML class diagrams

Found while generating ~28 UML/structure diagrams for the *design-patterns katas* project by
driving yappy headlessly (`window.Yappy.importDSL(src)` → `window.Yappy.exportSVG(false)` via
Playwright against the vite dev server). Each gap below blocks producing article-grade UML class
diagrams from the DSL. Ordered by impact.

Repro harness (for reference): a Playwright script loads the app, calls `importDSL` with a
`.ysl`/`.mmd` string, then `exportSVG(false)`, and writes the returned string to a file. Vite:
`npx vite --port 5199 --strictPort`.

---

> **Status (2026-07-09):** **All six gaps fixed** — see the ✅ notes under each.
> Two extra root causes surfaced while verifying end-to-end and were also fixed:
> (a) the real reason `classDiagram` members were empty was a **parser** bug —
> `class Foo {` with the opening brace on the *same line* (Mermaid's canonical form)
> never matched, so the body was mis-parsed line-by-line and members leaked into a
> bogus class; (b) SVG **export** drew only the box + class name, never the member
> compartments or the distinct UML arrowheads. Both are now fixed (parser +
> `export.ts`). Verified headlessly via the new `render:dsl` CLI (Gap 6).

## Gap 1 — classDiagram members never render (field-name mismatch) ⭐ highest impact

**Symptom:** A Mermaid `classDiagram` with members exports boxes containing only the class **name**
— the attributes/methods compartments are empty.

**Repro DSL:**
```
classDiagram
    class Subject {
        +subscribe(o)
        +notify(data)
    }
```
Exported SVG contains a `Subject` box but no `subscribe` / `notify` text.

**Likely cause — a field-name mismatch between the parser and the renderer:**
- The class parser builds member sections: `frontend/src/dsl/adapters/mermaid/class-parser.ts:203`
  (`node.sections = { attributes, methods }`).
- The DSL engine maps those to **`umlAttributes` / `umlMethods`**:
  `frontend/src/dsl/engine/dsl-engine.ts:193-194`
  (`elementOpts.umlAttributes = node.sections.attributes`).
- But the UML renderer reads **`el.attributesText` / `el.methodsText`**:
  `frontend/src/utils/uml-layout-utils.ts:32` (`el.attributesText`) and `:45` (`el.methodsText`).

So the members land on `umlAttributes`/`umlMethods` and the renderer looks at
`attributesText`/`methodsText` — nothing shows. **Fix:** map the sections onto
`attributesText`/`methodsText` (or make the renderer read `umlAttributes`/`umlMethods`), whichever
is the intended canonical field.

**✅ Fixed (three parts — the field mismatch was only one of them):**
1. `dsl-engine.ts` now writes the sections onto the canonical `attributesText` /
   `methodsText` fields (what `uml-layout-utils` + the UML renderers read).
2. **Parser:** `class Foo {` (opening brace on the same line — Mermaid's canonical
   form) never matched `CLASS_DEF_RE`, so the whole body was mis-parsed line-by-line
   and members leaked into a bogus `+observers` class while the real class stayed
   empty. `CLASS_DEF_RE` now captures a trailing `{` and opens the multi-line block.
3. **SVG export:** `export.ts` only drew the box + `containerText` (the name); the
   member compartments were never emitted (the on-canvas renderer draws them via a
   clipped path the export path never runs). Added a `buildUmlClassNode` branch that
   reuses `calculateUmlClassLayout` / `calculateUml2SectionLayout` to emit the header
   (stereotype + name), attribute/method compartments, and divider lines as vector.

---

## Gap 2 — aggregation `o--` drops the source class node

**Symptom:** A `classDiagram` containing an aggregation relation renders every class **except the
one on the left of `o--`**.

**Repro DSL:**
```
classDiagram
    class Subject { +notify(data) }
    class Observer { +update(data) }
    Subject o-- Observer : observers
```
Exported SVG shows `Observer` but **not** `Subject`. Replacing `o--` with `-->` makes `Subject`
appear. (An invalid `o--> "0..*"` cardinality form is even worse — it silently breaks the line.)

**Where to look:** the relation regexes and node collection in
`frontend/src/dsl/adapters/mermaid/class-parser.ts:23-25` (note `RELATION_RE` lists ` o--` with a
**leading space**, and there is no `o-->` form) and the node-registration path around
`class-parser.ts:165-203`. It looks like an unmatched/edge-case relation line prevents the
left-hand class from being registered as a node.

**✅ Fixed:** removed the stray leading space from the arrow alternatives (so `o--`
now matches after `\s+` consumes the separator), added the missing `o-->` / `*-->`
and reversed `<--o` / `<--*` / `<--` forms, and added optional quoted-cardinality
support both sides (`Subject "1" o-- "0..*" Observer`). The `o--` line now
registers both classes and produces an edge.

---

## Gap 3 — no distinct UML arrowheads (inheritance / composition / aggregation)

**Symptom:** `<|--`, `*--`, `o--`, `..>` all draw the **same** arrow; the only differentiator is a
text label ("extends" / "composition" / "aggregation").

**Where:** `frontend/src/dsl/adapters/mermaid/class-parser.ts:34-45` converts each relation to
`{ type: 'arrow', label: '…' }` rather than a hollow-triangle / filled-diamond / hollow-diamond
arrowhead. **Fix:** carry the relation kind through to the edge and render the proper UML
arrowhead per kind.

**✅ Fixed:** the codebase already has the arrowhead vocabulary
(`ArrowHead = … 'triangle' | 'diamond' | 'diamondFilled' | …` in `types.ts`, with
`triangle`/`diamond` rendering hollow and `diamondFilled` filled), and `renderEdge`
already forwards `edge.startArrowhead` / `edge.endArrowhead`. So the fix was purely
in the parser: `mapRelationship` now returns a `RelationSpec { decorated, glyph, dashed,
nav }` and the edge is oriented so the glyph lands on the decorated side —
generalization/realization → hollow `triangle` on the base, composition → `diamondFilled`
on the whole, aggregation → hollow `diamond` on the aggregate, association/dependency →
open `arrow` on the target (`..>`/`<|..` dashed). The old text labels ("extends" etc.)
are dropped; any user-supplied `: role` label is preserved.

**✅ Also fixed in SVG export:** the arrow export path drew only an open-V head
regardless of `endArrowhead`, so distinct arrowheads were lost on export. Added
`umlArrowheadGlyph` in `export.ts` — `triangle`/`diamond`/`diamondFilled` now export
as the proper hollow-triangle / hollow-diamond / filled-diamond polygon.

---

## Gap 4 — YSL/text `[class]` has no member syntax

**Symptom:** In the native YSL/text DSL, `id [class] "Name"` renders a title-only box; there is no
way to declare attributes/methods (only Mermaid `classDiagram` has member syntax — and per Gap 1
that doesn't render either). A `{ methodsText: "…" }` style block on the node is ignored.

**Suggestion:** accept a members block in YSL (e.g. a `{ methods: "a()\nb()" }` style prop, or an
indented section) and route it to the same `attributesText`/`methodsText` fields Gap 1 fixes.

**✅ Fixed:** the node `{ … }` block now accepts `attributes:` and `methods:` keys
(`;`-separated members), routed to `node.sections` → `attributesText`/`methodsText`:
```
Subject [class] "Subject" { attributes: "count: int", methods: "subscribe(o); notify(data)" }
```
See `text-parser.ts` (`splitInlineProps` → `parseMemberList`).

---

## Gap 5 — DSL can't set per-node style (e.g. corner radius)

**Symptom:** `borderRadius` / `roundness` exist as element options
(`frontend/src/api.ts:141`, `:110`, applied in `createElement` at `:320`/`:349`) but the DSL style
block doesn't expose them, so a diagram can't ask for, say, 6px rounded box corners from source.

There is also **no headless workaround**: `updateElement` is imported into `api.ts` (`:2`) and used
internally (e.g. `:851+`) but is **not** exposed on the public `window.Yappy` object, so a
post-import `updateElement(id, { borderRadius: 6 })` can't be called from an automation script.
Only `get state()` (`:292`) is public and it's read-oriented.

**Suggestion:** (a) pass through a small set of style props (`borderRadius`, `fill`, `stroke`) from
the DSL node's `{ … }` block to `elementOpts`, and/or (b) expose `updateElement` on `window.Yappy`
so scripts can post-process before `exportSVG`. Either unblocks the requested 6px rounded corners.

**✅ Already supported (both (a) and (b)):**
- (a) The native text DSL's inline `{ … }` block already routes style keys through
  `node.style` → `mapStyleToOptions`, whose passthrough list **includes**
  `borderRadius`, `backgroundColor`, `strokeColor`, etc. So
  `card [rect] "Card" { borderRadius: 6 }` already produces 6px rounded corners.
- (b) `window.Yappy.updateElement(id, updates)` **is** public (`api.ts:1424`), as are
  `getElement` / `deleteElement`, with `window.Yappy = YappyAPI` (`api.ts:3191`). The
  gap note predated these. A post-import `updateElement(id, { borderRadius: 6 })` works.

---

## Gap 6 — no headless / CLI export path

**Symptom:** SVG export (`frontend/src/utils/export.ts:419`, `exportToSvg`) depends on the browser
DOM (`document.createElementNS`, `XMLSerializer`) and the live SolidJS `store`, so there is no
Node-only or CLI way to render a `.ysl`/`.mmd` to `.svg`. Automation must drive the running app
through Playwright + `window.Yappy.importDSL`/`exportSVG`.

**Suggestion:** a thin CLI (`yappy render input.ysl -o out.svg`) — even one that boots a headless
page internally — would make batch/CI diagram generation a one-liner.

**✅ Fixed:** added `scripts/render-dsl.mjs` (`npm run render:dsl -- <in.ysl> -o <out.svg>`).
It boots a headless Chromium (Playwright), reuses a running instance or spawns Vite,
imports via `window.Yappy.importDSL`, and writes `exportSVG`. Supports `--url`,
`--port`, `--selected`, `-o -` (stdout). This is exactly the batch/CI one-liner the
gap asked for — and the harness used to verify Gaps 1–5 end-to-end.

---

### Priority for the design-patterns use case
**All resolved.** Gaps 1–3 (members, aggregation node drop, arrowheads) turn the
name-only boxes into real UML class diagrams — both on-canvas **and** in exported SVG;
Gaps 4–6 (YSL members, per-node style, headless CLI) are the quality-of-life layer and
now the `render:dsl` CLI makes batch generation a one-liner.
