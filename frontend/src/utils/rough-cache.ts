import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Drawable } from 'roughjs/bin/core';
import type { DrawingElement } from '../types';
import { isWasmEnabled } from '../wasm/feature-flags';
import { wasmGenerateDrawable, isWasmSketchMethod } from '../wasm/bridge/sketch-engine-bridge';

// ── Cache storage ────────────────────────────────────────────────
type CacheEntry = { hash: string; drawables: Drawable[] };
const cache = new Map<string, CacheEntry>();
const MAX_CACHE = 2000;

// ── Per-element tracking state ───────────────────────────────────
let currentId: string | null = null;
let currentHash: string | null = null;
let currentDrawables: Drawable[] = [];
let currentIndex = 0;
let isHit = false;

// Methods on RoughCanvas/RoughGenerator that produce Drawables
export const ROUGH_DRAW_METHODS = new Set([
    'rectangle', 'ellipse', 'circle', 'polygon',
    'path', 'line', 'arc', 'linearPath', 'curve',
]);
const DRAW_METHODS = ROUGH_DRAW_METHODS;

/**
 * Produce a Drawable for `method` without drawing it — WASM sketch engine first,
 * RoughJS generator as fallback. Shared by the cache proxy and the drawIn stroke
 * capture (utils/animation/rough-stroke-trace) so both see identical geometry.
 */
export function generateDrawable(rc: RoughCanvas, method: string, args: any[]): Drawable {
    if (isWasmEnabled('sketchEngine') && isWasmSketchMethod(method)) {
        // Merge options with RoughJS defaults (last arg is options)
        const resolvedOpts = (rc.generator as any)._o(args[args.length - 1]);
        const wasmDrawable = wasmGenerateDrawable(method, args, resolvedOpts);
        if (wasmDrawable) return wasmDrawable;
    }
    return (rc.generator as any)[method](...args);
}

// ── Lifecycle ────────────────────────────────────────────────────

export function beginElement(id: string, hash: string): void {
    currentId = id;
    currentHash = hash;
    currentIndex = 0;

    const entry = cache.get(id);
    if (entry && entry.hash === hash) {
        isHit = true;
        currentDrawables = entry.drawables;
    } else {
        isHit = false;
        currentDrawables = [];
    }
}

export function endElement(): void {
    if (currentId && !isHit && currentDrawables.length > 0) {
        if (cache.size >= MAX_CACHE) cache.clear();
        cache.set(currentId, { hash: currentHash!, drawables: currentDrawables });
    }
    currentId = null;
    currentHash = null;
    currentDrawables = [];
    currentIndex = 0;
    isHit = false;
}

export function clearRoughCache(): void {
    cache.clear();
}

// ── Proxy factory ────────────────────────────────────────────────

export function createCachedRc(rc: RoughCanvas): RoughCanvas {
    return new Proxy(rc, {
        get(target, prop, receiver) {
            if (typeof prop === 'string' && DRAW_METHODS.has(prop)) {
                return (...args: any[]) => {
                    // No element being tracked — pass through to original
                    if (!currentId) {
                        return (target as any)[prop](...args);
                    }

                    // Cache hit — replay stored drawable
                    if (isHit && currentIndex < currentDrawables.length) {
                        const drawable = currentDrawables[currentIndex++];
                        target.draw(drawable);
                        return drawable;
                    }

                    // Cache miss — generate (WASM sketch engine, else RoughJS), store, draw
                    const drawable = generateDrawable(target, prop, args);
                    currentDrawables.push(drawable);
                    currentIndex++;
                    target.draw(drawable);
                    return drawable;
                };
            }

            return Reflect.get(target, prop, receiver);
        },
    });
}

// ── Element hash ─────────────────────────────────────────────────

/**
 * Fields that cannot change an element's RoughJS drawables: identity and bookkeeping,
 * plus what the renderer applies as a canvas transform/alpha rather than geometry.
 * Everything NOT listed is digested — an unknown or newly added field therefore costs at
 * worst a cache miss, never a stale drawing. (The hand-written list below used to be the
 * whole hash; it omitted path anchors, so an edited path would have replayed its old shape.)
 */
const HASH_IGNORED = new Set<string>([
    'id', 'name', 'groupIds', 'groupNames', 'layerId', 'locked', 'visible', 'isSelected',
    'link', 'tag', 'opacity', 'angle', 'doodle', 'animations', 'boundElements',
]);

/** Long strings (image data URLs) are hashed once per distinct string, not per frame. */
const longStringDigest = new Map<string, number>();
/** Property names repeat endlessly (x, y, kind…); hash each name once. */
const keyDigest = new Map<string, number>();

const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);
const FNV = 16777619;

function stringDigest(s: string): number {
    let d = 2166136261;
    for (let i = 0; i < s.length; i++) d = Math.imul(d ^ s.charCodeAt(i), FNV);
    return d;
}

function keyOf(k: string): number {
    let d = keyDigest.get(k);
    if (d === undefined) {
        d = stringDigest(k);
        if (keyDigest.size > 5000) keyDigest.clear();
        keyDigest.set(k, d);
    }
    return d;
}

/**
 * Second, independent check: a weighted running sum of every number fed. A stale drawing
 * needs the FNV lane AND this sum to collide at once. Kept as module state (not a second
 * FNV lane) because a two-lane walk measured 3x slower on a 10k-anchor path.
 */
let numSum = 0;
let numCount = 0;

/** Structural FNV-1a digest of any JSON-like value. Key order is the object's own, which is
 *  stable for elements built by the same code; a reordering only costs a miss. */
function feed(h: number, v: unknown): number {
    switch (typeof v) {
        case 'number':
            numSum += v * (1 + (++numCount % 97) * 1e-7);
            f64[0] = v;
            return Math.imul(Math.imul(h ^ u32[0], FNV) ^ u32[1], FNV);
        case 'string': {
            if (v.length > 256) {
                let d = longStringDigest.get(v);
                if (d === undefined) {
                    d = stringDigest(v);
                    if (longStringDigest.size > 200) longStringDigest.clear();
                    longStringDigest.set(v, d);
                }
                return Math.imul(Math.imul(h ^ v.length, FNV) ^ d, FNV);
            }
            h = Math.imul(h ^ (v.length + 0x100), FNV);
            for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), FNV);
            return h;
        }
        case 'boolean': return Math.imul(h ^ (v ? 3 : 4), FNV);
        case 'undefined': return Math.imul(h ^ 5, FNV);
        case 'object': {
            if (v === null) return Math.imul(h ^ 6, FNV);
            if (Array.isArray(v)) {
                h = Math.imul(Math.imul(h ^ 7, FNV) ^ v.length, FNV);
                for (let i = 0; i < v.length; i++) h = feed(h, v[i]);
                return h;
            }
            h = Math.imul(h ^ 8, FNV);
            for (const k in v as Record<string, unknown>) {
                h = feed(Math.imul(h ^ keyOf(k), FNV), (v as Record<string, unknown>)[k]);
            }
            return h;
        }
        default: return Math.imul(h ^ 9, FNV);   // functions/symbols: not part of a drawing
    }
}

/** Digest of every drawing-relevant field (see HASH_IGNORED). */
function digestElement(el: DrawingElement): string {
    numSum = 0; numCount = 0;
    let h = 2166136261;
    for (const k in el) {
        if (HASH_IGNORED.has(k)) continue;
        h = feed(Math.imul(h ^ keyOf(k), FNV), (el as unknown as Record<string, unknown>)[k]);
    }
    return `${(h >>> 0).toString(36)}.${numCount}.${numSum}`;
}

export function computeElementHash(el: DrawingElement): string {
    // Core visual properties that affect RoughJS drawable generation.
    // Excludes: opacity, angle, blendMode, shadow*, text*, layerId
    // (those are handled by canvas transforms or separate rendering steps)
    let h = `${el.type}|${el.x}|${el.y}|${el.width}|${el.height}|${el.strokeColor}|${el.backgroundColor}|${el.fillStyle}|${el.fillDensity || 0}|${el.strokeWidth}|${el.strokeStyle}|${el.roughness}|${el.seed}|${el.renderStyle}`;

    // Shape-specific geometry properties
    if (el.roundness) h += `|rn${el.roundness.type}`;
    if (el.borderRadius) h += `|br${el.borderRadius}`;
    if (el.starPoints) h += `|sp${el.starPoints}`;
    if (el.polygonSides) h += `|ps${el.polygonSides}`;
    if (el.burstPoints) h += `|bp${el.burstPoints}`;
    if (el.shapeRatio !== undefined) h += `|sr${el.shapeRatio}`;
    if (el.sideRatio !== undefined) h += `|si${el.sideRatio}`;
    if (el.depth !== undefined) h += `|dp${el.depth}`;
    if (el.viewAngle !== undefined) h += `|va${el.viewAngle}`;
    if (el.taper !== undefined) h += `|tp${el.taper}`;
    if (el.innerRadius !== undefined) h += `|ir${el.innerRadius}`;

    // Double border
    if (el.drawInnerBorder) h += `|ib${el.innerBorderColor || ''}${el.innerBorderDistance || 0}`;

    // Connector/arrow points
    if (el.points && (el as any).points.length > 0) {
        if (typeof (el.points as any)[0] === 'number') {
            h += `|pt${(el.points as number[]).join(',')}`;
        } else {
            h += `|pt${(el.points as any[]).map((p: any) => `${p.x},${p.y}`).join(';')}`;
        }
    }
    if (el.curveType) h += `|ct${el.curveType}`;
    if (el.controlPoints) h += `|cp${el.controlPoints.map(p => `${p.x},${p.y}`).join(';')}`;

    // Tail properties (callout, speech bubble)
    if (el.tailX !== undefined) h += `|tx${el.tailX}`;
    if (el.tailY !== undefined) h += `|ty${el.tailY}`;
    if (el.tailPosition !== undefined) h += `|tpos${el.tailPosition}`;

    // 3D properties
    if (el.skewX !== undefined) h += `|sx${el.skewX}`;
    if (el.skewY !== undefined) h += `|sy${el.skewY}`;
    if (el.frontTaper !== undefined) h += `|ft${el.frontTaper}`;
    if (el.frontSkewX !== undefined) h += `|fsx${el.frontSkewX}`;
    if (el.frontSkewY !== undefined) h += `|fsy${el.frontSkewY}`;

    // Draw progress: hashed as a flag, NOT a value. A mid-reveal render paints traced
    // polylines directly and issues no `rc` calls at all, so it must not share a key
    // with the finished shape (it would cache an empty drawable list under it). But
    // hashing the number would miss on every frame of the reveal, which is the cost
    // this cache exists to avoid — and no renderer varies its RoughJS geometry by it.
    if (el.drawProgress != null && el.drawProgress < 100) h += `|dprog`;

    // BPMN properties
    if (el.bpmnEventType) h += `|bet${el.bpmnEventType}`;
    if (el.bpmnTaskType) h += `|btt${el.bpmnTaskType}`;
    if (el.bpmnLoopType) h += `|blt${el.bpmnLoopType}`;
    if (el.bpmnNonInterrupting) h += `|bni1`;
    if (el.bpmnLaneCount !== undefined && el.bpmnLaneCount > 1) h += `|blc${el.bpmnLaneCount}`;
    if (el.bpmnIconScale !== undefined && el.bpmnIconScale !== 1) h += `|bis${el.bpmnIconScale}`;
    if (el.bpmnIconColor) h += `|bic${el.bpmnIconColor}`;
    if (el.bpmnIconFilled) h += `|bif1`;
    if (el.bpmnLaneLabels?.length) h += `|bll${el.bpmnLaneLabels.join(',')}`;
    if (el.bpmnLaneHeights?.length) h += `|blh${el.bpmnLaneHeights.join(',')}`;
    if (el.bpmnOrientation) h += `|bor${el.bpmnOrientation}`;
    if (el.bpmnLaneColors?.length) h += `|blc2${el.bpmnLaneColors.join(',')}`;
    if (el.bpmnLaneTextColors?.length) h += `|bltc${el.bpmnLaneTextColors.join(',')}`;
    if (el.bpmnPoolLabelSize != null) h += `|bpls${el.bpmnPoolLabelSize}`;
    if (el.bpmnLaneLabelSize != null) h += `|blls${el.bpmnLaneLabelSize}`;
    if (el.bpmnLaneCollapsed?.length) h += `|blcoll${el.bpmnLaneCollapsed.join(',')}`;

    // Table properties
    if (el.type === 'table') {
        h += `|tr${el.tableRows}|tc${el.tableCols}|th${el.tableHeaders}`;
        if (el.tableColWidths) h += `|tcw${el.tableColWidths.join(',')}`;
        if (el.tableRowHeights) h += `|trh${el.tableRowHeights.join(',')}`;
        if (el.tableColOrder) h += `|tco${el.tableColOrder.join(',')}`;
        h += `|thc${el.tableHeaderColor || ''}|trc${el.tableRowColor || ''}|tarc${el.tableAltRowColor || ''}`;
        h += `|thtc${el.tableHeaderTextColor || ''}|tsc${el.tableSortCol}|tsd${el.tableSortDir}`;
        if (el.tableData) h += `|td${el.tableData.map(r => r.join('\t')).join('\n')}`;
        if (el.tableMergedCells) h += `|tmc${JSON.stringify(el.tableMergedCells)}`;
        if (el.tableCellFormats) h += `|tcf${JSON.stringify(el.tableCellFormats)}`;
        if (el.tableCellBorders) h += `|tcb${JSON.stringify(el.tableCellBorders)}`;
        if (el.tableAnimProgress !== undefined) h += `|taprog${el.tableAnimProgress}`;
        if (el.tableAnimStyle) h += `|tasty${el.tableAnimStyle}`;
    }

    // The readable prefix above is kept for debugging; the digest is what makes the key
    // complete (path anchors, subpaths, dash arrays, and any field added later).
    return `${h}|g${digestElement(el)}`;
}
