import { describe, it, expect } from "bun:test";
import type { DrawingElement } from "../types";
import { snapWaypoint } from "./waypoint-snap";

const box = (id: string, x: number, y: number, w = 100, h = 60) => ({ id, type: 'rectangle', x, y, width: w, height: h } as unknown as DrawingElement);
const elbow = (id: string, pts: [number, number][]) => { const [ox, oy] = pts[0]; return { id, type: 'arrow', curveType: 'elbow', x: ox, y: oy, width: 0, height: 0, points: pts.flatMap(([x, y]) => [x - ox, y - oy]) } as unknown as DrawingElement; };
const self = elbow("me", [[0, 0], [50, 0], [50, 50]]);

describe("snapWaypoint", () => {
    it("snaps a horizontal run onto another connector's horizontal run", () => {
        const other = elbow("c1", [[200, 103], [400, 103], [400, 300]]);
        const r = snapWaypoint('y', 100, self, [self, other], { threshold: 6 });
        expect(r.value).toBe(103);
        expect(r.guide).toEqual({ type: 'horizontal', coordinate: 103, elementIds: ['c1'] });
    });

    it("snaps to a shape's centre line and edges", () => {
        const b = box("b", 300, 200, 100, 60);                   // centre y 230, edges 200 / 260
        expect(snapWaypoint('y', 233, self, [b], { threshold: 6 }).value).toBe(230);
        expect(snapWaypoint('y', 258, self, [b], { threshold: 6 }).value).toBe(260);
        expect(snapWaypoint('x', 348, self, [b], { threshold: 6 }).value).toBe(350);
    });

    it("leaves the value alone outside the threshold", () => {
        const b = box("b", 300, 200);
        const r = snapWaypoint('y', 240, self, [b], { threshold: 6 });
        expect(r).toEqual({ value: 240, guide: null });
    });

    it("prefers the nearest candidate", () => {
        const other = elbow("c1", [[0, 104], [100, 104]]);
        const b = box("b", 0, 101, 100, 50);                      // top edge 101
        expect(snapWaypoint('y', 102, self, [other, b], { threshold: 6 }).value).toBe(101);
    });

    it("snaps to the grid when it is on, with no guide line for a grid hit", () => {
        const r = snapWaypoint('y', 38, self, [], { threshold: 6, grid: { gridSize: 20, snapToGrid: true } as any });
        expect(r.value).toBe(40);
        expect(r.guide).toBeNull();
        expect(snapWaypoint('y', 38, self, [], { threshold: 6, grid: { gridSize: 20, snapToGrid: false } as any }).value).toBe(38);
    });

    it("ignores itself and curves", () => {
        const curve = { ...elbow("c9", [[0, 97], [100, 97]]), curveType: 'bezier' } as unknown as DrawingElement;
        expect(snapWaypoint('y', 100, self, [self, curve], { threshold: 6 }).value).toBe(100);
    });
});
