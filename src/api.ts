import {
    store, addElement, updateElement, deleteElements, setViewState, pushToHistory, setStore, zoomToFit,
    undo, redo, groupSelected, ungroupSelected, duplicateElement, toggleTheme,
    addLayer, deleteLayer, setActiveLayer, mergeLayerDown, flattenLayers, isolateLayer, showAllLayers,
    updateLayer, duplicateLayer, reorderLayers, moveElementsToLayer, createLayerGroup, toggleLayerGroupExpansion,
    isLayerVisible, isLayerLocked,
    toggleGrid, toggleSnapToGrid, toggleCommandPalette, togglePropertyPanel, togglePresentationMode,
    toggleLayerPanel, toggleMinimap, toggleZenMode, toggleSlideNavigator,
    addDisplayState, updateDisplayState, deleteDisplayState, applyDisplayState, toggleStatePanel,
    applyNextState, applyPreviousState,
    addChildNode, addSiblingNode, toggleCollapseSelection, toggleCollapse,
    setParent, reorderMindmap, applyMindmapStyling,
    addSlide, deleteSlide, duplicateSlide, setActiveSlide, reorderSlides,
    updateSlideTransition, updateSlideBackground, setDocType, loadDocument, resetToNewDocument,
    advancePresentation, retreatPresentation,
    bringToFront, sendToBack, moveElementZIndex,
    alignSelectedElements, distributeSelectedElements,
    setCanvasBackgroundColor, setCanvasTexture, zoomToFitSlide,
    setSelectedTool, loadTemplate, moveSelectedElements,
    toggleMainToolbar, toggleUtilityToolbar, toggleSlideToolbar, setSlideToolbarPosition
} from "./store/app-store";
import type { ElementType, DrawingElement, FillStyle, StrokeStyle, FontFamily, TextAlign, ArrowHead, VerticalAlign, Point, GradientStop, GradientType, Layer } from "./types";
import type { Slide, SlideTransition } from "./types/slide-types";
import type { AlignmentType, DistributionType } from "./utils/alignment";
import type { LayoutDirection } from "./utils/mindmap-layout";
import {
    animateElement,
    animateElements,
    createTimeline,
    fadeIn,
    fadeOut,
    scaleIn,
    bounce,
    pulse,
    shakeX,
    stopElementAnimation,
    pauseElementAnimation,
    resumeElementAnimation,
    easings,
    animationEngine,
    createSpring
} from "./utils/animation";
import {
    copyToClipboard, cutToClipboard, pasteFromClipboard,
    copyStyle, pasteStyle
} from "./utils/object-context-actions";
import { generateId } from "./utils/id-generator";
import {
    defaultColWidths, defaultRowHeights,
    insertTableRow, deleteTableRow, insertTableColumn, deleteTableColumn,
    sortTableData, tableDataToTSV, tableDataToCSV, parseClipboardTableData,
    mergeCells as doMergeCells, unmergeCells as doUnmergeCells, getMergedCellAt
} from "./utils/table-utils";

interface ElementOptions {
    strokeColor?: string;
    backgroundColor?: string;
    fillStyle?: FillStyle;
    strokeWidth?: number;
    strokeStyle?: StrokeStyle;
    opacity?: number;
    roughness?: number;
    angle?: number;
    roundness?: { type: number } | null;
    fontFamily?: FontFamily;
    fontSize?: number;
    textAlign?: TextAlign;
    verticalAlign?: VerticalAlign;
    startArrowhead?: ArrowHead;
    endArrowhead?: ArrowHead;
    seed?: number;
    layerId?: string;
    curveType?: 'straight' | 'bezier' | 'elbow';
    startBinding?: { elementId: string; focus: number; gap: number; position?: string } | null;
    endBinding?: { elementId: string; focus: number; gap: number; position?: string } | null;

    // New Attributes
    containerText?: string;
    locked?: boolean;
    link?: string | null;
    tag?: string | null;
    priority?: number; // Layer order implicitly handled by addElement but maybe useful?

    // Shape Specifics
    starPoints?: number;
    polygonSides?: number;
    burstPoints?: number;
    borderRadius?: number;
    tailPosition?: number;
    shapeRatio?: number;

    // Advanced Styling
    fillDensity?: number;
    shadowEnabled?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;

    // Gradients
    gradientStart?: string;
    gradientEnd?: string;
    gradientDirection?: number;
    gradientStops?: GradientStop[];
    gradientType?: GradientType;
    gradientHandlePositions?: { start: Point; end: Point };

    // Border Extras
    drawInnerBorder?: boolean;
    innerBorderColor?: string;
    innerBorderDistance?: number;
    strokeLineJoin?: 'round' | 'bevel' | 'miter';

    // Interactive Behaviors
    spinEnabled?: boolean;
    spinSpeed?: number;
    orbitEnabled?: boolean;
    orbitCenterId?: string;
    orbitRadius?: number;
    orbitSpeed?: number;
    orbitDirection?: 'cw' | 'ccw';

    // Motion Graphics
    flowAnimation?: boolean;
    flowSpeed?: number;
    flowStyle?: 'dashes' | 'dots' | 'pulse';
    flowColor?: string;
    flowDensity?: number;

    // Text Styling
    textColor?: string;
    textHighlightEnabled?: boolean;
    textHighlightColor?: string;
    textHighlightPadding?: number;
    textHighlightRadius?: number;

    // Hierarchy (Mindmap)
    parentId?: string | null;
    isCollapsed?: boolean;
    // Generic/Specific
    points?: Point[] | number[];
    status?: 'pending' | 'loaded' | 'error';
    dataURL?: string;
    autoResize?: boolean;
    constrained?: boolean;

    // Image specifics
    scale?: [number, number];
    crop?: { x: number; y: number; width: number; height: number } | null;
    mimeType?: string;

    // Table specifics
    tableRows?: number;
    tableCols?: number;
    tableHeaders?: boolean;
    tableData?: string[][];
    tableColWidths?: number[];
    tableRowHeights?: number[];
    tableColAlignments?: ('left' | 'center' | 'right')[];
    tableHeaderColor?: string;
    tableHeaderTextColor?: string;
    tableRowColor?: string;
    tableAltRowColor?: string;
}

export const YappyAPI = {
    /**
     * Get the current state wrapper
     */
    get state() {
        return store;
    },

    /**
     * Create a generic element
     */
    createElement(type: ElementType, x: number, y: number, width: number, height: number, options?: ElementOptions): string {
        const id = generateId(type);
        const defaults = store.defaultElementStyles;

        const element: DrawingElement = {
            id,
            type,
            x,
            y,
            width,
            height,
            strokeColor: options?.strokeColor ?? defaults.strokeColor ?? '#000000',
            backgroundColor: options?.backgroundColor ?? defaults.backgroundColor ?? 'transparent',
            fillStyle: options?.fillStyle ?? defaults.fillStyle ?? 'solid',
            strokeWidth: options?.strokeWidth ?? defaults.strokeWidth ?? 1,
            strokeStyle: options?.strokeStyle ?? defaults.strokeStyle ?? 'solid',
            opacity: options?.opacity ?? defaults.opacity ?? 100,
            roughness: options?.roughness ?? defaults.roughness ?? 1,
            angle: options?.angle ?? 0,
            renderStyle: defaults.renderStyle ?? 'sketch',
            seed: options?.seed ?? Math.floor(Math.random() * 2 ** 31),
            roundness: options?.roundness ?? defaults.roundness ?? null,
            fontFamily: options?.fontFamily ?? defaults.fontFamily ?? "hand-drawn",
            fontSize: options?.fontSize ?? defaults.fontSize ?? 28,
            textAlign: options?.textAlign ?? defaults.textAlign ?? 'left',
            verticalAlign: options?.verticalAlign ?? 'middle',
            startArrowhead: options?.startArrowhead ?? defaults.startArrowhead ?? null,
            endArrowhead: options?.endArrowhead ?? defaults.endArrowhead ?? 'arrow',
            locked: options?.locked ?? false,
            link: options?.link ?? null,
            tag: options?.tag ?? null,
            layerId: options?.layerId ?? store.activeLayerId,
            curveType: options?.curveType ?? 'straight',
            containerText: options?.containerText ?? '',

            // New Properties Defaults
            parentId: options?.parentId ?? null,
            isCollapsed: options?.isCollapsed ?? false,
            autoResize: options?.autoResize ?? false,
            constrained: options?.constrained ?? false,

            starPoints: options?.starPoints,
            polygonSides: options?.polygonSides,
            burstPoints: options?.burstPoints,
            borderRadius: options?.borderRadius,

            shadowEnabled: options?.shadowEnabled ?? false,
            shadowColor: options?.shadowColor,
            shadowBlur: options?.shadowBlur,
            shadowOffsetX: options?.shadowOffsetX,
            shadowOffsetY: options?.shadowOffsetY,

            gradientStart: options?.gradientStart,
            gradientEnd: options?.gradientEnd,
            gradientDirection: options?.gradientDirection,
            gradientStops: options?.gradientStops,
            gradientType: options?.gradientType,
            gradientHandlePositions: options?.gradientHandlePositions,

            drawInnerBorder: options?.drawInnerBorder,
            innerBorderColor: options?.innerBorderColor,
            innerBorderDistance: options?.innerBorderDistance,
            strokeLineJoin: options?.strokeLineJoin,

            spinEnabled: options?.spinEnabled,
            spinSpeed: options?.spinSpeed,
            orbitEnabled: options?.orbitEnabled,
            orbitCenterId: options?.orbitCenterId,
            orbitRadius: options?.orbitRadius,
            orbitSpeed: options?.orbitSpeed,
            orbitDirection: options?.orbitDirection,

            flowAnimation: options?.flowAnimation,
            flowSpeed: options?.flowSpeed,
            flowStyle: options?.flowStyle,
            flowColor: options?.flowColor,
            flowDensity: options?.flowDensity,

            // Text Styling
            textColor: options?.textColor,
            textHighlightEnabled: options?.textHighlightEnabled ?? false,
            textHighlightColor: options?.textHighlightColor,
            textHighlightPadding: options?.textHighlightPadding,
            textHighlightRadius: options?.textHighlightRadius,

            ...options
        };

        // Initialize points for connectors (line, arrow, bezier) if not provided
        const isConnectorType = element.type === 'line' || element.type === 'arrow' || element.type === 'bezier';
        if (isConnectorType &&
            (element.curveType === 'elbow' || element.curveType === 'bezier' || element.type === 'bezier') &&
            (!element.points || element.points.length === 0)) {
            element.points = [0, 0, element.width, element.height];
        }

        addElement(element);
        return id;
    },

    // --- Basic Shapes ---

    createRectangle(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('rectangle', x, y, width, height, options);
    },

    createCircle(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('circle', x, y, width, height, options);
    },

    createDiamond(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('diamond', x, y, width, height, options);
    },

    createTriangle(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('triangle', x, y, width, height, options);
    },

    createPolygonalShape(type: ElementType, x: number, y: number, width: number, height: number, options?: ElementOptions) {
        // Wrapper for all polygon types: hexagon, octagon, star, cloud, etc.
        return this.createElement(type, x, y, width, height, options);
    },

    createStar(x: number, y: number, width: number, height: number, points: number = 5, options?: ElementOptions) {
        return this.createElement('star', x, y, width, height, { ...options, starPoints: points });
    },

    // --- Wireframing & Sketchnotes ---

    createBrowserWindow(x: number, y: number, width: number, height: number, options?: ElementOptions) {
        return this.createElement('browserWindow', x, y, width, height, options);
    },

    createStickyNote(x: number, y: number, width: number, height: number, text?: string, options?: ElementOptions) {
        return this.createElement('stickyNote', x, y, width, height, { ...options, containerText: text });
    },

    // --- Linear Elements ---

    createLine(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('line', x1, y1, width, height, options);
    },

    createArrow(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('arrow', x1, y1, width, height, { ...options });
    },

    createBezier(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('bezier', x1, y1, width, height, { ...options, curveType: 'bezier' });
    },

    createOrganicBranch(x1: number, y1: number, x2: number, y2: number, options?: ElementOptions) {
        const width = x2 - x1;
        const height = y2 - y1;
        return this.createElement('organicBranch', x1, y1, width, height, {
            ...options,
            curveType: 'bezier',
            strokeWidth: options?.strokeWidth ?? 3, // Branches usually thicker
        });
    },

    // --- Specialized Elements ---

    createText(x: number, y: number, text: string, options?: ElementOptions) {
        const id = generateId('text');
        const defaults = store.defaultElementStyles;
        const fontSize = options?.fontSize ?? defaults.fontSize ?? 28;
        // Approximation
        const estimatedWidth = text.length * (fontSize * 0.6);

        const element: DrawingElement = {
            id,
            type: 'text',
            x,
            y,
            width: estimatedWidth,
            height: fontSize * 1.5,
            text: text,
            strokeColor: options?.strokeColor ?? defaults.strokeColor ?? '#000000',
            backgroundColor: 'transparent',
            fillStyle: 'solid',
            strokeWidth: 1,
            strokeStyle: 'solid',
            opacity: options?.opacity ?? 100,
            roughness: 0,
            angle: options?.angle ?? 0,
            renderStyle: 'sketch',
            seed: Math.floor(Math.random() * 2 ** 31),
            roundness: null,
            fontFamily: options?.fontFamily ?? defaults.fontFamily ?? "hand-drawn",
            fontSize: fontSize,
            textAlign: options?.textAlign ?? defaults.textAlign ?? 'left',
            verticalAlign: options?.verticalAlign ?? 'middle',
            locked: false,
            link: null,
            layerId: options?.layerId ?? store.activeLayerId,
            ...options
        };

        addElement(element);
        return id;
    },

    createImage(x: number, y: number, dataURL: string, width: number, height: number, options?: ElementOptions) {
        return this.createElement('image', x, y, width, height, {
            ...options,
            backgroundColor: 'transparent', // Images usually transparent bg
            fillStyle: 'solid',
            // dataURL should be handled by the updateElement or if we want to add it to generic createElement we need to add it to ElementOptions but it is specific.
            // We'll hack it in via the options spread which casts to DrawingElement
            // @ts-ignore
            dataURL: dataURL,
            status: 'loaded'
        });
    },

    // --- Table Elements ---

    /**
     * Create a table element
     * @param x - X position
     * @param y - Y position
     * @param width - Table width
     * @param height - Table height
     * @param rows - Number of data rows (default 3)
     * @param cols - Number of columns (default 3)
     * @param options - Additional table options
     */
    createTable(x: number, y: number, width: number, height: number, rows: number = 3, cols: number = 3, options?: ElementOptions) {
        const hasHeader = options?.tableHeaders !== false;
        const totalDataRows = hasHeader ? rows + 1 : rows;

        // Initialize table data with headers
        const tableData: string[][] = [];
        if (hasHeader) {
            tableData.push(Array.from({ length: cols }, (_, i) => `Col ${i + 1}`));
        }
        for (let r = 0; r < rows; r++) {
            tableData.push(Array.from({ length: cols }, () => ''));
        }

        return this.createElement('table', x, y, width, height, {
            ...options,
            tableRows: rows,
            tableCols: cols,
            tableHeaders: hasHeader,
            tableData: options?.tableData ?? tableData,
            tableColWidths: options?.tableColWidths ?? defaultColWidths(cols),
            tableRowHeights: options?.tableRowHeights ?? defaultRowHeights(totalDataRows),
            tableHeaderColor: options?.tableHeaderColor ?? '#e2e8f0',
        });
    },

    /**
     * Set the value of a table cell
     * @param tableId - Table element ID
     * @param row - Row index (0-based, includes header if present)
     * @param col - Column index (0-based)
     * @param value - Cell value
     */
    setTableCell(tableId: string, row: number, col: number, value: string) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ? table.tableData.map(r => [...r]) : [];
        if (data[row]) {
            data[row][col] = value;
            updateElement(tableId, { tableData: data }, true);
        }
    },

    /**
     * Get the value of a table cell
     * @param tableId - Table element ID
     * @param row - Row index (0-based)
     * @param col - Column index (0-based)
     */
    getTableCell(tableId: string, row: number, col: number): string | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') return null;
        return table.tableData?.[row]?.[col] ?? null;
    },

    /**
     * Insert a row into a table
     * @param tableId - Table element ID
     * @param atIndex - Index to insert at (in tableData)
     */
    insertTableRow(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const result = insertTableRow(data, atIndex);
        const hasHeader = table.tableHeaders !== false;
        const newRows = hasHeader ? result.data.length - 1 : result.data.length;

        updateElement(tableId, {
            tableData: result.data,
            tableRowHeights: result.rowHeights,
            tableRows: newRows,
        }, true);
    },

    /**
     * Delete a row from a table
     * @param tableId - Table element ID
     * @param atIndex - Index to delete (in tableData)
     */
    deleteTableRow(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const rowHeights = table.tableRowHeights ?? [];
        const result = deleteTableRow(data, rowHeights, atIndex);
        const hasHeader = table.tableHeaders !== false;
        const newRows = hasHeader ? result.data.length - 1 : result.data.length;

        updateElement(tableId, {
            tableData: result.data,
            tableRowHeights: result.rowHeights,
            tableRows: newRows,
        }, true);
    },

    /**
     * Insert a column into a table
     * @param tableId - Table element ID
     * @param atIndex - Index to insert at
     */
    insertTableColumn(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const colWidths = table.tableColWidths ?? [];
        const hasHeader = table.tableHeaders !== false;
        const result = insertTableColumn(data, colWidths, atIndex, hasHeader);

        updateElement(tableId, {
            tableData: result.data,
            tableColWidths: result.colWidths,
            tableCols: result.colWidths.length,
        }, true);
    },

    /**
     * Delete a column from a table
     * @param tableId - Table element ID
     * @param atIndex - Index to delete
     */
    deleteTableColumn(tableId: string, atIndex: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const colWidths = table.tableColWidths ?? [];
        const result = deleteTableColumn(data, colWidths, atIndex);

        updateElement(tableId, {
            tableData: result.data,
            tableColWidths: result.colWidths,
            tableCols: result.colWidths.length,
        }, true);
    },

    /**
     * Sort table data by a column
     * @param tableId - Table element ID
     * @param colIndex - Column index to sort by
     * @param direction - Sort direction ('asc' or 'desc')
     */
    sortTableColumn(tableId: string, colIndex: number, direction: 'asc' | 'desc' = 'asc') {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const data = table.tableData ?? [];
        const hasHeader = table.tableHeaders !== false;

        // Sort only body rows, keep header
        if (hasHeader && data.length > 1) {
            const header = data[0];
            const body = data.slice(1);
            const sortedBody = sortTableData(body, colIndex, direction);
            updateElement(tableId, {
                tableData: [header, ...sortedBody],
                tableSortCol: colIndex,
                tableSortDir: direction,
            }, true);
        } else if (!hasHeader && data.length > 0) {
            const sorted = sortTableData(data, colIndex, direction);
            updateElement(tableId, {
                tableData: sorted,
                tableSortCol: colIndex,
                tableSortDir: direction,
            }, true);
        }
    },

    /**
     * Set column alignment for a table
     * @param tableId - Table element ID
     * @param colIndex - Column index
     * @param alignment - Alignment ('left', 'center', 'right')
     */
    setTableColumnAlignment(tableId: string, colIndex: number, alignment: 'left' | 'center' | 'right') {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const cols = table.tableCols ?? 3;
        const alignments = table.tableColAlignments ? [...table.tableColAlignments] : [];

        // Ensure array is large enough
        while (alignments.length < cols) {
            alignments.push('center');
        }

        alignments[colIndex] = alignment;
        updateElement(tableId, { tableColAlignments: alignments }, true);
    },

    /**
     * Set column width for a table (as fraction of total width)
     * @param tableId - Table element ID
     * @param colIndex - Column index
     * @param width - Width as fraction (0-1)
     */
    setTableColumnWidth(tableId: string, colIndex: number, width: number) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const cols = table.tableCols ?? 3;
        const colWidths = table.tableColWidths ? [...table.tableColWidths] : defaultColWidths(cols);

        const oldWidth = colWidths[colIndex];
        const otherColsTotal = 1 - oldWidth;

        if (otherColsTotal > 0) {
            colWidths[colIndex] = Math.max(0.05, Math.min(0.8, width));
            // Redistribute remaining space proportionally
            for (let c = 0; c < cols; c++) {
                if (c !== colIndex) {
                    colWidths[c] = colWidths[c] * (1 - colWidths[colIndex]) / otherColsTotal;
                }
            }
        }

        updateElement(tableId, { tableColWidths: colWidths }, true);
    },

    /**
     * Set table styling options
     * @param tableId - Table element ID
     * @param options - Styling options
     */
    setTableStyle(tableId: string, options: {
        headerColor?: string;
        headerTextColor?: string;
        rowColor?: string;
        altRowColor?: string;
    }) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const updates: Partial<DrawingElement> = {};
        if (options.headerColor !== undefined) updates.tableHeaderColor = options.headerColor;
        if (options.headerTextColor !== undefined) updates.tableHeaderTextColor = options.headerTextColor;
        if (options.rowColor !== undefined) updates.tableRowColor = options.rowColor;
        if (options.altRowColor !== undefined) updates.tableAltRowColor = options.altRowColor;

        updateElement(tableId, updates, true);
    },

    /**
     * Get all table data as a 2D array
     * @param tableId - Table element ID
     */
    getTableData(tableId: string): string[][] | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') return null;
        return table.tableData ?? null;
    },

    /**
     * Set all table data at once
     * @param tableId - Table element ID
     * @param data - 2D array of cell values
     */
    setTableData(tableId: string, data: string[][]) {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return;
        }

        const hasHeader = table.tableHeaders !== false;
        const rows = hasHeader ? data.length - 1 : data.length;
        const cols = data[0]?.length ?? 3;

        updateElement(tableId, {
            tableData: data,
            tableRows: rows,
            tableCols: cols,
            tableColWidths: defaultColWidths(cols),
            tableRowHeights: defaultRowHeights(data.length),
        }, true);
    },

    /**
     * Copy table data to clipboard as TSV
     * @param tableId - Table element ID
     */
    async copyTableToClipboard(tableId: string): Promise<boolean> {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table' || !table.tableData) {
            console.error('Element is not a table or has no data');
            return false;
        }
        try {
            const tsv = tableDataToTSV(table.tableData);
            await navigator.clipboard.writeText(tsv);
            return true;
        } catch (err) {
            console.error('Failed to copy table data:', err);
            return false;
        }
    },

    /**
     * Export table data as CSV string
     * @param tableId - Table element ID
     */
    exportTableAsCSV(tableId: string): string | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table' || !table.tableData) {
            console.error('Element is not a table or has no data');
            return null;
        }
        return tableDataToCSV(table.tableData);
    },

    /**
     * Paste clipboard data into a table
     * @param tableId - Table element ID
     */
    async pasteIntoTable(tableId: string): Promise<boolean> {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }
        try {
            const text = await navigator.clipboard.readText();
            const parsedData = parseClipboardTableData(text);
            if (parsedData && parsedData.length > 0) {
                const hasHeader = table.tableHeaders !== false;
                const newRows = hasHeader ? parsedData.length - 1 : parsedData.length;
                const newCols = parsedData[0].length;
                updateElement(tableId, {
                    tableData: parsedData,
                    tableRows: newRows,
                    tableCols: newCols,
                    tableColWidths: defaultColWidths(newCols),
                    tableRowHeights: defaultRowHeights(parsedData.length),
                }, true);
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to paste into table:', err);
            return false;
        }
    },

    /**
     * Import CSV/TSV string into a table
     * @param tableId - Table element ID
     * @param csvData - CSV or TSV string data
     */
    importTableFromCSV(tableId: string, csvData: string): boolean {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }
        const parsedData = parseClipboardTableData(csvData);
        if (parsedData && parsedData.length > 0) {
            const hasHeader = table.tableHeaders !== false;
            const newRows = hasHeader ? parsedData.length - 1 : parsedData.length;
            const newCols = parsedData[0].length;
            updateElement(tableId, {
                tableData: parsedData,
                tableRows: newRows,
                tableCols: newCols,
                tableColWidths: defaultColWidths(newCols),
                tableRowHeights: defaultRowHeights(parsedData.length),
            }, true);
            return true;
        }
        return false;
    },

    /**
     * Merge a range of cells in a table
     * @param tableId - Table element ID
     * @param startRow - Starting row index
     * @param startCol - Starting column index
     * @param endRow - Ending row index
     * @param endCol - Ending column index
     */
    mergeCells(tableId: string, startRow: number, startCol: number, endRow: number, endCol: number): boolean {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }

        const mergedCells = table.tableMergedCells ?? [];
        const newMergedCells = doMergeCells(mergedCells, startRow, startCol, endRow, endCol);

        updateElement(tableId, { tableMergedCells: newMergedCells }, true);
        return true;
    },

    /**
     * Unmerge cells at a given position
     * @param tableId - Table element ID
     * @param row - Row index of any cell in the merge
     * @param col - Column index of any cell in the merge
     */
    unmergeCells(tableId: string, row: number, col: number): boolean {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') {
            console.error('Element is not a table');
            return false;
        }

        const mergedCells = table.tableMergedCells ?? [];
        const mergeAt = getMergedCellAt(mergedCells, row, col);

        if (!mergeAt) {
            console.warn('No merged cell at this position');
            return false;
        }

        const newMergedCells = doUnmergeCells(mergedCells, row, col);
        updateElement(tableId, { tableMergedCells: newMergedCells }, true);
        return true;
    },

    /**
     * Get merged cells info for a table
     * @param tableId - Table element ID
     */
    getMergedCells(tableId: string): { startRow: number; startCol: number; endRow: number; endCol: number }[] | null {
        const table = this.getElement(tableId);
        if (!table || table.type !== 'table') return null;
        return table.tableMergedCells ?? [];
    },

    // --- Actions & Helpers ---

    getElement(id: string) {
        return store.elements.find(e => e.id === id);
    },

    updateElement(id: string, updates: Partial<DrawingElement>) {
        updateElement(id, updates, true);
    },

    deleteElement(id: string) {
        deleteElements([id]);
    },

    clear() {
        if (store.elements.length > 0) {
            pushToHistory();
            setStore("elements", []);
            setStore("selection", []);
        }
    },

    setSelected(ids: string[]) {
        setStore("selection", ids);
    },

    clearSelection() {
        setStore("selection", []);
    },

    setView(scale: number, panX: number, panY: number) {
        setViewState({ scale, panX, panY });
    },

    updateGridSettings(settings: any) {
        setStore("gridSettings", (s) => ({ ...s, ...settings }));
    },

    updateDefaultStyles(styles: any) {
        setStore("defaultElementStyles", (s) => ({ ...s, ...styles }));
    },

    async zoomToFit() {
        zoomToFit();
    },

    /**
     * Connect two elements with a line/arrow
     */
    connect(sourceId: string, targetId: string, options?: ElementOptions & { type?: 'line' | 'arrow' | 'organicBranch' }) {
        const source = this.getElement(sourceId);
        const target = this.getElement(targetId);

        if (!source || !target) {
            console.error("Source or Target element not found");
            return null;
        }

        const sx = source.x + source.width / 2;
        const sy = source.y + source.height / 2;
        const tx = target.x + target.width / 2;
        const ty = target.y + target.height / 2;

        const type = options?.type ?? 'arrow';
        const curveType = options?.curveType ?? 'bezier';

        // Simple Edge Intersection Logic
        const intersect = (x1: number, y1: number, x2: number, y2: number, rect: DrawingElement) => {
            const cx = rect.x + rect.width / 2;
            const cy = rect.y + rect.height / 2;
            const w = rect.width / 2;
            const h = rect.height / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            if (dx === 0 && dy === 0) return { x: x1, y: y1 };

            const angle = Math.atan2(dy, dx);

            // Diamond
            if (rect.type === 'diamond') {
                const absTan = Math.abs(Math.tan(angle));
                const absDx = 1 / ((1 / w) + (absTan / h));
                const dX = (dx > 0 ? 1 : -1) * absDx;
                const dY = dX * Math.tan(angle);
                return { x: cx + dX, y: cy + dY };
            }
            // Circle/Shape with radius roughly
            if (['circle', 'star', 'octagon', 'hexagon'].includes(rect.type)) {
                // Ellipse approximation
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                return { x: cx + w * cos, y: cy + h * sin };
            }

            // Box default
            const rx = dx > 0 ? cx + w : cx - w;
            const ry = cy + Math.tan(angle) * (rx - cx);
            const by = dy > 0 ? cy + h : cy - h;
            const bx = cx + (by - cy) / Math.tan(angle);
            const onV = (ry >= cy - h - 1 && ry <= cy + h + 1);
            if (onV) return { x: rx, y: ry };
            return { x: bx, y: by };
        };

        const startP = intersect(sx, sy, tx, ty, source);
        const endP = intersect(tx, ty, sx, sy, target);

        const id = this.createElement(type as ElementType, startP.x, startP.y, endP.x - startP.x, endP.y - startP.y, {
            ...options,
            curveType,
            startBinding: { elementId: sourceId, focus: 0, gap: 5 },
            endBinding: { elementId: targetId, focus: 0, gap: 5 },
            // Ensure points are reset when connecting to follow new path
            points: [0, 0, endP.x - startP.x, endP.y - startP.y]
        });

        // Update boundElements
        const updateBindings = (el: DrawingElement, lineId: string) => {
            const existing = el.boundElements || [];
            if (!existing.find(b => b.id === lineId)) {
                this.updateElement(el.id, { boundElements: [...existing, { id: lineId, type: type as 'arrow' }] });
            }
        };

        updateBindings(source, id);
        updateBindings(target, id);

        return id;
    },

    // History
    undo() { undo(); },
    redo() { redo(); },

    // Grouping
    groupSelection() { groupSelected(); },
    ungroupSelection() { ungroupSelected(); },

    // Transformation
    duplicate(id: string) { duplicateElement(id); },
    toggleTheme() { toggleTheme(); },

    // Layers
    addLayer(name?: string) { return addLayer(name); },
    deleteLayer(id: string) { deleteLayer(id); },
    setActiveLayer(id: string) { setActiveLayer(id); },
    mergeLayerDown(id: string) { mergeLayerDown(id); },
    flattenLayers() { flattenLayers(); },
    isolateLayer(id: string) { isolateLayer(id); },
    showAllLayers() { showAllLayers(); },
    updateLayer(id: string, updates: Partial<Layer>) { updateLayer(id, updates); },
    duplicateLayer(id: string) { duplicateLayer(id); },
    reorderLayers(fromIndex: number, toIndex: number) { reorderLayers(fromIndex, toIndex); },
    moveElementsToLayer(elementIds: string[], targetLayerId: string) { moveElementsToLayer(elementIds, targetLayerId); },
    createLayerGroup(name?: string) { createLayerGroup(name); },
    toggleLayerGroupExpansion(groupId: string) { toggleLayerGroupExpansion(groupId); },
    isLayerVisible(layerId: string) { return isLayerVisible(layerId); },
    isLayerLocked(layerId: string) { return isLayerLocked(layerId); },

    // Grid & Snapping
    toggleGrid() { toggleGrid(); },
    toggleSnapToGrid() { toggleSnapToGrid(); },

    // Display States
    addDisplayState(name: string) { addDisplayState(name); },
    updateDisplayState(id: string) { updateDisplayState(id); },
    deleteDisplayState(id: string) { deleteDisplayState(id); },
    applyDisplayState(id: string, animate: boolean = true) { applyDisplayState(id, animate); },
    toggleStatePanel(visible?: boolean) { toggleStatePanel(visible); },
    applyNextState() { applyNextState(); },
    applyPreviousState() { applyPreviousState(); },

    // Hierarchy / Mindmap actions
    addChildNode(parentId: string) { addChildNode(parentId); },
    addSiblingNode(siblingId: string) { addSiblingNode(siblingId); },
    toggleCollapseSelection() { toggleCollapseSelection(); },
    toggleCollapse(id: string) { toggleCollapse(id); },
    setParent(childId: string, parentId: string | null) { setParent(childId, parentId); },
    reorderMindmap(rootId: string, direction: LayoutDirection) { reorderMindmap(rootId, direction); },
    applyMindmapStyling(rootId: string) { applyMindmapStyling(rootId); },

    // UI Panels
    toggleCommandPalette(visible?: boolean) { toggleCommandPalette(visible); },
    togglePropertyPanel(visible?: boolean) { togglePropertyPanel(visible); },
    togglePresentationMode(visible?: boolean) { togglePresentationMode(visible); },
    toggleLayerPanel(visible?: boolean) { toggleLayerPanel(visible); },
    toggleMinimap(visible?: boolean) { toggleMinimap(visible); },
    toggleZenMode(visible?: boolean) { toggleZenMode(visible); },
    toggleSlideNavigator(visible?: boolean) { toggleSlideNavigator(visible); },
    toggleMainToolbar(visible?: boolean) { toggleMainToolbar(visible); },
    toggleUtilityToolbar(visible?: boolean) { toggleUtilityToolbar(visible); },
    toggleSlideToolbar(visible?: boolean) { toggleSlideToolbar(visible); },
    setSlideToolbarPosition(x: number, y: number) { setSlideToolbarPosition(x, y); },

    // Slides
    addSlide() { addSlide(); },
    deleteSlide(index: number) { deleteSlide(index); },
    duplicateSlide(index: number) { duplicateSlide(index); },
    setActiveSlide(index: number) { setActiveSlide(index); },
    reorderSlides(fromIndex: number, toIndex: number) { reorderSlides(fromIndex, toIndex); },
    updateSlideTransition(slideIndex: number, transition: Partial<SlideTransition>) { updateSlideTransition(slideIndex, transition); },
    updateSlideBackground(slideIndex: number, updates: Partial<Slide> | string) { updateSlideBackground(slideIndex, updates); },
    advancePresentation() { return advancePresentation(); },
    retreatPresentation() { return retreatPresentation(); },
    goToFirstSlide() { return setActiveSlide(0); },
    goToLastSlide() { return setActiveSlide(store.slides.length - 1); },
    setDocType(type: 'infinite' | 'slides') { setDocType(type); },
    loadDocument(doc: any) { loadDocument(doc); },
    resetToNewDocument(docType: 'infinite' | 'slides' = 'slides') { resetToNewDocument(docType); },

    // Z-Order
    bringToFront(ids: string[]) { bringToFront(ids); },
    sendToBack(ids: string[]) { sendToBack(ids); },
    moveElementZIndex(id: string, direction: 'front' | 'back' | 'forward' | 'backward') { moveElementZIndex(id, direction); },

    // Alignment & Distribution
    alignSelectedElements(type: AlignmentType) { alignSelectedElements(type); },
    distributeSelectedElements(type: DistributionType) { distributeSelectedElements(type); },

    // Canvas
    setCanvasBackgroundColor(color: string) { setCanvasBackgroundColor(color); },
    setCanvasTexture(texture: 'none' | 'dots' | 'grid' | 'graph' | 'paper') { setCanvasTexture(texture); },
    zoomToFitSlide() { zoomToFitSlide(); },

    // Tool Selection
    setSelectedTool(tool: ElementType | 'selection') { setSelectedTool(tool); },
    moveSelectedElements(dx: number, dy: number) { moveSelectedElements(dx, dy, true); },

    // Template
    loadTemplate(templateData: any) { loadTemplate(templateData); },

    // Animation
    animateElement,
    animateElements,
    createTimeline,
    fadeIn,
    fadeOut,
    scaleIn,
    bounce,
    pulse,
    shakeX,
    stopElementAnimation,
    pauseElementAnimation,
    resumeElementAnimation,
    easings,
    animationEngine,
    createSpring,

    // Clipboard & Style
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    copyStyle,
    pasteStyle
};

declare global {
    interface Window {
        Yappy: typeof YappyAPI;
    }
}

export const initAPI = () => {
    window.Yappy = YappyAPI;
    console.log("Yappy API initialized. Use window.Yappy to interact.");
};
