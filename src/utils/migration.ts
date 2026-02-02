import type { DrawingElement, Layer, GridSettings } from '../types';
import type { DisplayState } from '../types/motion-types';

const DEFAULT_LAYER_ID = 'default-layer';

/**
 * Normalize an element by ensuring all required properties have sane defaults
 * This prevents runtime errors from missing properties in templates or old data
 */
export const normalizeElement = (el: Partial<DrawingElement> & { id: string; type: string }): DrawingElement => {
    return {
        // Core properties (required)
        id: el.id,
        type: el.type as any,
        x: el.x ?? 0,
        y: el.y ?? 0,
        width: el.width ?? 100,
        height: el.height ?? 100,

        // Style properties with sane defaults
        strokeColor: el.strokeColor ?? '#000000',
        backgroundColor: el.backgroundColor ?? 'transparent',
        fillStyle: el.fillStyle ?? 'hachure',
        strokeWidth: el.strokeWidth ?? 1,
        strokeStyle: el.strokeStyle ?? 'solid',
        roughness: el.roughness ?? 1,
        opacity: el.opacity ?? 100,
        angle: el.angle ?? 0,
        renderStyle: el.renderStyle ?? 'sketch',
        seed: el.seed ?? Math.floor(Math.random() * 2147483647),
        roundness: el.roundness ?? null,
        locked: el.locked ?? false,
        link: el.link ?? null,
        tag: el.tag ?? null,

        // Layer reference
        layerId: el.layerId || DEFAULT_LAYER_ID,

        // Optional properties (passed through if present)
        ...(el.points && { points: el.points }),
        ...(el.pointsEncoding !== undefined && { pointsEncoding: el.pointsEncoding }),
        ...(el.startArrowhead !== undefined && { startArrowhead: el.startArrowhead }),
        ...(el.endArrowhead !== undefined && { endArrowhead: el.endArrowhead }),
        ...(el.text !== undefined && { text: el.text }),
        ...(el.rawText !== undefined && { rawText: el.rawText }),
        ...(el.fontSize !== undefined && { fontSize: el.fontSize }),
        ...(el.fontFamily !== undefined && { fontFamily: el.fontFamily }),
        ...(el.fontWeight !== undefined && { fontWeight: el.fontWeight }),
        ...(el.fontStyle !== undefined && { fontStyle: el.fontStyle }),
        ...(el.textAlign !== undefined && { textAlign: el.textAlign }),
        ...(el.verticalAlign !== undefined && { verticalAlign: el.verticalAlign }),
        ...(el.textColor !== undefined && { textColor: el.textColor }),
        ...(el.textHighlightEnabled !== undefined && { textHighlightEnabled: el.textHighlightEnabled }),
        ...(el.textHighlightColor !== undefined && { textHighlightColor: el.textHighlightColor }),
        ...(el.textHighlightPadding !== undefined && { textHighlightPadding: el.textHighlightPadding }),
        ...(el.textHighlightRadius !== undefined && { textHighlightRadius: el.textHighlightRadius }),
        ...(el.containerId !== undefined && { containerId: el.containerId }),
        ...(el.containerText !== undefined && { containerText: el.containerText }),
        ...(el.labelPosition !== undefined && { labelPosition: el.labelPosition }),
        ...(el.fileId !== undefined && { fileId: el.fileId }),
        ...(el.scale !== undefined && { scale: el.scale }),
        ...(el.crop !== undefined && { crop: el.crop }),
        ...(el.status !== undefined && { status: el.status }),
        ...(el.dataURL !== undefined && { dataURL: el.dataURL }),
        ...(el.mimeType !== undefined && { mimeType: el.mimeType }),
        ...(el.groupIds !== undefined && { groupIds: el.groupIds }),
        ...(el.boundElements !== undefined && { boundElements: el.boundElements }),
        ...(el.isSelected !== undefined && { isSelected: el.isSelected }),
        ...(el.startBinding !== undefined && { startBinding: el.startBinding }),
        ...(el.endBinding !== undefined && { endBinding: el.endBinding }),
        ...(el.curveType !== undefined && { curveType: el.curveType }),
        ...(el.parentId !== undefined && { parentId: el.parentId }),
        ...(el.isCollapsed !== undefined && { isCollapsed: el.isCollapsed }),
        ...(el.constrained !== undefined && { constrained: el.constrained }),
        ...(el.autoResize !== undefined && { autoResize: el.autoResize }),
        ...(el.starPoints !== undefined && { starPoints: el.starPoints }),
        ...(el.polygonSides !== undefined && { polygonSides: el.polygonSides }),
        ...(el.borderRadius !== undefined && { borderRadius: el.borderRadius }),
        ...(el.burstPoints !== undefined && { burstPoints: el.burstPoints }),
        ...(el.tailPosition !== undefined && { tailPosition: el.tailPosition }),
        ...(el.shapeRatio !== undefined && { shapeRatio: el.shapeRatio }),
        ...(el.drawInnerBorder !== undefined && { drawInnerBorder: el.drawInnerBorder }),
        ...(el.innerBorderColor !== undefined && { innerBorderColor: el.innerBorderColor }),
        ...(el.innerBorderDistance !== undefined && { innerBorderDistance: el.innerBorderDistance }),
        ...(el.strokeLineJoin !== undefined && { strokeLineJoin: el.strokeLineJoin }),
        ...(el.fillDensity !== undefined && { fillDensity: el.fillDensity }),

        // Shadows
        ...(el.shadowEnabled !== undefined && { shadowEnabled: el.shadowEnabled }),
        ...(el.shadowColor !== undefined && { shadowColor: el.shadowColor }),
        ...(el.shadowBlur !== undefined && { shadowBlur: el.shadowBlur }),
        ...(el.shadowOffsetX !== undefined && { shadowOffsetX: el.shadowOffsetX }),
        ...(el.shadowOffsetY !== undefined && { shadowOffsetY: el.shadowOffsetY }),

        // Gradients
        ...(el.gradientStart !== undefined && { gradientStart: el.gradientStart }),
        ...(el.gradientEnd !== undefined && { gradientEnd: el.gradientEnd }),
        ...(el.gradientDirection !== undefined && { gradientDirection: el.gradientDirection }),
        ...(el.gradientStops !== undefined && { gradientStops: el.gradientStops }),
        ...(el.gradientType !== undefined && { gradientType: el.gradientType }),
        ...(el.gradientHandlePositions !== undefined && { gradientHandlePositions: el.gradientHandlePositions }),

        // Effects
        ...(el.blendMode !== undefined && { blendMode: el.blendMode }),
        ...(el.filter !== undefined && { filter: el.filter }),

        // Animation Settings
        ...(el.entranceAnimation !== undefined && { entranceAnimation: el.entranceAnimation }),
        ...(el.animations !== undefined && { animations: el.animations }),

        // Control Points
        ...(el.controlPoints !== undefined && { controlPoints: el.controlPoints }),

        // Motion Graphics
        ...(el.flowAnimation !== undefined && { flowAnimation: el.flowAnimation }),
        ...(el.flowSpeed !== undefined && { flowSpeed: el.flowSpeed }),
        ...(el.flowStyle !== undefined && { flowStyle: el.flowStyle }),
        ...(el.flowColor !== undefined && { flowColor: el.flowColor }),
        ...(el.flowDensity !== undefined && { flowDensity: el.flowDensity }),
        ...(el.isMotionPath !== undefined && { isMotionPath: el.isMotionPath }),
    } as DrawingElement;
};

export const migrateElements = (elements: any[]): DrawingElement[] => {
    return elements.map(el => normalizeElement(el));
};

export const migrateDrawingData = (data: any): {
    elements: DrawingElement[];
    layers: Layer[];
    viewState: { scale: number; panX: number; panY: number };
    gridSettings?: GridSettings;
    globalSettings?: GlobalSettings;
    canvasBackgroundColor?: string;
    states?: DisplayState[];
    initialStateId?: string;
} => {
    // Use existing layers or create default
    const layers: Layer[] = data.layers || [
        {
            id: DEFAULT_LAYER_ID,
            name: 'Layer 1',
            visible: true,
            locked: false,
            opacity: 1,
            order: 0,
            backgroundColor: 'transparent',
            colorTag: undefined,
            parentId: undefined,
            isGroup: false,
            expanded: true
        }
    ];

    // Ensure all layers have grouping properties
    const migratedLayers = layers.map(l => ({
        ...l,
        parentId: l.parentId,
        isGroup: l.isGroup ?? false,
        expanded: l.expanded ?? true
    }));

    // Ensure all elements have required properties with defaults
    const elements = migrateElements(data.elements || []);

    return {
        elements,
        layers: migratedLayers,
        viewState: data.viewState || { scale: 1, panX: 0, panY: 0 },
        gridSettings: data.gridSettings,
        globalSettings: data.globalSettings,
        canvasBackgroundColor: data.canvasBackgroundColor,
        states: data.states || [],
        initialStateId: data.initialStateId
    };
};

import type { SlideDocument, Slide, GlobalSettings } from '../types/slide-types';

/**
 * Check if data is already in the v3+ slide format (v3 or v4)
 */
export const isSlideDocument = (data: any): data is SlideDocument => {
    return data && (data.version === 3 || data.version === 4) && Array.isArray(data.slides);
};

/**
 * Migrate legacy v2 format to new v3 slide format
 */
export const migrateToSlideFormat = (data: any): SlideDocument => {
    // If already v3, return as-is
    if (isSlideDocument(data)) {
        return data;
    }

    // Migrate the drawing data first (handles element/layer normalization)
    const migrated = migrateDrawingData(data);

    // Create a single slide from the legacy data (Spatial Viewport)
    const slide: Slide = {
        id: crypto.randomUUID(),
        name: 'Slide 1',
        spatialPosition: { x: 0, y: 0 },
        dimensions: { width: 1920, height: 1080 }, // Default for migrated slides
        backgroundColor: migrated.canvasBackgroundColor || '#ffffff',
        order: 0
    };

    return {
        version: 4,
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        elements: migrated.elements,
        layers: migrated.layers,
        slides: [slide],
        globalSettings: data.globalSettings || {},
        gridSettings: migrated.gridSettings,
        states: migrated.states
    };
};

/**
 * Extract the current slide data in legacy format (for backward compatibility)
 * Useful when app still works with single canvas internally
 */
export const extractSlideAsLegacy = (doc: SlideDocument, slideIndex: number = 0): {
    elements: DrawingElement[];
    layers: Layer[];
    viewState: { scale: number; panX: number; panY: number };
    gridSettings?: GridSettings;
    globalSettings?: GlobalSettings;
    canvasBackgroundColor?: string;
    states?: DisplayState[];
    initialStateId?: string;
} => {
    const slide = doc.slides[slideIndex];
    if (!slide) {
        return {
            elements: [],
            layers: [{
                id: DEFAULT_LAYER_ID,
                name: 'Layer 1',
                visible: true,
                locked: false,
                opacity: 1,
                order: 0,
                backgroundColor: 'transparent'
            }],
            viewState: { scale: 1, panX: 0, panY: 0 }
        };
    }

    return {
        elements: doc.elements,
        layers: doc.layers,
        viewState: { scale: 1, panX: -slide.spatialPosition.x, panY: -slide.spatialPosition.y },
        gridSettings: doc.gridSettings,
        globalSettings: doc.globalSettings,
        canvasBackgroundColor: slide.backgroundColor || '#ffffff',
        states: doc.states
    };
};
