import { describe, it, expect } from "bun:test";
import type { DrawingElement } from "../types";
import { allocatePort, sideFacing, sidePoint } from "./connector-routing";

// Minimal fixtures — cast partial objects to DrawingElement (only the fields the
// allocator reads are populated).
function node(id: string, x: number, y: number, w = 40, h = 40, angle = 0): DrawingElement {
    return { id, type: "rectangle", x, y, width: w, height: h, angle } as unknown as DrawingElement;
}

/** A connector from `src` into `dst`, landing on `dst` at fraction (fx,fy). */
function conn(id: string, srcId: string, dstId: string, fx: number, fy: number): DrawingElement {
    return {
        id, type: "arrow", x: 0, y: 0, width: 0, height: 0,
        startBinding: { elementId: srcId, focus: 0, gap: 0 },
        endBinding: { elementId: dstId, focus: 0, gap: 0, anchorFractionX: fx, anchorFractionY: fy },
    } as unknown as DrawingElement;
}

describe("sideFacing", () => {
    // Node centred at (250,250).
    const N = node("N", 200, 200, 100, 100);
    it("picks the side that faces the opposite point", () => {
        expect(sideFacing(N, { x: 0, y: 250 })).toBe("left");
        expect(sideFacing(N, { x: 500, y: 250 })).toBe("right");
        expect(sideFacing(N, { x: 250, y: 0 })).toBe("top");
        expect(sideFacing(N, { x: 250, y: 500 })).toBe("bottom");
    });
    it("is move-aware: a neighbour moved to the opposite side flips the side", () => {
        expect(sideFacing(N, { x: 400, y: 250 })).toBe("right");
        expect(sideFacing(N, { x: 100, y: 250 })).toBe("left"); // same node, opposite neighbour
    });
});

describe("allocatePort — fan-in", () => {
    // Hub H with three arrows into its LEFT side from sources at different heights.
    const H = node("H", 200, 200, 100, 100);
    const A = node("A", 0, 0, 20, 20);   // centre y = 10  (highest)
    const B = node("B", 0, 100, 20, 20); // centre y = 110
    const C = node("C", 0, 300, 20, 20); // centre y = 310 (lowest)
    const cA = conn("cA", "A", "H", 0, 0.5);
    const cB = conn("cB", "B", "H", 0, 0.5);
    const cC = conn("cC", "C", "H", 0, 0.5);
    const els = [H, A, B, C, cA, cB, cC];

    it("gives each edge a distinct, in-range, sorted port on the side", () => {
        const pA = allocatePort(cA, H, "end", els)!;
        const pB = allocatePort(cB, H, "end", els)!;
        const pC = allocatePort(cC, H, "end", els)!;
        for (const p of [pA, pB, pC]) {
            expect(p).not.toBeNull();
            expect(p.x).toBe(200);                     // left side → x pinned to node.x
            expect(p.y).toBeGreaterThanOrEqual(200 + 15); // inside usable span [0.15,0.85]
            expect(p.y).toBeLessThanOrEqual(200 + 85);
        }
        // distinct and ordered by source height (crossing-minimised)
        expect(pA.y).toBeLessThan(pB.y);
        expect(pB.y).toBeLessThan(pC.y);
    });

    it("crossing-min: the highest source gets the topmost port", () => {
        const pA = allocatePort(cA, H, "end", els)!; // source A is highest
        const pC = allocatePort(cC, H, "end", els)!; // source C is lowest
        expect(pA.y).toBeLessThan(pC.y);
    });

    it("is idempotent (same input → identical output)", () => {
        const p1 = allocatePort(cB, H, "end", els)!;
        const p2 = allocatePort(cB, H, "end", els)!;
        expect(p2).toEqual(p1);
    });
});

describe("allocatePort — outgoing starts re-face after a move (screenshot regression)", () => {
    // Source S on the right; two targets moved to its LEFT. The two START endpoints
    // on S must land on S's LEFT side (facing the targets), not stay on the stale side.
    const S = node("S", 400, 200, 100, 60);   // centre (450,230)
    const T1 = node("T1", 0, 40, 120, 80);     // top-left, centre y = 80
    const T2 = node("T2", 40, 300, 100, 100);  // bottom-left, centre y = 350
    const c1 = conn("c1", "S", "T1", 0, 0.5);  // start bound to S
    const c2 = conn("c2", "S", "T2", 0, 0.5);
    const els = [S, T1, T2, c1, c2];

    it("moves both start endpoints onto S's left side", () => {
        const p1 = allocatePort(c1, S, "start", els)!;
        const p2 = allocatePort(c2, S, "start", els)!;
        expect(p1).not.toBeNull();
        expect(p2).not.toBeNull();
        expect(p1.x).toBe(400); // S.x — left side
        expect(p2.x).toBe(400);
        // ordered by target height: T1 (higher) gets the upper port
        expect(p1.y).toBeLessThan(p2.y);
    });
});

describe("allocatePort — bundles between the same pair (Phase 2: subsumes sibling-spread)", () => {
    const H = node("H", 200, 200, 100, 100);
    const A = node("A", 0, 0, 20, 20);

    it("returns null for a lone edge (no de-overlap needed)", () => {
        const c = conn("c1", "A", "H", 0, 0.5);
        expect(allocatePort(c, H, "end", [H, A, c])).toBeNull();
    });

    it("separates exact-duplicate parallels into distinct ports", () => {
        const c1 = conn("c1", "A", "H", 0, 0.5);
        const c2 = conn("c2", "A", "H", 0, 0.5); // same pair A→H
        const p1 = allocatePort(c1, H, "end", [H, A, c1, c2])!;
        const p2 = allocatePort(c2, H, "end", [H, A, c1, c2])!;
        expect(p1).not.toBeNull();
        expect(p2).not.toBeNull();
        expect(p1.y).not.toBe(p2.y); // distinct lanes, not stacked
    });

    it("separates a bidirectional pair (A→H and H→A) on H's side", () => {
        const ab = conn("ab", "A", "H", 0, 0.5); // A→H: H is the 'end'
        const ba = conn("ba", "H", "A", 0, 0.5); // H→A: H is the 'start'
        const pAb = allocatePort(ab, H, "end", [H, A, ab, ba])!;
        const pBa = allocatePort(ba, H, "start", [H, A, ab, ba])!;
        expect(pAb).not.toBeNull();
        expect(pBa).not.toBeNull();
        expect(pAb.y).not.toBe(pBa.y); // the two directions get separate ports
    });
});

describe("allocatePort — snaps ports to the true outline", () => {
    it("rectangle ports stay on the bbox edge (no change)", () => {
        const H = node("H", 200, 200, 100, 100); // rectangle
        const A = node("A", 0, 0, 20, 20);
        const B = node("B", 0, 300, 20, 20);
        const cA = conn("cA", "A", "H", 0, 0.5);
        const cB = conn("cB", "B", "H", 0, 0.5);
        const p = allocatePort(cA, H, "end", [H, A, B, cA, cB])!;
        expect(p.x).toBeCloseTo(200, 6); // left edge
    });

    it("circle ports lie on the circle, not the bounding box", () => {
        const H = { ...node("H", 200, 200, 100, 100), type: "circle" } as unknown as DrawingElement;
        const A = node("A", 0, 0, 20, 20);
        const B = node("B", 0, 300, 20, 20);
        const cA = conn("cA", "A", "H", 0, 0.5);
        const cB = conn("cB", "B", "H", 0, 0.5);
        const p = allocatePort(cA, H, "end", [H, A, B, cA, cB])!;
        // radius 50, centre (250,250): the port must be ~50 from centre, and inside x=200 (off the flat bbox edge)
        const r = Math.hypot(p.x - 250, p.y - 250);
        expect(r).toBeCloseTo(50, 3);
        expect(p.x).toBeGreaterThan(200);
    });
});

describe("regression fixes from review", () => {
    it("degenerate side (zero span) still separates a bundle", () => {
        // The removed sibling-spread handled collapsed/mid-resize shapes; ports must too.
        // Zero-WIDTH node with both neighbours above → 'top' side, span 0.
        const flat = node("F", 200, 200, 0, 100);
        const A = node("A", 190, 0, 20, 20);    // directly above → 'top'
        const B = node("B", 190, -100, 20, 20); // also directly above → 'top'
        const cA = conn("cA", "A", "F", 0.5, 0);
        const cB = conn("cB", "B", "F", 0.5, 0);
        const els = [flat, A, B, cA, cB];
        const pA = allocatePort(cA, flat, "end", els);
        const pB = allocatePort(cB, flat, "end", els);
        expect(pA).not.toBeNull();
        expect(pB).not.toBeNull();
        // distinct despite the side having no extent to spread along
        expect(`${pA!.x},${pA!.y}`).not.toBe(`${pB!.x},${pB!.y}`);
    });

    it("returns null for non-finite geometry", () => {
        const bad = node("X", 200, 200, NaN, 100);
        const A = node("A", 0, 0, 20, 20);
        const c = conn("c1", "A", "X", 0, 0.5);
        expect(allocatePort(c, bad, "end", [bad, A, c])).toBeNull();
    });

    it("rotated node orders ports along the LOCAL side axis, not world axes", () => {
        // N rotated 90°: its local left/right sides run horizontally in world space, so a
        // world-axis sort key would collapse and fall back to the id tiebreak.
        const N = node("N", 200, 200, 100, 100, Math.PI / 2);
        // Two neighbours separated along world X (i.e. along the local side after rotation)
        const L = node("L", -200, 240, 20, 20);
        const R = node("R", 600, 240, 20, 20);
        // ids chosen so the id-tiebreak order is the REVERSE of the spatial order
        const cR = conn("aa", "R", "N", 0, 0.5);
        const cL = conn("zz", "L", "N", 0, 0.5);
        const els = [N, L, R, cR, cL];
        const pR = allocatePort(cR, N, "end", els);
        const pL = allocatePort(cL, N, "end", els);
        if (pR && pL) {
            // Ports must be distinct and ordered by the neighbours' spatial position
            // along the side — not by id (which would put "aa" first regardless).
            expect(`${pR.x},${pR.y}`).not.toBe(`${pL.x},${pL.y}`);
            expect(pL.x).toBeLessThan(pR.x); // L is to the world-left of R
        }
    });
});

describe("rotation (sideFacing / sidePoint)", () => {
    // H centred at (250,250), rotated 90°.
    const H = node("H", 200, 200, 100, 100, Math.PI / 2);
    it("sideFacing evaluates the neighbour direction in the node-local frame", () => {
        // A neighbour to the world-left, under a 90° rotation, faces a local top/bottom side.
        const s = sideFacing(H, { x: 0, y: 250 });
        expect(s === "top" || s === "bottom").toBe(true);
    });
    it("sidePoint rotates the port about the node centre", () => {
        // Left-mid of an unrotated H is (200,250); a 90° turn maps it to the top-mid (250,200).
        const p = sidePoint(H, "left", 0.5);
        expect(p.x).toBeCloseTo(250, 6);
        expect(p.y).toBeCloseTo(200, 6);
    });
});
