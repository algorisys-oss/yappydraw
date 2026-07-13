/**
 * Path-intersection points (Precision & Measurement — Phase 4c).
 *
 * Where two elements' outlines cross is a meaningful place to snap to (Illustrator's
 * "intersect" smart point). This computes those crossing points among a set of
 * static elements so they can be fed to `getPointSnap` as extra snap targets.
 *
 * Outlines are approximated as line segments: rect/most shapes → their 4 bbox edges;
 * circles/ellipses → a polygon; lines/arrows → the single segment; vector paths →
 * their anchor polyline (straight approximation of curves, closed). Pure geometry —
 * no store/DOM. JS-only, like `point-snapping.ts`, so no WASM-parity burden.
 */

export interface Pt { x: number; y: number; }
interface Seg { a: Pt; b: Pt; }

interface IsectElement {
    id: string;
    x: number; y: number; width: number; height: number;
    type?: string;
    layerId?: string | null;
    pathAnchors?: Pt[];
    pathSubpaths?: { anchors: Pt[] }[];
}

const ELLIPSE_STEPS = 24;

/** Optional per-element outline supplier: world-space points, or null to use the default. */
export type OutlineOf = (el: IsectElement) => Pt[] | null;

const closedPolylineSegs = (pts: Pt[]): Seg[] => {
    if (pts.length < 2) return [];
    return pts.map((a, i) => ({ a, b: pts[(i + 1) % pts.length] }));
};

/** World-space outline segments approximating an element. */
export function elementSegments(el: IsectElement, outlineOf?: OutlineOf): Seg[] {
    const { x, y, width: w, height: h } = el;

    // Vector path: polyline through the anchors (per subpath), closed.
    const subs = el.pathSubpaths?.length ? el.pathSubpaths : (el.pathAnchors?.length ? [{ anchors: el.pathAnchors }] : null);
    if (subs) {
        const segs: Seg[] = [];
        for (const s of subs) {
            const pts = s.anchors.map(a => ({ x: x + a.x, y: y + a.y }));
            for (let i = 0; i < pts.length; i++) {
                const a = pts[i], b = pts[(i + 1) % pts.length];
                if (pts.length > 1) segs.push({ a, b });
            }
        }
        return segs;
    }

    if (el.type === 'circle') {
        const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
        const pts: Pt[] = [];
        for (let i = 0; i < ELLIPSE_STEPS; i++) {
            const t = (i / ELLIPSE_STEPS) * Math.PI * 2;
            pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
        }
        return pts.map((a, i) => ({ a, b: pts[(i + 1) % pts.length] }));
    }

    if (el.type === 'line' || el.type === 'arrow') {
        return [{ a: { x, y }, b: { x: x + w, y: y + h } }];
    }

    // True outline when the caller supplies one (e.g. via shapeToPath) — this makes
    // concave/rotated shapes (triangle, star, diamond…) cross on their real edges,
    // not their bounding box.
    const outline = outlineOf?.(el);
    if (outline && outline.length >= 2) return closedPolylineSegs(outline);

    // Default: bounding-box rectangle edges.
    const tl = { x, y }, tr = { x: x + w, y }, br = { x: x + w, y: y + h }, bl = { x, y: y + h };
    return [{ a: tl, b: tr }, { a: tr, b: br }, { a: br, b: bl }, { a: bl, b: tl }];
}

/** Intersection point of segments p1p2 and p3p4, or null if they don't cross. */
export function segmentIntersection(p1: Pt, p2: Pt, p3: Pt, p4: Pt): Pt | null {
    const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
    const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
    const denom = d1x * d2y - d1y * d2x;
    if (Math.abs(denom) < 1e-9) return null; // parallel / degenerate
    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
    const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
    if (t < 0 || t > 1 || u < 0 || u > 1) return null;
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

const bbox = (el: IsectElement) => ({
    minX: Math.min(el.x, el.x + el.width), maxX: Math.max(el.x, el.x + el.width),
    minY: Math.min(el.y, el.y + el.height), maxY: Math.max(el.y, el.y + el.height),
});
const bboxOverlap = (a: IsectElement, b: IsectElement) => {
    const ba = bbox(a), bb = bbox(b);
    return ba.minX <= bb.maxX && bb.minX <= ba.maxX && ba.minY <= bb.maxY && bb.minY <= ba.maxY;
};

/**
 * All pairwise outline-crossing points among the given elements. A bbox
 * broad-phase skips element pairs that can't possibly cross; near-duplicate points
 * are merged. Order is unspecified.
 */
export function getIntersectionPoints(elements: IsectElement[], outlineOf?: OutlineOf): Pt[] {
    const out: Pt[] = [];
    const segCache = new Map<string, Seg[]>();
    const segsOf = (el: IsectElement) => {
        let s = segCache.get(el.id);
        if (!s) { s = elementSegments(el, outlineOf); segCache.set(el.id, s); }
        return s;
    };

    for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
            const A = elements[i], B = elements[j];
            if (!bboxOverlap(A, B)) continue;
            const sa = segsOf(A), sb = segsOf(B);
            for (const s1 of sa) for (const s2 of sb) {
                const p = segmentIntersection(s1.a, s1.b, s2.a, s2.b);
                if (p) out.push(p);
            }
        }
    }

    // Merge near-duplicates (within 0.5px).
    const merged: Pt[] = [];
    for (const p of out) {
        if (!merged.some(m => Math.abs(m.x - p.x) < 0.5 && Math.abs(m.y - p.y) < 0.5)) merged.push(p);
    }
    return merged;
}
