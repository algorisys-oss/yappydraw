# Type-to-Label — spec

**Status:** F1 shipped v0.8.242, F3 shipped v0.8.243; F2 (auto-increment) proposed, not implemented
**Date:** 2026-09-10
**Motivation:** workshop/training speed — dropping a row of nodes labelled A, B, C or 1, 2, 3
should not cost a double-click and a mode switch per shape.

---

## 1. Prior art

| Tool | Get text into a shape without double-clicking |
|---|---|
| Excalidraw | Select shape → **Enter** |
| tldraw | Select shape → **Enter** |
| PowerPoint / Keynote / Visio | Draw shape → **just start typing** |
| draw.io, Lucidchart | Select shape → **F2 or start typing** |
| FigJam / Miro | Drop a sticky → it opens in edit mode automatically |
| yEd, Gephi, Cytoscape | New nodes are **auto-numbered** 0, 1, 2… — no typing at all |

**Typing *during* the drag, mouse button still held, is not something I can find in any
mainstream design tool.** The nearest relatives are CAD: AutoCAD/Fusion "dynamic input"
(drag a line, type `50` mid-drag into a heads-up dimension field) and Blender's modal
transform (`G`, then type a number). Both consume keystrokes inside a live drag — but for
numeric dimensions, never for labels. The gesture is proven; nobody has pointed it at text.

Note what the graph editors did: they concluded the fastest label is the one you don't type.
That shapes the design below — auto-increment is the primitive, typing is the override.

---

## 2. Current state of yappy (audited 2026-09-10)

### What exists

- **Double-click to edit** — `utils/tool-handlers/text-editing-handler.ts:249`
  (`handleDoubleClick`). Covers ~200 shape types, plus per-section routing for `umlClass`
  and `umlState`, and per-cell routing for `table`.
- **F2 to edit the selected element** — `app.tsx:855` → the `__nodeTextEdit.startEditing`
  bridge at `components/canvas.tsx:2537`. Works for **any** single text-bearing element (it
  rejects only bare connectors: `line`, `arrow`, `bezier`, `polyline`, `organicBranch`),
  routes to `text` vs `containerText` correctly, and passes `selectAll: true` so typing
  replaces. Listed in `components/help-dialog.tsx:137`.
- **A newly drawn shape is left selected** — `utils/tool-handlers/draw-handler.ts:686-696`.
  The tool reverts to `selection` unless `keepToolActive` / `toolLocked`. So the Excalidraw
  "draw → Enter" flow already has its precondition satisfied.
- **Mode-scoped capture keydown listeners** — `components/canvas.tsx:2367-2430` installs
  `handleCropKeys`, `handlePolylineKeys`, `handlePenKeys` on `window` in capture phase for
  the lifetime of one interaction. This is the exact pattern a drag-scoped key handler wants.

### What does NOT exist

- **Enter to edit the selected shape.** `app.tsx:881` claims `enter` only for **mindmap
  nodes** (`selEl?.parentId`), and there it adds a *sibling*, not an edit. For an ordinary
  rectangle, Enter does nothing. Enter is otherwise claimed only by mode-scoped listeners
  (pen/polyline/crop finish, animation play-pause, presentation advance) — never globally
  for a static selection.
- **Type-to-replace on a selected shape.** No printable-character handler exists anywhere;
  `app.tsx:479` states the rule outright ("Printable chars → fall through to tool
  shortcuts").
- **Auto-edit on create.** Only two `setEditingId` call sites in `canvas.tsx` (2515, 2560),
  both inside the `__tableCellNav` / `__nodeTextEdit` bridges. Nothing on the draw path.
- **Auto-increment labels.** Nothing.
- **Type-during-drag.** Nothing.

### Documentation bug found during this audit

`frontend/src/help-docs/shapes/basic-shapes.md:139` reads:

> Double-click a shape (or select it and start typing) to give it a label.

**The parenthetical is false.** Typing a letter on a selected shape switches tools
(`r` → rectangle, `v` → selection…). Either the doc is corrected to say **F2**, or F1 below
is implemented and it says **Enter**. Log under `docs/bugs/bug-fixes.md` either way.

---

## 3. Proposed features

Three features, independently shippable, in increasing order of novelty and risk.

### F1 — Enter opens the label editor (parity, low risk) — **SHIPPED v0.8.242**

Select any text-bearing element, press **Enter**, the label editor opens with the existing
text selected. Identical to F2, on the key people actually reach for.

**Why it is nearly free:** `__nodeTextEdit.startEditing(id, { selectAll: true })` already
does the whole job. F1 is a new branch in `app.tsx` next to the `f2` branch, guarded to run
only when the mindmap branch declines.

**Ordering with the existing mindmap Enter.** The mindmap behaviour (Enter = add sibling)
must keep winning for elements with `parentId`, because that is a documented outline flow.
So:

```
if (key === 'enter' && selection.length === 1)
    if (selEl.parentId)  → addSiblingNode        (existing, unchanged)
    else                 → startEditing(id, { selectAll: true })   (new)
```

Escape already commits-and-closes via the text overlay, so Enter/Escape round-trips.

**Explicitly rejected: type-to-replace.** PowerPoint and draw.io let a bare letter start
editing. yappy must not, because single letters are the tool shortcut namespace
(`app.tsx:945` and the whole `command-registry.ts` shortcut table). Adopting type-to-replace
would mean either losing single-letter tool switching or making it conditional on selection
state — a mode with no visible indicator, which is worse than the problem. Excalidraw and
tldraw reached the same conclusion. **Enter is the answer; typing is not.**

### F2 — Auto-increment labels on create

A new shape is born already labelled. Drop → `A`. Drop → `B`. Drop → `C`.

**Settings** (in `globalSettings`, persisted per document):

| Field | Type | Default |
|---|---|---|
| `autoLabelMode` | `'off' \| 'upper' \| 'lower' \| 'numeric' \| 'roman'` | `'off'` |
| `autoLabelNext` | `number` (0-based ordinal) | `0` |
| `autoLabelPrefix` | `string` | `''` |

Sequences: `upper` → A…Z, AA, AB…; `lower` → a…z, aa…; `numeric` → 1, 2, 3…;
`roman` → i, ii, iii…. `autoLabelPrefix` composes (`Q` + numeric → Q1, Q2).

**Where it applies:** shapes that support `containerText` and were created by a drag on the
canvas. Not connectors, not freehand strokes, not pasted/duplicated elements, not DSL
import. A duplicate should copy its source's label, not consume a new one.

**Where it hooks:** `draw-handler.ts`, at the same commit point as the selection assignment
(`:686-696`), so it lands in the same history entry as the shape.

**Counter reset:** a command (`Reset label sequence`) in `command-registry.ts`, plus an
automatic reset when `autoLabelMode` changes. Undoing a shape creation must roll the counter
back — store `autoLabelNext` in the history entry, not only in settings, or the sequence
drifts on undo/redo.

**Off by default.** It changes what a plain drag produces; it must be opted into.

### F3 — Type during the drag (the novel one) — **SHIPPED v0.8.243**

Press, drag, and while the button is still down, type. Characters accumulate into the
shape's label and are visible inside the live preview. Release drops a labelled shape.

**Interaction:**

```
pointerdown (draw tool)     → element created, drag begins        [existing]
pointermove                 → element resized live                [existing]
keydown, printable char     → append to pending label, redraw     [NEW]
keydown, Backspace          → remove last char                    [NEW]
keydown, Escape             → passed through (see note below)      [unchanged]
pointerup                   → commit shape + label together       [existing + label]
```

**Implementation shortcut worth noting:** during a drag the element **already exists** in
the store (`pState.currentId`) and is being mutated on every `pointermove` — that is how the
live preview works. So typing is `updateElement(currentId, { containerText: buffer })` and
the preview renders the label for free, through the normal `containerText` path, in **both**
sketch and architectural styles, with **zero new rendering code**. No ghost overlay, no
canvas chip, no render-style parity work. The label appears exactly where it will live.

**Key routing while a draw-drag is in flight.** Install a capture-phase `keydown` listener
scoped to the drag, following `handlePenKeys` (`canvas.tsx:2416`):

| Key | Behaviour during draw-drag |
|---|---|
| Printable char (no Ctrl/Meta) | Appended to the label — **shadows the tool shortcut** |
| Shift, Alt, Ctrl, Meta | Unchanged — constrain / duplicate / snap modifiers must survive |
| Escape | Passed through — **must not** mean "clear the label" |
| Backspace / Delete | Delete one character — **must not** delete the element |
| Enter | Commit the label, keep dragging (do not end the drag) |
| Space | **Open question — see §6** |
| Arrow keys | Pass through (nudge/constrain), not text |
| Tab | Pass through |

Shadowing tool shortcuts is safe here: switching tools mid-drag is already meaningless.

**Correction (found while implementing):** an earlier draft of this table said Escape
"cancels the drag (existing)". It does not — Escape is wired only for crop, polyline and pen,
which are multi-click *construction*; a plain single-drag shape has never been cancellable
with Escape, and still is not. F3 leaves that unchanged: `'Escape'.length !== 1`, so the
label handler never sees the key and the drag commits as it always did. Whether draw-drags
*should* be Escape-cancellable is a separate question, now that typing a label makes an
in-progress shape worth more — logged in `todo.md`, not bundled into F3.

**Scope: newly-created shapes only.** Dragging an *existing* shape must not swallow
keystrokes — someone will destroy a label they only meant to move. Move-drag typing is
deliberately out of scope for v1.

**Discoverability.** Nobody finds this by accident. Needs: a line in the status bar hint
system (`components/status-bar.tsx:33`, `getContextHints`) while a draw-drag is active, an
entry in the help dialog, and a mention in the What's New copy.

---

## 4. Recommended phasing

1. **F1 (Enter-to-edit)** — hours, near-zero risk, closes a real parity gap and makes
   `basic-shapes.md:139` true. Ship alone.
2. **F2 (auto-increment)** — this is the feature that actually solves the stated workshop
   problem, because the common case drops to *zero* keystrokes.
3. **F3 (type-during-drag)** — the override on top of F2, and the genuinely novel bit.
   Cheap once F2 exists, because the label plumbing and the counter are already there.

If only one ships, ship F2 — "drag out eight boxes already lettered A–H" beats "type one
letter per box" for the training/workshop use case that started this.

---

## 5. Cross-cutting requirements (per CLAUDE.md)

- **Render-style parity** — no new rendering; the label rides the existing `containerText`
  path, which already handles sketch and architectural. Verify visually in both anyway.
- **`frontend/src/api.ts`** — expose `autoLabelMode` / `autoLabelPrefix` / the reset, and
  document that a created shape may arrive pre-labelled.
- **Help docs** — `frontend/src/help-docs/shapes/basic-shapes.md` §Text labels (fix the false
  claim, document Enter and auto-labels), `components/help-dialog.tsx` (add Enter next to
  the F2 entry at :137), and the i18n hotkey keys under `frontend/src/i18n/`.
- **`docs/bugs/bug-fixes.md`** — log the `basic-shapes.md:139` documentation bug.
- **`docs/learnings.md`** — the "Enter, not type-to-replace, because single letters are the
  tool namespace" reasoning is the kind of decision that gets re-litigated later.
- **Dev Mode** — F3 is unfinished-feeling UI by nature; gate it behind `isDevMode()`
  (`utils/command-registry.ts:20`) until the interaction settles.
- **WASM parity** — not affected; no geometry, hit-testing, routing, or snapping changes.

## 6. Open questions

1. ~~**Space during a draw-drag.**~~ **Resolved 2026-09-10: Space is text.** Panning
   mid-draw-drag is not a real gesture, for three reasons:
   - **It is physically impossible.** Space is *hold*-to-pan — it arms the pan tool, but
     actually panning still needs a pointer drag (`app.tsx:167-176`, where a short tap is
     disambiguated from a hold). During a draw-drag the one pointer is already committed to
     sizing the shape, so Space can never drive a pan; it only arms a tool with nothing to
     move it.
   - **The underlying need is already met.** "Draw a shape bigger than the viewport" is
     solved by auto-scroll, not by panning: `canvas.tsx:2082` calls `handleAutoScroll`
     (`utils/tool-handlers/minor-handlers.ts:980`) on every draw-move, so dragging toward
     the edge scrolls the canvas. Space was never the mechanism.
   - So Space during a draw-drag costs nothing and buys a word separator. Multi-word labels
     ("Load Balancer") work.

2. ~~**Pre-existing bug found while resolving Q1.**~~ **Fixed 2026-09-10 — bug #360.**
   The single-key shortcut chain in `app.tsx` ran during a live drag, so any of `1`, `2`,
   `v`, `r`, Space, Delete or an arrow key mid-drag stranded the gesture: `handlePointerUp`
   dispatches on `store.selectedTool` and tests `'pan'`/`'laser'`/`'eraser'` before
   `selectionOnUp`/`drawOnUp`, so the release took the wrong early return, the shape was
   never committed, and `pState.isDrawing` stayed stuck true — jamming every later stroke.
   Now gated on a `__canvasPointerBusy()` probe exposed by `canvas.tsx`, guarded once at the
   head of the chain. Pinned by `tests/hotkeys.spec.ts`.

   **This is a prerequisite that has landed, not a caveat:** F3 needs printable characters
   during a draw-drag to mean *text* rather than *tool switch*, and that chain is now
   already inert while dragging. F3 changes those keys from "ignored" to "appended to the
   label" — a much smaller and safer change than it would have been against the old code.

3. **Does auto-increment fire for shapes created by click (no drag)?** Some tools place a
   default-sized shape on a bare click. Should those consume a letter?

4. **Sequence scope.** One counter per document, or per artboard/slide? Per artboard is
   probably right for a deck (each slide starts at A), but it is more state.

5. **F3 and `keepToolActive`.** With the tool locked, drag-drag-drag produces A, B, C with
   no mode switching at all. That is the killer combination — worth an explicit test.
