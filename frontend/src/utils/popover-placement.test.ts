/**
 * The panel must stay on screen from every dock position — left, right, top, bottom and
 * floating — because the toolbar it hangs off can be at any of them.
 */
import { describe, it, expect } from "bun:test";
import { placeBesideAnchor, placeFlyout } from "./popover-placement";

const VIEW = { width: 1000, height: 700 };
const W = 248, H = 420;
const box = (left: number, top: number, size = 28): { left: number; top: number; right: number; bottom: number } =>
    ({ left, top, right: left + size, bottom: top + size });

describe("placeBesideAnchor", () => {
    it("opens to the right of a left-docked bar", () => {
        expect(placeBesideAnchor(box(4, 100), W, H, VIEW)).toEqual({ left: 40, top: 100 });
    });

    it("flips to the left of a right-docked bar rather than running off the edge", () => {
        const anchor = box(VIEW.width - 32, 100);
        const { left } = placeBesideAnchor(anchor, W, H, VIEW);
        expect(left).toBe(anchor.left - 8 - W);
        expect(left + W).toBeLessThanOrEqual(VIEW.width - 8);
    });

    it("slides up for a control near the bottom, so the panel is not cut off", () => {
        const { top } = placeBesideAnchor(box(4, VIEW.height - 40), W, H, VIEW);
        expect(top + H).toBeLessThanOrEqual(VIEW.height - 8);
    });

    it("pins to the top when the panel is taller than the viewport", () => {
        // maxTop goes negative here; the margin has to win or the panel starts off screen.
        expect(placeBesideAnchor(box(4, 100), W, 900, VIEW).top).toBe(8);
    });

    it("stays on a phone screen, where neither side has room", () => {
        const phone = { width: 380, height: 760 };
        const anchor = box(170, 700, 40); // bottom-docked strip, mid-width
        const { left, top } = placeBesideAnchor(anchor, 320, 420, phone);
        expect(left).toBeGreaterThanOrEqual(8);
        expect(left + 320).toBeLessThanOrEqual(phone.width - 8);
        expect(top).toBeGreaterThanOrEqual(8);
        expect(top + 420).toBeLessThanOrEqual(phone.height - 8);
    });
});

/**
 * The tool-group flyouts (Shapes, Pen, UML, …) had their own hard-coded "below the button,
 * left-aligned" rule in seventeen copies, which only holds while the toolbar is docked
 * left or top. Docked right or bottom the panels opened off-screen and their tools could
 * not be reached at all (user feedback, Aug 2026).
 */
describe("placeFlyout", () => {
    const FW = 216, FH = 120;
    const panel = { width: FW, height: FH };
    const place = (anchor: ReturnType<typeof box>) => placeFlyout(anchor, panel, VIEW);

    it("opens below and left-aligned for a left-docked column (the behaviour that worked)", () => {
        const anchor = box(4, 200, 36);
        expect(place(anchor)).toEqual({ left: 4, top: anchor.bottom + 4 });
    });

    it("opens below for a top-docked bar", () => {
        const anchor = box(300, 8, 36);
        expect(place(anchor)).toEqual({ left: 300, top: anchor.bottom + 4 });
    });

    it("opens BESIDE a right-docked column instead of under it", () => {
        // Clamping alone would slide the panel back inside the window but leave it sitting
        // on top of the toolbar, covering the buttons it belongs to.
        const anchor = box(VIEW.width - 40, 200, 36);
        const p = place(anchor);
        expect(p.left + FW).toBeLessThanOrEqual(anchor.left);   // clear of the bar
        expect(p.left).toBeGreaterThanOrEqual(8);
        expect(p.top).toBe(anchor.top);
    });

    it("flips above a bottom-docked bar", () => {
        const anchor = box(300, VIEW.height - 44, 36);
        const p = place(anchor);
        expect(p.top + FH).toBeLessThanOrEqual(anchor.top);
        expect(p.left).toBe(300);
    });

    it("never leaves the viewport, wherever the anchor is", () => {
        for (const x of [0, 4, 200, VIEW.width / 2, VIEW.width - 40, VIEW.width - 4]) {
            for (const y of [0, 4, 200, VIEW.height / 2, VIEW.height - 44, VIEW.height - 4]) {
                const p = place(box(x, y, 36));
                expect(p.left).toBeGreaterThanOrEqual(0);
                expect(p.top).toBeGreaterThanOrEqual(0);
                expect(p.left + FW).toBeLessThanOrEqual(VIEW.width);
                expect(p.top + FH).toBeLessThanOrEqual(VIEW.height);
            }
        }
    });

    it("shows as much as it can of a panel too big for the window, rather than hiding it", () => {
        const huge = { width: VIEW.width + 200, height: VIEW.height + 200 };
        const p = placeFlyout(box(500, 300, 36), huge, VIEW);
        expect(p.left).toBe(8);
        expect(p.top).toBe(8);
    });
});
