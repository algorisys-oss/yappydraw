# WASM Implementation — AssemblyScript Acceleration

## Overview

YappyDraw uses WebAssembly (via AssemblyScript) to accelerate performance-critical paths: geometry math, hit testing, pathfinding, snapping, shape generation, sketch rendering, and batch viewport culling. The implementation follows an incremental 8-phase plan (Phase 0-7) where each phase is independently shippable with automatic JS fallback.

**No Rust needed** — AssemblyScript (TypeScript-like syntax) is the sole WASM toolchain.

## Architecture

```
┌─────────────────────────────────────┐
│  Application Code (SolidJS + TS)    │
│  canvas.tsx, hit-testing.ts, etc.   │
├─────────────────────────────────────┤
│  Feature Flags (feature-flags.ts)   │  ← isWasmEnabled('geometry')
├─────────────────────────────────────┤
│  JS Bridge Layer (bridge/*.ts)      │  ← Marshal data, call WASM, read results
├─────────────────────────────────────┤
│  Memory Pool (memory-pool.ts)       │  ← Shared Float64Array buffers
├─────────────────────────────────────┤
│  WASM Module (assembly/*.ts → .wasm)│  ← AssemblyScript compiled to WASM
└─────────────────────────────────────┘
```

### Data Interchange

- **Flat `Float64Array`** in shared WASM memory — no JS object marshalling
- **Points** as interleaved pairs: `[x0, y0, x1, y1, ...]`
- **Elements** as 6-field stride: `[x, y, w, h, angle, typeEnum]`
- **Results** read via exported accessor functions (e.g., `getRoutePointX(i)`)

### Feature Flags

Each phase has an independent runtime flag. WASM loads async; JS fallback runs until ready.

```typescript
type WasmFeature =
  | 'geometry'      // Phase 1
  | 'hitTesting'    // Phase 2
  | 'routing'       // Phase 3
  | 'snapping'      // Phase 4
  | 'shapePaths'    // Phase 5
  | 'sketchEngine'  // Phase 6
  | 'batchRenderer' // Phase 7
```

**Control methods:**
- URL param: `?wasm=off | ?wasm=on | ?wasm=geometry,hitTesting`
- localStorage: `yappy-wasm=off` (master kill switch)
- localStorage: `yappy-wasm-disable=sketchEngine,batchRenderer` (per-feature)

### Loading Flow

1. Fetch `yappy-wasm.wasm` asynchronously
2. Instantiate with `WebAssembly.instantiate()`
3. Verify with `add(1, 2) === 3`
4. Enable master switch
5. Detect available features by checking exported function names
6. Enable each detected feature flag

If loading fails at any step, WASM stays disabled and all code paths use JS fallback.

## File Structure

```
frontend/src/wasm/
  feature-flags.ts              # Runtime toggle per feature
  vite-plugin-as.ts             # Vite plugin: watches assembly/, runs asc, HMR
  assemblyscript/
    asconfig.json               # AS compiler config (debug/release targets)
    assembly/
      tsconfig.json             # AS-specific tsconfig (extends assemblyscript/std)
      index.ts                  # Entry point, re-exports all phases
      types.ts                  # Shared utility functions
      geometry.ts               # Phase 1: 11 geometry functions
      hit-testing.ts            # Phase 2: Broad + narrow phase hit testing
      routing.ts                # Phase 3: A* pathfinding with min-heap
      snapping.ts               # Phase 4: Two-pass snapping guides
      shape-paths.ts            # Phase 5: 23 shape type generators
      sketch-engine.ts          # Phase 6: Hand-drawn effect generator
      batch-renderer.ts         # Phase 7: Viewport culling + batch shapes
  bridge/
    wasm-loader.ts              # Async WASM module loader + feature detection
    memory-pool.ts              # Float64Array pool for JS<->WASM transfer
    geometry-bridge.ts          # Phase 1 JS wrappers
    hit-testing-bridge.ts       # Phase 2 batch hit test coordination
    routing-bridge.ts           # Phase 3 route computation wrapper
    snapping-bridge.ts          # Phase 4 snapping guide computation
    shape-paths-bridge.ts       # Phase 5 shape path generation
    sketch-engine-bridge.ts     # Phase 6 command buffer parser
    batch-renderer-bridge.ts    # Phase 7 viewport cull + batch rendering
  build/                        # Compiled output (gitignored)
    yappy-wasm.wasm             # Compiled binary
    yappy-wasm.js               # Glue code
    yappy-wasm.d.ts             # Type definitions
    yappy-wasm.wat              # WebAssembly text format
    yappy-wasm.wasm.map         # Source map
```

## Phase Details

### Phase 0: Foundation

**Goal:** Build pipeline, WASM loader, feature flags, memory pool.

- Vite plugin watches `assembly/**/*.ts`, runs `asc` on change
- HMR-compatible: recompiles on source change during `vite dev`
- Memory pool allocates 3 shared buffers: point buffer (4096 points), result buffer, element buffer (2048 elements)
- Verified with trivial `add(a, b)` function

### Phase 1: Geometry Core

**Goal:** Port pure math functions from `utils/geometry.ts` to WASM.

**11 functions ported:**
| Function | Algorithm |
|----------|-----------|
| `isPointInPolygon` | Ray casting |
| `distanceToSegment` | Perpendicular projection |
| `cubicBezier` | Parametric evaluation |
| `cubicBezierAngle` | Tangent via derivative |
| `rotatePoint` | cos/sin rotation |
| `isPointInEllipse` | Normalized ellipse equation |
| `isPointNearEllipseStroke` | Stroke-aware ellipse test |
| `isPointOnPolyline` | Loop + distanceToSegment |
| `isPointOnBezier` | Discretize + distance check |
| `getBezierPoints` | Discretize bezier to point array |
| `getOrganicBranchPolygon` | Bezier stroke outline |

**Integration:** 3-line WASM guard at top of each function in `geometry.ts`:
```typescript
if (isWasmEnabled('geometry')) return wasmGeometry.isPointInPolygon(p, polygon);
```

### Phase 2: Hit Testing

**Goal:** Batch hit testing — test one point against ALL elements in a single WASM call.

**Architecture:**
1. Broad phase: AABB check with rotation-aware point unrotation
2. Narrow phase: Shape-specific (BBOX, DIAMOND, ELLIPSE, COMPLEX)
3. Returns: `0` (miss), `1` (confirmed hit), `2` (needs JS narrow phase for complex shapes)

**Batch mode:** `batchBroadPhase(px, py, threshold, elemBufPtr, count)` tests all elements at once, returns candidate indices.

**Expected: 3-5x speedup for mouse-move with 200+ elements.**

### Phase 3: A* Path Routing

**Goal:** Port `calculateSmartElbowRoute()` for obstacle-avoiding orthogonal connector paths.

**Key optimizations over JS:**
- Generation-based lazy reset (no array clearing between calls)
- Binary min-heap for open set (vs JS array)
- Closed set encoded as sign bit in direction array (no separate allocation)
- Boolean grid indexed by `gx * maxY + gy` (vs JS `Set<string>`)

**Expected: 5-10x speedup for complex connector routing.**

### Phase 4: Object Snapping

**Goal:** Port `getSnappingGuides()` — O(n^2) comparison of snap lines.

**Two-pass algorithm:**
1. Find best X/Y deltas (which snap lines are closest)
2. Collect all matching guides at those deltas

**Expected: 2-4x speedup during drag with 200+ elements.**

### Phase 5: Shape Path Generation

**Goal:** Port shape geometry for 23 polygon-based shape types.

**Supported shapes:** triangle, diamond, rightTriangle, parallelogram, trapezoid, stickyNote, hexagon, pentagon, septagon, octagon, polygon (N-sided), star, burst, burstBlob, arrowLeft/Right/Up/Down, umlSignalSend/Receive, checkmark, bracketLeft/Right.

Unsupported shapes fall back to JS (returns 0 point count).

### Phase 6: Sketch Engine (RoughJS Replacement)

**Goal:** Replace RoughJS generator's math-heavy code with WASM for cache-miss scenarios.

**Core algorithms ported:**
- **Park-Miller LCG PRNG** — Matches RoughJS exactly for seed-deterministic parity
- **Jittered double-line** — 2 cubic Bezier curves per line segment with PRNG-based control point offsets
- **Hachure fill** — Scan-line algorithm with edge table, active-edge intersection, rotation
- **Ellipse generation** — Iterative angular walk with radial/angular jitter

**Supported methods:** `rectangle`, `ellipse`, `circle`, `polygon`, `line`, `linearPath`

**Fill styles:** solid, hachure, cross-hatch, zigzag

**Output format:** Flat `Float64Array` command buffer:
```
[OPSET_HEADER(-1), opSetType, OP_MOVE(0), x, y, OP_BCURVE(1), cp1x, cp1y, cp2x, cp2y, x, y, ..., END_MARKER(-2)]
```

Bridge parses this into RoughJS-compatible `Drawable` objects — existing `draw()` and cache infrastructure unchanged.

**Integration point:** Cache proxy in `rough-cache.ts` — WASM gate in cache-miss path.

**Result: 2-3x faster sketch rendering. Potential to eliminate ~70KB RoughJS dependency.**

### Phase 7: Batch Rendering Optimizations

**Goal:** Reduce per-frame overhead via batch viewport culling and renderer reuse.

**Three optimizations:**

1. **Batch viewport culling in WASM** — Single WASM call tests all elements against viewport bounds (sub-pixel skip + AABB). Replaces per-element JS AABB checks. JS-only filters (hierarchy, collapsed lanes, bindings) run as post-filter on the smaller surviving set.

2. **CanvasRenderer instance reuse** — Single `CanvasRenderer` created per frame instead of `new CanvasRenderer(ctx)` per element. Reduces GC pressure.

3. **Batch shape path pre-computation** — Compute multiple shape paths in one WASM call, writing results sequentially to shared buffer.

**Additional optimization:** Viewport check moved before expensive hierarchy/binding filters (previously ran after), reducing work on off-screen elements regardless of WASM.

## Compiler Configuration

```json
{
  "targets": {
    "debug": { "sourceMap": true, "debug": true },
    "release": { "optimizeLevel": 3, "shrinkLevel": 1 }
  },
  "options": {
    "bindings": "raw",
    "exportRuntime": true
  },
  "entries": ["assembly/index.ts"]
}
```

- `exportRuntime: true` — Exports `__new`, `__pin`, `__unpin`, `__collect` for memory management
- `bindings: raw` — Raw WASM exports without loader overhead
- Release build: O3 optimization, shrink level 1

## TypeScript Integration

The `assembly/` directory is excluded from the main TypeScript compilation (`tsconfig.app.json`) because AssemblyScript uses types (`f64`, `i32`, `usize`, `unchecked`, `changetype`) that don't exist in TypeScript. The AS compiler uses its own `assembly/tsconfig.json` extending `assemblyscript/std/assembly.json`.

## Testing Strategy

1. **Parity tests:** WASM output must match JS output for identical inputs
2. **Performance benchmarks:** WASM must be >2x faster for batch operations
3. **Integration:** Existing Playwright E2E tests run with WASM enabled — zero regressions
4. **Visual diffing (Phase 6):** Screenshot comparison between RoughJS and WASM sketch rendering
5. **Feature flag testing:** `?wasm=off` vs `?wasm=on` must produce identical visual output

## Performance Summary

| Phase | Scope | Expected Speedup |
|-------|-------|-----------------|
| 1 | Geometry | Foundation (enables other phases) |
| 2 | Hit Testing | 3-5x mouse-move with 200+ elements |
| 3 | A* Routing | 5-10x for complex connector routing |
| 4 | Snapping | 2-4x during drag with 200+ elements |
| 5 | Shape Paths | Faster shape morphing transitions |
| 6 | Sketch Engine | 2-3x sketch rendering + eliminates RoughJS |
| 7 | Batch Renderer | Reduced per-frame overhead |

## Dependencies

- `assemblyscript@0.28.9` (devDependency)
- `@assemblyscript/loader@0.28.9` (devDependency)
