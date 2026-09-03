/**
 * The site's URL table — one source of truth for the router, the links, the
 * prerenderer and the sitemap (plan §S1, and §6b where yappykit settles the
 * shape of this).
 *
 * WHY THIS EXISTS: everything public used to live behind `#/…`, which makes the
 * entire site ONE indexable URL. A crawler asking for `/help/uml` got the home
 * page's HTML and the home page's canonical, so 31 documents and every example
 * were invisible. Real paths are the precondition for prerendering them, and
 * prerendering is the precondition for any of it ranking.
 *
 * Two rules hold this together:
 *
 *  - **`#/embed/…` is untouched.** Embeds live in other people's iframes and
 *    wikis; changing that URL shape breaks pages we do not control. It has no
 *    SEO value to gain either.
 *  - **Old hash URLs keep working.** `hashRedirect()` maps every legacy shape to
 *    its path so shared links and bookmarks land where they used to.
 *
 * Locale prefixes (`/es/help/uml/`) are Phase 4. The parser already tolerates a
 * leading segment so adding them does not mean rewriting the router — see
 * `stripLocale`.
 */

/** Canonical origin. The apex, matching the canonical tag the site already ships. */
export const SITE = 'https://yappydraw.com';

export type RouteKey =
    | 'home'
    | 'help'
    | 'helpDoc'
    | 'examples'
    | 'example'
    | 'learn'
    | 'learnArticle'
    | 'founders'
    | 'embed';

export interface Route {
    key: RouteKey;
    /** The document / example / article id, when the route carries one. */
    param?: string;
}

/**
 * Locale prefixes that may precede a path.
 *
 * Empty until Phase 4 ships per-locale URLs. Kept here so the parser has one
 * place to learn about them rather than every call site growing a special case.
 */
export const LOCALE_PREFIXES: readonly string[] = [];

const stripLocale = (segments: string[]): { locale: string | null; rest: string[] } =>
    segments.length && LOCALE_PREFIXES.includes(segments[0])
        ? { locale: segments[0], rest: segments.slice(1) }
        : { locale: null, rest: segments };

const segmentsOf = (pathname: string): string[] =>
    pathname.split('/').filter(Boolean).map(decodeURIComponent);

/** An id we are willing to put in a URL — everything else is treated as unknown. */
const ID = /^[a-z0-9][a-z0-9-]*$/i;

/**
 * Which page a pathname asks for.
 *
 * Returns `null` for anything unrecognised, so the caller can serve a real 404
 * instead of quietly rendering the home page at a wrong URL (a "soft 404" is
 * worse than a 404: Google indexes it as a duplicate).
 */
export const parsePath = (pathname: string): Route | null => {
    const { rest } = stripLocale(segmentsOf(pathname));

    if (!rest.length) return { key: 'home' };

    const [head, second, ...tail] = rest;

    if (head === 'help') {
        if (!second) return { key: 'help' };
        if (tail.length || !ID.test(second)) return null;
        return { key: 'helpDoc', param: second };
    }

    if (head === 'examples') {
        if (!second) return { key: 'examples' };
        if (tail.length || !ID.test(second)) return null;
        return { key: 'example', param: second };
    }

    if (head === 'learn') {
        if (!second) return { key: 'learn' };
        if (tail.length || !ID.test(second)) return null;
        return { key: 'learnArticle', param: second };
    }

    // A single page, with no children — `/founders/anything` is a 404, not the page.
    if (head === 'founders' && !second) return { key: 'founders' };

    return null;
};

/**
 * The path for a route.
 *
 * Always with a trailing slash, because the pages are written to disk as
 * `<path>/index.html` — the one directory-index convention every static host
 * (Apache, LiteSpeed, GitHub Pages, S3, nginx) resolves identically.
 */
export const pathFor = (key: RouteKey, param?: string): string => {
    switch (key) {
        case 'home':
            return '/';
        case 'help':
            return '/help/';
        case 'helpDoc':
            return `/help/${param}/`;
        case 'examples':
            return '/examples/';
        case 'example':
            return `/examples/${param}/`;
        case 'learn':
            return '/learn/';
        case 'learnArticle':
            return `/learn/${param}/`;
        case 'founders':
            return '/founders/';
        case 'embed':
            return `/#/embed/${param}`;
    }
};

/** The absolute URL for a route — canonical tags, Open Graph, the sitemap. */
export const urlFor = (key: RouteKey, param?: string): string => `${SITE}${pathFor(key, param)}`;

/**
 * A legacy `#/…` URL translated into its path, or `null` if it is not a legacy
 * route (`#/embed/…`, `#load=`, `#doc=` and a bare `#` all stay as they are).
 *
 * This runs on boot BEFORE the router reads the location, so a bookmark from
 * before the migration never renders the wrong page on the way to the right one.
 */
export const hashRedirect = (hash: string): string | null => {
    const h = hash.replace(/^#/, '');
    if (!h || h.startsWith('/embed/') || h.startsWith('load=') || h.startsWith('doc=')) return null;

    const rest = h.replace(/^\/+/, '');
    if (!rest) return null;

    const [head, second] = rest.split('/').map((s) => decodeURIComponent(s.split('?')[0]));

    if (head === 'help') return second && ID.test(second) ? pathFor('helpDoc', second) : pathFor('help');
    if (head === 'examples') {
        return second && ID.test(second) ? pathFor('example', second) : pathFor('examples');
    }
    return null;
};
