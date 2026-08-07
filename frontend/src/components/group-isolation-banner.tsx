import { Show, onMount, onCleanup } from 'solid-js';
import { store, exitGroupIsolation, exitGroupIsolationAll } from '../store/app-store';
import { Group, ChevronRight, X } from 'lucide-solid';
import './group-isolation-banner.css';

/**
 * Group isolation breadcrumb. While `store.isolatedGroupIds` is non-empty you're
 * editing *inside* a group: clicks select individual members instead of the
 * whole group. Without a visible marker that mode is indistinguishable from a
 * bug ("why is it only selecting one shape?"), so the bar states where you are
 * and how to get out.
 *
 * Esc leaves one level; the ⨯ leaves entirely. Clicking outside the group also
 * exits (handled in the selection handler).
 */
export const GroupIsolationBanner = () => {
    onMount(() => {
        const onKey = (e: KeyboardEvent) => {
            if (store.isolatedGroupIds.length === 0) return;
            // Don't steal Esc from text entry, or from the other edit-in-place modes.
            const t = e.target as HTMLElement;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (store.symbolEdit || store.compoundEdit) return;
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); exitGroupIsolation(); }
        };
        // Capture phase: the canvas-level Esc handler clears the selection, which
        // would fire before a bubble-phase listener here and swallow the exit.
        window.addEventListener('keydown', onKey, true);
        onCleanup(() => window.removeEventListener('keydown', onKey, true));
    });

    const depth = () => store.isolatedGroupIds.length;
    const memberCount = () => {
        const iso = store.isolatedGroupIds[depth() - 1];
        return iso ? store.elements.filter(e => e.groupIds?.includes(iso)).length : 0;
    };

    return (
        <Show when={depth() > 0}>
            <div class="group-isolation-banner">
                <Group size={15} />
                <span class="gib-label">Inside group</span>
                <Show when={depth() > 1}>
                    <span class="gib-depth" title={`${depth()} levels deep`}>
                        <ChevronRight size={11} />{depth()}
                    </span>
                </Show>
                <span class="gib-count">{memberCount()} objects</span>
                <button class="gib-btn" title="Go up one level (Esc)" onClick={() => exitGroupIsolation()}>
                    Up one
                </button>
                <button class="gib-btn gib-exit" title="Leave the group" onClick={() => exitGroupIsolationAll()}>
                    <X size={13} /> Exit
                </button>
            </div>
        </Show>
    );
};
