/**
 * Measure-to-neighbor geometry (Precision & Measurement — Phase 2).
 *
 * Pure functions that turn two axis-aligned boxes (the current selection and an
 * Alt-hovered target) — plus an optional enclosing artboard — into a flat list of
 * dimension segments the overlay renderer draws as arrowed measure lines.
 *
 * No store access, no DOM: everything is world-space maths so it's trivially
 * unit-testable and identical on every render path. Rotation is ignored (v1
 * axis-aligned bbox), consistent with the transform HUD and dimension annotations.
 */

export interface Rect { x: number; y: number; width: number; height: number; }

export interface MeasureSegment {
    /** Axis the dimension line runs along. `horizontal` = a left↔right gap. */
    orientation: 'horizontal' | 'vertical';
    /** World coordinate of the segment's start along its axis. */
    from: number;
    /** World coordinate of the segment's end along its axis (`to >= from`). */
    to: number;
    /** Perpendicular world coordinate where the line + label sit. */
    coordinate: number;
    /** Labelled pixel value ( = `to - from`, always ≥ 0). */
    distance: number;
    /** `gap` = between selection and a neighbour; `edge` = to an artboard side. */
    kind: 'gap' | 'edge';
}

interface Bounds { minX: number; minY: number; maxX: number; maxY: number; cx: number; cy: number; }

const bounds = (r: Rect): Bounds => ({
    minX: r.x, minY: r.y, maxX: r.x + r.width, maxY: r.y + r.height,
    cx: r.x + r.width / 2, cy: r.y + r.height / 2,
});

/**
 * Gap segments between the selection and a neighbouring box.
 * Returns one segment per axis on which the two boxes are *separated*:
 *  - side-by-side (vertical overlap) → one horizontal gap,
 *  - stacked (horizontal overlap)    → one vertical gap,
 *  - diagonal (separated both axes)  → two segments (an L),
 *  - overlapping on both axes        → none.
 * Each line is drawn through the overlap band when one exists, else midway
 * between the two box centres.
 */
export function measureGap(sel: Rect, target: Rect): MeasureSegment[] {
    const s = bounds(sel), t = bounds(target);
    const segs: MeasureSegment[] = [];

    // Horizontal gap (boxes separated along X)
    if (s.minX >= t.maxX || t.minX >= s.maxX) {
        const left = s.minX >= t.maxX ? t : s;
        const right = left === t ? s : t;
        const from = left.maxX, to = right.minX;
        const ovTop = Math.max(s.minY, t.minY), ovBot = Math.min(s.maxY, t.maxY);
        const coordinate = ovTop <= ovBot ? (ovTop + ovBot) / 2 : (s.cy + t.cy) / 2;
        segs.push({ orientation: 'horizontal', from, to, coordinate, distance: to - from, kind: 'gap' });
    }

    // Vertical gap (boxes separated along Y)
    if (s.minY >= t.maxY || t.minY >= s.maxY) {
        const top = s.minY >= t.maxY ? t : s;
        const bottom = top === t ? s : t;
        const from = top.maxY, to = bottom.minY;
        const ovL = Math.max(s.minX, t.minX), ovR = Math.min(s.maxX, t.maxX);
        const coordinate = ovL <= ovR ? (ovL + ovR) / 2 : (s.cx + t.cx) / 2;
        segs.push({ orientation: 'vertical', from, to, coordinate, distance: to - from, kind: 'gap' });
    }

    return segs;
}

/**
 * Distance segments from the selection to each of the four artboard edges.
 * Only sides the selection sits inside of are emitted (distance > 0), so a
 * selection flush to or outside an edge simply drops that segment.
 */
export function measureEdges(sel: Rect, artboard: Rect): MeasureSegment[] {
    const s = bounds(sel), a = bounds(artboard);
    const segs: MeasureSegment[] = [];

    if (s.minX > a.minX) segs.push({ orientation: 'horizontal', from: a.minX, to: s.minX, coordinate: s.cy, distance: s.minX - a.minX, kind: 'edge' });
    if (a.maxX > s.maxX) segs.push({ orientation: 'horizontal', from: s.maxX, to: a.maxX, coordinate: s.cy, distance: a.maxX - s.maxX, kind: 'edge' });
    if (s.minY > a.minY) segs.push({ orientation: 'vertical', from: a.minY, to: s.minY, coordinate: s.cx, distance: s.minY - a.minY, kind: 'edge' });
    if (a.maxY > s.maxY) segs.push({ orientation: 'vertical', from: s.maxY, to: a.maxY, coordinate: s.cx, distance: a.maxY - s.maxY, kind: 'edge' });

    return segs;
}

/** Combine neighbour gaps and artboard-edge distances into one segment list. */
export function getMeasureSegments(sel: Rect, target: Rect | null, artboard: Rect | null): MeasureSegment[] {
    return [
        ...(target ? measureGap(sel, target) : []),
        ...(artboard ? measureEdges(sel, artboard) : []),
    ];
}
