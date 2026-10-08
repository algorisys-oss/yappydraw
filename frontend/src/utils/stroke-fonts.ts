import type { PathSubpath, PathAnchor } from "../types";

/**
 * Single-line (stroke) fonts — text as pen movement rather than filled glyph shapes.
 *
 * Yappy already had two ways to turn text into vectors, and both produce **filled outlines**:
 * Create Outlines (`text-to-outlines.ts`) and `Yappy.tex`. An outline is the wrong shape for two
 * jobs:
 *
 *   • **Handwriting that writes itself.** `drawIn` dash-traces a path convincingly, but tracing
 *     a glyph's *contour* draws its silhouette — the outline of an 'o' is two circles appearing,
 *     not a hand making one stroke.
 *   • **Pen plotters and engravers**, which need a centreline and cannot invent one.
 *
 * A stroke font IS the centreline. The glyph data is Dr A. V. Hershey's, converted to JSON by
 * `scripts/build-stroke-fonts.mjs` (see `scripts/data/hershey/README.md` for provenance and
 * licence); each face is fetched on first use, like the Create Outlines binaries. Not precached
 * by the service worker either — `globPatterns` in `vite.config.ts` does not include `.json`, so
 * these are browser-cached after first use and a face is unavailable on a cold offline load.
 * Deliberate: adding `json` to the glob to fix that would also sweep the docs search index back
 * into the precache, which was removed on purpose.
 *
 * Output is ordinary `path` elements with **open** subpaths, which is what makes this cheap:
 * `pathSubpaths` already carry a per-subpath `closed` flag, `path` is registered to
 * `SpecialtyShapeRenderer` — which overrides `traceDrawStroke` to stroke the SVG `d` directly,
 * so `drawIn` works on them — and paths are already editable, exportable and hit-testable.
 * Nothing in the renderer needed to change.
 */

// ── Font data ────────────────────────────────────────────────────────────────

/** One glyph: baseline-relative strokes (flat [x,y,…] per pen-down run) and its advance. */
export interface StrokeGlyph {
    advance: number;
    strokes: number[][];
}

export interface StrokeFont {
    id: string;
    name: string;
    /** The acknowledgement the Hershey licence requires to travel with the data. */
    notice: string;
    /** In the font's own units, which is what `strokes` are in. */
    metrics: { capHeight: number; xHeight: number; descender: number };
    glyphs: Record<string, StrokeGlyph>;
}

/** The faces that ship. Ids are the filenames under `public/fonts/stroke/`. */
export const STROKE_FONTS = [
    { id: 'hershey-simplex', name: 'Hershey Simplex' },
    { id: 'hershey-duplex', name: 'Hershey Duplex' },
    { id: 'hershey-sans', name: 'Hershey Sans' },
    { id: 'hershey-script', name: 'Hershey Script' },
    { id: 'hershey-gothic', name: 'Hershey Gothic' },
] as const;

export type StrokeFontId = typeof STROKE_FONTS[number]['id'];

export const DEFAULT_STROKE_FONT: StrokeFontId = 'hershey-simplex';

export const isStrokeFontId = (id: string): id is StrokeFontId =>
    STROKE_FONTS.some(f => f.id === id);

const cache = new Map<string, Promise<StrokeFont>>();

/** Base path for the font JSON. Overridable so a test can serve fixtures. */
let fontBaseUrl = '/fonts/stroke';
export const setStrokeFontBaseUrl = (url: string) => { fontBaseUrl = url; cache.clear(); };

/**
 * Fetch and cache a face. Rejections are not cached — a face that failed once because the
 * network blinked must be retryable, or one bad moment disables the feature for the session.
 */
export const loadStrokeFont = (id: string): Promise<StrokeFont> => {
    const hit = cache.get(id);
    if (hit) return hit;
    const pending = fetch(`${fontBaseUrl}/${id}.json`)
        .then(r => {
            if (!r.ok) throw new Error(`stroke font "${id}" failed to load (${r.status})`);
            return r.json() as Promise<StrokeFont>;
        })
        .catch(err => { cache.delete(id); throw err; });
    cache.set(id, pending);
    return pending;
};

// ── Layout ──────────────────────────────────────────────────────────────────

export interface StrokeTextOptions {
    /** Cap height in px — the same meaning `Yappy.tex` gives `fontSize`. Default 32. */
    fontSize?: number;
    /** Extra px between glyphs (tracking). Negative tightens. Default 0. */
    letterSpacing?: number;
    /** Multiple of `fontSize` between baselines. Default 1.6. */
    lineHeight?: number;
    /** Horizontal alignment of each line within the block. Default 'left'. */
    align?: 'left' | 'center' | 'right';
}

/** One glyph placed in the block's own coordinate frame (origin = top-left of the block). */
export interface PlacedGlyph {
    char: string;
    /** Flat [x,y,…] arrays in px, already positioned. */
    strokes: number[][];
    line: number;
}

export interface StrokeTextLayout {
    glyphs: PlacedGlyph[];
    width: number;
    height: number;
    /** Scale applied to font units, kept so callers can reason about stroke weight. */
    scale: number;
}

const DEFAULTS = { fontSize: 32, letterSpacing: 0, lineHeight: 1.6, align: 'left' as const };

/** Width of one line in font units, including tracking expressed in those units. */
const lineAdvance = (font: StrokeFont, line: string, trackingUnits: number): number => {
    let w = 0;
    for (const ch of line) {
        const glyph = font.glyphs[ch];
        if (!glyph) continue;
        w += glyph.advance + trackingUnits;
    }
    // Tracking applies between glyphs, not after the last one.
    return line.length > 0 ? Math.max(0, w - trackingUnits) : 0;
};

/**
 * Place every glyph of `text`, in px, relative to the block's top-left.
 *
 * Pure — no fetching, no store, no canvas — which is what makes the metrics testable. Hard line
 * breaks only; there is no soft wrap, matching `textElementToOutline`.
 *
 * Characters with no glyph in the face are skipped rather than substituted. A Hershey face
 * covers ASCII 32–126; quietly drawing a different letter would be worse than a gap, and
 * `missingChars` tells a caller what was dropped so it can say so.
 */
export const layoutStrokeText = (
    font: StrokeFont,
    text: string,
    opts: StrokeTextOptions = {},
): StrokeTextLayout & { missingChars: string[] } => {
    const fontSize = opts.fontSize ?? DEFAULTS.fontSize;
    const letterSpacing = opts.letterSpacing ?? DEFAULTS.letterSpacing;
    const lineHeightMul = opts.lineHeight ?? DEFAULTS.lineHeight;
    const align = opts.align ?? DEFAULTS.align;

    // fontSize is the CAP HEIGHT, so the scale is set by the face's cap height, not an em box.
    const scale = fontSize / (font.metrics.capHeight || 21);
    const trackingUnits = scale !== 0 ? letterSpacing / scale : 0;

    const lines = text.replace(/\r\n?/g, '\n').split('\n');
    const lineWidths = lines.map(l => lineAdvance(font, l, trackingUnits) * scale);
    const blockWidth = Math.max(0, ...lineWidths);
    const lineStep = fontSize * lineHeightMul;

    // The block's top is the first line's cap top; its height adds the last line's descender so
    // a 'g' is inside the box rather than hanging out of it.
    const descenderPx = font.metrics.descender * scale;
    const height = lines.length > 0 ? (lines.length - 1) * lineStep + fontSize + descenderPx : 0;

    const glyphs: PlacedGlyph[] = [];
    const missing = new Set<string>();

    lines.forEach((line, lineIndex) => {
        const indent = align === 'center' ? (blockWidth - lineWidths[lineIndex]) / 2
            : align === 'right' ? blockWidth - lineWidths[lineIndex]
            : 0;
        let pen = indent;
        // Baseline of this line, measured down from the block top: the first baseline sits one
        // cap height below the top, because glyph y is baseline-relative and caps are negative.
        const baseline = lineIndex * lineStep + fontSize;

        for (const ch of line) {
            const glyph = font.glyphs[ch];
            if (!glyph) { missing.add(ch); continue; }
            if (glyph.strokes.length > 0) {
                glyphs.push({
                    char: ch,
                    line: lineIndex,
                    strokes: glyph.strokes.map(run => {
                        const out = new Array<number>(run.length);
                        for (let i = 0; i < run.length; i += 2) {
                            out[i] = pen + run[i] * scale;
                            out[i + 1] = baseline + run[i + 1] * scale;
                        }
                        return out;
                    }),
                });
            }
            pen += (glyph.advance + trackingUnits) * scale;
        }
    });

    return { glyphs, width: blockWidth, height, scale, missingChars: [...missing] };
};

// ── Path conversion ─────────────────────────────────────────────────────────

/** Bounding box of a set of flat [x,y,…] runs, or null when there are no points. */
export const strokesBounds = (
    strokes: number[][],
): { x: number; y: number; width: number; height: number } | null => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const run of strokes) {
        for (let i = 0; i < run.length; i += 2) {
            if (run[i] < minX) minX = run[i];
            if (run[i] > maxX) maxX = run[i];
            if (run[i + 1] < minY) minY = run[i + 1];
            if (run[i + 1] > maxY) maxY = run[i + 1];
        }
    }
    if (!Number.isFinite(minX)) return null;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

/**
 * Flat [x,y,…] runs → `PathSubpath`s, relative to `origin`.
 *
 * Every subpath is **open** (`closed: false`) and every anchor is a corner (no Bézier handles):
 * Hershey strokes are polylines, and inventing curves would move the letterforms. A glyph that
 * looks like a closed loop — the bowl of an 'o' — is a polyline whose ends happen to meet, and
 * leaving it open is correct: closing it would let a fill sneak in and would also change what
 * `drawIn` traces.
 */
export const strokesToSubpaths = (
    strokes: number[][],
    origin: { x: number; y: number },
): PathSubpath[] => strokes
    .map(run => {
        const anchors: PathAnchor[] = [];
        for (let i = 0; i < run.length; i += 2) {
            anchors.push({ x: run[i] - origin.x, y: run[i + 1] - origin.y, kind: 'corner' });
        }
        return { anchors, closed: false };
    })
    .filter(sp => sp.anchors.length >= 2);
