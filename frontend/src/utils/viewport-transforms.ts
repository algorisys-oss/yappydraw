// Central viewport transform helpers — the single source of truth for converting
// between world coordinates (element space) and screen coordinates (canvas-local
// CSS pixels, i.e. clientX/Y minus the canvas bounding-rect origin).
//
// Historically this math (`world * scale + pan` and its inverse) was duplicated
// across ~20 sites. Centralizing it here is the prerequisite for view rotation:
// every site that goes through these helpers becomes rotation-correct for free
// once a non-zero `rotation` is threaded through.
//
// The transform pipeline is:   screen = R(θ, center) · (world · scale + pan)
// where R rotates about the viewport center (in screen px). When `rotation` is
// falsy the rotation step is skipped entirely, so the result is byte-identical
// to the legacy inline math — this keeps the pure-centralization refactor a
// no-op behaviourally.

import type { Point } from "../types";

export interface Viewport {
    scale: number;
    panX: number;
    panY: number;
    /** Canvas (view) rotation in radians, about the viewport center. Default 0. */
    rotation?: number;
    /** Rotation pivot — viewport center, in canvas-local screen px. Default (0,0). */
    centerX?: number;
    centerY?: number;
}

/** World (element-space) → screen (canvas-local CSS px). */
export function worldToScreen(wx: number, wy: number, vp: Viewport): Point {
    let sx = wx * vp.scale + vp.panX;
    let sy = wy * vp.scale + vp.panY;
    if (vp.rotation) {
        const cx = vp.centerX ?? 0;
        const cy = vp.centerY ?? 0;
        const cos = Math.cos(vp.rotation);
        const sin = Math.sin(vp.rotation);
        const dx = sx - cx;
        const dy = sy - cy;
        sx = cx + dx * cos - dy * sin;
        sy = cy + dx * sin + dy * cos;
    }
    return { x: sx, y: sy };
}

/** Screen (canvas-local CSS px) → world (element-space). Inverse of worldToScreen. */
export function screenToWorld(sx: number, sy: number, vp: Viewport): Point {
    let x = sx;
    let y = sy;
    if (vp.rotation) {
        const cx = vp.centerX ?? 0;
        const cy = vp.centerY ?? 0;
        // Un-rotate about the center by -θ.
        const cos = Math.cos(vp.rotation);
        const sin = Math.sin(vp.rotation);
        const dx = x - cx;
        const dy = y - cy;
        x = cx + dx * cos + dy * sin;
        y = cy - dx * sin + dy * cos;
    }
    return { x: (x - vp.panX) / vp.scale, y: (y - vp.panY) / vp.scale };
}
