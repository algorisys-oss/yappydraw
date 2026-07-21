export interface ColorPaletteEntry {
    label: string;
    value: string;
}

export interface ColorPalette {
    id: string;
    name: string;
    swatches: ColorPaletteEntry[];
}

export const COLOR_PALETTES: ColorPalette[] = [
    {
        id: 'default',
        name: 'Default',
        swatches: [
            { label: 'Transparent', value: 'transparent' },
            { label: 'White', value: '#ffffff' },
            { label: 'Off White', value: '#f8f9fa' },
            { label: 'Light Gray', value: '#f1f3f5' },
            { label: 'Soft Red', value: '#fff5f5' },
            { label: 'Soft Pink', value: '#fff0f6' },
            { label: 'Soft Violet', value: '#f3f0ff' },
            { label: 'Red', value: '#e03131' },
            { label: 'Orange', value: '#e8590c' },
            { label: 'Yellow', value: '#fcc419' },
            { label: 'Green', value: '#2f9e44' },
            { label: 'Blue', value: '#1971c2' },
            { label: 'Violet', value: '#6741d9' },
            { label: 'Pink', value: '#c2255c' },
            { label: 'Dark', value: '#343a40' },
        ],
    },
    {
        id: 'architect',
        name: 'Architect',
        // From skills/3d-diagram-shapes.md §3 — fill colors only; borders/text remain user-chosen.
        swatches: [
            { label: 'Paper', value: '#F7F8F5' },
            { label: 'Floor', value: '#DCEFF7' },
            { label: 'Concept', value: '#B9DFA7' },
            { label: 'System', value: '#B8D2EC' },
            { label: 'Action', value: '#F7E6A6' },
            { label: 'Event', value: '#F4B24D' },
            { label: 'Execution', value: '#F2B6B6' },
            { label: 'Orchestration', value: '#D8C5F0' },
            { label: 'Infra', value: '#E3E5E8' },
            { label: 'Data', value: '#FFFFFF' },
        ],
    },
    {
        id: 'p3',
        name: 'P3 Wide-Gamut',
        // Keep in sync with P3_COLORS in components/p3-color-picker.tsx.
        swatches: [
            { label: 'P3 Red', value: 'color(display-p3 1 0 0)' },
            { label: 'P3 Green', value: 'color(display-p3 0 1 0)' },
            { label: 'P3 Blue', value: 'color(display-p3 0 0 1)' },
            { label: 'P3 Yellow', value: 'color(display-p3 1 1 0)' },
            { label: 'P3 Magenta', value: 'color(display-p3 1 0 1)' },
            { label: 'P3 Cyan', value: 'color(display-p3 0 1 1)' },
            { label: 'P3 Orange', value: 'color(display-p3 1 0.5 0)' },
            { label: 'P3 Purple', value: 'color(display-p3 0.5 0 1)' },
            { label: 'P3 Pink', value: 'color(display-p3 1 0 0.5)' },
        ],
    },
    {
        id: 'pastel',
        name: 'Pastel',
        swatches: [
            { label: 'Mist', value: '#fef6f6' },
            { label: 'Blush', value: '#fbd5d5' },
            { label: 'Peach', value: '#ffdab9' },
            { label: 'Butter', value: '#fff3b0' },
            { label: 'Mint', value: '#c8e6c9' },
            { label: 'Sage', value: '#d4e4c5' },
            { label: 'Sky', value: '#bde0fe' },
            { label: 'Periwinkle', value: '#c4c7ff' },
            { label: 'Lavender', value: '#e0c3fc' },
            { label: 'Lilac', value: '#f4c2ff' },
            { label: 'Sand', value: '#f0e4d3' },
            { label: 'Stone', value: '#e2e2dc' },
        ],
    },
    {
        id: 'vibrant',
        name: 'Vibrant',
        swatches: [
            { label: 'Hot Pink', value: '#ff2e93' },
            { label: 'Crimson', value: '#e31b3c' },
            { label: 'Tangerine', value: '#ff7a00' },
            { label: 'Amber', value: '#ffb800' },
            { label: 'Lemon', value: '#ffe600' },
            { label: 'Lime', value: '#7fd400' },
            { label: 'Emerald', value: '#00c853' },
            { label: 'Teal', value: '#00b8a9' },
            { label: 'Cyan', value: '#00b9f1' },
            { label: 'Cobalt', value: '#1565ff' },
            { label: 'Indigo', value: '#5e35ff' },
            { label: 'Magenta', value: '#c724ff' },
        ],
    },
];

/**
 * Whether the browser understands `color(display-p3 …)`, which every swatch in
 * the P3 palette uses.
 *
 * This matters more than it looks: assigning an unparseable value to
 * `ctx.fillStyle` is silently IGNORED by the canvas spec — it keeps the previous
 * style rather than throwing or falling back. So on a browser without P3
 * support, shapes would quietly draw in whatever colour happened to be set last.
 * Supported since Safari 15, Chrome 111 and Firefox 113; older engines get the
 * sRGB palette instead.
 */
export function supportsDisplayP3(): boolean {
    try {
        return typeof CSS !== 'undefined'
            && typeof CSS.supports === 'function'
            && CSS.supports('color', 'color(display-p3 1 0 0)');
    } catch {
        return false;
    }
}

/** Palette used when the user hasn't chosen one. P3 where it renders. */
export function defaultPaletteId(): string {
    return supportsDisplayP3() ? 'p3' : 'default';
}

export const DEFAULT_PALETTE_ID = 'p3';

export function getColorPalette(id: string | undefined): ColorPalette {
    return COLOR_PALETTES.find(p => p.id === id)
        ?? COLOR_PALETTES.find(p => p.id === defaultPaletteId())
        ?? COLOR_PALETTES[0];
}
