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
import { parseFontVariant } from "./font-variants";
import { dataUrlToBuffer, detectWeightRange, detectWidthRange, stripVariableMarkers } from "./font-axes";

export interface CustomFont {
    key: string;       // stable id stored on elements, e.g. "custom-1" / "google-Roboto"
    label: string;     // display name
    family: string;    // CSS family name ("YappyFont_1", or the Google family e.g. "Roboto")
    kind?: 'file' | 'google';
    dataUrl?: string;  // base64 data URL of the font file (kind === 'file')
    /**
     * A variable font's weight range, e.g. [100, 900]; `null` for a static file. `undefined`
     * means "not checked yet": fonts added before variable support are checked on load.
     */
    weightRange?: [number, number] | null;
    /** A variable font's width range in % (`wdth` axis), e.g. [75, 125]; null for none. Drives the
     *  Width control and the FontFace `stretch` descriptor. */
    widthRange?: [number, number] | null;
    /** Google fonts: the weights the family actually has (read from the stylesheet Google
     *  returns), and whether it has italics. Undefined = not discovered yet. */
    weights?: number[];
    italic?: boolean;
}

const STORAGE_KEY = "yappy.customFonts.v1";

const [customFonts, setCustomFonts] = createSignal<CustomFont[]>([]);
export { customFonts };

let counter = 0;

const ALL_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];

/** Every weight, upright and italic. Google answers a LIST request with faces for only the
 *  styles the family has (Lobster: just 400; Open Sans: 300–800 + italics), whereas a RANGE
 *  wider than the family's axis is a hard 400 for the whole request. */
export const googleFontCssUrl = (family: string) =>
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@`
    + [...ALL_WEIGHTS.map(w => `0,${w}`), ...ALL_WEIGHTS.map(w => `1,${w}`)].join(';') + '&display=swap';

/** The weights and italic availability declared by a Google Fonts stylesheet. */
export function parseGoogleFontFaces(css: string): { weights: number[]; italic: boolean } {
    const weights = new Set<number>();
    let italic = false;
    for (const block of css.split('@font-face').slice(1)) {
        const w = block.match(/font-weight:\s*(\d+)(?:\s+(\d+))?/);
        const st = block.match(/font-style:\s*(\w+)/)?.[1];
        if (st === 'italic') { italic = true; continue; }
        if (!w) continue;
        const lo = +w[1], hi = w[2] ? +w[2] : lo;             // a variable face declares a range
        for (const x of ALL_WEIGHTS) if (x >= lo && x <= hi) weights.add(x);
    }
    return { weights: [...weights].sort((a, b) => a - b), italic };
}

/**
 * Load a Google family at every weight it has, and report which those are. It used to request
 * 400 and 700 only, so a Google font's Style menu could never offer Light or Black (Anshika's
 * review, Phase 4). The stylesheet is fetched (Google sends CORS headers) so the weights can be
 * read from it, then injected; offline, it falls back to a plain <link> for 400/700.
 */
async function loadGoogleCss(family: string): Promise<{ weights: number[]; italic: boolean } | null> {
    if (typeof document === "undefined") return null;
    const id = `gf-${family.replace(/\s+/g, '+')}`;
    const existing = document.getElementById(id);
    if (existing?.dataset.faces) return JSON.parse(existing.dataset.faces);
    try {
        const res = await fetch(googleFontCssUrl(family));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const css = await res.text();
        const faces = parseGoogleFontFaces(css);
        const style = document.createElement('style');
        style.id = id;
        style.dataset.faces = JSON.stringify(faces);
        style.textContent = css;
        existing?.remove();
        document.head.appendChild(style);
        return faces.weights.length ? faces : null;
    } catch {
        if (existing) return null;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@0,400;0,700;1,400&display=swap`;
        document.head.appendChild(link);
        return null;
    }
}

/** Register a font's CSS family with the canvas + the shared font map. For a Google font,
 *  returns the weights/italics it turned out to have (null when they couldn't be read). */
async function activate(font: CustomFont): Promise<{ weights: number[]; italic: boolean } | null> {
    registerFontFamily(font.key, `"${font.family}", sans-serif`);
    if (typeof document === "undefined") return null;

    if (font.kind === 'google') {
        const faces = await loadGoogleCss(font.family);
        // Best-effort: wait for the face so the first paint uses it.
        try { await (document as any).fonts?.load(`16px "${font.family}"`); } catch { /* ignore */ }
        return faces;
    }
    if (!(document as any).fonts || !font.dataUrl) return null;
    try {
        // A variable file must declare its weight RANGE. With no descriptor the face is
        // registered as weight 400 only, and every weight asked of it clamps to Regular.
        const descriptors: FontFaceDescriptors = {};
        if (font.weightRange) descriptors.weight = `${font.weightRange[0]} ${font.weightRange[1]}`;
        // Same for width: without a stretch range the face is "normal" only, and every
        // font-stretch asked of it clamps back to normal.
        if (font.widthRange) descriptors.stretch = `${font.widthRange[0]}% ${font.widthRange[1]}%`;
        if (parseFontVariant(font.label).italic) descriptors.style = 'italic';
        const face = new FontFace(font.family, `url(${font.dataUrl})`, descriptors);
        await face.load();
        (document as any).fonts.add(face);
    } catch (e) {
        console.warn(`[customFonts] failed to load "${font.label}":`, e);
    }
    return null;
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
    stored.forEach(async (f) => {
        // Fonts added before variable-font support: check once, then remember the answer.
        if (f.kind !== 'google' && f.dataUrl && (f.weightRange === undefined || f.widthRange === undefined)) {
            const buf = dataUrlToBuffer(f.dataUrl);
            const weightRange = f.weightRange !== undefined ? f.weightRange : await detectWeightRange(buf, f.label);
            const widthRange = f.widthRange !== undefined ? f.widthRange : await detectWidthRange(buf, f.label);
            const label = weightRange ? stripVariableMarkers(f.label) : f.label;
            f = updateFont(f.key, { weightRange, widthRange, label }) ?? f;
        }
        const faces = await activate(f);
        // Google fonts added before weight discovery (or whose weights changed): remember them.
        if (f.kind === 'google' && faces && JSON.stringify(faces.weights) !== JSON.stringify(f.weights)) {
            updateFont(f.key, { weights: faces.weights, italic: faces.italic });
        }
    });
}

/** Patch one stored font (and persist). Returns the updated record. */
function updateFont(key: string, patch: Partial<CustomFont>): CustomFont | undefined {
    let out: CustomFont | undefined;
    const next = customFonts().map(x => x.key === key ? (out = { ...x, ...patch }) : x);
    setCustomFonts(next);
    persist(next);
    return out;
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
    const fileLabel = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, "").trim() || `Font ${counter + 1}`;
    const buf = await file.arrayBuffer().catch(() => null);
    const weightRange = await detectWeightRange(buf, fileLabel);
    const widthRange = await detectWidthRange(buf, fileLabel);
    // `Roboto-VariableFont_wght` → `Roboto`, so the picker groups it as the family it is.
    const label = weightRange ? stripVariableMarkers(fileLabel) : fileLabel;
    counter += 1;
    const key = `custom-${counter}`;
    const family = `YappyFont_${counter}`;
    const font: CustomFont = { key, label, family, kind: 'file', dataUrl, weightRange, widthRange };
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
    const faces = await activate(font);
    if (faces) { font.weights = faces.weights; font.italic = faces.italic; }
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
export function customFontOptions(): { value: string; label: string; weightRange?: [number, number]; weights?: number[]; italic?: boolean }[] {
    return customFonts().map(f => ({
        value: f.key, label: f.label,
        ...(f.weightRange ? { weightRange: f.weightRange } : {}),
        ...(f.kind === 'google' && f.weights?.length ? { weights: f.weights, italic: !!f.italic } : {}),
    }));
}

/** Width range (%) of the font behind a `fontFamily` key, or null when it has no width axis. */
export function fontWidthRange(fontKey: string | undefined): [number, number] | null {
    if (!fontKey) return null;
    return customFonts().find(f => f.key === fontKey)?.widthRange ?? null;
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
