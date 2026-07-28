/**
 * Guarded localStorage helpers.
 *
 * `JSON.parse(localStorage.getItem(k) || '[]')` is the tempting one-liner, and it is
 * wrong: the `|| '[]'` only covers a MISSING key, not a corrupt one. A truncated value
 * (a partial write when the quota filled up), a value written by an older build, or
 * anything a user pasted into devtools makes the parse throw. When that happens inside
 * a component's initializer the whole render throws — which, at boot, used to strand
 * the splash screen and look like the app had hung.
 *
 * Corrupt data is never worth a crash for what is always a UI preference, so these
 * fall back to the default and drop the bad key so it can't keep biting.
 */

/** Parse a JSON value from localStorage, falling back on missing/corrupt data. */
export function readJson<T>(key: string, fallback: T): T {
    let raw: string | null = null;
    try {
        raw = localStorage.getItem(key);
    } catch {
        return fallback;                    // storage disabled (private mode, blocked cookies)
    }
    if (raw === null) return fallback;
    try {
        const parsed = JSON.parse(raw);
        return (parsed === null || parsed === undefined) ? fallback : parsed as T;
    } catch {
        console.warn(`[safe-storage] discarding corrupt value for "${key}"`);
        try { localStorage.removeItem(key); } catch { /* nothing more we can do */ }
        return fallback;
    }
}

/** Parse a JSON ARRAY from localStorage; anything non-array is treated as corrupt. */
export function readJsonArray<T>(key: string, fallback: T[] = []): T[] {
    const v = readJson<unknown>(key, fallback);
    return Array.isArray(v) ? v as T[] : fallback;
}

/** Write a JSON value, swallowing quota / disabled-storage errors. Returns success. */
export function writeJson(key: string, value: unknown): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}
