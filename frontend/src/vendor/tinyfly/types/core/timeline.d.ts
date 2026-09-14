import type { TimelineConfig, TimelineDefinition, AnimationState, PlaybackState, PlaybackDirection, AnyTrack } from '../types';
/** Selects a subset of a timeline's tracks. All given fields must match. */
export interface TrackFilter {
    /** Match tracks driving this target (including one of a multi-target set) */
    target?: string;
    /** Match tracks driving this property */
    property?: string;
    /** Match tracks whose active span overlaps [from, to] in milliseconds */
    timeRange?: {
        from: number;
        to: number;
    };
    /** Match a track by id */
    id?: string;
}
/**
 * Two tracks writing the same property of the same target over an overlapping
 * span. The track that starts later wins (ties: added later); see `Timeline.findConflicts`.
 */
export interface TrackConflict {
    target: string;
    property: string;
    /** Track whose values are discarded where the spans overlap */
    losingTrackId: string;
    /** Track whose values are applied */
    winningTrackId: string;
}
export type UpdateCallback = (state: AnimationState) => void;
export type CompleteCallback = () => void;
export interface TimelineOptions {
    id: string;
    name?: string;
    tracks?: AnyTrack[];
    config?: TimelineConfig;
}
/**
 * Timeline orchestrates playback of multiple tracks.
 */
export declare class Timeline {
    readonly id: string;
    readonly name?: string;
    private _tracks;
    private _trackPlayers;
    private _motionPathTracks;
    private _springTracks;
    private _textTracks;
    private _config;
    private _currentTime;
    private _playbackState;
    private _direction;
    private _loopIteration;
    private _explicitDuration?;
    /** Milliseconds still to wait at a loop boundary before the next iteration */
    private _repeatDelayRemaining;
    /**
     * A forward loop reached its end with a repeat delay armed: the playhead
     * holds on the last frame for the delay, then returns to the start.
     */
    private _wrapAfterDelay;
    onUpdate: UpdateCallback | null;
    onComplete: CompleteCallback | null;
    constructor(options: TimelineOptions);
    get tracks(): AnyTrack[];
    get duration(): number;
    /**
     * Set an explicit timeline duration (ms). Pass `undefined` to fall back to the
     * duration calculated from the last keyframe across all tracks.
     */
    setDuration(duration: number | undefined): void;
    get currentTime(): number;
    get playbackState(): PlaybackState;
    get direction(): PlaybackDirection;
    get loopIteration(): number;
    get speed(): number;
    set speed(value: number);
    /**
     * Start or resume playback.
     * If at the end and direction is forward, reset to beginning.
     * If at the beginning and direction is reverse, reset to end.
     */
    play(): void;
    /**
     * Pause playback at current position.
     */
    pause(): void;
    /**
     * Stop playback and reset to beginning.
     */
    stop(): void;
    /**
     * Seek to a specific time.
     */
    seek(time: number): void;
    /**
     * Toggle or set playback direction.
     */
    reverse(): void;
    /**
     * Advance the timeline by delta milliseconds.
     * Call this from your animation loop or clock.
     */
    tick(delta: number): void;
    /**
     * Get the animation state at a specific time.
     */
    getStateAtTime(time: number): AnimationState;
    /**
     * Several tracks drive the same target+property. Which one applies at `time`:
     *
     * 1. Of the tracks that have started (their first keyframe, plus delay and
     *    stagger, is at or before `time`), the one that started LAST.
     * 2. If none has started yet, the one that starts FIRST — so the value before
     *    anything plays is the first animation's starting value.
     * 3. Ties on start time go to the track added LAST.
     *
     * This is what makes a sequence of tweens on one property play as a sequence:
     * a later tween holds its starting value, but does not apply it until its
     * turn. `findConflicts()` reports overlaps by the same rule.
     */
    private _resolveShared;
    /**
     * Write one track's value for a target, expanding the progress of motion paths
     * (into x/y/rotation) and text tracks (into the string). `elapsed` is the time
     * since this target's animation on the track started.
     */
    private _write;
    /** Cached: does any target+property have more than one track? */
    private _sharedWrites;
    private _hasSharedWrites;
    /**
     * Add a track to the timeline.
     */
    addTrack(track: AnyTrack): void;
    /**
     * Replace a track with a new version, keeping its place in the track order
     * (which decides ties when tracks overlap). The new track may have a
     * different id. Does nothing if no track has `trackId`.
     */
    replaceTrack(trackId: string, track: AnyTrack): void;
    /**
     * Remove a track by its ID.
     */
    removeTrack(trackId: string): void;
    /**
     * Tracks matching a filter. All provided fields must match (AND).
     *
     * This is the closest principled equivalent to GSAP's per-tween handle: we
     * have no live tween objects to hold, so a "tween" is addressed by describing
     * the tracks it produced.
     */
    getTracks(filter?: TrackFilter): AnyTrack[];
    /**
     * Remove every track matching a filter. Returns the ids removed.
     *
     * `timeline.removeTracks({ target: 'box' })` is the equivalent of killing all
     * tweens on an element.
     */
    removeTracks(filter?: TrackFilter): string[];
    /**
     * The time span a track is active over: [start, end] in milliseconds.
     */
    getTrackSpan(trackId: string): {
        from: number;
        to: number;
    } | undefined;
    /**
     * Overlapping writes to the same target+property.
     *
     * Where two spans overlap, the track that starts later wins from the moment it
     * starts (ties: the one added later) — see `_resolveShared`. That is
     * predictable but silent, so an authoring tool should call this and warn,
     * because a silently discarded stretch of a track looks like a bug.
     */
    findConflicts(): TrackConflict[];
    private _matches;
    /**
     * Export timeline as a serializable definition.
     */
    toDefinition(): TimelineDefinition;
    /** Start the between-iterations pause, if the timeline configures one. */
    private _armRepeatDelay;
    private _calculateDuration;
    /**
     * Handle reaching the end of the timeline.
     * Returns true if we looped and should continue, false if we stopped.
     */
    private _handleEndReached;
    /**
     * Handle reaching the start of the timeline (in reverse).
     * Returns true if we looped and should continue, false if we stopped.
     */
    private _handleStartReached;
}
