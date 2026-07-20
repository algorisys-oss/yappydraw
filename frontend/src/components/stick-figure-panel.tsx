import { type Component, For, Show, createSignal, createMemo } from 'solid-js';
import { store, createSymbol, toggleSymbolsPanel, toggleSceneTimeline } from '../store/app-store';
import { showToast } from './toast';
import { Search, Component as ComponentIcon, Star, Clock, Play, Pause, Film, Layers, FlipHorizontal2, Route, Video, Square } from 'lucide-solid';
import { setRequestRecording } from '../utils/recording-manager';
import {
    STICK_CATEGORIES, filterStickAssets, searchStickAssets, getStickAsset,
    insertStickFigure, recolorStickFigure, selectionHasStickFigure, restyleStickFace,
    stickFavorites, isStickFavorite, toggleStickFavorite, stickRecents,
    stickColorMode, setStickColorMode, toMonochromeSvg, applyFaceHair, stickFacePref,
    CLIP_LIST, poseAt, rigPoseToSvg, defaultRig,
    insertAnimatedFigure, setAnimatedFigureClip, setAnimatedFigurePlaying,
    flipAnimatedFigure, bakeAnimatedFigure, selectionHasAnimatedFigure,
    attachFigureToPath, detachFigurePath, pathFollowCandidate, selectedFigurePath,
    setFigureSequence, setAnimatedFigureSpeed, setFigurePathDuration,
    STICK_FIGURE_MIME, type StickAsset, type StickCategory, type StickVariant,
} from '../library/stick-figures';
import StickFaceControls from './stick-face-controls';
import './stick-figure-panel.css';

type ActiveCat = StickCategory | 'all' | 'favorites' | 'recents' | 'animated';
type ActiveVariant = StickVariant | 'all';

/** Static preview SVG for a clip (a representative frame). */
const clipThumb = (clipId: string): string => rigPoseToSvg(defaultRig(), poseAt(clipId, clipId === 'walk' ? 0.13 : 0.25, 1));

/** Quick recolour presets (outline colour). */
const OUTLINE_SWATCHES = ['#1f2937', '#0f172a', '#334155', '#7c3aed', '#dc2626', '#0891b2', '#15803d', '#b45309'];
const ACCENT_SWATCHES = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308'];
const HAIR_SWATCHES = ['#8b5e3c', '#2b2118', '#e0b040', '#c2410c', '#9ca3af', '#7c3aed', '#0891b2', '#be123c'];

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

    /** Thumbnail markup: exactly what the figure will look like when dropped. */
    const previewSvg = (asset: StickAsset): string => {
        const p = stickFacePref();
        const svg = applyFaceHair(asset.svg, { face: p.face, hair: p.hair, hairColor: p.hairColor, headFill: p.headFill });
        return stickColorMode() === 'mono' ? toMonochromeSvg(svg) : svg;
    };

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
    /** Hair colour goes through the restyle path so the head's stored state stays true. */
    const setHair = (c: string) => { restyleStickFace(store.selection, { hairColor: c }); };

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
    /** The selected animated figure's element id (for sequence editing). */
    const selFigureId = createMemo(() => store.elements.find(e => store.selection.includes(e.id) && e.type === 'stickRig')?.id);
    const sequence = createMemo<{ clip: string; dur: number }[]>(() => (selRig()?.sequence as any) || []);
    const writeSeq = (steps: { clip: string; dur: number }[]) => { const id = selFigureId(); if (id) setFigureSequence(id, steps); };
    const addStep = () => writeSeq([...sequence(), { clip: selRig()?.clip || 'walk', dur: 2 }]);
    const editStep = (i: number, patch: Partial<{ clip: string; dur: number }>) => writeSeq(sequence().map((s, j) => j === i ? { ...s, ...patch } : s));
    const removeStep = (i: number) => writeSeq(sequence().filter((_, j) => j !== i));

    /** Playback rate of the selected figure (1 = authored speed). */
    const speed = createMemo(() => Math.round(((selRig()?.speed ?? 1)) * 100) / 100);
    const setSpeed = (v: number) => { if (Number.isFinite(v)) setAnimatedFigureSpeed(store.selection, v); };

    /** Seconds for one lap of the route, at 1× — only meaningful while following a path. */
    const pathDur = createMemo(() => (selRig()?.path as any)?.dur ?? 4);
    const setLap = (v: number) => {
        const id = selFigureId();
        if (id && Number.isFinite(v)) setFigurePathDuration(id, v);
    };

    /** (figure, path) pair available in the selection to attach. */
    const pathCandidate = createMemo(() => pathFollowCandidate(store.selection));
    /** Whether the selected figure is already following a path. */
    const followingPath = createMemo(() => selectedFigurePath(store.selection));
    const walkPath = () => { const c = pathCandidate(); if (c) { attachFigureToPath(c.figureId, c.pathId); showToast('Figure now walks the path', 'success'); } };

    return (
        <>
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
                                        {/* Our own trusted inline SVG string (mono + face/hair prefs applied) */}
                                        <div class="sp-thumb" innerHTML={previewSvg(asset)} />
                                        <span class="sp-label">{asset.name}</span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
                </Show>

                {/* Face & hair — sets what new figures wear, and restyles the selection */}
                <StickFaceControls />

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
                        {/* Playback speed — applies to clips, sequences and path-following alike */}
                        <div class="sp-speed">
                            <label class="sp-speed-label" for="sp-speed-range">Speed</label>
                            <input id="sp-speed-range" class="sp-speed-range" type="range"
                                min="0.25" max="3" step="0.05" value={speed()}
                                onInput={(e) => setSpeed(parseFloat(e.currentTarget.value))} />
                            <input class="sp-speed-num" type="number" min="0.05" max="8" step="0.05"
                                value={speed()}
                                onInput={(e) => setSpeed(parseFloat(e.currentTarget.value))} />
                            <span class="sp-speed-x">×</span>
                            <button class="sp-speed-reset" title="Back to normal speed"
                                onClick={() => setSpeed(1)}>Reset</button>
                        </div>

                        {/* Walk-along-a-path */}
                        <Show when={pathCandidate() && !followingPath()}>
                            <button class="sp-symbol-btn sp-path-btn" title="The figure walks along the selected path" onClick={walkPath}>
                                <Route size={13} /> Walk this path
                            </button>
                        </Show>
                        <Show when={followingPath()}>
                            {/* How long one lap of the route takes at speed 1× */}
                            <div class="sp-speed">
                                <label class="sp-speed-label" for="sp-lap-num">Lap time</label>
                                <input id="sp-lap-num" class="sp-speed-num" type="number" min="0.5" max="120" step="0.5"
                                    value={pathDur()}
                                    onInput={(e) => setLap(parseFloat(e.currentTarget.value))} />
                                <span class="sp-speed-x">s</span>
                                <span class="sp-speed-note">at 1×</span>
                            </div>
                            <button class="sp-symbol-btn sp-path-btn" title="Stop following the path" onClick={() => detachFigurePath(followingPath()!.figureId)}>
                                <Route size={13} /> Stop following path
                            </button>
                        </Show>
                        <Show when={!pathCandidate() && !followingPath()}>
                            <div class="sp-anim-hint">Tip: draw a line/path, then select it <em>and</em> the figure (shift-click) to make the figure walk it.</div>
                        </Show>

                        {/* Action sequence (plays steps in order, loops) */}
                        <Show when={!followingPath()}>
                            <div class="sp-seq">
                                <div class="sp-seq-head">
                                    <span>Action sequence</span>
                                    <Show when={sequence().length > 0}>
                                        <button class="sp-seq-clear" title="Clear sequence" onClick={() => writeSeq([])}>Clear</button>
                                    </Show>
                                </div>
                                <For each={sequence()}>
                                    {(step, i) => (
                                        <div class="sp-seq-row">
                                            <span class="sp-seq-n">{i() + 1}</span>
                                            <select class="sp-seq-clip" value={step.clip} onChange={(e) => editStep(i(), { clip: e.currentTarget.value })}>
                                                <For each={CLIP_LIST}>{(c) => <option value={c.id}>{c.name}</option>}</For>
                                            </select>
                                            <input class="sp-seq-dur" type="number" min="0.5" step="0.5" value={step.dur}
                                                onInput={(e) => editStep(i(), { dur: Math.max(0.5, parseFloat(e.currentTarget.value) || 0.5) })} />
                                            <span class="sp-seq-s">s</span>
                                            <button class="sp-seq-x" title="Remove step" onClick={() => removeStep(i())}>×</button>
                                        </div>
                                    )}
                                </For>
                                <button class="sp-symbol-btn sp-seq-add" onClick={addStep}>+ Add step</button>
                                <Show when={sequence().length === 0}>
                                    <div class="sp-anim-hint">Chain motions over time — e.g. Walk 3s → Wave 2s → Talk 2s.</div>
                                </Show>
                            </div>
                        </Show>

                        {/* Record the animation to a video */}
                        <Show when={!store.isRecording} fallback={
                            <button class="sp-symbol-btn sp-path-btn sp-rec-on" onClick={() => setRequestRecording({ start: false })}>
                                <Square size={12} /> Stop &amp; save recording
                            </button>
                        }>
                            <button class="sp-symbol-btn sp-path-btn" title="Record the canvas (animations included) to a video file" onClick={() => setRequestRecording({ start: true, format: 'webm' })}>
                                <Video size={13} /> Record video
                            </button>
                        </Show>
                        <button class={`sp-symbol-btn sp-path-btn ${store.showSceneTimeline ? 'sp-tl-on' : ''}`}
                            title="Open the Scene Timeline to play & scrub all figures together" onClick={() => toggleSceneTimeline()}>
                            <Film size={13} /> Scene timeline
                        </button>
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
                        <div class="sp-recolor-row">
                            <label class="sp-recolor-label">Hair
                                <input type="color" class="sp-color" value="#8b5e3c"
                                    onInput={(e) => setHair(e.currentTarget.value)} />
                            </label>
                            <div class="sp-swatches">
                                <For each={HAIR_SWATCHES}>
                                    {(c) => <button class="sp-sw" style={{ background: c }} title={`Hair ${c}`} onClick={() => setHair(c)} />}
                                </For>
                            </div>
                        </div>
                        <button class="sp-symbol-btn" title="Save this figure as a reusable Symbol" onClick={addToSymbols}>
                            <ComponentIcon size={13} /> Add to Symbols
                        </button>
                    </div>
                </Show>
        </>
    );
};

export default StickFigurePanel;
