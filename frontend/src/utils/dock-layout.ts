/**
 * dock-layout — where the canvas actually lives.
 *
 * Historically the canvas was sized to the whole window and every panel floated on top
 * of it, so the real drawing area was "whatever the chrome happens not to be covering".
 * A docked toolbar instead *reserves* its edge, and the canvas occupies what is left.
 *
 * This is the single source of truth for that rectangle. It composes the dockable-panel
 * widths from `store/dock-layout.ts` (which owns per-panel placement) with the fixed
 * chrome — toolbar edge, top bar, status bar, property panel. Note the two files share a
 * name: `store/dock-layout` is WHERE EACH PANEL LIVES, this one is HOW MUCH SPACE THE
 * CHROME TAKES. Anything that used to reach for
 * `window.innerWidth/innerHeight` to mean "the drawing area" — canvas sizing, zoom-to-fit,
 * zoom-about-centre, "drop the guide where the user is looking" — should read it here, so
 * those all stay honest as more panels become dockable.
 *
 * Pointer→world conversion needs no changes: `getWorldCoordinates` already subtracts the
 * canvas's own bounding rect, and the view transforms are defined in canvas-local pixels.
 */

import { store } from '../store/app-store';
import { layoutInsets } from '../store/dock-layout';

/** Thickness of the docked main toolbar, in CSS px. Matches --dock-size in the CSS. */
export const TOOLBAR_DOCK_SIZE = 46;
/** Status bar height — permanent bottom chrome. Matches .status-bar in status-bar.css. */
export const STATUS_BAR_H = 28;
/** Shell top bar height — holds the logo/menu and (next) the contextual tool options. */
export const TOP_BAR_H = 52; // sized to the header pill (~42px) plus breathing room

export interface Insets { left: number; right: number; top: number; bottom: number }
export interface Rect { x: number; y: number; width: number; height: number }

/** Space reserved by docked chrome on each edge. */
export function dockInsets(): Insets {
    const out: Insets = { left: 0, right: 0, top: 0, bottom: 0 };
    // Mobile keeps the old full-bleed overlay: there isn't room to give an edge away.
    const narrow = typeof window !== 'undefined' && window.innerWidth < 700;

    // Top: the shell header bar. Hidden in Zen and Presentation, which are deliberately
    // chrome-free, so it reserves nothing there.
    const chromeless = store.zenMode || store.appMode === 'presentation';
    if (!narrow && !chromeless) out.top += TOP_BAR_H;

    // Bottom: the status bar is permanent chrome. The canvas used to be sized to the
    // whole window and simply drew underneath it — 28px of the drawing surface was
    // always occluded.
    out.bottom += STATUS_BAR_H;

    // The main toolbar's edge, when docked.
    const dock = store.globalSettings.toolbarDock ?? 'left';
    if (dock !== 'float' && !narrow) out[dock] += TOOLBAR_DOCK_SIZE;

    // Dockable panels (store/dock-layout.ts) already computed their own reserved widths
    // in layoutInsets(), but nothing consumed them — Phase A groundwork that was never
    // wired to the canvas. Fold them in here so there is ONE inset model rather than two.
    if (!narrow) {
        const panels = layoutInsets();
        out.left += panels.left;
        out.right += panels.right;
    }

    // The property panel used to be special-cased here with its own fixed 280px right inset.
    // It is now a registered dock panel like any other, so its width is already in
    // layoutInsets() above — and, unlike the old hard-coded number, that follows the user
    // when they resize the zone, dock it left, or float it.

    return out;
}

/** The canvas rectangle: the window minus everything docked. */
export function canvasViewport(): Rect {
    const i = dockInsets();
    const w = typeof window !== 'undefined' ? window.innerWidth : 0;
    const h = typeof window !== 'undefined' ? window.innerHeight : 0;
    return {
        x: i.left,
        y: i.top,
        width: Math.max(1, w - i.left - i.right),
        height: Math.max(1, h - i.top - i.bottom),
    };
}

/**
 * Centre of the drawing area in *client* coordinates — what "the middle of the screen"
 * should mean for zoom-about-centre and for dropping a guide where the user is looking.
 * With a left dock this is not the window centre.
 */
export function canvasCenterClient(): { x: number; y: number } {
    const r = canvasViewport();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/**
 * Mirror the insets onto :root as `--dock-left/right/top/bottom`.
 *
 * Chrome that is `position: fixed` to the window (the menu, the status bar, the corner
 * action buttons) can then stay declarative — it offsets itself in CSS instead of every
 * component growing its own dependency on the dock state. Called whenever the layout
 * changes; harmless to call repeatedly.
 */
export function publishDockVars(): void {
    if (typeof document === 'undefined') return;
    const i = dockInsets();
    const r = document.documentElement.style;
    r.setProperty('--dock-left', `${i.left}px`);
    r.setProperty('--dock-right', `${i.right}px`);
    r.setProperty('--dock-top', `${i.top}px`);
    r.setProperty('--dock-bottom', `${i.bottom}px`);
    // Published separately: side docks stop above the status bar, and need its height
    // rather than the whole bottom inset (which may include more chrome later).
    r.setProperty('--statusbar-h', `${STATUS_BAR_H}px`);
    r.setProperty('--topbar-h', `${TOP_BAR_H}px`);
    // The TOOLBAR's own edge contribution, separate from the totals above. Panel dock
    // zones need this rather than --dock-left/right: those already include the panel
    // widths, so a zone offsetting by them would push itself off by its own size. Without
    // it the zone starts at the window edge, lands under the tool column, and leaves a
    // gap the width of the panel between itself and the canvas.
    const dock = store.globalSettings.toolbarDock ?? 'left';
    const narrow = window.innerWidth < 700;
    const bar = (edge: string) => (!narrow && dock === edge ? TOOLBAR_DOCK_SIZE : 0);
    r.setProperty('--toolbar-left', `${bar('left')}px`);
    r.setProperty('--toolbar-right', `${bar('right')}px`);
    r.setProperty('--toolbar-top', `${bar('top')}px`);
}
