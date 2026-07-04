import type { DrawingElement, Layer, ViewState, GridSettings } from '../types';

/**
 * Template category types
 * Can be extended to support new categories like 'sketchnotes', 'animations', etc.
 */
export type TemplateCategory =
    | 'diagrams'
    | 'sketchnotes'
    | 'animations'
    | 'wireframes'
    | 'dsl-examples'
    | 'presentations'
    | 'designs'
    | 'my-templates';

/**
 * Template metadata
 */
export interface TemplateMetadata {
    id: string;
    name: string;
    category: TemplateCategory;
    description: string;
    tags: string[];
    thumbnail?: string; // Base64 data URL or path
    author?: string;
    order?: number; // For sorting within category
    /** Fixed page size for design templates (shown as a badge in the browser) */
    pageSize?: { width: number; height: number };
}

/**
 * Drawing data structure (same as saved files)
 */
export interface DrawingData {
    elements: DrawingElement[];
    layers: Layer[];
    viewState?: ViewState;
    gridSettings?: GridSettings;
    canvasBackgroundColor?: string;
    version?: number;
}

/**
 * Complete template structure
 */
export interface Template {
    metadata: TemplateMetadata;
    data: DrawingData;
    /** DSL/Mermaid text content — when present, template is rendered via DSL engine instead of loading data.elements */
    dslContent?: string;
}

/**
 * Category information for UI
 */
export interface CategoryInfo {
    id: TemplateCategory;
    name: string;
    description: string;
    icon?: string;
}

// ─── Presentation Templates ────────────────────────────────

/**
 * Color palette for a presentation template or AI-generated deck
 */
export interface SlidePalette {
    primary: string;      // Main accent (titles, key elements)
    secondary: string;    // Darker shade (backgrounds, containers)
    accent: string;       // Contrasting pop color
    background: string;   // Slide background
    text: string;         // Primary text color
    // Optional tints — auto-derived if missing
    primaryLight?: string;   // Tinted primary (e.g. primary at 15% opacity)
    accentLight?: string;    // Tinted accent (e.g. accent at 20% opacity)
    gradientFrom?: string;   // Gradient start color
    gradientTo?: string;     // Gradient end color
}

/**
 * A single slide within a presentation template.
 * Element positions are relative to slide origin (0,0 = top-left).
 */
export interface PresentationSlideTemplate {
    name: string;
    backgroundColor?: string;
    fillStyle?: import('../types').FillStyle;
    gradientStops?: import('../types').GradientStop[];
    gradientDirection?: number;
    elements: Partial<DrawingElement>[];
    transition?: import('./slide-types').SlideTransition;
}

/**
 * A multi-slide presentation template.
 * Used by the template browser, AI generator, and markdown import.
 */
export interface PresentationTemplate {
    metadata: TemplateMetadata;
    slides: PresentationSlideTemplate[];
    palette?: SlidePalette;
    /** Dummy data field — not used, but satisfies Template['data'] when registered */
    data: DrawingData;
}

// ─── Design Templates (Canva-style fixed-size documents) ─────

/**
 * A single page within a design template.
 * Element positions are relative to page origin (0,0 = top-left).
 */
export interface DesignPageTemplate {
    name: string;
    backgroundColor?: string;
    fillStyle?: import('../types').FillStyle;
    gradientStops?: import('../types').GradientStop[];
    gradientDirection?: number;
    elements: Partial<DrawingElement>[];
}

/**
 * A fixed-page-size design template (social post, poster, card, …).
 * Loaded as a `design` document via loadDesignTemplate.
 */
export interface DesignTemplate {
    metadata: TemplateMetadata;
    pageSize: { width: number; height: number };
    pages: DesignPageTemplate[];
    palette?: SlidePalette;
    /** Dummy data field — satisfies Template['data'] when registered */
    data: DrawingData;
}

/**
 * A user-saved template: a full document snapshot (any docType), created via
 * "Save as Template". Loading it restores the snapshot as a new document.
 */
export interface UserTemplate {
    metadata: TemplateMetadata;
    /** Full v4 SlideDocument snapshot */
    doc: import('./slide-types').SlideDocument;
    /** Dummy data field — satisfies Template['data'] when registered */
    data: DrawingData;
}
