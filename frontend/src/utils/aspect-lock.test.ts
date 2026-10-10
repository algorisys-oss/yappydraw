import { describe, expect, test } from 'bun:test';
import { followLockedSide } from './aspect-lock';

describe('followLockedSide', () => {
    test('typing the width derives the height, and vice versa', () => {
        expect(followLockedSide('w', 1280, 1280 / 720)).toBe(720);
        expect(followLockedSide('h', 1080, 1920 / 1080)).toBe(1920);
    });

    test('a non-integer result is rounded to a whole pixel', () => {
        // 3:2 — 1000 / 1.5 = 666.67
        expect(followLockedSide('w', 1000, 1.5)).toBe(667);
    });

    test('never returns less than 1px', () => {
        expect(followLockedSide('w', 1, 1000)).toBe(1);
    });

    test('the ratio is fixed, so repeated edits do not drift', () => {
        const ratio = 3; // 1500 × 500
        let h = 500;
        for (const w of [1501, 1502, 1503, 1500]) h = followLockedSide('w', w, ratio)!;
        expect(h).toBe(500);
    });

    test('empty, zero, negative or NaN input leaves the other side alone', () => {
        for (const v of [NaN, 0, -5, Infinity]) expect(followLockedSide('w', v, 1.5)).toBeNull();
    });

    test('a broken ratio leaves the other side alone', () => {
        for (const r of [NaN, 0, -1, Infinity]) expect(followLockedSide('h', 100, r)).toBeNull();
    });
});
