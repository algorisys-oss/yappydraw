import { describe, it, expect } from "bun:test";
import { poseForLine, explainPose, isAllCaps, NEUTRAL_POSE } from "./pose-rules";

describe("isAllCaps", () => {
    it("needs >1 uppercase and no lowercase", () => {
        expect(isAllCaps("ARE YOU SURE")).toBe(true);
        expect(isAllCaps("A")).toBe(false);        // single letter isn't shouting
        expect(isAllCaps("Hi There")).toBe(false);
        expect(isAllCaps("OK!")).toBe(true);
    });
});

describe("poseForLine", () => {
    it("greeting at the start of a sentence waves", () => {
        expect(poseForLine("Hi Bob!")).toBe("daily-waving");
        expect(poseForLine("Hello there")).toBe("daily-waving");
        expect(poseForLine("Bye for now")).toBe("daily-waving");
    });

    it("ALL CAPS shouts", () => {
        expect(poseForLine("ARE YOU SURE")).toBe("office-megaphone");
    });

    it("emphatic punctuation shouts", () => {
        expect(poseForLine("Ship it!!!")).toBe("office-megaphone");
    });

    it("emoticons win outright", () => {
        expect(poseForLine("I can't make it :-(")).toBe("daily-sad");
        expect(poseForLine("nice work :)")).toBe("social-celebrating");
    });

    it("chat acronyms read as laughter", () => {
        expect(poseForLine("lol that broke prod")).toBe("social-celebrating");
    });

    it("tentative language thinks", () => {
        expect(poseForLine("Maybe we should wait")).toBe("daily-thinking");
        expect(poseForLine("I think we should ship it")).toBe("daily-thinking");
    });

    it("other-reference points", () => {
        expect(poseForLine("You broke the build")).toBe("daily-pointing");
    });

    it("a bare question shrugs", () => {
        expect(poseForLine("Ready?")).toBe("daily-shrug");
    });

    it("falls back to neutral", () => {
        expect(poseForLine("The deploy finished at noon")).toBe(NEUTRAL_POSE);
    });

    it("is deterministic", () => {
        expect(poseForLine("Hi Bob!")).toBe(poseForLine("Hi Bob!"));
    });
});

describe("conflict resolution (priority, not blending)", () => {
    it("shouting beats greeting for 'HI THERE!!!'", () => {
        const { pose, fired } = explainPose("HI THERE!!!");
        // greeting, all-caps and '!!!' all match; the strongest wins
        expect(fired.length).toBeGreaterThan(1);
        expect(pose).toBe("office-megaphone");
    });

    it("a sad emoticon outranks a question mark", () => {
        expect(poseForLine("Are we really doing this? :-(")).toBe("daily-sad");
    });

    it("word matching respects boundaries", () => {
        // "think" must not fire inside "thinking cap"? it should — but "rethink" must not
        expect(poseForLine("We need to rethink the plan")).toBe(NEUTRAL_POSE);
    });
});
