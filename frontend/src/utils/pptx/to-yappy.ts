/**
 * Deck (read from a .pptx) → a Yappy slides document.
 *
 * Shapes whose Yappy twin has the same outline become that type, so they stay "a rectangle", "an
 * ellipse": rect, roundRect, ellipse, diamond and the isosceles triangle. Every other preset is
 * evaluated from ECMA-376's own definition (guides.ts) and becomes a vector path with that exact
 * outline — a PowerPoint "cloud" or "wedgeRoundRectCallout" looks the same, it just isn't one of
 * Yappy's own shape types. Text boxes become text, connectors become lines/arrows bound to the
 * shapes they were glued to, pictures become images, groups become groups.
 *
 * Everything imports in architectural (clean) style: a PowerPoint deck was never hand-drawn.
 */
import type { DrawingElement, PathSubpath, PathAnchor, RichTextSpan, TextAlign, PatternFill } from '../../types';
import type { SlideDocument, Slide as YappySlide, SlideTransition } from '../../types/slide-types';
import { createSlideDocument, createDefaultSlide } from '../../types/slide-types';
import type { Deck, Item, Paint, Color, Line, TextBody, Paragraph, ShapeItem, ConnectorItem, PictureItem, Media, CustomPath, PathCmd, Slide, Transition, DeckLink } from './deck';
import { slideLink, actionLink } from '../slide-links';
import { geometryPathsPx, textRectPx, loadPresets, type GeomDef } from './guides';
import { cmdsBounds } from './custgeom';
import { reverseFontFamily } from '../text-utils';

export interface ToYappyResult {
    doc: SlideDocument;
    warnings: string[];
    stats: { slides: number; elements: number; pictures: number; paths: number };
}

const PAGE_GAP = 80; // matches the store's gap between paged frames
const LAYER = 'default-layer';

// ── Colours, fonts ──────────────────────────────────────────────────────────────────────────

const css = (c: Color | undefined | null): string => {
    if (!c) return 'transparent';
    if (c.alpha === undefined || c.alpha >= 0.999) return c.hex;
    const h = c.hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${+c.alpha.toFixed(3)})`;
};

const SERIF = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i;
const MONO = /(courier|consolas|mono|menlo|code)/i;
/** A PowerPoint typeface → a Yappy font key. Unknown faces take the closest built-in class. */
function fontKey(face: string | undefined): string {
    if (!face) return 'sans-serif';
    const known = reverseFontFamily(face);
    if (known) return known;
    if (MONO.test(face)) return 'monospace';
    if (SERIF.test(face)) return 'serif';
    return 'sans-serif';
}

// ── Paths ───────────────────────────────────────────────────────────────────────────────────

/** Path commands (absolute, world px) → Yappy subpaths of anchors with relative handles. */
function cmdsToSubpaths(cmds: PathCmd[]): PathSubpath[] {
    const subs: PathSubpath[] = [];
    let cur: PathAnchor[] = [];
    let closed = false;
    const flush = () => {
        if (cur.length >= 2) {
            // A closing segment that lands on the first anchor merges into it.
            const a = cur[0], z = cur[cur.length - 1];
            if (closed && Math.hypot(a.x - z.x, a.y - z.y) < 1e-6) {
                a.inX = z.inX; a.inY = z.inY;
                cur.pop();
            }
            subs.push({ anchors: cur, closed });
        }
        cur = []; closed = false;
    };
    for (const c of cmds) {
        if (c.op === 'M') { flush(); cur.push({ x: c.x, y: c.y, kind: 'corner' }); }
        else if (c.op === 'L') { if (!cur.length) cur.push({ x: c.x, y: c.y, kind: 'corner' }); else cur.push({ x: c.x, y: c.y, kind: 'corner' }); }
        else if (c.op === 'C') {
            const prev = cur[cur.length - 1];
            if (!prev) { cur.push({ x: c.x, y: c.y, kind: 'corner' }); continue; }
            prev.outX = c.x1 - prev.x; prev.outY = c.y1 - prev.y;
            cur.push({ x: c.x, y: c.y, inX: c.x2 - c.x, inY: c.y2 - c.y, kind: 'smooth' });
        } else if (c.op === 'Z') { closed = true; flush(); }
    }
    flush();
    return subs;
}

const shift = (cmds: PathCmd[], dx: number, dy: number): PathCmd[] => cmds.map(c => c.op === 'Z' ? c
    : c.op === 'C' ? { ...c, x1: c.x1 + dx, y1: c.y1 + dy, x2: c.x2 + dx, y2: c.y2 + dy, x: c.x + dx, y: c.y + dy }
    : { ...c, x: c.x + dx, y: c.y + dy });

// ── Conversion ──────────────────────────────────────────────────────────────────────────────

interface Conv {
    ox: number; oy: number;             // slide origin on the canvas
    presets: Record<string, GeomDef>;
    nextId: (prefix: string) => string;
    out: DrawingElement[];
    byPptId: Map<number, { el: DrawingElement; item: ShapeItem }>;
    glue: (() => void)[];
    warnings: string[];
    stats: ToYappyResult['stats'];
    images: Map<Media, { url: string; w: number; h: number } | null>;
    /** This slide's background picture, pre-laid-out at slide size (see slideBackground). */
    slideBg?: string;
    /** Grey-tone copies of pictures that are shown in grayscale somewhere (image url → copy). */
    gray: Map<string, string>;
    /** Deck slide key → the Yappy slide id it became, for slide links. */
    slideIds?: Map<string, string>;
}

/** A deck click action as a Yappy link (utils/slide-links.ts); null when it can't be kept. */
function linkOf(link: DeckLink | undefined, c: Conv): string | null {
    if (!link) return null;
    if (link.kind === 'url') return link.url;
    if (link.kind === 'action') return actionLink(link.action);
    const id = c.slideIds?.get(link.key);
    return id ? slideLink(id) : null;
}

/** A grey-tone copy of a picture (`a:grayscl`; Yappy pictures have no such adjustment). Browser only. */
async function grayscaleCopy(url: string): Promise<string | undefined> {
    if (typeof document === 'undefined') return undefined;
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.min(8192, img.naturalWidth)); c.height = Math.max(1, Math.min(8192, img.naturalHeight));
        const g = c.getContext('2d');
        if (!g) return undefined;
        g.filter = 'grayscale(1)';
        g.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL(/^data:image\/jpeg/.test(url) ? 'image/jpeg' : 'image/png', 0.92);
    } catch { return undefined; }
}

/** Every picture the deck shows in grayscale, converted once. */
async function grayCopies(deck: Deck, images: Conv['images']): Promise<Map<string, string>> {
    const urls = new Set<string>();
    const walk = (items: Item[]) => {
        for (const it of items) {
            if (it.kind === 'group') walk(it.children);
            else if (it.kind === 'picture' && it.grayscale) { const u = images.get(it.media)?.url; if (u) urls.add(u); }
            else if (it.kind === 'shape' && it.fill.kind === 'image' && it.fill.grayscale) { const u = images.get(it.fill.media)?.url; if (u) urls.add(u); }
        }
    };
    deck.slides.forEach(s => walk(s.items));
    const out = new Map<string, string>();
    await Promise.all([...urls].map(async u => { const g = await grayscaleCopy(u); if (g) out.set(u, g); }));
    return out;
}

/**
 * A background picture as one slide-sized picture, laid out as PowerPoint does it. Yappy covers
 * the slide with a background (scaled to fill, cropped), PowerPoint stretches it (`a:stretch`) or
 * repeats it (`a:tile`), so both are drawn here, at import: a tile stretched over a slide is a
 * smear, and a 4:3 picture on a 16:9 slide lost its edges. Browser only; elsewhere (tests) the
 * plain picture is kept.
 */
async function slideBackground(url: string, w: number, h: number, tile: { sx: number; sy: number } | undefined): Promise<string | undefined> {
    if (typeof document === 'undefined') return undefined;
    try {
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.min(4096, Math.round(w))); c.height = Math.max(1, Math.min(4096, Math.round(h)));
        const g = c.getContext('2d');
        if (!g) return undefined;
        if (tile) {
            const pat = g.createPattern(img, 'repeat');
            if (!pat) return undefined;
            pat.setTransform(new DOMMatrix().scale(tile.sx, tile.sy));
            g.fillStyle = pat;
            g.fillRect(0, 0, c.width, c.height);
        } else {
            // Same shape as the slide: Yappy's cover already matches a stretch, keep the original.
            if (Math.abs(img.naturalWidth / img.naturalHeight - w / h) < 0.01) return undefined;
            g.drawImage(img, 0, 0, c.width, c.height);
        }
        return c.toDataURL(tile ? 'image/png' : 'image/jpeg', 0.92);
    } catch { return undefined; }
}

function base(c: Conv, type: string, it: { name: string; x: number; y: number; w: number; h: number; rot?: number; flipH?: boolean; flipV?: boolean }, groups: string[]): any {
    return {
        id: c.nextId(type), type,
        x: it.x + c.ox, y: it.y + c.oy, width: Math.max(it.w, 1), height: Math.max(it.h, 1),
        angle: it.rot ? (it.rot * Math.PI) / 180 : 0,
        flipX: it.flipH || undefined, flipY: it.flipV || undefined,
        strokeColor: 'transparent', backgroundColor: 'transparent', fillStyle: 'solid',
        strokeWidth: 0, strokeStyle: 'solid', roughness: 0, renderStyle: 'architectural',
        opacity: 100, seed: 1, locked: false, layerId: LAYER,
        groupIds: [...groups].reverse(),   // innermost first, the store's convention
        name: it.name,
    };
}

function applyPaint(el: any, p: Paint, c: Conv) {
    switch (p.kind) {
        case 'none': el.backgroundColor = 'transparent'; break;
        case 'solid': el.backgroundColor = css(p.color); el.fillStyle = 'solid'; break;
        case 'linear': case 'radial':
            el.fillStyle = p.kind;
            el.backgroundColor = css(p.stops[0]?.color);
            el.gradientStops = p.stops.map(s => ({ offset: s.pos, color: css(s.color) }));
            if (p.kind === 'linear') el.gradientDirection = p.angle;
            break;
        case 'pattern': {
            el.backgroundColor = css(p.color);
            el.fillStyle = 'pattern';
            el.patternFill = patternFillOf(p.preset, css(p.color), p.bg ? css(p.bg) : 'transparent');
            break;
        }
        case 'image': {
            const img = c.images.get(p.media);
            if (img) { el.fillStyle = 'image'; el.backgroundImage = (p.grayscale && c.gray.get(img.url)) || img.url; el.backgroundColor = '#ffffff'; }
            if (img && p.alpha !== undefined && p.alpha < 1) el.backgroundOpacity = p.alpha;
            break;
        }
    }
}

function applyLine(el: any, l: Line | null) {
    if (!l || !(l.width > 0)) { el.strokeColor = 'transparent'; el.strokeWidth = 0; return; }
    el.strokeColor = css(l.color);
    el.strokeWidth = Math.max(0.5, l.width);
    el.strokeStyle = l.dash === 'sysDot' ? 'dotted' : l.dash ? 'dashed' : 'solid';
    if (l.join === 'miter' || l.join === 'bevel') el.strokeLineJoin = l.join;
    if (l.cap === 'flat') el.strokeLineCap = 'butt';
    else if (l.cap === 'sq') el.strokeLineCap = 'square';
}

/** "alphaLcParenR" → lower-alpha + ")"; schemes Yappy can't draw (circled, East Asian) → 1. */
function numberLook(scheme: string | undefined): Pick<RichTextSpan, 'listNumberStyle' | 'listNumberSuffix'> {
    const m = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(scheme ?? '');
    if (!m) return {};
    const style = ({ alphaLc: 'lower-alpha', alphaUc: 'upper-alpha', romanLc: 'lower-roman', romanUc: 'upper-roman', arabic: undefined } as const)[m[1] as 'arabic'];
    const suffix = ({ ParenBoth: 'parens', ParenR: 'paren', Plain: 'none', Period: undefined } as const)[m[2] as 'Period'];
    const out: Pick<RichTextSpan, 'listNumberStyle' | 'listNumberSuffix'> = {};
    if (style) out.listNumberStyle = style;
    if (suffix) out.listNumberSuffix = suffix;
    return out;
}

/** A paragraph's bullet glyph, colour, size and hanging indent as span marker overrides. */
function listLook(p: Paragraph, t: TextBody): Partial<RichTextSpan> {
    const out: Partial<RichTextSpan> = p.bullet === 'num' ? numberLook(p.numType) : p.bulletChar ? { listMarker: p.bulletChar } : {};
    const textColor = p.runs.find(r => !r.br)?.color ?? t.defaults?.color;
    if (p.bulletColor && css(p.bulletColor) !== css(textColor)) out.listMarkerColor = css(p.bulletColor);
    if (p.bulletScale) out.listMarkerScale = Math.round(p.bulletScale * 100) / 100;
    if (p.marL !== undefined) {
        out.listIndent = Math.max(0, Math.round(p.marL * 10) / 10);
        out.listMarkerIndent = Math.max(0, Math.round((p.marL + (p.indent ?? 0)) * 10) / 10);
    }
    return out;
}

/** Space between paragraph i-1 and i: the one's space after plus the other's space before. */
const gapBefore = (t: TextBody, i: number) =>
    Math.round(((t.paragraphs[i - 1]?.spaceAfter ?? 0) + (t.paragraphs[i]?.spaceBefore ?? 0)) * 100) / 100;

/** A text body as Yappy text fields: plain when the formatting is uniform, rich otherwise. */
function textFields(t: TextBody, container: boolean) {
    const runs = t.paragraphs.flatMap(p => p.runs.filter(r => !r.br));
    const first = runs[0];
    const size = first?.size ?? 24;
    // PowerPoint aligns each paragraph. The element takes the alignment most of the text has, and
    // a paragraph that differs carries its own (paragraphAlign), which makes the text rich.
    const weight = new Map<string, number>();
    const textLen = (p: Paragraph) => p.runs.reduce((a, r) => a + (r.br ? 0 : r.text.trim().length), 0);
    for (const p of t.paragraphs) {
        const n = textLen(p);
        if (n) weight.set(p.align ?? 'l', (weight.get(p.align ?? 'l') ?? 0) + n);
    }
    const align = [...weight].sort((a, b) => b[1] - a[1])[0]?.[0] ?? t.paragraphs.find(p => p.runs.length)?.align ?? 'l';
    const ownAlign = (p: Paragraph): TextAlign | undefined => textLen(p) > 0 && (p.align ?? 'l') !== align
        ? (p.align === 'ctr' ? 'center' : p.align === 'r' ? 'right' : 'left') : undefined;
    const uniform = runs.every(r => r.size === first?.size && r.bold === first?.bold && r.italic === first?.italic
        && r.underline === first?.underline && r.strike === first?.strike && r.font === first?.font
        && css(r.color) === css(first?.color)) && !t.paragraphs.some(p => p.bullet)
        && !t.paragraphs.some((_, i) => i > 0 && gapBefore(t, i) > 0)
        && !t.paragraphs.some(ownAlign);
    const fields: any = {
        fontSize: Math.round(size * 10) / 10,
        fontFamily: fontKey(first?.font),
        textAlign: align === 'ctr' ? 'center' : align === 'r' ? 'right' : 'left',
        verticalAlign: t.anchor === 'ctr' ? 'middle' : t.anchor === 'b' ? 'bottom' : 'top',
        textColor: css(first?.color ?? { hex: '#000000' }),
    };
    if (t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01) fields.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2));
    const plain = t.paragraphs.map(p => p.runs.map(r => r.br ? '\n' : r.text).join('')).join('\n');
    if (uniform) {
        if (first?.bold) fields.fontWeight = 700;
        if (first?.italic) fields.fontStyle = 'italic';
        if (container) fields.containerText = plain; else fields.text = plain;
        return { fields, rich: false };
    }
    const spans: RichTextSpan[] = [];
    // PowerPoint numbers a run of same-level, same-scheme paragraphs; a different scheme, or a
    // shallower paragraph in between, starts the count again (at startAt).
    const counters: number[] = [];
    const schemes: string[] = [];
    t.paragraphs.forEach((p, pi) => {
        const lvl = p.level ?? 0;
        if (p.bullet === 'num') {
            const scheme = p.numType ?? 'arabicPeriod';
            if (counters[lvl] === undefined || schemes[lvl] !== scheme) counters[lvl] = (p.startAt ?? 1) - 1;
            counters[lvl]++; schemes[lvl] = scheme; counters.length = lvl + 1; schemes.length = lvl + 1;
        } else { counters.length = Math.min(counters.length, lvl); schemes.length = counters.length; }
        const list: Partial<RichTextSpan> = p.bullet ? { listType: p.bullet === 'num' ? 'ordered' : 'bullet', listLevel: lvl, ...listLook(p, t) } : {};
        if (p.bullet === 'num') list.listIndex = counters[lvl];
        const runs = p.runs.length ? p.runs : [{ text: '' }];
        runs.forEach((r, ri) => {
            const span: RichTextSpan = { text: r.br ? '\n' : r.text, ...(ri === 0 ? list : {}) };
            if (ri === 0 && pi > 0 && gapBefore(t, pi) > 0) span.paragraphSpaceBefore = gapBefore(t, pi);
            // On every run, so a line break (a:br) inside the paragraph keeps the alignment too.
            const pa = ownAlign(p);
            if (pa) span.paragraphAlign = pa;
            if (r.bold) span.bold = true;
            if (r.italic) span.italic = true;
            if (r.underline) span.underline = true;
            if (r.strike) span.strikethrough = true;
            if (r.color) span.color = css(r.color);
            if (r.size) span.fontSize = Math.round(r.size * 10) / 10;
            if (r.font) span.fontFamily = fontKey(r.font);
            spans.push(span);
        });
        if (pi < t.paragraphs.length - 1) spans.push({ text: '\n' });
    });
    if (container) { fields.richContainerText = spans; fields.containerText = plain; }
    else { fields.richText = spans; fields.text = plain; }
    return { fields, rich: true };
}

/** A text box at PowerPoint's text rectangle, compensating for Yappy's own 4px text padding. */
function textElement(c: Conv, t: TextBody, box: { name: string; x: number; y: number; w: number; h: number; rot?: number; flipH?: boolean; flipV?: boolean }, groups: string[], fill?: Paint): DrawingElement {
    const { fields, rich } = textFields(t, false);
    const PAD = 4;
    const el = base(c, rich ? 'richtext' : 'text', {
        ...box,
        x: box.x + t.insets.l - PAD, y: box.y + t.insets.t - PAD,
        w: Math.max(box.w - t.insets.l - t.insets.r + PAD * 2, 8), h: Math.max(box.h - t.insets.t - t.insets.b + PAD * 2, 8),
    }, groups);
    Object.assign(el, fields, { autoResize: !t.wrap, strokeColor: fields.textColor });
    if (fill && fill.kind === 'solid') el.backgroundColor = css(fill.color);
    return el;
}

const STRAIGHT = new Set(['line', 'straightConnector1']);

function shapeElements(it: ShapeItem, c: Conv, groups: string[]): DrawingElement[] {
    const g = it.geom;
    // A pure text box (no fill, no line) is a text element.
    if (it.text && it.fill.kind === 'none' && !it.line && (it.textBox || g.kind === 'preset' && g.prst === 'rect')) {
        c.stats.elements++;
        return [textElement(c, it.text, it, groups)];
    }
    // A preset line drawn as a shape is a line.
    if (g.kind === 'preset' && STRAIGHT.has(g.prst)) return connectorElements({ ...it, kind: 'connector', line: it.line ?? { width: 1, color: { hex: '#000000' } } } as ConnectorItem, c, groups);
    // An open path with arrowheads (a curve or elbow written as a shape — how Yappy exports them)
    // is an arrow: a Yappy path has no arrowheads to put them on.
    if (g.kind === 'custom' && it.line && (it.line.head || it.line.tail) && !it.text
        && g.paths.every(p => !p.cmds.some(k => k.op === 'Z'))) {
        return connectorElements({ ...it, kind: 'connector', line: it.line } as ConnectorItem, c, groups);
    }

    const native = nativeType(it);
    if (native) {
        const el = base(c, native.type, it, groups);
        Object.assign(el, native.extra);
        applyPaint(el, it.fill, c);
        applyLine(el, it.line);
        c.byPptId.set(it.id, { el, item: it });
        c.stats.elements++;
        const tr = it.textRect ?? { l: 0, t: 0, r: it.w, b: it.h };
        const ins = it.text?.insets;
        const ownBox = Math.abs(tr.l) > 0.5 || Math.abs(tr.t) > 0.5 || Math.abs(tr.r - it.w) > 0.5 || Math.abs(tr.b - it.h) > 0.5;
        // A label is drawn by Yappy's own rules (centred, its own padding), which ignore insets.
        // Past PowerPoint's defaults (0.1"/0.05") the insets place the text, so keep them exact.
        const wideInsets = !!ins && Math.max(ins.l, ins.r, ins.t, ins.b) > 16;
        if (it.text && (ownBox || wideInsets)) {
            // Text in a box of its own (SmartArt labels beside or below their shape, or inset deep
            // inside it): a separate text element, grouped with the shape so they move together.
            const gid = c.nextId('group');
            el.groupIds = [...groups, gid].reverse(); // innermost first, as base() writes them
            c.stats.elements++;
            return [el, textElement(c, it.text, { ...it, rot: 0, x: it.x + tr.l, y: it.y + tr.t, w: tr.r - tr.l, h: tr.b - tr.t }, [...groups, gid])];
        }
        if (it.text) {
            const { fields } = textFields(it.text, true);
            Object.assign(el, fields);
        }
        return [el];
    }

    // Exact outline from the geometry definition.
    const paths: CustomPath[] = g.kind === 'custom' ? g.paths
        : (() => {
            const def = c.presets[g.prst];
            if (!def) { c.warnings.push(`Unknown shape "${g.prst}" was imported as a rectangle.`); return geometryPathsPx(c.presets.rect, it.w, it.h); }
            const adj = Object.fromEntries(Object.entries(g.adj ?? {}).map(([k, v]) => [k, `val ${v}`]));
            return geometryPathsPx(def, it.w, it.h, adj);
        })();
    const out: DrawingElement[] = [];
    const groupId = (it.text || paths.some(p => p.fill === false)) && paths.some(p => p.fill !== false) ? c.nextId('group') : null;
    const inner = groupId ? [...groups, groupId] : groups;
    // Paths that differ in fill/stroke can't share one element; filled ones first (they come first in the file too).
    const buckets = new Map<string, CustomPath[]>();
    for (const p of paths) {
        const key = `${p.fill === false ? 'nofill' : 'fill'}|${p.stroke === false ? 'nostroke' : 'stroke'}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(p);
    }
    let first: DrawingElement | null = null;
    for (const [key, ps] of buckets) {
        const all = ps.flatMap(p => p.cmds);
        const b = cmdsBounds(all);
        if (!b) continue;
        const subs = cmdsToSubpaths(shift(all, -b.minX, -b.minY));
        if (!subs.length) continue;
        const el = base(c, 'path', { ...it, x: it.x + b.minX, y: it.y + b.minY, w: Math.max(b.maxX - b.minX, 1), h: Math.max(b.maxY - b.minY, 1) }, inner);
        // Rotation and flips turn about the SHAPE's centre in PowerPoint; a path's box can be a
        // different size (callout tails, arrows), so it isn't rotated about its own centre.
        // Keep the transform only when the boxes share a centre; otherwise bake it into the anchors.
        const sameCentre = Math.abs(b.minX + b.maxX - it.w) < 0.5 && Math.abs(b.minY + b.maxY - it.h) < 0.5;
        if (!sameCentre && (it.rot || it.flipH || it.flipV)) {
            bakeTransform(el, subs, it, b);
        }
        el.pathSubpaths = subs;
        el.pathAnchors = subs[0].anchors;
        el.pathClosed = subs[0].closed;
        if (key.startsWith('fill')) applyPaint(el, it.fill, c); else el.backgroundColor = 'transparent';
        if (key.endsWith('|stroke')) applyLine(el, it.line); else { el.strokeColor = 'transparent'; el.strokeWidth = 0; }
        out.push(el);
        first ??= el;
        c.stats.paths++;
    }
    if (first) c.byPptId.set(it.id, { el: first, item: it });
    if (it.text) {
        // Text sits in the geometry's text rectangle (an ellipse's inscribed box, a callout's body).
        const tr = it.textRect ?? (g.kind === 'preset' && c.presets[g.prst] ? textRectPx(c.presets[g.prst], it.w, it.h) : { l: 0, t: 0, r: it.w, b: it.h });
        out.push(textElement(c, it.text, { ...it, x: it.x + tr.l, y: it.y + tr.t, w: tr.r - tr.l, h: tr.b - tr.t }, inner));
    }
    c.stats.elements += out.length;
    return out;
}

/** Bake a rotation/flip about the shape's centre into a path's anchors, leaving the element unrotated. */
function bakeTransform(el: any, subs: PathSubpath[], it: ShapeItem, b: { minX: number; minY: number }) {
    const cx = it.w / 2, cy = it.h / 2;
    const rad = ((it.rot || 0) * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    const fx = it.flipH ? -1 : 1, fy = it.flipV ? -1 : 1;
    // Anchor → shape-box frame → flip+rotate about the centre → back.
    const pt = (x: number, y: number) => {
        const dx = (x + b.minX - cx) * fx, dy = (y + b.minY - cy) * fy;
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
    };
    const vec = (x: number, y: number) => { const dx = x * fx, dy = y * fy; return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }; };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of subs) for (const a of s.anchors) {
        const p = pt(a.x, a.y);
        a.x = p.x; a.y = p.y;
        if (a.inX !== undefined) { const v = vec(a.inX, a.inY ?? 0); a.inX = v.x; a.inY = v.y; }
        if (a.outX !== undefined) { const v = vec(a.outX, a.outY ?? 0); a.outX = v.x; a.outY = v.y; }
        minX = Math.min(minX, a.x); minY = Math.min(minY, a.y); maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y);
    }
    for (const s of subs) for (const a of s.anchors) { a.x -= minX; a.y -= minY; }
    el.x = el.x - b.minX + minX; el.y = el.y - b.minY + minY;
    el.width = Math.max(maxX - minX, 1); el.height = Math.max(maxY - minY, 1);
    el.angle = 0; el.flipX = undefined; el.flipY = undefined;
}

function nativeType(it: ShapeItem): { type: string; extra: Record<string, unknown> } | null {
    const g = it.geom;
    if (g.kind !== 'preset') return null;
    const adj = g.adj ?? {};
    switch (g.prst) {
        case 'rect': return { type: 'rectangle', extra: { borderRadius: 0 } };
        case 'roundRect': return { type: 'rectangle', extra: { borderRadius: Math.max(0, Math.min(50, (adj.adj ?? 16667) / 1000)) } };
        case 'ellipse': return { type: 'circle', extra: {} };
        case 'diamond': return { type: 'diamond', extra: { borderRadius: 0 } };
        case 'triangle': return (adj.adj ?? 50000) === 50000 ? { type: 'triangle', extra: {} } : null;
        default: return null;
    }
}

const ARROW: Record<string, DrawingElement['startArrowhead']> = { triangle: 'triangle', stealth: 'arrow', arrow: 'arrow', oval: 'dot', diamond: 'diamondFilled' };

function connectorElements(it: ConnectorItem, c: Conv, groups: string[]): DrawingElement[] {
    const g = it.geom;
    // The connector's path in its box frame: a preset (straight/bent/curved) or custom geometry.
    let cmds: PathCmd[];
    if (g.kind === 'preset' && STRAIGHT.has(g.prst)) cmds = [{ op: 'M', x: 0, y: 0 }, { op: 'L', x: it.w, y: it.h }];
    else if (g.kind === 'custom') cmds = g.paths.flatMap(p => p.cmds);
    else {
        const def = c.presets[g.prst];
        const adj = Object.fromEntries(Object.entries(g.adj ?? {}).map(([k, v]) => [k, `val ${v}`]));
        cmds = def ? geometryPathsPx(def, it.w, it.h, adj).flatMap(p => p.cmds) : [{ op: 'M', x: 0, y: 0 }, { op: 'L', x: it.w, y: it.h }];
    }
    // Box frame → slide frame: flips and rotation about the box centre.
    const cx = it.w / 2, cy = it.h / 2;
    const rad = ((it.rot || 0) * Math.PI) / 180;
    const T = (x: number, y: number) => {
        let dx = x - cx, dy = y - cy;
        if (it.flipH) dx = -dx;
        if (it.flipV) dy = -dy;
        return { x: it.x + cx + dx * Math.cos(rad) - dy * Math.sin(rad), y: it.y + cy + dx * Math.sin(rad) + dy * Math.cos(rad) };
    };
    // Curves are sampled into a polyline; Yappy's bezier connector has one or two handles, not a chain.
    const pts: { x: number; y: number }[] = [];
    let cur = { x: 0, y: 0 };
    for (const k of cmds) {
        if (k.op === 'M' || k.op === 'L') { cur = { x: k.x, y: k.y }; pts.push(T(cur.x, cur.y)); }
        else if (k.op === 'C') {
            for (let s = 1; s <= 12; s++) {
                const t = s / 12, u = 1 - t;
                const x = u * u * u * cur.x + 3 * u * u * t * k.x1 + 3 * u * t * t * k.x2 + t * t * t * k.x;
                const y = u * u * u * cur.y + 3 * u * u * t * k.y1 + 3 * u * t * t * k.y2 + t * t * t * k.y;
                pts.push(T(x, y));
            }
            cur = { x: k.x, y: k.y };
        }
    }
    if (pts.length < 2) return [];
    const minX = Math.min(...pts.map(p => p.x)), minY = Math.min(...pts.map(p => p.y));
    const maxX = Math.max(...pts.map(p => p.x)), maxY = Math.max(...pts.map(p => p.y));
    const head = it.line.head && ARROW[it.line.head.type], tail = it.line.tail && ARROW[it.line.tail.type];
    const el = base(c, head || tail ? 'arrow' : 'line', { ...it, x: minX, y: minY, w: Math.max(maxX - minX, 1), h: Math.max(maxY - minY, 1), rot: 0, flipH: false, flipV: false }, groups);
    el.points = pts.map(p => ({ x: p.x - minX, y: p.y - minY }));
    el.curveType = 'straight';
    el.startArrowhead = head ?? null;
    el.endArrowhead = tail ?? null;
    applyLine(el, it.line);
    const bind = (end: { id: number; idx: number } | undefined, p: { x: number; y: number }) => {
        if (!end) return null;
        const target = c.byPptId.get(end.id);
        if (!target || !target.el.width || !target.el.height) return null;
        const t = target.el;
        return { elementId: t.id, focus: 0, gap: 0, anchorFractionX: (p.x + c.ox - t.x) / t.width, anchorFractionY: (p.y + c.oy - t.y) / t.height };
    };
    // Targets can come later in z-order: bind once the whole slide is converted.
    c.glue.push(() => {
        el.startBinding = bind(it.start, pts[0]);
        el.endBinding = bind(it.end, pts[pts.length - 1]);
    });
    c.stats.elements++;
    return [el];
}

function pictureElement(it: PictureItem, c: Conv, groups: string[]): DrawingElement[] {
    const img = c.images.get(it.media);
    if (!img) {
        c.warnings.push(`Picture "${it.name}" is a ${it.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
        const el = base(c, 'rectangle', it, groups);
        Object.assign(el, { backgroundColor: '#f1f3f5', strokeColor: '#adb5bd', strokeWidth: 1, strokeStyle: 'dashed', containerText: `${it.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: '#495057' });
        c.stats.elements++;
        return [el];
    }
    const el = base(c, 'image', it, groups);
    el.dataURL = (it.grayscale && c.gray.get(img.url)) || img.url;
    el.status = 'loaded';
    el.mimeType = MIME[it.media.ext];
    if (it.crop && (it.crop.l || it.crop.t || it.crop.r || it.crop.b)) {
        // Yappy's crop is the source rectangle in image pixels.
        el.crop = { x: it.crop.l * img.w, y: it.crop.t * img.h, width: Math.max(1, (1 - it.crop.l - it.crop.r) * img.w), height: Math.max(1, (1 - it.crop.t - it.crop.b) * img.h) };
    }
    if (it.alpha !== undefined && it.alpha < 1) el.opacity = Math.round(it.alpha * 100);
    if (it.descr) el.altText = it.descr;
    c.stats.elements++; c.stats.pictures++;
    if (!it.geom) return [el];
    // Cropped to a shape: the outline becomes a clipping mask over the picture, grouped with it —
    // what Object ▸ Make Clipping Mask builds, so it stays editable the same way.
    const gid = c.nextId('group');
    const outline = shapeElements({ kind: 'shape', id: it.id, name: `${it.name} outline`, x: it.x, y: it.y, w: it.w, h: it.h, rot: it.rot, flipH: it.flipH, flipV: it.flipV,
        geom: it.geom, fill: { kind: 'solid', color: { hex: '#000000' } }, line: null }, c, [...groups, gid]);
    if (outline.length !== 1) { c.stats.elements -= outline.length; return [el]; }
    const mask = outline[0];
    mask.isClipMask = true;
    el.groupIds = [gid, ...el.groupIds];
    el.clipMaskId = mask.id;
    el.maskType = 'clip';
    return [el, mask];
}

function convertItems(items: Item[], c: Conv, groups: string[]): DrawingElement[] {
    const out: DrawingElement[] = [];
    for (const it of items) {
        try {
            const made: DrawingElement[] = [];
            switch (it.kind) {
                case 'shape': made.push(...shapeElements(it, c, groups)); break;
                case 'connector': made.push(...connectorElements(it, c, groups)); break;
                case 'picture': made.push(...pictureElement(it, c, groups)); break;
                case 'group': made.push(...convertItems(it.children, c, [...groups, c.nextId('group')])); break;
            }
            // A linked group is a button made of parts: every part follows the link, unless a
            // part has its own.
            const link = linkOf(it.link, c);
            if (link) for (const el of made) if (!el.link) el.link = link;
            out.push(...made);
        } catch (e) {
            c.warnings.push(`"${it.name}" couldn't be converted and was skipped.`);
        }
    }
    return out;
}

function transitionOf(t: Transition | undefined): SlideTransition | undefined {
    if (!t) return undefined;
    const type = t.kind === 'morph' ? 'morph' : t.kind === 'fade' ? 'fade'
        : t.kind === 'zoom' ? (t.zoomIn === false ? 'zoom-out' : 'zoom-in')
        : t.dir === 'r' ? 'slide-right' : t.dir === 'u' ? 'slide-up' : t.dir === 'd' ? 'slide-down' : 'slide-left';
    return { type, duration: Math.max(100, Math.min(5000, t.durationMs)), easing: 'easeInOutQuad' };
}

function applyBackground(s: YappySlide, bg: Slide['background'], c: Conv) {
    if (!bg) return;
    if (bg.kind === 'solid') { s.fillStyle = 'solid'; s.backgroundColor = css(bg.color); }
    else if (bg.kind === 'linear' || bg.kind === 'radial') {
        s.fillStyle = bg.kind;
        s.backgroundColor = css(bg.stops[0]?.color);
        s.gradientStops = bg.stops.map(st => ({ offset: st.pos, color: css(st.color) }));
        if (bg.kind === 'linear') s.gradientDirection = bg.angle;
    } else if (bg.kind === 'image') {
        const img = c.images.get(bg.media);
        const url = c.slideBg ?? img?.url;
        if (url) { s.fillStyle = 'image'; s.backgroundImage = url; s.backgroundColor = '#ffffff'; }
        if (url && bg.alpha !== undefined && bg.alpha < 1) s.backgroundOpacity = bg.alpha;
    } else if (bg.kind === 'pattern') { s.fillStyle = 'solid'; s.backgroundColor = css(bg.color); }
}

const MIME: Record<Media['ext'], string> = {
    png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', bmp: 'image/bmp',
    tiff: 'image/tiff', webp: 'image/webp', emf: 'image/x-emf', wmf: 'image/x-wmf',
};
const SHOWABLE = new Set<Media['ext']>(['png', 'jpeg', 'gif', 'svg', 'bmp', 'webp']);

function toBase64(bytes: Uint8Array): string {
    let s = '';
    const CH = 0x8000;
    for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode(...bytes.subarray(i, i + CH));
    return btoa(s);
}

/** Decode every distinct image once: its data URL and natural size (needed for crops). */
async function decodeImages(deck: Deck): Promise<Map<Media, { url: string; w: number; h: number } | null>> {
    const all = new Set<Media>();
    const walk = (items: Item[]) => {
        for (const it of items) {
            if (it.kind === 'picture') all.add(it.media);
            else if (it.kind === 'group') walk(it.children);
            else if (it.kind === 'shape' && it.fill.kind === 'image') all.add(it.fill.media);
        }
    };
    for (const s of deck.slides) { walk(s.items); if (s.background?.kind === 'image') all.add(s.background.media); }
    const out = new Map<Media, { url: string; w: number; h: number } | null>();
    await Promise.all([...all].map(async (m) => {
        if (!SHOWABLE.has(m.ext)) { out.set(m, null); return; }
        const url = `data:${MIME[m.ext]};base64,${toBase64(m.bytes)}`;
        let w = 0, h = 0;
        try {
            const bmp = await createImageBitmap(new Blob([m.bytes as BlobPart], { type: MIME[m.ext] }));
            w = bmp.width; h = bmp.height; bmp.close();
        } catch { /* SVG has no bitmap size here; crops on it are rare */ }
        out.set(m, { url, w, h });
    }));
    return out;
}

/**
 * A DrawingML preset pattern as Yappy's vector pattern fill: foreground on background, like
 * PowerPoint's 8-px tiles. The motif follows the name — Horz/Vert/Diag stripes, Grid, Check,
 * diagCross — with `lt`/`dk` for thin/thick lines and `nar`/`sm`/`wd`/`lg` for spacing; `pctN`
 * becomes dots that cover about N % of the area (above 50 %, background dots on the foreground).
 * Used to be Yappy's sketch hatching in the foreground colour with no ground, which drew 30 %
 * grey as faint teal lines.
 */
export function patternFillOf(prst: string, fg: string, bg: string): PatternFill {
    const spacing = /^(nar|sm)/.test(prst) ? 4 : /^(wd|lg)/.test(prst) ? 12 : 8;
    const strokeWidth = /^dk/.test(prst) ? 3 : /^lt/.test(prst) ? 1 : /^(wd)/.test(prst) ? 3 : 1.5;
    const base = { color: fg, background: bg, spacing, strokeWidth };
    const pct = /^pct(\d+)$/.exec(prst);
    if (pct) {
        const n = Math.max(1, Math.min(99, Number(pct[1])));
        const inverse = n > 50; // mostly foreground: draw the gaps as dots instead
        const share = (inverse ? 100 - n : n) / 100;
        return { type: 'dots', color: inverse ? bg : fg, background: inverse ? fg : bg, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(share / Math.PI)) };
    }
    if (/Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(prst)) return { type: 'stripes', ...base, angle: 0 };
    if (/Vert$|^vert$/.test(prst)) return { type: 'stripes', ...base, angle: 90 };
    if (/DnDiag$|^dnDiag$/.test(prst)) return { type: 'stripes', ...base, angle: 45 };
    if (/UpDiag$|^upDiag$/.test(prst)) return { type: 'stripes', ...base, angle: -45 };
    if (/^(diagCross|trellis|openDmnd|weave)$/.test(prst)) return { type: 'crosshatch', ...base };
    if (/Check$|^solidDmnd$/.test(prst)) return { type: 'checker', ...base, angle: prst === 'solidDmnd' ? 45 : 0 };
    if (/^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(prst)) return { type: 'grid', ...base };
    return { type: 'dots', ...base, strokeWidth: 1 }; // confetti, sphere, divot, dotDmnd…
}

/** Build the Yappy document. `nextId` mints element ids (the store's generator, with a batch set). */
export async function deckToDocument(deck: Deck, nextId: (type: string) => string, name?: string): Promise<ToYappyResult> {
    const presets = await loadPresets();
    const images = await decodeImages(deck);
    const W = Math.round(deck.width), H = Math.round(deck.height);
    const doc = createSlideDocument(name ?? deck.title, 'slides', { width: W, height: H });
    const warnings: string[] = [];
    const stats = { slides: 0, elements: 0, pictures: 0, paths: 0 };
    doc.slides = [];
    const gray = await grayCopies(deck, images);
    const laidOut = await Promise.all(deck.slides.map(s => {
        const bg = s.background;
        const img = bg?.kind === 'image' ? images.get(bg.media) : undefined;
        return bg?.kind === 'image' && img ? slideBackground(img.url, W, H, bg.tile) : undefined;
    }));
    // Slide ids first, so a link on slide 1 can point at slide 5.
    const ids = deck.slides.map(() => nextId('slide'));
    const slideIds = new Map<string, string>();
    deck.slides.forEach((s, i) => { if (s.key) slideIds.set(s.key, ids[i]); });
    deck.slides.forEach((s, i) => {
        const x = i * (W + PAGE_GAP);
        const slide = createDefaultSlide(ids[i], s.name || `Slide ${i + 1}`, x, 0, { width: W, height: H });
        slide.order = i;
        const c: Conv = { ox: x, oy: 0, presets, nextId, out: [], byPptId: new Map(), glue: [], warnings, stats, images, slideBg: laidOut[i], gray, slideIds };
        doc.elements.push(...convertItems(s.items, c, []));
        c.glue.forEach(f => f());
        applyBackground(slide, s.background, c);
        const tr = transitionOf(s.transition);
        if (tr) slide.transition = tr;
        if (s.notes) slide.notes = s.notes;
        if (s.hidden) slide.hidden = true;
        if (s.advanceAfterMs) slide.advanceAfter = s.advanceAfterMs;
        if (s.section) slide.section = s.section;
        doc.slides.push(slide);
        stats.slides++;
    });
    if (!doc.slides.length) doc.slides.push(createDefaultSlide(undefined, 'Slide 1', 0, 0, { width: W, height: H }));
    if (deck.loop) doc.globalSettings = { ...(doc.globalSettings || {}), slideShowLoop: true };
    return { doc, warnings: [...new Set(warnings)], stats };
}

