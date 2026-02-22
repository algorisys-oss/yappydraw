/**
 * Cloud Storage — Module Entry Point
 *
 * Creates the singleton ProviderRegistry and StorageManager,
 * registers default providers based on feature flags, and
 * re-exports everything the rest of the app needs.
 */

import { features } from '../../config/features';
import { ProviderRegistry } from './provider-registry';
import { StorageManager } from './storage-manager';
import { GoogleDriveProvider } from './providers/google-drive-provider';

// ── Singleton instances ────────────────────────────────────

export const cloudRegistry = new ProviderRegistry();
export const cloudStorageManager = new StorageManager(cloudRegistry);

// ── Default provider registration ──────────────────────────

/** Register built-in providers. Call once at app startup. */
export function initCloudStorage(): void {
    if (!features.enableCloudStorage) return;

    // Google Drive
    if (features.enableGoogleDrive) {
        cloudRegistry.register({
            id: 'google-drive',
            displayName: 'Google Drive',
            icon: 'Cloud',
            factory: (config) => new GoogleDriveProvider(config),
            featureFlag: 'enableGoogleDrive',
        });
    }

    // Restore last-used provider config (async, fire-and-forget)
    cloudStorageManager.restoreFromConfig().catch(() => {
        // Silent — user will configure manually if needed
    });
}

// ── Re-exports ─────────────────────────────────────────────

export type {
    AuthState,
    CloudFileInfo,
    CloudStorageProvider,
    FolderInfo,
    ListOptions,
    ListResult,
    ProviderConfig,
    ProviderRegistration,
    SaveOptions,
} from './types';

export { ProviderRegistry } from './provider-registry';
export { StorageManager } from './storage-manager';
export { compressDocument, decompressToDocument } from './compression';
export { saveTokens, loadTokens, clearTokens } from './token-store';
export type { StoredTokens } from './token-store';
