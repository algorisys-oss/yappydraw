/**
 * The panel must stay on screen from every dock position — left, right, top, bottom and
 * floating — because the toolbar it hangs off can be at any of them.
 */
import { describe, it, expect } from "bun:test";
import { placeBesideAnchor } from "./popover-placement";

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
