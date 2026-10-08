import { Show } from 'solid-js';
import { t } from '../i18n';
import { store, setFocusBranch } from '../store/app-store';
import { Crosshair, X } from 'lucide-solid';
import { getDescendants } from '../utils/hierarchy';
import { outlineLabel } from '../utils/mindmap-outline';
import './group-isolation-banner.css';

/**
 * Focus-mode marker, same argument as the group-isolation breadcrumb next to it.
 *
 * Focus mode dims everything outside one branch to 12% and (since this change) makes it
 * unclickable. Without a visible marker that is indistinguishable from a rendering bug — the
 * canvas looks washed out and half of it refuses to respond — and the only ways out were two
 * keys nobody had been told about. So the bar says where you are, which branch, and how to
 * leave.
 *
 * Esc is handled centrally in app.tsx (ahead of the branches that clear the selection), so
 * this component deliberately adds no key listener of its own.
 */
export const FocusBranchBanner = () => {
    const node = () => store.elements.find(e => e.id === store.focusBranchId);
    const label = () => {
        const el = node();
        if (!el) return '';
        return outlineLabel(el) || t('mindmapFocus.untitled');
    };
    const hidden = () => {
        const el = node();
        if (!el) return 0;
        // Everything the dimming applies to: the whole document minus this branch and the path
        // back to the root (ancestors stay bright so you can climb out).
        const shown = new Set<string>([el.id, ...getDescendants(el.id, store.elements).map(d => d.id)]);
        let cur = el;
        let guard = 0;
        while (cur.parentId && guard++ < 1000) {
            shown.add(cur.parentId);
            const p = store.elements.find(e => e.id === cur.parentId);
            if (!p) break;
            cur = p;
        }
        return store.elements.filter(e => !shown.has(e.id)).length;
    };

    return (
        <Show when={!!store.focusBranchId && !!node()}>
            <div class="group-isolation-banner">
                <Crosshair size={15} />
                <span class="gib-label">{t('mindmapFocus.focusedOn', { label: label() })}</span>
                <Show when={hidden() > 0}>
                    <span class="gib-count">{t('mindmapFocus.othersDimmed', { count: hidden() })}</span>
                </Show>
                <button class="gib-btn gib-exit" title={t('mindmapFocus.showAllTitle')}
                    onClick={() => setFocusBranch(null)}>
                    <X size={13} /> {t('mindmapFocus.showAll')}
                </button>
            </div>
        </Show>
    );
};
