/**
 * Shared SVG builder for the stick-figure library.
 *
 * Figures are authored once as neutral (male) *poses* — a head, a straight
 * skeleton `d` string, a hip point, and optional props — then `buildFigure`
 * generates the four character variants (male / female / boy / girl) from that
 * single source:
 *   • female / girl → add hair (fringe + side locks) and a skirt over the thighs
 *   • boy / girl    → enlarge the head and vertically compress the body so the
 *                     head-to-body ratio reads as a child
 *
 * Authoring conventions: viewBox 0 0 140 260, figure centred near x = 70, bold
 * uniform outline (#1f2937), hollow parts (root `fill="none"`), props set their
 * own fill. Limbs are smoothed into bezier curves so a selected limb already has
 * editable handles.
 */
export const W = 140, H = 260;
export const STROKE = '#1f2937';

export type Variant = 'male' | 'female' | 'boy' | 'girl';
export const VARIANTS: Variant[] = ['male', 'female', 'boy', 'girl'];

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Wrap markup in a consistent SVG document. */
export function doc(inner: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke="${STROKE}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/** Head circle at (cx,cy) radius r. Tagged `head` for per-part recolour. */
export const head = (cx = 70, cy = 34, r = 22) =>
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" data-sf-role="head"/>`;

/** Parse an `M…L…L…` subpath (only M/L commands) into a list of [x,y] points. */
function subToPoints(sub: string): number[][] {
    return sub.replace(/^M/, '').split('L')
        .map(s => s.trim().split(/[ ,]+/).map(Number))
        .filter(p => p.length === 2 && p.every(Number.isFinite));
}

/** Smooth a straight/polyline limb into a bezier path (subtle bow / Catmull-Rom). */
function curveLimb(points: number[][], bow = 0.05): string {
    if (points.length < 2) return '';
    if (points.length === 2) {
        const [a, b] = points;
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        const off = len * bow;
        const cx = (a[0] + b[0]) / 2 - (dy / len) * off;
        const cy = (a[1] + b[1]) / 2 + (dx / len) * off;
        return `M${a[0]} ${a[1]}Q${r1(cx)} ${r1(cy)} ${b[0]} ${b[1]}`;
    }
    let d = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += `C${r1(c1x)} ${r1(c1y)} ${r1(c2x)} ${r1(c2y)} ${p2[0]} ${p2[1]}`;
    }
    return d;
}

/**
 * Skeleton from a straight `d` string. Each `M…` subpath (torso, each arm, each
 * leg) becomes its OWN smooth-curved `<path>` — so after ungrouping a dropped
 * figure every limb is independently selectable, stylable, and already a bezier
 * curve with handles. All tagged `body` for role recolour.
 */
export const bones = (d: string) =>
    d.split(/(?=M)/).map(seg => seg.trim()).filter(Boolean)
        .map(seg => curveLimb(subToPoints(seg)))
        .filter(Boolean)
        .map(seg => `<path d="${seg}" data-sf-role="body"/>`).join('');

/** Female hair over a head at (cx,cy,r): a fringe plus two side locks. */
function hair(cx: number, cy: number, r: number): string {
    const top = cy - r;
    return `<path d="M${r1(cx - r + 3)} ${r1(cy - 3)} Q ${r1(cx)} ${r1(top - 7)} ${r1(cx + r - 3)} ${r1(cy - 3)}" data-sf-role="accent" stroke-width="6"/>`
        + `<path d="M${r1(cx - r + 2)} ${r1(cy - 1)} Q ${r1(cx - r - 5)} ${r1(cy + r - 2)} ${r1(cx - r + 1)} ${r1(cy + r + 8)}" data-sf-role="accent" stroke-width="4"/>`
        + `<path d="M${r1(cx + r - 2)} ${r1(cy - 1)} Q ${r1(cx + r + 5)} ${r1(cy + r - 2)} ${r1(cx + r - 1)} ${r1(cy + r + 8)}" data-sf-role="accent" stroke-width="4"/>`;
}

/** A skirt (trapezoid) hanging from the hip, covering the upper thighs. */
function skirt(hx: number, hy: number): string {
    const wTop = 13, wBot = 25, len = 36;
    return `<path d="M${r1(hx - wTop)} ${r1(hy - 2)} L${r1(hx + wTop)} ${r1(hy - 2)} L${r1(hx + wBot)} ${r1(hy + len)} L${r1(hx - wBot)} ${r1(hy + len)} Z" fill="#ffffff" data-sf-role="body" stroke-width="6"/>`;
}

/** A pose: neutral source geometry that variants are generated from. */
export interface Pose {
    id: string;
    name: string;
    category: string;
    tags: string[];
    /** Head circle [cx, cy, r]. */
    head: [number, number, number];
    /** Hip point [x, y] where legs diverge — used to place the skirt. */
    hip: [number, number];
    /** Straight skeleton `d` string (torso + arms + legs as `M…L…` subpaths). */
    bones: string;
    /** Extra prop markup (already coloured / role-tagged). */
    props?: string;
    /**
     * Whether to generate female/boy/girl variants. Default true. Set false for
     * seated / behind-object poses where a skirt or child squash makes no sense
     * (they ship as the single neutral figure only).
     */
    variants?: boolean;
}

/** Inner markup (no `<svg>` wrapper) for a pose in a variant — for composing scenes. */
export function figureInner(pose: Pose, variant: Variant = 'male'): string {
    return buildFigure(pose, variant).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
}

/** Build the SVG for a pose in a given character variant. */
export function buildFigure(pose: Pose, variant: Variant = 'male'): string {
    const [cx, cy, r] = pose.head;
    const feminine = variant === 'female' || variant === 'girl';
    const child = variant === 'boy' || variant === 'girl';
    const rr = child ? r * 1.28 : r;

    // Body = skeleton + props + (skirt over the thighs for feminine variants).
    let bodyInner = bones(pose.bones) + (pose.props || '');
    if (feminine) bodyInner += skirt(pose.hip[0], pose.hip[1]);
    // Child: vertically compress the body about the neck so the head reads bigger.
    const body = child
        ? `<g transform="translate(0 ${r1(cy + r)}) scale(1 0.82) translate(0 ${r1(-(cy + r))})">${bodyInner}</g>`
        : bodyInner;

    // Head (enlarged for children) + hair on top for feminine variants.
    const headGroup = head(cx, cy, rr) + (feminine ? hair(cx, cy, rr) : '');

    return doc(body + headGroup);
}
