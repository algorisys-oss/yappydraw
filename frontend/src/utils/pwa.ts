/**
 * pwa — service-worker registration + update prompt.
 *
 * We deliberately use vite-plugin-pwa's `prompt` strategy (see vite.config.ts):
 * the service worker never calls skipWaiting()/clientsClaim(), so a newly
 * deployed build cannot activate and evict the running page's precache
 * mid-load. That eviction was the cause of the "blank on first load, fine on
 * refresh" bug — the old page would 404 on its own content-hashed chunks.
 *
 * With `prompt`, a new build installs and *waits*. `onNeedRefresh` fires; we
 * surface a toast telling the user how to apply it. Applying it is a genuine
 * user action (updateSW(true) via `applyPwaUpdate`, or the status-bar version
 * tap → hardRefresh), which loads a fresh, internally-consistent build.
 */
import { registerSW } from 'virtual:pwa-register'
import { showToast } from '../components/toast'

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined

export function initPWA(): void {
    if (!('serviceWorker' in navigator)) return

    updateSWFn = registerSW({
        immediate: true,
        onOfflineReady() {
            showToast('Yappy is ready to work offline — installable from your browser menu', 'success', 6000)
        },
        onNeedRefresh() {
            // A new build is installed and waiting. Do NOT auto-activate it (that
            // is exactly the race we moved away from); let the user apply it.
            showToast('A new version of Yappy is available — tap the version number (bottom bar) to update', 'info', 10000)
        },
        onRegisterError(error) {
            console.error('Service worker registration failed:', error)
        },
    })
}

/**
 * Activate the waiting service worker and reload into the new build.
 * Safe no-op if there is nothing waiting or the SW never registered.
 */
export async function applyPwaUpdate(): Promise<void> {
    if (updateSWFn) await updateSWFn(true)
}
