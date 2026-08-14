/**
 * Stale-build recovery.
 *
 * A visitor whose browser held a cached `index.html` from before a deploy asks
 * for content-hashed chunks that no longer exist on the server. The import
 * fails, the route's ErrorBoundary catches it, and the user sees "Something
 * went wrong" — on a perfectly healthy build, for a cache reason they can do
 * nothing about. `public/.htaccess` stops the browser reusing a stale
 * index.html in the first place; this is the belt to that pair of braces, and it
 * also covers hosts/proxies we don't control.
 *
 * The recovery is a *hard* reload — and it has to be. We ship a `prompt`-strategy
 * service worker (see vite.config.ts): a newly deployed SW installs and then
 * WAITS, because activating it mid-session would evict the running page's
 * precache. A waiting SW only takes over once every client is gone, and a plain
 * `location.reload()` does not count — the client survives a reload. So the old
 * SW keeps serving the old index.html and the old entry chunk, the missing lazy
 * chunk stays missing, and reloading changes nothing. That is exactly the
 * reported symptom: "reload doesn't work, I have to close it and come back"
 * (closing the tab IS what releases the client and lets the new SW activate).
 *
 * `hardRefresh()` releases it for them: unregister the service workers, drop the
 * Cache Storage entries, and navigate to a cache-busted URL so index.html is
 * genuinely refetched. Guarded so a genuine, reproducible runtime error can
 * never turn into a reload loop — one automatic recovery per session, and never
 * twice inside a minute.
 */

import { hardRefresh } from './hard-refresh';

const GUARD_KEY = 'yappy:stale-build-reload';
const MIN_INTERVAL_MS = 60_000;

/**
 * Does this error look like a chunk that isn't on the server any more?
 *
 * Browsers word it differently, and a missing asset that the host answers with
 * an HTML error page shows up as a parse error instead of a fetch failure — so
 * match the syntax-error shape too ("Unexpected token '<'" is an HTML document
 * being executed as JavaScript).
 */
export function isStaleBuildError(err: unknown): boolean {
    const msg = String((err as any)?.message ?? err ?? '');
    return (
        /failed to fetch dynamically imported module/i.test(msg) ||
        /error loading dynamically imported module/i.test(msg) ||
        /importing a module script failed/i.test(msg) ||
        /module script failed to load/i.test(msg) ||
        /'text\/html' is not a valid JavaScript MIME type/i.test(msg) ||
        /unexpected token '<'/i.test(msg)
    );
}

/**
 * Reload once to pick up the current build. Returns false when the guard blocks
 * it, in which case the caller should show its error UI — better a visible
 * message than a reload loop.
 *
 * Fire-and-forget on purpose: `hardRefresh` is async (it awaits the SW
 * unregister and the cache deletes before navigating) but callers are render
 * paths that need a synchronous yes/no, so they get `true` and show a
 * "updating…" placeholder while the navigation lands.
 */
export function recoverFromStaleBuild(err: unknown): boolean {
    if (!isStaleBuildError(err)) return false;

    try {
        const last = Number(sessionStorage.getItem(GUARD_KEY) ?? 0);
        if (last && Date.now() - last < MIN_INTERVAL_MS) return false;
        sessionStorage.setItem(GUARD_KEY, String(Date.now()));
    } catch {
        // Private mode / storage disabled: reloading blind risks a loop, so don't.
        return false;
    }

    console.warn('[yappy] A chunk from a previous build is missing — reloading into the current one.', err);
    void hardRefresh();
    return true;
}

/**
 * The manual escape hatch behind every "Reload" button on an error screen.
 *
 * Same reasoning as above: `location.reload()` keeps the current service worker
 * (and therefore the current, broken build), so the button appeared to do
 * nothing. Clearing the guard first means the button always works, even if the
 * automatic recovery already used its one shot this minute — the user asked for
 * this one, so it is not a loop.
 */
export function forceReloadLatest(): void {
    try { sessionStorage.removeItem(GUARD_KEY); } catch { /* ignore */ }
    void hardRefresh();
}

/**
 * Catch stale-build failures from imports that happen *after* boot — opening
 * Help, exporting, any `await import(...)` behind a button. Those reject outside
 * any ErrorBoundary, so without this the feature just silently does nothing.
 */
export function installStaleBuildHandler(): void {
    window.addEventListener('unhandledrejection', (e) => {
        if (isStaleBuildError(e.reason)) recoverFromStaleBuild(e.reason);
    });
}
