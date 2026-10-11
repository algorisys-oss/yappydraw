/**
 * Line jumps — the small arc a connector draws where it crosses another one, so two
 * lines that merely cross never read as a junction.
 *
 * Who jumps: of the two connectors at a crossing, the one with the HIGHER id (the same
 * priority order the elbow router uses for avoidance, so it is deterministic and a
 * connector never jumps over one that is also jumping over it). Only straight runs
 * jump: elbow segments and straight connectors; curves are left alone.
 *
 * The scene: the geometry helper has no access to other elements, so the renderer and
 * the exporter register the connectors of the pass with `setJumpScene` and
 * `connectorGeometry` asks `lineJumpsFor(el)` for its crossings. With no scene set (unit
 * tests, hit-testing) there are no jumps. The crossing list is cached per element while
 * the scene revision is unchanged.
 */
import type { DrawingElement } from '../types';

export interface Pt { x: number; y: number }
export interface JumpPoint {
    /** Index of the run (between consecutive waypoints) the crossing is on. */
    seg: number;
    /** Position along that run, 0–1. */
    t: number;
    x: number;
    y: number;
}

/** Radius of the jump arc in px. */
export const JUMP_RADIUS = 6;

const JUMP_TYPES = new Set(['line', 'arrow']);

let sceneConnectors: DrawingElement[] = [];
let sceneEnabled = false;
let sceneRevision = 0;
const cache = new Map<string, { rev: number; sig: string; jumps: JumpPoint[] }>();

/** Register the connectors of the pass about to render / export. */
export function setJumpScene(elements: readonly DrawingElement[], enabled: boolean, revision?: number): void {
    sceneEnabled = enabled;
    sceneConnectors = enabled ? elements.filter(isJumpable) : [];
    const rev = revision ?? sceneRevision + 1;
    if (rev !== sceneRevision) { sceneRevision = rev; cache.clear(); }
}

export function clearJumpScene(): void { sceneEnabled = false; sceneConnectors = []; cache.clear(); }

function isJumpable(el: DrawingElement): boolean {
    if (!JUMP_TYPES.has(el.type)) return false;
    const ct = el.curveType || 'straight';
    return ct === 'straight' || ct === 'elbow';
}

/** World-space run endpoints of a straight/elbow connector. */
export function connectorRuns(el: DrawingElement): Pt[] {
    const raw = el.points;
    const pts: Pt[] = [];
    if (raw && raw.length >= 2) {
        if (typeof raw[0] === 'number') {
            const f = raw as number[];
            for (let i = 0; i + 1 < f.length; i += 2) pts.push({ x: el.x + f[i], y: el.y + f[i + 1] });
        } else {
            for (const p of raw as Pt[]) pts.push({ x: el.x + p.x, y: el.y + p.y });
        }
    }
    if (pts.length < 2) return [{ x: el.x, y: el.y }, { x: el.x + el.width, y: el.y + el.height }];
    // Drop zero-length runs so a crossing never lands on one.
    const out: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
        const l = out[out.length - 1];
        if (Math.abs(pts[i].x - l.x) > 0.01 || Math.abs(pts[i].y - l.y) > 0.01) out.push(pts[i]);
    }
    return out;
}

/** Proper intersection of segments a–b and c–d (not touching at an endpoint). Returns t along a–b. */
function intersectT(a: Pt, b: Pt, c: Pt, d: Pt): number | null {
    const r = { x: b.x - a.x, y: b.y - a.y };
    const s = { x: d.x - c.x, y: d.y - c.y };
    const den = r.x * s.y - r.y * s.x;
    if (Math.abs(den) < 1e-9) return null;                      // parallel or collinear: no jump
    const qp = { x: c.x - a.x, y: c.y - a.y };
    const t = (qp.x * s.y - qp.y * s.x) / den;
    const u = (qp.x * r.y - qp.y * r.x) / den;
    const eps = 1e-6;
    if (t <= eps || t >= 1 - eps || u <= eps || u >= 1 - eps) return null;
    return t;
}

/** The crossings at which `el` jumps over lower-id connectors, in path order. */
export function lineJumpsFor(el: DrawingElement): JumpPoint[] {
    if (!sceneEnabled || !isJumpable(el)) return [];
    const runs = connectorRuns(el);
    const sig = `${el.x},${el.y},${runs.map(p => `${p.x},${p.y}`).join(';')}`;
    const hit = cache.get(el.id);
    if (hit && hit.rev === sceneRevision && hit.sig === sig) return hit.jumps;

    const jumps: JumpPoint[] = [];
    for (let i = 0; i + 1 < runs.length; i++) {
        const a = runs[i], b = runs[i + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        if (len < 2 * JUMP_RADIUS + 4) continue;              // no room for an arc on this run
        const found: number[] = [];
        for (const other of sceneConnectors) {
            if (other.id === el.id || !(other.id < el.id)) continue;   // lower id crosses straight
            const or = connectorRuns(other);
            for (let j = 0; j + 1 < or.length; j++) {
                const t = intersectT(a, b, or[j], or[j + 1]);
                if (t === null) continue;
                // Keep the arc clear of the run's ends (and the bend / arrowhead there).
                const along = t * len;
                if (along < JUMP_RADIUS + 3 || len - along < JUMP_RADIUS + 3) continue;
                found.push(t);
            }
        }
        found.sort((p, q) => p - q);
        // Merge crossings closer than a diameter into one (one wider arc would be better; one arc is fine).
        let lastAlong = -Infinity;
        for (const t of found) {
            const along = t * len;
            if (along - lastAlong < 2 * JUMP_RADIUS) continue;
            lastAlong = along;
            jumps.push({ seg: i, t, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        }
    }
    cache.set(el.id, { rev: sceneRevision, sig, jumps });
    return jumps;
}
