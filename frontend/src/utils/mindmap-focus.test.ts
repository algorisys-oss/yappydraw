/**
 * Focus mode's membership set.
 *
 * The set was computed inline in `canvas.tsx`'s render effect, so the renderer was the only
 * thing that knew it — everything outside the focused branch dimmed to 12% while staying fully
 * clickable and draggable. Lifting it here let hit testing and handle detection read the same
 * set; these tests pin what belongs in it.
 */

import { describe, it, expect, afterEach } from "bun:test";
import { focusBranchSet, setFocusFilter, isFocusInert } from "./mindmap-focus";
import type { DrawingElement } from "../types";

const node = (id: string, parentId?: string): DrawingElement =>
    ({ id, parentId, x: 0, y: 0, width: 120, height: 40, type: 'rectangle' } as DrawingElement);

const branch = (id: string, from: string, to: string): DrawingElement =>
    ({
        id, x: 0, y: 0, width: 10, height: 10, type: 'organicBranch',
        startBinding: { elementId: from, gap: 0, position: 'right', focus: 0 },
        endBinding: { elementId: to, gap: 0, position: 'left', focus: 0 },
    } as DrawingElement);

/**  root → a → a1, a2 ; root → b ; plus every branch, and an unrelated loose shape. */
const TREE: DrawingElement[] = [
    node('root'), node('a', 'root'), node('a1', 'a'), node('a2', 'a'), node('b', 'root'),
    branch('r-a', 'root', 'a'), branch('a-a1', 'a', 'a1'), branch('a-a2', 'a', 'a2'),
    branch('r-b', 'root', 'b'),
    node('loose'),
];

afterEach(() => setFocusFilter(null));

describe("focusBranchSet", () => {
    it("includes the node, its subtree, its ancestors and the branches between them", () => {
        const set = focusBranchSet('a', TREE)!;
        expect([...set].sort()).toEqual(['a', 'a-a1', 'a-a2', 'a1', 'a2', 'r-a', 'root'].sort());
    });

    it("leaves out unrelated shapes and sibling branches", () => {
        const set = focusBranchSet('a', TREE)!;
        expect(set.has('loose')).toBe(false);
        expect(set.has('b')).toBe(false);
        expect(set.has('r-b')).toBe(false);   // root→b: root is in, b is not
    });

    it("keeps the path to the root so you can climb back out", () => {
        const set = focusBranchSet('a1', TREE)!;
        expect(set.has('a')).toBe(true);
        expect(set.has('root')).toBe(true);
        expect(set.has('a2')).toBe(false);    // a sibling is not on the path
    });

    it("is null with no focus, and null for an id that no longer exists", () => {
        // A deleted focus id would otherwise match nothing and dim the whole canvas.
        expect(focusBranchSet(null, TREE)).toBeNull();
        expect(focusBranchSet('deleted-node', TREE)).toBeNull();
    });

    it("handles a leaf and a root", () => {
        // 'r-a' belongs: root and a are both on the path, so the branch between them is drawn.
        expect([...focusBranchSet('a2', TREE)!].sort()).toEqual(['a', 'a-a2', 'a2', 'r-a', 'root'].sort());
        const whole = focusBranchSet('root', TREE)!;
        expect(whole.has('loose')).toBe(false);
        expect(whole.has('a1')).toBe(true);
        expect(whole.has('r-b')).toBe(true);
    });

    it("terminates on a parentId cycle", () => {
        const cyclic = [{ ...node('x'), parentId: 'y' } as DrawingElement, node('y', 'x')];
        const set = focusBranchSet('x', cyclic)!;
        expect(set.has('x')).toBe(true);
        expect(set.has('y')).toBe(true);
    });
});

describe("isFocusInert", () => {
    it("reports everything outside the focused set, and nothing when focus is off", () => {
        expect(isFocusInert('loose')).toBe(false);          // focus off → nothing is inert
        setFocusFilter(focusBranchSet('a', TREE));
        expect(isFocusInert('a1')).toBe(false);
        expect(isFocusInert('root')).toBe(false);
        expect(isFocusInert('loose')).toBe(true);
        expect(isFocusInert('b')).toBe(true);
        setFocusFilter(null);
        expect(isFocusInert('loose')).toBe(false);
    });

    it("treats an empty set as focus-off rather than 'everything is inert'", () => {
        setFocusFilter(new Set());
        expect(isFocusInert('anything')).toBe(false);
    });
});
