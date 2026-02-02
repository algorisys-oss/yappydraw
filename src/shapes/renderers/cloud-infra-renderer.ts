import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";

export class CloudInfraRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'kubernetes': {
                // Helm wheel — circle with 7 spokes
                const ccx = x + w / 2, ccy = y + h / 2;
                const outerR = Math.min(w, h) / 2;
                const innerR = outerR * 0.35;
                const spokes = 7;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.ellipse(ccx, ccy, outerR, outerR, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, outerR, outerR, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Inner circle
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, innerR, innerR, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Spokes
                for (let i = 0; i < spokes; i++) {
                    const angle = (Math.PI * 2 * i) / spokes - Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(ccx + Math.cos(angle) * innerR, ccy + Math.sin(angle) * innerR);
                    ctx.lineTo(ccx + Math.cos(angle) * outerR * 0.85, ccy + Math.sin(angle) * outerR * 0.85);
                    ctx.stroke();
                    // Spoke knobs
                    const knobR = outerR * 0.08;
                    ctx.beginPath();
                    ctx.arc(ccx + Math.cos(angle) * outerR * 0.85, ccy + Math.sin(angle) * outerR * 0.85, knobR, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
            case 'container': {
                // Stacked container box with whale-like top
                const r = Math.min(w, h) * 0.06;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    this.roundRect(ctx, x, y, w, h, r);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                this.roundRect(ctx, x, y, w, h, r);
                ctx.stroke();
                // Stack lines (3 horizontal dividers)
                const rows = 3;
                for (let i = 1; i <= rows; i++) {
                    const ly = y + (h * i) / (rows + 1);
                    ctx.beginPath();
                    ctx.moveTo(x + w * 0.08, ly);
                    ctx.lineTo(x + w * 0.92, ly);
                    ctx.stroke();
                }
                break;
            }
            case 'apiGateway': {
                // Rectangle with arrows going through
                const r = Math.min(w, h) * 0.08;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    this.roundRect(ctx, x, y, w, h, r);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                this.roundRect(ctx, x, y, w, h, r);
                ctx.stroke();
                // Arrow pointing right through center
                const arrowY = y + h / 2;
                const arrowL = x + w * 0.2;
                const arrowR = x + w * 0.8;
                const arrowH = h * 0.12;
                ctx.beginPath();
                ctx.moveTo(arrowL, arrowY);
                ctx.lineTo(arrowR - w * 0.1, arrowY);
                ctx.stroke();
                // Arrowhead
                ctx.beginPath();
                ctx.moveTo(arrowR, arrowY);
                ctx.lineTo(arrowR - w * 0.1, arrowY - arrowH);
                ctx.lineTo(arrowR - w * 0.1, arrowY + arrowH);
                ctx.closePath();
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
                break;
            }
            case 'cdn': {
                // Globe with latitude/longitude lines
                const ccx = x + w / 2, ccy = y + h / 2;
                const rx = w / 2, ry = h / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.ellipse(ccx, ccy, rx, ry, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Vertical meridian (ellipse)
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, rx * 0.4, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Horizontal equator
                ctx.beginPath();
                ctx.moveTo(x, ccy);
                ctx.lineTo(x + w, ccy);
                ctx.stroke();
                // Latitude lines
                ctx.beginPath();
                ctx.ellipse(ccx, ccy - ry * 0.45, rx * 0.88, ry * 0.15, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(ccx, ccy + ry * 0.45, rx * 0.88, ry * 0.15, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case 'storageBlob': {
                // Bucket/cylinder shape
                const ellipseH = h * 0.15;
                const bodyTop = y + ellipseH / 2;
                const bodyBot = y + h - ellipseH / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.ellipse(x + w / 2, bodyTop, w / 2, ellipseH, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(x, bodyTop);
                    ctx.lineTo(x, bodyBot);
                    ctx.ellipse(x + w / 2, bodyBot, w / 2, ellipseH, 0, Math.PI, 0, true);
                    ctx.lineTo(x + w, bodyTop);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                // Top ellipse
                ctx.beginPath();
                ctx.ellipse(x + w / 2, bodyTop, w / 2, ellipseH, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Side walls
                ctx.beginPath();
                ctx.moveTo(x, bodyTop);
                ctx.lineTo(x, bodyBot);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + w, bodyTop);
                ctx.lineTo(x + w, bodyBot);
                ctx.stroke();
                // Bottom ellipse (half)
                ctx.beginPath();
                ctx.ellipse(x + w / 2, bodyBot, w / 2, ellipseH, 0, 0, Math.PI);
                ctx.stroke();
                break;
            }
            case 'eventBus': {
                // Horizontal pipeline with vertical taps
                const barH = h * 0.25;
                const barY = y + (h - barH) / 2;
                const r = barH / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    this.roundRect(ctx, x, barY, w, barH, r);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                this.roundRect(ctx, x, barY, w, barH, r);
                ctx.stroke();
                // Vertical taps
                const taps = 3;
                for (let i = 0; i < taps; i++) {
                    const tapX = x + w * (0.25 + i * 0.25);
                    ctx.beginPath();
                    ctx.moveTo(tapX, y);
                    ctx.lineTo(tapX, barY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(tapX, barY + barH);
                    ctx.lineTo(tapX, y + h);
                    ctx.stroke();
                    // Small circles at ends
                    const dotR = Math.min(w, h) * 0.03;
                    ctx.beginPath();
                    ctx.arc(tapX, y, dotR, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(tapX, y + h, dotR, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
            case 'microservice': {
                // Hexagon with small gear inside
                const ccx = x + w / 2, ccy = y + h / 2;
                const hexPath = this.getHexPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(hexPath));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(hexPath));
                // Small gear icon in center
                const gearR = Math.min(w, h) * 0.15;
                const teeth = 6;
                const innerGR = gearR * 0.65;
                ctx.beginPath();
                for (let i = 0; i < teeth; i++) {
                    const a1 = (Math.PI * 2 * i) / teeth;
                    const a2 = (Math.PI * 2 * (i + 0.3)) / teeth;
                    const a3 = (Math.PI * 2 * (i + 0.5)) / teeth;
                    const a4 = (Math.PI * 2 * (i + 0.8)) / teeth;
                    if (i === 0) ctx.moveTo(ccx + Math.cos(a1) * innerGR, ccy + Math.sin(a1) * innerGR);
                    ctx.lineTo(ccx + Math.cos(a2) * gearR, ccy + Math.sin(a2) * gearR);
                    ctx.lineTo(ccx + Math.cos(a3) * gearR, ccy + Math.sin(a3) * gearR);
                    ctx.lineTo(ccx + Math.cos(a4) * innerGR, ccy + Math.sin(a4) * innerGR);
                    const nextA = (Math.PI * 2 * (i + 1)) / teeth;
                    ctx.lineTo(ccx + Math.cos(nextA) * innerGR, ccy + Math.sin(nextA) * innerGR);
                }
                ctx.closePath();
                ctx.stroke();
                break;
            }
            case 'shield': {
                const path = this.getShieldPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                // Checkmark inside
                const checkSize = Math.min(w, h) * 0.2;
                const checkCx = x + w / 2;
                const checkCy = y + h * 0.42;
                ctx.beginPath();
                ctx.moveTo(checkCx - checkSize, checkCy);
                ctx.lineTo(checkCx - checkSize * 0.3, checkCy + checkSize * 0.7);
                ctx.lineTo(checkCx + checkSize, checkCy - checkSize * 0.5);
                ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.05);
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
            case 'kubernetes': {
                const ccx = x + w / 2, ccy = y + h / 2;
                const outerR = Math.min(w, h) / 2;
                const innerR = outerR * 0.35;
                const spokes = 7;
                rc.circle(ccx, ccy, outerR * 2, options);
                rc.circle(ccx, ccy, innerR * 2, { ...options, fill: 'none' });
                for (let i = 0; i < spokes; i++) {
                    const angle = (Math.PI * 2 * i) / spokes - Math.PI / 2;
                    const sx = ccx + Math.cos(angle) * innerR;
                    const sy = ccy + Math.sin(angle) * innerR;
                    const ex = ccx + Math.cos(angle) * outerR * 0.85;
                    const ey = ccy + Math.sin(angle) * outerR * 0.85;
                    rc.line(sx, sy, ex, ey, { ...options, fill: 'none' });
                    rc.circle(ex, ey, outerR * 0.16, { ...options, fill: 'none' });
                }
                break;
            }
            case 'container': {
                rc.rectangle(x, y, w, h, options);
                const rows = 3;
                for (let i = 1; i <= rows; i++) {
                    const ly = y + (h * i) / (rows + 1);
                    rc.line(x + w * 0.08, ly, x + w * 0.92, ly, { ...options, fill: 'none' });
                }
                break;
            }
            case 'apiGateway': {
                rc.rectangle(x, y, w, h, options);
                const arrowY = y + h / 2;
                const arrowL = x + w * 0.2;
                const arrowR = x + w * 0.8;
                const arrowH = h * 0.12;
                rc.line(arrowL, arrowY, arrowR - w * 0.1, arrowY, { ...options, fill: 'none' });
                rc.polygon([
                    [arrowR, arrowY],
                    [arrowR - w * 0.1, arrowY - arrowH],
                    [arrowR - w * 0.1, arrowY + arrowH]
                ], { ...options });
                break;
            }
            case 'cdn': {
                const ccx = x + w / 2, ccy = y + h / 2;
                const rx = w / 2, ry = h / 2;
                rc.ellipse(ccx, ccy, rx * 2, ry * 2, options);
                rc.ellipse(ccx, ccy, rx * 0.8, ry * 2, { ...options, fill: 'none' });
                rc.line(x, ccy, x + w, ccy, { ...options, fill: 'none' });
                break;
            }
            case 'storageBlob': {
                // Sketch cylinder using path
                const ellipseH = h * 0.15;
                const bodyTop = y + ellipseH / 2;
                const bodyBot = y + h - ellipseH / 2;
                rc.ellipse(x + w / 2, bodyTop, w, ellipseH * 2, options);
                rc.line(x, bodyTop, x, bodyBot, { ...options, fill: 'none' });
                rc.line(x + w, bodyTop, x + w, bodyBot, { ...options, fill: 'none' });
                rc.arc(x + w / 2, bodyBot, w, ellipseH * 2, 0, Math.PI, false, { ...options, fill: 'none' });
                break;
            }
            case 'eventBus': {
                const barH = h * 0.25;
                const barY = y + (h - barH) / 2;
                rc.rectangle(x, barY, w, barH, options);
                const taps = 3;
                for (let i = 0; i < taps; i++) {
                    const tapX = x + w * (0.25 + i * 0.25);
                    rc.line(tapX, y, tapX, barY, { ...options, fill: 'none' });
                    rc.line(tapX, barY + barH, tapX, y + h, { ...options, fill: 'none' });
                    const dotR = Math.min(w, h) * 0.03;
                    rc.circle(tapX, y, dotR * 2, { ...options, fill: 'none' });
                    rc.circle(tapX, y + h, dotR * 2, { ...options, fill: 'none' });
                }
                break;
            }
            case 'microservice': {
                rc.path(this.getHexPath(x, y, w, h), options);
                // Small gear
                const ccx = x + w / 2, ccy = y + h / 2;
                const gearR = Math.min(w, h) * 0.15;
                const innerGR = gearR * 0.65;
                const teeth = 6;
                let gp = '';
                for (let i = 0; i < teeth; i++) {
                    const a1 = (Math.PI * 2 * i) / teeth;
                    const a2 = (Math.PI * 2 * (i + 0.3)) / teeth;
                    const a3 = (Math.PI * 2 * (i + 0.5)) / teeth;
                    const a4 = (Math.PI * 2 * (i + 0.8)) / teeth;
                    const nextA = (Math.PI * 2 * (i + 1)) / teeth;
                    if (i === 0) gp = `M ${ccx + Math.cos(a1) * innerGR} ${ccy + Math.sin(a1) * innerGR}`;
                    gp += ` L ${ccx + Math.cos(a2) * gearR} ${ccy + Math.sin(a2) * gearR}`;
                    gp += ` L ${ccx + Math.cos(a3) * gearR} ${ccy + Math.sin(a3) * gearR}`;
                    gp += ` L ${ccx + Math.cos(a4) * innerGR} ${ccy + Math.sin(a4) * innerGR}`;
                    gp += ` L ${ccx + Math.cos(nextA) * innerGR} ${ccy + Math.sin(nextA) * innerGR}`;
                }
                gp += ' Z';
                rc.path(gp, { ...options, fill: 'none' });
                break;
            }
            case 'shield': {
                rc.path(this.getShieldPath(x, y, w, h), options);
                const checkSize = Math.min(w, h) * 0.2;
                const checkCx = x + w / 2;
                const checkCy = y + h * 0.42;
                rc.line(checkCx - checkSize, checkCy, checkCx - checkSize * 0.3, checkCy + checkSize * 0.7, { ...options, fill: 'none' });
                rc.line(checkCx - checkSize * 0.3, checkCy + checkSize * 0.7, checkCx + checkSize, checkCy - checkSize * 0.5, { ...options, fill: 'none' });
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

    // ─── SVG Path Generators ─────────────────────────────────────

    private getHexPath(x: number, y: number, w: number, h: number): string {
        const ccx = x + w / 2, ccy = y + h / 2;
        const rx = w / 2, ry = h / 2;
        let p = '';
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6;
            const px = ccx + Math.cos(angle) * rx;
            const py = ccy + Math.sin(angle) * ry;
            if (i === 0) p = `M ${px} ${py}`;
            else p += ` L ${px} ${py}`;
        }
        return p + ' Z';
    }

    private getShieldPath(x: number, y: number, w: number, h: number): string {
        const ccx = x + w / 2;
        const topY = y;
        const midY = y + h * 0.55;
        const botY = y + h;
        let p = `M ${ccx} ${topY}`;
        p += ` L ${x + w} ${topY}`;
        p += ` L ${x + w} ${midY}`;
        p += ` Q ${x + w} ${botY * 0.85 + topY * 0.15} ${ccx} ${botY}`;
        p += ` Q ${x} ${botY * 0.85 + topY * 0.15} ${x} ${midY}`;
        p += ` L ${x} ${topY}`;
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
