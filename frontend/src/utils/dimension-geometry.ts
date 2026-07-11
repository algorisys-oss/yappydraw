/**
 * Persistent dimension annotations (precision-measurement plan, Phase 5).
 *
 * A `DimensionAnnotation` attaches to an element and measures its width or height,
 * drawing a CAD-style dimension line (extension lines + arrowheads + a numeric label)
 * that AUTO-UPDATES as the target moves / resizes / animates. This module is the pure,
 * testable geometry core shared by the renderer and the tests — no canvas, no store.
 */

export type DimensionMeasure = 'width' | 'height';

export interface DimensionAnnotation {
    id: string;
    targetId: string;          // element being measured
    measure: DimensionMeasure; // which span
    offset: number;            // gap (world px) from the element edge to the dimension line
    color?: string;            // line/label colour (default accent)
    label?: string;            // optional label override (else the measured value)
}

/** Minimal element shape the geometry needs (works with stored or animated bounds). */
export interface DimBox { x: number; y: number; width: number; height: number }

export interface Pt { x: number; y: number }

export interface DimensionGeometry {
    /** The measured value in world px (width or height). */
    value: number;
    /** The two edge endpoints being measured (on the element's bbox). */
    e1: Pt;
    e2: Pt;
    /** The dimension line endpoints (offset out from the edge). */
    d1: Pt;
    d2: Pt;
    /** Midpoint of the dimension line — where the label sits. */
    mid: Pt;
    /** 'horizontal' for width dimensions, 'vertical' for height. */
    orientation: 'horizontal' | 'vertical';
}

/**
 * Compute a dimension's geometry from the target's (axis-aligned) bounding box.
 * Width dimensions sit `offset` px BELOW the box; height dimensions sit `offset` px
 * to the RIGHT. Rotation is ignored in v1 (uses the axis-aligned bbox, like the HUD).
 */
export function dimensionGeometry(dim: DimensionAnnotation, box: DimBox): DimensionGeometry {
    const off = dim.offset ?? 24;
    if (dim.measure === 'width') {
        const y = box.y + box.height;               // bottom edge
        const e1: Pt = { x: box.x, y };
        const e2: Pt = { x: box.x + box.width, y };
        const dy = y + off;
        const d1: Pt = { x: e1.x, y: dy };
        const d2: Pt = { x: e2.x, y: dy };
        return {
            value: box.width,
            e1, e2, d1, d2,
            mid: { x: (d1.x + d2.x) / 2, y: dy },
            orientation: 'horizontal',
        };
    }
    // height
    const x = box.x + box.width;                    // right edge
    const e1: Pt = { x, y: box.y };
    const e2: Pt = { x, y: box.y + box.height };
    const dx = x + off;
    const d1: Pt = { x: dx, y: e1.y };
    const d2: Pt = { x: dx, y: e2.y };
    return {
        value: box.height,
        e1, e2, d1, d2,
        mid: { x: dx, y: (d1.y + d2.y) / 2 },
        orientation: 'vertical',
    };
}

/** The text drawn on a dimension: the override, or the rounded value in px. */
export function dimensionLabel(dim: DimensionAnnotation, value: number): string {
    if (dim.label) return dim.label;
    return `${Math.round(value)} px`;
}
