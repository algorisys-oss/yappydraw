/**
 * Text on Path — lay text out along an arbitrary path.
 *
 * One arc-length layout engine for every path-like element: connectors
 * (line/arrow/bezier/elbow), polylines, freehand pen strokes, closed shape
 * outlines, and Pen-tool vector paths (`path` elements). Callers convert their geometry to an absolute-coordinate
 * polyline (via `getElementTextPath`) and hand it to `drawTextAlongPath`;
 * beziers are pre-sampled into points so the engine only ever walks segments.
 *
 * Pure render-side helper — no WASM counterpart (not on the hot hit-testing
 * path; runs once per element per frame during draw).
 */

import type { IRenderer } from "../rendering/IRenderer";
import type { DrawingElement, PathAnchor } from "../types";
import { normalizePoints } from "./points";
import { getPathSubpaths } from "./math/path-utils";
import { hasLiveCorners, filletAnchors } from "./path-corners";
import { cornerRadiiPx, type CornerRadii } from "./corner-radius";

// Local copy rather than an import from ./render-element: that module pulls in the shape
// registry, and the store needs this file (attachTextToPath) without the render graph.
const cubicBezier = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const k = 1 - t;
    return k * k * k * p0 + 3 * k * k * t * p1 + 3 * k * t * t * p2 + t * t * t * p3;
};

export interface PathPoint { x: number; y: number; }

export interface TextPathOptions {
    /** Treat the path as a closed loop (appends the closing segment). */
    closed?: boolean;
    /** Where the text starts, 0..1 of total path length (0 = path start / top of a loop). */
    startOffset?: number;
    /** Extra spacing between glyphs, in px (can be negative to tighten). */
    letterSpacing?: number;
    /** Perpendicular baseline offset off the path. Default -fontSize*0.8 (just above). */
    sideOffset?: number;
    /** Keep glyphs upright (flip 180° when they'd be upside-down). Default = `closed`,
     *  forced off by `flip`. */
    upright?: boolean;
    /** 'center' = `startOffset` marks the middle of the text rather than its first glyph. */
    align?: 'start' | 'center';
    /**
     * Put the text on the other side of the path, still reading left-to-right.
     *
     * Closed loop: run the text the other way round. This is how the bottom arc of a badge
     * reads: on a clockwise loop the per-glyph `upright` flip alone turns each glyph over but
     * leaves the RUN right-to-left ("CBA"), so flip reverses the loop instead and turns
     * `upright` off. The loop keeps its start point, so `startOffset` measures from the same place.
     *
     * Open path: mirror the baseline offset. Reversing an open path (Illustrator's literal flip)
     * only hangs the text upside-down under the curve; the auto-readable direction already
     * handles which way it runs, so "other side" here just means below instead of above.
     */
    flip?: boolean;
}

/** The TextPathOptions an element's curved-text props ask for — shared by every renderer so a
 *  new option can't reach one element type and not another. */
export function textPathOptionsFor(el: DrawingElement, fontSize: number, closed: boolean): TextPathOptions {
    return {
        closed,
        startOffset: el.textPathOffset,
        letterSpacing: el.textPathSpacing,
        sideOffset: el.textPathSide === 'outside' ? fontSize * 0.4 : undefined,
        align: el.textPathAlign,
        flip: !!el.textPathFlip,
    };
}

const noPaint = (c?: string | null) => !c || c === 'transparent' || c === 'none';

/**
 * Colour for curved text: its own textColor, else the stroke, else black. The stroke fallback
 * alone made the text vanish exactly when a designer hid the carrying path — a transparent
 * ring under badge text, the Illustrator "path disappears, text stays" look.
 */
export function curvedTextColor(el: DrawingElement): string {
    if (!noPaint(el.textColor)) return el.textColor as string;
    if (!noPaint(el.strokeColor)) return el.strokeColor;
    return '#000000';
}

/** Reverse a polyline's direction; a closed loop keeps its first point (so offsets still
 *  measure from the same place) and runs round the other way. */
export function reversePath(points: PathPoint[], closed: boolean): PathPoint[] {
    if (!closed) return points.slice().reverse();
    return points.length ? [points[0], ...points.slice(1).reverse()] : [];
}

interface ArcTable { pts: PathPoint[]; cum: number[]; total: number; }

function buildArcTable(points: PathPoint[], closed: boolean): ArcTable {
    const pts = closed && points.length > 2 ? [...points, points[0]] : points;
    const cum: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
        cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    return { pts, cum, total: cum[cum.length - 1] };
}

/** Position + tangent angle at arc-length distance `d` along the polyline. */
function locateAtDistance(table: ArcTable, d: number): { x: number; y: number; angle: number } {
    const { pts, cum, total } = table;
    const dd = Math.max(0, Math.min(total, d));
    // Binary search for the segment whose cumulative length first exceeds dd.
    let lo = 1, hi = cum.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < dd) lo = mid + 1; else hi = mid;
    }
    const i = lo - 1; // segment pts[i] → pts[i+1]
    const segLen = (cum[i + 1] - cum[i]) || 1;
    const f = (dd - cum[i]) / segLen;
    const ax = pts[i].x, ay = pts[i].y;
    const bx = pts[i + 1].x, by = pts[i + 1].y;
    return {
        x: ax + (bx - ax) * f,
        y: ay + (by - ay) * f,
        angle: Math.atan2(by - ay, bx - ax),
    };
}

/**
 * Render `text` glyph-by-glyph along `points` (absolute coords). The caller is
 * responsible for setting font / fillStyle on the renderer beforehand.
 */
export function drawTextAlongPath(
    renderer: IRenderer,
    text: string,
    points: PathPoint[],
    fontSize: number,
    opts: TextPathOptions = {},
): void {
    if (!text || !points || points.length < 2) return;
    const closed = !!opts.closed;
    const reverseLoop = !!opts.flip && closed;
    const table = buildArcTable(reverseLoop ? reversePath(points, closed) : points, closed);
    if (table.total < 1) return;

    const chars = [...text];
    const widths = chars.map(c => renderer.measureText(c).width);
    const baseSide = opts.sideOffset ?? -fontSize * 0.8;
    const sideOffset = opts.flip && !closed ? -baseSide : baseSide;
    const letterSpacing = opts.letterSpacing ?? 0;
    const upright = reverseLoop ? false : (opts.upright ?? closed);

    // Open paths: flip the whole run so text reads left-to-right when the path
    // runs right-to-left (matches the original curved-text behaviour).
    let flip = false;
    if (!closed) {
        const mid = locateAtDistance(table, table.total / 2).angle;
        flip = mid > Math.PI / 2 || mid < -Math.PI / 2;
    }
    const order = flip ? chars.slice().reverse() : chars;
    const w = flip ? widths.slice().reverse() : widths;

    // Start at the requested fraction of the path (default 0 = path start / top
    // of a loop). The caller centers by passing startOffset accordingly.
    let curDist = (opts.startOffset ?? 0) * table.total;
    if (opts.align === 'center') {
        const runLength = w.reduce((a, b) => a + b, 0) + letterSpacing * Math.max(0, w.length - 1);
        curDist -= runLength / 2;
    }

    renderer.textAlign = 'center';
    renderer.textBaseline = 'middle';

    for (let i = 0; i < order.length; i++) {
        curDist += w[i] / 2;
        let d = curDist;
        if (closed) d = ((d % table.total) + table.total) % table.total;
        const loc = locateAtDistance(table, d);
        let angle = loc.angle;
        if (flip) angle += Math.PI;
        if (upright && (angle > Math.PI / 2 || angle < -Math.PI / 2)) angle += Math.PI;

        renderer.save();
        renderer.translate(loc.x, loc.y);
        renderer.rotate(angle);
        renderer.fillText(order[i], 0, sideOffset);
        renderer.restore();

        curDist += w[i] / 2 + letterSpacing;
    }
}

// ─── Path extraction ────────────────────────────────────────────────────────

const BEZIER_SAMPLES = 64;
const PATH_SEGMENT_SAMPLES = 24;
const ELLIPSE_SAMPLES = 72;

// Closed primitives we build an explicit outline for. Anything else closed
// falls back to its bounding ellipse.
const CLOSED_SHAPES = new Set<string>([
    'rectangle', 'circle', 'diamond', 'triangle',
    'pentagon', 'hexagon', 'septagon', 'octagon', 'polygon',
    'capsule', 'parallelogram', 'star',
]);

export function isClosedShapeForText(type: string): boolean {
    return CLOSED_SHAPES.has(type);
}

function ellipseOutline(cx: number, cy: number, rx: number, ry: number): PathPoint[] {
    const out: PathPoint[] = [];
    for (let i = 0; i < ELLIPSE_SAMPLES; i++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / ELLIPSE_SAMPLES; // start at top, clockwise
        out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    }
    return out;
}

function regularPolygonOutline(cx: number, cy: number, rx: number, ry: number, n: number): PathPoint[] {
    const out: PathPoint[] = [];
    for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / n;
        out.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
    }
    return out;
}

const CORNER_SAMPLES = 12;

/**
 * Rounded-rect outline from the top-middle, clockwise. Corners are the same QUADRATIC curves the
 * renderer draws (roundedRectPath / getRoundedRectPath), so the text follows the drawn edge.
 * Radii are [tl, tr, br, bl], each clamped to half the shorter side as the renderer does.
 */
function roundedRectOutline(x: number, y: number, w: number, h: number, radii: CornerRadii): PathPoint[] {
    const cap = Math.min(Math.abs(w), Math.abs(h)) / 2;
    const [tl, tr, br, bl] = radii.map(r => Math.max(0, Math.min(cap, r)));
    const out: PathPoint[] = [{ x: x + w / 2, y }];
    // Quadratic corner from p0 via control c to p2, excluding p0 (already emitted).
    const corner = (p0: PathPoint, c: PathPoint, p2: PathPoint, r: number) => {
        if (r <= 0) { out.push(c); return; }
        out.push(p0);
        for (let i = 1; i <= CORNER_SAMPLES; i++) {
            const t = i / CORNER_SAMPLES, k = 1 - t;
            out.push({ x: k * k * p0.x + 2 * k * t * c.x + t * t * p2.x, y: k * k * p0.y + 2 * k * t * c.y + t * t * p2.y });
        }
    };
    corner({ x: x + w - tr, y }, { x: x + w, y }, { x: x + w, y: y + tr }, tr);
    corner({ x: x + w, y: y + h - br }, { x: x + w, y: y + h }, { x: x + w - br, y: y + h }, br);
    corner({ x: x + bl, y: y + h }, { x, y: y + h }, { x, y: y + h - bl }, bl);
    corner({ x, y: y + tl }, { x, y }, { x: x + tl, y }, tl);
    return out;
}

/** Outline polyline (absolute coords, starting at top, clockwise) for a closed shape. */
export function getOutlinePath(el: DrawingElement): PathPoint[] {
    const x = el.x, y = el.y, w = el.width, h = el.height;
    const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
    const topMid = { x: cx, y };
    const TR = { x: x + w, y }, BR = { x: x + w, y: y + h }, BL = { x, y: y + h }, TL = { x, y };

    switch (el.type) {
        case 'rectangle': {
            const radii = cornerRadiiPx(el as any);
            return radii.some(r => r > 0) ? roundedRectOutline(x, y, w, h, radii) : [topMid, TR, BR, BL, TL];
        }
        case 'capsule': {
            const r = Math.min(Math.abs(w), Math.abs(h)) / 2;       // shape-geometry: getRoundedRectPath(…, min/2)
            return roundedRectOutline(x, y, w, h, [r, r, r, r]);
        }
        case 'parallelogram': {
            const off = w * 0.2;                                     // shape-geometry's skew
            return [{ x: x + (w + off) / 2, y }, { x: x + w, y }, { x: x + w - off, y: y + h }, { x, y: y + h }, { x: x + off, y }];
        }
        case 'diamond':
            return [topMid, { x: x + w, y: cy }, { x: cx, y: y + h }, { x, y: cy }];
        case 'triangle':
            return [topMid, BR, BL];
        case 'pentagon': return regularPolygonOutline(cx, cy, rx, ry, 5);
        case 'hexagon': return regularPolygonOutline(cx, cy, rx, ry, 6);
        case 'septagon': return regularPolygonOutline(cx, cy, rx, ry, 7);
        case 'octagon': return regularPolygonOutline(cx, cy, rx, ry, 8);
        case 'polygon': return regularPolygonOutline(cx, cy, rx, ry, (el as any).sides || 6);
        case 'circle':
        default:
            return ellipseOutline(cx, cy, rx, ry); // includes star/unknown fallback
    }
}

function sampleBezier(start: PathPoint, cp1: PathPoint, cp2: PathPoint, end: PathPoint): PathPoint[] {
    const out: PathPoint[] = [];
    for (let i = 0; i <= BEZIER_SAMPLES; i++) {
        const t = i / BEZIER_SAMPLES;
        out.push({
            x: cubicBezier(start.x, cp1.x, cp2.x, end.x, t),
            y: cubicBezier(start.y, cp1.y, cp2.y, end.y, t),
        });
    }
    return out;
}

/**
 * A Pen-tool `path` element's first subpath as an absolute polyline. Anchors are
 * origin-relative with handles relative to their anchor (see PathAnchor); Live Corners are
 * filleted first so the text follows the rounded outline that is actually drawn. A closed
 * subpath's closing segment is sampled too, minus the repeated start point (buildArcTable
 * closes the loop itself). Only the first subpath carries text — the others are holes or
 * islands, and text hopping between contours would be unreadable.
 */
export function pathElementPolyline(el: DrawingElement): { points: PathPoint[]; closed: boolean } | null {
    const sub = getPathSubpaths(el)[0];
    if (!sub) return null;
    const anchors: PathAnchor[] = hasLiveCorners(sub.anchors) ? filletAnchors(sub.anchors, sub.closed) : sub.anchors;
    if (anchors.length < 2) return null;
    const ox = el.x, oy = el.y;
    const out: PathPoint[] = [{ x: ox + anchors[0].x, y: oy + anchors[0].y }];
    const seg = (a: PathAnchor, b: PathAnchor, includeEnd: boolean) => {
        const curved = a.outX !== undefined || a.outY !== undefined || b.inX !== undefined || b.inY !== undefined;
        const p0 = { x: ox + a.x, y: oy + a.y };
        const p3 = { x: ox + b.x, y: oy + b.y };
        if (curved) {
            const p1 = { x: p0.x + (a.outX ?? 0), y: p0.y + (a.outY ?? 0) };
            const p2 = { x: p3.x + (b.inX ?? 0), y: p3.y + (b.inY ?? 0) };
            for (let i = 1; i < PATH_SEGMENT_SAMPLES; i++) {
                const t = i / PATH_SEGMENT_SAMPLES;
                out.push({ x: cubicBezier(p0.x, p1.x, p2.x, p3.x, t), y: cubicBezier(p0.y, p1.y, p2.y, p3.y, t) });
            }
        }
        if (includeEnd) out.push(p3);
    };
    for (let i = 1; i < anchors.length; i++) seg(anchors[i - 1], anchors[i], true);
    const closed = sub.closed && anchors.length > 2;
    if (closed) seg(anchors[anchors.length - 1], anchors[0], false);
    return out.length >= 2 ? { points: out, closed } : null;
}

/**
 * Ordered absolute-coordinate path for any path-bearing element, plus whether
 * it should be treated as a closed loop. Returns null when there's no usable
 * path (degenerate geometry).
 */
export function getElementTextPath(el: DrawingElement): { points: PathPoint[]; closed: boolean } | null {
    const type = el.type;

    // Freehand strokes and polylines: the stored points are the path.
    if (type === 'fineliner' || type === 'inkbrush' || type === 'marker' || type === 'ink') {
        const pts = normalizePoints(el.points).map(p => ({ x: el.x + p.x, y: el.y + p.y }));
        return pts.length >= 2 ? { points: pts, closed: false } : null;
    }

    if (type === 'line' || type === 'arrow' || type === 'organicBranch') {
        const pts = normalizePoints(el.points);
        const start = pts.length >= 2
            ? { x: el.x + pts[0].x, y: el.y + pts[0].y }
            : { x: el.x, y: el.y };
        const end = pts.length >= 2
            ? { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y }
            : { x: el.x + el.width, y: el.y + el.height };

        if (el.curveType === 'elbow' && pts.length >= 2) {
            return { points: pts.map(p => ({ x: el.x + p.x, y: el.y + p.y })), closed: false };
        }
        if (el.curveType === 'bezier' || type === 'organicBranch') {
            let cp1: PathPoint, cp2: PathPoint;
            if (el.controlPoints && el.controlPoints.length > 0) {
                cp1 = el.controlPoints[0];
                cp2 = el.controlPoints.length > 1 ? el.controlPoints[1] : cp1;
            } else {
                const w = el.width, h = el.height;
                if (Math.abs(w) > Math.abs(h)) {
                    cp1 = { x: start.x + w / 2, y: start.y };
                    cp2 = { x: end.x - w / 2, y: end.y };
                } else {
                    cp1 = { x: start.x, y: start.y + h / 2 };
                    cp2 = { x: end.x, y: end.y - h / 2 };
                }
            }
            return { points: sampleBezier(start, cp1, cp2, end), closed: false };
        }
        // straight
        return { points: [start, end], closed: false };
    }

    if (type === 'path') return pathElementPolyline(el);

    if (isClosedShapeForText(type)) {
        const outline = getOutlinePath(el);
        return outline.length >= 2 ? { points: outline, closed: true } : null;
    }

    return null;
}
