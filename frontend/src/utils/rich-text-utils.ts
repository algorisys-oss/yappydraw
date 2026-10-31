import { lineHeightPx } from './text-line-height';
/**
 * Rich Text Utilities
 * Conversion between DOM ↔ RichTextSpan[], layout engine for canvas rendering.
 */

import type { RichTextSpan, FontFamily, ListNumberStyle, ListNumberSuffix, TextAlign } from '../types';
import { resolveFontFamily, reverseFontFamily } from './text-utils';
import type { IRenderer } from '../rendering/IRenderer';
import { CanvasRenderer } from '../rendering/CanvasRenderer';

// ============ List markers ============

/** Indent per list level and the room left for the marker — Yappy's default list look. */
export const LIST_INDENT_SIZE = 20;
export const LIST_MARKER_WIDTH = 20;

/** The marker overrides a list item may carry (all optional; see RichTextSpan). */
type MarkerProps = Pick<RichTextSpan, 'listMarker' | 'listNumberStyle' | 'listNumberSuffix' | 'listMarkerColor' | 'listMarkerScale' | 'listIndent' | 'listMarkerIndent'>;
const NUMBER_STYLES: ListNumberStyle[] = ['decimal', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman'];
const NUMBER_SUFFIXES: ListNumberSuffix[] = ['period', 'paren', 'parens', 'none'];
const isTextAlign = (v: unknown): v is TextAlign => v === 'left' || v === 'center' || v === 'right';

const MARKER_KEYS = ['listMarker', 'listNumberStyle', 'listNumberSuffix', 'listMarkerColor', 'listMarkerScale', 'listIndent', 'listMarkerIndent'] as const;

/** The span's marker overrides, validated — anything malformed is dropped, never rendered. */
export function markerPropsOf(src: Record<string, unknown> | null | undefined): MarkerProps {
    const out: MarkerProps = {};
    if (!src) return out;
    const finite = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined;
    if (typeof src.listMarker === 'string' && src.listMarker) out.listMarker = [...src.listMarker].slice(0, 4).join('');
    if (NUMBER_STYLES.includes(src.listNumberStyle as ListNumberStyle)) out.listNumberStyle = src.listNumberStyle as ListNumberStyle;
    if (NUMBER_SUFFIXES.includes(src.listNumberSuffix as ListNumberSuffix)) out.listNumberSuffix = src.listNumberSuffix as ListNumberSuffix;
    if (typeof src.listMarkerColor === 'string' && src.listMarkerColor.length <= 64) out.listMarkerColor = src.listMarkerColor;
    const scale = finite(src.listMarkerScale, 0.25, 4); if (scale !== undefined) out.listMarkerScale = scale;
    const ind = finite(src.listIndent, 0, 4000); if (ind !== undefined) out.listIndent = ind;
    const mind = finite(src.listMarkerIndent, 0, 4000); if (mind !== undefined) out.listMarkerIndent = mind;
    return out;
}

const toAlpha = (n: number, upper: boolean) => {
    let s = '';
    for (let k = Math.max(1, Math.floor(n)); k > 0; k = Math.floor((k - 1) / 26)) s = String.fromCharCode(97 + ((k - 1) % 26)) + s;
    return upper ? s.toUpperCase() : s;
};
const toRoman = (n: number, upper: boolean) => {
    let k = Math.max(1, Math.min(3999, Math.floor(n))), s = '';
    for (const [v, r] of [[1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']] as const) {
        while (k >= v) { s += r; k -= v; }
    }
    return upper ? s.toUpperCase() : s;
};

/** The text drawn before a list item: its bullet glyph, or its formatted number. */
export function listMarkerText(span: RichTextSpan): string {
    if (span.listType === 'bullet') return span.listMarker || '\u2022';
    if (span.listType !== 'ordered') return '';
    const n = span.listIndex || 1;
    const st = span.listNumberStyle;
    const num = st === 'lower-alpha' ? toAlpha(n, false) : st === 'upper-alpha' ? toAlpha(n, true)
        : st === 'lower-roman' ? toRoman(n, false) : st === 'upper-roman' ? toRoman(n, true) : String(n);
    const sfx = span.listNumberSuffix;
    return sfx === 'paren' ? `${num})` : sfx === 'parens' ? `(${num})` : sfx === 'none' ? num : `${num}.`;
}

/** Where the marker starts, in px from the text area's left edge. */
export function listMarkerX(span: RichTextSpan): number {
    return span.listMarkerIndent ?? (span.listLevel || 0) * LIST_INDENT_SIZE;
}

/** The marker's own font size and colour (PowerPoint bullets are often smaller and accent-coloured). */
export function listMarkerStyle(span: RichTextSpan, defaults: { fontSize?: number; fontFamily?: string }, textColor: string) {
    const size = (span.fontSize || defaults.fontSize || 28) * (span.listMarkerScale ?? 1);
    return { font: buildSpanFontString({ ...span, fontSize: size }, defaults), size, color: span.listMarkerColor || textColor };
}

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

    const psb = (span.paragraphSpaceBefore && Number.isFinite(span.paragraphSpaceBefore) ? ` data-psb="${Math.round(span.paragraphSpaceBefore * 100) / 100}"` : '')
        + (isTextAlign(span.paragraphAlign) ? ` data-pa="${span.paragraphAlign}"` : '');
    if (psb) return `<span${psb}${styles.length ? ` style="${styles.join(';')}"` : ''}>${escaped}</span>`;
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
        while (open.length < level + 1) {
            // A numbered list that doesn't start at 1 (an imported "3." run) keeps its start.
            const start = tag === 'ol' && open.length === level && (item.listIndex || 1) > 1 ? ` start="${Math.floor(item.listIndex!)}"` : '';
            html += `<${tag}${start}>`; open.push(tag);
        }
        const marker = markerPropsOf(item as unknown as Record<string, unknown>);
        const data = Object.keys(marker).length
            ? ` data-list="${JSON.stringify(marker).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"` : '';
        html += `<li${data}>${spanInlineHtml(item)}</li>`;
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

    function walk(node: Node, inherited: Partial<RichTextSpan>, listContext: { type?: 'bullet' | 'ordered'; level: number; index: number; marker?: MarkerProps } = { level: -1, index: 0 }) {
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
                if (inherited.paragraphSpaceBefore) span.paragraphSpaceBefore = inherited.paragraphSpaceBefore;
                if (inherited.paragraphAlign) span.paragraphAlign = inherited.paragraphAlign;

                // Apply list context if we're inside a list item
                if (listContext.type) {
                    span.listType = listContext.type;
                    span.listLevel = listContext.level;
                    if (listContext.type === 'ordered') {
                        span.listIndex = listContext.index;
                    }
                    if (listContext.marker) Object.assign(span, listContext.marker);
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
            const start = tag === 'ol' ? parseInt(el.getAttribute('start') || '1', 10) : 1;
            let index = Number.isFinite(start) && start > 0 ? Math.min(start, 100000) - 1 : 0;
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
            // Marker overrides ride on the <li> (see listToHtml); the browser copies the
            // attribute when Enter splits an item, so new items keep the list's look.
            let marker: MarkerProps | undefined;
            const raw = el.getAttribute('data-list');
            if (raw) { try { marker = markerPropsOf(JSON.parse(raw)); } catch { /* ignore a mangled attribute */ } }
            listContext = { ...listContext, marker };
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

        const psb = Number(el.getAttribute('data-psb'));
        if (Number.isFinite(psb) && psb > 0) style.paragraphSpaceBefore = Math.min(psb, 1000);
        const pa = el.getAttribute('data-pa');
        if (isTextAlign(pa)) style.paragraphAlign = pa;

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
        ((a.listIndex || 0) === (b.listIndex || 0)) &&
        MARKER_KEYS.every(k => a[k] === b[k]) &&
        (a.paragraphSpaceBefore || 0) === (b.paragraphSpaceBefore || 0) &&
        (a.paragraphAlign || '') === (b.paragraphAlign || '');
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

/**
 * Where a list item's text starts. Yappy's default: one indent per level plus the marker's
 * room. An explicit indent (PowerPoint's marL) wins — but never over the marker itself:
 * like PowerPoint, text that would start inside the marker moves to just past it.
 */
/**
 * Where a list item's text starts. An explicit `listIndent` past the marker wins (an imported
 * hanging indent); otherwise the text clears the marker by 0.3 em, and Yappy's default never
 * starts closer than LIST_MARKER_WIDTH. A fixed 20 px used to put "IV." or "a)" at 28 px over
 * the text. `measure` is the canvas's measureText where there is one (layout); PPTX export
 * passes its own, so the file puts the text where the canvas drew it.
 */
export function listTextXWith(measure: (text: string, font: string) => number, span: RichTextSpan, defaults: { fontSize?: number; fontFamily?: string }): number {
    const markerX = listMarkerX(span);
    if (span.listIndent !== undefined && span.listIndent > markerX) return span.listIndent;
    const m = listMarkerStyle(span, defaults, '');
    const clear = markerX + measure(listMarkerText(span), m.font) + m.size * 0.3;
    return span.listIndent === undefined ? Math.max(markerX + LIST_MARKER_WIDTH, clear) : clear;
}

function listTextX(ctx: IRenderer, span: RichTextSpan, defaults: { fontSize?: number; fontFamily?: string }): number {
    return listTextXWith((text, font) => { ctx.font = font; return ctx.measureText(text).width; }, span, defaults);
}

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
    /** Extra space above each line (paragraph spacing); renderers add it before placing the line. */
    lineGaps: number[];
    /** Each line's own alignment (its paragraph's `paragraphAlign`); undefined = the element's. */
    lineAligns: (TextAlign | undefined)[];
}

/**
 * Where a laid-out line starts. `lineAlign` (the paragraph's own alignment) wins over the
 * element's; `left`/`right` are the text area's edges and `mid` its centre line (passed on its
 * own because a connector label's area is unbounded: left/right are ±Infinity there).
 */
export function alignedLineX(lineAlign: TextAlign | undefined, elementAlign: string | undefined, lineWidth: number, left: number, mid: number, right: number): number {
    const a = lineAlign ?? elementAlign;
    if (a === 'center') return mid - lineWidth / 2;
    if (a === 'right') return right - lineWidth;
    return left;
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

/** Line box for a run. `factor` is the element's line-spacing multiple (see text-line-height). */
function getLineHeight(fontSize: number, factor?: number): number {
    return lineHeightPx(fontSize, { lineHeight: factor });
}

/**
 * Layout rich text spans within a max width, handling word wrapping across
 * span boundaries. Returns positioned segments for canvas rendering.
 */
export function layoutRichText(
    ctx: IRenderer,
    spans: RichTextSpan[],
    maxWidth: number,
    elementDefaults: { fontSize?: number; fontFamily?: string; lineHeight?: number }
): RichTextLayout {
    const segments: RichTextSegment[] = [];
    const lineHeights: number[] = [];
    const lineGaps: number[] = [];
    const lineAligns: (TextAlign | undefined)[] = [];
    let paraAlign: TextAlign | undefined; // the current paragraph's own alignment


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
        lineHeights.push(currentLineHeight || getLineHeight(elementDefaults.fontSize || 28, elementDefaults.lineHeight));
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
        const lh = getLineHeight(fontSize, elementDefaults.lineHeight);
        currentLineHeight = Math.max(currentLineHeight, lh);

        // Calculate indentation for list items
        const isListItem = !!token.span.listType && token.span.listType !== 'none';

        // The indent belongs to whatever starts the line, so recompute it there:
        // a deeper (or shallower) list level — or leaving the list altogether —
        // has to take effect immediately, not stay on the previous item's indent.
        if (!lineHasContent) {
            // Space before a paragraph — never above the first line, as in PowerPoint.
            if (lineFromNewline && currentLineIndex > 0 && token.span.paragraphSpaceBefore) lineGaps[currentLineIndex] = token.span.paragraphSpaceBefore;
            // A paragraph's alignment rides on its first span; its wrapped lines keep it.
            if (lineFromNewline) paraAlign = isTextAlign(token.span.paragraphAlign) ? token.span.paragraphAlign : undefined;
            lineAligns[currentLineIndex] = paraAlign;
            currentListIndent = isListItem ? listTextX(ctx, token.span, elementDefaults) : 0;
            currentX = currentListIndent;
        }

        ctx.font = buildSpanFontString(token.span, elementDefaults);
        const measured = ctx.measureText(token.text);

        // Word wrap
        if (!token.isWhitespace && currentX + measured.width > maxWidth && currentX > currentListIndent) {
            finishLine(false);
            currentLineHeight = Math.max(currentLineHeight, lh);
            lineAligns[currentLineIndex] = paraAlign;
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
        lineHeights.push(currentLineHeight || getLineHeight(elementDefaults.fontSize || 28, elementDefaults.lineHeight));
    }

    for (let i = 0; i < lineHeights.length; i++) lineGaps[i] ??= 0;
    lineGaps.length = lineHeights.length;
    lineAligns.length = lineHeights.length;
    return {
        segments,
        totalHeight: lineHeights.reduce((a, b) => a + b, 0) + lineGaps.reduce((a, b) => a + b, 0),
        lineCount: lineHeights.length,
        lineHeights,
        lineGaps,
        lineAligns,
    };
}

/**
 * Measure the total height of rich text within a given width.
 */
export function measureRichTextHeight(
    spans: RichTextSpan[],
    width: number,
    defaults: { fontSize?: number; fontFamily?: string; lineHeight?: number }
): number {
    if (!spans || spans.length === 0) return getLineHeight(defaults.fontSize || 28, defaults.lineHeight);
    // Use an offscreen canvas for measurement
    const canvas = document.createElement('canvas');
    const ctx = new CanvasRenderer(canvas.getContext('2d')!);
    const layout = layoutRichText(ctx, spans, width - 8, defaults);
    return layout.totalHeight;
}
