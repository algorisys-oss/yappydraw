import { type Component, Show, For, createSignal, createMemo, createEffect, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { X } from "lucide-solid";
import { store, setStore, pushToHistory, updateElement, setActiveSlide } from "../store/app-store";
import { pageScene, isExportable } from "../utils/export";
import { isPagedDocType } from "../types/slide-types";
import { checkPages, type A11yIssue, type A11yPage } from "../utils/accessibility-check";
import { t } from "../i18n";
import "./accessibility-dialogs.css";

/**
 * Alt Text (one object's description for screen readers, or "decorative") and the
 * Accessibility check (utils/accessibility-check.ts) — what to fix, where, with a button
 * to go to each object.
 */

const [altId, setAltId] = createSignal<string | null>(null);
const [checkOpen, setCheckOpen] = createSignal(false);

export const openAltText = (id: string) => { if (store.elements.some(e => e.id === id)) setAltId(id); };
export const openAccessibilityCheck = () => setCheckOpen(true);

/** The document as the check sees it: each page as it shows (master artwork included), or the canvas. */
export function documentPages(): A11yPage[] {
    if (isPagedDocType(store.docType) && store.slides.length) {
        return [...store.slides].sort((a, b) => a.order - b.order).map(s => {
            const index = store.slides.indexOf(s);
            return { index, name: s.name, background: s.fillStyle === 'solid' || !s.fillStyle ? s.backgroundColor : undefined, elements: pageScene(index) };
        });
    }
    const hidden = new Set(store.layers.filter(l => !l.visible).map(l => l.id));
    return [{ index: null, background: store.canvasBackgroundColor, elements: store.elements.filter(e => !hidden.has(e.layerId) && isExportable(e)) }];
}

export const checkDocument = (): A11yIssue[] => checkPages(documentPages());

/** Esc closes a dialog wherever focus is. */
const useEscape = (open: () => boolean, close: () => void) => createEffect(() => {
    if (!open()) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    window.addEventListener('keydown', onKey, true);
    onCleanup(() => window.removeEventListener('keydown', onKey, true));
});

export const AltTextDialog: Component = () => {
    const el = createMemo(() => store.elements.find(e => e.id === altId()));
    const [text, setText] = createSignal('');
    const [decorative, setDecorative] = createSignal(false);
    createEffect(() => { const e = el(); if (e) { setText(e.altText ?? ''); setDecorative(!!e.decorative); } });
    const close = () => setAltId(null);
    useEscape(() => !!altId(), close);
    const save = () => {
        const e = el();
        if (!e) return close();
        const alt = text().trim();
        if ((e.altText ?? '') !== alt || !!e.decorative !== decorative()) {
            pushToHistory();
            updateElement(e.id, { altText: alt || undefined, decorative: decorative() || undefined }, false);
        }
        close();
    };
    return (
        <Show when={el()}>
            <Portal>
                <div class="a11y-backdrop" on:click={close} />
                <div class="a11y-dialog" role="dialog" aria-label={t('a11y.altTitle')} onKeyDown={(e) => e.stopPropagation()}>
                    <header>
                        <h3>{t('a11y.altTitle')}</h3>
                        <button class="a11y-icon" on:click={close} title={t('a11y.close')} aria-label={t('a11y.close')}><X size={16} /></button>
                    </header>
                    <p class="a11y-hint">{t('a11y.altHint')}</p>
                    <textarea rows={4} value={text()} disabled={decorative()} placeholder={t('a11y.altPlaceholder')}
                        onInput={(e) => setText(e.currentTarget.value)} ref={(r) => setTimeout(() => r.focus())} />
                    <label class="a11y-check"><input type="checkbox" checked={decorative()} onChange={(e) => setDecorative(e.currentTarget.checked)} />{t('a11y.decorative')}</label>
                    <p class="a11y-hint">{t('a11y.decorativeHint')}</p>
                    <footer>
                        <button class="a11y-btn" on:click={close}>{t('a11y.cancel')}</button>
                        <button class="a11y-btn primary" on:click={save}>{t('a11y.save')}</button>
                    </footer>
                </div>
            </Portal>
        </Show>
    );
};

export const AccessibilityPanel: Component = () => {
    // Re-checked whenever the document changes while the panel is open.
    const issues = createMemo(() => (checkOpen() ? (void store.elements, void store.slides, checkDocument()) : []));
    const close = () => setCheckOpen(false);
    useEscape(checkOpen, close);
    const nameOf = (id?: string) => {
        const e = store.elements.find(x => x.id === id);
        return e ? ((e as any).name || t(`a11y.type.${NAMED.has(e.type) ? e.type : 'object'}` as any)) : '';
    };
    const where = (i: A11yIssue) => i.page === null ? '' : t('a11y.page', { n: (store.slides[i.page]?.order ?? i.page) + 1 });
    const message = (i: A11yIssue) => i.kind === 'alt-text' ? t('a11y.missingAlt', { name: nameOf(i.elementId) })
        : i.kind === 'contrast' ? t('a11y.lowContrast', { name: nameOf(i.elementId), ratio: i.ratio!, needed: i.needed! })
        : t('a11y.noText');
    const go = async (i: A11yIssue) => {
        if (i.page !== null && i.page !== store.activeSlideIndex) await setActiveSlide(i.page, true);
        if (i.elementId && store.elements.some(e => e.id === i.elementId)) setStore("selection", [i.elementId]);
    };
    return (
        <Show when={checkOpen()}>
            <Portal>
                <div class="a11y-panel" role="dialog" aria-label={t('a11y.checkTitle')} onKeyDown={(e) => e.stopPropagation()}>
                    <header>
                        <h3>{t('a11y.checkTitle')}</h3>
                        <button class="a11y-icon" on:click={close} title={t('a11y.close')} aria-label={t('a11y.close')}><X size={16} /></button>
                    </header>
                    <Show when={issues().length} fallback={<p class="a11y-ok">{t('a11y.allGood')}</p>}>
                        <p class="a11y-hint">{t('a11y.found', { count: issues().length })}</p>
                        <ul class="a11y-list">
                            <For each={issues()}>{(i) => (
                                <li>
                                    <span class={`a11y-kind ${i.kind}`}>{t(`a11y.kind.${i.kind}` as any)}</span>
                                    <span class="a11y-msg">{where(i) && <b>{where(i)} · </b>}{message(i)}</span>
                                    <span class="a11y-actions">
                                        <button class="a11y-btn" on:click={() => go(i)}>{t('a11y.goTo')}</button>
                                        <Show when={i.kind === 'alt-text'}>
                                            <button class="a11y-btn primary" on:click={async () => { await go(i); openAltText(i.elementId!); }}>{t('a11y.addAlt')}</button>
                                        </Show>
                                    </span>
                                </li>
                            )}</For>
                        </ul>
                    </Show>
                    <p class="a11y-hint">{t('a11y.checkHint')}</p>
                </div>
            </Portal>
        </Show>
    );
};

/** Object types the check names in its messages; anything else is "object". */
const NAMED = new Set(['image', 'video', 'chart', 'barChart', 'pieChart', 'qrCode', 'text', 'richtext']);
