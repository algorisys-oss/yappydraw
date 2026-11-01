/**
 * Morph between slides: which objects on two consecutive slides are "the same thing", and what
 * one of them looks like part-way through the move. Pure — no store, no DOM — so it unit-tests
 * under bun; utils/animation/morph-transition.ts draws the frames.
 *
 * The matching order follows DeckCraft's `morph_pairs` (crates/anim/src/morph.rs):
 *   1. names starting `!!` (PowerPoint's way to force a match),
 *   2. equal non-empty names,
 *   3. same type and equal non-empty text,
 *   4. same type, both without text.
 * Where several objects qualify, the nearest one (position and size on the slide) wins, so
 * "duplicate the slide and move things" pairs every object with its own copy.
 *
 * Adapted from DeckCraft — Copyright (c) 2026 ArtCraft Team and the DeckCraft contributors,
 * MIT License (see THIRD_PARTY_NOTICES.md). Rewritten in TypeScript for Yappy's element model.
 */
import type { DrawingElement } from '../types';

export interface Origin { x: number; y: number }

/** An element's text, whichever field holds it. */
const textOf = (el: DrawingElement): string =>
    String((el as any).text ?? (el as any).containerText ?? '').trim();

const nameOf = (el: DrawingElement): string => String((el as any).name ?? '').trim();

/** Does an element start hidden when its slide appears (an on-click or start-hidden build)? */
export function startsHidden(el: DrawingElement): boolean {
    return (el.animations ?? []).some((a: any) => a.startHidden ?? a.trigger === 'on-click');
}

const PASSES: ((a: DrawingElement, b: DrawingElement) => boolean)[] = [
    (a, b) => nameOf(a).startsWith('!!') && nameOf(a) === nameOf(b),
    (a, b) => !!nameOf(a) && nameOf(a) === nameOf(b),
    (a, b) => a.type === b.type && !!textOf(a) && textOf(a) === textOf(b),
    (a, b) => a.type === b.type && !textOf(a) && !textOf(b),
];

/**
 * Pairs [index in a, index in b]. `oa` / `ob` are the two slides' top-left corners, so position
 * is compared within each slide.
 */
export function morphPairs(a: DrawingElement[], b: DrawingElement[], oa: Origin, ob: Origin): [number, number][] {
    const usedA = new Set<number>(), usedB = new Set<number>();
    const pairs: [number, number][] = [];
    const distance = (ea: DrawingElement, eb: DrawingElement) => {
        const ca = { x: ea.x - oa.x + ea.width / 2, y: ea.y - oa.y + ea.height / 2 };
        const cb = { x: eb.x - ob.x + eb.width / 2, y: eb.y - ob.y + eb.height / 2 };
        return Math.hypot(ca.x - cb.x, ca.y - cb.y) + Math.abs(ea.width - eb.width) + Math.abs(ea.height - eb.height);
    };
    for (const pass of PASSES) {
        for (let i = 0; i < a.length; i++) {
            if (usedA.has(i)) continue;
            let best = -1, bestD = Infinity;
            for (let j = 0; j < b.length; j++) {
                if (usedB.has(j) || !pass(a[i], b[j])) continue;
                const d = distance(a[i], b[j]);
                if (d < bestD) { best = j; bestD = d; }
            }
            if (best >= 0) { usedA.add(i); usedB.add(best); pairs.push([i, best]); }
        }
    }
    return pairs;
}

/** Ease in and out (smoothstep), as PowerPoint's Morph moves. */
export const smooth = (t: number): number => {
    const c = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));
    return c * c * (3 - 2 * c);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Rotation the short way round (degrees or radians alike: `full` is one turn). */
export function lerpAngle(a: number, b: number, t: number, full = 360): number {
    let d = ((b - a) % full + full) % full;
    if (d > full / 2) d -= full;
    return a + d * t;
}

/** `#rgb` / `#rrggbb` / `#rrggbbaa` → [r, g, b, a]; null for anything else (named, gradients, 'transparent'). */
export function parseHex(c: unknown): [number, number, number, number] | null {
    if (typeof c !== 'string') return null;
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c.trim());
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].split('').map(x => x + x).join('') : m[1];
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) : 255];
}

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');

/** Mix two hex colours; when either isn't a plain hex colour, switch at the midpoint. */
export function mixColor(a: unknown, b: unknown, t: number): unknown {
    const pa = parseHex(a), pb = parseHex(b);
    if (!pa || !pb) return t < 0.5 ? a : b;
    const m = pa.map((v, i) => lerp(v, pb[i], t));
    return `#${hex2(m[0])}${hex2(m[1])}${hex2(m[2])}${m[3] < 254.5 ? hex2(m[3]) : ''}`;
}

const NUMBERS = ['strokeWidth', 'fontSize', 'borderRadius', 'roughness', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'] as const;
const COLORS = ['backgroundColor', 'strokeColor', 'textColor', 'shadowColor'] as const;

/**
 * Can `a` turn into `b` as one object, or must the two cross-fade? One object when only the box,
 * colours and the numbers above differ; a change of type, text or point count cross-fades.
 */
export function morphable(a: DrawingElement, b: DrawingElement): boolean {
    if (a.type !== b.type || textOf(a) !== textOf(b)) return false;
    const pa = (a as any).points as unknown[] | undefined, pb = (b as any).points as unknown[] | undefined;
    if (!!pa !== !!pb || (pa && pb && pa.length !== pb.length)) return false;
    return (a as any).imageURL === (b as any).imageURL && (a as any).dataURL === (b as any).dataURL;
}

/** Element `a` (from slide A, moved into slide B's frame) part-way to `b`, at eased time `t`. */
export function morphElement(a: DrawingElement, b: DrawingElement, oa: Origin, ob: Origin, t: number): DrawingElement {
    const ax = a.x - oa.x + ob.x, ay = a.y - oa.y + ob.y;
    const out: any = { ...b,
        x: lerp(ax, b.x, t), y: lerp(ay, b.y, t),
        width: lerp(a.width, b.width, t), height: lerp(a.height, b.height, t),
        angle: lerpAngle(a.angle ?? 0, b.angle ?? 0, t, Math.PI * 2),
        opacity: lerp(a.opacity ?? 100, b.opacity ?? 100, t),
    };
    for (const k of NUMBERS) {
        const va = (a as any)[k], vb = (b as any)[k];
        if (typeof va === 'number' && typeof vb === 'number') out[k] = lerp(va, vb, t);
    }
    for (const k of COLORS) out[k] = mixColor((a as any)[k], (b as any)[k], t);
    const pa = (a as any).points as number[][] | undefined, pb = (b as any).points as number[][] | undefined;
    if (Array.isArray(pa) && Array.isArray(pb) && pa.length === pb.length) {
        out.points = pb.map((p, i) => [lerp(pa[i][0], p[0], t), lerp(pa[i][1], p[1], t), ...p.slice(2)]);
    }
    return out as DrawingElement;
}

/** One object to draw in a morph frame: the element as posed, and a 0..1 opacity factor. */
export interface MorphPiece { el: DrawingElement; alpha: number }

/**
 * Everything to draw at time `t` (0..1, eased here), in slide B's frame and in draw order:
 * objects leaving (only on A) fade out where they were, pairs move — or cross-fade at the moving
 * box when they can't turn into each other — and objects arriving (only on B) fade in.
 */
export function morphFrame(a: DrawingElement[], b: DrawingElement[], oa: Origin, ob: Origin, t: number): MorphPiece[] {
    const s = smooth(t);
    const pairs = morphPairs(a, b, oa, ob);
    const pairOfA = new Map(pairs.map(([i, j]) => [i, j]));
    const pairOfB = new Map(pairs.map(([i, j]) => [j, i]));
    const out: MorphPiece[] = [];
    a.forEach((ea, i) => {
        if (!pairOfA.has(i)) out.push({ el: { ...ea, x: ea.x - oa.x + ob.x, y: ea.y - oa.y + ob.y } as DrawingElement, alpha: 1 - s });
    });
    b.forEach((eb, j) => {
        const i = pairOfB.get(j);
        if (i === undefined) { out.push({ el: eb, alpha: s }); return; }
        const ea = a[i];
        if (morphable(ea, eb)) { out.push({ el: morphElement(ea, eb, oa, ob, s), alpha: 1 }); return; }
        // Different content: both at the moving box, the old fading out under the new.
        const box = morphElement(ea, eb, oa, ob, s);
        out.push({ el: { ...ea, x: box.x, y: box.y, width: box.width, height: box.height, angle: box.angle } as DrawingElement, alpha: 1 - s });
        out.push({ el: { ...eb, x: box.x, y: box.y, width: box.width, height: box.height, angle: box.angle } as DrawingElement, alpha: s });
    });
    return out;
}
