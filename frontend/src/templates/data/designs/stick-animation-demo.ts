/**
 * Stick-Figure Animation Demo — a sample document showing off the animated
 * stick-figure feature (see help: "Animated Stick Figures"). One landscape
 * stage with: a talking/waving conversation pair, an action-sequence figure,
 * a dancer, and a walker following a drawn path. Figures are live `stickRig`
 * elements, so opening the template starts the motion immediately; element
 * ids are fixed so the walker's `stickRig.path.pathId` reference survives
 * template load (loadDesignTemplate keeps authored ids).
 */
import type { DesignTemplate } from '../../../types/template-types';
import type { DrawingElement } from '../../../types';
import { t, makeDesign } from './helpers';

const RIG_AR = 260 / 140; // canonical rig frame is 140×260

const seed = () => Math.floor(Math.random() * 2 ** 31);

const BASE = {
    backgroundColor: 'transparent', fillStyle: 'solid' as const,
    strokeStyle: 'solid' as const, roughness: 0, opacity: 100, angle: 0,
    renderStyle: 'architectural' as const, locked: false, link: null,
    layerId: 'default-layer', roundness: null,
};

function rig(
    id: string, x: number, y: number, w: number, clip: string,
    opts: {
        facing?: 1 | -1; speed?: number; stroke?: string;
        sequence?: { clip: string; dur: number }[];
        path?: { pathId: string; dur: number; loop: boolean; autoFace: boolean };
    } = {},
): Partial<DrawingElement> {
    return {
        id, type: 'stickRig', x, y, width: w, height: Math.round(w * RIG_AR),
        strokeColor: opts.stroke ?? '#1f2937', strokeWidth: 4, seed: seed(), ...BASE,
        stickRig: {
            clip, facing: opts.facing ?? 1, speed: opts.speed ?? 1, playing: true,
            ...(opts.sequence && { sequence: opts.sequence }),
            ...(opts.path && { path: opts.path }),
        },
    } as Partial<DrawingElement>;
}

// A gently waving route across the bottom of the stage (origin-relative points).
// A freehand type ('fineliner') renders through EVERY point — a 'line' draws
// only endpoint-to-endpoint, which wouldn't match the sampled route.
const WALK_PATH_ID = 'demo-anim-walk-path';
const routePoints: { x: number; y: number }[] = [];
for (let i = 0; i <= 40; i++) {
    routePoints.push({ x: i * (1300 / 40), y: 55 + Math.sin(i / 40 * Math.PI * 3) * 45 });
}
const walkRoute: Partial<DrawingElement> = {
    id: WALK_PATH_ID, type: 'fineliner', x: 150, y: 770, width: 1300, height: 110,
    points: routePoints,
    strokeColor: '#cbd5e1', strokeWidth: 3, seed: seed(), ...BASE,
};

const caption = (text: string, x: number, y: number, w: number) =>
    t(text, x, y, w, 46, 26, { color: '#475569' });

export const stickAnimationDemo = makeDesign(
    'design-stick-animation-demo', 'Stick-Figure Animation Demo',
    'Live animated stick figures: a conversation, an action sequence, a dancer, and a walker following a path',
    ['animation', 'animated', 'stick figure', 'stick figures', 'demo', 'sample', 'story', 'storytelling', 'walk'],
    50,
    { width: 1600, height: 1000 },
    [{
        name: 'Stage',
        backgroundColor: '#f8fafc',
        elements: [
            // ── Header ────────────────────────────────────────────
            t('Animated Stick Figures', 200, 36, 1200, 80, 56, { color: '#0f172a', bold: true }),
            t('Everything below is moving. Select a figure to switch its motion, pause, flip, or bake — Menu → Stick Figures → 🎞 Animated.',
                200, 122, 1200, 46, 26, { color: '#64748b' }),

            // ── A conversation (two figures facing each other) ────
            rig('demo-anim-talker', 250, 280, 140, 'talk', { stroke: '#0369a1' }),
            rig('demo-anim-waver', 470, 280, 140, 'wave', { facing: -1, stroke: '#be185d' }),
            caption('A conversation — Talk ↔ Wave', 210, 560, 460),

            // ── An action sequence (walk → point → cheer, looping) ─
            rig('demo-anim-sequencer', 800, 280, 140, 'walk', {
                stroke: '#15803d',
                sequence: [{ clip: 'walk', dur: 2 }, { clip: 'point', dur: 2 }, { clip: 'cheer', dur: 2 }],
            }),
            caption('Action sequence — Walk → Point → Cheer', 640, 560, 460),

            // ── A dancer ──────────────────────────────────────────
            rig('demo-anim-dancer', 1220, 280, 140, 'dance', { stroke: '#7c3aed' }),
            caption('Dance', 1100, 560, 380),

            // ── Walk this path ────────────────────────────────────
            walkRoute,
            rig('demo-anim-walker', 160, 620, 120, 'walk', {
                stroke: '#b45309',
                path: { pathId: WALK_PATH_ID, dur: 12, loop: true, autoFace: true },
            }),
            caption('…and this one walks the grey path — select it for “Stop following path”', 400, 660, 800),

            // ── Footer tip ────────────────────────────────────────
            t('Tip: open the Scene Timeline (Stick Figures panel → Scene timeline) to play, pause and scrub everyone together — or Record video / Export → HTML to share it moving.',
                160, 936, 1280, 44, 24, { color: '#94a3b8' }),
        ],
    }],
);

export const stickAnimationTemplates: DesignTemplate[] = [stickAnimationDemo];
