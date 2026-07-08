/**
 * Stick-figure library preferences — favourites, recents, and colour mode.
 * Backed by localStorage and exposed as Solid signals so the panel reacts.
 */
import { createSignal } from 'solid-js';

const FAV_KEY = 'yappy.stickFigures.favorites';
const RECENT_KEY = 'yappy.stickFigures.recents';
const MODE_KEY = 'yappy.stickFigures.colorMode';
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
