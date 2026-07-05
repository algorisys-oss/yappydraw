import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Search } from "lucide-solid";
import { GOOGLE_FONTS, addGoogleFont } from "../utils/custom-fonts";
import "./google-fonts-dialog.css";

export interface GoogleFontsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called with the added font's stable key (e.g. "google-Roboto"). */
    onPick: (fontKey: string) => void;
}

/**
 * Searchable picker over a curated list of popular Google Fonts. Selecting a font
 * loads it (Google CSS API, no key needed), registers it, and applies it — the
 * dialog stays open so different fonts can be tried live on the selection; close
 * with Done, ×, Escape, or a click outside.
 * Each row previews in its own family — loaded lazily as it scrolls into view.
 */
const GoogleFontsDialog: Component<GoogleFontsDialogProps> = (props) => {
    const [query, setQuery] = createSignal("");
    const [applied, setApplied] = createSignal<string | null>(null);
    let inputRef: HTMLInputElement | undefined;

    createEffect(() => {
        if (props.isOpen) { setQuery(""); setApplied(null); setTimeout(() => inputRef?.focus(), 50); }
    });

    // Docked panel (no backdrop) — close on Escape from anywhere.
    createEffect(() => {
        if (!props.isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose(); };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    const filtered = createMemo(() => {
        const q = query().trim().toLowerCase();
        return q ? GOOGLE_FONTS.filter(f => f.toLowerCase().includes(q)) : GOOGLE_FONTS;
    });

    const pick = async (family: string) => {
        const font = await addGoogleFont(family);
        props.onPick(font.key);
        setApplied(family);
    };

    // Lazily load a row's font for preview when it mounts.
    const previewLink = (family: string) => {
        const id = `gfp-${family.replace(/\s+/g, '+')}`;
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id; link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}&display=swap`;
        document.head.appendChild(link);
    };

    return (
        <Show when={props.isOpen}>
            <Portal>
                {/* Docked to the right, no dimmed backdrop — the canvas stays visible
                    and interactive so font picks preview live on the selection. */}
                <div class="gf-modal gf-docked" onClick={(e) => e.stopPropagation()}>
                        <div class="gf-header">
                            <h2>Google Fonts</h2>
                            <button class="gf-close" type="button" onClick={props.onClose}><X size={18} /></button>
                        </div>
                        <div class="gf-search">
                            <Search size={14} />
                            <input ref={el => inputRef = el} type="text" placeholder="Search fonts…"
                                value={query()} onInput={(e) => setQuery(e.currentTarget.value)}
                                onKeyDown={(e) => e.stopPropagation()} />
                            <Show when={query()}><button class="gf-clear" onClick={() => setQuery('')}>×</button></Show>
                        </div>
                        <div class="gf-list">
                            <For each={filtered()} fallback={<div class="gf-empty">No fonts match “{query()}”.</div>}>
                                {(family) => {
                                    previewLink(family);
                                    return (
                                        <button class="gf-item" type="button" classList={{ applied: applied() === family }}
                                            onClick={() => pick(family)}
                                            style={{ "font-family": `"${family}", sans-serif` }}>
                                            <span class="gf-name">{family}</span>
                                            <Show when={applied() === family} fallback={<span class="gf-sample">AaBbGg 123</span>}>
                                                <span class="gf-applied">✓ applied</span>
                                            </Show>
                                        </button>
                                    );
                                }}
                            </For>
                        </div>
                        <div class="gf-footer">
                            <span>{filtered().length} fonts · click to try on your selection</span>
                            <button class="gf-done" type="button" onClick={props.onClose}>Done</button>
                        </div>
                </div>
            </Portal>
        </Show>
    );
};

export default GoogleFontsDialog;
