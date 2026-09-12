/**
 * pwa-update-policy — when it is acceptable to apply a waiting build unasked.
 *
 * Split out of `pwa.ts` purely so it can be tested: `pwa.ts` imports
 * `virtual:pwa-register`, which only exists inside a Vite build, so anything in
 * that file is unreachable from a unit test. This module imports nothing.
 *
 * See utils/pwa.ts for how the answer is used.
 */

/**
 * How long the tab must stay hidden before a waiting update is applied on its
 * own. Long enough that flicking to another tab for a reference image and coming
 * straight back never triggers it; short enough that a lunch break does.
 */
export const HIDDEN_GRACE_MS = 3 * 60 * 1000   // 3 minutes

export interface AutoApplyState {
    /** A new build has installed and is waiting to take over. */
    waiting: boolean
    /** The tab is currently on screen. */
    visible: boolean
    /** How long the tab has been continuously hidden. */
    hiddenForMs: number
    /** Work in flight that a reload would destroy irrecoverably (e.g. a recording). */
    busy: boolean
}

/**
 * Is it safe to apply a waiting update right now, without being asked?
 *
 * The rules, and why each one is here:
 *  - nothing waiting → nothing to do.
 *  - tab is visible → never. Reloading the page someone is drawing on is worse
 *    than running an old build, however long they have been on it.
 *  - busy → never, however hidden. A recording is wall-clock work that a reload
 *    destroys with no way to get it back, and unlike the document it is not in
 *    IndexedDB. (The document is safe: applyPwaUpdate flushes the autosave
 *    first.) Checked before the grace period so "busy" cannot be outwaited.
 *  - hidden, but not for long → not yet. Glancing at another tab is not consent.
 */
export function shouldAutoApply(s: AutoApplyState): boolean {
    if (!s.waiting) return false
    if (s.visible) return false
    if (s.busy) return false
    return s.hiddenForMs >= HIDDEN_GRACE_MS
}
