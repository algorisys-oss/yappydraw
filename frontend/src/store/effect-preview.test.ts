/**
 * Effect dialog preview session (Distort & Transform, Scribble). The contract: previews never
 * touch undo history, Cancel restores the document exactly, OK is ONE undo step, and scrubbing a
 * slider doesn't pile up previews on top of each other.
 */
import { describe, it, expect, mock, beforeEach } from "bun:test";


mock.module("../components/toast", () => ({ showToast: () => { } }));
mock.module("sweetalert2", () => ({
    default: { fire: async () => ({ isConfirmed: false }), close: () => { } },
}));

const stubNode = (): any => ({
    style: {}, dataset: {},
    setAttribute: () => { }, getAttribute: () => null, removeAttribute: () => { },
    appendChild: (c: any) => c, removeChild: () => { }, remove: () => { },
    addEventListener: () => { }, removeEventListener: () => { },
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    querySelector: () => null, querySelectorAll: () => [],
});
global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
    setTimeout: (globalThis as any).setTimeout, clearTimeout: (globalThis as any).clearTimeout,
} as any;
global.localStorage = { getItem: () => null, setItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { ...stubNode(), setAttribute: () => { } },
    head: stubNode(), body: stubNode(),
    createElement: () => stubNode(), createElementNS: () => stubNode(), createTextNode: () => stubNode(),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => { }, removeEventListener: () => { },
} as any;


const { store, setStore, applyDistort, applyScribble, beginEffectPreview, previewEffect, endEffectPreview, undo } = await import("./app-store");

const rect = (id: string, x = 0, fill = '#3b82f6'): any => ({
    id, type: 'rectangle', x, y: 0, width: 100, height: 100, angle: 0,
    strokeColor: '#000', backgroundColor: fill, fillStyle: 'solid', strokeWidth: 1,
    strokeStyle: 'solid', roughness: 0, opacity: 100, renderStyle: 'architectural', seed: 1,
    roundness: null, locked: false, link: null, layerId: store.activeLayerId,
});
const snapshot = () => JSON.stringify(store.elements.map(e => ({ id: e.id, type: e.type, bg: e.backgroundColor, x: e.x })));

beforeEach(() => {
    setStore('elements', [rect('a'), rect('mid', 200), rect('b', 400)]);
    setStore('selection', ['a', 'b']);
});

describe('effect preview session', () => {
    it('Cancel restores the document exactly, order and selection included', () => {
        const before = snapshot();
        beginEffectPreview();
        previewEffect(() => applyDistort(['a', 'b'], 'twirl', { angle: 120 }, { preview: true }));
        expect(store.elements.some(e => e.type === 'path')).toBe(true);
        endEffectPreview();
        expect(snapshot()).toBe(before);
        expect(store.selection).toEqual(['a', 'b']);
    });

    it('repeated previews replace each other rather than stacking', () => {
        beginEffectPreview();
        for (const angle of [30, 60, 90, 120]) previewEffect(() => applyDistort(['a', 'b'], 'twirl', { angle }, { preview: true }));
        expect(store.elements.filter(e => e.type === 'path')).toHaveLength(2);
        expect(store.elements.filter(e => e.type === 'rectangle').map(e => e.id)).toEqual(['mid']);
        endEffectPreview();
    });

    it('OK is one undo step, and undo brings the originals back', () => {
        const before = snapshot();
        beginEffectPreview();
        previewEffect(() => applyDistort(['a', 'b'], 'zigzag', { size: 5, ridges: 3 }, { preview: true }));
        previewEffect(() => applyDistort(['a', 'b'], 'zigzag', { size: 8, ridges: 3 }, { preview: true }));
        endEffectPreview(() => applyDistort(['a', 'b'], 'zigzag', { size: 8, ridges: 3 }));
        expect(store.elements.filter(e => e.type === 'path')).toHaveLength(2);
        undo();
        expect(snapshot()).toBe(before);
    });

    it('Scribble Cancel brings the fill back (it used to mutate the originals in place)', () => {
        const before = snapshot();
        beginEffectPreview();
        previewEffect(() => applyScribble(['a'], { spacing: 10, preview: true }));
        expect(store.elements.find(e => e.id === 'a')!.backgroundColor).toBe('transparent');
        endEffectPreview();
        expect(snapshot()).toBe(before);
        expect(store.elements.find(e => e.id === 'a')!.backgroundColor).toBe('#3b82f6');
    });

    it('the old numeric API still distorts', () => {
        const ids = applyDistort(['a'], 'twirl', 0.25);
        expect(ids).toHaveLength(1);
        expect(store.elements.find(e => e.id === ids[0])!.type).toBe('path');
    });
});
