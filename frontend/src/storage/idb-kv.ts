/**
 * Tiny promise-based IndexedDB key-value store (no dependencies).
 *
 * Used for browser-side data that outgrows localStorage's ~5 MB quota:
 * autosave documents, user templates, brand kits. IndexedDB is supported in
 * all modern browsers including iOS Safari. Values are stored via structured
 * clone (objects go in directly — no JSON round-trip).
 *
 * Falls back to an in-memory map when IndexedDB is unavailable (e.g. some
 * private-browsing modes), so callers never have to branch.
 */

const DB_NAME = 'yappy';
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase | null> | null = null;
const memoryFallback = new Map<string, unknown>();

/**
 * Why the last open failed, or null while storage is healthy.
 *
 * EVERYTHING the user keeps locally — the drawings gallery, autosave, version
 * history — is behind this one handle. So a single failed open makes all three
 * look *deleted*: `idbGet` falls through to an empty in-memory map, the gallery
 * renders its "nothing saved yet" empty state, and there is no autosave or
 * version history to fall back on either. Nothing has actually been lost — the
 * data is still on disk — but the app said otherwise, silently.
 *
 * Callers use this to tell "you have no drawings" apart from "I cannot read
 * your drawings right now", which are the same screen otherwise.
 */
export type IdbFailure = 'unsupported' | 'blocked' | 'error';
let lastFailure: IdbFailure | null = null;

/** Null when storage is working; otherwise why it isn't. */
export function idbFailure(): IdbFailure | null { return lastFailure; }

/** True once anything has been written to the non-durable in-memory fallback. */
let usedMemoryFallback = false;
export function idbUsingMemoryFallback(): boolean { return usedMemoryFallback; }

function openDb(): Promise<IDBDatabase | null> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
        // A failed open must NOT be cached. `blocked` in particular is transient —
        // another tab holding the database open is enough to trigger it — and
        // caching the null poisoned the whole page session: every later read
        // returned "no data" from the memory map even though a retry would have
        // succeeded. Clearing the promise lets the next call try again.
        const fail = (reason: IdbFailure, detail?: unknown) => {
            lastFailure = reason;
            if (detail !== undefined) console.warn('[idb-kv] open failed:', reason, detail);
            dbPromise = null;
            resolve(null);
        };
        try {
            if (typeof indexedDB === 'undefined') { lastFailure = 'unsupported'; resolve(null); return; }
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(STORE)) {
                    req.result.createObjectStore(STORE);
                }
            };
            req.onsuccess = () => {
                lastFailure = null;
                // A database that closes under us (eviction, "clear site data" in
                // another tab) must not leave a dead handle cached.
                req.result.onclose = () => { dbPromise = null; };
                req.result.onversionchange = () => { req.result.close(); dbPromise = null; };
                resolve(req.result);
            };
            req.onerror = () => fail('error', req.error);
            req.onblocked = () => fail('blocked');
        } catch (e) {
            fail('error', e);
        }
    });
    return dbPromise;
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
    return openDb().then(db => {
        if (!db) return undefined;
        return new Promise<T | undefined>((resolve) => {
            try {
                const tx = db.transaction(STORE, mode);
                const req = run(tx.objectStore(STORE));
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => { console.warn('[idb-kv] op failed:', req.error); resolve(undefined); };
            } catch (e) {
                console.warn('[idb-kv] tx failed:', e);
                resolve(undefined);
            }
        });
    });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
    const db = await openDb();
    if (!db) return memoryFallback.get(key) as T | undefined;
    return withStore<T>('readonly', s => s.get(key) as IDBRequest<T>);
}

/**
 * Write a value. Returns **false when the write did not reach disk** — it went
 * to the in-memory fallback and will be gone on reload.
 *
 * This used to `return true` for the memory path, so a save into a dead
 * IndexedDB reported success and the UI said "Saved". Losing data is bad;
 * telling someone their data is safe while losing it is worse.
 */
export async function idbSet(key: string, value: unknown): Promise<boolean> {
    const db = await openDb();
    if (!db) { memoryFallback.set(key, value); usedMemoryFallback = true; return false; }
    const res = await withStore('readwrite', s => s.put(value, key));
    return res !== undefined;
}

export async function idbDelete(key: string): Promise<void> {
    const db = await openDb();
    if (!db) { memoryFallback.delete(key); return; }
    await withStore('readwrite', s => s.delete(key));
}

/**
 * One-time migration helper: if `localStorageKey` holds JSON, move it into
 * IndexedDB under `idbKey` (unless IDB already has a value) and remove the
 * localStorage copy. Returns the migrated (or existing) value.
 */
export async function idbMigrateFromLocalStorage<T>(localStorageKey: string, idbKey: string): Promise<T | undefined> {
    const existing = await idbGet<T>(idbKey);
    if (existing !== undefined) {
        // IDB is already the source of truth — drop any stale localStorage copy
        try { localStorage.removeItem(localStorageKey); } catch { /* ignore */ }
        return existing;
    }
    try {
        const raw = localStorage.getItem(localStorageKey);
        if (!raw) return undefined;
        const parsed = JSON.parse(raw) as T;
        const ok = await idbSet(idbKey, parsed);
        if (ok) localStorage.removeItem(localStorageKey);
        return parsed;
    } catch {
        return undefined;
    }
}
