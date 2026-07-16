/**
 * Excalidraw ⇄ Yappy interop.
 *
 * Both apps are rough.js-based and store world-space pixel coordinates with radian angles, so the
 * core primitives map almost 1:1. This module is the single field-mapping table between the two.
 *
 * Export (`toExcalidraw`): Yappy `DrawingElement[]` → a `.excalidraw` v2 file object.
 *   - rectangle / circle→ellipse / diamond, line, arrow, text, image, and pen strokes→freedraw map
 *     directly. `path` and every other Yappy shape (~300 types Excalidraw lacks) are downgraded to a
 *     closed `line` polygon via `shapeToPath`, preserving outline + fill; anything with no geometry
 *     falls back to its bounding rectangle. The count of downgraded shapes is returned so callers can
 *     tell the user what lost fidelity.
 *
 * Import (`fromExcalidraw`): a `.excalidraw` file → Yappy `DrawingElement[]`, ids regenerated and all
 *   cross-references (bindings, boundElements, groupIds, containerId) rewritten to the new ids.
 *
 * This is deliberately dependency-light: it takes/returns plain data and does not touch the store, so
 * it can be unit-tested and reused by import/export wiring.
 */
import type { DrawingElement, ElementType, FillStyle, FontFamily, PathAnchor, Point } from '../types';
import { shapeToPath } from './shape-to-path';

export interface ExcalidrawFile {
    type: 'excalidraw';
    version: 2;
    source: string;
    elements: any[];
    appState: { gridSize: number | null; viewBackgroundColor: string };
    files: Record<string, { mimeType: string; id: string; dataURL: string; created: number }>;
}

const SOURCE = 'https://yappydraw.com';

// ── value maps ────────────────────────────────────────────────────────────────
// Excalidraw fillStyle is a small set; Yappy's richer fills collapse to 'solid'.
const FILL_TO_EXC: Record<string, string> = { hachure: 'hachure', 'cross-hatch': 'cross-hatch', solid: 'solid', zigzag: 'zigzag' };
const fillToExc = (f?: FillStyle): string => FILL_TO_EXC[f as string] ?? 'solid';
const fillFromExc = (f?: string): FillStyle => (['hachure', 'cross-hatch', 'solid', 'zigzag'].includes(f as string) ? (f as FillStyle) : 'solid');

const STROKE_OK = new Set(['solid', 'dashed', 'dotted']);
const strokeStyle = (s?: string): 'solid' | 'dashed' | 'dotted' => (STROKE_OK.has(s as string) ? (s as any) : 'solid');

// Excalidraw fontFamily: 1 = hand-drawn (Virgil), 2 = normal (Helvetica), 3 = code (Cascadia).
const fontToExc = (f?: FontFamily): number => (f === 'hand-drawn' || f === 'caveat' || f === 'marker' ? 1 : f === 'code' || f === 'monospace' ? 3 : 2);
const fontFromExc = (n?: number): FontFamily => (n === 1 ? 'hand-drawn' : n === 3 ? 'code' : 'sans-serif');

const clampRough = (r?: number): number => Math.max(0, Math.min(2, Math.round(r ?? 1)));
// Yappy 'architectural' = clean lines → roughness 0; 'sketch' keeps its roughness.
const roughToExc = (el: DrawingElement): number => (el.renderStyle === 'architectural' ? 0 : clampRough(el.roughness));

/** Read an element's `points` (flat `[x,y,…]` or `Point[]`) as `[[x,y],…]` relative to the origin. */
function pointPairs(el: DrawingElement): [number, number][] {
    const p = el.points as any;
    if (!p || !p.length) return [];
    if (typeof p[0] === 'number') {
        const out: [number, number][] = [];
        for (let i = 0; i + 1 < p.length; i += 2) out.push([p[i], p[i + 1]]);
        return out;
    }
    return (p as Point[]).map(pt => [pt.x, pt.y] as [number, number]);
}

/** Sample a shape's path anchors into a flat polygon `[[x,y],…]` for an Excalidraw `line`. */
function anchorsToPairs(anchors: PathAnchor[]): [number, number][] {
    return anchors.map(a => [a.x, a.y] as [number, number]);
}

const nonce = () => 1; // deterministic (Date.now/random are unavailable here); Excalidraw only needs a number

function baseExc(el: DrawingElement, type: string, extra: Record<string, any> = {}) {
    return {
        id: el.id,
        type,
        x: el.x, y: el.y, width: el.width, height: el.height,
        angle: el.angle ?? 0,
        strokeColor: el.strokeColor ?? '#1e1e1e',
        backgroundColor: el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'transparent',
        fillStyle: fillToExc(el.fillStyle),
        strokeWidth: el.strokeWidth ?? 2,
        strokeStyle: strokeStyle(el.strokeStyle),
        roughness: roughToExc(el),
        opacity: el.opacity ?? 100,
        seed: el.seed ?? 1,
        version: 1, versionNonce: nonce(), isDeleted: false,
        groupIds: el.groupIds ?? [],
        frameId: null,
        roundness: el.roundness ?? (type === 'rectangle' && el.borderRadius ? { type: 3 } : null),
        boundElements: el.boundElements ?? null,
        updated: 1,
        link: el.link ?? null,
        locked: el.locked ?? false,
        ...extra,
    };
}

const EXC_PRIMITIVE: Partial<Record<ElementType, string>> = {
    rectangle: 'rectangle', circle: 'ellipse', diamond: 'diamond',
};
const PEN_TYPES = new Set<ElementType>(['fineliner', 'inkbrush', 'marker']);

export interface ToExcalidrawResult { file: ExcalidrawFile; downgraded: number; }

export function toExcalidraw(elements: DrawingElement[], viewBackgroundColor = '#ffffff'): ToExcalidrawResult {
    const out: any[] = [];
    const files: ExcalidrawFile['files'] = {};
    let downgraded = 0;

    for (const el of elements) {
        const primitive = EXC_PRIMITIVE[el.type];
        if (primitive) { out.push(baseExc(el, primitive)); continue; }

        if (el.type === 'line' || el.type === 'arrow' || el.type === 'bezier') {
            const pts = pointPairs(el);
            const points = pts.length ? pts : [[0, 0], [el.width, el.height]];
            out.push(baseExc(el, el.type === 'arrow' ? 'arrow' : 'line', {
                points, lastCommittedPoint: null,
                startBinding: el.startBinding ? { elementId: el.startBinding.elementId, focus: el.startBinding.focus ?? 0, gap: el.startBinding.gap ?? 0 } : null,
                endBinding: el.endBinding ? { elementId: el.endBinding.elementId, focus: el.endBinding.focus ?? 0, gap: el.endBinding.gap ?? 0 } : null,
                startArrowhead: el.startArrowhead ?? null,
                endArrowhead: el.type === 'arrow' ? (el.endArrowhead ?? 'arrow') : (el.endArrowhead ?? null),
            }));
            continue;
        }

        if (el.type === 'text' || el.type === 'richtext') {
            const text = el.text ?? '';
            out.push(baseExc(el, 'text', {
                text, originalText: text,
                fontSize: el.fontSize ?? 20,
                fontFamily: fontToExc(el.fontFamily),
                textAlign: el.textAlign ?? 'left',
                verticalAlign: el.verticalAlign ?? 'top',
                strokeColor: el.textColor ?? el.strokeColor ?? '#1e1e1e',
                containerId: el.containerId ?? null,
                lineHeight: 1.25,
                baseline: (el.fontSize ?? 20) * 0.9,
            }));
            continue;
        }

        if (PEN_TYPES.has(el.type)) {
            const pts = pointPairs(el);
            out.push(baseExc(el, 'freedraw', { points: pts, pressures: [], simulatePressure: true, lastCommittedPoint: pts[pts.length - 1] ?? null }));
            continue;
        }

        if (el.type === 'image') {
            let fileId = el.fileId;
            if (!fileId && el.dataURL) {
                fileId = el.id + '-file';
                files[fileId] = { mimeType: el.mimeType || 'image/png', id: fileId, dataURL: el.dataURL, created: 1 };
            }
            out.push(baseExc(el, 'image', { fileId: fileId ?? null, status: 'saved', scale: el.scale ?? [1, 1] }));
            continue;
        }

        // Everything else (path + ~300 exotic shapes): downgrade to a closed line polygon so the
        // outline + fill survive, or the bounding rectangle if we can't derive geometry.
        const sp = shapeToPath(el);
        if (sp && sp.anchors.length >= 2) {
            const pairs = anchorsToPairs(sp.anchors);
            if (sp.closed && pairs.length) pairs.push(pairs[0]); // close the ring
            out.push(baseExc(el, 'line', { points: pairs, lastCommittedPoint: null, startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: null }));
        } else {
            out.push(baseExc(el, 'rectangle'));
        }
        downgraded++;
    }

    return {
        file: { type: 'excalidraw', version: 2, source: SOURCE, elements: out, appState: { gridSize: null, viewBackgroundColor }, files },
        downgraded,
    };
}

// ── import ──────────────────────────────────────────────────────────────────
export interface FromExcalidrawResult { elements: DrawingElement[]; skipped: number; }

const EXC_TO_YAPPY: Record<string, ElementType> = {
    rectangle: 'rectangle', ellipse: 'circle', diamond: 'diamond',
    line: 'line', arrow: 'arrow', text: 'text', image: 'image', freedraw: 'fineliner',
};

/**
 * Build Yappy elements from an Excalidraw file. `genId(type)` mints a unique id (pass the store's
 * generateId with a batch set); `layerId` is assigned to every element. Coordinates are used as-is
 * (both apps are world-space px); pass `offset` to shift the import (e.g. to the page centre).
 */
export function fromExcalidraw(
    json: any,
    genId: (type: ElementType) => string,
    layerId: string,
    opts: { offset?: { x: number; y: number } } = {},
): FromExcalidrawResult {
    const src: any[] = Array.isArray(json?.elements) ? json.elements : [];
    const files = json?.files ?? {};
    const ox = opts.offset?.x ?? 0, oy = opts.offset?.y ?? 0;

    // First pass: assign new ids so cross-references can be rewritten in the second pass.
    const idMap = new Map<string, string>();
    const kept = src.filter(e => e && !e.isDeleted && EXC_TO_YAPPY[e.type]);
    let skipped = src.length - kept.length;

    for (const e of kept) idMap.set(e.id, genId(EXC_TO_YAPPY[e.type]));
    const mapId = (id?: string | null) => (id && idMap.get(id)) || undefined;

    const elements: DrawingElement[] = [];
    for (const e of kept) {
        const type = EXC_TO_YAPPY[e.type];
        const el: any = {
            id: idMap.get(e.id)!,
            type,
            x: (e.x ?? 0) + ox, y: (e.y ?? 0) + oy,
            width: e.width ?? 0, height: e.height ?? 0,
            angle: e.angle ?? 0,
            strokeColor: e.strokeColor ?? '#000000',
            backgroundColor: e.backgroundColor && e.backgroundColor !== 'transparent' ? e.backgroundColor : 'transparent',
            fillStyle: fillFromExc(e.fillStyle),
            strokeWidth: e.strokeWidth ?? 2,
            strokeStyle: strokeStyle(e.strokeStyle),
            roughness: clampRough(e.roughness),
            // Excalidraw is hand-drawn; roughness 0 reads as clean/architectural.
            renderStyle: (e.roughness ?? 1) === 0 ? 'architectural' : 'sketch',
            opacity: e.opacity ?? 100,
            seed: e.seed ?? 1,
            roundness: e.roundness ?? null,
            locked: !!e.locked,
            link: e.link ?? null,
            layerId,
            groupIds: Array.isArray(e.groupIds) ? e.groupIds.slice() : [],
        };

        if (type === 'line' || type === 'arrow') {
            const pts: [number, number][] = Array.isArray(e.points) ? e.points : [];
            el.points = pts.flat();               // flat [x,y,…] relative to origin
            el.pointsEncoding = 'flat';
            el.curveType = 'straight';
            el.startArrowhead = e.startArrowhead ?? null;
            el.endArrowhead = e.endArrowhead ?? (type === 'arrow' ? 'arrow' : null);
            if (e.startBinding?.elementId) el.startBinding = { elementId: mapId(e.startBinding.elementId), focus: e.startBinding.focus ?? 0, gap: e.startBinding.gap ?? 0 };
            if (e.endBinding?.elementId) el.endBinding = { elementId: mapId(e.endBinding.elementId), focus: e.endBinding.focus ?? 0, gap: e.endBinding.gap ?? 0 };
        } else if (type === 'fineliner') {
            const pts: [number, number][] = Array.isArray(e.points) ? e.points : [];
            el.points = pts.flat();
            el.pointsEncoding = 'flat';
        } else if (type === 'text') {
            el.text = e.text ?? e.originalText ?? '';
            el.fontSize = e.fontSize ?? 20;
            el.fontFamily = fontFromExc(e.fontFamily);
            el.textAlign = e.textAlign ?? 'left';
            el.verticalAlign = e.verticalAlign ?? 'top';
            el.textColor = e.strokeColor ?? '#000000';
            if (e.containerId) el.containerId = mapId(e.containerId) ?? null;
        } else if (type === 'image') {
            const f = e.fileId && files[e.fileId];
            if (f?.dataURL) { el.dataURL = f.dataURL; el.mimeType = f.mimeType || 'image/png'; el.status = 'loaded'; }
            if (Array.isArray(e.scale)) el.scale = e.scale;
        }

        if (Array.isArray(e.boundElements)) {
            el.boundElements = e.boundElements
                .map((b: any) => (mapId(b.id) ? { id: mapId(b.id), type: b.type } : null))
                .filter(Boolean);
        }
        elements.push(el as DrawingElement);
    }

    return { elements, skipped };
}
