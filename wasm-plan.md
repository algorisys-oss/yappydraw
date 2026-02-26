# YappyDraw Incremental WASM Adoption via AssemblyScript

## Context

YappyDraw is a SolidJS + TypeScript + Canvas 2D drawing app (274 TS files, 150+ shape types, 29+ renderers). As diagrams grow beyond 200-500 elements, performance-critical paths (hit testing on every mouse move, O(n^2) snapping, A* routing, sketch rendering via RoughJS) become bottlenecks.

WASM via AssemblyScript provides 2-10x speedups for numeric computation while keeping the codebase in TypeScript-like syntax. The existing `IRenderer` abstraction already decouples rendering from Canvas 2D, making incremental migration safe.

**No Rust needed** — AssemblyScript is the sole WASM toolchain.

---

## Phase 0: Foundation (Infrastructure)

**Goal:** Build pipeline, WASM loader, feature flags, memory pool — verified with a trivial function.

**New files:**
```
frontend/src/wasm/
  assemblyscript/
    assembly/
      index.ts          # Entry point, re-exports all modules
      types.ts           # Shared AS types (Point as f64 pairs)
      tsconfig.json      # AS-specific tsconfig
    asconfig.json        # AS compiler config
  bridge/
    wasm-loader.ts       # Async WASM module loading
    memory-pool.ts       # Float64Array pool for JS<->WASM data transfer
  feature-flags.ts       # Runtime toggle per feature (localStorage override)
  vite-plugin-as.ts      # Vite plugin: watches assembly/, runs asc, outputs .wasm
```

**Modified files:**
- `vite.config.ts` — add assemblyScriptPlugin(), add `wasm-bridge` manual chunk
- `package.json` — add `assemblyscript`, `@assemblyscript/loader` as devDependencies

**Key design decisions:**
- **Data interchange:** Flat `Float64Array` in shared WASM memory. Points as interleaved `[x0, y0, x1, y1, ...]`. No JS object marshalling.
- **Feature flags:** Each phase has an independent flag. WASM loads async; JS fallback runs until ready. Debug override via `localStorage.setItem('yappy-wasm-disable', 'geometry,hitTesting')`.
- **Vite plugin:** Watches `assembly/**/*.ts`, runs `asc` on change, outputs to `wasm/build/` (gitignored). HMR-compatible.

**Verification:** `add(a: f64, b: f64): f64` function loads and executes in browser console.

---

## Phase 1: Geometry Core

**Goal:** Port pure math functions from `frontend/src/utils/geometry.ts` to AssemblyScript.

**Functions to port (10 functions, ~170 lines of math):**

| Function | Signature | Notes |
|----------|-----------|-------|
| `isPointInPolygon` | `(px, py, polygonPtr, count) → i32` | Ray casting algorithm |
| `distanceToSegment` | `(px, py, ax, ay, bx, by) → f64` | Perpendicular projection |
| `cubicBezier` | `(p0, p1, p2, p3, t) → f64` | Parametric evaluation |
| `cubicBezierAngle` | `(8 x f64, t) → f64` | Tangent angle via derivative |
| `getOrganicBranchPolygon` | `(paramsPtr) → pointsPtr` | Bezier stroke outline, returns Point[] |
| `getBezierPoints` | `(8 x f64, segments) → pointsPtr` | Discretize bezier to point array |
| `isPointOnPolyline` | `(px, py, pointsPtr, count, threshold) → i32` | Loop + distanceToSegment |
| `isPointInEllipse` | `(px, py, cx, cy, w, h, threshold) → i32` | Normalized ellipse equation |
| `isPointNearEllipseStroke` | `(px, py, cx, cy, w, h, sw, threshold) → i32` | Stroke-aware ellipse test |
| `rotatePoint` | `(x, y, cx, cy, angle) → [f64, f64]` | cos/sin rotation |

**New files:**
- `assembly/geometry.ts` — AssemblyScript implementations
- `bridge/geometry-bridge.ts` — JS wrappers that marshal data and call WASM

**Modified file:**
- `frontend/src/utils/geometry.ts` — Add 3-line WASM guard at top of each function:
  ```ts
  if (isWasmEnabled('geometry')) return wasmGeometry.isPointInPolygon(p, polygon);
  // ... original JS code unchanged below ...
  ```

---

## Phase 2: Hit Testing (Highest Performance Impact)

**Goal:** Batch hit testing — test one point against ALL elements in a single WASM call.

**Why batch matters:** Currently `hitTestElement()` is called per-element on every mouse move. 500 individual JS→WASM calls would negate WASM gains. Instead:

1. **On element change:** Sync all element bounding data to WASM as a flat array:
   `[x, y, width, height, angle, shapeTypeEnum]` per element = 6 x f64 = 48 bytes each
2. **On mouse move:** One WASM call: `batchHitTest(px, py, threshold) → hitIndex`
3. **JS post-filter:** Apply `isElementHiddenByHierarchy()` (needs string IDs, stays in JS)

**New files:**
- `assembly/hit-testing.ts` — Broad phase (AABB) + narrow phase (shape-specific) for all elements
- `bridge/hit-testing-bridge.ts` — `syncElementsToWasm()` + `batchHitTest()`

**Modified files:**
- `frontend/src/utils/hit-testing.ts` — WASM guard with JS fallback
- `frontend/src/components/canvas.tsx` — Call `syncElementsToWasm()` when elements change

**Expected: 3-5x speedup for mouse-move with 200+ elements.**

---

## Phase 3: A* Path Routing

**Goal:** Port `calculateSmartElbowRoute()` from `frontend/src/utils/routing.ts` to WASM.

**Why high-value:** A* uses `Set<string>` for closed set (expensive JS GC pressure), up to 800 iterations. WASM replaces with a flat boolean grid indexed by `gx * maxY + gy` — zero allocation.

**Data flow:**
- Input: obstacles as `[x, y, w, h]` flat array + start/end points + position enums
- Output: path as Point[] via shared memory buffer

**New files:**
- `assembly/routing.ts` — Grid construction + A* with min-heap + boolean closed set
- `bridge/routing-bridge.ts` — Serialize obstacles, deserialize path

**Modified file:**
- `frontend/src/utils/routing.ts` — WASM guard

**Expected: 5-10x speedup for complex connector routing.**

---

## Phase 4: Object Snapping

**Goal:** Port `getSnappingGuides()` from `frontend/src/utils/object-snapping.ts` to WASM.

**Current bottleneck:** O(n^2) comparison — active elements' 3 snap lines vs all other elements' 3 snap lines, two passes.

**WASM approach:** Pre-serialize all elements as `[x, y, w, h, layerEnum]`, run both passes in WASM, return `dx, dy` + guide array.

**New files:**
- `assembly/snapping.ts`
- `bridge/snapping-bridge.ts`

**Modified file:**
- `frontend/src/utils/object-snapping.ts` — WASM guard

**Expected: 2-4x speedup during drag with 200+ elements.**

---

## Phase 5: Shape Path Generation

**Goal:** Port shape geometry definitions from `frontend/src/utils/shape-geometry.ts` (1764 lines, 150+ shapes) to WASM.

**Strategy:** Start with the 20 most common shapes (rectangle, circle, triangle, diamond, hexagon, star, etc.). Uncommon shapes fall back to JS. WASM function: `(shapeTypeEnum, width, height, ...params) → pointsPtr`.

**New files:**
- `assembly/shape-paths.ts`
- `bridge/shape-paths-bridge.ts`

**Modified file:**
- `frontend/src/utils/shape-geometry.ts` — WASM guard per shape type

---

## Phase 6: Sketch Engine (RoughJS Replacement)

**Goal:** Replace RoughJS with a WASM-based hand-drawn path generator.

**How it works:**
1. WASM generates Canvas path commands as a flat buffer: `[cmdType, ...params]`
   - `MOVE_TO(0, x, y)`, `LINE_TO(1, x, y)`, `BEZIER_TO(2, cp1x, cp1y, cp2x, cp2y, x, y)`, etc.
2. JS reads the buffer and executes commands on `IRenderer` — preserving the abstraction

**RoughJS algorithms to reimplement in AS:**
- Jittered double-line strokes (core hand-drawn effect)
- Seed-based PRNG (deterministic appearance)
- Hachure fill (parallel lines at angle)
- Cross-hatch fill (two hachure passes)
- Zigzag fill

**Integration pattern:**
- Create `WasmSketchCanvas` class matching RoughCanvas API surface
- Feature flag switches between `RoughCanvas` and `WasmSketchCanvas` in `frontend/src/utils/render-element.ts`
- Cache command buffers by element hash (matching existing `frontend/src/utils/rough-cache.ts` pattern)

**New files:**
- `assembly/sketch-engine.ts` — Path generation with jitter + fill patterns
- `bridge/sketch-bridge.ts` — Command buffer executor + `WasmSketchCanvas` class

**Modified files:**
- `frontend/src/utils/render-element.ts` — Feature flag for rc source
- 31 shape renderer files — No changes needed (they call `rc.rectangle()` etc., which `WasmSketchCanvas` implements)

**Result:** Eliminates ~70KB RoughJS dependency. 2-3x faster sketch rendering.

---

## Phase 7: Batch Rendering Pipeline

**Goal:** Batch all visible elements' rendering into a single WASM call per frame.

**Current:** N elements = N WASM calls per frame.
**Batched:** Write all element geometry into one buffer → one WASM call → one command buffer out → JS executes all commands.

**New files:**
- `assembly/batch-renderer.ts`
- `bridge/batch-bridge.ts`

**Modified file:**
- `frontend/src/utils/canvas-renderer.ts` — Batch render path with WASM guard

---

## Testing Strategy

**For every phase:**

1. **Parity tests:** WASM output must match JS output for identical inputs across edge cases
2. **Performance benchmarks:** WASM must be >2x faster for batch operations
3. **Integration:** Run existing Playwright E2E tests with WASM enabled — zero regressions
4. **Visual diffing (Phase 6):** Screenshot comparison between RoughJS and WASM sketch rendering

**Test infrastructure:** Vitest for unit/parity tests. AS compiles to a Node-compatible module for test runners.

---

## Summary

| Phase | Scope | Effort | Perf Win | Risk |
|-------|-------|--------|----------|------|
| 0 | Foundation | 1-2 days | None (infra) | Low |
| 1 | Geometry | 3-4 days | Foundation | Low |
| 2 | Hit Testing | 3-4 days | 3-5x mouse-move | Low |
| 3 | A* Routing | 2-3 days | 5-10x routing | Low |
| 4 | Snapping | 2-3 days | 2-4x drag | Low |
| 5 | Shape Paths | 4-5 days | Faster morphs | Medium |
| 6 | Sketch Engine | 8-10 days | Eliminates RoughJS | High |
| 7 | Batch Render | 5-6 days | O(1) WASM/frame | Medium |

**Each phase is independently shippable.** JS fallback always works. Recommended: ship Phases 0-4 first for maximum ROI with minimum risk.
