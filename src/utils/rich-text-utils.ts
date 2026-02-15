/**
 * Rich Text Utilities
 * Conversion between DOM ↔ RichTextSpan[], layout engine for canvas rendering.
 */

import type { RichTextSpan, FontFamily } from '../types';
import { resolveFontFamily } from './text-utils';
import type { IRenderer } from '../rendering/IRenderer';
import { CanvasRenderer } from '../rendering/CanvasRenderer';

// ============ Span ↔ HTML Conversion ============

/**
 * Convert RichTextSpan[] to HTML string for contenteditable rendering.
 */
export function spansToHtml(spans: RichTextSpan[]): string {
    return spans.map(span => {
        const styles: string[] = [];
        if (span.bold) styles.push('font-weight:bold');
        if (span.italic) styles.push('font-style:italic');
        const decorations: string[] = [];
        if (span.underline) decorations.push('underline');
        if (span.strikethrough) decorations.push('line-through');
        if (decorations.length) styles.push(`text-decoration:${decorations.join(' ')}`);
        if (span.color) styles.push(`color:${span.color}`);
        if (span.fontSize) styles.push(`font-size:${span.fontSize}px`);
        if (span.fontFamily) styles.push(`font-family:${resolveFontFamily(span.fontFamily)}`);

        const escaped = span.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        if (styles.length === 0) return escaped;
        return `<span style="${styles.join(';')}">${escaped}</span>`;
    }).join('');
}

/**
 * Parse a contenteditable div's DOM back into RichTextSpan[].
 */
export function htmlToSpans(container: HTMLElement): RichTextSpan[] {
    const spans: RichTextSpan[] = [];

    function walk(node: Node, inherited: Partial<RichTextSpan>) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || '';
            if (text.length > 0) {
                const span: RichTextSpan = { text };
                if (inherited.bold) span.bold = true;
                if (inherited.italic) span.italic = true;
                if (inherited.underline) span.underline = true;
                if (inherited.strikethrough) span.strikethrough = true;
                if (inherited.color) span.color = inherited.color;
                if (inherited.fontSize) span.fontSize = inherited.fontSize;
                if (inherited.fontFamily) span.fontFamily = inherited.fontFamily;
                spans.push(span);
            }
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;

        // Handle <br> as newline
        if (el.tagName === 'BR') {
            spans.push({ text: '\n' });
            return;
        }

        // Build inherited style from this element
        const style = { ...inherited };
        const tag = el.tagName.toLowerCase();

        // Semantic tags
        if (tag === 'b' || tag === 'strong') style.bold = true;
        if (tag === 'i' || tag === 'em') style.italic = true;
        if (tag === 'u') style.underline = true;
        if (tag === 's' || tag === 'strike' || tag === 'del') style.strikethrough = true;

        // Inline styles
        if (el.style.fontWeight === 'bold' || el.style.fontWeight === '700') style.bold = true;
        if (el.style.fontStyle === 'italic') style.italic = true;
        if (el.style.textDecoration?.includes('underline')) style.underline = true;
        if (el.style.textDecoration?.includes('line-through')) style.strikethrough = true;
        if (el.style.textDecorationLine?.includes('underline')) style.underline = true;
        if (el.style.textDecorationLine?.includes('line-through')) style.strikethrough = true;
        if (el.style.color) style.color = el.style.color;
        if (el.style.fontSize) {
            const px = parseFloat(el.style.fontSize);
            if (!isNaN(px)) style.fontSize = px;
        }

        // Block elements (div/p): add newline before if preceded by non-block sibling
        // Handles DOM structures like: text<div>next line</div> where the browser
        // wraps subsequent lines in divs but leaves the first line as a text node
        const isBlock = tag === 'div' || tag === 'p';
        if (isBlock && el.previousSibling) {
            const prevTag = (el.previousSibling as HTMLElement).tagName?.toLowerCase?.();
            // Skip if previous sibling is already a block (handled by post-block \n)
            // or a <br> (which already emits its own \n)
            if (prevTag !== 'div' && prevTag !== 'p' && prevTag !== 'br') {
                spans.push({ text: '\n' });
            }
        }

        // Recurse children
        for (const child of Array.from(el.childNodes)) {
            walk(child, style);
        }

        // Block elements (div/p) insert newline after unless it's the last child
        if (isBlock && el.nextSibling) {
            spans.push({ text: '\n' });
        }
    }

    for (const child of Array.from(container.childNodes)) {
        walk(child, {});
    }

    return mergeAdjacentSpans(spans);
}

/**
 * Merge adjacent spans with identical formatting.
 */
export function mergeAdjacentSpans(spans: RichTextSpan[]): RichTextSpan[] {
    if (spans.length === 0) return [];
    const result: RichTextSpan[] = [{ ...spans[0] }];
    for (let i = 1; i < spans.length; i++) {
        const prev = result[result.length - 1];
        const cur = spans[i];
        if (sameFormatting(prev, cur)) {
            prev.text += cur.text;
        } else {
            result.push({ ...cur });
        }
    }
    return result;
}

function sameFormatting(a: RichTextSpan, b: RichTextSpan): boolean {
    return (!!a.bold === !!b.bold) &&
        (!!a.italic === !!b.italic) &&
        (!!a.underline === !!b.underline) &&
        (!!a.strikethrough === !!b.strikethrough) &&
        ((a.color || '') === (b.color || '')) &&
        ((a.fontSize || 0) === (b.fontSize || 0)) &&
        ((a.fontFamily || '') === (b.fontFamily || ''));
}

/**
 * Convert RichTextSpan[] to plain text.
 */
export function spansToPlainText(spans: RichTextSpan[]): string {
    return spans.map(s => s.text).join('');
}

/**
 * Convert plain text to a single RichTextSpan.
 */
export function plainTextToSpans(text: string): RichTextSpan[] {
    if (!text) return [];
    return [{ text }];
}

// ============ Layout Engine ============

/** A positioned segment ready for canvas rendering. */
export interface RichTextSegment {
    text: string;
    x: number;
    width: number;
    span: RichTextSpan;
    lineIndex: number;
}

export interface RichTextLayout {
    segments: RichTextSegment[];
    totalHeight: number;
    lineCount: number;
    lineHeights: number[];
}

interface Token {
    text: string;
    span: RichTextSpan;
    isNewline: boolean;
    isWhitespace: boolean;
}

/**
 * Build a CSS font string from a span + element defaults.
 */
export function buildSpanFontString(
    span: RichTextSpan,
    defaults: { fontSize?: number; fontFamily?: string }
): string {
    const fontSize = span.fontSize || defaults.fontSize || 28;
    const fontFamily = resolveFontFamily((span.fontFamily || defaults.fontFamily) as FontFamily);
    const weight = span.bold ? 'bold ' : '';
    const style = span.italic ? 'italic ' : '';
    return `${style}${weight}${fontSize}px ${fontFamily}`;
}

function getLineHeight(fontSize: number): number {
    return fontSize * 1.2;
}

/**
 * Layout rich text spans within a max width, handling word wrapping across
 * span boundaries. Returns positioned segments for canvas rendering.
 */
export function layoutRichText(
    ctx: IRenderer,
    spans: RichTextSpan[],
    maxWidth: number,
    elementDefaults: { fontSize?: number; fontFamily?: string }
): RichTextLayout {
    const segments: RichTextSegment[] = [];
    const lineHeights: number[] = [];

    let currentX = 0;
    let currentLineIndex = 0;
    let currentLineHeight = 0;

    // Tokenize spans into words and whitespace
    const tokens: Token[] = [];
    for (const span of spans) {
        const parts = span.text.split(/(\n)/);
        for (const part of parts) {
            if (part === '\n') {
                tokens.push({ text: '\n', span, isNewline: true, isWhitespace: false });
                continue;
            }
            const words = part.split(/(\s+)/);
            for (const word of words) {
                if (!word) continue;
                tokens.push({
                    text: word,
                    span,
                    isNewline: false,
                    isWhitespace: /^\s+$/.test(word)
                });
            }
        }
    }

    const finishLine = () => {
        lineHeights.push(currentLineHeight || getLineHeight(elementDefaults.fontSize || 28));
        currentLineIndex++;
        currentX = 0;
        currentLineHeight = 0;
    };

    for (const token of tokens) {
        if (token.isNewline) {
            finishLine();
            continue;
        }

        const fontSize = token.span.fontSize || elementDefaults.fontSize || 28;
        const lh = getLineHeight(fontSize);
        currentLineHeight = Math.max(currentLineHeight, lh);

        ctx.font = buildSpanFontString(token.span, elementDefaults);
        const measured = ctx.measureText(token.text);

        // Word wrap
        if (!token.isWhitespace && currentX + measured.width > maxWidth && currentX > 0) {
            finishLine();
            currentLineHeight = Math.max(currentLineHeight, lh);
        }

        // Skip leading whitespace on new line
        if (token.isWhitespace && currentX === 0) continue;

        segments.push({
            text: token.text,
            x: currentX,
            width: measured.width,
            span: token.span,
            lineIndex: currentLineIndex
        });

        currentX += measured.width;
    }

    // Finish last line
    if (currentX > 0 || segments.length === 0) {
        lineHeights.push(currentLineHeight || getLineHeight(elementDefaults.fontSize || 28));
    }

    return {
        segments,
        totalHeight: lineHeights.reduce((a, b) => a + b, 0),
        lineCount: lineHeights.length,
        lineHeights
    };
}

/**
 * Measure the total height of rich text within a given width.
 */
export function measureRichTextHeight(
    spans: RichTextSpan[],
    width: number,
    defaults: { fontSize?: number; fontFamily?: string }
): number {
    if (!spans || spans.length === 0) return getLineHeight(defaults.fontSize || 28);
    // Use an offscreen canvas for measurement
    const canvas = document.createElement('canvas');
    const ctx = new CanvasRenderer(canvas.getContext('2d')!);
    const layout = layoutRichText(ctx, spans, width - 8, defaults);
    return layout.totalHeight;
}
