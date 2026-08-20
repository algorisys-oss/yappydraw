import { describe, it, expect } from 'vitest';
import { mergePathMenu } from './path-menu-merge';
import type { MenuItem } from '../components/context-menu';

const anchorMenu: MenuItem[] = [
    { label: 'Insert Point Here' },
    { separator: true },
    { label: 'Constrain Handles (90°/45°)' },
];
const elementMenu: MenuItem[] = [
    { label: 'Copy' },
    { separator: true },
    { label: 'Ungroup', shortcut: 'Ctrl+Shift+G' },
];

const labels = (items: MenuItem[]) => items.filter(i => !i.separator).map(i => i.label);

describe('mergePathMenu', () => {
    it('keeps the element menu reachable behind the path actions (the Ungroup bug)', () => {
        const merged = mergePathMenu(anchorMenu, elementMenu);
        expect(labels(merged)).toEqual([
            'Insert Point Here', 'Constrain Handles (90°/45°)', 'Copy', 'Ungroup',
        ]);
    });

    it('puts every path action ahead of every element action', () => {
        const merged = mergePathMenu(anchorMenu, elementMenu);
        expect(labels(merged).indexOf('Constrain Handles (90°/45°)')).toBeLessThan(labels(merged).indexOf('Copy'));
    });

    it('returns the element menu untouched when the press was not on a path', () => {
        expect(mergePathMenu(null, elementMenu)).toBe(elementMenu);
        expect(mergePathMenu([], elementMenu)).toBe(elementMenu);
    });

    it('joins with exactly one separator, never two', () => {
        const merged = mergePathMenu(
            [...anchorMenu, { separator: true }],
            [{ separator: true }, ...elementMenu],
        );
        const runs = merged.reduce((max, item, i) => (
            item.separator && merged[i - 1]?.separator ? max + 1 : max
        ), 0);
        expect(runs).toBe(0);
    });

    it('survives an empty element menu (nothing selected but a path press)', () => {
        expect(mergePathMenu(anchorMenu, [])).toEqual(anchorMenu);
        expect(mergePathMenu(anchorMenu, [{ separator: true }])).toEqual(anchorMenu);
    });
});
