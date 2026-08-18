/**
 * Regression: the Selection tool must not show — or hit-test — a path's anchors.
 *
 * Selecting a path used to paint every anchor and Bézier handle on the canvas, and
 * `getHandleAtPosition` returned `path-anchor-*` for them BEFORE the bounding-box resize
 * grips. On a four-node curve that read as helpful. On real artwork — an outlined word, an
 * imported icon — it buried the shape under hundreds of blue squares nobody asked for, and
 * the anchors that happen to sit on the bbox corners silently stole the corner-resize drag.
 *
 * Every other vector editor splits these roles (Illustrator V vs A, Inkscape S vs N), and
 * so does Yappy: the Node tool owns anchors, the Selection tool stays a transform tool.
 *
 * The two halves are asserted together on purpose — drawing without hit-testing gives
 * unclickable squares, hit-testing without drawing gives invisible traps.
 */

import { describe, it, expect } from "bun:test";
import { renderElementOverlays } from "./selection-renderer";
import { getHandleAtPosition } from "./handle-detection";

/** A 2D context that records which drawing primitives were called. */
function recordingCtx() {
    const calls: string[] = [];
    const noop = (name: string) => (..._a: any[]) => { calls.push(name); };
    const ctx: any = {
        calls,
        save: noop("save"), restore: noop("restore"),
        beginPath: noop("beginPath"), closePath: noop("closePath"),
        moveTo: noop("moveTo"), lineTo: noop("lineTo"), arc: noop("arc"), arcTo: noop("arcTo"),
        rect: noop("rect"), ellipse: noop("ellipse"),
        quadraticCurveTo: noop("quadraticCurveTo"), bezierCurveTo: noop("bezierCurveTo"),
        stroke: noop("stroke"), fill: noop("fill"),
        fillRect: noop("fillRect"), strokeRect: noop("strokeRect"), clearRect: noop("clearRect"),
        fillText: noop("fillText"), strokeText: noop("strokeText"),
        measureText: () => ({ width: 10 }),
        setLineDash: noop("setLineDash"),
        translate: noop("translate"), rotate: noop("rotate"), scale: noop("scale"),
        drawImage: noop("drawImage"),
        createLinearGradient: () => ({ addColorStop: () => { } }),
        createRadialGradient: () => ({ addColorStop: () => { } }),
    };
    return ctx;
}

/** A closed square path whose corner anchors land exactly on the bounding box —
 *  the geometry where the invisible-anchor trap costs you a resize. */
const squarePath = (): any => ({
    id: "p1", type: "path", x: 100, y: 100, width: 80, height: 80, angle: 0,
    strokeColor: "#000", strokeWidth: 2, backgroundColor: "transparent",
    pathClosed: true,
    pathAnchors: [
        { x: 0, y: 0, kind: "corner" },
        { x: 80, y: 0, kind: "smooth", outX: 12, outY: 0, inX: -12, inY: 0 },
        { x: 80, y: 80, kind: "corner" },
        { x: 0, y: 80, kind: "corner" },
    ],
});

const optsFor = (el: any) => ({
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
    nodeToolActive: false,
}) as any;

describe("Selection tool leaves path nodes to the Node tool", () => {
    it("paints no anchor squares for a selected path", () => {
        const el = squarePath();
        const ctx = recordingCtx();
        renderElementOverlays(ctx, el, el, optsFor(el));
        // renderPathAnchors is the only overlay that emits ctx.rect(); the transform grips
        // use fillRect/strokeRect. So `rect` is a clean signal for "anchors were drawn".
        expect(ctx.calls.filter((k: string) => k === "rect").length).toBe(0);
    });

    it("still paints the transform chrome — the path is plainly selected", () => {
        const el = squarePath();
        const ctx = recordingCtx();
        renderElementOverlays(ctx, el, el, optsFor(el));
        // Guard the guard: a zero above must mean "anchors suppressed", not "nothing drew".
        expect(ctx.calls.filter((k: string) => k === "fillRect").length).toBeGreaterThan(0);
    });

    it("a click on a corner anchor resizes, it does not drag the node", () => {
        const el = squarePath();
        // The top-left anchor sits at (100,100) — under the 'tl' resize grip.
        const hit = getHandleAtPosition(100, 100, [el], [el.id], 1);
        expect(hit?.handle).toBe("tl");
    });

    it("a click on a Bézier handle hits nothing grabbable", () => {
        const el = squarePath();
        // The out-handle of the smooth anchor: (100+80+12, 100+0) — mid-edge, clear of grips.
        const hit = getHandleAtPosition(192, 100, [el], [el.id], 1);
        expect(hit?.handle?.startsWith("path-")).toBeFalsy();
    });
});
