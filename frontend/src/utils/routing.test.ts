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

    it("excludes connectors sharing a bound endpoint (ports own those)", () => {
        const sharing = elbow("c0", "A", "D", [[0, 50], [100, 50]]); // shares A
        const self = elbow("c5", "A", "B", [[0, 0], [50, 0]]);
        const segs = collectConnectorSegments(self, [A, B, D, sharing, self]);
        expect(segs).toEqual([]);
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
