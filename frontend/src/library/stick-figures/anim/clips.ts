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

// ─── Daily actions ──────────────────────────────────────────────────────────
//
// Everything below is authored for the SIDE-PROFILE rig, so poses read by the
// silhouette: a thigh swung forward, an elbow folded, the pelvis dropped. Two
// conventions do most of the work:
//   • A limb's offset is measured from "hanging straight down". NEGATIVE swings
//     it forward/up (toward +x, the facing direction); positive swings it back.
//   • Planted feet come from `footTargets`, which are PELVIS-relative — so when a
//     clip drops the pelvis by D it must also raise the targets by D to keep the
//     feet on the same ground line. `GROUND_Y - D` throughout.

/** Seated: thighs horizontal forward, shins straight down, pelvis at seat height. */
const SEAT_DROP = 42;
export const sitClip: MotionClip = {
    id: 'sit', name: 'Sit', duration: 3.4, loop: true,
    sample(p: number): ClipPose {
        const breathe = Math.sin(TAU * p);
        return {
            root: { x: 0, y: SEAT_DROP - 1.5 * breathe },
            angles: {
                // Thigh forward to horizontal (−π/2 from hanging), shin back to vertical.
                thighL: -1.52, shinL: 1.52,
                thighR: -1.59, shinR: 1.59,
                // Hands resting on the thighs.
                upperArmL: -0.5, foreArmL: -0.55,
                upperArmR: -0.44, foreArmR: -0.6,
                shoulder: 0.02 * breathe,
                head: 0.03 * breathe,
            },
        };
    },
};

/**
 * Squat: pelvis drops and rises, feet planted (IK bends the knees).
 *
 * The hips must travel BACK as well as down, or the knees have nowhere to go and
 * the legs fold into a zigzag. `root.x` pushes the body back; because foot targets
 * are pelvis-relative, the feet then need a matching forward offset to stay put.
 */
const SQUAT_DEPTH = 30, SQUAT_BACK = 10;
export const squatClip: MotionClip = {
    id: 'squat', name: 'Squat', duration: 1.8, loop: true,
    sample(p: number): ClipPose {
        const d = (1 - Math.cos(TAU * p)) / 2;        // 0 = standing, 1 = deep
        const drop = SQUAT_DEPTH * d, back = SQUAT_BACK * d;
        return {
            root: { x: -back, y: drop },
            angles: {
                shoulder: 0.34 * d,                    // chest leans in to counterbalance
                // Arms reach forward for balance.
                upperArmL: -1.15 * d - 0.12, foreArmL: -0.3 * d,
                upperArmR: -1.15 * d + 0.12, foreArmR: -0.3 * d,
                head: -0.12 * d,
            },
            footTargets: {
                footL: { x: -6 + back, y: GROUND_Y - drop },
                footR: { x: 7 + back, y: GROUND_Y - drop },
            },
        };
    },
};

/** Stretch: reach overhead, rise onto the toes, ease back down. */
export const stretchClip: MotionClip = {
    id: 'stretch', name: 'Stretch', duration: 3.0, loop: true,
    sample(p: number): ClipPose {
        const s = Math.max(0, Math.sin(TAU * p));      // 0 rest → 1 full reach
        return {
            root: { x: 0, y: -6 * s },
            angles: {
                upperArmL: 0.16 - 2.75 * s, foreArmL: 0.2 - 0.35 * s,
                upperArmR: -0.16 - 2.6 * s, foreArmR: 0.2 - 0.35 * s,
                shoulder: -0.12 * s,                   // arch back slightly
                head: -0.22 * s,                       // chin up
                thighL: 0.14, shinL: 0.02, thighR: -0.14, shinR: 0.02,
            },
        };
    },
};

/** Cook: one hand steadies a pot, the other stirs in a small circle. */
export const cookClip: MotionClip = {
    id: 'cook', name: 'Cook', duration: 1.5, loop: true,
    sample(p: number): ClipPose {
        const c = Math.cos(TAU * p), s = Math.sin(TAU * p);
        return {
            angles: {
                // Stirring arm: shoulder traces a small circle, elbow folded in.
                upperArmR: -1.05 + 0.18 * c, foreArmR: -0.75 + 0.3 * s,
                // Other hand rests on the pot handle.
                upperArmL: -0.85, foreArmL: -0.55,
                thighL: 0.12, shinL: 0.02, thighR: -0.12, shinR: 0.02,
                shoulder: 0.14,                        // leaning over the hob
                head: 0.16,                            // looking down into the pot
            },
        };
    },
};

/** Type: seated, forearms forward over a desk, hands tapping. */
export const typeClip: MotionClip = {
    id: 'type', name: 'Type', duration: 0.7, loop: true,
    sample(p: number): ClipPose {
        const tapL = Math.sin(TAU * p), tapR = Math.sin(TAU * p + Math.PI);
        return {
            root: { x: 0, y: SEAT_DROP },
            angles: {
                thighL: -1.52, shinL: 1.52,
                thighR: -1.59, shinR: 1.59,
                upperArmL: -0.75, foreArmL: -0.72 + 0.11 * tapL,
                upperArmR: -0.68, foreArmR: -0.78 + 0.11 * tapR,
                shoulder: 0.16,                        // hunched at the keyboard
                head: 0.12,
            },
        };
    },
};

/** Lift weights: a bicep curl, both arms together. */
export const curlClip: MotionClip = {
    id: 'curl', name: 'Lift weights', duration: 1.6, loop: true,
    sample(p: number): ClipPose {
        const c = (1 - Math.cos(TAU * p)) / 2;         // 0 arms down → 1 curled up
        return {
            root: { x: 0, y: -2 * c },
            angles: {
                upperArmL: 0.14 - 0.1 * c, foreArmL: -2.5 * c,
                upperArmR: -0.14 - 0.1 * c, foreArmR: -2.5 * c,
                shoulder: -0.05 * c,
                thighL: 0.14, shinL: 0.03, thighR: -0.14, shinR: 0.03,
            },
        };
    },
};

/** Sweep: both hands on a broom, pushing it forward and back. */
export const sweepClip: MotionClip = {
    id: 'sweep', name: 'Sweep', duration: 1.9, loop: true,
    sample(p: number): ClipPose {
        const s = Math.sin(TAU * p);                   // −1 back → +1 forward push
        return {
            angles: {
                // Both arms travel together, as if gripping one handle.
                upperArmL: -0.95 - 0.4 * s, foreArmL: -0.5 + 0.3 * s,
                upperArmR: -0.75 - 0.4 * s, foreArmR: -0.35 + 0.3 * s,
                shoulder: 0.2 + 0.08 * s,
                head: 0.18,
                thighL: 0.3, shinL: 0.05,              // one foot forward, braced
                thighR: -0.3, shinR: 0.12,
            },
        };
    },
};

/** Drink: raise a cup to the mouth, tip, lower. */
export const drinkClip: MotionClip = {
    id: 'drink', name: 'Drink', duration: 2.6, loop: true,
    sample(p: number): ClipPose {
        const r = Math.max(0, Math.sin(TAU * p));      // 0 down → 1 at the lips
        const tip = Math.max(0, Math.sin(TAU * p) - 0.75) * 4;
        return {
            angles: {
                // Same folded-elbow geometry as `think` — the mouth is barely one bone
                // away from the shoulder, so the elbow lifts out and the forearm doubles
                // back. Anything shallower leaves the cup at chest height.
                upperArmR: 0.16 - 1.71 * r, foreArmR: 0.2 - 2.35 * r,
                upperArmL: 0.16, foreArmL: 0.2,
                head: -0.16 * tip,                     // tilt back on the sip
                thighL: 0.14, shinL: 0.02, thighR: -0.14, shinR: 0.02,
            },
        };
    },
};

/** Think: hand to chin, slow head tilt. */
export const thinkClip: MotionClip = {
    id: 'think', name: 'Think', duration: 3.6, loop: true,
    sample(p: number): ClipPose {
        const s = Math.sin(TAU * p);
        return {
            angles: {
                // Right hand up at the chin. Reaching the chin from the shoulder is a
                // ~25-unit hop with two 26-unit bones, so the elbow has to fold almost
                // shut: upper arm out to horizontal, forearm doubled back up and in.
                upperArmR: -1.6, foreArmR: -2.2 + 0.05 * s,
                // Left arm tucked across the waist, supporting the right elbow.
                upperArmL: 0.28, foreArmL: -1.35,
                head: 0.09 * s,
                shoulder: 0.06,
                thighL: 0.14, shinL: 0.02, thighR: -0.14, shinR: 0.02,
            },
        };
    },
};

/** Kick: one leg swings forward and back, the other planted. */
export const kickClip: MotionClip = {
    id: 'kick', name: 'Kick', duration: 1.4, loop: true,
    sample(p: number): ClipPose {
        const k = Math.max(0, Math.sin(TAU * p));      // 0 stance → 1 leg extended
        return {
            angles: {
                thighR: -1.5 * k - 0.1, shinR: 0.6 * (1 - k) + 0.05,
                thighL: 0.16 + 0.1 * k, shinL: 0.05,
                shoulder: 0.2 * k,                     // counterweight lean
                upperArmL: 0.2 + 0.9 * k, foreArmL: 0.25,
                upperArmR: -0.2 - 0.7 * k, foreArmR: 0.25,
            },
        };
    },
};

export const CLIPS: Record<string, MotionClip> = {
    idle: idleClip, walk: walkClip, run: runClip, wave: waveClip,
    talk: talkClip, point: pointClip, clap: clapClip,
    jump: jumpClip, dance: danceClip, cheer: cheerClip,
    // Daily actions
    sit: sitClip, squat: squatClip, stretch: stretchClip, kick: kickClip,
    curl: curlClip, cook: cookClip, type: typeClip, sweep: sweepClip,
    drink: drinkClip, think: thinkClip,
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

