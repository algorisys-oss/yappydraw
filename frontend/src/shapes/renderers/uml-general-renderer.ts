import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import { RenderPipeline } from "../base/render-pipeline";
import type { IRenderer } from "../../rendering/IRenderer";
import { getFontString, getMeasurementContext } from "../../utils/text-utils";
import { umlFragmentLayout } from "../../utils/uml-fragment-layout";

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
            this.drawActorPath(renderer, x, y, w, this.actorFigureH(el));
        } else if (el.type === 'umlUseCase') {
            renderer.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (el.type === 'umlPackage') {
            this.drawPackagePath(renderer, x, y, w, h);
        } else if (el.type === 'umlNote') {
            this.drawNotePath(renderer, x, y, w, h);
        } else if (el.type === 'umlComponent') {
            renderer.rect(x, y, w, h);
        } else if (el.type === 'umlLifeline') {
            const boxH = Math.min(60, Math.max(30, h * 0.2));
            renderer.rect(x, y, w, boxH);
        } else if (el.type === 'umlFragment') {
            renderer.rect(x, y, w, h);
        } else if (el.type === 'umlNode') {
            // Deployment Node: front face is the fillable rect (3D faces added below).
            const d = this.nodeDepth(w, h);
            renderer.rect(x, y + d, w - d, h - d);
        } else if (el.type === 'umlArtifact') {
            renderer.rect(x, y, w, h);
        } else if (el.type === 'umlObject' || el.type === 'umlPort') {
            renderer.rect(x, y, w, h);
        } else if (el.type === 'umlHistory') {
            renderer.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (el.type === 'umlAction') {
            // Activity action: rounded "stadium" rectangle.
            renderer.roundRect(x, y, w, h, Math.min(h / 2, w / 2, 18));
        }

        renderer.fillStyle = options.fill || 'transparent';
        if (options.fill && options.fill !== 'none') renderer.fill();
        renderer.lineWidth = el.strokeWidth;
        renderer.strokeStyle = options.stroke || '#000000';
        renderer.stroke();

        // Package: the body's top edge runs under the tab too (sketch draws it).
        if (el.type === 'umlPackage') {
            const tabH = h * 0.15;
            renderer.beginPath();
            renderer.moveTo(x, y + tabH);
            renderer.lineTo(x + w * 0.4, y + tabH);
            renderer.stroke();
        }

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
            const boxH = Math.min(60, Math.max(30, h * 0.2));
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
            const { tabW, tabH } = umlFragmentLayout(el);
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

        // Node: 3D top + right faces (the front face was drawn above).
        if (el.type === 'umlNode') {
            const d = this.nodeDepth(w, h);
            renderer.fillStyle = options.fill || 'transparent';
            renderer.strokeStyle = options.stroke || '#000000';
            renderer.beginPath();
            renderer.moveTo(x, y + d);
            renderer.lineTo(x + d, y);
            renderer.lineTo(x + w, y);
            renderer.lineTo(x + w - d, y + d);
            renderer.closePath();
            if (options.fill && options.fill !== 'none') renderer.fill();
            renderer.stroke();
            renderer.beginPath();
            renderer.moveTo(x + w - d, y + d);
            renderer.lineTo(x + w, y);
            renderer.lineTo(x + w, y + h - d);
            renderer.lineTo(x + w - d, y + h);
            renderer.closePath();
            if (options.fill && options.fill !== 'none') renderer.fill();
            renderer.stroke();
        }

        // Artifact: small folded-corner document icon in the top-right.
        if (el.type === 'umlArtifact') {
            this.drawArtifactIconClean(renderer, x, y, w, options);
        }

        // Object/instance: underline the (centred) label to denote an instance.
        if (el.type === 'umlObject' && el.containerText) {
            renderer.font = getFontString(el);
            const tw = renderer.measureText(el.containerText).width;
            const uy = cy + (el.fontSize || 16) * 0.55;
            renderer.strokeStyle = options.stroke || '#000000';
            renderer.lineWidth = el.strokeWidth;
            renderer.beginPath();
            renderer.moveTo(cx - tw / 2, uy);
            renderer.lineTo(cx + tw / 2, uy);
            renderer.stroke();
        }

        // History pseudostate: an "H" glyph centred in the circle.
        if (el.type === 'umlHistory') {
            renderer.fillStyle = options.stroke || '#000000';
            renderer.font = `bold ${Math.max(10, Math.min(w, h) * 0.5)}px sans-serif`;
            renderer.textAlign = 'center';
            renderer.textBaseline = 'middle';
            renderer.fillText('H', cx, cy);
        }

        // Text: lifeline renders text in top box only; node centres on its front face.
        if (el.type === 'umlLifeline') {
            const boxH = Math.min(60, Math.max(30, h * 0.2));
            const textCy = el.y + boxH / 2;
            RenderPipeline.renderText(context, cx, textCy);
        } else if (el.type === 'umlNode') {
            const d = this.nodeDepth(w, h);
            RenderPipeline.renderText(context, el.x + (w - d) / 2, el.y + d + (h - d) / 2);
        } else if (el.type === 'umlPort' || el.type === 'umlHistory') {
            // Port is a marker (no label); History draws its own "H".
        } else if (el.type === 'umlActor') {
            this.renderActorLabel(context);
        } else if (el.type === 'umlFragment') {
            this.renderFragmentText(context);
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
            // Stick figure (above the label band — see actorFigureH)
            const fh = this.actorFigureH(el);
            const headR = this.actorHeadR(w, fh);
            rc.circle(x + w / 2, y + headR, headR * 2, options);
            rc.line(x + w / 2, y + headR * 2, x + w / 2, y + fh * 0.6, options);
            rc.line(x, y + fh * 0.3, x + w, y + fh * 0.3, options);
            rc.line(x + w / 2, y + fh * 0.6, x, y + fh, options);
            rc.line(x + w / 2, y + fh * 0.6, x + w, y + fh, options);
        } else if (el.type === 'umlUseCase') {
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
            const boxH = Math.min(60, Math.max(30, h * 0.2));
            rc.rectangle(x, y, w, boxH, options);
            // Dashed line
            const dashOptions = { ...options, strokeLineDash: [8, 6], fill: 'none' };
            rc.line(x + w / 2, y + boxH, x + w / 2, y + h, dashOptions);
        } else if (el.type === 'umlFragment') {
            rc.rectangle(x, y, w, h, options);
            // Operator tab
            const { tabW, tabH } = umlFragmentLayout(el);
            const tabPath = `M ${x} ${y} L ${x + tabW} ${y} L ${x + tabW} ${y + tabH} L ${x + tabW - 5} ${y + tabH + 5} L ${x} ${y + tabH + 5} Z`;
            rc.path(tabPath, options);
        } else if (el.type === 'umlNode') {
            // Deployment Node: 3D box (front + top + right faces).
            const d = this.nodeDepth(w, h);
            rc.rectangle(x, y + d, w - d, h - d, options);
            rc.path(`M ${x} ${y + d} L ${x + d} ${y} L ${x + w} ${y} L ${x + w - d} ${y + d} Z`, options);
            rc.path(`M ${x + w - d} ${y + d} L ${x + w} ${y} L ${x + w} ${y + h - d} L ${x + w - d} ${y + h} Z`, options);
        } else if (el.type === 'umlArtifact') {
            rc.rectangle(x, y, w, h, options);
            // Folded-corner document icon top-right
            const s = Math.min(18, w * 0.18, h * 0.3);
            const ix = x + w - s - 8, iy = y + 8, fold = s * 0.4;
            rc.path(`M ${ix} ${iy} L ${ix + s - fold} ${iy} L ${ix + s} ${iy + fold} L ${ix + s} ${iy + s} L ${ix} ${iy + s} Z`, options);
            rc.path(`M ${ix + s - fold} ${iy} L ${ix + s - fold} ${iy + fold} L ${ix + s} ${iy + fold}`, options);
        } else if (el.type === 'umlObject') {
            rc.rectangle(x, y, w, h, options);
        } else if (el.type === 'umlPort') {
            rc.rectangle(x, y, w, h, options);
        } else if (el.type === 'umlHistory') {
            rc.ellipse(x + w / 2, y + h / 2, w, h, options);
        } else if (el.type === 'umlAction') {
            // Activity action: rounded "stadium" rect via an arc path.
            // Four corner arcs. The old two-arc "stadium" path spanned the full height with
            // a radius capped at 18, which SVG silently enlarges to h/2 — so the ends
            // bulged up to h/2 outside the box. Same shape as architectural roundRect.
            const r = Math.min(h / 2, w / 2, 18);
            rc.path(`M ${x + r} ${y} L ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w} ${y + r} L ${x + w} ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} L ${x + r} ${y + h} A ${r} ${r} 0 0 1 ${x} ${y + h - r} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`, options);
        }

        // Object/instance: underline the label (sketch).
        if (el.type === 'umlObject' && el.containerText) {
            const ctx = getMeasurementContext(); ctx.font = getFontString(el);
            const tw = ctx.measureText(el.containerText).width;
            const uy = cy + (el.fontSize || 16) * 0.55;
            rc.line(cx - tw / 2, uy, cx + tw / 2, uy, { ...options, fill: 'none' });
        }

        // Text: lifeline renders text in top box only; node centres on its front face.
        if (el.type === 'umlLifeline') {
            const boxH = Math.min(60, Math.max(30, h * 0.2));
            const textCy = el.y + boxH / 2;
            RenderPipeline.renderText(context, cx, textCy);
        } else if (el.type === 'umlNode') {
            const d = this.nodeDepth(w, h);
            RenderPipeline.renderText(context, el.x + (w - d) / 2, el.y + d + (h - d) / 2);
        } else if (el.type === 'umlPort') {
            // marker — no label
        } else if (el.type === 'umlActor') {
            this.renderActorLabel(context);
        } else if (el.type === 'umlFragment') {
            this.renderFragmentText(context);
        } else if (el.type === 'umlHistory') {
            // "H" glyph (matches architectural)
            const tr = context.renderer;
            tr.fillStyle = options.stroke || '#000000';
            tr.font = `bold ${Math.max(10, Math.min(w, h) * 0.5)}px sans-serif`;
            tr.textAlign = 'center';
            tr.textBaseline = 'middle';
            tr.fillText('H', cx, cy);
        } else {
            RenderPipeline.renderText(context, cx, cy);
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        if (el.type === 'umlActor') {
            // Hit path covers the label band too, so clicking the name selects the actor.
            renderer.rect(el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlUseCase') {
            renderer.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
        } else if (el.type === 'umlPackage') {
            this.drawPackagePath(renderer, el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlNote') {
            this.drawNotePath(renderer, el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlComponent' || el.type === 'umlLifeline' || el.type === 'umlFragment' || el.type === 'umlArtifact' || el.type === 'umlObject' || el.type === 'umlPort') {
            renderer.rect(el.x, el.y, el.width, el.height);
        } else if (el.type === 'umlHistory') {
            renderer.ellipse(el.x + el.width / 2, el.y + el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2);
        } else if (el.type === 'umlAction') {
            renderer.roundRect(el.x, el.y, el.width, el.height, Math.min(el.height / 2, el.width / 2, 18));
        } else if (el.type === 'umlNode') {
            // Hit/selection path: the front face of the 3D box.
            const d = this.nodeDepth(el.width, el.height);
            renderer.rect(el.x, el.y + d, el.width - d, el.height - d);
        }
    }

    /**
     * Fragment text: the operator in the tab and the guard ("[condition]", from
     * attributesText) just below it — UML's layout. Both used to be ignored: the
     * operator was centred in the body and the guard never drawn.
     */
    private renderFragmentText(context: RenderContext) {
        const el = context.element;
        const { tabW, tabH, fontSize } = umlFragmentLayout(el);
        if (el.containerText || el.richContainerText?.length) {
            RenderPipeline.renderText({ ...context, element: { ...el, fontSize, width: tabW - 5, height: tabH + 5, textAlign: 'center', verticalAlign: 'middle' } }, el.x + (tabW - 5) / 2, el.y + (tabH + 5) / 2);
        }
        const guard = el.attributesText;
        if (guard) {
            const guardH = fontSize * 1.6 + 4;
            // Top of the first operand, just under the tab.
            const gx = el.x + 6, gw = Math.max(20, el.width - 12), gy = el.y + tabH + 7;
            RenderPipeline.renderText({ ...context, element: { ...el, containerText: guard, richContainerText: undefined, charTransforms: undefined, curvedText: undefined, fontSize, width: gw, height: guardH, textAlign: 'left', verticalAlign: 'middle' } },
                // renderText left-aligns at cx - width/2 + 10, so this starts the guard at gx.
                gx + gw / 2 - 10, gy + guardH / 2);
        }
    }

    /** Depth of the 3D node box's top/right faces. */
    private nodeDepth(w: number, h: number): number {
        return Math.max(8, Math.min(Math.abs(w), Math.abs(h)) * 0.18, 0) || 8;
    }

    /** Folded-corner document icon (architectural) in the top-right of an Artifact. */
    private drawArtifactIconClean(renderer: IRenderer, x: number, y: number, w: number, options: any) {
        const s = Math.min(18, w * 0.18);
        const ix = x + w - s - 8, iy = y + 8, fold = s * 0.4;
        renderer.fillStyle = options.fill || 'transparent';
        renderer.strokeStyle = options.stroke || '#000000';
        renderer.beginPath();
        renderer.moveTo(ix, iy);
        renderer.lineTo(ix + s - fold, iy);
        renderer.lineTo(ix + s, iy + fold);
        renderer.lineTo(ix + s, iy + s);
        renderer.lineTo(ix, iy + s);
        renderer.closePath();
        if (options.fill && options.fill !== 'none') renderer.fill();
        renderer.stroke();
        renderer.beginPath();
        renderer.moveTo(ix + s - fold, iy);
        renderer.lineTo(ix + s - fold, iy + fold);
        renderer.lineTo(ix + s, iy + fold);
        renderer.stroke();
    }

    /**
     * Height of the actor's stick figure. UML puts the actor's name UNDER the figure;
     * with a label the bottom band of the box is reserved for it (it used to be centred
     * on the shape, i.e. written across the torso).
     */
    private actorFigureH(el: any): number {
        const h = el.height;
        const text = el.containerText || el.text;
        if (!text) return h;
        const lines = String(text).split('\n').length;
        const band = lines * (el.fontSize || 16) * (el.lineHeight || 1.25) + 6;
        return Math.max(h * 0.5, h - band);
    }

    /** Head radius — from the width, but never taller than a fifth of the figure. */
    private actorHeadR(w: number, figH: number): number {
        return Math.min(w * 0.15, figH * 0.1);
    }

    /** Draw the label of an actor centred in the band below its figure. */
    private renderActorLabel(context: RenderContext) {
        const el = context.element;
        const fh = this.actorFigureH(el);
        const bandH = el.height - fh;
        if (bandH <= 0) return;
        // Names are often wider than the figure; let them run past its sides.
        const labelW = Math.max(el.width, 160);
        RenderPipeline.renderText({ ...context, element: { ...el, width: labelW, height: bandH, verticalAlign: 'middle' } }, el.x + el.width / 2, el.y + fh + bandH / 2);
    }

    private drawActorPath(renderer: IRenderer, x: number, y: number, w: number, h: number) {
        const headR = this.actorHeadR(w, h);
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
