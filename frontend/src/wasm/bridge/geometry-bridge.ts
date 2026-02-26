// Phase 1: Geometry bridge — JS wrappers that marshal data to/from WASM
// Each function matches the signature of the original JS geometry.ts functions.

import type { Point } from '../../types';
import { getWasmExports, type WasmExports } from './wasm-loader';
import { writePoints, getResultBufferPtr } from './memory-pool';

function exports(): WasmExports | null {
  return getWasmExports();
}

export function isPointInPolygon(p: Point, polygon: Point[]): boolean {
  const w = exports();
  if (!w) return false;
  const { ptr, count } = writePoints(polygon);
  if (count === 0) return false;
  return (w as any).isPointInPolygon(p.x, p.y, ptr, count) !== 0;
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const w = exports();
  if (!w) return Infinity;
  return (w as any).distanceToSegment(p.x, p.y, a.x, a.y, b.x, b.y);
}

export function isPointInEllipse(
  p: Point, x: number, y: number, w: number, h: number, threshold: number = 0
): boolean {
  const wasm = exports();
  if (!wasm) return false;
  return (wasm as any).isPointInEllipse(p.x, p.y, x, y, w, h, threshold) !== 0;
}

export function isPointNearEllipseStroke(
  p: Point, x: number, y: number, w: number, h: number, threshold: number
): boolean {
  const wasm = exports();
  if (!wasm) return false;
  return (wasm as any).isPointNearEllipseStroke(p.x, p.y, x, y, w, h, threshold) !== 0;
}

export function isPointOnPolyline(p: Point, points: Point[], threshold: number): boolean {
  const w = exports();
  if (!w) return false;
  const { ptr, count } = writePoints(points);
  if (count < 2) return false;
  return (w as any).isPointOnPolyline(p.x, p.y, ptr, count, threshold) !== 0;
}

export function isPointOnBezier(
  p: Point, start: Point, cp1: Point, cp2: Point, end: Point, threshold: number
): boolean {
  const w = exports();
  if (!w) return false;
  const tmpPtr = getResultBufferPtr(); // reuse result buffer as temp
  return (w as any).isPointOnBezier(
    p.x, p.y,
    start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y,
    threshold, tmpPtr
  ) !== 0;
}

export function getBezierPoints(
  start: Point, cp1: Point, cp2: Point, end: Point, segments: number = 20
): Point[] {
  const w = exports();
  if (!w) return [];
  const outPtr = getResultBufferPtr();
  const count: number = (w as any).getBezierPoints(
    start.x, start.y, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y,
    segments, outPtr
  );
  // Read results from WASM memory
  const mem = w.memory;
  const view = new Float64Array(mem.buffer, outPtr, count * 2);
  const result: Point[] = new Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = { x: view[i * 2], y: view[i * 2 + 1] };
  }
  return result;
}

export function getOrganicBranchPolygon(
  start: Point, end: Point, cp1: Point, cp2: Point, strokeWidth: number
): Point[] {
  const w = exports();
  if (!w) return [];
  const outPtr = getResultBufferPtr();
  const count: number = (w as any).getOrganicBranchPolygon(
    start.x, start.y, end.x, end.y,
    cp1.x, cp1.y, cp2.x, cp2.y,
    strokeWidth, outPtr
  );
  const mem = w.memory;
  const view = new Float64Array(mem.buffer, outPtr, count * 2);
  const result: Point[] = new Array(count);
  for (let i = 0; i < count; i++) {
    result[i] = { x: view[i * 2], y: view[i * 2 + 1] };
  }
  return result;
}

export function rotatePoint(
  x: number, y: number, cx: number, cy: number, angle: number
): { x: number; y: number } {
  const w = exports();
  if (!w) return { x, y };
  const resultPtr: number = (w as any).rotatePoint(x, y, cx, cy, angle);
  const view = new Float64Array(w.memory.buffer, resultPtr, 2);
  return { x: view[0], y: view[1] };
}
