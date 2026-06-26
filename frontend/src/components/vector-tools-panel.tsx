import { type Component, For, Show } from 'solid-js';
import {
    store, toggleVectorToolsPanel,
    toggleShapeBuilder, toggleLivePaint, toggleCutTool, toggleWidthTool, toggleCurveTool,
    toggleReshapeTool, toggleBlobBrush, togglePathEraser, togglePuppetWarp, togglePerspectiveGrid,
    toggleSymbolSprayer, toggleSymbolism, toggleSliceTool, selectSimilar,
} from '../store/app-store';
import {
    Combine, PaintBucket, Spline, Waypoints, Scissors, PenLine, Brush, Eraser,
    Frame, Grid3x3, SprayCan, Sparkles, Crop, Wand2, X,
} from 'lucide-solid';
import { draggablePanel } from '../utils/draggable-panel';
import './vector-tools-panel.css';

/**
 * Vector Tools — a dedicated floating, draggable palette that surfaces all the Illustrator-
 * class tools as one-tap buttons (they otherwise live only in the Command Palette). Each
 * mode-tool button highlights while its overlay is active; one-shot tools fire immediately.
 * Visibility persists across reloads.
 */
type Tool = { id: string; label: string; icon: any; active?: () => boolean; run: () => void };

const VectorToolsPanel: Component = () => {
    const groups: { name: string; tools: Tool[] }[] = [
        {
            name: 'Build', tools: [
                { id: 'shape-builder', label: 'Shape Builder', icon: Combine, active: () => store.shapeBuilderActive, run: () => toggleShapeBuilder() },
                { id: 'live-paint', label: 'Live Paint', icon: PaintBucket, active: () => store.livePaintActive, run: () => toggleLivePaint() },
                { id: 'magic-wand', label: 'Magic Wand (select similar)', icon: Wand2, run: () => selectSimilar() },
            ],
        },
        {
            name: 'Path', tools: [
                { id: 'curvature', label: 'Curvature', icon: Spline, active: () => store.curveToolActive, run: () => toggleCurveTool() },
                { id: 'reshape', label: 'Reshape', icon: Waypoints, active: () => store.reshapeToolActive, run: () => toggleReshapeTool() },
                { id: 'cut', label: 'Knife / Scissors', icon: Scissors, active: () => store.cutToolActive, run: () => toggleCutTool() },
                { id: 'width', label: 'Width', icon: PenLine, active: () => store.widthToolActive, run: () => toggleWidthTool() },
            ],
        },
        {
            name: 'Paint', tools: [
                { id: 'blob', label: 'Blob Brush', icon: Brush, active: () => store.blobBrushActive, run: () => toggleBlobBrush() },
                { id: 'path-eraser', label: 'Path Eraser', icon: Eraser, active: () => store.pathEraserActive, run: () => togglePathEraser() },
            ],
        },
        {
            name: 'Warp', tools: [
                { id: 'puppet', label: 'Puppet Warp', icon: Frame, active: () => store.puppetWarpActive, run: () => togglePuppetWarp() },
                { id: 'perspective', label: 'Perspective Grid', icon: Grid3x3, active: () => store.perspectiveGridActive, run: () => togglePerspectiveGrid() },
            ],
        },
        {
            name: 'Symbol', tools: [
                { id: 'sprayer', label: 'Symbol Sprayer', icon: SprayCan, active: () => store.sprayerActive, run: () => toggleSymbolSprayer() },
                { id: 'symbolism', label: 'Symbolism Brush', icon: Sparkles, active: () => store.symbolismActive, run: () => toggleSymbolism() },
                { id: 'slice', label: 'Slice (export region)', icon: Crop, active: () => store.sliceToolActive, run: () => toggleSliceTool() },
            ],
        },
    ];

    return (
        <Show when={store.showVectorToolsPanel}>
            <div class="vt-panel" ref={draggablePanel('.vt-header')}>
                <div class="vt-header">
                    <span class="vt-title">Vector Tools</span>
                    <button class="vt-close" title="Close" onClick={() => toggleVectorToolsPanel(false)}><X size={14} /></button>
                </div>
                <div class="vt-body">
                    <For each={groups}>
                        {(g) => (
                            <div class="vt-group">
                                <div class="vt-group-name">{g.name}</div>
                                <div class="vt-grid">
                                    <For each={g.tools}>
                                        {(t) => (
                                            <button
                                                class={`vt-btn ${t.active?.() ? 'vt-on' : ''}`}
                                                title={t.label}
                                                onClick={() => t.run()}
                                            >
                                                <t.icon size={17} />
                                            </button>
                                        )}
                                    </For>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </Show>
    );
};

export default VectorToolsPanel;
