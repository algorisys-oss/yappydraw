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
const DRAW_METHODS = new Set([
    'rectangle', 'ellipse', 'circle', 'polygon',
    'path', 'line', 'arc', 'linearPath', 'curve',
]);

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

                    // Cache miss — try WASM sketch engine first
                    if (isWasmEnabled('sketchEngine') && isWasmSketchMethod(prop)) {
                        // Merge options with RoughJS defaults (last arg is options)
                        const resolvedOpts = (target.generator as any)._o(args[args.length - 1]);
                        const wasmDrawable = wasmGenerateDrawable(prop, args, resolvedOpts);
                        if (wasmDrawable) {
                            currentDrawables.push(wasmDrawable);
                            currentIndex++;
                            target.draw(wasmDrawable);
                            return wasmDrawable;
                        }
                    }

                    // Fallback — generate via RoughJS generator
                    const drawable: Drawable = (target.generator as any)[prop](...args);
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

    // Draw progress (changes during draw-in animation)
    if (el.drawProgress !== undefined) h += `|dprog${el.drawProgress}`;

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

    return h;
}
