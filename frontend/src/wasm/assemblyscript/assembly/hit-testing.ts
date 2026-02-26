// Phase 2: Hit testing in AssemblyScript
// Provides per-element hit test (broad + narrow phase) for common shapes.
// Complex shapes (bezier, polyline, organicBranch) return NEEDS_JS_NARROW.

// Shape type enums for narrow phase dispatch
const SHAPE_BBOX: i32 = 0;       // Bounding box only (rectangle, text, image, 150+ shapes)
const SHAPE_DIAMOND: i32 = 1;    // Diamond equation: |dx|/(w/2) + |dy|/(h/2) <= 1
const SHAPE_ELLIPSE: i32 = 2;    // Circle/ellipse equation
const SHAPE_COMPLEX: i32 = 3;    // Needs JS narrow phase (line, freehand, organicBranch)

// Return values
const HIT_MISS: i32 = 0;
const HIT_CONFIRMED: i32 = 1;
const HIT_NEEDS_JS: i32 = 2;     // Passed broad phase, needs JS narrow phase

/**
 * Test a single element against a point.
 * The point should already be un-rotated to local space by the caller.
 *
 * Returns: 0 = miss, 1 = hit, 2 = needs JS narrow phase
 */
export function hitTestSingle(
  // Un-rotated point in local space
  px: f64, py: f64,
  // Element bounds
  elX: f64, elY: f64,
  elW: f64, elH: f64,
  // Shape type enum
  shapeType: i32,
  // Hit threshold
  threshold: f64
): i32 {
  // Broad phase: AABB check
  let x1 = Math.min(elX, elX + elW);
  let x2 = Math.max(elX, elX + elW);
  let y1 = Math.min(elY, elY + elH);
  let y2 = Math.max(elY, elY + elH);

  if (px < x1 - threshold || px > x2 + threshold ||
      py < y1 - threshold || py > y2 + threshold) {
    return HIT_MISS;
  }

  // Narrow phase by shape type
  if (shapeType == SHAPE_DIAMOND) {
    const cx = elX + elW / 2.0;
    const cy = elY + elH / 2.0;
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);
    const w2 = Math.abs(elW) / 2.0;
    const h2 = Math.abs(elH) / 2.0;
    if (w2 == 0.0 || h2 == 0.0) return HIT_MISS;
    return (dx / w2 + dy / h2) <= 1.0 ? HIT_CONFIRMED : HIT_MISS;
  }

  if (shapeType == SHAPE_ELLIPSE) {
    const rx = Math.abs(elW / 2.0) + threshold;
    const ry = Math.abs(elH / 2.0) + threshold;
    const cx = elX + elW / 2.0;
    const cy = elY + elH / 2.0;
    if (rx <= 0.0 || ry <= 0.0) return HIT_MISS;
    const ndx = px - cx;
    const ndy = py - cy;
    const val = (ndx * ndx) / (rx * rx) + (ndy * ndy) / (ry * ry);
    return val <= 1.0 ? HIT_CONFIRMED : HIT_MISS;
  }

  if (shapeType == SHAPE_COMPLEX) {
    return HIT_NEEDS_JS; // Passed broad phase, delegate to JS
  }

  // SHAPE_BBOX: passed AABB → hit
  return HIT_CONFIRMED;
}

// ─── Batch broad phase ───
// Tests one point against multiple element AABBs stored in a flat buffer.
// Element buffer layout: [x, y, w, h, angle, shapeType] per element (6 f64 each)

// Scratch buffer for candidate indices
const MAX_CANDIDATES: i32 = 2048;
const candidates = new Int32Array(MAX_CANDIDATES);

/**
 * Batch broad-phase test: find all element indices that pass AABB check.
 * Writes candidate indices to internal buffer, returns count.
 * Call getCandidateAt() to read results.
 *
 * elemBufPtr: pointer to flat f64 buffer [x,y,w,h,angle,shapeType] * elemCount
 * Returns: number of candidates
 */
export function batchBroadPhase(
  px: f64, py: f64,
  threshold: f64,
  elemBufPtr: usize,
  elemCount: i32
): i32 {
  const buf = changetype<Float64Array>(elemBufPtr);
  let candidateCount: i32 = 0;

  for (let i: i32 = 0; i < elemCount; i++) {
    const base = i * 6;
    const elX = unchecked(buf[base]);
    const elY = unchecked(buf[base + 1]);
    const elW = unchecked(buf[base + 2]);
    const elH = unchecked(buf[base + 3]);
    const angle = unchecked(buf[base + 4]);

    // Un-rotate point to element's local space
    let lpx = px;
    let lpy = py;
    if (angle != 0.0) {
      const cx = elX + elW / 2.0;
      const cy = elY + elH / 2.0;
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const dx = px - cx;
      const dy = py - cy;
      lpx = cos * dx - sin * dy + cx;
      lpy = sin * dx + cos * dy + cy;
    }

    // AABB check
    const x1 = Math.min(elX, elX + elW);
    const x2 = Math.max(elX, elX + elW);
    const y1 = Math.min(elY, elY + elH);
    const y2 = Math.max(elY, elY + elH);

    if (lpx >= x1 - threshold && lpx <= x2 + threshold &&
        lpy >= y1 - threshold && lpy <= y2 + threshold) {
      if (candidateCount < MAX_CANDIDATES) {
        unchecked(candidates[candidateCount] = i);
        candidateCount++;
      }
    }
  }

  return candidateCount;
}

/** Get candidate index from batch results */
export function getCandidateAt(index: i32): i32 {
  if (index < 0 || index >= MAX_CANDIDATES) return -1;
  return unchecked(candidates[index]);
}
