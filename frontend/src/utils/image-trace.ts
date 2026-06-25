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

// ── Centre-line trace (Zhang–Suen thinning → skeleton polylines) ──────────────

/** Zhang–Suen thinning: erode a binary mask to a 1px-wide skeleton (medial axis). */
function skeletonize(bin: Uint8Array, w: number, h: number): Uint8Array {
    const s = bin.slice();
    const at = (x: number, y: number) => (x >= 0 && x < w && y >= 0 && y < h) ? s[y * w + x] : 0;
    let changed = true, guard = 0;
    while (changed && guard++ < 400) {
        changed = false;
        for (let step = 0; step < 2; step++) {
            const rm: number[] = [];
            for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
                if (!s[y * w + x]) continue;
                const p2 = at(x, y - 1), p3 = at(x + 1, y - 1), p4 = at(x + 1, y), p5 = at(x + 1, y + 1), p6 = at(x, y + 1), p7 = at(x - 1, y + 1), p8 = at(x - 1, y), p9 = at(x - 1, y - 1);
                const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
                if (B < 2 || B > 6) continue;
                const seq = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
                let A = 0; for (let i = 0; i < 8; i++) if (seq[i] === 0 && seq[i + 1] === 1) A++;
                if (A !== 1) continue;
                if (step === 0) { if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue; }
                else { if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue; }
                rm.push(y * w + x);
            }
            if (rm.length) { changed = true; for (const i of rm) s[i] = 0; }
        }
    }
    return s;
}

/** Walk a skeleton into polylines: follow degree-2 chains between nodes (endpoints/junctions). */
function traceSkeleton(skel: Uint8Array, w: number, h: number): Pt[][] {
    const NB = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
    const on = (x: number, y: number) => (x >= 0 && x < w && y >= 0 && y < h) ? skel[y * w + x] : 0;
    const deg = (x: number, y: number) => NB.reduce((n, [dx, dy]) => n + on(x + dx, y + dy), 0);
    const usedEdge = new Set<string>();
    const ek = (ax: number, ay: number, bx: number, by: number) => ax < bx || (ax === bx && ay <= by) ? `${ax},${ay}-${bx},${by}` : `${bx},${by}-${ax},${ay}`;
    const lines: Pt[][] = [];
    const walk = (sx: number, sy: number, fx: number, fy: number) => {
        const line: Pt[] = [{ x: sx, y: sy }];
        let px = sx, py = sy, nx = fx, ny = fy;
        while (true) {
            usedEdge.add(ek(px, py, nx, ny));
            line.push({ x: nx, y: ny });
            if (deg(nx, ny) !== 2) break;                    // reached a node
            let adv = false;
            for (const [dx, dy] of NB) {
                const cx = nx + dx, cy = ny + dy;
                if (!on(cx, cy)) continue;
                if (cx === px && cy === py) continue;
                if (usedEdge.has(ek(nx, ny, cx, cy))) continue;
                px = nx; py = ny; nx = cx; ny = cy; adv = true; break;
            }
            if (!adv) break;
        }
        if (line.length >= 2) lines.push(line);
    };
    // Start from every node (endpoint or junction), one walk per unused incident edge.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!skel[y * w + x]) continue;
        const d = deg(x, y);
        if (d === 2) continue;
        for (const [dx, dy] of NB) {
            const cx = x + dx, cy = y + dy;
            if (on(cx, cy) && !usedEdge.has(ek(x, y, cx, cy))) walk(x, y, cx, cy);
        }
    }
    // Remaining pure loops (all degree-2): start anywhere on an unused edge.
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!skel[y * w + x]) continue;
        for (const [dx, dy] of NB) {
            const cx = x + dx, cy = y + dy;
            if (on(cx, cy) && !usedEdge.has(ek(x, y, cx, cy))) walk(x, y, cx, cy);
        }
    }
    return lines;
}

/** Centre-line trace: returns OPEN polylines (normalized [0,1]²) of the image's skeleton. */
export function traceImageCenterline(
    data: Uint8ClampedArray, w: number, h: number,
    opts: { threshold?: number; simplify?: number; minLen?: number } = {}
): { points: Pt[]; closed: boolean }[] {
    const bin = toBinary(data, w, h, opts.threshold ?? 128);
    const skel = skeletonize(bin, w, h);
    const lines = traceSkeleton(skel, w, h);
    const eps = opts.simplify ?? 1.2;
    const minLen = opts.minLen ?? 4;
    const out: { points: Pt[]; closed: boolean }[] = [];
    for (const ln of lines) {
        if (ln.length < minLen) continue;
        const simp = rdp(ln, eps);
        if (simp.length < 2) continue;
        out.push({ points: simp.map(p => ({ x: (p.x + 0.5) / w, y: (p.y + 0.5) / h })), closed: false });
    }
    return out;
}

// ── Colour trace (k-means quantize → one filled layer per colour) ─────────────

/** k-means colour quantization. Returns centroids + a per-pixel label (-1 = transparent). */
function quantizeColors(data: Uint8ClampedArray, w: number, h: number, k: number): { centroids: number[][]; labels: Int32Array } {
    const N = w * h;
    const step = Math.max(1, Math.floor(N / 4000)); // ~4000 samples for speed
    const samples: number[][] = [];
    for (let p = 0; p < N; p += step) { if (data[p * 4 + 3] < 128) continue; samples.push([data[p * 4], data[p * 4 + 1], data[p * 4 + 2]]); }
    if (samples.length === 0) return { centroids: [], labels: new Int32Array(N).fill(-1) };
    k = Math.min(k, samples.length);
    // Deterministic farthest-point (k-means++-style) seeding: spreads centroids across
    // distinct colours so a dominant background doesn't swallow every cluster. No RNG.
    const cents: number[][] = [[...samples[0]]];
    while (cents.length < k) {
        let bestIdx = 0, bestD = -1;
        for (let i = 0; i < samples.length; i++) {
            let md = Infinity;
            for (const c of cents) { const dr = samples[i][0] - c[0], dg = samples[i][1] - c[1], db = samples[i][2] - c[2]; md = Math.min(md, dr * dr + dg * dg + db * db); }
            if (md > bestD) { bestD = md; bestIdx = i; }
        }
        if (bestD <= 0) break; // no more distinct colours
        cents.push([...samples[bestIdx]]);
    }
    for (let it = 0; it < 8; it++) {
        const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
        for (const s of samples) {
            let best = 0, bd = Infinity;
            for (let c = 0; c < k; c++) { const dr = s[0] - cents[c][0], dg = s[1] - cents[c][1], db = s[2] - cents[c][2]; const d = dr * dr + dg * dg + db * db; if (d < bd) { bd = d; best = c; } }
            sums[best][0] += s[0]; sums[best][1] += s[1]; sums[best][2] += s[2]; sums[best][3]++;
        }
        for (let c = 0; c < k; c++) if (sums[c][3] > 0) cents[c] = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
    }
    const labels = new Int32Array(N).fill(-1);
    for (let p = 0; p < N; p++) {
        if (data[p * 4 + 3] < 128) continue;
        const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
        let best = 0, bd = Infinity;
        for (let c = 0; c < k; c++) { const dr = r - cents[c][0], dg = g - cents[c][1], db = b - cents[c][2]; const d = dr * dr + dg * dg + db * db; if (d < bd) { bd = d; best = c; } }
        labels[p] = best;
    }
    return { centroids: cents, labels };
}

function loopsToSubpaths(loops: Pt[][], w: number, h: number, eps: number, minArea: number) {
    const subs: { points: Pt[]; closed: boolean }[] = [];
    for (const loop of loops) {
        const simp = rdp(loop, eps);
        if (simp.length < 3) continue;
        let area = 0;
        for (let i = 0; i < simp.length; i++) { const p = simp[i], q = simp[(i + 1) % simp.length]; area += p.x * q.y - q.x * p.y; }
        if (Math.abs(area) / 2 < minArea) continue;
        subs.push({ points: simp.map(p => ({ x: (p.x - 1) / w, y: (p.y - 1) / h })), closed: true });
    }
    return subs;
}

const hex = (rgb: number[]) => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/** Colour trace: one filled layer per quantized colour, sorted background-first (largest area). */
export function traceImageDataColor(
    data: Uint8ClampedArray, w: number, h: number,
    opts: { colors?: number; simplify?: number; minArea?: number } = {}
): { color: string; subpaths: { points: Pt[]; closed: boolean }[] }[] {
    const k = opts.colors ?? 6;
    const eps = opts.simplify ?? 1.0;
    const minArea = opts.minArea ?? 12;
    const { centroids, labels } = quantizeColors(data, w, h, k);
    const layers: { color: string; subpaths: { points: Pt[]; closed: boolean }[]; area: number }[] = [];
    for (let c = 0; c < centroids.length; c++) {
        const bin = new Uint8Array(w * h);
        let cnt = 0;
        for (let p = 0; p < w * h; p++) if (labels[p] === c) { bin[p] = 1; cnt++; }
        if (cnt < minArea) continue;
        const subs = loopsToSubpaths(marchingSquares(bin, w, h), w, h, eps, minArea);
        if (!subs.length) continue;
        layers.push({ color: hex(centroids[c]), subpaths: subs, area: cnt });
    }
    layers.sort((a, b) => b.area - a.area); // background-first stacking
    return layers.map(({ color, subpaths }) => ({ color, subpaths }));
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
