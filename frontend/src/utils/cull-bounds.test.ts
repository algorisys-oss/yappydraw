import { describe, expect, test } from 'bun:test';
import { cullBounds } from './cull-bounds';

const el = (o: any) => ({ id: 'e', angle: 0, ...o }) as any;

describe('cullBounds', () => {
    test('plain shape: its own box', () => {
        expect(cullBounds(el({ type: 'rectangle', x: 10, y: 20, width: 30, height: 40 })))
            .toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });

    test('negative width/height (connector drawn right-to-left) is normalised', () => {
        expect(cullBounds(el({ type: 'arrow', x: 100, y: 100, width: -60, height: -40 })))
            .toEqual({ x: 40, y: 60, width: 60, height: 40 });
    });

    test('routed elbow: points outside the chord widen the box (flat number[])', () => {
        // chord is a 0-wide vertical segment at x=150; the route detours to x=2000
        const b = cullBounds(el({
            type: 'arrow', curveType: 'elbow', x: 150, y: 160, width: 0, height: 140,
            points: [0, 0, 1850, 0, 1850, 140, 0, 140],
        }));
        expect(b).toEqual({ x: 150, y: 160, width: 1850, height: 140 });
    });

    test('points as {x,y} objects and absolute bezier control points', () => {
        const b = cullBounds(el({
            type: 'line', x: 0, y: 0, width: 100, height: 0,
            points: [{ x: 0, y: 0 }, { x: 50, y: -80 }, { x: 100, y: 0 }],
            controlPoints: [{ x: 20, y: 300 }],
        }));
        expect(b).toEqual({ x: 0, y: -80, width: 100, height: 380 });
    });

    test('freehand strokes do not scan their points', () => {
        const b = cullBounds(el({ type: 'fineliner', x: 0, y: 0, width: 10, height: 10, points: [0, 0, 999, 999] }));
        expect(b).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    });

    test('non-finite points are ignored', () => {
        const b = cullBounds(el({ type: 'arrow', x: 0, y: 0, width: 10, height: 10, points: [0, 0, NaN, 5, 10, 10] }));
        expect(b).toEqual({ x: 0, y: 0, width: 10, height: 10 });
    });
});
