/**
 * Slide Element Factory
 * Creates positioned DrawingElement arrays for slide layouts.
 * Shared by: presentation templates, AI slide generator, markdown import.
 *
 * Uses gradients, shadows, shapes, and card layouts for rich visuals.
 */

import type { DrawingElement, ElementType, GradientStop } from '../types';
import type { SlidePalette } from '../types/template-types';

const SLIDE_W = 1920;
const SLIDE_H = 1080;
const PAD = 80;       // slide padding
const PAD_TOP = 60;

// ─── Element Helpers ────────────────────────────────────────

let _counter = 0;
function genId(prefix: string = 'el'): string {
    return `${prefix}-${Date.now()}-${++_counter}`;
}

/** Resolve optional palette tints, filling defaults if missing. */
function resolvePalette(p: SlidePalette): SlidePalette & Required<Pick<SlidePalette, 'primaryLight' | 'accentLight' | 'gradientFrom' | 'gradientTo'>> {
    return {
        ...p,
        primaryLight: p.primaryLight || p.primary + '15',
        accentLight: p.accentLight || p.accent + '20',
        gradientFrom: p.gradientFrom || p.primary,
        gradientTo: p.gradientTo || p.secondary,
    };
}

const BASE_PROPS = {
    roughness: 0,
    angle: 0,
    renderStyle: 'architectural' as const,
    locked: false,
    link: null,
    layerId: 'default-layer',
};

function textEl(
    text: string, x: number, y: number, w: number, h: number,
    opts: {
        fontSize?: number; textAlign?: 'left' | 'center' | 'right';
        textColor?: string; fontFamily?: string; bold?: boolean; italic?: boolean;
        verticalAlign?: 'top' | 'middle' | 'bottom'; opacity?: number;
    } = {}
): Partial<DrawingElement> {
    return {
        id: genId('text'),
        type: 'text',
        x, y, width: w, height: h,
        text,
        fontSize: opts.fontSize ?? 28,
        fontFamily: (opts.fontFamily ?? 'poppins') as any,
        textAlign: opts.textAlign ?? 'left',
        verticalAlign: opts.verticalAlign ?? 'top',
        textColor: opts.textColor ?? '#1e293b',
        fontWeight: opts.bold ? 'bold' : undefined,
        fontStyle: opts.italic ? 'italic' : undefined,
        strokeColor: 'transparent',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 0,
        strokeStyle: 'solid',
        opacity: opts.opacity ?? 100,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        ...BASE_PROPS,
    };
}

function rectEl(
    x: number, y: number, w: number, h: number,
    opts: { backgroundColor?: string; strokeColor?: string; borderRadius?: number; opacity?: number } = {}
): Partial<DrawingElement> {
    const stroke = opts.strokeColor ?? 'transparent';
    return {
        id: genId('rect'),
        type: 'rectangle',
        x, y, width: w, height: h,
        strokeColor: stroke,
        backgroundColor: opts.backgroundColor ?? '#3498db',
        fillStyle: 'solid',
        strokeWidth: stroke !== 'transparent' ? 1 : 0,
        strokeStyle: 'solid',
        opacity: opts.opacity ?? 100,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        borderRadius: opts.borderRadius,
        ...BASE_PROPS,
    };
}

/** Rectangle with linear gradient fill. */
function gradientRectEl(
    x: number, y: number, w: number, h: number,
    stops: GradientStop[], direction: number = 0,
    opts: { borderRadius?: number; opacity?: number; strokeColor?: string } = {}
): Partial<DrawingElement> {
    const stroke = opts.strokeColor ?? 'transparent';
    return {
        id: genId('grad'),
        type: 'rectangle',
        x, y, width: w, height: h,
        strokeColor: stroke,
        backgroundColor: stops[0]?.color ?? '#3498db',
        fillStyle: 'linear' as any,
        gradientStops: stops,
        gradientDirection: direction,
        strokeWidth: stroke !== 'transparent' ? 1 : 0,
        strokeStyle: 'solid',
        opacity: opts.opacity ?? 100,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        borderRadius: opts.borderRadius,
        ...BASE_PROPS,
    };
}

/** Rectangle with drop shadow. */
function cardEl(
    x: number, y: number, w: number, h: number,
    opts: {
        backgroundColor?: string; borderRadius?: number; opacity?: number;
        shadowColor?: string; shadowBlur?: number; strokeColor?: string;
    } = {}
): Partial<DrawingElement> {
    const stroke = opts.strokeColor ?? 'transparent';
    return {
        id: genId('card'),
        type: 'rectangle',
        x, y, width: w, height: h,
        strokeColor: stroke,
        backgroundColor: opts.backgroundColor ?? '#ffffff',
        fillStyle: 'solid',
        strokeWidth: stroke !== 'transparent' ? 1 : 0,
        strokeStyle: 'solid',
        opacity: opts.opacity ?? 100,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        borderRadius: opts.borderRadius ?? 12,
        shadowEnabled: true,
        shadowColor: opts.shadowColor ?? '#00000015',
        shadowBlur: opts.shadowBlur ?? 20,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        ...BASE_PROPS,
    };
}

/** Any shape type (circle, star, diamond, trophy, etc). */
function shapeEl(
    type: ElementType, x: number, y: number, w: number, h: number,
    opts: { backgroundColor?: string; strokeColor?: string; opacity?: number; borderRadius?: number } = {}
): Partial<DrawingElement> {
    const stroke = opts.strokeColor ?? 'transparent';
    return {
        id: genId('shape'),
        type,
        x, y, width: w, height: h,
        strokeColor: stroke,
        backgroundColor: opts.backgroundColor ?? '#3498db',
        fillStyle: 'solid',
        strokeWidth: stroke !== 'transparent' ? 1 : 0,
        strokeStyle: 'solid',
        opacity: opts.opacity ?? 100,
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        borderRadius: opts.borderRadius,
        ...BASE_PROPS,
    };
}

// ─── Slide Layout Functions ─────────────────────────────────

/**
 * Title slide: gradient hero band, large centered title + subtitle + accent bar
 */
export function createTitleSlideElements(
    title: string, subtitle: string | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Gradient hero band at top
    els.push(gradientRectEl(0, 0, SLIDE_W, 8, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.accent },
    ], 90));

    // Decorative circle (bottom-right, subtle)
    els.push(shapeEl('circle', SLIDE_W - 300, SLIDE_H - 300, 400, 400, {
        backgroundColor: p.primaryLight, opacity: 8,
    }));

    // Decorative diamond (top-left, subtle)
    els.push(shapeEl('diamond', -40, -40, 160, 160, {
        backgroundColor: p.accentLight, opacity: 6,
    }));

    // Title
    els.push(textEl(title, PAD, 300, SLIDE_W - PAD * 2, 140, {
        fontSize: 64, textAlign: 'center', textColor: p.text, bold: true,
        verticalAlign: 'middle',
    }));

    // Accent bar with gradient
    els.push(gradientRectEl(SLIDE_W / 2 - 150, 460, 300, 5, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.primary },
    ], 90));

    // Subtitle
    if (subtitle) {
        els.push(textEl(subtitle, PAD + 100, 490, SLIDE_W - PAD * 2 - 200, 80, {
            fontSize: 28, textAlign: 'center', textColor: p.text + 'cc',
        }));
    }

    return els;
}

/**
 * Content slide: left accent stripe, title, bullet list in card area
 */
export function createContentSlideElements(
    title: string, bullets: string[] | undefined, body: string | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Left accent stripe (gradient)
    els.push(gradientRectEl(0, 0, 6, SLIDE_H, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.accent },
    ], 180));

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W - PAD * 2, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    // Title underline (gradient)
    els.push(gradientRectEl(PAD, PAD_TOP + 85, 120, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    if (bullets && bullets.length > 0) {
        // Card background for bullet area
        els.push(cardEl(PAD - 10, 160, SLIDE_W - PAD * 2 + 20, Math.min(bullets.length * 70 + 40, SLIDE_H - 220), {
            backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
            shadowColor: '#00000008', shadowBlur: 12,
        }));

        const startY = 180;
        const lineH = 70;
        bullets.forEach((bullet, i) => {
            // Bullet circle shape
            els.push(shapeEl('circle', PAD + 10, startY + i * lineH + 10, 14, 14, {
                backgroundColor: p.accent,
            }));
            // Bullet text
            els.push(textEl(bullet, PAD + 40, startY + i * lineH, SLIDE_W - PAD * 2 - 60, lineH - 10, {
                fontSize: 26, textColor: p.text,
            }));
        });
    } else if (body) {
        els.push(textEl(body, PAD, 180, SLIDE_W - PAD * 2, SLIDE_H - 260, {
            fontSize: 24, textColor: p.text,
        }));
    }

    return els;
}

/**
 * Two-column slide: title + card containers for each column
 */
export function createTwoColumnElements(
    title: string, leftItems: string[] | undefined, rightItems: string[] | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W - PAD * 2, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    els.push(gradientRectEl(PAD, PAD_TOP + 85, 120, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    const colW = SLIDE_W / 2 - PAD - 20;
    const cardTop = 170;
    const cardH = SLIDE_H - cardTop - PAD;

    // Left column card
    els.push(cardEl(PAD, cardTop, colW, cardH, {
        backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
        shadowColor: '#00000010',
    }));

    // Right column card
    els.push(cardEl(SLIDE_W / 2 + 10, cardTop, colW, cardH, {
        backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
        shadowColor: '#00000010',
    }));

    const startY = cardTop + 20;
    const lineH = 65;

    // Left column items
    (leftItems || []).forEach((item, i) => {
        els.push(shapeEl('circle', PAD + 20, startY + i * lineH + 10, 10, 10, {
            backgroundColor: p.accent,
        }));
        els.push(textEl(item, PAD + 45, startY + i * lineH, colW - 60, lineH - 10, {
            fontSize: 24, textColor: p.text,
        }));
    });

    // Right column items
    (rightItems || []).forEach((item, i) => {
        const rightX = SLIDE_W / 2 + 10;
        els.push(shapeEl('circle', rightX + 20, startY + i * lineH + 10, 10, 10, {
            backgroundColor: p.primary,
        }));
        els.push(textEl(item, rightX + 45, startY + i * lineH, colW - 60, lineH - 10, {
            fontSize: 24, textColor: p.text,
        }));
    });

    return els;
}

/**
 * Quote slide: gradient accent band, large quote, attribution
 */
export function createQuoteElements(
    quoteText: string, attribution: string | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Gradient accent band at left edge
    els.push(gradientRectEl(0, 0, 10, SLIDE_H, [
        { offset: 0, color: p.gradientFrom },
        { offset: 0.5, color: p.accent },
        { offset: 1, color: p.gradientTo },
    ], 180));

    // Subtle background shape
    els.push(shapeEl('circle', SLIDE_W - 250, SLIDE_H - 250, 350, 350, {
        backgroundColor: p.primaryLight, opacity: 6,
    }));

    // Large opening quote mark
    els.push(textEl('\u201C', PAD + 60, 200, 200, 200, {
        fontSize: 160, textColor: p.accent + '44', textAlign: 'left',
    }));

    // Quote text
    els.push(textEl(quoteText, PAD + 120, 340, SLIDE_W - PAD * 2 - 240, 300, {
        fontSize: 36, textColor: p.text, italic: true, textAlign: 'center',
        verticalAlign: 'middle',
    }));

    // Attribution
    if (attribution) {
        els.push(gradientRectEl(SLIDE_W / 2 - 40, 660, 80, 3, [
            { offset: 0, color: p.accent + '00' },
            { offset: 0.5, color: p.accent },
            { offset: 1, color: p.accent + '00' },
        ], 90));
        els.push(textEl(`\u2014 ${attribution}`, PAD + 120, 680, SLIDE_W - PAD * 2 - 240, 50, {
            fontSize: 22, textColor: p.text + 'aa', textAlign: 'center',
        }));
    }

    return els;
}

/**
 * Section break: gradient background, decorative shapes, centered title
 */
export function createSectionBreakElements(
    title: string, subtitle: string | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Full gradient background
    els.push(gradientRectEl(0, 0, SLIDE_W, SLIDE_H, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.gradientTo },
    ], 135));

    // Decorative diamond shapes (corners, low opacity)
    els.push(shapeEl('diamond', -30, -30, 120, 120, { backgroundColor: '#ffffff', opacity: 8 }));
    els.push(shapeEl('diamond', SLIDE_W - 90, SLIDE_H - 90, 120, 120, { backgroundColor: '#ffffff', opacity: 8 }));

    // Thin horizontal line
    els.push(rectEl(SLIDE_W / 2 - 200, SLIDE_H / 2 - 100, 400, 2, { backgroundColor: '#ffffff33' }));

    // Title
    els.push(textEl(title, PAD, SLIDE_H / 2 - 60, SLIDE_W - PAD * 2, 100, {
        fontSize: 56, textAlign: 'center', textColor: '#ffffff', bold: true,
        verticalAlign: 'middle',
    }));

    // Thin horizontal line below
    els.push(rectEl(SLIDE_W / 2 - 200, SLIDE_H / 2 + 50, 400, 2, { backgroundColor: '#ffffff33' }));

    if (subtitle) {
        els.push(textEl(subtitle, PAD + 200, SLIDE_H / 2 + 70, SLIDE_W - PAD * 2 - 400, 60, {
            fontSize: 24, textAlign: 'center', textColor: '#ffffffcc',
        }));
    }

    return els;
}

/**
 * Closing slide: gradient accent band, decorative shapes, title + CTA
 */
export function createClosingElements(
    title: string, subtitle: string | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Bottom gradient accent band
    els.push(gradientRectEl(0, SLIDE_H - 8, SLIDE_W, 8, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.accent },
    ], 90));

    // Decorative star shape (subtle)
    els.push(shapeEl('star', SLIDE_W - 200, 60, 100, 100, {
        backgroundColor: p.accentLight, opacity: 10,
    }));

    // Title
    els.push(textEl(title, PAD, SLIDE_H / 2 - 100, SLIDE_W - PAD * 2, 120, {
        fontSize: 60, textAlign: 'center', textColor: p.primary, bold: true,
        verticalAlign: 'middle',
    }));

    // Accent bar (gradient)
    els.push(gradientRectEl(SLIDE_W / 2 - 100, SLIDE_H / 2 + 30, 200, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.primary },
    ], 90));

    if (subtitle) {
        els.push(textEl(subtitle, PAD + 200, SLIDE_H / 2 + 60, SLIDE_W - PAD * 2 - 400, 60, {
            fontSize: 24, textAlign: 'center', textColor: p.text + 'aa',
        }));
    }

    return els;
}

/**
 * Image-text slide: gradient placeholder with shadow, title + body
 */
export function createImageTextElements(
    title: string, body: string | undefined,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W / 2 - PAD, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    els.push(gradientRectEl(PAD, PAD_TOP + 85, 100, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    // Body text (left half)
    if (body) {
        els.push(textEl(body, PAD, 180, SLIDE_W / 2 - PAD - 40, SLIDE_H - 260, {
            fontSize: 22, textColor: p.text,
        }));
    }

    // Image placeholder card (right half) with gradient + shadow
    els.push(cardEl(SLIDE_W / 2 + 20, PAD_TOP, SLIDE_W / 2 - PAD - 20, SLIDE_H - PAD_TOP - PAD, {
        backgroundColor: p.primaryLight,
        strokeColor: p.primary + '33',
        shadowColor: '#00000012',
    }));
    els.push(textEl('Image', SLIDE_W / 2 + 20, SLIDE_H / 2 - 30, SLIDE_W / 2 - PAD - 20, 60, {
        fontSize: 24, textAlign: 'center', textColor: p.primary + '55',
        verticalAlign: 'middle',
    }));

    return els;
}

// ─── NEW: Rich Slide Layout Types ───────────────────────────

/**
 * Metrics slide: 3-4 large metric cards in a row with gradient accents
 */
export function createMetricsSlideElements(
    title: string,
    metrics: { value: string; label: string }[],
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Left accent stripe
    els.push(gradientRectEl(0, 0, 6, SLIDE_H, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.accent },
    ], 180));

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W - PAD * 2, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    els.push(gradientRectEl(PAD, PAD_TOP + 85, 120, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    // Metric cards
    const count = Math.min(metrics.length, 4);
    const gap = 30;
    const totalGaps = (count - 1) * gap;
    const cardW = (SLIDE_W - PAD * 2 - totalGaps) / count;
    const cardTop = 200;
    const cardH = 340;

    metrics.slice(0, 4).forEach((metric, i) => {
        const cx = PAD + i * (cardW + gap);

        // Card with shadow
        els.push(cardEl(cx, cardTop, cardW, cardH, {
            backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
            shadowColor: '#00000012', shadowBlur: 24,
        }));

        // Gradient accent bar at top of card
        els.push(gradientRectEl(cx, cardTop, cardW, 5, [
            { offset: 0, color: p.gradientFrom },
            { offset: 1, color: p.accent },
        ], 90, { borderRadius: 12 }));

        // Large value
        els.push(textEl(metric.value, cx + 20, cardTop + 60, cardW - 40, 100, {
            fontSize: 56, textAlign: 'center', textColor: p.primary, bold: true,
            verticalAlign: 'middle',
        }));

        // Thin separator
        els.push(rectEl(cx + cardW / 2 - 30, cardTop + 170, 60, 3, {
            backgroundColor: p.accent + '66',
        }));

        // Label
        els.push(textEl(metric.label, cx + 20, cardTop + 200, cardW - 40, 80, {
            fontSize: 20, textAlign: 'center', textColor: p.text + 'aa',
            verticalAlign: 'top',
        }));
    });

    return els;
}

/**
 * Timeline slide: horizontal timeline bar with milestone dots and labels
 */
export function createTimelineSlideElements(
    title: string,
    items: { year: string; text: string }[],
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W - PAD * 2, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    els.push(gradientRectEl(PAD, PAD_TOP + 85, 120, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    const count = Math.min(items.length, 6);
    const barY = 420;
    const barLeft = PAD + 60;
    const barRight = SLIDE_W - PAD - 60;
    const barW = barRight - barLeft;

    // Horizontal timeline bar (gradient)
    els.push(gradientRectEl(barLeft, barY, barW, 4, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.accent },
    ], 90));

    items.slice(0, 6).forEach((item, i) => {
        const ratio = count === 1 ? 0.5 : i / (count - 1);
        const cx = barLeft + ratio * barW;

        // Milestone dot (circle shape)
        els.push(shapeEl('circle', cx - 12, barY - 10, 24, 24, {
            backgroundColor: p.primary,
        }));

        // Outer ring
        els.push(shapeEl('circle', cx - 18, barY - 16, 36, 36, {
            backgroundColor: 'transparent',
            strokeColor: p.primary + '44',
        }));

        // Year label (above)
        els.push(textEl(item.year, cx - 60, barY - 70, 120, 40, {
            fontSize: 20, textAlign: 'center', textColor: p.primary, bold: true,
        }));

        // Description (below)
        els.push(textEl(item.text, cx - 90, barY + 40, 180, 100, {
            fontSize: 16, textAlign: 'center', textColor: p.text + 'cc',
        }));
    });

    return els;
}

/**
 * Card grid slide: 2x2 or 1x3 cards with optional icons
 */
export function createCardGridSlideElements(
    title: string,
    cards: { title: string; body: string; icon?: string }[],
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Left accent stripe
    els.push(gradientRectEl(0, 0, 6, SLIDE_H, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.accent },
    ], 180));

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W - PAD * 2, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    els.push(gradientRectEl(PAD, PAD_TOP + 85, 120, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    const count = Math.min(cards.length, 6);
    const gap = 24;
    const cardTop = 180;

    // Map icon strings to valid shape types
    const iconMap: Record<string, ElementType> = {
        gear: 'gear', target: 'target', lightbulb: 'lightbulb', trophy: 'trophy',
        rocket: 'rocket', flag: 'flag', star: 'star', heart: 'heart',
        shield: 'shield', key: 'key', book: 'book', eye: 'eye',
        clock: 'clock', check: 'checkmark', chart: 'barChart', user: 'user',
    };

    if (count <= 3) {
        // Single row layout
        const cardW = (SLIDE_W - PAD * 2 - (count - 1) * gap) / count;
        const cardH = SLIDE_H - cardTop - PAD;

        cards.slice(0, 3).forEach((card, i) => {
            const cx = PAD + i * (cardW + gap);

            els.push(cardEl(cx, cardTop, cardW, cardH, {
                backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
                shadowColor: '#00000010', shadowBlur: 20,
            }));

            // Gradient accent at top
            els.push(gradientRectEl(cx, cardTop, cardW, 4, [
                { offset: 0, color: p.gradientFrom },
                { offset: 1, color: p.accent },
            ], 90, { borderRadius: 12 }));

            // Icon shape (if provided)
            const iconType = card.icon ? iconMap[card.icon.toLowerCase()] : undefined;
            let textStartY = cardTop + 30;
            if (iconType) {
                els.push(shapeEl(iconType, cx + cardW / 2 - 25, cardTop + 30, 50, 50, {
                    backgroundColor: p.primary + '22', strokeColor: p.primary,
                }));
                textStartY = cardTop + 100;
            }

            // Card title
            els.push(textEl(card.title, cx + 20, textStartY, cardW - 40, 50, {
                fontSize: 22, textColor: p.primary, bold: true, textAlign: 'center',
            }));

            // Card body
            els.push(textEl(card.body, cx + 20, textStartY + 55, cardW - 40, cardH - (textStartY - cardTop) - 80, {
                fontSize: 16, textColor: p.text + 'cc', textAlign: 'center',
            }));
        });
    } else {
        // 2x2 or 2x3 grid
        const cols = count <= 4 ? 2 : 3;
        const rows = Math.ceil(count / cols);
        const cardW = (SLIDE_W - PAD * 2 - (cols - 1) * gap) / cols;
        const availH = SLIDE_H - cardTop - PAD;
        const cardH = (availH - (rows - 1) * gap) / rows;

        cards.slice(0, 6).forEach((card, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = PAD + col * (cardW + gap);
            const cy = cardTop + row * (cardH + gap);

            els.push(cardEl(cx, cy, cardW, cardH, {
                backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
                shadowColor: '#00000010', shadowBlur: 16,
            }));

            // Top accent
            els.push(gradientRectEl(cx, cy, cardW, 3, [
                { offset: 0, color: p.gradientFrom },
                { offset: 1, color: p.accent },
            ], 90, { borderRadius: 12 }));

            // Icon
            const iconType = card.icon ? iconMap[card.icon.toLowerCase()] : undefined;
            let textStartY = cy + 20;
            if (iconType) {
                els.push(shapeEl(iconType, cx + 20, cy + 20, 36, 36, {
                    backgroundColor: p.primary + '22', strokeColor: p.primary,
                }));
                textStartY = cy + 20;
                // Card title (next to icon)
                els.push(textEl(card.title, cx + 65, textStartY, cardW - 85, 40, {
                    fontSize: 20, textColor: p.primary, bold: true,
                }));
            } else {
                els.push(textEl(card.title, cx + 20, textStartY, cardW - 40, 40, {
                    fontSize: 20, textColor: p.primary, bold: true,
                }));
            }

            // Card body
            els.push(textEl(card.body, cx + 20, textStartY + 45, cardW - 40, cardH - 85, {
                fontSize: 15, textColor: p.text + 'cc',
            }));
        });
    }

    return els;
}

/**
 * Comparison slide: two side-by-side cards with gradient headers
 */
export function createComparisonSlideElements(
    title: string,
    leftTitle: string, rightTitle: string,
    leftItems: string[], rightItems: string[],
    palette: SlidePalette
): Partial<DrawingElement>[] {
    const p = resolvePalette(palette);
    const els: Partial<DrawingElement>[] = [];

    // Title
    els.push(textEl(title, PAD, PAD_TOP, SLIDE_W - PAD * 2, 80, {
        fontSize: 40, textColor: p.primary, bold: true,
    }));

    els.push(gradientRectEl(PAD, PAD_TOP + 85, 120, 4, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + '00' },
    ], 90));

    const gap = 30;
    const colW = (SLIDE_W - PAD * 2 - gap) / 2;
    const cardTop = 170;
    const cardH = SLIDE_H - cardTop - PAD;
    const headerH = 60;

    // Left card
    els.push(cardEl(PAD, cardTop, colW, cardH, {
        backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
        shadowColor: '#00000012',
    }));
    // Left header gradient
    els.push(gradientRectEl(PAD, cardTop, colW, headerH, [
        { offset: 0, color: p.gradientFrom },
        { offset: 1, color: p.primary + 'cc' },
    ], 90, { borderRadius: 12 }));
    els.push(textEl(leftTitle, PAD + 20, cardTop + 10, colW - 40, 40, {
        fontSize: 22, textColor: '#ffffff', bold: true, verticalAlign: 'middle',
    }));

    // Right card
    els.push(cardEl(SLIDE_W / 2 + gap / 2, cardTop, colW, cardH, {
        backgroundColor: p.background === '#ffffff' ? '#fafbfc' : p.background + 'ee',
        shadowColor: '#00000012',
    }));
    // Right header gradient (accent color)
    els.push(gradientRectEl(SLIDE_W / 2 + gap / 2, cardTop, colW, headerH, [
        { offset: 0, color: p.accent },
        { offset: 1, color: p.accent + 'cc' },
    ], 90, { borderRadius: 12 }));
    els.push(textEl(rightTitle, SLIDE_W / 2 + gap / 2 + 20, cardTop + 10, colW - 40, 40, {
        fontSize: 22, textColor: '#ffffff', bold: true, verticalAlign: 'middle',
    }));

    // Left items
    const itemStartY = cardTop + headerH + 20;
    const lineH = 55;
    (leftItems || []).forEach((item, i) => {
        els.push(shapeEl('circle', PAD + 20, itemStartY + i * lineH + 8, 10, 10, {
            backgroundColor: p.primary,
        }));
        els.push(textEl(item, PAD + 45, itemStartY + i * lineH, colW - 70, lineH - 10, {
            fontSize: 20, textColor: p.text,
        }));
    });

    // Right items
    (rightItems || []).forEach((item, i) => {
        const rx = SLIDE_W / 2 + gap / 2;
        els.push(shapeEl('circle', rx + 20, itemStartY + i * lineH + 8, 10, 10, {
            backgroundColor: p.accent,
        }));
        els.push(textEl(item, rx + 45, itemStartY + i * lineH, colW - 70, lineH - 10, {
            fontSize: 20, textColor: p.text,
        }));
    });

    return els;
}

// ─── Palette Presets ────────────────────────────────────────

export const PALETTES: Record<string, SlidePalette> = {
    corporate: {
        primary: '#3498db', secondary: '#1e3a5f', accent: '#e74c3c', background: '#ffffff', text: '#1e293b',
        primaryLight: '#3498db15', accentLight: '#e74c3c20', gradientFrom: '#3498db', gradientTo: '#1e3a5f',
    },
    forest: {
        primary: '#27ae60', secondary: '#1a4d2e', accent: '#f39c12', background: '#f9fafb', text: '#1e293b',
        primaryLight: '#27ae6015', accentLight: '#f39c1220', gradientFrom: '#27ae60', gradientTo: '#1a4d2e',
    },
    royal: {
        primary: '#8b5cf6', secondary: '#3b1f6e', accent: '#f59e0b', background: '#faf5ff', text: '#1e293b',
        primaryLight: '#8b5cf615', accentLight: '#f59e0b20', gradientFrom: '#8b5cf6', gradientTo: '#3b1f6e',
    },
    sunset: {
        primary: '#f97316', secondary: '#7c2d12', accent: '#3b82f6', background: '#fffbeb', text: '#1e293b',
        primaryLight: '#f9731615', accentLight: '#3b82f620', gradientFrom: '#f97316', gradientTo: '#7c2d12',
    },
    dark: {
        primary: '#60a5fa', secondary: '#0f172a', accent: '#fbbf24', background: '#1e293b', text: '#f1f5f9',
        primaryLight: '#60a5fa15', accentLight: '#fbbf2420', gradientFrom: '#60a5fa', gradientTo: '#3b82f6',
    },
    minimalist: {
        primary: '#334155', secondary: '#0f172a', accent: '#3b82f6', background: '#ffffff', text: '#1e293b',
        primaryLight: '#33415515', accentLight: '#3b82f620', gradientFrom: '#334155', gradientTo: '#0f172a',
    },
};

// ─── High-level: AI Slide Spec → Elements ───────────────────

export interface AISlideContent {
    slideType: 'title' | 'content' | 'two-column' | 'image-text' | 'bullets' | 'quote' | 'section-break' | 'closing'
        | 'metrics' | 'timeline' | 'card-grid' | 'comparison';
    title?: string;
    subtitle?: string;
    bullets?: string[];
    body?: string;
    quote?: { text: string; attribution?: string };
    leftColumn?: string[];
    rightColumn?: string[];
    backgroundColor?: string;
    // New rich layout fields
    metrics?: { value: string; label: string }[];
    timelineItems?: { year: string; text: string }[];
    cards?: { title: string; body: string; icon?: string }[];
    comparisonLeft?: { title: string; items: string[] };
    comparisonRight?: { title: string; items: string[] };
}

/**
 * Convert an AI slide content spec into positioned elements.
 */
export function createSlideElements(
    slide: AISlideContent,
    palette: SlidePalette
): Partial<DrawingElement>[] {
    switch (slide.slideType) {
        case 'title':
            return createTitleSlideElements(slide.title || 'Untitled', slide.subtitle, palette);
        case 'content':
        case 'bullets':
            return createContentSlideElements(slide.title || '', slide.bullets, slide.body, palette);
        case 'two-column':
            return createTwoColumnElements(slide.title || '', slide.leftColumn, slide.rightColumn, palette);
        case 'quote':
            return createQuoteElements(
                slide.quote?.text || slide.body || '',
                slide.quote?.attribution || slide.subtitle,
                palette
            );
        case 'section-break':
            return createSectionBreakElements(slide.title || '', slide.subtitle, palette);
        case 'closing':
            return createClosingElements(slide.title || 'Thank You', slide.subtitle, palette);
        case 'image-text':
            return createImageTextElements(slide.title || '', slide.body, palette);
        case 'metrics':
            return createMetricsSlideElements(slide.title || '', slide.metrics || [], palette);
        case 'timeline':
            return createTimelineSlideElements(slide.title || '', slide.timelineItems || [], palette);
        case 'card-grid':
            return createCardGridSlideElements(slide.title || '', slide.cards || [], palette);
        case 'comparison':
            return createComparisonSlideElements(
                slide.title || '',
                slide.comparisonLeft?.title || 'Option A',
                slide.comparisonRight?.title || 'Option B',
                slide.comparisonLeft?.items || [],
                slide.comparisonRight?.items || [],
                palette
            );
        default:
            return createContentSlideElements(slide.title || '', slide.bullets, slide.body, palette);
    }
}

/**
 * Offset all elements to absolute slide position in the spatial canvas.
 */
export function offsetElements(elements: Partial<DrawingElement>[], slideOriginX: number, slideOriginY: number = 0): DrawingElement[] {
    return elements.map(el => ({
        ...el,
        x: (el.x || 0) + slideOriginX,
        y: (el.y || 0) + slideOriginY,
    })) as DrawingElement[];
}
