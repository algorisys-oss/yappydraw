import type { DrawingElement } from "../types";
import { MINDMAP_CONNECTOR_TYPES, mindmapChildren } from "./mindmap-layout";

/**
 * Focus mode's membership set: the focused node, its path to the root, its whole subtree, and
 * the branches drawn between any two of those.
 *
 * Lifted out of `canvas.tsx`'s render effect, where it was inline, because the renderer was the
 * only thing that knew it. Dimmed elements stayed fully hittable, so in focus mode you could
 * select, drag and resize something rendered at 12% opacity — picking up geometry you cannot
 * see. Hit testing and handle detection now consult the same set (see `setFocusFilter`).
 *
 * Ancestors are included on purpose: the path back to the central topic is the context that
 * makes a focused branch legible, and it stays interactive so you can climb out.
 */
export const focusBranchSet = (
    focusId: string | null,
    elements: readonly DrawingElement[],
): Set<string> | null => {
    if (!focusId) return null;
    // A focus id that no longer resolves would produce a set matching nothing, dimming the
    // entire canvas with no visible cause. Treat it as focus-off instead.
    if (!elements.some(e => e.id === focusId)) return null;

    const set = new Set<string>([focusId]);

    let cur = elements.find(e => e.id === focusId);
    let guard = 0;
    while (cur?.parentId && guard++ < 1000) {
        set.add(cur.parentId);
        cur = elements.find(e => e.id === cur!.parentId);
    }

    const queue = [focusId];
    while (queue.length > 0) {
        const pid = queue.shift()!;
        for (const child of mindmapChildren(pid, elements)) {
            if (set.has(child.id)) continue;
            set.add(child.id);
            queue.push(child.id);
        }
    }

    for (const el of elements) {
        if (!MINDMAP_CONNECTOR_TYPES.includes(el.type)) continue;
        if (el.startBinding && el.endBinding &&
            set.has(el.startBinding.elementId) && set.has(el.endBinding.elementId)) {
            set.add(el.id);
        }
    }

    return set;
}

/**
 * The focus set, mirrored for the interaction predicates.
 *
 * `hitTestElement` and `getHandleAtPosition` are pure utilities that take an element list and
 * no app state, and `hitTestElement` is one of the hottest functions in the app — threading a
 * focus set through every caller would be a lot of churn for a view mode, and any caller that
 * missed it would reintroduce exactly the mismatch this fixes. So the canvas publishes the set
 * it just computed, once per render, and the predicates read it.
 *
 * Note this is NOT folded into `isElementHiddenByHierarchy`: that predicate drives rendering
 * too, and focus dims rather than hides. Visible-but-inert is the whole point.
 */
let focusFilter: Set<string> | null = null;

export const setFocusFilter = (set: Set<string> | null): void => {
    focusFilter = set && set.size > 0 ? set : null;
};

/** True when focus mode is on and `id` is outside the focused branch — visible, but inert. */
export const isFocusInert = (id: string): boolean => focusFilter !== null && !focusFilter.has(id);
