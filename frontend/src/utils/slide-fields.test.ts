import { describe, it, expect } from "bun:test";
import { resolveFieldText, hasFields } from "./slide-fields";

describe("resolveFieldText", () => {
    const ctx = { slideNumber: 3, totalSlides: 10, date: new Date(2026, 10, 1) };
    it("fills slide number, total and date after a leading =", () => {
        expect(resolveFieldText('=Page ${slideNumber} of ${totalSlides}', ctx)).toBe('Page 3 of 10');
        expect(resolveFieldText('=${date}', ctx)).toContain('2026');
        expect(resolveFieldText('=${slideNumber}/${slideNumber}', ctx)).toBe('3/3');
    });
    it("leaves other text alone; == shows a literal =", () => {
        expect(resolveFieldText('Page ${slideNumber}', ctx)).toBe('Page ${slideNumber}');
        expect(resolveFieldText('==1+1', ctx)).toBe('=1+1');
        expect(hasFields('plain')).toBe(false);
        expect(hasFields(undefined)).toBe(false);
    });
});
