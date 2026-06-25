/**
 * Cloud Storage Dialog
 *
 * Main dialog for saving to / loading from cloud storage providers.
 * Handles auth, file browsing, save with filename, and delete with
 * confirmation. Matches existing YappyDraw dialog patterns.
 */

import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import {
    X, Cloud, FileText, Trash2, FolderOpen, Loader2, AlertCircle, LogOut,
} from 'lucide-solid';
import { cloudStorageManager } from '../storage/cloud';
import type { AuthState, CloudFileInfo } from '../storage/cloud/types';
import type { SlideDocument } from '../types/slide-types';
import { store } from '../store/app-store';
import { saveActiveSlide } from '../store/app-store';
import { showToast } from './toast';
import './cloud-storage-dialog.css';

export type CloudDialogMode = 'save' | 'load';

interface CloudStorageDialogProps {
    isOpen: boolean;
    mode: CloudDialogMode;
    onClose: () => void;
    onLoad: (fileId: string) => void;
    onSaveComplete: (fileInfo: CloudFileInfo) => void;
    currentFileName?: string;
}

export function CloudStorageDialog(props: CloudStorageDialogProps) {
    const [authState, setAuthState] = createSignal<AuthState>({ isAuthenticated: false });
    const [files, setFiles] = createSignal<CloudFileInfo[]>([]);
    const [loading, setLoading] = createSignal(false);
    const [error, setError] = createSignal('');
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedFileId, setSelectedFileId] = createSignal<string | null>(null);
    const [saveFileName, setSaveFileName] = createSignal('');
    const [saving, setSaving] = createSignal(false);
    const [signingIn, setSigningIn] = createSignal(false);
    const [nextPageToken, setNextPageToken] = createSignal<string | undefined>();
    const [confirmDeleteId, setConfirmDeleteId] = createSignal<string | null>(null);

    // ── Keyboard: Escape to close ──────────────────────

    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    if (confirmDeleteId()) {
                        setConfirmDeleteId(null);
                    } else {
                        props.onClose();
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    // ── Sync auth state on open ────────────────────────

    createEffect(() => {
        if (props.isOpen) {
            const state = cloudStorageManager.getAuthState();
            setAuthState(state);
            setError('');
            setConfirmDeleteId(null);
            setSaveFileName(props.currentFileName || 'untitled');

            if (state.isAuthenticated) {
                loadFiles();
            }

            // Subscribe to auth changes
            const provider = cloudStorageManager.getActiveProvider();
            if (provider) {
                const unsub = provider.onAuthStateChange((s) => {
                    setAuthState(s);
                    if (s.isAuthenticated && files().length === 0) {
                        loadFiles();
                    }
                });
                onCleanup(unsub);
            }
        }
    });

    // ── Data fetching ──────────────────────────────────

    async function loadFiles(pageToken?: string) {
        setLoading(true);
        setError('');
        try {
            const result = await cloudStorageManager.list({
                query: searchQuery() || undefined,
                pageToken,
                pageSize: 50,
            });
            if (pageToken) {
                setFiles((prev) => [...prev, ...result.files]);
            } else {
                setFiles(result.files);
            }
            setNextPageToken(result.nextPageToken);
        } catch (e: any) {
            setError(e.message || 'Failed to load files');
        } finally {
            setLoading(false);
        }
    }

    // ── Actions ────────────────────────────────────────

    async function handleSignIn() {
        setSigningIn(true);
        setError('');
        try {
            // Ensure Google Drive provider is active
            const provider = cloudStorageManager.getActiveProvider();
            if (!provider) {
                await cloudStorageManager.setActiveProvider('google-drive');
            }
            await cloudStorageManager.signIn();
            setAuthState(cloudStorageManager.getAuthState());
            loadFiles();
        } catch (e: any) {
            setError(e.message || 'Sign-in failed');
        } finally {
            setSigningIn(false);
        }
    }

    async function handleSignOut() {
        try {
            await cloudStorageManager.signOut();
            setAuthState({ isAuthenticated: false });
            setFiles([]);
        } catch (e: any) {
            setError(e.message || 'Sign-out failed');
        }
    }

    async function handleSave() {
        if (!saveFileName().trim()) return;
        setSaving(true);
        setError('');
        try {
            // Sync current slide state before saving
            saveActiveSlide();

            // Build SlideDocument from store (same as menu.tsx save)
            const doc: SlideDocument = {
                version: 4,
                metadata: {
                    name: saveFileName().trim(),
                    updatedAt: new Date().toISOString(),
                    docType: store.docType,
                },
                elements: JSON.parse(JSON.stringify(store.elements)),
                layers: JSON.parse(JSON.stringify(store.layers)),
                slides: JSON.parse(JSON.stringify(store.slides)),
                globalSettings: JSON.parse(JSON.stringify(store.globalSettings)),
                gridSettings: JSON.parse(JSON.stringify(store.gridSettings)),
                states: JSON.parse(JSON.stringify(store.states)),
                symbols: JSON.parse(JSON.stringify(store.symbols)),
            };

            // If no file explicitly selected, find existing file with the same name
            let overwriteId = selectedFileId();
            if (!overwriteId) {
                const trimmedName = saveFileName().trim();
                const match = files().find((f) => f.name === trimmedName);
                if (match) overwriteId = match.id;
            }

            const fileInfo = await cloudStorageManager.save(doc, {
                fileName: saveFileName().trim(),
                overwriteFileId: overwriteId || undefined,
            });
            showToast(`Saved "${fileInfo.name}" to Google Drive`, 'success');
            props.onSaveComplete(fileInfo);
            props.onClose();
        } catch (e: any) {
            setError(e.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    async function handleLoad() {
        const fileId = selectedFileId();
        if (!fileId) return;
        setLoading(true);
        setError('');
        try {
            props.onLoad(fileId);
            props.onClose();
        } catch (e: any) {
            setError(e.message || 'Load failed');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(fileId: string) {
        setError('');
        try {
            await cloudStorageManager.delete(fileId);
            setFiles((prev) => prev.filter((f) => f.id !== fileId));
            if (selectedFileId() === fileId) setSelectedFileId(null);
            setConfirmDeleteId(null);
            showToast('File deleted', 'success');
        } catch (e: any) {
            setError(e.message || 'Delete failed');
        }
    }

    function handleSearch(e: Event) {
        const value = (e.target as HTMLInputElement).value;
        setSearchQuery(value);
        // Debounce search
        clearTimeout((handleSearch as any)._timer);
        (handleSearch as any)._timer = window.setTimeout(() => loadFiles(), 400);
    }

    function formatDate(iso?: string): string {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
            });
        } catch {
            return '';
        }
    }

    function formatSize(bytes?: number): string {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    // ── Render ─────────────────────────────────────────

    return (
        <Show when={props.isOpen}>
            <div class="cloud-backdrop" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="cloud-dialog" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div class="cloud-header">
                        <div class="cloud-header-left">
                            <h3>{props.mode === 'save' ? 'Save to Cloud' : 'Open from Cloud'}</h3>
                            <div class="cloud-provider-badge">
                                <Cloud size={14} />
                                Google Drive
                            </div>
                        </div>
                        <button class="cloud-close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Error banner */}
                    <Show when={error()}>
                        <div class="cloud-error">
                            <AlertCircle size={16} />
                            {error()}
                        </div>
                    </Show>

                    {/* Not authenticated */}
                    <Show when={!authState().isAuthenticated}>
                        <div class="cloud-signin">
                            <div class="cloud-signin-icon">
                                <Cloud size={32} />
                            </div>
                            <p>
                                Sign in with your Google account to save and load drawings
                                from your Google Drive. Your files stay in your own Drive.
                            </p>
                            <button
                                class="cloud-btn primary"
                                onClick={handleSignIn}
                                disabled={signingIn()}
                            >
                                <Show when={signingIn()} fallback={<Cloud size={16} />}>
                                    <Loader2 size={16} class="cloud-spin" />
                                </Show>
                                {signingIn() ? 'Connecting...' : 'Sign in with Google'}
                            </button>
                        </div>
                    </Show>

                    {/* Authenticated */}
                    <Show when={authState().isAuthenticated}>
                        {/* User info bar */}
                        <div class="cloud-auth">
                            <div class="cloud-auth-user">
                                <Show
                                    when={authState().userAvatar}
                                    fallback={
                                        <div class="cloud-auth-avatar-placeholder">
                                            {(authState().userName || authState().userEmail || '?')[0].toUpperCase()}
                                        </div>
                                    }
                                >
                                    <img
                                        class="cloud-auth-avatar"
                                        src={authState().userAvatar}
                                        alt=""
                                        referrerpolicy="no-referrer"
                                    />
                                </Show>
                                <div class="cloud-auth-info">
                                    <Show when={authState().userName}>
                                        <span class="cloud-auth-name">{authState().userName}</span>
                                    </Show>
                                    <Show when={authState().userEmail}>
                                        <span class="cloud-auth-email">{authState().userEmail}</span>
                                    </Show>
                                </div>
                            </div>
                            <div class="cloud-auth-actions">
                                <button class="cloud-btn" onClick={handleSignOut}>
                                    <LogOut size={14} />
                                    Sign out
                                </button>
                            </div>
                        </div>

                        {/* Search bar */}
                        <div class="cloud-toolbar">
                            <div class="cloud-folder-path">
                                <FolderOpen size={14} />
                                <span>YappyDraw</span>
                            </div>
                            <input
                                class="cloud-search"
                                type="text"
                                placeholder="Search drawings..."
                                value={searchQuery()}
                                onInput={handleSearch}
                            />
                        </div>

                        {/* File list */}
                        <Show
                            when={!loading() || files().length > 0}
                            fallback={
                                <div class="cloud-loading">
                                    <Loader2 size={24} class="cloud-spin" />
                                    Loading files...
                                </div>
                            }
                        >
                            <div class="cloud-file-list">
                                <Show when={files().length === 0 && !loading()}>
                                    <div class="cloud-empty">
                                        <Show
                                            when={searchQuery()}
                                            fallback="No drawings saved yet. Save your first drawing to get started."
                                        >
                                            No drawings matching "{searchQuery()}"
                                        </Show>
                                    </div>
                                </Show>

                                <For each={files()}>
                                    {(file) => (
                                        <div
                                            class={`cloud-file-item ${selectedFileId() === file.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedFileId(file.id);
                                                if (props.mode === 'save') {
                                                    setSaveFileName(file.name);
                                                }
                                            }}
                                            onDblClick={() => {
                                                if (props.mode === 'load') {
                                                    setSelectedFileId(file.id);
                                                    handleLoad();
                                                }
                                            }}
                                        >
                                            <div class="cloud-file-icon">
                                                <FileText size={18} />
                                            </div>
                                            <div class="cloud-file-info">
                                                <div class="cloud-file-name">{file.name}</div>
                                                <div class="cloud-file-meta">
                                                    {formatDate(file.updatedAt)}
                                                    <Show when={file.size}>
                                                        {' · '}{formatSize(file.size)}
                                                    </Show>
                                                </div>
                                            </div>
                                            <div class="cloud-file-actions">
                                                <button
                                                    class="cloud-file-action-btn danger"
                                                    title="Delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(file.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </For>

                                <Show when={nextPageToken()}>
                                    <div class="cloud-load-more">
                                        <button onClick={() => loadFiles(nextPageToken())}>
                                            Load more...
                                        </button>
                                    </div>
                                </Show>
                            </div>
                        </Show>

                        {/* Delete confirmation */}
                        <Show when={confirmDeleteId()}>
                            <div class="cloud-confirm">
                                <span>Delete this file permanently?</span>
                                <div class="cloud-confirm-actions">
                                    <button class="cloud-btn" onClick={() => setConfirmDeleteId(null)}>
                                        Cancel
                                    </button>
                                    <button
                                        class="cloud-btn danger"
                                        onClick={() => handleDelete(confirmDeleteId()!)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </Show>

                        {/* Footer */}
                        <div class="cloud-footer">
                            <Show when={props.mode === 'save'}>
                                <div class="cloud-footer-left">
                                    <input
                                        class="cloud-save-input"
                                        type="text"
                                        placeholder="File name"
                                        value={saveFileName()}
                                        onInput={(e) => setSaveFileName(e.currentTarget.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSave();
                                        }}
                                    />
                                </div>
                                <div class="cloud-footer-right">
                                    <button class="cloud-btn" onClick={props.onClose}>Cancel</button>
                                    <button
                                        class="cloud-btn primary"
                                        onClick={handleSave}
                                        disabled={saving() || !saveFileName().trim()}
                                    >
                                        <Show when={saving()} fallback={null}>
                                            <Loader2 size={14} class="cloud-spin" />
                                        </Show>
                                        {(selectedFileId() || files().some((f) => f.name === saveFileName().trim())) ? 'Overwrite' : 'Save'}
                                    </button>
                                </div>
                            </Show>

                            <Show when={props.mode === 'load'}>
                                <div class="cloud-footer-left" />
                                <div class="cloud-footer-right">
                                    <button class="cloud-btn" onClick={props.onClose}>Cancel</button>
                                    <button
                                        class="cloud-btn primary"
                                        onClick={handleLoad}
                                        disabled={!selectedFileId()}
                                    >
                                        Open
                                    </button>
                                </div>
                            </Show>
                        </div>
                    </Show>
                </div>
            </div>
        </Show>
    );
}
