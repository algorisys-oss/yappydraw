import { describe, it, expect } from "bun:test";
import { patternFillOf } from "./to-yappy";

describe("PowerPoint preset patterns as Yappy pattern fills", () => {
    it("keeps foreground on background, with the motif the name describes", () => {
        expect(patternFillOf('narVert', '#ff0000', '#ffffcc')).toMatchObject({ type: 'stripes', angle: 90, color: '#ff0000', background: '#ffffcc', spacing: 4 });
        expect(patternFillOf('dkHorz', '#000000', '#ffffff')).toMatchObject({ type: 'stripes', angle: 0, strokeWidth: 3 });
        expect(patternFillOf('ltUpDiag', '#000000', '#ffffff')).toMatchObject({ type: 'stripes', angle: -45, strokeWidth: 1 });
        expect(patternFillOf('wdDnDiag', '#000000', '#ffffff')).toMatchObject({ type: 'stripes', angle: 45, spacing: 12 });
        expect(patternFillOf('diagCross', '#000', '#fff').type).toBe('crosshatch');
        expect(patternFillOf('smGrid', '#000', '#fff').type).toBe('grid');
        expect(patternFillOf('lgCheck', '#000', '#fff').type).toBe('checker');
    });
    it("draws pctN as dots covering about N %, inverting past half", () => {
        const light = patternFillOf('pct20', '#000000', '#ffffff');
        expect(light).toMatchObject({ type: 'dots', color: '#000000', background: '#ffffff' });
        expect(Math.PI * light.strokeWidth! ** 2 / 16).toBeCloseTo(0.2, 2); // dot area / 4×4 cell
        const dark = patternFillOf('pct80', '#000000', '#ffffff');
        expect(dark).toMatchObject({ type: 'dots', color: '#ffffff', background: '#000000' });
    });
});
