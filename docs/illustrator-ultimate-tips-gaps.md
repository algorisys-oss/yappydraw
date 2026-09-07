# "Ultimate Illustrator Tips & Tricks" — where YappyDraw is lacking

Gap analysis of the second video (`jGLg_3qblxc`, an Adobe-certified instructor's
large-campaign workflow reel) against YappyDraw. Audited against the codebase on
**2026-06-27**.

This video is much more **Adobe-ecosystem / AI** than the first one, so a large
share is out of scope for a standalone web editor rather than a true gap. Legend:

**✅ Supported · 🟡 Partial · ❌ Missing (real editor gap) · ☁️ Out of scope (Adobe cloud/AI)**

> ### Update — quick wins shipped (2026-06-27)
> The "Quick, high-value" set below is now implemented & e2e-verified
> (`tests/quick-wins-video2.spec.ts`):
> - **Trim View → ✅** `Yappy.toggleTrimView()` / command palette "Toggle Trim View" —
>   clips rendering to the artboards union (needs ≥1 artboard).
> - **Swap fill/stroke → ✅** **Shift+X** / `Yappy.swapFillStroke()`.
> - **Object › Path › Clean Up → ✅** `Yappy.cleanUp()` — removes stray points, empty
>   text frames and unpainted objects.
> - **Paste on All Artboards → ✅** `Yappy.pasteOnAllArtboards()` (same relative position).
> - **Delete Unused Swatches → ✅** `Yappy.deleteUnusedSwatches()`.
>
> ### Update — second batch shipped (2026-06-27)
> Also implemented & e2e-verified (`tests/next-batch.spec.ts`):
> - **Duplicate artboard (+artwork) → ✅** `Yappy.duplicateArtboard(id?)`.
> - **Fit artboard to artwork → ✅** `Yappy.fitArtboardToArtwork(id?, pad?)`.
> - **Select › Same (extended) → ✅** `Yappy.selectSimilar(ref, 'fontFamily'|'fontSize'|
>   'opacity'|'strokeWidth'|'type'|…)` + command-palette "Select › Same …" entries.
> - **Recolor: shuffle colour order → ✅** `Yappy.shuffleSelectionColors()` (a derangement).
> - **Colour theme picker (palette-from-image) → ✅** `Yappy.extractImagePalette()` /
>   `recolorFromImage()`; plus Color-Guide `generateTints`/`generateHarmony`/`applyHarmonyToSelection`.
>
> ### Update — third batch shipped (2026-06-27)
> Also implemented & e2e-verified (`tests/swatch-bleed-batch.spec.ts`):
> - **Swatch groups → ✅** `createSwatch(c,name,group)`, `setSwatchGroup(ids,group)`,
>   `listSwatchGroups()`, `createSwatchGroupFromSelection(group)`.
> - **Print bleed + crop marks → ✅** `Yappy.setBleed(px)` (Settings → Print Bleed) draws a
>   bleed boundary + registration/crop marks around artboards (board/`infinite` docs).
>
> Still open: OpenType ligatures, live Global Edit, Mockup preview, customisable keymap —
> plus the first
> video's Intertwine, Tints/Color-Guide, interactive Smooth brush.

---

## Already covered (✅ / 🟡)

| Tip | Status | YappyDraw equivalent |
|---|---|---|
| Recolor artwork (drag to repick) | ✅ | `toggleRecolorPanel`, `recolorSelectionColor`, `adjustSelectionColors` |
| Outline mode (Ctrl+Y) | ✅ | **just added** — `toggleOutlineView` (command palette) |
| Global swatches | ✅ | `createSwatch`/`applySwatch`/`updateSwatchColor` (edit once, updates all) |
| Add selected colours → swatches | ✅ | `createSwatch` from selection |
| Pencil + double-click smoothness | ✅ | pencil tools + pen **stabilization** strength |
| Join open paths ("join tool") | ✅ | `joinPaths` |
| Simplify path | ✅ | `simplifyPath` |
| Reusable/linked assets ("smart objects update everywhere") | 🟡 | **Symbols** — `createSymbol`/`placeInstance`/`redefineSymbol` (edit a symbol → instances update). No cross-app linking. |
| Select › Same (fill/stroke) | 🟡 | `selectSimilar('fill'\|'stroke'\|'both')` — **no** "same font family / size / weight / opacity" |
| Measure / dimensions | 🟡 | `toggleMeasure` measures, but doesn't drop persistent **dimension annotations** with arrowheads |
| Screen-mode cleanup (F key) | 🟡 | Zen Mode (`toggleZenMode`, Alt+Z) is the closest |
| Zoom with scroll wheel | ✅ | wheel zoom supported; pinch-zoom on tablets too |
| Add artboards | ✅ | `addArtboard(preset)` |

---

## Real editor gaps (❌ — candidates for follow-up, roughly high→low value)

1. **Trim View** — the instructor's *favourite* tip (also gap #4 in the 30-tips doc).
   A temporary view that hides everything outside the artboard while editing. Yappy
   only clips at **export** time. *Cheap, high-delight.*
2. **Swap fill ⇄ stroke (Shift+X)** — trivial, expected muscle-memory shortcut. Missing.
3. **Object › Path › Clean Up** — remove stray anchor points, empty text boxes and
   unpainted objects in one go. Very useful after importing messy PDFs/SVGs. Missing.
4. **Paste on all artboards** (Edit › Paste on All Artboards) — drop one element onto
   every artboard at once. Missing.
5. **Duplicate artboard** (Alt-drag with the artboard tool) and **Fit artboard to
   artwork bounds** (preset) — Yappy can add/resize artboards and fit to *selection*
   on create, but not duplicate-in-place or re-fit an existing artboard to its content.
6. **Select › Same — extended** — beyond fill/stroke: same **font family / style /
   size**, opacity, stroke weight, blending mode. (`selectSimilar` covers fill/stroke only.)
7. **Global Edit** — live "edit all similar objects across artboards at once" (resize
   one, all matching shapes change). Partially approximated by `selectSimilar` + edit,
   but not the live linked-edit experience.
8. **Recolor upgrades** — (a) **pull a palette from an image** ("color theme picker"),
   (b) **shuffle/randomise colour order** in the recolor panel. Both are cheap, fun wins
   on top of the existing recolor panel.
9. **Delete unused swatches** + **swatch groups** (organise swatches into named groups;
   "select all unused → delete"). Yappy swatches are a flat list.
10. **Bleed / Document Setup** — set a bleed margin (with unit conversion) and crop marks
    for print. Missing (consistent with the CMYK/print gaps in the 30-tips doc).
11. **OpenType ligatures / alternates** — pick stylistic ligatures/swashes from a font.
    No OpenType feature controls in the text engine.
12. **Mockup preview** (Object › Mockup) — wrap artwork onto apparel/packaging mockups.
    Niche; lower priority.
13. **Customisable keyboard shortcuts** — the instructor remaps Trim View to a key. Yappy
    hotkeys are fixed (no user keymap editor).
14. **Swatch "book" / create-swatch-info** — generate a labelled swatch sheet artboard.
    Niche.

---

## Out of scope — Adobe cloud / AI ecosystem (☁️)

These depend on Adobe's cloud, Firefly, or cross-app integration and aren't realistic
for a standalone web editor (noted for completeness, not as gaps):

- **Generative Recolor** (AI theme like "80s"), **Generate Vectors** (text→vector with a
  style reference), **Generative Expand** (AI-extend artwork / AI bleed fill) — Firefly AI.
  *Yappy does have its own AI `generateDiagram`, a different capability.*
- **CC Libraries** — shared, team-synced, linked assets with relink; cross-app reuse in
  Premiere/After Effects/InDesign. (Yappy **Symbols** cover the in-document "linked
  component" idea, but not cloud team libraries.)
- **Share for Review** + **Comments panel** (guest pins/comments, no login) — Adobe cloud
  collaboration. (Yappy has share/embed, not reviewer pin-comments.)
- **Adobe Express brand kits / templates / scheduling** — separate Adobe product.
- **Cross-app Smart Objects** updating across Adobe apps — ecosystem-only.

---

## Suggested priority if we tackle these

**Quick, high-value:** Trim View · Swap fill/stroke (Shift+X) · Clean Up paths · Paste on
all artboards · Recolor "shuffle order" + palette-from-image · Delete unused swatches.

**Medium:** Duplicate/fit artboard · Select › Same (font/size/weight) · Bleed & crop marks ·
swatch groups · OpenType ligatures.

**Lower / niche:** Global Edit (live) · Mockup preview · customisable keymap · swatch book.

Everything in the **☁️ Out of scope** section would require Adobe-cloud or generative-AI
infrastructure and is best treated as non-goals (or Yappy-native reinterpretations, e.g.
the existing Symbols and `generateDiagram`).
