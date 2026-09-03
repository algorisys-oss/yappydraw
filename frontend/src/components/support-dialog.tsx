/**
 * "Support YappyDraw" popup — opened from the utility menu, the command palette, or
 * `window.Yappy.showSupport()`.
 *
 * Deliberately just a list of outbound links (see config/support.ts for why): no
 * payment SDK is loaded into the editor, so this component cannot fail, cannot slow
 * the cold start, and has nothing to clean up. If no links are configured the dialog
 * never opens — callers gate on `hasSupportLinks()`.
 *
 * Modelled on whats-new-dialog.tsx: module-level open state so anything can trigger
 * it, Escape and overlay-click to close.
 */
import { type Component, Show, For, createSignal, createEffect, onCleanup } from 'solid-js';
import { X, Heart, ExternalLink } from 'lucide-solid';
import { SUPPORT_LINKS, hasSupportLinks } from '../config/support';
import { t } from '../i18n';
import './support-dialog.css';

const [supportOpen, setSupportOpen] = createSignal(false);
export const isSupportOpen = supportOpen;
/** No-ops when nothing is configured, so a stale menu item can never open an empty dialog. */
export function openSupport(): void {
    if (hasSupportLinks()) setSupportOpen(true);
}
export function closeSupport(): void { setSupportOpen(false); }

const SupportDialog: Component = () => {
    const onKey = (e: KeyboardEvent) => {
        if (supportOpen() && e.key === 'Escape') closeSupport();
    };
    createEffect(() => {
        if (supportOpen()) document.addEventListener('keydown', onKey);
        else document.removeEventListener('keydown', onKey);
    });
    onCleanup(() => document.removeEventListener('keydown', onKey));

    return (
        <Show when={supportOpen()}>
            <div class="support-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSupport(); }}>
                <div class="support-modal" role="dialog" aria-modal="true" aria-label={t('support.title')}>
                    <div class="support-head">
                        <div class="support-title">
                            <Heart size={18} />
                            <span>{t('support.title')}</span>
                        </div>
                        <button class="support-close" onClick={closeSupport} aria-label={t('support.close')}>
                            <X size={18} />
                        </button>
                    </div>

                    <div class="support-body">
                        <p class="support-lede">{t('support.lede')}</p>

                        <div class="support-links">
                            <For each={SUPPORT_LINKS}>
                                {(link) => (
                                    <a
                                        class="support-link"
                                        classList={{ primary: link.primary }}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => closeSupport()}
                                    >
                                        <span class="support-link-label">
                                            {t(link.labelKey)}
                                            <ExternalLink size={14} />
                                        </span>
                                        <span class="support-link-note">{t(link.noteKey)}</span>
                                    </a>
                                )}
                            </For>
                        </div>

                        <p class="support-foot-note">{t('support.freeForever')}</p>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default SupportDialog;
