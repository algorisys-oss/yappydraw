/**
 * Node-graph layout + wiring for the visual game builder's graph view.
 *
 * Nodes ARE behaviors (one per rule). This module: (1) resolves each node's
 * position (its persisted `graphPos`, else an auto-layout in columns by owner),
 * and (2) derives the message "wires" — a broadcast in one node connects to
 * every node that receives the same message.
 */

import type { DrawingElement } from '../types';
import type { Behavior } from './behavior-types';
import { broadcastsOf, receivesOf } from './behavior-ui';

export interface GraphNode {
    /** owner tag (a sprite) or '' for Scene. */
    owner: string;
    ownerLabel: string;
    behavior: Behavior;
    x: number;
    y: number;
}
export interface GraphWire { from: string; to: string; message: string }

/** A scene-flow destination (a state or a page) referenced by goToState/goToPage. */
export interface FlowTarget {
    id: string;            // 'state:<name>' | 'page:<index>'
    kind: 'state' | 'page';
    label: string;
    x: number;
    y: number;
}
/** A flow wire from a rule node to a scene-flow target (state/page). */
export interface FlowWire { from: string; to: string; kind: 'state' | 'page' }

export const NODE_W = 240;
export const TARGET_W = 168;
export const FLOW_STATE_COLOR = '#8b5cf6'; // violet — state jumps
export const FLOW_PAGE_COLOR = '#0ea5e9';  // sky — page jumps
const COL_GAP = 90;
const ROW_GAP = 30;
const NODE_H_EST = 150; // used only for auto-layout spacing
const TARGET_ROW_GAP = 66;

/** All behaviors as graph nodes with resolved positions. */
export function buildGraphNodes(elements: DrawingElement[], sceneBehaviors: Behavior[]): GraphNode[] {
    const columns: { owner: string; ownerLabel: string; behaviors: Behavior[] }[] = [];
    columns.push({ owner: '', ownerLabel: 'Scene', behaviors: sceneBehaviors });
    for (const el of elements) {
        if (el.tag && (el.behaviors?.length ?? 0) > 0) {
            columns.push({ owner: el.tag, ownerLabel: el.tag, behaviors: el.behaviors! });
        }
    }

    const nodes: GraphNode[] = [];
    columns.forEach((col, ci) => {
        let y = 40;
        for (const b of col.behaviors) {
            const auto = { x: 40 + ci * (NODE_W + COL_GAP), y };
            const pos = b.graphPos ?? auto;
            nodes.push({ owner: col.owner, ownerLabel: col.ownerLabel, behavior: b, x: pos.x, y: pos.y });
            y += NODE_H_EST + ROW_GAP;
        }
    });
    return nodes;
}

/** Message wires: every broadcast(msg) → every node whose trigger receives(msg). */
export function deriveWires(nodes: GraphNode[]): GraphWire[] {
    const receivers = new Map<string, string[]>(); // message → node behavior ids
    for (const n of nodes) {
        const m = receivesOf(n.behavior);
        if (m) (receivers.get(m) ?? receivers.set(m, []).get(m)!).push(n.behavior.id);
    }
    const wires: GraphWire[] = [];
    for (const n of nodes) {
        for (const msg of broadcastsOf(n.behavior)) {
            for (const toId of receivers.get(msg) ?? []) {
                if (toId !== n.behavior.id) wires.push({ from: n.behavior.id, to: toId, message: msg });
            }
        }
    }
    return wires;
}

/**
 * The scene-flow destinations a behavior jumps to — its goToState / goToPage
 * actions, as flow-output edges. `slideName` maps a page index to a readable
 * page name for the label (optional).
 */
export function flowTargetsOf(b: Behavior, slideName?: (i: number) => string | undefined): { id: string; kind: 'state' | 'page'; label: string }[] {
    const out: { id: string; kind: 'state' | 'page'; label: string }[] = [];
    for (const a of b.actions) {
        if (a.kind === 'goToState') {
            const key = (a.state ?? '') as string;
            out.push({ id: `state:${key}`, kind: 'state', label: key || '(unset state)' });
        } else if (a.kind === 'goToPage') {
            const i = (a.index ?? 0) as number;
            const nm = slideName?.(i);
            out.push({ id: `page:${i}`, kind: 'page', label: nm ? `${nm}` : `Page ${i}` });
        }
    }
    return out;
}

/**
 * Distinct scene-flow targets (states/pages any rule jumps to), auto-placed in a
 * column just to the right of the furthest node. Positions are derived (not
 * persisted) — the column tracks the graph as nodes move.
 */
export function deriveFlowTargets(nodes: GraphNode[], slideName?: (i: number) => string | undefined): FlowTarget[] {
    const map = new Map<string, { id: string; kind: 'state' | 'page'; label: string }>();
    for (const n of nodes) for (const t of flowTargetsOf(n.behavior, slideName)) if (!map.has(t.id)) map.set(t.id, t);
    if (map.size === 0) return [];
    let maxRight = 0;
    for (const n of nodes) maxRight = Math.max(maxRight, n.x + NODE_W);
    const colX = maxRight + COL_GAP + 40;
    const targets: FlowTarget[] = [];
    let y = 40;
    for (const t of map.values()) { targets.push({ ...t, x: colX, y }); y += TARGET_ROW_GAP; }
    return targets;
}

/** Flow wires: every rule that jumps → its state/page target node. */
export function deriveFlowWires(nodes: GraphNode[]): FlowWire[] {
    const wires: FlowWire[] = [];
    const seen = new Set<string>();
    for (const n of nodes) {
        for (const t of flowTargetsOf(n.behavior)) {
            const key = `${n.behavior.id}->${t.id}`;
            if (seen.has(key)) continue;
            seen.add(key);
            wires.push({ from: n.behavior.id, to: t.id, kind: t.kind });
        }
    }
    return wires;
}

/**
 * SVG cubic-bezier `d` for a wire between two points — the Blueprint-style
 * horizontal S-curve (lifted from connector-renderer.ts).
 */
export function wirePath(x1: number, y1: number, x2: number, y2: number): string {
    const w = x2 - x1, h = y2 - y1;
    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
    if (Math.abs(w) > Math.abs(h)) {
        cp1x = x1 + w / 2; cp1y = y1;
        cp2x = x2 - w / 2; cp2y = y2;
    } else {
        cp1x = x1; cp1y = y1 + h / 2;
        cp2x = x2; cp2y = y2 - h / 2;
    }
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/** Stable-ish color per message name (for wires + ports). */
export function messageColor(msg: string): string {
    let h = 0;
    for (let i = 0; i < msg.length; i++) h = (h * 31 + msg.charCodeAt(i)) % 360;
    return `hsl(${h}, 70%, 50%)`;
}
