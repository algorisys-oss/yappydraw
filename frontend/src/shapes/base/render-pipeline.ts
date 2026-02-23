import type { Options } from "roughjs/bin/core";
import type { DrawingElement } from "../../types";
import { getShapeGeometry } from "../../utils/shape-geometry";
import { getFontString, measureContainerText } from "../../utils/text-utils";
import { layoutRichText, buildSpanFontString } from "../../utils/rich-text-utils";
import type { RenderContext } from "./types";
import { getUIShapeDef } from "../../config/ui-shape-defs";
import { buildFilterString } from "../../utils/image-filter-utils";
import type { IRenderer } from "../../rendering/IRenderer";

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
    static applyTransformations(renderer: IRenderer, el: DrawingElement, layerOpacity: number): { cx: number; cy: number } {
        renderer.save();
        renderer.globalAlpha = ((el.opacity ?? 100) / 100) * layerOpacity;

        // Apply Blend Mode
        if (el.blendMode) {
            renderer.globalCompositeOperation = el.blendMode === 'normal'
                ? 'source-over'
                : el.blendMode;
        }

        // Apply Drop Shadow
        if (el.shadowEnabled) {
            renderer.shadowColor = el.shadowColor || 'rgba(0,0,0,0.3)';
            renderer.shadowBlur = el.shadowBlur || 10;
            renderer.shadowOffsetX = el.shadowOffsetX || 5;
            renderer.shadowOffsetY = el.shadowOffsetY || 5;
        } else {
            renderer.shadowColor = 'transparent';
        }

        // Apply CSS Filter (for images with filter properties)
        if (el.type === 'image') {
            const filterStr = buildFilterString(el);
            if (filterStr !== 'none') {
                renderer.filter = filterStr;
            }
        }

        const angle = el.angle || 0;
        let finalAngle = angle;
        let finalX = el.x;
        let finalY = el.y;

        const cx = finalX + el.width / 2;
        const cy = finalY + el.height / 2;

        if (finalAngle || el.flipX || el.flipY) {
            renderer.translate(cx, cy);
            if (finalAngle) renderer.rotate(finalAngle);
            if (el.flipX || el.flipY) renderer.scale(el.flipX ? -1 : 1, el.flipY ? -1 : 1);
            renderer.translate(-cx, -cy);
        }

        return { cx, cy };
    }

    static restoreTransformations(renderer: IRenderer) {
        renderer.restore();
    }

    /**
     * Applies stroke properties (color, width, dash) to the context.
     */
    static applyStrokeStyle(renderer: IRenderer, el: DrawingElement, isDarkMode: boolean) {
        renderer.strokeStyle = this.adjustColor(el.strokeColor, isDarkMode);
        renderer.lineWidth = el.strokeWidth;
        renderer.lineCap = 'round';
        renderer.lineJoin = (el.strokeLineJoin as CanvasLineJoin) || 'round';

        if (el.strokeStyle === 'dashed') {
            renderer.setLineDash([8, 8]);
        } else if (el.strokeStyle === 'dotted') {
            renderer.setLineDash([2, 4]);
        } else {
            renderer.setLineDash([]);
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
        const { renderer, element: el } = context;
        const fillStyle = el.fillStyle;

        const useGradient = (['linear', 'radial', 'conic'].includes(fillStyle as string)) ||
            ((el.gradientType as any) !== 'none' && el.gradientType !== undefined);
        const useDots = fillStyle === 'dots';

        if (!useGradient && !useDots) return;

        renderer.save();
        renderer.translate(cx, cy);

        if (useGradient) {
            renderer.beginPath();
            this.applyGradient(renderer, el);
        } else if (useDots) {
            renderer.beginPath();
            this.applyDotsFill(renderer, el, context.isDarkMode);
        }

        const geometry = getShapeGeometry(el);
        if (geometry) {
            this.renderGeometry(renderer, geometry);
            renderer.fill();
        }

        renderer.restore();
    }

    private static applyGradient(renderer: IRenderer, el: DrawingElement) {
        const w = el.width;
        const h = el.height;
        const mw = w / 2;
        const mh = h / 2;
        const gType = el.gradientType || el.fillStyle || 'linear';

        let grad;

        if (gType === 'linear') {
            const angleRad = (el.gradientDirection || 45) * (Math.PI / 180);
            const r = Math.sqrt(mw ** 2 + mh ** 2);
            const x1 = -Math.cos(angleRad) * r;
            const y1 = -Math.sin(angleRad) * r;
            const x2 = Math.cos(angleRad) * r;
            const y2 = Math.sin(angleRad) * r;
            grad = renderer.createLinearGradient(x1, y1, x2, y2);
        } else if (gType === 'radial') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            const radius = Math.max(w, h) / 2;
            const focalOffset = radius * 0.4; // 40% offset for focal point
            const fx = Math.cos(angleRad) * focalOffset;
            const fy = Math.sin(angleRad) * focalOffset;
            grad = renderer.createRadialGradient(fx, fy, 0, 0, 0, radius);
        } else if (gType === 'conic') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            grad = renderer.createConicGradient(angleRad, 0, 0);
        } else {
            grad = renderer.createLinearGradient(-mw, -mh, mw, mh);
        }

        if (el.gradientStops && el.gradientStops.length > 0) {
            [...el.gradientStops]
                .sort((a, b) => a.offset - b.offset)
                .forEach(stop => grad.addColorStop(stop.offset, stop.color));
        } else if (el.gradientStart && el.gradientEnd) {
            grad.addColorStop(0, el.gradientStart);
            grad.addColorStop(1, el.gradientEnd);
        }

        renderer.fillStyle = grad;
    }

    private static _dotPatternCache = new Map<string, any>();

    private static applyDotsFill(renderer: IRenderer, el: DrawingElement, _isDarkMode: boolean) {
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
                pattern = renderer.createPattern(dotCanvas, 'repeat');
            } else {
                pattern = null;
            }
            // Evict if cache grows too large
            if (this._dotPatternCache.size > 100) this._dotPatternCache.clear();
            this._dotPatternCache.set(cacheKey, pattern!);
        }
        if (pattern) renderer.fillStyle = pattern;
    }

    static renderGeometry(renderer: IRenderer, geo: any) {
        if (geo.type === 'rect') {
            renderer.roundRect(geo.x, geo.y, geo.w, geo.h, geo.r || 0);
        } else if (geo.type === 'ellipse') {
            renderer.ellipse(geo.cx, geo.cy, geo.rx, geo.ry, 0, 0, Math.PI * 2);
        } else if (geo.type === 'points') {
            if (geo.points.length > 0) {
                renderer.moveTo(geo.points[0].x, geo.points[0].y);
                for (let i = 1; i < geo.points.length; i++) renderer.lineTo(geo.points[i].x, geo.points[i].y);
                if (geo.isClosed !== false) renderer.closePath();
            }
        } else if (geo.type === 'path') {
            renderer.fillPath(geo.path);
        } else if (geo.type === 'multi') {
            geo.shapes.forEach((s: any) => this.renderGeometry(renderer, s));
        }
    }

    static renderText(context: RenderContext, cx: number, cy: number) {
        const { renderer, element: el, isDarkMode } = context;
        if (el.isEditing) return; // Don't render text if we're currently editing it

        // Rich text path — render per-span formatting
        if (el.richContainerText && el.richContainerText.length > 0) {
            this.renderRichText(context, cx, cy);
            return;
        }

        const textStr = el.containerText || el.text;
        if (!textStr) return;

        renderer.save();

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
        } else {
            const uiDef = getUIShapeDef(el.type);
            if (uiDef?.textYOffset) {
                startYOffset = uiDef.textYOffset(el);
            }
        }

        const metrics = measureContainerText(renderer, el, textStr, maxWidth);

        renderer.font = getFontString(el);

        // Resolve Text Color
        const textColorRaw = el.textColor || el.strokeColor || '#000000';
        const textColor = this.adjustColor(textColorRaw, isDarkMode);

        // Apply text alignment (default to center for containerText)
        const textAlign = el.textAlign || 'center';
        renderer.textAlign = textAlign;
        renderer.textBaseline = 'middle';

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

            renderer.fillStyle = this.adjustColor(highlightColor, isDarkMode);

            metrics.lines.forEach((line, index) => {
                const y = textYAdjusted + index * metrics.lineHeight;
                const lineWidth = renderer.measureText(line).width;
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

                renderer.beginPath();
                renderer.roundRect(
                    highlightX,
                    y - metrics.lineHeight / 2 - vPadding,
                    lineWidth + padding * 2,
                    metrics.lineHeight + vPadding * 2,
                    radius
                );
                renderer.fill();
            });
        }

        // Render Lines
        renderer.fillStyle = textColor;
        metrics.lines.forEach((line, index) => {
            const y = textYAdjusted + index * metrics.lineHeight;
            const xPos = getXPosition();
            renderer.fillText(line, xPos, y, el.width - 10);
        });

        renderer.restore();
    }

    /**
     * Render rich text (per-span formatting) inside a shape container.
     */
    static renderRichText(context: RenderContext, cx: number, cy: number) {
        const { renderer, element: el, isDarkMode } = context;
        const spans = el.richContainerText!;

        renderer.save();

        let maxWidth = el.width - 20;
        let startYOffset = 0;

        if (el.type === 'doubleBanner') {
            maxWidth = el.width * 0.65;
            startYOffset = -(el.height * 0.1);
        } else if (el.type === 'starPerson') {
            startYOffset = el.height * 0.15;
        } else if (el.type === 'lightbulb') {
            maxWidth = el.width * 0.7;
            startYOffset = -(el.height * 0.1);
        } else if (el.type === 'signpost') {
            maxWidth = el.width * 0.8;
            startYOffset = -(el.height * 0.15);
        } else {
            const uiDef = getUIShapeDef(el.type);
            if (uiDef?.textYOffset) {
                startYOffset = uiDef.textYOffset(el);
            }
        }

        const defaults = { fontSize: el.fontSize || 28, fontFamily: el.fontFamily || 'hand-drawn' };
        const layout = layoutRichText(renderer, spans, maxWidth, defaults);

        const textAlign = el.textAlign || 'center';
        const startY = cy - layout.totalHeight / 2 + startYOffset;

        // Accumulate y offset per line
        let lineY = startY;
        for (let lineIdx = 0; lineIdx < layout.lineCount; lineIdx++) {
            const lineHeight = layout.lineHeights[lineIdx];
            const lineSegments = layout.segments.filter(s => s.lineIndex === lineIdx);

            // Calculate total line width for alignment
            let lineWidth = 0;
            if (lineSegments.length > 0) {
                const last = lineSegments[lineSegments.length - 1];
                lineWidth = last.x + last.width;
            }

            // Calculate x offset based on text alignment
            let xOffset: number;
            if (textAlign === 'left') {
                xOffset = cx - maxWidth / 2;
            } else if (textAlign === 'right') {
                xOffset = cx + maxWidth / 2 - lineWidth;
            } else {
                xOffset = cx - lineWidth / 2;
            }

            const baselineY = lineY + lineHeight / 2;

            // Track if we've drawn a list marker for this line
            let listMarkerDrawn = false;
            const INDENT_SIZE = 20;

            for (const seg of lineSegments) {
                const span = seg.span;
                renderer.font = buildSpanFontString(span, defaults);
                const color = span.color || el.textColor || el.strokeColor;
                renderer.fillStyle = this.adjustColor(color, isDarkMode);
                renderer.textBaseline = 'middle';
                renderer.textAlign = 'left';

                // Draw list marker (bullet or number) before first segment of list item
                if (!listMarkerDrawn && span.listType && span.listType !== 'none') {
                    const listLevel = span.listLevel || 0;
                    const indent = listLevel * INDENT_SIZE;
                    const markerX = xOffset + indent;

                    if (span.listType === 'bullet') {
                        // Draw bullet point
                        const bulletChar = '•';
                        renderer.fillText(bulletChar, markerX, baselineY);
                    } else if (span.listType === 'ordered') {
                        // Draw number
                        const number = `${span.listIndex || 1}.`;
                        renderer.fillText(number, markerX, baselineY);
                    }
                    listMarkerDrawn = true;
                }

                renderer.fillText(seg.text, xOffset + seg.x, baselineY);

                // Draw underline
                if (span.underline) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    renderer.beginPath();
                    renderer.strokeStyle = renderer.fillStyle as string;
                    renderer.lineWidth = Math.max(1, fontSize / 14);
                    renderer.moveTo(xOffset + seg.x, baselineY + fontSize * 0.35);
                    renderer.lineTo(xOffset + seg.x + seg.width, baselineY + fontSize * 0.35);
                    renderer.stroke();
                }

                // Draw strikethrough
                if (span.strikethrough) {
                    const fontSize = span.fontSize || defaults.fontSize;
                    renderer.beginPath();
                    renderer.strokeStyle = renderer.fillStyle as string;
                    renderer.lineWidth = Math.max(1, fontSize / 14);
                    renderer.moveTo(xOffset + seg.x, baselineY);
                    renderer.lineTo(xOffset + seg.x + seg.width, baselineY);
                    renderer.stroke();
                }
            }

            lineY += lineHeight;
        }

        renderer.restore();
    }
}
