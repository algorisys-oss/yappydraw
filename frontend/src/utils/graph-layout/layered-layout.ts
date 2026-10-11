/**
 * Layered ("Sugiyama") graph layout — the engine behind Arrange → Auto Layout.
 *
 * Pure: boxes in, positions out. Nothing here knows about the store, connectors or
 * containers; `utils/auto-layout.ts` does that translation. Written in-house rather than
 * pulling in dagre or ELK: the whole thing is a few hundred lines, the bundle stays as it
 * is, an `npm install` cannot evict the repo-map tool (CLAUDE.md), and the spacing can be
 * tuned together with the elbow router (which needs ~15px lanes between nodes).
 *
 * The classic four phases, each in its simplest robust form:
 *  1. cycle breaking   — DFS; a back edge is reversed for the duration of the layout
 *  2. layering         — longest path from the sources (every edge points to a later layer)
 *  3. ordering         — barycenter sweeps down and up to reduce crossings
 *  4. coordinates      — nodes packed in order per layer, layers centred on the widest,
 *                        then nudged toward the mean of their neighbours without overlap
 * Long edges get dummy nodes so they take part in ordering and keep a straight lane.
 * Disconnected components are laid out separately and stacked across the layer axis.
 */

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export interface LayoutNode { id: string; width: number; height: number }
export interface LayoutEdge { from: string; to: string }
export interface LayoutOptions {
    direction?: LayoutDirection;
    /** Gap between neighbouring nodes within a layer (px). */
    nodeGap?: number;
    /** Gap between layers (px); the connector corridors live here. */
    layerGap?: number;
    /** Gap between disconnected components (px). */
    componentGap?: number;
}
export interface LayoutResult {
    /** Top-left corner of each node; the whole drawing starts at (0, 0). */
    positions: Map<string, { x: number; y: number }>;
    width: number;
    height: number;
}

const DEFAULTS: Required<LayoutOptions> = { direction: 'TB', nodeGap: 40, layerGap: 80, componentGap: 80 };

interface Internal {
    id: string;
    /** Extent across the layer (the dimension nodes are packed along). */
    across: number;
    /** Extent along the flow (the dimension layers are stacked along). */
    along: number;
    dummy: boolean;
    layer: number;
    order: number;
    pos: number;         // centre, across
}

export function layeredLayout(nodes: LayoutNode[], edges: LayoutEdge[], options: LayoutOptions = {}): LayoutResult {
    const opt = { ...DEFAULTS, ...options };
    const vertical = opt.direction === 'TB' || opt.direction === 'BT';
    const positions = new Map<string, { x: number; y: number }>();
    if (nodes.length === 0) return { positions, width: 0, height: 0 };

    // Only edges between known, distinct nodes count; duplicates collapse.
    const ids = new Set(nodes.map(n => n.id));
    const seen = new Set<string>();
    const E: LayoutEdge[] = [];
    for (const e of edges) {
        if (!ids.has(e.from) || !ids.has(e.to) || e.from === e.to) continue;
        const k = `${e.from}\u0000${e.to}`;
        if (seen.has(k)) continue;
        seen.add(k); E.push(e);
    }

    const byId = new Map<string, Internal>();
    for (const n of nodes) {
        byId.set(n.id, {
            id: n.id, dummy: false, layer: 0, order: 0, pos: 0,
            across: vertical ? n.width : n.height,
            along: vertical ? n.height : n.width,
        });
    }

    // ── Components, laid out one after another along the "across" axis ────────────
    const comps = components(nodes.map(n => n.id), E);
    let cursorAcross = 0;
    let maxAlong = 0;
    for (const comp of comps) {
        const compEdges = E.filter(e => comp.has(e.from) && comp.has(e.to));
        const { nodes: laid, acrossExtent, alongExtent } = layoutComponent([...comp].map(id => byId.get(id)!), compEdges, opt);
        for (const n of laid) {
            if (n.dummy) continue;
            const a = cursorAcross + n.pos - n.across / 2;      // top/left across
            const b = n.layerStart;                              // top/left along
            positions.set(n.id, vertical ? { x: a, y: b } : { x: b, y: a });
        }
        cursorAcross += acrossExtent + opt.componentGap;
        maxAlong = Math.max(maxAlong, alongExtent);
    }
    const totalAcross = Math.max(0, cursorAcross - opt.componentGap);

    // Flip for BT / RL: mirror along the flow axis.
    if (opt.direction === 'BT' || opt.direction === 'RL') {
        for (const n of nodes) {
            const p = positions.get(n.id)!;
            if (vertical) p.y = maxAlong - p.y - n.height; else p.x = maxAlong - p.x - n.width;
        }
    }
    return vertical
        ? { positions, width: totalAcross, height: maxAlong }
        : { positions, width: maxAlong, height: totalAcross };
}

/** Undirected connected components, in a stable order (by first appearance). */
function components(ids: string[], edges: LayoutEdge[]): Set<string>[] {
    const adj = new Map<string, string[]>();
    for (const id of ids) adj.set(id, []);
    for (const e of edges) { adj.get(e.from)!.push(e.to); adj.get(e.to)!.push(e.from); }
    const seen = new Set<string>();
    const out: Set<string>[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        const comp = new Set<string>();
        const stack = [id];
        while (stack.length) {
            const v = stack.pop()!;
            if (seen.has(v)) continue;
            seen.add(v); comp.add(v);
            for (const w of adj.get(v)!) if (!seen.has(w)) stack.push(w);
        }
        out.push(comp);
    }
    return out;
}

type Laid = Internal & { layerStart: number };

function layoutComponent(nodes: Internal[], edges: LayoutEdge[], opt: Required<LayoutOptions>) {
    const idSet = new Set(nodes.map(n => n.id));
    const node = new Map(nodes.map(n => [n.id, n]));

    // 1. Cycle breaking: DFS, reverse back edges (for layout only).
    const out = new Map<string, string[]>();
    for (const n of nodes) out.set(n.id, []);
    for (const e of edges) out.get(e.from)!.push(e.to);
    const state = new Map<string, 0 | 1 | 2>();
    const acyclic: LayoutEdge[] = [];
    const visit = (v: string) => {
        state.set(v, 1);
        for (const w of out.get(v)!) {
            const s = state.get(w) ?? 0;
            if (s === 1) acyclic.push({ from: w, to: v });        // back edge → reversed
            else { acyclic.push({ from: v, to: w }); if (s === 0) visit(w); }
        }
        state.set(v, 2);
    };
    for (const n of nodes) if ((state.get(n.id) ?? 0) === 0) visit(n.id);
    // `visit` pushes each edge once; a node reached by several edges is visited once.

    // 2. Layering: longest path from the sources.
    const preds = new Map<string, string[]>();
    const succs = new Map<string, string[]>();
    for (const n of nodes) { preds.set(n.id, []); succs.set(n.id, []); }
    for (const e of acyclic) { succs.get(e.from)!.push(e.to); preds.get(e.to)!.push(e.from); }
    const layerOf = new Map<string, number>();
    const depth = (v: string): number => {
        const known = layerOf.get(v);
        if (known !== undefined) return known;
        layerOf.set(v, 0); // guard (cannot recurse: graph is acyclic now)
        let d = 0;
        for (const p of preds.get(v)!) d = Math.max(d, depth(p) + 1);
        layerOf.set(v, d);
        return d;
    };
    for (const n of nodes) depth(n.id);
    for (const n of nodes) n.layer = layerOf.get(n.id)!;

    // Dummy nodes for edges that span more than one layer.
    const all: Internal[] = [...nodes];
    const chains: LayoutEdge[] = [];   // edges between consecutive layers only
    let dummyN = 0;
    for (const e of acyclic) {
        const a = node.get(e.from)!, b = node.get(e.to)!;
        if (b.layer - a.layer <= 1) { chains.push(e); continue; }
        let prev = a.id;
        for (let l = a.layer + 1; l < b.layer; l++) {
            const d: Internal = { id: `\u0000d${dummyN++}`, across: 0, along: 0, dummy: true, layer: l, order: 0, pos: 0 };
            all.push(d); node.set(d.id, d);
            chains.push({ from: prev, to: d.id });
            prev = d.id;
        }
        chains.push({ from: prev, to: b.id });
    }
    const up = new Map<string, string[]>();     // predecessors (layer-1)
    const down = new Map<string, string[]>();   // successors (layer+1)
    for (const n of all) { up.set(n.id, []); down.set(n.id, []); }
    for (const e of chains) { down.get(e.from)!.push(e.to); up.get(e.to)!.push(e.from); }

    const layerCount = Math.max(...all.map(n => n.layer)) + 1;
    const layers: Internal[][] = Array.from({ length: layerCount }, () => []);
    for (const n of all) layers[n.layer].push(n);
    layers.forEach(L => L.forEach((n, i) => { n.order = i; }));

    // 3. Ordering: barycenter sweeps. Nodes with no neighbours keep their place.
    const sweep = (nbrs: Map<string, string[]>, from: number, to: number, step: number) => {
        for (let l = from; l !== to; l += step) {
            const L = layers[l];
            const key = new Map<string, number>();
            for (const n of L) {
                const ns = nbrs.get(n.id)!;
                key.set(n.id, ns.length ? ns.reduce((s, id) => s + node.get(id)!.order, 0) / ns.length : n.order);
            }
            L.sort((a, b) => (key.get(a.id)! - key.get(b.id)!) || (a.order - b.order));
            L.forEach((n, i) => { n.order = i; });
        }
    };
    for (let i = 0; i < 4; i++) {
        sweep(up, 1, layerCount, 1);
        sweep(down, layerCount - 2, -1, -1);
    }

    // 4. Coordinates. Pack each layer in order, centre layers, then pull nodes toward
    //    the mean of their neighbours (two passes each way) without breaking the order
    //    or the gap — the cheap version of the priority method.
    const gap = opt.nodeGap;
    const dummyAcross = Math.max(8, gap / 2);
    const extentOf = (n: Internal) => (n.dummy ? dummyAcross : n.across);
    const widths = layers.map(L => L.reduce((s, n) => s + extentOf(n), 0) + gap * Math.max(0, L.length - 1));
    const maxWidth = Math.max(...widths);
    layers.forEach((L, li) => {
        let x = (maxWidth - widths[li]) / 2;
        for (const n of L) { n.pos = x + extentOf(n) / 2; x += extentOf(n) + gap; }
    });
    const nudge = (nbrs: Map<string, string[]>, l: number) => {
        const L = layers[l];
        const want = L.map(n => {
            const ns = nbrs.get(n.id)!;
            return ns.length ? ns.reduce((s, id) => s + node.get(id)!.pos, 0) / ns.length : n.pos;
        });
        // Left-to-right pass respecting the minimum spacing, then right-to-left.
        for (let i = 0; i < L.length; i++) {
            const minPos = i === 0 ? -Infinity : L[i - 1].pos + extentOf(L[i - 1]) / 2 + gap + extentOf(L[i]) / 2;
            L[i].pos = Math.max(minPos, want[i]);
        }
        for (let i = L.length - 1; i >= 0; i--) {
            const maxPos = i === L.length - 1 ? Infinity : L[i + 1].pos - extentOf(L[i + 1]) / 2 - gap - extentOf(L[i]) / 2;
            if (L[i].pos > maxPos) L[i].pos = maxPos;
        }
    };
    for (let pass = 0; pass < 2; pass++) {
        for (let l = 1; l < layerCount; l++) nudge(up, l);
        for (let l = layerCount - 2; l >= 0; l--) nudge(down, l);
    }
    // Normalise so the leftmost node starts at 0.
    let minPos = Infinity;
    for (const n of all) if (!n.dummy) minPos = Math.min(minPos, n.pos - n.across / 2);
    for (const n of all) n.pos -= minPos;
    let acrossExtent = 0;
    for (const n of all) if (!n.dummy) acrossExtent = Math.max(acrossExtent, n.pos + n.across / 2);

    // Layers stacked along the flow: each layer as thick as its thickest node.
    const thick = layers.map(L => L.reduce((m, n) => Math.max(m, n.along), 0));
    const starts: number[] = [];
    let y = 0;
    for (let l = 0; l < layerCount; l++) { starts.push(y); y += thick[l] + opt.layerGap; }
    const alongExtent = Math.max(0, y - opt.layerGap);

    const laid: Laid[] = all.map(n => ({ ...n, layerStart: starts[n.layer] + (thick[n.layer] - n.along) / 2 }));
    void idSet;
    return { nodes: laid, acrossExtent, alongExtent };
}
