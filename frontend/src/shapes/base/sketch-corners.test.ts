/**
 * Sketch corners land on the corner.
 *
 * RoughJS jitters the ENDPOINTS of every segment, so without `preserveVertices`
 * adjacent edges stop sharing a vertex: one overshoots, the next starts short,
 * and since each edge is stroked twice the step is drawn twice. Reported from a
 * zoomed-in screen recording of a parallelogram (issue: "is it supposed to be
 * this way at the ends?").
 *
 * The assertion is geometric rather than "the flag is set": it builds the real
 * render options and measures how far the generated path's endpoints land from
 * the vertices they were asked to draw. That is what a reader sees, and it stays
 * true if the option is ever renamed.
 */

import { describe, it, expect } from "bun:test";
import { RoughGenerator } from "roughjs/bin/generator";
import { RenderPipeline } from "./render-pipeline";
import type { DrawingElement } from "../../types";

const element = (over: Partial<DrawingElement> = {}): DrawingElement =>
    ({
        id: "e1",
        type: "parallelogram",
        x: 0,
        y: 0,
        width: 129.77,
        height: 102.17,
        strokeColor: "#6741D9",
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 4,
        strokeStyle: "solid",
        roughness: 1,
        seed: 1,
        opacity: 100,
        angle: 0,
        renderStyle: "sketch",
        ...over,
    }) as DrawingElement;

/** The parallelogram the report was drawn with. */
const points = (el: DrawingElement): [number, number][] => {
    const off = el.width * 0.2;
    return [
        [el.x + off, el.y],
        [el.x + el.width, el.y],
        [el.x + el.width - off, el.y + el.height],
        [el.x, el.y + el.height],
    ];
};

/** Furthest any declared vertex sits from the nearest point RoughJS actually drew. */
const worstCornerError = (el: DrawingElement): number => {
    const opts = RenderPipeline.buildRenderOptions(el, false);
    const drawable = new RoughGenerator().polygon(points(el), opts as never);

    const ends: [number, number][] = [];
    for (const set of drawable.sets.filter((s) => s.type === "path")) {
        for (const op of set.ops) {
            if (op.op === "move") ends.push([op.data[0], op.data[1]]);
            if (op.op === "bcurveTo") ends.push([op.data[4], op.data[5]]);
        }
    }

    return Math.max(
        ...points(el).map(([px, py]) =>
            Math.min(...ends.map(([ex, ey]) => Math.hypot(ex - px, ey - py))),
        ),
    );
};

describe("sketch corners", () => {
    it("draws each corner ON the corner, at every sloppiness", () => {
        // Before `preserveVertices` this was 0.43 / 0.85 / 1.71 world px — and the
        // wobble is generated in world space, so a 5x zoom showed 5x the gap.
        for (const roughness of [0.5, 1, 2, 3]) {
            expect(worstCornerError(element({ roughness }))).toBeCloseTo(0, 5);
        }
    });

    it("still wobbles between the corners — the point is a hand-drawn EDGE", () => {
        const el = element({ roughness: 2 });
        const opts = RenderPipeline.buildRenderOptions(el, false);
        const clean = RenderPipeline.buildRenderOptions(element({ roughness: 0 }), false);
        const gen = new RoughGenerator();

        const controlPoints = (o: unknown) =>
            gen
                .polygon(points(el), o as never)
                .sets.filter((s) => s.type === "path")
                .flatMap((s) => s.ops.filter((op) => op.op === "bcurveTo").map((op) => op.data.join(",")));

        expect(controlPoints(opts)).not.toEqual(controlPoints(clean));
    });

    it("keeps a straight edge straight at sloppiness 0", () => {
        expect(worstCornerError(element({ roughness: 0 }))).toBeCloseTo(0, 5);
        expect(RenderPipeline.buildRenderOptions(element({ roughness: 0 }), false).disableMultiStroke).toBe(true);
    });
});
