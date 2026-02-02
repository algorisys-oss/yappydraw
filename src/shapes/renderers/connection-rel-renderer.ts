import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";

export class ConnectionRelRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'puzzlePiece': {
                // Puzzle piece with tab on right and slot on bottom
                const tabW = w * 0.15;
                const slotH = h * 0.15;
                const path = new Path2D();
                path.moveTo(x, y);
                // Top edge
                path.lineTo(x + w * 0.35, y);
                path.lineTo(x + w * 0.35, y - slotH);
                path.arc(x + w * 0.5, y - slotH, w * 0.15, Math.PI, 0);
                path.lineTo(x + w * 0.65, y);
                path.lineTo(x + w, y);
                // Right edge with tab
                path.lineTo(x + w, y + h * 0.35);
                path.lineTo(x + w + tabW, y + h * 0.35);
                path.arc(x + w + tabW, y + h * 0.5, h * 0.15, -Math.PI / 2, Math.PI / 2);
                path.lineTo(x + w, y + h * 0.65);
                path.lineTo(x + w, y + h);
                // Bottom edge
                path.lineTo(x, y + h);
                // Left edge
                path.lineTo(x, y);
                path.closePath();

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(path);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(path);
                break;
            }
            case 'chainLink': {
                // Two interlocking oval links
                const linkW = w * 0.55, linkH = h * 0.4;
                const r = linkH / 2;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    // Left link
                    this.roundRect(ctx, x, y + h * 0.1, linkW, linkH, r);
                    ctx.fill();
                    // Right link
                    this.roundRect(ctx, x + w - linkW, y + h * 0.5, linkW, linkH, r);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Left link
                this.roundRect(ctx, x, y + h * 0.1, linkW, linkH, r);
                ctx.stroke();
                // Right link
                this.roundRect(ctx, x + w - linkW, y + h * 0.5, linkW, linkH, r);
                ctx.stroke();
                break;
            }
            case 'bridge': {
                // Arch bridge
                const archY = y + h * 0.4;
                const deckH = h * 0.12;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(x, archY);
                    ctx.quadraticCurveTo(x + w / 2, y, x + w, archY);
                    ctx.lineTo(x + w, archY + deckH);
                    ctx.quadraticCurveTo(x + w / 2, y + deckH, x, archY + deckH);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Arch
                ctx.beginPath();
                ctx.moveTo(x, archY);
                ctx.quadraticCurveTo(x + w / 2, y, x + w, archY);
                ctx.stroke();
                // Deck
                ctx.beginPath();
                ctx.moveTo(x, archY + deckH);
                ctx.lineTo(x + w, archY + deckH);
                ctx.stroke();
                // Pillars
                const pillars = 3;
                for (let i = 0; i < pillars; i++) {
                    const px = x + w * (0.2 + i * 0.3);
                    ctx.beginPath();
                    ctx.moveTo(px, archY + deckH);
                    ctx.lineTo(px, y + h);
                    ctx.stroke();
                }
                // Ground
                ctx.beginPath();
                ctx.moveTo(x, y + h);
                ctx.lineTo(x + w, y + h);
                ctx.stroke();
                break;
            }
            case 'magnet': {
                // U-shaped magnet
                const armW = w * 0.28;
                const gapW = w - armW * 2;
                const barH = h * 0.35;
                const armH = h - barH;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + armW, y);
                    ctx.lineTo(x + armW, y + armH);
                    ctx.arc(x + w / 2, y + armH, gapW / 2, Math.PI, 0, true);
                    ctx.lineTo(x + w - armW, y);
                    ctx.lineTo(x + w, y);
                    ctx.lineTo(x + w, y + armH);
                    ctx.arc(x + w / 2, y + armH, w / 2, 0, Math.PI);
                    ctx.lineTo(x, y);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Outer U
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + armH);
                ctx.arc(x + w / 2, y + armH, w / 2, Math.PI, 0);
                ctx.lineTo(x + w, y);
                ctx.stroke();
                // Inner U
                ctx.beginPath();
                ctx.moveTo(x + armW, y);
                ctx.lineTo(x + armW, y + armH);
                ctx.arc(x + w / 2, y + armH, gapW / 2, Math.PI, 0, true);
                ctx.lineTo(x + w - armW, y);
                ctx.stroke();
                // Pole caps
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + armW, y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + w - armW, y);
                ctx.lineTo(x + w, y);
                ctx.stroke();
                // Pole bands
                const bandY = y + barH * 0.5;
                ctx.beginPath();
                ctx.moveTo(x, bandY);
                ctx.lineTo(x + armW, bandY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + w - armW, bandY);
                ctx.lineTo(x + w, bandY);
                ctx.stroke();
                break;
            }
            case 'scale': {
                // Balance scale
                const baseW = w * 0.3, baseH = h * 0.08;
                const poleX = x + w / 2;
                const beamY = y + h * 0.15;
                const panR = w * 0.18;

                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Base
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fillRect(poleX - baseW / 2, y + h - baseH, baseW, baseH);
                }
                ctx.strokeRect(poleX - baseW / 2, y + h - baseH, baseW, baseH);
                // Vertical pole
                ctx.beginPath();
                ctx.moveTo(poleX, y + h - baseH);
                ctx.lineTo(poleX, beamY);
                ctx.stroke();
                // Beam
                ctx.beginPath();
                ctx.moveTo(x + w * 0.08, beamY);
                ctx.lineTo(x + w * 0.92, beamY);
                ctx.stroke();
                // Left pan
                const lpx = x + w * 0.08;
                const panY = y + h * 0.55;
                ctx.beginPath();
                ctx.moveTo(lpx, beamY);
                ctx.lineTo(lpx - panR * 0.3, panY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(lpx, beamY);
                ctx.lineTo(lpx + panR * 0.3, panY);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(lpx, panY + panR * 0.15, panR, Math.PI, 0);
                ctx.stroke();
                // Right pan
                const rpx = x + w * 0.92;
                ctx.beginPath();
                ctx.moveTo(rpx, beamY);
                ctx.lineTo(rpx - panR * 0.3, panY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(rpx, beamY);
                ctx.lineTo(rpx + panR * 0.3, panY);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(rpx, panY + panR * 0.15, panR, Math.PI, 0);
                ctx.stroke();
                // Triangle at top
                ctx.beginPath();
                ctx.moveTo(poleX - w * 0.04, beamY);
                ctx.lineTo(poleX + w * 0.04, beamY);
                ctx.lineTo(poleX, beamY - h * 0.06);
                ctx.closePath();
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
                break;
            }
            case 'seedling': {
                // Small plant sprouting from ground
                const stemX = x + w / 2;
                const stemBot = y + h * 0.75;
                const stemTop = y + h * 0.25;
                const leafW = w * 0.3, leafH = h * 0.25;

                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Stem
                ctx.beginPath();
                ctx.moveTo(stemX, stemBot);
                ctx.quadraticCurveTo(stemX - w * 0.05, (stemBot + stemTop) / 2, stemX, stemTop);
                ctx.stroke();
                // Left leaf
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(stemX, stemTop + leafH * 0.5);
                    ctx.quadraticCurveTo(stemX - leafW, stemTop - leafH * 0.5, stemX - leafW * 0.3, stemTop - leafH * 0.3);
                    ctx.quadraticCurveTo(stemX - leafW * 0.1, stemTop, stemX, stemTop + leafH * 0.5);
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.moveTo(stemX, stemTop + leafH * 0.5);
                ctx.quadraticCurveTo(stemX - leafW, stemTop - leafH * 0.5, stemX - leafW * 0.3, stemTop - leafH * 0.3);
                ctx.quadraticCurveTo(stemX - leafW * 0.1, stemTop, stemX, stemTop + leafH * 0.5);
                ctx.stroke();
                // Right leaf
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(stemX, stemTop);
                    ctx.quadraticCurveTo(stemX + leafW, stemTop - leafH, stemX + leafW * 0.4, stemTop - leafH * 0.8);
                    ctx.quadraticCurveTo(stemX + leafW * 0.1, stemTop - leafH * 0.3, stemX, stemTop);
                    ctx.fill();
                }
                ctx.beginPath();
                ctx.moveTo(stemX, stemTop);
                ctx.quadraticCurveTo(stemX + leafW, stemTop - leafH, stemX + leafW * 0.4, stemTop - leafH * 0.8);
                ctx.quadraticCurveTo(stemX + leafW * 0.1, stemTop - leafH * 0.3, stemX, stemTop);
                ctx.stroke();
                // Ground
                ctx.beginPath();
                ctx.arc(stemX, stemBot, w * 0.25, Math.PI, 0);
                ctx.stroke();
                break;
            }
            case 'tree': {
                // Simple tree with trunk and round canopy
                const trunkW = w * 0.18;
                const canopyR = Math.min(w, h * 0.55) * 0.48;
                const canopyCy = y + h * 0.38;
                const trunkTop = canopyCy + canopyR * 0.5;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    // Canopy
                    ctx.beginPath();
                    ctx.arc(x + w / 2, canopyCy, canopyR, 0, Math.PI * 2);
                    ctx.fill();
                    // Trunk
                    ctx.fillRect(x + w / 2 - trunkW / 2, trunkTop, trunkW, y + h - trunkTop);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Canopy
                ctx.beginPath();
                ctx.arc(x + w / 2, canopyCy, canopyR, 0, Math.PI * 2);
                ctx.stroke();
                // Trunk
                ctx.strokeRect(x + w / 2 - trunkW / 2, trunkTop, trunkW, y + h - trunkTop);
                break;
            }
            case 'mountain': {
                // Mountain peak with snow cap
                const peakX = x + w * 0.45;
                const peakY = y;
                const baseL = x;
                const baseR = x + w;
                const snowY = y + h * 0.22;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.moveTo(peakX, peakY);
                    ctx.lineTo(baseR, y + h);
                    ctx.lineTo(baseL, y + h);
                    ctx.closePath();
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Main mountain
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(baseR, y + h);
                ctx.lineTo(baseL, y + h);
                ctx.closePath();
                ctx.stroke();
                // Snow cap
                const snowL = peakX - w * 0.12;
                const snowR = peakX + w * 0.14;
                ctx.beginPath();
                ctx.moveTo(peakX, peakY);
                ctx.lineTo(snowR, snowY);
                ctx.lineTo(snowR - w * 0.05, snowY - h * 0.03);
                ctx.lineTo(snowR - w * 0.1, snowY + h * 0.02);
                ctx.lineTo(snowL + w * 0.05, snowY - h * 0.01);
                ctx.lineTo(snowL, snowY);
                ctx.closePath();
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.stroke();
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'puzzlePiece': {
                const path = this.getPuzzlePath(x, y, w, h);
                rc.path(path, options);
                break;
            }
            case 'chainLink': {
                const linkW = w * 0.55, linkH = h * 0.4;
                const r = linkH / 2;
                // Sketch two rounded rectangles
                rc.rectangle(x, y + h * 0.1, linkW, linkH, { ...options, ...({ borderRadius: r } as any) });
                rc.rectangle(x + w - linkW, y + h * 0.5, linkW, linkH, { ...options, ...({ borderRadius: r } as any) });
                break;
            }
            case 'bridge': {
                const archY = y + h * 0.4;
                const deckH = h * 0.12;
                // Arch
                const archPath = `M ${x} ${archY} Q ${x + w / 2} ${y} ${x + w} ${archY}`;
                rc.path(archPath, { ...options, fill: 'none' });
                // Deck
                rc.line(x, archY + deckH, x + w, archY + deckH, { ...options, fill: 'none' });
                // Pillars
                for (let i = 0; i < 3; i++) {
                    const px = x + w * (0.2 + i * 0.3);
                    rc.line(px, archY + deckH, px, y + h, { ...options, fill: 'none' });
                }
                // Ground
                rc.line(x, y + h, x + w, y + h, { ...options, fill: 'none' });
                break;
            }
            case 'magnet': {
                const path = this.getMagnetPath(x, y, w, h);
                rc.path(path, options);
                // Pole bands
                const armW = w * 0.28;
                const barH = h * 0.35;
                const bandY = y + barH * 0.5;
                rc.line(x, bandY, x + armW, bandY, { ...options, fill: 'none' });
                rc.line(x + w - armW, bandY, x + w, bandY, { ...options, fill: 'none' });
                break;
            }
            case 'scale': {
                const baseW = w * 0.3, baseH = h * 0.08;
                const poleX = x + w / 2;
                const beamY = y + h * 0.15;
                const panR = w * 0.18;
                const panY = y + h * 0.55;
                // Base
                rc.rectangle(poleX - baseW / 2, y + h - baseH, baseW, baseH, options);
                // Pole
                rc.line(poleX, y + h - baseH, poleX, beamY, { ...options, fill: 'none' });
                // Beam
                rc.line(x + w * 0.08, beamY, x + w * 0.92, beamY, { ...options, fill: 'none' });
                // Left pan strings + arc
                const lpx = x + w * 0.08;
                rc.line(lpx, beamY, lpx - panR * 0.3, panY, { ...options, fill: 'none' });
                rc.line(lpx, beamY, lpx + panR * 0.3, panY, { ...options, fill: 'none' });
                rc.arc(lpx, panY + panR * 0.15, panR * 2, panR * 2, Math.PI, 0, false, { ...options, fill: 'none' });
                // Right pan strings + arc
                const rpx = x + w * 0.92;
                rc.line(rpx, beamY, rpx - panR * 0.3, panY, { ...options, fill: 'none' });
                rc.line(rpx, beamY, rpx + panR * 0.3, panY, { ...options, fill: 'none' });
                rc.arc(rpx, panY + panR * 0.15, panR * 2, panR * 2, Math.PI, 0, false, { ...options, fill: 'none' });
                break;
            }
            case 'seedling': {
                const stemX = x + w / 2;
                const stemBot = y + h * 0.75;
                const stemTop = y + h * 0.25;
                const leafW = w * 0.3, leafH = h * 0.25;
                // Stem
                rc.path(`M ${stemX} ${stemBot} Q ${stemX - w * 0.05} ${(stemBot + stemTop) / 2} ${stemX} ${stemTop}`, { ...options, fill: 'none' });
                // Left leaf
                rc.path(`M ${stemX} ${stemTop + leafH * 0.5} Q ${stemX - leafW} ${stemTop - leafH * 0.5} ${stemX - leafW * 0.3} ${stemTop - leafH * 0.3} Q ${stemX - leafW * 0.1} ${stemTop} ${stemX} ${stemTop + leafH * 0.5}`, options);
                // Right leaf
                rc.path(`M ${stemX} ${stemTop} Q ${stemX + leafW} ${stemTop - leafH} ${stemX + leafW * 0.4} ${stemTop - leafH * 0.8} Q ${stemX + leafW * 0.1} ${stemTop - leafH * 0.3} ${stemX} ${stemTop}`, options);
                // Ground arc
                rc.arc(stemX, stemBot, w * 0.5, w * 0.5, Math.PI, 0, false, { ...options, fill: 'none' });
                break;
            }
            case 'tree': {
                const trunkW = w * 0.18;
                const canopyR = Math.min(w, h * 0.55) * 0.48;
                const canopyCy = y + h * 0.38;
                const trunkTop = canopyCy + canopyR * 0.5;
                // Canopy
                rc.circle(x + w / 2, canopyCy, canopyR * 2, options);
                // Trunk
                rc.rectangle(x + w / 2 - trunkW / 2, trunkTop, trunkW, y + h - trunkTop, { ...options, fill: options.fill });
                break;
            }
            case 'mountain': {
                const peakX = x + w * 0.45;
                rc.polygon([
                    [peakX, y],
                    [x + w, y + h],
                    [x, y + h]
                ], options);
                // Snow cap
                const snowY = y + h * 0.22;
                const snowL = peakX - w * 0.12;
                const snowR = peakX + w * 0.14;
                rc.polygon([
                    [peakX, y],
                    [snowR, snowY],
                    [snowR - w * 0.05, snowY - h * 0.03],
                    [snowR - w * 0.1, snowY + h * 0.02],
                    [snowL + w * 0.05, snowY - h * 0.01],
                    [snowL, snowY]
                ], { ...options, fill: '#ffffff' });
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    private getPuzzlePath(x: number, y: number, w: number, h: number): string {
        const tabR = w * 0.15;
        const slotR = h * 0.15;
        let p = `M ${x} ${y}`;
        // Top edge with slot
        p += ` L ${x + w * 0.35} ${y}`;
        p += ` A ${slotR} ${slotR} 0 0 1 ${x + w * 0.65} ${y}`;
        p += ` L ${x + w} ${y}`;
        // Right edge with tab
        p += ` L ${x + w} ${y + h * 0.35}`;
        p += ` A ${tabR} ${tabR} 0 0 1 ${x + w} ${y + h * 0.65}`;
        p += ` L ${x + w} ${y + h}`;
        // Bottom and left
        p += ` L ${x} ${y + h}`;
        p += ' Z';
        return p;
    }

    private getMagnetPath(x: number, y: number, w: number, h: number): string {
        const armW = w * 0.28;
        const armH = h - h * 0.35;
        const innerR = (w - armW * 2) / 2;
        const outerR = w / 2;
        let p = `M ${x} ${y}`;
        p += ` L ${x} ${y + armH}`;
        p += ` A ${outerR} ${outerR} 0 0 0 ${x + w} ${y + armH}`;
        p += ` L ${x + w} ${y}`;
        p += ` L ${x + w - armW} ${y}`;
        p += ` L ${x + w - armW} ${y + armH}`;
        p += ` A ${innerR} ${innerR} 0 0 1 ${x + armW} ${y + armH}`;
        p += ` L ${x + armW} ${y}`;
        p += ' Z';
        return p;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(ctx, geometry);
    }
}
