/**
 * The document a save writes must be the whole document, and opening a file Yappy
 * cannot understand must refuse rather than guess.
 *
 * Three bugs this pins down:
 *  1. Save to .yappy/.json, cloud save, the cloud API and Save as Template each built
 *     the SlideDocument by hand, and each list had drifted: Save to file dropped the
 *     animation timeline, pattern swatches and symmetry; cloud save also dropped the
 *     game script. One builder (`buildSlideDocument`) now serves every save.
 *  2. A file from a newer Yappy (`version: 5`) fell through `loadDocument`'s "legacy"
 *     branch and opened as a single default slide; the next autosave made that permanent.
 *  3. A field this build doesn't know (added by a newer build without a version bump)
 *     was dropped on the next save. Unknown top-level keys now ride along.
 */
import { describe, it, expect, mock } from "bun:test";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

mock.module("../components/toast", () => ({ showToast: () => { } }));

global.window = {
    innerWidth: 1024,
    innerHeight: 768,
    addEventListener: () => { },
    removeEventListener: () => { },
    setTimeout: (() => 0) as any,
} as any;
global.localStorage = { getItem: () => null, setItem: () => { }, removeItem: () => { } } as any;
global.crypto = { randomUUID: () => "uuid-" + Math.random() } as any;
global.document = {
    documentElement: { setAttribute: () => { }, classList: { add: () => { }, remove: () => { } }, style: { setProperty: () => { } } }
} as any;

const { store, loadDocument } = await import("../store/app-store");
const { buildSlideDocument, normalizeDocument, DocumentTooNewError, CURRENT_DOC_VERSION } = await import("./document-io");

const slide = { id: 'slide-a', name: 'Scene 1', spatialPosition: { x: 0, y: 0 }, dimensions: { width: 800, height: 600 }, order: 0, backgroundColor: '#ffffff' };
const slide2 = { ...slide, id: 'slide-b', name: 'Scene 2', spatialPosition: { x: 2000, y: 0 }, order: 1 };
const layer = { id: 'layer-1', name: 'Layer 1', visible: true, locked: false, opacity: 1, order: 0 };
const rect = { id: 'rect-1', type: 'rectangle', x: 10, y: 20, width: 100, height: 50, layerId: 'layer-1', strokeColor: '#000', backgroundColor: 'transparent', strokeWidth: 1, opacity: 100, angle: 0, seed: 1 };
const timeline = { fps: 12, frameCount: 24, layers: [{ layerId: 'layer-1', cels: [{ frame: 0, length: 2, elementIds: ['rect-1'] }] }] };

/** A v4 animation document carrying every field some save path used to drop. */
const fullDoc = (extra: Record<string, unknown> = {}) => ({
    version: 4,
    metadata: { name: 'full', docType: 'animation' },
    elements: [rect],
    layers: [layer],
    slides: [slide, slide2],
    globalSettings: {},
    gridSettings: { enabled: false, size: 20, snapToGrid: false, color: '#ccc', opacity: 0.5, type: 'lines' },
    guides: [{ id: 'g1', axis: 'v', pos: 120 }],
    symmetry: { mode: 'radial', cx: 400, cy: 300, radialCount: 7, angle: 15, rings: 1, ringSpacing: 0 },
    states: [],
    symbols: [],
    graphicStyles: [],
    swatches: [],
    patterns: [{ id: 'pat-1', name: 'Dots', width: 10, height: 10, elements: [] }],
    artboards: [],
    dimensionAnnotations: [{ id: 'dim-1', kind: 'linear', a: { x: 0, y: 0 }, b: { x: 10, y: 0 } }],
    compositionTracks: [{ id: 'trk-1', name: 'Music' }],
    tinyflyClips: [{ id: 'clip-1' }],
    animTimeline: timeline,
    animScenes: { 'slide-a': timeline, 'slide-b': { ...timeline, fps: 24 } },
    gameScript: 'on start {}',
    gameVars: [{ name: 'score', value: 0 }],
    ...extra,
});

describe("buildSlideDocument: one builder, the whole document", () => {
    it("round-trips every persisted field through loadDocument → save", () => {
        loadDocument(fullDoc());
        const saved = buildSlideDocument('full') as any;
        expect(saved.version).toBe(CURRENT_DOC_VERSION);
        expect(saved.patterns?.map((p: any) => p.id)).toEqual(['pat-1']);
        expect(saved.animTimeline?.fps).toBe(12);
        expect(saved.animScenes?.['slide-a']?.frameCount).toBe(24);
        expect(saved.animScenes?.['slide-b']?.fps).toBe(24);
        expect(saved.symmetry?.radialCount).toBe(7);
        expect(saved.guides?.map((g: any) => g.pos)).toEqual([120]);
        expect(saved.dimensionAnnotations?.length).toBe(1);
        expect(saved.compositionTracks?.length).toBe(1);
        expect(saved.tinyflyClips?.length).toBe(1);
        expect(saved.gameVars?.[0]?.name).toBe('score');
        expect(saved.elements.map((e: any) => e.id)).toEqual(['rect-1']);
        expect(saved.metadata.docType).toBe('animation');
    });

    it("keeps unknown top-level keys a newer build wrote", () => {
        loadDocument(fullDoc({ futureFeature: { keep: ['me'] } }));
        const saved = buildSlideDocument('full') as any;
        expect(saved.futureFeature).toEqual({ keep: ['me'] });
    });

    it("does not carry one document's unknown keys into the next", () => {
        loadDocument(fullDoc({ futureFeature: 1 }));
        loadDocument(fullDoc());
        expect((buildSlideDocument('x') as any).futureFeature).toBeUndefined();
    });

    it("a known field always comes from the live store, never the stale loaded copy", () => {
        loadDocument(fullDoc());
        const saved = buildSlideDocument('full') as any;
        saved.patterns[0].name = 'mutated';
        expect(store.patterns[0].name).toBe('Dots');
        expect((buildSlideDocument('full') as any).patterns[0].name).toBe('Dots');
    });
});

describe("a document from a newer Yappy", () => {
    const tooNew = () => ({ ...fullDoc(), version: CURRENT_DOC_VERSION + 1 });

    it("normalizeDocument refuses it instead of migrating it as legacy", () => {
        expect(() => normalizeDocument(tooNew())).toThrow(DocumentTooNewError);
    });

    it("loadDocument refuses it and leaves the open document untouched", () => {
        loadDocument(fullDoc());
        expect(() => loadDocument(tooNew())).toThrow(DocumentTooNewError);
        expect(store.elements.map(e => e.id)).toEqual(['rect-1']);
        expect(store.slides.map(s => s.id)).toEqual(['slide-a', 'slide-b']);
    });

    it("says which version it was and what to do", () => {
        try { normalizeDocument(tooNew()); throw new Error('no throw'); }
        catch (e: any) { expect(e.message).toMatch(/newer version of Yappy/i); }
    });

    it("still opens legacy and current documents", () => {
        expect(normalizeDocument({ elements: [rect], layers: [layer] }).version).toBe(4);
        expect(normalizeDocument(fullDoc()).slides.length).toBe(2);
        expect(() => loadDocument({ elements: [rect] })).not.toThrow();
    });
});

describe("no save path builds its own document", () => {
    // The drift in bug 1 came from hand-written field lists. Any file that snapshots
    // `store.elements` into a `version: 4` literal is a second builder; route it
    // through `buildSlideDocument` instead.
    const SRC = join(import.meta.dir, "..");
    const files: string[] = [];
    const walk = (d: string) => {
        for (const f of readdirSync(d)) {
            const p = join(d, f);
            if (statSync(p).isDirectory()) { if (f !== 'node_modules') walk(p); }
            else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)) files.push(p);
        }
    };
    walk(SRC);

    it("only utils/document-io.ts snapshots the store into a SlideDocument", () => {
        const offenders = files.filter(f => {
            if (f.endsWith(join('utils', 'document-io.ts'))) return false;
            const src = readFileSync(f, 'utf8');
            return /version:\s*4\s*,/.test(src) && /(JSON\.parse\(JSON\.stringify\(|deep\()store\.elements/.test(src);
        }).map(f => f.slice(SRC.length + 1));
        expect(offenders).toEqual([]);
    });
});
