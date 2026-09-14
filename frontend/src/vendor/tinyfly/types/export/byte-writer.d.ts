/**
 * Growable byte buffer shared by the binary exporters (GIF, WebP, MP4).
 *
 * Container formats need to append bytes of mixed widths and endianness, and
 * occasionally patch a length back into an earlier offset. Doing that with a
 * plain number array is slow and error-prone, so everything funnels through
 * this one small writer.
 */
export declare class ByteWriter {
    private buf;
    private len;
    constructor(initialCapacity?: number);
    /** Bytes written so far — also the offset the next write lands at. */
    get length(): number;
    private ensure;
    byte(value: number): void;
    bytes(values: ArrayLike<number>): void;
    /** Each character's low byte, e.g. a FourCC or an MP4 box type. */
    ascii(text: string): void;
    uint16LE(value: number): void;
    uint24LE(value: number): void;
    uint32LE(value: number): void;
    uint16BE(value: number): void;
    uint24BE(value: number): void;
    uint32BE(value: number): void;
    /** 64-bit big-endian, written as two 32-bit halves (safe up to 2^53). */
    uint64BE(value: number): void;
    /** Overwrite a previously written 32-bit big-endian value, e.g. a box size. */
    patchUint32BE(offset: number, value: number): void;
    /** Overwrite a previously written 32-bit little-endian value. */
    patchUint32LE(offset: number, value: number): void;
    /** A view over the written bytes. Not a copy — do not retain across writes. */
    toUint8Array(): Uint8Array<ArrayBuffer>;
    /** A standalone copy of the written bytes, safe to hand to a Blob. */
    toBytes(): Uint8Array<ArrayBuffer>;
}
