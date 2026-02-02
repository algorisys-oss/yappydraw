/**
 * Context Menu Builder
 * Pure function that builds context menu items based on current selection state.
 * Extracted from canvas.tsx getContextMenuItems().
 */

import type { DrawingElement } from '../types';
import type { MenuItem } from '../components/context-menu';
import {
    store, setStore, pushToHistory, updateElement,
    duplicateElement, groupSelected, ungroupSelected,
    bringToFront, sendToBack, moveElementZIndex,
    toggleGrid, toggleSnapToGrid, toggleZenMode,
    setViewState, setShowCanvasProperties, deleteElements,
    togglePropertyPanel, toggleCollapse, setParent, clearParent,
    addChildNode, addSiblingNode, reorderMindmap, applyMindmapStyling,
    zoomToFit, zoomToFitSlide, updateGlobalSettings
} from '../store/app-store';
import {
    copyToClipboard, cutToClipboard, pasteFromClipboard,
    copyStyle, pasteStyle, lockSelected, flipSelected
} from './object-context-actions';
import {
    getTransformOptions, getShapeIcon, getShapeTooltip,
    changeElementType, getCurveTypeOptions, getCurveTypeIcon, getCurveTypeTooltip
} from './element-transforms';
import { exportToPng, exportToSvg } from './export';
import {
    computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData,
    hitTestTableCell, insertTableRow, deleteTableRow, insertTableColumn, deleteTableColumn
} from './table-utils';

export function getContextMenuItems(redrawFn: () => void, worldX?: number, worldY?: number): MenuItem[] {
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
                return type !== 'line' && type !== 'arrow' && type !== 'bezier' && type !== 'organicBranch' && type !== 'text' && type !== 'image';
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
            { separator: true }
        );

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
                        const result = insertTableRow(data, rowHeights, insertAt);
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
                        const result = insertTableRow(data, rowHeights, insertAt);
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
                if (cols > 1) {
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
                            requestAnimationFrame(redrawFn);
                        }
                    });
                }

                items.push({ label: 'Table', submenu: tableItems });
                items.push({ separator: true });
            }
        }

        // Batch Transform Logic (Split by Family)
        const allSelectedElements = store.selection.map(id => store.elements.find(e => e.id === id)).filter(Boolean) as DrawingElement[];

        // Filter selection into families (unbound polylines act as shapes, not connectors)
        const isPolylineShapeEl = (el: DrawingElement) =>
            el.type === 'line' && el.curveType === 'elbow' && !el.startBinding && !el.endBinding;

        const shapesInSelection = allSelectedElements.filter(el => {
            if (isPolylineShapeEl(el)) return true;
            const type = el.type;
            return type !== 'line' && type !== 'arrow' && type !== 'bezier' && type !== 'organicBranch' && type !== 'text' && type !== 'image';
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
        }

        const isAnyGrouped = store.selection.some(id => {
            const el = store.elements.find(e => e.id === id);
            return el?.groupIds && el.groupIds.length > 0;
        });

        if (isAnyGrouped) {
            items.push({ label: 'Ungroup', shortcut: 'Ctrl+Shift+G', onClick: ungroupSelected });
        }

        items.push({ separator: true });

        // Export Selection
        items.push(
            {
                label: 'Export as PNG',
                onClick: () => exportToPng(2, true, true) // 2x scale, white bg, selection only
            },
            {
                label: 'Export as SVG',
                onClick: () => exportToSvg(true) // selection only
            }
        );

        items.push({ separator: true });

        // Layering
        items.push(
            {
                label: 'Bring to Front', shortcut: 'Ctrl+]',
                onClick: () => bringToFront(store.selection)
            },
            {
                label: 'Send to Back', shortcut: 'Ctrl+[',
                onClick: () => sendToBack(store.selection)
            },
            {
                label: 'Bring Forward',
                onClick: () => store.selection.forEach(id => moveElementZIndex(id, 'forward'))
            },
            {
                label: 'Send Backward',
                onClick: () => store.selection.forEach(id => moveElementZIndex(id, 'backward'))
            },
            { separator: true }
        );

        // Styling
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
            { label: 'Select all', shortcut: 'Ctrl+A', onClick: () => setStore('selection', store.elements.map(e => e.id)) },
            { label: 'Zoom to Fit', shortcut: 'Ctrl+1', onClick: store.docType === 'slides' ? zoomToFitSlide : zoomToFit },
            { separator: true },
            { label: 'Show Grid', checked: store.gridSettings.enabled, onClick: toggleGrid },
            { label: 'Snap to Grid', checked: store.gridSettings.snapToGrid, onClick: toggleSnapToGrid },
            { label: 'Smart Snapping', checked: store.gridSettings.objectSnapping, onClick: () => setStore('gridSettings', 'objectSnapping', !store.gridSettings.objectSnapping) },
            { separator: true },
            { label: 'Zen Mode', shortcut: 'Alt+Z', checked: store.zenMode, onClick: toggleZenMode },
            { label: 'Reset View', onClick: () => setViewState({ scale: 1, panX: 0, panY: 0 }) },
            { separator: true },
            { label: 'Canvas Settings', onClick: () => setShowCanvasProperties(true) }
        );
    }
    return items;
}
