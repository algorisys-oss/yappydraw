/**
 * Canvas background themes — named presets that bundle a background fill + a canvas
 * texture (dot/line/graph grid, notebook rule, or paper). The texture ink is derived
 * from the background luminance at render time (see `renderCanvasTexture`), so dark
 * themes (Blueprint / Dark) get light grid lines automatically. Only `background` and
 * `texture` are stored on the document — both already persist — so a theme is just a
 * one-click way to set that pair.
 */
export type CanvasTexture = 'none' | 'dots' | 'grid' | 'graph' | 'paper' | 'notebook';

export interface CanvasTheme {
    id: string;
    name: string;
    background: string;
    texture: CanvasTexture;
}

export const CANVAS_THEMES: CanvasTheme[] = [
    { id: 'plain', name: 'Plain', background: '#ffffff', texture: 'none' },
    { id: 'dot-grid', name: 'Dot Grid', background: '#ffffff', texture: 'dots' },
    { id: 'line-grid', name: 'Line Grid', background: '#ffffff', texture: 'grid' },
    { id: 'graph', name: 'Graph Paper', background: '#fbfcf8', texture: 'graph' },
    { id: 'notebook', name: 'Notebook', background: '#fffdf5', texture: 'notebook' },
    { id: 'paper', name: 'Paper', background: '#f4ecd8', texture: 'paper' },
    { id: 'parchment', name: 'Parchment', background: '#e9dcbe', texture: 'paper' },
    { id: 'blueprint', name: 'Blueprint', background: '#0e3a63', texture: 'grid' },
    { id: 'dark-dots', name: 'Dark', background: '#1e1f22', texture: 'dots' },
    { id: 'chalkboard', name: 'Chalkboard', background: '#22322b', texture: 'grid' },
];

/** Find the theme whose (background, texture) matches, for highlighting the active one. */
export function matchCanvasTheme(background: string, texture: string): CanvasTheme | undefined {
    return CANVAS_THEMES.find(t => t.background.toLowerCase() === (background || '').toLowerCase() && t.texture === texture);
}
