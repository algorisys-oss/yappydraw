/**
 * Arrange → Auto Layout: lay out the selected shapes (or the whole active layer) as a
 * layered graph built from the connectors between them, then let the connectors re-route.
 *
 * What this does beyond calling `layeredLayout`:
 *  - picks the shapes: the selection when it holds two or more shapes, else every shape
 *    on the active layer; connectors are never laid out, they follow their shapes
 *  - treats a shape that encloses other picked shapes as a CONTAINER: it is left out of
 *    the graph and, afterwards, resized to wrap its (moved) children with padding, so a
 *    VPC frame or swimlane survives the arrange instead of being scattered as a node
 *  - edges come from connectors bound at both ends to picked shapes
 *  - keeps the drawing where it was: the new layout's top-left is the old selection's
 *  - animates the move (180ms, like the mindmap reflow), as ONE undo step
 *  - drops `manualRoute` on the connectors involved — hand bends were for the old places —
 *    and leaves re-routing to the canvas effect, which diffs every shape's box
 */
import { store, setStore, pushToHistory, updateElement } from '../store/app-store';
import type { DrawingElement } from '../types';
import { layeredLayout, type LayoutDirection, type LayoutOptions } from './graph-layout/layered-layout';

const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);
const SKIP_TYPES = new Set(['text', 'freedraw', 'fineliner', 'marker', 'inkbrush', 'ink', 'eraser', 'guide']);

export interface AutoLayoutOptions extends LayoutOptions {
    /** Ids to lay out; default: the selection (≥2 shapes) or the active layer. */
    ids?: string[];
    animate?: boolean;
    /** Padding kept between a container's edge and its children (px). */
    containerPadding?: number;
}

export interface AutoLayoutResult { moved: number; containers: number; direction: LayoutDirection }

const encloses = (outer: DrawingElement, inner: DrawingElement) =>
    inner.x >= outer.x - 1 && inner.y >= outer.y - 1 &&
    inner.x + inner.width <= outer.x + outer.width + 1 &&
    inner.y + inner.height <= outer.y + outer.height + 1;

/** The shapes an auto layout would act on for the current selection, so UI can enable itself. */
export function autoLayoutCandidates(ids?: string[]): DrawingElement[] {
    const pool = ids && ids.length
        ? ids.map(id => store.elements.find(e => e.id === id)).filter((e): e is DrawingElement => !!e)
        : store.elements.filter(e => e.layerId === store.activeLayerId);
    const shapes = pool.filter(e => !CONNECTOR_TYPES.has(e.type) && !SKIP_TYPES.has(e.type) && !e.locked && e.width > 0 && e.height > 0);
    return shapes;
}

export function autoLayout(opts: AutoLayoutOptions = {}): AutoLayoutResult | null {
    const direction = opts.direction ?? 'TB';
    const selected = store.selection.length >= 2 ? [...store.selection] : [];
    const picked = autoLayoutCandidates(opts.ids ?? selected);
    if (picked.length < 2) return null;

    // Containers: picked shapes that enclose at least one other picked shape. A container
    // is laid out COMPOUND: its children form their own graph, the container becomes one
    // node of the outer graph sized to that inner layout, and so on for nested containers.
    // Flat layout would interleave a VPC's services with the clients outside it and the
    // frame would end up wrapping the whole diagram.
    const containers = picked.filter(c => picked.some(o => o !== c && encloses(c, o)));
    const containerIds = new Set(containers.map(c => c.id));
    const leaves = picked.filter(p => !containerIds.has(p.id));
    if (leaves.length < 2) return null;
    const leafIds = new Set(leaves.map(n => n.id));

    // Parent of each picked shape: the smallest container enclosing it (containers nest).
    const parentOf = new Map<string, string | null>();
    for (const p of picked) {
        const ps = containers.filter(c => c !== p && encloses(c, p)).sort((a, b) => a.width * a.height - b.width * b.height);
        parentOf.set(p.id, ps.length ? ps[0].id : null);
    }
    const childrenOf = new Map<string | null, DrawingElement[]>();
    for (const p of picked) {
        const k = parentOf.get(p.id)!;
        if (!childrenOf.has(k)) childrenOf.set(k, []);
        childrenOf.get(k)!.push(p);
    }

    // Edges from connectors bound at both ends to picked leaves.
    const edges: { from: string; to: string }[] = [];
    const connectors: DrawingElement[] = [];
    for (const el of store.elements) {
        if (!CONNECTOR_TYPES.has(el.type)) continue;
        const a = el.startBinding?.elementId, b = el.endBinding?.elementId;
        if (a && b && leafIds.has(a) && leafIds.has(b)) { edges.push({ from: a, to: b }); connectors.push(el); }
    }

    const layoutOpts = { direction, nodeGap: opts.nodeGap ?? 48, layerGap: opts.layerGap ?? 90, componentGap: opts.componentGap ?? 80 };
    const pad = opts.containerPadding ?? 32;
    const titleRoom = 16;

    // The item of the level `scope` that a leaf belongs to: itself, or the ancestor
    // container that is a direct child of `scope`.
    const itemAt = (leafId: string, scope: string | null): string | null => {
        let cur: string | null = leafId;
        while (cur !== null && parentOf.get(cur) !== scope) cur = parentOf.get(cur) ?? null;
        return cur;
    };

    // Relative positions inside each scope, and each container's laid-out size.
    const sizeOf = new Map<string, { width: number; height: number }>();
    const relPos = new Map<string, { x: number; y: number }>();
    const layoutScope = (scope: string | null): { width: number; height: number } => {
        const items = childrenOf.get(scope) ?? [];
        // Containers first, so their sizes are known.
        for (const it of items) if (containerIds.has(it.id)) {
            const inner = layoutScope(it.id);
            sizeOf.set(it.id, { width: inner.width + 2 * pad, height: inner.height + 2 * pad + titleRoom });
        }
        const itemIds = new Set(items.map(i => i.id));
        const seen = new Set<string>();
        const scopedEdges: { from: string; to: string }[] = [];
        for (const e of edges) {
            const a = itemAt(e.from, scope), b = itemAt(e.to, scope);
            if (!a || !b || a === b || !itemIds.has(a) || !itemIds.has(b)) continue;
            const k = `${a}>${b}`; if (seen.has(k)) continue; seen.add(k);
            scopedEdges.push({ from: a, to: b });
        }
        const res = layeredLayout(
            items.map(i => ({ id: i.id, ...(sizeOf.get(i.id) ?? { width: i.width, height: i.height }) })),
            scopedEdges, layoutOpts,
        );
        for (const [id, p] of res.positions) relPos.set(id, p);
        return { width: res.width, height: res.height };
    };
    layoutScope(null);

    // Absolute targets: walk down from the root, offsetting by each container's origin
    // (plus padding and the title row).
    const minX = Math.min(...picked.map(p => p.x));
    const minY = Math.min(...picked.map(p => p.y));
    const targets = new Map<string, { x: number; y: number; width?: number; height?: number }>();
    const place = (scope: string | null, ox: number, oy: number) => {
        for (const it of childrenOf.get(scope) ?? []) {
            const rp = relPos.get(it.id)!;
            const x = ox + rp.x, y = oy + rp.y;
            if (containerIds.has(it.id)) {
                const sz = sizeOf.get(it.id)!;
                targets.set(it.id, { x, y, width: sz.width, height: sz.height });
                place(it.id, x + pad, y + pad + titleRoom);
            } else {
                targets.set(it.id, { x, y });
            }
        }
    };
    place(null, minX, minY);
    const nodes = leaves;

    pushToHistory();
    for (const cn of connectors) if (cn.manualRoute) updateElement(cn.id, { manualRoute: false }, false);

    const animate = opts.animate !== false && typeof requestAnimationFrame !== 'undefined';
    const from = new Map<string, { x: number; y: number; width: number; height: number }>();
    for (const [id] of targets) {
        const el = store.elements.find(e => e.id === id)!;
        from.set(id, { x: el.x, y: el.y, width: el.width, height: el.height });
    }
    const apply = (t: number) => {
        setStore('elements', store.elements.map(el => {
            const to = targets.get(el.id); const f = from.get(el.id);
            if (!to || !f) return el;
            const next: any = { ...el, x: f.x + (to.x - f.x) * t, y: f.y + (to.y - f.y) * t };
            if (to.width !== undefined) next.width = f.width + (to.width - f.width) * t;
            if (to.height !== undefined) next.height = f.height + (to.height - f.height) * t;
            return next;
        }));
    };
    if (!animate) {
        apply(1);
    } else {
        const start = performance.now();
        const DUR = 180;
        const ease = (t: number) => 1 - Math.pow(1 - t, 3);
        const step = (now: number) => {
            const t = Math.min(1, (now - start) / DUR);
            apply(ease(t));
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
    return { moved: nodes.length, containers: containers.length, direction };
}
