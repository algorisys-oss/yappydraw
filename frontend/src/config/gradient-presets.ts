/**
 * Predefined gradient presets inspired by draw.io and popular design tools.
 * Each preset includes colors and optional direction for best visual effect.
 */

export interface GradientPreset {
    id: string;
    name: string;
    category: 'warm' | 'cool' | 'nature' | 'metallic' | 'pastel' | 'vibrant' | 'dark' | 'light';
    stops: { offset: number; color: string }[];
    direction?: number; // Default gradient direction in degrees
}

export const GRADIENT_PRESETS: GradientPreset[] = [
    // ===== WARM =====
    {
        id: 'sunset',
        name: 'Sunset',
        category: 'warm',
        stops: [
            { offset: 0, color: '#ff512f' },
            { offset: 1, color: '#f09819' }
        ],
        direction: 135
    },
    {
        id: 'warmFlame',
        name: 'Warm Flame',
        category: 'warm',
        stops: [
            { offset: 0, color: '#ff9a9e' },
            { offset: 0.5, color: '#fecfef' },
            { offset: 1, color: '#fecfef' }
        ],
        direction: 90
    },
    {
        id: 'juicyPeach',
        name: 'Juicy Peach',
        category: 'warm',
        stops: [
            { offset: 0, color: '#ffecd2' },
            { offset: 1, color: '#fcb69f' }
        ],
        direction: 135
    },
    {
        id: 'sunriseGlow',
        name: 'Sunrise Glow',
        category: 'warm',
        stops: [
            { offset: 0, color: '#f83600' },
            { offset: 1, color: '#f9d423' }
        ],
        direction: 45
    },
    {
        id: 'coralReef',
        name: 'Coral Reef',
        category: 'warm',
        stops: [
            { offset: 0, color: '#ff6b6b' },
            { offset: 1, color: '#ffc3a0' }
        ],
        direction: 135
    },

    // ===== COOL =====
    {
        id: 'oceanBlue',
        name: 'Ocean Blue',
        category: 'cool',
        stops: [
            { offset: 0, color: '#2193b0' },
            { offset: 1, color: '#6dd5ed' }
        ],
        direction: 135
    },
    {
        id: 'coolSky',
        name: 'Cool Sky',
        category: 'cool',
        stops: [
            { offset: 0, color: '#a1c4fd' },
            { offset: 1, color: '#c2e9fb' }
        ],
        direction: 90
    },
    {
        id: 'winterNeva',
        name: 'Winter Neva',
        category: 'cool',
        stops: [
            { offset: 0, color: '#a1c4fd' },
            { offset: 1, color: '#c2e9fb' }
        ],
        direction: 120
    },
    {
        id: 'deepPurple',
        name: 'Deep Purple',
        category: 'cool',
        stops: [
            { offset: 0, color: '#7f00ff' },
            { offset: 1, color: '#e100ff' }
        ],
        direction: 135
    },
    {
        id: 'nightOwl',
        name: 'Night Owl',
        category: 'cool',
        stops: [
            { offset: 0, color: '#232526' },
            { offset: 1, color: '#414345' }
        ],
        direction: 180
    },
    {
        id: 'midnightCity',
        name: 'Midnight City',
        category: 'cool',
        stops: [
            { offset: 0, color: '#232526' },
            { offset: 1, color: '#414345' }
        ],
        direction: 90
    },

    // ===== NATURE =====
    {
        id: 'freshGrass',
        name: 'Fresh Grass',
        category: 'nature',
        stops: [
            { offset: 0, color: '#56ab2f' },
            { offset: 1, color: '#a8e063' }
        ],
        direction: 135
    },
    {
        id: 'springMeadow',
        name: 'Spring Meadow',
        category: 'nature',
        stops: [
            { offset: 0, color: '#00b09b' },
            { offset: 1, color: '#96c93d' }
        ],
        direction: 45
    },
    {
        id: 'forestDawn',
        name: 'Forest Dawn',
        category: 'nature',
        stops: [
            { offset: 0, color: '#134e5e' },
            { offset: 1, color: '#71b280' }
        ],
        direction: 135
    },
    {
        id: 'earthTone',
        name: 'Earth Tone',
        category: 'nature',
        stops: [
            { offset: 0, color: '#8B4513' },
            { offset: 1, color: '#D2691E' }
        ],
        direction: 135
    },
    {
        id: 'autumn',
        name: 'Autumn',
        category: 'nature',
        stops: [
            { offset: 0, color: '#DAA520' },
            { offset: 0.5, color: '#CD853F' },
            { offset: 1, color: '#8B4513' }
        ],
        direction: 180
    },

    // ===== METALLIC =====
    {
        id: 'silver',
        name: 'Silver',
        category: 'metallic',
        stops: [
            { offset: 0, color: '#bdc3c7' },
            { offset: 0.5, color: '#ecf0f1' },
            { offset: 1, color: '#bdc3c7' }
        ],
        direction: 135
    },
    {
        id: 'gold',
        name: 'Gold',
        category: 'metallic',
        stops: [
            { offset: 0, color: '#BF953F' },
            { offset: 0.25, color: '#FCF6BA' },
            { offset: 0.5, color: '#B38728' },
            { offset: 0.75, color: '#FBF5B7' },
            { offset: 1, color: '#AA771C' }
        ],
        direction: 135
    },
    {
        id: 'bronze',
        name: 'Bronze',
        category: 'metallic',
        stops: [
            { offset: 0, color: '#804A00' },
            { offset: 0.5, color: '#CD7F32' },
            { offset: 1, color: '#804A00' }
        ],
        direction: 135
    },
    {
        id: 'roseGold',
        name: 'Rose Gold',
        category: 'metallic',
        stops: [
            { offset: 0, color: '#b76e79' },
            { offset: 0.5, color: '#eacda3' },
            { offset: 1, color: '#b76e79' }
        ],
        direction: 135
    },
    {
        id: 'chrome',
        name: 'Chrome',
        category: 'metallic',
        stops: [
            { offset: 0, color: '#8e9eab' },
            { offset: 0.5, color: '#eef2f3' },
            { offset: 1, color: '#8e9eab' }
        ],
        direction: 90
    },

    // ===== PASTEL =====
    {
        id: 'softPink',
        name: 'Soft Pink',
        category: 'pastel',
        stops: [
            { offset: 0, color: '#ffecd2' },
            { offset: 1, color: '#fcb69f' }
        ],
        direction: 135
    },
    {
        id: 'lavenderDream',
        name: 'Lavender Dream',
        category: 'pastel',
        stops: [
            { offset: 0, color: '#e0c3fc' },
            { offset: 1, color: '#8ec5fc' }
        ],
        direction: 120
    },
    {
        id: 'mintFresh',
        name: 'Mint Fresh',
        category: 'pastel',
        stops: [
            { offset: 0, color: '#a8edea' },
            { offset: 1, color: '#fed6e3' }
        ],
        direction: 135
    },
    {
        id: 'peachyPink',
        name: 'Peachy Pink',
        category: 'pastel',
        stops: [
            { offset: 0, color: '#fad0c4' },
            { offset: 1, color: '#ffd1ff' }
        ],
        direction: 90
    },
    {
        id: 'cottonCandy',
        name: 'Cotton Candy',
        category: 'pastel',
        stops: [
            { offset: 0, color: '#f3e7e9' },
            { offset: 1, color: '#e3eeff' }
        ],
        direction: 135
    },

    // ===== VIBRANT =====
    {
        id: 'neonGlow',
        name: 'Neon Glow',
        category: 'vibrant',
        stops: [
            { offset: 0, color: '#00f260' },
            { offset: 1, color: '#0575e6' }
        ],
        direction: 135
    },
    {
        id: 'electricViolet',
        name: 'Electric Violet',
        category: 'vibrant',
        stops: [
            { offset: 0, color: '#4776e6' },
            { offset: 1, color: '#8e54e9' }
        ],
        direction: 135
    },
    {
        id: 'sunsetVibes',
        name: 'Sunset Vibes',
        category: 'vibrant',
        stops: [
            { offset: 0, color: '#fa709a' },
            { offset: 1, color: '#fee140' }
        ],
        direction: 135
    },
    {
        id: 'rainbow',
        name: 'Rainbow',
        category: 'vibrant',
        stops: [
            { offset: 0, color: '#ff0000' },
            { offset: 0.17, color: '#ff8000' },
            { offset: 0.33, color: '#ffff00' },
            { offset: 0.5, color: '#00ff00' },
            { offset: 0.67, color: '#0080ff' },
            { offset: 0.83, color: '#8000ff' },
            { offset: 1, color: '#ff0080' }
        ],
        direction: 90
    },
    {
        id: 'hotMagenta',
        name: 'Hot Magenta',
        category: 'vibrant',
        stops: [
            { offset: 0, color: '#ff00cc' },
            { offset: 1, color: '#333399' }
        ],
        direction: 135
    },

    // ===== DARK =====
    {
        id: 'darkOcean',
        name: 'Dark Ocean',
        category: 'dark',
        stops: [
            { offset: 0, color: '#373b44' },
            { offset: 1, color: '#4286f4' }
        ],
        direction: 135
    },
    {
        id: 'midnightBlue',
        name: 'Midnight Blue',
        category: 'dark',
        stops: [
            { offset: 0, color: '#0f0c29' },
            { offset: 0.5, color: '#302b63' },
            { offset: 1, color: '#24243e' }
        ],
        direction: 135
    },
    {
        id: 'darkForest',
        name: 'Dark Forest',
        category: 'dark',
        stops: [
            { offset: 0, color: '#0f2027' },
            { offset: 0.5, color: '#203a43' },
            { offset: 1, color: '#2c5364' }
        ],
        direction: 135
    },
    {
        id: 'charcoal',
        name: 'Charcoal',
        category: 'dark',
        stops: [
            { offset: 0, color: '#232526' },
            { offset: 1, color: '#414345' }
        ],
        direction: 135
    },
    {
        id: 'obsidian',
        name: 'Obsidian',
        category: 'dark',
        stops: [
            { offset: 0, color: '#0f0f0f' },
            { offset: 0.5, color: '#2d2d2d' },
            { offset: 1, color: '#0f0f0f' }
        ],
        direction: 90
    },

    // ===== LIGHT =====
    {
        id: 'snowWhite',
        name: 'Snow White',
        category: 'light',
        stops: [
            { offset: 0, color: '#e6e9f0' },
            { offset: 1, color: '#eef1f5' }
        ],
        direction: 135
    },
    {
        id: 'cloudySky',
        name: 'Cloudy Sky',
        category: 'light',
        stops: [
            { offset: 0, color: '#f5f7fa' },
            { offset: 1, color: '#c3cfe2' }
        ],
        direction: 90
    },
    {
        id: 'softGray',
        name: 'Soft Gray',
        category: 'light',
        stops: [
            { offset: 0, color: '#fafafa' },
            { offset: 1, color: '#dfdfdf' }
        ],
        direction: 180
    },
    {
        id: 'pearl',
        name: 'Pearl',
        category: 'light',
        stops: [
            { offset: 0, color: '#fffcdc' },
            { offset: 0.5, color: '#f7f7f7' },
            { offset: 1, color: '#fffcdc' }
        ],
        direction: 135
    },
    {
        id: 'morning',
        name: 'Morning',
        category: 'light',
        stops: [
            { offset: 0, color: '#f5f7fa' },
            { offset: 1, color: '#b8c6db' }
        ],
        direction: 90
    }
];

/**
 * Get gradient preset by ID
 */
export function getGradientPreset(id: string): GradientPreset | undefined {
    return GRADIENT_PRESETS.find(p => p.id === id);
}

/**
 * Get all presets in a category
 */
export function getPresetsByCategory(category: GradientPreset['category']): GradientPreset[] {
    return GRADIENT_PRESETS.filter(p => p.category === category);
}

/**
 * Get all category names
 */
export function getGradientCategories(): GradientPreset['category'][] {
    return ['warm', 'cool', 'nature', 'metallic', 'pastel', 'vibrant', 'dark', 'light'];
}
