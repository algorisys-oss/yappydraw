import type { EasingName } from '../utils/animation/animation-types';

export type AnimationTrigger =
    | 'on-load'         // Auto-start when slide loads
    | 'on-click'        // Triggered by user click
    | 'on-hover'        // Triggered by hover (micro-interaction)
    | 'after-prev'      // Sequenced after previous animation
    | 'with-prev'       // Parallel with previous animation
    | 'programmatic';   // Triggered by code/events

export type AnimationAction =
    | 'preset'          // Use a predefined effect (fade, bounce)
    | 'property'        // Animate specific property (frame-based)
    | 'keyframe'        // Multi-waypoint property animation
    | 'rotate'          // Specialized rotation (angle)
    | 'path'            // Move along a path
    | 'transition'      // Morph to a new state
    | 'orbit'           // Persistent orbit
    | 'spin';          // Persistent spin

// Base animation interface
export interface BaseAnimation {
    id: string;
    trigger: AnimationTrigger;
    duration: number; // ms
    delay: number;    // ms
    easing: EasingName;
    repeat?: number;  // 0 = no repeat, -1 = infinite
    yoyo?: boolean;   // Reverse on alternate
    restoreAfter?: boolean; // Restore element state after animation finishes
    startHidden?: boolean;  // Hide element until this animation plays (presentation mode)
}

// 1. Preset Animation (Extensions of current entrance/exit)
export interface PresetAnimation extends BaseAnimation {
    type: 'preset';
    name: string; // 'fadeIn', 'bounceIn', 'shake', etc.
    params?: Record<string, any>;
}

// 2. Property Animation (Tweening)
export interface PropertyAnimation extends BaseAnimation {
    type: 'property';
    property: string; // 'x', 'y', 'opacity', 'rotation', 'scale'
    from?: number | string;
    to: number | string;
    targetId?: string; // Optional: target another element
}

// 3. Path Animation (Motion Path)
export interface PathAnimation extends BaseAnimation {
    type: 'path';
    pathId?: string;    // ID of a path element to follow
    pathData?: string;  // SVG path data if custom
    orientToPath?: boolean;
    smoothPath?: boolean;  // Auto-smooth L segments to cubic Bezier curves
}

// 4. Rotate Animation (Discrete Rotation)
export interface RotateAnimation extends BaseAnimation {
    type: 'rotate';
    fromAngle?: number;
    toAngle: number;
    relative?: boolean; // If true, treat toAngle as delta
}

// 5. Auto Spin Animation (Continuous/Triggered Rotation)
export interface AutoSpinAnimation extends BaseAnimation {
    type: 'autoSpin';
    direction: 'clockwise' | 'counterclockwise';
    iterations: number | 'infinite'; // Number of full rotations or infinite
    rotationsPerSecond?: number; // Speed in rotations per second (alternative to duration)
}


export interface MorphAnimation extends BaseAnimation {
    type: 'morph';
    targetShape: string; // e.g., 'star', 'circle', 'rectangle'
    // In future: targetElementId?: string;
}

// 7. Keyframe Animation (Multi-waypoint property animation)
export interface AnimationKeyframe {
    offset: number;          // 0.0–1.0 position in timeline
    value: number | string;  // target value at this point
    easing?: EasingName;     // easing from previous keyframe TO this one
}

export interface KeyframeAnimation extends BaseAnimation {
    type: 'keyframe';
    property: string;              // 'x', 'y', 'opacity', 'angle', 'strokeColor', etc.
    keyframes: AnimationKeyframe[]; // sorted by offset, minimum 2
}

export type ElementAnimation = PresetAnimation | PropertyAnimation | PathAnimation | RotateAnimation | AutoSpinAnimation | MorphAnimation | KeyframeAnimation;


// Defines what properties can be overridden in a state
export interface DrawingElementState {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
    angle: number;
    backgroundColor: string;
    strokeColor: string;
    text: string;
}

// 4. Diagram State (for "Magic Move" style transitions)
export interface DisplayState {
    id: string;
    name: string; // "Loading", "Success", "Error"
    overrides: Record<string, Partial<DrawingElementState>>; // map elementId -> properties
}

// ============================================================================
// After-Effects–class absolute-time timeline (Phase 0 — the spine).
// Distinct from the normalized (offset 0..1) presentation-mode KeyframeAnimation
// above: this model lives in ABSOLUTE seconds and is evaluated by a pure
// `evaluateCompositionAt(t)` seek function, independent of triggers. See
// `docs/after-effects-plan.md` and `utils/animation/composition-evaluator.ts`.
// ============================================================================

/**
 * A per-segment easing curve expressed as cubic-bezier tangent handles, AE-style.
 * `ox/oy` = outgoing handle of the LEFT keyframe, `ix/iy` = incoming handle of the
 * RIGHT keyframe, each normalized to the [0,1] segment box (x = time, y = value).
 * When absent, a keyframe's named `easing` (or linear) is used instead.
 */
export interface BezierEase {
    ox: number;
    oy: number;
    ix: number;
    iy: number;
}

/** One waypoint of a `PropertyTrack`, positioned in absolute seconds. */
export interface TimedKeyframe {
    t: number;               // absolute time in seconds
    value: number | string;  // number for transforms/opacity, hex string for colors
    ease?: BezierEase;       // per-segment bezier (segment ENTERING this keyframe)
    easing?: EasingName;     // fallback named easing when `ease` is absent
    hold?: boolean;          // stepped: the segment ENTERING this key holds the previous value (AE "hold")
}

/** All keyframes for a single (element, property) pair. */
export interface PropertyTrack {
    elementId: string;
    property: string;              // 'x' | 'y' | 'width' | 'height' | 'opacity' | 'angle' | 'backgroundColor' | 'strokeColor' | ...
    keys: TimedKeyframe[];         // sorted ascending by `t`; minimum 1
    /**
     * Expression track: a JS body in `t` (seconds) evaluated every frame, e.g.
     * `'200 + 120 * Math.sin(t * 2)'`. When present it REPLACES `keys` — the property
     * is computed rather than interpolated, which is how a value can depend on the
     * clock continuously (manim's `ValueTracker` + `always_redraw`).
     *
     * Held as a string, not a closure, so a composition stays JSON-serialisable and
     * survives save/load and the embed bridge.
     */
    expr?: string;
}

/** A document/slide-level absolute-time composition (the AE-mode source of truth). */
export interface Composition {
    id: string;
    duration: number;   // seconds
    fps: number;        // frames per second (for frame-exact export + snapping)
    tracks: PropertyTrack[];
}
