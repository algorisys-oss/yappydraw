/**
 * Yappy elements → the neutral Deck model, as native (editable) PowerPoint objects.
 *
 * Shapes take their outline from the same `getShapeGeometry` the canvas and the SVG export use,
 * so every one of the ~150 shape types exports with its real silhouette: rect/rounded rect/ellipse
 * become PowerPoint presets (so they keep PowerPoint's resize handles), the rest custom geometry.
 * Text is real text; straight lines are connectors glued to the shapes they touch; curves and
 * elbows are path shapes with arrowheads (LibreOffice re-routes any connector that isn't straight,
 * so a curve written as a connector would not survive being opened there).
 *
 * What PowerPoint cannot express — effects, masks, mesh/pattern/image fills, 3-D, warps, image
 * filters, text on a path, the UML class boxes with their compartments, and anything without
 * geometry — is rendered to a PNG of just that object and placed where it sits. Sketch-style
 * shapes export clean (Rajesh, 2026-10-31): the export dialog's "Pictures" mode is the
 * pixel-exact option.
 */
import type { DrawingElement, RichTextSpan } from '../../types';
import type { Slide as YappySlide, SlideTransition } from '../../types/slide-types';
import type { Item, Paint, Color, Line, TextBody, Paragraph, TextRun, Geometry, CustomPath, Media, Slide, Transition, ArrowEnd, ShapeItem, ConnectorItem, GroupItem, PathCmd, DeckLink } from './deck';
import { parseLink } from '../slide-links';
import { parseSvgPath, transformCmds, cmdsBounds, affineCmds } from './custgeom';
import { SvgRenderer } from '../../rendering/SvgRenderer';
import { renderElement } from '../render-element';
import rough from 'roughjs/bin/rough';
import { getShapeGeometry, normalizeElementPoints, type ShapeGeometry } from '../shape-geometry';
import { connectorGeometry } from '../connector-geometry';
import { arrowheadSize } from '../arrowhead-size';
import { cssColorToRgb255 } from '../color-utils';
import { resolveFontFamily } from '../text-utils';
import { listMarkerX, listTextXResolver } from '../rich-text-utils';
import { normalizeFontWeight, normalizeFontStyle } from '../font-variants';
import { lineHeightFactorOf, DEFAULT_LINE_HEIGHT } from '../text-line-height';
import { cornerRadiiPx } from '../corner-radius';
import { getImage } from '../image-cache';
import { hasExtrude } from '../extrude';
import { hasRevolve } from '../revolve';
import { hasInflate } from '../inflate';
import { hasTransformEffect } from '../transform-effect';

export interface RasterResult { dataURL: string; x: number; y: number; width: number; height: number }

export interface ConvertHooks {
    /** Render exactly these (already posed) elements to a PNG and say where it sits in world space. */
    rasterize(els: DrawingElement[]): RasterResult | null;
    /** Render a page background that isn't a flat colour or gradient (texture, image, hatching). */
    rasterizeBackground?(page: YappySlide): string | null;
}

export interface PageInput {
    x: number; y: number; w: number; h: number;
    name?: string;
    slide?: YappySlide;        // absent for the infinite canvas / a selection
    background?: string;       // flat colour for a non-slide page (export "background" option)
    elements: DrawingElement[]; // posed, exportable, in render order
}

export interface ConvertReport { native: number; pictures: number }

// ── Colours ─────────────────────────────────────────────────────────────────────────────────

const toHex = (rgb: [number, number, number]) => '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');

/** Alpha carried in the colour string itself (rgba(), hsla(), #rrggbbaa, `… / a`). */
function alphaOf(css: string): number {
    const s = css.trim().toLowerCase();
    const hex8 = s.match(/^#([0-9a-f]{8})$/);
    if (hex8) return parseInt(hex8[1].slice(6), 16) / 255;
    const hex4 = s.match(/^#([0-9a-f]{4})$/);
    if (hex4) return parseInt(hex4[1][3] + hex4[1][3], 16) / 255;
    const fn = s.match(/^(?:rgba?|hsla?)\(([^)]*)\)$/);
    if (fn) {
        const parts = fn[1].split(/[\s,/]+/).filter(Boolean);
        if (parts.length >= 4) return parseAlpha(parts[3]);
    }
    const slash = s.match(/\/\s*([\d.]+%?)\s*\)$/);
    if (slash) return parseAlpha(slash[1]);
    return 1;
}
const parseAlpha = (t: string) => {
    const v = t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t);
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
};

/** A CSS colour as a deck Color, with the element opacity folded into its alpha; null = no paint. */
export function toColor(css: string | undefined | null, opacity = 1): Color | null {
    if (!css) return null;
    const rgb = cssColorToRgb255(css);
    if (!rgb) return null;
    const a = alphaOf(css) * opacity;
    if (a <= 0) return null;
    return a < 0.999 ? { hex: toHex(rgb), alpha: a } : { hex: toHex(rgb) };
}

// ── Fonts ───────────────────────────────────────────────────────────────────────────────────

/** The typeface name PowerPoint should ask for: the first family of the CSS stack ("Handlee", "Inter"…). */
export const typefaceOf = (key?: string): string =>
    resolveFontFamily(key).split(',')[0].trim().replace(/^['"]|['"]$/g, '') || 'Calibri';

// ── Paints and lines ────────────────────────────────────────────────────────────────────────

const HATCH_PRESET: Record<string, string> = {
    'hachure': 'ltUpDiag', 'zigzag': 'ltUpDiag', 'zigzag-line': 'ltUpDiag', 'dashed': 'dashUpDiag',
    'cross-hatch': 'diagCross', 'dots': 'pct20',
};

function fillOf(el: DrawingElement, op: number): Paint {
    const fs = (el.fillStyle as string) || 'solid';
    if ((fs === 'linear' || fs === 'radial' || fs === 'conic') && (el.gradientStops?.length ?? 0) > 0) {
        const stops = el.gradientStops!.map(s => ({ pos: Math.max(0, Math.min(1, s.offset)), color: toColor(s.color, op) ?? { hex: '#000000', alpha: 0 } }));
        return fs === 'linear' ? { kind: 'linear', stops, angle: el.gradientDirection ?? 45, scaled: true } : { kind: 'radial', stops };
    }
    const c = toColor(el.backgroundColor, op);
    if (!c) return { kind: 'none' };
    // Hatched fills (drawn in both render styles) become PowerPoint pattern fills: still lines over
    // the ground, still editable.
    if (HATCH_PRESET[fs]) return { kind: 'pattern', preset: HATCH_PRESET[fs], color: c };
    return { kind: 'solid', color: c };
}

function dashOf(el: DrawingElement): string | undefined {
    if (el.strokeStyle === 'dotted') return 'sysDot';
    if (el.strokeStyle === 'dashed') return 'dash';
    if (Array.isArray(el.strokeDashArray) && el.strokeDashArray.length >= 2) {
        const [on] = el.strokeDashArray;
        return on <= (el.strokeWidth || 2) * 1.5 ? 'sysDot' : 'dash';
    }
    return undefined;
}

function lineOf(el: DrawingElement, op: number, open = false): Line | null {
    const c = toColor(el.strokeColor, op);
    if (!c || !(el.strokeWidth > 0)) return null;
    const cap = el.strokeLineCap === 'butt' ? 'flat' : el.strokeLineCap === 'square' ? 'sq' : 'rnd';
    return {
        width: el.strokeWidth, color: c, dash: dashOf(el),
        cap: open ? cap : undefined,
        join: el.strokeLineJoin === 'miter' ? 'miter' : el.strokeLineJoin === 'bevel' ? 'bevel' : 'round',
    };
}

/** DrawingML arrowheads are sized in multiples of the line width (sm 2×, med 3×, lg 5×). */
function arrowEnd(kind: DrawingElement['startArrowhead'], len: number, width: number): ArrowEnd | undefined {
    if (!kind) return undefined;
    const r = len / Math.max(width, 0.5);
    const size = r <= 2.5 ? 'sm' : r <= 4 ? 'med' : 'lg';
    const type: ArrowEnd['type'] =
        kind === 'triangle' ? 'triangle'
        : kind === 'dot' || kind === 'circle' ? 'oval'
        : kind === 'diamond' || kind === 'diamondFilled' ? 'diamond'
        : 'arrow'; // arrow, bar, crowsfoot: the open arrow is the nearest PowerPoint has
    return { type, size };
}

// ── Text ────────────────────────────────────────────────────────────────────────────────────

const alignOf = (a: string | undefined, dflt: 'l' | 'ctr' | 'r'): 'l' | 'ctr' | 'r' =>
    a === 'center' ? 'ctr' : a === 'right' ? 'r' : a === 'left' ? 'l' : dflt;

const anchorOf = (v: string | undefined): 't' | 'ctr' | 'b' => v === 'top' ? 't' : v === 'bottom' ? 'b' : 'ctr';

function plainParagraphs(text: string, align: Paragraph['align']): Paragraph[] {
    return text.split('\n').map(line => ({ runs: line ? [{ text: line }] : [], align }));
}

type PrevNum = { level: number; scheme: string; index: number } | null;

/** Yappy number style + suffix → PowerPoint's autonumber scheme name. */
function numScheme(sp: RichTextSpan): string {
    const style = ({ 'lower-alpha': 'alphaLc', 'upper-alpha': 'alphaUc', 'lower-roman': 'romanLc', 'upper-roman': 'romanUc' } as Record<string, string>)[sp.listNumberStyle ?? ''] ?? 'arabic';
    const suffix = ({ paren: 'ParenR', parens: 'ParenBoth', none: 'Plain' } as Record<string, string>)[sp.listNumberSuffix ?? ''] ?? 'Period';
    return style + suffix;
}

/** A list span's paragraph properties: kind, level, glyph or numbering, colour, size, indents. */
/** Text width as the canvas measures it; outside a browser (unit tests) a 0.6 em-per-character estimate. */
let measureCtx: CanvasRenderingContext2D | null | undefined;
function measureText(text: string, font: string): number {
    if (measureCtx === undefined) measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    if (measureCtx) { measureCtx.font = font; return measureCtx.measureText(text).width; }
    const px = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 16);
    return text.length * px * 0.6;
}

type TextDefaults = { fontSize?: number; fontFamily?: string };

function listParagraph(sp: RichTextSpan, op: number, prev: PrevNum, textXOf: (sp: RichTextSpan) => number): Partial<Paragraph> {
    const level = sp.listLevel || 0;
    const out: Partial<Paragraph> = { bullet: sp.listType === 'ordered' ? 'num' : 'char', level };
    if (out.bullet === 'num') {
        const scheme = numScheme(sp);
        if (scheme !== 'arabicPeriod') out.numType = scheme;
        // PowerPoint counts a run itself; only a run that doesn't start at 1 needs startAt.
        const continues = prev && prev.level === level && prev.scheme === scheme && (sp.listIndex || 1) === prev.index + 1;
        if (!continues && (sp.listIndex || 1) > 1) out.startAt = sp.listIndex;
    } else if (sp.listMarker && sp.listMarker !== '\u2022') out.bulletChar = sp.listMarker;
    if (sp.listMarkerColor) { const c = toColor(sp.listMarkerColor, op); if (c) out.bulletColor = c; }
    if (sp.listMarkerScale && sp.listMarkerScale !== 1) out.bulletScale = sp.listMarkerScale;
    // The canvas layout's own positions, so the text lines up where Yappy drew it.
    const markerX = listMarkerX(sp);
    const textX = textXOf(sp);
    out.marL = textX;
    out.indent = markerX - textX;
    return out;
}

/** Rich spans → paragraphs. A `\n` inside a span ends the paragraph; list props come from the first span. */
function richParagraphs(spans: RichTextSpan[], align: Paragraph['align'], op: number, defaults: TextDefaults): Paragraph[] {
    const paras: Paragraph[] = [];
    let cur: Paragraph = { runs: [], align };
    let started = false;
    let prevNum: PrevNum = null;
    const textXOf = listTextXResolver(measureText, spans, defaults);
    const push = () => { paras.push(cur); cur = { runs: [], align }; started = false; };
    for (const sp of spans) {
        const pieces = String(sp.text ?? '').split('\n');
        pieces.forEach((piece, i) => {
            if (i > 0) push();
            if (sp.fontSize && !started) cur.endSize = sp.fontSize;
            if (!piece) return;
            // List props belong to the paragraph's first span WITH text: a bare "\n" span that
            // ends the previous paragraph carries none, and must not decide this one's bullet.
            if (!started) {
                started = true;
                if (sp.paragraphSpaceBefore) cur.spaceBefore = sp.paragraphSpaceBefore;
                if (sp.paragraphAlign) cur.align = alignOf(sp.paragraphAlign, align ?? 'l');
                if (sp.listType && sp.listType !== 'none') Object.assign(cur, listParagraph(sp, op, prevNum, textXOf));
                prevNum = cur.bullet === 'num' ? { level: cur.level ?? 0, scheme: cur.numType ?? 'arabicPeriod', index: sp.listIndex || 1 } : null;
            }
            const run: TextRun = { text: piece };
            if (sp.bold) run.bold = true;
            if (sp.italic) run.italic = true;
            if (sp.underline) run.underline = true;
            if (sp.strikethrough) run.strike = true;
            if (sp.color) { const c = toColor(sp.color, op); if (c) run.color = c; }
            if (sp.fontSize) run.size = sp.fontSize;
            if (sp.fontFamily) run.font = typefaceOf(sp.fontFamily);
            cur.runs.push(run);
        });
    }
    push();
    return paras;
}

function textDefaults(el: DrawingElement, op: number, size: number): TextBody['defaults'] {
    const color = toColor(el.textColor || el.strokeColor || '#000000', op) ?? undefined;
    return {
        size, color, font: typefaceOf(el.fontFamily),
        bold: normalizeFontWeight(el.fontWeight) >= 600 ? true : undefined,
        italic: normalizeFontStyle(el.fontStyle) === 'italic' ? true : undefined,
    };
}

/** Yappy's line height is a multiple of the font size; PowerPoint's 100% is ~1.2×, Yappy's default. */
const lineSpacingOf = (el: DrawingElement) => lineHeightFactorOf(el) / DEFAULT_LINE_HEIGHT;

/** The body of a standalone text / richtext element (renderer: 4px padding, middle by default). */
function textElementBody(el: DrawingElement, op: number): TextBody {
    const rich = el.richText && el.richText.length > 0;
    const align = alignOf(el.textAlign, rich ? 'ctr' : 'l');
    return {
        paragraphs: rich ? richParagraphs(el.richText!, align, op, { fontSize: el.fontSize || 20, fontFamily: el.fontFamily || 'sans-serif' }) : plainParagraphs(el.text || '', align),
        anchor: anchorOf(el.verticalAlign), insets: { l: 4, t: 4, r: 4, b: 4 },
        wrap: !el.autoResize, lineSpacing: lineSpacingOf(el),
        defaults: textDefaults(el, op, el.fontSize || 20),
    };
}

/** A shape's label (containerText): wrapped 10px in from each side, centred by default. */
function containerBody(el: DrawingElement, op: number): TextBody | undefined {
    const rich = el.richContainerText && el.richContainerText.length > 0;
    if (!rich && !el.containerText) return undefined;
    const align = alignOf(el.textAlign, 'ctr');
    return {
        paragraphs: rich ? richParagraphs(el.richContainerText!, align, op, { fontSize: el.fontSize || 28, fontFamily: el.fontFamily || 'hand-drawn' }) : plainParagraphs(el.containerText!, align),
        anchor: anchorOf(el.verticalAlign), insets: { l: 10, t: 4, r: 10, b: 4 },
        wrap: true, lineSpacing: lineSpacingOf(el),
        defaults: textDefaults(el, op, el.fontSize || 16),
    };
}

// ── Geometry ────────────────────────────────────────────────────────────────────────────────

/** Centred ShapeGeometry → custom paths in the box frame (0,0)..(w,h). */
function geometryPaths(geo: ShapeGeometry, w: number, h: number): CustomPath[] {
    const out: CustomPath[] = [];
    const hw = Math.abs(w) / 2, hh = Math.abs(h) / 2;
    const add = (d: string, g: ShapeGeometry, evenOdd: boolean) => {
        const cmds = transformCmds(parseSvgPath(d), hw, hh);
        if (cmds.length === 0) return;
        const flags = g as { noFill?: boolean; noStroke?: boolean };
        const extra = { fill: flags.noFill ? false : undefined, stroke: flags.noStroke ? false : undefined };
        if (evenOdd) { out.push({ cmds, ...extra }); return; }
        // DrawingML fills one a:path with the even-odd rule, so separate non-zero contours
        // into their own paths or an inner contour would punch a hole.
        let cur: typeof cmds = [];
        for (const c of cmds) {
            if (c.op === 'M' && cur.length) { out.push({ cmds: cur, ...extra }); cur = []; }
            cur.push(c);
        }
        if (cur.length) out.push({ cmds: cur, ...extra });
    };
    const walk = (g: ShapeGeometry) => {
        const r2 = (n: number) => Math.round(n * 1000) / 1000;
        switch (g.type) {
            case 'rect': {
                const cap = Math.min(Math.abs(g.w), Math.abs(g.h)) / 2;
                const [tl, tr, br, bl] = (Array.isArray(g.r) ? g.r : [g.r || 0, g.r || 0, g.r || 0, g.r || 0]).map(v => Math.max(0, Math.min(v || 0, cap)));
                const arc = (r: number, ex: number, ey: number) => r ? ` A ${r2(r)} ${r2(r)} 0 0 1 ${r2(ex)} ${r2(ey)}` : '';
                const { x, y } = g; const W = g.w, H = g.h;
                add(`M ${x + tl} ${y} H ${x + W - tr}${arc(tr, x + W, y + tr)} V ${y + H - br}${arc(br, x + W - br, y + H)} H ${x + bl}${arc(bl, x, y + H - bl)} V ${y + tl}${arc(tl, x + tl, y)} Z`, g, false);
                break;
            }
            case 'ellipse':
                add(`M ${g.cx - g.rx} ${g.cy} A ${g.rx} ${g.ry} 0 1 0 ${g.cx + g.rx} ${g.cy} A ${g.rx} ${g.ry} 0 1 0 ${g.cx - g.rx} ${g.cy} Z`, g, false);
                break;
            case 'points':
                // An open outline is still filled on the canvas (fill() closes it); closeForFill
                // writes the closed fill and the open stroke separately.
                if (g.points.length >= 2) add(`M ${g.points.map(p => `${p.x} ${p.y}`).join(' L ')}${g.isClosed !== false ? ' Z' : ''}`, g, false);
                break;
            case 'path': add(g.path, g, !!g.evenOdd); break;
            case 'multi': g.shapes.forEach(walk); break;
        }
    };
    walk(geo);
    return out;
}

/** Shapes whose outline PowerPoint has as a preset, so they keep its native resize handles. */
function presetFor(el: DrawingElement): Geometry | null {
    if (el.warp || (el.points && el.points.length)) return null;
    if (el.type === 'circle') return { kind: 'preset', prst: 'ellipse' };
    if (el.type === 'rectangle') {
        const [tl, tr, br, bl] = cornerRadiiPx(el as any);
        if (!tl && !tr && !br && !bl) return { kind: 'preset', prst: 'rect' };
        if (tl === tr && tr === br && br === bl) {
            const ss = Math.min(Math.abs(el.width), Math.abs(el.height));
            return ss > 0 ? { kind: 'preset', prst: 'roundRect', adj: { adj: Math.min(50000, (tl / ss) * 100000) } } : null;
        }
    }
    return null;
}

// ── Raster decisions ────────────────────────────────────────────────────────────────────────

/** Types whose rendering isn't their outline + one label (compartments, widgets, media). */
const RASTER_TYPES = new Set(['umlClass', 'umlInterface', 'qrCode', 'video', 'codeBlock']);
const FREEHAND = new Set(['fineliner', 'inkbrush', 'marker', 'ink']);
const HANDLED = new Set(['text', 'richtext', 'image', 'line', 'arrow']);

function needsRaster(el: DrawingElement): boolean {
    const e = el as any;
    if (RASTER_TYPES.has(el.type)) return true;
    if (el.clipMaskId || el.shadowEnabled || el.glowEnabled || (el.featherRadius ?? 0) > 0) return true;
    if (el.blendMode && el.blendMode !== 'normal') return true;
    if (el.shearX || el.shearY) return true;
    if (hasExtrude(el) || hasRevolve(el) || hasInflate(el) || hasTransformEffect(el)) return true;
    if (el.appearance && ((el.appearance.fills?.length ?? 0) + (el.appearance.strokes?.length ?? 0)) > 0) return true;
    const fs = el.fillStyle as string;
    if (fs === 'image' || fs === 'mesh' || fs === 'pattern' || el.backgroundImage) return true;
    if (el.curvedText) return true;
    if ((el.type === 'text' || el.type === 'richtext') && (el.verticalText || (e.charTransforms?.length ?? 0) > 0)) return true;
    if (el.type === 'image') {
        if (el.warp || el.pixelEffect) return true;
        const f = el as any;
        if ((f.filterBrightness ?? 100) !== 100 || (f.filterContrast ?? 100) !== 100 || (f.filterSaturate ?? 100) !== 100
            || (f.filterBlur ?? 0) || (f.filterHueRotate ?? 0) || (f.filterInvert ?? 0) || (f.filterSepia ?? 0)
            || (f.filterGrayscale ?? 0)) return true;
    }
    return false;
}

// ── Media ───────────────────────────────────────────────────────────────────────────────────

function dataUrlBytes(url: string): { bytes: Uint8Array; mime: string } | null {
    const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(url);
    if (!m) return null;
    try {
        const raw = m[2] ? atob(m[3]) : decodeURIComponent(m[3]);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
        return { bytes, mime: (m[1] || '').toLowerCase() };
    } catch { return null; }
}

/** PNG/JPEG/GIF go in as they are; anything else (WebP, SVG) is re-encoded to PNG through a canvas. */
export function mediaOf(url: string | undefined): Media | null {
    if (!url) return null;
    const d = dataUrlBytes(url);
    if (d && d.mime === 'image/png') return { bytes: d.bytes, ext: 'png' };
    if (d && (d.mime === 'image/jpeg' || d.mime === 'image/jpg')) return { bytes: d.bytes, ext: 'jpeg' };
    if (d && d.mime === 'image/gif') return { bytes: d.bytes, ext: 'gif' };
    const img = getImage(url);
    if (!img || !img.naturalWidth) return null;
    try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d')!.drawImage(img, 0, 0);
        const png = dataUrlBytes(c.toDataURL('image/png'));
        return png ? { bytes: png.bytes, ext: 'png' } : null;
    } catch { return null; } // a tainted cross-origin image can't be read back
}

// ── Conversion ──────────────────────────────────────────────────────────────────────────────

interface Conv {
    ox: number; oy: number;          // page origin in world space
    nextId: number;
    ids: Map<string, { id: number; item: ShapeItem }>; // for connector glue
    /** Glue resolved after the page is converted: a connector may sit below its shapes in z-order. */
    glue: (() => void)[];
    hooks: ConvertHooks;
    report: ConvertReport;
}

const nameOf = (el: DrawingElement) => (el as any).name || el.type;

function placed(el: DrawingElement, c: Conv) {
    const w = Math.abs(el.width), h = Math.abs(el.height);
    const x = Math.min(el.x, el.x + el.width) - c.ox, y = Math.min(el.y, el.y + el.height) - c.oy;
    return { x, y, w, h, rot: el.angle ? (el.angle * 180) / Math.PI : undefined, flipH: !!el.flipX || undefined, flipV: !!el.flipY || undefined };
}

function pictureFrom(els: DrawingElement[], c: Conv, name: string): Item[] {
    const r = c.hooks.rasterize(els);
    const media = r ? mediaOf(r.dataURL) : null;
    if (!r || !media) return [];
    c.report.pictures++;
    return [{ kind: 'picture', id: c.nextId++, name, x: r.x - c.ox, y: r.y - c.oy, w: r.width, h: r.height, media }];
}

function imageItem(el: DrawingElement, c: Conv): Item[] {
    const media = mediaOf(el.dataURL);
    if (!media) return pictureFrom([el], c, nameOf(el));
    let crop;
    if (el.crop) {
        const img = el.dataURL ? getImage(el.dataURL) : null;
        const nw = img?.naturalWidth, nh = img?.naturalHeight;
        if (nw && nh) {
            const k = el.crop;
            crop = { l: k.x / nw, t: k.y / nh, r: 1 - (k.x + k.width) / nw, b: 1 - (k.y + k.height) / nh };
        }
    }
    const op = (el.opacity ?? 100) / 100;
    c.report.native++;
    return [{ kind: 'picture', id: c.nextId++, name: nameOf(el), ...placed(el, c), media, crop, alpha: op < 1 ? op : undefined, descr: (el as any).altText }];
}

/** Connector label: PowerPoint connectors carry no text, so the label is a text box at the path midpoint. */
function labelBox(el: DrawingElement, mid: { x: number; y: number }, c: Conv, op: number): Item[] {
    const body = containerBody(el, op);
    if (!body) return [];
    const size = el.fontSize || 16;
    const lines = (el.containerText || '').split('\n');
    const longest = Math.max(1, ...lines.map(l => l.length));
    const w = Math.max(40, longest * size * 0.6 + 24), h = Math.max(size * 1.6, lines.length * size * 1.25 + 8);
    body.wrap = false; body.anchor = 'ctr';
    body.paragraphs.forEach(p => { p.align = 'ctr'; });
    // A label sits on a backing of the canvas colour so the line doesn't run through it.
    return [{ kind: 'shape', id: c.nextId++, name: `${nameOf(el)} label`, textBox: true, x: mid.x - c.ox - w / 2, y: mid.y - c.oy - h / 2, w, h,
        geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null, text: body }];
}

/** The connection site (0 top, 1 left, 2 bottom, 3 right) a world point sits on, within 2px. */
function siteAt(target: ShapeItem, pt: { x: number; y: number }, c: Conv): number {
    const cx = target.x + target.w / 2, cy = target.y + target.h / 2;
    const rad = ((target.rot || 0) * Math.PI) / 180;
    const sites = [[0, -target.h / 2], [-target.w / 2, 0], [0, target.h / 2], [target.w / 2, 0]];
    const px = pt.x - c.ox, py = pt.y - c.oy;
    for (let i = 0; i < 4; i++) {
        let [sx, sy] = sites[i];
        if (target.flipH) sx = -sx;
        if (target.flipV) sy = -sy;
        const wx = cx + sx * Math.cos(rad) - sy * Math.sin(rad), wy = cy + sx * Math.sin(rad) + sy * Math.cos(rad);
        if (Math.hypot(wx - px, wy - py) <= 2) return i;
    }
    return -1;
}

/**
 * True when every point of the path, control points included, lies on the start→end chord: a
 * "curve" with collinear handles (what `connect()` draws by default) IS a straight line, and as a
 * straight line it can be a glued PowerPoint connector instead of a free-floating path.
 */
function isStraight(cmds: PathCmd[], s: { x: number; y: number }, e: { x: number; y: number }): boolean {
    const dx = e.x - s.x, dy = e.y - s.y, len = Math.hypot(dx, dy);
    if (!(len > 0)) return false;
    const off = (x: number, y: number) => Math.abs((x - s.x) * dy - (y - s.y) * dx) / len;
    const along = (x: number, y: number) => ((x - s.x) * dx + (y - s.y) * dy) / (len * len);
    const ok = (x: number, y: number) => off(x, y) <= 0.5 && along(x, y) >= -0.01 && along(x, y) <= 1.01;
    return cmds.every(c => c.op === 'Z' ? false : c.op === 'C' ? ok(c.x1, c.y1) && ok(c.x2, c.y2) && ok(c.x, c.y) : ok(c.x, c.y));
}

function lineItems(el: DrawingElement, c: Conv): Item[] {
    const op = (el.opacity ?? 100) / 100;
    const base = lineOf(el, op, true);
    const geom = connectorGeometry(el);
    const items: Item[] = [];
    if (base) {
        const isArrow = el.type === 'arrow';
        const startKind = isArrow ? el.startArrowhead : null;
        // Legacy arrows with neither end set draw an end arrowhead (export.ts does the same).
        const endKind = isArrow ? (el.endArrowhead || (!el.startArrowhead ? 'arrow' : null)) : null;
        const line: Line = { ...base, head: arrowEnd(startKind, arrowheadSize(el, 'start'), el.strokeWidth), tail: arrowEnd(endKind, arrowheadSize(el, 'end'), el.strokeWidth) };
        if (!geom.d || isStraight(parseSvgPath(geom.d), geom.start, geom.end)) {
            // Straight: a real connector, glued where the end sits on a connection site.
            const { start: s, end: e } = geom;
            const conn: ConnectorItem = {
                kind: 'connector', id: c.nextId++, name: nameOf(el),
                x: Math.min(s.x, e.x) - c.ox, y: Math.min(s.y, e.y) - c.oy, w: Math.abs(e.x - s.x), h: Math.abs(e.y - s.y),
                flipH: e.x < s.x || undefined, flipV: e.y < s.y || undefined,
                geom: { kind: 'preset', prst: 'straightConnector1' }, line,
            };
            const glue = (b: DrawingElement['startBinding'], pt: { x: number; y: number }) => {
                const t = b?.elementId ? c.ids.get(b.elementId) : undefined;
                if (!t) return undefined;
                const idx = siteAt(t.item, pt, c);
                return idx >= 0 ? { id: t.id, idx } : undefined;
            };
            c.glue.push(() => { conn.start = glue(el.startBinding, s); conn.end = glue(el.endBinding, e); });
            items.push(conn);
        } else {
            const world = parseSvgPath(geom.d);
            const b = cmdsBounds(world);
            if (b) {
                const w = Math.max(b.maxX - b.minX, 0.01), h = Math.max(b.maxY - b.minY, 0.01);
                items.push({ kind: 'shape', id: c.nextId++, name: nameOf(el), x: b.minX - c.ox, y: b.minY - c.oy, w, h,
                    geom: { kind: 'custom', paths: [{ cmds: transformCmds(world, -b.minX, -b.minY), fill: false }] },
                    fill: { kind: 'none' }, line });
            }
        }
        c.report.native++;
    }
    items.push(...labelBox(el, geom.mid, c, op));
    return items;
}

function freehandItem(el: DrawingElement, c: Conv): Item[] {
    const op = (el.opacity ?? 100) / 100;
    const pts = normalizeElementPoints(el.points);
    const line = lineOf(el, op, true);
    if (pts.length < 2 || !line) return [];
    line.cap = 'rnd'; line.join = 'round';
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    const w = Math.max(Math.max(...xs) - minX, 0.01), h = Math.max(Math.max(...ys) - minY, 0.01);
    const cmds = pts.map((p, i) => ({ op: i ? 'L' as const : 'M' as const, x: p.x - minX, y: p.y - minY }));
    c.report.native++;
    return [{ kind: 'shape', id: c.nextId++, name: nameOf(el), x: el.x + minX - c.ox, y: el.y + minY - c.oy, w, h,
        rot: el.angle ? (el.angle * 180) / Math.PI : undefined,
        geom: { kind: 'custom', paths: [{ cmds, fill: false }] }, fill: { kind: 'none' }, line }];
}

function textItem(el: DrawingElement, c: Conv): Item[] {
    const op = (el.opacity ?? 100) / 100;
    const hasText = el.text || (el.richText && el.richText.length > 0);
    if (!hasText) return [];
    c.report.native++;
    // The text renderer paints a set background as a flat rect, whatever the fill style says.
    const bg = toColor(el.backgroundColor, op);
    return [{ kind: 'shape', id: c.nextId++, name: nameOf(el), ...placed(el, c), textBox: true,
        geom: { kind: 'preset', prst: 'rect' }, fill: bg ? { kind: 'solid', color: bg } : { kind: 'none' }, line: null, text: textElementBody(el, op) }];
}

/** A gradient the renderer painted with, in world space. */
interface RecordedGrad { kind: 'linear' | 'radial'; x1: number; y1: number; x2: number; y2: number; stops: { pos: number; color: Color }[] }

/** One draw call recorded from the clean renderer, in the element's unrotated world frame. */
interface RecordedOp {
    cmds: PathCmd[];
    fill: string | null;          // a colour, or null
    grad: RecordedGrad | null;    // set instead of `fill` for a gradient fill
    stroke: string | null;
    fillAlpha: number;            // the renderer's globalAlpha at the call
    strokeAlpha: number;
    width: number;
    dash: boolean;
    evenOdd: boolean;
}

type Mat = [number, number, number, number, number, number];
const parseMatrix = (t: string | null): Mat => {
    const m = t && /matrix\(([^)]+)\)/.exec(t);
    const v = m ? m[1].split(/[\s,]+/).map(Number) : [];
    return v.length === 6 && v.every(Number.isFinite) ? v as Mat : [1, 0, 0, 1, 0, 0];
};
const apply = (m: Mat, x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

/**
 * A stand-in for `rough.canvas()` that draws into the SvgRenderer instead of a canvas. Renderers
 * paint many fills with rough.js even in architectural style (`rc.polygon(points, { stroke:
 * 'none', fill })`), so recording only the IRenderer missed every such fill — and a guess at
 * "the shape is filled" was wrong for the stroke-only ones (a wavy divider). The generator's
 * `toPaths` gives the exact path data rough.js would paint, emitted at the renderer's current
 * transform, which is the transform the real canvas would have applied.
 */
function recordingRough(svg: SvgRenderer) {
    const gen = rough.generator();
    const emit = (drawable: any) => {
        for (const p of gen.toPaths(drawable)) {
            svg.save();
            if (p.fill && p.fill !== 'none' && (!p.stroke || p.stroke === 'none')) {
                svg.fillStyle = p.fill;
                svg.fillPath(p.d);
            } else if (p.stroke && p.stroke !== 'none' && p.strokeWidth > 0) {
                svg.strokeStyle = p.stroke;
                svg.lineWidth = p.strokeWidth;
                svg.strokePath(p.d);
            }
            svg.restore();
        }
        return drawable;
    };
    const rc: any = { generator: gen, draw: emit, getDefaultOptions: () => gen.defaultOptions };
    for (const m of ['line', 'rectangle', 'ellipse', 'circle', 'linearPath', 'polygon', 'arc', 'curve', 'path'] as const) {
        rc[m] = (...args: any[]) => emit((gen as any)[m](...args));
    }
    return rc;
}

/**
 * Record what the architectural renderer actually draws for this element — outline AND detail
 * (the database's lid, a server's bays, an icon's strokes, a stick figure's open limbs), in draw
 * order. `getShapeGeometry` is only the silhouette, so building from it alone filled stick-figure
 * limbs and lost every glyph and hole. Rotation, flips, opacity and the label are taken off
 * first: the slide object carries those itself.
 *
 * Returns 'picture' when the drawing holds text or an image (a "?" glyph, a placeholder), which a
 * shape can't carry; null when it can't be recorded at all (the caller then uses the outline).
 */
function recordOps(el: DrawingElement): RecordedOp[] | 'picture' | null {
    const fs = el.fillStyle as string;
    const clone = {
        ...el, renderStyle: 'architectural', roughness: 0, angle: 0, flipX: false, flipY: false, opacity: 100,
        containerText: undefined, richContainerText: undefined,
        // Hatching is re-created as a pattern fill on the body; recording it would be hundreds of lines.
        fillStyle: HATCH_PRESET[fs] ? 'solid' : el.fillStyle,
    } as DrawingElement;
    const svg = new SvgRenderer();
    try {
        const tmp = document.createElement('canvas');
        renderElement(recordingRough(svg) as any, tmp.getContext('2d') as any, clone, false, 1, svg as any);
    } catch { return null; }
    if (svg.failed) return null;

    const grads = new Map<string, Element>();
    for (const g of Array.from(svg.defs.children)) if (g.id) grads.set(g.id, g);
    const gradOf = (ref: string, m: Mat): RecordedGrad | null => {
        const g = grads.get(ref.replace(/^url\(#|\)$/g, ''));
        if (!g) return null;
        const stops = Array.from(g.children).map(s => ({ pos: +(s.getAttribute('offset') || 0), color: toColor(s.getAttribute('stop-color')) ?? { hex: '#000000', alpha: 0 } }));
        if (!stops.length) return null;
        if (g.tagName.toLowerCase() === 'lineargradient') {
            const p1 = apply(m, +g.getAttribute('x1')!, +g.getAttribute('y1')!), p2 = apply(m, +g.getAttribute('x2')!, +g.getAttribute('y2')!);
            return { kind: 'linear', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stops };
        }
        return { kind: 'radial', x1: 0, y1: 0, x2: 0, y2: 0, stops };
    };

    const ops: RecordedOp[] = [];
    let verdict: 'ok' | 'picture' | 'fail' = 'ok';
    const walk = (node: Element) => {
        for (const ch of Array.from(node.children)) {
            if (verdict !== 'ok') return;
            const tag = ch.tagName.toLowerCase();
            if (tag === 'g') { if (ch.getAttribute('clip-path')) { verdict = 'picture'; return; } walk(ch); continue; }
            if (tag === 'text' || tag === 'image') { verdict = 'picture'; return; }
            let d: string | null = null;
            if (tag === 'path') d = ch.getAttribute('d');
            else if (tag === 'rect') {
                const x = +ch.getAttribute('x')!, y = +ch.getAttribute('y')!, w = +ch.getAttribute('width')!, h = +ch.getAttribute('height')!;
                d = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
            } else { verdict = 'fail'; return; }
            const m = parseMatrix(ch.getAttribute('transform'));
            const cmds = affineCmds(parseSvgPath(d || ''), m);
            if (!cmds.length) continue;
            const fill = ch.getAttribute('fill'), stroke = ch.getAttribute('stroke');
            const isUrl = !!fill && fill.startsWith('url(');
            // Fill/stroke opacity the renderer applied through globalAlpha.
            const fo = +(ch.getAttribute('fill-opacity') ?? 1), so = +(ch.getAttribute('stroke-opacity') ?? 1);
            ops.push({
                cmds,
                fill: fill && fill !== 'none' && !isUrl ? fill : null,
                grad: isUrl ? gradOf(fill!, m) : null,
                stroke: stroke && stroke !== 'none' ? stroke : null,
                fillAlpha: Number.isFinite(fo) ? fo : 1, strokeAlpha: Number.isFinite(so) ? so : 1,
                width: (+(ch.getAttribute('stroke-width') || 1)) * Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])),
                dash: !!ch.getAttribute('stroke-dasharray'),
                evenOdd: ch.getAttribute('fill-rule') === 'evenodd',
            });
        }
    };
    walk(svg.root);
    return verdict === 'ok' ? ops : verdict === 'picture' ? 'picture' : null;
}

const sameColor = (a: string | null, b: string | undefined) => {
    if (!a || !b) return false;
    const x = cssColorToRgb255(a), y = cssColorToRgb255(b);
    return !!x && !!y && x[0] === y[0] && x[1] === y[1] && x[2] === y[2];
};

/** A recorded linear gradient as a DrawingML gradient over the bounding box of the path it fills. */
function gradPaint(g: RecordedGrad, b: { minX: number; minY: number; maxX: number; maxY: number }, op: number): Paint {
    const stops = g.stops.map(s => ({ pos: s.pos, color: op < 1 ? { ...s.color, alpha: (s.color.alpha ?? 1) * op } : s.color }));
    if (g.kind === 'radial') return { kind: 'radial', stops };
    const dx = g.x2 - g.x1, dy = g.y2 - g.y1, len = Math.hypot(dx, dy);
    if (!(len > 0)) return { kind: 'solid', color: stops[stops.length - 1].color };
    const ux = dx / len, uy = dy / len;
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    const P = (Math.abs((b.maxX - b.minX) * ux) + Math.abs((b.maxY - b.minY) * uy)) / 2;
    if (!(P > 0)) return { kind: 'solid', color: stops[0].color };
    // Position of gradient parameter t on DrawingML's line across the box (u = 0..1).
    const uOf = (t: number) => (((g.x1 + dx * t) - cx) * ux + ((g.y1 + dy * t) - cy) * uy + P) / (2 * P);
    const mapped = [...stops].sort((p, q) => p.pos - q.pos).map(s => ({ pos: uOf(s.pos), color: s.color }));
    return { kind: 'linear', angle: (Math.atan2(dy, dx) * 180) / Math.PI, stops: clipStops(mapped) };
}

/** Stops on an extended line, cut to [0,1] with the true colour interpolated at each end. */
function clipStops(mapped: { pos: number; color: Color }[]): { pos: number; color: Color }[] {
    if (mapped.length < 2) return mapped.map(m => ({ ...m, pos: Math.max(0, Math.min(1, m.pos)) }));
    const at = (u: number): Color => {
        if (u <= mapped[0].pos) return mapped[0].color;
        for (let i = 1; i < mapped.length; i++) {
            const p0 = mapped[i - 1], p1 = mapped[i];
            if (u <= p1.pos) return mixColor(p0.color, p1.color, p1.pos > p0.pos ? (u - p0.pos) / (p1.pos - p0.pos) : 0);
        }
        return mapped[mapped.length - 1].color;
    };
    return [{ pos: 0, color: at(0) }, ...mapped.filter(m => m.pos > 0 && m.pos < 1), { pos: 1, color: at(1) }];
}

/**
 * Canvas `fill()` closes every open subpath implicitly; DrawingML readers don't all do the same
 * (LibreOffice leaves an open path unfilled). So a filled path with an open subpath is written
 * twice: closed for the fill, as drawn for the stroke — never closed for the stroke, or a stick
 * figure's open limb would grow a third side.
 */
function closeForFill(p: CustomPath): CustomPath[] {
    if (p.fill === false) return [p];
    const subs: PathCmd[][] = [];
    for (const c of p.cmds) { if (c.op === 'M' || !subs.length) subs.push([]); subs[subs.length - 1].push(c); }
    if (subs.every(s => s[s.length - 1].op === 'Z')) return [p];
    const closed = subs.flatMap(s => s[s.length - 1].op === 'Z' ? s : [...s, { op: 'Z' as const }]);
    const out: CustomPath[] = [{ cmds: closed, fill: p.fill, stroke: false }];
    if (p.stroke !== false) out.push({ cmds: p.cmds, fill: false, stroke: p.stroke });
    return out;
}

const keyOf = (o: RecordedOp) => JSON.stringify(o.cmds);

function shapeItem(el: DrawingElement, c: Conv): Item[] | null {
    const op = (el.opacity ?? 100) / 100;
    const box = placed(el, c);
    const label = containerBody(el, op);
    let geom = presetFor(el);
    if (!geom) {
        const g = getShapeGeometry(el);
        const geoPaths = g ? geometryPaths(g, el.width, el.height) : [];
        const ops = recordOps(el);
        if (ops === 'picture') return null; // caller rasterizes
        if (ops && ops.length) {
            const bx = Math.min(el.x, el.x + el.width), by = Math.min(el.y, el.y + el.height);
            const geoWorld = geoPaths.length ? geoPaths.filter(p => p.fill !== false).map(p => transformCmds(p.cmds, bx, by)) : null;
            const dashed = !!dashOf(el);
            // One shape can carry one fill and one outline style. If every draw call uses the
            // element's own fill colour, stroke colour, width and dash, the drawing is one shape
            // with several paths; anything else (shading, a thick rim, a coloured glyph) is a group.
            const ownGradient = ['linear', 'radial', 'conic'].includes(el.fillStyle as string);
            const uniform = ops.every(o => (!o.grad || ownGradient) && o.fillAlpha >= 1 && o.strokeAlpha >= 1
                && (!o.fill || sameColor(o.fill, el.backgroundColor))
                && (!o.stroke || (sameColor(o.stroke, el.strokeColor) && Math.abs(o.width - el.strokeWidth) < 0.75 && o.dash === dashed)));
            if (!uniform) {
                const grp = recordedGroup(el, ops, box, label, c, op, geoWorld);
                return grp ? [grp] : null;
            }
            const paths: CustomPath[] = [];
            const local = (cmds: PathCmd[]) => transformCmds(cmds, -bx, -by);
            for (let i = 0; i < ops.length; i++) {
                const o = ops[i], n = ops[i + 1];
                // The renderer fills then strokes the same path as two calls; that is one path here.
                const pairedStroke = !!((o.fill || o.grad) && !o.stroke && n && n.stroke && !n.fill && !n.grad && keyOf(n) === keyOf(o));
                const stroke = !!o.stroke || pairedStroke;
                if (o.fill || o.grad) {
                    const fills = safeFill(o, geoWorld);
                    if (!fills) return null; // no faithful fill: the caller places a picture
                    if (fills.length === 1 && fills[0] === o.cmds) {
                        paths.push(...closeForFill({ cmds: local(o.cmds), stroke: stroke ? undefined : false }));
                    } else {
                        // Fill from the outline, stroke along the path the renderer drew.
                        paths.push(...fills.map(f => ({ cmds: local(f), stroke: false as const })));
                        if (stroke) paths.push({ cmds: local(o.cmds), fill: false });
                    }
                } else {
                    paths.push({ cmds: local(o.cmds), fill: false, stroke: stroke ? undefined : false });
                }
                if (pairedStroke) i++;
            }
            geom = { kind: 'custom', paths };
        } else if (geoPaths.length) {
            geom = { kind: 'custom', paths: geoPaths.flatMap(closeForFill) };
        } else return null;
    }
    const item: ShapeItem = { kind: 'shape', id: c.nextId++, name: nameOf(el), ...box, geom,
        fill: fillOf(el, op), line: lineOf(el, op), text: label };
    c.ids.set(el.id, { id: item.id, item });
    c.report.native++;
    return [item];
}

const cmdsToD = (cmds: PathCmd[]) => cmds.map(c => c.op === 'Z' ? 'Z'
    : c.op === 'C' ? `C ${c.x1} ${c.y1} ${c.x2} ${c.y2} ${c.x} ${c.y}` : `${c.op} ${c.x} ${c.y}`).join(' ');

let hitCtx: CanvasRenderingContext2D | null = null;
const SAMPLES = 28;

/**
 * Where a set of filled paths paints, sampled on a grid over `b`. `rule` is the rule each path
 * is filled with; separate paths union (that is how both canvas and DrawingML composite them).
 */
function coverage(paths: PathCmd[][], rule: CanvasFillRule, b: { minX: number; minY: number; maxX: number; maxY: number }): boolean[] {
    hitCtx ??= document.createElement('canvas').getContext('2d');
    const out: boolean[] = [];
    if (!hitCtx) return out;
    const p2 = paths.map(p => new Path2D(cmdsToD(p)));
    for (let j = 0; j < SAMPLES; j++) for (let i = 0; i < SAMPLES; i++) {
        const x = b.minX + ((i + 0.5) / SAMPLES) * (b.maxX - b.minX), y = b.minY + ((j + 0.5) / SAMPLES) * (b.maxY - b.minY);
        out.push(p2.some(p => hitCtx!.isPointInPath(p, x, y, rule)));
    }
    return out;
}
const mismatch = (a: boolean[], b: boolean[]) => a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0) / Math.max(1, a.length);

/**
 * A canvas fill is non-zero; a DrawingML reader fills a path even-odd (LibreOffice does), so a
 * non-zero path that runs over itself — the database barrel traced on round its cap — gets a hole.
 * Returns the paths to write for this fill: the recorded path when the two rules agree, the
 * geometry outline when it covers what the canvas covers, or null when neither is faithful.
 */
function safeFill(o: RecordedOp, geoWorld: PathCmd[][] | null): PathCmd[][] | null {
    if (o.evenOdd) return [o.cmds];
    const b = cmdsBounds(o.cmds);
    if (!b) return [o.cmds];
    const nz = coverage([o.cmds], 'nonzero', b);
    if (mismatch(nz, coverage([o.cmds], 'evenodd', b)) === 0) return [o.cmds];
    if (geoWorld && mismatch(nz, coverage(geoWorld, 'evenodd', b)) <= 0.03) return geoWorld;
    return null;
}

/** A multi-style drawing (shading, a thick rim, an icon's coloured parts) as a group, label on top. */
function recordedGroup(el: DrawingElement, ops: RecordedOp[], box: ReturnType<typeof placed>, label: TextBody | undefined, c: Conv, op: number, geoWorld: PathCmd[][] | null): GroupItem | null {
    const children: Item[] = [];
    for (let i = 0; i < ops.length; i++) {
        const o = ops[i], n = ops[i + 1];
        const paired = !!((o.fill || o.grad) && !o.stroke && n && n.stroke && !n.fill && !n.grad && keyOf(n) === keyOf(o));
        const s = paired ? n : o;
        const b = cmdsBounds(o.cmds);
        if (!b) continue;
        const w = Math.max(b.maxX - b.minX, 0.01), h = Math.max(b.maxY - b.minY, 0.01);
        const fillCol = toColor(o.fill, op * o.fillAlpha);
        const fill: Paint = o.grad ? gradPaint(o.grad, b, op) : fillCol ? { kind: 'solid', color: fillCol } : { kind: 'none' };
        const strokeCol = toColor(s.stroke, op * s.strokeAlpha);
        const line: Line | null = strokeCol ? { width: s.width, color: strokeCol, dash: s.dash ? 'dash' : undefined, join: 'round', cap: 'rnd' } : null;
        const filled = !!(o.fill || o.grad);
        const local = (cmds: PathCmd[]) => transformCmds(cmds, -b.minX, -b.minY);
        let paths: CustomPath[];
        if (filled) {
            const fills = safeFill(o, geoWorld);
            if (!fills) return null;
            paths = fills.length === 1 && fills[0] === o.cmds
                ? closeForFill({ cmds: local(o.cmds), stroke: strokeCol ? undefined : false })
                : [...fills.map(f => ({ cmds: local(f), stroke: false as const })), ...(strokeCol ? [{ cmds: local(o.cmds), fill: false as const }] : [])];
        } else paths = [{ cmds: local(o.cmds), fill: false, stroke: strokeCol ? undefined : false }];
        children.push({ kind: 'shape', id: c.nextId++, name: `${nameOf(el)} part`, x: b.minX - c.ox, y: b.minY - c.oy, w, h,
            geom: { kind: 'custom', paths }, fill, line });
        if (paired) i++;
    }
    if (label) {
        children.push({ kind: 'shape', id: c.nextId++, name: `${nameOf(el)} label`, textBox: true, x: box.x, y: box.y, w: box.w, h: box.h,
            geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null, text: label });
    }
    c.report.native++;
    // The group's frame IS the element box, so its rotation and flips turn about the same centre.
    return { kind: 'group', id: c.nextId++, name: nameOf(el), ...box, children };
}

function convertOne(el: DrawingElement, c: Conv): Item[] {
    if (needsRaster(el)) return pictureFrom([el], c, nameOf(el));
    try {
        if (el.type === 'text' || el.type === 'richtext') return textItem(el, c);
        if (el.type === 'image') return imageItem(el, c);
        if (el.type === 'line' || el.type === 'arrow') return lineItems(el, c);
        if (FREEHAND.has(el.type)) return freehandItem(el, c);
        if (!HANDLED.has(el.type)) {
            const s = shapeItem(el, c);
            if (s) return s;
        }
    } catch { /* fall through to a picture rather than drop the object */ }
    return pictureFrom([el], c, nameOf(el));
}

/**
 * Group consecutive elements that share their outermost group into PowerPoint groups (recursively
 * for nested groups). Members split apart in z-order become separate groups, because a PowerPoint
 * group's members are contiguous in z-order and the drawing order wins over the grouping.
 */
function convertRun(els: DrawingElement[], depth: number, c: Conv): Item[] {
    const out: Item[] = [];
    let i = 0;
    const gid = (el: DrawingElement) => {
        const g = el.groupIds ?? [];
        return g.length > depth ? g[g.length - 1 - depth] : undefined;
    };
    while (i < els.length) {
        const g = gid(els[i]);
        if (!g) {
            const items = convertOne(els[i], c);
            const link = deckLinkOf(els[i].link);
            if (link) for (const it of items) it.link = link;
            out.push(...items);
            i++;
            continue;
        }
        let j = i;
        while (j < els.length && gid(els[j]) === g) j++;
        const children = convertRun(els.slice(i, j), depth + 1, c);
        if (children.length > 1) {
            const b = itemsBounds(children);
            const grp: GroupItem = { kind: 'group', id: c.nextId++, name: els[i].groupNames?.[g] || 'Group', ...b, children };
            out.push(grp);
        } else out.push(...children);
        i = j;
    }
    return out;
}

function itemsBounds(items: Item[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const it of items) {
        minX = Math.min(minX, it.x); minY = Math.min(minY, it.y);
        maxX = Math.max(maxX, it.x + it.w); maxY = Math.max(maxY, it.y + it.h);
    }
    return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

// ── Pages ───────────────────────────────────────────────────────────────────────────────────

export function transitionOf(t: SlideTransition | undefined): Transition | undefined {
    if (!t || t.type === 'none') return undefined;
    const durationMs = t.duration ?? 500;
    switch (t.type) {
        case 'fade': return { kind: 'fade', durationMs };
        case 'slide-left': return { kind: 'push', dir: 'l', durationMs };
        case 'slide-right': return { kind: 'push', dir: 'r', durationMs };
        case 'slide-up': return { kind: 'push', dir: 'u', durationMs };
        case 'slide-down': return { kind: 'push', dir: 'd', durationMs };
        case 'zoom-in': return { kind: 'zoom', zoomIn: true, durationMs };
        case 'zoom-out': return { kind: 'zoom', zoomIn: false, durationMs };
        case 'morph': return { kind: 'morph', durationMs };
        default: return undefined;
    }
}

function backgroundOf(page: PageInput, hooks: ConvertHooks): Slide['background'] {
    const s = page.slide;
    if (!s) {
        const col = toColor(page.background);
        return col ? { kind: 'solid', color: col } : undefined;
    }
    const type = s.fillStyle || 'solid';
    const plain = !s.backgroundImage && (!s.canvasTexture || s.canvasTexture === 'none');
    if (plain && type === 'solid') {
        return { kind: 'solid', color: toColor(s.backgroundColor === 'transparent' ? '#ffffff' : (s.backgroundColor || '#ffffff')) ?? { hex: '#ffffff' } };
    }
    if (plain && (type === 'linear' || type === 'radial') && (s.gradientStops?.length ?? 0) > 0) {
        const angle = s.gradientDirection || 0;
        const stops = s.gradientStops!.map(g => ({ pos: g.offset, color: toColor(g.color) ?? { hex: '#ffffff' } }));
        if (type === 'radial') return { kind: 'radial', stops };
        return { kind: 'linear', stops: remapPageStops(stops, angle, page.w, page.h), angle };
    }
    const url = hooks.rasterizeBackground?.(s);
    const media = url ? mediaOf(url) : null;
    if (media) return { kind: 'image', media };
    return { kind: 'solid', color: toColor(s.backgroundColor) ?? { hex: '#ffffff' } };
}

/**
 * `renderSlideBackground` runs a page gradient along a line of the page's half-DIAGONAL each way
 * from the centre, so its end colours fall outside the page; DrawingML (`scaled="0"`) runs it
 * across the page's own extent along that angle. Re-express each stop on the DrawingML line so
 * the page shows the same colours at the same places.
 */
export function remapPageStops(stops: { pos: number; color: Color }[], angleDeg: number, w: number, h: number): { pos: number; color: Color }[] {
    const a = (angleDeg * Math.PI) / 180;
    const L = Math.hypot(w, h) / 2;
    const P = (Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a))) / 2;
    if (!(P > 0) || stops.length < 2) return stops;
    const mapped = [...stops].sort((x, y) => x.pos - y.pos).map(st => ({ pos: (-L + 2 * L * st.pos + P) / (2 * P), color: st.color }));
    return clipStops(mapped);
}

function mixColor(a: Color, b: Color, t: number): Color {
    const ca = cssColorToRgb255(a.hex)!, cb = cssColorToRgb255(b.hex)!;
    const rgb = [0, 1, 2].map(i => Math.round(ca[i] + (cb[i] - ca[i]) * t)) as [number, number, number];
    const aa = a.alpha ?? 1, ab = b.alpha ?? 1, al = aa + (ab - aa) * t;
    return al < 0.999 ? { hex: toHex(rgb), alpha: al } : { hex: toHex(rgb) };
}

/** An object's link (utils/slide-links.ts) as a PowerPoint click action; unsafe ones are dropped. */
function deckLinkOf(link: string | null | undefined): DeckLink | undefined {
    const t = parseLink(link);
    if (t.kind === 'url') return { kind: 'url', url: t.url };
    if (t.kind === 'slide') return { kind: 'slide', key: t.slideId };
    if (t.kind === 'action') return { kind: 'action', action: t.action };
    return undefined;
}

/** A slide's show settings for the deck: hidden, auto-advance, the section it starts. */
export function showFields(s: YappySlide | undefined): Pick<Slide, 'hidden' | 'advanceAfterMs' | 'section'> {
    return {
        ...(s?.hidden && { hidden: true }),
        ...(s?.advanceAfter && s.advanceAfter > 0 && { advanceAfterMs: s.advanceAfter }),
        ...(s?.section && { section: s.section }),
    };
}

/** One page → one deck slide (native objects, pictures where unavoidable). */
export function pageToSlide(page: PageInput, hooks: ConvertHooks, report: ConvertReport): Slide {
    const c: Conv = { ox: page.x, oy: page.y, nextId: 2, ids: new Map(), glue: [], hooks, report };
    const items = convertRun(page.elements, 0, c);
    c.glue.forEach(f => f());
    return {
        name: page.name,
        items,
        background: backgroundOf(page, hooks),
        transition: transitionOf(page.slide?.transition),
        notes: page.slide?.notes?.trim() ? page.slide.notes : undefined,
        key: page.slide?.id,
        ...showFields(page.slide),
    };
}

/** Uniformly fit a page of size (w,h) into the deck size, centred. */
export function fitInto(w: number, h: number, dw: number, dh: number) {
    const scale = Math.min(dw / Math.max(w, 1), dh / Math.max(h, 1));
    return { scale, dx: (dw - w * scale) / 2, dy: (dh - h * scale) / 2 };
}
