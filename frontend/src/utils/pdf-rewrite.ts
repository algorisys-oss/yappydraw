/**
 * Edit a finished PDF at the object level and rebuild its cross-reference table.
 *
 * jsPDF can't write some things the print export needs — CMYK gradients (its shading writer is
 * hard-wired to DeviceRGB), the PDF/X output intent. Rather than fork it, the export patches the
 * finished file: replace whole objects, append new ones, then rewrite the xref with the new byte
 * offsets.
 *
 * Offsets come from the file's OWN xref table, never from scanning for `N 0 obj`: compressed
 * streams are binary and can contain that byte sequence by chance. jsPDF writes one classic xref
 * section (`xref\n0 N`), no object streams, no incremental updates — the only shape this accepts;
 * anything else throws rather than guessing.
 */

/**
 * Bytes → a "binary string", one char per byte (what jsPDF takes for stream data).
 *
 * NOT `new TextDecoder('latin1')`: the Encoding standard maps that label to windows-1252, which
 * turns bytes 0x80–0x9F into other code points (0x9C → U+0153). Every zlib stream starts 0x78 0x9C,
 * so that silently corrupted the header of every deflated image ("Bad FCHECK in flate stream").
 */
export const toLatin1 = (bytes: Uint8Array): string => {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return s;
};
export const fromLatin1 = (s: string): Uint8Array => {
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
    return out;
};

const concat = (parts: Uint8Array[]): Uint8Array => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
};

export interface PdfObject {
    num: number;
    /** The dictionary text, from after `N 0 obj` up to `stream` (or `endobj`). */
    dict: string;
    /** Raw stream bytes (still filtered), or null for a non-stream object. */
    stream: Uint8Array | null;
}

export class PdfFile {
    private header: Uint8Array;
    /** Object bodies in file order: everything from `N 0 obj` through `endobj\n`. */
    private bodies = new Map<number, Uint8Array>();
    private order: number[] = [];
    private trailer: string;
    private size: number;

    constructor(bytes: Uint8Array) {
        const text = toLatin1(bytes);
        const sx = text.lastIndexOf('startxref');
        if (sx < 0) throw new Error('PDF: no startxref');
        const xrefAt = parseInt(text.slice(sx + 9).trim(), 10);
        if (text.slice(xrefAt, xrefAt + 4) !== 'xref') throw new Error('PDF: startxref does not point at a classic xref table');
        const sub = /^xref\s+(\d+)\s+(\d+)\s*\r?\n/.exec(text.slice(xrefAt));
        if (!sub || sub[1] !== '0') throw new Error('PDF: unsupported xref layout');
        const count = parseInt(sub[2], 10);
        const entriesAt = xrefAt + sub[0].length;
        const offsets: Array<[number, number]> = [];
        for (let i = 1; i < count; i++) {
            const e = text.slice(entriesAt + i * 20, entriesAt + i * 20 + 18);
            const m = /^(\d{10}) (\d{5}) ([nf])/.exec(e);
            if (!m) throw new Error(`PDF: bad xref entry ${i}`);
            if (m[3] === 'n') offsets.push([i, parseInt(m[1], 10)]);
        }
        const tAt = text.indexOf('trailer', entriesAt + count * 20 - 20);
        if (text.indexOf('xref', entriesAt) !== -1 && text.indexOf('xref', entriesAt) < tAt) throw new Error('PDF: multiple xref sections');
        this.trailer = text.slice(text.indexOf('<<', tAt), text.lastIndexOf('>>', sx) + 2);
        this.size = count;
        offsets.sort((a, b) => a[1] - b[1]);
        this.header = bytes.subarray(0, offsets[0][1]);
        offsets.forEach(([num, off], i) => {
            const end = i + 1 < offsets.length ? offsets[i + 1][1] : xrefAt;
            if (!text.startsWith(`${num} 0 obj`, off)) throw new Error(`PDF: object ${num} not at its xref offset`);
            this.bodies.set(num, bytes.subarray(off, end));
            this.order.push(num);
        });
    }

    objectNumbers(): number[] { return [...this.order]; }

    get(num: number): PdfObject | null {
        const body = this.bodies.get(num);
        if (!body) return null;
        const t = toLatin1(body);
        const start = t.indexOf('obj') + 3;
        const s = t.indexOf('stream', start);
        // `endstream` also contains `stream`; a dictionary ends at the FIRST `stream` keyword.
        if (s === -1 || t.lastIndexOf('endobj') < s) return { num, dict: t.slice(start, t.lastIndexOf('endobj')).trim(), stream: null };
        let dataAt = s + 6;
        if (t[dataAt] === '\r') dataAt++;
        if (t[dataAt] === '\n') dataAt++;
        const len = /\/Length (\d+)/.exec(t.slice(start, s));
        const end = len ? dataAt + parseInt(len[1], 10) : t.lastIndexOf('endstream');
        return { num, dict: t.slice(start, s).trim(), stream: body.subarray(dataAt, end) };
    }

    /** Replace an object. `stream` given → `/Length` is set from it (any old one is dropped). */
    set(num: number, dict: string, stream: Uint8Array | null = null): void {
        if (!this.bodies.has(num)) this.order.push(num);
        this.size = Math.max(this.size, num + 1);
        let d = dict.trim();
        if (stream) {
            d = d.replace(/\/Length \d+\s*/g, '');
            d = d.replace(/>>\s*$/, `/Length ${stream.length}\n>>`);
            this.bodies.set(num, concat([fromLatin1(`${num} 0 obj\n${d}\nstream\n`), stream, fromLatin1('\nendstream\nendobj\n')]));
        } else {
            this.bodies.set(num, fromLatin1(`${num} 0 obj\n${d}\nendobj\n`));
        }
    }

    /** Drop an object; its xref entry becomes free. The caller removes any references to it. */
    remove(num: number): void {
        this.bodies.delete(num);
        this.order = this.order.filter(n => n !== num);
    }

    /** Append a new object and return its number. */
    add(dict: string, stream: Uint8Array | null = null): number {
        const num = this.size;
        this.set(num, dict, stream);
        return num;
    }

    /** The trailer dictionary text (`<< /Size … /Root … >>`), editable. */
    getTrailer(): string { return this.trailer; }
    setTrailer(t: string): void { this.trailer = t; }

    /** Replace the `%PDF-x.y` version in the header. */
    setVersion(v: string): void {
        const h = toLatin1(this.header).replace(/^%PDF-\d\.\d/, `%PDF-${v}`);
        this.header = fromLatin1(h);
    }

    /** The object number the trailer's `/Root` (catalog) or `/Info` points at. */
    ref(key: 'Root' | 'Info'): number | null {
        const m = new RegExp(`/${key} (\\d+) 0 R`).exec(this.trailer);
        return m ? parseInt(m[1], 10) : null;
    }

    toBytes(): Uint8Array {
        const parts: Uint8Array[] = [this.header];
        const offsets = new Map<number, number>();
        let pos = this.header.length;
        for (const num of this.order) {
            const b = this.bodies.get(num)!;
            offsets.set(num, pos);
            parts.push(b);
            pos += b.length;
        }
        let xref = `xref\n0 ${this.size}\n0000000000 65535 f \n`;
        for (let i = 1; i < this.size; i++) {
            const o = offsets.get(i);
            xref += o === undefined ? '0000000000 65535 f \n' : `${String(o).padStart(10, '0')} 00000 n \n`;
        }
        const trailer = this.trailer.replace(/\/Size \d+/, `/Size ${this.size}`);
        parts.push(fromLatin1(`${xref}trailer\n${trailer}\nstartxref\n${pos}\n%%EOF\n`));
        return concat(parts);
    }
}

// ── Stream filters ──────────────────────────────────────────────────────────────────

const pipe = async (data: Uint8Array, t: TransformStream<Uint8Array, Uint8Array>) =>
    new Uint8Array(await new Response(new Blob([data as BlobPart]).stream().pipeThrough(t)).arrayBuffer());

export const inflate = (d: Uint8Array) => pipe(d, new DecompressionStream('deflate') as any);
export const deflate = (d: Uint8Array) => pipe(d, new CompressionStream('deflate') as any);

const asciiHexDecode = (d: Uint8Array): Uint8Array => {
    const hex = toLatin1(d).replace(/[^0-9a-fA-F]/g, '');
    const out = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
};

/** Undo the filters named in a dictionary's `/Filter` (FlateDecode and ASCIIHexDecode only). */
export async function decodeStream(dict: string, data: Uint8Array): Promise<Uint8Array> {
    const m = /\/Filter\s*(\[[^\]]*\]|\/\w+)/.exec(dict);
    const filters = m ? (m[1].match(/\/\w+/g) ?? []) : [];
    let out = data;
    for (const f of filters) {
        if (f === '/FlateDecode') out = await inflate(out);
        else if (f === '/ASCIIHexDecode') out = asciiHexDecode(out);
        else throw new Error(`PDF: unsupported filter ${f}`);
    }
    return out;
}
