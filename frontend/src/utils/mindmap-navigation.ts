import type { DrawingElement } from "../types";
import { isMindmapNodeType, mindmapChildren } from "./mindmap-layout";

/**
 * Arrow-key navigation through a mind-map tree, resolved from where nodes actually ARE.
 *
 * The first version hardcoded ← = parent and → = first child, and ordered siblings by `y`.
 * That only describes `horizontal-right`. On the left half of a balanced map the parent is to
 * the RIGHT, so ← walked away from the root; in a vertical layout the parent is above and
 * siblings run left-to-right, so none of the four keys matched the picture on screen; in a
 * radial map a relative can sit in any direction at all.
 *
 * So the relation is read off the geometry instead: among the node's relatives (parent, then
 * children, then siblings) take the ones that genuinely lie in the pressed direction, and pick
 * the closest. Parent and children are tried before siblings so a key that could mean either
 * moves through the hierarchy — the thing arrow keys are for in an outline.
 */

export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

const centre = (el: DrawingElement) => ({ x: el.x + el.width / 2, y: el.y + el.height / 2 });

/** The cardinal direction of `to` as seen from `from`, by whichever axis dominates. */
const directionTo = (from: DrawingElement, to: DrawingElement): ArrowDirection => {
    const a = centre(from), b = centre(to);
    const dx = b.x - a.x, dy = b.y - a.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
    return dy >= 0 ? 'down' : 'up';
};

/** Straight-line distance between two nodes' centres. */
const distance = (from: DrawingElement, to: DrawingElement): number => {
    const a = centre(from), b = centre(to);
    return Math.hypot(b.x - a.x, b.y - a.y);
};

const isNode = (el: DrawingElement) => isMindmapNodeType(el.type);

/** Nearest candidate lying in `dir` from `el`, or null. */
const nearestIn = (el: DrawingElement, candidates: DrawingElement[], dir: ArrowDirection): DrawingElement | null => {
    let best: DrawingElement | null = null;
    let bestDist = Infinity;
    for (const c of candidates) {
        if (directionTo(el, c) !== dir) continue;
        const d = distance(el, c);
        if (d < bestDist) { best = c; bestDist = d; }
    }
    return best;
};

/** True when `el` belongs to a hierarchy — it has a parent, or at least one real child. */
export const isMindmapNode = (el: DrawingElement, elements: readonly DrawingElement[]): boolean =>
    isNode(el) && (!!el.parentId || elements.some(e => e.parentId === el.id && isNode(e)));

/**
 * The node an arrow key should move the selection to, or null when there's nothing that way.
 * `elements` should already be filtered to what the user can see if hidden nodes must be skipped.
 */
export const nextMindmapNode = (
    selectedId: string,
    dir: ArrowDirection,
    elements: readonly DrawingElement[],
): string | null => {
    const el = elements.find(e => e.id === selectedId);
    if (!el || !isMindmapNode(el, elements)) return null;

    const parent = el.parentId ? elements.find(e => e.id === el.parentId) ?? null : null;
    // Up the tree first: one step towards the root is the most useful reading of a key that
    // could mean either, and it's the move that always exists on a non-root node.
    if (parent && isNode(parent) && directionTo(el, parent) === dir) return parent.id;

    const children = mindmapChildren(el.id, elements);
    const child = nearestIn(el, children, dir);
    if (child) return child.id;

    if (parent) {
        const siblings = elements.filter(e => e.parentId === parent.id && e.id !== el.id && isNode(e));
        const sibling = nearestIn(el, siblings, dir);
        if (sibling) return sibling.id;
    }

    return null;
};

/**
 * The sibling that lies in `dir` from `selectedId` — what "move the node that way" should swap
 * with. Geometry again rather than a fixed axis: a horizontal layout stacks siblings
 * vertically, a vertical one stacks them horizontally, and radial fans them round a circle, so
 * no single pair of keys describes "the one before" in all of them.
 *
 * Only true siblings are considered (not the parent, not children), because reordering is a
 * move *within* a sibling row — the hierarchy-first preference that `nextMindmapNode` uses
 * would be wrong here.
 */
export const mindmapSiblingInDirection = (
    selectedId: string,
    dir: ArrowDirection,
    elements: readonly DrawingElement[],
): string | null => {
    const el = elements.find(e => e.id === selectedId);
    if (!el?.parentId) return null;   // the root has no siblings to swap with
    const siblings = elements.filter(e => e.parentId === el.parentId && e.id !== el.id && isNode(e));
    return nearestIn(el, siblings, dir)?.id ?? null;
};
