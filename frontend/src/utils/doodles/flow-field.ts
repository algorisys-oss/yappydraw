/**
 * Flow field — evenly spaced streamlines through a smooth noise vector field.
 *
 * The spacing rule is the one from Jobard & Lefer ("Creating evenly-spaced streamlines",
 * 1997), simplified: a new line may only start where nothing is within `spacing`, and a
 * growing line stops as soon as it comes within half that of another. Without it lines
 * converge where the field does and the drawing turns into dark smears.
 */
import type { DoodleLayer, DoodleParams, DoodleRegion } from './index';
import { smoothThrough, thin, KAPPA, type Pt } from './curves';
import { makeNoise2D, fbm, shuffle, type Rng } from './rng';
import type { PathAnchor, PathSubpath } from '../../types';

/** Occupancy grid: points already drawn, bucketed by `cell`, tagged with their line. */
class Occupancy {
    private cells = new Map<number, { x: number; y: number; line: number }[]>();
    private cell: number;
    private ox: number;
    private oy: number;
    constructor(cell: number, ox: number, oy: number) { this.cell = cell; this.ox = ox; this.oy = oy; }
    private k(ix: number, iy: number) { return ix * 100003 + iy; }
    add(x: number, y: number, line: number) {
        const k = this.k(Math.floor((x - this.ox) / this.cell), Math.floor((y - this.oy) / this.cell));
        const l = this.cells.get(k);
        if (l) l.push({ x, y, line }); else this.cells.set(k, [{ x, y, line }]);
    }
    /** Is any point of a line other than `line` within `d` (d ≤ cell)? */
    near(x: number, y: number, d: number, line: number): boolean {
        const ix = Math.floor((x - this.ox) / this.cell), iy = Math.floor((y - this.oy) / this.cell);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
            const l = this.cells.get(this.k(ix + a, iy + b));
            if (!l) continue;
            for (const q of l) if (q.line !== line && (q.x - x) ** 2 + (q.y - y) ** 2 < d * d) return true;
        }
        return false;
    }
}

function circle(cx: number, cy: number, r: number): PathSubpath {
    const h = KAPPA * r;
    const anchors: PathAnchor[] = [
        { x: cx + r, y: cy, kind: 'smooth', inX: 0, inY: -h, outX: 0, outY: h },
        { x: cx, y: cy + r, kind: 'smooth', inX: h, inY: 0, outX: -h, outY: 0 },
        { x: cx - r, y: cy, kind: 'smooth', inX: 0, inY: h, outX: 0, outY: -h },
        { x: cx, y: cy - r, kind: 'smooth', inX: -h, inY: 0, outX: h, outY: 0 },
    ];
    return { anchors, closed: true };
}

export function buildFlowField(region: DoodleRegion, p: DoodleParams, rng: Rng): DoodleLayer[] {
    const spacing = p.spacing as number;
    const maxLen = p.length as number;
    const curl = p.curl as number;
    const dots = p.dots as boolean;
    const { x: X0, y: Y0, width: W, height: H } = region;

    const noise = makeNoise2D(rng);
    const f = curl / Math.min(W, H);
    const angle = (x: number, y: number) => fbm(noise, x * f, y * f, 2) * Math.PI * 2;
    const inside = (x: number, y: number) => x >= X0 && x <= X0 + W && y >= Y0 && y <= Y0 + H;

    const step = Math.max(1.5, spacing / 4);
    const dTest = spacing * 0.5;
    const maxSteps = Math.ceil(maxLen / 2 / step);
    const occ = new Occupancy(spacing, X0, Y0);

    /** Trace from (x,y) in direction `dir` (±1) with a midpoint (RK2) step. */
    const trace = (x: number, y: number, dir: number, line: number): Pt[] => {
        const pts: Pt[] = [];
        for (let i = 0; i < maxSteps; i++) {
            const a1 = angle(x, y);
            const mx = x + Math.cos(a1) * step * 0.5 * dir, my = y + Math.sin(a1) * step * 0.5 * dir;
            const a2 = angle(mx, my);
            const nx = x + Math.cos(a2) * step * dir, ny = y + Math.sin(a2) * step * dir;
            if (!inside(nx, ny) || occ.near(nx, ny, dTest, line)) break;
            pts.push({ x: nx, y: ny });
            x = nx; y = ny;
        }
        return pts;
    };

    // Seed candidates on a jittered grid, visited in random order so the first lines
    // (which get to be longest) are spread over the page rather than all top-left.
    const seeds: Pt[] = [];
    for (let y = Y0 + spacing / 2; y < Y0 + H; y += spacing) {
        for (let x = X0 + spacing / 2; x < X0 + W; x += spacing) {
            const jx = x + (rng() - 0.5) * spacing * 0.8, jy = y + (rng() - 0.5) * spacing * 0.8;
            if (inside(jx, jy)) seeds.push({ x: jx, y: jy });
        }
    }
    shuffle(seeds, rng);

    const lines: PathSubpath[] = [];
    const starts: Pt[] = [];
    // Candidates one `spacing` either side of each accepted line, tried before the grid:
    // this is the Jobard–Lefer step that makes the spacing even. Seeding from the grid
    // alone leaves bald patches wherever a grid seed happened to land too close to a line.
    const queue: Pt[] = [];
    const every = Math.max(1, Math.round(spacing / step));
    let lineId = 0;
    let gridAt = 0, queueAt = 0;
    for (;;) {
        const s = queueAt < queue.length ? queue[queueAt++] : seeds[gridAt++];
        if (!s) break;
        if (!inside(s.x, s.y) || occ.near(s.x, s.y, spacing * 0.95, -1)) continue;
        const id = ++lineId;
        const back = trace(s.x, s.y, -1, id).reverse();
        const fwd = trace(s.x, s.y, 1, id);
        const pts = [...back, s, ...fwd];
        let len = 0;
        for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        if (len < spacing * 1.5) continue;
        for (const q of pts) occ.add(q.x, q.y, id);
        for (let i = 0; i < pts.length; i += every) {
            const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
            const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
            queue.push({ x: pts[i].x + nx * spacing, y: pts[i].y + ny * spacing });
            queue.push({ x: pts[i].x - nx * spacing, y: pts[i].y - ny * spacing });
        }
        lines.push({ anchors: smoothThrough(thin(pts, Math.max(6, spacing * 0.6)), false), closed: false });
        starts.push(pts[0]);
    }

    const layers: DoodleLayer[] = [];
    if (dots) {
        const r = Math.max(1.5, spacing * 0.18);
        const circles = starts
            .filter(q => q.x - r >= X0 && q.x + r <= X0 + W && q.y - r >= Y0 && q.y + r <= Y0 + H)
            .map(q => circle(q.x, q.y, r));
        if (circles.length) layers.push({ role: 'fill1', subpaths: circles, maxRoughness: 0 });
    }
    layers.push({ role: 'ink', subpaths: lines });
    return layers;
}
