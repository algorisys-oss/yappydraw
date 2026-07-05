import { type Component, For, Show, createSignal, createMemo, createResource, Suspense } from 'solid-js';
import { render } from 'solid-js/web';
import { store, toggleElementsPanel } from '../store/app-store';
import { importSvgToCanvas } from '../utils/svg-import';
import { FONT_PAIRINGS, applyFontPairing, type FontPairing } from '../brand/font-pairing';
import { searchStockPhotos, insertStockPhoto, STOCK_PHOTO_MIME, type StockPhoto } from '../utils/stock-photos';
import { YappyAPI } from '../api';
import { showToast } from './toast';
import {
    Shapes, X, Search,
    Square, Circle as CircleIcon, Triangle, Star, Heart, Hexagon, MessageSquare, ArrowRight,
} from 'lucide-solid';
import { draggablePanel } from '../utils/draggable-panel';
import './elements-panel.css';

/** Icons shown before the user searches (a useful, popular subset). */
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

const MAX_RESULTS = 96;

type PanelTab = 'elements' | 'fonts' | 'photos';

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
    const [tab, setTab] = createSignal<PanelTab>('elements');
    const [query, setQuery] = createSignal('');
    const [photoQuery, setPhotoQuery] = createSignal('');
    const [photos, setPhotos] = createSignal<StockPhoto[]>([]);
    const [photosLoading, setPhotosLoading] = createSignal(false);
    const [photosError, setPhotosError] = createSignal('');
    const [photoOrientation, setPhotoOrientation] = createSignal<'all' | 'landscape' | 'portrait' | 'square'>('all');

    const visiblePhotos = createMemo(() => {
        const o = photoOrientation();
        if (o === 'all') return photos();
        return photos().filter(p => {
            const r = p.width / p.height;
            if (o === 'square') return r >= 0.9 && r <= 1.1;
            return o === 'landscape' ? r > 1.1 : r < 0.9;
        });
    });

    // The full lucide-solid module is heavy — load it only when the panel opens.
    const [lucide] = createResource(() => store.showElementsPanel, async (open) => {
        if (!open) return null;
        return await import('lucide-solid');
    });

    const iconNames = createMemo(() => {
        const mod = lucide();
        if (!mod) return [] as string[];
        return Object.keys(mod).filter(k => /^[A-Z][A-Za-z0-9]*$/.test(k) && typeof (mod as any)[k] === 'function');
    });

    const visibleIcons = createMemo(() => {
        const names = iconNames();
        if (names.length === 0) return [] as string[];
        const q = query().trim().toLowerCase().replace(/[\s-_]+/g, '');
        if (!q) return FEATURED_ICONS.filter(n => names.includes(n));
        return names.filter(n => n.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
    });

    /** Render a lucide component off-screen to get its SVG markup. */
    const iconToSvgText = (name: string): string | null => {
        const mod = lucide();
        const IconComp = mod && (mod as any)[name];
        if (!IconComp) return null;
        const host = document.createElement('div');
        const dispose = render(() => IconComp({ size: 24 }), host);
        const svg = host.querySelector('svg')?.outerHTML || null;
        dispose();
        return svg;
    };

    const insertIcon = (name: string) => {
        const svg = iconToSvgText(name);
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

    const FRAMES: { type: string; label: string; icon: any }[] = [
        { type: 'rectangle', label: 'Rect', icon: Square },
        { type: 'circle', label: 'Circle', icon: CircleIcon },
        { type: 'triangle', label: 'Triangle', icon: Triangle },
        { type: 'star', label: 'Star', icon: Star },
        { type: 'heart', label: 'Heart', icon: Heart },
        { type: 'hexagon', label: 'Hexagon', icon: Hexagon },
    ];

    const runPhotoSearch = async () => {
        const q = photoQuery().trim();
        if (!q) return;
        setPhotosLoading(true);
        setPhotosError('');
        try {
            setPhotos(await searchStockPhotos(q));
        } catch (e: any) {
            setPhotos([]);
            setPhotosError(e?.message || 'Photo search failed');
        } finally {
            setPhotosLoading(false);
        }
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

    return (
        <Show when={store.showElementsPanel}>
            <div class="elements-panel" ref={draggablePanel('.elements-panel-header')}>
                <div class="elements-panel-header">
                    <div class="ep-title"><Shapes size={14} /><h3>Elements</h3></div>
                    <button class="ep-icon-btn" title="Close" onClick={() => toggleElementsPanel(false)}><X size={15} /></button>
                </div>

                <div class="ep-tabs">
                    <button class={`ep-tab ${tab() === 'elements' ? 'active' : ''}`} onClick={() => setTab('elements')}>Elements</button>
                    <button class={`ep-tab ${tab() === 'fonts' ? 'active' : ''}`} onClick={() => setTab('fonts')}>Fonts</button>
                    <button class={`ep-tab ${tab() === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>Photos</button>
                </div>

                {/* ── Elements: shapes, frames, icons ── */}
                <Show when={tab() === 'elements'}>
                    <div class="ep-search">
                        <Search size={13} />
                        <input type="text" placeholder="Search icons…" value={query()}
                            onInput={(e) => setQuery(e.currentTarget.value)} />
                    </div>
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
                        <div class="ep-section">Icons</div>
                        <Suspense fallback={<div class="ep-loading">Loading icons…</div>}>
                            <Show when={lucide()} fallback={<div class="ep-loading">Loading icons…</div>}>
                                <div class="ep-grid">
                                    <For each={visibleIcons()}>
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
                                <Show when={query() && visibleIcons().length === 0}>
                                    <div class="ep-loading">No icons match “{query()}”</div>
                                </Show>
                            </Show>
                        </Suspense>
                    </div>
                </Show>

                {/* ── Fonts: curated heading/body pairings ── */}
                <Show when={tab() === 'fonts'}>
                    <div class="elements-panel-body">
                        <div class="ep-section">Font pairs — click to apply to all text</div>
                        <For each={FONT_PAIRINGS}>
                            {(pair) => <FontPairRow pair={pair} />}
                        </For>
                    </div>
                </Show>

                {/* ── Photos: openly-licensed stock search (Wikimedia Commons) ── */}
                <Show when={tab() === 'photos'}>
                    <div class="ep-search">
                        <Search size={13} />
                        <input type="text" placeholder="Search photos… (Enter)" value={photoQuery()}
                            onInput={(e) => setPhotoQuery(e.currentTarget.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') runPhotoSearch(); }} />
                    </div>
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
                    <div class="elements-panel-body">
                        <Show when={!photosLoading()} fallback={<div class="ep-loading">Searching…</div>}>
                            <Show when={visiblePhotos().length > 0} fallback={
                                <div class="ep-loading">
                                    {photosError()
                                        || (photos().length > 0 ? `No ${photoOrientation()} photos in these results — try another search or filter.`
                                        : 'Openly-licensed photos via Wikimedia Commons. Type a search and press Enter.')}
                                </div>
                            }>
                                <div class="ep-photo-grid">
                                    <For each={visiblePhotos()}>
                                        {(p) => (
                                            <button class="ep-photo" title={`${p.title}${p.creator ? ` — ${p.creator}` : ''} (click to insert, or drag onto the canvas)`}
                                                draggable={true}
                                                onDragStart={(e) => {
                                                    e.dataTransfer?.setData(STOCK_PHOTO_MIME, JSON.stringify(p));
                                                    e.dataTransfer?.setData('text/plain', p.thumbnail);
                                                    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
                                                }}
                                                onClick={() => insertStockPhoto(p)}>
                                                <img src={p.thumbnail} alt={p.title} loading="lazy" />
                                            </button>
                                        )}
                                    </For>
                                </div>
                                <div class="ep-attribution">Openly licensed via Wikimedia Commons — source link kept on each image.</div>
                            </Show>
                        </Show>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

export default ElementsPanel;
