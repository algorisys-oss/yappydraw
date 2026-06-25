/**
 * Convert a (centred) ShapeGeometry into SVG path `d` strings — shared by SVG export and
 * the appearance-stack post-pass (which feeds rough.js `rc.path(d)` for sketch-style extra
 * fills/strokes). Returns one `d` per subpath and whether even-odd fill applies.
 */

import type { ShapeGeometry } from './shape-geometry';

export function geometryToDs(geo: ShapeGeometry): { ds: string[]; evenOdd: boolean } {
    const round = (n: number) => Math.round(n * 1000) / 1000;
    const ds: string[] = [];
    let evenOdd = false;
    const collect = (g: any) => {
        if (g.type === 'rect') {
            const { x, y, w, h } = g; const r = g.r || 0;
            if (r > 0) {
                ds.push(`M ${round(x + r)} ${round(y)} L ${round(x + w - r)} ${round(y)} Q ${round(x + w)} ${round(y)} ${round(x + w)} ${round(y + r)} L ${round(x + w)} ${round(y + h - r)} Q ${round(x + w)} ${round(y + h)} ${round(x + w - r)} ${round(y + h)} L ${round(x + r)} ${round(y + h)} Q ${round(x)} ${round(y + h)} ${round(x)} ${round(y + h - r)} L ${round(x)} ${round(y + r)} Q ${round(x)} ${round(y)} ${round(x + r)} ${round(y)} Z`);
            } else {
                ds.push(`M ${round(x)} ${round(y)} L ${round(x + w)} ${round(y)} L ${round(x + w)} ${round(y + h)} L ${round(x)} ${round(y + h)} Z`);
            }
        } else if (g.type === 'ellipse') {
            const { cx, cy, rx, ry } = g;
            ds.push(`M ${round(cx - rx)} ${round(cy)} A ${round(rx)} ${round(ry)} 0 1 0 ${round(cx + rx)} ${round(cy)} A ${round(rx)} ${round(ry)} 0 1 0 ${round(cx - rx)} ${round(cy)} Z`);
        } else if (g.type === 'points') {
            const pts = g.points;
            if (pts.length >= 2) {
                let d = `M ${round(pts[0].x)} ${round(pts[0].y)}`;
                for (let i = 1; i < pts.length; i++) d += ` L ${round(pts[i].x)} ${round(pts[i].y)}`;
                if (g.isClosed !== false) d += ' Z';
                ds.push(d);
            }
        } else if (g.type === 'path') {
            ds.push(g.path);
            if (g.evenOdd) evenOdd = true;
        } else if (g.type === 'multi') {
            g.shapes.forEach(collect);
            if (g.shapes.length > 1) evenOdd = true;
        }
    };
    collect(geo);
    return { ds, evenOdd };
}
