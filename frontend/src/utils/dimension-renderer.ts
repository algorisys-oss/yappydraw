/**
 * Renders persistent dimension annotations as a world-space overlay pass (Phase 5).
 * Called from the canvas draw loop AFTER elements, inside the pan/scale transform.
 * Auto-updates: each dimension reads its target's current (animated) bounds every
 * frame, so it tracks moves / resizes / keyframe animation for free.
 */

import type { DrawingElement } from '../types';
import { dimensionGeometry, dimensionLabel, type DimensionAnnotation, type DimBox, type Pt } from './dimension-geometry';

const ACCENT = '#6366f1';

/** Effective (possibly animated) bounding box for a dimension's target. */
function effectiveBox(el: DrawingElement, anim: any): DimBox {
    return {
        x: (anim?.x ?? el.x),
        y: (anim?.y ?? el.y),
        width: (anim?.width ?? el.width),
        height: (anim?.height ?? el.height),
    };
}

/** Draw a small filled arrowhead at `tip`, pointing from `from` → `tip`. */
function arrowhead(ctx: CanvasRenderingContext2D, tip: Pt, from: Pt, sizeWorld: number) {
    const ang = Math.atan2(tip.y - from.y, tip.x - from.x);
    const a = Math.PI / 7;
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - sizeWorld * Math.cos(ang - a), tip.y - sizeWorld * Math.sin(ang - a));
    ctx.lineTo(tip.x - sizeWorld * Math.cos(ang + a), tip.y - sizeWorld * Math.sin(ang + a));
    ctx.closePath();
    ctx.fill();
}

export function renderDimensions(
    ctx: CanvasRenderingContext2D,
    dimensions: DimensionAnnotation[] | undefined,
    elements: DrawingElement[],
    animatedStates: Map<string, any>,
    scale: number,
    isDarkMode: boolean,
) {
    if (!dimensions || dimensions.length === 0) return;
    const byId = new Map(elements.map(e => [e.id, e]));
    const s = Math.max(0.0001, scale);
    const arrow = 9 / s;         // constant ~9px on screen
    const ext = 4 / s;           // extension-line overshoot past the dimension line
    const gap = 3 / s;           // extension-line gap from the element edge
    const fontPx = 11 / s;
    const pad = 3 / s;

    ctx.save();
    ctx.lineWidth = 1 / s;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${fontPx}px system-ui, -apple-system, sans-serif`;

    for (const dim of dimensions) {
        const el = byId.get(dim.targetId);
        if (!el) continue; // orphaned dimension (target deleted) — skip silently
        const box = effectiveBox(el, animatedStates.get(dim.targetId));
        const g = dimensionGeometry(dim, box);
        const color = dim.color || ACCENT;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        // Extension lines (edge → just past the dimension line), with a small gap at the edge.
        const dir = (a: Pt, b: Pt): Pt => { const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1; return { x: dx / len, y: dy / len }; };
        for (const [e, d] of [[g.e1, g.d1], [g.e2, g.d2]] as [Pt, Pt][]) {
            const u = dir(e, d);
            ctx.beginPath();
            ctx.moveTo(e.x + u.x * gap, e.y + u.y * gap);
            ctx.lineTo(d.x + u.x * ext, d.y + u.y * ext);
            ctx.stroke();
        }

        // Dimension line with arrowheads at both ends.
        ctx.beginPath();
        ctx.moveTo(g.d1.x, g.d1.y);
        ctx.lineTo(g.d2.x, g.d2.y);
        ctx.stroke();
        arrowhead(ctx, g.d1, g.d2, arrow);
        arrowhead(ctx, g.d2, g.d1, arrow);

        // Label with a readable background chip at the midpoint.
        const text = dimensionLabel(dim, g.value);
        const tw = ctx.measureText(text).width;
        const bw = tw + pad * 2;
        const bh = fontPx + pad * 2;
        ctx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
        ctx.globalAlpha = 0.92;
        ctx.fillRect(g.mid.x - bw / 2, g.mid.y - bh / 2, bw, bh);
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.fillText(text, g.mid.x, g.mid.y);
    }
    ctx.restore();
}
