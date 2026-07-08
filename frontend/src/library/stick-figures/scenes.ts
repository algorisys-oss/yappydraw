/**
 * Multi-figure scene bundles — several figures (and a prop) composed into one
 * grouped illustration. Authored directly with the shared head/bones helpers at
 * scene coordinates, so every figure/limb stays an editable, recolourable part.
 */
import { head, bones, STROKE } from './builder';
import type { StickAsset } from './types';

function sdoc(inner: string, w: number, h: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="${STROKE}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

interface SceneDef { id: string; name: string; tags: string[]; svg: string; w: number; h: number; }

// Handshake — two figures, inner arms meeting at centre.
const handshake = sdoc(
    head(60, 40, 20) + bones('M60 62L60 152M60 88L44 124M60 94L126 118M60 152L46 228M60 152L74 228') +
    head(200, 40, 20) + bones('M200 62L200 152M200 88L216 124M200 94L134 118M200 152L186 228M200 152L214 228'),
    260, 260);

// Two people talking — one gesturing, speech bubbles above both.
const talking = sdoc(
    `<path d="M28 20 h56 a7 7 0 0 1 7 7 v22 a7 7 0 0 1 -7 7 h-30 l-14 14 v-14 h-12 a7 7 0 0 1 -7 -7 v-22 a7 7 0 0 1 7 -7 Z" fill="#3b82f6" data-sf-role="accent" stroke-width="5"/>` +
    head(62, 84, 20) + bones('M62 106L62 190M62 130L44 162M62 130L96 144M62 190L48 258M62 190L76 258') +
    head(200, 84, 20) + bones('M200 106L200 190M200 130L218 162M200 130L176 150M200 190L186 258M200 190L214 258'),
    262, 280);

// Team of three — standing together.
const team = sdoc(
    head(60, 40, 20) + bones('M60 62L60 150M60 86L44 120M60 86L78 118M60 150L48 226M60 150L74 226') +
    head(170, 34, 22) + bones('M170 56L170 152M170 84L150 116M170 84L190 116M170 152L156 228M170 152L184 228') +
    head(280, 40, 20) + bones('M280 62L280 150M280 86L262 118M280 86L298 120M280 150L266 226M280 150L294 226'),
    340, 260);

// Family — two adults + a child between them.
const family = sdoc(
    // left adult
    head(56, 38, 21) + bones('M56 60L56 152M56 86L40 120M56 86L96 126M56 152L44 228M56 152L70 228') +
    // right adult (female: hair + skirt)
    head(250, 38, 21) +
    `<path d="M232 20 Q250 6 268 20" data-sf-role="accent" stroke-width="6"/><path d="M231 38 Q224 58 231 68" data-sf-role="accent" stroke-width="4"/><path d="M269 38 Q276 58 269 68" data-sf-role="accent" stroke-width="4"/>` +
    bones('M250 60L250 152M250 86L210 126M250 86L266 120M250 152L236 228M250 152L264 228') +
    `<path d="M237 150 L263 150 L272 196 L228 196 Z" fill="#ffffff" data-sf-role="body" stroke-width="6"/>` +
    // child in the middle (small, big head)
    head(152, 128, 16) + bones('M152 148L152 200M152 166L138 188M152 166L166 188M152 200L142 250M152 200L162 250'),
    306, 268);

// Celebration group — three figures arms up + confetti.
const celebration = sdoc(
    head(60, 34, 20) + bones('M60 54L60 148M60 78L40 46M60 78L82 46M60 148L46 224M60 148L76 224') +
    head(170, 30, 22) + bones('M170 50L170 148M170 76L146 44M170 76L194 44M170 148L152 224M170 148L188 224') +
    head(280, 34, 20) + bones('M280 54L280 148M280 78L258 46M280 78L300 46M280 148L264 224M280 148L296 224') +
    `<circle cx="30" cy="30" r="4" fill="#f59e0b" stroke-width="0"/><circle cx="120" cy="20" r="4" fill="#ef4444" stroke-width="0"/><circle cx="230" cy="24" r="4" fill="#22c55e" stroke-width="0"/><circle cx="320" cy="34" r="4" fill="#8b5cf6" stroke-width="0"/><circle cx="200" cy="16" r="4" fill="#0ea5e9" stroke-width="0"/>`,
    340, 250);

const SCENES: SceneDef[] = [
    { id: 'scene-handshake', name: 'Handshake', tags: ['handshake', 'deal', 'agree', 'partners', 'meeting', 'two people'], svg: handshake, w: 260, h: 260 },
    { id: 'scene-talking', name: 'Two people talking', tags: ['talk', 'conversation', 'chat', 'discuss', 'two people', 'speech'], svg: talking, w: 262, h: 280 },
    { id: 'scene-team', name: 'Team of three', tags: ['team', 'group', 'colleagues', 'three', 'together', 'staff'], svg: team, w: 340, h: 260 },
    { id: 'scene-family', name: 'Family', tags: ['family', 'parents', 'child', 'kids', 'together', 'group'], svg: family, w: 306, h: 268 },
    { id: 'scene-celebration', name: 'Celebration', tags: ['celebrate', 'party', 'cheer', 'confetti', 'group', 'win'], svg: celebration, w: 340, h: 250 },
];

/** Scenes exposed as StickAssets (category `scenes`). */
export const SCENE_ASSETS: StickAsset[] = SCENES.map(s => ({
    id: s.id, name: s.name, category: 'scenes', tags: s.tags, svg: s.svg, w: s.w, h: s.h,
}));
