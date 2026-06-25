/**
 * localStorage Auto-Save
 *
 * Provides real-time auto-save with debouncing, immediate save on slide
 * transitions and tab close, crash recovery, and multi-tab awareness.
 *
 * localStorage keys:
 *   yappy:autosave       — full SlideDocument v4 JSON
 *   yappy:autosave:meta  — { timestamp, tabId, docName, elementCount, sizeBytes, viewState, activeSlideIndex }
 */

import { createEffect, on } from 'solid-js';
import { store, setStore, saveActiveSlide, loadDocument, setViewState, setActiveSlide } from '../store/app-store';
import { drawingId, setDrawingId } from '../components/menu';
import { showToast } from '../components/toast';
import type { SlideDocument } from '../types/slide-types';

const AUTOSAVE_KEY = 'yappy:autosave';
const META_KEY = 'yappy:autosave:meta';
const DEBOUNCE_MS = 1000;
const SIZE_WARN_BYTES = 4 * 1024 * 1024; // 4MB

let debounceTimer: number | undefined;
let _isSaving = false;
const tabId = crypto.randomUUID();

// ── Public API ──────────────────────────────────────────────

/**
 * Initialize reactive watchers for auto-save.
 * Call once from App.tsx onMount after recovery check.
 */
export function initAutoSave(): void {
    // Watch meaningful document changes (debounced)
    createEffect(
        on(
            () => [
                store.undoStackLength,
                store.elements.length,
                store.slides.length,
                store.layers.length,
                store.states.length,
                store.docType,
                store.dirtyRevision,
            ],
            () => {
                if (_isSaving) return;
                setStore('isDirty', true);
                scheduleAutoSave();
            },
            { defer: true }
        )
    );

    // Immediate save on slide navigation
    createEffect(
        on(
            () => store.activeSlideIndex,
            () => {
                if (_isSaving) return;
                forceAutoSave();
            },
            { defer: true }
        )
    );

    // Multi-tab: warn if another tab overwrites auto-save
    window.addEventListener('storage', handleStorageEvent);
}

/**
 * Force an immediate auto-save (cancels pending debounce).
 * Safe to call from beforeunload — localStorage.setItem is synchronous.
 */
export function forceAutoSave(): void {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    performAutoSave();
}

/**
 * Clear auto-save data (after manual save or new document).
 */
export function clearAutoSave(): void {
    try {
        localStorage.removeItem(AUTOSAVE_KEY);
        localStorage.removeItem(META_KEY);
    } catch { /* ignore */ }
    setStore('isDirty', false);
}

/**
 * Silently restore the last auto-saved document (like Excalidraw/tldraw).
 * Returns true if a document was restored, false otherwise.
 */
export function loadAutoSave(): boolean {
    try {
        const metaRaw = localStorage.getItem(META_KEY);
        if (!metaRaw) return false;
        const meta: AutoSaveMeta = JSON.parse(metaRaw);
        // Skip truly empty documents (no elements AND no slides beyond default)
        const hasSlides = meta.docType === 'slides' || (meta.slideCount && meta.slideCount > 0);
        if (meta.elementCount === 0 && !hasSlides) return false;

        const raw = localStorage.getItem(AUTOSAVE_KEY);
        if (!raw) return false;

        const doc: SlideDocument = JSON.parse(raw);
        loadDocument(doc);
        // Update drawing name from saved metadata
        if (meta.docName && meta.docName !== 'Untitled') {
            setDrawingId(meta.docName);
        }
        // Restore view state and active slide after loadDocument's deferred zoomToFitSlide (100ms)
        setTimeout(() => {
            if (meta.activeSlideIndex != null && meta.activeSlideIndex >= 0
                && meta.activeSlideIndex < store.slides.length) {
                setActiveSlide(meta.activeSlideIndex, true);
            }
            if (meta.viewState) {
                setViewState(meta.viewState);
            }
        }, 150);
        setStore('isDirty', false);
        return true;
    } catch (e) {
        console.error('[auto-save] restore failed:', e);
        return false;
    }
}

// ── Internals ───────────────────────────────────────────────

interface AutoSaveMeta {
    timestamp: string;
    tabId: string;
    docName: string;
    elementCount: number;
    sizeBytes: number;
    viewState?: { scale: number; panX: number; panY: number };
    activeSlideIndex?: number;
    docType?: 'infinite' | 'slides';
    slideCount?: number;
}

function scheduleAutoSave(): void {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(performAutoSave, DEBOUNCE_MS);
}

function performAutoSave(): void {
    // Don't save pristine/empty documents
    if (!store.isDirty) return;

    _isSaving = true;
    try {
        // Sync canvas background/dimensions into slides array
        saveActiveSlide();

        const slideDoc: SlideDocument = {
            version: 4,
            metadata: {
                name: drawingId(),
                updatedAt: new Date().toISOString(),
                docType: store.docType,
            },
            elements: JSON.parse(JSON.stringify(store.elements ?? [])),
            layers: JSON.parse(JSON.stringify(store.layers ?? [])),
            slides: JSON.parse(JSON.stringify(store.slides ?? [])),
            globalSettings: JSON.parse(JSON.stringify(store.globalSettings ?? {})),
            gridSettings: JSON.parse(JSON.stringify(store.gridSettings ?? {})),
            states: JSON.parse(JSON.stringify(store.states ?? [])),
            symbols: JSON.parse(JSON.stringify(store.symbols ?? [])),
            graphicStyles: JSON.parse(JSON.stringify(store.graphicStyles ?? [])),
            artboards: JSON.parse(JSON.stringify(store.artboards ?? [])),
        };

        const json = JSON.stringify(slideDoc);
        const sizeBytes = new Blob([json]).size;

        if (sizeBytes > SIZE_WARN_BYTES) {
            console.warn(`[auto-save] Document size: ${(sizeBytes / 1024 / 1024).toFixed(1)}MB`);
        }

        localStorage.setItem(AUTOSAVE_KEY, json);
        localStorage.setItem(META_KEY, JSON.stringify({
            timestamp: new Date().toISOString(),
            tabId,
            docName: drawingId(),
            elementCount: store.elements.length,
            sizeBytes,
            viewState: { ...store.viewState },
            activeSlideIndex: store.activeSlideIndex,
            docType: store.docType,
            slideCount: store.slides.length,
        } satisfies AutoSaveMeta));

    } catch (e: any) {
        if (e?.name === 'QuotaExceededError' || e?.code === 22) {
            showToast('Auto-save failed: document too large for localStorage', 'error');
        } else {
            console.error('[auto-save] save failed:', e);
        }
    } finally {
        _isSaving = false;
    }
}

function handleStorageEvent(e: StorageEvent): void {
    if (e.key === META_KEY && e.newValue) {
        try {
            const meta: AutoSaveMeta = JSON.parse(e.newValue);
            if (meta.tabId !== tabId) {
                showToast('Another tab is editing this document', 'info');
            }
        } catch { /* ignore */ }
    }
}
