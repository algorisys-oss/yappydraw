/**
 * The accessibility check: what makes a document hard to use with a screen reader or hard to
 * read. After DeckCraft's review (missing alt text, low-contrast text, slides without a title),
 * adapted to Yappy's model:
 *  - pictures, video, charts and QR codes need alternative text unless marked decorative;
 *  - text must reach WCAG AA contrast against what is behind it (its own box or shape fill, else
 *    the page): 4.5:1, or 3:1 for large text (24px, or 18.66px bold);
 *  - a page with no text at all gives a screen reader nothing to read and nothing to find it by
 *    (Yappy pages have no title placeholder, so this stands in for "missing slide title").
 * Pure: the caller hands in the pages (see `checkDocument` in the dialog), so it unit-tests.
 */
import type { DrawingElement } from '../types';
import { cssColorToRgb255 } from './color-utils';
import { normalizeFontWeight } from './font-variants';

export interface A11yPage {
    index: number | null;        // page index, or null for an unpaged canvas
    name?: string;
    background?: string;         // a solid page colour, when it has one
    elements: DrawingElement[];
}

export type A11yIssueKind = 'alt-text' | 'contrast' | 'no-text';
export interface A11yIssue {
    kind: A11yIssueKind;
    page: number | null;
    elementId?: string;
    /** Contrast issues: the ratio found and the one needed. */
    ratio?: number;
    needed?: number;
}

/** Objects a screen reader can only describe from their alt text. */
export const NEEDS_ALT = new Set(['image', 'video', 'chart', 'barChart', 'pieChart', 'qrCode']);

function luminance([r, g, b]: [number, number, number]): number {
    const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio of two CSS colours, or null if either isn't an opaque colour. */
export function contrast(a: string | undefined, b: string | undefined): number | null {
    const ca = opaque(a), cb = opaque(b);
    if (!ca || !cb) return null;
    const la = luminance(ca), lb = luminance(cb);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A colour's RGB, or null when it's missing or see-through (its contrast depends on what's under it). */
function opaque(css: string | undefined): [number, number, number] | null {
    if (!css) return null;
    const m = /rgba?\([^)]*,\s*([\d.]+)\s*\)$/i.exec(css.trim());
    if (m && /^rgba/i.test(css.trim()) && Number(m[1]) < 0.999) return null;
    if (/^#[0-9a-f]{8}$/i.test(css.trim()) && parseInt(css.trim().slice(7, 9), 16) < 255) return null;
    return cssColorToRgb255(css);
}

const textOf = (el: DrawingElement): string =>
    [el.text, el.containerText, ...(el.richText ?? []).map(s => s.text), ...(el.richContainerText ?? []).map(s => s.text),
        ...(el.tableData ?? []).flat(), (el as any).chart?.title].filter(Boolean).join(' ').trim();

/** The text's colour and size as drawn; rich text is judged by its first span that has text. */
function textLook(el: DrawingElement): { color?: string; size: number; bold: boolean } {
    const label = el.type !== 'text' && el.type !== 'richtext';
    const spans = label ? el.richContainerText : el.richText;
    const span = spans?.find(s => s.text.trim());
    const size = span?.fontSize ?? el.fontSize ?? (label ? 28 : 20);
    const bold = span?.bold ?? normalizeFontWeight(el.fontWeight) >= 600;
    return { color: span?.color || el.textColor || el.strokeColor, size, bold };
}

/** What is behind an element's text: its own fill when it has a solid one, else the page. */
function backdrop(el: DrawingElement, page?: string): string | undefined {
    const own = el.backgroundColor;
    const solid = own && own !== 'transparent' && (el.fillStyle === 'solid' || el.type === 'text' || el.type === 'richtext');
    return solid ? own : page;
}

export function checkPages(pages: A11yPage[]): A11yIssue[] {
    const out: A11yIssue[] = [];
    const seen = new Set<string>();   // master artwork repeats on every page; report it once
    for (const p of pages) {
        let anyText = false;
        for (const el of p.elements) {
            const id = el.id.replace(/@page\d+$/, '');
            const text = textOf(el);
            if (text) anyText = true;
            if (seen.has(id)) continue;
            if (NEEDS_ALT.has(el.type) && !el.decorative && !el.altText?.trim()) {
                seen.add(id);
                out.push({ kind: 'alt-text', page: p.index, elementId: id });
                continue;
            }
            if (!text || el.type === 'table' || el.type === 'chart') continue;
            const look = textLook(el);
            const ratio = contrast(look.color, backdrop(el, p.background));
            if (ratio === null) continue;
            const large = look.size >= 24 || (look.bold && look.size >= 18.66);
            const needed = large ? 3 : 4.5;
            if (ratio < needed) {
                seen.add(id);
                out.push({ kind: 'contrast', page: p.index, elementId: id, ratio: Math.round(ratio * 10) / 10, needed });
            }
        }
        if (p.index !== null && !anyText) out.push({ kind: 'no-text', page: p.index });
    }
    return out;
}
