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
import { RIG_W, RIG_H, headAttach, type JointId, type RigPose } from '../../library/stick-figures/anim/rig';
import {
    faceGeometry, hairGeometry, asFaceStyle, asHairStyle,
    type FacePrim,
} from '../../library/stick-figures/face';

interface BoxPose {
    /** Bone polylines in absolute canvas coords. */
    bones: Array<Array<[number, number]>>;
    head: { cx: number; cy: number; rx: number; ry: number };
    /** Hair marks (drawn under the face), then face marks — absolute canvas coords. */
    hair: FacePrim[];
    face: FacePrim[];
}

/** Linear blend between two canonical poses (for smooth sequence transitions). */
function lerpRigPose(a: RigPose, b: RigPose, f: number): RigPose {
    const L = (u: number, v: number) => u + (v - u) * f;
    const joints = new Map<JointId, { x: number; y: number }>();
    for (const [k, p] of a.joints) {
        const q = b.joints.get(k) || p;
        joints.set(k, { x: L(p.x, q.x), y: L(p.y, q.y) });
    }
    return { joints, head: { x: L(a.head.x, b.head.x), y: L(a.head.y, b.head.y) }, headR: L(a.headR, b.headR) };
}

/** Cross-fade duration between sequence steps (seconds). */
const SEQ_BLEND = 0.18;

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
        // Scene Timeline drives a shared, scrubbable clock; otherwise free-run.
        const t = store.showSceneTimeline ? store.storyTime : effectiveTime() / 1000;

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

        // Action sequence: cycle through timed steps (unless following a path).
        let blended: RigPose | null = null;
        if (phase === undefined && data.sequence?.length) {
            const seq = data.sequence as { clip: string; dur: number }[];
            const total = seq.reduce((s, a) => s + Math.max(0.1, a.dur), 0);
            const base = data.playing !== false ? t * (data.speed ?? 1) : (data.previewPhase ?? 0) * total;
            let tt = ((base % total) + total) % total;
            let idx = 0, step = seq[0], local = tt;
            for (let i = 0; i < seq.length; i++) { const d = Math.max(0.1, seq[i].dur); if (tt < d) { idx = i; step = seq[i]; local = tt; break; } tt -= d; }
            clipId = step.clip;
            phase = local / getClip(clipId).duration;
            // Cross-fade from the previous step's final pose over the first SEQ_BLEND s.
            if (seq.length > 1 && local < SEQ_BLEND) {
                const prev = seq[(idx - 1 + seq.length) % seq.length];
                const prevPose = poseAt(prev.clip, (prev.dur / getClip(prev.clip).duration), facing);
                blended = lerpRigPose(prevPose, poseAt(clipId, phase, facing), local / SEQ_BLEND);
            }
        }

        if (phase === undefined) {
            const clip = getClip(clipId);
            phase = data.playing !== false
                ? t * (data.speed ?? 1) / clip.duration
                : (data.previewPhase ?? 0);
        }

        const pose: RigPose = blended ?? poseAt(clipId, phase ?? 0, facing);
        const X = (p: { x: number; y: number }) => [originX + p.x * sx, originY + p.y * sy] as [number, number];
        const bones = CHAINS.map(chain => chain.map(id => X(pose.joints.get(id)!)));
        // Neck (CHAINS[1] = shoulder→head) stops at the head-circle edge, not its
        // centre — otherwise the segment inside the head reads as a radius line.
        bones[1] = [X(pose.joints.get('shoulder')!), X(headAttach(pose))];
        const head = { cx: originX + pose.head.x * sx, cy: originY + pose.head.y * sy, rx: pose.headR * sx, ry: pose.headR * sy };
        // Face/hair are generated for a circular head; a non-uniformly scaled box
        // uses the mean radius so the marks stay centred and proportional.
        const hr = (head.rx + head.ry) / 2;
        const faceOpts = {
            face: asFaceStyle(data.face, 'neutral'),
            hair: asHairStyle(data.hair, 'none'),
            hairColor: data.hairColor,
            headFill: !!data.headFill,
            facing,
        };
        return {
            bones,
            head,
            hair: hairGeometry(head.cx, head.cy, hr, faceOpts),
            face: faceGeometry(head.cx, head.cy, hr, faceOpts),
        };
    }

    /** Draw face/hair marks on the clean canvas path. */
    private drawPrimsArchitectural(renderer: IRenderer, prims: FacePrim[], stroke: string): void {
        for (const p of prims) {
            if (p.k !== 'dot') renderer.lineWidth = p.w;
            switch (p.k) {
                case 'dot':
                    renderer.beginPath();
                    renderer.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    renderer.fillStyle = stroke;
                    renderer.fill();
                    break;
                case 'ring':
                    renderer.beginPath();
                    renderer.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    if (p.fill) { renderer.fillStyle = p.fill; renderer.fill(); }
                    renderer.stroke();
                    break;
                case 'oval':
                    renderer.beginPath();
                    renderer.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
                    if (p.fill) { renderer.fillStyle = p.fill; renderer.fill(); }
                    renderer.stroke();
                    break;
                case 'arc':
                    renderer.beginPath();
                    renderer.arc(p.x, p.y, p.r, p.a0, p.a1);
                    renderer.stroke();
                    break;
                case 'poly':
                    renderer.beginPath();
                    renderer.moveTo(p.pts[0][0], p.pts[0][1]);
                    for (let i = 1; i < p.pts.length; i++) renderer.lineTo(p.pts[i][0], p.pts[i][1]);
                    renderer.stroke();
                    break;
                // An SVG-path geometry is a self-contained Path2D: it must be filled
                // AND stroked through fillPath/strokePath, not beginPath()+fill().
                case 'path':
                    if (p.fill) { renderer.fillStyle = p.fill; renderer.fillPath(p.d); }
                    renderer.strokePath(p.d);
                    break;
            }
        }
    }

    /** Draw face/hair marks in sketch (rough.js) style. */
    private drawPrimsSketch(rc: any, prims: FacePrim[], base: any, stroke: string): void {
        for (const p of prims) {
            const o = { ...base, strokeWidth: p.k === 'dot' ? 0.5 : Math.max(0.5, p.w), fill: undefined, fillStyle: 'solid' };
            switch (p.k) {
                case 'dot':
                    rc.circle(p.x, p.y, p.r * 2, { ...o, fill: stroke, fillStyle: 'solid', strokeWidth: 0.5, stroke });
                    break;
                case 'ring':
                    rc.circle(p.x, p.y, p.r * 2, p.fill ? { ...o, fill: p.fill } : o);
                    break;
                case 'oval':
                    rc.ellipse(p.x, p.y, p.rx * 2, p.ry * 2, p.fill ? { ...o, fill: p.fill } : o);
                    break;
                case 'arc':
                    rc.arc(p.x, p.y, p.r * 2, p.r * 2, p.a0, p.a1, false, o);
                    break;
                case 'poly':
                    rc.linearPath(p.pts, o);
                    break;
                case 'path':
                    rc.path(p.d, p.fill ? { ...o, fill: p.fill } : o);
                    break;
            }
        }
    }

    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        const { renderer, element: el, isDarkMode } = context;
        const { bones, head, hair, face } = this.computePose(el);
        RenderPipeline.applyStrokeStyle(renderer, el, isDarkMode);
        const stroke = typeof renderer.strokeStyle === 'string' ? renderer.strokeStyle : (el.strokeColor || '#1f2937');
        const bodyWidth = renderer.lineWidth;
        for (const poly of bones) {
            renderer.beginPath();
            renderer.moveTo(poly[0][0], poly[0][1]);
            for (let i = 1; i < poly.length; i++) renderer.lineTo(poly[i][0], poly[i][1]);
            renderer.stroke();
        }
        renderer.beginPath();
        renderer.ellipse(head.cx, head.cy, head.rx, head.ry, 0, 0, Math.PI * 2);
        if (el.stickRig?.headFill) { renderer.fillStyle = '#ffffff'; renderer.fill(); }
        renderer.stroke();
        // Hair sits under the face; both use their own (thinner) pen weights.
        this.drawPrimsArchitectural(renderer, hair, stroke);
        this.drawPrimsArchitectural(renderer, face, stroke);
        renderer.lineWidth = bodyWidth;
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        const { rc, element: el, isDarkMode } = context;
        const options = RenderPipeline.buildRenderOptions(el, isDarkMode);
        const strokeOpts = { ...options, fill: 'none' };
        const { bones, head, hair, face } = this.computePose(el);
        for (const poly of bones) {
            for (let i = 1; i < poly.length; i++) {
                rc.line(poly[i - 1][0], poly[i - 1][1], poly[i][0], poly[i][1], strokeOpts);
            }
        }
        rc.circle(head.cx, head.cy, head.rx * 2,
            el.stickRig?.headFill ? { ...options, fill: '#ffffff', fillStyle: 'solid' } : options);
        const stroke = (options as any).stroke || el.strokeColor || '#1f2937';
        this.drawPrimsSketch(rc, hair, strokeOpts, stroke);
        this.drawPrimsSketch(rc, face, strokeOpts, stroke);
    }

    protected definePath(renderer: IRenderer, el: any): void {
        const { bones } = this.computePose(el);
        for (const poly of bones) {
            renderer.moveTo(poly[0][0], poly[0][1]);
            for (let i = 1; i < poly.length; i++) renderer.lineTo(poly[i][0], poly[i][1]);
        }
    }
}
