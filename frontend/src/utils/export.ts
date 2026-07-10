import { store } from "../store/app-store";
import { isPagedDocType } from '../types/slide-types';
import { renderElement } from "./render-element";
import { renderSlideBackground } from "./canvas-renderer";
import rough from 'roughjs/bin/rough';
import { jsPDF } from "jspdf";
import PptxGenJS from "pptxgenjs";
import { resolveFontFamily, wrapText, getMeasurementRenderer, measureContainerText } from "./text-utils";
import { calculateUmlClassLayout, calculateUml2SectionLayout } from "./uml-layout-utils";
import type { DrawingElement } from "../types";
import { buildFilterString } from "./image-filter-utils";
import { layoutRichText } from "./rich-text-utils";
import { getShapeGeometry, type ShapeGeometry } from "./shape-geometry";
import { svgFillPaint, svgPatternDef } from "./svg-paint";
import { SvgRenderer } from "../rendering/SvgRenderer";
import { getImage } from "./image-cache";
import { rasterizeWarpedImage } from "./image-warp";
import { transformEffectRenderCopies, hasTransformEffect } from "./transform-effect";
import { hasExtrude, isExtrudeTilted, renderExtrudeBody } from "./extrude";

const SVGNS = 'http://www.w3.org/2000/svg';

interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }

/**
 * Visual world-space AABB of a single element — accounts for rotation, stroke width,
 * shadow/glow/feather, and the 3D-extrude depth. WITHOUT these the export crop box is the
 * raw x/y/w/h box, so rotated shapes, thick strokes and effects get clipped on export.
 */
function elementAABB(el: DrawingElement): Bounds {
    const cx = el.x + (el.width || 0) / 2, cy = el.y + (el.height || 0) / 2;
    const a = (el.angle || 0) * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
    const hw = Math.abs(el.width || 0) / 2, hh = Math.abs(el.height || 0) / 2;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [dx, dy] of [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]]) {
        const x = cx + dx * cos - dy * sin, y = cy + dx * sin + dy * cos;
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    // Stroke half-width + shadow/glow/feather spread padding.
    const shadow = el.shadowEnabled ? (el.shadowBlur || 0) + Math.max(Math.abs(el.shadowOffsetX || 0), Math.abs(el.shadowOffsetY || 0)) : 0;
    const pad = (el.strokeWidth || 0) / 2 + shadow + (el.glowEnabled ? (el.glowBlur || 0) : 0) + (el.featherRadius || 0);
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    // 3D extrude body extends in the depth direction.
    if (el.extrude && el.extrude.depth > 0) {
        const r = (el.extrude.angle || 0) * Math.PI / 180;
        const ex = Math.cos(r) * el.extrude.depth, ey = Math.sin(r) * el.extrude.depth;
        minX = Math.min(minX, minX + ex); maxX = Math.max(maxX, maxX + ex);
        minY = Math.min(minY, minY + ey); maxY = Math.max(maxY, maxY + ey);
    }
    return { minX, minY, maxX, maxY };
}

/** Union AABB of a set of elements, expanding for live Transform-effect copies. */
function elementsBounds(elements: DrawingElement[]): Bounds {
    let b: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const acc = (o: Bounds) => { b.minX = Math.min(b.minX, o.minX); b.minY = Math.min(b.minY, o.minY); b.maxX = Math.max(b.maxX, o.maxX); b.maxY = Math.max(b.maxY, o.maxY); };
    for (const el of elements) {
        const copies = transformEffectRenderCopies(el);
        if (copies.length) for (const c of copies) acc(elementAABB(c));
        else acc(elementAABB(el));
    }
    return b;
}

/** AABB-overlap test — true when an element visually overlaps the page rect (rotation-padded). */
function overlapsRect(el: DrawingElement, rx: number, ry: number, rw: number, rh: number): boolean {
    const b = elementAABB(el);
    return b.maxX >= rx && b.minX <= rx + rw && b.maxY >= ry && b.minY <= ry + rh;
}

/**
 * Render one element to a raster canvas INCLUDING its live effects — the 3D-extrude body and
 * Transform-effect copies. `renderElement` alone draws only the flat base shape (effects live in
 * the canvas render hook), so exports must replay that hook or effects vanish from the output.
 */
function renderElWithEffects(rc: ReturnType<typeof rough.canvas>, ctx: CanvasRenderingContext2D, el: DrawingElement): void {
    if (hasExtrude(el)) {
        renderExtrudeBody(ctx, el);
        if (isExtrudeTilted(el)) return; // the full tilted solid (incl. front) is already drawn
    }
    if (hasTransformEffect(el)) {
        for (const copy of transformEffectRenderCopies(el)) renderElement(rc, ctx, copy);
        return;
    }
    renderElement(rc, ctx, el);
}

/** Build an SVG <g> of the element's appearance-stack extras (centred frame), or null. */
function buildAppearanceSvgGroup(el: any, rc: any, options: any, defs: SVGElement): SVGGElement | null {
    const ap = el.appearance;
    if (!ap) return null;
    const fills = (ap.fills || []).filter((f: any) => f.visible !== false && f.color && f.color !== 'transparent');
    const strokes = (ap.strokes || []).filter((s: any) => s.visible !== false && s.color && s.color !== 'transparent' && s.width > 0);
    if (!fills.length && !strokes.length) return null;
    const geo = getShapeGeometry(el);
    const { ds, evenOdd } = geo ? geometryToDs(geo) : { ds: [] as string[], evenOdd: false };
    if (!ds.length) return null;
    const sketch = (el.renderStyle ?? 'sketch') === 'sketch';
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('transform', `translate(${el.x + el.width / 2}, ${el.y + el.height / 2})`);
    const dashArr = (d?: string) => d === 'dashed' ? '10 10' : d === 'dotted' ? '2 8' : undefined;
    fills.forEach((f: any, fi: number) => {
        // Architectural pattern fills export as a real tiling <pattern>; sketch (rough.js)
        // can't reference a pattern, so it approximates with the foreground colour.
        const patUrl = f.pattern && !sketch ? svgPatternDef(f.pattern, defs, `${el.id}-ap${fi}`) : null;
        const fillColor = f.pattern ? (f.pattern.color || f.color) : f.color;
        for (const d of ds) {
            if (sketch) {
                g.appendChild(rc.path(d, { ...options, fill: fillColor, fillStyle: 'solid', stroke: 'none' }));
            } else {
                const p = document.createElementNS(SVGNS, 'path');
                p.setAttribute('d', d); p.setAttribute('fill', patUrl || fillColor); p.setAttribute('stroke', 'none');
                if (evenOdd) p.setAttribute('fill-rule', 'evenodd');
                if (f.opacity != null) p.setAttribute('fill-opacity', `${f.opacity}`);
                g.appendChild(p);
            }
        }
    });
    for (const s of strokes) {
        const da = dashArr(s.dash);
        for (const d of ds) {
            if (sketch) {
                g.appendChild(rc.path(d, { ...options, stroke: s.color, strokeWidth: s.width, fill: 'none', strokeLineDash: da ? (s.dash === 'dotted' ? [2, 8] : [10, 10]) : undefined }));
            } else {
                const p = document.createElementNS(SVGNS, 'path');
                p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', s.color);
                p.setAttribute('stroke-width', `${s.width}`); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('stroke-linejoin', 'round');
                if (da) p.setAttribute('stroke-dasharray', da);
                if (s.opacity != null) p.setAttribute('stroke-opacity', `${s.opacity}`);
                g.appendChild(p);
            }
        }
    }
    return g;
}

/**
 * Build the full vector SVG for a `umlClass` / `umlInterface` element — header
 * (stereotype + name), the attribute / method compartments, and the divider lines.
 *
 * The generic export path only drew the box + `containerText` (the class name), so
 * the member compartments were silently dropped from exported SVG (the on-canvas
 * uml-class-renderer draws them via a clipped path that the geometry/containerText
 * export path never runs). This mirrors that renderer's layout — reusing
 * `calculateUmlClassLayout` / `calculateUml2SectionLayout` for identical geometry —
 * but emits plain `<text>`/`<line>` so it is crisp vector in both render styles.
 */
function buildUmlClassNode(el: DrawingElement): SVGGElement {
    const g = document.createElementNS(SVGNS, 'g') as SVGGElement;
    const mr = getMeasurementRenderer();
    const stroke = el.strokeColor || '#000';
    const strokeWidth = el.strokeWidth || 2;
    const textColor = el.textColor || el.strokeColor || '#000';
    const family = resolveFontFamily(el.fontFamily);
    const baseSize = el.fontSize || 20;
    const isInterface = el.type === 'umlInterface';

    // Outer box (fill + stroke).
    const box = document.createElementNS(SVGNS, 'rect');
    box.setAttribute('x', `${el.x}`); box.setAttribute('y', `${el.y}`);
    box.setAttribute('width', `${el.width}`); box.setAttribute('height', `${el.height}`);
    box.setAttribute('fill', el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'none');
    box.setAttribute('stroke', stroke); box.setAttribute('stroke-width', `${strokeWidth}`);
    if (el.strokeStyle === 'dashed') box.setAttribute('stroke-dasharray', '10 10');
    else if (el.strokeStyle === 'dotted') box.setAttribute('stroke-dasharray', '2 8');
    g.appendChild(box);

    const divider = (y: number) => {
        if (y >= el.y + el.height) return;
        const l = document.createElementNS(SVGNS, 'line');
        l.setAttribute('x1', `${el.x}`); l.setAttribute('y1', `${y}`);
        l.setAttribute('x2', `${el.x + el.width}`); l.setAttribute('y2', `${y}`);
        l.setAttribute('stroke', stroke); l.setAttribute('stroke-width', `${strokeWidth}`);
        g.appendChild(l);
    };

    const centerText = (text: string, cy: number, size: number, weight?: string, fontStyle?: string) => {
        if (!text) return;
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', `${el.x + el.width / 2}`); t.setAttribute('y', `${cy}`);
        t.setAttribute('font-size', `${size}`); t.setAttribute('font-family', family);
        if (weight) t.setAttribute('font-weight', weight);
        if (fontStyle) t.setAttribute('font-style', fontStyle);
        t.setAttribute('fill', textColor);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.textContent = text;
        g.appendChild(t);
    };

    // Member compartment: left-aligned, wrapped exactly like the on-canvas renderer.
    const memberFontSize = baseSize * 0.9;
    const memberEl = { ...el, fontSize: memberFontSize } as DrawingElement;
    const emitBand = (text: string, top: number) => {
        if (!text) return;
        const metrics = measureContainerText(mr, memberEl, text, el.width - 20);
        metrics.lines.forEach((ln: string, i: number) => {
            if (!ln) return;
            const t = document.createElementNS(SVGNS, 'text');
            t.setAttribute('x', `${el.x + 10}`);
            t.setAttribute('y', `${top + 10 + i * metrics.lineHeight}`);
            t.setAttribute('font-size', `${memberFontSize}`); t.setAttribute('font-family', family);
            t.setAttribute('fill', textColor);
            t.setAttribute('text-anchor', 'start');
            t.setAttribute('dominant-baseline', 'hanging');
            t.textContent = ln;
            g.appendChild(t);
        });
    };

    if (isInterface) {
        const layout = calculateUml2SectionLayout(mr, el, 'methodsText');
        divider(el.y + layout.headerHeight);
        centerText('«interface»', el.y + layout.headerHeight * 0.33, baseSize * 0.7, 'normal', 'italic');
        centerText(el.containerText || '', el.y + layout.headerHeight * 0.67, baseSize, 'bold');
        emitBand(el.methodsText || '', el.y + layout.headerHeight);
    } else {
        const layout = calculateUmlClassLayout(mr, el);
        centerText(el.containerText || '', el.y + layout.headerHeight / 2, baseSize, 'bold');
        divider(el.y + layout.headerHeight);
        if (layout.hasAttributes && layout.hasMethods) {
            divider(el.y + layout.headerHeight + layout.attrHeight);
        }
        emitBand(el.attributesText || '', el.y + layout.headerHeight);
        emitBand(el.methodsText || '', el.y + layout.headerHeight + layout.attrHeight);
    }

    return g;
}

/** UML arrowheads that export as a filled/hollow glyph rather than an open-V. */
const UML_ARROWHEADS = new Set(['triangle', 'diamond', 'diamondFilled']);

/**
 * Build the polygon for a UML arrowhead glyph at (tipX, tipY), oriented along
 * `ang` (the line's travel direction, tip pointing forward). Hollow triangle =
 * generalization/realization; hollow diamond = aggregation; filled diamond =
 * composition. Mirrors the on-canvas path-renderer so exported SVG matches.
 */
function umlArrowheadGlyph(
    tipX: number, tipY: number, ang: number, headLen: number,
    kind: string, stroke: string, strokeWidth: number
): SVGPolygonElement {
    const c = Math.cos(ang), s = Math.sin(ang);
    const local: number[][] = kind === 'triangle'
        ? [[0, 0], [-headLen * Math.cos(Math.PI / 6), -headLen * Math.sin(Math.PI / 6)], [-headLen * Math.cos(Math.PI / 6), headLen * Math.sin(Math.PI / 6)]]
        : [[0, 0], [-headLen, -headLen / 2], [-2 * headLen, 0], [-headLen, headLen / 2]];
    const points = local
        .map(([lx, ly]) => `${(tipX + lx * c - ly * s).toFixed(2)},${(tipY + lx * s + ly * c).toFixed(2)}`)
        .join(' ');
    const poly = document.createElementNS(SVGNS, 'polygon');
    poly.setAttribute('points', points);
    poly.setAttribute('fill', kind === 'diamondFilled' ? stroke : '#ffffff');
    poly.setAttribute('stroke', stroke);
    poly.setAttribute('stroke-width', `${strokeWidth}`);
    return poly;
}

/**
 * Stroke path `d` for a curved/elbow connector, mirroring the on-canvas
 * connector-renderer so exported SVG shows the actual curve instead of a straight
 * chord. Returns null for a straight connector (caller draws a plain line). Uses the
 * same default control points as the canvas: cp offset along the dominant axis.
 */
function connectorCurvePath(el: DrawingElement): string | null {
    if (el.curveType !== 'bezier' && el.curveType !== 'elbow') return null;
    const start = { x: el.x, y: el.y };
    const end = { x: el.x + el.width, y: el.y + el.height };

    if (el.curveType === 'elbow') {
        const w = el.width, h = el.height;
        const mid = Math.abs(w) > Math.abs(h)
            ? `L ${start.x + w / 2} ${start.y} L ${start.x + w / 2} ${end.y} `
            : `L ${start.x} ${start.y + h / 2} L ${end.x} ${start.y + h / 2} `;
        return `M ${start.x} ${start.y} ${mid}L ${end.x} ${end.y}`;
    }

    const cps = el.controlPoints;
    if (cps && cps.length > 1) {
        return `M ${start.x} ${start.y} C ${cps[0].x} ${cps[0].y}, ${cps[1].x} ${cps[1].y}, ${end.x} ${end.y}`;
    }
    if (cps && cps.length === 1) {
        return `M ${start.x} ${start.y} Q ${cps[0].x} ${cps[0].y}, ${end.x} ${end.y}`;
    }
    const w = el.width, h = el.height;
    const [cp1, cp2] = Math.abs(w) > Math.abs(h)
        ? [{ x: start.x + w / 2, y: start.y }, { x: end.x - w / 2, y: end.y }]
        : [{ x: start.x, y: start.y + h / 2 }, { x: end.x, y: end.y - h / 2 }];
    return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}

/** Plain SVG <path> for a connector stroke `d`, styled from the element. */
function connectorPathEl(el: DrawingElement, d: string): SVGPathElement {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', el.strokeColor || '#000');
    p.setAttribute('stroke-width', `${el.strokeWidth || 2}`);
    p.setAttribute('stroke-linecap', 'round');
    if (el.strokeStyle === 'dashed') p.setAttribute('stroke-dasharray', '10 10');
    else if (el.strokeStyle === 'dotted') p.setAttribute('stroke-dasharray', '2 8');
    return p;
}

/**
 * Convert a shape's geometry (centred frame: origin at the element centre) into one or
 * more SVG path `d` strings. Used to export shapes as true vector `<path>`s instead of
 * embedded raster images. Returns `{ ds, evenOdd }` — `evenOdd` requests the even-odd
 * fill rule (compound paths / holes).
 */
function geometryToDs(geo: ShapeGeometry): { ds: string[]; evenOdd: boolean } {
    const round = (n: number) => Math.round(n * 1000) / 1000;
    const collect = (g: ShapeGeometry, out: string[]): boolean => {
        let eo = false;
        if (g.type === 'rect') {
            const { x, y, w, h, r } = g;
            if (r && r > 0) {
                const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
                out.push(`M ${round(x + rr)} ${round(y)} H ${round(x + w - rr)} A ${round(rr)} ${round(rr)} 0 0 1 ${round(x + w)} ${round(y + rr)} V ${round(y + h - rr)} A ${round(rr)} ${round(rr)} 0 0 1 ${round(x + w - rr)} ${round(y + h)} H ${round(x + rr)} A ${round(rr)} ${round(rr)} 0 0 1 ${round(x)} ${round(y + h - rr)} V ${round(y + rr)} A ${round(rr)} ${round(rr)} 0 0 1 ${round(x + rr)} ${round(y)} Z`);
            } else {
                out.push(`M ${round(x)} ${round(y)} h ${round(w)} v ${round(h)} h ${round(-w)} Z`);
            }
        } else if (g.type === 'ellipse') {
            const { cx, cy, rx, ry } = g;
            out.push(`M ${round(cx - rx)} ${round(cy)} a ${round(rx)} ${round(ry)} 0 1 0 ${round(rx * 2)} 0 a ${round(rx)} ${round(ry)} 0 1 0 ${round(-rx * 2)} 0 Z`);
        } else if (g.type === 'points') {
            const pts = g.points;
            if (pts.length >= 2) {
                let d = `M ${round(pts[0].x)} ${round(pts[0].y)}`;
                for (let i = 1; i < pts.length; i++) d += ` L ${round(pts[i].x)} ${round(pts[i].y)}`;
                if (g.isClosed !== false) d += ' Z';
                out.push(d);
            }
        } else if (g.type === 'path') {
            out.push(g.path);
            if ((g as any).evenOdd) eo = true;
        } else if (g.type === 'multi') {
            for (const s of g.shapes) eo = collect(s, out) || eo;
        }
        return eo;
    };
    const ds: string[] = [];
    const evenOdd = collect(geo, ds);
    return { ds, evenOdd };
}


/**
 * Render every page of a paged doc (design / slides) into one canvas — the
 * whole-document PNG/JPG export. Each page is drawn at its exact page bounds
 * (clipped, with its own background) and the pages are stacked vertically with
 * a gap, so the *entire* design is exported, not just the crop around elements.
 * The widest page sets the canvas width; narrower pages are centred.
 */
const PAGED_EXPORT_GAP = 40; // world-unit gap between stacked pages
function renderPagedDocToCanvas(scale: number, whiteBackground: boolean): HTMLCanvasElement | null {
    const sortedSlides = [...store.slides].sort((a, b) => a.order - b.order);
    if (sortedSlides.length === 0) return null;

    const maxW = Math.max(...sortedSlides.map(s => s.dimensions.width));
    const totalH = sortedSlides.reduce((sum, s) => sum + s.dimensions.height, 0)
        + PAGED_EXPORT_GAP * (sortedSlides.length - 1);

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(maxW * scale));
    canvas.height = Math.max(1, Math.round(totalH * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (whiteBackground) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);

    const rc = rough.canvas(canvas);
    let destY = 0;
    for (const slide of sortedSlides) {
        const { width: sW, height: sH } = slide.dimensions;
        const { x: sX, y: sY } = slide.spatialPosition;
        const destX = (maxW - sW) / 2; // centre narrower pages

        ctx.save();
        // Map this page's world rect onto its slot in the stacked output.
        ctx.translate(destX - sX, destY - sY);
        ctx.beginPath(); ctx.rect(sX, sY, sW, sH); ctx.clip();
        renderSlideBackground(ctx, rc, slide, sX, sY, sW, sH, store.theme);
        for (const el of store.elements) {
            if (el.isClipMask) continue;
            // Include any element that OVERLAPS the page (not just those centred inside it) —
            // a shape hanging over an edge or centred off-page still renders (clipped to the page).
            if (!overlapsRect(el, sX, sY, sW, sH)) continue;
            try { renderElWithEffects(rc, ctx, el); } catch { /* skip */ }
        }
        ctx.restore();
        destY += sH + PAGED_EXPORT_GAP;
    }
    return canvas;
}

export const exportToPng = async (scale: number, background: boolean, onlySelected: boolean) => {
    // Paged docs (design / slides): export every page at full page bounds with its
    // background, not just the element-bounding-box crop.
    if (isPagedDocType(store.docType) && store.slides.length > 0 && !onlySelected) {
        const canvas = renderPagedDocToCanvas(scale, background);
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = store.docType === 'design' ? 'yappy_design.png' : 'yappy_slides.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        return;
    }

    let elements = store.elements;
    if (onlySelected) {
        if (store.selection.length === 0) return; // Nothing to export
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    // Visual bounds — rotation / stroke / shadow / extrude / transform-effect aware, so nothing
    // is cropped off the export (the raw x/y/w/h box misses all of those).
    const { minX, minY, maxX, maxY } = elementsBounds(elements);

    // Padding
    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (background) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    // Render
    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElWithEffects(rc, ctx, el);
    });

    // Download
    const link = document.createElement('a');
    link.download = 'yappy_drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

/** Export an arbitrary world-space rectangle to PNG (Slice tool). Elements are clipped to it. */
export const exportRegion = (x: number, y: number, w: number, h: number, name = 'slice', scale = 2, download = true): string | undefined => {
    if (w < 1 || h < 1) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const rc = rough.canvas(canvas);
    for (const el of store.elements) {
        if (el.isClipMask) continue;
        if (el.x + el.width < x || el.x > x + w || el.y + el.height < y || el.y > y + h) continue;
        try { renderElWithEffects(rc, ctx, el); } catch { /* skip */ }
    }
    const url = canvas.toDataURL('image/png');
    if (download) { const link = document.createElement('a'); link.download = `${name}.png`; link.href = url; link.click(); }
    return url;
};

/** Export a single artboard region to PNG (elements clipped to its bounds). */
export const exportArtboard = (artboardId: string, scale = 1, download = true): string | undefined => {
    const ab = store.artboards.find(a => a.id === artboardId);
    if (!ab) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(ab.width * scale));
    canvas.height = Math.max(1, Math.round(ab.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    if (ab.background && ab.background !== 'none' && ab.background !== 'transparent') {
        ctx.fillStyle = ab.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);
    ctx.translate(-ab.x, -ab.y);
    ctx.beginPath(); ctx.rect(ab.x, ab.y, ab.width, ab.height); ctx.clip();
    const rc = rough.canvas(canvas);
    for (const el of store.elements) {
        if (el.isClipMask) continue;
        if (el.x + el.width < ab.x || el.x > ab.x + ab.width || el.y + el.height < ab.y || el.y > ab.y + ab.height) continue; // outside the artboard
        try { renderElWithEffects(rc, ctx, el); } catch { /* skip */ }
    }
    const url = canvas.toDataURL('image/png');
    if (download) { const link = document.createElement('a'); link.download = `${ab.name}.png`; link.href = url; link.click(); }
    return url;
};

/**
 * Export a single page/slide to PNG at exact page bounds (elements clipped,
 * page background rendered). Used by paged docs (slides + design documents).
 */
export const exportPageToPng = (pageIndex: number, scale = 1, download = true, format: 'png' | 'jpeg' = 'png'): string | undefined => {
    const slide = store.slides[pageIndex];
    if (!slide) return undefined;
    const { x: sX, y: sY } = slide.spatialPosition;
    const { width: sW, height: sH } = slide.dimensions;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sW * scale));
    canvas.height = Math.max(1, Math.round(sH * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    if (format === 'jpeg') {
        // JPEG has no transparency — always white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);
    ctx.translate(-sX, -sY);
    ctx.beginPath(); ctx.rect(sX, sY, sW, sH); ctx.clip();
    const rc = rough.canvas(canvas);
    renderSlideBackground(ctx, rc, slide, sX, sY, sW, sH, store.theme);
    for (const el of store.elements) {
        if (el.isClipMask) continue;
        // Overlap (not centre) test — see renderPagedDocToCanvas.
        if (!overlapsRect(el, sX, sY, sW, sH)) continue;
        try { renderElWithEffects(rc, ctx, el); } catch { /* skip */ }
    }
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const url = format === 'jpeg' ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
    if (download) {
        const link = document.createElement('a');
        link.download = `${slide.name || `page-${pageIndex + 1}`}.${ext}`;
        link.href = url;
        link.click();
    }
    return url;
};

export const exportToJpg = async (scale: number, onlySelected: boolean) => {
    // Paged docs (design / slides): export every page at full page bounds.
    if (isPagedDocType(store.docType) && store.slides.length > 0 && !onlySelected) {
        const canvas = renderPagedDocToCanvas(scale, true); // JPEG has no transparency
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = store.docType === 'design' ? 'yappy_design.jpg' : 'yappy_slides.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.click();
        return;
    }

    let elements = store.elements;
    if (onlySelected) {
        if (store.selection.length === 0) return;
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    const __eb = elementsBounds(elements);
    let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // JPEG has no transparency — always white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElWithEffects(rc, ctx, el);
    });

    const link = document.createElement('a');
    link.download = 'yappy_drawing.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
};

export const copyCanvasAsPng = async (scale: number) => {
    const elements = store.elements;
    if (elements.length === 0) return;

    const __eb = elementsBounds(elements);
    let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElWithEffects(rc, ctx, el);
    });

    canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
        } catch (_) {
            // Clipboard API may not be available in all contexts
        }
    }, 'image/png');
};

export const exportToSvg = (onlySelected: boolean) => {
    let elements = store.elements;
    if (onlySelected) {
        if (store.selection.length === 0) return;
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    // Paged docs (design / slides): include the full page area so the entire
    // design is exported, not just the element-bounding box.
    const paged = isPagedDocType(store.docType) && store.slides.length > 0 && !onlySelected;
    if (elements.length === 0 && !paged) return;

    // Calculate Bounds
    const __eb = elementsBounds(elements);
    let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;
    if (paged) {
        store.slides.forEach(s => {
            minX = Math.min(minX, s.spatialPosition.x);
            minY = Math.min(minY, s.spatialPosition.y);
            maxX = Math.max(maxX, s.spatialPosition.x + s.dimensions.width);
            maxY = Math.max(maxY, s.spatialPosition.y + s.dimensions.height);
        });
    }

    const padding = 20;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.style.backgroundColor = '#ffffff'; // Optional: white bg

    // Embed Google Fonts for accurate text rendering in standalone SVG
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const fontStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    fontStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=Handlee&family=Inter:wght@400;700&family=Source+Code+Pro:wght@400;700&family=Caveat:wght@400;700&family=Poppins:wght@400;700&family=Merriweather:wght@400;700&family=Permanent+Marker&family=JetBrains+Mono:wght@400;700&display=swap');`;
    defs.appendChild(fontStyle);
    svg.appendChild(defs);

    const rc = rough.svg(svg);

    // Group for Translation
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${-minX + padding}, ${-minY + padding})`);
    svg.appendChild(g);

    // Paged docs: draw each page's background rect beneath its elements. Solid
    // colours export exactly; gradient/texture/image backgrounds fall back to the
    // page's base colour (full vector parity for those is out of scope here).
    if (paged) {
        [...store.slides].sort((a, b) => a.order - b.order).forEach(s => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', `${s.spatialPosition.x}`);
            rect.setAttribute('y', `${s.spatialPosition.y}`);
            rect.setAttribute('width', `${s.dimensions.width}`);
            rect.setAttribute('height', `${s.dimensions.height}`);
            rect.setAttribute('fill', s.backgroundColor || (store.theme !== 'light' ? '#121212' : '#ffffff'));
            g.appendChild(rect);
        });
    }

    elements.forEach(el => {
        let node: SVGElement | null = null;
        let isCanvasFallback = false;

        // Options
        const options: any = {
            seed: el.seed,
            roughness: el.roughness,
            stroke: el.strokeColor,
            strokeWidth: el.strokeWidth,
            fill: el.backgroundColor === 'transparent' ? undefined : el.backgroundColor,
            fillStyle: el.fillStyle,
            strokeLineDash: el.strokeStyle === 'dashed' ? [10, 10] : (el.strokeStyle === 'dotted' ? [5, 10] : undefined),
        };

        // Architectural rect/circle/diamond fall through to the clean-path branch below
        // (leave node null) so they export as crisp vectors instead of rough/sketchy SVG.
        const archClean = (el.renderStyle ?? 'sketch') === 'architectural';

        if (el.type === 'umlClass' || el.type === 'umlInterface') {
            // Full UML box: header + attribute/method compartments + dividers.
            // Owns its own header-name text, so the generic containerText block
            // below is skipped for these types (see the `el.type !==` guards there).
            node = buildUmlClassNode(el);
        } else if (el.type === 'rectangle' && !archClean) {
            node = rc.rectangle(el.x, el.y, el.width, el.height, options);
        } else if (el.type === 'circle' && !archClean) {
            node = rc.ellipse(el.x + el.width / 2, el.y + el.height / 2, Math.abs(el.width), Math.abs(el.height), options);
        } else if (el.type === 'diamond' && !archClean) {
            const dcx = el.x + el.width / 2;
            const dcy = el.y + el.height / 2;
            node = rc.polygon([
                [dcx, el.y],
                [el.x + el.width, dcy],
                [dcx, el.y + el.height],
                [el.x, dcy]
            ], options);
        } else if (el.type === 'line' || el.type === 'arrow') {
            const endX = el.x + el.width;
            const endY = el.y + el.height;

            const curveD = connectorCurvePath(el);

            if (el.type === 'arrow') {
                const arrowG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                arrowG.appendChild(curveD ? connectorPathEl(el, curveD) : rc.line(el.x, el.y, endX, endY, options));

                const angle = Math.atan2(el.height, el.width);
                const startHeadLen = el.startArrowheadSize || 28;
                const endHeadLen = el.endArrowheadSize || 28;

                const headStroke = el.strokeColor || '#000';
                const headWidth = el.strokeWidth || 2;

                if (el.startArrowhead) {
                    if (UML_ARROWHEADS.has(el.startArrowhead)) {
                        arrowG.appendChild(umlArrowheadGlyph(el.x, el.y, angle + Math.PI, startHeadLen, el.startArrowhead, headStroke, headWidth));
                    } else {
                        const p1 = { x: el.x - startHeadLen * Math.cos(angle + Math.PI - Math.PI / 6), y: el.y - startHeadLen * Math.sin(angle + Math.PI - Math.PI / 6) };
                        const p2 = { x: el.x - startHeadLen * Math.cos(angle + Math.PI + Math.PI / 6), y: el.y - startHeadLen * Math.sin(angle + Math.PI + Math.PI / 6) };
                        arrowG.appendChild(rc.line(el.x, el.y, p1.x, p1.y, options));
                        arrowG.appendChild(rc.line(el.x, el.y, p2.x, p2.y, options));
                    }
                }

                if (el.endArrowhead || (!el.startArrowhead && !el.endArrowhead)) { // Default to end arrow if none specified for legacy
                    if (el.endArrowhead && UML_ARROWHEADS.has(el.endArrowhead)) {
                        arrowG.appendChild(umlArrowheadGlyph(endX, endY, angle, endHeadLen, el.endArrowhead, headStroke, headWidth));
                    } else {
                        const p1 = { x: endX - endHeadLen * Math.cos(angle - Math.PI / 6), y: endY - endHeadLen * Math.sin(angle - Math.PI / 6) };
                        const p2 = { x: endX - endHeadLen * Math.cos(angle + Math.PI / 6), y: endY - endHeadLen * Math.sin(angle + Math.PI / 6) };
                        arrowG.appendChild(rc.line(endX, endY, p1.x, p1.y, options));
                        arrowG.appendChild(rc.line(endX, endY, p2.x, p2.y, options));
                    }
                }
                node = arrowG;
            } else {
                node = curveD ? connectorPathEl(el, curveD) : rc.line(el.x, el.y, endX, endY, options);
            }
        } else if ((el.type === 'text' || el.type === 'richtext') && (el.text || (el.richText && el.richText.length > 0))) {
            const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            const fontSize = el.fontSize || 20;
            const fontFamily = resolveFontFamily(el.fontFamily);
            const textColor = el.textColor || el.strokeColor;
            const textAlign = el.textAlign || 'left';
            const padding = 4;

            // Rich text path
            if (el.richText && el.richText.length > 0) {
                const measureRenderer = getMeasurementRenderer();
                const availableWidth = Math.max(el.width - padding * 2, 20);
                const defaults = { fontSize, fontFamily: el.fontFamily || 'sans-serif' };
                const layout = layoutRichText(measureRenderer, el.richText, availableWidth, defaults);
                const verticalPadding = Math.max(0, (el.height - layout.totalHeight) / 2);

                let lineY = el.y + verticalPadding;
                for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
                    const lineHeight = layout.lineHeights[lineIdx];
                    const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);
                    let lineWidth = 0;
                    if (lineSegments.length > 0) {
                        const last = lineSegments[lineSegments.length - 1];
                        lineWidth = last.x + last.width;
                    }

                    let xOffset: number;
                    if (textAlign === 'center') xOffset = el.x + (el.width - lineWidth) / 2;
                    else if (textAlign === 'right') xOffset = el.x + el.width - padding - lineWidth;
                    else xOffset = el.x + padding;

                    const baselineY = lineY + lineHeight * 0.75;

                    // Create a <text> per line with <tspan> per segment
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.setAttribute('y', `${baselineY}`);

                    for (const seg of lineSegments) {
                        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        tspan.textContent = seg.text;
                        tspan.setAttribute('x', `${xOffset + seg.x}`);
                        tspan.setAttribute('fill', seg.span.color || textColor);
                        tspan.setAttribute('font-family', resolveFontFamily(seg.span.fontFamily || el.fontFamily));
                        tspan.setAttribute('font-size', `${seg.span.fontSize || fontSize}px`);
                        if (seg.span.bold) tspan.setAttribute('font-weight', 'bold');
                        if (seg.span.italic) tspan.setAttribute('font-style', 'italic');
                        const deco: string[] = [];
                        if (seg.span.underline) deco.push('underline');
                        if (seg.span.strikethrough) deco.push('line-through');
                        if (deco.length) tspan.setAttribute('text-decoration', deco.join(' '));
                        textEl.appendChild(tspan);
                    }
                    textGroup.appendChild(textEl);
                    lineY += lineHeight;
                }
            } else {
                // Plain text path (original)
                const fontWeight = (el.fontWeight === true || el.fontWeight === 'bold') ? 'bold' : 'normal';
                const fontStyleStr = (el.fontStyle === true || el.fontStyle === 'italic') ? 'italic' : 'normal';
                const lineHeight = fontSize * 1.2;
                const measureRenderer = getMeasurementRenderer();
                measureRenderer.font = `${fontStyleStr === 'italic' ? 'italic ' : ''}${fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
                const availableWidth = Math.max(el.width - padding * 2, 20);
                const paragraphs = el.text!.split('\n');
                const lines: string[] = [];
                paragraphs.forEach(para => {
                    if (para === '') lines.push('');
                    else lines.push(...wrapText(measureRenderer, para, availableWidth));
                });

                let textAnchor = 'start';
                let xPos = el.x + padding;
                if (textAlign === 'center') { textAnchor = 'middle'; xPos = el.x + el.width / 2; }
                else if (textAlign === 'right') { textAnchor = 'end'; xPos = el.x + el.width - padding; }

                const totalTextHeight = lines.length * lineHeight;
                const verticalPadding = Math.max(0, (el.height - totalTextHeight) / 2);

                lines.forEach((line, index) => {
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.textContent = line || '\u00A0';
                    textEl.setAttribute('x', `${xPos}`);
                    textEl.setAttribute('y', `${el.y + verticalPadding + index * lineHeight + fontSize}`);
                    textEl.setAttribute('fill', textColor);
                    textEl.setAttribute('font-family', fontFamily);
                    textEl.setAttribute('font-size', `${fontSize}px`);
                    textEl.setAttribute('font-weight', fontWeight);
                    textEl.setAttribute('font-style', fontStyleStr);
                    textEl.setAttribute('text-anchor', textAnchor);
                    textGroup.appendChild(textEl);
                });
            }
            node = textGroup;
        } else if ((el.type === 'fineliner' || el.type === 'inkbrush' || el.type === 'marker' || el.type === 'ink') && el.points) {
            // Helper to normalize
            // Detect encoding by the actual runtime type, not el.pointsEncoding —
            // finalized strokes are {x,y} objects but may carry a stale 'flat' flag.
            let points: { x: number, y: number }[] = [];
            if (el.points.length > 0 && typeof el.points[0] === 'number') {
                const flat = el.points as number[];
                for (let i = 0; i < flat.length; i += 2) points.push({ x: flat[i], y: flat[i + 1] });
            } else {
                points = el.points as { x: number, y: number }[];
            }
            if (points.length > 1) {
                // Simplified SVG Path for these tools
                // Ideally we duplicate the exact bezier logic from renderElement.ts, 
                // but for now a simple polyline or standard curve is better than nothing.
                // Or better: use roughjs linearPath or curve
                const absPoints = points.map(p => [el.x + p.x, el.y + p.y] as [number, number]);
                node = rc.curve(absPoints, options);
            }
        } else if (el.type === 'image' && el.dataURL && el.warp) {
            // Warped image: bake the mesh into a raster and embed that bitmap at the warped
            // bbox (SVG can't express a non-affine image warp directly).
            const img = getImage(el.dataURL);
            const r = img ? rasterizeWarpedImage(el, img) : null;
            if (r) {
                const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                image.setAttribute('href', r.dataURL);
                image.setAttribute('x', `${r.x}`);
                image.setAttribute('y', `${r.y}`);
                image.setAttribute('width', `${r.width}`);
                image.setAttribute('height', `${r.height}`);
                node = image;
            }
        } else if (el.type === 'image' && el.dataURL && !el.crop) {
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', el.dataURL);
            image.setAttribute('x', `${el.x}`);
            image.setAttribute('y', `${el.y}`);
            image.setAttribute('width', `${el.width}`);
            image.setAttribute('height', `${el.height}`);
            // Apply CSS filter if any image filter properties are set
            const filterStr = buildFilterString(el);
            if (filterStr !== 'none') {
                image.setAttribute('style', `filter: ${filterStr}`);
            }
            node = image;
        } else if (el.type === 'video' && (el.videoPosterDataURL || el.videoPosterURL)) {
            // Export video as poster frame image
            const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            image.setAttribute('href', el.videoPosterDataURL || el.videoPosterURL!);
            image.setAttribute('x', `${el.x}`);
            image.setAttribute('y', `${el.y}`);
            image.setAttribute('width', `${el.width}`);
            image.setAttribute('height', `${el.height}`);
            node = image;
        }

        // True vector export for shapes with clean geometry (path elements + the ~150
        // specialty shapes that previously fell back to a raster image). Emits real SVG
        // <path>s — sketch style uses rough.js (still vector), architectural uses a clean
        // path — wrapped in a <g> that places/rotates/flips the centred geometry.
        if (!node && el.type !== 'text') {
            const geo = getShapeGeometry(el);
            const { ds, evenOdd } = geo ? geometryToDs(geo) : { ds: [], evenOdd: false };
            if (ds.length > 0) {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                // Inner <g> places the centred geometry at the element centre; the outer <g>
                // (the `node`) is where the downstream finalizer applies opacity + rotate/flip
                // (around the same centre), so the two transforms compose correctly.
                const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                const inner = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                inner.setAttribute('transform', `translate(${cx}, ${cy})`);
                grp.appendChild(inner);
                // Solid colour, or a real <linearGradient>/<radialGradient>/<pattern>
                // (gradient & mesh fills) appended to <defs> → true-vector fill.
                const fill = svgFillPaint(el, defs, el.id);
                const strokeVisible = el.strokeColor && el.strokeColor !== 'transparent' && el.strokeColor !== 'none' && el.strokeWidth > 0;
                const isSketch = (el.renderStyle ?? 'sketch') === 'sketch';
                for (const d of ds) {
                    if (isSketch) {
                        // rough.js produces a vector (sketchy) <g> from the path data.
                        const rNode = rc.path(d, { ...options, fillStyle: el.fillStyle });
                        inner.appendChild(rNode);
                    } else {
                        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        pathEl.setAttribute('d', d);
                        pathEl.setAttribute('fill', fill);
                        if (evenOdd) pathEl.setAttribute('fill-rule', 'evenodd');
                        if (strokeVisible) {
                            pathEl.setAttribute('stroke', el.strokeColor);
                            pathEl.setAttribute('stroke-width', `${el.strokeWidth}`);
                            pathEl.setAttribute('stroke-linejoin', el.strokeLineJoin || 'round');
                            pathEl.setAttribute('stroke-linecap', 'round');
                            if (el.strokeStyle === 'dashed') pathEl.setAttribute('stroke-dasharray', '10 10');
                            else if (el.strokeStyle === 'dotted') pathEl.setAttribute('stroke-dasharray', '2 8');
                        } else {
                            pathEl.setAttribute('stroke', 'none');
                        }
                        inner.appendChild(pathEl);
                    }
                }
                node = grp;
            }
        }

        // Vector fallback for architectural shapes without geometry coverage
        // (data-structures, BPMN, tables): record the clean render pipeline's
        // draw calls as real SVG via SvgRenderer. Safe — discards on anything it
        // can't represent, letting the raster fallback below take over.
        if (!node && el.type !== 'text' && (el.renderStyle ?? 'sketch') === 'architectural') {
            try {
                const svgR = new SvgRenderer(defs);
                const tmpC = document.createElement('canvas');
                renderElement(rough.canvas(tmpC) as any, tmpC.getContext('2d') as any, el, false, 1, svgR as any);
                if (!svgR.failed && svgR.root.childNodes.length > 0) {
                    node = svgR.root;
                    isCanvasFallback = true; // transform/opacity baked into the emitted matrix attrs
                }
            } catch { /* fall through to raster */ }
        }

        // Canvas fallback for shape types without native SVG rendering
        // Renders the element via the canvas pipeline and embeds as a raster image
        if (!node && el.type !== 'text') {
            const absW = Math.abs(el.width);
            const absH = Math.abs(el.height);
            if (absW > 0 && absH > 0) {
                isCanvasFallback = true;
                const fbScale = 2; // 2x for crisp rendering
                let pad = Math.max(30, (el.strokeWidth || 2) * 3);
                // Extra padding for rotation (rotated shapes extend beyond original bounds)
                if (el.angle) {
                    pad += Math.ceil((Math.sqrt(absW * absW + absH * absH) - Math.min(absW, absH)) / 2);
                }
                // Extra padding for drop shadows
                if (el.shadowEnabled) {
                    pad += (el.shadowBlur || 10) + Math.max(Math.abs(el.shadowOffsetX || 0), Math.abs(el.shadowOffsetY || 0));
                }

                const minElX = Math.min(el.x, el.x + el.width);
                const minElY = Math.min(el.y, el.y + el.height);

                const fbCanvas = document.createElement('canvas');
                fbCanvas.width = (absW + pad * 2) * fbScale;
                fbCanvas.height = (absH + pad * 2) * fbScale;
                const tmpCtx = fbCanvas.getContext('2d');
                if (tmpCtx) {
                    tmpCtx.scale(fbScale, fbScale);
                    tmpCtx.translate(-minElX + pad, -minElY + pad);
                    const tmpRc = rough.canvas(fbCanvas);
                    renderElement(tmpRc, tmpCtx, el);

                    const fbImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                    fbImage.setAttribute('href', fbCanvas.toDataURL('image/png'));
                    fbImage.setAttribute('x', `${minElX - pad}`);
                    fbImage.setAttribute('y', `${minElY - pad}`);
                    fbImage.setAttribute('width', `${absW + pad * 2}`);
                    fbImage.setAttribute('height', `${absH + pad * 2}`);
                    node = fbImage;
                }
            }
        }

        // Render containerText inside shapes (rectangles, circles, etc.)
        // Skip for canvas fallback shapes — container text is already rendered by the canvas pipeline
        if (node && !isCanvasFallback && (el.containerText || (el.richContainerText && el.richContainerText.length > 0)) && el.type !== 'text' && el.type !== 'umlClass' && el.type !== 'umlInterface') {
            const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            wrapper.appendChild(node);

            const fontSize = el.fontSize || 16;
            const fontFamily = resolveFontFamily(el.fontFamily);
            const textColor = el.textColor || el.strokeColor;
            const textAlign = el.textAlign || 'center';
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            const maxWidth = el.width - 20;

            if (el.richContainerText && el.richContainerText.length > 0) {
                // Rich text path
                const measureRenderer = getMeasurementRenderer();
                const defaults = { fontSize, fontFamily: el.fontFamily || 'hand-drawn' };
                const layout = layoutRichText(measureRenderer, el.richContainerText, maxWidth, defaults);
                const startY = cy - layout.totalHeight / 2;

                let lineY = startY;
                for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
                    const lineHeight = layout.lineHeights[lineIdx];
                    const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);
                    let lineWidth = 0;
                    if (lineSegments.length > 0) {
                        const last = lineSegments[lineSegments.length - 1];
                        lineWidth = last.x + last.width;
                    }

                    let xOffset: number;
                    if (textAlign === 'left') xOffset = cx - maxWidth / 2;
                    else if (textAlign === 'right') xOffset = cx + maxWidth / 2 - lineWidth;
                    else xOffset = cx - lineWidth / 2;

                    const baselineY = lineY + lineHeight * 0.75;
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.setAttribute('y', `${baselineY}`);

                    for (const seg of lineSegments) {
                        const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                        tspan.textContent = seg.text;
                        tspan.setAttribute('x', `${xOffset + seg.x}`);
                        tspan.setAttribute('fill', seg.span.color || textColor);
                        tspan.setAttribute('font-family', resolveFontFamily(seg.span.fontFamily || el.fontFamily));
                        tspan.setAttribute('font-size', `${seg.span.fontSize || fontSize}px`);
                        if (seg.span.bold) tspan.setAttribute('font-weight', 'bold');
                        if (seg.span.italic) tspan.setAttribute('font-style', 'italic');
                        const deco: string[] = [];
                        if (seg.span.underline) deco.push('underline');
                        if (seg.span.strikethrough) deco.push('line-through');
                        if (deco.length) tspan.setAttribute('text-decoration', deco.join(' '));
                        textEl.appendChild(tspan);
                    }
                    wrapper.appendChild(textEl);
                    lineY += lineHeight;
                }
            } else if (el.containerText) {
                // Plain text path (original)
                const lineHeight = fontSize * 1.2;
                const measureRenderer = getMeasurementRenderer();
                measureRenderer.font = `${fontSize}px ${fontFamily}`;
                const paragraphs = el.containerText.split('\n');
                const lines: string[] = [];
                paragraphs.forEach(para => {
                    if (para === '') lines.push('');
                    else lines.push(...wrapText(measureRenderer, para, maxWidth));
                });

                let textAnchor = 'middle';
                let xPos = cx;
                if (textAlign === 'left') { textAnchor = 'start'; xPos = el.x + 10; }
                else if (textAlign === 'right') { textAnchor = 'end'; xPos = el.x + el.width - 10; }

                const totalHeight = lines.length * lineHeight;
                const startY = cy - totalHeight / 2 + lineHeight / 2;

                lines.forEach((line, index) => {
                    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    textEl.textContent = line || '\u00A0';
                    textEl.setAttribute('x', `${xPos}`);
                    textEl.setAttribute('y', `${startY + index * lineHeight}`);
                    textEl.setAttribute('fill', textColor);
                    textEl.setAttribute('font-family', fontFamily);
                    textEl.setAttribute('font-size', `${fontSize}px`);
                    textEl.setAttribute('text-anchor', textAnchor);
                    textEl.setAttribute('dominant-baseline', 'central');
                    wrapper.appendChild(textEl);
                });
            }
            node = wrapper;
        }

        // Appearance stack → extra fills/strokes over the base, as real SVG. Canvas-fallback
        // shapes already have them baked into the raster, so skip those. Wrapping the base +
        // an extras <g> lets the finalizer's rotate/flip apply to both together.
        if (node && !isCanvasFallback && el.appearance) {
            const apG = buildAppearanceSvgGroup(el, rc, options, defs);
            if (apG) {
                const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                wrap.appendChild(node);
                wrap.appendChild(apG);
                node = wrap;
            }
        }

        if (node) {
            if (!isCanvasFallback) {
                // Apply SVG-level properties for natively rendered shapes
                // Canvas fallback shapes already have opacity, rotation, flip baked in
                node.setAttribute('opacity', `${(el.opacity ?? 100) / 100}`);
                const transforms: string[] = [];
                if (el.angle) {
                    const tcx = el.x + el.width / 2;
                    const tcy = el.y + el.height / 2;
                    transforms.push(`rotate(${el.angle * (180 / Math.PI)}, ${tcx}, ${tcy})`);
                }
                if (el.flipX || el.flipY) {
                    const tcx = el.x + el.width / 2;
                    const tcy = el.y + el.height / 2;
                    transforms.push(`translate(${tcx}, ${tcy}) scale(${el.flipX ? -1 : 1}, ${el.flipY ? -1 : 1}) translate(${-tcx}, ${-tcy})`);
                }
                if (el.shearX || el.shearY) {
                    const tcx = el.x + el.width / 2;
                    const tcy = el.y + el.height / 2;
                    // matrix(1, shearY, shearX, 1, 0, 0) == the canvas transform(1, shearY, shearX, 1, 0, 0)
                    // used in render-pipeline, so SVG matches the canvas exactly (skewX/skewY pairs would not).
                    transforms.push(`translate(${tcx}, ${tcy}) matrix(1, ${el.shearY || 0}, ${el.shearX || 0}, 1, 0, 0) translate(${-tcx}, ${-tcy})`);
                }
                if (transforms.length > 0) {
                    node.setAttribute('transform', transforms.join(' '));
                }
            }
            g.appendChild(node);
        }
    });

    const s = new XMLSerializer();
    const str = s.serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'yappy_drawing.svg';
    link.href = url;
    link.click();
    return str;
};

export const exportToPdf = async (scale: number, background: boolean, onlySelected: boolean) => {
    const allElements = store.elements;
    if (allElements.length === 0) return;

    const isSlides = isPagedDocType(store.docType) && store.slides.length > 0 && !onlySelected;

    if (isSlides) {
        // Multi-page: one page per slide
        const sortedSlides = [...store.slides].sort((a, b) => a.order - b.order);
        const firstSlide = sortedSlides[0];
        const { width: pw, height: ph } = firstSlide.dimensions;
        const orientation = pw >= ph ? 'landscape' : 'portrait';

        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [pw, ph],
            hotfixes: ['px_scaling'],
        });

        for (let i = 0; i < sortedSlides.length; i++) {
            const slide = sortedSlides[i];
            const { width: sW, height: sH } = slide.dimensions;
            const { x: sX, y: sY } = slide.spatialPosition;

            // Filter elements whose center falls on this slide
            const slideElements = allElements.filter(el => {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
            });

            // Create offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = sW * scale;
            canvas.height = sH * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            // Background
            if (background) {
                ctx.fillStyle = slide.backgroundColor || (store.theme !== 'light' ? '#121212' : '#ffffff');
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.scale(scale, scale);
            ctx.translate(-sX, -sY);

            // Render elements
            const rc = rough.canvas(canvas);
            slideElements.forEach(el => {
                renderElWithEffects(rc, ctx, el);
            });

            // Add page (first page already exists)
            if (i > 0) {
                const slideOrientation = sW >= sH ? 'landscape' : 'portrait';
                pdf.addPage([sW, sH], slideOrientation);
            }

            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            pdf.addImage(imgData, 'JPEG', 0, 0, sW, sH);
        }

        pdf.save('yappy_drawing.pdf');
    } else {
        // Single page: selection or infinite canvas
        let elements = allElements;
        if (onlySelected) {
            if (store.selection.length === 0) return;
            elements = elements.filter(el => store.selection.includes(el.id));
        }
        if (elements.length === 0) return;

        // Calculate bounds
        const __eb = elementsBounds(elements);
        let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;

        const padding = 20;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        // Create offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (background) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        const rc = rough.canvas(canvas);
        elements.forEach(el => {
            renderElWithEffects(rc, ctx, el);
        });

        const orientation = width >= height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [width, height],
            hotfixes: ['px_scaling'],
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
        pdf.save('yappy_drawing.pdf');
    }
};

export const exportToPptx = async (scale: number, background: boolean, onlySelected: boolean) => {
    const allElements = store.elements;
    if (allElements.length === 0) return;

    const pptx = new PptxGenJS();

    const isSlides = isPagedDocType(store.docType) && store.slides.length > 0 && !onlySelected;

    if (isSlides) {
        const sortedSlides = [...store.slides].sort((a, b) => a.order - b.order);

        // Set presentation size from first slide's aspect ratio (inches, 10" base width)
        const firstSlide = sortedSlides[0];
        const slideW = 10;
        const slideH = 10 * (firstSlide.dimensions.height / firstSlide.dimensions.width);
        pptx.defineLayout({ name: 'CUSTOM', width: slideW, height: slideH });
        pptx.layout = 'CUSTOM';

        for (const slide of sortedSlides) {
            const { width: sW, height: sH } = slide.dimensions;
            const { x: sX, y: sY } = slide.spatialPosition;

            // Filter elements whose center falls on this slide
            const slideElements = allElements.filter(el => {
                const cx = el.x + el.width / 2;
                const cy = el.y + el.height / 2;
                return cx >= sX && cx <= sX + sW && cy >= sY && cy <= sY + sH;
            });

            // Render to offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = sW * scale;
            canvas.height = sH * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            if (background) {
                ctx.fillStyle = slide.backgroundColor || (store.theme !== 'light' ? '#121212' : '#ffffff');
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.scale(scale, scale);
            ctx.translate(-sX, -sY);

            const rc = rough.canvas(canvas);
            slideElements.forEach(el => {
                renderElWithEffects(rc, ctx, el);
            });

            // Per-slide dimensions in inches (in case slides differ in size)
            const thisSlideW = 10;
            const thisSlideH = 10 * (sH / sW);

            const pptSlide = pptx.addSlide();
            pptSlide.addImage({
                data: canvas.toDataURL('image/png'),
                x: 0,
                y: 0,
                w: thisSlideW,
                h: thisSlideH,
            });
        }
    } else {
        // Single slide: selection or infinite canvas
        let elements = allElements;
        if (onlySelected) {
            if (store.selection.length === 0) return;
            elements = elements.filter(el => store.selection.includes(el.id));
        }
        if (elements.length === 0) return;

        const __eb = elementsBounds(elements);
        let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;

        const padding = 20;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (background) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        const rc = rough.canvas(canvas);
        elements.forEach(el => {
            renderElWithEffects(rc, ctx, el);
        });

        const slideW = 10;
        const slideH = 10 * (height / width);
        pptx.defineLayout({ name: 'CUSTOM', width: slideW, height: slideH });
        pptx.layout = 'CUSTOM';

        const pptSlide = pptx.addSlide();
        pptSlide.addImage({
            data: canvas.toDataURL('image/png'),
            x: 0,
            y: 0,
            w: slideW,
            h: slideH,
        });
    }

    await pptx.writeFile({ fileName: 'yappy_drawing.pptx' });
};
