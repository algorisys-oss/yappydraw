import { describe, it, expect } from "bun:test";
import {
    buildMandala, defaultMandalaSpec, MANDALA_MOTIFS, MANDALA_PRESETS,
    ringOuterRadius, type MandalaSpec,
} from "./mandala";

/** Every anchor of every path, as {x,y} offsets from the mandala centre. */
const allPoints = (spec: MandalaSpec) =>
    buildMandala(spec).flatMap(p => p.anchors.map(a => ({ x: a.x - spec.cx, y: a.y - spec.cy })));

const radius = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);

const spec = (over: Partial<MandalaSpec> = {}): MandalaSpec => ({ ...defaultMandalaSpec(), ...over });

describe("buildMandala — structure", () => {
    it("emits one path per motif instance, per ring", () => {
        const s = spec({
            rings: [
                { motif: "petal", count: 8, rInner: 40, rOuter: 120, phase: 0, width: 0.6 },
                { motif: "dot", count: 12, rInner: 130, rOuter: 150, phase: 0, width: 0.6 },
            ],
        });
        const paths = buildMandala(s);
        expect(paths).toHaveLength(8 + 12);
    });

    it("a ring motif emits exactly one closed circle, not `count` of them", () => {
        // 'ring' is a single concentric outline — the count field is meaningless for it,
        // and honouring it would stack N identical circles on top of each other.
        const paths = buildMandala(spec({ rings: [{ motif: "ring", count: 9, rInner: 0, rOuter: 100, phase: 0, width: 0.6 }] }));
        expect(paths).toHaveLength(1);
        expect(paths[0].closed).toBe(true);
    });

    it("keeps every point inside the ring's radial band", () => {
        const s = spec({ rings: [{ motif: "petal", count: 10, rInner: 50, rOuter: 130, phase: 0, width: 0.5 }] });
        for (const p of allPoints(s)) {
            const r = radius(p);
            expect(r).toBeGreaterThanOrEqual(50 - 1e-6);
            expect(r).toBeLessThanOrEqual(130 + 1e-6);
        }
    });

    it("produces closed outlines for every motif, so they can be filled or coloured in", () => {
        for (const motif of MANDALA_MOTIFS) {
            const paths = buildMandala(spec({ rings: [{ motif: motif.id, count: 6, rInner: 40, rOuter: 120, phase: 0, width: 0.6 }] }));
            expect(paths.length, motif.id).toBeGreaterThan(0);
            for (const p of paths) {
                expect(p.closed, `${motif.id} should be a closed outline`).toBe(true);
                expect(p.anchors.length, `${motif.id} needs enough anchors to be a shape`).toBeGreaterThanOrEqual(3);
            }
        }
    });

    it("skips rings with a non-positive count or an inverted band", () => {
        expect(buildMandala(spec({ rings: [{ motif: "petal", count: 0, rInner: 40, rOuter: 120, phase: 0, width: 0.6 }] }))).toHaveLength(0);
        expect(buildMandala(spec({ rings: [{ motif: "petal", count: 6, rInner: 120, rOuter: 40, phase: 0, width: 0.6 }] }))).toHaveLength(0);
        expect(buildMandala(spec({ rings: [] }))).toHaveLength(0);
    });
});

describe("buildMandala — symmetry", () => {
    it("is rotationally symmetric: instance k sits at k·360/count degrees", () => {
        const count = 9;
        const s = spec({ rings: [{ motif: "petal", count, rInner: 50, rOuter: 120, phase: 0, width: 0.6 }] });
        const paths = buildMandala(s);
        // Angle of each petal's outermost anchor identifies its orientation.
        const angles = paths.map(p => {
            const tip = p.anchors.reduce((best, a) =>
                Math.hypot(a.x - s.cx, a.y - s.cy) > Math.hypot(best.x - s.cx, best.y - s.cy) ? a : best);
            const deg = (Math.atan2(tip.y - s.cy, tip.x - s.cx) * 180) / Math.PI;
            return ((deg % 360) + 360) % 360;
        }).sort((a, b) => a - b);
        for (let i = 1; i < angles.length; i++) {
            expect(angles[i] - angles[i - 1]).toBeCloseTo(360 / count, 4);
        }
    });

    it("every motif is bilaterally symmetric about its own spoke", () => {
        // This is what makes generated output match what Kaleidoscope symmetry draws by
        // hand. A motif that isn't mirror-symmetric reads as a pinwheel.
        for (const motif of MANDALA_MOTIFS) {
            const s = spec({ rings: [{ motif: motif.id, count: 1, rInner: 40, rOuter: 120, phase: 0, width: 0.6 }] });
            const pts = allPoints(s);
            // With count 1 and phase 0 the motif is centred on the +x axis, so mirroring
            // y must map the point set onto itself.
            for (const p of pts) {
                const mirrored = pts.some(q => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y + p.y) < 1e-6);
                expect(mirrored, `${motif.id} is not symmetric about its spoke`).toBe(true);
            }
        }
    });

    it("phase rotates a whole ring without changing its shape", () => {
        const base = { motif: "petal" as const, count: 6, rInner: 50, rOuter: 120, width: 0.6 };
        const a = allPoints(spec({ rings: [{ ...base, phase: 0 }] })).map(radius).sort((x, y) => x - y);
        const b = allPoints(spec({ rings: [{ ...base, phase: 30 }] })).map(radius).sort((x, y) => x - y);
        expect(a).toHaveLength(b.length);
        for (let i = 0; i < a.length; i++) expect(b[i]).toBeCloseTo(a[i], 6);
    });
});

describe("ring layout helpers", () => {
    it("reports the outer radius of the whole design", () => {
        const s = spec({
            rings: [
                { motif: "petal", count: 8, rInner: 20, rOuter: 90, phase: 0, width: 0.6 },
                { motif: "dot", count: 8, rInner: 100, rOuter: 140, phase: 0, width: 0.6 },
            ],
        });
        expect(ringOuterRadius(s)).toBe(140);
        expect(ringOuterRadius(spec({ rings: [] }))).toBe(0);
    });
});

describe("presets", () => {
    it("every preset builds something usable", () => {
        expect(MANDALA_PRESETS.length).toBeGreaterThanOrEqual(4);
        for (const preset of MANDALA_PRESETS) {
            const s = spec({ rings: preset.rings });
            const paths = buildMandala(s);
            expect(paths.length, preset.name).toBeGreaterThan(0);
            for (const p of paths) {
                for (const a of p.anchors) {
                    expect(Number.isFinite(a.x) && Number.isFinite(a.y), `${preset.name} produced a non-finite point`).toBe(true);
                }
            }
        }
    });

    it("preset rings never overlap each other radially", () => {
        // Overlapping bands are what makes generated output look muddy rather than banded.
        for (const preset of MANDALA_PRESETS) {
            const sorted = [...preset.rings].sort((a, b) => a.rInner - b.rInner);
            for (let i = 1; i < sorted.length; i++) {
                expect(sorted[i].rInner, `${preset.name}: ring ${i} starts before the previous one ends`)
                    .toBeGreaterThanOrEqual(sorted[i - 1].rOuter - 1e-9);
            }
        }
    });
});
