import { lineHeightPx } from './text-line-height';
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
 *
 * **Italics** come from real italic faces where one is bundled — a true italic is a
 * different design, not a sloped roman, so shearing the upright would give the wrong
 * letterforms (in a serif the `a` changes shape entirely). Where a family has no italic
 * face at all, the upright is sheared by the same amount the browser uses, so the outline
 * still matches the text it replaced on canvas.
 */

import opentype from 'opentype.js';
import { customFonts } from './custom-fonts';
import { normalizeFontWeight, normalizeFontStyle, parseFontVariant } from './font-variants';
import type { PathSubpath, PathAnchor, DrawingElement } from '../types';

/**
 * fontFamily key → the bundled binaries for that family, by slant and weight.
 * Mirrors `fontFamilyMap` in text-utils.ts. Files are fetched lazily, only when something is
 * actually outlined, and are excluded from the PWA precache for that reason.
 */
interface FamilyFiles {
    upright: Partial<Record<400 | 700, string>>;
    italic?: Partial<Record<400 | 700, string>>;
}
const FONT_FILES: Record<string, FamilyFiles> = {
    'hand-drawn': { upright: { 400: 'hand-drawn-400.ttf' } },
    'marker':     { upright: { 400: 'marker-400.ttf' } },
    'caveat':     { upright: { 400: 'caveat-400.ttf', 700: 'caveat-700.ttf' } },
    'sans-serif': {
        upright: { 400: 'sans-serif-400.ttf', 700: 'sans-serif-700.ttf' },
        // Inter ships italic only as a variable font; opentype.js reads its default
        // instance (400), so Bold Italic falls back to this face — see resolveFace.
        italic: { 400: 'sans-serif-italic-400.ttf' },
    },
    'poppins': {
        upright: { 400: 'poppins-400.ttf', 700: 'poppins-700.ttf' },
        italic: { 400: 'poppins-italic-400.woff', 700: 'poppins-italic-700.woff' },
    },
    'serif': {
        upright: { 400: 'serif-400.ttf', 700: 'serif-700.ttf' },
        // Merriweather's bold-italic WOFF is not parseable by opentype.js ("Data error"),
        // so it is deliberately not bundled; Bold Italic uses the 400 italic face.
        italic: { 400: 'serif-italic-400.woff' },
    },
    'monospace': {
        upright: { 400: 'monospace-400.ttf', 700: 'monospace-700.ttf' },
        italic: { 400: 'monospace-italic-400.woff', 700: 'monospace-italic-700.woff' },
    },
    'code': {
        upright: { 400: 'code-400.ttf', 700: 'code-700.ttf' },
        italic: { 400: 'code-italic-400.woff', 700: 'code-italic-700.woff' },
    },
};

/**
 * Slant used when a family has no italic face at all and one has to be faked.
 *
 * 0.2 is the horizontal shift per unit of height that Chrome's synthetic oblique applies
 * (~11.3°). Matching the browser matters more than picking a "nicer" angle: the canvas is
 * already showing a sheared upright for these families, so outlining with the same shear is
 * what makes the vector match the text it replaced.
 */
const SYNTHETIC_ITALIC_SLANT = 0.2;

/** Snap a CSS weight onto the two weights the bundled families actually ship. */
const bucketWeight = (w: number): 400 | 700 => (w >= 600 ? 700 : 400);

interface ResolvedFace {
    file: string;
    /** Non-zero when the face is upright and the slant has to be faked. */
    slant: number;
}

/**
 * Pick the binary for a wanted weight + slant, following CSS's own font-matching order:
 * **slant first, then weight**.
 *
 * That order is what keeps letterforms right. A true italic is not a sheared roman — in a
 * serif the `a` changes shape entirely — so for a Bold Italic in a family that has italic
 * only at 400, the 400 italic is a much closer match to what the canvas draws than a sheared
 * Bold would be. Only when a family has no italic face *anywhere* is the upright sheared.
 */
function resolveFace(files: FamilyFiles, weight: number, italic: boolean): ResolvedFace | null {
    const w = bucketWeight(weight);
    if (italic && files.italic) {
        const exact = files.italic[w];
        if (exact) return { file: exact, slant: 0 };
        const other = files.italic[400] ?? files.italic[700];
        if (other) return { file: other, slant: 0 };
    }
    const upright = files.upright[w] ?? files.upright[400] ?? files.upright[700];
    if (!upright) return null;
    return { file: upright, slant: italic ? SYNTHETIC_ITALIC_SLANT : 0 };
}

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

/** A face ready to draw with, plus any slant that still has to be applied to its outlines. */
interface LoadedFace {
    font: opentype.Font;
    slant: number;
}

const loadFont = async (familyKey: string, weight: number, italic: boolean): Promise<LoadedFace> => {
    // A font the user added themselves. `file` fonts carry their own binary; `google`
    // fonts are a stylesheet reference and have nothing we can read.
    const custom = customFonts().find(f => f.key === familyKey);
    if (custom) {
        if (custom.kind === 'google' || !custom.dataUrl) {
            throw new FontOutlineUnavailableError(
                `“${custom.label}” is a Google font, which is loaded as a web font and has no file to read. ` +
                `Download it and add it with “＋ Add font…” (.ttf or .otf) to outline it.`,
            );
        }
        const id = `custom:${custom.key}`;
        let p = fontCache.get(id);
        if (!p) {
            p = Promise.resolve().then(() => parseFontBuffer(dataUrlToArrayBuffer(custom.dataUrl!), custom.label));
            fontCache.set(id, p);
        }
        // A user's font key names one specific file. If that file is itself the italic (its
        // name says so, which is also how the Font Style dropdown groups it) the shapes are
        // already slanted; if the element asks for italic on an upright file, the canvas is
        // faking the slant and so must we.
        const fileIsItalic = parseFontVariant(custom.label).italic;
        return { font: await p, slant: (italic && !fileIsItalic) ? SYNTHETIC_ITALIC_SLANT : 0 };
    }

    const entry = FONT_FILES[familyKey];
    if (!entry) {
        // An unknown key — a font from a document made elsewhere, or one that was removed.
        // Silently substituting sans-serif here is what made this feature untrustworthy.
        throw new FontOutlineUnavailableError(
            `The font “${familyKey}” isn't available to outline. Add it with “＋ Add font…” (.ttf or .otf).`,
        );
    }
    const face = resolveFace(entry, weight, italic);
    if (!face) {
        throw new FontOutlineUnavailableError(`The font “${familyKey}” has no outline data bundled.`);
    }
    const id = `builtin:${face.file}`;
    let p = fontCache.get(id);
    if (!p) {
        const base = (import.meta as any).env?.BASE_URL ?? '/';
        const url = `${base}fonts/outline/${face.file}`;
        p = fetch(url)
            .then(r => { if (!r.ok) throw new Error(`Font fetch failed: ${face.file} (${r.status})`); return r.arrayBuffer(); })
            .then(buf => parseFontBuffer(buf, familyKey));
        fontCache.set(id, p);
    }
    return { font: await p, slant: face.slant };
};

/**
 * Lean a line's glyph commands about its own baseline.
 *
 * Per *line*, not once for the whole block: a shear is measured from a reference line, and
 * using a single one for a multi-line text would slide each successive line further sideways
 * instead of slanting each of them the same way.
 */
function shearCommands(cmds: opentype.PathCommand[], baselineY: number, slant: number): void {
    if (!slant) return;
    const lean = (x: number, y: number) => x - (y - baselineY) * slant;
    for (const c of cmds as any[]) {
        if (c.x !== undefined) c.x = lean(c.x, c.y);
        if (c.x1 !== undefined) c.x1 = lean(c.x1, c.y1);
        if (c.x2 !== undefined) c.x2 = lean(c.x2, c.y2);
    }
}

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
    const { font, slant } = await loadFont(
        el.fontFamily || 'hand-drawn',
        normalizeFontWeight(el.fontWeight),
        normalizeFontStyle(el.fontStyle) === 'italic',
    );

    const lineHeight = lineHeightPx(fontSize, el);
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
        const lineCmds = font.getPath(line, leftX, baselineY, fontSize).commands;
        // Only non-zero when the family has no italic face and the canvas is faking the
        // slant too — done per line, about that line's own baseline.
        shearCommands(lineCmds, baselineY, slant);
        cmds.push(...lineCmds);
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
