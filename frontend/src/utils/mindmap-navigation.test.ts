/**
 * Arrow navigation must follow the layout, not a hardcoded direction.
 *
 * The original rule was ← = parent, → = first child, siblings ordered by `y` — which only
 * describes `horizontal-right`. Now that `balanced` is the default, half of every map has its
 * parent to the RIGHT, so these cases are the regression guard.
 */

import { describe, it, expect } from "bun:test";
import { nextMindmapNode, isMindmapNode, mindmapSiblingInDirection } from "./mindmap-navigation";
import { MindmapLayoutEngine, type LayoutDirection } from "./mindmap-layout";
import type { DrawingElement } from "../types";

const node = (id: string, parentId: string | undefined, x: number, y: number): DrawingElement =>
    ({ id, parentId, x, y, width: 120, height: 40, type: 'rectangle' } as DrawingElement);

/** Lay a root + `branches` × `perBranch` tree out for real, so positions match the app's. */
function laidOut(direction: LayoutDirection, branches = 4, perBranch = 2): DrawingElement[] {
    const els: DrawingElement[] = [{ id: 'root', x: 0, y: 0, width: 170, height: 64, type: 'rectangle' } as DrawingElement];
    for (let b = 0; b < branches; b++) {
        els.push(node(`b${b}`, 'root', 0, 0));
        for (let c = 0; c < perBranch; c++) els.push(node(`b${b}.${c}`, `b${b}`, 0, 0));
    }
    const engine = new MindmapLayoutEngine();
    const tree = engine.buildTree('root', els)!;
    if (direction === 'balanced') engine.layoutBalanced(tree);
    else if (direction === 'horizontal-right') engine.layoutHorizontal(tree, 'right');
    else if (direction === 'horizontal-left') engine.layoutHorizontal(tree, 'left');
    else if (direction === 'vertical-down') engine.layoutVertical(tree, 'down');
    else engine.layoutRadial(tree);
    const updates = engine.getUpdates(tree, els);
    return els.map(e => ({ ...e, ...updates.get(e.id) } as DrawingElement));
}

const centre = (els: DrawingElement[], id: string) => {
    const e = els.find(x => x.id === id)!;
    return { x: e.x + e.width / 2, y: e.y + e.height / 2 };
};

describe("nextMindmapNode", () => {
    it("reaches the parent from any branch, whichever side it sits on", () => {
        for (const direction of ['balanced', 'horizontal-right', 'horizontal-left', 'vertical-down', 'radial'] as LayoutDirection[]) {
            const els = laidOut(direction);
            for (const id of ['b0', 'b1', 'b2', 'b3']) {
                // Whatever direction the root actually lies in, SOME key must get there.
                const reached = (['up', 'down', 'left', 'right'] as const)
                    .map(d => nextMindmapNode(id, d, els))
                    .filter(r => r === 'root');
                expect(reached.length).toBeGreaterThan(0);
            }
        }
    });

    it("never walks away from the root when asked to go towards it", () => {
        // The old bug: on the left half of a balanced map the parent is to the RIGHT, so a
        // hardcoded "left = parent" moved further out instead.
        const els = laidOut('balanced');
        const rootC = centre(els, 'root');
        for (const id of ['b0', 'b1', 'b2', 'b3']) {
            const c = centre(els, id);
            const towards = c.x > rootC.x ? 'left' : 'right';
            expect(nextMindmapNode(id, towards, els)).toBe('root');
        }
    });

    it("steps outward into a child on the side the child is actually on", () => {
        const els = laidOut('balanced');
        for (const id of ['b0', 'b3']) {
            const c = centre(els, id);
            const kidC = centre(els, `${id}.0`);
            const outward = kidC.x > c.x ? 'right' : 'left';
            expect(nextMindmapNode(id, outward, els)).toBe(`${id}.0`);
        }
    });

    it("moves between siblings along the axis they're stacked on", () => {
        // Horizontal layouts stack siblings vertically…
        const horiz = laidOut('horizontal-right');
        expect(nextMindmapNode('b0.0', 'down', horiz)).toBe('b0.1');
        expect(nextMindmapNode('b0.1', 'up', horiz)).toBe('b0.0');
        // …vertical layouts stack them horizontally, which the old `y`-sorted rule couldn't see.
        const vert = laidOut('vertical-down');
        expect(nextMindmapNode('b0.0', 'right', vert)).toBe('b0.1');
        expect(nextMindmapNode('b0.1', 'left', vert)).toBe('b0.0');
    });

    it("prefers the hierarchy over a sibling when a key could mean either", () => {
        const els = laidOut('vertical-down');
        // In a top-down tree the parent is up; a sibling is never up. Still, be explicit.
        expect(nextMindmapNode('b0.0', 'up', els)).toBe('b0');
    });

    it("returns null when there is nothing in that direction", () => {
        const els = laidOut('horizontal-right');
        expect(nextMindmapNode('b0.0', 'up', els)).toBeNull();   // first sibling, nothing above
        expect(nextMindmapNode('b0.0', 'right', els)).toBeNull(); // a leaf, nothing further out
    });

    it("declines elements that aren't in a hierarchy", () => {
        const loner = [node('loner', undefined, 0, 0)];
        expect(nextMindmapNode('loner', 'left', loner)).toBeNull();
        expect(nextMindmapNode('missing', 'left', loner)).toBeNull();
    });

    it("ignores connectors that carry a parentId", () => {
        const els = [
            { id: 'root', x: 0, y: 0, width: 120, height: 40, type: 'rectangle' } as DrawingElement,
            { ...node('branch', 'root', 300, 0), type: 'organicBranch' } as DrawingElement,
        ];
        expect(isMindmapNode(els[0], els)).toBe(false);          // its only "child" is a branch
        expect(nextMindmapNode('root', 'right', els)).toBeNull();
    });
});

describe("mindmapSiblingInDirection", () => {
    it("finds the neighbour on whichever axis the layout stacks siblings", () => {
        // Horizontal stacks them vertically…
        const horiz = laidOut('horizontal-right', 3, 3);
        expect(mindmapSiblingInDirection('b0.1', 'up', horiz)).toBe('b0.0');
        expect(mindmapSiblingInDirection('b0.1', 'down', horiz)).toBe('b0.2');
        expect(mindmapSiblingInDirection('b0.1', 'left', horiz)).toBeNull();
        // …vertical stacks them horizontally.
        const vert = laidOut('vertical-down', 3, 3);
        expect(mindmapSiblingInDirection('b0.1', 'left', vert)).toBe('b0.0');
        expect(mindmapSiblingInDirection('b0.1', 'right', vert)).toBe('b0.2');
        expect(mindmapSiblingInDirection('b0.1', 'up', vert)).toBeNull();
    });

    it("never returns the parent or a child — reordering moves within a row", () => {
        const els = laidOut('horizontal-right', 3, 3);
        const picks = (['up', 'down', 'left', 'right'] as const)
            .map(d => mindmapSiblingInDirection('b0.1', d, els))
            .filter(Boolean);
        expect(picks).not.toContain('b0');      // the parent
        expect(picks.every(p => p!.startsWith('b0.'))).toBe(true);
    });

    it("declines a root, which has no siblings", () => {
        const els = laidOut('balanced');
        for (const d of ['up', 'down', 'left', 'right'] as const) {
            expect(mindmapSiblingInDirection('root', d, els)).toBeNull();
        }
    });

    it("stops at the ends of the row", () => {
        const els = laidOut('horizontal-right', 3, 3);
        expect(mindmapSiblingInDirection('b0.0', 'up', els)).toBeNull();
        expect(mindmapSiblingInDirection('b0.2', 'down', els)).toBeNull();
    });
});
