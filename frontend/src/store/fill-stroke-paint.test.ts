/**
 * Fill & Stroke — the two paint channels, and the one thing a user could not do with them.
 *
 * The report: "there is no option to remove stroke in this one like the palette with the name
 * 'Default'". Every palette but Default was a list of colours with no way to take a colour
 * AWAY, and the default palette on a wide-gamut display is P3 — so the common case was a
 * palette that could paint and never clear. Removing a stroke meant scrolling the Properties
 * panel to find the control.
 *
 * So the first test here is about the palette DATA (every palette can express "none"), and the
 * rest are about the store function the new Fill & Stroke control drives — including the two
 * places the obvious implementation goes wrong: text, whose visible colour is `textColor ||
 * strokeColor`, and Shift+X with an empty selection, which used to return early and look broken.
 *
 * Under `bun test` solid-js/store resolves to its SERVER build, where a store is a plain object
 * and direct writes land — see layer-reorder.test.ts for why that matters. These assertions read
 * back through the store, which is sound for this code because nothing here writes to a proxy
 * directly; every mutation goes through `setStore` / `updateElement`.
 */
import { describe, it, expect, beforeEach, mock } from "bun:test";

mock.module("../components/toast", () => ({ showToast: () => { } }));

const memStore: Record<string, string> = {};
global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
} as any;
global.localStorage = {
    getItem: (k: string) => (k in memStore ? memStore[k] : null),
    setItem: (k: string, v: string) => { memStore[k] = v; },
    removeItem: (k: string) => { delete memStore[k]; },
} as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } } }
} as any;

const { COLOR_PALETTES } = await import("../config/color-palettes");
const {
    store, setStore, setPaintColor, currentPaintColor, paintColorIsMixed,
    swapFillStroke, resetPaintToDefaults, toggleActivePaint, isNoPaint,
} = await import("./app-store");

const el = (id: string, extra: Record<string, unknown> = {}) => ({
    id, type: 'rectangle', x: 0, y: 0, width: 10, height: 10,
    strokeColor: '#111111', backgroundColor: '#eeeeee', fillStyle: 'solid',
    ...extra,
} as any);

const seed = (...elements: any[]) => {
    setStore('elements', elements);
    setStore('selection', elements.map(e => e.id));
};

beforeEach(() => {
    setStore('elements', []);
    setStore('selection', []);
    setStore('defaultElementStyles', {
        strokeColor: '#000000', textColor: '#000000',
        backgroundColor: 'transparent', fillStyle: 'solid',
    } as any);
    setStore('activePaint', 'fill');
});

describe("every palette can take a colour away, not only add one", () => {
    it("leads with a transparent swatch — the reported gap", () => {
        for (const p of COLOR_PALETTES) {
            const none = p.swatches.filter(s => s.value === 'transparent');
            expect({ palette: p.id, none: none.length }).toEqual({ palette: p.id, none: 1 });
        }
    });

    it("puts it first, so it is in the same place in every palette", () => {
        for (const p of COLOR_PALETTES) {
            expect({ palette: p.id, first: p.swatches[0].value }).toEqual({ palette: p.id, first: 'transparent' });
        }
    });

    it("recognises both spellings of nothing", () => {
        expect(isNoPaint('transparent')).toBe(true);
        expect(isNoPaint('none')).toBe(true);
        expect(isNoPaint(undefined)).toBe(true);
        expect(isNoPaint('')).toBe(true);
        expect(isNoPaint('#000000')).toBe(false);
    });
});

describe("setPaintColor paints the selection", () => {
    it("removes a stroke", () => {
        seed(el('a'), el('b'));
        setPaintColor('stroke', 'transparent');
        expect(store.elements.map(e => e.strokeColor)).toEqual(['transparent', 'transparent']);
    });

    it("removes a fill without throwing away how the fill was styled", () => {
        // fillStyle carries gradient/pattern/image state. Clearing the colour is "hide it for
        // now"; wiping the style too would silently discard the gradient the user built.
        seed(el('a', { fillStyle: 'linear' }));
        setPaintColor('fill', 'transparent');
        expect(store.elements[0].backgroundColor).toBe('transparent');
        expect(store.elements[0].fillStyle).toBe('linear');
    });

    it("makes a shape solid when a colour is painted into it", () => {
        // The mirror case: a colour under fillStyle 'image' would not be visible at all.
        seed(el('a', { fillStyle: 'image' }));
        setPaintColor('fill', '#e03131');
        expect(store.elements[0]).toMatchObject({ backgroundColor: '#e03131', fillStyle: 'solid' });
    });

    it("sets textColor as well as strokeColor on text, which is what it renders with", () => {
        // A text element draws in `textColor || strokeColor`, so a baked-in textColor from the
        // defaults wins and the font never changes colour.
        seed(el('t', { type: 'text', textColor: '#000000' }));
        setPaintColor('stroke', '#2f9e44');
        expect(store.elements[0]).toMatchObject({ strokeColor: '#2f9e44', textColor: '#2f9e44' });
    });

    it("arms the default too, so the NEXT shape is painted the same way", () => {
        seed(el('a'));
        setPaintColor('stroke', '#1971c2');
        expect(store.defaultElementStyles.strokeColor).toBe('#1971c2');
    });

    it("arms the default with nothing selected — that is the whole point of the swatch", () => {
        setPaintColor('fill', '#fcc419');
        expect(store.defaultElementStyles).toMatchObject({ backgroundColor: '#fcc419', fillStyle: 'solid' });
        expect(store.elements).toEqual([]);
    });
});

describe("what the swatch pair shows", () => {
    it("falls back to the armed defaults when nothing is selected", () => {
        expect(currentPaintColor('fill')).toBe('transparent');
        expect(currentPaintColor('stroke')).toBe('#000000');
    });

    it("shows the selection's colours when there is one", () => {
        seed(el('a', { backgroundColor: '#c2255c', strokeColor: '#343a40' }));
        expect(currentPaintColor('fill')).toBe('#c2255c');
        expect(currentPaintColor('stroke')).toBe('#343a40');
    });

    it("reports a text element's textColor as its stroke, matching what is on screen", () => {
        seed(el('t', { type: 'text', textColor: '#6741d9', strokeColor: '#000000' }));
        expect(currentPaintColor('stroke')).toBe('#6741d9');
    });

    it("flags a selection that disagrees rather than picking a winner silently", () => {
        seed(el('a', { strokeColor: '#111111' }), el('b', { strokeColor: '#e03131' }));
        expect(paintColorIsMixed('stroke')).toBe(true);
        expect(paintColorIsMixed('fill')).toBe(false);
        seed(el('a'));
        expect(paintColorIsMixed('stroke')).toBe(false);
    });
});

describe("swap and reset", () => {
    it("swaps fill and stroke on the selection", () => {
        seed(el('a', { backgroundColor: '#eeeeee', strokeColor: '#111111' }));
        swapFillStroke();
        expect(store.elements[0]).toMatchObject({ backgroundColor: '#111111', strokeColor: '#eeeeee' });
    });

    it("swaps the ARMED DEFAULTS when nothing is selected, instead of doing nothing", () => {
        // The old guard returned early here, so Shift+X on an empty canvas — exactly when you
        // are setting up the next shape — looked like a dead key.
        setStore('defaultElementStyles', { backgroundColor: '#e03131', strokeColor: '#1971c2', fillStyle: 'solid' } as any);
        swapFillStroke();
        expect(store.defaultElementStyles).toMatchObject({ backgroundColor: '#1971c2', strokeColor: '#e03131' });
    });

    it("resets to a black stroke and no fill", () => {
        seed(el('a', { backgroundColor: '#e03131', strokeColor: '#e03131' }));
        resetPaintToDefaults();
        expect(store.elements[0]).toMatchObject({ backgroundColor: 'transparent', strokeColor: '#000000' });
    });

    it("flips which channel the swatch pair is aimed at", () => {
        expect(store.activePaint).toBe('fill');
        toggleActivePaint();
        expect(store.activePaint).toBe('stroke');
        toggleActivePaint();
        expect(store.activePaint).toBe('fill');
    });
});
