/**
 * Every shape draws inside the box it was dragged to.
 *
 * This is a gate for a whole bug class, not for one shape. The cloud (#322) drew up to 41%
 * outside its own bounds, and nothing noticed for a long time because *drawing* the shape
 * looked fine — what broke was everything that trusts `width` x `height` to be the truth.
 * The pattern, mesh and image fills rasterise a `w x h` buffer and stop dead where it runs
 * out; the selection handles draw a rectangle through the middle of the artwork. Solid fill
 * hides all of it, which is why the cloud was reported as a *fill* bug.
 *
 * Fixing the cloud alone left `lightbulb` and `magnet` sitting there with the same defect,
 * waiting to be reported one at a time as fresh mysteries. Hence a test over every shape.
 *
 * The sampler below is a numerical flattener written from the SVG spec, deliberately NOT
 * sharing code with anything in `shape-geometry.ts` — a test that reuses the implementation
 * it is checking verifies nothing. (The throwaway version of this audit skipped the arc's
 * x-axis-rotation parameter and reported the cylinder as 562% oversized. It is fine. Arc
 * flags and rotation are exactly where this kind of tool goes wrong, so they are covered by
 * their own tests below before any shape is judged.)
 */

import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getShapeGeometry } from "./shape-geometry";
import type { DrawingElement } from "../types";

// ── A numerical SVG path flattener ───────────────────────────────────────────

type Add = (x: number, y: number) => void;
const STEPS = 64;

/** Point on an elliptical arc in its own (unrotated) frame, mapped back out. */
function arcPoint(cx: number, cy: number, rx: number, ry: number, cosF: number, sinF: number, t: number): [number, number] {
    const c = Math.cos(t), s = Math.sin(t);
    return [(cosF * rx * c) - (sinF * ry * s) + cx, (sinF * rx * c) + (cosF * ry * s) + cy];
}

/**
 * Endpoint → centre parameterisation, per the SVG 1.1 implementation notes (F.6.5),
 * including the out-of-range radius correction (F.6.6) that silently scales `rx`/`ry` up
 * when the chord is longer than the ellipse can span. Both of those matter: `lightbulb`
 * asks for r=100 across a 300 chord, and `cylinder` rotates its arcs by 90°.
 */
function sampleArc(x1: number, y1: number, rx: number, ry: number, phiDeg: number, fA: number, fS: number, x2: number, y2: number, add: Add) {
    if (rx === 0 || ry === 0) { add(x2, y2); return; }
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = (phiDeg * Math.PI) / 180;
    const cosF = Math.cos(phi), sinF = Math.sin(phi);

    const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
    const x1p = (cosF * dx2) + (sinF * dy2);
    const y1p = (-sinF * dx2) + (cosF * dy2);

    const lam = ((x1p * x1p) / (rx * rx)) + ((y1p * y1p) / (ry * ry));
    if (lam > 1) { const k = Math.sqrt(lam); rx *= k; ry *= k; }

    const num = (rx * rx * ry * ry) - (rx * rx * y1p * y1p) - (ry * ry * x1p * x1p);
    const den = (rx * rx * y1p * y1p) + (ry * ry * x1p * x1p);
    const co = den === 0 ? 0 : Math.sqrt(Math.max(0, num / den)) * (fA !== fS ? 1 : -1);
    const cxp = co * ((rx * y1p) / ry);
    const cyp = co * (-(ry * x1p) / rx);
    const cx = (cosF * cxp) - (sinF * cyp) + ((x1 + x2) / 2);
    const cy = (sinF * cxp) + (cosF * cyp) + ((y1 + y2) / 2);

    const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
    const theta1 = Math.atan2(uy, ux);
    let delta = Math.atan2((ux * vy) - (uy * vx), (ux * vx) + (uy * vy));
    if (fS === 0 && delta > 0) delta -= Math.PI * 2;
    if (fS === 1 && delta < 0) delta += Math.PI * 2;

    for (let i = 0; i <= STEPS; i++) {
        const [px, py] = arcPoint(cx, cy, rx, ry, cosF, sinF, theta1 + (delta * (i / STEPS)));
        add(px, py);
    }
}

const cubic = (p: number[][], add: Add) => {
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS, u = 1 - t;
        add(
            (u * u * u * p[0][0]) + (3 * u * u * t * p[1][0]) + (3 * u * t * t * p[2][0]) + (t * t * t * p[3][0]),
            (u * u * u * p[0][1]) + (3 * u * u * t * p[1][1]) + (3 * u * t * t * p[2][1]) + (t * t * t * p[3][1]),
        );
    }
};
const quad = (p: number[][], add: Add) => {
    for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS, u = 1 - t;
        add(
            (u * u * p[0][0]) + (2 * u * t * p[1][0]) + (t * t * p[2][0]),
            (u * u * p[0][1]) + (2 * u * t * p[1][1]) + (t * t * p[2][1]),
        );
    }
};

/** Flatten an SVG path `d` into sampled points. Absolute and relative, with the smooth
 *  (`S`/`T`) reflected-control-point rule, because a shape emitting those would otherwise
 *  be measured as if its curves were flat. */
export function samplePath(d: string, add: Add) {
    const toks = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g) ?? [];
    let i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
    let lastC: [number, number] | null = null, lastQ: [number, number] | null = null;
    const n = () => parseFloat(toks[i++]);

    while (i < toks.length) {
        if (/[A-Za-z]/.test(toks[i])) cmd = toks[i++];
        if (i > toks.length) break;
        const rel = cmd === cmd.toLowerCase();
        const C = cmd.toUpperCase();
        const R = (x: number, y: number): [number, number] => (rel ? [cx + x, cy + y] : [x, y]);

        if (C === 'M') {
            const [x, y] = R(n(), n()); add(x, y); cx = x; cy = y; sx = x; sy = y;
            cmd = rel ? 'l' : 'L'; lastC = lastQ = null;
        } else if (C === 'L') {
            const [x, y] = R(n(), n()); add(x, y); cx = x; cy = y; lastC = lastQ = null;
        } else if (C === 'H') {
            const x = rel ? cx + n() : n(); add(x, cy); cx = x; lastC = lastQ = null;
        } else if (C === 'V') {
            const y = rel ? cy + n() : n(); add(cx, y); cy = y; lastC = lastQ = null;
        } else if (C === 'C') {
            const a = R(n(), n()), b = R(n(), n()), e = R(n(), n());
            cubic([[cx, cy], a, b, e], add); lastC = b; lastQ = null; cx = e[0]; cy = e[1];
        } else if (C === 'S') {
            const b = R(n(), n()), e = R(n(), n());
            const a: [number, number] = lastC ? [(2 * cx) - lastC[0], (2 * cy) - lastC[1]] : [cx, cy];
            cubic([[cx, cy], a, b, e], add); lastC = b; lastQ = null; cx = e[0]; cy = e[1];
        } else if (C === 'Q') {
            const a = R(n(), n()), e = R(n(), n());
            quad([[cx, cy], a, e], add); lastQ = a; lastC = null; cx = e[0]; cy = e[1];
        } else if (C === 'T') {
            const e = R(n(), n());
            const a: [number, number] = lastQ ? [(2 * cx) - lastQ[0], (2 * cy) - lastQ[1]] : [cx, cy];
            quad([[cx, cy], a, e], add); lastQ = a; lastC = null; cx = e[0]; cy = e[1];
        } else if (C === 'A') {
            const rx = n(), ry = n(), phi = n(), fA = n(), fS = n();
            const e = R(n(), n());
            sampleArc(cx, cy, rx, ry, phi, fA, fS, e[0], e[1], add);
            cx = e[0]; cy = e[1]; lastC = lastQ = null;
        } else if (C === 'Z') {
            add(sx, sy); cx = sx; cy = sy; lastC = lastQ = null;
        } else { i++; }
    }
}

/** Sampled extent of a ShapeGeometry, in the element's centre-local frame. */
function drawnExtent(geo: any): { minX: number; maxX: number; minY: number; maxY: number } | null {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const add: Add = (x, y) => {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
    };
    const walk = (g: any) => {
        if (!g) return;
        if (g.type === 'path') samplePath(g.path, add);
        else if (g.type === 'rect') { add(g.x, g.y); add(g.x + g.w, g.y + g.h); }
        else if (g.type === 'ellipse') {
            add(g.cx - Math.abs(g.rx), g.cy - Math.abs(g.ry));
            add(g.cx + Math.abs(g.rx), g.cy + Math.abs(g.ry));
        } else if (g.type === 'points') for (const p of g.points ?? []) add(p.x, p.y);
        else if (g.type === 'multi') for (const s of g.shapes ?? []) walk(s);
    };
    walk(geo);
    return Number.isFinite(minX) ? { minX, maxX, minY, maxY } : null;
}

// ── The sampler has to be right before it may judge anything ─────────────────

describe("the sampler itself", () => {
    const extentOf = (d: string) => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        samplePath(d, (x, y) => {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
        });
        return { minX, maxX, minY, maxY };
    };

    it("measures a plain circle drawn as two half-arcs", () => {
        const e = extentOf("M -50 0 A 50 50 0 0 1 50 0 A 50 50 0 0 1 -50 0 Z");
        expect(e.minX).toBeCloseTo(-50, 1);
        expect(e.maxX).toBeCloseTo(50, 1);
        expect(e.minY).toBeCloseTo(-50, 1);
        expect(e.maxY).toBeCloseTo(50, 1);
    });

    it("honours the arc's x-axis-rotation", () => {
        // Same ellipse, rotated 90°: the extents must swap. Ignoring this parameter is what
        // made the first version of this audit call the cylinder 562% oversized.
        const flat = extentOf("M -40 0 A 40 10 0 0 1 40 0 A 40 10 0 0 1 -40 0 Z");
        const turned = extentOf("M 0 -40 A 40 10 90 0 1 0 40 A 40 10 90 0 1 0 -40 Z");
        expect(flat.maxX - flat.minX).toBeCloseTo(80, 1);
        expect(flat.maxY - flat.minY).toBeCloseTo(20, 1);
        expect(turned.maxX - turned.minX).toBeCloseTo(20, 1);
        expect(turned.maxY - turned.minY).toBeCloseTo(80, 1);
    });

    it("scales radii up when the chord will not fit, per F.6.6", () => {
        // r=100 across a 300 chord is impossible; SVG grows it to 150, making a semicircle.
        const e = extentOf("M -150 0 A 100 100 0 1 1 150 0");
        expect(e.minY).toBeCloseTo(-150, 1);
        expect(e.maxY).toBeCloseTo(0, 1);
    });

    it("takes the side the sweep flag asks for", () => {
        const up = extentOf("M -50 0 A 50 50 0 0 1 50 0");
        const down = extentOf("M -50 0 A 50 50 0 0 0 50 0");
        expect(up.minY).toBeCloseTo(-50, 1);
        expect(up.maxY).toBeCloseTo(0, 1);
        expect(down.maxY).toBeCloseTo(50, 1);
        expect(down.minY).toBeCloseTo(0, 1);
    });

    it("takes the long way round when large-arc is set", () => {
        // Same endpoints and radius, so the two flags pick DIFFERENT circles: the minor arc
        // sits on the one centred at the origin and just clears y = -50, the major arc sits
        // on the one centred at (0,-80) and swings all the way round to y = -130. Both end
        // where they started, so only the far side tells them apart.
        const small = extentOf("M -30 -40 A 50 50 0 0 1 30 -40");
        const large = extentOf("M -30 -40 A 50 50 0 1 1 30 -40");
        expect(small.minY).toBeCloseTo(-50, 1);
        expect(large.minY).toBeCloseTo(-130, 1);
        expect(large.maxY).toBeCloseTo(-40, 1);
        expect(large.maxY - large.minY).toBeGreaterThan(small.maxY - small.minY);
    });

    it("follows curves rather than cutting the corner", () => {
        const c = extentOf("M 0 0 C 0 -100 100 -100 100 0");
        expect(c.minY).toBeLessThan(-70);   // the curve rises
        expect(c.minY).toBeGreaterThan(-80); // …but not to its control points
    });

    it("resolves the reflected control point of a smooth curve", () => {
        const explicit = extentOf("M 0 0 C 0 -60 60 -60 60 0 C 60 60 120 60 120 0");
        const smooth = extentOf("M 0 0 C 0 -60 60 -60 60 0 S 120 60 120 0");
        expect(smooth.minY).toBeCloseTo(explicit.minY, 1);
        expect(smooth.maxY).toBeCloseTo(explicit.maxY, 1);
    });

    it("reads relative commands", () => {
        expect(extentOf("M 10 10 l 40 0 l 0 40 z").maxX).toBeCloseTo(50, 1);
        expect(extentOf("M 10 10 l 40 0 l 0 40 z").maxY).toBeCloseTo(50, 1);
    });
});

// ── The audit ────────────────────────────────────────────────────────────────

/** Element types, read from the union so a newly added shape is covered without anyone
 *  remembering to list it here — which is the entire point of a gate. */
function elementTypes(): string[] {
    const src = readFileSync(path.join(import.meta.dir, "..", "types.ts"), "utf8");
    const start = src.indexOf("export type ElementType");
    const decl = src.slice(start, src.indexOf(";", start));
    return [...new Set((decl.match(/'([a-zA-Z0-9]+)'/g) ?? []).map(s => s.slice(1, -1)))];
}

/** Not shapes with a closed outline in a box: tools, connectors, freehand, and the
 *  content types whose extent is their content rather than their geometry. */
const NOT_A_BOXED_SHAPE = new Set([
    'line', 'arrow', 'bezier', 'organicBranch', 'path',
    'text', 'richtext', 'image', 'video', 'symbolInstance', 'table', 'codeBlock',
    'fineliner', 'inkbrush', 'marker', 'ink', 'eraser', 'laser', 'pan', 'selection', 'freehand',
]);

/**
 * Shapes whose geometry is outside the box ON PURPOSE, each with the reason. A shape may
 * only be here because its overflow is part of what it *is* — not because fixing it looked
 * like work. Anything added here should also be checked against the fills, since the
 * pattern/mesh/image buffer still stops at the box.
 */
const DELIBERATE: Record<string, string> = {
    // The extruded depth of a 3D solid is drawn behind and beside the front face; the box
    // describes the face, which is what you drag and what the handles should hug.
    solidBlock: '3D depth is drawn outside the front face by design',
    perspectiveBlock: '3D depth is drawn outside the front face by design',
    openBox: '3D depth is drawn outside the front face by design',
    isometricCube: '3D depth is drawn outside the front face by design',
    // The tabs are the shape. A puzzle piece whose tabs stopped at the box would not
    // interlock with the piece beside it.
    puzzlePiece: 'interlocking tabs necessarily protrude past the box',
};

describe("every shape fits the box it was dragged to", () => {
    // Square, wide, tall and a middling aspect — the cloud only misbehaved at some of these.
    const boxes: [number, number][] = [[300, 300], [600, 200], [200, 600], [420, 260]];
    const el = (type: string, width: number, height: number): DrawingElement => ({
        id: 'e1', type, x: 0, y: 0, width, height,
        strokeColor: '#000000', backgroundColor: 'transparent', fillStyle: 'solid',
        strokeWidth: 2, strokeStyle: 'solid', roughness: 0, opacity: 100, angle: 0,
        renderStyle: 'architectural',
    }) as DrawingElement;

    const types = elementTypes();

    it("found the element types to check", () => {
        // A parse failure would otherwise make this whole suite pass by checking nothing.
        expect(types.length).toBeGreaterThan(120);
        expect(types).toContain('cloud');
        expect(types).toContain('lightbulb');
    });

    const subjects = types.filter(t => !NOT_A_BOXED_SHAPE.has(t) && !(t in DELIBERATE));

    it("draws inside its own bounds, at every aspect ratio", () => {
        const offenders: string[] = [];
        for (const type of subjects) {
            for (const [w, h] of boxes) {
                let geo: any;
                try { geo = getShapeGeometry(el(type, w, h)); } catch { continue; }
                const e = drawnExtent(geo);
                if (!e) continue;
                // A pixel of slack for rounding in the emitted path.
                const over = Math.max(
                    e.maxX - (w / 2), (-w / 2) - e.minX,
                    e.maxY - (h / 2), (-h / 2) - e.minY,
                );
                if (over > 1) {
                    const pct = ((over / Math.min(w, h)) * 100).toFixed(1);
                    offenders.push(`${type} @ ${w}x${h}: ${over.toFixed(1)}px outside (${pct}% of the box)`);
                    break; // one line per shape is enough to act on
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    it("still reaches the edges — a shape shrunk to nothing also 'fits'", () => {
        // The other half of the contract. Without this, the cheapest way to pass the test
        // above would be to scale every shape down, which is not a fix.
        const lazy: string[] = [];
        for (const type of subjects) {
            let geo: any;
            try { geo = getShapeGeometry(el(type, 300, 300)); } catch { continue; }
            const e = drawnExtent(geo);
            if (!e) continue;
            const span = Math.max(e.maxX - e.minX, e.maxY - e.minY);
            if (span < 300 * 0.6) lazy.push(`${type}: spans only ${span.toFixed(0)}px of 300`);
        }
        expect(lazy).toEqual([]);
    });

    it("documents why each exempted shape is exempt", () => {
        for (const [type, why] of Object.entries(DELIBERATE)) {
            expect(types).toContain(type);
            expect(why.length).toBeGreaterThan(20);
        }
    });
});
