import { describe, it, expect, afterEach } from "bun:test";
import type { DrawingElement } from "../types";
import { setJumpScene, clearJumpScene, lineJumpsFor, JUMP_RADIUS } from "./connector-jumps";
import { connectorGeometry, elbowPathCommands } from "./connector-geometry";

/** A straight or elbow connector through world-space points. */
function conn(id: string, pts: [number, number][], curveType: 'straight' | 'elbow' = 'elbow'): DrawingElement {
    const [ox, oy] = pts[0];
    const [ex, ey] = pts[pts.length - 1];
    return { id, type: 'arrow', curveType, x: ox, y: oy, width: ex - ox, height: ey - oy, points: pts.flatMap(([x, y]) => [x - ox, y - oy]) } as unknown as DrawingElement;
}

afterEach(() => clearJumpScene());

describe("lineJumpsFor", () => {
    const h = conn("c1", [[0, 100], [300, 100]]);          // horizontal, lower id
    const v = conn("c2", [[150, 0], [150, 200]]);          // vertical, higher id → jumps

    it("is empty with no scene, and when jumps are disabled", () => {
        expect(lineJumpsFor(v)).toEqual([]);
        setJumpScene([h, v], false);
        expect(lineJumpsFor(v)).toEqual([]);
    });

    it("gives the higher-id connector one jump at the crossing, the lower-id one none", () => {
        setJumpScene([h, v], true);
        const j = lineJumpsFor(v);
        expect(j.length).toBe(1);
        expect(j[0]).toMatchObject({ seg: 0, x: 150, y: 100 });
        expect(j[0].t).toBeCloseTo(0.5, 6);
        expect(lineJumpsFor(h)).toEqual([]);
    });

    it("ignores parallel runs, touching ends and curves", () => {
        const parallel = conn("c3", [[0, 100], [300, 100]]);           // same line as h
        const touching = conn("c4", [[300, 100], [300, 300]]);         // starts where h ends
        const curve = { ...conn("c5", [[150, 0], [150, 200]]), curveType: 'bezier' } as unknown as DrawingElement;
        setJumpScene([h, parallel, touching, curve], true);
        expect(lineJumpsFor(parallel)).toEqual([]);
        expect(lineJumpsFor(touching)).toEqual([]);
        expect(lineJumpsFor(curve)).toEqual([]);
    });

    it("skips a crossing too close to a bend or end to fit the arc", () => {
        const near = conn("c9", [[150, 95], [150, 300]]);              // crosses h 5px after its start
        setJumpScene([h, near], true);
        expect(lineJumpsFor(near)).toEqual([]);
    });

    it("orders several crossings along the run and merges ones closer than a diameter", () => {
        const v1 = conn("a1", [[100, 0], [100, 200]]);
        const v2 = conn("a2", [[200, 0], [200, 200]]);
        const v3 = conn("a3", [[203, 0], [203, 200]]);                  // 3px from v2
        const hh = conn("z9", [[0, 100], [300, 100]]);                  // highest id → jumps all
        setJumpScene([v1, v2, v3, hh], true);
        const j = lineJumpsFor(hh);
        expect(j.map(p => Math.round(p.x))).toEqual([100, 200]);
    });
});

describe("jump arcs in the path", () => {
    it("replaces the crossing with a cubic bump of radius JUMP_RADIUS on the left of travel", () => {
        const cmds = elbowPathCommands([{ x: 0, y: 100 }, { x: 300, y: 100 }], 0, [{ seg: 0, t: 0.5, x: 150, y: 100 }]);
        const c = cmds.find(k => k.c === 'C') as any;
        expect(c).toBeDefined();
        expect(c.x).toBe(150 + JUMP_RADIUS);
        const before = cmds[cmds.indexOf(c) - 1] as any;
        expect(before).toMatchObject({ c: 'L', x: 150 - JUMP_RADIUS, y: 100 });
        expect(c.y1).toBeLessThan(100);                                  // bulges upward on a left→right run
        expect(cmds[cmds.length - 1]).toMatchObject({ c: 'L', x: 300, y: 100 });
    });

    it("keeps a rounded bend and a jump on the same elbow", () => {
        const cmds = elbowPathCommands([{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }], 8, [{ seg: 1, t: 0.5, x: 200, y: 100 }]);
        expect(cmds.filter(k => k.c === 'Q').length).toBe(1);
        expect(cmds.filter(k => k.c === 'C').length).toBe(1);
    });

    it("reaches connectorGeometry: the higher-id straight connector's d contains the arc, the lower's does not", () => {
        const h = conn("c1", [[0, 100], [300, 100]], 'straight');
        const v = conn("c2", [[150, 0], [150, 200]], 'straight');
        setJumpScene([h, v], true);
        expect(connectorGeometry(v).d).toContain(' C ');
        expect(connectorGeometry(h).d).not.toContain(' C ');
        // Arrowhead angles are untouched by the arc.
        expect(connectorGeometry(v).endAngle).toBeCloseTo(Math.PI / 2, 6);
    });
});
