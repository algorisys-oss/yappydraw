/**
 * Faces that change over time: expression keys, blinking and a talking mouth.
 *
 * Everything here is a pure function of time, like the motion clips. The renderer asks
 * "what does this face look like at t?" every frame, so an offline export gets the same
 * blink on the same frame every time, and scrubbing the scene timeline shows the face
 * that belongs at the playhead. Nothing is scheduled and nothing is remembered.
 */
import {
    asFaceStyle, mergeFaceParts, facePartsOf, faceRecipe,
    type FaceStyle, type FaceParts, type EyeStyle, type MouthStyle, type BrowStyle, type AccentStyle,
} from '../face';

/** An expression change at scene time `t` (seconds). Omitted fields keep the figure's own. */
export interface FaceKey {
    t: number;
    face?: FaceStyle;
    eyes?: EyeStyle | 'auto';
    brows?: BrowStyle | 'auto';
    mouth?: MouthStyle | 'auto';
    accent?: AccentStyle | 'auto';
}

/** When the mouth moves on its own. `auto` = while the figure plays the Talk motion. */
export type TalkMode = 'auto' | 'on' | 'off';

export interface LiveFace extends FaceParts { face: FaceStyle }

/** Deterministic noise in [0, 1) from two numbers. */
function hash(a: number, b: number): number {
    const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return x - Math.floor(x);
}

/** Clean up keys from a payload or the API: finite times ≥ 0, known names, sorted. */
export function normalizeFaceKeys(keys: unknown): FaceKey[] {
    if (!Array.isArray(keys)) return [];
    const out: FaceKey[] = [];
    for (const k of keys) {
        if (!k || typeof k !== 'object' || !Number.isFinite((k as any).t)) continue;
        const src = k as Record<string, unknown>;
        const key: FaceKey = { t: Math.max(0, src.t as number) };
        if (src.face !== undefined) key.face = asFaceStyle(src.face);
        const parts = facePartsOf(src);
        for (const p of ['eyes', 'brows', 'mouth', 'accent'] as const) {
            if (src[p] !== undefined) (key as any)[p] = parts[p];
        }
        out.push(key);
    }
    return out.sort((a, b) => a.t - b.t);
}

/** The key in effect at `t`: the last one at or before it (keys are steps, not tweens). */
export function faceKeyAt(keys: FaceKey[] | undefined, t: number): FaceKey | null {
    if (!keys?.length) return null;
    let hit: FaceKey | null = null;
    for (const k of keys) { if (k.t <= t + 1e-9) hit = k; else break; }
    return hit;
}

/** Eyes that are open, and so can blink. Hearts, crosses and already-shut eyes can't. */
const BLINKABLE = new Set<string>(['dot', 'wide', 'half', 'lookLeft', 'lookRight', 'lookUp', 'wink']);
const BLINK_LEN = 0.13;

/**
 * Is a figure mid-blink at `t`? Each figure gets its own period (3–4.6 s, from `seed`) and a
 * jittered moment inside every period, sometimes a double blink, so a crowd never blinks
 * in unison and nobody blinks like a metronome.
 */
export function blinkAt(t: number, seed: number): boolean {
    if (!Number.isFinite(t) || t < 0) return false;
    const period = 3 + 1.6 * hash(seed, 0.5);
    const k = Math.floor(t / period);
    const start = k * period + period * (0.15 + 0.6 * hash(seed, k + 1));
    if (t >= start && t < start + BLINK_LEN) return true;
    const double = hash(seed + 7, k + 1) < 0.25;
    return double && t >= start + 2 * BLINK_LEN && t < start + 3 * BLINK_LEN;
}

const SYLLABLE = 0.12, PHRASE = 2.6, PAUSE = 0.5;

/**
 * The mouth while talking at `t`, or null for "at rest" (the expression's own mouth).
 * Syllable-length slots pick closed / half / open, with a pause between phrases.
 */
export function talkMouthAt(t: number, seed: number): MouthStyle | null {
    if (!Number.isFinite(t) || t < 0) return null;
    const cycle = PHRASE + PAUSE;
    if (t % cycle >= PHRASE) return null;
    const v = hash(seed + 3, Math.floor(t / SYLLABLE));
    return v < 0.3 ? null : v < 0.7 ? 'openO' : 'openWide';
}

/**
 * The face a figure shows at scene time `t`: its stored expression, the key in effect,
 * then a talking mouth and a blink on top. `blink` / `talking` are the resolved switches
 * (the caller knows whether the figure is playing and which clip is on).
 */
export function liveFace(
    base: LiveFace,
    opts: { t: number; seed: number; keys?: FaceKey[]; keyT?: number; blink?: boolean; talking?: boolean },
): LiveFace {
    // Keys are placed on the SCENE timeline; blinks and chatter only need a steady clock.
    const key = faceKeyAt(opts.keys, opts.keyT ?? opts.t);
    const face: LiveFace = key
        ? { face: key.face ?? base.face, ...mergeFaceParts(base, key) }
        : { ...base };
    if (opts.talking) {
        const m = talkMouthAt(opts.t, opts.seed);
        if (m) face.mouth = m;
    }
    if (opts.blink && blinkAt(opts.t, opts.seed)) {
        const eyes = face.eyes === 'auto' ? resolvedEyes(face.face) : face.eyes;
        if (BLINKABLE.has(eyes)) face.eyes = 'line';
    }
    return face;
}

/** Which eyes an expression uses (for the blink check when eyes are 'auto'). */
const resolvedEyes = (f: FaceStyle): EyeStyle => faceRecipe(f).eyes;
