/**
 * Custom (external) font support.
 *
 * Lets the user add their own `.ttf/.otf/.woff/.woff2` fonts and use them
 * anywhere a built-in font can be used (text elements, shape labels, Touch Type
 * per-glyph fonts). Each custom font is loaded via the `FontFace` API, registered
 * into the shared `fontFamilyMap` (so `resolveFontFamily` resolves it like any
 * built-in), and persisted to localStorage so it survives a reload.
 *
 * A custom font's `key` (e.g. `custom-3`) is what gets stored on elements
 * (`fontFamily`) and char transforms (`font`); its `family` is the unique CSS
 * family name handed to the canvas/`FontFace`.
 */

import { createSignal } from "solid-js";
import { registerFontFamily } from "./text-utils";

export interface CustomFont {
    key: string;       // stable id stored on elements, e.g. "custom-1" / "google-Roboto"
    label: string;     // display name
    family: string;    // CSS family name ("YappyFont_1", or the Google family e.g. "Roboto")
    kind?: 'file' | 'google';
    dataUrl?: string;  // base64 data URL of the font file (kind === 'file')
}

const STORAGE_KEY = "yappy.customFonts.v1";

const [customFonts, setCustomFonts] = createSignal<CustomFont[]>([]);
export { customFonts };

let counter = 0;

/** Inject the Google Fonts CSS <link> for a family (deduped). */
function loadGoogleLink(family: string): void {
    if (typeof document === "undefined") return;
    const id = `gf-${family.replace(/\s+/g, '+')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    // Request common weights; display=swap avoids invisible text while loading.
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@0,400;0,700;1,400&display=swap`;
    document.head.appendChild(link);
}

/** Register a font's CSS family with the canvas + the shared font map. */
async function activate(font: CustomFont): Promise<void> {
    registerFontFamily(font.key, `"${font.family}", sans-serif`);
    if (typeof document === "undefined") return;

    if (font.kind === 'google') {
        loadGoogleLink(font.family);
        // Best-effort: wait for the face so the first paint uses it.
        try { await (document as any).fonts?.load(`16px "${font.family}"`); } catch { /* ignore */ }
        return;
    }
    if (!(document as any).fonts || !font.dataUrl) return;
    try {
        const face = new FontFace(font.family, `url(${font.dataUrl})`);
        await face.load();
        (document as any).fonts.add(face);
    } catch (e) {
        console.warn(`[customFonts] failed to load "${font.label}":`, e);
    }
}

function persist(fonts: CustomFont[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
    } catch (e) {
        // Quota exceeded (font files are large) — the fonts still work this session.
        console.warn("[customFonts] could not persist custom fonts (storage quota?)", e);
    }
}

/** Load persisted custom fonts and register them. Idempotent. */
export function initCustomFonts(): void {
    if (customFonts().length > 0) return;
    let stored: CustomFont[] = [];
    try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        stored = [];
    }
    if (!Array.isArray(stored) || stored.length === 0) return;
    // Keep the counter ahead of any restored ids so new keys never collide.
    for (const f of stored) {
        const n = parseInt(f.key.replace(/\D/g, ""), 10);
        if (Number.isFinite(n)) counter = Math.max(counter, n);
    }
    setCustomFonts(stored);
    stored.forEach(activate);
}

const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

/** Add a custom font from a user-selected file. Returns its stable key. */
export async function addCustomFontFromFile(file: File): Promise<CustomFont> {
    const dataUrl = await readFileAsDataURL(file);
    const label = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, "").trim() || `Font ${counter + 1}`;
    counter += 1;
    const key = `custom-${counter}`;
    const family = `YappyFont_${counter}`;
    const font: CustomFont = { key, label, family, kind: 'file', dataUrl };
    await activate(font);
    const next = [...customFonts(), font];
    setCustomFonts(next);
    persist(next);
    return font;
}

/** Add a Google Font by family name (e.g. "Roboto"). Idempotent per family. */
export async function addGoogleFont(family: string): Promise<CustomFont> {
    const key = `google-${family}`;
    const existing = customFonts().find(f => f.key === key);
    if (existing) return existing;
    const font: CustomFont = { key, label: family, family, kind: 'google' };
    await activate(font);
    const next = [...customFonts(), font];
    setCustomFonts(next);
    persist(next);
    return font;
}

/** Remove a custom font by key. */
export function removeCustomFont(key: string): void {
    const next = customFonts().filter(f => f.key !== key);
    setCustomFonts(next);
    persist(next);
}

/** Built-in + custom font options for pickers (`{ value, label }`). */
export function customFontOptions(): { value: string; label: string }[] {
    return customFonts().map(f => ({ value: f.key, label: f.label }));
}

/**
 * Curated list of popular Google Fonts for the "Browse Google Fonts" picker.
 * Loading is by family name via the Google CSS API (no API key needed); this is
 * a searchable shortlist rather than the full live catalog.
 */
export const GOOGLE_FONTS: string[] = [
    // Sans-serif
    "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Inter", "Nunito",
    "Nunito Sans", "Work Sans", "Raleway", "Rubik", "Mulish", "Manrope", "DM Sans",
    "Karla", "Quicksand", "Josefin Sans", "Barlow", "Cabin", "Oxygen", "Hind",
    "PT Sans", "Source Sans 3", "Fira Sans", "Titillium Web", "Heebo", "Assistant",
    "Archivo", "Outfit", "Sora", "Space Grotesk", "Public Sans", "Figtree",
    "Plus Jakarta Sans", "Lexend", "Albert Sans", "Onest",
    // Display / heavy
    "Oswald", "Bebas Neue", "Anton", "Archivo Black", "Teko", "Righteous",
    "Fjalla One", "Passion One", "Staatliches", "Alfa Slab One", "Bungee",
    "Russo One", "Black Ops One", "Monoton", "Audiowide", "Orbitron",
    // Serif
    "Merriweather", "Playfair Display", "Lora", "PT Serif", "Roboto Slab",
    "Noto Serif", "Source Serif 4", "Bitter", "Crimson Text", "Libre Baskerville",
    "EB Garamond", "Cormorant Garamond", "Cardo", "Spectral", "Domine", "Arvo",
    "Zilla Slab", "Frank Ruhl Libre", "Vollkorn", "Bree Serif", "DM Serif Display",
    // Handwriting / script
    "Caveat", "Dancing Script", "Pacifico", "Lobster", "Shadows Into Light",
    "Indie Flower", "Permanent Marker", "Satisfy", "Great Vibes", "Sacramento",
    "Kalam", "Patrick Hand", "Architects Daughter", "Amatic SC", "Courgette",
    "Handlee", "Gloria Hallelujah", "Cookie", "Allura", "Yellowtail", "Marck Script",
    // Monospace
    "Roboto Mono", "Source Code Pro", "JetBrains Mono", "Fira Code", "IBM Plex Mono",
    "Inconsolata", "Space Mono", "Ubuntu Mono", "PT Mono", "Cousine", "DM Mono",
];

// Auto-init on first import (client only).
if (typeof window !== "undefined") initCustomFonts();
