/**
 * Illustration registry — search and on-demand loading over the Fluent Emoji index.
 *
 * The index (names + keywords) is bundled; the SVGs are static files fetched when a
 * result is shown or inserted, so ~1,600 illustrations cost the app ~120 KB, not ~4 MB.
 */
import { ILLUSTRATION_INDEX, ILLUSTRATION_DIR } from './index-data';

export interface Illustration { id: string; name: string; keywords: string[]; }

/** Enough to fill the panel for a broad word without rendering hundreds of thumbnails. */
export const MAX_ILLUSTRATION_HITS = 60;

const norm = (s: string) => s.toLowerCase().replace(/[\s\-_&]+/g, '');

interface Row extends Illustration { nName: string; nKeywords: string[]; }

let rows: Row[] | null = null;
let byId: Map<string, Row> | null = null;
const table = (): Row[] => {
    if (!rows) {
        rows = ILLUSTRATION_INDEX.map(([id, name, kw]) => {
            const keywords = kw ? kw.split('|') : [];
            return { id, name, keywords, nName: norm(name), nKeywords: keywords.map(norm) };
        });
        byId = new Map(rows.map(r => [r.id, r]));
    }
    return rows;
};

const publicEntry = (r: Row): Illustration => ({ id: r.id, name: r.name, keywords: r.keywords });

export const getIllustration = (id: string): Illustration | undefined => {
    table();
    const r = byId!.get(id);
    return r && publicEntry(r);
};

/** Lower is better; null = no match. */
function score(r: Row, q: string): number | null {
    if (r.nName === q) return 0;
    if (r.nName.startsWith(q)) return 1;
    if (r.nName.includes(q)) return 2;
    if (r.nKeywords.includes(q)) return 3;
    if (r.nKeywords.some(k => k.includes(q))) return 4;
    return null;
}

/**
 * Rank illustrations against the query tokens. `tokens[0]` is what the user typed; the
 * rest are alias expansions, which only ever rank behind a direct match.
 */
export function searchIllustrations(tokens: string[], limit = MAX_ILLUSTRATION_HITS): Illustration[] {
    const qs = tokens.map(norm);
    if (!qs.some(Boolean)) return [];
    const scored: { r: Row; s: number }[] = [];
    for (const r of table()) {
        let best: number | null = null;
        qs.forEach((q, i) => {
            if (!q) return;
            const s = score(r, q);
            if (s === null) return;
            const ranked = i === 0 ? s : 10 + s;
            if (best === null || ranked < best) best = ranked;
        });
        if (best !== null) scored.push({ r, s: best });
    }
    scored.sort((a, b) => a.s - b.s || a.r.name.length - b.r.name.length || a.r.name.localeCompare(b.r.name));
    return scored.slice(0, limit).map(x => publicEntry(x.r));
}

const baseUrl = (): string => (import.meta as any).env?.BASE_URL ?? '/';

export const illustrationUrl = (id: string, base = baseUrl()): string =>
    `${base.endsWith('/') ? base : `${base}/`}${ILLUSTRATION_DIR}/${id}.svg`;

type Fetcher = (url: string) => Promise<Response>;
const cache = new Map<string, Promise<string>>();

export const clearIllustrationCache = () => cache.clear();

/**
 * Fetch an illustration's SVG markup. Successful loads are cached; a failure is not, so
 * a flaky network does not poison the id for the rest of the session.
 */
export function loadIllustrationSvg(id: string, fetcher: Fetcher = (u) => fetch(u)): Promise<string> {
    if (!getIllustration(id)) return Promise.reject(new Error(`Unknown illustration: ${id}`));
    let p = cache.get(id);
    if (!p) {
        p = fetcher(illustrationUrl(id))
            .then(async res => {
                if (!res.ok) throw new Error(`Illustration “${id}” failed to load (${res.status})`);
                const text = (await res.text()).trim();
                // A host or dev server can answer a missing file with a 200 HTML page.
                if (!text.startsWith('<svg')) throw new Error(`Illustration “${id}” is not an SVG`);
                return text;
            })
            .catch(err => { cache.delete(id); throw err; });
        cache.set(id, p);
    }
    return p;
}
