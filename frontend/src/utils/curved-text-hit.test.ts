import { describe, it, expect } from 'bun:test';
import { hitTestCurvedText, isBareTypeOnPath } from './curved-text-hit';

// A Type-on-Path object tracing a 200×200 circle at (0,0), text outside at the top.
const carrier = (over: any = {}): any => ({
    id: 't', type: 'path', x: 0, y: 0, width: 200, height: 200, angle: 0,
    pathAnchors: [
        { x: 100, y: 0, kind: 'smooth', inX: -55.23, inY: 0, outX: 55.23, outY: 0 },
        { x: 200, y: 100, kind: 'smooth', inX: 0, inY: -55.23, outX: 0, outY: 55.23 },
        { x: 100, y: 200, kind: 'smooth', inX: 55.23, inY: 0, outX: -55.23, outY: 0 },
        { x: 0, y: 100, kind: 'smooth', inX: 0, inY: 55.23, outX: 0, outY: -55.23 },
    ],
    pathClosed: true, strokeColor: 'transparent', backgroundColor: 'transparent',
    curvedText: true, typeOnPath: true, containerText: 'HELLO', fontSize: 20,
    textPathAlign: 'center', textPathOffset: 0, textPathPosition: 'outside', textPathDistance: 0,
    ...over,
});

describe('hitTestCurvedText', () => {
    it('hits the letters above the top of the circle', () => {
        expect(hitTestCurvedText(carrier(), 100, -7)).toBe(true);
    });
    it('misses the middle of the circle and the far side', () => {
        expect(hitTestCurvedText(carrier(), 100, 100)).toBe(false);
        expect(hitTestCurvedText(carrier(), 100, 207)).toBe(false);
    });
    it('follows the element rotation', () => {
        // Rotated 180° about its centre: the text is now under the circle.
        const el = carrier({ angle: Math.PI });
        expect(hitTestCurvedText(el, 100, 207)).toBe(true);
        expect(hitTestCurvedText(el, 100, -7)).toBe(false);
    });
    it('moves with Distance from Path', () => {
        expect(hitTestCurvedText(carrier({ textPathDistance: 40 }), 100, -47)).toBe(true);
        expect(hitTestCurvedText(carrier({ textPathDistance: 40 }), 100, -7)).toBe(false);
    });
    it('an unpainted Type-on-Path object is only its letters; painting the path makes it a path again', () => {
        expect(isBareTypeOnPath(carrier())).toBe(true);
        expect(isBareTypeOnPath(carrier({ strokeColor: '#000' }))).toBe(false);
    });
});
