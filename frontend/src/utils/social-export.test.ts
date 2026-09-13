import { describe, it, expect } from "bun:test";
import {
    SOCIAL_TARGETS, getSocialTarget, socialTargetsForPage, shapeMatches, encodeWithinBudget,
    socialFileName, JPEG_QUALITY_STEPS,
} from "./social-export";

describe("SOCIAL_TARGETS", () => {
    it("covers every social and video page preset, at the preset's exact size", async () => {
        const { PAGE_SIZE_PRESETS } = await import("../config/page-size-presets");
        const expected = PAGE_SIZE_PRESETS.filter(p => p.category === "social" || p.category === "video");
        expect(SOCIAL_TARGETS.map(t => t.presetId).sort()).toEqual(expected.map(p => p.id).sort());
        for (const p of expected) {
            const t = getSocialTarget(p.id)!;
            expect([t.width, t.height]).toEqual([p.width, p.height]);
        }
    });

    it("caps file size only where the platform has a hard limit", () => {
        expect(getSocialTarget("youtube-thumbnail")!.maxBytes).toBe(2 * 1024 * 1024);
        expect(getSocialTarget("x-post")!.maxBytes).toBe(5 * 1024 * 1024);
        expect(getSocialTarget("instagram-post")!.maxBytes).toBeUndefined();
    });
});

describe("shapeMatches", () => {
    it("accepts the same aspect ratio at any scale", () => {
        expect(shapeMatches(1080, 1080, 1200, 1200)).toBe(true);
        expect(shapeMatches(2560, 1440, 1280, 720)).toBe(true);
    });

    it("tolerates rounding within half a percent, and nothing more", () => {
        expect(shapeMatches(1640, 925, 1640, 924)).toBe(true);   // 0.1% off
        expect(shapeMatches(1200, 640, 1200, 630)).toBe(false);  // 1.6% off
        expect(shapeMatches(1080, 1350, 1080, 1080)).toBe(false);
    });

    it("rejects degenerate sizes instead of dividing by zero", () => {
        expect(shapeMatches(0, 100, 100, 100)).toBe(false);
        expect(shapeMatches(100, NaN, 100, 100)).toBe(false);
    });
});

describe("socialTargetsForPage", () => {
    it("puts the exact preset first, then others with the same shape", () => {
        const ids = socialTargetsForPage(1080, 1080).map(t => t.presetId);
        expect(ids).toEqual(["instagram-post", "linkedin-post"]);
        expect(socialTargetsForPage(1200, 1200).map(t => t.presetId)).toEqual(["linkedin-post", "instagram-post"]);
    });

    it("finds 16:9 platforms for a 16:9 slide", () => {
        const ids = socialTargetsForPage(1920, 1080).map(t => t.presetId);
        expect(ids).toContain("youtube-thumbnail");
        expect(ids).toContain("x-post");
        expect(ids).not.toContain("instagram-post");
    });

    it("returns nothing for a shape no platform uses", () => {
        expect(socialTargetsForPage(2480, 3508)).toEqual([]);
    });
});

describe("encodeWithinBudget", () => {
    // A fake encoder whose output shrinks with quality: 1 MB per 0.1 of quality.
    const fake = async (_mime: string, q?: number) => new Blob([new Uint8Array(Math.round((q ?? 1) * 10 * 1024 * 1024))]);

    it("uses the first quality when there is no cap", async () => {
        const r = await encodeWithinBudget(fake, "image/jpeg");
        expect(r!.quality).toBe(JPEG_QUALITY_STEPS[0]);
        expect(r!.overBudget).toBe(false);
    });

    it("steps quality down until the file fits", async () => {
        const r = await encodeWithinBudget(fake, "image/jpeg", 8 * 1024 * 1024);
        expect(r!.blob.size).toBeLessThanOrEqual(8 * 1024 * 1024);
        expect(r!.quality).toBeLessThan(JPEG_QUALITY_STEPS[0]);
        expect(r!.overBudget).toBe(false);
    });

    it("returns the smallest attempt and flags it when nothing fits", async () => {
        const r = await encodeWithinBudget(fake, "image/jpeg", 1024);
        expect(r!.quality).toBe(JPEG_QUALITY_STEPS[JPEG_QUALITY_STEPS.length - 1]);
        expect(r!.overBudget).toBe(true);
    });

    it("returns null when the encoder fails", async () => {
        expect(await encodeWithinBudget(async () => null, "image/jpeg")).toBeNull();
    });
});

describe("socialFileName", () => {
    it("names the file after the document and platform", () => {
        expect(socialFileName("Autumn Sale", getSocialTarget("instagram-story")!)).toBe("autumn-sale-instagram-story.jpg");
    });

    it("falls back to yappy for untitled or unusable names", () => {
        expect(socialFileName("Untitled", getSocialTarget("x-post")!)).toBe("yappy-x-post.jpg");
        expect(socialFileName("  ///  ", getSocialTarget("x-post")!)).toBe("yappy-x-post.jpg");
        expect(socialFileName(undefined, getSocialTarget("x-post")!)).toBe("yappy-x-post.jpg");
    });
});
