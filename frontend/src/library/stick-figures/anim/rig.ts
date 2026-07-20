/**
 * Stick-figure animation rig (Phase A spike).
 *
 * A skeleton is a small joint hierarchy with bone lengths and rest angles. A motion
 * clip supplies, per normalized phase, angle offsets / a pelvis bob / foot targets;
 * `evaluateRig` walks the hierarchy (forward kinematics) and solves 2-bone IK for any
 * foot that has a world-space target, so a planted foot stays put (no skating).
 *
 * Coordinate frame matches the static library: a ~140×260 box, pelvis near (70,150),
 * y pointing DOWN. Angles are radians measured from +x; `dir(π/2)` points down.
 */

import { faceHairSvg, faceStateAttrs, type FaceOpts, type FaceStyle, type HairStyle } from '../face';
import { garmentSvg, garmentStateAttrs, type GarmentOpts, type TrouserStyle, type ShoeStyle } from '../garments';

export type JointId =
    | 'pelvis' | 'shoulder' | 'head'
    | 'upperArmL' | 'foreArmL' | 'upperArmR' | 'foreArmR'
    | 'thighL' | 'shinL' | 'thighR' | 'shinR';

export interface Bone {
    id: JointId;
    parent: JointId | null;
    /** Bone length (parent → this joint). 0 for the root. */
    length: number;
    /** Absolute rest world-angle (radians). Used to derive the local rest angle. */
    absRest: number;
}

export interface Vec { x: number; y: number; }

const D = Math.PI / 2;   // "down"
const U = -Math.PI / 2;  // "up"

/**
 * Side-profile neutral skeleton (facing +x). Limbs hang straight down so clips can
 * scissor them; the head is a circle at the `head` joint. Proportions echo the
 * library figures (pelvis 70,150 · shoulders ~84 · head centre ~34, r 22).
 */
export const SKELETON: Bone[] = [
    { id: 'pelvis', parent: null, length: 0, absRest: 0 },
    { id: 'shoulder', parent: 'pelvis', length: 66, absRest: U },
    { id: 'head', parent: 'shoulder', length: 50, absRest: U },
    { id: 'upperArmL', parent: 'shoulder', length: 26, absRest: D },
    { id: 'foreArmL', parent: 'upperArmL', length: 26, absRest: D },
    { id: 'upperArmR', parent: 'shoulder', length: 26, absRest: D },
    { id: 'foreArmR', parent: 'upperArmR', length: 26, absRest: D },
    { id: 'thighL', parent: 'pelvis', length: 42, absRest: D },
    { id: 'shinL', parent: 'thighL', length: 42, absRest: D },
    { id: 'thighR', parent: 'pelvis', length: 42, absRest: D },
    { id: 'shinR', parent: 'thighR', length: 42, absRest: D },
];

const BONE = new Map(SKELETON.map(b => [b.id, b]));
/** Local rest angle = absRest − parent.absRest (parent of root treated as 0). */
const REST_LOCAL = new Map<JointId, number>(
    SKELETON.map(b => [b.id, b.absRest - (b.parent ? BONE.get(b.parent)!.absRest : 0)]),
);

export const HEAD_RADIUS = 22;

export interface StickRig {
    /** World position of the pelvis (root). */
    pos: Vec;
    scale: number;
    facing: 1 | -1;
    style: { stroke: string; strokeWidth: number };
}

export const defaultRig = (pos: Vec = { x: 70, y: 150 }): StickRig => ({
    pos, scale: 1, facing: 1, style: { stroke: '#1f2937', strokeWidth: 6 },
});

/** Payload stored on a `stickRig` DrawingElement (stroke/width come from the element). */
export interface StickRigData {
    /** Motion clip id (see CLIPS). */
    clip: string;
    /** Playback rate multiplier (default 1). */
    speed?: number;
    /** Facing direction: 1 = right, -1 = left. */
    facing?: 1 | -1;
    /** Whether the figure is animating (default true). */
    playing?: boolean;
    /** Frozen phase [0,1) shown when not playing (default 0). */
    previewPhase?: number;
    /** Expression drawn on the head (see ../face.ts). Default `neutral`. */
    face?: FaceStyle;
    /** Hair style drawn on the head. Default `none`. */
    hair?: HairStyle;
    /** Fill for solid hair styles. */
    hairColor?: string;
    /** Fill the head white so the face reads over busy artwork. */
    headFill?: boolean;
    /** Trousers drawn under the leg bones (see ../garments.ts). */
    trousers?: TrouserStyle;
    trouserColor?: string;
    shoes?: ShoeStyle;
    shoeColor?: string;
}

/** Canonical rig frame — matches the 140×260 authoring box. */
export const RIG_W = 140, RIG_H = 260;

/** What a motion clip contributes at a given phase. */
export interface ClipPose {
    /** Pelvis offset from `rig.pos` (world units, pre-facing). */
    root?: Vec;
    /** Per-joint angle offsets added to the local rest angle (radians). */
    angles?: Partial<Record<JointId, number>>;
    /** World-space (pelvis-relative, pre-facing) foot targets; enables leg IK. */
    footTargets?: Partial<Record<'footL' | 'footR', Vec>>;
}

export interface MotionClip {
    id: string;
    name: string;
    /** Seconds for one full cycle. */
    duration: number;
    loop: boolean;
    /** Sample the clip at normalized phase p ∈ [0,1). */
    sample: (p: number) => ClipPose;
}

const dir = (a: number): Vec => ({ x: Math.cos(a), y: Math.sin(a) });

/** 2-bone IK: knee for a hip→foot chain. `bend` picks the elbow-up/down solution. */
function solveTwoBone(hip: Vec, foot: Vec, l1: number, l2: number, bend: 1 | -1): Vec {
    const dx = foot.x - hip.x, dy = foot.y - hip.y;
    let d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, d));
    const base = Math.atan2(dy, dx);
    const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
    const a = Math.acos(cosA);
    const kneeAngle = base + bend * a;
    return { x: hip.x + l1 * Math.cos(kneeAngle), y: hip.y + l1 * Math.sin(kneeAngle) };
}

export interface RigPose {
    joints: Map<JointId, Vec>;
    /** Head centre + radius for the circle. */
    head: Vec;
    headR: number;
}

/**
 * Forward-kinematics evaluation of a rig under a clip pose. Returns world joint
 * positions. Legs with a foot target are solved by IK so the foot lands exactly there.
 */
export function evaluateRig(rig: StickRig, pose: ClipPose): RigPose {
    const s = rig.scale, f = rig.facing;
    const rootOff = pose.root || { x: 0, y: 0 };
    // Mirror x about the pelvis for facing, and scale about the pelvis.
    const toWorld = (local: Vec): Vec => ({
        x: rig.pos.x + f * local.x * s,
        y: rig.pos.y + local.y * s,
    });
    const pelvisLocal: Vec = { x: rootOff.x, y: rootOff.y };

    const worldAngle = new Map<JointId, number>();
    const localPos = new Map<JointId, Vec>();  // in pre-facing/pre-scale rig-local space
    localPos.set('pelvis', pelvisLocal);
    worldAngle.set('pelvis', 0);

    // FK in hierarchy order (SKELETON is already parent-before-child).
    for (const b of SKELETON) {
        if (!b.parent) continue;
        const pa = worldAngle.get(b.parent)!;
        const off = pose.angles?.[b.id] || 0;
        const wa = pa + REST_LOCAL.get(b.id)! + off;
        worldAngle.set(b.id, wa);
        const pp = localPos.get(b.parent)!;
        const d = dir(wa);
        localPos.set(b.id, { x: pp.x + b.length * d.x, y: pp.y + b.length * d.y });
    }

    // Foot IK (in rig-local space): recompute knee + foot for targeted legs.
    const legIK = (thigh: JointId, shin: JointId, foot: 'footL' | 'footR', bend: 1 | -1) => {
        const t = pose.footTargets?.[foot];
        if (!t) return;
        const hip = localPos.get('pelvis')!;
        const target: Vec = { x: hip.x + t.x, y: hip.y + t.y };
        const knee = solveTwoBone(hip, target, BONE.get(thigh)!.length, BONE.get(shin)!.length, bend);
        localPos.set(thigh, knee);   // 'thigh' joint id holds the KNEE position
        localPos.set(shin, target);  // 'shin' joint id holds the FOOT position
    };
    // Knee bends forward (+x) so the shin can swing back — flip with facing.
    legIK('thighL', 'shinL', 'footL', rig.facing === 1 ? -1 : 1);
    legIK('thighR', 'shinR', 'footR', rig.facing === 1 ? -1 : 1);

    const joints = new Map<JointId, Vec>();
    for (const [id, p] of localPos) joints.set(id, toWorld(p));
    return { joints, head: joints.get('head')!, headR: HEAD_RADIUS * s };
}

/**
 * Point where the neck meets the head circle — the head-outline point along the
 * shoulder→head-centre direction, so the neck line stops at the edge instead of
 * continuing to the centre (which would draw a radius line inside the head).
 */
export function headAttach(pose: RigPose): Vec {
    const sh = pose.joints.get('shoulder');
    const hd = pose.head;
    if (!sh) return hd;
    const dx = sh.x - hd.x, dy = sh.y - hd.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: hd.x + (dx / len) * pose.headR, y: hd.y + (dy / len) * pose.headR };
}

/** Rest-length hip→ankle for the rig, the unit garment widths are expressed in. */
export const RIG_LEG_UNIT = 84;

/** The two leg polylines of a pose, in the order garments expect (hip → knee → foot). */
export function legPolylines(pose: RigPose): Array<Array<[number, number]>> {
    const at = (id: JointId): [number, number] => {
        const p = pose.joints.get(id)!;
        return [p.x, p.y];
    };
    // Note the joint ids hold the KNEE and FOOT positions once IK has run.
    return [
        [at('pelvis'), at('thighL'), at('shinL')],
        [at('pelvis'), at('thighR'), at('shinR')],
    ];
}

/** Render a pose to an SVG string (garments + bones + head + face/hair), role-tagged. */
export function rigPoseToSvg(
    rig: StickRig, pose: RigPose, w = 140, h = 260,
    face: FaceOpts = {}, garment: GarmentOpts = {},
): string {
    const j = pose.joints;
    const fmt = (p: Vec) => `${Math.round(p.x * 10) / 10} ${Math.round(p.y * 10) / 10}`;
    const P = (id: JointId) => fmt(j.get(id)!);
    const sw = rig.style.strokeWidth;
    const bone = (d: string) => `<path d="${d}" data-sf-role="body"/>`;
    const pelvis = pose.joints.get('pelvis')!;
    // Garments first — the black bone lines must draw on top of them.
    const garments = garmentSvg(legPolylines(pose), [pelvis.x, pelvis.y], {
        ...garment, unit: RIG_LEG_UNIT * rig.scale, facing: rig.facing,
    });
    const inner = garments +
        bone(`M${P('pelvis')}L${P('shoulder')}`) +                       // spine
        bone(`M${P('shoulder')}L${fmt(headAttach(pose))}`) +              // neck (stops at head edge)
        bone(`M${P('shoulder')}L${P('upperArmL')}L${P('foreArmL')}`) +    // left arm
        bone(`M${P('shoulder')}L${P('upperArmR')}L${P('foreArmR')}`) +    // right arm
        bone(`M${P('pelvis')}L${P('thighL')}L${P('shinL')}`) +            // left leg
        bone(`M${P('pelvis')}L${P('thighR')}L${P('shinR')}`) +            // right leg
        `<circle cx="${Math.round(pose.head.x * 10) / 10}" cy="${Math.round(pose.head.y * 10) / 10}" r="${Math.round(pose.headR)}"${face.headFill ? ' fill="#ffffff"' : ''} data-sf-role="head"${faceStateAttrs(face)}${garmentStateAttrs(garment)}/>` +
        faceHairSvg(pose.head.x, pose.head.y, pose.headR, { ...face, facing: rig.facing });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="${rig.style.stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
