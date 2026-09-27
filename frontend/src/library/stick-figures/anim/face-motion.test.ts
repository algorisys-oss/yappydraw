import { describe, it, expect } from "bun:test";
import { blinkAt, talkMouthAt, faceKeyAt, liveFace, normalizeFaceKeys, type LiveFace } from "./face-motion";

const NEUTRAL: LiveFace = { face: 'neutral', eyes: 'auto', brows: 'auto', mouth: 'auto', accent: 'auto' };

describe("blink", () => {
    it("blinks briefly, a few times a minute, per figure", () => {
        let closedFrames = 0, blinks = 0, prev = false;
        for (let f = 0; f < 60 * 60; f++) {                  // one minute at 60 fps
            const b = blinkAt(f / 60, 12345);
            if (b) closedFrames++;
            if (b && !prev) blinks++;
            prev = b;
        }
        expect(blinks).toBeGreaterThanOrEqual(12);            // ≥ one per 5 s
        expect(blinks).toBeLessThanOrEqual(30);
        expect(closedFrames / 3600).toBeLessThan(0.08);       // eyes open > 92% of the time
    });

    it("is deterministic, and two figures don't blink in unison", () => {
        const a: boolean[] = [], b: boolean[] = [];
        for (let f = 0; f < 3600; f++) { a.push(blinkAt(f / 60, 1)); b.push(blinkAt(f / 60, 2)); }
        expect(a).toEqual(Array.from({ length: 3600 }, (_, f) => blinkAt(f / 60, 1)));
        const together = a.filter((x, i) => x && b[i]).length;
        expect(together).toBeLessThan(a.filter(Boolean).length / 2);
    });

    it("closes open eyes only", () => {
        let t = 0;
        while (!blinkAt(t, 9)) t += 0.01;
        expect(liveFace(NEUTRAL, { t, seed: 9, blink: true }).eyes).toBe('line');
        expect(liveFace({ ...NEUTRAL, eyes: 'heart' }, { t, seed: 9, blink: true }).eyes).toBe('heart');
        expect(liveFace({ ...NEUTRAL, face: 'happy' }, { t, seed: 9, blink: true }).eyes).toBe('auto');
        expect(liveFace(NEUTRAL, { t, seed: 9, blink: false }).eyes).toBe('auto');
    });
});

describe("talking", () => {
    it("moves the mouth in syllables and pauses between phrases", () => {
        const shapes = new Set<string | null>();
        for (let t = 0; t < 2.6; t += 0.04) shapes.add(talkMouthAt(t, 5));
        expect(shapes.has('openO') || shapes.has('openWide')).toBe(true);
        expect(shapes.has(null)).toBe(true);
        for (let t = 2.65; t < 3.1; t += 0.05) expect(talkMouthAt(t, 5)).toBeNull();
    });

    it("only when switched on", () => {
        let t = 0;
        while (!talkMouthAt(t, 5)) t += 0.01;
        expect(liveFace(NEUTRAL, { t, seed: 5, talking: true }).mouth).not.toBe('auto');
        expect(liveFace(NEUTRAL, { t, seed: 5, talking: false }).mouth).toBe('auto');
    });
});

describe("expression keys", () => {
    const keys = normalizeFaceKeys([
        { t: 2, face: 'surprised' }, { t: 0.5, face: 'sad' }, { t: 4, brows: 'angry' }, { t: 'x' }, null,
    ]);

    it("are cleaned and sorted", () => {
        expect(keys.map(k => k.t)).toEqual([0.5, 2, 4]);
    });

    it("hold until the next key, and the figure's own face shows before the first", () => {
        expect(faceKeyAt(keys, 0.2)).toBeNull();
        expect(liveFace(NEUTRAL, { t: 0.2, seed: 1, keys }).face).toBe('neutral');
        expect(liveFace(NEUTRAL, { t: 0.5, seed: 1, keys }).face).toBe('sad');
        expect(liveFace(NEUTRAL, { t: 1.99, seed: 1, keys }).face).toBe('sad');
        expect(liveFace(NEUTRAL, { t: 3, seed: 1, keys }).face).toBe('surprised');
    });

    it("a parts-only key changes that part on top of the figure's own face", () => {
        const f = liveFace({ ...NEUTRAL, face: 'happy' }, { t: 5, seed: 1, keys });
        expect(f).toMatchObject({ face: 'happy', brows: 'angry' });
    });

    it("an expression key clears the figure's part overrides, like picking it in the panel", () => {
        const f = liveFace({ ...NEUTRAL, mouth: 'tongue' }, { t: 2.5, seed: 1, keys });
        expect(f).toMatchObject({ face: 'surprised', mouth: 'auto' });
    });
});
