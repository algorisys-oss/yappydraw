# Mindmap: Reaching Whimsical-Level Quality

**Status:** P1 + P2 shipped; P0 implemented but **default OFF** (2026-06-24) — balanced auto-reflow lays out vertically in practice and needs rework before re-enabling.
**Date:** 2026-06-24
**Related:** [mindmap.md](mindmap.md) (data model), [mindmap-layout.md](mindmap-layout.md) (layout engine)

> **Update 2026-06-24 (P1+P2):** Shipped — `M` keyboard tool + mouse `＋` add-child
> handle (#8/#6), smart-paste outline → subtree + `api.mindmapFromOutline` (#9),
> collapse child-count badges (#6), drag-reparent dashed preview branch (#7), radial
> fan-out spacing (#4), depth font taper in Auto-Style (#5).
>
> **Update 2026-06-24 (P0 — the feel gap):** Shipped. Mindmap trees now **auto-reflow**
> on every add / sibling / collapse / expand / delete / reparent, and the reflow is
> **animated** (~180ms ease-out via a cancelable rAF tween) — except the keyboard
> add+edit path, which reflows instantly so the text overlay lands on the node. A new
> **balanced** layout (top-level branches split left/right of the root) is the default
> for new maps. All gated by a `mindmapAutoLayout` setting (Settings → Mindmap; default
> on) with a default-direction picker; per-tree direction is remembered on the root
> (`mindmapDir`). Collapsed subtrees are treated as leaves so collapsing frees space.
>
> **Update 2026-06-24 (P0 turned OFF by default):** In practice the balanced
> auto-reflow reads as a vertical stack rather than a clean left/right split, so
> `mindmapAutoLayout` now defaults **off** and the default direction fell back to
> `horizontal-right`. The code remains (re-enable via Settings → Mindmap). **TODO:**
> fix the balanced layout — likely `placeBalancedSide` in
> [mindmap-layout.ts](../frontend/src/utils/mindmap-layout.ts) — before re-enabling.

This document captures *why* Whimsical's mindmap feels better than ours and the
prioritized plan to close that gap. It is grounded in the current codebase, not
generic advice — file/line references point at the exact code each item touches.

---

## 1. What actually makes Whimsical feel great

It is **not** the feature list. Three things, working together:

1. **Continuous automatic layout.** The user never positions a node. Every
   add / edit / delete / collapse / reparent instantly reflows the *whole* tree
   into a clean, balanced arrangement. Positioning is never the user's job.
2. **Motion.** Nodes *glide* into their new positions (~150–250ms ease-out). That
   tweening is what reads as "polished" — it signals the structure is alive and
   intentional rather than snapping arbitrarily.
3. **Restraint.** A tight palette, consistent spacing/typography, one good
   connector style. It looks *designed*, not *configurable*.

## 2. Where Yappy stands today

Surprisingly far along on **capability**:

- ✅ Keyboard create / navigate / collapse / delete / edit (`Tab`, `Enter`, arrows,
  `Space`, `Delete`, `F2`) — see [app.tsx](../frontend/src/app.tsx) keydown handler.
- ✅ A real layout engine — [`MindmapLayoutEngine`](../frontend/src/utils/mindmap-layout.ts)
  with horizontal / vertical / radial strategies.
- ✅ Branch colours, depth-based stroke tapering, node styles (rectangle / rounded /
  cloud / circle / capsule), branch styles, DSL import (mermaid), templates, and
  drag-to-reparent ([reparent.ts](../frontend/src/utils/reparent.ts)).

The gap is almost entirely **feel**, and it traces to one architectural choice.

## 3. Root cause: layout is *manual*, not *continuous*

- [`addChildNode`](../frontend/src/store/app-store.ts) and
  [`addSiblingNode`](../frontend/src/store/app-store.ts) place the new node with a
  **fixed heuristic** — "below the last existing sibling, offset by a constant" —
  they do **not** invoke the layout engine.
- The real engine only runs when the user explicitly clicks a layout button:
  [`reorderMindmap`](../frontend/src/store/app-store.ts) is wired to the property
  panel ([property-panel.tsx](../frontend/src/components/property-panel.tsx)) and
  the context menu ([context-menu-builder.ts](../frontend/src/utils/context-menu-builder.ts)).
- The reflow is **instant** (a synchronous `setStore`) — no tween.
- The layouts are **one-sided** (`horizontal-right`, `horizontal-left`,
  `vertical-down`, `vertical-up`, `radial`). There is **no balanced** mode that
  splits top-level branches left/right around the root — Whimsical's signature
  look for large maps.

**Net:** the tree drifts as you build and only snaps clean on demand, and even then
it jumps rather than animates. This single gap — *build-time placement ≠ the layout
engine, and it never animates* — is ~80% of the perceived-quality difference.

## 4. Roadmap (highest leverage first)

### P0 — Close the feel gap (the whole game)

1. **Auto-reflow on every mutation.** Introduce a single `relayoutMindmap(rootId)`
   that runs `MindmapLayoutEngine` over the affected root and writes positions.
   Call it from add / sibling / delete / collapse / reparent. Delete the heuristic
   placement in `addChildNode` / `addSiblingNode`. Result: the tree is *always*
   clean, like Whimsical.
2. **Animate the reflow.** Reuse the existing
   [animation engine](../frontend/src/utils/animation/animation-engine.ts) (today
   used for presentations) to tween node `x`/`y` over ~180ms ease-out when layout
   changes. This is the single biggest perceived-quality jump.
3. **Balanced layout mode.** Add a `balanced` direction that splits top-level
   branches left/right of the root and packs subtrees without overlap. Make it the
   default for new maps.

### P1 — Polish that reads as "designed"

4. **Subtree packing, not row stacking.** The engine should reserve vertical space
   per *subtree* so siblings never collide when their children expand
   (tidy-tree / Reingold–Tilford). Port a tidy-tree algorithm into
   `MindmapLayoutEngine`.
5. **Curated defaults.** One restrained palette auto-assigned per branch, consistent
   spacing, a single great connector (the organic bezier we already have), a clean
   type scale. Hide the multiple node/branch styles behind an "advanced" affordance.
6. **Collapse affordance + child counts.** A "+3" badge on collapsed nodes and a
   hover "＋" to add a child by mouse.

### P2 — Delight & parity

7. **Drag-to-reparent with live preview + animated settle.** Reparent exists; add
   the ghost preview and the reflow tween.
8. **Keyboard shortcut to select the mindmap tool / drop a root** (still mouse-only —
   flagged in the keyboard-accessibility review).
9. **Smart paste:** paste an indented/bulleted list → instant subtree.

## 5. Recommended starting point

Do **P0 #1 + #2 together** — auto-reflow + animation. Smallest change, largest
payoff, and it unlocks everything else (balanced layout, tidy packing, drag preview
all become easy once the *mutate → reflow → tween* loop exists). Low risk: the
layout engine and the animation system both already exist; we are wiring them into
the edit path.

**Implementation sketch:**
- Add `relayoutMindmap(rootId)` in `app-store.ts` that builds the tree, runs the
  engine, and routes position writes through the animation engine (tween, not
  instant set).
- Call it at the end of `addChildNode`, `addSiblingNode`, delete, collapse-toggle,
  and reparent.
- Gate it behind a global setting (e.g. `mindmapAutoLayout`) so it can be toggled
  off if it ever feels intrusive — mirrors the existing stroke-stabilization toggle
  pattern.
