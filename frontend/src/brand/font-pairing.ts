/**
 * Font pairings — curated heading/body combinations (Canva-style).
 * Applying a pair refonts every text element in the document (text at
 * HEADING_FONT_SIZE+ or bold gets the heading font, the rest the body font)
 * and sets the body font as the default for new text.
 */
import { setStore, pushToHistory, bumpDirtyRevision, updateDefaultStyles } from '../store/app-store';
import { addGoogleFont } from '../utils/custom-fonts';
import { showToast } from '../components/toast';
import type { DrawingElement } from '../types';

export interface PairFont {
    /** Built-in font key (e.g. 'poppins') or a Google Fonts family name */
    family: string;
    /** True when `family` is a Google Fonts family that must be loaded */
    google?: boolean;
}

export interface FontPairing {
    id: string;
    name: string;
    heading: PairFont;
    body: PairFont;
}

export const FONT_PAIRINGS: FontPairing[] = [
    { id: 'modern', name: 'Modern', heading: { family: 'poppins' }, body: { family: 'sans-serif' } },
    { id: 'editorial', name: 'Editorial', heading: { family: 'Playfair Display', google: true }, body: { family: 'Source Sans 3', google: true } },
    { id: 'bold-statement', name: 'Bold Statement', heading: { family: 'Bebas Neue', google: true }, body: { family: 'Inter', google: true } },
    { id: 'classic', name: 'Classic', heading: { family: 'Merriweather', google: true }, body: { family: 'Open Sans', google: true } },
    { id: 'geometric', name: 'Geometric', heading: { family: 'Montserrat', google: true }, body: { family: 'Lora', google: true } },
    { id: 'friendly', name: 'Friendly', heading: { family: 'Nunito', google: true }, body: { family: 'Roboto', google: true } },
    { id: 'elegant', name: 'Elegant', heading: { family: 'Cormorant Garamond', google: true }, body: { family: 'Nunito Sans', google: true } },
    { id: 'playful', name: 'Playful', heading: { family: 'caveat' }, body: { family: 'poppins' } },
    { id: 'technical', name: 'Technical', heading: { family: 'Space Grotesk', google: true }, body: { family: 'Work Sans', google: true } },
    { id: 'magazine', name: 'Magazine', heading: { family: 'Abril Fatface', google: true }, body: { family: 'Lato', google: true } },
];

export const getFontPairing = (id: string): FontPairing | undefined =>
    FONT_PAIRINGS.find(p => p.id === id);

/** Text at/above this size (or bold) counts as a heading — matches brand kit. */
const HEADING_FONT_SIZE = 40;

/** Resolve a pair font to a fontFamily key, loading Google fonts on demand. */
export async function resolvePairFont(f: PairFont): Promise<string> {
    if (!f.google) return f.family;
    const font = await addGoogleFont(f.family);
    return font.key;
}

/**
 * Apply a font pairing to every text element in the document and set the
 * body font as the default for new text. Returns the number updated.
 */
export async function applyFontPairing(id: string): Promise<number> {
    const pair = getFontPairing(id);
    if (!pair) {
        showToast('Unknown font pairing', 'error');
        return 0;
    }
    const [headingKey, bodyKey] = await Promise.all([
        resolvePairFont(pair.heading),
        resolvePairFont(pair.body),
    ]);

    pushToHistory();
    let updated = 0;
    setStore('elements', (e: DrawingElement) => e.type === 'text', (e: DrawingElement) => {
        updated++;
        const isHeading = (e.fontSize || 0) >= HEADING_FONT_SIZE || e.fontWeight === 'bold';
        return { fontFamily: (isHeading ? headingKey : bodyKey) as any };
    });
    updateDefaultStyles({ fontFamily: bodyKey as any });
    bumpDirtyRevision();
    showToast(updated > 0
        ? `"${pair.name}" applied to ${updated} text element${updated === 1 ? '' : 's'}`
        : `"${pair.name}" set for new text`, 'success');
    return updated;
}
