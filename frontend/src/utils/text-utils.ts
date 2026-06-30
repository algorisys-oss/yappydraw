import type { DrawingElement } from "../types";
import type { IRenderer } from "../rendering/IRenderer";
import { CanvasRenderer } from "../rendering/CanvasRenderer";

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

/**
 * Register a font key → CSS family-stack. Used by the custom-font loader so
 * external fonts resolve exactly like the built-ins (see utils/custom-fonts.ts).
 */
export const registerFontFamily = (key: string, cssFamily: string): void => {
    fontFamilyMap[key] = cssFamily;
};

export const resolveFontFamily = (fontFamily?: string): string => {
    return fontFamilyMap[fontFamily || 'hand-drawn'] || fontFamilyMap['hand-drawn'];
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
    const fontSize = el.fontSize || 28;
    const fontFamily = resolveFontFamily(el.fontFamily);
    const fontWeight = el.fontWeight ? (typeof el.fontWeight === 'string' ? el.fontWeight + ' ' : 'bold ') : '';
    const fontStyle = el.fontStyle ? (typeof el.fontStyle === 'string' ? el.fontStyle + ' ' : 'italic ') : '';
    return `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
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

export const measureContainerText = (
    ctx: IRenderer,
    el: Partial<DrawingElement>,
    text: string,
    availableWidth: number
): TextMetrics => {
    const fontSize = el.fontSize || 28;
    const fontStr = getFontString(el);
    const cacheKey = `${text}|${fontStr}|${availableWidth}|${el.type}`;

    const cached = _textMetricsCache.get(cacheKey);
    if (cached) return cached;

    ctx.save();
    ctx.font = fontStr;

    // For shapes that are inefficient with space (circle, diamond),
    // we use a smaller inscribed area for wrapping
    let wrapWidth = availableWidth;
    if (el.type === 'circle' || el.type === 'diamond') {
        wrapWidth = availableWidth * 0.707; // sqrt(2)/2 approx
    } else if (el.type === 'doubleBanner') {
        wrapWidth = availableWidth * 0.65; // Stay within the front panel
    } else if (el.type === 'lightbulb') {
        wrapWidth = availableWidth * 0.7; // In bulb
    } else if (el.type === 'signpost') {
        wrapWidth = availableWidth * 0.8; // On board
    } else if (el.type === 'burstBlob') {
        wrapWidth = availableWidth * 0.6; // Inner radius
    }

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
    let max = 0;
    for (const line of (el.text || '').split('\n')) max = Math.max(max, ctx.measureText(line).width);
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
    fontFamily?: string
): number => {
    if (!text) return fontSize * 1.2;

    const ctx = getMeasurementRenderer();
    const resolvedFont = resolveFontFamily(fontFamily);
    ctx.font = `${fontSize}px ${resolvedFont}`;

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

    const scaleFactor = (el.type === 'circle' || el.type === 'diamond') ? 0.707 :
        (el.type === 'doubleBanner' ? 0.65 :
            (el.type === 'lightbulb' ? 0.7 :
                (el.type === 'signpost' ? 0.8 :
                    (el.type === 'burstBlob' ? 0.6 : 1))));

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
