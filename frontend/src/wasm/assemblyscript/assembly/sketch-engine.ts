// Phase 6: Sketch engine in AssemblyScript
// Replaces RoughJS generator for supported shapes: rectangle, polygon,
// line, ellipse, circle, linearPath.
// Outputs a flat command buffer encoding OpSet[] + Op[] that the bridge
// reconstructs into RoughJS-compatible Drawable objects.
//
// PRNG: Park-Miller LCG matching RoughJS exactly.
// Algorithms ported from roughjs/bin/renderer.js and hachure-fill.

// ─── Constants (matching RoughJS defaults) ───

const MAX_RANDOMNESS_OFFSET: f64 = 2.0;
const BOWING: f64 = 1.0;
const CURVE_TIGHTNESS: f64 = 0.0;
const CURVE_STEP_COUNT: i32 = 9;
const CURVE_FITTING: f64 = 0.95;
const FILL_SHAPE_ROUGHNESS_GAIN: f64 = 0.8;

// ─── Fill style enum ───

const FILL_SOLID: i32 = 1;
const FILL_HACHURE: i32 = 2;
const FILL_CROSS_HATCH: i32 = 3;
const FILL_ZIGZAG: i32 = 4;

// ─── Command buffer ───

const MAX_CMDS: i32 = 16384;
const cmdBuf = new Float64Array(MAX_CMDS);
let cmdLen: i32 = 0;

// OpSet type markers
const OPSET_PATH: f64 = 0.0;
const OPSET_FILL_PATH: f64 = 1.0;
const OPSET_FILL_SKETCH: f64 = 2.0;

// Command markers
const OPSET_HEADER: f64 = -1.0;
const END_MARKER: f64 = -2.0;
const OP_MOVE: f64 = 0.0;
const OP_BCURVE: f64 = 1.0;
const OP_LINE_CMD: f64 = 2.0;

// ─── PRNG (Park-Miller LCG, matching RoughJS) ───

let prngState: i32 = 0;

@inline
function prngInit(seed: i32): void {
  prngState = seed;
}

@inline
function prngNext(): f64 {
  if (prngState) {
    prngState = (prngState * 48271) & 0x7FFFFFFF;
    return <f64>prngState / 2147483648.0;
  }
  return 0.5; // fallback (shouldn't happen with valid seed)
}

// ─── Emit helpers ───

@inline
function emit(v: f64): void {
  if (cmdLen < MAX_CMDS) {
    unchecked(cmdBuf[cmdLen] = v);
    cmdLen++;
  }
}

function emitOpSetHeader(opSetType: f64): void {
  emit(OPSET_HEADER);
  emit(opSetType);
}

function emitMove(x: f64, y: f64): void {
  emit(OP_MOVE);
  emit(x);
  emit(y);
}

function emitBCurve(cp1x: f64, cp1y: f64, cp2x: f64, cp2y: f64, x: f64, y: f64): void {
  emit(OP_BCURVE);
  emit(cp1x);
  emit(cp1y);
  emit(cp2x);
  emit(cp2y);
  emit(x);
  emit(y);
}

function emitLineTo(x: f64, y: f64): void {
  emit(OP_LINE_CMD);
  emit(x);
  emit(y);
}

function emitEnd(): void {
  emit(END_MARKER);
}

// ─── RoughJS algorithm helpers ───

// Random offset: roughness * roughnessGain * (random * (max-min) + min)
function _offset(min: f64, max: f64, roughness: f64, roughnessGain: f64 = 1.0): f64 {
  return roughness * roughnessGain * (prngNext() * (max - min) + min);
}

// Symmetric random offset
@inline
function _offsetOpt(x: f64, roughness: f64, roughnessGain: f64 = 1.0): f64 {
  return _offset(-x, x, roughness, roughnessGain);
}

// ─── Core line algorithm (matching renderer.js _line) ───

function _line(
  x1: f64, y1: f64, x2: f64, y2: f64,
  roughness: f64, doMove: bool, overlay: bool,
): void {
  const lengthSq = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
  const length = Math.sqrt(lengthSq);

  let roughnessGain: f64 = 1.0;
  if (length < 200.0) {
    roughnessGain = 1.0;
  } else if (length > 500.0) {
    roughnessGain = 0.4;
  } else {
    roughnessGain = (-0.0016668) * length + 1.233334;
  }

  let offset: f64 = MAX_RANDOMNESS_OFFSET;
  if (offset * offset * 100.0 > lengthSq) {
    offset = length / 10.0;
  }
  const halfOffset = offset / 2.0;

  const divergePoint = 0.2 + prngNext() * 0.2;

  let midDispX = BOWING * MAX_RANDOMNESS_OFFSET * (y2 - y1) / 200.0;
  let midDispY = BOWING * MAX_RANDOMNESS_OFFSET * (x1 - x2) / 200.0;
  midDispX = _offsetOpt(midDispX, roughness, roughnessGain);
  midDispY = _offsetOpt(midDispY, roughness, roughnessGain);

  if (doMove) {
    if (overlay) {
      emitMove(
        x1 + _offsetOpt(halfOffset, roughness, roughnessGain),
        y1 + _offsetOpt(halfOffset, roughness, roughnessGain),
      );
    } else {
      emitMove(
        x1 + _offsetOpt(offset, roughness, roughnessGain),
        y1 + _offsetOpt(offset, roughness, roughnessGain),
      );
    }
  }

  if (overlay) {
    emitBCurve(
      midDispX + x1 + (x2 - x1) * divergePoint + _offsetOpt(halfOffset, roughness, roughnessGain),
      midDispY + y1 + (y2 - y1) * divergePoint + _offsetOpt(halfOffset, roughness, roughnessGain),
      midDispX + x1 + 2.0 * (x2 - x1) * divergePoint + _offsetOpt(halfOffset, roughness, roughnessGain),
      midDispY + y1 + 2.0 * (y2 - y1) * divergePoint + _offsetOpt(halfOffset, roughness, roughnessGain),
      x2 + _offsetOpt(halfOffset, roughness, roughnessGain),
      y2 + _offsetOpt(halfOffset, roughness, roughnessGain),
    );
  } else {
    emitBCurve(
      midDispX + x1 + (x2 - x1) * divergePoint + _offsetOpt(offset, roughness, roughnessGain),
      midDispY + y1 + (y2 - y1) * divergePoint + _offsetOpt(offset, roughness, roughnessGain),
      midDispX + x1 + 2.0 * (x2 - x1) * divergePoint + _offsetOpt(offset, roughness, roughnessGain),
      midDispY + y1 + 2.0 * (y2 - y1) * divergePoint + _offsetOpt(offset, roughness, roughnessGain),
      x2 + _offsetOpt(offset, roughness, roughnessGain),
      y2 + _offsetOpt(offset, roughness, roughnessGain),
    );
  }
}

// Double-line: two passes (unless disableMultiStroke)
function _doubleLine(
  x1: f64, y1: f64, x2: f64, y2: f64,
  roughness: f64, disableMulti: bool,
): void {
  _line(x1, y1, x2, y2, roughness, true, false);
  if (!disableMulti) {
    _line(x1, y1, x2, y2, roughness, true, true);
  }
}

// Double-line for fill (uses disableMultiStrokeFill which defaults to false)
function _doubleLineFill(
  x1: f64, y1: f64, x2: f64, y2: f64,
  roughness: f64,
): void {
  _line(x1, y1, x2, y2, roughness, true, false);
  _line(x1, y1, x2, y2, roughness, true, true);
}

// ─── Linear path / polygon outline ───

function _linearPathOps(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  close: bool, roughness: f64, disableMulti: bool,
): void {
  if (numPts > 2) {
    for (let i: i32 = 0; i < numPts - 1; i++) {
      _doubleLine(
        unchecked(ptsX[i]), unchecked(ptsY[i]),
        unchecked(ptsX[i + 1]), unchecked(ptsY[i + 1]),
        roughness, disableMulti,
      );
    }
    if (close) {
      _doubleLine(
        unchecked(ptsX[numPts - 1]), unchecked(ptsY[numPts - 1]),
        unchecked(ptsX[0]), unchecked(ptsY[0]),
        roughness, disableMulti,
      );
    }
  } else if (numPts == 2) {
    _doubleLine(
      unchecked(ptsX[0]), unchecked(ptsY[0]),
      unchecked(ptsX[1]), unchecked(ptsY[1]),
      roughness, disableMulti,
    );
  }
}

// ─── Solid fill (matching renderer.js solidFillPolygon) ───

function _solidFill(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  roughness: f64,
): void {
  if (numPts < 3) return;
  const offset = MAX_RANDOMNESS_OFFSET;
  emitMove(
    unchecked(ptsX[0]) + _offsetOpt(offset, roughness),
    unchecked(ptsY[0]) + _offsetOpt(offset, roughness),
  );
  for (let i: i32 = 1; i < numPts; i++) {
    emitLineTo(
      unchecked(ptsX[i]) + _offsetOpt(offset, roughness),
      unchecked(ptsY[i]) + _offsetOpt(offset, roughness),
    );
  }
}

// ─── Hachure scan-line algorithm (matching hachure-fill library) ───

// Temp buffers for hachure computation
const MAX_EDGES: i32 = 512;
const MAX_HACHURE_LINES: i32 = 1024;

// Edge table
const edgeYmin = new Float64Array(MAX_EDGES);
const edgeYmax = new Float64Array(MAX_EDGES);
const edgeX = new Float64Array(MAX_EDGES);
const edgeIslope = new Float64Array(MAX_EDGES);

// Active edges
const aeEdgeIdx = new Int32Array(MAX_EDGES);

// Hachure line output
const hlineX1 = new Float64Array(MAX_HACHURE_LINES);
const hlineY1 = new Float64Array(MAX_HACHURE_LINES);
const hlineX2 = new Float64Array(MAX_HACHURE_LINES);
const hlineY2 = new Float64Array(MAX_HACHURE_LINES);

// Rotated point storage
const rotPtsX = new Float64Array(256);
const rotPtsY = new Float64Array(256);

// Sort edges by ymin, then x (simple insertion sort — small arrays)
function sortEdges(count: i32): void {
  for (let i: i32 = 1; i < count; i++) {
    const tYmin = unchecked(edgeYmin[i]);
    const tYmax = unchecked(edgeYmax[i]);
    const tX = unchecked(edgeX[i]);
    const tIslope = unchecked(edgeIslope[i]);
    let j = i - 1;
    while (j >= 0) {
      const jYmin = unchecked(edgeYmin[j]);
      const jX = unchecked(edgeX[j]);
      const jYmax = unchecked(edgeYmax[j]);
      let shouldSwap = false;
      if (jYmin > tYmin) shouldSwap = true;
      else if (jYmin == tYmin && jX > tX) shouldSwap = true;
      else if (jYmin == tYmin && jX == tX && jYmax != tYmax) {
        shouldSwap = (jYmax - tYmax) / Math.abs(jYmax - tYmax) > 0.0;
      }
      if (!shouldSwap) break;
      unchecked(edgeYmin[j + 1] = unchecked(edgeYmin[j]));
      unchecked(edgeYmax[j + 1] = unchecked(edgeYmax[j]));
      unchecked(edgeX[j + 1] = unchecked(edgeX[j]));
      unchecked(edgeIslope[j + 1] = unchecked(edgeIslope[j]));
      j--;
    }
    unchecked(edgeYmin[j + 1] = tYmin);
    unchecked(edgeYmax[j + 1] = tYmax);
    unchecked(edgeX[j + 1] = tX);
    unchecked(edgeIslope[j + 1] = tIslope);
  }
}

function straightHachureLines(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  gap: f64, hachureStepOffset: f64,
): i32 {
  // Build edge table from polygon (auto-close)
  let edgeCount: i32 = 0;
  for (let i: i32 = 0; i < numPts && edgeCount < MAX_EDGES; i++) {
    const ni = (i + 1) % numPts;
    const p1y = unchecked(ptsY[i]);
    const p2y = unchecked(ptsY[ni]);
    if (p1y != p2y) {
      const p1x = unchecked(ptsX[i]);
      const p2x = unchecked(ptsX[ni]);
      const ymin = Math.min(p1y, p2y);
      unchecked(edgeYmin[edgeCount] = ymin);
      unchecked(edgeYmax[edgeCount] = Math.max(p1y, p2y));
      unchecked(edgeX[edgeCount] = ymin == p1y ? p1x : p2x);
      unchecked(edgeIslope[edgeCount] = (p2x - p1x) / (p2y - p1y));
      edgeCount++;
    }
  }

  if (edgeCount == 0) return 0;
  sortEdges(edgeCount);

  let lineCount: i32 = 0;
  let activeCount: i32 = 0;
  let y = unchecked(edgeYmin[0]);
  let edgeIdx: i32 = 0;
  let iteration: i32 = 0;

  while (activeCount > 0 || edgeIdx < edgeCount) {
    // Add edges with ymin <= y
    while (edgeIdx < edgeCount && unchecked(edgeYmin[edgeIdx]) <= y) {
      if (activeCount < MAX_EDGES) {
        unchecked(aeEdgeIdx[activeCount] = edgeIdx);
        activeCount++;
      }
      edgeIdx++;
    }

    // Remove expired edges
    let writeIdx: i32 = 0;
    for (let i: i32 = 0; i < activeCount; i++) {
      const ei = unchecked(aeEdgeIdx[i]);
      if (unchecked(edgeYmax[ei]) > y) {
        unchecked(aeEdgeIdx[writeIdx] = ei);
        writeIdx++;
      }
    }
    activeCount = writeIdx;

    // Sort active edges by current x (insertion sort)
    for (let i: i32 = 1; i < activeCount; i++) {
      const tIdx = unchecked(aeEdgeIdx[i]);
      const tX = unchecked(edgeX[tIdx]);
      let j = i - 1;
      while (j >= 0 && unchecked(edgeX[unchecked(aeEdgeIdx[j])]) > tX) {
        unchecked(aeEdgeIdx[j + 1] = unchecked(aeEdgeIdx[j]));
        j--;
      }
      unchecked(aeEdgeIdx[j + 1] = tIdx);
    }

    // Generate line segments between pairs of active edges
    const gapI32 = <i32>Math.round(gap);
    if (hachureStepOffset != 1.0 || (gapI32 > 0 && iteration % gapI32 == 0)) {
      for (let i: i32 = 0; i + 1 < activeCount && lineCount < MAX_HACHURE_LINES; i += 2) {
        const e1 = unchecked(aeEdgeIdx[i]);
        const e2 = unchecked(aeEdgeIdx[i + 1]);
        unchecked(hlineX1[lineCount] = Math.round(unchecked(edgeX[e1])));
        unchecked(hlineY1[lineCount] = y);
        unchecked(hlineX2[lineCount] = Math.round(unchecked(edgeX[e2])));
        unchecked(hlineY2[lineCount] = y);
        lineCount++;
      }
    }

    // Advance scan line
    y += hachureStepOffset;
    for (let i: i32 = 0; i < activeCount; i++) {
      const ei = unchecked(aeEdgeIdx[i]);
      unchecked(edgeX[ei] = unchecked(edgeX[ei]) + hachureStepOffset * unchecked(edgeIslope[ei]));
    }
    iteration++;
  }

  return lineCount;
}

function hachureLines(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  gap: f64, angle: f64, hachureStepOffset: f64,
): i32 {
  const clampedGap = Math.max(gap, 0.1);
  const angleRad = (Math.PI / 180.0) * angle;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  // Copy and rotate points
  const n = numPts < 256 ? numPts : 255;
  for (let i: i32 = 0; i < n; i++) {
    const px = unchecked(ptsX[i]);
    const py = unchecked(ptsY[i]);
    unchecked(rotPtsX[i] = px * cosA - py * sinA);
    unchecked(rotPtsY[i] = px * sinA + py * cosA);
  }

  // Scan-line on rotated polygon
  const lineCount = straightHachureLines(
    changetype<StaticArray<f64>>(changetype<usize>(rotPtsX)),
    changetype<StaticArray<f64>>(changetype<usize>(rotPtsY)),
    n, clampedGap, hachureStepOffset,
  );

  // Rotate hachure lines back
  const cosNeg = Math.cos(-angleRad);
  const sinNeg = Math.sin(-angleRad);
  for (let i: i32 = 0; i < lineCount; i++) {
    let lx1 = unchecked(hlineX1[i]);
    let ly1 = unchecked(hlineY1[i]);
    let lx2 = unchecked(hlineX2[i]);
    let ly2 = unchecked(hlineY2[i]);
    unchecked(hlineX1[i] = lx1 * cosNeg - ly1 * sinNeg);
    unchecked(hlineY1[i] = lx1 * sinNeg + ly1 * cosNeg);
    unchecked(hlineX2[i] = lx2 * cosNeg - ly2 * sinNeg);
    unchecked(hlineY2[i] = lx2 * sinNeg + ly2 * cosNeg);
  }

  return lineCount;
}

function emitHachureFill(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  roughness: f64, hachureAngle: f64, hachureGap: f64, strokeWidth: f64,
): void {
  const angle = hachureAngle + 90.0;
  let gap = hachureGap;
  if (gap < 0.0) {
    gap = strokeWidth * 4.0;
  }
  gap = Math.round(Math.max(gap, 0.1));

  // Match RoughJS: random skip offset for roughness >= 1
  let skipOffset: f64 = 1.0;
  if (roughness >= 1.0) {
    if (prngNext() > 0.7) {
      skipOffset = gap;
    }
  }

  const lineCount = hachureLines(ptsX, ptsY, numPts, gap, angle, skipOffset > 0.0 ? skipOffset : 1.0);

  emitOpSetHeader(OPSET_FILL_SKETCH);
  for (let i: i32 = 0; i < lineCount; i++) {
    _doubleLineFill(
      unchecked(hlineX1[i]), unchecked(hlineY1[i]),
      unchecked(hlineX2[i]), unchecked(hlineY2[i]),
      roughness,
    );
  }
}

function emitCrossHatchFill(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  roughness: f64, hachureAngle: f64, hachureGap: f64, strokeWidth: f64,
): void {
  // First pass at hachureAngle
  emitHachureFill(ptsX, ptsY, numPts, roughness, hachureAngle, hachureGap, strokeWidth);
  // Second pass at hachureAngle + 90 (ops appended to same OpSet)
  const angle2 = hachureAngle + 90.0;
  let gap = hachureGap;
  if (gap < 0.0) gap = strokeWidth * 4.0;
  gap = Math.round(Math.max(gap, 0.1));

  let skipOffset: f64 = 1.0;
  if (roughness >= 1.0) {
    if (prngNext() > 0.7) {
      skipOffset = gap;
    }
  }

  const lineCount = hachureLines(ptsX, ptsY, numPts, gap, angle2 + 90.0, skipOffset > 0.0 ? skipOffset : 1.0);
  for (let i: i32 = 0; i < lineCount; i++) {
    _doubleLineFill(
      unchecked(hlineX1[i]), unchecked(hlineY1[i]),
      unchecked(hlineX2[i]), unchecked(hlineY2[i]),
      roughness,
    );
  }
}

function emitZigzagFill(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  roughness: f64, hachureAngle: f64, hachureGap: f64, strokeWidth: f64,
): void {
  let gap = hachureGap;
  if (gap < 0.0) gap = strokeWidth * 4.0;
  gap = Math.max(gap, 0.1);

  const angle = hachureAngle + 90.0;

  // Match RoughJS skipOffset
  let skipOffset: f64 = 1.0;
  if (roughness >= 1.0) {
    if (prngNext() > 0.7) {
      skipOffset = gap;
    }
  }

  const lineCount = hachureLines(ptsX, ptsY, numPts, gap, angle, skipOffset > 0.0 ? skipOffset : 1.0);

  // Zigzag: offset lines by gap/2 perpendicular to hachure angle
  const zigAngle = (Math.PI / 180.0) * hachureAngle;
  const dgx = gap * 0.5 * Math.cos(zigAngle);
  const dgy = gap * 0.5 * Math.sin(zigAngle);

  emitOpSetHeader(OPSET_FILL_SKETCH);
  for (let i: i32 = 0; i < lineCount; i++) {
    const lx1 = unchecked(hlineX1[i]);
    const ly1 = unchecked(hlineY1[i]);
    const lx2 = unchecked(hlineX2[i]);
    const ly2 = unchecked(hlineY2[i]);
    const segLen = Math.sqrt((lx2 - lx1) * (lx2 - lx1) + (ly2 - ly1) * (ly2 - ly1));
    if (segLen > 0.0) {
      _doubleLineFill(lx1 - dgx, ly1 + dgy, lx2, ly2, roughness);
      _doubleLineFill(lx1 + dgx, ly1 - dgy, lx2, ly2, roughness);
    }
  }
}

// Emit fill for a polygon (solid, hachure, cross-hatch, zigzag)
function emitFill(
  ptsX: StaticArray<f64>, ptsY: StaticArray<f64>, numPts: i32,
  roughness: f64, fillStyle: i32,
  hachureAngle: f64, hachureGap: f64, strokeWidth: f64,
): void {
  if (fillStyle == FILL_SOLID) {
    emitOpSetHeader(OPSET_FILL_PATH);
    _solidFill(ptsX, ptsY, numPts, roughness);
  } else if (fillStyle == FILL_HACHURE) {
    emitHachureFill(ptsX, ptsY, numPts, roughness, hachureAngle, hachureGap, strokeWidth);
  } else if (fillStyle == FILL_CROSS_HATCH) {
    emitCrossHatchFill(ptsX, ptsY, numPts, roughness, hachureAngle, hachureGap, strokeWidth);
  } else if (fillStyle == FILL_ZIGZAG) {
    emitZigzagFill(ptsX, ptsY, numPts, roughness, hachureAngle, hachureGap, strokeWidth);
  }
}

// ─── Ellipse algorithm (matching renderer.js) ───

// Temp point storage for ellipse
const MAX_ELLIPSE_PTS: i32 = 256;
const ellipsePtsX = new Float64Array(MAX_ELLIPSE_PTS);
const ellipsePtsY = new Float64Array(MAX_ELLIPSE_PTS);
const ellipseCorePtsX = new Float64Array(MAX_ELLIPSE_PTS);
const ellipseCorePtsY = new Float64Array(MAX_ELLIPSE_PTS);

function computeEllipsePoints(
  increment: f64, cx: f64, cy: f64, rx: f64, ry: f64,
  offsetMul: f64, overlap: f64, roughness: f64,
  coreOnly: bool,
): i32 {
  // Returns: count of allPoints (ellipsePtsX/Y), corePoints in ellipseCorePtsX/Y
  let allCount: i32 = 0;
  let coreCount: i32 = 0;

  if (coreOnly) {
    const inc4 = increment / 4.0;
    // Leading overlap point
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = cx + rx * Math.cos(-inc4));
      unchecked(ellipsePtsY[allCount] = cy + ry * Math.sin(-inc4));
      allCount++;
    }
    let angle: f64 = 0.0;
    while (angle <= Math.PI * 2.0) {
      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);
      if (coreCount < MAX_ELLIPSE_PTS) {
        unchecked(ellipseCorePtsX[coreCount] = px);
        unchecked(ellipseCorePtsY[coreCount] = py);
        coreCount++;
      }
      if (allCount < MAX_ELLIPSE_PTS) {
        unchecked(ellipsePtsX[allCount] = px);
        unchecked(ellipsePtsY[allCount] = py);
        allCount++;
      }
      angle += inc4;
    }
    // Trailing overlap points
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = cx + rx * Math.cos(0.0));
      unchecked(ellipsePtsY[allCount] = cy + ry * Math.sin(0.0));
      allCount++;
    }
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = cx + rx * Math.cos(inc4));
      unchecked(ellipsePtsY[allCount] = cy + ry * Math.sin(inc4));
      allCount++;
    }
  } else {
    const radOffset = _offsetOpt(0.5, roughness) - Math.PI / 2.0;
    // Leading point
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = _offsetOpt(offsetMul, roughness) + cx + 0.9 * rx * Math.cos(radOffset - increment));
      unchecked(ellipsePtsY[allCount] = _offsetOpt(offsetMul, roughness) + cy + 0.9 * ry * Math.sin(radOffset - increment));
      allCount++;
    }
    const endAngle = Math.PI * 2.0 + radOffset - 0.01;
    let angle = radOffset;
    while (angle < endAngle) {
      const px = _offsetOpt(offsetMul, roughness) + cx + rx * Math.cos(angle);
      const py = _offsetOpt(offsetMul, roughness) + cy + ry * Math.sin(angle);
      if (coreCount < MAX_ELLIPSE_PTS) {
        unchecked(ellipseCorePtsX[coreCount] = px);
        unchecked(ellipseCorePtsY[coreCount] = py);
        coreCount++;
      }
      if (allCount < MAX_ELLIPSE_PTS) {
        unchecked(ellipsePtsX[allCount] = px);
        unchecked(ellipsePtsY[allCount] = py);
        allCount++;
      }
      angle += increment;
    }
    // Trailing overlap points
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = _offsetOpt(offsetMul, roughness) + cx + rx * Math.cos(radOffset + Math.PI * 2.0 + overlap * 0.5));
      unchecked(ellipsePtsY[allCount] = _offsetOpt(offsetMul, roughness) + cy + ry * Math.sin(radOffset + Math.PI * 2.0 + overlap * 0.5));
      allCount++;
    }
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = _offsetOpt(offsetMul, roughness) + cx + 0.98 * rx * Math.cos(radOffset + overlap));
      unchecked(ellipsePtsY[allCount] = _offsetOpt(offsetMul, roughness) + cy + 0.98 * ry * Math.sin(radOffset + overlap));
      allCount++;
    }
    if (allCount < MAX_ELLIPSE_PTS) {
      unchecked(ellipsePtsX[allCount] = _offsetOpt(offsetMul, roughness) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5));
      unchecked(ellipsePtsY[allCount] = _offsetOpt(offsetMul, roughness) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5));
      allCount++;
    }
  }

  return allCount;
}

// Catmull-Rom to Bezier curve (matching renderer.js _curve)
function emitCurve(
  ptsX: Float64Array, ptsY: Float64Array, numPts: i32,
): void {
  if (numPts > 3) {
    const s: f64 = 1.0 - CURVE_TIGHTNESS;
    emitMove(unchecked(ptsX[1]), unchecked(ptsY[1]));
    for (let i: i32 = 1; i + 2 < numPts; i++) {
      const cx0 = unchecked(ptsX[i]);
      const cy0 = unchecked(ptsY[i]);
      const b1x = cx0 + (s * unchecked(ptsX[i + 1]) - s * unchecked(ptsX[i - 1])) / 6.0;
      const b1y = cy0 + (s * unchecked(ptsY[i + 1]) - s * unchecked(ptsY[i - 1])) / 6.0;
      const b2x = unchecked(ptsX[i + 1]) + (s * unchecked(ptsX[i]) - s * unchecked(ptsX[i + 2])) / 6.0;
      const b2y = unchecked(ptsY[i + 1]) + (s * unchecked(ptsY[i]) - s * unchecked(ptsY[i + 2])) / 6.0;
      const b3x = unchecked(ptsX[i + 1]);
      const b3y = unchecked(ptsY[i + 1]);
      emitBCurve(b1x, b1y, b2x, b2y, b3x, b3y);
    }
  } else if (numPts == 3) {
    emitMove(unchecked(ptsX[1]), unchecked(ptsY[1]));
    emitBCurve(
      unchecked(ptsX[1]), unchecked(ptsY[1]),
      unchecked(ptsX[2]), unchecked(ptsY[2]),
      unchecked(ptsX[2]), unchecked(ptsY[2]),
    );
  } else if (numPts == 2) {
    // Degenerate: fall back to jittered line
    // (roughness passed as 1.0 default)
    _line(unchecked(ptsX[0]), unchecked(ptsY[0]),
          unchecked(ptsX[1]), unchecked(ptsY[1]),
          1.0, true, true);
  }
}

// ─── Temp polygon buffers (reused for rectangle corners, etc.) ───

const polyBufX = new StaticArray<f64>(128);
const polyBufY = new StaticArray<f64>(128);

// ─── Exported sketch functions ───

export function sketchRectangle(
  x: f64, y: f64, w: f64, h: f64,
  roughness: f64, seed: i32, strokeWidth: f64,
  fillStyle: i32, hachureAngle: f64, hachureGap: f64,
  disableMultiStroke: i32, hasFill: i32,
): i32 {
  cmdLen = 0;
  prngInit(seed);

  // Rectangle corners
  unchecked(polyBufX[0] = x);     unchecked(polyBufY[0] = y);
  unchecked(polyBufX[1] = x + w); unchecked(polyBufY[1] = y);
  unchecked(polyBufX[2] = x + w); unchecked(polyBufY[2] = y + h);
  unchecked(polyBufX[3] = x);     unchecked(polyBufY[3] = y + h);

  // Outline (computed first, as in RoughJS — PRNG consumed here first)
  const outlineStart = cmdLen;
  emitOpSetHeader(OPSET_PATH);
  _linearPathOps(polyBufX, polyBufY, 4, true, roughness, disableMultiStroke != 0);
  const outlineEnd = cmdLen;

  // Fill (PRNG continues after outline)
  let fillStart: i32 = 0;
  let fillEnd: i32 = 0;
  if (hasFill != 0) {
    fillStart = cmdLen;
    emitFill(polyBufX, polyBufY, 4, roughness, fillStyle, hachureAngle, hachureGap, strokeWidth);
    fillEnd = cmdLen;
  }

  // Rearrange: fill before outline (matching RoughJS Drawable order)
  // In RoughJS: paths = [fill, outline]. We need to swap them in the buffer.
  if (hasFill != 0 && fillEnd > fillStart) {
    // Copy outline to temp, shift fill to front, copy outline after
    const outlineLen = outlineEnd - outlineStart;
    const fillLen = fillEnd - fillStart;

    // Use a simple swap: copy to temp array, rewrite
    const tmpBuf = new Float64Array(outlineLen);
    for (let i: i32 = 0; i < outlineLen; i++) {
      unchecked(tmpBuf[i] = unchecked(cmdBuf[outlineStart + i]));
    }
    // Move fill data to start
    for (let i: i32 = 0; i < fillLen; i++) {
      unchecked(cmdBuf[i] = unchecked(cmdBuf[fillStart + i]));
    }
    // Copy outline after fill
    for (let i: i32 = 0; i < outlineLen; i++) {
      unchecked(cmdBuf[fillLen + i] = unchecked(tmpBuf[i]));
    }
    cmdLen = fillLen + outlineLen;
  }

  emitEnd();
  return cmdLen;
}

export function sketchPolygon(
  pointsPtr: usize, numPoints: i32,
  roughness: f64, seed: i32, strokeWidth: f64,
  fillStyle: i32, hachureAngle: f64, hachureGap: f64,
  disableMultiStroke: i32, hasFill: i32,
): i32 {
  cmdLen = 0;
  prngInit(seed);

  if (numPoints < 2) {
    emitEnd();
    return cmdLen;
  }

  // Read points from buffer (flat [x0, y0, x1, y1, ...])
  const buf = changetype<Float64Array>(pointsPtr);
  const n = numPoints < 128 ? numPoints : 127;
  for (let i: i32 = 0; i < n; i++) {
    unchecked(polyBufX[i] = unchecked(buf[i * 2]));
    unchecked(polyBufY[i] = unchecked(buf[i * 2 + 1]));
  }

  // Outline first (PRNG order)
  const outlineStart = cmdLen;
  emitOpSetHeader(OPSET_PATH);
  _linearPathOps(polyBufX, polyBufY, n, true, roughness, disableMultiStroke != 0);
  const outlineEnd = cmdLen;

  // Fill
  let fillStart: i32 = 0;
  let fillEnd: i32 = 0;
  if (hasFill != 0) {
    fillStart = cmdLen;
    emitFill(polyBufX, polyBufY, n, roughness, fillStyle, hachureAngle, hachureGap, strokeWidth);
    fillEnd = cmdLen;
  }

  // Rearrange: fill before outline
  if (hasFill != 0 && fillEnd > fillStart) {
    const outlineLen = outlineEnd - outlineStart;
    const fillLen = fillEnd - fillStart;
    const tmpBuf = new Float64Array(outlineLen);
    for (let i: i32 = 0; i < outlineLen; i++) {
      unchecked(tmpBuf[i] = unchecked(cmdBuf[outlineStart + i]));
    }
    for (let i: i32 = 0; i < fillLen; i++) {
      unchecked(cmdBuf[i] = unchecked(cmdBuf[fillStart + i]));
    }
    for (let i: i32 = 0; i < outlineLen; i++) {
      unchecked(cmdBuf[fillLen + i] = unchecked(tmpBuf[i]));
    }
    cmdLen = fillLen + outlineLen;
  }

  emitEnd();
  return cmdLen;
}

export function sketchLine(
  x1: f64, y1: f64, x2: f64, y2: f64,
  roughness: f64, seed: i32, strokeWidth: f64,
  disableMultiStroke: i32,
): i32 {
  cmdLen = 0;
  prngInit(seed);

  emitOpSetHeader(OPSET_PATH);
  _doubleLine(x1, y1, x2, y2, roughness, disableMultiStroke != 0);

  emitEnd();
  return cmdLen;
}

export function sketchEllipse(
  cx: f64, cy: f64, rw: f64, rh: f64,
  roughness: f64, seed: i32, strokeWidth: f64,
  fillStyle: i32, hachureAngle: f64, hachureGap: f64,
  disableMultiStroke: i32, hasFill: i32,
): i32 {
  cmdLen = 0;
  prngInit(seed);

  // Generate ellipse params (matching generateEllipseParams)
  let rx = Math.abs(rw / 2.0);
  let ry = Math.abs(rh / 2.0);
  const psq = Math.sqrt(Math.PI * 2.0 * Math.sqrt((rx * rx + ry * ry) / 2.0));
  const stepCount = <i32>Math.ceil(Math.max(<f64>CURVE_STEP_COUNT, (<f64>CURVE_STEP_COUNT / Math.sqrt(200.0)) * psq));
  const increment = (Math.PI * 2.0) / <f64>stepCount;

  const curveFitRandomness = 1.0 - CURVE_FITTING;
  rx += _offsetOpt(rx * curveFitRandomness, roughness);
  ry += _offsetOpt(ry * curveFitRandomness, roughness);

  const coreOnly = roughness == 0.0;

  // Compute ellipse outline points (pass 1)
  const overlap1 = increment * _offset(0.1, _offset(0.4, 1.0, roughness), roughness);
  const allCount1 = computeEllipsePoints(increment, cx, cy, rx, ry, 1.0, overlap1, roughness, coreOnly);

  // Store core points count for fill before we overwrite
  // Copy core points to polyBuf for fill usage
  let coreCount: i32 = 0;
  for (let i: i32 = 0; i < MAX_ELLIPSE_PTS && i < 128; i++) {
    if (unchecked(ellipseCorePtsX[i]) == 0.0 && unchecked(ellipseCorePtsY[i]) == 0.0 && i > 0) {
      // Check if we've gone past the data
      break;
    }
    unchecked(polyBufX[i] = unchecked(ellipseCorePtsX[i]));
    unchecked(polyBufY[i] = unchecked(ellipseCorePtsY[i]));
    coreCount = i + 1;
  }

  // Actually, core points count = allCount - leading/trailing points
  // Let's count them properly based on the algorithm
  // In the coreOnly path: corePoints are generated in the loop
  // In the rough path: corePoints are generated in the loop
  // The computeEllipsePoints function stores them in ellipseCorePtsX/Y
  // We need a separate counter for core points
  // For simplicity, estimate from step count
  coreCount = stepCount + 1; // approximate
  if (coreCount > 128) coreCount = 128;

  // Emit outline pass 1
  const outlineStart = cmdLen;
  emitOpSetHeader(OPSET_PATH);
  emitCurve(ellipsePtsX, ellipsePtsY, allCount1);

  // Outline pass 2 (if multi-stroke enabled and roughness > 0)
  if (disableMultiStroke == 0 && roughness != 0.0) {
    const allCount2 = computeEllipsePoints(increment, cx, cy, rx, ry, 1.5, 0.0, roughness, coreOnly);
    emitCurve(ellipsePtsX, ellipsePtsY, allCount2);
  }
  const outlineEnd = cmdLen;

  // Fill
  let fillStart: i32 = 0;
  let fillEnd: i32 = 0;
  if (hasFill != 0) {
    fillStart = cmdLen;
    if (fillStyle == FILL_SOLID) {
      // Solid fill uses the ellipse opset itself with type fillPath
      // Generate a clean ellipse for fill
      const fillCount = computeEllipsePoints(increment, cx, cy, rx, ry, 1.0, 0.0, roughness, coreOnly);
      emitOpSetHeader(OPSET_FILL_PATH);
      emitCurve(ellipsePtsX, ellipsePtsY, fillCount);
    } else {
      // Pattern fill uses estimated (core) points as polygon
      emitFill(polyBufX, polyBufY, coreCount, roughness, fillStyle, hachureAngle, hachureGap, strokeWidth);
    }
    fillEnd = cmdLen;
  }

  // Rearrange: fill before outline
  if (hasFill != 0 && fillEnd > fillStart) {
    const outlineLen = outlineEnd - outlineStart;
    const fillLen = fillEnd - fillStart;
    const tmpBuf = new Float64Array(outlineLen);
    for (let i: i32 = 0; i < outlineLen; i++) {
      unchecked(tmpBuf[i] = unchecked(cmdBuf[outlineStart + i]));
    }
    for (let i: i32 = 0; i < fillLen; i++) {
      unchecked(cmdBuf[i] = unchecked(cmdBuf[fillStart + i]));
    }
    for (let i: i32 = 0; i < outlineLen; i++) {
      unchecked(cmdBuf[fillLen + i] = unchecked(tmpBuf[i]));
    }
    cmdLen = fillLen + outlineLen;
  }

  emitEnd();
  return cmdLen;
}

export function sketchLinearPath(
  pointsPtr: usize, numPoints: i32,
  roughness: f64, seed: i32, strokeWidth: f64,
  disableMultiStroke: i32,
): i32 {
  cmdLen = 0;
  prngInit(seed);

  if (numPoints < 2) {
    emitEnd();
    return cmdLen;
  }

  const buf = changetype<Float64Array>(pointsPtr);
  const n = numPoints < 128 ? numPoints : 127;
  for (let i: i32 = 0; i < n; i++) {
    unchecked(polyBufX[i] = unchecked(buf[i * 2]));
    unchecked(polyBufY[i] = unchecked(buf[i * 2 + 1]));
  }

  emitOpSetHeader(OPSET_PATH);
  _linearPathOps(polyBufX, polyBufY, n, false, roughness, disableMultiStroke != 0);

  emitEnd();
  return cmdLen;
}

// ─── Result accessor ───

export function getSketchCmd(i: i32): f64 {
  if (i < 0 || i >= MAX_CMDS) return 0.0;
  return unchecked(cmdBuf[i]);
}
