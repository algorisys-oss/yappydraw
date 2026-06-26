/**
 * Time-lapse frame store (IndexedDB).
 *
 * Procreate-style process recording captures one downscaled frame per committed
 * edit. Those frames are many and large-ish, so they must NOT live in the
 * localStorage auto-save JSON (5–10MB cap, synchronous). This is the first
 * IndexedDB-backed store in the app (see docs/timelapse-spec.md §4).
 *
 * Layout:
 *   db  `yappy-timelapse`
 *     store `frames`     keyed by blobKey (`${recordingId}:${seq}`) → Blob
 *     store `recordings` keyed by id                               → TimelapseManifest
 *
 * Only the active recording id is stored back in the document; the heavy blobs
 * stay here and are discoverable after reload via the manifest.
 */

const DB_NAME = 'yappy-timelapse';
const DB_VERSION = 1;
const FRAMES_STORE = 'frames';
const RECORDINGS_STORE = 'recordings';

/** Ordered metadata for a single captured frame (the blob lives in `frames`). */
export interface TimelapseFrame {
    seq: number;       // monotonic index within the recording
    t: number;         // ms elapsed since recording start (for variable-speed replay)
    blobKey: string;   // key into the `frames` store: `${recordingId}:${seq}`
    w: number;
    h: number;
}

/** Per-recording manifest (lightweight — holds frame metadata, not blobs). */
export interface TimelapseManifest {
    id: string;
    docId: string;       // ties the recording to a drawing (menu.tsx drawingId())
    startedAt: number;   // epoch ms
    updatedAt: number;   // epoch ms
    captureW: number;    // capture resolution (longest edge target)
    frames: TimelapseFrame[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(FRAMES_STORE)) {
                db.createObjectStore(FRAMES_STORE);
            }
            if (!db.objectStoreNames.contains(RECORDINGS_STORE)) {
                db.createObjectStore(RECORDINGS_STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    // Reset the cached promise on failure so a later call can retry.
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
}

/** Promisify a single-request transaction. */
function tx<T>(
    storeName: string,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    return openDb().then(db => new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = run(transaction.objectStore(storeName));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    }));
}

// ─── Frames ─────────────────────────────────────────────────────────────────

export function putFrame(blobKey: string, blob: Blob): Promise<void> {
    return tx<IDBValidKey>(FRAMES_STORE, 'readwrite', s => s.put(blob, blobKey)).then(() => undefined);
}

export function getFrame(blobKey: string): Promise<Blob | undefined> {
    return tx<Blob | undefined>(FRAMES_STORE, 'readonly', s => s.get(blobKey));
}

export function deleteFrame(blobKey: string): Promise<void> {
    return tx<undefined>(FRAMES_STORE, 'readwrite', s => s.delete(blobKey) as IDBRequest<undefined>).then(() => undefined);
}

// ─── Manifests ────────────────────────────────────────────────────────────────

export function saveManifest(manifest: TimelapseManifest): Promise<void> {
    return tx<IDBValidKey>(RECORDINGS_STORE, 'readwrite', s => s.put(manifest)).then(() => undefined);
}

export function getManifest(id: string): Promise<TimelapseManifest | undefined> {
    return tx<TimelapseManifest | undefined>(RECORDINGS_STORE, 'readonly', s => s.get(id));
}

export function listRecordings(): Promise<TimelapseManifest[]> {
    return tx<TimelapseManifest[]>(RECORDINGS_STORE, 'readonly', s => s.getAll() as IDBRequest<TimelapseManifest[]>)
        .then(rows => rows || []);
}

/** Delete a recording's manifest AND all of its frame blobs. */
export async function deleteRecording(id: string): Promise<void> {
    const manifest = await getManifest(id);
    if (manifest) {
        await Promise.all(manifest.frames.map(f => deleteFrame(f.blobKey).catch(() => {})));
    }
    await tx<undefined>(RECORDINGS_STORE, 'readwrite', s => s.delete(id) as IDBRequest<undefined>).then(() => undefined);
}

/**
 * Garbage-collect recordings whose document no longer exists. Call on doc load
 * with the set of still-live doc ids (see docs/timelapse-spec.md §4 lifecycle).
 */
export async function pruneToDocIds(keepDocIds: Set<string>): Promise<number> {
    const recordings = await listRecordings();
    const stale = recordings.filter(r => !keepDocIds.has(r.docId));
    await Promise.all(stale.map(r => deleteRecording(r.id).catch(() => {})));
    return stale.length;
}
