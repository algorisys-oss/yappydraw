# Non-destructive compound shapes — plan & as-built

> **TL;DR.** Illustrator's *Compound Shapes* = a boolean (Unite / Minus Front / Intersect /
> Exclude) whose **source shapes stay editable** and whose operation can be **changed after the
> fact**, with **Expand** to flatten. Yappy already had the destructive **Pathfinder** (flatten +
> discard sources). This adds the non-destructive variant. **Shipped v0.8.67.** Complexity: **M**.

## 1. Goal
Combine ≥2 shapes with a boolean op into one object that **retains its sources** — so you can change
the operation, release the sources back for editing, or expand (flatten) to a plain path. The gap the
audit flagged: Yappy had destructive booleans + compound *paths* (holes), but no non-destructive
compound *shapes*.

## 2. As-built (the pragmatic model)
A compound shape is a **`path` element** that carries its retained operands + the operation:
- `compoundOperands?: DrawingElement[]` — the source elements (world coords), kept for re-evaluation.
- `compoundOp?: 'union' | 'subtract' | 'intersect' | 'exclude'`.
- Its `pathAnchors`/`pathSubpaths` are the **evaluated boolean result** (via the existing
  `runBooleanOp` + `polyToPathSubpaths`), so it **renders / hit-tests / serializes / exports as any
  path** — zero new element type, renderer, or hit-test. (The agent-recommended first-class
  `type:'compound'` with live `getShapeGeometry` eval is the richer long-term architecture; this
  path-based model ships the full non-destructive value at a fraction of the surface.)

Operations (`store/app-store.ts`, reusing `runBooleanOp`/`buildPathFromPoly` machinery):
- **`makeCompoundShape(ids, op)`** — back→front, run the boolean, build ONE even-odd path combining
  all result polys, store deep-copied operands, replace the sources (z-order preserving), select it.
- **`setCompoundShapeOp(id, op)`** — re-evaluate the retained operands with a new op, update the path
  in place. Absorbs any move first (`syncCompoundOperands`) so a moved compound re-evaluates in place.
- **`releaseCompoundShape(id)`** — re-insert the operands as editable top-level elements.
- **`expandCompoundShape(id)`** — drop `compoundOperands`/`compoundOp` → a plain path (flatten).

**UI:** right-click ≥2 shapes → **Make Compound Shape ▸ Unite/Minus Front/Intersect/Exclude**; a
selected compound → **Compound Shape ▸ Op: … / Release / Expand**. API: `Yappy.makeCompound`,
`setCompoundOp`, `releaseCompound`, `expandCompound`.

**Tests:** `tests/compound-shapes.spec.ts` (e2e: retains 2 sources; union vs intersect bbox; the union
result draws pixels — differs from an empty canvas; op-change re-renders; release → 2 circles back;
expand → plain path with no operands).

## 3. In-place editing — as built (v0.8.69)
**Double-click a compound** (or right-click → Compound Shape ▸ Edit Contents) to edit its sources in
place, modeled on the symbol edit-in-place flow: `enterCompoundEdit` explodes the retained operands
into real, grouped, selectable elements (the compound is removed; the original is stashed in the
`compoundEdit` session); edit them freely; **Esc** (or `finishCompoundEdit()`) rebuilds the compound
from the edited sources by re-running the boolean. Cancel (`finishCompoundEdit(false)`) restores the
stashed original unchanged. `syncCompoundOperands` positions the exploded sources at the compound's
current spot. e2e: `tests/compound-edit.spec.ts` (explode → move a source → rebuild wider; cancel
restores). Visually confirmed.

## 4. Known limitations / follow-ups
- Operand sync handles **translation** of the compound; rotating/scaling the compound then changing the
  op re-evaluates from the un-rotated operands (rare; note for a future first-class `type:'compound'`).
- Node-editing the result path directly desyncs it from the operands (as in Illustrator).
- v1 is the four Shape Modes (Unite/Minus/Intersect/Exclude); no docked Pathfinder *panel* (context
  menu + API only), matching the existing destructive Pathfinder.
