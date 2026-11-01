/**
 * Wipe, Cover, Uncover and Split slide transitions. Each needs both slides on screen at once,
 * which the view-pan transitions can't do, so — as Morph does — the show switches to the new
 * slide first and an overlay canvas over that slide's box draws the in-between frames. Both
 * slides are drawn once into bitmaps up front; a frame is just the two bitmaps clipped or moved,
 * so even a heavy slide transitions smoothly. Frames are in true colours, as presenting shows a
 * page.
 */
import rough from 'roughjs/bin/rough';
import type { DrawingElement } from '../../types';
import type { Slide } from '../../types/slide-types';
import { store } from '../../store/app-store';
import { pageScene } from '../export';
import { renderElement } from '../render-element';
import { renderSlideBackground } from '../canvas-renderer';
import { startsHidden } from '../morph';

import { compositeFrame, type CompositeSpec } from './composite-frame';
export { compositeOf, reversed, type CompositeSpec } from './composite-frame';

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

/** A slide (background and objects) drawn into a bitmap of `pw`×`ph` device pixels. */
function slideBitmap(slide: Slide | undefined, els: DrawingElement[], pw: number, ph: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = pw; c.height = ph;
    const ctx = c.getContext('2d');
    if (!ctx) return c;
    if (!slide) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, pw, ph); return c; }
    const { x, y } = slide.spatialPosition, { width: sw, height: sh } = slide.dimensions;
    const rc = rough.canvas(c);
    ctx.setTransform(pw / sw, 0, 0, ph / sh, -x * pw / sw, -y * ph / sh);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, sw, sh); ctx.clip();
    renderSlideBackground(ctx, rc, slide, x, y, sw, sh, 'light');
    for (const el of els) {
        try { renderElement(rc, ctx, el, false, 1); } catch { /* skip one object rather than the slide */ }
    }
    ctx.restore();
    return c;
}

export interface CompositeRun { done: Promise<void>; cancel: () => void }

/**
 * Play `spec` from slide `fromIndex` to `toIndex` (fromIndex −1: from a blank page). `switchTo`
 * puts the show on the destination slide; it is called first. Resolves when the overlay is gone;
 * `cancel` ends it at once.
 */
export function runComposite(spec: CompositeSpec, fromIndex: number, toIndex: number, duration: number,
    ease: (t: number) => number, switchTo: () => void): CompositeRun {
    const from = store.slides[fromIndex] as Slide | undefined, to = store.slides[toIndex] as Slide | undefined;
    // The old slide as it is showing now; the new one as it first appears (click steps not yet in).
    const a = from ? pageScene(fromIndex) : [];
    const b = to ? pageScene(toIndex).filter(el => !startsHidden(el)) : [];
    switchTo();

    let cancelled = false, raf = 0;
    let overlay: HTMLCanvasElement | null = null;
    let finish: () => void = () => { };
    const cleanup = () => { cancelAnimationFrame(raf); overlay?.remove(); overlay = null; };
    const done = new Promise<void>((resolve) => {
        finish = resolve;
        const rect = to ? slideScreenRect(to) : null;
        if (!to || !rect || !(rect.width > 0 && rect.height > 0)) { resolve(); return; }
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const pw = Math.max(1, Math.round(rect.width * dpr)), ph = Math.max(1, Math.round(rect.height * dpr));
        const oldBmp = slideBitmap(from, a, pw, ph), newBmp = slideBitmap(to, b, pw, ph);
        overlay = document.createElement('canvas');
        overlay.className = 'morph-overlay';
        overlay.width = pw; overlay.height = ph;
        overlay.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`
            + 'z-index:9000;pointer-events:none;';
        document.body.appendChild(overlay);
        const ctx = overlay.getContext('2d');
        if (!ctx) { cleanup(); resolve(); return; }
        const start = performance.now();
        const draw = (now: number) => {
            if (cancelled || !overlay) { cleanup(); resolve(); return; }
            const raw = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
            const f = compositeFrame(spec, ease(raw), pw, ph);
            ctx.clearRect(0, 0, pw, ph);
            // What a moving slide uncovers is the other slide; outside both, the page stays blank.
            const drawOld = () => ctx.drawImage(oldBmp, f.oldAt.x, f.oldAt.y);
            const drawNew = () => {
                ctx.save();
                if (f.clip) { ctx.beginPath(); for (const r of f.clip) ctx.rect(r.x, r.y, r.w, r.h); ctx.clip(); }
                ctx.drawImage(newBmp, f.newAt.x, f.newAt.y);
                ctx.restore();
            };
            if (f.newOnTop) { drawOld(); drawNew(); } else { drawNew(); drawOld(); }
            if (raw >= 1) { cleanup(); resolve(); return; }
            raf = requestAnimationFrame(draw);
        };
        draw(start);
    });
    return { done, cancel: () => { cancelled = true; cleanup(); finish(); } };
}
