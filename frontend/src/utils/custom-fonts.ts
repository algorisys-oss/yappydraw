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
    key: string;      // stable id stored on elements, e.g. "custom-1"
    label: string;    // display name (from the file)
    family: string;   // unique CSS family name, e.g. "YappyFont_1"
    dataUrl: string;  // base64 data URL of the font file
}

const STORAGE_KEY = "yappy.customFonts.v1";

const [customFonts, setCustomFonts] = createSignal<CustomFont[]>([]);
export { customFonts };

let counter = 0;

/** Register a font's CSS family with the canvas + the shared font map. */
async function activate(font: CustomFont): Promise<void> {
    registerFontFamily(font.key, `"${font.family}", sans-serif`);
    if (typeof document === "undefined" || !(document as any).fonts) return;
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
    const font: CustomFont = { key, label, family, dataUrl };
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

// Auto-init on first import (client only).
if (typeof window !== "undefined") initCustomFonts();
