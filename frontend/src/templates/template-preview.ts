/**
 * Template thumbnails — a small SVG of what a template actually contains, drawn
 * from the template's own element data.
 *
 * Rendering a template faithfully would mean running the real pipeline (rough.js,
 * fonts, images, effects) into an offscreen canvas, and that pipeline reads the
 * live store — it can't draw arbitrary template JSON without loading it first.
 * So this draws *simplified marks* instead: every element becomes a rect, ellipse,
 * polygon or line in its true position, size and colour. That's enough to tell a
 * flowchart from a mindmap and one poster from another at thumbnail size, which is
 * the whole job, and it's a pure function — safe to call during render, no canvas,
 * no store, no async.
 *
 * Handles all three shapes template data comes in (design `pages`, presentation
 * `slides`, diagram `data.elements`). Returns null when there's nothing to draw —
 * DSL templates (text that needs the DSL engine) and user templates (which carry a
 * real captured PNG thumbnail); callers fall back to their own placeholder.
 */

/** Presentation slides have no declared size; the app creates them 16:9. */
const SLIDE_SIZE = { width: 1920, height: 1080 };

/** Cap on elements drawn per thumbnail — past this they're sub-pixel anyway. */
const MAX_PREVIEW_ELS = 60;

/** Padding around a diagram's bounding box, as a fraction of its larger side. */
const DIAGRAM_PAD = 0.04;

/**
 * Colours come from our own template data, but a colour string lands inside an SVG
 * attribute we build by concatenation, so validate rather than trust — a template
 * could arrive from an import or the API later.
 */
const SAFE_COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%]+\)|[a-zA-Z]{3,20})$/;
const col = (c: unknown, fallback: string): string =>
    typeof c === 'string' && SAFE_COLOR.test(c.trim()) ? c.trim() : fallback;

const isPaint = (c: unknown): c is string =>
    typeof c === 'string' && c !== 'transparent' && c !== 'none' && c.trim() !== '';

const num = (v: unknown, fallback = 0): number =>
    typeof v === 'number' && Number.isFinite(v) ? v : fallback;

/** Element types drawn as a straight segment from (x,y) to (x+w, y+h). */
const LINE_TYPES = new Set(['arrow', 'line', 'connector', 'elbowArrow', 'curvedArrow']);
const ELLIPSE_TYPES = new Set(['circle', 'ellipse', 'oval', 'umlUseCase', 'umlInterface']);

interface Box { x: number; y: number; w: number; h: number }

/** Simplified marks for one element, in the template's own coordinate space. */
function markFor(el: any): string[] {
    const x = num(el.x), y = num(el.y);
    const w = num(el.width), h = num(el.height);
    const op = Math.max(0, Math.min(1, num(el.opacity, 100) / 100));
    if (op === 0) return [];

    // Lines and arrows: a segment, not a box — a flowchart is mostly connectors, so
    // dropping them would leave a thumbnail of disconnected blobs.
    if (LINE_TYPES.has(el.type)) {
        const stroke = col(el.strokeColor, '#64748b');
        const pts: any[] = Array.isArray(el.points) ? el.points : [];
        if (pts.length > 1) {
            const d = pts.map((p: any) => `${x + num(p.x)},${y + num(p.y)}`).join(' ');
            return [`<polyline points="${d}" fill="none" stroke="${stroke}" stroke-width="${Math.max(1, num(el.strokeWidth, 2))}" stroke-linecap="round" opacity="${op}"/>`];
        }
        if (!w && !h) return [];
        return [`<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${stroke}" stroke-width="${Math.max(1, num(el.strokeWidth, 2))}" stroke-linecap="round" opacity="${op}"/>`];
    }

    if (!w || !h) return [];
    const cx = x + w / 2, cy = y + h / 2;

    // Standalone text: a bar at the text's colour, sized like a line of type.
    if (el.type === 'text') {
        const c = col(el.textColor || el.strokeColor, '#334155');
        return [`<rect x="${x}" y="${y + h * 0.2}" width="${w}" height="${Math.max(1, h * 0.6)}" rx="${Math.min(w, h) * 0.08}" fill="${c}" opacity="${0.55 * op}"/>`];
    }

    const fillRaw = isPaint(el.backgroundColor) ? el.backgroundColor : el.gradientStops?.[0]?.color;
    const fill = isPaint(fillRaw) ? col(fillRaw, 'none') : 'none';
    const stroke = isPaint(el.strokeColor) ? col(el.strokeColor, 'none') : 'none';
    // An outline-only node is invisible without its stroke, so always draw both.
    if (fill === 'none' && stroke === 'none') return [];
    const sw = stroke === 'none' ? 0 : Math.max(1, num(el.strokeWidth, 2));
    const paint = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"`;

    const out: string[] = [];
    if (ELLIPSE_TYPES.has(el.type)) {
        out.push(`<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" ${paint}/>`);
    } else if (el.type === 'diamond') {
        out.push(`<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" ${paint}/>`);
    } else if (el.type === 'triangle') {
        out.push(`<polygon points="${cx},${y} ${x + w},${y + h} ${x},${y + h}" ${paint}/>`);
    } else {
        // Everything else — rectangles, capsules, cards, servers, UML, widgets — reads
        // close enough as its bounding box at thumbnail size.
        const r = el.type === 'capsule' ? Math.min(w, h) / 2 : num(el.borderRadius) * Math.min(w, h) / 100;
        out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${paint}/>`);
    }

    // A label inside a node — the bar is what makes a flowchart look populated.
    if (typeof el.containerText === 'string' && el.containerText.trim() && w > 8 && h > 6) {
        const bw = w * 0.5, bh = Math.max(1, Math.min(h * 0.18, 14));
        out.push(`<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${col(el.textColor || el.strokeColor, '#475569')}" opacity="${0.45 * op}"/>`);
    }
    return out;
}

/** Union of every drawable element's bounds (lines included, via their deltas). */
function boundsOf(els: any[]): Box | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of els) {
        const x = num(el.x), y = num(el.y), w = num(el.width), h = num(el.height);
        // width/height are deltas for lines and may be negative for any element.
        minX = Math.min(minX, x, x + w); maxX = Math.max(maxX, x, x + w);
        minY = Math.min(minY, y, y + h); maxY = Math.max(maxY, y, y + h);
    }
    if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * Gradient ids must be unique across the whole DOCUMENT, not the svg — several
 * previews sit inline in the template grid at once, and `url(#id)` resolves to the
 * first match anywhere on the page, so a shared id would paint every card with the
 * first card's gradient.
 */
let gradSeq = 0;

/** Background rect for a page — solid colour or its gradient's first→last stop. */
function pageBackground(page: any, box: Box): { defs: string; rect: string } {
    const stops = page?.gradientStops;
    const from = col(stops?.[0]?.color || page?.backgroundColor, '#e2e8f0');
    const to = col(stops?.[stops.length - 1]?.color, from);
    if (from === to) {
        return { defs: '', rect: `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="${from}"/>` };
    }
    const id = `tpbg${gradSeq++}`;
    return {
        defs: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`,
        rect: `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#${id})"/>`,
    };
}

/**
 * An SVG thumbnail of a template's page/slide at `pageIndex`, or of a diagram's
 * elements (which have no pages, so the index is ignored).
 * Scales to its container (`width/height = 100%`), so the caller sizes it via CSS.
 * Returns null when the template has nothing previewable.
 */
export function templatePreviewSvg(tpl: any, pageIndex = 0, sizePx?: number): string | null {
    if (!tpl || tpl.dslContent || tpl.doc) return null;

    // Design page (fixed pageSize) → presentation slide (16:9) → diagram elements.
    const designPage = tpl.pageSize ? tpl.pages?.[pageIndex] : undefined;
    const slide = tpl.slides?.[pageIndex];
    const page = designPage || slide;
    const els: any[] = (page ? page.elements : tpl.data?.elements) || [];
    if (!Array.isArray(els) || els.length === 0) {
        // A blank page still previews as its background; a diagram with no elements doesn't.
        if (!page) return null;
    }

    let box: Box;
    let bg = { defs: '', rect: '' };
    if (page) {
        const size = designPage ? tpl.pageSize : SLIDE_SIZE;
        box = { x: 0, y: 0, w: num(size?.width, 1080), h: num(size?.height, 1080) };
        bg = pageBackground(page, box);
    } else {
        // Diagrams have no page — frame the content itself, with a little breathing room.
        const b = boundsOf(els);
        if (!b) return null;
        const pad = Math.max(b.w, b.h) * DIAGRAM_PAD;
        box = { x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 };
        const canvasBg = tpl.data?.canvasBackgroundColor;
        if (isPaint(canvasBg)) {
            bg.rect = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="${col(canvasBg, '#ffffff')}"/>`;
        }
    }

    const parts: string[] = [bg.rect];
    for (const el of els.slice(0, MAX_PREVIEW_ELS)) parts.push(...markFor(el));

    // Inline in the DOM: size to the container via CSS. Standalone (an <img> src or a
    // stored thumbnail): an SVG with percentage dimensions has no intrinsic size to
    // scale from, so bound the long edge in real pixels instead.
    let dims = 'width="100%" height="100%"';
    if (sizePx) {
        const scale = sizePx / Math.max(box.w, box.h);
        dims = `width="${Math.round(box.w * scale)}" height="${Math.round(box.h * scale)}"`;
    }

    return `<svg viewBox="${box.x} ${box.y} ${box.w} ${box.h}" ${dims}`
        + ` preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">`
        + (bg.defs ? `<defs>${bg.defs}</defs>` : '')
        + parts.join('')
        + `</svg>`;
}

/**
 * The same preview as a `data:` URL, for the places a thumbnail is stored as a string
 * and rendered with `<img src>` (user templates). SVG rather than a raster capture
 * because it's a few hundred bytes and doesn't need a canvas — but note it's the
 * simplified-marks preview, so prefer a real `exportPageToPng` capture where one is
 * available and use this as the fallback.
 */
export function templatePreviewDataUrl(tpl: any, sizePx = 320): string | null {
    const svg = templatePreviewSvg(tpl, 0, sizePx);
    return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : null;
}
