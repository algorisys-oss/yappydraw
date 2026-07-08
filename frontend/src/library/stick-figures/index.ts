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
import type { DrawingElement } from '../../types';

export * from './types';
export * from './registry';
export * from './prefs';
export { STICK_ASSETS } from './assets';

/** Default on-canvas width for a dropped figure (world units). */
export const STICK_DEFAULT_WIDTH = 130;

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
