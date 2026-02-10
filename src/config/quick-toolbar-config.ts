/**
 * Quick Toolbar Configuration
 * Maps element type families to the compact quick-property controls shown in the floating toolbar.
 */

import type { ElementType } from '../types';

/** Broad families that group element types for toolbar purposes */
export type ElementFamily = 'shape' | 'connector' | 'text' | 'drawing' | 'image';

/** Control types that can render in the compact toolbar */
export type QuickControlType = 'color-dot' | 'icon-toggle' | 'icon-select' | 'mini-slider';

export interface QuickPropertyDef {
    key: string;                // DrawingElement property key
    controlType: QuickControlType;
    label: string;              // tooltip text
    // For icon-select
    options?: { value: any; icon: string; label: string }[];
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

const CONNECTOR_TYPES: ElementType[] = ['line', 'arrow', 'bezier', 'organicBranch', 'polyline'];
const DRAWING_TYPES: ElementType[] = ['fineliner', 'inkbrush', 'marker'];
const TOOL_TYPES: (ElementType | 'lasso')[] = ['eraser', 'pan', 'selection', 'laser', 'ink', 'lasso'];

/** Classify an element type into its family */
export function getElementFamily(type: ElementType): ElementFamily | null {
    if (TOOL_TYPES.includes(type)) return null;
    if (CONNECTOR_TYPES.includes(type)) return 'connector';
    if (type === 'text') return 'text';
    if (DRAWING_TYPES.includes(type)) return 'drawing';
    if (type === 'image') return 'image';
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

/** Quick properties for shapes (rectangle, circle, diamond, star, etc.) */
const shapeProperties: QuickPropertyDef[] = [
    { key: 'strokeColor', controlType: 'color-dot', label: 'Stroke Color' },
    { key: 'backgroundColor', controlType: 'color-dot', label: 'Fill Color' },
    {
        key: 'borderRadius', controlType: 'mini-slider', label: 'Roundness',
        min: 0, max: 50, step: 1,
        applicableTo: ['rectangle', 'diamond', 'capsule', 'speechBubble', 'browserWindow',
            'mobilePhone', 'ghostButton', 'inputField', 'dfdProcess', 'isometricCube',
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
        key: 'endArrowhead', controlType: 'icon-select', label: 'Line End Type',
        options: [
            { value: null, icon: 'none', label: 'None' },
            { value: 'arrow', icon: 'arrow', label: 'Arrow' },
            { value: 'triangle', icon: 'triangle', label: 'Triangle' },
            { value: 'diamond', icon: 'diamond', label: 'Diamond' },
        ]
    },
    {
        key: 'curvedText', controlType: 'icon-toggle', label: 'Curved Text',
        applicableTo: ['organicBranch']
    },
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
];

/** Quick properties for freehand drawing tools */
const drawingProperties: QuickPropertyDef[] = [
    { key: 'strokeColor', controlType: 'color-dot', label: 'Stroke Color' },
    { key: 'strokeWidth', controlType: 'mini-slider', label: 'Stroke Width', min: 1, max: 20, step: 1 },
];

/** Quick properties for images */
const imageProperties: QuickPropertyDef[] = [
    { key: 'opacity', controlType: 'mini-slider', label: 'Opacity', min: 0, max: 100, step: 5 },
];

const familyConfigs: Record<ElementFamily, QuickPropertyDef[]> = {
    shape: shapeProperties,
    connector: connectorProperties,
    text: textProperties,
    drawing: drawingProperties,
    image: imageProperties,
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
