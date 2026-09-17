import type { Swatch } from '../types';

export interface SwatchSections {
    /** Named groups in order of first appearance, each with its swatches in document order. */
    groups: { name: string; swatches: Swatch[] }[];
    /** Swatches in no group. */
    loose: Swatch[];
}

/** Split swatches into named groups (colour combinations) and ungrouped ones, for the panel. */
export function sectionSwatches(swatches: readonly Swatch[]): SwatchSections {
    const groups = new Map<string, Swatch[]>();
    const loose: Swatch[] = [];
    for (const s of swatches) {
        if (!s.group) { loose.push(s); continue; }
        const list = groups.get(s.group);
        if (list) list.push(s); else groups.set(s.group, [s]);
    }
    return { groups: [...groups.entries()].map(([name, list]) => ({ name, swatches: list })), loose };
}

/** The first "Palette N" (per the given formatter) not already used as a group name. */
export function nextFreeGroupName(swatches: readonly Swatch[], format: (n: number) => string): string {
    const taken = new Set(swatches.map(s => s.group).filter(Boolean));
    let n = taken.size + 1;
    while (taken.has(format(n))) n++;
    return format(n);
}
