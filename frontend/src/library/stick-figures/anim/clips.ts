/**
 * Motion clips (Phase A spike). A clip maps a normalized phase p∈[0,1) to a ClipPose
 * (angle offsets / pelvis bob / foot targets). The walk is procedural with foot
 * targets so IK plants the stance foot; idle/wave are simple angle-offset clips.
 */
import { defaultRig, evaluateRig, type ClipPose, type MotionClip, type RigPose } from './rig';

const TAU = Math.PI * 2;

// ─── Walk (side profile, foot-planting) ─────────────────────────────────────
const STRIDE = 26;     // ± foot travel in x under the hip
/** Ground distance the body advances per walk cycle (rig units) — for path stride-sync. */
export const WALK_STRIDE = STRIDE * 2;
const LIFT = 22;       // swing-foot lift height
const GROUND_Y = 76;   // foot depth below the pelvis at rest
const STANCE = 0.6;    // fraction of the cycle a foot is planted
const HIP_BOB = 5;     // pelvis vertical bob amplitude
const ARM_SWING = 0.5; // shoulder swing amplitude (rad)
const ELBOW = -0.4;    // slight elbow bend — forearm leads FORWARD (negative = hand in front)

/** Foot target (pelvis-relative) for a leg at its own phase q. */
function footAt(q: number): { x: number; y: number } {
    q = ((q % 1) + 1) % 1;
    if (q < STANCE) {
        // Planted: slides from front to back at a constant rate (treadmill).
        const u = q / STANCE;
        return { x: STRIDE - 2 * STRIDE * u, y: GROUND_Y };
    }
    // Swing: arcs from back to front, lifting.
    const u = (q - STANCE) / (1 - STANCE);
    return { x: -STRIDE + 2 * STRIDE * u, y: GROUND_Y - LIFT * Math.sin(Math.PI * u) };
}

export const walkClip: MotionClip = {
    id: 'walk', name: 'Walk', duration: 1.0, loop: true,
    sample(p: number): ClipPose {
        const footL = footAt(p);
        const footR = footAt(p + 0.5);
        // Hip is lowest around each foot-strike (twice per cycle).
        const bob = -HIP_BOB * Math.abs(Math.sin(TAU * p));
        // Arms counter-swing the legs (left arm with right leg).
        const armL = ARM_SWING * Math.sin(TAU * (p + 0.5));
        const armR = ARM_SWING * Math.sin(TAU * p);
        return {
            root: { x: 0, y: bob },
            angles: {
                shoulder: 0.06,                    // slight forward lean
                upperArmL: armL, foreArmL: ELBOW,
                upperArmR: armR, foreArmR: ELBOW,
            },
            footTargets: { footL, footR },
        };
    },
};

// ─── Idle (subtle breathing) ────────────────────────────────────────────────
export const idleClip: MotionClip = {
    id: 'idle', name: 'Idle', duration: 3.2, loop: true,
    sample(p: number): ClipPose {
        const breathe = Math.sin(TAU * p);
        return {
            root: { x: 0, y: -1.5 * breathe },       // gentle rise/fall
            angles: {
                shoulder: 0.015 * breathe,
                upperArmL: 0.12 + 0.03 * breathe, foreArmL: 0.15,
                upperArmR: -0.12 - 0.03 * breathe, foreArmR: 0.15,
                thighL: 0.14, shinL: 0.02,           // relaxed A-stance
                thighR: -0.14, shinR: 0.02,
                head: 0.02 * breathe,
            },
        };
    },
};

// ─── Wave (one arm up, hand oscillates) ─────────────────────────────────────
export const waveClip: MotionClip = {
    id: 'wave', name: 'Wave', duration: 1.1, loop: true,
    sample(p: number): ClipPose {
        const wave = Math.sin(TAU * 2 * p);          // two waves per cycle
        return {
            angles: {
                // Right arm raised overhead, forearm swinging side to side.
                upperArmR: -2.35, foreArmR: -0.35 + 0.45 * wave,
                upperArmL: 0.16, foreArmL: 0.2,      // other arm relaxed
                thighL: 0.14, shinL: 0.02,
                thighR: -0.14, shinR: 0.02,
                head: 0.05,
            },
        };
    },
};

// ─── Talk (gesturing hands) ─────────────────────────────────────────────────
export const talkClip: MotionClip = {
    id: 'talk', name: 'Talk', duration: 1.6, loop: true,
    sample(p: number): ClipPose {
        const g = Math.sin(TAU * p);
        const g2 = Math.sin(TAU * p + Math.PI * 0.6);
        return {
            root: { x: 0, y: -1 * Math.abs(Math.sin(TAU * p)) },
            angles: {
                // Upper arms hang slightly out; elbows bent ~90° so hands gesture forward.
                upperArmL: 0.12, foreArmL: -1.25 + 0.35 * g,
                upperArmR: -0.12, foreArmR: 1.25 - 0.35 * g2,
                thighL: 0.14, shinL: 0.02, thighR: -0.14, shinR: 0.02,
                head: 0.05 * g,
            },
        };
    },
};

// ─── Point (arm extended forward) ───────────────────────────────────────────
export const pointClip: MotionClip = {
    id: 'point', name: 'Point', duration: 1.4, loop: true,
    sample(p: number): ClipPose {
        const emph = Math.max(0, Math.sin(TAU * p)); // slight forward emphasis
        return {
            angles: {
                // Right arm horizontal forward (+x), straight.
                upperArmR: -1.5 - 0.06 * emph, foreArmR: 0.05,
                upperArmL: 0.16, foreArmL: 0.2,
                thighL: 0.14, shinL: 0.02, thighR: -0.14, shinR: 0.02,
                head: 0.04,
            },
        };
    },
};

// ─── Jump (loop: crouch → launch → apex tuck → land) ────────────────────────
const JUMP_H = 46;
export const jumpClip: MotionClip = {
    id: 'jump', name: 'Jump', duration: 1.0, loop: true,
    sample(p: number): ClipPose {
        const s = -Math.cos(TAU * p);          // -1 crouch (p→0/1), +1 apex (p→0.5)
        const rise = Math.max(0, s);
        const crouch = Math.max(0, -s);
        const bend = 0.5 * crouch + 0.55 * rise; // knees bend on crouch & tuck
        return {
            root: { x: 0, y: -JUMP_H * rise * rise },
            angles: {
                thighL: 0.14 + bend, shinL: 0.02 + 1.3 * bend,
                thighR: -0.14 + bend, shinR: 0.02 + 1.3 * bend,
                // Arms swing back on crouch, throw overhead on launch.
                upperArmL: 0.3 * crouch - 2.2 * rise, foreArmL: 0.2,
                upperArmR: -0.3 * crouch - 2.2 * rise, foreArmR: 0.2,
                shoulder: 0.12 * crouch,
            },
        };
    },
};

// ─── Run (faster, longer stride, forward lean, arms pumping) ────────────────
const R_STRIDE = 36, R_LIFT = 30, R_GROUND = 72, R_STANCE = 0.42;
function runFootAt(q: number): { x: number; y: number } {
    q = ((q % 1) + 1) % 1;
    if (q < R_STANCE) { const u = q / R_STANCE; return { x: R_STRIDE - 2 * R_STRIDE * u, y: R_GROUND }; }
    const u = (q - R_STANCE) / (1 - R_STANCE);
    return { x: -R_STRIDE + 2 * R_STRIDE * u, y: R_GROUND - R_LIFT * Math.sin(Math.PI * u) };
}
export const runClip: MotionClip = {
    id: 'run', name: 'Run', duration: 0.62, loop: true,
    sample(p: number): ClipPose {
        const armL = 0.85 * Math.sin(TAU * (p + 0.5));
        const armR = 0.85 * Math.sin(TAU * p);
        return {
            root: { x: 0, y: -8 * Math.abs(Math.sin(TAU * p)) },
            angles: {
                shoulder: 0.3,                        // forward lean
                upperArmL: armL, foreArmL: -0.95,     // bent, pumping
                upperArmR: armR, foreArmR: -0.95,
                head: 0.08,
            },
            footTargets: { footL: runFootAt(p), footR: runFootAt(p + 0.5) },
        };
    },
};

// ─── Clap (hands meet in front) ─────────────────────────────────────────────
export const clapClip: MotionClip = {
    id: 'clap', name: 'Clap', duration: 0.55, loop: true,
    sample(p: number): ClipPose {
        const c = Math.max(0, Math.sin(TAU * p));   // 0 apart → 1 together
        return {
            angles: {
                upperArmL: 0.55, foreArmL: -1.5 - 0.28 * c,
                upperArmR: -0.55, foreArmR: 1.5 + 0.28 * c,
                thighL: 0.14, shinL: 0.02, thighR: -0.14, shinR: 0.02,
                head: 0.04,
            },
        };
    },
};

// ─── Dance (hip sway, arms up alternating, bounce) ──────────────────────────
export const danceClip: MotionClip = {
    id: 'dance', name: 'Dance', duration: 1.2, loop: true,
    sample(p: number): ClipPose {
        const s = Math.sin(TAU * p);
        const bounce = Math.abs(Math.sin(TAU * 2 * p));
        return {
            root: { x: 7 * s, y: -4 * bounce },
            angles: {
                upperArmL: -1.7 + 0.5 * s, foreArmL: -0.3,
                upperArmR: -1.7 - 0.5 * s, foreArmR: -0.3,
                thighL: 0.18 * s, shinL: 0.05, thighR: -0.18 * s, shinR: 0.05,
                head: 0.1 * s,
            },
        };
    },
};

// ─── Cheer (both arms up, pumping) ──────────────────────────────────────────
export const cheerClip: MotionClip = {
    id: 'cheer', name: 'Cheer', duration: 0.9, loop: true,
    sample(p: number): ClipPose {
        const s = Math.sin(TAU * 2 * p);
        return {
            root: { x: 0, y: -5 * Math.abs(s) },
            angles: {
                upperArmL: -2.55 - 0.18 * s, foreArmL: 0.15,
                upperArmR: -2.55 + 0.18 * s, foreArmR: 0.15,
                thighL: 0.15, shinL: 0.02, thighR: -0.15, shinR: 0.02,
                head: 0.05,
            },
        };
    },
};

export const CLIPS: Record<string, MotionClip> = {
    idle: idleClip, walk: walkClip, run: runClip, wave: waveClip,
    talk: talkClip, point: pointClip, clap: clapClip,
    jump: jumpClip, dance: danceClip, cheer: cheerClip,
};

/** Ordered clip list for UI (id + display name). */
export const CLIP_LIST = Object.values(CLIPS).map(c => ({ id: c.id, name: c.name }));

export const getClip = (id: string): MotionClip => CLIPS[id] || CLIPS.idle;

/**
 * Evaluate a clip to a pose in the canonical rig frame (pelvis ~70,150).
 * `phase` is normalized [0,1); `facing` mirrors left/right.
 */
export function poseAt(clipId: string, phase: number, facing: 1 | -1 = 1): RigPose {
    const rig = defaultRig();
    rig.facing = facing;
    return evaluateRig(rig, getClip(clipId).sample(((phase % 1) + 1) % 1));
}

