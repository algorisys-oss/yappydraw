/**
 * Scene-script layer — the manim-shaped authoring facade over the composition engine.
 *
 * The engine (absolute-second `PropertyTrack`s, evaluated by `evaluateCompositionAt`)
 * was already complete; what was missing was a way to WRITE it without doing the time
 * arithmetic yourself. manim sequences by statement order — `self.play(...)` runs, then
 * the next statement starts where it ended — and that is all this is: a playhead cursor
 * that turns each call into a pair of keyframes and advances itself.
 *
 * Deliberately NOT an engine: it holds one number (`cursor`) and calls `addKeyframe`.
 * Everything it produces is ordinary composition data, so the Scene Timeline, the
 * Keyframes panel, video export and `evaluateComposition` all work on it unchanged.
 *
 * See docs/learnings.md ("Scene-script layer") and the manim-parity audit in
 * tests/manim-parity.spec.ts.
 */
import { easings, type EasingName } from './animation-types';

/**
 * Warn once per bad easing name. `getEasing` falls back to linear for anything it
 * doesn't recognise, which makes a typo ('easeInOut', 'ease-in-out') look like it
 * worked while quietly flattening the motion — worth one console line at authoring time.
 */
const warnedEasings = new Set<string>();
function checkEasing(name: string): void {
    if (name in easings || warnedEasings.has(name)) return;
    warnedEasings.add(name);
    console.warn(
        `[Yappy.scene] Unknown easing "${name}" — falling back to linear. ` +
        `Valid names: ${Object.keys(easings).join(', ')}.`
    );
}

/** What one `play()` call animates: property → target value. */
export type PlayTargets = Record<string, number | string>;

export interface PlayOptions {
    /** Seconds the tween lasts. Default 1. */
    duration?: number;
    /**
     * Named easing applied INTO the end keyframe. Default `easeInOutCubic`.
     *
     * Must be one of the names in `animation-types.ts` — `getEasing` falls back to
     * LINEAR for anything it doesn't recognise, silently. ('easeInOut' is not a real
     * name; it looks plausible and yields linear motion.)
     */
    easing?: EasingName;
}

/** Gentle ease-in-out — manim's `smooth()` default, and the one most scenes want. */
export const DEFAULT_EASING: EasingName = 'easeInOutCubic';

export interface PlaySpec {
    id: string;
    to: PlayTargets;
    /** Per-target overrides inside a `playAll` group. */
    options?: PlayOptions;
}

/** Injected so this module stays free of store/api import cycles. */
export interface SceneHost {
    getProperty(id: string, property: string): number | string;
    addKeyframe(id: string, property: string, t: number, value: number | string, easing?: EasingName): void;
    /** Commit the end state so a later `play()` reads it as its start (manim mobjects are stateful). */
    commit(id: string, updates: PlayTargets): void;
    clearComposition(): void;
}

export class SceneScript {
    /** Playhead, in seconds. Every scheduling call reads and advances this. */
    private cursor = 0;
    private host: SceneHost;

    constructor(host: SceneHost) {
        this.host = host;
    }

    /**
     * Animate one element's properties from their current values to `to`, starting at
     * the playhead. Advances the playhead by `duration`.
     *
     * manim: `self.play(dot.animate.shift(RIGHT * 5), run_time=2)`
     */
    play(id: string, to: PlayTargets, options: PlayOptions = {}): number {
        const duration = Math.max(0, options.duration ?? 1);
        const easing = options.easing ?? DEFAULT_EASING;
        checkEasing(easing);
        for (const [property, target] of Object.entries(to)) {
            const from = this.host.getProperty(id, property);
            this.host.addKeyframe(id, property, this.cursor, from, easing);
            this.host.addKeyframe(id, property, this.cursor + duration, target, easing);
        }
        this.host.commit(id, to);
        this.cursor += duration;
        return this.cursor;
    }

    /**
     * Run several targets over the SAME span — they start together and the playhead
     * lands on the longest. manim: `AnimationGroup`.
     */
    playAll(specs: PlaySpec[], options: PlayOptions = {}): number {
        const start = this.cursor;
        let end = start;
        for (const spec of specs) {
            this.cursor = start;
            end = Math.max(end, this.play(spec.id, spec.to, { ...options, ...spec.options }));
        }
        this.cursor = end;
        return this.cursor;
    }

    /**
     * Same animation across many elements, each offset by `lag` seconds.
     * manim: `LaggedStart` / `LaggedStartMap`.
     */
    playLagged(ids: string[], to: PlayTargets, options: PlayOptions & { lag?: number } = {}): number {
        const start = this.cursor;
        const lag = options.lag ?? 0.2;
        let end = start;
        ids.forEach((id, i) => {
            this.cursor = start + i * lag;
            end = Math.max(end, this.play(id, to, options));
        });
        this.cursor = end;
        return this.cursor;
    }

    /** Hold the playhead still for `seconds` — the gap becomes a hold, since a track
     *  keeps its last value past its final key. manim: `self.wait()`. */
    wait(seconds = 1): number {
        this.cursor += Math.max(0, seconds);
        return this.cursor;
    }

    /** Current playhead position (seconds) — also the scene's length so far. */
    at(): number {
        return this.cursor;
    }

    /** Move the playhead without animating, for interleaving hand-authored keyframes. */
    seek(seconds: number): number {
        this.cursor = Math.max(0, seconds);
        return this.cursor;
    }

    /** Drop every composition track and rewind the playhead. */
    reset(): void {
        this.cursor = 0;
        this.host.clearComposition();
    }
}
