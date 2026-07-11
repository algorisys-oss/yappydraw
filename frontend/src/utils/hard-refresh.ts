/**
 * hard-refresh — a real "hard refresh" for environments that don't offer one.
 *
 * iPad/iOS Safari has no user-facing hard-reload, and it aggressively caches the
 * app shell (index.html in particular), so a plain reload can keep serving a
 * stale build. This clears every client-side cache, drops any service worker,
 * and reloads with a cache-busting query param so the document is refetched.
 *
 * Wired to a tap on the version label in the status bar (mirrors HappyPaint's
 * version-tap-to-update). Yappy now ships a `prompt`-strategy service worker,
 * so this doubles as the "apply the waiting update" button: it unregisters the
 * SW, drops the precache, and cache-busts the document so the very next load
 * fetches the freshly-deployed index.html + hashed assets. Safe to call any
 * time — the workspace autosaves to IndexedDB, which this never touches.
 */
export async function hardRefresh(): Promise<void> {
    // Drop any registered service workers (none today, but be defensive — a
    // stale SW from a prior deploy is exactly the kind of thing that strands iOS).
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(r => r.unregister()));
        }
    } catch { /* ignore — best effort */ }

    // Clear the Cache Storage API caches (PWA/asset caches).
    try {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
    } catch { /* ignore — best effort */ }

    // Reload with a fresh query param. iOS Safari serves the cached document on a
    // plain reload; a never-seen-before URL forces it to refetch index.html,
    // which then points at the current content-hashed assets.
    try {
        const url = new URL(window.location.href);
        url.searchParams.set('_hr', Date.now().toString(36));
        window.location.replace(url.toString());
    } catch {
        window.location.reload();
    }
}
