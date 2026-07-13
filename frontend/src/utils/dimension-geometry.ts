/**
 * Persistent dimension annotations (precision-measurement plan, Phase 5 + polish).
 *
 * A `DimensionAnnotation` attaches to an element and measures a span of it, drawing a
 * CAD-style dimension that AUTO-UPDATES as the target moves / resizes / rotates /
 * animates. This module is the pure, testable geometry core shared by the renderer
 * and the tests — no canvas, no store.
 *
 * Measures:
 *  - `width` / `height` — linear, now **rotation-aware** (measured along the rotated
 *    element's edge, dimension line offset along that edge's outward normal),
 *  - `radius` / `diameter` — radial, for circle/ellipse-like elements,
 *  - `angle` — angular, the element's rotation drawn as an arc from the +x axis.
 */

import { formatLength, type MeasurementUnit } from './units';

export type DimensionMeasure = 'width' | 'height' | 'radius' | 'diameter' | 'angle';

export interface DimensionAnnotation {
    id: string;
    targetId: string;
    measure: DimensionMeasure;
    offset: number;            // gap (world px) from the element edge to the dimension line
    color?: string;
    label?: string;            // optional label override (else the measured value)
}

/** Minimal element shape the geometry needs. `angle` (radians) makes it rotation-aware. */
export interface DimBox { x: number; y: number; width: number; height: number; angle?: number }

export interface Pt { x: number; y: number }

export interface DimensionGeometry {
    kind: 'linear' | 'radial' | 'angular';
    /** Measured value: world px for linear/radial, degrees for angular. */
    value: number;
    mid: Pt;                    // label anchor
    // linear / radial:
    e1?: Pt; e2?: Pt;           // measured endpoints (edge or centre→rim)
    d1?: Pt; d2?: Pt;           // dimension-line endpoints
    extension?: boolean;        // draw extension lines (linear only)
    arrowsBothEnds?: boolean;   // 2 arrowheads (linear/diameter) vs 1 (radius)
    orientation?: 'horizontal' | 'vertical';
    // angular:
    center?: Pt; radius?: number; startAngle?: number; endAngle?: number;
}

const rot = (px: number, py: number, cx: number, cy: number, a: number): Pt => {
    if (!a) return { x: px, y: py };
    const c = Math.cos(a), s = Math.sin(a), dx = px - cx, dy = py - cy;
    return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
};

export function dimensionGeometry(dim: DimensionAnnotation, box: DimBox): DimensionGeometry {
    const off = dim.offset ?? 24;
    const a = box.angle ?? 0;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

    // ── Radial ──
    if (dim.measure === 'radius' || dim.measure === 'diameter') {
        const rx = box.width / 2;
        const center: Pt = { x: cx, y: cy };
        const right = rot(cx + rx, cy, cx, cy, a);
        if (dim.measure === 'radius') {
            return { kind: 'radial', value: rx, e1: center, e2: right, d1: center, d2: right,
                arrowsBothEnds: false, mid: { x: (center.x + right.x) / 2, y: (center.y + right.y) / 2 } };
        }
        const left = rot(cx - rx, cy, cx, cy, a);
        return { kind: 'radial', value: box.width, e1: left, e2: right, d1: left, d2: right,
            arrowsBothEnds: true, mid: { x: cx, y: cy } };
    }

    // ── Angular (element rotation as an arc from +x) ──
    if (dim.measure === 'angle') {
        const deg = ((a * 180 / Math.PI) % 360 + 360) % 360;
        const radius = Math.max(12, Math.min(box.width, box.height) / 3 + off);
        return { kind: 'angular', value: deg, center: { x: cx, y: cy }, radius,
            startAngle: 0, endAngle: a, mid: rot(cx + radius, cy, cx, cy, a / 2) };
    }

    // ── Linear width/height (rotation-aware) ──
    // Corners of the (possibly rotated) box.
    const isWidth = dim.measure === 'width';
    // width → bottom edge (BL→BR); height → right edge (TR→BR).
    const p1 = isWidth ? { x: box.x, y: box.y + box.height } : { x: box.x + box.width, y: box.y };
    const p2 = { x: box.x + box.width, y: box.y + box.height };
    const e1 = rot(p1.x, p1.y, cx, cy, a);
    const e2 = rot(p2.x, p2.y, cx, cy, a);
    // Outward normal of the edge (pointing away from the centre).
    const ex = e2.x - e1.x, ey = e2.y - e1.y, len = Math.hypot(ex, ey) || 1;
    let nx = -ey / len, ny = ex / len;
    const emx = (e1.x + e2.x) / 2, emy = (e1.y + e2.y) / 2;
    if ((emx - cx) * nx + (emy - cy) * ny < 0) { nx = -nx; ny = -ny; }
    const d1: Pt = { x: e1.x + nx * off, y: e1.y + ny * off };
    const d2: Pt = { x: e2.x + nx * off, y: e2.y + ny * off };
    return {
        kind: 'linear',
        value: isWidth ? box.width : box.height,
        e1, e2, d1, d2, extension: true, arrowsBothEnds: true,
        orientation: isWidth ? 'horizontal' : 'vertical',
        mid: { x: (d1.x + d2.x) / 2, y: (d1.y + d2.y) / 2 },
    };
}

/** The text drawn on a dimension: the override, or the value in the active unit. */
export function dimensionLabel(dim: DimensionAnnotation, geo: DimensionGeometry, unit: MeasurementUnit = 'px'): string {
    if (dim.label) return dim.label;
    if (geo.kind === 'angular') return `${Math.round(geo.value)}°`;
    return formatLength(geo.value, unit);
}
