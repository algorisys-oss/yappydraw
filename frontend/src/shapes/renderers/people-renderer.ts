import { ShapeRenderer } from "../base/shape-renderer";
import { RenderPipeline } from "../base/render-pipeline";
import { getShapeGeometry } from "../../utils/shape-geometry";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";

export class PeopleRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, cx: number, cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const x = el.x, y = el.y, w = el.width, h = el.height;

        switch (el.type) {
            case 'stickFigure': {
                const headR = Math.min(w, h) * 0.12;
                const hx = x + w / 2, hy = y + headR;
                const bodyTop = hy + headR;
                const bodyBottom = y + h * 0.6;
                const armY = bodyTop + (bodyBottom - bodyTop) * 0.2;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.ellipse(hx, hy, headR, headR, 0, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Head
                renderer.beginPath();
                renderer.ellipse(hx, hy, headR, headR, 0, 0, Math.PI * 2);
                renderer.stroke();
                // Spine
                renderer.beginPath();
                renderer.moveTo(hx, bodyTop);
                renderer.lineTo(hx, bodyBottom);
                renderer.stroke();
                // Arms
                renderer.beginPath();
                renderer.moveTo(x + w * 0.15, armY - h * 0.05);
                renderer.lineTo(hx, armY);
                renderer.lineTo(x + w * 0.85, armY - h * 0.05);
                renderer.stroke();
                // Legs
                renderer.beginPath();
                renderer.moveTo(x + w * 0.2, y + h);
                renderer.lineTo(hx, bodyBottom);
                renderer.lineTo(x + w * 0.8, y + h);
                renderer.stroke();
                break;
            }
            case 'sittingPerson': {
                const headR = Math.min(w, h) * 0.11;
                const hx = x + w / 2, hy = y + headR;
                const bodyTop = hy + headR;
                const seatY = y + h * 0.55;
                const armY = bodyTop + (seatY - bodyTop) * 0.25;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.ellipse(hx, hy, headR, headR, 0, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Head
                renderer.beginPath();
                renderer.ellipse(hx, hy, headR, headR, 0, 0, Math.PI * 2);
                renderer.stroke();
                // Spine
                renderer.beginPath();
                renderer.moveTo(hx, bodyTop);
                renderer.lineTo(hx, seatY);
                renderer.stroke();
                // Arms (resting forward)
                renderer.beginPath();
                renderer.moveTo(x + w * 0.2, armY + h * 0.05);
                renderer.lineTo(hx, armY);
                renderer.lineTo(x + w * 0.8, armY + h * 0.05);
                renderer.stroke();
                // Thighs (horizontal)
                renderer.beginPath();
                renderer.moveTo(hx, seatY);
                renderer.lineTo(x + w * 0.8, seatY);
                renderer.stroke();
                // Lower legs (hanging down)
                renderer.beginPath();
                renderer.moveTo(x + w * 0.8, seatY);
                renderer.lineTo(x + w * 0.8, y + h);
                renderer.stroke();
                break;
            }
            case 'presentingPerson': {
                const headR = Math.min(w, h) * 0.1;
                const hx = x + w * 0.3, hy = y + headR;
                const bodyTop = hy + headR;
                const bodyBottom = y + h * 0.6;
                const armY = bodyTop + (bodyBottom - bodyTop) * 0.15;

                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.beginPath();
                    renderer.ellipse(hx, hy, headR, headR, 0, 0, Math.PI * 2);
                    renderer.fill();
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                // Head
                renderer.beginPath();
                renderer.ellipse(hx, hy, headR, headR, 0, 0, Math.PI * 2);
                renderer.stroke();
                // Spine
                renderer.beginPath();
                renderer.moveTo(hx, bodyTop);
                renderer.lineTo(hx, bodyBottom);
                renderer.stroke();
                // Left arm (down)
                renderer.beginPath();
                renderer.moveTo(hx, armY);
                renderer.lineTo(x + w * 0.1, bodyBottom);
                renderer.stroke();
                // Right arm (pointing up-right to board)
                renderer.beginPath();
                renderer.moveTo(hx, armY);
                renderer.lineTo(x + w * 0.75, y + h * 0.1);
                renderer.stroke();
                // Legs
                renderer.beginPath();
                renderer.moveTo(x + w * 0.15, y + h);
                renderer.lineTo(hx, bodyBottom);
                renderer.lineTo(x + w * 0.45, y + h);
                renderer.stroke();
                // Board/whiteboard
                renderer.strokeRect(x + w * 0.55, y, w * 0.45, h * 0.5);
                break;
            }
            case 'handPointRight': {
                const path = this.getHandPointRightPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fillPath(path);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.strokePath(path);
                break;
            }
            case 'thumbsUp': {
                const path = this.getThumbsUpPath(x, y, w, h);
                if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
                    renderer.fillStyle = options.fill;
                    renderer.fillPath(path);
                }
                RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
                renderer.strokePath(path);
                break;
            }
            case 'faceHappy': {
                this.renderFace(renderer, el, isDarkMode, options, 'happy');
                break;
            }
            case 'faceSad': {
                this.renderFace(renderer, el, isDarkMode, options, 'sad');
                break;
            }
            case 'faceConfused': {
                this.renderFace(renderer, el, isDarkMode, options, 'confused');
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
            case 'stickFigure': {
                const headR = Math.min(w, h) * 0.12;
                const hx = x + w / 2, hy = y + headR;
                const bodyTop = hy + headR;
                const bodyBottom = y + h * 0.6;
                const armY = bodyTop + (bodyBottom - bodyTop) * 0.2;

                rc.circle(hx, hy, headR * 2, options);
                rc.line(hx, bodyTop, hx, bodyBottom, { ...options, fill: 'none' });
                rc.line(x + w * 0.15, armY - h * 0.05, hx, armY, { ...options, fill: 'none' });
                rc.line(hx, armY, x + w * 0.85, armY - h * 0.05, { ...options, fill: 'none' });
                rc.line(x + w * 0.2, y + h, hx, bodyBottom, { ...options, fill: 'none' });
                rc.line(hx, bodyBottom, x + w * 0.8, y + h, { ...options, fill: 'none' });
                break;
            }
            case 'sittingPerson': {
                const headR = Math.min(w, h) * 0.11;
                const hx = x + w / 2, hy = y + headR;
                const bodyTop = hy + headR;
                const seatY = y + h * 0.55;
                const armY = bodyTop + (seatY - bodyTop) * 0.25;

                rc.circle(hx, hy, headR * 2, options);
                rc.line(hx, bodyTop, hx, seatY, { ...options, fill: 'none' });
                rc.line(x + w * 0.2, armY + h * 0.05, hx, armY, { ...options, fill: 'none' });
                rc.line(hx, armY, x + w * 0.8, armY + h * 0.05, { ...options, fill: 'none' });
                rc.line(hx, seatY, x + w * 0.8, seatY, { ...options, fill: 'none' });
                rc.line(x + w * 0.8, seatY, x + w * 0.8, y + h, { ...options, fill: 'none' });
                break;
            }
            case 'presentingPerson': {
                const headR = Math.min(w, h) * 0.1;
                const hx = x + w * 0.3, hy = y + headR;
                const bodyTop = hy + headR;
                const bodyBottom = y + h * 0.6;
                const armY = bodyTop + (bodyBottom - bodyTop) * 0.15;

                rc.circle(hx, hy, headR * 2, options);
                rc.line(hx, bodyTop, hx, bodyBottom, { ...options, fill: 'none' });
                rc.line(hx, armY, x + w * 0.1, bodyBottom, { ...options, fill: 'none' });
                rc.line(hx, armY, x + w * 0.75, y + h * 0.1, { ...options, fill: 'none' });
                rc.line(x + w * 0.15, y + h, hx, bodyBottom, { ...options, fill: 'none' });
                rc.line(hx, bodyBottom, x + w * 0.45, y + h, { ...options, fill: 'none' });
                rc.rectangle(x + w * 0.55, y, w * 0.45, h * 0.5, options);
                break;
            }
            case 'handPointRight': {
                rc.path(this.getHandPointRightPath(x, y, w, h), options);
                break;
            }
            case 'thumbsUp': {
                rc.path(this.getThumbsUpPath(x, y, w, h), options);
                break;
            }
            case 'faceHappy': {
                this.renderFaceSketch(rc, el, isDarkMode, options, 'happy');
                break;
            }
            case 'faceSad': {
                this.renderFaceSketch(rc, el, isDarkMode, options, 'sad');
                break;
            }
            case 'faceConfused': {
                this.renderFaceSketch(rc, el, isDarkMode, options, 'confused');
                break;
            }
        }

        RenderPipeline.renderText(context, cx, cy);
    }

    // ─── Face rendering (architectural) ──────────────────────────────

    private renderFace(
        renderer: IRenderer,
        el: any,
        isDarkMode: boolean,
        options: any,
        mood: 'happy' | 'sad' | 'confused'
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const r = Math.min(w, h) / 2;
        const fcx = x + w / 2, fcy = y + h / 2;

        // Face circle
        if (options.fill && options.fill !== 'transparent' && options.fill !== 'none') {
            renderer.fillStyle = options.fill;
            renderer.beginPath();
            renderer.ellipse(fcx, fcy, r, r, 0, 0, Math.PI * 2);
            renderer.fill();
        }
        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
        renderer.beginPath();
        renderer.ellipse(fcx, fcy, r, r, 0, 0, Math.PI * 2);
        renderer.stroke();

        // Eyes
        const eyeR = r * 0.08;
        const eyeY = fcy - r * 0.2;
        const eyeSpacing = r * 0.3;

        renderer.beginPath();
        renderer.arc(fcx - eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
        renderer.fillStyle = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
        renderer.fill();
        renderer.beginPath();
        renderer.arc(fcx + eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
        renderer.fill();

        // Mouth
        const mouthY = fcy + r * 0.25;
        const mouthW = r * 0.4;
        renderer.beginPath();
        if (mood === 'happy') {
            renderer.arc(fcx, mouthY - r * 0.05, mouthW, 0.1, Math.PI - 0.1);
        } else if (mood === 'sad') {
            renderer.arc(fcx, mouthY + r * 0.2, mouthW, Math.PI + 0.1, -0.1);
        } else {
            // Confused: wavy line
            renderer.moveTo(fcx - mouthW, mouthY);
            renderer.quadraticCurveTo(fcx - mouthW * 0.3, mouthY - r * 0.1, fcx, mouthY);
            renderer.quadraticCurveTo(fcx + mouthW * 0.3, mouthY + r * 0.1, fcx + mouthW, mouthY);
        }
        renderer.stroke();

        // Confused: eyebrow quirk
        if (mood === 'confused') {
            renderer.beginPath();
            renderer.moveTo(fcx + eyeSpacing - eyeR * 2, eyeY - r * 0.15);
            renderer.lineTo(fcx + eyeSpacing + eyeR * 2, eyeY - r * 0.22);
            renderer.stroke();
        }
    }

    // ─── Face rendering (sketch / RoughJS) ───────────────────────────

    private renderFaceSketch(
        rc: any,
        el: any,
        isDarkMode: boolean,
        options: any,
        mood: 'happy' | 'sad' | 'confused'
    ): void {
        const x = el.x, y = el.y, w = el.width, h = el.height;
        const r = Math.min(w, h) / 2;
        const fcx = x + w / 2, fcy = y + h / 2;

        // Face circle
        rc.circle(fcx, fcy, r * 2, options);

        // Eyes (small filled circles)
        const eyeR = r * 0.08;
        const eyeY = fcy - r * 0.2;
        const eyeSpacing = r * 0.3;
        const strokeCol = RenderPipeline.adjustColor(el.strokeColor || '#000000', isDarkMode);
        rc.circle(fcx - eyeSpacing, eyeY, eyeR * 2, { ...options, fill: strokeCol });
        rc.circle(fcx + eyeSpacing, eyeY, eyeR * 2, { ...options, fill: strokeCol });

        // Mouth
        const mouthY = fcy + r * 0.25;
        const mouthW = r * 0.4;
        if (mood === 'happy') {
            rc.arc(fcx, mouthY - r * 0.05, mouthW * 2, mouthW * 2, 0.1, Math.PI - 0.1, false, { ...options, fill: 'none' });
        } else if (mood === 'sad') {
            rc.arc(fcx, mouthY + r * 0.2, mouthW * 2, mouthW * 2, Math.PI + 0.1, -0.1, false, { ...options, fill: 'none' });
        } else {
            // Confused wavy mouth
            const mPath = `M ${fcx - mouthW} ${mouthY} Q ${fcx - mouthW * 0.3} ${mouthY - r * 0.1} ${fcx} ${mouthY} Q ${fcx + mouthW * 0.3} ${mouthY + r * 0.1} ${fcx + mouthW} ${mouthY}`;
            rc.path(mPath, { ...options, fill: 'none' });
        }

        // Confused eyebrow
        if (mood === 'confused') {
            rc.line(
                fcx + eyeSpacing - eyeR * 2, eyeY - r * 0.15,
                fcx + eyeSpacing + eyeR * 2, eyeY - r * 0.22,
                { ...options, fill: 'none' }
            );
        }
    }

    // ─── SVG Path Generators ─────────────────────────────────────────

    private getHandPointRightPath(x: number, y: number, w: number, h: number): string {
        // Pointing hand: wrist left, index finger pointing right, curled fingers below
        const wristL = x;
        const wristR = x + w * 0.35;
        const wristT = y + h * 0.15;
        const wristB = y + h * 0.55;

        // Index finger
        const fingerTip = x + w;
        const fingerT = y + h * 0.08;
        const fingerB = y + h * 0.32;
        const fingerR = Math.min(w, h) * 0.06;

        // Thumb (curves upward from palm)
        const thumbTipX = x + w * 0.2;
        const thumbTipY = y;

        // Curled fingers (three arcs below palm)
        const curlTop = wristB;
        const curlBot = y + h;
        const curlL = x + w * 0.08;
        const curlR = wristR + w * 0.05;
        const curlMid1 = curlTop + (curlBot - curlTop) * 0.33;
        const curlMid2 = curlTop + (curlBot - curlTop) * 0.66;

        let p = '';
        // Start at wrist top-left, go right to finger base
        p += `M ${wristL} ${wristT}`;
        // Thumb bump
        p += ` Q ${thumbTipX - w * 0.05} ${thumbTipY + h * 0.02} ${thumbTipX} ${thumbTipY}`;
        p += ` Q ${thumbTipX + w * 0.08} ${thumbTipY} ${wristR - w * 0.05} ${fingerT + h * 0.02}`;
        // Along top of index finger to tip
        p += ` L ${wristR} ${fingerT}`;
        p += ` L ${fingerTip - fingerR} ${fingerT}`;
        p += ` Q ${fingerTip} ${fingerT} ${fingerTip} ${(fingerT + fingerB) / 2}`;
        p += ` Q ${fingerTip} ${fingerB} ${fingerTip - fingerR} ${fingerB}`;
        // Back along bottom of index finger
        p += ` L ${wristR} ${fingerB}`;
        // Down to curled fingers zone
        p += ` L ${curlR} ${curlTop}`;
        // Three curled finger bumps
        p += ` Q ${curlR + w * 0.1} ${curlTop + (curlMid1 - curlTop) * 0.5} ${curlR} ${curlMid1}`;
        p += ` Q ${curlR + w * 0.1} ${curlMid1 + (curlMid2 - curlMid1) * 0.5} ${curlR} ${curlMid2}`;
        p += ` Q ${curlR + w * 0.08} ${curlMid2 + (curlBot - curlMid2) * 0.5} ${curlR - w * 0.05} ${curlBot}`;
        // Bottom of palm back to wrist
        p += ` L ${curlL} ${curlBot}`;
        p += ` Q ${wristL - w * 0.02} ${curlBot} ${wristL} ${wristB}`;
        p += ` Z`;

        return p;
    }

    private getThumbsUpPath(x: number, y: number, w: number, h: number): string {
        // Thumbs up: rounded fist at bottom with thumb extending upward
        const fistL = x + w * 0.1;
        const fistR = x + w * 0.9;
        const fistT = y + h * 0.42;
        const fistB = y + h;
        const fistRound = Math.min(w, h) * 0.06;

        // Thumb
        const thumbL = x + w * 0.28;
        const thumbR = x + w * 0.52;
        const thumbTop = y;
        const thumbRound = (thumbR - thumbL) / 2;

        let p = '';
        // Start at thumb base left, go up
        p += `M ${thumbL} ${fistT}`;
        p += ` L ${thumbL} ${thumbTop + thumbRound}`;
        p += ` Q ${thumbL} ${thumbTop} ${(thumbL + thumbR) / 2} ${thumbTop}`;
        p += ` Q ${thumbR} ${thumbTop} ${thumbR} ${thumbTop + thumbRound}`;
        p += ` L ${thumbR} ${fistT}`;
        // Fist top edge to right
        p += ` L ${fistR - fistRound} ${fistT}`;
        p += ` Q ${fistR} ${fistT} ${fistR} ${fistT + fistRound}`;
        // Fist right edge down
        p += ` L ${fistR} ${fistB - fistRound}`;
        p += ` Q ${fistR} ${fistB} ${fistR - fistRound} ${fistB}`;
        // Fist bottom edge
        p += ` L ${fistL + fistRound} ${fistB}`;
        p += ` Q ${fistL} ${fistB} ${fistL} ${fistB - fistRound}`;
        // Fist left edge up
        p += ` L ${fistL} ${fistT + fistRound}`;
        p += ` Q ${fistL} ${fistT} ${fistL + fistRound} ${fistT}`;
        p += ` Z`;

        // Finger separation lines (as part of path for rendering)
        const lineY1 = fistT + (fistB - fistT) * 0.33;
        const lineY2 = fistT + (fistB - fistT) * 0.63;
        p += ` M ${thumbR + w * 0.04} ${lineY1} L ${fistR - w * 0.06} ${lineY1}`;
        p += ` M ${thumbR + w * 0.04} ${lineY2} L ${fistR - w * 0.06} ${lineY2}`;

        return p;
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const geometry = getShapeGeometry(el);
        if (!geometry) return;
        renderer.translate(el.x + el.width / 2, el.y + el.height / 2);
        RenderPipeline.renderGeometry(renderer, geometry);
    }
}
