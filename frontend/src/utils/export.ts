import { lineHeightPx } from './text-line-height';
import { store, isLayerVisible } from "../store/app-store";
import { isPagedDocType } from '../types/slide-types';
import { ownerSlideIndex } from './slide-utils';
import { renderElement } from "./render-element";
import { resolveDash } from "./stroke-dash";
import { renderSlideBackground } from "./canvas-renderer";
import rough from 'roughjs/bin/rough';
// jspdf + pptxgenjs are ~744 kB and are reached ONLY by exportToPdf / exportToPptx,
// but this module is statically imported by api.ts, the export dialog, doc-thumbnails
// and others for plain PNG/SVG export — so importing them at module level put the whole
// vendor-export chunk on the cold-load critical path. Loaded inside the two functions
// that need them instead; the other exports are unaffected.
import { resolveFontFamily, wrapText, getMeasurementRenderer, measureContainerText } from "./text-utils";
import { fontShorthand, normalizeFontWeight, normalizeFontStyle } from "./font-variants";
import { calculateUmlClassLayout, calculateUml2SectionLayout } from "./uml-layout-utils";
import type { DrawingElement, Swatch } from "../types";
import {
    DEFAULT_VAR_PREFIX, elementColorVars, applyColorVars, buildThemeStyleSheet,
    type SvgThemeOptions,
} from "./svg-theme";
import { buildFilterString } from "./image-filter-utils";
import { layoutRichText, type RichTextSegment } from "./rich-text-utils";
import { getShapeGeometry, type ShapeGeometry } from "./shape-geometry";
import { effectiveStrokeAlign } from "./stroke-align";
import { connectorGeometry } from "./connector-geometry";
import { svgFillPaint, svgPatternDef } from "./svg-paint";
import { SvgRenderer } from "../rendering/SvgRenderer";
import { getImage, preloadImages } from "./image-cache";
import { rasterizeWarpedImage } from "./image-warp";
import { transformEffectRenderCopies, hasTransformEffect } from "./transform-effect";
import { hasExtrude, extrudeOwnsFront, renderExtrudeBody } from "./extrude";
import { hasRevolve, renderRevolve } from "./revolve";
import { showToast } from "../components/toast";
import { renderDimensions } from "./dimension-renderer";
import { appendDimensionSvg } from "./dimension-svg";

const SVGNS = 'http://www.w3.org/2000/svg';

/** One indent step per list nesting level — the canvas renderers' INDENT_SIZE. */
const LIST_INDENT_SIZE = 20;

/**
 * The bullet / number that sits in a list item's gutter, as a `<tspan>`.
 *
 * The canvas renderers (`text-renderer.ts`, `render-pipeline.ts`) draw it beside the
 * item's *first* segment — `seg.listMarker`, which word-wrapped continuation lines
 * never carry — at `xOffset + level * INDENT_SIZE`, in that span's own font. SVG export
 * emitted a tspan per segment but never the marker, so an exported list kept the indent
 * `layoutRichText` reserved for it and lost every bullet. Returns null for non-markers
 * so callers can just append the result.
 */
const listMarkerTspan = (
    seg: RichTextSegment,
    xOffset: number,
    fallback: { color: string; fontFamily: DrawingElement['fontFamily']; fontSize: number },
): SVGTSpanElement | null => {
    const span = seg.span;
    if (!seg.listMarker || !span.listType || span.listType === 'none') return null;
    const tspan = document.createElementNS(SVGNS, 'tspan') as SVGTSpanElement;
    tspan.textContent = span.listType === 'ordered' ? `${span.listIndex || 1}.` : '•';
    tspan.setAttribute('x', `${xOffset + (span.listLevel || 0) * LIST_INDENT_SIZE}`);
    tspan.setAttribute('fill', span.color || fallback.color);
    tspan.setAttribute('font-family', resolveFontFamily(span.fontFamily || fallback.fontFamily));
    tspan.setAttribute('font-size', `${span.fontSize || fallback.fontSize}px`);
    if (span.bold) tspan.setAttribute('font-weight', 'bold');
    if (span.italic) tspan.setAttribute('font-style', 'italic');
    return tspan;
};

/** Bake dimension annotations onto a world-space export ctx — opt-in via Settings. */
function paintDimensions(ctx: CanvasRenderingContext2D, elements: DrawingElement[], scale: number) {
    if (!store.globalSettings.exportIncludeDimensions) return;
    renderDimensions(ctx, store.dimensionAnnotations, elements, new Map(), scale, false, store.globalSettings.measurementUnit ?? 'px');
}

interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }

/** Decode every image the export will draw (element images + slide backgrounds) into the cache
 *  first — exporters render synchronously, so an un-cached image (e.g. one just placed on top of
 *  another) would otherwise export blank. */
export async function ensureExportImages(): Promise<void> {
    await preloadImages([
        ...store.elements.filter(e => e.type === 'image').map(e => e.dataURL),
        ...store.elements.map(e => (e as any).fillImageUrl),
        ...store.slides.map(s => (s as any).backgroundImage),
    ]);
}

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
    // Stroke spread + shadow/glow/feather spread padding. How far the stroke reaches past the
    // outline depends on its alignment: centre spills half its width, `outside` a full width,
    // `inside` none at all. Assuming half-width for every case cropped outside-aligned strokes
    // at the edge of the exported canvas.
    const shadow = el.shadowEnabled ? (el.shadowBlur || 0) + Math.max(Math.abs(el.shadowOffsetX || 0), Math.abs(el.shadowOffsetY || 0)) : 0;
    const strokeSpread = (() => {
        const w = el.strokeWidth || 0;
        switch (effectiveStrokeAlign(el)) {
            case 'inside': return 0;
            case 'outside': return w;
            default: return w / 2;
        }
    })();
    const pad = strokeSpread + shadow + (el.glowEnabled ? (el.glowBlur || 0) : 0) + (el.featherRadius || 0);
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

/**
 * Union AABB of a set of elements, expanding for live Transform-effect copies.
 *
 * A non-finite box is dropped rather than unioned: `Math.min(NaN, x)` is NaN, so ONE
 * element carrying a NaN coordinate (they come from degenerate boolean results and from
 * hand-edited/imported documents) poisons the whole crop and the export comes out blank or
 * absurdly large. Falls back to an empty box if nothing survives, which callers already
 * treat as "nothing to export".
 */
function elementsBounds(elements: DrawingElement[]): Bounds {
    let b: Bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    const acc = (o: Bounds) => {
        if (!isFinite(o.minX) || !isFinite(o.minY) || !isFinite(o.maxX) || !isFinite(o.maxY)) return;
        b.minX = Math.min(b.minX, o.minX); b.minY = Math.min(b.minY, o.minY);
        b.maxX = Math.max(b.maxX, o.maxX); b.maxY = Math.max(b.maxY, o.maxY);
    };
    for (const el of elements) {
        const copies = transformEffectRenderCopies(el);
        if (copies.length) for (const c of copies) acc(elementAABB(c));
        else acc(elementAABB(el));
    }
    if (!isFinite(b.minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    return b;
}

/**
 * Render one element to a raster canvas INCLUDING its live effects — the 3D-extrude body and
 * Transform-effect copies. `renderElement` alone draws only the flat base shape (effects live in
 * the canvas render hook), so exports must replay that hook or effects vanish from the output.
 */
function renderElWithEffects(rc: ReturnType<typeof rough.canvas>, ctx: CanvasRenderingContext2D, el: DrawingElement): void {
    if (el.isAdjustmentLayer) {
        // Filter everything already drawn beneath this region (no authoring gizmo in export).
        const filterStr = buildFilterString(el);
        if (filterStr !== 'none') {
            const canvas = ctx.canvas;
            const temp = document.createElement('canvas');
            temp.width = canvas.width; temp.height = canvas.height;
            const tctx = temp.getContext('2d');
            if (tctx) {
                tctx.drawImage(canvas, 0, 0);
                ctx.save();
                ctx.beginPath();
                ctx.rect(el.x, el.y, el.width, el.height);
                ctx.clip();
                ctx.filter = filterStr;
                const t = ctx.getTransform();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.drawImage(temp, 0, 0);
                ctx.setTransform(t);
                ctx.filter = 'none';
                ctx.restore();
            }
        }
        return;
    }
    if (hasRevolve(el)) { renderRevolve(ctx, el); return; } // full lathe solid replaces the shape
    if (hasExtrude(el)) {
        renderExtrudeBody(ctx, el);
        if (extrudeOwnsFront(el)) return; // full 3D solid (tilt/bevel front) already drawn
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
        const daArr = resolveDash(s.dash, s.dashArray, [10, 10], [2, 8]);
        const da = daArr ? daArr.join(' ') : undefined;
        for (const d of ds) {
            if (sketch) {
                g.appendChild(rc.path(d, { ...options, stroke: s.color, strokeWidth: s.width, fill: 'none', strokeLineDash: daArr }));
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
    { const eda = resolveDash(el.strokeStyle, el.strokeDashArray, [10, 10], [2, 8]); if (eda) box.setAttribute('stroke-dasharray', eda.join(' ')); }
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

/*
 * `connectorCurvePath` used to live here, re-implementing the canvas's curve maths — which
 * is how the arrowheads came to be rotated to the bounding-box chord instead of the path's
 * tangent (docs/arrowhead-orientation-spec.md). The arrow branch below now takes both the
 * path and the angles from the shared `connectorGeometry` helper, so export and canvas
 * cannot disagree.
 */

/** Plain SVG <path> for a connector stroke `d`, styled from the element. */
function connectorPathEl(el: DrawingElement, d: string): SVGPathElement {
    const p = document.createElementNS(SVGNS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', el.strokeColor || '#000');
    p.setAttribute('stroke-width', `${el.strokeWidth || 2}`);
    p.setAttribute('stroke-linecap', 'round');
    { const eda = resolveDash(el.strokeStyle, el.strokeDashArray, [10, 10], [2, 8]); if (eda) p.setAttribute('stroke-dasharray', eda.join(' ')); }
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
            // `r` is a single radius for a uniformly rounded rect, or four (TL,TR,BR,BL) when
            // the corners are set independently. Each is capped at half the shorter side, and
            // a zero corner simply omits its arc so the two edges meet square.
            const cap = Math.min(Math.abs(w) / 2, Math.abs(h) / 2);
            const [tl, tr, br, bl] = (Array.isArray(r) ? r : [r || 0, r || 0, r || 0, r || 0])
                .map(v => Math.max(0, Math.min(v || 0, cap)));
            if (tl || tr || br || bl) {
                const arc = (rad: number, ex: number, ey: number) =>
                    rad ? ` A ${round(rad)} ${round(rad)} 0 0 1 ${round(ex)} ${round(ey)}` : '';
                out.push(
                    `M ${round(x + tl)} ${round(y)}`
                    + ` H ${round(x + w - tr)}` + arc(tr, x + w, y + tr)
                    + ` V ${round(y + h - br)}` + arc(br, x + w - br, y + h)
                    + ` H ${round(x + bl)}` + arc(bl, x, y + h - bl)
                    + ` V ${round(y + tl)}` + arc(tl, x + tl, y)
                    + ' Z');
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
    for (const [pageIdx, slide] of sortedSlides.entries()) {
        const { width: sW, height: sH } = slide.dimensions;
        const { x: sX, y: sY } = slide.spatialPosition;
        const destX = (maxW - sW) / 2; // centre narrower pages

        ctx.save();
        // Map this page's world rect onto its slot in the stacked output.
        ctx.translate(destX - sX, destY - sY);
        ctx.beginPath(); ctx.rect(sX, sY, sW, sH); ctx.clip();
        renderSlideBackground(ctx, rc, slide, sX, sY, sW, sH, store.theme);
        for (const el of store.elements) {
            if (el.isClipMask || !isExportable(el)) continue;
            // One page owns each element, and only that page draws it — an overlap test
            // put a shape hanging over an edge on the neighbouring page as well.
            if (ownerSlideIndex(el, sortedSlides) !== pageIdx) continue;
            try { renderElWithEffects(rc, ctx, el); } catch { /* skip */ }
        }
        ctx.restore();
        destY += sH + PAGED_EXPORT_GAP;
    }
    return canvas;
}

/**
 * The colour the document is actually drawn on.
 *
 * Every non-slide exporter used to hardcode `#ffffff` here, ignoring the canvas background
 * the user had set. Set the canvas to black and write in white, a perfectly ordinary thing
 * to do, and the exported file came back as blank white paper with invisible white text on
 * it. The drawing was in the file and nothing could be seen. Reported by a user, and the
 * failure is total rather than cosmetic, which is why it read as "export is broken".
 *
 * Slides never had this: they already read `slide.backgroundColor`. This is the same idea
 * for the infinite canvas, where `canvasBackgroundColor` is the equivalent. It defaults to
 * white, so nothing changes for anyone who never touched the setting.
 */
const documentBackground = (): string => store.canvasBackgroundColor || '#ffffff';

export const exportToPng = async (scale: number, background: boolean, onlySelected: boolean) => {
    await ensureExportImages();
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

    let elements = store.elements.filter(el => !el.isNullObject && isExportable(el)); // null objects are authoring gizmos (adjustment layers render their filter in export)
    if (onlySelected) {
        if (store.selection.length === 0) { showToast('Nothing selected — uncheck “Only selected” to export the whole drawing', 'info'); return; }
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    // Visual bounds — rotation / stroke / shadow / extrude / transform-effect aware, so nothing
    // is cropped off the export (the raw x/y/w/h box misses all of those).
    const { minX, minY, maxX, maxY } = elementsBounds(elements);

    // Padding
    const padding = 2;   // tight crop — avoid a transparent border (visual bounds already include stroke/effects)
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    if (background) {
        ctx.fillStyle = documentBackground();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    // Render
    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElWithEffects(rc, ctx, el);
    });
    paintDimensions(ctx, elements, scale);

    // Download
    const link = document.createElement('a');
    link.download = 'yappy_drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
};

/**
 * Hidden objects (the object tree's eye toggle) must not appear in ANY export.
 * `visible !== false` — absent means visible, so documents predating the field
 * export exactly as before. Every element walk in this file goes through this.
 *
 * A hidden LAYER counts too. The canvas renderer skips whole layers whose eye is off
 * (`renderElements`), but this gate only ever looked at the element's own flag, so every
 * export — PNG, JPG, SVG, PDF, PPTX, Rasterize, Slice — quietly put the hidden layers back:
 * they were drawn, AND they widened the crop box that PNG/JPG/SVG size themselves from.
 * That is how a drawing exports as a small object off in one corner of a mostly empty
 * image — the box is being stretched by something the canvas never showed you.
 *
 * `isLayerVisible` is also false for a layer that does not exist, which deliberately matches
 * the canvas: it buckets elements by `layerId` and never draws a bucket with no layer, so an
 * element pointing at a deleted layer is invisible there too. Exporting it would be exporting
 * something the document does not show.
 */
export const isExportable = (el: DrawingElement): boolean =>
    el.visible !== false && isLayerVisible(el.layerId);

/** Largest canvas edge browsers reliably allocate; beyond this `toDataURL` returns a blank image. */
const MAX_RASTER_EDGE = 16384;

/**
 * Render exactly the given elements to a PNG (Object ▸ Rasterize).
 *
 * Unlike `exportRegion`, which paints everything overlapping a rectangle, this
 * paints ONLY `ids` — so rasterizing a shape that overlaps other art doesn't
 * bake the neighbours into the bitmap. Bounds are the visual bounds (rotation /
 * stroke / shadow / effects aware) so nothing is clipped off, and the returned
 * rect is where the bitmap belongs in world space.
 */
export const rasterizeElements = async (
    ids: string[], scale = 2, background?: string,
): Promise<{ dataURL: string; x: number; y: number; width: number; height: number; pixelWidth: number; pixelHeight: number } | null> => {
    await ensureExportImages();
    const idSet = new Set(ids);
    // Keep document order so the raster stacks the same way the canvas does.
    const elements = store.elements.filter(el => idSet.has(el.id) && !el.isNullObject && !el.isClipMask && isExportable(el));
    if (elements.length === 0) return null;

    const { minX, minY, maxX, maxY } = elementsBounds(elements);
    const padding = 2;                       // matches exportToPng's tight crop
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    if (!(width >= 1) || !(height >= 1)) return null;

    // Clamp the resolution rather than handing the browser a canvas it will
    // silently fail to allocate.
    const safeScale = Math.max(0.05, Math.min(scale, MAX_RASTER_EDGE / Math.max(width, height)));

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * safeScale));
    canvas.height = Math.max(1, Math.round(height * safeScale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.scale(safeScale, safeScale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    for (const el of elements) {
        try { renderElWithEffects(rc, ctx, el); } catch { /* skip a shape rather than lose the whole raster */ }
    }

    let dataURL: string;
    try { dataURL = canvas.toDataURL('image/png'); } catch { return null; }
    return {
        dataURL, x: minX - padding, y: minY - padding, width, height,
        pixelWidth: canvas.width, pixelHeight: canvas.height,
    };
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
        if (el.isClipMask || !isExportable(el)) continue;
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
        if (el.isClipMask || !isExportable(el)) continue;
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
        // JPEG has no transparency, so it always needs an opaque fill. The fill is the
        // document's own background, not an assumed white.
        ctx.fillStyle = documentBackground();
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.scale(scale, scale);
    ctx.translate(-sX, -sY);
    ctx.beginPath(); ctx.rect(sX, sY, sW, sH); ctx.clip();
    const rc = rough.canvas(canvas);
    renderSlideBackground(ctx, rc, slide, sX, sY, sW, sH, store.theme);
    for (const el of store.elements) {
        if (el.isClipMask || !isExportable(el)) continue;
        // Ownership (not overlap) — see renderPagedDocToCanvas.
        if (ownerSlideIndex(el, store.slides) !== pageIndex) continue;
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
    await ensureExportImages();
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

    let elements = store.elements.filter(el => !el.isNullObject && isExportable(el)); // null objects are authoring gizmos (adjustment layers render their filter in export)
    if (onlySelected) {
        if (store.selection.length === 0) { showToast('Nothing selected — uncheck “Only selected” to export the whole drawing', 'info'); return; }
        elements = elements.filter(el => store.selection.includes(el.id));
    }
    if (elements.length === 0) return;

    const __eb = elementsBounds(elements);
    let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;

    const padding = 2;   // tight crop — avoid a transparent border (visual bounds already include stroke/effects)
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // JPEG has no transparency, so this fill is always painted, with the document's own
    // background colour rather than an assumed white.
    ctx.fillStyle = documentBackground();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElWithEffects(rc, ctx, el);
    });
    paintDimensions(ctx, elements, scale);

    const link = document.createElement('a');
    link.download = 'yappy_drawing.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
};

export const copyCanvasAsPng = async (scale: number) => {
    await ensureExportImages();
    const elements = store.elements;
    if (elements.length === 0) return;

    const __eb = elementsBounds(elements);
    let minX = __eb.minX, minY = __eb.minY, maxX = __eb.maxX, maxY = __eb.maxY;

    const padding = 2;   // tight crop — avoid a transparent border (visual bounds already include stroke/effects)
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = documentBackground();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(scale, scale);
    ctx.translate(-minX + padding, -minY + padding);

    const rc = rough.canvas(canvas);
    elements.forEach(el => {
        renderElWithEffects(rc, ctx, el);
    });
    paintDimensions(ctx, elements, scale);

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

export const exportToSvg = (onlySelected: boolean, themeOpts?: SvgThemeOptions) => {
    let elements = store.elements.filter(el => !el.isNullObject && isExportable(el)); // null objects are authoring gizmos (adjustment layers render their filter in export)
    if (onlySelected) {
        if (store.selection.length === 0) { showToast('Nothing selected — uncheck “Only selected” to export the whole drawing', 'info'); return; }
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

    const padding = 2;   // tight crop — avoid a transparent border (visual bounds already include stroke/effects)
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    // Themed exports reference swatch colours as CSS variables so one file works
    // on a light page and a dark one. See utils/svg-theme.
    const themed = themeOpts?.theme === 'variables';
    const varPrefix = themeOpts?.varPrefix ?? DEFAULT_VAR_PREFIX;
    const swatchById = new Map(store.swatches.map(sw => [sw.id, sw]));
    const usedSwatches = new Map<string, Swatch>();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${width}`);
    svg.setAttribute('height', `${height}`);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // A themed export stays transparent: the page it is embedded in owns the
    // background, and a baked white one defeats the point of theming.
    if (!themed) svg.style.backgroundColor = '#ffffff';

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
            strokeLineDash: resolveDash(el.strokeStyle, el.strokeDashArray, [10, 10], [5, 10]),
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
            // Endpoints come from the shared helper so a rerouted connector (el.points) is
            // honoured rather than being flattened back onto the bounding box.
            const geom = connectorGeometry(el);
            const startX = geom.start.x, startY = geom.start.y;
            const endX = geom.end.x, endY = geom.end.y;

            const curveD = geom.d;

            if (el.type === 'arrow') {
                const arrowG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                arrowG.appendChild(curveD ? connectorPathEl(el, curveD) : rc.line(startX, startY, endX, endY, options));

                // The tangent of the path at each end, NOT the bounding-box chord. These
                // differ by up to 45° on a default-control-point curve, which is the whole
                // of docs/arrowhead-orientation-spec.md.
                const startAngle = geom.startAngle;
                const angle = geom.endAngle;
                const startHeadLen = el.startArrowheadSize || 28;
                const endHeadLen = el.endArrowheadSize || 28;

                const headStroke = el.strokeColor || '#000';
                const headWidth = el.strokeWidth || 2;

                if (el.startArrowhead) {
                    // `startAngle` is already the OUTWARD direction at the start, so there is
                    // no `+ π` here any more — that term existed only to flip the single
                    // chord angle around for this end.
                    if (UML_ARROWHEADS.has(el.startArrowhead)) {
                        arrowG.appendChild(umlArrowheadGlyph(startX, startY, startAngle, startHeadLen, el.startArrowhead, headStroke, headWidth));
                    } else {
                        const p1 = { x: startX - startHeadLen * Math.cos(startAngle - Math.PI / 6), y: startY - startHeadLen * Math.sin(startAngle - Math.PI / 6) };
                        const p2 = { x: startX - startHeadLen * Math.cos(startAngle + Math.PI / 6), y: startY - startHeadLen * Math.sin(startAngle + Math.PI / 6) };
                        arrowG.appendChild(rc.line(startX, startY, p1.x, p1.y, options));
                        arrowG.appendChild(rc.line(startX, startY, p2.x, p2.y, options));
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
                node = curveD ? connectorPathEl(el, curveD) : rc.line(startX, startY, endX, endY, options);
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
                const defaults = { fontSize, fontFamily: el.fontFamily || 'sans-serif', lineHeight: el.lineHeight };
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
                        const marker = listMarkerTspan(seg, xOffset, { color: textColor, fontFamily: el.fontFamily, fontSize });
                        if (marker) textEl.appendChild(marker);
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
                // The numeric weight goes straight into SVG's `font-weight`, which takes the
                // 100–900 axis natively. The old `'bold' : 'normal'` collapsed every weight
                // to one of two, so a Light or SemiBold wordmark exported as Regular.
                const fontWeight = String(normalizeFontWeight(el.fontWeight));
                const fontStyleStr = normalizeFontStyle(el.fontStyle);
                const lineHeight = lineHeightPx(fontSize, el);
                const measureRenderer = getMeasurementRenderer();
                measureRenderer.font = fontShorthand(el.fontWeight, el.fontStyle, fontSize, fontFamily);
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
                // Stroke alignment: SVG has no `stroke-alignment` attribute, so mirror the
                // canvas trick (utils/stroke-align.ts) — double the stroke width and clip away
                // the wrong half with a <clipPath> built from the same centred geometry.
                const align = strokeVisible && !isSketch ? effectiveStrokeAlign(el) : 'center';
                let strokeHost: Element = inner;
                if (align !== 'center') {
                    const clipId = `salign-${el.id}`;
                    const clipPath = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
                    clipPath.setAttribute('id', clipId);
                    if (align === 'outside') {
                        // Huge rect minus the outline, via even-odd → only the exterior clips in.
                        const pad = Math.max(Math.abs(el.width), Math.abs(el.height)) * 4 + el.strokeWidth * 8 + 1000;
                        const cover = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        const x0 = -Math.abs(el.width) / 2 - pad, y0 = -Math.abs(el.height) / 2 - pad;
                        const w = Math.abs(el.width) + pad * 2, h = Math.abs(el.height) + pad * 2;
                        cover.setAttribute('d', `M ${x0} ${y0} h ${w} v ${h} h ${-w} Z ` + ds.join(' '));
                        cover.setAttribute('clip-rule', 'evenodd');
                        clipPath.appendChild(cover);
                    } else {
                        for (const d of ds) {
                            const cp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                            cp.setAttribute('d', d);
                            if (evenOdd) cp.setAttribute('clip-rule', 'evenodd');
                            clipPath.appendChild(cp);
                        }
                    }
                    defs.appendChild(clipPath);

                    // Fill first, unclipped — matching the canvas two-pass render, so the two
                    // agree on which half of the stroke covers the fill edge.
                    for (const d of ds) {
                        const fillEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        fillEl.setAttribute('d', d);
                        fillEl.setAttribute('fill', fill);
                        if (evenOdd) fillEl.setAttribute('fill-rule', 'evenodd');
                        fillEl.setAttribute('stroke', 'none');
                        inner.appendChild(fillEl);
                    }
                    const clippedG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                    clippedG.setAttribute('clip-path', `url(#${clipId})`);
                    inner.appendChild(clippedG);
                    strokeHost = clippedG;
                }

                for (const d of ds) {
                    if (isSketch) {
                        // rough.js produces a vector (sketchy) <g> from the path data.
                        const rNode = rc.path(d, { ...options, fillStyle: el.fillStyle });
                        inner.appendChild(rNode);
                    } else {
                        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        pathEl.setAttribute('d', d);
                        // When aligned, the fill was already emitted unclipped above.
                        pathEl.setAttribute('fill', align === 'center' ? fill : 'none');
                        if (evenOdd) pathEl.setAttribute('fill-rule', 'evenodd');
                        if (strokeVisible) {
                            pathEl.setAttribute('stroke', el.strokeColor);
                            pathEl.setAttribute('stroke-width', `${align === 'center' ? el.strokeWidth : el.strokeWidth * 2}`);
                            pathEl.setAttribute('stroke-linejoin', el.strokeLineJoin || 'round');
                            pathEl.setAttribute('stroke-linecap', el.strokeLineCap || 'round');
                            { const eda = resolveDash(el.strokeStyle, el.strokeDashArray, [10, 10], [2, 8]); if (eda) pathEl.setAttribute('stroke-dasharray', eda.join(' ')); }
                        } else {
                            pathEl.setAttribute('stroke', 'none');
                        }
                        strokeHost.appendChild(pathEl);
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

            /* A connector is not a container: its "box" is the chord's bounding rect, which
               is a degenerate stand-in for the shape holding the text. Wrapping a label to
               `el.width` therefore breaks it to the chord's dx — ZERO, or negative after the
               -20 padding, for a vertical connector — so `a -> b "one at a time"` exported as
               four stacked single-word lines dropped down the line. The canvas renderer never
               wrapped connector labels (it splits on \n only), so this was another export-only
               divergence. Labels also belong on the PATH midpoint, not the bounding-box
               centre; for a curve the two differ. See docs/connector-anchor-direction-spec.md. */
            const isConnector = el.type === 'line' || el.type === 'arrow' || el.type === 'bezier';
            const connGeom = isConnector ? connectorGeometry(el) : null;
            const cx = connGeom ? connGeom.mid.x : el.x + el.width / 2;
            const cy = connGeom ? connGeom.mid.y : el.y + el.height / 2;
            const maxWidth = connGeom ? Infinity : el.width - 20;

            if (el.richContainerText && el.richContainerText.length > 0) {
                // Rich text path
                const measureRenderer = getMeasurementRenderer();
                const defaults = { fontSize, fontFamily: el.fontFamily || 'hand-drawn', lineHeight: el.lineHeight };
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
                        const marker = listMarkerTspan(seg, xOffset, { color: textColor, fontFamily: el.fontFamily, fontSize });
                        if (marker) textEl.appendChild(marker);
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
                const lineHeight = lineHeightPx(fontSize, el);
                const measureRenderer = getMeasurementRenderer();
                measureRenderer.font = `${fontSize}px ${fontFamily}`;
                const paragraphs = el.containerText.split('\n');
                const lines: string[] = [];
                paragraphs.forEach(para => {
                    if (para === '') lines.push('');
                    else lines.push(...wrapText(measureRenderer, para, maxWidth));
                });

                // Connector labels are always centred on the path (the canvas renderer hard-codes
                // `textAlign = 'center'`); `el.x`/`el.width` here are the chord's corner and dx,
                // which do not describe a text box to align inside.
                let textAnchor = 'middle';
                let xPos = cx;
                if (!isConnector) {
                    if (textAlign === 'left') { textAnchor = 'start'; xPos = el.x + 10; }
                    else if (textAlign === 'right') { textAnchor = 'end'; xPos = el.x + el.width - 10; }
                }

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
            if (themed) {
                const colorVars = elementColorVars(el, swatchById, varPrefix);
                if (colorVars.size > 0) {
                    applyColorVars(node, colorVars);
                    if (el.fillSwatchId && swatchById.has(el.fillSwatchId)) usedSwatches.set(el.fillSwatchId, swatchById.get(el.fillSwatchId)!);
                    if (el.strokeSwatchId && swatchById.has(el.strokeSwatchId)) usedSwatches.set(el.strokeSwatchId, swatchById.get(el.strokeSwatchId)!);
                }
            }
            g.appendChild(node);
        }
    });

    // Bake dimension annotations into the vector output (opt-in).
    if (store.globalSettings.exportIncludeDimensions) {
        appendDimensionSvg(g, store.dimensionAnnotations, elements, store.globalSettings.measurementUnit ?? 'px');
    }

    if (themed && usedSwatches.size > 0) {
        const themeStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        themeStyle.textContent = buildThemeStyleSheet([...usedSwatches.values()], varPrefix);
        defs.appendChild(themeStyle);
    }

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

/**
 * Encode an export canvas for a PDF page.
 *
 * JPEG has no alpha channel. With "background" switched off nothing fills the canvas, so
 * every transparent pixel encoded to JPEG came out **black**: the PDF opened as a black
 * page with the artwork nearly invisible on it. That is what "PDF export is broken" looked
 * like from the outside, and it only happened on the one setting nobody tests by default.
 *
 * PNG keeps the alpha, and a jsPDF page is white underneath, so a transparent export now
 * renders as artwork on white paper while still compositing correctly if the PDF is placed
 * over something else. JPEG is kept for the opaque case, where it is a good deal smaller
 * and the alpha channel would be wasted.
 *
 * `exportToPptx` already used PNG throughout, which is why it never had this fault.
 */
const pdfImage = (canvas: HTMLCanvasElement, background: boolean) =>
    background
        ? { data: canvas.toDataURL('image/jpeg', 0.92), format: 'JPEG' as const }
        : { data: canvas.toDataURL('image/png'), format: 'PNG' as const };

export const exportToPdf = async (scale: number, background: boolean, onlySelected: boolean) => {
    await ensureExportImages();
    // Hidden objects never reach a PDF/PPTX page (see isExportable).
    const allElements = store.elements.filter(isExportable);
    if (allElements.length === 0) return;
    const { jsPDF } = await import("jspdf");

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

            // One page owns each element — the same rule the editor and the PNG
            // exporter use, so a shape straddling the gutter between two pages is not
            // dropped from every page by a bare centre test.
            const pageIdx = sortedSlides.indexOf(slide);
            const slideElements = allElements.filter(el => ownerSlideIndex(el, sortedSlides) === pageIdx);

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

            const img = pdfImage(canvas, background);
            pdf.addImage(img.data, img.format, 0, 0, sW, sH);
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
            ctx.fillStyle = documentBackground();
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.scale(scale, scale);
        ctx.translate(-minX + padding, -minY + padding);

        const rc = rough.canvas(canvas);
        elements.forEach(el => {
            renderElWithEffects(rc, ctx, el);
        });
        paintDimensions(ctx, elements, scale);

        const orientation = width >= height ? 'landscape' : 'portrait';
        const pdf = new jsPDF({
            orientation,
            unit: 'px',
            format: [width, height],
            hotfixes: ['px_scaling'],
        });

        const img = pdfImage(canvas, background);
        pdf.addImage(img.data, img.format, 0, 0, width, height);
        pdf.save('yappy_drawing.pdf');
    }
};

export const exportToPptx = async (scale: number, background: boolean, onlySelected: boolean) => {
    await ensureExportImages();
    // Hidden objects never reach a PDF/PPTX page (see isExportable).
    const allElements = store.elements.filter(isExportable);
    if (allElements.length === 0) return;

    const { default: PptxGenJS } = await import("pptxgenjs");
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

            // One page owns each element — the same rule the editor and the PNG
            // exporter use, so a shape straddling the gutter between two pages is not
            // dropped from every page by a bare centre test.
            const pageIdx = sortedSlides.indexOf(slide);
            const slideElements = allElements.filter(el => ownerSlideIndex(el, sortedSlides) === pageIdx);

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
            ctx.fillStyle = documentBackground();
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
