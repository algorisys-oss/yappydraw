# 30 Illustrator Secrets — how YappyDraw stacks up

A tip-by-tip mapping of the YouTube video **"30 Illustrator Secrets Graphic Designers MUST KNOW!"**
(`Q0QOqJvhRm4`) onto YappyDraw. For each Illustrator trick we note whether Yappy
supports it, **how** (the `window.Yappy` API, the UI path, and the hotkey), and any **gap**.

Audited against the codebase on **2026-06-27** (`frontend/src/api.ts`,
`frontend/src/help-docs/`, `frontend/src/store/app-store.ts`, and the e2e specs).

**Legend:** ✅ Supported  🟡 Partial  ❌ Missing

**Original audit scorecard: 14 ✅ · 9 🟡 · 7 ❌** — ~23/30 at least partially covered.
Several "missing" ones (CMYK, print DPI) are inherent to a browser-canvas app rather than
true feature gaps.

> ### Update — gaps closed (2026-06-27)
> A follow-up pass implemented most of the gaps (each in a verified commit). Updated
> support for the tips below — the per-tip sections still show the *original* audit
> status; this list is the current truth:
>
> - **#9 Gradient on stroke → ✅** `Yappy.setStrokeGradient({type,angle,colors|stops})` /
>   `clearStrokeGradient`; UI "Gradient stroke" in the Appearance editor. Architectural
>   canvas + pipeline-SVG render the gradient; sketch strokes stay solid; simple-shape
>   SVG export still falls back to solid stroke (known limitation).
> - **#12 Star points → ✅** Up/Down arrows change the point/side count of a selected
>   star (3–12) / polygon (3–20) / burst (8–32); Left/Right still nudge.
> - **#13 Pan → ✅** Spacebar-hold = temporary Hand/pan tool (a quick space tap still
>   collapses a mindmap node). Two-finger pan + pinch-zoom already existed.
> - **#18 Rearrange artboards → ✅** `Yappy.rearrangeArtboards(columns?, gap?)` grid layout.
> - **#19 Outline / wireframe view → ✅** Command palette "Toggle Outline (Wireframe) View"
>   / `Yappy.toggleOutlineView()` — strips fills/effects to clean ~1px strokes (canvas only;
>   exports unaffected).
> - **#22 Eyedropper colour-only → ✅** Shift-click samples just the fill colour
>   (`applyEyedropperFrom(id, true)`).
> - **#23 Transform nudge → ✅** Ctrl/Cmd + Arrow = fine 0.1px nudge (Shift = 10px).
> - **#24 Math in fields → ✅** number inputs evaluate `200-50%`, `+10`, `*2`, `/3`, `(4+1)*8`.
> - **#29 Undo depth → ✅** configurable via Settings → Undo History Depth /
>   `Yappy.setHistoryDepth(n)`.
>
> **Updated scorecard: ~23 ✅ · 3 🟡 · 4 ❌.** Still open: Intertwine (#3), Tints/Color-Guide
> harmonies (#15), Smooth brush (#6/#7 interactive), the CMYK/DPI web-platform items (#17),
> and deferred niceties (Zoom tool — Z is Zen; arc F-flip — arcs are parametric).
>
> **Smooth (#6/#7) → ✅ one-shot (2026-06-27):** `Yappy.smoothPath(ids, strength, iterations)`
> + right-click path → Smooth — Laplacian smoothing that rounds janky curves while keeping
> the anchor count (complements Simplify, which reduces points). Not yet an interactive
> drag-brush, but covers the "clean up janky curves" intent.
>
> **Tints / Color-Guide (#15) → ✅ (2026-06-27):** `Yappy.generateTints(hex)`,
> `generateHarmony(hex, type)` (complementary/analogous/triadic/split-complementary/
> tetradic/monochromatic), `applyHarmonyToSelection`, and the "colour theme picker"
> `extractImagePalette` / `recolorFromImage` + `applyPaletteToSelection`.

---

## 1. Copy appearance from one object to another — ✅
- **Illustrator:** Alt-drag the appearance indicator in the Layers panel.
- **Yappy:** `Yappy.copyStyle()` on a source, then `Yappy.pasteStyle()` onto the target — copies the **full** appearance (fill, stroke, gradient/mesh, appearance stack, shadow, opacity, text style). The eyedropper (`startEyedropper`) does the same by clicking a source.
- **UI/Hotkey:** right-click → *Copy/Paste Style*; eyedropper via right-click.
- **Gap:** none for full-style copy.

## 2. Dashed / dotted line — ✅
- **Illustrator:** Stroke panel → dashed, dash 0 + round cap → dotted.
- **Yappy:** `Yappy.updateElement(id, { strokeStyle: 'dotted' | 'dashed' | 'solid' })`; round line caps are used in the renderer so `dotted` reads as round dots.
- **UI/Hotkey:** Property panel → Stroke → Style dropdown.
- **Gap:** presets only — no numeric **dash/gap array** to dial the exact spacing.

## 3. Intertwine (weave shapes over/under) — ❌
- **Illustrator:** Object → Intertwine → Make, drag the overlap to weave.
- **Yappy:** not implemented. You can fake it manually with z-order + a clipping mask, but there's no automatic over/under at the intersection.
- **Gap:** genuine feature gap.

## 4. Trim View (hide art outside the artboard) — 🟡
- **Illustrator:** View → Trim View.
- **Yappy:** artboards/`exportArtboard(id, scale)` **clip the export** to the artboard bounds, so the *output* is trimmed — but there's no live in-canvas "trim preview" mode that hides overflow while editing.
- **Gap:** no live trim-preview toggle.

## 5. Arc tool (+ F to flip while drawing) — 🟡
- **Illustrator:** Arc tool drag; press F to flip direction.
- **Yappy:** `Yappy.createArc(cx, cy, radius, startDeg, endDeg, options)` creates arc paths (any sweep).
- **UI:** right-click canvas → Insert → Arc.
- **Gap:** arcs are created parametrically; no click-drag-with-**F-flip** interactive draw.

## 6. Smooth tool (clean janky curves) — 🟡
- **Illustrator:** Smooth tool, drag repeatedly over a path.
- **Yappy:** `Yappy.simplifyPath(ids)` reduces/relaxes points to smooth a path; pen **stabilization** smooths strokes as you draw.
- **Gap:** no interactive "paint-over-to-smooth" brush — smoothing is a one-shot simplify.

## 7. Pencil + hold Alt = Smooth tool — 🟡
- **Illustrator:** hold Alt while drawing with the Pencil to switch to Smooth.
- **Yappy:** pen **stabilization** ("lazy brush", strength 0–1) is the equivalent smoothing control, toggled per-tool.
- **UI:** stabilization toggle in the pen toolbar; strength in Settings → Pen & Input.
- **Gap:** stabilization is a global per-tool setting, not an Alt-hold momentary mode.

## 8. Knife — straight cuts (Alt+Shift) — ✅
- **Illustrator:** Knife drag; Alt+Shift for a straight cut; pieces separate.
- **Yappy:** `Yappy.toggleCutTool()` then drag to slice every crossed shape into separate pieces; `Yappy.knifeCut(...)` API.
- **UI:** right-click → Knife.
- **Gap:** straight-line **constraint** modifier isn't documented/confirmed.

## 9. Gradient on a STROKE — ❌
- **Illustrator:** apply a gradient along/across a stroke; move a stop for a highlight.
- **Yappy:** gradients (linear/radial/conic/**mesh**) are fully supported on **fills**, but **strokes are solid-colour only** (appearance-stack strokes take colour/width/opacity/dash, no gradient).
- **Gap:** genuine feature gap — no stroke gradients.

## 10. Pencil reshape an existing shape — ✅
- **Illustrator:** draw over a shape's edge with the Pencil to reshape it.
- **Yappy:** `Yappy.toggleReshapeTool()` then drag a path to bend it (endpoints stay pinned).
- **UI:** right-click path → Reshape.

## 11. Pencil smoothness/fidelity slider — ✅
- **Illustrator:** double-click Pencil → fidelity slider (smoother vs accurate).
- **Yappy:** stabilization **strength** slider (Settings → Pen & Input) is the same trade-off — higher = smoother, lower = more faithful.
- **Gap:** smoothing is applied live (stabilization), not as a post-draw fidelity re-fit.

## 12. Star tool — points & radius — 🟡
- **Illustrator:** Up/Down arrows change point count **while drawing**; Ctrl-drag changes inner radius.
- **Yappy:** `Yappy.createStar(x, y, w, h, points, options)`; point count is editable via the API and the property panel.
- **Gap:** no **live** arrow-key point adjustment or Ctrl-drag inner-radius while drawing.

## 13. Navigation — pan, zoom, fit — ✅
- **Illustrator:** Spacebar = Hand/pan; Ctrl ± zoom; Z = Zoom tool; Ctrl+0 fit.
- **Yappy:** panning works (drag-to-pan / trackpad / wheel); **Ctrl +/-** zoom; **0** = reset to 100%; **1** = `zoomToFit()` (fit canvas); **2** = `zoomToSelection()`.
- **Gap:** different keymap — Spacebar is bound to mindmap-collapse (not Hand), and `Z` is Zen Mode (no dedicated Zoom tool).

## 14. Global swatches (edit once, update everywhere) — ✅
- **Illustrator:** edit a global swatch → all linked art updates.
- **Yappy:** `Yappy.createSwatch()`, `Yappy.applySwatch(id, 'fill'|'stroke')`, `Yappy.updateSwatchColor(id, color)` — linked elements (`fillSwatchId`/`strokeSwatchId`) update live; `listSwatches()` enumerates.
- **UI/Hotkey:** Swatches panel (**Alt+W**); `+` makes a swatch from selection.

## 15. Tints & Color Guide harmonies — ❌
- **Illustrator:** Color Guide → tints/shades/harmonies off a base swatch that re-derive when the base changes.
- **Yappy:** **Recolor Artwork** (`toggleRecolorPanel`, `adjustSelectionColors({hue,sat,lightness})`, `recolorSelectionColor(from,to)`) covers palette-shifting on a selection, but swatches are a **flat** list — no parent→tint hierarchy or harmony engine.
- **Gap:** no tints/harmonies (Recolor is the partial substitute).

## 16. Edit the document / resize the artboard — ✅
- **Illustrator:** Artboard tool → change width/height; document setup.
- **Yappy:** `Yappy.updateArtboard(id, { width, height })` or drag the 8 artboard handles; `Yappy.addArtboard(preset)` with presets (A4, IG Story, 16:9, Web 1280…).
- **UI:** select artboard → resize handles; right-click → Artboards.

## 17. DPI / CMYK vs RGB — ❌ (web-inherent)
- **Illustrator:** Document Raster Settings DPI; File → Document Color Mode (CMYK/RGB).
- **Yappy:** RGB only (browser canvas); resolution is controlled by **export scale** (`exportArtboard(id, 2)` for 2× retina), not a DPI field; no CMYK colour space.
- **Gap:** inherent to a web-canvas app, not a simple feature add.

## 18. Rearrange All artboards (grid layout) — ❌
- **Illustrator:** Rearrange All Artboards → grid with column count + spacing.
- **Yappy:** add/resize/delete artboards yes; new ones are placed to the right — no batch auto-grid with columns/spacing.
- **Gap:** genuine feature gap.

## 19. Outline / wireframe view — ❌
- **Illustrator:** View → Outline shows path-only, no fills.
- **Yappy:** two render styles exist — **Sketch** (rough/hand-drawn) and **Architectural** (clean) — but both render full fills; there's no stroke-only diagnostic outline mode.
- **Gap:** genuine feature gap.

## 20. Shape Builder — ✅
- **Illustrator:** drag across overlaps to merge; Alt-click to delete a region.
- **Yappy:** `Yappy.toggleShapeBuilder()` then drag across ≥2 selected shapes to merge; Alt-drag to delete a region (same atomic-region engine as Live Paint).
- **UI:** right-click → Shape Builder.

## 21. Scissors tool — ✅
- **Illustrator:** click a path to add cut points, then delete a segment.
- **Yappy:** `Yappy.splitPathAt(...)` / cut-tool single-click splits a path at the point; then Direct-Select the segment and delete.
- **UI:** Cut tool → click (vs drag for Knife).

## 22. Eyedropper — ✅ copy props · 🟡 modifiers
- **Illustrator:** copy properties; Shift-click samples colour only; double-click to configure what it picks up.
- **Yappy:** `Yappy.startEyedropper()` + `applyEyedropperFrom()` copies the **full** style.
- **Gap:** no **Shift-click "colour only"** and no double-click "what to pick up" configuration.

## 23. Transform nudge — arrows + modifiers — 🟡
- **Illustrator:** arrow keys nudge; Shift = larger, Ctrl/Cmd = smaller.
- **Yappy:** arrow keys nudge **1px**, **Shift+arrow = 10px** (`moveSelectedElements`).
- **Gap:** no Ctrl/Cmd **fine** (sub-pixel) nudge increment.

## 24. Math in the size/transform fields — ❌
- **Illustrator:** type `-50%`, `+10`, `*2`, `/3` in W/H/X/Y fields and it evaluates.
- **Yappy:** numeric inputs accept literal numbers only — no expression evaluation.
- **Gap:** genuine feature gap (a nice, cheap win — wrap the input parser in an expression evaluator).

## 25. Escape the Perspective Grid — ✅
- **Illustrator:** View → Perspective Grid → Hide Grid (the "how do I get rid of this" tip).
- **Yappy:** `Yappy.togglePerspectiveGrid(false)` hides it; `setPerspectiveGrid({...})` and `projectToPlane('left'|'right'|'floor')` drive it.
- **UI:** Command Palette → "Perspective Grid" to toggle.

## 26. Groups — enter to edit, double-click out — ✅
- **Illustrator:** double-click to enter a group (isolation); double-click empty canvas to exit.
- **Yappy:** `Yappy.groupSelection()` / `Yappy.ungroupSelection()`; double-click a group to enter and edit children, double-click empty / Esc to exit.
- **Hotkey:** **Ctrl+G** group, **Ctrl+Shift+G** ungroup.

## 27. Brushes & brush libraries — 🟡
- **Illustrator:** Brushes panel → open a brush library, apply art/paintbrush strokes.
- **Yappy:** **Blob Brush** (`toggleBlobBrush`), **Width tool** (`toggleWidthTool` / `setWidthPoint` for variable-width ribbons), and pressure-sensitive **Ink/calligraphic** pens.
- **Gap:** no art/scatter/pattern **brush library** (preset decorative brushes).

## 28. Pathfinder → Divide (+ ungroup) — ✅
- **Illustrator:** Pathfinder → Divide, then ungroup the pieces.
- **Yappy:** `Yappy.pathfinderRegion(ids, 'divide')` (also `trim`/`merge`/`crop`/`outline`) and `Yappy.pathfinder(ids, 'union'|'subtract'|'intersect'|'exclude')` — each returns separate path ids (no group to break).
- **UI:** right-click → Pathfinder / Distort menu.

## 29. More undo states — 🟡
- **Illustrator:** Preferences → Performance → raise undo-history depth.
- **Yappy:** full **undo/redo** (Ctrl+Z / Ctrl+Shift+Z) plus a scrubable **History panel** (Alt+H).
- **Gap:** history depth is fixed at **50** states (not user-configurable).

## 30. File handling / save location (no forced cloud) — ✅
- **Illustrator:** Preferences → File Handling to stop the always-save-to-Cloud popup.
- **Yappy:** local **auto-save** to IndexedDB + manual **Save As / Load** (Ctrl+Alt+S / Ctrl+Alt+O), with **opt-in** cloud (Google Drive) — local is the default, no forced cloud dialog.
- **Gap:** cloud is Google Drive only (no Dropbox/OneDrive).

---

## Gaps worth flagging

**Genuine feature gaps (candidates for the roadmap):**
1. **Intertwine / weave** (#3) — no over/under at overlaps.
2. **Gradient on strokes** (#9) — fills have gradients/mesh; strokes are solid only. *(Highest Illustrator-parity value.)*
3. **Tints / Color Guide harmonies** (#15) — swatches are flat; no base→tint hierarchy.
4. **Rearrange-all artboard grid** (#18) — no auto-layout with columns/spacing.
5. **Outline / wireframe view** (#19) — no fill-stripped path view.
6. **Math in numeric fields** (#24) — cheapest high-value win; add an expression evaluator to the W/H/X/Y inputs.
7. **Eyedropper modifiers** (#22) — Shift-click colour-only + double-click config.

**Smaller polish gaps:**
- Star: live arrow-key points / Ctrl-drag radius **while drawing** (#12).
- Arc: interactive draw with **F-flip** (#5).
- Interactive **Smooth brush** vs one-shot simplify (#6/#7).
- Ctrl/Cmd **fine** nudge increment (#23).
- Configurable **undo depth** beyond 50 (#29).
- Live **Trim View** preview (#4).

**Inherent to a web-canvas app (not quick wins):**
- **CMYK** colour mode and print **DPI** (#17) — Yappy is RGB + export-scale by design.

**Keymap differences (work, but bound differently than Illustrator):**
- Spacebar = mindmap-collapse (not Hand); `Z` = Zen Mode (no Zoom tool); fit = `1`/`2`, reset = `0` (#13).
