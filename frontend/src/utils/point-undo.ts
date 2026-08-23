/**
 * Point-level undo for multi-click construction (the Pen, the Polyline).
 *
 * While one of these tools is building, Ctrl/Cmd+Z must mean "drop the last anchor", not
 * "undo the document". The whole in-progress path is a SINGLE history entry — the snapshot
 * is taken on the first click — so the document undo throws away every anchor at once and
 * leaves the tool pointing at an element that no longer exists.
 *
 * It is routed through this registry rather than by racing the global shortcut with another
 * window keydown listener: both would be capture-phase listeners on `window`, where
 * `stopPropagation` does nothing between listeners on the same target, so which one won came
 * down to component mount order. The global handler asks here first instead, and the answer
 * is "did a tool consume it" — `false` when nothing is building, which is the ordinary undo.
 */

let handler: (() => boolean) | null = null;

/** Canvas installs this while it is mounted; pass `null` on cleanup. */
export const setPointUndoHandler = (fn: (() => boolean) | null): void => { handler = fn; };

/** @returns true when a building tool consumed the undo (caller must not undo the document). */
export const tryPointUndo = (): boolean => (handler ? handler() : false);
