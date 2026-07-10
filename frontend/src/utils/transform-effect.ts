/**
 * Live "Transform effect" — Illustrator's Effect ▸ Distort & Transform ▸ Transform.
 *
 * A non-destructive modifier (`el.transformEffect`) that draws `copies` accumulating ghost
 * copies of an element at render time. Copy k (1..copies) has the single-step transform
 * applied k times, so a per-step rotate/move/scale builds spirals, echoes, and radial fans.
 *
 * Implementation strategy (see the architecture map): rather than push a canvas matrix, we
 * generate CLONE elements with mutated `x/y/angle/renderScale/flipX/flipY`, exactly the fields
 * `RenderPipeline.applyTransformations` already reads. Re-entering `renderElement` on each clone
 * then reproduces the full element — stroke + fill + appearance + shadow — in BOTH render styles
 * (sketch + architectural) with zero per-shape code. The SAME clone list feeds the live renderer
 * (transient) and Expand (baked into real elements).
 *
 * Scope (first cut): move + rotate + UNIFORM scale + reflect. Non-uniform scale and
 * reflect-combined-with-rotate are follow-ups (they need width/height mutation / angle handling).
 */
import type { DrawingElement, TransformEffect } from "../types";

/** Clamp copies so a runaway value can't lock the render loop. */
export function effectiveCopies(fx?: TransformEffect): number {
    if (!fx) return 0;
    return Math.max(0, Math.min(200, Math.round(fx.copies || 0)));
}

/** True when the effect actually produces copies worth rendering. */
export function hasTransformEffect(el: DrawingElement): boolean {
    return !!el.transformEffect && effectiveCopies(el.transformEffect) > 0;
}

const rotatePt = (x: number, y: number, cx: number, cy: number, rad: number) => {
    const cos = Math.cos(rad), sin = Math.sin(rad), dx = x - cx, dy = y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
};

/**
 * Build a clone of `el` with the single-step transform applied `k` times, about the effect's
 * pivot (a bbox fraction, default centre). `transformEffect` is stripped so re-rendering the
 * clone doesn't recurse. `idSuffix` keeps clone ids distinct (render cache / element ids).
 */
export function transformCopy(el: DrawingElement, fx: TransformEffect, k: number, idSuffix: string): DrawingElement {
    const px = el.x + el.width * (fx.originX ?? 0.5);
    const py = el.y + el.height * (fx.originY ?? 0.5);
    const theta = ((fx.rotate ?? 0) * Math.PI) / 180;
    const s = fx.scaleX ?? 1;                    // uniform (scaleY reserved for a later pass)
    const moveX = fx.moveX ?? 0, moveY = fx.moveY ?? 0;

    let cx = el.x + el.width / 2, cy = el.y + el.height / 2;
    let ang = el.angle || 0;
    let sc = el.renderScale ?? 1;
    let fX = !!el.flipX, fY = !!el.flipY;

    for (let i = 0; i < k; i++) {
        // move (world axes), then rotate + scale about the pivot
        cx += moveX; cy += moveY;
        const r = rotatePt(cx, cy, px, py, theta);
        cx = r.x; cy = r.y;
        ang += fx.rotate ?? 0;
        cx = px + (cx - px) * s; cy = py + (cy - py) * s;
        sc *= s;
        if (fx.reflectX) { cx = 2 * px - cx; fX = !fX; }
        if (fx.reflectY) { cy = 2 * py - cy; fY = !fY; }
    }

    const { transformEffect, ...rest } = el;
    return {
        ...rest,
        id: `${el.id}${idSuffix}`,
        x: cx - el.width / 2,
        y: cy - el.height / 2,
        angle: ang,
        renderScale: sc,
        flipX: fX,
        flipY: fY,
    } as DrawingElement;
}

/**
 * The full render list for an element with a transform effect: copy 0 (the element itself,
 * effect stripped) plus copies 1..N. Draw them in order so later copies stack in front
 * (Illustrator adds copies to the front). Returns [] when there's no effect.
 */
export function transformEffectRenderCopies(el: DrawingElement): DrawingElement[] {
    const fx = el.transformEffect;
    const n = effectiveCopies(fx);
    if (!fx || n === 0) return [];
    const out: DrawingElement[] = [];
    // base first (bottom), then accumulating copies on top
    const { transformEffect, ...base } = el;
    out.push({ ...base, id: `${el.id}~te0` } as DrawingElement);
    for (let k = 1; k <= n; k++) out.push(transformCopy(el, fx, k, `~te${k}`));
    return out;
}
