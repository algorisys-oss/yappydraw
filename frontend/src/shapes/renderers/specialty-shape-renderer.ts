import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";
import { getShapeGeometry } from "../../utils/shape-geometry";

export class SpecialtyShapeRenderer extends ShapeRenderer {
    /**
     * Creates a gradient with shading applied for 3D faces.
     * The shading darkens/lightens the gradient colors to simulate lighting.
     */
    private createShadedGradient(renderer: IRenderer, el: DrawingElement, shade: number): ReturnType<IRenderer['createLinearGradient']> | null {
        const w = el.width;
        const h = el.height;
        const mw = w / 2;
        const mh = h / 2;
        const gType = el.gradientType || el.fillStyle || 'linear';

        let grad: ReturnType<IRenderer['createLinearGradient']>;

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
            const focalOffset = radius * 0.4;
            const fx = Math.cos(angleRad) * focalOffset;
            const fy = Math.sin(angleRad) * focalOffset;
            grad = renderer.createRadialGradient(fx, fy, 0, 0, 0, radius);
        } else if (gType === 'conic') {
            const angleRad = (el.gradientDirection || 0) * (Math.PI / 180);
            grad = renderer.createConicGradient(angleRad, 0, 0);
        } else {
            grad = renderer.createLinearGradient(-mw, -mh, mw, mh);
        }

        // Apply gradient stops with shading
        if (el.gradientStops && el.gradientStops.length > 0) {
            [...el.gradientStops]
                .sort((a, b) => a.offset - b.offset)
                .forEach(stop => {
                    const shadedColor = RenderPipeline.shadeColor(stop.color, shade);
                    grad.addColorStop(stop.offset, shadedColor);
                });
        } else if (el.gradientStart && el.gradientEnd) {
            grad.addColorStop(0, RenderPipeline.shadeColor(el.gradientStart, shade));
            grad.addColorStop(1, RenderPipeline.shadeColor(el.gradientEnd, shade));
        } else {
            return null; // No gradient colors defined
        }

        return grad;
    }

    /**
     * Checks if the element has a gradient fill.
     */
    private hasGradientFill(el: DrawingElement): boolean {
        const fillStyle = el.fillStyle;
        return (['linear', 'radial', 'conic'].includes(fillStyle as string)) ||
            ((el.gradientType as any) !== 'none' && el.gradientType !== undefined);
    }

    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const lidColor = el.lidColor ? RenderPipeline.adjustColor(el.lidColor, isDarkMode) : undefined;
        const lidStrokeColor = el.lidStrokeColor ? RenderPipeline.adjustColor(el.lidStrokeColor, isDarkMode) : undefined;
        const backfaceStrokeColor = el.backfaceStrokeColor ? RenderPipeline.adjustColor(el.backfaceStrokeColor, isDarkMode) : undefined;

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        renderer.save();
        renderer.translate(cx, cy);

        // Painter's Algorithm for 3D solids (solidBlock, cylinder) to ensure proper occlusion
        // We render each face fully (Fill then Stroke) in order.
        const is3D = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock', 'openBox'].includes(el.type);
        const useGradient = this.hasGradientFill(el);

        if (is3D && geometry.type === 'multi') {
            geometry.shapes.forEach((s: any) => {
                // 1. Fill - use lidColor for lid faces if specified
                // Check per-face: lid can have fill even when background is transparent
                const faceColor = (s.isLid && lidColor) ? lidColor : backgroundColor;
                const shade = s.shade || 1;

                // Apply gradient fill with per-face shading for 3D shapes
                if (useGradient && !s.isLid) {
                    const gradient = this.createShadedGradient(renderer, el, shade);
                    if (gradient) {
                        renderer.fillStyle = gradient;
                        renderer.beginPath();
                        RenderPipeline.renderGeometry(renderer, s);
                        renderer.fill();
                    } else if (faceColor) {
                        // Fallback to solid color if gradient creation failed
                        renderer.fillStyle = shade !== 1 ? RenderPipeline.shadeColor(faceColor, shade) : faceColor;
                        renderer.beginPath();
                        RenderPipeline.renderGeometry(renderer, s);
                        renderer.fill();
                    }
                } else if (faceColor) {
                    // Solid color fill with shading
                    renderer.fillStyle = shade !== 1 ? RenderPipeline.shadeColor(faceColor, shade) : faceColor;
                    renderer.beginPath();
                    RenderPipeline.renderGeometry(renderer, s);
                    renderer.fill();
                }

                // 2. Stroke (skip if face is marked as noStroke - used for interior faces)
                if (!s.noStroke) {
                    // Determine the stroke color for this face:
                    // - If backfaceStrokeColor is set and face is back-facing, use it
                    // - Else if lidStrokeColor is set and face is a lid, use it
                    // - Otherwise use the default stroke color
                    let faceStrokeColor = strokeColor;
                    if (s.isBackface && backfaceStrokeColor) {
                        faceStrokeColor = backfaceStrokeColor;
                    } else if (s.isLid && lidStrokeColor) {
                        faceStrokeColor = lidStrokeColor;
                    }

                    // Only stroke if color is visible
                    if (faceStrokeColor && faceStrokeColor !== 'transparent' && faceStrokeColor !== 'none' && el.strokeWidth > 0) {
                        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                        renderer.strokeStyle = faceStrokeColor;
                        if (s.shade) renderer.strokeStyle = RenderPipeline.shadeColor(renderer.strokeStyle as string, s.shade);
                        renderer.beginPath();
                        RenderPipeline.renderGeometry(renderer, s);
                        renderer.stroke();
                    }
                }

                // 3. Inner Border (Per Face)
                if (el.drawInnerBorder) {
                    // const dist = el.innerBorderDistance || 5;
                    // Note: calculating scale for arbitrary polygons is hard.
                    // Simple scaling only works well for centered shapes.
                    // For faces of a 3D object, simple scaling might offset them wrongly relative to their own center.
                    // For now, we skip inner border on complex 3D faces or accept the artifact.
                    // Given the complexity, standard inner border logic (scale from center 0,0) is wrong for offset faces.
                    // We will apply it only if the shape is roughly centered or if we accept the look.
                    // Let's keep it simple and skip per-face inner border for now unless requested.
                }
            });
        } else {
            // Standard Merged Rendering (2D shapes)
            const fillVisible = options.fill && options.fill !== 'transparent' && options.fill !== 'none';
            if (fillVisible && backgroundColor) {
                renderer.fillStyle = backgroundColor;
                renderer.beginPath();
                RenderPipeline.renderGeometry(renderer, geometry);
                renderer.fill();
            }

            // Only stroke if color is visible
            const strokeVisible = strokeColor && strokeColor !== 'transparent' && strokeColor !== 'none' && el.strokeWidth > 0;
            if (strokeVisible) {
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                RenderPipeline.renderGeometry(renderer, geometry);
                renderer.stroke();
            }

            if (el.drawInnerBorder) {
                const dist = el.innerBorderDistance || 5;
                const sx = (el.width - dist * 2) / el.width;
                const sy = (el.height - dist * 2) / el.height;
                if (sx > 0 && sy > 0) {
                    renderer.save();
                    renderer.scale(sx, sy);
                    renderer.strokeStyle = el.innerBorderColor || strokeColor;
                    renderer.beginPath();
                    RenderPipeline.renderGeometry(renderer, geometry);
                    renderer.stroke();
                    renderer.restore();
                }
            }
        }

        renderer.restore();
        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const lidColor = el.lidColor ? RenderPipeline.adjustColor(el.lidColor, isDarkMode) : undefined;
        const lidStrokeColor = el.lidStrokeColor ? RenderPipeline.adjustColor(el.lidStrokeColor, isDarkMode) : undefined;
        const backfaceStrokeColor = el.backfaceStrokeColor ? RenderPipeline.adjustColor(el.backfaceStrokeColor, isDarkMode) : undefined;

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        renderer.save();
        renderer.translate(cx, cy);

        const is3D = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock', 'openBox'].includes(el.type);
        const useGradient = this.hasGradientFill(el);

        // For 3D shapes with gradients, fill with canvas gradient first, then stroke with RoughJS
        if (is3D && useGradient && geometry.type === 'multi') {
            // First pass: fill each face with gradient using renderer API
            geometry.shapes.forEach((s: any) => {
                const faceColor = (s.isLid && lidColor) ? lidColor : backgroundColor;
                const shade = s.shade || 1;

                if (!s.isLid) {
                    const gradient = this.createShadedGradient(renderer, el, shade);
                    if (gradient) {
                        renderer.fillStyle = gradient;
                        renderer.beginPath();
                        RenderPipeline.renderGeometry(renderer, s);
                        renderer.fill();
                    } else if (faceColor) {
                        renderer.fillStyle = shade !== 1 ? RenderPipeline.shadeColor(faceColor, shade) : faceColor;
                        renderer.beginPath();
                        RenderPipeline.renderGeometry(renderer, s);
                        renderer.fill();
                    }
                } else if (faceColor) {
                    renderer.fillStyle = shade !== 1 ? RenderPipeline.shadeColor(faceColor, shade) : faceColor;
                    renderer.beginPath();
                    RenderPipeline.renderGeometry(renderer, s);
                    renderer.fill();
                }
            });

            // Second pass: stroke with RoughJS (no fill)
            const strokeOnlyOptions = { ...options, fill: 'none' };
            this.renderSketchGeometry(rc, geometry, strokeOnlyOptions, lidColor, lidStrokeColor, backfaceStrokeColor);
        } else {
            // Standard sketch rendering
            this.renderSketchGeometry(rc, geometry, options, lidColor, lidStrokeColor, backfaceStrokeColor);
        }

        if (el.drawInnerBorder && !is3D) {
            const dist = el.innerBorderDistance || 5;
            const sx = (el.width - dist * 2) / el.width;
            const sy = (el.height - dist * 2) / el.height;
            if (sx > 0 && sy > 0) {
                const innerOptions = { ...options, stroke: el.innerBorderColor || options.stroke, fill: 'none' };
                renderer.save();
                renderer.scale(sx, sy);
                this.renderSketchGeometry(rc, geometry, innerOptions, lidColor, lidStrokeColor, backfaceStrokeColor);
                renderer.restore();
            }
        }

        renderer.restore();
        RenderPipeline.renderText(context, cx, cy);
    }

    private renderSketchGeometry(rc: any, geo: any, options: any, lidColor?: string, lidStrokeColor?: string, backfaceStrokeColor?: string) {
        // Determine the base fill color - use lidColor for lid faces if specified
        const baseFill = (geo.isLid && lidColor) ? lidColor : options.fill;

        // Determine stroke color:
        // - If backfaceStrokeColor is set and face is back-facing, use it
        // - Else if lidStrokeColor is set and face is a lid, use it
        // - Otherwise use the default stroke color
        let baseStroke = options.stroke;
        if (geo.isBackface && backfaceStrokeColor) {
            baseStroke = backfaceStrokeColor;
        } else if (geo.isLid && lidStrokeColor) {
            baseStroke = lidStrokeColor;
        }

        // Apply face shading if available
        let localOptions = geo.shade && baseFill && baseFill !== 'transparent' && baseFill !== 'none'
            ? { ...options, fill: RenderPipeline.shadeColor(baseFill, geo.shade), stroke: baseStroke }
            : { ...options, fill: baseFill, stroke: baseStroke };

        // For noStroke faces, only render fill (no stroke)
        if (geo.noStroke) {
            localOptions = { ...localOptions, stroke: 'none', strokeWidth: 0 };
        }

        if (geo.type === 'rect') {
            rc.rectangle(geo.x, geo.y, geo.w, geo.h, localOptions);
        } else if (geo.type === 'ellipse') {
            rc.ellipse(geo.cx, geo.cy, geo.rx * 2, geo.ry * 2, localOptions);
        } else if (geo.type === 'points') {
            // Points are already relative to center in geometry
            const points: [number, number][] = geo.points.map((p: any) => [p.x, p.y]);
            if (geo.isClosed === false) {
                rc.linearPath(points, localOptions);
            } else {
                rc.polygon(points, localOptions);
            }
        } else if (geo.type === 'path') {
            rc.path(geo.path, localOptions);
        } else if (geo.type === 'multi') {
            geo.shapes.forEach((s: any) => this.renderSketchGeometry(rc, s, options, lidColor, lidStrokeColor, backfaceStrokeColor));
        }
    }



    protected definePath(renderer: IRenderer, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        // Translate to center as geometry is relative to center
        renderer.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(renderer, geometry);
    }
}
