/**
 * Adapter Registry
 * Singleton registry for DSL adapters. Supports auto-detection of input format.
 */

import type { DSLAdapter, AdapterResult } from './adapter-interface';

class AdapterRegistry {
    private adapters: DSLAdapter[] = [];

    /** Register an adapter */
    register(adapter: DSLAdapter): void {
        // Avoid duplicate registrations
        if (!this.adapters.some(a => a.name === adapter.name)) {
            this.adapters.push(adapter);
        }
    }

    /** Get a specific adapter by name */
    get(name: string): DSLAdapter | undefined {
        return this.adapters.find(a => a.name === name);
    }

    /** Auto-detect format and parse using the first matching adapter */
    autoParse(input: string): AdapterResult | null {
        for (const adapter of this.adapters) {
            if (adapter.canParse(input)) {
                return adapter.parse(input);
            }
        }
        return null;
    }

    /** List all registered adapter names */
    list(): string[] {
        return this.adapters.map(a => a.name);
    }
}

export const adapterRegistry = new AdapterRegistry();
