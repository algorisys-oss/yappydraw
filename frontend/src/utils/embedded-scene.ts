/**
 * Editable images: an SVG or PNG that shows the drawing anywhere an image shows (GitHub,
 * Markdown, a browser, a slide), and still carries the whole drawing so YappyDraw reopens it
 * for editing. By convention the files are named `*.yappy.svg` and `*.yappy.png`.
 *
 * The payload is exactly a `.yappy` file — gzip-compressed SlideDocument JSON — so decoding it
 * is `decodeDocumentBytes` like any other drawing.
 *
 *  - SVG: base64 inside `<metadata><yappy:scene …>…</yappy:scene></metadata>`, just before
 *    `</svg>`. Renderers ignore `<metadata>`.
 *  - PNG: a `tEXt` chunk with the keyword `yappy-scene` and base64 text, just before `IEND`.
 *    Viewers skip ancillary chunks they don't know.
 *
 * Pure (no store, no DOM) so it can be unit-tested and shared by the editor, the VS Code
 * bridge and anything that only needs to read a file.
 */

export type EditableFormat = 'yappy' | 'svg' | 'png';

/** Which kind of drawing file a name is, or null when it is not one of ours. */
export function editableFormat(fileName: string): EditableFormat | null {
    const n = fileName.toLowerCase();
    if (n.endsWith('.yappy.svg')) return 'svg';
    if (n.endsWith('.yappy.png')) return 'png';
    if (n.endsWith('.yappy')) return 'yappy';
    return null;
}

const SCENE_NS = 'https://yappydraw.com/ns/scene';
const SVG_SCENE_RE = /<metadata>\s*<yappy:scene\b[^>]*>([\s\S]*?)<\/yappy:scene>\s*<\/metadata>/;
const SVG_SCENE_INNER_RE = /<yappy:scene\b[^>]*>([\s\S]*?)<\/yappy:scene>/;
const PNG_KEYWORD = 'yappy-scene';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// ── base64 (no Buffer in the browser; btoa needs a binary string) ─────────

function toBase64(bytes: Uint8Array): string {
    let bin = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
    }
    return btoa(bin);
}

function fromBase64(b64: string): Uint8Array | null {
    try {
        const bin = atob(b64.replace(/\s+/g, ''));
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    } catch {
        return null;
    }
}

// ── SVG ───────────────────────────────────────────────────────────────────

/** `svg` with the drawing embedded (replacing any drawing already in it). */
export function embedSceneInSvg(svg: string, yappyBytes: Uint8Array): string {
    const stripped = svg.replace(SVG_SCENE_RE, '');
    const close = stripped.lastIndexOf('</svg>');
    if (close < 0) throw new Error('Not an SVG document (no closing </svg>).');
    const block =
        `<metadata><yappy:scene xmlns:yappy="${SCENE_NS}" encoding="gzip+base64">` +
        toBase64(yappyBytes) +
        '</yappy:scene></metadata>';
    return stripped.slice(0, close) + block + stripped.slice(close);
}

/** The drawing inside an SVG, as `.yappy` bytes, or null when there is none. */
export function extractSceneFromSvg(svg: string): Uint8Array | null {
    const m = SVG_SCENE_INNER_RE.exec(svg);
    return m ? fromBase64(m[1]) : null;
}

// ── PNG ───────────────────────────────────────────────────────────────────

let crcTable: Uint32Array | undefined;

/** CRC-32 as PNG chunks use it (ISO 3309 / ITU-T V.42). */
export function crc32(bytes: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function isPng(bytes: Uint8Array): boolean {
    return bytes.length >= 8 && PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

interface Chunk { type: string; start: number; end: number; data: Uint8Array }

function* chunks(png: Uint8Array): Generator<Chunk> {
    const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
    let off = 8;
    while (off + 12 <= png.length) {
        const len = view.getUint32(off);
        const end = off + 12 + len;
        if (end > png.length) return; // truncated file: stop rather than read past the end
        const type = String.fromCharCode(png[off + 4], png[off + 5], png[off + 6], png[off + 7]);
        yield { type, start: off, end, data: png.subarray(off + 8, off + 8 + len) };
        if (type === 'IEND') return;
        off = end;
    }
}

const latin1 = (s: string) => Uint8Array.from(s, c => c.charCodeAt(0) & 0xff);
const isSceneChunk = (c: Chunk) => {
    if (c.type !== 'tEXt' || c.data.length <= PNG_KEYWORD.length) return false;
    for (let i = 0; i < PNG_KEYWORD.length; i++) if (c.data[i] !== PNG_KEYWORD.charCodeAt(i)) return false;
    return c.data[PNG_KEYWORD.length] === 0;
};

/** `png` with the drawing embedded (replacing any drawing already in it). */
export function embedSceneInPng(png: Uint8Array, yappyBytes: Uint8Array): Uint8Array {
    if (!isPng(png)) throw new Error('Not a PNG image.');
    const parts: Uint8Array[] = [png.subarray(0, 8)];
    let iend: Chunk | undefined;
    for (const c of chunks(png)) {
        if (c.type === 'IEND') { iend = c; break; }
        if (!isSceneChunk(c)) parts.push(png.subarray(c.start, c.end));
    }
    if (!iend) throw new Error('PNG has no IEND chunk.');

    const data = latin1(`${PNG_KEYWORD}\0${toBase64(yappyBytes)}`);
    const chunk = new Uint8Array(12 + data.length);
    const view = new DataView(chunk.buffer);
    view.setUint32(0, data.length);
    chunk.set(latin1('tEXt'), 4);
    chunk.set(data, 8);
    view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
    parts.push(chunk, png.subarray(iend.start, iend.end));

    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
}

/** The drawing inside a PNG, as `.yappy` bytes, or null when there is none. */
export function extractSceneFromPng(png: Uint8Array): Uint8Array | null {
    if (!isPng(png)) return null;
    for (const c of chunks(png)) {
        if (isSceneChunk(c)) {
            let text = '';
            for (let i = PNG_KEYWORD.length + 1; i < c.data.length; i++) text += String.fromCharCode(c.data[i]);
            return fromBase64(text);
        }
    }
    return null;
}

/** The drawing inside a PNG or SVG file's bytes, or null when there is none. */
export function extractScene(bytes: Uint8Array): Uint8Array | null {
    if (isPng(bytes)) return extractSceneFromPng(bytes);
    if (bytes.length === 0) return null;
    return extractSceneFromSvg(new TextDecoder().decode(bytes));
}
