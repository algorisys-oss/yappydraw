/**
 * New slide from a layout: the layout generators that templates, AI decks and Markdown import
 * already use (utils/slide-element-factory.ts), offered one slide at a time with placeholder
 * text, fitted to the slide's own size and coloured for its background.
 */
import type { DrawingElement } from '../types';
import type { SlidePalette } from '../types/template-types';
import { createSlideElements, PALETTES, type AISlideContent } from './slide-element-factory';

export const SLIDE_LAYOUTS = [
    'blank', 'title', 'content', 'two-column', 'section-break', 'comparison',
    'quote', 'metrics', 'timeline', 'card-grid', 'image-text', 'closing',
] as const;
export type SlideLayoutId = typeof SLIDE_LAYOUTS[number];

export const isSlideLayout = (v: unknown): v is SlideLayoutId => (SLIDE_LAYOUTS as readonly unknown[]).includes(v);

/** Placeholder words, in the user's language (the caller passes t()-resolved strings). */
export interface LayoutText {
    title: string; subtitle: string; point: (n: number) => string; body: string;
    quote: string; author: string; value: string; label: string; year: string;
    optionA: string; optionB: string; closing: string;
}

/** What each layout is filled with before the user types. */
function content(id: Exclude<SlideLayoutId, 'blank'>, w: LayoutText): AISlideContent {
    const points = [1, 2, 3].map(w.point);
    switch (id) {
        case 'title': return { slideType: 'title', title: w.title, subtitle: w.subtitle };
        case 'content': return { slideType: 'content', title: w.title, bullets: points };
        case 'two-column': return { slideType: 'two-column', title: w.title, leftColumn: points, rightColumn: points };
        case 'section-break': return { slideType: 'section-break', title: w.title, subtitle: w.subtitle };
        case 'comparison': return { slideType: 'comparison', title: w.title,
            comparisonLeft: { title: w.optionA, items: points }, comparisonRight: { title: w.optionB, items: points } };
        case 'quote': return { slideType: 'quote', quote: { text: w.quote, attribution: w.author } };
        case 'metrics': return { slideType: 'metrics', title: w.title, metrics: [1, 2, 3].map(() => ({ value: w.value, label: w.label })) };
        case 'timeline': return { slideType: 'timeline', title: w.title, timelineItems: points.map(text => ({ year: w.year, text })) };
        case 'card-grid': return { slideType: 'card-grid', title: w.title, cards: points.map(p => ({ title: p, body: w.body })) };
        case 'image-text': return { slideType: 'image-text', title: w.title, body: w.body };
        case 'closing': return { slideType: 'closing', title: w.closing, subtitle: w.subtitle };
    }
}

/** Perceived luminance below the midpoint. #rgb, #rrggbb(aa) and rgb()/rgba(); anything else counts as light. */
export function isDarkColor(color: string): boolean {
    const c = color.trim();
    let rgb: number[] | null = null;
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(c)?.[1];
    if (hex) {
        const h = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex.slice(0, 6);
        rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    } else {
        const m = /^rgba?\(([^)]+)\)/i.exec(c);
        if (m) rgb = m[1].split(',').slice(0, 3).map(v => parseFloat(v));
    }
    if (!rgb || rgb.some(v => !Number.isFinite(v))) return false;
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 < 0.5;
}

/** A palette that reads on the slide's background: light text on a dark slide, dark on a light one. */
export function paletteFor(background: string | undefined): SlidePalette {
    const bg = background && background !== 'transparent' ? background : '#ffffff';
    return isDarkColor(bg) ? { ...PALETTES.dark, background: bg } : { ...PALETTES.minimalist, background: bg };
}

const SCALED = ['fontSize', 'strokeWidth', 'borderRadius', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY'] as const;

/**
 * The layout's elements for a slide at (x, y) of size w × h. Generators draw on a 1920 × 1080
 * page; another size is scaled uniformly and centred, fonts and strokes included. `newId`
 * mints a fresh id for each element.
 */
export function layoutElements(
    id: SlideLayoutId,
    slide: { x: number; y: number; w: number; h: number },
    palette: SlidePalette,
    text: LayoutText,
    newId: (type: string) => string,
): DrawingElement[] {
    if (id === 'blank') return [];
    const k = Math.min(slide.w / 1920, slide.h / 1080);
    const ox = slide.x + (slide.w - 1920 * k) / 2;
    const oy = slide.y + (slide.h - 1080 * k) / 2;
    return createSlideElements(content(id, text), palette).map(el => {
        const out: any = { ...el, id: newId(el.type || 'el'), x: ox + (el.x ?? 0) * k, y: oy + (el.y ?? 0) * k,
            width: (el.width ?? 0) * k, height: (el.height ?? 0) * k };
        for (const key of SCALED) if (typeof out[key] === 'number') out[key] = out[key] * k;
        return out as DrawingElement;
    });
}
