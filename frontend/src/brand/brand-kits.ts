/**
 * Brand Kits — persistence (localStorage, app-level), extraction from the
 * current document, and "Apply Brand" (recolor + refont the document).
 *
 * Apply strategy: every solid color in the document is mapped to the
 * brand color with the closest relative luminance. This preserves the
 * light/dark structure of a design (dark headers stay dark, light
 * backgrounds stay light) while adopting the brand palette.
 */
import type { BrandKit, BrandColors } from '../types/brand-types';
import { DEFAULT_BRAND_COLORS, DEFAULT_BRAND_FONTS } from '../types/brand-types';
import { store, setStore, pushToHistory, bumpDirtyRevision, saveActiveSlide } from '../store/app-store';
import { isPagedDocType } from '../types/slide-types';
import { isSolidColor } from '../utils/color-adjust';
import { showToast } from '../components/toast';
import { batch } from 'solid-js';
import type { DrawingElement } from '../types';
import { idbSet, idbMigrateFromLocalStorage } from '../storage/idb-kv';

const STORAGE_KEY = 'yappy:brand-kits';

// ─── Persistence ────────────────────────────────────────────
// In-memory cache backed by IndexedDB (logos are data URLs and would blow
// the localStorage quota fast). Hydrates once at startup, migrating any
// legacy localStorage data; sync reads serve the cache.

let cache: BrandKit[] = [];

export const brandKitsReady: Promise<void> = (async () => {
    try {
        const stored = await idbMigrateFromLocalStorage<BrandKit[]>(STORAGE_KEY, STORAGE_KEY);
        cache = Array.isArray(stored) ? stored : [];
    } catch (e) {
        console.error('[brand-kits] hydration failed:', e);
    }
})();

export function listBrandKits(): BrandKit[] {
    return cache;
}

function persist(kits: BrandKit[]): boolean {
    cache = kits;
    void idbSet(STORAGE_KEY, JSON.parse(JSON.stringify(kits)));
    return true;
}

export function saveBrandKit(kit: BrandKit): boolean {
    const kits = [...listBrandKits()];
    const idx = kits.findIndex(k => k.id === kit.id);
    if (idx >= 0) kits[idx] = kit; else kits.push(kit);
    return persist(kits);
}

export function deleteBrandKit(id: string): boolean {
    const kits = listBrandKits();
    const next = kits.filter(k => k.id !== id);
    if (next.length === kits.length) return false;
    return persist(next);
}

export function createBrandKit(partial?: Partial<BrandKit>): BrandKit {
    return {
        id: `brand-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        name: partial?.name || 'My Brand',
        logo: partial?.logo,
        colors: { ...DEFAULT_BRAND_COLORS, ...partial?.colors },
        fonts: { ...DEFAULT_BRAND_FONTS, ...partial?.fonts },
        createdAt: new Date().toISOString(),
    };
}

// ─── Color helpers ──────────────────────────────────────────

/** Parse #rgb/#rrggbb/rgb() to [r,g,b] 0-255, or null. */
function parseColor(c: string): [number, number, number] | null {
    if (!c) return null;
    const hex = c.trim();
    let m = /^#([0-9a-f]{3})$/i.exec(hex);
    if (m) {
        const [r, g, b] = m[1].split('');
        return [parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16)];
    }
    m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
    if (m) {
        const v = m[1];
        return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
    }
    m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(hex);
    if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    return null;
}

function luminance(c: string): number | null {
    const rgb = parseColor(c);
    if (!rgb) return null;
    const [r, g, b] = rgb.map(v => v / 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ─── Extract from document ──────────────────────────────────

/**
 * Build a brand palette from the current document: the most-used solid
 * colors, assigned to roles by luminance (light → background, dark → text/
 * secondary, mid-tones → primary/accent).
 */
export function extractBrandColorsFromDocument(): BrandColors {
    const counts = new Map<string, number>();
    const add = (c?: string) => {
        if (c && isSolidColor(c) && c !== 'transparent') {
            counts.set(c, (counts.get(c) || 0) + 1);
        }
    };
    for (const el of store.elements) {
        add(el.backgroundColor);
        add(el.strokeColor);
        add((el as any).textColor);
        el.gradientStops?.forEach(s => add(s.color));
    }
    for (const s of store.slides) {
        add(s.backgroundColor);
        s.gradientStops?.forEach(g => add(g.color));
    }

    const ranked = [...counts.entries()]
        .filter(([c]) => luminance(c) !== null)
        .sort((a, b) => b[1] - a[1])
        .map(([c]) => c);

    if (ranked.length === 0) return { ...DEFAULT_BRAND_COLORS };

    const byLum = (min: number, max: number) =>
        ranked.find(c => { const l = luminance(c)!; return l >= min && l < max; });

    const background = byLum(0.75, 2) || '#ffffff';
    const text = byLum(0, 0.2) || '#1e293b';
    const primary = ranked.find(c => c !== background && c !== text) || DEFAULT_BRAND_COLORS.primary;
    const secondary = byLum(0.05, 0.35) || primary;
    const accent = ranked.find(c => ![background, text, primary, secondary].includes(c)) || DEFAULT_BRAND_COLORS.accent;

    return { primary, secondary, accent, background, text };
}

// ─── Apply brand ────────────────────────────────────────────

export interface ApplyBrandOptions {
    colors?: boolean;  // default true
    fonts?: boolean;   // default true
}

/** Heading cutoff: text at or above this font size gets the heading font. */
const HEADING_FONT_SIZE = 40;

export function applyBrandKit(kit: BrandKit, opts: ApplyBrandOptions = {}): void {
    const doColors = opts.colors !== false;
    const doFonts = opts.fonts !== false;

    const brandColors = [kit.colors.primary, kit.colors.secondary, kit.colors.accent, kit.colors.background, kit.colors.text]
        .filter(c => luminance(c) !== null);

    const mapCache = new Map<string, string>();
    const nearest = (c?: string): string | undefined => {
        if (!doColors || !c || c === 'transparent' || !isSolidColor(c)) return undefined;
        if (mapCache.has(c)) return mapCache.get(c);
        const l = luminance(c);
        if (l === null || brandColors.length === 0) return undefined;
        let best = brandColors[0], bestD = Infinity;
        for (const bc of brandColors) {
            const d = Math.abs(luminance(bc)! - l);
            if (d < bestD) { bestD = d; best = bc; }
        }
        mapCache.set(c, best);
        return best;
    };

    pushToHistory();
    batch(() => {
        // Elements: colors + fonts
        setStore('elements', () => true, (e: DrawingElement) => {
            const patch: Partial<DrawingElement> = {};
            const bg = nearest(e.backgroundColor);
            if (bg && bg !== e.backgroundColor) { patch.backgroundColor = bg; (patch as any).fillSwatchId = undefined; }
            const sc = nearest(e.strokeColor);
            if (sc && sc !== e.strokeColor) { patch.strokeColor = sc; (patch as any).strokeSwatchId = undefined; }
            const tc = nearest((e as any).textColor);
            if (tc && tc !== (e as any).textColor) (patch as any).textColor = tc;
            if (doColors && e.gradientStops?.some(s => nearest(s.color) !== undefined && nearest(s.color) !== s.color)) {
                patch.gradientStops = e.gradientStops.map(s => {
                    const n = nearest(s.color);
                    return n && n !== s.color ? { ...s, color: n } : s;
                });
            }
            if (doFonts && e.type === 'text') {
                const isHeading = (e.fontSize || 0) >= HEADING_FONT_SIZE || e.fontWeight === 'bold';
                (patch as any).fontFamily = isHeading ? kit.fonts.heading : kit.fonts.body;
            }
            return patch;
        });

        // Page/slide backgrounds
        if (doColors) {
            store.slides.forEach((s, i) => {
                const patch: any = {};
                const bg = nearest(s.backgroundColor);
                if (bg && bg !== s.backgroundColor) patch.backgroundColor = bg;
                if (s.gradientStops?.length) {
                    const mapped = s.gradientStops.map(g => {
                        const n = nearest(g.color);
                        return n && n !== g.color ? { ...g, color: n } : g;
                    });
                    if (mapped.some((g, gi) => g !== s.gradientStops![gi])) patch.gradientStops = mapped;
                }
                if (Object.keys(patch).length) setStore('slides', i, patch);
            });
            // Keep the live canvas background in sync with the active page
            if (isPagedDocType(store.docType)) {
                const active = store.slides[store.activeSlideIndex];
                if (active?.backgroundColor) setStore('canvasBackgroundColor', active.backgroundColor);
            } else {
                const bg = nearest(store.canvasBackgroundColor);
                if (bg) setStore('canvasBackgroundColor', bg);
            }
        }
    });
    saveActiveSlide();
    bumpDirtyRevision();
    showToast(`Brand "${kit.name}" applied`, 'success');
}
