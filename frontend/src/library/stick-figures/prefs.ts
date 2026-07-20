/**
 * Stick-figure library preferences — favourites, recents, colour mode, and the
 * face/hair the panel drops figures with.
 * Backed by localStorage and exposed as Solid signals so the panel reacts.
 */
import { createSignal } from 'solid-js';
import { asFaceStyle, asHairStyle, DEFAULT_HAIR_COLOR, type FaceStyle, type HairStyle } from './face';
import {
    asTrouserStyle, asShoeStyle, asTopStyle, asNeckStyle,
    DEFAULT_TROUSER_COLOR, DEFAULT_SHOE_COLOR, DEFAULT_TOP_COLOR, DEFAULT_NECK_COLOR,
    type TrouserStyle, type ShoeStyle, type TopStyle, type NeckStyle,
} from './garments';

const FAV_KEY = 'yappy.stickFigures.favorites';
const RECENT_KEY = 'yappy.stickFigures.recents';
const MODE_KEY = 'yappy.stickFigures.colorMode';
const FACE_KEY = 'yappy.stickFigures.face';
const RECENT_MAX = 14;

function load<T>(key: string, fallback: T): T {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; }
    catch { return fallback; }
}
function save(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
}

// ─── Favourites ─────────────────────────────────────────────────────────────
const [favorites, setFavorites] = createSignal<string[]>(load(FAV_KEY, []));
export const stickFavorites = favorites;
export const isStickFavorite = (id: string): boolean => favorites().includes(id);
export function toggleStickFavorite(id: string): void {
    const cur = favorites();
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [id, ...cur];
    setFavorites(next); save(FAV_KEY, next);
}

// ─── Recents ────────────────────────────────────────────────────────────────
const [recents, setRecents] = createSignal<string[]>(load(RECENT_KEY, []));
export const stickRecents = recents;
export function pushStickRecent(id: string): void {
    const next = [id, ...recents().filter(x => x !== id)].slice(0, RECENT_MAX);
    setRecents(next); save(RECENT_KEY, next);
}

// ─── Colour mode ────────────────────────────────────────────────────────────
export type StickColorMode = 'color' | 'mono';
const [colorMode, setColorMode] = createSignal<StickColorMode>(load(MODE_KEY, 'color'));
export const stickColorMode = colorMode;
export function setStickColorMode(mode: StickColorMode): void {
    setColorMode(mode); save(MODE_KEY, mode);
}

// ─── Face & hair ────────────────────────────────────────────────────────────

/**
 * The face/hair figures drop with. `face`/`hair` may be `'auto'`, meaning "let
 * the pose and the character variant decide" — that's the default, so the
 * library keeps its per-pose expressions and per-variant hairstyles until the
 * user explicitly picks one.
 */
export interface StickFacePref {
    face: FaceStyle | 'auto';
    hair: HairStyle | 'auto';
    hairColor: string;
    headFill: boolean;
    trousers: TrouserStyle | 'auto';
    trouserColor: string;
    shoes: ShoeStyle | 'auto';
    shoeColor: string;
    top: TopStyle | 'auto';
    topColor: string;
    neck: NeckStyle | 'auto';
    neckColor: string;
}

const FACE_DEFAULT: StickFacePref = {
    face: 'auto', hair: 'auto', hairColor: DEFAULT_HAIR_COLOR, headFill: false,
    // 'auto' keeps the variant default, which is "no trousers, skirt for the feminine
    // variants" — i.e. exactly how the library looked before garments existed.
    trousers: 'auto', trouserColor: DEFAULT_TROUSER_COLOR,
    shoes: 'auto', shoeColor: DEFAULT_SHOE_COLOR,
    top: 'auto', topColor: DEFAULT_TOP_COLOR,
    neck: 'auto', neckColor: DEFAULT_NECK_COLOR,
};

/** Normalise a persisted (possibly stale) preference blob. */
function normFacePref(v: Partial<StickFacePref> | null): StickFacePref {
    if (!v || typeof v !== 'object') return { ...FACE_DEFAULT };
    return {
        face: v.face === 'auto' || v.face === undefined ? 'auto' : asFaceStyle(v.face),
        hair: v.hair === 'auto' || v.hair === undefined ? 'auto' : asHairStyle(v.hair),
        hairColor: typeof v.hairColor === 'string' ? v.hairColor : DEFAULT_HAIR_COLOR,
        headFill: !!v.headFill,
        trousers: v.trousers === 'auto' || v.trousers === undefined ? 'auto' : asTrouserStyle(v.trousers),
        trouserColor: typeof v.trouserColor === 'string' ? v.trouserColor : DEFAULT_TROUSER_COLOR,
        shoes: v.shoes === 'auto' || v.shoes === undefined ? 'auto' : asShoeStyle(v.shoes),
        shoeColor: typeof v.shoeColor === 'string' ? v.shoeColor : DEFAULT_SHOE_COLOR,
        top: v.top === 'auto' || v.top === undefined ? 'auto' : asTopStyle(v.top),
        topColor: typeof v.topColor === 'string' ? v.topColor : DEFAULT_TOP_COLOR,
        neck: v.neck === 'auto' || v.neck === undefined ? 'auto' : asNeckStyle(v.neck),
        neckColor: typeof v.neckColor === 'string' ? v.neckColor : DEFAULT_NECK_COLOR,
    };
}

const [facePref, setFacePrefSignal] = createSignal<StickFacePref>(
    normFacePref(load<Partial<StickFacePref> | null>(FACE_KEY, null)));
export const stickFacePref = facePref;

/** Patch the drop-time face/hair preference. */
export function setStickFacePref(patch: Partial<StickFacePref>): void {
    const next = normFacePref({ ...facePref(), ...patch });
    setFacePrefSignal(next); save(FACE_KEY, next);
}
