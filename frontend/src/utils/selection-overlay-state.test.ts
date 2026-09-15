/**
 * Regression: drawing a selected element's overlays must not leave paint state on the
 * shared canvas context.
 *
 * The overlays are drawn inline in the element loop, so whatever state they leave is what
 * the NEXT element starts with. The quick-connect buttons (single selection) set
 * `fillStyle = '#10b981'` outside any save/restore, so selecting a mindmap parent painted
 * its child — drawn right after it — solid green whenever the child's fill fell back on the
 * inherited fillStyle. Deselecting the parent put the colour back.
 */

import { describe, it, expect } from "bun:test";
import { renderElementOverlays } from "./selection-renderer";

const PAINT_STATE = ["fillStyle", "strokeStyle", "lineWidth", "shadowColor", "shadowBlur", "globalAlpha", "lineCap", "lineJoin"] as const;

/** A 2D context whose paint state behaves like the real one across save()/restore(). */
function statefulCtx() {
    const stack: Record<string, unknown>[] = [];
    let dash: number[] = [];
    const ctx: any = {
        fillStyle: "#ffe5e5", strokeStyle: "#ff0000", lineWidth: 12,
        shadowColor: "rgba(0, 0, 0, 0)", shadowBlur: 0, globalAlpha: 1, lineCap: "butt", lineJoin: "miter",
        font: "10px sans-serif", textAlign: "start", textBaseline: "alphabetic",
        save() { stack.push({ ...Object.fromEntries(PAINT_STATE.map(k => [k, ctx[k]])), dash }); },
        restore() {
            const s = stack.pop();
            if (!s) return;
            for (const k of PAINT_STATE) ctx[k] = s[k];
            dash = s.dash as number[];
        },
        setLineDash(d: number[]) { dash = d; },
        getLineDash() { return dash; },
        measureText: () => ({ width: 10 }),
        get depth() { return stack.length; },
    };
    const noop = () => { };
    for (const m of ["beginPath", "closePath", "moveTo", "lineTo", "arc", "arcTo", "rect", "roundRect", "ellipse",
        "quadraticCurveTo", "bezierCurveTo", "stroke", "fill", "fillRect", "strokeRect", "clearRect",
        "fillText", "strokeText", "translate", "rotate", "scale", "drawImage", "setTransform"]) ctx[m] = noop;
    return ctx;
}

const node = (): any => ({
    id: "r1", type: "rectangle", x: 100, y: 100, width: 160, height: 80, angle: 0,
    strokeColor: "#ff0000", strokeWidth: 12, backgroundColor: "#ffe5e5", fillStyle: "solid",
});

const optsFor = (el: any, overrides: Record<string, unknown> = {}) => ({
    scale: 1,
    isSelected: true,
    selectionLength: 1,
    selection: [el.id],
    isDarkMode: false,
    elements: [el, { id: "r2", type: "rectangle", parentId: el.id, x: 360, y: 100, width: 160, height: 80 }],
    selectedTool: "selection",
    hoveredConnector: null,
    appMode: "draw",
    penBuildingId: null,
    nodeToolActive: false,
    ...overrides,
}) as any;

const snapshot = (ctx: any) => ({ ...Object.fromEntries(PAINT_STATE.map(k => [k, ctx[k]])), dash: ctx.getLineDash() });

describe("selection overlays leave the canvas paint state untouched", () => {
    it("single-selected shape (quick-connect buttons drawn)", () => {
        const el = node();
        const ctx = statefulCtx();
        const before = snapshot(ctx);
        renderElementOverlays(ctx, el, el, optsFor(el));
        expect(snapshot(ctx)).toEqual(before);
        expect(ctx.depth).toBe(0);
    });

    it("hovered quick-connect button", () => {
        const el = node();
        const ctx = statefulCtx();
        const before = snapshot(ctx);
        renderElementOverlays(ctx, el, el, optsFor(el, { hoveredConnector: { elementId: el.id, handle: "connector-right" } }));
        expect(snapshot(ctx)).toEqual(before);
    });

    it("collapsed, unselected node (glow only)", () => {
        const el = { ...node(), isCollapsed: true };
        const ctx = statefulCtx();
        const before = snapshot(ctx);
        renderElementOverlays(ctx, el, el, optsFor(el, { isSelected: false, selection: [] , selectionLength: 0 }));
        expect(snapshot(ctx)).toEqual(before);
    });
});
