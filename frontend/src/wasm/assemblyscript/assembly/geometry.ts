// Phase 1: Geometry primitives in AssemblyScript
// All functions operate on f64 scalars or flat Float64Array buffers.
// Points are interleaved: [x0, y0, x1, y1, ...]

// ─── Point-in-polygon (ray casting) ───

export function isPointInPolygon(
  px: f64, py: f64,
  bufPtr: usize, count: i32
): i32 {
  const buf = changetype<Float64Array>(bufPtr);
  let inside: i32 = 0;

  for (let i: i32 = 0, j: i32 = count - 1; i < count; j = i++) {
    const xi = unchecked(buf[i * 2]);
    const yi = unchecked(buf[i * 2 + 1]);
    const xj = unchecked(buf[j * 2]);
    const yj = unchecked(buf[j * 2 + 1]);

    if (((yi > py) != (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = inside ^ 1;
    }
  }
  return inside;
}

// ─── Distance from point to line segment ───

export function distanceToSegment(
  px: f64, py: f64,
  ax: f64, ay: f64,
  bx: f64, by: f64
): f64 {
  const C = bx - ax;
  const D = by - ay;
  const lenSq = C * C + D * D;

  let xx: f64, yy: f64;

  if (lenSq == 0.0) {
    xx = ax;
    yy = ay;
  } else {
    let param = ((px - ax) * C + (py - ay) * D) / lenSq;
    if (param < 0.0) {
      xx = ax;
      yy = ay;
    } else if (param > 1.0) {
      xx = bx;
      yy = by;
    } else {
      xx = ax + param * C;
      yy = ay + param * D;
    }
  }

  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// ─── Cubic bezier evaluation ───

export function cubicBezier(p0: f64, p1: f64, p2: f64, p3: f64, t: f64): f64 {
  const k: f64 = 1.0 - t;
  return k * k * k * p0 + 3.0 * k * k * t * p1 + 3.0 * k * t * t * p2 + t * t * t * p3;
}

// ─── Cubic bezier tangent angle ───

export function cubicBezierAngle(
  p0x: f64, p0y: f64,
  p1x: f64, p1y: f64,
  p2x: f64, p2y: f64,
  p3x: f64, p3y: f64,
  t: f64
): f64 {
  const k: f64 = 1.0 - t;
  const dx = 3.0 * k * k * (p1x - p0x) + 6.0 * k * t * (p2x - p1x) + 3.0 * t * t * (p3x - p2x);
  const dy = 3.0 * k * k * (p1y - p0y) + 6.0 * k * t * (p2y - p1y) + 3.0 * t * t * (p3y - p2y);
  return Math.atan2(dy, dx);
}

// ─── Rotate point around center ───
// Returns via shared result buffer (2 f64s)

const rotateResult = new Float64Array(2);

export function rotatePoint(
  x: f64, y: f64,
  cx: f64, cy: f64,
  angle: f64
): usize {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  unchecked(rotateResult[0] = cos * (x - cx) - sin * (y - cy) + cx);
  unchecked(rotateResult[1] = sin * (x - cx) + cos * (y - cy) + cy);
  return rotateResult.dataStart;
}

// ─── Point in ellipse ───

export function isPointInEllipse(
  px: f64, py: f64,
  x: f64, y: f64,
  w: f64, h: f64,
  threshold: f64
): i32 {
  const rx = Math.abs(w / 2.0) + threshold;
  const ry = Math.abs(h / 2.0) + threshold;
  const cx = x + w / 2.0;
  const cy = y + h / 2.0;

  if (rx <= 0.0 || ry <= 0.0) return 0;

  const ndx = px - cx;
  const ndy = py - cy;
  const val = (ndx * ndx) / (rx * rx) + (ndy * ndy) / (ry * ry);
  return val <= 1.0 ? 1 : 0;
}

// ─── Point near ellipse stroke ───

export function isPointNearEllipseStroke(
  px: f64, py: f64,
  x: f64, y: f64,
  w: f64, h: f64,
  threshold: f64
): i32 {
  const cx = x + w / 2.0;
  const cy = y + h / 2.0;
  const rx = Math.abs(w / 2.0);
  const ry = Math.abs(h / 2.0);

  if (rx <= 0.0 || ry <= 0.0) return 0;

  const dx = px - cx;
  const dy = py - cy;
  const val = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

  return Math.abs(val - 1.0) < (threshold / Math.min(rx, ry)) ? 1 : 0;
}

// ─── Point on polyline ───

export function isPointOnPolyline(
  px: f64, py: f64,
  bufPtr: usize, count: i32,
  threshold: f64
): i32 {
  if (count < 2) return 0;
  const buf = changetype<Float64Array>(bufPtr);

  for (let i: i32 = 0; i < count - 1; i++) {
    const ax = unchecked(buf[i * 2]);
    const ay = unchecked(buf[i * 2 + 1]);
    const bx = unchecked(buf[(i + 1) * 2]);
    const by = unchecked(buf[(i + 1) * 2 + 1]);

    if (distanceToSegment(px, py, ax, ay, bx, by) <= threshold) {
      return 1;
    }
  }
  return 0;
}

// ─── Get bezier points (discretize) ───
// Writes results to the provided output buffer, returns point count.

export function getBezierPoints(
  startX: f64, startY: f64,
  cp1x: f64, cp1y: f64,
  cp2x: f64, cp2y: f64,
  endX: f64, endY: f64,
  segments: i32,
  outPtr: usize
): i32 {
  const out = changetype<Float64Array>(outPtr);
  const count = segments + 1;

  for (let i: i32 = 0; i <= segments; i++) {
    const t: f64 = <f64>i / <f64>segments;
    unchecked(out[i * 2] = cubicBezier(startX, cp1x, cp2x, endX, t));
    unchecked(out[i * 2 + 1] = cubicBezier(startY, cp1y, cp2y, endY, t));
  }

  return count;
}

// ─── Point on bezier ───

export function isPointOnBezier(
  px: f64, py: f64,
  startX: f64, startY: f64,
  cp1x: f64, cp1y: f64,
  cp2x: f64, cp2y: f64,
  endX: f64, endY: f64,
  threshold: f64,
  tmpBufPtr: usize
): i32 {
  const segments: i32 = 20;
  getBezierPoints(startX, startY, cp1x, cp1y, cp2x, cp2y, endX, endY, segments, tmpBufPtr);
  return isPointOnPolyline(px, py, tmpBufPtr, segments + 1, threshold);
}

// ─── Organic branch polygon ───
// Writes result polygon to output buffer, returns point count.

export function getOrganicBranchPolygon(
  startX: f64, startY: f64,
  endX: f64, endY: f64,
  cp1x: f64, cp1y: f64,
  cp2x: f64, cp2y: f64,
  strokeWidth: f64,
  outPtr: usize
): i32 {
  const out = changetype<Float64Array>(outPtr);
  const segments: i32 = 20;
  const startWidth = Math.max(strokeWidth * 8.0, 4.0);
  const endWidth = Math.max(strokeWidth * 2.0, 2.0);

  // Generate top and bottom edges
  for (let i: i32 = 0; i <= segments; i++) {
    const t: f64 = <f64>i / <f64>segments;
    const x = cubicBezier(startX, cp1x, cp2x, endX, t);
    const y = cubicBezier(startY, cp1y, cp2y, endY, t);

    const k: f64 = 1.0 - t;
    const dx = 3.0 * k * k * (cp1x - startX) + 6.0 * k * t * (cp2x - cp1x) + 3.0 * t * t * (endX - cp2x);
    const dy = 3.0 * k * k * (cp1y - startY) + 6.0 * k * t * (cp2y - cp1y) + 3.0 * t * t * (endY - cp2y);
    const angle = Math.atan2(dy, dx);

    const currentWidth = startWidth + (endWidth - startWidth) * t;
    const halfWidth = currentWidth / 2.0;
    const offsetX = Math.cos(angle + Math.PI / 2.0) * halfWidth;
    const offsetY = Math.sin(angle + Math.PI / 2.0) * halfWidth;

    // Top edge: indices 0..segments
    unchecked(out[i * 2] = x + offsetX);
    unchecked(out[i * 2 + 1] = y + offsetY);

    // Bottom edge (reversed): indices segments+1..2*segments+1
    const bottomIdx = (2 * segments + 1) - i;
    unchecked(out[bottomIdx * 2] = x - offsetX);
    unchecked(out[bottomIdx * 2 + 1] = y - offsetY);
  }

  return (segments + 1) * 2; // total points in polygon
}
