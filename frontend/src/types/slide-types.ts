import type { DrawingElement, Layer, GridSettings, FillStyle, GradientStop } from '../types';
import type { DisplayState } from './motion-types';

/**
 * Available slide transition types
 */
export type SlideTransitionType =
    | 'none'
    | 'fade'
    | 'slide-left'
    | 'slide-right'
    | 'slide-up'
    | 'slide-down'
    | 'zoom-in'
    | 'zoom-out';

/**
 * Available easing functions for transitions
 */
export type SlideTransitionEasing =
    | 'linear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeOutBack'
    | 'easeSpring';

/**
 * Configuration for a slide transition
 */
export interface SlideTransition {
    type: SlideTransitionType;
    duration: number;  // milliseconds
    easing: SlideTransitionEasing;
}

/**
 * Default transition settings
 */
export const DEFAULT_SLIDE_TRANSITION: SlideTransition = {
    type: 'none',
    duration: 500,
    easing: 'easeInOutQuad'
};

/**
 * Represents a single slide frame in the spatial canvas
 */
export interface Slide {
    id: string;
    name: string;
    spatialPosition: { x: number, y: number };
    dimensions: { width: number, height: number }; // slide dimensions in canvas units
    order: number;
    backgroundColor?: string;
    fillStyle?: FillStyle;
    gradientStops?: GradientStop[];
    gradientDirection?: number;
    backgroundImage?: string;
    backgroundOpacity?: number;
    canvasTexture?: 'none' | 'dots' | 'grid' | 'graph' | 'paper' | 'notebook';
    thumbnail?: string; // Data URL preview
    transition?: SlideTransition; // Transition when entering this slide
    lastViewState?: { scale: number; panX: number; panY: number }; // Persisted viewport state
}

/**
 * Metadata for a slide document
 */
export interface SlideDocumentMetadata {
    name?: string;
    createdAt?: string;
    updatedAt?: string;
    docType?: 'infinite' | 'slides';
}

/**
 * Global settings that apply across the entire canvas
 */
export interface GlobalSettings {
    theme?: 'light' | 'dark' | 'focus' | 'system';
    defaultStyles?: Partial<DrawingElement>;
    animationEnabled?: boolean; // Global toggle
    reducedMotion?: boolean;    // Accessibility preference
    renderStyle?: 'sketch' | 'architectural'; // Default style for new elements
    showQuickToolbar?: boolean; // Toggle floating quick toolbar
    colorPalette?: string;      // ID of the active color palette (see config/color-palettes.ts)
    smartShape?: boolean;       // Hold-to-correct: dwell at end of a pen stroke snaps it to a clean shape (default on)
    penPressure?: boolean;      // Use Apple Pencil force / pointer pressure for variable stroke width (default on)
    penStabilization?: number;  // Pulled-string "lazy brush" strength 0..1 for freehand inking (0 = off, default)
    mindmapAutoLayout?: boolean;       // Auto-reflow mindmap trees on every add/collapse/delete/reparent (default on)
    mindmapLayoutDirection?: 'horizontal-right' | 'horizontal-left' | 'vertical-down' | 'vertical-up' | 'radial' | 'balanced'; // Default direction for trees with no explicit choice
}

/**
 * The new v4 document format with spatial unified canvas
 */
export interface SlideDocument {
    version: 4;
    metadata: SlideDocumentMetadata;
    elements: DrawingElement[];
    layers: Layer[];
    slides: Slide[];
    globalSettings?: GlobalSettings;
    gridSettings?: GridSettings;
    states?: DisplayState[];
}

/**
 * Default slide factory
 */
export const createDefaultSlide = (id?: string, name?: string, x: number = 0, y: number = 0): Slide => ({
    id: id || crypto.randomUUID(),
    name: name || 'Slide 1',
    spatialPosition: { x, y },
    dimensions: { width: 1920, height: 1080 }, // Default 1080p
    backgroundColor: '',
    order: 0,
    transition: { ...DEFAULT_SLIDE_TRANSITION }
});

/**
 * Create a new empty slide document
 */
export const createSlideDocument = (name?: string, docType: 'infinite' | 'slides' = 'slides'): SlideDocument => ({
    version: 4,
    metadata: {
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        docType
    },
    elements: [],
    layers: [{
        id: 'default-layer',
        name: 'Layer 1',
        visible: true,
        locked: false,
        opacity: 1,
        order: 0,
        backgroundColor: 'transparent'
    }],
    slides: [createDefaultSlide()],
    globalSettings: {},
    gridSettings: {
        enabled: false,
        snapToGrid: false,
        objectSnapping: true,
        gridSize: 20,
        gridColor: '#cccccc',
        gridOpacity: 0.5,
        style: 'lines'
    }
});
