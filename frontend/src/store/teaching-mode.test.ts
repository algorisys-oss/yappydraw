/**
 * Teaching mode — the app stripped back to the common drawing tools.
 *
 * Two properties matter and neither is visible in the UI, so they are pinned here:
 *   1. Hiding a button is not switching a tool off. Every shortcut, the command palette
 *      and the scripting API reach the same tools, so the guard has to live at the choke
 *      points (`setSelectedTool`, `toggleShapeBuilder`, `toggleVectorToolsPanel`).
 *   2. The mode forces `showDimensions` / `showPathfinderBar` off rather than reading
 *      around them at eleven render sites — so leaving the mode MUST give them back.
 *      A mode that quietly eats your settings is worse than one that leaks clutter.
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
    store, setSelectedTool, toggleTeachingMode, toggleShapeBuilder,
    updateGlobalSettings, isToolAllowed, TEACHING_MODE_TOOLS,
} = await import("./app-store");

beforeEach(() => {
    toggleTeachingMode(false);
    setSelectedTool('selection');
    toggleShapeBuilder(false);
});

describe("teaching mode — what stays reachable", () => {
    it("keeps the common drawing tools", () => {
        toggleTeachingMode(true);
        for (const tool of ['selection', 'fineliner', 'line', 'arrow', 'rectangle', 'circle', 'text', 'eraser'] as const) {
            expect(isToolAllowed(tool)).toBe(true);
        }
    });

    it("blocks the vector Pen even though the P shortcut still fires", () => {
        toggleTeachingMode(true);
        setSelectedTool('path');
        expect(store.selectedTool).toBe('selection');
    });

    it("blocks library shapes that were never on the minimal toolbar", () => {
        toggleTeachingMode(true);
        for (const tool of ['umlClass', 'bpmnTask', 'dsStack', 'kubernetes'] as const) {
            setSelectedTool(tool);
            expect(store.selectedTool).toBe('selection');
        }
    });

    it("blocks Shape Builder, so Shift+M cannot arm a hidden overlay", () => {
        toggleTeachingMode(true);
        toggleShapeBuilder(true);
        expect(store.shapeBuilderActive).toBe(false);
    });

    it("lets every whitelisted tool through", () => {
        toggleTeachingMode(true);
        for (const tool of TEACHING_MODE_TOOLS) expect(isToolAllowed(tool)).toBe(true);
    });

    it("blocks nothing at all when the mode is off", () => {
        expect(isToolAllowed('path')).toBe(true);
        expect(isToolAllowed('umlClass')).toBe(true);
        setSelectedTool('path');
        expect(store.selectedTool).toBe('path');
    });
});

describe("teaching mode — settings survive the round trip", () => {
    it("gives back the preferences it switched off", () => {
        updateGlobalSettings({ showDimensions: true, showPathfinderBar: true });

        toggleTeachingMode(true);
        expect(store.globalSettings.showDimensions).toBe(false);
        expect(store.globalSettings.showPathfinderBar).toBe(false);

        toggleTeachingMode(false);
        expect(store.globalSettings.showDimensions).toBe(true);
        expect(store.globalSettings.showPathfinderBar).toBe(true);
    });

    it("does not invent settings that were off to begin with", () => {
        updateGlobalSettings({ showDimensions: false, showPathfinderBar: false });
        toggleTeachingMode(true);
        toggleTeachingMode(false);
        expect(store.globalSettings.showDimensions).toBe(false);
        expect(store.globalSettings.showPathfinderBar).toBe(false);
    });

    it("parks the snapshot in localStorage, so a reload mid-session can still restore", () => {
        updateGlobalSettings({ showDimensions: true, showPathfinderBar: true });
        toggleTeachingMode(true);
        expect(JSON.parse(localStorage.getItem('teachingModeRestore')!)).toEqual({
            showDimensions: true, showPathfinderBar: true,
        });
        toggleTeachingMode(false);
        expect(localStorage.getItem('teachingModeRestore')).toBe(null);
    });

    it("is idempotent — turning it on twice does not overwrite the snapshot with the forced values", () => {
        updateGlobalSettings({ showDimensions: true, showPathfinderBar: true });
        toggleTeachingMode(true);
        toggleTeachingMode(true);   // must be a no-op, not a re-snapshot of the now-false values
        toggleTeachingMode(false);
        expect(store.globalSettings.showDimensions).toBe(true);
        expect(store.globalSettings.showPathfinderBar).toBe(true);
    });

    it("drops a disallowed tool when the mode is entered while it is in hand", () => {
        setSelectedTool('path');
        expect(store.selectedTool).toBe('path');
        toggleTeachingMode(true);
        expect(store.selectedTool).toBe('selection');
    });

    it("persists the mode itself across a reload", () => {
        toggleTeachingMode(true);
        expect(localStorage.getItem('teachingMode')).toBe('1');
        toggleTeachingMode(false);
        expect(localStorage.getItem('teachingMode')).toBe('0');
    });
});
