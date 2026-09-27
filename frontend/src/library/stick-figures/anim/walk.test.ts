import { describe, it, expect } from "bun:test";
import { defaultRig, evaluateRig, type RigPose } from "./rig";
import { walkClip, runClip, WALK_STRIDE } from "./clips";

/** World pose of a clip at phase p. Joint 'thighX' holds the KNEE, 'shinX' the FOOT. */
const poseOf = (clip: typeof walkClip, p: number, facing: 1 | -1 = 1): RigPose => {
    const rig = defaultRig();
    rig.facing = facing;
    return evaluateRig(rig, clip.sample(p));
};
const J = (pose: RigPose, id: string) => pose.joints.get(id as any)!;

describe("walk", () => {
    it("a planted foot stays on the ground while the hip bobs", () => {
        // Left foot is planted for p ∈ [0, 0.6). Its world y must not move with the pelvis.
        const ys: number[] = [];
        for (let p = 0.02; p < 0.58; p += 0.04) ys.push(J(poseOf(walkClip, p), 'shinL').y);
        const spread = Math.max(...ys) - Math.min(...ys);
        expect(spread).toBeLessThan(0.75);
        // …and the pelvis really does bob, or the check above proves nothing.
        const hips = [0, 0.1, 0.2, 0.3].map(p => J(poseOf(walkClip, p), 'pelvis').y);
        expect(Math.max(...hips) - Math.min(...hips)).toBeGreaterThan(1.5);
    });

    it("knees bend forward, toward the facing direction, for BOTH facings", () => {
        for (const facing of [1, -1] as const) {
            for (let p = 0; p < 1; p += 0.05) {
                const pose = poseOf(walkClip, p, facing);
                for (const side of ['L', 'R']) {
                    const hip = J(pose, 'pelvis'), knee = J(pose, `thigh${side}`), foot = J(pose, `shin${side}`);
                    // Signed distance of the knee from the hip→foot line, positive = in front.
                    const cross = (foot.x - hip.x) * (knee.y - hip.y) - (foot.y - hip.y) * (knee.x - hip.x);
                    expect(-cross * facing).toBeGreaterThanOrEqual(-1e-6);
                }
            }
        }
    });

    it("arms swing in opposition to the legs and are furthest out at foot contact", () => {
        // p = 0: left foot has just landed in front → the LEFT hand is behind, the RIGHT in front.
        const pose = poseOf(walkClip, 0);
        const sh = J(pose, 'shoulder');
        const handL = J(pose, 'foreArmL').x - sh.x, handR = J(pose, 'foreArmR').x - sh.x;
        expect(J(pose, 'shinL').x).toBeGreaterThan(J(pose, 'pelvis').x);
        expect(handR).toBeGreaterThan(8);
        expect(handL).toBeLessThan(-4);
        // Mid-swing (legs passing) the arms are close together, not at their widest.
        const mid = poseOf(walkClip, 0.3);
        const spreadMid = Math.abs(J(mid, 'foreArmL').x - J(mid, 'foreArmR').x);
        expect(spreadMid).toBeLessThan(Math.abs(handL - handR) / 2);
    });

    it("the landing leg is nearly straight", () => {
        const pose = poseOf(walkClip, 0);
        const hip = J(pose, 'pelvis'), foot = J(pose, 'shinL');
        expect(Math.hypot(foot.x - hip.x, foot.y - hip.y)).toBeGreaterThan(82);   // leg length 84
    });

    it("the swing foot lifts most behind the body, not under the hip", () => {
        // Right foot swings for p ∈ [0.1, 0.5). Find where it is highest.
        let best = { p: 0, y: Infinity, x: 0 };
        for (let p = 0.1; p < 0.5; p += 0.01) {
            const pose = poseOf(walkClip, p);
            const f = J(pose, 'shinR');
            if (f.y < best.y) best = { p, y: f.y, x: f.x - J(pose, 'pelvis').x };
        }
        expect(best.x).toBeLessThan(-4);
    });

    it("WALK_STRIDE is the ground a planted foot covers per cycle, so path walking doesn't skate", () => {
        const a = J(poseOf(walkClip, 0.05), 'shinL').x, b = J(poseOf(walkClip, 0.15), 'shinL').x;
        const perCycle = (a - b) / 0.1;
        expect(WALK_STRIDE).toBeCloseTo(perCycle, 0);
    });
});

describe("run", () => {
    it("a planted foot stays on the ground and knees bend forward when facing left", () => {
        const ys: number[] = [];
        for (let p = 0.02; p < 0.4; p += 0.04) ys.push(J(poseOf(runClip, p), 'shinL').y);
        expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.75);
        const pose = poseOf(runClip, 0.7, -1);
        const hip = J(pose, 'pelvis'), knee = J(pose, 'thighL'), foot = J(pose, 'shinL');
        const cross = (foot.x - hip.x) * (knee.y - hip.y) - (foot.y - hip.y) * (knee.x - hip.x);
        expect(cross).toBeGreaterThanOrEqual(0);
    });
});
