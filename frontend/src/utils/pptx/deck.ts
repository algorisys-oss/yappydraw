/**
 * The neutral presentation model between Yappy and PPTX.
 *
 * `from-yappy.ts` turns a document into a `Deck`; `write.ts` turns a `Deck` into a .pptx. Keeping
 * the two apart means the writer never touches the store or the DOM (so it unit-tests under bun),
 * and the PPTX importer can produce the same model in the other direction.
 *
 * All lengths are canvas px in the slide's own frame (origin at the slide's top-left); the writer
 * applies the per-slide `fit` and converts to EMU. Colours are `#rrggbb` with a separate alpha.
 */

export interface Color { hex: string; alpha?: number /* 0..1, absent = opaque */ }

export interface GradientStop { pos: number /* 0..1 */; color: Color }

export type Paint =
    | { kind: 'none' }
    | { kind: 'solid'; color: Color }
    /** `angle` in degrees, clockwise from +x in a y-down frame (0 = left→right, 90 = top→bottom). */
    /** `scaled`: the angle is in the unit square and stretches with the box (SVG objectBoundingBox). */
    | { kind: 'linear'; stops: GradientStop[]; angle: number; scaled?: boolean }
    | { kind: 'radial'; stops: GradientStop[] }
    /** DrawingML preset pattern (`ltUpDiag`, `diagCross`, `pct20`…) in `color` over `bg` (transparent when absent). */
    | { kind: 'pattern'; preset: string; color: Color; bg?: Color }
    /** A picture stretched over the shape (import only: `a:blipFill` on a shape). `tile`: repeated
     *  at that scale of its own size instead of stretched; `alpha`: the picture's opacity (0–1). */
    | { kind: 'image'; media: Media; tile?: { sx: number; sy: number }; alpha?: number; grayscale?: boolean };

export type ArrowEndType = 'triangle' | 'arrow' | 'oval' | 'diamond' | 'stealth';
export interface ArrowEnd { type: ArrowEndType; size?: 'sm' | 'med' | 'lg' }

export interface Line {
    width: number;
    color: Color;
    /** DrawingML `prstDash` value; absent = solid. */
    dash?: string;
    cap?: 'rnd' | 'sq' | 'flat';
    join?: 'round' | 'bevel' | 'miter';
    head?: ArrowEnd; // at the path's first point
    tail?: ArrowEnd; // at the path's last point
}

export type PathCmd =
    | { op: 'M' | 'L'; x: number; y: number }
    | { op: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
    | { op: 'Z' };

export interface CustomPath {
    /** Commands in the shape box's frame: (0,0) top-left, (w,h) bottom-right. */
    cmds: PathCmd[];
    fill?: boolean;   // false → `fill="none"` (an open stroke, or a detail line)
    stroke?: boolean; // false → `stroke="0"`
}

export type Geometry =
    | { kind: 'preset'; prst: string; adj?: Record<string, number> }
    | { kind: 'custom'; paths: CustomPath[] };

export interface TextRun {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: Color;
    size?: number;   // px
    font?: string;   // typeface name as PowerPoint should see it
    /** A line break (`a:br`) rather than a run; `text` is ignored. */
    br?: boolean;
}

export interface Paragraph {
    runs: TextRun[];
    align?: 'l' | 'ctr' | 'r';
    bullet?: 'char' | 'num';
    level?: number; // 0-based list level
    /** Bullet glyph as Unicode (symbol-font characters already mapped); absent = "•". */
    bulletChar?: string;
    /** Bullet colour when it is not the text's own. */
    bulletColor?: Color;
    /** Bullet size as a fraction of the text size (`buSzPct`). */
    bulletScale?: number;
    /** Numbering scheme (ST_TextAutonumberScheme, e.g. "alphaLcParenR"); absent = "arabicPeriod". */
    numType?: string;
    /** First number of a numbered run (`startAt`). */
    startAt?: number;
    /** List indents in px from the text area's left edge: text start (`marL`) and the marker's
     *  offset from it (`indent`, usually negative — a hanging indent). */
    marL?: number;
    indent?: number;
    /** Space above / below the paragraph in px (`spcBef` / `spcAft`, percentages resolved). */
    spaceBefore?: number;
    spaceAfter?: number;
    /** Font size used for an empty paragraph's line height (`endParaRPr`). */
    endSize?: number;
}

export interface TextBody {
    paragraphs: Paragraph[];
    anchor: 't' | 'ctr' | 'b';
    insets: { l: number; t: number; r: number; b: number };
    wrap: boolean;
    /** Line spacing as a fraction of PowerPoint's single spacing (1 = 100%). */
    lineSpacing?: number;
    /** Default run properties for the body (applied when a run sets none). */
    defaults?: Omit<TextRun, 'text' | 'br'>;
    /** Shrink text on overflow (`a:normAutofit`) is on; the value is the scale it is drawn at
     *  (export: sizes are written full and PowerPoint applies it; import: already in the sizes). */
    shrink?: number;
}

/**
 * What clicking an object does in the show (`a:hlinkClick`). A slide is named by its deck `key`
 * (Yappy's slide id on export, the slide part's path on import), not its position.
 */
export type DeckLink =
    | { kind: 'url'; url: string }
    | { kind: 'slide'; key: string }
    | { kind: 'action'; action: 'next' | 'previous' | 'first' | 'last' | 'end' };

interface Placed {
    id: number;      // unique within the slide (cNvPr id); 1 is the slide's spTree
    name: string;
    link?: DeckLink;
    /** Alternative text (`cNvPr descr`), read aloud by screen readers. */
    descr?: string;
    /** Marked as decorative: screen readers skip it (PowerPoint's `adec:decorative`). */
    decorative?: boolean;
    x: number; y: number; w: number; h: number;
    rot?: number;    // degrees, about the box centre
    flipH?: boolean;
    flipV?: boolean;
}

export interface ShapeItem extends Placed {
    kind: 'shape';
    geom: Geometry;
    fill: Paint;
    line: Line | null;
    text?: TextBody;
    /** A plain text box (`txBox="1"`): PowerPoint treats it as text, not as a shape with a label. */
    textBox?: boolean;
    /** Import: the text rectangle inside the box when the geometry defines one (ellipse, callouts). */
    textRect?: { l: number; t: number; r: number; b: number };
}

export interface ConnectorEnd { id: number; idx: number }

/** A line/arrow; written as `p:cxnSp` so PowerPoint knows it's a connector (and can glue it). */
export interface ConnectorItem extends Placed {
    kind: 'connector';
    geom: Geometry;
    line: Line;
    start?: ConnectorEnd;
    end?: ConnectorEnd;
}

/** The writer only ever emits png/jpeg/gif; the reader passes on whatever the deck embedded. */
export interface Media { bytes: Uint8Array; ext: 'png' | 'jpeg' | 'gif' | 'svg' | 'bmp' | 'tiff' | 'webp' | 'emf' | 'wmf' }

export interface PictureItem extends Placed {
    kind: 'picture';
    media: Media;
    /** Crop as fractions of the source image cut from each edge (`srcRect`). */
    crop?: { l: number; t: number; r: number; b: number };
    alpha?: number;
    /** The picture's outline when it isn't a rectangle ("crop to shape": an ellipse, a star…). */
    geom?: Geometry;
    /** Shown in grey tones (`a:grayscl`). */
    grayscale?: boolean;
}

export interface GroupItem extends Placed {
    kind: 'group';
    children: Item[];
}

/** A data chart, written as a real PowerPoint chart (a chart part plus its embedded workbook). */
export interface ChartItem extends Placed {
    kind: 'chart';
    chart: import('../chart/chart-layout').ChartSpec;
}

/** One cell of a table (`a:tc`), fully specified: the writer applies no table style. */
export interface TableCell {
    text?: TextBody;     // its insets and anchor are the cell's margins and vertical alignment
    fill: Paint;
    /** Edge lines; null = no line. */
    borders: { l: Line | null; r: Line | null; t: Line | null; b: Line | null };
    gridSpan?: number;   // a merge's top-left cell: columns it covers
    rowSpan?: number;    // … and rows
    hMerge?: boolean;    // covered by the merge to its left
    vMerge?: boolean;    // covered by the merge above
}

/**
 * A PowerPoint table (`a:tbl` in a graphic frame). Every row has one cell per column, merged
 * cells included. Tables can't rotate or flip in PowerPoint.
 */
export interface TableItem extends Placed {
    kind: 'table';
    cols: number[];                              // column widths, px
    rows: { h: number; cells: TableCell[] }[];
    firstRow?: boolean;                          // the first row is a header row
    bandRow?: boolean;                           // body rows alternate
    /** Import: the table drawn exactly as cell shapes, for when it doesn't fit a Yappy table. */
    fallback?: GroupItem;
}

export type Item = ShapeItem | ConnectorItem | PictureItem | GroupItem | ChartItem | TableItem;

/** `pull` is PowerPoint's name for Uncover. */
export type TransitionKind = 'fade' | 'push' | 'zoom' | 'morph' | 'wipe' | 'cover' | 'pull' | 'split';
export interface Transition {
    kind: TransitionKind;
    /** Push / wipe / cover / pull: the way the effect moves (DrawingML `dir`; "l" = towards the
     *  left, so a pushed-in slide comes from the right). */
    dir?: 'l' | 'r' | 'u' | 'd';
    zoomIn?: boolean;
    /** Split: the line it opens along, and whether it opens out from it or closes in to it. */
    orient?: 'horz' | 'vert';
    inward?: boolean;
    durationMs: number;
}

/** PowerPoint effects we write and read (utils/pptx/anim-map.ts maps Yappy's presets onto these). */
export type DeckEffect = 'appear' | 'fade' | 'fly' | 'wipe' | 'bounce' | 'grow' | 'swivel' | 'spinner' | 'zoom'
    | 'growShrink' | 'spin' | 'pulse' | 'teeter';

/** One build effect on a slide (`p:timing`), in playing order. */
export interface DeckAnim {
    /** The item it animates (its cNvPr id); only top-level items can be animated. */
    target: number;
    cls: 'entr' | 'exit' | 'emph';
    effect: DeckEffect;
    /** PowerPoint's preset number and subtype for the effect. */
    presetId: number;
    subtype: number;
    /** Side for Fly / Wipe: where it comes from (entrance) or leaves to (exit). */
    dir?: 'l' | 'r' | 't' | 'b';
    /** On click, with the previous effect, or after it. */
    start: 'click' | 'with' | 'after';
    durationMs: number;
    delayMs: number;
    /** Times to play (−1: until the next click). Absent: once. */
    repeat?: number;
    /** Spin: degrees, clockwise positive. */
    degrees?: number;
}

export interface Slide {
    items: Item[];
    /** Build effects in playing order. */
    anims?: DeckAnim[];
    background?: Paint;
    transition?: Transition;
    /** Uniform scale + offset into the deck's slide size (slides of a different size are fitted). */
    fit?: { scale: number; dx: number; dy: number };
    name?: string;
    /** Speaker notes as plain text, one paragraph per line (`p:notes` body placeholder). */
    notes?: string;
    /** Stable name for slide links to point at (see DeckLink). */
    key?: string;
    /** Skipped in the show (`show="0"`). */
    hidden?: boolean;
    /** Advance by itself after this many ms (`p:transition advTm`). */
    advanceAfterMs?: number;
    /** A section starts at this slide, with this name (`p14:sectionLst`). */
    section?: string;
}

export interface Deck {
    width: number;   // px
    height: number;  // px
    slides: Slide[];
    title?: string;
    /** Loop the show until Esc (`p:showPr loop="1"`). */
    loop?: boolean;
}
