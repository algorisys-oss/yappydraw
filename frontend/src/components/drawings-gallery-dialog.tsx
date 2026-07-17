import { type Component, Show, For, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { X, FolderOpen, Plus, Save, Copy, Trash2, Pencil, Check } from "lucide-solid";
import {
    listDrawings, openDrawing, renameDrawing, duplicateDrawing, deleteDrawing,
    saveCurrentToGallery, activeDrawingId, setActiveDrawingId, type DrawingMeta,
} from "../storage/drawings-store";
import { getStorageEstimate, isStoragePersisted, requestPersistentStorage } from "../storage/persistent-storage";
import { store } from "../store/app-store";
import { handleNew } from "./menu";
import { showToast } from "./toast";
import { onEscapeKey } from "../utils/use-escape";
import { showDrawingsGallery, setShowDrawingsGallery } from "./drawings-gallery-signal";
import "./drawings-gallery-dialog.css";

const timeAgo = (iso: string): string => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    return `${Math.floor(s / 86400)} d ago`;
};

const DrawingsGalleryDialog: Component = () => {
    const isOpen = () => showDrawingsGallery();
    const close = () => setShowDrawingsGallery(false);
    onEscapeKey(isOpen, close);

    const [items, setItems] = createSignal<DrawingMeta[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [editId, setEditId] = createSignal<string | null>(null);
    const [editName, setEditName] = createSignal('');
    const [hint, setHint] = createSignal('');

    const refresh = async () => {
        setLoading(true);
        try { setItems(await listDrawings()); } finally { setLoading(false); }
    };

    const refreshHint = async () => {
        const [persisted, est] = await Promise.all([isStoragePersisted(), getStorageEstimate()]);
        const used = est ? ` · ${(est.usageBytes / 1024 / 1024).toFixed(1)} MB used` : '';
        setHint(persisted
            ? `Stored locally (IndexedDB), marked durable${used}. Export or use cloud for backups.`
            : `Stored locally (IndexedDB)${used}. Install the app or export your work to keep it safe.`);
    };

    createEffect(() => { if (isOpen()) { refresh(); refreshHint(); } });

    const handleOpen = async (d: DrawingMeta) => {
        const ok = await openDrawing(d.id);
        if (ok) { showToast(`Opened "${d.name}"`, 'success'); close(); }
        else showToast('Could not open that drawing', 'error');
    };

    const handleSaveCurrent = async () => {
        if (store.elements.length === 0) { showToast('Nothing on the canvas to save', 'info'); return; }
        await requestPersistentStorage();
        const meta = await saveCurrentToGallery();
        showToast(`Saved "${meta.name}"`, 'success');
        refresh(); refreshHint();
    };

    const handleNewDrawing = async () => {
        // Don't lose unsaved work — snapshot the live canvas into the gallery first.
        if (store.elements.length > 0) await saveCurrentToGallery();
        setActiveDrawingId(null);          // next save becomes a fresh entry
        handleNew('slides');
        showToast('Started a new drawing', 'success');
        close();
    };

    const startRename = (d: DrawingMeta, e: Event) => {
        e.stopPropagation();
        setEditId(d.id); setEditName(d.name);
    };
    const commitRename = async (d: DrawingMeta) => {
        const name = editName().trim();
        if (name && name !== d.name) { await renameDrawing(d.id, name); refresh(); }
        setEditId(null);
    };

    const handleDuplicate = async (d: DrawingMeta, e: Event) => {
        e.stopPropagation();
        await duplicateDrawing(d.id);
        refresh();
    };

    const handleDelete = async (d: DrawingMeta, e: Event) => {
        e.stopPropagation();
        if (!confirm(`Delete "${d.name}"? This can't be undone.`)) return;
        await deleteDrawing(d.id);
        refresh();
    };

    return (
        <Show when={isOpen()}>
            <Portal>
                <div class="dg-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
                    <div class="dg-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="dg-header">
                            <div class="dg-title"><FolderOpen size={16} /><h2>My Drawings</h2>
                                <Show when={items().length > 0}><span class="dg-count">{items().length}</span></Show>
                            </div>
                            <div class="dg-header-actions">
                                <button class="dg-btn" type="button" onClick={handleSaveCurrent} title="Save the current canvas into the gallery">
                                    <Save size={14} /> Save current
                                </button>
                                <button class="dg-btn dg-primary" type="button" onClick={handleNewDrawing} title="Start a new blank drawing">
                                    <Plus size={14} /> New drawing
                                </button>
                                <button class="dg-close" type="button" onClick={close}><X size={18} /></button>
                            </div>
                        </div>

                        <div class="dg-body">
                            <Show when={!loading()} fallback={<div class="dg-empty">Loading…</div>}>
                                <Show when={items().length > 0} fallback={
                                    <div class="dg-empty">
                                        <FolderOpen size={40} style={{ opacity: '0.4' }} />
                                        <p>No saved drawings yet.</p>
                                        <p class="dg-empty-sub">Draw something, then <strong>Save current</strong> — it'll appear here to reopen anytime.</p>
                                    </div>
                                }>
                                    <div class="dg-grid">
                                        <For each={items()}>
                                            {(d) => (
                                                <div class="dg-card" classList={{ 'dg-active': activeDrawingId() === d.id }}
                                                    onClick={() => handleOpen(d)} title={`Open "${d.name}"`}>
                                                    <div class="dg-thumb">
                                                        <Show when={d.thumb} fallback={<div class="dg-thumb-empty"><FolderOpen size={22} /></div>}>
                                                            <img src={d.thumb} alt="" loading="lazy" />
                                                        </Show>
                                                        <Show when={d.isGame}><span class="dg-tag">Game</span></Show>
                                                    </div>
                                                    <div class="dg-card-body">
                                                        <Show when={editId() === d.id} fallback={
                                                            <span class="dg-name">{d.name}</span>
                                                        }>
                                                            <input class="dg-rename" value={editName()} autofocus
                                                                onClick={(e) => e.stopPropagation()}
                                                                onInput={(e) => setEditName(e.currentTarget.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') commitRename(d); if (e.key === 'Escape') setEditId(null); }}
                                                                onBlur={() => commitRename(d)} />
                                                        </Show>
                                                        <span class="dg-meta">{timeAgo(d.updatedAt)} · {d.pageCount} pg · {d.elementCount} el</span>
                                                    </div>
                                                    <div class="dg-actions">
                                                        <Show when={editId() === d.id}
                                                            fallback={<button class="dg-icon" title="Rename" onClick={(e) => startRename(d, e)}><Pencil size={13} /></button>}>
                                                            <button class="dg-icon" title="Save name" onClick={(e) => { e.stopPropagation(); commitRename(d); }}><Check size={13} /></button>
                                                        </Show>
                                                        <button class="dg-icon" title="Duplicate" onClick={(e) => handleDuplicate(d, e)}><Copy size={13} /></button>
                                                        <button class="dg-icon dg-danger" title="Delete" onClick={(e) => handleDelete(d, e)}><Trash2 size={13} /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </Show>
                        </div>

                        <div class="dg-footer">{hint()}</div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default DrawingsGalleryDialog;
