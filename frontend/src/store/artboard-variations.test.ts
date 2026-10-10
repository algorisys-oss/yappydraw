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

const { store, setStore, createArtboards, duplicateArtboard, attachTextToPath, putTextOnOutline, setCurvedText, detachTextFromShape, updateElement, undo } = await import("./app-store");
const { getElementTextPath, layoutTextAlongPath, textPathOptionsFor } = await import("../utils/text-on-path");

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
    const circle = (over: any = {}) => base('circ', { type: 'circle', width: 200, height: 200, ...over });
    const carrier = () => store.elements.find(e => e.typeOnPath)!;

    it('puts text on a closed shape as its OWN object, centred at the top (Illustrator model)', () => {
        setStore('elements', [circle({ strokeColor: '#123456' })]);
        const id = attachTextToPath('circ', 'HELLO');
        expect(typeof id).toBe('string');
        const shape = store.elements.find(e => e.id === 'circ')!;
        expect(shape.containerText).toBeUndefined();
        expect(shape.curvedText).toBe(false);
        expect(carrier()).toMatchObject({
            id, type: 'path', typeOnPath: true, curvedText: true, containerText: 'HELLO',
            textPathAlign: 'center', strokeColor: 'transparent', backgroundColor: 'transparent',
            textColor: '#123456', textPathPosition: 'outside',
        });
        expect(carrier().textPathOffset).toBeCloseTo(0, 6);   // a circle's path starts at the top too
        expect(store.elements.map(e => e.id)).toEqual(['circ', id]); // just above the shape
        expect(store.selection).toEqual([id as string]);
    });

    it('explicit options win on the new object', () => {
        setStore('elements', [circle()]);
        attachTextToPath('circ', 'Y', { flip: true, offset: 0.5, position: 'inside', distance: 7 });
        expect(carrier()).toMatchObject({ textPathFlip: true, textPathPosition: 'inside', textPathDistance: 7 });
        expect(carrier().textPathOffset).toBeCloseTo(0.5, 6);
    });

    it('accepts a Pen path (the path carries its own text) and centres mid-way along an open one', () => {
        setStore('elements', [base('pen', { type: 'path', pathAnchors: [{ x: 0, y: 0, kind: 'corner' }, { x: 100, y: 0, kind: 'corner' }] })]);
        expect(attachTextToPath('pen', 'Hi')).toBe('pen');
        expect(store.elements[0].textPathOffset).toBe(0.5);
        expect(store.elements).toHaveLength(1);
    });

    it('refuses an element with no walkable path', () => {
        setStore('elements', [base('img', { type: 'image' })]);
        expect(attachTextToPath('img', 'nope')).toBe(false);
        expect(attachTextToPath('missing', 'nope')).toBe(false);
        expect(store.elements[0].curvedText).toBeUndefined();
    });
});

describe('Detach Text from Shape keeps every glyph where it was', () => {
    const measure = () => 10;
    const glyphs = (el: any) => {
        const tp = getElementTextPath(el)!;
        return layoutTextAlongPath(measure, el.containerText, tp.points, el.fontSize || 20, textPathOptionsFor(el, el.fontSize || 20, tp.closed)).glyphs
            .map(g => ({ x: g.x - g.side * Math.sin(g.angle), y: g.y + g.side * Math.cos(g.angle) }));
    };
    const shapes: [string, any][] = [
        ['circle', {}], ['rectangle', {}], ['triangle', {}], ['hexagon', {}], ['diamond', {}],
    ];
    for (const [type, over] of shapes) for (const flip of [false, true]) for (const offset of [0, 0.3]) {
        it(`${type}${flip ? ' flipped' : ''} at offset ${offset}`, () => {
            const shape = base('s', { type, x: 50, y: 40, width: 300, height: 200, fontSize: 20, curvedText: true,
                containerText: 'BOSTON BREWING', textPathAlign: 'center', textPathOffset: offset, textPathFlip: flip, ...over });
            const before = glyphs(shape);
            setStore('elements', [shape]);
            const [id] = detachTextFromShape(['s']);
            const after = glyphs(store.elements.find(e => e.id === id));
            expect(after.length).toBe(before.length);
            // The new path is a Bézier/exact trace, the old one a sampled outline: allow a pixel or two.
            after.forEach((g, i) => { expect(Math.abs(g.x - before[i].x)).toBeLessThan(2.5); expect(Math.abs(g.y - before[i].y)).toBeLessThan(2.5); });
        });
    }
});

describe('Text on Path toggle and shape colours', () => {
    it('the toggle on a closed shape creates the object in one undo step', () => {
        setStore('elements', [base('c', { type: 'circle', width: 100, height: 100, containerText: 'LOGO' })]);
        const [id] = setCurvedText(['c'], true);
        expect(store.elements.find(e => e.id === id)?.typeOnPath).toBe(true);
        undo();
        expect(store.elements.map(e => e.id)).toEqual(['c']);
        expect(store.elements[0].containerText).toBe('LOGO');
    });

    it("changing a shape's stroke no longer recolours its text", () => {
        setStore('elements', [base('c', { type: 'circle', strokeColor: '#111111', containerText: 'Label' })]);
        updateElement('c', { strokeColor: '#ff0000' });
        expect(store.elements[0]).toMatchObject({ strokeColor: '#ff0000', textColor: '#111111' });
    });

    it('an explicit text colour is left alone, and text elements are not pinned', () => {
        setStore('elements', [
            base('c', { type: 'circle', strokeColor: '#111111', containerText: 'Label', textColor: '#00ff00' }),
            base('t', { type: 'text', strokeColor: '#111111', text: 'Hi' }),
            base('e', { type: 'circle', strokeColor: '#111111' }),
        ]);
        updateElement('c', { strokeColor: '#ff0000' });
        updateElement('t', { strokeColor: '#ff0000' });
        updateElement('e', { strokeColor: '#ff0000' });
        expect(store.elements.find(e => e.id === 'c')!.textColor).toBe('#00ff00');
        expect(store.elements.find(e => e.id === 't')!.textColor).toBeUndefined();
        expect(store.elements.find(e => e.id === 'e')!.textColor).toBeUndefined();
    });
});
