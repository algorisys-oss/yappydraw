import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { store, toggleStickFigurePanel, createSymbol, toggleSymbolsPanel } from '../store/app-store';
import { draggablePanel } from '../utils/draggable-panel';
import { showToast } from './toast';
import { PersonStanding, X, Search, Component as ComponentIcon } from 'lucide-solid';
import {
    STICK_CATEGORIES, filterStickAssets, searchStickAssets,
    insertStickFigure, recolorStickFigure, selectionHasStickFigure,
    STICK_FIGURE_MIME, type StickAsset, type StickCategory, type StickVariant,
} from '../library/stick-figures';
import './stick-figure-panel.css';

type ActiveCat = StickCategory | 'all';
type ActiveVariant = StickVariant | 'all';

/** Quick recolour presets (outline colour). */
const OUTLINE_SWATCHES = ['#1f2937', '#0f172a', '#334155', '#7c3aed', '#dc2626', '#0891b2', '#15803d', '#b45309'];
const ACCENT_SWATCHES = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308'];

const VARIANT_CHIPS: { id: ActiveVariant; label: string }[] = [
    { id: 'male', label: 'Man' }, { id: 'female', label: 'Woman' },
    { id: 'boy', label: 'Boy' }, { id: 'girl', label: 'Girl' }, { id: 'all', label: 'All' },
];

const StickFigurePanel: Component = () => {
    const [query, setQuery] = createSignal('');
    const [cat, setCat] = createSignal<ActiveCat>('all');
    const [variant, setVariant] = createSignal<ActiveVariant>('male');

    /** Figures to show: search overrides category/variant filters. */
    const visible = createMemo<StickAsset[]>(() => {
        const q = query().trim();
        if (q) return searchStickAssets(q);
        return filterStickAssets({ category: cat(), variant: variant() });
    });

    /** Variant chips only matter for figure categories (props/scenes have none). */
    const showVariants = createMemo(() => cat() !== 'props' && cat() !== 'scenes' && !query().trim());

    /** Click → drop centered on the active page as one editable group. */
    const dropCentered = (asset: StickAsset) => insertStickFigure(asset.id);

    /** Whether the current selection includes a stick figure to recolour. */
    const canRecolor = createMemo(() => selectionHasStickFigure(store.selection));
    const setOutline = (c: string) => recolorStickFigure(store.selection, { outline: c });
    const setAccent = (c: string) => recolorStickFigure(store.selection, { accent: c });

    /** Register the selected figure as a reusable Symbol. */
    const addToSymbols = () => {
        if (store.selection.length < 1) return;
        const id = createSymbol(store.selection, 'Stick figure');
        if (id) { toggleSymbolsPanel(true); showToast('Added to Symbols — place linked instances from the Symbols panel', 'success'); }
    };

    return (
        <Show when={store.showStickFigurePanel}>
            <div class="stick-panel" ref={draggablePanel('.stick-panel-header')}>
                <div class="stick-panel-header">
                    <div class="sp-title"><PersonStanding size={15} /><h3>Stick Figures</h3></div>
                    <button class="sp-icon-btn" title="Close" onClick={() => toggleStickFigurePanel(false)}><X size={15} /></button>
                </div>

                <div class="sp-search">
                    <Search size={13} />
                    <input type="text" placeholder="Search figures…" value={query()}
                        onInput={(e) => setQuery(e.currentTarget.value)} />
                </div>

                {/* Category chips (hidden while searching) */}
                <Show when={!query().trim()}>
                    <div class="sp-cats">
                        <button class={`sp-chip ${cat() === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>All</button>
                        <For each={STICK_CATEGORIES}>
                            {(c) => (
                                <button class={`sp-chip ${cat() === c.id ? 'active' : ''}`}
                                    title={c.description} onClick={() => setCat(c.id)}>
                                    {c.name}
                                </button>
                            )}
                        </For>
                    </div>
                </Show>

                {/* Character variant chips */}
                <Show when={showVariants()}>
                    <div class="sp-variants">
                        <For each={VARIANT_CHIPS}>
                            {(v) => (
                                <button class={`sp-vchip ${variant() === v.id ? 'active' : ''}`}
                                    onClick={() => setVariant(v.id)}>{v.label}</button>
                            )}
                        </For>
                    </div>
                </Show>

                <div class="stick-panel-body">
                    <Show when={visible().length > 0} fallback={
                        <div class="sp-empty">No figures match “{query()}”.</div>
                    }>
                        <div class="sp-grid">
                            <For each={visible()}>
                                {(asset) => (
                                    <button class="sp-cell" title={`${asset.name} — click to add, or drag onto the canvas`}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.dataTransfer?.setData(STICK_FIGURE_MIME, asset.id);
                                            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        onClick={() => dropCentered(asset)}>
                                        {/* Our own trusted inline SVG string */}
                                        <div class="sp-thumb" innerHTML={asset.svg} />
                                        <span class="sp-label">{asset.name}</span>
                                    </button>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>

                {/* Recolour the selected figure by semantic part */}
                <Show when={canRecolor()} fallback={
                    <div class="sp-foot">Click to add centered · drag onto the canvas to place · drops as an editable, recolourable group.</div>
                }>
                    <div class="sp-recolor">
                        <div class="sp-recolor-title">Recolour selected figure</div>
                        <div class="sp-recolor-row">
                            <label class="sp-recolor-label">Outline
                                <input type="color" class="sp-color" value="#1f2937"
                                    onInput={(e) => setOutline(e.currentTarget.value)} />
                            </label>
                            <div class="sp-swatches">
                                <For each={OUTLINE_SWATCHES}>
                                    {(c) => <button class="sp-sw" style={{ background: c }} title={`Outline ${c}`} onClick={() => setOutline(c)} />}
                                </For>
                            </div>
                        </div>
                        <div class="sp-recolor-row">
                            <label class="sp-recolor-label">Accent
                                <input type="color" class="sp-color" value="#3b82f6"
                                    onInput={(e) => setAccent(e.currentTarget.value)} />
                            </label>
                            <div class="sp-swatches">
                                <For each={ACCENT_SWATCHES}>
                                    {(c) => <button class="sp-sw" style={{ background: c }} title={`Accent ${c}`} onClick={() => setAccent(c)} />}
                                </For>
                            </div>
                        </div>
                        <button class="sp-symbol-btn" title="Save this figure as a reusable Symbol" onClick={addToSymbols}>
                            <ComponentIcon size={13} /> Add to Symbols
                        </button>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

export default StickFigurePanel;
