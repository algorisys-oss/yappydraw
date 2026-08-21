/**
 * Teaching mode's context-menu filter.
 *
 * Two things are worth pinning, and the second is the interesting one.
 *
 * 1. The filter itself — it must remove the entries at every nesting level and not leave
 *    stranded separators where they used to be.
 * 2. That the labels it matches on still EXIST. The filter matches label text, so renaming
 *    an entry in `context-menu-builder.ts` without updating the set would quietly put a
 *    Pathfinder back into the mode built to hide it — a silent regression with no failing
 *    test anywhere. Reading the builder's source is the cheap way to catch that: the file
 *    cannot be imported here (it pulls in Solid components), but it can be read.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { TEACHING_HIDDEN_MENU_LABELS, filterTeachingMenu } from "./teaching-menu-filter";

describe("the labels the filter matches on still exist", () => {
    const source = readFileSync(new URL("./context-menu-builder.ts", import.meta.url), "utf8");

    for (const label of TEACHING_HIDDEN_MENU_LABELS) {
        it(`"${label}" is still a real menu entry`, () => {
            expect(source).toContain(`'${label}'`);
        });
    }
});

describe("filterTeachingMenu", () => {
    it("removes hidden entries and keeps everyday ones", () => {
        const out = filterTeachingMenu([
            { label: 'Copy' }, { label: 'Paste' },
            { label: 'Pathfinder', submenu: [{ label: 'Unite' }] },
            { label: 'Shape Builder' },
            { label: 'Group' },
        ] as any);
        expect(out.map((i: any) => i.label)).toEqual(['Copy', 'Paste', 'Group']);
    });

    it("reaches into submenus", () => {
        const out = filterTeachingMenu([
            { label: 'Arrange', submenu: [{ label: 'Bring Front' }, { label: 'Shape Builder' }] },
        ] as any);
        expect((out[0] as any).submenu.map((i: any) => i.label)).toEqual(['Bring Front']);
    });

    it("drops a parent whose submenu the filter emptied — an empty submenu is a dead end", () => {
        const out = filterTeachingMenu([
            { label: 'Keep' },
            { label: 'Vector', submenu: [{ label: 'Outline Stroke' }, { label: 'Convert to Path' }] },
        ] as any);
        expect(out.map((i: any) => i.label)).toEqual(['Keep']);
    });

    it("collapses the separators stranded by a removal", () => {
        const out = filterTeachingMenu([
            { label: 'Copy' }, { separator: true },
            { label: 'Pathfinder' }, { separator: true },
            { label: 'Group' },
        ] as any);
        expect(out).toEqual([{ label: 'Copy' }, { separator: true }, { label: 'Group' }] as any);
    });

    it("strips leading and trailing separators", () => {
        const out = filterTeachingMenu([
            { separator: true }, { label: 'Shape Builder' }, { label: 'Copy' },
            { label: 'Pathfinder' }, { separator: true },
        ] as any);
        expect(out).toEqual([{ label: 'Copy' }] as any);
    });

    it("leaves a menu with nothing to hide exactly as it was", () => {
        const input = [{ label: 'Copy' }, { separator: true }, { label: 'Group' }] as any;
        expect(filterTeachingMenu(input)).toEqual(input);
    });
});
