/**
 * Yappy build animations ↔ PowerPoint's preset effects. Pure, so it unit-tests under bun.
 *
 * Yappy has 120-odd presets (animate.css names plus its own); PowerPoint a different set. Each
 * Yappy preset maps to the PowerPoint effect that looks most like it (a slide-in is Fly In from
 * that side, a bounce-in is Bounce, a flip is Swivel), and each PowerPoint effect back to a Yappy
 * preset. What has no counterpart (property and keyframe tweens, motion paths, hover triggers) is
 * left out and counted, so the export can say so. Preset numbers and subtypes are PowerPoint's,
 * as DeckCraft lists them (crates/model/src/anim.rs `ANIMATIONS`).
 */
import type { ElementAnimation, AnimationTrigger } from '../../types/motion-types';
import type { DeckAnim, DeckEffect } from './deck';

type Dir = 'l' | 'r' | 't' | 'b';
type Cls = DeckAnim['cls'];

/** PowerPoint preset ids by class and effect. */
const PRESET: Record<Cls, Partial<Record<DeckEffect, number>>> = {
    entr: { appear: 1, fly: 2, fade: 10, wipe: 22, bounce: 26, grow: 31, swivel: 45, spinner: 49, zoom: 53 },
    exit: { appear: 1, fly: 2, fade: 10, wipe: 22, bounce: 26, grow: 31, swivel: 45, spinner: 49, zoom: 53 },
    emph: { growShrink: 6, spin: 8, pulse: 26, teeter: 32 },
};

/** PowerPoint subtypes for "from this side" (Fly, Wipe): top 1, right 2, bottom 4, left 8. */
const SIDE: Record<Dir, number> = { t: 1, r: 2, b: 4, l: 8 };
const SIDE_OF: Record<number, Dir> = { 1: 't', 2: 'r', 4: 'b', 8: 'l' };

const dirOf = (name: string): Dir | undefined => {
    if (/Left/.test(name)) return 'l';
    if (/Right/.test(name)) return 'r';
    // animate.css names the direction of travel: "InUp" rises from the bottom, "InDown" drops from the top.
    if (/InUp|OutDown/.test(name)) return 'b';
    if (/InDown|OutUp/.test(name)) return 't';
    return undefined;
};

/** A Yappy preset name → class and PowerPoint effect. */
function presetEffect(name: string): { cls: Cls; effect: DeckEffect; dir?: Dir } {
    const exit = /Out/.test(name) || name === 'hinge' || name === 'textDelete';
    const cls: Cls = exit ? 'exit' : /In|^flip$|^drawIn$|^scaleIn$|^jackInTheBox$|^typewriter|^charByChar$|^wordByWord$|^lineByLine$|^textScramble$|^table|^ds|^code/.test(name) ? 'entr' : 'emph';
    if (cls === 'emph') {
        if (/^(pulse|heartBeat|flash)$/.test(name)) return { cls, effect: 'pulse' };
        if (/^(rubberBand|jello)$/.test(name)) return { cls, effect: 'growShrink' };
        return { cls, effect: 'teeter' };   // bounce, shake*, headShake, wobble, swing, tada
    }
    const dir = dirOf(name);
    if (/^(slide|back|lightSpeed)(In|Out)/.test(name) || /^fade(In|Out).*Big$/.test(name)) return { cls, effect: 'fly', dir: dir ?? 'b' };
    if (/^bounce(In|Out)/.test(name)) return { cls, effect: 'bounce' };
    if (/^(zoom|scale)(In|Out)|^jackInTheBox$/.test(name)) return { cls, effect: 'zoom' };
    if (/^(rotate|roll)(In|Out)|^hinge$/.test(name)) return { cls, effect: 'spinner' };
    if (/^flip/.test(name)) return { cls, effect: 'swivel' };
    if (/^(draw(In|Out)|typewriter|charByChar|wordByWord|lineByLine|textScramble|textDelete)/.test(name)) return { cls, effect: 'wipe', dir: 'l' };
    return { cls, effect: 'fade' };
}

/** The deck effect for one Yappy animation, or null when PowerPoint has no counterpart. */
export function toDeckAnim(a: ElementAnimation, target: number, start: DeckAnim['start']): DeckAnim | null {
    const timing = { target, start, durationMs: Math.max(1, Math.round(a.duration ?? 500)), delayMs: Math.max(0, Math.round(a.delay ?? 0)) };
    const repeat = typeof a.repeat === 'number' && a.repeat !== 0 ? { repeat: a.repeat < 0 ? -1 : a.repeat + 1 } : {};
    if (a.type === 'preset') {
        const { cls, effect, dir } = presetEffect(a.name);
        return { ...timing, ...repeat, cls, effect, presetId: PRESET[cls][effect] ?? 10, subtype: dir ? SIDE[dir] : effect === 'zoom' ? 16 : 0, ...(dir && { dir }) };
    }
    if (a.type === 'rotate') {
        const deg = (a as any).relative === false && typeof (a as any).fromAngle === 'number' ? (a as any).toAngle - (a as any).fromAngle : (a as any).toAngle;
        return { ...timing, ...repeat, cls: 'emph', effect: 'spin', presetId: 8, subtype: 0, degrees: Number(deg) || 360 };
    }
    if (a.type === 'autoSpin') {
        const turns = (a as any).iterations === 'infinite' ? 1 : Math.max(1, Number((a as any).iterations) || 1);
        const sign = (a as any).direction === 'counterclockwise' ? -1 : 1;
        return { ...timing, cls: 'emph', effect: 'spin', presetId: 8, subtype: 0, degrees: 360 * turns * sign,
            ...((a as any).iterations === 'infinite' && { repeat: -1 }) };
    }
    return null;
}

/** Yappy triggers → PowerPoint "Start" (on-hover and programmatic have none: null). */
export function startOf(trigger: AnimationTrigger): DeckAnim['start'] | null {
    switch (trigger) {
        case 'on-click': return 'click';
        case 'with-prev': case 'on-load': return 'with';
        case 'after-prev': return 'after';
        default: return null;
    }
}

/** Yappy preset names for a PowerPoint effect we read back. */
function presetName(d: DeckAnim): string {
    const side = (s?: Dir) => (s === 'l' ? 'Left' : s === 'r' ? 'Right' : s === 't' ? 'Down' : 'Up');
    if (d.cls === 'entr') switch (d.effect) {
        case 'fly': return `slideIn${side(d.dir ?? 'b')}`;
        case 'bounce': return 'bounceIn';
        case 'zoom': case 'grow': return 'zoomIn';
        case 'spinner': return 'rotateIn';
        case 'swivel': return 'flipInY';
        case 'wipe': return 'drawIn';
        default: return 'fadeIn';
    }
    if (d.cls === 'exit') switch (d.effect) {
        // "slideOutLeft" leaves to the left; PowerPoint's Fly Out names the side it leaves by too.
        case 'fly': return `slideOut${d.dir === 'l' ? 'Left' : d.dir === 'r' ? 'Right' : d.dir === 't' ? 'Up' : 'Down'}`;
        case 'bounce': return 'bounceOut';
        case 'zoom': case 'grow': return 'zoomOut';
        case 'spinner': return 'rotateOut';
        case 'swivel': return 'flipOutY';
        case 'wipe': return 'drawOut';
        default: return 'fadeOut';
    }
    switch (d.effect) {
        case 'growShrink': return 'rubberBand';
        case 'teeter': return 'shakeX';
        default: return 'pulse';
    }
}

/** A PowerPoint effect as a Yappy animation. `first` marks the effects that play when the slide appears. */
export function fromDeckAnim(d: DeckAnim, id: string, onLoad: boolean): ElementAnimation {
    const trigger: AnimationTrigger = onLoad ? (d.start === 'after' ? 'after-prev' : 'on-load')
        : d.start === 'click' ? 'on-click' : d.start === 'with' ? 'with-prev' : 'after-prev';
    const base = {
        id, trigger, duration: Math.max(1, d.durationMs), delay: Math.max(0, d.delayMs), easing: 'easeOutQuad' as const,
        ...(d.repeat !== undefined && d.repeat !== 1 && { repeat: d.repeat < 0 ? -1 : Math.max(0, d.repeat - 1) }),
        // PowerPoint hides an entrance's object until it plays.
        ...(d.cls === 'entr' && { startHidden: true }),
    };
    if (d.cls === 'emph' && d.effect === 'spin') {
        return { ...base, type: 'rotate', toAngle: d.degrees ?? 360, relative: true } as ElementAnimation;
    }
    return { ...base, type: 'preset', name: presetName(d) } as ElementAnimation;
}

/** Effect name for a PowerPoint class and preset id; unknown ids fall back to the class's plain effect. */
export function effectOf(cls: Cls, presetId: number): { effect: DeckEffect; known: boolean } {
    for (const [effect, id] of Object.entries(PRESET[cls]) as [DeckEffect, number][]) if (id === presetId) return { effect, known: true };
    return { effect: cls === 'emph' ? 'pulse' : 'fade', known: false };
}

export const sideOf = (subtype: number): Dir | undefined => SIDE_OF[subtype];
