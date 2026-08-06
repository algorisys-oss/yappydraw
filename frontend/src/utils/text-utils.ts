import type { DrawingElement } from "../types";
import type { IRenderer } from "../rendering/IRenderer";
import { CanvasRenderer } from "../rendering/CanvasRenderer";
import { fontShorthand } from "./font-variants";

export interface TextMetrics {
    textWidth: number;
    textHeight: number;
    lines: string[];
    lineHeight: number;
}

const fontFamilyMap: Record<string, string> = {
    'hand-drawn': 'Handlee, cursive',
    'sans-serif': 'Inter, sans-serif',
    'monospace': 'Source Code Pro, monospace',
    'caveat': 'Caveat, cursive',
    'poppins': 'Poppins, sans-serif',
    'serif': 'Merriweather, serif',
    'marker': 'Permanent Marker, cursive',
    'code': 'JetBrains Mono, monospace',
};

/** The built-in family stacks, for the boot-time font preload (utils/font-loading.ts). */
export const getBuiltInFontStacks = (): string[] => Object.values(fontFamilyMap);

/**
 * Custom (runtime-registered) font families live on a globalThis-backed map so a
 * registration is visible to EVERY module instance — even if a bundler/dev-server
 * ends up loading two copies of this module. Built-ins stay in the local map.
 */
const customFamilyMap: Record<string, string> =
    ((globalThis as any).__yappyCustomFontMap ||= {});

/**
 * Register a font key → CSS family-stack. Used by the custom-font loader so
 * external fonts resolve exactly like the built-ins (see utils/custom-fonts.ts).
 */
export const registerFontFamily = (key: string, cssFamily: string): void => {
    fontFamilyMap[key] = cssFamily;
    customFamilyMap[key] = cssFamily;
};

export const resolveFontFamily = (fontFamily?: string): string => {
    const key = fontFamily || 'hand-drawn';
    return fontFamilyMap[key] || customFamilyMap[key] || fontFamilyMap['hand-drawn'];
};

/** Reverse-lookup: map a resolved CSS font-family string back to an internal key */
export const reverseFontFamily = (cssFont: string): string | undefined => {
    if (!cssFont) return undefined;
    const lower = cssFont.toLowerCase().replace(/['"]/g, '').trim();
    for (const [key, value] of Object.entries(fontFamilyMap)) {
        const primary = value.split(',')[0].trim().toLowerCase();
        if (lower.includes(primary)) return key;
    }
    return undefined;
};

export const getFontString = (el: Partial<DrawingElement>) => {
    // Weight is a number on the 100–900 axis now, so the old truthiness test would report a
    // plain Regular (400) as bold. `fontShorthand` handles every encoding the field has had.
    return fontShorthand(el.fontWeight, el.fontStyle, el.fontSize || 28, resolveFontFamily(el.fontFamily));
};

// Singleton context for text measurements to avoid DOM overhead in render loops
let sharedMeasurer: CanvasRenderingContext2D | null = null;
let sharedMeasurementRenderer: IRenderer | null = null;
export const getMeasurementContext = (): CanvasRenderingContext2D => {
    if (!sharedMeasurer) {
        const canvas = document.createElement('canvas');
        sharedMeasurer = canvas.getContext('2d')!;
    }
    return sharedMeasurer;
};
export const getMeasurementRenderer = (): IRenderer => {
    if (!sharedMeasurementRenderer) {
        sharedMeasurementRenderer = new CanvasRenderer(getMeasurementContext());
    }
    return sharedMeasurementRenderer;
};

export const wrapText = (
    ctx: IRenderer,
    text: string,
    maxWidth: number,
): string[] => {
    // Split while preserving whitespace segments (captures spaces as separate tokens)
    const parts = text.split(/(\s+)/);
    const lines: string[] = [];
    let currentLine = '';

    for (const part of parts) {
        if (!part) continue;

        const isSpace = /^\s+$/.test(part);
        const testLine = currentLine + part;
        const metrics = ctx.measureText(testLine);

        if (!isSpace && metrics.width > maxWidth && currentLine.trim()) {
            // Wrap: push current line (trim trailing whitespace) and start new with this word
            lines.push(currentLine.replace(/\s+$/, ''));
            currentLine = part;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
};

// Cache for text metrics to avoid re-measuring unchanged text every frame
const _textMetricsCache = new Map<string, TextMetrics>();
const TEXT_METRICS_CACHE_MAX = 500;

/**
 * Fraction of the available width a shape can actually put text in. Shapes that are
 * inefficient with space (a circle's inscribed rectangle, a banner's front panel) wrap
 * narrower than their bounding box.
 *
 * Exported because three places have to agree on it: the wrapper below, `fitShapeToText`,
 * and the on-canvas editing overlay — which wrapped at the full width and so re-flowed the
 * label the instant you double-clicked a circle.
 */
export const inscribedTextFactor = (type?: string): number =>
    type === 'circle' || type === 'diamond' ? 0.707    // sqrt(2)/2 approx
        : type === 'doubleBanner' ? 0.65               // stay within the front panel
            : type === 'lightbulb' ? 0.7               // in bulb
                : type === 'signpost' ? 0.8            // on board
                    : type === 'burstBlob' ? 0.6       // inner radius
                        : 1;

/**
 * The `availableWidth` the container-text renderer measures with — the shape's box minus
 * its text margin, with the few shapes that paint text on a sub-panel narrowed first.
 * Mirrors `RenderPipeline.renderContainerText`.
 */
export const containerTextAvailableWidth = (el: Partial<DrawingElement>): number => {
    const w = el.width || 0;
    if (el.type === 'doubleBanner') return w * 0.65;
    if (el.type === 'lightbulb') return w * 0.7;
    if (el.type === 'signpost') return w * 0.8;
    return w - 20;
};

/** The width container text actually wraps at — what an editing overlay must match. */
export const containerTextWrapWidth = (el: Partial<DrawingElement>): number =>
    containerTextAvailableWidth(el) * inscribedTextFactor(el.type);

export const measureContainerText = (
    ctx: IRenderer,
    el: Partial<DrawingElement>,
    text: string,
    availableWidth: number
): TextMetrics => {
    const fontSize = el.fontSize || 28;
    const fontStr = getFontString(el);
    const letterSpacing = el.letterSpacing || 0;
    const cacheKey = `${text}|${fontStr}|${availableWidth}|${el.type}|${letterSpacing}`;

    const cached = _textMetricsCache.get(cacheKey);
    if (cached) return cached;

    ctx.save();
    ctx.font = fontStr;
    // Tracking widens the text — measure with it so wrapping + the fitted box match
    // what's drawn (Illustrator-style). save()/restore() resets it afterwards.
    ctx.letterSpacing = letterSpacing ? `${letterSpacing}px` : '0px';

    // For shapes that are inefficient with space (circle, diamond),
    // we use a smaller inscribed area for wrapping
    const wrapWidth = availableWidth * inscribedTextFactor(el.type);

    const paragraphs = text.split('\n');
    const lines: string[] = [];

    paragraphs.forEach(paragraph => {
        if (paragraph === '') {
            lines.push(''); // Preserve empty lines
        } else {
            const wrapped = wrapText(ctx, paragraph, wrapWidth);
            lines.push(...wrapped);
        }
    });

    const lineHeight = fontSize * 1.2;

    let maxLineWidth = 0;
    lines.forEach(line => {
        maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
    });

    ctx.restore();

    const result: TextMetrics = {
        textWidth: maxLineWidth,
        textHeight: lines.length * lineHeight,
        lines,
        lineHeight
    };

    // Evict if cache grows too large
    if (_textMetricsCache.size >= TEXT_METRICS_CACHE_MAX) _textMetricsCache.clear();
    _textMetricsCache.set(cacheKey, result);

    return result;
};

export interface VerticalTextLayout {
    width: number;          // element width that exactly fits the columns
    height: number;         // element height that exactly fits the tallest column
    colWidth: number;       // width of one column (uniform)
    vAdvance: number;       // vertical advance per glyph
    columns: string[][];    // glyph runs, one array per \n-paragraph
    padding: number;
}

/**
 * Lay out vertical type: each \n-paragraph is a column of stacked glyphs, columns advance
 * right→left (CJK / Illustrator convention). Column width is uniform (the widest glyph in
 * the whole run + a gap) so columns line up; glyphs are centred within their column. Returns
 * both the geometry to render and the element size that exactly fits it.
 */
export const measureVerticalText = (el: Partial<DrawingElement>): VerticalTextLayout => {
    const ctx = getMeasurementContext();
    ctx.font = getFontString(el);
    ctx.letterSpacing = '0px'; // tracking is horizontal — don't apply to stacked glyphs
    const fontSize = el.fontSize || 28;
    const padding = 6;
    const columns = (el.text || '').split('\n').map(line => [...line]); // spread → surrogate-safe
    let maxGlyph = fontSize * 0.5;
    for (const col of columns) for (const ch of col) {
        const w = ctx.measureText(ch).width;
        if (w > maxGlyph) maxGlyph = w;
    }
    const colWidth = maxGlyph + fontSize * 0.3;     // glyph box + side gap
    const vAdvance = fontSize * 1.15;               // glyph box + leading
    const maxLen = Math.max(1, ...columns.map(c => c.length));
    const width = Math.max(1, columns.length) * colWidth + padding * 2;
    const height = maxLen * vAdvance + padding * 2;
    return { width, height, colWidth, vAdvance, columns, padding };
};

/** Width of the widest \n-line of `text` (used to size a text box when leaving vertical mode). */
export const measureMaxLineWidth = (el: Partial<DrawingElement>): number => {
    const ctx = getMeasurementContext();
    ctx.font = getFontString(el);
    ctx.letterSpacing = el.letterSpacing ? `${el.letterSpacing}px` : '0px';
    let max = 0;
    for (const line of (el.text || '').split('\n')) max = Math.max(max, ctx.measureText(line).width);
    ctx.letterSpacing = '0px'; // shared context — reset so it doesn't leak
    return max;
};

/**
 * Measure the height of wrapped text within a given width.
 * Used for text elements to auto-adjust height based on content.
 */
export const measureWrappedTextHeight = (
    text: string,
    width: number,
    fontSize: number,
    fontFamily?: string,
    letterSpacing?: number
): number => {
    if (!text) return fontSize * 1.2;

    const ctx = getMeasurementRenderer();
    const resolvedFont = resolveFontFamily(fontFamily);
    ctx.font = `${fontSize}px ${resolvedFont}`;
    ctx.letterSpacing = letterSpacing ? `${letterSpacing}px` : '0px';

    const padding = 4;
    const availableWidth = Math.max(width - padding * 2, 20);

    const paragraphs = text.split('\n');
    let totalLines = 0;

    paragraphs.forEach(para => {
        if (para === '') {
            totalLines += 1;
        } else {
            const wrapped = wrapText(ctx, para, availableWidth);
            totalLines += wrapped.length;
        }
    });

    ctx.letterSpacing = '0px'; // shared renderer — reset so it doesn't leak
    const lineHeight = fontSize * 1.2;
    return totalLines * lineHeight;
};

export const fitShapeToText = (
    ctx: IRenderer,
    el: Partial<DrawingElement>,
    text: string
): { width: number, height: number } => {
    if (!text || text.trim() === '') {
        return { width: el.width || 100, height: el.height || 60 };
    }

    const padding = 32;
    const fontSize = el.fontSize || 28;
    const charCount = text.length;

    // Heuristic for initial width guess
    // We want a roughly 2:1 or 3:2 aspect ratio for long text
    const estWidth = Math.sqrt(charCount * fontSize * fontSize * 1.5);
    let targetWrapWidth = Math.max(60, Math.min(500, estWidth));

    let metrics = measureContainerText(ctx, el, text, targetWrapWidth);

    const scaleFactor = inscribedTextFactor(el.type);

    let finalWidth = (metrics.textWidth / scaleFactor) + padding;
    let finalHeight = (metrics.textHeight / scaleFactor) + padding;

    if (el.type === 'circle' || el.type === 'diamond') {
        const size = Math.max(finalWidth, finalHeight);
        return { width: size, height: size };
    }

    // Parallelogram and Trapezoid extra breathing room for the slants
    if (el.type === 'parallelogram' || el.type === 'trapezoid') {
        finalWidth += 40;
    }

    return { width: finalWidth, height: finalHeight };
};

/**
 * Calculate the required height for a UML class shape based on all three sections.
 * Matches the renderer's calculateLayout exactly so there's no extra space.
 * Width is preserved; only height adjusts to fit content.
 */
export const fitUmlClassToContent = (
    ctx: IRenderer,
    el: Partial<DrawingElement>
): { width: number, height: number } => {
    const width = el.width || 200;
    const availWidth = width - 10; // match renderer padding

    // Header — same as renderer: Math.max(30, textHeight + 20)
    const headerText = el.containerText || '';
    let headerHeight = 30;
    if (headerText) {
        const metrics = measureContainerText(ctx, el, headerText, availWidth);
        headerHeight = Math.max(30, metrics.textHeight + 20);
    }

    // Attributes — same as renderer: Math.max(20, textHeight + 10)
    const attrText = (el as any).attributesText || '';
    let attrHeight = 20;
    if (attrText) {
        const attrEl = { ...el, fontSize: (el.fontSize || 20) * 0.9 };
        const metrics = measureContainerText(ctx, attrEl, attrText, availWidth);
        attrHeight = Math.max(20, metrics.textHeight + 10);
    }

    // Methods — same padding as attributes: textHeight + 10
    const methodsText = (el as any).methodsText || '';
    let methodsHeight = 20;
    if (methodsText) {
        const methodEl = { ...el, fontSize: (el.fontSize || 20) * 0.9 };
        const metrics = measureContainerText(ctx, methodEl, methodsText, availWidth);
        methodsHeight = Math.max(20, metrics.textHeight + 10);
    }

    const totalHeight = headerHeight + attrHeight + methodsHeight;
    return { width, height: Math.max(totalHeight, 70) };
};
