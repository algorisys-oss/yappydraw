/**
 * Three shapes that drew the wrong thing.
 *
 * Reported together: a cloud dragged wide collapsed into a spiked bowtie, the
 * checkmark rendered as a triangle, and the heart had a spike through the notch
 * between its lobes. All three are geometry, not rendering, so they are tested
 * against the geometry rather than a screenshot.
 */

import { describe, it, expect } from "bun:test";
import { getShapeGeometry } from "./shape-geometry";
import type { DrawingElement } from "../types";

const shape = (type: string, width: number, height: number): DrawingElement =>
    ({
        id: "e1",
        type,
        x: 0,
        y: 0,
        width,
        height,
        strokeColor: "#000000",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        angle: 0,
        renderStyle: "architectural",
    }) as DrawingElement;

/** Every `A rx ry 0 0 1 x y` arc in a path, with the chord it has to span. */
const arcs = (path: string, startX: number, startY: number) => {
    const out: { r: number; chord: number }[] = [];
    let cx = startX;
    let cy = startY;
    const re = /A ([-\d.]+) ([-\d.]+) 0 0 1 ([-\d.]+) ([-\d.]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(path))) {
        const [, r, , x, y] = m.map(Number) as unknown as number[];
        out.push({ r, chord: Math.hypot(x - cx, y - cy) });
        cx = x;
        cy = y;
    }
    return out;
};

const numbersIn = (path: string): number[] =>
    (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("cloud", () => {
    // Width, height. The wide one is the reported case: "not taking a good shape
    // when dragged horizontally".
    const boxes: [number, number][] = [
        [240, 190],
        [620, 150],
        [900, 90],
        [150, 190],
        [80, 400],
        [300, 300],
    ];

    it("never asks for an arc smaller than its own chord, at any aspect ratio", () => {
        // This is the bug: every radius used to come from the WIDTH alone, so a
        // wide, short cloud demanded arcs far too large for the height. SVG then
        // clamps them, and the outline collapses into spikes.
        for (const [w, h] of boxes) {
            const geo = getShapeGeometry(shape("cloud", w, h)) as { type: string; path: string };
            expect(geo.type).toBe("path");
            const first = numbersIn(geo.path);
            for (const { r, chord } of arcs(geo.path, first[0], first[1])) {
                expect(r * 2).toBeGreaterThanOrEqual(chord - 1e-6);
            }
        }
    });

    it("stays inside the box it was dragged to", () => {
        for (const [w, h] of boxes) {
            const geo = getShapeGeometry(shape("cloud", w, h)) as { type: string; path: string };
            const re = /(?:M|A [-\d.]+ [-\d.]+ 0 0 1) ([-\d.]+) ([-\d.]+)/g;
            let m: RegExpExecArray | null;
            while ((m = re.exec(geo.path))) {
                // Geometry is centred on the element, so the box is ±w/2, ±h/2.
                expect(Math.abs(Number(m[1]))).toBeLessThanOrEqual(w / 2 + 0.5);
                expect(Math.abs(Number(m[2]))).toBeLessThanOrEqual(h / 2 + 0.5);
            }
        }
    });

    it("scales with the height, not only the width", () => {
        const short = getShapeGeometry(shape("cloud", 600, 100)) as { path: string };
        const tall = getShapeGeometry(shape("cloud", 600, 400)) as { path: string };
        expect(short.path).not.toBe(tall.path);
    });
});

describe("heart", () => {
    const geo = getShapeGeometry(shape("heart", 220, 190)) as { type: string; path: string };

    it("closes where it started, so `Z` draws nothing", () => {
        // The spike through the notch was `Z` joining the last curve's endpoint
        // back to a start point 15% further down the middle.
        const start = numbersIn(geo.path.slice(0, geo.path.indexOf("C")));
        const lastCurve = geo.path.slice(geo.path.lastIndexOf("C"));
        const end = numbersIn(lastCurve).slice(-2);
        expect(end[0]).toBeCloseTo(start[0], 6);
        expect(end[1]).toBeCloseTo(start[1], 6);
    });

    it("draws each lobe once", () => {
        const curves = geo.path.split("C").slice(1).map((c) => c.trim());
        expect(new Set(curves).size).toBe(curves.length);
        expect(curves).toHaveLength(4);
    });
});

describe("checkmark", () => {
    const geo = getShapeGeometry(shape("checkmark", 200, 160)) as {
        type: string;
        isClosed?: boolean;
        points: { x: number; y: number }[];
    };

    it("is an OPEN three-point tick, not a closed triangle", () => {
        expect(geo.type).toBe("points");
        expect(geo.points).toHaveLength(3);
        expect(geo.isClosed).toBe(false);
    });

    it("goes down to the elbow and up past where it started", () => {
        const [start, elbow, tip] = geo.points;
        expect(elbow.y).toBeGreaterThan(start.y);
        expect(tip.y).toBeLessThan(start.y);
        expect(tip.x).toBeGreaterThan(elbow.x);
    });
});
