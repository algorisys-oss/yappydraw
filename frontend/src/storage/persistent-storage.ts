/**
 * Durable-storage helpers (StorageManager API).
 *
 * IndexedDB is "best-effort" by default: browsers may evict it under storage
 * pressure, and Safari/iOS wipes script-writable storage after 7 days of no
 * interaction with the site (ITP). For a *library of the user's saved drawings*
 * that eviction is a data-loss bug, so we ask the browser to mark our origin's
 * storage **persistent** (`navigator.storage.persist()`), which exempts it from
 * best-effort eviction (installed PWAs are typically granted automatically).
 *
 * All calls are feature-detected and never throw — on browsers without the
 * StorageManager API they resolve to a benign "unsupported" result, matching
 * `idb-kv`'s graceful-degradation contract.
 */

export interface PersistResult {
    /** navigator.storage.persist() is available in this browser. */
    supported: boolean;
    /** Storage is now durable (either already, or just granted). */
    persisted: boolean;
}

export interface StorageEstimateResult {
    usageBytes: number;
    quotaBytes: number;
    /** 0..1 fraction of quota used (0 when quota is unknown). */
    fraction: number;
}

function sm(): StorageManager | null {
    try {
        if (typeof navigator !== 'undefined' && navigator.storage) return navigator.storage;
    } catch { /* ignore */ }
    return null;
}

/** True if this origin's storage is already marked persistent. */
export async function isStoragePersisted(): Promise<boolean> {
    const s = sm();
    if (!s || typeof s.persisted !== 'function') return false;
    try { return await s.persisted(); } catch { return false; }
}

/**
 * Ask the browser to make storage durable. Idempotent — if already persisted it
 * resolves `persisted: true` without re-prompting. Safe to call on first save.
 */
export async function requestPersistentStorage(): Promise<PersistResult> {
    const s = sm();
    if (!s || typeof s.persist !== 'function' || typeof s.persisted !== 'function') {
        return { supported: false, persisted: false };
    }
    try {
        if (await s.persisted()) return { supported: true, persisted: true };
        const granted = await s.persist();
        return { supported: true, persisted: granted };
    } catch {
        return { supported: true, persisted: false };
    }
}

/** Best-effort usage/quota estimate (null when the API is unavailable). */
export async function getStorageEstimate(): Promise<StorageEstimateResult | null> {
    const s = sm();
    if (!s || typeof s.estimate !== 'function') return null;
    try {
        const est = await s.estimate();
        const usageBytes = est.usage ?? 0;
        const quotaBytes = est.quota ?? 0;
        return { usageBytes, quotaBytes, fraction: quotaBytes > 0 ? usageBytes / quotaBytes : 0 };
    } catch {
        return null;
    }
}
