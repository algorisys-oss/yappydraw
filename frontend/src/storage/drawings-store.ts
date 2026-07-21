/**
 * "My drawings" — a local, multi-document library in IndexedDB (HappyPaint
 * parity). Distinct from:
 *   • auto-save  (single `yappy:autosave` slot — crash recovery for the LIVE doc)
 *   • version-history (throttled ring of snapshots OF the live doc)
 *   • the backend "workspace" (server-stored files, needs an account)
 *
 * This is the offline-first gallery of drawings the user has explicitly kept.
 * Layout mirrors version-history so listing never loads document bodies:
 *   IndexedDB `yappy:drawings:index`  — DrawingMeta[] (id, name, thumb, counts…)
 *   IndexedDB `yappy:drawing:<id>`    — full SlideDocument JSON, one key each
 *   localStorage `yappy:drawings:active` — id of the gallery entry currently open
 *
 * The gallery is convenience, NOT the source of truth: pair it with .yappy
 * export / cloud sync for real durability. On first save we ask the browser to
 * make storage persistent (see persistent-storage.ts) to dodge best-effort /
 * 7-day-ITP eviction.
 */

import { idbGet, idbSet, idbDelete } from './idb-kv';
import { activeDrawingId, setActiveDrawingId } from './active-drawing';
import { buildCurrentDocument, clearAutoSave } from './auto-save';
import { captureDocThumbnail } from './doc-thumbnails';
import { requestPersistentStorage } from './persistent-storage';
import { loadDocument } from '../store/app-store';
import { drawingId, setDrawingId } from '../components/menu';
import type { SlideDocument } from '../types/slide-types';

const INDEX_KEY = 'yappy:drawings:index';
const DRAWING_KEY = (id: string) => `yappy:drawing:${id}`;

export interface DrawingMeta {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    docType?: string;
    elementCount: number;
    pageCount: number;
    sizeBytes: number;
    /** Small JPEG data-URL preview of the first page. */
    thumb?: string;
    isGame?: boolean;
}

// ── active-entry tracking (which gallery drawing is live) ───────────────────
// Lives in its own leaf module so app-store can clear it on load/new without
// importing this one (which imports app-store). Re-exported here so existing
// callers are unaffected.
export { activeDrawingId, setActiveDrawingId };

// ── helpers ─────────────────────────────────────────────────────────────────
function newId(): string {
    const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    return `d-${rand}`;
}

/** Self-contained game detection from a built SlideDocument (no store access). */
function docIsGame(doc: SlideDocument): boolean {
    const anyDoc = doc as any;
    return !!anyDoc.gameScript?.trim()
        || anyDoc.gameAuthoringMode === 'code'
        || (anyDoc.sceneBehaviors?.length ?? 0) > 0
        || (anyDoc.blueprints && Object.keys(anyDoc.blueprints).length > 0)
        || (Array.isArray(doc.elements) && doc.elements.some((e: any) => (e.behaviors?.length ?? 0) > 0));
}

async function readIndex(): Promise<DrawingMeta[]> {
    const idx = (await idbGet<DrawingMeta[]>(INDEX_KEY)) ?? [];
    // newest first, regardless of historical write order
    return idx.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

async function writeIndex(index: DrawingMeta[]): Promise<void> {
    await idbSet(INDEX_KEY, index);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Upsert a document into the gallery. When `id` matches an existing entry it is
 * updated in place (keeps createdAt); otherwise a new entry is created.
 */
export async function saveDrawingDoc(
    doc: SlideDocument,
    opts: { id?: string; name?: string; thumb?: string } = {},
): Promise<DrawingMeta> {
    // First save in a session: try to make storage durable (best-effort).
    void requestPersistentStorage();

    const json = JSON.stringify(doc);
    const now = new Date().toISOString();
    const index = await readIndex();
    const existing = opts.id ? index.find(d => d.id === opts.id) : undefined;
    const id = existing?.id ?? opts.id ?? newId();
    const name = (opts.name ?? doc.metadata?.name ?? existing?.name ?? 'Untitled').trim() || 'Untitled';

    const meta: DrawingMeta = {
        id,
        name,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        docType: doc.metadata?.docType ?? existing?.docType,
        elementCount: Array.isArray(doc.elements) ? doc.elements.length : 0,
        pageCount: Array.isArray(doc.slides) ? doc.slides.length : 0,
        sizeBytes: json.length,
        thumb: opts.thumb ?? existing?.thumb,
        isGame: docIsGame(doc),
    };

    await idbSet(DRAWING_KEY(id), json);
    const next = [meta, ...index.filter(d => d.id !== id)];
    await writeIndex(next);
    return meta;
}

/**
 * Snapshot the LIVE editor into the gallery. Updates the currently-open entry
 * (activeDrawingId) if there is one, else creates a new drawing and marks it
 * active. Returns the saved metadata.
 */
export async function saveCurrentToGallery(opts: { name?: string; forceNew?: boolean } = {}): Promise<DrawingMeta> {
    const doc = buildCurrentDocument();
    const name = opts.name ?? drawingId();
    if (name && name !== drawingId()) setDrawingId(name);
    let thumb: string | undefined;
    try { thumb = captureDocThumbnail(); } catch { /* preview is best-effort */ }
    const id = opts.forceNew ? undefined : (activeDrawingId() ?? undefined);
    const meta = await saveDrawingDoc(doc, { id, name, thumb });
    setActiveDrawingId(meta.id);
    // The document is now safely on disk, so it is no longer "unsaved". Without
    // this the next File → New still raised the unsaved-changes dialog right
    // after an explicit save. Also drops the crash-recovery slot, the same way
    // a workspace save does — it can only be staler than what we just wrote.
    clearAutoSave();
    return meta;
}

/** Gallery metadata, newest first (no document bodies loaded). */
export async function listDrawings(): Promise<DrawingMeta[]> {
    return readIndex();
}

/** Full document body for one drawing (null if missing). */
export async function getDrawingDoc(id: string): Promise<SlideDocument | null> {
    const json = await idbGet<string>(DRAWING_KEY(id));
    if (!json) return null;
    try { return JSON.parse(json) as SlideDocument; } catch { return null; }
}

/** Load a gallery drawing into the editor and mark it the active entry. */
export async function openDrawing(id: string): Promise<boolean> {
    const doc = await getDrawingDoc(id);
    if (!doc) return false;
    try {
        loadDocument(doc);
        const index = await readIndex();
        const meta = index.find(d => d.id === id);
        setDrawingId(doc.metadata?.name || meta?.name || 'Untitled');
        setActiveDrawingId(id);
        return true;
    } catch (e) {
        console.error('[drawings-store] open failed:', e);
        return false;
    }
}

export async function renameDrawing(id: string, name: string): Promise<void> {
    const clean = name.trim() || 'Untitled';
    const index = await readIndex();
    const meta = index.find(d => d.id === id);
    if (!meta) return;
    meta.name = clean;
    meta.updatedAt = new Date().toISOString();
    await writeIndex(index);
    // keep the stored document's own metadata name in sync
    const doc = await getDrawingDoc(id);
    if (doc) {
        doc.metadata = { ...doc.metadata, name: clean };
        await idbSet(DRAWING_KEY(id), JSON.stringify(doc));
    }
    if (activeDrawingId() === id) setDrawingId(clean);
}

export async function duplicateDrawing(id: string): Promise<DrawingMeta | null> {
    const doc = await getDrawingDoc(id);
    if (!doc) return null;
    const index = await readIndex();
    const src = index.find(d => d.id === id);
    const name = `${src?.name ?? doc.metadata?.name ?? 'Untitled'} copy`;
    const copy: SlideDocument = { ...doc, metadata: { ...doc.metadata, name } };
    return saveDrawingDoc(copy, { name, thumb: src?.thumb });
}

export async function deleteDrawing(id: string): Promise<void> {
    const index = await readIndex();
    await writeIndex(index.filter(d => d.id !== id));
    await idbDelete(DRAWING_KEY(id));
    if (activeDrawingId() === id) setActiveDrawingId(null);
}

/** Count of saved drawings (cheap — index only). */
export async function countDrawings(): Promise<number> {
    return (await readIndex()).length;
}
