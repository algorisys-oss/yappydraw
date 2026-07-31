/**
 * Quick Toolbar - Floating toolbar above selected elements.
 * Shows shape-specific quick property controls + mindmap actions (when applicable).
 * Refactored from mindmap-action-toolbar.tsx.
 */

import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { store, updateElement, pushToHistory, applyMindmapStyling } from "../store/app-store";
import { getElementPreviewBaseState, isElementAnimating } from "../utils/animation/element-animator";
import { replaceImageOn } from "../utils/image-actions";
import { Palette, SlidersHorizontal, Image as ImageIcon, Type } from "lucide-solid";
import { getElementFamily, getQuickPropertiesForType, type QuickPropertyDef } from "../config/quick-toolbar-config";
import { getImageFilterPreset } from "../config/image-filter-presets";
// The controls themselves are shared with the tool-options bar (which binds them to
// `defaultElementStyles` instead of an element) — see components/quick-controls.tsx.
import { QuickControl } from "./quick-controls";
import { plainTextToSpans, spansToPlainText } from "../utils/rich-text-utils";
import { worldToScreen } from "../utils/viewport-transforms";
import { dockInsets } from "../utils/dock-layout";
import "./quick-toolbar.css";

// ============ Main Component ============

export const QuickToolbar: Component = () => {
    const [activePopover, setActivePopover] = createSignal<string | null>(null);
    const [isExpanded, setIsExpanded] = createSignal(false);

    const selectedElement = () => {
        if (store.selection.length !== 1) return null;
        return store.elements.find(e => e.id === store.selection[0]);
    };

    const isMindmapNode = createMemo(() => {
        const el = selectedElement();
        if (!el) return false;
        const excludedTypes = ['line', 'arrow', 'image', 'fineliner', 'inkbrush', 'marker', 'bezier'];
        if (excludedTypes.includes(el.type)) return false;
        return true;
    });

    const shouldShowToolbar = createMemo(() => {
        const el = selectedElement();
        if (!el) return false;

        // Hide in presentation/zen modes
        if (store.appMode === 'presentation') return false;
        if (store.zenMode) return false;

        // Hide while the canvas is rotated: the toolbar's placement logic assumes
        // an axis-aligned screen bbox, which doesn't hold under view rotation.
        // Returns automatically once rotation snaps back to upright (Shift+0).
        if (store.viewState.rotation) return false;

        // Respect user toggle
        if (!store.globalSettings.showQuickToolbar) return false;

        // Hide if element is currently animating
        if (isElementAnimating(el.id)) return false;

        // Show for any element with a recognized family
        const family = getElementFamily(el.type);
        return family !== null;
    });

    const quickProps = createMemo(() => {
        const el = selectedElement();
        if (!el) return [];
        return getQuickPropertiesForType(el.type);
    });

    // Collapse when selection changes
    createEffect(() => {
        store.selection[0]; // track selection
        setIsExpanded(false);
        setActivePopover(null);
    });

    return (
        <Show when={shouldShowToolbar()}>
            <ToolbarContainer
                quickProps={quickProps}
                isMindmapNode={isMindmapNode}
                activePopover={activePopover}
                setActivePopover={setActivePopover}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />
        </Show>
    );
};

const ToolbarContainer: Component<{
    quickProps: () => QuickPropertyDef[];
    isMindmapNode: () => boolean;
    activePopover: () => string | null;
    setActivePopover: (key: string | null) => void;
    isExpanded: () => boolean;
    setIsExpanded: (v: boolean) => void;
}> = (props) => {
    const element = createMemo(() => {
        if (store.selection.length !== 1) return null;
        return store.elements.find(e => e.id === store.selection[0]);
    });

    // While a slider (e.g. Font Size) is dragged, editing font size live-resizes a
    // text element's box. The floating toolbar anchors to the element's world
    // width/position, so it would jitter every frame. Freeze the world-space anchor
    // for the duration of the drag (pan/zoom still track — we freeze world coords,
    // not screen). Cleared on pointer/touch release.
    const [posFreeze, setPosFreeze] = createSignal<{ x: number; y: number; width: number } | null>(null);

    let containerRef: HTMLDivElement | undefined;

    // Click outside collapses the expanded toolbar
    createEffect(() => {
        if (props.isExpanded()) {
            const handler = (e: MouseEvent) => {
                if (containerRef && !containerRef.contains(e.target as Node)) {
                    props.setIsExpanded(false);
                    props.setActivePopover(null);
                }
            };
            const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 0);
            onCleanup(() => {
                clearTimeout(timer);
                document.removeEventListener('pointerdown', handler);
            });
        }
    });

    const handlePropertyChange = (key: string, value: any) => {
        // Read selection ID directly from store to avoid any stale memo issues
        const selId = store.selection.length === 1 ? store.selection[0] : null;
        const el = selId ? store.elements.find(e => e.id === selId) : null;
        if (!el) return;
        const id = el.id;
        // Sync lane arrays when lane count changes
        if (el.type === 'bpmnPool' && key === 'bpmnLaneCount') {
            const newCount = Number(value);
            const oldLabels = el.bpmnLaneLabels ?? [];
            const oldColors = el.bpmnLaneColors ?? [];
            const oldTextColors = el.bpmnLaneTextColors ?? [];
            const newLabels = Array.from({ length: newCount }, (_, i) => oldLabels[i] ?? `Lane ${i + 1}`);
            const newColors = Array.from({ length: newCount }, (_, i) => oldColors[i] ?? '');
            const newTextColors = Array.from({ length: newCount }, (_, i) => oldTextColors[i] ?? '');
            updateElement(id, { bpmnLaneCount: newCount, bpmnLaneLabels: newLabels, bpmnLaneColors: newColors, bpmnLaneTextColors: newTextColors }, false);
            return;
        }
        // Image filter preset: apply all preset values at once
        if (key === 'filterPreset' && value !== 'custom') {
            const preset = getImageFilterPreset(value);
            if (preset) {
                updateElement(id, {
                    filterPreset: value,
                    filterBrightness: preset.values.filterBrightness ?? 100,
                    filterContrast: preset.values.filterContrast ?? 100,
                    filterSaturate: preset.values.filterSaturate ?? 100,
                    filterBlur: preset.values.filterBlur ?? 0,
                    filterHueRotate: preset.values.filterHueRotate ?? 0,
                    filterInvert: preset.values.filterInvert ?? 0,
                    filterSepia: preset.values.filterSepia ?? 0,
                }, false);
                return;
            }
        }
        // For text/richtext the visible font colour is `textColor || strokeColor`, so a
        // baked-in default textColor (from defaults) overrides strokeColor and the "Text
        // Color" swatch never changes anything. Set both, matching p3-color-picker.
        if (key === 'strokeColor' && (el.type === 'text' || el.type === 'richtext')) {
            updateElement(id, { strokeColor: value, textColor: value }, false);
            return;
        }
        updateElement(id, { [key]: value }, false);
    };

    const handlePropertyStart = () => {
        pushToHistory();
        // Freeze the toolbar anchor so a live box-resize (font-size drag) doesn't
        // make it jitter. Release on the next pointer/touch up.
        const el = element();
        if (el) {
            setPosFreeze({ x: el.x, y: el.y, width: el.width });
            const release = () => {
                setPosFreeze(null);
                window.removeEventListener('pointerup', release);
                window.removeEventListener('touchend', release);
                window.removeEventListener('mouseup', release);
            };
            window.addEventListener('pointerup', release);
            window.addEventListener('touchend', release);
            window.addEventListener('mouseup', release);
        }
    };

    return (
        <Show when={element()}>
            {(el) => {
                const x = () => {
                    const frozen = posFreeze();
                    const baseState = getElementPreviewBaseState(el().id);
                    const elX = frozen ? frozen.x : baseState ? baseState.x : el().x;
                    const elW = frozen ? frozen.width : baseState ? baseState.width : el().width;

                    if (props.isExpanded()) {
                        const toolbarWidth = containerRef?.offsetWidth ?? 300;
                        const base = worldToScreen(elX + elW / 2, 0, store.viewState).x - toolbarWidth / 2;

                        // Collision avoidance with the right dock (Properties and friends).
                        // Reads the live dock inset rather than a hard-coded 280: the user can
                        // resize the zone, and can dock other panels there too.
                        const rightDock = dockInsets().right;
                        if (rightDock > 0) {
                            const panelStart = window.innerWidth - rightDock;
                            const padding = 20;
                            if (base + toolbarWidth > panelStart - padding) {
                                return panelStart - toolbarWidth - padding;
                            }
                        }
                        return Math.max(base, 10);
                    }
                    // Collapsed: position at top-right of element (avoid rotate handle at center)
                    const iconSize = 32;
                    const base = worldToScreen(elX + elW, 0, store.viewState).x + 8;
                    return Math.min(Math.max(base, 10), window.innerWidth - iconSize - 10);
                };

                const y = () => {
                    const frozen = posFreeze();
                    const baseState = getElementPreviewBaseState(el().id);
                    const elY = frozen ? frozen.y : baseState ? baseState.y : el().y;
                    const toolbarHeight = props.isExpanded() ? 50 : 32;
                    const margin = props.isExpanded() ? 20 : 12;
                    const calculated = worldToScreen(0, elY, store.viewState).y - toolbarHeight - margin;
                    return Math.max(calculated, 60);
                };

                return (
                    <div
                        class="quick-toolbar"
                        ref={containerRef}
                        style={{
                            top: `${Math.round(y())}px`,
                            left: `${Math.round(x())}px`,
                        }}
                    >
                        <Show when={!props.isExpanded()} fallback={
                            <div class="quick-toolbar-content">
                                {/* Collapse button */}
                                <button
                                    class="qt-collapse-btn"
                                    onClick={() => { props.setIsExpanded(false); props.setActivePopover(null); }}
                                    title="Collapse toolbar"
                                >
                                    <SlidersHorizontal size={14} />
                                </button>

                                <div class="qt-divider" />

                                {/* Quick Property Controls */}
                                <Show when={props.quickProps().length > 0}>
                                    <div class="quick-props-section">
                                        <For each={props.quickProps()}>
                                            {(propDef) => (
                                                <QuickControl
                                                    def={propDef}
                                                    value={() => (el() as any)[propDef.key]}
                                                    fontFamily={() => (el() as any).fontFamily}
                                                    openKey={props.activePopover}
                                                    setOpenKey={props.setActivePopover}
                                                    onSlideStart={handlePropertyStart}
                                                    onCommit={(key, val) => {
                                                        // Sliders snapshot once in onSlideStart; every other
                                                        // control is a discrete edit worth its own undo step.
                                                        if (propDef.controlType !== 'mini-slider') pushToHistory();
                                                        handlePropertyChange(key, val);
                                                    }}
                                                />
                                            )}
                                        </For>
                                    </div>
                                </Show>

                                {/* Rich Text Toggle */}
                                <Show when={el().type === 'text' || !!el().containerText || !!el().richContainerText}>
                                    <div class="qt-divider" />
                                    <button
                                        class={`qt-icon-btn ${(el().richText?.length || el().richContainerText?.length) ? 'active' : ''}`}
                                        onClick={() => {
                                            const d = el();
                                            pushToHistory();
                                            if (d.richText?.length || d.richContainerText?.length) {
                                                // Disable: convert back to plain text
                                                if (d.type === 'text' && d.richText) {
                                                    updateElement(d.id, { text: spansToPlainText(d.richText), richText: undefined }, true);
                                                } else if (d.richContainerText) {
                                                    updateElement(d.id, { containerText: spansToPlainText(d.richContainerText), richContainerText: undefined }, true);
                                                }
                                            } else {
                                                // Enable: convert plain text to rich spans
                                                if (d.type === 'text') {
                                                    updateElement(d.id, { richText: plainTextToSpans(d.text || '') }, true);
                                                } else {
                                                    updateElement(d.id, { richContainerText: plainTextToSpans(d.containerText || '') }, true);
                                                }
                                            }
                                        }}
                                        title="Toggle Rich Text"
                                    >
                                        <Type size={14} />
                                    </button>
                                </Show>

                                {/* Mindmap Actions Section */}
                                <Show when={props.isMindmapNode()}>
                                    <Show when={props.quickProps().length > 0}>
                                        <div class="qt-divider" />
                                    </Show>

                                    <button
                                        class="qt-action-btn"
                                        onClick={() => applyMindmapStyling(el().id)}
                                        title="Auto Style Branch"
                                    >
                                        <Palette size={18} />
                                    </button>
                                </Show>

                                <Show when={el().type === 'image'}>
                                    <Show when={props.quickProps().length > 0}><div class="qt-divider" /></Show>
                                    <button
                                        class="qt-action-btn"
                                        onClick={() => { void replaceImageOn(el().id); }}
                                        title={el().dataURL ? 'Replace image…' : 'Add image…'}
                                    >
                                        <ImageIcon size={18} />
                                    </button>
                                </Show>
                            </div>
                        }>
                            {/* Collapsed state: tiny icon */}
                            <button
                                class="qt-collapsed-icon"
                                onClick={() => props.setIsExpanded(true)}
                                title="Quick properties"
                            >
                                <SlidersHorizontal size={16} />
                            </button>
                        </Show>
                    </div>
                );
            }}
        </Show>
    );
};
