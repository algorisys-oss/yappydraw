/**
 * Layout Types — Shared types for DSL layout strategies.
 */

export interface NodePosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type LayoutPositionMap = Map<string, NodePosition>;

export interface LayoutConfig {
    hSpacing: number;
    vSpacing: number;
    columns?: number;
    origin: { x: number; y: number };
    /** Width to lay out for, in px. Undefined means natural width. See layout/width.ts. */
    targetWidth?: number;
}
