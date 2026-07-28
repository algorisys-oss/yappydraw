/**
 * Asset Library — reusable artwork that outlives the document.
 *
 * Symbols (`store.symbols`) are deliberately per-document: an instance is a live link
 * back to its definition, so both have to travel together inside one file. The library
 * is the other half of that story — a personal shelf of trees, rocks, clouds and props
 * you accumulate across projects and drop into any new one. Assets are plain snapshots
 * (normalized to a 0,0 origin, fresh ids on insert), NOT instances: once inserted they
 * are ordinary editable elements with no link back here.
 *
 * Layout mirrors `drawings-store` so listing never loads bodies:
 *   IndexedDB `yappy:assets:index`  — AssetMeta[] (id, name, size, thumb…)
 *   IndexedDB `yappy:asset:<id>`    — DrawingElement[] as JSON, one key each
 *
 * Like the drawings gallery this is convenience storage, not durable backup — it lives
 * in this browser profile. Export a .yappy document if the artwork matters.
 */

import { idbGet, idbSet, idbDelete } from './idb-kv';
import { requestPersistentStorage } from './persistent-storage';
import type { DrawingElement } from '../types';

const INDEX_KEY = 'yappy:assets:index';
const ASSET_KEY = (id: string) => `yappy:asset:${id}`;

export interface AssetMeta {
    id: string;
    name: string;
    /** Intrinsic size of the snapshot, so the panel can lay out thumbnails. */
    width: number;
    height: number;
    elementCount: number;
    createdAt: string;
    updatedAt: string;
    /** Small PNG data-URL preview. */
    thumb?: string;
}

/** Longest edge of a stored thumbnail, in px. */
const THUMB_MAX = 128;

/**
 * Shrink a captured data-URL to at most THUMB_MAX on its longest edge.
 *
 * The capture helper renders at the selection's natural size, supersampled 2× — for a
 * big selection that is a multi-megabyte PNG. Thumbnails live in the INDEX, which is
 * read in full every time the panel lists assets, so an unbounded thumb would make
 * listing progressively slower and could blow past storage quota after a few saves.
 * (`doc-thumbnails` bounds the drawings-gallery previews the same way.)
 *
 * Resolves to the original URL if anything goes wrong — a chunky thumbnail is a much
 * smaller problem than a failed save.
 */
export function downscaleDataUrl(dataUrl: string, max = THUMB_MAX): Promise<string> {
    return new Promise(resolve => {
        try {
            const img = new Image();
            img.onload = () => {
                try {
                    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
                    if (!w || !h) { resolve(dataUrl); return; }
                    const scale = Math.min(1, max / Math.max(w, h));
                    if (scale >= 1) { resolve(dataUrl); return; }   // already small enough
                    const cv = document.createElement('canvas');
                    cv.width = Math.max(1, Math.round(w * scale));
                    cv.height = Math.max(1, Math.round(h * scale));
                    const ctx = cv.getContext('2d');
                    if (!ctx) { resolve(dataUrl); return; }
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, cv.width, cv.height);
                    resolve(cv.toDataURL('image/png'));            // PNG keeps artwork transparency
                } catch { resolve(dataUrl); }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        } catch { resolve(dataUrl); }
    });
}

function newId(): string {
    const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return `a-${rand}`;
}

async function readIndex(): Promise<AssetMeta[]> {
    const idx = (await idbGet<AssetMeta[]>(INDEX_KEY)) ?? [];
    if (!Array.isArray(idx)) return [];
    // newest first, regardless of historical write order
    return idx.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

async function writeIndex(index: AssetMeta[]): Promise<void> {
    await idbSet(INDEX_KEY, index);
}

/** Library metadata, newest first (no element bodies loaded). */
export async function listAssets(): Promise<AssetMeta[]> {
    return readIndex();
}

/**
 * Store a snapshot. `elements` must already be normalized to a 0,0 origin (the caller
 * knows the bounding box it measured). Passing an existing `id` updates in place.
 */
export async function saveAsset(
    name: string,
    elements: DrawingElement[],
    width: number,
    height: number,
    opts: { id?: string; thumb?: string } = {},
): Promise<AssetMeta | null> {
    if (!Array.isArray(elements) || elements.length === 0) return null;
    void requestPersistentStorage();

    const now = new Date().toISOString();
    const index = await readIndex();
    const existing = opts.id ? index.find(a => a.id === opts.id) : undefined;
    const id = existing?.id ?? opts.id ?? newId();

    const meta: AssetMeta = {
        id,
        name: (name || '').trim() || existing?.name || 'Asset',
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
        elementCount: elements.length,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        thumb: opts.thumb ?? existing?.thumb,
    };

    await idbSet(ASSET_KEY(id), JSON.stringify(elements));
    await writeIndex([meta, ...index.filter(a => a.id !== id)]);
    return meta;
}

/** The stored elements for one asset (null if missing or corrupt). */
export async function getAssetElements(id: string): Promise<DrawingElement[] | null> {
    const json = await idbGet<string>(ASSET_KEY(id));
    if (!json) return null;
    try {
        const parsed = JSON.parse(json);
        return Array.isArray(parsed) ? parsed as DrawingElement[] : null;
    } catch {
        console.warn('[asset-library] corrupt asset body:', id);
        return null;
    }
}

export async function renameAsset(id: string, name: string): Promise<void> {
    const clean = (name || '').trim() || 'Asset';
    const index = await readIndex();
    const meta = index.find(a => a.id === id);
    if (!meta) return;
    meta.name = clean;
    meta.updatedAt = new Date().toISOString();
    await writeIndex(index);
}

export async function deleteAsset(id: string): Promise<void> {
    const index = await readIndex();
    await writeIndex(index.filter(a => a.id !== id));
    await idbDelete(ASSET_KEY(id));
}

/** Count of saved assets (cheap — index only). */
export async function countAssets(): Promise<number> {
    return (await readIndex()).length;
}
