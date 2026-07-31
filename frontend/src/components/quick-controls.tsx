/**
 * Quick property controls — the compact widget vocabulary shared by the two places that
 * edit element properties inline.
 *
 * Extracted from `quick-toolbar.tsx` when the tool-options bar needed the same controls:
 * the floating quick toolbar edits the *selected element*, the tool-options bar edits
 * `defaultElementStyles` for the *active tool*. Identical widgets, different binding —
 * hence `QuickControl` takes a value accessor and a commit callback and knows about
 * neither. The caller also owns history: the selection side snapshots before each edit,
 * the defaults side has nothing to undo.
 *
 * Styling lives in `quick-toolbar.css`, whose control classes are top-level (`.color-dot`,
 * `.qt-icon-btn`, …) rather than nested under `.quick-toolbar`, so both hosts get them.
 */

import { type Component, type JSX, Show, For, createSignal, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import {
    Bold, Italic, AlignLeft, AlignCenter, AlignRight, WrapText,
    AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd
} from "lucide-solid";
import { QUICK_COLORS, type QuickPropertyDef, type PresetOption } from "../config/quick-toolbar-config";
import { fontCapabilities } from "../config/properties";
import "./quick-toolbar.css";

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
export const getIcon = (icon: string) => {
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

/**
 * Popover body — in place, or portalled to `<body>` when the host clips.
 *
 * The floating quick toolbar has no overflow of its own, so its popovers can stay
 * absolutely positioned inside the control. The tool-options bar cannot: it lives in
 * `.topbar-center`, which is `overflow: hidden`, and the bar itself scrolls horizontally —
 * an absolute popover there is simply cut off at the bottom of the header. `float` measures
 * the trigger and re-anchors the same markup as `position: fixed` under a Portal, which no
 * ancestor can clip. Positioning is read once on open; these popovers close on any outside
 * click, so there is no scroll-follow case to keep in sync.
 */
const PopoverBody: Component<{
    float?: boolean;
    anchor: () => HTMLElement | undefined;
    class: string;
    /** Anchor by the trigger's centre (the colour dot) rather than its left edge. */
    centered?: boolean;
    children: JSX.Element;
}> = (props) => {
    const stop = (e: MouseEvent) => e.stopPropagation();

    if (!props.float) {
        return <div class={props.class} onClick={stop}>{props.children}</div>;
    }

    const rect = props.anchor()?.getBoundingClientRect();
    const top = (rect?.bottom ?? 0) + 6;
    // Keep it on screen: a control near the right edge would otherwise open off-window.
    const raw = props.centered ? (rect?.left ?? 0) + (rect?.width ?? 0) / 2 : (rect?.left ?? 0);
    const left = Math.max(8, Math.min(raw, window.innerWidth - 8));

    return (
        <Portal>
            <div
                class={`${props.class} qt-floating`}
                style={{
                    position: 'fixed',
                    top: `${Math.round(top)}px`,
                    left: `${Math.round(left)}px`,
                    transform: props.centered ? 'translateX(-50%)' : 'none',
                }}
                onClick={stop}
            >
                {props.children}
            </div>
        </Portal>
    );
};

/** Color dot with popover */
export const ColorDotControl: Component<{
    value: string;
    label: string;
    isOpen: boolean;
    float?: boolean;
    onToggle: () => void;
    onChange: (color: string) => void;
}> = (props) => {
    let popoverRef: HTMLDivElement | undefined;
    let dotRef: HTMLDivElement | undefined;

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
                ref={dotRef}
                class={`color-dot ${isTransparent() ? 'transparent' : ''} ${props.isOpen ? 'active' : ''}`}
                style={isTransparent() ? undefined : { background: props.value }}
                title={props.label}
                onClick={(e) => { e.stopPropagation(); props.onToggle(); }}
            />
            <Show when={props.isOpen}>
                <PopoverBody class="color-popover" float={props.float} centered anchor={() => dotRef}>
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
                </PopoverBody>
            </Show>
        </div>
    );
};

/** Collapsed icon select — shows only active option + chevron, click opens popover */
export const IconSelectCollapsedControl: Component<{
    value: any;
    options: { value: any; icon: string; label: string }[];
    label: string;
    isOpen: boolean;
    float?: boolean;
    onToggle: () => void;
    onChange: (val: any) => void;
}> = (props) => {
    let wrapperRef: HTMLDivElement | undefined;
    let triggerRef: HTMLButtonElement | undefined;

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
                ref={triggerRef}
                class={`qt-icon-btn qt-collapsed-trigger ${props.isOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); props.onToggle(); }}
                title={props.label}
            >
                {getIcon(activeOption().icon)}
                <span class="qt-collapsed-chevron" />
            </button>
            <Show when={props.isOpen}>
                <PopoverBody class="qt-collapsed-popover" float={props.float} anchor={() => triggerRef}>
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
                </PopoverBody>
            </Show>
        </div>
    );
};

/** Icon toggle - single on/off button */
export const IconToggleControl: Component<{
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
export const MiniSliderControl: Component<{
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
export const PresetSelectControl: Component<{
    value: string;
    presetOptions: PresetOption[];
    label: string;
    isOpen: boolean;
    float?: boolean;
    onToggle: () => void;
    onChange: (val: string) => void;
}> = (props) => {
    let wrapperRef: HTMLDivElement | undefined;
    let triggerRef: HTMLButtonElement | undefined;

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
                ref={triggerRef}
                class={`qt-preset-trigger ${props.isOpen ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); props.onToggle(); }}
                title={props.label}
            >
                <span class="qt-preset-label">{activeLabel()}</span>
                <span class="qt-collapsed-chevron" />
            </button>
            <Show when={props.isOpen}>
                <PopoverBody class="qt-preset-popover" float={props.float} anchor={() => triggerRef}>
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
                </PopoverBody>
            </Show>
        </div>
    );
};

/**
 * Renders one `QuickPropertyDef` against whatever the host is editing.
 *
 * `onCommit` is called for every change including slider drags; hosts that care about
 * undo granularity snapshot in `onSlideStart` (fired once at the start of a drag or before
 * a typed entry) and pass a non-history write in `onCommit`.
 */
export const QuickControl: Component<{
    def: QuickPropertyDef;
    value: () => any;
    /** Current font, for disabling bold/italic on faces that lack them. */
    fontFamily?: () => string | undefined;
    openKey: () => string | null;
    setOpenKey: (key: string | null) => void;
    onCommit: (key: string, value: any) => void;
    onSlideStart?: () => void;
    /** Portal the popovers out — required in hosts that clip (see PopoverBody). */
    float?: boolean;
}> = (props) => {
    const def = props.def;
    const toggleOpen = () => props.setOpenKey(props.openKey() === def.key ? null : def.key);
    const isOpen = () => props.openKey() === def.key;

    if (def.controlType === 'color-dot') {
        return (
            <ColorDotControl
                value={props.value() || (def.key === 'backgroundColor' ? 'transparent' : '#000000')}
                label={def.label}
                isOpen={isOpen()}
                float={props.float}
                onToggle={toggleOpen}
                onChange={(color) => props.onCommit(def.key, color)}
            />
        );
    }

    if (def.controlType === 'icon-select' && def.options) {
        return (
            <IconSelectCollapsedControl
                value={props.value()}
                options={def.options}
                label={def.label}
                isOpen={isOpen()}
                float={props.float}
                onToggle={toggleOpen}
                onChange={(val) => props.onCommit(def.key, val)}
            />
        );
    }

    if (def.controlType === 'icon-toggle') {
        const isFontToggle = def.key === 'fontWeight' || def.key === 'fontStyle';
        const isDisabled = () => {
            if (!isFontToggle) return false;
            const caps = fontCapabilities[props.fontFamily?.() || 'hand-drawn'];
            if (!caps) return false;
            return def.key === 'fontWeight' ? !caps.bold : !caps.italic;
        };
        return (
            <IconToggleControl
                value={props.value()}
                propKey={def.key}
                label={def.label}
                disabled={isDisabled()}
                onChange={(val) => props.onCommit(def.key, val)}
            />
        );
    }

    if (def.controlType === 'mini-slider') {
        return (
            <MiniSliderControl
                value={props.value() ?? (def.key === 'borderRadius' ? 0 : def.max!)}
                min={def.min!}
                max={def.max!}
                step={def.step!}
                label={def.label}
                onStart={() => props.onSlideStart?.()}
                onChange={(val) => props.onCommit(def.key, val)}
            />
        );
    }

    if (def.controlType === 'preset-select' && def.presetOptions) {
        return (
            <PresetSelectControl
                value={props.value() || 'none'}
                presetOptions={def.presetOptions}
                label={def.label}
                isOpen={isOpen()}
                float={props.float}
                onToggle={toggleOpen}
                onChange={(val) => props.onCommit(def.key, val)}
            />
        );
    }

    return null;
};
