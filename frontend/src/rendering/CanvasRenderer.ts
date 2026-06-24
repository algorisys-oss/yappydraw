/**
 * CanvasRenderer — IRenderer adapter wrapping CanvasRenderingContext2D.
 *
 * Every method delegates directly to the underlying Canvas 2D context.
 * This is the zero-overhead reference implementation: existing Canvas
 * rendering should behave identically after migration.
 */

import type { IRenderer, ICanvasGradient, ICanvasPattern, FillStyle, TextMetrics } from './IRenderer';

export class CanvasRenderer implements IRenderer {
    readonly ctx: CanvasRenderingContext2D;
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    // ── State Management ──
    save(): void { this.ctx.save(); }
    restore(): void { this.ctx.restore(); }

    // ── Transforms ──
    translate(x: number, y: number): void { this.ctx.translate(x, y); }
    rotate(angle: number): void { this.ctx.rotate(angle); }
    scale(x: number, y: number): void { this.ctx.scale(x, y); }

    // ── Path Building ──
    beginPath(): void { this.ctx.beginPath(); }
    closePath(): void { this.ctx.closePath(); }
    moveTo(x: number, y: number): void { this.ctx.moveTo(x, y); }
    lineTo(x: number, y: number): void { this.ctx.lineTo(x, y); }
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }
    rect(x: number, y: number, w: number, h: number): void { this.ctx.rect(x, y, w, h); }
    roundRect(x: number, y: number, w: number, h: number, radii: number | number[]): void {
        this.ctx.roundRect(x, y, w, h, radii);
    }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.ctx.quadraticCurveTo(cpx, cpy, x, y);
    }
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this.ctx.arcTo(x1, y1, x2, y2, radius);
    }

    // ── Fill & Stroke ──
    fill(fillRule?: CanvasFillRule): void {
        if (fillRule) this.ctx.fill(fillRule);
        else this.ctx.fill();
    }
    stroke(): void { this.ctx.stroke(); }
    fillRect(x: number, y: number, w: number, h: number): void { this.ctx.fillRect(x, y, w, h); }
    strokeRect(x: number, y: number, w: number, h: number): void { this.ctx.strokeRect(x, y, w, h); }
    clip(fillRule?: CanvasFillRule): void {
        if (fillRule) this.ctx.clip(fillRule);
        else this.ctx.clip();
    }

    fillPath(svgPath: string, fillRule?: CanvasFillRule): void {
        if (fillRule) this.ctx.fill(new Path2D(svgPath), fillRule);
        else this.ctx.fill(new Path2D(svgPath));
    }
    strokePath(svgPath: string): void {
        this.ctx.stroke(new Path2D(svgPath));
    }
    clipPath(svgPath: string): void {
        this.ctx.clip(new Path2D(svgPath));
    }

    // ── Styling Properties ──
    get fillStyle(): FillStyle { return this.ctx.fillStyle as FillStyle; }
    set fillStyle(value: FillStyle) { this.ctx.fillStyle = value as any; }

    get strokeStyle(): string { return this.ctx.strokeStyle as string; }
    set strokeStyle(value: string) { this.ctx.strokeStyle = value; }

    get lineWidth(): number { return this.ctx.lineWidth; }
    set lineWidth(value: number) { this.ctx.lineWidth = value; }

    get lineCap(): CanvasLineCap { return this.ctx.lineCap; }
    set lineCap(value: CanvasLineCap) { this.ctx.lineCap = value; }

    get lineJoin(): CanvasLineJoin { return this.ctx.lineJoin; }
    set lineJoin(value: CanvasLineJoin) { this.ctx.lineJoin = value; }

    setLineDash(segments: number[]): void { this.ctx.setLineDash(segments); }

    get lineDashOffset(): number { return this.ctx.lineDashOffset; }
    set lineDashOffset(value: number) { this.ctx.lineDashOffset = value; }

    // ── Compositing & Effects ──
    get globalAlpha(): number { return this.ctx.globalAlpha; }
    set globalAlpha(value: number) { this.ctx.globalAlpha = value; }

    get globalCompositeOperation(): string { return this.ctx.globalCompositeOperation; }
    set globalCompositeOperation(value: string) { this.ctx.globalCompositeOperation = value as GlobalCompositeOperation; }

    // ── Shadows ──
    get shadowColor(): string { return this.ctx.shadowColor; }
    set shadowColor(value: string) { this.ctx.shadowColor = value; }

    get shadowBlur(): number { return this.ctx.shadowBlur; }
    set shadowBlur(value: number) { this.ctx.shadowBlur = value; }

    get shadowOffsetX(): number { return this.ctx.shadowOffsetX; }
    set shadowOffsetX(value: number) { this.ctx.shadowOffsetX = value; }

    get shadowOffsetY(): number { return this.ctx.shadowOffsetY; }
    set shadowOffsetY(value: number) { this.ctx.shadowOffsetY = value; }

    // ── Filters ──
    get filter(): string { return this.ctx.filter; }
    set filter(value: string) { this.ctx.filter = value; }

    // ── Text ──
    get font(): string { return this.ctx.font; }
    set font(value: string) { this.ctx.font = value; }

    get textAlign(): CanvasTextAlign { return this.ctx.textAlign; }
    set textAlign(value: CanvasTextAlign) { this.ctx.textAlign = value; }

    get textBaseline(): CanvasTextBaseline { return this.ctx.textBaseline; }
    set textBaseline(value: CanvasTextBaseline) { this.ctx.textBaseline = value; }

    fillText(text: string, x: number, y: number, maxWidth?: number): void {
        if (maxWidth !== undefined) this.ctx.fillText(text, x, y, maxWidth);
        else this.ctx.fillText(text, x, y);
    }

    measureText(text: string): TextMetrics {
        return this.ctx.measureText(text);
    }

    // ── Gradients & Patterns ──
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient {
        return this.ctx.createLinearGradient(x0, y0, x1, y1);
    }
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): ICanvasGradient {
        return this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    }
    createConicGradient(startAngle: number, x: number, y: number): ICanvasGradient {
        return (this.ctx as any).createConicGradient(startAngle, x, y);
    }
    createPattern(image: any, repetition: string): ICanvasPattern | null {
        return this.ctx.createPattern(image, repetition);
    }

    // ── Images ──
    drawImage(image: any, dx: number, dy: number, dw?: number, dh?: number): void {
        if (dw !== undefined && dh !== undefined) {
            this.ctx.drawImage(image, dx, dy, dw, dh);
        } else {
            this.ctx.drawImage(image, dx, dy);
        }
    }

    drawImageCropped(image: any, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
        this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
}
