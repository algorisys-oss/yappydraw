/**
 * Text on Path — Pen-path extraction and the layout options (align, flip).
 *
 * The renderer is faked: every glyph's final transform is recorded, so the tests can assert
 * WHERE each character landed and which way it faces, which is the whole feature.
 */
import { describe, it, expect } from 'bun:test';
import { drawTextAlongPath, getElementTextPath, pathElementPolyline, reversePath, textPathOptionsFor } from './text-on-path';
import type { DrawingElement } from '../types';

type Glyph = { ch: string; x: number; y: number; angle: number };

/** Minimal IRenderer: tracks translate/rotate so each fillText resolves to a world position. */
const fakeRenderer = (charWidth = 10) => {
    const glyphs: Glyph[] = [];
    let tx = 0, ty = 0, rot = 0;
    const stack: [number, number, number][] = [];
    const r: any = {
        measureText: (s: string) => ({ width: [...s].length * charWidth }),
        save: () => stack.push([tx, ty, rot]),
        restore: () => { [tx, ty, rot] = stack.pop()!; },
        translate: (x: number, y: number) => { tx += x; ty += y; },
        rotate: (a: number) => { rot += a; },
        fillText: (ch: string, _x: number, _y: number) => glyphs.push({ ch, x: tx, y: ty, angle: rot }),
        textAlign: 'left', textBaseline: 'alphabetic',
    };
    return { r, glyphs };
};

const el = (over: Partial<DrawingElement>): DrawingElement => ({
    id: 'p', type: 'path', x: 0, y: 0, width: 100, height: 100, angle: 0,
    strokeColor: '#000', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1,
    strokeStyle: 'solid', roughness: 0, opacity: 100, renderStyle: 'architectural', seed: 1,
    roundness: null, locked: false, link: null, ...over,
} as DrawingElement);

describe('pathElementPolyline (Pen paths)', () => {
    it('walks a straight open path in absolute coordinates', () => {
        const p = pathElementPolyline(el({ x: 50, y: 20, pathAnchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 100, y: 0, kind: 'corner' }] }));
        expect(p).not.toBeNull();
        expect(p!.closed).toBe(false);
        expect(p!.points[0]).toEqual({ x: 50, y: 20 });
        expect(p!.points[p!.points.length - 1]).toEqual({ x: 150, y: 20 });
    });

    it('samples bezier segments through their curve, not the chord', () => {
        // An arch: both handles pull up by 80, so the midpoint sits well above y=0.
        const p = pathElementPolyline(el({ pathAnchors: [
            { x: 0, y: 100, outX: 0, outY: -80, kind: 'smooth' },
            { x: 200, y: 100, inX: 0, inY: -80, kind: 'smooth' },
        ] }))!;
        const minY = Math.min(...p.points.map(q => q.y));
        expect(minY).toBeLessThan(50);
        expect(p.points.length).toBeGreaterThan(10);
    });

    it('marks a closed subpath closed without repeating its start point', () => {
        const p = pathElementPolyline(el({ pathClosed: true, pathAnchors: [
            { x: 0, y: 0, kind: 'corner' }, { x: 100, y: 0, kind: 'corner' }, { x: 100, y: 100, kind: 'corner' },
        ] }))!;
        expect(p.closed).toBe(true);
        expect(p.points).toHaveLength(3);
    });

    it('uses only the first subpath of a compound path', () => {
        const p = pathElementPolyline(el({ pathSubpaths: [
            { closed: false, anchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 10, y: 0, kind: 'corner' }] },
            { closed: false, anchors: [{ x: 500, y: 500, kind: 'corner' }, { x: 600, y: 500, kind: 'corner' }] },
        ] }))!;
        expect(Math.max(...p.points.map(q => q.x))).toBe(10);
    });

    it('returns null for a path with fewer than two anchors', () => {
        expect(pathElementPolyline(el({ pathAnchors: [{ x: 0, y: 0, kind: 'corner' }] }))).toBeNull();
        expect(getElementTextPath(el({ pathAnchors: [] }))).toBeNull();
    });

    it('is reachable through getElementTextPath', () => {
        expect(getElementTextPath(el({ pathAnchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 1, y: 1, kind: 'corner' }] }))).not.toBeNull();
    });
});

describe('reversePath', () => {
    it('reverses an open path end to end', () => {
        expect(reversePath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], false).map(p => p.x)).toEqual([2, 1, 0]);
    });
    it('keeps a loop\'s start point and runs the other way', () => {
        expect(reversePath([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], true).map(p => p.x)).toEqual([0, 2, 1]);
    });
});

describe('drawTextAlongPath options', () => {
    const line = [{ x: 0, y: 0 }, { x: 200, y: 0 }];

    it("align 'center' puts the middle of the run at startOffset", () => {
        const { r, glyphs } = fakeRenderer(10);
        drawTextAlongPath(r, 'ABCD', line, 16, { startOffset: 0.5, align: 'center' });
        const mid = (glyphs[0].x + glyphs[3].x) / 2;
        expect(mid).toBeCloseTo(100, 5);
    });

    it("align 'start' (default) starts the first glyph at startOffset", () => {
        const { r, glyphs } = fakeRenderer(10);
        drawTextAlongPath(r, 'ABCD', line, 16, { startOffset: 0.5 });
        expect(glyphs[0].x).toBeCloseTo(105, 5);
    });

    /** A clockwise circle starting at the top (canvas y-down), like getOutlinePath gives. */
    const circle = Array.from({ length: 72 }, (_, i) => {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / 72;
        return { x: 100 * Math.cos(a), y: 100 * Math.sin(a) };
    });

    it('bottom-of-loop text reads BACKWARDS without flip (the bug flip exists for)', () => {
        const { r, glyphs } = fakeRenderer(10);
        drawTextAlongPath(r, 'ABC', circle, 16, { closed: true, startOffset: 0.5, align: 'center' });
        // Clockwise at the bottom runs right→left, so A lands to the RIGHT of C.
        expect(glyphs[0].x).toBeGreaterThan(glyphs[2].x);
    });

    it('flip makes bottom-of-loop text read left-to-right and upright', () => {
        const { r, glyphs } = fakeRenderer(10);
        drawTextAlongPath(r, 'ABC', circle, 16, { closed: true, startOffset: 0.5, align: 'center', flip: true });
        expect(glyphs[0].x).toBeLessThan(glyphs[2].x);
        expect(glyphs.every(g => Math.abs(g.y - 100) < 5)).toBe(true);   // at the bottom
        for (const g of glyphs) expect(Math.cos(g.angle)).toBeGreaterThan(0.9); // not upside-down
    });

    it('flip on an open path moves the text to the other side, still readable', () => {
        // Capture the baseline offset fillText gets, in the glyph's rotated frame.
        const offsets = (flip: boolean) => {
            const ys: number[] = []; const angles: number[] = [];
            const { r } = fakeRenderer(10);
            let rot = 0;
            r.rotate = (a: number) => { rot = a; };
            r.fillText = (_c: string, _x: number, y: number) => { ys.push(y); angles.push(rot); };
            drawTextAlongPath(r, 'AB', line, 16, { flip });
            return { ys, angles };
        };
        const normal = offsets(false), flipped = offsets(true);
        expect(normal.ys[0]).toBeLessThan(0);                 // above the line
        expect(flipped.ys[0]).toBeGreaterThan(0);             // below it
        expect(flipped.angles.every(a => Math.cos(a) > 0.99)).toBe(true); // not upside-down
    });
});

describe('textPathOptionsFor', () => {
    it('maps every curved-text prop, so renderers cannot drift apart', () => {
        const o = textPathOptionsFor(el({ textPathOffset: 0.3, textPathSpacing: 2, textPathSide: 'outside', textPathAlign: 'center', textPathFlip: true }), 20, true);
        expect(o).toEqual({ closed: true, startOffset: 0.3, letterSpacing: 2, sideOffset: 8, align: 'center', flip: true });
    });
});

describe('curvedTextColor', () => {
    it('keeps the text visible when the carrying path is hidden', async () => {
        const { curvedTextColor } = await import('./text-on-path');
        expect(curvedTextColor(el({ strokeColor: 'transparent' }))).toBe('#000000');
        expect(curvedTextColor(el({ strokeColor: 'none', textColor: 'transparent' }))).toBe('#000000');
        expect(curvedTextColor(el({ strokeColor: '#123456' }))).toBe('#123456');
        expect(curvedTextColor(el({ strokeColor: '#123456', textColor: '#abcdef' }))).toBe('#abcdef');
    });
});

describe('getOutlinePath — the outline the shape actually draws', () => {
    it('capsule: every point is one radius from the centre line (a stadium, not its bbox)', async () => {
        const { getOutlinePath } = await import('./text-on-path');
        const pts = getOutlinePath(el({ type: 'capsule', x: 0, y: 0, width: 200, height: 100 }));
        expect(pts[0]).toEqual({ x: 100, y: 0 });                        // starts top-middle
        for (const p of pts) {
            const cx = Math.max(50, Math.min(150, p.x));                  // nearest point on the spine
            // The renderer's corners are quadratics with the control at the box corner, not true
            // arcs: they bow OUTWARD, ~1.06r at mid-corner. Following them is the point.
            const d = Math.hypot(p.x - cx, p.y - 50);
            expect(d).toBeGreaterThanOrEqual(50 - 1e-9);
            expect(d).toBeLessThan(50 * 1.07);
        }
        expect(pts.some(p => p.x === 200 && p.y === 0)).toBe(false);     // no bbox corner
    });

    it('rounded rectangle follows its corners; a square one keeps the plain box', async () => {
        const { getOutlinePath } = await import('./text-on-path');
        const rounded = getOutlinePath(el({ type: 'rectangle', x: 0, y: 0, width: 200, height: 100, borderRadius: 40 }));
        expect(rounded.some(p => p.x === 200 && p.y === 0)).toBe(false);
        expect(rounded.length).toBeGreaterThan(20);
        const square = getOutlinePath(el({ type: 'rectangle', x: 0, y: 0, width: 200, height: 100 }));
        expect(square).toHaveLength(5);
    });

    it('parallelogram uses its skewed corners', async () => {
        const { getOutlinePath } = await import('./text-on-path');
        const pts = getOutlinePath(el({ type: 'parallelogram', x: 0, y: 0, width: 100, height: 50 }));
        expect(pts).toContainEqual({ x: 20, y: 0 });
        expect(pts).toContainEqual({ x: 80, y: 50 });
        expect(pts).not.toContainEqual({ x: 0, y: 0 });
        expect(pts[0]).toEqual({ x: 60, y: 0 });                         // middle of the top edge
    });
});
