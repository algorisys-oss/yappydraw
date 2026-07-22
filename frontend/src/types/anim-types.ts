import type { BezierEase } from './motion-types';
import type { EasingName } from '../utils/animation/animation-types';

// ============================================================================
// Animate-class FRAME-BASED timeline (docType 'animation').
// Distinct from the absolute-seconds Composition/PropertyTrack model in
// motion-types.ts: this model lives in integer FRAMES at a document fps and is
// evaluated by the pure `evaluateTimelineAt(frame)` seek function
// (utils/animation/frame-timeline-evaluator.ts). Content follows the "cel"
// model — each keyframe OWNS the ids of real store elements; frame visibility
// is a render-time filter, never a store mutation.
// ============================================================================

/** Kind of tween on the span LEAVING a keyframe. 'shape' is reserved (Phase 2). */
export type TweenKind = 'none' | 'motion' | 'shape';

/** One keyframe cell on a layer's frame row. */
export interface AnimKeyframe {
    frame: number;              // 0-based frame index; sorted ascending per layer
    elementIds: string[];       // element ids owned by this keyframe ([] = blank keyframe)
    tween?: TweenKind;          // tween of the span leaving this keyframe (toward the next one)
    ease?: BezierEase;          // per-span bezier (same convention as TimedKeyframe.ease)
    easing?: EasingName;        // fallback named easing when `ease` is absent
    label?: string;             // frame label (shown as a flag in the grid)
    /** Motion guide: id of a line/path element whose curve the tweened elements
     *  follow (centers ride the path from its start to its end across the span). */
    guideId?: string;
    /** Rotate tweened elements to face along the guide path's direction. */
    guideOrient?: boolean;
}

/** Frame data for one timeline row — paired 1:1 with an existing Layer by id. */
export interface AnimLayer {
    layerId: string;            // id of the Layer this row mirrors (visibility/lock/order live there)
    keyframes: AnimKeyframe[];  // span of kf[i] = [kf[i].frame, kf[i+1].frame) or endFrame
    endFrame: number;           // inclusive last frame with content on this row (F5 extends)
}

/** A sound on the audio row: starts at `frame`, plays to its natural end.
 *  Either a built-in synth SFX (`sfx`, from game/sound-engine) or an imported
 *  audio file (`dataURL`). Plays during timeline playback and is muxed into
 *  video exports (GIFs are silent). */
export interface AnimAudioClip {
    id: string;
    frame: number;              // start frame (0-based)
    name: string;               // display label on the audio row
    sfx?: string;               // built-in SFX id ('coin' | 'jump' | …)
    dataURL?: string;           // imported audio file as a data: URL
    durationSec?: number;       // decoded duration (drives the strip width)
    gain?: number;              // 0..1 volume (default 1)
}

/** The document's frame timeline (docType 'animation'; persisted in SlideDocument.animTimeline). */
export interface AnimTimeline {
    fps: number;                // playback rate (frames per second)
    frameCount: number;         // timeline length in frames (ruler extent)
    layers: AnimLayer[];        // one row per Layer; render order comes from Layer.order
    audio?: AnimAudioClip[];    // the audio row's sounds (sorted by frame)
}

/** Onion-skin ghost settings (transient UI state, not persisted). */
export interface OnionSettings {
    enabled: boolean;
    before: number;             // ghost frames behind the playhead
    after: number;              // ghost frames ahead of the playhead
}

export const DEFAULT_ANIM_FPS = 24;
export const DEFAULT_ANIM_FRAME_COUNT = 24;

/** Fresh timeline with one empty keyframe at frame 0 on each given layer. */
export const createDefaultAnimTimeline = (
    layerIds: string[],
    fps: number = DEFAULT_ANIM_FPS,
    frameCount: number = DEFAULT_ANIM_FRAME_COUNT
): AnimTimeline => ({
    fps,
    frameCount,
    layers: layerIds.map(layerId => ({
        layerId,
        keyframes: [{ frame: 0, elementIds: [] }],
        endFrame: frameCount - 1,
    })),
});
