/**
 * Unified element search — fan a single query across multiple asset providers
 * (icons, shapes, photos today; illustrations land in Phase 2) and return a
 * blended, uniformly-typed result list the Elements panel renders in one grid.
 *
 * Offline providers (icons/shapes) resolve synchronously; the photo provider is
 * async (Wikimedia Commons). The panel renders offline hits instantly and
 * appends photo hits when they resolve — mirroring the existing Photos pattern.
 *
 * Phase 2 wires an IllustrationProvider (bundled OpenMoji) and a keyword-alias
 * map here; the `AssetHit`/kind contract below is designed to absorb both
 * without touching the panel.
 */
import { render } from 'solid-js/web';
import { store } from '../../store/app-store';
import { importSvgToCanvas } from '../../utils/svg-import';
import { searchStockPhotos, insertStockPhoto, type StockPhoto } from '../../utils/stock-photos';
import { YappyAPI } from '../../api';
import { searchIllustrations } from './illustrations/registry';
import { aliasesFor } from './aliases';
import { searchTemplates } from '../../templates/registry';
import { templatePreviewSvg } from '../../templates/template-preview';
import { showToast } from '../../components/toast';
import Swal from 'sweetalert2';

export type AssetKind = 'icon' | 'illustration' | 'photo' | 'shape' | 'template';

export interface AssetHit {
    kind: AssetKind;
    id: string;
    label: string;
    /** Inline SVG markup — icons, illustrations, shapes (rendered via innerHTML). */
    thumbSvg?: string;
    /** Thumbnail URL — photos (rendered via <img>). */
    thumbUrl?: string;
    /** Raw stock-photo payload, kept for drag-to-canvas. */
    photo?: StockPhoto;
    /** Insert onto the canvas (optionally at a world point, for drag-drop). */
    insert: (at?: { x: number; y: number }) => void | Promise<void>;
}

/** Kinds that have a live provider. Order drives the type-filter chip order. */
export const ACTIVE_KINDS: AssetKind[] = ['icon', 'illustration', 'shape', 'photo', 'template'];

export const KIND_LABELS: Record<AssetKind, string> = {
    icon: 'Icons',
    illustration: 'Illustrations',
    photo: 'Photos',
    shape: 'Shapes',
    template: 'Templates',
};

const MAX_ICONS = 96;
const MAX_TEMPLATES = 12;

/** Insert position: centered on the active page (or a sensible fallback). */
function insertOrigin(size: number): { x: number; y: number } {
    const page = store.slides[store.activeSlideIndex];
    if (page) {
        return {
            x: page.spatialPosition.x + (page.dimensions.width - size) / 2,
            y: page.spatialPosition.y + (page.dimensions.height - size) / 2,
        };
    }
    return { x: 200, y: 200 };
}

/** Render a lucide-solid component off-screen to capture its SVG markup. */
export function renderLucideSvg(mod: any, name: string, size = 24): string | null {
    const IconComp = mod && mod[name];
    if (typeof IconComp !== 'function') return null;
    const host = document.createElement('div');
    const dispose = render(() => IconComp({ size }), host);
    const svg = host.querySelector('svg')?.outerHTML || null;
    dispose();
    return svg;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s\-_]+/g, '');

/** Shapes catalog — insertable primitives with search aliases. */
interface ShapeDef { type: string; label: string; icon: string; aliases: string[]; }
const SHAPE_CATALOG: ShapeDef[] = [
    { type: 'rectangle', label: 'Rectangle', icon: 'Square', aliases: ['rect', 'box', 'square'] },
    { type: 'circle', label: 'Circle', icon: 'Circle', aliases: ['ellipse', 'round', 'dot'] },
    { type: 'triangle', label: 'Triangle', icon: 'Triangle', aliases: ['delta'] },
    { type: 'star', label: 'Star', icon: 'Star', aliases: ['favourite', 'favorite'] },
    { type: 'heart', label: 'Heart', icon: 'Heart', aliases: ['love', 'like'] },
    { type: 'hexagon', label: 'Hexagon', icon: 'Hexagon', aliases: ['hex', 'polygon'] },
    { type: 'diamond', label: 'Diamond', icon: 'Diamond', aliases: ['rhombus', 'gem'] },
    { type: 'speechBubble', label: 'Speech', icon: 'MessageSquare', aliases: ['bubble', 'chat', 'talk', 'comment'] },
    { type: 'arrowRight', label: 'Arrow', icon: 'ArrowRight', aliases: ['arrow', 'pointer'] },
];

function insertShapeEl(type: string, at?: { x: number; y: number }) {
    const SIZE = 240;
    const o = at ? { x: at.x - SIZE / 2, y: at.y - SIZE / 2 } : insertOrigin(SIZE);
    const id = (YappyAPI as any).createElement(type, o.x, o.y, SIZE, SIZE, {});
    YappyAPI.setSelected([id]);
}

function insertIconEl(svg: string, at?: { x: number; y: number }) {
    const SIZE = 120;
    const o = at ? { x: at.x - SIZE / 2, y: at.y - SIZE / 2 } : insertOrigin(SIZE);
    importSvgToCanvas(svg, { x: o.x, y: o.y, targetWidth: SIZE });
}

function insertIllustrationEl(svg: string, at?: { x: number; y: number }) {
    const SIZE = 160;
    const o = at ? { x: at.x - SIZE / 2, y: at.y - SIZE / 2 } : insertOrigin(SIZE);
    importSvgToCanvas(svg, { x: o.x, y: o.y, targetWidth: SIZE });
}

/**
 * Icon hits from the (already-loaded) lucide module. Matched by the query plus
 * its keyword-alias expansions (love→heart, money→dollar…). Direct-query matches
 * rank first; alias-only matches fill in behind them.
 */
function iconHits(q: string, lucide: any): AssetHit[] {
    if (!lucide) return [];
    const nq = normalize(q);
    if (!nq) return [];
    const aliases = aliasesFor(nq);
    const names = Object.keys(lucide).filter(
        k => /^[A-Z][A-Za-z0-9]*$/.test(k) && typeof lucide[k] === 'function',
    );
    const seen = new Set<string>();
    const matched: string[] = [];
    // Pass 1: direct query substring. Pass 2: alias tokens (deduped, ranked after).
    for (const tokens of [[nq], aliases]) {
        if (matched.length >= MAX_ICONS) break;
        for (const name of names) {
            if (seen.has(name)) continue;
            const ln = name.toLowerCase();
            if (tokens.some(t => t && ln.includes(t))) {
                seen.add(name);
                matched.push(name);
                if (matched.length >= MAX_ICONS) break;
            }
        }
    }
    const hits: AssetHit[] = [];
    for (const name of matched) {
        const svg = renderLucideSvg(lucide, name, 24);
        if (!svg) continue;
        hits.push({
            kind: 'icon', id: `icon:${name}`, label: name, thumbSvg: svg,
            insert: (at) => insertIconEl(svg, at),
        });
    }
    return hits;
}

/**
 * Illustration hits from the bundled OpenMoji subset. Matched by the query plus
 * its alias expansions against illustration name + tags. Inserted as editable
 * coloured vector paths (same path as icons → render-style parity for free).
 */
function illustrationHits(q: string): AssetHit[] {
    const nq = normalize(q);
    if (!nq) return [];
    const tokens = [nq, ...aliasesFor(nq)];
    return searchIllustrations(tokens).map(a => ({
        kind: 'illustration' as const, id: `illustration:${a.id}`, label: a.name,
        thumbSvg: a.svg,
        insert: (at: { x: number; y: number } | undefined) => insertIllustrationEl(a.svg, at),
    }));
}

/** Shape hits — label/type/alias match. */
function shapeHits(q: string, lucide: any): AssetHit[] {
    const nq = normalize(q);
    if (!nq) return [];
    return SHAPE_CATALOG
        .filter(s => normalize(s.label).includes(nq) || normalize(s.type).includes(nq)
            || s.aliases.some(a => normalize(a).includes(nq)))
        .map(s => ({
            kind: 'shape' as const, id: `shape:${s.type}`, label: s.label,
            thumbSvg: (lucide && renderLucideSvg(lucide, s.icon, 24)) || undefined,
            insert: (at: { x: number; y: number } | undefined) => insertShapeEl(s.type, at),
        }));
}

/** Load a whole template — a destructive action, so confirm first if the doc is dirty. */
async function applyTemplateHit(id: string, name: string) {
    if (store.isDirty) {
        const res = await Swal.fire({
            title: 'Load this template?',
            text: 'Your current design has unsaved changes. Loading a template replaces the whole document.',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Load template', cancelButtonText: 'Cancel',
        });
        if (!res.isConfirmed) return;
    }
    const ok = (YappyAPI as any).applyTemplate(id);
    showToast(ok ? `“${name}” loaded` : 'Open this template from the Templates browser', ok ? 'success' : 'info');
}

/**
 * Template hits — wraps the existing `searchTemplates` (name/description/tags),
 * expanded with the alias tokens. DSL-only templates are skipped (they need the
 * import dialog, not a one-click load). Capped so a common word like “star”
 * doesn't bury single-element results under a pile of posters; the Templates chip
 * is the focused entry point.
 */
function templateHits(q: string): AssetHit[] {
    const nq = normalize(q);
    if (!nq) return [];
    const tokens = [q.trim(), ...aliasesFor(nq)];
    const seen = new Set<string>();
    const out: AssetHit[] = [];
    for (const token of tokens) {
        if (!token) continue;
        for (const tpl of searchTemplates(token) as any[]) {
            const id = tpl?.metadata?.id;
            if (!id || seen.has(id) || tpl.dslContent) continue;
            seen.add(id);
            out.push({
                kind: 'template', id: `template:${id}`, label: tpl.metadata.name,
                thumbSvg: templatePreviewSvg(tpl) || undefined,
                insert: () => { void applyTemplateHit(id, tpl.metadata.name); },
            });
            if (out.length >= MAX_TEMPLATES) return out;
        }
    }
    return out;
}

/** Offline hits (shapes + illustrations + icons + templates), available synchronously. */
export function collectOfflineHits(q: string, lucide: any): AssetHit[] {
    return [...shapeHits(q, lucide), ...illustrationHits(q), ...iconHits(q, lucide), ...templateHits(q)];
}

/** Photo hits — async (Wikimedia Commons). Throws on network/API error. */
export async function searchPhotoHits(q: string): Promise<AssetHit[]> {
    const photos = await searchStockPhotos(q);
    return photos.map(p => ({
        kind: 'photo' as const, id: `photo:${p.id}`, label: p.title,
        thumbUrl: p.thumbnail, photo: p,
        insert: (at: { x: number; y: number } | undefined) => { void insertStockPhoto(p, at); },
    }));
}

export interface SearchElementsOptions {
    /** Restrict to these kinds (default: all active kinds). */
    kinds?: AssetKind[];
    /** Include (async) photo results. Default true when 'photo' is in scope. */
    includePhotos?: boolean;
}

/**
 * One-call blended search across every provider — the scriptable entry point
 * behind `YappyAPI.searchElements`. Loads the (lazy) lucide module for icon/shape
 * thumbnails, gathers offline hits (icons/illustrations/shapes) and, unless
 * disabled, appends photo hits. Photo-provider errors degrade to no photos rather
 * than rejecting, so a script always gets the offline results.
 */
export async function searchElements(query: string, opts: SearchElementsOptions = {}): Promise<AssetHit[]> {
    const q = (query || '').trim();
    if (!q) return [];
    const kinds = opts.kinds ?? ACTIVE_KINDS;
    const wantPhotos = kinds.includes('photo') && opts.includePhotos !== false;

    const lucide = await import('lucide-solid').catch(() => null);
    const offline = collectOfflineHits(q, lucide).filter(h => kinds.includes(h.kind));

    let photos: AssetHit[] = [];
    if (wantPhotos) {
        try { photos = await searchPhotoHits(q); } catch { photos = []; }
    }
    return [...offline, ...photos];
}
