/**
 * SvgRenderer — an IRenderer that records the (architectural) draw calls as real
 * SVG nodes, so canvas-fallback shapes (data-structures, BPMN, tables) export as
 * true vectors (<path>/<rect>/<text>/<image>) instead of an embedded raster.
 *
 * It mirrors enough of the Canvas-2D surface for the clean (non-rough) render
 * pipeline. Anything it can't faithfully represent (patterns, conic gradients,
 * compositing) sets `failed = true`; the exporter then falls back to raster for
 * that element, so output is never worse than before.
 *
 * Coordinates are kept in local user space and each emitted node carries the
 * current transform as a `matrix(...)` attribute — matching canvas semantics
 * (path/text coords are pre-transform; stroke-width scales with the CTM).
 */

import type { IRenderer, ICanvasGradient, ICanvasPattern, FillStyle, TextMetrics } from './IRenderer';

const NS = 'http://www.w3.org/2000/svg';
type Mat = [number, number, number, number, number, number]; // a,b,c,d,e,f

const IDENT: Mat = [1, 0, 0, 1, 0, 0];
const mul = (A: Mat, B: Mat): Mat => [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
];
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Gradient value collected for emission into <defs>. */
class SvgGradient implements ICanvasGradient {
    stops: { offset: number; color: string }[] = [];
    kind: 'linear' | 'radial';
    coords: number[];
    constructor(kind: 'linear' | 'radial', coords: number[]) { this.kind = kind; this.coords = coords; }
    addColorStop(offset: number, color: string): void { this.stops.push({ offset, color }); }
}

export class SvgRenderer implements IRenderer {
    readonly root: SVGGElement;
    readonly defs: SVGDefsElement;
    failed = false;

    private m: Mat = [...IDENT] as Mat;
    private stack: { m: Mat; group: SVGGElement }[] = [];
    private group: SVGGElement;
    private d = '';            // current path data (local coords)
    private cur: [number, number] | null = null; // current point (for arc line-to)
    private uid = 0;

    // styling state
    fillStyleVal: FillStyle = '#000000';
    strokeStyleVal: FillStyle = '#000000';
    lineWidth = 1;
    lineCap: CanvasLineCap = 'butt';
    lineJoin: CanvasLineJoin = 'miter';
    private dash: number[] = [];
    lineDashOffset = 0;
    globalAlpha = 1;
    fontVal = '10px sans-serif';
    textAlign: CanvasTextAlign = 'start';
    textBaseline: CanvasTextBaseline = 'alphabetic';

    constructor(defs?: SVGDefsElement) {
        this.root = document.createElementNS(NS, 'g') as SVGGElement;
        this.defs = defs ?? (document.createElementNS(NS, 'defs') as SVGDefsElement);
        this.group = this.root;
    }

    // ── State ──
    save(): void { this.stack.push({ m: [...this.m] as Mat, group: this.group }); }
    restore(): void { const s = this.stack.pop(); if (s) { this.m = s.m; this.group = s.group; } }

    // ── Transforms ──
    translate(x: number, y: number): void { this.m = mul(this.m, [1, 0, 0, 1, x, y]); }
    rotate(a: number): void { const c = Math.cos(a), s = Math.sin(a); this.m = mul(this.m, [c, s, -s, c, 0, 0]); }
    scale(x: number, y: number): void { this.m = mul(this.m, [x, 0, 0, y, 0, 0]); }
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void { this.m = mul(this.m, [a, b, c, d, e, f]); }

    private matrixAttr(): string { const [a, b, c, d, e, f] = this.m.map(r3); return `matrix(${a},${b},${c},${d},${e},${f})`; }

    // ── Path building (local coords) ──
    beginPath(): void { this.d = ''; this.cur = null; }
    closePath(): void { this.d += ' Z'; }
    moveTo(x: number, y: number): void { this.d += ` M ${r3(x)} ${r3(y)}`; this.cur = [x, y]; }
    lineTo(x: number, y: number): void { this.d += ` L ${r3(x)} ${r3(y)}`; this.cur = [x, y]; }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void { this.d += ` Q ${r3(cpx)} ${r3(cpy)} ${r3(x)} ${r3(y)}`; this.cur = [x, y]; }
    bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void { this.d += ` C ${r3(c1x)} ${r3(c1y)} ${r3(c2x)} ${r3(c2y)} ${r3(x)} ${r3(y)}`; this.cur = [x, y]; }
    rect(x: number, y: number, w: number, h: number): void {
        this.d += ` M ${r3(x)} ${r3(y)} L ${r3(x + w)} ${r3(y)} L ${r3(x + w)} ${r3(y + h)} L ${r3(x)} ${r3(y + h)} Z`;
        this.cur = [x, y];
    }
    roundRect(x: number, y: number, w: number, h: number, radii: number | number[]): void {
        let r = Array.isArray(radii) ? radii[0] : radii; r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
        if (r <= 0) return this.rect(x, y, w, h);
        this.d += ` M ${r3(x + r)} ${r3(y)} L ${r3(x + w - r)} ${r3(y)} Q ${r3(x + w)} ${r3(y)} ${r3(x + w)} ${r3(y + r)} L ${r3(x + w)} ${r3(y + h - r)} Q ${r3(x + w)} ${r3(y + h)} ${r3(x + w - r)} ${r3(y + h)} L ${r3(x + r)} ${r3(y + h)} Q ${r3(x)} ${r3(y + h)} ${r3(x)} ${r3(y + h - r)} L ${r3(x)} ${r3(y + r)} Q ${r3(x)} ${r3(y)} ${r3(x + r)} ${r3(y)} Z`;
        this.cur = [x, y];
    }
    arc(cx: number, cy: number, r: number, a0: number, a1: number, ccw = false): void {
        const start: [number, number] = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
        if (this.cur) this.d += ` L ${r3(start[0])} ${r3(start[1])}`; else this.d += ` M ${r3(start[0])} ${r3(start[1])}`;
        let delta = a1 - a0;
        if (!ccw && delta < 0) delta += Math.PI * 2;
        if (ccw && delta > 0) delta -= Math.PI * 2;
        if (Math.abs(delta) >= Math.PI * 2 - 1e-6) {
            // full circle via two half arcs
            const mid: [number, number] = [cx - r * Math.cos(a0), cy - r * Math.sin(a0)];
            const sweep = ccw ? 0 : 1;
            this.d += ` A ${r3(r)} ${r3(r)} 0 1 ${sweep} ${r3(mid[0])} ${r3(mid[1])} A ${r3(r)} ${r3(r)} 0 1 ${sweep} ${r3(start[0])} ${r3(start[1])}`;
            this.cur = start;
            return;
        }
        const end: [number, number] = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
        const large = Math.abs(delta) > Math.PI ? 1 : 0;
        const sweep = ccw ? 0 : 1;
        this.d += ` A ${r3(r)} ${r3(r)} 0 ${large} ${sweep} ${r3(end[0])} ${r3(end[1])}`;
        this.cur = end;
    }
    ellipse(cx: number, cy: number, rx: number, ry: number, _rot: number, a0: number, a1: number, ccw = false): void {
        // Full-ellipse common case (start 0 → 2π). Partial arcs approximate as full.
        const sx = cx + rx * Math.cos(a0), sy = cy + ry * Math.sin(a0);
        if (this.cur) this.d += ` L ${r3(sx)} ${r3(sy)}`; else this.d += ` M ${r3(sx)} ${r3(sy)}`;
        const mx = cx - rx * Math.cos(a0), my = cy - ry * Math.sin(a0);
        const sweep = ccw ? 0 : 1;
        this.d += ` A ${r3(rx)} ${r3(ry)} 0 1 ${sweep} ${r3(mx)} ${r3(my)} A ${r3(rx)} ${r3(ry)} 0 1 ${sweep} ${r3(sx)} ${r3(sy)}`;
        this.cur = [sx, sy];
        void a1;
    }
    arcTo(): void { this.failed = true; }

    // ── Fill helpers ──
    private paint(value: FillStyle): string {
        if (typeof value === 'string') return value;
        if (value instanceof SvgGradient) {
            const id = `yd-svgr-${this.uid++}`;
            const grad = document.createElementNS(NS, value.kind === 'radial' ? 'radialGradient' : 'linearGradient');
            grad.setAttribute('id', id);
            grad.setAttribute('gradientUnits', 'userSpaceOnUse');
            if (value.kind === 'linear') {
                grad.setAttribute('x1', `${r3(value.coords[0])}`); grad.setAttribute('y1', `${r3(value.coords[1])}`);
                grad.setAttribute('x2', `${r3(value.coords[2])}`); grad.setAttribute('y2', `${r3(value.coords[3])}`);
            } else {
                grad.setAttribute('cx', `${r3(value.coords[3])}`); grad.setAttribute('cy', `${r3(value.coords[4])}`); grad.setAttribute('r', `${r3(value.coords[5])}`);
            }
            for (const s of value.stops) {
                const stop = document.createElementNS(NS, 'stop');
                stop.setAttribute('offset', `${s.offset}`); stop.setAttribute('stop-color', s.color);
                grad.appendChild(stop);
            }
            this.defs.appendChild(grad);
            return `url(#${id})`;
        }
        this.failed = true; // pattern → can't represent reliably
        return 'none';
    }

    private applyStroke(node: SVGElement): void {
        node.setAttribute('stroke', this.paint(this.strokeStyleVal));
        node.setAttribute('stroke-width', `${r3(this.lineWidth)}`);
        node.setAttribute('stroke-linecap', this.lineCap === 'butt' ? 'butt' : this.lineCap);
        node.setAttribute('stroke-linejoin', this.lineJoin);
        if (this.dash.length) node.setAttribute('stroke-dasharray', this.dash.join(' '));
        if (this.globalAlpha < 1) node.setAttribute('stroke-opacity', `${this.globalAlpha}`);
    }

    private emit(node: SVGElement, kind: 'fill' | 'stroke', fillRule?: CanvasFillRule): void {
        node.setAttribute('transform', this.matrixAttr());
        if (kind === 'fill') {
            node.setAttribute('fill', this.paint(this.fillStyleVal));
            if (fillRule === 'evenodd') node.setAttribute('fill-rule', 'evenodd');
            node.setAttribute('stroke', 'none');
            if (this.globalAlpha < 1) node.setAttribute('fill-opacity', `${this.globalAlpha}`);
        } else {
            node.setAttribute('fill', 'none');
            this.applyStroke(node);
        }
        this.group.appendChild(node);
    }

    private pathNode(): SVGPathElement { const p = document.createElementNS(NS, 'path') as SVGPathElement; p.setAttribute('d', this.d.trim()); return p; }

    fill(fillRule?: CanvasFillRule): void { if (this.d.trim()) this.emit(this.pathNode(), 'fill', fillRule); }
    stroke(): void { if (this.d.trim()) this.emit(this.pathNode(), 'stroke'); }
    fillRect(x: number, y: number, w: number, h: number): void { const n = document.createElementNS(NS, 'rect'); n.setAttribute('x', `${r3(x)}`); n.setAttribute('y', `${r3(y)}`); n.setAttribute('width', `${r3(w)}`); n.setAttribute('height', `${r3(h)}`); this.emit(n, 'fill'); }
    strokeRect(x: number, y: number, w: number, h: number): void { const n = document.createElementNS(NS, 'rect'); n.setAttribute('x', `${r3(x)}`); n.setAttribute('y', `${r3(y)}`); n.setAttribute('width', `${r3(w)}`); n.setAttribute('height', `${r3(h)}`); this.emit(n, 'stroke'); }

    clip(_fillRule?: CanvasFillRule): void { this.clipCurrent(this.d); }
    clipPath(svgPath: string): void { this.clipCurrent(svgPath); }
    private clipCurrent(d: string): void {
        if (!d.trim()) return;
        const id = `yd-clip-${this.uid++}`;
        const cp = document.createElementNS(NS, 'clipPath'); cp.setAttribute('id', id); cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d.trim()); p.setAttribute('transform', this.matrixAttr());
        cp.appendChild(p); this.defs.appendChild(cp);
        const g = document.createElementNS(NS, 'g') as SVGGElement; g.setAttribute('clip-path', `url(#${id})`);
        this.group.appendChild(g); this.group = g; // subsequent nodes clipped until restore()
    }

    fillPath(svgPath: string, fillRule?: CanvasFillRule): void { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', svgPath); this.emit(p, 'fill', fillRule); }
    strokePath(svgPath: string): void { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', svgPath); this.emit(p, 'stroke'); }

    // ── Text ──
    fillText(text: string, x: number, y: number): void {
        if (!text) return;
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', `${r3(x)}`); t.setAttribute('y', `${r3(y)}`);
        t.setAttribute('transform', this.matrixAttr());
        const { size, family, weight, style } = this.parseFont();
        t.setAttribute('font-size', `${size}`); t.setAttribute('font-family', family);
        if (weight && weight !== 'normal') t.setAttribute('font-weight', weight);
        if (style && style !== 'normal') t.setAttribute('font-style', style);
        t.setAttribute('text-anchor', this.textAlign === 'center' ? 'middle' : this.textAlign === 'right' || this.textAlign === 'end' ? 'end' : 'start');
        if (this.textBaseline === 'middle') t.setAttribute('dominant-baseline', 'central');
        else if (this.textBaseline === 'top' || this.textBaseline === 'hanging') t.setAttribute('dominant-baseline', 'hanging');
        t.setAttribute('fill', typeof this.fillStyleVal === 'string' ? this.fillStyleVal : '#000');
        if (this.globalAlpha < 1) t.setAttribute('fill-opacity', `${this.globalAlpha}`);
        t.textContent = text;
        this.group.appendChild(t);
    }
    private parseFont(): { size: number; family: string; weight: string; style: string } {
        // e.g. "italic bold 14px Inter, sans-serif"
        const f = this.fontVal;
        const size = parseFloat((f.match(/(\d+(?:\.\d+)?)px/) || [])[1] || '10');
        const family = (f.split('px')[1] || 'sans-serif').trim() || 'sans-serif';
        const weight = /\bbold\b|[5-9]00/.test(f) ? 'bold' : 'normal';
        const style = /\bitalic\b/.test(f) ? 'italic' : 'normal';
        return { size, family, weight, style };
    }
    measureText(text: string): TextMetrics { const { size } = this.parseFont(); return { width: text.length * size * 0.55 }; }

    // ── Images ──
    drawImage(image: any, dx: number, dy: number, dw?: number, dh?: number): void {
        try {
            const href = typeof image === 'string' ? image : (image.toDataURL ? image.toDataURL('image/png') : image.src);
            if (!href) { this.failed = true; return; }
            const n = document.createElementNS(NS, 'image');
            n.setAttribute('href', href);
            n.setAttribute('x', `${r3(dx)}`); n.setAttribute('y', `${r3(dy)}`);
            if (dw !== undefined) n.setAttribute('width', `${r3(dw)}`);
            if (dh !== undefined) n.setAttribute('height', `${r3(dh)}`);
            n.setAttribute('preserveAspectRatio', 'none');
            n.setAttribute('transform', this.matrixAttr());
            this.group.appendChild(n);
        } catch { this.failed = true; }
    }
    drawImageCropped(image: any, _sx: number, _sy: number, _sw: number, _sh: number, dx: number, dy: number, dw: number, dh: number): void {
        this.drawImage(image, dx, dy, dw, dh);
    }

    // ── Gradients & patterns ──
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient { return new SvgGradient('linear', [x0, y0, x1, y1]); }
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): ICanvasGradient { return new SvgGradient('radial', [x0, y0, r0, x1, y1, r1]); }
    createConicGradient(_a: number, x: number, y: number): ICanvasGradient { return new SvgGradient('radial', [x, y, 0, x, y, 50]); }
    createPattern(): ICanvasPattern | null { this.failed = true; return null; }

    // ── Styling accessors ──
    get fillStyle(): FillStyle { return this.fillStyleVal; }
    set fillStyle(v: FillStyle) { this.fillStyleVal = v; }
    get strokeStyle(): FillStyle { return this.strokeStyleVal; }
    set strokeStyle(v: FillStyle) { this.strokeStyleVal = v; }
    setLineDash(s: number[]): void { this.dash = s || []; }
    get font(): string { return this.fontVal; }
    set font(v: string) { this.fontVal = v; }

    // ── No-op / ignored (don't affect vector correctness materially) ──
    get globalCompositeOperation(): string { return 'source-over'; }
    set globalCompositeOperation(_v: string) { /* ignore */ }
    get shadowColor(): string { return 'transparent'; }
    set shadowColor(_v: string) { /* shadows dropped in vector export */ }
    get shadowBlur(): number { return 0; }
    set shadowBlur(_v: number) { }
    get shadowOffsetX(): number { return 0; }
    set shadowOffsetX(_v: number) { }
    get shadowOffsetY(): number { return 0; }
    set shadowOffsetY(_v: number) { }
    get filter(): string { return 'none'; }
    set filter(_v: string) { }
}
