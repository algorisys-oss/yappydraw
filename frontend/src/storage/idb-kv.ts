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

function openDb(): Promise<IDBDatabase | null> {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
        try {
            if (typeof indexedDB === 'undefined') { resolve(null); return; }
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(STORE)) {
                    req.result.createObjectStore(STORE);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => { console.warn('[idb-kv] open failed:', req.error); resolve(null); };
            req.onblocked = () => resolve(null);
        } catch (e) {
            console.warn('[idb-kv] indexedDB unavailable:', e);
            resolve(null);
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

export async function idbSet(key: string, value: unknown): Promise<boolean> {
    const db = await openDb();
    if (!db) { memoryFallback.set(key, value); return true; }
    const res = await withStore('readwrite', s => s.put(value, key));
    return res !== undefined || true;
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
