import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import type { RenderContext } from "../base/types";

export class InfraRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { ctx, element: el, isDarkMode } = context;
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const backgroundColor = el.backgroundColor === 'transparent' ? undefined : RenderPipeline.adjustColor(el.backgroundColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'server': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                const slotH = h * 0.05;
                const slotW = w * 0.7;
                const slotX = x + (w - slotW) / 2;
                ctx.fillStyle = strokeColor;
                for (let i = 0; i < 3; i++) {
                    ctx.fillRect(slotX, y + h - (i + 1) * slotH * 2 - slotH, slotW, slotH);
                }
                break;
            }
            case 'loadBalancer': {
                const center_x = x + w / 2, center_y = y + h / 2;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath(); ctx.ellipse(center_x, center_y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.ellipse(center_x, center_y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke();
                const arrowLen = w * 0.3;
                ctx.beginPath(); ctx.moveTo(center_x - arrowLen, center_y); ctx.lineTo(center_x + arrowLen, center_y); ctx.stroke();
                // Arrowheads
                this.drawArchArrowhead(ctx, center_x + arrowLen, center_y, 0);
                this.drawArchArrowhead(ctx, center_x - arrowLen, center_y, Math.PI);
                break;
            }
            case 'firewall': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                const rows = 4, cols = 3;
                const headerH = h * 0.15;
                ctx.beginPath(); ctx.moveTo(x, y + headerH); ctx.lineTo(x + w, y + headerH);
                ctx.stroke();
                const rowH = (h - headerH) / rows;
                const colW = w / cols;
                ctx.beginPath();
                for (let i = 1; i < rows; i++) {
                    ctx.moveTo(x, y + headerH + i * rowH); ctx.lineTo(x + w, y + headerH + i * rowH);
                }
                for (let i = 0; i < rows; i++) {
                    const shift = (i % 2 === 0) ? 0 : colW / 2;
                    for (let j = 1; j < cols; j++) {
                        const vx = x + j * colW + shift;
                        if (vx < x + w) {
                            ctx.moveTo(vx, y + i * rowH); ctx.lineTo(vx, y + (i + 1) * rowH);
                        }
                    }
                }
                ctx.stroke();
                break;
            }
            case 'user': {
                const headR = Math.min(w, h) * 0.25;
                const center_x = x + w / 2;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath(); ctx.arc(center_x, y + headR, headR, 0, Math.PI * 2); ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.arc(center_x, y + headR, headR, 0, Math.PI * 2); ctx.stroke();
                const shoulderW = w * 0.8;
                ctx.beginPath();
                ctx.moveTo(center_x - shoulderW / 2, y + h);
                ctx.quadraticCurveTo(center_x, y + headR * 1.5, center_x + shoulderW / 2, y + h);
                ctx.stroke();
                break;
            }
            case 'messageQueue': {
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.fillRect(x, y, w, h);
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.strokeRect(x, y, w, h);
                const segments = 4;
                const segW = w / segments;
                ctx.beginPath();
                for (let i = 1; i < segments; i++) {
                    ctx.moveTo(x + i * segW, y); ctx.lineTo(x + i * segW, y + h);
                }
                ctx.stroke();
                break;
            }
            case 'lambda': {
                const center_x = x + w / 2, center_y = y + h / 2;
                const zapW = w * 0.4, zapH = h * 0.6;
                const zx = center_x - zapW / 2, zy = center_y - zapH / 2;
                const zapPath = `M ${zx + zapW} ${zy} L ${zx} ${zy + zapH * 0.6} L ${zx + zapW * 0.6} ${zy + zapH * 0.5} L ${zx} ${zy + zapH} L ${zx + zapW} ${zy + zapH * 0.4} L ${zx + zapW * 0.4} ${zy + zapH * 0.5} Z`;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath(); ctx.ellipse(center_x, center_y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.ellipse(center_x, center_y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = strokeColor;
                ctx.fill(new Path2D(zapPath));
                break;
            }
            case 'router': {
                const center_x = x + w / 2, center_y = y + h / 2;
                if (backgroundColor) {
                    ctx.fillStyle = backgroundColor;
                    ctx.beginPath(); ctx.ellipse(center_x, center_y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
                }
                RenderPipeline.applyStrokeStyle(ctx, el, isDarkMode);
                ctx.beginPath(); ctx.ellipse(center_x, center_y, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke();
                const r = Math.min(w, h) * 0.3;
                ctx.beginPath();
                for (let a = 0; a < 4; a++) {
                    const angle = (Math.PI / 2) * a + Math.PI / 4;
                    ctx.moveTo(center_x, center_y); ctx.lineTo(center_x + r * Math.cos(angle), center_y + r * Math.sin(angle));
                }
                ctx.stroke();
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeColor = RenderPipeline.adjustColor(el.strokeColor, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'server': {
                rc.rectangle(x, y, w, h, options);
                const slotW = w * 0.7;
                const slotH = h * 0.05;
                const slotX = x + (w - slotW) / 2;
                for (let i = 0; i < 3; i++) {
                    rc.rectangle(slotX, y + h - (i + 1) * slotH * 2 - slotH, slotW, slotH, { ...options, fillStyle: 'solid', fill: strokeColor });
                }
                break;
            }
            case 'loadBalancer': {
                const center_x = x + w / 2, center_y = y + h / 2;
                rc.ellipse(center_x, center_y, w, h, options);
                const arrowLen = w * 0.3;
                rc.line(center_x - arrowLen, center_y, center_x + arrowLen, center_y, options);
                this.drawSketchArrowhead(rc, center_x + arrowLen, center_y, 0, options);
                this.drawSketchArrowhead(rc, center_x - arrowLen, center_y, Math.PI, options);
                break;
            }
            case 'firewall': {
                rc.rectangle(x, y, w, h, options);
                const rows = 4, cols = 3;
                const rowH = h / rows;
                const colW = w / cols;
                for (let i = 1; i < rows; i++) {
                    rc.line(x, y + i * rowH, x + w, y + i * rowH, options);
                }
                for (let i = 0; i < rows; i++) {
                    const shift = (i % 2 === 0) ? 0 : colW / 2;
                    for (let j = 1; j < cols; j++) {
                        const vx = x + j * colW + shift;
                        if (vx < x + w) rc.line(vx, y + i * rowH, vx, y + (i + 1) * rowH, options);
                    }
                }
                break;
            }
            case 'user': {
                const headR = Math.min(w, h) * 0.25;
                const center_x = x + w / 2;
                rc.circle(center_x, y + headR, headR * 2, options);
                const shoulderW = w * 0.8;
                const path = `M ${center_x - shoulderW / 2} ${y + h} Q ${center_x} ${y + headR * 1.5} ${center_x + shoulderW / 2} ${y + h} Z`;
                rc.path(path, options);
                break;
            }
            case 'messageQueue': {
                rc.rectangle(x, y, w, h, options);
                const segments = 4;
                const segW = w / segments;
                for (let i = 1; i < segments; i++) {
                    rc.line(x + i * segW, y, x + i * segW, y + h, options);
                }
                break;
            }
            case 'lambda': {
                const center_x = x + w / 2, center_y = y + h / 2;
                const zapW = w * 0.4, zapH = h * 0.6;
                const zx = center_x - zapW / 2, zy = center_y - zapH / 2;
                const zapPath = `M ${zx + zapW} ${zy} L ${zx} ${zy + zapH * 0.6} L ${zx + zapW * 0.6} ${zy + zapH * 0.5} L ${zx} ${zy + zapH} L ${zx + zapW} ${zy + zapH * 0.4} L ${zx + zapW * 0.4} ${zy + zapH * 0.5} Z`;
                rc.ellipse(center_x, center_y, w, h, options);
                rc.path(zapPath, { ...options, fillStyle: 'solid', fill: strokeColor });
                break;
            }
            case 'router': {
                const center_x = x + w / 2, center_y = y + h / 2;
                rc.ellipse(center_x, center_y, w, h, options);
                const r = Math.min(w, h) * 0.3;
                for (let a = 0; a < 4; a++) {
                    const angle = (Math.PI / 2) * a + Math.PI / 4;
                    const px = center_x + r * Math.cos(angle);
                    const py = center_y + r * Math.sin(angle);
                    rc.line(center_x, center_y, px, py, options);
                    this.drawSketchArrowhead(rc, px, py, angle, options);
                }
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    private drawArchArrowhead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
        ctx.beginPath();
        ctx.moveTo(x - 5 * Math.cos(angle - Math.PI / 6), y - 5 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x, y);
        ctx.lineTo(x - 5 * Math.cos(angle + Math.PI / 6), y - 5 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    private drawSketchArrowhead(rc: any, x: number, y: number, angle: number, options: any) {
        const headLen = 10;
        const p1 = { x: x - headLen * Math.cos(angle - Math.PI / 6), y: y - headLen * Math.sin(angle - Math.PI / 6) };
        const p2 = { x: x - headLen * Math.cos(angle + Math.PI / 6), y: y - headLen * Math.sin(angle + Math.PI / 6) };
        rc.line(x, y, p1.x, p1.y, options);
        rc.line(x, y, p2.x, p2.y, options);
    }

    protected definePath(ctx: CanvasRenderingContext2D, el: any): void {
        if (el.type === 'loadBalancer' || el.type === 'router' || el.type === 'lambda') {
            ctx.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
        } else {
            ctx.rect(el.x, el.y, el.width, el.height);
        }
    }
}
