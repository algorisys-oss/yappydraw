import { describe, it, expect } from "bun:test";
import {
    parseScript, castSpeakers, inferPairs, orderCharacters, orderingCost, layoutPanel, splitIntoPanels,
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

describe("balloon kinds (Comic Chat §5.1)", () => {
    it("reads a thought cue and strips it from the speaker name", () => {
        expect(parseScript("Ann (thinks): maybe not")).toEqual([
            { speaker: "Ann", text: "maybe not", kind: "thought" },
        ]);
        expect(parseScript("Ann (thinking): hm")[0].kind).toBe("thought");
        expect(parseScript("Ann (thought): hm")[0].kind).toBe("thought");
    });

    it("reads a whisper cue", () => {
        expect(parseScript("Ben (whispers): don't tell")).toEqual([
            { speaker: "Ben", text: "don't tell", kind: "whisper" },
        ]);
        expect(parseScript("Ben (whispering): shh")[0].kind).toBe("whisper");
    });

    it("leaves plain speech without a kind", () => {
        expect(parseScript("Ann: hello")[0].kind).toBeUndefined();
    });

    it("keeps an unrecognised parenthetical as part of the name", () => {
        const u = parseScript("Ann (CEO): hello")[0];
        expect(u.speaker).toBe("Ann (CEO)");
        expect(u.kind).toBeUndefined();
    });

    it("treats a thinking speaker as the same character for panel breaks", () => {
        // "Ann" and "Ann (thinks)" are one person, so this is a second turn → new panel
        const panels = splitIntoPanels(parseScript("Ann: hi\nAnn (thinks): hm"));
        expect(panels.length).toBe(2);
    });

    it("carries the kind through to the balloon placement", () => {
        const u = parseScript("Ann: hi\nBen (thinks): hm");
        const out = layoutPanel({
            utterances: u, order: ["Ann", "Ben"],
            poses: { Ann: "daily-waving", Ben: "daily-thinking" },
            bubbleSizes: [{ width: 120, height: 60 }, { width: 120, height: 60 }],
            figureWidth: 110, figureHeights: { Ann: 400, Ben: 400 },
            originX: 0, originY: 0,
        });
        expect(out.bubbles.map(b => b.kind)).toEqual(["speech", "thought"]);
    });
});

describe("narration captions (Comic Chat §8)", () => {
    it("reads * and [ ] captions", () => {
        expect(parseScript("* Later that day")).toEqual([
            { speaker: "", text: "Later that day", kind: "narration" },
        ]);
        expect(parseScript("[Meanwhile]")[0].kind).toBe("narration");
    });

    it("casts nobody", () => {
        const u = parseScript("* Later\nAnn: hi");
        expect(castSpeakers(u)).toEqual(["Ann"]);
    });

    it("joins the current panel instead of forcing a break", () => {
        const panels = splitIntoPanels(parseScript("Ann: hi\n* Later\nBen: hey"));
        expect(panels.length).toBe(1);
        expect(panels[0].length).toBe(3);
    });

    it("does not count toward the cast limit", () => {
        const u = parseScript("* A\n* B\n* C\n* D\n* E\nAnn: hi");
        expect(castSpeakers(u)).toEqual(["Ann"]);
        expect(splitIntoPanels(u).length).toBe(1);
    });

    it("pins the caption to the panel's left edge and gives it no tail", () => {
        const u = parseScript("* Later that day\nAnn: hi");
        const out = layoutPanel({
            utterances: u, order: ["Ann"], poses: { Ann: "daily-waving" },
            bubbleSizes: [{ width: 150, height: 40 }, { width: 120, height: 60 }],
            figureWidth: 110, figureHeights: { Ann: 400 }, originX: 0, originY: 0,
        });
        const caption = out.bubbles.find(b => b.kind === "narration")!;
        expect(caption.x).toBe(0);                  // panel's left edge (originX)
        expect(out.characters.length).toBe(1);      // caption added no figure
        // and the caption reads first — the speech balloon sits below it
        const speech = out.bubbles.find(b => b.kind === "speech")!;
        expect(speech.y).toBeGreaterThanOrEqual(caption.y + caption.height - 0.01);
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

describe("splitIntoPanels (Comic Chat §6.1 panel breaks)", () => {
    it("breaks when a speaker takes a second turn", () => {
        const panels = splitIntoPanels(parseScript(SCRIPT));
        expect(panels.map(p => p.map(u => u.speaker))).toEqual([
            ["Alice", "Bob"],   // Alice's 2nd line can't share a panel with her 1st
            ["Alice"],
        ]);
    });

    it("keeps an alternating dialogue as two-person panels", () => {
        const s = parseScript(["A: 1", "B: 2", "A: 3", "B: 4", "A: 5", "B: 6"].join("\n"));
        const panels = splitIntoPanels(s);
        expect(panels.length).toBe(3);
        for (const p of panels) expect(p.map(u => u.speaker)).toEqual(["A", "B"]);
    });

    it("breaks before exceeding the cast limit", () => {
        const s = parseScript(["A: 1", "B: 2", "C: 3", "D: 4", "E: 5"].join("\n"));
        const panels = splitIntoPanels(s, 4);
        expect(panels[0].length).toBe(4);          // A B C D
        expect(panels[1].map(u => u.speaker)).toEqual(["E"]);
    });

    it("keeps a monologue as one line per panel", () => {
        const panels = splitIntoPanels(parseScript(["A: 1", "A: 2", "A: 3"].join("\n")));
        expect(panels.length).toBe(3);
    });

    it("returns nothing for an empty script and is deterministic", () => {
        expect(splitIntoPanels([])).toEqual([]);
        const s = parseScript(SCRIPT);
        expect(splitIntoPanels(s)).toEqual(splitIntoPanels(s));
    });

    it("never loses or reorders an utterance", () => {
        const s = parseScript(["A: 1", "B: 2", "A: 3", "C: 4", "A: 5"].join("\n"));
        expect(splitIntoPanels(s).flat()).toEqual(s);
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
