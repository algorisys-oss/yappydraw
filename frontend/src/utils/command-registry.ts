import {
    store, setStore, setSelectedTool, toggleGrid, toggleSnapToGrid, toggleZenMode, toggleOutlineView, toggleTrimView,
    swapFillStroke, cleanUpElements, deleteUnusedSwatches, pasteOnAllArtboards,
    duplicateArtboard, fitArtboardToArtwork, shuffleSelectionColors,
    convertToShape, splitIntoGrid, convertToGuides, toggleObjectCropMarks,
    togglePropertyPanel, toggleLayerPanel, toggleMinimap, toggleRulers, clearGuides, zoomToFit, zoomToSelection, toggleVectorToolsPanel, toggleElementsPanel,
    selectAllGuides, removeSelectedGuides, toggleGuidesLocked,
    groupSelected, ungroupSelected, bringToFront, sendToBack,
    mirrorCopy, transformAgain, convertTextToOutlines,
    toggleSymmetry, toggleSymmetryAxis, setSymmetryMode, toggleSymmetryEditing,
    setSymmetryCenter, mirrorAcrossSymmetry,
    moveSelectionZIndex, undo, redo, deleteElements, toggleTheme,
    setActiveLayer, clearHistory, addLayer, setViewState, togglePresentationMode,
    updateGlobalSettings, togglePenStabilization,
    toggleShapeBuilder, togglePathfinderBar, setGridStyle, setWidthProfilePreset, toggleLivePaint, makeLivePaint, releaseLivePaint, selectSimilar, applyDistort,
    toggleCutTool, toggleWidthTool, clearWidthProfile, toggleSymbolSprayer, setTextVertical,
    toggleCurveTool, toggleReshapeTool, toggleBlobBrush, togglePathEraser, togglePuppetWarp, togglePerspectiveGrid, toggleSliceTool, toggleTouchType, toggleSymbolism,
    toggleNodeTool, exitAllToolModes,
    applyFeather, applyGlow, applyScribble, setExtrude, toggleRevolve, setTransformEffect
} from "../store/app-store";
import { togglePanel, resetDockLayout } from "../store/dock-layout";
import { flipSelected, lockSelected, unlockAllElements } from "./object-context-actions";
import { showToast } from "../components/toast";
import { openRepeatDialog } from "../components/repeat-dialog";
import { openMandalaDialog } from "../components/mandala-dialog";
import { setIsDSLImportOpen, quickSaveToGallery } from "../components/menu";
import { setShowDrawingsGallery } from "../components/drawings-gallery-signal";
import { openSupport } from "../components/support-dialog";
import { openAbout } from "../components/about-dialog";
import { hasSupportLinks } from "../config/support";
import type { ToolType } from "../types";
import { canvasCenterClient } from './dock-layout';
import { rasterizeSelection } from './rasterize';
import { t, type ShapeKey } from "../i18n";

export interface Command {
    id: string;
    label: string;
    category: 'Tools' | 'Shapes' | 'Actions' | 'View' | 'Layers' | 'File';
    action: () => void;
    shortcut?: string;
}

// All shape/tool types with human-readable labels, grouped by toolbar category
const shapeToolCatalog: { type: ToolType & ShapeKey; group: string }[] = [
    // Shapes — Basic
    { type: 'rectangle', group: 'Shapes' },
    { type: 'circle', group: 'Shapes' },
    { type: 'diamond', group: 'Shapes' },
    { type: 'triangle', group: 'Shapes' },
    { type: 'hexagon', group: 'Shapes' },
    { type: 'octagon', group: 'Shapes' },
    { type: 'parallelogram', group: 'Shapes' },
    { type: 'star', group: 'Shapes' },
    { type: 'polygon', group: 'Shapes' },
    { type: 'cloud', group: 'Shapes' },
    { type: 'heart', group: 'Shapes' },
    { type: 'cross', group: 'Shapes' },
    { type: 'checkmark', group: 'Shapes' },
    { type: 'arrowLeft', group: 'Shapes' },
    { type: 'arrowRight', group: 'Shapes' },
    { type: 'arrowUp', group: 'Shapes' },
    { type: 'arrowDown', group: 'Shapes' },
    { type: 'trapezoid', group: 'Shapes' },
    { type: 'rightTriangle', group: 'Shapes' },
    { type: 'pentagon', group: 'Shapes' },
    { type: 'septagon', group: 'Shapes' },
    { type: 'capsule', group: 'Shapes' },
    { type: 'stickyNote', group: 'Shapes' },
    { type: 'callout', group: 'Shapes' },
    { type: 'speechBubble', group: 'Shapes' },
    { type: 'burst', group: 'Shapes' },
    { type: 'ribbon', group: 'Shapes' },
    { type: 'bracketLeft', group: 'Shapes' },
    { type: 'bracketRight', group: 'Shapes' },
    { type: 'database', group: 'Shapes' },
    { type: 'document', group: 'Shapes' },
    { type: 'predefinedProcess', group: 'Shapes' },
    { type: 'internalStorage', group: 'Shapes' },

    // Connectors
    { type: 'arrow', group: 'Connectors' },
    { type: 'line', group: 'Connectors' },
    { type: 'bezier', group: 'Connectors' },
    { type: 'elbow', group: 'Connectors' },
    { type: 'polyline', group: 'Connectors' },

    // Pen / Drawing
    { type: 'fineliner', group: 'Drawing' },
    { type: 'inkbrush', group: 'Drawing' },
    { type: 'marker', group: 'Drawing' },

    // Text
    { type: 'text', group: 'Text' },
    { type: 'richtext', group: 'Text' },
    { type: 'codeBlock', group: 'Text' },

    // Infrastructure
    { type: 'server', group: 'Infrastructure' },
    { type: 'loadBalancer', group: 'Infrastructure' },
    { type: 'firewall', group: 'Infrastructure' },
    { type: 'user', group: 'Infrastructure' },
    { type: 'messageQueue', group: 'Infrastructure' },
    { type: 'lambda', group: 'Infrastructure' },
    { type: 'router', group: 'Infrastructure' },
    { type: 'browser', group: 'Infrastructure' },

    // Cloud Infrastructure
    { type: 'kubernetes', group: 'Cloud' },
    { type: 'container', group: 'Cloud' },
    { type: 'apiGateway', group: 'Cloud' },
    { type: 'cdn', group: 'Cloud' },
    { type: 'storageBlob', group: 'Cloud' },
    { type: 'eventBus', group: 'Cloud' },
    { type: 'microservice', group: 'Cloud' },
    { type: 'shield', group: 'Cloud' },

    // UML
    { type: 'umlClass', group: 'UML' },
    { type: 'umlInterface', group: 'UML' },
    { type: 'umlActor', group: 'UML' },
    { type: 'umlUseCase', group: 'UML' },
    { type: 'umlNote', group: 'UML' },
    { type: 'umlPackage', group: 'UML' },
    { type: 'umlComponent', group: 'UML' },
    { type: 'umlNode', group: 'UML' },
    { type: 'umlArtifact', group: 'UML' },
    { type: 'umlObject', group: 'UML' },
    { type: 'umlPort', group: 'UML' },
    { type: 'umlAction', group: 'UML' },
    { type: 'umlHistory', group: 'UML' },
    { type: 'umlState', group: 'UML' },
    { type: 'umlLifeline', group: 'UML' },
    { type: 'umlFragment', group: 'UML' },
    { type: 'umlEnum', group: 'UML' },
    { type: 'umlSignalSend', group: 'UML' },
    { type: 'umlSignalReceive', group: 'UML' },
    { type: 'umlProvidedInterface', group: 'UML' },
    { type: 'umlRequiredInterface', group: 'UML' },

    // BPMN
    { type: 'bpmnStartEvent', group: 'BPMN' },
    { type: 'bpmnEndEvent', group: 'BPMN' },
    { type: 'bpmnIntermediateEvent', group: 'BPMN' },
    { type: 'bpmnExclusiveGateway', group: 'BPMN' },
    { type: 'bpmnParallelGateway', group: 'BPMN' },
    { type: 'bpmnInclusiveGateway', group: 'BPMN' },
    { type: 'bpmnEventGateway', group: 'BPMN' },
    { type: 'bpmnTask', group: 'BPMN' },
    { type: 'bpmnSubProcess', group: 'BPMN' },
    { type: 'bpmnCallActivity', group: 'BPMN' },
    { type: 'bpmnDataObject', group: 'BPMN' },
    { type: 'bpmnDataStore', group: 'BPMN' },
    { type: 'bpmnAnnotation', group: 'BPMN' },
    { type: 'bpmnGroup', group: 'BPMN' },
    { type: 'bpmnPool', group: 'BPMN' },

    // Technical / Flowchart
    { type: 'dfdProcess', group: 'Technical' },
    { type: 'dfdDataStore', group: 'Technical' },
    { type: 'externalEntity', group: 'Technical' },
    { type: 'isometricCube', group: 'Technical' },
    { type: 'cylinder', group: 'Technical' },
    { type: 'solidBlock', group: 'Technical' },
    { type: 'perspectiveBlock', group: 'Technical' },
    { type: 'openBox', group: 'Technical' },
    { type: 'stateStart', group: 'Technical' },
    { type: 'stateEnd', group: 'Technical' },
    { type: 'stateSync', group: 'Technical' },
    { type: 'activationBar', group: 'Technical' },

    // Data Structures
    { type: 'dsArray', group: 'Data Structures' },
    { type: 'dsStack', group: 'Data Structures' },
    { type: 'dsQueue', group: 'Data Structures' },
    { type: 'dsLinkedList', group: 'Data Structures' },
    { type: 'dsBinaryTree', group: 'Data Structures' },
    { type: 'dsHashTable', group: 'Data Structures' },

    // Charts & Data
    { type: 'barChart', group: 'Charts' },
    { type: 'pieChart', group: 'Charts' },
    { type: 'trendUp', group: 'Charts' },
    { type: 'trendDown', group: 'Charts' },
    { type: 'funnel', group: 'Charts' },
    { type: 'gauge', group: 'Charts' },
    { type: 'table', group: 'Charts' },

    // Sketchnote / Icons
    { type: 'starPerson', group: 'Sketchnote' },
    { type: 'scroll', group: 'Sketchnote' },
    { type: 'wavyDivider', group: 'Sketchnote' },
    { type: 'doubleBanner', group: 'Sketchnote' },
    { type: 'lightbulb', group: 'Sketchnote' },
    { type: 'signpost', group: 'Sketchnote' },
    { type: 'burstBlob', group: 'Sketchnote' },
    { type: 'trophy', group: 'Sketchnote' },
    { type: 'clock', group: 'Sketchnote' },
    { type: 'gear', group: 'Sketchnote' },
    { type: 'target', group: 'Sketchnote' },
    { type: 'rocket', group: 'Sketchnote' },
    { type: 'flag', group: 'Sketchnote' },
    { type: 'key', group: 'Sketchnote' },
    { type: 'magnifyingGlass', group: 'Sketchnote' },
    { type: 'book', group: 'Sketchnote' },
    { type: 'megaphone', group: 'Sketchnote' },
    { type: 'eye', group: 'Sketchnote' },
    { type: 'thoughtBubble', group: 'Sketchnote' },
    { type: 'stickFigure', group: 'Sketchnote' },
    { type: 'sittingPerson', group: 'Sketchnote' },
    { type: 'presentingPerson', group: 'Sketchnote' },
    { type: 'handPointRight', group: 'Sketchnote' },
    { type: 'thumbsUp', group: 'Sketchnote' },
    { type: 'faceHappy', group: 'Sketchnote' },
    { type: 'faceSad', group: 'Sketchnote' },
    { type: 'faceConfused', group: 'Sketchnote' },

    // Status / Badges
    { type: 'checkbox', group: 'Status' },
    { type: 'checkboxChecked', group: 'Status' },
    { type: 'numberedBadge', group: 'Status' },
    { type: 'questionMark', group: 'Status' },
    { type: 'exclamationMark', group: 'Status' },
    { type: 'tag', group: 'Status' },
    { type: 'pin', group: 'Status' },
    { type: 'stamp', group: 'Status' },

    // Connections & Relationships
    { type: 'puzzlePiece', group: 'Connections' },
    { type: 'chainLink', group: 'Connections' },
    { type: 'bridge', group: 'Connections' },
    { type: 'magnet', group: 'Connections' },
    { type: 'scale', group: 'Connections' },
    { type: 'seedling', group: 'Connections' },
    { type: 'tree', group: 'Connections' },
    { type: 'mountain', group: 'Connections' },

    // Wireframe / UI
    { type: 'browserWindow', group: 'Wireframe' },
    { type: 'mobilePhone', group: 'Wireframe' },
    { type: 'ghostButton', group: 'Wireframe' },
    { type: 'inputField', group: 'Wireframe' },
    { type: 'solidButton', group: 'Wireframe' },
    { type: 'dropdown', group: 'Wireframe' },
    { type: 'uiCheckbox', group: 'Wireframe' },
    { type: 'radioButton', group: 'Wireframe' },
    { type: 'toggleSwitch', group: 'Wireframe' },
    { type: 'card', group: 'Wireframe' },
    { type: 'searchBar', group: 'Wireframe' },
    { type: 'progressBar', group: 'Wireframe' },
    { type: 'avatar', group: 'Wireframe' },
    { type: 'navbar', group: 'Wireframe' },
    { type: 'tabBar', group: 'Wireframe' },
    { type: 'badge', group: 'Wireframe' },
    { type: 'tooltip', group: 'Wireframe' },
    { type: 'slider', group: 'Wireframe' },
];

export const getCommands = (): Command[] => {
    const commands: Command[] = [
        // Tools
        { id: 'tool-selection', label: t('commands.tool-selection'), category: 'Tools', action: () => setSelectedTool('selection'), shortcut: 'V' },
        { id: 'tool-eraser', label: t('commands.tool-eraser'), category: 'Tools', action: () => setSelectedTool('eraser'), shortcut: 'E' },
        { id: 'tool-pan', label: t('commands.tool-pan'), category: 'Tools', action: () => setSelectedTool('pan'), shortcut: 'H' },
        { id: 'tool-lasso', label: t('commands.tool-lasso'), category: 'Tools', action: () => setSelectedTool('lasso'), shortcut: 'Shift+L' },

        // Actions
        { id: 'action-undo', label: t('commands.action-undo'), category: 'Actions', action: () => undo(), shortcut: 'Ctrl+Z' },
        { id: 'action-redo', label: t('commands.action-redo'), category: 'Actions', action: () => redo(), shortcut: 'Ctrl+Y' },
        { id: 'action-group', label: t('commands.action-group'), category: 'Actions', action: () => groupSelected(), shortcut: 'Ctrl+G' },
        { id: 'action-ungroup', label: t('commands.action-ungroup'), category: 'Actions', action: () => ungroupSelected(), shortcut: 'Ctrl+Shift+G' },
        { id: 'action-front', label: t('commands.action-front'), category: 'Actions', action: () => bringToFront(store.selection), shortcut: 'Ctrl+Shift+]' },
        { id: 'action-back', label: t('commands.action-back'), category: 'Actions', action: () => sendToBack(store.selection), shortcut: 'Ctrl+Shift+[' },
        { id: 'action-forward', label: t('commands.action-forward'), category: 'Actions', action: () => moveSelectionZIndex(store.selection, 'forward'), shortcut: 'Ctrl+]' },
        { id: 'action-backward', label: t('commands.action-backward'), category: 'Actions', action: () => moveSelectionZIndex(store.selection, 'backward'), shortcut: 'Ctrl+[' },
        { id: 'action-rasterize', label: t('commands.action-rasterize'), category: 'Actions', action: () => { void rasterizeSelection([...store.selection], { scale: 2 }); } },
        { id: 'action-rasterize-4x', label: t('commands.action-rasterize-4x'), category: 'Actions', action: () => { void rasterizeSelection([...store.selection], { scale: 4 }); } },
        { id: 'action-rasterize-copy', label: t('commands.action-rasterize-copy'), category: 'Actions', action: () => { void rasterizeSelection([...store.selection], { scale: 2, keepSource: true }); } },
        { id: 'action-delete', label: t('commands.action-delete'), category: 'Actions', action: () => deleteElements(store.selection), shortcut: 'Del' },
        { id: 'action-flip-h', label: t('commands.action-flip-h'), category: 'Actions', action: () => flipSelected('horizontal'), shortcut: 'Shift+H' },
        { id: 'action-flip-v', label: t('commands.action-flip-v'), category: 'Actions', action: () => flipSelected('vertical'), shortcut: 'Shift+V' },
        { id: 'action-outlines', label: t('commands.action-outlines'), category: 'Actions', action: () => { void convertTextToOutlines(store.selection); }, shortcut: 'Ctrl+Shift+O' },
        { id: 'effect-feather', label: t('commands.effect-feather'), category: 'Actions', action: () => applyFeather([...store.selection], 12) },
        { id: 'effect-feather-off', label: t('commands.effect-feather-off'), category: 'Actions', action: () => applyFeather([...store.selection], 0) },
        { id: 'effect-glow', label: t('commands.effect-glow'), category: 'Actions', action: () => applyGlow([...store.selection], { blur: 14 }) },
        { id: 'effect-glow-off', label: t('commands.effect-glow-off'), category: 'Actions', action: () => applyGlow([...store.selection], { enabled: false }) },
        { id: 'effect-scribble', label: t('commands.effect-scribble'), category: 'Actions', action: () => applyScribble([...store.selection], {}) },
        { id: 'panel-effects', label: t('commands.panel-effects'), category: 'View', action: () => togglePanel('effects', 'docked') },
        { id: 'panel-align', label: t('commands.panel-align'), category: 'View', action: () => togglePanel('align', 'docked') },
        { id: 'panel-arrange', label: t('commands.panel-arrange'), category: 'View', action: () => togglePanel('arrange', 'docked') },
        { id: 'panel-comic', label: t('commands.panel-comic'), category: 'View', action: () => togglePanel('comic', 'docked') },
        { id: 'panel-reset-layout', label: t('commands.panel-reset-layout'), category: 'View', action: () => resetDockLayout() },
        { id: 'effect-3d-extrude', label: t('commands.effect-3d-extrude'), category: 'Actions', action: () => setExtrude([...store.selection], { depth: 32, angle: 135 }) },
        { id: 'effect-3d-bevel', label: t('commands.effect-3d-bevel'), category: 'Actions', action: () => setExtrude([...store.selection], { depth: 40, angle: 135, bevel: 10 }) },
        { id: 'effect-3d-revolve', label: t('commands.effect-3d-revolve'), category: 'Actions', action: () => toggleRevolve([...store.selection], true) },
        { id: 'effect-transform', label: t('commands.effect-transform'), category: 'Actions', action: () => setTransformEffect([...store.selection], { copies: 12, rotate: 24, scaleX: 0.9, scaleY: 0.9 }) },
        { id: 'action-swap-fill-stroke', label: t('commands.action-swap-fill-stroke'), category: 'Actions', action: () => swapFillStroke(), shortcut: 'Shift+X' },
        { id: 'action-clean-up', label: t('commands.action-clean-up'), category: 'Actions', action: () => cleanUpElements() },
        { id: 'action-paste-all-artboards', label: t('commands.action-paste-all-artboards'), category: 'Actions', action: () => pasteOnAllArtboards() },
        { id: 'action-duplicate-artboard', label: t('commands.action-duplicate-artboard'), category: 'Actions', action: () => duplicateArtboard() },
        { id: 'action-fit-artboard', label: t('commands.action-fit-artboard'), category: 'Actions', action: () => fitArtboardToArtwork() },
        { id: 'action-shuffle-colors', label: t('commands.action-shuffle-colors'), category: 'Actions', action: () => shuffleSelectionColors() },
        // Illustrator effects (tier 1)
        { id: 'fx-convert-rect', label: t('commands.fx-convert-rect'), category: 'Actions', action: () => convertToShape([...store.selection], 'rectangle') },
        { id: 'fx-convert-rounded', label: t('commands.fx-convert-rounded'), category: 'Actions', action: () => convertToShape([...store.selection], 'rounded') },
        { id: 'fx-convert-ellipse', label: t('commands.fx-convert-ellipse'), category: 'Actions', action: () => convertToShape([...store.selection], 'ellipse') },
        { id: 'fx-split-grid', label: t('commands.fx-split-grid'), category: 'Actions', action: () => splitIntoGrid(store.selection[0], 4, 4, 0) },
        { id: 'fx-to-guides', label: t('commands.fx-to-guides'), category: 'Actions', action: () => convertToGuides() },
        { id: 'fx-crop-marks', label: t('commands.fx-crop-marks'), category: 'Actions', action: () => toggleObjectCropMarks() },
        { id: 'action-del-unused-swatches', label: t('commands.action-del-unused-swatches'), category: 'Actions', action: () => deleteUnusedSwatches() },

        // Illustrator-class tools (also on the right-click menu / panels)
        { id: 'tool-live-paint', label: t('commands.tool-live-paint'), category: 'Tools', action: () => { makeLivePaint([...store.selection]); toggleLivePaint(true); } },
        { id: 'action-live-paint-release', label: t('commands.action-live-paint-release'), category: 'Actions', action: () => { const g = store.elements.find(e => e.livePaintGroupId)?.livePaintGroupId; if (g) releaseLivePaint(g); } },
        { id: 'tool-shape-builder', label: t('commands.tool-shape-builder'), category: 'Tools', action: () => toggleShapeBuilder(true) },
        { id: 'tool-pathfinder-bar', label: t('commands.tool-pathfinder-bar'), category: 'Tools', action: () => togglePathfinderBar() },
        { id: 'width-profile-uniform', label: t('commands.width-profile-uniform'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'uniform') },
        { id: 'width-profile-bulge', label: t('commands.width-profile-bulge'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'bulge') },
        { id: 'width-profile-waist', label: t('commands.width-profile-waist'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'waist') },
        { id: 'width-profile-taper-out', label: t('commands.width-profile-taper-out'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'taper-out') },
        { id: 'width-profile-taper-in', label: t('commands.width-profile-taper-in'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'taper-in') },
        { id: 'width-profile-chisel', label: t('commands.width-profile-chisel'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'chisel') },
        { id: 'width-profile-oval', label: t('commands.width-profile-oval'), category: 'Tools', action: () => setWidthProfilePreset([...store.selection], 'oval') },
        { id: 'tool-magic-wand', label: t('commands.tool-magic-wand'), category: 'Tools', action: () => selectSimilar() },
        { id: 'select-same-fill', label: t('commands.select-same-fill'), category: 'Tools', action: () => selectSimilar(undefined, 'fill') },
        { id: 'select-same-stroke', label: t('commands.select-same-stroke'), category: 'Tools', action: () => selectSimilar(undefined, 'stroke') },
        { id: 'select-same-font', label: t('commands.select-same-font'), category: 'Tools', action: () => selectSimilar(undefined, 'fontFamily') },
        { id: 'select-same-fontsize', label: t('commands.select-same-fontsize'), category: 'Tools', action: () => selectSimilar(undefined, 'fontSize') },
        { id: 'select-same-opacity', label: t('commands.select-same-opacity'), category: 'Tools', action: () => selectSimilar(undefined, 'opacity') },
        { id: 'select-same-strokeweight', label: t('commands.select-same-strokeweight'), category: 'Tools', action: () => selectSimilar(undefined, 'strokeWidth') },
        { id: 'select-same-type', label: t('commands.select-same-type'), category: 'Tools', action: () => selectSimilar(undefined, 'type') },
        { id: 'tool-knife', label: t('commands.tool-knife'), category: 'Tools', action: () => toggleCutTool(true) },
        { id: 'tool-width', label: t('commands.tool-width'), category: 'Tools', action: () => toggleWidthTool(true) },
        { id: 'action-width-reset', label: t('commands.action-width-reset'), category: 'Actions', action: () => clearWidthProfile([...store.selection]) },
        { id: 'tool-symbol-sprayer', label: t('commands.tool-symbol-sprayer'), category: 'Tools', action: () => toggleSymbolSprayer() },
        { id: 'tool-curvature', label: t('commands.tool-curvature'), category: 'Tools', action: () => toggleCurveTool(true) },
        { id: 'tool-reshape', label: t('commands.tool-reshape'), category: 'Tools', action: () => toggleReshapeTool(true) },
        { id: 'tool-blob-brush', label: t('commands.tool-blob-brush'), category: 'Tools', action: () => toggleBlobBrush(true) },
        { id: 'tool-path-eraser', label: t('commands.tool-path-eraser'), category: 'Tools', action: () => togglePathEraser(true) },
        { id: 'tool-puppet-warp', label: t('commands.tool-puppet-warp'), category: 'Tools', action: () => togglePuppetWarp(true) },
        { id: 'tool-perspective-grid', label: t('commands.tool-perspective-grid'), category: 'Tools', action: () => togglePerspectiveGrid(true) },
        { id: 'tool-slice', label: t('commands.tool-slice'), category: 'Tools', action: () => toggleSliceTool(true) },
        { id: 'tool-symbolism', label: t('commands.tool-symbolism'), category: 'Tools', action: () => toggleSymbolism(true) },
        { id: 'panel-vector-tools', label: t('commands.panel-vector-tools'), category: 'View', action: () => toggleVectorToolsPanel() },
        { id: 'tool-touch-type', label: t('commands.tool-touch-type'), category: 'Tools', action: () => toggleTouchType(true) },
        { id: 'action-vertical-type', label: t('commands.action-vertical-type'), category: 'Actions', action: () => { const id = store.selection[0]; if (id) setTextVertical(id); } },
        { id: 'action-distort-pucker', label: t('commands.action-distort-pucker'), category: 'Actions', action: () => applyDistort([...store.selection], 'pucker', 0.25) },
        { id: 'action-distort-bloat', label: t('commands.action-distort-bloat'), category: 'Actions', action: () => applyDistort([...store.selection], 'bloat', 0.25) },
        { id: 'action-distort-twirl', label: t('commands.action-distort-twirl'), category: 'Actions', action: () => applyDistort([...store.selection], 'twirl', 0.25) },
        { id: 'action-distort-zigzag', label: t('commands.action-distort-zigzag'), category: 'Actions', action: () => applyDistort([...store.selection], 'zigzag', 0.12) },
        { id: 'action-distort-crystallize', label: t('commands.action-distort-crystallize'), category: 'Actions', action: () => applyDistort([...store.selection], 'crystallize', 0.18) },
        { id: 'action-distort-roughen', label: t('commands.action-distort-roughen'), category: 'Actions', action: () => applyDistort([...store.selection], 'roughen', 0.1) },
        { id: 'action-mirror-h', label: t('commands.action-mirror-h'), category: 'Actions', action: () => mirrorCopy('horizontal') },
        { id: 'action-mirror-v', label: t('commands.action-mirror-v'), category: 'Actions', action: () => mirrorCopy('vertical') },
        { id: 'action-repeat', label: t('commands.action-repeat'), category: 'Actions', action: () => openRepeatDialog() },
        { id: 'insert-mandala', label: t('commands.insert-mandala'), category: 'Tools', action: () => openMandalaDialog() },
        { id: 'action-symmetry-toggle', label: t('commands.action-symmetry-toggle'), category: 'Actions', shortcut: 'Alt+Y', action: () => {
            const s = store.viewState;
            const c = canvasCenterClient(); // drawing-area centre, not window centre
            const cx = (c.x - s.panX) / s.scale;
            const cy = (c.y - s.panY) / s.scale;
            if (store.symmetry.mode === 'off') setSymmetryCenter(cx, cy);
            toggleSymmetry();
        } },
        { id: 'action-symmetry-vertical', label: t('commands.action-symmetry-vertical'), category: 'Actions', action: () => toggleSymmetryAxis('vertical') },
        { id: 'action-symmetry-horizontal', label: t('commands.action-symmetry-horizontal'), category: 'Actions', action: () => toggleSymmetryAxis('horizontal') },
        { id: 'action-symmetry-radial', label: t('commands.action-symmetry-radial'), category: 'Actions', action: () => setSymmetryMode('radial') },
        { id: 'action-symmetry-kaleidoscope', label: t('commands.action-symmetry-kaleidoscope'), category: 'Actions', action: () => setSymmetryMode('kaleidoscope') },
        { id: 'action-symmetry-off', label: t('commands.action-symmetry-off'), category: 'Actions', action: () => setSymmetryMode('off') },
        { id: 'action-symmetry-move', label: t('commands.action-symmetry-move'), category: 'Actions', shortcut: 'Alt+Shift+Y', action: () => toggleSymmetryEditing() },
        { id: 'action-symmetry-mirror', label: t('commands.action-symmetry-mirror'), category: 'Actions', action: () => mirrorAcrossSymmetry() },
        { id: 'action-transform-again', label: t('commands.action-transform-again'), category: 'Actions', action: () => transformAgain(), shortcut: 'Ctrl+Shift+D' },
        { id: 'action-lock', label: t('commands.action-lock'), category: 'Actions', action: () => {
            const isLocked = store.selection.some(id => store.elements.find(e => e.id === id)?.locked);
            lockSelected(!isLocked);
        }, shortcut: 'Ctrl+Shift+L' },
        // Lock/Unlock above acts on the selection, and a locked object can never be in it —
        // so this is the only command that can free one. Illustrator's Object ▸ Unlock All.
        { id: 'action-unlock-all', label: t('commands.action-unlock-all'), category: 'Actions', action: () => {
            const n = unlockAllElements();
            showToast(n ? `Unlocked ${n} object${n === 1 ? '' : 's'}` : 'Nothing is locked', n ? 'success' : 'info');
        }, shortcut: 'Ctrl+Alt+2' },

        // View
        { id: 'view-grid', label: t('commands.view-grid'), category: 'View', action: () => toggleGrid(), shortcut: 'Shift+\'' },
        { id: 'grid-style-lines', label: t('commands.grid-style-lines'), category: 'View', action: () => setGridStyle('lines') },
        { id: 'grid-style-dots', label: t('commands.grid-style-dots'), category: 'View', action: () => setGridStyle('dots') },
        { id: 'grid-style-diagonal', label: t('commands.grid-style-diagonal'), category: 'View', action: () => setGridStyle('diagonal') },
        { id: 'grid-style-isometric', label: t('commands.grid-style-isometric'), category: 'View', action: () => setGridStyle('isometric') },
        { id: 'view-snap', label: t('commands.view-snap'), category: 'View', action: () => toggleSnapToGrid(), shortcut: 'Shift+;' },
        { id: 'view-zen', label: t('commands.view-zen'), category: 'View', action: () => toggleZenMode(), shortcut: 'Alt+Z' },
        { id: 'view-outline', label: t('commands.view-outline'), category: 'View', action: () => toggleOutlineView() },
        { id: 'view-trim', label: t('commands.view-trim'), category: 'View', action: () => toggleTrimView() },
        { id: 'view-smart-shape', label: t('commands.view-smart-shape'), category: 'View', action: () => updateGlobalSettings({ smartShape: store.globalSettings.smartShape === false }), shortcut: 'Shift+Q' },
        { id: 'view-pen-pressure', label: t('commands.view-pen-pressure'), category: 'View', action: () => updateGlobalSettings({ penPressure: store.globalSettings.penPressure === false }) },
        { id: 'view-pen-stabilization', label: t('commands.view-pen-stabilization'), category: 'View', action: () => togglePenStabilization(), shortcut: 'Shift+S' },
        { id: 'view-properties', label: t('commands.view-properties'), category: 'View', action: () => togglePropertyPanel(), shortcut: 'Alt+Enter' },
        { id: 'view-elements', label: t('commands.view-elements'), category: 'View', action: () => toggleElementsPanel(), shortcut: 'Alt+E' },
        { id: 'view-layers', label: t('commands.view-layers'), category: 'View', action: () => toggleLayerPanel(), shortcut: 'Alt+L' },
        { id: 'view-minimap', label: t('commands.view-minimap'), category: 'View', action: () => toggleMinimap(), shortcut: 'Alt+M' },
        { id: 'view-rulers', label: t('commands.view-rulers'), category: 'View', action: () => toggleRulers(), shortcut: 'Alt+R' },
        { id: 'view-clear-guides', label: t('commands.view-clear-guides'), category: 'View', action: () => clearGuides() },
        { id: 'view-select-all-guides', label: t('commands.view-select-all-guides'), category: 'View', action: () => selectAllGuides(), shortcut: 'Ctrl+Shift+A' },
        { id: 'view-delete-selected-guides', label: t('commands.view-delete-selected-guides'), category: 'View', action: () => { const n = removeSelectedGuides(); showToast(n ? `Deleted ${n} guide${n === 1 ? '' : 's'}` : 'No guides selected', n ? 'success' : 'info'); } },
        { id: 'view-lock-guides', label: t('commands.view-lock-guides'), category: 'View', action: () => { toggleGuidesLocked(); showToast(store.guidesLocked ? 'Guides locked' : 'Guides unlocked', 'info'); } },
        // Illustrator calls this Direct Selection, Inkscape calls it the Node tool — both
        // names are in the label so either search term finds it. Exclusive activation,
        // same as the Vector Tools palette button it mirrors.
        {
            id: 'view-node-tool',
            label: t('commands.view-node-tool'),
            category: 'View',
            action: () => {
                const was = store.nodeToolActive;
                exitAllToolModes();
                if (!was) toggleNodeTool(true);
            },
            shortcut: 'N',
        },
        { id: 'view-zoom-in', label: t('commands.view-zoom-in'), category: 'View', action: () => {
            const s = store.viewState;
            const newScale = Math.min(s.scale * 1.1, 10);
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
            setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
        }, shortcut: 'Ctrl+=' },
        { id: 'view-zoom-out', label: t('commands.view-zoom-out'), category: 'View', action: () => {
            const s = store.viewState;
            const newScale = Math.max(s.scale * 0.9, 0.1);
            const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
            const wx = (cx - s.panX) / s.scale, wy = (cy - s.panY) / s.scale;
            setViewState({ scale: newScale, panX: cx - wx * newScale, panY: cy - wy * newScale });
        }, shortcut: 'Ctrl+-' },
        { id: 'view-zoom-reset', label: t('commands.view-zoom-reset'), category: 'View', action: () => setViewState({ scale: 1 }), shortcut: 'Ctrl+0' },
        { id: 'view-zoom-fit', label: t('commands.view-zoom-fit'), category: 'View', action: () => zoomToFit(), shortcut: 'Ctrl+1' },
        { id: 'view-zoom-selection', label: t('commands.view-zoom-selection'), category: 'View', action: () => zoomToSelection(), shortcut: 'Ctrl+2' },
        { id: 'view-theme', label: t('commands.view-theme'), category: 'View', action: () => toggleTheme() },
        { id: 'view-present-start', label: t('commands.view-present-start'), category: 'View', action: () => togglePresentationMode(true, 0), shortcut: 'F5' },
        { id: 'view-present-current', label: t('commands.view-present-current'), category: 'View', action: () => togglePresentationMode(true), shortcut: 'Shift+F5' },

        // File
        {
            id: 'file-new', label: t('commands.file-new'), category: 'File', action: () => {
                if (confirm(t('dialogs.newSketchConfirm'))) {
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
        { id: 'action-add-layer', label: t('commands.action-add-layer'), category: 'Layers', action: () => addLayer(), shortcut: 'Ctrl+Shift+N' },

        // DSL Import
        { id: 'file-import-dsl', label: t('commands.file-import-dsl'), category: 'File', action: () => setIsDSLImportOpen(true), shortcut: 'Ctrl+Shift+I' },
        { id: 'file-save-gallery', label: t('commands.file-save-gallery'), category: 'File', action: () => { void quickSaveToGallery(); }, shortcut: 'Ctrl+S' },
        { id: 'file-open-gallery', label: t('commands.file-open-gallery'), category: 'File', action: () => setShowDrawingsGallery(true) },
    ];

    // Register all shapes/tools from catalog
    for (const tool of shapeToolCatalog) {
        commands.push({
            id: `shape-${tool.type}`,
            label: t(`shapes.${tool.type}`),
            category: 'Shapes',
            action: () => setSelectedTool(tool.type),
        });
    }

    // Dynamic Layer Commands
    store.layers.forEach(layer => {
        commands.push({
            id: `layer-${layer.id}`,
            label: t('commands.layer-activate', { name: layer.name }),
            category: 'Layers',
            action: () => setActiveLayer(layer.id)
        });
    });

    // Only offered when a support link is actually configured, so the palette never
    // surfaces a command that opens nothing (openSupport() is a no-op in that case).
    if (hasSupportLinks()) {
        commands.push({
            id: 'action-support',
            label: t('commands.action-support'),
            category: 'Actions',
            action: () => openSupport(),
        });
    }

    commands.push({
        id: 'action-about',
        label: t('commands.action-about'),
        category: 'Actions',
        action: () => openAbout(),
    });

    return commands;
};

/**
 * Fold a string for searching: lower-case, strip accents, unify apostrophes.
 *
 * A palette that only lower-cases is searchable in English and awkward in every
 * other language we ship. Two things get in the way, and both are about what the
 * user's KEYBOARD produces versus what the label contains:
 *
 *  - **Accents.** Typing `elements` should find *Éléments*, and `etoile` should
 *    find *Étoile*. Decomposing to NFD and dropping the combining marks makes
 *    the accented and unaccented spellings the same string.
 *  - **Apostrophes.** French labels use the typographic apostrophe U+2019
 *    (*Zone d’exportation*), which is correct French — but a French keyboard
 *    types the straight U+0027, so the two never met. U+02BC is folded too: it
 *    is a LETTER that looks identical, and it is easy to introduce by accident.
 *
 * Strictly widening: both sides are folded, so every match that worked before
 * still works and only new ones are added.
 */
const foldForSearch = (s: string): string =>
    s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\u2018\u2019\u02bc\u00b4`]/g, "'");

// Helper for fuzzy search or prefix search
export const searchCommands = (query: string, categoryFilter?: string): Command[] => {
    let all = getCommands();
    if (categoryFilter) {
        all = all.filter(c => c.category === categoryFilter);
    }

    if (!query) return all.slice(0, categoryFilter ? 20 : 10); // Show more for filtered views

    const q = foldForSearch(query);
    return all.filter(c =>
        foldForSearch(c.label).includes(q) ||
        // Both the raw category id and its translated heading: the id keeps
        // English search terms working in every locale (useful for anyone
        // following English documentation), the translation is what the user
        // actually sees in the list and so is what they will type.
        foldForSearch(c.category).includes(q) ||
        foldForSearch(t(`commandCategory.${c.category}`)).includes(q) ||
        foldForSearch(c.id).includes(q)
    ).sort((a, b) => {
        // Boost exact matches or prefix matches
        const aLabel = foldForSearch(a.label);
        const bLabel = foldForSearch(b.label);
        if (aLabel.startsWith(q) && !bLabel.startsWith(q)) return -1;
        if (!aLabel.startsWith(q) && bLabel.startsWith(q)) return 1;
        return aLabel.localeCompare(bLabel);
    });
};
