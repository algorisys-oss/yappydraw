import { type Component, For, Show, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { ChevronDown, Check } from "lucide-solid";
import { resolveFontFamily } from "../utils/text-utils";
import "./font-picker.css";

export interface FontOption {
    label: string;
    value: string | number;
    /**
     * Font key to render this row's preview with, when it differs from `value`.
     *
     * The list shows *families*, so a row's value is a family name ("Montserrat") — which is
     * not something `resolveFontFamily` can look up. The preview therefore uses the family's
     * representative variant key (its Regular) instead.
     */
    previewValue?: string;
}

export interface FontPickerProps {
    options: FontOption[];
    /** Current font key ('__mixed__' renders a mixed placeholder). */
    value: string;
    onPick: (value: string) => void;
    onGoogleFonts: () => void;
    onAddFont: () => void;
}

/**
 * Custom dropdown for the Font property. The user-added Google fonts make the
 * option list arbitrarily long, and a native <select> popup is OS-rendered — it
 * can spill past the screen edge and can't be scrolled into shape. This popup is
 * viewport-clamped (flips upward when there's more room above), scrollable,
 * searchable, and each row previews its own family. ↑↓ + Enter navigate, Escape
 * closes; key events stop here so canvas hotkeys (element nudge) never fire.
 */
const FontPicker: Component<FontPickerProps> = (props) => {
    const [open, setOpen] = createSignal(false);
    const [query, setQuery] = createSignal("");
    const [focusIdx, setFocusIdx] = createSignal(-1);
    const [pos, setPos] = createSignal({ left: 0, top: 0, maxHeight: 320, up: false });
    let triggerRef: HTMLButtonElement | undefined;
    let popupRef: HTMLDivElement | undefined;
    let inputRef: HTMLInputElement | undefined;
    let listRef: HTMLDivElement | undefined;

    const current = createMemo(() =>
        props.options.find(o => String(o.value) === props.value));

    const filtered = createMemo(() => {
        const q = query().trim().toLowerCase();
        return q ? props.options.filter(o => o.label.toLowerCase().includes(q)) : props.options;
    });
    createEffect(() => { filtered(); setFocusIdx(-1); });

    const POPUP_W = 240;
    const openPopup = () => {
        if (!triggerRef) return;
        const r = triggerRef.getBoundingClientRect();
        const vw = window.innerWidth, vh = window.innerHeight;
        const below = vh - r.bottom - 8, above = r.top - 8;
        const up = below < 220 && above > below;
        const maxHeight = Math.min(340, up ? above : below);
        const left = Math.max(8, Math.min(r.right - POPUP_W, vw - POPUP_W - 8));
        setPos({ left, top: up ? r.top - 4 : r.bottom + 4, maxHeight, up });
        setQuery("");
        setOpen(true);
        setTimeout(() => inputRef?.focus(), 30);
    };

    // Close on click outside / Escape / window resize while open.
    createEffect(() => {
        if (!open()) return;
        const onDown = (e: PointerEvent) => {
            const t = e.target as Node;
            if (!popupRef?.contains(t) && !triggerRef?.contains(t)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); triggerRef?.focus(); } };
        const onResize = () => setOpen(false);
        window.addEventListener('pointerdown', onDown, true);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('resize', onResize);
        onCleanup(() => {
            window.removeEventListener('pointerdown', onDown, true);
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('resize', onResize);
        });
    });

    // Keep the keyboard-focused row visible.
    createEffect(() => {
        const idx = focusIdx();
        if (idx < 0 || !listRef) return;
        (listRef.children[idx] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
    });

    const pick = (v: string | number) => { props.onPick(String(v)); setOpen(false); triggerRef?.focus(); };

    const onListKeys = (e: KeyboardEvent) => {
        e.stopPropagation();
        const list = filtered();
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(list.length - 1, i + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        else if (e.key === 'Enter' && focusIdx() >= 0 && list[focusIdx()]) { e.preventDefault(); pick(list[focusIdx()].value); }
    };

    return (
        <>
            <button ref={el => triggerRef = el} type="button" class="fp-trigger"
                title="Font family"
                style={{ 'font-family': props.value === '__mixed__' ? undefined : resolveFontFamily(current()?.previewValue ?? props.value) }}
                onClick={() => open() ? setOpen(false) : openPopup()}
                onKeyDown={(e) => {
                    if (!open() && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault(); e.stopPropagation(); openPopup();
                    }
                }}>
                <span class="fp-trigger-label">{props.value === '__mixed__' ? '(Mixed)' : (current()?.label ?? props.value)}</span>
                <ChevronDown size={13} />
            </button>
            <Show when={open()}>
                <Portal>
                    <div ref={el => popupRef = el} class="fp-popup"
                        style={{
                            left: `${pos().left}px`,
                            ...(pos().up ? { bottom: `${window.innerHeight - pos().top}px` } : { top: `${pos().top}px` }),
                            'max-height': `${pos().maxHeight}px`, width: `${POPUP_W}px`,
                        }}
                        onKeyDown={onListKeys}>
                        <input ref={el => inputRef = el} class="fp-search" type="text"
                            placeholder="Search fonts… (↑↓ + Enter)"
                            value={query()} onInput={e => setQuery(e.currentTarget.value)} />
                        <div class="fp-list" ref={el => listRef = el}>
                            <For each={filtered()} fallback={<div class="fp-empty">No fonts match.</div>}>
                                {(opt, i) => (
                                    <button type="button" class="fp-item"
                                        classList={{ selected: String(opt.value) === props.value, focused: focusIdx() === i() }}
                                        style={{ 'font-family': resolveFontFamily(opt.previewValue ?? String(opt.value)) }}
                                        onMouseEnter={() => setFocusIdx(i())}
                                        onClick={() => pick(opt.value)}>
                                        <span class="fp-item-label">{opt.label}</span>
                                        <Show when={String(opt.value) === props.value}><Check size={13} /></Show>
                                    </button>
                                )}
                            </For>
                        </div>
                        <div class="fp-actions">
                            <button type="button" class="fp-action" onClick={() => { setOpen(false); props.onGoogleFonts(); }}>🔍 Google Fonts…</button>
                            <button type="button" class="fp-action" onClick={() => { setOpen(false); props.onAddFont(); }}>＋ Add font…</button>
                        </div>
                    </div>
                </Portal>
            </Show>
        </>
    );
};

export default FontPicker;
