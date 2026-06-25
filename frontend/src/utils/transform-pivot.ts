/**
 * Transform reference point (pivot) — Free Transform Phase 1b.
 *
 * A draggable rotation pivot the user can move off the element centre. Placed via
 * the right-click / long-press context action "Set Rotation Point Here" (precision-
 * free on both mouse and touch/pen), then fine-tuned by dragging the on-canvas
 * crosshair; rotation pivots about it instead of the centre.
 *
 * Stored in world coords and keyed by the selection signature so it auto-resets to
 * the centre whenever the selection changes — no lifecycle hooks needed at the (many)
 * `setStore('selection', …)` call sites.
 *
 * Shared by handle-detection (hit-test), selection-handler (drag + rotate),
 * selection-renderer (draw) and context-menu-builder (place/reset) — kept in its own
 * module to avoid import cycles.
 */

import type { DrawingElement } from '../types';

let pivotOverride: { x: number; y: number; key: string } | null = null;

/** Stable signature of a selection; the override only applies while it matches. */
export function selectionKey(selection: string[]): string {
    return selection.join(',');
}

/** Move/place the pivot at a world point for the given selection. */
export function setTransformPivot(x: number, y: number, selection: string[]): void {
    pivotOverride = { x, y, key: selectionKey(selection) };
}

/** Forget any custom pivot (revert to element/selection centre). */
export function clearTransformPivot(): void {
    pivotOverride = null;
}

/** The user-set pivot for this selection, or null if none (→ use centre). */
export function getCustomPivot(selection: string[]): { x: number; y: number } | null {
    if (pivotOverride && pivotOverride.key === selectionKey(selection)) {
        return { x: pivotOverride.x, y: pivotOverride.y };
    }
    return null;
}

/** Effective rotation pivot for a single element: custom pivot, else its centre. */
export function getElementPivot(el: DrawingElement, selection: string[]): { x: number; y: number } {
    return getCustomPivot(selection) ?? { x: el.x + el.width / 2, y: el.y + el.height / 2 };
}
