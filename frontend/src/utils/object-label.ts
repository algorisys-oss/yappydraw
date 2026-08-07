/**
 * Display labels for the object tree.
 *
 * An element's `name` is optional — most objects never get one, and requiring a
 * name at creation would mean writing "Rectangle 47" into every saved document
 * for no benefit. So the tree derives a label instead, preferring whatever the
 * user would recognise: their own name, then the object's own text, then the
 * kind of thing it is.
 */
import type { DrawingElement } from '../types';

/** Human names for element types, where the raw type isn't presentable. */
const TYPE_LABELS: Record<string, string> = {
    rectangle: 'Rectangle',
    circle: 'Ellipse',
    ellipse: 'Ellipse',
    diamond: 'Diamond',
    triangle: 'Triangle',
    line: 'Line',
    arrow: 'Arrow',
    draw: 'Pencil',
    pencil: 'Pencil',
    freedraw: 'Pencil',
    path: 'Path',
    text: 'Text',
    richtext: 'Text',
    image: 'Image',
    video: 'Video',
    table: 'Table',
    frame: 'Frame',
    symbolInstance: 'Symbol',
    connector: 'Connector',
    chart: 'Chart',
};

const titleCase = (s: string) =>
    s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ')
        .replace(/^./, c => c.toUpperCase());

/** Trim a label to something that fits a narrow panel row. */
const clip = (s: string, max = 32) => {
    const flat = s.replace(/\s+/g, ' ').trim();
    return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
};

/**
 * What the object tree shows for one element:
 * the user's name → its text content → a name for its type.
 */
export function elementLabel(el: DrawingElement): string {
    if (el.name && el.name.trim()) return clip(el.name);

    // Text-bearing objects are far easier to recognise by their words than by
    // "Text 12" — this is what makes the tree scannable in a real document.
    const text = (el.text ?? el.containerText ?? el.rawText ?? '').toString();
    if (text.trim()) return clip(text);

    return TYPE_LABELS[el.type] ?? titleCase(String(el.type ?? 'Object'));
}

/** Label for a group node: "Group" plus how many objects are inside it. */
export function groupLabel(memberCount: number): string {
    return `Group (${memberCount})`;
}

/** True when every member of the set is hidden (drives the group's eye icon). */
export function allHidden(members: DrawingElement[]): boolean {
    return members.length > 0 && members.every(m => m.visible === false);
}

/** True when every member is locked (drives the group's lock icon). */
export function allLocked(members: DrawingElement[]): boolean {
    return members.length > 0 && members.every(m => m.locked);
}
