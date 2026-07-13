/**
 * Measure-tool readout geometry (Precision & Measurement — Phase 3).
 *
 * Pure maths for the richer Measure readout: the Δx/Δy/diagonal/angle of a drawn
 * measuring line (for the right-triangle overlay), and the W/H/area/perimeter of a
 * single selected shape. No store/DOM — trivially unit-testable, identical on every
 * render path. Values are in world units (canvas px at scale 1).
 */

export interface LineReadout {
    /** Signed horizontal span (x2 − x1). */
    dx: number;
    /** Signed vertical span (y2 − y1). */
    dy: number;
    /** Diagonal length (the hypotenuse). */
    dist: number;
    /** Angle from the +x axis, CCW-positive (screen y is down, so dy is negated). */
    angle: number;
}

export function measureLine(x1: number, y1: number, x2: number, y2: number): LineReadout {
    const dx = x2 - x1, dy = y2 - y1;
    const angle = Math.atan2(-dy, dx) * 180 / Math.PI;
    return { dx, dy, dist: Math.hypot(dx, dy), angle: Object.is(angle, -0) ? 0 : angle };
}

export interface ShapeMetrics {
    width: number;
    height: number;
    /** Filled area (shape-aware for circles/ellipses & lines; bbox otherwise). */
    area: number;
    /** Outline length (ellipse circumference / segment length / bbox perimeter). */
    perimeter: number;
}

/** Ramanujan's approximation for the circumference of an ellipse with semi-axes a, b. */
function ellipsePerimeter(a: number, b: number): number {
    const s = a + b;
    if (s === 0) return 0;
    const h = ((a - b) * (a - b)) / (s * s);
    return Math.PI * s * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/**
 * W/H/area/perimeter for a shape, from its axis-aligned bounding box.
 *  - `circle` (Yappy's ellipse): true ellipse area + Ramanujan circumference,
 *  - `line`/`arrow`: zero area, perimeter = the segment length (bbox diagonal),
 *  - everything else: rectangle bbox (area = w·h, perimeter = 2(w+h)).
 */
export function shapeMetrics(el: { type: string; width: number; height: number }): ShapeMetrics {
    const width = Math.abs(el.width), height = Math.abs(el.height);
    let area: number, perimeter: number;
    switch (el.type) {
        case 'circle': {
            const a = width / 2, b = height / 2;
            area = Math.PI * a * b;
            perimeter = ellipsePerimeter(a, b);
            break;
        }
        case 'line':
        case 'arrow':
            area = 0;
            perimeter = Math.hypot(width, height);
            break;
        default:
            area = width * height;
            perimeter = 2 * (width + height);
    }
    return { width, height, area, perimeter };
}
