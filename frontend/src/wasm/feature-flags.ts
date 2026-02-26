// WASM Feature Flags — opt-in per module
// Default: all off (JS+Canvas). WASM enables progressively.

export type WasmFeature =
  | 'geometry'      // Phase 1
  | 'hitTesting'    // Phase 2
  | 'routing'       // Phase 3
  | 'snapping'      // Phase 4
  | 'shapePaths'    // Phase 5
  | 'sketchEngine'  // Phase 6
  | 'batchRenderer'; // Phase 7

interface WasmFlags {
  /** Master switch — if false, all features use JS regardless of individual flags */
  enabled: boolean;
  features: Record<WasmFeature, boolean>;
}

const ALL_FEATURES: WasmFeature[] = [
  'geometry', 'hitTesting', 'routing', 'snapping',
  'shapePaths', 'sketchEngine', 'batchRenderer',
];

const flags: WasmFlags = {
  enabled: false,
  features: {
    geometry: false,
    hitTesting: false,
    routing: false,
    snapping: false,
    shapePaths: false,
    sketchEngine: false,
    batchRenderer: false,
  },
};

/** Check if a specific WASM feature is active */
export function isWasmEnabled(feature: WasmFeature): boolean {
  return flags.enabled && flags.features[feature];
}

/** Check if WASM is available at all (master switch) */
export function isWasmAvailable(): boolean {
  return flags.enabled;
}

/** Enable the master switch (called after WASM module loads successfully) */
export function enableWasm(): void {
  flags.enabled = true;
}

/** Enable a specific feature (called as each phase is validated) */
export function enableFeature(feature: WasmFeature): void {
  flags.features[feature] = true;
}

/** Disable a specific feature at runtime */
export function disableFeature(feature: WasmFeature): void {
  flags.features[feature] = false;
}

/** Disable WASM entirely */
export function disableWasm(): void {
  flags.enabled = false;
}

/** Get current state of all flags (for debugging / settings UI) */
export function getWasmFlags(): Readonly<WasmFlags> {
  return { ...flags, features: { ...flags.features } };
}

// --- Initialization from localStorage / URL params ---

function applyOverrides(): void {
  // URL param: ?wasm=off | ?wasm=on | ?wasm=geometry,hitTesting
  const params = new URLSearchParams(window.location.search);
  const wasmParam = params.get('wasm');

  if (wasmParam === 'off') {
    flags.enabled = false;
    return;
  }

  if (wasmParam === 'on') {
    // Enable all features (WASM module must still load successfully)
    ALL_FEATURES.forEach(f => { flags.features[f] = true; });
    return;
  }

  if (wasmParam) {
    // Enable only specific features: ?wasm=geometry,hitTesting
    const requested = wasmParam.split(',').map(s => s.trim()) as WasmFeature[];
    ALL_FEATURES.forEach(f => { flags.features[f] = false; });
    requested.forEach(f => {
      if (f in flags.features) flags.features[f] = true;
    });
    return;
  }

  // localStorage: yappy-wasm-disable=sketchEngine,batchRenderer
  const disabled = localStorage.getItem('yappy-wasm-disable');
  if (disabled) {
    disabled.split(',').map(s => s.trim()).forEach(f => {
      if (f in flags.features) flags.features[f as WasmFeature] = false;
    });
  }

  // localStorage: yappy-wasm=off (master kill switch)
  if (localStorage.getItem('yappy-wasm') === 'off') {
    flags.enabled = false;
  }
}

// Apply overrides on module load
try {
  applyOverrides();
} catch {
  // SSR or test environment — no window/localStorage
}
