/**
 * When the boolean engine fails, Pathfinder and compound shapes say so, and change nothing.
 * Before, the failure came back as an empty result and the toast blamed the shapes
 * ("those shapes overlap exactly, so everything cancels out"). polygon-clipping is forced
 * to throw on every call (so the snapped retry fails too, which no known real input does); the
 * single failure the retry fixes is covered by path-boolean-failure.test.ts.
 */
import { describe, it, expect, mock } from "bun:test";

const toasts: { msg: string; type: string }[] = [];
mock.module("../components/toast", () => ({ showToast: (msg: string, type = 'info') => { toasts.push({ msg, type }); } }));

// The real engine, by file path so the mock below doesn't intercept it.
const realPc = (await import("../../../node_modules/polygon-clipping/dist/polygon-clipping.esm.js")).default as any;
let forceFail = false;
const guard = (name: string) => (...a: any[]) => {
    if (forceFail) throw new RangeError('Maximum call stack size exceeded');
    return realPc[name](...a);
};
mock.module("polygon-clipping", () => ({
    default: { union: guard('union'), intersection: guard('intersection'), xor: guard('xor'), difference: guard('difference') },
}));

global.window = { innerWidth: 1024, innerHeight: 768, addEventListener: () => { }, removeEventListener: () => { } } as any;
global.localStorage = { getItem: () => null, setItem: () => { }, removeItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = { documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } } } } as any;

const { store, setStore, applyPathfinder, makeCompoundShape } = await import("../store/app-store");

const rect = (id: string, x: number) => ({
    id, type: 'rectangle', x, y: 0, width: 50, height: 50, angle: 0, strokeColor: '#000', backgroundColor: '#f00',
    fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100, seed: 1, layerId: store.layers[0]?.id,
}) as any;
const setup = () => { setStore('elements', [rect('a', 0), rect('b', 25)]); toasts.length = 0; };

describe("a failed boolean is reported as a failure", () => {
    it("Pathfinder: error toast, shapes untouched", () => {
        setup(); forceFail = true;
        expect(applyPathfinder(['a', 'b'], 'exclude')).toEqual([]);
        expect(store.elements.map(e => e.id)).toEqual(['a', 'b']);
        expect(toasts.at(-1)).toMatchObject({ type: 'error' });
        expect(toasts.at(-1)!.msg).toMatch(/couldn't combine/i);
        expect(toasts.at(-1)!.msg).not.toMatch(/overlap exactly/);
    });

    it("compound shape: error toast, shapes untouched", () => {
        setup(); forceFail = true;
        expect(makeCompoundShape(['a', 'b'], 'union')).toBeNull();
        expect(store.elements.map(e => e.id)).toEqual(['a', 'b']);
        expect(toasts.at(-1)!.msg).toMatch(/couldn't combine/i);
    });

    it("a legitimately empty result still explains itself as empty", () => {
        setStore('elements', [rect('a', 0), rect('b', 500)]); toasts.length = 0; forceFail = false;
        expect(applyPathfinder(['a', 'b'], 'intersect')).toEqual([]);
        expect(toasts.at(-1)!.msg).toMatch(/don't overlap/);
    });
});
