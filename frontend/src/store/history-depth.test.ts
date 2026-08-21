/**
 * Undo history depth — one range, enforced on every route in.
 *
 * The bug this pins: the Settings input advertised `min="10"` while its own change handler
 * clamped with `Math.max(1, …)`, and `Yappy.setHistoryDepth()` had no ceiling at all. Typing
 * `3` into the field was accepted and stored, so the control's stated constraint and its real
 * one disagreed. Three routes set this value — the dialog, the API, and a hand-edited
 * localStorage entry — and a clamp that lives at only one of them is not a clamp.
 */
import { describe, it, expect, mock, beforeEach } from "bun:test";

mock.module("../components/toast", () => ({ showToast: () => { } }));

const memStore: Record<string, string> = {};
global.window = {
    innerWidth: 1024, innerHeight: 768,
    addEventListener: () => { }, removeEventListener: () => { },
} as any;
global.localStorage = {
    getItem: (k: string) => (k in memStore ? memStore[k] : null),
    setItem: (k: string, v: string) => { memStore[k] = v; },
    removeItem: (k: string) => { delete memStore[k]; },
} as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } } }
} as any;

const {
    store, updateGlobalSettings, clampHistoryDepth,
    HISTORY_DEPTH_MIN, HISTORY_DEPTH_MAX, HISTORY_DEPTH_DEFAULT,
} = await import("./app-store");

beforeEach(() => { updateGlobalSettings({ historyDepth: HISTORY_DEPTH_DEFAULT }); });

describe("clampHistoryDepth", () => {
    it("keeps values inside the advertised range", () => {
        for (const n of [10, 50, 200, 500]) expect(clampHistoryDepth(n)).toBe(n);
    });

    it("raises values below the floor — the case the UI claimed to reject and did not", () => {
        expect(clampHistoryDepth(3)).toBe(HISTORY_DEPTH_MIN);
        expect(clampHistoryDepth(1)).toBe(HISTORY_DEPTH_MIN);
        expect(clampHistoryDepth(0)).toBe(HISTORY_DEPTH_MIN);
        expect(clampHistoryDepth(-20)).toBe(HISTORY_DEPTH_MIN);
    });

    it("caps values above the ceiling — each state is a full document snapshot", () => {
        expect(clampHistoryDepth(501)).toBe(HISTORY_DEPTH_MAX);
        expect(clampHistoryDepth(50_000)).toBe(HISTORY_DEPTH_MAX);
    });

    it("rounds fractions rather than storing them", () => {
        expect(clampHistoryDepth(50.4)).toBe(50);
        expect(clampHistoryDepth(50.6)).toBe(51);
    });

    it("falls back to the default on a value that is not a number", () => {
        expect(clampHistoryDepth(NaN)).toBe(HISTORY_DEPTH_DEFAULT);
        expect(clampHistoryDepth(Infinity)).toBe(HISTORY_DEPTH_DEFAULT);
    });
});

describe("the clamp applies on the way in, not just on the way to disk", () => {
    it("stores the clamped value in memory", () => {
        updateGlobalSettings({ historyDepth: 3 });
        expect(store.globalSettings.historyDepth).toBe(HISTORY_DEPTH_MIN);
        updateGlobalSettings({ historyDepth: 9999 });
        expect(store.globalSettings.historyDepth).toBe(HISTORY_DEPTH_MAX);
    });

    it("keeps memory and localStorage in agreement", () => {
        updateGlobalSettings({ historyDepth: 2 });
        expect(localStorage.getItem('historyDepth')).toBe(String(store.globalSettings.historyDepth));
        expect(localStorage.getItem('historyDepth')).toBe(String(HISTORY_DEPTH_MIN));
    });

    it("leaves other settings untouched — the normalisation must not drop keys", () => {
        updateGlobalSettings({ historyDepth: 120, showDimensions: true });
        expect(store.globalSettings.historyDepth).toBe(120);
        expect(store.globalSettings.showDimensions).toBe(true);
    });
});
