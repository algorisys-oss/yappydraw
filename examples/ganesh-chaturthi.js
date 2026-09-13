/**
 * Ganesh Chaturthi — "Ganpati Bappa Morya!" — a festive vector illustration,
 * drawn and animated entirely with the YappyDraw browser API.
 *
 * Paste this whole file into the DevTools console of a running YappyDraw tab
 * (or run it with Playwright). It builds a 1600×900 design page and a 16-second
 * looping keyframe composition, then plays it. To re-run: `await Ganpati.build(); Ganpati.play()`.
 * The saved document is `examples/ganesh-chaturthi.yappy` (open it from Menu → Open).
 *
 * Everything is native YappyDraw geometry — `createPath` / `createMultiPath`
 * (bezier anchors), `createCircle`, `createText` — with linear/radial gradient
 * fills, glow, dashed strokes and round caps. Nothing is an embedded image.
 *
 * The artwork is authored in the same coordinate space as the tinyfly SVG
 * showcase (src/examples/showcases/ganesh-chaturthi.js) so the composition and
 * palette match; a tiny path-data reader turns each outline into Yappy anchors.
 *
 * Animation uses the After-Effects–class composition timeline (Scene Timeline /
 * Keyframes panel):
 *   - absolute-time property keyframes (x, y, width, height, angle, opacity)
 *   - named easings and cubic-bezier eases, hold (stepped) keys
 *   - transform parenting to null objects, so rotations and squashes pivot
 *     where they should (a strand from its knot, the trunk from its root,
 *     a flame from its wick, Mooshak from his feet)
 * Idle loops (toran, halo, trunk, ears, flames, petals) are seamless over the 16s
 * scene; the greeting and Mooshak's drop-in replay at the top of each loop.
 * The Scene Timeline loops the composition; with it closed the canvas plays it once.
 *
 * Uses only the public API. Building takes ~1–2 minutes (633 elements, ~3500 keys),
 * mostly per-element undo snapshots.
 */
window.Ganpati = (() => {
    const Y = window.Yappy;

    // ── Scene constants ─────────────────────────────────────────────────────
    const PAGE_W = 1600;
    const PAGE_H = 900;
    const LOOP = 16;                    // seconds; every idle motion divides this evenly

    const ART_SCALE = 1.02;             // tinyfly art space → page space
    const ART_X = 784;
    const ART_Y = 182;

    const SKIN = '#f7a35c';
    const SKIN_SHADE = '#e0823a';
    const OUTLINE = '#a84f1c';
    const GOLD = [
        { offset: 0, color: '#fff1a8' },
        { offset: 0.5, color: '#ffc53d' },
        { offset: 1, color: '#d98e04' },
    ];
    const GOLD_DIRECTION = 90;          // vertical: light at the top

    // ── Deterministic randomness (same petals & flicker on every build) ─────
    let seed = 2026;
    const random = (min = 0, max = 1) => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return min + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (max - min);
    };

    // ── 2D affine matrices [a, b, c, d, e, f] ───────────────────────────────
    const mul = (m, n) => [
        m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
        m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
        m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
    ];
    const chain = (...ms) => ms.reduce(mul);
    const T = (x, y) => [1, 0, 0, 1, x, y];
    const S = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];
    const R = (deg, cx = 0, cy = 0) => {
        const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
        return chain(T(cx, cy), [c, s, -s, c, 0, 0], T(-cx, -cy));
    };
    const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
    const applyVec = (m, x, y) => [m[0] * x + m[2] * y, m[1] * x + m[3] * y];
    const scaleOf = m => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));

    const ART = chain(T(ART_X, ART_Y), S(ART_SCALE));
    const PAGE = [1, 0, 0, 1, 0, 0];

    // ── Path data → Yappy anchors ───────────────────────────────────────────
    // Supports M L H V C Q Z (absolute and relative) — all this artwork needs.
    function parsePathData(d) {
        const tokens = d.match(/[MmLlHhVvCcQqZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
        const subpaths = [];
        let cur = null, cmd = '', i = 0, x = 0, y = 0, sx = 0, sy = 0;
        const num = () => parseFloat(tokens[i++]);
        while (i < tokens.length) {
            if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
            const rel = cmd === cmd.toLowerCase();
            const C = cmd.toUpperCase();
            if (C === 'Z') {
                if (cur) cur.closed = true;
                x = sx; y = sy;
                cur = null;
                continue;
            }
            if (C === 'M') {
                x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num();
                sx = x; sy = y;
                cur = { anchors: [{ x, y }], closed: false };
                subpaths.push(cur);
                cmd = rel ? 'l' : 'L';                 // implicit lineto after moveto
                continue;
            }
            if (!cur) { cur = { anchors: [{ x, y }], closed: false }; subpaths.push(cur); }
            const last = cur.anchors[cur.anchors.length - 1];
            if (C === 'L') {
                x = (rel ? x : 0) + num(); y = (rel ? y : 0) + num();
                cur.anchors.push({ x, y });
            } else if (C === 'H') {
                x = (rel ? x : 0) + num();
                cur.anchors.push({ x, y });
            } else if (C === 'V') {
                y = (rel ? y : 0) + num();
                cur.anchors.push({ x, y });
            } else if (C === 'C') {
                const bx = rel ? x : 0, by = rel ? y : 0;
                const c1x = bx + num(), c1y = by + num(), c2x = bx + num(), c2y = by + num();
                x = bx + num(); y = by + num();
                last.out = [c1x, c1y];
                cur.anchors.push({ x, y, in: [c2x, c2y] });
            } else if (C === 'Q') {
                const bx = rel ? x : 0, by = rel ? y : 0;
                const qx = bx + num(), qy = by + num();
                const nx = bx + num(), ny = by + num();
                last.out = [x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y)];
                cur.anchors.push({ x: nx, y: ny, in: [nx + (2 / 3) * (qx - nx), ny + (2 / 3) * (qy - ny)] });
                x = nx; y = ny;
            } else {
                throw new Error(`Unsupported path command "${cmd}" in: ${d}`);
            }
        }
        // A closed subpath whose last point returns to its start: fold the duplicate
        // end anchor into the first, so the seam is one real node.
        for (const sp of subpaths) {
            const a = sp.anchors;
            if (sp.closed && a.length > 2) {
                const first = a[0], end = a[a.length - 1];
                if (Math.abs(first.x - end.x) < 0.01 && Math.abs(first.y - end.y) < 0.01) {
                    first.in = end.in;
                    a.pop();
                }
            }
        }
        return subpaths;
    }

    /** Raw parsed subpaths → Yappy PathAnchor[] in page space. */
    function toAnchors(sp, m) {
        return sp.anchors.map(a => {
            const [px, py] = apply(m, a.x, a.y);
            const anchor = { x: px, y: py, kind: a.in && a.out ? 'smooth' : 'corner' };
            if (a.in) {
                const [vx, vy] = applyVec(m, a.in[0] - a.x, a.in[1] - a.y);
                anchor.inX = vx; anchor.inY = vy;
            }
            if (a.out) {
                const [vx, vy] = applyVec(m, a.out[0] - a.x, a.out[1] - a.y);
                anchor.outX = vx; anchor.outY = vy;
            }
            return anchor;
        });
    }

    // ── Element builders ────────────────────────────────────────────────────
    const created = [];                 // every element id, for bookkeeping
    const CLEAN = { renderStyle: 'architectural', roughness: 0, strokeStyle: 'solid', opacity: 100 };

    /** Stroke/fill options, with stroke width scaled into page space. */
    function styleFor(style, m) {
        const o = { ...CLEAN, strokeColor: 'transparent', strokeWidth: 0, backgroundColor: 'transparent', fillStyle: 'solid', ...style };
        if (style.strokeWidth) o.strokeWidth = style.strokeWidth * scaleOf(m);
        if (style.strokeDashArray) o.strokeDashArray = style.strokeDashArray.map(v => v * scaleOf(m));
        if (style.glowBlur) o.glowBlur = style.glowBlur * scaleOf(m);
        return o;
    }

    function path(d, style, m = ART) {
        const subs = parsePathData(d);
        const opts = styleFor(style, m);
        let id;
        if (subs.length === 1) {
            id = Y.createPath(toAnchors(subs[0], m), { ...opts, closed: subs[0].closed });
        } else {
            id = Y.createMultiPath(subs.map(sp => ({ anchors: toAnchors(sp, m), closed: sp.closed })), opts);
        }
        if (id) created.push(id);
        return id;
    }

    function ellipse(cx, cy, rx, ry, style, m = ART) {
        const [px, py] = apply(m, cx, cy);
        const k = scaleOf(m);
        const id = Y.createCircle(px - rx * k, py - ry * k, rx * 2 * k, ry * 2 * k, styleFor(style, m));
        created.push(id);
        return id;
    }
    const circle = (cx, cy, r, style, m = ART) => ellipse(cx, cy, r, r, style, m);

    /** A rounded rectangle as a path (so it can take an arbitrary transform). */
    function roundRect(x, y, w, h, r, style, m = ART) {
        const k = 0.5523 * r;
        const d = `M${x + r},${y} L${x + w - r},${y} C${x + w - r + k},${y} ${x + w},${y + r - k} ${x + w},${y + r}
            L${x + w},${y + h - r} C${x + w},${y + h - r + k} ${x + w - r + k},${y + h} ${x + w - r},${y + h}
            L${x + r},${y + h} C${x + r - k},${y + h} ${x},${y + h - r + k} ${x},${y + h - r}
            L${x},${y + r} C${x},${y + r - k} ${x + r - k},${y} ${x + r},${y} Z`;
        return path(d, style, m);
    }

    function text(x, y, value, style) {
        const id = Y.createText(x, y, value, { ...CLEAN, textAlign: 'left', verticalAlign: 'top', ...style });
        created.push(id);
        return id;
    }

    /** A null object (invisible transform parent) centred on a page-space point. */
    function nullAt(x, y, name, parent) {
        const id = Y.createNull(x, y);
        // Hidden: parenting still resolves, but the crosshair gizmo stays out of the
        // page PNG / GIF / video exports (which don't filter null objects themselves).
        Y.updateElement(id, { name, visible: false });
        if (parent) Y.setTransformParent(id, parent);
        return id;
    }
    const artPoint = (m, x, y) => apply(m, x, y);
    /** Parent every id created since `mark` to `parent`. */
    const adopt = (mark, parent) => { for (const id of created.slice(mark)) Y.setTransformParent(id, parent); };

    function newLayer(name) {
        const id = Y.addLayer(name);
        Y.setActiveLayer(id);
        return id;
    }

    // ── Keyframes: collected locally, committed as one composition ──────────
    const trackMap = new Map();
    function key(id, property, t, value, easing, extra) {
        const k = `${id}|${property}`;
        if (!trackMap.has(k)) trackMap.set(k, { elementId: id, property, keys: [] });
        const keys = trackMap.get(k).keys;
        const kf = { t: Math.round(t * 1000) / 1000, value };
        if (easing) kf.easing = easing;
        if (extra) Object.assign(kf, extra);
        const at = keys.findIndex(x => x.t === kf.t);
        if (at >= 0) keys[at] = kf; else keys.push(kf);
    }

    const easeInOutQuad = t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    /**
     * A seamless sine-like oscillation over [0, LOOP]: extrema every half period
     * (eased in-out between them), plus exact boundary keys at 0 and LOOP.
     * `period` must divide LOOP so the value at LOOP equals the value at 0.
     */
    function oscillate(id, property, base, amp, period, phase = 0) {
        const half = period / 2;
        const valueAt = t => {
            const u = (t - phase) / half;
            const n = Math.floor(u);
            const from = n % 2 === 0 ? base - amp : base + amp;
            const to = n % 2 === 0 ? base + amp : base - amp;
            return from + (to - from) * easeInOutQuad(u - n);
        };
        key(id, property, 0, valueAt(0));
        let n = Math.ceil((0 - phase) / half);
        for (let t = phase + n * half; t < LOOP; t = phase + (++n) * half) {
            if (t <= 0) continue;
            key(id, property, t, valueAt(t), 'easeInOutQuad');
        }
        key(id, property, LOOP, valueAt(LOOP), 'easeInOutQuad');
    }

    /** A damped wiggle (to amp, -amp·0.7, …, back to rest) starting at `t0`. */
    function wiggle(id, property, rest, amp, t0, duration, swings = 4) {
        key(id, property, t0, rest);
        for (let i = 1; i <= swings; i++) {
            const v = rest + amp * (i % 2 ? 1 : -1) * Math.pow(0.65, i - 1);
            key(id, property, t0 + (duration * i) / (swings + 1), v, 'easeInOutQuad');
        }
        key(id, property, t0 + duration, rest, 'easeInOutQuad');
    }

    /** Scale an element about its own centre via x/y/width/height keys. */
    function scaleKey(el, t, s, easing) {
        const w = el.width * s, h = el.height * s;
        key(el.id, 'x', t, el.x + (el.width - w) / 2, easing);
        key(el.id, 'y', t, el.y + (el.height - h) / 2, easing);
        key(el.id, 'width', t, w, easing);
        key(el.id, 'height', t, h, easing);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Artwork
    // ────────────────────────────────────────────────────────────────────────

    function modak(x, y, size, m) {
        const mm = chain(m, T(x, y), S(size / 20));
        path('M0,-20 C9,-12 16,-2 13,7 C9,13 -9,13 -13,7 C-16,-2 -9,-12 0,-20Z', { backgroundColor: '#fff4dc', strokeColor: '#e9b949', strokeWidth: 1.2, name: 'Modak' }, mm);
        path('M0,-19 L0,11 M0,-19 C-5,-8 -8,2 -7,10 M0,-19 C5,-8 8,2 7,10', { strokeColor: '#e9c46a', strokeWidth: 1, strokeLineCap: 'round' }, mm);
    }

    function marigold(x, y, r, tone, m = PAGE) {
        circle(x, y, r, { backgroundColor: tone ? '#ffb703' : '#ff8c1a', name: 'Marigold' }, m);
        circle(x, y, r * 0.72, { backgroundColor: tone ? '#fb8500' : '#f76707', strokeColor: tone ? '#ffd166' : '#ffa94d', strokeWidth: 1.5, strokeDashArray: [2, 2.5] }, m);
        circle(x, y, r * 0.32, { backgroundColor: '#c2410c' }, m);
    }

    function drawBackdrop() {
        // Warm light pooling behind the art, over the page's radial gradient.
        circle(1090, 470, 620, {
            fillStyle: 'radial', name: 'Warm light',
            gradientStops: [{ offset: 0, color: 'rgba(160,52,30,0.85)' }, { offset: 0.55, color: 'rgba(110,24,24,0.35)' }, { offset: 1, color: 'rgba(90,17,22,0)' }],
        }, PAGE);
    }

    function drawRangoliAndHalo() {
        const polar = (cx, cy, r, deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
        };
        const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
        const rc = [300, 290];

        circle(300, 290, 318, { strokeColor: '#ffb703', strokeWidth: 3, opacity: 80, name: 'Rangoli ring (outer)' });
        circle(300, 290, 252, { strokeColor: '#ffd166', strokeWidth: 2, opacity: 80, name: 'Rangoli ring (inner)' });
        let pink = '';
        for (let i = 0; i < 24; i++) {
            const a = i * 15;
            pink += `M${P(polar(...rc, 258, a))} Q${P(polar(...rc, 285, a - 7))} ${P(polar(...rc, 310, a))} Q${P(polar(...rc, 285, a + 7))} ${P(polar(...rc, 258, a))} `;
        }
        path(pink, { strokeColor: '#ff4d8d', strokeWidth: 3, strokeLineCap: 'round', opacity: 80, name: 'Rangoli petals (pink)' });
        let teal = '';
        for (let i = 0; i < 12; i++) {
            const a = i * 30 + 15;
            teal += `M${P(polar(...rc, 196, a))} Q${P(polar(...rc, 238, a - 16))} ${P(polar(...rc, 246, a))} Q${P(polar(...rc, 238, a + 16))} ${P(polar(...rc, 196, a))} `;
        }
        path(teal, { strokeColor: '#2ec4b6', strokeWidth: 3, strokeLineCap: 'round', opacity: 80, name: 'Rangoli loops (teal)' });

        const dots = [];
        for (let i = 0; i < 24; i++) {
            const [x, y] = polar(...rc, 300, i * 15 + 7.5);
            dots.push(circle(x, y, 4, { backgroundColor: '#fff3b0', name: `Rangoli dot ${i + 1}` }));
        }

        // Halo: glow, ring, rays.
        const [hx, hy] = artPoint(ART, 300, 280);
        const haloNull = nullAt(hx, hy, 'Halo glow (null)');
        let mark = created.length;
        circle(300, 280, 210, {
            fillStyle: 'radial', name: 'Halo glow',
            gradientStops: [
                { offset: 0, color: 'rgba(255,246,200,0.95)' },
                { offset: 0.45, color: 'rgba(255,209,102,0.7)' },
                { offset: 0.8, color: 'rgba(247,127,0,0.28)' },
                { offset: 1, color: 'rgba(247,127,0,0)' },
            ],
        });
        adopt(mark, haloNull);
        const haloRing = circle(300, 280, 206, { strokeColor: '#ffd166', strokeWidth: 3, opacity: 80, name: 'Halo ring' });
        let rays = '';
        for (let i = 0; i < 36; i++) {
            if (i % 2) continue;
            rays += `M${P(polar(300, 280, 212, i * 10))} L${P(polar(300, 280, 240, i * 10))} `;
        }
        const raysLong = path(rays, { strokeColor: '#ffd166', strokeWidth: 3, strokeLineCap: 'round', opacity: 75, name: 'Halo rays (long)' });
        rays = '';
        for (let i = 1; i < 36; i += 2) rays += `M${P(polar(300, 280, 212, i * 10))} L${P(polar(300, 280, 228, i * 10))} `;
        const raysShort = path(rays, { strokeColor: '#ffd166', strokeWidth: 2, strokeLineCap: 'round', opacity: 75, name: 'Halo rays (short)' });

        return { dots, haloNull, haloRing, raysLong, raysShort };
    }

    function drawLotus() {
        for (let i = -4; i <= 4; i++) {
            const x = 300 + i * 40;
            path(`M${x},606 C${x - 26},590 ${x - 16},560 ${x},540 C${x + 16},560 ${x + 26},590 ${x},606Z`, { backgroundColor: '#e05780', strokeColor: '#ffb3c6', strokeWidth: 1.5, name: 'Lotus petal (back)' });
        }
        for (let i = -3.5; i <= 3.5; i++) {
            const x = 300 + i * 44;
            path(`M${x},618 C${x - 28},604 ${x - 18},576 ${x},560 C${x + 18},576 ${x + 28},604 ${x},618Z`, { backgroundColor: '#ff8fab', strokeColor: '#ffe0e9', strokeWidth: 1.5, name: 'Lotus petal (front)' }, chain(ART, R(i * 7, x, 618)));
        }
    }

    function drawEar(m, side) {
        path('M232,196 C188,160 118,172 106,236 C94,300 146,348 214,322 C230,300 234,250 232,196Z', { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 3, name: `Ear (${side})` }, m);
        path('M222,214 C190,194 142,204 130,244 C122,286 158,316 206,302 C218,284 222,250 222,214Z', { backgroundColor: '#f28b8b', name: `Inner ear (${side})` }, m);
    }

    /** A thick limb: outline stroke under a skin stroke, round caps. */
    function limb(d, width, name, joinD) {
        path(d, { strokeColor: OUTLINE, strokeWidth: width + 5, strokeLineCap: 'round', strokeLineJoin: 'round', name: `${name} outline` });
        path(joinD || d, { strokeColor: SKIN, strokeWidth: width, strokeLineCap: 'round', strokeLineJoin: 'round', name });
    }

    function drawGanesh() {
        const rig = {};
        drawLotus();

        // Ears, behind the head; each flaps from where it meets the head.
        const [elx, ely] = artPoint(ART, 226, 228);
        rig.earL = nullAt(elx, ely, 'Ear left (null)');
        let mark = created.length;
        drawEar(ART, 'left');
        adopt(mark, rig.earL);
        const MIRROR = chain(ART, [-1, 0, 0, 1, 600, 0]);
        const [erx, ery] = artPoint(ART, 374, 228);
        rig.earR = nullAt(erx, ery, 'Ear right (null)');
        mark = created.length;
        drawEar(MIRROR, 'right');
        adopt(mark, rig.earR);

        // Upper arms: an axe (parashu) and a lotus.
        limb('M240,326 L168,286', 26, 'Upper arm (axe)');
        path('M158,322 L176,200', { strokeColor: '#8d5524', strokeWidth: 5, strokeLineCap: 'round', name: 'Axe handle' });
        path('M178,196 C150,182 132,214 144,238 L172,226 Z', { fillStyle: 'linear', gradientStops: GOLD, gradientDirection: GOLD_DIRECTION, strokeColor: '#b7791f', strokeWidth: 1.5, name: 'Axe blade' });
        circle(166, 282, 15, { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 2.5, name: 'Hand (axe)' });
        path('M154,290 L176,294', { strokeColor: '#ffc53d', strokeWidth: 5, strokeLineCap: 'round', name: 'Bangle' });
        limb('M360,326 L432,286', 26, 'Upper arm (lotus)');
        path('M436,286 C440,262 440,248 442,236', { strokeColor: '#2d8a4e', strokeWidth: 4, strokeLineCap: 'round', name: 'Lotus stem' });
        const L = chain(ART, T(442, 226));
        path('M0,6 C-16,-2 -18,-16 -12,-22 C-6,-10 -2,-4 0,6Z', { backgroundColor: '#ff8fab', name: 'Lotus bloom petal' }, L);
        path('M0,6 C16,-2 18,-16 12,-22 C6,-10 2,-4 0,6Z', { backgroundColor: '#ff8fab', name: 'Lotus bloom petal' }, L);
        path('M0,6 C-8,-6 -6,-20 0,-30 C6,-20 8,-6 0,6Z', { backgroundColor: '#e05780', name: 'Lotus bloom petal' }, L);
        circle(434, 284, 15, { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 2.5, name: 'Hand (lotus)' });
        path('M424,292 L446,288', { strokeColor: '#ffc53d', strokeWidth: 5, strokeLineCap: 'round', name: 'Bangle' });

        // Body: torso, dhoti, belly, sash, sacred thread, necklace, folded leg.
        path('M234,310 C212,340 200,392 206,444 L394,444 C400,392 388,340 366,310 Z', { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 3, name: 'Torso' });
        path('M246,356 Q270,372 292,366 M308,366 Q330,372 354,356', { strokeColor: SKIN_SHADE, strokeWidth: 3, strokeLineCap: 'round', name: 'Chest shading' });
        path('M146,566 C134,504 198,480 300,490 C402,480 466,504 454,566 C414,596 186,596 146,566Z', { backgroundColor: '#d62828', strokeColor: '#ffd166', strokeWidth: 5, name: 'Dhoti' });
        path('M170,560 C220,576 380,576 430,560', { strokeColor: '#ffd166', strokeWidth: 2, strokeLineCap: 'round', strokeDashArray: [2, 7], name: 'Dhoti border' });
        ellipse(300, 432, 98, 80, {
            fillStyle: 'radial', gradientStops: [{ offset: 0, color: '#ffc58a' }, { offset: 1, color: SKIN }],
            strokeColor: OUTLINE, strokeWidth: 3, name: 'Belly',
        });
        path('M294,446 Q300,454 306,446', { strokeColor: SKIN_SHADE, strokeWidth: 3, strokeLineCap: 'round', name: 'Navel' });
        path('M202,482 C250,506 350,506 398,482 L402,500 C352,526 248,526 198,500Z', { fillStyle: 'linear', gradientStops: GOLD, gradientDirection: GOLD_DIRECTION, name: 'Waist sash' });
        path('M254,318 C292,378 334,444 376,486', { strokeColor: '#fff3b0', strokeWidth: 3, name: 'Sacred thread' });
        path('M240,320 Q300,396 360,320', { strokeColor: '#ffc53d', strokeWidth: 7, strokeLineCap: 'round', name: 'Necklace' });
        circle(300, 358, 9, { backgroundColor: '#d62828', strokeColor: '#ffd166', strokeWidth: 3, name: 'Necklace pendant' });
        path('M318,550 C330,532 382,528 400,540 C410,548 404,562 392,563 C368,566 330,566 318,550Z', { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 2.5, name: 'Foot' });
        circle(404, 540, 5, { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 2, name: 'Toe' });
        circle(408, 551, 5, { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 2, name: 'Toe' });
        path('M332,556 L336,540', { strokeColor: '#ffd166', strokeWidth: 4, strokeLineCap: 'round', name: 'Anklet' });

        // Lower right hand: blessing (abhaya mudra), glowing.
        const [bgx, bgy] = artPoint(ART, 188, 330);
        rig.blessGlow = nullAt(bgx, bgy, 'Blessing glow (null)');
        mark = created.length;
        circle(188, 330, 46, { fillStyle: 'radial', gradientStops: [{ offset: 0, color: 'rgba(255,224,138,0.85)' }, { offset: 1, color: 'rgba(255,159,28,0)' }], name: 'Blessing glow' });
        adopt(mark, rig.blessGlow);
        rig.blessGlowEl = created[created.length - 1];
        path('M234,334 L198,420 L188,366', { strokeColor: OUTLINE, strokeWidth: 37, strokeLineCap: 'round', strokeLineJoin: 'round', name: 'Blessing arm outline' });
        path('M234,334 L198,420', { strokeColor: SKIN, strokeWidth: 32, strokeLineCap: 'round', name: 'Blessing arm' });
        path('M198,420 L188,366', { strokeColor: SKIN, strokeWidth: 26, strokeLineCap: 'round', name: 'Blessing forearm' });
        path('M174,372 L202,368', { strokeColor: '#ffc53d', strokeWidth: 6, strokeLineCap: 'round', name: 'Bangle' });
        const H = chain(ART, T(189, 350), S(1.3), T(-189, -350));
        const hand = { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 1.6 };
        roundRect(171, 318, 36, 46, 14, { ...hand, name: 'Palm' }, H);
        roundRect(172, 296, 8, 30, 4, { ...hand, name: 'Finger' }, H);
        roundRect(181, 291, 8, 34, 4, { ...hand, name: 'Finger' }, H);
        roundRect(190, 293, 8, 32, 4, { ...hand, name: 'Finger' }, H);
        roundRect(199, 300, 7.5, 26, 3.75, { ...hand, name: 'Finger' }, H);
        roundRect(160, 330, 9, 24, 4.5, { ...hand, name: 'Thumb' }, chain(H, R(-32, 164, 342)));
        circle(189, 342, 5, { backgroundColor: '#d62828', name: 'Palm mark' }, H);

        // Lower left hand: a bowl of modaks.
        path('M366,334 L404,420 L420,454', { strokeColor: OUTLINE, strokeWidth: 37, strokeLineCap: 'round', strokeLineJoin: 'round', name: 'Bowl arm outline' });
        path('M366,334 L404,420', { strokeColor: SKIN, strokeWidth: 32, strokeLineCap: 'round', name: 'Bowl arm' });
        path('M404,420 L420,454', { strokeColor: SKIN, strokeWidth: 26, strokeLineCap: 'round', name: 'Bowl forearm' });
        modak(404, 446, 17, ART); modak(438, 446, 17, ART); modak(421, 428, 17, ART);
        path('M378,452 L464,452 C460,486 382,486 378,452Z', { fillStyle: 'linear', gradientStops: GOLD, gradientDirection: GOLD_DIRECTION, strokeColor: '#b7791f', strokeWidth: 1.5, name: 'Modak bowl' });
        ellipse(421, 484, 22, 9, { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 2.5, name: 'Hand under bowl' });

        // Head.
        path('M300,136 C362,136 394,180 392,232 C390,278 362,306 334,314 C320,318 280,318 266,314 C238,306 210,278 208,232 C206,180 238,136 300,136Z', { backgroundColor: SKIN, strokeColor: OUTLINE, strokeWidth: 3, name: 'Head' });
        ellipse(250, 274, 24, 14, { backgroundColor: '#ff8a80', opacity: 35, name: 'Cheek' });
        ellipse(350, 274, 24, 14, { backgroundColor: '#ff8a80', opacity: 35, name: 'Cheek' });
        path('M274,290 C274,318 264,340 246,352 C250,330 254,310 258,288 Z', { backgroundColor: '#fffaf0', strokeColor: '#c9a96e', strokeWidth: 2, name: 'Tusk (whole)' });
        path('M326,290 L342,290 L338,306 Z', { backgroundColor: '#fffaf0', strokeColor: '#c9a96e', strokeWidth: 2, name: 'Tusk (broken)' });

        // Eyes blink from their centres.
        rig.eyes = [];
        for (const [ex, name] of [[262, 'left'], [338, 'right']]) {
            const [nx, ny] = artPoint(ART, ex, 237);
            const eyeNull = nullAt(nx, ny, `Eye ${name} (null)`);
            mark = created.length;
            path(`M${ex - 18},238 Q${ex},222 ${ex + 18},238 Q${ex},250 ${ex - 18},238Z`, { backgroundColor: '#ffffff', name: `Eye ${name}` });
            circle(ex + 2, 237, 6, { backgroundColor: '#2b1a12', name: `Pupil ${name}` });
            circle(ex + 4, 235, 2, { backgroundColor: '#ffffff', name: `Eye glint ${name}` });
            adopt(mark, eyeNull);
            rig.eyes.push(eyeNull);
        }
        path('M240,222 Q262,208 282,220 M318,220 Q338,208 360,222', { strokeColor: '#7c2d12', strokeWidth: 3, strokeLineCap: 'round', name: 'Brows' });
        path('M290,180 Q300,214 310,180', { strokeColor: '#d62828', strokeWidth: 5, strokeLineCap: 'round', name: 'Tilak' });
        circle(300, 206, 5, { backgroundColor: '#ffd166', name: 'Tilak dot' });

        // Trunk: sways from its root between the eyes.
        const [tx, ty] = artPoint(ART, 300, 262);
        rig.trunk = nullAt(tx, ty, 'Trunk (null)');
        mark = created.length;
        path('M300,262 C300,292 298,322 306,352 C318,390 354,394 364,368 C370,352 354,344 346,356', { strokeColor: OUTLINE, strokeWidth: 27, strokeLineCap: 'round', name: 'Trunk curl outline' });
        path('M300,262 C300,292 298,322 306,352', { strokeColor: OUTLINE, strokeWidth: 43, strokeLineCap: 'round', name: 'Trunk outline' });
        path('M300,250 C300,292 298,322 306,352', { strokeColor: SKIN, strokeWidth: 38, strokeLineCap: 'round', name: 'Trunk' });
        path('M306,352 C318,390 354,394 364,368 C370,352 354,344 346,356', { strokeColor: SKIN, strokeWidth: 22, strokeLineCap: 'round', name: 'Trunk curl' });
        path('M288,286 Q300,292 312,286 M288,304 Q300,310 312,304 M290,322 Q302,328 314,322 M296,342 Q308,346 318,338', { strokeColor: SKIN_SHADE, strokeWidth: 2.5, strokeLineCap: 'round', name: 'Trunk creases' });
        adopt(mark, rig.trunk);

        // Mukut (crown).
        path('M234,154 C236,124 250,108 262,96 L280,110 L292,64 L300,36 L308,64 L320,110 L338,96 C350,108 364,124 366,154 C340,142 260,142 234,154 Z', { fillStyle: 'linear', gradientStops: GOLD, gradientDirection: GOLD_DIRECTION, strokeColor: '#b7791f', strokeWidth: 2, name: 'Mukut' });
        path('M224,176 C250,160 350,160 376,176 L372,150 C346,138 254,138 228,150 Z', { backgroundColor: '#ffc53d', strokeColor: '#b7791f', strokeWidth: 2, name: 'Mukut band' });
        for (let i = 0; i <= 10; i++) circle(244 + i * 11.2, 158 - Math.sin((i / 10) * Math.PI) * 4, 1.8, { backgroundColor: '#d62828', name: 'Mukut bead' });
        circle(300, 120, 10, { backgroundColor: '#d62828', strokeColor: '#fff1a8', strokeWidth: 3, name: 'Mukut jewel (ruby)' });
        circle(264, 132, 6, { backgroundColor: '#2a9d8f', strokeColor: '#fff1a8', strokeWidth: 2, name: 'Mukut jewel (emerald)' });
        circle(336, 132, 6, { backgroundColor: '#2a9d8f', strokeColor: '#fff1a8', strokeWidth: 2, name: 'Mukut jewel (emerald)' });
        circle(300, 70, 5, { backgroundColor: '#d62828', name: 'Mukut jewel' });
        circle(300, 30, 7, { fillStyle: 'linear', gradientStops: GOLD, gradientDirection: GOLD_DIRECTION, strokeColor: '#b7791f', strokeWidth: 1.5, name: 'Mukut finial' });

        // Sparkles on the crown: each twinkles from its centre.
        rig.sparkles = [];
        for (const [x, y, s] of [[262, 72, 1], [344, 98, 0.8], [300, 4, 1.1], [376, 142, 0.7], [226, 132, 0.6]]) {
            const [nx, ny] = artPoint(ART, x, y);
            const sn = nullAt(nx, ny, 'Sparkle (null)');
            mark = created.length;
            path('M0,-14 Q2,-2 14,0 Q2,2 0,14 Q-2,2 -14,0 Q-2,-2 0,-14Z', { backgroundColor: '#fffbe0', glowEnabled: true, glowColor: '#ffe08a', glowBlur: 8, name: 'Sparkle' }, chain(ART, T(x, y), S(s)));
            adopt(mark, sn);
            rig.sparkles.push(sn);
        }
        return rig;
    }

    function diya(x, y, s) {
        const m = chain(ART, T(x, y), S(s));
        const [gx, gy] = apply(m, 0, -26);
        const glowNull = nullAt(gx, gy, 'Diya glow (null)');
        let mark = created.length;
        circle(0, -26, 44, { fillStyle: 'radial', gradientStops: [{ offset: 0, color: 'rgba(255,224,138,0.9)' }, { offset: 1, color: 'rgba(255,159,28,0)' }], name: 'Diya glow' }, m);
        adopt(mark, glowNull);
        const glowEl = created[created.length - 1];
        path('M-36,-6 C-32,18 32,18 36,-6 Z', { backgroundColor: '#b5451b', name: 'Diya' }, m);
        path('M-36,-6 C-20,2 20,2 36,-6 C20,-12 -20,-12 -36,-6Z', { backgroundColor: '#7c2d12', name: 'Diya oil' }, m);
        path('M-26,4 L26,4', { strokeColor: '#ffd166', strokeWidth: 2, strokeLineCap: 'round', strokeDashArray: [1, 5], name: 'Diya dots' }, m);
        path('M-30,-2 C-14,5 14,5 30,-2', { strokeColor: '#fb8500', strokeWidth: 2, name: 'Diya rim' }, m);
        const [fx, fy] = apply(m, 0, -8);
        const flameNull = nullAt(fx, fy, 'Flame (null)');
        mark = created.length;
        path('M0,-8 C-9,-14 -8,-30 0,-44 C8,-30 9,-14 0,-8Z', {
            fillStyle: 'linear', gradientDirection: 270, name: 'Flame',
            gradientStops: [{ offset: 0, color: '#ff6a00' }, { offset: 0.6, color: '#ffb703' }, { offset: 1, color: '#ffe066' }],
            glowEnabled: true, glowColor: '#ffb703', glowBlur: 20,
        }, m);
        path('M0,-10 C-4,-14 -4,-22 0,-30 C4,-22 4,-14 0,-10Z', { backgroundColor: '#fff8d6', name: 'Flame core' }, m);
        adopt(mark, flameNull);
        return { flameNull, glowNull, glowEl };
    }

    function drawOfferings() {
        // Modak plate.
        ellipse(300, 668, 86, 16, { fillStyle: 'linear', gradientStops: GOLD, gradientDirection: GOLD_DIRECTION, strokeColor: '#b7791f', strokeWidth: 2, name: 'Modak plate' });
        for (const [x, y] of [[270, 652], [300, 654], [330, 652], [285, 626], [315, 626], [300, 600]]) modak(x, y, 20, ART);
        return [diya(-14, 646, 1.25), diya(96, 676, 1.05), diya(652, 470, 0.95)];
    }

    function drawMooshak() {
        const M = chain(ART, T(528, 684), S(1.2));
        const rig = {};
        const [fx, fy] = apply(M, 10, 0);
        rig.body = nullAt(fx, fy, 'Mooshak (null)');
        const start = created.length;

        const [tx, ty] = apply(M, 40, -12);
        rig.tail = nullAt(tx, ty, 'Mooshak tail (null)', rig.body);
        let mark = created.length;
        path('M40,-12 C84,-6 96,-44 74,-60 C62,-68 50,-56 58,-48', { strokeColor: '#a58a80', strokeWidth: 5, strokeLineCap: 'round', name: 'Mooshak tail' }, M);
        adopt(mark, rig.tail);

        const bodyMark = created.length;
        ellipse(10, -40, 50, 40, { backgroundColor: '#9c8177', name: 'Mooshak body' }, M);
        ellipse(-6, -30, 28, 26, { backgroundColor: '#e7d9d2', name: 'Mooshak tummy' }, M);
        ellipse(-22, -3, 13, 6, { backgroundColor: '#f4a5b0', name: 'Mooshak foot' }, M);
        ellipse(28, -3, 13, 6, { backgroundColor: '#f4a5b0', name: 'Mooshak foot' }, M);
        adopt(bodyMark, rig.body);

        const HM = chain(M, T(16, 18));
        const [hx, hy] = apply(HM, -40, -76);
        rig.head = nullAt(hx, hy, 'Mooshak head (null)', rig.body);
        mark = created.length;
        circle(-50, -110, 14, { backgroundColor: '#9c8177', name: 'Mooshak ear (back)' }, HM);
        circle(-50, -110, 8, { backgroundColor: '#f4a5b0' }, HM);
        path('M-12,-104 C-22,-60 -58,-58 -90,-72 C-70,-88 -56,-112 -30,-112 C-20,-112 -14,-108 -12,-104Z', { backgroundColor: '#9c8177', name: 'Mooshak head' }, HM);
        circle(-22, -114, 17, { backgroundColor: '#a88d83', name: 'Mooshak ear' }, HM);
        circle(-22, -114, 10, { backgroundColor: '#f4a5b0' }, HM);
        circle(-90, -72, 6, { backgroundColor: '#e85d75', name: 'Mooshak nose' }, HM);
        circle(-48, -90, 5.5, { backgroundColor: '#1f130e', name: 'Mooshak eye' }, HM);
        circle(-46, -92, 1.8, { backgroundColor: '#ffffff' }, HM);
        ellipse(-58, -76, 7, 4, { backgroundColor: '#f4a5b0', opacity: 70, name: 'Mooshak cheek' }, HM);
        path('M-84,-74 L-116,-86 M-84,-72 L-120,-72 M-84,-70 L-114,-58', { strokeColor: '#5b4640', strokeWidth: 1.5, strokeLineCap: 'round', name: 'Whiskers' }, HM);
        adopt(mark, rig.head);

        // His modak, held up to nibble.
        const [mx, my] = apply(M, -66, -36);
        rig.modak = nullAt(mx, my, 'Mooshak modak (null)', rig.body);
        mark = created.length;
        modak(-66, -36, 15, M);
        ellipse(-80, -32, 6, 5, { backgroundColor: '#f4a5b0', name: 'Mooshak paw' }, M);
        ellipse(-52, -32, 6, 5, { backgroundColor: '#f4a5b0', name: 'Mooshak paw' }, M);
        adopt(mark, rig.modak);

        rig.ids = created.slice(start);
        return rig;
    }

    function drawToran() {
        const rope = 16;
        path(`M0,${rope} L${PAGE_W},${rope}`, { strokeColor: '#7c2d12', strokeWidth: 4, name: 'Toran rope' }, PAGE);
        for (let x = 10; x < PAGE_W; x += 30) {
            path('M0,0 C8,10 8,28 0,38 C-8,28 -8,10 0,0Z', { backgroundColor: x % 90 ? '#2d8a4e' : '#40a869', name: 'Mango leaf' }, chain(T(x, 4), R(x % 60 ? 12 : -12)));
        }
        const swags = 6;
        const w = PAGE_W / swags;
        const strands = [];
        for (let i = 0; i <= swags; i++) {
            const x = i * w;
            const n = nullAt(x, 18, `Toran strand ${i + 1} (null)`);
            const mark = created.length;
            path(`M${x},18 L${x},116`, { strokeColor: '#7c2d12', strokeWidth: 2, name: 'Strand thread' }, PAGE);
            for (let k = 0; k < 4; k++) marigold(x, 36 + k * 23, 11, k % 2);
            path(`M${x},118 C${x + 10},129 ${x + 9},148 ${x},159 C${x - 9},148 ${x - 10},129 ${x},118Z`, { backgroundColor: '#2d8a4e', name: 'Strand leaf' }, PAGE);
            adopt(mark, n);
            strands.push(n);
        }
        const garlands = [];
        for (let i = 0; i < swags; i++) {
            const x0 = i * w;
            const n = nullAt(x0 + w / 2, 18, `Toran swag ${i + 1} (null)`);
            const mark = created.length;
            for (let s = 0; s <= 9; s++) {
                const t = s / 9;
                marigold(x0 + w * t, 18 + 2 * (1 - t) * t * 130, 14, (s + i) % 2);
            }
            adopt(mark, n);
            garlands.push(n);
        }
        return { strands, garlands };
    }

    async function drawGreeting() {
        await Y.fontsReady?.();
        const measure = document.createElement('canvas').getContext('2d');
        const glyphRuns = (value, x, y, fontSize, family, weight, style) => {
            measure.font = `${weight} ${fontSize}px ${family}`;
            const ids = [];
            for (let i = 0; i < value.length; i++) {
                if (value[i] === ' ') continue;
                const gx = x + measure.measureText(value.slice(0, i)).width;
                ids.push(text(gx, y, value[i], { fontSize, fontWeight: weight, ...style }));
            }
            return ids;
        };

        const words = [];
        measure.font = '700 46px Inter, sans-serif';
        let wx = 92;
        for (const word of ['गणपति', 'बप्पा', 'मोरया']) {
            words.push(text(wx, 196, word, { fontSize: 46, fontFamily: 'sans-serif', fontWeight: 700, strokeColor: '#ffd166', name: `Greeting (Devanagari): ${word}` }));
            wx += measure.measureText(word + ' ').width;
        }

        const title = { fontFamily: 'poppins', strokeColor: '#fff7e6', glowEnabled: true, glowColor: 'rgba(255,170,60,0.55)', glowBlur: 26 };
        const lines = [
            glyphRuns('Ganpati', 84, 262, 124, 'Poppins, sans-serif', 700, { ...title, name: 'Title glyph' }),
            glyphRuns('Bappa', 84, 394, 124, 'Poppins, sans-serif', 700, { ...title, name: 'Title glyph' }),
            glyphRuns('Morya!', 84, 526, 124, 'Poppins, sans-serif', 700, { ...title, strokeColor: '#ff9f1c', name: 'Title glyph' }),
        ];
        const sub = text(92, 700, 'HAPPY GANESH CHATURTHI', { width: 760, height: 51, fontSize: 34, fontFamily: 'poppins', fontWeight: 600, letterSpacing: 3, strokeColor: '#ffe3b3', name: 'Subtitle' });
        return { words, chars: lines.flat(), sub };
    }

    function drawPetals() {
        const colours = ['#ff9f1c', '#ffb703', '#f76707', '#ffd166', '#e63946', '#fff4dc'];
        const petals = [];
        for (let i = 0; i < 44; i++) {
            const size = random(6, 11);
            const x = random(20, PAGE_W - 20);
            const id = Y.createCircle(x - size, -40, size * 2, size * 1.1, {
                ...CLEAN, backgroundColor: colours[Math.floor(random(0, colours.length))], strokeColor: 'transparent', strokeWidth: 0, fillStyle: 'solid',
                name: `Petal ${i + 1}`,
            });
            created.push(id);
            petals.push({ id, x: x - size, cycles: random() < 0.3 ? 2 : 1, phase: random(0, 1), sway: random(14, 26), spin: random(-2.5, 2.5) });
        }
        return petals;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Animation (composition keyframes)
    // ────────────────────────────────────────────────────────────────────────

    function animate(parts) {
        const el = id => Y.getElement(id);
        const DEG = Math.PI / 180;

        // Toran: strands swing from their knots, swags breathe, staggered along the rope.
        parts.toran.strands.forEach((id, i) => oscillate(id, 'angle', 0, 3 * DEG, 4, i * 0.35));
        parts.toran.garlands.forEach((id, i) => {
            oscillate(id, 'angle', 0, 1.2 * DEG, 4, i * 0.35 + 0.2);
            const e = el(id);
            oscillate(id, 'y', e.y, 3, 4, i * 0.35 + 1.2);
        });

        // Halo: rays turn one ray-pair (20°) per loop — seamless, since the pattern repeats;
        // the glow breathes and the ring pulses.
        for (const id of [parts.halo.raysLong, parts.halo.raysShort]) {
            key(id, 'angle', 0, 0);
            key(id, 'angle', LOOP, 20 * DEG, 'linear');
        }
        const halo = el(parts.halo.haloNull);
        const haloGlow = (s) => ({ w: halo.width * s, h: halo.height * s });
        // Scale the null about its centre (width/height), which scales the glow around the halo.
        oscillate(parts.halo.haloNull, 'width', halo.width, haloGlow(0.045).w, 3.2);
        oscillate(parts.halo.haloNull, 'height', halo.height, haloGlow(0.045).h, 3.2);
        oscillate(parts.halo.haloRing, 'opacity', 70, 25, 3.2, 1.6);
        parts.halo.dots.forEach((id, i) => oscillate(id, 'opacity', 70, 30, 2, i * 0.25));

        // Ganesh ji: trunk sways from its root, ears flap now and then, eyes blink, sparkles twinkle.
        const g = parts.ganesh;
        oscillate(g.trunk, 'angle', 0, 4 * DEG, 4);
        for (const t0 of [1.2, 5.2, 9.2, 13.2]) {
            wiggle(g.earL, 'angle', 0, -9 * DEG, t0, 1.4);
            wiggle(g.earR, 'angle', 0, 9 * DEG, t0, 1.4);
        }
        for (const eye of g.eyes) {
            const e = el(eye);
            key(eye, 'height', 0, e.height);
            for (const t0 of [3.6, 11.1]) {
                key(eye, 'height', t0, e.height);
                key(eye, 'height', t0 + 0.08, e.height * 0.1, 'easeInQuad');
                key(eye, 'height', t0 + 0.22, e.height, 'easeOutQuad');
            }
            key(eye, 'height', LOOP, e.height);
        }
        g.sparkles.forEach((id, i) => {
            const e = el(id);
            oscillate(id, 'width', e.width * 0.85, e.width * 0.35, 2, i * 0.4);
            oscillate(id, 'height', e.height * 0.85, e.height * 0.35, 2, i * 0.4);
            oscillate(id, 'angle', 0, 15 * DEG, 4, i * 0.4);
        });
        const bless = el(g.blessGlow);
        oscillate(g.blessGlow, 'width', bless.width, bless.width * 0.2, 3.2);
        oscillate(g.blessGlow, 'height', bless.height, bless.height * 0.2, 3.2);
        oscillate(g.blessGlowEl, 'opacity', 65, 35, 3.2);

        // Diyas: flames flicker (squash/stretch + lean from the wick), glows breathe with them.
        for (const d of parts.diyas) {
            const f = el(d.flameNull);
            const steps = Math.round(LOOP / 0.12);
            let first = null;
            for (let s = 0; s <= steps; s++) {
                const t = (s * LOOP) / steps;
                const v = s === steps ? first : { h: random(0.82, 1.18), w: random(0.9, 1.06), a: random(-7, 7), o: random(65, 100) };
                if (s === 0) first = v;
                const ease = s ? 'easeInOutQuad' : undefined;
                key(d.flameNull, 'height', t, f.height * v.h, ease);
                key(d.flameNull, 'width', t, f.width * v.w, ease);
                key(d.flameNull, 'angle', t, v.a * DEG, ease);
                if (s % 2 === 0 || s === steps) key(d.glowEl, 'opacity', t, v.o, ease);
            }
        }

        // Mooshak: drops in, then hops twice per loop; nibbles his modak; wags his tail.
        const m = parts.mooshak;
        const body = el(m.body);
        const by = body.y, bw = body.width, bh = body.height;
        key(m.body, 'y', 0, by - 900);
        key(m.body, 'y', 1.9, by - 900, undefined, { hold: true });
        key(m.body, 'y', 3.1, by, 'easeOutBounce');
        for (const t0 of [6.5, 11.5]) {
            key(m.body, 'y', t0, by);
            key(m.body, 'height', t0, bh); key(m.body, 'width', t0, bw); key(m.body, 'angle', t0, 0);
            // squash
            key(m.body, 'height', t0 + 0.09, bh * 0.8, 'easeOutQuad');
            key(m.body, 'width', t0 + 0.09, bw * 1.14, 'easeOutQuad');
            key(m.body, 'y', t0 + 0.09, by);
            // leap, leaning back
            key(m.body, 'y', t0 + 0.41, by - 115, 'easeOutQuad');
            key(m.body, 'height', t0 + 0.41, bh * 1.08, 'easeOutQuad');
            key(m.body, 'width', t0 + 0.41, bw * 0.94, 'easeOutQuad');
            key(m.body, 'angle', t0 + 0.41, -10 * DEG, 'easeOutQuad');
            // land on a bounce and settle
            key(m.body, 'y', t0 + 1.1, by, 'easeOutBounce');
            key(m.body, 'height', t0 + 1.1, bh * 0.9, 'easeInQuad');
            key(m.body, 'width', t0 + 1.1, bw * 1.06, 'easeInQuad');
            key(m.body, 'angle', t0 + 1.1, 3 * DEG, 'easeInOutQuad');
            key(m.body, 'height', t0 + 1.4, bh, 'easeOutBack');
            key(m.body, 'width', t0 + 1.4, bw, 'easeOutBack');
            key(m.body, 'angle', t0 + 1.4, 0, 'easeOutBack');
        }
        key(m.body, 'y', LOOP, by);
        for (let t0 = 0.4; t0 < LOOP - 1; t0 += 2) {
            wiggle(m.head, 'angle', 0, 5 * DEG, t0, 0.9, 6);
            const mod = el(m.modak);
            wiggle(m.modak, 'y', mod.y, -4, t0, 0.9, 6);
        }
        oscillate(m.tail, 'angle', 0, 14 * DEG, 2);

        // Petals: fall through the whole page, sway side to side and spin; each wraps
        // back to the top with a hold key so the loop is seamless.
        const TOP = -40, BOTTOM = PAGE_H + 30;
        for (const p of parts.petals) {
            const period = LOOP / p.cycles;
            const yAt = t => TOP + (BOTTOM - TOP) * ((((t / period) + p.phase) % 1 + 1) % 1);
            key(p.id, 'y', 0, yAt(0));
            for (let c = 0; c <= p.cycles; c++) {
                const wrap = (c + 1 - p.phase) * period;         // time the petal reaches the bottom
                if (wrap <= 0 || wrap >= LOOP) continue;
                key(p.id, 'y', wrap, BOTTOM, 'linear');
                key(p.id, 'y', wrap + 0.001, TOP, undefined, { hold: true });
            }
            key(p.id, 'y', LOOP, yAt(LOOP), 'linear');
            oscillate(p.id, 'x', p.x, p.sway, LOOP / 4, p.phase * 4);
            key(p.id, 'angle', 0, 0);
            key(p.id, 'angle', LOOP, Math.round(p.spin) * 2 * Math.PI, 'linear');
        }

        // Greeting: Devanagari words rise in, then the title letters pop up one by one,
        // then the subtitle. (Replays at the top of each loop.)
        const rise = (id, t0, dy, dur, extra) => {
            const e = el(id);
            key(id, 'opacity', 0, 0);
            key(id, 'opacity', t0, 0, undefined, { hold: true });
            key(id, 'opacity', t0 + dur * 0.45, 100, 'easeOutQuad');
            key(id, 'y', 0, e.y + dy);
            key(id, 'y', t0, e.y + dy, undefined, { hold: true });
            key(id, 'y', t0 + dur, e.y, extra?.easing ?? 'easeOutCubic');
            if (extra?.angle) {
                key(id, 'angle', 0, extra.angle);
                key(id, 'angle', t0, extra.angle, undefined, { hold: true });
                key(id, 'angle', t0 + dur, 0, 'easeOutBack');
            }
        };
        parts.greeting.words.forEach((id, i) => rise(id, 0.4 + i * 0.15, 24, 0.8));
        parts.greeting.chars.forEach((id, i) => rise(id, 0.9 + i * 0.05, 80, 0.75, { easing: 'easeOutBack', angle: 18 * DEG }));
        rise(parts.greeting.sub, 2.2, 20, 1.1);

        const tracks = [...trackMap.values()].map(tr => ({ ...tr, keys: tr.keys.sort((a, b) => a.t - b.t) }));
        Y.setCompositionTracks(tracks);
        return tracks;
    }

    // ────────────────────────────────────────────────────────────────────────

    async function build() {
        created.length = 0;
        trackMap.clear();
        seed = 2026;

        Y.newDesign({ width: PAGE_W, height: PAGE_H });
        Y.clearComposition();
        Y.updateSlideBackground(0, {
            backgroundColor: '#3a0b10',
            fillStyle: 'radial',
            gradientStops: [{ offset: 0, color: '#7a2418' }, { offset: 0.5, color: '#4e0f14' }, { offset: 1, color: '#22060a' }],
        });

        const base = Y.state.layers[0]?.id;
        if (base) { Y.updateLayer(base, { name: 'Backdrop' }); Y.setActiveLayer(base); }
        drawBackdrop();

        newLayer('Rangoli & halo');
        const halo = drawRangoliAndHalo();
        newLayer('Ganesh ji');
        const ganesh = drawGanesh();
        newLayer('Offerings & Mooshak');
        const diyas = drawOfferings();
        const mooshak = drawMooshak();
        newLayer('Toran');
        const toran = drawToran();
        newLayer('Greeting');
        const greeting = await drawGreeting();
        newLayer('Petals');
        const petals = drawPetals();

        const tracks = animate({ halo, ganesh, diyas, mooshak, toran, greeting, petals });
        Y.clearSelection();
        Y.zoomToFitSlide?.();
        console.log(`[Ganpati] ${Y.getElements().length} elements, ${tracks.length} tracks, ${tracks.reduce((n, t) => n + t.keys.length, 0)} keyframes, ${LOOP}s loop`);
        return { elements: Y.getElements().length, tracks: tracks.length };
    }

    function play() {
        Y.toggleSceneTimeline(true);   // the Scene Timeline drives (and loops) the composition
        Y.seekScene(0);
        Y.playScene(true);
    }

    return { build, play, seek: t => Y.seekScene(t), LOOP };
})();

// Build + play immediately on paste.
Ganpati.build().then(() => Ganpati.play());
