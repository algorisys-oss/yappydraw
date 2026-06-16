/**
 * Quick Toolbar Configuration
 * Maps element type families to the compact quick-property controls shown in the floating toolbar.
 */

import type { ElementType } from '../types';
import { IMAGE_FILTER_PRESETS } from './image-filter-presets';

/** Broad families that group element types for toolbar purposes */
export type ElementFamily = 'shape' | 'connector' | 'text' | 'drawing' | 'image' | 'video';

/** Control types that can render in the compact toolbar */
export type QuickControlType = 'color-dot' | 'icon-toggle' | 'icon-select' | 'mini-slider' | 'preset-select';

/** For preset-select: a preset option with id, label, and category */
export interface PresetOption {
    value: string;
    label: string;
    category?: string;
}

export interface QuickPropertyDef {
    key: string;                // DrawingElement property key
    controlType: QuickControlType;
    label: string;              // tooltip text
    // For icon-select
    options?: { value: any; icon: string; label: string }[];
    // For preset-select
    presetOptions?: PresetOption[];
    // For mini-slider
    min?: number;
    max?: number;
    step?: number;
    // If set, only show this control for these specific element types (within the family)
    applicableTo?: ElementType[];
}

/** 8 preset colors for quick color pickers */
export const QUICK_COLORS = [
    '#000000', '#e03131', '#e8590c', '#fcc419',
    '#2f9e44', '#1971c2', '#6741d9', '#ffffff'
];

const CONNECTOR_TYPES: ElementType[] = ['line', 'arrow', 'bezier', 'elbow', 'organicBranch', 'polyline'];
const DRAWING_TYPES: ElementType[] = ['fineliner', 'inkbrush', 'marker'];
const TOOL_TYPES: (ElementType | 'lasso' | 'crop')[] = ['eraser', 'pan', 'selection', 'laser', 'ink', 'lasso', 'crop'];

/** Classify an element type into its family */
export function getElementFamily(type: ElementType): ElementFamily | null {
    if (TOOL_TYPES.includes(type)) return null;
    if (CONNECTOR_TYPES.includes(type)) return 'connector';
    if (type === 'text' || type === 'richtext') return 'text';
    if (DRAWING_TYPES.includes(type)) return 'drawing';
    if (type === 'image') return 'image';
    if (type === 'video') return 'video';
    return 'shape';
}

/** All font options shared across shape and text toolbars */
const fontFamilyOptions = [
    { value: 'hand-drawn', icon: 'fontHand', label: 'Virgil' },
    { value: 'caveat', icon: 'fontCaveat', label: 'Caveat' },
    { value: 'marker', icon: 'fontMarker', label: 'Marker' },
    { value: 'sans-serif', icon: 'fontSans', label: 'Inter' },
    { value: 'poppins', icon: 'fontPoppins', label: 'Poppins' },
    { value: 'serif', icon: 'fontSerif', label: 'Merriweather' },
    { value: 'monospace', icon: 'fontMono', label: 'Source Code Pro' },
    { value: 'code', icon: 'fontCode', label: 'JetBrains Mono' },
];

/** Closed shapes whose outline can carry curved text (mirrors text-on-path.ts). */
const CURVED_TEXT_SHAPES: ElementType[] = [
    'rectangle', 'circle', 'diamond', 'triangle',
    'pentagon', 'hexagon', 'septagon', 'octagon', 'polygon',
    'capsule', 'parallelogram', 'star',
];

/** Quick properties for shapes (rectangle, circle, diamond, star, etc.) */
const shapeProperties: QuickPropertyDef[] = [
    { key: 'strokeColor', controlType: 'color-dot', label: 'Stroke Color' },
    { key: 'backgroundColor', controlType: 'color-dot', label: 'Fill Color' },
    {
        key: 'borderRadius', controlType: 'mini-slider', label: 'Roundness',
        min: 0, max: 50, step: 1,
        applicableTo: ['rectangle', 'diamond', 'capsule', 'speechBubble', 'browserWindow',
            'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown',
            'card', 'searchBar', 'badge', 'tooltip', 'dfdProcess', 'isometricCube',
            'cylinder', 'stateSync', 'activationBar', 'externalEntity']
    },
    {
        key: 'strokeStyle', controlType: 'icon-select', label: 'Stroke Style',
        options: [
            { value: 'solid', icon: 'solid', label: 'Solid' },
            { value: 'dashed', icon: 'dashed', label: 'Dashed' },
            { value: 'dotted', icon: 'dotted', label: 'Dotted' },
        ]
    },
    { key: 'opacity', controlType: 'mini-slider', label: 'Opacity', min: 0, max: 100, step: 5 },
    {
        key: 'fontSize', controlType: 'mini-slider', label: 'Font Size',
        min: 8, max: 72, step: 1,
        applicableTo: ['codeBlock', 'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable']
    },
    {
        key: 'fontFamily', controlType: 'icon-select', label: 'Font',
        options: fontFamilyOptions
    },
    {
        key: 'textAlign', controlType: 'icon-select', label: 'Text Align',
        options: [
            { value: 'left', icon: 'alignLeft', label: 'Left' },
            { value: 'center', icon: 'alignCenter', label: 'Center' },
            { value: 'right', icon: 'alignRight', label: 'Right' },
        ]
    },
    {
        key: 'verticalAlign', controlType: 'icon-select', label: 'Vertical Align',
        options: [
            { value: 'top', icon: 'alignTop', label: 'Top' },
            { value: 'middle', icon: 'alignMiddle', label: 'Middle' },
            { value: 'bottom', icon: 'alignBottom', label: 'Bottom' },
        ]
    },
    { key: 'curvedText', controlType: 'icon-toggle', label: 'Curved Text (wrap around outline)', applicableTo: CURVED_TEXT_SHAPES },
];

/** Quick properties for connectors (line, arrow, bezier) */
const connectorProperties: QuickPropertyDef[] = [
    { key: 'strokeColor', controlType: 'color-dot', label: 'Stroke Color' },
    { key: 'strokeWidth', controlType: 'mini-slider', label: 'Line Width', min: 1, max: 20, step: 1 },
    {
        key: 'strokeStyle', controlType: 'icon-select', label: 'Stroke Style',
        options: [
            { value: 'solid', icon: 'solid', label: 'Solid' },
            { value: 'dashed', icon: 'dashed', label: 'Dashed' },
            { value: 'dotted', icon: 'dotted', label: 'Dotted' },
        ]
    },
    {
        key: 'curveType', controlType: 'icon-select', label: 'Line Type',
        options: [
            { value: 'straight', icon: 'straight', label: 'Straight' },
            { value: 'bezier', icon: 'curve', label: 'Curved' },
            { value: 'elbow', icon: 'elbow', label: 'Elbow' },
        ]
    },
    {
        key: 'startArrowhead', controlType: 'icon-select', label: 'Line Start',
        options: [
            { value: null, icon: 'startNone', label: 'None' },
            { value: 'arrow', icon: 'startArrow', label: 'Arrow' },
            { value: 'triangle', icon: 'startTriangle', label: 'Triangle' },
            { value: 'diamond', icon: 'startDiamond', label: 'Diamond' },
        ]
    },
    {
        key: 'endArrowhead', controlType: 'icon-select', label: 'Line End',
        options: [
            { value: null, icon: 'none', label: 'None' },
            { value: 'arrow', icon: 'arrow', label: 'Arrow' },
            { value: 'triangle', icon: 'triangle', label: 'Triangle' },
            { value: 'diamond', icon: 'diamond', label: 'Diamond' },
        ]
    },
    // Connectors: line/arrow (any curveType: straight/bezier/elbow/polyline) + organicBranch.
    { key: 'curvedText', controlType: 'icon-toggle', label: 'Curved Text', applicableTo: ['organicBranch', 'line', 'arrow'] },
];

/** Quick properties for text elements */
const textProperties: QuickPropertyDef[] = [
    { key: 'strokeColor', controlType: 'color-dot', label: 'Text Color' },
    {
        key: 'fontFamily', controlType: 'icon-select', label: 'Font',
        options: fontFamilyOptions
    },
    { key: 'fontSize', controlType: 'mini-slider', label: 'Font Size', min: 8, max: 200, step: 2 },
    { key: 'fontWeight', controlType: 'icon-toggle', label: 'Bold' },
    { key: 'fontStyle', controlType: 'icon-toggle', label: 'Italic' },
    {
        key: 'textAlign', controlType: 'icon-select', label: 'Text Align',
        options: [
            { value: 'left', icon: 'alignLeft', label: 'Left' },
            { value: 'center', icon: 'alignCenter', label: 'Center' },
            { value: 'right', icon: 'alignRight', label: 'Right' },
        ]
    },
    {
        key: 'verticalAlign', controlType: 'icon-select', label: 'Vertical Align',
        options: [
            { value: 'top', icon: 'alignTop', label: 'Top' },
            { value: 'middle', icon: 'alignMiddle', label: 'Middle' },
            { value: 'bottom', icon: 'alignBottom', label: 'Bottom' },
        ]
    },
];

/** Quick properties for freehand drawing tools */
const drawingProperties: QuickPropertyDef[] = [
    { key: 'strokeColor', controlType: 'color-dot', label: 'Stroke Color' },
    { key: 'strokeWidth', controlType: 'mini-slider', label: 'Stroke Width', min: 1, max: 20, step: 1 },
    { key: 'curvedText', controlType: 'icon-toggle', label: 'Curved Text (follow stroke)', applicableTo: ['fineliner', 'inkbrush', 'marker'] },
];

/** Filter preset options for the quick toolbar dropdown */
const filterPresetOptions: PresetOption[] = IMAGE_FILTER_PRESETS.map(p => ({
    value: p.id,
    label: p.name,
    category: p.category,
}));

/** Quick properties for images */
const imageProperties: QuickPropertyDef[] = [
    { key: 'filterPreset', controlType: 'preset-select', label: 'Filter Preset', presetOptions: filterPresetOptions },
    { key: 'opacity', controlType: 'mini-slider', label: 'Opacity', min: 0, max: 100, step: 5 },
    { key: 'filterBrightness', controlType: 'mini-slider', label: 'Brightness', min: 0, max: 200, step: 5 },
    { key: 'filterContrast', controlType: 'mini-slider', label: 'Contrast', min: 0, max: 200, step: 5 },
    { key: 'filterSaturate', controlType: 'mini-slider', label: 'Saturation', min: 0, max: 200, step: 5 },
];

/** Quick properties for video elements */
const videoProperties: QuickPropertyDef[] = [
    { key: 'opacity', controlType: 'mini-slider', label: 'Opacity', min: 0, max: 100, step: 5 },
];

const familyConfigs: Record<ElementFamily, QuickPropertyDef[]> = {
    shape: shapeProperties,
    connector: connectorProperties,
    text: textProperties,
    drawing: drawingProperties,
    image: imageProperties,
    video: videoProperties,
};

/** Get the quick property definitions for a given element type */
export function getQuickPropertiesForType(type: ElementType): QuickPropertyDef[] {
    const family = getElementFamily(type);
    if (!family) return [];
    let props = familyConfigs[family];
    if (type === 'table') {
        props = props.filter(p => p.key !== 'backgroundColor');
    }
    // Filter by applicableTo if set on the property definition
    return props.filter(p => !p.applicableTo || p.applicableTo.includes(type));
}
