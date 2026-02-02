import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";

export class SketchnoteRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'starPerson': {
                const headRadius = Math.min(Math.abs(w), Math.abs(h)) * 0.15;
                const headX = x + w / 2;
                const headY = y + headRadius;
                const bodyPoints = this.getStarPersonBodyPoints(x, y, w, h, headRadius);

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    rc.ellipse(headX, headY, headRadius * 2, headRadius * 2, { ...options, stroke: 'none', fill: options.fill });
                    rc.polygon(bodyPoints, { ...options, stroke: 'none', fill: options.fill });
                }
                ctx.beginPath();
                ctx.ellipse(headX, headY, headRadius, headRadius, 0, 0, Math.PI * 2);
                ctx.moveTo(bodyPoints[0][0], bodyPoints[0][1]);
                for (let i = 1; i < bodyPoints.length; i++) ctx.lineTo(bodyPoints[i][0], bodyPoints[i][1]);
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke();
                break;
            }
            case 'lightbulb': {
                const bulbR = Math.min(w, h / 1.5) / 2;
                const baseW = w * 0.4;
                const baseH = h * 0.25;
                const baseY = y + h - baseH;
                const bulbPath = this.getLightbulbPath(x, y, w, bulbR, baseW, baseY);

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(bulbPath));
                    ctx.fillRect(x + w / 2 - baseW / 2, baseY, baseW, baseH);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(bulbPath));
                ctx.strokeRect(x + w / 2 - baseW / 2, baseY, baseW, baseH);
                break;
            }
            case 'signpost': {
                const poleW = Math.max(4, w * 0.05);
                const boardH = h * 0.3;
                const boardW = w * 0.9;
                const boardY = y + h * 0.1;
                const poleX = x + w / 2 - poleW / 2;
                const boardX = x + w / 2 - boardW / 2;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fillRect(poleX, y, poleW, h);
                    ctx.fillRect(boardX, boardY, boardW, boardH);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(poleX, y, poleW, h);
                ctx.strokeRect(boardX, boardY, boardW, boardH);
                break;
            }
            case 'burstBlob': {
                const path = this.getBurstBlobPath(el);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'wavyDivider': {
                const path = this.getWavyDividerPath(x, y, w, h);
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'scroll': {
                const scrollPath = this.getScrollPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(scrollPath));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(scrollPath));
                break;
            }
            case 'doubleBanner': {
                const bannerShapes = this.getDoubleBannerPolygons(x, y, w, h);
                for (const poly of bannerShapes) {
                    if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                        ctx.fillStyle = options.fill;
                        ctx.beginPath();
                        ctx.moveTo(poly[0][0], poly[0][1]);
                        for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
                        ctx.closePath();
                        ctx.fill();
                    }
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath();
                    ctx.moveTo(poly[0][0], poly[0][1]);
                    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
                    ctx.closePath();
                    ctx.stroke();
                }
                break;
            }
            case 'trophy': {
                const path = this.getTrophyPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'clock': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath();
                    ctx.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath();
                ctx.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Hands
                ctx.beginPath();
                ctx.moveTo(ccx, ccy);
                ctx.lineTo(ccx, ccy - r * 0.55); // minute hand (12 o'clock)
                ctx.moveTo(ccx, ccy);
                ctx.lineTo(ccx + r * 0.35, ccy + r * 0.1); // hour hand (~3 o'clock)
                ctx.stroke();
                // Center dot
                ctx.beginPath();
                ctx.arc(ccx, ccy, r * 0.06, 0, Math.PI * 2);
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
                break;
            }
            case 'gear': {
                const path = this.getGearPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path), 'evenodd');
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'target': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                const rings = 3;
                for (let i = rings; i >= 1; i--) {
                    const rr = r * (i / rings);
                    if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                        ctx.fillStyle = (i % 2 === 1) ? options.fill : '#ffffff';
                        ctx.beginPath();
                        ctx.ellipse(ccx, ccy, rr, rr, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                    ctx.beginPath();
                    ctx.ellipse(ccx, ccy, rr, rr, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
            case 'rocket': {
                const path = this.getRocketPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'flag': {
                const path = this.getFlagPath(x, y, w, h);
                const poleW = Math.max(3, w * 0.04);
                const poleX = x + w * 0.15 - poleW / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                ctx.strokeRect(poleX, y, poleW, h);
                break;
            }
            case 'key': {
                const path = this.getKeyPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'magnifyingGlass': {
                const path = this.getMagnifyingGlassPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'book': {
                const path = this.getBookPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'megaphone': {
                const path = this.getMegaphonePath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                break;
            }
            case 'eye': {
                const path = this.getEyePath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                // Iris and pupil
                const irisR = Math.min(w, h) * 0.18;
                const pupilR = irisR * 0.45;
                const ecx = x + w / 2, ecy = y + h / 2;
                ctx.beginPath();
                ctx.ellipse(ecx, ecy, irisR, irisR, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(ecx, ecy, pupilR, 0, Math.PI * 2);
                ctx.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                ctx.fill();
                break;
            }
            case 'thoughtBubble': {
                const path = this.getThoughtBubblePath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.fill(new Path2D(path));
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.stroke(new Path2D(path));
                // Trailing thought circles
                const c1r = Math.min(w, h) * 0.05;
                const c2r = c1r * 0.65;
                const c1x = x + w * 0.25, c1y = y + h * 0.88;
                const c2x = x + w * 0.18, c2y = y + h * 0.95;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    ctx.fillStyle = options.fill;
                    ctx.beginPath(); ctx.arc(c1x, c1y, c1r, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(c2x, c2y, c2r, 0, Math.PI * 2); ctx.fill();
                }
                ctx.beginPath(); ctx.arc(c1x, c1y, c1r, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.arc(c2x, c2y, c2r, 0, Math.PI * 2); ctx.stroke();
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
            case 'starPerson': {
                const headRadius = Math.min(Math.abs(w), Math.abs(h)) * 0.15;
                rc.ellipse(x + w / 2, y + headRadius, headRadius * 2, headRadius * 2, options);
                rc.polygon(this.getStarPersonBodyPoints(x, y, w, h, headRadius), options);
                break;
            }
            case 'lightbulb': {
                const bulbR = Math.min(w, h / 1.5) / 2;
                const baseW = w * 0.4;
                const baseH = h * 0.25;
                const baseY = y + h - baseH;
                rc.path(this.getLightbulbPath(x, y, w, bulbR, baseW, baseY), options);
                rc.rectangle(x + w / 2 - baseW / 2, baseY, baseW, baseH, options);
                break;
            }
            case 'signpost': {
                const poleW = Math.max(4, w * 0.05);
                const boardH = h * 0.3;
                const boardW = w * 0.9;
                const boardY = y + h * 0.1;
                rc.rectangle(x + w / 2 - poleW / 2, y, poleW, h, { ...options, fill: 'none' });
                rc.rectangle(x + w / 2 - boardW / 2, boardY, boardW, boardH, options);
                break;
            }
            case 'burstBlob': {
                rc.path(this.getBurstBlobPath(el), options);
                break;
            }
            case 'wavyDivider': {
                rc.path(this.getWavyDividerPath(x, y, w, h), options);
                break;
            }
            case 'scroll': {
                rc.path(this.getScrollPath(x, y, w, h), options);
                break;
            }
            case 'doubleBanner': {
                const bannerPolys = this.getDoubleBannerPolygons(x, y, w, h);
                for (const poly of bannerPolys) {
                    rc.polygon(poly, options);
                }
                break;
            }
            case 'trophy': {
                rc.path(this.getTrophyPath(x, y, w, h), options);
                break;
            }
            case 'clock': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                rc.circle(ccx, ccy, r * 2, options);
                // Hands
                rc.line(ccx, ccy, ccx, ccy - r * 0.55, { ...options, fill: 'none' });
                rc.line(ccx, ccy, ccx + r * 0.35, ccy + r * 0.1, { ...options, fill: 'none' });
                break;
            }
            case 'gear': {
                rc.path(this.getGearPath(x, y, w, h), options);
                break;
            }
            case 'target': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                const rings = 3;
                for (let i = rings; i >= 1; i--) {
                    const rr = r * (i / rings);
                    const ringOpts = (i % 2 === 1) ? options : { ...options, fill: '#ffffff' };
                    rc.circle(ccx, ccy, rr * 2, ringOpts);
                }
                break;
            }
            case 'rocket': {
                rc.path(this.getRocketPath(x, y, w, h), options);
                break;
            }
            case 'flag': {
                const poleW = Math.max(3, w * 0.04);
                const poleX = x + w * 0.15 - poleW / 2;
                rc.path(this.getFlagPath(x, y, w, h), options);
                rc.rectangle(poleX, y, poleW, h, { ...options, fill: 'none' });
                break;
            }
            case 'key': {
                rc.path(this.getKeyPath(x, y, w, h), options);
                break;
            }
            case 'magnifyingGlass': {
                rc.path(this.getMagnifyingGlassPath(x, y, w, h), options);
                break;
            }
            case 'book': {
                rc.path(this.getBookPath(x, y, w, h), options);
                break;
            }
            case 'megaphone': {
                rc.path(this.getMegaphonePath(x, y, w, h), options);
                break;
            }
            case 'eye': {
                rc.path(this.getEyePath(x, y, w, h), options);
                // Iris
                const irisR = Math.min(w, h) * 0.18;
                rc.circle(x + w / 2, y + h / 2, irisR * 2, options);
                // Pupil (filled)
                const pupilR = irisR * 0.45;
                const strokeCol = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                rc.circle(x + w / 2, y + h / 2, pupilR * 2, { ...options, fill: strokeCol });
                break;
            }
            case 'thoughtBubble': {
                rc.path(this.getThoughtBubblePath(x, y, w, h), options);
                // Trailing thought circles
                const c1r = Math.min(w, h) * 0.05;
                const c2r = c1r * 0.65;
                rc.circle(x + w * 0.25, y + h * 0.88, c1r * 2, options);
                rc.circle(x + w * 0.18, y + h * 0.95, c2r * 2, options);
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private getStarPersonBodyPoints(x: number, y: number, w: number, h: number, headRadius: number): [number, number][] {
        const cx = x + w / 2;
        return [
            [cx, y + headRadius * 2], [x, y + h * 0.4], [cx, y + h * 0.5], [x + w, y + h * 0.4],
            [cx, y + headRadius * 2], [x + w * 0.8, y + h], [cx, y + h * 0.7], [x + w * 0.2, y + h],
            [cx, y + headRadius * 2]
        ];
    }

    private getLightbulbPath(x: number, y: number, w: number, bulbR: number, baseW: number, baseY: number) {
        const cx = x + w / 2;
        return `
            M ${cx - baseW / 2} ${baseY}
            C ${cx - baseW / 2} ${y + bulbR} ${x} ${y + bulbR * 1.5} ${x} ${y + bulbR}
            A ${bulbR} ${bulbR} 0 1 1 ${x + w} ${y + bulbR}
            C ${x + w} ${y + bulbR * 1.5} ${cx + baseW / 2} ${y + bulbR} ${cx + baseW / 2} ${baseY}
            Z
        `;
    }

    private getWavyDividerPath(x: number, y: number, w: number, h: number) {
        const cy = y + h / 2;
        const waves = 4;
        const waveW = w / waves;
        let d = `M ${x} ${cy}`;
        for (let i = 0; i < waves; i++) {
            const wx = x + i * waveW;
            d += ` Q ${wx + waveW / 4} ${cy - h / 2}, ${wx + waveW / 2} ${cy}`;
            d += ` Q ${wx + waveW * 0.75} ${cy + h / 2}, ${wx + waveW} ${cy}`;
        }
        return d;
    }

    private getBurstBlobPath(el: any) {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const cx = x + w / 2, cy = y + h / 2;
        const rx = w / 2, ry = h / 2;
        const spikes = 12;
        const outerR = Math.min(rx, ry);
        const innerR = outerR * 0.6;
        const seed = el.seed || 1;

        const randomSeeded = (s: number) => {
            let t = s += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };

        let path = "";
        for (let i = 0; i < spikes * 2; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const rnd = randomSeeded(seed + i);
            const rVar = r + (rnd - 0.5) * (outerR * 0.1);
            const angle = (Math.PI * i) / spikes;
            const px = cx + Math.cos(angle) * (w / h) * rVar;
            const py = cy + Math.sin(angle) * rVar;
            path += (i === 0 ? "M " : " L ") + px + " " + py;
        }
        return path + " Z";
    }

    private getScrollPath(x: number, y: number, w: number, h: number): string {
        const rH = h * 0.15;
        return `M ${x} ${y + rH} L ${x + w} ${y + rH} L ${x + w} ${y + h - rH} L ${x} ${y + h - rH} Z `
            + `M ${x} ${y + rH} C ${x - rH} ${y + rH} ${x - rH} ${y} ${x} ${y} L ${x + w} ${y} C ${x + w + rH} ${y} ${x + w + rH} ${y + rH} ${x + w} ${y + rH} `
            + `M ${x} ${y + h - rH} C ${x - rH} ${y + h - rH} ${x - rH} ${y + h} ${x} ${y + h} L ${x + w} ${y + h} C ${x + w + rH} ${y + h} ${x + w + rH} ${y + h - rH} ${x + w} ${y + h - rH}`;
    }

    private getDoubleBannerPolygons(x: number, y: number, w: number, h: number): [number, number][][] {
        const eW = w * 0.15;
        const eH = h * 0.25;
        const mh = y + h;
        return [
            // Left ribbon
            [[x + eW, y + eH], [x, y + eH], [x + eW / 2, y], [x, mh], [x + eW, mh]],
            // Right ribbon
            [[x + w - eW, y + eH], [x + w, y + eH], [x + w - eW / 2, y], [x + w, mh], [x + w - eW, mh]],
            // Center panel
            [[x + eW, y], [x + w - eW, y], [x + w - eW, y + h - eH], [x + eW, y + h - eH]]
        ];
    }

    private getTrophyPath(x: number, y: number, w: number, h: number): string {
        const cupTop = y;
        const cupBottom = y + h * 0.55;
        const stemTop = cupBottom;
        const stemBottom = y + h * 0.8;
        const baseTop = stemBottom;
        const baseBottom = y + h;
        const cupW = w * 0.6;
        const cupL = x + (w - cupW) / 2;
        const cupR = cupL + cupW;
        const stemW = w * 0.1;
        const stemL = x + w / 2 - stemW / 2;
        const stemR = stemL + stemW;
        const baseW = w * 0.5;
        const baseL = x + (w - baseW) / 2;
        const baseR = baseL + baseW;
        // Handles
        const handleW = w * 0.18;

        return `M ${cupL} ${cupTop} L ${cupR} ${cupTop} L ${cupR} ${cupBottom} L ${cupL} ${cupBottom} Z `
            + `M ${stemL} ${stemTop} L ${stemR} ${stemTop} L ${stemR} ${stemBottom} L ${stemL} ${stemBottom} Z `
            + `M ${baseL} ${baseTop} L ${baseR} ${baseTop} L ${baseR} ${baseBottom} L ${baseL} ${baseBottom} Z `
            + `M ${cupL} ${cupTop + (cupBottom - cupTop) * 0.15} C ${cupL - handleW} ${cupTop + (cupBottom - cupTop) * 0.15} ${cupL - handleW} ${cupBottom - (cupBottom - cupTop) * 0.15} ${cupL} ${cupBottom - (cupBottom - cupTop) * 0.15} `
            + `M ${cupR} ${cupTop + (cupBottom - cupTop) * 0.15} C ${cupR + handleW} ${cupTop + (cupBottom - cupTop) * 0.15} ${cupR + handleW} ${cupBottom - (cupBottom - cupTop) * 0.15} ${cupR} ${cupBottom - (cupBottom - cupTop) * 0.15}`;
    }

    private getGearPath(x: number, y: number, w: number, h: number): string {
        const ccx = x + w / 2, ccy = y + h / 2;
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * 0.7;
        const holeR = outerR * 0.25;
        const teeth = 8;
        const toothDepth = outerR - innerR;

        let path = '';
        for (let i = 0; i < teeth; i++) {
            const a1 = (Math.PI * 2 * i) / teeth;
            const a2 = (Math.PI * 2 * (i + 0.35)) / teeth;
            const a3 = (Math.PI * 2 * (i + 0.5)) / teeth;
            const a4 = (Math.PI * 2 * (i + 0.85)) / teeth;
            const a5 = (Math.PI * 2 * (i + 1)) / teeth;

            const p1 = [ccx + Math.cos(a1) * innerR, ccy + Math.sin(a1) * innerR];
            const p2 = [ccx + Math.cos(a2) * (innerR + toothDepth), ccy + Math.sin(a2) * (innerR + toothDepth)];
            const p3 = [ccx + Math.cos(a3) * (innerR + toothDepth), ccy + Math.sin(a3) * (innerR + toothDepth)];
            const p4 = [ccx + Math.cos(a4) * innerR, ccy + Math.sin(a4) * innerR];
            const p5 = [ccx + Math.cos(a5) * innerR, ccy + Math.sin(a5) * innerR];

            path += (i === 0 ? `M ${p1[0]} ${p1[1]}` : `L ${p1[0]} ${p1[1]}`);
            path += ` L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]} L ${p4[0]} ${p4[1]} L ${p5[0]} ${p5[1]}`;
        }
        path += ' Z';

        // Center hole
        const holeSteps = 16;
        for (let i = 0; i <= holeSteps; i++) {
            const a = (Math.PI * 2 * i) / holeSteps;
            const px = ccx + Math.cos(a) * holeR;
            const py = ccy + Math.sin(a) * holeR;
            path += (i === 0 ? ` M ${px} ${py}` : ` L ${px} ${py}`);
        }
        path += ' Z';

        return path;
    }

    private getRocketPath(x: number, y: number, w: number, h: number): string {
        const bw = w * 0.5; // body width
        const bx = x + (w - bw) / 2;
        const noseH = h * 0.25;
        const bodyBottom = y + h * 0.75;
        const finW = w * 0.2;
        const finH = h * 0.25;

        // Body with nose cone
        let path = `M ${bx + bw / 2} ${y}`; // nose tip
        path += ` C ${bx + bw} ${y + noseH * 0.5} ${bx + bw} ${y + noseH} ${bx + bw} ${y + noseH}`; // right side of nose
        path += ` L ${bx + bw} ${bodyBottom}`; // right side of body
        path += ` L ${bx} ${bodyBottom}`; // bottom of body
        path += ` L ${bx} ${y + noseH}`; // left side of body
        path += ` C ${bx} ${y + noseH} ${bx} ${y + noseH * 0.5} ${bx + bw / 2} ${y}`; // left side of nose
        path += ' Z';

        // Left fin
        path += ` M ${bx} ${bodyBottom - finH * 0.3}`;
        path += ` L ${bx - finW} ${bodyBottom + finH * 0.5}`;
        path += ` L ${bx} ${bodyBottom}`;
        path += ' Z';

        // Right fin
        path += ` M ${bx + bw} ${bodyBottom - finH * 0.3}`;
        path += ` L ${bx + bw + finW} ${bodyBottom + finH * 0.5}`;
        path += ` L ${bx + bw} ${bodyBottom}`;
        path += ' Z';

        // Exhaust flame
        path += ` M ${bx + bw * 0.2} ${bodyBottom}`;
        path += ` L ${bx + bw / 2} ${y + h}`;
        path += ` L ${bx + bw * 0.8} ${bodyBottom}`;

        return path;
    }

    private getFlagPath(x: number, y: number, w: number, h: number): string {
        const poleX = x + w * 0.15;
        const flagL = poleX;
        const flagR = x + w;
        const flagTop = y;
        const flagH = h * 0.55;
        const waveDip = flagH * 0.15;

        // Waving flag
        return `M ${flagL} ${flagTop}`
            + ` C ${flagL + (flagR - flagL) * 0.33} ${flagTop - waveDip} ${flagL + (flagR - flagL) * 0.66} ${flagTop + waveDip} ${flagR} ${flagTop}`
            + ` L ${flagR} ${flagTop + flagH}`
            + ` C ${flagL + (flagR - flagL) * 0.66} ${flagTop + flagH + waveDip} ${flagL + (flagR - flagL) * 0.33} ${flagTop + flagH - waveDip} ${flagL} ${flagTop + flagH}`
            + ' Z';
    }

    private getKeyPath(x: number, y: number, w: number, h: number): string {
        const cx = x + w / 2;
        // Bow (oval ring at top)
        const bowRx = w * 0.35;
        const bowRy = h * 0.25;
        const bowCy = y + bowRy;
        // Shaft
        const shaftW = w * 0.12;
        const shaftTop = bowCy + bowRy * 0.7;
        const shaftBottom = y + h;
        const shaftL = cx - shaftW / 2;
        const shaftR = cx + shaftW / 2;
        // Teeth
        const toothW = w * 0.15;
        const toothH = h * 0.08;
        const tooth1Y = shaftBottom - h * 0.25;
        const tooth2Y = shaftBottom - h * 0.12;

        // Bow outline (ellipse approximated with arcs)
        let path = `M ${cx - bowRx} ${bowCy}`;
        path += ` A ${bowRx} ${bowRy} 0 1 1 ${cx + bowRx} ${bowCy}`;
        path += ` A ${bowRx} ${bowRy} 0 1 1 ${cx - bowRx} ${bowCy}`;
        path += ' Z';

        // Shaft
        path += ` M ${shaftL} ${shaftTop} L ${shaftR} ${shaftTop} L ${shaftR} ${shaftBottom} L ${shaftL} ${shaftBottom} Z`;

        // Teeth (right side notches)
        path += ` M ${shaftR} ${tooth1Y} L ${shaftR + toothW} ${tooth1Y} L ${shaftR + toothW} ${tooth1Y + toothH} L ${shaftR} ${tooth1Y + toothH}`;
        path += ` M ${shaftR} ${tooth2Y} L ${shaftR + toothW} ${tooth2Y} L ${shaftR + toothW} ${tooth2Y + toothH} L ${shaftR} ${tooth2Y + toothH}`;

        return path;
    }

    private getMagnifyingGlassPath(x: number, y: number, w: number, h: number): string {
        // Lens circle in upper-left area
        const lensR = Math.min(w, h) * 0.32;
        const lensCx = x + w * 0.42;
        const lensCy = y + h * 0.38;

        // Handle extends to bottom-right
        const handleW = Math.max(w * 0.1, 4);
        const angle = Math.PI / 4; // 45 degrees
        const handleStartX = lensCx + Math.cos(angle) * lensR;
        const handleStartY = lensCy + Math.sin(angle) * lensR;
        const handleLen = Math.min(w, h) * 0.4;
        const handleEndX = handleStartX + Math.cos(angle) * handleLen;
        const handleEndY = handleStartY + Math.sin(angle) * handleLen;

        // Perpendicular offset for handle width
        const px = Math.cos(angle + Math.PI / 2) * handleW / 2;
        const py = Math.sin(angle + Math.PI / 2) * handleW / 2;

        // Lens circle
        let path = `M ${lensCx - lensR} ${lensCy}`;
        path += ` A ${lensR} ${lensR} 0 1 1 ${lensCx + lensR} ${lensCy}`;
        path += ` A ${lensR} ${lensR} 0 1 1 ${lensCx - lensR} ${lensCy}`;
        path += ' Z';

        // Handle rectangle
        path += ` M ${handleStartX + px} ${handleStartY + py}`;
        path += ` L ${handleEndX + px} ${handleEndY + py}`;
        path += ` L ${handleEndX - px} ${handleEndY - py}`;
        path += ` L ${handleStartX - px} ${handleStartY - py}`;
        path += ' Z';

        return path;
    }

    private getBookPath(x: number, y: number, w: number, h: number): string {
        const cx = x + w / 2;
        const spine = cx;
        const top = y + h * 0.05;
        const bottom = y + h * 0.95;
        const coverBulge = h * 0.08;

        // Left page
        let path = `M ${spine} ${top}`;
        path += ` C ${spine - w * 0.1} ${top + coverBulge} ${x + w * 0.05} ${top + coverBulge} ${x} ${top}`;
        path += ` L ${x} ${bottom}`;
        path += ` C ${x + w * 0.05} ${bottom - coverBulge} ${spine - w * 0.1} ${bottom - coverBulge} ${spine} ${bottom}`;
        path += ' Z';

        // Right page
        path += ` M ${spine} ${top}`;
        path += ` C ${spine + w * 0.1} ${top + coverBulge} ${x + w * 0.95} ${top + coverBulge} ${x + w} ${top}`;
        path += ` L ${x + w} ${bottom}`;
        path += ` C ${x + w * 0.95} ${bottom - coverBulge} ${spine + w * 0.1} ${bottom - coverBulge} ${spine} ${bottom}`;
        path += ' Z';

        // Spine line
        path += ` M ${spine} ${top} L ${spine} ${bottom}`;

        return path;
    }

    private getMegaphonePath(x: number, y: number, w: number, h: number): string {
        // Cone flaring to the right
        const mouthL = x + w * 0.15;
        const mouthR = x + w;
        const mouthTopY = y;
        const mouthBottomY = y + h * 0.75;
        const backTopY = y + h * 0.25;
        const backBottomY = y + h * 0.5;

        // Main cone body
        let path = `M ${mouthL} ${backTopY}`;
        path += ` L ${mouthR} ${mouthTopY}`;
        path += ` L ${mouthR} ${mouthBottomY}`;
        path += ` L ${mouthL} ${backBottomY}`;
        path += ' Z';

        // Handle (small rectangle at back-bottom)
        const handleW = w * 0.12;
        const handleH = h * 0.25;
        const handleX = mouthL - handleW * 0.3;
        const handleY = backBottomY;
        path += ` M ${handleX} ${handleY} L ${handleX + handleW} ${handleY} L ${handleX + handleW} ${handleY + handleH} L ${handleX} ${handleY + handleH} Z`;

        return path;
    }

    private getEyePath(x: number, y: number, w: number, h: number): string {
        const cy = y + h / 2;
        const rx = w / 2;
        const ry = h / 2;

        // Almond/lemon eye shape using two cubic bezier curves
        let path = `M ${x} ${cy}`;
        path += ` C ${x + rx * 0.4} ${cy - ry * 1.3} ${x + rx * 1.6} ${cy - ry * 1.3} ${x + w} ${cy}`;
        path += ` C ${x + rx * 1.6} ${cy + ry * 1.3} ${x + rx * 0.4} ${cy + ry * 1.3} ${x} ${cy}`;
        path += ' Z';

        return path;
    }

    private getThoughtBubblePath(x: number, y: number, w: number, h: number): string {
        // Cloud-like blob occupying top ~80% of the bounding box
        const cloudH = h * 0.8;
        const cx = x + w / 2;
        const cy = y + cloudH / 2;
        const rx = w * 0.48;
        const ry = cloudH * 0.45;

        // Cloud outline using bumpy curves
        const bumps = 8;
        let path = '';
        for (let i = 0; i < bumps; i++) {
            const a1 = (Math.PI * 2 * i) / bumps;
            const a2 = (Math.PI * 2 * (i + 1)) / bumps;
            const aMid = (a1 + a2) / 2;

            const x1 = cx + Math.cos(a1) * rx;
            const y1 = cy + Math.sin(a1) * ry;
            const bumpR = 1.25; // how far bumps protrude
            const cpx = cx + Math.cos(aMid) * rx * bumpR;
            const cpy = cy + Math.sin(aMid) * ry * bumpR;
            const x2 = cx + Math.cos(a2) * rx;
            const y2 = cy + Math.sin(a2) * ry;

            if (i === 0) {
                path = `M ${x1} ${y1}`;
            }
            path += ` Q ${cpx} ${cpy} ${x2} ${y2}`;
        }
        path += ' Z';

        return path;
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(ctx, geometry);
    }
}
