/**
 * Storage Manager — Singleton Orchestrator
 *
 * Sits between the UI and cloud providers. Manages the active provider,
 * persists configuration in localStorage, delegates CRUD operations,
 * and orchestrates opt-in auto-sync.
 */

import type {
    AuthState,
    CloudFileInfo,
    CloudStorageProvider,
    ListOptions,
    ListResult,
    ProviderConfig,
    ProviderRegistration,
    SaveOptions,
} from './types';
import type { SlideDocument } from '../../types/slide-types';
import { ProviderRegistry } from './provider-registry';

const CONFIG_KEY = 'yappy:cloud:config';

export class StorageManager {
    private registry: ProviderRegistry;
    private activeProvider: CloudStorageProvider | null = null;
    private config: ProviderConfig | null = null;
    private syncFileId: string | null = null;

    constructor(registry: ProviderRegistry) {
        this.registry = registry;
    }

    // ── Provider management ────────────────────────────────────

    /** Get the currently active provider (or null). */
    getActiveProvider(): CloudStorageProvider | null {
        return this.activeProvider;
    }

    /** Set (or switch) the active cloud provider. */
    async setActiveProvider(providerId: string, config?: ProviderConfig): Promise<void> {
        // Clean up previous provider
        if (this.activeProvider) {
            this.activeProvider.dispose();
            this.activeProvider = null;
        }

        const provider = this.registry.createProvider(providerId, config);
        this.config = config ?? { providerId, displayName: provider.displayName };
        await provider.initialize(config);
        this.activeProvider = provider;
        this.persistConfig();
    }

    /** Get all available provider registrations. */
    getAvailableProviders(): ProviderRegistration[] {
        return this.registry.getAll();
    }

    /**
     * Restore the last-used provider from localStorage.
     * Call once at app startup. Fails silently if no config or provider not found.
     */
    async restoreFromConfig(): Promise<void> {
        const config = this.loadPersistedConfig();
        if (!config) return;
        try {
            await this.setActiveProvider(config.providerId, config);
        } catch (e) {
            console.warn('[StorageManager] Failed to restore provider:', e);
        }
    }

    // ── Delegated CRUD ─────────────────────────────────────────

    async save(doc: SlideDocument, options?: SaveOptions): Promise<CloudFileInfo> {
        this.ensureProvider();
        return this.activeProvider!.save(doc, options);
    }

    async load(fileId: string): Promise<SlideDocument> {
        this.ensureProvider();
        return this.activeProvider!.load(fileId);
    }

    async delete(fileId: string): Promise<void> {
        this.ensureProvider();
        return this.activeProvider!.delete(fileId);
    }

    async list(options?: ListOptions): Promise<ListResult> {
        this.ensureProvider();
        return this.activeProvider!.list(options);
    }

    // ── Auth delegation ────────────────────────────────────────

    getAuthState(): AuthState {
        return this.activeProvider?.getAuthState() ?? { isAuthenticated: false };
    }

    async signIn(): Promise<void> {
        this.ensureProvider();
        return this.activeProvider!.signIn();
    }

    async signOut(): Promise<void> {
        this.ensureProvider();
        await this.activeProvider!.signOut();
        this.disableAutoSync();
    }

    // ── Config persistence ─────────────────────────────────────

    getConfig(): ProviderConfig | null {
        return this.config;
    }

    clearConfig(): void {
        try {
            localStorage.removeItem(CONFIG_KEY);
        } catch { /* ignore */ }
        this.config = null;
    }

    private persistConfig(): void {
        if (!this.config) return;
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
        } catch {
            console.warn('[StorageManager] Failed to persist config');
        }
    }

    private loadPersistedConfig(): ProviderConfig | null {
        try {
            const raw = localStorage.getItem(CONFIG_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    // ── Auto-sync ──────────────────────────────────────────────

    /** Enable auto-sync for a specific cloud file. */
    enableAutoSync(fileId: string): void {
        this.syncFileId = fileId;
        if (this.config) {
            this.config.autoSync = true;
            this.persistConfig();
        }
    }

    /** Disable auto-sync. */
    disableAutoSync(): void {
        this.syncFileId = null;
        if (this.config) {
            this.config.autoSync = false;
            this.persistConfig();
        }
    }

    /** Get the file ID being auto-synced (or null). */
    getSyncFileId(): string | null {
        return this.syncFileId;
    }

    isAutoSyncEnabled(): boolean {
        return this.syncFileId !== null;
    }

    // ── Internal ───────────────────────────────────────────────

    private ensureProvider(): void {
        if (!this.activeProvider) {
            throw new Error('No cloud storage provider configured. Please set up a provider in Settings.');
        }
    }
}
