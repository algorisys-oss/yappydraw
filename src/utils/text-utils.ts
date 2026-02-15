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

export const resolveFontFamily = (fontFamily?: string): string => {
    return fontFamilyMap[fontFamily || 'hand-drawn'] || fontFamilyMap['hand-drawn'];
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
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if (!word) continue;
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
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
