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
 */
export const generateId = (type: string): string => {
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

    // Scan store elements
    store.elements.forEach(el => {
        if (el.id.startsWith(prefix)) {
            // Extract the number part
            const suffix = el.id.substring(prefix.length);
            const num = parseInt(suffix, 10);

            // Check if it's a valid number
            if (!isNaN(num) && String(num) === suffix) {
                if (num > max) {
                    max = num;
                }
            }
        }
    });

    return `${prefix}${max + 1}`;
};
