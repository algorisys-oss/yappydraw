// Phase 5: Shape path generation in AssemblyScript
// Computes Point[] for polygon-based shapes (trig loops, fixed-point).
// Returns 0 for unsupported shapes so bridge falls back to JS.

// ─── Shape type enums ───

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

// ─── Output buffer ───

const MAX_POINTS: i32 = 128;
const pathOut = new Float64Array(MAX_POINTS * 2);

// ─── Inline helpers ───

@inline
function writePoint(index: i32, px: f64, py: f64): void {
  unchecked(pathOut[index * 2] = px);
  unchecked(pathOut[index * 2 + 1] = py);
}

// Seeded PRNG matching JS burstBlob implementation
@inline
function randomSeeded(s: i32): f64 {
  let t: i32 = s + 0x6D2B79F5;
  t = <i32>(<u32>t ^ (<u32>t >>> 15)) * (t | 1);
  t ^= t + <i32>(<u32>t ^ (<u32>t >>> 7)) * (t | 61);
  return <f64>((<u32>t ^ (<u32>t >>> 14)) >>> 0) / 4294967296.0;
}

// ─── Main export ───

/**
 * Compute shape polygon points.
 * @param shapeType - Shape enum (1-23)
 * @param width - Element width
 * @param height - Element height
 * @param param1 - polygonSides / starPoints / burstPoints (default depends on shape)
 * @param param2 - shapeRatio (0-100 scale, default depends on shape)
 * @param param3 - seed (for burstBlob)
 * @returns Point count (0 = unsupported, bridge falls back to JS)
 */
export function computeShapePath(
  shapeType: i32,
  width: f64, height: f64,
  param1: f64,
  param2: f64,
  param3: f64,
): i32 {
  const w = width;
  const h = height;
  const mw = w / 2.0;
  const mh = h / 2.0;
  const x = -mw;
  const y = -mh;

  if (shapeType == SHAPE_TRIANGLE) {
    writePoint(0, 0.0, -mh);
    writePoint(1, -mw, mh);
    writePoint(2, mw, mh);
    return 3;
  }

  if (shapeType == SHAPE_DIAMOND) {
    writePoint(0, 0.0, -mh);
    writePoint(1, mw, 0.0);
    writePoint(2, 0.0, mh);
    writePoint(3, -mw, 0.0);
    return 4;
  }

  if (shapeType == SHAPE_RIGHT_TRIANGLE) {
    writePoint(0, x, y);
    writePoint(1, x, y + h);
    writePoint(2, x + w, y + h);
    return 3;
  }

  if (shapeType == SHAPE_PARALLELOGRAM) {
    const offset = w * 0.2;
    writePoint(0, x + offset, y);
    writePoint(1, x + w, y);
    writePoint(2, x + w - offset, y + h);
    writePoint(3, x, y + h);
    return 4;
  }

  if (shapeType == SHAPE_TRAPEZOID) {
    const offset = w * 0.2;
    writePoint(0, x + offset, y);
    writePoint(1, x + w - offset, y);
    writePoint(2, x + w, y + h);
    writePoint(3, x, y + h);
    return 4;
  }

  if (shapeType == SHAPE_STICKY_NOTE) {
    const fold = Math.min(w, h) * 0.15;
    writePoint(0, x, y);
    writePoint(1, x + w, y);
    writePoint(2, x + w, y + h - fold);
    writePoint(3, x + w - fold, y + h);
    writePoint(4, x, y + h);
    return 5;
  }

  // ─── Regular N-gon shapes (trig loops) ───

  if (shapeType == SHAPE_HEXAGON) {
    for (let i: i32 = 0; i < 6; i++) {
      const angle = (Math.PI / 3.0) * <f64>i - Math.PI / 2.0;
      writePoint(i, mw * Math.cos(angle), mh * Math.sin(angle));
    }
    return 6;
  }

  if (shapeType == SHAPE_PENTAGON) {
    for (let i: i32 = 0; i < 5; i++) {
      const angle = (Math.PI * 2.0 / 5.0) * <f64>i - Math.PI / 2.0;
      writePoint(i, mw * Math.cos(angle), mh * Math.sin(angle));
    }
    return 5;
  }

  if (shapeType == SHAPE_SEPTAGON) {
    for (let i: i32 = 0; i < 7; i++) {
      const angle = (Math.PI * 2.0 / 7.0) * <f64>i - Math.PI / 2.0;
      writePoint(i, mw * Math.cos(angle), mh * Math.sin(angle));
    }
    return 7;
  }

  if (shapeType == SHAPE_OCTAGON) {
    for (let i: i32 = 0; i < 8; i++) {
      const angle = (Math.PI / 4.0) * <f64>i - Math.PI / 2.0;
      writePoint(i, mw * Math.cos(angle), mh * Math.sin(angle));
    }
    return 8;
  }

  if (shapeType == SHAPE_POLYGON) {
    const sides = <i32>param1;
    if (sides < 3 || sides > MAX_POINTS) return 0;
    for (let i: i32 = 0; i < sides; i++) {
      const angle = (2.0 * Math.PI / <f64>sides) * <f64>i - Math.PI / 2.0;
      writePoint(i, mw * Math.cos(angle), mh * Math.sin(angle));
    }
    return sides;
  }

  // ─── Star / burst shapes (alternating radii) ───

  if (shapeType == SHAPE_STAR) {
    const outerRadius = Math.min(w, h) / 2.0;
    const ratio = param2 / 100.0;  // shapeRatio (default 38 passed from bridge)
    const innerRadius = outerRadius * ratio;
    const numPoints = <i32>param1;  // starPoints (default 5)
    const total = numPoints * 2;
    if (total <= 0 || total > MAX_POINTS) return 0;
    for (let i: i32 = 0; i < total; i++) {
      const angle = (Math.PI / <f64>numPoints) * <f64>i - Math.PI / 2.0;
      const radius: f64 = i % 2 == 0 ? outerRadius : innerRadius;
      writePoint(i, radius * Math.cos(angle), radius * Math.sin(angle));
    }
    return total;
  }

  if (shapeType == SHAPE_BURST) {
    const outerRadius = Math.min(Math.abs(w), Math.abs(h)) / 2.0;
    const ratio = param2 / 100.0;  // shapeRatio (default 70)
    const innerRadius = outerRadius * ratio;
    const numPoints = <i32>param1;  // burstPoints (default 16)
    const total = numPoints * 2;
    if (total <= 0 || total > MAX_POINTS) return 0;
    for (let i: i32 = 0; i < total; i++) {
      const angle = (Math.PI / <f64>numPoints) * <f64>i - Math.PI / 2.0;
      const radius: f64 = i % 2 == 0 ? outerRadius : innerRadius;
      writePoint(i, radius * Math.cos(angle), radius * Math.sin(angle));
    }
    return total;
  }

  if (shapeType == SHAPE_BURST_BLOB) {
    const rx = w / 2.0;
    const ry = h / 2.0;
    const outerR = Math.min(rx, ry);
    const innerR = outerR * 0.6;
    const spikes: i32 = 12;
    const seed = <i32>param3;
    const total = spikes * 2;
    if (total > MAX_POINTS) return 0;
    for (let i: i32 = 0; i < total; i++) {
      const r: f64 = (i % 2 == 0) ? outerR : innerR;
      const rVar = r + (randomSeeded(seed + i) - 0.5) * (outerR * 0.1);
      const angle = (Math.PI * <f64>i) / <f64>spikes;
      writePoint(i, Math.cos(angle) * (w / h) * rVar, Math.sin(angle) * rVar);
    }
    return total;
  }

  // ─── Arrow shapes (7 fixed points each) ───

  if (shapeType == SHAPE_ARROW_LEFT) {
    const tH = h * 0.4;
    const tY = y + (h - tH) / 2.0;
    const hW = w * 0.4;
    writePoint(0, x + hW, y);
    writePoint(1, x + hW, tY);
    writePoint(2, x + w, tY);
    writePoint(3, x + w, tY + tH);
    writePoint(4, x + hW, tY + tH);
    writePoint(5, x + hW, y + h);
    writePoint(6, x, y + h / 2.0);
    return 7;
  }

  if (shapeType == SHAPE_ARROW_RIGHT) {
    const tH = h * 0.4;
    const tY = y + (h - tH) / 2.0;
    const hW = w * 0.4;
    writePoint(0, x + w - hW, y);
    writePoint(1, x + w, y + h / 2.0);
    writePoint(2, x + w - hW, y + h);
    writePoint(3, x + w - hW, tY + tH);
    writePoint(4, x, tY + tH);
    writePoint(5, x, tY);
    writePoint(6, x + w - hW, tY);
    return 7;
  }

  if (shapeType == SHAPE_ARROW_UP) {
    const tW = w * 0.4;
    const tX = x + (w - tW) / 2.0;
    const hH = h * 0.4;
    writePoint(0, x + w / 2.0, y);
    writePoint(1, x + w, y + hH);
    writePoint(2, tX + tW, y + hH);
    writePoint(3, tX + tW, y + h);
    writePoint(4, tX, y + h);
    writePoint(5, tX, y + hH);
    writePoint(6, x, y + hH);
    return 7;
  }

  if (shapeType == SHAPE_ARROW_DOWN) {
    const tW = w * 0.4;
    const tX = x + (w - tW) / 2.0;
    const hH = h * 0.4;
    writePoint(0, tX, y);
    writePoint(1, tX + tW, y);
    writePoint(2, tX + tW, y + h - hH);
    writePoint(3, x + w, y + h - hH);
    writePoint(4, x + w / 2.0, y + h);
    writePoint(5, x, y + h - hH);
    writePoint(6, tX, y + h - hH);
    return 7;
  }

  // ─── UML signal shapes ───

  if (shapeType == SHAPE_UML_SIGNAL_SEND) {
    const arrowW = w * 0.2;
    writePoint(0, -mw, -mh);
    writePoint(1, mw - arrowW, -mh);
    writePoint(2, mw, 0.0);
    writePoint(3, mw - arrowW, mh);
    writePoint(4, -mw, mh);
    return 5;
  }

  if (shapeType == SHAPE_UML_SIGNAL_RECEIVE) {
    const notchW = w * 0.2;
    writePoint(0, -mw + notchW, -mh);
    writePoint(1, mw, -mh);
    writePoint(2, mw, mh);
    writePoint(3, -mw + notchW, mh);
    writePoint(4, -mw, 0.0);
    return 5;
  }

  // ─── Misc open/unclosed shapes ───

  if (shapeType == SHAPE_CHECKMARK) {
    writePoint(0, x, y + h * 0.5);
    writePoint(1, x + w * 0.4, mh);
    writePoint(2, x + w, y);
    return 3;
  }

  if (shapeType == SHAPE_BRACKET_LEFT) {
    writePoint(0, x + w, y);
    writePoint(1, x, y + h / 2.0);
    writePoint(2, x + w, y + h);
    return 3;
  }

  if (shapeType == SHAPE_BRACKET_RIGHT) {
    writePoint(0, x, y);
    writePoint(1, x + w, y + h / 2.0);
    writePoint(2, x, y + h);
    return 3;
  }

  // Unsupported shape
  return 0;
}

// ─── Result accessors ───

export function getShapePointX(i: i32): f64 {
  if (i < 0 || i >= MAX_POINTS) return 0.0;
  return unchecked(pathOut[i * 2]);
}

export function getShapePointY(i: i32): f64 {
  if (i < 0 || i >= MAX_POINTS) return 0.0;
  return unchecked(pathOut[i * 2 + 1]);
}
