/**
 * DSL Engine — Renders a DSLDiagram IR to canvas elements via YappyAPI.
 *
 * Delegates layout computation to the LayoutManager, then creates
 * canvas elements (nodes, edges, pools) via the YappyAPI.
 */

import type { DSLDiagram, DSLNode, DSLEdge, DSLPool, RenderOptions, RenderResult } from '../types';
import type { ElementType } from '../../types';
import type { NodePosition } from '../layout/types';
import { resolveShapeType } from '../shape-aliases';
import { getShapeDefaults } from '../shape-defaults';
import { mergeNodeStyle, mergeEdgeStyle, mapStyleToOptions } from './render-helpers';
import { resolveSeed } from './seed';
import { bindPalette, applyPalette, type PaletteBinding } from './palette';
import { computeLayout } from '../layout/layout-manager';
import { resolveTargetWidth } from '../layout/width';
import { expandByteGrid } from '../layout/strategies/byte-grid-layout';
import {
    getSequenceEvents,
    computeSequenceTimeline,
    type SeqFragmentBox,
} from '../layout/strategies/sequence-layout';
import { YappyAPI } from '../../api';
import { store, setStore, pushToHistory, deleteElements } from '../../store/app-store';
import { fitShapeToText, getMeasurementRenderer, getFontString } from '../../utils/text-utils';
import { applyMindmapStyling } from './mindmap-style';

/**
 * Render a DSLDiagram to the canvas.
 */
export function renderDiagram(diagram: DSLDiagram, options?: RenderOptions): RenderResult {
    const nodeIdMap = new Map<string, string>();   // DSL id → canvas element id
    const edgeIdMap = new Map<string, string>();
    const poolIdMap = new Map<string, string>();
    let elementCount = 0;

    try {
    pushToHistory();

    // ─── Clear canvas if requested ────────────────────────
    if (options?.clearCanvas) {
        const allIds = store.elements.map(e => e.id);
        if (allIds.length > 0) {
            deleteElements(allIds);
        }
        // Reset to a clean infinite canvas (clears slides so drawings
        // don't get added into an existing slide deck)
        setStore("slides", []);
        setStore("docType", "infinite");
        setStore("showSlideNavigator", false);
        setStore("activeSlideIndex", 0);
    }

    // The width this render lays out for, if any. Read once here and passed down,
    // so the source's `layout.targetWidth` and the render option resolve in one
    // place rather than each strategy deciding which wins.
    const targetWidth = resolveTargetWidth(diagram, options);

    // byte-grid declares one node per SPAN ("exponent, 8 bits"). Expand those into
    // one node per cell, with explicit coordinates, before anything else looks at
    // the node list. The result is a manual-layout diagram, so every stage after
    // this point is unchanged.
    if (diagram.layout?.strategy === 'byte-grid') {
        diagram = expandByteGrid(diagram, targetWidth);
    }

    // Mind-map layouts get their Miro-style look (pill nodes, per-branch colour,
    // curved links) applied here so it follows from `layout: mindmap-*` alone.
    // Runs before auto-sizing so any style-driven sizing is picked up.
    applyMindmapStyling(diagram);

    // Pre-compute text-fitted sizes on nodes that lack explicit dimensions.
    // This ensures the layout engine spaces nodes correctly based on label length.
    applyAutoSizing(diagram.nodes);

    // Declared colour roles become document swatches before any element is made,
    // so nodes can be linked to them as they are created.
    const palette = bindPalette(diagram.palette);

    const allNodes = flattenNodes(diagram.nodes);
    const hasPools = diagram.pools && diagram.pools.length > 0;

    if (hasPools) {
        // ─── Pool-aware rendering ─────────────────────────
        const poolNodes = allNodes.filter(n => n.pool);
        const freeNodes = allNodes.filter(n => !n.pool);

        // Compute pool layout: sizes, positions, and node placement within lanes
        const poolLayout = computePoolLayout(diagram, poolNodes, options);

        // Render pools
        for (const pool of diagram.pools!) {
            const pl = poolLayout.pools.get(pool.id);
            if (!pl) continue;
            const poolElementId = renderPoolSized(pool, pl.x, pl.y, pl.width, pl.height, diagram);
            if (poolElementId) {
                poolIdMap.set(pool.id, poolElementId);
                elementCount++;
            }
        }

        // Render pool-assigned nodes at their lane positions
        for (const node of poolNodes) {
            const pos = poolLayout.nodePositions.get(node.id);
            const elementId = renderNode(node, pos, diagram, options, palette);
            if (elementId) {
                nodeIdMap.set(node.id, elementId);
                elementCount++;

                // Assign containment
                if (node.pool) {
                    const poolCanvasId = poolIdMap.get(node.pool.poolId);
                    if (poolCanvasId) {
                        const laneIndex = typeof node.pool.lane === 'number'
                            ? node.pool.lane
                            : findLaneIndex(diagram, node.pool.poolId, node.pool.lane);
                        if (laneIndex >= 0) {
                            YappyAPI.assignToPoolLane(elementId, poolCanvasId, laneIndex);
                        }
                    }
                }
            }
        }

        // Render free nodes (no pool) using regular layout
        if (freeNodes.length > 0) {
            const positions = computeLayout(diagram, targetWidth);
            for (const node of freeNodes) {
                const pos = positions.get(node.id);
                const elementId = renderNode(node, pos, diagram, options, palette);
                if (elementId) {
                    nodeIdMap.set(node.id, elementId);
                    elementCount++;
                }
            }
        }
    } else {
        // ─── Regular rendering (no pools) ─────────────────
        const positions = computeLayout(diagram, targetWidth);
        for (const node of allNodes) {
            const pos = positions.get(node.id);
            const elementId = renderNode(node, pos, diagram, options, palette);
            if (elementId) {
                nodeIdMap.set(node.id, elementId);
                elementCount++;
            }
        }
    }

    // ─── Render edges ────────────────────────────────────
    const isSequence = diagram.layout?.strategy === 'sequence';
    if (isSequence) {
        // Sequence diagrams render an ordered timeline (messages, notes,
        // combined fragments, activation bars) rather than a flat edge list.
        elementCount += renderSequenceTimeline(diagram, nodeIdMap, edgeIdMap);
    } else if (diagram.edges) {
        // Spread edges that share a class/interface endpoint along its border so their
        // UML arrowheads don't pile up on the center-line clip point (many subclasses →
        // one base). No-op for single edges and for non-class diagrams.
        const anchorMap = distributeClassEdgeAnchors(diagram.edges, nodeIdMap);
        for (const edge of diagram.edges) {
            const sourceCanvasId = nodeIdMap.get(edge.from);
            const targetCanvasId = nodeIdMap.get(edge.to);
            if (!sourceCanvasId || !targetCanvasId) {
                console.warn(`[YappyDSL] Edge skipped: "${edge.from}" → "${edge.to}" (missing node: ${!sourceCanvasId ? edge.from : edge.to})`);
                continue;
            }

            const edgeElementId = renderEdge(edge, sourceCanvasId, targetCanvasId, diagram, anchorMap.get(edge), palette);
            if (edgeElementId) {
                const edgeKey = edge.id ?? `${edge.from}->${edge.to}`;
                edgeIdMap.set(edgeKey, edgeElementId);
                elementCount++;
            }
        }
    }

    // ─── Establish parent-child hierarchy (for mindmap toggle icons) ──
    setParentChildRelationships(diagram.nodes, nodeIdMap);

    // ─── Zoom to fit ─────────────────────────────────────
    if (options?.zoomToFit !== false) {
        requestAnimationFrame(() => YappyAPI.zoomToFit());
    }

    return { nodeIdMap, edgeIdMap, poolIdMap, elementCount };
    } catch (error) {
        console.error('[YappyDSL] Render error:', error);
        // Return partial result so caller knows something went wrong
        return { nodeIdMap, edgeIdMap, poolIdMap, elementCount };
    }
}

// ─── Node Rendering ──────────────────────────────────────

function renderNode(
    node: DSLNode,
    pos: NodePosition | undefined,
    diagram: DSLDiagram,
    options?: RenderOptions,
    palette?: PaletteBinding
): string | null {
    const resolvedType = resolveShapeType(node.shape) as ElementType;
    const defaults = getShapeDefaults(resolvedType);
    const x = (pos?.x ?? node.x ?? 0) + (options?.offsetX ?? 0);
    const y = (pos?.y ?? node.y ?? 0) + (options?.offsetY ?? 0);
    const w = pos?.width ?? node.width ?? defaults.width;
    const h = pos?.height ?? node.height ?? defaults.height;

    // Merge styles
    const mergedStyle = mergeNodeStyle(node.style, node.shape, diagram.defaults);
    const styleOpts = mapStyleToOptions(mergedStyle);

    // Resolve `@role` colour references and collect the swatch links they imply,
    // so the element is linked at creation rather than recoloured afterwards.
    const swatchLinks = palette ? applyPalette(styleOpts, palette) : {};

    // Build element options
    const isDataStructure = resolvedType.startsWith('ds');
    const seed = resolveSeed(diagram.meta?.seed, `node:${node.id}`, styleOpts.seed);
    const elementOpts: Record<string, any> = {
        ...styleOpts,
        ...swatchLinks,
        ...(seed !== undefined ? { seed } : {}),
        ...(node.label ? { containerText: node.label } : {}),
        ...(node.tag ? { tag: node.tag } : {}),
    };

    // UML class sections.
    // Canonical element fields are `attributesText` / `methodsText` — the renderers
    // (uml-class-renderer / uml-interface-renderer), the shared layout in
    // uml-layout-utils, and the SVG export path all read those. Writing to
    // `umlAttributes` / `umlMethods` (as before) left members invisible.
    if (node.sections) {
        if (node.sections.attributes !== undefined) elementOpts.attributesText = node.sections.attributes;
        if (node.sections.methods !== undefined) elementOpts.methodsText = node.sections.methods;
    }

    // Domain-specific properties (BPMN types, DS values, etc.)
    if (node.properties) {
        for (const [key, val] of Object.entries(node.properties)) {
            // Data structure shapes: dsValues maps to `text` property
            if (key === 'dsValues' && isDataStructure) {
                elementOpts.text = val;
            } else {
                elementOpts[key] = val;
            }
        }
    }

    // BPMN shapes use createBpmnShape for proper defaults
    if (resolvedType.startsWith('bpmn')) {
        return YappyAPI.createBpmnShape(
            resolvedType as any,
            x, y, w, h,
            elementOpts
        );
    }

    // Text elements
    if (resolvedType === 'text' && node.label) {
        return YappyAPI.createText(x, y, node.label, elementOpts);
    }

    return YappyAPI.createElement(resolvedType, x, y, w, h, elementOpts);
}

// ─── Edge Rendering ──────────────────────────────────────

type EdgeAnchors = {
    startAnchor?: { fx: number; fy: number };
    endAnchor?: { fx: number; fy: number };
};

/**
 * When several edges share one class/interface endpoint (the base of an inheritance
 * fan, an interface with many implementers), the default center-line clip lands every
 * arrowhead on nearly the same border point and they overlap. Spread each group evenly
 * along the border facing its neighbours, so heads read as distinct.
 *
 * Only touches edges whose *both* ends are `umlClass`/`umlInterface`, so sequence,
 * flowchart, and ER diagrams are unaffected. Groups of one are left alone (the natural
 * center clip is best for a lone edge).
 */
function distributeClassEdgeAnchors(
    edges: DSLEdge[],
    nodeIdMap: Map<string, string>
): Map<DSLEdge, EdgeAnchors> {
    const result = new Map<DSLEdge, EdgeAnchors>();
    const geo = (dslId: string) => {
        const cid = nodeIdMap.get(dslId);
        const el = cid ? YappyAPI.getElement(cid) : null;
        if (!el || !el.width || !el.height) return null;
        return { cx: el.x + el.width / 2, cy: el.y + el.height / 2, w: el.width, h: el.height, type: el.type };
    };
    const isClass = (t?: string) => t === 'umlClass' || t === 'umlInterface';

    const classEdges = edges.filter(e => {
        const s = geo(e.from), t = geo(e.to);
        return s && t && isClass(s.type) && isClass(t.type);
    });
    if (classEdges.length === 0) return result;

    // Spread a group of edges (all touching `shape` at the given end) along the border
    // facing the group's average neighbour, then hand each edge its anchor fraction.
    const distribute = (
        group: { edge: DSLEdge; ox: number; oy: number }[],
        shape: { cx: number; cy: number; w: number; h: number },
        assign: (edge: DSLEdge, a: { fx: number; fy: number }) => void
    ) => {
        if (group.length < 2) return;
        const avgX = group.reduce((s, g) => s + g.ox, 0) / group.length;
        const avgY = group.reduce((s, g) => s + g.oy, 0) / group.length;
        const dx = avgX - shape.cx, dy = avgY - shape.cy;
        // Which border does the group mostly come from? Compare normalized overhangs.
        const vertical = Math.abs(dy) / shape.h >= Math.abs(dx) / shape.w;
        const sorted = [...group].sort((a, b) => (vertical ? a.ox - b.ox : a.oy - b.oy));
        const n = sorted.length;
        sorted.forEach((g, i) => {
            const frac = 0.2 + 0.6 * (i / (n - 1)); // keep heads off the corners
            assign(g.edge, vertical
                ? { fx: frac, fy: dy > 0 ? 1 : 0 }
                : { fx: dx > 0 ? 1 : 0, fy: frac });
        });
    };

    const groupBy = (keyOf: (e: DSLEdge) => string, otherOf: (e: DSLEdge) => string) => {
        const groups = new Map<string, { edge: DSLEdge; ox: number; oy: number }[]>();
        for (const e of classEdges) {
            const other = geo(otherOf(e));
            if (!other) continue;
            const key = keyOf(e);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push({ edge: e, ox: other.cx, oy: other.cy });
        }
        return groups;
    };

    for (const [tid, group] of groupBy(e => e.to, e => e.from)) {
        const t = geo(tid); if (!t) continue;
        distribute(group, t, (edge, a) => {
            const cur = result.get(edge) ?? {}; cur.endAnchor = a; result.set(edge, cur);
        });
    }
    for (const [sid, group] of groupBy(e => e.from, e => e.to)) {
        const s = geo(sid); if (!s) continue;
        distribute(group, s, (edge, a) => {
            const cur = result.get(edge) ?? {}; cur.startAnchor = a; result.set(edge, cur);
        });
    }
    return result;
}

function renderEdge(
    edge: DSLEdge,
    sourceCanvasId: string,
    targetCanvasId: string,
    diagram: DSLDiagram,
    anchors?: EdgeAnchors,
    palette?: PaletteBinding
): string | null {
    const mergedStyle = mergeEdgeStyle(edge.style, diagram.defaults);
    const styleOpts = mapStyleToOptions(mergedStyle);
    const swatchLinks = palette ? applyPalette(styleOpts, palette) : {};

    // Same key the caller uses for `edgeIdMap`, so a seeded edge stays pinned to
    // its logical identity rather than to its position in the edge list.
    const seed = resolveSeed(diagram.meta?.seed, `edge:${edge.id ?? `${edge.from}->${edge.to}`}`, styleOpts.seed);

    const connectOpts: Record<string, any> = {
        ...styleOpts,
        ...swatchLinks,
        ...(seed !== undefined ? { seed } : {}),
        type: edge.type ?? 'arrow',
        curveType: edge.curveType ?? 'bezier',
    };

    if (edge.startArrowhead !== undefined) connectOpts.startArrowhead = edge.startArrowhead;
    if (edge.endArrowhead !== undefined) connectOpts.endArrowhead = edge.endArrowhead;
    if (anchors?.startAnchor) connectOpts.startAnchor = anchors.startAnchor;
    if (anchors?.endAnchor) connectOpts.endAnchor = anchors.endAnchor;

    const connectorId = YappyAPI.connect(sourceCanvasId, targetCanvasId, connectOpts);

    // Add label if present
    if (connectorId && edge.label) {
        YappyAPI.updateElement(connectorId, { containerText: edge.label });
    }

    return connectorId;
}

// ─── Sequence Timeline Rendering ─────────────────────────
//
// A sequence diagram renders an ordered vertical timeline. The geometry
// (Y offsets, fragment extents, activation spans) comes from the shared
// `computeSequenceTimeline` so it always matches the lifeline heights the
// layout reserved. We bypass `connect()` for messages deliberately: its
// intersection routing assumes point-shaped nodes and would land every
// message on the same horizontal line because all lifelines share a Y.

const SEQ_FRAGMENT_MARGIN = 40;     // Horizontal padding around fragment contents
const SEQ_ACTIVATION_WIDTH = 10;    // Activation-bar thickness
const SEQ_ACTIVATION_STAGGER = 6;   // Per-nesting-depth horizontal offset
const SEQ_LABEL_COLOR = '#475569';  // Muted slate for notes / fragment chrome

interface SeqParticipant {
    canvasId: string;
    type: string;
    cx: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Create a small architectural-style text label. */
function makeSeqLabel(x: number, y: number, text: string, extra?: Record<string, any>): string | null {
    return YappyAPI.createText(x, y, text, {
        fontSize: 12,
        fontFamily: 'sans-serif',
        textColor: SEQ_LABEL_COLOR,
        strokeColor: SEQ_LABEL_COLOR,
        ...extra,
    });
}

/**
 * Render the full sequence timeline: actor lifelines, combined fragments,
 * activation bars, notes and messages (with optional auto-numbering).
 * Returns the number of canvas elements created.
 */
function renderSequenceTimeline(
    diagram: DSLDiagram,
    nodeIdMap: Map<string, string>,
    edgeIdMap: Map<string, string>,
): number {
    const vSpacing = diagram.layout?.vSpacing ?? 60;
    const events = getSequenceEvents(diagram.sequence, diagram.edges ?? []);
    const timeline = computeSequenceTimeline(events, vSpacing, diagram.sequence?.autonumber);
    let count = 0;

    // Gather participant geometry from the freshly-created canvas elements.
    const participants = new Map<string, SeqParticipant>();
    for (const [dslId, canvasId] of nodeIdMap) {
        const el = YappyAPI.getElement(canvasId);
        if (!el) continue;
        participants.set(dslId, {
            canvasId,
            type: el.type,
            cx: el.x + el.width / 2,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height,
        });
    }
    if (participants.size === 0) return 0;

    const originY = Math.min(...[...participants.values()].map(p => p.y));
    const lifelineBottom = originY + timeline.totalHeight;

    // 1. Actor lifelines — actors keep their stick-figure head, so draw the
    //    dashed lifeline beneath them down to the shared bottom (umlLifeline
    //    shapes draw their own dashed body).
    for (const p of participants.values()) {
        if (p.type !== 'umlActor') continue;
        const top = p.y + p.height;
        const lineId = YappyAPI.createElement('line', p.cx, top, 0, lifelineBottom - top, {
            strokeColor: SEQ_LABEL_COLOR,
            strokeStyle: 'dashed',
            strokeWidth: 1.5,
            curveType: 'straight',
            points: [0, 0, 0, lifelineBottom - top],
            startArrowhead: null,
            endArrowhead: null,
        });
        if (lineId) count++;
    }

    // 2. Combined fragments (loop / alt / opt / par …) — drawn first so they
    //    sit behind messages and activation bars.
    for (const frag of timeline.fragments) {
        count += renderSequenceFragment(frag, participants, originY);
    }

    // 3. Activation bars on lifelines.
    for (const act of timeline.activations) {
        const p = participants.get(act.participant);
        if (!p || act.bottom <= act.top) continue;
        const barX = p.cx - SEQ_ACTIVATION_WIDTH / 2 + act.depth * SEQ_ACTIVATION_STAGGER;
        const barId = YappyAPI.createElement(
            'activationBar',
            barX,
            originY + act.top,
            SEQ_ACTIVATION_WIDTH,
            act.bottom - act.top,
            { backgroundColor: '#e2e8f0', strokeColor: SEQ_LABEL_COLOR, strokeWidth: 1, fillStyle: 'solid' },
        );
        if (barId) count++;
    }

    // 4. Notes and 5. Messages, walked in timeline order.
    let messageNumber = 0;
    for (const placement of timeline.placements) {
        const ev = placement.event;
        if (ev.kind === 'note') {
            count += renderSequenceNote(ev, placement, participants, originY);
        } else if (ev.kind === 'message') {
            if (timeline.autonumber) messageNumber++;
            const id = renderSequenceMessage(
                ev.edge, participants, originY + placement.y, vSpacing, diagram,
                timeline.autonumber ? messageNumber : undefined,
            );
            if (id) {
                edgeIdMap.set(ev.edge.id ?? `${ev.edge.from}->${ev.edge.to}`, id);
                count++;
            }
        }
    }

    return count;
}

/** Render one message arrow at an absolute Y. */
function renderSequenceMessage(
    edge: DSLEdge,
    participants: Map<string, SeqParticipant>,
    messageY: number,
    vSpacing: number,
    diagram: DSLDiagram,
    seqNumber?: number,
): string | null {
    const source = participants.get(edge.from);
    const target = participants.get(edge.to);
    if (!source || !target) return null;

    const mergedStyle = mergeEdgeStyle(edge.style, diagram.defaults);
    const styleOpts = mapStyleToOptions(mergedStyle);
    const arrowOpts: Record<string, any> = { ...styleOpts };
    if (edge.endArrowhead !== undefined) arrowOpts.endArrowhead = edge.endArrowhead;
    if (edge.startArrowhead !== undefined) arrowOpts.startArrowhead = edge.startArrowhead;
    if (edge.type === 'line') arrowOpts.endArrowhead = arrowOpts.endArrowhead ?? null;

    const label = seqNumber !== undefined
        ? `${seqNumber}${edge.label ? ` ${edge.label}` : ''}`
        : edge.label;

    let arrowId: string | null;
    if (edge.from === edge.to) {
        // Self-message: U-shape on the right of the lifeline (out, down, back).
        const loopWidth = 60;
        const loopHeight = Math.max(20, vSpacing * 0.4);
        arrowId = YappyAPI.createElement('arrow', source.cx, messageY, loopWidth, loopHeight, {
            ...arrowOpts,
            curveType: 'elbow',
            points: [0, 0, loopWidth, 0, loopWidth, loopHeight, 0, loopHeight],
        });
    } else {
        // Normalise to a positive bounding box (x = leftmost) so right-to-left
        // replies don't get a negative width — which renders a stray arrowhead
        // at the source. The arrowhead stays at the target (last point).
        const minX = Math.min(source.cx, target.cx);
        arrowId = YappyAPI.createElement('arrow', minX, messageY, Math.abs(target.cx - source.cx), 0, {
            ...arrowOpts,
            curveType: 'straight',
            points: [source.cx - minX, 0, target.cx - minX, 0],
        });
    }

    if (arrowId && label) {
        YappyAPI.updateElement(arrowId, { containerText: label });
    }
    return arrowId;
}

/** Render a note box spanning one or more participants. */
function renderSequenceNote(
    ev: { placement: 'over' | 'left' | 'right'; participants: string[]; text: string },
    placement: { y: number; height?: number },
    participants: Map<string, SeqParticipant>,
    originY: number,
): number {
    const els = ev.participants.map(id => participants.get(id)).filter((p): p is SeqParticipant => !!p);
    if (els.length === 0) return 0;

    const h = placement.height ?? 40;
    const y = originY + placement.y;
    let x: number;
    let w: number;
    const NOTE_W = 120;

    if (ev.placement === 'left') {
        x = els[0].cx - NOTE_W - 12;
        w = NOTE_W;
    } else if (ev.placement === 'right') {
        x = els[0].cx + 12;
        w = NOTE_W;
    } else {
        // over: span from leftmost to rightmost participant centerline.
        const minCx = Math.min(...els.map(e => e.cx));
        const maxCx = Math.max(...els.map(e => e.cx));
        if (els.length === 1) {
            x = els[0].cx - NOTE_W / 2;
            w = NOTE_W;
        } else {
            x = minCx - 20;
            w = (maxCx - minCx) + 40;
        }
    }

    const noteId = YappyAPI.createElement('umlNote', x, y, w, h, {
        backgroundColor: '#fef9c3',
        strokeColor: '#ca8a04',
        strokeWidth: 1,
        fillStyle: 'solid',
        containerText: ev.text,
        fontSize: 12,
        fontFamily: 'sans-serif',
        textColor: '#713f12',
        textAlign: 'center',
    });
    return noteId ? 1 : 0;
}

/** Render a combined-fragment box (border, operator tab, guard, dividers). */
function renderSequenceFragment(
    frag: SeqFragmentBox,
    participants: Map<string, SeqParticipant>,
    originY: number,
): number {
    const ids = frag.participants.size > 0 ? [...frag.participants] : [...participants.keys()];
    const els = ids.map(id => participants.get(id)).filter((p): p is SeqParticipant => !!p);
    if (els.length === 0) return 0;

    const minCx = Math.min(...els.map(e => e.cx));
    const maxCx = Math.max(...els.map(e => e.cx));
    const fx = minCx - SEQ_FRAGMENT_MARGIN;
    const fw = (maxCx - minCx) + SEQ_FRAGMENT_MARGIN * 2;
    const fy = originY + frag.top;
    const fh = Math.max(40, frag.bottom - frag.top);
    let count = 0;

    const boxId = YappyAPI.createElement('umlFragment', fx, fy, fw, fh, {
        backgroundColor: 'transparent',
        strokeColor: SEQ_LABEL_COLOR,
        strokeWidth: 1,
    });
    if (boxId) count++;

    // Operator keyword inside the corner tab.
    if (makeSeqLabel(fx + 6, fy + 3, frag.operator, { fontSize: 11, fontWeight: true })) count++;
    // Guard / condition just right of the tab.
    if (frag.label) {
        const tabW = Math.min(fw * 0.3, 60);
        if (makeSeqLabel(fx + tabW + 10, fy + 4, `[${frag.label}]`)) count++;
    }

    // Section dividers (alt `else`, par `and`).
    for (const section of frag.sections) {
        const dy = originY + section.y;
        const lineId = YappyAPI.createElement('line', fx, dy, fw, 0, {
            strokeColor: SEQ_LABEL_COLOR,
            strokeStyle: 'dashed',
            strokeWidth: 1,
            curveType: 'straight',
            points: [0, 0, fw, 0],
            startArrowhead: null,
            endArrowhead: null,
        });
        if (lineId) count++;
        if (section.label && makeSeqLabel(fx + 8, dy + 3, `[${section.label}]`)) count++;
    }

    return count;
}

// ─── Pool Layout Computation ────────────────────────────

interface PoolLayoutResult {
    pools: Map<string, { x: number; y: number; width: number; height: number }>;
    nodePositions: Map<string, NodePosition>;
}

const POOL_LABEL_WIDTH = 40;   // Space for rotated pool label
const LANE_LABEL_WIDTH = 30;   // Space for rotated lane label
const LANE_PADDING = 20;       // Padding inside lanes
const NODE_H_SPACING = 30;     // Horizontal spacing between nodes in a lane
const NODE_V_PADDING = 20;     // Vertical padding within a lane

/**
 * Compute pool sizes, lane sizes, and node positions within lanes.
 * Horizontal pools: lanes stacked vertically, nodes flow left-to-right within each lane.
 */
function computePoolLayout(
    diagram: DSLDiagram,
    poolNodes: DSLNode[],
    options?: RenderOptions
): PoolLayoutResult {
    const pools = new Map<string, { x: number; y: number; width: number; height: number }>();
    const nodePositions = new Map<string, NodePosition>();

    const originX = (options?.offsetX ?? 0) + 100;
    let currentY = (options?.offsetY ?? 0) + 100;
    const poolGap = 30;

    // Group nodes by pool and lane
    const poolLaneNodes = new Map<string, Map<string, DSLNode[]>>();
    for (const node of poolNodes) {
        if (!node.pool) continue;
        const { poolId, lane } = node.pool;
        const laneId = String(lane);
        if (!poolLaneNodes.has(poolId)) poolLaneNodes.set(poolId, new Map());
        const laneMap = poolLaneNodes.get(poolId)!;
        if (!laneMap.has(laneId)) laneMap.set(laneId, []);
        laneMap.get(laneId)!.push(node);
    }

    for (const pool of diagram.pools ?? []) {
        const laneMap = poolLaneNodes.get(pool.id) ?? new Map();
        const laneCount = pool.lanes.length;
        const hasLaneLabels = laneCount > 1;
        const contentOffsetX = POOL_LABEL_WIDTH + (hasLaneLabels ? LANE_LABEL_WIDTH : 0);

        // Compute required width and per-lane height
        let maxContentWidth = 0;
        const laneHeights: number[] = [];

        for (let li = 0; li < laneCount; li++) {
            const laneId = pool.lanes[li].id;
            const nodes = laneMap.get(laneId) ?? [];

            // Calculate total width needed for nodes in this lane
            let totalNodeWidth = 0;
            let maxNodeHeight = 0;
            for (const node of nodes) {
                const type = resolveShapeType(node.shape) as ElementType;
                const defaults = getShapeDefaults(type);
                const w = node.width ?? defaults.width;
                const h = node.height ?? defaults.height;
                totalNodeWidth += w + NODE_H_SPACING;
                maxNodeHeight = Math.max(maxNodeHeight, h);
            }
            totalNodeWidth = Math.max(totalNodeWidth - NODE_H_SPACING, 0); // Remove trailing spacing

            maxContentWidth = Math.max(maxContentWidth, totalNodeWidth + LANE_PADDING * 2);
            laneHeights.push(Math.max(maxNodeHeight + NODE_V_PADDING * 2, 80));
        }

        const poolWidth = contentOffsetX + Math.max(maxContentWidth, 300);
        const poolHeight = laneHeights.reduce((sum, h) => sum + h, 0);

        pools.set(pool.id, { x: originX, y: currentY, width: poolWidth, height: poolHeight });

        // Position nodes within each lane
        let laneY = currentY;
        for (let li = 0; li < laneCount; li++) {
            const laneId = pool.lanes[li].id;
            const nodes = laneMap.get(laneId) ?? [];
            const laneH = laneHeights[li];

            let nodeX = originX + contentOffsetX + LANE_PADDING;
            for (const node of nodes) {
                const type = resolveShapeType(node.shape) as ElementType;
                const defaults = getShapeDefaults(type);
                const w = node.width ?? defaults.width;
                const h = node.height ?? defaults.height;

                // Center node vertically within lane
                const nodeY = laneY + (laneH - h) / 2;
                nodePositions.set(node.id, { x: nodeX, y: nodeY, width: w, height: h });
                nodeX += w + NODE_H_SPACING;
            }

            laneY += laneH;
        }

        currentY += poolHeight + poolGap;
    }

    return { pools, nodePositions };
}

// ─── Pool Rendering ──────────────────────────────────────

function renderPoolSized(
    pool: DSLPool,
    x: number, y: number, width: number, height: number,
    diagram: DSLDiagram
): string | null {
    const poolOpts: Record<string, any> = {
        containerText: pool.label ?? pool.id,
        bpmnLaneCount: pool.lanes.length,
        bpmnLaneLabels: pool.lanes.map(l => l.label),
    };

    if (pool.orientation) {
        poolOpts.bpmnOrientation = pool.orientation;
    }

    // Lane colors
    const laneColors = pool.lanes.map(l => l.color).filter(Boolean);
    if (laneColors.length > 0) {
        poolOpts.bpmnLaneColors = pool.lanes.map(l => l.color ?? '');
    }
    const laneTextColors = pool.lanes.map(l => l.textColor).filter(Boolean);
    if (laneTextColors.length > 0) {
        poolOpts.bpmnLaneTextColors = pool.lanes.map(l => l.textColor ?? '');
    }

    // Merge pool style
    if (pool.style) {
        const mergedStyle = mergeNodeStyle(pool.style, 'bpmnPool', diagram.defaults);
        Object.assign(poolOpts, mapStyleToOptions(mergedStyle));
    }

    return YappyAPI.createBpmnShape('bpmnPool', x, y, width, height, poolOpts);
}

// ─── Helpers ─────────────────────────────────────────────

/**
 * Flatten nested node children into a single list.
 */
function flattenNodes(nodes: DSLNode[]): DSLNode[] {
    const result: DSLNode[] = [];
    for (const node of nodes) {
        result.push(node);
        if (node.children && node.children.length > 0) {
            result.push(...flattenNodes(node.children));
        }
    }
    return result;
}

/**
 * Walk DSLNode children hierarchy and set parentId on canvas elements.
 * This enables toggle (expand/collapse) icons on mindmap/tree nodes.
 */
function setParentChildRelationships(nodes: DSLNode[], nodeIdMap: Map<string, string>) {
    function walk(parentNodes: DSLNode[]) {
        for (const node of parentNodes) {
            if (node.children && node.children.length > 0) {
                const parentCanvasId = nodeIdMap.get(node.id);
                if (!parentCanvasId) continue;

                for (const child of node.children) {
                    const childCanvasId = nodeIdMap.get(child.id);
                    if (childCanvasId) {
                        YappyAPI.setParent(childCanvasId, parentCanvasId);
                    }
                }
                walk(node.children);
            }
        }
    }
    walk(nodes);
}

/**
 * Find lane index by lane id in a pool definition.
 */
function findLaneIndex(diagram: DSLDiagram, poolId: string, laneId: string): number {
    const pool = diagram.pools?.find(p => p.id === poolId);
    if (!pool) return -1;
    return pool.lanes.findIndex(l => l.id === laneId);
}

/**
 * Walk the DSLNode tree and stamp auto-sized width/height on nodes whose
 * DSL didn't provide explicit dimensions. This ensures the layout engine
 * allocates enough space for every label *before* positioning begins.
 */
function applyAutoSizing(nodes: DSLNode[]): void {
    for (const node of nodes) {
        if (!node.width && !node.height && node.label) {
            const resolvedType = resolveShapeType(node.shape) as ElementType;
            if (resolvedType === 'text') continue;
            const defaults = getShapeDefaults(resolvedType);
            // UML class/interface boxes must fit their MEMBER lines, not just the
            // class name — otherwise `name: Type` members wrap/overflow (see
            // computeUmlFittedSize).
            const fitted = (resolvedType === 'umlClass' || resolvedType === 'umlInterface') && node.sections
                ? computeUmlFittedSize(resolvedType, node.label, node.sections, defaults, node.style?.fontSize)
                : computeFittedSize(resolvedType, node.label, defaults, node.style?.fontSize);
            node.width = Math.max(defaults.width, fitted.width);
            node.height = Math.max(defaults.height, fitted.height);
        }
        if (node.children && node.children.length > 0) {
            applyAutoSizing(node.children);
        }
    }
}

/**
 * Compute text-fitted dimensions for a node label.
 * Uses the shared offscreen canvas renderer to measure text accurately,
 * ensuring shapes are large enough to contain their labels.
 */
function computeFittedSize(
    type: ElementType,
    label: string,
    defaults: { width: number; height: number },
    fontSize?: number,
): { width: number; height: number } {
    // umlLifeline renders its label only inside the small head-box (capped at
    // SEQUENCE_HEADER_HEIGHT). The generic fitter targets a square-ish aspect
    // ratio and produces a narrow shape, which forces the label to wrap into
    // many lines that then overflow the head-box. Size lifelines wide enough
    // that the label fits in ≤ 2 lines instead.
    //
    // The font default here MUST match `getFontString` (28 px, hand-drawn) —
    // measuring at the wrong size yields wraps the renderer disagrees with.
    if (type === 'umlLifeline') {
        try {
            const renderer = getMeasurementRenderer();
            renderer.font = getFontString({ fontSize });
            const singleLineW = renderer.measureText(label).width;
            const padding = 24;
            const SINGLE_LINE_MAX = 260;
            // For >SINGLE_LINE_MAX labels, pick a width that wraps into ~2 lines
            // with breathing room (÷1.7 instead of /2 absorbs wrap-inefficiency
            // from word boundaries).
            const width = singleLineW + padding <= SINGLE_LINE_MAX
                ? Math.ceil(singleLineW) + padding
                : Math.ceil(singleLineW / 1.7) + padding;
            return { width: Math.max(defaults.width, width), height: defaults.height };
        } catch {
            // fall through to generic fitter
        }
    }
    try {
        const renderer = getMeasurementRenderer();
        const fitted = fitShapeToText(renderer, {
            type,
            width: defaults.width,
            height: defaults.height,
            fontSize: fontSize ?? 16,
        }, label);
        return {
            width: Math.ceil(fitted.width),
            height: Math.ceil(fitted.height),
        };
    } catch {
        // Fallback: simple character-count heuristic if canvas unavailable
        const fs = fontSize ?? 16;
        const charWidth = fs * 0.6;
        const padding = 32;
        const estWidth = Math.max(defaults.width, label.length * charWidth + padding);
        const lines = Math.ceil((label.length * charWidth) / (estWidth - padding));
        const estHeight = Math.max(defaults.height, lines * fs * 1.4 + padding);
        return { width: estWidth, height: estHeight };
    }
}

/**
 * Size a umlClass / umlInterface box to fit its widest member line (so nothing
 * wraps) and all its members (so nothing overflows the compartments). The generic
 * label fitter measures only the class NAME, leaving the box at its 180px default —
 * too narrow for `name: Type` members, which then wrap on canvas (clipped) and, in
 * SVG export (unclipped), spill past the compartment so the type after the colon
 * looks dropped. Measured with the same renderer/font the drawers use, so the sizing
 * and the wrap decision stay in agreement.
 */
function computeUmlFittedSize(
    type: ElementType,
    label: string,
    sections: { attributes?: string; methods?: string },
    defaults: { width: number; height: number },
    fontSize?: number,
): { width: number; height: number } {
    try {
        const renderer = getMeasurementRenderer();
        const baseSize = fontSize ?? 28;      // MUST match getFontString's default
        const memberSize = baseSize * 0.9;    // renderers draw members at 0.9×

        // Widest single line across the (bold) header name and every member line.
        renderer.font = getFontString({ fontSize: baseSize, fontWeight: 'bold' });
        let maxLineW = renderer.measureText(label || '').width;

        const attrLines = (sections.attributes || '').split('\n').map(s => s.trim()).filter(Boolean);
        const methodLines = (sections.methods || '').split('\n').map(s => s.trim()).filter(Boolean);
        renderer.font = getFontString({ fontSize: memberSize });
        for (const ln of [...attrLines, ...methodLines]) {
            maxLineW = Math.max(maxLineW, renderer.measureText(ln).width);
        }

        // +34: 10px inner padding each side of the member text + slack so a small
        // measured/rendered metric drift can't tip a line into wrapping.
        const width = Math.max(defaults.width, Math.ceil(maxLineW) + 34);

        // Height: header band + one row per member line + compartment padding.
        const headerH = type === 'umlInterface'
            ? Math.max(40, baseSize * 1.8)    // stereotype line + name
            : Math.max(30, baseSize + 14);
        const lineH = memberSize * 1.4;
        const attrH = attrLines.length ? attrLines.length * lineH + 14 : (type === 'umlClass' ? 20 : 0);
        const methodH = methodLines.length ? methodLines.length * lineH + 14 : 0;
        const height = Math.max(defaults.height, Math.ceil(headerH + attrH + methodH));

        return { width, height };
    } catch {
        return { width: defaults.width, height: defaults.height };
    }
}
