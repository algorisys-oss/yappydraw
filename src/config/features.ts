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

    /**
     * Master toggle for all cloud storage features (Google Drive, Dropbox, etc.).
     * Defaults to true if not specified.
     */
    enableCloudStorage: import.meta.env.VITE_ENABLE_CLOUD_STORAGE !== 'false',

    /**
     * Enable Google Drive as a cloud storage provider.
     * Requires VITE_GOOGLE_CLIENT_ID to be set for actual functionality.
     * Defaults to true if not specified.
     */
    enableGoogleDrive: import.meta.env.VITE_ENABLE_GOOGLE_DRIVE !== 'false',
};
