/**
 * Standalone prop assets — reusable objects (laptop, phone, mic, chart, box…)
 * you can drop on their own and combine with figures. Each imports as its own
 * editable, recolourable group. Coloured fills are tagged `accent`; neutral
 * structure is `prop`; outlines recolour via `outline`.
 */
import { STROKE } from './builder';
import type { StickAsset } from './types';

/** Wrap prop markup in an SVG sized to its own natural bounds. */
function pdoc(inner: string, w: number, h: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="${STROKE}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

interface PropDef { id: string; name: string; tags: string[]; svg: string; w: number; h: number; }

const PROPS: PropDef[] = [
    { id: 'prop-laptop', name: 'Laptop', tags: ['laptop', 'computer', 'work', 'screen'], w: 120, h: 90,
      svg: pdoc(`<rect x="24" y="14" width="72" height="50" rx="3" fill="#3b82f6" data-sf-role="accent"/><path d="M14 64 L106 64 L116 78 L4 78 Z" fill="#cbd5e1" data-sf-role="prop"/>`, 120, 90) },
    { id: 'prop-phone', name: 'Phone', tags: ['phone', 'mobile', 'cell', 'smartphone'], w: 60, h: 110,
      svg: pdoc(`<rect x="8" y="6" width="44" height="98" rx="8" fill="#0ea5e9" data-sf-role="accent"/><rect x="14" y="16" width="32" height="70" rx="2" fill="#f8fafc" data-sf-role="prop"/><circle cx="30" cy="95" r="3" data-sf-role="prop"/>`, 60, 110) },
    { id: 'prop-mic', name: 'Microphone', tags: ['mic', 'microphone', 'sound', 'record', 'sing'], w: 60, h: 120,
      svg: pdoc(`<rect x="18" y="8" width="24" height="46" rx="12" fill="#334155" data-sf-role="accent"/><path d="M12 46 a18 18 0 0 0 36 0" data-sf-role="prop"/><path d="M30 64 V104 M18 104 h24" data-sf-role="prop"/>`, 60, 120) },
    { id: 'prop-chart', name: 'Bar chart', tags: ['chart', 'bars', 'graph', 'data', 'analytics', 'stats'], w: 120, h: 100,
      svg: pdoc(`<path d="M14 10 V90 H112" data-sf-role="prop"/><rect x="26" y="56" width="16" height="34" fill="#3b82f6" data-sf-role="accent"/><rect x="52" y="38" width="16" height="52" fill="#22c55e" data-sf-role="accent"/><rect x="78" y="48" width="16" height="42" fill="#f59e0b" data-sf-role="accent"/>`, 120, 100) },
    { id: 'prop-briefcase', name: 'Briefcase', tags: ['briefcase', 'bag', 'business', 'case', 'work'], w: 120, h: 90,
      svg: pdoc(`<rect x="12" y="26" width="96" height="56" rx="6" fill="#f59e0b" data-sf-role="accent"/><path d="M44 26 v-8 a6 6 0 0 1 6 -6 h20 a6 6 0 0 1 6 6 v8" data-sf-role="prop"/><path d="M12 50 h96" data-sf-role="prop"/>`, 120, 90) },
    { id: 'prop-box', name: 'Package', tags: ['box', 'package', 'parcel', 'delivery', 'cube', 'shipping'], w: 100, h: 100,
      svg: pdoc(`<rect x="14" y="20" width="72" height="66" rx="2" fill="#f59e0b" data-sf-role="accent"/><path d="M50 20 V86 M14 53 H86" stroke="#b45309" data-sf-role="prop" stroke-width="4"/>`, 100, 100) },
    { id: 'prop-coffee', name: 'Coffee cup', tags: ['coffee', 'cup', 'tea', 'drink', 'mug', 'break'], w: 90, h: 100,
      svg: pdoc(`<path d="M18 34 h48 v34 a24 24 0 0 1 -48 0 Z" fill="#f8fafc" data-sf-role="prop"/><path d="M66 40 a14 14 0 0 1 0 26" data-sf-role="prop"/><path d="M30 20 q-4 -8 2 -14 M44 20 q-4 -8 2 -14" data-sf-role="prop" stroke-width="4"/>`, 90, 100) },
    { id: 'prop-lightbulb', name: 'Lightbulb', tags: ['lightbulb', 'idea', 'bulb', 'bright', 'inspiration'], w: 90, h: 120,
      svg: pdoc(`<circle cx="45" cy="44" r="30" fill="#facc15" data-sf-role="accent"/><path d="M32 74 h26 M34 84 h22 M37 94 h16" data-sf-role="prop" stroke-width="4"/><path d="M45 4 V-2 M8 44 H2 M88 44 H82 M16 16 l-4 -4 M74 16 l4 -4" data-sf-role="accent" stroke-width="4"/>`, 90, 120) },
    { id: 'prop-speech', name: 'Speech bubble', tags: ['speech', 'bubble', 'talk', 'chat', 'message', 'comment'], w: 120, h: 100,
      svg: pdoc(`<path d="M14 12 h92 a8 8 0 0 1 8 8 v40 a8 8 0 0 1 -8 8 h-56 l-22 22 v-22 h-14 a8 8 0 0 1 -8 -8 v-40 a8 8 0 0 1 8 -8 Z" fill="#3b82f6" data-sf-role="accent"/>`, 120, 100) },
    { id: 'prop-arrow', name: 'Arrow', tags: ['arrow', 'direction', 'point', 'next', 'right'], w: 120, h: 70,
      svg: pdoc(`<path d="M8 35 H96 M74 14 L104 35 L74 56" data-sf-role="accent" stroke-width="8"/>`, 120, 70) },
    { id: 'prop-gift', name: 'Gift', tags: ['gift', 'present', 'box', 'birthday', 'surprise'], w: 100, h: 100,
      svg: pdoc(`<rect x="16" y="36" width="68" height="52" rx="2" fill="#ec4899" data-sf-role="accent"/><path d="M50 36 V88" stroke="#f8fafc" data-sf-role="prop" stroke-width="6"/><path d="M34 36 q16 -22 16 0 q0 -22 16 0" data-sf-role="prop"/>`, 100, 100) },
    { id: 'prop-trophy', name: 'Trophy', tags: ['trophy', 'award', 'win', 'prize', 'cup', 'champion'], w: 90, h: 110,
      svg: pdoc(`<path d="M24 14 h42 v16 a21 21 0 0 1 -42 0 Z" fill="#facc15" data-sf-role="accent"/><path d="M24 20 a12 12 0 0 1 -14 0 M66 20 a12 12 0 0 0 14 0" data-sf-role="prop"/><path d="M45 51 V70 M32 70 h26 M28 88 h34 l-4 -18 h-26 Z" data-sf-role="prop"/>`, 90, 110) },
];

/** Props exposed as StickAssets (category `props`, no character variant). */
export const PROP_ASSETS: StickAsset[] = PROPS.map(p => ({
    id: p.id, name: p.name, category: 'props', tags: p.tags,
    svg: p.svg, w: p.w, h: p.h,
}));
