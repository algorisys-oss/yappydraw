/**
 * SVG path data ⇄ DrawingML custom geometry (`a:custGeom`).
 *
 * DrawingML paths only have moveTo / lnTo / cubicBezTo / quadBezTo / arcTo / close, all in
 * absolute integer coordinates. SVG path data has relative commands, H/V shorthands, smooth
 * curves and endpoint-parameterised arcs, so everything is normalised to absolute M/L/C/Z here
 * first: quadratics are raised to cubics exactly, arcs are flattened to ≤90° cubics by the same
 * `PathUtils.arcToCubics` the rest of the app uses.
 *
 * Coordinate precision follows DeckCraft's writer (crates/pptx/src/custgeom.rs, MIT/Apache):
 * a path is written in its own `w`×`h` space, scaled up so the larger side is ≥ 100000 units,
 * because integer coordinates in a 40-unit path space would round shapes into polygons.
 */
import { PathUtils } from '../math/path-utils';
import type { CustomPath, PathCmd } from './deck';
import { esc } from './ooxml';

const TOKENS = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** Parse SVG path data into absolute M/L/C/Z commands. Malformed tails are dropped, never thrown. */
export function parseSvgPath(d: string): PathCmd[] {
    const out: PathCmd[] = [];
    const toks = String(d).match(TOKENS);
    if (!toks) return out;
    let i = 0;
    let cmd = '';
    let cx = 0, cy = 0;          // current point
    let sx = 0, sy = 0;          // subpath start
    let lcx = 0, lcy = 0;        // last control point (for S/T reflection)
    let lastOp = '';
    let open = false;            // a moveTo has been emitted for the current subpath
    const isCmd = (t: string) => /^[A-Za-z]$/.test(t);
    const num = (): number | null => {
        if (i >= toks.length || isCmd(toks[i])) return null;
        const v = parseFloat(toks[i++]);
        return Number.isFinite(v) ? v : null;
    };
    const need = (n: number): number[] | null => {
        const v: number[] = [];
        for (let k = 0; k < n; k++) { const x = num(); if (x === null) return null; v.push(x); }
        return v;
    };
    const ensureOpen = () => { if (!open) { out.push({ op: 'M', x: cx, y: cy }); open = true; sx = cx; sy = cy; } };
    const cubic = (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => {
        ensureOpen();
        out.push({ op: 'C', x1, y1, x2, y2, x, y });
        lcx = x2; lcy = y2; cx = x; cy = y;
    };
    const quad = (qx: number, qy: number, x: number, y: number) => {
        // Exact degree elevation: C1 = P0 + 2/3(Q − P0), C2 = P + 2/3(Q − P).
        cubic(cx + (2 / 3) * (qx - cx), cy + (2 / 3) * (qy - cy), x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y);
        lcx = qx; lcy = qy;
    };

    while (i < toks.length) {
        if (isCmd(toks[i])) cmd = toks[i++];
        else if (!cmd) { i++; continue; }
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();
        const bx = rel ? cx : 0, by = rel ? cy : 0;
        let ok = true;
        switch (C) {
            case 'M': {
                const v = need(2); if (!v) { ok = false; break; }
                cx = bx + v[0]; cy = by + v[1];
                out.push({ op: 'M', x: cx, y: cy }); open = true; sx = cx; sy = cy;
                cmd = rel ? 'l' : 'L'; // implicit lineTo for following pairs
                break;
            }
            case 'L': { const v = need(2); if (!v) { ok = false; break; } ensureOpen(); cx = bx + v[0]; cy = by + v[1]; out.push({ op: 'L', x: cx, y: cy }); break; }
            case 'H': { const v = need(1); if (!v) { ok = false; break; } ensureOpen(); cx = (rel ? cx : 0) + v[0]; out.push({ op: 'L', x: cx, y: cy }); break; }
            case 'V': { const v = need(1); if (!v) { ok = false; break; } ensureOpen(); cy = (rel ? cy : 0) + v[0]; out.push({ op: 'L', x: cx, y: cy }); break; }
            case 'C': { const v = need(6); if (!v) { ok = false; break; } cubic(bx + v[0], by + v[1], bx + v[2], by + v[3], bx + v[4], by + v[5]); break; }
            case 'S': {
                const v = need(4); if (!v) { ok = false; break; }
                const r = /[CS]/.test(lastOp) ? { x: 2 * cx - lcx, y: 2 * cy - lcy } : { x: cx, y: cy };
                cubic(r.x, r.y, bx + v[0], by + v[1], bx + v[2], by + v[3]);
                break;
            }
            case 'Q': { const v = need(4); if (!v) { ok = false; break; } quad(bx + v[0], by + v[1], bx + v[2], by + v[3]); break; }
            case 'T': {
                const v = need(2); if (!v) { ok = false; break; }
                const q = /[QT]/.test(lastOp) ? { x: 2 * cx - lcx, y: 2 * cy - lcy } : { x: cx, y: cy };
                quad(q.x, q.y, bx + v[0], by + v[1]);
                break;
            }
            case 'A': {
                const v = need(7); if (!v) { ok = false; break; }
                const x = bx + v[5], y = by + v[6];
                ensureOpen();
                const segs = PathUtils.arcToCubics(cx, cy, v[0], v[1], v[2], v[3] !== 0, v[4] !== 0, x, y);
                if (segs.length === 0) { out.push({ op: 'L', x, y }); cx = x; cy = y; }
                else for (const s of segs) cubic(s.c1.x, s.c1.y, s.c2.x, s.c2.y, s.end.x, s.end.y);
                break;
            }
            case 'Z': {
                if (open) out.push({ op: 'Z' });
                cx = sx; cy = sy; open = false;
                break;
            }
            default: ok = false;
        }
        lastOp = C;
        if (!ok) break;
        if (C === 'Z') cmd = ''; // a number straight after Z is malformed; skip it
    }
    return out;
}

/** Translate (and optionally scale) commands. */
export function transformCmds(cmds: PathCmd[], dx: number, dy: number, sx = 1, sy = 1): PathCmd[] {
    return cmds.map(c => c.op === 'Z' ? c
        : c.op === 'C' ? { op: 'C', x1: c.x1 * sx + dx, y1: c.y1 * sy + dy, x2: c.x2 * sx + dx, y2: c.y2 * sy + dy, x: c.x * sx + dx, y: c.y * sy + dy }
        : { op: c.op, x: c.x * sx + dx, y: c.y * sy + dy });
}

/** Apply an SVG/canvas affine matrix (a b c d e f) to every point. */
export function affineCmds(cmds: PathCmd[], m: [number, number, number, number, number, number]): PathCmd[] {
    const [a, b, c, d, e, f] = m;
    const X = (x: number, y: number) => a * x + c * y + e, Y = (x: number, y: number) => b * x + d * y + f;
    return cmds.map(k => k.op === 'Z' ? k
        : k.op === 'C' ? { op: 'C', x1: X(k.x1, k.y1), y1: Y(k.x1, k.y1), x2: X(k.x2, k.y2), y2: Y(k.x2, k.y2), x: X(k.x, k.y), y: Y(k.x, k.y) }
        : { op: k.op, x: X(k.x, k.y), y: Y(k.x, k.y) });
}

/** Bounding box of every point, control points included (a safe superset of the curve). */
export function cmdsBounds(cmds: PathCmd[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const add = (x: number, y: number) => { if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y; };
    for (const c of cmds) {
        if (c.op === 'Z') continue;
        if (c.op === 'C') { add(c.x1, c.y1); add(c.x2, c.y2); }
        add(c.x, c.y);
    }
    return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
}

const MIN_SPACE = 100000;
const MAX_COORD = 2_000_000_000;

/**
 * `a:custGeom` for paths given in the shape box's frame ((0,0)..(w,h)). The connection sites are
 * the box's four edge midpoints (top, left, bottom, right — the order PowerPoint's `rect` uses),
 * so a connector glued with `idx` 0–3 lands where it would on a rectangle.
 */
export function custGeomXml(paths: CustomPath[], w: number, h: number): string {
    const aw = Math.max(Math.abs(w), 1e-6), ah = Math.max(Math.abs(h), 1e-6);
    const k = Math.max(1, MIN_SPACE / Math.max(aw, ah));
    const pw = Math.max(1, Math.round(aw * k)), ph = Math.max(1, Math.round(ah * k));
    const n = (v: number) => {
        const r = Math.round(v * k);
        return Number.isFinite(r) ? Math.max(-MAX_COORD, Math.min(MAX_COORD, r)) : 0;
    };
    const pt = (x: number, y: number) => `<a:pt x="${n(x)}" y="${n(y)}"/>`;
    let body = '';
    for (const p of paths) {
        if (!p.cmds.some(c => c.op !== 'M' && c.op !== 'Z')) continue; // nothing drawable
        const attrs = `w="${pw}" h="${ph}"${p.fill === false ? ' fill="none"' : ''}${p.stroke === false ? ' stroke="0"' : ''}`;
        body += `<a:path ${attrs}>`;
        for (const c of p.cmds) {
            if (c.op === 'M') body += `<a:moveTo>${pt(c.x, c.y)}</a:moveTo>`;
            else if (c.op === 'L') body += `<a:lnTo>${pt(c.x, c.y)}</a:lnTo>`;
            else if (c.op === 'C') body += `<a:cubicBezTo>${pt(c.x1, c.y1)}${pt(c.x2, c.y2)}${pt(c.x, c.y)}</a:cubicBezTo>`;
            else body += '<a:close/>';
        }
        body += '</a:path>';
    }
    const site = (x: string, y: string) => `<a:cxn ang="0"><a:pos x="${x}" y="${y}"/></a:cxn>`;
    return '<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/>'
        + `<a:cxnLst>${site('hc', 't')}${site('l', 'vc')}${site('hc', 'b')}${site('r', 'vc')}</a:cxnLst>`
        + '<a:rect l="l" t="t" r="r" b="b"/>'
        + `<a:pathLst>${body}</a:pathLst></a:custGeom>`;
}

export const presetGeomXml = (prst: string, adj?: Record<string, number>): string => {
    const gd = adj ? Object.entries(adj).map(([k, v]) => `<a:gd name="${esc(k)}" fmla="val ${Math.round(v)}"/>`).join('') : '';
    return `<a:prstGeom prst="${esc(prst)}"><a:avLst>${gd}</a:avLst></a:prstGeom>`;
};
