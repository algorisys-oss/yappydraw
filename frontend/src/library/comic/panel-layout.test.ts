import { describe, it, expect } from "bun:test";
import {
    parseScript, castSpeakers, inferPairs, orderCharacters, orderingCost, layoutPanel,
    MAX_CHARACTERS, type Utterance,
} from "./panel-layout";

const SCRIPT = `Alice: Hi Bob!
Bob: I think we should ship it.
Alice: ARE YOU SURE?`;

describe("parseScript", () => {
    it("parses screenplay rows", () => {
        expect(parseScript(SCRIPT)).toEqual([
            { speaker: "Alice", text: "Hi Bob!" },
            { speaker: "Bob", text: "I think we should ship it." },
            { speaker: "Alice", text: "ARE YOU SURE?" },
        ]);
    });

    it("keeps colons inside the dialogue", () => {
        expect(parseScript("Bob: the rule is: always test")).toEqual([
            { speaker: "Bob", text: "the rule is: always test" },
        ]);
    });

    it("skips blank and colon-less rows", () => {
        expect(parseScript("\n\nno colon here\nAlice: hi\n")).toEqual([
            { speaker: "Alice", text: "hi" },
        ]);
    });

    it("skips prose that merely contains a colon", () => {
        const long = "This is a long sentence of prose that happens to contain: a colon";
        expect(parseScript(long)).toEqual([]);
    });

    it("passes a structured array through", () => {
        const arr: Utterance[] = [{ speaker: "A", text: "x" }];
        expect(parseScript(arr)).toEqual(arr);
    });
});

describe("castSpeakers", () => {
    it("returns distinct speakers in first-appearance order", () => {
        expect(castSpeakers(parseScript(SCRIPT))).toEqual(["Alice", "Bob"]);
    });

    it("caps at MAX_CHARACTERS", () => {
        const many = parseScript(["A: 1", "B: 2", "C: 3", "D: 4", "E: 5"].join("\n"));
        expect(castSpeakers(many).length).toBe(MAX_CHARACTERS);
    });
});

describe("ordering (Comic Chat §4.3)", () => {
    it("infers turn-taking pairs", () => {
        const u = parseScript(SCRIPT);
        const pairs = inferPairs(u, ["Alice", "Bob"]);
        // "Hi Bob!" names Bob; Bob's reply goes back to Alice
        expect(pairs).toContainEqual(["Alice", "Bob"]);
        expect(pairs).toContainEqual(["Bob", "Alice"]);
    });

    it("penalises separating a conversational pair", () => {
        const pairs: Array<[string, string]> = [["A", "B"]];
        const adjacent = orderingCost(["A", "B", "C"], pairs);
        const separated = orderingCost(["A", "C", "B"], pairs);
        expect(separated).toBeGreaterThan(adjacent);
    });

    it("keeps conversational partners adjacent", () => {
        // A talks to C; B is a bystander → A and C should end up next to each other
        const pairs: Array<[string, string]> = [["A", "C"], ["C", "A"]];
        const order = orderCharacters(["A", "B", "C"], pairs);
        const ia = order.indexOf("A"), ic = order.indexOf("C");
        expect(Math.abs(ia - ic)).toBe(1);
    });

    it("is deterministic", () => {
        const pairs: Array<[string, string]> = [["A", "B"]];
        expect(orderCharacters(["A", "B", "C"], pairs)).toEqual(orderCharacters(["A", "B", "C"], pairs));
    });

    it("handles a single speaker", () => {
        expect(orderCharacters(["A"], [])).toEqual(["A"]);
    });
});

describe("layoutPanel (balloon rules, §5.2)", () => {
    const utterances = parseScript(SCRIPT);
    const order = ["Alice", "Bob"];
    const poses = { Alice: "daily-waving", Bob: "daily-thinking" };
    const bubbleSizes = [
        { width: 150, height: 60 },
        { width: 220, height: 80 },
        { width: 180, height: 60 },
    ];
    // Deliberately different heights: figure height depends on the pose's content
    // bounds, so the layout must stand them on a shared ground line.
    const base = {
        utterances, order, poses, bubbleSizes,
        figureWidth: 110,
        figureHeights: { Alice: 424, Bob: 390 },
        originX: 0, originY: 0,
    };

    it("places one figure per speaker, mirroring the right-hand one", () => {
        const { characters } = layoutPanel(base);
        expect(characters.map(c => c.speaker)).toEqual(["Alice", "Bob"]);
        expect(characters[0].flip).toBe(false); // left figure faces right
        expect(characters[1].flip).toBe(true);  // right figure turns inward
    });

    it("gives every bubble a tail that can reach its speaker", () => {
        const { characters, bubbles } = layoutPanel(base);
        const cx = new Map(characters.map(c => [c.speaker, c.box.x + c.box.width / 2]));
        for (const b of bubbles) {
            expect(b.tailPosition).toBeGreaterThanOrEqual(10);
            expect(b.tailPosition).toBeLessThanOrEqual(90);
            // the tail tip must land within the bubble AND near the speaker
            const tipX = b.x + (b.tailPosition / 100) * b.width;
            expect(Math.abs(tipX - cx.get(b.speaker)!)).toBeLessThan(1);
        }
    });

    it("never overlaps two bubbles", () => {
        const { bubbles } = layoutPanel(base);
        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
                const a = bubbles[i], b = bubbles[j];
                const overlap = a.x < b.x + b.width && a.x + a.width > b.x &&
                                a.y < b.y + b.height && a.y + a.height > b.y;
                expect(overlap).toBe(false);
            }
        }
    });

    it("keeps balloons above the figures", () => {
        const { characters, bubbles } = layoutPanel(base);
        const headTop = Math.min(...characters.map(c => c.box.y));
        for (const b of bubbles) expect(b.y + b.height).toBeLessThanOrEqual(headTop);
    });

    it("stands figures of different heights on one ground line", () => {
        const { characters } = layoutPanel(base);
        const feet = characters.map(c => c.box.y + c.box.height);
        for (const f of feet) expect(f).toBeCloseTo(feet[0], 6);
    });

    it("preserves comic reading order (§5.2) for every pair", () => {
        // A later balloon must never be positioned where a reader would reach it first:
        // to the right → no higher than the earlier balloon's top; to the left or
        // overlapping → below its bottom.
        const { bubbles } = layoutPanel(base);
        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
                const a = bubbles[i], b = bubbles[j];
                if (b.x >= a.x + a.width) expect(b.y).toBeGreaterThanOrEqual(a.y - 0.01);
                else expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 0.01);
            }
        }
    });

    it("frames the whole panel", () => {
        const { frame, characters, bubbles } = layoutPanel(base);
        for (const c of characters) {
            expect(c.box.x).toBeGreaterThanOrEqual(frame.x);
            expect(c.box.y + c.box.height).toBeLessThanOrEqual(frame.y + frame.height);
        }
        for (const b of bubbles) expect(b.y).toBeGreaterThanOrEqual(frame.y);
    });

    it("is idempotent", () => {
        expect(layoutPanel(base)).toEqual(layoutPanel(base));
    });
});
