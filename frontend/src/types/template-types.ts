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
    | 'dsl-examples';

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
