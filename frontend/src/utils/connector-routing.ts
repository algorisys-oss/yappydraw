import type { DrawingElement } from '../types';
import { intersectElementWithLine, rotatePoint } from './geometry';

/**
 * Connector port allocation ("routing channels", Phase 1).
 *
 * When several connectors from DIFFERENT neighbours converge on ONE side of a node
 * (a hub), they all resolve to the same anchor point and visually stack. This module
 * distributes such fan-in edges into evenly spaced, crossing-minimised PORTS along
 * the shared side — the routing-channel idea from Microsoft Comic Chat (SIGGRAPH '96),
 * see docs/routing-channel-plan.md and docs/microsoft-comic-chat-algorithm.md.
 *
 * Scope (Phase 1): fan-in only — groups with >= 2 DISTINCT opposite endpoints on a
 * side. Exact-duplicate parallels (same element pair + side) are left to the existing
 * sibling-spread in binding-logic.ts. Everything here is a PURE, deterministic
 * function of the element set (no Date.now/Math.random, total-ordered sorts with id
 * tiebreak) so it is idempotent across refresh frames, and it is applied TRANSIENTLY
 * to the resolved endpoint — it never persists anchor fractions.
 *
 * The side an endpoint occupies is derived from WHICH NEIGHBOUR IT FACES (the vector
 * from the node centre to the opposite endpoint), NOT from the stored anchor fraction.
 * That keeps ports move-aware: when a neighbour is dragged to the other side of the
 * node, the port follows it — matching resolveBindingPoint's dynamic re-facing.
 */

export interface Pt { x: number; y: number; }
export type Side = 'top' | 'right' | 'bottom' | 'left';

/** Connector element types that participate in port allocation. */
const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);

/** Fraction of the side kept clear at each end (usable span = [MARGIN, 1-MARGIN]). */
const PORT_MARGIN = 0.15;

/**
 * The side of `node` that faces point `opp`. Compares the centre→opp vector against
 * the node's aspect ratio so the ray exits the correct edge; on a diagonal tie,
 * horizontal sides (left/right) win — a deterministic, arbitrary choice. Rotation
 * (`node.angle`, radians) is handled by evaluating the vector in the node-local frame.
 */
export function sideFacing(node: DrawingElement, opp: Pt): Side {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    let dx = opp.x - cx;
    let dy = opp.y - cy;
    if (node.angle) {
        const c = Math.cos(-node.angle);
        const s = Math.sin(-node.angle);
        const rx = c * dx - s * dy;
        const ry = s * dx + c * dy;
        dx = rx; dy = ry;
    }
    const hw = node.width / 2 || 1;
    const hh = node.height / 2 || 1;
    if (Math.abs(dx) / hw >= Math.abs(dy) / hh) return dx >= 0 ? 'right' : 'left';
    return dy >= 0 ? 'bottom' : 'top';
}

/** Point at fraction `f` along `side` of `node`, honouring node rotation (`angle`, radians). */
export function sidePoint(node: DrawingElement, side: Side, f: number): Pt {
    let x: number, y: number;
    switch (side) {
        case 'top': x = node.x + f * node.width; y = node.y; break;
        case 'bottom': x = node.x + f * node.width; y = node.y + node.height; break;
        case 'left': x = node.x; y = node.y + f * node.height; break;
        case 'right': x = node.x + node.width; y = node.y + f * node.height; break;
    }
    if (node.angle) {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        return rotatePoint(x, y, cx, cy, node.angle);
    }
    return { x, y };
}

/** Centre of the element that endpoint `which` of connector `c` connects to (or its free endpoint). */
function oppositePoint(c: DrawingElement, which: 'start' | 'end', byId: Map<string, DrawingElement>): Pt {
    const otherBinding = which === 'start' ? c.endBinding : c.startBinding;
    const other = otherBinding ? byId.get(otherBinding.elementId) : undefined;
    if (other) return { x: other.x + other.width / 2, y: other.y + other.height / 2 };
    // Unbound opposite end: use the connector's bbox endpoint.
    return which === 'start'
        ? { x: c.x + c.width, y: c.y + c.height }
        : { x: c.x, y: c.y };
}

/**
 * Project a point onto the axis running along `side`, in the NODE-LOCAL frame.
 * `sideFacing` classifies sides locally, so the ordering key must be local too —
 * projecting world coords would sort by the wrong axis on a rotated node and
 * collapse the ordering to the id tiebreak (producing the crossings this prevents).
 */
function projectOntoSide(p: Pt, side: Side, node: DrawingElement): number {
    let dx = p.x - (node.x + node.width / 2);
    let dy = p.y - (node.y + node.height / 2);
    if (node.angle) {
        const c = Math.cos(-node.angle), s = Math.sin(-node.angle);
        const rx = c * dx - s * dy;
        const ry = s * dx + c * dy;
        dx = rx; dy = ry;
    }
    return side === 'top' || side === 'bottom' ? dx : dy;
}

/** Fixed lane spacing used when a side has no extent to spread along (degenerate node). */
const DEGENERATE_SPACING = 16;

interface Member { key: string; proj: number; }

/**
 * Compute a de-overlapped port point for endpoint `which` of `line`, bound to `node`.
 *
 * Returns the replacement endpoint (a point on `node`'s facing side), or `null` when
 * fewer than two connector endpoints share that side (a lone endpoint needs no
 * de-overlap, so the caller keeps the plain anchor with its dynamic re-facing).
 *
 * Any side with >= 2 endpoints is distributed into ports — this covers both hub
 * fan-in (distinct neighbours) and bundles between the SAME pair (duplicates /
 * bidirectional A<->B), which is why the old rigid sibling-spread is no longer needed.
 */
export function allocatePort(
    line: DrawingElement,
    node: DrawingElement,
    which: 'start' | 'end',
    elements: DrawingElement[]
): Pt | null {
    // Reject only non-finite geometry. Zero width/height is still handled (see the
    // degenerate branch below) — the sibling-spread this replaced separated bundles
    // on collapsed/mid-resize shapes, and bailing here would regress that.
    if (!Number.isFinite(node.width) || !Number.isFinite(node.height)) return null;

    // Pass 1: connector endpoints bound to this node. Collect the opposite element ids
    // we actually need, so we resolve just those instead of allocating a Map of every
    // element on every call (this runs per connector, per refresh, during drags).
    type Cand = { c: DrawingElement; w: 'start' | 'end'; otherId?: string };
    const cands: Cand[] = [];
    const needed = new Set<string>();
    for (const c of elements) {
        if (!CONNECTOR_TYPES.has(c.type)) continue;
        for (const w of ['start', 'end'] as const) {
            const b = w === 'start' ? c.startBinding : c.endBinding;
            if (!b || b.elementId !== node.id) continue;
            const otherBinding = w === 'start' ? c.endBinding : c.startBinding;
            if (otherBinding?.elementId === node.id) continue; // skip self-loops
            cands.push({ c, w, otherId: otherBinding?.elementId });
            if (otherBinding?.elementId) needed.add(otherBinding.elementId);
        }
    }
    if (cands.length === 0) return null;

    const byId = new Map<string, DrawingElement>();
    if (needed.size) for (const el of elements) if (needed.has(el.id)) byId.set(el.id, el);

    const ownOpp = oppositePoint(line, which, byId);
    const side = sideFacing(node, ownOpp);

    // Pass 2: keep the candidates that face the same side, ordered along that side.
    const members: Member[] = [];
    for (const { c, w } of cands) {
        const opp = oppositePoint(c, w, byId);
        if (sideFacing(node, opp) !== side) continue;
        members.push({ key: `${c.id}:${w}`, proj: projectOntoSide(opp, side, node) });
    }

    // A lone endpoint on the side needs no de-overlap → keep its plain anchor.
    if (members.length < 2) return null;

    // Total order: by opposite projection along the side, id tiebreak → crossing-minimised, stable.
    members.sort((a, b) => (a.proj - b.proj) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

    const ownKey = `${line.id}:${which}`;
    const i = members.findIndex(m => m.key === ownKey);
    if (i < 0) return null; // defensive: own endpoint must be in the group
    const k = members.length;

    // Degenerate node (zero width/height on this side's axis): there is no extent to
    // spread ports along, so fan out perpendicular at a fixed spacing instead — this
    // preserves the separation the old sibling-spread gave collapsed/mid-resize shapes.
    const span = (side === 'top' || side === 'bottom') ? node.width : node.height;
    if (!span) {
        const base = sidePoint(node, side, 0);
        const offset = (i - (k - 1) / 2) * DEGENERATE_SPACING;
        const horizontalSide = side === 'top' || side === 'bottom';
        let dx = horizontalSide ? offset : 0;
        let dy = horizontalSide ? 0 : offset;
        if (node.angle) {
            const c = Math.cos(node.angle), s = Math.sin(node.angle);
            const rx = c * dx - s * dy, ry = s * dx + c * dy;
            dx = rx; dy = ry;
        }
        return { x: base.x + dx, y: base.y + dy };
    }

    const f = PORT_MARGIN + ((i + 0.5) / k) * (1 - 2 * PORT_MARGIN);
    const portRaw = sidePoint(node, side, f);

    // Snap the bbox-edge port onto the shape's TRUE outline: cast a ray from the node
    // centre through the port point. For rectangles this is a no-op (the ray meets the
    // same edge point); for circles/diamonds/polygons the port lands on the real
    // boundary instead of floating off a flat bbox edge. Falls back to the bbox point.
    const snapped = intersectElementWithLine(node, portRaw, 0);
    return snapped ?? portRaw;
}
