// Phase 7: Batch rendering optimizations in AssemblyScript
// 1. Batch viewport culling — test all elements against viewport in one call
// 2. Batch shape path pre-computation — compute multiple shape paths sequentially

// ─── Constants ───

const MAX_ELEMENTS: i32 = 2048;
const ELEMENT_FIELDS: i32 = 6;  // [x, y, w, h, angle, typeEnum] per element

const MAX_BATCH: i32 = 512;
const MAX_TOTAL_POINTS: i32 = 32768;
const BATCH_SHAPE_FIELDS: i32 = 6;  // [shapeType, w, h, param1, param2, param3]

// ─── Viewport culling output ───

const visibleIndices = new Int32Array(MAX_ELEMENTS);
let visibleCount: i32 = 0;

// ─── Batch shape output ───

const batchPoints = new Float64Array(MAX_TOTAL_POINTS * 2);
const batchOffsets = new Int32Array(MAX_BATCH);
const batchCounts = new Int32Array(MAX_BATCH);
let batchTotalPoints: i32 = 0;

// ─── Shape enums (matching assembly/shape-paths.ts) ───

const SHAPE_TRIANGLE: i32       = 1;
const SHAPE_DIAMOND: i32        = 2;
const SHAPE_RIGHT_TRIANGLE: i32 = 3;
const SHAPE_PARALLELOGRAM: i32  = 4;
const SHAPE_TRAPEZOID: i32      = 5;
const SHAPE_STICKY_NOTE: i32    = 6;
const SHAPE_HEXAGON: i32        = 7;
const SHAPE_PENTAGON: i32       = 8;
const SHAPE_SEPTAGON: i32       = 9;
const SHAPE_OCTAGON: i32        = 10;
const SHAPE_POLYGON: i32        = 11;
const SHAPE_STAR: i32           = 12;
const SHAPE_BURST: i32          = 13;
const SHAPE_BURST_BLOB: i32     = 14;
const SHAPE_ARROW_LEFT: i32     = 15;
const SHAPE_ARROW_RIGHT: i32    = 16;
const SHAPE_ARROW_UP: i32       = 17;
const SHAPE_ARROW_DOWN: i32     = 18;
const SHAPE_UML_SIGNAL_SEND: i32    = 19;
const SHAPE_UML_SIGNAL_RECEIVE: i32 = 20;
const SHAPE_CHECKMARK: i32      = 21;
const SHAPE_BRACKET_LEFT: i32   = 22;
const SHAPE_BRACKET_RIGHT: i32  = 23;

// ─── Inline helpers ───

@inline
function writePoint(offset: i32, px: f64, py: f64): void {
  unchecked(batchPoints[offset * 2] = px);
  unchecked(batchPoints[offset * 2 + 1] = py);
}

// Seeded PRNG matching JS burstBlob implementation
@inline
function randomSeeded(s: i32): f64 {
  let t: i32 = s + 0x6D2B79F5;
  t = <i32>(<u32>t ^ (<u32>t >>> 15)) * (t | 1);
  t ^= t + <i32>(<u32>t ^ (<u32>t >>> 7)) * (t | 61);
  return <f64>((<u32>t ^ (<u32>t >>> 14)) >>> 0) / 4294967296.0;
}

// ═══════════════════════════════════════════════════════════════
// Part 1: Batch Viewport Culling
// ═══════════════════════════════════════════════════════════════

/**
 * Batch viewport cull: test all elements against viewport bounds.
 * Element buffer layout: [x, y, w, h, angle, typeEnum] per element (6 f64 each).
 * Returns count of visible element indices (read via getVisibleIndex).
 *
 * Replicates the logic from canvas-renderer.ts lines 578-588:
 * - Sub-pixel skip: screenWidth < 1 && screenHeight < 1
 * - AABB overlap with margin
 */
export function batchViewportCull(
  elemBufPtr: usize, count: i32,
  vpMinX: f64, vpMaxX: f64,
  vpMinY: f64, vpMaxY: f64,
  vpBufX: f64, vpBufY: f64,
  scale: f64
): i32 {
  if (count <= 0) return 0;
  const buf = changetype<Float64Array>(elemBufPtr);
  visibleCount = 0;

  const limit = count < MAX_ELEMENTS ? count : MAX_ELEMENTS;

  for (let i: i32 = 0; i < limit; i++) {
    const base = i * ELEMENT_FIELDS;
    const elX = unchecked(buf[base]);
    const elY = unchecked(buf[base + 1]);
    const elW = unchecked(buf[base + 2]);
    const elH = unchecked(buf[base + 3]);

    // Sub-pixel skip
    const screenW = Math.abs(elW) * scale;
    const screenH = Math.abs(elH) * scale;
    if (screenW < 1.0 && screenH < 1.0) continue;

    // AABB viewport check with margin
    const absW = Math.abs(elW);
    const absH = Math.abs(elH);
    const margin = absW > absH ? absW * 0.5 : absH * 0.5;

    if (elX + elW + margin < vpMinX - vpBufX) continue;
    if (elX - margin > vpMaxX + vpBufX) continue;
    if (elY + elH + margin < vpMinY - vpBufY) continue;
    if (elY - margin > vpMaxY + vpBufY) continue;

    // Element passes — add to visible list
    unchecked(visibleIndices[visibleCount] = i);
    visibleCount++;
  }

  return visibleCount;
}

/** Get visible element index from batch cull results */
export function getVisibleIndex(i: i32): i32 {
  if (i < 0 || i >= visibleCount) return -1;
  return unchecked(visibleIndices[i]);
}

// ═══════════════════════════════════════════════════════════════
// Part 2: Batch Shape Path Pre-computation
// ═══════════════════════════════════════════════════════════════

/** Compute a regular polygon and write points to batchPoints at given offset */
function computeRegularPolygon(offset: i32, sides: i32, w: f64, h: f64): i32 {
  const cx = w / 2.0;
  const cy = h / 2.0;
  const rx = w / 2.0;
  const ry = h / 2.0;
  const startAngle = -Math.PI / 2.0;

  for (let i: i32 = 0; i < sides; i++) {
    const angle = startAngle + (2.0 * Math.PI * <f64>i) / <f64>sides;
    writePoint(offset + i, cx + rx * Math.cos(angle), cy + ry * Math.sin(angle));
  }
  return sides;
}

/** Compute a single shape's points at batchPoints[offset]. Returns point count (0 = unsupported). */
function computeShapeAt(offset: i32, shapeType: i32, w: f64, h: f64, param1: f64, param2: f64, param3: f64): i32 {
  if (shapeType == SHAPE_TRIANGLE) {
    writePoint(offset, w / 2.0, 0.0);
    writePoint(offset + 1, w, h);
    writePoint(offset + 2, 0.0, h);
    return 3;
  }

  if (shapeType == SHAPE_DIAMOND) {
    writePoint(offset, w / 2.0, 0.0);
    writePoint(offset + 1, w, h / 2.0);
    writePoint(offset + 2, w / 2.0, h);
    writePoint(offset + 3, 0.0, h / 2.0);
    return 4;
  }

  if (shapeType == SHAPE_RIGHT_TRIANGLE) {
    writePoint(offset, 0.0, 0.0);
    writePoint(offset + 1, w, h);
    writePoint(offset + 2, 0.0, h);
    return 3;
  }

  if (shapeType == SHAPE_PARALLELOGRAM) {
    const skew = w * 0.2;
    writePoint(offset, skew, 0.0);
    writePoint(offset + 1, w, 0.0);
    writePoint(offset + 2, w - skew, h);
    writePoint(offset + 3, 0.0, h);
    return 4;
  }

  if (shapeType == SHAPE_TRAPEZOID) {
    const inset = w * 0.2;
    writePoint(offset, inset, 0.0);
    writePoint(offset + 1, w - inset, 0.0);
    writePoint(offset + 2, w, h);
    writePoint(offset + 3, 0.0, h);
    return 4;
  }

  if (shapeType == SHAPE_STICKY_NOTE) {
    const fold = Math.min(w, h) * 0.2;
    writePoint(offset, 0.0, 0.0);
    writePoint(offset + 1, w - fold, 0.0);
    writePoint(offset + 2, w, fold);
    writePoint(offset + 3, w, h);
    writePoint(offset + 4, 0.0, h);
    return 5;
  }

  if (shapeType == SHAPE_HEXAGON) return computeRegularPolygon(offset, 6, w, h);
  if (shapeType == SHAPE_PENTAGON) return computeRegularPolygon(offset, 5, w, h);
  if (shapeType == SHAPE_SEPTAGON) return computeRegularPolygon(offset, 7, w, h);
  if (shapeType == SHAPE_OCTAGON) return computeRegularPolygon(offset, 8, w, h);

  if (shapeType == SHAPE_POLYGON) {
    const sides: i32 = param1 > 2.0 ? <i32>param1 : 6;
    return computeRegularPolygon(offset, sides, w, h);
  }

  if (shapeType == SHAPE_STAR) {
    const points: i32 = param1 > 2.0 ? <i32>param1 : 5;
    const ratioPercent: f64 = param2 > 0.0 ? param2 : 38.0;
    const cx = w / 2.0;
    const cy = h / 2.0;
    const outerRx = w / 2.0;
    const outerRy = h / 2.0;
    const innerRx = outerRx * ratioPercent / 100.0;
    const innerRy = outerRy * ratioPercent / 100.0;
    const startAngle = -Math.PI / 2.0;
    const total = points * 2;
    for (let i: i32 = 0; i < total; i++) {
      const angle = startAngle + (2.0 * Math.PI * <f64>i) / <f64>total;
      if (i % 2 == 0) {
        writePoint(offset + i, cx + outerRx * Math.cos(angle), cy + outerRy * Math.sin(angle));
      } else {
        writePoint(offset + i, cx + innerRx * Math.cos(angle), cy + innerRy * Math.sin(angle));
      }
    }
    return total;
  }

  if (shapeType == SHAPE_BURST) {
    const points: i32 = param1 > 2.0 ? <i32>param1 : 16;
    const ratioPercent: f64 = param2 > 0.0 ? param2 : 70.0;
    const cx = w / 2.0;
    const cy = h / 2.0;
    const outerRx = w / 2.0;
    const outerRy = h / 2.0;
    const innerRx = outerRx * ratioPercent / 100.0;
    const innerRy = outerRy * ratioPercent / 100.0;
    const startAngle = -Math.PI / 2.0;
    const total = points * 2;
    for (let i: i32 = 0; i < total; i++) {
      const angle = startAngle + (2.0 * Math.PI * <f64>i) / <f64>total;
      if (i % 2 == 0) {
        writePoint(offset + i, cx + outerRx * Math.cos(angle), cy + outerRy * Math.sin(angle));
      } else {
        writePoint(offset + i, cx + innerRx * Math.cos(angle), cy + innerRy * Math.sin(angle));
      }
    }
    return total;
  }

  if (shapeType == SHAPE_BURST_BLOB) {
    const numPoints: i32 = 12;
    const cx = w / 2.0;
    const cy = h / 2.0;
    const baseRx = w / 2.0;
    const baseRy = h / 2.0;
    const seed: i32 = <i32>param3;
    for (let i: i32 = 0; i < numPoints; i++) {
      const angle = (2.0 * Math.PI * <f64>i) / <f64>numPoints;
      const jitter = 0.7 + randomSeeded(seed + i) * 0.6;
      writePoint(offset + i, cx + baseRx * jitter * Math.cos(angle), cy + baseRy * jitter * Math.sin(angle));
    }
    return numPoints;
  }

  if (shapeType == SHAPE_ARROW_LEFT) {
    const headW = w * 0.4;
    const bodyH = h * 0.3;
    writePoint(offset, 0.0, h / 2.0);
    writePoint(offset + 1, headW, 0.0);
    writePoint(offset + 2, headW, bodyH);
    writePoint(offset + 3, w, bodyH);
    writePoint(offset + 4, w, h - bodyH);
    writePoint(offset + 5, headW, h - bodyH);
    writePoint(offset + 6, headW, h);
    return 7;
  }

  if (shapeType == SHAPE_ARROW_RIGHT) {
    const headW = w * 0.4;
    const bodyH = h * 0.3;
    writePoint(offset, w, h / 2.0);
    writePoint(offset + 1, w - headW, 0.0);
    writePoint(offset + 2, w - headW, bodyH);
    writePoint(offset + 3, 0.0, bodyH);
    writePoint(offset + 4, 0.0, h - bodyH);
    writePoint(offset + 5, w - headW, h - bodyH);
    writePoint(offset + 6, w - headW, h);
    return 7;
  }

  if (shapeType == SHAPE_ARROW_UP) {
    const headH = h * 0.4;
    const bodyW = w * 0.3;
    writePoint(offset, w / 2.0, 0.0);
    writePoint(offset + 1, w, headH);
    writePoint(offset + 2, w - bodyW, headH);
    writePoint(offset + 3, w - bodyW, h);
    writePoint(offset + 4, bodyW, h);
    writePoint(offset + 5, bodyW, headH);
    writePoint(offset + 6, 0.0, headH);
    return 7;
  }

  if (shapeType == SHAPE_ARROW_DOWN) {
    const headH = h * 0.4;
    const bodyW = w * 0.3;
    writePoint(offset, w / 2.0, h);
    writePoint(offset + 1, 0.0, h - headH);
    writePoint(offset + 2, bodyW, h - headH);
    writePoint(offset + 3, bodyW, 0.0);
    writePoint(offset + 4, w - bodyW, 0.0);
    writePoint(offset + 5, w - bodyW, h - headH);
    writePoint(offset + 6, w, h - headH);
    return 7;
  }

  if (shapeType == SHAPE_UML_SIGNAL_SEND) {
    const arrowW = w * 0.15;
    writePoint(offset, 0.0, 0.0);
    writePoint(offset + 1, w - arrowW, 0.0);
    writePoint(offset + 2, w, h / 2.0);
    writePoint(offset + 3, w - arrowW, h);
    writePoint(offset + 4, 0.0, h);
    return 5;
  }

  if (shapeType == SHAPE_UML_SIGNAL_RECEIVE) {
    const arrowW = w * 0.15;
    writePoint(offset, arrowW, 0.0);
    writePoint(offset + 1, w, 0.0);
    writePoint(offset + 2, w, h);
    writePoint(offset + 3, arrowW, h);
    writePoint(offset + 4, 0.0, h / 2.0);
    return 5;
  }

  if (shapeType == SHAPE_CHECKMARK) {
    writePoint(offset, 0.0, h * 0.6);
    writePoint(offset + 1, w * 0.35, h);
    writePoint(offset + 2, w, 0.0);
    return 3;
  }

  if (shapeType == SHAPE_BRACKET_LEFT) {
    const inset = w * 0.3;
    writePoint(offset, inset, 0.0);
    writePoint(offset + 1, 0.0, 0.0);
    writePoint(offset + 2, 0.0, h);
    writePoint(offset + 3, inset, h);
    return 4;
  }

  if (shapeType == SHAPE_BRACKET_RIGHT) {
    const inset = w * 0.3;
    writePoint(offset, w - inset, 0.0);
    writePoint(offset + 1, w, 0.0);
    writePoint(offset + 2, w, h);
    writePoint(offset + 3, w - inset, h);
    return 4;
  }

  // Unsupported shape
  return 0;
}

/**
 * Batch compute shape paths for multiple elements.
 * Input buffer layout: [shapeType, w, h, param1, param2, param3] per element (6 f64 each).
 * Results stored in batchPoints[], offsets in batchOffsets[], counts in batchCounts[].
 * Returns total number of points written.
 */
export function batchComputeShapePaths(
  shapeDataPtr: usize, count: i32
): i32 {
  if (count <= 0) return 0;
  const buf = changetype<Float64Array>(shapeDataPtr);
  const limit = count < MAX_BATCH ? count : MAX_BATCH;
  let totalPts: i32 = 0;

  for (let i: i32 = 0; i < limit; i++) {
    const base = i * BATCH_SHAPE_FIELDS;
    const shapeType: i32 = <i32>unchecked(buf[base]);
    const w = unchecked(buf[base + 1]);
    const h = unchecked(buf[base + 2]);
    const p1 = unchecked(buf[base + 3]);
    const p2 = unchecked(buf[base + 4]);
    const p3 = unchecked(buf[base + 5]);

    unchecked(batchOffsets[i] = totalPts);

    if (totalPts + 128 > MAX_TOTAL_POINTS) {
      // Not enough space — mark remaining as zero-count
      unchecked(batchCounts[i] = 0);
      continue;
    }

    const pts = computeShapeAt(totalPts, shapeType, w, h, p1, p2, p3);
    unchecked(batchCounts[i] = pts);
    totalPts += pts;
  }

  batchTotalPoints = totalPts;
  return totalPts;
}

/** Get X coordinate of batch shape point at flat index */
export function getBatchShapePointX(i: i32): f64 {
  if (i < 0 || i >= batchTotalPoints) return 0.0;
  return unchecked(batchPoints[i * 2]);
}

/** Get Y coordinate of batch shape point at flat index */
export function getBatchShapePointY(i: i32): f64 {
  if (i < 0 || i >= batchTotalPoints) return 0.0;
  return unchecked(batchPoints[i * 2 + 1]);
}

/** Get start offset for element at batch index */
export function getBatchShapeOffset(elemIdx: i32): i32 {
  if (elemIdx < 0 || elemIdx >= MAX_BATCH) return 0;
  return unchecked(batchOffsets[elemIdx]);
}

/** Get point count for element at batch index */
export function getBatchShapeCount(elemIdx: i32): i32 {
  if (elemIdx < 0 || elemIdx >= MAX_BATCH) return 0;
  return unchecked(batchCounts[elemIdx]);
}
