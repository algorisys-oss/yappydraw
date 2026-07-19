import {
    store, setStore, setSelectedTool, toggleGrid, toggleSnapToGrid, toggleZenMode, toggleOutlineView, toggleTrimView,
    swapFillStroke, cleanUpElements, deleteUnusedSwatches, pasteOnAllArtboards,
    duplicateArtboard, fitArtboardToArtwork, shuffleSelectionColors,
    convertToShape, splitIntoGrid, convertToGuides, toggleObjectCropMarks,
    togglePropertyPanel, toggleLayerPanel, toggleMinimap, toggleRulers, clearGuides, zoomToFit, zoomToSelection, toggleVectorToolsPanel, toggleElementsPanel,
    groupSelected, ungroupSelected, bringToFront, sendToBack,
    mirrorCopy, transformAgain, convertTextToOutlines,
    toggleSymmetryGuide, setSymmetryAxis, mirrorAcrossSymmetry,
    moveElementZIndex, undo, redo, deleteElements, toggleTheme,
    setActiveLayer, clearHistory, addLayer, setViewState, togglePresentationMode,
    updateGlobalSettings, togglePenStabilization,
    toggleShapeBuilder, toggleLivePaint, makeLivePaint, releaseLivePaint, selectSimilar, applyDistort,
    toggleCutTool, toggleWidthTool, clearWidthProfile, toggleSymbolSprayer, setTextVertical,
    toggleCurveTool, toggleReshapeTool, toggleBlobBrush, togglePathEraser, togglePuppetWarp, togglePerspectiveGrid, toggleSliceTool, toggleTouchType, toggleSymbolism,
    applyFeather, applyGlow, applyScribble, setExtrude, toggleRevolve, setTransformEffect
} from "../store/app-store";
import { togglePanel, resetDockLayout } from "../store/dock-layout";
import { flipSelected, lockSelected } from "./object-context-actions";
import { openRepeatDialog } from "../components/repeat-dialog";
import { setIsDSLImportOpen, quickSaveToGallery } from "../components/menu";
import { setShowDrawingsGallery } from "../components/drawings-gallery-signal";
import type { ToolType } from "../types";

export interface Command {
    id: string;
    label: string;
    category: 'Tools' | 'Shapes' | 'Actions' | 'View' | 'Layers' | 'File';
    action: () => void;
    shortcut?: string;
}

// All shape/tool types with human-readable labels, grouped by toolbar category
const shapeToolCatalog: { type: ToolType; label: string; group: string }[] = [
    // Shapes — Basic
    { type: 'rectangle', label: 'Rectangle', group: 'Shapes' },
    { type: 'circle', label: 'Ellipse', group: 'Shapes' },
    { type: 'diamond', label: 'Diamond', group: 'Shapes' },
    { type: 'triangle', label: 'Triangle', group: 'Shapes' },
    { type: 'hexagon', label: 'Hexagon', group: 'Shapes' },
    { type: 'octagon', label: 'Octagon', group: 'Shapes' },
    { type: 'parallelogram', label: 'Parallelogram', group: 'Shapes' },
    { type: 'star', label: 'Star', group: 'Shapes' },
    { type: 'polygon', label: 'Polygon', group: 'Shapes' },
    { type: 'cloud', label: 'Cloud', group: 'Shapes' },
    { type: 'heart', label: 'Heart', group: 'Shapes' },
    { type: 'cross', label: 'Cross', group: 'Shapes' },
    { type: 'checkmark', label: 'Checkmark', group: 'Shapes' },
    { type: 'arrowLeft', label: 'Arrow Left', group: 'Shapes' },
    { type: 'arrowRight', label: 'Arrow Right', group: 'Shapes' },
    { type: 'arrowUp', label: 'Arrow Up', group: 'Shapes' },
    { type: 'arrowDown', label: 'Arrow Down', group: 'Shapes' },
    { type: 'trapezoid', label: 'Trapezoid', group: 'Shapes' },
    { type: 'rightTriangle', label: 'Right-Angle Triangle', group: 'Shapes' },
    { type: 'pentagon', label: 'Pentagon', group: 'Shapes' },
    { type: 'septagon', label: 'Septagon', group: 'Shapes' },
    { type: 'capsule', label: 'Capsule', group: 'Shapes' },
    { type: 'stickyNote', label: 'Sticky Note', group: 'Shapes' },
    { type: 'callout', label: 'Callout', group: 'Shapes' },
    { type: 'speechBubble', label: 'Speech Bubble', group: 'Shapes' },
    { type: 'burst', label: 'Burst', group: 'Shapes' },
    { type: 'ribbon', label: 'Ribbon', group: 'Shapes' },
    { type: 'bracketLeft', label: 'Left Bracket', group: 'Shapes' },
    { type: 'bracketRight', label: 'Right Bracket', group: 'Shapes' },
    { type: 'database', label: 'Database', group: 'Shapes' },
    { type: 'document', label: 'Document', group: 'Shapes' },
    { type: 'predefinedProcess', label: 'Predefined Process', group: 'Shapes' },
    { type: 'internalStorage', label: 'Internal Storage', group: 'Shapes' },

    // Connectors
    { type: 'arrow', label: 'Arrow', group: 'Connectors' },
    { type: 'line', label: 'Line', group: 'Connectors' },
    { type: 'bezier', label: 'Bezier Curve', group: 'Connectors' },
    { type: 'elbow', label: 'Elbow Connector', group: 'Connectors' },
    { type: 'polyline', label: 'Polyline', group: 'Connectors' },

    // Pen / Drawing
    { type: 'fineliner', label: 'Fine Liner Pen', group: 'Drawing' },
    { type: 'inkbrush', label: 'Ink Brush', group: 'Drawing' },
    { type: 'marker', label: 'Marker', group: 'Drawing' },

    // Text
    { type: 'text', label: 'Text', group: 'Text' },
    { type: 'richtext', label: 'Rich Text', group: 'Text' },
    { type: 'codeBlock', label: 'Code Block', group: 'Text' },

    // Infrastructure
    { type: 'server', label: 'Server', group: 'Infrastructure' },
    { type: 'loadBalancer', label: 'Load Balancer', group: 'Infrastructure' },
    { type: 'firewall', label: 'Firewall', group: 'Infrastructure' },
    { type: 'user', label: 'User / Client', group: 'Infrastructure' },
    { type: 'messageQueue', label: 'Message Queue', group: 'Infrastructure' },
    { type: 'lambda', label: 'Lambda / Function', group: 'Infrastructure' },
    { type: 'router', label: 'Router', group: 'Infrastructure' },
    { type: 'browser', label: 'Browser / Web', group: 'Infrastructure' },

    // Cloud Infrastructure
    { type: 'kubernetes', label: 'Kubernetes', group: 'Cloud' },
    { type: 'container', label: 'Container', group: 'Cloud' },
    { type: 'apiGateway', label: 'API Gateway', group: 'Cloud' },
    { type: 'cdn', label: 'CDN', group: 'Cloud' },
    { type: 'storageBlob', label: 'Storage Blob', group: 'Cloud' },
    { type: 'eventBus', label: 'Event Bus', group: 'Cloud' },
    { type: 'microservice', label: 'Microservice', group: 'Cloud' },
    { type: 'shield', label: 'Shield / Security', group: 'Cloud' },

    // UML
    { type: 'umlClass', label: 'UML Class', group: 'UML' },
    { type: 'umlInterface', label: 'UML Interface', group: 'UML' },
    { type: 'umlActor', label: 'UML Actor', group: 'UML' },
    { type: 'umlUseCase', label: 'UML Use Case', group: 'UML' },
    { type: 'umlNote', label: 'UML Note', group: 'UML' },
    { type: 'umlPackage', label: 'UML Package', group: 'UML' },
    { type: 'umlComponent', label: 'UML Component', group: 'UML' },
    { type: 'umlNode', label: 'UML Deployment Node', group: 'UML' },
    { type: 'umlArtifact', label: 'UML Artifact', group: 'UML' },
    { type: 'umlObject', label: 'UML Object / Instance', group: 'UML' },
    { type: 'umlPort', label: 'UML Port', group: 'UML' },
    { type: 'umlAction', label: 'UML Activity Action', group: 'UML' },
    { type: 'umlHistory', label: 'UML History State', group: 'UML' },
    { type: 'umlState', label: 'UML State', group: 'UML' },
    { type: 'umlLifeline', label: 'UML Lifeline', group: 'UML' },
    { type: 'umlFragment', label: 'UML Fragment', group: 'UML' },
    { type: 'umlEnum', label: 'UML Enum', group: 'UML' },
    { type: 'umlSignalSend', label: 'UML Signal Send', group: 'UML' },
    { type: 'umlSignalReceive', label: 'UML Signal Receive', group: 'UML' },
    { type: 'umlProvidedInterface', label: 'UML Provided Interface', group: 'UML' },
    { type: 'umlRequiredInterface', label: 'UML Required Interface', group: 'UML' },

    // BPMN
    { type: 'bpmnStartEvent', label: 'BPMN Start Event', group: 'BPMN' },
    { type: 'bpmnEndEvent', label: 'BPMN End Event', group: 'BPMN' },
    { type: 'bpmnIntermediateEvent', label: 'BPMN Intermediate Event', group: 'BPMN' },
    { type: 'bpmnExclusiveGateway', label: 'BPMN Exclusive Gateway (XOR)', group: 'BPMN' },
    { type: 'bpmnParallelGateway', label: 'BPMN Parallel Gateway (AND)', group: 'BPMN' },
    { type: 'bpmnInclusiveGateway', label: 'BPMN Inclusive Gateway (OR)', group: 'BPMN' },
    { type: 'bpmnEventGateway', label: 'BPMN Event Gateway', group: 'BPMN' },
    { type: 'bpmnTask', label: 'BPMN Task', group: 'BPMN' },
    { type: 'bpmnSubProcess', label: 'BPMN Sub-Process', group: 'BPMN' },
    { type: 'bpmnCallActivity', label: 'BPMN Call Activity', group: 'BPMN' },
    { type: 'bpmnDataObject', label: 'BPMN Data Object', group: 'BPMN' },
    { type: 'bpmnDataStore', label: 'BPMN Data Store', group: 'BPMN' },
    { type: 'bpmnAnnotation', label: 'BPMN Annotation', group: 'BPMN' },
    { type: 'bpmnGroup', label: 'BPMN Group', group: 'BPMN' },
    { type: 'bpmnPool', label: 'BPMN Pool / Lane', group: 'BPMN' },

    // Technical / Flowchart
    { type: 'dfdProcess', label: 'DFD Process', group: 'Technical' },
    { type: 'dfdDataStore', label: 'DFD Data Store', group: 'Technical' },
    { type: 'externalEntity', label: 'External Entity', group: 'Technical' },
    { type: 'isometricCube', label: 'Isometric Cube', group: 'Technical' },
    { type: 'cylinder', label: 'Cylinder', group: 'Technical' },
    { type: 'solidBlock', label: 'Solid Block', group: 'Technical' },
    { type: 'perspectiveBlock', label: 'Perspective Block', group: 'Technical' },
    { type: 'openBox', label: 'Open Box', group: 'Technical' },
    { type: 'stateStart', label: 'Initial State', group: 'Technical' },
    { type: 'stateEnd', label: 'Final State', group: 'Technical' },
    { type: 'stateSync', label: 'Sync Bar', group: 'Technical' },
    { type: 'activationBar', label: 'Activation Bar', group: 'Technical' },

    // Data Structures
    { type: 'dsArray', label: 'Array', group: 'Data Structures' },
    { type: 'dsStack', label: 'Stack', group: 'Data Structures' },
    { type: 'dsQueue', label: 'Queue', group: 'Data Structures' },
    { type: 'dsLinkedList', label: 'Linked List', group: 'Data Structures' },
    { type: 'dsBinaryTree', label: 'Binary Tree', group: 'Data Structures' },
    { type: 'dsHashTable', label: 'Hash Table', group: 'Data Structures' },

    // Charts & Data
    { type: 'barChart', label: 'Bar Chart', group: 'Charts' },
    { type: 'pieChart', label: 'Pie Chart', group: 'Charts' },
    { type: 'trendUp', label: 'Trend Up', group: 'Charts' },
    { type: 'trendDown', label: 'Trend Down', group: 'Charts' },
    { type: 'funnel', label: 'Funnel', group: 'Charts' },
    { type: 'gauge', label: 'Gauge', group: 'Charts' },
    { type: 'table', label: 'Table', group: 'Charts' },

    // Sketchnote / Icons
    { type: 'starPerson', label: 'Star Person', group: 'Sketchnote' },
    { type: 'scroll', label: 'Scroll Container', group: 'Sketchnote' },
    { type: 'wavyDivider', label: 'Wavy Divider', group: 'Sketchnote' },
    { type: 'doubleBanner', label: 'Double Banner', group: 'Sketchnote' },
    { type: 'lightbulb', label: 'Lightbulb', group: 'Sketchnote' },
    { type: 'signpost', label: 'Signpost', group: 'Sketchnote' },
    { type: 'burstBlob', label: 'Burst Blob', group: 'Sketchnote' },
    { type: 'trophy', label: 'Trophy', group: 'Sketchnote' },
    { type: 'clock', label: 'Clock', group: 'Sketchnote' },
    { type: 'gear', label: 'Gear', group: 'Sketchnote' },
    { type: 'target', label: 'Target', group: 'Sketchnote' },
    { type: 'rocket', label: 'Rocket', group: 'Sketchnote' },
    { type: 'flag', label: 'Flag', group: 'Sketchnote' },
    { type: 'key', label: 'Key', group: 'Sketchnote' },
    { type: 'magnifyingGlass', label: 'Magnifying Glass', group: 'Sketchnote' },
    { type: 'book', label: 'Book', group: 'Sketchnote' },
    { type: 'megaphone', label: 'Megaphone', group: 'Sketchnote' },
    { type: 'eye', label: 'Eye', group: 'Sketchnote' },
    { type: 'thoughtBubble', label: 'Thought Bubble', group: 'Sketchnote' },
    { type: 'stickFigure', label: 'Stick Figure', group: 'Sketchnote' },
    { type: 'sittingPerson', label: 'Sitting Person', group: 'Sketchnote' },
    { type: 'presentingPerson', label: 'Presenting Person', group: 'Sketchnote' },
    { type: 'handPointRight', label: 'Pointing Hand', group: 'Sketchnote' },
    { type: 'thumbsUp', label: 'Thumbs Up', group: 'Sketchnote' },
    { type: 'faceHappy', label: 'Happy Face', group: 'Sketchnote' },
    { type: 'faceSad', label: 'Sad Face', group: 'Sketchnote' },
    { type: 'faceConfused', label: 'Confused Face', group: 'Sketchnote' },

    // Status / Badges
    { type: 'checkbox', label: 'Checkbox', group: 'Status' },
    { type: 'checkboxChecked', label: 'Checkbox Checked', group: 'Status' },
    { type: 'numberedBadge', label: 'Numbered Badge', group: 'Status' },
    { type: 'questionMark', label: 'Question Mark', group: 'Status' },
    { type: 'exclamationMark', label: 'Exclamation Mark', group: 'Status' },
    { type: 'tag', label: 'Tag', group: 'Status' },
    { type: 'pin', label: 'Map Pin', group: 'Status' },
    { type: 'stamp', label: 'Stamp', group: 'Status' },

    // Connections & Relationships
    { type: 'puzzlePiece', label: 'Puzzle Piece', group: 'Connections' },
    { type: 'chainLink', label: 'Chain Link', group: 'Connections' },
    { type: 'bridge', label: 'Bridge', group: 'Connections' },
    { type: 'magnet', label: 'Magnet', group: 'Connections' },
    { type: 'scale', label: 'Scale / Balance', group: 'Connections' },
    { type: 'seedling', label: 'Seedling', group: 'Connections' },
    { type: 'tree', label: 'Tree', group: 'Connections' },
    { type: 'mountain', label: 'Mountain', group: 'Connections' },

    // Wireframe / UI
    { type: 'browserWindow', label: 'Browser Window', group: 'Wireframe' },
    { type: 'mobilePhone', label: 'Mobile Phone', group: 'Wireframe' },
    { type: 'ghostButton', label: 'Ghost Button', group: 'Wireframe' },
    { type: 'inputField', label: 'Input Field', group: 'Wireframe' },
    { type: 'solidButton', label: 'Solid Button', group: 'Wireframe' },
    { type: 'dropdown', label: 'Dropdown', group: 'Wireframe' },
    { type: 'uiCheckbox', label: 'UI Checkbox', group: 'Wireframe' },
    { type: 'radioButton', label: 'Radio Button', group: 'Wireframe' },
    { type: 'toggleSwitch', label: 'Toggle Switch', group: 'Wireframe' },
    { type: 'card', label: 'Card', group: 'Wireframe' },
    { type: 'searchBar', label: 'Search Bar', group: 'Wireframe' },
    { type: 'progressBar', label: 'Progress Bar', group: 'Wireframe' },
    { type: 'avatar', label: 'Avatar', group: 'Wireframe' },
    { type: 'navbar', label: 'Navigation Bar', group: 'Wireframe' },
    { type: 'tabBar', label: 'Tab Bar', group: 'Wireframe' },
    { type: 'badge', label: 'Badge', group: 'Wireframe' },
    { type: 'tooltip', label: 'Tooltip', group: 'Wireframe' },
    { type: 'slider', label: 'Slider', group: 'Wireframe' },
];

export const getCommands = (): Command[] => {
    const commands: Command[] = [
        // Tools
        { id: 'tool-selection', label: 'Selection Tool', category: 'Tools', action: () => setSelectedTool('selection'), shortcut: 'V' },
        { id: 'tool-eraser', label: 'Eraser Tool', category: 'Tools', action: () => setSelectedTool('eraser'), shortcut: 'E' },
        { id: 'tool-pan', label: 'Pan Tool', category: 'Tools', action: () => setSelectedTool('pan'), shortcut: 'H' },
        { id: 'tool-lasso', label: 'Lasso Selection Tool', category: 'Tools', action: () => setSelectedTool('lasso'), shortcut: 'Shift+L' },

        // Actions
        { id: 'action-undo', label: 'Undo', category: 'Actions', action: () => undo(), shortcut: 'Ctrl+Z' },
        { id: 'action-redo', label: 'Redo', category: 'Actions', action: () => redo(), shortcut: 'Ctrl+Y' },
        { id: 'action-group', label: 'Group Selection', category: 'Actions', action: () => groupSelected(), shortcut: 'Ctrl+G' },
        { id: 'action-ungroup', label: 'Ungroup Selection', category: 'Actions', action: () => ungroupSelected(), shortcut: 'Ctrl+Shift+G' },
        { id: 'action-front', label: 'Bring to Front', category: 'Actions', action: () => bringToFront(store.selection), shortcut: 'Ctrl+]' },
        { id: 'action-back', label: 'Send to Back', category: 'Actions', action: () => sendToBack(store.selection), shortcut: 'Ctrl+[' },
        { id: 'action-forward', label: 'Bring Forward', category: 'Actions', action: () => moveElementZIndex(store.selection[0], 'forward') },
        { id: 'action-backward', label: 'Send Backward', category: 'Actions', action: () => moveElementZIndex(store.selection[0], 'backward') },
        { id: 'action-delete', label: 'Delete Selected', category: 'Actions', action: () => deleteElements(store.selection), shortcut: 'Del' },
        { id: 'action-flip-h', label: 'Flip Horizontal', category: 'Actions', action: () => flipSelected('horizontal'), shortcut: 'Shift+H' },
        { id: 'action-flip-v', label: 'Flip Vertical', category: 'Actions', action: () => flipSelected('vertical'), shortcut: 'Shift+V' },
        { id: 'action-outlines', label: 'Create Outlines (text → vector)', category: 'Actions', action: () => { void convertTextToOutlines(store.selection); }, shortcut: 'Ctrl+Shift+O' },
        { id: 'effect-feather', label: 'Effect: Feather (soft edge)', category: 'Actions', action: () => applyFeather([...store.selection], 12) },
        { id: 'effect-feather-off', label: 'Effect: Remove Feather', category: 'Actions', action: () => applyFeather([...store.selection], 0) },
        { id: 'effect-glow', label: 'Effect: Outer Glow', category: 'Actions', action: () => applyGlow([...store.selection], { blur: 14 }) },
        { id: 'effect-glow-off', label: 'Effect: Remove Outer Glow', category: 'Actions', action: () => applyGlow([...store.selection], { enabled: false }) },
        { id: 'effect-scribble', label: 'Effect: Scribble fill', category: 'Actions', action: () => applyScribble([...store.selection], {}) },
        { id: 'panel-effects', label: 'Panel: Effects (dockable)', category: 'View', action: () => togglePanel('effects', 'docked') },
        { id: 'panel-align', label: 'Panel: Align & Distribute (dockable)', category: 'View', action: () => togglePanel('align', 'docked') },
        { id: 'panel-arrange', label: 'Panel: Arrange (dockable)', category: 'View', action: () => togglePanel('arrange', 'docked') },
        { id: 'panel-comic', label: 'Panel: Comic Studio (script \u2192 comic)', category: 'View', action: () => togglePanel('comic', 'docked') },
        { id: 'panel-reset-layout', label: 'Panel: Reset Dock Layout', category: 'View', action: () => resetDockLayout() },
        { id: 'effect-3d-extrude', label: 'Effect: 3D Extrude', category: 'Actions', action: () => setExtrude([...store.selection], { depth: 32, angle: 135 }) },
        { id: 'effect-3d-bevel', label: 'Effect: 3D Bevel', category: 'Actions', action: () => setExtrude([...store.selection], { depth: 40, angle: 135, bevel: 10 }) },
        { id: 'effect-3d-revolve', label: 'Effect: 3D Revolve (lathe)', category: 'Actions', action: () => toggleRevolve([...store.selection], true) },
        { id: 'effect-transform', label: 'Effect: Transform (live copies — spiral)', category: 'Actions', action: () => setTransformEffect([...store.selection], { copies: 12, rotate: 24, scaleX: 0.9, scaleY: 0.9 }) },
        { id: 'action-swap-fill-stroke', label: 'Swap Fill / Stroke', category: 'Actions', action: () => swapFillStroke(), shortcut: 'Shift+X' },
        { id: 'action-clean-up', label: 'Clean Up (stray points, empty text, unpainted)', category: 'Actions', action: () => cleanUpElements() },
        { id: 'action-paste-all-artboards', label: 'Paste on All Artboards', category: 'Actions', action: () => pasteOnAllArtboards() },
        { id: 'action-duplicate-artboard', label: 'Duplicate Artboard (with artwork)', category: 'Actions', action: () => duplicateArtboard() },
        { id: 'action-fit-artboard', label: 'Fit Artboard to Artwork', category: 'Actions', action: () => fitArtboardToArtwork() },
        { id: 'action-shuffle-colors', label: 'Recolor: Shuffle Colour Order', category: 'Actions', action: () => shuffleSelectionColors() },
        // Illustrator effects (tier 1)
        { id: 'fx-convert-rect', label: 'Convert to Shape: Rectangle', category: 'Actions', action: () => convertToShape([...store.selection], 'rectangle') },
        { id: 'fx-convert-rounded', label: 'Convert to Shape: Rounded Rectangle', category: 'Actions', action: () => convertToShape([...store.selection], 'rounded') },
        { id: 'fx-convert-ellipse', label: 'Convert to Shape: Ellipse', category: 'Actions', action: () => convertToShape([...store.selection], 'ellipse') },
        { id: 'fx-split-grid', label: 'Split Into Grid (4×4)', category: 'Actions', action: () => splitIntoGrid(store.selection[0], 4, 4, 0) },
        { id: 'fx-to-guides', label: 'Convert Shapes to Guides', category: 'Actions', action: () => convertToGuides() },
        { id: 'fx-crop-marks', label: 'Toggle Crop Marks (on object)', category: 'Actions', action: () => toggleObjectCropMarks() },
        { id: 'action-del-unused-swatches', label: 'Delete Unused Swatches', category: 'Actions', action: () => deleteUnusedSwatches() },

        // Illustrator-class tools (also on the right-click menu / panels)
        { id: 'tool-live-paint', label: 'Live Paint Bucket (fill regions)', category: 'Tools', action: () => { makeLivePaint([...store.selection]); toggleLivePaint(true); } },
        { id: 'action-live-paint-release', label: 'Live Paint: Release', category: 'Actions', action: () => { const g = store.elements.find(e => e.livePaintGroupId)?.livePaintGroupId; if (g) releaseLivePaint(g); } },
        { id: 'tool-shape-builder', label: 'Shape Builder (merge / carve regions)', category: 'Tools', action: () => toggleShapeBuilder(true) },
        { id: 'tool-magic-wand', label: 'Magic Wand (Select Similar)', category: 'Tools', action: () => selectSimilar() },
        { id: 'select-same-fill', label: 'Select › Same Fill Colour', category: 'Tools', action: () => selectSimilar(undefined, 'fill') },
        { id: 'select-same-stroke', label: 'Select › Same Stroke Colour', category: 'Tools', action: () => selectSimilar(undefined, 'stroke') },
        { id: 'select-same-font', label: 'Select › Same Font Family', category: 'Tools', action: () => selectSimilar(undefined, 'fontFamily') },
        { id: 'select-same-fontsize', label: 'Select › Same Font Size', category: 'Tools', action: () => selectSimilar(undefined, 'fontSize') },
        { id: 'select-same-opacity', label: 'Select › Same Opacity', category: 'Tools', action: () => selectSimilar(undefined, 'opacity') },
        { id: 'select-same-strokeweight', label: 'Select › Same Stroke Weight', category: 'Tools', action: () => selectSimilar(undefined, 'strokeWidth') },
        { id: 'select-same-type', label: 'Select › Same Kind (shape type)', category: 'Tools', action: () => selectSimilar(undefined, 'type') },
        { id: 'tool-knife', label: 'Knife / Scissors (cut)', category: 'Tools', action: () => toggleCutTool(true) },
        { id: 'tool-width', label: 'Width Tool (variable stroke)', category: 'Tools', action: () => toggleWidthTool(true) },
        { id: 'action-width-reset', label: 'Reset Width Profile', category: 'Actions', action: () => clearWidthProfile([...store.selection]) },
        { id: 'tool-symbol-sprayer', label: 'Symbol Sprayer', category: 'Tools', action: () => toggleSymbolSprayer() },
        { id: 'tool-curvature', label: 'Curvature Tool (smooth curve)', category: 'Tools', action: () => toggleCurveTool(true) },
        { id: 'tool-reshape', label: 'Reshape Tool (bend a path)', category: 'Tools', action: () => toggleReshapeTool(true) },
        { id: 'tool-blob-brush', label: 'Blob Brush', category: 'Tools', action: () => toggleBlobBrush(true) },
        { id: 'tool-path-eraser', label: 'Path Eraser', category: 'Tools', action: () => togglePathEraser(true) },
        { id: 'tool-puppet-warp', label: 'Puppet Warp', category: 'Tools', action: () => togglePuppetWarp(true) },
        { id: 'tool-perspective-grid', label: 'Perspective Grid', category: 'Tools', action: () => togglePerspectiveGrid(true) },
        { id: 'tool-slice', label: 'Slice (export region)', category: 'Tools', action: () => toggleSliceTool(true) },
        { id: 'tool-symbolism', label: 'Symbolism Brush (symbol sub-tools)', category: 'Tools', action: () => toggleSymbolism(true) },
        { id: 'panel-vector-tools', label: 'Vector Tools palette (toggle)', category: 'View', action: () => toggleVectorToolsPanel() },
        { id: 'tool-touch-type', label: 'Touch Type (per-letter)', category: 'Tools', action: () => toggleTouchType(true) },
        { id: 'action-vertical-type', label: 'Vertical Type (toggle)', category: 'Actions', action: () => { const id = store.selection[0]; if (id) setTextVertical(id); } },
        { id: 'action-distort-pucker', label: 'Distort: Pucker', category: 'Actions', action: () => applyDistort([...store.selection], 'pucker', 0.25) },
        { id: 'action-distort-bloat', label: 'Distort: Bloat', category: 'Actions', action: () => applyDistort([...store.selection], 'bloat', 0.25) },
        { id: 'action-distort-twirl', label: 'Distort: Twirl', category: 'Actions', action: () => applyDistort([...store.selection], 'twirl', 0.25) },
        { id: 'action-distort-zigzag', label: 'Distort: Zig-Zag', category: 'Actions', action: () => applyDistort([...store.selection], 'zigzag', 0.12) },
        { id: 'action-distort-crystallize', label: 'Distort: Crystallize', category: 'Actions', action: () => applyDistort([...store.selection], 'crystallize', 0.18) },
        { id: 'action-distort-roughen', label: 'Distort: Roughen', category: 'Actions', action: () => applyDistort([...store.selection], 'roughen', 0.1) },
        { id: 'action-mirror-h', label: 'Mirror Copy (horizontal)', category: 'Actions', action: () => mirrorCopy('horizontal') },
        { id: 'action-mirror-v', label: 'Mirror Copy (vertical)', category: 'Actions', action: () => mirrorCopy('vertical') },
        { id: 'action-repeat', label: 'Repeat (Radial / Grid)…', category: 'Actions', action: () => openRepeatDialog() },
        { id: 'action-symmetry-toggle', label: 'Toggle Symmetry Guide', category: 'Actions', shortcut: 'Alt+Y', action: () => {
            const s = store.viewState;
            const cx = (window.innerWidth / 2 - s.panX) / s.scale;
            const cy = (window.innerHeight / 2 - s.panY) / s.scale;
            const next = !store.symmetry.enabled;
            toggleSymmetryGuide(next, store.symmetry.axis === 'vertical' ? cx : cy);
        } },
        { id: 'action-symmetry-axis', label: 'Symmetry Guide: Switch Axis (V/H)', category: 'Actions', action: () => setSymmetryAxis(store.symmetry.axis === 'vertical' ? 'horizontal' : 'vertical') },
        { id: 'action-symmetry-mirror', label: 'Mirror Across Symmetry Guide', category: 'Actions', action: () => mirrorAcrossSymmetry() },
        { id: 'action-transform-again', label: 'Transform Again', category: 'Actions', action: () => transformAgain(), shortcut: 'Ctrl+Shift+D' },
        { id: 'action-lock', label: 'Lock / Unlock', category: 'Actions', action: () => {
            const isLocked = store.selection.some(id => store.elements.find(e => e.id === id)?.locked);
            lockSelected(!isLocked);
        }, shortcut: 'Ctrl+Shift+L' },

        // View
        { id: 'view-grid', label: 'Toggle Grid', category: 'View', action: () => toggleGrid(), shortcut: 'Shift+\'' },
        { id: 'view-snap', label: 'Toggle Snap to Grid', category: 'View', action: () => toggleSnapToGrid(), shortcut: 'Shift+;' },
        { id: 'view-zen', label: 'Toggle Zen Mode', category: 'View', action: () => toggleZenMode(), shortcut: 'Alt+Z' },
        { id: 'view-outline', label: 'Toggle Outline (Wireframe) View', category: 'View', action: () => toggleOutlineView() },
        { id: 'view-trim', label: 'Toggle Trim View (hide outside artboards)', category: 'View', action: () => toggleTrimView() },
        { id: 'view-smart-shape', label: 'Toggle Smart Shapes (hold to correct)', category: 'View', action: () => updateGlobalSettings({ smartShape: store.globalSettings.smartShape === false }), shortcut: 'Shift+Q' },
        { id: 'view-pen-pressure', label: 'Toggle Pen Pressure Sensitivity', category: 'View', action: () => updateGlobalSettings({ penPressure: store.globalSettings.penPressure === false }) },
        { id: 'view-pen-stabilization', label: 'Toggle Stroke Stabilization (lazy brush)', category: 'View', action: () => togglePenStabilization(), shortcut: 'Shift+S' },
        { id: 'view-properties', label: 'Toggle Properties Panel', category: 'View', action: () => togglePropertyPanel(), shortcut: 'Alt+Enter' },
        { id: 'view-elements', label: 'Toggle Elements Panel (search icons, illustrations, shapes, photos)', category: 'View', action: () => toggleElementsPanel(), shortcut: 'Alt+E' },
        { id: 'view-layers', label: 'Toggle Layers Panel', category: 'View', action: () => toggleLayerPanel(), shortcut: 'Alt+L' },
        { id: 'view-minimap', label: 'Toggle Minimap', category: 'View', action: () => toggleMinimap(), shortcut: 'Alt+M' },
        { id: 'view-rulers', label: 'Toggle Rulers & Guides', category: 'View', action: () => toggleRulers(), shortcut: 'Alt+R' },
        { id: 'view-clear-guides', label: 'Clear All Guides', category: 'View', action: () => clearGuides() },
        { id: 'view-zoom-in', label: 'Zoom In', category: 'View', action: () => {
            const s = store.viewState;
            const newScale = Math.min(s.scale * 1.1, 10);
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
            setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
        }, shortcut: 'Ctrl+=' },
        { id: 'view-zoom-out', label: 'Zoom Out', category: 'View', action: () => {
            const s = store.viewState;
            const newScale = Math.max(s.scale * 0.9, 0.1);
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
            setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
        }, shortcut: 'Ctrl+-' },
        { id: 'view-zoom-reset', label: 'Reset Zoom (100%)', category: 'View', action: () => setViewState({ scale: 1 }), shortcut: 'Ctrl+0' },
        { id: 'view-zoom-fit', label: 'Zoom to Fit', category: 'View', action: () => zoomToFit(), shortcut: 'Ctrl+1' },
        { id: 'view-zoom-selection', label: 'Zoom to Selection', category: 'View', action: () => zoomToSelection(), shortcut: 'Ctrl+2' },
        { id: 'view-theme', label: 'Toggle Theme (Light / Dark / Focus / System)', category: 'View', action: () => toggleTheme() },
        { id: 'view-present-start', label: 'Present from Beginning', category: 'View', action: () => togglePresentationMode(true, 0), shortcut: 'F5' },
        { id: 'view-present-current', label: 'Present from Current Slide', category: 'View', action: () => togglePresentationMode(true), shortcut: 'Shift+F5' },

        // File
        {
            id: 'file-new', label: 'New Sketch', category: 'File', action: () => {
                if (confirm('Start new sketch? Unsaved changes will be lost.')) {
                    setStore("elements", []);
                    setStore("viewState", { scale: 1, panX: 0, panY: 0 });
                    setStore("selection", []);
                    setStore("layers", [{ id: 'default-layer', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 }]);
                    setStore("activeLayerId", 'default-layer');
                    setStore("welcomeDismissed", true);
                    clearHistory();
                }
            },
            shortcut: 'Alt+N'
        },
        { id: 'action-add-layer', label: 'Add Layer', category: 'Layers', action: () => addLayer(), shortcut: 'Ctrl+Shift+N' },

        // DSL Import
        { id: 'file-import-dsl', label: 'Import Diagram from Text', category: 'File', action: () => setIsDSLImportOpen(true), shortcut: 'Ctrl+Shift+I' },
        { id: 'file-save-gallery', label: 'Save to My Drawings', category: 'File', action: () => { void quickSaveToGallery(); }, shortcut: 'Ctrl+S' },
        { id: 'file-open-gallery', label: 'My Drawings (open gallery)', category: 'File', action: () => setShowDrawingsGallery(true) },
    ];

    // Register all shapes/tools from catalog
    for (const tool of shapeToolCatalog) {
        commands.push({
            id: `shape-${tool.type}`,
            label: `${tool.label}`,
            category: 'Shapes',
            action: () => setSelectedTool(tool.type),
        });
    }

    // Dynamic Layer Commands
    store.layers.forEach(layer => {
        commands.push({
            id: `layer-${layer.id}`,
            label: `Activate Layer: ${layer.name}`,
            category: 'Layers',
            action: () => setActiveLayer(layer.id)
        });
    });

    return commands;
};

// Helper for fuzzy search or prefix search
export const searchCommands = (query: string, categoryFilter?: string): Command[] => {
    let all = getCommands();
    if (categoryFilter) {
        all = all.filter(c => c.category === categoryFilter);
    }

    if (!query) return all.slice(0, categoryFilter ? 20 : 10); // Show more for filtered views

    const q = query.toLowerCase();
    return all.filter(c =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    ).sort((a, b) => {
        // Boost exact matches or prefix matches
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        if (aLabel.startsWith(q) && !bLabel.startsWith(q)) return -1;
        if (!aLabel.startsWith(q) && bLabel.startsWith(q)) return 1;
        return aLabel.localeCompare(bLabel);
    });
};
