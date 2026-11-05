import { describe, it, expect } from "bun:test";
import { patternFillOf, tableElement } from "./to-yappy";

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

describe("PowerPoint tables as native Yappy tables", () => {
    const conv = () => ({ ox: 0, oy: 0, nextId: (p: string) => `${p}-1` }) as any;
    const grey = { width: 1, color: { hex: '#94a3b8' } };
    const edges = { l: grey, r: grey, t: grey, b: grey };
    const solid = (hex: string) => ({ kind: 'solid' as const, color: { hex } });
    const cell = (text: string, opts: { fill?: any; bold?: boolean; align?: 'l' | 'ctr' | 'r'; anchor?: 't' | 'ctr' | 'b' } = {}) => ({
        fill: opts.fill ?? { kind: 'none' }, borders: edges,
        text: { paragraphs: [{ runs: [{ text }], align: opts.align ?? 'ctr' }], anchor: opts.anchor ?? 'ctr', insets: { l: 6, t: 2, r: 6, b: 2 }, wrap: true,
            defaults: { size: 16, font: 'Inter', color: { hex: '#111111' }, bold: opts.bold } },
    });
    const head = (t: string) => cell(t, { fill: solid('#1e3a8a'), bold: true });
    const table = (rows: any[][], extra: object = {}) => ({
        kind: 'table', id: 7, name: 'Prices', x: 10, y: 20, w: 300, h: 120, cols: [100, 100, 100],
        rows: rows.map(cells => ({ h: 40, cells })), firstRow: true, ...extra,
    }) as any;
    const body = (r: number, fill?: any) => ['a', 'b', 'c'].map(k => cell(`${k}${r}`, { fill }));

    it("reads header, alternating rows, alignment, lines and merges into table properties", () => {
        const merged = [{ ...head('Plan'), gridSpan: 2 }, { ...head(''), hMerge: true }, head('Price')];
        const el = tableElement(table([merged, body(1, solid('#ffffff')), body(2, solid('#eef2ff'))]), conv(), []) as any;
        expect(el).toMatchObject({
            type: 'table', x: 10, y: 20, width: 300, height: 120,
            tableHeaders: true, tableRows: 2, tableCols: 3,
            tableData: [['Plan', '', 'Price'], ['a1', 'b1', 'c1'], ['a2', 'b2', 'c2']],
            tableHeaderColor: '#1e3a8a', tableRowColor: '#ffffff', tableAltRowColor: '#eef2ff',
            tableColAlignments: ['center', 'center', 'center'],
            tableMergedCells: [{ startRow: 0, startCol: 0, endRow: 0, endCol: 1 }],
            strokeColor: '#94a3b8', strokeWidth: 1, fontSize: 16, textColor: '#111111',
        });
        expect(el.tableColWidths).toEqual([1 / 3, 1 / 3, 1 / 3]);
    });

    it("leaves a table whose look a Yappy table can't draw to its exact drawing", () => {
        const ok = () => [[head('A'), head('B'), head('C')], body(1), body(2)];
        const oneCellColoured = ok(); oneCellColoured[1][1] = cell('b1', { fill: solid('#ff0000') });
        const oneTopAligned = ok(); oneTopAligned[2][0] = cell('a2', { anchor: 't' });
        const mixedColumn = ok(); mixedColumn[2][2] = cell('c2', { align: 'r' });
        const plainHeader = ok(); plainHeader[0] = ['A', 'B', 'C'].map(t => cell(t, { fill: solid('#1e3a8a') }));
        for (const rows of [oneCellColoured, oneTopAligned, mixedColumn, plainHeader]) expect(tableElement(table(rows), conv(), [])).toBeNull();
        expect(tableElement(table(ok()), conv(), [])).not.toBeNull();
    });

    it("keeps a whole table's vertical alignment", () => {
        const top = [['A', 'B', 'C'].map(t => ({ ...head(t), text: { ...head(t).text, anchor: 't' } })), ...[1, 2].map(r => body(r).map(c => ({ ...c, text: { ...c.text, anchor: 't' } })))];
        expect(tableElement(table(top), conv(), [])).toMatchObject({ tableVerticalAlign: 'top' });
        expect((tableElement(table([[head('A'), head('B'), head('C')], body(1)]), conv(), []) as any).tableVerticalAlign).toBeUndefined();
    });

    it("reads a flagged first row that looks like the body as a table with no header", () => {
        expect(tableElement(table([body(0), body(1), body(2)]), conv(), [])).toMatchObject({ tableHeaders: false, tableRows: 3 });
    });

    it("takes a bold first row as the header when the file doesn't flag one (LibreOffice drops it)", () => {
        const rows = [[head('A'), head('B'), head('C')], body(1), body(2)];
        expect(tableElement(table(rows, { firstRow: undefined }), conv(), [])).toMatchObject({ tableHeaders: true, tableRows: 2, tableHeaderColor: '#1e3a8a' });
        // Without a bold first row it stays a table with no header.
        expect(tableElement(table([body(0), body(1)], { firstRow: undefined }), conv(), [])).toMatchObject({ tableHeaders: false, tableRows: 2 });
    });
});

describe("vertical text becomes a turned text box over its shape", () => {
    it("keeps the shape, and puts the text in a box turned a quarter about the same centre", async () => {
        const { deckToDocument } = await import("./to-yappy");
        const deck: any = { width: 960, height: 540, slides: [{ items: [{ kind: 'shape', id: 2, name: 'Cell', x: 100, y: 50, w: 80, h: 300,
            geom: { kind: 'preset', prst: 'rect' }, fill: { kind: 'solid', color: { hex: '#4472c4' } }, line: null,
            text: { paragraphs: [{ runs: [{ text: 'Top to bottom', size: 24 }] }], anchor: 't', insets: { l: 10, t: 5, r: 10, b: 5 }, wrap: true, vert: 'vert' } }] }] };
        let n = 0;
        const res = await deckToDocument(deck, (t: string) => `${t}-${n++}`);
        const shape = res.doc.elements.find((e: any) => e.type === 'rectangle')!;
        const text = res.doc.elements.find((e: any) => e.type === 'text' || e.type === 'richtext')!;
        expect(shape.containerText || '').toBe('');
        expect(text.angle).toBeCloseTo(Math.PI / 2, 5);
        // Same centre; the box turned (300 long, 80 across, less Yappy's text padding).
        expect(text.x + text.width / 2).toBeCloseTo(shape.x + shape.width / 2, 0);
        expect(text.y + text.height / 2).toBeCloseTo(shape.y + shape.height / 2, 0);
        expect(text.width).toBeGreaterThan(text.height);
        expect(shape.groupIds?.[0]).toBe(text.groupIds?.[0]);   // grouped, so they move together
    });
});

describe("pictures browsers can't show are converted at import", () => {
    // 6×3 RGB, Deflate-compressed, written by Pillow (the same fixture as tiff.test.ts).
    const TIFF = Uint8Array.from(atob('SUkqADAAAAB4nPvPwMDwH4T//4cQ/7lE5ODoRIoRUI6RiZmFlY2dgxPOAADJ6AugCgAAAQMAAQAAAAYAAAABAQMAAQAAAAMAAAACAQMAAwAAAK4AAAADAQMAAQAAAAgAAAAGAQMAAQAAAAIAAAARAQQAAQAAAAgAAAAVAQMAAQAAAAMAAAAWAQMAAQAAAAMAAAAXAQQAAQAAACgAAAAcAQMAAQAAAAEAAAAAAAAACAAIAAgA'), c => c.charCodeAt(0));
    const pic = (bytes: Uint8Array, crop?: object): any => ({ width: 960, height: 540, slides: [{ items: [{ kind: 'picture', id: 2, name: 'Scan', x: 10, y: 10, w: 120, h: 60, media: { bytes, ext: 'tiff' }, crop }] }] });

    it("TIFF becomes a PNG image element, labelled as PNG, with crops in its own pixels", async () => {
        const { deckToDocument } = await import("./to-yappy");
        let n = 0;
        const res = await deckToDocument(pic(TIFF, { l: 0.5, t: 0, r: 0, b: 0 }), (t: string) => `${t}-${n++}`);
        const img = res.doc.elements.find((e: any) => e.type === 'image') as any;
        expect(img.dataURL.startsWith('data:image/png;base64,')).toBe(true);
        expect(img.mimeType).toBe('image/png');
        expect(img.crop).toMatchObject({ x: 3, y: 0, width: 3, height: 3 });
        expect(res.warnings).toEqual([]);
    });
    it("an undecodable TIFF stays a placeholder with a TIFF-specific warning", async () => {
        const { deckToDocument } = await import("./to-yappy");
        let n = 0;
        const res = await deckToDocument(pic(TIFF.slice(0, 20)), (t: string) => `${t}-${n++}`);
        expect(res.doc.elements.some((e: any) => e.type === 'image')).toBe(false);
        expect(res.warnings.some(w => w.includes('TIFF image in a form Yappy can'))).toBe(true);
    });
});

describe("PowerPoint clips become video elements", () => {
    const PNG = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0));
    const clip = (extra: object): any => ({ kind: 'media', id: 2, name: 'Clip', x: 10, y: 20, w: 320, h: 180, audio: false, file: null, poster: { bytes: PNG, ext: 'png' }, ...extra });
    const convert = async (...items: any[]) => {
        const { deckToDocument } = await import("./to-yappy");
        let n = 0;
        return deckToDocument({ width: 960, height: 540, slides: [{ items }] } as any, (t: string) => `${t}-${n++}`);
    };

    it("an embedded MP4 plays from a data URL, with its options and its poster", async () => {
        const res = await convert(clip({ file: { bytes: new Uint8Array([1, 2, 3]), ext: 'mp4' }, autoplay: true, loop: true, muted: true }));
        const v = res.doc.elements.find((e: any) => e.type === 'video') as any;
        expect(v.videoURL).toBe('data:video/mp4;base64,AQID');
        expect(v).toMatchObject({ videoProvider: 'direct', videoAutoplay: true, videoLoop: true, videoMuted: true, x: 10, y: 20, width: 320, height: 180 });
        expect(v.videoPosterDataURL.startsWith('data:image/png;base64,')).toBe(true);
        expect(res.warnings).toEqual([]);
    });
    it("a cropped poster becomes an SVG showing just the cropped part", async () => {
        const res = await convert(clip({ file: { bytes: new Uint8Array(4), ext: 'mov' }, crop: { l: 0.25, t: 0, r: 0.25, b: 0 } }));
        const v = res.doc.elements.find((e: any) => e.type === 'video') as any;
        expect(v.videoURL.startsWith('data:video/mp4;base64,')).toBe(true); // MOV plays as MP4
        expect(v.videoPosterDataURL.startsWith('data:image/')).toBe(true);
        // (No bitmap decoder under bun, so the poster's size is unknown here: croppedPoster is checked directly.)
        const { croppedPoster } = await import("./to-yappy");
        const svg = atob(croppedPoster('data:image/png;base64,QQ==', 400, 200, { l: 0.25, t: 0, r: 0.25, b: 0.5 }).split(',')[1]);
        expect(svg).toContain('viewBox="100 0 200 100"');
        expect(svg).toContain('<image width="400" height="200"');
        expect(croppedPoster('u', 400, 200, { l: 0, t: 0, r: 0, b: 0 })).toBe('u');
        expect(croppedPoster('u', 0, 0, { l: 0.1, t: 0, r: 0, b: 0 })).toBe('u');
    });
    it("audio plays through the same element, showing its icon; with no icon it gets a speaker", async () => {
        const res = await convert(clip({ audio: true, poster: undefined, file: { bytes: new Uint8Array(4), ext: 'm4a' } }));
        const v = res.doc.elements.find((e: any) => e.type === 'video') as any;
        expect(v.videoURL.startsWith('data:audio/mp4;base64,')).toBe(true);
        expect(v.videoPosterDataURL.startsWith('data:image/svg+xml;base64,')).toBe(true);
        expect(v.backgroundColor).toBe('transparent');
    });
    it("a format browsers can't play keeps its poster as a picture, with a warning", async () => {
        const res = await convert(clip({ file: { bytes: new Uint8Array(4), ext: 'wmv' } }));
        expect(res.doc.elements.some((e: any) => e.type === 'video')).toBe(false);
        expect(res.doc.elements.some((e: any) => e.type === 'image')).toBe(true);
        expect(res.warnings).toEqual(['Video "Clip" is a WMV file, which browsers can\'t play; only its picture was imported.']);
        const avi = await convert(clip({ file: { bytes: new Uint8Array(4), ext: 'avi' } }));
        expect(avi.warnings[0]).toContain('is an AVI file');
    });
    it("clips over the per-file or per-deck size limit keep their poster", async () => {
        const { MEDIA_FILE_BYTES, MEDIA_DECK_BYTES } = await import("./to-yappy");
        const big = await convert(clip({ file: { bytes: new Uint8Array(MEDIA_FILE_BYTES + 1), ext: 'mp4' } }));
        expect(big.warnings[0]).toContain('over the 25 MB a clip can be');
        // Two clips that fit one by one but not together: the second keeps its poster.
        const half = Math.floor(MEDIA_DECK_BYTES / 2) + 1;
        const two = await convert(clip({ id: 2, file: { bytes: new Uint8Array(Math.min(half, MEDIA_FILE_BYTES)), ext: 'mp4' } }),
            clip({ id: 3, name: 'Second', file: { bytes: new Uint8Array(Math.min(half, MEDIA_FILE_BYTES)), ext: 'mp4' } }),
            clip({ id: 4, name: 'Third', file: { bytes: new Uint8Array(Math.min(half, MEDIA_FILE_BYTES)), ext: 'mp4' } }));
        expect(two.doc.elements.filter((e: any) => e.type === 'video').length).toBe(2);
        expect(two.warnings).toEqual(['Video "Third" would take the presentation\'s clips over 50 MB in all; only its picture was imported.']);
    });
    it("a web link stays a link; YouTube gets its embed URL", async () => {
        const res = await convert(clip({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }));
        const v = res.doc.elements.find((e: any) => e.type === 'video') as any;
        expect(v).toMatchObject({ videoURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', videoProvider: 'youtube' });
        expect(v.videoEmbedURL).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });
});
