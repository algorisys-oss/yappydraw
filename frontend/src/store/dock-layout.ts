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

/**
 * Keep a floating panel's title bar reachable.
 *
 * A panel is moved by its title bar and by nothing else, so a position that puts that bar
 * off-screen makes the panel permanently unmovable — and a panel you cannot move is
 * indistinguishable from a panel that was never movable. There are two ways to get there:
 * dragging it past an edge, and shrinking the window under a panel parked near one.
 *
 * The clamp is deliberately generous on the horizontal axis: a panel may hang off the right
 * so long as `KEEP_VISIBLE` of it remains, because that is a legitimate place to park one.
 * What it may never do is go above the top or start past the right edge.
 */
const KEEP_VISIBLE = 140;   // px of title bar that must stay on screen
const TITLE_H = 34;

/**
 * The top of the app chrome, below which a floating panel must stay.
 *
 * `y >= 0` is not enough: the top bar is opaque and sits above floating panels, so a panel
 * at y=0 has its title bar hidden *behind* it — visible page, unreachable handle. The dock
 * zones already offset themselves by this same `--topbar-h`, so read it rather than
 * repeating the number.
 */
function topChromeHeight(): number {
    if (typeof document === 'undefined') return 52;
    const read = (name: string) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    // Read, not imported: `utils/dock-layout` pulls in the main app store, and this small
    // store is deliberately free of that dependency. Zero is a legitimate value (Zen and
    // Presentation have no header), so only a missing/NaN var falls back.
    const top = read('--topbar-h');
    return Number.isFinite(top) && top >= 0 ? top : 52;
}

function clampFloat(x: number, y: number): { x: number; y: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const minY = topChromeHeight();
    return {
        x: Math.round(Math.max(0, Math.min(x, Math.max(0, vw - KEEP_VISIBLE)))),
        y: Math.round(Math.max(minY, Math.min(y, Math.max(minY, vh - TITLE_H)))),
    };
}

export function floatPanel(id: string, x?: number, y?: number) {
    setDockLayout('panels', id, (p) => {
        const at = clampFloat(x ?? p?.floatX ?? 140, y ?? p?.floatY ?? 120);
        return { ...(p || {}), mode: 'floating' as const, floatX: at.x, floatY: at.y };
    });
    persist();
}

export function setFloatPos(id: string, x: number, y: number) {
    const at = clampFloat(x, y);
    setDockLayout('panels', id, (p) => ({ ...(p || { mode: 'floating' as const }), floatX: at.x, floatY: at.y }));
    persist();
}

/** Pull every floating panel back into view — for a window resize, which can strand one. */
export function clampFloatingPanels() {
    let changed = false;
    for (const [id, st] of Object.entries(dockLayout.panels)) {
        if (st.mode !== 'floating') continue;
        const at = clampFloat(st.floatX ?? 140, st.floatY ?? 120);
        if (at.x !== st.floatX || at.y !== st.floatY) {
            setDockLayout('panels', id, (p) => ({ ...(p!), floatX: at.x, floatY: at.y }));
            changed = true;
        }
    }
    if (changed) persist();
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
