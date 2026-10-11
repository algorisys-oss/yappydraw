import { describe, it, expect } from "bun:test";
import type { DrawingElement } from "../types";
import { refreshLinePoints } from "./binding-logic";

function node(id: string, x: number, y: number, w = 100, h = 60): DrawingElement {
    return { id, type: "rectangle", x, y, width: w, height: h, angle: 0 } as unknown as DrawingElement;
}

/** An elbow between two shapes the way `api.connect()` / the DSL make one: anchor fractions, no `position`. */
function apiElbow(a: DrawingElement, b: DrawingElement, s: { x: number; y: number }, e: { x: number; y: number }, pos?: { start?: string; end?: string }): DrawingElement {
    return {
        id: "c1", type: "arrow", curveType: "elbow",
        x: s.x, y: s.y, width: e.x - s.x, height: e.y - s.y,
        points: [0, 0, e.x - s.x, e.y - s.y],
        startBinding: { elementId: a.id, focus: 0, gap: 5, position: pos?.start, anchorFractionX: (s.x - a.x) / a.width, anchorFractionY: (s.y - a.y) / a.height },
        endBinding: { elementId: b.id, focus: 0, gap: 5, position: pos?.end, anchorFractionX: (e.x - b.x) / b.width, anchorFractionY: (e.y - b.y) / b.height },
    } as unknown as DrawingElement;
}

const world = (line: DrawingElement, flat: number[]) => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: line.x + flat[i], y: line.y + flat[i + 1] });
    return out;
};

describe("refreshLinePoints — elbow exit/entry sides", () => {
    const A = node("A", 0, 0);
    const B = node("B", 300, 200);
    const M = node("M", 140, 40, 30, 30); // a neighbour, so the grid router (not the naive jog) runs

    it("leaves a bottom anchor downward and enters a top anchor from above when no side is stored", () => {
        const line = apiElbow(A, B, { x: 50, y: 60 }, { x: 350, y: 200 });
        const pts = world(line, refreshLinePoints(line, [A, B, M, line]) as number[]);
        expect(pts[0]).toEqual({ x: 50, y: 60 });
        expect(pts[1].x).toBe(50);                 // straight down out of A's bottom edge
        expect(pts[1].y).toBeGreaterThan(60);
        const n = pts.length;
        expect(pts[n - 2].x).toBe(350);            // straight down into B's top edge
        expect(pts[n - 2].y).toBeLessThan(200);
    });

    it("ignores a stale stored side that no longer matches where the endpoint is", () => {
        // The binding still says 'right' (its original side) but the endpoint has been
        // re-faced onto A's bottom edge. Routing on 'right' would run along the edge.
        const line = apiElbow(A, B, { x: 50, y: 60 }, { x: 350, y: 200 }, { start: "right", end: "left" });
        const pts = world(line, refreshLinePoints(line, [A, B, M, line]) as number[]);
        expect(pts[1].x).toBe(50);
        expect(pts[1].y).toBeGreaterThan(60);
    });

    it("stores the route as a flat number[] relative to the start", () => {
        const line = apiElbow(A, B, { x: 100, y: 30 }, { x: 300, y: 230 });
        const flat = refreshLinePoints(line, [A, B, M, line]) as number[];
        expect(typeof flat[0]).toBe("number");
        expect(flat.slice(0, 2)).toEqual([0, 0]);
        expect(flat.length % 2).toBe(0);
    });
});

import { refreshConnectors, elbowsCrossing } from "./binding-logic";

describe("refreshLinePoints — hand-routed elbows", () => {
    const A = node("A", 0, 0);
    const B = node("B", 300, 200);
    const M = node("M", 140, 40, 30, 30);

    it("keeps the user's bends and only re-attaches the ends when manualRoute is set", () => {
        // Route: down out of A's bottom, across at y=150 (a bend the user dragged there), up into B's top.
        const line = apiElbow(A, B, { x: 50, y: 60 }, { x: 350, y: 200 });
        line.points = [0, 0, 0, 90, 300, 90, 300, 140];     // (50,60)→(50,150)→(350,150)→(350,200)
        (line as any).manualRoute = true;
        // A moved 20px right: the start is now at (70,60).
        const flat = refreshLinePoints(line, [A, B, M, line], 70, 60, 350, 200) as number[];
        const pts = world({ ...line, x: 70, y: 60 } as DrawingElement, flat);
        expect(pts[0]).toEqual({ x: 70, y: 60 });
        expect(pts[1]).toEqual({ x: 70, y: 150 });   // first segment stayed vertical, slid with the start
        expect(pts[2]).toEqual({ x: 350, y: 150 });  // the user's crossing height is untouched
        expect(pts[pts.length - 1]).toEqual({ x: 350, y: 200 });
    });

    it("re-routes automatically when manualRoute is off", () => {
        const line = apiElbow(A, B, { x: 50, y: 60 }, { x: 350, y: 200 });
        line.points = [0, 0, 0, 90, 300, 90, 300, 140];
        const flat = refreshLinePoints(line, [A, B, M, line], 70, 60, 350, 200) as number[];
        const pts = world({ ...line, x: 70, y: 60 } as DrawingElement, flat);
        expect(pts.some(p => p.y === 150)).toBe(false); // the hand-placed height is gone
    });
});

describe("refreshConnectors — cascade", () => {
    /** An elbow with a stored world route and bindings, as the store holds it. */
    const routed = (id: string, a: DrawingElement, b: DrawingElement, route: [number, number][]): DrawingElement => {
        const [sx, sy] = route[0];
        const [ex, ey] = route[route.length - 1];
        return {
            id, type: "arrow", curveType: "elbow", x: sx, y: sy, width: ex - sx, height: ey - sy,
            points: route.flatMap(([x, y]) => [x - sx, y - sy]),
            startBinding: { elementId: a.id, focus: 0, gap: 5, anchorFractionX: (sx - a.x) / a.width, anchorFractionY: (sy - a.y) / a.height },
            endBinding: { elementId: b.id, focus: 0, gap: 5, anchorFractionX: (ex - b.x) / b.width, anchorFractionY: (ey - b.y) / b.height },
        } as unknown as DrawingElement;
    };

    it("elbowsCrossing finds bound elbows whose drawn route meets a box", () => {
        const A = node("A", 0, 0), B = node("B", 400, 0);
        const c = routed("c1", A, B, [[100, 30], [250, 30], [250, 200], [400, 200]]); // detours down to y=200
        // A box over the detour, far from c's start→end chord.
        expect(elbowsCrossing([{ x1: 240, y1: 150, x2: 260, y2: 170 }], [A, B, c])).toEqual(["c1"]);
        expect(elbowsCrossing([{ x1: 240, y1: 400, x2: 260, y2: 420 }], [A, B, c])).toEqual([]);
    });

    it("re-routes a higher-id elbow whose drawn route meets the refreshed one", () => {
        // c9's stored route sweeps across the whole area between the shapes, so wherever
        // the router puts c1, c9's route box meets it. Nothing bound to c9 moved, and it
        // was not asked for — the cascade alone must refresh it.
        const A = node("A", 0, 0, 100, 60);
        const B = node("B", 0, 300, 100, 60);
        const C = node("C", 300, 0, 100, 60);
        const D = node("D", 300, 300, 100, 60);
        const blocker = node("M", 150, 120, 100, 120);
        const c1 = routed("c1", A, D, [[100, 30], [120, 30], [120, 330], [300, 330]]);
        const c9 = routed("c9", C, B, [[300, 30], [120, 30], [120, 330], [100, 330]]);
        const els = [A, B, C, D, blocker, c1, c9];
        const updates: Record<string, any> = {};
        const update = (id: string, upd: any) => { updates[id] = upd; Object.assign(els.find(e => e.id === id)!, upd); };
        refreshConnectors(["c1"], () => els, update);
        expect(updates.c1).toBeDefined();
        expect(updates.c9).toBeDefined();
    });

    it("leaves a lower-id elbow alone (it is the one others avoid)", () => {
        const A = node("A", 0, 0, 100, 60);
        const D = node("D", 300, 300, 100, 60);
        const c0 = routed("c0", A, D, [[100, 30], [120, 30], [120, 330], [300, 330]]);
        const c5 = routed("c5", A, D, [[100, 40], [130, 40], [130, 340], [300, 340]]);
        const els = [A, D, c0, c5];
        const updates: Record<string, any> = {};
        refreshConnectors(["c5"], () => els, (id, upd) => { updates[id] = upd; Object.assign(els.find(e => e.id === id)!, upd); });
        // c0 shares A and D with c5, so it is in the port group and refreshed for that
        // reason; the cascade itself never reaches below the lowest refreshed id.
        expect(Object.keys(updates).sort()).toEqual(["c0", "c5"]);
    });
});
