import { describe, it, expect } from 'bun:test';
import type { Drawable } from 'roughjs/bin/core';
import { RoughGenerator } from 'roughjs/bin/generator';
import { flattenDrawables, strokeTraced, EMPTY_TRACE } from './rough-stroke-trace';

const drawable = (sets: any[]): Drawable =>
    ({ shape: 'rectangle', options: {}, sets } as unknown as Drawable);

describe('flattenDrawables', () => {
    it('flattens a straight two-segment stroke and measures its length', () => {
        const d = drawable([{
            type: 'path',
            ops: [
                { op: 'move', data: [0, 0] },
                { op: 'lineTo', data: [30, 0] },
                { op: 'lineTo', data: [30, 40] },
            ],
        }]);

        const traced = flattenDrawables([d]);
        expect(traced.subpaths).toHaveLength(1);
        expect(traced.subpaths[0]).toEqual([0, 0, 30, 0, 30, 40]);
        expect(traced.total).toBeCloseTo(70, 6);
    });

    it('pairs RoughJS duplicate passes into one group, so total is the real outline length', () => {
        // Two jittered traces of the same 10-long edge — RoughJS's double stroke.
        const d = drawable([{
            type: 'path',
            ops: [
                { op: 'move', data: [0, 0] },
                { op: 'lineTo', data: [10, 0] },
                { op: 'move', data: [0, 1] },
                { op: 'lineTo', data: [10, 1] },
            ],
        }]);

        const traced = flattenDrawables([d]);
        expect(traced.subpaths).toHaveLength(2);
        expect(traced.groups).toEqual([[0, 1]]);
        expect(traced.total).toBe(10); // not 20 — the passes cover the same ground
    });

    it('keeps genuinely distinct edges in separate groups', () => {
        // Perimeter-order edges of a box: each ends where the next begins.
        const d = drawable([{
            type: 'path',
            ops: [
                { op: 'move', data: [0, 0] }, { op: 'lineTo', data: [100, 0] },
                { op: 'move', data: [100, 0] }, { op: 'lineTo', data: [100, 60] },
            ],
        }]);

        const traced = flattenDrawables([d]);
        expect(traced.groups).toEqual([[0], [1]]);
        expect(traced.total).toBe(160);
    });

    it('does not pair passes that came from different opsets', () => {
        const d = drawable([
            { type: 'path', ops: [{ op: 'move', data: [0, 0] }, { op: 'lineTo', data: [10, 0] }] },
            { type: 'path', ops: [{ op: 'move', data: [0, 1] }, { op: 'lineTo', data: [10, 1] }] },
        ]);

        const traced = flattenDrawables([d]);
        expect(traced.groups).toEqual([[0], [1]]);
        expect(traced.total).toBe(20);
    });

    it('samples bezier ops into segments that approximate the curve length', () => {
        // A cubic whose controls lie on the straight line 0,0 → 60,0 is exactly 60 long.
        const d = drawable([{
            type: 'path',
            ops: [
                { op: 'move', data: [0, 0] },
                { op: 'bcurveTo', data: [20, 0, 40, 0, 60, 0] },
            ],
        }]);

        const traced = flattenDrawables([d]);
        expect(traced.subpaths).toHaveLength(1);
        expect(traced.subpaths[0].length).toBeGreaterThan(4); // actually sampled
        expect(traced.total).toBeCloseTo(60, 4);
    });

    it('ignores fill opsets so hachure never dilutes the outline length', () => {
        const d = drawable([
            { type: 'path', ops: [{ op: 'move', data: [0, 0] }, { op: 'lineTo', data: [10, 0] }] },
            { type: 'fillSketch', ops: [{ op: 'move', data: [0, 5] }, { op: 'lineTo', data: [99, 5] }] },
            { type: 'fillPath', ops: [{ op: 'move', data: [0, 9] }, { op: 'lineTo', data: [99, 9] }] },
        ]);

        const traced = flattenDrawables([d]);
        expect(traced.subpaths).toHaveLength(1);
        expect(traced.total).toBe(10);
    });

    it('returns the empty trace for geometry it cannot use', () => {
        expect(flattenDrawables([]).total).toBe(0);
        // A lone move has no length; ops before any move are malformed and dropped.
        const d = drawable([{
            type: 'path',
            ops: [{ op: 'lineTo', data: [5, 5] }, { op: 'move', data: [0, 0] }],
        }]);
        expect(flattenDrawables([d]).total).toBe(0);
    });
});

// Mocked opsets can't tell us what RoughJS actually emits — it uses only `move`
// and `bcurveTo` (never `lineTo`), and its two passes over a closed shape start
// and end at different points around the loop. These run against the real thing.
describe('flattenDrawables on real RoughJS geometry', () => {
    const gen = new RoughGenerator({});
    const base = { seed: 1, strokeWidth: 2 };

    // Traced total should approximate the shape's true outline length — i.e. the
    // duplicate passes must be paired, not summed.
    const cases: [string, () => Drawable, number][] = [
        ['rectangle', () => gen.rectangle(0, 0, 200, 120, { ...base, roughness: 1 }), 640],
        ['rectangle at high roughness', () => gen.rectangle(0, 0, 200, 120, { ...base, roughness: 3 }), 640],
        ['ellipse', () => gen.ellipse(100, 60, 200, 120, { ...base, roughness: 1 }), 506],
        ['ellipse at high roughness', () => gen.ellipse(100, 60, 200, 120, { ...base, roughness: 3 }), 506],
        ['line', () => gen.line(0, 0, 200, 0, { ...base, roughness: 1 }), 200],
        ['polygon', () => gen.polygon([[0, 0], [100, 0], [50, 80]], { ...base, roughness: 1 }), 288],
        ['hachure-filled rectangle', () => gen.rectangle(0, 0, 200, 120, { ...base, roughness: 1, fill: '#f0f', fillStyle: 'hachure' }), 640],
    ];

    for (const [name, make, trueLength] of cases) {
        it(`traces ${name} to about its real outline length`, () => {
            const traced = flattenDrawables([make()]);
            expect(traced.total).toBeGreaterThan(0);
            // Within 15%: a wobbly stroke is genuinely a bit longer than the ideal
            // outline (~10% for an ellipse at roughness 3). The point of the bound is
            // to catch unpaired passes, which come in at nearly double.
            expect(Math.abs(traced.total - trueLength) / trueLength).toBeLessThan(0.15);
        });
    }

    it('pairs both passes of a single-stroke shape into one group', () => {
        expect(flattenDrawables([gen.line(0, 0, 200, 0, { ...base, roughness: 1 })]).groups)
            .toEqual([[0, 1]]);
        // Closed loops too, where the passes' endpoints are far apart by design.
        expect(flattenDrawables([gen.ellipse(100, 60, 200, 120, { ...base, roughness: 3 })]).groups)
            .toEqual([[0, 1]]);
    });

    it('keeps a rectangle as four sequential edges, not one blob', () => {
        const traced = flattenDrawables([gen.rectangle(0, 0, 200, 120, { ...base, roughness: 1 })]);
        expect(traced.subpaths).toHaveLength(8);
        expect(traced.groups).toEqual([[0, 1], [2, 3], [4, 5], [6, 7]]);
    });

    it('does not pair when RoughJS emits a single pass', () => {
        const traced = flattenDrawables([
            gen.rectangle(0, 0, 200, 120, { ...base, roughness: 0, disableMultiStroke: true }),
        ]);
        expect(traced.groups.every(g => g.length === 1)).toBe(true);
        expect(traced.total).toBeCloseTo(640, -2);
    });

    it('produces an identical trace for the same seed, so the reveal cannot jitter', () => {
        const opts = { ...base, roughness: 1 };
        const a = flattenDrawables([gen.rectangle(0, 0, 200, 120, opts)]);
        const b = flattenDrawables([gen.rectangle(0, 0, 200, 120, opts)]);
        expect(a.subpaths).toEqual(b.subpaths);
    });
});

describe('strokeTraced', () => {
    const mockRenderer = () => {
        const calls: string[] = [];
        const dashes: number[][] = [];
        return {
            calls,
            dashes,
            renderer: {
                setLineDash: (s: number[]) => { dashes.push(s); },
                lineDashOffset: 0,
                beginPath: () => calls.push('beginPath'),
                moveTo: () => calls.push('moveTo'),
                lineTo: () => calls.push('lineTo'),
                stroke: () => calls.push('stroke'),
            } as any,
        };
    };

    const traced = flattenDrawables([drawable([{
        type: 'path',
        ops: [{ op: 'move', data: [0, 0] }, { op: 'lineTo', data: [100, 0] }],
    }])]);

    it('dashes to the revealed fraction of the stroke', () => {
        const m = mockRenderer();
        strokeTraced(m.renderer, traced, 0.25);
        expect(m.dashes[0][0]).toBeCloseTo(25, 6);
        // Gap exceeds the subpath length so the tail cannot wrap and redraw the start.
        expect(m.dashes[0][1]).toBeGreaterThan(traced.lengths[0]);
        expect(m.calls).toContain('stroke');
    });

    it('clears the dash at full progress so the finished stroke is unbroken', () => {
        const m = mockRenderer();
        strokeTraced(m.renderer, traced, 1);
        expect(m.dashes[0]).toEqual([]);
    });

    it('draws nothing at zero progress or with an empty trace', () => {
        const zero = mockRenderer();
        strokeTraced(zero.renderer, traced, 0);
        expect(zero.calls).toHaveLength(0);

        const empty = mockRenderer();
        strokeTraced(empty.renderer, EMPTY_TRACE, 0.5);
        expect(empty.calls).toHaveLength(0);
    });

    // Two distinct 100-long edges, drawn one after the other.
    const twoEdges = flattenDrawables([drawable([{
        type: 'path',
        ops: [
            { op: 'move', data: [0, 0] }, { op: 'lineTo', data: [100, 0] },
            { op: 'move', data: [100, 0] }, { op: 'lineTo', data: [100, 100] },
        ],
    }])]);

    it('completes one edge before starting the next', () => {
        const m = mockRenderer();
        strokeTraced(m.renderer, twoEdges, 0.25); // half of edge 1, none of edge 2
        expect(m.dashes).toHaveLength(1);
        expect(m.dashes[0][0]).toBeCloseTo(50, 6);
    });

    it('holds a finished edge at full length while the next one draws', () => {
        const m = mockRenderer();
        strokeTraced(m.renderer, twoEdges, 0.75); // edge 1 done, edge 2 halfway
        expect(m.dashes).toHaveLength(2);
        expect(m.dashes[0]).toEqual([]);          // edge 1 fully revealed
        expect(m.dashes[1][0]).toBeCloseTo(50, 6);
    });

    it('advances both passes of a paired group together', () => {
        // A 100-long pass plus a jittered twin of the same edge, slightly shorter.
        const paired = flattenDrawables([drawable([{
            type: 'path',
            ops: [
                { op: 'move', data: [0, 0] }, { op: 'lineTo', data: [100, 0] },
                { op: 'move', data: [1, 2] }, { op: 'lineTo', data: [99, 1] },
            ],
        }])]);
        expect(paired.groups).toEqual([[0, 1]]);

        const m = mockRenderer();
        strokeTraced(m.renderer, paired, 0.5);
        expect(m.dashes).toHaveLength(2);
        // Each pass is halfway along its OWN length, so they finish together.
        expect(m.dashes[0][0]).toBeCloseTo(50, 6);
        expect(m.dashes[1][0]).toBeCloseTo(paired.lengths[1] / 2, 6);
        expect(m.dashes[1][0]).toBeLessThan(50);
    });
});
