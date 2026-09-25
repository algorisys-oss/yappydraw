/**
 * doodles — seeded, knob-driven pattern generators (Truchet, flow fields, contour maps…).
 *
 * Pure geometry, like `mandala.ts`: a spec in, path layers out. No store, no DOM, so it
 * unit-tests directly and one builder serves the dialog preview, `Yappy.createDoodle`
 * and re-editing a doodle already on the canvas.
 *
 * Two decisions shape everything here:
 *
 *  1. **Same seed + same params + same region = the same doodle.** All randomness comes
 *     from the spec's seed, so a doodle can be stored as its spec and rebuilt later.
 *  2. **Output is grouped by colour role, not by shape.** A Truchet page is ~2,000 arcs;
 *     as separate elements that is 2,000 undo-snapshot-sized objects to hit-test and
 *     render. Instead each role (fill1, fill2, ink, inkBold) is one multi-subpath layer,
 *     and short pieces are chained into long continuous lines first — so a doodle is a
 *     handful of elements whatever its density, and each role is one recolour.
 *
 * A generator is data (`params` schema) plus a `build` function; the dialog renders its
 * controls from the schema, so adding a generator touches only this folder.
 */
import type { PathSubpath, DoodlePalette } from '../../types';
import { makeRng, type Rng } from './rng';
import { buildTruchet } from './truchet';
import { buildFlowField } from './flow-field';
import { buildTopography } from './topography';

/** Back-to-front draw order is the order generators emit layers in. */
export type DoodleRole = 'paper' | 'fill1' | 'fill2' | 'ink' | 'inkBold';

export type DoodleKind = 'truchet' | 'flowField' | 'topography';

export type DoodleParamValue = number | string | boolean;
export type DoodleParams = Record<string, DoodleParamValue>;

export interface DoodleRegion { x: number; y: number; width: number; height: number }

export interface DoodleSpec extends DoodleRegion {
    kind: DoodleKind;
    seed: number;
    params: DoodleParams;
}

export interface DoodleLayer {
    role: DoodleRole;
    subpaths: PathSubpath[];
    /** Upper bound on sketch roughness for this layer. rough.js wobbles by a couple of
     *  pixels whatever the shape's size, which turns a 3px dot into a ragged wedge. */
    maxRoughness?: number;
}

export type DoodleParamDef =
    | { key: string; label: string; type: 'range'; min: number; max: number; step: number; default: number; hint?: string }
    | { key: string; label: string; type: 'choice'; options: { value: string; label: string }[]; default: string; hint?: string }
    | { key: string; label: string; type: 'toggle'; default: boolean; hint?: string };

export interface DoodleGenerator {
    id: DoodleKind;
    name: string;
    hint: string;
    tags: string[];
    params: DoodleParamDef[];
    build: (region: DoodleRegion, params: DoodleParams, rng: Rng) => DoodleLayer[];
}

export const DOODLE_GENERATORS: DoodleGenerator[] = [
    {
        id: 'truchet', name: 'Truchet', hint: 'Randomly turned arc tiles that weave into long lines',
        tags: ['maze', 'curvy', 'geometric'],
        params: [
            { key: 'tileSize', label: 'Tile size', type: 'range', min: 16, max: 120, step: 1, default: 38 },
            { key: 'lines', label: 'Lines per tile', type: 'range', min: 1, max: 5, step: 1, default: 3 },
            {
                key: 'style', label: 'Style', type: 'choice', default: 'arcs',
                options: [{ value: 'arcs', label: 'Arcs' }, { value: 'mixed', label: 'Mixed' }, { value: 'diagonal', label: 'Diagonal' }],
            },
            { key: 'shade', label: 'Shade corners', type: 'toggle', default: true, hint: 'Fill the innermost corner of each tile' },
        ],
        build: buildTruchet,
    },
    {
        id: 'flowField', name: 'Flow Field', hint: 'Evenly spaced lines following a smooth current',
        tags: ['organic', 'lines', 'waves'],
        params: [
            { key: 'spacing', label: 'Spacing', type: 'range', min: 8, max: 48, step: 1, default: 16 },
            { key: 'length', label: 'Line length', type: 'range', min: 30, max: 800, step: 10, default: 260 },
            { key: 'curl', label: 'Curl', type: 'range', min: 0.5, max: 6, step: 0.1, default: 2.2, hint: 'How many swirls fit across the page' },
            { key: 'dots', label: 'Dot at each start', type: 'toggle', default: false },
        ],
        build: buildFlowField,
    },
    {
        id: 'topography', name: 'Topography', hint: 'Contour lines of an imaginary landscape',
        tags: ['organic', 'lines', 'landscape'],
        params: [
            { key: 'levels', label: 'Contours', type: 'range', min: 3, max: 40, step: 1, default: 14 },
            { key: 'scale', label: 'Hill size', type: 'range', min: 40, max: 800, step: 10, default: 260 },
            { key: 'detail', label: 'Detail', type: 'range', min: 1, max: 5, step: 1, default: 3 },
            { key: 'indexEvery', label: 'Bold every', type: 'range', min: 0, max: 10, step: 1, default: 5, hint: 'Every Nth contour drawn heavier; 0 for none' },
        ],
        build: buildTopography,
    },
];

export const getDoodleGenerator = (id: string): DoodleGenerator | undefined =>
    DOODLE_GENERATORS.find(g => g.id === id);

/**
 * Validate params against a generator's schema: unknown keys dropped, ranges clamped and
 * snapped to their step, bad choices and non-values replaced by the default. The API and
 * stored specs both pass through here, so a hand-written or older spec can't produce NaN
 * geometry or a hang (a 0.001px tile would be millions of tiles).
 */
export function resolveDoodleParams(gen: DoodleGenerator, params: Partial<DoodleParams> = {}): DoodleParams {
    const out: DoodleParams = {};
    for (const def of gen.params) {
        const v = params[def.key];
        if (def.type === 'range') {
            const n = typeof v === 'number' && Number.isFinite(v) ? v : def.default;
            const snapped = Math.round((n - def.min) / def.step) * def.step + def.min;
            out[def.key] = Math.min(def.max, Math.max(def.min, +snapped.toFixed(6)));
        } else if (def.type === 'choice') {
            out[def.key] = typeof v === 'string' && def.options.some(o => o.value === v) ? v : def.default;
        } else {
            out[def.key] = typeof v === 'boolean' ? v : def.default;
        }
    }
    return out;
}

export function defaultDoodleParams(kind: DoodleKind): DoodleParams {
    const g = getDoodleGenerator(kind);
    return g ? resolveDoodleParams(g) : {};
}

/** Build a doodle's layers (back to front). Empty layers are dropped. */
export function buildDoodle(spec: DoodleSpec): DoodleLayer[] {
    const gen = getDoodleGenerator(spec.kind);
    const { x, y, width, height } = spec;
    if (!gen || ![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return [];
    const layers = gen.build({ x, y, width, height }, resolveDoodleParams(gen, spec.params), makeRng(spec.seed));
    return layers.filter(l => l.subpaths.length > 0);
}

/**
 * Colours a new doodle starts with. Lives here, not in `api.ts`: the Doodle dialog reads it
 * while its module is loading, and `api.ts` is in an import cycle with the menus that load
 * that dialog — in the SDK bundle the dialog evaluated first and hit the constant before
 * `api.ts` had defined it (a TDZ ReferenceError that broke the whole SDK). This module
 * imports nothing from the app, so it is always initialised first.
 */
export const DEFAULT_DOODLE_PALETTE: DoodlePalette = {
    paper: 'transparent', ink: '#1f2937', fill1: '#f97362', fill2: '#fbbf24',
};

/** A fresh random seed in rough.js's positive 31-bit range. */
export const randomDoodleSeed = () => 1 + Math.floor(Math.random() * 999_999);
