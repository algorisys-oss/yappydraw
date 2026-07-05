import { type Component, Show, For, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { X, History, RotateCcw, Trash2, Camera } from "lucide-solid";
import { listVersions, restoreVersion, deleteVersion, snapshotVersionNow, type VersionMeta } from "../storage/version-history";
import { buildCurrentDocument } from "../storage/auto-save";
import { store } from "../store/app-store";
import { drawingId } from "./menu";
import { showToast } from "./toast";
import "./version-history-dialog.css";

interface VersionHistoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const timeAgo = (iso: string): string => {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    return `${Math.floor(s / 86400)} d ago`;
};

const VersionHistoryDialog: Component<VersionHistoryDialogProps> = (props) => {
    const [versions, setVersions] = createSignal<VersionMeta[]>([]);
    const [loading, setLoading] = createSignal(false);

    const refresh = async () => {
        setLoading(true);
        try { setVersions(await listVersions()); } finally { setLoading(false); }
    };

    createEffect(() => { if (props.isOpen) refresh(); });

    const handleSnapshot = async () => {
        const doc = buildCurrentDocument();
        await snapshotVersionNow(JSON.stringify(doc), {
            name: drawingId(),
            docType: store.docType,
            elementCount: store.elements.length,
            pageCount: store.slides.length,
        }, 'manual');
        showToast('Snapshot saved', 'success');
        refresh();
    };

    const handleRestore = async (v: VersionMeta) => {
        if (!confirm(`Restore "${v.name}" from ${timeAgo(v.timestamp)}? The current document is replaced (undo works).`)) return;
        const ok = await restoreVersion(v.id);
        showToast(ok ? 'Version restored' : 'Could not restore that version', ok ? 'success' : 'error');
        if (ok) props.onClose();
    };

    const handleDelete = async (v: VersionMeta, e: Event) => {
        e.stopPropagation();
        await deleteVersion(v.id);
        refresh();
    };

    return (
        <Show when={props.isOpen}>
            <Portal>
                <div class="vh-overlay" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') props.onClose(); }}>
                    <div class="vh-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="vh-header">
                            <div class="vh-title"><History size={16} /><h2>Version History</h2></div>
                            <div class="vh-header-actions">
                                <button class="vh-snapshot" type="button" onClick={handleSnapshot} title="Save a snapshot of the current document now">
                                    <Camera size={14} /> Snapshot now
                                </button>
                                <button class="vh-close" type="button" onClick={props.onClose}><X size={18} /></button>
                            </div>
                        </div>
                        <div class="vh-body">
                            <Show when={!loading()} fallback={<div class="vh-empty">Loading…</div>}>
                                <Show when={versions().length > 0} fallback={
                                    <div class="vh-empty">
                                        No versions yet. Snapshots are recorded automatically every few
                                        minutes while you edit — or take one now with "Snapshot now".
                                    </div>
                                }>
                                    <For each={versions()}>
                                        {(v) => (
                                            <div class="vh-item" onClick={() => handleRestore(v)} title="Click to restore this version">
                                                <div class="vh-item-main">
                                                    <span class="vh-item-name">
                                                        {v.name || 'Untitled'}
                                                        <Show when={v.label}><span class="vh-badge">{v.label}</span></Show>
                                                    </span>
                                                    <span class="vh-item-meta">
                                                        {timeAgo(v.timestamp)} · {v.pageCount} page{v.pageCount === 1 ? '' : 's'} · {v.elementCount} element{v.elementCount === 1 ? '' : 's'} · {(v.sizeBytes / 1024).toFixed(0)} KB
                                                    </span>
                                                </div>
                                                <div class="vh-item-actions">
                                                    <button class="vh-icon-btn" title="Restore" onClick={(e) => { e.stopPropagation(); handleRestore(v); }}>
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    <button class="vh-icon-btn vh-danger" title="Delete version" onClick={(e) => handleDelete(v, e)}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </Show>
                            </Show>
                        </div>
                        <div class="vh-footer">Snapshots: every ~3 min while editing, newest 15 kept, stored locally (IndexedDB).</div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default VersionHistoryDialog;
