/**
 * Provider Registry
 *
 * Singleton registry where cloud storage providers register themselves
 * at app startup. The StorageManager and UI query this registry to
 * discover available providers.
 */

import type { CloudStorageProvider, ProviderConfig, ProviderRegistration } from './types';

export class ProviderRegistry {
    private providers = new Map<string, ProviderRegistration>();

    /** Register a provider. Overwrites if the same ID already exists. */
    register(registration: ProviderRegistration): void {
        this.providers.set(registration.id, registration);
    }

    /** Remove a provider from the registry. */
    unregister(id: string): void {
        this.providers.delete(id);
    }

    /** Get a single registration by ID. */
    get(id: string): ProviderRegistration | undefined {
        return this.providers.get(id);
    }

    /** Get all registered providers. */
    getAll(): ProviderRegistration[] {
        return Array.from(this.providers.values());
    }

    /** Create a provider instance from the registry. */
    createProvider(id: string, config?: ProviderConfig): CloudStorageProvider {
        const reg = this.providers.get(id);
        if (!reg) {
            throw new Error(`Unknown cloud storage provider: "${id}"`);
        }
        return reg.factory(config);
    }
}
