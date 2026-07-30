// World ⇄ WINDOW coordinates, for overlays that paint on a `position: fixed` layer.
//
// `viewport-transforms` is the single source of truth for the world↔screen maths, but the
// "screen" it speaks is CANVAS-LOCAL px — clientX/Y minus the drawing canvas's bounding-rect
// origin. A `position: fixed; inset: 0` overlay is in WINDOW coordinates, so it must add that
// origin back. The two frames were identical while the canvas filled the window, which is why
// three overlays (symmetry axes, artboard frames, rulers/guides) each inlined a bare
// `world * scale + pan` and all three quietly drifted the moment the shell docked the toolbar
// and the top bar — the canvas now starts at (--dock-left, --dock-top), so everything they drew
// sat 46px left and 52px above the geometry it was annotating.
//
// Read the origin from the canvas ELEMENT rather than the CSS variables, so this tracks exactly
// what the pointer path uses (`getWorldCoordinates` subtracts this same rect).

import { createSignal } from 'solid-js';
import { store } from '../store/app-store';
import { dockInsets } from './dock-layout';
import { worldToScreen, screenToWorld, type Viewport } from './viewport-transforms';
import type { Point } from '../types';

// The canvas origin moves for reasons no store field records: a window resize, and — the one
// that bites — the canvas simply not existing yet. Overlays mount first, so their first read
// gets the {0,0} fallback; without a nudge when the canvas appears, anything that positioned
// itself in that first pass (ruler strips, the corner box) stays pinned at the window origin
// forever, which looks exactly like the bug this module exists to fix.
const [layoutTick, setLayoutTick] = createSignal(0);
if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => setLayoutTick(t => t + 1));
}

const canvasEl = (): HTMLCanvasElement | null =>
    document.querySelector('.canvas-drop-zone canvas') as HTMLCanvasElement | null;

let observed: HTMLCanvasElement | null = null;
let ro: ResizeObserver | null = null;
/**
 * Watch the canvas for geometry changes, re-arming if it is replaced. Called from the readers
 * below, since there is no mount hook here to hang it on.
 *
 * The tick is bumped on the NEXT frame, never synchronously: these readers run during render,
 * and updating a signal they depend on inside that render is a loop. Deferring gives one extra
 * render once the canvas shows up, then it is stable (`observed === c` short-circuits).
 */
function ensureObserver(c: HTMLCanvasElement | null): void {
    if (!c || c === observed) return;
    observed = c;
    ro?.disconnect();
    ro = new ResizeObserver(() => setLayoutTick(t => t + 1));
    ro.observe(c);
    requestAnimationFrame(() => setLayoutTick(t => t + 1));
}

/**
 * The drawing canvas's top-left corner in window px — i.e. the offset between canvas-local and
 * window coordinates.
 *
 * Deliberately NOT memoized. Overlays mount before the canvas is laid out, so a `createMemo`
 * caches the {0,0} fallback on its first read and never recomputes (the symmetry state and the
 * viewport are not among its dependencies) — silently reproducing the very bug this exists to
 * prevent. Calling `resizeTick()`/`dockInsets()` still subscribes the caller to resize and dock
 * changes; the rect itself is measured fresh, which costs nothing at overlay scale.
 */
export function canvasOrigin(): Point {
    layoutTick();
    dockInsets();
    const c = canvasEl();
    ensureObserver(c);
    const r = c?.getBoundingClientRect();
    return { x: r?.left ?? 0, y: r?.top ?? 0 };
}

/** The canvas's size in CSS px (its own rect), for overlays that must span exactly the canvas. */
export function canvasSize(): { w: number; h: number } {
    layoutTick();
    dockInsets();
    const c = canvasEl();
    ensureObserver(c);
    const r = c?.getBoundingClientRect();
    return { w: r?.width ?? window.innerWidth, h: r?.height ?? window.innerHeight };
}

/** The same viewport transform the canvas renders with, rotation included. */
export function overlayViewport(): Viewport {
    const c = canvasEl();
    return {
        scale: store.viewState.scale,
        panX: store.viewState.panX,
        panY: store.viewState.panY,
        rotation: store.viewState.rotation,
        centerX: c ? c.width / 2 : 0,
        centerY: c ? c.height / 2 : 0,
    };
}

/** World → window px. Handles view rotation. */
export function worldToWindow(wx: number, wy: number): Point {
    const s = worldToScreen(wx, wy, overlayViewport());
    const o = canvasOrigin();
    return { x: s.x + o.x, y: s.y + o.y };
}

/** Window px (e.g. `e.clientX/Y`) → world. Inverse of `worldToWindow`. */
export function windowToWorld(x: number, y: number): Point {
    const o = canvasOrigin();
    return screenToWorld(x - o.x, y - o.y, overlayViewport());
}

/**
 * Axis-aligned variants for overlays that deliberately ignore view rotation: artboard frames and
 * rulers are drawn as axis-aligned boxes/strips, which cannot represent a rotated view anyway.
 * They still need the origin, which is the part that was missing.
 */
export function worldToWindowAxisX(wx: number): number {
    return wx * store.viewState.scale + store.viewState.panX + canvasOrigin().x;
}
export function worldToWindowAxisY(wy: number): number {
    return wy * store.viewState.scale + store.viewState.panY + canvasOrigin().y;
}
export function windowToWorldAxisX(x: number): number {
    return (x - canvasOrigin().x - store.viewState.panX) / store.viewState.scale;
}
export function windowToWorldAxisY(y: number): number {
    return (y - canvasOrigin().y - store.viewState.panY) / store.viewState.scale;
}
