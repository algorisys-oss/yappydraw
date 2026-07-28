import { store } from "../store/app-store";

const TYPE_ABBREVIATIONS: Record<string, string> = {
    'rectangle': 'rect',
    'circle': 'circ',
    'triangle': 'tria',
    'diamond': 'diam',
    'hexagon': 'hexa',
    'octagon': 'octa',
    'parallelogram': 'para',
    'arrow': 'arrw',
    'line': 'line',
    'text': 'text',
    'image': 'imag',
    'ink': 'ink_',
    'laser': 'lasr',
    'group': 'grup',
    'slide': 'slid',
    'layer': 'layr',
    'star': 'star',
    'cloud': 'clou',
    'heart': 'hear',
    'cross': 'cros',
    'checkmark': 'chck',
    'capsule': 'caps',
    'stickyNote': 'note',
    'callout': 'call',
    'burst': 'brst',
    'speechBubble': 'bubl',
    'ribbon': 'ribb',
    'database': 'data',
    'document': 'docu',
    'server': 'serv',
    'user': 'user',
    'firewall': 'fire',
    'browser': 'brow',
    'state': 'stat',
    // Fallbacks will take first 4 chars
};

/**
 * Generates a human-readable, sequential ID for a given element type.
 * e.g., 'rectangle' -> 'rect-1'
 *
 * Strategy: "Max + 1"
 * It scans all existing elements in the store that start with `{abbr}-`.
 * It parses the suffix number, finds the maximum, and allows the next ID to be max + 1.
 * This ensures uniqueness without needing persistent state counters.
 *
 * @param batchIds - Optional set to track IDs generated in the same batch
 *   (e.g. pasting/duplicating multiple elements before they're added to the store).
 *   The set is mutated: the new ID is added to it automatically.
 */
export const generateId = (type: string, batchIds?: Set<string>): string => {
    // 1. Get 4-char abbreviation
    let abbr = TYPE_ABBREVIATIONS[type];
    if (!abbr) {
        // Fallback: lowercase and take first 4 chars
        abbr = type.substring(0, 4).toLowerCase();
    }

    // Ensure 4 chars padded if short (e.g. 'ink' -> 'ink_')
    if (abbr.length < 4) {
        abbr = abbr.padEnd(4, '_');
    }

    const prefix = `${abbr}-`;

    let max = 0;

    const scanMax = (items: { id: string }[]) => {
        items.forEach(item => {
            if (item.id?.startsWith(prefix)) {
                const suffix = item.id.substring(prefix.length);
                const num = parseInt(suffix, 10);
                if (!isNaN(num) && String(num) === suffix) {
                    if (num > max) max = num;
                }
            }
        });
    };

    // Scan all store collections
    scanMax(store.elements);
    if (store.layers) scanMax(store.layers);
    if (store.slides) scanMax(store.slides);
    if (store.states) scanMax(store.states);
    if (store.artboards) scanMax(store.artboards);
    if (store.symbols) scanMax(store.symbols);
    if (store.swatches) scanMax(store.swatches);
    if (store.graphicStyles) scanMax(store.graphicStyles);
    if (store.patterns) scanMax(store.patterns);
    if (store.dimensionAnnotations) scanMax(store.dimensionAnnotations);
    // Live Paint group ids live on a `livePaintGroupId` tag (not an `.id` field), so they're
    // invisible to the element scan — without this a new group after reload re-uses the same
    // id and cross-wires two groups. Scan the tags too.
    scanMax(store.elements.filter(e => (e as any).livePaintGroupId).map(e => ({ id: (e as any).livePaintGroupId })));
    // Same story for equation group ids (`Yappy.tex`): `texGroupId` is a tag, not an
    // element `.id`, so without this the second equation on a canvas re-uses the first's
    // group — `texPart()` then returns glyphs from both, and `texTransform()` sees one
    // merged equation instead of a source and a target.
    scanMax(store.elements.filter(e => (e as any).texGroupId).map(e => ({ id: (e as any).texGroupId })));
    // Group / clip / trace ids live in element.groupIds[] (not as an element `.id`), so the
    // element scan above can't see them. Without this every new group re-uses grup-1 and
    // cross-wires separate groups — e.g. two flares select together. Scan the tags too.
    const groupIdTags: { id: string }[] = [];
    store.elements.forEach(e => (e.groupIds || []).forEach(g => groupIdTags.push({ id: g })));
    scanMax(groupIdTags);

    // Also scan batch IDs for same-batch uniqueness
    if (batchIds) {
        batchIds.forEach(id => {
            if (id.startsWith(prefix)) {
                const suffix = id.substring(prefix.length);
                const num = parseInt(suffix, 10);
                if (!isNaN(num) && String(num) === suffix) {
                    if (num > max) max = num;
                }
            }
        });
    }

    const newId = `${prefix}${max + 1}`;
    if (batchIds) batchIds.add(newId);
    return newId;
};
