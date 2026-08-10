/**
 * Live Corners for editable paths — a per-anchor `cornerRadius` that rounds the corner at
 * serialization time rather than by rewriting the anchor list.
 *
 * The radius lives on the anchor and the fillet is applied inside `anchorsToPathData`, so
 * it is genuinely non-destructive: the anchor you drag with Direct Selection is still the
 * original corner, the radius survives moving it, and every consumer that renders, fills,
 * hit-tests or exports the path goes through the same serializer and therefore agrees
 * about where the outline is. Node editing reads the raw anchors and so keeps showing the
 * corner you actually own.
 *
 * Why not reuse `corner-radius.ts`: that one is rectangle-specific and stores radii as a
 * PERCENT of the shorter side, which is what keeps a rounded rect in proportion when you
 * resize it. An open path has no "shorter side", so path corners are in px (element-local
 * units, the same frame as the anchor coordinates).
 *
 * The construction is a tangent-continuous blend: walk back `t = r / tan(θ/2)` along each
 * adjacent segment from the corner, then join the two trim points with a single cubic whose
 * control arms follow the tangents there. When both sides are straight this is the standard
 * cubic approximation of the circular arc of radius r — the one every renderer uses for
 * rounded rectangles, radially accurate to about 0.03% (see the test) — and that covers
 * polygons, stars, traced artwork and pen-drawn straight runs. When a side is curved the
 * join passes through the two trim points along the tangents there rather than being
 * tangent to a true offset curve; visually a rounded corner, and continuous, which is what
 * the eye is actually judging.
 *
 * Note `t` comes from the angle, not from r directly: an obtuse corner needs less trim than
 * its radius and an acute one needs more, which is why a 45° spike and a 135° elbow with
 * the same radius still look like the same amount of rounding.
 */

import type { PathAnchor } from '../types';

interface Vec { x: number; y: number }

/** A segment between two consecutive nodes: a straight line, or a cubic with two arms. */
interface Seg { p0: Vec; c1: Vec; c2: Vec; p3: Vec; straight: boolean }

const EPS = 1e-9;

const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s });
const len = (a: Vec): number => Math.hypot(a.x, a.y);
const norm = (a: Vec): Vec | null => { const l = len(a); return l < EPS ? null : { x: a.x / l, y: a.y / l }; };

/** True when any anchor carries a usable radius — lets the serializer skip all of this. */
export function hasLiveCorners(anchors: PathAnchor[] | undefined | null): boolean {
    if (!anchors) return false;
    for (const a of anchors) if (a.cornerRadius && a.cornerRadius > 0) return true;
    return false;
}

/** The segment leaving `a` toward `b`, in the same "a curve iff either handle exists"
 *  terms `anchorsToPathData` uses — so a fillet can never disagree with the plain path. */
function segmentOf(a: PathAnchor, b: PathAnchor): Seg {
    const p0 = { x: a.x, y: a.y };
    const p3 = { x: b.x, y: b.y };
    const straight = a.outX === undefined && a.outY === undefined
        && b.inX === undefined && b.inY === undefined;
    return {
        p0, p3, straight,
        c1: { x: a.x + (a.outX ?? 0), y: a.y + (a.outY ?? 0) },
        c2: { x: b.x + (b.inX ?? 0), y: b.y + (b.inY ?? 0) },
    };
}

const cubicAt = (s: Seg, t: number): Vec => {
    const u = 1 - t;
    const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
    return {
        x: w0 * s.p0.x + w1 * s.c1.x + w2 * s.c2.x + w3 * s.p3.x,
        y: w0 * s.p0.y + w1 * s.c1.y + w2 * s.c2.y + w3 * s.p3.y,
    };
};

const SAMPLES = 32;

/** Chord-sum length. Straight segments are exact; 32 samples is far below the error a
 *  corner radius is ever specified to. */
function segLength(s: Seg): number {
    if (s.straight) return len(sub(s.p3, s.p0));
    let total = 0, prev = s.p0;
    for (let i = 1; i <= SAMPLES; i++) { const p = cubicAt(s, i / SAMPLES); total += len(sub(p, prev)); prev = p; }
    return total;
}

/** Parameter at which the arc length measured from `p0` reaches `target`. */
function paramAtLength(s: Seg, target: number): number {
    if (s.straight) { const L = len(sub(s.p3, s.p0)); return L < EPS ? 0 : Math.min(1, target / L); }
    let acc = 0, prev = s.p0;
    for (let i = 1; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const p = cubicAt(s, t);
        const d = len(sub(p, prev));
        if (acc + d >= target) {
            const f = d < EPS ? 0 : (target - acc) / d;
            return (i - 1 + f) / SAMPLES;
        }
        acc += d; prev = p;
    }
    return 1;
}

/** de Casteljau split; returns the two halves of a cubic (or of a line). */
function splitAt(s: Seg, t: number): [Seg, Seg] {
    if (s.straight) {
        const m = add(s.p0, mul(sub(s.p3, s.p0), t));
        return [
            { p0: s.p0, p3: m, c1: s.p0, c2: m, straight: true },
            { p0: m, p3: s.p3, c1: m, c2: s.p3, straight: true },
        ];
    }
    const ab = add(s.p0, mul(sub(s.c1, s.p0), t));
    const bc = add(s.c1, mul(sub(s.c2, s.c1), t));
    const cd = add(s.c2, mul(sub(s.p3, s.c2), t));
    const abc = add(ab, mul(sub(bc, ab), t));
    const bcd = add(bc, mul(sub(cd, bc), t));
    const m = add(abc, mul(sub(bcd, abc), t));
    return [
        { p0: s.p0, c1: ab, c2: abc, p3: m, straight: false },
        { p0: m, c1: bcd, c2: cd, p3: s.p3, straight: false },
    ];
}

/** Unit tangent at the two ends, pointing along the direction of travel. Falls back
 *  through degenerate control arms to the chord, which is what SVG itself does. */
function tangents(s: Seg): { start: Vec | null; end: Vec | null } {
    const chord = norm(sub(s.p3, s.p0));
    const start = norm(sub(s.c1, s.p0)) ?? norm(sub(s.c2, s.p0)) ?? chord;
    const end = norm(sub(s.p3, s.c2)) ?? norm(sub(s.p3, s.c1)) ?? chord;
    return { start, end };
}

/**
 * Round every anchor that carries a `cornerRadius`, returning a new anchor list that draws
 * the filleted outline. The input is never mutated. Anchors without a radius — and the two
 * endpoints of an open path, which have nothing to round between — pass through untouched.
 *
 * Radii are clamped per corner so a fillet can never eat more than its share of an adjacent
 * segment: two rounded corners on a short edge shrink together rather than crossing over.
 */
export function filletAnchors(anchors: PathAnchor[], closed: boolean): PathAnchor[] {
    if (!anchors || anchors.length < 3 || !hasLiveCorners(anchors)) return anchors;

    const n = anchors.length;
    const segCount = closed ? n : n - 1;
    // segs[i] runs from anchor i to anchor i+1 (wrapping on the last when closed).
    const segs: Seg[] = [];
    for (let i = 0; i < segCount; i++) segs.push(segmentOf(anchors[i], anchors[(i + 1) % n]));
    const lens = segs.map(segLength);

    // Per-anchor trim distance `t` along both adjacent segments, from r = t·tan(θ/2).
    const trim = new Array<number>(n).fill(0);
    const half = new Array<number>(n).fill(0);   // tan(θ/2) per corner, to recover r after clamping
    for (let i = 0; i < n; i++) {
        const r = anchors[i].cornerRadius ?? 0;
        if (!(r > 0)) continue;
        const prevSeg = closed ? segs[(i - 1 + n) % n] : (i > 0 ? segs[i - 1] : null);
        const nextSeg = closed ? segs[i] : (i < n - 1 ? segs[i] : null);
        if (!prevSeg || !nextSeg) continue;             // open-path endpoint: nothing to round

        // Directions leaving the corner, back along the incoming segment and on along the
        // outgoing one. The angle between them is the corner's interior angle.
        const back = tangents(prevSeg).end;
        const fwd = tangents(nextSeg).start;
        if (!back || !fwd) continue;
        const u = mul(back, -1);
        const cos = Math.max(-1, Math.min(1, u.x * fwd.x + u.y * fwd.y));
        const theta = Math.acos(cos);
        // Collinear (nothing to round) or a perfect spike (the fillet would run to infinity).
        if (theta > Math.PI - 1e-4 || theta < 1e-4) continue;
        const tanHalf = Math.tan(theta / 2);
        if (!(tanHalf > EPS)) continue;
        half[i] = tanHalf;
        trim[i] = r / tanHalf;
    }

    // Cap each corner at HALF of an adjacent segment when the far end of that segment is
    // rounded too, and at (nearly) all of it when it isn't. Capping per corner rather than
    // rescaling per segment is what keeps it symmetric: an earlier version walked the
    // segments in order and shrank whichever corner it met first, so four equal radii on a
    // square came out four different sizes. Half each also guarantees the two fillets on a
    // segment can never cross, without any iteration.
    for (let i = 0; i < n; i++) {
        if (!(trim[i] > 0)) continue;
        const prevIdx = closed ? (i - 1 + n) % n : i - 1;
        const nextIdx = closed ? i : i;
        const share = (segIdx: number, farAnchor: number) =>
            lens[segIdx] * (trim[farAnchor] > 0 ? 0.5 : 0.999);
        let cap = Infinity;
        if (prevIdx >= 0 && prevIdx < segCount) cap = Math.min(cap, share(prevIdx, (i - 1 + n) % n));
        if (nextIdx >= 0 && nextIdx < segCount) cap = Math.min(cap, share(nextIdx, (i + 1) % n));
        if (Number.isFinite(cap)) trim[i] = Math.min(trim[i], cap);
    }

    // Nodes + the links between them, assembled in path order.
    const pts: Vec[] = [];
    const links: Seg[] = [];
    // Per anchor: the trimmed remnants of its two adjacent segments, or null when unrounded.
    const cut: ({ inSeg: Seg; outSeg: Seg; t1: Vec; t2: Vec } | null)[] = new Array(n).fill(null);

    for (let i = 0; i < n; i++) {
        if (!(trim[i] > EPS) || !(half[i] > EPS)) continue;
        const pi = (i - 1 + n) % n;
        const prevSeg = closed ? segs[pi] : (i > 0 ? segs[i - 1] : null);
        const nextSeg = closed ? segs[i] : (i < n - 1 ? segs[i] : null);
        if (!prevSeg || !nextSeg) continue;
        // Incoming: keep the head, ending `trim` short of the corner.
        const tIn = paramAtLength(prevSeg, Math.max(0, lens[closed ? pi : i - 1] - trim[i]));
        const inSeg = splitAt(prevSeg, tIn)[0];
        // Outgoing: keep the tail, starting `trim` past the corner.
        const tOut = paramAtLength(nextSeg, trim[i]);
        const outSeg = splitAt(nextSeg, tOut)[1];
        cut[i] = { inSeg, outSeg, t1: inSeg.p3, t2: outSeg.p0 };
    }

    /** The segment between anchor i and i+1, trimmed at whichever ends were rounded. */
    const linkFor = (s: number): Seg => {
        const i = s, j = (s + 1) % n;
        const ci = cut[i], cj = cut[j];
        if (!ci && !cj) return segs[s];
        // Each side already split the full segment; re-split the survivor for the other end.
        let seg = ci ? ci.outSeg : segs[s];
        if (cj) {
            const L = segLength(seg);
            const keep = Math.max(0, L - trim[j]);
            seg = splitAt(seg, paramAtLength(seg, keep))[0];
        }
        return seg;
    };

    /** The rounding arc across a cut corner: a cubic that leaves along the incoming tangent
     *  and arrives along the outgoing one, circular when both sides were straight. */
    const arcFor = (i: number): Seg => {
        const c = cut[i]!;
        const d1 = tangents(c.inSeg).end ?? { x: 1, y: 0 };
        const d2 = tangents(c.outSeg).start ?? d1;
        const chord = len(sub(c.t2, c.t1));
        const cos = Math.max(-1, Math.min(1, d1.x * d2.x + d1.y * d2.y));
        const delta = Math.acos(cos);              // total turn across the corner
        // Radius of the circle through both trim points with those tangents; k is the
        // standard cubic approximation arm for an arc of that radius (4/3·tan(Δ/4)·R).
        const sinHalf = Math.sin(delta / 2);
        const R = sinHalf < EPS ? 0 : chord / (2 * sinHalf);
        const k = (4 / 3) * Math.tan(delta / 4) * R;
        return {
            p0: c.t1, p3: c.t2, straight: false,
            c1: add(c.t1, mul(d1, k)),
            c2: sub(c.t2, mul(d2, k)),
        };
    };

    for (let i = 0; i < n; i++) {
        const c = cut[i];
        if (c) {
            pts.push(c.t1); links.push(arcFor(i));
            pts.push(c.t2);
        } else {
            pts.push({ x: anchors[i].x, y: anchors[i].y });
        }
        if (i < segCount) links.push(linkFor(i));
    }
    // `links` is now interleaved with `pts`: links[k] joins pts[k] to pts[k+1] (wrapping).

    // Handles and kinds are re-derived from the links rather than carried over from the
    // input: after trimming, the links are the only thing that knows what the geometry is.
    const out: PathAnchor[] = pts.map(p => ({ x: p.x, y: p.y, kind: 'corner' } as PathAnchor));
    for (let k = 0; k < links.length; k++) {
        const a = out[k], b = out[(k + 1) % out.length];
        if (!a || !b) continue;
        const l = links[k];
        if (l.straight) continue;
        const o = sub(l.c1, l.p0), i2 = sub(l.c2, l.p3);
        if (Math.abs(o.x) > EPS || Math.abs(o.y) > EPS) { a.outX = o.x; a.outY = o.y; }
        if (Math.abs(i2.x) > EPS || Math.abs(i2.y) > EPS) { b.inX = i2.x; b.inY = i2.y; }
    }
    for (let i = 0; i < out.length; i++) {
        if (out[i].outX !== undefined && out[i].inX !== undefined) out[i].kind = 'smooth';
    }
    return out;
}

/**
 * Largest radius the corner at `index` can take before it would consume a whole adjacent
 * segment — what a drag widget clamps to, and what the panel shows as the slider maximum.
 * Returns 0 for anchors that cannot be rounded (open-path endpoints, collinear corners).
 */
export function maxCornerRadius(anchors: PathAnchor[], closed: boolean, index: number): number {
    const n = anchors?.length ?? 0;
    if (n < 3 || index < 0 || index >= n) return 0;
    if (!closed && (index === 0 || index === n - 1)) return 0;
    const prevSeg = segmentOf(anchors[(index - 1 + n) % n], anchors[index]);
    const nextSeg = segmentOf(anchors[index], anchors[(index + 1) % n]);
    const back = tangents(prevSeg).end, fwd = tangents(nextSeg).start;
    if (!back || !fwd) return 0;
    const u = mul(back, -1);
    const theta = Math.acos(Math.max(-1, Math.min(1, u.x * fwd.x + u.y * fwd.y)));
    if (theta > Math.PI - 1e-4 || theta < 1e-4) return 0;
    // Half of the shorter neighbour, so two rounded corners on one edge still fit.
    const t = Math.min(segLength(prevSeg), segLength(nextSeg)) / 2;
    return t * Math.tan(theta / 2);
}
