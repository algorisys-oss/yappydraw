// Phase 2: Hit testing bridge
// Maps DrawingElement shape types to WASM enum values and provides
// WASM-accelerated hitTestElement with JS fallback for complex shapes.

import type { DrawingElement } from '../../types';
import { getWasmExports } from './wasm-loader';
import {
  rotatePoint,
  isPointOnBezier,
  isPointOnPolyline,
  distanceToSegment,
  isPointInPolygon,
  getOrganicBranchPolygon
} from '../../utils/geometry';
import { normalizePoints } from '../../utils/render-element';
import { hitTestPathElement } from '../../utils/hit-testing';

// Shape type enum matching assembly/hit-testing.ts
const SHAPE_BBOX = 0;
const SHAPE_DIAMOND = 1;
const SHAPE_ELLIPSE = 2;
const SHAPE_COMPLEX = 3;

// Return values from WASM
const HIT_MISS = 0;
const HIT_CONFIRMED = 1;
/** Map DrawingElement.type to WASM shape enum */
function getShapeTypeEnum(type: string): number {
  switch (type) {
    case 'diamond':
      return SHAPE_DIAMOND;
    case 'circle':
      return SHAPE_ELLIPSE;
    case 'line':
    case 'arrow':
    case 'fineliner':
    case 'marker':
    case 'inkbrush':
    case 'ink':
    case 'organicBranch':
    case 'path':
      return SHAPE_COMPLEX;
    default:
      return SHAPE_BBOX;
  }
}

/**
 * WASM-accelerated hit test for a single element.
 * Handles broad phase + narrow phase for common shapes in WASM.
 * Falls back to JS for complex shapes (bezier, polyline, organicBranch).
 *
 * Returns true/false (same as the original hitTestElement narrow+broad phase,
 * but WITHOUT the hierarchy check — caller must handle that).
 */
export function wasmHitTestElement(
  el: DrawingElement,
  x: number,
  y: number,
  threshold: number
): boolean {
  const w = getWasmExports();
  if (!w) return false;

  const shapeType = getShapeTypeEnum(el.type);

  // Un-rotate point to local space
  const cx = el.x + el.width / 2;
  const cy = el.y + el.height / 2;
  const angle = el.angle || 0;

  let px = x;
  let py = y;
  if (angle !== 0) {
    const p = rotatePoint(x, y, cx, cy, -angle);
    px = p.x;
    py = p.y;
  }

  const result: number = (w as any).hitTestSingle(
    px, py,
    el.x, el.y, el.width, el.height,
    shapeType,
    threshold
  );

  if (result === HIT_MISS) return false;
  if (result === HIT_CONFIRMED) return true;

  // HIT_NEEDS_JS: passed broad phase, run JS narrow phase
  return jsNarrowPhase(el, { x: px, y: py }, threshold);
}

/** JS narrow phase for complex shapes (line/bezier, freehand, organicBranch) */
function jsNarrowPhase(
  el: DrawingElement,
  p: { x: number; y: number },
  threshold: number
): boolean {
  // Editable vector path: shared narrow phase (identical to the JS-only path).
  // `p` is un-rotated world space; hitTestPathElement wants element-centred-local.
  if (el.type === 'path') {
    return hitTestPathElement(el, p.x - (el.x + el.width / 2), p.y - (el.y + el.height / 2), threshold);
  }

  if (el.type === 'line' || el.type === 'arrow') {
    const endX = el.x + el.width;
    const endY = el.y + el.height;

    if (el.curveType === 'bezier') {
      if (el.controlPoints && el.controlPoints.length > 0) {
        const p0 = { x: el.x, y: el.y };
        const p2 = { x: endX, y: endY };

        if (el.controlPoints.length === 2) {
          return isPointOnBezier(p, p0, el.controlPoints[0], el.controlPoints[1], p2, threshold);
        } else {
          const cp = el.controlPoints[0];
          const cp1 = { x: p0.x + (2 / 3) * (cp.x - p0.x), y: p0.y + (2 / 3) * (cp.y - p0.y) };
          const cp2 = { x: p2.x + (2 / 3) * (cp.x - p2.x), y: p2.y + (2 / 3) * (cp.y - p2.y) };
          return isPointOnBezier(p, p0, cp1, cp2, p2, threshold);
        }
      }
      const w = el.width;
      const h = el.height;
      let cp1, cp2;
      if (Math.abs(w) > Math.abs(h)) {
        cp1 = { x: el.x + w / 2, y: el.y };
        cp2 = { x: endX - w / 2, y: endY };
      } else {
        cp1 = { x: el.x, y: el.y + h / 2 };
        cp2 = { x: endX, y: endY - h / 2 };
      }
      return isPointOnBezier(p, { x: el.x, y: el.y }, cp1, cp2, { x: endX, y: endY }, threshold);
    } else if (el.curveType === 'elbow') {
      const pts = normalizePoints(el.points);
      if (pts && pts.length > 0) {
        const localP = { x: p.x - el.x, y: p.y - el.y };
        if (pts.length >= 3 && !el.startBinding && !el.endBinding) {
          if (isPointInPolygon(localP, pts)) return true;
        }
        return isPointOnPolyline(localP, pts, threshold);
      }
      return distanceToSegment(p, { x: el.x, y: el.y }, { x: endX, y: endY }) <= threshold;
    } else {
      if (el.points && el.points.length > 0) {
        const pts = normalizePoints(el.points);
        if (pts.length > 1) {
          const localP = { x: p.x - el.x, y: p.y - el.y };
          return isPointOnPolyline(localP, pts, threshold);
        }
      }
      return distanceToSegment(p, { x: el.x, y: el.y }, { x: el.x + el.width, y: el.y + el.height }) <= threshold;
    }
  } else if (el.type === 'fineliner' || el.type === 'marker' || el.type === 'inkbrush' || el.type === 'ink') {
    const pts = normalizePoints(el.points);
    if (pts.length > 0) {
      const localP = { x: p.x - el.x, y: p.y - el.y };
      return isPointOnPolyline(localP, pts, threshold + (el.strokeWidth || 0) / 2);
    }
    return false;
  } else if (el.type === 'organicBranch') {
    const pts = normalizePoints(el.points);
    const controls = el.controlPoints || [];
    if (pts.length < 2 || controls.length < 2) return false;
    const start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
    const end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
    const polygon = getOrganicBranchPolygon(start, end, controls[0], controls[1], el.strokeWidth);
    return isPointInPolygon(p, polygon);
  }

  return false;
}
