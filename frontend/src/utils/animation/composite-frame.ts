/**
 * The geometry of the Wipe, Cover, Uncover and Split transitions, kept free of the DOM and the
 * store so it unit-tests: which transition a type names, and where each slide is drawn in a frame.
 * composite-transition.ts plays it.
 */
import type { SlideTransitionType } from '../../types/slide-types';

export type CompositeKind = 'wipe' | 'cover' | 'uncover' | 'split';
export type Side = 'left' | 'right' | 'up' | 'down';
export interface CompositeSpec { kind: CompositeKind; side?: Side; orient?: 'horizontal' | 'vertical'; inward?: boolean }

/** The composite a transition type names, or null for the other types. */
export function compositeOf(type: SlideTransitionType): CompositeSpec | null {
    const m = /^(wipe|cover|uncover)-(left|right|up|down)$/.exec(type);
    if (m) return { kind: m[1] as CompositeKind, side: m[2] as Side };
    const s = /^split-(horizontal|vertical)-(out|in)$/.exec(type);
    if (s) return { kind: 'split', orient: s[1] as 'horizontal' | 'vertical', inward: s[2] === 'in' };
    return null;
}

const OPPOSITE: Record<Side, Side> = { left: 'right', right: 'left', up: 'down', down: 'up' };

/** Going back through the deck plays the effect the other way, as Slide does. */
export function reversed(spec: CompositeSpec): CompositeSpec {
    return spec.side ? { ...spec, side: OPPOSITE[spec.side] } : { ...spec, inward: !spec.inward };
}

type Rect = { x: number; y: number; w: number; h: number };
/**
 * One frame at progress `t` (0…1) in a w×h box: where the old slide and the new one are drawn
 * (offsets) and where the new one shows (clip rectangles; null = everywhere). The side names the
 * way the effect moves: wipe-left reveals the new slide from the right edge, moving left.
 */
export function compositeFrame(spec: CompositeSpec, t: number, w: number, h: number): {
    newOnTop: boolean; oldAt: { x: number; y: number }; newAt: { x: number; y: number }; clip: Rect[] | null;
} {
    const still = { x: 0, y: 0 };
    const off = (side: Side, k: number) => side === 'left' ? { x: -w * k, y: 0 } : side === 'right' ? { x: w * k, y: 0 }
        : side === 'up' ? { x: 0, y: -h * k } : { x: 0, y: h * k };
    switch (spec.kind) {
        case 'wipe': {
            const s = spec.side ?? 'left';
            const clip = s === 'left' ? { x: w * (1 - t), y: 0, w: w * t, h } : s === 'right' ? { x: 0, y: 0, w: w * t, h }
                : s === 'up' ? { x: 0, y: h * (1 - t), w, h: h * t } : { x: 0, y: 0, w, h: h * t };
            return { newOnTop: true, oldAt: still, newAt: still, clip: [clip] };
        }
        case 'cover': // the new slide slides in over the old one
            return { newOnTop: true, oldAt: still, newAt: off(OPPOSITE[spec.side ?? 'left'], 1 - t), clip: null };
        case 'uncover': // the old slide slides away, showing the new one underneath
            return { newOnTop: false, oldAt: off(spec.side ?? 'left', t), newAt: still, clip: null };
        case 'split': {
            const horiz = spec.orient !== 'vertical'; // a horizontal opening: the band grows up and down
            if (!spec.inward) {
                return { newOnTop: true, oldAt: still, newAt: still, clip: [horiz
                    ? { x: 0, y: (h / 2) * (1 - t), w, h: h * t }
                    : { x: (w / 2) * (1 - t), y: 0, w: w * t, h }] };
            }
            const a = horiz ? h * t / 2 : w * t / 2;
            return { newOnTop: true, oldAt: still, newAt: still, clip: horiz
                ? [{ x: 0, y: 0, w, h: a }, { x: 0, y: h - a, w, h: a }]
                : [{ x: 0, y: 0, w: a, h }, { x: w - a, y: 0, w: a, h }] };
        }
    }
}

