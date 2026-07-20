import { describe, it, expect } from "bun:test";
import { legChains, garmentGeometry, TROUSER_STYLES, SHOE_STYLES } from "./garments";
import { POSES } from "./poses";
import { buildFigure } from "./builder";

describe("legChains", () => {
    it("finds usable legs for EVERY pose in the library", () => {
        // The regression guard for the whole feature: a pose whose legs can't be found
        // silently loses its trousers, which is invisible until someone looks at it.
        const bad: string[] = [];
        for (const p of POSES) {
            const chains = legChains(p.bones, p.hip);
            const lens = chains.map(c => c.length);
            if (chains.length < 1 || chains.length > 2) bad.push(`${p.id}: ${chains.length} chains`);
            else if (lens.some(l => l < 2 || l > 4)) bad.push(`${p.id}: lens ${lens}`);
        }
        expect(bad).toEqual([]);
    });

    it("follows a leg split across chained subpaths", () => {
        // A seated pose authors thigh and shin as separate subpaths. Seeding at the hip
        // alone finds a stump; the chain must continue from the knee.
        const seated = POSES.find(p => p.id === "office-working")!;
        const chains = legChains(seated.bones, seated.hip);
        expect(chains).toHaveLength(1);
        expect(chains[0]).toHaveLength(3);          // hip → knee → ankle
    });

    it("does not mistake the torso for a leg", () => {
        // The torso ENDS at the hip but starts at the neck, so a first-point rule is safe.
        const stand = POSES.find(p => p.id === "daily-standing")!;
        const chains = legChains(stand.bones, stand.hip);
        expect(chains).toHaveLength(2);
        for (const c of chains) expect(c[0]).toEqual(stand.hip as any);
    });
});

describe("garmentGeometry", () => {
    const legs: Array<Array<[number, number]>> = [[[70, 150], [52, 226]], [[70, 150], [88, 226]]];
    const hip: [number, number] = [70, 150];

    it("produces nothing when nothing is worn", () => {
        expect(garmentGeometry(legs, hip, {})).toEqual([]);
        expect(garmentGeometry(legs, hip, { trousers: "none", shoes: "none" })).toEqual([]);
    });

    it("emits finite geometry for every style combination", () => {
        for (const t of TROUSER_STYLES) {
            for (const s of SHOE_STYLES) {
                const prims = garmentGeometry(legs, hip, { trousers: t.id, shoes: s.id, unit: 84 });
                if (t.id === "none" && s.id === "none") { expect(prims).toEqual([]); continue; }
                expect(prims.length).toBeGreaterThan(0);
                for (const p of prims) {
                    const d = (p as any).d ?? "";
                    expect(d.includes("NaN")).toBe(false);
                    expect(Number.isFinite((p as any).w)).toBe(true);
                }
            }
        }
    });

    it("scales with `unit`, not with the limb's own length", () => {
        // A short (foreshortened) leg must still wear normal-weight trousers.
        const short: Array<Array<[number, number]>> = [[[70, 150], [70, 195]]];
        const a = garmentGeometry(short, hip, { trousers: "straight", unit: 84 });
        const b = garmentGeometry(legs, hip, { trousers: "straight", unit: 84 });
        expect((a[0] as any).w).toBeCloseTo((b[0] as any).w, 5);
    });

    it("skips a stump rather than clothing it", () => {
        const stump: Array<Array<[number, number]>> = [[[70, 150], [70, 152]]];
        expect(garmentGeometry(stump, hip, { trousers: "straight", unit: 84 })).toEqual([]);
    });
});

describe("buildFigure garments", () => {
    it("keeps the pre-garment look by default", () => {
        // Explicit guarantee that adding clothing changed nothing that already shipped:
        // the feminine variants wore a skirt, everyone else was bare-legged.
        const stand = POSES.find(p => p.id === "daily-standing")!;
        expect(buildFigure(stand, "male")).not.toContain('data-sf-role="garment"');
        expect(buildFigure(stand, "boy")).not.toContain('data-sf-role="garment"');
        expect(buildFigure(stand, "female")).toContain('data-sf-role="garment"');
        expect(buildFigure(stand, "girl")).toContain('data-sf-role="garment"');
    });

    it("tags leg bones so a dropped figure can be re-clothed", () => {
        for (const p of POSES) {
            expect(buildFigure(p, "male")).toContain('data-sf-part="leg"');
        }
    });

    it("emits garments BEFORE the skeleton so the outline draws on top", () => {
        const stand = POSES.find(p => p.id === "daily-standing")!;
        const svg = buildFigure(stand, "male", { trousers: "straight" });
        expect(svg.indexOf('data-sf-role="garment"')).toBeLessThan(svg.indexOf('data-sf-role="body"'));
    });
});

import { upperBody, TOP_STYLES, NECK_STYLES } from "./garments";

describe("upperBody", () => {
    it("resolves a torso and arms for EVERY pose in the library", () => {
        const bad: string[] = [];
        for (const p of POSES) {
            const ub = upperBody(p.bones, p.hip);
            if (!ub) { bad.push(`${p.id}: none`); continue; }
            if (ub.torso.length < 2) bad.push(`${p.id}: torso ${ub.torso.length}`);
            if (ub.arms.length < 1 || ub.arms.length > 3) bad.push(`${p.id}: ${ub.arms.length} arms`);
        }
        expect(bad).toEqual([]);
    });

    it("picks the torso by proximity to the hip, not by ending there", () => {
        // A speaker behind a podium runs the torso PAST the hip, so an "ends at the hip"
        // rule finds nothing.
        const speaker = POSES.find(p => p.id === "meeting-speaker")!;
        const ub = upperBody(speaker.bones, speaker.hip)!;
        expect(ub.torso[0]).toEqual([70, 56] as any);
        expect(ub.arms).toHaveLength(2);
    });

    it("handles crossed arms, which touch neither shoulder", () => {
        // Arms are whatever is left after legs and torso — an "arms attach to the torso"
        // rule finds zero arms here.
        const guard = POSES.find(p => p.id === "service-security")!;
        expect(upperBody(guard.bones, guard.hip)!.arms).toHaveLength(2);
    });
});

describe("tops and neckwear", () => {
    const stand = POSES.find(p => p.id === "daily-standing")!;

    it("emits finite geometry for every top and neckwear combination", () => {
        const ub = upperBody(stand.bones, stand.hip)!;
        for (const t of TOP_STYLES) {
            for (const n of NECK_STYLES) {
                const prims = garmentGeometry([], stand.hip as any, { top: t.id, neck: n.id, upper: ub, unit: 84 });
                if (t.id === "none" && n.id === "none") { expect(prims).toEqual([]); continue; }
                expect(prims.length).toBeGreaterThan(0);
                for (const p of prims) expect(String((p as any).d ?? "").includes("NaN")).toBe(false);
            }
        }
    });

    it("needs the upper body — legs alone dress nobody's chest", () => {
        expect(garmentGeometry([], stand.hip as any, { top: "jacket", unit: 84 })).toEqual([]);
    });

    it("tags torso and arm bones so a dropped figure can be re-dressed", () => {
        const svg = buildFigure(stand, "male");
        expect(svg).toContain('data-sf-part="torso"');
        expect(svg).toContain('data-sf-part="arm"');
    });
});
