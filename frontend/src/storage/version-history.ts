/**
 * Version history — periodic document snapshots in IndexedDB.
 *
 * The autosave pipeline calls maybeSnapshotVersion() on every save; a new
 * version is recorded at most every SNAPSHOT_INTERVAL_MS (or on demand via
 * snapshotVersionNow). The index (small metadata array) and the full document
 * JSON (one IDB key per version) are stored separately so listing versions
 * never loads document bodies. Oldest versions are pruned beyond MAX_VERSIONS.
 */

import { idbGet, idbSet, idbDelete } from './idb-kv';
import { loadDocument } from '../store/app-store';
import { captureDocThumbnail } from './doc-thumbnails';

const INDEX_KEY = 'yappy:versions:index';
const VERSION_KEY = (id: string) => `yappy:version:${id}`;
const SNAPSHOT_INTERVAL_MS = 3 * 60 * 1000;
const MAX_VERSIONS = 15;

export interface VersionMeta {
    id: string;
    timestamp: string;
    name: string;
    docType?: string;
    elementCount: number;
    pageCount: number;
    sizeBytes: number;
    /** Set for manual snapshots (snapshotVersionNow). */
    label?: string;
    /** Small page preview (JPEG data URL) captured at snapshot time. */
    thumb?: string;
}

let lastSnapshotAt = 0;
let lastSnapshotSize = 0;

async function readIndex(): Promise<VersionMeta[]> {
    return (await idbGet<VersionMeta[]>(INDEX_KEY)) ?? [];
}

async function writeIndex(index: VersionMeta[]): Promise<void> {
    await idbSet(INDEX_KEY, index);
}

async function saveSnapshot(json: string, meta: Omit<VersionMeta, 'id' | 'timestamp' | 'sizeBytes'>): Promise<VersionMeta> {
    let thumb: string | undefined;
    try { thumb = captureDocThumbnail(); } catch { /* preview is best-effort */ }
    const entry: VersionMeta = {
        ...meta,
        thumb,
        id: `v-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        timestamp: new Date().toISOString(),
        sizeBytes: json.length,
    };
    const index = await readIndex();
    index.unshift(entry);
    const pruned = index.splice(MAX_VERSIONS);
    await idbSet(VERSION_KEY(entry.id), json);
    await writeIndex(index);
    for (const old of pruned) void idbDelete(VERSION_KEY(old.id));
    return entry;
}

/**
 * Called from the autosave pipeline. Records a version if enough time has
 * passed since the last one and the document actually changed size.
 */
export async function maybeSnapshotVersion(
    json: string,
    meta: { name: string; docType?: string; elementCount: number; pageCount: number },
): Promise<void> {
    const now = Date.now();
    if (now - lastSnapshotAt < SNAPSHOT_INTERVAL_MS) return;
    if (json.length === lastSnapshotSize) return; // unchanged since last version
    lastSnapshotAt = now;
    lastSnapshotSize = json.length;
    try {
        await saveSnapshot(json, meta);
    } catch (e) {
        console.warn('[version-history] snapshot failed:', e);
    }
}

/** Record a version immediately (Menu → Version History → Snapshot now). */
export async function snapshotVersionNow(
    json: string,
    meta: { name: string; docType?: string; elementCount: number; pageCount: number },
    label?: string,
): Promise<VersionMeta> {
    lastSnapshotAt = Date.now();
    lastSnapshotSize = json.length;
    return saveSnapshot(json, { ...meta, label });
}

/** Version metadata, newest first. */
export async function listVersions(): Promise<VersionMeta[]> {
    return readIndex();
}

/** Load a version's document back into the editor. */
export async function restoreVersion(id: string): Promise<boolean> {
    const json = await idbGet<string>(VERSION_KEY(id));
    if (!json) return false;
    try {
        loadDocument(JSON.parse(json));
        return true;
    } catch (e) {
        console.error('[version-history] restore failed:', e);
        return false;
    }
}

export async function deleteVersion(id: string): Promise<void> {
    const index = await readIndex();
    await writeIndex(index.filter(v => v.id !== id));
    await idbDelete(VERSION_KEY(id));
}
