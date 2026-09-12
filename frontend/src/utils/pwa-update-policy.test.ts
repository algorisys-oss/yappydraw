import { describe, it, expect } from "bun:test";
import { shouldAutoApply, HIDDEN_GRACE_MS } from "./pwa-update-policy";

const base = { waiting: true, visible: false, hiddenForMs: HIDDEN_GRACE_MS, busy: false };

describe("shouldAutoApply", () => {
    it("applies once a waiting build has sat in a hidden tab for the grace period", () => {
        expect(shouldAutoApply(base)).toBe(true);
    });

    it("never applies while the tab is on screen", () => {
        // The whole point of `prompt` over `autoUpdate`: a drawing app must not
        // reload under someone's hands, however stale the build they are on.
        expect(shouldAutoApply({ ...base, visible: true })).toBe(false);
        expect(shouldAutoApply({ ...base, visible: true, hiddenForMs: 24 * 60 * 60 * 1000 })).toBe(false);
    });

    it("does not fire for a quick glance at another tab", () => {
        expect(shouldAutoApply({ ...base, hiddenForMs: 0 })).toBe(false);
        expect(shouldAutoApply({ ...base, hiddenForMs: HIDDEN_GRACE_MS - 1 })).toBe(false);
    });

    it("never applies while a recording is running, however long the tab is hidden", () => {
        // A recording is wall-clock work with no autosave behind it — a reload
        // destroys it outright. Checked before the grace period so being busy
        // cannot simply be outwaited.
        expect(shouldAutoApply({ ...base, busy: true })).toBe(false);
        expect(shouldAutoApply({ ...base, busy: true, hiddenForMs: 24 * 60 * 60 * 1000 })).toBe(false);
    });

    it("does nothing when no build is waiting", () => {
        expect(shouldAutoApply({ ...base, waiting: false })).toBe(false);
    });
});
