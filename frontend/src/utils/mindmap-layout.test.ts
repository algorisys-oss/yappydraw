/**
 * Layout-engine contract for mind maps.
 *
 * The engine shipped with auto-layout DISABLED because the reflow "lays out vertically in
 * practice" — which turned out to be the default *direction* (`horizontal-right` stacks every
 * child into one tall column), not a bug in `balanced`. Nothing measured that, so the real
 * defects hid behind the disabled flag: radial overlapped dozens of node pairs past depth 2,
 * and vertical spread a 66-node tree across ~9800px because leaf siblings were separated by
 * the full inter-subtree gap.
 *
 * These tests measure what a human actually judges a layout by — nodes must not overlap, and
 * the map must stay compact enough to read — across every direction and a range of tree shapes.
 */

import { describe, it, expect } from "bun:test";
import { MindmapLayoutEngine, parseOutline, type LayoutDirection, type MindmapNode } from "./mindmap-layout";
import type { DrawingElement } from "../types";

const node = (id: string, parentId?: string, width = 120, height = 40): DrawingElement =>
    ({ id, parentId, x: 0, y: 0, width, height, type: 'rectangle' } as DrawingElement);

/** root + `branches` top-level children, each subtree fanning out `perBranch` wide to `depth`. */
function tree(branches: number, perBranch: number, depth: number): DrawingElement[] {
    const els: DrawingElement[] = [node('root', undefined, 170, 64)];
    const add = (parent: string, level: number) => {
        if (level > depth) return;
        const n = level === 1 ? branches : perBranch;
        for (let i = 0; i < n; i++) {
            const id = `${parent}.${i}`;
            els.push(node(id, parent));
            add(id, level + 1);
        }
    };
    add('root', 1);
    return els;
}

type Box = { id: string; x: number; y: number; w: number; h: number };

function layout(els: DrawingElement[], direction: LayoutDirection, rootId = 'root'): Box[] {
    const engine = new MindmapLayoutEngine();
    const t = engine.buildTree(rootId, els);
    if (!t) return [];
    if (direction === 'balanced') engine.layoutBalanced(t);
    else if (direction === 'horizontal-right') engine.layoutHorizontal(t, 'right');
    else if (direction === 'horizontal-left') engine.layoutHorizontal(t, 'left');
    else if (direction === 'vertical-down') engine.layoutVertical(t, 'down');
    else if (direction === 'vertical-up') engine.layoutVertical(t, 'up');
    else engine.layoutRadial(t);
    const updates = engine.getUpdates(t, els);
    return [...updates]
        .filter(([id]) => els.some(e => e.id === id))
        .map(([id, u]) => {
            const src = els.find(e => e.id === id)!;
            return { id, x: u.x as number, y: u.y as number, w: src.width, h: src.height };
        });
}

/** Overlapping pairs, with a 1px tolerance so nodes that merely touch don't count. */
function overlaps(boxes: Box[]): string[] {
    const hits: string[] = [];
    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j];
            const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
            const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            if (dx > 1 && dy > 1) hits.push(`${a.id}~${b.id}`);
        }
    }
    return hits;
}

function bbox(boxes: Box[]) {
    const w = Math.max(...boxes.map(b => b.x + b.w)) - Math.min(...boxes.map(b => b.x));
    const h = Math.max(...boxes.map(b => b.y + b.h)) - Math.min(...boxes.map(b => b.y));
    return { w, h, aspect: w / h };
}

const SHAPES: [number, number, number][] = [[3, 3, 2], [6, 4, 2], [5, 3, 3], [8, 2, 3]];
const DIRECTIONS: LayoutDirection[] = [
    'balanced', 'horizontal-right', 'horizontal-left', 'vertical-down', 'vertical-up', 'radial',
];

describe("MindmapLayoutEngine — no two nodes may overlap", () => {
    for (const direction of DIRECTIONS) {
        for (const [b, p, d] of SHAPES) {
            it(`${direction} keeps ${b}×${p} deep-${d} trees collision-free`, () => {
                const boxes = layout(tree(b, p, d), direction);
                expect(overlaps(boxes)).toEqual([]);
            });
        }
    }
});

describe("MindmapLayoutEngine — maps stay compact enough to read", () => {
    // A mind map is read on a landscape screen, so a radial or dual-side map that comes out
    // as a long strip is a layout bug. The two axial layouts are inherently one-sided — a
    // top-down tree of 45 leaves really is wide — so they're measured on leaf packing below.
    for (const direction of ['balanced', 'radial'] as LayoutDirection[]) {
        it(`${direction} holds a sane aspect ratio on a 66-node tree`, () => {
            const { aspect } = bbox(layout(tree(5, 3, 3), direction));
            expect(aspect).toBeGreaterThan(1 / 6);
            expect(aspect).toBeLessThan(6);
        });
    }

    it("vertical puts leaf siblings closer together than separate subtrees", () => {
        // Every sibling pair used to get the full 100px inter-subtree gap, which spread a
        // 66-node tree across ~9800px. Leaves need only enough room not to touch.
        const boxes = layout(tree(2, 3, 3), 'vertical-down');
        const byId = new Map(boxes.map(b => [b.id, b]));
        const gap = (a: string, b: string) => byId.get(b)!.x - (byId.get(a)!.x + byId.get(a)!.w);
        const leafGap = gap('root.0.0.0', 'root.0.0.1');   // two leaves, same parent
        const subtreeGap = gap('root.0.0', 'root.0.1');    // two subtrees, same parent
        expect(leafGap).toBeGreaterThan(0);                // still clear of each other
        expect(leafGap).toBeLessThan(60);                  // but well under the 100px subtree gap
        expect(leafGap).toBeLessThan(subtreeGap);
    });

    it("vertical no longer spreads a 66-node tree across ten thousand pixels", () => {
        const { w } = bbox(layout(tree(5, 3, 3), 'vertical-down'));
        expect(w).toBeLessThan(8000);
    });

    it("balanced is more compact than the single-sided horizontal layout", () => {
        const els = tree(4, 3, 2);
        const bal = bbox(layout(els, 'balanced'));
        const horiz = bbox(layout(els, 'horizontal-right'));
        expect(bal.h).toBeLessThan(horiz.h);
    });
});

describe("MindmapLayoutEngine — structure", () => {
    it("balanced splits top-level branches either side of the root", () => {
        const els = tree(4, 0, 1);
        const boxes = layout(els, 'balanced');
        const root = boxes.find(b => b.id === 'root')!;
        const rootCx = root.x + root.w / 2;
        const sides = boxes.filter(b => b.id !== 'root').map(b => (b.x + b.w / 2 > rootCx ? 'r' : 'l'));
        expect(sides.filter(s => s === 'r').length).toBeGreaterThan(0);
        expect(sides.filter(s => s === 'l').length).toBeGreaterThan(0);
    });

    it("horizontal-left mirrors horizontal-right about the root", () => {
        const els = tree(3, 2, 2);
        const right = layout(els, 'horizontal-right');
        const left = layout(els, 'horizontal-left');
        const rRoot = right.find(b => b.id === 'root')!;
        const rootCx = rRoot.x + rRoot.w / 2;
        for (const r of right) {
            const l = left.find(b => b.id === r.id)!;
            // Mirror about the root's centre: equal and opposite offsets.
            const dr = r.x + r.w / 2 - rootCx;
            const dl = l.x + l.w / 2 - rootCx;
            expect(dr + dl).toBeCloseTo(0, 1);
            expect(l.y).toBeCloseTo(r.y, 1);
        }
    });

    it("a collapsed node is treated as a leaf so its siblings pack tighter", () => {
        const els = tree(2, 4, 2);
        const open = bbox(layout(els, 'horizontal-right'));
        const collapsed = els.map(e => (e.id === 'root.0' ? { ...e, isCollapsed: true } : e));
        const engine = new MindmapLayoutEngine();
        const t = engine.buildTree('root', collapsed, undefined, true)!;
        expect(t.children.find(c => c.id === 'root.0')!.children).toEqual([]);
        engine.layoutHorizontal(t, 'right');
        const boxes = [...engine.getUpdates(t, collapsed)]
            .filter(([id]) => collapsed.some(e => e.id === id))
            .map(([id, u]) => {
                const src = collapsed.find(e => e.id === id)!;
                return { id, x: u.x as number, y: u.y as number, w: src.width, h: src.height };
            });
        expect(bbox(boxes).h).toBeLessThan(open.h);
    });

    it("buildTree ignores connectors that carry a parentId", () => {
        const els = [
            node('root'),
            node('kid', 'root'),
            { ...node('branch', 'root'), type: 'organicBranch' } as DrawingElement,
        ];
        const t = new MindmapLayoutEngine().buildTree('root', els)!;
        expect(t.children.map(c => c.id)).toEqual(['kid']);
    });

    it("buildTree survives a parentId cycle", () => {
        const els = [
            { ...node('a'), parentId: 'b' } as DrawingElement,
            node('b', 'a'),
        ];
        const t = new MindmapLayoutEngine().buildTree('a', els);
        expect(t).not.toBeNull();
        const count = (n: MindmapNode): number => 1 + n.children.reduce((s, c) => s + count(c), 0);
        expect(count(t!)).toBe(2);
    });
});

describe("MindmapLayoutEngine — semantic styling", () => {
    it("gives each top-level branch its own colour and tapers with depth", () => {
        const els = tree(3, 2, 2);
        const engine = new MindmapLayoutEngine();
        const t = engine.buildTree('root', els)!;
        engine.applySemanticStyling(t);
        const colours = t.children.map(c => c.styleUpdates!.strokeColor);
        expect(new Set(colours).size).toBe(3);
        for (const branch of t.children) {
            // Descendants inherit the branch colour, with a thinner stroke.
            for (const kid of branch.children) {
                expect(kid.styleUpdates!.strokeColor).toBe(branch.styleUpdates!.strokeColor);
                expect(kid.styleUpdates!.strokeWidth!).toBeLessThan(branch.styleUpdates!.strokeWidth!);
            }
        }
    });

    it("styles the connector that feeds each node", () => {
        const els = [
            node('root'),
            node('kid', 'root'),
            {
                ...node('branch'), type: 'organicBranch',
                endBinding: { elementId: 'kid', gap: 0, position: 'left', focus: 0 },
            } as DrawingElement,
        ];
        const engine = new MindmapLayoutEngine();
        const t = engine.buildTree('root', els)!;
        engine.applySemanticStyling(t);
        const updates = engine.getUpdates(t, els);
        expect(updates.get('branch')!.strokeColor).toBe(updates.get('kid')!.strokeColor);
    });
});

describe("parseOutline", () => {
    it("reads tab, 2-space and 4-space indentation the same way", () => {
        const shapes = ["Phase 1\n\tA\n\tB", "Phase 1\n  A\n  B", "Phase 1\n    A\n    B"];
        for (const raw of shapes) {
            const roots = parseOutline(raw);
            expect(roots.map(r => r.text)).toEqual(['Phase 1']);
            expect(roots[0].children.map(c => c.text)).toEqual(['A', 'B']);
        }
    });

    it("strips bullet and numbering markers", () => {
        const roots = parseOutline("- Top\n  * One\n  1. Two\n  • Three\n  – Four");
        expect(roots[0].text).toBe('Top');
        expect(roots[0].children.map(c => c.text)).toEqual(['One', 'Two', 'Three', 'Four']);
    });

    it("nests several levels deep", () => {
        const roots = parseOutline("A\n  B\n    C\n  D\nE");
        expect(roots.map(r => r.text)).toEqual(['A', 'E']);
        expect(roots[0].children.map(c => c.text)).toEqual(['B', 'D']);
        expect(roots[0].children[0].children.map(c => c.text)).toEqual(['C']);
    });

    it("ignores blank lines", () => {
        const roots = parseOutline("A\n\n  B\n\n\n  C\n");
        expect(roots[0].children.map(c => c.text)).toEqual(['B', 'C']);
    });

    it("declines a single line — that's a normal paste, not an outline", () => {
        expect(parseOutline("just some text")).toEqual([]);
        expect(parseOutline("")).toEqual([]);
        expect(parseOutline("   \n  \n")).toEqual([]);
    });

    it("keeps a flat multi-line list as siblings", () => {
        expect(parseOutline("A\nB\nC").map(r => r.text)).toEqual(['A', 'B', 'C']);
    });
});
