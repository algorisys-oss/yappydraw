/**
 * Stick-figure library — public entry point.
 *
 * `insertStickFigure` drops an asset onto the canvas as ONE editable, recolourable
 * group: the SVG is parsed into normal `path` elements (head, body skeleton, props)
 * by the shared SVG importer, each part is stamped with a semantic `sfRole`
 * (body / head / accent / prop), the outline is normalised to a default weight, and
 * the parts are grouped. `recolorStickFigure` then recolours by role in one click.
 */
import { batch } from 'solid-js';
import { svgToElements } from '../../utils/svg-import';
import { store, setStore, updateElement, pushToHistory, bumpDirtyRevision } from '../../store/app-store';
import { generateId } from '../../utils/id-generator';
import { getStickAsset } from './registry';
import { stickColorMode, pushStickRecent } from './prefs';
import { defaultRig, rigPoseToSvg, RIG_W, RIG_H } from './anim/rig';
import { getClip, poseAt } from './anim/clips';
import { isPathLike } from './anim/path-follow';
import type { DrawingElement } from '../../types';

export * from './types';
export * from './registry';
export * from './prefs';
export { STICK_ASSETS } from './assets';
export { CLIPS, CLIP_LIST, getClip, poseAt } from './anim/clips';
export { rigPoseToSvg, defaultRig, evaluateRig, RIG_W, RIG_H } from './anim/rig';

/** Default on-canvas width for a dropped figure (world units). Height ≈ 1.86×
 *  this (viewBox 140×260), so ~110 lands a figure at roughly 110×204. */
export const STICK_DEFAULT_WIDTH = 110;

/** Default outline (stroke) weight of a freshly-dropped figure, in px. */
export const STICK_STROKE_PX = 4;

/** Semantic part roles carried on `DrawingElement.sfRole`. */
export type StickPartRole = 'body' | 'head' | 'accent' | 'prop';
export const STICK_PART_ROLES: StickPartRole[] = ['body', 'head', 'accent', 'prop'];

/** Parse a #rrggbb hex to {r,g,b} (0-255), or null. */
function parseHex(hex: string): { r: number; g: number; b: number } | null {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Classify a fill colour into a role for parts the SVG didn't tag explicitly.
 * Transparent → body (an outline part); near-white / low-saturation grey → prop
 * (a neutral structural prop like a podium or whiteboard); anything vivid → accent.
 */
export function roleFromFill(bg: string | undefined): StickPartRole {
    if (!bg || bg === 'transparent' || bg === 'none') return 'body';
    const c = parseHex(bg);
    if (!c) return 'accent';
    const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
    const lightness = (max + min) / 2 / 255;
    const sat = max === 0 ? 0 : (max - min) / max;
    if (sat < 0.25 || lightness > 0.9) return 'prop';
    return 'accent';
}

export interface InsertStickOptions {
    /** World-space top-left. Omit to center on the active page. */
    x?: number;
    y?: number;
    /** Target width in world units (keeps aspect). Defaults to STICK_DEFAULT_WIDTH. */
    targetWidth?: number;
    /** Drop with accent fills stripped (pure monochrome). Defaults to the panel's colour mode. */
    monochrome?: boolean;
}

/**
 * Insert a stick-figure asset by id. Returns the new element ids (already selected
 * and grouped into one object). Returns [] for an unknown id.
 *
 * The whole figure lands as a single undo step: the elements are added, their
 * outline normalised to {@link STICK_STROKE_PX}, each part tagged with its
 * {@link StickPartRole}, and all parts joined into one group.
 */
export function insertStickFigure(assetId: string, opts: InsertStickOptions = {}): string[] {
    const asset = getStickAsset(assetId);
    if (!asset) return [];

    const els = svgToElements(asset.svg, {
        x: opts.x,
        y: opts.y,
        targetWidth: opts.targetWidth ?? STICK_DEFAULT_WIDTH,
    });
    if (els.length === 0) return [];

    // Normalise outline weight: scale every part's stroke so the heaviest (the main
    // body outline) equals STICK_STROKE_PX, keeping thinner prop strokes proportional.
    const maxSW = Math.max(...els.map(e => e.strokeWidth || 0));
    const f = maxSW > 0 ? STICK_STROKE_PX / maxSW : 1;
    const mono = opts.monochrome ?? (stickColorMode() === 'mono');
    const gid = generateId('group');
    for (const e of els) {
        if (e.strokeWidth) e.strokeWidth = Math.max(0.4, Math.round(e.strokeWidth * f * 100) / 100);
        if (!e.sfRole) e.sfRole = roleFromFill(e.backgroundColor);
        // Monochrome tier: drop accent fills so the figure is pure outline.
        if (mono && e.sfRole === 'accent') e.backgroundColor = 'transparent';
        e.groupIds = [...(e.groupIds || []), gid];
    }

    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev, ...els]);
        setStore('selection', els.map(e => e.id));
    });
    bumpDirtyRevision();
    pushStickRecent(assetId);
    return els.map(e => e.id);
}

/** Colours to apply per role. `outline` recolours every part's stroke; `accent`
 *  recolours the fill of accent parts (colourful props) only. */
export interface StickRecolor {
    outline?: string;
    accent?: string;
}

/**
 * Recolour stick-figure parts among `ids` by semantic role. Only elements carrying
 * an `sfRole` are touched, so it's safe to pass a whole mixed selection. Returns the
 * number of parts changed.
 */
export function recolorStickFigure(ids: string[], colors: StickRecolor): number {
    const idSet = new Set(ids);
    const parts = store.elements.filter(e => idSet.has(e.id) && e.sfRole);
    if (parts.length === 0) return 0;
    pushToHistory();
    let changed = 0;
    batch(() => {
        for (const e of parts) {
            const patch: Partial<DrawingElement> = {};
            if (colors.outline && e.strokeColor && e.strokeColor !== 'transparent') {
                patch.strokeColor = colors.outline;
            }
            if (colors.accent && e.sfRole === 'accent') {
                patch.backgroundColor = colors.accent;
            }
            if (Object.keys(patch).length) { updateElement(e.id, patch); changed++; }
        }
    });
    if (changed) bumpDirtyRevision();
    return changed;
}

/** True if `ids` includes at least one stick-figure part (has an `sfRole`). */
export function selectionHasStickFigure(ids: string[]): boolean {
    const idSet = new Set(ids);
    return store.elements.some(e => idSet.has(e.id) && !!e.sfRole);
}

const _monoCache = new Map<string, string>();
/**
 * A monochrome copy of an asset's SVG (accent fills stripped) — for previewing
 * figures the way they'll drop while Mono mode is on. Mirrors the insert logic:
 * an element is an accent if it's tagged `data-sf-role="accent"` OR (untagged) its
 * fill classifies as accent via {@link roleFromFill}. Neutral props keep their fill.
 * Cached per source string.
 */
export function toMonochromeSvg(svg: string): string {
    const hit = _monoCache.get(svg);
    if (hit) return hit;
    try {
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        doc.querySelectorAll<SVGElement>('[fill]').forEach(el => {
            const fill = el.getAttribute('fill');
            if (!fill || fill === 'none') return;
            const role = el.getAttribute('data-sf-role');
            const isAccent = role === 'accent' || (!role && roleFromFill(fill) === 'accent');
            if (isAccent) el.setAttribute('fill', 'none');
        });
        const out = doc.documentElement.outerHTML;
        _monoCache.set(svg, out);
        return out;
    } catch { return svg; }
}

// ─── Animated figures (stickRig element) ────────────────────────────────────

/** Aspect ratio of the animation rig frame. */
const RIG_ASPECT = RIG_H / RIG_W;
let _rigCounter = 0;

export interface InsertAnimatedOptions {
    x?: number; y?: number; width?: number; facing?: 1 | -1; speed?: number;
}

/**
 * Insert an animated stick figure (element `type: 'stickRig'`) playing a motion clip.
 * The figure animates from the global clock; stroke colour/width are normal element
 * props. Returns the new element id.
 */
export function insertAnimatedFigure(clip = 'walk', opts: InsertAnimatedOptions = {}): string {
    const width = opts.width ?? STICK_DEFAULT_WIDTH;
    const height = width * RIG_ASPECT;
    let x = opts.x, y = opts.y;
    if (x === undefined || y === undefined) {
        const page = store.slides[store.activeSlideIndex];
        if (page) {
            x = x ?? page.spatialPosition.x + (page.dimensions.width - width) / 2;
            y = y ?? page.spatialPosition.y + (page.dimensions.height - height) / 2;
        } else { x = x ?? 200; y = y ?? 200; }
    }
    const el = {
        id: `stickrig-${Date.now()}-${++_rigCounter}`,
        type: 'stickRig',
        x, y, width, height,
        strokeColor: '#1f2937', backgroundColor: 'transparent', fillStyle: 'solid',
        strokeWidth: 4, strokeStyle: 'solid', roughness: 0, opacity: 100, angle: 0,
        renderStyle: 'architectural', locked: false, link: null,
        layerId: store.activeLayerId || 'default-layer',
        seed: Math.floor(Math.random() * 2 ** 31), roundness: null,
        stickRig: { clip, facing: opts.facing ?? 1, speed: opts.speed ?? 1, playing: true },
    } as unknown as DrawingElement;
    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev, el]);
        setStore('selection', [el.id]);
    });
    bumpDirtyRevision();
    return el.id;
}

/** Toggle (or set) play/pause on the selected/given animated figures. */
export function setAnimatedFigurePlaying(ids: string[], playing?: boolean): void {
    const rigs = store.elements.filter(e => ids.includes(e.id) && e.type === 'stickRig');
    if (!rigs.length) return;
    batch(() => {
        for (const e of rigs) {
            const next = playing ?? !(e.stickRig?.playing !== false);
            updateElement(e.id, { stickRig: { ...(e.stickRig as any), playing: next } });
        }
    });
    bumpDirtyRevision();
}

/** Change the motion clip of the selected/given animated figures. */
export function setAnimatedFigureClip(ids: string[], clip: string): void {
    const rigs = store.elements.filter(e => ids.includes(e.id) && e.type === 'stickRig');
    batch(() => {
        for (const e of rigs) updateElement(e.id, { stickRig: { ...(e.stickRig as any), clip } });
    });
    bumpDirtyRevision();
}

/** Attach an animated figure to a path element so it walks the route (feet planted, auto-facing). */
export function attachFigureToPath(figureId: string, pathId: string, opts?: { dur?: number; loop?: boolean; autoFace?: boolean }): boolean {
    const el = store.elements.find(e => e.id === figureId && e.type === 'stickRig');
    const path = store.elements.find(e => e.id === pathId);
    if (!el || !path) return false;
    updateElement(figureId, {
        stickRig: { ...(el.stickRig as any), clip: 'walk', playing: true, path: { pathId, dur: opts?.dur ?? 4, loop: opts?.loop ?? true, autoFace: opts?.autoFace ?? true } },
    }, true);
    bumpDirtyRevision();
    return true;
}

/** Remove a figure's path-follow (it animates in place again). */
export function detachFigurePath(id: string): void {
    const el = store.elements.find(e => e.id === id && e.type === 'stickRig');
    if (!el?.stickRig?.path) return;
    const { path, ...rest } = el.stickRig as any;
    updateElement(id, { stickRig: rest }, true);
    bumpDirtyRevision();
}

/** Set the traversal duration (seconds) of a path-following figure. */
export function setFigurePathDuration(id: string, dur: number): void {
    const el = store.elements.find(e => e.id === id && e.type === 'stickRig');
    if (!el?.stickRig?.path) return;
    updateElement(id, { stickRig: { ...(el.stickRig as any), path: { ...(el.stickRig.path as any), dur: Math.max(0.5, dur) } } }, true);
    bumpDirtyRevision();
}

/**
 * From a selection, find a (figure, path) pair suitable for "walk this path":
 * exactly one stickRig and one path-like element. Returns null otherwise.
 */
export function pathFollowCandidate(ids: string[]): { figureId: string; pathId: string } | null {
    const els = store.elements.filter(e => ids.includes(e.id));
    const figs = els.filter(e => e.type === 'stickRig');
    const paths = els.filter(e => e.type !== 'stickRig' && isPathLike(e));
    if (figs.length === 1 && paths.length === 1) return { figureId: figs[0].id, pathId: paths[0].id };
    return null;
}

/** The path a selected figure is currently following (if any). */
export function selectedFigurePath(ids: string[]): { figureId: string; pathId: string } | null {
    const fig = store.elements.find(e => ids.includes(e.id) && e.type === 'stickRig' && e.stickRig?.path);
    return fig ? { figureId: fig.id, pathId: (fig.stickRig!.path as any).pathId } : null;
}

/** Set a timed action sequence on a figure (empty array clears it). */
export function setFigureSequence(id: string, steps: { clip: string; dur: number }[]): void {
    const el = store.elements.find(e => e.id === id && e.type === 'stickRig');
    if (!el) return;
    const seq = steps.filter(s => s.clip && s.dur > 0);
    updateElement(id, { stickRig: { ...(el.stickRig as any), sequence: seq.length ? seq : undefined } }, true);
    bumpDirtyRevision();
}

/** The action sequence on a figure (if any). */
export function getFigureSequence(id: string): { clip: string; dur: number }[] {
    const el = store.elements.find(e => e.id === id && e.type === 'stickRig');
    return (el?.stickRig?.sequence as any) || [];
}

/** Flip the facing (left/right) of the selected/given animated figures. */
export function flipAnimatedFigure(ids: string[]): void {
    const rigs = store.elements.filter(e => ids.includes(e.id) && e.type === 'stickRig');
    batch(() => {
        for (const e of rigs) {
            const facing = (e.stickRig?.facing ?? 1) === 1 ? -1 : 1;
            updateElement(e.id, { stickRig: { ...(e.stickRig as any), facing } });
        }
    });
    bumpDirtyRevision();
}

/** True if the selection includes an animated (stickRig) figure. */
export function selectionHasAnimatedFigure(ids: string[]): boolean {
    return store.elements.some(e => ids.includes(e.id) && e.type === 'stickRig');
}

/**
 * Bake the current frame of an animated figure into editable path elements (the
 * stickRig is replaced by a grouped set of bezier paths, exactly like a dropped
 * static figure). Returns the new element ids.
 */
export function bakeAnimatedFigure(id: string): string[] {
    const el = store.elements.find(e => e.id === id && e.type === 'stickRig');
    if (!el) return [];
    const data = el.stickRig || { clip: 'idle' };
    const clip = getClip(data.clip);
    const playing = data.playing !== false;
    const t = (window as any).yappyGlobalTime || 0;
    const phase = playing ? (t / 1000) * (data.speed ?? 1) / clip.duration : (data.previewPhase ?? 0);
    const rig = defaultRig();
    rig.facing = data.facing ?? 1;
    rig.style = { stroke: el.strokeColor || '#1f2937', strokeWidth: 6 };
    const svg = rigPoseToSvg(rig, poseAt(data.clip || 'idle', phase, rig.facing));
    const els = svgToElements(svg, { x: el.x, y: el.y, targetWidth: el.width });
    if (!els.length) return [];
    const maxSW = Math.max(...els.map(e => e.strokeWidth || 0));
    const f = maxSW > 0 ? STICK_STROKE_PX / maxSW : 1;
    const gid = generateId('group');
    for (const e of els) {
        if (e.strokeWidth) e.strokeWidth = Math.max(0.4, Math.round(e.strokeWidth * f * 100) / 100);
        if (!e.sfRole) e.sfRole = roleFromFill(e.backgroundColor);
        e.groupIds = [...(e.groupIds || []), gid];
    }
    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev.filter(e => e.id !== id), ...els]);
        setStore('selection', els.map(e => e.id));
    });
    bumpDirtyRevision();
    return els.map(e => e.id);
}
