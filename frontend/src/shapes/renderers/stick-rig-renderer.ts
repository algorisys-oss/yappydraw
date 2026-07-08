/**
 * Renderer for the animated `stickRig` element. Computes the figure's pose from its
 * motion clip + the global clock each frame (the canvas repaints while the animation
 * ticker is forced — see canvas.tsx's flow predicate) and draws bones + head. Stroke
 * colour/width come from the element, so recolour works like any shape.
 */
import { ShapeRenderer } from '../base/shape-renderer';
import { RenderPipeline } from '../base/render-pipeline';
import type { RenderContext } from '../base/types';
import type { IRenderer } from '../../rendering/IRenderer';
import { store } from '../../store/app-store';
import { effectiveTime } from '../../utils/animation/animation-engine';
import { getClip, poseAt, WALK_STRIDE } from '../../library/stick-figures/anim/clips';
import { elementPathSample, sampleAt } from '../../library/stick-figures/anim/path-follow';
import { RIG_W, RIG_H, type JointId, type RigPose } from '../../library/stick-figures/anim/rig';

interface BoxPose {
    /** Bone polylines in absolute canvas coords. */
    bones: Array<Array<[number, number]>>;
    head: { cx: number; cy: number; rx: number; ry: number };
}

const CHAINS: JointId[][] = [
    ['pelvis', 'shoulder'],
    ['shoulder', 'head'],
    ['shoulder', 'upperArmL', 'foreArmL'],
    ['shoulder', 'upperArmR', 'foreArmR'],
    ['pelvis', 'thighL', 'shinL'],
    ['pelvis', 'thighR', 'shinR'],
];

export class StickRigRenderer extends ShapeRenderer {
    /** Evaluate the current pose and map it into the element's bounding box. */
    private computePose(el: any): BoxPose {
        const data = el.stickRig || { clip: 'idle' };
        const sx = el.width / RIG_W, sy = el.height / RIG_H;
        const t = effectiveTime() / 1000;

        let clipId: string = data.clip || 'idle';
        let facing: 1 | -1 = data.facing ?? 1;
        let phase: number | undefined;
        let originX = el.x, originY = el.y;

        // Walk-along-a-path: move the figure along a route, feet planted, auto-facing.
        const pathEl = data.path?.pathId && store.elements.find((e: any) => e.id === data.path.pathId);
        if (pathEl) {
            const s = elementPathSample(pathEl);
            if (s) {
                const dur = data.path.dur || 4;
                const prog = data.path.loop !== false ? ((t / dur) % 1 + 1) % 1 : Math.min(1, t / dur);
                const at = sampleAt(s, prog);
                if (data.path.autoFace !== false) facing = at.tx >= 0 ? 1 : -1;
                const strideWorld = Math.max(1, WALK_STRIDE * sx);   // ground per cycle, world units
                const cycles = Math.max(1, s.len / strideWorld);
                phase = (prog * cycles) % 1;
                clipId = 'walk';
                // Place the figure so its feet (rig y≈226) sit on the path point.
                originX = at.x - 70 * sx;
                originY = at.y - 226 * sy;
            }
        }

        if (phase === undefined) {
            const clip = getClip(clipId);
            phase = data.playing !== false
                ? t * (data.speed ?? 1) / clip.duration
                : (data.previewPhase ?? 0);
        }

        const pose: RigPose = poseAt(clipId, phase ?? 0, facing);
        const X = (p: { x: number; y: number }) => [originX + p.x * sx, originY + p.y * sy] as [number, number];
        const bones = CHAINS.map(chain => chain.map(id => X(pose.joints.get(id)!)));
        return {
            bones,
            head: { cx: originX + pose.head.x * sx, cy: originY + pose.head.y * sy, rx: pose.headR * sx, ry: pose.headR * sy },
        };
    }

    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const { bones, head } = this.computePose(el);
        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
        for (const poly of bones) {
            renderer.beginPath();
            renderer.moveTo(poly[0][0], poly[0][1]);
            for (let i = 1; i < poly.length; i++) renderer.lineTo(poly[i][0], poly[i][1]);
            renderer.stroke();
        }
        renderer.beginPath();
        renderer.ellipse(head.cx, head.cy, head.rx, head.ry, 0, 0, Math.PI * 2);
        renderer.stroke();
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeOpts = { ...options, fill: 'none' };
        const { bones, head } = this.computePose(el);
        for (const poly of bones) {
            for (let i = 1; i < poly.length; i++) {
                rc.line(poly[i - 1][0], poly[i - 1][1], poly[i][0], poly[i][1], strokeOpts);
            }
        }
        rc.circle(head.cx, head.cy, head.rx * 2, options);
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const { bones } = this.computePose(el);
        for (const poly of bones) {
            renderer.moveTo(poly[0][0], poly[0][1]);
            for (let i = 1; i < poly.length; i++) renderer.lineTo(poly[i][0], poly[i][1]);
        }
    }
}
