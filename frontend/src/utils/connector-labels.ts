/**
 * Connector label placement — where a connector's text sits, and how labels of nearby
 * connectors stay out of each other's way ("label lanes", routing-channel plan Phase 4).
 *
 * Before this a label sat at the path midpoint, which on an elbow is as likely to be a
 * bend as a run, and two connectors crossing or running side by side put their labels on
 * top of each other.
 *
 * Rules:
 *  - **Elbow:** the label sits at the centre of a straight run — the run under the path
 *    midpoint when it is long enough for the text, else the longest run. Never on a bend.
 *  - **Straight / curve:** the midpoint, as before.
 *  - **Label Position** (`labelPosition`: start | middle | end) moves it to 15% / 50% / 85%
 *    of the path. It existed in the Properties panel and was never read; it is now.
 *  - **Lanes:** labels are placed in id order; a label whose box would overlap an earlier
 *    one slides along its run, then onto a lane beside the line, until it is clear.
 *
 * The scene (which connectors carry labels) is registered per render pass / export, like
 * line jumps, so the geometry stays usable without it.
 */
import type { DrawingElement } from '../types';
import { connectorGeometry, type Pt } from './connector-geometry';

export interface LabelBox { x: number; y: number; w: number; h: number }
export interface LabelPlacement {
    /** Centre of the label. */
    x: number;
    y: number;
    box: LabelBox;
}
/** Measures a label's text block (all lines) in px, for the element's font. */
export type LabelMeasure = (text: string, el: DrawingElement) => { w: number; h: number };

const LABEL_TYPES = new Set(['line', 'arrow', 'bezier']);
const LANE_GAP = 4;

let scene: DrawingElement[] = [];
let sceneRevision = 0;
const cache = new Map<string, { rev: number; sig: string; p: LabelPlacement }>();

export function setLabelScene(elements: readonly DrawingElement[], revision?: number): void {
    scene = elements.filter(e => LABEL_TYPES.has(e.type) && !!e.containerText && e.containerText.trim().length > 0 && !e.curvedText);
    const rev = revision ?? sceneRevision + 1;
    if (rev !== sceneRevision) { sceneRevision = rev; cache.clear(); }
}
export function clearLabelScene(): void { scene = []; cache.clear(); }

/** Rough text block size when no canvas is at hand (export): 0.55em per character. */
export const estimateLabelSize: LabelMeasure = (text, el) => {
    const fontSize = el.fontSize || 14;
    const lines = text.split('\n');
    const w = Math.max(...lines.map(l => l.length)) * fontSize * 0.55;
    return { w, h: lines.length * fontSize * 1.3 };
};

const boxesMeet = (a: LabelBox, b: LabelBox) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

interface Run { a: Pt; b: Pt; len: number; start: number }

function runsOf(pts: Pt[]): Run[] {
    const out: Run[] = [];
    let acc = 0;
    for (let i = 0; i + 1 < pts.length; i++) {
        const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        if (len < 0.01) continue;
        out.push({ a: pts[i], b: pts[i + 1], len, start: acc });
        acc += len;
    }
    return out;
}

/** Point at `frac` of the polyline's length, and the run it lies on. */
function alongPolyline(runs: Run[], frac: number): { p: Pt; run: Run } {
    const total = runs.reduce((s, r) => s + r.len, 0);
    const target = total * frac;
    for (const r of runs) {
        if (r.start + r.len >= target) {
            const t = r.len ? (target - r.start) / r.len : 0;
            return { p: { x: r.a.x + (r.b.x - r.a.x) * t, y: r.a.y + (r.b.y - r.a.y) * t }, run: r };
        }
    }
    const last = runs[runs.length - 1];
    return { p: last.b, run: last };
}

function basePlacement(el: DrawingElement, size: { w: number; h: number }): { p: Pt; dir: Pt } {
    const g = connectorGeometry(el);
    const pos = el.labelPosition ?? 'middle';
    const frac = pos === 'start' ? 0.15 : pos === 'end' ? 0.85 : 0.5;

    if (el.curveType === 'elbow' && g.points && g.points.length >= 2) {
        const runs = runsOf(g.points);
        if (runs.length === 0) return { p: g.mid, dir: { x: 1, y: 0 } };
        const at = alongPolyline(runs, frac);
        let run = at.run;
        if (pos === 'middle') {
            // The run under the midpoint, if the text fits on it; else the longest run.
            const needed = Math.max(size.w, size.h) + 8;
            if (run.len < needed) run = runs.reduce((m, r) => (r.len > m.len ? r : m), runs[0]);
            const p = { x: (run.a.x + run.b.x) / 2, y: (run.a.y + run.b.y) / 2 };
            return { p, dir: { x: (run.b.x - run.a.x) / run.len, y: (run.b.y - run.a.y) / run.len } };
        }
        return { p: at.p, dir: { x: (run.b.x - run.a.x) / run.len, y: (run.b.y - run.a.y) / run.len } };
    }

    if (el.curveType === 'bezier' && g.cp1 && g.cp2) {
        const t = frac;
        const mt = 1 - t;
        const c = (p0: number, p1: number, p2: number, p3: number) =>
            mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
        const p = { x: c(g.start.x, g.cp1.x, g.cp2.x, g.end.x), y: c(g.start.y, g.cp1.y, g.cp2.y, g.end.y) };
        const d = { x: g.end.x - g.start.x, y: g.end.y - g.start.y };
        const l = Math.hypot(d.x, d.y) || 1;
        return { p, dir: { x: d.x / l, y: d.y / l } };
    }

    const d = { x: g.end.x - g.start.x, y: g.end.y - g.start.y };
    const l = Math.hypot(d.x, d.y) || 1;
    return { p: { x: g.start.x + d.x * frac, y: g.start.y + d.y * frac }, dir: { x: d.x / l, y: d.y / l } };
}

/** Where `el`'s label goes, clear of the labels of lower-id connectors in the scene. */
export function connectorLabelPlacement(el: DrawingElement, measure: LabelMeasure): LabelPlacement {
    const text = el.containerText || '';
    const size = measure(text, el);
    const padX = el.textHighlightPadding ?? 6;
    const padY = Math.max(padX / 2, 3);
    const w = size.w + padX * 2, h = size.h + padY * 2;
    const g = connectorGeometry(el);
    const sig = `${g.d ?? ''}|${text}|${el.fontSize}|${el.labelPosition ?? ''}|${w}|${h}`;
    const hit = cache.get(el.id);
    if (hit && hit.rev === sceneRevision && hit.sig === sig) return hit.p;

    const { p, dir } = basePlacement(el, size);
    const boxAt = (c: Pt): LabelBox => ({ x: c.x - w / 2, y: c.y - h / 2, w, h });

    // Earlier labels (lower ids) are fixed; this one moves out of their way.
    const taken: LabelBox[] = [];
    for (const other of scene) {
        if (!(other.id < el.id) || other.id === el.id) continue;
        taken.push(connectorLabelPlacement(other, measure).box);
    }
    const clear = (c: Pt) => { const b = boxAt(c); return !taken.some(t => boxesMeet(b, t)); };

    let chosen = p;
    if (!clear(p)) {
        const n = { x: dir.y, y: -dir.x };                              // left normal
        const alongStep = w / 2 + 8;
        const laneStep = h + LANE_GAP;
        const candidates: Pt[] = [];
        for (const k of [1, -1, 2, -2]) candidates.push({ x: p.x + dir.x * alongStep * k, y: p.y + dir.y * alongStep * k });
        for (const k of [1, -1, 2, -2]) candidates.push({ x: p.x + n.x * laneStep * k, y: p.y + n.y * laneStep * k });
        for (const k of [1, -1]) for (const m of [1, -1]) candidates.push({ x: p.x + dir.x * alongStep * k + n.x * laneStep * m, y: p.y + dir.y * alongStep * k + n.y * laneStep * m });
        const found = candidates.find(clear);
        if (found) chosen = found;
    }
    const placement = { x: chosen.x, y: chosen.y, box: boxAt(chosen) };
    cache.set(el.id, { rev: sceneRevision, sig, p: placement });
    return placement;
}
