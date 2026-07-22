/**
 * Animation templates — ready-made frame-timeline documents (docType
 * 'animation') for the Templates browser's Animations category. Each is a
 * full SlideDocument carried on `template.doc` (the loader restores it via
 * loadDocument), with `data.elements` stubbed to the FIRST frame's cel so the
 * browser can draw a preview.
 *
 * They double as social-media showcases: load → Export defaults to a GIF of
 * exactly one timeline pass.
 */

import type { DrawingElement, Layer } from '../../types';
import type { Template } from '../../types/template-types';
import type { SlideDocument } from '../../types/slide-types';
import { createSlideDocument } from '../../types/slide-types';
import type { AnimKeyframe, AnimLayer } from '../../types/anim-types';
import { normalizeElement } from '../../utils/migration';
import { evaluateTimelineAt } from '../../utils/animation/frame-timeline-evaluator';

let seq = 0;
const eid = (t: string) => `${t}-anim-tpl-${++seq}`;

/** Element factory: sketch-styled, solid-filled, normalized defaults. */
const el = (type: string, x: number, y: number, w: number, h: number, props: Partial<DrawingElement> = {}): DrawingElement =>
    normalizeElement({
        id: eid(type), type: type as any, x, y, width: w, height: h,
        fillStyle: 'solid', renderStyle: 'sketch', roughness: 1.2,
        ...props,
    } as any);

/** Tween successor: a deep copy on a later keyframe sharing the base's contentId. */
const pose = (base: DrawingElement, over: Partial<DrawingElement>): DrawingElement => {
    const copy: DrawingElement = JSON.parse(JSON.stringify(base));
    copy.id = eid(base.type);
    copy.contentId = base.contentId ?? base.id;
    return Object.assign(copy, over);
};

/** Give an element a stable tween identity (contentId = own id). */
const tweenable = (e: DrawingElement): DrawingElement => { e.contentId = e.id; return e; };

const layer = (id: string, name: string, order: number): Layer =>
    ({ id, name, visible: true, locked: false, opacity: 1, order, backgroundColor: 'transparent' });

const row = (layerId: string, keyframes: AnimKeyframe[], endFrame: number): AnimLayer =>
    ({ layerId, keyframes, endFrame });

const kf = (frame: number, els: DrawingElement[], tween?: { easing?: string }): AnimKeyframe => ({
    frame,
    elementIds: els.map(e => e.id),
    ...(tween && { tween: 'motion' as const, easing: (tween.easing ?? 'linear') as any }),
});

/** Assemble the document + the first-frame preview stub. */
const finish = (doc: SlideDocument, name: string): SlideDocument => {
    doc.metadata.name = name;
    return doc;
};

// ─── 1. Bouncing Ball — the classic squash & stretch (24f @ 24fps) ─────────

export function buildBouncingBallDoc(): SlideDocument {
    const doc = createSlideDocument('Bouncing Ball', 'animation', { width: 800, height: 600 }, { fps: 24, frameCount: 24 });
    const lGround = layer('l-ground', 'Ground', 0);
    const lShadow = layer('l-shadow', 'Shadow', 1);
    const lBall = layer('l-ball', 'Ball', 2);

    const ground = el('rectangle', 100, 532, 600, 8, { backgroundColor: '#334155', strokeColor: '#334155', layerId: lGround.id });

    const shadow0 = tweenable(el('circle', 370, 526, 60, 14, { backgroundColor: '#0f172a', strokeColor: 'transparent', opacity: 35, layerId: lShadow.id }));
    const shadowLow = pose(shadow0, { x: 348, width: 104, opacity: 62 });
    const shadowSquash = pose(shadow0, { x: 338, width: 124, opacity: 72 });
    const shadowUp = pose(shadow0, { x: 348, width: 104, opacity: 62 });
    const shadowTop = pose(shadow0, { x: 369, width: 62, opacity: 36 });

    const ball0 = tweenable(el('circle', 355, 100, 90, 90, { backgroundColor: '#f43f5e', strokeColor: '#881337', strokeWidth: 3, layerId: lBall.id }));
    const ballLow = pose(ball0, { y: 430 });
    const ballSquash = pose(ball0, { x: 345, y: 466, width: 110, height: 64 });
    const ballUp = pose(ball0, { y: 430 });
    const ballTop = pose(ball0, { y: 100 });

    doc.layers = [lGround, lShadow, lBall];
    doc.elements = [ground, shadow0, shadowLow, shadowSquash, shadowUp, shadowTop, ball0, ballLow, ballSquash, ballUp, ballTop];
    doc.animTimeline = {
        fps: 24, frameCount: 24,
        layers: [
            row(lGround.id, [kf(0, [ground])], 23),
            row(lShadow.id, [
                kf(0, [shadow0], { easing: 'easeInQuad' }),
                kf(10, [shadowLow], { easing: 'linear' }),
                kf(12, [shadowSquash], { easing: 'linear' }),
                kf(14, [shadowUp], { easing: 'easeOutQuad' }),
                kf(23, [shadowTop]),
            ], 23),
            row(lBall.id, [
                kf(0, [ball0], { easing: 'easeInQuad' }),   // accelerate into the fall
                kf(10, [ballLow], { easing: 'linear' }),
                kf(12, [ballSquash], { easing: 'linear' }), // contact squash
                kf(14, [ballUp], { easing: 'easeOutQuad' }),// decelerate on the way up
                kf(23, [ballTop]),                          // wraps seamlessly to frame 0
            ], 23),
        ],
    };
    return finish(doc, 'Bouncing Ball');
}

// ─── 2. Rocket Launch — movie-clip flame + cel-swap star twinkle (48f) ─────

export function buildRocketLaunchDoc(): SlideDocument {
    const doc = createSlideDocument('Rocket Launch', 'animation', { width: 800, height: 600 }, { fps: 24, frameCount: 48 });
    const lSky = layer('l-sky', 'Sky', 0);
    const lTwinkle = layer('l-twinkle', 'Twinkle', 1);
    const lRocket = layer('l-rocket', 'Rocket', 2);

    const sky = el('rectangle', 0, 0, 800, 600, { backgroundColor: '#0f172a', strokeColor: 'transparent', layerId: lSky.id });
    const dimStars = [[90, 300], [250, 90], [430, 180], [640, 320], [730, 100]].map(([x, y]) =>
        el('circle', x, y, 6, 6, { backgroundColor: '#475569', strokeColor: 'transparent', layerId: lSky.id }));

    // Twinkle: two alternating cels of bright stars (pure frame-by-frame).
    const starsA = [[120, 80], [620, 140], [300, 220]].map(([x, y]) =>
        el('circle', x, y, 8, 8, { backgroundColor: '#e0f2fe', strokeColor: 'transparent', layerId: lTwinkle.id }));
    const starsB = [[200, 160], [700, 60], [500, 260]].map(([x, y]) =>
        el('circle', x, y, 8, 8, { backgroundColor: '#fef9c3', strokeColor: 'transparent', layerId: lTwinkle.id }));

    // Flame movie clip: two cels flickering every 3 frames, looping forever.
    const flameBig = el('triangle', 0, 0, 36, 48, { backgroundColor: '#f97316', strokeColor: '#c2410c', angle: Math.PI });
    const flameSmall = el('triangle', 4, 0, 28, 34, { backgroundColor: '#facc15', strokeColor: '#ca8a04', angle: Math.PI });
    const flameSymId = eid('sym');
    doc.symbols = [{
        id: flameSymId, name: 'Flame', width: 36, height: 48,
        elements: [flameBig, flameSmall],
        kind: 'movieclip',
        timeline: {
            fps: 24, frameCount: 6,
            layers: [row('clip', [
                { frame: 0, elementIds: [flameBig.id] },
                { frame: 3, elementIds: [flameSmall.id] },
            ], 5)],
        },
    }];

    // Rocket parts share one layer; every part tweens up together (contentId pairs).
    const body = tweenable(el('capsule', 370, 380, 60, 140, { backgroundColor: '#e2e8f0', strokeColor: '#475569', strokeWidth: 3, layerId: lRocket.id }));
    const win = tweenable(el('circle', 386, 418, 28, 28, { backgroundColor: '#38bdf8', strokeColor: '#0369a1', strokeWidth: 3, layerId: lRocket.id }));
    const finL = tweenable(el('triangle', 344, 472, 26, 46, { backgroundColor: '#ef4444', strokeColor: '#991b1b', layerId: lRocket.id }));
    const finR = tweenable(el('triangle', 430, 472, 26, 46, { backgroundColor: '#ef4444', strokeColor: '#991b1b', layerId: lRocket.id }));
    const flame = tweenable(normalizeElement({
        id: eid('symi'), type: 'symbolInstance' as any, symbolId: flameSymId,
        x: 382, y: 516, width: 36, height: 48, loopMode: 'loop', layerId: lRocket.id,
    } as any));
    const parts = [body, win, finL, finR, flame];
    const rise = -640; // well past the top of the 600px stage
    const partsUp = parts.map(p => pose(p, { y: p.y + rise }));

    doc.layers = [lSky, lTwinkle, lRocket];
    doc.elements = [sky, ...dimStars, ...starsA, ...starsB, ...parts, ...partsUp];
    doc.animTimeline = {
        fps: 24, frameCount: 48,
        layers: [
            row(lSky.id, [kf(0, [sky, ...dimStars])], 47),
            // Same cels re-referenced on alternating keyframes — a shared-cel flicker.
            row(lTwinkle.id, [
                kf(0, starsA), kf(6, starsB), kf(12, starsA), kf(18, starsB),
                kf(24, starsA), kf(30, starsB), kf(36, starsA), kf(42, starsB),
            ], 47),
            row(lRocket.id, [
                kf(0, parts, { easing: 'easeInCubic' }), // slow lift-off, fast exit
                kf(40, partsUp),
            ], 47),
        ],
    };
    return finish(doc, 'Rocket Launch');
}

// ─── 3. YappyDraw Intro — 1080×1080 social card (72f @ 24fps) ──────────────

export function buildYappyIntroDoc(): SlideDocument {
    const doc = createSlideDocument('YappyDraw Intro', 'animation', { width: 1080, height: 1080 }, { fps: 24, frameCount: 72 });
    const lBg = layer('l-bg', 'Background', 0);
    const lTitle = layer('l-title', 'Title', 1);
    const lLine = layer('l-underline', 'Underline', 2);
    const lTag = layer('l-tagline', 'Tagline', 3);
    const shapeDefs: [string, string, string, number][] = [
        ['star', '#f59e0b', '#b45309', 6],
        ['circle', '#3b82f6', '#1d4ed8', 12],
        ['heart', '#ef4444', '#b91c1c', 18],
        ['hexagon', '#10b981', '#047857', 24],
    ];
    const shapeLayers = shapeDefs.map(([type], i) => layer(`l-${type}`, type[0].toUpperCase() + type.slice(1), 4 + i));

    const bg = el('rectangle', 0, 0, 1080, 1080, { backgroundColor: '#fffbeb', strokeColor: 'transparent', layerId: lBg.id });
    const blobTL = el('circle', -140, -140, 380, 380, { backgroundColor: '#fde68a', strokeColor: 'transparent', opacity: 60, layerId: lBg.id });
    const blobBR = el('circle', 840, 840, 380, 380, { backgroundColor: '#bae6fd', strokeColor: 'transparent', opacity: 60, layerId: lBg.id });

    const title0 = tweenable(el('text', 190, 470, 700, 130, {
        text: 'YappyDraw', fontSize: 110, fontFamily: 'hand-drawn', textColor: '#1e293b',
        strokeColor: '#1e293b', backgroundColor: 'transparent', opacity: 0, y: 500, layerId: lTitle.id,
    }));
    const title1 = pose(title0, { opacity: 100, y: 440 });

    const line0 = tweenable(el('rectangle', 340, 580, 8, 12, { backgroundColor: '#f59e0b', strokeColor: 'transparent', layerId: lLine.id }));
    const line1 = pose(line0, { width: 400 });

    const tag0 = tweenable(el('text', 240, 620, 600, 60, {
        text: 'Sketch · Animate · Play', fontSize: 44, fontFamily: 'hand-drawn', textColor: '#64748b',
        strokeColor: '#64748b', backgroundColor: 'transparent', opacity: 0, layerId: lTag.id,
    }));
    const tag1 = pose(tag0, { opacity: 100 });

    // Four shapes popping in on their own layers, staggered, with a bounce.
    const shapeEls = shapeDefs.map(([type, fill, stroke], i) => {
        const cx = 270 + i * 160;
        const tiny = tweenable(el(type, cx + 40, 780 + 40, 10, 10, { backgroundColor: fill, strokeColor: stroke, strokeWidth: 3, layerId: shapeLayers[i].id }));
        const full = pose(tiny, { x: cx, y: 780, width: 90, height: 90 });
        return { tiny, full };
    });

    doc.layers = [lBg, lTitle, lLine, lTag, ...shapeLayers];
    doc.elements = [bg, blobTL, blobBR, title0, title1, line0, line1, tag0, tag1, ...shapeEls.flatMap(s => [s.tiny, s.full])];
    doc.animTimeline = {
        fps: 24, frameCount: 72,
        layers: [
            row(lBg.id, [kf(0, [bg, blobTL, blobBR])], 71),
            row(lTitle.id, [kf(0, []), kf(2, [title0], { easing: 'easeOutCubic' }), kf(14, [title1])], 71),
            row(lLine.id, [kf(0, []), kf(16, [line0], { easing: 'easeOutCubic' }), kf(28, [line1])], 71),
            row(lTag.id, [kf(0, []), kf(30, [tag0], { easing: 'easeOutQuad' }), kf(42, [tag1])], 71),
            ...shapeEls.map((s, i) => row(shapeLayers[i].id, [
                kf(0, []),
                kf(6 + shapeDefs[i][3], [s.tiny], { easing: 'easeOutBounce' }),
                kf(6 + shapeDefs[i][3] + 10, [s.full]),
            ], 71)),
        ],
    };
    return finish(doc, 'YappyDraw Intro');
}

// ─── Template registry entries ─────────────────────────────────────────────

/** Preview stub: the first frame's visible elements (what the browser draws). */
const previewData = (doc: SlideDocument) => {
    const vis = evaluateTimelineAt(0, doc.animTimeline!, doc.elements).visible;
    return { elements: doc.elements.filter(e => vis.has(e.id)), layers: doc.layers };
};

const asTemplate = (doc: SlideDocument, id: string, description: string, tags: string[], order: number): Template => ({
    metadata: {
        id, name: doc.metadata.name!, category: 'animations', description, tags,
        order, pageSize: doc.slides[0]?.dimensions,
    },
    data: previewData(doc),
    ...( { doc } as any ),
});

export const bouncingBallTemplate = asTemplate(
    buildBouncingBallDoc(), 'anim-bouncing-ball',
    'The classic squash & stretch loop — motion tweens, easing and a synced shadow. Export as a looping GIF.',
    ['animation', 'bounce', 'ball', 'tween', 'squash', 'stretch', 'loop', 'gif'], 1);

export const rocketLaunchTemplate = asTemplate(
    buildRocketLaunchDoc(), 'anim-rocket-launch',
    'Lift-off with a flickering movie-clip flame and twinkling frame-by-frame stars.',
    ['animation', 'rocket', 'space', 'movie clip', 'launch', 'stars', 'gif'], 2);

export const yappyIntroTemplate = asTemplate(
    buildYappyIntroDoc(), 'anim-yappy-intro',
    'A 1080×1080 branded intro card — title fly-in, bouncing shapes, underline sweep. Made for social media.',
    ['animation', 'intro', 'social', 'brand', 'instagram', 'square', 'gif', 'showcase'], 3);

export const allAnimationTemplates: Template[] = [bouncingBallTemplate, rocketLaunchTemplate, yappyIntroTemplate];
