import { describe, it, expect } from "bun:test";
import { PathBuilder, DrawContext, runDrawOps, DRAW_METHODS, DRAW_PROPS } from "./draw-context";

const close = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe("PathBuilder — segments", () => {
    it("moveTo/lineTo make corner anchors in absolute coords", () => {
        const b = new PathBuilder();
        b.moveTo(10, 20); b.lineTo(50, 20); b.lineTo(50, 60);
        const sp = b.subpaths();
        expect(sp.length).toBe(1);
        expect(sp[0].closed).toBe(false);
        expect(sp[0].anchors.map(a => [a.x, a.y])).toEqual([[10, 20], [50, 20], [50, 60]]);
        expect(sp[0].anchors.every(a => a.kind === 'corner')).toBe(true);
    });

    it("lineTo with no current point acts as moveTo (canvas semantics)", () => {
        const b = new PathBuilder();
        b.lineTo(5, 5); b.lineTo(15, 5);
        expect(b.subpaths()[0].anchors.map(a => [a.x, a.y])).toEqual([[5, 5], [15, 5]]);
    });

    it("bezierCurveTo stores control points as relative handles", () => {
        const b = new PathBuilder();
        b.moveTo(0, 0); b.bezierCurveTo(10, 0, 20, 10, 20, 20);
        const [a0, a1] = b.subpaths()[0].anchors;
        expect([a0.outX, a0.outY]).toEqual([10, 0]);
        expect([a1.inX, a1.inY]).toEqual([0, -10]);
    });

    it("quadraticCurveTo is elevated to the equivalent cubic", () => {
        const b = new PathBuilder();
        b.moveTo(0, 0); b.quadraticCurveTo(30, 30, 60, 0);
        const [a0, a1] = b.subpaths()[0].anchors;
        close(a0.outX!, 20); close(a0.outY!, 20);
        close(a1.inX!, -20); close(a1.inY!, 20);
    });

    it("closePath drops a duplicate final anchor and keeps its in-handle", () => {
        const b = new PathBuilder();
        b.moveTo(0, 0); b.lineTo(10, 0); b.bezierCurveTo(10, 10, 5, 10, 0, 0); b.closePath();
        const sp = b.subpaths()[0];
        expect(sp.closed).toBe(true);
        expect(sp.anchors.length).toBe(2);
        expect([sp.anchors[0].inX, sp.anchors[0].inY]).toEqual([5, 10]);
    });

    it("a moveTo after closePath starts a new subpath; a lone moveTo is dropped", () => {
        const b = new PathBuilder();
        b.rect(0, 0, 10, 10); b.rect(2, 2, 4, 4); b.moveTo(99, 99);
        const sp = b.subpaths();
        expect(sp.length).toBe(2);
        expect(sp.every(s => s.closed && s.anchors.length === 4)).toBe(true);
    });

    it("relative ops (Cairo rel_*) offset from the current point", () => {
        const b = new PathBuilder();
        b.moveTo(10, 10); b.relLineTo(5, 0); b.relMoveTo(0, 10); b.relLineTo(-5, 0);
        const sp = b.subpaths();
        expect(sp[0].anchors.map(a => [a.x, a.y])).toEqual([[10, 10], [15, 10]]);
        expect(sp[1].anchors.map(a => [a.x, a.y])).toEqual([[15, 20], [10, 20]]);
    });

    it("relMoveTo without a current point throws, like Cairo's NO_CURRENT_POINT", () => {
        expect(() => new PathBuilder().relLineTo(1, 1)).toThrow();
    });
});

describe("PathBuilder — arcs", () => {
    it("a full circle becomes 4 cubic segments on the radius", () => {
        const b = new PathBuilder();
        b.arc(100, 100, 50, 0, Math.PI * 2); b.closePath();
        const sp = b.subpaths()[0];
        expect(sp.closed).toBe(true);
        expect(sp.anchors.length).toBe(4);
        for (const a of sp.anchors) close(Math.hypot(a.x - 100, a.y - 100), 50);
        // kappa handle length for a quarter circle
        const k = 4 / 3 * Math.tan(Math.PI / 8) * 50;
        close(Math.hypot(sp.anchors[0].outX!, sp.anchors[0].outY!), k);
    });

    it("arc draws a line from the current point to the arc start", () => {
        const b = new PathBuilder();
        b.moveTo(0, 0); b.arc(100, 0, 10, 0, Math.PI / 2);
        const pts = b.subpaths()[0].anchors.map(a => [Math.round(a.x), Math.round(a.y)]);
        expect(pts[0]).toEqual([0, 0]);
        expect(pts[1]).toEqual([110, 0]);
        expect(pts[pts.length - 1]).toEqual([100, 10]);
    });

    it("anticlockwise arc sweeps the other way", () => {
        const b = new PathBuilder();
        b.arc(0, 0, 10, 0, Math.PI / 2, true); // 270° the long way round
        const sp = b.subpaths()[0];
        expect(sp.anchors.length).toBe(4); // 3 quarter segments
        close(sp.anchors[1].x, 0); close(sp.anchors[1].y, -10);
    });

    it("arcNegative is Cairo's anticlockwise arc", () => {
        const a = new PathBuilder(); a.arc(0, 0, 10, 0, 1, true);
        const b = new PathBuilder(); b.arcNegative(0, 0, 10, 0, 1);
        expect(b.subpaths()).toEqual(a.subpaths());
    });

    it("ellipse scales the circle arc per axis", () => {
        const b = new PathBuilder();
        b.ellipse(0, 0, 40, 20, 0, 0, Math.PI * 2); b.closePath();
        const xs = b.subpaths()[0].anchors.map(a => a.x), ys = b.subpaths()[0].anchors.map(a => a.y);
        close(Math.max(...xs), 40); close(Math.max(...ys), 20);
    });
});

describe("PathBuilder — transforms", () => {
    it("translate/scale/rotate apply to points and handles, save/restore scopes them", () => {
        const b = new PathBuilder();
        b.save();
        b.translate(100, 0); b.rotate(Math.PI / 2); b.scale(2, 2);
        b.moveTo(0, 0); b.bezierCurveTo(10, 0, 10, 0, 10, 0);
        b.restore();
        b.moveTo(0, 0); b.lineTo(1, 0);
        const [first, second] = b.subpaths();
        close(first.anchors[0].x, 100); close(first.anchors[0].y, 0);
        close(first.anchors[1].x, 100); close(first.anchors[1].y, 20);
        close(first.anchors[0].outX!, 0); close(first.anchors[0].outY!, 20);
        expect(second.anchors.map(a => [a.x, a.y])).toEqual([[0, 0], [1, 0]]);
    });

    it("the current point is reported in user space (Cairo get_current_point)", () => {
        const b = new PathBuilder();
        b.translate(50, 50); b.moveTo(5, 5);
        expect(b.currentPoint()).toEqual({ x: 5, y: 5 });
    });
});

describe("runDrawOps — the data form", () => {
    it("replays method calls and property sets onto a target", () => {
        const calls: unknown[] = [];
        const target: any = { fillStyle: '', moveTo: (...a: number[]) => calls.push(['moveTo', ...a]), fill: () => calls.push(['fill']) };
        runDrawOps(target, [['fillStyle', 'red'], ['moveTo', 1, 2], ['fill']], ['fillStyle'], ['moveTo', 'fill']);
        expect(target.fillStyle).toBe('red');
        expect(calls).toEqual([['moveTo', 1, 2], ['fill']]);
    });

    it("rejects unknown ops instead of calling arbitrary members", () => {
        const target: any = { paint: () => {}, moveTo: () => {} };
        expect(() => runDrawOps(target, [['constructor']], [], ['moveTo'])).toThrow(/unknown op/);
        expect(() => runDrawOps(target, [['__proto__', {}]], [], ['moveTo'])).toThrow(/unknown op/);
        expect(() => runDrawOps(target, [['paint', 'fill']], [], ['moveTo'])).toThrow(/unknown op/);
    });
});

describe("DrawContext — painting", () => {
    const recorder = () => {
        const log: { paint: string; merge: string | null; n: number; style: any }[] = [];
        let next = 0;
        const emit = (sp: any[], paint: any, style: any, merge: string | null) => { log.push({ paint, merge, n: sp.length, style }); return merge ?? `e${next++}`; };
        return { log, emit };
    };

    it("fill then stroke on the same path makes ONE element", () => {
        const { log, emit } = recorder();
        const c = new DrawContext(emit);
        c.rect(0, 0, 10, 10); c.fill(); c.stroke();
        expect(c.ids).toEqual(['e0']);
        expect(log.map(l => [l.paint, l.merge])).toEqual([['fill', null], ['stroke', 'e0']]);
    });

    it("canvas mode keeps the path after fill; cairo mode clears it", () => {
        const a = recorder(), ca = new DrawContext(a.emit);
        ca.rect(0, 0, 1, 1); ca.fill(); ca.rect(5, 5, 1, 1); ca.fill();
        expect(a.log[1].n).toBe(2); // canvas: both rects, no beginPath in between
        const b = recorder(), cb = new DrawContext(b.emit, true);
        cb.rect(0, 0, 1, 1); cb.fill(); cb.rect(5, 5, 1, 1); cb.fill();
        expect(b.log[1].n).toBe(1);
    });

    it("cairo fillPreserve + stroke still merges into one element", () => {
        const { emit } = recorder();
        const c = new DrawContext(emit, true);
        c.arc(0, 0, 5, 0, Math.PI * 2); c.fillPreserve(); c.stroke();
        expect(c.ids.length).toBe(1);
    });

    it("setSourceRgba sets both colours as hex, save/restore scopes paint state", () => {
        const c = new DrawContext(() => 'x');
        c.save(); c.setSourceRgba(1, 0, 0, 0.5); c.lineWidth = 7;
        expect(c.fillStyle).toBe('#ff000080'); expect(c.strokeStyle).toBe('#ff000080');
        c.restore();
        expect(c.fillStyle).toBe('#000000'); expect(c.lineWidth).toBe(1);
    });

    it("fillRect paints its own rect and leaves the current path alone", () => {
        const { log, emit } = recorder();
        const c = new DrawContext(emit);
        c.moveTo(0, 0); c.lineTo(50, 50);
        c.fillRect(100, 100, 10, 10);
        expect(log[0].n).toBe(1);
        expect(c.subpaths()[0].anchors.map(a => [a.x, a.y])).toEqual([[0, 0], [50, 50]]);
    });

    it("line cap/join default to canvas butt/miter, save/restore them, and ignore bad values", () => {
        const { log, emit } = recorder();
        const c = new DrawContext(emit);
        c.moveTo(0, 0); c.lineTo(9, 9); c.stroke();
        expect([log[0].style.lineCap, log[0].style.lineJoin]).toEqual(['butt', 'miter']);
        c.save(); c.setLineCap('round'); c.lineJoin = 'nonsense' as any; c.beginPath(); c.moveTo(0, 0); c.lineTo(1, 1); c.stroke(); c.restore();
        expect([log[1].style.lineCap, log[1].style.lineJoin]).toEqual(['round', 'miter']);
        expect(c.lineCap).toBe('butt');
    });

    it("painting an empty path emits nothing", () => {
        const { log, emit } = recorder();
        const c = new DrawContext(emit);
        c.fill(); c.moveTo(1, 1); c.stroke();
        expect(log.length).toBe(0);
    });

    it("every allowlisted op exists on DrawContext", () => {
        const c: any = new DrawContext(() => 'x');
        for (const m of DRAW_METHODS) expect(typeof c[m]).toBe('function');
        for (const p of DRAW_PROPS) expect(p in c).toBe(true);
    });
});
