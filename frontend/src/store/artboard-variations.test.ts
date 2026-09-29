/**
 * Artboards for variations: createArtboards (custom size, N side by side), duplicateArtboard
 * with a count, and attachTextToPath's first-time centring.
 *
 * The duplicate tests are about INDEPENDENCE: a copied variation must own fresh element and
 * group ids, or selecting one variation selects the original too.
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

const { store, setStore, createArtboards, duplicateArtboard, attachTextToPath } = await import("./app-store");

const base = (id: string, over: any = {}): any => ({
    id, type: 'rectangle', x: 0, y: 0, width: 10, height: 10, angle: 0,
    strokeColor: '#000', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 1,
    strokeStyle: 'solid', roughness: 0, opacity: 100, renderStyle: 'architectural', seed: 1,
    roundness: null, locked: false, link: null, layerId: store.activeLayerId, ...over,
});

beforeEach(() => {
    setStore('artboards', []);
    setStore('elements', []);
    setStore('activeArtboardId', null);
});

describe('createArtboards', () => {
    it('creates N frames of a custom size in a row, first one selected', () => {
        const ids = createArtboards({ width: 600, height: 400, count: 3, gap: 50, name: 'Logo' });
        expect(ids).toHaveLength(3);
        const abs = store.artboards;
        expect(abs.map(a => a.x)).toEqual([0, 650, 1300]);
        expect(abs.every(a => a.width === 600 && a.height === 400 && a.y === 0)).toBe(true);
        expect(abs.map(a => a.name)).toEqual(['Logo 1', 'Logo 2', 'Logo 3']);
        expect(store.activeArtboardId).toBe(ids[0]);
    });

    it('places new frames to the right of existing ones in the same row', () => {
        createArtboards({ width: 100, height: 100 });
        createArtboards({ width: 100, height: 100, gap: 20 });
        expect(store.artboards[1].x).toBe(120);
    });

    it('honours an explicit position (the Artboard tool drag)', () => {
        createArtboards({ width: 50, height: 60, x: -300, y: 400 });
        expect(store.artboards[0]).toMatchObject({ x: -300, y: 400, width: 50, height: 60 });
    });

    it('clamps nonsense input instead of creating a broken frame', () => {
        createArtboards({ width: NaN, height: -5, count: 999 });
        expect(store.artboards.length).toBe(50);
        expect(store.artboards[0].width).toBe(1080);
        expect(store.artboards[0].height).toBe(1);
    });
});

describe('duplicateArtboard with a count', () => {
    it('makes N independent copies of the frame and its artwork', () => {
        const [ab] = createArtboards({ width: 200, height: 200, x: 0, y: 0 });
        setStore('elements', [
            base('a', { x: 20, y: 20, groupIds: ['g1'] }),
            base('b', { x: 60, y: 60, groupIds: ['g1'] }),
            base('outside', { x: 900, y: 900 }),
        ]);
        duplicateArtboard(ab, 40, 2);
        expect(store.artboards.map(a => a.x)).toEqual([0, 240, 480]);
        const copies = store.elements.filter(e => !['a', 'b', 'outside'].includes(e.id));
        expect(copies).toHaveLength(4);                    // 2 elements × 2 copies
        const groups = new Set(copies.flatMap(e => e.groupIds ?? []));
        expect(groups.has('g1')).toBe(false);              // not grouped with the original
        expect(groups.size).toBe(2);                       // one fresh group per copy
        expect(copies.map(e => e.x).sort((p, q) => p - q)).toEqual([260, 300, 500, 540]);
    });

    it('does not land on top of an earlier copy', () => {
        const [ab] = createArtboards({ width: 100, height: 100, x: 0, y: 0 });
        duplicateArtboard(ab);
        duplicateArtboard(ab);
        const xs = store.artboards.map(a => a.x);
        expect(new Set(xs).size).toBe(xs.length);
    });

    it('moves absolute bezier control points with the copy', () => {
        const [ab] = createArtboards({ width: 200, height: 200, x: 0, y: 0 });
        setStore('elements', [base('c', { type: 'line', x: 10, y: 10, width: 100, height: 0, curveType: 'bezier', controlPoints: [{ x: 50, y: 0 }] })]);
        duplicateArtboard(ab, 40, 1);
        const copy = store.elements.find(e => e.id !== 'c')!;
        expect(copy.controlPoints![0]).toEqual({ x: 290, y: 0 });
    });
});

describe('attachTextToPath', () => {
    const circle = () => base('circ', { type: 'circle', width: 200, height: 200 });

    it('centres the text at the top of a closed shape the first time', () => {
        setStore('elements', [circle()]);
        expect(attachTextToPath('circ', 'HELLO')).toBe(true);
        const e = store.elements[0];
        expect(e).toMatchObject({ curvedText: true, containerText: 'HELLO', textPathAlign: 'center', textPathOffset: 0 });
    });

    it('keeps an existing layout when re-attaching; explicit options win', () => {
        setStore('elements', [{ ...circle(), curvedText: true, textPathAlign: 'start', textPathOffset: 0.2 }]);
        attachTextToPath('circ', 'X');
        expect(store.elements[0]).toMatchObject({ textPathAlign: 'start', textPathOffset: 0.2 });
        attachTextToPath('circ', 'Y', { flip: true, offset: 0.5 });
        expect(store.elements[0]).toMatchObject({ textPathFlip: true, textPathOffset: 0.5 });
    });

    it('accepts a Pen path and centres mid-way along an open one', () => {
        setStore('elements', [base('pen', { type: 'path', pathAnchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 100, y: 0, kind: 'corner' }] })]);
        expect(attachTextToPath('pen', 'Hi')).toBe(true);
        expect(store.elements[0].textPathOffset).toBe(0.5);
    });

    it('refuses an element with no walkable path', () => {
        setStore('elements', [base('img', { type: 'image' })]);
        expect(attachTextToPath('img', 'nope')).toBe(false);
        expect(attachTextToPath('missing', 'nope')).toBe(false);
        expect(store.elements[0].curvedText).toBeUndefined();
    });
});
