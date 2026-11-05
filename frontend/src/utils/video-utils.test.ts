import { describe, it, expect } from "bun:test";
import { clipMime, clipExt, isAudioSource } from "./video-utils";

describe("clip formats", () => {
    it("knows what browsers play, and refuses what they don't", () => {
        expect(clipMime('MP4', false)).toBe('video/mp4');
        expect(clipMime('mov', false)).toBe('video/mp4');
        expect(clipMime('m4a', true)).toBe('audio/mp4');
        expect(clipMime('mp4', true)).toBe('audio/mp4');
        expect(clipMime('wav', true)).toBe('audio/wav');
        for (const e of ['wmv', 'avi', 'mpg', 'asf']) expect(clipMime(e, false)).toBeNull();
        for (const e of ['wma', 'mid']) expect(clipMime(e, true)).toBeNull();
    });
    it("maps MIME types back to file extensions", () => {
        expect(clipExt('video/mp4')).toBe('mp4');
        expect(clipExt('audio/mpeg')).toBe('mp3');
        expect(clipExt('audio/mp4')).toBe('m4a');
        expect(clipExt('video/x-flv')).toBeNull();
    });
    it("tells audio sources from video ones", () => {
        expect(isAudioSource('data:audio/wav;base64,AAAA')).toBe(true);
        expect(isAudioSource('data:video/mp4;base64,AAAA')).toBe(false);
        expect(isAudioSource('https://x.org/song.mp3?x=1')).toBe(true);
        expect(isAudioSource('https://x.org/clip.mp4')).toBe(false);
        expect(isAudioSource(undefined)).toBe(false);
    });
});
