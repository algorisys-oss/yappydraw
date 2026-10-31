/**
 * DrawingML geometry evaluation: shape guides (`a:gd fmla="…"`) and paths, for both preset
 * shapes (`a:prstGeom`, via presets.json compiled from ECMA-376's presetShapeDefinitions.xml)
 * and custom geometry (`a:custGeom`, read from the slide). Pure — unit-tests under bun.
 *
 * The formula operators and built-in guides are ECMA-376 Part 1 §20.1.9.11/§20.1.10.56; the
 * arcTo conversion (visual angle → ellipse parameter, ≤90° cubic segments) follows DeckCraft's
 * crates/pptx/src/custgeom.rs (MIT/Apache). Guides are evaluated in EMU, as the spec defines
 * them, and the resulting paths are returned in px in the shape box's frame (0,0)..(w,h).
 */
import type { CustomPath, PathCmd } from './deck';
import { EMU_PER_PX } from './ooxml';

export type GeomPathOp = (string | number)[];
export interface GeomDef {
    av?: [string, string][];
    gd?: [string, string][];
    cxn?: [string, string, string][];
    rect?: [string, string, string, string] | null;
    paths: { w?: number; h?: number; fill?: string; stroke?: boolean; d: GeomPathOp[] }[];
}

const MAX_GUIDES = 10000;
const MAX_CMDS = 100000;
const DEG = 60000;
const toRad = (a: number) => (a / DEG) * (Math.PI / 180);

/** Evaluate every guide; `adj` overrides avLst values by name (from the shape's own avLst). */
export function evalGuides(def: GeomDef, wEmu: number, hEmu: number, adj: Record<string, string> = {}): Map<string, number> {
    const v = new Map<string, number>();
    const w = Math.max(0, wEmu), h = Math.max(0, hEmu);
    const ss = Math.min(w, h), ls = Math.max(w, h);
    const fixed: Record<string, number> = {
        w, h, l: 0, t: 0, r: w, b: h, hc: w / 2, vc: h / 2, ss, ls,
        cd2: 10800000, cd4: 5400000, cd8: 2700000, '3cd4': 16200000, '3cd8': 8100000, '5cd8': 13500000, '7cd8': 18900000,
    };
    for (const [k, n] of Object.entries(fixed)) v.set(k, n);
    // Paths and cxn/rect refer to these by name too, not just formulas, so they live in the map.
    for (const d of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32]) { v.set(`wd${d}`, w / d); v.set(`hd${d}`, h / d); v.set(`ssd${d}`, ss / d); }
    const lookup = (tok: string): number => {
        const known = v.get(tok);
        if (known !== undefined) return known;
        const m = /^(wd|hd|ssd)(\d+)$/.exec(tok);
        if (m) {
            const base = m[1] === 'wd' ? w : m[1] === 'hd' ? h : ss;
            const d = Number(m[2]);
            return d ? base / d : 0;
        }
        const n = Number(tok);
        return Number.isFinite(n) ? n : 0;
    };
    const run = (name: string, fmla: string) => {
        if (v.size > MAX_GUIDES) return;
        v.set(name, evalFormula(fmla, lookup));
    };
    for (const [name, fmla] of def.av ?? []) run(name, adj[name] ?? fmla);
    // A shape may set an adjust value the preset doesn't list (or under another name); keep it.
    for (const [name, fmla] of Object.entries(adj)) if (!v.has(name)) run(name, fmla);
    for (const [name, fmla] of def.gd ?? []) run(name, fmla);
    return v;
}

export function evalFormula(fmla: string, lookup: (tok: string) => number): number {
    const parts = String(fmla || '').trim().split(/\s+/);
    const op = parts[0];
    const [x, y, z] = parts.slice(1).map(lookup);
    let r: number;
    switch (op) {
        case 'val': r = x; break;
        case '*/': r = z ? (x * y) / z : 0; break;
        case '+-': r = x + y - z; break;
        case '+/': r = z ? (x + y) / z : 0; break;
        case '?:': r = x > 0 ? y : z; break;
        case 'abs': r = Math.abs(x); break;
        case 'at2': r = (Math.atan2(y, x) * 180 / Math.PI) * DEG; break;
        case 'cat2': r = x * Math.cos(Math.atan2(z, y)); break;
        case 'sat2': r = x * Math.sin(Math.atan2(z, y)); break;
        case 'cos': r = x * Math.cos(toRad(y)); break;
        case 'sin': r = x * Math.sin(toRad(y)); break;
        case 'tan': r = x * Math.tan(toRad(y)); break;
        case 'max': r = Math.max(x, y); break;
        case 'min': r = Math.min(x, y); break;
        case 'mod': r = Math.sqrt(x * x + y * y + z * z); break;
        case 'pin': r = y < x ? x : y > z ? z : y; break;
        case 'sqrt': r = Math.sqrt(Math.max(0, x)); break;
        default: r = 0;
    }
    return Number.isFinite(r) ? r : 0;
}

/** Ellipse parameter for a visual angle `a` (radians). */
const param = (a: number, wr: number, hr: number) => Math.atan2(wr * Math.sin(a), hr * Math.cos(a));

/** Evaluate the paths of a geometry for a w×h px box. */
export function geometryPathsPx(def: GeomDef, wPx: number, hPx: number, adj: Record<string, string> = {}): CustomPath[] {
    const W = Math.max(Math.abs(wPx), 0) * EMU_PER_PX, H = Math.max(Math.abs(hPx), 0) * EMU_PER_PX;
    const g = evalGuides(def, W, H, adj);
    const num = (t: string | number) => typeof t === 'number' ? t : (g.get(t) ?? (Number.isFinite(Number(t)) ? Number(t) : 0));
    const out: CustomPath[] = [];
    let budget = MAX_CMDS;
    for (const p of def.paths) {
        // A path with its own w/h is in that coordinate space, stretched to the shape box.
        const sx = p.w ? W / p.w : 1, sy = p.h ? H / p.h : 1;
        const X = (t: string | number) => (num(t) * sx) / EMU_PER_PX, Y = (t: string | number) => (num(t) * sy) / EMU_PER_PX;
        const cmds: PathCmd[] = [];
        let cur = { x: 0, y: 0 }, start = { x: 0, y: 0 };
        for (const c of p.d) {
            if (--budget < 0) break;
            switch (c[0]) {
                case 'M': cur = { x: X(c[1]), y: Y(c[2]) }; start = cur; cmds.push({ op: 'M', ...cur }); break;
                case 'L': cur = { x: X(c[1]), y: Y(c[2]) }; cmds.push({ op: 'L', ...cur }); break;
                case 'C': {
                    const x1 = X(c[1]), y1 = Y(c[2]), x2 = X(c[3]), y2 = Y(c[4]);
                    cur = { x: X(c[5]), y: Y(c[6]) };
                    cmds.push({ op: 'C', x1, y1, x2, y2, ...cur });
                    break;
                }
                case 'Q': {
                    const qx = X(c[1]), qy = Y(c[2]), x = X(c[3]), y = Y(c[4]);
                    cmds.push({ op: 'C', x1: cur.x + (2 / 3) * (qx - cur.x), y1: cur.y + (2 / 3) * (qy - cur.y), x2: x + (2 / 3) * (qx - x), y2: y + (2 / 3) * (qy - y), x, y });
                    cur = { x, y };
                    break;
                }
                case 'A': {
                    // Radii scale with the path space like any x/y; angles don't.
                    const wr = (num(c[1]) * sx) / EMU_PER_PX, hr = (num(c[2]) * sy) / EMU_PER_PX;
                    cur = arcTo(cmds, cur, wr, hr, num(c[3]), num(c[4]));
                    break;
                }
                case 'Z': cmds.push({ op: 'Z' }); cur = start; break;
            }
        }
        if (cmds.length) out.push({ cmds, fill: p.fill === 'none' ? false : undefined, stroke: p.stroke === false ? false : undefined });
    }
    return out;
}

function arcTo(cmds: PathCmd[], cur: { x: number; y: number }, wr: number, hr: number, st: number, sw: number) {
    if (Math.abs(wr) < 1e-9 || Math.abs(hr) < 1e-9 || sw === 0) return cur;
    const stR = toRad(st);
    const swR = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, toRad(sw)));
    const t0 = param(stR, wr, hr);
    let t1 = param(stR + swR, wr, hr);
    if (Math.abs(swR) >= 2 * Math.PI - 1e-9) t1 = t0 + Math.sign(swR) * 2 * Math.PI;
    else {
        while (swR > 0 && t1 < t0) t1 += 2 * Math.PI;
        while (swR < 0 && t1 > t0) t1 -= 2 * Math.PI;
    }
    const cx = cur.x - wr * Math.cos(t0), cy = cur.y - hr * Math.sin(t0);
    const total = t1 - t0;
    const n = Math.max(1, Math.min(16, Math.ceil(Math.abs(total) / (Math.PI / 2))));
    const step = total / n;
    const k = (4 / 3) * Math.tan(step / 4);
    let a = t0, end = cur;
    for (let i = 0; i < n; i++) {
        const b = a + step;
        const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
        end = { x: cx + wr * cb, y: cy + hr * sb };
        cmds.push({ op: 'C', x1: cx + wr * (ca - k * sa), y1: cy + hr * (sa + k * ca), x2: cx + wr * (cb + k * sb), y2: cy + hr * (sb - k * cb), ...end });
        a = b;
    }
    return end;
}

/** Connection sites in px (box frame), in cxnLst order — what `stCxn idx` refers to. */
export function connectionSitesPx(def: GeomDef, wPx: number, hPx: number, adj: Record<string, string> = {}): { x: number; y: number }[] {
    const g = evalGuides(def, Math.abs(wPx) * EMU_PER_PX, Math.abs(hPx) * EMU_PER_PX, adj);
    const num = (t: string) => g.get(t) ?? (Number.isFinite(Number(t)) ? Number(t) : 0);
    return (def.cxn ?? []).map(([, x, y]) => ({ x: num(x) / EMU_PER_PX, y: num(y) / EMU_PER_PX }));
}

/** The text rectangle in px (box frame); the whole box when the geometry names none. */
export function textRectPx(def: GeomDef, wPx: number, hPx: number, adj: Record<string, string> = {}): { l: number; t: number; r: number; b: number } {
    const W = Math.abs(wPx), H = Math.abs(hPx);
    if (!def.rect) return { l: 0, t: 0, r: W, b: H };
    const g = evalGuides(def, W * EMU_PER_PX, H * EMU_PER_PX, adj);
    const num = (t: string) => (g.get(t) ?? (Number.isFinite(Number(t)) ? Number(t) : 0)) / EMU_PER_PX;
    const [l, t, r, b] = def.rect.map(num);
    return { l, t, r, b };
}

let presetCache: Record<string, GeomDef> | null = null;
/** The ECMA preset table (lazy: 173 kB of JSON, only needed when importing). */
export async function loadPresets(): Promise<Record<string, GeomDef>> {
    presetCache ??= (await import('./presets.json')).default as unknown as Record<string, GeomDef>;
    return presetCache;
}
