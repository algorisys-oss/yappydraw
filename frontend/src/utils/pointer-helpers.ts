/**
 * Pointer Helpers
 * Type definitions for the helper functions and signals that tool handlers
 * need from canvas.tsx. These interfaces enable the handler modules to
 * remain decoupled from the canvas component's internal closures.
 */

import type { DrawingElement, TableCellSelection } from '../types';
import type { SnappingGuide } from './object-snapping';
import type { SpacingGuide } from './spacing';

/**
 * Canvas-local helper functions needed by tool handlers.
 */
export interface PointerHelpers {
    getWorldCoordinates: (clientX: number, clientY: number) => { x: number; y: number };
    canInteractWithElement: (el: DrawingElement) => boolean;
    checkBinding: (x: number, y: number, excludeId: string) => { element: DrawingElement; snapPoint: { x: number; y: number }; position: string } | null;
    refreshLinePoints: (line: DrawingElement, overrideStartX?: number, overrideStartY?: number, overrideEndX?: number, overrideEndY?: number) => any;
    refreshBoundLine: (lineId: string) => void;
    flushPenPoints: () => void;
    applyMasterProjection: (el: DrawingElement) => DrawingElement;
    normalizePencil: (el: DrawingElement) => { x: number; y: number; width: number; height: number; points: { x: number; y: number }[] } | null;
    commitText: () => void;
    draw: () => void;
    setCursor: (c: string) => void;
    setTableCellSelection: (sel: TableCellSelection | null) => void;
}

/**
 * SolidJS signal accessors/setters used by tool handlers.
 */
export interface PointerSignals {
    editingId: () => string | null;
    setEditingId: (v: string | null) => void;
    setEditText: (v: string) => void;
    setRichTextSpans: (v: any[]) => void;
    selectionBox: () => { x: number; y: number; w: number; h: number } | null;
    setSelectionBox: (v: { x: number; y: number; w: number; h: number } | null) => void;
    lassoPoints: () => { x: number; y: number }[] | null;
    setLassoPoints: (v: { x: number; y: number }[] | null) => void;
    suggestedBinding: () => { elementId: string; px: number; py: number; position?: string } | null;
    setSuggestedBinding: (v: { elementId: string; px: number; py: number; position?: string } | null) => void;
    snappingGuides: () => SnappingGuide[];
    setSnappingGuides: (v: SnappingGuide[]) => void;
    spacingGuides: () => SpacingGuide[];
    setSpacingGuides: (v: SpacingGuide[]) => void;
    setPointSnap: (v: { x: number; y: number } | null) => void;
    reparentDropTarget: () => string | null;
    setReparentDropTarget: (v: string | null) => void;
    poolLaneDropTarget: () => { poolId: string; laneIndex: number } | null;
    setPoolLaneDropTarget: (v: { poolId: string; laneIndex: number } | null) => void;
    // Live drop feedback while drag-reordering a table column.
    tableColumnDrop: () => { elementId: string; sourceCol: number; targetCol: number } | null;
    setTableColumnDrop: (v: { elementId: string; sourceCol: number; targetCol: number } | null) => void;
    textInputRef?: HTMLTextAreaElement;
}
