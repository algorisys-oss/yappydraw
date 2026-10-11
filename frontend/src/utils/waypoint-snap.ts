/**
 * Snapping for an elbow waypoint being dragged by hand (a segment or a bend).
 *
 * One axis at a time: a horizontal segment dragged up and down snaps its y; a vertical one
 * its x; a bend snaps both. Candidates, nearest wins within the threshold:
 *  - the same-axis runs of other straight/elbow connectors (align runs into one lane)
 *  - the edges and the centre line of shapes (sit a run on a box's midline, or flush)
 *  - the grid, when Snap to Grid is on
 * Returns the snapped value and a guide line to draw, or the input untouched.
 */
import type { DrawingElement } from '../types';
import type { SnappingGuide } from './object-snapping';
import { gridSnap, type GridGeometry } from './grid-lattice';
import { connectorRuns } from './connector-jumps';

const CONNECTOR_TYPES = new Set(['line', 'arrow', 'bezier', 'organicBranch']);
const SKIP_TYPES = new Set(['text', 'freedraw', 'fineliner', 'marker', 'inkbrush', 'ink']);

export interface WaypointSnap { value: number; guide: SnappingGuide | null }

export function snapWaypoint(
    axis: 'x' | 'y',
    value: number,
    self: DrawingElement,
    elements: readonly DrawingElement[],
    opts: { threshold: number; grid?: (GridGeometry & { snapToGrid?: boolean }) | null }
): WaypointSnap {
    let best: { value: number; dist: number; ids: string[] } | null = null;
    const consider = (v: number, id: string) => {
        const d = Math.abs(v - value);
        if (d > opts.threshold) return;
        if (!best || d < best.dist - 1e-9) best = { value: v, dist: d, ids: [id] };
        else if (Math.abs(d - best.dist) <= 1e-9 && Math.abs(v - best.value) < 1e-9) best.ids.push(id);
    };

    for (const el of elements) {
        if (el.id === self.id) continue;
        if (CONNECTOR_TYPES.has(el.type)) {
            const ct = el.curveType || 'straight';
            if (ct !== 'elbow' && ct !== 'straight') continue;
            const runs = connectorRuns(el);
            for (let i = 0; i + 1 < runs.length; i++) {
                const a = runs[i], b = runs[i + 1];
                if (axis === 'y' && Math.abs(a.y - b.y) < 0.5) consider(a.y, el.id);
                if (axis === 'x' && Math.abs(a.x - b.x) < 0.5) consider(a.x, el.id);
            }
            continue;
        }
        if (SKIP_TYPES.has(el.type) || !(el.width > 0) || !(el.height > 0)) continue;
        if (axis === 'x') { consider(el.x, el.id); consider(el.x + el.width / 2, el.id); consider(el.x + el.width, el.id); }
        else { consider(el.y, el.id); consider(el.y + el.height / 2, el.id); consider(el.y + el.height, el.id); }
    }

    if (opts.grid && opts.grid.snapToGrid && opts.grid.gridSize > 0) {
        const g = gridSnap(axis === 'x' ? value : 0, axis === 'y' ? value : 0, opts.grid);
        consider(axis === 'x' ? g.x : g.y, 'grid');
    }

    if (!best) return { value, guide: null };
    const b: { value: number; dist: number; ids: string[] } = best;
    const ids = b.ids.filter(id => id !== 'grid');
    return {
        value: b.value,
        guide: ids.length ? { type: axis === 'x' ? 'vertical' : 'horizontal', coordinate: b.value, elementIds: ids } : null,
    };
}
