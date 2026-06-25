/**
 * Image trace — threshold a bitmap into a binary mask and extract its contours as vector
 * loops via marching squares, then simplify. Holes fall out naturally (each region boundary
 * is its own loop) and render with the even-odd fill rule. B&W / silhouette trace; colour
 * tracing (multiple layers) is a later extension.
 */

type Pt = { x: number; y: number };

/** Build a binary mask (1 = "ink") from RGBA pixels: luminance below threshold, or, for
 *  images with transparency, any opaque pixel. */
function toBinary(data: Uint8ClampedArray, w: number, h: number, threshold: number): Uint8Array {
    const bin = new Uint8Array(w * h);
    let anyAlpha = false;
    for (let i = 3; i < data.length; i += 4) if (data[i] < 250) { anyAlpha = true; break; }
    for (let p = 0; p < w * h; p++) {
        const a = data[p * 4 + 3];
        if (anyAlpha) {
            bin[p] = a > 128 ? 1 : 0;            // transparent PNG → trace the opaque shape
        } else {
            const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            bin[p] = lum < threshold ? 1 : 0;    // dark ink on light ground
        }
    }
    return bin;
}

// Marching-squares: per 2×2 cell, which edges the iso-line crosses (T=0,R=1,B=2,L=3).
const SEG: number[][][] = [
    [], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[0, 3], [2, 1]], [[0, 2]], [[0, 3]],
    [[0, 3]], [[0, 2]], [[0, 1], [2, 3]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], [],
];
// Edge → midpoint coord (in grid units), given cell origin (cx, cy).
function edgePt(edge: number, cx: number, cy: number): Pt {
    switch (edge) {
        case 0: return { x: cx + 0.5, y: cy };       // top
        case 1: return { x: cx + 1, y: cy + 0.5 };   // right
        case 2: return { x: cx + 0.5, y: cy + 1 };   // bottom
        default: return { x: cx, y: cy + 0.5 };      // left
    }
}
const key = (p: Pt) => `${Math.round(p.x * 2)}_${Math.round(p.y * 2)}`;

/** Extract closed contour loops from a binary mask (padded so edge-touching shapes close). */
function marchingSquares(bin: Uint8Array, w: number, h: number): Pt[][] {
    // Pad by 1 so regions touching the border still produce closed loops.
    const W = w + 2, H = h + 2;
    const g = (x: number, y: number) => (x >= 1 && x <= w && y >= 1 && y <= h) ? bin[(y - 1) * w + (x - 1)] : 0;
    // Collect undirected segments keyed by endpoints.
    const adj = new Map<string, Pt[]>();        // pointKey → connected points
    const addSeg = (a: Pt, b: Pt) => {
        const ka = key(a), kb = key(b);
        if (ka === kb) return;
        (adj.get(ka) || adj.set(ka, []).get(ka)!).push(b);
        (adj.get(kb) || adj.set(kb, []).get(kb)!).push(a);
    };
    for (let cy = 0; cy < H - 1; cy++) {
        for (let cx = 0; cx < W - 1; cx++) {
            const tl = g(cx, cy), tr = g(cx + 1, cy), br = g(cx + 1, cy + 1), bl = g(cx, cy + 1);
            const idx = tl * 8 + tr * 4 + br * 2 + bl * 1;
            for (const [e0, e1] of SEG[idx]) addSeg(edgePt(e0, cx, cy), edgePt(e1, cx, cy));
        }
    }
    // Stitch segments into loops by following shared endpoints.
    const loops: Pt[][] = [];
    const used = new Set<string>();
    const segId = (a: string, b: string) => a < b ? `${a}|${b}` : `${b}|${a}`;
    const ptByKey = new Map<string, Pt>();
    for (let cy = 0; cy < H - 1; cy++) for (let cx = 0; cx < W - 1; cx++) {
        const tl = g(cx, cy), tr = g(cx + 1, cy), br = g(cx + 1, cy + 1), bl = g(cx, cy + 1);
        for (const [e0, e1] of SEG[tl * 8 + tr * 4 + br * 2 + bl * 1]) {
            const a = edgePt(e0, cx, cy), b = edgePt(e1, cx, cy);
            ptByKey.set(key(a), a); ptByKey.set(key(b), b);
        }
    }
    for (const [startKey] of adj) {
        const neighbors = adj.get(startKey)!;
        for (const first of neighbors) {
            if (used.has(segId(startKey, key(first)))) continue;
            const loop: Pt[] = [ptByKey.get(startKey)!];
            let curKey = startKey, nextKey = key(first);
            while (!used.has(segId(curKey, nextKey))) {
                used.add(segId(curKey, nextKey));
                loop.push(ptByKey.get(nextKey)!);
                const cands = adj.get(nextKey) || [];
                let advanced = false;
                for (const c of cands) {
                    const ck = key(c);
                    if (!used.has(segId(nextKey, ck))) { curKey = nextKey; nextKey = ck; advanced = true; break; }
                }
                if (!advanced) break;
                if (nextKey === startKey) { used.add(segId(curKey, nextKey)); break; }
            }
            if (loop.length >= 4) loops.push(loop);
        }
    }
    return loops;
}

/** Ramer–Douglas–Peucker polyline simplify. */
function rdp(points: Pt[], eps: number): Pt[] {
    if (points.length < 3) return points;
    let maxD = 0, idx = 0;
    const a = points[0], b = points[points.length - 1];
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    for (let i = 1; i < points.length - 1; i++) {
        const p = points[i];
        const d = Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
        if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
        const left = rdp(points.slice(0, idx + 1), eps);
        const right = rdp(points.slice(idx), eps);
        return left.slice(0, -1).concat(right);
    }
    return [a, b];
}

/**
 * Trace RGBA image data into normalized vector subpaths (coords in [0,1]² of the image),
 * suitable for placing into a `path` element scaled to the source bounds.
 */
export function traceImageData(
    data: Uint8ClampedArray, w: number, h: number,
    opts: { threshold?: number; simplify?: number; minArea?: number } = {}
): { points: Pt[]; closed: boolean }[] {
    const threshold = opts.threshold ?? 128;
    const bin = toBinary(data, w, h, threshold);
    const loops = marchingSquares(bin, w, h);
    const eps = opts.simplify ?? 1.0;
    const minArea = opts.minArea ?? 8;
    const out: { points: Pt[]; closed: boolean }[] = [];
    for (const loop of loops) {
        const simp = rdp(loop, eps);
        if (simp.length < 3) continue;
        // Drop tiny specks by absolute polygon area (in grid units).
        let area = 0;
        for (let i = 0; i < simp.length; i++) { const p = simp[i], q = simp[(i + 1) % simp.length]; area += p.x * q.y - q.x * p.y; }
        if (Math.abs(area) / 2 < minArea) continue;
        // Normalize to [0,1] (loops are in the padded grid; subtract the 1-px pad).
        out.push({ points: simp.map(p => ({ x: (p.x - 1) / w, y: (p.y - 1) / h })), closed: true });
    }
    return out;
}
