import { describe, expect, it } from 'bun:test';
import type { DrawingElement, Turntable } from '../types';
import { applyTurntable, hasTurntable } from './turntable';

const shape = (turntable: Turntable): DrawingElement => ({
    id: 'test', type: 'path', x: 0, y: 0, width: 100, height: 100,
    angle: 0, strokeColor: '#000000', backgroundColor: '#ffffff',
    strokeWidth: 1, strokeStyle: 'solid', roughness: 0, opacity: 100,
    pathAnchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 100, y: 100, kind: 'corner' }],
    turntable,
} as DrawingElement);

describe('turntable axes and depth', () => {
    it('a horizontal quarter turn keeps x and foreshortens y', () => {
        const anchors = applyTurntable(shape({ axis: 'x', yaw: 90, depthModel: 'flat' }))![0].anchors;
        expect(anchors[0].x).toBeCloseTo(0);
        expect(anchors[1].x).toBeCloseTo(100);
        expect(anchors[0].y).toBeCloseTo(50);
        expect(anchors[1].y).toBeCloseTo(50);
    });
    it('a vertical quarter turn keeps y and foreshortens x', () => {
        const anchors = applyTurntable(shape({ axis: 'y', yaw: 90, depthModel: 'flat' }))![0].anchors;
        expect(anchors[0].x).toBeCloseTo(50);
        expect(anchors[1].x).toBeCloseTo(50);
        expect(anchors[0].y).toBeCloseTo(0);
        expect(anchors[1].y).toBeCloseTo(100);
    });
    it('supports repeated full rotations without changing the shape', () => {
        const el = shape({ axis: 'y', yaw: 720, depthModel: 'flat' });
        const anchors = applyTurntable(el)![0].anchors;
        expect(anchors[0].x).toBeCloseTo(0);
        expect(anchors[1].x).toBeCloseTo(100);
        expect(el.pathAnchors![0].x).toBe(0);
    });
    it('sorts layers by pitch-adjusted depth', () => {
        const el = shape({ axis: 'x', yaw: 180, depthModel: 'symmetry', reveal: true, axisX: 50 });
        el.pathAnchors = [{ x: 25, y: 10, kind: 'corner' }, { x: 50, y: 50, kind: 'corner' }, { x: 75, y: 90, kind: 'corner' }];
        const layers = applyTurntable(el)!;
        // At 180° pitch the original front is farther away than the revealed back.
        // Slightly off 180° gives a visible y difference identifying the order.
        el.turntable!.yaw = 170;
        const tilted = applyTurntable(el)!;
        expect(layers.length).toBe(2);
        expect(tilted[0].anchors[1].y).toBeLessThan(tilted[1].anchors[1].y);
    });
    it('ignores an unused pitch on the x-axis mode', () => {
        expect(hasTurntable(shape({ axis: 'x', yaw: 0, pitch: 30, depthModel: 'flat' }))).toBe(false);
    });
});
