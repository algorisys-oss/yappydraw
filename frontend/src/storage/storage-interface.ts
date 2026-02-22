import type { DrawingElement, ViewState, Layer, GridSettings } from "../types";
import type { Slide, SlideDocument, SlideDocumentMetadata, GlobalSettings } from "../types/slide-types";
import type { DisplayState } from "../types/motion-types";

/**
 * Legacy drawing data format (v2 and earlier)
 * Represents a single canvas with elements
 */
export interface DrawingData {
    version: number;
    encoding?: string;
    elements: DrawingElement[];
    viewState: ViewState;
    layers?: Layer[];
    gridSettings?: GridSettings;
    globalSettings?: GlobalSettings;
    canvasBackgroundColor?: string;
    states?: DisplayState[];
    initialStateId?: string;
}

/**
 * New slide document format (v3)
 * Re-exported from slide-types for convenience
 */
export type { Slide, SlideDocument, SlideDocumentMetadata, GlobalSettings };

/**
 * Union type for loading - can be either old or new format
 */
export type DocumentData = DrawingData | SlideDocument;

/**
 * Type guard to check if data is the new slide format
 */
export const isSlideDocument = (data: any): data is SlideDocument => {
    return data && (data.version === 3 || data.version === 4) && Array.isArray(data.slides);
};

export interface StorageInterface {
    saveDrawing(id: string, data: DrawingData | SlideDocument): Promise<void>;
    loadDrawing(id: string): Promise<DocumentData | null>;
    listDrawings(): Promise<string[]>;
    deleteDrawing(id: string): Promise<void>;
}
