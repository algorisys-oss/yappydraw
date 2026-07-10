/**
 * Context Menu Builder
 * Pure function that builds context menu items based on current selection state.
 * Extracted from canvas.tsx getContextMenuItems().
 */

import type { DrawingElement, TableCellSelection } from '../types';
import { isPagedDocType } from '../types/slide-types';
import type { MenuItem } from '../components/context-menu';
import { WARP_PRESETS } from './envelope-warp';
import {
    store, setStore, pushToHistory, updateElement, selectAll,
    duplicateElement, groupSelected, ungroupSelected, makeClippingMask, makeOpacityMask, releaseClippingMask, createSymbol, createPatternFromSelection, detachInstance, enterSymbolEdit, startEyedropper, createGraphicStyle, addArtboard, deleteArtboard,
    blendShapes, blendAlongPath, blendShapesMorph,
    toggleRecolorPanel, toggleBehaviorsPanel,
    toggleShapeBuilder,
    toggleCutTool,
    toggleLivePaint,
    makeLivePaint,
    toggleWidthTool,
    clearWidthProfile,
    selectSimilar,
    applyDistort,
    addAppearanceFill, addAppearanceStroke, clearAppearance, applyMeshGradient, clearMeshGradient, traceImage,
    mirrorCopy, transformAgain, mirrorAcrossSymmetry, setTransformEffect, expandTransformEffect, clearTransformEffect, setExtrude, clearExtrude, expandExtrude,
    bringToFront, sendToBack, moveElementZIndex,
    toggleGrid, toggleSnapToGrid, toggleZenMode,
    setViewState, setShowCanvasProperties, deleteElements,
    togglePropertyPanel, toggleCollapse, setParent, clearParent,
    addChildNode, addSiblingNode, reorderMindmap, applyMindmapStyling, applyPathfinder, applyPathfinderRegion, convertToPath, convertTextToOutlines, outlineStroke, offsetPath, simplifyPath, smoothPath, makeCompoundPath, releaseCompoundPath, joinPaths, toggleEnvelopeWarp, applyMeshWarp, applyWarpPreset, envelopeWithTopObject, toggleMeshSmooth, bakeWarp,
    zoomToFit, zoomToFitSlide, updateGlobalSettings, detachSlideBackgroundImage, updateSlideBackground,
    toggleVideoPlayback, isVideoPlaying, bumpDirtyRevision
} from '../store/app-store';
import {
    copyToClipboard, cutToClipboard, pasteFromClipboard,
    copyStyle, pasteStyle, lockSelected, flipSelected
} from './object-context-actions';
import {
    getTransformOptions, getShapeIcon, getShapeTooltip,
    changeElementType, getCurveTypeOptions, getCurveTypeIcon, getCurveTypeTooltip
} from './element-transforms';
import { shiftLaneIndicesOnRemove, hitTestPoolLane } from './pool-containment';
import { setTransformPivot, clearTransformPivot, getCustomPivot } from './transform-pivot';
import { openRepeatDialog } from '../components/repeat-dialog';
import { YappyAPI } from '../api';
import { exportToPng, exportToSvg, exportToJpg, copyCanvasAsPng, exportArtboard } from './export';
import { shapeToPath } from './shape-to-path';
import {
    computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData,
    hitTestTableCell, insertTableRow, deleteTableRow, insertTableColumn, deleteTableColumn,
    deleteTableColumns, getFullColumnSelection,
    tableDataToTSV, parseClipboardTableData,
    getMergedCellAt, mergeCells, unmergeCells, normalizeCellSelection, isMultiCellSelection,
    setCellFormatRange, setBorderForRange, currencySymbols, datePatterns,
    adjustMergedCellsOnColDelete,
    type MergedCellRegion
} from './table-utils';
import type { TableCellFormat, TableCellBorder, TableBorderStyle } from '../types';

// Shape type categories for "Select by Type" menu
const LINEAR_TYPES = ['line', 'arrow'];
const TEXT_TYPES = ['text', 'richtext', 'stickyNote'];
const IMAGE_TYPES = ['image'];
const VIDEO_TYPES = ['video'];

const TYPE_CATEGORIES: { label: string; types: string[] }[] = [
    { label: 'Lines & Arrows', types: LINEAR_TYPES },
    { label: 'Text & Notes', types: TEXT_TYPES },
    { label: 'Images', types: IMAGE_TYPES },
    { label: 'Videos', types: VIDEO_TYPES },
];

function buildSelectByTypeMenu(): MenuItem[] {
    const items: MenuItem[] = [];

    // Category-based selections
    for (const cat of TYPE_CATEGORIES) {
        const matching = store.elements.filter(e => cat.types.includes(e.type));
        if (matching.length > 0) {
            items.push({
                label: `All ${cat.label} (${matching.length})`,
                onClick: () => setStore('selection', matching.map(e => e.id))
            });
        }
    }

    // "All Shapes" — everything that's NOT linear, text, image, video
    const specialTypes = new Set([...LINEAR_TYPES, ...TEXT_TYPES, ...IMAGE_TYPES, ...VIDEO_TYPES]);
    const shapes = store.elements.filter(e => !specialTypes.has(e.type));
    if (shapes.length > 0) {
        items.push({
            label: `All Shapes (${shapes.length})`,
            onClick: () => setStore('selection', shapes.map(e => e.id))
        });
    }

    if (items.length > 0) items.push({ separator: true });

    // Dynamic: list each unique type present on canvas
    const typeCounts: Record<string, string[]> = {};
    store.elements.forEach(e => {
        if (!typeCounts[e.type]) typeCounts[e.type] = [];
        typeCounts[e.type].push(e.id);
    });

    const sorted = Object.entries(typeCounts).sort((a, b) => b[1].length - a[1].length);
    for (const [type, ids] of sorted) {
        if (ids.length > 0) {
            items.push({
                label: `${type} (${ids.length})`,
                onClick: () => setStore('selection', [...ids])
            });
        }
    }

    // "Same as Selected" — select all elements of the same type(s) as current selection
    if (store.selection.length > 0) {
        const selectedTypes = new Set(
            store.selection
                .map(id => store.elements.find(e => e.id === id)?.type)
                .filter(Boolean) as string[]
        );
        if (selectedTypes.size > 0) {
            const matching = store.elements.filter(e => selectedTypes.has(e.type));
            if (matching.length > store.selection.length) {
                items.unshift({
                    label: `All Same Type (${matching.length})`,
                    onClick: () => setStore('selection', matching.map(e => e.id))
                });
                items.splice(1, 0, { separator: true });
            }
        }
    }

    return items;
}

// Properties to match against for "Select by Same Property"
const MATCHABLE_PROPERTIES: { key: string; label: string; format?: (v: any) => string }[] = [
    { key: 'backgroundColor', label: 'Fill Color', format: v => v || 'transparent' },
    { key: 'strokeColor', label: 'Stroke Color' },
    { key: 'textColor', label: 'Text Color' },
    { key: 'strokeWidth', label: 'Stroke Width', format: v => `${v}px` },
    { key: 'fontSize', label: 'Font Size', format: v => `${v}px` },
    { key: 'fontFamily', label: 'Font Family' },
    { key: 'opacity', label: 'Opacity', format: v => `${Math.round((v ?? 1) * 100)}%` },
    { key: 'fillStyle', label: 'Fill Style' },
    { key: 'strokeStyle', label: 'Stroke Style' },
    { key: 'renderStyle', label: 'Drawing Style' },
];

function buildSelectBySamePropertyMenu(): MenuItem[] {
    if (store.selection.length !== 1) return [];
    const el = store.elements.find(e => e.id === store.selection[0]);
    if (!el) return [];

    const items: MenuItem[] = [];

    for (const prop of MATCHABLE_PROPERTIES) {
        const val = (el as any)[prop.key];
        if (val === undefined && prop.key !== 'backgroundColor') continue;

        const matching = store.elements.filter(e => {
            const v = (e as any)[prop.key];
            if (val == null && v == null) return true;
            return v === val;
        });

        // Only show if there are other elements with the same value
        if (matching.length > 1) {
            const displayVal = prop.format ? prop.format(val) : String(val ?? 'none');
            items.push({
                label: `Same ${prop.label}: ${displayVal} (${matching.length})`,
                onClick: () => setStore('selection', matching.map(e => e.id))
            });
        }
    }

    return items;
}

export function getContextMenuItems(
    redrawFn: () => void,
    worldX?: number,
    worldY?: number,
    cellSelection?: TableCellSelection | null,
    onClearCellSelection?: () => void
): MenuItem[] {
    const selectionCount = store.selection.length;
    const hasSelection = selectionCount > 0;
    const items: MenuItem[] = [];

    // In presentation mode, show interactive menu: Open Link, Hierarchy, Transforms
    if (store.appMode === 'presentation') {
        if (hasSelection) {
            const firstId = store.selection[0];
            const firstEl = store.elements.find(e => e.id === firstId);

            // Open Link (single selection only)
            if (selectionCount === 1 && firstEl?.link) {
                items.push({
                    label: 'Open Link',
                    onClick: () => window.open(firstEl.link!, '_blank', 'noopener')
                });
            }

            // Hierarchy submenu
            if (firstEl) {
                const hierarchyItems: MenuItem[] = [];

                if (selectionCount === 1) {
                    hierarchyItems.push({ label: 'Add Child', onClick: () => addChildNode(firstId) });
                    if (firstEl.parentId) {
                        hierarchyItems.push({ label: 'Add Sibling', onClick: () => addSiblingNode(firstId) });
                    }
                    hierarchyItems.push({ separator: true });
                }

                if (firstEl.parentId) {
                    hierarchyItems.push({ label: 'Clear Parent', onClick: () => clearParent(firstId) });
                }

                const hasChildren = store.elements.some(e => e.parentId === firstId);
                if (hasChildren) {
                    hierarchyItems.push({
                        label: firstEl.isCollapsed ? 'Expand Subtree' : 'Collapse Subtree',
                        onClick: () => toggleCollapse(firstId)
                    });
                }

                if (selectionCount === 2) {
                    const childId = store.selection[0];
                    const parentId = store.selection[1];
                    hierarchyItems.push({
                        label: 'Set as Child of Selected',
                        onClick: () => setParent(childId, parentId)
                    });
                }

                const autoLayoutItems: MenuItem[] = [
                    { label: 'Balanced', icon: '🌐', onClick: () => reorderMindmap(firstId, 'balanced') },
                    { label: 'Horizontal (Right)', icon: '➡️', onClick: () => reorderMindmap(firstId, 'horizontal-right') },
                    { label: 'Horizontal (Left)', icon: '⬅️', onClick: () => reorderMindmap(firstId, 'horizontal-left') },
                    { label: 'Vertical (Down)', icon: '⬇️', onClick: () => reorderMindmap(firstId, 'vertical-down') },
                    { label: 'Vertical (Up)', icon: '⬆️', onClick: () => reorderMindmap(firstId, 'vertical-up') },
                    { label: 'Radial (Neuron)', icon: '🕸️', onClick: () => reorderMindmap(firstId, 'radial') },
                ];
                hierarchyItems.push({ separator: true });
                hierarchyItems.push({ label: 'Auto Layout', submenu: autoLayoutItems, icon: '🪄' });
                hierarchyItems.push({ label: 'Auto Style Branch', icon: '🎨', onClick: () => applyMindmapStyling(firstId) });

                if (hierarchyItems.length > 0) {
                    if (items.length > 0) items.push({ separator: true });
                    items.push({ label: 'Hierarchy', submenu: hierarchyItems });
                }
            }

            // Transform options
            const allSelectedElements = store.selection.map(id => store.elements.find(e => e.id === id)).filter(Boolean) as DrawingElement[];
            const isPolylineShapeEl = (el: DrawingElement) =>
                el.type === 'line' && el.curveType === 'elbow' && !el.startBinding && !el.endBinding;

            const shapesInSelection = allSelectedElements.filter(el => {
                if (isPolylineShapeEl(el)) return true;
                const type = el.type;
                return type !== 'line' && type !== 'arrow' && type !== 'bezier' && type !== 'organicBranch' && type !== 'text' && type !== 'image' && type !== 'video';
            });

            const connectorsInSelection = allSelectedElements.filter(el => {
                if (isPolylineShapeEl(el)) return false;
                const type = el.type;
                return type === 'line' || type === 'arrow' || type === 'bezier' || type === 'organicBranch';
            });

            if (shapesInSelection.length > 0) {
                const firstShapeEl = shapesInSelection[0];
                const transformOptions = getTransformOptions(firstShapeEl.type, isPolylineShapeEl(firstShapeEl));
                if (transformOptions.length > 0) {
                    items.push({
                        label: shapesInSelection.length > 1 ? `Transform ${shapesInSelection.length} Shapes` : 'Transform Shape',
                        submenu: transformOptions.map(t => ({
                            icon: getShapeIcon(t),
                            tooltip: getShapeTooltip(t),
                            onClick: () => {
                                pushToHistory();
                                shapesInSelection.forEach(el => changeElementType(el.id, t, false));
                                requestAnimationFrame(redrawFn);
                            }
                        })),
                        gridColumns: 3
                    });
                }
            }

            if (connectorsInSelection.length > 0) {
                const transformOptions = getTransformOptions(connectorsInSelection[0].type);
                if (transformOptions.length > 0) {
                    items.push({
                        label: connectorsInSelection.length > 1 ? `Transform ${connectorsInSelection.length} Connectors` : 'Transform Connector',
                        submenu: transformOptions.map(t => ({
                            icon: getShapeIcon(t),
                            tooltip: getShapeTooltip(t),
                            onClick: () => {
                                pushToHistory();
                                connectorsInSelection.forEach(el => changeElementType(el.id, t, false));
                                requestAnimationFrame(redrawFn);
                            }
                        })),
                        gridColumns: 3
                    });
                }
            }
        }

        // Show/Hide Shape Toolbar (root level)
        if (items.length > 0) items.push({ separator: true });
        items.push({
            label: store.globalSettings.showQuickToolbar ? 'Hide Shape Toolbar' : 'Show Shape Toolbar',
            onClick: () => updateGlobalSettings({ showQuickToolbar: !store.globalSettings.showQuickToolbar })
        });

        return items;
    }

    if (hasSelection) {
        items.push(
            { label: 'Copy', shortcut: 'Ctrl+C', onClick: copyToClipboard },
            { label: 'Paste', shortcut: 'Ctrl+V', onClick: pasteFromClipboard },
            { label: 'Cut', shortcut: 'Ctrl+X', onClick: cutToClipboard },
            { label: 'Duplicate', shortcut: 'Ctrl+D', onClick: () => store.selection.forEach(id => duplicateElement(id)) },
            { label: 'Select all', shortcut: 'Ctrl+A', onClick: selectAll },
            { separator: true }
        );

        // Convert to editable vector path (shown when a selected shape can be converted).
        const convertible = store.selection.some(id => {
            const e = store.elements.find(x => x.id === id);
            return e && e.type !== 'path' && !!shapeToPath(e);
        });
        const hasPathish = convertible || store.selection.some(id => store.elements.find(x => x.id === id)?.type === 'path');
        if (convertible || hasPathish) {
            const pathOps: MenuItem[] = [];
            if (convertible) pathOps.push({ label: 'Convert to Path', icon: '✎', onClick: () => convertToPath([...store.selection]) });
            if (store.selection.some(id => store.elements.find(x => x.id === id)?.type === 'text')) {
                pathOps.push({ label: 'Create Outlines (text → vector)', icon: '🆎', shortcut: 'Ctrl+Shift+O', onClick: () => { void convertTextToOutlines([...store.selection]); } });
            }
            if (hasPathish) pathOps.push(
                { label: 'Outline Stroke', icon: '▱', onClick: () => outlineStroke([...store.selection]) },
                { label: 'Offset Path (+10)', icon: '⊕', onClick: () => offsetPath([...store.selection], 10) },
                { label: 'Offset Path (−10)', icon: '⊖', onClick: () => offsetPath([...store.selection], -10) },
            );
            // Simplify on a selected path; compound-path ops on multi-select / compound paths.
            const selPaths = store.selection.map(id => store.elements.find(x => x.id === id)).filter((e): e is DrawingElement => !!e && e.type === 'path');
            if (selPaths.length >= 1) pathOps.push({ label: 'Simplify', icon: '⌇', onClick: () => simplifyPath([...store.selection]) });
            if (selPaths.length >= 1) pathOps.push({ label: 'Smooth', icon: '∿', onClick: () => smoothPath([...store.selection]) });
            // Join: 2+ selected paths that have at least one open subpath between them.
            const openPathCount = selPaths.filter(e => e.pathSubpaths ? e.pathSubpaths.some(sp => !sp.closed) : !e.pathClosed).length;
            if (openPathCount >= 2) pathOps.push({ label: 'Join Paths', icon: '⌒', onClick: () => joinPaths([...store.selection]) });
            if (store.selection.length >= 2) pathOps.push({ label: 'Make Compound Path', icon: '◎', onClick: () => makeCompoundPath([...store.selection]) });
            if (selPaths.some(e => (e.pathSubpaths?.length ?? 0) > 1)) pathOps.push({ label: 'Release Compound Path', icon: '⊟', onClick: () => releaseCompoundPath([...store.selection]) });
            // Envelope Distort — toggle a 4-corner free-distort (drag the orange corners).
            const anyWarped = store.selection.some(id => !!store.elements.find(x => x.id === id)?.warp);
            pathOps.push({ label: anyWarped ? 'Remove Envelope Distort' : 'Envelope Distort', icon: '◰', onClick: () => toggleEnvelopeWarp([...store.selection]) });
            pathOps.push({
                label: 'Mesh Warp', icon: '▦', submenu: [
                    { label: '2 × 2', onClick: () => applyMeshWarp([...store.selection], 2, 2) },
                    { label: '3 × 3', onClick: () => applyMeshWarp([...store.selection], 3, 3) },
                    { label: '4 × 4', onClick: () => applyMeshWarp([...store.selection], 4, 4) },
                    { label: '5 × 5', onClick: () => applyMeshWarp([...store.selection], 5, 5) },
                ]
            });
            pathOps.push({
                label: 'Warp Preset', icon: '〜', submenu: WARP_PRESETS.map(w => (
                    { label: w.label, onClick: () => applyWarpPreset([...store.selection], w.id, 0.5) }
                ))
            });
            if (anyWarped) {
                const anySmooth = store.selection.some(id => store.elements.find(x => x.id === id)?.warp?.smooth);
                pathOps.push({ label: anySmooth ? 'Mesh: Sharp (bilinear)' : 'Mesh: Smooth (bicubic)', icon: '∿', onClick: () => toggleMeshSmooth([...store.selection]) });
                pathOps.push({ label: 'Apply / Bake Warp', icon: '⤓', onClick: () => bakeWarp([...store.selection]) });
            }
            items.push({ label: 'Path', icon: '✐', submenu: pathOps }, { separator: true });
        }

        // Repeat & Mirror submenu (radial/grid arrays, symmetric mirror copies).
        items.push({
            label: 'Repeat & Mirror', icon: '⟳', submenu: [
                { label: 'Repeat (Radial / Grid)…', icon: '⊞', onClick: () => openRepeatDialog() },
                { label: 'Transform Again', icon: '⤸', shortcut: 'Ctrl+Shift+D', onClick: () => transformAgain() },
                { separator: true },
                { label: 'Mirror Copy →', icon: '⇆', onClick: () => mirrorCopy('horizontal') },
                { label: 'Mirror Copy ↓', icon: '⇅', onClick: () => mirrorCopy('vertical') },
                ...(store.symmetry.enabled
                    ? [{ label: 'Mirror Across Symmetry Guide', icon: '⋈', onClick: () => mirrorAcrossSymmetry() }]
                    : []),
                { separator: true },
                {
                    label: 'Transform Effect (live)', icon: '❋', submenu: [
                        { label: 'Radial Fan ×12', icon: '✳', onClick: () => setTransformEffect([...store.selection], { copies: 11, rotate: 30, scaleX: 1, scaleY: 1, moveX: 0, moveY: 0, originX: 0, originY: 0.5 }) },
                        { label: 'Rosette ×12 (in place)', icon: '❄', onClick: () => setTransformEffect([...store.selection], { copies: 11, rotate: 30, scaleX: 1, scaleY: 1, moveX: 0, moveY: 0, originX: 0.5, originY: 0.5 }) },
                        { label: 'Spiral ×14 (rotate + shrink)', icon: '➰', onClick: () => setTransformEffect([...store.selection], { copies: 14, rotate: 22, scaleX: 0.86, scaleY: 0.86, moveX: 8, moveY: -6, originX: 0.5, originY: 0.5 }) },
                        { label: 'Echo ×6 (offset trail)', icon: '⋯', onClick: () => setTransformEffect([...store.selection], { copies: 6, rotate: 0, scaleX: 1, scaleY: 1, moveX: 24, moveY: 18, originX: 0.5, originY: 0.5 }) },
                        { separator: true },
                        { label: 'Expand to Elements', icon: '⤓', onClick: () => expandTransformEffect([...store.selection]) },
                        { label: 'Remove Effect', icon: '✕', onClick: () => clearTransformEffect([...store.selection]) },
                    ]
                },
                {
                    label: '3D Extrude', icon: '⬗', submenu: [
                        { label: 'Extrude (depth 28)', icon: '⬗', onClick: () => setExtrude([...store.selection], { depth: 28, angle: 135 }) },
                        { label: 'Deep (depth 60)', icon: '◆', onClick: () => setExtrude([...store.selection], { depth: 60, angle: 135 }) },
                        { label: 'Tilted (3D perspective)', icon: '◈', onClick: () => setExtrude([...store.selection], { depth: 40, angle: 135, rotX: 25, rotY: -20 }) },
                        { separator: true },
                        { label: 'Expand to Faces', icon: '⤓', onClick: () => expandExtrude([...store.selection]) },
                        { label: 'Remove 3D', icon: '✕', onClick: () => clearExtrude([...store.selection]) },
                    ]
                },
            ]
        }, { separator: true });

        // Hierarchy Submenu
        const firstId = store.selection[0];
        const firstEl = store.elements.find(e => e.id === firstId);
        if (firstEl) {
            const hierarchyItems: MenuItem[] = [];

            if (selectionCount === 1) {
                hierarchyItems.push({ label: 'Add Child', onClick: () => addChildNode(firstId) });
                if (firstEl.parentId) {
                    hierarchyItems.push({ label: 'Add Sibling', onClick: () => addSiblingNode(firstId) });
                }
                hierarchyItems.push({ separator: true });
            }

            if (firstEl.parentId) {
                hierarchyItems.push({ label: 'Clear Parent', onClick: () => clearParent(firstId) });
            }

            const hasChildren = store.elements.some(e => e.parentId === firstId);
            if (hasChildren) {
                hierarchyItems.push({
                    label: firstEl.isCollapsed ? 'Expand Subtree' : 'Collapse Subtree',
                    onClick: () => toggleCollapse(firstId)
                });
            }

            if (selectionCount === 2) {
                const childId = store.selection[0];
                const parentId = store.selection[1];
                hierarchyItems.push({
                    label: 'Set as Child of Selected',
                    onClick: () => setParent(childId, parentId)
                });
            }

            // Mindmap Auto Layout Submenu
            const autoLayoutItems: MenuItem[] = [
                { label: 'Balanced', icon: '🌐', onClick: () => reorderMindmap(firstId, 'balanced') },
                { label: 'Horizontal (Right)', icon: '➡️', onClick: () => reorderMindmap(firstId, 'horizontal-right') },
                { label: 'Horizontal (Left)', icon: '⬅️', onClick: () => reorderMindmap(firstId, 'horizontal-left') },
                { label: 'Vertical (Down)', icon: '⬇️', onClick: () => reorderMindmap(firstId, 'vertical-down') },
                { label: 'Vertical (Up)', icon: '⬆️', onClick: () => reorderMindmap(firstId, 'vertical-up') },
                { label: 'Radial (Neuron)', icon: '🕸️', onClick: () => reorderMindmap(firstId, 'radial') },
            ];
            hierarchyItems.push({ separator: true });
            hierarchyItems.push({ label: 'Auto Layout', submenu: autoLayoutItems, icon: '🪄' });
            hierarchyItems.push({ label: 'Auto Style Branch', icon: '🎨', onClick: () => applyMindmapStyling(firstId) });

            if (hierarchyItems.length > 0) {
                items.push({ label: 'Hierarchy', submenu: hierarchyItems });
            }
        }

        // Table Row/Column Operations
        if (selectionCount === 1 && firstEl && firstEl.type === 'table' && worldX !== undefined && worldY !== undefined) {
            const el = firstEl;
            const cols = el.tableCols ?? 3;
            const rows = el.tableRows ?? 3;
            const hasHeader = el.tableHeaders !== false;
            const totalVisualRows = hasHeader ? rows + 1 : rows;
            const colWidths = el.tableColWidths ?? defaultColWidths(cols);
            const rowHeights = el.tableRowHeights ?? defaultRowHeights(totalVisualRows);
            const data = el.tableData ?? defaultTableData(rows, cols);
            const cellRects = computeCellRects(el.x, el.y, el.width, el.height, colWidths, rowHeights, el.tableColOrder, hasHeader);
            const hitCell = hitTestTableCell(worldX, worldY, cellRects);

            if (hitCell) {
                const tableItems: MenuItem[] = [];
                // Determine the data row index for insert/delete
                // hitCell.dataRow is -1 for header, 0+ for body
                const dataRowIndex = hasHeader ? (hitCell.dataRow === -1 ? 0 : hitCell.dataRow + 1) : hitCell.dataRow;

                // Row operations
                tableItems.push({
                    label: 'Insert Row Above',
                    onClick: () => {
                        pushToHistory();
                        const insertAt = dataRowIndex;
                        const result = insertTableRow(data, insertAt);
                        updateElement(el.id!, {
                            tableData: result.data,
                            tableRowHeights: result.rowHeights,
                            tableRows: hasHeader ? result.data.length - 1 : result.data.length,
                        }, false);
                        requestAnimationFrame(redrawFn);
                    }
                });
                tableItems.push({
                    label: 'Insert Row Below',
                    onClick: () => {
                        pushToHistory();
                        const insertAt = dataRowIndex + 1;
                        const result = insertTableRow(data, insertAt);
                        updateElement(el.id!, {
                            tableData: result.data,
                            tableRowHeights: result.rowHeights,
                            tableRows: hasHeader ? result.data.length - 1 : result.data.length,
                        }, false);
                        requestAnimationFrame(redrawFn);
                    }
                });
                // Only allow delete if there's more than just the header row (or 1 body row)
                const minRows = hasHeader ? 2 : 1; // need at least header + 1 body row, or 1 row if no header
                if (data.length > minRows && hitCell.dataRow !== -1) {
                    tableItems.push({
                        label: 'Delete Row',
                        onClick: () => {
                            pushToHistory();
                            const result = deleteTableRow(data, rowHeights, dataRowIndex);
                            updateElement(el.id!, {
                                tableData: result.data,
                                tableRowHeights: result.rowHeights,
                                tableRows: hasHeader ? result.data.length - 1 : result.data.length,
                            }, false);
                            requestAnimationFrame(redrawFn);
                        }
                    });
                }

                tableItems.push({ separator: true });

                // Column operations
                tableItems.push({
                    label: 'Insert Column Left',
                    onClick: () => {
                        pushToHistory();
                        const result = insertTableColumn(data, colWidths, hitCell.dataCol, hasHeader);
                        updateElement(el.id!, {
                            tableData: result.data,
                            tableColWidths: result.colWidths,
                            tableCols: result.colWidths.length,
                        }, false);
                        requestAnimationFrame(redrawFn);
                    }
                });
                tableItems.push({
                    label: 'Insert Column Right',
                    onClick: () => {
                        pushToHistory();
                        const result = insertTableColumn(data, colWidths, hitCell.dataCol + 1, hasHeader);
                        updateElement(el.id!, {
                            tableData: result.data,
                            tableColWidths: result.colWidths,
                            tableCols: result.colWidths.length,
                        }, false);
                        requestAnimationFrame(redrawFn);
                    }
                });
                // Multi-column or single-column delete
                const fullColIndices = cellSelection
                    ? getFullColumnSelection(cellSelection, totalVisualRows)
                    : null;

                if (fullColIndices && fullColIndices.length > 1 && cols - fullColIndices.length >= 1) {
                    tableItems.push({
                        label: `Delete ${fullColIndices.length} Columns`,
                        onClick: () => {
                            pushToHistory();
                            const result = deleteTableColumns(data, colWidths, fullColIndices);
                            if (!result) return;
                            // Adjust merged cells (right-to-left)
                            const sortedDesc = [...fullColIndices].sort((a, b) => b - a);
                            let newMergedCells = el.tableMergedCells as MergedCellRegion[] | undefined;
                            for (const ci of sortedDesc) {
                                newMergedCells = adjustMergedCellsOnColDelete(newMergedCells, ci);
                            }
                            // Adjust column alignments
                            let newAlignments = el.tableColAlignments ? [...el.tableColAlignments] : undefined;
                            if (newAlignments) {
                                for (const ci of sortedDesc) {
                                    newAlignments.splice(ci, 1);
                                }
                            }
                            // Adjust cell formats
                            let newFormats = el.tableCellFormats
                                ? el.tableCellFormats.map(row => [...row])
                                : undefined;
                            if (newFormats) {
                                for (const ci of sortedDesc) {
                                    newFormats = newFormats!.map(row => { row.splice(ci, 1); return row; });
                                }
                            }
                            // Adjust cell borders
                            let newBorders = el.tableCellBorders
                                ? el.tableCellBorders.map(row => [...row])
                                : undefined;
                            if (newBorders) {
                                for (const ci of sortedDesc) {
                                    newBorders = newBorders!.map(row => { row.splice(ci, 1); return row; });
                                }
                            }
                            updateElement(el.id!, {
                                tableData: result.data,
                                tableColWidths: result.colWidths,
                                tableCols: result.colWidths.length,
                                tableColAlignments: newAlignments,
                                tableMergedCells: newMergedCells?.length ? newMergedCells : undefined,
                                tableCellFormats: newFormats,
                                tableCellBorders: newBorders,
                                tableSortCol: -1,
                                tableColOrder: undefined,
                            }, false);
                            onClearCellSelection?.();
                            requestAnimationFrame(redrawFn);
                        }
                    });
                } else if (cols > 1) {
                    tableItems.push({
                        label: 'Delete Column',
                        onClick: () => {
                            pushToHistory();
                            const result = deleteTableColumn(data, colWidths, hitCell.dataCol);
                            updateElement(el.id!, {
                                tableData: result.data,
                                tableColWidths: result.colWidths,
                                tableCols: result.colWidths.length,
                            }, false);
                            onClearCellSelection?.();
                            requestAnimationFrame(redrawFn);
                        }
                    });
                }

                // Column alignment options
                tableItems.push({ separator: true });
                const currentAlignments = el.tableColAlignments ?? [];
                const currentAlign = currentAlignments[hitCell.dataCol] ?? 'center';
                const alignmentItems: MenuItem[] = [
                    {
                        label: 'Left',
                        icon: currentAlign === 'left' ? '✓' : undefined,
                        onClick: () => {
                            pushToHistory();
                            const newAlignments = [...currentAlignments];
                            // Ensure array is large enough
                            while (newAlignments.length < cols) {
                                newAlignments.push('center');
                            }
                            newAlignments[hitCell.dataCol] = 'left';
                            updateElement(el.id!, { tableColAlignments: newAlignments }, false);
                            requestAnimationFrame(redrawFn);
                        }
                    },
                    {
                        label: 'Center',
                        icon: currentAlign === 'center' ? '✓' : undefined,
                        onClick: () => {
                            pushToHistory();
                            const newAlignments = [...currentAlignments];
                            while (newAlignments.length < cols) {
                                newAlignments.push('center');
                            }
                            newAlignments[hitCell.dataCol] = 'center';
                            updateElement(el.id!, { tableColAlignments: newAlignments }, false);
                            requestAnimationFrame(redrawFn);
                        }
                    },
                    {
                        label: 'Right',
                        icon: currentAlign === 'right' ? '✓' : undefined,
                        onClick: () => {
                            pushToHistory();
                            const newAlignments = [...currentAlignments];
                            while (newAlignments.length < cols) {
                                newAlignments.push('center');
                            }
                            newAlignments[hitCell.dataCol] = 'right';
                            updateElement(el.id!, { tableColAlignments: newAlignments }, false);
                            requestAnimationFrame(redrawFn);
                        }
                    }
                ];
                tableItems.push({ label: 'Align Column', submenu: alignmentItems });

                // Cell Format options
                tableItems.push({ separator: true });
                const formatItems = buildFormatMenuItems(el, hitCell, cellSelection, pushToHistory, updateElement, redrawFn);
                tableItems.push({ label: 'Format Cells', submenu: formatItems });

                // Cell Border options
                const borderItems = buildBorderMenuItems(el, hitCell, cellSelection, pushToHistory, updateElement, redrawFn);
                tableItems.push({ label: 'Cell Borders', submenu: borderItems });

                // Clipboard operations
                tableItems.push({ separator: true });
                tableItems.push({
                    label: 'Copy Table Data',
                    onClick: async () => {
                        const tsv = tableDataToTSV(data);
                        try {
                            await navigator.clipboard.writeText(tsv);
                        } catch (err) {
                            console.error('Failed to copy table data:', err);
                        }
                    }
                });
                tableItems.push({
                    label: 'Paste Table Data',
                    onClick: async () => {
                        try {
                            const text = await navigator.clipboard.readText();
                            const parsedData = parseClipboardTableData(text);
                            if (parsedData && parsedData.length > 0) {
                                pushToHistory();
                                const newRows = hasHeader ? parsedData.length - 1 : parsedData.length;
                                const newCols = parsedData[0].length;
                                updateElement(el.id!, {
                                    tableData: parsedData,
                                    tableRows: newRows,
                                    tableCols: newCols,
                                    tableColWidths: defaultColWidths(newCols),
                                    tableRowHeights: defaultRowHeights(parsedData.length),
                                }, false);
                                requestAnimationFrame(redrawFn);
                            }
                        } catch (err) {
                            console.error('Failed to paste table data:', err);
                        }
                    }
                });

                // Merge/Unmerge operations
                tableItems.push({ separator: true });
                const mergedCells = el.tableMergedCells as MergedCellRegion[] | undefined;
                const clickedMerge = getMergedCellAt(mergedCells, hitCell.row, hitCell.col);

                // Check if we have a multi-cell selection for merging
                if (cellSelection && isMultiCellSelection(cellSelection)) {
                    const normalizedSel = normalizeCellSelection(cellSelection);
                    tableItems.push({
                        label: 'Merge Cells',
                        onClick: () => {
                            pushToHistory();
                            const newMergedCells = mergeCells(
                                mergedCells,
                                normalizedSel.startRow,
                                normalizedSel.startCol,
                                normalizedSel.endRow,
                                normalizedSel.endCol
                            );

                            // Collect and concatenate data from all cells being merged
                            const cols = el.tableCols ?? 3;
                            const rows = el.tableRows ?? 3;
                            const hasHeader = el.tableHeaders !== false;
                            const data = el.tableData ?? defaultTableData(rows + (hasHeader ? 1 : 0), cols);
                            const newData = data.map(row => [...row]);

                            // Gather all non-empty cell contents
                            const cellTexts: string[] = [];
                            for (let r = normalizedSel.startRow; r <= normalizedSel.endRow; r++) {
                                for (let c = normalizedSel.startCol; c <= normalizedSel.endCol; c++) {
                                    // Get data row index
                                    const dataRowIdx = hasHeader ? r : r;
                                    const text = newData[dataRowIdx]?.[c]?.trim() ?? '';
                                    if (text) {
                                        cellTexts.push(text);
                                    }
                                }
                            }

                            // Put concatenated text in top-left cell
                            const topLeftDataRow = hasHeader ? normalizedSel.startRow : normalizedSel.startRow;
                            if (newData[topLeftDataRow]) {
                                newData[topLeftDataRow][normalizedSel.startCol] = cellTexts.join('\n');
                            }

                            // Clear other cells in the merge region
                            for (let r = normalizedSel.startRow; r <= normalizedSel.endRow; r++) {
                                for (let c = normalizedSel.startCol; c <= normalizedSel.endCol; c++) {
                                    if (r === normalizedSel.startRow && c === normalizedSel.startCol) continue;
                                    const dataRowIdx = hasHeader ? r : r;
                                    if (newData[dataRowIdx]) {
                                        newData[dataRowIdx][c] = '';
                                    }
                                }
                            }

                            updateElement(el.id!, { tableMergedCells: newMergedCells, tableData: newData }, false);
                            requestAnimationFrame(redrawFn);
                        }
                    });
                }

                // Show unmerge option if clicking on a merged cell
                if (clickedMerge) {
                    tableItems.push({
                        label: 'Unmerge Cells',
                        onClick: () => {
                            pushToHistory();
                            const newMergedCells = unmergeCells(mergedCells, hitCell.row, hitCell.col);
                            updateElement(el.id!, { tableMergedCells: newMergedCells }, false);
                            requestAnimationFrame(redrawFn);
                        }
                    });
                }

                items.push({ label: 'Table', submenu: tableItems });
                items.push({ separator: true });
            }
        }

        // BPMN Pool Lane Operations
        if (selectionCount === 1 && firstEl && firstEl.type === 'bpmnPool') {
            const el = firstEl;
            const laneCount = el.bpmnLaneCount ?? 1;
            const poolItems: MenuItem[] = [];

            if (laneCount < 6) {
                poolItems.push({
                    label: 'Add Lane',
                    onClick: () => {
                        pushToHistory();
                        const newCount = laneCount + 1;
                        const newLabels = [...(el.bpmnLaneLabels ?? [])];
                        while (newLabels.length < newCount) newLabels.push(`Lane ${newLabels.length + 1}`);
                        const newColors = [...(el.bpmnLaneColors ?? [])];
                        while (newColors.length < newCount) newColors.push('');
                        const newTextColors = [...(el.bpmnLaneTextColors ?? [])];
                        while (newTextColors.length < newCount) newTextColors.push('');
                        const newCollapsed = [...(el.bpmnLaneCollapsed ?? [])];
                        while (newCollapsed.length < newCount) newCollapsed.push(false);
                        updateElement(el.id, {
                            bpmnLaneCount: newCount,
                            bpmnLaneLabels: newLabels,
                            bpmnLaneColors: newColors,
                            bpmnLaneTextColors: newTextColors,
                            bpmnLaneCollapsed: newCollapsed,
                        }, false);
                        // No index shift needed — new lane is appended at the end
                        redrawFn();
                    }
                });
            }

            if (laneCount > 1) {
                poolItems.push({
                    label: 'Remove Last Lane',
                    onClick: () => {
                        pushToHistory();
                        const removedIndex = laneCount - 1;
                        const newCount = laneCount - 1;
                        const newLabels = [...(el.bpmnLaneLabels ?? [])].slice(0, newCount);
                        const newColors = [...(el.bpmnLaneColors ?? [])].slice(0, newCount);
                        const newTextColors = [...(el.bpmnLaneTextColors ?? [])].slice(0, newCount);
                        const newCollapsed = [...(el.bpmnLaneCollapsed ?? [])].slice(0, newCount);
                        updateElement(el.id, {
                            bpmnLaneCount: newCount,
                            bpmnLaneLabels: newLabels,
                            bpmnLaneColors: newColors,
                            bpmnLaneTextColors: newTextColors,
                            bpmnLaneCollapsed: newCollapsed.length > 0 ? newCollapsed : undefined as any,
                        }, false);
                        shiftLaneIndicesOnRemove(el.id, removedIndex, store.elements);
                        redrawFn();
                    }
                });
            }

            if (laneCount > 1 && el.bpmnLaneHeights) {
                poolItems.push({
                    label: 'Equalize Lane Heights',
                    onClick: () => {
                        pushToHistory();
                        updateElement(el.id, { bpmnLaneHeights: undefined as any }, false);
                        redrawFn();
                    }
                });
            }

            // Per-lane color options (detect which lane was right-clicked)
            if (laneCount > 1 && worldX !== undefined && worldY !== undefined) {
                const clickedLane = hitTestPoolLane(el, worldX, worldY);

                if (clickedLane >= 0) {
                    const laneLabel = el.bpmnLaneLabels?.[clickedLane] || `Lane ${clickedLane + 1}`;
                    const laneColors: [string, string][] = [
                        ['None', ''],
                        ['White', '#ffffff'],
                        ['Light Blue', '#dbeafe'],
                        ['Light Green', '#dcfce7'],
                        ['Light Yellow', '#fef9c3'],
                        ['Light Pink', '#fce7f3'],
                        ['Light Purple', '#f3e8ff'],
                        ['Light Orange', '#ffedd5'],
                        ['Light Gray', '#f3f4f6'],
                    ];

                    poolItems.push({ separator: true });
                    poolItems.push({
                        label: `${laneLabel} Background`,
                        submenu: laneColors.map(([name, color]) => ({
                            label: name,
                            icon: color ? '■' : '∅',
                            iconColor: color || undefined,
                            onClick: () => {
                                pushToHistory();
                                const colors = [...(el.bpmnLaneColors ?? Array(laneCount).fill(''))];
                                while (colors.length < laneCount) colors.push('');
                                colors[clickedLane] = color;
                                updateElement(el.id, { bpmnLaneColors: colors }, false);
                                redrawFn();
                            }
                        }))
                    });

                    const textColors: [string, string][] = [
                        ['Default', ''],
                        ['Black', '#000000'],
                        ['Dark Blue', '#1e40af'],
                        ['Dark Green', '#166534'],
                        ['Dark Red', '#991b1b'],
                        ['Purple', '#7e22ce'],
                        ['White', '#ffffff'],
                    ];

                    poolItems.push({
                        label: `${laneLabel} Text Color`,
                        submenu: textColors.map(([name, color]) => ({
                            label: name,
                            icon: color ? '■' : '∅',
                            iconColor: color || undefined,
                            onClick: () => {
                                pushToHistory();
                                const tColors = [...(el.bpmnLaneTextColors ?? Array(laneCount).fill(''))];
                                while (tColors.length < laneCount) tColors.push('');
                                tColors[clickedLane] = color;
                                updateElement(el.id, { bpmnLaneTextColors: tColors }, false);
                                redrawFn();
                            }
                        }))
                    });

                    // Collapse / Expand lane toggle
                    const isCollapsed = el.bpmnLaneCollapsed?.[clickedLane] ?? false;
                    poolItems.push({
                        label: isCollapsed ? `Expand ${laneLabel}` : `Collapse ${laneLabel}`,
                        onClick: () => {
                            pushToHistory();
                            const collapsedArr = [...(el.bpmnLaneCollapsed ?? Array(laneCount).fill(false))];
                            while (collapsedArr.length < laneCount) collapsedArr.push(false);
                            collapsedArr[clickedLane] = !isCollapsed;
                            updateElement(el.id, { bpmnLaneCollapsed: collapsedArr }, false);
                            redrawFn();
                        }
                    });
                }
            }

            poolItems.push({ separator: true });
            poolItems.push({
                label: el.bpmnOrientation === 'vertical' ? 'Switch to Horizontal' : 'Switch to Vertical',
                onClick: () => {
                    pushToHistory();
                    updateElement(el.id, {
                        bpmnOrientation: el.bpmnOrientation === 'vertical' ? 'horizontal' : 'vertical',
                    }, false);
                    redrawFn();
                }
            });

            items.push({ label: 'Pool', submenu: poolItems });
        }

        // Batch Transform Logic (Split by Family)
        const allSelectedElements = store.selection.map(id => store.elements.find(e => e.id === id)).filter(Boolean) as DrawingElement[];

        // Filter selection into families (unbound polylines act as shapes, not connectors)
        const isPolylineShapeEl = (el: DrawingElement) =>
            el.type === 'line' && el.curveType === 'elbow' && !el.startBinding && !el.endBinding;

        const shapesInSelection = allSelectedElements.filter(el => {
            if (isPolylineShapeEl(el)) return true;
            const type = el.type;
            return type !== 'line' && type !== 'arrow' && type !== 'bezier' && type !== 'organicBranch' && type !== 'text' && type !== 'image' && type !== 'video';
        });

        const connectorsInSelection = allSelectedElements.filter(el => {
            if (isPolylineShapeEl(el)) return false;
            const type = el.type;
            return type === 'line' || type === 'arrow' || type === 'bezier' || type === 'organicBranch';
        });

        // 1. Transform Shapes
        if (shapesInSelection.length > 0) {
            const firstShapeEl = shapesInSelection[0];
            let transformOptions = getTransformOptions(firstShapeEl.type, isPolylineShapeEl(firstShapeEl));
            const distinctTypes = new Set(shapesInSelection.map(e => e.type));

            // If mixed types, allow converting to any of the present types as well (e.g. Rect+Circle -> convert all to Rect)
            if (distinctTypes.size > 1) {
                transformOptions.push(shapesInSelection[0].type);
            }

            if (transformOptions.length > 0) {
                items.push({
                    label: shapesInSelection.length > 1 ? `Transform ${shapesInSelection.length} Shapes` : 'Transform Shape',
                    submenu: transformOptions.map(t => ({
                        icon: getShapeIcon(t),
                        tooltip: getShapeTooltip(t),
                        onClick: () => {
                            pushToHistory();
                            shapesInSelection.forEach(el => changeElementType(el.id, t, false));
                            requestAnimationFrame(redrawFn);
                        }
                    })),
                    gridColumns: 3
                });
            }
        }

        // 2. Transform Connectors
        if (connectorsInSelection.length > 0) {
            let transformOptions = getTransformOptions(connectorsInSelection[0].type);
            const distinctTypes = new Set(connectorsInSelection.map(e => e.type));

            if (distinctTypes.size > 1) {
                transformOptions.push(connectorsInSelection[0].type);
            }

            if (transformOptions.length > 0) {
                items.push({
                    label: connectorsInSelection.length > 1 ? `Transform ${connectorsInSelection.length} Connectors` : 'Transform Connector',
                    submenu: transformOptions.map(t => ({
                        icon: getShapeIcon(t),
                        tooltip: getShapeTooltip(t),
                        onClick: () => {
                            pushToHistory();
                            connectorsInSelection.forEach(el => changeElementType(el.id, t, false));
                            requestAnimationFrame(redrawFn);
                        }
                    })),
                    gridColumns: 3
                });
            }
        }

        // 3. Change Curve Style (Connectors only)
        if (connectorsInSelection.length > 0) {
            const firstEl = connectorsInSelection[0];
            const currentCurveType = firstEl.curveType || 'straight';
            const curveOptions = getCurveTypeOptions(currentCurveType);

            const distinctCurveTypes = new Set(connectorsInSelection.map(e => e.curveType || 'straight'));
            if (distinctCurveTypes.size > 1) {
                curveOptions.push(currentCurveType);
            }

            if (curveOptions.length > 0) {
                items.push({
                    label: connectorsInSelection.length > 1 ? 'Change All Curve Styles' : 'Change Curve Style',
                    submenu: curveOptions.map(ct => ({
                        icon: getCurveTypeIcon(ct),
                        tooltip: getCurveTypeTooltip(ct),
                        onClick: () => {
                            pushToHistory();
                            connectorsInSelection.forEach(el => updateElement(el.id, { curveType: ct as any }, false));
                            requestAnimationFrame(redrawFn);
                        }
                    })),
                    gridColumns: 3
                });
            }
        }

        items.push({ separator: true });

        // Grouping
        if (selectionCount > 1) {
            items.push({ label: 'Group', shortcut: 'Ctrl+G', onClick: groupSelected });
            items.push({ label: 'Make Clipping Mask', shortcut: 'Ctrl+7', icon: '✂', onClick: () => makeClippingMask() });
            items.push({ label: 'Make Opacity Mask', icon: '◐', onClick: () => makeOpacityMask() });
            items.push({
                label: 'Pathfinder', icon: '⬗',
                submenu: [
                    { label: 'Unite', icon: '⬤', onClick: () => applyPathfinder([...store.selection], 'union') },
                    { label: 'Subtract (minus front)', icon: '◐', onClick: () => applyPathfinder([...store.selection], 'subtract') },
                    { label: 'Intersect', icon: '◑', onClick: () => applyPathfinder([...store.selection], 'intersect') },
                    { label: 'Exclude', icon: '◓', onClick: () => applyPathfinder([...store.selection], 'exclude') },
                    { label: 'Divide', icon: '▦', onClick: () => applyPathfinderRegion([...store.selection], 'divide') },
                    { label: 'Trim', icon: '◰', onClick: () => applyPathfinderRegion([...store.selection], 'trim') },
                    { label: 'Merge', icon: '◧', onClick: () => applyPathfinderRegion([...store.selection], 'merge') },
                    { label: 'Crop', icon: '⊡', onClick: () => applyPathfinderRegion([...store.selection], 'crop') },
                    { label: 'Outline', icon: '◌', onClick: () => applyPathfinderRegion([...store.selection], 'outline') },
                ],
            });
        }

        const isAnyGrouped = store.selection.some(id => {
            const el = store.elements.find(e => e.id === id);
            return el?.groupIds && el.groupIds.length > 0;
        });

        if (isAnyGrouped) {
            items.push({ label: 'Ungroup', shortcut: 'Ctrl+Shift+G', onClick: ungroupSelected });
        }

        // Create reusable assets from the selection (symbol / pattern / artboard / graphic style).
        if (selectionCount >= 1) {
            const anyInstance = store.selection.some(id => store.elements.find(e => e.id === id)?.type === 'symbolInstance');
            items.push({
                label: 'Create', icon: '＋', submenu: [
                    { label: 'Symbol', icon: '◈', onClick: () => createSymbol([...store.selection]) },
                    { label: 'Pattern from Selection', icon: '▦', onClick: () => createPatternFromSelection([...store.selection]) },
                    { label: 'Artboard from Selection', icon: '▭', onClick: () => addArtboard('selection') },
                    { label: 'Graphic Style', icon: '🎨', onClick: () => createGraphicStyle([...store.selection]) },
                ],
            });
            if (anyInstance && store.selection.length === 1) {
                const instId = store.selection[0];
                items.push({ label: 'Edit Symbol (in place)', icon: '✎', onClick: () => enterSymbolEdit(instId) });
            }
            if (anyInstance) items.push({ label: 'Detach Instance', icon: '⛓', onClick: () => detachInstance([...store.selection]) });
        }

        const isAnyClipped = store.selection.some(id => {
            const el = store.elements.find(e => e.id === id);
            return el?.clipMaskId || el?.isClipMask;
        });
        if (isAnyClipped) {
            items.push({ label: 'Release Clipping Mask', shortcut: 'Ctrl+Alt+7', icon: '✂', onClick: releaseClippingMask });
        }

        // AI assists (Canva-style): Magic Write on text, background removal on images.
        if (store.selection.some(id => store.elements.find(e => e.id === id)?.type === 'text')) {
            items.push({
                label: 'Magic Write (AI)', icon: '✦', submenu: [
                    { label: 'Rewrite', onClick: () => { import('../ai/canva-ai').then(m => m.magicWrite([...store.selection], 'rewrite')); } },
                    { label: 'Shorten', onClick: () => { import('../ai/canva-ai').then(m => m.magicWrite([...store.selection], 'shorten')); } },
                    { label: 'Expand', onClick: () => { import('../ai/canva-ai').then(m => m.magicWrite([...store.selection], 'expand')); } },
                    { label: 'Fix Spelling & Grammar', onClick: () => { import('../ai/canva-ai').then(m => m.magicWrite([...store.selection], 'fix')); } },
                    {
                        label: 'Custom Instruction…', onClick: () => {
                            const instruction = prompt('How should the text change?', 'Make it punchier');
                            if (instruction) import('../ai/canva-ai').then(m => m.magicWrite([...store.selection], 'custom', instruction));
                        },
                    },
                ],
            });
        }
        if (store.selection.some(id => store.elements.find(e => e.id === id)?.type === 'image')) {
            const firstImageId = () => store.selection.find(id => store.elements.find(e => e.id === id)?.type === 'image');
            items.push({
                label: 'Remove Background (AI)', icon: '✦',
                onClick: () => { import('../ai/canva-ai').then(m => m.removeBackground(firstImageId())); },
            });
            items.push({
                label: 'Magic Edit (AI)…', icon: '✦',
                onClick: () => {
                    const instruction = prompt('Describe the change (e.g. "remove the person on the left"):');
                    if (instruction) import('../ai/canva-ai').then(m => m.magicEditImage(firstImageId(), instruction));
                },
            });
            items.push({
                label: 'Magic Expand (AI)', icon: '✦', submenu: [
                    { label: 'All sides +25%', onClick: () => { import('../ai/canva-ai').then(m => m.expandImage(firstImageId())); } },
                    { label: 'Wider (+50% left & right)', onClick: () => { import('../ai/canva-ai').then(m => m.expandImage(firstImageId(), { left: 0.5, right: 0.5, top: 0, bottom: 0 })); } },
                    { label: 'Taller (+50% top & bottom)', onClick: () => { import('../ai/canva-ai').then(m => m.expandImage(firstImageId(), { left: 0, right: 0, top: 0.5, bottom: 0.5 })); } },
                    {
                        label: 'Custom…', onClick: () => {
                            const guidance = prompt('What should the extended areas contain? (optional)') || undefined;
                            import('../ai/canva-ai').then(m => m.expandImage(firstImageId(), { prompt: guidance }));
                        },
                    },
                ],
            });
        }

        // Set a selected image as the page background (paged docs); counterpart of
        // "Detach Image from Background" on the canvas menu.
        if (isPagedDocType(store.docType) && selectionCount === 1) {
            const imgEl = store.elements.find(e => e.id === store.selection[0]);
            if (imgEl?.type === 'image' && imgEl.dataURL && store.activeSlideIndex >= 0) {
                items.push({
                    label: 'Set as Page Background', icon: '🖼',
                    onClick: () => {
                        pushToHistory();
                        updateSlideBackground(store.activeSlideIndex, { backgroundImage: imgEl.dataURL, fillStyle: 'image' });
                        setStore('elements', prev => prev.filter(e => e.id !== imgEl.id));
                        setStore('selection', []);
                    },
                });
            }
        }

        // Image Trace — vectorize a selected bitmap into a path.
        if (store.selection.some(id => store.elements.find(e => e.id === id)?.type === 'image')) {
            items.push({
                label: 'Image Trace', icon: '🖉', submenu: [
                    { label: 'Trace B&W (default)', onClick: () => traceImage([...store.selection]) },
                    { label: 'Trace B&W — high detail', onClick: () => traceImage([...store.selection], { simplify: 0.4 }) },
                    { label: 'Trace Colour — 6', onClick: () => traceImage([...store.selection], { colors: 6 }) },
                    { label: 'Trace Colour — 12', onClick: () => traceImage([...store.selection], { colors: 12 }) },
                    { label: 'Trace Colour — 16 (detail)', onClick: () => traceImage([...store.selection], { colors: 16, simplify: 0.5 }) },
                    { label: 'Trace Centre-line (line art)', onClick: () => traceImage([...store.selection], { centerline: true }) },
                ],
            });
        }

        // Appearance stack — extra fills/strokes over the base shape.
        const anyAppearance = store.selection.some(id => {
            const el = store.elements.find(e => e.id === id);
            return el?.appearance && ((el.appearance.fills?.length ?? 0) > 0 || (el.appearance.strokes?.length ?? 0) > 0);
        });
        const anyMesh = store.selection.some(id => store.elements.find(e => e.id === id)?.meshGradient);
        items.push({
            label: 'Appearance', icon: '◑', submenu: [
                { label: 'Add Fill', onClick: () => addAppearanceFill([...store.selection]) },
                { label: 'Add Stroke', onClick: () => addAppearanceStroke([...store.selection]) },
                ...(anyAppearance ? [{ label: 'Clear Appearance', onClick: () => clearAppearance([...store.selection]) }] : []),
                { label: anyMesh ? 'Remove Gradient Mesh' : 'Gradient Mesh Fill', icon: '▦', onClick: () => anyMesh ? clearMeshGradient([...store.selection]) : applyMeshGradient([...store.selection]) },
            ],
        });

        // Select (by type / same property / similar) — grouped into one submenu.
        {
            const selectSub: MenuItem[] = [{ label: 'By Type', submenu: buildSelectByTypeMenu() }];
            if (selectionCount === 1) {
                const samePropertyMenu = buildSelectBySamePropertyMenu();
                if (samePropertyMenu.length > 0) selectSub.push({ label: 'By Same Property', submenu: samePropertyMenu });
            }
            selectSub.push({ label: 'Similar (Magic Wand)', icon: '🪄', onClick: () => selectSimilar() });
            items.push({ label: 'Select', icon: '⇱', submenu: selectSub });
        }

        // Arrange (z-order) + Export — grouped submenus.
        items.push(
            {
                label: 'Arrange', icon: '⤒', submenu: [
                    { label: 'Bring to Front', shortcut: 'Ctrl+]', onClick: () => bringToFront(store.selection) },
                    { label: 'Bring Forward', onClick: () => store.selection.forEach(id => moveElementZIndex(id, 'forward')) },
                    { label: 'Send Backward', onClick: () => store.selection.forEach(id => moveElementZIndex(id, 'backward')) },
                    { label: 'Send to Back', shortcut: 'Ctrl+[', onClick: () => sendToBack(store.selection) },
                ],
            },
            {
                label: 'Export', icon: '⤓', submenu: [
                    { label: 'PNG', onClick: () => exportToPng(2, true, true) },   // 2x, white bg, selection only
                    { label: 'SVG', onClick: () => exportToSvg(true) },             // selection only
                ],
            },
            { separator: true }
        );

        // Styling
        if (selectionCount >= 1) {
            items.push(
                { label: 'Eyedropper — pick style from…', icon: '💧', onClick: () => startEyedropper() },
                { label: 'Recolor Artwork…', icon: '🌈', onClick: () => toggleRecolorPanel(true) },
                ...(selectionCount === 1 ? [{ label: 'Edit Behaviors (Game)…', icon: '🎮', onClick: () => toggleBehaviorsPanel(true) }] : []),
                {
                    label: 'Distort & Transform', icon: '〰️', submenu: [
                        { label: 'Pucker', onClick: () => applyDistort([...store.selection], 'pucker', 0.25) },
                        { label: 'Bloat', onClick: () => applyDistort([...store.selection], 'bloat', 0.25) },
                        { label: 'Twirl', onClick: () => applyDistort([...store.selection], 'twirl', 0.25) },
                        { label: 'Zig-Zag', onClick: () => applyDistort([...store.selection], 'zigzag', 0.12) },
                        { label: 'Crystallize', onClick: () => applyDistort([...store.selection], 'crystallize', 0.18) },
                        { label: 'Roughen', onClick: () => applyDistort([...store.selection], 'roughen', 0.1) },
                    ],
                },
            );
        }
        if (selectionCount === 2) {
            const two = [...store.selection];
            items.push({
                label: 'Blend', icon: '⇉', submenu: [
                    { label: '2 steps', onClick: () => blendShapes(two, 2) },
                    { label: '4 steps', onClick: () => blendShapes(two, 4) },
                    { label: '8 steps', onClick: () => blendShapes(two, 8) },
                    { label: '16 steps', onClick: () => blendShapes(two, 16) },
                    { separator: true },
                    { label: 'Smooth Morph ×8', icon: '❈', onClick: () => blendShapesMorph(two, 8) },
                    { label: 'Smooth Morph ×16', icon: '❈', onClick: () => blendShapesMorph(two, 16) },
                ],
            });
        }
        if (selectionCount === 3) {
            const three = [...store.selection];
            const SPINE = ['line', 'arrow', 'bezier', 'polyline', 'elbow', 'path', 'fineliner', 'ink'];
            const hasSpine = store.elements.some(e => three.includes(e.id) && SPINE.includes(e.type));
            const shapeCount = store.elements.filter(e => three.includes(e.id) && !SPINE.includes(e.type)).length;
            if (hasSpine && shapeCount >= 2) {
                items.push({
                    label: 'Blend Along Spine', icon: '➰', submenu: [
                        { label: '4 steps', onClick: () => blendAlongPath(three, 4) },
                        { label: '8 steps', onClick: () => blendAlongPath(three, 8) },
                        { label: '16 steps', onClick: () => blendAlongPath(three, 16) },
                        { label: '24 steps', onClick: () => blendAlongPath(three, 24) },
                    ],
                });
            }
        }
        if (selectionCount >= 2) {
            items.push({ label: 'Shape Builder', icon: '⬓', onClick: () => toggleShapeBuilder(true) });
            items.push({ label: 'Live Paint Bucket', icon: '🪣', onClick: () => { makeLivePaint([...store.selection]); toggleLivePaint(true); } });
            items.push({ label: 'Envelope: Make with Top Object', icon: '⬖', onClick: () => envelopeWithTopObject([...store.selection]) });
        }
        if (selectionCount >= 1) {
            items.push({ label: 'Knife / Scissors', icon: '✂️', onClick: () => toggleCutTool(true) });
        }
        if (selectionCount === 1) {
            const chartEl = store.elements.find(e => e.id === store.selection[0]);
            if (chartEl && (chartEl.type === 'barChart' || chartEl.type === 'pieChart')) {
                items.push({
                    label: 'Edit Chart Data…', icon: '📊', onClick: () => {
                        const cur = (chartEl.barValues || (chartEl.pieSlices || []).map(s => s.value) || [40, 70, 30, 55]).join(', ');
                        const input = window.prompt('Chart values (comma-separated):', cur);
                        if (input == null) return;
                        const vals = input.split(',').map(s => parseFloat(s.trim())).filter(v => !isNaN(v));
                        if (vals.length) YappyAPI.setChartData(chartEl.id, vals);
                    },
                });
            }
        }
        if (selectionCount >= 1) {
            const wPaths = store.selection.map(id => store.elements.find(e => e.id === id)).filter(e => e && e.type === 'path' && !e.pathClosed);
            const hasWidth = wPaths.some(e => e!.widthProfile?.length);
            if (wPaths.length) {
                items.push({ label: 'Width Tool', icon: '🖊', onClick: () => toggleWidthTool(true) });
                if (hasWidth) items.push({ label: 'Reset Width', icon: '↺', onClick: () => clearWidthProfile([...store.selection]) });
            }
        }
        if (selectionCount === 1) {
            const tEl = store.elements.find(e => e.id === store.selection[0]);
            if (tEl && (tEl.type === 'text' || tEl.type === 'richtext')) {
                items.push({ label: 'Vertical Type', icon: '↕', checked: !!tEl.verticalText, onClick: () => YappyAPI.setTextVertical(tEl.id) });
                if (!(tEl.text || '').includes('\n')) items.push({ label: 'Touch Type (per-letter)', icon: '🅰', onClick: () => YappyAPI.toggleTouchType(true) });
            } else if (tEl && tEl.containerText && !tEl.containerText.includes('\n')
                && !['line', 'arrow', 'organicBranch', 'bezier'].includes(tEl.type)) {
                // Shape label → Touch Type per-letter on the containerText.
                items.push({ label: 'Touch Type (per-letter)', icon: '🅰', onClick: () => YappyAPI.toggleTouchType(true) });
            }
        }
        if (selectionCount === 1) {
            items.push(
                { label: 'Copy Styles', shortcut: 'Ctrl+Alt+C', onClick: copyStyle },
                { label: 'Paste Styles', shortcut: 'Ctrl+Alt+V', onClick: pasteStyle },
            );
            const selectedEl = store.elements.find(e => e.id === store.selection[0]);
            if (selectedEl?.link) {
                items.push({
                    label: 'Open Link',
                    onClick: () => window.open(selectedEl.link!, '_blank', 'noopener')
                });
            }
            items.push({ separator: true });
        }

        // Video-specific actions
        if (store.selection.length === 1) {
            const selEl = store.elements.find(e => e.id === store.selection[0]);
            if (selEl?.type === 'video' && selEl.videoURL) {
                const playing = isVideoPlaying(selEl.id);
                items.push(
                    {
                        label: playing ? 'Stop Video' : 'Play Video',
                        onClick: () => toggleVideoPlayback(selEl.id)
                    },
                    {
                        label: 'Copy Video URL',
                        onClick: () => navigator.clipboard.writeText(selEl.videoURL || '')
                    },
                    { separator: true }
                );
            }
        }

        // Lock / Flip / Delete
        const isLocked = store.selection.some(id => store.elements.find(e => e.id === id)?.locked);
        items.push(
            {
                label: isLocked ? 'Unlock' : 'Lock',
                shortcut: 'Ctrl+Shift+L',
                onClick: () => lockSelected(!isLocked)
            },
            {
                label: 'Flip Horizontal', shortcut: 'Shift+H',
                onClick: () => flipSelected('horizontal')
            },
            {
                label: 'Flip Vertical', shortcut: 'Shift+V',
                onClick: () => flipSelected('vertical')
            },
        );

        // Rotation pivot (Free Transform) — place at the click point, then drag the
        // on-canvas crosshair to fine-tune; rotation orbits about it. Single element only.
        if (selectionCount === 1 && worldX !== undefined && worldY !== undefined) {
            items.push({
                label: 'Set Rotation Point Here', icon: '⊕',
                onClick: () => { setTransformPivot(worldX, worldY, store.selection); bumpDirtyRevision(); }
            });
            const pv = getCustomPivot(store.selection);
            if (pv) {
                items.push(
                    {
                        label: 'Reflect Across Point →', icon: '⇆',
                        onClick: () => flipSelected('horizontal', pv.x)
                    },
                    {
                        label: 'Reflect Across Point ↓', icon: '⇅',
                        onClick: () => flipSelected('vertical', pv.y)
                    },
                    {
                        label: 'Reset Rotation Point', icon: '⊗',
                        onClick: () => { clearTransformPivot(); bumpDirtyRevision(); }
                    }
                );
            }
        }

        items.push(
            { separator: true },
            {
                label: 'Delete', shortcut: 'Delete',
                onClick: () => deleteElements(store.selection)
            },
            { separator: true },
            {
                label: 'Show Properties',
                onClick: () => togglePropertyPanel(true)
            },
            { separator: true },
            {
                label: store.globalSettings.showQuickToolbar ? 'Hide Shape Toolbar' : 'Show Shape Toolbar',
                onClick: () => updateGlobalSettings({ showQuickToolbar: !store.globalSettings.showQuickToolbar })
            }
        );
    } else {
        // Default Canvas Menu
        items.push(
            { label: 'Paste', shortcut: 'Ctrl+V', onClick: pasteFromClipboard },
            { separator: true },
            { label: 'Select all', shortcut: 'Ctrl+A', onClick: selectAll },
            { label: 'Select by Type', submenu: buildSelectByTypeMenu() },
            {
                label: 'Insert', icon: '➕', submenu: (() => {
                    const cx = worldX ?? 0, cy = worldY ?? 0;
                    return [
                        { label: 'Spiral', onClick: () => YappyAPI.createSpiral(cx, cy, 100, 3, 0.1) },
                        { label: 'Arc', onClick: () => YappyAPI.createArc(cx, cy, 100, 0, 270) },
                        { label: 'Rectangular Grid', onClick: () => YappyAPI.createRectGrid(cx - 100, cy - 80, 200, 160, 4, 4) },
                        { label: 'Polar Grid', onClick: () => YappyAPI.createPolarGrid(cx, cy, 100, 3, 8) },
                        { label: 'Lens Flare', onClick: () => { const ds = store.defaultElementStyles; YappyAPI.createFlare(cx, cy, 90, 12, 4, { strokeColor: ds.strokeColor || undefined, backgroundColor: (ds.backgroundColor && ds.backgroundColor !== 'transparent') ? ds.backgroundColor : undefined }); } },
                    ];
                })(),
            },
            { label: 'Zoom to Fit', shortcut: 'Ctrl+1', onClick: isPagedDocType(store.docType) ? zoomToFitSlide : zoomToFit },
            ...(isPagedDocType(store.docType) && store.slides[store.activeSlideIndex]?.fillStyle === 'image' && store.slides[store.activeSlideIndex]?.backgroundImage ? [
                { separator: true } as MenuItem,
                { label: 'Detach Image from Background', icon: '🖼', onClick: () => detachSlideBackgroundImage() },
            ] : []),
            { separator: true },
            { label: 'Show Grid', checked: store.gridSettings.enabled, onClick: toggleGrid },
            { label: 'Snap to Grid', checked: store.gridSettings.snapToGrid, onClick: toggleSnapToGrid },
            { label: 'Smart Snapping', checked: store.gridSettings.objectSnapping, onClick: () => setStore('gridSettings', 'objectSnapping', !store.gridSettings.objectSnapping) },
            { separator: true },
            { label: 'Zen Mode', shortcut: 'Alt+Z', checked: store.zenMode, onClick: toggleZenMode },
            { label: 'Reset View', onClick: () => setViewState({ scale: 1, panX: 0, panY: 0 }) },
            { separator: true },
            {
                label: 'Export Canvas',
                submenu: [
                    { label: 'PNG', onClick: () => exportToPng(2, true, false) },
                    { label: 'JPG', onClick: () => exportToJpg(2, false) },
                    { label: 'SVG', onClick: () => exportToSvg(false) },
                    { separator: true },
                    { label: 'Copy as PNG', onClick: () => copyCanvasAsPng(2) },
                ]
            },
            { separator: true },
            {
                label: 'Artboards', icon: '▭',
                submenu: [
                    { label: 'Add — Square 1080', onClick: () => addArtboard('Square 1080') },
                    { label: 'Add — A4 Portrait', onClick: () => addArtboard('A4 Portrait') },
                    { label: 'Add — Instagram Story', onClick: () => addArtboard('Instagram Story') },
                    { label: 'Add — Web 1280', onClick: () => addArtboard('Web 1280') },
                    ...(store.artboards.length ? [
                        { separator: true } as MenuItem,
                        ...store.artboards.map(ab => ({
                            label: ab.name, submenu: [
                                { label: 'Export PNG (2×)', onClick: () => exportArtboard(ab.id, 2) },
                                { label: 'Export PNG (1×)', onClick: () => exportArtboard(ab.id, 1) },
                                { separator: true } as MenuItem,
                                { label: 'Remove Artboard', onClick: () => deleteArtboard(ab.id) },
                            ],
                        })),
                        { separator: true } as MenuItem,
                        { label: 'Remove All Artboards', onClick: () => store.artboards.slice().forEach(ab => deleteArtboard(ab.id)) },
                    ] : []),
                ],
            },
            { separator: true },
            { label: 'Canvas Settings', onClick: () => setShowCanvasProperties(true) }
        );
    }
    return items;
}

/**
 * Build format menu items for table cells.
 */
function buildFormatMenuItems(
    el: DrawingElement,
    hitCell: { row: number; col: number; dataRow: number; dataCol: number },
    cellSelection: TableCellSelection | null | undefined,
    pushToHistory: () => void,
    updateElement: (id: string, updates: Partial<DrawingElement>, isUndo: boolean) => void,
    redrawFn: () => void
): MenuItem[] {
    const items: MenuItem[] = [];
    const cols = el.tableCols ?? 3;
    const rows = el.tableRows ?? 3;
    const hasHeader = el.tableHeaders !== false;
    const totalRows = hasHeader ? rows + 1 : rows;

    // Determine which cells to apply format to (for cell/selection formatting)
    const getTargetRange = () => {
        if (cellSelection && isMultiCellSelection(cellSelection)) {
            return normalizeCellSelection(cellSelection);
        }
        return { startRow: hitCell.row, startCol: hitCell.col, endRow: hitCell.row, endCol: hitCell.col };
    };

    // Get column range (all body cells in the clicked column)
    const getColumnRange = () => {
        const startRow = hasHeader ? 1 : 0; // Skip header row
        return { startRow, startCol: hitCell.col, endRow: totalRows - 1, endCol: hitCell.col };
    };

    const applyFormat = (format: TableCellFormat, toColumn: boolean = false) => {
        pushToHistory();
        const range = toColumn ? getColumnRange() : getTargetRange();
        const newFormats = setCellFormatRange(
            el.tableCellFormats,
            range.startRow, range.startCol,
            range.endRow, range.endCol,
            format,
            totalRows, cols
        );
        updateElement(el.id!, { tableCellFormats: newFormats }, false);
        requestAnimationFrame(redrawFn);
    };

    // Column-level formatting (most common use case - put first)
    const columnNumberItems: MenuItem[] = [
        { label: '0 decimals', onClick: () => applyFormat({ type: 'number', decimalPlaces: 0, thousandsSeparator: true }, true) },
        { label: '2 decimals', onClick: () => applyFormat({ type: 'number', decimalPlaces: 2, thousandsSeparator: true }, true) },
        { label: '4 decimals', onClick: () => applyFormat({ type: 'number', decimalPlaces: 4, thousandsSeparator: true }, true) },
    ];
    const columnCurrencyItems: MenuItem[] = currencySymbols.map(({ symbol, name }) => ({
        label: `${symbol} ${name}`,
        onClick: () => applyFormat({ type: 'currency', currencySymbol: symbol, decimalPlaces: 2, thousandsSeparator: true }, true)
    }));
    const columnDateItems: MenuItem[] = datePatterns.map(({ pattern, example }) => ({
        label: `${pattern} (${example})`,
        onClick: () => applyFormat({ type: 'date', datePattern: pattern }, true)
    }));

    items.push({ label: 'Text (Column)', onClick: () => applyFormat({ type: 'text' }, true) });
    items.push({ label: 'Number (Column)', submenu: columnNumberItems });
    items.push({ label: 'Currency (Column)', submenu: columnCurrencyItems });
    items.push({ label: 'Percentage (Column)', onClick: () => applyFormat({ type: 'percentage', decimalPlaces: 0 }, true) });
    items.push({ label: 'Date (Column)', submenu: columnDateItems });

    // Separator before single cell formatting
    items.push({ separator: true });

    // Single cell/selection formatting
    const numberItems: MenuItem[] = [
        { label: '0 decimals', onClick: () => applyFormat({ type: 'number', decimalPlaces: 0, thousandsSeparator: true }) },
        { label: '2 decimals', onClick: () => applyFormat({ type: 'number', decimalPlaces: 2, thousandsSeparator: true }) },
        { label: '4 decimals', onClick: () => applyFormat({ type: 'number', decimalPlaces: 4, thousandsSeparator: true }) },
        { separator: true },
        { label: 'No separator', onClick: () => applyFormat({ type: 'number', decimalPlaces: 2, thousandsSeparator: false }) },
    ];
    const currencyItems: MenuItem[] = currencySymbols.map(({ symbol, name }) => ({
        label: `${symbol} ${name}`,
        onClick: () => applyFormat({ type: 'currency', currencySymbol: symbol, decimalPlaces: 2, thousandsSeparator: true })
    }));
    const dateItems: MenuItem[] = datePatterns.map(({ pattern, example }) => ({
        label: `${pattern} (${example})`,
        onClick: () => applyFormat({ type: 'date', datePattern: pattern })
    }));

    items.push({ label: 'Text (Cell)', onClick: () => applyFormat({ type: 'text' }) });
    items.push({ label: 'Number (Cell)', submenu: numberItems });
    items.push({ label: 'Currency (Cell)', submenu: currencyItems });
    items.push({ label: 'Percentage (Cell)', onClick: () => applyFormat({ type: 'percentage', decimalPlaces: 0 }) });
    items.push({ label: 'Date (Cell)', submenu: dateItems });

    return items;
}

/**
 * Build border menu items for table cells.
 */
function buildBorderMenuItems(
    el: DrawingElement,
    hitCell: { row: number; col: number; dataRow: number; dataCol: number },
    cellSelection: TableCellSelection | null | undefined,
    pushToHistory: () => void,
    updateElement: (id: string, updates: Partial<DrawingElement>, isUndo: boolean) => void,
    redrawFn: () => void
): MenuItem[] {
    const items: MenuItem[] = [];
    const cols = el.tableCols ?? 3;
    const rows = el.tableRows ?? 3;
    const hasHeader = el.tableHeaders !== false;
    const totalRows = hasHeader ? rows + 1 : rows;

    // Determine which cells to apply border to
    const getTargetRange = () => {
        if (cellSelection && isMultiCellSelection(cellSelection)) {
            return normalizeCellSelection(cellSelection);
        }
        return { startRow: hitCell.row, startCol: hitCell.col, endRow: hitCell.row, endCol: hitCell.col };
    };

    const applyBorder = (
        position: 'all' | 'outside' | 'inside' | 'top' | 'bottom' | 'left' | 'right' | 'none',
        style: TableBorderStyle = 'thin',
        color: string = '#000000'
    ) => {
        pushToHistory();
        const range = getTargetRange();
        const border: TableCellBorder = { style, color };
        const newBorders = setBorderForRange(
            el.tableCellBorders,
            range.startRow, range.startCol,
            range.endRow, range.endCol,
            border,
            position,
            totalRows, cols
        );
        updateElement(el.id!, { tableCellBorders: newBorders }, false);
        requestAnimationFrame(redrawFn);
    };

    // Border positions
    items.push({ label: 'All Borders', onClick: () => applyBorder('all') });
    items.push({ label: 'Outside Borders', onClick: () => applyBorder('outside') });
    items.push({ label: 'Inside Borders', onClick: () => applyBorder('inside') });
    items.push({ separator: true });
    items.push({ label: 'Top Border', onClick: () => applyBorder('top') });
    items.push({ label: 'Bottom Border', onClick: () => applyBorder('bottom') });
    items.push({ label: 'Left Border', onClick: () => applyBorder('left') });
    items.push({ label: 'Right Border', onClick: () => applyBorder('right') });
    items.push({ separator: true });
    items.push({ label: 'No Borders', onClick: () => applyBorder('none') });

    // Border style submenu
    items.push({ separator: true });
    const styleItems: MenuItem[] = [
        { label: 'Thin', onClick: () => applyBorder('all', 'thin') },
        { label: 'Medium', onClick: () => applyBorder('all', 'medium') },
        { label: 'Thick', onClick: () => applyBorder('all', 'thick') },
    ];
    items.push({ label: 'Border Style', submenu: styleItems });

    // Border color submenu
    const colorItems: MenuItem[] = [
        { label: 'Black', onClick: () => applyBorder('all', 'thin', '#000000') },
        { label: 'Gray', onClick: () => applyBorder('all', 'thin', '#666666') },
        { label: 'Red', onClick: () => applyBorder('all', 'thin', '#dc2626') },
        { label: 'Blue', onClick: () => applyBorder('all', 'thin', '#2563eb') },
        { label: 'Green', onClick: () => applyBorder('all', 'thin', '#16a34a') },
    ];
    items.push({ label: 'Border Color', submenu: colorItems });

    return items;
}
