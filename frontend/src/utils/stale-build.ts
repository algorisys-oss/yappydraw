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
 * The recovery is a single reload: reloading revalidates the top-level document,
 * so the browser picks up the current index.html and its current chunk names.
 * Guarded so a genuine, reproducible runtime error can never turn into a reload
 * loop — one automatic reload per session, and never twice inside a minute.
 */

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
    location.reload();
    return true;
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
