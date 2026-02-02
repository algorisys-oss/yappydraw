import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";
import { getShapeGeometry } from "../../utils/shape-geometry";

export class SpecialtyShapeRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        ctx.save();
        ctx.translate(cx, cy);

        // Painter's Algorithm for 3D solids (solidBlock, cylinder) to ensure proper occlusion
        // We render each face fully (Fill then Stroke) in order.
        const is3D = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock'].includes(el.type);

        if (is3D && geometry.type === 'multi') {
            const fillVisible = options.fill && options.fill !== 'transparent' && options.fill !== 'none';

            geometry.shapes.forEach((s: any) => {
                // 1. Fill
                if (fillVisible && backgroundColor) {
                    ctx.fillStyle = s.shade ? RenderPipeline.shadeColor(backgroundColor, s.shade) : backgroundColor;
                    ctx.beginPath();
                    RenderPipeline.renderGeometry(ctx, s);
                    ctx.fill();
                }

                // 2. Stroke
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                if (s.shade) ctx.strokeStyle = RenderPipeline.shadeColor(ctx.strokeStyle as string, s.shade);
                ctx.beginPath();
                RenderPipeline.renderGeometry(ctx, s);
                ctx.stroke();

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
                ctx.fillStyle = backgroundColor;
                ctx.beginPath();
                RenderPipeline.renderGeometry(ctx, geometry);
                ctx.fill();
            }

            RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
            ctx.beginPath();
            RenderPipeline.renderGeometry(ctx, geometry);
            ctx.stroke();

            if (el.drawInnerBorder) {
                const dist = el.innerBorderDistance || 5;
                const sx = (el.width - dist * 2) / el.width;
                const sy = (el.height - dist * 2) / el.height;
                if (sx > 0 && sy > 0) {
                    ctx.save();
                    ctx.scale(sx, sy);
                    ctx.strokeStyle = el.innerBorderColor || strokeColor;
                    ctx.beginPath();
                    RenderPipeline.renderGeometry(ctx, geometry);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        ctx.restore();
        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);

        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        ctx.save();
        ctx.translate(cx, cy);

        this.renderSketchGeometry(rc, geometry, options);

        const is3D = ['solidBlock', 'cylinder', 'isometricCube', 'perspectiveBlock'].includes(el.type);
        if (el.drawInnerBorder && !is3D) {
            const dist = el.innerBorderDistance || 5;
            const sx = (el.width - dist * 2) / el.width;
            const sy = (el.height - dist * 2) / el.height;
            if (sx > 0 && sy > 0) {
                const innerOptions = { ...options, stroke: el.innerBorderColor || options.stroke, fill: 'none' };
                ctx.save();
                ctx.scale(sx, sy);
                this.renderSketchGeometry(rc, geometry, innerOptions);
                ctx.restore();
            }
        }

        ctx.restore();
        RenderPipeline.renderText(context, cx, cy);
    }

    private renderSketchGeometry(rc: any, geo: any, options: any) {
        // Apply face shading if available
        const localOptions = geo.shade && options.fill && options.fill !== 'transparent' && options.fill !== 'none'
            ? { ...options, fill: RenderPipeline.shadeColor(options.fill, geo.shade) }
            : options;

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
            geo.shapes.forEach((s: any) => this.renderSketchGeometry(rc, s, localOptions));
        }
    }



    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;

        // Translate to center as geometry is relative to center
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(ctx, geometry);
    }
}
