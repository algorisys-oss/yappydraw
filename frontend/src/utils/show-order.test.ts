import { describe, it, expect } from "bun:test";
import { firstShowIndex, nextShowIndex, prevShowIndex } from "./show-order";

const deck = (...hidden: boolean[]) => hidden.map(h => ({ hidden: h }));

describe("show order", () => {
    it("skips hidden slides both ways", () => {
        const s = deck(false, true, true, false, false);
        expect(nextShowIndex(s, 0)).toBe(3);
        expect(prevShowIndex(s, 3)).toBe(0);
        expect(nextShowIndex(s, 4)).toBeNull();
        expect(prevShowIndex(s, 0)).toBeNull();
    });
    it("starts on the first slide that isn't hidden", () => {
        expect(firstShowIndex(deck(true, true, false))).toBe(2);
        expect(firstShowIndex(deck(true, true))).toBe(0);
    });
    it("loops from the last shown slide to the first shown one", () => {
        const s = deck(true, false, false, true);
        expect(nextShowIndex(s, 2, true)).toBe(1);
        expect(nextShowIndex(s, 2, false)).toBeNull();
        expect(nextShowIndex(deck(false), 0, true)).toBe(0);   // one slide: start it again
    });
    it("a show standing on a hidden slide (reached by a link) moves on to the next shown one", () => {
        expect(nextShowIndex(deck(false, true, false), 1)).toBe(2);
        expect(prevShowIndex(deck(false, true, false), 1)).toBe(0);
    });
});
