/**
 * Layer stacking helpers. Pure: they return fresh objects and never write to the store (see
 * `reorderedLayers` in app-store.ts for why that matters under solid-js/store).
 *
 * Invariant these maintain: `store.layers` is in `order` sequence and `order` is 0..n-1. The
 * Layers panel lists the array (reversed) while the canvas, hit-testing and exports stack by
 * `order`; whenever the two disagreed, the panel showed one stacking and the canvas another.
 */
import type { Layer } from "../types";

/** Layers sorted by `order` (ties keep array order), renumbered 0..n-1. */
export const normalizedLayers = (layers: readonly Layer[]): Layer[] =>
    layers
        .map((layer, idx) => ({ layer, idx }))
        .sort((a, b) => (a.layer.order - b.layer.order) || (a.idx - b.idx))
        .map(({ layer }, order) => ({ ...layer, order }));

/**
 * Orders for a duplicated subtree: every copy sits above the whole original subtree (and below
 * the next layer above it), keeping the copies' relative order. Duplicated children used to keep
 * their original `order`, tying with the originals, so the copy's artwork interleaved with them.
 */
export const subtreeCopyOrders = (layers: readonly Layer[], subtreeIds: readonly string[]): Map<string, number> => {
    const ids = new Set(subtreeIds);
    const members = layers.filter(l => ids.has(l.id)).sort((a, b) => a.order - b.order);
    const top = Math.max(...members.map(l => l.order));
    const out = new Map<string, number>();
    members.forEach((l, rank) => out.set(l.id, top + (rank + 1) / (members.length + 1)));
    return out;
};

/**
 * Where a deleted group's own elements go when its contents are kept: the topmost plain layer
 * inside it, else the topmost plain layer elsewhere. A group layer can't hold artwork.
 */
export const keepContentsSurvivor = (layers: readonly Layer[], groupId: string): Layer | undefined => {
    const inside = new Set([groupId]);
    for (let grew = true; grew;) {
        grew = false;
        for (const l of layers) if (l.parentId && inside.has(l.parentId) && !inside.has(l.id)) { inside.add(l.id); grew = true; }
    }
    const plain = (pred: (l: Layer) => boolean) =>
        layers.filter(l => !l.isGroup && l.id !== groupId && pred(l)).sort((a, b) => b.order - a.order)[0];
    return plain(l => inside.has(l.id)) ?? plain(l => !inside.has(l.id));
};

/** The selected layers with no selected ancestor, in selection order. */
export const topmostSelectedLayers = (layers: readonly Layer[], selected: readonly string[]): string[] => {
    const sel = new Set(selected);
    const parentOf = new Map(layers.map(l => [l.id, l.parentId]));
    const hasSelectedAncestor = (id: string) => {
        const seen = new Set<string>();
        for (let p = parentOf.get(id); p && !seen.has(p); p = parentOf.get(p)) {
            if (sel.has(p)) return true;
            seen.add(p);
        }
        return false;
    };
    return selected.filter(id => !hasSelectedAncestor(id));
};
