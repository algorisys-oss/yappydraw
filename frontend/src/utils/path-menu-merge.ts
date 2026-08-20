/**
 * Merging the path-editing context menu with the ordinary element menu.
 *
 * A right-click / long-press on a selected path's anchor (or its outline) builds a
 * short path-editing menu — convert / delete / insert anchor, constrain handles. That
 * menu used to *replace* the element menu outright, which quietly stranded everything
 * else: press on the artwork itself and Ungroup, Pathfinder, Arrange, Copy… all
 * disappeared. On a keyboard-less tablet there is no Ctrl+Shift+G to fall back on, so
 * Ungroup became unreachable for as long as the press happened to land on the path.
 *
 * So the path actions lead (they are the most specific thing about where you pressed)
 * and the full element menu follows below a separator — the way Illustrator's
 * right-click menu carries both.
 */
import type { MenuItem } from '../components/context-menu';

/** Drop separators at the very start / end so the join never doubles a rule. */
const trimSeparators = (items: MenuItem[]): MenuItem[] => {
    let start = 0, end = items.length;
    while (start < end && items[start].separator) start++;
    while (end > start && items[end - 1].separator) end--;
    return items.slice(start, end);
};

/**
 * `anchor` items first, then the generic element menu. A null/empty anchor menu means
 * the press wasn't on a path, so the element menu is returned untouched.
 */
export function mergePathMenu(anchor: MenuItem[] | null | undefined, generic: MenuItem[]): MenuItem[] {
    const lead = anchor ? trimSeparators(anchor) : [];
    if (!lead.length) return generic;
    const rest = trimSeparators(generic);
    if (!rest.length) return lead;
    return [...lead, { separator: true }, ...rest];
}
