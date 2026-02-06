/**
 * Context Menu Builder
 * Pure function that builds context menu items based on current selection state.
 * Extracted from canvas.tsx getContextMenuItems().
 */

import type { DrawingElement, TableCellSelection } from '../types';
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
import { exportToPng, exportToSvg, exportToJpg, copyCanvasAsPng } from './export';
import {
    computeCellRects, defaultColWidths, defaultRowHeights, defaultTableData,
    hitTestTableCell, insertTableRow, deleteTableRow, insertTableColumn, deleteTableColumn,
    tableDataToTSV, parseClipboardTableData,
    getMergedCellAt, mergeCells, unmergeCells, normalizeCellSelection, isMultiCellSelection,
    setCellFormatRange, setBorderForRange, currencySymbols, datePatterns,
    type MergedCellRegion
} from './table-utils';
import type { TableCellFormat, TableCellBorder, TableBorderStyle } from '../types';

export function getContextMenuItems(
    redrawFn: () => void,
    worldX?: number,
    worldY?: number,
    cellSelection?: TableCellSelection | null
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
