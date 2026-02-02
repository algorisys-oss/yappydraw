/**
 * Centralized feature flags configuration.
 * 
 * To disable a feature, set the corresponding environment variable to 'false'
 * in your .env file or build environment.
 * 
 * Example: VITE_ENABLE_WORKSPACE_PERSISTENCE=false
 */
export const features = {
    /**
     * Enable saving/loading from browser's local (indexedDB) workspace.
     * Defaults to true if not specified.
     */
    enableWorkspacePersistence: import.meta.env.VITE_ENABLE_WORKSPACE_PERSISTENCE !== 'false',
};
