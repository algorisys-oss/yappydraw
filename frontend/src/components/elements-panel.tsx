import { type Component, For, Show, createSignal, createMemo, createResource, Suspense } from 'solid-js';
import { render } from 'solid-js/web';
import { store, toggleElementsPanel } from '../store/app-store';
import { importSvgToCanvas } from '../utils/svg-import';
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

/** Insert position: top-left third of the active page (or near viewport origin). */
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

const ElementsPanel: Component = () => {
    const [query, setQuery] = createSignal('');

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

    const insertFrame = (type: 'rectangle' | 'circle') => {
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

    return (
        <Show when={store.showElementsPanel}>
            <div class="elements-panel" ref={draggablePanel('.elements-panel-header')}>
                <div class="elements-panel-header">
                    <div class="ep-title"><Shapes size={14} /><h3>Elements</h3></div>
                    <button class="ep-icon-btn" title="Close" onClick={() => toggleElementsPanel(false)}><X size={15} /></button>
                </div>
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
                        <button class="ep-cell" onClick={() => insertFrame('rectangle')}><span class="ep-frame-rect" /></button>
                        <button class="ep-cell" onClick={() => insertFrame('circle')}><span class="ep-frame-circle" /></button>
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
            </div>
        </Show>
    );
};

export default ElementsPanel;
