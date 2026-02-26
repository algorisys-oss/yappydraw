// Async WASM module loader
// Loads the compiled .wasm file and returns typed exports.

import { enableWasm, enableFeature, type WasmFeature } from '../feature-flags';

/** Typed exports from the AssemblyScript WASM module */
export interface WasmExports {
  memory: WebAssembly.Memory;

  // Phase 0: verification
  add(a: number, b: number): number;

  // Phase 1+ exports will be added here as modules are ported:
  // isPointInPolygon(px: number, py: number, bufPtr: number, count: number): number;
  // distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number;

  // AssemblyScript runtime helpers (exported via exportRuntime)
  __new(size: number, id: number): number;
  __pin(ptr: number): number;
  __unpin(ptr: number): void;
  __collect(): void;
}

let wasmExports: WasmExports | null = null;
let loadPromise: Promise<WasmExports | null> | null = null;

/** Get the loaded WASM exports, or null if not yet loaded / failed */
export function getWasmExports(): WasmExports | null {
  return wasmExports;
}

/**
 * Load the WASM module asynchronously.
 * Safe to call multiple times — returns cached result.
 * On failure, returns null and WASM stays disabled (JS fallback).
 */
export async function loadWasmModule(): Promise<WasmExports | null> {
  if (wasmExports) return wasmExports;
  if (loadPromise) return loadPromise;

  loadPromise = doLoad();
  return loadPromise;
}

async function doLoad(): Promise<WasmExports | null> {
  try {
    // Vite handles .wasm imports — the URL is resolved at build time
    const wasmUrl = new URL('../build/yappy-wasm.wasm', import.meta.url).href;
    const response = await fetch(wasmUrl);

    if (!response.ok) {
      console.warn(`[WASM] Failed to fetch module: ${response.status}`);
      return null;
    }

    const wasmBuffer = await response.arrayBuffer();

    const { instance } = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        abort(_msgPtr: number, _filePtr: number, line: number, col: number) {
          console.error(`[WASM] abort at ${line}:${col}`);
        },
      },
    });

    wasmExports = instance.exports as unknown as WasmExports;

    // Verify with trivial function
    const result = wasmExports.add(1, 2);
    if (result !== 3) {
      console.error(`[WASM] Verification failed: add(1,2) = ${result}`);
      wasmExports = null;
      return null;
    }

    // Master switch ON
    enableWasm();
    console.log('[WASM] Module loaded and verified');

    // Enable features that have been ported
    const availableFeatures: WasmFeature[] = detectAvailableFeatures(wasmExports);
    availableFeatures.forEach(f => enableFeature(f));

    if (availableFeatures.length > 0) {
      console.log(`[WASM] Enabled features: ${availableFeatures.join(', ')}`);
    }

    return wasmExports;
  } catch (err) {
    console.warn('[WASM] Module load failed, using JS fallback:', err);
    wasmExports = null;
    return null;
  }
}

/** Detect which WASM features are available based on exported functions */
function detectAvailableFeatures(exports: WasmExports): WasmFeature[] {
  const features: WasmFeature[] = [];

  // Phase 1: geometry — check for isPointInPolygon export
  if (typeof (exports as any).isPointInPolygon === 'function') {
    features.push('geometry');
  }

  // Phase 2: hitTesting — check for hitTestSingle export
  if (typeof (exports as any).hitTestSingle === 'function') {
    features.push('hitTesting');
  }

  // Phase 3: routing
  if (typeof (exports as any).calculateSmartElbowRoute === 'function') {
    features.push('routing');
  }

  // Phase 4: snapping
  if (typeof (exports as any).computeSnappingGuides === 'function') {
    features.push('snapping');
  }

  // Phase 5: shapePaths
  if (typeof (exports as any).computeShapePath === 'function') {
    features.push('shapePaths');
  }

  // Phase 6: sketchEngine
  if (typeof (exports as any).sketchRectangle === 'function') {
    features.push('sketchEngine');
  }

  // Phase 7: batchRenderer
  if (typeof (exports as any).batchViewportCull === 'function') {
    features.push('batchRenderer');
  }

  return features;
}
