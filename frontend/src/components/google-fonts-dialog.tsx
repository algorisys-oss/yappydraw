import { type Component, Show, For, createSignal, createMemo, createEffect } from "solid-js";
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
 * loads it (Google CSS API, no key needed), registers it, and returns its key.
 * Each row previews in its own family — loaded lazily as it scrolls into view.
 */
const GoogleFontsDialog: Component<GoogleFontsDialogProps> = (props) => {
    const [query, setQuery] = createSignal("");
    let inputRef: HTMLInputElement | undefined;

    createEffect(() => {
        if (props.isOpen) { setQuery(""); setTimeout(() => inputRef?.focus(), 50); }
    });

    const filtered = createMemo(() => {
        const q = query().trim().toLowerCase();
        return q ? GOOGLE_FONTS.filter(f => f.toLowerCase().includes(q)) : GOOGLE_FONTS;
    });

    const pick = async (family: string) => {
        const font = await addGoogleFont(family);
        props.onPick(font.key);
        props.onClose();
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
                <div class="gf-overlay" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') props.onClose(); }}>
                    <div class="gf-modal" onClick={(e) => e.stopPropagation()}>
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
                                        <button class="gf-item" type="button" onClick={() => pick(family)}
                                            style={{ "font-family": `"${family}", sans-serif` }}>
                                            <span class="gf-name">{family}</span>
                                            <span class="gf-sample">AaBbGg 123</span>
                                        </button>
                                    );
                                }}
                            </For>
                        </div>
                        <div class="gf-footer">{filtered().length} fonts · loaded on demand</div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default GoogleFontsDialog;
