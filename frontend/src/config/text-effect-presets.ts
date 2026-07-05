/**
 * Text effect presets (Canva-style one-click looks) composed from existing
 * element attributes: shadow, glow, text outline, and text highlight.
 */
import type { DrawingElement } from '../types';

export interface TextEffectPreset {
    id: string;
    name: string;
    /** Build the patch from the element's current colors. */
    patch: (el: DrawingElement) => Partial<DrawingElement>;
}

/** Clears every effect attribute a preset may set. */
const RESET: Partial<DrawingElement> = {
    shadowEnabled: false,
    shadowColor: undefined,
    shadowBlur: undefined,
    shadowOffsetX: undefined,
    shadowOffsetY: undefined,
    glowEnabled: false,
    glowColor: undefined,
    glowBlur: undefined,
    textStrokeEnabled: false,
    textStrokeColor: undefined,
    textStrokeWidth: undefined,
    textHighlightEnabled: false,
};

const textColorOf = (el: DrawingElement) => el.textColor || el.strokeColor || '#000000';

/** Restore a visible fill when leaving an outline-only preset. */
const restoreFill = (el: DrawingElement): Partial<DrawingElement> =>
    el.textColor === 'transparent' ? { textColor: el.textStrokeColor || '#1e293b' } : {};

export const TEXT_EFFECT_PRESETS: TextEffectPreset[] = [
    {
        id: 'none', name: 'None',
        patch: (el) => ({ ...RESET, ...restoreFill(el), textEffect: 'none' }),
    },
    {
        id: 'shadow', name: 'Shadow',
        patch: (el) => ({
            ...RESET, ...restoreFill(el),
            shadowEnabled: true, shadowColor: 'rgba(0,0,0,0.45)', shadowBlur: 6,
            shadowOffsetX: 4, shadowOffsetY: 4, textEffect: 'shadow',
        }),
    },
    {
        id: 'lift', name: 'Lift',
        patch: (el) => ({
            ...RESET, ...restoreFill(el),
            shadowEnabled: true, shadowColor: 'rgba(0,0,0,0.28)', shadowBlur: 18,
            shadowOffsetX: 0, shadowOffsetY: 8, textEffect: 'lift',
        }),
    },
    {
        id: 'hollow', name: 'Hollow',
        patch: (el) => ({
            ...RESET,
            textStrokeEnabled: true,
            textStrokeColor: textColorOf(el) === 'transparent' ? '#1e293b' : textColorOf(el),
            textStrokeWidth: Math.max(1.5, (el.fontSize || 28) / 18),
            textColor: 'transparent',
            textEffect: 'hollow',
        }),
    },
    {
        id: 'splice', name: 'Splice',
        patch: (el) => ({
            ...RESET,
            textStrokeEnabled: true,
            textStrokeColor: textColorOf(el) === 'transparent' ? '#1e293b' : textColorOf(el),
            textStrokeWidth: Math.max(1.5, (el.fontSize || 28) / 18),
            textColor: 'transparent',
            shadowEnabled: true, shadowColor: 'rgba(0,0,0,0.35)', shadowBlur: 0,
            shadowOffsetX: 6, shadowOffsetY: 6, textEffect: 'splice',
        }),
    },
    {
        id: 'outline', name: 'Outline',
        patch: (el) => ({
            ...RESET, ...restoreFill(el),
            textStrokeEnabled: true,
            textStrokeColor: '#ffffff',
            textStrokeWidth: Math.max(2, (el.fontSize || 28) / 12),
            textEffect: 'outline',
        }),
    },
    {
        id: 'echo', name: 'Echo',
        patch: (el) => ({
            ...RESET, ...restoreFill(el),
            shadowEnabled: true, shadowColor: 'rgba(0,0,0,0.30)', shadowBlur: 0,
            shadowOffsetX: 8, shadowOffsetY: 8, textEffect: 'echo',
        }),
    },
    {
        id: 'neon', name: 'Neon',
        patch: (el) => ({
            ...RESET, ...restoreFill(el),
            glowEnabled: true,
            glowColor: textColorOf(el) === 'transparent' ? '#22d3ee' : textColorOf(el),
            glowBlur: 22, textEffect: 'neon',
        }),
    },
    {
        id: 'glitch', name: 'Glitch',
        // Chromatic-aberration copies are drawn by the text renderer when
        // textEffect === 'glitch'; no shadow/stroke attributes needed.
        patch: (el) => ({ ...RESET, ...restoreFill(el), textEffect: 'glitch' }),
    },
    {
        id: 'background', name: 'Background',
        patch: (el) => ({
            ...RESET, ...restoreFill(el),
            textHighlightEnabled: true,
            textHighlightColor: el.textHighlightColor || 'rgba(250, 204, 21, 0.85)',
            textEffect: 'background',
        }),
    },
];

export const getTextEffectPreset = (id: string): TextEffectPreset | undefined =>
    TEXT_EFFECT_PRESETS.find(p => p.id === id);
