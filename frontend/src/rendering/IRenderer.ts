/**
 * IRenderer — Abstract rendering interface for YappyDraw.
 *
 * Mirrors the Canvas 2D API surface used across all 29 shape renderers,
 * enabling alternative backends (Raylib, SVG, WebGL, etc.) without
 * restructuring renderer logic.
 *
 * Migration: replace `ctx: CanvasRenderingContext2D` → `renderer: IRenderer`
 * and all Canvas calls map 1:1 to interface methods.
 */

// ── Supporting Types ──

export interface ICanvasGradient {
    addColorStop(offset: number, color: string): void;
}

export interface ICanvasPattern {}

export type FillStyle = string | ICanvasGradient | ICanvasPattern;

export interface TextMetrics {
    width: number;
}

// ── Main Renderer Interface ──

export interface IRenderer {
    // ── State Management ──
    save(): void;
    restore(): void;

    // ── Transforms ──
    translate(x: number, y: number): void;
    rotate(angle: number): void;
    scale(x: number, y: number): void;
    /** Multiply the current matrix by [[a,c,e],[b,d,f]] (canvas `transform` semantics). */
    transform(a: number, b: number, c: number, d: number, e: number, f: number): void;

    // ── Path Building ──
    beginPath(): void;
    closePath(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
    rect(x: number, y: number, w: number, h: number): void;
    roundRect(x: number, y: number, w: number, h: number, radii: number | number[]): void;
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;

    // ── Fill & Stroke ──
    fill(fillRule?: CanvasFillRule): void;
    stroke(): void;
    fillRect(x: number, y: number, w: number, h: number): void;
    strokeRect(x: number, y: number, w: number, h: number): void;
    clip(fillRule?: CanvasFillRule): void;

    /** Fill an SVG path string directly (Canvas uses Path2D internally). Pass
     *  'evenodd' for multi-subpath paths so overlapping closed subpaths punch holes. */
    fillPath(svgPath: string, fillRule?: CanvasFillRule): void;
    /** Stroke an SVG path string directly (Canvas uses Path2D internally). */
    strokePath(svgPath: string): void;
    /** Intersect the clip region with an SVG path string (Canvas uses Path2D internally). */
    clipPath(svgPath: string): void;

    // ── Styling Properties ──
    fillStyle: FillStyle;
    strokeStyle: FillStyle;   // string | gradient | pattern (stroke gradients)
    lineWidth: number;
    lineCap: CanvasLineCap;
    lineJoin: CanvasLineJoin;
    setLineDash(segments: number[]): void;
    lineDashOffset: number;

    // ── Compositing & Effects ──
    globalAlpha: number;
    globalCompositeOperation: string;

    // ── Shadows ──
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;

    // ── Filters ──
    filter: string;

    // ── Text ──
    font: string;
    textAlign: CanvasTextAlign;
    textBaseline: CanvasTextBaseline;
    fillText(text: string, x: number, y: number, maxWidth?: number): void;
    measureText(text: string): TextMetrics;

    // ── Gradients & Patterns ──
    createLinearGradient(x0: number, y0: number, x1: number, y1: number): ICanvasGradient;
    createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): ICanvasGradient;
    createConicGradient(startAngle: number, x: number, y: number): ICanvasGradient;
    createPattern(image: any, repetition: string): ICanvasPattern | null;

    // ── Images ──
    drawImage(image: any, dx: number, dy: number, dw?: number, dh?: number): void;
    /** Draw with source cropping (9-arg Canvas drawImage). */
    drawImageCropped(image: any, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
}
