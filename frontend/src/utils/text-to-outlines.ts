/**
 * Text → Outlines — convert a text element into an editable vector `path` element
 * (the Illustrator "Create Outlines" move). Glyph contours become PathSubpaths
 * with cubic Bézier handles; counters (the holes in o/a/e/etc.) become separate
 * subpaths so the even-odd fill rule punches them out automatically.
 *
 * Getting the actual font binary is the whole job, and there are three cases:
 *
 *   • **Built-ins** — bundled TTFs under `public/fonts/outline/` (curated OFL families
 *     matching the in-app font picker), fetched and parsed lazily.
 *   • **Fonts the user added from a file** — the binary is already in hand, sitting in
 *     the font's `dataUrl`. Parsed directly.
 *   • **Google fonts added by name** — we have a CSS `@font-face` and a rendered
 *     typeface, but no binary we can read. Google serves WOFF2 to any modern browser
 *     and opentype.js cannot parse WOFF2, so these **cannot** be outlined.
 *
 * That last case used to fall through to `?? FONT_FILES['sans-serif']`, which meant
 * outlining a logo set in a Google font silently produced the right letters in the
 * WRONG typeface — worse than failing, because it looks like it worked. It now fails
 * loudly with the one thing that fixes it (add the .ttf/.otf via "Add font…").
 */

import opentype from 'opentype.js';
import { customFonts } from './custom-fonts';
import { normalizeFontWeight } from './font-variants';
import type { PathSubpath, PathAnchor, DrawingElement } from '../types';

// fontFamily key → bundled TTF file(s). Mirrors `fontFamilyMap` in text-utils.ts.
const FONT_FILES: Record<string, { regular: string; bold?: string }> = {
    'hand-drawn': { regular: 'hand-drawn-400.ttf' },
    'marker':     { regular: 'marker-400.ttf' },
    'caveat':     { regular: 'caveat-400.ttf', bold: 'caveat-700.ttf' },
    'sans-serif': { regular: 'sans-serif-400.ttf', bold: 'sans-serif-700.ttf' },
    'poppins':    { regular: 'poppins-400.ttf', bold: 'poppins-700.ttf' },
    'serif':      { regular: 'serif-400.ttf', bold: 'serif-700.ttf' },
    'monospace':  { regular: 'monospace-400.ttf', bold: 'monospace-700.ttf' },
    'code':       { regular: 'code-400.ttf', bold: 'code-700.ttf' },
};

/**
 * Thrown when a font's outlines genuinely can't be reached. Carries a message meant for
 * the user rather than a stack trace — the caller surfaces it as a toast, because the
 * only useful response is "add the font file", which they have to do themselves.
 */
export class FontOutlineUnavailableError extends Error {
    constructor(message: string) { super(message); this.name = 'FontOutlineUnavailableError'; }
}

/** Decode a `data:` URL's base64 payload into an ArrayBuffer. */
function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
    const comma = dataUrl.indexOf(',');
    if (comma < 0) throw new FontOutlineUnavailableError('That font file could not be read.');
    const bin = atob(dataUrl.slice(comma + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

/**
 * WOFF2 starts with the tag `wOF2`. opentype.js (1.x) handles TTF, OTF and WOFF but not
 * WOFF2 — its Brotli-compressed tables would need a decompressor the browser doesn't
 * expose (`DecompressionStream` does gzip and deflate, not Brotli). Detecting it here
 * turns an inscrutable parser error into a sentence that says what to do about it.
 */
function isWoff2(buf: ArrayBuffer): boolean {
    if (buf.byteLength < 4) return false;
    const b = new Uint8Array(buf, 0, 4);
    return b[0] === 0x77 && b[1] === 0x4F && b[2] === 0x46 && b[3] === 0x32; // 'wOF2'
}

function parseFontBuffer(buf: ArrayBuffer, label: string): opentype.Font {
    if (isWoff2(buf)) {
        throw new FontOutlineUnavailableError(
            `“${label}” is a WOFF2 file, which can't be converted to outlines. Add the same font as a .ttf or .otf to outline it.`,
        );
    }
    return opentype.parse(buf);
}

// Parsed fonts are cached by source id (a promise so concurrent loads dedupe).
const fontCache = new Map<string, Promise<opentype.Font>>();

const loadFont = (familyKey: string, bold: boolean): Promise<opentype.Font> => {
    // A font the user added themselves. `file` fonts carry their own binary; `google`
    // fonts are a stylesheet reference and have nothing we can read.
    const custom = customFonts().find(f => f.key === familyKey);
    if (custom) {
        if (custom.kind === 'google' || !custom.dataUrl) {
            return Promise.reject(new FontOutlineUnavailableError(
                `“${custom.label}” is a Google font, which is loaded as a web font and has no file to read. ` +
                `Download it and add it with “＋ Add font…” (.ttf or .otf) to outline it.`,
            ));
        }
        const id = `custom:${custom.key}`;
        let p = fontCache.get(id);
        if (!p) {
            p = Promise.resolve().then(() => parseFontBuffer(dataUrlToArrayBuffer(custom.dataUrl!), custom.label));
            fontCache.set(id, p);
        }
        return p;
    }

    const entry = FONT_FILES[familyKey];
    if (!entry) {
        // An unknown key — a font from a document made elsewhere, or one that was removed.
        // Silently substituting sans-serif here is what made this feature untrustworthy.
        return Promise.reject(new FontOutlineUnavailableError(
            `The font “${familyKey}” isn't available to outline. Add it with “＋ Add font…” (.ttf or .otf).`,
        ));
    }
    const file = (bold && entry.bold) ? entry.bold : entry.regular;
    const id = `builtin:${file}`;
    let p = fontCache.get(id);
    if (!p) {
        const base = (import.meta as any).env?.BASE_URL ?? '/';
        const url = `${base}fonts/outline/${file}`;
        p = fetch(url)
            .then(r => { if (!r.ok) throw new Error(`Font fetch failed: ${file} (${r.status})`); return r.arrayBuffer(); })
            .then(buf => parseFontBuffer(buf, familyKey));
        fontCache.set(id, p);
    }
    return p;
};

/** Convert an opentype Path's command list into PathSubpaths (one per contour). */
const commandsToSubpaths = (cmds: opentype.PathCommand[]): PathSubpath[] => {
    const subs: PathSubpath[] = [];
    let cur: PathAnchor[] = [];
    let prev: PathAnchor | null = null;
    let start: { x: number; y: number } | null = null;

    const flush = () => {
        if (cur.length > 1) subs.push({ anchors: cur, closed: true });
        cur = []; prev = null; start = null;
    };

    for (const c of cmds) {
        if (c.type === 'M') {
            flush();
            const a: PathAnchor = { x: c.x, y: c.y, kind: 'corner' };
            cur.push(a); prev = a; start = { x: c.x, y: c.y };
        } else if (c.type === 'L') {
            const a: PathAnchor = { x: c.x, y: c.y, kind: 'corner' };
            cur.push(a); prev = a;
        } else if (c.type === 'C') {
            if (prev) { prev.outX = c.x1 - prev.x; prev.outY = c.y1 - prev.y; }
            const a: PathAnchor = { x: c.x, y: c.y, inX: c.x2 - c.x, inY: c.y2 - c.y, kind: 'smooth' };
            cur.push(a); prev = a;
        } else if (c.type === 'Q' && prev) {
            // Quadratic → cubic: lift the single control point to two.
            const c1x = prev.x + (2 / 3) * (c.x1 - prev.x), c1y = prev.y + (2 / 3) * (c.y1 - prev.y);
            const c2x = c.x + (2 / 3) * (c.x1 - c.x), c2y = c.y + (2 / 3) * (c.y1 - c.y);
            prev.outX = c1x - prev.x; prev.outY = c1y - prev.y;
            const a: PathAnchor = { x: c.x, y: c.y, inX: c2x - c.x, inY: c2y - c.y, kind: 'smooth' };
            cur.push(a); prev = a;
        } else if (c.type === 'Z') {
            // Drop a final anchor that just duplicates the start; carry its incoming
            // handle onto the start anchor so the closing segment keeps its curve.
            if (cur.length > 1 && start) {
                const last = cur[cur.length - 1];
                if (Math.abs(last.x - start.x) < 1e-3 && Math.abs(last.y - start.y) < 1e-3) {
                    const first = cur[0];
                    if (last.inX != null) { first.inX = last.inX; first.inY = last.inY; first.kind = 'smooth'; }
                    cur.pop();
                }
            }
            flush();
        }
    }
    flush();
    return subs;
};

export interface OutlineResult {
    subpaths: PathSubpath[];
    x: number; y: number; width: number; height: number;
}

/**
 * Lay out a text element's plain text and return the combined glyph outline as
 * PathSubpaths plus the bounding box (in world coords, ready to drop onto a
 * `path` element). Returns null for empty text. Layout mirrors the canvas text
 * renderer (fontSize default 20, lineHeight = 1.2×, padding 4, vertical-align,
 * text-align). Hard line breaks only — no soft-wrap.
 */
export const textElementToOutline = async (el: DrawingElement): Promise<OutlineResult | null> => {
    let text = (el.text ?? '').replace(/\r/g, '');
    if (!text && el.richText?.length) text = el.richText.map(s => s.text).join('');
    if (!text.trim()) return null;

    const fontSize = el.fontSize || 20;
    // The built-ins bundle a Regular and a Bold binary, so anything from SemiBold up gets the
    // bold file. (`!!el.fontWeight` would have called a numeric 400 bold — 400 is truthy.)
    const bold = normalizeFontWeight(el.fontWeight) >= 600;
    const font = await loadFont(el.fontFamily || 'hand-drawn', bold);

    const lineHeight = fontSize * 1.2;
    const padding = 4;
    const lines = text.split('\n');
    const ascentPx = (font.ascender / font.unitsPerEm) * fontSize;

    const totalTextHeight = lines.length > 0 ? (lines.length - 1) * lineHeight + fontSize : 0;
    const verticalAlign = el.verticalAlign || 'middle';
    let verticalPadding = 0;
    if (verticalAlign === 'top') verticalPadding = padding;
    else if (verticalAlign === 'middle') verticalPadding = Math.max(0, (el.height - totalTextHeight) / 2);
    else verticalPadding = Math.max(0, el.height - totalTextHeight - padding);

    const textAlign = el.textAlign || 'center';

    // Build glyph commands in element-local coords (origin = el top-left).
    const cmds: opentype.PathCommand[] = [];
    lines.forEach((line, i) => {
        if (!line) return;
        const adv = font.getAdvanceWidth(line, fontSize);
        let leftX: number;
        if (textAlign === 'center') leftX = el.width / 2 - adv / 2;
        else if (textAlign === 'right') leftX = el.width - padding - adv;
        else leftX = padding;
        const baselineY = verticalPadding + i * lineHeight + ascentPx; // canvas 'hanging' ≈ top
        cmds.push(...font.getPath(line, leftX, baselineY, fontSize).commands);
    });
    if (cmds.length === 0) return null;

    const subs = commandsToSubpaths(cmds);
    if (subs.length === 0) return null;

    // Bounding box over anchor points and their handle tips.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const acc = (x: number, y: number) => { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); };
    for (const s of subs) for (const a of s.anchors) {
        acc(a.x, a.y);
        if (a.inX != null) acc(a.x + a.inX, a.y + (a.inY ?? 0));
        if (a.outX != null) acc(a.x + a.outX, a.y + (a.outY ?? 0));
    }
    if (!isFinite(minX)) return null;

    // Normalize anchors to a local origin (handles are relative, so untouched).
    for (const s of subs) for (const a of s.anchors) { a.x -= minX; a.y -= minY; }

    return { subpaths: subs, x: el.x + minX, y: el.y + minY, width: maxX - minX, height: maxY - minY };
};
