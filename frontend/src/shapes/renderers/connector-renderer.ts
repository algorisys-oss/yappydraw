import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { normalizePoints, cubicBezier } from "../../utils/render-element";
import { resolveFontFamily } from "../../utils/text-utils";
import { drawTextAlongPath, getElementTextPath } from "../../utils/text-on-path";

export class ConnectorRenderer extends ShapeRenderer {
    /**
     * Override render to bypass the renderCustomPoints check.
     * Connectors need their specialized rendering logic to handle bezier curves,
     * control points, and stroke styles (dashed/dotted) properly.
     */
    render(context: RenderContext) {
        const { renderer, element, layerOpacity } = context;

        // 1. Apply universal transformations (rotation, opacity, shadow)
        const { cx, cy } = RenderPipeline.applyTransformations(renderer, element, layerOpacity);

        // 2. Check for draw-in/draw-out animation
        const dp = element.drawProgress;
        if (dp != null && dp >= 0 && dp < 100) {
            this.renderDrawProgress(context, cx, cy);
        } else {
            // Normal render path - no complex fills for connectors
            // 3. Delegate to specialized rendering methods based on style
            if (element.renderStyle === 'architectural') {
                this.renderArchitectural(context, cx, cy);
            } else {
                this.renderSketch(context, cx, cy);
            }
        }

        // 4. Flow Animation (Marching Ants) - handled in renderArchitectural/renderSketch
        // (already called via renderFlow in those methods)

        // 5. Render text label at the path midpoint
        this.renderConnectorText(context);

        // 6. Restore transformations
        RenderPipeline.restoreTransformations(renderer);
    }

    /**
     * Render containerText at the midpoint of the connector path.
     */
    private renderConnectorText(context: RenderContext): void {
        const { renderer, element: el, isDarkMode } = context;
        const text = el.containerText;
        if (!text || el.isEditing) return;

        // Curved Text: flow the label along the connector path instead of a
        // centered horizontal label at the midpoint.
        if (el.curvedText) {
            const path = getElementTextPath(el);
            if (path) {
                const fontSize = el.fontSize || 14;
                const fontFamily = resolveFontFamily(el.fontFamily);
                renderer.save();
                renderer.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${fontSize}px ${fontFamily}`;
                renderer.fillStyle = RenderPipeline.adjustColor(el.textColor || el.strokeColor || '#000000', isDarkMode);
                drawTextAlongPath(renderer, text, path.points, fontSize, {
                    closed: path.closed,
                    startOffset: el.textPathOffset,
                    letterSpacing: el.textPathSpacing,
                    sideOffset: el.textPathSide === 'outside' ? fontSize * 0.4 : undefined,
                });
                renderer.restore();
                return;
            }
        }

        const pts = normalizePoints(el.points);
        let midX: number, midY: number;

        if (el.curveType === 'bezier') {
            let start, end;
            if (pts.length >= 2) {
                start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
                end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
            } else {
                start = { x: el.x, y: el.y };
                end = { x: el.x + el.width, y: el.y + el.height };
            }
            let cp1, cp2;
            if (el.controlPoints && el.controlPoints.length > 0) {
                cp1 = el.controlPoints[0];
                cp2 = el.controlPoints.length > 1 ? el.controlPoints[1] : cp1;
            } else {
                const w = el.width, h = el.height;
                if (Math.abs(w) > Math.abs(h)) {
                    cp1 = { x: start.x + w / 2, y: start.y };
                    cp2 = { x: end.x - w / 2, y: end.y };
                } else {
                    cp1 = { x: start.x, y: start.y + h / 2 };
                    cp2 = { x: end.x, y: end.y - h / 2 };
                }
            }
            midX = cubicBezier(start.x, cp1.x, cp2.x, end.x, 0.5);
            midY = cubicBezier(start.y, cp1.y, cp2.y, end.y, 0.5);
        } else if (el.curveType === 'elbow' && pts.length >= 2) {
            const isPolyline = !el.startBinding && !el.endBinding;
            if (isPolyline) {
                // Standalone polyline: center text at bounding box center
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (const p of pts) {
                    const px = el.x + p.x, py = el.y + p.y;
                    if (px < minX) minX = px;
                    if (py < minY) minY = py;
                    if (px > maxX) maxX = px;
                    if (py > maxY) maxY = py;
                }
                midX = (minX + maxX) / 2;
                midY = (minY + maxY) / 2;
            } else {
                // Connected elbow: walk segments to find the midpoint by path length
                const segs: { x1: number; y1: number; x2: number; y2: number; len: number }[] = [];
                let totalLen = 0;
                for (let i = 0; i < pts.length - 1; i++) {
                    const x1 = el.x + pts[i].x, y1 = el.y + pts[i].y;
                    const x2 = el.x + pts[i + 1].x, y2 = el.y + pts[i + 1].y;
                    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                    segs.push({ x1, y1, x2, y2, len });
                    totalLen += len;
                }
                const halfLen = totalLen / 2;
                let acc = 0;
                midX = el.x + pts[0].x;
                midY = el.y + pts[0].y;
                for (const seg of segs) {
                    if (acc + seg.len >= halfLen) {
                        const t = (halfLen - acc) / seg.len;
                        midX = seg.x1 + (seg.x2 - seg.x1) * t;
                        midY = seg.y1 + (seg.y2 - seg.y1) * t;
                        break;
                    }
                    acc += seg.len;
                }
            }
        } else {
            // Straight line
            let start, end;
            if (pts.length >= 2) {
                start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
                end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
            } else {
                start = { x: el.x, y: el.y };
                end = { x: el.x + el.width, y: el.y + el.height };
            }
            midX = (start.x + end.x) / 2;
            midY = (start.y + end.y) / 2;
        }

        // Draw text with background for readability
        const fontSize = el.fontSize || 14;
        const fontFamily = resolveFontFamily(el.fontFamily);
        renderer.save();
        renderer.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${fontSize}px ${fontFamily}`;
        renderer.letterSpacing = el.letterSpacing ? `${el.letterSpacing}px` : '0px';
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';

        const lines = text.split('\n');
        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const maxLineWidth = Math.max(...lines.map(l => renderer.measureText(l).width));

        // Background highlight
        const padX = el.textHighlightPadding ?? 6;
        const padY = Math.max(padX / 2, 3);
        const radius = el.textHighlightRadius ?? 3;

        if (el.textHighlightEnabled) {
            const highlightColor = el.textHighlightColor || 'rgba(255, 255, 0, 0.4)';
            renderer.fillStyle = RenderPipeline.adjustColor(highlightColor, isDarkMode);
        } else {
            // Default semi-transparent background for readability
            renderer.fillStyle = isDarkMode ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)';
        }
        renderer.beginPath();
        const rx = midX - maxLineWidth / 2 - padX;
        const ry = midY - totalHeight / 2 - padY;
        const rw = maxLineWidth + padX * 2;
        const rh = totalHeight + padY * 2;
        renderer.moveTo(rx + radius, ry);
        renderer.arcTo(rx + rw, ry, rx + rw, ry + rh, radius);
        renderer.arcTo(rx + rw, ry + rh, rx, ry + rh, radius);
        renderer.arcTo(rx, ry + rh, rx, ry, radius);
        renderer.arcTo(rx, ry, rx + rw, ry, radius);
        renderer.fill();

        // Text color: use textColor if set, fall back to strokeColor
        const textColorRaw = el.textColor || el.strokeColor || '#000000';
        const color = RenderPipeline.adjustColor(textColorRaw, isDarkMode);
        renderer.fillStyle = color;
        const startY = midY - totalHeight / 2 + lineHeight / 2;
        for (let i = 0; i < lines.length; i++) {
            renderer.fillText(lines[i], midX, startY + i * lineHeight);
        }
        renderer.restore();
    }

    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { renderer, element: el, isDarkMode } = context;

        renderer.save();
        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);

        renderer.beginPath();
        this.definePath(renderer, el);
        renderer.stroke();

        this.renderFlow(context);

        // Draw arrowheads
        const pts = normalizePoints(el.points);
        let start, end;
        if (pts.length >= 2) {
            start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
        } else {
            start = { x: el.x, y: el.y };
            end = { x: el.x + el.width, y: el.y + el.height };
        }

        let angle: number;
        if (el.curveType === 'bezier') {
            const cp1 = el.controlPoints?.[0] || { x: start.x, y: start.y };
            const cp2 = el.controlPoints?.[1] || cp1;
            if (el.startArrowhead) {
                const startAngle = Math.atan2(start.y - cp1.y, start.x - cp1.x);
                this.drawArrowheadArchitectural(renderer, start.x, start.y, startAngle, el.startArrowhead, el.startArrowheadSize || 28);
            }
            if (el.endArrowhead) {
                const endAngle = Math.atan2(end.y - cp2.y, end.x - cp2.x);
                this.drawArrowheadArchitectural(renderer, end.x, end.y, endAngle, el.endArrowhead, el.endArrowheadSize || 28);
            }
        } else if (el.curveType === 'elbow' && pts.length >= 2) {
            const p0 = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            const p1 = { x: el.x + pts[1].x, y: el.y + pts[1].y };
            const startAngle = Math.atan2(p0.y - p1.y, p0.x - p1.x);
            if (el.startArrowhead) this.drawArrowheadArchitectural(renderer, p0.x, p0.y, startAngle, el.startArrowhead, el.startArrowheadSize || 28);

            const pn_1 = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
            const pn_2 = { x: el.x + pts[pts.length - 2].x, y: el.y + pts[pts.length - 2].y };
            const endAngle = Math.atan2(pn_1.y - pn_2.y, pn_1.x - pn_2.x);
            if (el.endArrowhead) this.drawArrowheadArchitectural(renderer, pn_1.x, pn_1.y, endAngle, el.endArrowhead, el.endArrowheadSize || 28);
        } else {
            angle = Math.atan2(end.y - start.y, end.x - start.x);
            if (el.startArrowhead) this.drawArrowheadArchitectural(renderer, start.x, start.y, angle + Math.PI, el.startArrowhead, el.startArrowheadSize || 28);
            if (el.endArrowhead) this.drawArrowheadArchitectural(renderer, end.x, end.y, angle, el.endArrowhead, el.endArrowheadSize || 28);
        }

        renderer.restore();
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context, _cx, _cy);
        this.renderFlow(context);
    }

    private renderCommon(context: RenderContext, _cx: number, _cy: number): void {
        const { element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        if (el.curveType === 'bezier') {
            this.renderBezier(context, options);
        } else if (el.curveType === 'elbow') {
            this.renderElbow(context, options);
        } else {
            this.renderStraight(context, options);
        }
    }

    private renderBezier(context: RenderContext, options: any) {
        options = { ...options, fill: undefined }; // Connectors should never have background fill
        const { rc, element: el } = context;
        const endX = el.x + el.width;
        const endY = el.y + el.height;
        const pts = normalizePoints(el.points);

        let start = { x: el.x, y: el.y };
        let end = { x: endX, y: endY };
        if (pts.length >= 2) {
            start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
        }

        if (el.controlPoints && el.controlPoints.length > 0) {
            const cp1 = el.controlPoints[0];
            if (el.controlPoints.length > 1) {
                const cp2 = el.controlPoints[1];
                const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
                rc.path(path, options);
                if (el.startArrowhead) this.drawArrowhead(rc, start.x, start.y, Math.atan2(start.y - cp1.y, start.x - cp1.x), el.startArrowhead, options, el.startArrowheadSize || 28);
                if (el.endArrowhead) this.drawArrowhead(rc, end.x, end.y, Math.atan2(end.y - cp2.y, end.x - cp2.x), el.endArrowhead, options, el.endArrowheadSize || 28);
            } else {
                const path = `M ${start.x} ${start.y} Q ${cp1.x} ${cp1.y}, ${end.x} ${end.y}`;
                rc.path(path, options);
                if (el.startArrowhead) this.drawArrowhead(rc, start.x, start.y, Math.atan2(start.y - cp1.y, start.x - cp1.x), el.startArrowhead, options, el.startArrowheadSize || 28);
                if (el.endArrowhead) this.drawArrowhead(rc, end.x, end.y, Math.atan2(end.y - cp1.y, end.x - cp1.x), el.endArrowhead, options, el.endArrowheadSize || 28);
            }
        } else {
            const w = el.width, h = el.height;
            let cp1, cp2;
            if (Math.abs(w) > Math.abs(h)) {
                cp1 = { x: start.x + w / 2, y: start.y };
                cp2 = { x: end.x - w / 2, y: end.y };
            } else {
                cp1 = { x: start.x, y: start.y + h / 2 };
                cp2 = { x: end.x, y: end.y - h / 2 };
            }
            const path = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
            rc.path(path, options);
            if (el.startArrowhead) this.drawArrowhead(rc, start.x, start.y, Math.atan2(start.y - cp1.y, start.x - cp1.x), el.startArrowhead, options, el.startArrowheadSize || 28);
            if (el.endArrowhead) this.drawArrowhead(rc, end.x, end.y, Math.atan2(end.y - cp2.y, end.x - cp2.x), el.endArrowhead, options, el.endArrowheadSize || 28);
        }
    }

    private renderElbow(context: RenderContext, options: any) {
        const { rc, renderer, element: el } = context;
        const pts = normalizePoints(el.points);
        const drawPoints: [number, number][] = (pts && pts.length > 0)
            ? pts.map(p => [el.x + p.x, el.y + p.y])
            : [[el.x, el.y], [el.x + el.width, el.y + el.height]];

        // Polylines (unbound elbows with 3+ points) support fill via polygon rendering
        const isPolyline = !el.startBinding && !el.endBinding && drawPoints.length >= 3;
        const hasFill = options.fill && options.fill !== 'transparent';

        if (isPolyline && hasFill) {
            rc.polygon(drawPoints, options);
        } else {
            options = { ...options, fill: undefined };
            rc.linearPath(drawPoints, options);
        }

        // Draw vertex dots at polyline joints to cover roughjs gaps
        if (drawPoints.length >= 3) {
            const strokeW = el.strokeWidth || 2;
            const dotRadius = Math.max(strokeW * 0.6, 1.5);
            renderer.save();
            renderer.fillStyle = options.stroke || el.strokeColor || '#000000';
            for (let i = 1; i < drawPoints.length - 1; i++) {
                renderer.beginPath();
                renderer.arc(drawPoints[i][0], drawPoints[i][1], dotRadius, 0, Math.PI * 2);
                renderer.fill();
            }
            renderer.restore();
        }

        const cleanPoints = drawPoints.filter((p, i, self) =>
            i === 0 || Math.abs(p[0] - self[i - 1][0]) > 0.1 || Math.abs(p[1] - self[i - 1][1]) > 0.1
        );

        if (el.startArrowhead && cleanPoints.length >= 2) {
            const angle = Math.atan2(cleanPoints[0][1] - cleanPoints[1][1], cleanPoints[0][0] - cleanPoints[1][0]);
            this.drawArrowhead(rc, cleanPoints[0][0], cleanPoints[0][1], angle, el.startArrowhead, options, el.startArrowheadSize || 28);
        }
        if (el.endArrowhead && cleanPoints.length >= 2) {
            const n = cleanPoints.length;
            const angle = Math.atan2(cleanPoints[n - 1][1] - cleanPoints[n - 2][1], cleanPoints[n - 1][0] - cleanPoints[n - 2][0]);
            this.drawArrowhead(rc, cleanPoints[n - 1][0], cleanPoints[n - 1][1], angle, el.endArrowhead, options, el.endArrowheadSize || 28);
        }
    }

    private renderStraight(context: RenderContext, options: any) {
        options = { ...options, fill: undefined }; // Connectors should never have background fill
        const { rc, element: el } = context;
        const pts = normalizePoints(el.points);
        let start, end;
        if (pts.length >= 2) {
            start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
        } else {
            start = { x: el.x, y: el.y };
            end = { x: el.x + el.width, y: el.y + el.height };
        }

        rc.line(start.x, start.y, end.x, end.y, options);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        if (el.startArrowhead) this.drawArrowhead(rc, start.x, start.y, angle + Math.PI, el.startArrowhead, options, el.startArrowheadSize || 28);
        if (el.endArrowhead) this.drawArrowhead(rc, end.x, end.y, angle, el.endArrowhead, options, el.endArrowheadSize || 28);
    }

    private drawArrowhead(rc: any, x: number, y: number, angle: number, type: string, options: any, headLen: number = 28) {
        // Arrowheads should always be solid, even if the line is dashed/dotted
        options = { ...options, strokeLineDash: undefined };
        const p1 = { x: x - headLen * Math.cos(angle - Math.PI / 6), y: y - headLen * Math.sin(angle - Math.PI / 6) };
        const p2 = { x: x - headLen * Math.cos(angle + Math.PI / 6), y: y - headLen * Math.sin(angle + Math.PI / 6) };

        if (type === 'triangle' || type === 'arrow') {
            if (type === 'triangle') {
                rc.polygon([[x, y], [p1.x, p1.y], [p2.x, p2.y]], { ...options, fill: '#ffffff', fillStyle: 'solid' });
            } else {
                rc.line(x, y, p1.x, p1.y, options);
                rc.line(x, y, p2.x, p2.y, options);
            }
        } else if (type === 'circle' || type === 'dot') {
            rc.circle(x, y, headLen, { ...options, fill: type === 'dot' ? options.stroke : '#ffffff', fillStyle: 'solid' });
        } else if (type === 'diamond' || type === 'diamondFilled') {
            const p3 = { x: x - headLen * 2 * Math.cos(angle), y: y - headLen * 2 * Math.sin(angle) };
            const m = { x: x - headLen * Math.cos(angle), y: y - headLen * Math.sin(angle) };
            const d1 = { x: m.x - (headLen / 2) * Math.cos(angle - Math.PI / 2), y: m.y - (headLen / 2) * Math.sin(angle - Math.PI / 2) };
            const d2 = { x: m.x - (headLen / 2) * Math.cos(angle + Math.PI / 2), y: m.y - (headLen / 2) * Math.sin(angle + Math.PI / 2) };
            rc.polygon([[x, y], [d1.x, d1.y], [p3.x, p3.y], [d2.x, d2.y]], { ...options, fill: type === 'diamondFilled' ? options.stroke : '#ffffff', fillStyle: 'solid' });
        } else if (type === 'crowsfoot') {
            const f1 = { x: x - headLen * Math.cos(angle - Math.PI / 4), y: y - headLen * Math.sin(angle - Math.PI / 4) };
            const f2 = { x: x - headLen * Math.cos(angle + Math.PI / 4), y: y - headLen * Math.sin(angle + Math.PI / 4) };
            const f3 = { x: x - headLen * Math.cos(angle), y: y - headLen * Math.sin(angle) };
            rc.line(x, y, f1.x, f1.y, options);
            rc.line(x, y, f2.x, f2.y, options);
            rc.line(x, y, f3.x, f3.y, options);
        } else if (type === 'bar') {
            const barX1 = x + Math.cos(angle + Math.PI / 2) * headLen;
            const barY1 = y + Math.sin(angle + Math.PI / 2) * headLen;
            const barX2 = x + Math.cos(angle - Math.PI / 2) * headLen;
            const barY2 = y + Math.sin(angle - Math.PI / 2) * headLen;
            rc.line(barX1, barY1, barX2, barY2, options);
        }
    }

    private drawArrowheadArchitectural(renderer: IRenderer, x: number, y: number, angle: number, type: string, headLen: number = 28) {
        renderer.save();
        renderer.translate(x, y);
        renderer.rotate(angle);

        renderer.setLineDash([]); // Usually arrowheads are solid even if line is dashed

        if (type === 'triangle' || type === 'arrow') {
            renderer.beginPath();
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen * Math.cos(Math.PI / 6), -headLen * Math.sin(Math.PI / 6));
            if (type === 'triangle') {
                renderer.lineTo(-headLen * Math.cos(-Math.PI / 6), -headLen * Math.sin(-Math.PI / 6));
                renderer.closePath();
                renderer.fillStyle = '#ffffff';
                renderer.fill();
            } else {
                renderer.moveTo(0, 0);
                renderer.lineTo(-headLen * Math.cos(-Math.PI / 6), -headLen * Math.sin(-Math.PI / 6));
            }
            renderer.stroke();
        } else if (type === 'circle' || type === 'dot') {
            renderer.beginPath();
            renderer.arc(-headLen / 2 * Math.cos(0), 0, headLen / 2, 0, Math.PI * 2);
            if (type === 'dot') {
                renderer.fillStyle = renderer.strokeStyle;
            } else {
                renderer.fillStyle = '#ffffff';
            }
            renderer.fill();
            renderer.stroke();
        } else if (type === 'diamond' || type === 'diamondFilled') {
            renderer.beginPath();
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen, -headLen / 2);
            renderer.lineTo(-headLen * 2, 0);
            renderer.lineTo(-headLen, headLen / 2);
            renderer.closePath();
            if (type === 'diamondFilled') {
                renderer.fillStyle = renderer.strokeStyle;
            } else {
                renderer.fillStyle = '#ffffff';
            }
            renderer.fill();
            renderer.stroke();
        } else if (type === 'crowsfoot') {
            renderer.beginPath();
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen * Math.cos(Math.PI / 4), -headLen * Math.sin(Math.PI / 4));
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen * Math.cos(-Math.PI / 4), -headLen * Math.sin(-Math.PI / 4));
            renderer.moveTo(0, 0);
            renderer.lineTo(-headLen, 0);
            renderer.stroke();
        } else if (type === 'bar') {
            renderer.beginPath();
            renderer.moveTo(0, -headLen);
            renderer.lineTo(0, headLen);
            renderer.stroke();
        }
        renderer.restore();
    }

    private renderFlow(context: RenderContext) {
        const { renderer, element: el, isDarkMode } = context;
        if (!el.flowAnimation) return;

        const time = (window as any).yappyGlobalTime || performance.now();
        const speed = (el.flowSpeed ?? 2) * 50; // Normalize speed
        const direction = el.flowReverse ? -1 : 1;
        const offset = (time / 1000 * speed) * direction;
        const color = RenderPipeline.adjustColor(el.flowColor || el.strokeColor, isDarkMode);
        const pulseSize = Math.max(2, el.strokeWidth * 1.5);
        const gap = 100 / (el.flowDensity || 3);

        renderer.save();
        renderer.fillStyle = color;
        renderer.shadowBlur = el.flowStyle === 'pulse' ? pulseSize : 0;
        renderer.shadowColor = color;

        const pts = normalizePoints(el.points);
        let start, end;
        if (pts.length >= 2) {
            start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
        } else {
            start = { x: el.x, y: el.y };
            end = { x: el.x + el.width, y: el.y + el.height };
        }

        if (el.curveType === 'bezier') {
            // Calculate control points - same logic as definePath
            let cp1, cp2;
            if (el.controlPoints && el.controlPoints.length > 0) {
                cp1 = el.controlPoints[0];
                cp2 = el.controlPoints.length > 1 ? el.controlPoints[1] : cp1;
            } else {
                // Calculate implicit control points based on width/height (same as definePath)
                const w = el.width, h = el.height;
                if (Math.abs(w) > Math.abs(h)) {
                    cp1 = { x: start.x + w / 2, y: start.y };
                    cp2 = { x: end.x - w / 2, y: end.y };
                } else {
                    cp1 = { x: start.x, y: start.y + h / 2 };
                    cp2 = { x: end.x, y: end.y - h / 2 };
                }
            }

            // Approximation of length
            const chord = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
            const contNet = Math.sqrt((cp1.x - start.x) ** 2 + (cp1.y - start.y) ** 2) +
                Math.sqrt((cp2.x - cp1.x) ** 2 + (cp2.y - cp1.y) ** 2) +
                Math.sqrt((end.x - cp2.x) ** 2 + (end.y - cp2.y) ** 2);
            const approxLen = (chord + contNet) / 2;

            const steps = Math.ceil(approxLen / 5);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const d = t * approxLen;
                if (((d + offset) % gap + gap) % gap < speed / 10) {
                    const px = cubicBezier(start.x, cp1.x, cp2.x, end.x, t);
                    const py = cubicBezier(start.y, cp1.y, cp2.y, end.y, t);

                    // Simple tangent calculation
                    const tNext = Math.min(1, t + 0.01);
                    const pNextX = cubicBezier(start.x, cp1.x, cp2.x, end.x, tNext);
                    const pNextY = cubicBezier(start.y, cp1.y, cp2.y, end.y, tNext);
                    const angle = Math.atan2(pNextY - py, pNextX - px);

                    this.drawPulse(renderer, px, py, pulseSize, el.flowStyle, angle);
                }
            }
        } else if (el.curveType === 'elbow' && pts.length >= 2) {
            let totalDist = 0;
            for (let i = 0; i < pts.length - 1; i++) {
                const p1 = { x: el.x + pts[i].x, y: el.y + pts[i].y };
                const p2 = { x: el.x + pts[i + 1].x, y: el.y + pts[i + 1].y };
                const segmentLen = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

                const steps = Math.ceil(segmentLen / 5);
                for (let j = 0; j <= steps; j++) {
                    const t = j / steps;
                    const d = totalDist + t * segmentLen;
                    if (((d + offset) % gap + gap) % gap < speed / 10) {
                        const px = p1.x + (p2.x - p1.x) * t;
                        const py = p1.y + (p2.y - p1.y) * t;
                        this.drawPulse(renderer, px, py, pulseSize, el.flowStyle, angle);
                    }
                }
                totalDist += segmentLen;
            }
        } else {
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const steps = Math.ceil(len / 5);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const d = t * len;
                if (((d + offset) % gap + gap) % gap < speed / 10) {
                    const px = start.x + dx * t;
                    const py = start.y + dy * t;
                    this.drawPulse(renderer, px, py, pulseSize, el.flowStyle, angle);
                }
            }
        }

        renderer.restore();
    }

    private drawPulse(renderer: IRenderer, x: number, y: number, size: number, style?: string, angle: number = 0) {
        renderer.save();
        renderer.translate(x, y);
        renderer.rotate(angle);

        if (style === 'dashes') {
            renderer.fillRect(-size, -size / 2, size * 2, size);
        } else if (style === 'pulse') {
            renderer.beginPath();
            renderer.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            const alpha = 0.5 + 0.5 * Math.sin(performance.now() / 100);
            renderer.globalAlpha *= alpha;
            renderer.fill();
        } else {
            // Default: dots
            renderer.beginPath();
            renderer.arc(0, 0, size, 0, Math.PI * 2);
            renderer.fill();
        }
        renderer.restore();
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const pts = normalizePoints(el.points);
        let start, end;
        if (pts.length >= 2) {
            start = { x: el.x + pts[0].x, y: el.y + pts[0].y };
            end = { x: el.x + pts[pts.length - 1].x, y: el.y + pts[pts.length - 1].y };
        } else {
            start = { x: el.x, y: el.y };
            end = { x: el.x + el.width, y: el.y + el.height };
        }

        if (el.curveType === 'bezier') {
            const w = el.width, h = el.height;
            let cp1, cp2;
            if (el.controlPoints && el.controlPoints.length > 0) {
                cp1 = el.controlPoints[0];
                if (el.controlPoints.length > 1) {
                    cp2 = el.controlPoints[1];
                    renderer.moveTo(start.x, start.y);
                    renderer.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
                } else {
                    renderer.moveTo(start.x, start.y);
                    renderer.quadraticCurveTo(cp1.x, cp1.y, end.x, end.y);
                }
            } else {
                if (Math.abs(w) > Math.abs(h)) {
                    cp1 = { x: start.x + w / 2, y: start.y };
                    cp2 = { x: end.x - w / 2, y: end.y };
                } else {
                    cp1 = { x: start.x, y: start.y + h / 2 };
                    cp2 = { x: end.x, y: end.y - h / 2 };
                }
                renderer.moveTo(start.x, start.y);
                renderer.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
            }
        } else if (el.curveType === 'elbow') {
            const drawPoints = (pts && pts.length > 0)
                ? pts.map(p => ({ x: el.x + p.x, y: el.y + p.y }))
                : [start, end];

            renderer.moveTo(drawPoints[0].x, drawPoints[0].y);
            for (let i = 1; i < drawPoints.length; i++) {
                renderer.lineTo(drawPoints[i].x, drawPoints[i].y);
            }
        } else {
            renderer.moveTo(start.x, start.y);
            renderer.lineTo(end.x, end.y);
        }
    }

    estimatePathLength(element: any): number {
        const pts = normalizePoints(element.points);
        let start, end;
        if (pts.length >= 2) {
            start = { x: element.x + pts[0].x, y: element.y + pts[0].y };
            end = { x: element.x + pts[pts.length - 1].x, y: element.y + pts[pts.length - 1].y };
        } else {
            start = { x: element.x, y: element.y };
            end = { x: element.x + element.width, y: element.y + element.height };
        }

        if (element.curveType === 'bezier') {
            let cp1, cp2;
            if (element.controlPoints && element.controlPoints.length > 0) {
                cp1 = element.controlPoints[0];
                cp2 = element.controlPoints.length > 1 ? element.controlPoints[1] : cp1;
            } else {
                const w = element.width, h = element.height;
                if (Math.abs(w) > Math.abs(h)) {
                    cp1 = { x: start.x + w / 2, y: start.y };
                    cp2 = { x: end.x - w / 2, y: end.y };
                } else {
                    cp1 = { x: start.x, y: start.y + h / 2 };
                    cp2 = { x: end.x, y: end.y - h / 2 };
                }
            }
            // Approximate bezier length: average of chord and control polygon
            const chord = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
            const controlNet = Math.sqrt((cp1.x - start.x) ** 2 + (cp1.y - start.y) ** 2) +
                Math.sqrt((cp2.x - cp1.x) ** 2 + (cp2.y - cp1.y) ** 2) +
                Math.sqrt((end.x - cp2.x) ** 2 + (end.y - cp2.y) ** 2);
            return (chord + controlNet) / 2;
        } else if (element.curveType === 'elbow' && pts.length >= 2) {
            let total = 0;
            const drawPoints = pts.map((p: any) => ({ x: element.x + p.x, y: element.y + p.y }));
            for (let i = 0; i < drawPoints.length - 1; i++) {
                total += Math.sqrt((drawPoints[i + 1].x - drawPoints[i].x) ** 2 + (drawPoints[i + 1].y - drawPoints[i].y) ** 2);
            }
            return total;
        } else {
            return Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
        }
    }
}
