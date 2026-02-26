// Phase 4: Object snapping in AssemblyScript
// Two-pass algorithm: find best snap deltas, then collect matching guides.
// Active bounding-box snap lines (3 per axis) passed as scalars from JS bridge.
// Other elements passed as flat buffer [x, y, w, h, _, _] with stride 6.

// ─── Constants ───

const MAX_GUIDES: i32 = 64;
const STRIDE: i32 = 6;         // matches elementBuffer layout (fields 4-5 unused)
const EPSILON: f64 = 0.1;

const GUIDE_VERTICAL: i32 = 0;
const GUIDE_HORIZONTAL: i32 = 1;

// ─── Static result storage ───

const guideIndices = new Int32Array(MAX_GUIDES);
const guideCoords = new Float64Array(MAX_GUIDES);
const guideTypes = new Int32Array(MAX_GUIDES);

let resultDeltaX: f64 = 0.0;
let resultDeltaY: f64 = 0.0;

// ─── Main export ───

export function computeSnappingGuides(
  activeMinX: f64, activeCenterX: f64, activeMaxX: f64,
  activeMinY: f64, activeCenterY: f64, activeMaxY: f64,
  otherBufPtr: usize,
  otherCount: i32,
  threshold: f64,
): i32 {
  resultDeltaX = 0.0;
  resultDeltaY = 0.0;

  if (otherCount <= 0) return 0;

  const buf = changetype<Float64Array>(otherBufPtr);

  // Active snap lines
  const ax0 = activeMinX;
  const ax1 = activeCenterX;
  const ax2 = activeMaxX;
  const ay0 = activeMinY;
  const ay1 = activeCenterY;
  const ay2 = activeMaxY;

  // ─── Pass 1: find bestDeltaX, bestDeltaY ───

  let bestDX: f64 = 0.0;
  let bestDY: f64 = 0.0;
  let minDistX: f64 = threshold + 1.0;
  let minDistY: f64 = threshold + 1.0;

  for (let i: i32 = 0; i < otherCount; i++) {
    const base = i * STRIDE;
    const oX = unchecked(buf[base]);
    const oY = unchecked(buf[base + 1]);
    const oW = unchecked(buf[base + 2]);
    const oH = unchecked(buf[base + 3]);

    const oMinX = oX;
    const oMaxX = oX + oW;
    const oCenterX = (oMinX + oMaxX) * 0.5;
    const oMinY = oY;
    const oMaxY = oY + oH;
    const oCenterY = (oMinY + oMaxY) * 0.5;

    // 9 X-axis comparisons (unrolled)
    let dist: f64;

    dist = Math.abs(ax0 - oMinX);
    if (dist < minDistX) { minDistX = dist; bestDX = oMinX - ax0; }
    dist = Math.abs(ax0 - oCenterX);
    if (dist < minDistX) { minDistX = dist; bestDX = oCenterX - ax0; }
    dist = Math.abs(ax0 - oMaxX);
    if (dist < minDistX) { minDistX = dist; bestDX = oMaxX - ax0; }

    dist = Math.abs(ax1 - oMinX);
    if (dist < minDistX) { minDistX = dist; bestDX = oMinX - ax1; }
    dist = Math.abs(ax1 - oCenterX);
    if (dist < minDistX) { minDistX = dist; bestDX = oCenterX - ax1; }
    dist = Math.abs(ax1 - oMaxX);
    if (dist < minDistX) { minDistX = dist; bestDX = oMaxX - ax1; }

    dist = Math.abs(ax2 - oMinX);
    if (dist < minDistX) { minDistX = dist; bestDX = oMinX - ax2; }
    dist = Math.abs(ax2 - oCenterX);
    if (dist < minDistX) { minDistX = dist; bestDX = oCenterX - ax2; }
    dist = Math.abs(ax2 - oMaxX);
    if (dist < minDistX) { minDistX = dist; bestDX = oMaxX - ax2; }

    // 9 Y-axis comparisons (unrolled)
    dist = Math.abs(ay0 - oMinY);
    if (dist < minDistY) { minDistY = dist; bestDY = oMinY - ay0; }
    dist = Math.abs(ay0 - oCenterY);
    if (dist < minDistY) { minDistY = dist; bestDY = oCenterY - ay0; }
    dist = Math.abs(ay0 - oMaxY);
    if (dist < minDistY) { minDistY = dist; bestDY = oMaxY - ay0; }

    dist = Math.abs(ay1 - oMinY);
    if (dist < minDistY) { minDistY = dist; bestDY = oMinY - ay1; }
    dist = Math.abs(ay1 - oCenterY);
    if (dist < minDistY) { minDistY = dist; bestDY = oCenterY - ay1; }
    dist = Math.abs(ay1 - oMaxY);
    if (dist < minDistY) { minDistY = dist; bestDY = oMaxY - ay1; }

    dist = Math.abs(ay2 - oMinY);
    if (dist < minDistY) { minDistY = dist; bestDY = oMinY - ay2; }
    dist = Math.abs(ay2 - oCenterY);
    if (dist < minDistY) { minDistY = dist; bestDY = oCenterY - ay2; }
    dist = Math.abs(ay2 - oMaxY);
    if (dist < minDistY) { minDistY = dist; bestDY = oMaxY - ay2; }
  }

  const snapX = minDistX <= threshold;
  const snapY = minDistY <= threshold;
  resultDeltaX = snapX ? bestDX : 0.0;
  resultDeltaY = snapY ? bestDY : 0.0;

  if (!snapX && !snapY) return 0;

  // ─── Pass 2: collect guides matching best deltas ───

  let guideCount: i32 = 0;

  // Adjusted active lines after applying best delta
  const adjAx0 = ax0 + resultDeltaX;
  const adjAx1 = ax1 + resultDeltaX;
  const adjAx2 = ax2 + resultDeltaX;
  const adjAy0 = ay0 + resultDeltaY;
  const adjAy1 = ay1 + resultDeltaY;
  const adjAy2 = ay2 + resultDeltaY;

  for (let i: i32 = 0; i < otherCount; i++) {
    const base = i * STRIDE;
    const oX = unchecked(buf[base]);
    const oY = unchecked(buf[base + 1]);
    const oW = unchecked(buf[base + 2]);
    const oH = unchecked(buf[base + 3]);

    const oMinX = oX;
    const oMaxX = oX + oW;
    const oCenterX = (oMinX + oMaxX) * 0.5;
    const oMinY = oY;
    const oMaxY = oY + oH;
    const oCenterY = (oMinY + oMaxY) * 0.5;

    // Collect vertical guides (X-axis snaps)
    if (snapX && guideCount < MAX_GUIDES) {
      if (Math.abs(adjAx0 - oMinX) < EPSILON ||
          Math.abs(adjAx1 - oMinX) < EPSILON ||
          Math.abs(adjAx2 - oMinX) < EPSILON) {
        unchecked(guideIndices[guideCount] = i);
        unchecked(guideCoords[guideCount] = oMinX);
        unchecked(guideTypes[guideCount] = GUIDE_VERTICAL);
        guideCount++;
      }
      if (guideCount < MAX_GUIDES &&
          (Math.abs(adjAx0 - oCenterX) < EPSILON ||
           Math.abs(adjAx1 - oCenterX) < EPSILON ||
           Math.abs(adjAx2 - oCenterX) < EPSILON)) {
        unchecked(guideIndices[guideCount] = i);
        unchecked(guideCoords[guideCount] = oCenterX);
        unchecked(guideTypes[guideCount] = GUIDE_VERTICAL);
        guideCount++;
      }
      if (guideCount < MAX_GUIDES &&
          (Math.abs(adjAx0 - oMaxX) < EPSILON ||
           Math.abs(adjAx1 - oMaxX) < EPSILON ||
           Math.abs(adjAx2 - oMaxX) < EPSILON)) {
        unchecked(guideIndices[guideCount] = i);
        unchecked(guideCoords[guideCount] = oMaxX);
        unchecked(guideTypes[guideCount] = GUIDE_VERTICAL);
        guideCount++;
      }
    }

    // Collect horizontal guides (Y-axis snaps)
    if (snapY && guideCount < MAX_GUIDES) {
      if (Math.abs(adjAy0 - oMinY) < EPSILON ||
          Math.abs(adjAy1 - oMinY) < EPSILON ||
          Math.abs(adjAy2 - oMinY) < EPSILON) {
        unchecked(guideIndices[guideCount] = i);
        unchecked(guideCoords[guideCount] = oMinY);
        unchecked(guideTypes[guideCount] = GUIDE_HORIZONTAL);
        guideCount++;
      }
      if (guideCount < MAX_GUIDES &&
          (Math.abs(adjAy0 - oCenterY) < EPSILON ||
           Math.abs(adjAy1 - oCenterY) < EPSILON ||
           Math.abs(adjAy2 - oCenterY) < EPSILON)) {
        unchecked(guideIndices[guideCount] = i);
        unchecked(guideCoords[guideCount] = oCenterY);
        unchecked(guideTypes[guideCount] = GUIDE_HORIZONTAL);
        guideCount++;
      }
      if (guideCount < MAX_GUIDES &&
          (Math.abs(adjAy0 - oMaxY) < EPSILON ||
           Math.abs(adjAy1 - oMaxY) < EPSILON ||
           Math.abs(adjAy2 - oMaxY) < EPSILON)) {
        unchecked(guideIndices[guideCount] = i);
        unchecked(guideCoords[guideCount] = oMaxY);
        unchecked(guideTypes[guideCount] = GUIDE_HORIZONTAL);
        guideCount++;
      }
    }
  }

  return guideCount;
}

// ─── Result accessors ───

export function getSnappingDeltaX(): f64 {
  return resultDeltaX;
}

export function getSnappingDeltaY(): f64 {
  return resultDeltaY;
}

export function getGuideElementIndex(i: i32): i32 {
  if (i < 0 || i >= MAX_GUIDES) return -1;
  return unchecked(guideIndices[i]);
}

export function getGuideCoordinate(i: i32): f64 {
  if (i < 0 || i >= MAX_GUIDES) return 0.0;
  return unchecked(guideCoords[i]);
}

export function getGuideType(i: i32): i32 {
  if (i < 0 || i >= MAX_GUIDES) return -1;
  return unchecked(guideTypes[i]);
}
