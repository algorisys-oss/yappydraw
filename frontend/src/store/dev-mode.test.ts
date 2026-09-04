/**
 * Dev Mode — the switch that reveals work-in-progress surfaces (today the Game group).
 *
 * Three properties matter and none of them is visible from the UI, so they are pinned here:
 *   1. It is OFF unless asked for. A default that leaked would put unfinished tools in
 *      front of every user, which is the whole thing this setting exists to prevent.
 *   2. It survives a reload — it is an app-level preference in localStorage, like
 *      `teachingMode`, not a property of the drawing.
 *   3. A loaded document CANNOT set it. `loadDocument` merges the document's
 *      `globalSettings`, so without an explicit override a file someone sent you would
 *      unlock unfinished features on your machine.
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

const { store, isDevMode, readDevMode, updateGlobalSettings, loadDocument } = await import("./app-store");

beforeEach(() => {
    updateGlobalSettings({ devMode: false });
});

describe("dev mode", () => {
    it("is off by default", () => {
        delete memStore['devMode'];
        expect(readDevMode()).toBe(false);
        expect(isDevMode()).toBe(false);
    });

    it("turns on and off through updateGlobalSettings", () => {
        updateGlobalSettings({ devMode: true });
        expect(isDevMode()).toBe(true);
        expect(store.globalSettings.devMode).toBe(true);

        updateGlobalSettings({ devMode: false });
        expect(isDevMode()).toBe(false);
    });

    it("persists to localStorage so it survives a reload", () => {
        updateGlobalSettings({ devMode: true });
        expect(memStore['devMode']).toBe('1');
        expect(readDevMode()).toBe(true);

        updateGlobalSettings({ devMode: false });
        expect(memStore['devMode']).toBe('0');
        expect(readDevMode()).toBe(false);
    });

    it("reads only an explicit '0'/'1', treating a missing key as off", () => {
        delete memStore['devMode'];
        expect(readDevMode()).toBe(false);
        memStore['devMode'] = '1';
        expect(readDevMode()).toBe(true);
        memStore['devMode'] = '0';
        expect(readDevMode()).toBe(false);
    });

    it("is not changed by other settings updates", () => {
        updateGlobalSettings({ devMode: true });
        updateGlobalSettings({ showDimensions: true });
        expect(isDevMode()).toBe(true);
    });

    /**
     * The one that would actually bite someone: `loadDocument` spreads the document's
     * `globalSettings` over the store, so a `.yappy` saved by a developer carries
     * `devMode: true` inside it. Your preference has to win in BOTH directions.
     */
    it("ignores whatever a loaded document says", () => {
        const docWith = (devMode: boolean) => ({
            version: 4,
            metadata: { id: 'd', name: 'Doc' },
            elements: [], layers: [], slides: [],
            globalSettings: { devMode },
        });

        updateGlobalSettings({ devMode: false });
        loadDocument(docWith(true));
        expect(isDevMode()).toBe(false);

        updateGlobalSettings({ devMode: true });
        loadDocument(docWith(false));
        expect(isDevMode()).toBe(true);
    });
});
