/**
 * Pen parity with Illustrator (Anshika's review, Phase 2): Ctrl-drag to fix an earlier anchor
 * or handle mid-path, Space to move the anchor being placed, click-to-close following a moved
 * first anchor, and add/delete anchors on the selected path from an idle Pen.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { mock } from "bun:test";

mock.module("../../components/toast", () => ({ showToast: () => { } }));
mock.module("sweetalert2", () => ({
    default: { fire: async () => ({ isConfirmed: false }), close: () => { } },
}));

global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
} as any;
global.localStorage = { getItem: () => null, setItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
const stubNode = (): any => ({
    style: {}, dataset: {},
    setAttribute: () => { }, getAttribute: () => null, removeAttribute: () => { },
    appendChild: (c: any) => c, removeChild: () => { }, remove: () => { },
    addEventListener: () => { }, removeEventListener: () => { },
    classList: { add: () => { }, remove: () => { }, contains: () => false, toggle: () => { } },
    querySelector: () => null, querySelectorAll: () => [],
});
global.document = {
    documentElement: { ...stubNode() }, head: stubNode(), body: stubNode(),
    createElement: () => stubNode(), createElementNS: () => stubNode(), createTextNode: () => stubNode(),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => { }, removeEventListener: () => { },
} as any;

const { store, setStore } = await import("../../store/app-store");
const { penOnDown, penOnMove, penOnUp } = await import("./pen-path-handler");
const { findPenEditTarget, applyPenEditTarget } = await import("./pen-edit-target");
const { createPointerState } = await import("../pointer-state");
const { setSelectedTool } = await import("../../store/app-store");

const signals = { setSuggestedBinding: () => { } } as any;
const helpers = {} as any;

const el = (p: any) => store.elements.find(e => e.id === p.currentId)!;
const world = (p: any) => { const e = el(p); return (e.pathAnchors ?? []).map((a: any) => ({ x: e.x + a.x, y: e.y + a.y })); };
/** click = down + up with no drag. */
const click = (p: any, x: number, y: number, opts: { ctrl?: boolean } = {}) => {
    penOnDown(x, y, p, helpers, false, false, !!opts.ctrl, false);
    penOnUp(p);
};

let p: any;
beforeEach(() => {
    setStore("elements", []);
    setStore("selection", []);
    setStore("gridSettings", { ...store.gridSettings, snapToGrid: false });
    setStore("viewState", { ...store.viewState, scale: 1 });
    setStore("perspectiveGridActive", false);
    p = createPointerState();
});

describe("Ctrl-drag while building (temporary direct select)", () => {
    it("moves an earlier anchor and keeps building", () => {
        click(p, 100, 100); click(p, 200, 100); click(p, 300, 100);
        penOnDown(200, 100, p, helpers, false, false, true, false);      // Ctrl on anchor 1
        expect(p.penEdit).toEqual({ idx: 1, part: "anchor" });
        penOnMove(200, 160, p, helpers, signals);
        penOnUp(p);
        expect(world(p)[1]).toEqual({ x: 200, y: 160 });
        expect(p.isPenBuilding).toBe(true);                              // path NOT finished
        click(p, 400, 100);
        expect(world(p)).toHaveLength(4);
    });

    it("drags a handle; its smooth partner mirrors direction", () => {
        click(p, 100, 100);
        penOnDown(200, 100, p, helpers, false);                          // place + drag a smooth anchor
        penOnMove(250, 100, p, helpers, signals);
        penOnUp(p);
        const a = el(p).pathAnchors![1];
        const ox = el(p).x + a.x + a.outX!, oy = el(p).y + a.y + a.outY!;
        penOnDown(ox, oy, p, helpers, false, false, true, false);         // Ctrl on the out handle
        expect(p.penEdit?.part).toBe("out");
        penOnMove(200, 50, p, helpers, signals);                          // aim it straight up
        penOnUp(p);
        const b = el(p).pathAnchors![1];
        expect(b.outX).toBeCloseTo(0, 6); expect(b.outY).toBeCloseTo(-50, 6);
        expect(b.inX).toBeCloseTo(0, 6); expect(b.inY!).toBeGreaterThan(0); // mirrored, opposite
    });

    it("Ctrl-click on empty canvas still finishes the open path", () => {
        click(p, 100, 100); click(p, 200, 100);
        const id = p.currentId;
        click(p, 500, 500, { ctrl: true });
        expect(p.isPenBuilding).toBe(false);
        expect(store.elements.find(e => e.id === id)!.pathAnchors).toHaveLength(2);
    });
});

describe("Space while placing an anchor", () => {
    it("moves the anchor instead of pulling a handle, then handle-pulling resumes", () => {
        click(p, 100, 100);
        penOnDown(200, 100, p, helpers, false);                          // start placing anchor 1
        penOnMove(210, 100, p, helpers, signals, false, false, false, true);   // Space held from the first step
        penOnMove(230, 140, p, helpers, signals, false, false, false, true);
        expect(world(p)[1]).toEqual({ x: 230, y: 140 });                 // followed the pointer exactly
        expect(el(p).pathAnchors![1].outX).toBeUndefined();              // no handle pulled
        penOnMove(260, 140, p, helpers, signals);                        // Space up: pull a handle
        const a = el(p).pathAnchors![1];
        expect(world(p)[1]).toEqual({ x: 230, y: 140 });                 // anchor stays put
        expect(a.outX).toBeCloseTo(30, 6);
    });

    it("clicking the MOVED first anchor still closes the path", () => {
        penOnDown(100, 100, p, helpers, false);
        penOnMove(101, 100, p, helpers, signals, false, false, false, true);
        penOnMove(121, 110, p, helpers, signals, false, false, false, true);   // anchor 0 → (120, 110)
        penOnUp(p);
        click(p, 300, 100); click(p, 300, 300);
        const id = p.currentId;
        click(p, 121, 111);                                              // near the moved start
        expect(store.elements.find(e => e.id === id)!.pathClosed).toBe(true);
    });
});

describe("idle Pen edits the selected path", () => {
    const makePath = () => {
        click(p, 100, 100); click(p, 200, 100); click(p, 300, 100);
        const id = p.currentId;
        penOnDown(0, 0, p, helpers, false, false, true, false); penOnUp(p);  // Ctrl-click away: finish
        return id as string;
    };

    it("offers delete on a middle anchor and add on a segment — only for the selected path", () => {
        const id = makePath();
        setStore("selection", [id]);
        expect(findPenEditTarget(200, 100, 1)).toMatchObject({ kind: "delete", id, i: 1 });
        expect(findPenEditTarget(150, 101, 1)).toMatchObject({ kind: "add", id });
        expect(findPenEditTarget(150, 300, 1)).toBeNull();               // off the path
        setStore("selection", []);
        expect(findPenEditTarget(200, 100, 1)).toBeNull();               // not selected → draw
    });

    it("applies: delete removes the anchor, add inserts one on the segment", () => {
        const id = makePath();
        setStore("selection", [id]);
        applyPenEditTarget(findPenEditTarget(150, 100, 1)!, 150, 100, 1);
        expect(store.elements.find(e => e.id === id)!.pathAnchors).toHaveLength(4);
        const t = findPenEditTarget(200, 100, 1)!;
        expect(t.kind).toBe("delete");
        applyPenEditTarget(t, 200, 100, 1);
        expect(store.elements.find(e => e.id === id)!.pathAnchors).toHaveLength(3);
    });

    it("never offers to delete down to fewer than two anchors", () => {
        click(p, 100, 100); click(p, 200, 100);
        const id = p.currentId;
        penOnDown(0, 0, p, helpers, false, false, true, false); penOnUp(p);
        setStore("selection", [id]);
        expect(findPenEditTarget(200, 100, 1)).toBeNull();
    });

    it("picking the Pen keeps one selected path selected; other selections still clear", () => {
        const id = makePath();
        setSelectedTool("selection");
        setStore("selection", [id]);
        setSelectedTool("path");
        expect(store.selection).toEqual([id]);
        setSelectedTool("selection");
        setStore("elements", [...store.elements, { ...store.elements[0], id: "rect1", type: "rectangle" } as any]);
        setStore("selection", ["rect1"]);
        setSelectedTool("path");
        expect(store.selection).toEqual([]);
    });

    it("starting a new path deselects the old one", () => {
        const id = makePath();
        setStore("selection", [id]);
        penOnDown(600, 600, p, helpers, false);
        expect(store.selection).toEqual([]);
    });
});
