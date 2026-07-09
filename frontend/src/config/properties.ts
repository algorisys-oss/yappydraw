import type { ElementType } from "../types";
import { COLOR_PALETTES } from "./color-palettes";
import { PAGE_SIZE_PRESETS } from "./page-size-presets";
import { TEXT_EFFECT_PRESETS } from "./text-effect-presets";

/** Which style variants each font supports (based on Google Fonts availability) */
export const fontCapabilities: Record<string, { bold: boolean; italic: boolean }> = {
    'hand-drawn':  { bold: false, italic: false },  // Handlee — regular only
    'marker':      { bold: false, italic: false },  // Permanent Marker — regular only
    'caveat':      { bold: true,  italic: false },  // Caveat — weights 400-700, no italic
    'sans-serif':  { bold: true,  italic: true },
    'poppins':     { bold: true,  italic: true },
    'serif':       { bold: true,  italic: true },
    'monospace':   { bold: true,  italic: true },
    'code':        { bold: true,  italic: true },
};

export interface PropertyConfig {
    key: string;
    label: string;
    type: 'color' | 'slider' | 'select' | 'toggle' | 'input' | 'number' | 'textarea' | 'image-upload';
    options?: { label: string; value: any; icon?: any; excludeFrom?: (ElementType | 'canvas' | 'slide')[] }[];
    min?: number;
    max?: number;
    step?: number;
    applicableTo: (ElementType | 'canvas' | 'slide')[] | 'all';
    defaultValue?: any;
    group: 'style' | 'stroke' | 'background' | 'text' | 'dimensions' | 'advanced' | 'canvas' | 'shadow' | 'gradient' | 'motion' | 'slide' | 'interaction' | 'filter';
    dependsOn?: string | { key: string; value: any | any[] }; // Key of property that must be truthy for this to show
}

/**
 * Shapes (plus slides) that support a fill style — solid, hachure, gradient, image, etc.
 * Shared by the fillStyle selector and the image-fill controls so they stay in sync.
 */
export const FILLABLE_TARGETS: (ElementType | 'canvas' | 'slide')[] = ['slide', 'line', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'];

/**
 * Shapes where image fill has no visible effect, so the 'Image' fill option and
 * its controls are hidden. These are the 3D shapes that `ShapeRenderer.render`
 * skips in `applyComplexFills` (they paint gradients per-face and have no per-face
 * image path) — keep in sync with the `is3D` list in `shapes/base/shape-renderer.ts`.
 */
export const IMAGE_FILL_EXCLUDED: ElementType[] = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock', 'openBox'];

/** Targets that support an image fill (fillable shapes minus the ones where it has no effect). */
export const IMAGE_FILL_TARGETS: (ElementType | 'canvas' | 'slide')[] =
    FILLABLE_TARGETS.filter(t => !IMAGE_FILL_EXCLUDED.includes(t as ElementType));

/** Closed shapes whose outline can carry curved text (mirrors text-on-path.ts getOutlinePath). */
export const CURVED_TEXT_SHAPES: ElementType[] = [
    'rectangle', 'circle', 'diamond', 'triangle',
    'pentagon', 'hexagon', 'septagon', 'octagon', 'polygon',
    'capsule', 'parallelogram', 'star',
];

/** Every element type that can flow text along its path / outline (Curved Text). */
export const TEXT_PATH_TARGETS: ElementType[] = [
    'organicBranch', 'line', 'arrow', 'fineliner', 'inkbrush', 'marker',
    ...CURVED_TEXT_SHAPES,
];

export const properties: PropertyConfig[] = [
    {
        key: 'theme',
        label: 'Theme',
        type: 'select',
        options: [
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
            { label: 'Focus (Dark Canvas)', value: 'focus' },
            { label: 'System (Follow OS)', value: 'system' }
        ],
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 'light'
    },
    {
        key: 'colorPalette',
        label: 'Color Palette',
        type: 'select',
        options: COLOR_PALETTES.map(p => ({ label: p.name, value: p.id })),
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 'default'
    },
    {
        key: 'showQuickToolbar',
        label: 'Quick Toolbar',
        type: 'toggle',
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: true
    },
    {
        key: 'docType',
        label: 'Document Type',
        type: 'select',
        options: [
            { label: 'Slide Presentation', value: 'slides' },
            { label: 'Design Document', value: 'design' },
            { label: 'Infinite Canvas', value: 'infinite' }
        ],
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 'slides'
    },
    {
        key: 'renderStyle',
        label: 'Default Drawing Style',
        type: 'select',
        options: [
            { label: 'Sketch', value: 'sketch' },
            { label: 'Architectural', value: 'architectural' }
        ],
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 'architectural'
    },
    {
        key: 'renderStyle',
        label: 'Drawing Style',
        type: 'select',
        group: 'style',
        options: [
            { label: 'Sketch', value: 'sketch' },
            { label: 'Architectural', value: 'architectural' }
        ],
        applicableTo: ['rectangle', 'circle', 'line', 'arrow', 'text', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'openBox', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 'architectural'
    },
    {
        key: 'flowAnimation',
        label: 'Flow Animation',
        type: 'toggle',
        group: 'motion',
        applicableTo: 'all',
        defaultValue: false
    },
    {
        key: 'flowSpeed',
        label: 'Flow Speed',
        type: 'slider',
        min: 0.1,
        max: 10,
        step: 0.1,
        group: 'motion',
        applicableTo: 'all',
        defaultValue: 1,
        dependsOn: 'flowAnimation'
    },
    {
        key: 'flowStyle',
        label: 'Flow Style',
        type: 'select',
        options: [
            { label: 'Dots', value: 'dots' },
            { label: 'Dashes', value: 'dashes' },
            { label: 'Energy Pulse', value: 'pulse' }
        ],
        group: 'motion',
        applicableTo: 'all',
        defaultValue: 'dots',
        dependsOn: 'flowAnimation'
    },
    {
        key: 'flowColor',
        label: 'Flow Color',
        type: 'color',
        group: 'motion',
        applicableTo: 'all',
        defaultValue: undefined, // Defaults to stroke color
        dependsOn: 'flowAnimation'
    },
    {
        key: 'flowDensity',
        label: 'Flow Density',
        type: 'slider',
        min: 1,
        max: 10,
        step: 1,
        group: 'motion',
        applicableTo: 'all',
        defaultValue: 3,
        dependsOn: 'flowAnimation'
    },
    {
        key: 'flowReverse',
        label: 'Reverse',
        type: 'toggle',
        group: 'motion',
        applicableTo: 'all',
        defaultValue: false,
        dependsOn: 'flowAnimation'
    },

    // Canvas Properties
    {
        key: 'canvasBackgroundColor',
        label: 'Background',
        type: 'color',
        options: [
            { label: 'White', value: '#ffffff' },
            { label: 'Light Gray', value: '#fafafa' },
            { label: 'Paper', value: '#fdf6e3' },
            { label: 'Dark Gray', value: '#121212' },
            { label: 'Deep Black', value: '#000000' }
        ],
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: '#fafafa'
    },
    // NOTE: `canvasTexture` is intentionally NOT a config-driven property — it's
    // rendered as a "Fine-tune" row directly under the CANVAS THEME picker in
    // property-panel.tsx (the theme sets background + texture together; this is the
    // granular override). Kept out of the generic canvas group to avoid duplication.
    {
        key: 'maxLayers',
        label: 'Max Layers',
        type: 'number',
        min: 1,
        max: 100,
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 20
    },
    {
        key: 'gridEnabled',
        label: 'Show Grid',
        type: 'toggle',
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: false
    },
    {
        key: 'snapToGrid',
        label: 'Snap to Grid',
        type: 'toggle',
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: false
    },
    {
        key: 'objectSnapping',
        label: 'Smart Snapping',
        type: 'toggle',
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: true
    },
    {
        key: 'gridStyle',
        label: 'Grid Style',
        type: 'select',
        options: [
            { label: 'Lines', value: 'lines' },
            { label: 'Dots', value: 'dots' }
        ],
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 'lines'
    },
    {
        key: 'gridColor',
        label: 'Grid Color',
        type: 'color',
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: '#e0e0e0'
    },
    {
        key: 'gridOpacity',
        label: 'Grid Opacity',
        type: 'slider',
        min: 0.1,
        max: 1,
        step: 0.1,
        group: 'canvas',
        applicableTo: ['canvas'],
        defaultValue: 0.5
    },

    // Slide Transition Properties
    {
        key: 'transitionType',
        label: 'Transition',
        type: 'select',
        options: [
            { label: 'None', value: 'none' },
            { label: 'Fade', value: 'fade' },
            { label: 'Slide Left', value: 'slide-left' },
            { label: 'Slide Right', value: 'slide-right' },
            { label: 'Slide Up', value: 'slide-up' },
            { label: 'Slide Down', value: 'slide-down' },
            { label: 'Zoom In', value: 'zoom-in' },
            { label: 'Zoom Out', value: 'zoom-out' }
        ],
        group: 'slide',
        applicableTo: ['slide'],
        defaultValue: 'none'
    },
    {
        key: 'transitionDuration',
        label: 'Duration (ms)',
        type: 'slider',
        min: 100,
        max: 3000,
        step: 100,
        group: 'slide',
        applicableTo: ['slide'],
        defaultValue: 500
    },
    {
        key: 'transitionEasing',
        label: 'Easing',
        type: 'select',
        options: [
            { label: 'Linear', value: 'linear' },
            { label: 'Quad In', value: 'easeInQuad' },
            { label: 'Quad Out', value: 'easeOutQuad' },
            { label: 'Quad InOut', value: 'easeInOutQuad' },
            { label: 'Cubic In', value: 'easeInCubic' },
            { label: 'Cubic Out', value: 'easeOutCubic' },
            { label: 'Cubic InOut', value: 'easeInOutCubic' },
            { label: 'Back Out', value: 'easeOutBack' },
            { label: 'Spring', value: 'easeSpring' }
        ],
        group: 'slide',
        applicableTo: ['slide'],
        defaultValue: 'easeInOutQuad'
    },
    // Text effect presets (Canva-style one-click looks)
    {
        key: 'textEffect',
        label: 'Text Effect',
        type: 'select',
        options: TEXT_EFFECT_PRESETS.map(p => ({ label: p.name, value: p.id })),
        group: 'text',
        applicableTo: ['text'],
        defaultValue: 'none'
    },
    // Page size (design documents only — filtered in property-panel)
    {
        key: 'pageSizePreset',
        label: 'Page Size',
        type: 'select',
        options: [
            { label: 'Custom', value: 'custom' },
            ...PAGE_SIZE_PRESETS.map(p => ({ label: `${p.name} (${p.width}×${p.height})`, value: p.id }))
        ],
        group: 'slide',
        applicableTo: ['slide'],
        defaultValue: 'custom'
    },
    {
        key: 'pageWidth',
        label: 'Page Width',
        type: 'number',
        min: 16,
        max: 20000,
        step: 1,
        group: 'slide',
        applicableTo: ['slide'],
        defaultValue: 1080
    },
    {
        key: 'pageHeight',
        label: 'Page Height',
        type: 'number',
        min: 16,
        max: 20000,
        step: 1,
        group: 'slide',
        applicableTo: ['slide'],
        defaultValue: 1080
    },

    // Style

    {
        key: 'borderRadius',
        label: 'Roundness',
        type: 'slider',
        min: 0,
        max: 50,
        step: 1,
        group: 'style',
        applicableTo: ['rectangle', 'diamond', 'capsule', 'speechBubble', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'card', 'searchBar', 'badge', 'tooltip', 'dfdProcess', 'isometricCube', 'cylinder', 'stateSync', 'activationBar', 'externalEntity', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: 9
    },
    {
        key: 'drawInnerBorder',
        label: 'Double Border',
        type: 'toggle',
        group: 'style',
        applicableTo: ['rectangle', 'circle', 'diamond', 'triangle', 'polygon', 'star', 'hexagon', 'octagon', 'pentagon', 'septagon', 'trapezoid', 'dfdProcess', 'isometricCube', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: false
    },
    {
        key: 'innerBorderDistance',
        label: 'Border Padding',
        type: 'slider',
        min: 2,
        max: 20,
        step: 1,
        group: 'style',
        applicableTo: ['rectangle', 'circle', 'diamond', 'triangle', 'polygon', 'star', 'hexagon', 'octagon', 'pentagon', 'septagon', 'trapezoid', 'dfdProcess', 'isometricCube', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: 5,
        dependsOn: 'drawInnerBorder'
    },
    {
        key: 'strokeLineJoin',
        label: 'Corner Style',
        type: 'select',
        options: [
            { label: 'Round', value: 'round' },
            { label: 'Bevel (Flat)', value: 'bevel' },
            { label: 'Miter (Sharp)', value: 'miter' }
        ],
        group: 'style',
        applicableTo: ['rectangle', 'diamond', 'triangle', 'polygon', 'star', 'burst', 'hexagon', 'octagon', 'pentagon', 'septagon', 'trapezoid', 'arrow', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'bracketLeft', 'bracketRight', 'parallelogram', 'rightTriangle', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'cylinder', 'stateSync', 'activationBar', 'externalEntity'],
        defaultValue: 'round'
    },
    // Stroke
    {
        key: 'strokeColor',
        label: 'Stroke',
        type: 'color',
        group: 'stroke',
        applicableTo: 'all',
        defaultValue: '#000000'
    },
    {
        key: 'backgroundColor',
        label: 'Background',
        type: 'color',
        group: 'background',
        applicableTo: ['slide', 'line', 'rectangle', 'circle', 'text', 'richtext', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 'transparent'
    },
    {
        key: 'lidColor',
        label: 'Lid Fill',
        type: 'color',
        group: 'background',
        applicableTo: ['openBox'],
        defaultValue: undefined // defaults to backgroundColor if not set
    },
    {
        key: 'lidStrokeColor',
        label: 'Lid Stroke',
        type: 'color',
        group: 'background',
        applicableTo: ['openBox'],
        defaultValue: undefined // defaults to strokeColor if not set
    },
    {
        key: 'fillStyle',
        label: 'Fill',
        type: 'select',
        group: 'background',
        options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Hachure', value: 'hachure', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Cross-Hatch', value: 'cross-hatch', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Zigzag', value: 'zigzag', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Dots', value: 'dots', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Dashed', value: 'dashed', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Zigzag Line', value: 'zigzag-line', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Linear Gradient', value: 'linear' },
            { label: 'Radial Gradient', value: 'radial' },
            { label: 'Conic Gradient', value: 'conic' },
            { label: 'Gradient Mesh', value: 'mesh' },
            { label: 'Pattern', value: 'pattern', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'] },
            { label: 'Image', value: 'image', excludeFrom: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable', ...IMAGE_FILL_EXCLUDED] }
        ],
        applicableTo: FILLABLE_TARGETS,
        defaultValue: 'solid'
    },
    {
        key: 'fillDensity',
        label: 'Fill Density',
        type: 'slider',
        min: 0.1,
        max: 4,
        step: 0.1,
        group: 'background',
        applicableTo: ['line', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 1,
        dependsOn: { key: 'fillStyle', value: ['hachure', 'cross-hatch', 'zigzag', 'dots', 'dashed', 'zigzag-line'] }
    },
    {
        key: 'backgroundImage',
        label: 'Fill Image',
        type: 'image-upload',
        group: 'background',
        applicableTo: IMAGE_FILL_TARGETS,
        defaultValue: '',
        dependsOn: { key: 'fillStyle', value: 'image' }
    },
    {
        key: 'backgroundImageFit',
        label: 'Image Fit',
        type: 'select',
        group: 'background',
        options: [
            { label: 'Cover', value: 'cover' },
            { label: 'Contain', value: 'contain' },
            { label: 'Stretch', value: 'fill' },
            { label: 'Tile', value: 'tile' }
        ],
        applicableTo: IMAGE_FILL_TARGETS.filter(t => t !== 'slide'),
        defaultValue: 'cover',
        dependsOn: { key: 'fillStyle', value: 'image' }
    },
    {
        key: 'backgroundOpacity',
        label: 'Image Opacity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.1,
        group: 'background',
        applicableTo: IMAGE_FILL_TARGETS,
        defaultValue: 1,
        dependsOn: { key: 'fillStyle', value: 'image' }
    },
    {
        key: 'strokeWidth',
        label: 'Width',
        type: 'slider',
        min: 1,
        max: 20,
        step: 1,
        group: 'stroke',
        applicableTo: ['rectangle', 'circle', 'line', 'arrow', 'fineliner', 'inkbrush', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 1
    },
    {
        key: 'smoothing',
        label: 'Smoothing',
        type: 'slider',
        min: 0,
        max: 20,
        step: 1,
        group: 'stroke',
        applicableTo: ['fineliner', 'inkbrush', 'marker'],
        defaultValue: 3
    },
    {
        // Stroke stabilization (pulled-string "lazy brush"). Global setting,
        // not per-element — read/written via globalSettings in the panel
        // (special-cased like eraserWidth). Shown as a 0–100% slider.
        key: 'penStabilization',
        label: 'Stabilization',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        group: 'stroke',
        applicableTo: ['fineliner', 'inkbrush', 'marker'],
        defaultValue: 0
    },
    {
        // Eraser brush width — shown only when the eraser tool is active.
        // Defaults to the current stroke width (resolved in the panel/handler).
        key: 'eraserWidth',
        label: 'Eraser Width',
        type: 'slider',
        min: 2,
        max: 100,
        step: 1,
        group: 'stroke',
        applicableTo: ['eraser'],
        defaultValue: 10
    },
    {
        key: 'taperAmount',
        label: 'Tapering',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        group: 'stroke',
        applicableTo: ['inkbrush'],
        defaultValue: 0.15
    },
    {
        key: 'velocitySensitivity',
        label: 'Speed Sensitivity',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        group: 'stroke',
        applicableTo: ['inkbrush'],
        defaultValue: 0.5
    },
    {
        key: 'strokeStyle',
        label: 'Stroke Style',
        type: 'select',
        group: 'stroke',
        options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' }
        ],
        applicableTo: ['rectangle', 'circle', 'line', 'arrow', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'], // Exclude text
        defaultValue: 'solid'
    },
    {
        key: 'roughness',
        label: 'Sloppiness',
        type: 'slider',
        min: 0,
        max: 3,
        step: 0.1,
        group: 'style',
        applicableTo: ['rectangle', 'circle', 'line', 'arrow', 'text', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 1
    },
    {
        key: 'opacity',
        label: 'Opacity',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        group: 'style',
        applicableTo: 'all',
        defaultValue: 100
    },
    // Gradient Properties
    {
        key: 'gradientPreset',
        label: 'Preset',
        type: 'select',
        group: 'gradient',
        options: [
            { label: '— Custom —', value: 'custom' },
            // Warm
            { label: '🔥 Sunset', value: 'sunset' },
            { label: '🔥 Warm Flame', value: 'warmFlame' },
            { label: '🔥 Juicy Peach', value: 'juicyPeach' },
            { label: '🔥 Sunrise Glow', value: 'sunriseGlow' },
            { label: '🔥 Coral Reef', value: 'coralReef' },
            // Cool
            { label: '❄️ Ocean Blue', value: 'oceanBlue' },
            { label: '❄️ Cool Sky', value: 'coolSky' },
            { label: '❄️ Deep Purple', value: 'deepPurple' },
            { label: '❄️ Night Owl', value: 'nightOwl' },
            { label: '❄️ Midnight City', value: 'midnightCity' },
            // Nature
            { label: '🌿 Fresh Grass', value: 'freshGrass' },
            { label: '🌿 Spring Meadow', value: 'springMeadow' },
            { label: '🌿 Forest Dawn', value: 'forestDawn' },
            { label: '🌿 Earth Tone', value: 'earthTone' },
            { label: '🌿 Autumn', value: 'autumn' },
            // Metallic
            { label: '✨ Silver', value: 'silver' },
            { label: '✨ Gold', value: 'gold' },
            { label: '✨ Bronze', value: 'bronze' },
            { label: '✨ Rose Gold', value: 'roseGold' },
            { label: '✨ Chrome', value: 'chrome' },
            // Pastel
            { label: '🎀 Soft Pink', value: 'softPink' },
            { label: '🎀 Lavender Dream', value: 'lavenderDream' },
            { label: '🎀 Mint Fresh', value: 'mintFresh' },
            { label: '🎀 Peachy Pink', value: 'peachyPink' },
            { label: '🎀 Cotton Candy', value: 'cottonCandy' },
            // Vibrant
            { label: '💥 Neon Glow', value: 'neonGlow' },
            { label: '💥 Electric Violet', value: 'electricViolet' },
            { label: '💥 Sunset Vibes', value: 'sunsetVibes' },
            { label: '💥 Rainbow', value: 'rainbow' },
            { label: '💥 Hot Magenta', value: 'hotMagenta' },
            // Dark
            { label: '🌙 Dark Ocean', value: 'darkOcean' },
            { label: '🌙 Midnight Blue', value: 'midnightBlue' },
            { label: '🌙 Dark Forest', value: 'darkForest' },
            { label: '🌙 Charcoal', value: 'charcoal' },
            { label: '🌙 Obsidian', value: 'obsidian' },
            // Light
            { label: '☁️ Snow White', value: 'snowWhite' },
            { label: '☁️ Cloudy Sky', value: 'cloudySky' },
            { label: '☁️ Soft Gray', value: 'softGray' },
            { label: '☁️ Pearl', value: 'pearl' },
            { label: '☁️ Morning', value: 'morning' }
        ],
        applicableTo: 'all',
        defaultValue: 'custom',
        dependsOn: { key: 'fillStyle', value: ['linear', 'radial', 'conic'] }
    },
    {
        key: 'gradientDirection',
        label: 'Direction (Deg)',
        type: 'slider',
        min: 0,
        max: 360,
        step: 15,
        group: 'gradient',
        applicableTo: ['slide', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 45,
        dependsOn: { key: 'fillStyle', value: ['linear', 'radial', 'conic'] }
    },
    // Blend Mode
    {
        key: 'blendMode',
        label: 'Blend Mode',
        type: 'select',
        options: [
            { label: 'Normal', value: 'normal' },
            { label: 'Multiply', value: 'multiply' },
            { label: 'Screen', value: 'screen' },
            { label: 'Overlay', value: 'overlay' },
            { label: 'Darken', value: 'darken' },
            { label: 'Lighten', value: 'lighten' },
            { label: 'Color Dodge', value: 'color-dodge' },
            { label: 'Color Burn', value: 'color-burn' },
            { label: 'Hard Light', value: 'hard-light' },
            { label: 'Soft Light', value: 'soft-light' },
            { label: 'Difference', value: 'difference' },
            { label: 'Exclusion', value: 'exclusion' },
            { label: 'Hue', value: 'hue' },
            { label: 'Saturation', value: 'saturation' },
            { label: 'Color', value: 'color' },
            { label: 'Luminosity', value: 'luminosity' }
        ],
        group: 'style',
        applicableTo: 'all',
        defaultValue: 'normal'
    },
    // We need 2 color pickers.
    // Since my generic property panel binds directly to keys, I need these keys on the object.
    {
        key: 'gradientStart',
        label: 'Start Color',
        type: 'color',
        group: 'gradient',
        applicableTo: 'all',
        defaultValue: '#ffffff',
        dependsOn: { key: 'fillStyle', value: ['linear', 'radial'] }
    },
    {
        key: 'gradientEnd',
        label: 'End Color',
        type: 'color',
        group: 'gradient',
        applicableTo: 'all',
        defaultValue: '#000000',
        dependsOn: { key: 'fillStyle', value: ['linear', 'radial'] }
    },
    // OpenBox interaction/animation properties
    {
        key: 'enableClickToOpen',
        label: 'Click to Open',
        type: 'toggle',
        group: 'interaction',
        applicableTo: ['openBox'],
        defaultValue: false
    },
    {
        key: 'revealElementId',
        label: 'Reveal Element',
        type: 'input',
        group: 'interaction',
        applicableTo: ['openBox'],
        defaultValue: '',
        dependsOn: 'enableClickToOpen'
    },
    {
        key: 'openAnimationDuration',
        label: 'Duration (ms)',
        type: 'number',
        group: 'interaction',
        applicableTo: ['openBox'],
        defaultValue: 600,
        min: 100,
        max: 3000,
        dependsOn: 'enableClickToOpen'
    },
    {
        key: 'revealAnimationType',
        label: 'Reveal Style',
        type: 'select',
        group: 'interaction',
        applicableTo: ['openBox'],
        options: [
            { label: 'Fade In', value: 'fadeIn' },
            { label: 'Slide Up', value: 'slideUp' },
            { label: 'Scale Up', value: 'scaleUp' },
            { label: 'Pop', value: 'pop' }
        ],
        defaultValue: 'fadeIn',
        dependsOn: 'enableClickToOpen'
    },
    {
        key: 'restoreAfterReveal',
        label: 'Restore After',
        type: 'toggle',
        group: 'interaction',
        applicableTo: ['openBox'],
        defaultValue: false,
        dependsOn: 'enableClickToOpen'
    },
    {
        key: 'shadowEnabled',
        label: 'Drop Shadow',
        type: 'toggle',
        group: 'shadow',
        applicableTo: 'all', // Apply to all shapes
        defaultValue: false
    },
    {
        key: 'shadowColor',
        label: 'Shadow Color',
        type: 'color',
        group: 'shadow',
        applicableTo: 'all',
        defaultValue: 'rgba(0,0,0,0.3)',
        dependsOn: 'shadowEnabled'
    },
    {
        key: 'shadowBlur',
        label: 'Blur',
        type: 'slider',
        min: 0,
        max: 50,
        step: 1,
        group: 'shadow',
        applicableTo: 'all',
        defaultValue: 10,
        dependsOn: 'shadowEnabled'
    },
    {
        key: 'shadowOffsetX',
        label: 'Offset X',
        type: 'slider',
        min: -50,
        max: 50,
        step: 1,
        group: 'shadow',
        applicableTo: 'all',
        defaultValue: 5,
        dependsOn: 'shadowEnabled'
    },
    {
        key: 'shadowOffsetY',
        label: 'Offset Y',
        type: 'slider',
        min: -50,
        max: 50,
        step: 1,
        group: 'shadow',
        applicableTo: 'all',
        defaultValue: 5,
        dependsOn: 'shadowEnabled'
    },

    // Image Filter Properties
    {
        key: 'filterPreset',
        label: 'Filter Preset',
        type: 'select',
        options: [
            { label: 'None', value: 'none' },
            { label: 'Grayscale', value: 'grayscale' },
            { label: 'Warm', value: 'warm' },
            { label: 'Sunny', value: 'sunny' },
            { label: 'Golden', value: 'golden' },
            { label: 'Cool', value: 'cool' },
            { label: 'Arctic', value: 'arctic' },
            { label: 'Sepia', value: 'sepia' },
            { label: 'Vintage', value: 'vintage' },
            { label: 'Retro', value: 'retro' },
            { label: 'Faded', value: 'faded' },
            { label: 'High Contrast', value: 'highContrast' },
            { label: 'Dramatic', value: 'dramatic' },
            { label: 'Noir', value: 'noir' },
            { label: 'Invert', value: 'invert' },
            { label: 'Custom', value: 'custom' },
        ],
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 'none'
    },
    {
        key: 'filterBrightness',
        label: 'Brightness',
        type: 'slider',
        min: 0, max: 200, step: 5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 100
    },
    {
        key: 'filterContrast',
        label: 'Contrast',
        type: 'slider',
        min: 0, max: 200, step: 5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 100
    },
    {
        key: 'filterSaturate',
        label: 'Saturation',
        type: 'slider',
        min: 0, max: 200, step: 5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 100
    },
    {
        key: 'filterSepia',
        label: 'Sepia',
        type: 'slider',
        min: 0, max: 100, step: 5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 0
    },
    {
        key: 'filterHueRotate',
        label: 'Hue Rotate',
        type: 'slider',
        min: 0, max: 360, step: 5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 0
    },
    {
        key: 'filterBlur',
        label: 'Blur',
        type: 'slider',
        min: 0, max: 20, step: 0.5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 0
    },
    {
        key: 'filterInvert',
        label: 'Invert',
        type: 'slider',
        min: 0, max: 100, step: 5,
        group: 'filter',
        applicableTo: ['image'],
        defaultValue: 0
    },

    // Note: Pixel effects are integrated into the Animation system
    // Quick preview buttons appear when an image is selected
    // Use Animation Panel to add persistent pixel effects with triggers (on-load, on-click, etc.)

    // Video Properties
    {
        key: 'videoURL',
        label: 'Video URL',
        type: 'input',
        group: 'interaction',
        applicableTo: ['video'],
        defaultValue: ''
    },
    {
        key: 'videoAutoplay',
        label: 'Autoplay (Presentation)',
        type: 'toggle',
        group: 'interaction',
        applicableTo: ['video'],
        defaultValue: false
    },
    {
        key: 'videoLoop',
        label: 'Loop',
        type: 'toggle',
        group: 'interaction',
        applicableTo: ['video'],
        defaultValue: false
    },
    {
        key: 'videoMuted',
        label: 'Muted',
        type: 'toggle',
        group: 'interaction',
        applicableTo: ['video'],
        defaultValue: true
    },
    {
        key: 'videoLocked',
        label: 'Lock Position',
        type: 'toggle',
        group: 'interaction',
        applicableTo: ['video'],
        defaultValue: false
    },

    // Text Specific
    {
        key: 'fontSize',
        label: 'Size',
        type: 'slider',
        min: 8,
        max: 200,
        step: 1,
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'line', 'arrow', 'organicBranch', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 28
    },
    {
        key: 'letterSpacing',
        label: 'Letter Spacing',
        type: 'number',
        min: -5,
        max: 40,
        step: 0.5,
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'line', 'arrow', 'organicBranch', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 0
    },
    {
        key: 'fontFamily',
        label: 'Font',
        type: 'select',
        options: [
            { label: 'Virgil (Hand)', value: 'hand-drawn' },
            { label: 'Caveat (Hand)', value: 'caveat' },
            { label: 'Marker', value: 'marker' },
            { label: 'Inter (Sans)', value: 'sans-serif' },
            { label: 'Poppins (Sans)', value: 'poppins' },
            { label: 'Merriweather (Serif)', value: 'serif' },
            { label: 'Source Code Pro', value: 'monospace' },
            { label: 'JetBrains Mono', value: 'code' }
        ],
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'line', 'arrow', 'organicBranch', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 'hand-drawn'
    },
    {
        key: 'fontWeight',
        label: 'Bold',
        type: 'toggle',
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'line', 'arrow', 'organicBranch', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: false
    },
    {
        key: 'fontStyle',
        label: 'Italic',
        type: 'toggle',
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'line', 'arrow', 'organicBranch', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: false
    },
    {
        key: 'textAlign',
        label: 'Align',
        type: 'select',
        options: [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' }
        ],
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'line', 'arrow', 'organicBranch', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 'center'
    },
    {
        key: 'verticalAlign',
        label: 'Vertical Align',
        type: 'select',
        options: [
            { label: 'Top', value: 'top' },
            { label: 'Middle', value: 'middle' },
            { label: 'Bottom', value: 'bottom' }
        ],
        group: 'text',
        applicableTo: ['text', 'richtext', 'rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: 'middle'
    },
    {
        key: 'arrowAnchorAlign',
        label: 'Arrow Align',
        type: 'select',
        options: [
            { label: 'Top', value: 'top' },
            { label: 'Middle', value: 'middle' },
            { label: 'Bottom', value: 'bottom' }
        ],
        group: 'dimensions',
        applicableTo: ['rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool'],
        defaultValue: 'middle'
    },
    {
        key: 'text',
        label: 'Content',
        type: 'textarea',
        group: 'text',
        applicableTo: ['text', 'richtext', 'codeBlock', 'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'],
        defaultValue: ''
    },
    {
        key: 'containerText',
        label: 'Label',
        type: 'textarea',
        group: 'text',
        applicableTo: ['rectangle', 'circle', 'diamond', 'line', 'arrow', 'organicBranch', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'polygon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'openBox', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'codeBlock', 'dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool', 'path'],
        defaultValue: ''
    },
    {
        key: 'attributesText',
        label: 'Attributes',
        type: 'textarea',
        group: 'text',
        applicableTo: ['umlClass', 'umlEnum', 'umlState', 'umlFragment'],
        defaultValue: ''
    },
    {
        key: 'methodsText',
        label: 'Methods',
        type: 'textarea',
        group: 'text',
        applicableTo: ['umlClass', 'umlInterface'], // interfaces might have methods too
        defaultValue: ''
    },
    {
        key: 'labelPosition',
        label: 'Label Position',
        type: 'select',
        options: [
            { label: 'Start', value: 'start' },
            { label: 'Middle', value: 'middle' },
            { label: 'End', value: 'end' }
        ],
        group: 'text',
        applicableTo: ['line', 'arrow', 'organicBranch'],
        defaultValue: 'middle'
    },
    {
        key: 'autoResize',
        label: 'Auto Resize',
        type: 'toggle',
        group: 'text',
        applicableTo: ['rectangle', 'circle', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'polygon', 'star', 'cloud', 'heart', 'cross', 'checkmark', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'starPerson', 'lightbulb', 'signpost', 'burstBlob', 'scroll', 'wavyDivider', 'doubleBanner', 'trophy', 'clock', 'gear', 'target', 'rocket', 'flag', 'key', 'magnifyingGlass', 'book', 'megaphone', 'eye', 'thoughtBubble', 'stickFigure', 'sittingPerson', 'presentingPerson', 'handPointRight', 'thumbsUp', 'faceHappy', 'faceSad', 'faceConfused', 'browserWindow', 'mobilePhone', 'ghostButton', 'inputField', 'solidButton', 'dropdown', 'uiCheckbox', 'radioButton', 'toggleSwitch', 'card', 'searchBar', 'progressBar', 'avatar', 'navbar', 'tabBar', 'badge', 'tooltip', 'slider', 'checkbox', 'checkboxChecked', 'numberedBadge', 'questionMark', 'exclamationMark', 'tag', 'pin', 'stamp', 'kubernetes', 'container', 'apiGateway', 'cdn', 'storageBlob', 'eventBus', 'microservice', 'shield', 'barChart', 'pieChart', 'trendUp', 'trendDown', 'funnel', 'gauge', 'table', 'puzzlePiece', 'chainLink', 'bridge', 'magnet', 'scale', 'seedling', 'tree', 'mountain', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'perspectiveBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity', 'umlClass', 'umlInterface', 'umlActor', 'umlUseCase', 'umlNote', 'umlPackage', 'umlComponent', 'umlObject', 'umlPort', 'umlHistory', 'umlAction', 'umlNode', 'umlArtifact', 'umlState', 'umlLifeline', 'umlFragment', 'umlSignalSend', 'umlSignalReceive', 'umlProvidedInterface', 'umlRequiredInterface', 'bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity', 'bpmnDataObject', 'bpmnDataStore', 'bpmnAnnotation', 'bpmnGroup', 'bpmnPool'],
        defaultValue: true
    },
    {
        key: 'textColor',
        label: 'Text Color',
        type: 'color',
        group: 'text',
        applicableTo: 'all',
        defaultValue: undefined // defaults to stroke color in renderer
    },
    {
        key: 'textHighlightEnabled',
        label: 'Text Highlight',
        type: 'toggle',
        group: 'text',
        applicableTo: 'all',
        defaultValue: false
    },
    {
        key: 'textHighlightColor',
        label: 'Highlight Color',
        type: 'color',
        group: 'text',
        applicableTo: 'all',
        defaultValue: 'rgba(255, 255, 0, 0.4)',
        dependsOn: 'textHighlightEnabled'
    },
    {
        key: 'textHighlightPadding',
        label: 'Highlight Padding',
        type: 'slider',
        min: 0,
        max: 20,
        step: 1,
        group: 'text',
        applicableTo: 'all',
        defaultValue: 4,
        dependsOn: 'textHighlightEnabled'
    },
    {
        key: 'textHighlightRadius',
        label: 'Highlight Radius',
        type: 'slider',
        min: 0,
        max: 20,
        step: 1,
        group: 'text',
        applicableTo: 'all',
        defaultValue: 2,
        dependsOn: 'textHighlightEnabled'
    },
    {
        key: 'curvedText',
        label: 'Text on Path',
        type: 'toggle',
        group: 'text',
        applicableTo: TEXT_PATH_TARGETS,
        defaultValue: false,
    },
    {
        key: 'textPathSide',
        label: 'Text Position',
        type: 'select',
        options: [
            { label: 'On the line', value: 'on' },
            { label: 'Outside', value: 'outside' },
        ],
        group: 'text',
        applicableTo: TEXT_PATH_TARGETS,
        defaultValue: 'on',
        dependsOn: { key: 'curvedText', value: true },
    },
    {
        key: 'textPathOffset',
        label: 'Start Position',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.01,
        group: 'text',
        applicableTo: TEXT_PATH_TARGETS, // slide the text along the path / around the loop
        defaultValue: 0,
        dependsOn: { key: 'curvedText', value: true },
    },
    {
        key: 'textPathSpacing',
        label: 'Letter Spacing',
        type: 'slider',
        min: -5,
        max: 40,
        step: 1,
        group: 'text',
        applicableTo: TEXT_PATH_TARGETS,
        defaultValue: 0,
        dependsOn: { key: 'curvedText', value: true },
    },

    // Linear
    {
        key: 'startArrowhead',
        label: 'Line Start Type',
        type: 'select',
        options: [
            { label: 'None', value: null },
            { label: 'Arrow', value: 'arrow' },
            { label: 'Triangle (Inheritance)', value: 'triangle' },
            { label: 'Diamond (Aggregation)', value: 'diamond' },
            { label: 'Filled Diamond (Composition)', value: 'diamondFilled' },
            { label: 'Crow\'s Foot (ER)', value: 'crowsfoot' },
            { label: 'Circle', value: 'circle' },
            { label: 'Dot', value: 'dot' },
            { label: 'Bar', value: 'bar' }
        ],
        group: 'style',
        applicableTo: ['arrow', 'line', 'organicBranch', 'bezier'],
        defaultValue: null
    },
    {
        key: 'startArrowheadSize',
        label: 'Start Size',
        type: 'number',
        min: 1,
        max: 100,
        group: 'style',
        applicableTo: ['arrow', 'line', 'organicBranch', 'bezier'],
        defaultValue: 28,
        dependsOn: { key: 'startArrowhead', value: ['arrow', 'triangle', 'diamond', 'diamondFilled', 'crowsfoot', 'circle', 'dot', 'bar'] }
    },
    {
        key: 'endArrowhead',
        label: 'Line End Type',
        type: 'select',
        options: [
            { label: 'None', value: null },
            { label: 'Arrow', value: 'arrow' },
            { label: 'Triangle (Inheritance)', value: 'triangle' },
            { label: 'Diamond (Aggregation)', value: 'diamond' },
            { label: 'Filled Diamond (Composition)', value: 'diamondFilled' },
            { label: 'Crow\'s Foot (ER)', value: 'crowsfoot' },
            { label: 'Circle', value: 'circle' },
            { label: 'Dot', value: 'dot' },
            { label: 'Bar', value: 'bar' }
        ],
        group: 'style',
        applicableTo: ['arrow', 'line', 'organicBranch', 'bezier'],
        defaultValue: null
    },
    {
        key: 'endArrowheadSize',
        label: 'End Size',
        type: 'number',
        min: 1,
        max: 100,
        group: 'style',
        applicableTo: ['arrow', 'line', 'organicBranch', 'bezier'],
        defaultValue: 28,
        dependsOn: { key: 'endArrowhead', value: ['arrow', 'triangle', 'diamond', 'diamondFilled', 'crowsfoot', 'circle', 'dot', 'bar'] }
    },
    {
        key: 'curveType',
        label: 'Line Type',
        type: 'select',
        options: [
            { label: 'Straight', value: 'straight' },
            { label: 'Curved', value: 'bezier' },
            { label: 'Smart (Elbow)', value: 'elbow' }
        ],
        group: 'style',
        applicableTo: ['arrow', 'line'],
        defaultValue: 'straight'
    },

    // Numeric Transform (position & size). Routed through setElementTransform in the
    // panel so W/H scale relative geometry (pen points, path anchors) like a handle drag.
    {
        key: 'x',
        label: 'X',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },
    {
        key: 'y',
        label: 'Y',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },
    {
        key: 'width',
        label: 'W',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },
    {
        key: 'height',
        label: 'H',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },

    // Advanced / Common
    {
        key: 'angle',
        label: 'Angle',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },
    {
        key: 'shearX',
        label: 'Shear X',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },
    {
        key: 'shearY',
        label: 'Shear Y',
        type: 'number',
        group: 'dimensions',
        applicableTo: 'all',
        defaultValue: 0
    },
    {
        key: 'locked',
        label: 'Locked',
        type: 'toggle',
        group: 'advanced',
        applicableTo: ['rectangle', 'circle', 'line', 'arrow', 'text', 'image', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'bracketLeft', 'bracketRight', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'solidBlock', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity'],
        defaultValue: false
    },

    {
        key: 'link',
        label: 'Link',
        type: 'input',
        group: 'advanced',
        applicableTo: 'all',
        defaultValue: null
    },
    {
        key: 'tag',
        label: 'Tag',
        type: 'input',
        group: 'advanced',
        applicableTo: 'all',
        defaultValue: null
    },
    {
        key: 'constrained',
        label: 'Keep Proportions',
        type: 'toggle',
        group: 'dimensions',
        applicableTo: ['rectangle', 'circle', 'image', 'diamond', 'triangle', 'hexagon', 'octagon', 'parallelogram', 'star', 'cloud', 'heart', 'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown', 'capsule', 'stickyNote', 'callout', 'burst', 'speechBubble', 'ribbon', 'database', 'document', 'predefinedProcess', 'internalStorage', 'server', 'loadBalancer', 'firewall', 'user', 'messageQueue', 'lambda', 'router', 'browser', 'trapezoid', 'rightTriangle', 'pentagon', 'septagon', 'dfdProcess', 'dfdDataStore', 'isometricCube', 'cylinder', 'stateStart', 'stateEnd', 'stateSync', 'activationBar', 'externalEntity'],
        defaultValue: false
    },
    {
        key: 'pressureEnabled',
        label: 'Pressure',
        type: 'toggle',
        group: 'advanced',
        applicableTo: ['fineliner', 'inkbrush'],
        defaultValue: true
    },
    {
        key: 'starPoints',
        label: 'Star Points',
        type: 'slider',
        min: 3,
        max: 12,
        step: 1,
        group: 'dimensions',
        applicableTo: ['star'],
        defaultValue: 5
    },
    {
        key: 'polygonSides',
        label: 'Polygon Sides',
        type: 'slider',
        min: 3,
        max: 20,
        step: 1,
        group: 'dimensions',
        applicableTo: ['polygon'],
        defaultValue: 6
    },
    {
        key: 'burstPoints',
        label: 'Burst Rays',
        type: 'slider',
        min: 8,
        max: 32,
        step: 1,
        group: 'dimensions',
        applicableTo: ['burst'],
        defaultValue: 16
    },
    {
        key: 'tailPosition',
        label: 'Tip Position',
        type: 'slider',
        min: 10,
        max: 90,
        step: 5,
        group: 'dimensions',
        applicableTo: ['speechBubble'],
        defaultValue: 20
    },
    {
        key: 'shapeRatio',
        label: 'Depth/Ratio',
        type: 'slider',
        min: 10,
        max: 90,
        step: 1,
        group: 'dimensions',
        applicableTo: ['star', 'burst', 'speechBubble', 'isometricCube'],
        defaultValue: 38 // Varied defaults handled in render, but slider needs start.
    },
    {
        key: 'sideRatio',
        label: 'Perspective', // Horizontal rotation
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        group: 'dimensions',
        applicableTo: ['isometricCube'],
        defaultValue: 50
    },
    {
        key: 'depth',
        label: 'Depth',
        type: 'slider',
        min: 0,
        max: 200,
        step: 5,
        group: 'dimensions',
        applicableTo: ['solidBlock', 'perspectiveBlock', 'cylinder', 'openBox'],
        defaultValue: 50
    },
    {
        key: 'viewAngle',
        label: 'View Angle', // 0-360 degrees
        type: 'slider',
        min: 0,
        max: 360,
        step: 5,
        group: 'dimensions',
        applicableTo: ['solidBlock', 'perspectiveBlock', 'cylinder', 'openBox'],
        defaultValue: 45
    },
    {
        key: 'openBoxPreset',
        label: 'Box Style Preset',
        type: 'select',
        options: [
            { label: '— Custom —', value: 'custom' },
            // Presentation
            { label: '🎭 Theatre Reveal', value: 'theatreReveal' },
            { label: '❓ Mystery Box', value: 'mysteryBox' },
            { label: '🎩 Magic Box', value: 'magicBox' },
            // Product
            { label: '📦 Shopping Box', value: 'shoppingBox' },
            { label: '📱 Unboxing', value: 'unboxing' },
            { label: '💎 Premium Package', value: 'premiumPackage' },
            // Fantasy
            { label: '🏴‍☠️ Treasure Chest', value: 'treasureChest' },
            { label: '✨ Enchanted Box', value: 'enchantedBox' },
            { label: '🏛️ Ancient Ark', value: 'ancientArk' },
            // Playful
            { label: '🎁 Gift Box', value: 'giftBox' },
            { label: '🧸 Toy Box', value: 'toyBox' },
            { label: '🎉 Party Box', value: 'partyBox' },
            { label: '🎊 Surprise Box', value: 'surpriseBox' }
        ],
        group: 'dimensions',
        applicableTo: ['openBox'],
        defaultValue: 'custom'
    },
    {
        key: 'openAmount',
        label: 'Lid Open', // 0-100 (0=closed, 100=fully open)
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        group: 'dimensions',
        applicableTo: ['openBox'],
        defaultValue: 0
    },
    {
        key: 'lidPosition',
        label: 'Lid Hinge',
        type: 'select',
        options: [
            { label: 'Back', value: 'back' },
            { label: 'Front', value: 'front' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' }
        ],
        group: 'dimensions',
        applicableTo: ['openBox'],
        defaultValue: 'back'
    },
    {
        key: 'lidStyle',
        label: 'Lid Style',
        type: 'select',
        options: [
            { label: 'Single', value: 'single' },
            { label: 'Split (French)', value: 'split' },
            { label: 'Double', value: 'double' },
            { label: 'Quad (4 Flaps)', value: 'quad' },
            { label: 'Flaps (2 Half)', value: 'flaps' }
        ],
        group: 'dimensions',
        applicableTo: ['openBox'],
        defaultValue: 'single'
    },
    {
        key: 'showLidHinge',
        label: 'Show Hinge Edge',
        type: 'toggle',
        group: 'dimensions',
        applicableTo: ['openBox'],
        defaultValue: false
    },
    // Code Block properties
    {
        key: 'codeShowLineNumbers',
        label: 'Line Numbers',
        type: 'toggle',
        group: 'dimensions',
        applicableTo: ['codeBlock'],
        defaultValue: true,
    },
    {
        key: 'codeStartLineNumber',
        label: 'Start Line',
        type: 'number',
        min: 0,
        max: 9999,
        step: 1,
        group: 'dimensions',
        applicableTo: ['codeBlock'],
        defaultValue: 1,
        dependsOn: 'codeShowLineNumbers',
    },
    {
        key: 'dsShowIndices',
        label: 'Show Indices',
        type: 'toggle',
        group: 'dimensions',
        applicableTo: ['dsArray', 'dsHashTable'],
        defaultValue: true,
    },
    {
        key: 'dsDirection',
        label: 'Direction',
        type: 'select',
        options: [{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }],
        group: 'dimensions',
        applicableTo: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList'],
        defaultValue: 'horizontal',
    },
    {
        key: 'dsItemColor',
        label: 'Item Color',
        type: 'color',
        group: 'style',
        applicableTo: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'],
    },
    {
        key: 'dsCapacity',
        label: 'Buckets',
        type: 'number',
        min: 1,
        max: 20,
        step: 1,
        group: 'dimensions',
        applicableTo: ['dsHashTable'],
        defaultValue: 5,
    },
    {
        key: 'dsPersistChanges',
        label: 'Keep Changes After Presentation',
        type: 'toggle',
        group: 'dimensions',
        applicableTo: ['dsArray', 'dsStack', 'dsQueue', 'dsLinkedList', 'dsBinaryTree', 'dsHashTable'],
        defaultValue: false,
    },
    {
        key: 'taper',
        label: 'Taper/Scale',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        group: 'dimensions',
        applicableTo: ['perspectiveBlock'],
        defaultValue: 0
    },
    {
        key: 'skewX',
        label: 'Skew X',
        type: 'slider',
        min: -1,
        max: 1,
        step: 0.05,
        group: 'dimensions',
        applicableTo: ['perspectiveBlock'],
        defaultValue: 0
    },
    {
        key: 'skewY',
        label: 'Skew Y',
        type: 'slider',
        min: -1,
        max: 1,
        step: 0.05,
        group: 'dimensions',
        applicableTo: ['perspectiveBlock'],
        defaultValue: 0
    },
    {
        key: 'frontTaper',
        label: 'Front Taper',
        type: 'slider',
        min: 0,
        max: 1,
        step: 0.05,
        group: 'dimensions',
        applicableTo: ['perspectiveBlock'],
        defaultValue: 0
    },
    {
        key: 'frontSkewX',
        label: 'Front Skew X',
        type: 'slider',
        min: -1,
        max: 1,
        step: 0.05,
        group: 'dimensions',
        applicableTo: ['perspectiveBlock'],
        defaultValue: 0
    },
    {
        key: 'frontSkewY',
        label: 'Front Skew Y',
        type: 'slider',
        min: -1,
        max: 1,
        step: 0.05,
        group: 'dimensions',
        applicableTo: ['perspectiveBlock'],
        defaultValue: 0
    },
    // Table Properties
    {
        key: 'tableRows',
        label: 'Rows',
        type: 'number',
        min: 1,
        max: 50,
        group: 'dimensions',
        applicableTo: ['table'],
        defaultValue: 3
    },
    {
        key: 'tableCols',
        label: 'Columns',
        type: 'number',
        min: 1,
        max: 20,
        group: 'dimensions',
        applicableTo: ['table'],
        defaultValue: 3
    },
    {
        key: 'tableHeaders',
        label: 'Header Row',
        type: 'toggle',
        group: 'dimensions',
        applicableTo: ['table'],
        defaultValue: true
    },
    {
        key: 'tableHeaderColor',
        label: 'Header Color',
        type: 'color',
        group: 'style',
        applicableTo: ['table'],
        defaultValue: '#e2e8f0',
        dependsOn: 'tableHeaders'
    },
    {
        key: 'tableHeaderTextColor',
        label: 'Header Text',
        type: 'color',
        group: 'style',
        applicableTo: ['table'],
        defaultValue: undefined,
        dependsOn: 'tableHeaders'
    },
    {
        key: 'tableRowColor',
        label: 'Row Color',
        type: 'color',
        group: 'style',
        applicableTo: ['table'],
        defaultValue: undefined
    },
    {
        key: 'tableAltRowColor',
        label: 'Alt Row Color',
        type: 'color',
        group: 'style',
        applicableTo: ['table'],
        defaultValue: undefined
    },
    // BPMN Properties
    {
        key: 'bpmnEventType',
        label: 'Event Type',
        type: 'select',
        options: [
            { label: 'None', value: 'none' },
            { label: 'Message', value: 'message' },
            { label: 'Timer', value: 'timer' },
            { label: 'Error', value: 'error' },
            { label: 'Signal', value: 'signal' },
            { label: 'Conditional', value: 'conditional' },
            { label: 'Escalation', value: 'escalation' },
            { label: 'Compensation', value: 'compensation' },
            { label: 'Link', value: 'link' },
            { label: 'Terminate', value: 'terminate' },
            { label: 'Cancel', value: 'cancel' }
        ],
        applicableTo: ['bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent'],
        defaultValue: 'none',
        group: 'style'
    },
    {
        key: 'bpmnTaskType',
        label: 'Task Type',
        type: 'select',
        options: [
            { label: 'None', value: 'none' },
            { label: 'User', value: 'user' },
            { label: 'Service', value: 'service' },
            { label: 'Script', value: 'script' },
            { label: 'Manual', value: 'manual' },
            { label: 'Send', value: 'send' },
            { label: 'Receive', value: 'receive' },
            { label: 'Business Rule', value: 'businessRule' }
        ],
        applicableTo: ['bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: 'none',
        group: 'style'
    },
    {
        key: 'bpmnLoopType',
        label: 'Loop / Multi-Instance',
        type: 'select',
        options: [
            { label: 'None', value: 'none' },
            { label: 'Standard Loop', value: 'standard' },
            { label: 'Parallel Multi-Instance', value: 'parallel' },
            { label: 'Sequential Multi-Instance', value: 'sequential' },
            { label: 'Compensation', value: 'compensation' }
        ],
        applicableTo: ['bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: 'none',
        group: 'style'
    },
    {
        key: 'bpmnIconScale',
        label: 'Icon Size',
        type: 'slider',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        applicableTo: ['bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: 1.0,
        group: 'style'
    },
    {
        key: 'bpmnIconColor',
        label: 'Icon Color',
        type: 'color',
        applicableTo: ['bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        group: 'style'
    },
    {
        key: 'bpmnIconFilled',
        label: 'Fill Icon',
        type: 'toggle',
        applicableTo: ['bpmnStartEvent', 'bpmnEndEvent', 'bpmnIntermediateEvent', 'bpmnExclusiveGateway', 'bpmnParallelGateway', 'bpmnInclusiveGateway', 'bpmnEventGateway', 'bpmnTask', 'bpmnSubProcess', 'bpmnCallActivity'],
        defaultValue: false,
        group: 'style'
    },
    {
        key: 'bpmnNonInterrupting',
        label: 'Non-Interrupting',
        type: 'toggle',
        applicableTo: ['bpmnStartEvent', 'bpmnIntermediateEvent'],
        defaultValue: false,
        group: 'style'
    },
    {
        key: 'bpmnLaneCount',
        label: 'Lane Count',
        type: 'slider',
        min: 1,
        max: 6,
        step: 1,
        applicableTo: ['bpmnPool'],
        defaultValue: 1,
        group: 'style'
    },
    {
        key: 'bpmnOrientation',
        label: 'Orientation',
        type: 'select',
        options: [
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Vertical', value: 'vertical' }
        ],
        applicableTo: ['bpmnPool'],
        defaultValue: 'horizontal',
        group: 'style'
    }
];

export const getPropertiesForType = (type: ElementType) => {
    return properties.filter(p => p.applicableTo === 'all' || p.applicableTo.includes(type));
}
