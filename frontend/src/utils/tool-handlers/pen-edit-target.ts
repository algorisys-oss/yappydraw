/**
 * Pen: add / delete anchors on the selected path (Illustrator's Pen+ / Pen− cursors).
 *
 * With the Pen idle over the SELECTED path, clicking a segment inserts an anchor there and
 * clicking an anchor deletes it — no switch to the Node tool for the two edits made most often
 * while drawing. Illustrator scopes this to the selected path so the Pen can still start a new
 * path on top of any other shape; so does this.
 *
 * Its own module rather than part of pen-path-handler: the insert/delete operations live in
 * selection-handler, which already imports pen-path-handler (for `constrainHandleVec`), and the
 * reverse import would close a cycle. Resuming an open path from its END anchor is the Pen
 * handler's job and outranks this — callers ask `findPenResumeTarget` first.
 */

import { store, isLayerLocked } from '../../store/app-store';
import { getPathHandleAtPosition } from '../handle-detection';
import { canInsertPathAnchor, insertPathAnchorAt, deletePathAnchor } from './selection-handler';
import { getPathSubpaths } from '../math/path-utils';

export type PenEditTarget =
    | { kind: 'delete'; id: string; sub: number; i: number; x: number; y: number }
    | { kind: 'add'; id: string };

/**
 * What an idle Pen click at world (x, y) would edit, or null to draw as usual.
 *
 * Only a single selected, unlocked, unrotated `path`: `insertPathAnchorAt` works in the
 * element's unrotated frame, and guessing on a rotated one would drop the anchor off the curve
 * (the same reason the Pen won't resume a rotated path). An anchor is only deletable while the
 * subpath keeps at least two, which is `deletePathAnchor`'s own floor — offering a delete it
 * would refuse would be a cursor that lies.
 */
export function findPenEditTarget(x: number, y: number, scale: number): PenEditTarget | null {
    if (store.selection.length !== 1) return null;
    const el = store.elements.find(e => e.id === store.selection[0]);
    if (!el || el.type !== 'path' || el.locked || el.angle || el.visible === false) return null;
    if (isLayerLocked(el.layerId)) return null;

    const handle = getPathHandleAtPosition(el, x, y, scale);
    const m = handle?.match(/^path-anchor-(\d+)-(\d+)$/);
    if (m) {
        const sub = parseInt(m[1], 10), i = parseInt(m[2], 10);
        const anchors = getPathSubpaths(el)[sub]?.anchors;
        if (!anchors || anchors.length <= 2) return null;
        const a = anchors[i];
        return { kind: 'delete', id: el.id, sub, i, x: el.x + a.x, y: el.y + a.y };
    }
    // A handle hit is not an edit target here: an idle Pen shows no handles to aim at.
    if (handle) return null;
    if (canInsertPathAnchor(el.id, x, y, scale)) return { kind: 'add', id: el.id };
    return null;
}

/** Apply a target from `findPenEditTarget`. Each is one undo step (the operations push it). */
export function applyPenEditTarget(t: PenEditTarget, x: number, y: number, scale: number): void {
    if (t.kind === 'delete') deletePathAnchor(t.id, t.sub, t.i);
    else insertPathAnchorAt(t.id, x, y, scale);
}
