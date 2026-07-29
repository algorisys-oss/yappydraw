import { type Component, For, Show, createSignal } from 'solid-js';
import {
    store,
    toggleShapeBuilder, toggleLivePaint, toggleCutTool, toggleWidthTool, toggleCurveTool,
    toggleReshapeTool, toggleBlobBrush, togglePathEraser, togglePuppetWarp, togglePerspectiveGrid,
    toggleSymbolSprayer, toggleSymbolism, toggleSliceTool, selectSimilar,
    setTextVertical, toggleTouchType, toggleTypeOnPath, applyDistort, exitAllToolModes, toggleNodeTool,} from '../store/app-store';
import { YappyAPI } from '../api';
import {
    Combine, PaintBucket, Spline, Waypoints, Scissors, PenLine, Brush, Eraser,
    Frame, Grid3x3, SprayCan, Sparkles, Crop, Wand2,
    Type, AlignVerticalJustifyCenter, TextCursor, Tornado, Grid2x2, Target, Sun, Waves, PlusCircle,
    Grip, CloudDrizzle, Move3d} from 'lucide-solid';
import './vector-tools-panel.css';

/**
 * Vector Tools — a dockable palette (registered in the dock; drag/float/collapse via the dock
 * chrome) surfacing every Illustrator-class tool as a labelled row (grouped Build / Path / Paint /
 * Warp / Symbol / Text / Insert / Effects). Mode-tool rows highlight while active; one-shot tools
 * fire immediately; the Distort row expands into a flyout of the six effects. Renders body-only;
 * open/where state persists in the dock layout.
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
    // All selected text/richtext elements (so panel text actions apply to the whole selection,
    // not just the first-selected one).
    const selTexts = () => store.elements.filter(el => store.selection.includes(el.id) && (el.type === 'text' || el.type === 'richtext'));
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
                { label: 'Nodes', icon: Waypoints, active: () => store.nodeToolActive, run: modeRun(() => store.nodeToolActive, () => toggleNodeTool(true)) },
                { label: 'Curvature', icon: Spline, active: () => store.curveToolActive, run: modeRun(() => store.curveToolActive, () => toggleCurveTool(true)) },
                { label: 'Reshape', icon: Move3d, active: () => store.reshapeToolActive, run: modeRun(() => store.reshapeToolActive, () => toggleReshapeTool(true)) },
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
                { label: 'Vertical Type', icon: AlignVerticalJustifyCenter, active: () => { const ts = selTexts(); return ts.length > 0 && ts.every(t => !!t.verticalText); }, run: () => { const ts = selTexts(); if (!ts.length) return; const makeVertical = ts.some(t => !t.verticalText); ts.forEach(t => setTextVertical(t.id, makeVertical)); } },
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
                { label: 'Noise Texture', icon: Grip, run: () => YappyAPI.addTextureOverlay('noise') },
                { label: 'Grunge Texture', icon: CloudDrizzle, run: () => YappyAPI.addTextureOverlay('grunge') },
            ],
        },
    ];

    const distorts: { label: string; kind: any; amt: number }[] = [
        { label: 'Pucker', kind: 'pucker', amt: 0.25 }, { label: 'Bloat', kind: 'bloat', amt: 0.25 },
        { label: 'Twirl', kind: 'twirl', amt: 0.25 }, { label: 'Zig-Zag', kind: 'zigzag', amt: 0.12 },
        { label: 'Crystallize', kind: 'crystallize', amt: 0.18 }, { label: 'Roughen', kind: 'roughen', amt: 0.1 },
    ];

    return (
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
    );
};

export default VectorToolsPanel;
