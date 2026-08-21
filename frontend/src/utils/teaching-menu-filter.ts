/**
 * Teaching mode's context-menu filter.
 *
 * Its own module rather than living in `context-menu-builder.ts` so it can be tested on its
 * own: that file transitively imports Solid components, which cannot be loaded in the test
 * runner, and this logic is worth pinning.
 */
import type { MenuItem } from '../components/context-menu';

/**
 * Context-menu entries that Teaching mode takes off the menu.
 *
 * Matched on the label, and filtered once on the way out rather than guarded at each of the
 * ~20 `items.push` sites that produce them — those are spread over several builders and
 * nesting levels, and a guard missed at any one of them is a live Pathfinder in the mode
 * built to hide it.
 *
 * Label matching is the trade-off: exact-match, so renaming an entry in the builder without
 * updating this set would quietly reopen it. `teaching-mode-menu.test.ts` closes that hole
 * by asserting every label here still appears in the builder's source.
 */
export const TEACHING_HIDDEN_MENU_LABELS: ReadonlySet<string> = new Set([
    'Pathfinder',
    'Make Compound Shape',
    'Shape Builder',
    'Live Paint Bucket',
    'Knife / Scissors',
    'Convert to Path',
    'Create Outlines (text → vector)',
    'Outline Stroke',
    'Offset Path (+10)',
    'Offset Path (−10)',
    'Envelope: Make with Top Object',
    'Show Pathfinder Strip',
    'Hide Pathfinder Strip',
]);

/** Drop hidden entries at every level, then collapse the separator runs that leaves behind. */
export const filterTeachingMenu = (items: MenuItem[]): MenuItem[] => {
    const kept = items
        .filter(i => !(i.label && TEACHING_HIDDEN_MENU_LABELS.has(i.label)))
        .map(i => (i.submenu ? { ...i, submenu: filterTeachingMenu(i.submenu) } : i))
        // A submenu emptied by the filter is a dead end — drop the parent with it.
        .filter(i => !(i.submenu && i.submenu.length === 0));

    // Removing items strands separators: doubled up, or leading/trailing. Collapse them, or
    // the menu shows the gaps where the professional tools used to be.
    const out: MenuItem[] = [];
    for (const item of kept) {
        if (item.separator && (out.length === 0 || out[out.length - 1].separator)) continue;
        out.push(item);
    }
    while (out.length > 0 && out[out.length - 1].separator) out.pop();
    return out;
};
