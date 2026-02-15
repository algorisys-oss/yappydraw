import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import { RenderPipeline } from "../base/render-pipeline";
import type { IRenderer } from "../../rendering/IRenderer";

export class UmlGeneralRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const w = el.width;
        const h = el.height;
        const x = el.x;
        const y = el.y;

        renderer.beginPath();
        if (el.type === 'umlActor') {
            this.drawActorPath(renderer, x, y, w, h);
        } else if (el.type === 'umlUseCase' || el.type === 'umlInterface') {
            renderer.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (el.type === 'umlPackage') {
            this.drawPackagePath(renderer, x, y, w, h);
        } else if (el.type === 'umlNote') {
            this.drawNotePath(renderer, x, y, w, h);
        } else if (el.type === 'umlComponent') {
            renderer.rect(x, y, w, h);
        } else if (el.type === 'umlLifeline') {
            const boxH = Math.max(30, h * 0.2);
            renderer.rect(x, y, w, boxH);
        } else if (el.type === 'umlFragment') {
            renderer.rect(x, y, w, h);
        }

        renderer.fillStyle = options.fill || 'transparent';
        if (options.fill && options.fill !== 'none') renderer.fill();
        renderer.lineWidth = el.strokeWidth;
        renderer.strokeStyle = options.stroke || '#000000';
        renderer.stroke();

        // Inner details (Note dog-ear fold)
        if (el.type === 'umlNote') {
            const fold = Math.min(w, h) * 0.15;
            renderer.beginPath();
            renderer.moveTo(x + w - fold, y);
            renderer.lineTo(x + w - fold, y + fold);
            renderer.lineTo(x + w, y + fold);
            renderer.stroke();
        }

        // Component: two small tab rectangles on left edge
        if (el.type === 'umlComponent') {
            const tabW = Math.min(16, w * 0.15);
            const tabH = Math.min(10, h * 0.08);
            const tabX = x - tabW / 2;
            renderer.fillStyle = options.fill || 'transparent';
            renderer.strokeStyle = options.stroke || '#000000';
            // Upper tab
            renderer.beginPath();
            renderer.rect(tabX, y + h * 0.25 - tabH / 2, tabW, tabH);
            if (options.fill && options.fill !== 'none') renderer.fill();
            renderer.stroke();
            // Lower tab
            renderer.beginPath();
            renderer.rect(tabX, y + h * 0.55 - tabH / 2, tabW, tabH);
            if (options.fill && options.fill !== 'none') renderer.fill();
            renderer.stroke();
        }

        // Lifeline: dashed vertical line below object box
        if (el.type === 'umlLifeline') {
            const boxH = Math.max(30, h * 0.2);
            renderer.save();
            renderer.setLineDash([8, 6]);
            renderer.beginPath();
            renderer.moveTo(x + w / 2, y + boxH);
            renderer.lineTo(x + w / 2, y + h);
            renderer.stroke();
            renderer.restore();
        }

        // Fragment: operator label tab in top-left corner
        if (el.type === 'umlFragment') {
            const tabW = Math.min(w * 0.3, 60);
            const tabH = Math.min(h * 0.12, 22);
            renderer.fillStyle = options.fill || 'transparent';
            renderer.strokeStyle = options.stroke || '#000000';
            renderer.beginPath();
            renderer.moveTo(x, y);
            renderer.lineTo(x + tabW, y);
            renderer.lineTo(x + tabW, y + tabH);
            renderer.lineTo(x + tabW - 5, y + tabH + 5);
            renderer.lineTo(x, y + tabH + 5);
            renderer.closePath();
            if (options.fill && options.fill !== 'none') renderer.fill();
            renderer.stroke();
        }

        // Text: lifeline renders text in top box only
        if (el.type === 'umlLifeline') {
            const boxH = Math.max(30, h * 0.2);
            const textCy = el.y + boxH / 2;
            RenderPipeline.renderText(context, cx, textCy);
        } else {
            RenderPipeline.renderText(context, cx, cy);
        }
    }

    protected renderSketch(context: RenderContext, cx: number, cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const w = el.width;
        const h = el.height;
        const x = el.x;
        const y = el.y;

        if (el.type === 'umlActor') {
            // Stick figure
            const headR = w * 0.15;
            rc.circle(x + w / 2, y + headR, headR * 2, options);
            rc.line(x + w / 2, y + headR * 2, x + w / 2, y + h * 0.6, options);
            rc.line(x, y + h * 0.3, x + w, y + h * 0.3, options);
            rc.line(x + w / 2, y + h * 0.6, x, y + h, options);
            rc.line(x + w / 2, y + h * 0.6, x + w, y + h, options);
        } else if (el.type === 'umlUseCase' || el.type === 'umlInterface') {
            rc.ellipse(x + w / 2, y + h / 2, w, h, options);
        } else if (el.type === 'umlPackage') {
            const tabH = h * 0.15;
            const tabW = w * 0.4;
            const path = `M ${x} ${y} L ${x + tabW} ${y} L ${x + tabW} ${y + tabH} L ${x + w} ${y + tabH} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
            rc.path(path, options);
            rc.line(x, y + tabH, x + tabW, y + tabH, options);
        } else if (el.type === 'umlNote') {
            const fold = Math.min(w, h) * 0.15;
            const path = `M ${x} ${y} L ${x + w - fold} ${y} L ${x + w} ${y + fold} L ${x + w} ${y + h} L ${x} ${y + h} L ${x} ${y} Z`;
            rc.path(path, options);
            rc.path(`M ${x + w - fold} ${y} L ${x + w - fold} ${y + fold} L ${x + w} ${y + fold}`, options);
        } else if (el.type === 'umlComponent') {
            rc.rectangle(x, y, w, h, options);
            // Two tabs on left edge
            const tabW = Math.min(16, w * 0.15);
            const tabH = Math.min(10, h * 0.08);
            const tabX = x - tabW / 2;
            rc.rectangle(tabX, y + h * 0.25 - tabH / 2, tabW, tabH, options);
            rc.rectangle(tabX, y + h * 0.55 - tabH / 2, tabW, tabH, options);
        } else if (el.type === 'umlLifeline') {
            const boxH = Math.max(30, h * 0.2);
            rc.rectangle(x, y, w, boxH, options);
            // Dashed line
            const dashOptions = { ...options, strokeLineDash: [8, 6], fill: 'none' };
            rc.line(x + w / 2, y + boxH, x + w / 2, y + h, dashOptions);
        } else if (el.type === 'umlFragment') {
            rc.rectangle(x, y, w, h, options);
            // Operator tab
            const tabW = Math.min(w * 0.3, 60);
            const tabH = Math.min(h * 0.12, 22);
            const tabPath = `M ${x} ${y} L ${x + tabW} ${y} L ${x + tabW} ${y + tabH} L ${x + tabW - 5} ${y + tabH + 5} L ${x} ${y + tabH + 5} Z`;
            rc.path(tabPath, options);
        }

        // Text: lifeline renders text in top box only
        if (el.type === 'umlLifeline') {
            const boxH = Math.max(30, h * 0.2);
            const textCy = el.y + boxH / 2;
            RenderPipeline.renderText(context, cx, textCy);
        } else {
            RenderPipeline.renderText(context, cx, cy);
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        if (el.type === 'umlActor') {
            this.drawActorPath(renderer, el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlUseCase' || el.type === 'umlInterface') {
            renderer.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
        } else if (el.type === 'umlPackage') {
            this.drawPackagePath(renderer, el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlNote') {
            this.drawNotePath(renderer, el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlComponent' || el.type === 'umlLifeline' || el.type === 'umlFragment') {
            renderer.rect(el.x, el.y, el.width, el.height);
        }
    }

    private drawActorPath(renderer: IRenderer, x: number, y: number, w: number, h: number) {
        const headR = w * 0.15;
        renderer.moveTo(x + w / 2 + headR, y + headR);
        renderer.arc(x + w / 2, y + headR, headR, 0, Math.PI * 2);
        renderer.moveTo(x + w / 2, y + headR * 2);
        renderer.lineTo(x + w / 2, y + h * 0.6);
        renderer.moveTo(x, y + h * 0.3);
        renderer.lineTo(x + w, y + h * 0.3);
        renderer.moveTo(x + w / 2, y + h * 0.6);
        renderer.lineTo(x, y + h);
        renderer.moveTo(x + w / 2, y + h * 0.6);
        renderer.lineTo(x + w, y + h);
    }

    private drawPackagePath(renderer: IRenderer, x: number, y: number, w: number, h: number) {
        const tabH = h * 0.15;
        const tabW = w * 0.4;
        renderer.moveTo(x, y);
        renderer.lineTo(x + tabW, y);
        renderer.lineTo(x + tabW, y + tabH);
        renderer.lineTo(x + w, y + tabH);
        renderer.lineTo(x + w, y + h);
        renderer.lineTo(x, y + h);
        renderer.closePath();
    }

    private drawNotePath(renderer: IRenderer, x: number, y: number, w: number, h: number) {
        const fold = Math.min(w, h) * 0.15;
        renderer.moveTo(x, y);
        renderer.lineTo(x + w - fold, y);
        renderer.lineTo(x + w, y + fold);
        renderer.lineTo(x + w, y + h);
        renderer.lineTo(x, y + h);
        renderer.closePath();
    }
}
