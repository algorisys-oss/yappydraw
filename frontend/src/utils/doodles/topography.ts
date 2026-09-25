/**
 * Topography — contour lines of a fractal-noise height map (marching squares).
 *
 * Every edge crossing is interpolated from the edge's two grid values in a fixed order,
 * so the two cells sharing an edge compute bit-identical points. That is what lets
 * `chainSegments` stitch the per-cell pieces into whole contours by coordinate alone;
 * a crossing computed per-cell would leave a hairline gap at every cell boundary.
 */
import type { PathAnchor } from '../../types';
import type { DoodleLayer, DoodleParams, DoodleRegion } from './index';
import { chainSegments, smoothThrough, thin } from './curves';
import { makeNoise2D, fbm, type Rng } from './rng';

export function buildTopography(region: DoodleRegion, p: DoodleParams, rng: Rng): DoodleLayer[] {
    const levels = p.levels as number;
    const scale = p.scale as number;
    const octaves = p.detail as number;
    const indexEvery = p.indexEvery as number;
    const { x: X0, y: Y0, width: W, height: H } = region;

    const cell = Math.min(10, Math.max(3, Math.min(W, H) / 90));
    const nx = Math.max(1, Math.ceil(W / cell)), ny = Math.max(1, Math.ceil(H / cell));
    const gx = (i: number) => X0 + (i * W) / nx;
    const gy = (j: number) => Y0 + (j * H) / ny;

    const noise = makeNoise2D(rng);
    const field = new Float64Array((nx + 1) * (ny + 1));
    let lo = Infinity, hi = -Infinity;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
        const v = fbm(noise, gx(i) / scale, gy(j) / scale, octaves);
        field[j * (nx + 1) + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
    }
    if (!(hi - lo > 1e-9)) return [];
    const at = (i: number, j: number) => (field[j * (nx + 1) + i] - lo) / (hi - lo);

    // Crossing on the edge between grid points (i0,j0)–(i1,j1), always walked from the
    // lower-indexed end, so both neighbouring cells get the same float.
    const cross = (i0: number, j0: number, i1: number, j1: number, t: number): PathAnchor => {
        if (i1 < i0 || j1 < j0) [i0, j0, i1, j1] = [i1, j1, i0, j0];
        const v0 = at(i0, j0), v1 = at(i1, j1);
        const u = v1 === v0 ? 0.5 : (t - v0) / (v1 - v0);
        return { x: gx(i0) + (gx(i1) - gx(i0)) * u, y: gy(j0) + (gy(j1) - gy(j0)) * u, kind: 'corner' };
    };

    const ink: PathAnchor[][] = [];   // finished subpath anchors, per role
    const bold: PathAnchor[][] = [];
    const closedFlags = new Map<PathAnchor[], boolean>();

    for (let L = 1; L <= levels; L++) {
        const t = L / (levels + 1);
        const segs: PathAnchor[][] = [];
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
            const tl = at(i, j), tr = at(i + 1, j), br = at(i + 1, j + 1), bl = at(i, j + 1);
            const c = (tl > t ? 8 : 0) | (tr > t ? 4 : 0) | (br > t ? 2 : 0) | (bl > t ? 1 : 0);
            if (c === 0 || c === 15) continue;
            const T = () => cross(i, j, i + 1, j, t);
            const R = () => cross(i + 1, j, i + 1, j + 1, t);
            const B = () => cross(i, j + 1, i + 1, j + 1, t);
            const Lf = () => cross(i, j, i, j + 1, t);
            switch (c) {
                case 1: case 14: segs.push([Lf(), B()]); break;
                case 2: case 13: segs.push([B(), R()]); break;
                case 3: case 12: segs.push([Lf(), R()]); break;
                case 4: case 11: segs.push([T(), R()]); break;
                case 6: case 9: segs.push([T(), B()]); break;
                case 7: case 8: segs.push([Lf(), T()]); break;
                case 5: case 10: {
                    // Saddle: the cell centre decides which diagonal pair is connected.
                    const high = (tl + tr + br + bl) / 4 > t;
                    if ((c === 5) === high) { segs.push([Lf(), T()]); segs.push([B(), R()]); }
                    else { segs.push([Lf(), B()]); segs.push([T(), R()]); }
                    break;
                }
            }
        }
        const target = indexEvery > 0 && L % indexEvery === 0 ? bold : ink;
        for (const sp of chainSegments(segs, 1e-6)) {
            const pts = thin(sp.anchors, cell * 1.5, sp.closed);
            if (pts.length < 2) continue;
            const a = smoothThrough(pts, sp.closed && pts.length >= 3);
            target.push(a);
            closedFlags.set(a, sp.closed && pts.length >= 3);
        }
    }

    const layers: DoodleLayer[] = [];
    const wrap = (list: PathAnchor[][]) => list.map(anchors => ({ anchors, closed: closedFlags.get(anchors) ?? false }));
    if (ink.length) layers.push({ role: 'ink', subpaths: wrap(ink) });
    if (bold.length) layers.push({ role: 'inkBold', subpaths: wrap(bold) });
    return layers;
}
