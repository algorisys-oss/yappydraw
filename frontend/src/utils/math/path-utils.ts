
/**
 * Path Utilities
 * Helper functions for SVG path parsing and interpolation
 */

import type { PathAnchor } from '../../types';

/**
 * Serialize an editable anchor list into an SVG path `d` string.
 *
 * Anchor coords are relative to the element origin; `ox`/`oy` shift them into the
 * target frame (e.g. pass `-w/2, -h/2` for the centered geometry frame). A segment
 * becomes a cubic `C` when either endpoint has a Bézier handle, else a line `L`. A
 * missing handle defaults to its own anchor (so a half-curved segment still works).
 * Returns `''` for fewer than 2 anchors.
 */
export function anchorsToPathData(anchors: PathAnchor[], closed = false, ox = 0, oy = 0): string {
    if (!anchors || anchors.length < 2) return '';
    const ax = (a: PathAnchor) => a.x + ox;
    const ay = (a: PathAnchor) => a.y + oy;
    const outX = (a: PathAnchor) => a.x + (a.outX ?? 0) + ox;
    const outY = (a: PathAnchor) => a.y + (a.outY ?? 0) + oy;
    const inX = (a: PathAnchor) => a.x + (a.inX ?? 0) + ox;
    const inY = (a: PathAnchor) => a.y + (a.inY ?? 0) + oy;

    const seg = (from: PathAnchor, to: PathAnchor) => {
        const hasCurve = from.outX !== undefined || from.outY !== undefined ||
            to.inX !== undefined || to.inY !== undefined;
        if (!hasCurve) return `L ${ax(to)} ${ay(to)}`;
        return `C ${outX(from)} ${outY(from)} ${inX(to)} ${inY(to)} ${ax(to)} ${ay(to)}`;
    };

    let d = `M ${ax(anchors[0])} ${ay(anchors[0])}`;
    for (let i = 1; i < anchors.length; i++) d += ` ${seg(anchors[i - 1], anchors[i])}`;
    if (closed && anchors.length > 2) {
        d += ` ${seg(anchors[anchors.length - 1], anchors[0])} Z`;
    }
    return d;
}

/** Minimal shape of a path-bearing element (avoids a DrawingElement import here). */
interface PathLike {
    pathSubpaths?: { anchors: PathAnchor[]; closed: boolean }[];
    pathAnchors?: PathAnchor[];
    pathClosed?: boolean;
}

/**
 * Normalize a `path` element to its list of subpaths. `pathSubpaths` wins when present;
 * otherwise the legacy single subpath (`pathAnchors`/`pathClosed`) is wrapped. Empty list
 * if the element has no usable anchors.
 */
export function getPathSubpaths(el: PathLike): { anchors: PathAnchor[]; closed: boolean }[] {
    if (el.pathSubpaths && el.pathSubpaths.length) {
        return el.pathSubpaths.filter(sp => sp.anchors && sp.anchors.length >= 2);
    }
    if (el.pathAnchors && el.pathAnchors.length >= 2) {
        return [{ anchors: el.pathAnchors, closed: el.pathClosed ?? false }];
    }
    return [];
}

/** Serialize several subpaths into a single multi-`M` SVG `d` string. */
export function subpathsToPathData(
    subpaths: { anchors: PathAnchor[]; closed: boolean }[], ox = 0, oy = 0
): string {
    return subpaths.map(sp => anchorsToPathData(sp.anchors, sp.closed, ox, oy)).filter(Boolean).join(' ');
}

export interface PathPoint {
    x: number;
    y: number;
    angle: number; // radians
}

interface PathCommand {
    type: 'M' | 'L' | 'Q' | 'C' | 'Z';
    points: { x: number; y: number }[]; // Control points and end point
    start: { x: number; y: number }; // Start point of this segment
    length: number; // Approximate length for normalization
}

export class PathUtils {
    /**
     * Flatten an SVG elliptical arc (`A rx ry x-rot large-arc sweep x y`) into cubic
     * segments, ≤90° each (SVG spec F.6.5 endpoint→centre parameterization).
     *
     * There is no arc primitive in `PathCommand` on purpose: emitting `C` keeps every
     * downstream consumer — length, point-at-t, tangent, outline sampling — working
     * unchanged. Returns [] for a degenerate arc (zero-length or zero-radius); the
     * caller falls back to a straight line, which is what the spec mandates.
     */
    private static arcToCubics(
        x1: number, y1: number,
        rxIn: number, ryIn: number, rotDeg: number,
        largeArc: boolean, sweep: boolean,
        x2: number, y2: number,
    ): { c1: { x: number; y: number }; c2: { x: number; y: number }; end: { x: number; y: number } }[] {
        if ((x1 === x2 && y1 === y2) || !isFinite(rxIn) || !isFinite(ryIn)) return [];
        let rx = Math.abs(rxIn), ry = Math.abs(ryIn);
        if (rx === 0 || ry === 0) return [];

        const phi = (rotDeg * Math.PI) / 180;
        const cosP = Math.cos(phi), sinP = Math.sin(phi);
        const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
        const x1p = cosP * dx2 + sinP * dy2;
        const y1p = -sinP * dx2 + cosP * dy2;

        // Scale the radii up if they're too small to span the endpoints (spec F.6.6).
        const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
        if (lambda > 1) { const s = Math.sqrt(lambda); rx *= s; ry *= s; }

        const sign = largeArc !== sweep ? 1 : -1;
        const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
        const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
        const co = den === 0 ? 0 : sign * Math.sqrt(Math.max(0, num / den));
        const cxp = co * ((rx * y1p) / ry);
        const cyp = co * ((-ry * x1p) / rx);
        const cx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
        const cy = sinP * cxp + cosP * cyp + (y1 + y2) / 2;

        const angleBetween = (ux: number, uy: number, vx: number, vy: number): number => {
            const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
            if (len === 0) return 0;
            let a = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / len)));
            if (ux * vy - uy * vx < 0) a = -a;
            return a;
        };
        const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry;
        const vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
        const theta1 = angleBetween(1, 0, ux, uy);
        let dTheta = angleBetween(ux, uy, vx, vy);
        if (!sweep && dTheta > 0) dTheta -= 2 * Math.PI;
        else if (sweep && dTheta < 0) dTheta += 2 * Math.PI;
        if (dTheta === 0) return [];

        const pointAt = (th: number) => ({
            x: cx + rx * Math.cos(th) * cosP - ry * Math.sin(th) * sinP,
            y: cy + rx * Math.cos(th) * sinP + ry * Math.sin(th) * cosP,
        });
        const slopeAt = (th: number) => ({
            x: -rx * Math.sin(th) * cosP - ry * Math.cos(th) * sinP,
            y: -rx * Math.sin(th) * sinP + ry * Math.cos(th) * cosP,
        });

        const segCount = Math.max(1, Math.ceil(Math.abs(dTheta) / (Math.PI / 2)));
        const delta = dTheta / segCount;
        const k = (4 / 3) * Math.tan(delta / 4);   // cubic approximation of a circular arc

        const out: { c1: { x: number; y: number }; c2: { x: number; y: number }; end: { x: number; y: number } }[] = [];
        for (let s = 0; s < segCount; s++) {
            const th0 = theta1 + s * delta, th1 = th0 + delta;
            const p0 = pointAt(th0), p1 = pointAt(th1);
            const d0 = slopeAt(th0), d1 = slopeAt(th1);
            out.push({
                c1: { x: p0.x + k * d0.x, y: p0.y + k * d0.y },
                c2: { x: p1.x - k * d1.x, y: p1.y - k * d1.y },
                end: p1,
            });
        }
        return out;
    }

    /**
     * Parse an SVG path string into computable segments
     * Supports: M, L, Q, C, A (Absolute coordinates only for simplicity)
     */
    static parsePath(d: string): PathCommand[] {
        const commands: PathCommand[] = [];
        const tokens = d.match(/[a-zA-Z]|[-+]?[0-9]*\.?[0-9]+/g);
        if (!tokens) return [];

        let currentX = 0;
        let currentY = 0;
        let startX = 0; // For Z command
        let startY = 0;

        let i = 0;
        while (i < tokens.length) {
            const type = tokens[i];
            i++;

            switch (type) {
                case 'M': {
                    const x = parseFloat(tokens[i++]);
                    const y = parseFloat(tokens[i++]);
                    currentX = x;
                    currentY = y;
                    startX = x;
                    startY = y;
                    // Move doesn't create a segment unless needed for multi-part paths, 
                    // but for animation we usually start at 0 progress.
                    break;
                }
                case 'L': {
                    const x = parseFloat(tokens[i++]);
                    const y = parseFloat(tokens[i++]);
                    const length = Math.hypot(x - currentX, y - currentY);
                    commands.push({
                        type: 'L',
                        start: { x: currentX, y: currentY },
                        points: [{ x, y }],
                        length
                    });
                    currentX = x;
                    currentY = y;
                    break;
                }
                case 'Q': {
                    const cx = parseFloat(tokens[i++]);
                    const cy = parseFloat(tokens[i++]);
                    const x = parseFloat(tokens[i++]);
                    const y = parseFloat(tokens[i++]);
                    const length = this.estimateBezierLength(currentX, currentY, cx, cy, x, y);
                    commands.push({
                        type: 'Q',
                        start: { x: currentX, y: currentY },
                        points: [{ x: cx, y: cy }, { x, y }],
                        length
                    });
                    currentX = x;
                    currentY = y;
                    break;
                }
                case 'C': {
                    const c1x = parseFloat(tokens[i++]);
                    const c1y = parseFloat(tokens[i++]);
                    const c2x = parseFloat(tokens[i++]);
                    const c2y = parseFloat(tokens[i++]);
                    const x = parseFloat(tokens[i++]);
                    const y = parseFloat(tokens[i++]);
                    const length = this.estimateCubicBezierLength(currentX, currentY, c1x, c1y, c2x, c2y, x, y);
                    commands.push({
                        type: 'C',
                        start: { x: currentX, y: currentY },
                        points: [{ x: c1x, y: c1y }, { x: c2x, y: c2y }, { x, y }],
                        length
                    });
                    currentX = x;
                    currentY = y;
                    break;
                }
                case 'A': {
                    // Arcs were previously skipped entirely (no case + no token consumption),
                    // so every arc-based shape — cloud, database, lightbulb, magnet,
                    // magnifyingGlass, pin, puzzlePiece, storageBlob, umlRequiredInterface —
                    // parsed to an EMPTY command list. That silently disabled Convert to
                    // Path / Simplify / Smooth / Offset / text-on-path for all of them.
                    const rx = parseFloat(tokens[i++]);
                    const ry = parseFloat(tokens[i++]);
                    const rot = parseFloat(tokens[i++]);
                    const largeArc = parseFloat(tokens[i++]) !== 0;
                    const sweep = parseFloat(tokens[i++]) !== 0;
                    const x = parseFloat(tokens[i++]);
                    const y = parseFloat(tokens[i++]);
                    if (!isFinite(x) || !isFinite(y)) break;   // truncated arc — skip it, keep parsing

                    const cubics = PathUtils.arcToCubics(currentX, currentY, rx, ry, rot, largeArc, sweep, x, y);
                    if (cubics.length === 0) {
                        // Degenerate arc → straight line (SVG spec behaviour).
                        const length = Math.hypot(x - currentX, y - currentY);
                        if (length > 0) {
                            commands.push({ type: 'L', start: { x: currentX, y: currentY }, points: [{ x, y }], length });
                        }
                    } else {
                        for (const seg of cubics) {
                            commands.push({
                                type: 'C',
                                start: { x: currentX, y: currentY },
                                points: [seg.c1, seg.c2, seg.end],
                                length: this.estimateCubicBezierLength(
                                    currentX, currentY, seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.end.x, seg.end.y,
                                ),
                            });
                            currentX = seg.end.x;
                            currentY = seg.end.y;
                        }
                    }
                    currentX = x;
                    currentY = y;
                    break;
                }
                case 'Z': {
                    const length = Math.hypot(startX - currentX, startY - currentY);
                    if (length > 0) {
                        commands.push({
                            type: 'L',
                            start: { x: currentX, y: currentY },
                            points: [{ x: startX, y: startY }],
                            length
                        });
                    }
                    currentX = startX;
                    currentY = startY;
                    break;
                }
            }
        }

        return commands;
    }

    /**
     * Get exact point and angle at progress t (0-1) along the path
     */
    static getPointOnPath(commands: PathCommand[], t: number): PathPoint {
        if (commands.length === 0) return { x: 0, y: 0, angle: 0 };

        const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
        const targetLength = t * totalLength;

        let accumulatedLength = 0;

        for (const cmd of commands) {
            if (accumulatedLength + cmd.length >= targetLength || cmd === commands[commands.length - 1]) {
                const segmentT = Math.max(0, Math.min(1, (targetLength - accumulatedLength) / cmd.length));
                return this.interpolateSegment(cmd, segmentT);
            }
            accumulatedLength += cmd.length;
        }

        return this.interpolateSegment(commands[commands.length - 1], 1);
    }

    private static interpolateSegment(cmd: PathCommand, t: number): PathPoint {
        const { start } = cmd;
        let x = 0, y = 0, angle = 0;

        if (cmd.type === 'L') {
            const end = cmd.points[0];
            x = start.x + (end.x - start.x) * t;
            y = start.y + (end.y - start.y) * t;
            angle = Math.atan2(end.y - start.y, end.x - start.x);
        } else if (cmd.type === 'Q') {
            const c = cmd.points[0];
            const end = cmd.points[1];
            // Quadratic Bezier: (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
            const mt = 1 - t;
            x = mt * mt * start.x + 2 * mt * t * c.x + t * t * end.x;
            y = mt * mt * start.y + 2 * mt * t * c.y + t * t * end.y;

            // Derivative for tangent
            // x' = 2(1-t)(P1x - P0x) + 2t(P2x - P1x)
            const dx = 2 * mt * (c.x - start.x) + 2 * t * (end.x - c.x);
            const dy = 2 * mt * (c.y - start.y) + 2 * t * (end.y - c.y);
            angle = Math.atan2(dy, dx);
        } else if (cmd.type === 'C') {
            const c1 = cmd.points[0];
            const c2 = cmd.points[1];
            const end = cmd.points[2];
            // Cubic Bezier
            const mt = 1 - t;
            const mt2 = mt * mt;
            const t2 = t * t;

            x = mt2 * mt * start.x + 3 * mt2 * t * c1.x + 3 * mt * t2 * c2.x + t2 * t * end.x;
            y = mt2 * mt * start.y + 3 * mt2 * t * c1.y + 3 * mt * t2 * c2.y + t2 * t * end.y;

            // Derivative
            const dx = 3 * mt2 * (c1.x - start.x) + 6 * mt * t * (c2.x - c1.x) + 3 * t2 * (end.x - c2.x);
            const dy = 3 * mt2 * (c1.y - start.y) + 6 * mt * t * (c2.y - c1.y) + 3 * t2 * (end.y - c2.y);
            angle = Math.atan2(dy, dx);
        }

        return { x, y, angle };
    }

    private static estimateBezierLength(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number {
        // Simple chord estimation (good enough for animation pacing usually)
        // Or subdivide
        const chord = Math.hypot(x2 - x0, y2 - y0);
        const cont_net = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1);
        return (cont_net + chord) / 2;
    }

    private static estimateCubicBezierLength(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
        const chord = Math.hypot(x3 - x0, y3 - y0);
        const cont_net = Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
        return (cont_net + chord) / 2;
    }

    /**
     * Convert SVG path string to editable control points
     * This approximates the path into a series of points + bezier handles
     * Note: Simplistic parser, mainly for M, L, Q, C
     */
    static svgToPoints(d: string): { x: number; y: number; type: 'anchor' | 'control' | 'control_end' }[] {
        const commands = this.parsePath(d);
        const points: { x: number; y: number; type: 'anchor' | 'control' | 'control_end' }[] = [];

        if (commands.length === 0) return [];

        // Add start point
        points.push({ x: commands[0].start.x, y: commands[0].start.y, type: 'anchor' });

        for (const cmd of commands) {
            if (cmd.type === 'L') {
                points.push({ x: cmd.points[0].x, y: cmd.points[0].y, type: 'anchor' });
            } else if (cmd.type === 'Q') {
                // Quadratic: Start -> Control -> End
                points.push({ x: cmd.points[0].x, y: cmd.points[0].y, type: 'control' }); // Control
                points.push({ x: cmd.points[1].x, y: cmd.points[1].y, type: 'anchor' }); // End
            } else if (cmd.type === 'C') {
                // Cubic: Start -> Control1 -> Control2 -> End
                points.push({ x: cmd.points[0].x, y: cmd.points[0].y, type: 'control' });
                points.push({ x: cmd.points[1].x, y: cmd.points[1].y, type: 'control_end' }); // Mark as paired control?
                points.push({ x: cmd.points[2].x, y: cmd.points[2].y, type: 'anchor' });
            }
            // Z ignored for now
        }
        return points;
    }

    /**
     * Convert points back to SVG string
     * Heuristic: 
     * - Anchor -> Anchor = L
     * - Anchor -> Control -> Anchor = Q
     * - Anchor -> Control -> Control -> Anchor = C
     */
    /**
     * Extract only anchor points from an SVG path string, stripping all control points.
     */
    static extractAnchors(d: string): { x: number; y: number }[] {
        return this.svgToPoints(d)
            .filter(p => p.type === 'anchor')
            .map(p => ({ x: p.x, y: p.y }));
    }

    /**
     * Convert straight-line path to smooth cubic Bezier using Catmull-Rom spline conversion.
     * For each segment P[i] -> P[i+1], cubic control points are:
     *   CP1 = P[i]   + (P[i+1] - P[i-1]) / 6
     *   CP2 = P[i+1] - (P[i+2] - P[i])   / 6
     * Boundary: first/last points duplicated as virtual neighbors.
     */
    static smoothPathData(d: string): string {
        const anchors = this.extractAnchors(d);
        if (anchors.length < 2) return d;

        let result = `M ${Math.round(anchors[0].x)} ${Math.round(anchors[0].y)}`;

        for (let i = 0; i < anchors.length - 1; i++) {
            const p0 = anchors[Math.max(0, i - 1)];
            const p1 = anchors[i];
            const p2 = anchors[i + 1];
            const p3 = anchors[Math.min(anchors.length - 1, i + 2)];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            result += ` C ${Math.round(cp1x)} ${Math.round(cp1y)} ${Math.round(cp2x)} ${Math.round(cp2y)} ${Math.round(p2.x)} ${Math.round(p2.y)}`;
        }

        return result;
    }

    /**
     * Strip all curves from a path, converting to straight line segments between anchors.
     */
    static unsmoothPathData(d: string): string {
        const anchors = this.extractAnchors(d);
        if (anchors.length < 2) return d;

        let result = `M ${Math.round(anchors[0].x)} ${Math.round(anchors[0].y)}`;
        for (let i = 1; i < anchors.length; i++) {
            result += ` L ${Math.round(anchors[i].x)} ${Math.round(anchors[i].y)}`;
        }
        return result;
    }

    static pointsToSvg(points: { x: number; y: number; type: string }[]): string {
        if (points.length === 0) return '';

        let d = `M ${Math.round(points[0].x)} ${Math.round(points[0].y)}`;

        let i = 1;
        while (i < points.length) {
            const p1 = points[i];

            // Check if it's a control point
            if (p1.type.includes('control')) {
                const p2 = points[i + 1];
                if (!p2) break; // Incomplete

                if (p2.type.includes('control')) {
                    // Two controls -> Cubic
                    const p3 = points[i + 2];
                    if (p3 && p3.type === 'anchor') {
                        d += ` C ${Math.round(p1.x)} ${Math.round(p1.y)} ${Math.round(p2.x)} ${Math.round(p2.y)} ${Math.round(p3.x)} ${Math.round(p3.y)}`;
                        i += 3;
                    } else {
                        // Fallback?
                        i++;
                    }
                } else if (p2.type === 'anchor') {
                    // One control -> Quadratic
                    d += ` Q ${Math.round(p1.x)} ${Math.round(p1.y)} ${Math.round(p2.x)} ${Math.round(p2.y)}`;
                    i += 2;
                } else {
                    i++;
                }
            } else {
                // Just an anchor -> Line
                d += ` L ${Math.round(p1.x)} ${Math.round(p1.y)}`;
                i++;
            }
        }

        return d;
    }
}
