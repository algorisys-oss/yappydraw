/**
 * DFD data store (Gane & Sarson): the ID compartment is a narrow strip sized from the
 * height. It used to be 20% of the width, so a wide store grew a 100px empty block.
 */

import { describe, it, expect } from "bun:test";
import { getShapeGeometry } from "./shape-geometry";
import type { DrawingElement } from "../types";

const store = (width: number, height: number) =>
    ({ id: "s", type: "dfdDataStore", x: 0, y: 0, width, height, strokeColor: "#000", backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 0, opacity: 100, angle: 0, renderStyle: "architectural" }) as unknown as DrawingElement;

/** x of the divider, measured from the store's left edge. */
const dividerX = (w: number, h: number) => {
    const g: any = getShapeGeometry(store(w, h));
    expect(g.type).toBe("multi");
    const [outline, divider] = g.shapes;
    return divider.points[0].x - outline.points[1].x;
};

describe("dfdDataStore ID compartment", () => {
    it("does not grow with the width", () => {
        expect(dividerX(500, 70)).toBeCloseTo(dividerX(220, 70), 5);
        expect(dividerX(500, 70)).toBeLessThan(40);
    });
    it("never takes more than a fifth of a narrow store", () => {
        expect(dividerX(60, 70)).toBeLessThanOrEqual(12 + 1e-9);
    });
    it("keeps the right side open", () => {
        const g: any = getShapeGeometry(store(220, 70));
        expect(g.shapes[0].isClosed).toBe(false);
    });
});
