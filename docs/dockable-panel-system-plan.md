# Dockable Panel System — Scoping Plan

> **Status:** **Phases A, B, C, E SHIPPED; D (migrate the 18 existing panels) remains.**
> - **A** (v0.8.55): `store/dock-layout.ts` store (docked left/right / floating / hidden, persisted),
>   shared `components/dock/` chrome + container, panel registry, pilot **Effects** panel.
> - **B** (v0.8.57): **drag-to-dock** — grab a panel's title bar, a docked panel tears out into a
>   floating one and follows the cursor, live left/right **drop indicators** light up near the edges,
>   release over an edge docks it. Opaque zones keep the canvas hit-area protected (no draw-under).
> - **C** (v0.8.57): two more dock-native panels (**Align & Distribute**, **Arrange**) so the dock is
>   genuinely multi-panel; **reorder within a zone** (drop between siblings by pointer Y);
>   resize/collapse/persistence already worked; **Reset Dock Layout** + per-panel open via ⌘K.
> - **E** (v0.8.57): phones fall back to a bottom sheet lifted clear of the bottom toolbar.
> - **D (in progress):** migrate the ~15 *existing* panels onto the shared chrome/registry, 2–3 at a
>   time. **Done (v0.8.58):** **History** + **Swatches**. **Done (v0.8.59):** **Graphic Styles** +
>   **Patterns** + **Symbols** — same recipe; each panel's single header action (Save style / Capture /
>   Create symbol) moved into an in-body toolbar. **Done (v0.8.60):** **Recolor** + **Brand Kit** +
>   **Elements** — same recipe; Brand Kit's two "new kit" actions moved into an in-body toolbar, and the
>   two internal reads of the old `showXxxPanel` flags (Brand Kit's kit-list memo, Elements' heavy
>   lucide lazy-load) were rewired to `isPanelOpen(id)` so they still fire on open. **Done (v0.8.61):**
>   **Display States** + **Behaviors** + **Stick Figures** — State had its own custom drag (stripped) and
>   heavily `.state-panel`-scoped CSS with generic child names (kept the wrapper class on the body root,
>   just neutralized its `position:fixed`); Behaviors' `GameViewSwitcher` + Play moved to an in-body
>   `.bp-toolbar` (re-scoped the 2 `.behaviors-panel .gvs-btn` rules). **Grep for EXTERNAL reads too:**
>   toolbar's stick-figure button (`active` highlight) and the on-canvas game-mode-bar (visibility +
>   current-view) both read the old flags and were rewired to `isPanelOpen(id)`. **Done (v0.8.62):**
>   **Vector Tools** — dropped its bespoke `setupPanel` (drag + localStorage resize persistence; the dock
>   owns both now) and its manual `showVectorToolsPanel` localStorage flag; toolbar's Vector-Tools button
>   `active` highlight rewired to `isPanelOpen('vectorTools')`. **Scope correction:** the earlier
>   "remaining" list named `animation`, `ds-ops`, `scene-timeline` as if dockable, but they are NOT
>   standalone dockable panels — `animation-panel` is embedded inside the property panel (migrates with
>   it), `ds-ops-panel` is a presentation-mode contextual overlay (gated on `appMode==='presentation'`,
>   no toggle), and `scene-timeline` is a full-width fixed BOTTOM bar that doesn't fit a narrow left/right
>   dock. So the only remaining true dock candidates are **property** + **layers** (the coupled finale).
>   All refactored to render body-only, registered
>   in `panel-registry`, and their `toggleXxxPanel` actions bridged to the dock via
>   `dock-layout.setPanelOpen()` so every existing entry point (toolbar/menu/hotkey/API) now opens the
>   *dockable* version (menu checkmarks read `isPanelOpen(id)`; legacy floating mounts removed).
>   **Migration recipe (repeat per panel):** (1) strip the outer container/header/drag → export the
>   body only; move any header actions into an in-body toolbar; (2) add to `PANEL_REGISTRY`; (3) point
>   `toggleXxxPanel` → `setPanelOpen('id', visible)`; (4) update the menu checkmark to `isPanelOpen`;
>   (5) delete the standalone `<XxxPanel/>` mount + lazy import from `app.tsx`. **Done (v0.8.63):**
>   **Layers** — dropped its bespoke minimize subsystem (`isLayerPanelMinimized` + minimize/expand
>   buttons + `.minimized` class + body `<Show>` guards; the dock's collapse replaces it), moved
>   Groups/New-Group/Add-Layer into an in-body `.layer-toolbar`, and rewired the external `\` hotkey
>   (toggles Property+Layers together) from `store.showLayerPanel` → `isPanelOpen('layers')`. Left the
>   `setStore("showLayerPanel", false)` writes in player-app/embed-viewer as inert (NOT `setPanelOpen`,
>   which would flip the persisted dock layout the editor shares). **Property — intentionally NOT migrated
>   (decision 2026-07-10).** Property is a *contextual auto-managed inspector*, not a user-parked panel:
>   its visibility is written from ~20 call sites (every tool-group + `setSelectedTool` auto-open it on
>   tool/selection), it auto-HIDES when nothing is selected (`showPropertyPanel && (activeTarget() ||
>   isPropertyPanelMinimized)`), and its open state drives fixed-width layout math elsewhere
>   (`menu.propPanelOffset()` = 290px; `quick-toolbar` positioning). Forcing it into the user-parked dock
>   model would touch ~20 files, break the auto-hide-on-deselect UX, and invalidate the 290px offsets —
>   making a contextual inspector strictly worse. So Property stays as the contextual right-side panel.
>   **Phase D is therefore complete: 13 existing panels migrated onto the dock (History, Swatches,
>   Graphic Styles, Patterns, Symbols, Recolor, Brand Kit, Elements, Display States, Behaviors, Stick
>   Figures, Vector Tools, Layers), alongside the 3 dock-native panels (Effects, Align, Arrange);
>   Property deliberately excluded.**
>   (`animation` is embedded in property; `ds-ops` is a presentation-mode overlay; `scene-timeline` is a
>   bottom bar — none are standalone dock candidates either.)
>
> This closes Yappy's remaining UX gap vs Illustrator: advanced panels become *persistently
> dockable/browsable*, not just *invoke-and-go*. **Date:** 2026-07-10. Complexity: **L–XL**.

## 1. Goal

Any panel (and ideally the main toolbar) can be **docked to the left or right edge** in a stack,
**floated** anywhere, **collapsed**, and **resized** — like Krita's dockers or Illustrator's panel
docks — with the layout **persisted** across reloads and a **Reset Layout** action. On phones it
falls back to the current overlay/bottom-sheet behaviour.

## 2. Current state (validated against the code)

- **~18 panels** exist as independent components in `frontend/src/components/`:
  `property-panel`, `layer-panel`, `swatches-panel`, `history-panel`, `symbols-panel`,
  `graphic-styles-panel`, `patterns-panel`, `recolor-panel`, `brand-kit-panel`, `elements-panel`,
  `state-panel`, `animation-panel`, `behaviors-panel`, `stick-figure-panel`, `ds-ops-panel`,
  `vector-tools-panel`, plus toolbars (`toolbar`, `quick-toolbar`, `canvas-toolbar`,
  `slide-control-toolbar`).
- **Many are already individually draggable** (each re-implements its own drag + clamp-into-view).
  There is **no shared panel chrome** and **no docking** — they float independently and overlap.
- **Visibility** persists in `store.globalSettings` (`showPropertyPanel`, `showLayerPanel`,
  `showSwatchesPanel`, `showVectorToolsPanel`, …) + some `localStorage` keys. **Position/size do NOT
  persist** (reset each load).
- The **canvas hit-area is full-window**; the property panel currently just overlays the right edge
  (other UI shifts via `propPanelOffset()` in a couple of spots — e.g. the palette/theme icons).

**Implication:** the hard part isn't drag (exists) — it's (a) a **shared docking model + chrome**,
(b) **reserving canvas space** for docked zones, and (c) **migrating 18 panels** onto it.

## 3. Docking model

A single source of truth — a `dockLayout` slice on the store (persisted):

```ts
type PanelId = 'property' | 'layers' | 'swatches' | 'history' | 'symbols' | 'vectorTools' | …;
type DockZone = 'left' | 'right';        // v1: edges only. (top/bottom = later)
interface PanelDockState {
  mode: 'docked' | 'floating' | 'hidden';
  zone?: DockZone;                        // when docked
  order?: number;                         // position within the zone stack
  floatX?: number; floatY?: number;       // when floating
  width?: number;                         // docked-zone width / floating width
  height?: number;                        // floating height
  collapsed?: boolean;                    // title-bar-only
}
interface DockLayout { panels: Record<PanelId, PanelDockState>; leftWidth: number; rightWidth: number; }
```

- **Zones** are the left and right edges; each holds an **ordered stack** of docked panels (their
  heights auto-flow or are user-resized). A zone can be collapsed/resized as a whole.
- **Floating** = the current behaviour (free x/y), but via shared chrome.
- Persist `dockLayout` to `localStorage` (mirrors how `toolbarVertical` etc. persist); expose a
  **Reset Layout** command.

## 4. Architecture

1. **`store/dock-layout.ts`** — the `dockLayout` state + actions: `dockPanel(id, zone, order)`,
   `floatPanel(id, x, y)`, `hidePanel(id)`, `resizeZone(zone, w)`, `reorderInZone`, `resetLayout()`,
   load/save to localStorage. (Reuse the existing `showXxxPanel` flags as the `hidden` mode, or
   fold them in.)
2. **`components/dock/PanelChrome.tsx`** — ONE shared wrapper: title bar (drag handle, collapse,
   close, float/dock toggle) + body slot. Every panel is wrapped in this instead of its own
   ad-hoc header/drag. This **removes ~18 copies of drag/clamp logic** (big cleanup win).
3. **`components/dock/DockZone.tsx`** — renders one edge zone: a resizable column stacking the
   docked panels' `PanelChrome`, with drag-reorder within the stack.
4. **`components/dock/DockOverlay.tsx`** — drag-to-dock: while dragging a `PanelChrome` title bar,
   show **drop indicators** near the left/right edges; on release near an edge → `dockPanel`.
5. **Canvas offset** — the app shell reserves `dockLayout.leftWidth` / `rightWidth` so the canvas
   (and its pointer hit-area) starts inside the docks, not under them. Generalise the existing
   `propPanelOffset()` into a shared `layoutInsets()` used by the canvas viewport + floating UI.
6. **Registry** — a small `PANEL_REGISTRY: { id, title, icon, component }[]` so a Window/Panels
   menu can toggle any panel and the dock system can render them generically.

## 5. Phased plan (each independently shippable)

- **Phase A — Shared chrome + registry (no behaviour change).** Introduce `PanelChrome` +
  `PANEL_REGISTRY` + `dockLayout` store (all panels start `floating`, matching today). Migrate 2–3
  panels (property, layers, swatches) to the chrome. Verify nothing regresses.
- **Phase B — Left/right dock zones + drag-to-dock.** `DockZone` + `DockOverlay` drop indicators;
  drag a panel to an edge → it docks; canvas offsets by zone width. Reserve space; fix hit-area.
- **Phase C — Resize / collapse / reorder + persistence + Reset Layout.** Resize zones and floating
  panels, collapse to title bar, reorder within a stack; persist `dockLayout`; add a **Reset
  Layout** command + a **Window ▸ Panels** menu to toggle any panel.
- **Phase D — Migrate the rest.** Move the remaining ~15 panels + (optionally) the main toolbar and
  quick-toolbar onto the chrome/registry.
- **Phase E — Responsive.** On narrow/touch, ignore docking and fall back to the current
  overlay/bottom-sheet; docked layout only applies ≥ a breakpoint.

## 6. Reuse (don't rebuild)

| Need | Reuse |
|---|---|
| Drag + clamp-into-view | the per-panel drag logic already in `*-panel.tsx` — consolidate into `PanelChrome` |
| Visibility persistence | `store.globalSettings.showXxxPanel` + the `localStorage` pattern (`toolbarVertical`) |
| Canvas inset precedent | `propPanelOffset()` (generalise to `layoutInsets()`) |
| Panel registry precedent | the command-registry pattern (`utils/command-registry.ts`) |

## 7. Risks / decisions to settle

- **Migrating 18 panels** is the bulk of the work — do it incrementally (Phase A/D), 2–3 at a time,
  regression-checking each. A shared chrome makes each migration small but there are many.
- **Canvas pointer hit-area** must not extend under docked zones (offset the viewport + snapping).
  This is the subtlest correctness bug — test drawing right up to a dock edge.
- **z-index / focus** across floating + docked + dialogs + the command palette.
- **Mobile** — docking must degrade cleanly; keep the current overlay behaviour under a breakpoint.
- **Performance** — resizing a zone should not re-layout the whole canvas each frame (debounce /
  CSS grid).
- **Scope guard for v1:** left/right edges only (no top/bottom, no tabbed panel groups) — add later.

## 8. Effort estimate

- Phase A (chrome + store + 3 panels): **~2 days.**
- Phase B (dock zones + drag-to-dock + canvas offset): **~2–3 days.**
- Phase C (resize/collapse/reorder + persistence + Reset + Panels menu): **~2 days.**
- Phase D (migrate remaining ~15 panels): **~2–3 days** (mechanical but broad).
- Phase E (responsive): **~1 day.**
- **Total ≈ 9–11 days.** Ships value incrementally after Phase B (docking usable).

## 9. Definition of done

Any registered panel can be dragged to the left/right edge to dock into a resizable stack, floated
back out, collapsed, and reordered; the layout survives reload; **Reset Layout** restores defaults;
the canvas never draws under a dock; phones keep the current overlay behaviour. This brings panel
**browsability** to Illustrator/Krita parity — the last accessibility gap identified in the UX review.
