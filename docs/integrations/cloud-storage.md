# Cloud Storage — Technical Specification

## 1. Overview

YappyDraw is a local-first drawing application. All data lives in the browser (localStorage auto-save) or on disk (manual file download). This document specifies a **pluggable cloud storage provider system** that allows users to optionally save/load drawings from cloud services — starting with **Google Drive** (personal and Shared Drives).

### Design Goals

| Goal | Detail |
|------|--------|
| **Local-first** | localStorage auto-save continues unchanged. Cloud is opt-in. |
| **Static site** | No backend required for Google Drive. Auth uses OAuth 2.0 PKCE (client-side). |
| **Pluggable** | A `CloudStorageProvider` interface allows adding Dropbox, GitHub, CouchDB, etc. without touching UI. |
| **SaaS-ready** | The same interface can front a future backend API for multi-tenant SaaS. |

### What Does NOT Change

- `src/storage/auto-save.ts` — localStorage auto-save (1s debounce, multi-tab)
- `src/storage/file-system-storage.ts` — Express backend API client
- `src/storage/storage-interface.ts` — Legacy `StorageInterface` type
- `server.ts` — Express server for workspace persistence
- Manual file download (.yappy / .json)

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                │
│                                                                 │
│  Menu.tsx ─── LoadExportDialog ─── CloudStorageDialog           │
│                                     ├── CloudFileBrowser        │
│                                     ├── CloudFolderPicker       │
│                                     ├── CloudAuthButton         │
│                                     └── CloudSettingsSection    │
│  SettingsDialog ──────────────────── CloudSettingsSection        │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                     Manager Layer                               │
│                                                                 │
│  StorageManager (singleton)                                     │
│  ├── Active provider reference                                  │
│  ├── Config persistence (localStorage: yappy:cloud:config)      │
│  ├── Auto-sync orchestration (opt-in, 30s debounce)             │
│  └── Conflict detection (modifiedTime comparison)               │
│                                                                 │
│  ProviderRegistry                                               │
│  ├── register(id, factory)                                      │
│  ├── get(id) → ProviderRegistration                             │
│  └── getAll() → ProviderRegistration[]                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Provider Layer                                │
│                                                                 │
│  CloudStorageProvider interface                                  │
│  ├── GoogleDriveProvider (PKCE OAuth, Drive API v3)             │
│  ├── LocalDiskProvider (adapter over existing file download)    │
│  └── (future) DropboxProvider, GitHubProvider, BackendProvider  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                  Infrastructure Layer                            │
│                                                                 │
│  token-store.ts — OAuth token persistence + expiry check        │
│  compression.ts — Shared GZIP compress/decompress (reused)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure

All new code lives under `src/storage/cloud/`. Existing storage modules are untouched.

```
src/storage/
  auto-save.ts                        (existing — unchanged)
  file-system-storage.ts              (existing — unchanged)
  storage-interface.ts                (existing — unchanged)
  cloud/
    types.ts                          Core interfaces and types
    provider-registry.ts              Provider registry
    storage-manager.ts                Singleton orchestrator
    compression.ts                    Shared GZIP utilities
    token-store.ts                    OAuth token persistence
    index.ts                          Re-exports, default provider registration
    providers/
      local-disk-provider.ts          Adapter over existing file download
      google-drive-auth.ts            PKCE OAuth flow for Google
      google-drive-provider.ts        Google Drive API v3 implementation

src/components/
  cloud-storage-dialog.tsx            Main cloud storage dialog
  cloud-storage-dialog.css            Styles
  cloud-file-browser.tsx              File listing component
  cloud-folder-picker.tsx             Folder navigation/selection
  cloud-auth-button.tsx               Sign-in/out with user info
  cloud-settings-section.tsx          Cloud config in SettingsDialog

public/
  oauth-callback.html                 OAuth redirect handler (static page)
```

---

## 4. Type Definitions

### 4.1 CloudFileInfo

Metadata about a file stored in a cloud provider. Does not contain the document content itself.

```typescript
interface CloudFileInfo {
    id: string;                    // Provider-specific file ID
    name: string;                  // Display name (without extension)
    mimeType?: string;             // e.g. "application/gzip"
    size?: number;                 // Bytes
    createdAt?: string;            // ISO 8601
    updatedAt?: string;            // ISO 8601
    path?: string;                 // Full path (e.g. "/YappyDraw/diagram.yappy")
    thumbnailUrl?: string;         // Preview URL if available
    shared?: boolean;              // Whether shared with others
    parentFolderId?: string;       // Parent folder ID
    providerMetadata?: Record<string, unknown>;
}
```

### 4.2 ProviderConfig

Per-provider configuration persisted in localStorage.

```typescript
interface ProviderConfig {
    providerId: string;            // e.g. "google-drive"
    displayName: string;           // e.g. "Google Drive"
    folderId?: string;             // Default save folder ID
    folderPath?: string;           // Human-readable path (e.g. "YappyDraw")
    teamDriveId?: string;          // Google Shared Drive ID (if using org drive)
    autoSync?: boolean;            // Whether to auto-sync changes
    syncIntervalMs?: number;       // Debounce interval (default: 30000)
}
```

### 4.3 AuthState

Reactive auth state exposed by each provider.

```typescript
interface AuthState {
    isAuthenticated: boolean;
    userEmail?: string;
    userName?: string;
    userAvatar?: string;
    expiresAt?: number;            // Token expiry (Unix ms)
}
```

### 4.4 ListOptions & ListResult

Pagination and filtering for file listings.

```typescript
interface ListOptions {
    folderId?: string;
    query?: string;                // Search/filter
    pageSize?: number;             // Default: 50
    pageToken?: string;            // Cursor for next page
    orderBy?: 'name' | 'modifiedTime' | 'createdTime';
    includeSharedDrives?: boolean;
    teamDriveId?: string;
}

interface ListResult {
    files: CloudFileInfo[];
    nextPageToken?: string;
    hasMore: boolean;
}
```

### 4.5 SaveOptions

Options for the save operation.

```typescript
interface SaveOptions {
    folderId?: string;             // Override default folder
    fileName?: string;             // Override file name
    description?: string;          // File description/comment
    compress?: boolean;            // GZIP compress (default: true)
    teamDriveId?: string;          // Target Shared Drive
    overwriteFileId?: string;      // Update existing file instead of creating new
}
```

### 4.6 FolderInfo

Folder metadata for browsing.

```typescript
interface FolderInfo {
    id: string;
    name: string;
    path?: string;
    parentId?: string;
}
```

### 4.7 CloudStorageProvider (Main Interface)

Every provider implements this interface. The UI layer codes against this — never against a specific provider.

```typescript
interface CloudStorageProvider {
    // ── Identity ──
    readonly id: string;                    // e.g. "google-drive"
    readonly displayName: string;           // e.g. "Google Drive"
    readonly icon: string;                  // Icon identifier
    readonly supportsAuth: boolean;         // true for cloud, false for local-disk
    readonly supportsFolders: boolean;
    readonly supportsSharedDrives: boolean;

    // ── Auth ──
    getAuthState(): AuthState;
    signIn(): Promise<void>;
    signOut(): Promise<void>;
    onAuthStateChange(cb: (state: AuthState) => void): () => void;  // Returns unsubscribe

    // ── CRUD ──
    save(doc: SlideDocument, options?: SaveOptions): Promise<CloudFileInfo>;
    load(fileId: string): Promise<SlideDocument>;
    delete(fileId: string): Promise<void>;
    list(options?: ListOptions): Promise<ListResult>;

    // ── Folders ──
    listFolders(parentId?: string): Promise<FolderInfo[]>;
    createFolder(name: string, parentId?: string): Promise<FolderInfo>;

    // ── Shared Drives (optional) ──
    listSharedDrives?(): Promise<{ id: string; name: string }[]>;

    // ── Lifecycle ──
    initialize(config?: ProviderConfig): Promise<void>;
    dispose(): void;
}
```

### 4.8 ProviderRegistration

Entry in the provider registry.

```typescript
interface ProviderRegistration {
    id: string;
    displayName: string;
    icon: string;
    factory: (config?: ProviderConfig) => CloudStorageProvider;
    featureFlag?: string;          // Skip registration if flag is false
}
```

---

## 5. Provider Registry

Singleton registry where providers are registered at app startup.

```typescript
class ProviderRegistry {
    private providers = new Map<string, ProviderRegistration>();

    register(registration: ProviderRegistration): void {
        this.providers.set(registration.id, registration);
    }

    unregister(id: string): void {
        this.providers.delete(id);
    }

    get(id: string): ProviderRegistration | undefined {
        return this.providers.get(id);
    }

    getAll(): ProviderRegistration[] {
        return Array.from(this.providers.values());
    }

    createProvider(id: string, config?: ProviderConfig): CloudStorageProvider {
        const reg = this.providers.get(id);
        if (!reg) throw new Error(`Unknown provider: ${id}`);
        return reg.factory(config);
    }
}
```

Default registration at startup (`src/storage/cloud/index.ts`):

```typescript
import { features } from '../../config/features';

const registry = new ProviderRegistry();

// Always available
registry.register({
    id: 'local-disk',
    displayName: 'Local File',
    icon: 'HardDrive',
    factory: () => new LocalDiskProvider(),
});

// Google Drive (gated by feature flag)
if (features.enableGoogleDrive) {
    registry.register({
        id: 'google-drive',
        displayName: 'Google Drive',
        icon: 'Cloud',
        factory: (config) => new GoogleDriveProvider(config),
        featureFlag: 'enableGoogleDrive',
    });
}

export { registry };
export const storageManager = new StorageManager(registry);
```

---

## 6. Storage Manager

Singleton orchestrator between UI and providers. Manages the active provider, persists config, and handles auto-sync.

```typescript
class StorageManager {
    private registry: ProviderRegistry;
    private activeProvider: CloudStorageProvider | null = null;
    private config: ProviderConfig | null = null;
    private syncTimer: number | undefined;
    private syncFileId: string | null = null;

    private static CONFIG_KEY = 'yappy:cloud:config';

    constructor(registry: ProviderRegistry) {
        this.registry = registry;
    }

    // ── Provider management ──

    async setActiveProvider(providerId: string, config?: ProviderConfig): Promise<void> {
        if (this.activeProvider) {
            this.activeProvider.dispose();
        }
        this.activeProvider = this.registry.createProvider(providerId, config);
        this.config = config || { providerId, displayName: '' };
        await this.activeProvider.initialize(config);
        this.saveConfig();
    }

    getActiveProvider(): CloudStorageProvider | null {
        return this.activeProvider;
    }

    getAvailableProviders(): ProviderRegistration[] {
        return this.registry.getAll();
    }

    // ── Delegated CRUD ──

    async save(doc: SlideDocument, options?: SaveOptions): Promise<CloudFileInfo> {
        if (!this.activeProvider) throw new Error('No cloud provider configured');
        return this.activeProvider.save(doc, options);
    }

    async load(fileId: string): Promise<SlideDocument> {
        if (!this.activeProvider) throw new Error('No cloud provider configured');
        return this.activeProvider.load(fileId);
    }

    async delete(fileId: string): Promise<void> {
        if (!this.activeProvider) throw new Error('No cloud provider configured');
        return this.activeProvider.delete(fileId);
    }

    async list(options?: ListOptions): Promise<ListResult> {
        if (!this.activeProvider) throw new Error('No cloud provider configured');
        return this.activeProvider.list(options);
    }

    // ── Auth delegation ──

    getAuthState(): AuthState {
        return this.activeProvider?.getAuthState() ?? { isAuthenticated: false };
    }

    async signIn(): Promise<void> {
        if (!this.activeProvider) throw new Error('No cloud provider configured');
        return this.activeProvider.signIn();
    }

    async signOut(): Promise<void> {
        if (!this.activeProvider) throw new Error('No cloud provider configured');
        return this.activeProvider.signOut();
    }

    // ── Config persistence ──

    saveConfig(): void {
        if (this.config) {
            localStorage.setItem(StorageManager.CONFIG_KEY, JSON.stringify(this.config));
        }
    }

    loadConfig(): ProviderConfig | null {
        const raw = localStorage.getItem(StorageManager.CONFIG_KEY);
        return raw ? JSON.parse(raw) : null;
    }

    clearConfig(): void {
        localStorage.removeItem(StorageManager.CONFIG_KEY);
        this.config = null;
    }

    // ── Auto-sync ──

    enableAutoSync(fileId: string, intervalMs: number = 30000): void {
        this.syncFileId = fileId;
        // Caller (menu.tsx) watches store.isDirty and calls this
        // The actual debounced save is triggered from the effect
    }

    disableAutoSync(): void {
        this.syncFileId = null;
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
            this.syncTimer = undefined;
        }
    }

    getSyncFileId(): string | null {
        return this.syncFileId;
    }
}
```

---

## 7. Compression Utilities

Extracted into a shared module so both `file-system-storage.ts` and cloud providers reuse the same logic.

```typescript
// src/storage/cloud/compression.ts

import type { SlideDocument } from '../../types/slide-types';

/**
 * GZIP-compress a SlideDocument into a Blob.
 * Uses the browser's CompressionStream API (supported in all modern browsers).
 */
export async function compressDocument(doc: SlideDocument): Promise<Blob> {
    const json = JSON.stringify(doc);
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).blob();
}

/**
 * Decompress a GZIP blob back into a SlideDocument.
 */
export async function decompressToDocument(blob: Blob): Promise<SlideDocument> {
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
}
```

---

## 8. Token Store

Manages OAuth token persistence in localStorage with expiration checking.

```typescript
// src/storage/cloud/token-store.ts

const TOKEN_PREFIX = 'yappy:cloud:token:';

interface StoredTokens {
    accessToken: string;
    refreshToken?: string;         // Not available with Google PKCE
    expiresAt: number;             // Unix ms
    scope: string;
    tokenType: string;
    userEmail?: string;
    userName?: string;
    userAvatar?: string;
}

function saveTokens(providerId: string, tokens: StoredTokens): void {
    localStorage.setItem(TOKEN_PREFIX + providerId, JSON.stringify(tokens));
}

function loadTokens(providerId: string): StoredTokens | null {
    const raw = localStorage.getItem(TOKEN_PREFIX + providerId);
    if (!raw) return null;
    const tokens: StoredTokens = JSON.parse(raw);
    // Return null if expired (with 5-minute buffer)
    if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
        return null;
    }
    return tokens;
}

function clearTokens(providerId: string): void {
    localStorage.removeItem(TOKEN_PREFIX + providerId);
}
```

localStorage keys used:
| Key | Content |
|-----|---------|
| `yappy:cloud:config` | Active provider config (JSON) |
| `yappy:cloud:token:google-drive` | Google OAuth tokens (JSON) |
| `yappy:cloud:token:dropbox` | (future) Dropbox tokens |

---

## 9. Google Drive Provider

### 9.1 OAuth 2.0 PKCE Flow

PKCE (Proof Key for Code Exchange) enables OAuth entirely from the browser — no backend server, no client secret.

#### Flow Diagram

```
┌──────────┐     1. Click "Sign in"     ┌──────────────┐
│ YappyDraw├────────────────────────────►│ Generate     │
│   UI     │                             │ code_verifier│
└──────────┘                             │ + challenge  │
                                         └──────┬───────┘
                                                │
               2. Open popup                    │
         ┌──────────────────────────────────────┘
         │
         ▼
┌────────────────────┐   3. User authenticates   ┌──────────────┐
│ Google Auth Page    ├─────────────────────────►│ User grants   │
│ (popup window)     │   & grants consent        │ drive.file    │
└────────────────────┘                           │ scope         │
                                                 └──────┬────────┘
                                                        │
              4. Redirect with ?code=AUTH_CODE           │
         ┌──────────────────────────────────────────────┘
         │
         ▼
┌────────────────────┐   5. postMessage(code)    ┌──────────────┐
│ oauth-callback.html├─────────────────────────►│ YappyDraw    │
│ (static page)      │   to opener window        │ receives code│
└────────────────────┘                           └──────┬───────┘
         │                                              │
         │ 6. Popup closes                              │
         │                                              │
                                                        ▼
                                         ┌──────────────────────┐
                                         │ POST googleapis.com/ │
                                         │ oauth2/token         │
                                         │ {code, code_verifier}│
                                         └──────────┬───────────┘
                                                    │
                                         7. Receive access_token
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │ Store token in       │
                                         │ localStorage         │
                                         │ Ready to use API     │
                                         └──────────────────────┘
```

#### PKCE Cryptography

```typescript
// 1. Generate a random 32-byte code_verifier (base64url-encoded)
function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64urlEncode(array);  // 43 characters
}

// 2. SHA-256 hash it to create the code_challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
}

// base64url encoding (URL-safe, no padding)
function base64urlEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
```

#### Authorization URL Parameters

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=<VITE_GOOGLE_CLIENT_ID>
  &redirect_uri=<ORIGIN>/oauth-callback.html
  &response_type=code
  &scope=https://www.googleapis.com/auth/drive.file
  &code_challenge=<SHA256_OF_VERIFIER>
  &code_challenge_method=S256
  &prompt=consent
  &include_granted_scopes=true
```

For Shared Drive access, scope changes to `https://www.googleapis.com/auth/drive`.

#### Token Exchange

```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

code=<AUTH_CODE>
&client_id=<VITE_GOOGLE_CLIENT_ID>
&redirect_uri=<ORIGIN>/oauth-callback.html
&grant_type=authorization_code
&code_verifier=<ORIGINAL_VERIFIER>
```

Response:
```json
{
    "access_token": "ya29.a0Af...",
    "expires_in": 3600,
    "scope": "https://www.googleapis.com/auth/drive.file",
    "token_type": "Bearer"
}
```

**Important**: Google PKCE public clients do NOT receive `refresh_token`. The access token expires in 1 hour. After expiry, the user must re-authenticate via the popup flow. This is handled gracefully with a "Session expired — click to reconnect" toast.

#### OAuth Callback Page

Minimal static HTML file at `public/oauth-callback.html`:

```html
<!DOCTYPE html>
<html>
<head><title>YappyDraw — Connecting...</title></head>
<body>
<p>Connecting to Google Drive... This window will close automatically.</p>
<script>
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (window.opener) {
        if (code) {
            window.opener.postMessage(
                { type: 'yappy-oauth-callback', code },
                window.location.origin
            );
        } else {
            window.opener.postMessage(
                { type: 'yappy-oauth-error', error: error || 'Unknown error' },
                window.location.origin
            );
        }
    }
    window.close();
</script>
</body>
</html>
```

#### Popup vs. Redirect

We use a **popup window** for OAuth instead of a full-page redirect because:
- The user's unsaved drawing state is preserved
- No risk of losing work during the auth flow
- The popup closes automatically after auth completes
- Better UX — the user stays in context

### 9.2 Google Drive API v3 Operations

All API calls use `Authorization: Bearer <access_token>` header.

#### Save (Create File)

Uses multipart upload to send metadata + content in one request.

```
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
Content-Type: multipart/related

--boundary
Content-Type: application/json

{"name": "diagram.yappy", "parents": ["<FOLDER_ID>"]}
--boundary
Content-Type: application/gzip

<GZIP_COMPRESSED_DOCUMENT>
--boundary--
```

In practice, we use `FormData` for multipart:

```typescript
const metadata = { name: fileName, parents: [folderId] };
const form = new FormData();
form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
form.append('file', compressedBlob);

await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
});
```

#### Save (Update Existing File)

```
PATCH https://www.googleapis.com/upload/drive/v3/files/<FILE_ID>?uploadType=media
Authorization: Bearer <TOKEN>
Content-Type: application/gzip

<GZIP_COMPRESSED_DOCUMENT>
```

#### Load

```
GET https://www.googleapis.com/drive/v3/files/<FILE_ID>?alt=media
Authorization: Bearer <TOKEN>
```

Returns the raw file content. Decompress with `DecompressionStream('gzip')`.

#### List Files

```
GET https://www.googleapis.com/drive/v3/files?
    q='<FOLDER_ID>' in parents and trashed = false
      and (mimeType = 'application/gzip' or mimeType = 'application/json')
    &fields=nextPageToken,files(id,name,mimeType,size,createdTime,modifiedTime,shared)
    &orderBy=modifiedTime desc
    &pageSize=50
```

#### Delete

```
DELETE https://www.googleapis.com/drive/v3/files/<FILE_ID>
Authorization: Bearer <TOKEN>
```

#### List Folders

```
GET https://www.googleapis.com/drive/v3/files?
    q='<PARENT_ID>' in parents
      and mimeType = 'application/vnd.google-apps.folder'
      and trashed = false
    &fields=files(id,name,parents)
    &orderBy=name
```

#### Create Folder

```
POST https://www.googleapis.com/drive/v3/files
Content-Type: application/json
Authorization: Bearer <TOKEN>

{
    "name": "YappyDraw",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["root"]
}
```

#### Default Folder Strategy

On first save, the provider:
1. Searches for an existing `YappyDraw` folder in the user's root Drive
2. If found, uses it
3. If not found, creates it
4. Caches the folder ID for the session

### 9.3 Shared Drive Support

Google Workspace organizations use Shared Drives (formerly Team Drives) for centralized storage.

#### List Shared Drives

```
GET https://www.googleapis.com/drive/v3/drives?
    pageSize=100
    &fields=drives(id,name)
```

#### Operations on Shared Drives

All file operations add these parameters:
- `supportsAllDrives=true`
- `includeItemsFromAllDrives=true`

For listing files within a specific Shared Drive:
- `corpora=drive`
- `driveId=<SHARED_DRIVE_ID>`

```typescript
// Example: list files in a Shared Drive
const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    corpora: 'drive',
    driveId: teamDriveId,
    fields: 'files(id,name,mimeType,size,modifiedTime)',
});
```

#### Access Control

YappyDraw does NOT manage Shared Drive permissions. Access control is handled entirely by Google Workspace:
- Org admins manage Shared Drive membership
- If a user lacks write access, Google's API returns `403 Forbidden`
- The provider surfaces this as a user-friendly error message

#### OAuth Scope

Shared Drive access requires the broader `drive` scope instead of `drive.file`:
- `drive.file` — only files created/opened by this app (personal Drive)
- `drive` — full access to all files (needed for Shared Drives)

The provider requests the appropriate scope based on the `teamDriveId` config.

---

## 10. Data Flow Diagrams

### 10.1 Save Flow

```
User clicks "Save to Google Drive"
        │
        ▼
┌─────────────────────┐
│ CloudStorageDialog   │ ← User picks file name + folder
│ (save mode)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ StorageManager.save()│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GoogleDriveProvider  │
│ .save(doc, options)  │
│                      │
│ 1. Compress doc      │ ← compression.ts
│    (GZIP)            │
│ 2. Ensure folder     │ ← Create YappyDraw/ if needed
│ 3. Upload file       │ ← Multipart or media upload
│ 4. Return metadata   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ UI updates           │
│ • Toast: "Saved!"    │
│ • Store cloudFileId  │
│ • Offer auto-sync    │
└─────────────────────┘
```

### 10.2 Load Flow

```
User clicks "Open from Google Drive"
        │
        ▼
┌─────────────────────┐
│ CloudStorageDialog   │ ← User browses files, selects one
│ (browse mode)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ StorageManager.load()│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ GoogleDriveProvider  │
│ .load(fileId)        │
│                      │
│ 1. GET alt=media     │
│ 2. Decompress        │ ← Try GZIP, fallback to JSON
│ 3. Return document   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ loadDocument(doc)    │ ← Existing app-store function
│ Store updates:       │
│ • elements, layers   │
│ • slides, settings   │
│ • cloudFileId        │
└─────────────────────┘
```

### 10.3 Auth Flow

```
User clicks "Sign in to Google Drive"
        │
        ▼
┌─────────────────────┐
│ GoogleDriveProvider  │
│ .signIn()            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ google-drive-auth.ts │
│ initiateGoogleAuth() │
│                      │
│ 1. Generate verifier │
│ 2. SHA-256 challenge │
│ 3. Open popup →      │──► Google Auth Page (user signs in)
│ 4. Wait for message  │◄── oauth-callback.html (postMessage)
│ 5. Exchange code     │──► POST googleapis.com/oauth2/token
│ 6. Receive token     │◄── { access_token, expires_in }
│ 7. Store in LS       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Auth state updated   │
│ • UI shows user info │
│ • File list loads    │
└─────────────────────┘
```

---

## 11. Conflict Detection

When saving to an existing file (overwrite), the provider checks for conflicts:

```
1. Before save, GET file metadata:
   GET /drive/v3/files/<ID>?fields=modifiedTime

2. Compare modifiedTime with last known value (stored in app state)

3. If modified externally:
   ┌─────────────────────────────┐
   │ "This file was modified     │
   │ externally since your last  │
   │ save."                      │
   │                             │
   │ [Overwrite] [Save as New]   │
   │ [Cancel]                    │
   └─────────────────────────────┘

4. If not modified, proceed with save normally
```

This is a simple last-write-wins model with user notification. No complex merge logic.

---

## 12. Auto-Sync

Opt-in auto-sync saves the current drawing to the cloud periodically.

**Trigger**: After a successful manual cloud save, a toast offers auto-sync.

**Behavior**:
- Watches `store.isDirty` changes
- Debounces cloud saves (30 seconds by default, configurable)
- Independent of localStorage auto-save (1 second debounce) — both run concurrently
- Shows sync status in status bar: `idle` → `syncing` → `synced` / `error`
- Uses `overwriteFileId` to update the same file

**Store state additions**:

```typescript
// In AppState
cloudProvider?: string;              // Active provider ID
cloudFileId?: string;                // Current file's cloud ID
cloudFileName?: string;              // Current file name in cloud
cloudSyncEnabled?: boolean;          // Auto-sync active?
cloudSyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
cloudLastSyncAt?: string;            // ISO timestamp
```

---

## 13. Feature Flags

Cloud storage is gated by feature flags in `src/config/features.ts`:

```typescript
export const features = {
    enableWorkspacePersistence: import.meta.env.VITE_ENABLE_WORKSPACE_PERSISTENCE !== 'false',
    enableCloudStorage: import.meta.env.VITE_ENABLE_CLOUD_STORAGE !== 'false',
    enableGoogleDrive: import.meta.env.VITE_ENABLE_GOOGLE_DRIVE !== 'false',
};
```

| Flag | Default | Effect |
|------|---------|--------|
| `VITE_ENABLE_CLOUD_STORAGE` | `true` | Master toggle for all cloud features |
| `VITE_ENABLE_GOOGLE_DRIVE` | `true` | Enable Google Drive provider |
| `VITE_GOOGLE_CLIENT_ID` | (none) | Required for Google Drive to function |

If `VITE_GOOGLE_CLIENT_ID` is not set, the Google Drive provider registers but `signIn()` throws with a clear error message.

---

## 14. Google Cloud Console Setup

Step-by-step guide to create the OAuth credentials needed for Google Drive.

### 14.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown (top bar) → **New Project**
3. Name: `YappyDraw` (or any name)
4. Click **Create**
5. Select the new project from the dropdown

### 14.2 Enable Google Drive API

1. Go to **APIs & Services → Library** (left sidebar)
2. Search for **"Google Drive API"**
3. Click on it → **Enable**

### 14.3 Configure OAuth Consent Screen

> **Note**: Google moved the consent screen from "APIs & Services" to the new **Google Auth platform** section in the Cloud Console (2025).

1. Go to **Menu → Google Auth platform → Branding**
2. If you see "Google Auth platform not configured yet", click **Get Started**
3. Fill in:
   - **App name**: `YappyDraw`
   - **User support email**: your email
   - **Developer contact email**: your email
4. Under **Audience**, choose **External** (for any Google account) or **Internal** (for Google Workspace org only)
5. Click **Save**
6. Go to **Google Auth platform → Data Access**
   - Click **Add or Remove Scopes**
   - Add `https://www.googleapis.com/auth/drive.file`
   - (For Shared Drives, also add `https://www.googleapis.com/auth/drive`)
   - Click **Update** → **Save**
7. Go to **Google Auth platform → Audience**
   - Add your Google account email as a **test user**

### 14.4 Create OAuth Client ID

1. Go to **APIs & Services → Credentials**
2. Click **+ CREATE CREDENTIALS → OAuth client ID**
3. **Application type**: Web application
4. **Name**: `YappyDraw Web Client`
5. **Authorized JavaScript origins**: Add:
   - `http://localhost:5173` (Vite dev server)
   - `https://yappydraw.com` (production)
   - Any other domains you deploy to
6. **Authorized redirect URIs**: Add:
   - `http://localhost:5173/oauth-callback.html`
   - `https://yappydraw.com/oauth-callback.html`
7. Click **Create**
8. Copy the **Client ID** (looks like: `123456789-abcdef.apps.googleusercontent.com`)

### 14.5 Configure Environment

Add to `.env.local` (not committed to git):

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
VITE_ENABLE_CLOUD_STORAGE=true
VITE_ENABLE_GOOGLE_DRIVE=true
```

For production deployment, set these as environment variables in your hosting platform (Vercel, Netlify, etc.).

### 14.6 Publishing the App (Moving Out of Test Mode)

While in "Testing" status, only test users can sign in. To make it available to all users:

1. Go to **Google Auth platform → Audience**
2. Click **Publish App**
3. If you requested sensitive scopes (`drive`), Google will require a verification review:
   - Submit your app for review
   - Provide the privacy policy URL: `https://yappydraw.com/privacy-policy.html`
   - Demonstrate the app's use of the scopes
4. For the `drive.file` scope (non-sensitive), publishing is instant

**Recommendation**: Start with `drive.file` scope only. Add the broader `drive` scope later when Shared Drive support is needed, and go through verification at that point.

---

## 15. UI Integration

### 15.1 LoadExportDialog Changes

Add cloud options to the existing Load and Save tabs:

**Load tab** — new option card after "Load from file":
- Icon: Cloud
- Title: "Open from Google Drive"
- Description: "Load a drawing from your Google Drive"
- Action: Opens `CloudStorageDialog` in browse mode

**Save tab** — new option card after "Save to disk":
- Icon: Cloud
- Title: "Save to Google Drive"
- Description: "Save your drawing to Google Drive"
- Action: Opens `CloudStorageDialog` in save mode

Both gated by `features.enableCloudStorage && features.enableGoogleDrive`.

### 15.2 CloudStorageDialog

Modal dialog (same pattern as `load-export-dialog.tsx`):

```
┌───────────────────────────────────────────────────┐
│ Cloud Storage                              [X]    │
├───────────────────────────────────────────────────┤
│ Provider: [Google Drive ▼]                        │
├───────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ rajesh@example.com            [Sign Out]    │   │
│ └─────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────┤
│ Folder: YappyDraw /                    [Change]   │
│ ┌─────────────────────────────────────────────┐   │
│ │ [Search drawings...]                        │   │
│ │                                             │   │
│ │ 📄 architecture-v3         Jan 15, 2025    │   │
│ │ 📄 sprint-retro            Jan 14, 2025    │   │
│ │ 📄 system-design           Jan 10, 2025    │   │
│ │                                             │   │
│ │              [Load More]                    │   │
│ └─────────────────────────────────────────────┘   │
├───────────────────────────────────────────────────┤
│ [Save Current Drawing]                  [Cancel]  │
└───────────────────────────────────────────────────┘
```

### 15.3 Settings Dialog

New "Cloud Storage" section in existing SettingsDialog:

```
Cloud Storage
─────────────────────────────
  Provider    [Google Drive ▼]
  Account     rajesh@example.com  [Sign Out]
  Folder      YappyDraw /         [Change]
  Shared Drive [None ▼]           (only for Workspace users)
  Auto-sync   [Toggle: Off]
```

---

## 16. SaaS Evolution Path

The pluggable provider architecture is designed to evolve from a static site to a full SaaS platform.

### Current: Static Site + Client-Side OAuth

```
Browser ──── Google Drive API (direct, PKCE)
         └── localStorage (auto-save)
```

### Future: SaaS with Backend

```
Browser ──── Backend API ──── Auth Service (JWT, OAuth broker)
                          ├── Storage Adapter (Drive, Dropbox, S3)
                          ├── Database (users, metadata, permissions)
                          └── WebSocket (real-time collaboration)
```

### Migration Steps

1. **BackendStorageProvider**: A new provider that implements `CloudStorageProvider` but routes all calls through your backend API (`POST /api/cloud/save`, `GET /api/cloud/load`, etc.). The UI components need zero changes.

2. **Server-side OAuth**: Move OAuth to the backend. Backend stores refresh tokens, handles automatic token refresh. The `signIn()` method redirects to your backend's `/auth/google` endpoint instead of directly to Google. `AuthState` interface stays the same.

3. **User accounts**: Backend adds user registration, login, and per-user file metadata (favorites, recent files, shared-with-me). The `CloudFileInfo` type already has `shared` and `providerMetadata` fields for this.

4. **Multi-provider per user**: The registry already supports multiple providers. A SaaS user can connect both Google Drive and Dropbox simultaneously.

5. **Real-time collaboration**: Replace auto-sync with WebSocket-based real-time sync. Add `subscribe(fileId, callback)` to the provider interface.

6. **Billing**: Add subscription tiers. Free tier: local + 1 cloud provider. Pro tier: all providers + auto-sync + collaboration.

---

## 17. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_ENABLE_CLOUD_STORAGE` | No | `true` | Master toggle for cloud storage features |
| `VITE_ENABLE_GOOGLE_DRIVE` | No | `true` | Enable Google Drive provider registration |
| `VITE_GOOGLE_CLIENT_ID` | For Google Drive | (none) | Google OAuth 2.0 Client ID from Cloud Console |
| `VITE_ENABLE_WORKSPACE_PERSISTENCE` | No | `true` | Existing: enable Express backend persistence |

All variables are compile-time only (Vite `import.meta.env`). Set them before `npm run build` or in your hosting platform's environment settings.

---

## 18. localStorage Keys Reference

| Key | Content | Written by |
|-----|---------|------------|
| `yappy:autosave` | Full SlideDocument JSON | auto-save.ts (existing) |
| `yappy:autosave:meta` | Auto-save metadata | auto-save.ts (existing) |
| `yappy:cloud:config` | Active provider config | StorageManager |
| `yappy:cloud:token:google-drive` | Google OAuth tokens | token-store.ts |
| `yappy:cloud:token:<provider>` | (future) Other provider tokens | token-store.ts |

---

## 19. Error Handling

| Scenario | Handling |
|----------|----------|
| No `VITE_GOOGLE_CLIENT_ID` | `signIn()` throws, toast: "Google Drive not configured" |
| User cancels OAuth popup | Promise rejects, toast: "Authentication cancelled" |
| OAuth popup blocked | Promise rejects, toast: "Popup blocked — please allow popups" |
| Token expired (401 from API) | Clear tokens, toast: "Session expired — click to reconnect" |
| No network | API call fails, toast: "Could not connect to Google Drive" |
| Insufficient permissions (403) | Toast: "You don't have access to this file/drive" |
| File not found (404) | Toast: "File not found — it may have been deleted" |
| Quota exceeded | Toast: "Google Drive storage is full" |
| GZIP decompression fails | Fallback to parsing as plain JSON |
| localStorage quota exceeded | Token/config save fails silently (not critical) |

---

## 20. Security Considerations

1. **Client ID is public**: The Google OAuth Client ID is safe to embed in client-side code. It's not a secret — it's designed to be public for web apps.

2. **No client secret**: PKCE flow does not use or expose a client secret. The `code_verifier` is generated fresh per auth flow and never transmitted to Google's auth endpoint (only the hashed `code_challenge` is).

3. **Token storage**: Access tokens are stored in localStorage. This is the standard approach for SPAs. Tokens expire in 1 hour, limiting exposure if localStorage is compromised.

4. **Origin validation**: The `oauth-callback.html` page uses `window.location.origin` in `postMessage` to prevent cross-origin token theft.

5. **Scope minimization**: Default scope is `drive.file` (only files created by YappyDraw). The broader `drive` scope is only requested when Shared Drive access is configured.

6. **Token revocation**: `signOut()` revokes the token at Google's endpoint, not just locally.
