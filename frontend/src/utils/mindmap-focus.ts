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
 * Spotlight: dim the whole canvas except these elements and their descendants.
 *
 * Shares the renderer's focus-dimming path rather than adding a second one — the renderer
 * already multiplies a non-member's opacity by 0.12, so a spotlight is the same question with a
 * different answer for "what is in the set".
 *
 * Unlike mind-map focus, a spotlight does NOT change hit testing. Focus is a working mode you
 * enter on purpose, where grabbing what you can't see is a hazard; a spotlight is emphasis, and
 * silently making the rest of a drawing unclickable would be a surprise nobody asked for.
 */
export const spotlightSet = (
    ids: readonly string[] | null | undefined,
    elements: readonly DrawingElement[],
): Set<string> | null => {
    if (!ids?.length) return null;
    const live = ids.filter(id => elements.some(e => e.id === id));
    if (!live.length) return null;   // stale ids mean "no spotlight", never "dim everything"

    const set = new Set<string>(live);
    // A spotlit container brings its subtree: spotlighting a mind-map branch or a grouped
    // diagram and having only the one box stay lit would be useless.
    const queue = [...live];
    while (queue.length) {
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
};

/** Union of the dim-exempt sets — what the renderer keeps at full opacity. Null = dim nothing. */
export const dimExemptSet = (
    focus: Set<string> | null,
    spotlight: Set<string> | null,
): Set<string> | null => {
    if (!focus) return spotlight;
    if (!spotlight) return focus;
    return new Set([...focus, ...spotlight]);
};

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
