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
 * Document types:
 * - 'infinite': free-form infinite canvas
 * - 'slides': paged presentation (16:9 slides, transitions, present mode)
 * - 'design': paged Canva-style design document (fixed-size pages, size presets)
 * 'slides' and 'design' share the same paged substrate (Slide frames).
 */
export type DocType = 'infinite' | 'slides' | 'design';

/** True for document types built on paged Slide frames (slides + design). */
export const isPagedDocType = (t?: string | null): boolean => t === 'slides' || t === 'design';

/**
 * Metadata for a slide document
 */
export interface SlideDocumentMetadata {
    name?: string;
    createdAt?: string;
    updatedAt?: string;
    docType?: DocType;
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
    toolbarVertical?: boolean;         // Orient the main toolbar vertically (left edge) instead of horizontally (top)
    toolbarWrap?: number;              // Wrap toolbar icons into a grid of this pixel width (0/undefined = single line)
    timelapseAutoRecord?: boolean;     // Automatically capture a process time-lapse for every session (default off)
    timelapseCaptureWidth?: number;    // Longest-edge resolution (px) for captured time-lapse frames (default 1024)
    timelapseTargetDuration?: number;  // Target length (seconds) for the exported time-lapse video (default 30)
    historyDepth?: number;             // Max undo states retained (default 50)
    bleed?: number;                    // Print bleed margin (px) drawn around artboards; >0 also shows crop marks
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
    symbols?: import('../types').SymbolDef[];
    artboards?: import('../types').Artboard[];
    graphicStyles?: import('../types').GraphicStyle[];
    swatches?: import('../types').Swatch[];
    patterns?: import('../types').PatternSwatch[];
    /** Arcade: JavaScript game script run by the in-editor Play mode and the HTML player.
     *  When the visual builder is used, this is regenerated from the behaviors. */
    gameScript?: string;
    /** Arcade visual builder: scene-level WHEN→DO rules (on start, score, win/lose). */
    sceneBehaviors?: import('../types').DrawingElement['behaviors'];
}

/**
 * Default slide factory
 */
export const createDefaultSlide = (id?: string, name?: string, x: number = 0, y: number = 0, dimensions?: { width: number, height: number }): Slide => ({
    id: id || crypto.randomUUID(),
    name: name || 'Slide 1',
    spatialPosition: { x, y },
    dimensions: dimensions ? { ...dimensions } : { width: 1920, height: 1080 }, // Default 1080p
    backgroundColor: '',
    order: 0,
    transition: { ...DEFAULT_SLIDE_TRANSITION }
});

/**
 * Create a new empty slide document
 */
export const createSlideDocument = (name?: string, docType: DocType = 'slides', pageSize?: { width: number, height: number }): SlideDocument => ({
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
    slides: [createDefaultSlide(undefined, docType === 'design' ? 'Page 1' : 'Slide 1', 0, 0, pageSize)],
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
