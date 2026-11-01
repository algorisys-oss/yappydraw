/**
 * The Morph slide transition: objects that appear on both slides move, resize, turn and change
 * colour into their new place; the rest fade out or in, and the backgrounds cross-fade.
 *
 * The show switches to the destination slide first (so the canvas underneath is already right),
 * then an overlay canvas over that slide's on-screen box draws the in-between frames from
 * `morphFrame` (utils/morph.ts) for the transition's duration, and is removed at the end. Frames
 * are drawn in true colours, as presenting always shows a page.
 */
import rough from 'roughjs/bin/rough';
import type { DrawingElement } from '../../types';
import type { Slide } from '../../types/slide-types';
import { store } from '../../store/app-store';
import { pageScene } from '../export';
import { renderElement } from '../render-element';
import { renderSlideBackground } from '../canvas-renderer';
import { morphFrame, startsHidden } from '../morph';

export interface MorphRun { done: Promise<void>; cancel: () => void }

/** The slide's box on screen, from the canvas element and the current view. */
function slideScreenRect(slide: Slide): { left: number; top: number; width: number; height: number } | null {
    const canvas = document.querySelector('canvas:not(.morph-overlay)');
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const { scale, panX, panY } = store.viewState;
    return {
        left: r.left + slide.spatialPosition.x * scale + panX,
        top: r.top + slide.spatialPosition.y * scale + panY,
        width: slide.dimensions.width * scale,
        height: slide.dimensions.height * scale,
    };
}

/**
 * Morph from slide `fromIndex` to `toIndex` over `duration` ms. `switchTo` puts the show on the
 * destination slide; it is called first, before any frame is drawn. Resolves when the overlay is
 * gone; `cancel` ends it at once (a click mid-transition).
 */
export function runMorph(fromIndex: number, toIndex: number, duration: number, switchTo: () => void): MorphRun {
    const from = store.slides[fromIndex], to = store.slides[toIndex];
    // Capture slide A as it is showing now (its build state included), before the switch.
    const a: DrawingElement[] = from ? pageScene(fromIndex) : [];
    // Slide B as it will first appear: anything waiting for a click or set to start hidden isn't there yet.
    const b: DrawingElement[] = to ? pageScene(toIndex).filter(el => !startsHidden(el)) : [];
    switchTo();

    let cancelled = false;
    let overlay: HTMLCanvasElement | null = null;
    let raf = 0;
    let finish: () => void = () => { };
    const cleanup = () => {
        cancelAnimationFrame(raf);
        overlay?.remove();
        overlay = null;
    };
    const done = new Promise<void>((resolve) => {
        finish = resolve;
        const rect = to ? slideScreenRect(to) : null;
        if (!from || !to || !rect || !(rect.width > 0 && rect.height > 0)) { resolve(); return; }
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        overlay = document.createElement('canvas');
        overlay.className = 'morph-overlay';
        overlay.width = Math.max(1, Math.round(rect.width * dpr));
        overlay.height = Math.max(1, Math.round(rect.height * dpr));
        overlay.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`
            + 'z-index:9000;pointer-events:none;';
        document.body.appendChild(overlay);
        const ctx = overlay.getContext('2d');
        if (!ctx) { cleanup(); resolve(); return; }
        const rc = rough.canvas(overlay);
        const { x: bx, y: by } = to.spatialPosition;
        const { width: bw, height: bh } = to.dimensions;
        const k = overlay.width / bw;
        const oa = from.spatialPosition, ob = to.spatialPosition;
        const start = performance.now();

        const draw = (now: number) => {
            if (cancelled || !overlay) { cleanup(); resolve(); return; }
            const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, overlay.width, overlay.height);
            ctx.setTransform(k, 0, 0, k, -bx * k, -by * k);
            ctx.save();
            ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
            // Backgrounds cross-fade: the new one underneath, the old one fading out over it.
            renderSlideBackground(ctx, rc, to, bx, by, bw, bh, 'light');
            ctx.globalAlpha = 1 - t;
            renderSlideBackground(ctx, rc, from, bx, by, bw, bh, 'light');
            ctx.globalAlpha = 1;
            for (const piece of morphFrame(a, b, oa, ob, t)) {
                if (piece.alpha <= 0.001) continue;
                const el = piece.alpha < 1 ? { ...piece.el, opacity: (piece.el.opacity ?? 100) * piece.alpha } as DrawingElement : piece.el;
                try { renderElement(rc, ctx, el, false, 1); } catch { /* skip one object rather than the frame */ }
            }
            ctx.restore();
            if (t >= 1) { cleanup(); resolve(); return; }
            raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
    });
    return { done, cancel: () => { cancelled = true; cleanup(); finish(); } };
}
