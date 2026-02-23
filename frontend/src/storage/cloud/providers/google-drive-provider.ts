/**
 * Google Drive Storage Provider
 *
 * Implements CloudStorageProvider for Google Drive API v3.
 * Supports personal Drive and Shared Drives (Google Workspace).
 * Auth via PKCE OAuth (see google-drive-auth.ts).
 *
 * Files are stored as GZIP-compressed .yappy files in a "YappyDraw"
 * folder (auto-created on first save).
 *
 * See docs/cloud-storage.md §9 for API details.
 */

import type {
    AuthState,
    CloudFileInfo,
    CloudStorageProvider,
    FolderInfo,
    ListOptions,
    ListResult,
    ProviderConfig,
    SaveOptions,
} from '../types';
import type { SlideDocument } from '../../../types/slide-types';
import { compressDocument, decompressToDocument } from '../compression';
import { saveTokens, loadTokens, clearTokens, type StoredTokens } from '../token-store';
import { initiateGoogleAuth } from './google-drive-auth';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const YAPPY_FOLDER_NAME = 'YappyDraw';
const PROVIDER_ID = 'google-drive';

export class GoogleDriveProvider implements CloudStorageProvider {
    // ── Identity ───────────────────────────────────────────

    readonly id = PROVIDER_ID;
    readonly displayName = 'Google Drive';
    readonly icon = 'Cloud';
    readonly supportsAuth = true;
    readonly supportsFolders = true;
    readonly supportsSharedDrives = true;

    // ── State ──────────────────────────────────────────────

    private tokens: StoredTokens | null = null;
    private config: ProviderConfig | null = null;
    private defaultFolderId: string | null = null;
    private authCallbacks = new Set<(state: AuthState) => void>();

    constructor(config?: ProviderConfig) {
        this.config = config ?? null;
    }

    // ── Lifecycle ──────────────────────────────────────────

    async initialize(config?: ProviderConfig): Promise<void> {
        this.config = config ?? this.config;
        this.tokens = loadTokens(PROVIDER_ID);
        if (this.tokens) {
            this.notifyAuthChange();
        }
    }

    dispose(): void {
        this.authCallbacks.clear();
    }

    // ── Auth ───────────────────────────────────────────────

    getAuthState(): AuthState {
        if (!this.tokens) {
            return { isAuthenticated: false };
        }
        return {
            isAuthenticated: true,
            userEmail: this.tokens.userEmail,
            userName: this.tokens.userName,
            userAvatar: this.tokens.userAvatar,
            expiresAt: this.tokens.expiresAt,
        };
    }

    async signIn(): Promise<void> {
        const sharedDrive = !!this.config?.teamDriveId;
        this.tokens = await initiateGoogleAuth({ sharedDrive });
        saveTokens(PROVIDER_ID, this.tokens);
        this.notifyAuthChange();
    }

    async signOut(): Promise<void> {
        // Revoke token at Google (best-effort)
        if (this.tokens) {
            try {
                await fetch(
                    `https://oauth2.googleapis.com/revoke?token=${this.tokens.accessToken}`,
                    { method: 'POST' }
                );
            } catch {
                // best-effort
            }
        }
        clearTokens(PROVIDER_ID);
        this.tokens = null;
        this.defaultFolderId = null;
        this.notifyAuthChange();
    }

    onAuthStateChange(cb: (state: AuthState) => void): () => void {
        this.authCallbacks.add(cb);
        return () => { this.authCallbacks.delete(cb); };
    }

    // ── Save ───────────────────────────────────────────────

    async save(doc: SlideDocument, options?: SaveOptions): Promise<CloudFileInfo> {
        this.ensureAuth();

        const compress = options?.compress !== false;
        const baseName = options?.fileName || doc.metadata?.name || 'untitled';
        const fileName = baseName + (compress ? '.yappy' : '.json');

        let body: Blob;
        let mimeType: string;
        if (compress) {
            body = await compressDocument(doc);
            mimeType = 'application/gzip';
        } else {
            body = new Blob([JSON.stringify(doc)], { type: 'application/json' });
            mimeType = 'application/json';
        }

        // Update existing file
        if (options?.overwriteFileId) {
            return this.updateFile(options.overwriteFileId, body, mimeType, fileName);
        }

        // Create new file
        const folderId = options?.folderId || await this.ensureDefaultFolder();
        return this.createFile(fileName, body, mimeType, folderId, options?.teamDriveId);
    }

    // ── Load ───────────────────────────────────────────────

    async load(fileId: string): Promise<SlideDocument> {
        this.ensureAuth();

        const response = await this.fetchWithAuth(
            `${DRIVE_API}/files/${fileId}?alt=media`,
        );
        const blob = await response.blob();

        // Try decompressing first; fall back to plain JSON
        try {
            return await decompressToDocument(blob);
        } catch {
            const text = await blob.text();
            return JSON.parse(text);
        }
    }

    // ── Delete ─────────────────────────────────────────────

    async delete(fileId: string): Promise<void> {
        this.ensureAuth();
        await this.fetchWithAuth(`${DRIVE_API}/files/${fileId}`, { method: 'DELETE' });
    }

    // ── List ───────────────────────────────────────────────

    async list(options?: ListOptions): Promise<ListResult> {
        this.ensureAuth();

        const folderId = options?.folderId || await this.ensureDefaultFolder();

        // Build query
        let q = `'${folderId}' in parents and trashed = false`;
        q += ` and (mimeType = 'application/gzip' or mimeType = 'application/json')`;
        if (options?.query) {
            q += ` and name contains '${options.query.replace(/'/g, "\\'")}'`;
        }

        const orderBy = options?.orderBy === 'name' ? 'name'
            : options?.orderBy === 'createdTime' ? 'createdTime desc'
            : 'modifiedTime desc';

        const params = new URLSearchParams({
            q,
            fields: 'nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,thumbnailLink,shared)',
            orderBy,
            pageSize: String(options?.pageSize || 50),
        });

        if (options?.pageToken) {
            params.set('pageToken', options.pageToken);
        }

        // Shared Drive support
        if (options?.teamDriveId || options?.includeSharedDrives) {
            params.set('supportsAllDrives', 'true');
            params.set('includeItemsFromAllDrives', 'true');
            if (options?.teamDriveId) {
                params.set('corpora', 'drive');
                params.set('driveId', options.teamDriveId);
            }
        }

        const data = await this.fetchJson(`${DRIVE_API}/files?${params}`);

        return {
            files: (data.files || []).map(mapDriveFile),
            nextPageToken: data.nextPageToken,
            hasMore: !!data.nextPageToken,
        };
    }

    // ── Folders ────────────────────────────────────────────

    async listFolders(parentId?: string): Promise<FolderInfo[]> {
        this.ensureAuth();

        const pid = parentId || 'root';
        const q = `'${pid}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const params = new URLSearchParams({
            q,
            fields: 'files(id,name,parents)',
            orderBy: 'name',
            pageSize: '100',
        });

        const data = await this.fetchJson(`${DRIVE_API}/files?${params}`);
        return (data.files || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            parentId: f.parents?.[0],
        }));
    }

    async createFolder(name: string, parentId?: string): Promise<FolderInfo> {
        this.ensureAuth();

        const metadata: Record<string, any> = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
        };
        if (parentId) metadata.parents = [parentId];

        const response = await this.fetchWithAuth(`${DRIVE_API}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata),
        });
        const data = await response.json();
        return { id: data.id, name: data.name, parentId };
    }

    // ── Shared Drives ──────────────────────────────────────

    async listSharedDrives(): Promise<{ id: string; name: string }[]> {
        this.ensureAuth();

        const data = await this.fetchJson(
            `${DRIVE_API.replace('/v3', '')}/v3/drives?pageSize=100&fields=drives(id,name)`
        );
        return (data.drives || []).map((d: any) => ({ id: d.id, name: d.name }));
    }

    // ── Conflict Detection ─────────────────────────────────

    /**
     * Check if a file has been modified externally since a known timestamp.
     * Returns true if the remote file is newer (conflict detected).
     */
    async checkConflict(fileId: string, lastKnownModified: string): Promise<boolean> {
        this.ensureAuth();
        const data = await this.fetchJson(
            `${DRIVE_API}/files/${fileId}?fields=modifiedTime`
        );
        return data.modifiedTime !== lastKnownModified;
    }

    // ── Private: File Operations ───────────────────────────

    private async createFile(
        name: string,
        body: Blob,
        mimeType: string,
        folderId: string,
        teamDriveId?: string,
    ): Promise<CloudFileInfo> {
        const metadata = { name, mimeType, parents: [folderId] };
        const form = new FormData();
        form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
        );
        form.append('file', body);

        let url = `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,modifiedTime`;
        if (teamDriveId) url += '&supportsAllDrives=true';

        const response = await this.fetchWithAuth(url, {
            method: 'POST',
            body: form,
        });
        const data = await response.json();
        return mapDriveFile(data);
    }

    private async updateFile(
        fileId: string,
        body: Blob,
        mimeType: string,
        name: string,
    ): Promise<CloudFileInfo> {
        // Update metadata (name)
        await this.fetchWithAuth(`${DRIVE_API}/files/${fileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });

        // Update content
        const response = await this.fetchWithAuth(
            `${DRIVE_UPLOAD}/files/${fileId}?uploadType=media&fields=id,name,mimeType,size,createdTime,modifiedTime`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': mimeType },
                body,
            },
        );
        const data = await response.json();
        return mapDriveFile(data);
    }

    // ── Private: Default Folder ────────────────────────────

    private async ensureDefaultFolder(): Promise<string> {
        // Use configured folder if set
        if (this.config?.folderId) return this.config.folderId;
        // Use cached folder
        if (this.defaultFolderId) return this.defaultFolderId;

        // Search for existing YappyDraw folder
        const q = `name = '${YAPPY_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false`;
        const data = await this.fetchJson(
            `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
        );

        if (data.files?.length > 0) {
            this.defaultFolderId = data.files[0].id;
        } else {
            // Create the folder
            const folder = await this.createFolder(YAPPY_FOLDER_NAME);
            this.defaultFolderId = folder.id;
        }

        return this.defaultFolderId!;
    }

    // ── Private: HTTP ──────────────────────────────────────

    private ensureAuth(): void {
        if (!this.tokens || this.tokens.expiresAt < Date.now()) {
            this.tokens = null;
            clearTokens(PROVIDER_ID);
            this.notifyAuthChange();
            throw new Error('Session expired. Please sign in to Google Drive again.');
        }
    }

    private async fetchWithAuth(url: string, init?: RequestInit): Promise<Response> {
        this.ensureAuth();

        const response = await fetch(url, {
            ...init,
            headers: {
                Authorization: `Bearer ${this.tokens!.accessToken}`,
                ...(init?.headers as Record<string, string> | undefined),
            },
        });

        if (response.status === 401) {
            this.tokens = null;
            clearTokens(PROVIDER_ID);
            this.notifyAuthChange();
            throw new Error('Session expired. Please sign in to Google Drive again.');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            const message = error.error?.message || `Google Drive error: ${response.status}`;
            throw new Error(message);
        }

        return response;
    }

    private async fetchJson(url: string): Promise<any> {
        const response = await this.fetchWithAuth(url);
        return response.json();
    }

    private notifyAuthChange(): void {
        const state = this.getAuthState();
        for (const cb of this.authCallbacks) {
            cb(state);
        }
    }
}

// ── Helpers ────────────────────────────────────────────────

function mapDriveFile(f: any): CloudFileInfo {
    return {
        id: f.id,
        name: f.name?.replace(/\.(yappy|json)$/i, '') || f.name,
        mimeType: f.mimeType,
        size: f.size ? parseInt(f.size, 10) : undefined,
        createdAt: f.createdTime,
        updatedAt: f.modifiedTime,
        thumbnailUrl: f.thumbnailLink,
        shared: f.shared,
    };
}
