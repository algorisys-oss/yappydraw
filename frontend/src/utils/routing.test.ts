import { describe, it, expect } from "bun:test";
import type { DrawingElement } from "../types";
import {
    calculateSmartElbowRoute,
    collectConnectorSegments,
    segmentsCollinearOverlap,
    type Seg,
} from "./routing";

function node(id: string, x: number, y: number, w = 80, h = 60): DrawingElement {
    return { id, type: "rectangle", x, y, width: w, height: h } as unknown as DrawingElement;
}

/** An elbow connector with world-space `pts` stored as element-relative flat points. */
function elbow(
    id: string, startElId: string | null, endElId: string | null, pts: Array<[number, number]>
): DrawingElement {
    const [ox, oy] = pts[0];
    return {
        id, type: "arrow", curveType: "elbow",
        x: ox, y: oy, width: 0, height: 0,
        points: pts.flatMap(([x, y]) => [x - ox, y - oy]),
        startBinding: startElId ? { elementId: startElId, focus: 0, gap: 0 } : null,
        endBinding: endElId ? { elementId: endElId, focus: 0, gap: 0 } : null,
    } as unknown as DrawingElement;
}

describe("segmentsCollinearOverlap", () => {
    const horiz: Seg = { x1: 0, y1: 100, x2: 200, y2: 100 };
    const vert: Seg = { x1: 100, y1: 0, x2: 100, y2: 200 };

    it("flags a horizontal candidate running along a horizontal segment", () => {
        expect(segmentsCollinearOverlap(50, 100, 150, 100, horiz)).toBe(true);
    });
    it("flags a vertical candidate running along a vertical segment", () => {
        expect(segmentsCollinearOverlap(100, 50, 100, 150, vert)).toBe(true);
    });
    it("does NOT flag a plain crossing (perpendicular)", () => {
        expect(segmentsCollinearOverlap(100, 0, 100, 200, horiz)).toBe(false);
    });
    it("does NOT flag a parallel line on a different row", () => {
        expect(segmentsCollinearOverlap(50, 140, 150, 140, horiz)).toBe(false);
    });
    it("does NOT flag collinear segments whose extents do not overlap", () => {
        expect(segmentsCollinearOverlap(300, 100, 400, 100, horiz)).toBe(false);
    });
    it("tolerates sub-tolerance offsets (same visual line)", () => {
        expect(segmentsCollinearOverlap(50, 101, 150, 101, horiz)).toBe(true);
    });
});

describe("collectConnectorSegments", () => {
    const A = node("A", 0, 0);
    const B = node("B", 400, 0);
    const C = node("C", 0, 300);
    const D = node("D", 400, 300);

    it("collects world-space segments from a lower-id connector", () => {
        const low = elbow("c1", "A", "B", [[10, 20], [200, 20], [200, 80]]);
        const self = elbow("c2", "C", "D", [[0, 0], [10, 10]]);
        const segs = collectConnectorSegments(self, [A, B, C, D, low, self]);
        expect(segs).toEqual([
            { x1: 10, y1: 20, x2: 200, y2: 20 },
            { x1: 200, y1: 20, x2: 200, y2: 80 },
        ]);
    });

    it("excludes self, and higher/equal-id connectors (priority → no oscillation)", () => {
        const self = elbow("c1", "A", "B", [[0, 0], [50, 0]]);
        const higher = elbow("c9", "C", "D", [[0, 100], [50, 100]]);
        const segs = collectConnectorSegments(self, [A, B, C, D, self, higher]);
        expect(segs).toEqual([]); // c9 > c1 → c1 does not avoid it
    });

    it("includes connectors sharing a bound endpoint (ports separate the ends, not the runs)", () => {
        const sharing = elbow("c0", "A", "D", [[0, 50], [100, 50]]); // shares A
        const self = elbow("c5", "A", "B", [[0, 0], [50, 0]]);
        const segs = collectConnectorSegments(self, [A, B, D, sharing, self]);
        expect(segs).toEqual([{ x1: 0, y1: 50, x2: 100, y2: 50 }]);
    });

    it("excludes non-elbow connectors", () => {
        const straight = {
            ...elbow("c0", "C", "D", [[0, 50], [100, 50]]), curveType: "straight",
        } as unknown as DrawingElement;
        const self = elbow("c5", "A", "B", [[0, 0], [50, 0]]);
        expect(collectConnectorSegments(self, [A, B, C, D, straight, self])).toEqual([]);
    });
});

describe("calculateSmartElbowRoute — connector avoidance", () => {
    // Two shapes with an obstacle between them forces the smart (grid) router.
    const A = node("A", 0, 0, 80, 60);
    const B = node("B", 400, 0, 80, 60);
    const mid = node("M", 180, -40, 60, 140); // obstacle between A and B
    const start = { x: 80, y: 30 };
    const end = { x: 400, y: 30 };

    it("is idempotent (same scene routed twice → identical points)", () => {
        const self = elbow("c5", "A", "B", [[80, 30], [400, 30]]);
        const els = [A, B, mid, self];
        const r1 = calculateSmartElbowRoute(start, end, els, A, B, undefined, undefined, self);
        const r2 = calculateSmartElbowRoute(start, end, els, A, B, undefined, undefined, self);
        expect(r2).toEqual(r1);
    });

    it("avoids running along a lower-id connector's body where a lane exists", () => {
        const self = elbow("c5", "A", "B", [[80, 30], [400, 30]]);
        const baseline = calculateSmartElbowRoute(
            start, end, [A, B, mid, self], A, B, undefined, undefined, self
        );

        // A lower-id connector (no shared endpoints) occupying the lane the baseline
        // uses for its long horizontal run.
        const lane = baseline[0].y;
        const occupying = elbow("c1", null, null, [[90, lane], [390, lane]]);

        const withBlocker = calculateSmartElbowRoute(
            start, end, [A, B, mid, self, occupying], A, B, undefined, undefined, self
        );

        // The route must change to dodge the occupied lane.
        expect(JSON.stringify(withBlocker)).not.toBe(JSON.stringify(baseline));

        // And no segment of the new route may run along the blocker's body.
        const segs = collectConnectorSegments(self, [A, B, mid, self, occupying]);
        expect(segs.length).toBeGreaterThan(0);
        for (let i = 0; i + 1 < withBlocker.length; i++) {
            const p = withBlocker[i], q = withBlocker[i + 1];
            for (const s of segs) {
                expect(segmentsCollinearOverlap(p.x, p.y, q.x, q.y, s)).toBe(false);
            }
        }
    });
});

// ── Containers, side constraints and the expansion budget ──────────────────────────
//
// Fixtures model the diagrams that exposed each defect: a cluster box around the
// shapes (VPC / swimlane), API-made bindings with no stored side, and a 6×8 service
// grid whose long hops exhausted the old 800-pop budget.

import { collectShapeObstacles, MAX_ROUTE_ITERATIONS } from "./routing";

/** True when any sampled point of the polyline lies strictly inside `box`. */
function crosses(route: { x: number; y: number }[], box: DrawingElement): boolean {
    for (let i = 0; i + 1 < route.length; i++) {
        const p = route[i], q = route[i + 1];
        for (let t = 0.02; t < 1; t += 0.02) {
            const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
            if (x > box.x + 2 && x < box.x + box.width - 2 && y > box.y + 2 && y < box.y + box.height - 2) return true;
        }
    }
    return false;
}

const isOrthogonal = (route: { x: number; y: number }[]) =>
    route.every((p, i) => i === 0 || Math.abs(p.x - route[i - 1].x) < 0.5 || Math.abs(p.y - route[i - 1].y) < 0.5);

describe("collectShapeObstacles", () => {
    const frame = node("frame", 0, 0, 600, 300);
    const A = node("A", 40, 120);
    const B = node("B", 480, 120);
    const blocker = node("M", 260, 100, 80, 100);
    const far = node("far", 2000, 2000);
    const label = { ...node("t", 200, 50, 60, 20), type: "text" } as unknown as DrawingElement;
    const other = elbow("c0", null, null, [[100, 400], [300, 400]]);
    const start = { x: 120, y: 150 }, end = { x: 480, y: 150 };

    it("keeps shapes between the ends, drops the enclosing container, text, connectors and far shapes", () => {
        const ids = collectShapeObstacles(start, end, [frame, A, B, blocker, far, label, other], A, B).map(e => e.id);
        expect(ids).toEqual(["A", "B", "M"]);
    });

    it("judges containment by the bare point when an end is unbound", () => {
        const ids = collectShapeObstacles(start, end, [frame, A, B, blocker]).map(e => e.id);
        expect(ids).toEqual(["A", "B", "M"]); // frame holds both points → still not an obstacle
    });

    it("still treats a box that merely sits in the corridor as an obstacle", () => {
        const corridorBox = node("X", 200, 130, 60, 40); // between the ends, encloses neither
        expect(collectShapeObstacles(start, end, [A, B, corridorBox], A, B).map(e => e.id)).toContain("X");
    });
});

describe("calculateSmartElbowRoute — inside a container", () => {
    const frame = node("frame", 0, 0, 600, 300);
    const A = node("A", 40, 120);
    const B = node("B", 480, 120);
    const blocker = node("M", 260, 100, 80, 100);
    const start = { x: 120, y: 150 }, end = { x: 480, y: 150 };

    it("detours around a blocker even though a frame encloses both ends", () => {
        // Before the container rule the frame hard-blocked the first move, A* died on
        // iteration 1 and the naive elbow ran straight through M.
        const r = calculateSmartElbowRoute(start, end, [frame, A, B, blocker], A, B, "right", "left");
        expect(isOrthogonal(r)).toBe(true);
        expect(crosses(r, blocker)).toBe(false);
        expect(r.length).toBeGreaterThan(2);
    });

    it("also detours when the ends are inside the frame but one is unbound", () => {
        const r = calculateSmartElbowRoute(start, end, [frame, A, B, blocker], A, undefined, "right", undefined);
        expect(crosses(r, blocker)).toBe(false);
    });
});

describe("calculateSmartElbowRoute — side constraints", () => {
    const A = node("A", 0, 0, 100, 60);
    const B = node("B", 300, 200, 100, 60);
    const M = node("M", 150, 20, 40, 40); // something near, so the grid router runs

    it("leaves and arrives square to the given sides", () => {
        const start = { x: 50, y: 60 };  // A bottom
        const end = { x: 350, y: 200 };  // B top
        const r = calculateSmartElbowRoute(start, end, [A, B, M], A, B, "bottom", "top");
        expect(r[1].x).toBe(start.x);                 // first leg vertical, down
        expect(r[1].y).toBeGreaterThan(start.y);
        const n = r.length;
        expect(r[n - 2].x).toBe(end.x);               // last leg vertical, into the top
        expect(r[n - 2].y).toBeLessThan(end.y);
    });
});

describe("calculateSmartElbowRoute — budget on a dense grid", () => {
    // 6×8 service grid, every node wired to its right and lower neighbour, plus the
    // lower-id elbows already routed so their lanes inflate the grid like a real document.
    const nodes: DrawingElement[] = [];
    const at = (r: number, c: number) => nodes[r * 8 + c];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) nodes.push(node(`n${r}${c}`, 60 + c * 180, 60 + r * 140, 120, 60));
    const wires: DrawingElement[] = [];
    let k = 0;
    for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) {
        const a = at(r, c), b = at(r, c + 1);
        wires.push(elbow(`e${String(k++).padStart(3, "0")}`, a.id, b.id, [[a.x + a.width, a.y + 30], [b.x, b.y + 30]]));
    }
    const self = elbow("e999", "n10", "n57", [[0, 0], [1, 1]]);
    const all = [...nodes, ...wires, self];

    it("routes a long diagonal hop without falling back to the naive elbow", () => {
        const a = at(1, 0), b = at(5, 7);
        const start = { x: a.x + a.width, y: a.y + 30 }, end = { x: b.x, y: b.y + 30 };
        const t0 = performance.now();
        const r = calculateSmartElbowRoute(start, end, all, a, b, "right", "left", self);
        const ms = performance.now() - t0;
        expect(isOrthogonal(r)).toBe(true);
        for (const n of nodes) if (n !== a && n !== b) expect(crosses(r, n)).toBe(false);
        expect(ms).toBeLessThan(50);
    });

    it("exposes the budget shared with the WASM twin", () => {
        expect(MAX_ROUTE_ITERATIONS).toBe(4000);
    });
});

describe("calculateSmartElbowRoute — clearance from other shapes", () => {
    // The real case: App 1 → Monitor had to clear Cache, which sits just right of App 1
    // on the same row. The route used to run exactly along Cache's bottom edge.
    const app1 = node("app1", 560, 120, 120, 60);
    const cache = node("cache", 800, 120, 120, 60);
    const mon = node("mon", 1300, 300, 120, 60);
    const start = { x: 680, y: 160 }, end = { x: 1300, y: 320 };

    it("keeps at least 10px from a shape it is not attached to", () => {
        const r = calculateSmartElbowRoute(start, end, [app1, cache, mon], app1, mon, "right", "left");
        for (let i = 0; i + 1 < r.length; i++) {
            const p = r[i], q = r[i + 1];
            const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
            const nearCache = mx > cache.x - 10 && mx < cache.x + cache.width + 10 && my > cache.y - 10 && my < cache.y + cache.height + 10;
            expect(nearCache).toBe(false);
        }
    });

    it("still leaves its own shape through a port that sits against a neighbour", () => {
        // Worker 2's top edge touches Queue's row; the exit must not be blocked by clearance.
        const queue = node("queue", 800, 480, 120, 60);
        const w1 = node("w1", 1000, 420, 120, 60);
        const w2 = node("w2", 1000, 540, 120, 60);
        const db = node("db", 800, 300, 120, 60);
        const r = calculateSmartElbowRoute({ x: 1035, y: 540 }, { x: 888, y: 360 }, [queue, w1, w2, db], w2, db, "top", "bottom");
        expect(crosses(r, queue)).toBe(false);
        expect(crosses(r, w1)).toBe(false);
        expect(r.length).toBeGreaterThan(2);
    });
});
