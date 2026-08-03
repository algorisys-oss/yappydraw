/**
 * Regression: with the Node tool active, a selected element must NOT paint the Select
 * tool's transform chrome.
 *
 * The chrome (8 resize handles, the rotate handle, the quick-delete ⊗, the quick-connect
 * buttons) is drawn at the bounding box — which is exactly where a rectangle-shaped
 * path's corner anchors sit. Worse, it is inert: node-tool-overlay.tsx installs a
 * capture-phase pointerdown handler that stopPropagation()s on every branch, so the
 * canvas never sees the click. The result was a pile of identical blue squares, most of
 * which did nothing, sitting on top of the anchors the user was aiming for.
 *
 * The canvas also draws its own path anchors for a selected path (renderPathAnchors).
 * The node tool renders anchors itself as SVG, so those must be suppressed too or every
 * anchor is drawn twice, in two slightly different styles.
 *
 * These tests drive renderElementOverlays with a recording 2D context and assert on the
 * primitives it emits. Illustrator and Inkscape both drop the transform chrome in
 * Direct-Selection / node mode for the same reason.
 */

import { describe, it, expect } from "bun:test";
import { renderElementOverlays } from "./selection-renderer";

/** A canvas 2D context that records which drawing primitives were called. */
function recordingCtx() {
    const calls: string[] = [];
    let depth = 0;
    let maxDepth = 0;
    const noop = (name: string) => (..._a: any[]) => { calls.push(name); };
    const ctx: any = {
        calls,
        save: () => { depth++; maxDepth = Math.max(maxDepth, depth); calls.push("save"); },
        restore: () => { depth--; calls.push("restore"); },
        get depth() { return depth; },
        beginPath: noop("beginPath"),
        closePath: noop("closePath"),
        moveTo: noop("moveTo"),
        lineTo: noop("lineTo"),
        arc: noop("arc"),
        arcTo: noop("arcTo"),
        rect: noop("rect"),
        ellipse: noop("ellipse"),
        quadraticCurveTo: noop("quadraticCurveTo"),
        bezierCurveTo: noop("bezierCurveTo"),
        stroke: noop("stroke"),
        fill: noop("fill"),
        fillRect: noop("fillRect"),
        strokeRect: noop("strokeRect"),
        clearRect: noop("clearRect"),
        fillText: noop("fillText"),
        strokeText: noop("strokeText"),
        measureText: () => ({ width: 10 }),
        setLineDash: noop("setLineDash"),
        translate: noop("translate"),
        rotate: noop("rotate"),
        scale: noop("scale"),
        drawImage: noop("drawImage"),
        createLinearGradient: () => ({ addColorStop: () => { } }),
        createRadialGradient: () => ({ addColorStop: () => { } }),
    };
    return ctx;
}

/** A closed square path with four corner anchors — the shape from the bug report:
 *  a rectangle run through Convert to Path, whose anchors land on the bounding box. */
const squarePath = (): any => ({
    id: "p1", type: "path", x: 100, y: 100, width: 80, height: 80, angle: 0,
    strokeColor: "#000", strokeWidth: 2, backgroundColor: "transparent",
    pathClosed: true,
    pathAnchors: [
        { x: 0, y: 0, kind: "corner" },
        { x: 80, y: 0, kind: "corner" },
        { x: 80, y: 80, kind: "corner" },
        { x: 0, y: 80, kind: "corner" },
    ],
});

const optsFor = (nodeToolActive: boolean, el: any) => ({
    scale: 1,
    isSelected: true,
    selectionLength: 1,
    selection: [el.id],
    isDarkMode: false,
    elements: [el],
    selectedTool: "selection",
    hoveredConnector: null,
    appMode: "draw",
    penBuildingId: null,
    nodeToolActive,
}) as any;

const render = (nodeToolActive: boolean) => {
    const el = squarePath();
    const ctx = recordingCtx();
    renderElementOverlays(ctx, el, el, optsFor(nodeToolActive, el));
    return ctx;
};

describe("node tool suppresses the Select tool's transform chrome", () => {
    it("still draws the selection outline, so the shape reads as selected", () => {
        const ctx = render(true);
        expect(ctx.calls).toContain("stroke");
    });

    it("draws no filled handles — the resize/rotate grips and quick buttons are gone", () => {
        const withTool = render(true);
        const withoutTool = render(false);

        // Handles are filled primitives (white discs / squares with a blue ring); the
        // bare outline only strokes. If any fill/fillRect/arc survives, chrome is still
        // being painted over the anchors.
        const filled = (c: any) =>
            c.calls.filter((k: string) => k === "fill" || k === "fillRect" || k === "arc").length;

        expect(filled(withTool)).toBe(0);
        // Guard the guard: without the node tool this element DOES paint chrome, so a
        // zero above means "suppressed", not "this fixture never had handles".
        expect(filled(withoutTool)).toBeGreaterThan(0);
    });

    it("emits far fewer drawing ops than the full Select chrome", () => {
        expect(render(true).calls.length).toBeLessThan(render(false).calls.length);
    });

    it("leaves the context stack balanced (no leaked save)", () => {
        const ctx = render(true);
        expect(ctx.depth).toBe(0);
    });

    it("does not double-draw path anchors — the node overlay owns them (as SVG)", () => {
        // renderPathAnchors strokes/fills a square per anchor. With the node tool on it
        // must not run at all: the SVG overlay already draws every anchor, and two
        // slightly different anchor styles stacked on each other was half the problem.
        const withTool = render(true);
        // 4 anchors would add at least 4 more fills; we already assert 0 fills above, so
        // assert the cheaper structural fact here: no per-anchor rect work.
        expect(withTool.calls.filter((k: string) => k === "fillRect" || k === "strokeRect").length).toBe(0);
    });
});
