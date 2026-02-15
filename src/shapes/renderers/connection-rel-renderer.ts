import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";

export class ConnectionRelRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'puzzlePiece': {
                // Puzzle piece with tab on right and slot on bottom
                // Use beginPath/moveTo/lineTo/arc instead of Path2D for IRenderer compatibility
                const tabW = w * 0.15;
                const slotH = h * 0.15;

                renderer.beginPath();
                renderer.moveTo(x, y);
                // Top edge
                renderer.lineTo(x + w * 0.35, y);
                renderer.lineTo(x + w * 0.35, y - slotH);
                renderer.arc(x + w * 0.5, y - slotH, w * 0.15, Math.PI, 0);
                renderer.lineTo(x + w * 0.65, y);
                renderer.lineTo(x + w, y);
                // Right edge with tab
                renderer.lineTo(x + w, y + h * 0.35);
                renderer.lineTo(x + w + tabW, y + h * 0.35);
                renderer.arc(x + w + tabW, y + h * 0.5, h * 0.15, -Math.PI / 2, Math.PI / 2);
                renderer.lineTo(x + w, y + h * 0.65);
                renderer.lineTo(x + w, y + h);
                // Bottom edge
                renderer.lineTo(x, y + h);
                // Left edge
                renderer.lineTo(x, y);
                renderer.closePath();

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.stroke();
                break;
            }
            case 'chainLink': {
                // Two interlocking oval links
                const linkW = w * 0.55, linkH = h * 0.4;
                const r = linkH / 2;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    // Left link
                    this.roundRect(renderer, x, y + h * 0.1, linkW, linkH, r);
                    renderer.fill();
                    // Right link
                    this.roundRect(renderer, x + w - linkW, y + h * 0.5, linkW, linkH, r);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Left link
                this.roundRect(renderer, x, y + h * 0.1, linkW, linkH, r);
                renderer.stroke();
                // Right link
                this.roundRect(renderer, x + w - linkW, y + h * 0.5, linkW, linkH, r);
                renderer.stroke();
                break;
            }
            case 'bridge': {
                // Arch bridge
                const archY = y + h * 0.4;
                const deckH = h * 0.12;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(x, archY);
                    renderer.quadraticCurveTo(x + w / 2, y, x + w, archY);
                    renderer.lineTo(x + w, archY + deckH);
                    renderer.quadraticCurveTo(x + w / 2, y + deckH, x, archY + deckH);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Arch
                renderer.beginPath();
                renderer.moveTo(x, archY);
                renderer.quadraticCurveTo(x + w / 2, y, x + w, archY);
                renderer.stroke();
                // Deck
                renderer.beginPath();
                renderer.moveTo(x, archY + deckH);
                renderer.lineTo(x + w, archY + deckH);
                renderer.stroke();
                // Pillars
                const pillars = 3;
                for (let i = 0; i < pillars; i++) {
                    const px = x + w * (0.2 + i * 0.3);
                    renderer.beginPath();
                    renderer.moveTo(px, archY + deckH);
                    renderer.lineTo(px, y + h);
                    renderer.stroke();
                }
                // Ground
                renderer.beginPath();
                renderer.moveTo(x, y + h);
                renderer.lineTo(x + w, y + h);
                renderer.stroke();
                break;
            }
            case 'magnet': {
                // U-shaped magnet
                const armW = w * 0.28;
                const gapW = w - armW * 2;
                const barH = h * 0.35;
                const armH = h - barH;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(x, y);
                    renderer.lineTo(x + armW, y);
                    renderer.lineTo(x + armW, y + armH);
                    renderer.arc(x + w / 2, y + armH, gapW / 2, Math.PI, 0, true);
                    renderer.lineTo(x + w - armW, y);
                    renderer.lineTo(x + w, y);
                    renderer.lineTo(x + w, y + armH);
                    renderer.arc(x + w / 2, y + armH, w / 2, 0, Math.PI);
                    renderer.lineTo(x, y);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Outer U
                renderer.beginPath();
                renderer.moveTo(x, y);
                renderer.lineTo(x, y + armH);
                renderer.arc(x + w / 2, y + armH, w / 2, Math.PI, 0);
                renderer.lineTo(x + w, y);
                renderer.stroke();
                // Inner U
                renderer.beginPath();
                renderer.moveTo(x + armW, y);
                renderer.lineTo(x + armW, y + armH);
                renderer.arc(x + w / 2, y + armH, gapW / 2, Math.PI, 0, true);
                renderer.lineTo(x + w - armW, y);
                renderer.stroke();
                // Pole caps
                renderer.beginPath();
                renderer.moveTo(x, y);
                renderer.lineTo(x + armW, y);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(x + w - armW, y);
                renderer.lineTo(x + w, y);
                renderer.stroke();
                // Pole bands
                const bandY = y + barH * 0.5;
                renderer.beginPath();
                renderer.moveTo(x, bandY);
                renderer.lineTo(x + armW, bandY);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(x + w - armW, bandY);
                renderer.lineTo(x + w, bandY);
                renderer.stroke();
                break;
            }
            case 'scale': {
                // Balance scale
                const baseW = w * 0.3, baseH = h * 0.08;
                const poleX = x + w / 2;
                const beamY = y + h * 0.15;
                const panR = w * 0.18;

                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Base
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fillRect(poleX - baseW / 2, y + h - baseH, baseW, baseH);
                }
                renderer.strokeRect(poleX - baseW / 2, y + h - baseH, baseW, baseH);
                // Vertical pole
                renderer.beginPath();
                renderer.moveTo(poleX, y + h - baseH);
                renderer.lineTo(poleX, beamY);
                renderer.stroke();
                // Beam
                renderer.beginPath();
                renderer.moveTo(x + w * 0.08, beamY);
                renderer.lineTo(x + w * 0.92, beamY);
                renderer.stroke();
                // Left pan
                const lpx = x + w * 0.08;
                const panY = y + h * 0.55;
                renderer.beginPath();
                renderer.moveTo(lpx, beamY);
                renderer.lineTo(lpx - panR * 0.3, panY);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(lpx, beamY);
                renderer.lineTo(lpx + panR * 0.3, panY);
                renderer.stroke();
                renderer.beginPath();
                renderer.arc(lpx, panY + panR * 0.15, panR, Math.PI, 0);
                renderer.stroke();
                // Right pan
                const rpx = x + w * 0.92;
                renderer.beginPath();
                renderer.moveTo(rpx, beamY);
                renderer.lineTo(rpx - panR * 0.3, panY);
                renderer.stroke();
                renderer.beginPath();
                renderer.moveTo(rpx, beamY);
                renderer.lineTo(rpx + panR * 0.3, panY);
                renderer.stroke();
                renderer.beginPath();
                renderer.arc(rpx, panY + panR * 0.15, panR, Math.PI, 0);
                renderer.stroke();
                // Triangle at top
                renderer.beginPath();
                renderer.moveTo(poleX - w * 0.04, beamY);
                renderer.lineTo(poleX + w * 0.04, beamY);
                renderer.lineTo(poleX, beamY - h * 0.06);
                renderer.closePath();
                renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                renderer.fill();
                break;
            }
            case 'seedling': {
                // Small plant sprouting from ground
                const stemX = x + w / 2;
                const stemBot = y + h * 0.75;
                const stemTop = y + h * 0.25;
                const leafW = w * 0.3, leafH = h * 0.25;

                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Stem
                renderer.beginPath();
                renderer.moveTo(stemX, stemBot);
                renderer.quadraticCurveTo(stemX - w * 0.05, (stemBot + stemTop) / 2, stemX, stemTop);
                renderer.stroke();
                // Left leaf
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(stemX, stemTop + leafH * 0.5);
                    renderer.quadraticCurveTo(stemX - leafW, stemTop - leafH * 0.5, stemX - leafW * 0.3, stemTop - leafH * 0.3);
                    renderer.quadraticCurveTo(stemX - leafW * 0.1, stemTop, stemX, stemTop + leafH * 0.5);
                    renderer.fill();
                }
                renderer.beginPath();
                renderer.moveTo(stemX, stemTop + leafH * 0.5);
                renderer.quadraticCurveTo(stemX - leafW, stemTop - leafH * 0.5, stemX - leafW * 0.3, stemTop - leafH * 0.3);
                renderer.quadraticCurveTo(stemX - leafW * 0.1, stemTop, stemX, stemTop + leafH * 0.5);
                renderer.stroke();
                // Right leaf
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(stemX, stemTop);
                    renderer.quadraticCurveTo(stemX + leafW, stemTop - leafH, stemX + leafW * 0.4, stemTop - leafH * 0.8);
                    renderer.quadraticCurveTo(stemX + leafW * 0.1, stemTop - leafH * 0.3, stemX, stemTop);
                    renderer.fill();
                }
                renderer.beginPath();
                renderer.moveTo(stemX, stemTop);
                renderer.quadraticCurveTo(stemX + leafW, stemTop - leafH, stemX + leafW * 0.4, stemTop - leafH * 0.8);
                renderer.quadraticCurveTo(stemX + leafW * 0.1, stemTop - leafH * 0.3, stemX, stemTop);
                renderer.stroke();
                // Ground
                renderer.beginPath();
                renderer.arc(stemX, stemBot, w * 0.25, Math.PI, 0);
                renderer.stroke();
                break;
            }
            case 'tree': {
                // Simple tree with trunk and round canopy
                const trunkW = w * 0.18;
                const canopyR = Math.min(w, h * 0.55) * 0.48;
                const canopyCy = y + h * 0.38;
                const trunkTop = canopyCy + canopyR * 0.5;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    // Canopy
                    renderer.beginPath();
                    renderer.arc(x + w / 2, canopyCy, canopyR, 0, Math.PI * 2);
                    renderer.fill();
                    // Trunk
                    renderer.fillRect(x + w / 2 - trunkW / 2, trunkTop, trunkW, y + h - trunkTop);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Canopy
                renderer.beginPath();
                renderer.arc(x + w / 2, canopyCy, canopyR, 0, Math.PI * 2);
                renderer.stroke();
                // Trunk
                renderer.strokeRect(x + w / 2 - trunkW / 2, trunkTop, trunkW, y + h - trunkTop);
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
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.moveTo(peakX, peakY);
                    renderer.lineTo(baseR, y + h);
                    renderer.lineTo(baseL, y + h);
                    renderer.closePath();
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Main mountain
                renderer.beginPath();
                renderer.moveTo(peakX, peakY);
                renderer.lineTo(baseR, y + h);
                renderer.lineTo(baseL, y + h);
                renderer.closePath();
                renderer.stroke();
                // Snow cap
                const snowL = peakX - w * 0.12;
                const snowR = peakX + w * 0.14;
                renderer.beginPath();
                renderer.moveTo(peakX, peakY);
                renderer.lineTo(snowR, snowY);
                renderer.lineTo(snowR - w * 0.05, snowY - h * 0.03);
                renderer.lineTo(snowR - w * 0.1, snowY + h * 0.02);
                renderer.lineTo(snowL + w * 0.05, snowY - h * 0.01);
                renderer.lineTo(snowL, snowY);
                renderer.closePath();
                renderer.fillStyle = '#ffffff';
                renderer.fill();
                renderer.stroke();
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

    private roundRect(renderer: IRenderer, x: number, y: number, w: number, h: number, r: number): void {
        renderer.beginPath();
        renderer.moveTo(x + r, y);
        renderer.lineTo(x + w - r, y);
        renderer.quadraticCurveTo(x + w, y, x + w, y + r);
        renderer.lineTo(x + w, y + h - r);
        renderer.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        renderer.lineTo(x + r, y + h);
        renderer.quadraticCurveTo(x, y + h, x, y + h - r);
        renderer.lineTo(x, y + r);
        renderer.quadraticCurveTo(x, y, x + r, y);
        renderer.closePath();
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

    protected definePath(renderer: IRenderer, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        renderer.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(renderer, geometry);
    }
}
