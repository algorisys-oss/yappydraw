/**
 * Quick Toolbar - Floating toolbar above selected elements.
 * Shows shape-specific quick property controls + mindmap actions (when applicable).
 * Refactored from mindmap-action-toolbar.tsx.
 */

import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { store, updateElement, pushToHistory, applyMindmapStyling } from "../store/app-store";
import { getElementPreviewBaseState, isElementAnimating } from "../utils/animation/element-animator";
import { replaceImageOn } from "../utils/image-actions";
import {
    Palette, SlidersHorizontal, Image as ImageIcon,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, WrapText, Type,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd
} from "lucide-solid";
import { getElementFamily, getQuickPropertiesForType, QUICK_COLORS, type QuickPropertyDef, type PresetOption } from "../config/quick-toolbar-config";
import { getImageFilterPreset } from "../config/image-filter-presets";
import { fontCapabilities } from "../config/properties";
import { plainTextToSpans, spansToPlainText } from "../utils/rich-text-utils";
import { worldToScreen } from "../utils/viewport-transforms";
import "./quick-toolbar.css";

// ============ Sub-Components ============

/** Inline SVG icons for stroke styles */
const StrokeIcon: Component<{ type: 'solid' | 'dashed' | 'dotted' }> = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16">
        {props.type === 'solid' && <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" />}
        {props.type === 'dashed' && <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2" />}
        {props.type === 'dotted' && <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="2" stroke-dasharray="1.5 2" stroke-linecap="round" />}
    </svg>
);

/** Inline SVG icons for line curve types */
const CurveIcon: Component<{ type: 'straight' | 'curve' | 'elbow' }> = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        {props.type === 'straight' && <line x1="2" y1="14" x2="14" y2="2" />}
        {props.type === 'curve' && <path d="M2 14 C2 6, 14 10, 14 2" />}
        {props.type === 'elbow' && <polyline points="2,14 2,2 14,2" />}
    </svg>
);

/** Inline SVG icons for arrowheads (end — arrowhead on right) */
const ArrowheadIcon: Component<{ type: 'none' | 'arrow' | 'triangle' | 'diamond' }> = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="2" y1="8" x2="12" y2="8" />
        {props.type === 'arrow' && <polyline points="9,5 12,8 9,11" />}
        {props.type === 'triangle' && <polygon points="12,8 8,5 8,11" fill="currentColor" stroke="none" />}
        {props.type === 'diamond' && <polygon points="12,8 10,5.5 8,8 10,10.5" fill="currentColor" stroke="none" />}
    </svg>
);

/** Inline SVG icons for start arrowheads (arrowhead on left) */
const StartArrowheadIcon: Component<{ type: 'none' | 'arrow' | 'triangle' | 'diamond' }> = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="4" y1="8" x2="14" y2="8" />
        {props.type === 'arrow' && <polyline points="7,5 4,8 7,11" />}
        {props.type === 'triangle' && <polygon points="4,8 8,5 8,11" fill="currentColor" stroke="none" />}
        {props.type === 'diamond' && <polygon points="4,8 6,5.5 8,8 6,10.5" fill="currentColor" stroke="none" />}
    </svg>
);

/** Shared icon resolver — maps icon string keys to JSX elements */
const getIcon = (icon: string) => {
    // Stroke styles
    if (icon === 'solid') return <StrokeIcon type="solid" />;
    if (icon === 'dashed') return <StrokeIcon type="dashed" />;
    if (icon === 'dotted') return <StrokeIcon type="dotted" />;
    // Curve types
    if (icon === 'straight') return <CurveIcon type="straight" />;
    if (icon === 'curve') return <CurveIcon type="curve" />;
    if (icon === 'elbow') return <CurveIcon type="elbow" />;
    // End arrowheads
    if (icon === 'none') return <ArrowheadIcon type="none" />;
    if (icon === 'arrow') return <ArrowheadIcon type="arrow" />;
    if (icon === 'triangle') return <ArrowheadIcon type="triangle" />;
    if (icon === 'diamond') return <ArrowheadIcon type="diamond" />;
    // Start arrowheads
    if (icon === 'startNone') return <StartArrowheadIcon type="none" />;
    if (icon === 'startArrow') return <StartArrowheadIcon type="arrow" />;
    if (icon === 'startTriangle') return <StartArrowheadIcon type="triangle" />;
    if (icon === 'startDiamond') return <StartArrowheadIcon type="diamond" />;
    // Text align (horizontal)
    if (icon === 'alignLeft') return <AlignLeft size={14} />;
    if (icon === 'alignCenter') return <AlignCenter size={14} />;
    if (icon === 'alignRight') return <AlignRight size={14} />;
    // Text align (vertical)
    if (icon === 'alignTop') return <AlignVerticalJustifyStart size={14} />;
    if (icon === 'alignMiddle') return <AlignVerticalJustifyCenter size={14} />;
    if (icon === 'alignBottom') return <AlignVerticalJustifyEnd size={14} />;
    // Font family
    if (icon === 'fontHand') return <span style={{ "font-family": "Handlee, cursive", "font-size": "13px", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontCaveat') return <span style={{ "font-family": "Caveat, cursive", "font-size": "14px", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontMarker') return <span style={{ "font-family": "'Permanent Marker', cursive", "font-size": "11px", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontSans') return <span style={{ "font-family": "Inter, sans-serif", "font-size": "12px", "font-weight": "500", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontPoppins') return <span style={{ "font-family": "Poppins, sans-serif", "font-size": "12px", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontSerif') return <span style={{ "font-family": "Merriweather, serif", "font-size": "11px", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontMono') return <span style={{ "font-family": "'Source Code Pro', monospace", "font-size": "11px", "line-height": "1" }}>Aa</span>;
    if (icon === 'fontCode') return <span style={{ "font-family": "'JetBrains Mono', monospace", "font-size": "11px", "line-height": "1" }}>Aa</span>;
    return null;
};

/** Color dot with popover */
const ColorDotControl: Component<{
    value: string;
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    onChange: (color: string) => void;
}> = (props) => {
    let popoverRef: HTMLDivElement | undefined;

    const handleDocClick = (e: MouseEvent) => {
        if (props.isOpen && popoverRef && !popoverRef.contains(e.target as Node)) {
            props.onToggle();
        }
    };

    createEffect(() => {
        if (props.isOpen) {
            // Delay to avoid catching the same click
            const timer = setTimeout(() => document.addEventListener('click', handleDocClick), 0);
            onCleanup(() => {
                clearTimeout(timer);
                document.removeEventListener('click', handleDocClick);
            });
        }
    });

    const isTransparent = () => !props.value || props.value === 'transparent';

    return (
        <div class="color-dot-wrapper" ref={popoverRef}>
            <div
                class={`color-dot ${isTransparent() ? 'transparent' : ''} ${props.isOpen ? 'active' : ''}`}
                style={isTransparent() ? undefined : { background: props.value }}
                title={props.label}
                onClick={(e) => { e.stopPropagation(); props.onToggle(); }}
            />
            <Show when={props.isOpen}>
                <div class="color-popover" onClick={(e) => e.stopPropagation()}>
                    <For each={QUICK_COLORS}>
                        {(color) => (
                            <div
                                class={`color-swatch ${color === props.value ? 'selected' : ''}`}
                                style={{ background: color }}
                                title={color}
                                onClick={() => { props.onChange(color); props.onToggle(); }}
                            />
                        )}
                    </For>
                    <div class="color-popover-custom">
                        <input
                            type="color"
                            value={props.value || '#000000'}
                            onInput={(e) => props.onChange(e.currentTarget.value)}
                            title="Custom color"
                        />
                        <span>Custom</span>
                    </div>
                </div>
            </Show>
        </div>
    );
};

/** Collapsed icon select — shows only active option + chevron, click opens popover */
const IconSelectCollapsedControl: Component<{
    value: any;
    options: { value: any; icon: string; label: string }[];
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    onChange: (val: any) => void;
}> = (props) => {
    let wrapperRef: HTMLDivElement | undefined;

    const handleDocClick = (e: MouseEvent) => {
        if (props.isOpen && wrapperRef && !wrapperRef.contains(e.target as Node)) {
            props.onToggle();
        }
    };

    createEffect(() => {
        if (props.isOpen) {
            const timer = setTimeout(() => document.addEventListener('click', handleDocClick), 0);
            onCleanup(() => {
                clearTimeout(timer);
                document.removeEventListener('click', handleDocClick);
            });
        }
    });

    const activeOption = () =>
        props.options.find(o => (o.value ?? null) === (props.value ?? null)) || props.options[0];

    return (
        <div class="qt-collapsed-select" ref={wrapperRef} title={props.label}>
            <button
                class={`qt-icon-btn qt-collapsed-trigger ${props.isOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); props.onToggle(); }}
                title={props.label}
            >
                {getIcon(activeOption().icon)}
                <span class="qt-collapsed-chevron" />
            </button>
            <Show when={props.isOpen}>
                <div class="qt-collapsed-popover" onClick={(e) => e.stopPropagation()}>
                    <For each={props.options}>
                        {(opt) => (
                            <button
                                class={`qt-icon-btn ${(props.value ?? null) === opt.value ? 'active' : ''}`}
                                onClick={() => { props.onChange(opt.value); props.onToggle(); }}
                                title={opt.label}
                            >
                                {getIcon(opt.icon)}
                            </button>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

/** Icon toggle - single on/off button */
const IconToggleControl: Component<{
    value: any;
    propKey: string;
    label: string;
    disabled?: boolean;
    onChange: (val: any) => void;
}> = (props) => {
    const isActive = () => {
        if (props.propKey === 'fontWeight') return props.value === 'bold' || props.value === true;
        if (props.propKey === 'fontStyle') return props.value === 'italic' || props.value === true;
        return !!props.value;
    };

    const toggle = () => {
        if (props.disabled) return;
        if (props.propKey === 'fontWeight') {
            props.onChange(isActive() ? 'normal' : 'bold');
        } else if (props.propKey === 'fontStyle') {
            props.onChange(isActive() ? 'normal' : 'italic');
        } else {
            props.onChange(!props.value);
        }
    };

    return (
        <button
            class={`qt-icon-btn ${isActive() ? 'active' : ''}`}
            classList={{ 'qt-disabled': !!props.disabled }}
            onClick={toggle}
            disabled={props.disabled}
            title={props.disabled ? `This font does not support ${props.label.toLowerCase()}` : props.label}
        >
            {props.propKey === 'fontWeight' ? <Bold size={14} /> : props.propKey === 'curvedText' ? <WrapText size={14} /> : <Italic size={14} />}
        </button>
    );
};

/** Mini slider — drag the track, or tap the value to type an exact number */
const MiniSliderControl: Component<{
    value: number;
    min: number;
    max: number;
    step: number;
    label: string;
    onChange: (val: number) => void;
    onStart: () => void;
}> = (props) => {
    const [editing, setEditing] = createSignal(false);

    const clamp = (v: number) => Math.min(props.max, Math.max(props.min, v));

    const beginEdit = () => {
        props.onStart(); // snapshot history once, before edits (mirrors the track's onMouseDown)
        setEditing(true);
    };

    const commit = (raw: string) => {
        setEditing(false);
        const n = Number(raw);
        if (raw.trim() !== '' && !Number.isNaN(n)) props.onChange(clamp(n));
    };

    return (
        <div class="qt-mini-slider" title={props.label}>
            <input
                type="range"
                min={props.min}
                max={props.max}
                step={props.step}
                value={props.value ?? props.max}
                onMouseDown={props.onStart}
                onTouchStart={props.onStart}
                onInput={(e) => props.onChange(Number(e.currentTarget.value))}
            />
            <Show
                when={editing()}
                fallback={
                    <span
                        class="qt-mini-slider-value editable"
                        title={`${props.label}: tap to type a value`}
                        onClick={beginEdit}
                    >
                        {Math.round(props.value ?? props.max)}
                    </span>
                }
            >
                <input
                    class="qt-mini-slider-input"
                    type="number"
                    min={props.min}
                    max={props.max}
                    step={props.step}
                    value={Math.round(props.value ?? props.max)}
                    ref={(el) => queueMicrotask(() => { el.focus(); el.select(); })}
                    onInput={(e) => {
                        const raw = e.currentTarget.value;
                        const n = Number(raw);
                        // Live-preview only COMPLETE, in-range values. A partial or below-min entry
                        // (e.g. "1" while typing "16") must stay in the field — clamping it to the min
                        // mid-type is what made font size snap to 8 and block further typing.
                        if (raw.trim() !== '' && !Number.isNaN(n) && n >= props.min && n <= props.max) props.onChange(n);
                    }}
                    onBlur={(e) => commit(e.currentTarget.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); }
                        else if (e.key === 'Escape') { e.preventDefault(); setEditing(false); }
                    }}
                />
            </Show>
        </div>
    );
};

/** Preset select — dropdown showing preset names, grouped by category */
const PresetSelectControl: Component<{
    value: string;
    presetOptions: PresetOption[];
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    onChange: (val: string) => void;
}> = (props) => {
    let wrapperRef: HTMLDivElement | undefined;

    const handleDocClick = (e: MouseEvent) => {
        if (props.isOpen && wrapperRef && !wrapperRef.contains(e.target as Node)) {
            props.onToggle();
        }
    };

    createEffect(() => {
        if (props.isOpen) {
            const timer = setTimeout(() => document.addEventListener('click', handleDocClick), 0);
            onCleanup(() => {
                clearTimeout(timer);
                document.removeEventListener('click', handleDocClick);
            });
        }
    });

    const activeLabel = () =>
        props.presetOptions.find(o => o.value === props.value)?.label || 'None';

    // Group options by category
    const categories = () => {
        const cats: { name: string; options: PresetOption[] }[] = [];
        const seen = new Set<string>();
        for (const opt of props.presetOptions) {
            const cat = opt.category || '';
            if (!seen.has(cat)) {
                seen.add(cat);
                cats.push({ name: cat, options: [] });
            }
            cats.find(c => c.name === cat)!.options.push(opt);
        }
        return cats;
    };

    return (
        <div class="qt-preset-select" ref={wrapperRef} title={props.label}>
            <button
                class={`qt-preset-trigger ${props.isOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); props.onToggle(); }}
                title={props.label}
            >
                <span class="qt-preset-label">{activeLabel()}</span>
                <span class="qt-collapsed-chevron" />
            </button>
            <Show when={props.isOpen}>
                <div class="qt-preset-popover" onClick={(e) => e.stopPropagation()}>
                    <For each={categories()}>
                        {(cat) => (
                            <>
                                <Show when={cat.name}>
                                    <div class="qt-preset-category">{cat.name}</div>
                                </Show>
                                <For each={cat.options}>
                                    {(opt) => (
                                        <button
                                            class={`qt-preset-option ${props.value === opt.value ? 'active' : ''}`}
                                            onClick={() => { props.onChange(opt.value); props.onToggle(); }}
                                        >
                                            {opt.label}
                                        </button>
                                    )}
                                </For>
                            </>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};

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
    };

    return (
        <Show when={element()}>
            {(el) => {
                const x = () => {
                    const baseState = getElementPreviewBaseState(el().id);
                    const elX = baseState ? baseState.x : el().x;
                    const elW = baseState ? baseState.width : el().width;

                    if (props.isExpanded()) {
                        const toolbarWidth = containerRef?.offsetWidth ?? 300;
                        const base = worldToScreen(elX + elW / 2, 0, store.viewState).x - toolbarWidth / 2;

                        // Collision avoidance with Property Panel
                        if (store.showPropertyPanel && !store.isPropertyPanelMinimized) {
                            const panelStart = window.innerWidth - 280;
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
                    const baseState = getElementPreviewBaseState(el().id);
                    const elY = baseState ? baseState.y : el().y;
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
                                            {(propDef) => {
                                                const value = () => (el() as any)[propDef.key];

                                                if (propDef.controlType === 'color-dot') {
                                                    return (
                                                        <ColorDotControl
                                                            value={value() || (propDef.key === 'backgroundColor' ? 'transparent' : '#000000')}
                                                            label={propDef.label}
                                                            isOpen={props.activePopover() === propDef.key}
                                                            onToggle={() => {
                                                                props.setActivePopover(
                                                                    props.activePopover() === propDef.key ? null : propDef.key
                                                                );
                                                            }}
                                                            onChange={(color) => {
                                                                pushToHistory();
                                                                handlePropertyChange(propDef.key, color);
                                                            }}
                                                        />
                                                    );
                                                }

                                                if (propDef.controlType === 'icon-select' && propDef.options) {
                                                    return (
                                                        <IconSelectCollapsedControl
                                                            value={value()}
                                                            options={propDef.options}
                                                            label={propDef.label}
                                                            isOpen={props.activePopover() === propDef.key}
                                                            onToggle={() => {
                                                                props.setActivePopover(
                                                                    props.activePopover() === propDef.key ? null : propDef.key
                                                                );
                                                            }}
                                                            onChange={(val) => {
                                                                pushToHistory();
                                                                handlePropertyChange(propDef.key, val);
                                                            }}
                                                        />
                                                    );
                                                }

                                                if (propDef.controlType === 'icon-toggle') {
                                                    const isFontToggle = propDef.key === 'fontWeight' || propDef.key === 'fontStyle';
                                                    const isDisabled = () => {
                                                        if (!isFontToggle) return false;
                                                        const font = (el() as any).fontFamily || 'hand-drawn';
                                                        const caps = fontCapabilities[font];
                                                        if (!caps) return false;
                                                        return propDef.key === 'fontWeight' ? !caps.bold : !caps.italic;
                                                    };
                                                    return (
                                                        <IconToggleControl
                                                            value={value()}
                                                            propKey={propDef.key}
                                                            label={propDef.label}
                                                            disabled={isDisabled()}
                                                            onChange={(val) => {
                                                                pushToHistory();
                                                                handlePropertyChange(propDef.key, val);
                                                            }}
                                                        />
                                                    );
                                                }

                                                if (propDef.controlType === 'mini-slider') {
                                                    return (
                                                        <MiniSliderControl
                                                            value={value() ?? (propDef.key === 'borderRadius' ? 0 : propDef.max!)}
                                                            min={propDef.min!}
                                                            max={propDef.max!}
                                                            step={propDef.step!}
                                                            label={propDef.label}
                                                            onStart={handlePropertyStart}
                                                            onChange={(val) => handlePropertyChange(propDef.key, val)}
                                                        />
                                                    );
                                                }

                                                if (propDef.controlType === 'preset-select' && propDef.presetOptions) {
                                                    return (
                                                        <PresetSelectControl
                                                            value={value() || 'none'}
                                                            presetOptions={propDef.presetOptions}
                                                            label={propDef.label}
                                                            isOpen={props.activePopover() === propDef.key}
                                                            onToggle={() => {
                                                                props.setActivePopover(
                                                                    props.activePopover() === propDef.key ? null : propDef.key
                                                                );
                                                            }}
                                                            onChange={(val) => {
                                                                pushToHistory();
                                                                handlePropertyChange(propDef.key, val);
                                                            }}
                                                        />
                                                    );
                                                }

                                                return null;
                                            }}
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
