export interface ImageFilterPreset {
    id: string;
    name: string;
    category: 'basic' | 'warm' | 'cool' | 'vintage' | 'dramatic';
    values: {
        filterBrightness?: number;
        filterContrast?: number;
        filterSaturate?: number;
        filterBlur?: number;
        filterHueRotate?: number;
        filterInvert?: number;
        filterSepia?: number;
    };
}

export const IMAGE_FILTER_PRESETS: ImageFilterPreset[] = [
    // Basic
    { id: 'none', name: 'None', category: 'basic', values: {} },
    { id: 'grayscale', name: 'Grayscale', category: 'basic', values: { filterSaturate: 0 } },

    // Warm
    { id: 'warm', name: 'Warm', category: 'warm', values: { filterSaturate: 130, filterHueRotate: 10, filterBrightness: 105 } },
    { id: 'sunny', name: 'Sunny', category: 'warm', values: { filterBrightness: 120, filterContrast: 110, filterSaturate: 120 } },
    { id: 'golden', name: 'Golden', category: 'warm', values: { filterSepia: 30, filterBrightness: 110, filterSaturate: 140 } },

    // Cool
    { id: 'cool', name: 'Cool', category: 'cool', values: { filterSaturate: 90, filterHueRotate: 190, filterBrightness: 105 } },
    { id: 'arctic', name: 'Arctic', category: 'cool', values: { filterBrightness: 110, filterContrast: 105, filterSaturate: 80, filterHueRotate: 200 } },

    // Vintage
    { id: 'sepia', name: 'Sepia', category: 'vintage', values: { filterSepia: 80 } },
    { id: 'vintage', name: 'Vintage', category: 'vintage', values: { filterSepia: 40, filterContrast: 120, filterBrightness: 90, filterSaturate: 80 } },
    { id: 'retro', name: 'Retro', category: 'vintage', values: { filterSepia: 25, filterContrast: 130, filterSaturate: 70, filterBrightness: 95 } },
    { id: 'faded', name: 'Faded', category: 'vintage', values: { filterContrast: 80, filterSaturate: 60, filterBrightness: 115 } },

    // Dramatic
    { id: 'highContrast', name: 'High Contrast', category: 'dramatic', values: { filterContrast: 170, filterBrightness: 105 } },
    { id: 'dramatic', name: 'Dramatic', category: 'dramatic', values: { filterContrast: 150, filterSaturate: 130, filterBrightness: 90 } },
    { id: 'noir', name: 'Noir', category: 'dramatic', values: { filterSaturate: 0, filterContrast: 160, filterBrightness: 90 } },
    { id: 'invert', name: 'Invert', category: 'dramatic', values: { filterInvert: 100 } },
];

export function getImageFilterPreset(id: string): ImageFilterPreset | undefined {
    return IMAGE_FILTER_PRESETS.find(p => p.id === id);
}
