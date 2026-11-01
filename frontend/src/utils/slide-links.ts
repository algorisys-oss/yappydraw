/**
 * Links on objects (`DrawingElement.link`): what a link points at, and which ones are safe to
 * follow. Pure — no store, no DOM — so the rules unit-test under bun.
 *
 * A link is one string, so documents and the Excalidraw round trip keep working:
 *  - a web address: `https://…`, `http://…`, `mailto:…`, `tel:…` (a bare `www.example.com` is
 *    taken as https). Anything else — `javascript:`, `data:`, `file:` — is never followed.
 *  - another slide: `#slide:<slideId>`. Keyed to the slide's id, not its number, so the link
 *    survives reordering and inserting slides.
 *  - a show action: `#next`, `#previous`, `#first`, `#last`, `#end`.
 * These map one-to-one onto PowerPoint's click actions (`hlinkClick`: an external URL,
 * `ppaction://hlinksldjump`, `ppaction://hlinkshowjump?jump=…`).
 */

export type ShowAction = 'next' | 'previous' | 'first' | 'last' | 'end';
export const SHOW_ACTIONS: readonly ShowAction[] = ['next', 'previous', 'first', 'last', 'end'];

export type LinkTarget =
    | { kind: 'url'; url: string }
    | { kind: 'slide'; slideId: string }
    | { kind: 'action'; action: ShowAction }
    | { kind: 'none' };

const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;

export const slideLink = (slideId: string): string => `#slide:${slideId}`;
export const actionLink = (action: ShowAction): string => `#${action}`;

/** Read a link. Unsafe or unrecognised strings come back as `none`: never followed. */
export function parseLink(link: string | null | undefined): LinkTarget {
    const s = typeof link === 'string' ? link.trim() : '';
    if (!s) return { kind: 'none' };
    if (s.startsWith('#slide:')) {
        const slideId = s.slice(7).trim();
        return slideId ? { kind: 'slide', slideId } : { kind: 'none' };
    }
    if (s.startsWith('#')) {
        const a = s.slice(1).toLowerCase();
        return (SHOW_ACTIONS as readonly string[]).includes(a) ? { kind: 'action', action: a as ShowAction } : { kind: 'none' };
    }
    if (SAFE_SCHEME.test(s)) return { kind: 'url', url: s };
    // A bare host ("www.example.com", "example.com/page") is what people type; no spaces, a dot,
    // and no scheme of its own (a colon before the first slash would be one, e.g. javascript:).
    if (/^[^\s/:]+\.[^\s/:]+(?:[/?#]\S*)?$/.test(s)) return { kind: 'url', url: `https://${s}` };
    return { kind: 'none' };
}

/** Normalise what a user typed into a link to store: '' clears it; null when it can't be used. */
export function normaliseLinkInput(input: string): string | null {
    const s = input.trim();
    if (!s) return '';
    const t = parseLink(s);
    if (t.kind === 'url') return t.url;
    if (t.kind === 'slide' || t.kind === 'action') return s;
    return null;
}

/** Index of the slide an action or slide link goes to, or null (end of show, unknown slide, a URL). */
export function targetSlideIndex(t: LinkTarget, current: number, slides: readonly { id: string }[]): number | null {
    if (t.kind === 'slide') {
        const i = slides.findIndex(s => s.id === t.slideId);
        return i >= 0 ? i : null;
    }
    if (t.kind !== 'action') return null;
    const last = slides.length - 1;
    switch (t.action) {
        case 'next': return current < last ? current + 1 : null;
        case 'previous': return current > 0 ? current - 1 : null;
        case 'first': return slides.length ? 0 : null;
        case 'last': return slides.length ? last : null;
        default: return null;
    }
}
