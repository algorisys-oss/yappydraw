/**
 * Client-side navigation over real paths (plan §S1).
 *
 * The public pages are prerendered to static HTML, so a COLD visit to
 * `/help/uml/` is served a finished document with no editor bundle at all. This
 * module is the other half: once the app is running, moving between those pages
 * is a `pushState`, not a page load — clicking Help in the middle of a drawing
 * must not unload the editor.
 *
 * Both halves render from the same Markdown modules, so the static page and the
 * in-app page cannot drift.
 *
 * Guarded for the prerenderer, which imports the same components in Node where
 * there is no `window`.
 */

import { createSignal } from 'solid-js';
import { hashRedirect, parsePath, type RouteKey } from './routes';

const hasWindow = typeof window !== 'undefined';

const [path, setPath] = createSignal(hasWindow ? window.location.pathname : '/');

/** The current pathname, as a signal — the router's input. */
export const currentPath = path;

/**
 * Routes the running app can draw itself.
 *
 * `/learn/…` is not among them: those pages are prerendered articles with no
 * component behind them, so navigating there has to be a real navigation. The
 * alternative — falling through to the editor at a `/learn/` URL — would show
 * the wrong page and, if a crawler ever saw it, a soft 404.
 */
const SPA_ROUTES: readonly RouteKey[] = ['home', 'help', 'helpDoc', 'examples', 'example'];

/** Move to a path without reloading, where the app can render it. */
export const navigate = (to: string, options: { replace?: boolean } = {}): void => {
    if (!hasWindow) return;

    const route = parsePath(to);
    if (!route || !SPA_ROUTES.includes(route.key)) {
        window.location.assign(to);
        return;
    }

    const url = to + window.location.search;
    if (options.replace) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
    setPath(window.location.pathname);
    // Landing on a page mid-scroll from the previous one reads as a broken link.
    window.scrollTo(0, 0);
};

/**
 * Rewrite a legacy `#/help/uml` URL to `/help/uml/` before the first render.
 *
 * Runs as a `replaceState`, so the old URL does not linger in history and the
 * back button does not bounce between the two forms. Returns whether it moved.
 */
export const migrateLegacyHash = (): boolean => {
    if (!hasWindow) return false;
    const to = hashRedirect(window.location.hash);
    if (!to) return false;
    window.history.replaceState(null, '', to + window.location.search);
    setPath(window.location.pathname);
    return true;
};

if (hasWindow) {
    // Back/forward, and any other history movement the app did not initiate.
    window.addEventListener('popstate', () => setPath(window.location.pathname));

    // A `#/help/…` link clicked while the app is already open — the help dialog
    // still writes one, and so do older shared links pasted into the address bar
    // of a tab that is already on the site (no reload, so boot never sees it).
    window.addEventListener('hashchange', () => {
        migrateLegacyHash();
    });
}

/**
 * Intercept clicks on internal links so they navigate in-app.
 *
 * Applied to the anchors the app renders itself. The anchors stay real `href`s —
 * middle-click, Ctrl-click and "copy link address" all keep working, and a
 * crawler following them lands on the prerendered page.
 */
export const linkHandler = (to: string) => (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
};
