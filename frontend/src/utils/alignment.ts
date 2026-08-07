import type { DrawingElement } from "../types";

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionType = 'horizontal' | 'vertical';

/**
 * One align/distribute unit: either a lone element or a whole group, boxed by
 * its members' combined bounds.
 *
 * Align and distribute must treat a group as ONE object — Illustrator-style.
 * Moving each member independently is what used to explode a group (select two
 * groups, hit Align Left, and every member flattened onto the same x). So we
 * cluster the selection by outermost group id, align the cluster's box, then
 * apply that single delta to every member, which leaves the group's internal
 * arrangement untouched.
 */
export interface AlignCluster {
    /** Group id for a grouped cluster, else the element's own id. */
    key: string;
    members: DrawingElement[];
    x: number; y: number; width: number; height: number;
}

/**
 * Bucket the selected elements into align/distribute units.
 *
 * An element's unit is the **outermost group that is entirely selected** — that
 * is what "the group is one object" means in practice. Two consequences worth
 * knowing:
 *  - Click-select a group (which always selects every member) → one unit, so
 *    aligning two groups moves each as a whole.
 *  - Marquee or shift-click *part* of a group → those members are their own
 *    units, because you clearly targeted the objects, not the group.
 * Inside an isolated group ("enter the group"), its members are units in their
 * own right even when all of them are selected, so you can align siblings.
 */
export const clusterSelection = (
    ids: string[], elements: DrawingElement[], isolatedGroupIds: string[] = [],
): AlignCluster[] => {
    const idSet = new Set(ids);
    const selectedElements = elements.filter(el => idSet.has(el.id));

    // group id → how many members exist / how many are selected.
    const total = new Map<string, number>();
    const selected = new Map<string, number>();
    for (const el of elements) {
        if (!el.groupIds) continue;
        const bump = idSet.has(el.id);
        for (const g of el.groupIds) {
            total.set(g, (total.get(g) ?? 0) + 1);
            if (bump) selected.set(g, (selected.get(g) ?? 0) + 1);
        }
    }

    const iso = isolatedGroupIds[isolatedGroupIds.length - 1];
    const unitKeyFor = (el: DrawingElement): string => {
        const gids = el.groupIds;
        if (!gids || gids.length === 0) return el.id;
        // Isolation caps how far out a unit can reach: only groups strictly
        // inside the isolated one count.
        let candidates = gids;
        if (iso) {
            const k = gids.indexOf(iso);
            if (k >= 0) candidates = gids.slice(0, k);
        }
        for (let i = candidates.length - 1; i >= 0; i--) {
            const g = candidates[i];
            if ((selected.get(g) ?? 0) === total.get(g)) return g;
        }
        return el.id;
    };

    const byKey = new Map<string, AlignCluster>();

    for (const el of selectedElements) {
        const key = unitKeyFor(el);
        const existing = byKey.get(key);
        if (!existing) {
            byKey.set(key, { key, members: [el], x: el.x, y: el.y, width: el.width, height: el.height });
            continue;
        }
        existing.members.push(el);
        const minX = Math.min(existing.x, el.x);
        const minY = Math.min(existing.y, el.y);
        const maxX = Math.max(existing.x + existing.width, el.x + el.width);
        const maxY = Math.max(existing.y + existing.height, el.y + el.height);
        existing.x = minX; existing.y = minY;
        existing.width = maxX - minX; existing.height = maxY - minY;
    }

    return [...byKey.values()];
};

/** Turn a per-cluster (dx, dy) into per-member position updates. */
const shiftCluster = (
    cluster: AlignCluster, dx: number, dy: number,
    out: { id: string, updates: Partial<DrawingElement> }[],
) => {
    if (dx === 0 && dy === 0) return;
    for (const el of cluster.members) {
        const up: Partial<DrawingElement> = {};
        if (dx !== 0) up.x = el.x + dx;
        if (dy !== 0) up.y = el.y + dy;
        out.push({ id: el.id, updates: up });
    }
};

export const calculateAlignment = (ids: string[], elements: DrawingElement[], type: AlignmentType, keyId?: string, isolatedGroupIds: string[] = []): { id: string, updates: Partial<DrawingElement> }[] => {
    const clusters = clusterSelection(ids, elements, isolatedGroupIds);
    // Two *units* are needed — a lone group is one unit and has nothing to align
    // against, so selecting a single group is now a no-op instead of a scramble.
    if (clusters.length < 2) return [];

    // The alignment frame is normally the selection's bounding box; with a key
    // object it's that object's box instead (and the key object never moves).
    // A key inside a group promotes its whole group to the key cluster.
    const key = keyId ? clusters.find(c => c.members.some(el => el.id === keyId)) : undefined;
    let minX: number, minY: number, maxX: number, maxY: number;
    if (key) {
        minX = key.x; minY = key.y; maxX = key.x + key.width; maxY = key.y + key.height;
    } else {
        minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
        clusters.forEach(c => {
            minX = Math.min(minX, c.x);
            minY = Math.min(minY, c.y);
            maxX = Math.max(maxX, c.x + c.width);
            maxY = Math.max(maxY, c.y + c.height);
        });
    }

    const midX = minX + (maxX - minX) / 2;
    const midY = minY + (maxY - minY) / 2;

    const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

    clusters.forEach(c => {
        if (key && c.key === key.key) return; // the key object stays put
        let dx = 0, dy = 0;

        switch (type) {
            case 'left':
                dx = minX - c.x;
                break;
            case 'center': // Horizontal center
                dx = (midX - c.width / 2) - c.x;
                break;
            case 'right':
                dx = (maxX - c.width) - c.x;
                break;
            case 'top':
                dy = minY - c.y;
                break;
            case 'middle': // Vertical middle
                dy = (midY - c.height / 2) - c.y;
                break;
            case 'bottom':
                dy = (maxY - c.height) - c.y;
                break;
        }

        shiftCluster(c, dx, dy, updates);
    });

    return updates;
};

export const calculateDistribution = (ids: string[], elements: DrawingElement[], type: DistributionType, isolatedGroupIds: string[] = []): { id: string, updates: Partial<DrawingElement> }[] => {
    // Groups distribute as one unit — see `clusterSelection`.
    const clusters = clusterSelection(ids, elements, isolatedGroupIds);
    if (clusters.length < 3) return []; // Need at least 3 to distribute between the two ends.

    // Sort by position
    const sorted = [...clusters].sort((a, b) => {
        if (type === 'horizontal') {
            return (a.x + a.width / 2) - (b.x + b.width / 2);
        } else {
            return (a.y + a.height / 2) - (b.y + b.height / 2);
        }
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // "Distribute objects horizontally" in Figma/Adobe means "distribute
    // horizontal centres" — equalize the spacing between centres, ends fixed.
    const updates: { id: string, updates: Partial<DrawingElement> }[] = [];

    if (type === 'horizontal') {
        const startX = first.x + first.width / 2;
        const endX = last.x + last.width / 2;
        const step = (endX - startX) / (sorted.length - 1);

        sorted.forEach((c, index) => {
            if (index === 0 || index === sorted.length - 1) return; // Don't move ends
            const targetCenterX = startX + step * index;
            shiftCluster(c, (targetCenterX - c.width / 2) - c.x, 0, updates);
        });
    } else {
        const startY = first.y + first.height / 2;
        const endY = last.y + last.height / 2;
        const step = (endY - startY) / (sorted.length - 1);

        sorted.forEach((c, index) => {
            if (index === 0 || index === sorted.length - 1) return;
            const targetCenterY = startY + step * index;
            shiftCluster(c, 0, (targetCenterY - c.height / 2) - c.y, updates);
        });
    }
    return updates;
};

/**
 * Distribute by SPACING — make the edge-to-edge gaps between adjacent objects
 * equal (unlike `calculateDistribution`, which equalizes centres). With an
 * explicit `gap`, pack the objects from the first with exactly that gap;
 * otherwise spread them so the gaps are equal while keeping the first and last
 * objects in place. Needs ≥ 3 objects (or ≥ 2 when an explicit gap is given).
 */
export const calculateSpacingDistribution = (
    ids: string[], elements: DrawingElement[], type: DistributionType, gap?: number, isolatedGroupIds: string[] = [],
): { id: string, updates: Partial<DrawingElement> }[] => {
    // Groups pack as one unit — see `clusterSelection`.
    const clusters = clusterSelection(ids, elements, isolatedGroupIds);
    const horizontal = type === 'horizontal';
    const size = (c: AlignCluster) => (horizontal ? c.width : c.height);
    const pos = (c: AlignCluster) => (horizontal ? c.x : c.y);
    const sorted = [...clusters].sort((a, b) => pos(a) - pos(b));
    if (sorted.length < (gap !== undefined ? 2 : 3)) return [];

    const updates: { id: string, updates: Partial<DrawingElement> }[] = [];
    const moveTo = (c: AlignCluster, target: number) => {
        const delta = target - pos(c);
        shiftCluster(c, horizontal ? delta : 0, horizontal ? 0 : delta, updates);
    };

    if (gap !== undefined) {
        // Pack with a fixed gap, starting at the first object's position.
        let cursor = pos(sorted[0]) + size(sorted[0]) + gap;
        for (let i = 1; i < sorted.length; i++) {
            moveTo(sorted[i], cursor);
            cursor += size(sorted[i]) + gap;
        }
        return updates;
    }

    // Equal gaps between first and last (both ends fixed).
    const startEdge = pos(sorted[0]) + size(sorted[0]);
    const endEdge = pos(sorted[sorted.length - 1]);
    const totalSize = sorted.slice(1, -1).reduce((s, c) => s + size(c), 0);
    const equalGap = (endEdge - startEdge - totalSize) / (sorted.length - 1);
    let cursor = startEdge + equalGap;
    for (let i = 1; i < sorted.length - 1; i++) {
        moveTo(sorted[i], cursor);
        cursor += size(sorted[i]) + equalGap;
    }
    return updates;
};
