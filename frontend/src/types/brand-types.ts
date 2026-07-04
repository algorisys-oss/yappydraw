/**
 * Brand Kit — a reusable bundle of brand colors, fonts, and logo
 * (Canva-style). Kits are app-level (shared across documents).
 */
export interface BrandColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
}

export interface BrandFonts {
    /** Font key for headings (fontFamily value, e.g. 'poppins' or 'google-Roboto') */
    heading: string;
    /** Font key for body text */
    body: string;
}

export interface BrandKit {
    id: string;
    name: string;
    /** Logo image as a data URL */
    logo?: string;
    colors: BrandColors;
    fonts: BrandFonts;
    createdAt: string;
}

export const DEFAULT_BRAND_COLORS: BrandColors = {
    primary: '#4f46e5',
    secondary: '#0f172a',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1e293b',
};

export const DEFAULT_BRAND_FONTS: BrandFonts = {
    heading: 'poppins',
    body: 'sans-serif',
};
