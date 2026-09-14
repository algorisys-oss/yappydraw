import type { TimelineDefinition, AnyTrack } from '../types';
import { Timeline } from '../core/timeline';
/**
 * Serialize a track to a plain JSON-compatible object.
 * Handles both regular tracks and motion path tracks.
 */
export declare function serializeTrack(track: AnyTrack): AnyTrack;
/**
 * Deserialize a plain object to a Track.
 * Handles both regular tracks and motion path tracks.
 * Ensures keyframes are sorted by time.
 */
export declare function deserializeTrack(data: AnyTrack): AnyTrack;
/**
 * Serialize a Timeline to a TimelineDefinition object.
 */
export declare function serializeTimeline(timeline: Timeline): TimelineDefinition;
/**
 * Deserialize a TimelineDefinition to a Timeline instance.
 */
export declare function deserializeTimeline(definition: TimelineDefinition): Timeline;
/**
 * Convert a Timeline to a JSON string.
 */
export declare function toJSON(timeline: Timeline): string;
/**
 * Parse a JSON string to a Timeline instance.
 */
export declare function fromJSON(json: string): Timeline;
