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
import { stickColorMode, pushStickRecent, stickFacePref } from './prefs';
import {
    faceHairSvg, asFaceStyle, asHairStyle, DEFAULT_HAIR_COLOR,
    type FaceOpts, type FaceStyle, type HairStyle,
} from './face';
import {
    garmentSvg, asTrouserStyle, asShoeStyle, asTopStyle, asNeckStyle,
    DEFAULT_TROUSER_COLOR, DEFAULT_SHOE_COLOR, DEFAULT_TOP_COLOR, DEFAULT_NECK_COLOR, LEG_UNIT,
    type TrouserStyle, type ShoeStyle, type TopStyle, type NeckStyle,
} from './garments';
export * from './garments';
export * from './prims';
import { defaultRig, rigPoseToSvg, RIG_W, RIG_H } from './anim/rig';
import { getClip, poseAt } from './anim/clips';
import { isPathLike } from './anim/path-follow';
import type { DrawingElement } from '../../types';

export * from './types';
export * from './registry';
export * from './prefs';
export * from './face';
export { STICK_ASSETS } from './assets';
export { CLIPS, CLIP_LIST, getClip, poseAt } from './anim/clips';
export { rigPoseToSvg, defaultRig, evaluateRig, RIG_W, RIG_H } from './anim/rig';

/** Default on-canvas width for a dropped figure (world units). Height ≈ 1.86×
 *  this (viewBox 140×260), so ~110 lands a figure at roughly 110×204. */
export const STICK_DEFAULT_WIDTH = 110;

/** Default outline (stroke) weight of a freshly-dropped figure, in px. */
export const STICK_STROKE_PX = 4;

/** Semantic part roles carried on `DrawingElement.sfRole`. */
export type StickPartRole = 'body' | 'head' | 'accent' | 'prop' | 'face' | 'hair' | 'garment';
export const STICK_PART_ROLES: StickPartRole[] = ['body', 'head', 'accent', 'prop', 'face', 'hair', 'garment'];

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
    /** Face / hair overrides. Omit to use the panel's current face preference. */
    face?: FaceStyle | 'auto';
    hair?: HairStyle | 'auto';
    hairColor?: string;
    headFill?: boolean;
    trousers?: TrouserStyle | 'auto';
    trouserColor?: string;
    shoes?: ShoeStyle | 'auto';
    shoeColor?: string;
    top?: TopStyle | 'auto';
    topColor?: string;
    neck?: NeckStyle | 'auto';
    neckColor?: string;
}

/**
 * Turn a stick-figure asset into ready-to-commit elements: face/hair applied, roles
 * tagged, outline weight normalised, monochrome honoured, and face/hair parts linked
 * to their head so they can be restyled later.
 *
 * Pure with respect to the store — it neither pushes history nor adds anything — so
 * generators that must land as ONE undo step (the comic panel builder) can compose it
 * instead of re-implementing it. That duplication is exactly how the comic generator
 * missed faces when they shipped, so prefer this over copying the loop again.
 *
 * Elements come back UNGROUPED; the caller decides the grouping.
 */
export function prepareStickFigureElements(assetId: string, opts: InsertStickOptions = {}): DrawingElement[] {
    const asset = getStickAsset(assetId);
    if (!asset) return [];

    // Face / hair: explicit options win, otherwise the panel's current preference.
    const pref = stickFacePref();
    const svg = applyFaceHair(asset.svg, {
        face: opts.face ?? pref.face,
        hair: opts.hair ?? pref.hair,
        hairColor: opts.hairColor ?? pref.hairColor,
        headFill: opts.headFill ?? pref.headFill,
        trousers: opts.trousers ?? pref.trousers,
        trouserColor: opts.trouserColor ?? pref.trouserColor,
        shoes: opts.shoes ?? pref.shoes,
        shoeColor: opts.shoeColor ?? pref.shoeColor,
        top: opts.top ?? pref.top,
        topColor: opts.topColor ?? pref.topColor,
        neck: opts.neck ?? pref.neck,
        neckColor: opts.neckColor ?? pref.neckColor,
    });

    const els = svgToElements(svg, {
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
    for (const e of els) {
        if (e.strokeWidth) e.strokeWidth = Math.max(0.4, Math.round(e.strokeWidth * f * 100) / 100);
        if (!e.sfRole) e.sfRole = roleFromFill(e.backgroundColor);
        // Monochrome tier: drop accent (and solid-hair) fills so the figure is pure outline.
        if (mono && (e.sfRole === 'accent' || e.sfRole === 'hair' || e.sfRole === 'garment')) e.backgroundColor = 'transparent';
    }
    linkFaceParts(els, headStatesOf(svg));
    return els;
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
    const els = prepareStickFigureElements(assetId, opts);
    if (els.length === 0) return [];

    const gid = generateId('group');
    for (const e of els) e.groupIds = [...(e.groupIds || []), gid];

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
 *  recolours the fill of accent parts (colourful props); `hair` recolours the
 *  fill of solid hair parts. */
export interface StickRecolor {
    outline?: string;
    accent?: string;
    hair?: string;
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
            // Only solid hair parts have a fill to recolour; outline hair keeps none.
            if (colors.hair && e.sfRole === 'hair' && e.backgroundColor && e.backgroundColor !== 'transparent') {
                patch.backgroundColor = colors.hair;
            }
            if (Object.keys(patch).length) { updateElement(e.id, patch); changed++; }
        }
    });
    if (changed) bumpDirtyRevision();
    return changed;
}

/**
 * Expand a selection to whole figures: every element sharing a group with one of
 * `ids`, so restyling works whether the user clicked the group or one loose part.
 */
function expandToFigures(ids: string[]): DrawingElement[] {
    const idSet = new Set(ids);
    const groups = new Set<string>();
    for (const e of store.elements) {
        if (idSet.has(e.id)) for (const g of e.groupIds || []) groups.add(g);
    }
    return store.elements.filter(e =>
        idSet.has(e.id) || (e.groupIds || []).some(g => groups.has(g)));
}

/** Authoring ratio of body stroke to head radius (stroke-width 7, r 22). */
const SVG_STROKE_PER_R = 7 / 22;

/** Scale + translate freshly-imported parts onto a head's real world position. */
function placeOnHead(els: DrawingElement[], s: number, tx: number, ty: number, wScale: number): void {
    const anchors = (list: any[]) => list.forEach(a => {
        a.x *= s; a.y *= s;
        if (a.inX !== undefined) { a.inX *= s; a.inY = (a.inY ?? 0) * s; }
        if (a.outX !== undefined) { a.outX *= s; a.outY = (a.outY ?? 0) * s; }
    });
    for (const e of els) {
        e.x = e.x * s + tx; e.y = e.y * s + ty;
        e.width *= s; e.height *= s;
        if (e.strokeWidth) e.strokeWidth = Math.max(0.4, Math.round(e.strokeWidth * s * wScale * 100) / 100);
        if (e.pathAnchors) anchors(e.pathAnchors as any[]);
        if (e.pathSubpaths) (e.pathSubpaths as any[]).forEach(sp => anchors(sp.anchors));
    }
}

/**
 * World-space polyline of a dropped path element, from its stored anchors.
 *
 * `svgToElements` keeps anchors relative to the element's own bbox origin, so adding
 * x/y recovers world coordinates — which is how a flattened figure can still tell us
 * where its legs are.
 */
function polylineOf(el: DrawingElement): Array<[number, number]> {
    const anchors = (el.pathAnchors as any[] | undefined)
        ?? (el.pathSubpaths as any[] | undefined)?.[0]?.anchors;
    if (!anchors?.length) return [];
    return anchors.map((a: any) => [el.x + a.x, el.y + a.y] as [number, number]);
}

/** The leg polylines of the figure `head` belongs to, in world coordinates. */
function legsOfFigure(scope: DrawingElement[], head: DrawingElement): Array<Array<[number, number]>> {
    const groups = new Set(head.groupIds || []);
    return scope
        .filter(e => e.sfPart === 'leg' && (groups.size === 0 || (e.groupIds || []).some(g => groups.has(g))))
        .map(polylineOf)
        .filter(p => p.length >= 2);
}

/** Torso + arm polylines of a dropped figure, for tops and neckwear. */
function upperOfFigure(scope: DrawingElement[], head: DrawingElement) {
    const groups = new Set(head.groupIds || []);
    const inFigure = (e: DrawingElement) =>
        groups.size === 0 || (e.groupIds || []).some(g => groups.has(g));
    const torso = scope.filter(e => e.sfPart === 'torso' && inFigure(e)).map(polylineOf).find(p => p.length >= 2);
    const arms = scope.filter(e => e.sfPart === 'arm' && inFigure(e)).map(polylineOf).filter(p => p.length >= 2);
    return torso ? { torso, arms } : undefined;
}

/** The hip of that figure — the topmost point shared by its legs. */
function hipOfFigure(scope: DrawingElement[], head: DrawingElement): [number, number] | null {
    const legs = legsOfFigure(scope, head);
    if (!legs.length) return null;
    // Every leg chain starts at the hip, so the first point of any of them will do.
    return legs[0][0];
}

/** The head a face/hair part belongs to (explicit link, else nearest centre). */
function headOf(part: DrawingElement, heads: DrawingElement[]): DrawingElement | undefined {
    if (part.sfHeadId) {
        const linked = heads.find(h => h.id === part.sfHeadId);
        if (linked) return linked;
    }
    const p = centerOf(part);
    let best: DrawingElement | undefined, bd = Infinity;
    for (const h of heads) {
        const q = centerOf(h);
        const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
        if (d < bd) { bd = d; best = h; }
    }
    return best;
}

/**
 * Restyle the face / hair of already-dropped figures, in place.
 *
 * The face is regenerated from each head part's *current* bounding box, so this
 * keeps working after the figure has been moved, scaled or ungrouped — the head
 * circle is the only thing it needs. Old face/hair parts are removed and the new
 * ones inherit the head's group and layer, as one undo step.
 *
 * Returns the number of figures (heads) restyled.
 */
export function restyleStickFace(ids: string[], choice: FaceHairChoice): number {
    if (isNoopChoice(choice)) return 0;
    const scope = expandToFigures(ids);
    const heads = scope.filter(e => e.sfRole === 'head');
    if (heads.length === 0) return 0;

    const removed = new Set<string>();
    const added: DrawingElement[] = [];
    const headPatches: { id: string; state: StickFaceState }[] = [];

    for (const head of heads) {
        const r = (head.width + head.height) / 4;
        if (!(r > 0)) continue;
        const cx = head.x + head.width / 2, cy = head.y + head.height / 2;
        const next = mergeChoice(
            { ...BARE_STATE, ...(head.sfFace as Partial<StickFaceState> | undefined) },
            choice);

        // Drop this head's existing face / hair / garment parts.
        for (const e of scope) {
            if (e.sfRole !== 'face' && e.sfRole !== 'hair' && e.sfRole !== 'garment') continue;
            if (headOf(e, heads)?.id === head.id) removed.add(e.id);
        }

        // Rebuild in world coordinates. The head circle rides along purely as a
        // registration mark: svg-import normalises to the content bbox, so we use
        // the imported head to recover the exact scale + offset, then discard it.
        //
        // A rotated figure needs its face rotated ABOUT THE HEAD, not about each
        // mark's own centre — so bake the rotation into the geometry here and leave
        // the resulting parts at angle 0. (The head circle itself is rotation-
        // invariant, which is why its bbox is still a reliable registration mark.)
        const deg = ((head.angle || 0) * 180) / Math.PI;
        const spin = deg ? `<g transform="rotate(${r1(deg)} ${r1(cx)} ${r1(cy)})">` : '';
        const markup = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${head.strokeColor || '#1f2937'}"`
            + ` stroke-width="7" stroke-linecap="round" stroke-linejoin="round">`
            + `<circle cx="${cx}" cy="${cy}" r="${r}" data-sf-role="head"/>`
            + spin + faceHairSvg(cx, cy, r, next)
            // Garments are rebuilt from the LEG parts, which carry their own world
            // geometry — no rotation baking needed, they are already where they are.
            + garmentSvg(legsOfFigure(scope, head), hipOfFigure(scope, head) ?? [cx, cy],
                { ...next, unit: (r / 22) * LEG_UNIT, upper: upperOfFigure(scope, head) })
            + (spin ? '</g>' : '') + `</svg>`;
        const parts = svgToElements(markup, { x: 0, y: 0 });
        const ref = parts.find(e => e.sfRole === 'head');
        if (!ref || !(ref.width > 0)) continue;
        const s = head.width / ref.width;
        placeOnHead(parts, s, head.x - ref.x * s, head.y - ref.y * s,
            head.strokeWidth ? head.strokeWidth / (r * SVG_STROKE_PER_R) : 1);

        const mono = stickColorMode() === 'mono';
        for (const e of parts) {
            if (e === ref) continue;
            e.groupIds = [...(head.groupIds || [])];
            e.layerId = head.layerId;
            e.opacity = head.opacity;
            e.sfHeadId = head.id;
            // Inherit the figure's look, or a sketch figure would grow a clean-line face.
            e.renderStyle = head.renderStyle;
            e.roughness = head.roughness;
            e.strokeStyle = head.strokeStyle;
            if (mono && (e.sfRole === 'hair' || e.sfRole === 'garment')) e.backgroundColor = 'transparent';
            added.push(e);
        }
        headPatches.push({ id: head.id, state: next });
    }

    if (added.length === 0 && removed.size === 0) return 0;
    // Faces and hair sit ON TOP of the figure, so appending is right for them. Garments
    // sit UNDER the bones, so they must be spliced in ahead of the first body part —
    // append them and the trousers would paint over the legs they are drawn from.
    const overlay = added.filter(e => e.sfRole !== 'garment');
    const underlay = added.filter(e => e.sfRole === 'garment');
    pushToHistory();
    batch(() => {
        setStore('elements', prev => {
            const kept = prev.filter(e => !removed.has(e.id));
            if (underlay.length === 0) return [...kept, ...overlay];
            const firstBody = kept.findIndex(e => e.sfRole === 'body');
            const at = firstBody < 0 ? kept.length : firstBody;
            return [...kept.slice(0, at), ...underlay, ...kept.slice(at), ...overlay];
        });
        for (const p of headPatches) {
            updateElement(p.id, {
                sfFace: p.state,
                ...(p.state.headFill ? { backgroundColor: '#ffffff' } : {}),
            });
        }
        setStore('selection', sel => sel.filter(id => !removed.has(id)).concat(added.map(e => e.id)));
    });
    bumpDirtyRevision();
    return headPatches.length;
}

/** The face/hair state of the first head part in `ids` (for showing current values). */
export function stickFaceStateOf(ids: string[]): StickFaceState | null {
    const head = expandToFigures(ids).find(e => e.sfRole === 'head' && e.sfFace);
    return head ? { ...(head.sfFace as StickFaceState) } : null;
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
            // Roles inherit from an ancestor `<g data-sf-role>` (hair, props…).
            const role = el.closest('[data-sf-role]')?.getAttribute('data-sf-role') ?? null;
            const isAccent = role === 'accent' || role === 'hair' || (!role && roleFromFill(fill) === 'accent');
            if (isAccent) el.setAttribute('fill', 'none');
        });
        const out = doc.documentElement.outerHTML;
        _monoCache.set(svg, out);
        return out;
    } catch { return svg; }
}

// ─── Faces & hair ───────────────────────────────────────────────────────────

/**
 * A face/hair choice. `'auto'` (the default) means "keep whatever the figure
 * already wears" — the pose's own expression and the variant's hairstyle — so a
 * caller can change hair without disturbing the expression, and vice versa.
 */
export interface FaceHairChoice {
    face?: FaceStyle | 'auto';
    hair?: HairStyle | 'auto';
    hairColor?: string;
    headFill?: boolean;
    /** Clothing. Like face and hair, `'auto'` means "leave as-is". */
    trousers?: TrouserStyle | 'auto';
    trouserColor?: string;
    shoes?: ShoeStyle | 'auto';
    shoeColor?: string;
    top?: TopStyle | 'auto';
    topColor?: string;
    neck?: NeckStyle | 'auto';
    neckColor?: string;
}

/** The face/hair a head part currently wears, as stored on the element. */
export interface StickFaceState {
    face: FaceStyle;
    hair: HairStyle;
    hairColor: string;
    headFill: boolean;
    trousers: TrouserStyle;
    trouserColor: string;
    shoes: ShoeStyle;
    shoeColor: string;
    top: TopStyle;
    topColor: string;
    neck: NeckStyle;
    neckColor: string;
}

/** Everything off — what a figure predating a given feature is treated as wearing. */
export const BARE_STATE: StickFaceState = {
    face: 'none', hair: 'none', hairColor: DEFAULT_HAIR_COLOR, headFill: false,
    trousers: 'none', trouserColor: DEFAULT_TROUSER_COLOR,
    shoes: 'none', shoeColor: DEFAULT_SHOE_COLOR,
    top: 'none', topColor: DEFAULT_TOP_COLOR,
    neck: 'none', neckColor: DEFAULT_NECK_COLOR,
};

const FACE_ATTR = 'data-sf-face', HAIR_ATTR = 'data-sf-hair', HAIR_COLOR_ATTR = 'data-sf-hair-color';
const TROUSER_ATTR = 'data-sf-trousers', TROUSER_COLOR_ATTR = 'data-sf-trouser-color';
const SHOE_ATTR = 'data-sf-shoes', SHOE_COLOR_ATTR = 'data-sf-shoe-color';
const TOP_ATTR = 'data-sf-top', TOP_COLOR_ATTR = 'data-sf-top-color';
const NECK_ATTR = 'data-sf-neck', NECK_COLOR_ATTR = 'data-sf-neck-color';

/** Read the face/hair state stamped on a head `<circle>` in an asset SVG. */
function readHeadState(el: Element): StickFaceState {
    return {
        face: asFaceStyle(el.getAttribute(FACE_ATTR), 'none'),
        hair: asHairStyle(el.getAttribute(HAIR_ATTR), 'none'),
        hairColor: el.getAttribute(HAIR_COLOR_ATTR) || DEFAULT_HAIR_COLOR,
        headFill: (el.getAttribute('fill') || 'none') !== 'none',
        trousers: asTrouserStyle(el.getAttribute(TROUSER_ATTR), 'none'),
        trouserColor: el.getAttribute(TROUSER_COLOR_ATTR) || DEFAULT_TROUSER_COLOR,
        shoes: asShoeStyle(el.getAttribute(SHOE_ATTR), 'none'),
        shoeColor: el.getAttribute(SHOE_COLOR_ATTR) || DEFAULT_SHOE_COLOR,
        top: asTopStyle(el.getAttribute(TOP_ATTR), 'none'),
        topColor: el.getAttribute(TOP_COLOR_ATTR) || DEFAULT_TOP_COLOR,
        neck: asNeckStyle(el.getAttribute(NECK_ATTR), 'none'),
        neckColor: el.getAttribute(NECK_COLOR_ATTR) || DEFAULT_NECK_COLOR,
    };
}

/** Resolve a choice against a head's current state. */
function mergeChoice(cur: StickFaceState, c: FaceHairChoice): StickFaceState {
    return {
        face: !c.face || c.face === 'auto' ? cur.face : asFaceStyle(c.face),
        hair: !c.hair || c.hair === 'auto' ? cur.hair : asHairStyle(c.hair),
        hairColor: c.hairColor ?? cur.hairColor,
        headFill: c.headFill ?? cur.headFill,
        trousers: !c.trousers || c.trousers === 'auto' ? cur.trousers : asTrouserStyle(c.trousers),
        trouserColor: c.trouserColor ?? cur.trouserColor,
        shoes: !c.shoes || c.shoes === 'auto' ? cur.shoes : asShoeStyle(c.shoes),
        shoeColor: c.shoeColor ?? cur.shoeColor,
        top: !c.top || c.top === 'auto' ? cur.top : asTopStyle(c.top),
        topColor: c.topColor ?? cur.topColor,
        neck: !c.neck || c.neck === 'auto' ? cur.neck : asNeckStyle(c.neck),
        neckColor: c.neckColor ?? cur.neckColor,
    };
}

/** True if the choice would leave every head exactly as it is. */
const isNoopChoice = (c: FaceHairChoice): boolean =>
    (!c.face || c.face === 'auto') && (!c.hair || c.hair === 'auto')
    && (!c.trousers || c.trousers === 'auto') && (!c.shoes || c.shoes === 'auto')
    && (!c.top || c.top === 'auto') && (!c.neck || c.neck === 'auto')
    && c.hairColor === undefined && c.headFill === undefined
    && c.trouserColor === undefined && c.shoeColor === undefined
    && c.topColor === undefined && c.neckColor === undefined;

/**
 * The anchor points of a path `d` string — the endpoint of every command.
 *
 * Leg bones are stored as smoothed beziers (`M…Q…` / `M…C…`), but the bow is purely
 * cosmetic: the endpoints ARE hip / knee / ankle, which is all a garment needs. So we
 * read endpoints rather than flattening curves.
 */
function pathAnchorPoints(d: string): Array<[number, number]> {
    const out: Array<[number, number]> = [];
    const re = /([MLQCTSA])([^MLQCTSAZz]*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(d))) {
        const nums = m[2].trim().split(/[\s,]+/).map(Number).filter(Number.isFinite);
        if (nums.length >= 2) out.push([nums[nums.length - 2], nums[nums.length - 1]]);
    }
    return out;
}

/** Leg polylines + hip from an asset SVG's tagged leg paths. */
function legsFromSvg(root: Element): { legs: Array<Array<[number, number]>>; hip: [number, number] | null } {
    const legs = Array.from(root.querySelectorAll('[data-sf-part="leg"]'))
        .map(n => pathAnchorPoints(n.getAttribute('d') || ''))
        .filter(p => p.length >= 2);
    return { legs, hip: legs.length ? legs[0][0] : null };
}

/** Torso + arm polylines from an asset SVG, for tops and neckwear. */
function upperFromSvg(root: Element) {
    const pick = (part: string) => Array.from(root.querySelectorAll(`[data-sf-part="${part}"]`))
        .map(n => pathAnchorPoints(n.getAttribute('d') || ''))
        .filter(p => p.length >= 2);
    const torso = pick('torso')[0];
    return torso ? { torso, arms: pick('arm') } : undefined;
}

/** Parse `markup` in its own document and import the nodes into `doc`. */
function svgFragment(doc: Document, markup: string): Node[] {
    const wrap = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
    if (wrap.querySelector('parsererror')) return [];
    return Array.from(wrap.documentElement.childNodes).map(n => doc.importNode(n, true));
}

const _faceCache = new Map<string, string>();

/**
 * Restyle the face/hair of every figure in an asset SVG.
 *
 * Works on anything carrying a `data-sf-role="head"` circle — a single pose, a
 * multi-figure scene, or a baked animation frame — because the face is derived
 * from the head circle alone. Existing face/hair groups are removed and
 * regenerated (so it is idempotent: re-applying never accumulates marks), and
 * the head is re-stamped with its new state. Cached per (svg, choice).
 */
export function applyFaceHair(svg: string, choice: FaceHairChoice = {}): string {
    if (isNoopChoice(choice)) return svg;
    const key = `${svg}|${choice.face ?? 'auto'}|${choice.hair ?? 'auto'}|${choice.hairColor ?? ''}|${choice.headFill === undefined ? '-' : +choice.headFill}`;
    const hit = _faceCache.get(key);
    if (hit) return hit;
    try {
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror')) return svg;
        const root = doc.documentElement;
        root.querySelectorAll('[data-sf-role="face"], [data-sf-role="hair"], [data-sf-role="garment"]')
            .forEach(n => n.remove());

        // Garments are per-FIGURE, derived from the leg bones rather than the head, and
        // must be inserted ahead of everything so the skeleton draws over them.
        const { legs, hip } = legsFromSvg(root);
        const upper = upperFromSvg(root);
        root.querySelectorAll('[data-sf-role="head"]').forEach(h => {
            const cx = parseFloat(h.getAttribute('cx') || '');
            const cy = parseFloat(h.getAttribute('cy') || '');
            const r = parseFloat(h.getAttribute('r') || '');
            if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(r)) return;
            const next = mergeChoice(readHeadState(h), choice);
            h.setAttribute(FACE_ATTR, next.face);
            h.setAttribute(HAIR_ATTR, next.hair);
            h.setAttribute(HAIR_COLOR_ATTR, next.hairColor);
            if (next.headFill) h.setAttribute('fill', '#ffffff'); else h.removeAttribute('fill');
            h.setAttribute(TROUSER_ATTR, next.trousers);
            h.setAttribute(TROUSER_COLOR_ATTR, next.trouserColor);
            h.setAttribute(SHOE_ATTR, next.shoes);
            h.setAttribute(SHOE_COLOR_ATTR, next.shoeColor);
            const nodes = svgFragment(doc, faceHairSvg(cx, cy, r, next));
            const anchor = h.nextSibling;
            for (const n of nodes) h.parentNode?.insertBefore(n, anchor);
        });

        // One garment pass per document. Multi-figure scenes are built from composed
        // `figureInner` markup and keep the garments their poses were built with, so we
        // only re-clothe when there is a single, unambiguous set of legs.
        const heads = root.querySelectorAll('[data-sf-role="head"]');
        if (heads.length === 1 && legs.length && hip) {
            const state = readHeadState(heads[0]);
            const r = parseFloat(heads[0].getAttribute('r') || '22') || 22;
            const g = garmentSvg(legs, hip, { ...state, unit: (r / 22) * LEG_UNIT, upper });
            if (g) {
                const nodes = svgFragment(doc, g);
                const first = root.firstChild;
                for (const n of nodes) root.insertBefore(n, first);
            }
        }
        const out = root.outerHTML;
        _faceCache.set(key, out);
        return out;
    } catch { return svg; }
}

/** The head states in an asset SVG, in document order (matches import order). */
function headStatesOf(svg: string): StickFaceState[] {
    try {
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror')) return [];
        return Array.from(doc.documentElement.querySelectorAll('[data-sf-role="head"]')).map(readHeadState);
    } catch { return []; }
}

/** Centre of an element's bounding box. */
const centerOf = (e: DrawingElement) => ({ x: e.x + e.width / 2, y: e.y + e.height / 2 });

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Point each face/hair part at the head it belongs to (nearest head centre), and
 * record each head's face/hair state on the head element. Both are what make a
 * dropped figure restyleable later.
 */
function linkFaceParts(els: DrawingElement[], states: StickFaceState[]): void {
    const heads = els.filter(e => e.sfRole === 'head');
    if (heads.length === 0) return;
    heads.forEach((h, i) => { if (states[i]) h.sfFace = { ...states[i] }; });
    for (const e of els) {
        if (e.sfRole !== 'face' && e.sfRole !== 'hair') continue;
        const p = centerOf(e);
        let best = heads[0], bd = Infinity;
        for (const h of heads) {
            const q = centerOf(h);
            const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
            if (d < bd) { bd = d; best = h; }
        }
        e.sfHeadId = best.id;
    }
}

// ─── Animated figures (stickRig element) ────────────────────────────────────

/** Aspect ratio of the animation rig frame. */
const RIG_ASPECT = RIG_H / RIG_W;
let _rigCounter = 0;

export interface InsertAnimatedOptions {
    x?: number; y?: number; width?: number; facing?: 1 | -1; speed?: number;
    face?: FaceStyle; hair?: HairStyle; hairColor?: string; headFill?: boolean;
    trousers?: TrouserStyle; trouserColor?: string; shoes?: ShoeStyle; shoeColor?: string;
    top?: TopStyle; topColor?: string; neck?: NeckStyle; neckColor?: string;
}

/**
 * Insert an animated stick figure (element `type: 'stickRig'`) playing a motion clip.
 * The figure animates from the global clock; stroke colour/width are normal element
 * props. Returns the new element id.
 */
export function insertAnimatedFigure(clip = 'walk', opts: InsertAnimatedOptions = {}): string {
    const pref = stickFacePref();
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
        stickRig: {
            clip, facing: opts.facing ?? 1, speed: opts.speed ?? 1, playing: true,
            // An animated figure gets the same default face as a dropped one.
            face: asFaceStyle(opts.face ?? (pref.face === 'auto' ? 'neutral' : pref.face), 'neutral'),
            hair: asHairStyle(opts.hair ?? (pref.hair === 'auto' ? 'short' : pref.hair), 'short'),
            hairColor: opts.hairColor ?? pref.hairColor,
            headFill: opts.headFill ?? pref.headFill,
            trousers: asTrouserStyle(opts.trousers ?? (pref.trousers === 'auto' ? 'none' : pref.trousers), 'none'),
            trouserColor: opts.trouserColor ?? pref.trouserColor,
            shoes: asShoeStyle(opts.shoes ?? (pref.shoes === 'auto' ? 'none' : pref.shoes), 'none'),
            shoeColor: opts.shoeColor ?? pref.shoeColor,
            top: asTopStyle(opts.top ?? (pref.top === 'auto' ? 'none' : pref.top), 'none'),
            topColor: opts.topColor ?? pref.topColor,
            neck: asNeckStyle(opts.neck ?? (pref.neck === 'auto' ? 'none' : pref.neck), 'none'),
            neckColor: opts.neckColor ?? pref.neckColor,
        },
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

/**
 * Change the face / hair of the selected/given animated figures. Unlike dropped
 * figures nothing has to be regenerated — the renderer draws the face from the
 * live head position each frame, so this is a plain payload patch.
 */
export function setAnimatedFigureFace(ids: string[], choice: FaceHairChoice): number {
    const rigs = store.elements.filter(e => ids.includes(e.id) && e.type === 'stickRig');
    if (!rigs.length || isNoopChoice(choice)) return 0;
    pushToHistory();
    batch(() => {
        for (const e of rigs) {
            const d = (e.stickRig || {}) as any;
            const next = mergeChoice(rigState(d), choice);
            updateElement(e.id, { stickRig: { ...d, ...next } });
        }
    });
    bumpDirtyRevision();
    return rigs.length;
}

/** The face/hair of the first selected animated figure (for showing current values). */
export function animatedFigureFaceState(ids: string[]): StickFaceState | null {
    const el = store.elements.find(e => ids.includes(e.id) && e.type === 'stickRig');
    if (!el) return null;
    return rigState((el.stickRig || {}) as any);
}

/** The appearance an animated figure's payload describes. */
function rigState(d: any): StickFaceState {
    return {
        face: asFaceStyle(d.face, 'neutral'),
        hair: asHairStyle(d.hair, 'none'),
        hairColor: d.hairColor || DEFAULT_HAIR_COLOR,
        headFill: !!d.headFill,
        trousers: asTrouserStyle(d.trousers, 'none'),
        trouserColor: d.trouserColor || DEFAULT_TROUSER_COLOR,
        shoes: asShoeStyle(d.shoes, 'none'),
        shoeColor: d.shoeColor || DEFAULT_SHOE_COLOR,
        top: asTopStyle(d.top, 'none'),
        topColor: d.topColor || DEFAULT_TOP_COLOR,
        neck: asNeckStyle(d.neck, 'none'),
        neckColor: d.neckColor || DEFAULT_NECK_COLOR,
    };
}

/**
 * Set the playback rate of the selected/given animated figures. 1 = authored
 * speed. Applies to in-place clips, action sequences AND path-following, so one
 * control means the same thing everywhere.
 */
export function setAnimatedFigureSpeed(ids: string[], speed: number): number {
    const rigs = store.elements.filter(e => ids.includes(e.id) && e.type === 'stickRig');
    if (!rigs.length) return 0;
    const v = Math.min(8, Math.max(0.05, speed));
    batch(() => {
        for (const e of rigs) updateElement(e.id, { stickRig: { ...(e.stickRig as any), speed: v } });
    });
    bumpDirtyRevision();
    return rigs.length;
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
    // The face/hair the rig is wearing bakes with it.
    const face: FaceOpts = {
        face: asFaceStyle(data.face, 'neutral'),
        hair: asHairStyle(data.hair, 'none'),
        hairColor: (data as any).hairColor,
        headFill: (data as any).headFill,
    };
    const svg = rigPoseToSvg(rig, poseAt(data.clip || 'idle', phase, rig.facing), RIG_W, RIG_H, face, {
        trousers: asTrouserStyle((data as any).trousers, 'none'),
        trouserColor: (data as any).trouserColor,
        shoes: asShoeStyle((data as any).shoes, 'none'),
        shoeColor: (data as any).shoeColor,
        top: asTopStyle((data as any).top, 'none'),
        topColor: (data as any).topColor,
        neck: asNeckStyle((data as any).neck, 'none'),
        neckColor: (data as any).neckColor,
    });
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
    linkFaceParts(els, headStatesOf(svg));
    pushToHistory();
    batch(() => {
        setStore('elements', prev => [...prev.filter(e => e.id !== id), ...els]);
        setStore('selection', els.map(e => e.id));
    });
    bumpDirtyRevision();
    return els.map(e => e.id);
}
