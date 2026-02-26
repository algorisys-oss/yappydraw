// Phase 7: Batch renderer bridge
// Provides WASM-accelerated batch viewport culling and shape path pre-computation.

import type { DrawingElement } from '../../types';
import type { ViewportBounds } from '../../utils/canvas-renderer';
import { getWasmExports } from './wasm-loader';
import { getElementBuffer, getElementBufferPtr } from './memory-pool';

// ─── Element buffer layout ───
// [x, y, w, h, angle, typeEnum] per element — 6 f64 fields
const ELEMENT_FIELDS = 6;
const MAX_ELEMENTS = 2048;

// ─── Batch shape data layout ───
const BATCH_SHAPE_FIELDS = 6;  // [shapeType, w, h, param1, param2, param3]

// Shape type enums (must match assembly/batch-renderer.ts and shape-paths-bridge.ts)
function getShapeEnum(type: string): number {
  switch (type) {
    case 'triangle':          return 1;
    case 'diamond':           return 2;
    case 'rightTriangle':     return 3;
    case 'parallelogram':     return 4;
    case 'trapezoid':         return 5;
    case 'stickyNote':        return 6;
    case 'hexagon':           return 7;
    case 'pentagon':          return 8;
    case 'septagon':          return 9;
    case 'octagon':           return 10;
    case 'polygon':           return 11;
    case 'star':              return 12;
    case 'burst':             return 13;
    case 'burstBlob':         return 14;
    case 'arrowLeft':         return 15;
    case 'arrowRight':        return 16;
    case 'arrowUp':           return 17;
    case 'arrowDown':         return 18;
    case 'umlSignalSend':     return 19;
    case 'umlSignalReceive':  return 20;
    case 'checkmark':         return 21;
    case 'bracketLeft':       return 22;
    case 'bracketRight':      return 23;
    default:                  return 0;
  }
}

/**
 * Write element bounds to the WASM element buffer.
 * Returns the number of elements written.
 * Reuses the shared element buffer from memory-pool.ts.
 */
export function syncElementBounds(elements: DrawingElement[]): number {
  const buf = getElementBuffer();
  if (!buf) return 0;

  const count = Math.min(elements.length, MAX_ELEMENTS);
  for (let i = 0; i < count; i++) {
    const el = elements[i];
    const base = i * ELEMENT_FIELDS;
    buf[base]     = el.x;
    buf[base + 1] = el.y;
    buf[base + 2] = el.width;
    buf[base + 3] = el.height;
    buf[base + 4] = el.angle || 0;
    buf[base + 5] = 0; // typeEnum (not used for viewport culling)
  }

  return count;
}

/**
 * WASM-accelerated batch viewport culling.
 * Elements must already be synced via syncElementBounds().
 * Returns array of element indices that pass the AABB viewport test.
 */
export function wasmBatchViewportCull(
  count: number,
  vp: ViewportBounds,
  scale: number
): number[] | null {
  const w = getWasmExports();
  if (!w) return null;

  const elemBufPtr = getElementBufferPtr();
  if (!elemBufPtr) return null;

  const visibleCount: number = (w as any).batchViewportCull(
    elemBufPtr, count,
    vp.minX, vp.maxX,
    vp.minY, vp.maxY,
    vp.bufferX, vp.bufferY,
    scale,
  );

  if (visibleCount <= 0) return [];

  const result: number[] = new Array(visibleCount);
  for (let i = 0; i < visibleCount; i++) {
    result[i] = (w as any).getVisibleIndex(i) as number;
  }
  return result;
}

/**
 * Batch compute shape paths for multiple elements.
 * Uses the shared point buffer for input data.
 * Returns a Map from batch index to point arrays, or null if WASM unavailable.
 */
export function wasmBatchComputeShapePaths(
  elements: DrawingElement[]
): Map<number, { x: number; y: number }[]> | null {
  const w = getWasmExports();
  if (!w) return null;

  const buf = getElementBuffer();
  if (!buf) return null;

  // Write shape data to element buffer (reusing it for a different purpose)
  const count = Math.min(elements.length, 512);
  for (let i = 0; i < count; i++) {
    const el = elements[i];
    const shapeType = getShapeEnum(el.type);
    const base = i * BATCH_SHAPE_FIELDS;
    buf[base]     = shapeType;
    buf[base + 1] = el.width;
    buf[base + 2] = el.height;

    // Shape-specific params
    if (shapeType === 11) {         // polygon
      buf[base + 3] = (el as any).polygonSides || 6;
    } else if (shapeType === 12) {  // star
      buf[base + 3] = (el as any).starPoints || 5;
      buf[base + 4] = (el as any).shapeRatio !== undefined ? (el as any).shapeRatio : 38;
    } else if (shapeType === 13) {  // burst
      buf[base + 3] = (el as any).burstPoints || 16;
      buf[base + 4] = (el as any).shapeRatio !== undefined ? (el as any).shapeRatio : 70;
    } else if (shapeType === 14) {  // burstBlob
      buf[base + 5] = (el as any).seed || 1;
    } else {
      buf[base + 3] = 0;
      buf[base + 4] = 0;
      buf[base + 5] = 0;
    }
  }

  const elemBufPtr = getElementBufferPtr();
  const totalPoints: number = (w as any).batchComputeShapePaths(elemBufPtr, count);

  if (totalPoints <= 0) return new Map();

  const result = new Map<number, { x: number; y: number }[]>();
  for (let i = 0; i < count; i++) {
    const ptCount: number = (w as any).getBatchShapeCount(i) as number;
    if (ptCount <= 0) continue;

    const offset: number = (w as any).getBatchShapeOffset(i) as number;
    const points: { x: number; y: number }[] = new Array(ptCount);
    for (let j = 0; j < ptCount; j++) {
      points[j] = {
        x: (w as any).getBatchShapePointX(offset + j) as number,
        y: (w as any).getBatchShapePointY(offset + j) as number,
      };
    }
    result.set(i, points);
  }

  return result;
}
