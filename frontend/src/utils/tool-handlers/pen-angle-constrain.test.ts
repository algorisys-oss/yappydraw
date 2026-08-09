/**
 * Pen tool, Shift-constrained segments.
 *
 * Shift was already plumbed into the pen handler, but only the handle-drag branch read
 * it — so holding Shift shaped the Bézier handles (the 45° Clock Method) and did nothing
 * at all to the segment being drawn. Drawing a straight horizontal line with the pen was
 * therefore a matter of aim. These tests pin the constrained SEGMENT: 15° increments
 * measured from the previous anchor, on the committed click as well as the preview.
 *
 * The handler talks to the real store, so the harness mirrors selection-marquee.test.ts.
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
const { penOnDown, penOnMove } = await import("./pen-path-handler");
const { createPointerState } = await import("../pointer-state");

const signals = { setSuggestedBinding: () => { } } as any;
const helpers = {} as any;

/** The live anchors of the element being built, in world coords. */
const worldAnchors = (pState: any) => {
    const el = store.elements.find(e => e.id === pState.currentId)!;
    return (el.pathAnchors ?? []).map((a: any) => ({ x: el.x + a.x, y: el.y + a.y }));
};

/** Angle of the last segment, in degrees CCW from +x with screen-y negated. */
const lastSegmentAngle = (pState: any) => {
    const pts = worldAnchors(pState);
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    let deg = Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI;
    if (deg <= -180) deg += 360;
    return +deg.toFixed(6);
};

let pState: any;
beforeEach(() => {
    setStore("elements", []);
    setStore("selection", []);
    setStore("gridSettings", { ...store.gridSettings, snapToGrid: false });
    setStore("viewState", { ...store.viewState, scale: 1 });
    pState = createPointerState();
});

describe("pen segment constraint", () => {
    it("snaps a near-horizontal click to exactly 0°", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(300, 107, pState, helpers, true);   // 2° off horizontal
        expect(lastSegmentAngle(pState)).toBe(0);
        const pts = worldAnchors(pState);
        expect(pts[1].y).toBeCloseTo(100, 9);
    });

    it("snaps a near-vertical click to exactly 90°", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(106, 300, pState, helpers, true);
        expect(Math.abs(lastSegmentAngle(pState))).toBe(90);
        expect(worldAnchors(pState)[1].x).toBeCloseTo(100, 9);
    });

    it("snaps to 45° — the diagonal every illustration needs", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(300, 100 - 193, pState, helpers, true);   // 43.97° above horizontal
        expect(lastSegmentAngle(pState)).toBe(45);
    });

    it("lands on a multiple of 15° for arbitrary angles", () => {
        penOnDown(0, 0, pState, helpers, true);
        for (const [x, y] of [[100, 37], [220, -80], [-140, 60], [40, 190]]) {
            penOnUpish();
            penOnDown(x, y, pState, helpers, true);
            const deg = lastSegmentAngle(pState);
            expect(Math.abs(deg % 15)).toBeLessThan(1e-6);
        }
    });

    it("preserves the drag distance — the angle moves the point along the arc, not out", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        const target = { x: 300, y: 107 };
        penOnDown(target.x, target.y, pState, helpers, true);
        const pts = worldAnchors(pState);
        const wanted = Math.hypot(target.x - 100, target.y - 100);
        const got = Math.hypot(pts[1].x - 100, pts[1].y - 100);
        expect(got).toBeCloseTo(wanted, 9);
    });

    it("measures from the PREVIOUS anchor, not the first one", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(200, 100, pState, helpers, false);  // free placement
        penOnUpish();
        penOnDown(207, 300, pState, helpers, true);   // near-vertical from (200,100)
        const pts = worldAnchors(pState);
        expect(pts[2].x).toBeCloseTo(200, 9);         // vertical from the 2nd anchor
        expect(Math.abs(lastSegmentAngle(pState))).toBe(90);
    });

    it("leaves the point alone when Shift is not held", () => {
        penOnDown(100, 100, pState, helpers, false);
        penOnUpish();
        penOnDown(300, 107, pState, helpers, false);
        expect(worldAnchors(pState)[1]).toEqual({ x: 300, y: 107 });
    });

    it("does not constrain the very first anchor — there is no angle to hold yet", () => {
        penOnDown(137, 249, pState, helpers, true);
        expect(worldAnchors(pState)[0]).toEqual({ x: 137, y: 249 });
    });

    it("beats grid snap, the way the line tool does", () => {
        setStore("gridSettings", { ...store.gridSettings, snapToGrid: true, gridSize: 20 });
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(300, 107, pState, helpers, true);
        // Grid snap would have pulled y to 100 here too, so use an angle the grid can't hit.
        expect(lastSegmentAngle(pState)).toBe(0);

        const p2 = createPointerState();
        penOnDown(0, 0, p2, helpers, true);
        p2.penDragging = false; p2.penActiveIdx = -1;
        penOnDown(100, 60, p2, helpers, true);        // 30.96° → snaps to 30°
        const pts = (store.elements.find(e => e.id === p2.currentId)!.pathAnchors ?? []) as any[];
        const el = store.elements.find(e => e.id === p2.currentId)!;
        const b = { x: el.x + pts[1].x, y: el.y + pts[1].y };
        expect(Math.round(b.x % 20) === 0 && Math.round(b.y % 20) === 0).toBe(false);  // off-grid
        expect(Math.abs(Math.atan2(-b.y, b.x) * 180 / Math.PI)).toBeCloseTo(30, 6);
    });
});

describe("pen rubber-band preview", () => {
    it("previews the constrained point, so the preview matches where the click lands", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnMove(300, 107, pState, helpers, signals, true, false);
        const preview = worldAnchors(pState);
        expect(preview[1].y).toBeCloseTo(100, 9);     // preview is on the 0° ray

        penOnDown(300, 107, pState, helpers, true);   // committing must agree with it
        const committed = worldAnchors(pState);
        expect(committed[1].x).toBeCloseTo(preview[1].x, 9);
        expect(committed[1].y).toBeCloseTo(preview[1].y, 9);
    });

    it("previews freely when Shift is not held", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnMove(300, 107, pState, helpers, signals, false, false);
        expect(worldAnchors(pState)[1]).toEqual({ x: 300, y: 107 });
    });
});

describe("pen closing still works while constrained", () => {
    it("clicking the first anchor closes the path even with Shift down", () => {
        penOnDown(100, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(300, 100, pState, helpers, true);
        penOnUpish();
        penOnDown(300, 300, pState, helpers, true);
        penOnUpish();
        const id = pState.currentId;
        penOnDown(103, 102, pState, helpers, true);   // within the close threshold of the start
        const el = store.elements.find(e => e.id === id)!;
        expect(el.pathClosed).toBe(true);
        expect(el.pathAnchors!.length).toBe(3);        // closed, not given a 4th anchor
    });
});

/** The pen commits an anchor on down and curves it while the button is held; these tests
 *  place anchors by click, so end each drag the way pointer-up does. */
function penOnUpish() {
    pState.penDragging = false;
    pState.penActiveIdx = -1;
    pState.penHandleBroken = false;
}
