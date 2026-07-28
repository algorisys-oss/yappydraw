import { type Component, Show, createMemo, For, createSignal, createEffect, Index } from "solid-js";
import { draggablePanel } from '../utils/draggable-panel';
import { store, updateElement, renameElement, deleteElements, duplicateElement, moveElementZIndex, updateDefaultStyles, updateGlobalSettings, moveElementsToLayer, setCanvasBackgroundColor, updateGridSettings, setGridStyle, alignSelectedElements, distributeSelectedElements, distributeSpacing, toggleAlignToKey, togglePropertyPanel, minimizePropertyPanel, setMaxLayers, setEraserWidth, setCanvasTexture, pushToHistory, addChildNode, addSiblingNode, reorderMindmap, applyMindmapStyling, toggleCollapse, setDocType, updateSlideTransition, updateSlideBackground, setTheme, enterCropMode, resetCrop, setCropAspect, toggleVideoPlayback, isVideoPlaying, setElementTransform, setStrokeDash, setAppearance, addAppearanceFill, addAppearanceStroke, applyMeshGradient, setMeshSize, setMeshNodeColor, clearMeshGradient, toggleMeshEdit, resetMeshNodes, setMeshSmooth, applyPatternFill, setPatternFill, clearPatternFill, savePatternSwatchFromElement } from "../store/app-store";
import { resolveDash, parseDashInput, dashToString } from "../utils/stroke-dash";
import { pageNoun, setPageSize, propertyPanelTarget } from "../store/app-store";
import { setTransformEffect, clearTransformEffect, expandTransformEffect, applyWarpPreset, bakeWarp, toggleEnvelopeWarp, setExtrude, clearExtrude, expandExtrude, setTurntable, clearTurntable, bakeTurntable, canTurntable, spinTurntable360 } from "../store/app-store";
import { WARP_PRESETS } from "../utils/envelope-warp";
import { replaceImageOn } from "../utils/image-actions";
import { slideTransitionManager } from "../utils/animation";
import { customFontOptions, addCustomFontFromFile } from "../utils/custom-fonts";
import GoogleFontsDialog from "./google-fonts-dialog";
import FontPicker from "./font-picker";
import type { Slide } from "../types/slide-types";
import { isPagedDocType } from "../types/slide-types";
import { findPagePreset, getPagePreset } from "../config/page-size-presets";
import { getTextEffectPreset } from "../config/text-effect-presets";
import type { DrawingElement } from "../types";
import {
    Copy, ChevronsDown, ChevronDown, ChevronUp, ChevronsUp, Trash2, Palette,
    AlignLeft, AlignCenterHorizontal, AlignRight,
    AlignStartVertical, AlignCenterVertical, AlignEndVertical,
    AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
    AlignHorizontalSpaceAround, AlignVerticalSpaceAround, Crosshair,
    Plus, ArrowDown, LayoutGrid, LayoutList, Target, Network,
    X, Play, Square, Menu
} from "lucide-solid";
import "./property-panel.css";
import { properties, fontCapabilities, type PropertyConfig } from "../config/properties";
import { COLOR_PALETTES, getColorPalette } from "../config/color-palettes";
import { getGradientPreset } from "../config/gradient-presets";
import { getImageFilterPreset } from "../config/image-filter-presets";
import { getOpenBoxPreset } from "../config/openbox-presets";
import { detectVideoProvider, getEmbedURL, getPosterURL, fetchPoster } from "../utils/video-utils";
import { getImage } from "../utils/image-cache";
import { PATTERN_PRESETS, defaultPatternFill } from "../utils/pattern-fill";
import { showToast } from "./toast";
import MathNumberInput from "./math-number-input";
import { ColorPickerPro } from "./color-picker-pro";
import { CANVAS_THEMES, matchCanvasTheme } from "../config/canvas-themes";
import { playSequence } from "../utils/animation/orchestrator";
import { AnimationPanel } from "./animation-panel";
import StickFaceControls from "./stick-face-controls";
import { selectionHasStickFigure, selectionHasAnimatedFigure } from "../library/stick-figures";
import { resizeTableData, defaultColWidths, defaultRowHeights, defaultTableData } from "../utils/table-utils";
import { readJsonArray } from "../utils/safe-storage";
import {
    pixelRevealLTR, pixelDissolve, pixelWaveCenter, pixelScanLines,
    pixelGlitch, pixelBlockReveal, pixelSpiral, pixelCurtainV, pixelRandomScatter, pixelRain
} from "../utils/animation";

// ─── Mixed Value Sentinel (multi-select) ───────────────────────
const MIXED_VALUE = Symbol('mixed');
const isMixed = (val: any): val is typeof MIXED_VALUE => val === MIXED_VALUE;

// ─── UML Add Menu ──────────────────────────────────────────────

const UML_ATTR_TEMPLATES = [
    { label: '+ public', line: '+ name: string' },
    { label: '- private', line: '- name: string' },
    { label: '# protected', line: '# name: string' },
];

const UML_METHOD_TEMPLATES = [
    { label: '+ public', line: '+ method(): void' },
    { label: '- private', line: '- method(): void' },
    { label: '# protected', line: '# method(): void' },
];

const UmlAddMenu: Component<{
    section: 'attributesText' | 'methodsText';
    onAdd: (line: string) => void;
}> = (props) => {
    const [open, setOpen] = createSignal(false);
    let ref: HTMLDivElement | undefined;

    const templates = () => props.section === 'attributesText' ? UML_ATTR_TEMPLATES : UML_METHOD_TEMPLATES;

    const handleClickOutside = (e: MouseEvent) => {
        if (ref && !ref.contains(e.target as Node)) setOpen(false);
    };

    createEffect(() => {
        if (open()) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    });

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                class="uml-add-btn"
                title={`Add ${props.section === 'attributesText' ? 'attribute' : 'method'}`}
                onClick={() => setOpen(!open())}
            >
                <Plus size={14} />
            </button>
            <Show when={open()}>
                <div class="uml-add-dropdown">
                    <For each={templates()}>
                        {(t) => (
                            <button
                                class="uml-add-option"
                                onClick={() => { props.onAdd(t.line); setOpen(false); }}
                            >
                                {t.label}
                            </button>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

// ─── Mindmap Actions ────────────────────────────────────────────

const MindmapActions: Component<{ elementId: string }> = (props) => {
    const el = createMemo(() => store.elements.find(e => e.id === props.elementId));

    const hasChildren = createMemo(() => {
        return store.elements.some(e => e.parentId === props.elementId);
    });

    const isMindmapNode = createMemo(() => {
        const e = el();
        if (!e) return false;
        const startTypes: string[] = ['text', 'cloud', 'circle', 'rectangle', 'stickyNote', 'diamond'];
        return !!e.parentId || hasChildren() || startTypes.includes(e.type);
    });

    const handlePresent = async () => {
        const rootId = props.elementId;
        const rootEl = el();
        if (!rootEl) return;

        const children = store.elements.filter(e => e.parentId === rootId);
        const childIds = children.map(c => c.id);

        // Robust connector discovery for mindmaps
        const connectors = store.elements.filter(e => {
            const isConnector = e.type === 'line' || e.type === 'arrow' || e.type === 'organicBranch';
            if (!isConnector) return false;

            // Connectors between root and its children
            const connectsToRoot = e.startBinding?.elementId === rootId || e.endBinding?.elementId === rootId;
            const connectsToChild = (e.startBinding?.elementId && childIds.includes(e.startBinding.elementId)) ||
                (e.endBinding?.elementId && childIds.includes(e.endBinding.elementId));

            return connectsToRoot && connectsToChild;
        });

        const allToReveal = [...children, ...connectors];

        // Hide all first and enable flow
        allToReveal.forEach(c => {
            updateElement(c!.id, { opacity: 0 });
        });

        const steps: any[] = [];
        children.forEach((child, i) => {
            // Find connector to this specific child
            const conn = connectors.find(c =>
                c.startBinding?.elementId === child.id ||
                c.endBinding?.elementId === child.id
            );

            if (conn) {
                steps.push({
                    elementId: conn.id,
                    target: { opacity: 100, flowAnimation: true },
                    config: { duration: 400, easing: 'easeOutQuad' },
                    delay: i === 0 ? 0 : 150
                });
            }

            steps.push({
                elementId: child.id,
                target: { opacity: 100 },
                config: { duration: 500, easing: 'easeOutBack' },
                delay: conn ? 0 : 0 // Sequential for now
            });
        });

        playSequence(steps);
    };

    return (
        <Show when={isMindmapNode()}>
            <div class="property-group">
                <div class="group-title">MINDMAP ACTIONS</div>
                <div class="alignment-row">
                    <button class="icon-btn" onClick={() => addChildNode(props.elementId)} title="Add Child (Tab)"><Plus size={18} /></button>
                    <Show when={el()?.parentId}>
                        <button class="icon-btn" onClick={() => addSiblingNode(props.elementId)} title="Add Sibling (Enter)"><ArrowDown size={18} /></button>
                    </Show>
                    <button class="icon-btn" onClick={() => applyMindmapStyling(props.elementId)} title="Auto Style Branch"><Palette size={18} /></button>
                    <button class="icon-btn" onClick={handlePresent} title="Present Branch"><Play size={18} /></button>
                    <Show when={hasChildren()}>
                        <button class="icon-btn" onClick={() => toggleCollapse(props.elementId)} title={el()?.isCollapsed ? 'Expand' : 'Collapse'}>
                            {el()?.isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                    </Show>
                </div>
                <div class="group-title" style={{ "margin-top": "12px", "margin-bottom": "8px" }}>AUTO LAYOUT</div>
                <div class="alignment-row">
                    <button class="icon-btn" onClick={() => reorderMindmap(props.elementId, 'balanced')} title="Balanced (auto, default)"><Network size={18} /></button>
                    <button class="icon-btn" onClick={() => reorderMindmap(props.elementId, 'horizontal-right')} title="Horizontal Right"><LayoutList size={18} /></button>
                    <button class="icon-btn" onClick={() => reorderMindmap(props.elementId, 'vertical-down')} title="Vertical Down"><LayoutGrid size={18} /></button>
                    <button class="icon-btn" onClick={() => reorderMindmap(props.elementId, 'radial')} title="Radial"><Target size={18} /></button>
                </div>
            </div>
        </Show>
    );
};

/**
 * Face & hair for a selected stick figure — dropped library figures and animated
 * rigs alike. The picker itself is shared with the Stick Figures panel; this just
 * gates it on the selection actually containing a figure.
 */
const StickFaceActions: Component = () => {
    const isFigure = createMemo(() =>
        selectionHasStickFigure(store.selection) || selectionHasAnimatedFigure(store.selection));
    return (
        <Show when={isFigure()}>
            <StickFaceControls />
        </Show>
    );
};

const ImagePixelEffectActions: Component<{ elementId: string }> = (props) => {
    const el = createMemo(() => store.elements.find(e => e.id === props.elementId));
    const isImage = createMemo(() => el()?.type === 'image');

    // Quick preview effects with direct function calls
    const quickEffects = [
        { fn: () => { console.log('Calling pixelRevealLTR'); pixelRevealLTR(props.elementId, 1500); }, icon: '▶️', title: 'Left→Right' },
        { fn: () => { console.log('Calling pixelDissolve'); pixelDissolve(props.elementId, 2000); }, icon: '✨', title: 'Dissolve' },
        { fn: () => { console.log('Calling pixelWaveCenter'); pixelWaveCenter(props.elementId, 1800); }, icon: '🌊', title: 'Wave' },
        { fn: () => { console.log('Calling pixelScanLines'); pixelScanLines(props.elementId, 2500); }, icon: '📺', title: 'Scan Lines' },
        { fn: () => { console.log('Calling pixelGlitch'); pixelGlitch(props.elementId, 1200); }, icon: '⚡', title: 'Glitch' },
        { fn: () => { console.log('Calling pixelBlockReveal'); pixelBlockReveal(props.elementId, 2000); }, icon: '▦', title: 'Block' },
        { fn: () => { console.log('Calling pixelSpiral'); pixelSpiral(props.elementId, 2200); }, icon: '🌀', title: 'Spiral' },
        { fn: () => { console.log('Calling pixelCurtainV'); pixelCurtainV(props.elementId, 1500); }, icon: '🎭', title: 'Curtain' },
        { fn: () => { console.log('Calling pixelRandomScatter'); pixelRandomScatter(props.elementId, 1800); }, icon: '🎲', title: 'Random' },
        { fn: () => { console.log('Calling pixelRain'); pixelRain(props.elementId, 2500); }, icon: '🌧️', title: 'Pixel Rain' }
    ];

    return (
        <Show when={isImage()}>
            <div class="property-group">
                <div class="group-title">IMAGE</div>
                <button
                    class="icon-btn"
                    style={{ width: '100%', "font-size": "12px", padding: '6px' }}
                    onClick={() => { void replaceImageOn(props.elementId); }}
                    title="Pick a file to fill / replace this image (keeps its size & position)"
                >{el()?.dataURL ? '↻ Replace Image…' : '＋ Add Image…'}</button>
            </div>
            <div class="property-group">
                <div class="group-title">PIXEL EFFECTS - QUICK PREVIEW</div>
                <div class="alignment-row" style={{ "display": "grid", "grid-template-columns": "repeat(3, 1fr)", "gap": "6px" }}>
                    <For each={quickEffects}>
                        {(effect) => (
                            <button
                                class="icon-btn"
                                onClick={effect.fn}
                                title={`Preview: ${effect.title}`}
                            >
                                {effect.icon}
                            </button>
                        )}
                    </For>
                </div>
                <div class="group-title" style={{ "margin-top": "8px", "font-size": "10px", "opacity": "0.7" }}>
                    Quick previews • Use Animation panel below for triggers & persistence
                </div>
            </div>
        </Show>
    );
};

const VideoActions: Component<{ elementId: string }> = (props) => {
    const el = createMemo(() => store.elements.find(e => e.id === props.elementId));
    const isVideo = createMemo(() => el()?.type === 'video');

    return (
        <Show when={isVideo()}>
            <div class="property-group">
                <div class="group-title">VIDEO</div>
                <div class="alignment-row" style={{ gap: "6px" }}>
                    <button
                        class="icon-btn"
                        style={{ flex: 1, "font-size": "12px" }}
                        onClick={() => toggleVideoPlayback(props.elementId)}
                        title={isVideoPlaying(props.elementId) ? "Stop video" : "Play video"}
                    >
                        {isVideoPlaying(props.elementId) ? <><Square size={14} /> Stop</> : <><Play size={14} /> Play</>}
                    </button>
                </div>
                <Show when={el()?.videoURL}>
                    <div style={{ "font-size": "11px", color: "var(--text-secondary)", "margin-top": "6px", "word-break": "break-all" }}>
                        {el()!.videoURL!.length > 60 ? el()!.videoURL!.slice(0, 57) + '...' : el()!.videoURL}
                    </div>
                </Show>
            </div>
        </Show>
    );
};

const SlideActions: Component = () => {
    const handlePreviewTransition = async () => {
        await slideTransitionManager.previewTransition(store.activeSlideIndex);
    };

    return (
        <div class="property-group">
            <div class="group-title">ACTIONS</div>
            <div class="alignment-row">
                <button class="icon-btn" onClick={handlePreviewTransition} title="Preview Transition">
                    <Play size={18} />
                </button>
            </div>
        </div>
    );
};

const AlignmentControls: Component = () => {
    const [gap, setGap] = createSignal<string>('');
    const gapVal = () => { const n = parseFloat(gap()); return Number.isFinite(n) ? n : undefined; };
    return (
        <div class="property-group">
            <div class="group-title">ALIGNMENT</div>
            <div class="alignment-row">
                <button class="icon-btn" onClick={() => alignSelectedElements('left')} title="Align Left"><AlignLeft size={18} /></button>
                <button class="icon-btn" onClick={() => alignSelectedElements('center')} title="Align Horizontal Center"><AlignCenterHorizontal size={18} /></button>
                <button class="icon-btn" onClick={() => alignSelectedElements('right')} title="Align Right"><AlignRight size={18} /></button>
                <button class="icon-btn" onClick={() => distributeSelectedElements('horizontal')} title="Distribute Horizontal Centers"><AlignHorizontalDistributeCenter size={18} /></button>
            </div>
            <div class="alignment-row">
                <button class="icon-btn" onClick={() => alignSelectedElements('top')} title="Align Top"><AlignStartVertical size={18} /></button>
                <button class="icon-btn" onClick={() => alignSelectedElements('middle')} title="Align Vertical Center"><AlignCenterVertical size={18} /></button>
                <button class="icon-btn" onClick={() => alignSelectedElements('bottom')} title="Align Bottom"><AlignEndVertical size={18} /></button>
                <button class="icon-btn" onClick={() => distributeSelectedElements('vertical')} title="Distribute Vertical Centers"><AlignVerticalDistributeCenter size={18} /></button>
            </div>
            <div class="alignment-row" style={{ gap: '6px', 'align-items': 'center', 'margin-top': '4px' }}>
                <button
                    class={`icon-btn ${store.alignToKeyObject ? 'active' : ''}`}
                    style={store.alignToKeyObject ? { background: 'var(--primary-color, #3b82f6)', color: '#fff' } : {}}
                    onClick={() => toggleAlignToKey()}
                    title="Align to key object (the last-selected object stays put; others align to it)"
                ><Crosshair size={16} /></button>
                <span style={{ 'font-size': '11px', color: 'var(--text-secondary)' }}>Spacing</span>
                <button class="icon-btn" onClick={() => distributeSpacing('horizontal', gapVal())} title="Distribute spacing — equal horizontal gaps (or the gap below)"><AlignHorizontalSpaceAround size={18} /></button>
                <button class="icon-btn" onClick={() => distributeSpacing('vertical', gapVal())} title="Distribute spacing — equal vertical gaps (or the gap below)"><AlignVerticalSpaceAround size={18} /></button>
                <input
                    type="number" placeholder="gap" value={gap()} min="0"
                    style={{ width: '52px', 'font-size': '11px' }}
                    title="Fixed gap in px (blank = equalize gaps)"
                    onInput={(e) => setGap(e.currentTarget.value)}
                />
            </div>
        </div>
    );
};

/** Numeric Transform panel — X/Y position, W/H size, and rotation for a single selected
 *  element (Illustrator's Transform panel). Position/size go through `setElementTransform`
 *  (which rescales points/anchors/font-size); angle is stored in radians. Each committed edit
 *  is one undo entry. Inputs commit on Enter/blur (onChange) so typing isn't fought by the
 *  live value, which still updates the field when the element is moved on-canvas. */
const TransformControls: Component<{ elementId: string }> = (props) => {
    const el = () => store.elements.find(e => e.id === props.elementId);
    const r2 = (n: number) => Math.round(n * 100) / 100;
    const apply = (patch: { x?: number; y?: number; width?: number; height?: number; angle?: number }) => {
        pushToHistory();
        setElementTransform(props.elementId, patch);
    };
    const applyAngle = (deg: number) => {
        if (!Number.isFinite(deg)) return;
        apply({ angle: (((deg % 360) + 360) % 360) * Math.PI / 180 });
    };
    const num = (get: () => number, set: (v: number) => void, title: string, step = 1) => (
        <input
            type="number"
            step={step}
            value={get()}
            title={title}
            style={{ width: '100%', 'font-size': '11px', 'min-width': '0' }}
            onChange={(e) => { const v = Number(e.currentTarget.value); if (Number.isFinite(v) && e.currentTarget.value.trim() !== '') set(v); }}
        />
    );
    const lbl = { 'min-width': '12px', 'font-size': '11px', color: 'var(--text-secondary)' } as any;
    return (
        <Show when={el()}>
            <div class="property-group">
                <div class="group-title">TRANSFORM</div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                    <label style={lbl}>X</label>
                    {num(() => r2(el()!.x), v => apply({ x: v }), 'X position')}
                    <label style={lbl}>Y</label>
                    {num(() => r2(el()!.y), v => apply({ y: v }), 'Y position')}
                </div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                    <label style={lbl}>W</label>
                    {num(() => r2(Math.abs(el()!.width)), v => apply({ width: Math.max(1, v) }), 'Width')}
                    <label style={lbl}>H</label>
                    {num(() => r2(Math.abs(el()!.height)), v => apply({ height: Math.max(1, v) }), 'Height')}
                </div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                    <label style={lbl} title="Rotation">∠</label>
                    {num(() => Math.round((el()!.angle || 0) * 180 / Math.PI), applyAngle, 'Rotation (degrees)')}
                    <span style={{ 'font-size': '11px', color: 'var(--text-secondary)' }}>°</span>
                    <div style={{ flex: '1' }} />
                </div>
            </div>
        </Show>
    );
};

/** Custom stroke dash-pattern editor for a single element. Complements the Stroke Style preset
 *  dropdown: type any on/off pixel sequence, pick a quick preset, or Clear back to the preset.
 *  The live preview shows exactly what renders (`resolveDash`). Shown only when the element has a
 *  visible stroke. Setting a custom array overrides the 'solid'/'dashed'/'dotted' preset. */
const DASH_PRESETS: { label: string; pattern: number[] }[] = [
    { label: 'Dash', pattern: [10, 6] },
    { label: 'Dot', pattern: [2, 5] },
    { label: 'Dash-dot', pattern: [12, 5, 2, 5] },
    { label: 'Long', pattern: [20, 8] },
];
const StrokeDashControls: Component<{ elementId: string }> = (props) => {
    const el = () => store.elements.find(e => e.id === props.elementId);
    const hasStroke = () => { const e = el(); return !!e && e.strokeColor !== 'transparent' && (e.strokeWidth ?? 0) > 0; };
    const preview = () => { const e = el(); return e ? (resolveDash(e.strokeStyle, e.strokeDashArray, [8, 8], [2, 4]) || []) : []; };
    const set = (pattern?: number[]) => setStrokeDash([props.elementId], pattern);
    const chip = { 'font-size': '10px', padding: '2px 7px', 'border-radius': '4px', cursor: 'pointer' } as any;
    return (
        <Show when={hasStroke()}>
            <div class="property-group">
                <div class="group-title">STROKE DASH</div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                    <input
                        type="text"
                        placeholder="e.g. 12, 4, 3, 4"
                        value={dashToString(el()?.strokeDashArray)}
                        title="Custom dash pattern — comma/space separated on/off pixel lengths. Blank = use the Stroke Style preset."
                        style={{ flex: '1', 'font-size': '11px', 'min-width': '0' }}
                        onChange={(e) => set(parseDashInput(e.currentTarget.value))}
                    />
                    <svg width="58" height="16" style={{ 'flex-shrink': 0, background: 'var(--bg-secondary)', 'border-radius': '3px' }}>
                        <line x1="3" y1="8" x2="55" y2="8" stroke="var(--text-primary, #333)" stroke-width="2"
                            stroke-dasharray={preview().join(' ') || undefined} />
                    </svg>
                </div>
                <div class="control-row" style={{ gap: '4px', 'flex-wrap': 'wrap', 'margin-top': '4px' }}>
                    <For each={DASH_PRESETS}>
                        {(p) => (<button class="icon-btn" style={chip} title={`Dash pattern: ${p.pattern.join(', ')}`} onClick={() => set(p.pattern)}>{p.label}</button>)}
                    </For>
                    <button class="icon-btn" style={chip} title="Clear custom dashes (use the Stroke Style preset)" onClick={() => set(undefined)}>Clear</button>
                </div>
            </div>
        </Show>
    );
};

const ColorControl: Component<{ prop: PropertyConfig, value: any, onChange: (val: any) => void }> = (props) => {
    const hasOptions = () => props.prop.options && props.prop.options.length > 0;
    const [showPicker, setShowPicker] = createSignal(false);
    // Per-control palette override; null means "follow canvas default".
    const [localPaletteId, setLocalPaletteId] = createSignal<string | null>(null);

    const activePaletteId = () => localPaletteId() ?? store.globalSettings.colorPalette ?? 'default';
    const activePalette = () => getColorPalette(activePaletteId());
    // Swatches from the active palette, mapped into the same shape as prop.options.
    const paletteSwatches = () => activePalette().swatches.map(s => ({ label: s.label, value: s.value }));
    // For color props without their own preset options, the palette drives the swatch row.
    const swatches = () => hasOptions() ? (props.prop.options ?? []) : paletteSwatches();

    createEffect(() => {
        const list = swatches();
        if (props.value && list.length > 0) {
            const isPreset = list.some(o => o.value === props.value);
            if (!isPreset && !showPicker()) setShowPicker(true);
        }
    });

    return (
        <div class="control-col">
            <label>{props.prop.label}</label>
            <div class="color-picker-container">
                <Show when={!hasOptions()}>
                    <div class="palette-selector-row">
                        <select
                            class="palette-selector"
                            value={activePaletteId()}
                            title="Palette"
                            onChange={(e) => setLocalPaletteId(e.currentTarget.value)}
                        >
                            <For each={COLOR_PALETTES}>
                                {(p) => <option value={p.id}>{p.name}</option>}
                            </For>
                        </select>
                        <Show when={localPaletteId() !== null}>
                            <button
                                class="palette-reset-btn"
                                title="Use canvas default palette"
                                onClick={() => setLocalPaletteId(null)}
                            >↺</button>
                        </Show>
                    </div>
                </Show>

                <div class="swatch-row">
                    <For each={swatches()}>
                        {(opt) => (
                            <button
                                class="swatch-circle"
                                classList={{ selected: props.value === opt.value }}
                                style={{
                                    background: opt.value === 'transparent' ? 'white' : opt.value,
                                    border: opt.value === '#ffffff' || opt.value === '#FFFFFF' ? '1px solid #e0e0e0' : 'none'
                                }}
                                title={opt.label}
                                onClick={() => {
                                    pushToHistory();
                                    props.onChange(opt.value);
                                    setShowPicker(false);
                                }}
                            >
                                {opt.value === 'transparent' && <div class="diagonal-line-sm"></div>}
                            </button>
                        )}
                    </For>
                    <button
                        class="swatch-circle rainbow"
                        classList={{ active: showPicker() }}
                        title="Custom Color"
                        onClick={() => setShowPicker(!showPicker())}
                    >
                        <Palette size={14} class="rainbow-icon" />
                    </button>
                </div>

                <Show when={showPicker()}>
                    <div style={{ "margin-top": "12px", display: "flex", "flex-direction": "column", gap: "10px" }}>
                        <ColorPickerPro
                            value={typeof props.value === 'string' && props.value.startsWith('#') ? props.value : '#000000'}
                            onStart={() => pushToHistory()}
                            onChange={(hex) => props.onChange(hex)}
                        />
                        <div class="hex-input-row">
                            <span class="hash">#</span>
                            <input
                                type="text"
                                class="hex-input"
                                value={String(props.value ?? '').replace('#', '')}
                                onInput={(e) => props.onChange('#' + e.currentTarget.value)}
                            />
                            <div class="system-picker-wrapper">
                                <input
                                    type="color"
                                    value={typeof props.value === 'string' && props.value.startsWith('#') ? props.value : '#000000'}
                                    onFocus={() => pushToHistory()}
                                    onInput={(e) => props.onChange(e.currentTarget.value)}
                                />
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
};

/** Appearance-stack editor: list/add/remove/reorder extra fills & strokes on one element. */
const AppearanceEditor: Component<{ el: () => any }> = (props) => {
    const ap = () => props.el()?.appearance || {};
    const fills = () => ap().fills || [];
    const strokes = () => ap().strokes || [];
    const commit = (fillsArr: any[], strokesArr: any[]) => {
        const ids = [props.el()?.id].filter(Boolean);
        if (!ids.length) return;
        const next = (fillsArr.length || strokesArr.length) ? { fills: fillsArr, strokes: strokesArr } : undefined;
        setAppearance(ids, next);
    };
    const editFill = (i: number, patch: any) => { const f = fills().map((x: any) => ({ ...x })); f[i] = { ...f[i], ...patch }; commit(f, strokes()); };
    const editStroke = (i: number, patch: any) => { const s = strokes().map((x: any) => ({ ...x })); s[i] = { ...s[i], ...patch }; commit(fills(), s); };
    const move = (arr: any[], i: number, d: number) => { const a = arr.map(x => ({ ...x })); const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; };
    const sw = { width: '22px', height: '22px', padding: '0', border: '1px solid var(--border-color)', 'border-radius': '4px', cursor: 'pointer' } as any;
    const numS = { width: '46px' } as any;
    const btn = { padding: '1px 6px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    return (
        <div class="property-group">
            <div class="group-title"><span>APPEARANCE</span></div>
            {/* `<Index>` (not `<For>`): editFill/editStroke rebuild every fill/stroke object each
                tick, so a reference-keyed `<For>` would dispose & recreate each row's DOM on every
                onInput — which destroys the open native `<input type="color">` popup mid-drag (the
                "can't drag the colour picker" bug, same root cause as recolor fix #114). Index keys
                by position and reuses the DOM nodes, so the native picker survives a live drag. */}
            <Index each={fills()}>{(f: any, i) => {
                // Per-fill pattern picker: "Solid" + built-in motifs + library swatches.
                const PAT_NONE = '__solid__';
                const patValue = () => !f().pattern ? PAT_NONE : (f().pattern.type === 'custom' ? '__custom__' : `motif:${f().pattern.type}`);
                const onPatChange = (v: string) => {
                    if (v === PAT_NONE) { editFill(i, { pattern: undefined }); return; }
                    if (v === '__custom__') return; // display-only marker for an applied custom tile
                    if (v.startsWith('motif:')) { editFill(i, { pattern: defaultPatternFill(f().color || '#000000', v.slice(6) as any) }); return; }
                    const swObj = store.patterns.find(p => p.id === v);
                    if (swObj) editFill(i, { pattern: { ...swObj.fill } });
                };
                return (
                    <div class="control-row" style={{ gap: '3px', 'align-items': 'center', 'flex-wrap': 'wrap' }}>
                        <input type="color" style={sw} value={f().color} onInput={e => editFill(i, { color: e.currentTarget.value })} title="Fill colour (also the pattern's foreground)" />
                        <select style={{ 'font-size': '11px', 'max-width': '92px' }} value={patValue()} onChange={e => onPatChange(e.currentTarget.value)} title="Fill type / pattern">
                            <option value={PAT_NONE}>Solid</option>
                            <Show when={f().pattern?.type === 'custom'}><option value="__custom__">Custom tile</option></Show>
                            <For each={PATTERN_PRESETS}>{(p) => <option value={`motif:${p.type}`}>{p.label}</option>}</For>
                            <Show when={store.patterns.length > 0}>
                                <For each={store.patterns}>{(p) => <option value={p.id}>★ {p.name}</option>}</For>
                            </Show>
                        </select>
                        <input type="number" min="0" max="1" step="0.1" style={numS} value={f().opacity ?? 1} onInput={e => editFill(i, { opacity: Number(e.currentTarget.value) })} title="Opacity" />
                        <button style={btn} title="Show/Hide" onClick={() => editFill(i, { visible: f().visible === false })}>{f().visible === false ? '🚫' : '👁'}</button>
                        <button style={btn} title="Up" onClick={() => commit(move(fills(), i, -1), strokes())}>↑</button>
                        <button style={btn} title="Down" onClick={() => commit(move(fills(), i, 1), strokes())}>↓</button>
                        <button style={btn} title="Remove" onClick={() => commit(fills().filter((_: any, k: number) => k !== i), strokes())}>×</button>
                    </div>
                );
            }}</Index>
            <Index each={strokes()}>{(s: any, i) => (
                <div class="control-row" style={{ gap: '3px', 'align-items': 'center', 'flex-wrap': 'wrap' }}>
                    <input type="color" style={sw} value={s().color} onInput={e => editStroke(i, { color: e.currentTarget.value })} title="Stroke colour" />
                    <input type="number" min="0" step="1" style={numS} value={s().width} onInput={e => editStroke(i, { width: Number(e.currentTarget.value) })} title="Width" />
                    <select style={{ 'font-size': '11px' }} value={s().dash || 'solid'} onChange={e => editStroke(i, { dash: e.currentTarget.value })} title="Dash preset">
                        <option value="solid">—</option><option value="dashed">- -</option><option value="dotted">···</option>
                    </select>
                    <input type="text" placeholder="dash" style={{ width: '56px', 'font-size': '11px' }} value={dashToString(s().dashArray)} onChange={e => editStroke(i, { dashArray: parseDashInput(e.currentTarget.value) })} title="Custom dash pattern (e.g. 10, 4) — overrides the preset. Blank = use preset." />
                    <button style={btn} title="Show/Hide" onClick={() => editStroke(i, { visible: s().visible === false })}>{s().visible === false ? '🚫' : '👁'}</button>
                    <button style={btn} title="Up" onClick={() => commit(fills(), move(strokes(), i, -1))}>↑</button>
                    <button style={btn} title="Down" onClick={() => commit(fills(), move(strokes(), i, 1))}>↓</button>
                    <button style={btn} title="Remove" onClick={() => commit(fills(), strokes().filter((_: any, k: number) => k !== i))}>×</button>
                </div>
            )}</Index>
            <div class="control-row" style={{ gap: '6px', 'margin-top': '4px' }}>
                <button style={btn} onClick={() => addAppearanceFill([props.el()?.id].filter(Boolean), { color: props.el()?.backgroundColor && props.el().backgroundColor !== 'transparent' ? props.el().backgroundColor : '#3b82f6', opacity: 0.5 })}>+ Fill</button>
                <button style={btn} onClick={() => addAppearanceStroke([props.el()?.id].filter(Boolean), { color: props.el()?.strokeColor && props.el().strokeColor !== 'transparent' ? props.el().strokeColor : '#ef4444', width: 4 })}>+ Stroke</button>
            </div>
            {(() => {
                // Stroke gradient (Illustrator "gradient on stroke"). Architectural/SVG
                // render the true gradient; sketch strokes stay solid.
                const sg = () => props.el()?.strokeGradient as { type?: string; angle?: number; stops?: any[] } | undefined;
                const stops = () => sg()?.stops || [];
                const setSG = (next: any) => { const id = props.el()?.id; if (!id) return; pushToHistory(); updateElement(id, { strokeGradient: next }); };
                const editStop = (i: number, color: string) => { const s = stops().map((x: any) => ({ ...x })); s[i] = { ...s[i], color }; setSG({ ...sg(), stops: s }); };
                return (
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'flex-wrap': 'wrap', 'margin-top': '4px' }}>
                        <label style={{ 'font-size': '11px', display: 'flex', gap: '4px', 'align-items': 'center' }} title="Paint the stroke with a gradient">
                            <input type="checkbox" checked={!!sg()} onChange={(e) => {
                                const base = props.el()?.strokeColor && props.el().strokeColor !== 'transparent' ? props.el().strokeColor : '#000000';
                                setSG(e.currentTarget.checked ? { type: 'linear', angle: 0, stops: [{ offset: 0, color: base }, { offset: 1, color: '#ffffff' }] } : undefined);
                            }} />
                            Gradient stroke
                        </label>
                        <Show when={sg()}>
                            <input type="color" style={sw} value={stops()[0]?.color || '#000000'} onInput={e => editStop(0, e.currentTarget.value)} title="Start colour" />
                            <input type="color" style={sw} value={stops()[stops().length - 1]?.color || '#ffffff'} onInput={e => editStop(stops().length - 1, e.currentTarget.value)} title="End colour" />
                            <input type="number" style={numS} value={sg()?.angle ?? 0} step="15" onInput={e => setSG({ ...sg(), angle: Number(e.currentTarget.value) })} title="Angle°" />
                            <select style={{ 'font-size': '11px' }} value={sg()?.type || 'linear'} onChange={e => setSG({ ...sg(), type: e.currentTarget.value })} title="Gradient type">
                                <option value="linear">Linear</option><option value="radial">Radial</option>
                            </select>
                        </Show>
                    </div>
                );
            })()}
        </div>
    );
};

/** Gradient-mesh editor — a rows×cols grid of node colour swatches plus size
 *  steppers. Operates on the active element's `meshGradient`. */
const MeshEditor: Component<{ el: () => any }> = (props) => {
    const mesh = () => props.el()?.meshGradient as { rows: number; cols: number; colors: string[]; points?: any[]; smooth?: boolean } | undefined;
    const ids = () => [props.el()?.id].filter(Boolean);
    const sw = { width: '100%', height: '20px', padding: '0', border: '1px solid var(--border-color)', 'border-radius': '3px', cursor: 'pointer' } as any;
    const btn = { padding: '1px 7px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    return (
        <Show when={mesh()}>
            <div class="property-group">
                <div class="group-title"><span>GRADIENT MESH</span></div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                    <span style={{ 'font-size': '11px' }}>Rows</span>
                    <button style={btn} title="Fewer rows" onClick={() => setMeshSize(ids(), mesh()!.rows - 1, mesh()!.cols)}>−</button>
                    <span style={{ 'font-size': '11px', 'min-width': '14px', 'text-align': 'center' }}>{mesh()!.rows}</span>
                    <button style={btn} title="More rows" onClick={() => setMeshSize(ids(), mesh()!.rows + 1, mesh()!.cols)}>+</button>
                    <span style={{ 'font-size': '11px', 'margin-left': '6px' }}>Cols</span>
                    <button style={btn} title="Fewer cols" onClick={() => setMeshSize(ids(), mesh()!.rows, mesh()!.cols - 1)}>−</button>
                    <span style={{ 'font-size': '11px', 'min-width': '14px', 'text-align': 'center' }}>{mesh()!.cols}</span>
                    <button style={btn} title="More cols" onClick={() => setMeshSize(ids(), mesh()!.rows, mesh()!.cols + 1)}>+</button>
                </div>
                <div style={{ display: 'grid', 'grid-template-columns': `repeat(${mesh()!.cols}, 1fr)`, gap: '3px' }}>
                    <For each={mesh()!.colors}>{(color: string, i) => {
                        const row = () => Math.floor(i() / mesh()!.cols);
                        const col = () => i() % mesh()!.cols;
                        return (
                            <input
                                type="color"
                                style={sw}
                                value={color}
                                title={`Node (${row()}, ${col()})`}
                                onInput={e => setMeshNodeColor(ids(), row(), col(), e.currentTarget.value)}
                            />
                        );
                    }}</For>
                </div>
                <label class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-top': '6px', 'font-size': '11px', cursor: 'pointer' }} title="Bicubic colour blending (smoother, no cell-edge creases). Even grid only.">
                    <input type="checkbox" checked={mesh()!.smooth !== false} onChange={(e) => setMeshSmooth(ids(), e.currentTarget.checked)} />
                    <span>Smooth (bicubic)</span>
                </label>
                <div class="control-row" style={{ gap: '6px', 'margin-top': '6px' }}>
                    <button
                        style={{ ...btn, ...(store.meshEditActive ? { background: 'var(--primary-color, #3b82f6)', color: '#fff', 'border-color': 'var(--primary-color, #3b82f6)' } : {}) }}
                        title="Edit mesh nodes directly on the canvas"
                        onClick={() => toggleMeshEdit()}
                    >{store.meshEditActive ? 'Editing on canvas…' : 'Edit on canvas'}</button>
                    <Show when={mesh()!.points}>
                        <button style={btn} title="Reset node positions to the even grid" onClick={() => resetMeshNodes(ids())}>Reset nodes</button>
                    </Show>
                    <button style={btn} title="Remove the mesh fill" onClick={() => clearMeshGradient(ids())}>Remove mesh</button>
                </div>
            </div>
        </Show>
    );
};

/** Vector pattern-fill editor — motif preset + colours + scale/spacing/thickness/
 *  angle sliders. Operates on the active element's `patternFill`. */
const PatternEditor: Component<{ el: () => any }> = (props) => {
    const pat = () => props.el()?.patternFill as import("../types").PatternFill | undefined;
    const ids = () => [props.el()?.id].filter(Boolean) as string[];
    const sw = { width: '100%', height: '24px', padding: '0', border: '1px solid var(--border-color)', 'border-radius': '3px', cursor: 'pointer' } as any;
    const btn = { padding: '2px 8px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    const set = (patch: Partial<import("../types").PatternFill>, history = true) => setPatternFill(ids(), patch, history);
    const transparentBg = () => !pat()?.background || pat()?.background === 'transparent';
    const isCustom = () => pat()?.type === 'custom';
    // Procedural grain: sizes its own tile, so Spacing is meaningless and
    // strokeWidth reads as the grain size instead of a line thickness.
    const isTexture = () => pat()?.type === 'noise' || pat()?.type === 'grunge';
    return (
        <Show when={pat()}>
            <div class="property-group">
                <div class="group-title"><span>PATTERN</span></div>

                {/* Custom pattern: thumbnail of the captured artwork tile */}
                <Show when={isCustom()}>
                    <div class="control-row" style={{ gap: '8px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                        <img src={pat()!.tile} alt="pattern tile"
                            style={{ width: '40px', height: '40px', 'object-fit': 'contain', border: '1px solid var(--border-color)', 'border-radius': '4px', background: '#fff' }} />
                        <span style={{ 'font-size': '11px', color: 'var(--text-secondary)' }}>Custom (from selection)</span>
                    </div>
                </Show>

                {/* Built-in motif controls */}
                <Show when={!isCustom()}>
                    {/* Motif preset */}
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                        <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Motif</span>
                        <select style={{ 'font-size': '11px', flex: '1' }} value={pat()!.type}
                            onChange={e => set({ type: e.currentTarget.value as any })} title="Pattern motif">
                            <For each={PATTERN_PRESETS}>{(p) => <option value={p.type}>{p.label}</option>}</For>
                        </select>
                    </div>

                    {/* Colours */}
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                        <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Color</span>
                        <input type="color" style={sw} value={pat()!.color || '#000000'}
                            onInput={e => set({ color: e.currentTarget.value }, false)}
                            onChange={e => set({ color: e.currentTarget.value })} title="Foreground colour" />
                    </div>
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                        <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Back</span>
                        <input type="color" style={{ ...sw, opacity: transparentBg() ? 0.4 : 1 }}
                            value={transparentBg() ? '#ffffff' : pat()!.background!}
                            onInput={e => set({ background: e.currentTarget.value }, false)}
                            onChange={e => set({ background: e.currentTarget.value })} title="Tile background colour" />
                        <button style={{ ...btn, ...(transparentBg() ? { background: 'var(--primary-color, #3b82f6)', color: '#fff' } : {}) }}
                            title="Transparent tile background" onClick={() => set({ background: 'transparent' })}>None</button>
                    </div>
                </Show>

                {/* Sliders */}
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                    <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Scale</span>
                    <input type="range" style={{ flex: '1' }} min="0.25" max="4" step="0.05" value={pat()!.scale ?? 1}
                        onInput={e => set({ scale: parseFloat(e.currentTarget.value) }, false)}
                        onChange={e => set({ scale: parseFloat(e.currentTarget.value) })} title="Overall pattern zoom" />
                </div>
                <Show when={!isCustom()}>
                    <Show when={!isTexture()}>
                        <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                            <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Spacing</span>
                            <input type="range" style={{ flex: '1' }} min="4" max="48" step="1" value={pat()!.spacing ?? 12}
                                onInput={e => set({ spacing: parseFloat(e.currentTarget.value) }, false)}
                                onChange={e => set({ spacing: parseFloat(e.currentTarget.value) })} title="Spacing between motif repeats" />
                        </div>
                    </Show>
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                        <span style={{ 'font-size': '11px', 'min-width': '42px' }}>{isTexture() ? 'Grain' : 'Thick'}</span>
                        <input type="range" style={{ flex: '1' }} min="0.5" max="12" step="0.5" value={pat()!.strokeWidth ?? 2}
                            onInput={e => set({ strokeWidth: parseFloat(e.currentTarget.value) }, false)}
                            onChange={e => set({ strokeWidth: parseFloat(e.currentTarget.value) })}
                            title={isTexture() ? 'Grain size' : 'Line thickness / dot size'} />
                    </div>
                    <Show when={isTexture()}>
                        {/* Re-roll the grain. The seed is stored, so the texture is otherwise
                            identical on every redraw, reload and export. */}
                        <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                            <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Seed</span>
                            <button style={{ ...btn, flex: '1' }}
                                onClick={() => set({ seed: Math.floor(Math.random() * 100000) })}
                                title="Generate a different grain">Randomize</button>
                        </div>
                    </Show>
                </Show>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center' }}>
                    <span style={{ 'font-size': '11px', 'min-width': '42px' }}>Angle</span>
                    <input type="range" style={{ flex: '1' }} min="0" max="180" step="1" value={pat()!.angle ?? 0}
                        onInput={e => set({ angle: parseFloat(e.currentTarget.value) }, false)}
                        onChange={e => set({ angle: parseFloat(e.currentTarget.value) })} title="Pattern rotation (degrees)" />
                </div>

                <div class="control-row" style={{ gap: '6px', 'margin-top': '6px' }}>
                    <button style={btn} title="Save this pattern to the Patterns library (Alt+P)" onClick={() => savePatternSwatchFromElement(ids())}>Save to Library</button>
                    <button style={btn} title="Remove the pattern fill" onClick={() => clearPatternFill(ids())}>Remove pattern</button>
                </div>
            </div>
        </Show>
    );
};

/** Glow & Feather editor — live sliders for the soft-edge feather radius and the outer-glow
 *  colour + radius. `updateElement` writes the element fields directly; history is snapshotted
 *  once on interaction start (like the shared number controls). */
const GlowFeatherEditor: Component<{ el: () => any }> = (props) => {
    const el = () => props.el();
    const id = () => el()?.id as string | undefined;
    const set = (patch: any) => { const i = id(); if (i) updateElement(i, patch, false); };
    const snap = () => pushToHistory();
    const feather = () => Math.round(el()?.featherRadius ?? 0);
    const glowOn = () => !!el()?.glowEnabled;
    const glowBlur = () => Math.round(el()?.glowBlur ?? 12);
    const glowColor = () => el()?.glowColor ?? '#ffd400';
    return (
        <Show when={id()}>
            <div class="property-group">
                <div class="group-title"><span>GLOW &amp; FEATHER</span></div>
                {/* Feather (soft edge) */}
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                    <span style={{ 'font-size': '11px', 'min-width': '54px' }}>Feather</span>
                    <input type="range" style={{ flex: '1' }} min={0} max={60} step={1} value={feather()}
                        onMouseDown={snap} onInput={e => set({ featherRadius: parseInt(e.currentTarget.value) })} />
                    <span style={{ 'font-size': '11px', 'min-width': '30px', 'text-align': 'right' }}>{feather()}</span>
                </div>
                {/* Outer glow */}
                <label class="control-row" style={{ gap: '6px', 'align-items': 'center', 'font-size': '11px', cursor: 'pointer', 'margin-bottom': glowOn() ? '6px' : '0' }}>
                    <input type="checkbox" checked={glowOn()} onChange={e => { snap(); set({ glowEnabled: e.currentTarget.checked, glowColor: glowColor(), glowBlur: glowBlur() }); }} />
                    <span>Outer Glow</span>
                </label>
                <Show when={glowOn()}>
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                        <span style={{ 'font-size': '11px', 'min-width': '54px' }}>Colour</span>
                        <input type="color" style={{ width: '28px', height: '20px', padding: '0', border: '1px solid var(--border-color)', 'border-radius': '3px', cursor: 'pointer' }}
                            value={glowColor()} onInput={e => { snap(); set({ glowColor: e.currentTarget.value }); }} />
                        <span style={{ 'font-size': '11px', 'min-width': '40px' }}>Radius</span>
                        <input type="range" style={{ flex: '1' }} min={0} max={40} step={1} value={glowBlur()}
                            onMouseDown={snap} onInput={e => set({ glowBlur: parseInt(e.currentTarget.value) })} />
                        <span style={{ 'font-size': '11px', 'min-width': '24px', 'text-align': 'right' }}>{glowBlur()}</span>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

/** Warp-preset editor — preset picker + live bend slider + Bake/Remove. Self-gating: only
 *  shows when the element carries a preset warp (`el.warp.preset`), so free-drag envelope /
 *  mesh warps are unaffected. Operates on the active element's `warp`. */
const WarpPresetEditor: Component<{ el: () => any }> = (props) => {
    const warp = () => props.el()?.warp as { preset?: string; bend?: number } | undefined;
    const ids = () => [props.el()?.id].filter(Boolean) as string[];
    const btn = { padding: '2px 8px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    const bend = () => Math.round((warp()?.bend ?? 0.5) * 100);
    const preset = () => (warp()?.preset ?? 'arc') as any;
    const reapply = (p: string, b: number, history: boolean) => applyWarpPreset(ids(), p as any, b, history);
    return (
        <Show when={ids().length === 1 && warp()?.preset}>
            <div class="property-group">
                <div class="group-title"><span>WARP PRESET</span></div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                    <span style={{ 'font-size': '11px', 'min-width': '54px' }}>Style</span>
                    <select style={{ flex: '1', 'font-size': '11px' }} value={preset()} onChange={e => reapply(e.currentTarget.value, (warp()?.bend ?? 0.5), true)}>
                        <For each={WARP_PRESETS}>{(w) => <option value={w.id}>{w.label}</option>}</For>
                    </select>
                </div>
                <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '6px' }}>
                    <span style={{ 'font-size': '11px', 'min-width': '54px' }}>Bend</span>
                    <input type="range" style={{ flex: '1' }} min={-100} max={100} step={1} value={bend()}
                        onInput={e => reapply(preset(), parseInt(e.currentTarget.value) / 100, false)}
                        onChange={e => reapply(preset(), parseInt(e.currentTarget.value) / 100, true)} />
                    <span style={{ 'font-size': '11px', 'min-width': '34px', 'text-align': 'right' }}>{bend()}%</span>
                </div>
                <div class="control-row" style={{ gap: '6px' }}>
                    <button style={btn} title="Bake the warp into permanent geometry" onClick={() => bakeWarp(ids())}>Bake</button>
                    <button style={btn} title="Remove the warp" onClick={() => toggleEnvelopeWarp(ids())}>Remove</button>
                </div>
            </div>
        </Show>
    );
};

/** Live 3D Extrude editor — depth / direction / shade sliders + Add/Remove. Self-gating:
 *  shows an "Add" button when absent, controls when present. Operates on `el.extrude`. */
const ExtrudeEditor: Component<{ el: () => any }> = (props) => {
    const ex = () => props.el()?.extrude as import("../types").Extrude3D | undefined;
    const ids = () => [props.el()?.id].filter(Boolean) as string[];
    const btn = { padding: '2px 8px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    const live = (p: Partial<import("../types").Extrude3D>) => setExtrude(ids(), p, false);
    const commit = (p: Partial<import("../types").Extrude3D>) => setExtrude(ids(), p, true);
    const Row = (p: { label: string; min: number; max: number; step: number; val: () => number; on: (v: number) => void; onC: (v: number) => void; suffix?: string }) => (
        <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '5px' }}>
            <span style={{ 'font-size': '11px', 'min-width': '54px' }}>{p.label}</span>
            <input type="range" style={{ flex: '1' }} min={p.min} max={p.max} step={p.step} value={p.val()}
                onInput={e => p.on(parseFloat(e.currentTarget.value))} onChange={e => p.onC(parseFloat(e.currentTarget.value))} />
            <span style={{ 'font-size': '11px', 'min-width': '34px', 'text-align': 'right' }}>{p.val()}{p.suffix ?? ''}</span>
        </div>
    );
    return (
        <Show when={ids().length === 1}>
            <div class="property-group">
                <div class="group-title"><span>3D EXTRUDE</span></div>
                <Show when={ex()} fallback={
                    <button style={btn} title="Add a 3D extrude (shaded depth behind the shape)" onClick={() => setExtrude(ids())}>+ Add 3D Extrude</button>
                }>
                    {Row({ label: 'Depth', min: 0, max: 120, step: 1, val: () => Math.round(ex()!.depth ?? 0), on: v => live({ depth: v }), onC: v => commit({ depth: v }) })}
                    {Row({ label: 'Angle', min: 0, max: 360, step: 5, val: () => Math.round(ex()!.angle ?? 0), on: v => live({ angle: v }), onC: v => commit({ angle: v }), suffix: '°' })}
                    {Row({ label: 'Tilt X', min: -70, max: 70, step: 1, val: () => Math.round(ex()!.rotX ?? 0), on: v => live({ rotX: v }), onC: v => commit({ rotX: v }), suffix: '°' })}
                    {Row({ label: 'Tilt Y', min: -70, max: 70, step: 1, val: () => Math.round(ex()!.rotY ?? 0), on: v => live({ rotY: v }), onC: v => commit({ rotY: v }), suffix: '°' })}
                    {Row({ label: 'Bevel', min: 0, max: 30, step: 1, val: () => Math.round(ex()!.bevel ?? 0), on: v => live({ bevel: v }), onC: v => commit({ bevel: v }) })}
                    {Row({ label: 'Shade', min: 0, max: 90, step: 5, val: () => Math.round((ex()!.shade ?? 0.35) * 100), on: v => live({ shade: v / 100 }), onC: v => commit({ shade: v / 100 }), suffix: '%' })}
                    <div class="control-row" style={{ gap: '6px' }}>
                        <button style={btn} title="Bake the 3D into editable face elements" onClick={() => expandExtrude(ids())}>Expand</button>
                        <button style={btn} title="Remove the 3D extrude" onClick={() => clearExtrude(ids())}>Remove</button>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

/** Live Turntable editor (Adobe Project Turntable) — spin a vector path in pseudo-3D via
 *  yaw/pitch sliders, choose the depth model (flat foreshorten vs. symmetry bulge, with an
 *  optional back-face reveal), then Bake the current angle into an editable path. Selection-
 *  driven and self-gating: it renders ONLY when the selection contains a turntable-capable
 *  shape (a path or anything convertible to one), and a 2+-selection becomes one shared
 *  group rig. Non-path shapes are auto-converted on Add. */
const TurntableEditor: Component = () => {
    const els = () => store.elements.filter(e => store.selection.includes(e.id));
    const capable = () => els().filter(e => canTurntable(e));
    const ids = () => capable().map(e => e.id);
    const isGroup = () => capable().length > 1;
    const rep = () => capable().find(e => (e as any).turntable) ?? capable()[0];
    const tt = () => (rep() as any)?.turntable as import("../types").Turntable | undefined;
    const btn = { padding: '2px 8px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    const live = (p: Partial<import("../types").Turntable>) => setTurntable(ids(), p, false);
    const commit = (p: Partial<import("../types").Turntable>) => setTurntable(ids(), p, true);
    const Row = (p: { label: string; min: number; max: number; step: number; val: () => number; on: (v: number) => void; onC: (v: number) => void; suffix?: string }) => (
        <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '5px' }}>
            <span style={{ 'font-size': '11px', 'min-width': '54px' }}>{p.label}</span>
            <input type="range" style={{ flex: '1' }} min={p.min} max={p.max} step={p.step} value={p.val()}
                onInput={e => p.on(parseFloat(e.currentTarget.value))} onChange={e => p.onC(parseFloat(e.currentTarget.value))} />
            <span style={{ 'font-size': '11px', 'min-width': '34px', 'text-align': 'right' }}>{p.val()}{p.suffix ?? ''}</span>
        </div>
    );
    return (
        <Show when={capable().length >= 1}>
            <div class="property-group">
                <div class="group-title"><span>TURNTABLE (3D SPIN){isGroup() ? ' — GROUP' : ''}</span></div>
                <Show when={tt()} fallback={
                    <button style={btn} title="Rotate in pseudo-3D, keeping editable vectors" onClick={() => setTurntable(ids())}>+ Add Turntable{isGroup() ? ` (${capable().length})` : ''}</button>
                }>
                    {Row({ label: 'Yaw', min: -180, max: 180, step: 1, val: () => Math.round(tt()!.yaw ?? 0), on: v => live({ yaw: v }), onC: v => commit({ yaw: v }), suffix: '°' })}
                    {Row({ label: 'Pitch', min: -80, max: 80, step: 1, val: () => Math.round(tt()!.pitch ?? 0), on: v => live({ pitch: v }), onC: v => commit({ pitch: v }), suffix: '°' })}
                    <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '5px' }}>
                        <span style={{ 'font-size': '11px', 'min-width': '54px' }}>Volume</span>
                        <select style={{ flex: '1', 'font-size': '11px' }} value={tt()!.depthModel ?? 'symmetry'}
                            onChange={e => commit({ depthModel: e.currentTarget.value as any })}>
                            <option value="flat">Flat (foreshorten)</option>
                            <option value="symmetry">Symmetry (rounded)</option>
                        </select>
                    </div>
                    <Show when={tt()!.depthModel === 'symmetry'}>
                        {Row({ label: 'Depth', min: 0, max: 150, step: 5, val: () => Math.round((tt()!.depthScale ?? 0.6) * 100), on: v => live({ depthScale: v / 100 }), onC: v => commit({ depthScale: v / 100 }), suffix: '%' })}
                        <label class="control-row" style={{ gap: '6px', 'align-items': 'center', 'font-size': '11px', cursor: 'pointer', 'margin-bottom': '5px' }}>
                            <input type="checkbox" checked={!!tt()!.reveal} onChange={e => commit({ reveal: e.currentTarget.checked })} />
                            Reveal back face (show far side on turn)
                        </label>
                    </Show>
                    {Row({ label: 'Persp', min: 0, max: 100, step: 5, val: () => Math.round((tt()!.perspective ?? 0) * 100), on: v => live({ perspective: v / 100 }), onC: v => commit({ perspective: v / 100 }), suffix: '%' })}
                    <div class="control-row" style={{ gap: '6px', 'margin-bottom': '4px' }}>
                        <button style={{ ...btn, flex: '1' }} title="Auto-keyframe a full 360° spin across the timeline" onClick={() => spinTurntable360(ids())}>↻ Spin 360°</button>
                    </div>
                    <Show when={!isGroup()}>
                        <div class="control-row" style={{ gap: '6px', 'margin-bottom': '4px' }}>
                            <button style={{ ...btn, flex: '1' }}
                                title="Vector redraw at the current angle via a vision model (any provider) — cleaner & cheaper. Inserts a new editable path; needs an AI key."
                                onClick={async () => { const m = await import("../ai/turntable-ai"); m.reconstructTurntableAI(rep()!.id, { yaw: tt()!.yaw, pitch: tt()!.pitch }); }}>
                                ✨ AI Redraw
                            </button>
                            <button style={{ ...btn, flex: '1' }}
                                title="Photo reimagine at the current angle via an OpenAI image model, then auto-traced to vector — more faithful, messier paths. Needs an OpenAI key."
                                onClick={async () => { const m = await import("../ai/turntable-ai"); m.reconstructTurntableAIImage(rep()!.id, { yaw: tt()!.yaw, pitch: tt()!.pitch }); }}>
                                ✨ AI Reimagine
                            </button>
                        </div>
                    </Show>
                    <div class="control-row" style={{ gap: '6px' }}>
                        <button style={btn} title="Bake the current angle into an editable path" onClick={() => bakeTurntable(ids())}>Bake</button>
                        <button style={btn} title="Remove the turntable (restore the flat shape)" onClick={() => clearTurntable(ids())}>Remove</button>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

/** Live Transform-effect editor — copies / rotate / scale / move / pivot / reflect sliders,
 *  plus Expand & Remove. Operates on the active element's `transformEffect`. Self-gating:
 *  shows an "Add" button when absent, the full controls when present. */
const TransformEffectEditor: Component<{ el: () => any }> = (props) => {
    const fx = () => props.el()?.transformEffect as import("../types").TransformEffect | undefined;
    const ids = () => [props.el()?.id].filter(Boolean) as string[];
    const btn = { padding: '2px 8px', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 'border-radius': '4px', 'font-size': '11px' } as any;
    // live drag: onInput updates without a history entry; onChange commits one.
    const live = (patch: Partial<import("../types").TransformEffect>) => setTransformEffect(ids(), patch, false);
    const commit = (patch: Partial<import("../types").TransformEffect>) => setTransformEffect(ids(), patch, true);
    const num = (v: any, d: number) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
    const scalePct = () => Math.round((fx()?.scaleX ?? 1) * 100);

    const Row = (p: { label: string; min: number; max: number; step: number; val: () => number; on: (v: number) => void; onCommit: (v: number) => void; suffix?: string }) => (
        <div class="control-row" style={{ gap: '6px', 'align-items': 'center', 'margin-bottom': '5px' }}>
            <span style={{ 'font-size': '11px', 'min-width': '54px' }}>{p.label}</span>
            <input type="range" style={{ flex: '1' }} min={p.min} max={p.max} step={p.step} value={p.val()}
                onInput={e => p.on(num(e.currentTarget.value, p.val()))}
                onChange={e => p.onCommit(num(e.currentTarget.value, p.val()))} />
            <span style={{ 'font-size': '11px', 'min-width': '34px', 'text-align': 'right' }}>{p.val()}{p.suffix ?? ''}</span>
        </div>
    );

    return (
        <Show when={ids().length === 1}>
            <div class="property-group">
                <div class="group-title"><span>TRANSFORM EFFECT</span></div>
                <Show when={!fx()} fallback={
                    <>
                        {Row({ label: 'Copies', min: 0, max: 60, step: 1, val: () => fx()!.copies ?? 0, on: v => live({ copies: v }), onCommit: v => commit({ copies: v }) })}
                        {Row({ label: 'Rotate', min: -180, max: 180, step: 1, val: () => Math.round(fx()!.rotate ?? 0), on: v => live({ rotate: v }), onCommit: v => commit({ rotate: v }), suffix: '°' })}
                        {Row({ label: 'Scale', min: 20, max: 180, step: 1, val: () => scalePct(), on: v => live({ scaleX: v / 100, scaleY: v / 100 }), onCommit: v => commit({ scaleX: v / 100, scaleY: v / 100 }), suffix: '%' })}
                        {Row({ label: 'Move X', min: -120, max: 120, step: 1, val: () => Math.round(fx()!.moveX ?? 0), on: v => live({ moveX: v }), onCommit: v => commit({ moveX: v }) })}
                        {Row({ label: 'Move Y', min: -120, max: 120, step: 1, val: () => Math.round(fx()!.moveY ?? 0), on: v => live({ moveY: v }), onCommit: v => commit({ moveY: v }) })}
                        {Row({ label: 'Pivot X', min: 0, max: 100, step: 5, val: () => Math.round((fx()!.originX ?? 0.5) * 100), on: v => live({ originX: v / 100 }), onCommit: v => commit({ originX: v / 100 }), suffix: '%' })}
                        {Row({ label: 'Pivot Y', min: 0, max: 100, step: 5, val: () => Math.round((fx()!.originY ?? 0.5) * 100), on: v => live({ originY: v / 100 }), onCommit: v => commit({ originY: v / 100 }), suffix: '%' })}
                        <div class="control-row" style={{ gap: '10px', 'align-items': 'center', 'margin': '4px 0 6px' }}>
                            <label style={{ 'font-size': '11px', cursor: 'pointer', display: 'flex', gap: '4px', 'align-items': 'center' }}>
                                <input type="checkbox" checked={!!fx()!.reflectX} onChange={e => commit({ reflectX: e.currentTarget.checked })} /> Reflect X
                            </label>
                            <label style={{ 'font-size': '11px', cursor: 'pointer', display: 'flex', gap: '4px', 'align-items': 'center' }}>
                                <input type="checkbox" checked={!!fx()!.reflectY} onChange={e => commit({ reflectY: e.currentTarget.checked })} /> Reflect Y
                            </label>
                        </div>
                        <div class="control-row" style={{ gap: '6px' }}>
                            <button style={btn} title="Bake the copies into real, editable elements" onClick={() => expandTransformEffect(ids())}>Expand</button>
                            <button style={btn} title="Remove the transform effect" onClick={() => clearTransformEffect(ids())}>Remove</button>
                        </div>
                    </>
                }>
                    <button style={btn} title="Add a live Transform effect (accumulating copies)" onClick={() => setTransformEffect(ids())}>+ Add Transform Effect</button>
                </Show>
            </div>
        </Show>
    );
};

const GradientEditor: Component<{ target: any, onChange: (key: string, val: any, targetType?: string, targetId?: string, history?: boolean) => void }> = (props) => {

    // Helper to get current stops or defaults
    const stops = createMemo(() => {
        const targetData = props.target?.data;
        if (!targetData) return [];

        const s = targetData.gradientStops;
        if (s && s.length > 0) return s;

        // Fallback to start/end if available
        if (targetData.gradientStart && targetData.gradientEnd) {
            return [
                { offset: 0, color: targetData.gradientStart },
                { offset: 1, color: targetData.gradientEnd }
            ];
        }
        return [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#000000' }
        ];
    });

    const [selectedIndex, setSelectedIndex] = createSignal<number | null>(null);
    let barRef: HTMLDivElement | undefined;

    const updateStops = (newStops: any[], recordHistory = true) => {
        const target = props.target;
        props.onChange('gradientStops', newStops, target?.type, target?.type === 'element' ? target.data.id : undefined, recordHistory);
    };

    const handleBarMouseDown = (e: MouseEvent) => {
        // Only if clicking the bar background, not a thumb
        if ((e.target as HTMLElement).closest('.val-thumb')) return;

        if (!barRef) return;
        const rect = barRef.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);

        const newStop = { offset: percent, color: '#ffffff' };
        const newStops = [...stops(), newStop];
        // Sort explicitly when adding? No, append is fine.
        // Canvas will handle it.
        updateStops(newStops, true);
        setSelectedIndex(newStops.length - 1);
    };

    const handleThumbMouseDown = (e: MouseEvent, index: number) => {
        e.stopPropagation();
        e.preventDefault();
        setSelectedIndex(index);

        const onMove = (ev: MouseEvent) => {
            if (!barRef) return;
            const rect = barRef.getBoundingClientRect();
            const offsetX = ev.clientX - rect.left;
            const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);

            const current = [...stops()];
            current[index] = { ...current[index], offset: percent };
            updateStops(current, false);
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            pushToHistory();
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    // Render gradient preview string (sorted for display)
    const renderGradientString = createMemo(() => {
        const sorted = [...stops()].sort((a: any, b: any) => a.offset - b.offset);
        return `linear-gradient(90deg, ${sorted.map((s: any) => `${s.color} ${s.offset * 100}%`).join(', ')})`;
    });

    return (
        <div class="gradient-editor">
            <div
                class="gradient-bar-container"
                ref={barRef}
                onMouseDown={handleBarMouseDown}
                style={{
                    height: '24px',
                    "border-radius": '4px',
                    position: 'relative',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: 'conic-gradient(#eee 0.25turn, transparent 0.25turn 0.5turn, #eee 0.5turn 0.75turn, transparent 0.75turn) top left / 10px 10px repeat'
                }}
            >
                <div style={{ position: 'absolute', inset: 0, background: renderGradientString(), "border-radius": '3px' }}></div>

                <Index each={stops()}>
                    {(stop, i) => (
                        <div
                            class="val-thumb"
                            onMouseDown={(e) => handleThumbMouseDown(e, i)}
                            title={`Stop ${i + 1}: ${(stop().offset * 100).toFixed(0)}%`}
                            style={{
                                position: 'absolute',
                                left: `${stop().offset * 100}%`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '12px',
                                height: '12px',
                                "border-radius": '50%',
                                border: '2px solid white',
                                "box-shadow": '0 0 2px rgba(0,0,0,0.5)',
                                background: stop().color,
                                "z-index": selectedIndex() === i ? 10 : 1,
                                outline: selectedIndex() === i ? '2px solid var(--accent-color)' : 'none'
                            }}
                        />
                    )}
                </Index>
            </div>

            <Show when={selectedIndex() !== null && stops()[selectedIndex()!]}>
                <div class="control-row" style={{ "margin-top": '8px', "align-items": 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', "border-radius": '4px' }}>
                    <div class="color-wrapper" style={{ "width": '24px', "height": '24px', position: 'relative', overflow: 'hidden', "border-radius": '50%', border: '1px solid var(--border-color)' }}>
                        <input type="color"
                            value={stops()[selectedIndex()!].color}
                            onInput={(e) => {
                                const current = [...stops()];
                                current[selectedIndex()!] = { ...current[selectedIndex()!], color: e.currentTarget.value };
                                updateStops(current, false);
                            }}
                            onChange={() => pushToHistory()}
                            style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', padding: 0, border: 'none', cursor: 'pointer' }}
                        />
                    </div>
                    <div style={{ flex: 1, display: 'flex', "align-items": 'center', gap: '4px' }}>
                        <input type="range"
                            min="0" max="100" step="1"
                            value={Math.round(stops()[selectedIndex()!].offset * 100)}
                            onInput={(e) => {
                                const val = parseInt(e.currentTarget.value) / 100;
                                const current = [...stops()];
                                current[selectedIndex()!] = { ...current[selectedIndex()!], offset: val };
                                updateStops(current, false); // Dragging slider
                            }}
                            onChange={() => pushToHistory()}
                            style={{ flex: 1 }}
                        />
                        <span style={{ "font-size": '11px', width: '28px', "text-align": 'right' }}>{Math.round(stops()[selectedIndex()!].offset * 100)}%</span>
                    </div>
                    <button class="icon-btn small" onClick={() => {
                        const current = stops();
                        if (current.length > 2) {
                            const newStops = current.filter((_: any, idx: number) => idx !== selectedIndex());
                            updateStops(newStops, true);
                            setSelectedIndex(null);
                        }
                    }} disabled={stops().length <= 2} title="Delete Stop">
                        <Trash2 size={14} />
                    </button>
                </div>
            </Show>
            <div style={{ "margin-top": '4px', "font-size": '10px', color: 'var(--text-secondary)', "text-align": 'center' }}>
                Click bar to add · Drag to move
            </div>
        </div>
    );
};

const PropertyPanel: Component = () => {

    // Derived state for the active target (selection or defaults)
    const activeTarget = createMemo(() => propertyPanelTarget());

    const activeProperties = createMemo(() => {
        const target = activeTarget();
        if (!target) return [];

        let targetType: string;
        if (target.type === 'multi') {
            targetType = 'all';
        } else if (target.type === 'canvas') {
            targetType = 'canvas';
        } else if (target.type === 'slide') {
            targetType = 'slide';
        } else if (target.type === 'eraser') {
            targetType = 'eraser';
        } else if (target.type === 'defaults') {
            const tool = store.selectedTool;
            // If selection/pan, show generic "shape" defaults (approx. rectangle)
            // This allows setting default colors/fills for any future shape.
            if (tool === 'selection' || tool === 'pan') {
                targetType = 'rectangle';
            } else if (tool === 'bezier') {
                targetType = 'line';
            } else {
                targetType = tool;
            }
        } else {
            targetType = target.data!.type;
        }

        return properties.filter(p => {
            // Eraser tool: only its own controls (e.g. eraser width), nothing else.
            if (target.type === 'eraser') {
                return Array.isArray(p.applicableTo) && (p.applicableTo as any).includes('eraser');
            }

            // Filter out properties that don't make sense for defaults (like locked, link, angle, width/height?)
            if (target.type === 'defaults') {
                if (['locked', 'link', 'tag', 'angle', 'x', 'y', 'width', 'height', 'shearX', 'shearY', 'containerText', 'text', 'shadowOffsetX', 'shadowOffsetY'].includes(p.key)) return false;
            }

            // In slides mode, hide canvasBackgroundColor from canvas settings —
            // each slide has its own backgroundColor via slide properties
            if (target.type === 'canvas' && p.key === 'canvasBackgroundColor' && isPagedDocType(store.docType)) {
                return false;
            }

            // Page size controls only apply to design documents
            if (['pageSizePreset', 'pageWidth', 'pageHeight'].includes(p.key) && store.docType !== 'design') {
                return false;
            }

            // Slides and canvas require explicit applicableTo - don't inherit from 'all'
            // Only dibujo elements (rectangle, circle, etc) inherit from 'all'
            if ((p.applicableTo as any) === 'all') {
                if (target.type === 'slide' || target.type === 'canvas') return false;
                // Fall through to dependsOn check
            } else if (target.type === 'slide' || target.type === 'canvas') {
                if (!Array.isArray(p.applicableTo) || !(p.applicableTo as any).includes(targetType as any)) {
                    return false;
                }
            } else if (target.type === 'multi') {
                // For multi-selection, show 'all' properties OR properties common to ALL selected element types
                if ((p.applicableTo as any) !== 'all') {
                    if (Array.isArray(p.applicableTo)) {
                        const selectedTypes = store.selection.map(id => store.elements.find(e => e.id === id)?.type).filter(Boolean);
                        const allMatch = selectedTypes.every(t => (p.applicableTo as string[]).includes(t as string));
                        if (!allMatch) return false;
                    } else {
                        return false;
                    }
                }
            } else if (Array.isArray(p.applicableTo) && !(p.applicableTo as any[]).includes(targetType as any)) {
                return false;
            }


            // Dependency Check
            if (p.dependsOn) {
                const depKey = typeof p.dependsOn === 'string' ? p.dependsOn : p.dependsOn.key;
                const requiredVal = typeof p.dependsOn === 'string' ? true : p.dependsOn.value;

                let currentValue: any;

                if (target.type === 'element') {
                    currentValue = (target.data as any)[depKey];
                } else if (target.type === 'defaults') {
                    currentValue = (store.defaultElementStyles as any)[depKey];
                } else if (target.type === 'slide') {
                    currentValue = (target.data as any)[depKey];
                } else if (target.type === 'multi') {
                    // For multi-select, show property if ANY element satisfies the dependency
                    const depProp = properties.find(dp => dp.key === depKey);
                    const defaultVal = depProp?.defaultValue;
                    const anySatisfies = store.selection.some(id => {
                        const el = store.elements.find(e => e.id === id);
                        if (!el) return false;
                        let cv = (el as any)[depKey];
                        if (cv === undefined) cv = defaultVal;
                        if (typeof requiredVal === 'boolean') return !!cv === requiredVal;
                        if (Array.isArray(requiredVal)) return requiredVal.includes(cv);
                        return cv === requiredVal;
                    });
                    if (!anySatisfies) return false;
                    // Skip the single-value check below
                    return true;
                }

                // If undefined, use default from property config
                if (currentValue === undefined) {
                    const depProp = properties.find(dp => dp.key === depKey);
                    currentValue = depProp?.defaultValue;
                }

                // If it depends on a toggle (boolean) and requiredVal is boolean
                if (typeof requiredVal === 'boolean') {
                    if (!!currentValue !== requiredVal) return false;
                }
                // If requiredVal is array (one of)
                else if (Array.isArray(requiredVal)) {
                    if (!requiredVal.includes(currentValue)) return false;
                }
                // Exact match
                else {
                    if (currentValue !== requiredVal) return false;
                }
            }

            return true;
        });
    });

    const handleChange = (key: string, value: any, targetType?: string, targetId?: string, history = true) => {
        const target = activeTarget();
        if (!target) return;

        // If targetId is provided, ensure it matches current target
        if (targetId && target.type === 'element' && target.data.id !== targetId) {
            return;
        }

        // If targetType is provided, ensure it matches current target's type
        if (targetType && target.type !== targetType) {
            return;
        }

        // Roundness conversion (boolean -> object or null)
        let finalValue = value;
        if (key === 'roundness') {
            finalValue = value ? { type: 1 } : null;
        }

        // Selecting the 'mesh' fill type seeds a default mesh grid (element targets only).
        if (key === 'fillStyle' && value === 'mesh') {
            const ids = target.type === 'element' ? [targetId || target.data.id!].filter(Boolean) as string[]
                : target.type === 'multi' ? [...store.selection] : [];
            if (ids.length) { applyMeshGradient(ids); return; }
        }

        // Selecting the 'pattern' fill type seeds a default pattern motif.
        if (key === 'fillStyle' && value === 'pattern') {
            const ids = target.type === 'element' ? [targetId || target.data.id!].filter(Boolean) as string[]
                : target.type === 'multi' ? [...store.selection] : [];
            if (ids.length) { applyPatternFill(ids); return; }
        }

        // Gradient preset: apply preset colors and direction
        if (key === 'gradientPreset' && value !== 'custom') {
            const preset = getGradientPreset(value);
            if (preset && target.type === 'element') {
                const id = targetId || target.data.id!;
                updateElement(id, {
                    gradientPreset: value,
                    gradientStops: preset.stops,
                    gradientDirection: preset.direction ?? 45
                }, history);
                return;
            } else if (preset && target.type === 'multi') {
                store.selection.forEach(id => {
                    updateElement(id, {
                        gradientPreset: value,
                        gradientStops: preset.stops,
                        gradientDirection: preset.direction ?? 45
                    }, history);
                });
                return;
            } else if (preset && target.type === 'slide') {
                const slideIndex = store.activeSlideIndex;
                updateSlideBackground(slideIndex, {
                    gradientStops: preset.stops,
                    gradientDirection: preset.direction ?? 45
                });
                return;
            }
        }

        // Image filter preset: apply preset filter values
        if (key === 'filterPreset' && value !== 'custom') {
            const preset = getImageFilterPreset(value);
            if (preset) {
                const filterUpdates = {
                    filterPreset: value,
                    filterBrightness: preset.values.filterBrightness ?? 100,
                    filterContrast: preset.values.filterContrast ?? 100,
                    filterSaturate: preset.values.filterSaturate ?? 100,
                    filterBlur: preset.values.filterBlur ?? 0,
                    filterHueRotate: preset.values.filterHueRotate ?? 0,
                    filterInvert: preset.values.filterInvert ?? 0,
                    filterSepia: preset.values.filterSepia ?? 0,
                };
                if (target.type === 'element') {
                    updateElement(targetId || target.data.id!, filterUpdates, history);
                } else if (target.type === 'multi') {
                    store.selection.forEach(id => updateElement(id, filterUpdates, history));
                }
                return;
            }
        }

        // Auto-switch to custom preset when individual filter values change
        const FILTER_KEYS = ['filterBrightness', 'filterContrast', 'filterSaturate', 'filterBlur', 'filterHueRotate', 'filterInvert', 'filterSepia'];
        if (FILTER_KEYS.includes(key)) {
            if (target.type === 'element') {
                const el = target.data as DrawingElement;
                if (el.filterPreset && el.filterPreset !== 'custom') {
                    updateElement(targetId || el.id!, { filterPreset: 'custom', [key]: finalValue }, history);
                    return;
                }
            } else if (target.type === 'multi') {
                store.selection.forEach(id => {
                    const el = store.elements.find(e => e.id === id);
                    if (el?.filterPreset && el.filterPreset !== 'custom') {
                        updateElement(id, { filterPreset: 'custom', [key]: finalValue }, history);
                    } else {
                        updateElement(id, { [key]: finalValue }, history);
                    }
                });
                return;
            }
        }

        // OpenBox preset: apply all preset settings
        if (key === 'openBoxPreset' && value !== 'custom') {
            const preset = getOpenBoxPreset(value);
            if (preset && target.type === 'element') {
                const id = targetId || target.data.id!;
                updateElement(id, {
                    openBoxPreset: value,
                    ...preset.settings
                }, history);
                return;
            } else if (preset && target.type === 'multi') {
                store.selection.forEach(id => {
                    updateElement(id, {
                        openBoxPreset: value,
                        ...preset.settings
                    }, history);
                });
                return;
            }
        }

        // Table resize: when rows or cols change, resize data/widths/heights arrays
        if (target.type === 'element' && target.data.type === 'table' && (key === 'tableRows' || key === 'tableCols' || key === 'tableHeaders')) {
            const el = target.data;
            const id = targetId || el.id!;
            const oldRows = el.tableRows ?? 3;
            const oldCols = el.tableCols ?? 3;
            const oldHasHeader = el.tableHeaders !== false;
            const newRows = key === 'tableRows' ? Number(finalValue) : oldRows;
            const newCols = key === 'tableCols' ? Number(finalValue) : oldCols;
            const newHasHeader = key === 'tableHeaders' ? !!finalValue : oldHasHeader;
            const totalVisualRows = newHasHeader ? newRows + 1 : newRows;

            const updates: any = { [key]: key === 'tableHeaders' ? finalValue : Number(finalValue) };

            if (key === 'tableRows' || key === 'tableCols') {
                const oldData = el.tableData ?? (oldHasHeader
                    ? [Array.from({ length: oldCols }, (_, i) => `Col ${i + 1}`), ...defaultTableData(oldRows, oldCols)]
                    : defaultTableData(oldRows, oldCols));
                const totalNewDataRows = newHasHeader ? newRows + 1 : newRows;
                updates.tableData = resizeTableData(oldData, totalNewDataRows, newCols);
                // Fill new header cells if expanding cols
                if (newHasHeader && newCols > oldCols) {
                    for (let c = oldCols; c < newCols; c++) {
                        updates.tableData[0][c] = `Col ${c + 1}`;
                    }
                }
                updates.tableColWidths = defaultColWidths(newCols);
                updates.tableRowHeights = defaultRowHeights(totalVisualRows);
            }

            if (key === 'tableHeaders') {
                const oldData = el.tableData ?? defaultTableData(oldRows, oldCols);
                if (newHasHeader && !oldHasHeader) {
                    // Adding header: prepend header row
                    const headerRow = Array.from({ length: newCols }, (_, i) => `Col ${i + 1}`);
                    updates.tableData = [headerRow, ...oldData];
                } else if (!newHasHeader && oldHasHeader) {
                    // Removing header: strip first row
                    updates.tableData = oldData.slice(1);
                }
                updates.tableRowHeights = defaultRowHeights(totalVisualRows);
            }

            updateElement(id, updates, history);
            return;
        }

        // BPMN Pool: sync lane arrays when lane count changes
        if (target.type === 'element' && target.data.type === 'bpmnPool' && key === 'bpmnLaneCount') {
            const el = target.data;
            const id = targetId || el.id!;
            const newCount = Number(finalValue);
            const oldLabels = el.bpmnLaneLabels ?? [];
            const oldColors = el.bpmnLaneColors ?? [];
            const oldTextColors = el.bpmnLaneTextColors ?? [];
            const newLabels = Array.from({ length: newCount }, (_, i) => oldLabels[i] ?? `Lane ${i + 1}`);
            const newColors = Array.from({ length: newCount }, (_, i) => oldColors[i] ?? '');
            const newTextColors = Array.from({ length: newCount }, (_, i) => oldTextColors[i] ?? '');
            updateElement(id, { bpmnLaneCount: newCount, bpmnLaneLabels: newLabels, bpmnLaneColors: newColors, bpmnLaneTextColors: newTextColors }, history);
            return;
        }

        // Auto-recompute derived video properties when videoURL changes
        if (key === 'videoURL') {
            const url = String(finalValue || '');
            const provider = detectVideoProvider(url);
            const embedURL = getEmbedURL(url, provider);
            const posterURL = getPosterURL(url, provider);
            const updates: Partial<DrawingElement> = {
                videoURL: url,
                videoProvider: provider,
                videoEmbedURL: embedURL || undefined,
                videoPosterURL: posterURL || undefined,
            };
            if (target.type === 'element') {
                updateElement(targetId || target.data.id!, updates, history);
            } else if (target.type === 'multi') {
                store.selection.forEach(id => updateElement(id, updates, history));
            }
            // Async poster fetch for Vimeo / direct video
            if (url) {
                fetchPoster(url, provider).then(poster => {
                    if (poster) getImage(poster);
                });
            }
            return;
        }

        // Numeric Transform (X/Y/W/H): route through setElementTransform so width/height
        // scale the element's relative geometry (pen points, path anchors) — a raw
        // updateElement would resize the bbox while leaving the geometry behind.
        if ((key === 'x' || key === 'y' || key === 'width' || key === 'height') && Number.isFinite(finalValue)) {
            const patch = { [key]: Number(finalValue) };
            if (target.type === 'element') {
                setElementTransform(targetId || target.data.id!, patch);
            } else if (target.type === 'multi') {
                store.selection.forEach(id => setElementTransform(id, patch));
            }
            return;
        }

        // Text effect presets expand into a multi-attribute patch derived from
        // the element's current colors (see config/text-effect-presets.ts).
        if (key === 'textEffect' && (target.type === 'element' || target.type === 'multi')) {
            const preset = getTextEffectPreset(finalValue);
            if (preset) {
                const ids = target.type === 'multi' ? store.selection : [targetId || target.data!.id!];
                ids.forEach(id => {
                    const el = store.elements.find(e => e.id === id);
                    if (el) updateElement(id, preset.patch(el), history);
                });
            }
            return;
        }

        // Picking a solid background colour should also switch the element back to a solid
        // fill — otherwise a non-solid fillStyle (gradient/hachure) ignores the new colour and
        // the swatch appears to do nothing / show an odd colour.
        const patch: any = { [key]: finalValue };
        if (key === 'backgroundColor' && finalValue && finalValue !== 'transparent') patch.fillStyle = 'solid';
        if (target.type === 'element') {
            updateElement(targetId || target.data.id!, patch, history);
        } else if (target.type === 'multi') {
            store.selection.forEach(id => {
                updateElement(id, patch, history);
            });
        } else if (target.type === 'canvas') {
            if (key === 'theme') setTheme(value as 'light' | 'dark' | 'focus' | 'system');
            else if (key === 'canvasBackgroundColor') setCanvasBackgroundColor(value);
            else if (key === 'gridEnabled') updateGridSettings({ enabled: value });
            else if (key === 'snapToGrid') updateGridSettings({ snapToGrid: value });
            else if (key === 'gridStyle') setGridStyle(value);
            else if (key === 'gridColor') updateGridSettings({ gridColor: value });
            else if (key === 'gridOpacity') updateGridSettings({ gridOpacity: value });
            else if (key === 'objectSnapping') updateGridSettings({ objectSnapping: value });
            else if (key === 'maxLayers') setMaxLayers(parseInt(value));
            else if (key === 'canvasTexture') setCanvasTexture(value);
            else if (key === 'renderStyle') updateGlobalSettings({ renderStyle: value });
            else if (key === 'showQuickToolbar') updateGlobalSettings({ showQuickToolbar: value });
            else if (key === 'colorPalette') updateGlobalSettings({ colorPalette: value });
            else if (key === 'docType') setDocType(value);
        } else if (target.type === 'slide') {
            const slideIndex = store.activeSlideIndex;
            if (key === 'pageSizePreset') {
                const preset = getPagePreset(value);
                if (preset) setPageSize(preset.width, preset.height);
                return;
            }
            if (key === 'pageWidth' || key === 'pageHeight') {
                const dims = store.slides[slideIndex]?.dimensions;
                if (!dims) return;
                const w = key === 'pageWidth' ? Number(value) : dims.width;
                const h = key === 'pageHeight' ? Number(value) : dims.height;
                if (Number.isFinite(w) && Number.isFinite(h)) setPageSize(w, h);
                return;
            }
            if (key === 'transitionType') updateSlideTransition(slideIndex, { type: value });
            else if (key === 'transitionDuration') updateSlideTransition(slideIndex, { duration: value });
            else if (key === 'transitionEasing') updateSlideTransition(slideIndex, { easing: value });
            else if (key === 'backgroundColor') updateSlideBackground(slideIndex, { backgroundColor: value });
            else if (key === 'fillStyle') updateSlideBackground(slideIndex, { fillStyle: value });
            else if (key === 'backgroundImage') updateSlideBackground(slideIndex, { backgroundImage: value });
            else if (key === 'backgroundOpacity') updateSlideBackground(slideIndex, { backgroundOpacity: value });
            else if (key === 'gradientStops') updateSlideBackground(slideIndex, { gradientStops: value });
            else if (key === 'gradientDirection') updateSlideBackground(slideIndex, { gradientDirection: value });
        } else if (target.type === 'eraser') {
            if (key === 'eraserWidth') setEraserWidth(Number(finalValue));
        } else if (key === 'penStabilization') {
            // Global setting, surfaced as a 0–100% slider in the brush panel.
            updateGlobalSettings({ penStabilization: Math.min(1, Math.max(0, Number(finalValue) / 100)) });
        } else {
            updateDefaultStyles({ [key]: finalValue });
        }
    };

    const getPropertyValue = (prop: PropertyConfig) => {
        const target = activeTarget();
        if (!target) return undefined;

        if (target.type === 'canvas') {
            if (prop.key === 'theme') return store.theme;
            if (prop.key === 'canvasBackgroundColor') return store.canvasBackgroundColor;
            if (prop.key === 'gridEnabled') return store.gridSettings.enabled;
            if (prop.key === 'gridStyle') return store.gridSettings.style;
            if (['snapToGrid', 'gridColor', 'gridOpacity', 'objectSnapping'].includes(prop.key)) {
                return (store.gridSettings as any)[prop.key];
            }
            if (prop.key === 'maxLayers') return store.maxLayers;
            if (prop.key === 'renderStyle') return store.globalSettings.renderStyle;
            if (prop.key === 'showQuickToolbar') return store.globalSettings.showQuickToolbar;
            if (prop.key === 'colorPalette') return store.globalSettings.colorPalette ?? 'default';
            if (prop.key === 'docType') return store.docType;
            return (store as any)[prop.key];
        }
        if (target.type === 'slide') {
            const slide = target.data as Slide;
            if (prop.key === 'pageSizePreset') return findPagePreset(slide.dimensions.width, slide.dimensions.height)?.id || 'custom';
            if (prop.key === 'pageWidth') return slide.dimensions.width;
            if (prop.key === 'pageHeight') return slide.dimensions.height;
            if (prop.key === 'transitionType') return slide.transition?.type || 'none';
            if (prop.key === 'transitionDuration') return slide.transition?.duration || 500;
            if (prop.key === 'transitionEasing') return slide.transition?.easing || 'easeInOutQuad';
            if (prop.key === 'backgroundColor') return slide.backgroundColor || '#ffffff';
            if (prop.key === 'fillStyle') return slide.fillStyle || 'solid';
            if (prop.key === 'backgroundImage') return slide.backgroundImage || '';
            if (prop.key === 'backgroundOpacity') return slide.backgroundOpacity ?? 1;
            if (prop.key === 'gradientDirection') return slide.gradientDirection ?? 0;
            if (prop.key === 'gradientStops') return slide.gradientStops || [];
            return (slide as any)[prop.key];
        }
        if (target.type === 'multi') {
            const elements = store.selection
                .map(id => store.elements.find(e => e.id === id))
                .filter(Boolean) as DrawingElement[];
            if (elements.length === 0) return undefined;
            const firstVal = (elements[0] as any)[prop.key];
            const allSame = elements.every(e => {
                const v = (e as any)[prop.key];
                if (v === firstVal) return true;
                if (v == null && firstVal == null) return true;
                // Deep compare for arrays/objects
                if (typeof v === 'object' && typeof firstVal === 'object') {
                    return JSON.stringify(v) === JSON.stringify(firstVal);
                }
                return false;
            });
            if (!allSame) return MIXED_VALUE;
            if (prop.key === 'roundness') return !!firstVal;
            return firstVal;
        }
        if (target.type === 'element') {
            const val = (target.data as any)[prop.key];
            if (prop.key === 'roundness') return !!val; // Convert to boolean for toggle
            return val;
        }
        if (target.type === 'defaults') {
            if (prop.key === 'penStabilization') {
                // Global setting shown as 0–100%.
                return Math.round((store.globalSettings.penStabilization ?? 0) * 100);
            }
            const val = (store.defaultElementStyles as any)[prop.key];
            if (prop.key === 'roundness') return !!val;
            return val;
        }
        if (target.type === 'eraser') {
            if (prop.key === 'eraserWidth') {
                // Default to the current stroke width until the user sets it explicitly.
                return store.eraserWidth ?? store.defaultElementStyles.strokeWidth ?? prop.defaultValue;
            }
            return undefined;
        }
        return undefined;
    };

    const handleDelete = () => {
        if (store.selection.length > 0) {
            deleteElements(store.selection);
        }
    };

    // Helper to render a control based on config
    const renderControl = (prop: PropertyConfig) => {
        switch (prop.type) {
            case 'color': {
                const colorVal = () => getPropertyValue(prop);
                return (
                    <div>
                        <Show when={isMixed(colorVal())}>
                            <div class="mixed-badge">Mixed</div>
                        </Show>
                        <ColorControl
                            prop={prop}
                            value={isMixed(colorVal()) ? undefined : colorVal()}
                            onChange={(val) => handleChange(prop.key, val, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined, false)}
                        />
                    </div>
                );
            }
            case 'slider': {
                const sliderVal = () => getPropertyValue(prop);
                const sliderDisplay = () => isMixed(sliderVal()) ? prop.defaultValue : (sliderVal() ?? prop.defaultValue);
                return (
                    <div class="control-row">
                        <label>{prop.label}{isMixed(sliderVal()) ? <span class="mixed-label"> (Mixed)</span> : null}</label>
                        <div class="slider-group">
                            <div class="slider-wrapper">
                                <input
                                    type="range"
                                    min={prop.min} max={prop.max} step={prop.step}
                                    value={sliderDisplay()}
                                    onMouseDown={() => pushToHistory()}
                                    onInput={(e) => handleChange(prop.key, Number(e.currentTarget.value), activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined, false)}
                                />
                            </div>
                            <input
                                type="number"
                                class="precise-number-input"
                                min={prop.min} max={prop.max} step={prop.step}
                                value={isMixed(sliderVal()) ? '' : (sliderVal() ?? prop.defaultValue)}
                                placeholder={isMixed(sliderVal()) ? '—' : undefined}
                                onFocus={() => pushToHistory()}
                                onInput={(e) => {
                                    // Allow the field to be cleared/edited: empty or partial (e.g. "-", ".")
                                    // input must NOT commit — otherwise Number('')=0 snaps the value (and a
                                    // clamped field like font-size jumps to its min) mid-edit.
                                    const raw = e.currentTarget.value;
                                    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') return;
                                    const n = Number(raw);
                                    if (!Number.isFinite(n)) return;
                                    handleChange(prop.key, n, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined, false);
                                }}
                                onBlur={(e) => {
                                    // On blur, resync an empty/invalid field back to the current value so it
                                    // never shows a stale/blank box.
                                    const raw = e.currentTarget.value;
                                    if (raw === '' || !Number.isFinite(Number(raw))) {
                                        const v = sliderVal();
                                        e.currentTarget.value = String(isMixed(v) ? '' : (v ?? prop.defaultValue));
                                    }
                                }}
                            />
                        </div>
                    </div>
                );
            }
            case 'select': {
                const isFontPicker = prop.key === 'fontFamily';
                // Read target fresh in reactive/handler contexts to avoid stale closures
                const filteredOptions = () => {
                    const target = activeTarget();
                    const elType = target?.type === 'element' ? target.data?.type
                        : target?.type === 'slide' ? 'slide'
                        : target?.type === 'canvas' ? 'canvas' : undefined;
                    const base = prop.options?.filter(o =>
                        !o.excludeFrom || !elType || !o.excludeFrom.includes(elType as any)
                    ) ?? [];
                    // The font picker also lists any user-added custom fonts.
                    return isFontPicker ? [...base, ...customFontOptions()] : base;
                };
                const selectVal = () => getPropertyValue(prop);
                let fontFileInput: HTMLInputElement | undefined;
                const applyVal = (val: string) => {
                    const target = activeTarget();
                    const isNum = prop.options?.some(o => typeof o.value === 'number');
                    handleChange(prop.key, isNum ? Number(val) : val, target?.type, target?.type === 'element' ? target?.data?.id : undefined);
                };
                return (
                    <div class="control-row">
                        <label>{prop.label}</label>
                        <Show when={isFontPicker} fallback={
                            <select
                                value={isMixed(selectVal()) ? '__mixed__' : (selectVal() ?? prop.defaultValue)}
                                onChange={(e) => {
                                    const val = e.currentTarget.value;
                                    if (val === '__mixed__') return;
                                    applyVal(val);
                                }}
                            >
                                <Show when={isMixed(selectVal())}>
                                    <option value="__mixed__" disabled>(Mixed)</option>
                                </Show>
                                <For each={filteredOptions()}>
                                    {(opt) => <option value={opt.value ?? ''}>{opt.label}</option>}
                                </For>
                            </select>
                        }>
                            {/* The font list grows with user-added Google fonts; a native
                                select popup can spill off-screen, so fonts get a custom
                                viewport-clamped, searchable dropdown. */}
                            <FontPicker
                                options={filteredOptions() as { label: string; value: string | number }[]}
                                value={isMixed(selectVal()) ? '__mixed__' : String(selectVal() ?? prop.defaultValue ?? '')}
                                onPick={applyVal}
                                onGoogleFonts={() => setGoogleFontsOpen(true)}
                                onAddFont={() => fontFileInput?.click()}
                            />
                            <input ref={el => fontFileInput = el} type="file" accept=".ttf,.otf,.woff,.woff2"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const input = e.currentTarget; const file = input.files?.[0]; input.value = '';
                                    if (!file) return;
                                    const font = await addCustomFontFromFile(file);
                                    applyVal(font.key);
                                }} />
                        </Show>
                    </div>
                );
            }
            case 'toggle': {
                // Disable bold/italic toggles when font doesn't support them
                const isFontToggle = prop.key === 'fontWeight' || prop.key === 'fontStyle';
                const isDisabled = () => {
                    if (!isFontToggle) return false;
                    const fontProp = { ...prop, key: 'fontFamily' } as PropertyConfig;
                    const font = getPropertyValue(fontProp) || 'hand-drawn';
                    const caps = fontCapabilities[font as string];
                    if (!caps) return false;
                    return prop.key === 'fontWeight' ? !caps.bold : !caps.italic;
                };
                const toggleVal = () => getPropertyValue(prop);
                return (
                    <div class="control-row" style={{ opacity: isDisabled() ? 0.4 : 1 }}>
                        <label>{prop.label}{isMixed(toggleVal()) ? <span class="mixed-label"> (Mixed)</span> : null}</label>
                        <input
                            type="checkbox"
                            checked={isMixed(toggleVal()) ? false : !!toggleVal()}
                            ref={(el) => { if (isMixed(toggleVal())) el.indeterminate = true; }}
                            disabled={isDisabled()}
                            title={isDisabled() ? 'This font does not support ' + prop.label.toLowerCase() : isMixed(toggleVal()) ? 'Mixed values — click to set all' : ''}
                            onChange={(e) => handleChange(prop.key, e.currentTarget.checked, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined)}
                        />
                    </div>
                );
            }
            case 'input': {
                const inputVal = () => getPropertyValue(prop);
                return (
                    <div class="control-row">
                        <label>{prop.label}</label>
                        <input
                            type="text"
                            value={isMixed(inputVal()) ? '' : (inputVal() || '')}
                            placeholder={isMixed(inputVal()) ? '(Mixed)' : undefined}
                            onInput={(e) => handleChange(prop.key, e.currentTarget.value, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined)}
                        />
                    </div>
                );
            }
            case 'textarea': {
                const elType = activeTarget()?.type === 'element' ? (activeTarget()?.data as any)?.type : undefined;
                const isUmlField = elType && (
                    (prop.key === 'attributesText' && (elType === 'umlClass' || elType === 'umlEnum'))
                    || (prop.key === 'methodsText' && (elType === 'umlClass' || elType === 'umlInterface'))
                );
                const textareaVal = () => getPropertyValue(prop);

                const appendLine = (line: string) => {
                    const current = (getPropertyValue(prop) || '') as string;
                    const newVal = current ? current + '\n' + line : line;
                    handleChange(prop.key, newVal, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined);
                };

                return (
                    <div class="control-col">
                        <div style={{ display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' }}>
                            <label>{prop.label}</label>
                            <Show when={isUmlField}>
                                <UmlAddMenu
                                    section={prop.key as 'attributesText' | 'methodsText'}
                                    onAdd={appendLine}
                                />
                            </Show>
                        </div>
                        <div class="textarea-wrapper">
                            <textarea
                                value={isMixed(textareaVal()) ? '' : (textareaVal() || '')}
                                placeholder={isMixed(textareaVal()) ? '(Mixed values)' : undefined}
                                onInput={(e) => handleChange(prop.key, e.currentTarget.value, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined)}
                                onKeyDown={(e) => e.stopPropagation()}
                                rows={3}
                            />
                        </div>
                    </div>
                );
            }
            case 'image-upload': {
                const imgVal = () => (getPropertyValue(prop) as string) || '';
                const commit = (val: string) =>
                    handleChange(prop.key, val, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined);
                const onFile = (e: Event) => {
                    const input = e.currentTarget as HTMLInputElement;
                    const file = input.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => { if (typeof reader.result === 'string') commit(reader.result); };
                    reader.readAsDataURL(file);
                    input.value = ''; // allow re-selecting the same file
                };
                return (
                    <div class="control-col">
                        <label>{prop.label}</label>
                        <Show when={imgVal()}>
                            <div class="image-fill-preview" style={{ 'background-image': `url("${imgVal()}")` }} />
                        </Show>
                        <div class="image-fill-actions">
                            <label class="image-fill-upload-btn">
                                {imgVal() ? 'Replace' : 'Upload'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={onFile}
                                />
                            </label>
                            <Show when={imgVal()}>
                                <button class="image-fill-remove-btn" onClick={() => commit('')}>Remove</button>
                            </Show>
                        </div>
                        <input
                            type="text"
                            class="image-fill-url"
                            placeholder="…or paste an image URL"
                            value={imgVal().startsWith('data:') ? '' : imgVal()}
                            onInput={(e) => commit(e.currentTarget.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </div>
                );
            }
            case 'number': {
                const numVal = () => getPropertyValue(prop);
                return (
                    <div class="control-row">
                        <label>{prop.label}</label>
                        <MathNumberInput
                            value={isMixed(numVal()) ? undefined : (numVal() ?? 0)}
                            min={prop.min}
                            max={prop.max}
                            step={prop.step}
                            onEditStart={() => pushToHistory()}
                            onCommit={(n) => handleChange(prop.key, n, activeTarget()?.type, activeTarget()?.type === 'element' ? activeTarget()?.data?.id : undefined, false)}
                        />
                    </div>
                );
            }
            default:
                return null;
        }
    };


    // Group properties
    // Google Fonts browse dialog (opened from the font picker).
    const [googleFontsOpen, setGoogleFontsOpen] = createSignal(false);
    const applyFontKey = (fontKey: string) => {
        const target = activeTarget();
        handleChange('fontFamily', fontKey, target?.type, target?.type === 'element' ? target?.data?.id : undefined);
    };

    // Property search: filter the visible controls by label / key / group.
    const [propSearch, setPropSearch] = createSignal('');
    const isSearching = () => propSearch().trim().length > 0;

    const groupedProperties = createMemo(() => {
        const q = propSearch().trim().toLowerCase();
        const groups: Record<string, PropertyConfig[]> = {};
        activeProperties().forEach(p => {
            if (q) {
                const hay = `${p.label} ${p.key} ${p.group}`.toLowerCase();
                if (!hay.includes(q)) return;
            }
            if (!groups[p.group]) groups[p.group] = [];
            groups[p.group].push(p);
        });
        return groups;
    });

    // Derived memos for activeTarget to avoid repeated calls in Show conditions
    const targetType = createMemo(() => activeTarget()?.type);
    const targetData = createMemo(() => {
        const t = activeTarget();
        return t?.type === 'element' ? t.data : null;
    });
    const targetElementId = createMemo(() => targetData()?.id ?? '');
    const isElement = createMemo(() => targetType() === 'element');
    const isMulti = createMemo(() => targetType() === 'multi');
    const isElementOrMulti = createMemo(() => isElement() || isMulti());

    // Collapsible groups
    const [collapsedGroups, setCollapsedGroups] = createSignal<Set<string>>(
        new Set(readJsonArray<string>('collapsed-prop-groups'))
    );
    const toggleGroup = (group: string) => {
        const next = new Set(collapsedGroups());
        next.has(group) ? next.delete(group) : next.add(group);
        setCollapsedGroups(next);
        localStorage.setItem('collapsed-prop-groups', JSON.stringify([...next]));
    };

    // Preserve scroll position across selection changes
    let contentRef: HTMLDivElement | undefined;
    let savedScrollTop = 0;
    const handleContentScroll = () => {
        if (contentRef) savedScrollTop = contentRef.scrollTop;
    };
    createEffect(() => {
        // Track selection changes
        store.selection.length;
        store.selection[0];
        // Restore scroll position after DOM updates
        requestAnimationFrame(() => {
            if (contentRef) {
                contentRef.scrollTop = savedScrollTop;
            }
        });
    });

    return (
        <Show when={store.showPropertyPanel && (activeTarget() || store.isPropertyPanelMinimized)}>
            <div
                class="property-panel-container"
                classList={{ minimized: store.isPropertyPanelMinimized }}
                ref={draggablePanel('.panel-header')}
            >
                <Show when={activeTarget() || store.isPropertyPanelMinimized} fallback={<div class="property-panel empty"><div class="panel-header"><h3>Properties</h3></div><div class="panel-content">No Selection</div></div>}>
                    <div class="property-panel">
                        <div class="panel-header">
                            <div style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
                                <button
                                    class="minimize-btn burger-menu"
                                    onClick={() => minimizePropertyPanel()}
                                    title={store.isPropertyPanelMinimized ? "Expand" : "Collapse"}
                                >
                                    <Menu size={18} />
                                </button>
                                <Show when={!store.isPropertyPanelMinimized}>
                                    <div style={{ display: 'flex', 'flex-direction': 'column', gap: '2px' }}>
                                        <h3 style={{ 'line-height': '1' }}>{targetType() === 'element' ? 'Properties' : targetType() === 'canvas' ? 'Canvas' : targetType() === 'slide' ? `${pageNoun()} ${store.activeSlideIndex + 1}` : targetType() === 'multi' ? `Selection (${store.selection.length})` : targetType() === 'defaults' ? 'Defaults' : 'Properties'}</h3>
                                        <div
                                            class="mode-badge"
                                            classList={{ [store.appMode]: true }}
                                            style={{ 'width': 'fit-content' }}
                                        >
                                            {store.appMode}
                                        </div>
                                    </div>
                                </Show>
                            </div>

                            <div class="header-actions">
                                <Show when={isElementOrMulti() && !store.isPropertyPanelMinimized}>
                                    <Show when={isElement()}>
                                        <button onClick={() => duplicateElement(targetElementId())} title="Duplicate">
                                            <Copy size={16} />
                                        </button>
                                    </Show>
                                    <button class="delete-btn" onClick={handleDelete} title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                    <div class="vertical-separator"></div>
                                </Show>

                                <button class="close-btn" onClick={() => togglePropertyPanel(false)} title="Close">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <Show when={!store.isPropertyPanelMinimized}>
                            <div class="property-content" ref={contentRef} onScroll={handleContentScroll}>
                                <Show when={isMulti()}>
                                    <AlignmentControls />
                                    <div class="multi-select-summary">
                                        {(() => {
                                            const typeCounts: Record<string, number> = {};
                                            store.selection.forEach(id => {
                                                const el = store.elements.find(e => e.id === id);
                                                if (el) typeCounts[el.type] = (typeCounts[el.type] || 0) + 1;
                                            });
                                            const entries = Object.entries(typeCounts);
                                            if (entries.length <= 3) {
                                                return entries.map(([t, c]) => `${c} ${t}`).join(', ');
                                            }
                                            return `${store.selection.length} elements (${entries.length} types)`;
                                        })()}
                                    </div>
                                </Show>
                                <Show when={isElement()}>
                                    <MindmapActions elementId={targetElementId()} />
                                    <StickFaceActions />
                                    <ImagePixelEffectActions elementId={targetElementId()} />
                                    <VideoActions elementId={targetElementId()} />
                                    <TransformControls elementId={targetElementId()} />
                                    <StrokeDashControls elementId={targetElementId()} />
                                </Show>
                                <Show when={targetType() === 'slide'}>
                                    <SlideActions />
                                </Show>

                                {/* Element ID (Read-only) */}
                                <Show when={isElement()}>
                                    <div class="property-group">
                                        <div class="group-title">GENERAL</div>
                                        <div class="control-row">
                                            <label>ID</label>
                                            <div style={{ display: 'flex', 'align-items': 'center', gap: '4px', 'flex': 1 }}>
                                                <input
                                                    type="text"
                                                    value={targetElementId()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            renameElement(targetElementId(), e.currentTarget.value);
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const newId = e.currentTarget.value;
                                                        if (newId !== targetElementId()) {
                                                            renameElement(targetElementId(), newId);
                                                        }
                                                    }}
                                                    title="Edit ID (Press Enter to save)"
                                                    style={{
                                                        'font-family': 'monospace',
                                                        'font-size': '10px',
                                                        'background': 'var(--bg-secondary)',
                                                        'cursor': 'text',
                                                        'text-overflow': 'ellipsis',
                                                        'width': '100%'
                                                    }}
                                                />
                                                <button
                                                    class="icon-btn small"
                                                    title="Copy ID"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(targetElementId());
                                                        showToast("ID Copied to clipboard", "success");
                                                    }}
                                                >
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Show>
                                <Show when={targetType() === 'canvas' && !isPagedDocType(store.docType)}>
                                    <div class="property-group">
                                        <div class="group-title">CANVAS THEME</div>
                                        <div class="canvas-theme-grid">
                                            <For each={CANVAS_THEMES}>
                                                {(theme) => {
                                                    const active = () => matchCanvasTheme(store.canvasBackgroundColor, store.canvasTexture)?.id === theme.id;
                                                    const dark = () => { const c = theme.background.replace('#', ''); const h = c.length === 3 ? c.split('').map(x => x + x).join('') : c; const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5; };
                                                    const ink = () => dark() ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)';
                                                    const pattern = () => {
                                                        if (theme.texture === 'dots') return { 'background-image': `radial-gradient(${ink()} 1px, transparent 1px)`, 'background-size': '7px 7px' };
                                                        if (theme.texture === 'grid' || theme.texture === 'graph') return { 'background-image': `linear-gradient(${ink()} 1px, transparent 1px), linear-gradient(90deg, ${ink()} 1px, transparent 1px)`, 'background-size': '7px 7px' };
                                                        if (theme.texture === 'notebook') return { 'background-image': `linear-gradient(${ink()} 1px, transparent 1px)`, 'background-size': '100% 7px' };
                                                        return {};
                                                    };
                                                    return (
                                                        <button
                                                            class="canvas-theme-chip"
                                                            classList={{ active: active() }}
                                                            title={theme.name}
                                                            onClick={() => { setCanvasBackgroundColor(theme.background); setCanvasTexture(theme.texture); }}
                                                        >
                                                            <span class="canvas-theme-preview" style={{ background: theme.background, ...pattern() }} />
                                                            <span class="canvas-theme-name">{theme.name}</span>
                                                        </button>
                                                    );
                                                }}
                                            </For>
                                        </div>
                                        <div class="control-row" style={{ "margin-top": "10px" }}>
                                            <label>Texture</label>
                                            <select value={store.canvasTexture} onChange={(e) => setCanvasTexture(e.currentTarget.value as any)}>
                                                <option value="none">None</option>
                                                <option value="dots">Dots</option>
                                                <option value="grid">Grid</option>
                                                <option value="graph">Graph Paper</option>
                                                <option value="paper">Recycled Paper</option>
                                                <option value="notebook">Notebook</option>
                                            </select>
                                        </div>
                                        <div class="group-title" style={{ "margin-top": "6px", opacity: 0.6, "font-weight": "normal", "font-style": "italic" }}>Theme sets background + texture; tweak either here or in Background below.</div>
                                    </div>
                                </Show>
                                <Show when={activeProperties().length > 0}>
                                    <div class="property-search">
                                        <input
                                            type="text"
                                            placeholder="Search properties…"
                                            value={propSearch()}
                                            onInput={(e) => setPropSearch(e.currentTarget.value)}
                                            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') setPropSearch(''); }}
                                        />
                                        <Show when={isSearching()}>
                                            <button class="property-search-clear" title="Clear" onClick={() => setPropSearch('')}>×</button>
                                        </Show>
                                    </div>
                                    <Show when={Object.keys(groupedProperties()).length === 0}>
                                        <div class="property-search-empty">No properties match “{propSearch()}”.</div>
                                    </Show>
                                </Show>
                                <For each={Object.keys(groupedProperties())}>
                                    {(group) => (
                                        <div class="property-group">
                                            <div class="group-title" onClick={() => toggleGroup(group)}>
                                                <span>{group.toUpperCase()}</span>
                                                <span class="group-chevron">{(isSearching() || !collapsedGroups().has(group)) ? '\u25BE' : '\u25B8'}</span>
                                            </div>
                                            <Show when={isSearching() || !collapsedGroups().has(group)}>
                                                <Show when={group === 'gradient' && (() => {
                                                    const target = activeTarget();
                                                    if (!target) return false;

                                                    // Get fillStyle from target
                                                    let fillStyle: string | undefined;
                                                    if (target.type === 'element') {
                                                        fillStyle = target.data.fillStyle;
                                                    } else if (target.type === 'multi') {
                                                        const firstId = store.selection[0];
                                                        const el = store.elements.find(e => e.id === firstId);
                                                        fillStyle = el?.fillStyle;
                                                    } else if (target.type === 'slide') {
                                                        fillStyle = (target.data as Slide).fillStyle;
                                                    }

                                                    // Only show gradient editor for gradient fill styles
                                                    return ['linear', 'radial', 'conic'].includes(fillStyle || '');
                                                })()}>
                                                    <GradientEditor
                                                        target={activeTarget()}
                                                        onChange={handleChange}
                                                    />
                                                </Show>
                                                <For each={groupedProperties()[group]}>
                                                    {(prop) => {
                                                        if (group === 'gradient' && (prop.key === 'gradientStart' || prop.key === 'gradientEnd')) return null;
                                                        return renderControl(prop);
                                                    }}
                                                </For>
                                                {/* Appearance stack (extra fills/strokes) sits right under the basic
                                                    Fill so the two fill controls are adjacent. */}
                                                <Show when={group === 'background' && isElement() && targetData()}>
                                                    <AppearanceEditor el={() => targetData()} />
                                                </Show>
                                                {/* Crop button for image elements in filter group */}
                                                <Show when={group === 'filter' && (() => {
                                                    const target = activeTarget();
                                                    if (!target) return false;
                                                    if (target.type === 'element') return target.data.type === 'image';
                                                    return false;
                                                })()}>
                                                    <div class="control-row" style={{ "margin-top": "8px", gap: "6px" }}>
                                                        <button
                                                            style={{
                                                                flex: "1",
                                                                "font-size": "12px",
                                                                padding: "6px 12px",
                                                                background: "var(--bg-secondary)",
                                                                border: "1px solid var(--border-color)",
                                                                "border-radius": "4px",
                                                                color: "var(--text-primary)",
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() => {
                                                                const target = activeTarget();
                                                                if (target?.type === 'element') {
                                                                    enterCropMode(target.data.id!);
                                                                }
                                                            }}
                                                            title="Crop image (Enter to apply, Escape to cancel)"
                                                        >
                                                            Crop Image
                                                        </button>
                                                        <Show when={(() => {
                                                            const target = activeTarget();
                                                            if (target?.type === 'element') return !!target.data.crop;
                                                            return false;
                                                        })()}>
                                                            <button
                                                                style={{
                                                                    flex: "1",
                                                                    "font-size": "12px",
                                                                    padding: "6px 12px",
                                                                    background: "var(--bg-secondary)",
                                                                    border: "1px solid var(--border-color)",
                                                                    "border-radius": "4px",
                                                                    color: "var(--text-secondary)",
                                                                    cursor: "pointer",
                                                                }}
                                                                onClick={() => {
                                                                    const target = activeTarget();
                                                                    if (target?.type === 'element') {
                                                                        resetCrop(target.data.id!);
                                                                    }
                                                                }}
                                                                title="Remove crop and show full image"
                                                            >
                                                                Reset Crop
                                                            </button>
                                                        </Show>
                                                    </div>
                                                    {/* Aspect-ratio presets — visible while crop mode is active */}
                                                    <Show when={(() => {
                                                        const target = activeTarget();
                                                        return target?.type === 'element' && store.cropModeElementId === target.data.id;
                                                    })()}>
                                                        <div class="control-row" style={{ "margin-top": "6px", gap: "4px", "flex-wrap": "wrap" }}>
                                                            <For each={[
                                                                { label: 'Free', ratio: null as number | null },
                                                                { label: '1:1', ratio: 1 },
                                                                { label: '4:5', ratio: 4 / 5 },
                                                                { label: '3:4', ratio: 3 / 4 },
                                                                { label: '16:9', ratio: 16 / 9 },
                                                                { label: '9:16', ratio: 9 / 16 },
                                                            ]}>
                                                                {(opt) => (
                                                                    <button
                                                                        style={{
                                                                            flex: "1",
                                                                            "min-width": "38px",
                                                                            "font-size": "11px",
                                                                            padding: "4px 6px",
                                                                            background: store.cropAspect === opt.ratio ? "var(--accent-color, #6366f1)" : "var(--bg-secondary)",
                                                                            border: "1px solid var(--border-color)",
                                                                            "border-radius": "4px",
                                                                            color: store.cropAspect === opt.ratio ? "#fff" : "var(--text-primary)",
                                                                            cursor: "pointer",
                                                                        }}
                                                                        title={opt.ratio === null ? 'Freeform crop' : `Lock crop to ${opt.label}`}
                                                                        onClick={() => setCropAspect(opt.ratio)}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                )}
                                                            </For>
                                                        </div>
                                                    </Show>
                                                </Show>
                                            </Show>
                                        </div>
                                    )}
                                </For>

                                {/* Fallback: elements without a Background group still get the
                                    Appearance stack (it renders adjacent to Fill otherwise). */}
                                <Show when={isElement() && targetData() && !groupedProperties()['background'] && !isSearching()}>
                                    <AppearanceEditor el={() => targetData()} />
                                </Show>

                                {/* Google Fonts browse dialog (opened from the Font picker) */}
                                <GoogleFontsDialog
                                    isOpen={googleFontsOpen()}
                                    onClose={() => setGoogleFontsOpen(false)}
                                    onPick={applyFontKey}
                                />

                                {/* Gradient-mesh node editor (self-gating: only when a mesh fill is set) */}
                                <Show when={isElement() && targetData()}>
                                    <MeshEditor el={() => targetData()} />
                                </Show>

                                {/* Vector pattern editor (self-gating: only when a pattern fill is set) */}
                                <Show when={isElement() && targetData()}>
                                    <PatternEditor el={() => targetData()} />
                                </Show>

                                {/* Warp-preset editor (self-gating: only when a preset warp is set) */}
                                <Show when={isElement() && targetData()}>
                                    <WarpPresetEditor el={() => targetData()} />
                                </Show>

                                {/* Live Transform effect editor (Add button when absent; controls when present) */}
                                <Show when={isElement() && targetData()}>
                                    <TransformEffectEditor el={() => targetData()} />
                                </Show>

                                {/* Live 3D Extrude editor (Add button when absent; controls when present) */}
                                <Show when={isElement() && targetData()}>
                                    <ExtrudeEditor el={() => targetData()} />
                                </Show>

                                {/* Live Turntable editor — self-gating: shows only for turntable-
                                    capable shapes, and turns a multi-selection into one group rig. */}
                                <Show when={isElementOrMulti()}>
                                    <TurntableEditor />
                                </Show>

                                {/* Glow & Feather live sliders */}
                                <Show when={isElement() && targetData()}>
                                    <GlowFeatherEditor el={() => targetData()} />
                                </Show>

                                {/* Layers for elements */}
                                <Show when={isElementOrMulti()}>
                                    <div class="property-group">
                                        <div class="group-title">LAYERS</div>

                                        {/* Layer Selection Dropdown */}
                                        <div class="control-row">
                                            <label>Layer</label>
                                            <select
                                                value={(() => {
                                                    if (isElement()) {
                                                        return targetData()?.layerId ?? '';
                                                    }
                                                    if (isMulti()) {
                                                        // Check if all have same layer
                                                        const ids = store.selection;
                                                        const elements = store.elements.filter(e => ids.includes(e.id));
                                                        const firstLayer = elements[0]?.layerId;
                                                        const allSame = elements.every(e => e.layerId === firstLayer);
                                                        return allSame ? firstLayer : "";
                                                    }
                                                    return "";
                                                })()}
                                                onChange={(e) => {
                                                    const targetLayerId = e.currentTarget.value;
                                                    if (!targetLayerId) return;

                                                    if (isElement()) {
                                                        updateElement(targetElementId(), { layerId: targetLayerId }, true);
                                                    } else if (isMulti()) {
                                                        moveElementsToLayer(store.selection, targetLayerId);
                                                    }
                                                }}
                                            >
                                                <Show when={isMulti() &&
                                                    !store.elements.filter(e => store.selection.includes(e.id))
                                                        .every((e, _, arr) => e.layerId === arr[0].layerId)}>
                                                    <option value="">(Mixed)</option>
                                                </Show>
                                                <For each={store.layers}>
                                                    {(layer) => (
                                                        <option value={layer.id}>
                                                            {layer.name}
                                                            {!layer.visible ? ' (hidden)' : ''}
                                                            {layer.locked ? ' (locked)' : ''}
                                                        </option>
                                                    )}
                                                </For>
                                            </select>
                                        </div>

                                        {/* Z-Index Controls - Only for single selection or if we want to implement multi-z moves later */}
                                        <Show when={isElement()}>
                                            <div class="control-row">
                                                <label>Z-Order</label>
                                            </div>
                                            <div class="layer-controls">
                                                <button onClick={() => moveElementZIndex(targetElementId(), 'front')} title="To Front"><ChevronsUp size={16} /></button>
                                                <button onClick={() => moveElementZIndex(targetElementId(), 'forward')} title="Forward"><ChevronUp size={16} /></button>
                                                <button onClick={() => moveElementZIndex(targetElementId(), 'backward')} title="Backward"><ChevronDown size={16} /></button>
                                                <button onClick={() => moveElementZIndex(targetElementId(), 'back')} title="To Back"><ChevronsDown size={16} /></button>
                                            </div>
                                        </Show>
                                    </div>
                                </Show>

                                {/* Animation Section - for single element or multi-selection */}
                                <Show when={isElementOrMulti()}>
                                    <div class="property-group">
                                        <AnimationPanel />
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </div>
                </Show>
            </div>
        </Show>
    );
};

export default PropertyPanel;
