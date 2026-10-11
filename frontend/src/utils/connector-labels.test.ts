import { describe, it, expect, afterEach } from "bun:test";
import type { DrawingElement } from "../types";
import { connectorLabelPlacement, setLabelScene, clearLabelScene, estimateLabelSize } from "./connector-labels";

const measure = (text: string) => ({ w: text.length * 7, h: 16 });
function elbow(id: string, pts: [number, number][], extra: Partial<DrawingElement> = {}): DrawingElement {
    const [ox, oy] = pts[0]; const [ex, ey] = pts[pts.length - 1];
    return { id, type: 'arrow', curveType: 'elbow', x: ox, y: oy, width: ex - ox, height: ey - oy, points: pts.flatMap(([x, y]) => [x - ox, y - oy]), containerText: 'label', fontSize: 14, ...extra } as unknown as DrawingElement;
}
afterEach(() => clearLabelScene());

describe("connectorLabelPlacement", () => {
    it("puts an elbow label at the centre of the run under the midpoint, not on a bend", () => {
        // Short first leg, long middle run, short last leg: midpoint is on the middle run.
        const c = elbow("c1", [[0, 0], [0, 20], [300, 20], [300, 40]]);
        const p = connectorLabelPlacement(c, measure);
        expect(p.y).toBe(20);
        expect(p.x).toBe(150);
    });

    it("moves to the longest run when the midpoint run cannot hold the text", () => {
        // 95 + 10 + 95: the midpoint (100) falls on the 10px jog; the first 95px run takes the label.
        const c = elbow("c1", [[0, 0], [95, 0], [95, 10], [190, 10]]);
        const p = connectorLabelPlacement(c, () => ({ w: 60, h: 16 }));
        expect(p.x).toBe(47.5);
        expect(p.y).toBe(0);
    });

    it("honours Label Position start / end along the path", () => {
        const c = elbow("c1", [[0, 0], [100, 0], [100, 100]]);
        const s = connectorLabelPlacement({ ...c, labelPosition: 'start' } as DrawingElement, measure);
        const e = connectorLabelPlacement({ ...c, labelPosition: 'end' } as DrawingElement, measure);
        expect(s).toMatchObject({ x: 30, y: 0 });       // 15% of 200
        expect(e).toMatchObject({ x: 100, y: 70 });     // 85% of 200
    });

    it("keeps a straight connector's label at its midpoint", () => {
        const c = { id: 'c1', type: 'arrow', curveType: 'straight', x: 0, y: 0, width: 200, height: 0, points: [0, 0, 200, 0], containerText: 'hi', fontSize: 14 } as unknown as DrawingElement;
        expect(connectorLabelPlacement(c, measure)).toMatchObject({ x: 100, y: 0 });
    });

    it("slides a later label out from under an earlier one", () => {
        const a = elbow("c1", [[0, 100], [300, 100]]);
        const b = elbow("c2", [[0, 100], [300, 100]]);   // same run, same label → would overlap
        setLabelScene([a, b]);
        const pa = connectorLabelPlacement(a, measure);
        const pb = connectorLabelPlacement(b, measure);
        expect(pa).toMatchObject({ x: 150, y: 100 });
        expect(pb.x !== 150 || pb.y !== 100).toBe(true);
        const meet = pa.box.x < pb.box.x + pb.box.w && pa.box.x + pa.box.w > pb.box.x && pa.box.y < pb.box.y + pb.box.h && pa.box.y + pa.box.h > pb.box.y;
        expect(meet).toBe(false);
    });

    it("leaves the earlier label where it was (lanes are allocated in id order)", () => {
        const a = elbow("c1", [[0, 100], [300, 100]]);
        const b = elbow("c2", [[0, 100], [300, 100]]);
        setLabelScene([b, a]);
        expect(connectorLabelPlacement(a, measure)).toMatchObject({ x: 150, y: 100 });
    });

    it("estimateLabelSize scales with font and lines", () => {
        const el = { fontSize: 20 } as DrawingElement;
        expect(estimateLabelSize('ab\ncdef', el)).toEqual({ w: 4 * 20 * 0.55, h: 2 * 20 * 1.3 });
    });
});
