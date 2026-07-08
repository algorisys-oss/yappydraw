import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { store, toggleStickFigurePanel, createSymbol, toggleSymbolsPanel } from '../store/app-store';
import { draggablePanel } from '../utils/draggable-panel';
import { showToast } from './toast';
import { PersonStanding, X, Search, Component as ComponentIcon, Star, Clock, Play, Pause, Film, Layers, FlipHorizontal2, Route } from 'lucide-solid';
import {
    STICK_CATEGORIES, filterStickAssets, searchStickAssets, getStickAsset,
    insertStickFigure, recolorStickFigure, selectionHasStickFigure,
    stickFavorites, isStickFavorite, toggleStickFavorite, stickRecents,
    stickColorMode, setStickColorMode, toMonochromeSvg,
    CLIP_LIST, poseAt, rigPoseToSvg, defaultRig,
    insertAnimatedFigure, setAnimatedFigureClip, setAnimatedFigurePlaying,
    flipAnimatedFigure, bakeAnimatedFigure, selectionHasAnimatedFigure,
    attachFigureToPath, detachFigurePath, pathFollowCandidate, selectedFigurePath,
    STICK_FIGURE_MIME, type StickAsset, type StickCategory, type StickVariant,
} from '../library/stick-figures';
import './stick-figure-panel.css';

type ActiveCat = StickCategory | 'all' | 'favorites' | 'recents' | 'animated';
type ActiveVariant = StickVariant | 'all';

/** Static preview SVG for a clip (a representative frame). */
const clipThumb = (clipId: string): string => rigPoseToSvg(defaultRig(), poseAt(clipId, clipId === 'walk' ? 0.13 : 0.25, 1));

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

    const byId = (ids: string[]) => ids.map(getStickAsset).filter(Boolean) as StickAsset[];

    /** Figures to show: search overrides category/variant filters. */
    const visible = createMemo<StickAsset[]>(() => {
        const q = query().trim();
        if (q) return searchStickAssets(q);
        const c = cat();
        if (c === 'favorites') return byId(stickFavorites());
        if (c === 'recents') return byId(stickRecents());
        if (c === 'animated') return [];
        return filterStickAssets({ category: c, variant: variant() });
    });

    /** Variant chips only matter for figure categories (props/scenes/favs/recents have none). */
    const showVariants = createMemo(() =>
        !query().trim() && !['props', 'scenes', 'favorites', 'recents', 'animated'].includes(cat()));

    /** Click → drop centered on the active page as one editable group. */
    const dropCentered = (asset: StickAsset) => insertStickFigure(asset.id);

    /** Keyboard roving focus across the 3-column grid. */
    const onGridKey = (e: KeyboardEvent) => {
        const cells = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('.sp-cell'));
        const i = cells.indexOf(document.activeElement as HTMLElement);
        if (i < 0) return;
        const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1
            : e.key === 'ArrowDown' ? 3 : e.key === 'ArrowUp' ? -3 : 0;
        if (!delta) return;
        const next = cells[i + delta];
        if (next) { e.preventDefault(); next.focus(); }
    };

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

    // ── Animated figures ──
    const canAnimate = createMemo(() => selectionHasAnimatedFigure(store.selection));
    /** The clip + playing state of the first selected animated figure (for the controls). */
    const selRig = createMemo(() => store.elements.find(e => store.selection.includes(e.id) && e.type === 'stickRig')?.stickRig);
    const dropAnimated = (clipId: string) => insertAnimatedFigure(clipId);
    const bakeSelected = () => { const n = bakeAnimatedFigure(store.selection[0]); if (n.length) showToast('Baked to editable paths', 'success'); };
    /** (figure, path) pair available in the selection to attach. */
    const pathCandidate = createMemo(() => pathFollowCandidate(store.selection));
    /** Whether the selected figure is already following a path. */
    const followingPath = createMemo(() => selectedFigurePath(store.selection));
    const walkPath = () => { const c = pathCandidate(); if (c) { attachFigureToPath(c.figureId, c.pathId); showToast('Figure now walks the path', 'success'); } };

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
                    <div class="sp-mode" title="Drop figures in colour or pure monochrome">
                        <button class={`sp-mode-btn ${stickColorMode() === 'color' ? 'active' : ''}`}
                            onClick={() => setStickColorMode('color')}>Colour</button>
                        <button class={`sp-mode-btn ${stickColorMode() === 'mono' ? 'active' : ''}`}
                            onClick={() => setStickColorMode('mono')}>Mono</button>
                    </div>
                </div>

                {/* Category chips (hidden while searching) */}
                <Show when={!query().trim()}>
                    <div class="sp-cats">
                        <button class={`sp-chip sp-chip-fav ${cat() === 'favorites' ? 'active' : ''}`}
                            title="Your starred figures" onClick={() => setCat('favorites')}><Star size={11} /> Favourites</button>
                        <button class={`sp-chip ${cat() === 'recents' ? 'active' : ''}`}
                            title="Recently used" onClick={() => setCat('recents')}><Clock size={11} /> Recent</button>
                        <button class={`sp-chip sp-chip-anim ${cat() === 'animated' ? 'active' : ''}`}
                            title="Animated figures — walk, wave, talk…" onClick={() => setCat('animated')}><Film size={11} /> Animated</button>
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

                {/* ── Animated: motion-clip grid ── */}
                <Show when={cat() === 'animated' && !query().trim()}>
                    <div class="stick-panel-body">
                        <div class="sp-anim-hint">Click a motion to add an animated figure. It plays on the canvas; select it to switch clip, pause, or bake.</div>
                        <div class="sp-grid">
                            <For each={CLIP_LIST}>
                                {(c) => (
                                    <div class="sp-cell" tabindex="0" role="button"
                                        title={`${c.name} — add an animated figure`}
                                        onClick={() => dropAnimated(c.id)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropAnimated(c.id); } }}>
                                        <div class="sp-thumb" innerHTML={clipThumb(c.id)} />
                                        <span class="sp-label">{c.name}</span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                </Show>

                <Show when={cat() !== 'animated' || query().trim()}>
                <div class="stick-panel-body">
                    <Show when={visible().length > 0} fallback={
                        <div class="sp-empty">
                            {cat() === 'favorites' ? 'No favourites yet — tap the ★ on a figure to save it here.'
                                : cat() === 'recents' ? 'Nothing used yet — figures you add show up here.'
                                : `No figures match “${query()}”.`}
                        </div>
                    }>
                        <div class="sp-grid" onKeyDown={onGridKey}>
                            <For each={visible()}>
                                {(asset) => (
                                    <div class="sp-cell" tabindex="0" role="button"
                                        title={`${asset.name} — click to add, or drag onto the canvas`}
                                        draggable={true}
                                        onDragStart={(e) => {
                                            e.dataTransfer?.setData(STICK_FIGURE_MIME, asset.id);
                                            if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
                                        }}
                                        onClick={() => dropCentered(asset)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dropCentered(asset); } }}>
                                        <button class={`sp-fav ${isStickFavorite(asset.id) ? 'on' : ''}`}
                                            title={isStickFavorite(asset.id) ? 'Remove from favourites' : 'Add to favourites'}
                                            onClick={(e) => { e.stopPropagation(); toggleStickFavorite(asset.id); }}>
                                            <Star size={12} />
                                        </button>
                                        {/* Our own trusted inline SVG string (mono preview follows the toggle) */}
                                        <div class="sp-thumb" innerHTML={stickColorMode() === 'mono' ? toMonochromeSvg(asset.svg) : asset.svg} />
                                        <span class="sp-label">{asset.name}</span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
                </Show>

                {/* ── Animated figure controls (selected stickRig) ── */}
                <Show when={canAnimate()}>
                    <div class="sp-recolor">
                        <div class="sp-recolor-title">Animated figure</div>
                        <div class="sp-anim-clips">
                            <For each={CLIP_LIST}>
                                {(c) => (
                                    <button class={`sp-chip ${selRig()?.clip === c.id ? 'active' : ''}`}
                                        onClick={() => setAnimatedFigureClip(store.selection, c.id)}>{c.name}</button>
                                )}
                            </For>
                        </div>
                        <div class="sp-anim-row">
                            <button class="sp-symbol-btn" onClick={() => setAnimatedFigurePlaying(store.selection)}>
                                <Show when={selRig()?.playing !== false} fallback={<><Play size={13} /> Play</>}><Pause size={13} /> Pause</Show>
                            </button>
                            <button class="sp-symbol-btn" title="Flip facing (left / right)" onClick={() => flipAnimatedFigure(store.selection)}>
                                <FlipHorizontal2 size={13} /> Flip
                            </button>
                            <button class="sp-symbol-btn" title="Bake the current frame to editable paths" onClick={bakeSelected}>
                                <Layers size={13} /> Bake
                            </button>
                        </div>
                        {/* Walk-along-a-path */}
                        <Show when={pathCandidate() && !followingPath()}>
                            <button class="sp-symbol-btn sp-path-btn" title="The figure walks along the selected path" onClick={walkPath}>
                                <Route size={13} /> Walk this path
                            </button>
                        </Show>
                        <Show when={followingPath()}>
                            <button class="sp-symbol-btn sp-path-btn" title="Stop following the path" onClick={() => detachFigurePath(followingPath()!.figureId)}>
                                <Route size={13} /> Stop following path
                            </button>
                        </Show>
                        <Show when={!pathCandidate() && !followingPath()}>
                            <div class="sp-anim-hint">Tip: draw a line/path, then select it <em>and</em> the figure (shift-click) to make the figure walk it.</div>
                        </Show>
                    </div>
                </Show>

                {/* Recolour the selected figure by semantic part */}
                <Show when={canRecolor()} fallback={
                    <Show when={!canAnimate()}>
                        <div class="sp-foot">Click to add centered · drag onto the canvas to place · drops as an editable, recolourable group.</div>
                    </Show>
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
