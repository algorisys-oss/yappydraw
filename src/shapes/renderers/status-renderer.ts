import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";

export class StatusRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'checkbox': {
                const r = Math.min(w, h) * 0.15;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    this.roundRect(renderer, x, y, w, h, r);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                this.roundRect(renderer, x, y, w, h, r);
                renderer.stroke();
                break;
            }
            case 'checkboxChecked': {
                const r = Math.min(w, h) * 0.15;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    this.roundRect(renderer, x, y, w, h, r);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                this.roundRect(renderer, x, y, w, h, r);
                renderer.stroke();
                // Checkmark
                renderer.beginPath();
                renderer.moveTo(x + w * 0.2, y + h * 0.5);
                renderer.lineTo(x + w * 0.42, y + h * 0.75);
                renderer.lineTo(x + w * 0.8, y + h * 0.25);
                renderer.lineWidth = Math.max(2, Math.min(w, h) * 0.08);
                renderer.stroke();
                break;
            }
            case 'numberedBadge': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                renderer.stroke();
                break;
            }
            case 'questionMark': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                renderer.stroke();
                this.drawSymbol(renderer, el, isDarkMode, '?', ccx, ccy, r);
                break;
            }
            case 'exclamationMark': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.beginPath();
                renderer.ellipse(ccx, ccy, r, r, 0, 0, Math.PI * 2);
                renderer.stroke();
                this.drawSymbol(renderer, el, isDarkMode, '!', ccx, ccy, r);
                break;
            }
            case 'tag': {
                const path = this.getTagPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fillPath(path);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.strokePath(path);
                // Tag hole
                const holeR = Math.min(w, h) * 0.06;
                renderer.beginPath();
                renderer.arc(x + w * 0.15, y + h / 2, holeR, 0, Math.PI * 2);
                renderer.stroke();
                break;
            }
            case 'pin': {
                const path = this.getPinPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fillPath(path);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.strokePath(path);
                // Inner dot
                const dotR = Math.min(w, h) * 0.1;
                const dotCy = y + Math.min(w, h) * 0.3;
                renderer.beginPath();
                renderer.arc(x + w / 2, dotCy, dotR, 0, Math.PI * 2);
                renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                renderer.fill();
                break;
            }
            case 'stamp': {
                const path = this.getStampPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fillPath(path);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.strokePath(path);
                // Inner circle
                const innerR = Math.min(w, h) * 0.32;
                renderer.beginPath();
                renderer.ellipse(x + w / 2, y + h / 2, innerR, innerR, 0, 0, Math.PI * 2);
                renderer.stroke();
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { renderer, rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'checkbox': {
                rc.rectangle(x, y, w, h, options);
                break;
            }
            case 'checkboxChecked': {
                rc.rectangle(x, y, w, h, options);
                rc.line(x + w * 0.2, y + h * 0.5, x + w * 0.42, y + h * 0.75, { ...options, fill: 'none' });
                rc.line(x + w * 0.42, y + h * 0.75, x + w * 0.8, y + h * 0.25, { ...options, fill: 'none' });
                break;
            }
            case 'numberedBadge': {
                rc.circle(x + w / 2, y + h / 2, Math.min(w, h), options);
                break;
            }
            case 'questionMark': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                rc.circle(ccx, ccy, r * 2, options);
                this.drawSymbol(renderer, el, isDarkMode, '?', ccx, ccy, r);
                break;
            }
            case 'exclamationMark': {
                const r = Math.min(w, h) / 2;
                const ccx = x + w / 2, ccy = y + h / 2;
                rc.circle(ccx, ccy, r * 2, options);
                this.drawSymbol(renderer, el, isDarkMode, '!', ccx, ccy, r);
                break;
            }
            case 'tag': {
                rc.path(this.getTagPath(x, y, w, h), options);
                const holeR = Math.min(w, h) * 0.06;
                rc.circle(x + w * 0.15, y + h / 2, holeR * 2, { ...options, fill: 'none' });
                break;
            }
            case 'pin': {
                rc.path(this.getPinPath(x, y, w, h), options);
                const dotR = Math.min(w, h) * 0.1;
                const strokeCol = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
                rc.circle(x + w / 2, y + Math.min(w, h) * 0.3, dotR * 2, { ...options, fill: strokeCol });
                break;
            }
            case 'stamp': {
                rc.path(this.getStampPath(x, y, w, h), options);
                const innerR = Math.min(w, h) * 0.32;
                rc.circle(x + w / 2, y + h / 2, innerR * 2, { ...options, fill: 'none' });
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

    private drawSymbol(renderer: IRenderer, el: any, isDarkMode: boolean, symbol: string, ccx: number, ccy: number, r: number): void {
        const fontSize = r * 1.0;
        renderer.font = `bold ${fontSize}px sans-serif`;
        renderer.textAlign = 'center';
        renderer.textBaseline = 'middle';
        renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
        renderer.fillText(symbol, ccx, ccy + fontSize * 0.05);
    }

    // ─── SVG Path Generators ─────────────────────────────────────

    private getTagPath(x: number, y: number, w: number, h: number): string {
        const notchX = x + w * 0.08;
        const r = Math.min(w, h) * 0.08;
        let p = `M ${notchX} ${y}`;
        p += ` L ${x + w - r} ${y}`;
        p += ` Q ${x + w} ${y} ${x + w} ${y + r}`;
        p += ` L ${x + w} ${y + h - r}`;
        p += ` Q ${x + w} ${y + h} ${x + w - r} ${y + h}`;
        p += ` L ${notchX} ${y + h}`;
        p += ` L ${x} ${y + h / 2}`;
        p += ' Z';
        return p;
    }

    private getPinPath(x: number, y: number, w: number, h: number): string {
        const r = Math.min(w, h) * 0.3;
        const ccx = x + w / 2;
        const ccy = y + r;
        const pointY = y + h;
        let p = `M ${ccx} ${pointY}`;
        p += ` C ${ccx - r * 0.6} ${ccy + r * 1.5} ${ccx - r} ${ccy + r * 0.5} ${ccx - r} ${ccy}`;
        p += ` A ${r} ${r} 0 1 1 ${ccx + r} ${ccy}`;
        p += ` C ${ccx + r} ${ccy + r * 0.5} ${ccx + r * 0.6} ${ccy + r * 1.5} ${ccx} ${pointY}`;
        p += ' Z';
        return p;
    }

    private getStampPath(x: number, y: number, w: number, h: number): string {
        const ccx = x + w / 2, ccy = y + h / 2;
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * 0.85;
        const scallops = 16;
        let p = '';
        for (let i = 0; i < scallops; i++) {
            const a1 = (Math.PI * 2 * i) / scallops;
            const a2 = (Math.PI * 2 * (i + 0.5)) / scallops;
            const a3 = (Math.PI * 2 * (i + 1)) / scallops;
            const x1 = ccx + Math.cos(a1) * outerR;
            const y1 = ccy + Math.sin(a1) * outerR;
            const cpx = ccx + Math.cos(a2) * innerR;
            const cpy = ccy + Math.sin(a2) * innerR;
            const x2 = ccx + Math.cos(a3) * outerR;
            const y2 = ccy + Math.sin(a3) * outerR;
            if (i === 0) p = `M ${x1} ${y1}`;
            p += ` Q ${cpx} ${cpy} ${x2} ${y2}`;
        }
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
