// Phase 3: A* smart elbow routing in AssemblyScript
// Finds obstacle-avoiding orthogonal paths on a sparse visibility grid.
// Grid construction + obstacle filtering done in JS bridge; A* hot loop runs here.

// ─── Direction / position enums ───

const DIR_NONE: i32 = 0;
const DIR_H: i32 = 1;    // horizontal move
const DIR_V: i32 = 2;    // vertical move

const POS_NONE: i32 = 0;
const POS_TOP: i32 = 1;
const POS_BOTTOM: i32 = 2;
const POS_LEFT: i32 = 3;
const POS_RIGHT: i32 = 4;

// ─── Constants ───

const MAX_GRID: i32 = 256;            // max coords per axis
const MAX_NODES: i32 = 65536;         // 256 * 256
const MAX_OPEN: i32 = 65536;
const MAX_OUTPUT: i32 = 128;
const MAX_ITERATIONS: i32 = 800;
const TURN_PENALTY: f64 = 100.0;
const OBSTACLE_PENALTY: f64 = 500.0;
const OBSTACLE_FIELDS: i32 = 6;       // x, y, w, h, isStartEl, isEndEl
// Soft cost for running along another connector's body. MUST match
// CONNECTOR_PENALTY in utils/routing.ts (JS twin).
const CONNECTOR_PENALTY: f64 = 400.0;
const SEGMENT_FIELDS: i32 = 4;        // x1, y1, x2, y2
const SEGMENT_TOL: f64 = 2.0;

// ─── Static arrays (module-level, allocated once) ───

const gScore = new Float64Array(MAX_NODES);
const fScore = new Float64Array(MAX_NODES);
const parentIdx = new Int32Array(MAX_NODES);
const dirArr = new Int32Array(MAX_NODES);
const generation = new Int32Array(MAX_NODES);  // generation counter for lazy reset
let currentGen: i32 = 0;

// Binary min-heap (by fScore)
const heap = new Int32Array(MAX_OPEN);
let heapSize: i32 = 0;

// Output path buffer
const pathOut = new Float64Array(MAX_OUTPUT * 2);

// ─── Generation-based lazy reset ───

@inline
function isVisited(idx: i32): bool {
  return unchecked(generation[idx]) == currentGen;
}

@inline
function markVisited(idx: i32): void {
  unchecked(generation[idx] = currentGen);
}

@inline
function getG(idx: i32): f64 {
  if (unchecked(generation[idx]) != currentGen) return Infinity;
  return unchecked(gScore[idx]);
}

@inline
function getF(idx: i32): f64 {
  if (unchecked(generation[idx]) != currentGen) return Infinity;
  return unchecked(fScore[idx]);
}

@inline
function isClosed(idx: i32): bool {
  if (unchecked(generation[idx]) != currentGen) return false;
  return unchecked(dirArr[idx]) < 0;  // reuse dirArr sign bit: negative = closed
}

// We encode closed state as: dirArr stores actual dir (0,1,2) for open nodes.
// When a node is popped from the heap and processed, we negate (flip sign) and subtract 1
// to mark it closed: closed encoding = -(dir + 1).
// This avoids a separate inClosed array.

@inline
function markClosed(idx: i32): void {
  const d = unchecked(dirArr[idx]);
  unchecked(dirArr[idx] = -(d + 1));
}

@inline
function getDir(idx: i32): i32 {
  const d = unchecked(dirArr[idx]);
  return d >= 0 ? d : -(d + 1);
}

// ─── Min-heap operations ───

function heapPush(nodeIdx: i32): void {
  if (heapSize >= MAX_OPEN) return;
  let pos = heapSize;
  unchecked(heap[pos] = nodeIdx);
  heapSize++;

  // Sift up
  while (pos > 0) {
    const parentPos = (pos - 1) >> 1;
    const pIdx = unchecked(heap[parentPos]);
    const cIdx = unchecked(heap[pos]);
    if (unchecked(fScore[cIdx]) < unchecked(fScore[pIdx])) {
      unchecked(heap[parentPos] = cIdx);
      unchecked(heap[pos] = pIdx);
      pos = parentPos;
    } else {
      break;
    }
  }
}

function heapPop(): i32 {
  if (heapSize == 0) return -1;
  const root = unchecked(heap[0]);
  heapSize--;
  if (heapSize > 0) {
    unchecked(heap[0] = heap[heapSize]);
    // Sift down
    let pos: i32 = 0;
    while (true) {
      const left = 2 * pos + 1;
      const right = 2 * pos + 2;
      let smallest = pos;
      if (left < heapSize &&
          unchecked(fScore[heap[left]]) < unchecked(fScore[heap[smallest]])) {
        smallest = left;
      }
      if (right < heapSize &&
          unchecked(fScore[heap[right]]) < unchecked(fScore[heap[smallest]])) {
        smallest = right;
      }
      if (smallest != pos) {
        const tmp = unchecked(heap[pos]);
        unchecked(heap[pos] = heap[smallest]);
        unchecked(heap[smallest] = tmp);
        pos = smallest;
      } else {
        break;
      }
    }
  }
  return root;
}

// ─── Obstacle helpers ───

function isInsideAny(
  x: f64, y: f64,
  obstBuf: Float64Array, obstCount: i32
): bool {
  for (let i: i32 = 0; i < obstCount; i++) {
    const base = i * OBSTACLE_FIELDS;
    const ox = unchecked(obstBuf[base]);
    const oy = unchecked(obstBuf[base + 1]);
    const ow = unchecked(obstBuf[base + 2]);
    const oh = unchecked(obstBuf[base + 3]);
    if (x > ox + 1.0 && x < ox + ow - 1.0 &&
        y > oy + 1.0 && y < oy + oh - 1.0) return true;
  }
  return false;
}

function isObstacleSegment(
  x1: f64, y1: f64, x2: f64, y2: f64,
  obstBuf: Float64Array, obstCount: i32
): bool {
  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5;
  for (let i: i32 = 0; i < obstCount; i++) {
    const base = i * OBSTACLE_FIELDS;
    const ox = unchecked(obstBuf[base]);
    const oy = unchecked(obstBuf[base + 1]);
    const ow = unchecked(obstBuf[base + 2]);
    const oh = unchecked(obstBuf[base + 3]);
    const isStartEnd = unchecked(obstBuf[base + 4]) != 0.0 ||
                       unchecked(obstBuf[base + 5]) != 0.0;
    const margin: f64 = isStartEnd ? 3.0 : 1.0;
    if (mx > ox + margin && mx < ox + ow - margin &&
        my > oy + margin && my < oy + oh - margin) return true;
  }
  return false;
}

/**
 * True when the candidate segment runs COLLINEARLY on top of any connector body
 * segment (same axis, same line within SEGMENT_TOL, overlapping extents).
 * Plain crossings are intentionally not flagged. Mirrors segmentsCollinearOverlap()
 * in utils/routing.ts — keep the two in sync.
 */
function overlapsConnector(
  cx: f64, cy: f64, nx: f64, ny: f64,
  segBuf: Float64Array, segCount: i32
): bool {
  const candH: bool = Math.abs(cy - ny) < 0.1;
  const candV: bool = Math.abs(cx - nx) < 0.1;
  if (!candH && !candV) return false;

  for (let i: i32 = 0; i < segCount; i++) {
    const base = i * SEGMENT_FIELDS;
    const sx1 = unchecked(segBuf[base]);
    const sy1 = unchecked(segBuf[base + 1]);
    const sx2 = unchecked(segBuf[base + 2]);
    const sy2 = unchecked(segBuf[base + 3]);

    const segH: bool = Math.abs(sy1 - sy2) < 0.1;
    const segV: bool = Math.abs(sx1 - sx2) < 0.1;

    if (candH && segH) {
      if (Math.abs(cy - sy1) > SEGMENT_TOL) continue;
      const a1 = cx < nx ? cx : nx;
      const a2 = cx < nx ? nx : cx;
      const b1 = sx1 < sx2 ? sx1 : sx2;
      const b2 = sx1 < sx2 ? sx2 : sx1;
      const lo = a2 < b2 ? a2 : b2;
      const hi = a1 > b1 ? a1 : b1;
      if (lo - hi > SEGMENT_TOL) return true;
    } else if (candV && segV) {
      if (Math.abs(cx - sx1) > SEGMENT_TOL) continue;
      const a1 = cy < ny ? cy : ny;
      const a2 = cy < ny ? ny : cy;
      const b1 = sy1 < sy2 ? sy1 : sy2;
      const b2 = sy1 < sy2 ? sy2 : sy1;
      const lo = a2 < b2 ? a2 : b2;
      const hi = a1 > b1 ? a1 : b1;
      if (lo - hi > SEGMENT_TOL) return true;
    }
  }
  return false;
}

// ─── Direction constraint helpers ───

// For start position: only allow moving in that direction from start
// POS_TOP → must move dy=-1 (up in grid, which is DIR_V with dy<0)
// POS_BOTTOM → must move dy=+1
// POS_LEFT → must move dx=-1
// POS_RIGHT → must move dx=+1
@inline
function isAllowedStartMove(posEnum: i32, dx: i32, dy: i32): bool {
  if (posEnum == POS_TOP)    return dx == 0 && dy == -1;
  if (posEnum == POS_BOTTOM) return dx == 0 && dy == 1;
  if (posEnum == POS_LEFT)   return dx == -1 && dy == 0;
  if (posEnum == POS_RIGHT)  return dx == 1 && dy == 0;
  return true; // POS_NONE — no constraint
}

// For end position: must arrive from the opposite direction
// endPos=TOP means the connector enters from above, so we must arrive with dy=+1 (moving down into it)
@inline
function isAllowedEndMove(posEnum: i32, dx: i32, dy: i32): bool {
  if (posEnum == POS_TOP)    return dx == 0 && dy == 1;   // arrive from above (moving down)
  if (posEnum == POS_BOTTOM) return dx == 0 && dy == -1;  // arrive from below (moving up)
  if (posEnum == POS_LEFT)   return dx == 1 && dy == 0;   // arrive from left (moving right)
  if (posEnum == POS_RIGHT)  return dx == -1 && dy == 0;  // arrive from right (moving left)
  return true;
}

// ─── cleanPath: dedup + collinear merge ───

function cleanPath(rawBuf: Float64Array, rawCount: i32): i32 {
  if (rawCount <= 1) {
    for (let i: i32 = 0; i < rawCount; i++) {
      unchecked(pathOut[i * 2]     = rawBuf[i * 2]);
      unchecked(pathOut[i * 2 + 1] = rawBuf[i * 2 + 1]);
    }
    return rawCount;
  }

  // First pass: dedup + collinear merge directly into pathOut
  let outCount: i32 = 0;
  unchecked(pathOut[0] = rawBuf[0]);
  unchecked(pathOut[1] = rawBuf[1]);
  outCount = 1;

  for (let i: i32 = 1; i < rawCount; i++) {
    const px = unchecked(rawBuf[i * 2]);
    const py = unchecked(rawBuf[i * 2 + 1]);
    const lastX = unchecked(pathOut[(outCount - 1) * 2]);
    const lastY = unchecked(pathOut[(outCount - 1) * 2 + 1]);

    // Skip duplicates
    if (Math.abs(px - lastX) < 0.1 && Math.abs(py - lastY) < 0.1) continue;

    // Collinear merge: if last two + current are on same axis, extend
    if (outCount >= 2) {
      const prevX = unchecked(pathOut[(outCount - 2) * 2]);
      const prevY = unchecked(pathOut[(outCount - 2) * 2 + 1]);
      const sameX = Math.abs(prevX - lastX) < 0.1 && Math.abs(lastX - px) < 0.1;
      const sameY = Math.abs(prevY - lastY) < 0.1 && Math.abs(lastY - py) < 0.1;
      if (sameX || sameY) {
        // Replace last point instead of adding
        unchecked(pathOut[(outCount - 1) * 2]     = px);
        unchecked(pathOut[(outCount - 1) * 2 + 1] = py);
        continue;
      }
    }

    if (outCount < MAX_OUTPUT) {
      unchecked(pathOut[outCount * 2]     = px);
      unchecked(pathOut[outCount * 2 + 1] = py);
      outCount++;
    }
  }

  return outCount;
}

// Temporary buffer for path reconstruction (before cleanPath)
const rawPath = new Float64Array(MAX_OUTPUT * 2);

// ─── Main A* export ───

export function calculateSmartElbowRoute(
  xGridPtr: usize, yGridPtr: usize,
  gridW: i32, gridH: i32,
  startGx: i32, startGy: i32,
  endGx: i32, endGy: i32,
  startPosEnum: i32, endPosEnum: i32,
  obstBufPtr: usize, obstCount: i32,
  segBufPtr: usize, segCount: i32
): i32 {
  // Bounds check
  if (gridW <= 0 || gridH <= 0 || gridW > MAX_GRID || gridH > MAX_GRID) return 0;
  if (startGx < 0 || startGx >= gridW || startGy < 0 || startGy >= gridH) return 0;
  if (endGx < 0 || endGx >= gridW || endGy < 0 || endGy >= gridH) return 0;

  const xGrid = changetype<Float64Array>(xGridPtr);
  const yGrid = changetype<Float64Array>(yGridPtr);
  const obstBuf = changetype<Float64Array>(obstBufPtr);
  const segBuf = changetype<Float64Array>(segBufPtr);

  // Increment generation for lazy reset
  currentGen++;
  heapSize = 0;

  const startIdx = startGy * gridW + startGx;
  const endIdx = endGy * gridW + endGx;

  const endX = unchecked(xGrid[endGx]);
  const endY = unchecked(yGrid[endGy]);
  const startX = unchecked(xGrid[startGx]);
  const startY = unchecked(yGrid[startGy]);

  // Initialize start node
  markVisited(startIdx);
  unchecked(gScore[startIdx] = 0.0);
  unchecked(fScore[startIdx] = Math.abs(startX - endX) + Math.abs(startY - endY));
  unchecked(parentIdx[startIdx] = -1);
  unchecked(dirArr[startIdx] = DIR_NONE);
  heapPush(startIdx);

  // Neighbor offsets: dx, dy, dir
  // left, right, up, down
  const NDX: StaticArray<i32> = [-1,  1,  0,  0];
  const NDY: StaticArray<i32> = [ 0,  0, -1,  1];
  const NDIR: StaticArray<i32> = [DIR_H, DIR_H, DIR_V, DIR_V];

  let iterations: i32 = 0;

  while (heapSize > 0 && iterations < MAX_ITERATIONS) {
    iterations++;

    const curIdx = heapPop();
    if (curIdx < 0) break;

    // Lazy deletion: skip if already closed
    if (isClosed(curIdx)) continue;

    // Goal reached
    if (curIdx == endIdx) {
      // Reconstruct path
      let pathLen: i32 = 0;
      let traceIdx = curIdx;
      while (traceIdx >= 0 && pathLen < MAX_OUTPUT) {
        const tgx = traceIdx % gridW;
        const tgy = traceIdx / gridW;
        unchecked(rawPath[pathLen * 2]     = xGrid[tgx]);
        unchecked(rawPath[pathLen * 2 + 1] = yGrid[tgy]);
        pathLen++;
        traceIdx = unchecked(parentIdx[traceIdx]);
      }

      // Reverse rawPath in place
      for (let i: i32 = 0; i < pathLen / 2; i++) {
        const j = pathLen - 1 - i;
        const tx = unchecked(rawPath[i * 2]);
        const ty = unchecked(rawPath[i * 2 + 1]);
        unchecked(rawPath[i * 2]     = rawPath[j * 2]);
        unchecked(rawPath[i * 2 + 1] = rawPath[j * 2 + 1]);
        unchecked(rawPath[j * 2]     = tx);
        unchecked(rawPath[j * 2 + 1] = ty);
      }

      return cleanPath(rawPath, pathLen);
    }

    // Mark current as closed
    markClosed(curIdx);

    const cgx = curIdx % gridW;
    const cgy = curIdx / gridW;
    const curX = unchecked(xGrid[cgx]);
    const curY = unchecked(yGrid[cgy]);
    const curDir = getDir(curIdx);
    const curG = unchecked(gScore[curIdx]);

    // Expand 4 neighbors
    for (let n: i32 = 0; n < 4; n++) {
      const dx = unchecked(NDX[n]);
      const dy = unchecked(NDY[n]);
      const ndir = unchecked(NDIR[n]);
      const nx = cgx + dx;
      const ny = cgy + dy;

      if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;

      const nIdx = ny * gridW + nx;

      // Skip if already closed
      if (isClosed(nIdx)) continue;

      // Start direction constraint
      if (curIdx == startIdx && startPosEnum != POS_NONE) {
        if (!isAllowedStartMove(startPosEnum, dx, dy)) continue;
      }

      // End approach direction constraint
      if (nIdx == endIdx && endPosEnum != POS_NONE) {
        if (!isAllowedEndMove(endPosEnum, dx, dy)) continue;
      }

      const nextX = unchecked(xGrid[nx]);
      const nextY = unchecked(yGrid[ny]);

      // Check if segment midpoint is inside an obstacle
      if (isObstacleSegment(curX, curY, nextX, nextY, obstBuf, obstCount)) continue;

      // Cost calculation
      const dist = Math.abs(nextX - curX) + Math.abs(nextY - curY);
      const turnPen: f64 = (curDir != DIR_NONE && curDir != ndir) ? TURN_PENALTY : 0.0;
      const obstPen: f64 = isInsideAny(nextX, nextY, obstBuf, obstCount) ? OBSTACLE_PENALTY : 0.0;
      // Soft-avoid running along another connector's body (collinear overlap).
      const connPen: f64 = (segCount > 0 &&
        overlapsConnector(curX, curY, nextX, nextY, segBuf, segCount)) ? CONNECTOR_PENALTY : 0.0;
      const newG = curG + dist + turnPen + obstPen + connPen;

      // Check if this path to neighbor is better
      const existingG = getG(nIdx);
      if (newG < existingG) {
        markVisited(nIdx);
        unchecked(gScore[nIdx] = newG);
        unchecked(fScore[nIdx] = newG + Math.abs(nextX - endX) + Math.abs(nextY - endY));
        unchecked(parentIdx[nIdx] = curIdx);
        unchecked(dirArr[nIdx] = ndir);
        heapPush(nIdx);
      }
    }
  }

  // A* failed — return 0 so bridge falls back to JS
  return 0;
}

/** Read output path X coordinate at index */
export function getRoutePointX(index: i32): f64 {
  if (index < 0 || index >= MAX_OUTPUT) return 0.0;
  return unchecked(pathOut[index * 2]);
}

/** Read output path Y coordinate at index */
export function getRoutePointY(index: i32): f64 {
  if (index < 0 || index >= MAX_OUTPUT) return 0.0;
  return unchecked(pathOut[index * 2 + 1]);
}
