import { describe, it, expect, mock, beforeAll } from "bun:test";

// Mock dependencies BEFORE importing the store
mock.module("../components/toast", () => ({
    showToast: () => { }
}));

// Mock browser globals
global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => { },
    removeEventListener: () => { },
} as any;
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
} as any;
global.crypto = {
    randomUUID: () => "uuid-" + Math.random()
} as any;

global.document = {
    documentElement: {
        setAttribute: () => { },
        classList: { add: () => { }, remove: () => { } }
    }
} as any;

describe("App Store Tool Isolation", async () => {
    // Dynamic import to ensure mocks apply first
    const { store, setSelectedTool, updateDefaultStyles } = await import("./app-store");

    it("should isolate properties between tools", () => {
        // 1. Select Rectangle
        setSelectedTool("rectangle");
        updateDefaultStyles({ strokeWidth: 5, strokeColor: "#ff0000" });

        expect(store.selectedTool).toBe("rectangle");
        expect(store.defaultElementStyles.strokeWidth).toBe(5);
        expect(store.defaultElementStyles.strokeColor).toBe("#ff0000");

        // 2. Switch to Inkbrush
        setSelectedTool("inkbrush");
        // Verify it inherited or has defaults. Let's customize it.
        updateDefaultStyles({ strokeWidth: 10, strokeColor: "#00ff00" });

        expect(store.selectedTool).toBe("inkbrush");
        expect(store.defaultElementStyles.strokeWidth).toBe(10);
        expect(store.defaultElementStyles.strokeColor).toBe("#00ff00");

        // 3. Switch back to Rectangle
        setSelectedTool("rectangle");

        expect(store.selectedTool).toBe("rectangle");
        expect(store.defaultElementStyles.strokeWidth).toBe(5);
        expect(store.defaultElementStyles.strokeColor).toBe("#ff0000");

        // 4. Switch back to Inkbrush
        setSelectedTool("inkbrush");

        expect(store.selectedTool).toBe("inkbrush");
        expect(store.defaultElementStyles.strokeWidth).toBe(10);
        expect(store.defaultElementStyles.strokeColor).toBe("#00ff00");
    });
});

describe("selectAll arms the selection tool", async () => {
    const { store, setStore, setSelectedTool, selectAll } = await import("./app-store");

    const seed = (n: number) => setStore("elements", Array.from({ length: n }, (_, i) => ({
        id: `el-${i}`, type: "rectangle", x: i * 10, y: 0, width: 10, height: 10,
    })) as any);

    it("switches away from a drawing tool so the selection is manipulable", () => {
        seed(3);
        setSelectedTool("inkbrush");

        selectAll();

        expect(store.selection).toEqual(["el-0", "el-1", "el-2"]);
        expect(store.selectedTool).toBe("selection");
    });

    it("keeps the lasso tool — it is already selection-capable", () => {
        seed(2);
        setSelectedTool("lasso");

        selectAll();

        expect(store.selection).toEqual(["el-0", "el-1"]);
        expect(store.selectedTool).toBe("lasso");
    });

    it("leaves the active tool alone when there is nothing to select", () => {
        setStore("elements", []);
        setSelectedTool("inkbrush");

        selectAll();

        expect(store.selection).toEqual([]);
        expect(store.selectedTool).toBe("inkbrush");
    });
});
