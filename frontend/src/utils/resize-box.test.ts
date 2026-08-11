import { describe, it, expect } from "bun:test";
import { computeResizeBox, type ResizeBox } from "./resize-box";

/** 100×100 box at the origin — centre (50,50). */
const initial: ResizeBox = { x: 0, y: 0, width: 100, height: 100 };

const resize = (handle: string, dx: number, dy: number, opts: Partial<{ constrain: boolean; fromCenter: boolean; angle: number; initial: ResizeBox }> = {}) =>
    computeResizeBox({
        handle, dx, dy,
        initial: opts.initial ?? initial,
        constrain: opts.constrain ?? false,
        fromCenter: opts.fromCenter ?? false,
        angle: opts.angle ?? 0,
    });

const box = (b: ResizeBox) => [b.x, b.y, b.width, b.height];

describe("free resize — the opposite anchor stays pinned", () => {
    it("br grows right/down and leaves the top-left alone", () => {
        expect(box(resize('br', 50, 30))).toEqual([0, 0, 150, 130]);
    });

    it("tl moves the origin and shrinks toward the fixed bottom-right", () => {
        expect(box(resize('tl', 20, 20))).toEqual([20, 20, 80, 80]);
    });

    it("side handles move one axis only", () => {
        expect(box(resize('rm', 40, 999))).toEqual([0, 0, 140, 100]);
        expect(box(resize('bm', 999, 40))).toEqual([0, 0, 100, 140]);
        expect(box(resize('lm', 20, 0))).toEqual([20, 0, 80, 100]);
        expect(box(resize('tm', 0, 20))).toEqual([0, 20, 100, 80]);
    });
});

describe("Shift — proportional resize", () => {
    it("locks a corner drag to the original aspect ratio", () => {
        // Square: the larger delta wins, the other axis follows.
        expect(box(resize('br', 60, 20, { constrain: true }))).toEqual([0, 0, 160, 160]);
    });

    it("keeps a non-square ratio", () => {
        const wide: ResizeBox = { x: 0, y: 0, width: 200, height: 100 }; // ratio 2
        const r = resize('br', 100, 0, { constrain: true, initial: wide });
        expect(r.width / r.height).toBeCloseTo(2, 10);
    });

    it("a side handle grows the other axis about the centre line", () => {
        // rm: width 100→140, so height must follow to 140, centred on cy0=50.
        expect(box(resize('rm', 40, 0, { constrain: true }))).toEqual([0, -20, 140, 140]);
    });

    it("tl stays pinned to the bottom-right corner", () => {
        const r = resize('tl', 20, 20, { constrain: true });
        expect(r.x + r.width).toBeCloseTo(100, 10);
        expect(r.y + r.height).toBeCloseTo(100, 10);
    });
});

describe("Alt+Shift — proportional, about the centre", () => {
    const opts = { constrain: true, fromCenter: true };

    it("grows equally on all sides — the centre never moves", () => {
        const r = resize('br', 25, 25, opts);
        expect(r.x + r.width / 2).toBeCloseTo(50, 10);
        expect(r.y + r.height / 2).toBeCloseTo(50, 10);
    });

    it("doubles the size delta, because both edges move", () => {
        // br dragged +25: right edge +25 AND left edge -25 → width 100→150.
        expect(box(resize('br', 25, 25, opts))).toEqual([-25, -25, 150, 150]);
    });

    it("shrinks about the centre too", () => {
        expect(box(resize('br', -25, -25, opts))).toEqual([25, 25, 50, 50]);
    });

    it("holds the aspect ratio of a non-square box", () => {
        const wide: ResizeBox = { x: 0, y: 0, width: 200, height: 100 };
        const r = resize('br', 50, 0, { ...opts, initial: wide });
        expect(r.width / r.height).toBeCloseTo(2, 10);
        expect(r.x + r.width / 2).toBeCloseTo(100, 10);
        expect(r.y + r.height / 2).toBeCloseTo(50, 10);
    });

    it("every handle scales about the centre, including the far corners", () => {
        for (const handle of ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm']) {
            const r = resize(handle, 20, 20, opts);
            expect(`${handle}:${r.x + r.width / 2}`).toBe(`${handle}:50`);
            expect(`${handle}:${r.y + r.height / 2}`).toBe(`${handle}:50`);
        }
    });

    it("centres a rotated element on its ORIGINAL centre (no anchor correction)", () => {
        // Rotation happens about the box centre, so holding the centre fixed is
        // already correct in world space — the pinned-anchor maths must not run.
        const r = resize('br', 25, 25, { ...opts, angle: Math.PI / 4 });
        expect(r.x + r.width / 2).toBeCloseTo(50, 10);
        expect(r.y + r.height / 2).toBeCloseTo(50, 10);
    });
});

describe("Alt+Shift does not disturb the un-modified paths", () => {
    it("fromCenter:false reproduces the classic pinned-anchor behaviour", () => {
        expect(box(resize('br', 50, 30, { fromCenter: false }))).toEqual([0, 0, 150, 130]);
    });

    it("a rotated free resize still pins the opposite corner in world space", () => {
        // br on a 90°-rotated box: the world position of the tl anchor must hold.
        const angle = Math.PI / 2;
        const r = resize('br', 40, 0, { angle });
        const c = Math.cos(angle), s = Math.sin(angle);
        const worldAnchor = (b: ResizeBox) => {
            const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
            const hw = b.width / 2, hh = b.height / 2;
            return [cx + (-hw) * c - (-hh) * s, cy + (-hw) * s + (-hh) * c];
        };
        const before = worldAnchor(initial);
        const after = worldAnchor(r);
        expect(after[0]).toBeCloseTo(before[0], 10);
        expect(after[1]).toBeCloseTo(before[1], 10);
    });
});
