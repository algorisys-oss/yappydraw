/**
 * tinyfly clips: tinyfly animations living inside a Yappy document.
 *
 * A clip stores tinyfly's own JSON timeline verbatim plus a map from its target
 * names to Yappy element ids. Each frame, the vendored tinyfly engine evaluates the
 * clip at the playhead and the values become ordinary Yappy overrides, merged into
 * the same map composition keyframes use (see `withExtraOverrides`), so parenting,
 * both render styles, hit-testing and video/GIF export all apply unchanged.
 *
 * Values follow tinyfly's DOM semantics, which is what a tinyfly author expects:
 * `x`/`y` are offsets from where the element sits, `rotate` is degrees added to its
 * angle, `scale` scales about its centre, `opacity` is 0–1.
 *
 * The engine is loaded on demand (`ensureTinyflyEngine`) so documents without clips
 * pay nothing. Until it has loaded, evaluation returns no overrides.
 */
import type { DrawingElement } from '../../types';
import type { DrawingElementState, PropertyTrack, TimedKeyframe, TinyflyClip } from '../../types/motion-types';
import type { AnimatableValue, TimelineDefinition, Timeline } from '../../vendor/tinyfly/tinyfly-engine';

type Engine = typeof import('../../vendor/tinyfly/tinyfly-engine');
type Overrides = Partial<DrawingElementState> & Record<string, unknown>;

let engine: Engine | null = null;
let loading: Promise<Engine> | null = null;

/** Load the vendored engine once. Resolves immediately when already loaded. */
export function ensureTinyflyEngine(): Promise<Engine> {
    if (engine) return Promise.resolve(engine);
    loading ??= import('../../vendor/tinyfly/tinyfly-engine.js').then(m => (engine = m as Engine));
    return loading;
}

export const tinyflyEngineLoaded = (): boolean => engine !== null;

/** Install an engine module directly (tests; or a caller that already imported it). */
export function setTinyflyEngine(m: Engine): void { engine = m; }

/** The tinyfly properties Yappy knows how to apply. Everything else is reported. */
const SUPPORTED = new Set([
    'x', 'y', 'rotate', 'scale', 'scaleX', 'scaleY', 'opacity',
    'fill', 'stroke', 'strokeWidth', 'width', 'height', 'blur', 'text', 'motionPath',
]);

const tracksOf = (def: TimelineDefinition): any[] => (Array.isArray(def?.tracks) ? def.tracks : []);

/** Every target name, in order of first appearance (a staggered track's list included). */
export function clipTargets(def: TimelineDefinition): string[] {
    const seen = new Set<string>();
    for (const tr of tracksOf(def)) {
        const names: string[] = Array.isArray(tr.targets) && tr.targets.length ? tr.targets : [tr.target];
        for (const n of names) if (typeof n === 'string' && n) seen.add(n);
    }
    return [...seen];
}

/** Properties in the definition that Yappy will ignore, sorted. */
export function unsupportedClipProperties(def: TimelineDefinition): string[] {
    const out = new Set<string>();
    for (const tr of tracksOf(def)) if (tr.property && !SUPPORTED.has(tr.property)) out.add(tr.property);
    return [...out].sort();
}

// One engine Timeline per definition object. Solid's store hands back the same proxy
// for the same underlying object, so an unchanged clip hits the cache every frame and
// an edited definition (a new object) builds a new Timeline.
const timelines = new WeakMap<object, Timeline>();

function timelineFor(def: TimelineDefinition): Timeline | null {
    if (!engine || !def) return null;
    let tl = timelines.get(def);
    if (!tl) {
        try {
            // Cloned: the engine keeps references to the tracks it is given, and a store
            // proxy must not end up inside it.
            tl = engine.deserializeTimeline(JSON.parse(JSON.stringify(def)));
        } catch (err) {
            console.warn('tinyfly: could not load clip definition', err);
            return null;
        }
        timelines.set(def, tl);
    }
    return tl;
}

/** Clip length in ms: the definition's duration, else the engine's, else the last keyframe. */
export function clipDurationMs(def: TimelineDefinition): number {
    const explicit = def?.config?.duration;
    if (typeof explicit === 'number' && explicit >= 0) return explicit;
    const tl = timelineFor(def);
    if (tl) return tl.duration;
    let end = 0;
    for (const tr of tracksOf(def)) for (const k of tr.keyframes ?? []) end = Math.max(end, (k.time ?? 0) + (tr.delay ?? 0));
    return end;
}

/**
 * Seconds on the Yappy playhead → ms inside the clip, applying tinyfly's `speed`,
 * `loop` (0 once, -1 forever, N extra plays), `alternate` and `repeatDelay`. Before the
 * start it is 0; after the last play it holds where that play ended.
 */
export function clipLocalTime(t: number, clip: TinyflyClip, durationMs: number): number {
    const D = durationMs;
    if (!(D > 0)) return 0;
    const cfg = clip.definition?.config ?? {};
    const speed = typeof cfg.speed === 'number' && cfg.speed > 0 ? cfg.speed : 1;
    const elapsed = (t - (clip.start || 0)) * 1000 * speed;
    if (elapsed <= 0) return 0;

    const loop = typeof cfg.loop === 'number' ? cfg.loop : 0;
    const plays = loop < 0 ? Infinity : 1 + Math.floor(loop);
    const period = D + Math.max(0, cfg.repeatDelay ?? 0);
    const reversed = (i: number) => !!cfg.alternate && i % 2 === 1;

    const i = Math.floor(elapsed / period);
    if (i >= plays) return reversed(plays - 1) ? 0 : D;
    const into = Math.min(elapsed - i * period, D); // holds on the last frame during the delay
    return reversed(i) ? D - into : into;
}

/** Convert one target's tinyfly values into Yappy overrides for element `el`. */
export function tinyflyValuesToOverrides(el: DrawingElement, values: Map<string, AnimatableValue>): Overrides {
    const num = (k: string): number | undefined => {
        const v = values.get(k);
        return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
    };
    const o: Overrides = {};

    const dx = (num('x') ?? 0) + (num('motionPathX') ?? 0);
    const dy = (num('y') ?? 0) + (num('motionPathY') ?? 0);
    const hasMove = values.has('x') || values.has('y') || values.has('motionPathX') || values.has('motionPathY');
    const w = num('width') ?? el.width;
    const h = num('height') ?? el.height;
    const scale = num('scale') ?? 1;
    const sx = scale * (num('scaleX') ?? 1);
    const sy = scale * (num('scaleY') ?? 1);
    const hasScale = values.has('scale') || values.has('scaleX') || values.has('scaleY');

    if (hasMove || hasScale || values.has('width') || values.has('height')) {
        const x = el.x + dx;
        const y = el.y + dy;
        const fw = w * sx;
        const fh = h * sy;
        // Scale about the centre of the (moved) box, as a CSS transform-origin: 50% 50% would.
        o.x = x + (w - fw) / 2;
        o.y = y + (h - fh) / 2;
        if (hasScale || values.has('width')) o.width = fw;
        if (hasScale || values.has('height')) o.height = fh;
    }

    const rot = (num('rotate') ?? 0) + (num('motionPathRotate') ?? 0);
    if (values.has('rotate') || values.has('motionPathRotate')) o.angle = (el.angle || 0) + (rot * Math.PI) / 180;

    const opacity = num('opacity');
    if (opacity !== undefined) o.opacity = opacity * 100;
    const isText = el.type === 'text' || el.type === 'richtext';
    // A CSS scale shrinks the letters too, not just the box. A non-uniform scale can
    // only be approximated with one font size: the geometric mean keeps the area.
    if (isText && hasScale && typeof el.fontSize === 'number' && el.fontSize > 0) {
        o.fontSize = el.fontSize * Math.sqrt(Math.abs(sx * sy));
    }
    // On a tinyfly text element, fill is the colour of the letters.
    const fill = values.get('fill');
    if (typeof fill === 'string') {
        if (isText) o.textColor = fill;
        else o.backgroundColor = fill;
    }
    const stroke = values.get('stroke');
    if (typeof stroke === 'string') o.strokeColor = stroke;
    const strokeWidth = num('strokeWidth');
    if (strokeWidth !== undefined) o.strokeWidth = strokeWidth;
    const blur = num('blur');
    if (blur !== undefined) o.filterBlur = blur;
    const text = values.get('text');
    if (typeof text === 'string') {
        if (isText) o.text = text;
        else o.containerText = text;
    }
    return o;
}

/**
 * Evaluate every enabled clip at playhead time `t` (seconds). Returns elementId →
 * overrides, ready for `applyCompositionOverrides(..., extra)`. Empty until the engine
 * has loaded. When two clips drive the same property of one element, the later wins.
 */
export function evaluateTinyflyClips(
    t: number,
    clips: TinyflyClip[] | undefined,
    elements: DrawingElement[],
): Map<string, Overrides> {
    const out = new Map<string, Overrides>();
    if (!engine || !clips || clips.length === 0) return out;
    const elMap = new Map(elements.map(e => [e.id, e]));

    for (const clip of clips) {
        if (!clip || clip.enabled === false) continue;
        const tl = timelineFor(clip.definition);
        if (!tl) continue;
        const local = clipLocalTime(t, clip, clipDurationMs(clip.definition));
        const { values } = tl.getStateAtTime(local);
        for (const [target, props] of values) {
            const id = clip.bindings?.[target];
            const el = id ? elMap.get(id) : undefined;
            if (!el) continue;
            out.set(el.id, { ...(out.get(el.id) ?? {}), ...tinyflyValuesToOverrides(el, props) });
        }
    }
    return out;
}

/**
 * Decide which element each target drives. In order: an explicit `bind` entry naming an
 * element that exists; an element whose id is the target name; an element whose `name`
 * is the target name; then the remaining targets take the selected elements in order.
 */
export function resolveClipBindings(
    def: TimelineDefinition,
    elements: DrawingElement[],
    selection: string[],
    explicit?: Record<string, string>,
): { bindings: Record<string, string>; unbound: string[] } {
    const ids = new Set(elements.map(e => e.id));
    const byName = new Map<string, string>();
    for (const e of elements) if (e.name && !byName.has(e.name)) byName.set(e.name, e.id);

    const bindings: Record<string, string> = {};
    const pending: string[] = [];
    for (const target of clipTargets(def)) {
        const want = explicit?.[target];
        if (want && ids.has(want)) bindings[target] = want;
        else if (ids.has(target)) bindings[target] = target;
        else if (byName.has(target)) bindings[target] = byName.get(target)!;
        else pending.push(target);
    }
    const used = new Set(Object.values(bindings));
    const free = selection.filter(id => ids.has(id) && !used.has(id));
    const unbound: string[] = [];
    for (const target of pending) {
        const id = free.shift();
        if (id) bindings[target] = id;
        else unbound.push(target);
    }
    return { bindings, unbound };
}

/** Numeric tolerance per property when dropping collinear baked samples. */
const BAKE_TOLERANCE: Record<string, number> = { angle: Math.PI / 1800, opacity: 0.1 };

/**
 * Sample a clip into composition keyframe tracks (linear keys), for editing in the
 * Keyframes panel. One play of the clip is baked: a clip that loops forever becomes
 * its first cycle. Numeric samples that sit on the line between their neighbours are
 * dropped; strings (colours, text) keep a key wherever they change.
 */
export function bakeTinyflyClip(clip: TinyflyClip, elements: DrawingElement[], fps = 30): PropertyTrack[] {
    const start = clip.start || 0;
    const span = tinyflyClipEnd({ ...clip, enabled: true }) - start;
    const steps = Math.max(1, Math.ceil(span * fps));

    const series = new Map<string, { t: number; v: number | string }[]>(); // `${id}\0${prop}`
    for (let i = 0; i <= steps; i++) {
        const t = start + Math.min(span, i / fps);
        for (const [id, props] of evaluateTinyflyClips(t, [{ ...clip, enabled: true }], elements)) {
            for (const [prop, v] of Object.entries(props)) {
                if (typeof v !== 'number' && typeof v !== 'string') continue;
                const key = `${id} ${prop}`;
                if (!series.has(key)) series.set(key, []);
                series.get(key)!.push({ t, v });
            }
        }
    }

    const tracks: PropertyTrack[] = [];
    for (const [key, samples] of series) {
        const [elementId, property] = key.split(' ');
        const keys: TimedKeyframe[] = [];
        if (typeof samples[0].v === 'number') {
            const tol = BAKE_TOLERANCE[property] ?? 0.25;
            keys.push({ t: samples[0].t, value: samples[0].v });
            for (let i = 1; i < samples.length - 1; i++) {
                const a = keys[keys.length - 1], b = samples[i + 1], s = samples[i];
                const u = (s.t - a.t) / (b.t - a.t || 1);
                const onLine = (a.value as number) + ((b.v as number) - (a.value as number)) * u;
                if (Math.abs(onLine - (s.v as number)) > tol) keys.push({ t: s.t, value: s.v });
            }
            const last = samples[samples.length - 1];
            if (samples.length > 1) keys.push({ t: last.t, value: last.v });
        } else {
            const hold = property === 'text' || property === 'containerText';
            keys.push({ t: samples[0].t, value: samples[0].v });
            for (let i = 1; i < samples.length; i++) {
                if (samples[i].v !== samples[i - 1].v) keys.push({ t: samples[i].t, value: samples[i].v, ...(hold ? { hold: true } : {}) });
            }
        }
        const el = elements.find(e => e.id === elementId) as Record<string, unknown> | undefined;
        const constant = keys.every(k => k.value === keys[0].value);
        if (constant && el && el[property] === keys[0].value) continue; // never moves off its stored value
        tracks.push({ elementId, property, keys });
    }
    return tracks;
}

/**
 * Where a clip ends on the Yappy playhead, in seconds — for sizing the Scene Timeline.
 * An endless loop counts one cycle (it has no end to show). A muted clip counts 0.
 */
export function tinyflyClipEnd(clip: TinyflyClip): number {
    if (!clip || clip.enabled === false) return 0;
    const cfg = clip.definition?.config ?? {};
    const D = clipDurationMs(clip.definition);
    const loop = typeof cfg.loop === 'number' ? cfg.loop : 0;
    const speed = typeof cfg.speed === 'number' && cfg.speed > 0 ? cfg.speed : 1;
    const plays = loop < 0 ? 1 : 1 + Math.floor(loop);
    const span = plays * D + (plays - 1) * Math.max(0, cfg.repeatDelay ?? 0);
    return (clip.start || 0) + span / 1000 / speed;
}
