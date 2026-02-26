// Memory pool for efficient JS <-> WASM data transfer
// Uses flat Float64Arrays backed by WASM linear memory.
// Points are interleaved: [x0, y0, x1, y1, ...]

import { getWasmExports } from './wasm-loader';

/** Maximum points in the shared buffer (covers all realistic use cases) */
const MAX_POINTS = 4096;

/** Maximum elements for batch operations (hit testing, snapping) */
const MAX_ELEMENTS = 2048;

/** Fields per element in batch buffers: [x, y, w, h, angle, typeEnum] */
const ELEMENT_FIELDS = 6;

/**
 * Pre-allocated typed array views into WASM memory.
 * These are lazily created on first use after WASM loads.
 */
let pointBuffer: Float64Array | null = null;
let resultBuffer: Float64Array | null = null;
let elementBuffer: Float64Array | null = null;

// Pointers into WASM memory (set during init)
let pointBufferPtr = 0;
let resultBufferPtr = 0;
let elementBufferPtr = 0;

/** Point type matching YappyDraw's convention */
interface Point {
  x: number;
  y: number;
}

/**
 * Initialize the memory pool by allocating buffers in WASM linear memory.
 * Call after WASM module is loaded.
 */
export function initMemoryPool(): boolean {
  const exports = getWasmExports();
  if (!exports) return false;

  try {
    const mem = exports.memory;

    // Allocate point buffer: MAX_POINTS * 2 floats (x,y) * 8 bytes
    const pointBytes = MAX_POINTS * 2 * 8;
    pointBufferPtr = exports.__new(pointBytes, 0);
    exports.__pin(pointBufferPtr);
    pointBuffer = new Float64Array(mem.buffer, pointBufferPtr, MAX_POINTS * 2);

    // Allocate result buffer (same size as point buffer)
    resultBufferPtr = exports.__new(pointBytes, 0);
    exports.__pin(resultBufferPtr);
    resultBuffer = new Float64Array(mem.buffer, resultBufferPtr, MAX_POINTS * 2);

    // Allocate element buffer: MAX_ELEMENTS * ELEMENT_FIELDS * 8 bytes
    const elemBytes = MAX_ELEMENTS * ELEMENT_FIELDS * 8;
    elementBufferPtr = exports.__new(elemBytes, 0);
    exports.__pin(elementBufferPtr);
    elementBuffer = new Float64Array(mem.buffer, elementBufferPtr, MAX_ELEMENTS * ELEMENT_FIELDS);

    return true;
  } catch (err) {
    console.warn('[WASM] Memory pool init failed:', err);
    pointBuffer = null;
    resultBuffer = null;
    elementBuffer = null;
    return false;
  }
}

/**
 * Write JS Point[] into the WASM point buffer as interleaved [x0, y0, x1, y1, ...].
 * Returns the WASM pointer and count for passing to WASM functions.
 */
export function writePoints(points: Point[]): { ptr: number; count: number } {
  if (!pointBuffer || points.length > MAX_POINTS) {
    return { ptr: 0, count: 0 };
  }

  for (let i = 0; i < points.length; i++) {
    pointBuffer[i * 2] = points[i].x;
    pointBuffer[i * 2 + 1] = points[i].y;
  }

  return { ptr: pointBufferPtr, count: points.length };
}

/**
 * Read Point[] from WASM result buffer.
 */
export function readPoints(count: number): Point[] {
  if (!resultBuffer || count <= 0) return [];

  const result: Point[] = new Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = {
      x: resultBuffer[i * 2],
      y: resultBuffer[i * 2 + 1],
    };
  }
  return result;
}

/** Get the WASM pointer for the point buffer */
export function getPointBufferPtr(): number {
  return pointBufferPtr;
}

/** Get the WASM pointer for the result buffer */
export function getResultBufferPtr(): number {
  return resultBufferPtr;
}

/** Get the WASM pointer for the element buffer */
export function getElementBufferPtr(): number {
  return elementBufferPtr;
}

/** Get the raw point buffer view (for direct writes without Point[] conversion) */
export function getPointBuffer(): Float64Array | null {
  return pointBuffer;
}

/** Get the raw element buffer view */
export function getElementBuffer(): Float64Array | null {
  return elementBuffer;
}

/** Refresh typed array views after WASM memory grows */
export function refreshViews(): void {
  const exports = getWasmExports();
  if (!exports) return;

  const mem = exports.memory;
  if (pointBufferPtr) {
    pointBuffer = new Float64Array(mem.buffer, pointBufferPtr, MAX_POINTS * 2);
  }
  if (resultBufferPtr) {
    resultBuffer = new Float64Array(mem.buffer, resultBufferPtr, MAX_POINTS * 2);
  }
  if (elementBufferPtr) {
    elementBuffer = new Float64Array(mem.buffer, elementBufferPtr, MAX_ELEMENTS * ELEMENT_FIELDS);
  }
}
