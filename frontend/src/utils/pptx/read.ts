/**
 * .pptx bytes → the neutral Deck model (see deck.ts). Pure apart from the XML parser, which is
 * injected (the browser's DOMParser by default; tests pass @xmldom/xmldom), so this unit-tests
 * under bun.
 *
 * What it resolves, so the Deck is self-contained and needs no PowerPoint semantics downstream:
 * - the package chain: presentation → slide → layout → master → theme (relationships, not paths);
 * - theme colours through the colour map, with every DrawingML colour modifier;
 * - placeholder inheritance: position, geometry, fill/line and text styles from the layout and
 *   master placeholder the slide's placeholder matches, then the master's title/body/other styles;
 * - `p:style` references into the theme's fill/line/font matrices;
 * - group transforms (child space → slide space);
 * - custom geometry, evaluated to paths at the shape's size;
 * - the master's and layout's own artwork (logos, bars), drawn under the slide's.
 *
 * The algorithms follow DeckCraft's reader (crates/pptx/src/read.rs, read/*.rs, model/src/resolve.rs
 * and color/src/lib.rs; MIT/Apache): placeholder matching, the level-style chain and the colour
 * modifier formulas. Limits follow it too (zip entries and sizes, group depth, shapes per slide):
 * a hostile or broken file yields what could be read plus warnings, never an exception past
 * `readPptx`'s own "not a presentation" error.
 */
import { unzipSync, strFromU8 } from 'fflate';
import type { Deck, Slide, Item, Paint, Color, Line, TextBody, Paragraph, TextRun, Geometry, Media, Transition, ArrowEnd, ShapeItem, GroupItem, DeckLink } from './deck';
import { EMU_PER_PX, EMU_PER_PT } from './ooxml';
import { geometryPathsPx, textRectPx, type GeomDef } from './guides';

// ── Limits ──────────────────────────────────────────────────────────────────────────────────
const MAX_ENTRIES = 50_000;
const MAX_PART_BYTES = 256 * 1024 * 1024;
const MAX_TOTAL_BYTES = 1024 * 1024 * 1024;
const MAX_SLIDES = 10_000;
const MAX_GROUP_DEPTH = 32;
const MAX_SHAPES_PER_SLIDE = 20_000;

export interface ReadOptions {
    parseXml?: (xml: string) => Document;
}
export interface ReadResult { deck: Deck; warnings: string[] }

// ── XML helpers (namespace-agnostic: everything is matched on localName) ───────────────────
type El = Element;
const kids = (el: El | null | undefined, name?: string): El[] => {
    if (!el) return [];
    const out: El[] = [];
    for (let n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 1 && (!name || (n as El).localName === name)) out.push(n as El);
    }
    return out;
};
const kid = (el: El | null | undefined, name: string): El | null => {
    if (!el) return null;
    for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && (n as El).localName === name) return n as El;
    return null;
};
const path = (el: El | null | undefined, ...names: string[]): El | null => {
    let cur: El | null | undefined = el;
    for (const n of names) cur = kid(cur, n);
    return cur ?? null;
};
const attr = (el: El | null | undefined, name: string): string | null => {
    if (!el) return null;
    const v = el.getAttribute(name);
    if (v !== null && v !== '') return v;
    // Prefixed attributes (r:embed, p14:dur) under whatever prefix the file used.
    const local = name.includes(':') ? name.split(':')[1] : name;
    for (let i = 0; i < (el.attributes?.length ?? 0); i++) {
        const a = el.attributes[i];
        if (a.localName === local && (name.includes(':') || !a.name.includes(':'))) return a.value;
    }
    return null;
};
const num = (el: El | null | undefined, name: string, dflt = 0): number => {
    const v = attr(el, name);
    const n = v === null ? NaN : Number(v);
    return Number.isFinite(n) ? n : dflt;
};
const bool = (el: El | null | undefined, name: string): boolean | undefined => {
    const v = attr(el, name);
    return v === null ? undefined : v === '1' || v === 'true' || v === 'on';
};
const px = (emu: number) => emu / EMU_PER_PX;

/** Namespaces whose markup inside an `mc:Choice` this reader handles (p14 transition durations, a14/a16 extras). */
const UNDERSTOOD = new Set(['p14', 'a14', 'a16']);

/**
 * `mc:AlternateContent` → the branch we understand: the Choice when every namespace it requires is
 * one we read (that is where PowerPoint puts a transition's exact `p14:dur`), else the Fallback,
 * which exists for exactly such readers.
 */
function resolveMc(el: El): El[] {
    if (el.localName !== 'AlternateContent') return [el];
    const fb = kid(el, 'Fallback');
    for (const ch of kids(el, 'Choice')) {
        const req = (attr(ch, 'Requires') || '').split(/\s+/).filter(Boolean);
        if (req.every(r => UNDERSTOOD.has(r))) return kids(ch);
    }
    return kids(fb);
}
const elementKids = (el: El | null | undefined): El[] => kids(el).flatMap(resolveMc);

// ── Package ─────────────────────────────────────────────────────────────────────────────────

class Pkg {
    private files: Record<string, Uint8Array>;
    private text = new Map<string, Document | null>();
    private relCache = new Map<string, Map<string, { type: string; target: string; external: boolean }>>();
    private parseXml: (s: string) => Document;
    private warn: (s: string) => void;
    constructor(files: Record<string, Uint8Array>, parseXml: (s: string) => Document, warn: (s: string) => void) {
        this.parseXml = parseXml;
        this.warn = warn;
        this.files = {};
        for (const [k, v] of Object.entries(files)) this.files[norm(k)] = v;
    }
    bytes(name: string): Uint8Array | undefined { return this.files[norm(name)]; }
    xml(name: string): El | null {
        const key = norm(name);
        if (!this.text.has(key)) {
            const b = this.files[key];
            let doc: Document | null = null;
            if (b) {
                try {
                    const s = strFromU8(b).replace(/^﻿/, '');
                    // No DTDs: an entity-expansion bomb has nothing to expand.
                    doc = /<!DOCTYPE/i.test(s.slice(0, 2048)) ? null : this.parseXml(s);
                    if (doc && doc.getElementsByTagName('parsererror').length) doc = null;
                } catch { doc = null; }
                if (!doc) this.warn(`Couldn't read ${key}`);
            }
            this.text.set(key, doc);
        }
        return this.text.get(key)?.documentElement ?? null;
    }
    rels(part: string) {
        const key = norm(part);
        let m = this.relCache.get(key);
        if (m) return m;
        m = new Map();
        const dir = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : '';
        const file = key.slice(key.lastIndexOf('/') + 1);
        const root = this.xml(`${dir ? dir + '/' : ''}_rels/${file}.rels`);
        for (const r of kids(root, 'Relationship')) {
            const id = attr(r, 'Id'), type = attr(r, 'Type') || '', target = attr(r, 'Target') || '';
            if (!id) continue;
            const external = attr(r, 'TargetMode') === 'External';
            m.set(id, { type: type.slice(type.lastIndexOf('/') + 1), target: external ? target : resolveTarget(dir, target), external });
        }
        this.relCache.set(key, m);
        return m;
    }
    relOfType(part: string, type: string): string | null {
        for (const r of this.rels(part).values()) if (r.type === type && !r.external) return r.target;
        return null;
    }
}

const norm = (p: string) => p.replace(/\\/g, '/').replace(/^\/+/, '');
function resolveTarget(dir: string, target: string): string {
    let t = target.split('#')[0];
    try { t = decodeURIComponent(t); } catch { /* keep raw */ }
    if (t.startsWith('/')) return norm(t);
    const parts = (dir ? dir.split('/') : []).concat(t.split('/'));
    const out: string[] = [];
    for (const p of parts) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
    return out.join('/');
}

// ── Theme and colour ────────────────────────────────────────────────────────────────────────

interface Theme {
    colors: Record<string, string>;      // dk1, lt1, accent1… → hex
    major: string; minor: string;        // latin typefaces
    fills: El[]; lines: El[]; bgFills: El[];
}
interface Ctx {
    theme: Theme;
    clrMap: Record<string, string>;      // bg1 → lt1 …
    phClr?: Color;
}

const DEFAULT_CLRMAP: Record<string, string> = { bg1: 'lt1', tx1: 'dk1', bg2: 'lt2', tx2: 'dk2' };

function readTheme(root: El | null): Theme {
    const t: Theme = { colors: {}, major: 'Calibri Light', minor: 'Calibri', fills: [], lines: [], bgFills: [] };
    const te = kid(root, 'themeElements');
    for (const c of kids(kid(te, 'clrScheme'))) {
        const v = kids(c)[0];
        if (!v) continue;
        const hex = v.localName === 'sysClr' ? attr(v, 'lastClr') : attr(v, 'val');
        if (hex && /^[0-9a-f]{6}$/i.test(hex)) t.colors[c.localName] = '#' + hex.toLowerCase();
    }
    const fs = kid(te, 'fontScheme');
    t.major = attr(path(fs, 'majorFont', 'latin'), 'typeface') || t.major;
    t.minor = attr(path(fs, 'minorFont', 'latin'), 'typeface') || t.minor;
    const fm = kid(te, 'fmtScheme');
    t.fills = kids(kid(fm, 'fillStyleLst'));
    t.lines = kids(kid(fm, 'lnStyleLst'));
    t.bgFills = kids(kid(fm, 'bgFillStyleLst'));
    return t;
}

const PRESET_COLORS: Record<string, string> = {
    black: '#000000', white: '#ffffff', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00',
    gray: '#808080', grey: '#808080', silver: '#c0c0c0', orange: '#ffa500', purple: '#800080', navy: '#000080',
    teal: '#008080', maroon: '#800000', lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff',
    magenta: '#ff00ff', olive: '#808000', darkGray: '#a9a9a9', lightGray: '#d3d3d3', dkGray: '#a9a9a9', ltGray: '#d3d3d3',
};

const hexToRgb = (h: string): [number, number, number] => {
    const x = h.replace('#', '');
    return [parseInt(x.slice(0, 2), 16) || 0, parseInt(x.slice(2, 4), 16) || 0, parseInt(x.slice(4, 6), 16) || 0];
};
const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const toLin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const fromLin = (c: number) => 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h = ((h % 360) + 360) % 360 / 360;
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = (t: number) => { t = (t % 1 + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** The colour element inside `holder` (solidFill, gs, fgClr…), resolved with its modifiers. */
function colorIn(holder: El | null | undefined, ctx: Ctx): Color | null {
    const c = kids(holder).find(e => /Clr$/.test(e.localName));
    return c ? colorOf(c, ctx) : null;
}

function colorOf(c: El, ctx: Ctx): Color | null {
    let hex: string | null = null;
    let alpha = 1;
    switch (c.localName) {
        case 'srgbClr': { const v = attr(c, 'val'); hex = v && /^[0-9a-f]{6}$/i.test(v) ? '#' + v.toLowerCase() : null; break; }
        case 'sysClr': { const v = attr(c, 'lastClr'); hex = v ? '#' + v.toLowerCase() : attr(c, 'val') === 'window' ? '#ffffff' : '#000000'; break; }
        case 'prstClr': hex = PRESET_COLORS[attr(c, 'val') || ''] ?? '#000000'; break;
        case 'scrgbClr': hex = rgbToHex(fromLin(num(c, 'r') / 100000), fromLin(num(c, 'g') / 100000), fromLin(num(c, 'b') / 100000)); break;
        case 'hslClr': { const [r, g, b] = hslToRgb(num(c, 'hue') / 60000, num(c, 'sat') / 100000, num(c, 'lum') / 100000); hex = rgbToHex(r, g, b); break; }
        case 'schemeClr': {
            const v = attr(c, 'val') || '';
            if (v === 'phClr') { if (ctx.phClr) { hex = ctx.phClr.hex; alpha = ctx.phClr.alpha ?? 1; } else hex = ctx.theme.colors.accent1 ?? '#4472c4'; break; }
            const mapped = ctx.clrMap[v] ?? DEFAULT_CLRMAP[v] ?? v;
            hex = ctx.theme.colors[mapped] ?? null;
            break;
        }
    }
    if (!hex) return null;
    let [r, g, b] = hexToRgb(hex);
    for (const m of kids(c)) {
        const v = num(m, 'val') / 100000;
        switch (m.localName) {
            case 'alpha': alpha = v; break;
            case 'alphaMod': alpha *= v; break;
            case 'alphaOff': alpha += v; break;
            case 'lumMod': case 'lumOff': case 'satMod': case 'satOff': case 'hueMod': case 'hueOff': {
                let [h, s, l] = rgbToHsl(r, g, b);
                if (m.localName === 'lumMod') l *= v;
                else if (m.localName === 'lumOff') l += v;
                else if (m.localName === 'satMod') s *= v;
                else if (m.localName === 'satOff') s += v;
                else if (m.localName === 'hueMod') h *= v;
                else h += num(m, 'val') / 60000;
                [r, g, b] = hslToRgb(h, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l)));
                break;
            }
            case 'tint': [r, g, b] = [r, g, b].map(x => fromLin(toLin(x) * v + (1 - v))) as [number, number, number]; break;
            case 'shade': [r, g, b] = [r, g, b].map(x => fromLin(toLin(x) * v)) as [number, number, number]; break;
            case 'comp': { const [h, s, l] = rgbToHsl(r, g, b); [r, g, b] = hslToRgb(h + 180, s, l); break; }
            case 'inv': [r, g, b] = [255 - r, 255 - g, 255 - b]; break;
            case 'gray': { const y = 0.299 * r + 0.587 * g + 0.114 * b; r = g = b = y; break; }
        }
    }
    alpha = Math.max(0, Math.min(1, alpha));
    const out: Color = { hex: rgbToHex(r, g, b) };
    if (alpha < 0.999) out.alpha = alpha;
    return out;
}

// ── Fill, line ──────────────────────────────────────────────────────────────────────────────

interface Res { pkg: Pkg; part: string; ctx: Ctx }

/** The fill named in `spPr`, or undefined when it names none (so inheritance can supply one). */
function fillOf(spPr: El | null | undefined, r: Res): Paint | undefined {
    for (const f of kids(spPr)) {
        const p = paintOf(f, r);
        if (p) return p;
    }
    return undefined;
}

function paintOf(f: El, r: Res): Paint | undefined {
    switch (f.localName) {
        case 'noFill': return { kind: 'none' };
        case 'solidFill': { const c = colorIn(f, r.ctx); return c ? { kind: 'solid', color: c } : { kind: 'none' }; }
        case 'gradFill': {
            const stops = kids(kid(f, 'gsLst'), 'gs').slice(0, 256).map(g => ({ pos: num(g, 'pos') / 100000, color: colorIn(g, r.ctx) ?? { hex: '#000000' } }));
            if (!stops.length) return { kind: 'none' };
            const lin = kid(f, 'lin');
            if (kid(f, 'path')) return { kind: 'radial', stops };
            return { kind: 'linear', stops, angle: lin ? num(lin, 'ang') / 60000 : 90, scaled: bool(lin, 'scaled') ?? false };
        }
        case 'blipFill': {
            const m = blipMedia(f, r);
            if (!m) return undefined;
            const p: Extract<Paint, { kind: 'image' }> = { kind: 'image', media: m };
            const tile = kid(f, 'tile');
            if (tile) p.tile = { sx: Math.max(0.01, num(tile, 'sx', 100000) / 100000), sy: Math.max(0.01, num(tile, 'sy', 100000) / 100000) };
            const amt = kid(kid(f, 'blip'), 'alphaModFix');
            if (amt) p.alpha = Math.max(0, Math.min(1, num(amt, 'amt', 100000) / 100000));
            if (kid(kid(f, 'blip'), 'grayscl')) p.grayscale = true;
            return p;
        }
        case 'pattFill': {
            const fg = colorIn(kid(f, 'fgClr'), r.ctx);
            const bg = colorIn(kid(f, 'bgClr'), r.ctx);
            return fg ? { kind: 'pattern', preset: attr(f, 'prst') || 'pct50', color: fg, ...(bg ? { bg } : {}) } : undefined;
        }
        case 'grpFill': return undefined;
    }
    return undefined;
}

const MEDIA_EXT: Record<string, Media['ext']> = {
    png: 'png', jpg: 'jpeg', jpeg: 'jpeg', jpe: 'jpeg', gif: 'gif', svg: 'svg', bmp: 'bmp', tif: 'tiff', tiff: 'tiff', webp: 'webp', emf: 'emf', wmf: 'wmf',
};
function blipMedia(blipFill: El, r: Res): Media | null {
    const blip = kid(blipFill, 'blip');
    // An SVG picture carries a PNG in r:embed and the SVG in an extension; the PNG is what renders everywhere.
    const rid = attr(blip, 'r:embed');
    if (!rid) return null;
    const rel = r.pkg.rels(r.part).get(rid);
    if (!rel || rel.external) return null;
    const bytes = r.pkg.bytes(rel.target);
    const ext = MEDIA_EXT[(rel.target.split('.').pop() || '').toLowerCase()];
    return bytes && ext ? { bytes, ext } : null;
}

const DASH: Record<string, string> = { solid: '', dot: 'sysDot', sysDot: 'sysDot', sysDash: 'dash', dash: 'dash', lgDash: 'dash', dashDot: 'dash', lgDashDot: 'dash', lgDashDotDot: 'dash', sysDashDot: 'dash', sysDashDotDot: 'dash' };

/** The line in `ln`, null when it is explicitly none, undefined when unspecified. */
function lineOf(ln: El | null | undefined, r: Res): Line | null | undefined {
    if (!ln) return undefined;
    let color: Color | null | undefined;
    for (const f of kids(ln)) {
        if (f.localName === 'noFill') return null;
        if (f.localName === 'solidFill') color = colorIn(f, r.ctx);
        if (f.localName === 'gradFill') color = colorIn(kid(kid(f, 'gsLst'), 'gs'), r.ctx);
    }
    const w = attr(ln, 'w');
    if (color === undefined && w === null && !kid(ln, 'prstDash') && !kid(ln, 'headEnd') && !kid(ln, 'tailEnd')) return undefined;
    const end = (e: El | null): ArrowEnd | undefined => {
        const t = attr(e, 'type');
        if (!t || t === 'none') return undefined;
        const type = (t === 'triangle' || t === 'stealth' || t === 'arrow' || t === 'oval' || t === 'diamond') ? t : 'triangle';
        const sz = attr(e, 'len') || attr(e, 'w');
        return { type, size: sz === 'sm' || sz === 'lg' ? sz : 'med' };
    };
    const dash = DASH[attr(kid(ln, 'prstDash'), 'val') || 'solid'];
    const cap = attr(ln, 'cap');
    return {
        // ECMA's default is 9525 EMU — 0.75 pt, one px.
        width: w !== null ? Math.max(0, px(Number(w) || 0)) : 1,
        color: color ?? { hex: '#000000' },
        dash: dash || undefined,
        cap: cap === 'rnd' ? 'rnd' : cap === 'sq' ? 'sq' : cap === 'flat' ? 'flat' : undefined,
        join: kid(ln, 'round') ? 'round' : kid(ln, 'bevel') ? 'bevel' : kid(ln, 'miter') ? 'miter' : undefined,
        head: end(kid(ln, 'headEnd')),
        tail: end(kid(ln, 'tailEnd')),
    };
}

/** `p:style` refs → theme fill / line, with the ref's colour as phClr. */
function styleFill(style: El | null, r: Res): Paint | undefined {
    const ref = kid(style, 'fillRef');
    if (!ref) return undefined;
    const idx = num(ref, 'idx');
    if (idx === 0) return { kind: 'none' };
    const list = idx >= 1001 ? r.ctx.theme.bgFills : r.ctx.theme.fills;
    const f = list[(idx >= 1001 ? idx - 1001 : idx - 1)];
    if (!f) return undefined;
    const ph = colorIn(ref, r.ctx) ?? undefined;
    return paintOf(f, { ...r, ctx: { ...r.ctx, phClr: ph } });
}
function styleLine(style: El | null, r: Res): Line | null | undefined {
    const ref = kid(style, 'lnRef');
    if (!ref) return undefined;
    const idx = num(ref, 'idx');
    if (idx === 0) return null;
    const ln = r.ctx.theme.lines[idx - 1];
    if (!ln) return undefined;
    const ph = colorIn(ref, r.ctx) ?? undefined;
    return lineOf(ln, { ...r, ctx: { ...r.ctx, phClr: ph } }) ?? undefined;
}

// ── Placement ───────────────────────────────────────────────────────────────────────────────

interface Box { x: number; y: number; w: number; h: number; rot: number; flipH: boolean; flipV: boolean }

function boxOf(xfrm: El | null): Box | null {
    if (!xfrm) return null;
    const off = kid(xfrm, 'off'), ext = kid(xfrm, 'ext');
    if (!off || !ext) return null;
    return {
        x: px(num(off, 'x')), y: px(num(off, 'y')), w: Math.max(0, px(num(ext, 'cx'))), h: Math.max(0, px(num(ext, 'cy'))),
        rot: num(xfrm, 'rot') / 60000, flipH: !!bool(xfrm, 'flipH'), flipV: !!bool(xfrm, 'flipV'),
    };
}

/** Maps a box in a group's child space to the parent's space. Identity at the slide level. */
type Frame = (b: Box) => Box;
const IDENTITY: Frame = b => b;

function groupFrame(xfrm: El | null, parent: Frame): Frame {
    const g = boxOf(xfrm);
    if (!g) return parent;
    const chOff = kid(xfrm, 'chOff'), chExt = kid(xfrm, 'chExt');
    const cx0 = chOff ? px(num(chOff, 'x')) : g.x, cy0 = chOff ? px(num(chOff, 'y')) : g.y;
    const cw = chExt ? px(num(chExt, 'cx')) : g.w, ch = chExt ? px(num(chExt, 'cy')) : g.h;
    const sx = cw > 0 ? g.w / cw : 1, sy = ch > 0 ? g.h / ch : 1;
    const gcx = g.x + g.w / 2, gcy = g.y + g.h / 2;
    const rad = (g.rot * Math.PI) / 180;
    return (b: Box) => {
        // Child centre into the (unrotated) group box, scaled.
        let cx = g.x + (b.x + b.w / 2 - cx0) * sx, cy = g.y + (b.y + b.h / 2 - cy0) * sy;
        let rot = b.rot, flipH = b.flipH, flipV = b.flipV;
        if (g.flipH) { cx = 2 * gcx - cx; flipH = !flipH; rot = -rot; }
        if (g.flipV) { cy = 2 * gcy - cy; flipV = !flipV; rot = -rot; }
        if (rad) {
            const dx = cx - gcx, dy = cy - gcy;
            cx = gcx + dx * Math.cos(rad) - dy * Math.sin(rad);
            cy = gcy + dx * Math.sin(rad) + dy * Math.cos(rad);
            rot += g.rot;
        }
        const w = b.w * sx, h = b.h * sy;
        return parent({ x: cx - w / 2, y: cy - h / 2, w, h, rot: ((rot % 360) + 360) % 360, flipH, flipV });
    };
}

// ── Text ────────────────────────────────────────────────────────────────────────────────────

/** Paragraph spacing: absolute (px) or a fraction of the line (`spcPct`). */
type Spacing = { px: number } | { lines: number };
function spacingOf(el: El | null): Spacing | undefined {
    const pts = kid(el, 'spcPts'), pc = kid(el, 'spcPct');
    if (pts) return { px: Math.max(0, Math.min(1584, num(pts, 'val') / 100)) * (EMU_PER_PT / EMU_PER_PX) };
    if (pc) return { lines: Math.max(0, Math.min(13.2, num(pc, 'val') / 100000)) };
    return undefined;
}

/** Paragraph-level properties merged down the style chain; `lvl` 0-based. */
interface LevelProps {
    algn?: string; marL?: number; indent?: number;
    bullet?: 'none' | 'char' | 'num';
    buChar?: string; buFont?: string | null; buClr?: Color | null; buSz?: number | null;
    numType?: string; startAt?: number;
    lnSpcPct?: number;
    spcBef?: Spacing; spcAft?: Spacing;
    sz?: number; b?: boolean; i?: boolean; u?: boolean; strike?: boolean; color?: Color | null; font?: string;
}

function levelFrom(lst: El | null | undefined, lvl: number, r: Res): LevelProps {
    const p = kid(lst, `lvl${lvl + 1}pPr`) ?? (lst && lst.localName.endsWith('pPr') ? lst : null);
    if (!p) return {};
    return pPrProps(p, r);
}

function pPrProps(p: El, r: Res): LevelProps {
    const out: LevelProps = {};
    if (attr(p, 'algn')) out.algn = attr(p, 'algn')!;
    if (attr(p, 'marL') !== null) out.marL = px(num(p, 'marL'));
    if (attr(p, 'indent') !== null) out.indent = px(num(p, 'indent'));
    if (kid(p, 'buNone')) out.bullet = 'none';
    else if (kid(p, 'buAutoNum')) {
        const an = kid(p, 'buAutoNum')!;
        out.bullet = 'num';
        out.numType = attr(an, 'type') || 'arabicPeriod';
        out.startAt = attr(an, 'startAt') !== null ? Math.max(1, Math.min(32767, Math.round(num(an, 'startAt', 1)))) : undefined;
    } else if (kid(p, 'buChar')) { out.bullet = 'char'; out.buChar = attr(kid(p, 'buChar'), 'char') || undefined; }
    else if (kid(p, 'buBlip')) { out.bullet = 'char'; out.buChar = '\u2022'; }
    // Bullet font/colour/size: an explicit value, or *Tx = "follow the text" (null resets an inherited one).
    if (kid(p, 'buFont')) out.buFont = attr(kid(p, 'buFont'), 'typeface') || null;
    else if (kid(p, 'buFontTx')) out.buFont = null;
    if (kid(p, 'buClr')) out.buClr = colorIn(kid(p, 'buClr'), r.ctx);
    else if (kid(p, 'buClrTx')) out.buClr = null;
    if (kid(p, 'buSzPct')) {
        const v = attr(kid(p, 'buSzPct'), 'val') || '';
        const n = v.endsWith('%') ? parseFloat(v) / 100 : Number(v) / 100000;
        out.buSz = Number.isFinite(n) && n > 0 ? Math.max(0.25, Math.min(4, n)) : null;
    } else if (kid(p, 'buSzTx') || kid(p, 'buSzPts')) out.buSz = null;
    const ls = path(p, 'lnSpc', 'spcPct');
    if (ls) out.lnSpcPct = num(ls, 'val') / 100000;
    const sb = spacingOf(kid(p, 'spcBef')), sa = spacingOf(kid(p, 'spcAft'));
    if (sb) out.spcBef = sb;
    if (sa) out.spcAft = sa;
    Object.assign(out, rPrProps(kid(p, 'defRPr'), r));
    return out;
}

function rPrProps(rp: El | null, r: Res): LevelProps {
    if (!rp) return {};
    const out: LevelProps = {};
    if (attr(rp, 'sz') !== null) out.sz = (num(rp, 'sz') / 100) * (EMU_PER_PT / EMU_PER_PX); // pt → px
    if (bool(rp, 'b') !== undefined) out.b = bool(rp, 'b');
    if (bool(rp, 'i') !== undefined) out.i = bool(rp, 'i');
    if (attr(rp, 'u')) out.u = attr(rp, 'u') !== 'none';
    if (attr(rp, 'strike')) out.strike = attr(rp, 'strike') !== 'noStrike';
    const sf = kid(rp, 'solidFill');
    if (sf) out.color = colorIn(sf, r.ctx);
    else if (kid(rp, 'noFill')) out.color = null;
    const latin = attr(kid(rp, 'latin'), 'typeface');
    if (latin) out.font = latin;
    return out;
}

/**
 * A bullet character as Unicode. Most templates draw bullets from symbol fonts — Wingdings
 * "§" is a small square, Symbol "·" a dot — whose code points mean something else in any
 * other font, so they are mapped to the glyph they show. An unknown symbol-font character
 * falls back to "•" rather than rendering as a stray letter.
 */
const WINGDINGS: Record<number, string> = {
    0x6C: '\u25CF', 0x6E: '\u25A0', 0x6F: '\u25A1', 0x71: '\u2751', 0x75: '\u25C6', 0x76: '\u2756',
    0x9F: '\u2022', 0xA7: '\u25AA', 0xA8: '\u25FB', 0xD8: '\u27A2', 0xFC: '\u2714', 0xFB: '\u2717', 0xFE: '\u2611',
};
const SYMBOL: Record<number, string> = { 0xB7: '\u2022', 0xA8: '\u2666', 0xAE: '\u2192', 0xDE: '\u21D2', 0x2D: '\u2212', 0x2A: '\u2217' };
function bulletGlyph(ch: string | undefined, font: string | undefined): string {
    if (!ch) return '\u2022';
    let code = ch.codePointAt(0)!;
    if (code >= 0xF000 && code <= 0xF0FF) code -= 0xF000; // symbol fonts' private-use alias
    const f = (font || '').toLowerCase();
    if (f.startsWith('wingdings')) return (f === 'wingdings' && WINGDINGS[code]) || '\u2022';
    if (f === 'symbol') return SYMBOL[code] ?? (code < 0x80 && code > 0x20 ? String.fromCharCode(code) : '\u2022');
    if (f.startsWith('webdings') || f.startsWith('marlett')) return '\u2022';
    if (f === 'courier new' && ch === 'o') return '\u25E6';
    if (/\s/.test(ch) || code < 0x20) return '\u2022';
    return [...ch][0];
}

const merge = (...ls: LevelProps[]): LevelProps => {
    const out: LevelProps = {};
    for (const l of ls) for (const [k, v] of Object.entries(l)) if (v !== undefined) (out as any)[k] = v;
    return out;
};

function themeFont(f: string | undefined, theme: Theme): string | undefined {
    if (!f) return undefined;
    if (f.startsWith('+mj')) return theme.major;
    if (f.startsWith('+mn')) return theme.minor;
    return f;
}

interface TextChain {
    /** lstStyle-like sources, lowest priority first. */
    levels: (El | null | undefined)[];
    bodyPr: (El | null | undefined)[];  // lowest priority first
    fontRef?: { font?: string; color?: Color | null };
}

function textBodyOf(txBody: El | null, chain: TextChain, r: Res): TextBody | undefined {
    if (!txBody) return undefined;
    const paras = kids(txBody, 'p');
    const hasText = paras.some(p => kids(p).some(k => (k.localName === 'r' || k.localName === 'fld') && (path(k, 't')?.textContent ?? '') !== ''));
    if (!hasText) return undefined;
    // bodyPr: merge attributes down the chain (layout/master placeholder → own).
    const bp: Record<string, string> = {};
    let fontScale = 1;
    let spacingScale = 1; // normAutofit's lnSpcReduction shrinks paragraph spacing too
    let autofitNone = false;
    for (const b of [...chain.bodyPr, kid(txBody, 'bodyPr')]) {
        if (!b) continue;
        for (let i = 0; i < b.attributes.length; i++) bp[b.attributes[i].localName ?? b.attributes[i].name] = b.attributes[i].value;
        const na = kid(b, 'normAutofit');
        if (na) { fontScale = attr(na, 'fontScale') !== null ? num(na, 'fontScale') / 100000 : 1; autofitNone = false; }
        if (na) spacingScale = 1 - Math.max(0, Math.min(0.9, num(na, 'lnSpcReduction') / 100000));
        if (kid(b, 'noAutofit') || kid(b, 'spAutoFit')) { fontScale = 1; spacingScale = 1; autofitNone = true; }
    }
    void autofitNone;
    const ins = (k: string, d: number) => bp[k] !== undefined ? px(Number(bp[k]) || 0) : px(d);
    const anchor = bp.anchor === 'ctr' ? 'ctr' : bp.anchor === 'b' ? 'b' : 't';
    const lstOwn = kid(txBody, 'lstStyle');
    const paragraphs: Paragraph[] = [];
    let spacing: number | undefined;
    for (const p of paras) {
        const pPr = kid(p, 'pPr');
        const lvl = Math.max(0, Math.min(8, num(pPr, 'lvl')));
        // The shape style's font (fontRef) sits above the inherited list styles and below the
        // shape's own: a theme-styled shape's label is white because of it, whatever the
        // presentation's default text colour says.
        const ref: LevelProps = chain.fontRef ? { color: chain.fontRef.color ?? undefined, font: chain.fontRef.font } : {};
        const lp = merge(...chain.levels.map(l => levelFrom(l, lvl, r)), ref, levelFrom(lstOwn, lvl, r), pPr ? pPrProps(pPr, r) : {});
        if (lp.lnSpcPct !== undefined && spacing === undefined) spacing = lp.lnSpcPct;
        const para: Paragraph = { runs: [], align: lp.algn === 'ctr' ? 'ctr' : lp.algn === 'r' ? 'r' : lp.algn === 'just' ? 'l' : 'l', level: lvl };
        if (lp.bullet === 'char' || lp.bullet === 'num') {
            para.bullet = lp.bullet;
            para.marL = lp.marL ?? 0;
            para.indent = lp.indent ?? 0;
            if (lp.bullet === 'char') {
                const glyph = bulletGlyph(lp.buChar, lp.buFont ?? undefined);
                if (glyph !== '\u2022') para.bulletChar = glyph;
            } else {
                if (lp.numType && lp.numType !== 'arabicPeriod') para.numType = lp.numType;
                if (lp.startAt && lp.startAt !== 1) para.startAt = lp.startAt;
            }
            if (lp.buClr) para.bulletColor = lp.buClr;
            if (lp.buSz && Math.abs(lp.buSz - 1) > 1e-3) para.bulletScale = lp.buSz;
        }
        const runBase = (rp: El | null): TextRun => {
            const rr = merge(lp, rPrProps(rp, r));
            const size = (rr.sz ?? (18 * EMU_PER_PT) / EMU_PER_PX) * fontScale;
            const color = rr.color === null ? undefined : rr.color ?? colorOfScheme('tx1', r);
            return {
                text: '', size,
                bold: rr.b || undefined, italic: rr.i || undefined, underline: rr.u || undefined, strike: rr.strike || undefined,
                color: color ?? undefined,
                font: themeFont(rr.font ?? '+mn-lt', r.ctx.theme),
            };
        };
        for (const k of kids(p)) {
            if (k.localName === 'r' || k.localName === 'fld') {
                const t = path(k, 't')?.textContent ?? '';
                if (!t) continue;
                // A vertical tab inside a run is a soft line break.
                t.split(/[\v\n]/).forEach((piece, i) => {
                    if (i > 0) para.runs.push({ ...runBase(kid(k, 'rPr')), br: true });
                    if (piece) para.runs.push({ ...runBase(kid(k, 'rPr')), text: piece });
                });
            } else if (k.localName === 'br') {
                para.runs.push({ ...runBase(kid(k, 'rPr')), br: true });
            }
        }
        para.endSize = runBase(kid(p, 'endParaRPr')).size;
        // A percentage is of the paragraph's line: its largest run (or, if empty, its end mark) at 1.2 em.
        const linePx = (para.runs.length ? Math.max(...para.runs.map(x => x.size ?? 0)) : para.endSize ?? 0) * 1.2 * (lp.lnSpcPct ?? 1);
        const space = (sp: Spacing | undefined) => sp ? ('px' in sp ? sp.px : sp.lines * linePx) * spacingScale : 0;
        const before = space(lp.spcBef), after = space(lp.spcAft);
        if (before > 0.05) para.spaceBefore = Math.round(before * 100) / 100;
        if (after > 0.05) para.spaceAfter = Math.round(after * 100) / 100;
        paragraphs.push(para);
    }
    return {
        paragraphs,
        anchor,
        insets: { l: ins('lIns', 91440), t: ins('tIns', 45720), r: ins('rIns', 91440), b: ins('bIns', 45720) },
        wrap: bp.wrap !== 'none',
        lineSpacing: spacing,
    };
}

const colorOfScheme = (name: string, r: Res): Color | null => {
    const mapped = r.ctx.clrMap[name] ?? DEFAULT_CLRMAP[name] ?? name;
    const hex = r.ctx.theme.colors[mapped];
    return hex ? { hex } : null;
};

// ── Placeholders ────────────────────────────────────────────────────────────────────────────

interface PhInfo { type: string; idx: number }
const phOf = (nvPr: El | null): PhInfo | null => {
    const ph = kid(nvPr, 'ph');
    if (!ph) return null;
    return { type: attr(ph, 'type') || 'obj', idx: num(ph, 'idx') };
};
const nvPrOf = (sp: El) => kid(kids(sp).find(k => k.localName.startsWith('nv')) ?? null, 'nvPr');

const TITLES = new Set(['title', 'ctrTitle']);
const NON_BODY = new Set(['title', 'ctrTitle', 'dt', 'ftr', 'sldNum', 'hdr']);
const compatible = (a: string, b: string) =>
    a === b || (TITLES.has(a) && TITLES.has(b)) || (!NON_BODY.has(a) && !NON_BODY.has(b));

/** The placeholder shape on a layout/master that a slide placeholder inherits from (DeckCraft resolve.rs find_ph). */
function findPh(tree: El | null, ph: PhInfo): El | null {
    const cands = shapesWithPh(tree);
    if (ph.idx) {
        const m = cands.find(c => c.ph.idx === ph.idx && compatible(c.ph.type, ph.type));
        if (m) return m.el;
    }
    return (cands.find(c => c.ph.type === ph.type && (c.ph.idx === ph.idx || !ph.idx || TITLES.has(ph.type)))
        ?? cands.find(c => c.ph.type === ph.type)
        ?? cands.find(c => compatible(c.ph.type, ph.type)))?.el ?? null;
}
function shapesWithPh(tree: El | null): { el: El; ph: PhInfo }[] {
    const out: { el: El; ph: PhInfo }[] = [];
    for (const k of elementKids(tree)) {
        const ph = phOf(nvPrOf(k));
        if (ph) out.push({ el: k, ph });
    }
    return out;
}
const masterPhType = (t: string) => TITLES.has(t) ? 'title' : ['dt', 'ftr', 'sldNum', 'hdr'].includes(t) ? t : 'body';

// ── Shapes ──────────────────────────────────────────────────────────────────────────────────

interface Level {
    part: string;            // the part the shape lives in (for relationships)
    tree: El | null;         // its spTree
}
interface SlideCtx {
    pkg: Pkg;
    ctx: Ctx;
    slide: Level; layout: Level | null; master: Level | null;
    masterTx: { title: El | null; body: El | null; other: El | null };
    defaultText: El | null;
    warnings: string[];
    count: number;
    /** The slide's background, for shapes marked `useBgFill` ("fill with the slide background"). */
    background?: Paint;
    /** `ppt/tableStyles.xml`'s root: the definitions of the table styles the deck uses. */
    tableStyles: El | null;
}

const avOf = (geomEl: El | null): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const g of kids(kid(geomEl, 'avLst'), 'gd')) { const n = attr(g, 'name'), f = attr(g, 'fmla'); if (n && f) out[n] = f; }
    return out;
};

/** custGeom XML → the GeomDef shape guides.ts evaluates. */
function custDef(cg: El): GeomDef {
    const gds = (el: El | null) => kids(el, 'gd').slice(0, 10000).map(g => [attr(g, 'name') || '', attr(g, 'fmla') || 'val 0'] as [string, string]);
    const cx = kids(kid(cg, 'cxnLst'), 'cxn').map(c => [attr(c, 'ang') || '0', attr(kid(c, 'pos'), 'x') || '0', attr(kid(c, 'pos'), 'y') || '0'] as [string, string, string]);
    const rect = kid(cg, 'rect');
    const paths = kids(kid(cg, 'pathLst'), 'path').slice(0, 1000).map(p => {
        const d: (string | number)[][] = [];
        for (const c of kids(p)) {
            const pts = kids(c, 'pt').map(pt => [attr(pt, 'x') || '0', attr(pt, 'y') || '0']).flat();
            switch (c.localName) {
                case 'moveTo': d.push(['M', ...pts]); break;
                case 'lnTo': d.push(['L', ...pts]); break;
                case 'quadBezTo': d.push(['Q', ...pts]); break;
                case 'cubicBezTo': d.push(['C', ...pts]); break;
                case 'arcTo': d.push(['A', attr(c, 'wR') || '0', attr(c, 'hR') || '0', attr(c, 'stAng') || '0', attr(c, 'swAng') || '0']); break;
                case 'close': d.push(['Z']); break;
            }
        }
        const fill = attr(p, 'fill');
        return { w: num(p, 'w') || undefined, h: num(p, 'h') || undefined, fill: fill && fill !== 'norm' ? fill : undefined, stroke: bool(p, 'stroke') === false ? false : undefined, d };
    });
    return {
        av: kids(kid(cg, 'avLst'), 'gd').map(g => [attr(g, 'name') || '', attr(g, 'fmla') || 'val 0'] as [string, string]),
        gd: gds(kid(cg, 'gdLst')),
        cxn: cx,
        rect: rect ? [attr(rect, 'l') || 'l', attr(rect, 't') || 't', attr(rect, 'r') || 'r', attr(rect, 'b') || 'b'] : null,
        paths,
    };
}

function geometryOf(spPr: El | null, box: Box): { geom: Geometry; textRect?: ShapeItem['textRect'] } | undefined {
    const prst = kid(spPr, 'prstGeom');
    if (prst) {
        const adj: Record<string, number> = {};
        for (const [k, f] of Object.entries(avOf(prst))) { const m = /^val\s+(-?\d+(\.\d+)?)/.exec(f); if (m) adj[k] = Number(m[1]); }
        return { geom: { kind: 'preset', prst: attr(prst, 'prst') || 'rect', adj: Object.keys(adj).length ? adj : undefined } };
    }
    const cg = kid(spPr, 'custGeom');
    if (cg) {
        const def = custDef(cg);
        return { geom: { kind: 'custom', paths: geometryPathsPx(def, box.w, box.h) }, textRect: def.rect ? textRectPx(def, box.w, box.h) : undefined };
    }
    return undefined;
}

function readShapes(tree: El | null, level: Level, sc: SlideCtx, frame: Frame, depth: number, includePlaceholders: boolean): Item[] {
    const out: Item[] = [];
    if (depth > MAX_GROUP_DEPTH) { sc.warnings.push('Groups nested too deeply; the innermost were skipped.'); return out; }
    for (const el of elementKids(tree)) {
        if (++sc.count > MAX_SHAPES_PER_SLIDE) { sc.warnings.push('Too many shapes on one slide; the rest were skipped.'); break; }
        try {
            const item = readOne(el, level, sc, frame, depth, includePlaceholders);
            if (item) out.push(...(Array.isArray(item) ? item : [item]));
        } catch {
            sc.warnings.push(`A ${el.localName} couldn't be read and was skipped.`);
        }
    }
    return out;
}

const JUMPS: Record<string, 'next' | 'previous' | 'first' | 'last' | 'end'> = {
    nextslide: 'next', previousslide: 'previous', firstslide: 'first', lastslide: 'last', endshow: 'end',
};

/**
 * An object's click action (`a:hlinkClick` on its cNvPr): a web address, a jump to a slide (named
 * by its part path, the slide's key), or next/previous/first/last/end. Other actions (run a
 * program, play a sound, a custom show, a macro) are not links Yappy can follow and are dropped.
 */
function linkOf(cNvPr: El | null, part: string, pkg: Pkg): DeckLink | undefined {
    const h = kid(cNvPr, 'hlinkClick');
    if (!h) return undefined;
    const action = attr(h, 'action') || '';
    const rel = pkg.rels(part).get(attr(h, 'r:id') || '');
    if (action.startsWith('ppaction://hlinkshowjump')) {
        const jump = JUMPS[(/jump=([a-z]+)/i.exec(action)?.[1] ?? '').toLowerCase()];
        return jump ? { kind: 'action', action: jump } : undefined;
    }
    if (action.startsWith('ppaction://hlinksldjump')) return rel && !rel.external ? { kind: 'slide', key: rel.target } : undefined;
    if (action) return undefined;
    return rel?.external && /^(https?:|mailto:|tel:)/i.test(rel.target) ? { kind: 'url', url: rel.target } : undefined;
}

function readOne(el: El, level: Level, sc: SlideCtx, frame: Frame, depth: number, includePh: boolean): Item | Item[] | null {
    const nv = kids(el).find(k => k.localName.startsWith('nv'));
    const out = readOneInner(el, level, sc, frame, depth, includePh);
    const link = out ? linkOf(kid(nv ?? null, 'cNvPr'), level.part, sc.pkg) : undefined;
    if (link) for (const it of Array.isArray(out) ? out : [out!]) it.link = link;
    return out;
}

function readOneInner(el: El, level: Level, sc: SlideCtx, frame: Frame, depth: number, includePh: boolean): Item | Item[] | null {
    const r: Res = { pkg: sc.pkg, part: level.part, ctx: sc.ctx };
    const nv = kids(el).find(k => k.localName.startsWith('nv'));
    const cNvPr = kid(nv ?? null, 'cNvPr');
    const id = num(cNvPr, 'id');
    const name = attr(cNvPr, 'name') || el.localName;
    if (attr(cNvPr, 'hidden') === '1') return null;
    switch (el.localName) {
        case 'sp': return readSp(el, level, sc, frame, id, name, includePh);
        case 'cxnSp': {
            const spPr = kid(el, 'spPr');
            const box = boxOf(kid(spPr, 'xfrm'));
            if (!box) return null;
            const b = frame(box);
            const style = kid(el, 'style');
            const line = lineOf(kid(spPr, 'ln'), r) ?? styleLine(style, r) ?? { width: 1, color: { hex: '#000000' } };
            if (!line) return null;
            const g = geometryOf(spPr, b) ?? { geom: { kind: 'preset', prst: 'line' } as Geometry };
            const glue = (e: El | null) => e ? { id: num(e, 'id'), idx: num(e, 'idx') } : undefined;
            const cn = kid(nv ?? null, 'cNvCxnSpPr');
            return { kind: 'connector', id, name, ...b, geom: g.geom, line, start: glue(kid(cn, 'stCxn')), end: glue(kid(cn, 'endCxn')) };
        }
        case 'pic': {
            const spPr = kid(el, 'spPr');
            let box = boxOf(kid(spPr, 'xfrm'));
            const ph = phOf(kid(nv ?? null, 'nvPr'));
            if (!box && ph) box = inheritedBox(ph, sc);
            if (!box) return null;
            const bf = kid(el, 'blipFill');
            const media = bf ? blipMedia(bf, r) : null;
            if (!media) { sc.warnings.push(`Picture "${name}" has no image the importer can read.`); return null; }
            const src = kid(bf, 'srcRect');
            const crop = src ? { l: num(src, 'l') / 100000, t: num(src, 't') / 100000, r: num(src, 'r') / 100000, b: num(src, 'b') / 100000 } : undefined;
            const amt = attr(path(bf, 'blip', 'alphaModFix'), 'amt');
            const b = frame(box);
            const g = geometryOf(spPr, b)?.geom;
            const outline = g && !(g.kind === 'preset' && g.prst === 'rect') ? g : undefined;
            return { kind: 'picture', id, name, ...b, media, crop, alpha: amt !== null ? Number(amt) / 100000 : undefined, descr: attr(cNvPr, 'descr') || undefined, geom: outline, ...(path(bf, 'blip', 'grayscl') ? { grayscale: true } : {}) };
        }
        case 'grpSp': {
            const gpr = kid(el, 'grpSpPr');
            const xfrm = kid(gpr, 'xfrm');
            const inner = groupFrame(xfrm, frame);
            const children = readShapes(el, level, sc, inner, depth + 1, includePh);
            if (!children.length) return null;
            const b = bounds(children);
            const grp: GroupItem = { kind: 'group', id, name, ...b, children };
            return grp;
        }
        case 'graphicFrame': return readGraphicFrame(el, level, sc, frame, id, name, depth);
        default: return null; // contentPart (ink), etc.
    }
}

function bounds(items: Item[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const it of items) { minX = Math.min(minX, it.x); minY = Math.min(minY, it.y); maxX = Math.max(maxX, it.x + it.w); maxY = Math.max(maxY, it.y + it.h); }
    return { x: minX, y: minY, w: Math.max(0, maxX - minX), h: Math.max(0, maxY - minY) };
}

function inheritedBox(ph: PhInfo, sc: SlideCtx): Box | null {
    const lph = findPh(sc.layout?.tree ?? null, ph);
    const lb = boxOf(path(lph, 'spPr', 'xfrm'));
    if (lb) return lb;
    const mph = findPh(sc.master?.tree ?? null, { type: masterPhType(ph.type), idx: 0 });
    return boxOf(path(mph, 'spPr', 'xfrm'));
}

/** The first source that is not undefined; null ("explicitly none") counts as an answer. */
function firstSaid<T>(...sources: (() => T | undefined)[]): T | undefined {
    for (const f of sources) { const v = f(); if (v !== undefined) return v; }
    return undefined;
}

function readSp(el: El, level: Level, sc: SlideCtx, frame: Frame, id: number, name: string, includePh: boolean): Item | null {
    const r: Res = { pkg: sc.pkg, part: level.part, ctx: sc.ctx };
    const nvPr = nvPrOf(el);
    const ph = phOf(nvPr);
    // A layout's or master's placeholders are templates for slides, not artwork.
    if (ph && !includePh) return null;
    const spPr = kid(el, 'spPr');
    const style = kid(el, 'style');
    const isText = attr(path(el, 'nvSpPr', 'cNvSpPr'), 'txBox') === '1';

    // Inheritance sources: the layout placeholder, then the master's.
    const lph = ph && sc.layout ? findPh(sc.layout.tree, ph) : null;
    const mph = ph && sc.master ? findPh(sc.master.tree, { type: masterPhType(lph ? (phOf(nvPrOf(lph))?.type ?? ph.type) : ph.type), idx: 0 }) : null;
    const lr: Res | null = lph && sc.layout ? { pkg: sc.pkg, part: sc.layout.part, ctx: sc.ctx } : null;
    const mr: Res | null = mph && sc.master ? { pkg: sc.pkg, part: sc.master.part, ctx: sc.ctx } : null;

    let box = boxOf(kid(spPr, 'xfrm')) ?? boxOf(path(lph, 'spPr', 'xfrm')) ?? boxOf(path(mph, 'spPr', 'xfrm'));
    if (!box) return null;
    box = frame(box);

    const g = geometryOf(spPr, box) ?? (lph ? geometryOf(kid(lph, 'spPr'), box) : undefined) ?? (mph ? geometryOf(kid(mph, 'spPr'), box) : undefined)
        ?? { geom: { kind: 'preset', prst: 'rect' } as Geometry };
    // useBgFill: "fill with the slide background". A colour or gradient can be copied; a picture
    // can't (it would have to line up with the slide's), so the shape lets the background show.
    const bgFill: Paint | undefined = !bool(el, 'useBgFill') ? undefined
        : sc.background?.kind === 'image' ? { kind: 'none' } : sc.background ?? { kind: 'solid', color: { hex: '#ffffff' } };
    // The shape's own formatting, then its own style refs (p:style), then what its placeholder
    // inherits. A slide placeholder's p:style outranks the layout's "no fill": with the style
    // checked last, a theme-filled placeholder came in empty (white text on white).
    const fill = bgFill
        ?? fillOf(spPr, r) ?? styleFill(style, r)
        ?? (lr ? fillOf(kid(lph, 'spPr'), lr) : undefined) ?? (mr ? fillOf(kid(mph, 'spPr'), mr) : undefined)
        ?? (lr ? styleFill(kid(lph, 'style'), lr) : undefined)
        ?? { kind: 'none' };
    // First level that says anything wins — including "no line" (null), which `??` would skip.
    const line = firstSaid<Line | null>(
        () => lineOf(kid(spPr, 'ln'), r), () => styleLine(style, r),
        () => lr ? lineOf(path(lph, 'spPr', 'ln'), lr) : undefined, () => mr ? lineOf(path(mph, 'spPr', 'ln'), mr) : undefined,
    ) ?? null;

    // Text style chain: master text styles (placeholders only) → master ph → layout ph → own.
    const levels: (El | null)[] = [];
    if (ph) {
        const t = lph ? (phOf(nvPrOf(lph))?.type ?? ph.type) : ph.type;
        levels.push(TITLES.has(t) ? sc.masterTx.title : ['body', 'obj', 'subTitle', 'tbl', 'chart', 'dgm', 'media', 'pic', 'clipArt'].includes(t) ? sc.masterTx.body : sc.masterTx.other);
        levels.push(path(mph, 'txBody', 'lstStyle'), path(lph, 'txBody', 'lstStyle'));
    } else {
        levels.push(sc.defaultText);
    }
    const fontRef = kid(style, 'fontRef');
    const chain: TextChain = {
        levels,
        bodyPr: [path(mph, 'txBody', 'bodyPr'), path(lph, 'txBody', 'bodyPr')],
        fontRef: fontRef ? { font: attr(fontRef, 'idx') === 'major' ? '+mj-lt' : '+mn-lt', color: colorIn(fontRef, r.ctx) } : undefined,
    };
    const text = textBodyOf(kid(el, 'txBody'), chain, r);

    const visible = fill.kind !== 'none' || !!line || !!text;
    if (!visible) return null; // an empty placeholder, or an invisible shape
    // A SmartArt shape keeps its text in its own box (`dsp:txXfrm`) — beside a circle, below an icon.
    let textRect = g.textRect;
    const raw = boxOf(kid(spPr, 'xfrm'));
    const tx = text ? boxOf(kid(el, 'txXfrm')) : null;
    if (tx && raw && raw.w > 0 && raw.h > 0) {
        const sx = box.w / raw.w, sy = box.h / raw.h;
        const r0 = { l: (tx.x - raw.x) * sx, t: (tx.y - raw.y) * sy, r: (tx.x + tx.w - raw.x) * sx, b: (tx.y + tx.h - raw.y) * sy };
        if (Math.abs(r0.l) > 0.5 || Math.abs(r0.t) > 0.5 || Math.abs(r0.r - box.w) > 0.5 || Math.abs(r0.b - box.h) > 0.5) textRect = r0;
    }
    return { kind: 'shape', id, name, ...box, geom: g.geom, fill, line, text, textBox: isText || undefined, textRect };
}

/**
 * How a table cell looks before its own `tcPr`. A table names its style by GUID; PowerPoint writes
 * the definition of every style a deck uses into `ppt/tableStyles.xml`, so the parts there
 * (whole table, bands, first/last row and column) are read generically. A style the file doesn't
 * define falls back to the default every new table gets — Medium Style 2, Accent 1 ({5C22544A-…})
 * — reproduced from the theme; any other unknown style gives plain cells.
 */
interface CellLook { fill?: Paint; text?: Color; bold?: boolean; border?: Line | null }
type CellLookFor = ((ri: number, ci: number, rows: number, cols: number) => CellLook) & { background?: Paint };
const DEFAULT_TABLE_STYLE = '{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}';

function tablePartLook(part: El | null, r: Res): CellLook {
    const out: CellLook = {};
    if (!part) return out;
    const tc = kid(part, 'tcStyle'), tx = kid(part, 'tcTxStyle');
    const fillEl = kid(tc, 'fill');
    const fill = fillEl ? fillOf(fillEl, r) : styleFill(tc, r);
    if (fill) out.fill = fill;
    const text = colorIn(tx, r.ctx) ?? colorIn(kid(tx, 'fontRef'), r.ctx);
    if (text) out.text = text;
    if (attr(tx, 'b') === 'on') out.bold = true;
    const bdr = kid(tc, 'tcBdr');
    for (const side of ['insideH', 'bottom', 'top', 'left']) {
        const b = kid(bdr, side);
        if (!b) continue;
        const ln = lineOf(kid(b, 'ln'), r) ?? styleLine(b, r); // an explicit line, or a theme line (lnRef)
        if (ln !== undefined) { out.border = ln; break; }
    }
    return out;
}

function tableLook(tblPr: El | null, r: Res, styles: El | null): CellLookFor | null {
    const id = ((kid(tblPr, 'tableStyleId')?.textContent || '').trim() || attr(styles, 'def') || DEFAULT_TABLE_STYLE).toUpperCase();
    const flag = (n: string) => bool(tblPr, n) ?? false;
    const f = { firstRow: flag('firstRow'), lastRow: flag('lastRow'), firstCol: flag('firstCol'), lastCol: flag('lastCol'), bandRow: flag('bandRow'), bandCol: flag('bandCol') };
    const def = kids(styles, 'tblStyle').find(st => (attr(st, 'styleId') || '').toUpperCase() === id);
    if (def) {
        const part = (n: string) => tablePartLook(kid(def, n), r);
        const tblBg = kid(def, 'tblBg');
        const background = tblBg ? (kid(tblBg, 'fill') ? fillOf(kid(tblBg, 'fill'), r) : styleFill(tblBg, r)) : undefined;
        const P = { whole: part('wholeTbl'), b1H: part('band1H'), b2H: part('band2H'), b1V: part('band1V'), b2V: part('band2V'),
            firstRow: part('firstRow'), lastRow: part('lastRow'), firstCol: part('firstCol'), lastCol: part('lastCol') };
        const lookFor: CellLookFor = (ri, ci, rows, cols) => {
            // Lowest to highest precedence, as PowerPoint layers them.
            const layers: CellLook[] = [P.whole];
            const br = ri - (f.firstRow ? 1 : 0), bc = ci - (f.firstCol ? 1 : 0);
            if (f.bandCol && bc >= 0) layers.push(bc % 2 === 0 ? P.b1V : P.b2V);
            if (f.bandRow && br >= 0) layers.push(br % 2 === 0 ? P.b1H : P.b2H);
            if (f.firstCol && ci === 0) layers.push(P.firstCol);
            if (f.lastCol && ci === cols - 1) layers.push(P.lastCol);
            if (f.firstRow && ri === 0) layers.push(P.firstRow);
            if (f.lastRow && ri === rows - 1) layers.push(P.lastRow);
            const out: CellLook = {};
            for (const l of layers) {
                if (l.fill) out.fill = l.fill;
                if (l.text) out.text = l.text;
                if (l.bold) out.bold = true;
                if (l.border !== undefined) out.border = l.border;
            }
            return out;
        };
        // The table's own background (tblBg) shows through cells that have no fill.
        if (background && background.kind !== 'none') lookFor.background = background;
        return lookFor;
    }
    if (id !== DEFAULT_TABLE_STYLE) return null;
    const accent = r.ctx.theme.colors.accent1 ?? '#4472c4';
    const tint = (k: number): Color => {
        const [rr, gg, bb] = hexToRgb(accent);
        return { hex: rgbToHex(fromLin(toLin(rr) * k + (1 - k)), fromLin(toLin(gg) * k + (1 - k)), fromLin(toLin(bb) * k + (1 - k))) };
    };
    const white: Color = { hex: r.ctx.theme.colors.lt1 ?? '#ffffff' };
    const body = colorOfScheme('tx1', r) ?? undefined;
    return (ri) => {
        const header = f.firstRow && ri === 0;
        const banded = f.bandRow && !header && (ri - (f.firstRow ? 1 : 0)) % 2 === 0;
        return { fill: { kind: 'solid', color: header ? { hex: accent } : banded ? tint(0.4) : tint(0.2) },
            text: header ? white : body, bold: header || undefined, border: { width: 1.33, color: white } };
    };
}

/** Tables become a group of cell rectangles with text; charts/diagrams/objects a labelled frame. */
function readGraphicFrame(el: El, level: Level, sc: SlideCtx, frame: Frame, id: number, name: string, depth = 0): Item | null {
    const r: Res = { pkg: sc.pkg, part: level.part, ctx: sc.ctx };
    const box0 = boxOf(kid(el, 'xfrm'));
    if (!box0) return null;
    const gd = path(el, 'graphic', 'graphicData');
    const tbl = kid(gd, 'tbl');
    if (tbl) {
        const cols = kids(kid(tbl, 'tblGrid'), 'gridCol').map(c => px(num(c, 'w')));
        const look = tableLook(kid(tbl, 'tblPr'), r, sc.tableStyles);
        const cells: Item[] = [];
        let y = box0.y;
        let cid = 1_000_000 + id * 1000;
        const rowsEl = kids(tbl, 'tr');
        rowsEl.forEach((tr, ri) => {
            const h = px(num(tr, 'h'));
            let x = box0.x, ci = 0;
            for (const tc of kids(tr, 'tc')) {
                const span = Math.max(1, num(tc, 'gridSpan', 1));
                const w = cols.slice(ci, ci + span).reduce((a, b) => a + b, 0);
                ci += span;
                if (bool(tc, 'hMerge') || bool(tc, 'vMerge')) { x += w; continue; }
                const rowSpan = Math.max(1, num(tc, 'rowSpan', 1));
                const tcPr = kid(tc, 'tcPr');
                const cellH = rowSpan > 1 ? h * rowSpan : h;
                const cl = look ? look(ri, ci - span, rowsEl.length, cols.length) : null;
                const styleFont: TextChain['fontRef'] = cl?.text ? { color: cl.text } : undefined;
                const text = textBodyOf(kid(tc, 'txBody'), { levels: [sc.defaultText], bodyPr: [], fontRef: styleFont }, r);
                if (text && cl?.bold) text.paragraphs.forEach(p => p.runs.forEach(run => { if (run.bold === undefined) run.bold = true; }));
                if (text) {
                    text.insets = { l: px(num(tcPr, 'marL', 91440)), r: px(num(tcPr, 'marR', 91440)), t: px(num(tcPr, 'marT', 45720)), b: px(num(tcPr, 'marB', 45720)) };
                    text.anchor = attr(tcPr, 'anchor') === 'ctr' ? 'ctr' : attr(tcPr, 'anchor') === 'b' ? 'b' : 't';
                }
                const border = lineOf(kid(tcPr, 'lnB'), r) ?? lineOf(kid(tcPr, 'lnT'), r)
                    ?? (cl ? cl.border ?? null : { width: 1, color: { hex: '#bfbfbf' } });
                const styleFill: Paint | undefined = cl?.fill;
                cells.push({ kind: 'shape', id: cid++, name: `${name} cell`, ...frame({ x, y, w, h: cellH, rot: 0, flipH: false, flipV: false }),
                    geom: { kind: 'preset', prst: 'rect' }, fill: fillOf(tcPr, r) ?? styleFill ?? { kind: 'none' }, line: border, text });
                x += w;
            }
            y += h;
        });
        if (!cells.length) return null;
        if (look?.background) {
            const b = bounds(cells);
            cells.unshift({ kind: 'shape', id: cid++, name: `${name} background`, x: b.x, y: b.y, w: b.w, h: b.h, rot: 0, flipH: false, flipV: false,
                geom: { kind: 'preset', prst: 'rect' }, fill: look.background, line: null } as Item);
        }
        return { kind: 'group', id, name, ...bounds(cells), children: cells };
    }
    const uri = attr(gd, 'uri') || '';
    if (/diagram/.test(uri)) {
        const drawn = smartArtDrawing(gd, level, sc, frame, box0, id, name, depth);
        if (drawn) return drawn;
        const listed = smartArtText(gd, level, sc, frame, box0, id, name, r);
        if (listed) return listed;
    }
    const what = /chart/.test(uri) ? 'Chart' : /diagram/.test(uri) ? 'SmartArt diagram' : 'Embedded object';
    sc.warnings.push(`${what} "${name}" was imported as a placeholder frame.`);
    return { kind: 'shape', id, name, ...frame(box0), geom: { kind: 'preset', prst: 'rect' },
        fill: { kind: 'solid', color: { hex: '#f1f3f5' } }, line: { width: 1, color: { hex: '#adb5bd' }, dash: 'dash' },
        text: { paragraphs: [{ runs: [{ text: `${what}: ${name}`, size: 16, color: { hex: '#495057' } }], align: 'ctr' }], anchor: 'ctr', insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: true } };
}

/**
 * SmartArt as the shapes PowerPoint last drew for it. Besides the diagram's data and layout
 * (which only PowerPoint's layout engine can turn into geometry), every SmartArt saved since
 * Office 2010 carries a `diagramDrawing` part: plain DrawingML shapes in the frame's own
 * coordinates. The data part names it (`dsp:dataModelExt relId`, a relationship of the slide);
 * failing that, a slide with a single drawing part has only one candidate.
 */
function smartArtDrawing(gd: El | null, level: Level, sc: SlideCtx, frame: Frame, box0: Box, id: number, name: string, depth: number): Item | null {
    const rels = sc.pkg.rels(level.part);
    const dm = attr(kid(gd, 'relIds'), 'r:dm');
    const dataPart = dm ? rels.get(dm) : undefined;
    let drawingPart: string | undefined;
    if (dataPart && !dataPart.external) {
        const ext = findDeep(sc.pkg.xml(dataPart.target), 'dataModelExt', 6);
        const rel = ext ? rels.get(attr(ext, 'relId') || '') : undefined;
        if (rel && !rel.external) drawingPart = rel.target;
    }
    if (!drawingPart) {
        const all = [...rels.values()].filter(r => r.type === 'diagramDrawing' && !r.external);
        if (all.length === 1) drawingPart = all[0].target;
    }
    if (!drawingPart) return null;
    const tree = kid(sc.pkg.xml(drawingPart), 'spTree');
    if (!tree) return null;
    const inner: Frame = b => frame({ ...b, x: b.x + box0.x, y: b.y + box0.y });
    const children = readShapes(tree, { part: drawingPart, tree }, sc, inner, depth + 1, true);
    if (!children.length) return null;
    // Diagram shapes all carry id 0; give them ids of their own so nothing can glue to the wrong one.
    let next = 2_000_000 + id * 1000;
    const renumber = (items: Item[]) => items.forEach(it => { it.id = next++; if (it.kind === 'group') renumber(it.children); });
    renumber(children);
    return { kind: 'group', id, name, ...bounds(children), children };
}

/**
 * SmartArt saved without a drawing (older files, other apps): only PowerPoint's layout engine
 * could place its shapes, but the data part still holds every item and its nesting, so the text
 * comes in as an outline — top-level items as paragraphs, their children as bullets — instead
 * of being lost behind an empty frame.
 */
function smartArtText(gd: El | null, level: Level, sc: SlideCtx, frame: Frame, box0: Box, id: number, name: string, r: Res): Item | null {
    const dm = attr(kid(gd, 'relIds'), 'r:dm');
    const rel = dm ? sc.pkg.rels(level.part).get(dm) : undefined;
    if (!rel || rel.external) return null;
    const model = sc.pkg.xml(rel.target);
    const pts = new Map<string, El>();
    for (const pt of kids(kid(model, 'ptLst'), 'pt')) pts.set(attr(pt, 'modelId') || '', pt);
    const childrenOf = new Map<string, { id: string; ord: number }[]>();
    for (const c of kids(kid(model, 'cxnLst'), 'cxn')) {
        if ((attr(c, 'type') || 'parOf') !== 'parOf') continue;
        const src = attr(c, 'srcId') || '', dest = attr(c, 'destId') || '';
        if (!childrenOf.has(src)) childrenOf.set(src, []);
        childrenOf.get(src)!.push({ id: dest, ord: num(c, 'srcOrd') });
    }
    const root = [...pts.values()].find(pt => attr(pt, 'type') === 'doc');
    if (!root) return null;
    const paragraphs: Paragraph[] = [];
    const seen = new Set<string>();
    const walk = (ptId: string, depth: number) => {
        if (seen.has(ptId) || depth > 16 || paragraphs.length > 500) return; // cycles, hostile nesting
        seen.add(ptId);
        for (const ch of (childrenOf.get(ptId) ?? []).sort((a, b) => a.ord - b.ord)) {
            const pt = pts.get(ch.id);
            const type = attr(pt, 'type') || 'node';
            if (!pt || (type !== 'node' && type !== 'asst')) continue;
            const body = textBodyOf(kid(pt, 't'), { levels: [sc.defaultText], bodyPr: [] }, r);
            for (const para of body?.paragraphs ?? []) {
                if (!para.runs.some(run => !run.br && run.text.trim())) continue;
                paragraphs.push({ ...para, align: 'l', level: depth, ...(depth > 0 ? { bullet: 'char' as const } : {}),
                    runs: para.runs.map(run => ({ ...run, size: run.size ?? (depth > 0 ? 16 : 18), bold: run.bold ?? (depth === 0 ? true : undefined) })) });
            }
            walk(ch.id, depth + 1);
        }
    };
    walk(attr(root, 'modelId') || '', 0);
    if (!paragraphs.length) return null;
    sc.warnings.push(`SmartArt diagram "${name}" had no saved drawing; its text was imported as a list.`);
    return { kind: 'shape', id, name, ...frame(box0), geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'none' }, line: null, textBox: true,
        text: { paragraphs, anchor: 'ctr', insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: true } };
}

/** The first descendant with this local name, searching at most `depth` levels down. */
function findDeep(el: El | null, local: string, depth: number): El | null {
    if (!el || depth < 0) return null;
    for (const k of elementKids(el)) {
        if (k.localName === local) return k;
        const f = findDeep(k, local, depth - 1);
        if (f) return f;
    }
    return null;
}

// ── Background, transition ──────────────────────────────────────────────────────────────────

function backgroundOf(cSld: El | null, r: Res): Slide['background'] | undefined {
    const bg = kid(cSld, 'bg');
    if (!bg) return undefined;
    const bgPr = kid(bg, 'bgPr');
    if (bgPr) {
        const p = fillOf(bgPr, r);
        return p;
    }
    const ref = kid(bg, 'bgRef');
    if (ref) {
        const idx = num(ref, 'idx');
        const list = idx >= 1001 ? r.ctx.theme.bgFills : r.ctx.theme.fills;
        const f = list[idx >= 1001 ? idx - 1001 : idx - 1];
        const p = f ? paintOf(f, { ...r, ctx: { ...r.ctx, phClr: colorIn(ref, r.ctx) ?? undefined } }) : undefined;
        return p ?? (colorIn(ref, r.ctx) ? { kind: 'solid', color: colorIn(ref, r.ctx)! } : undefined);
    }
    return undefined;
}

/**
 * A slide's speaker notes as plain text: the body placeholder of its notes slide, one line per
 * paragraph, `a:br` as a line break. Fields (`a:fld`, e.g. a slide number typed into the notes)
 * keep the text PowerPoint last rendered for them. Formatting and list levels are not kept.
 */
function notesOf(pkg: Pkg, slidePart: string): string | undefined {
    const notesPart = pkg.relOfType(slidePart, 'notesSlide');
    const tree = notesPart ? path(pkg.xml(notesPart), 'cSld', 'spTree') : null;
    if (!tree) return undefined;
    const lines: string[] = [];
    const visit = (parent: El) => {
        for (const el of elementKids(parent)) {
            if (el.localName === 'grpSp') { visit(el); continue; }
            if (el.localName !== 'sp') continue;
            const ph = phOf(nvPrOf(el));
            // The notes body is the `body` placeholder (or an untyped one, which defaults to obj);
            // the slide image, header, date, footer and number placeholders are not notes.
            if (!ph || (ph.type !== 'body' && ph.type !== 'obj')) continue;
            for (const p of kids(kid(el, 'txBody'), 'p')) {
                let line = '';
                for (const r of kids(p)) {
                    if (r.localName === 'r' || r.localName === 'fld') line += kid(r, 't')?.textContent ?? '';
                    else if (r.localName === 'br') line += '\n';
                }
                lines.push(line);
            }
        }
    };
    visit(tree);
    const text = lines.join('\n').replace(/\s+$/, '');
    return text.trim() ? text : undefined;
}

function transitionOf(root: El): Transition | undefined {
    const t = elementKids(root).find(k => k.localName === 'transition');
    if (!t) return undefined;
    const fx = kids(t).find(k => k.localName !== 'sndAc' && k.localName !== 'extLst');
    if (!fx) return undefined;
    const spd = attr(t, 'spd');
    const durationMs = attr(t, 'p14:dur') !== null ? num(t, 'p14:dur') : spd === 'fast' ? 500 : spd === 'slow' ? 1000 : 750;
    const dir = attr(fx, 'dir');
    switch (fx.localName) {
        case 'push': case 'cover': case 'pull': case 'wipe':
            return { kind: 'push', dir: dir === 'r' || dir === 'u' || dir === 'd' ? dir : 'l', durationMs };
        case 'zoom': return { kind: 'zoom', zoomIn: dir !== 'out', durationMs };
        case 'cut': return undefined;
        default: return { kind: 'fade', durationMs };
    }
}

// ── Entry ───────────────────────────────────────────────────────────────────────────────────

export function readPptx(bytes: Uint8Array, opts: ReadOptions = {}): ReadResult {
    const warnings: string[] = [];
    const warn = (s: string) => { if (warnings.length < 200 && !warnings.includes(s)) warnings.push(s); };
    const parseXml = opts.parseXml ?? ((s: string) => new DOMParser().parseFromString(s, 'application/xml'));

    let files: Record<string, Uint8Array>;
    let entries = 0, total = 0;
    try {
        files = unzipSync(bytes, {
            filter: (f) => {
                entries++;
                total += f.originalSize;
                return entries <= MAX_ENTRIES && f.originalSize <= MAX_PART_BYTES && total <= MAX_TOTAL_BYTES;
            },
        });
    } catch {
        throw new Error('This file is not a PowerPoint presentation (it is not a valid .pptx package).');
    }
    if (entries > MAX_ENTRIES || total > MAX_TOTAL_BYTES) warn('The file is very large; some parts were skipped.');
    const pkg = new Pkg(files, parseXml, warn);

    const presPart = pkg.relOfType('', 'officeDocument') ?? 'ppt/presentation.xml';
    const pres = pkg.xml(presPart);
    if (!pres || pres.localName !== 'presentation') throw new Error('This file is not a PowerPoint presentation (no presentation part).');
    const sz = kid(pres, 'sldSz');
    const width = sz ? Math.max(1, px(num(sz, 'cx', 9144000))) : 960;
    const height = sz ? Math.max(1, px(num(sz, 'cy', 5143500))) : 540;
    const defaultText = kid(pres, 'defaultTextStyle');
    const presRels = pkg.rels(presPart);
    const tableStylesPart = pkg.relOfType(presPart, 'tableStyles');
    const tableStyles = tableStylesPart ? pkg.xml(tableStylesPart) : null;

    const slideParts: string[] = [];
    const seen = new Set<string>();
    for (const s of kids(kid(pres, 'sldIdLst'), 'sldId')) {
        const rel = presRels.get(attr(s, 'r:id') || '');
        if (rel && !seen.has(rel.target) && slideParts.length < MAX_SLIDES) { seen.add(rel.target); slideParts.push(rel.target); }
    }

    const themeCache = new Map<string, Theme>();
    const themeFor = (masterPart: string) => {
        const tp = pkg.relOfType(masterPart, 'theme');
        if (!tp) return readTheme(null);
        if (!themeCache.has(tp)) themeCache.set(tp, readTheme(pkg.xml(tp)));
        return themeCache.get(tp)!;
    };
    const clrMapOf = (el: El | null): Record<string, string> | null => {
        if (!el) return null;
        const m: Record<string, string> = {};
        for (let i = 0; i < el.attributes.length; i++) m[el.attributes[i].localName ?? el.attributes[i].name] = el.attributes[i].value;
        return m;
    };

    const slides: Slide[] = [];
    slideParts.forEach((part, si) => {
        const root = pkg.xml(part);
        if (!root) { warn(`Slide ${si + 1} couldn't be read and was skipped.`); return; }
        const layoutPart = pkg.relOfType(part, 'slideLayout');
        const layoutRoot = layoutPart ? pkg.xml(layoutPart) : null;
        const masterPart = layoutPart ? pkg.relOfType(layoutPart, 'slideMaster') : null;
        const masterRoot = masterPart ? pkg.xml(masterPart) : null;
        const theme = masterPart ? themeFor(masterPart) : readTheme(null);
        const clrMap = clrMapOf(path(root, 'clrMapOvr', 'overrideClrMapping'))
            ?? clrMapOf(path(layoutRoot, 'clrMapOvr', 'overrideClrMapping'))
            ?? clrMapOf(kid(masterRoot, 'clrMap')) ?? DEFAULT_CLRMAP;
        const ctx: Ctx = { theme, clrMap };
        const txStyles = kid(masterRoot, 'txStyles');
        const sc: SlideCtx = {
            pkg, ctx,
            slide: { part, tree: path(root, 'cSld', 'spTree') },
            layout: layoutPart ? { part: layoutPart, tree: path(layoutRoot, 'cSld', 'spTree') } : null,
            master: masterPart ? { part: masterPart, tree: path(masterRoot, 'cSld', 'spTree') } : null,
            masterTx: { title: kid(txStyles, 'titleStyle'), body: kid(txStyles, 'bodyStyle'), other: kid(txStyles, 'otherStyle') },
            defaultText, warnings, count: 0, tableStyles,
        };
        const res = (lv: Level | null): Res => ({ pkg, part: lv?.part ?? part, ctx });
        const background = backgroundOf(kid(root, 'cSld'), res(sc.slide))
            ?? backgroundOf(kid(layoutRoot, 'cSld'), res(sc.layout))
            ?? backgroundOf(kid(masterRoot, 'cSld'), res(sc.master))
            // No <p:bg> anywhere: the slide is plain white, as PowerPoint and LibreOffice draw it.
            // Not bg1 — under a layout's inverted colour map (bg1 → dk1) that turned it black.
            ?? { kind: 'solid', color: { hex: '#ffffff' } };
        sc.background = background;
        // Master artwork under layout artwork under the slide's own — unless a level turns it off.
        const items: Item[] = [];
        const showMaster = bool(root, 'showMasterSp') !== false && bool(layoutRoot, 'showMasterSp') !== false;
        if (sc.master && showMaster) items.push(...readShapes(sc.master.tree, sc.master, sc, IDENTITY, 0, false));
        if (sc.layout && bool(root, 'showMasterSp') !== false) items.push(...readShapes(sc.layout.tree, sc.layout, sc, IDENTITY, 0, false));
        items.push(...readShapes(sc.slide.tree, sc.slide, sc, IDENTITY, 0, true));
        slides.push({ items, background, transition: transitionOf(root), name: attr(kid(root, 'cSld'), 'name') || undefined, notes: notesOf(pkg, part), key: part });
    });
    if (!slides.length) warn('The presentation has no slides.');
    const title = path(pkg.xml('docProps/core.xml'), 'title')?.textContent || undefined;
    return { deck: { width, height, slides, title }, warnings };
}
