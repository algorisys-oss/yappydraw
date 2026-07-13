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

export type AssetKind = 'icon' | 'illustration' | 'photo' | 'shape';

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

/** Kinds that have a live provider today. Illustrations join in Phase 2. */
export const ACTIVE_KINDS: AssetKind[] = ['icon', 'shape', 'photo'];

export const KIND_LABELS: Record<AssetKind, string> = {
    icon: 'Icons',
    illustration: 'Illustrations',
    photo: 'Photos',
    shape: 'Shapes',
};

const MAX_ICONS = 96;

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

/** Icon hits from the (already-loaded) lucide module, name/substring matched. */
function iconHits(q: string, lucide: any): AssetHit[] {
    if (!lucide) return [];
    const nq = normalize(q);
    if (!nq) return [];
    const names = Object.keys(lucide).filter(
        k => /^[A-Z][A-Za-z0-9]*$/.test(k) && typeof lucide[k] === 'function',
    );
    const matched = names.filter(n => n.toLowerCase().includes(nq)).slice(0, MAX_ICONS);
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

/** Offline hits (shapes + icons), available synchronously. Illustrations: Phase 2. */
export function collectOfflineHits(q: string, lucide: any): AssetHit[] {
    return [...shapeHits(q, lucide), ...iconHits(q, lucide)];
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
