/**
 * node-editing — operations over a *set* of path anchors.
 *
 * The existing per-anchor helpers in `selection-handler` (convertPathAnchor,
 * deletePathAnchor, insertPathAnchorAt) each act on one `path-anchor-{sub}-{i}` handle,
 * which is all the Selection tool's modifier bindings ever needed. The Node tool selects
 * many anchors at once, so these apply the same edits across a selection — grouped into
 * ONE history entry and ONE write per element, which per-anchor calls in a loop could
 * not give you.
 *
 * Anchor coordinates are element-origin relative (0..width / 0..height), matching
 * `editableSubpaths`; callers converting from world must subtract the element's x/y.
 */

import { store, setStore, pushToHistory, bumpDirtyRevision } from '../store/app-store';
import { editableSubpaths, writeEditableSubpaths, type EditSub } from './tool-handlers/selection-handler';

/** One anchor, addressed across the whole document. */
export interface NodeRef { id: string; sub: number; i: number }

export const sameNode = (a: NodeRef, b: NodeRef) => a.id === b.id && a.sub === b.sub && a.i === b.i;

export const isNodeSelected = (ref: NodeRef) => store.nodeSelection.some(n => sameNode(n, ref));

export const setNodeSelection = (refs: NodeRef[]) => setStore('nodeSelection', refs);

export const clearNodeSelection = () => setStore('nodeSelection', []);

/** Shift-click semantics: add when absent, remove when present. */
export const toggleNodeInSelection = (ref: NodeRef) => {
    setStore('nodeSelection', prev =>
        prev.some(n => sameNode(n, ref)) ? prev.filter(n => !sameNode(n, ref)) : [...prev, ref]);
};

/** Group a flat NodeRef list by element, so each element is written exactly once. */
const byElement = (refs: NodeRef[]): Map<string, NodeRef[]> => {
    const m = new Map<string, NodeRef[]>();
    for (const r of refs) {
        const list = m.get(r.id);
        if (list) list.push(r); else m.set(r.id, [r]);
    }
    return m;
};

/**
 * Apply `mutate` to every selected anchor, one write per element.
 *
 * `mutate` receives the anchor object to edit in place, plus its subpath — deleting is
 * handled by the caller instead (indices shift), see deleteSelectedNodes.
 */
function editSelected(
    refs: NodeRef[],
    mutate: (anchor: any, sub: EditSub, ref: NodeRef) => void,
    record = true,
): boolean {
    if (refs.length === 0) return false;
    let changed = false;
    if (record) pushToHistory();

    for (const [id, group] of byElement(refs)) {
        const el = store.elements.find(e => e.id === id);
        if (!el) continue;
        const subs = editableSubpaths(el);
        if (subs.length === 0) continue;

        let touched = false;
        for (const ref of group) {
            const sp = subs[ref.sub];
            if (!sp) continue;
            const anchor = sp.anchors[ref.i];
            if (!anchor) continue;
            mutate(anchor, sp, ref);
            touched = true;
        }
        if (touched) {
            writeEditableSubpaths(id, el.x, el.y, subs);
            changed = true;
        }
    }

    if (changed) bumpDirtyRevision();
    return changed;
}

/**
 * Move every selected anchor by the same delta (element-origin units).
 *
 * `record` is false while a drag is in flight — the caller pushes history once at
 * pointer-down so the whole drag is a single undo step.
 */
export const moveSelectedNodes = (dx: number, dy: number, record = false): boolean =>
    editSelected(store.nodeSelection, (a) => { a.x += dx; a.y += dy; }, record);

/**
 * Make every selected anchor a corner (handles dropped) or smooth (handles derived from
 * its neighbours, mirrored so the curve passes through cleanly).
 */
export const setSelectedNodesKind = (kind: 'corner' | 'smooth'): boolean =>
    editSelected(store.nodeSelection, (a, sp, ref) => {
        if (kind === 'corner') {
            delete a.inX; delete a.inY; delete a.outX; delete a.outY;
            a.kind = 'corner';
            return;
        }
        const anchors = sp.anchors;
        const n = anchors.length;
        // Wrap on a closed subpath; clamp on an open one so the ends stay put.
        const prev = sp.closed ? anchors[(ref.i - 1 + n) % n] : anchors[Math.max(0, ref.i - 1)];
        const next = sp.closed ? anchors[(ref.i + 1) % n] : anchors[Math.min(n - 1, ref.i + 1)];
        let tx = next.x - prev.x, ty = next.y - prev.y;
        const len = Math.hypot(tx, ty) || 1;
        tx /= len; ty /= len;
        const dOut = Math.hypot(next.x - a.x, next.y - a.y) / 3 || 20;
        const dIn = Math.hypot(a.x - prev.x, a.y - prev.y) / 3 || 20;
        a.outX = tx * dOut; a.outY = ty * dOut;
        a.inX = -tx * dIn; a.inY = -ty * dIn;
        a.kind = 'smooth';
    });

/**
 * Delete every selected anchor. Handled separately from editSelected because removing
 * shifts the indices of everything after it: each subpath's victims are collected and
 * spliced highest-index-first so the earlier indices stay valid.
 *
 * A subpath is never reduced below 2 anchors — it would stop being a path.
 */
export const deleteSelectedNodes = (): boolean => {
    const refs = store.nodeSelection;
    if (refs.length === 0) return false;

    let changed = false;
    pushToHistory();

    for (const [id, group] of byElement(refs)) {
        const el = store.elements.find(e => e.id === id);
        if (!el) continue;
        const subs = editableSubpaths(el);
        if (subs.length === 0) continue;

        // Victims per subpath, descending, so a splice never invalidates a later index.
        const perSub = new Map<number, number[]>();
        for (const r of group) {
            if (!subs[r.sub]) continue;
            const list = perSub.get(r.sub);
            if (list) list.push(r.i); else perSub.set(r.sub, [r.i]);
        }

        let touched = false;
        for (const [subIdx, indices] of perSub) {
            const anchors = subs[subIdx].anchors;
            const unique = [...new Set(indices)].sort((a, b) => b - a);
            // Keep at least 2 — drop the lowest-index victims first if we'd go under.
            const removable = unique.slice(0, Math.max(0, anchors.length - 2));
            for (const i of removable) {
                if (i >= 0 && i < anchors.length) { anchors.splice(i, 1); touched = true; }
            }
        }
        if (touched) { writeEditableSubpaths(id, el.x, el.y, subs); changed = true; }
    }

    if (changed) { clearNodeSelection(); bumpDirtyRevision(); }
    return changed;
};

/** Every anchor of every path in the current element selection, in document order. */
export const allNodesOfSelection = (): NodeRef[] => {
    const out: NodeRef[] = [];
    for (const id of store.selection) {
        const el = store.elements.find(e => e.id === id);
        if (!el) continue;
        editableSubpaths(el).forEach((sp, sub) =>
            sp.anchors.forEach((_a, i) => out.push({ id, sub, i })));
    }
    return out;
};

/**
 * Anchors of the selected paths, with their positions in WORLD space — what the overlay
 * draws and hit-tests against.
 */
export const selectedPathNodes = (): { ref: NodeRef; x: number; y: number; kind: string }[] => {
    const out: { ref: NodeRef; x: number; y: number; kind: string }[] = [];
    for (const id of store.selection) {
        const el = store.elements.find(e => e.id === id);
        if (!el) continue;
        editableSubpaths(el).forEach((sp, sub) => sp.anchors.forEach((a, i) => {
            out.push({ ref: { id, sub, i }, x: el.x + a.x, y: el.y + a.y, kind: a.kind ?? 'corner' });
        }));
    }
    return out;
};
