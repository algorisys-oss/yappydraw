/**
 * Page size presets for Design documents (Canva-style fixed-size pages).
 * Dimensions are in canvas units (px). Print sizes use 300 DPI equivalents.
 */
export interface PageSizePreset {
    id: string;
    name: string;
    category: 'social' | 'presentation' | 'print' | 'video';
    width: number;
    height: number;
    /** Short human-readable size hint shown in the picker (e.g. "1080 × 1080") */
    hint?: string;
}

export const PAGE_SIZE_PRESETS: PageSizePreset[] = [
    // Social
    { id: 'instagram-post', name: 'Instagram Post', category: 'social', width: 1080, height: 1080 },
    { id: 'instagram-story', name: 'Instagram Story', category: 'social', width: 1080, height: 1920 },
    { id: 'facebook-post', name: 'Facebook Post', category: 'social', width: 1200, height: 630 },
    { id: 'facebook-cover', name: 'Facebook Cover', category: 'social', width: 1640, height: 924 },
    { id: 'x-post', name: 'X / Twitter Post', category: 'social', width: 1600, height: 900 },
    { id: 'linkedin-post', name: 'LinkedIn Post', category: 'social', width: 1200, height: 1200 },
    // Video
    { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', category: 'video', width: 1280, height: 720 },
    { id: 'presentation-16-9', name: 'Presentation 16:9', category: 'presentation', width: 1920, height: 1080 },
    { id: 'presentation-4-3', name: 'Presentation 4:3', category: 'presentation', width: 1600, height: 1200 },
    // Print (300 DPI)
    { id: 'a4-portrait', name: 'A4 Portrait', category: 'print', width: 2480, height: 3508 },
    { id: 'a4-landscape', name: 'A4 Landscape', category: 'print', width: 3508, height: 2480 },
    { id: 'us-letter', name: 'US Letter', category: 'print', width: 2550, height: 3300 },
    { id: 'business-card', name: 'Business Card', category: 'print', width: 1050, height: 600 },
    { id: 'poster-18-24', name: 'Poster 18×24"', category: 'print', width: 5400, height: 7200 },
    { id: 'flyer-a5', name: 'Flyer A5', category: 'print', width: 1748, height: 2480 },
];

export const PAGE_PRESET_CATEGORIES: { id: PageSizePreset['category']; label: string }[] = [
    { id: 'social', label: 'Social Media' },
    { id: 'video', label: 'Video' },
    { id: 'presentation', label: 'Presentation' },
    { id: 'print', label: 'Print' },
];

/** Find the preset matching exact dimensions, or undefined (= custom size). */
export const findPagePreset = (width: number, height: number): PageSizePreset | undefined =>
    PAGE_SIZE_PRESETS.find(p => p.width === width && p.height === height);

export const getPagePreset = (id: string): PageSizePreset | undefined =>
    PAGE_SIZE_PRESETS.find(p => p.id === id);

export const DEFAULT_DESIGN_PAGE_SIZE = { width: 1080, height: 1080 };
