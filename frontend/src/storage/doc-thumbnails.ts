/**
 * Document thumbnails for the Open dialog — a small IndexedDB map of
 * drawing id → preview data URL, captured client-side at save time. Keeps the
 * backend list API untouched (it only returns ids/names).
 */

import { idbGet, idbSet } from './idb-kv';
import { store } from '../store/app-store';
import { exportPageToPng } from '../utils/export';

const KEY = 'yappy:doc-thumbs';
const THUMB_WIDTH = 220;

export type ThumbRecord = { thumb: string; updatedAt: string; isGame?: boolean; mode?: 'visual' | 'code' };
type ThumbMap = Record<string, ThumbRecord>;

export async function getDocThumbnails(): Promise<ThumbMap> {
    return (await idbGet<ThumbMap>(KEY)) ?? {};
}

/** Is the CURRENT document a game (has behaviors / a blueprint / a script)? */
function currentDocIsGame(): boolean {
    const bp = store.blueprints ?? {};
    return (store.sceneBehaviors?.length ?? 0) > 0
        || store.elements.some(e => (e.behaviors?.length ?? 0) > 0)
        || Object.values(bp).some(g => (g?.nodes?.length ?? 0) > 0)
        || !!store.gameScript?.trim()
        || store.gameAuthoringMode === 'code';
}

/** Render a small preview of the active page (paged and infinite docs both
 *  keep their content in Slide frames, so page-exact export covers both). */
export function captureDocThumbnail(): string | undefined {
    const slide = store.slides[store.activeSlideIndex] || store.slides[0];
    if (slide) {
        const scale = Math.min(1, THUMB_WIDTH / Math.max(1, slide.dimensions.width));
        const url = exportPageToPng(store.slides.indexOf(slide), scale, false, 'jpeg');
        if (url) return url;
        // Fall back to the live page thumbnail if the fresh render failed
        if (slide.thumbnail) return slide.thumbnail;
    }
    return undefined;
}

export async function setDocThumbnail(id: string, thumb?: string): Promise<void> {
    const dataURL = thumb ?? captureDocThumbnail();
    if (!dataURL) return;
    const map = await getDocThumbnails();
    map[id] = { thumb: dataURL, updatedAt: new Date().toISOString(), isGame: currentDocIsGame(), mode: store.gameAuthoringMode };
    await idbSet(KEY, map);
}

export async function removeDocThumbnail(id: string): Promise<void> {
    const map = await getDocThumbnails();
    if (id in map) {
        delete map[id];
        await idbSet(KEY, map);
    }
}
