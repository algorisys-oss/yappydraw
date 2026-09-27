/**
 * Immediate-mode drawing for the API — `Yappy.draw(ctx => …)`.
 *
 * Code written against Canvas 2D or Cairo (`moveTo`/`lineTo`/`arc`/`fill`) builds a path
 * point by point and paints it. Yappy is retained-mode: every mark is an editable element.
 * This module bridges the two. `PathBuilder` records the pen calls (with a transform
 * stack) into `PathSubpath[]` in absolute canvas coordinates; `DrawContext` adds paint
 * state and turns each `fill()`/`stroke()` into one `path` element via an injected
 * `emit`, so it stays free of the store and unit-testable.
 */
import type { PathAnchor, PathSubpath } from '../types';

type Matrix = [number, number, number, number, number, number]; // a b c d e f (canvas order)
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const TAU = Math.PI * 2;
const EPS = 1e-9;

const mul = (m: Matrix, n: Matrix): Matrix => [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m: Matrix, x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] });

function finite(...v: number[]) {
    for (const n of v) if (typeof n !== 'number' || !Number.isFinite(n)) throw new TypeError(`Yappy.draw: expected finite numbers, got ${v.join(', ')}`);
}

/** The pen: path construction plus the current transformation matrix. */
export class PathBuilder {
    private done: PathSubpath[] = [];
    private cur: PathAnchor[] | null = null;
    /** Device-space current point; null = no current point. */
    private pt: { x: number; y: number } | null = null;
    private m: Matrix = [...IDENTITY];
    private stack: Matrix[] = [];
    /** Bumped on every path mutation, so a fill() then stroke() can tell it is the same path. */
    version = 0;

    // --- transforms -------------------------------------------------------------
    save() { this.stack.push([...this.m] as Matrix); }
    restore() { const m = this.stack.pop(); if (m) this.m = m; }
    translate(x: number, y: number) { finite(x, y); this.m = mul(this.m, [1, 0, 0, 1, x, y]); }
    scale(sx: number, sy: number = sx) { finite(sx, sy); this.m = mul(this.m, [sx, 0, 0, sy, 0, 0]); }
    rotate(angle: number) {
        finite(angle);
        const c = Math.cos(angle), s = Math.sin(angle);
        this.m = mul(this.m, [c, s, -s, c, 0, 0]);
    }
    transform(a: number, b: number, c: number, d: number, e: number, f: number) { finite(a, b, c, d, e, f); this.m = mul(this.m, [a, b, c, d, e, f]); }
    setTransform(a: number, b: number, c: number, d: number, e: number, f: number) { finite(a, b, c, d, e, f); this.m = [a, b, c, d, e, f]; }
    resetTransform() { this.m = [...IDENTITY]; }

    // --- path construction --------------------------------------------------------
    beginPath() { this.done = []; this.cur = null; this.pt = null; this.version++; }

    moveTo(x: number, y: number) {
        finite(x, y);
        this.flush();
        const p = apply(this.m, x, y);
        this.cur = [{ x: p.x, y: p.y, kind: 'corner' }];
        this.pt = p;
        this.version++;
    }

    lineTo(x: number, y: number) {
        finite(x, y);
        if (!this.ensureStart(x, y)) return;
        const p = apply(this.m, x, y);
        this.cur!.push({ x: p.x, y: p.y, kind: 'corner' });
        this.pt = p;
        this.version++;
    }

    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) {
        finite(c1x, c1y, c2x, c2y, x, y);
        this.ensureStart(c1x, c1y);
        this.cubicDevice(apply(this.m, c1x, c1y), apply(this.m, c2x, c2y), apply(this.m, x, y));
    }

    quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
        finite(cx, cy, x, y);
        this.ensureStart(cx, cy);
        const p0 = this.pt!, q = apply(this.m, cx, cy), p = apply(this.m, x, y);
        // Degree elevation: a quadratic is the cubic with controls 2/3 of the way to q.
        this.cubicDevice(
            { x: p0.x + (q.x - p0.x) * 2 / 3, y: p0.y + (q.y - p0.y) * 2 / 3 },
            { x: p.x + (q.x - p.x) * 2 / 3, y: p.y + (q.y - p.y) * 2 / 3 },
            p,
        );
    }

    /** Canvas `arc`: angles in radians, clockwise on screen (y down) unless `anticlockwise`. */
    arc(cx: number, cy: number, r: number, start: number, end: number, anticlockwise = false) {
        this.ellipse(cx, cy, r, r, 0, start, end, anticlockwise);
    }

    /** Cairo `arc_negative`. */
    arcNegative(cx: number, cy: number, r: number, start: number, end: number) {
        this.ellipse(cx, cy, r, r, 0, start, end, true);
    }

    ellipse(cx: number, cy: number, rx: number, ry: number, rotation: number, start: number, end: number, anticlockwise = false) {
        finite(cx, cy, rx, ry, rotation, start, end);
        if (rx < 0 || ry < 0) throw new RangeError('Yappy.draw: arc radius must be non-negative');
        let sweep = end - start;
        if (!anticlockwise) sweep = sweep >= TAU ? TAU : ((sweep % TAU) + TAU) % TAU;
        else sweep = sweep <= -TAU ? -TAU : -((((start - end) % TAU) + TAU) % TAU);

        const cr = Math.cos(rotation), sr = Math.sin(rotation);
        const local = (t: number, dx: number, dy: number) => {
            // point (or tangent when dx/dy are derivatives) on the unrotated ellipse, then rotate + place
            const ux = rx * dx, uy = ry * dy;
            return { x: ux * cr - uy * sr, y: ux * sr + uy * cr, t };
        };
        const at = (t: number) => { const v = local(t, Math.cos(t), Math.sin(t)); return { x: cx + v.x, y: cy + v.y }; };

        const s = at(start);
        if (this.pt) this.lineTo(s.x, s.y); else this.moveTo(s.x, s.y);
        if (Math.abs(sweep) < EPS) return;

        const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9));
        const step = sweep / n;
        const k = 4 / 3 * Math.tan(step / 4); // signed handle length on the unit circle
        for (let i = 0; i < n; i++) {
            const t0 = start + step * i, t1 = t0 + step;
            const p0 = at(t0), p1 = at(t1);
            const d0 = local(t0, -Math.sin(t0), Math.cos(t0)), d1 = local(t1, -Math.sin(t1), Math.cos(t1));
            const c1 = { x: p0.x + d0.x * k, y: p0.y + d0.y * k };
            const c2 = { x: p1.x - d1.x * k, y: p1.y - d1.y * k };
            this.cubicDevice(apply(this.m, c1.x, c1.y), apply(this.m, c2.x, c2.y), apply(this.m, p1.x, p1.y));
            if (i < n - 1) this.cur![this.cur!.length - 1].kind = 'smooth';
        }
    }

    rect(x: number, y: number, w: number, h: number) {
        finite(x, y, w, h);
        this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h);
        this.closePath();
    }

    closePath() {
        if (!this.cur) return;
        const sp = this.cur;
        const first = sp[0], last = sp[sp.length - 1];
        if (sp.length > 1 && Math.abs(first.x - last.x) < 1e-6 && Math.abs(first.y - last.y) < 1e-6) {
            // The last segment already returns to the start: fold it into the first anchor.
            first.inX = last.inX; first.inY = last.inY;
            if (last.inX != null && first.outX != null) first.kind = 'smooth';
            sp.pop();
        }
        if (sp.length >= 2) this.done.push({ anchors: sp, closed: true });
        this.cur = null;
        this.pt = { x: first.x, y: first.y };
        this.version++;
    }

    // --- Cairo relative ops (dx/dy in user space) -----------------------------------
    relMoveTo(dx: number, dy: number) { const p = this.userPoint(); this.moveTo(p.x + dx, p.y + dy); }
    relLineTo(dx: number, dy: number) { const p = this.userPoint(); this.lineTo(p.x + dx, p.y + dy); }
    relCurveTo(dx1: number, dy1: number, dx2: number, dy2: number, dx: number, dy: number) {
        const p = this.userPoint();
        this.bezierCurveTo(p.x + dx1, p.y + dy1, p.x + dx2, p.y + dy2, p.x + dx, p.y + dy);
    }

    /** Current point in user space (null when there is none) — Cairo `get_current_point`. */
    currentPoint(): { x: number; y: number } | null {
        if (!this.pt) return null;
        const [a, b, c, d, e, f] = this.m;
        const det = a * d - b * c;
        if (Math.abs(det) < EPS) return null;
        const x = this.pt.x - e, y = this.pt.y - f;
        return { x: (d * x - c * y) / det, y: (a * y - b * x) / det };
    }

    hasPath() { return this.subpaths().length > 0; }

    /** Everything built so far, open subpaths included. Returns copies. */
    subpaths(): PathSubpath[] {
        const out = this.done.map(sp => ({ closed: sp.closed, anchors: sp.anchors.map(a => ({ ...a })) }));
        if (this.cur && this.cur.length >= 2) out.push({ closed: false, anchors: this.cur.map(a => ({ ...a })) });
        return out;
    }

    // --- internals ---------------------------------------------------------------
    private userPoint() {
        const p = this.currentPoint();
        if (!p) throw new Error('Yappy.draw: relative op with no current point (call moveTo first)');
        return p;
    }

    /** Canvas: a segment op with no current point starts the subpath at (x, y). After a
     *  closePath the next segment starts a fresh subpath from where the last one began. */
    private ensureStart(x: number, y: number): boolean {
        if (!this.pt) { this.moveTo(x, y); return false; }
        if (!this.cur) { this.cur = [{ x: this.pt.x, y: this.pt.y, kind: 'corner' }]; }
        return true;
    }

    private cubicDevice(c1: { x: number; y: number }, c2: { x: number; y: number }, p: { x: number; y: number }) {
        const prev = this.cur![this.cur!.length - 1];
        prev.outX = c1.x - prev.x; prev.outY = c1.y - prev.y;
        this.cur!.push({ x: p.x, y: p.y, inX: c2.x - p.x, inY: c2.y - p.y, kind: 'corner' });
        this.pt = p;
        this.version++;
    }

    private flush() {
        if (this.cur && this.cur.length >= 2) this.done.push({ anchors: this.cur, closed: false });
        this.cur = null;
    }
}

export interface DrawStyle {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    globalAlpha: number;
    lineDash: number[];
    lineCap: 'butt' | 'round' | 'square';
    lineJoin: 'miter' | 'round' | 'bevel';
}

export type DrawPaint = 'fill' | 'stroke';

/**
 * Called for each paint. `mergeInto` is set when the same, unchanged path was just
 * painted the other way (fill then stroke): update that element instead of making a
 * second one. Returns the element id.
 */
export type DrawEmit = (subpaths: PathSubpath[], paint: DrawPaint, style: DrawStyle, mergeInto: string | null) => string | null;

const CAPS: readonly string[] = ['butt', 'round', 'square'];
const JOINS: readonly string[] = ['miter', 'round', 'bevel'];

const hex2 = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');

/**
 * The object handed to a `Yappy.draw` callback. Canvas 2D names and semantics by default
 * (`fill()` keeps the path); `mode: 'cairo'` makes `fill()`/`stroke()` clear it, with
 * `fillPreserve()`/`strokePreserve()` to keep it, as in Cairo.
 */
export class DrawContext extends PathBuilder {
    fillStyle = '#000000';
    strokeStyle = '#000000';
    lineWidth = 1;
    globalAlpha = 1;
    /** Canvas and Cairo both default to butt caps and mitred joins (Yappy's own default is round). */
    lineCap: DrawStyle['lineCap'] = 'butt';
    lineJoin: DrawStyle['lineJoin'] = 'miter';
    readonly ids: string[] = [];
    private lineDash: number[] = [];
    private styleStack: DrawStyle[] = [];
    private last: { id: string; version: number; paint: DrawPaint } | null = null;

    private readonly emitFn: DrawEmit;
    private readonly cairo: boolean;

    constructor(emit: DrawEmit, cairo = false) { super(); this.emitFn = emit; this.cairo = cairo; }

    save() { super.save(); this.styleStack.push(this.style()); }
    restore() {
        super.restore();
        const s = this.styleStack.pop();
        if (s) { this.fillStyle = s.fillStyle; this.strokeStyle = s.strokeStyle; this.lineWidth = s.lineWidth; this.globalAlpha = s.globalAlpha; this.lineDash = s.lineDash; this.lineCap = s.lineCap; this.lineJoin = s.lineJoin; }
    }

    setLineDash(segments: number[]) { this.lineDash = Array.isArray(segments) ? segments.filter(n => Number.isFinite(n) && n >= 0) : []; }
    getLineDash() { return [...this.lineDash]; }

    // Cairo spellings. Cairo has one "source" for both fill and stroke; colour parts are 0..1.
    setSourceRgb(r: number, g: number, b: number) { this.setSourceRgba(r, g, b, 1); }
    setSourceRgba(r: number, g: number, b: number, a = 1) {
        finite(r, g, b, a);
        const c = `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a) : ''}`;
        this.fillStyle = c; this.strokeStyle = c;
    }
    setLineWidth(w: number) { finite(w); this.lineWidth = w; }
    setLineCap(cap: DrawStyle['lineCap']) { this.lineCap = cap; }
    setLineJoin(join: DrawStyle['lineJoin']) { this.lineJoin = join; }
    newPath() { this.beginPath(); }
    curveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number) { this.bezierCurveTo(c1x, c1y, c2x, c2y, x, y); }
    rectangle(x: number, y: number, w: number, h: number) { this.rect(x, y, w, h); }

    // Canvas shorthands
    fillRect(x: number, y: number, w: number, h: number) { this.paintShape(() => this.rect(x, y, w, h), 'fill'); }
    strokeRect(x: number, y: number, w: number, h: number) { this.paintShape(() => this.rect(x, y, w, h), 'stroke'); }

    fill() { this.paint('fill'); if (this.cairo) this.beginPath(); }
    stroke() { this.paint('stroke'); if (this.cairo) this.beginPath(); }
    fillPreserve() { this.paint('fill'); }
    strokePreserve() { this.paint('stroke'); }

    private style(): DrawStyle {
        // Like canvas, an invalid cap/join assignment is ignored rather than thrown.
        const lineCap = CAPS.includes(this.lineCap) ? this.lineCap : 'butt';
        const lineJoin = JOINS.includes(this.lineJoin) ? this.lineJoin : 'miter';
        return { fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, globalAlpha: this.globalAlpha, lineDash: [...this.lineDash], lineCap, lineJoin };
    }

    private paint(kind: DrawPaint) {
        const sp = this.subpaths();
        if (!sp.length) return;
        const same = this.last && this.last.version === this.version && this.last.paint !== kind ? this.last.id : null;
        const id = this.emitFn(sp, kind, this.style(), same);
        if (!id) return;
        if (!same) this.ids.push(id);
        this.last = { id, version: this.version, paint: kind };
    }

    /** fillRect/strokeRect paint their own rectangle and leave the current path alone. */
    private paintShape(build: () => void, kind: DrawPaint) {
        const snapshot = this.subpaths(), pt = this.currentPoint();
        this.beginPath(); build(); this.paint(kind); this.beginPath();
        for (const sp of snapshot) this.restoreSubpath(sp);
        if (pt) this.moveTo(pt.x, pt.y);
    }

    private restoreSubpath(sp: PathSubpath) {
        // Re-enter device-space anchors under an identity transform so they land unchanged.
        this.save(); this.resetTransform();
        const a = sp.anchors;
        this.moveTo(a[0].x, a[0].y);
        for (let i = 1; i < a.length; i++) this.segTo(a[i - 1], a[i]);
        if (sp.closed) { this.segTo(a[a.length - 1], a[0]); this.closePath(); }
        this.restore();
    }

    private segTo(p: PathAnchor, q: PathAnchor) {
        if (p.outX == null && q.inX == null) this.lineTo(q.x, q.y);
        else this.bezierCurveTo(p.x + (p.outX ?? 0), p.y + (p.outY ?? 0), q.x + (q.inX ?? 0), q.y + (q.inY ?? 0), q.x, q.y);
    }
}

/** Paint-state properties the data form may assign (`['fillStyle', '#f00']`). */
export const DRAW_PROPS = ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'lineCap', 'lineJoin'] as const;

/** Methods the data form may call. An explicit list: TS `private` is not private at runtime. */
export const DRAW_METHODS = [
    'save', 'restore', 'translate', 'scale', 'rotate', 'transform', 'setTransform', 'resetTransform',
    'beginPath', 'newPath', 'moveTo', 'lineTo', 'bezierCurveTo', 'curveTo', 'quadraticCurveTo',
    'arc', 'arcNegative', 'ellipse', 'rect', 'rectangle', 'closePath', 'relMoveTo', 'relLineTo', 'relCurveTo',
    'setLineDash', 'setSourceRgb', 'setSourceRgba', 'setLineWidth', 'setLineCap', 'setLineJoin',
    'fill', 'stroke', 'fillPreserve', 'strokePreserve', 'fillRect', 'strokeRect',
] as const;

export type DrawOp = [string, ...unknown[]];

/**
 * Replay a JSON op list — the form that crosses the embed bridge, where a callback
 * can't. `['name', ...args]` calls a method in `methods`; a name in `props` assigns its
 * one arg. Anything else is refused.
 */
export function runDrawOps(target: Record<string, any>, ops: DrawOp[], props: readonly string[], methods: readonly string[]) {
    if (!Array.isArray(ops)) throw new TypeError('Yappy.draw: ops must be an array of [name, ...args]');
    ops.forEach((op, i) => {
        if (!Array.isArray(op) || typeof op[0] !== 'string') throw new TypeError(`Yappy.draw: op ${i} is not [name, ...args]`);
        const [name, ...args] = op;
        if (props.includes(name)) { target[name] = args[0]; return; }
        if (!methods.includes(name) || typeof target[name] !== 'function') throw new Error(`Yappy.draw: unknown op "${name}"`);
        target[name](...args);
    });
}
