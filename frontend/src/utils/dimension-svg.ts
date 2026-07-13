/**
 * SVG emission for dimension annotations (export inclusion, opt-in).
 *
 * Mirrors `dimension-renderer.ts` (canvas) but produces standalone SVG nodes so
 * dimensions can be baked into an exported .svg. Uses the same pure
 * `dimensionGeometry`, so the vector export matches the on-canvas drawing.
 */

import type { DrawingElement } from '../types';
import { dimensionGeometry, dimensionLabel, type DimensionAnnotation, type Pt } from './dimension-geometry';
import type { MeasurementUnit } from './units';

const SVGNS = 'http://www.w3.org/2000/svg';
const ACCENT = '#6366f1';
const ARROW = 9;   // world px
const FONT = 11;
const EXT = 4;     // extension overshoot
const GAP = 3;     // extension gap from the edge

const el = (name: string, attrs: Record<string, string | number>): SVGElement => {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, String(attrs[k]));
    return n;
};

const dir = (a: Pt, b: Pt): Pt => { const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1; return { x: dx / len, y: dy / len }; };

function arrowhead(parent: SVGElement, tip: Pt, from: Pt, color: string) {
    const ang = Math.atan2(tip.y - from.y, tip.x - from.x), a = Math.PI / 7;
    const p1 = `${tip.x - ARROW * Math.cos(ang - a)},${tip.y - ARROW * Math.sin(ang - a)}`;
    const p2 = `${tip.x - ARROW * Math.cos(ang + a)},${tip.y - ARROW * Math.sin(ang + a)}`;
    parent.appendChild(el('polygon', { points: `${tip.x},${tip.y} ${p1} ${p2}`, fill: color }));
}

/** Build the SVG nodes for the given dimensions, appended under a translated group. */
export function appendDimensionSvg(
    group: SVGElement,
    dimensions: DimensionAnnotation[] | undefined,
    elements: DrawingElement[],
    unit: MeasurementUnit = 'px',
) {
    if (!dimensions || dimensions.length === 0) return;
    const byId = new Map(elements.map(e => [e.id, e]));

    for (const dim of dimensions) {
        const t = byId.get(dim.targetId);
        if (!t) continue;
        const box = { x: t.x, y: t.y, width: t.width, height: t.height, angle: t.angle ?? 0 };
        const g = dimensionGeometry(dim, box);
        const color = dim.color || ACCENT;
        const wrap = el('g', {});

        if (g.kind === 'angular') {
            const c = g.center!, r = g.radius!, a0 = g.startAngle!, a1 = g.endAngle!;
            const sx = c.x + Math.cos(a0) * r, sy = c.y + Math.sin(a0) * r;
            const ex = c.x + Math.cos(a1) * r, ey = c.y + Math.sin(a1) * r;
            const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
            const sweep = a1 > a0 ? 1 : 0;
            wrap.appendChild(el('path', { d: `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`, fill: 'none', stroke: color, 'stroke-width': 1 }));
            wrap.appendChild(el('line', { x1: c.x, y1: c.y, x2: sx, y2: sy, stroke: color, 'stroke-width': 1 }));
            wrap.appendChild(el('line', { x1: c.x, y1: c.y, x2: ex, y2: ey, stroke: color, 'stroke-width': 1 }));
        } else {
            if (g.extension) {
                for (const [e, d] of [[g.e1!, g.d1!], [g.e2!, g.d2!]] as [Pt, Pt][]) {
                    const u = dir(e, d);
                    wrap.appendChild(el('line', { x1: e.x + u.x * GAP, y1: e.y + u.y * GAP, x2: d.x + u.x * EXT, y2: d.y + u.y * EXT, stroke: color, 'stroke-width': 1 }));
                }
            }
            wrap.appendChild(el('line', { x1: g.d1!.x, y1: g.d1!.y, x2: g.d2!.x, y2: g.d2!.y, stroke: color, 'stroke-width': 1 }));
            arrowhead(wrap, g.d2!, g.d1!, color);
            if (g.arrowsBothEnds) arrowhead(wrap, g.d1!, g.d2!, color);
        }

        // Label chip + text.
        const text = dimensionLabel(dim, g, unit);
        const bw = text.length * FONT * 0.6 + 6, bh = FONT + 6;
        wrap.appendChild(el('rect', { x: g.mid.x - bw / 2, y: g.mid.y - bh / 2, width: bw, height: bh, rx: 3, fill: '#ffffff', 'fill-opacity': 0.92 }));
        const txt = el('text', { x: g.mid.x, y: g.mid.y, fill: color, 'font-size': FONT, 'font-family': 'system-ui, -apple-system, sans-serif', 'text-anchor': 'middle', 'dominant-baseline': 'central' });
        txt.textContent = text;
        wrap.appendChild(txt);

        group.appendChild(wrap);
    }
}
