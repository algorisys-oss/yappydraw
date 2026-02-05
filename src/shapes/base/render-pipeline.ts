import type { Options } from "roughjs/bin/core";
import type { DrawingElement } from "../../types";
import { getShapeGeometry } from "../../utils/shape-geometry";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import type { RenderContext } from "./types";

export class RenderPipeline {
    static adjustColor(color: string, _isDarkMode: boolean) {
        // Theme only affects UI chrome, not canvas content.
        // Shape colors are always rendered as stored — WYSIWYG.
        return color;
    }

    static shadeColor(color: string, percent: number) {
        // Return transparent as is
        if (color === 'transparent' || color === 'none' || !color) return color;

        let R: number, G: number, B: number;

        if (color.startsWith('#')) {
            const hex = color.slice(1);
            if (hex.length === 3 || hex.length === 4) {
                // Shorthand #RGB or #RGBA
                R = parseInt(hex[0] + hex[0], 16);
                G = parseInt(hex[1] + hex[1], 16);
                B = parseInt(hex[2] + hex[2], 16);
            } else {
                R = parseInt(hex.substring(0, 2), 16);
                G = parseInt(hex.substring(2, 4), 16);
                B = parseInt(hex.substring(4, 6), 16);
            }
        } else if (color.startsWith('rgb')) {
            // rgb(R, G, B) or rgba(R, G, B, A)
            const match = color.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
            if (match) {
                R = parseInt(match[1]);
                G = parseInt(match[2]);
                B = parseInt(match[3]);
            } else {
                return color; // Can't parse, return as-is
            }
        } else {
            return color; // Named color or unknown format, return as-is
        }

        if (isNaN(R!) || isNaN(G!) || isNaN(B!)) return color;

        R = Math.min(255, Math.floor(R! * percent));
        G = Math.min(255, Math.floor(G! * percent));
        B = Math.min(255, Math.floor(B! * percent));

        const RR = R.toString(16).padStart(2, '0');
        const GG = G.toString(16).padStart(2, '0');
        const BB = B.toString(16).padStart(2, '0');

        return "#" + RR + GG + BB;
    }

    /**
     * Applies standard transformations (opacity, blend mode, rotation) to the context.
     * Returns the center coordinates (cx, cy) for further use.
     */
    static applyTransformations(ctx: CanvasRenderingContext2D, el: DrawingElement, layerOpacity: number): { cx: number; cy: number } {
        ctx.save();
        ctx.globalAlpha = ((el.opacity ?? 100) / 100) * layerOpacity;

        // Apply Blend Mode
        if (el.blendMode) {
            ctx.globalCompositeOperation = el.blendMode === 'normal'
                ? 'source-over'
                : el.blendMode as GlobalCompositeOperation;
        }

        // Apply Drop Shadow
        if (el.shadowEnabled) {
            ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = el.shadowBlur || 10;
            ctx.shadowOffsetX = el.shadowOffsetX || 5;
            ctx.shadowOffsetY = el.shadowOffsetY || 5;
        } else {
            ctx.shadowColor = 'transparent';
        }

        const angle = el.angle || 0;
        let finalAngle = angle;
        let finalX = el.x;
        let finalY = el.y;

        const cx = finalX + el.width / 2;
        const cy = finalY + el.height / 2;

        if (finalAngle || el.flipX || el.flipY) {
            ctx.translate(cx, cy);
            if (finalAngle) ctx.rotate(finalAngle);
            if (el.flipX || el.flipY) ctx.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
            ctx.translate(-cx, -cy);
        }

        return { cx, cy };
    }

    static restoreTransformations(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }

    /**
     * Applies stroke properties (color, width, dash) to the context.
     */
    static applyStrokeStyle(ctx: CanvasRenderingContext2D, el: DrawingElement, isDarkMode: boolean) {
        ctx.strokeStyle = this.adjustColor(el.strokeColor, isDarkMode);
        ctx.lineWidth = el.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = (el.strokeLineJoin as CanvasLineJoin) || 'round';

        if (el.strokeStyle === 'dashed') {
            ctx.setLineDash([8, 8]);
        } else if (el.strokeStyle === 'dotted') {
            ctx.setLineDash([2, 4]);
        } else {
            ctx.setLineDash([]);
        }
    }

    /**
     * Builds RoughJS options based on element properties.
     */
    static buildRenderOptions(el: DrawingElement, isDarkMode: boolean): Options {
        const stroke = this.adjustColor(el.strokeColor, isDarkMode);
        let fill = el.backgroundColor === 'transparent' ? undefined : this.adjustColor(el.backgroundColor, isDarkMode);

        // Suppress RoughJS fill if complex fill (gradient/dots) is active
        // Also use 'solid' fillStyle for RoughJS since it doesn't understand gradient types
        const isComplexFill = ['linear', 'radial', 'conic', 'dots'].includes(el.fillStyle as string);
        if (isComplexFill) {
            fill = undefined;
        }

        const density = el.fillDensity || 1;
        const baseGap = 5;
        const hachureGap = Math.max(0.5, baseGap / density);

        // RoughJS fillStyle - use 'solid' for gradient types since we handle those separately
        const roughFillStyle = isComplexFill ? 'solid' : el.fillStyle;

        return {
            stroke,
            fill,
            fillStyle: roughFillStyle as any,
            strokeWidth: el.strokeWidth,
            hachureAngle: 60,
            hachureGap: hachureGap,
            roughness: el.roughness ?? 1,
            seed: el.seed || 1,
            disableMultiStroke: el.roughness === 0,
            strokeLineDash: el.strokeStyle === 'dashed' ? [8, 8] : el.strokeStyle === 'dotted' ? [2, 4] : undefined,
        };
    }

    /**
     * Applies gradient or complex fills using ShapeGeometry.
     */
    static applyComplexFills(context: RenderContext, cx: number, cy: number) {
        const { ctx, element: el } = context;
        const fillStyle = el.fillStyle;

        const useGradient = (['linear', 'radial', 'conic'].includes(fillStyle as string)) ||
            ((el.gradientType as any) !== 'none' && el.gradientType !== undefined);
        const useDots = fillStyle === 'dots';

        if (!useGradient && !useDots) return;

        ctx.save();
        ctx.translate(cx, cy);

        if (useGradient) {
            ctx.beginPath();
            this.applyGradient(ctx, el);
        } else if (useDots) {
            ctx.beginPath();
            this.applyDotsFill(ctx, el, context.isDarkMode);
        }

        const geometry = getShapeGeometry(el);
        if (geometry) {
            this.renderGeometry(ctx, geometry);
            ctx.fill();
        }

        ctx.restore();
    }

    private static applyGradient(ctx: CanvasRenderingContext2D, el: DrawingElement) {
        const w = el.width;
        const h = el.height;
        const mw = w / 2;
        const mh = h / 2;
        const gType = el.gradientType || el.fillStyle || 'linear';

        let grad: CanvasGradient;

        if (gType === 'linear') {
            const angleRad = (el.gradientDirection || 45) * (Math.PI / 180);
            const r = Math.sqrt(mw ** 2 + mh ** 2);
            const x1 = -Math.cos(angleRad) * r;
            const y1 = -Math.sin(angleRad) * r;
            const x2 = Math.cos(angleRad) * r;
            const y2 = Math.sin(angleRad) * r;
            grad = ctx.createLinearGradient(x1, y1, x2, y2);
        } else if (gType === 'radial') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            const radius = Math.max(w, h) / 2;
            const focalOffset = radius * 0.4; // 40% offset for focal point
            const fx = Math.cos(angleRad) * focalOffset;
            const fy = Math.sin(angleRad) * focalOffset;
            grad = ctx.createRadialGradient(fx, fy, 0, 0, 0, radius);
        } else if (gType === 'conic') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            grad = (ctx as any).createConicGradient(angleRad, 0, 0);
        } else {
            grad = ctx.createLinearGradient(-mw, -mh, mw, mh);
        }

        if (el.gradientStops && el.gradientStops.length > 0) {
            [...el.gradientStops]
                .sort((a, b) => a.offset - b.offset)
                .forEach(stop => grad.addColorStop(stop.offset, stop.color));
        } else if (el.gradientStart && el.gradientEnd) {
            grad.addColorStop(0, el.gradientStart);
            grad.addColorStop(1, el.gradientEnd);
        }

        ctx.fillStyle = grad;
    }

    private static _dotPatternCache = new Map<string, CanvasPattern | null>();

    private static applyDotsFill(ctx: CanvasRenderingContext2D, el: DrawingElement, _isDarkMode: boolean) {
        const density = el.fillDensity || 1;
        const color = el.strokeColor || '#000000';
        const strokeW = el.strokeWidth / 2 || 1;
        const gap = Math.max(5, 20 / density);

        // Cache pattern by its visual parameters
        const cacheKey = `${color}|${density}|${strokeW}`;
        let pattern = this._dotPatternCache.get(cacheKey);
        if (pattern === undefined) {
            const dotCanvas = document.createElement('canvas');
            dotCanvas.width = gap;
            dotCanvas.height = gap;
            const dotCtx = dotCanvas.getContext('2d');
            if (dotCtx) {
                dotCtx.fillStyle = color;
                dotCtx.beginPath();
                dotCtx.arc(gap / 2, gap / 2, strokeW, 0, Math.PI * 2);
                dotCtx.fill();
                pattern = ctx.createPattern(dotCanvas, 'repeat');
            } else {
                pattern = null;
            }
            // Evict if cache grows too large
            if (this._dotPatternCache.size > 100) this._dotPatternCache.clear();
            this._dotPatternCache.set(cacheKey, pattern!);
        }
        if (pattern) ctx.fillStyle = pattern;
    }

    static renderGeometry(ctx: CanvasRenderingContext2D, geo: any) {
        if (geo.type === 'rect') {
            ctx.roundRect(geo.x, geo.y, geo.w, geo.h, geo.r || 0);
        } else if (geo.type === 'ellipse') {
            ctx.ellipse(geo.cx, geo.cy, geo.rx, geo.ry, 0, 0, Math.PI * 2);
        } else if (geo.type === 'points') {
            if (geo.points.length > 0) {
                ctx.moveTo(geo.points[0].x, geo.points[0].y);
                for (let i = 1; i < geo.points.length; i++) ctx.lineTo(geo.points[i].x, geo.points[i].y);
                if (geo.isClosed !== false) ctx.closePath();
            }
        } else if (geo.type === 'path') {
            ctx.fill(new Path2D(geo.path));
        } else if (geo.type === 'multi') {
            geo.shapes.forEach((s: any) => this.renderGeometry(ctx, s));
        }
    }

    static renderText(context: RenderContext, cx: number, cy: number) {
        const { ctx, element: el, isDarkMode } = context;
        if (el.isEditing) return; // Don't render text if we're currently editing it

        const textStr = el.containerText || el.text;
        if (!textStr) return;

        ctx.save();

        let maxWidth = el.width - 20;
        let startYOffset = 0;

        // Specialized offsets for different shapes
        if (el.type === 'doubleBanner') {
            maxWidth = el.width * 0.65;
            startYOffset = - (el.height * 0.1);
        } else if (el.type === 'starPerson') {
            startYOffset = el.height * 0.15;
        } else if (el.type === 'lightbulb') {
            maxWidth = el.width * 0.7;
            startYOffset = - (el.height * 0.1);
        } else if (el.type === 'signpost') {
            maxWidth = el.width * 0.8;
            startYOffset = - (el.height * 0.15);
        } else if (el.type === 'browserWindow') {
            const headerH = Math.min(el.height * 0.15, 30);
            startYOffset = headerH / 2;
        } else if (el.type === 'mobilePhone') {
            startYOffset = - (el.height * 0.05);
        }

        const metrics = measureContainerText(ctx, el, textStr, maxWidth);

        ctx.font = getFontString(el);

        // Resolve Text Color
        const textColorRaw = el.textColor || el.strokeColor;
        const textColor = this.adjustColor(textColorRaw, isDarkMode);

        // Apply text alignment (default to center for containerText)
        const textAlign = el.textAlign || 'center';
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';

        const startY = cy - metrics.textHeight / 2 + metrics.lineHeight / 2 + startYOffset;

        // Fine-tune baseline shift for better visual centering (font dependent)
        const baselineShift = el.fontFamily === 'hand-drawn' ? 2 : 0;
        const textYAdjusted = startY + baselineShift;

        // Calculate x position based on alignment
        const getXPosition = () => {
            if (textAlign === 'left') {
                return cx - (el.width || maxWidth) / 2 + 10;
            } else if (textAlign === 'right') {
                return cx + (el.width || maxWidth) / 2 - 10;
            }
            return cx; // center
        };

        // Render Highlight
        if (el.textHighlightEnabled) {
            const highlightColor = el.textHighlightColor || 'rgba(255, 255, 0, 0.4)';
            const padding = el.textHighlightPadding ?? 4;
            const radius = el.textHighlightRadius ?? 2;

            ctx.fillStyle = this.adjustColor(highlightColor, isDarkMode);

            metrics.lines.forEach((line, index) => {
                const y = textYAdjusted + index * metrics.lineHeight;
                const lineWidth = ctx.measureText(line).width;
                const xPos = getXPosition();

                // Vertical padding adjustment to make it look centered
                const vPadding = padding / 2;

                // Calculate highlight x position based on alignment
                let highlightX = xPos - lineWidth / 2 - padding;
                if (textAlign === 'left') {
                    highlightX = xPos - padding;
                } else if (textAlign === 'right') {
                    highlightX = xPos - lineWidth - padding;
                }

                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(
                        highlightX,
                        y - metrics.lineHeight / 2 - vPadding,
                        lineWidth + padding * 2,
                        metrics.lineHeight + vPadding * 2,
                        radius
                    );
                } else {
                    // Fallback for older browsers
                    ctx.rect(
                        highlightX,
                        y - metrics.lineHeight / 2 - vPadding,
                        lineWidth + padding * 2,
                        metrics.lineHeight + vPadding * 2
                    );
                }
                ctx.fill();
            });
        }

        // Render Lines
        ctx.fillStyle = textColor;
        metrics.lines.forEach((line, index) => {
            const y = textYAdjusted + index * metrics.lineHeight;
            const xPos = getXPosition();
            ctx.fillText(line, xPos, y, el.width - 10);
        });

        ctx.restore();
    }
}
