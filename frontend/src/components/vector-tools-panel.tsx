import { type Component, For, Show, createSignal, onCleanup } from 'solid-js';
import {
    store, toggleVectorToolsPanel,
    toggleShapeBuilder, toggleLivePaint, toggleCutTool, toggleWidthTool, toggleCurveTool,
    toggleReshapeTool, toggleBlobBrush, togglePathEraser, togglePuppetWarp, togglePerspectiveGrid,
    toggleSymbolSprayer, toggleSymbolism, toggleSliceTool, selectSimilar,
    setTextVertical, toggleTouchType, toggleTypeOnPath, applyDistort, exitAllToolModes,
} from '../store/app-store';
import { YappyAPI } from '../api';
import {
    Combine, PaintBucket, Spline, Waypoints, Scissors, PenLine, Brush, Eraser,
    Frame, Grid3x3, SprayCan, Sparkles, Crop, Wand2, X,
    Type, AlignVerticalJustifyCenter, TextCursor, Tornado, Grid2x2, Target, Sun, Waves, PlusCircle,
} from 'lucide-solid';
import { draggablePanel } from '../utils/draggable-panel';
import './vector-tools-panel.css';

/**
 * Vector Tools — a dedicated floating, draggable palette surfacing every Illustrator-class
 * tool as a labelled row (grouped Build / Path / Paint / Warp / Symbol / Text / Insert /
 * Effects). Mode-tool rows highlight while active; one-shot tools fire immediately; the
 * Distort row expands into a flyout of the six effects. Visibility persists across reloads.
 */
type Tool = { label: string; icon: any; active?: () => boolean; run: () => void };

const VectorToolsPanel: Component = () => {
    const [distortOpen, setDistortOpen] = createSignal(false);

    // viewport centre in world coords, for inserting generative shapes
    const center = () => {
        const vs = store.viewState as any;
        return {
            x: (window.innerWidth / 2 - (vs.panX || 0)) / (vs.scale || 1),
            y: (window.innerHeight / 2 - (vs.panY || 0)) / (vs.scale || 1),
        };
    };
    const selText = () => { const e = store.elements.find(el => el.id === store.selection[0]); return e && (e.type === 'text' || e.type === 'richtext') ? e : null; };
    // Exclusive mode activation: clicking a mode-tool turns OFF every other overlay (no stacking),
    // and toggles the clicked one. (`turnOn` may be special-cased, e.g. the Symbol Sprayer.)
    const modeRun = (isOn: () => boolean, turnOn: () => void) => () => { const was = isOn(); exitAllToolModes(); if (!was) turnOn(); };

    const groups: { name: string; tools: Tool[] }[] = [
        {
            name: 'Build', tools: [
                { label: 'Shape Builder', icon: Combine, active: () => store.shapeBuilderActive, run: modeRun(() => store.shapeBuilderActive, () => toggleShapeBuilder(true)) },
                { label: 'Live Paint', icon: PaintBucket, active: () => store.livePaintActive, run: modeRun(() => store.livePaintActive, () => toggleLivePaint(true)) },
                { label: 'Magic Wand', icon: Wand2, run: () => selectSimilar() },
            ],
        },
        {
            name: 'Path', tools: [
                { label: 'Curvature', icon: Spline, active: () => store.curveToolActive, run: modeRun(() => store.curveToolActive, () => toggleCurveTool(true)) },
                { label: 'Reshape', icon: Waypoints, active: () => store.reshapeToolActive, run: modeRun(() => store.reshapeToolActive, () => toggleReshapeTool(true)) },
                { label: 'Knife / Scissors', icon: Scissors, active: () => store.cutToolActive, run: modeRun(() => store.cutToolActive, () => toggleCutTool(true)) },
                { label: 'Width', icon: PenLine, active: () => store.widthToolActive, run: modeRun(() => store.widthToolActive, () => toggleWidthTool(true)) },
            ],
        },
        {
            name: 'Paint', tools: [
                { label: 'Blob Brush', icon: Brush, active: () => store.blobBrushActive, run: modeRun(() => store.blobBrushActive, () => toggleBlobBrush(true)) },
                { label: 'Path Eraser', icon: Eraser, active: () => store.pathEraserActive, run: modeRun(() => store.pathEraserActive, () => togglePathEraser(true)) },
            ],
        },
        {
            name: 'Warp', tools: [
                { label: 'Puppet Warp', icon: Frame, active: () => store.puppetWarpActive, run: modeRun(() => store.puppetWarpActive, () => togglePuppetWarp(true)) },
                { label: 'Perspective Grid', icon: Grid3x3, active: () => store.perspectiveGridActive, run: () => togglePerspectiveGrid() },
            ],
        },
        {
            name: 'Symbol', tools: [
                { label: 'Symbol Sprayer', icon: SprayCan, active: () => store.sprayerActive, run: modeRun(() => store.sprayerActive, () => toggleSymbolSprayer(store.symbols[0]?.id)) },
                { label: 'Symbolism Brush', icon: Sparkles, active: () => store.symbolismActive, run: modeRun(() => store.symbolismActive, () => toggleSymbolism(true)) },
                { label: 'Slice (export region)', icon: Crop, active: () => store.sliceToolActive, run: modeRun(() => store.sliceToolActive, () => toggleSliceTool(true)) },
            ],
        },
        {
            name: 'Text', tools: [
                { label: 'Vertical Type', icon: AlignVerticalJustifyCenter, active: () => !!selText()?.verticalText, run: () => { const t = selText(); if (t) setTextVertical(t.id); } },
                { label: 'Touch Type', icon: TextCursor, active: () => store.touchTypeActive, run: modeRun(() => store.touchTypeActive, () => toggleTouchType(true)) },
                { label: 'Type on Path', icon: Type, active: () => store.typeOnPathActive, run: modeRun(() => store.typeOnPathActive, () => toggleTypeOnPath(true)) },
            ],
        },
        {
            name: 'Insert', tools: [
                { label: 'Spiral', icon: Tornado, run: () => { const c = center(); YappyAPI.createSpiral(c.x, c.y, 100, 3, 0.1); } },
                { label: 'Arc', icon: Spline, run: () => { const c = center(); YappyAPI.createArc(c.x, c.y, 100, 0, 270); } },
                { label: 'Rectangular Grid', icon: Grid2x2, run: () => { const c = center(); YappyAPI.createRectGrid(c.x - 100, c.y - 80, 200, 160, 4, 4); } },
                { label: 'Polar Grid', icon: Target, run: () => { const c = center(); YappyAPI.createPolarGrid(c.x, c.y, 100, 3, 8); } },
                { label: 'Lens Flare', icon: Sun, run: () => { const c = center(); const ds = store.defaultElementStyles; YappyAPI.createFlare(c.x, c.y, 90, 12, 4, { strokeColor: ds.strokeColor || undefined, backgroundColor: (ds.backgroundColor && ds.backgroundColor !== 'transparent') ? ds.backgroundColor : undefined }); } },
            ],
        },
    ];

    const distorts: { label: string; kind: any; amt: number }[] = [
        { label: 'Pucker', kind: 'pucker', amt: 0.25 }, { label: 'Bloat', kind: 'bloat', amt: 0.25 },
        { label: 'Twirl', kind: 'twirl', amt: 0.25 }, { label: 'Zig-Zag', kind: 'zigzag', amt: 0.12 },
        { label: 'Crystallize', kind: 'crystallize', amt: 0.18 }, { label: 'Roughen', kind: 'roughen', amt: 0.1 },
    ];

    // Wire dragging (header) + persist the resized dimensions (native CSS resize grip writes
    // inline width/height; we save them and restore on next open).
    const setupPanel = (el: HTMLDivElement) => {
        draggablePanel('.vt-header')(el);
        try {
            const saved = JSON.parse(localStorage.getItem('vectorToolsSize') || 'null');
            if (saved?.w) el.style.width = saved.w + 'px';
            if (saved?.h) el.style.height = saved.h + 'px';
        } catch { /* ignore */ }
        const ro = new ResizeObserver(() => {
            try { localStorage.setItem('vectorToolsSize', JSON.stringify({ w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight) })); } catch { /* ignore */ }
        });
        ro.observe(el);
        onCleanup(() => ro.disconnect());
    };

    return (
        <Show when={store.showVectorToolsPanel}>
            <div class="vt-panel" ref={(el) => setupPanel(el)}>
                <div class="vt-header">
                    <span class="vt-title">Vector Tools</span>
                    <button class="vt-close" title="Close" onClick={() => toggleVectorToolsPanel(false)}><X size={14} /></button>
                </div>
                <div class="vt-body">
                    <For each={groups}>
                        {(g) => (
                            <div class="vt-group">
                                <div class="vt-group-name">{g.name}</div>
                                <For each={g.tools}>
                                    {(t) => (
                                        <button class={`vt-row ${t.active?.() ? 'vt-on' : ''}`} title={t.label} onClick={() => t.run()}>
                                            <t.icon size={15} /><span>{t.label}</span>
                                        </button>
                                    )}
                                </For>
                            </div>
                        )}
                    </For>

                    {/* Effects — Distort & Transform flyout */}
                    <div class="vt-group">
                        <div class="vt-group-name">Effects</div>
                        <button class={`vt-row ${distortOpen() ? 'vt-on' : ''}`} onClick={() => setDistortOpen(v => !v)}>
                            <Waves size={15} /><span>Distort &amp; Transform</span>
                            <PlusCircle size={13} class="vt-row-caret" />
                        </button>
                        <Show when={distortOpen()}>
                            <div class="vt-flyout">
                                <For each={distorts}>
                                    {(d) => (
                                        <button class="vt-sub" onClick={() => applyDistort([...store.selection], d.kind, d.amt)}>{d.label}</button>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default VectorToolsPanel;
