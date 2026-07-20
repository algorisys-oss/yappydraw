import type { DrawingElement, ElementType } from "../types";
import { isWasmEnabled } from "../wasm/feature-flags";
import { wasmGetShapeGeometry } from "../wasm/bridge/shape-paths-bridge";
import { getPathSubpaths, subpathsToPathData } from "./math/path-utils";
import { warpGeometry, getEffectiveGrid } from "./envelope-warp";
import { applyTurntable } from "./turntable";

export type ShapeGeometry =
    | { type: 'rect', x: number, y: number, w: number, h: number, r?: number, shade?: number, noStroke?: boolean, isLid?: boolean, isBackface?: boolean }
    | { type: 'ellipse', cx: number, cy: number, rx: number, ry: number, shade?: number, noStroke?: boolean, isLid?: boolean, isBackface?: boolean }
    | { type: 'path', path: string, evenOdd?: boolean, shade?: number, noStroke?: boolean, isLid?: boolean, isBackface?: boolean }
    | { type: 'points', points: { x: number, y: number }[], isClosed?: boolean, shade?: number, noStroke?: boolean, isLid?: boolean, isBackface?: boolean }
    | { type: 'multi', shapes: ShapeGeometry[] };

/**
 * Calculate if a polygon face is back-facing based on its winding order.
 * Uses the signed area (shoelace formula) to determine winding:
 * - Positive area = counter-clockwise (front-facing in our coordinate system)
 * - Negative area = clockwise (back-facing)
 *
 * In screen coordinates where Y increases downward, this convention may be inverted
 * depending on how vertices are defined. We consider clockwise as back-facing.
 */
export const isPolygonBackfacing = (points: { x: number, y: number }[]): boolean => {
    if (points.length < 3) return false;

    // Calculate signed area using shoelace formula
    let signedArea = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        signedArea += (points[j].x - points[i].x) * (points[j].y + points[i].y);
    }

    // In screen coordinates (Y down), clockwise winding gives positive area
    // We consider clockwise as back-facing (normal points into screen)
    return signedArea > 0;
};

const getRoundedRectPath = (x: number, y: number, w: number, h: number, r: number) => {
    return `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y}`;
};

/**
 * Corner radius in px, mirroring the shape renderers' own `getRadius()`.
 * Fills are clipped to `getShapeGeometry()`, so this MUST stay in sync with
 * `rectangle-renderer.ts` / `diamond-renderer.ts` — otherwise gradient, image,
 * mesh, pattern and hachure fills escape the rounded outline at the corners.
 * `fallback` is the legacy `roundness` ratio (rect 0.15, diamond 0.2).
 */
const cornerRadius = (el: DrawingElement, fallback: number): number => {
    const min = Math.min(Math.abs(el.width), Math.abs(el.height));
    const br = (el as any).borderRadius;
    if (br !== undefined) return min * (br / 100);
    return (el as any).roundness ? min * fallback : 0;
};

/** Same vertex math as `DiamondRenderer.getRoundedDiamondPath` (origin-centred). */
const getRoundedDiamondPath = (x: number, y: number, w: number, h: number, r: number) => {
    const w2 = w / 2;
    const h2 = h / 2;
    const cx = x + w2;
    const cy = y + h2;
    const len = Math.hypot(w2, h2);
    const ratio = Math.min(r, len / 2) / len;
    const dx = w2 * ratio;
    const dy = h2 * ratio;

    return `M ${cx - dx} ${y + dy} Q ${cx} ${y} ${cx + dx} ${y + dy}`
        + ` L ${x + w - dx} ${cy - dy} Q ${x + w} ${cy} ${x + w - dx} ${cy + dy}`
        + ` L ${cx + dx} ${y + h - dy} Q ${cx} ${y + h} ${cx - dx} ${y + h - dy}`
        + ` L ${x + dx} ${cy + dy} Q ${x} ${cy} ${x + dx} ${cy - dy} Z`;
};

export const getShapeGeometry = (el: DrawingElement): ShapeGeometry | null => {
    const geo = getBaseShapeGeometry(el);
    // Envelope / mesh warp deforms the sampled outline (non-affine) → a warped path
    // geometry, so both render styles and SVG export pick it up unchanged.
    if (geo && el.warp) {
        const grid = getEffectiveGrid(el.warp);
        if (grid) return warpGeometry(geo, el.width, el.height, grid) as ShapeGeometry;
    }
    return geo;
};

const getBaseShapeGeometry = (el: DrawingElement): ShapeGeometry | null => {
    // If element has custom points (e.g., during morph animation), use them directly
    if (el.points && el.points.length > 0) {
        return { type: 'points', points: el.points as { x: number; y: number }[] };
    }

    // WASM fast path: polygon shapes computed in WASM. It only returns sharp-cornered
    // point lists (the bridge never sees borderRadius/roundness), so a rounded diamond
    // must fall through to the JS path below or its fill would ignore the rounding.
    const isRoundedDiamond = el.type === 'diamond' && cornerRadius(el, 0.2) > 0;
    if (isWasmEnabled('shapePaths') && !isRoundedDiamond) {
        const wasmResult = wasmGetShapeGeometry(el);
        if (wasmResult) return wasmResult;
        // Fall through to JS for unsupported shapes
    }

    const w = el.width;
    const h = el.height;
    const mw = w / 2;
    const mh = h / 2;
    const x = -mw;
    const y = -mh;

    switch (el.type) {
        case 'path': {
            // Editable vector path: anchors are origin-relative; shift to the centered
            // geometry frame (origin = element centre). Multiple subpaths punch holes via
            // the even-odd fill rule.
            // Live Turntable: rotate the anchors in pseudo-3D first, then render the result
            // as an ordinary path so fill/stroke + sketch/architectural parity come for free.
            const subs = applyTurntable(el) ?? getPathSubpaths(el);
            if (subs.length === 0) return null;
            const d = subpathsToPathData(subs, -mw, -mh);
            return d ? { type: 'path', path: d, evenOdd: subs.length > 1 } : null;
        }

        case 'rectangle':
        case 'image':
        case 'symbolInstance':
        case 'text':

        case 'umlClass':
        case 'umlNote':
        case 'umlPackage':
        case 'umlActor': // Approximate as rect for now
        case 'umlComponent':
        case 'umlLifeline':
        case 'umlFragment':
        case 'umlNode':
        case 'umlArtifact':
        case 'umlObject':
        case 'umlPort':
            return { type: 'rect', x: x, y: y, w: w, h: h, r: cornerRadius(el, 0.15) };

        case 'umlAction':
            return { type: 'rect', x: x, y: y, w: w, h: h, r: Math.min(Math.abs(h) / 2, Math.abs(w) / 2, 18) };

        case 'umlHistory':
            return { type: 'ellipse', cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2 };

        case 'umlState':
            return { type: 'rect', x: x, y: y, w: w, h: h, r: Math.min(Math.abs(w), Math.abs(h)) * 0.15 };

        case 'umlInterface':
        case 'umlUseCase':
        case 'umlProvidedInterface':

        case 'circle':
        // Defensive: 'ellipse'/'oval' aren't real ElementTypes (the tool creates 'circle'),
        // but tolerate any that slipped in via the API or an old doc so they still render
        // and participate in Pathfinder/boolean geometry instead of vanishing.
        case 'ellipse' as ElementType:
        case 'oval' as ElementType:
            return { type: 'ellipse', cx: 0, cy: 0, rx: w / 2, ry: h / 2 };

        case 'umlRequiredInterface': {
            // Semicircle arc (socket) opening to the right
            const r = Math.min(w, h) / 2;
            return {
                type: 'path',
                path: `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r}`
            };
        }

        case 'umlSignalSend': {
            // Pentagon pointing right (chevron)
            const arrowW = w * 0.2;
            return {
                type: 'points',
                points: [
                    { x: -mw, y: -mh },
                    { x: mw - arrowW, y: -mh },
                    { x: mw, y: 0 },
                    { x: mw - arrowW, y: mh },
                    { x: -mw, y: mh }
                ]
            };
        }

        case 'umlSignalReceive': {
            // Concave pentagon (notched on left)
            const notchW = w * 0.2;
            return {
                type: 'points',
                points: [
                    { x: -mw + notchW, y: -mh },
                    { x: mw, y: -mh },
                    { x: mw, y: mh },
                    { x: -mw + notchW, y: mh },
                    { x: -mw, y: 0 }
                ]
            };
        }

        case 'triangle':
            return { type: 'points', points: [{ x: 0, y: -mh }, { x: -mw, y: mh }, { x: mw, y: mh }] };

        case 'diamond': {
            // A `points` geometry can't express rounded corners — emit a path so fills
            // clip to the same curve the outline draws.
            const r = cornerRadius(el, 0.2);
            if (r > 0) return { type: 'path', path: getRoundedDiamondPath(x, y, w, h, r) };
            return { type: 'points', points: [{ x: 0, y: -mh }, { x: mw, y: 0 }, { x: 0, y: mh }, { x: -mw, y: 0 }] };
        }

        case 'hexagon': {
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 2;
                points.push({ x: (w / 2) * Math.cos(angle), y: (h / 2) * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'octagon': {
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i - Math.PI / 2;
                points.push({ x: (w / 2) * Math.cos(angle), y: (h / 2) * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'pentagon': {
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
                points.push({ x: (w / 2) * Math.cos(angle), y: (h / 2) * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'septagon': {
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < 7; i++) {
                const angle = (Math.PI * 2 / 7) * i - Math.PI / 2;
                points.push({ x: (w / 2) * Math.cos(angle), y: (h / 2) * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'star': {
            const outerRadius = Math.min(w, h) / 2;
            const ratio = (el.shapeRatio !== undefined ? el.shapeRatio : 38) / 100;
            const innerRadius = outerRadius * ratio;
            const numPoints = el.starPoints || 5;
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < numPoints * 2; i++) {
                const angle = (Math.PI / numPoints) * i - Math.PI / 2;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'burst': {
            const outerRadius = Math.min(Math.abs(w), Math.abs(h)) / 2;
            const ratio = (el.shapeRatio !== undefined ? el.shapeRatio : 70) / 100;
            const innerRadius = outerRadius * ratio;
            const numPoints = el.burstPoints || 16;
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < numPoints * 2; i++) {
                const angle = (Math.PI / numPoints) * i - Math.PI / 2;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                points.push({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'parallelogram': {
            const offset = w * 0.2;
            return { type: 'points', points: [{ x: x + offset, y: y }, { x: x + w, y: y }, { x: x + w - offset, y: y + h }, { x: x, y: y + h }] };
        }

        case 'trapezoid': {
            const offset = w * 0.2;
            return { type: 'points', points: [{ x: x + offset, y: y }, { x: x + w - offset, y: y }, { x: x + w, y: y + h }, { x: x, y: y + h }] };
        }

        case 'rightTriangle':
            return { type: 'points', points: [{ x: x, y: y }, { x: x, y: y + h }, { x: x + w, y: y + h }] };

        case 'capsule':
            return { type: 'path', path: getRoundedRectPath(x, y, w, h, Math.min(w, h) / 2) };

        case 'stickyNote': {
            const fold = Math.min(w, h) * 0.15;
            return { type: 'points', points: [{ x: x, y: y }, { x: x + w, y: y }, { x: x + w, y: y + h - fold }, { x: x + w - fold, y: y + h }, { x: x, y: y + h }] };
        }

        case 'callout': {
            const tailH = h * 0.2;
            const rectH = h - tailH;
            return { type: 'path', path: `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + rectH} L ${x + w * 0.7} ${y + rectH} L ${0} ${mh} L ${x + w * 0.3} ${y + rectH} L ${x} ${y + rectH} Z` };
        }

        case 'speechBubble': {
            const r = Math.min(w, h) * ((el.borderRadius !== undefined ? el.borderRadius : 20) / 100);
            const tailW = w * 0.15;
            const tailH = h * 0.2;
            const rectH = h - tailH;
            const tailPos = (el.tailPosition !== undefined ? el.tailPosition : 20) / 100;
            const tipX = x + (w * tailPos);
            let bX1, bX2;
            if (tailPos <= 0.5) { bX1 = tipX + (w * 0.1); bX2 = bX1 + tailW; }
            else { bX2 = tipX - (w * 0.1); bX1 = bX2 - tailW; }
            const rX = Math.min(w / 2, r), rY = Math.min(rectH / 2, r);
            return { type: 'path', path: `M ${x + rX} ${y} L ${x + w - rX} ${y} Q ${x + w} ${y} ${x + w} ${y + rY} L ${x + w} ${y + rectH - rY} Q ${x + w} ${y + rectH} ${x + w - rX} ${y + rectH} L ${bX2} ${y + rectH} L ${tipX} ${mh} L ${bX1} ${y + rectH} L ${x + rX} ${y + rectH} Q ${x} ${y + rectH} ${x} ${y + rectH - rY} L ${x} ${y + rY} Q ${x} ${y} ${x + rX} ${y} Z` };
        }

        case 'cloud': {
            const r1 = w * 0.2, r2 = w * 0.25, r3 = w * 0.2, r4 = w * 0.3;
            return { type: 'path', path: `M ${x + r1} 0 A ${r1} ${r1} 0 0 1 ${x + (w * 0.3)} ${y + r2} A ${r2} ${r2} 0 0 1 ${x + (w * 0.7)} ${y + r2} A ${r3} ${r3} 0 0 1 ${x + w - r3} 0 A ${r4} ${r4} 0 0 1 ${x + (w * 0.6)} ${y + h - (r4 * 0.5)} A ${r4} ${r4} 0 0 1 ${x + (w * 0.3)} ${y + h - (r4 * 0.5)} A ${r4} ${r4} 0 0 1 ${x + r1} 0 Z` };
        }

        case 'heart':
            return { type: 'path', path: `M ${0} ${y + (h * 0.3)} C ${0} ${y + (h * 0.15)} ${x + (w * 0.3)} ${y} ${x + (w * 0.5)} ${y + (h * 0.15)} C ${x + (w * 0.7)} ${y} ${x + w} ${y + (h * 0.15)} ${x + w} ${y + (h * 0.35)} C ${x + w} ${y + (h * 0.6)} ${0} ${y + (h * 0.8)} ${0} ${y + h} C ${0} ${y + (h * 0.8)} ${x} ${y + (h * 0.6)} ${x} ${y + (h * 0.35)} C ${x} ${y + (h * 0.15)} ${x + (w * 0.3)} ${y} ${x + (w * 0.5)} ${y + (h * 0.15)} Z` };

        case 'polygon': {
            const sides = el.polygonSides || 6;
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < sides; i++) {
                const angle = (2 * Math.PI / sides) * i - Math.PI / 2;
                points.push({ x: (w / 2) * Math.cos(angle), y: (h / 2) * Math.sin(angle) });
            }
            return { type: 'points', points: points };
        }

        case 'starPerson': {
            const headR = Math.min(w, h) * 0.15;
            const neckY = y + (headR * 2);
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: y + headR, rx: headR, ry: headR },
                    { type: 'points', points: [{ x: 0, y: neckY }, { x: x, y: y + (h * 0.4) }, { x: 0, y: y + (h * 0.5) }, { x: x + w, y: y + (h * 0.4) }, { x: 0, y: neckY }, { x: x + (w * 0.8), y: y + h }, { x: 0, y: y + (h * 0.7) }, { x: x + (w * 0.2), y: y + h }, { x: 0, y: neckY }] }
                ]
            };
        }

        case 'lightbulb': {
            const bulbR = Math.min(w, h / 1.5) / 2;
            const bW = w * 0.4, bH = h * 0.25, bY = y + h - bH;
            return {
                type: 'multi', shapes: [
                    { type: 'path', path: `M ${-bW / 2} ${bY} C ${-bW / 2} ${y + bulbR} ${x} ${y + (bulbR * 1.5)} ${x} ${y + bulbR} A ${bulbR} ${bulbR} 0 1 1 ${x + w} ${y + bulbR} C ${x + w} ${y + (bulbR * 1.5)} ${bW / 2} ${y + bulbR} ${bW / 2} ${bY} Z` },
                    { type: 'rect', x: -bW / 2, y: bY, w: bW, h: bH }
                ]
            };
        }

        case 'signpost': {
            const poleW = Math.max(4, w * 0.05), bH = h * 0.3, bW = w * 0.9, bY = y + h * 0.1;
            return {
                type: 'multi', shapes: [
                    { type: 'rect', x: -poleW / 2, y: y, w: poleW, h: h },
                    { type: 'rect', x: -bW / 2, y: bY, w: bW, h: bH }
                ]
            };
        }

        case 'burstBlob': {
            const rx = w / 2, ry = h / 2, spikes = 12, outerR = Math.min(rx, ry), innerR = outerR * 0.6, seed = el.seed || 1;
            const randomSeeded = (s: number) => { let t = (s += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
            const points: { x: number, y: number }[] = [];
            for (let i = 0; i < spikes * 2; i++) {
                const r = (i % 2 === 0) ? outerR : innerR;
                const rVar = r + (randomSeeded(seed + i) - 0.5) * (outerR * 0.1);
                const angle = (Math.PI * i) / spikes;
                points.push({ x: Math.cos(angle) * (w / h) * rVar, y: Math.sin(angle) * rVar });
            }
            return { type: 'points', points: points };
        }

        case 'scroll': {
            const rH = h * 0.15;
            return { type: 'path', path: `M ${x} ${y + rH} L ${x + w} ${y + rH} L ${x + w} ${y + h - rH} L ${x} ${y + h - rH} Z M ${x} ${y + rH} C ${x - rH} ${y + rH} ${x - rH} ${y} ${x} ${y} L ${x + w} ${y} C ${x + w + rH} ${y} ${x + w + rH} ${y + rH} ${x + w} ${y + rH} M ${x} ${y + h - rH} C ${x - rH} ${y + h - rH} ${x - rH} ${y + h} ${x} ${y + h} L ${x + w} ${y + h} C ${x + w + rH} ${y + h} ${x + w + rH} ${y + h - rH} ${x + w} ${y + h - rH}` };
        }

        case 'doubleBanner': {
            const eW = w * 0.15, eH = h * 0.25;
            return {
                type: 'multi', shapes: [
                    { type: 'points', points: [{ x: x + eW, y: y + eH }, { x: x, y: y + eH }, { x: x + (eW / 2), y: 0 }, { x: x, y: mh }, { x: x + eW, y: mh }] },
                    { type: 'points', points: [{ x: x + w - eW, y: y + eH }, { x: x + w, y: y + eH }, { x: x + w - (eW / 2), y: 0 }, { x: x + w, y: mh }, { x: x + w - eW, y: mh }] },
                    { type: 'points', points: [{ x: x + eW, y: y }, { x: x + w - eW, y: y }, { x: x + w - eW, y: y + h - eH }, { x: x + eW, y: y + h - eH }] }
                ]
            };
        }

        case 'document': {
            const wH = h * 0.1;
            return { type: 'path', path: `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h - wH} Q ${x + (w * 0.75)} ${y + h - (wH * 2)} ${x + (w * 0.5)} ${y + h - wH} T ${x} ${y + h - wH} Z` };
        }

        case 'database': {
            const eH = h * 0.1;
            return {
                type: 'path',
                path: `M ${x} ${y + eH} L ${x} ${y + h - eH} A ${mw} ${eH} 0 0 0 ${x + w} ${y + h - eH} L ${x + w} ${y + eH} A ${mw} ${eH} 0 0 1 ${x} ${y + eH}`
            };
        }

        case 'predefinedProcess':
        case 'internalStorage':
            return { type: 'rect', x: x, y: y, w: w, h: h };

        case 'cross':
            return { type: 'multi', shapes: [{ type: 'points', points: [{ x: x, y: y }, { x: x + w, y: y + h }] }, { type: 'points', points: [{ x: x + w, y: y }, { x: x, y: y + h }] }] };

        case 'checkmark':
            return { type: 'points', points: [{ x: x, y: y + (h * 0.5) }, { x: x + (w * 0.4), y: mh }, { x: x + w, y: y }] };

        case 'wavyDivider': {
            let p = `M ${x} 0`;
            for (let i = 1; i <= 20; i++) {
                p += ` L ${x + (i / 20) * w} ${Math.sin((i / 20) * Math.PI * 4) * (h / 2)}`;
            }
            return { type: 'path', path: p };
        }

        case 'ribbon': {
            const eW = w * 0.15, mH = h * 0.7;
            return { type: 'path', path: `M ${x + eW} ${y} L ${x + w - eW} ${y} L ${x + w - eW} ${y + mH} L ${x + w} ${y + h / 2} L ${x + w - eW} ${y + (h * 0.8)} L ${x + eW} ${y + (h * 0.8)} L ${x} ${y + h / 2} L ${x + eW} ${y + mH} Z` };
        }

        case 'bracketLeft': {
            return {
                type: 'points',
                isClosed: false,
                points: [
                    { x: x + w, y: y },
                    { x: x, y: y + h / 2 },
                    { x: x + w, y: y + h }
                ]
            };
        }

        case 'bracketRight': {
            return {
                type: 'points',
                isClosed: false,
                points: [
                    { x: x, y: y },
                    { x: x + w, y: y + h / 2 },
                    { x: x, y: y + h }
                ]
            };
        }

        case 'arrowLeft': {
            const tH = h * 0.4; // tail height
            const tY = y + (h - tH) / 2;
            const hW = w * 0.4; // head width
            return { type: 'points', points: [{ x: x + hW, y: y }, { x: x + hW, y: tY }, { x: x + w, y: tY }, { x: x + w, y: tY + tH }, { x: x + hW, y: tY + tH }, { x: x + hW, y: y + h }, { x: x, y: y + h / 2 }] };
        }

        case 'arrowRight': {
            const tH = h * 0.4;
            const tY = y + (h - tH) / 2;
            const hW = w * 0.4; // head width
            return { type: 'points', points: [{ x: x + w - hW, y: y }, { x: x + w, y: y + h / 2 }, { x: x + w - hW, y: y + h }, { x: x + w - hW, y: tY + tH }, { x: x, y: tY + tH }, { x: x, y: tY }, { x: x + w - hW, y: tY }] };
        }

        case 'arrowUp': {
            const tW = w * 0.4; // tail width
            const tX = x + (w - tW) / 2;
            const hH = h * 0.4; // head height
            return { type: 'points', points: [{ x: x + w / 2, y: y }, { x: x + w, y: y + hH }, { x: tX + tW, y: y + hH }, { x: tX + tW, y: y + h }, { x: tX, y: y + h }, { x: tX, y: y + hH }, { x: x, y: y + hH }] };
        }

        case 'arrowDown': {
            const tW = w * 0.4;
            const tX = x + (w - tW) / 2;
            const hH = h * 0.4;
            return { type: 'points', points: [{ x: tX, y: y }, { x: tX + tW, y: y }, { x: tX + tW, y: y + h - hH }, { x: x + w, y: y + h - hH }, { x: x + w / 2, y: y + h }, { x: x, y: y + h - hH }, { x: tX, y: y + h - hH }] };
        }

        case 'dfdProcess': {
            const headerH = h * 0.25;
            const r = 10;
            return {
                type: 'multi', shapes: [
                    { type: 'rect', x: x, y: y, w: w, h: h, r: r },
                    { type: 'points', points: [{ x: x, y: y + headerH }, { x: x + w, y: y + headerH }], isClosed: false }
                ]
            };
        }

        case 'dfdDataStore': {
            const labelW = w * 0.2;
            return {
                type: 'multi', shapes: [
                    {
                        type: 'points', isClosed: false, points: [
                            { x: x + w, y: y },
                            { x: x, y: y },
                            { x: x, y: y + h },
                            { x: x + w, y: y + h }
                        ]
                    },
                    {
                        type: 'points', isClosed: false, points: [
                            { x: x + labelW, y: y },
                            { x: x + labelW, y: y + h }
                        ]
                    }
                ]
            };
        }

        case 'isometricCube': {
            // Vertical Ratio (Depth/Viewing Angle) - Default 25%
            const vRatio = (el.shapeRatio !== undefined ? el.shapeRatio : 25) / 100;

            // Side Ratio (Perspective/Rotation) - Default 50%
            const sRatio = (el.sideRatio !== undefined ? el.sideRatio : 50) / 100;

            // Spine X position determines the "Front Corner" location
            const spineX = x + w * sRatio;

            // The "Back Corner" (Top Vertex) moves in OPPOSITION to the Front Corner to maintain parallel edges.
            const topX = x + w * (1 - sRatio);

            const faceHeight = h * vRatio;
            const cy = y + faceHeight; // Center Y

            // Shoulder Y (Left/Right corners).
            const shoulderY = y + faceHeight / 2;

            return {
                type: 'multi', shapes: [
                    // Top Face
                    {
                        type: 'points', points: [
                            { x: topX, y: y }, // Top (Back Corner)
                            { x: x + w, y: shoulderY }, // Right
                            { x: spineX, y: cy }, // Center (Front Corner)
                            { x: x, y: shoulderY } // Left
                        ],
                        shade: 1.1
                    },
                    // Left Face
                    {
                        type: 'points', points: [
                            { x: x, y: shoulderY }, // Top Left
                            { x: spineX, y: cy }, // Center
                            { x: spineX, y: y + h }, // Bottom Center
                            { x: x, y: y + h - faceHeight / 2 } // Bottom Left (Parallel to Top-Center edge)
                        ],
                        shade: 0.9
                    },
                    // Right Face
                    {
                        type: 'points', points: [
                            { x: spineX, y: cy }, // Center
                            { x: x + w, y: shoulderY }, // Top Right
                            { x: x + w, y: y + h - faceHeight / 2 }, // Bottom Right (Parallel to Top-Center edge)
                            { x: spineX, y: y + h } // Bottom Center
                        ],
                        shade: 0.7
                    }
                ]
            };
        }

        case 'solidBlock': {
            // Simple 3D solid block - no open lid functionality (use openBox for that)
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angleDeg = el.viewAngle !== undefined ? el.viewAngle : 45;
            const angleRad = (angleDeg * Math.PI) / 180;

            // Scale depth with shape size so it starts at 0 when size is 0
            const minDim = Math.min(Math.abs(w), Math.abs(h));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            // Calculate 3D offset
            const dx = depth * Math.cos(angleRad);
            const dy = depth * Math.sin(angleRad);

            // Front Face Vertices
            const fTL = { x: x, y: y };
            const fTR = { x: x + w, y: y };
            const fBR = { x: x + w, y: y + h };
            const fBL = { x: x, y: y + h };

            // Back Face Vertices (Offset)
            const bTL = { x: x + dx, y: y + dy };
            const bTR = { x: x + w + dx, y: y + dy };
            const bBR = { x: x + w + dx, y: y + h + dy };
            const bBL = { x: x + dx, y: y + h + dy };

            return {
                type: 'multi', shapes: [
                    // Back Face (Draw first / Background)
                    { type: 'points', points: [bTL, bTR, bBR, bBL], shade: 0.6 },

                    // Sides
                    { type: 'points', points: [fTL, fTR, bTR, bTL], shade: 1.1 }, // Top
                    { type: 'points', points: [fTR, fBR, bBR, bTR], shade: 0.8 }, // Right
                    { type: 'points', points: [fBR, fBL, bBL, bBR], shade: 0.7 }, // Bottom
                    { type: 'points', points: [fBL, fTL, bTL, bBL], shade: 0.9 }, // Left

                    // Front Face (Draw last / Foreground)
                    { type: 'points', points: [fTL, fTR, fBR, fBL], shade: 1.0 }
                ]
            };
        }

        case 'perspectiveBlock': {
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angleDeg = el.viewAngle !== undefined ? el.viewAngle : 45;
            const angleRad = (angleDeg * Math.PI) / 180;
            const taper = el.taper !== undefined ? el.taper : 0; // Back face taper
            const skewX = (el.skewX !== undefined ? el.skewX : 0) * w;
            const skewY = (el.skewY !== undefined ? el.skewY : 0) * h;

            const fTaper = el.frontTaper !== undefined ? el.frontTaper : 0;
            const fSkewX = (el.frontSkewX !== undefined ? el.frontSkewX : 0) * w;
            const fSkewY = (el.frontSkewY !== undefined ? el.frontSkewY : 0) * h;

            // Scale depth with shape size so it starts at 0 when size is 0
            const minDim = Math.min(Math.abs(w), Math.abs(h));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            const dx = depth * Math.cos(angleRad) + skewX;
            const dy = depth * Math.sin(angleRad) + skewY;

            // Front face vertices
            const fScale = 1 - fTaper;
            const fw = mw * fScale;
            const fh = mh * fScale;

            const fTL = { x: -fw + fSkewX, y: -fh + fSkewY };
            const fTR = { x: fw + fSkewX, y: -fh + fSkewY };
            const fBR = { x: fw + fSkewX, y: fh + fSkewY };
            const fBL = { x: -fw + fSkewX, y: fh + fSkewY };

            // Back face vertices
            const bScale = 1 - taper;
            const bw = mw * bScale;
            const bh = mh * bScale;

            const bTL = { x: dx - bw, y: dy - bh };
            const bTR = { x: dx + bw, y: dy - bh };
            const bBR = { x: dx + bw, y: dy + bh };
            const bBL = { x: dx - bw, y: dy + bh };

            return {
                type: 'multi', shapes: [
                    { type: 'points', points: [bTL, bTR, bBR, bBL], shade: 0.6 }, // Back
                    { type: 'points', points: [fTL, fTR, bTR, bTL], shade: 1.1 }, // Top
                    { type: 'points', points: [fTR, fBR, bBR, bTR], shade: 0.8 }, // Right
                    { type: 'points', points: [fBR, fBL, bBL, bBR], shade: 0.7 }, // Bottom
                    { type: 'points', points: [fBL, fTL, bTL, bBL], shade: 0.9 }, // Left
                    { type: 'points', points: [fTL, fTR, fBR, fBL], shade: 1.0 }  // Front
                ]
            };
        }

        case 'openBox': {
            // Open Box with configurable hinged lid(s)
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angleDeg = el.viewAngle !== undefined ? el.viewAngle : 45;
            const angleRad = (angleDeg * Math.PI) / 180;
            const openAmount = el.openAmount !== undefined ? el.openAmount : 0; // 0-100
            const lidPosition = el.lidPosition || 'back';
            const lidStyle = el.lidStyle || 'single';
            const showLidHinge = el.showLidHinge || false;

            // Scale depth with shape size so it starts at 0 when size is 0
            // Use 0.8 multiplier to allow deeper 3D views (top-down perspectives)
            const minDim = Math.min(Math.abs(w), Math.abs(h));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.8) : 0;

            // Calculate 3D offset for depth
            const dx = depth * Math.cos(angleRad);
            const dy = depth * Math.sin(angleRad);

            // Box body vertices
            // Front Face
            const fTL = { x: x, y: y };
            const fTR = { x: x + w, y: y };
            const fBR = { x: x + w, y: y + h };
            const fBL = { x: x, y: y + h };

            // Back Face
            const bTL = { x: x + dx, y: y + dy };
            const bTR = { x: x + w + dx, y: y + dy };
            const bBR = { x: x + w + dx, y: y + h + dy };
            const bBL = { x: x + dx, y: y + h + dy };

            // Lid thickness
            const lidThickness = Math.max(6, depth * 0.15);

            // Helper to generate lid geometry given hinge and free edges
            const generateLid = (
                hingeL: { x: number; y: number },
                hingeR: { x: number; y: number },
                freeL: { x: number; y: number },
                _freeR: { x: number; y: number }, // Reserved for non-rectangular lids
                openRatio: number
            ): ShapeGeometry[] => {
                // Direction from hinge to free edge
                const lidDx = freeL.x - hingeL.x;
                const lidDy = freeL.y - hingeL.y;
                const lidDepth = Math.sqrt(lidDx * lidDx + lidDy * lidDy) || 1;
                const dirX = lidDx / lidDepth;
                const dirY = lidDy / lidDepth;

                const lidAngleRad = openRatio * (Math.PI * 0.65);
                const cosA = Math.cos(lidAngleRad);
                const sinA = Math.sin(lidAngleRad);

                // Rotated free edge offset from hinge
                const freeOffsetX = dirX * lidDepth * cosA;
                const freeOffsetY = dirY * lidDepth * cosA - lidDepth * sinA;

                // Lid vertices (top surface)
                const lidHingeTL = { x: hingeL.x, y: hingeL.y };
                const lidHingeTR = { x: hingeR.x, y: hingeR.y };
                const lidFreeTL = { x: hingeL.x + freeOffsetX, y: hingeL.y + freeOffsetY };
                const lidFreeTR = { x: hingeR.x + freeOffsetX, y: hingeR.y + freeOffsetY };

                // Thickness offset (perpendicular to lid surface)
                const thickX = -dirX * lidThickness * sinA;
                const thickY = -dirY * lidThickness * sinA - lidThickness * cosA;

                const lidHingeBL = { x: lidHingeTL.x + thickX, y: lidHingeTL.y + thickY };
                const lidHingeBR = { x: lidHingeTR.x + thickX, y: lidHingeTR.y + thickY };
                const lidFreeBL = { x: lidFreeTL.x + thickX, y: lidFreeTL.y + thickY };
                const lidFreeBR = { x: lidFreeTR.x + thickX, y: lidFreeTR.y + thickY };

                // Build faces in proper back-to-front order for painter's algorithm.
                // The lid rotates around the hinge axis, so:
                // - Bottom face (underside) is always "behind" the top face in 3D
                // - It should be rendered first to be properly occluded by faces in front
                //
                // Face ordering from back to front:
                // 1. Bottom (underside) - furthest back, rendered first
                // 2. Hinge edge (if visible) - at the back
                // 3. Left/Right sides - middle layer
                // 4. Free edge - front-facing when lid is open
                // 5. Top face - closest to viewer, rendered last

                const faces: ShapeGeometry[] = [];

                // 1. Bottom face (underside) - always render first
                const bottomPoints = [lidHingeBL, lidHingeBR, lidFreeBR, lidFreeBL];
                faces.push({ type: 'points', points: bottomPoints, shade: 0.55, noStroke: true, isLid: true, isBackface: isPolygonBackfacing(bottomPoints) });

                // 2. Hinge edge (if enabled) - rendered early as it's at the back
                // noStroke on thickness faces - only top face perimeter gets stroked
                if (showLidHinge) {
                    const hingePoints = [lidHingeTL, lidHingeTR, lidHingeBR, lidHingeBL];
                    faces.push({ type: 'points', points: hingePoints, shade: 0.7, noStroke: true, isLid: true, isBackface: isPolygonBackfacing(hingePoints) });
                }

                // 3. Side faces - determine which side is further based on view angle and lid position
                // Use centroid Y to determine order (higher Y = further back in this projection)
                // noStroke on thickness faces to avoid internal edge lines
                const leftCentroidY = (lidHingeTL.y + lidFreeTL.y + lidFreeBL.y + lidHingeBL.y) / 4;
                const rightCentroidY = (lidFreeTR.y + lidHingeTR.y + lidHingeBR.y + lidFreeBR.y) / 4;

                const leftSidePoints = [lidHingeTL, lidFreeTL, lidFreeBL, lidHingeBL];
                const rightSidePoints = [lidFreeTR, lidHingeTR, lidHingeBR, lidFreeBR];
                const leftSideFace: ShapeGeometry = { type: 'points', points: leftSidePoints, shade: 0.9, noStroke: true, isLid: true, isBackface: isPolygonBackfacing(leftSidePoints) };
                const rightSideFace: ShapeGeometry = { type: 'points', points: rightSidePoints, shade: 0.8, noStroke: true, isLid: true, isBackface: isPolygonBackfacing(rightSidePoints) };

                if (leftCentroidY > rightCentroidY) {
                    faces.push(leftSideFace, rightSideFace);
                } else {
                    faces.push(rightSideFace, leftSideFace);
                }

                // 4. Free edge - visible when lid is open, noStroke (thickness face)
                const freeEdgePoints = [lidFreeTL, lidFreeTR, lidFreeBR, lidFreeBL];
                faces.push({ type: 'points', points: freeEdgePoints, shade: 0.95, noStroke: true, isLid: true, isBackface: isPolygonBackfacing(freeEdgePoints) });

                // 5. Top/Bottom face - determine which is facing the viewer
                // Use the actual face normal (via signed area) to determine visibility
                // If the top face polygon is back-facing in screen space, we're seeing the underside
                const topPoints = [lidHingeTL, lidHingeTR, lidFreeTR, lidFreeTL];

                // Use isPolygonBackfacing to determine if we're looking at the back of the top face
                // When the top face is back-facing, we're actually seeing the underside
                const topFaceIsBackfacing = isPolygonBackfacing(topPoints);
                const showUnderside = openRatio > 0.1 && topFaceIsBackfacing;

                if (showUnderside) {
                    // We see the underside - remove the noStroke bottom, add top behind, bottom in front with stroke
                    faces.shift(); // Remove the noStroke bottom we added at start
                    faces.push({ type: 'points', points: topPoints, shade: 0.55, noStroke: true, isLid: true, isBackface: true });
                    faces.push({ type: 'points', points: bottomPoints, shade: 1.1, isLid: true, isBackface: false });
                } else {
                    // Normal case - we see the top, stroke it
                    faces.push({ type: 'points', points: topPoints, shade: 1.1, isLid: true, isBackface: false });
                }

                return faces;
            };

            // Helper to get midpoint
            const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
                x: (a.x + b.x) / 2,
                y: (a.y + b.y) / 2
            });

            // Define hinge and free edges based on lid position
            type LidConfig = {
                hingeL: { x: number; y: number };
                hingeR: { x: number; y: number };
                freeL: { x: number; y: number };
                freeR: { x: number; y: number };
            };

            const getLidConfigs = (): LidConfig[] => {
                if (lidStyle === 'single') {
                    switch (lidPosition) {
                        case 'front':
                            return [{ hingeL: fTL, hingeR: fTR, freeL: bTL, freeR: bTR }];
                        case 'left':
                            return [{ hingeL: bTL, hingeR: fTL, freeL: bTR, freeR: fTR }];
                        case 'right':
                            return [{ hingeL: fTR, hingeR: bTR, freeL: fTL, freeR: bTL }];
                        case 'back':
                        default:
                            return [{ hingeL: bTL, hingeR: bTR, freeL: fTL, freeR: fTR }];
                    }
                } else if (lidStyle === 'split') {
                    // Split: two half-lids opening from center
                    const frontMid = midpoint(fTL, fTR);
                    const backMid = midpoint(bTL, bTR);
                    const leftMid = midpoint(fTL, bTL);
                    const rightMid = midpoint(fTR, bTR);

                    switch (lidPosition) {
                        case 'front':
                        case 'back':
                            // Split left-right, both open outward
                            return [
                                { hingeL: backMid, hingeR: frontMid, freeL: bTL, freeR: fTL }, // Left half
                                { hingeL: frontMid, hingeR: backMid, freeL: fTR, freeR: bTR }  // Right half
                            ];
                        case 'left':
                        case 'right':
                            // Split front-back, both open outward
                            return [
                                { hingeL: leftMid, hingeR: rightMid, freeL: fTL, freeR: fTR }, // Front half
                                { hingeL: rightMid, hingeR: leftMid, freeL: bTR, freeR: bTL }  // Back half
                            ];
                        default:
                            return [{ hingeL: bTL, hingeR: bTR, freeL: fTL, freeR: fTR }];
                    }
                } else if (lidStyle === 'double') {
                    // Double: two lids on opposite sides
                    switch (lidPosition) {
                        case 'front':
                        case 'back':
                            // Front and back lids
                            return [
                                { hingeL: bTL, hingeR: bTR, freeL: fTL, freeR: fTR }, // Back lid
                                { hingeL: fTL, hingeR: fTR, freeL: bTL, freeR: bTR }  // Front lid
                            ];
                        case 'left':
                        case 'right':
                            // Left and right lids
                            return [
                                { hingeL: bTL, hingeR: fTL, freeL: bTR, freeR: fTR }, // Left lid
                                { hingeL: fTR, hingeR: bTR, freeL: fTL, freeR: bTL }  // Right lid
                            ];
                        default:
                            return [{ hingeL: bTL, hingeR: bTR, freeL: fTL, freeR: fTR }];
                    }
                } else if (lidStyle === 'quad') {
                    // Quad: four flaps - arrangement depends on lidPosition
                    const frontMid = midpoint(fTL, fTR);
                    const backMid = midpoint(bTL, bTR);
                    const leftMid = midpoint(fTL, bTL);
                    const rightMid = midpoint(fTR, bTR);
                    const center = midpoint(frontMid, backMid);

                    switch (lidPosition) {
                        case 'front':
                        case 'back':
                            // 4 strips: 2 on front edge + 2 on back edge (each half-width)
                            return [
                                { hingeL: fTL, hingeR: frontMid, freeL: leftMid, freeR: center },     // Front-Left strip
                                { hingeL: frontMid, hingeR: fTR, freeL: center, freeR: rightMid },    // Front-Right strip
                                { hingeL: backMid, hingeR: bTL, freeL: center, freeR: leftMid },      // Back-Left strip
                                { hingeL: bTR, hingeR: backMid, freeL: rightMid, freeR: center }      // Back-Right strip
                            ];
                        case 'left':
                        case 'right':
                            // 4 strips: 2 on left edge + 2 on right edge (each half-depth)
                            return [
                                { hingeL: fTL, hingeR: leftMid, freeL: frontMid, freeR: center },     // Left-Front strip
                                { hingeL: leftMid, hingeR: bTL, freeL: center, freeR: backMid },      // Left-Back strip
                                { hingeL: bTR, hingeR: rightMid, freeL: backMid, freeR: center },     // Right-Back strip
                                { hingeL: rightMid, hingeR: fTR, freeL: center, freeR: frontMid }     // Right-Front strip
                            ];
                        default:
                            // Default: 4 corner flaps (original behavior)
                            return [
                                { hingeL: fTL, hingeR: frontMid, freeL: leftMid, freeR: center },
                                { hingeL: frontMid, hingeR: fTR, freeL: center, freeR: rightMid },
                                { hingeL: bTR, hingeR: backMid, freeL: rightMid, freeR: center },
                                { hingeL: backMid, hingeR: bTL, freeL: center, freeR: leftMid }
                            ];
                    }
                } else if (lidStyle === 'flaps') {
                    // Flaps: two half-lids that meet edge-to-edge at center when closed
                    const frontMid = midpoint(fTL, fTR);
                    const backMid = midpoint(bTL, bTR);
                    const leftMid = midpoint(fTL, bTL);
                    const rightMid = midpoint(fTR, bTR);

                    switch (lidPosition) {
                        case 'front':
                        case 'back':
                            // Front flap + Back flap (each covers half depth)
                            return [
                                { hingeL: fTL, hingeR: fTR, freeL: leftMid, freeR: rightMid },   // Front flap (hinges at front, covers to center)
                                { hingeL: bTR, hingeR: bTL, freeL: rightMid, freeR: leftMid }    // Back flap (hinges at back, covers to center)
                            ];
                        case 'left':
                        case 'right':
                            // Left flap + Right flap (each covers half width)
                            return [
                                { hingeL: bTL, hingeR: fTL, freeL: backMid, freeR: frontMid },   // Left flap (hinges at left, covers to center)
                                { hingeL: fTR, hingeR: bTR, freeL: frontMid, freeR: backMid }    // Right flap (hinges at right, covers to center)
                            ];
                        default:
                            return [
                                { hingeL: fTL, hingeR: fTR, freeL: leftMid, freeR: rightMid },
                                { hingeL: bTR, hingeR: bTL, freeL: rightMid, freeR: leftMid }
                            ];
                    }
                }
                return [{ hingeL: bTL, hingeR: bTR, freeL: fTL, freeR: fTR }];
            };

            const openRatio = openAmount / 100;

            // Interior of the box (visible when open)
            const wallThick = Math.max(4, Math.min(8, w * 0.04));

            // Normalize the depth direction for Y offsets
            const depthLen = Math.sqrt(dx * dx + dy * dy) || 1;
            const depthDirY = dy / depthLen;

            // Inner corners at top opening
            // Front corners move inward (toward back = positive depth direction)
            // Back corners move inward (toward front = negative depth direction)
            const innerFTL = { x: fTL.x + wallThick, y: fTL.y + wallThick * depthDirY };
            const innerFTR = { x: fTR.x - wallThick, y: fTR.y + wallThick * depthDirY };
            const innerBTL = { x: bTL.x + wallThick, y: bTL.y - wallThick * depthDirY };
            const innerBTR = { x: bTR.x - wallThick, y: bTR.y - wallThick * depthDirY };

            // Inner corners at bottom
            const innerFBL = { x: fBL.x + wallThick, y: fBL.y - wallThick };
            const innerFBR = { x: fBR.x - wallThick, y: fBR.y - wallThick };
            const innerBBL = { x: bBL.x + wallThick, y: bBL.y - wallThick };
            const innerBBR = { x: bBR.x - wallThick, y: bBR.y - wallThick };

            // Determine view direction for proper face ordering (painter's algorithm)
            // dy > 0: viewing from above (standard), dy < 0: viewing from below
            const isBottomView = dy < 0;

            // Build the shape based on openAmount
            if (openAmount > 0) {
                const lidConfigs = getLidConfigs();

                // Generate lids with position info for sorting
                type LidWithPosition = {
                    shapes: ShapeGeometry[];
                    centerX: number;  // Average X of lid - for left/right sorting
                    centerY: number;  // Average Y of lid - for front/back sorting
                };
                const lidsWithPosition: LidWithPosition[] = lidConfigs.map(config => {
                    const shapes = generateLid(config.hingeL, config.hingeR, config.freeL, config.freeR, openRatio);
                    // Calculate center of lid based on hinge and free edges
                    const centerX = (config.hingeL.x + config.hingeR.x + config.freeL.x + config.freeR.x) / 4;
                    const centerY = (config.hingeL.y + config.hingeR.y + config.freeL.y + config.freeR.y) / 4;
                    return { shapes, centerX, centerY };
                });

                // Sort lids: for top view, render back/left lids first (higher Y, lower X), front/right lids last
                // For bottom view, reverse the order
                lidsWithPosition.sort((a, b) => {
                    if (isBottomView) {
                        // Bottom view: lower Y first, then higher X first
                        return (a.centerY - b.centerY) || (b.centerX - a.centerX);
                    } else {
                        // Top view: higher Y first (back), then lower X first (left)
                        return (b.centerY - a.centerY) || (a.centerX - b.centerX);
                    }
                });

                // Separate lids into "back" (render before front face) and "front" (render after)
                // For standard top-front view:
                //   - Left-side lids (lower X) are "behind" the front face → backLids
                //   - Right-side lids (higher X) can be in front → frontLids
                //   - Back lids (higher Y) are also behind → backLids
                const boxCenterX = (fTL.x + fTR.x) / 2;
                const boxCenterY = (fTL.y + bTL.y) / 2;
                const backLids: ShapeGeometry[] = [];
                const frontLids: ShapeGeometry[] = [];
                lidsWithPosition.forEach(lid => {
                    // Determine if lid is closer to or farther from viewer using depth direction
                    // Viewer is at opposite of depth direction: (-dx, -dy)
                    // Project lid's offset from box center onto viewer direction
                    // Positive dot = lid is closer to viewer = frontLids (render after front face)
                    // Negative dot = lid is farther from viewer = backLids (render before front face)
                    const lidOffsetX = lid.centerX - boxCenterX;
                    const lidOffsetY = lid.centerY - boxCenterY;
                    const dotWithViewer = -dx * lidOffsetX - dy * lidOffsetY;

                    if (isBottomView) {
                        // Bottom view: invert the logic since we're looking from below
                        if (dotWithViewer < 0) {
                            frontLids.push(...lid.shapes);
                        } else {
                            backLids.push(...lid.shapes);
                        }
                    } else {
                        // Top view: positive dot = closer to viewer = render after front face
                        if (dotWithViewer > 0) {
                            frontLids.push(...lid.shapes);
                        } else {
                            backLids.push(...lid.shapes);
                        }
                    }
                });

                // Define faces with backface detection
                const backFacePoints = [bTL, bTR, bBR, bBL];
                const frontFacePoints = [fTL, fTR, fBR, fBL];
                const bottomFacePoints = [fBR, fBL, bBL, bBR];
                const rightFacePoints = [fTR, fBR, bBR, bTR];
                const leftFacePoints = [fBL, fTL, bTL, bBL];

                const backFace: ShapeGeometry = { type: 'points', points: backFacePoints, shade: 0.6, isBackface: isPolygonBackfacing(backFacePoints) };
                const frontFace: ShapeGeometry = { type: 'points', points: frontFacePoints, shade: 1.0, isBackface: isPolygonBackfacing(frontFacePoints) };
                const bottomFace: ShapeGeometry = { type: 'points', points: bottomFacePoints, shade: 0.7, isBackface: isPolygonBackfacing(bottomFacePoints) };
                const rightFace: ShapeGeometry = { type: 'points', points: rightFacePoints, shade: 0.8, isBackface: isPolygonBackfacing(rightFacePoints) };
                const leftFace: ShapeGeometry = { type: 'points', points: leftFacePoints, shade: 0.9, isBackface: isPolygonBackfacing(leftFacePoints) };

                // Inner walls (noStroke, but still calculate backface for consistency)
                const innerBackPoints = [innerBTL, innerBTR, innerBBR, innerBBL];
                const innerBottomPoints = [innerBBL, innerBBR, innerFBR, innerFBL];
                const innerLeftPoints = [innerFTL, innerBTL, innerBBL, innerFBL];
                const innerRightPoints = [innerBTR, innerFTR, innerFBR, innerBBR];
                const innerFrontPoints = [innerFTR, innerFTL, innerFBL, innerFBR];

                const innerBack: ShapeGeometry = { type: 'points', points: innerBackPoints, shade: 0.45, noStroke: true, isBackface: isPolygonBackfacing(innerBackPoints) };
                const innerBottom: ShapeGeometry = { type: 'points', points: innerBottomPoints, shade: 0.5, noStroke: true, isBackface: isPolygonBackfacing(innerBottomPoints) };
                const innerLeft: ShapeGeometry = { type: 'points', points: innerLeftPoints, shade: 0.55, noStroke: true, isBackface: isPolygonBackfacing(innerLeftPoints) };
                const innerRight: ShapeGeometry = { type: 'points', points: innerRightPoints, shade: 0.6, noStroke: true, isBackface: isPolygonBackfacing(innerRightPoints) };
                const innerFront: ShapeGeometry = { type: 'points', points: innerFrontPoints, shade: 0.65, noStroke: true, isBackface: isPolygonBackfacing(innerFrontPoints) };

                // Order faces based on view direction (back-to-front for painter's algorithm)
                // Split into "back box faces" and "closest box face" so we can insert back lids between them
                let backBoxFaces: ShapeGeometry[];
                let closestBoxFace: ShapeGeometry;
                if (isBottomView) {
                    // Bottom view: looking up from below
                    // bottomFace is closest (render last after back lids)
                    backBoxFaces = [
                        frontFace,           // Furthest from below
                        innerFront, innerLeft, innerRight, innerBack,
                        innerBottom,
                        leftFace, rightFace,
                        backFace,
                    ];
                    closestBoxFace = bottomFace;
                } else {
                    // Top view (standard): looking down from above
                    // frontFace is closest (render last after back lids)
                    backBoxFaces = [
                        backFace,            // Furthest from above
                        innerBack, innerLeft, innerRight, innerFront,
                        innerBottom,
                        leftFace, rightFace,
                    ];
                    closestBoxFace = frontFace;
                }

                // Define rim faces with backface detection
                const frontRimPoints = [fTL, fTR, innerFTR, innerFTL];
                const rightRimPoints = [fTR, bTR, innerBTR, innerFTR];
                const leftRimPoints = [bTL, fTL, innerFTL, innerBTL];
                const backRimPoints = [bTR, bTL, innerBTL, innerBTR];

                const frontRim: ShapeGeometry = { type: 'points', points: frontRimPoints, shade: 1.05, isBackface: isPolygonBackfacing(frontRimPoints),
                    noStroke: lidStyle === 'quad' || lidStyle === 'double' || (lidStyle === 'flaps' && (lidPosition === 'front' || lidPosition === 'back')) || (!(lidStyle === 'single' && lidPosition === 'back') && !(lidStyle === 'split' && (lidPosition === 'left' || lidPosition === 'right'))) };
                const rightRim: ShapeGeometry = { type: 'points', points: rightRimPoints, shade: 0.98, isBackface: isPolygonBackfacing(rightRimPoints),
                    noStroke: lidStyle === 'quad' || lidStyle === 'double' || (lidStyle === 'flaps' && (lidPosition === 'left' || lidPosition === 'right')) || (!(lidStyle === 'single' && lidPosition === 'left') && !(lidStyle === 'split' && (lidPosition === 'front' || lidPosition === 'back'))) };
                const leftRim: ShapeGeometry = { type: 'points', points: leftRimPoints, shade: 1.0, isBackface: isPolygonBackfacing(leftRimPoints),
                    noStroke: lidStyle === 'quad' || lidStyle === 'double' || (lidStyle === 'flaps' && (lidPosition === 'left' || lidPosition === 'right')) || (!(lidStyle === 'single' && lidPosition === 'right') && !(lidStyle === 'split' && (lidPosition === 'front' || lidPosition === 'back'))) };
                const backRim: ShapeGeometry = { type: 'points', points: backRimPoints, shade: 0.95, isBackface: isPolygonBackfacing(backRimPoints),
                    noStroke: lidStyle === 'quad' || lidStyle === 'double' || (lidStyle === 'flaps' && (lidPosition === 'front' || lidPosition === 'back')) || (!(lidStyle === 'single' && lidPosition === 'front') && !(lidStyle === 'split' && (lidPosition === 'left' || lidPosition === 'right'))) };

                return {
                    type: 'multi', shapes: [
                        // === BOX BODY (back faces) ===
                        ...backBoxFaces,

                        // === BACK LIDS (lids extending toward back/left - render BEFORE closest box face) ===
                        ...backLids,

                        // === CLOSEST BOX FACE (front face for top view, bottom for bottom view) ===
                        closestBoxFace,

                        // === TOP RIM (horizontal surfaces at top of walls) ===
                        backRim, leftRim, rightRim, frontRim,

                        // === FRONT LIDS (lids extending toward front/right - render last) ===
                        ...frontLids
                    ]
                };
            }

            // Box is closed - determine which faces are lids based on style
            const closedLidFaces: ShapeGeometry[] = [];
            if (lidStyle === 'single' || lidStyle === 'split' || lidStyle === 'quad' || lidStyle === 'flaps') {
                // Single, split, quad, or flaps: top face is the lid
                closedLidFaces.push({ type: 'points', points: [fTL, fTR, bTR, bTL], shade: 1.1, isLid: true });
            } else if (lidStyle === 'double') {
                // Double: top face is lid
                closedLidFaces.push({ type: 'points', points: [fTL, fTR, bTR, bTL], shade: 1.1, isLid: true });
            }

            // Order faces based on view direction (painter's algorithm)
            if (isBottomView) {
                // Bottom view: front is far, back is close; bottom face rendered last
                return {
                    type: 'multi', shapes: [
                        { type: 'points', points: [fTL, fTR, fBR, fBL], shade: 1.0 },  // Front (furthest from below)
                        ...closedLidFaces,
                        { type: 'points', points: [fBL, fTL, bTL, bBL], shade: 0.9 },  // Left
                        { type: 'points', points: [fTR, fBR, bBR, bTR], shade: 0.8 },  // Right
                        { type: 'points', points: [bTL, bTR, bBR, bBL], shade: 0.6 },  // Back
                        { type: 'points', points: [fBR, fBL, bBL, bBR], shade: 0.7 },  // Bottom (closest from below - render last)
                    ]
                };
            }

            // Top view (standard): back is far, front is close
            return {
                type: 'multi', shapes: [
                    { type: 'points', points: [bTL, bTR, bBR, bBL], shade: 0.6 },  // Back (furthest)
                    ...closedLidFaces,
                    { type: 'points', points: [fBR, fBL, bBL, bBR], shade: 0.7 },  // Bottom
                    { type: 'points', points: [fTR, fBR, bBR, bTR], shade: 0.8 },  // Right
                    { type: 'points', points: [fBL, fTL, bTL, bBL], shade: 0.9 },  // Left
                    { type: 'points', points: [fTL, fTR, fBR, fBL], shade: 1.0 }   // Front (closest - render last)
                ]
            };
        }

        case 'cylinder': {
            const depthBase = el.depth !== undefined ? el.depth : 50;
            const angleDeg = el.viewAngle !== undefined ? el.viewAngle : 45;
            const angleRad = (angleDeg * Math.PI) / 180;

            const rx = w / 2;
            const ry = h / 2;

            // Scale depth with shape size (must match selection-renderer.ts and handle-detection.ts)
            const minDim = Math.min(Math.abs(w), Math.abs(h));
            const depth = minDim > 0 ? Math.min(depthBase, minDim * 0.5) : 0;

            const dx = depth * Math.cos(angleRad);
            const dy = depth * Math.sin(angleRad);

            // Front Ellipse (at center 0,0)
            // Back Ellipse (at offset dx, dy)
            const fCx = 0, fCy = 0;
            const bCx = dx, bCy = dy;

            // Simplified Cylinder rendering:
            // 1. Back Ellipse
            // 2. Side Body (using two tangent lines)
            // 3. Front Ellipse

            // To find tangents correctly for arbitrary extrusion angle:
            // The tangent points on an axis-aligned ellipse for a vector (dx, dy) are
            // where the gradient is perpendicular to the tangent. 
            // For x²/a² + y²/b² = 1, the tangent at (x0, y0) has slope -b²x0 / a²y0.
            // But we actually just need the extreme points relative to the extrusion vector.
            // A simpler way: use the angle of the extrusion vector +/- 90 degrees.
            const tangentAngle = Math.atan2(dy * rx * rx, dx * ry * ry) + Math.PI / 2;
            const tx = rx * Math.cos(tangentAngle);
            const ty = ry * Math.sin(tangentAngle);

            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: bCx, cy: bCy, rx: rx, ry: ry, shade: 0.6 }, // Back Face
                    {
                        type: 'points',
                        points: [
                            { x: fCx + tx, y: fCy + ty },
                            { x: bCx + tx, y: bCy + ty },
                            { x: bCx - tx, y: bCy - ty },
                            { x: fCx - tx, y: fCy - ty }
                        ],
                        shade: 0.8 // Side Body
                    },
                    { type: 'ellipse', cx: fCx, cy: fCy, rx: rx, ry: ry, shade: 1.0 } // Front Face
                ]
            };
        }

        case 'stateStart': {
            return { type: 'ellipse', cx: 0, cy: 0, rx: w / 2, ry: h / 2 };
        }

        case 'stateEnd': {
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: 0, rx: w / 2, ry: h / 2 },
                    { type: 'ellipse', cx: 0, cy: 0, rx: w / 3, ry: h / 3 }
                ]
            };
        }

        case 'stateSync': {
            return { type: 'rect', x: x, y: y, w: w, h: h, r: 2 };
        }

        case 'activationBar': {
            return { type: 'rect', x: x, y: y, w: w, h: h, r: 0 };
        }

        case 'externalEntity': {
            const shadowOffset = 4;
            return {
                type: 'multi', shapes: [
                    { type: 'rect', x: x + shadowOffset, y: y + shadowOffset, w: w, h: h, r: 0 }, // Shadow
                    { type: 'rect', x: x, y: y, w: w, h: h, r: 0 } // Main box
                ]
            };
        }

        // ─── Sketchnote shapes ───────────────────────────────────────

        case 'trophy': {
            const cupW = w * 0.6;
            const stemW = w * 0.1;
            const bW = w * 0.5;
            return {
                type: 'multi', shapes: [
                    { type: 'rect', x: -cupW / 2, y: y, w: cupW, h: h * 0.55 },
                    { type: 'rect', x: -stemW / 2, y: y + h * 0.55, w: stemW, h: h * 0.25 },
                    { type: 'rect', x: -bW / 2, y: y + h * 0.8, w: bW, h: h * 0.2 }
                ]
            };
        }

        case 'clock':
        case 'target': {
            const r = Math.min(w, h) / 2;
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        case 'gear': {
            const outerR = Math.min(w, h) / 2;
            const innerR = outerR * 0.7;
            const teeth = 8;
            const toothD = outerR - innerR;
            const pts: { x: number; y: number }[] = [];
            for (let i = 0; i < teeth; i++) {
                const a1 = (Math.PI * 2 * i) / teeth;
                const a2 = (Math.PI * 2 * (i + 0.35)) / teeth;
                const a3 = (Math.PI * 2 * (i + 0.5)) / teeth;
                const a4 = (Math.PI * 2 * (i + 0.85)) / teeth;
                pts.push(
                    { x: Math.cos(a1) * innerR, y: Math.sin(a1) * innerR },
                    { x: Math.cos(a2) * (innerR + toothD), y: Math.sin(a2) * (innerR + toothD) },
                    { x: Math.cos(a3) * (innerR + toothD), y: Math.sin(a3) * (innerR + toothD) },
                    { x: Math.cos(a4) * innerR, y: Math.sin(a4) * innerR }
                );
            }
            return { type: 'points', points: pts };
        }

        case 'rocket': {
            const bw = w * 0.5;
            const noseH = h * 0.25;
            const bodyBot = y + h * 0.75;
            const finW = w * 0.2;
            const finH = h * 0.25;
            let rp = `M 0 ${y}`;
            rp += ` C ${bw / 2} ${y + noseH * 0.5} ${bw / 2} ${y + noseH} ${bw / 2} ${y + noseH}`;
            rp += ` L ${bw / 2} ${bodyBot} L ${-bw / 2} ${bodyBot} L ${-bw / 2} ${y + noseH}`;
            rp += ` C ${-bw / 2} ${y + noseH} ${-bw / 2} ${y + noseH * 0.5} 0 ${y} Z`;
            rp += ` M ${-bw / 2} ${bodyBot - finH * 0.3} L ${-bw / 2 - finW} ${bodyBot + finH * 0.5} L ${-bw / 2} ${bodyBot} Z`;
            rp += ` M ${bw / 2} ${bodyBot - finH * 0.3} L ${bw / 2 + finW} ${bodyBot + finH * 0.5} L ${bw / 2} ${bodyBot} Z`;
            return { type: 'path', path: rp };
        }

        case 'flag': {
            const poleW = Math.max(3, w * 0.04);
            const poleX = x + w * 0.15 - poleW / 2;
            const flagL = x + w * 0.15;
            const flagR = x + w;
            const flagH = h * 0.55;
            const waveDip = flagH * 0.15;
            return {
                type: 'multi', shapes: [
                    { type: 'rect', x: poleX, y: y, w: poleW, h: h },
                    {
                        type: 'path',
                        path: `M ${flagL} ${y} C ${flagL + (flagR - flagL) * 0.33} ${y - waveDip} ${flagL + (flagR - flagL) * 0.66} ${y + waveDip} ${flagR} ${y} L ${flagR} ${y + flagH} C ${flagL + (flagR - flagL) * 0.66} ${y + flagH + waveDip} ${flagL + (flagR - flagL) * 0.33} ${y + flagH - waveDip} ${flagL} ${y + flagH} Z`
                    }
                ]
            };
        }

        case 'key': {
            const bowRx = w * 0.35;
            const bowRy = h * 0.25;
            const bowCy = y + bowRy;
            const shaftW = w * 0.12;
            const shaftTop = bowCy + bowRy * 0.7;
            const shaftBot = y + h;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: bowCy, rx: bowRx, ry: bowRy },
                    { type: 'rect', x: -shaftW / 2, y: shaftTop, w: shaftW, h: shaftBot - shaftTop }
                ]
            };
        }

        case 'magnifyingGlass': {
            const lensR = Math.min(w, h) * 0.32;
            const lensCx = x + w * 0.42;
            const lensCy = y + h * 0.38;
            const handleW = Math.max(w * 0.1, 4);
            const angle = Math.PI / 4;
            const hsX = lensCx + Math.cos(angle) * lensR;
            const hsY = lensCy + Math.sin(angle) * lensR;
            const hLen = Math.min(w, h) * 0.4;
            const heX = hsX + Math.cos(angle) * hLen;
            const heY = hsY + Math.sin(angle) * hLen;
            const px = Math.cos(angle + Math.PI / 2) * handleW / 2;
            const py = Math.sin(angle + Math.PI / 2) * handleW / 2;
            let mp = `M ${lensCx - lensR} ${lensCy}`;
            mp += ` A ${lensR} ${lensR} 0 1 1 ${lensCx + lensR} ${lensCy}`;
            mp += ` A ${lensR} ${lensR} 0 1 1 ${lensCx - lensR} ${lensCy} Z`;
            mp += ` M ${hsX + px} ${hsY + py} L ${heX + px} ${heY + py}`;
            mp += ` L ${heX - px} ${heY - py} L ${hsX - px} ${hsY - py} Z`;
            return { type: 'path', path: mp };
        }

        case 'book': {
            const spine = 0;
            const bkTop = y + h * 0.05;
            const bkBot = y + h * 0.95;
            const bulge = h * 0.08;
            let bp = `M ${spine} ${bkTop}`;
            bp += ` C ${spine - w * 0.1} ${bkTop + bulge} ${x + w * 0.05} ${bkTop + bulge} ${x} ${bkTop}`;
            bp += ` L ${x} ${bkBot}`;
            bp += ` C ${x + w * 0.05} ${bkBot - bulge} ${spine - w * 0.1} ${bkBot - bulge} ${spine} ${bkBot} Z`;
            bp += ` M ${spine} ${bkTop}`;
            bp += ` C ${spine + w * 0.1} ${bkTop + bulge} ${x + w * 0.95} ${bkTop + bulge} ${x + w} ${bkTop}`;
            bp += ` L ${x + w} ${bkBot}`;
            bp += ` C ${x + w * 0.95} ${bkBot - bulge} ${spine + w * 0.1} ${bkBot - bulge} ${spine} ${bkBot} Z`;
            return { type: 'path', path: bp };
        }

        case 'megaphone': {
            const mouthL = x + w * 0.15;
            const mouthR = x + w;
            const backTopY = y + h * 0.25;
            const backBotY = y + h * 0.5;
            const mouthTopY = y;
            const mouthBotY = y + h * 0.75;
            const hW = w * 0.12;
            const hH = h * 0.25;
            const hX = mouthL - hW * 0.3;
            return {
                type: 'multi', shapes: [
                    {
                        type: 'points', points: [
                            { x: mouthL, y: backTopY },
                            { x: mouthR, y: mouthTopY },
                            { x: mouthR, y: mouthBotY },
                            { x: mouthL, y: backBotY }
                        ]
                    },
                    { type: 'rect', x: hX, y: backBotY, w: hW, h: hH }
                ]
            };
        }

        case 'eye': {
            const eRx = w / 2;
            const eRy = h / 2;
            return {
                type: 'path',
                path: `M ${x} 0 C ${x + eRx * 0.4} ${-eRy * 1.3} ${x + eRx * 1.6} ${-eRy * 1.3} ${x + w} 0 C ${x + eRx * 1.6} ${eRy * 1.3} ${x + eRx * 0.4} ${eRy * 1.3} ${x} 0 Z`
            };
        }

        case 'thoughtBubble': {
            const cloudH = h * 0.8;
            const tcy = y + cloudH / 2;
            const trx = w * 0.48;
            const trY = cloudH * 0.45;
            const bumps = 8;
            let tp = '';
            for (let i = 0; i < bumps; i++) {
                const a1 = (Math.PI * 2 * i) / bumps;
                const a2 = (Math.PI * 2 * (i + 1)) / bumps;
                const aMid = (a1 + a2) / 2;
                const bx1 = Math.cos(a1) * trx;
                const by1 = tcy + Math.sin(a1) * trY;
                const cpx = Math.cos(aMid) * trx * 1.25;
                const cpy = tcy + Math.sin(aMid) * trY * 1.25;
                const bx2 = Math.cos(a2) * trx;
                const by2 = tcy + Math.sin(a2) * trY;
                if (i === 0) tp = `M ${bx1} ${by1}`;
                tp += ` Q ${cpx} ${cpy} ${bx2} ${by2}`;
            }
            tp += ' Z';
            return { type: 'path', path: tp };
        }

        // ─── People & Expressions shapes ─────────────────────────────

        case 'stickFigure': {
            const headR = Math.min(w, h) * 0.12;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: y + headR, rx: headR, ry: headR },
                    { type: 'points', points: [
                        { x: x + w * 0.15, y: y + headR * 2 },
                        { x: x + w * 0.85, y: y + headR * 2 },
                        { x: x + w * 0.8, y: y + h },
                        { x: x + w * 0.2, y: y + h }
                    ]}
                ]
            };
        }

        case 'sittingPerson': {
            const headR = Math.min(w, h) * 0.11;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: y + headR, rx: headR, ry: headR },
                    { type: 'points', points: [
                        { x: x + w * 0.2, y: y + headR * 2 },
                        { x: x + w * 0.8, y: y + headR * 2 },
                        { x: x + w * 0.8, y: y + h },
                        { x: 0, y: y + h * 0.55 }
                    ]}
                ]
            };
        }

        case 'presentingPerson': {
            const headR = Math.min(w, h) * 0.1;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: x + w * 0.3, cy: y + headR, rx: headR, ry: headR },
                    { type: 'rect', x: x + w * 0.55, y: y, w: w * 0.45, h: h * 0.5 }
                ]
            };
        }

        case 'handPointRight': {
            const wristL = x;
            const wristR = x + w * 0.35;
            const wristT = y + h * 0.15;
            const wristB = y + h * 0.55;
            const fingerTip = x + w;
            const fingerT = y + h * 0.08;
            const fingerB = y + h * 0.32;
            const fingerR = Math.min(w, h) * 0.06;
            const thumbTipX = x + w * 0.2;
            const thumbTipY = y;
            const curlTop = wristB;
            const curlBot = y + h;
            const curlL = x + w * 0.08;
            const curlR = wristR + w * 0.05;
            const curlMid1 = curlTop + (curlBot - curlTop) * 0.33;
            const curlMid2 = curlTop + (curlBot - curlTop) * 0.66;
            let hp = `M ${wristL} ${wristT}`;
            hp += ` Q ${thumbTipX - w * 0.05} ${thumbTipY + h * 0.02} ${thumbTipX} ${thumbTipY}`;
            hp += ` Q ${thumbTipX + w * 0.08} ${thumbTipY} ${wristR - w * 0.05} ${fingerT + h * 0.02}`;
            hp += ` L ${wristR} ${fingerT} L ${fingerTip - fingerR} ${fingerT}`;
            hp += ` Q ${fingerTip} ${fingerT} ${fingerTip} ${(fingerT + fingerB) / 2}`;
            hp += ` Q ${fingerTip} ${fingerB} ${fingerTip - fingerR} ${fingerB}`;
            hp += ` L ${wristR} ${fingerB} L ${curlR} ${curlTop}`;
            hp += ` Q ${curlR + w * 0.1} ${curlTop + (curlMid1 - curlTop) * 0.5} ${curlR} ${curlMid1}`;
            hp += ` Q ${curlR + w * 0.1} ${curlMid1 + (curlMid2 - curlMid1) * 0.5} ${curlR} ${curlMid2}`;
            hp += ` Q ${curlR + w * 0.08} ${curlMid2 + (curlBot - curlMid2) * 0.5} ${curlR - w * 0.05} ${curlBot}`;
            hp += ` L ${curlL} ${curlBot}`;
            hp += ` Q ${wristL - w * 0.02} ${curlBot} ${wristL} ${wristB} Z`;
            return { type: 'path', path: hp };
        }

        case 'thumbsUp': {
            const fistL = x + w * 0.1;
            const fistR = x + w * 0.9;
            const fistT = y + h * 0.42;
            const fistB = y + h;
            const fistRd = Math.min(w, h) * 0.06;
            const thumbL = x + w * 0.28;
            const thumbR = x + w * 0.52;
            const thumbTop = y;
            const thumbRd = (thumbR - thumbL) / 2;
            let tup = `M ${thumbL} ${fistT}`;
            tup += ` L ${thumbL} ${thumbTop + thumbRd}`;
            tup += ` Q ${thumbL} ${thumbTop} ${(thumbL + thumbR) / 2} ${thumbTop}`;
            tup += ` Q ${thumbR} ${thumbTop} ${thumbR} ${thumbTop + thumbRd}`;
            tup += ` L ${thumbR} ${fistT} L ${fistR - fistRd} ${fistT}`;
            tup += ` Q ${fistR} ${fistT} ${fistR} ${fistT + fistRd}`;
            tup += ` L ${fistR} ${fistB - fistRd}`;
            tup += ` Q ${fistR} ${fistB} ${fistR - fistRd} ${fistB}`;
            tup += ` L ${fistL + fistRd} ${fistB}`;
            tup += ` Q ${fistL} ${fistB} ${fistL} ${fistB - fistRd}`;
            tup += ` L ${fistL} ${fistT + fistRd}`;
            tup += ` Q ${fistL} ${fistT} ${fistL + fistRd} ${fistT} Z`;
            return { type: 'path', path: tup };
        }

        case 'faceHappy':
        case 'faceSad':
        case 'faceConfused': {
            const r = Math.min(w, h) / 2;
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        // ─── Status & Annotation shapes ──────────────────────────────

        case 'checkbox':
        case 'checkboxChecked': {
            const r = Math.min(w, h) * 0.15;
            return { type: 'rect', x: x, y: y, w: w, h: h, r: r };
        }

        case 'numberedBadge':
        case 'questionMark':
        case 'exclamationMark': {
            const r = Math.min(w, h) / 2;
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        case 'tag': {
            const notchX = x + w * 0.08;
            return {
                type: 'points', points: [
                    { x: notchX, y: y },
                    { x: x + w, y: y },
                    { x: x + w, y: y + h },
                    { x: notchX, y: y + h },
                    { x: x, y: 0 }
                ]
            };
        }

        case 'pin': {
            const pinR = Math.min(w, h) * 0.3;
            const pinCy = y + pinR;
            const pointY = y + h;
            return {
                type: 'path',
                path: `M 0 ${pointY} C ${-pinR * 0.6} ${pinCy + pinR * 1.5} ${-pinR} ${pinCy + pinR * 0.5} ${-pinR} ${pinCy} A ${pinR} ${pinR} 0 1 1 ${pinR} ${pinCy} C ${pinR} ${pinCy + pinR * 0.5} ${pinR * 0.6} ${pinCy + pinR * 1.5} 0 ${pointY} Z`
            };
        }

        case 'stamp': {
            const outerR = Math.min(w, h) / 2;
            const stInnerR = outerR * 0.85;
            const scallops = 16;
            const pts: { x: number; y: number }[] = [];
            for (let i = 0; i < scallops * 2; i++) {
                const angle = (Math.PI * 2 * i) / (scallops * 2);
                const r = i % 2 === 0 ? outerR : stInnerR;
                pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
            }
            return { type: 'points', points: pts };
        }

        // ─── Cloud & Container Infrastructure shapes ─────────────────

        case 'kubernetes':
        case 'cdn': {
            const r = Math.min(w, h) / 2;
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        case 'container':
        case 'apiGateway': {
            const r = Math.min(w, h) * 0.06;
            return { type: 'rect', x: x, y: y, w: w, h: h, r: r };
        }

        case 'storageBlob': {
            // Cylinder
            const eH = h * 0.075;
            const bodyTop = y + eH;
            const bodyBot = y + h - eH;
            return {
                type: 'path',
                path: `M ${x} ${bodyTop} L ${x} ${bodyBot} A ${mw} ${eH} 0 0 0 ${x + w} ${bodyBot} L ${x + w} ${bodyTop} A ${mw} ${eH} 0 0 1 ${x} ${bodyTop}`
            };
        }

        case 'eventBus': {
            // Horizontal rounded pipe
            const barH = h * 0.25;
            const barY = y + (h - barH) / 2;
            const r = barH / 2;
            return { type: 'path', path: getRoundedRectPath(x, barY, w, barH, r) };
        }

        case 'microservice': {
            // Hexagon
            const pts: { x: number; y: number }[] = [];
            const rx = w / 2, ry = h / 2;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6;
                pts.push({ x: Math.cos(angle) * rx, y: Math.sin(angle) * ry });
            }
            return { type: 'points', points: pts };
        }

        case 'shield': {
            const ccx = 0;
            const topY = y;
            const midY = y + h * 0.55;
            const botY = y + h;
            return {
                type: 'path',
                path: `M ${ccx} ${topY} L ${x + w} ${topY} L ${x + w} ${midY} Q ${x + w} ${botY * 0.85 + topY * 0.15} ${ccx} ${botY} Q ${x} ${botY * 0.85 + topY * 0.15} ${x} ${midY} L ${x} ${topY} Z`
            };
        }

        // ─── Data & Metrics shapes ───────────────────────────────────

        case 'barChart':
        case 'trendUp':
        case 'trendDown':
        case 'table':
            return { type: 'rect', x: x, y: y, w: w, h: h };

        case 'pieChart': {
            const r = Math.min(w, h) / 2;
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        case 'funnel': {
            const topL = x, topR = x + w;
            const botL = x + w * 0.3, botR = x + w * 0.7;
            return {
                type: 'points', points: [
                    { x: topL, y: y },
                    { x: topR, y: y },
                    { x: botR, y: y + h },
                    { x: botL, y: y + h }
                ]
            };
        }

        case 'gauge': {
            // Semi-circle approximation — use bounding rect
            const r = Math.min(w / 2, h * 0.8);
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        // ─── Connection & Relationship shapes ─────────────────────────

        case 'puzzlePiece': {
            const tabR = w * 0.15;
            const slotR = h * 0.15;
            let pp = `M ${x} ${y}`;
            pp += ` L ${x + w * 0.35} ${y}`;
            pp += ` A ${slotR} ${slotR} 0 0 1 ${x + w * 0.65} ${y}`;
            pp += ` L ${x + w} ${y}`;
            pp += ` L ${x + w} ${y + h * 0.35}`;
            pp += ` A ${tabR} ${tabR} 0 0 1 ${x + w} ${y + h * 0.65}`;
            pp += ` L ${x + w} ${y + h}`;
            pp += ` L ${x} ${y + h} Z`;
            return { type: 'path', path: pp };
        }

        case 'chainLink': {
            const linkW = w * 0.55, linkH = h * 0.4;
            const linkR = linkH / 2;
            return {
                type: 'multi', shapes: [
                    { type: 'path', path: getRoundedRectPath(x, y + h * 0.1, linkW, linkH, linkR) },
                    { type: 'path', path: getRoundedRectPath(x + w - linkW, y + h * 0.5, linkW, linkH, linkR) }
                ]
            };
        }

        case 'bridge': {
            const archY = y + h * 0.4;
            return {
                type: 'path',
                path: `M ${x} ${archY} Q ${0} ${y} ${x + w} ${archY} L ${x + w} ${y + h} L ${x} ${y + h} Z`
            };
        }

        case 'magnet': {
            const armW = w * 0.28;
            const armH = h - h * 0.35;
            const innerR = (w - armW * 2) / 2;
            const outerR = w / 2;
            let mp = `M ${x} ${y}`;
            mp += ` L ${x} ${y + armH}`;
            mp += ` A ${outerR} ${outerR} 0 0 0 ${x + w} ${y + armH}`;
            mp += ` L ${x + w} ${y}`;
            mp += ` L ${x + w - armW} ${y}`;
            mp += ` L ${x + w - armW} ${y + armH}`;
            mp += ` A ${innerR} ${innerR} 0 0 1 ${x + armW} ${y + armH}`;
            mp += ` L ${x + armW} ${y} Z`;
            return { type: 'path', path: mp };
        }

        case 'scale': {
            const baseW = w * 0.3, baseH = h * 0.08;
            const beamY = y + h * 0.15;
            return {
                type: 'multi', shapes: [
                    { type: 'rect', x: x + w * 0.04, y: beamY, w: w * 0.92, h: h * 0.03 },
                    { type: 'rect', x: -w * 0.02, y: beamY, w: w * 0.04, h: h * 0.77 },
                    { type: 'rect', x: -baseW / 2, y: y + h - baseH, w: baseW, h: baseH }
                ]
            };
        }

        case 'seedling': {
            const stemBot = y + h * 0.75;
            const stemTop = y + h * 0.25;
            const leafW = w * 0.3;
            const leafH = h * 0.25;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: -leafW * 0.35, cy: stemTop, rx: leafW * 0.5, ry: leafH * 0.4 },
                    { type: 'ellipse', cx: leafW * 0.2, cy: stemTop - leafH * 0.4, rx: leafW * 0.4, ry: leafH * 0.45 },
                    { type: 'ellipse', cx: 0, cy: stemBot, rx: w * 0.25, ry: h * 0.08 }
                ]
            };
        }

        case 'tree': {
            const canopyR = Math.min(w, h * 0.55) * 0.48;
            const canopyCy = y + h * 0.38;
            const trunkTop = canopyCy + canopyR * 0.5;
            const trunkW = w * 0.18;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: canopyCy, rx: canopyR, ry: canopyR },
                    { type: 'rect', x: -trunkW / 2, y: trunkTop, w: trunkW, h: y + h - trunkTop }
                ]
            };
        }

        case 'mountain': {
            const peakX = -w * 0.05;
            return { type: 'points', points: [{ x: peakX, y: y }, { x: x + w, y: y + h }, { x: x, y: y + h }] };
        }

        // ── BPMN Events ──
        case 'bpmnStartEvent':
        case 'bpmnEndEvent': {
            const r = Math.min(w, h) / 2;
            return { type: 'ellipse', cx: 0, cy: 0, rx: r, ry: r };
        }

        case 'bpmnIntermediateEvent': {
            const outerR = Math.min(w, h) / 2;
            const innerR = outerR * 0.82;
            return {
                type: 'multi', shapes: [
                    { type: 'ellipse', cx: 0, cy: 0, rx: outerR, ry: outerR },
                    { type: 'ellipse', cx: 0, cy: 0, rx: innerR, ry: innerR }
                ]
            };
        }

        // ── BPMN Gateways ──
        case 'bpmnExclusiveGateway':
        case 'bpmnParallelGateway':
        case 'bpmnInclusiveGateway': {
            return {
                type: 'points', points: [
                    { x: 0, y: y },
                    { x: mw, y: 0 },
                    { x: 0, y: y + h },
                    { x: -mw, y: 0 }
                ]
            };
        }

        // ── BPMN Activities ──
        case 'bpmnTask':
        case 'bpmnSubProcess':
        case 'bpmnCallActivity': {
            const radius = Math.min(w, h) * 0.1;
            return { type: 'rect', x: x, y: y, w: w, h: h, r: radius };
        }

        // ── BPMN Artifacts ──
        case 'bpmnDataObject': {
            const fold = Math.min(w, h) * 0.18;
            return {
                type: 'path',
                path: `M ${x} ${y} L ${x + w - fold} ${y} L ${x + w} ${y + fold} L ${x + w} ${y + h} L ${x} ${y + h} Z`
            };
        }

        case 'bpmnAnnotation': {
            return { type: 'rect', x: x, y: y, w: w, h: h };
        }

        case 'bpmnPool': {
            return { type: 'rect', x: x, y: y, w: w, h: h };
        }

        case 'bpmnEventGateway': {
            const hw = w / 2, hh = h / 2;
            return {
                type: 'points',
                points: [
                    { x: 0, y: -hh },
                    { x: hw, y: 0 },
                    { x: 0, y: hh },
                    { x: -hw, y: 0 }
                ]
            };
        }

        case 'bpmnDataStore': {
            return { type: 'ellipse', cx: 0, cy: 0, rx: w / 2, ry: h / 2 };
        }

        case 'bpmnGroup': {
            return { type: 'rect', x: x, y: y, w: w, h: h, r: Math.min(w, h) * 0.08 };
        }
    }

    return null;
};
