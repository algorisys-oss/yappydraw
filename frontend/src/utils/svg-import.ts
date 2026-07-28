/**
 * SVG import — parse an SVG document into editable Yappy `path` elements.
 *
 * Supported: <path> (full grammar M/L/H/V/C/S/Q/T/A/Z, absolute + relative),
 * rect (incl. rx/ry), circle, ellipse, line, polyline, polygon, nested <g>,
 * transform lists (translate/scale/rotate/matrix/skewX/skewY), inherited
 * fill/stroke presentation attributes and inline style. Affine transforms are
 * flattened into the anchor geometry (exact for Béziers). Unsupported nodes
 * (<use>, <text>, gradients, filters) are skipped.
 */
import type { DrawingElement, PathAnchor } from '../types';
import { store, setStore, pushToHistory, bumpDirtyRevision } from '../store/app-store';
import { batch } from 'solid-js';
import { showToast } from '../components/toast';

type Matrix = [number, number, number, number, number, number]; // a b c d e f

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

const mul = (m: Matrix, n: Matrix): Matrix => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
];

const apply = (m: Matrix, x: number, y: number): { x: number, y: number } => ({
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
});

/** Parse an SVG transform list into a matrix. */
export function parseTransform(str: string | null): Matrix {
    if (!str) return IDENTITY;
    let m: Matrix = IDENTITY;
    const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(str))) {
        const args = match[2].split(/[\s,]+/).filter(Boolean).map(Number);
        const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = args;
        switch (match[1]) {
            case 'matrix': m = mul(m, [a, b, c, d, e, f]); break;
            case 'translate': m = mul(m, [1, 0, 0, 1, a, args.length > 1 ? b : 0]); break;
            case 'scale': m = mul(m, [a, 0, 0, args.length > 1 ? b : a, 0, 0]); break;
            case 'rotate': {
                const rad = a * Math.PI / 180;
                const cos = Math.cos(rad), sin = Math.sin(rad);
                if (args.length > 2) m = mul(m, [1, 0, 0, 1, b, c]);
                m = mul(m, [cos, sin, -sin, cos, 0, 0]);
                if (args.length > 2) m = mul(m, [1, 0, 0, 1, -b, -c]);
                break;
            }
            case 'skewX': m = mul(m, [1, 0, Math.tan(a * Math.PI / 180), 1, 0, 0]); break;
            case 'skewY': m = mul(m, [1, Math.tan(a * Math.PI / 180), 0, 1, 0, 0]); break;
        }
    }
    return m;
}

// ─── Path data parsing (cubic-only subpaths) ────────────────

interface Sub { anchors: PathAnchor[]; closed: boolean }

/** Convert quadratic control point to cubic pair. */
const q2c = (px: number, py: number, qx: number, qy: number, x: number, y: number) => ({
    c1x: px + (2 / 3) * (qx - px), c1y: py + (2 / 3) * (qy - py),
    c2x: x + (2 / 3) * (qx - x), c2y: y + (2 / 3) * (qy - y),
});

/** Elliptical arc → cubic segments (endpoint parameterization, SVG spec B.2.4). */
function arcToCubics(x1: number, y1: number, rx: number, ry: number, phiDeg: number,
    largeArc: number, sweep: number, x2: number, y2: number): { c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number }[] {
    if (rx === 0 || ry === 0) return [{ c1x: x1, c1y: y1, c2x: x2, c2y: y2, x: x2, y: y2 }];
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = phiDeg * Math.PI / 180;
    const cosP = Math.cos(phi), sinP = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const x1p = cosP * dx + sinP * dy;
    const y1p = -sinP * dx + cosP * dy;
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; }
    const sign = largeArc !== sweep ? 1 : -1;
    const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const coef = sign * Math.sqrt(Math.max(0, num / den));
    const cxp = coef * (rx * y1p) / ry;
    const cyp = coef * -(ry * x1p) / rx;
    const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
    const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;
    const angle = (ux: number, uy: number, vx: number, vy: number) => {
        const dot = ux * vx + uy * vy;
        const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
        let ang = Math.acos(Math.min(1, Math.max(-1, dot / len)));
        if (ux * vy - uy * vx < 0) ang = -ang;
        return ang;
    };
    const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dTheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
    if (sweep && dTheta < 0) dTheta += 2 * Math.PI;

    const segs = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)));
    const delta = dTheta / segs;
    const t = 4 / 3 * Math.tan(delta / 4);
    const out: { c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number }[] = [];
    let theta = theta1;
    for (let i = 0; i < segs; i++) {
        const cos1 = Math.cos(theta), sin1 = Math.sin(theta);
        const theta2 = theta + delta;
        const cos2 = Math.cos(theta2), sin2 = Math.sin(theta2);
        const toWorld = (px: number, py: number) => ({
            x: cosP * rx * px - sinP * ry * py + cx,
            y: sinP * rx * px + cosP * ry * py + cy,
        });
        const p1 = toWorld(cos1, sin1);
        const p2 = toWorld(cos2, sin2);
        const d1 = toWorld(cos1 - t * sin1, sin1 + t * cos1);
        const d2 = toWorld(cos2 + t * sin2, sin2 - t * cos2);
        void p1;
        out.push({ c1x: d1.x, c1y: d1.y, c2x: d2.x, c2y: d2.y, x: p2.x, y: p2.y });
        theta = theta2;
    }
    return out;
}

/**
 * Parse a full SVG path `d` string into cubic-only subpaths with PathAnchor
 * handles (in/out offsets relative to their anchor).
 */
export function parseSvgPathData(d: string): Sub[] {
    const tokens = d.match(/[a-df-zA-DF-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g);
    if (!tokens) return [];

    const subs: Sub[] = [];
    let anchors: PathAnchor[] = [];
    let closed = false;
    let cx = 0, cy = 0;          // current point
    let sx = 0, sy = 0;          // subpath start
    // Reflection points for S/T; assigned inside closures, so keep TS from
    // narrowing them by reading through these helpers.
    let prevC2: { x: number, y: number } | null = null;
    let prevQ: { x: number, y: number } | null = null;
    const getPrevC2 = (): { x: number, y: number } | null => prevC2;
    const getPrevQ = (): { x: number, y: number } | null => prevQ;
    let i = 0;
    let cmd = '';

    const num = () => parseFloat(tokens[i++]);
    const flush = () => {
        if (anchors.length >= 2) subs.push({ anchors, closed });
        anchors = []; closed = false;
    };
    const lineTo = (x: number, y: number) => {
        anchors.push({ x, y, kind: 'corner' });
        cx = x; cy = y; prevC2 = null; prevQ = null;
    };
    const curveTo = (c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) => {
        const from = anchors[anchors.length - 1];
        if (from) { from.outX = c1x - from.x; from.outY = c1y - from.y; }
        anchors.push({ x, y, inX: c2x - x, inY: c2y - y, kind: 'smooth' });
        cx = x; cy = y; prevC2 = { x: c2x, y: c2y }; prevQ = null;
    };

    while (i < tokens.length) {
        const t = tokens[i];
        if (/[a-zA-Z]/.test(t)) { cmd = t; i++; }
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();

        switch (C) {
            case 'M': {
                const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
                flush();
                anchors.push({ x, y, kind: 'corner' });
                cx = x; cy = y; sx = x; sy = y; prevC2 = null; prevQ = null;
                cmd = rel ? 'l' : 'L'; // subsequent pairs are implicit linetos
                break;
            }
            case 'L': lineTo(num() + (rel ? cx : 0), num() + (rel ? cy : 0)); break;
            case 'H': lineTo(num() + (rel ? cx : 0), cy); break;
            case 'V': lineTo(cx, num() + (rel ? cy : 0)); break;
            case 'C': {
                const c1x = num() + (rel ? cx : 0), c1y = num() + (rel ? cy : 0);
                const c2x = num() + (rel ? cx : 0), c2y = num() + (rel ? cy : 0);
                const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
                curveTo(c1x, c1y, c2x, c2y, x, y);
                break;
            }
            case 'S': {
                const pc = getPrevC2();
                const c1x = pc ? 2 * cx - pc.x : cx;
                const c1y = pc ? 2 * cy - pc.y : cy;
                const c2x = num() + (rel ? cx : 0), c2y = num() + (rel ? cy : 0);
                const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
                curveTo(c1x, c1y, c2x, c2y, x, y);
                break;
            }
            case 'Q': {
                const qx = num() + (rel ? cx : 0), qy = num() + (rel ? cy : 0);
                const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
                const c = q2c(cx, cy, qx, qy, x, y);
                curveTo(c.c1x, c.c1y, c.c2x, c.c2y, x, y);
                prevQ = { x: qx, y: qy };
                break;
            }
            case 'T': {
                const pq = getPrevQ();
                const qx = pq ? 2 * cx - pq.x : cx;
                const qy = pq ? 2 * cy - pq.y : cy;
                const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
                const c = q2c(cx, cy, qx, qy, x, y);
                curveTo(c.c1x, c.c1y, c.c2x, c.c2y, x, y);
                prevQ = { x: qx, y: qy };
                break;
            }
            case 'A': {
                const rx = num(), ry = num(), rot = num();
                const laf = num(), swf = num();
                const x = num() + (rel ? cx : 0), y = num() + (rel ? cy : 0);
                for (const seg of arcToCubics(cx, cy, rx, ry, rot, laf ? 1 : 0, swf ? 1 : 0, x, y)) {
                    curveTo(seg.c1x, seg.c1y, seg.c2x, seg.c2y, seg.x, seg.y);
                }
                break;
            }
            case 'Z': {
                closed = true;
                flush();
                cx = sx; cy = sy;
                break;
            }
            default:
                // Unknown token — bail out of this path to avoid an infinite loop
                i++;
        }
    }
    flush();
    return subs;
}

// ─── Shape → path data ──────────────────────────────────────

const KAPPA = 0.5522847498307936;

function ellipseSubs(cx: number, cy: number, rx: number, ry: number): Sub[] {
    const k = KAPPA;
    const anchors: PathAnchor[] = [
        { x: cx + rx, y: cy, inX: 0, inY: ry * k, outX: 0, outY: -ry * k, kind: 'smooth' },
        { x: cx, y: cy - ry, inX: rx * k, inY: 0, outX: -rx * k, outY: 0, kind: 'smooth' },
        { x: cx - rx, y: cy, inX: 0, inY: -ry * k, outX: 0, outY: ry * k, kind: 'smooth' },
        { x: cx, y: cy + ry, inX: -rx * k, inY: 0, outX: rx * k, outY: 0, kind: 'smooth' },
    ];
    return [{ anchors, closed: true }];
}

function nodeToSubs(node: Element): Sub[] {
    const attr = (n: string) => parseFloat(node.getAttribute(n) || '0') || 0;
    switch (node.tagName.toLowerCase()) {
        case 'path': {
            const d = node.getAttribute('d');
            return d ? parseSvgPathData(d) : [];
        }
        case 'rect': {
            const x = attr('x'), y = attr('y'), w = attr('width'), h = attr('height');
            if (w <= 0 || h <= 0) return [];
            let rx = node.hasAttribute('rx') ? attr('rx') : (node.hasAttribute('ry') ? attr('ry') : 0);
            rx = Math.min(rx, w / 2, h / 2);
            if (rx > 0.01) {
                return parseSvgPathData(
                    `M ${x + rx} ${y} H ${x + w - rx} A ${rx} ${rx} 0 0 1 ${x + w} ${y + rx} V ${y + h - rx} ` +
                    `A ${rx} ${rx} 0 0 1 ${x + w - rx} ${y + h} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x} ${y + h - rx} ` +
                    `V ${y + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`);
            }
            return [{
                anchors: [
                    { x, y, kind: 'corner' }, { x: x + w, y, kind: 'corner' },
                    { x: x + w, y: y + h, kind: 'corner' }, { x, y: y + h, kind: 'corner' },
                ], closed: true,
            }];
        }
        case 'circle': return ellipseSubs(attr('cx'), attr('cy'), attr('r'), attr('r'));
        case 'ellipse': return ellipseSubs(attr('cx'), attr('cy'), attr('rx'), attr('ry'));
        case 'line': return [{
            anchors: [{ x: attr('x1'), y: attr('y1'), kind: 'corner' }, { x: attr('x2'), y: attr('y2'), kind: 'corner' }],
            closed: false,
        }];
        case 'polygon':
        case 'polyline': {
            const pts = (node.getAttribute('points') || '').split(/[\s,]+/).filter(Boolean).map(Number);
            const anchors: PathAnchor[] = [];
            for (let j = 0; j + 1 < pts.length; j += 2) anchors.push({ x: pts[j], y: pts[j + 1], kind: 'corner' });
            if (anchors.length < 2) return [];
            return [{ anchors, closed: node.tagName.toLowerCase() === 'polygon' }];
        }
        default: return [];
    }
}

// ─── Style resolution ───────────────────────────────────────

interface SvgStyle { fill: string; stroke: string; strokeWidth: number; opacity: number }

function styleOf(node: Element, parent: SvgStyle): SvgStyle {
    const out = { ...parent };
    const styleAttr = node.getAttribute('style') || '';
    const styleMap = new Map<string, string>();
    for (const decl of styleAttr.split(';')) {
        const [k, v] = decl.split(':').map(s => s?.trim());
        if (k && v) styleMap.set(k, v);
    }
    const get = (name: string) => styleMap.get(name) ?? node.getAttribute(name) ?? undefined;

    const fill = get('fill');
    if (fill !== undefined) out.fill = fill;
    const stroke = get('stroke');
    if (stroke !== undefined) out.stroke = stroke;
    const sw = get('stroke-width');
    if (sw !== undefined) out.strokeWidth = parseFloat(sw) || 0;
    const op = get('opacity');
    if (op !== undefined) out.opacity = out.opacity * (parseFloat(op) || 1);
    return out;
}

// ─── Import ─────────────────────────────────────────────────

/**
 * Never drawn where they sit. `defs` and `symbol` hold *templates* — their content is
 * rendered only when a `<use>` points at it (see `resolveUse`), otherwise every glyph in
 * a sprite sheet would be dumped at the origin.
 */
const SKIP_TAGS = new Set(['defs', 'symbol', 'clippath', 'mask', 'marker', 'pattern', 'lineargradient', 'radialgradient', 'style', 'metadata', 'title', 'desc', 'text', 'image', 'filter', 'script', 'foreignobject']);

interface Drawable { subs: Sub[]; style: SvgStyle; strokeScale: number; role?: string; part?: string; texPart?: string }

/** Depth cap for `<use>` chains — a self- or mutually-referencing `<use>` would otherwise spin forever. */
const MAX_USE_DEPTH = 12;

interface CollectCtx {
    /** id → element, for resolving `<use href="#id">`. Built once per document. */
    ids: Map<string, Element>;
    /** `<use>` nesting depth, for the cycle guard. */
    depth: number;
    /** Ids currently being expanded, so `<use>` → its own ancestor is caught immediately. */
    expanding: Set<string>;
}

/** `<use href="#x">` / legacy `xlink:href`. Returns the referenced element, if any. */
function useTarget(node: Element, ctx: CollectCtx): { id: string; el: Element } | null {
    const raw = node.getAttribute('href') ?? node.getAttribute('xlink:href')
        ?? node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (!raw) return null;
    const ref = raw.trim();
    if (!ref.startsWith('#')) return null;      // external refs aren't fetched
    const id = ref.slice(1);
    const el = ctx.ids.get(id);
    return el ? { id, el } : null;
}

function collectDrawables(node: Element, matrix: Matrix, style: SvgStyle, out: Drawable[], ctx: CollectCtx, role?: string, part?: string, texPart?: string): void {
    const tag = node.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;
    if (node.getAttribute('display') === 'none') return;

    const m = mul(matrix, parseTransform(node.getAttribute('transform')));
    const s = styleOf(node, style);
    // Semantic part role (used by the stick-figure library for per-part recolour);
    // inherits down the tree so a `<g data-sf-role>` tags all its children.
    const r = node.getAttribute('data-sf-role') ?? role;
    // Finer-grained tag (e.g. which body parts are legs) — inherits the same way.
    const pt = node.getAttribute('data-sf-part') ?? part;
    // Which equation symbol this belongs to (stamped by `Yappy.tex`); inherits the same way.
    const tp = node.getAttribute('data-tex-part') ?? texPart;

    // `<use>`: splice the referenced subtree in here, offset by the use's x/y.
    if (tag === 'use') {
        if (ctx.depth >= MAX_USE_DEPTH) return;
        const target = useTarget(node, ctx);
        if (!target || ctx.expanding.has(target.id)) return;   // missing or cyclic
        const ux = parseFloat(node.getAttribute('x') ?? '0') || 0;
        const uy = parseFloat(node.getAttribute('y') ?? '0') || 0;
        const um = mul(m, [1, 0, 0, 1, ux, uy] as Matrix);
        ctx.expanding.add(target.id);
        ctx.depth++;
        // A `<symbol>`/`<svg>` target acts as a group; anything else renders directly.
        // Either way its own SKIP_TAGS status is bypassed — being referenced is the
        // whole point — so descend into its children rather than calling on itself.
        const targetTag = target.el.tagName.toLowerCase();
        if (targetTag === 'symbol' || targetTag === 'svg') {
            const tm = mul(um, parseTransform(target.el.getAttribute('transform')));
            const ts = styleOf(target.el, s);
            for (const child of Array.from(target.el.children)) {
                collectDrawables(child, tm, ts, out, ctx, r, pt, tp);
            }
        } else {
            collectDrawables(target.el, um, s, out, ctx, r, pt, tp);
        }
        ctx.depth--;
        ctx.expanding.delete(target.id);
        return;
    }

    const subs = nodeToSubs(node);
    if (subs.length > 0) {
        // Flatten the transform into anchor geometry (handles transform as points)
        const txSubs = subs.map(sp => ({
            closed: sp.closed,
            anchors: sp.anchors.map(a => {
                const p = apply(m, a.x, a.y);
                const na: PathAnchor = { x: p.x, y: p.y, kind: a.kind };
                if (a.inX !== undefined || a.inY !== undefined) {
                    const h = apply(m, a.x + (a.inX ?? 0), a.y + (a.inY ?? 0));
                    na.inX = h.x - p.x; na.inY = h.y - p.y;
                }
                if (a.outX !== undefined || a.outY !== undefined) {
                    const h = apply(m, a.x + (a.outX ?? 0), a.y + (a.outY ?? 0));
                    na.outX = h.x - p.x; na.outY = h.y - p.y;
                }
                return na;
            }),
        }));
        const strokeScale = Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
        out.push({ subs: txSubs, style: s, strokeScale, role: r, part: pt, texPart: tp });
    }

    for (const child of Array.from(node.children)) {
        collectDrawables(child, m, s, out, ctx, r, pt, tp);
    }
}

const normColor = (c: string | undefined, fallback: string): string => {
    if (!c) return fallback;
    const v = c.trim();
    if (v === 'none') return 'transparent';
    if (v === 'currentColor') return '#000000';
    if (v.startsWith('url(')) return fallback; // gradients/patterns unsupported
    return v;
};

export interface SvgImportOptions {
    /** World position of the imported group's top-left (defaults to active page/viewport center) */
    x?: number;
    y?: number;
    /** Scale the whole import so its width equals this (keeps aspect) */
    targetWidth?: number;
    /** Extra element props applied to every imported path (e.g. strokeColor override) */
    overrides?: Partial<DrawingElement>;
}

let _importCounter = 0;

/** Parse SVG text into ready-to-insert Yappy path elements (no store side effects). */
export function svgToElements(svgText: string, opts: SvgImportOptions = {}): DrawingElement[] {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.nodeName === 'parsererror' || doc.querySelector('parsererror')) return [];

    const drawables: Drawable[] = [];
    const rootStyle: SvgStyle = { fill: '#000000', stroke: 'none', strokeWidth: 1, opacity: 1 };
    // Index every id in the document — including inside <defs>/<symbol>, which is where
    // <use> targets almost always live (MathJax and icon sprites are built this way).
    const ids = new Map<string, Element>();
    for (const el of Array.from(doc.querySelectorAll('[id]'))) {
        const id = el.getAttribute('id');
        if (id && !ids.has(id)) ids.set(id, el);
    }
    collectDrawables(root, IDENTITY, styleOf(root, rootStyle), drawables, { ids, depth: 0, expanding: new Set() });
    if (drawables.length === 0) return [];

    // Global bbox across all drawables
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const d of drawables) for (const sp of d.subs) for (const a of sp.anchors) {
        minX = Math.min(minX, a.x); minY = Math.min(minY, a.y);
        maxX = Math.max(maxX, a.x); maxY = Math.max(maxY, a.y);
    }
    const natW = Math.max(1, maxX - minX), natH = Math.max(1, maxY - minY);
    const scale = opts.targetWidth ? opts.targetWidth / natW : (natW > 800 ? 800 / natW : 1);

    // Default insert position: centered on the active page (or viewport origin)
    let ox = opts.x, oy = opts.y;
    if (ox === undefined || oy === undefined) {
        const page = store.slides[store.activeSlideIndex];
        if (page) {
            ox = ox ?? page.spatialPosition.x + (page.dimensions.width - natW * scale) / 2;
            oy = oy ?? page.spatialPosition.y + (page.dimensions.height - natH * scale) / 2;
        } else {
            ox = ox ?? 100; oy = oy ?? 100;
        }
    }

    const elements: DrawingElement[] = [];
    for (const d of drawables) {
        // Per-drawable bbox (post scale/offset)
        let eMinX = Infinity, eMinY = Infinity, eMaxX = -Infinity, eMaxY = -Infinity;
        const mapped = d.subs.map(sp => ({
            closed: sp.closed,
            anchors: sp.anchors.map(a => {
                const x = (a.x - minX) * scale + ox!;
                const y = (a.y - minY) * scale + oy!;
                eMinX = Math.min(eMinX, x); eMinY = Math.min(eMinY, y);
                eMaxX = Math.max(eMaxX, x); eMaxY = Math.max(eMaxY, y);
                const na: PathAnchor = { x, y, kind: a.kind };
                if (a.inX !== undefined) { na.inX = a.inX * scale; na.inY = (a.inY ?? 0) * scale; }
                if (a.outX !== undefined) { na.outX = a.outX * scale; na.outY = (a.outY ?? 0) * scale; }
                return na;
            }),
        }));
        // Make anchors relative to the element origin
        const rel = mapped.map(sp => ({
            closed: sp.closed,
            anchors: sp.anchors.map(a => ({ ...a, x: a.x - eMinX, y: a.y - eMinY })),
        }));

        const fill = normColor(d.style.fill, '#000000');
        const stroke = normColor(d.style.stroke === 'none' ? undefined : d.style.stroke, 'transparent');
        const single = rel.length === 1;

        elements.push({
            id: `path-${Date.now()}-${++_importCounter}`,
            type: 'path',
            x: eMinX, y: eMinY,
            width: Math.max(1, eMaxX - eMinX), height: Math.max(1, eMaxY - eMinY),
            pathAnchors: single ? rel[0].anchors : undefined,
            pathClosed: single ? rel[0].closed : undefined,
            pathSubpaths: single ? undefined : rel,
            backgroundColor: fill,
            fillStyle: 'solid',
            strokeColor: stroke,
            strokeWidth: stroke === 'transparent' ? 0 : Math.max(0.5, d.style.strokeWidth * d.strokeScale * scale),
            strokeStyle: 'solid',
            opacity: Math.round(d.style.opacity * 100),
            angle: 0,
            roughness: 0,
            renderStyle: 'architectural',
            locked: false,
            link: null,
            layerId: store.activeLayerId || 'default-layer',
            seed: Math.floor(Math.random() * 2 ** 31),
            roundness: null,
            ...(d.role ? { sfRole: d.role } : {}),
            ...(d.part ? { sfPart: d.part } : {}),
            ...(d.texPart ? { texPart: d.texPart } : {}),
            ...(opts.overrides || {}),
        } as DrawingElement);
    }
    return elements;
}

/** Import SVG text onto the canvas: parse, insert, select. Returns new element ids. */
export function importSvgToCanvas(svgText: string, opts: SvgImportOptions = {}): string[] {
    const elements = svgToElements(svgText, opts);
    if (elements.length === 0) {
        showToast('No importable vector shapes found in SVG', 'info');
        return [];
    }
    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev, ...elements]);
        setStore('selection', elements.map(e => e.id));
    });
    bumpDirtyRevision();
    showToast(`Imported ${elements.length} vector shape${elements.length === 1 ? '' : 's'}`, 'success');
    return elements.map(e => e.id);
}
