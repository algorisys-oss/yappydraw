/**
 * User templates — "Save as Template" persistence.
 *
 * Each user template is a full document snapshot stored in localStorage
 * (works offline / without the backend). Loading one restores the snapshot
 * as a new document of its original docType.
 */
import type { UserTemplate } from '../types/template-types';
import type { SlideDocument } from '../types/slide-types';
import { store, saveActiveSlide } from '../store/app-store';
import { exportPageToPng } from '../utils/export';
import { isPagedDocType } from '../types/slide-types';
import { idbSet, idbMigrateFromLocalStorage } from '../storage/idb-kv';

const STORAGE_KEY = 'yappy:user-templates';

const deep = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// In-memory cache backed by IndexedDB (localStorage would cap the library at
// ~5 MB — a few thumbnailed templates). Hydrates once at startup, migrating
// any legacy localStorage data; sync reads serve the cache.
let cache: UserTemplate[] = [];

export const userTemplatesReady: Promise<void> = (async () => {
    try {
        const stored = await idbMigrateFromLocalStorage<UserTemplate[]>(STORAGE_KEY, STORAGE_KEY);
        cache = Array.isArray(stored) ? stored : [];
        if (cache.length > 0) {
            // Registry is built before hydration completes — refresh it
            const { refreshUserTemplates } = await import('./registry');
            refreshUserTemplates();
        }
    } catch (e) {
        console.error('[user-templates] hydration failed:', e);
    }
})();

export function listUserTemplates(): UserTemplate[] {
    return cache;
}

function persist(templates: UserTemplate[]): boolean {
    cache = templates;
    void idbSet(STORAGE_KEY, deep(templates));
    return true;
}

/** Snapshot the current document into a saved user template. */
export function saveCurrentAsTemplate(name: string, description = ''): UserTemplate | null {
    // Sync canvas background/dimensions into the slides array first
    saveActiveSlide();

    const doc: SlideDocument = {
        version: 4,
        metadata: {
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            docType: store.docType,
        },
        elements: deep(store.elements ?? []),
        layers: deep(store.layers ?? []),
        slides: deep(store.slides ?? []),
        globalSettings: deep(store.globalSettings ?? {}),
        gridSettings: deep(store.gridSettings ?? {}),
        states: deep(store.states ?? []),
        symbols: deep(store.symbols ?? []),
        graphicStyles: deep(store.graphicStyles ?? []),
        swatches: deep(store.swatches ?? []),
        patterns: deep(store.patterns ?? []),
        artboards: deep(store.artboards ?? []),
        gameScript: store.gameScript || undefined,
        sceneBehaviors: store.sceneBehaviors?.length ? deep(store.sceneBehaviors) : undefined,
    };

    // Small thumbnail from the active page (paged docs only)
    let thumbnail: string | undefined;
    if (isPagedDocType(store.docType) && store.slides.length > 0) {
        try {
            const active = store.slides[store.activeSlideIndex] || store.slides[0];
            const thumbScale = Math.min(1, 320 / Math.max(1, active.dimensions.width));
            thumbnail = exportPageToPng(store.activeSlideIndex, thumbScale, false);
        } catch { /* thumbnail is optional */ }
    }

    const template: UserTemplate = {
        metadata: {
            id: `user-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            name,
            category: 'my-templates',
            description: description || `Saved ${new Date().toLocaleDateString()}`,
            tags: ['user', store.docType],
            thumbnail,
            pageSize: isPagedDocType(store.docType) && store.slides[0]
                ? { ...store.slides[0].dimensions }
                : undefined,
        },
        doc,
        data: { elements: [], layers: [] },
    };

    const all = [...listUserTemplates()];
    all.push(template);
    if (!persist(all)) return null;
    return template;
}

export function deleteUserTemplate(id: string): boolean {
    const all = listUserTemplates();
    const next = all.filter(t => t.metadata.id !== id);
    if (next.length === all.length) return false;
    return persist(next);
}
