/**
 * Reading tinyfly files that carry their own shapes.
 *
 * tinyfly writes several JSON shapes (its docs/file-format.md). A timeline
 * definition only animates targets by name, so it needs shapes already in the
 * document. An Animation Document (`{ duration, canvas, elements, tracks }`, from
 * tinyfly's More → Export Animation Document) and a Project (`{ scenes[] }`) also say
 * what to draw, so Yappy can build the shapes and attach the timeline to them.
 *
 * Pure: no store access. `Yappy.tinyfly.import` in api.ts creates what this returns.
 */
import type { TimelineDefinition } from '../../vendor/tinyfly/tinyfly-engine';
import type { ElementType, GradientStop } from '../../types';

/** A tinyfly editor element, loosely typed: files come from outside. */
export type TinyflyElement = Record<string, any> & { type?: string; name?: string };

export type TinyflyCanvas = { width: number; height: number; background?: string };

export type TinyflyFile =
    | { kind: 'timeline'; definition: TimelineDefinition }
    | {
        kind: 'scene';
        name: string;
        canvas?: TinyflyCanvas;
        elements: TinyflyElement[];
        definition: TimelineDefinition;
        /** Scenes in the file. Only one is read. */
        sceneCount: number;
    };

/**
 * Give every track a unique id. The engine keys tracks by id, so documents written by
 * hand or by an AI (where ids are optional) would otherwise keep only one of them.
 */
function withTrackIds(tracks: unknown[], prefix: string): Record<string, any>[] {
    const used = new Set<string>();
    return tracks.filter(isObj).map((tr, i) => {
        let id = typeof tr.id === 'string' && tr.id && !used.has(tr.id) ? tr.id : `${prefix}-track-${i}`;
        while (used.has(id)) id += '-';
        used.add(id);
        return { ...tr, id };
    });
}

const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

function readCanvas(c: unknown): TinyflyCanvas | undefined {
    if (!isObj(c) || !(c.width > 0) || !(c.height > 0)) return undefined;
    return typeof c.background === 'string'
        ? { width: c.width, height: c.height, background: c.background }
        : { width: c.width, height: c.height };
}

/**
 * Work out what a tinyfly file is. Throws an Error whose message is meant for the
 * user when the file is not one Yappy can use.
 */
export function readTinyflyFile(input: unknown): TinyflyFile {
    let obj: unknown = input;
    if (typeof obj === 'string') {
        try { obj = JSON.parse(obj); } catch { throw new Error('tinyfly: that is not valid JSON'); }
    }
    if (!isObj(obj)) throw new Error('tinyfly: expected a timeline definition with a "tracks" array');
    const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

    if (Array.isArray(obj.scenes)) {
        const scenes = obj.scenes.filter(isObj);
        // The embed Sequence has the same outline, but its elements are pre-rendered HTML.
        if (scenes.some(s => Array.isArray(s.elements) && s.elements.some((e: any) => isObj(e) && typeof e.html === 'string'))) {
            throw new Error('tinyfly: this is an embed sequence, which keeps no shape styles. In tinyfly, choose More → Export Animation Document and import that file.');
        }
        const ordered = [...scenes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const scene = scenes.find(s => s.id === obj.activeSceneId) ?? ordered[0];
        if (!scene) throw new Error('tinyfly: this project has no scenes');
        const tl: Record<string, any> = isObj(scene.timeline) && Array.isArray(scene.timeline.tracks)
            ? copy(scene.timeline)
            : { id: String(scene.id ?? 'scene'), config: {}, tracks: [] };
        tl.config = isObj(tl.config) ? tl.config : {};
        tl.tracks = withTrackIds(tl.tracks, String(tl.id ?? 'scene'));
        const projectName = typeof obj.name === 'string' ? obj.name : '';
        const sceneName = typeof scene.name === 'string' ? scene.name : '';
        return {
            kind: 'scene',
            name: scenes.length > 1 && sceneName ? [projectName, sceneName].filter(Boolean).join(' · ') : (projectName || sceneName || 'tinyfly'),
            canvas: readCanvas(obj.canvas),
            elements: Array.isArray(scene.elements) ? copy(scene.elements.filter(isObj)) : [],
            definition: tl as TimelineDefinition,
            sceneCount: scenes.length,
        };
    }

    if (Array.isArray(obj.elements) && Array.isArray(obj.tracks)) {
        const name = typeof obj.name === 'string' && obj.name ? obj.name : 'tinyfly';
        const config = { ...(isObj(obj.config) ? copy(obj.config) : {}) };
        if (typeof obj.duration === 'number' && obj.duration > 0) config.duration = obj.duration;
        const definition: TimelineDefinition = {
            id: typeof obj.id === 'string' && obj.id ? obj.id : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tinyfly',
            name,
            config,
        } as TimelineDefinition;
        definition.tracks = withTrackIds(copy(obj.tracks), definition.id) as TimelineDefinition['tracks'];
        if (isObj(obj.captions)) (definition as any).captions = copy(obj.captions);
        return { kind: 'scene', name, canvas: readCanvas(obj.canvas), elements: copy(obj.elements.filter(isObj)), definition, sceneCount: 1 };
    }

    if (Array.isArray(obj.tracks)) {
        const id = typeof obj.id === 'string' && obj.id ? obj.id : 'tinyfly';
        return { kind: 'timeline', definition: { ...obj, tracks: withTrackIds(obj.tracks, id) } as TimelineDefinition };
    }
    throw new Error('tinyfly: expected a timeline definition with a "tracks" array');
}

/** The Yappy font key closest to a tinyfly CSS font stack. */
export function tinyflyFontToYappy(css: string | undefined): string {
    const s = (css ?? '').toLowerCase();
    if (/mono|courier|consolas|menlo/.test(s)) return 'monospace';
    if (/poppins/.test(s)) return 'poppins';
    if (/caveat/.test(s)) return 'caveat';
    if (/(^|[^-])serif/.test(s) && !/sans-serif/.test(s)) return 'serif';
    if (/cursive|handlee|comic/.test(s)) return 'hand-drawn';
    return 'sans-serif';
}

/** A shape for api.ts to create. `options` are ElementOptions. */
export interface TinyflyShape {
    kind: 'element' | 'text' | 'path' | 'image';
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    options: Record<string, any>;
    text?: string;
    /** path: SVG data in the element's own frame (origin at x, y). */
    d?: string;
    closed?: boolean;
    /** image: its source URL or data URI. */
    src?: string;
}

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const colour = (v: unknown): string => (typeof v === 'string' && v && v !== 'none' ? v : 'transparent');

/** Fill paint → ElementOptions: a colour, or one of tinyfly's gradient objects. */
function paint(fill: unknown): Record<string, any> {
    if (isObj(fill) && (fill.type === 'linear' || fill.type === 'radial') && Array.isArray(fill.stops) && fill.stops.length) {
        const stops: GradientStop[] = fill.stops
            .filter(isObj)
            .map(s => ({ offset: Math.min(1, Math.max(0, num(s.offset, 0))), color: String(s.color ?? '#000') }));
        return {
            backgroundColor: stops[0].color,
            fillStyle: fill.type,
            gradientType: fill.type,
            gradientStops: stops,
            gradientDirection: fill.type === 'linear' ? num(fill.angle, 0) : 0,
        };
    }
    return { backgroundColor: colour(fill), fillStyle: 'solid' };
}

/** Stroke → ElementOptions. tinyfly draws no stroke at width 0 whatever its colour. */
function strokeOf(el: TinyflyElement): Record<string, any> {
    const width = num(el.strokeWidth, 0);
    return { strokeColor: width > 0 ? colour(el.stroke) : 'transparent', strokeWidth: width };
}

/**
 * One tinyfly element → the shape to create, moved by (dx, dy). Null for what Yappy
 * cannot draw from the file alone (groups, symbols, audio, video, unknown types) and
 * for hidden elements, which tinyfly does not draw either.
 */
export function tinyflyElementToShape(el: TinyflyElement, dx: number, dy: number): TinyflyShape | null {
    if (!isObj(el) || el.visible === false) return null;
    const x = num(el.x, 0) + dx;
    const y = num(el.y, 0) + dy;
    const width = Math.max(1, num(el.width, 1));
    const height = Math.max(1, num(el.height, 1));
    const base: Record<string, any> = {
        opacity: Math.min(1, Math.max(0, num(el.opacity, 1))) * 100,
        angle: (num(el.rotation, 0) * Math.PI) / 180,
        roughness: 0,
        strokeStyle: 'solid',
        renderStyle: 'architectural',
    };
    if (typeof el.name === 'string' && el.name) base.name = el.name;

    switch (el.type) {
        case 'rect':
            return { kind: 'element', type: 'rectangle', x, y, width, height, options: { ...base, ...paint(el.fill), ...strokeOf(el), borderRadius: num(el.borderRadius, 0) } };
        case 'circle':
            return { kind: 'element', type: 'circle', x, y, width, height, options: { ...base, ...paint(el.fill), ...strokeOf(el) } };
        case 'text': {
            const fill = typeof el.fill === 'string' ? el.fill : '#000000';
            return {
                kind: 'text', type: 'text', x, y, width, height, text: String(el.text ?? ''),
                options: {
                    ...base,
                    width, height,
                    backgroundColor: 'transparent',
                    textColor: fill,
                    strokeColor: fill,
                    fontSize: num(el.fontSize, 16),
                    fontFamily: tinyflyFontToYappy(el.fontFamily),
                    fontWeight: el.fontWeight ?? 400,
                    textAlign: el.textAlign === 'left' || el.textAlign === 'right' ? el.textAlign : 'center',
                    verticalAlign: 'middle',
                    autoResize: false,
                },
            };
        }
        case 'image':
            if (typeof el.src !== 'string' || !el.src) return null;
            return { kind: 'image', type: 'image', x, y, width, height, src: el.src, options: base };
        case 'line':
        case 'arrow': {
            const x1 = x, y1 = y;
            const x2 = num(el.x2, num(el.x, 0) + width) + dx;
            const y2 = num(el.y2, num(el.y, 0)) + dy;
            const head = (on: unknown) => (el.type === 'arrow' && on ? 'triangle' : null);
            return {
                kind: 'element', type: el.type, x: x1, y: y1, width: x2 - x1, height: y2 - y1,
                options: {
                    ...base,
                    strokeColor: colour(el.stroke),
                    strokeWidth: num(el.strokeWidth, 2),
                    backgroundColor: 'transparent',
                    strokeLineCap: el.lineCap === 'round' || el.lineCap === 'square' ? el.lineCap : 'butt',
                    startArrowhead: head(el.startHead),
                    endArrowhead: head(el.endHead ?? true),
                },
            };
        }
        case 'path':
            if (typeof el.d !== 'string' || !el.d.trim()) return null;
            return {
                kind: 'path', type: 'path', x, y, width, height, d: el.d, closed: !!el.closed,
                options: { ...base, ...paint(el.fill), ...strokeOf(el), strokeLineJoin: el.lineJoin },
            };
        default:
            return null;
    }
}

/**
 * How far to move a scene so its artboard (or, without one, its elements' bounds)
 * is centred on `center`.
 */
export function tinyflyPlacementOffset(
    canvas: TinyflyCanvas | undefined,
    elements: TinyflyElement[],
    center: { x: number; y: number },
): { dx: number; dy: number } {
    if (canvas) return { dx: center.x - canvas.width / 2, dy: center.y - canvas.height / 2 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
        if (!isObj(el)) continue;
        const x = num(el.x, 0), y = num(el.y, 0);
        const xs = [x, typeof el.x2 === 'number' ? el.x2 : x + num(el.width, 0)];
        const ys = [y, typeof el.y2 === 'number' ? el.y2 : y + num(el.height, 0)];
        minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs);
        minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys);
    }
    if (!Number.isFinite(minX)) return { dx: center.x, dy: center.y };
    return { dx: center.x - (minX + maxX) / 2, dy: center.y - (minY + maxY) / 2 };
}
