/**
 * Perspective grid, wired into the drawing tools.
 *
 * `perspective-snap.test.ts` pins the maths; this pins the plumbing — that the line tool
 * and the pen actually consult the grid, that Shift and Alt still win, and that grid snap
 * no longer drags a snapped endpoint back off the ray.
 *
 * The handlers talk to the real store, so the harness mirrors pen-angle-constrain.test.ts.
 */

import { describe, it, expect, beforeEach, afterAll } from "bun:test";
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

const { store, setStore, setSelectedTool } = await import("../../store/app-store");
const { drawOnDown, drawOnMove } = await import("./draw-handler");
const { penOnDown, penOnMove } = await import("./pen-path-handler");
const { createPointerState } = await import("../pointer-state");

let binding: any = null;
const signals = { setSuggestedBinding: (b: any) => { binding = b; }, suggestedBinding: () => binding } as any;
const helpers = { checkBinding: () => null } as any;

/** Horizon at y=0, VPs at x=∓1000 — the same geometry the pure tests use. */
const GRID = {
    horizonY: 0, leftVPx: -1000, rightVPx: 1000,
    mode: 2 as const, verticalVPx: 0, verticalVPy: 3000,
    density: 12, snap: true, snapAngle: 10, snapStrength: 1, drawPlane: 'off' as const,
};

/** |cross product| of (end − start) against (VP − start): 0 ⇒ the three are collinear. */
const offRay = (sx: number, sy: number, ex: number, ey: number, vx: number, vy: number) =>
    Math.abs((ex - sx) * (vy - sy) - (ey - sy) * (vx - sx));

const live = (pState: any) => {
    const el = store.elements.find(e => e.id === pState.currentId)!;
    return { x: el.x, y: el.y, ex: el.x + el.width, ey: el.y + el.height };
};

let pState: any;
beforeEach(() => {
    binding = null;
    setStore("elements", []);
    setStore("selection", []);
    setStore("gridSettings", { ...store.gridSettings, snapToGrid: false });
    setStore("viewState", { ...store.viewState, scale: 1, panX: 0, panY: 0 });
    setStore("perspectiveGrid", { ...GRID });
    setStore("perspectiveGridActive", true);
    setStore("perspectiveSnapGuide", null);
    setSelectedTool("line");
    pState = createPointerState();
});

// The store is shared across test files in a run — leave the grid off so a later file's
// drawing tests aren't quietly snapped by it.
afterAll(() => {
    setStore("perspectiveGridActive", false);
    setStore("perspectiveGrid", null);
    setStore("perspectiveSnapGuide", null);
});

describe("line tool on the perspective grid", () => {
    it("pulls a near-ray drag onto the ray through the vanishing point", () => {
        drawOnDown(0, 500, pState, helpers);
        drawOnMove(210, 385, pState, helpers, signals);   // ~2.7° off the right VP ray
        const l = live(pState);
        expect(offRay(0, 500, l.ex, l.ey, 1000, 0)).toBeLessThan(1e-6);
        expect(store.perspectiveSnapGuide?.kind).toBe("right");
    });

    it("leaves a drag that points nowhere near a ray alone", () => {
        drawOnDown(0, 500, pState, helpers);
        drawOnMove(200, 700, pState, helpers, signals);   // 45° down-right
        const l = live(pState);
        expect(l.ex).toBe(200);
        expect(l.ey).toBe(700);
        expect(store.perspectiveSnapGuide).toBeNull();
    });

    it("Alt draws free-hand — the grid is ignored", () => {
        drawOnDown(0, 500, pState, helpers);
        drawOnMove(210, 385, pState, helpers, signals, false, true);
        const l = live(pState);
        expect(l.ex).toBe(210);
        expect(l.ey).toBe(385);
        expect(store.perspectiveSnapGuide).toBeNull();
    });

    it("Shift still means the plain 15° constraint, not the grid", () => {
        drawOnDown(0, 500, pState, helpers);
        drawOnMove(210, 385, pState, helpers, signals, true);
        const l = live(pState);
        const deg = Math.atan2(l.ey - 500, l.ex - 0) * 180 / Math.PI;
        const m = ((deg % 15) + 15) % 15;
        expect(Math.min(m, 15 - m)).toBeLessThan(1e-6);
        expect(offRay(0, 500, l.ex, l.ey, 1000, 0)).toBeGreaterThan(1);  // NOT on the VP ray
    });

    it("beats grid snap, which would otherwise pull the endpoint back off the ray", () => {
        setStore("gridSettings", { ...store.gridSettings, snapToGrid: true, gridSize: 20 });
        drawOnDown(0, 500, pState, helpers);
        drawOnMove(210, 385, pState, helpers, signals);
        const l = live(pState);
        expect(offRay(0, 500, l.ex, l.ey, 1000, 0)).toBeLessThan(1e-6);
    });

    it("does nothing when the grid is off, or when its snap is disabled", () => {
        for (const off of [() => setStore("perspectiveGridActive", false),
                           () => setStore("perspectiveGrid", { ...GRID, snap: false })]) {
            setStore("perspectiveGridActive", true);
            setStore("perspectiveGrid", { ...GRID });
            off();
            const p = createPointerState();
            drawOnDown(0, 500, p, helpers);
            drawOnMove(210, 385, p, helpers, signals);
            const el = store.elements.find(e => e.id === p.currentId)!;
            expect(el.x + el.width).toBe(210);
        }
    });

    it("does not touch a box shape — a rectangle has no single direction to aim", () => {
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(0, 500, p, helpers);
        drawOnMove(210, 385, p, helpers, signals);
        const el = store.elements.find(e => e.id === p.currentId)!;
        expect(el.x + el.width).toBe(210);
        expect(el.y + el.height).toBe(385);
    });
});

describe("drawing shapes ON a plane", () => {
    /** Absolute world corners of the element's warp cage. */
    const cage = (p: any) => {
        const el = store.elements.find(e => e.id === p.currentId)!;
        const cx = el.x + el.width / 2, cy = el.y + el.height / 2;
        return { el, corners: el.warp!.corners!.map((c: any) => ({ x: cx + c.x, y: cy + c.y })) };
    };

    it("turns a rectangle drag into a quad whose edges run to the vanishing points", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "floor" });
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(-200, 600, p, helpers);
        drawOnMove(300, 900, p, helpers, signals);
        const { el, corners } = cage(p);
        expect(corners).toHaveLength(4);
        expect(el.warp!.projective).toBe(true);
        // Each edge is collinear with one of the two horizon VPs.
        for (let i = 0; i < 4; i++) {
            const a = corners[i], b = corners[(i + 1) % 4];
            const toLeft = offRay(a.x, a.y, b.x, b.y, -1000, 0);
            const toRight = offRay(a.x, a.y, b.x, b.y, 1000, 0);
            expect(Math.min(toLeft, toRight)).toBeLessThan(1e-6);
        }
    });

    it("keeps a wall's verticals vertical", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "right" });
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(-100, 200, p, helpers);
        drawOnMove(400, 700, p, helpers, signals);
        const { corners } = cage(p);
        const vertical = [0, 1, 2, 3].filter(i => Math.abs(corners[(i + 1) % 4].x - corners[i].x) < 1e-6);
        expect(vertical).toHaveLength(2);
    });

    it("works for the ellipse tool too — that is the perspective-circle case", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "floor" });
        setSelectedTool("circle");
        const p = createPointerState();
        drawOnDown(-200, 600, p, helpers);
        drawOnMove(300, 900, p, helpers, signals);
        const { el } = cage(p);
        expect(el.type).toBe("circle");
        expect(el.warp!.projective).toBe(true);
    });

    it("leaves the bbox positive, so pointer-up normalisation can't mangle the cage", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "floor" });
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(300, 900, p, helpers);
        drawOnMove(-200, 600, p, helpers, signals);   // dragged up-left
        const el = store.elements.find(e => e.id === p.currentId)!;
        expect(el.width).toBeGreaterThan(0);
        expect(el.height).toBeGreaterThan(0);
    });

    it("Alt draws a plain upright box", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "floor" });
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(-200, 600, p, helpers);
        drawOnMove(300, 900, p, helpers, signals, false, true);
        const el = store.elements.find(e => e.id === p.currentId)!;
        expect(el.warp).toBeUndefined();
        expect(el.x + el.width).toBe(300);
    });

    it("drops a cage written earlier in the drag when the quad goes degenerate", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "floor" });
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(-200, 600, p, helpers);
        drawOnMove(300, 900, p, helpers, signals);
        expect(store.elements.find(e => e.id === p.currentId)!.warp).toBeTruthy();
        drawOnMove(-200, 600, p, helpers, signals);   // back to the start: no area
        expect(store.elements.find(e => e.id === p.currentId)!.warp).toBeUndefined();
    });

    it("does nothing with the plane set to off", () => {
        setStore("perspectiveGrid", { ...GRID, drawPlane: "off" });
        setSelectedTool("rectangle");
        const p = createPointerState();
        drawOnDown(-200, 600, p, helpers);
        drawOnMove(300, 900, p, helpers, signals);
        expect(store.elements.find(e => e.id === p.currentId)!.warp).toBeUndefined();
    });
});

describe("pen tool on the perspective grid", () => {
    const worldAnchors = (p: any) => {
        const el = store.elements.find(e => e.id === p.currentId)!;
        return (el.pathAnchors ?? []).map((a: any) => ({ x: el.x + a.x, y: el.y + a.y }));
    };
    const endDrag = (p: any) => { p.penDragging = false; p.penActiveIdx = -1; p.penHandleBroken = false; };

    it("places the next anchor on the ray from the previous one", () => {
        setSelectedTool("path");
        penOnDown(0, 500, pState, helpers, false);
        endDrag(pState);
        penOnDown(210, 385, pState, helpers, false);
        const a = worldAnchors(pState);
        expect(offRay(a[0].x, a[0].y, a[1].x, a[1].y, 1000, 0)).toBeLessThan(1e-6);
    });

    it("never snaps the FIRST anchor — there is no segment to aim yet", () => {
        setSelectedTool("path");
        penOnDown(137, 249, pState, helpers, false);
        expect(worldAnchors(pState)[0]).toEqual({ x: 137, y: 249 });
    });

    it("Alt places the anchor free-hand", () => {
        setSelectedTool("path");
        penOnDown(0, 500, pState, helpers, false, true);
        endDrag(pState);
        penOnDown(210, 385, pState, helpers, false, true);
        expect(worldAnchors(pState)[1]).toEqual({ x: 210, y: 385 });
    });

    // The handle, not the anchor, is what makes a CURVE read as being in perspective:
    // it is the tangent the curve leaves the anchor along.
    it("aims a dragged Bézier handle down a vanishing-point ray", () => {
        setSelectedTool("path");
        penOnDown(0, 500, pState, helpers, false);
        penOnMove(210, 385, pState, helpers, signals, false, false, false);
        const a = store.elements.find(e => e.id === pState.currentId)!.pathAnchors![0];
        // |out × (VP − anchor)| = 0 ⇒ the handle points straight at the vanishing point.
        expect(Math.abs(a.outX! * (0 - 500) - a.outY! * (1000 - 0))).toBeLessThan(1e-6);
        expect(a.kind).toBe("smooth");
        expect(store.perspectiveSnapGuide?.kind).toBe("right");
    });

    it("Alt leaves the handle exactly where the cursor put it", () => {
        setSelectedTool("path");
        penOnDown(0, 500, pState, helpers, false, true);
        penOnMove(210, 385, pState, helpers, signals, false, true, true);
        const a = store.elements.find(e => e.id === pState.currentId)!.pathAnchors![0];
        expect(a.outX).toBeCloseTo(210, 6);
        expect(a.outY).toBeCloseTo(-115, 6);
    });
});
