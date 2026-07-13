import { type Component, For, Show, createSignal, createMemo, createResource, createEffect, onCleanup, Suspense } from 'solid-js';
import { store } from '../store/app-store';
import { isPanelOpen } from '../store/dock-layout';
import { FONT_PAIRINGS, applyFontPairing, type FontPairing } from '../brand/font-pairing';
import { insertStockPhoto, STOCK_PHOTO_MIME } from '../utils/stock-photos';
import {
    collectOfflineHits, searchPhotoHits, renderLucideSvg,
    ACTIVE_KINDS, KIND_LABELS, type AssetKind, type AssetHit,
} from '../library/elements/search';
import { YappyAPI } from '../api';
import { importSvgToCanvas } from '../utils/svg-import';
import { showToast } from './toast';
import {
    Search,
    Square, Circle as CircleIcon, Triangle, Star, Heart, Hexagon, MessageSquare, ArrowRight,
} from 'lucide-solid';
import './elements-panel.css';

/** Icons shown in the browse view before the user searches (a popular subset). */
const FEATURED_ICONS = [
    'Heart', 'Star', 'Smile', 'ThumbsUp', 'Check', 'X', 'Plus', 'Minus',
    'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'User', 'Users',
    'Mail', 'Phone', 'MapPin', 'Calendar', 'Clock', 'Camera', 'Image', 'Music',
    'Video', 'Mic', 'Bell', 'Bookmark', 'Gift', 'ShoppingCart', 'CreditCard',
    'Truck', 'Globe', 'Sun', 'Moon', 'Cloud', 'CloudRain', 'Zap', 'Flame',
    'Leaf', 'Trees', 'Coffee', 'Pizza', 'Utensils', 'Car', 'Plane', 'Rocket',
    'Trophy', 'Target', 'Lightbulb', 'Sparkles', 'Crown', 'Diamond', 'Key',
    'Lock', 'Settings', 'Wrench', 'Scissors', 'Paintbrush', 'Palette', 'Pen',
];

/** Chips: 'all' plus every kind that has a live provider. */
type KindFilter = 'all' | AssetKind;

/** Insert position: centered on the active page (or near viewport origin). */
function insertOrigin(size: number): { x: number, y: number } {
    const page = store.slides[store.activeSlideIndex];
    if (page) {
        return {
            x: page.spatialPosition.x + (page.dimensions.width - size) / 2,
            y: page.spatialPosition.y + (page.dimensions.height - size) / 2,
        };
    }
    return { x: 200, y: 200 };
}

/** CSS font-family for previewing a pair font (built-in key or Google family). */
const previewFamily = (family: string, google?: boolean): string => {
    if (google) return `'${family}', sans-serif`;
    switch (family) {
        case 'poppins': return "'Poppins', sans-serif";
        case 'caveat': return "'Caveat', cursive";
        case 'serif': return 'serif';
        case 'monospace': case 'code': return 'monospace';
        default: return 'sans-serif';
    }
};

/** Lazily load a Google font's CSS so pair previews render in-face. */
const ensurePreviewFont = (family: string) => {
    const id = `fp-preview-${family.replace(/\s+/g, '+')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
    document.head.appendChild(link);
};

const ElementsPanel: Component = () => {
    const [query, setQuery] = createSignal('');
    const [kindFilter, setKindFilter] = createSignal<KindFilter>('all');
    const [photoHits, setPhotoHits] = createSignal<AssetHit[]>([]);
    const [photosLoading, setPhotosLoading] = createSignal(false);
    const [photosError, setPhotosError] = createSignal('');
    const [photoOrientation, setPhotoOrientation] = createSignal<'all' | 'landscape' | 'portrait' | 'square'>('all');

    const searching = createMemo(() => query().trim().length > 0);

    // The full lucide-solid module is heavy — load it only when the panel opens.
    const [lucide] = createResource(() => isPanelOpen('elements'), async (open) => {
        if (!open) return null;
        return await import('lucide-solid');
    });

    // Offline hits (shapes + icons) recompute synchronously as the query changes.
    const offlineHits = createMemo<AssetHit[]>(() => {
        const q = query().trim();
        if (!q || !lucide()) return [];
        return collectOfflineHits(q, lucide());
    });

    // Photos are async and rate-limited-ish — debounce the fetch after typing stops.
    let photoTimer: number | undefined;
    let photoSeq = 0;
    createEffect(() => {
        const q = query().trim();
        if (photoTimer) clearTimeout(photoTimer);
        if (q.length < 2) { setPhotoHits([]); setPhotosLoading(false); setPhotosError(''); return; }
        setPhotosLoading(true); setPhotosError('');
        const seq = ++photoSeq;
        photoTimer = window.setTimeout(async () => {
            try {
                const hits = await searchPhotoHits(q);
                if (seq === photoSeq) setPhotoHits(hits);
            } catch (e: any) {
                if (seq === photoSeq) { setPhotoHits([]); setPhotosError(e?.message || 'Photo search failed'); }
            } finally {
                if (seq === photoSeq) setPhotosLoading(false);
            }
        }, 400);
    });
    onCleanup(() => { if (photoTimer) clearTimeout(photoTimer); });

    /** Photo hits, narrowed by the orientation chips (only shown for photos). */
    const visiblePhotoHits = createMemo(() => {
        const o = photoOrientation();
        const hits = photoHits();
        if (o === 'all') return hits;
        return hits.filter(h => {
            const p = h.photo; if (!p) return false;
            const r = p.width / p.height;
            if (o === 'square') return r >= 0.9 && r <= 1.1;
            return o === 'landscape' ? r > 1.1 : r < 0.9;
        });
    });

    /** Merged, kind-filtered result list. */
    const results = createMemo<AssetHit[]>(() => {
        const k = kindFilter();
        const offline = offlineHits();
        const photos = visiblePhotoHits();
        if (k === 'photo') return photos;
        if (k === 'icon') return offline.filter(h => h.kind === 'icon');
        if (k === 'shape') return offline.filter(h => h.kind === 'shape');
        if (k === 'illustration') return offline.filter(h => h.kind === 'illustration');
        if (k === 'template') return offline.filter(h => h.kind === 'template');
        return [...offline, ...photos];
    });

    const insertHit = (hit: AssetHit) => { void hit.insert(); };

    // ── Browse view (empty query) helpers ──
    const iconNames = createMemo(() => {
        const mod = lucide();
        if (!mod) return [] as string[];
        return Object.keys(mod).filter(k => /^[A-Z][A-Za-z0-9]*$/.test(k) && typeof (mod as any)[k] === 'function');
    });
    const featured = createMemo(() => FEATURED_ICONS.filter(n => iconNames().includes(n)));

    const insertIcon = (name: string) => {
        const svg = renderLucideSvg(lucide(), name, 24);
        if (!svg) { showToast('Could not load icon', 'error'); return; }
        const SIZE = 120;
        const { x, y } = insertOrigin(SIZE);
        importSvgToCanvas(svg, { x, y, targetWidth: SIZE });
    };

    const insertShape = (type: string, options: any = {}) => {
        const SIZE = 240;
        const { x, y } = insertOrigin(SIZE);
        const id = (YappyAPI as any).createElement(type, x, y, SIZE, SIZE, options);
        YappyAPI.setSelected([id]);
    };

    const insertFrame = (type: string) => {
        insertShape(type, {
            strokeColor: '#94a3b8', strokeWidth: 2, strokeStyle: 'dashed',
            backgroundColor: '#f1f5f9', fillStyle: 'solid',
            backgroundImageFit: 'cover', renderStyle: 'architectural',
        });
        showToast('Frame added — drop a photo onto it to fill', 'info');
    };

    const SHAPES: { type: string; label: string; icon: any }[] = [
        { type: 'rectangle', label: 'Rectangle', icon: Square },
        { type: 'circle', label: 'Circle', icon: CircleIcon },
        { type: 'triangle', label: 'Triangle', icon: Triangle },
        { type: 'star', label: 'Star', icon: Star },
        { type: 'heart', label: 'Heart', icon: Heart },
        { type: 'hexagon', label: 'Hexagon', icon: Hexagon },
        { type: 'speechBubble', label: 'Speech', icon: MessageSquare },
        { type: 'arrowRight', label: 'Arrow', icon: ArrowRight },
    ];

    const FRAMES: { type: string; label: string; icon: any }[] = [
        { type: 'rectangle', label: 'Rect', icon: Square },
        { type: 'circle', label: 'Circle', icon: CircleIcon },
        { type: 'triangle', label: 'Triangle', icon: Triangle },
        { type: 'star', label: 'Star', icon: Star },
        { type: 'heart', label: 'Heart', icon: Heart },
        { type: 'hexagon', label: 'Hexagon', icon: Hexagon },
    ];

    const FontPairRow: Component<{ pair: FontPairing }> = (props) => {
        if (props.pair.heading.google) ensurePreviewFont(props.pair.heading.family);
        if (props.pair.body.google) ensurePreviewFont(props.pair.body.family);
        return (
            <button class="ep-pair" title={`Apply "${props.pair.name}" to all text`}
                onClick={() => applyFontPairing(props.pair.id)}>
                <span class="ep-pair-heading" style={{ 'font-family': previewFamily(props.pair.heading.family, props.pair.heading.google) }}>
                    {props.pair.name}
                </span>
                <span class="ep-pair-body" style={{ 'font-family': previewFamily(props.pair.body.family, props.pair.body.google) }}>
                    {props.pair.heading.family} + {props.pair.body.family}
                </span>
            </button>
        );
    };

    /** One result cell — svg thumb (icon/shape/illustration) or img thumb (photo). */
    const ResultCell: Component<{ hit: AssetHit }> = (props) => {
        const h = props.hit;
        if (h.thumbUrl && h.photo) {
            return (
                <button class="ep-cell ep-cell-photo" title={`${h.label}${h.photo.creator ? ` — ${h.photo.creator}` : ''} (click to insert, or drag onto the canvas)`}
                    draggable={true}
                    onDragStart={(e) => {
                        e.dataTransfer?.setData(STOCK_PHOTO_MIME, JSON.stringify(h.photo));
                        e.dataTransfer?.setData('text/plain', h.thumbUrl!);
                        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => { void insertStockPhoto(h.photo!); }}>
                    <img src={h.thumbUrl} alt={h.label} loading="lazy" />
                </button>
            );
        }
        if (h.kind === 'template') {
            return (
                <button class="ep-cell ep-cell-template" title={`${h.label} — click to load this template`} onClick={() => insertHit(h)}>
                    <span class="ep-tpl-preview" innerHTML={h.thumbSvg || ''} />
                    <span class="ep-cell-caption">{h.label}</span>
                </button>
            );
        }
        return (
            <button class="ep-cell" title={h.label} onClick={() => insertHit(h)} innerHTML={h.thumbSvg || ''} />
        );
    };

    return (
        <>
            <div class="ep-search">
                <Search size={13} />
                <input type="text" placeholder="Search elements — icons, illustrations, shapes, photos, templates…" value={query()}
                    onInput={(e) => setQuery(e.currentTarget.value)} />
            </div>

            {/* ── Results view (query present): blended feed + type chips ── */}
            <Show when={searching()}>
                <div class="ep-photo-filters">
                    <For each={['all', ...ACTIVE_KINDS] as KindFilter[]}>
                        {(k) => (
                            <button class={`ep-chip ${kindFilter() === k ? 'active' : ''}`}
                                onClick={() => setKindFilter(k)}>
                                {k === 'all' ? 'All' : KIND_LABELS[k]}
                            </button>
                        )}
                    </For>
                </div>
                <Show when={kindFilter() === 'photo'}>
                    <div class="ep-photo-filters">
                        <For each={[
                            { id: 'all' as const, label: 'All' },
                            { id: 'landscape' as const, label: 'Landscape' },
                            { id: 'portrait' as const, label: 'Portrait' },
                            { id: 'square' as const, label: 'Square' },
                        ]}>
                            {(o) => (
                                <button class={`ep-chip ${photoOrientation() === o.id ? 'active' : ''}`}
                                    onClick={() => setPhotoOrientation(o.id)}>
                                    {o.label}
                                </button>
                            )}
                        </For>
                    </div>
                </Show>
                <div class="elements-panel-body">
                    <Show when={lucide()} fallback={<div class="ep-loading">Loading…</div>}>
                        <Show when={results().length > 0}>
                            <div class="ep-grid ep-results-grid">
                                <For each={results()}>{(hit) => <ResultCell hit={hit} />}</For>
                            </div>
                        </Show>
                        <Show when={photosLoading() && kindFilter() !== 'icon' && kindFilter() !== 'shape'}>
                            <div class="ep-loading">Searching photos…</div>
                        </Show>
                        <Show when={!photosLoading() && results().length === 0}>
                            <div class="ep-loading">{photosError() || `No results for “${query().trim()}”`}</div>
                        </Show>
                        <Show when={kindFilter() === 'photo' && photoHits().length > 0}>
                            <div class="ep-attribution">Openly licensed via Wikimedia Commons — source link kept on each image.</div>
                        </Show>
                        <Show when={(kindFilter() === 'illustration' || kindFilter() === 'all') && results().some(h => h.kind === 'illustration')}>
                            <div class="ep-attribution">Illustrations from OpenMoji (openmoji.org) — CC BY-SA 4.0.</div>
                        </Show>
                    </Show>
                </div>
            </Show>

            {/* ── Browse view (empty query): shapes, frames, featured icons, fonts ── */}
            <Show when={!searching()}>
                <div class="elements-panel-body">
                    <div class="ep-section">Shapes</div>
                    <div class="ep-grid ep-grid-shapes">
                        <For each={SHAPES}>
                            {(s) => (
                                <button class="ep-cell ep-cell-shape" title={`Insert ${s.label}`} onClick={() => insertShape(s.type)}>
                                    <s.icon size={20} />
                                    <span class="ep-shape-label">{s.label}</span>
                                </button>
                            )}
                        </For>
                    </div>
                    <div class="ep-section">Frames (drop a photo in)</div>
                    <div class="ep-grid ep-grid-shapes">
                        <For each={FRAMES}>
                            {(f) => (
                                <button class="ep-cell ep-cell-shape ep-cell-frame" title={`Insert ${f.label} frame — drop a photo onto it to fill`} onClick={() => insertFrame(f.type)}>
                                    <f.icon size={20} stroke-dasharray="3 2" />
                                    <span class="ep-shape-label">{f.label}</span>
                                </button>
                            )}
                        </For>
                    </div>
                    <div class="ep-section">Icons — type above to search all</div>
                    <Suspense fallback={<div class="ep-loading">Loading icons…</div>}>
                        <Show when={lucide()} fallback={<div class="ep-loading">Loading icons…</div>}>
                            <div class="ep-grid">
                                <For each={featured()}>
                                    {(name) => {
                                        const IconComp = (lucide() as any)[name];
                                        return (
                                            <button class="ep-cell" title={name} onClick={() => insertIcon(name)}>
                                                <IconComp size={20} />
                                            </button>
                                        );
                                    }}
                                </For>
                            </div>
                        </Show>
                    </Suspense>
                    <div class="ep-section">Font pairs — click to apply to all text</div>
                    <For each={FONT_PAIRINGS}>
                        {(pair) => <FontPairRow pair={pair} />}
                    </For>
                </div>
            </Show>
        </>
    );
};

export default ElementsPanel;
