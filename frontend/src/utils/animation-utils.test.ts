import { describe, it, expect } from "bun:test";
import { calculateAllAnimatedStates, isStaticAnimatedState } from "./animation-utils";
import type { DrawingElement } from "../types";

const el = (over: Partial<DrawingElement> = {}): DrawingElement => ({
    id: 'a', type: 'rectangle', x: 10, y: 20, width: 50, height: 40, angle: 0, opacity: 100,
    ...over,
} as DrawingElement);

describe("isStaticAnimatedState", () => {
    // calculateAllAnimatedStates returns a state for EVERY element, animated or not. The
    // renderer treated "has a state" as "is animated", which switched the RoughJS element
    // cache off for everything, so sketch style regenerated every shape every frame.
    it("an unanimated element's computed state is static", () => {
        const e = el();
        const state = calculateAllAnimatedStates([e], 1234, false).get('a')!;
        expect(state).toBeDefined();
        expect(isStaticAnimatedState(state, e)).toBe(true);
    });

    it("missing angle/opacity on the element still reads as static", () => {
        const e = el({ angle: undefined, opacity: undefined } as any);
        const state = calculateAllAnimatedStates([e], 0, false).get('a')!;
        expect(isStaticAnimatedState(state, e)).toBe(true);
    });

    it("a spinning element in presentation is animated", () => {
        const e = el({ spinEnabled: true, spinSpeed: 5 } as any);
        const state = calculateAllAnimatedStates([e], 1000, true).get('a')!;
        expect(isStaticAnimatedState(state, e)).toBe(false);
    });

    it("any override that differs — including keys beyond x/y/angle/opacity — is animated", () => {
        expect(isStaticAnimatedState({ x: 11, y: 20, angle: 0, opacity: 100 }, el())).toBe(false);
        expect(isStaticAnimatedState({ x: 10, y: 20, angle: 0, opacity: 100, strokeColor: '#f00' } as any, el({ strokeColor: '#000' }))).toBe(false);
        expect(isStaticAnimatedState({ x: 10, y: 20, angle: 0, opacity: 100, strokeColor: '#000' } as any, el({ strokeColor: '#000' }))).toBe(true);
    });

    it("no state at all is static", () => {
        expect(isStaticAnimatedState(undefined, el())).toBe(true);
    });
});
