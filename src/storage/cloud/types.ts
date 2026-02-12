/**
 * Cloud Storage Provider — Core Type Definitions
 *
 * All cloud storage providers (Google Drive, Dropbox, etc.) implement
 * the CloudStorageProvider interface. The UI layer codes against this
 * interface — never against a specific provider.
 *
 * See docs/cloud-storage.md for the full technical specification.
 */

import type { SlideDocument } from '../../types/slide-types';

// ── File & Folder Metadata ──────────────────────────────────

/** Metadata about a stored file (not the document content itself). */
export interface CloudFileInfo {
    id: string;                    // Provider-specific file ID
    name: string;                  // Display name (without extension)
    mimeType?: string;
    size?: number;                 // Bytes
    createdAt?: string;            // ISO 8601
    updatedAt?: string;            // ISO 8601
    path?: string;                 // Full path (e.g. "/YappyDraw/diagram.yappy")
    thumbnailUrl?: string;
    shared?: boolean;
    parentFolderId?: string;
    providerMetadata?: Record<string, unknown>;
}

/** Folder metadata for browsing. */
export interface FolderInfo {
    id: string;
    name: string;
    path?: string;
    parentId?: string;
}

// ── Configuration ───────────────────────────────────────────

/** Per-provider configuration, persisted in localStorage. */
export interface ProviderConfig {
    providerId: string;            // e.g. "google-drive"
    displayName: string;
    folderId?: string;             // Default save folder ID
    folderPath?: string;           // Human-readable path
    teamDriveId?: string;          // Google Shared Drive ID
    autoSync?: boolean;
    syncIntervalMs?: number;       // Default: 30000
}

// ── Auth ────────────────────────────────────────────────────

/** Reactive auth state exposed by each provider. */
export interface AuthState {
    isAuthenticated: boolean;
    userEmail?: string;
    userName?: string;
    userAvatar?: string;
    expiresAt?: number;            // Token expiry (Unix ms)
}

// ── List / Pagination ───────────────────────────────────────

/** Options for listing files from a provider. */
export interface ListOptions {
    folderId?: string;
    query?: string;
    pageSize?: number;             // Default: 50
    pageToken?: string;            // Cursor for next page
    orderBy?: 'name' | 'modifiedTime' | 'createdTime';
    includeSharedDrives?: boolean;
    teamDriveId?: string;
}

/** Paginated file list result. */
export interface ListResult {
    files: CloudFileInfo[];
    nextPageToken?: string;
    hasMore: boolean;
}

// ── Save ────────────────────────────────────────────────────

/** Options for the save operation. */
export interface SaveOptions {
    folderId?: string;             // Override default folder
    fileName?: string;
    description?: string;
    compress?: boolean;            // GZIP compress (default: true)
    teamDriveId?: string;
    overwriteFileId?: string;      // Update existing file
}

// ── Provider Interface ──────────────────────────────────────

/**
 * The main interface all cloud storage providers implement.
 *
 * UI components program against this — never against a specific
 * provider's API. Adding a new provider (Dropbox, GitHub, etc.)
 * means implementing this interface and registering it.
 */
export interface CloudStorageProvider {
    // ── Identity ──
    readonly id: string;
    readonly displayName: string;
    readonly icon: string;
    readonly supportsAuth: boolean;
    readonly supportsFolders: boolean;
    readonly supportsSharedDrives: boolean;

    // ── Auth ──
    getAuthState(): AuthState;
    signIn(): Promise<void>;
    signOut(): Promise<void>;
    /** Subscribe to auth state changes. Returns an unsubscribe function. */
    onAuthStateChange(cb: (state: AuthState) => void): () => void;

    // ── CRUD ──
    save(doc: SlideDocument, options?: SaveOptions): Promise<CloudFileInfo>;
    load(fileId: string): Promise<SlideDocument>;
    delete(fileId: string): Promise<void>;
    list(options?: ListOptions): Promise<ListResult>;

    // ── Folders ──
    listFolders(parentId?: string): Promise<FolderInfo[]>;
    createFolder(name: string, parentId?: string): Promise<FolderInfo>;

    // ── Shared Drives (optional — not all providers support this) ──
    listSharedDrives?(): Promise<{ id: string; name: string }[]>;

    // ── Lifecycle ──
    initialize(config?: ProviderConfig): Promise<void>;
    dispose(): void;
}

// ── Registry ────────────────────────────────────────────────

/** Entry in the provider registry. */
export interface ProviderRegistration {
    id: string;
    displayName: string;
    icon: string;
    factory: (config?: ProviderConfig) => CloudStorageProvider;
    featureFlag?: string;
}
