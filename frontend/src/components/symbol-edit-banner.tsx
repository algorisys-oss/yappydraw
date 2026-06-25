import { Show, onMount, onCleanup } from 'solid-js';
import { store, exitSymbolEdit } from '../store/app-store';
import { Component as ComponentIcon, Check, X } from 'lucide-solid';
import './symbol-edit-banner.css';

/**
 * Edit-in-place breadcrumb. While `store.symbolEdit` is active, shows a bar to
 * finish (save → redefine the symbol, updating every instance) or cancel.
 * Enter/Esc are shortcuts for Done/Cancel.
 */
export const SymbolEditBanner = () => {
    onMount(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!store.symbolEdit) return;
            const t = e.target as HTMLElement;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.key === 'Escape') { e.preventDefault(); exitSymbolEdit(false); }
            else if (e.key === 'Enter') { e.preventDefault(); exitSymbolEdit(true); }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });

    return (
        <Show when={store.symbolEdit}>
            <div class="symbol-edit-banner">
                <ComponentIcon size={15} />
                <span class="seb-label">Editing symbol</span>
                <span class="seb-name">{store.symbolEdit!.name}</span>
                <button class="seb-btn seb-done" title="Apply changes to the symbol (Enter)" onClick={() => exitSymbolEdit(true)}>
                    <Check size={13} /> Done
                </button>
                <button class="seb-btn seb-cancel" title="Discard changes (Esc)" onClick={() => exitSymbolEdit(false)}>
                    <X size={13} /> Cancel
                </button>
            </div>
        </Show>
    );
};
