/**
 * Regression: the rubber-band marquee and the lasso must only ever select things the
 * user can actually see and touch.
 *
 * Both area-selects used to sweep `store.elements` with NO gate at all, while the
 * narrow-phase (click) hit test correctly consulted `canInteractWithElement` +
 * `isLayerVisible`. The visible symptom was in Animation mode: with onion skinning on,
 * the neighbouring frames' ghosts are painted right there under the marquee, so dragging
 * a box grabbed cels belonging to OTHER frames and the selection bounds stretched across
 * a pose the playhead wasn't even on. Locked elements and elements on hidden layers
 * leaked in through the same hole.
 *
 * `canInteractWithElement` is injected by canvas.tsx (it owns the frame-visibility
 * lookup), so these tests inject a stub for it — what is under test here is that the
 * marquee *consults the gate at all*, which is precisely what was missing.
 */

import { describe, it, expect, mock, beforeEach } from "bun:test";

mock.module("../../components/toast", () => ({ showToast: () => { } }));
// sweetalert2 injects a <style> into document.head the moment it is imported, and it is
// pulled in transitively by the store. Stubbing the module is far less brittle than
// growing a fake DOM one method at a time until its bundle stops throwing.
mock.module("sweetalert2", () => ({
    default: { fire: async () => ({ isConfirmed: false }), close: () => { } },
}));

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => { },
    removeEventListener: () => { },
} as any;
global.localStorage = { getItem: () => null, setItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
// sweetalert2 is pulled in transitively and injects a <style> at import time, so the
// document stub has to be able to make and append elements.
const stubNode = (): any => ({
    style: {}, dataset: {},
    setAttribute: () => { }, getAttribute: () => null, removeAttribute: () => { },
    appendChild: (c: any) => c, removeChild: () => { }, remove: () => { },
    addEventListener: () => { }, removeEventListener: () => { },
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    querySelector: () => null, querySelectorAll: () => [],
});
global.document = {
    documentElement: { ...stubNode(), setAttribute: () => { } },
    head: stubNode(),
    body: stubNode(),
    createElement: () => stubNode(),
    createElementNS: () => stubNode(),
    createTextNode: () => stubNode(),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => { },
    removeEventListener: () => { },
} as any;

const { store, setStore } = await import("../../store/app-store");
const { selectionOnUp } = await import("./selection-handler");
const { createPointerState } = await import("../pointer-state");

const LAYER = "L1";
const HIDDEN_LAYER = "L2";

/** A plain rect element at a known spot, big enough for the marquee to straddle. */
const el = (id: string, x: number, layerId = LAYER, extra: any = {}): any => ({
    id, type: "rectangle", x, y: 0, width: 50, height: 50,
    layerId, angle: 0, seed: 1, ...extra,
});

/** Everything selectionOnUp touches on the signals bag, stubbed. */
const makeSignals = (box: { x: number; y: number; w: number; h: number } | null) => ({
    editingId: () => null,
    setEditingId: () => { },
    setEditText: () => { },
    setRichTextSpans: () => { },
    selectionBox: () => box,
    setSelectionBox: () => { },
    lassoPoints: () => null,
    setLassoPoints: () => { },
    suggestedBinding: () => null,
    setSuggestedBinding: () => { },
    snappingGuides: () => [],
    setSnappingGuides: () => { },
    spacingGuides: () => [],
    setSpacingGuides: () => { },
    setPointSnap: () => { },
    reparentDropTarget: () => null,
    setReparentDropTarget: () => { },
    poolLaneDropTarget: () => null,
    setPoolLaneDropTarget: () => { },
    tableColumnDrop: () => null,
    setTableColumnDrop: () => { },
}) as any;

/** `blocked` stands in for whatever canvas.tsx would refuse: another frame's cel, a
 *  locked element, an element on a locked layer. */
const makeHelpers = (blocked: Set<string>) => ({
    canInteractWithElement: (e: any) => !blocked.has(e.id),
    applyMasterProjection: (e: any) => e,
    getWorldCoordinates: (x: number, y: number) => ({ x, y }),
    checkBinding: () => null,
    refreshLinePoints: () => null,
    refreshBoundLine: () => { },
    flushPenPoints: () => { },
    normalizePencil: () => null,
    commitText: () => { },
    draw: () => { },
    setCursor: () => { },
    setTableCellSelection: () => { },
}) as any;

const upEvent = () => ({
    shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, button: 0,
    clientX: 0, clientY: 0,
}) as any;

/** Drag a marquee across the whole strip the fixtures live in. */
const marqueeOverEverything = (blocked: Set<string>) => {
    const pState = createPointerState();
    pState.isSelecting = true;
    pState.isDragging = false;
    selectionOnUp(
        upEvent(), 0, 0, pState,
        makeHelpers(blocked),
        makeSignals({ x: -20, y: -20, w: 400, h: 200 }),
    );
};

describe("marquee selection respects the interactability gate", () => {
    beforeEach(() => {
        setStore("selectedTool", "selection");
        setStore("selection", []);
        setStore("viewState", { scale: 1, panX: 0, panY: 0 } as any);
        setStore("layers", [
            { id: LAYER, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
            { id: HIDDEN_LAYER, name: "Layer 2", visible: false, locked: false, opacity: 1, order: 1, backgroundColor: "transparent" },
        ] as any);
        setStore("elements", [] as any);
    });

    it("selects everything interactable when nothing is gated", () => {
        setStore("elements", [el("a", 0), el("b", 100)] as any);
        marqueeOverEverything(new Set());
        expect(store.selection.sort()).toEqual(["a", "b"]);
    });

    it("skips an element the gate refuses — another frame's cel under an onion ghost", () => {
        setStore("elements", [el("onFrame", 0), el("otherFrameCel", 100)] as any);
        // What canvas.tsx does when animVisibleIds() has no entry for the element.
        marqueeOverEverything(new Set(["otherFrameCel"]));
        expect(store.selection).toEqual(["onFrame"]);
    });

    it("skips elements on a hidden layer", () => {
        setStore("elements", [el("visible", 0), el("onHiddenLayer", 100, HIDDEN_LAYER)] as any);
        marqueeOverEverything(new Set());
        expect(store.selection).toEqual(["visible"]);
    });

    it("selects nothing when every candidate is gated", () => {
        setStore("elements", [el("a", 0), el("b", 100)] as any);
        marqueeOverEverything(new Set(["a", "b"]));
        expect(store.selection).toEqual([]);
    });
});

describe("lasso selection respects the same gate", () => {
    beforeEach(() => {
        setStore("selectedTool", "lasso");
        setStore("selection", []);
        setStore("viewState", { scale: 1, panX: 0, panY: 0 } as any);
        setStore("layers", [
            { id: LAYER, name: "Layer 1", visible: true, locked: false, opacity: 1, order: 0, backgroundColor: "transparent" },
        ] as any);
    });

    const lassoOverEverything = (blocked: Set<string>) => {
        const pState = createPointerState();
        pState.isSelecting = true;
        pState.isDragging = false;
        // A polygon comfortably containing both fixtures' centres.
        pState.lassoPoints = [
            { x: -50, y: -50 }, { x: 400, y: -50 }, { x: 400, y: 200 }, { x: -50, y: 200 },
        ];
        selectionOnUp(upEvent(), 0, 0, pState, makeHelpers(blocked), makeSignals(null));
    };

    it("skips a gated element inside the lasso polygon", () => {
        setStore("elements", [el("keep", 0), el("drop", 100)] as any);
        lassoOverEverything(new Set(["drop"]));
        expect(store.selection).toEqual(["keep"]);
    });
});
