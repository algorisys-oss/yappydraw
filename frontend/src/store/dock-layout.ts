/**
 * Dockable-panel layout — the single source of truth for where each registered panel lives:
 * docked to the left/right edge (in an ordered stack), floating (free x/y), or hidden. Persisted
 * to localStorage. Phase A of the dockable-panel system (see docs/dockable-panel-system-plan.md);
 * kept as its own small store so it's decoupled from the giant app-store and low-risk.
 */
import { createStore } from "solid-js/store";

export type DockZone = 'left' | 'right';

export interface PanelDockState {
    mode: 'floating' | 'docked' | 'hidden';
    zone?: DockZone;
    order?: number;
    floatX?: number;
    floatY?: number;
    collapsed?: boolean;
}

export interface DockLayout {
    panels: Record<string, PanelDockState>;
    leftWidth: number;
    rightWidth: number;
}

const KEY = 'yappy.dockLayout';
const DEFAULTS: DockLayout = { panels: {}, leftWidth: 280, rightWidth: 300 };

function load(): DockLayout {
    try {
        const s = localStorage.getItem(KEY);
        if (s) return { ...DEFAULTS, ...JSON.parse(s) };
    } catch { /* ignore */ }
    return { ...DEFAULTS };
}

const [dockLayout, setDockLayout] = createStore<DockLayout>(load());
export { dockLayout };

function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(dockLayout)); } catch { /* ignore */ }
}

export function panelState(id: string): PanelDockState {
    return dockLayout.panels[id] ?? { mode: 'hidden' };
}
export function isPanelOpen(id: string): boolean {
    return panelState(id).mode !== 'hidden';
}

// Default open position for a floating panel that has no saved position yet. floatX clears the
// slide-navigator, a `position: fixed` 240px-wide left column (z-index 1000) whose list area
// intercepts pointer events over anything beneath it — floating panels are only z-index 45, so a
// panel opened further left (the old 140) had its left edge buried and unclickable on paged/game
// docs where the navigator is shown. 260 = 240px navigator + a small gap.
const DEFAULT_FLOAT_X = 260;
const DEFAULT_FLOAT_Y = 120;

/** Show a panel (docked or floating). Toggling an already-open panel hides it. */
export function togglePanel(id: string, mode: 'floating' | 'docked' = 'floating') {
    const cur = panelState(id);
    if (cur.mode !== 'hidden') return hidePanel(id);
    setDockLayout('panels', id, (p) => ({
        floatX: DEFAULT_FLOAT_X, floatY: DEFAULT_FLOAT_Y, ...(p || {}),
        mode,
        ...(mode === 'docked' && !p?.zone ? { zone: 'right' as DockZone } : {}),
    }));
    persist();
}

export function hidePanel(id: string) {
    setDockLayout('panels', id, 'mode', 'hidden');
    persist();
}

/**
 * Open/close a panel explicitly (visible omitted = toggle). Bridge used by the legacy
 * `toggleXxxPanel` app-store actions as their panels migrate onto the dock (Phase D), so the
 * existing toolbar/menu/hotkey/API entry points keep working while the dock owns the rendering.
 */
export function setPanelOpen(id: string, visible?: boolean, mode: 'floating' | 'docked' = 'floating') {
    const open = isPanelOpen(id);
    const want = visible ?? !open;
    if (want && !open) togglePanel(id, mode); // hidden → shows it
    else if (!want && open) hidePanel(id);
}

export function dockPanel(id: string, zone: DockZone, order?: number) {
    setDockLayout('panels', id, (p) => ({
        floatX: 140, floatY: 120, ...(p || {}),
        mode: 'docked' as const, zone,
        order: order ?? p?.order ?? Object.keys(dockLayout.panels).length,
    }));
    persist();
}

/** Dock `id` into `zone` at a specific slot, renumbering the zone's stack so the order sticks. */
export function dockPanelAt(id: string, zone: DockZone, index: number) {
    const others = dockedPanels(zone).filter((x) => x !== id);
    const ordered = [...others];
    ordered.splice(Math.max(0, Math.min(index, ordered.length)), 0, id);
    ordered.forEach((pid, i) => {
        setDockLayout('panels', pid, (p) => ({
            floatX: 140, floatY: 120, ...(p || {}),
            mode: 'docked' as const, zone, order: i,
        }));
    });
    persist();
}

export function floatPanel(id: string, x?: number, y?: number) {
    setDockLayout('panels', id, (p) => ({
        ...(p || {}),
        mode: 'floating' as const,
        floatX: x ?? p?.floatX ?? 140,
        floatY: y ?? p?.floatY ?? 120,
    }));
    persist();
}

export function setFloatPos(id: string, x: number, y: number) {
    setDockLayout('panels', id, (p) => ({ ...(p || { mode: 'floating' as const }), floatX: x, floatY: y }));
    persist();
}

export function toggleCollapse(id: string) {
    setDockLayout('panels', id, 'collapsed', (c) => !c);
    persist();
}

export function setZoneWidth(zone: DockZone, w: number) {
    setDockLayout(zone === 'left' ? 'leftWidth' : 'rightWidth', Math.max(200, Math.min(560, Math.round(w))));
    persist();
}

export function resetDockLayout() {
    setDockLayout({ panels: {}, leftWidth: 280, rightWidth: 300 });
    persist();
}

/** Ordered ids of the panels currently docked in a zone. */
export function dockedPanels(zone: DockZone): string[] {
    return Object.entries(dockLayout.panels)
        .filter(([, s]) => s.mode === 'docked' && s.zone === zone)
        .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
        .map(([id]) => id);
}

/** Canvas insets reserved by non-empty dock zones (so drawing never happens under a dock). */
export function layoutInsets(): { left: number; right: number } {
    return {
        left: dockedPanels('left').length ? dockLayout.leftWidth : 0,
        right: dockedPanels('right').length ? dockLayout.rightWidth : 0,
    };
}
