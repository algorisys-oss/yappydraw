/**
 * Bounds-checked little-endian access to hostile input (ported from DeckCraft's
 * `crates/metafile/src/bytes.rs`, MIT/Apache).
 *
 * The Rust reader returns `None` past the end and the record handler gives up with `?`. Here a
 * read past the end throws {@link Short}; every record handler runs inside `guard`, so a truncated
 * or lying size field ends that record the same way, keeping what it already drew. The `opt*`
 * variants return `undefined` instead, for fields the Rust code reads with `unwrap_or`.
 */

/** Thrown by a read past the end of the buffer. Caught per record. */
export class Short extends Error {
    constructor() { super('short read'); }
}

export class Bytes {
    readonly b: Uint8Array;
    readonly view: DataView;
    constructor(b: Uint8Array) {
        this.b = b;
        this.view = new DataView(b.buffer, b.byteOffset, b.byteLength);
    }
    get length(): number { return this.b.length; }

    private need(off: number, n: number): number {
        if (!Number.isInteger(off) || off < 0 || n < 0 || off + n > this.b.length) throw new Short();
        return off;
    }

    /** `len` bytes at `off`. */
    slice(off: number, len: number): Uint8Array {
        this.need(off, len);
        return this.b.subarray(off, off + len);
    }
    /** Everything from `off`. */
    tail(off: number): Bytes {
        this.need(off, 0);
        return new Bytes(this.b.subarray(off));
    }
    sub(off: number, len: number): Bytes { return new Bytes(this.slice(off, len)); }

    u8(off: number): number { return this.b[this.need(off, 1)]; }
    u16(off: number): number { return this.view.getUint16(this.need(off, 2), true); }
    i16(off: number): number { return this.view.getInt16(this.need(off, 2), true); }
    u32(off: number): number { return this.view.getUint32(this.need(off, 4), true); }
    i32(off: number): number { return this.view.getInt32(this.need(off, 4), true); }
    f32(off: number): number { return this.view.getFloat32(this.need(off, 4), true); }

    optU8(off: number): number | undefined { return off >= 0 && off + 1 <= this.b.length ? this.b[off] : undefined; }
    optU16(off: number): number | undefined { return off >= 0 && off + 2 <= this.b.length ? this.view.getUint16(off, true) : undefined; }
    optI16(off: number): number | undefined { return off >= 0 && off + 2 <= this.b.length ? this.view.getInt16(off, true) : undefined; }
    optU32(off: number): number | undefined { return off >= 0 && off + 4 <= this.b.length ? this.view.getUint32(off, true) : undefined; }
    optI32(off: number): number | undefined { return off >= 0 && off + 4 <= this.b.length ? this.view.getInt32(off, true) : undefined; }

    /** `n` consecutive (x, y) pairs of 16- or 32-bit signed integers starting at `off`. */
    points(off: number, n: number, wide: boolean): P[] {
        const sz = wide ? 8 : 4;
        this.need(off, n * sz);
        const out: P[] = new Array(n);
        for (let i = 0; i < n; i++) {
            const o = off + i * sz;
            out[i] = wide ? [this.view.getInt32(o, true), this.view.getInt32(o + 4, true)] : [this.view.getInt16(o, true), this.view.getInt16(o + 2, true)];
        }
        return out;
    }
}

export type P = [number, number];

/** Runs `f`, turning a short read into `undefined` (the Rust handlers' `None`). */
export function guard<T>(f: () => T): T | undefined {
    try {
        return f();
    } catch (e) {
        if (e instanceof Short) return undefined;
        throw e;
    }
}
