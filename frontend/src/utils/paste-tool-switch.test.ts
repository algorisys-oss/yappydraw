/**
 * Pasting hands you an object to place — so it must leave the SELECTION tool armed.
 *
 * The bug this pins down: pasting an image (or any element) while a drawing tool was
 * active set `store.selection` but left the pen armed, which is a dead end — the
 * selection renderer only draws resize handles for the selection tool
 * (`selection-renderer.ts`), and the canvas only routes a drag to move/resize for
 * selection/lasso. You could see the pasted thing but not touch it.
 */
import { describe, it, expect, mock } from "bun:test";

mock.module("../components/toast", () => ({ showToast: () => { } }));

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => { },
    removeEventListener: () => { },
} as any;
global.localStorage = { getItem: () => null, setItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } } }
} as any;

const { store, setSelectedTool, setStore } = await import("../store/app-store");
const { selectPastedElements, pasteYappyElements, pasteAsTextElement } =
    await import("./object-context-actions");

const reset = () => {
    setStore('elements', []);
    setStore('selection', []);
};

const yappyPayload = () => ({
    elements: [{
        id: 'src-1', type: 'rectangle', x: 0, y: 0, width: 100, height: 50,
        strokeColor: '#000', backgroundColor: 'transparent', fillStyle: 'solid',
        strokeWidth: 1, strokeStyle: 'solid', roughness: 1, opacity: 100, angle: 0,
        seed: 1, roundness: null, locked: false, link: null,
    }],
});

describe("paste arms the selection tool", () => {
    it("switches away from a drawing tool so the pasted element is usable", () => {
        reset();
        setSelectedTool('inkbrush');
        selectPastedElements(['a', 'b']);

        expect(store.selectedTool).toBe('selection');
        expect(store.selection).toEqual(['a', 'b']);
    });

    it("leaves lasso alone — it is already a selection tool", () => {
        reset();
        setSelectedTool('lasso');
        selectPastedElements(['a']);

        expect(store.selectedTool).toBe('lasso');
        expect(store.selection).toEqual(['a']);
    });

    it("does nothing when the paste produced no elements", () => {
        reset();
        setSelectedTool('fineliner');
        setStore('selection', ['kept']);
        selectPastedElements([]);

        expect(store.selectedTool).toBe('fineliner');
        expect(store.selection).toEqual(['kept']);
    });

    it("pasting Yappy elements while a pen is armed switches to selection", () => {
        reset();
        setSelectedTool('fineliner');
        pasteYappyElements(yappyPayload());

        expect(store.selectedTool).toBe('selection');
        expect(store.selection.length).toBe(1);
        expect(store.elements.length).toBe(1);
    });

    it("pasting plain text while a pen is armed switches to selection", () => {
        reset();
        setSelectedTool('inkbrush');
        pasteAsTextElement('hello');

        expect(store.selectedTool).toBe('selection');
        expect(store.selection.length).toBe(1);
    });
});
