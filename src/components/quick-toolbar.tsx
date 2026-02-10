/**
 * Quick Toolbar - Floating toolbar above selected elements.
 * Shows shape-specific quick property controls + mindmap actions (when applicable).
 * Refactored from mindmap-action-toolbar.tsx.
 */

import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { store, updateElement, pushToHistory, applyMindmapStyling } from "../store/app-store";
import { getElementPreviewBaseState, isElementAnimating } from "../utils/animation/element-animator";
import {
    Palette, SlidersHorizontal,
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, WrapText
} from "lucide-solid";
import { getElementFamily, getQuickPropertiesForType, QUICK_COLORS, type QuickPropertyDef } from "../config/quick-toolbar-config";
import { fontCapabilities } from "../config/properties";
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

/** Inline SVG icons for arrowheads */
const ArrowheadIcon: Component<{ type: 'none' | 'arrow' | 'triangle' | 'diamond' }> = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="2" y1="8" x2="12" y2="8" />
        {props.type === 'arrow' && <polyline points="9,5 12,8 9,11" />}
        {props.type === 'triangle' && <polygon points="12,8 8,5 8,11" fill="currentColor" stroke="none" />}
        {props.type === 'diamond' && <polygon points="12,8 10,5.5 8,8 10,10.5" fill="currentColor" stroke="none" />}
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
    // Arrowheads
    if (icon === 'none') return <ArrowheadIcon type="none" />;
    if (icon === 'arrow') return <ArrowheadIcon type="arrow" />;
    if (icon === 'triangle') return <ArrowheadIcon type="triangle" />;
    if (icon === 'diamond') return <ArrowheadIcon type="diamond" />;
    // Text align
    if (icon === 'alignLeft') return <AlignLeft size={14} />;
    if (icon === 'alignCenter') return <AlignCenter size={14} />;
    if (icon === 'alignRight') return <AlignRight size={14} />;
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

/** Mini slider */
const MiniSliderControl: Component<{
    value: number;
    min: number;
    max: number;
    step: number;
    label: string;
    onChange: (val: number) => void;
    onStart: () => void;
}> = (props) => {
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
            <span class="qt-mini-slider-value">{Math.round(props.value ?? props.max)}</span>
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
        const el = element();
        if (!el) return;
        updateElement(el.id, { [key]: value }, false);
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
                        const base = (elX + elW / 2) * store.viewState.scale + store.viewState.panX - toolbarWidth / 2;

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
                    const base = (elX + elW) * store.viewState.scale + store.viewState.panX + 8;
                    return Math.min(Math.max(base, 10), window.innerWidth - iconSize - 10);
                };

                const y = () => {
                    const baseState = getElementPreviewBaseState(el().id);
                    const elY = baseState ? baseState.y : el().y;
                    const toolbarHeight = props.isExpanded() ? 50 : 32;
                    const margin = props.isExpanded() ? 20 : 12;
                    const calculated = elY * store.viewState.scale + store.viewState.panY - toolbarHeight - margin;
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

                                                return null;
                                            }}
                                        </For>
                                    </div>
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
