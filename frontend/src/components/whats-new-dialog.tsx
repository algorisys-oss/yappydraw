/**
 * "What's new" popup — opened by clicking the version number in the status bar.
 * Lists the most recent user-facing changes (see data/whats-new.ts). Also carries
 * the old version-button action (hard-refresh to the latest build) as a button so
 * that affordance isn't lost.
 */
import { type Component, Show, For, createSignal, createEffect, onCleanup } from 'solid-js';
import { X, Sparkles, RotateCw } from 'lucide-solid';
import { WHATS_NEW } from '../data/whats-new';
import { hardRefresh } from '../utils/hard-refresh';
import { showToast } from './toast';
import pkg from '../../../package.json';
import './whats-new-dialog.css';

const SEEN_KEY = 'yappy:whatsnew:seen';

// Module-level open state so the popup can be triggered from anywhere (status-bar
// version button, `window.Yappy.showWhatsNew()`).
const [whatsNewOpen, setWhatsNewOpen] = createSignal(false);
export const isWhatsNewOpen = whatsNewOpen;
export function openWhatsNew(): void { setWhatsNewOpen(true); }
export function closeWhatsNew(): void { setWhatsNewOpen(false); }

export function lastSeenVersion(): string | null {
    try { return localStorage.getItem(SEEN_KEY); } catch { return null; }
}
export function markWhatsNewSeen(version: string): void {
    try { localStorage.setItem(SEEN_KEY, version); } catch { /* ignore */ }
}
/**
 * True when the newest entry differs from what the user last saw — used to show a
 * "new" dot on the version. On a brand-new client (no record) we silently mark the
 * current version seen so first-time users aren't nudged (the tour covers them).
 */
export function hasUnseenWhatsNew(currentVersion: string): boolean {
    const seen = lastSeenVersion();
    if (seen === null) { markWhatsNewSeen(currentVersion); return false; }
    return seen !== currentVersion;
}

const WhatsNewDialog: Component = () => {
    const version = pkg.version;
    // Mark the current version seen whenever the dialog is open.
    createEffect(() => {
        if (whatsNewOpen()) markWhatsNewSeen(version);
    });

    const onKey = (e: KeyboardEvent) => {
        if (whatsNewOpen() && e.key === 'Escape') closeWhatsNew();
    };
    createEffect(() => {
        if (whatsNewOpen()) document.addEventListener('keydown', onKey);
        else document.removeEventListener('keydown', onKey);
    });
    onCleanup(() => document.removeEventListener('keydown', onKey));

    return (
        <Show when={whatsNewOpen()}>
            <div class="whatsnew-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeWhatsNew(); }}>
                <div class="whatsnew-modal" role="dialog" aria-modal="true" aria-label="What's new">
                    <div class="whatsnew-head">
                        <div class="whatsnew-title">
                            <Sparkles size={18} />
                            <span>What's new</span>
                            <span class="whatsnew-ver">v{version}</span>
                        </div>
                        <button class="whatsnew-close" onClick={closeWhatsNew} aria-label="Close">
                            <X size={18} />
                        </button>
                    </div>

                    <div class="whatsnew-body">
                        <For each={WHATS_NEW}>
                            {(entry) => (
                                <div class="whatsnew-entry">
                                    <div class="whatsnew-entry-head">
                                        <span class="whatsnew-badge" classList={{ current: entry.version === version }}>
                                            v{entry.version}
                                        </span>
                                        <span class="whatsnew-date">{entry.date}</span>
                                    </div>
                                    <ul class="whatsnew-list">
                                        <For each={entry.items}>{(it) => <li>{it}</li>}</For>
                                    </ul>
                                </div>
                            )}
                        </For>
                    </div>

                    <div class="whatsnew-foot">
                        <span class="whatsnew-foot-note">On the latest build? Reload to be sure.</span>
                        <button
                            class="whatsnew-refresh"
                            title="Clear cache and reload the latest version"
                            onClick={async () => { showToast('Refreshing to latest version…', 'info', 1500); await hardRefresh(); }}
                        >
                            <RotateCw size={14} /> Reload latest
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default WhatsNewDialog;
