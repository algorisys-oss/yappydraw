// Phase 3: Routing bridge — marshals grid + obstacles to WASM for A* elbow routing
// Grid construction stays in JS; the A* hot loop runs in WASM.
// Falls back to JS if WASM returns 0 (no path found or unavailable).

import type { DrawingElement, Point } from '../../types';
import { getWasmExports } from './wasm-loader';
import {
  getPointBufferPtr,
  getResultBufferPtr,
  getElementBufferPtr,
  getPointBuffer,
  getElementBuffer,
} from './memory-pool';

// Position enum matching assembly/routing.ts
const POS_NONE = 0;
const POS_TOP = 1;
const POS_BOTTOM = 2;
const POS_LEFT = 3;
const POS_RIGHT = 4;

const MARGIN = 15;
const GRID_OFFSET = 20;
const MAX_GRID = 256;
const OBSTACLE_FIELDS = 6; // x, y, w, h, isStartEl, isEndEl

function posToEnum(pos?: string): number {
  if (pos === 'top') return POS_TOP;
  if (pos === 'bottom') return POS_BOTTOM;
  if (pos === 'left') return POS_LEFT;
  if (pos === 'right') return POS_RIGHT;
  return POS_NONE;
}

/**
 * WASM-accelerated smart elbow routing.
 * Builds the sparse visibility grid in JS, runs A* in WASM.
 * Returns null if WASM is unavailable or A* fails (caller should fall back to JS).
 */
export function wasmCalculateSmartElbowRoute(
  start: Point,
  end: Point,
  allElements: DrawingElement[],
  startElement?: DrawingElement,
  endElement?: DrawingElement,
  startPos?: string,
  endPos?: string,
): Point[] | null {
  const w = getWasmExports();
  if (!w) return null;

  const pointBuf = getPointBuffer();
  const elemBuf = getElementBuffer();
  if (!pointBuf || !elemBuf) return null;

  // --- Filter obstacles (same logic as JS) ---
  const minX = Math.min(start.x, end.x) - 100;
  const maxX = Math.max(start.x, end.x) + 100;
  const minY = Math.min(start.y, end.y) - 100;
  const maxY = Math.max(start.y, end.y) + 100;

  const obstacles: DrawingElement[] = [];
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el.type === 'line' || el.type === 'arrow' || el.type === 'text') continue;
    if (el.x > maxX || el.x + el.width < minX || el.y > maxY || el.y + el.height < minY) continue;
    obstacles.push(el);
  }

  // No obstacles → let JS use simple elbow
  if (obstacles.length === 0) return null;

  // --- Build sparse grid ---
  const xSet = new Set<number>([start.x, end.x]);
  const ySet = new Set<number>([start.y, end.y]);

  for (let i = 0; i < obstacles.length; i++) {
    const el = obstacles[i];
    xSet.add(el.x - MARGIN);
    xSet.add(el.x + el.width + MARGIN);
    ySet.add(el.y - MARGIN);
    ySet.add(el.y + el.height + MARGIN);
    xSet.add(el.x + el.width / 2);
    ySet.add(el.y + el.height / 2);
  }

  // Entry/exit buffer points
  if (startPos === 'top')    ySet.add(start.y - GRID_OFFSET);
  if (startPos === 'bottom') ySet.add(start.y + GRID_OFFSET);
  if (startPos === 'left')   xSet.add(start.x - GRID_OFFSET);
  if (startPos === 'right')  xSet.add(start.x + GRID_OFFSET);
  if (endPos === 'top')      ySet.add(end.y - GRID_OFFSET);
  if (endPos === 'bottom')   ySet.add(end.y + GRID_OFFSET);
  if (endPos === 'left')     xSet.add(end.x - GRID_OFFSET);
  if (endPos === 'right')    xSet.add(end.x + GRID_OFFSET);

  const sortedX = Array.from(xSet).sort((a, b) => a - b);
  const sortedY = Array.from(ySet).sort((a, b) => a - b);

  if (sortedX.length > MAX_GRID || sortedY.length > MAX_GRID) return null;

  // Find start/end grid indices
  const startGx = sortedX.findIndex(x => Math.abs(x - start.x) < 0.1);
  const startGy = sortedY.findIndex(y => Math.abs(y - start.y) < 0.1);
  const endGx = sortedX.findIndex(x => Math.abs(x - end.x) < 0.1);
  const endGy = sortedY.findIndex(y => Math.abs(y - end.y) < 0.1);

  if (startGx < 0 || startGy < 0 || endGx < 0 || endGy < 0) return null;

  // --- Marshal data to WASM buffers ---

  // Write xGrid into pointBuffer, yGrid into resultBuffer
  // pointBuffer and resultBuffer each hold 4096*2 = 8192 floats — plenty for 256 grid coords
  const xGridPtr = getPointBufferPtr();
  const yGridPtr = getResultBufferPtr();
  const mem = w.memory;
  const xGridView = new Float64Array(mem.buffer, xGridPtr, sortedX.length);
  const yGridView = new Float64Array(mem.buffer, yGridPtr, sortedY.length);

  for (let i = 0; i < sortedX.length; i++) xGridView[i] = sortedX[i];
  for (let i = 0; i < sortedY.length; i++) yGridView[i] = sortedY[i];

  // Write obstacles into elementBuffer: [x, y, w, h, isStartEl, isEndEl] per obstacle
  const obstPtr = getElementBufferPtr();
  const obstView = new Float64Array(mem.buffer, obstPtr, obstacles.length * OBSTACLE_FIELDS);

  for (let i = 0; i < obstacles.length; i++) {
    const el = obstacles[i];
    const base = i * OBSTACLE_FIELDS;
    obstView[base]     = el.x;
    obstView[base + 1] = el.y;
    obstView[base + 2] = el.width;
    obstView[base + 3] = el.height;
    obstView[base + 4] = (startElement && el.id === startElement.id) ? 1.0 : 0.0;
    obstView[base + 5] = (endElement && el.id === endElement.id) ? 1.0 : 0.0;
  }

  // --- Call WASM A* ---
  const pathLen: number = (w as any).calculateSmartElbowRoute(
    xGridPtr, yGridPtr,
    sortedX.length, sortedY.length,
    startGx, startGy,
    endGx, endGy,
    posToEnum(startPos), posToEnum(endPos),
    obstPtr, obstacles.length,
  );

  if (pathLen <= 0) return null;

  // --- Read result path ---
  const result: Point[] = new Array(pathLen);
  for (let i = 0; i < pathLen; i++) {
    result[i] = {
      x: (w as any).getRoutePointX(i) as number,
      y: (w as any).getRoutePointY(i) as number,
    };
  }

  return result;
}
