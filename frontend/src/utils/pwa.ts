/**
 * pwa — service-worker registration, update polling, and the update prompt.
 *
 * We deliberately use vite-plugin-pwa's `prompt` strategy (see vite.config.ts):
 * the service worker never calls skipWaiting()/clientsClaim(), so a newly
 * deployed build cannot activate and evict the running page's precache
 * mid-load. That eviction was the cause of the "blank on first load, fine on
 * refresh" bug — the old page would 404 on its own content-hashed chunks.
 *
 * With `prompt`, a new build installs and *waits*. Three things then have to
 * happen, and until v0.8.245 only the first one did:
 *
 *   1. NOTICE it. `registerSW` checks for a new worker when it registers and
 *      never again, so a tab left open — normal for a drawing app, which people
 *      leave running for days — would not discover a deploy at all. It sat on
 *      its own precache, offline-first and perfectly happy, on last week's
 *      build. `onRegisteredSW` below now polls, and also checks when the tab is
 *      brought back to the front and when the network returns, because those are
 *      the moments a deploy is most likely to have happened since we last looked.
 *
 *   2. SAY SO, and keep saying so. The only signal used to be a ten-second
 *      toast; miss it and there was no trace. `updateWaiting()` is a signal the
 *      status bar reads, so the version number carries a visible badge until the
 *      update is taken.
 *
 *   3. APPLY it without the user having to do anything. Nobody should have to
 *      know what a service worker is to get a bug fix, but a drawing app must
 *      never reload under someone's hands — so we wait until the tab has been
 *      HIDDEN for a few minutes and do it then. The reload lands in a tab nobody
 *      is looking at, and they come back to the new build. See shouldAutoApply().
 */
import { registerSW } from 'virtual:pwa-register'
import { createSignal } from 'solid-js'
import { showToast } from '../components/toast'
import { forceAutoSave } from '../storage/auto-save'
import { store } from '../store/app-store'
import { shouldAutoApply, HIDDEN_GRACE_MS } from './pwa-update-policy'

/** How often to ask the server whether a new service worker exists. */
const POLL_MS = 60 * 60 * 1000          // 1 hour

const [updateWaiting, setUpdateWaiting] = createSignal(false)

/** True once a new build has installed and is waiting to be applied. */
export { updateWaiting }

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined
let hiddenTimer: number | undefined
let autoApplyArmed = false

/** Work a reload would destroy irrecoverably (the document itself is autosaved). */
function isBusy(): boolean {
    try {
        return !!store.isRecording
    } catch {
        return false      // never let a state read block an update
    }
}

export function initPWA(): void {
    if (!('serviceWorker' in navigator)) return

    updateSWFn = registerSW({
        immediate: true,

        onRegisteredSW(_swUrl, registration) {
            if (!registration) return

            // `update()` rejects when offline or when the host hiccups. That is
            // routine, not an error — swallow it or it becomes an unhandled
            // rejection, which installStaleBuildHandler would then inspect.
            const check = () => { void registration.update().catch(() => { /* offline / transient */ }) }

            window.setInterval(check, POLL_MS)
            window.addEventListener('online', check)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') check()
            })
        },

        onOfflineReady() {
            showToast('Yappy is ready to work offline — installable from your browser menu', 'success', 6000)
        },

        onNeedRefresh() {
            // A new build is installed and waiting. Do NOT activate it here (that
            // is exactly the race we moved away from) and do not depend on the
            // user acting on a toast either — arm the hidden-tab auto-apply and
            // leave a badge on the version number in the meantime.
            setUpdateWaiting(true)
            showToast(
                'A new version of Yappy is ready. It will update itself once you step away — or tap the version number to get it now.',
                'info', 10000,
            )
            armAutoApply()
        },

        onRegisterError(error) {
            console.error('Service worker registration failed:', error)
        },
    })
}

/**
 * Watch for the tab going away, and take the update while nobody is looking.
 *
 * The timer is started on hide and cancelled on show, so the grace period has to
 * elapse UNINTERRUPTED — a quick glance at another tab resets it. The
 * visibilityState is re-read when the timer fires because a tab can come back
 * during the wait on browsers that coalesce timers.
 */
function armAutoApply(): void {
    if (autoApplyArmed) return
    autoApplyArmed = true

    const onVisibilityChange = () => {
        if (hiddenTimer) { clearTimeout(hiddenTimer); hiddenTimer = undefined }
        if (document.visibilityState !== 'hidden') return

        const hiddenAt = Date.now()
        hiddenTimer = window.setTimeout(() => {
            hiddenTimer = undefined
            const ok = shouldAutoApply({
                waiting: updateWaiting(),
                visible: document.visibilityState === 'visible',
                hiddenForMs: Date.now() - hiddenAt,
                busy: isBusy(),
            })
            if (ok) void applyPwaUpdate()
        }, HIDDEN_GRACE_MS)
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    // Already hidden when the update landed — a background tab is the common case.
    onVisibilityChange()
}

/**
 * Activate the waiting service worker and reload into the new build.
 * Safe no-op if there is nothing waiting or the SW never registered.
 *
 * The autosave is flushed first. `updateSW(true)` reloads the page, and the
 * autosave is debounced, so without this an update taken seconds after the last
 * edit would drop it — most likely of all in the auto-apply path, which fires
 * precisely when the user has just walked away from a fresh change.
 */
export async function applyPwaUpdate(): Promise<void> {
    try { forceAutoSave() } catch { /* best effort — never block the update */ }
    if (updateSWFn) await updateSWFn(true)
}
