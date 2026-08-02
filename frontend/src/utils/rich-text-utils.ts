/**
 * Rich Text Utilities
 * Conversion between DOM ↔ RichTextSpan[], layout engine for canvas rendering.
 */

import type { RichTextSpan, FontFamily } from '../types';
import { resolveFontFamily, reverseFontFamily } from './text-utils';
import type { IRenderer } from '../rendering/IRenderer';
import { CanvasRenderer } from '../rendering/CanvasRenderer';

// ============ Span ↔ HTML Conversion ============

/** One span's text as inline HTML — wrapped in a styled <span> only when it carries formatting. */
function spanInlineHtml(span: RichTextSpan): string {
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

    return styles.length > 0 ? `<span style="${styles.join(';')}">${escaped}</span>` : escaped;
}

/**
 * Render a run of list spans as nested <ul>/<ol>. A deeper level opens a list
 * *inside* the parent list, as a sibling of the preceding <li> — the same shape
 * browsers produce for execCommand('indent'), so editing round-trips cleanly.
 */
function listToHtml(items: RichTextSpan[]): string {
    let html = '';
    const open: string[] = []; // one entry per currently open list level
    for (const item of items) {
        const level = Math.max(0, item.listLevel || 0);
        const tag = item.listType === 'ordered' ? 'ol' : 'ul';
        while (open.length > level + 1) html += `</${open.pop()}>`;
        // Same level but the other list kind — close it and start the new one.
        if (open.length === level + 1 && open[level] !== tag) html += `</${open.pop()}>`;
        while (open.length < level + 1) { html += `<${tag}>`; open.push(tag); }
        html += `<li>${spanInlineHtml(item)}</li>`;
    }
    while (open.length) html += `</${open.pop()}>`;
    return html;
}

/**
 * Convert RichTextSpan[] to HTML string for contenteditable rendering.
 */
export function spansToHtml(spans: RichTextSpan[]): string {
    if (spans.length === 0) return '';

    let html = '';
    let i = 0;
    // A <ul>/<ol> is a block: it already ends the line, so the newline spans that
    // butt against one must not also become a <br> (that would grow an extra blank
    // line on every edit round-trip).
    let dropLeadingNewline = false;

    while (i < spans.length) {
        const span = spans[i];

        // Check if this is a list item
        if (span.listType && span.listType !== 'none') {
            // Collect the run of consecutive list items (of any level/kind). The
            // plain newline spans that separate them on canvas carry no list info
            // and are dropped — <li> boundaries encode those breaks in HTML.
            const listItems: RichTextSpan[] = [];

            while (i < spans.length) {
                const currentSpan = spans[i];

                // Skip newline spans between list items
                if (currentSpan.text === '\n' && !currentSpan.listType) {
                    i++;
                    continue;
                }

                // Stop if we hit a non-list span
                if (!currentSpan.listType || currentSpan.listType === 'none') {
                    break;
                }

                listItems.push(currentSpan);
                i++;
            }

            html += listToHtml(listItems);
            dropLeadingNewline = true;
        } else {
            // Regular span (not a list item)
            let text = span.text;
            if (dropLeadingNewline && text.startsWith('\n')) text = text.slice(1);
            const next = spans[i + 1];
            if (text.endsWith('\n') && next?.listType && next.listType !== 'none') text = text.slice(0, -1);
            if (text) html += spanInlineHtml({ ...span, text });
            dropLeadingNewline = false;
            i++;
        }
    }

    return html;
}

/**
 * Parse a contenteditable div's DOM back into RichTextSpan[].
 */
export function htmlToSpans(container: HTMLElement): RichTextSpan[] {
    const spans: RichTextSpan[] = [];

    /** End the current line, unless nothing has been emitted yet or we're already at a line start. */
    const pushBreak = () => {
        if (spans.length === 0) return;
        if (spans[spans.length - 1].text.endsWith('\n')) return;
        spans.push({ text: '\n' });
    };

    /** Is there anything after this node worth breaking the line for? (Pasted markup
     *  is often pretty-printed, so a trailing whitespace text node means nothing.) */
    const hasContentAfter = (node: Node): boolean => {
        for (let s = node.nextSibling; s; s = s.nextSibling) {
            if (s.nodeType === Node.ELEMENT_NODE) return true;
            if (s.nodeType === Node.TEXT_NODE && (s.textContent || '').trim()) return true;
        }
        return false;
    };

    function walk(node: Node, inherited: Partial<RichTextSpan>, listContext: { type?: 'bullet' | 'ordered'; level: number; index: number } = { level: -1, index: 0 }) {
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

                // Apply list context if we're inside a list item
                if (listContext.type) {
                    span.listType = listContext.type;
                    span.listLevel = listContext.level;
                    if (listContext.type === 'ordered') {
                        span.listIndex = listContext.index;
                    }
                }

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

        // Handle list elements
        if (tag === 'ul' || tag === 'ol') {
            const listType: 'bullet' | 'ordered' = tag === 'ul' ? 'bullet' : 'ordered';
            const newLevel = listContext.level + 1;

            // Walk the children in document order. Besides <li>, that includes any
            // nested <ul>/<ol> the browser parks *between* items when indenting
            // (execCommand('indent') emits the nested list as a sibling of the
            // <li>, not inside it) — skipping those dropped the nested items.
            let index = 0;
            for (const child of Array.from(el.children)) {
                const childTag = child.tagName.toLowerCase();
                if (childTag === 'li') {
                    index++;
                    pushBreak(); // every item starts on its own line
                    walk(child, style, { type: listType, level: newLevel, index });
                } else if (childTag === 'ul' || childTag === 'ol') {
                    walk(child, style, { type: listType, level: newLevel, index });
                }
            }
            // A list is a block: whatever follows it starts on a new line.
            if (hasContentAfter(el)) pushBreak();
            return;
        }

        // Handle list item - just process children with current context
        if (tag === 'li') {
            const children = Array.from(el.childNodes);
            for (let ci = 0; ci < children.length; ci++) {
                const child = children[ci];
                // Skip trailing <br> in list items — browsers insert a
                // placeholder <br> that would create a spurious blank line
                if (child instanceof HTMLElement && child.tagName === 'BR' && ci === children.length - 1) {
                    continue;
                }
                walk(child, style, listContext);
            }
            return;
        }

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
        if (el.style.fontFamily) {
            const key = reverseFontFamily(el.style.fontFamily);
            if (key) style.fontFamily = key as FontFamily;
        }
        // Handle <font> attributes from execCommand('fontName'/'foreColor')
        if (tag === 'font') {
            if ((el as HTMLFontElement).face) {
                const key = reverseFontFamily((el as HTMLFontElement).face);
                if (key) style.fontFamily = key as FontFamily;
            }
            if ((el as HTMLFontElement).color) {
                style.color = (el as HTMLFontElement).color;
            }
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
            walk(child, style, listContext);
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
        ((a.fontFamily || '') === (b.fontFamily || '')) &&
        ((a.listType || 'none') === (b.listType || 'none')) &&
        ((a.listLevel || 0) === (b.listLevel || 0)) &&
        ((a.listIndex || 0) === (b.listIndex || 0));
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
    /** True on the first segment of a list item — the one the bullet/number is drawn beside.
     *  Word-wrapped continuation lines of the same item never carry it. */
    listMarker?: boolean;
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

    const INDENT_SIZE = 20; // Pixels per indent level
    const MARKER_WIDTH = 20; // Space reserved for bullet/number

    let currentX = 0;
    let currentLineIndex = 0;
    let currentLineHeight = 0;
    let currentListIndent = 0; // Track current list indentation
    let lineFromNewline = true; // Track if current line started from an explicit newline
    let lineHasContent = false; // No segment placed on this line yet
    let atItemStart = true; // Next placed segment begins a new list item (gets the marker)

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

    const finishLine = (fromNewline: boolean) => {
        lineHeights.push(currentLineHeight || getLineHeight(elementDefaults.fontSize || 28));
        currentLineIndex++;
        currentX = currentListIndent; // Reset to indent position, not 0
        currentLineHeight = 0;
        lineFromNewline = fromNewline;
        lineHasContent = false;
    };

    for (const token of tokens) {
        if (token.isNewline) {
            finishLine(true);
            atItemStart = true; // an explicit break ends the list item
            continue;
        }

        const fontSize = token.span.fontSize || elementDefaults.fontSize || 28;
        const lh = getLineHeight(fontSize);
        currentLineHeight = Math.max(currentLineHeight, lh);

        // Calculate indentation for list items
        const listLevel = token.span.listLevel || 0;
        const isListItem = token.span.listType && token.span.listType !== 'none';
        const indent = isListItem ? listLevel * INDENT_SIZE : 0;
        const markerSpace = isListItem ? MARKER_WIDTH : 0;

        // The indent belongs to whatever starts the line, so recompute it there:
        // a deeper (or shallower) list level — or leaving the list altogether —
        // has to take effect immediately, not stay on the previous item's indent.
        if (!lineHasContent) {
            currentListIndent = isListItem ? indent + markerSpace : 0;
            currentX = currentListIndent;
        }

        ctx.font = buildSpanFontString(token.span, elementDefaults);
        const measured = ctx.measureText(token.text);

        // Word wrap
        if (!token.isWhitespace && currentX + measured.width > maxWidth && currentX > currentListIndent) {
            finishLine(false);
            currentLineHeight = Math.max(currentLineHeight, lh);
        }

        // Skip leading whitespace only after word-wrap, not after explicit newlines
        if (token.isWhitespace && currentX === currentListIndent && !lineFromNewline) continue;

        const segment: RichTextSegment = {
            text: token.text,
            x: currentX,
            width: measured.width,
            span: token.span,
            lineIndex: currentLineIndex
        };
        if (isListItem && atItemStart) segment.listMarker = true;
        segments.push(segment);
        atItemStart = false;
        lineHasContent = true;

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
