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

export const NODE_W = 240;
const COL_GAP = 90;
const ROW_GAP = 30;
const NODE_H_EST = 150; // used only for auto-layout spacing

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
