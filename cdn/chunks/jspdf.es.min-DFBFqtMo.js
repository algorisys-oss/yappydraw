import { b as So } from "./browser-DbZP-BrN.js";
function xe(n) {
  "@babel/helpers - typeof";
  return xe = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, xe(n);
}
function Gh(n) {
  if (Array.isArray(n)) return n;
}
function Yh(n, t) {
  var e = n == null ? null : typeof Symbol < "u" && n[Symbol.iterator] || n["@@iterator"];
  if (e != null) {
    var i, o, s, f, u = [], c = !0, d = !1;
    try {
      if (s = (e = e.call(n)).next, t !== 0) for (; !(c = (i = s.call(e)).done) && (u.push(i.value), u.length !== t); c = !0) ;
    } catch (m) {
      d = !0, o = m;
    } finally {
      try {
        if (!c && e.return != null && (f = e.return(), Object(f) !== f)) return;
      } finally {
        if (d) throw o;
      }
    }
    return u;
  }
}
function bl(n, t) {
  (t == null || t > n.length) && (t = n.length);
  for (var e = 0, i = Array(t); e < t; e++) i[e] = n[e];
  return i;
}
function Jh(n, t) {
  if (n) {
    if (typeof n == "string") return bl(n, t);
    var e = {}.toString.call(n).slice(8, -1);
    return e === "Object" && n.constructor && (e = n.constructor.name), e === "Map" || e === "Set" ? Array.from(n) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? bl(n, t) : void 0;
  }
}
function $h() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function vl(n, t) {
  return Gh(n) || Yh(n, t) || Jh(n, t) || $h();
}
function wl(n, t = "utf8") {
  return new TextDecoder(t).decode(n);
}
const Kh = new TextEncoder();
function Xh(n) {
  return Kh.encode(n);
}
const Zh = 1024 * 8, Qh = (() => {
  const n = new Uint8Array(4), t = new Uint32Array(n.buffer);
  return !((t[0] = 1) & n[0]);
})(), ao = {
  int8: globalThis.Int8Array,
  uint8: globalThis.Uint8Array,
  int16: globalThis.Int16Array,
  uint16: globalThis.Uint16Array,
  int32: globalThis.Int32Array,
  uint32: globalThis.Uint32Array,
  uint64: globalThis.BigUint64Array,
  int64: globalThis.BigInt64Array,
  float32: globalThis.Float32Array,
  float64: globalThis.Float64Array
};
class jo {
  /**
   * Reference to the internal ArrayBuffer object.
   */
  buffer;
  /**
   * Byte length of the internal ArrayBuffer.
   */
  byteLength;
  /**
   * Byte offset of the internal ArrayBuffer.
   */
  byteOffset;
  /**
   * Byte length of the internal ArrayBuffer.
   */
  length;
  /**
   * The current offset of the buffer's pointer.
   */
  offset;
  lastWrittenByte;
  littleEndian;
  _data;
  _mark;
  _marks;
  /**
   * Create a new IOBuffer.
   * @param data - The data to construct the IOBuffer with.
   * If data is a number, it will be the new buffer's length<br>
   * If data is `undefined`, the buffer will be initialized with a default length of 8Kb<br>
   * If data is an ArrayBuffer, SharedArrayBuffer, an ArrayBufferView (Typed Array), an IOBuffer instance,
   * or a Node.js Buffer, a view will be created over the underlying ArrayBuffer.
   * @param options - An object for the options.
   * @returns A new IOBuffer instance.
   */
  constructor(t = Zh, e = {}) {
    let i = !1;
    typeof t == "number" ? t = new ArrayBuffer(t) : (i = !0, this.lastWrittenByte = t.byteLength);
    const o = e.offset ? e.offset >>> 0 : 0, s = t.byteLength - o;
    let f = o;
    (ArrayBuffer.isView(t) || t instanceof jo) && (t.byteLength !== t.buffer.byteLength && (f = t.byteOffset + o), t = t.buffer), i ? this.lastWrittenByte = s : this.lastWrittenByte = 0, this.buffer = t, this.length = s, this.byteLength = s, this.byteOffset = f, this.offset = 0, this.littleEndian = !0, this._data = new DataView(this.buffer, f, s), this._mark = 0, this._marks = [];
  }
  /**
   * Checks if the memory allocated to the buffer is sufficient to store more
   * bytes after the offset.
   * @param byteLength - The needed memory in bytes.
   * @returns `true` if there is sufficient space and `false` otherwise.
   */
  available(t = 1) {
    return this.offset + t <= this.length;
  }
  /**
   * Check if little-endian mode is used for reading and writing multi-byte
   * values.
   * @returns `true` if little-endian mode is used, `false` otherwise.
   */
  isLittleEndian() {
    return this.littleEndian;
  }
  /**
   * Set little-endian mode for reading and writing multi-byte values.
   * @returns This.
   */
  setLittleEndian() {
    return this.littleEndian = !0, this;
  }
  /**
   * Check if big-endian mode is used for reading and writing multi-byte values.
   * @returns `true` if big-endian mode is used, `false` otherwise.
   */
  isBigEndian() {
    return !this.littleEndian;
  }
  /**
   * Switches to big-endian mode for reading and writing multi-byte values.
   * @returns This.
   */
  setBigEndian() {
    return this.littleEndian = !1, this;
  }
  /**
   * Move the pointer n bytes forward.
   * @param n - Number of bytes to skip.
   * @returns This.
   */
  skip(t = 1) {
    return this.offset += t, this;
  }
  /**
   * Move the pointer n bytes backward.
   * @param n - Number of bytes to move back.
   * @returns This.
   */
  back(t = 1) {
    return this.offset -= t, this;
  }
  /**
   * Move the pointer to the given offset.
   * @param offset - The offset to move to.
   * @returns This.
   */
  seek(t) {
    return this.offset = t, this;
  }
  /**
   * Store the current pointer offset.
   * @see {@link IOBuffer#reset}
   * @returns This.
   */
  mark() {
    return this._mark = this.offset, this;
  }
  /**
   * Move the pointer back to the last pointer offset set by mark.
   * @see {@link IOBuffer#mark}
   * @returns This.
   */
  reset() {
    return this.offset = this._mark, this;
  }
  /**
   * Push the current pointer offset to the mark stack.
   * @see {@link IOBuffer#popMark}
   * @returns This.
   */
  pushMark() {
    return this._marks.push(this.offset), this;
  }
  /**
   * Pop the last pointer offset from the mark stack, and set the current
   * pointer offset to the popped value.
   * @see {@link IOBuffer#pushMark}
   * @returns This.
   */
  popMark() {
    const t = this._marks.pop();
    if (t === void 0)
      throw new Error("Mark stack empty");
    return this.seek(t), this;
  }
  /**
   * Move the pointer offset back to 0.
   * @returns This.
   */
  rewind() {
    return this.offset = 0, this;
  }
  /**
   * Make sure the buffer has sufficient memory to write a given byteLength at
   * the current pointer offset.
   * If the buffer's memory is insufficient, this method will create a new
   * buffer (a copy) with a length that is twice (byteLength + current offset).
   * @param byteLength - The needed memory in bytes.
   * @returns This.
   */
  ensureAvailable(t = 1) {
    if (!this.available(t)) {
      const i = (this.offset + t) * 2, o = new Uint8Array(i);
      o.set(new Uint8Array(this.buffer)), this.buffer = o.buffer, this.length = i, this.byteLength = i, this._data = new DataView(this.buffer);
    }
    return this;
  }
  /**
   * Read a byte and return false if the byte's value is 0, or true otherwise.
   * Moves pointer forward by one byte.
   * @returns The read boolean.
   */
  readBoolean() {
    return this.readUint8() !== 0;
  }
  /**
   * Read a signed 8-bit integer and move pointer forward by 1 byte.
   * @returns The read byte.
   */
  readInt8() {
    return this._data.getInt8(this.offset++);
  }
  /**
   * Read an unsigned 8-bit integer and move pointer forward by 1 byte.
   * @returns The read byte.
   */
  readUint8() {
    return this._data.getUint8(this.offset++);
  }
  /**
   * Alias for {@link IOBuffer#readUint8}.
   * @returns The read byte.
   */
  readByte() {
    return this.readUint8();
  }
  /**
   * Read `n` bytes and move pointer forward by `n` bytes.
   * @param n - Number of bytes to read.
   * @returns The read bytes.
   */
  readBytes(t = 1) {
    return this.readArray(t, "uint8");
  }
  /**
   * Creates an array of corresponding to the type `type` and size `size`.
   * For example type `uint8` will create a `Uint8Array`.
   * @param size - size of the resulting array
   * @param type - number type of elements to read
   * @returns The read array.
   */
  readArray(t, e) {
    const i = ao[e].BYTES_PER_ELEMENT * t, o = this.byteOffset + this.offset, s = this.buffer.slice(o, o + i);
    if (this.littleEndian === Qh && e !== "uint8" && e !== "int8") {
      const u = new Uint8Array(this.buffer.slice(o, o + i));
      u.reverse();
      const c = new ao[e](u.buffer);
      return this.offset += i, c.reverse(), c;
    }
    const f = new ao[e](s);
    return this.offset += i, f;
  }
  /**
   * Read a 16-bit signed integer and move pointer forward by 2 bytes.
   * @returns The read value.
   */
  readInt16() {
    const t = this._data.getInt16(this.offset, this.littleEndian);
    return this.offset += 2, t;
  }
  /**
   * Read a 16-bit unsigned integer and move pointer forward by 2 bytes.
   * @returns The read value.
   */
  readUint16() {
    const t = this._data.getUint16(this.offset, this.littleEndian);
    return this.offset += 2, t;
  }
  /**
   * Read a 32-bit signed integer and move pointer forward by 4 bytes.
   * @returns The read value.
   */
  readInt32() {
    const t = this._data.getInt32(this.offset, this.littleEndian);
    return this.offset += 4, t;
  }
  /**
   * Read a 32-bit unsigned integer and move pointer forward by 4 bytes.
   * @returns The read value.
   */
  readUint32() {
    const t = this._data.getUint32(this.offset, this.littleEndian);
    return this.offset += 4, t;
  }
  /**
   * Read a 32-bit floating number and move pointer forward by 4 bytes.
   * @returns The read value.
   */
  readFloat32() {
    const t = this._data.getFloat32(this.offset, this.littleEndian);
    return this.offset += 4, t;
  }
  /**
   * Read a 64-bit floating number and move pointer forward by 8 bytes.
   * @returns The read value.
   */
  readFloat64() {
    const t = this._data.getFloat64(this.offset, this.littleEndian);
    return this.offset += 8, t;
  }
  /**
   * Read a 64-bit signed integer number and move pointer forward by 8 bytes.
   * @returns The read value.
   */
  readBigInt64() {
    const t = this._data.getBigInt64(this.offset, this.littleEndian);
    return this.offset += 8, t;
  }
  /**
   * Read a 64-bit unsigned integer number and move pointer forward by 8 bytes.
   * @returns The read value.
   */
  readBigUint64() {
    const t = this._data.getBigUint64(this.offset, this.littleEndian);
    return this.offset += 8, t;
  }
  /**
   * Read a 1-byte ASCII character and move pointer forward by 1 byte.
   * @returns The read character.
   */
  readChar() {
    return String.fromCharCode(this.readInt8());
  }
  /**
   * Read `n` 1-byte ASCII characters and move pointer forward by `n` bytes.
   * @param n - Number of characters to read.
   * @returns The read characters.
   */
  readChars(t = 1) {
    let e = "";
    for (let i = 0; i < t; i++)
      e += this.readChar();
    return e;
  }
  /**
   * Read the next `n` bytes, return a UTF-8 decoded string and move pointer
   * forward by `n` bytes.
   * @param n - Number of bytes to read.
   * @returns The decoded string.
   */
  readUtf8(t = 1) {
    return wl(this.readBytes(t));
  }
  /**
   * Read the next `n` bytes, return a string decoded with `encoding` and move pointer
   * forward by `n` bytes.
   * If no encoding is passed, the function is equivalent to @see {@link IOBuffer#readUtf8}
   * @param n - Number of bytes to read.
   * @param encoding - The encoding to use. Default is 'utf8'.
   * @returns The decoded string.
   */
  decodeText(t = 1, e = "utf8") {
    return wl(this.readBytes(t), e);
  }
  /**
   * Write 0xff if the passed value is truthy, 0x00 otherwise and move pointer
   * forward by 1 byte.
   * @param value - The value to write.
   * @returns This.
   */
  writeBoolean(t) {
    return this.writeUint8(t ? 255 : 0), this;
  }
  /**
   * Write `value` as an 8-bit signed integer and move pointer forward by 1 byte.
   * @param value - The value to write.
   * @returns This.
   */
  writeInt8(t) {
    return this.ensureAvailable(1), this._data.setInt8(this.offset++, t), this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as an 8-bit unsigned integer and move pointer forward by 1
   * byte.
   * @param value - The value to write.
   * @returns This.
   */
  writeUint8(t) {
    return this.ensureAvailable(1), this._data.setUint8(this.offset++, t), this._updateLastWrittenByte(), this;
  }
  /**
   * An alias for {@link IOBuffer#writeUint8}.
   * @param value - The value to write.
   * @returns This.
   */
  writeByte(t) {
    return this.writeUint8(t);
  }
  /**
   * Write all elements of `bytes` as uint8 values and move pointer forward by
   * `bytes.length` bytes.
   * @param bytes - The array of bytes to write.
   * @returns This.
   */
  writeBytes(t) {
    this.ensureAvailable(t.length);
    for (let e = 0; e < t.length; e++)
      this._data.setUint8(this.offset++, t[e]);
    return this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 16-bit signed integer and move pointer forward by 2
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeInt16(t) {
    return this.ensureAvailable(2), this._data.setInt16(this.offset, t, this.littleEndian), this.offset += 2, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 16-bit unsigned integer and move pointer forward by 2
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeUint16(t) {
    return this.ensureAvailable(2), this._data.setUint16(this.offset, t, this.littleEndian), this.offset += 2, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 32-bit signed integer and move pointer forward by 4
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeInt32(t) {
    return this.ensureAvailable(4), this._data.setInt32(this.offset, t, this.littleEndian), this.offset += 4, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 32-bit unsigned integer and move pointer forward by 4
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeUint32(t) {
    return this.ensureAvailable(4), this._data.setUint32(this.offset, t, this.littleEndian), this.offset += 4, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 32-bit floating number and move pointer forward by 4
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeFloat32(t) {
    return this.ensureAvailable(4), this._data.setFloat32(this.offset, t, this.littleEndian), this.offset += 4, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 64-bit floating number and move pointer forward by 8
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeFloat64(t) {
    return this.ensureAvailable(8), this._data.setFloat64(this.offset, t, this.littleEndian), this.offset += 8, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 64-bit signed bigint and move pointer forward by 8
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeBigInt64(t) {
    return this.ensureAvailable(8), this._data.setBigInt64(this.offset, t, this.littleEndian), this.offset += 8, this._updateLastWrittenByte(), this;
  }
  /**
   * Write `value` as a 64-bit unsigned bigint and move pointer forward by 8
   * bytes.
   * @param value - The value to write.
   * @returns This.
   */
  writeBigUint64(t) {
    return this.ensureAvailable(8), this._data.setBigUint64(this.offset, t, this.littleEndian), this.offset += 8, this._updateLastWrittenByte(), this;
  }
  /**
   * Write the charCode of `str`'s first character as an 8-bit unsigned integer
   * and move pointer forward by 1 byte.
   * @param str - The character to write.
   * @returns This.
   */
  writeChar(t) {
    return this.writeUint8(t.charCodeAt(0));
  }
  /**
   * Write the charCodes of all `str`'s characters as 8-bit unsigned integers
   * and move pointer forward by `str.length` bytes.
   * @param str - The characters to write.
   * @returns This.
   */
  writeChars(t) {
    for (let e = 0; e < t.length; e++)
      this.writeUint8(t.charCodeAt(e));
    return this;
  }
  /**
   * UTF-8 encode and write `str` to the current pointer offset and move pointer
   * forward according to the encoded length.
   * @param str - The string to write.
   * @returns This.
   */
  writeUtf8(t) {
    return this.writeBytes(Xh(t));
  }
  /**
   * Export a Uint8Array view of the internal buffer.
   * The view starts at the byte offset and its length
   * is calculated to stop at the last written byte or the original length.
   * @returns A new Uint8Array view.
   */
  toArray() {
    return new Uint8Array(this.buffer, this.byteOffset, this.lastWrittenByte);
  }
  /**
   *  Get the total number of bytes written so far, regardless of the current offset.
   * @returns - Total number of bytes.
   */
  getWrittenByteLength() {
    return this.lastWrittenByte - this.byteOffset;
  }
  /**
   * Update the last written byte offset
   * @private
   */
  _updateLastWrittenByte() {
    this.offset > this.lastWrittenByte && (this.lastWrittenByte = this.offset);
  }
}
function Xi(n) {
  let t = n.length;
  for (; --t >= 0; )
    n[t] = 0;
}
const tc = 3, ec = 258, Lu = 29, nc = 256, rc = nc + 1 + Lu, Su = 30, ic = 512, ac = new Array((rc + 2) * 2);
Xi(ac);
const sc = new Array(Su * 2);
Xi(sc);
const oc = new Array(ic);
Xi(oc);
const lc = new Array(ec - tc + 1);
Xi(lc);
const uc = new Array(Lu);
Xi(uc);
const hc = new Array(Su);
Xi(hc);
const cc = (n, t, e, i) => {
  let o = n & 65535 | 0, s = n >>> 16 & 65535 | 0, f = 0;
  for (; e !== 0; ) {
    f = e > 2e3 ? 2e3 : e, e -= f;
    do
      o = o + t[i++] | 0, s = s + o | 0;
    while (--f);
    o %= 65521, s %= 65521;
  }
  return o | s << 16 | 0;
};
var ko = cc;
const fc = () => {
  let n, t = [];
  for (var e = 0; e < 256; e++) {
    n = e;
    for (var i = 0; i < 8; i++)
      n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    t[e] = n;
  }
  return t;
}, dc = new Uint32Array(fc()), pc = (n, t, e, i) => {
  const o = dc, s = i + e;
  n ^= -1;
  for (let f = i; f < s; f++)
    n = n >>> 8 ^ o[(n ^ t[f]) & 255];
  return n ^ -1;
};
var ur = pc, Po = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
}, ku = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
const gc = (n, t) => Object.prototype.hasOwnProperty.call(n, t);
var mc = function(n) {
  const t = Array.prototype.slice.call(arguments, 1);
  for (; t.length; ) {
    const e = t.shift();
    if (e) {
      if (typeof e != "object")
        throw new TypeError(e + "must be non-object");
      for (const i in e)
        gc(e, i) && (n[i] = e[i]);
    }
  }
  return n;
}, bc = (n) => {
  let t = 0;
  for (let i = 0, o = n.length; i < o; i++)
    t += n[i].length;
  const e = new Uint8Array(t);
  for (let i = 0, o = 0, s = n.length; i < s; i++) {
    let f = n[i];
    e.set(f, o), o += f.length;
  }
  return e;
}, Pu = {
  assign: mc,
  flattenChunks: bc
};
let Iu = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Iu = !1;
}
const Sa = new Uint8Array(256);
for (let n = 0; n < 256; n++)
  Sa[n] = n >= 252 ? 6 : n >= 248 ? 5 : n >= 240 ? 4 : n >= 224 ? 3 : n >= 192 ? 2 : 1;
Sa[254] = Sa[254] = 1;
var vc = (n) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(n);
  let t, e, i, o, s, f = n.length, u = 0;
  for (o = 0; o < f; o++)
    e = n.charCodeAt(o), (e & 64512) === 55296 && o + 1 < f && (i = n.charCodeAt(o + 1), (i & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (i - 56320), o++)), u += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (t = new Uint8Array(u), s = 0, o = 0; s < u; o++)
    e = n.charCodeAt(o), (e & 64512) === 55296 && o + 1 < f && (i = n.charCodeAt(o + 1), (i & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (i - 56320), o++)), e < 128 ? t[s++] = e : e < 2048 ? (t[s++] = 192 | e >>> 6, t[s++] = 128 | e & 63) : e < 65536 ? (t[s++] = 224 | e >>> 12, t[s++] = 128 | e >>> 6 & 63, t[s++] = 128 | e & 63) : (t[s++] = 240 | e >>> 18, t[s++] = 128 | e >>> 12 & 63, t[s++] = 128 | e >>> 6 & 63, t[s++] = 128 | e & 63);
  return t;
};
const wc = (n, t) => {
  if (t < 65534 && n.subarray && Iu)
    return String.fromCharCode.apply(null, n.length === t ? n : n.subarray(0, t));
  let e = "";
  for (let i = 0; i < t; i++)
    e += String.fromCharCode(n[i]);
  return e;
};
var yc = (n, t) => {
  const e = t || n.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(n.subarray(0, t));
  let i, o;
  const s = new Array(e * 2);
  for (o = 0, i = 0; i < e; ) {
    let f = n[i++];
    if (f < 128) {
      s[o++] = f;
      continue;
    }
    let u = Sa[f];
    if (u > 4) {
      s[o++] = 65533, i += u - 1;
      continue;
    }
    for (f &= u === 2 ? 31 : u === 3 ? 15 : 7; u > 1 && i < e; )
      f = f << 6 | n[i++] & 63, u--;
    if (u > 1) {
      s[o++] = 65533;
      continue;
    }
    f < 65536 ? s[o++] = f : (f -= 65536, s[o++] = 55296 | f >> 10 & 1023, s[o++] = 56320 | f & 1023);
  }
  return wc(s, o);
}, xc = (n, t) => {
  t = t || n.length, t > n.length && (t = n.length);
  let e = t - 1;
  for (; e >= 0 && (n[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? t : e + Sa[n[e]] > t ? e : t;
}, Io = {
  string2buf: vc,
  buf2string: yc,
  utf8border: xc
};
function _c() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Ac = _c;
const hs = 16209, Nc = 16191;
var Lc = function(t, e) {
  let i, o, s, f, u, c, d, m, A, P, p, B, O, M, S, Y, J, D, lt, yt, mt, tt, z, et;
  const N = t.state;
  i = t.next_in, z = t.input, o = i + (t.avail_in - 5), s = t.next_out, et = t.output, f = s - (e - t.avail_out), u = s + (t.avail_out - 257), c = N.dmax, d = N.wsize, m = N.whave, A = N.wnext, P = N.window, p = N.hold, B = N.bits, O = N.lencode, M = N.distcode, S = (1 << N.lenbits) - 1, Y = (1 << N.distbits) - 1;
  t:
    do {
      B < 15 && (p += z[i++] << B, B += 8, p += z[i++] << B, B += 8), J = O[p & S];
      e:
        for (; ; ) {
          if (D = J >>> 24, p >>>= D, B -= D, D = J >>> 16 & 255, D === 0)
            et[s++] = J & 65535;
          else if (D & 16) {
            lt = J & 65535, D &= 15, D && (B < D && (p += z[i++] << B, B += 8), lt += p & (1 << D) - 1, p >>>= D, B -= D), B < 15 && (p += z[i++] << B, B += 8, p += z[i++] << B, B += 8), J = M[p & Y];
            n:
              for (; ; ) {
                if (D = J >>> 24, p >>>= D, B -= D, D = J >>> 16 & 255, D & 16) {
                  if (yt = J & 65535, D &= 15, B < D && (p += z[i++] << B, B += 8, B < D && (p += z[i++] << B, B += 8)), yt += p & (1 << D) - 1, yt > c) {
                    t.msg = "invalid distance too far back", N.mode = hs;
                    break t;
                  }
                  if (p >>>= D, B -= D, D = s - f, yt > D) {
                    if (D = yt - D, D > m && N.sane) {
                      t.msg = "invalid distance too far back", N.mode = hs;
                      break t;
                    }
                    if (mt = 0, tt = P, A === 0) {
                      if (mt += d - D, D < lt) {
                        lt -= D;
                        do
                          et[s++] = P[mt++];
                        while (--D);
                        mt = s - yt, tt = et;
                      }
                    } else if (A < D) {
                      if (mt += d + A - D, D -= A, D < lt) {
                        lt -= D;
                        do
                          et[s++] = P[mt++];
                        while (--D);
                        if (mt = 0, A < lt) {
                          D = A, lt -= D;
                          do
                            et[s++] = P[mt++];
                          while (--D);
                          mt = s - yt, tt = et;
                        }
                      }
                    } else if (mt += A - D, D < lt) {
                      lt -= D;
                      do
                        et[s++] = P[mt++];
                      while (--D);
                      mt = s - yt, tt = et;
                    }
                    for (; lt > 2; )
                      et[s++] = tt[mt++], et[s++] = tt[mt++], et[s++] = tt[mt++], lt -= 3;
                    lt && (et[s++] = tt[mt++], lt > 1 && (et[s++] = tt[mt++]));
                  } else {
                    mt = s - yt;
                    do
                      et[s++] = et[mt++], et[s++] = et[mt++], et[s++] = et[mt++], lt -= 3;
                    while (lt > 2);
                    lt && (et[s++] = et[mt++], lt > 1 && (et[s++] = et[mt++]));
                  }
                } else if ((D & 64) === 0) {
                  J = M[(J & 65535) + (p & (1 << D) - 1)];
                  continue n;
                } else {
                  t.msg = "invalid distance code", N.mode = hs;
                  break t;
                }
                break;
              }
          } else if ((D & 64) === 0) {
            J = O[(J & 65535) + (p & (1 << D) - 1)];
            continue e;
          } else if (D & 32) {
            N.mode = Nc;
            break t;
          } else {
            t.msg = "invalid literal/length code", N.mode = hs;
            break t;
          }
          break;
        }
    } while (i < o && s < u);
  lt = B >> 3, i -= lt, B -= lt << 3, p &= (1 << B) - 1, t.next_in = i, t.next_out = s, t.avail_in = i < o ? 5 + (o - i) : 5 - (i - o), t.avail_out = s < u ? 257 + (u - s) : 257 - (s - u), N.hold = p, N.bits = B;
};
const Gi = 15, yl = 852, xl = 592, _l = 0, so = 1, Al = 2, Sc = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]), kc = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]), Pc = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]), Ic = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]), Cc = (n, t, e, i, o, s, f, u) => {
  const c = u.bits;
  let d = 0, m = 0, A = 0, P = 0, p = 0, B = 0, O = 0, M = 0, S = 0, Y = 0, J, D, lt, yt, mt, tt = null, z;
  const et = new Uint16Array(Gi + 1), N = new Uint16Array(Gi + 1);
  let E = null, q, U, rt;
  for (d = 0; d <= Gi; d++)
    et[d] = 0;
  for (m = 0; m < i; m++)
    et[t[e + m]]++;
  for (p = c, P = Gi; P >= 1 && et[P] === 0; P--)
    ;
  if (p > P && (p = P), P === 0)
    return o[s++] = 1 << 24 | 64 << 16 | 0, o[s++] = 1 << 24 | 64 << 16 | 0, u.bits = 1, 0;
  for (A = 1; A < P && et[A] === 0; A++)
    ;
  for (p < A && (p = A), M = 1, d = 1; d <= Gi; d++)
    if (M <<= 1, M -= et[d], M < 0)
      return -1;
  if (M > 0 && (n === _l || P !== 1))
    return -1;
  for (N[1] = 0, d = 1; d < Gi; d++)
    N[d + 1] = N[d] + et[d];
  for (m = 0; m < i; m++)
    t[e + m] !== 0 && (f[N[t[e + m]]++] = m);
  if (n === _l ? (tt = E = f, z = 20) : n === so ? (tt = Sc, E = kc, z = 257) : (tt = Pc, E = Ic, z = 0), Y = 0, m = 0, d = A, mt = s, B = p, O = 0, lt = -1, S = 1 << p, yt = S - 1, n === so && S > yl || n === Al && S > xl)
    return 1;
  for (; ; ) {
    q = d - O, f[m] + 1 < z ? (U = 0, rt = f[m]) : f[m] >= z ? (U = E[f[m] - z], rt = tt[f[m] - z]) : (U = 96, rt = 0), J = 1 << d - O, D = 1 << B, A = D;
    do
      D -= J, o[mt + (Y >> O) + D] = q << 24 | U << 16 | rt | 0;
    while (D !== 0);
    for (J = 1 << d - 1; Y & J; )
      J >>= 1;
    if (J !== 0 ? (Y &= J - 1, Y += J) : Y = 0, m++, --et[d] === 0) {
      if (d === P)
        break;
      d = t[e + f[m]];
    }
    if (d > p && (Y & yt) !== lt) {
      for (O === 0 && (O = p), mt += A, B = d - O, M = 1 << B; B + O < P && (M -= et[B + O], !(M <= 0)); )
        B++, M <<= 1;
      if (S += 1 << B, n === so && S > yl || n === Al && S > xl)
        return 1;
      lt = Y & yt, o[lt] = p << 24 | B << 16 | mt - s | 0;
    }
  }
  return Y !== 0 && (o[mt + Y] = d - O << 24 | 64 << 16 | 0), u.bits = p, 0;
};
var xa = Cc;
const Fc = 0, Cu = 1, Fu = 2, {
  Z_FINISH: Nl,
  Z_BLOCK: Ec,
  Z_TREES: cs,
  Z_OK: yi,
  Z_STREAM_END: Oc,
  Z_NEED_DICT: jc,
  Z_STREAM_ERROR: zn,
  Z_DATA_ERROR: Eu,
  Z_MEM_ERROR: Ou,
  Z_BUF_ERROR: Bc,
  Z_DEFLATED: Ll
} = ku, _s = 16180, Sl = 16181, kl = 16182, Pl = 16183, Il = 16184, Cl = 16185, Fl = 16186, El = 16187, Ol = 16188, jl = 16189, ys = 16190, kr = 16191, oo = 16192, Bl = 16193, lo = 16194, Ml = 16195, Rl = 16196, Tl = 16197, Dl = 16198, fs = 16199, ds = 16200, ql = 16201, Ul = 16202, zl = 16203, Hl = 16204, Wl = 16205, uo = 16206, Vl = 16207, Gl = 16208, je = 16209, ju = 16210, Bu = 16211, Mc = 852, Rc = 592, Tc = 15, Dc = Tc, Yl = (n) => (n >>> 24 & 255) + (n >>> 8 & 65280) + ((n & 65280) << 8) + ((n & 255) << 24);
function qc() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const _i = (n) => {
  if (!n)
    return 1;
  const t = n.state;
  return !t || t.strm !== n || t.mode < _s || t.mode > Bu ? 1 : 0;
}, Mu = (n) => {
  if (_i(n))
    return zn;
  const t = n.state;
  return n.total_in = n.total_out = t.total = 0, n.msg = "", t.wrap && (n.adler = t.wrap & 1), t.mode = _s, t.last = 0, t.havedict = 0, t.flags = -1, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Int32Array(Mc), t.distcode = t.distdyn = new Int32Array(Rc), t.sane = 1, t.back = -1, yi;
}, Ru = (n) => {
  if (_i(n))
    return zn;
  const t = n.state;
  return t.wsize = 0, t.whave = 0, t.wnext = 0, Mu(n);
}, Tu = (n, t) => {
  let e;
  if (_i(n))
    return zn;
  const i = n.state;
  return t < 0 ? (e = 0, t = -t) : (e = (t >> 4) + 5, t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? zn : (i.window !== null && i.wbits !== t && (i.window = null), i.wrap = e, i.wbits = t, Ru(n));
}, Du = (n, t) => {
  if (!n)
    return zn;
  const e = new qc();
  n.state = e, e.strm = n, e.window = null, e.mode = _s;
  const i = Tu(n, t);
  return i !== yi && (n.state = null), i;
}, Uc = (n) => Du(n, Dc);
let Jl = !0, ho, co;
const zc = (n) => {
  if (Jl) {
    ho = new Int32Array(512), co = new Int32Array(32);
    let t = 0;
    for (; t < 144; )
      n.lens[t++] = 8;
    for (; t < 256; )
      n.lens[t++] = 9;
    for (; t < 280; )
      n.lens[t++] = 7;
    for (; t < 288; )
      n.lens[t++] = 8;
    for (xa(Cu, n.lens, 0, 288, ho, 0, n.work, { bits: 9 }), t = 0; t < 32; )
      n.lens[t++] = 5;
    xa(Fu, n.lens, 0, 32, co, 0, n.work, { bits: 5 }), Jl = !1;
  }
  n.lencode = ho, n.lenbits = 9, n.distcode = co, n.distbits = 5;
}, qu = (n, t, e, i) => {
  let o;
  const s = n.state;
  return s.window === null && (s.wsize = 1 << s.wbits, s.wnext = 0, s.whave = 0, s.window = new Uint8Array(s.wsize)), i >= s.wsize ? (s.window.set(t.subarray(e - s.wsize, e), 0), s.wnext = 0, s.whave = s.wsize) : (o = s.wsize - s.wnext, o > i && (o = i), s.window.set(t.subarray(e - i, e - i + o), s.wnext), i -= o, i ? (s.window.set(t.subarray(e - i, e), 0), s.wnext = i, s.whave = s.wsize) : (s.wnext += o, s.wnext === s.wsize && (s.wnext = 0), s.whave < s.wsize && (s.whave += o))), 0;
}, Hc = (n, t) => {
  let e, i, o, s, f, u, c, d, m, A, P, p, B, O, M = 0, S, Y, J, D, lt, yt, mt, tt;
  const z = new Uint8Array(4);
  let et, N;
  const E = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (_i(n) || !n.output || !n.input && n.avail_in !== 0)
    return zn;
  e = n.state, e.mode === kr && (e.mode = oo), f = n.next_out, o = n.output, c = n.avail_out, s = n.next_in, i = n.input, u = n.avail_in, d = e.hold, m = e.bits, A = u, P = c, tt = yi;
  t:
    for (; ; )
      switch (e.mode) {
        case _s:
          if (e.wrap === 0) {
            e.mode = oo;
            break;
          }
          for (; m < 16; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          if (e.wrap & 2 && d === 35615) {
            e.wbits === 0 && (e.wbits = 15), e.check = 0, z[0] = d & 255, z[1] = d >>> 8 & 255, e.check = ur(e.check, z, 2, 0), d = 0, m = 0, e.mode = Sl;
            break;
          }
          if (e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((d & 255) << 8) + (d >> 8)) % 31) {
            n.msg = "incorrect header check", e.mode = je;
            break;
          }
          if ((d & 15) !== Ll) {
            n.msg = "unknown compression method", e.mode = je;
            break;
          }
          if (d >>>= 4, m -= 4, mt = (d & 15) + 8, e.wbits === 0 && (e.wbits = mt), mt > 15 || mt > e.wbits) {
            n.msg = "invalid window size", e.mode = je;
            break;
          }
          e.dmax = 1 << e.wbits, e.flags = 0, n.adler = e.check = 1, e.mode = d & 512 ? jl : kr, d = 0, m = 0;
          break;
        case Sl:
          for (; m < 16; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          if (e.flags = d, (e.flags & 255) !== Ll) {
            n.msg = "unknown compression method", e.mode = je;
            break;
          }
          if (e.flags & 57344) {
            n.msg = "unknown header flags set", e.mode = je;
            break;
          }
          e.head && (e.head.text = d >> 8 & 1), e.flags & 512 && e.wrap & 4 && (z[0] = d & 255, z[1] = d >>> 8 & 255, e.check = ur(e.check, z, 2, 0)), d = 0, m = 0, e.mode = kl;
        /* falls through */
        case kl:
          for (; m < 32; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          e.head && (e.head.time = d), e.flags & 512 && e.wrap & 4 && (z[0] = d & 255, z[1] = d >>> 8 & 255, z[2] = d >>> 16 & 255, z[3] = d >>> 24 & 255, e.check = ur(e.check, z, 4, 0)), d = 0, m = 0, e.mode = Pl;
        /* falls through */
        case Pl:
          for (; m < 16; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          e.head && (e.head.xflags = d & 255, e.head.os = d >> 8), e.flags & 512 && e.wrap & 4 && (z[0] = d & 255, z[1] = d >>> 8 & 255, e.check = ur(e.check, z, 2, 0)), d = 0, m = 0, e.mode = Il;
        /* falls through */
        case Il:
          if (e.flags & 1024) {
            for (; m < 16; ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            e.length = d, e.head && (e.head.extra_len = d), e.flags & 512 && e.wrap & 4 && (z[0] = d & 255, z[1] = d >>> 8 & 255, e.check = ur(e.check, z, 2, 0)), d = 0, m = 0;
          } else e.head && (e.head.extra = null);
          e.mode = Cl;
        /* falls through */
        case Cl:
          if (e.flags & 1024 && (p = e.length, p > u && (p = u), p && (e.head && (mt = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(
            i.subarray(
              s,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              s + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            mt
          )), e.flags & 512 && e.wrap & 4 && (e.check = ur(e.check, i, p, s)), u -= p, s += p, e.length -= p), e.length))
            break t;
          e.length = 0, e.mode = Fl;
        /* falls through */
        case Fl:
          if (e.flags & 2048) {
            if (u === 0)
              break t;
            p = 0;
            do
              mt = i[s + p++], e.head && mt && e.length < 65536 && (e.head.name += String.fromCharCode(mt));
            while (mt && p < u);
            if (e.flags & 512 && e.wrap & 4 && (e.check = ur(e.check, i, p, s)), u -= p, s += p, mt)
              break t;
          } else e.head && (e.head.name = null);
          e.length = 0, e.mode = El;
        /* falls through */
        case El:
          if (e.flags & 4096) {
            if (u === 0)
              break t;
            p = 0;
            do
              mt = i[s + p++], e.head && mt && e.length < 65536 && (e.head.comment += String.fromCharCode(mt));
            while (mt && p < u);
            if (e.flags & 512 && e.wrap & 4 && (e.check = ur(e.check, i, p, s)), u -= p, s += p, mt)
              break t;
          } else e.head && (e.head.comment = null);
          e.mode = Ol;
        /* falls through */
        case Ol:
          if (e.flags & 512) {
            for (; m < 16; ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            if (e.wrap & 4 && d !== (e.check & 65535)) {
              n.msg = "header crc mismatch", e.mode = je;
              break;
            }
            d = 0, m = 0;
          }
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), n.adler = e.check = 0, e.mode = kr;
          break;
        case jl:
          for (; m < 32; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          n.adler = e.check = Yl(d), d = 0, m = 0, e.mode = ys;
        /* falls through */
        case ys:
          if (e.havedict === 0)
            return n.next_out = f, n.avail_out = c, n.next_in = s, n.avail_in = u, e.hold = d, e.bits = m, jc;
          n.adler = e.check = 1, e.mode = kr;
        /* falls through */
        case kr:
          if (t === Ec || t === cs)
            break t;
        /* falls through */
        case oo:
          if (e.last) {
            d >>>= m & 7, m -= m & 7, e.mode = uo;
            break;
          }
          for (; m < 3; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          switch (e.last = d & 1, d >>>= 1, m -= 1, d & 3) {
            case 0:
              e.mode = Bl;
              break;
            case 1:
              if (zc(e), e.mode = fs, t === cs) {
                d >>>= 2, m -= 2;
                break t;
              }
              break;
            case 2:
              e.mode = Rl;
              break;
            case 3:
              n.msg = "invalid block type", e.mode = je;
          }
          d >>>= 2, m -= 2;
          break;
        case Bl:
          for (d >>>= m & 7, m -= m & 7; m < 32; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          if ((d & 65535) !== (d >>> 16 ^ 65535)) {
            n.msg = "invalid stored block lengths", e.mode = je;
            break;
          }
          if (e.length = d & 65535, d = 0, m = 0, e.mode = lo, t === cs)
            break t;
        /* falls through */
        case lo:
          e.mode = Ml;
        /* falls through */
        case Ml:
          if (p = e.length, p) {
            if (p > u && (p = u), p > c && (p = c), p === 0)
              break t;
            o.set(i.subarray(s, s + p), f), u -= p, s += p, c -= p, f += p, e.length -= p;
            break;
          }
          e.mode = kr;
          break;
        case Rl:
          for (; m < 14; ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          if (e.nlen = (d & 31) + 257, d >>>= 5, m -= 5, e.ndist = (d & 31) + 1, d >>>= 5, m -= 5, e.ncode = (d & 15) + 4, d >>>= 4, m -= 4, e.nlen > 286 || e.ndist > 30) {
            n.msg = "too many length or distance symbols", e.mode = je;
            break;
          }
          e.have = 0, e.mode = Tl;
        /* falls through */
        case Tl:
          for (; e.have < e.ncode; ) {
            for (; m < 3; ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            e.lens[E[e.have++]] = d & 7, d >>>= 3, m -= 3;
          }
          for (; e.have < 19; )
            e.lens[E[e.have++]] = 0;
          if (e.lencode = e.lendyn, e.lenbits = 7, et = { bits: e.lenbits }, tt = xa(Fc, e.lens, 0, 19, e.lencode, 0, e.work, et), e.lenbits = et.bits, tt) {
            n.msg = "invalid code lengths set", e.mode = je;
            break;
          }
          e.have = 0, e.mode = Dl;
        /* falls through */
        case Dl:
          for (; e.have < e.nlen + e.ndist; ) {
            for (; M = e.lencode[d & (1 << e.lenbits) - 1], S = M >>> 24, Y = M >>> 16 & 255, J = M & 65535, !(S <= m); ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            if (J < 16)
              d >>>= S, m -= S, e.lens[e.have++] = J;
            else {
              if (J === 16) {
                for (N = S + 2; m < N; ) {
                  if (u === 0)
                    break t;
                  u--, d += i[s++] << m, m += 8;
                }
                if (d >>>= S, m -= S, e.have === 0) {
                  n.msg = "invalid bit length repeat", e.mode = je;
                  break;
                }
                mt = e.lens[e.have - 1], p = 3 + (d & 3), d >>>= 2, m -= 2;
              } else if (J === 17) {
                for (N = S + 3; m < N; ) {
                  if (u === 0)
                    break t;
                  u--, d += i[s++] << m, m += 8;
                }
                d >>>= S, m -= S, mt = 0, p = 3 + (d & 7), d >>>= 3, m -= 3;
              } else {
                for (N = S + 7; m < N; ) {
                  if (u === 0)
                    break t;
                  u--, d += i[s++] << m, m += 8;
                }
                d >>>= S, m -= S, mt = 0, p = 11 + (d & 127), d >>>= 7, m -= 7;
              }
              if (e.have + p > e.nlen + e.ndist) {
                n.msg = "invalid bit length repeat", e.mode = je;
                break;
              }
              for (; p--; )
                e.lens[e.have++] = mt;
            }
          }
          if (e.mode === je)
            break;
          if (e.lens[256] === 0) {
            n.msg = "invalid code -- missing end-of-block", e.mode = je;
            break;
          }
          if (e.lenbits = 9, et = { bits: e.lenbits }, tt = xa(Cu, e.lens, 0, e.nlen, e.lencode, 0, e.work, et), e.lenbits = et.bits, tt) {
            n.msg = "invalid literal/lengths set", e.mode = je;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, et = { bits: e.distbits }, tt = xa(Fu, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, et), e.distbits = et.bits, tt) {
            n.msg = "invalid distances set", e.mode = je;
            break;
          }
          if (e.mode = fs, t === cs)
            break t;
        /* falls through */
        case fs:
          e.mode = ds;
        /* falls through */
        case ds:
          if (u >= 6 && c >= 258) {
            n.next_out = f, n.avail_out = c, n.next_in = s, n.avail_in = u, e.hold = d, e.bits = m, Lc(n, P), f = n.next_out, o = n.output, c = n.avail_out, s = n.next_in, i = n.input, u = n.avail_in, d = e.hold, m = e.bits, e.mode === kr && (e.back = -1);
            break;
          }
          for (e.back = 0; M = e.lencode[d & (1 << e.lenbits) - 1], S = M >>> 24, Y = M >>> 16 & 255, J = M & 65535, !(S <= m); ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          if (Y && (Y & 240) === 0) {
            for (D = S, lt = Y, yt = J; M = e.lencode[yt + ((d & (1 << D + lt) - 1) >> D)], S = M >>> 24, Y = M >>> 16 & 255, J = M & 65535, !(D + S <= m); ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            d >>>= D, m -= D, e.back += D;
          }
          if (d >>>= S, m -= S, e.back += S, e.length = J, Y === 0) {
            e.mode = Wl;
            break;
          }
          if (Y & 32) {
            e.back = -1, e.mode = kr;
            break;
          }
          if (Y & 64) {
            n.msg = "invalid literal/length code", e.mode = je;
            break;
          }
          e.extra = Y & 15, e.mode = ql;
        /* falls through */
        case ql:
          if (e.extra) {
            for (N = e.extra; m < N; ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            e.length += d & (1 << e.extra) - 1, d >>>= e.extra, m -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = Ul;
        /* falls through */
        case Ul:
          for (; M = e.distcode[d & (1 << e.distbits) - 1], S = M >>> 24, Y = M >>> 16 & 255, J = M & 65535, !(S <= m); ) {
            if (u === 0)
              break t;
            u--, d += i[s++] << m, m += 8;
          }
          if ((Y & 240) === 0) {
            for (D = S, lt = Y, yt = J; M = e.distcode[yt + ((d & (1 << D + lt) - 1) >> D)], S = M >>> 24, Y = M >>> 16 & 255, J = M & 65535, !(D + S <= m); ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            d >>>= D, m -= D, e.back += D;
          }
          if (d >>>= S, m -= S, e.back += S, Y & 64) {
            n.msg = "invalid distance code", e.mode = je;
            break;
          }
          e.offset = J, e.extra = Y & 15, e.mode = zl;
        /* falls through */
        case zl:
          if (e.extra) {
            for (N = e.extra; m < N; ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            e.offset += d & (1 << e.extra) - 1, d >>>= e.extra, m -= e.extra, e.back += e.extra;
          }
          if (e.offset > e.dmax) {
            n.msg = "invalid distance too far back", e.mode = je;
            break;
          }
          e.mode = Hl;
        /* falls through */
        case Hl:
          if (c === 0)
            break t;
          if (p = P - c, e.offset > p) {
            if (p = e.offset - p, p > e.whave && e.sane) {
              n.msg = "invalid distance too far back", e.mode = je;
              break;
            }
            p > e.wnext ? (p -= e.wnext, B = e.wsize - p) : B = e.wnext - p, p > e.length && (p = e.length), O = e.window;
          } else
            O = o, B = f - e.offset, p = e.length;
          p > c && (p = c), c -= p, e.length -= p;
          do
            o[f++] = O[B++];
          while (--p);
          e.length === 0 && (e.mode = ds);
          break;
        case Wl:
          if (c === 0)
            break t;
          o[f++] = e.length, c--, e.mode = ds;
          break;
        case uo:
          if (e.wrap) {
            for (; m < 32; ) {
              if (u === 0)
                break t;
              u--, d |= i[s++] << m, m += 8;
            }
            if (P -= c, n.total_out += P, e.total += P, e.wrap & 4 && P && (n.adler = e.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            e.flags ? ur(e.check, o, P, f - P) : ko(e.check, o, P, f - P)), P = c, e.wrap & 4 && (e.flags ? d : Yl(d)) !== e.check) {
              n.msg = "incorrect data check", e.mode = je;
              break;
            }
            d = 0, m = 0;
          }
          e.mode = Vl;
        /* falls through */
        case Vl:
          if (e.wrap && e.flags) {
            for (; m < 32; ) {
              if (u === 0)
                break t;
              u--, d += i[s++] << m, m += 8;
            }
            if (e.wrap & 4 && d !== (e.total & 4294967295)) {
              n.msg = "incorrect length check", e.mode = je;
              break;
            }
            d = 0, m = 0;
          }
          e.mode = Gl;
        /* falls through */
        case Gl:
          tt = Oc;
          break t;
        case je:
          tt = Eu;
          break t;
        case ju:
          return Ou;
        case Bu:
        /* falls through */
        default:
          return zn;
      }
  return n.next_out = f, n.avail_out = c, n.next_in = s, n.avail_in = u, e.hold = d, e.bits = m, (e.wsize || P !== n.avail_out && e.mode < je && (e.mode < uo || t !== Nl)) && qu(n, n.output, n.next_out, P - n.avail_out), A -= n.avail_in, P -= n.avail_out, n.total_in += A, n.total_out += P, e.total += P, e.wrap & 4 && P && (n.adler = e.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  e.flags ? ur(e.check, o, P, n.next_out - P) : ko(e.check, o, P, n.next_out - P)), n.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === kr ? 128 : 0) + (e.mode === fs || e.mode === lo ? 256 : 0), (A === 0 && P === 0 || t === Nl) && tt === yi && (tt = Bc), tt;
}, Wc = (n) => {
  if (_i(n))
    return zn;
  let t = n.state;
  return t.window && (t.window = null), n.state = null, yi;
}, Vc = (n, t) => {
  if (_i(n))
    return zn;
  const e = n.state;
  return (e.wrap & 2) === 0 ? zn : (e.head = t, t.done = !1, yi);
}, Gc = (n, t) => {
  const e = t.length;
  let i, o, s;
  return _i(n) || (i = n.state, i.wrap !== 0 && i.mode !== ys) ? zn : i.mode === ys && (o = 1, o = ko(o, t, e, 0), o !== i.check) ? Eu : (s = qu(n, t, e, e), s ? (i.mode = ju, Ou) : (i.havedict = 1, yi));
};
var Yc = Ru, Jc = Tu, $c = Mu, Kc = Uc, Xc = Du, Zc = Hc, Qc = Wc, tf = Vc, ef = Gc, nf = "pako inflate (from Nodeca project)", Pr = {
  inflateReset: Yc,
  inflateReset2: Jc,
  inflateResetKeep: $c,
  inflateInit: Kc,
  inflateInit2: Xc,
  inflate: Zc,
  inflateEnd: Qc,
  inflateGetHeader: tf,
  inflateSetDictionary: ef,
  inflateInfo: nf
};
function rf() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var af = rf;
const Uu = Object.prototype.toString, {
  Z_NO_FLUSH: sf,
  Z_FINISH: of,
  Z_OK: ka,
  Z_STREAM_END: fo,
  Z_NEED_DICT: po,
  Z_STREAM_ERROR: lf,
  Z_DATA_ERROR: $l,
  Z_MEM_ERROR: uf
} = ku;
function Ia(n) {
  this.options = Pu.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, n || {});
  const t = this.options;
  t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), t.windowBits >= 0 && t.windowBits < 16 && !(n && n.windowBits) && (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && (t.windowBits & 15) === 0 && (t.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ac(), this.strm.avail_out = 0;
  let e = Pr.inflateInit2(
    this.strm,
    t.windowBits
  );
  if (e !== ka)
    throw new Error(Po[e]);
  if (this.header = new af(), Pr.inflateGetHeader(this.strm, this.header), t.dictionary && (typeof t.dictionary == "string" ? t.dictionary = Io.string2buf(t.dictionary) : Uu.call(t.dictionary) === "[object ArrayBuffer]" && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (e = Pr.inflateSetDictionary(this.strm, t.dictionary), e !== ka)))
    throw new Error(Po[e]);
}
Ia.prototype.push = function(n, t) {
  const e = this.strm, i = this.options.chunkSize, o = this.options.dictionary;
  let s, f, u;
  if (this.ended) return !1;
  for (t === ~~t ? f = t : f = t === !0 ? of : sf, Uu.call(n) === "[object ArrayBuffer]" ? e.input = new Uint8Array(n) : e.input = n, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(i), e.next_out = 0, e.avail_out = i), s = Pr.inflate(e, f), s === po && o && (s = Pr.inflateSetDictionary(e, o), s === ka ? s = Pr.inflate(e, f) : s === $l && (s = po)); e.avail_in > 0 && s === fo && e.state.wrap > 0 && n[e.next_in] !== 0; )
      Pr.inflateReset(e), s = Pr.inflate(e, f);
    switch (s) {
      case lf:
      case $l:
      case po:
      case uf:
        return this.onEnd(s), this.ended = !0, !1;
    }
    if (u = e.avail_out, e.next_out && (e.avail_out === 0 || s === fo))
      if (this.options.to === "string") {
        let c = Io.utf8border(e.output, e.next_out), d = e.next_out - c, m = Io.buf2string(e.output, c);
        e.next_out = d, e.avail_out = i - d, d && e.output.set(e.output.subarray(c, c + d), 0), this.onData(m);
      } else
        this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out));
    if (!(s === ka && u === 0)) {
      if (s === fo)
        return s = Pr.inflateEnd(this.strm), this.onEnd(s), this.ended = !0, !0;
      if (e.avail_in === 0) break;
    }
  }
  return !0;
};
Ia.prototype.onData = function(n) {
  this.chunks.push(n);
};
Ia.prototype.onEnd = function(n) {
  n === ka && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Pu.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
};
function hf(n, t) {
  const e = new Ia(t);
  if (e.push(n), e.err) throw e.msg || Po[e.err];
  return e.result;
}
var cf = Ia, ff = hf, df = {
  Inflate: cf,
  inflate: ff
};
const { Inflate: pf, inflate: gf } = df;
var Kl = pf, mf = gf;
const zu = [];
for (let n = 0; n < 256; n++) {
  let t = n;
  for (let e = 0; e < 8; e++)
    t & 1 ? t = 3988292384 ^ t >>> 1 : t = t >>> 1;
  zu[n] = t;
}
const Xl = 4294967295;
function bf(n, t, e) {
  let i = n;
  for (let o = 0; o < e; o++)
    i = zu[(i ^ t[o]) & 255] ^ i >>> 8;
  return i;
}
function vf(n, t) {
  return (bf(Xl, n, t) ^ Xl) >>> 0;
}
function Zl(n, t, e) {
  const i = n.readUint32(), o = vf(new Uint8Array(n.buffer, n.byteOffset + n.offset - t - 4, t), t);
  if (o !== i)
    throw new Error(`CRC mismatch for chunk ${e}. Expected ${i}, found ${o}`);
}
function Hu(n, t, e) {
  for (let i = 0; i < e; i++)
    t[i] = n[i];
}
function Wu(n, t, e, i) {
  let o = 0;
  for (; o < i; o++)
    t[o] = n[o];
  for (; o < e; o++)
    t[o] = n[o] + t[o - i] & 255;
}
function Vu(n, t, e, i) {
  let o = 0;
  if (e.length === 0)
    for (; o < i; o++)
      t[o] = n[o];
  else
    for (; o < i; o++)
      t[o] = n[o] + e[o] & 255;
}
function Gu(n, t, e, i, o) {
  let s = 0;
  if (e.length === 0) {
    for (; s < o; s++)
      t[s] = n[s];
    for (; s < i; s++)
      t[s] = n[s] + (t[s - o] >> 1) & 255;
  } else {
    for (; s < o; s++)
      t[s] = n[s] + (e[s] >> 1) & 255;
    for (; s < i; s++)
      t[s] = n[s] + (t[s - o] + e[s] >> 1) & 255;
  }
}
function Yu(n, t, e, i, o) {
  let s = 0;
  if (e.length === 0) {
    for (; s < o; s++)
      t[s] = n[s];
    for (; s < i; s++)
      t[s] = n[s] + t[s - o] & 255;
  } else {
    for (; s < o; s++)
      t[s] = n[s] + e[s] & 255;
    for (; s < i; s++)
      t[s] = n[s] + wf(t[s - o], e[s], e[s - o]) & 255;
  }
}
function wf(n, t, e) {
  const i = n + t - e, o = Math.abs(i - n), s = Math.abs(i - t), f = Math.abs(i - e);
  return o <= s && o <= f ? n : s <= f ? t : e;
}
function yf(n, t, e, i, o, s) {
  switch (n) {
    case 0:
      Hu(t, e, o);
      break;
    case 1:
      Wu(t, e, o, s);
      break;
    case 2:
      Vu(t, e, i, o);
      break;
    case 3:
      Gu(t, e, i, o, s);
      break;
    case 4:
      Yu(t, e, i, o, s);
      break;
    default:
      throw new Error(`Unsupported filter: ${n}`);
  }
}
const xf = new Uint16Array([255]), _f = new Uint8Array(xf.buffer), Af = _f[0] === 255;
function Nf(n) {
  const { data: t, width: e, height: i, channels: o, depth: s } = n, f = [
    { x: 0, y: 0, xStep: 8, yStep: 8 },
    // Pass 1
    { x: 4, y: 0, xStep: 8, yStep: 8 },
    // Pass 2
    { x: 0, y: 4, xStep: 4, yStep: 8 },
    // Pass 3
    { x: 2, y: 0, xStep: 4, yStep: 4 },
    // Pass 4
    { x: 0, y: 2, xStep: 2, yStep: 4 },
    // Pass 5
    { x: 1, y: 0, xStep: 2, yStep: 2 },
    // Pass 6
    { x: 0, y: 1, xStep: 1, yStep: 2 }
    // Pass 7
  ], u = Math.ceil(s / 8) * o, c = new Uint8Array(i * e * u);
  let d = 0;
  for (let m = 0; m < 7; m++) {
    const A = f[m], P = Math.ceil((e - A.x) / A.xStep), p = Math.ceil((i - A.y) / A.yStep);
    if (P <= 0 || p <= 0)
      continue;
    const B = P * u, O = new Uint8Array(B);
    for (let M = 0; M < p; M++) {
      const S = t[d++], Y = t.subarray(d, d + B);
      d += B;
      const J = new Uint8Array(B);
      yf(S, Y, J, O, B, u), O.set(J);
      for (let D = 0; D < P; D++) {
        const lt = A.x + D * A.xStep, yt = A.y + M * A.yStep;
        if (!(lt >= e || yt >= i))
          for (let mt = 0; mt < u; mt++)
            c[(yt * e + lt) * u + mt] = J[D * u + mt];
      }
    }
  }
  if (s === 16) {
    const m = new Uint16Array(c.buffer);
    if (Af)
      for (let A = 0; A < m.length; A++)
        m[A] = Lf(m[A]);
    return m;
  } else
    return c;
}
function Lf(n) {
  return (n & 255) << 8 | n >> 8 & 255;
}
const Sf = new Uint16Array([255]), kf = new Uint8Array(Sf.buffer), Pf = kf[0] === 255, If = new Uint8Array(0);
function Ql(n) {
  const { data: t, width: e, height: i, channels: o, depth: s } = n, f = Math.ceil(s / 8) * o, u = Math.ceil(s / 8 * o * e), c = new Uint8Array(i * u);
  let d = If, m = 0, A, P;
  for (let p = 0; p < i; p++) {
    switch (A = t.subarray(m + 1, m + 1 + u), P = c.subarray(p * u, (p + 1) * u), t[m]) {
      case 0:
        Hu(A, P, u);
        break;
      case 1:
        Wu(A, P, u, f);
        break;
      case 2:
        Vu(A, P, d, u);
        break;
      case 3:
        Gu(A, P, d, u, f);
        break;
      case 4:
        Yu(A, P, d, u, f);
        break;
      default:
        throw new Error(`Unsupported filter: ${t[m]}`);
    }
    d = P, m += u + 1;
  }
  if (s === 16) {
    const p = new Uint16Array(c.buffer);
    if (Pf)
      for (let B = 0; B < p.length; B++)
        p[B] = Cf(p[B]);
    return p;
  } else
    return c;
}
function Cf(n) {
  return (n & 255) << 8 | n >> 8 & 255;
}
const vs = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
function tu(n) {
  if (!Ff(n.readBytes(vs.length)))
    throw new Error("wrong PNG signature");
}
function Ff(n) {
  if (n.length < vs.length)
    return !1;
  for (let t = 0; t < vs.length; t++)
    if (n[t] !== vs[t])
      return !1;
  return !0;
}
const Ef = "tEXt", Of = 0, Ju = new TextDecoder("latin1");
function jf(n) {
  if (Mf(n), n.length === 0 || n.length > 79)
    throw new Error("keyword length must be between 1 and 79");
}
const Bf = /^[\u0000-\u00FF]*$/;
function Mf(n) {
  if (!Bf.test(n))
    throw new Error("invalid latin1 text");
}
function Rf(n, t, e) {
  const i = $u(t);
  n[i] = Tf(t, e - i.length - 1);
}
function $u(n) {
  for (n.mark(); n.readByte() !== Of; )
    ;
  const t = n.offset;
  n.reset();
  const e = Ju.decode(n.readBytes(t - n.offset - 1));
  return n.skip(1), jf(e), e;
}
function Tf(n, t) {
  return Ju.decode(n.readBytes(t));
}
const jn = {
  UNKNOWN: -1,
  GREYSCALE: 0,
  TRUECOLOUR: 2,
  INDEXED_COLOUR: 3,
  GREYSCALE_ALPHA: 4,
  TRUECOLOUR_ALPHA: 6
}, go = {
  UNKNOWN: -1,
  DEFLATE: 0
}, eu = {
  UNKNOWN: -1,
  ADAPTIVE: 0
}, mo = {
  UNKNOWN: -1,
  NO_INTERLACE: 0,
  ADAM7: 1
}, ps = {
  NONE: 0,
  BACKGROUND: 1,
  PREVIOUS: 2
}, bo = {
  SOURCE: 0,
  OVER: 1
};
class Df extends jo {
  _checkCrc;
  _inflator;
  _png;
  _apng;
  _end;
  _hasPalette;
  _palette;
  _hasTransparency;
  _transparency;
  _compressionMethod;
  _filterMethod;
  _interlaceMethod;
  _colorType;
  _isAnimated;
  _numberOfFrames;
  _numberOfPlays;
  _frames;
  _writingDataChunks;
  constructor(t, e = {}) {
    super(t);
    const { checkCrc: i = !1 } = e;
    this._checkCrc = i, this._inflator = new Kl(), this._png = {
      width: -1,
      height: -1,
      channels: -1,
      data: new Uint8Array(0),
      depth: 1,
      text: {}
    }, this._apng = {
      width: -1,
      height: -1,
      channels: -1,
      depth: 1,
      numberOfFrames: 1,
      numberOfPlays: 0,
      text: {},
      frames: []
    }, this._end = !1, this._hasPalette = !1, this._palette = [], this._hasTransparency = !1, this._transparency = new Uint16Array(0), this._compressionMethod = go.UNKNOWN, this._filterMethod = eu.UNKNOWN, this._interlaceMethod = mo.UNKNOWN, this._colorType = jn.UNKNOWN, this._isAnimated = !1, this._numberOfFrames = 1, this._numberOfPlays = 0, this._frames = [], this._writingDataChunks = !1, this.setBigEndian();
  }
  decode() {
    for (tu(this); !this._end; ) {
      const t = this.readUint32(), e = this.readChars(4);
      this.decodeChunk(t, e);
    }
    return this.decodeImage(), this._png;
  }
  decodeApng() {
    for (tu(this); !this._end; ) {
      const t = this.readUint32(), e = this.readChars(4);
      this.decodeApngChunk(t, e);
    }
    return this.decodeApngImage(), this._apng;
  }
  // https://www.w3.org/TR/PNG/#5Chunk-layout
  decodeChunk(t, e) {
    const i = this.offset;
    switch (e) {
      // 11.2 Critical chunks
      case "IHDR":
        this.decodeIHDR();
        break;
      case "PLTE":
        this.decodePLTE(t);
        break;
      case "IDAT":
        this.decodeIDAT(t);
        break;
      case "IEND":
        this._end = !0;
        break;
      // 11.3 Ancillary chunks
      case "tRNS":
        this.decodetRNS(t);
        break;
      case "iCCP":
        this.decodeiCCP(t);
        break;
      case Ef:
        Rf(this._png.text, this, t);
        break;
      case "pHYs":
        this.decodepHYs();
        break;
      default:
        this.skip(t);
        break;
    }
    if (this.offset - i !== t)
      throw new Error(`Length mismatch while decoding chunk ${e}`);
    this._checkCrc ? Zl(this, t + 4, e) : this.skip(4);
  }
  decodeApngChunk(t, e) {
    const i = this.offset;
    switch (e !== "fdAT" && e !== "IDAT" && this._writingDataChunks && this.pushDataToFrame(), e) {
      case "acTL":
        this.decodeACTL();
        break;
      case "fcTL":
        this.decodeFCTL();
        break;
      case "fdAT":
        this.decodeFDAT(t);
        break;
      default:
        this.decodeChunk(t, e), this.offset = i + t;
        break;
    }
    if (this.offset - i !== t)
      throw new Error(`Length mismatch while decoding chunk ${e}`);
    this._checkCrc ? Zl(this, t + 4, e) : this.skip(4);
  }
  // https://www.w3.org/TR/PNG/#11IHDR
  decodeIHDR() {
    const t = this._png;
    t.width = this.readUint32(), t.height = this.readUint32(), t.depth = qf(this.readUint8());
    const e = this.readUint8();
    this._colorType = e;
    let i;
    switch (e) {
      case jn.GREYSCALE:
        i = 1;
        break;
      case jn.TRUECOLOUR:
        i = 3;
        break;
      case jn.INDEXED_COLOUR:
        i = 1;
        break;
      case jn.GREYSCALE_ALPHA:
        i = 2;
        break;
      case jn.TRUECOLOUR_ALPHA:
        i = 4;
        break;
      // Kept for exhaustiveness.
      // eslint-disable-next-line unicorn/no-useless-switch-case
      case jn.UNKNOWN:
      default:
        throw new Error(`Unknown color type: ${e}`);
    }
    if (this._png.channels = i, this._compressionMethod = this.readUint8(), this._compressionMethod !== go.DEFLATE)
      throw new Error(`Unsupported compression method: ${this._compressionMethod}`);
    this._filterMethod = this.readUint8(), this._interlaceMethod = this.readUint8();
  }
  decodeACTL() {
    this._numberOfFrames = this.readUint32(), this._numberOfPlays = this.readUint32(), this._isAnimated = !0;
  }
  decodeFCTL() {
    const t = {
      sequenceNumber: this.readUint32(),
      width: this.readUint32(),
      height: this.readUint32(),
      xOffset: this.readUint32(),
      yOffset: this.readUint32(),
      delayNumber: this.readUint16(),
      delayDenominator: this.readUint16(),
      disposeOp: this.readUint8(),
      blendOp: this.readUint8(),
      data: new Uint8Array(0)
    };
    this._frames.push(t);
  }
  // https://www.w3.org/TR/PNG/#11PLTE
  decodePLTE(t) {
    if (t % 3 !== 0)
      throw new RangeError(`PLTE field length must be a multiple of 3. Got ${t}`);
    const e = t / 3;
    this._hasPalette = !0;
    const i = [];
    this._palette = i;
    for (let o = 0; o < e; o++)
      i.push([this.readUint8(), this.readUint8(), this.readUint8()]);
  }
  // https://www.w3.org/TR/PNG/#11IDAT
  decodeIDAT(t) {
    this._writingDataChunks = !0;
    const e = t, i = this.offset + this.byteOffset;
    if (this._inflator.push(new Uint8Array(this.buffer, i, e)), this._inflator.err)
      throw new Error(`Error while decompressing the data: ${this._inflator.err}`);
    this.skip(t);
  }
  decodeFDAT(t) {
    this._writingDataChunks = !0;
    let e = t, i = this.offset + this.byteOffset;
    if (i += 4, e -= 4, this._inflator.push(new Uint8Array(this.buffer, i, e)), this._inflator.err)
      throw new Error(`Error while decompressing the data: ${this._inflator.err}`);
    this.skip(t);
  }
  // https://www.w3.org/TR/PNG/#11tRNS
  decodetRNS(t) {
    switch (this._colorType) {
      case jn.GREYSCALE:
      case jn.TRUECOLOUR: {
        if (t % 2 !== 0)
          throw new RangeError(`tRNS chunk length must be a multiple of 2. Got ${t}`);
        if (t / 2 > this._png.width * this._png.height)
          throw new Error(`tRNS chunk contains more alpha values than there are pixels (${t / 2} vs ${this._png.width * this._png.height})`);
        this._hasTransparency = !0, this._transparency = new Uint16Array(t / 2);
        for (let e = 0; e < t / 2; e++)
          this._transparency[e] = this.readUint16();
        break;
      }
      case jn.INDEXED_COLOUR: {
        if (t > this._palette.length)
          throw new Error(`tRNS chunk contains more alpha values than there are palette colors (${t} vs ${this._palette.length})`);
        let e = 0;
        for (; e < t; e++) {
          const i = this.readByte();
          this._palette[e].push(i);
        }
        for (; e < this._palette.length; e++)
          this._palette[e].push(255);
        break;
      }
      // Kept for exhaustiveness.
      /* eslint-disable unicorn/no-useless-switch-case */
      case jn.UNKNOWN:
      case jn.GREYSCALE_ALPHA:
      case jn.TRUECOLOUR_ALPHA:
      default:
        throw new Error(`tRNS chunk is not supported for color type ${this._colorType}`);
    }
  }
  // https://www.w3.org/TR/PNG/#11iCCP
  decodeiCCP(t) {
    const e = $u(this), i = this.readUint8();
    if (i !== go.DEFLATE)
      throw new Error(`Unsupported iCCP compression method: ${i}`);
    const o = this.readBytes(t - e.length - 2);
    this._png.iccEmbeddedProfile = {
      name: e,
      profile: mf(o)
    };
  }
  // https://www.w3.org/TR/PNG/#11pHYs
  decodepHYs() {
    const t = this.readUint32(), e = this.readUint32(), i = this.readByte();
    this._png.resolution = { x: t, y: e, unit: i };
  }
  decodeApngImage() {
    this._apng.width = this._png.width, this._apng.height = this._png.height, this._apng.channels = this._png.channels, this._apng.depth = this._png.depth, this._apng.numberOfFrames = this._numberOfFrames, this._apng.numberOfPlays = this._numberOfPlays, this._apng.text = this._png.text, this._apng.resolution = this._png.resolution;
    for (let t = 0; t < this._numberOfFrames; t++) {
      const e = {
        sequenceNumber: this._frames[t].sequenceNumber,
        delayNumber: this._frames[t].delayNumber,
        delayDenominator: this._frames[t].delayDenominator,
        data: this._apng.depth === 8 ? new Uint8Array(this._apng.width * this._apng.height * this._apng.channels) : new Uint16Array(this._apng.width * this._apng.height * this._apng.channels)
      }, i = this._frames.at(t);
      if (i) {
        if (i.data = Ql({
          data: i.data,
          width: i.width,
          height: i.height,
          channels: this._apng.channels,
          depth: this._apng.depth
        }), this._hasPalette && (this._apng.palette = this._palette), this._hasTransparency && (this._apng.transparency = this._transparency), t === 0 || i.xOffset === 0 && i.yOffset === 0 && i.width === this._png.width && i.height === this._png.height)
          e.data = i.data;
        else {
          const o = this._apng.frames.at(t - 1);
          this.disposeFrame(i, o, e), this.addFrameDataToCanvas(e, i);
        }
        this._apng.frames.push(e);
      }
    }
    return this._apng;
  }
  disposeFrame(t, e, i) {
    switch (t.disposeOp) {
      case ps.NONE:
        break;
      case ps.BACKGROUND:
        for (let o = 0; o < this._png.height; o++)
          for (let s = 0; s < this._png.width; s++) {
            const f = (o * t.width + s) * this._png.channels;
            for (let u = 0; u < this._png.channels; u++)
              i.data[f + u] = 0;
          }
        break;
      case ps.PREVIOUS:
        i.data.set(e.data);
        break;
      default:
        throw new Error("Unknown disposeOp");
    }
  }
  addFrameDataToCanvas(t, e) {
    const i = 1 << this._png.depth, o = (s, f) => {
      const u = ((s + e.yOffset) * this._png.width + e.xOffset + f) * this._png.channels, c = (s * e.width + f) * this._png.channels;
      return { index: u, frameIndex: c };
    };
    switch (e.blendOp) {
      case bo.SOURCE:
        for (let s = 0; s < e.height; s++)
          for (let f = 0; f < e.width; f++) {
            const { index: u, frameIndex: c } = o(s, f);
            for (let d = 0; d < this._png.channels; d++)
              t.data[u + d] = e.data[c + d];
          }
        break;
      // https://www.w3.org/TR/png-3/#13Alpha-channel-processing
      case bo.OVER:
        for (let s = 0; s < e.height; s++)
          for (let f = 0; f < e.width; f++) {
            const { index: u, frameIndex: c } = o(s, f);
            for (let d = 0; d < this._png.channels; d++) {
              const m = e.data[c + this._png.channels - 1] / i, A = d % (this._png.channels - 1) === 0 ? 1 : e.data[c + d], P = Math.floor(m * A + (1 - m) * t.data[u + d]);
              t.data[u + d] += P;
            }
          }
        break;
      default:
        throw new Error("Unknown blendOp");
    }
  }
  decodeImage() {
    if (this._inflator.err)
      throw new Error(`Error while decompressing the data: ${this._inflator.err}`);
    const t = this._isAnimated ? (this._frames?.at(0)).data : this._inflator.result;
    if (this._filterMethod !== eu.ADAPTIVE)
      throw new Error(`Filter method ${this._filterMethod} not supported`);
    if (this._interlaceMethod === mo.NO_INTERLACE)
      this._png.data = Ql({
        data: t,
        width: this._png.width,
        height: this._png.height,
        channels: this._png.channels,
        depth: this._png.depth
      });
    else if (this._interlaceMethod === mo.ADAM7)
      this._png.data = Nf({
        data: t,
        width: this._png.width,
        height: this._png.height,
        channels: this._png.channels,
        depth: this._png.depth
      });
    else
      throw new Error(`Interlace method ${this._interlaceMethod} not supported`);
    this._hasPalette && (this._png.palette = this._palette), this._hasTransparency && (this._png.transparency = this._transparency);
  }
  pushDataToFrame() {
    const t = this._inflator.result, e = this._frames.at(-1);
    e ? e.data = t : this._frames.push({
      sequenceNumber: 0,
      width: this._png.width,
      height: this._png.height,
      xOffset: 0,
      yOffset: 0,
      delayNumber: 0,
      delayDenominator: 0,
      disposeOp: ps.NONE,
      blendOp: bo.SOURCE,
      data: t
    }), this._inflator = new Kl(), this._writingDataChunks = !1;
  }
}
function qf(n) {
  if (n !== 1 && n !== 2 && n !== 4 && n !== 8 && n !== 16)
    throw new Error(`invalid bit depth: ${n}`);
  return n;
}
var nu;
(function(n) {
  n[n.UNKNOWN = 0] = "UNKNOWN", n[n.METRE = 1] = "METRE";
})(nu || (nu = {}));
function Uf(n, t) {
  return new Df(n, t).decode();
}
var $t = /* @__PURE__ */ (function() {
  return typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : this;
})();
function vo() {
  $t.console && typeof $t.console.log == "function" && $t.console.log.apply($t.console, arguments);
}
var Le = { log: vo, warn: function(n) {
  $t.console && (typeof $t.console.warn == "function" ? $t.console.warn.apply($t.console, arguments) : vo.call(null, arguments));
}, error: function(n) {
  $t.console && (typeof $t.console.error == "function" ? $t.console.error.apply($t.console, arguments) : vo(n));
} };
function wo(n, t, e) {
  var i = new XMLHttpRequest();
  i.open("GET", n), i.responseType = "blob", i.onload = function() {
    pi(i.response, t, e);
  }, i.onerror = function() {
    Le.error("could not download file");
  }, i.send();
}
function ru(n) {
  var t = new XMLHttpRequest();
  t.open("HEAD", n, !1);
  try {
    t.send();
  } catch {
  }
  return t.status >= 200 && t.status <= 299;
}
function gs(n) {
  try {
    n.dispatchEvent(new MouseEvent("click"));
  } catch {
    var t = document.createEvent("MouseEvents");
    t.initMouseEvent("click", !0, !0, window, 0, 0, 0, 80, 20, !1, !1, !1, !1, 0, null), n.dispatchEvent(t);
  }
}
var pi = $t.saveAs || ((typeof window > "u" ? "undefined" : xe(window)) !== "object" || window !== $t ? function() {
} : typeof HTMLAnchorElement < "u" && "download" in HTMLAnchorElement.prototype ? function(n, t, e) {
  var i = $t.URL || $t.webkitURL, o = document.createElement("a");
  t = t || n.name || "download", o.download = t, o.rel = "noopener", typeof n == "string" ? (o.href = n, o.origin !== location.origin ? ru(o.href) ? wo(n, t, e) : gs(o, o.target = "_blank") : gs(o)) : (o.href = i.createObjectURL(n), setTimeout(function() {
    i.revokeObjectURL(o.href);
  }, 4e4), setTimeout(function() {
    gs(o);
  }, 0));
} : "msSaveOrOpenBlob" in navigator ? function(n, t, e) {
  if (t = t || n.name || "download", typeof n == "string") if (ru(n)) wo(n, t, e);
  else {
    var i = document.createElement("a");
    i.href = n, i.target = "_blank", setTimeout(function() {
      gs(i);
    });
  }
  else navigator.msSaveOrOpenBlob((function(o, s) {
    return s === void 0 ? s = { autoBom: !1 } : xe(s) !== "object" && (Le.warn("Deprecated: Expected third argument to be a object"), s = { autoBom: !s }), s.autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(o.type) ? new Blob(["\uFEFF", o], { type: o.type }) : o;
  })(n, e), t);
} : function(n, t, e, i) {
  if ((i = i || open("", "_blank")) && (i.document.title = i.document.body.innerText = "downloading..."), typeof n == "string") return wo(n, t, e);
  var o = n.type === "application/octet-stream", s = /constructor/i.test($t.HTMLElement) || $t.safari, f = /CriOS\/[\d]+/.test(navigator.userAgent);
  if ((f || o && s) && (typeof FileReader > "u" ? "undefined" : xe(FileReader)) === "object") {
    var u = new FileReader();
    u.onloadend = function() {
      var m = u.result;
      m = f ? m : m.replace(/^data:[^;]*;/, "data:attachment/file;"), i ? i.location.href = m : location = m, i = null;
    }, u.readAsDataURL(n);
  } else {
    var c = $t.URL || $t.webkitURL, d = c.createObjectURL(n);
    i ? i.location = d : location.href = d, i = null, setTimeout(function() {
      c.revokeObjectURL(d);
    }, 4e4);
  }
});
function Ku(n) {
  var t;
  n = n || "", this.ok = !1, n.charAt(0) == "#" && (n = n.substr(1, 6)), n = { aliceblue: "f0f8ff", antiquewhite: "faebd7", aqua: "00ffff", aquamarine: "7fffd4", azure: "f0ffff", beige: "f5f5dc", bisque: "ffe4c4", black: "000000", blanchedalmond: "ffebcd", blue: "0000ff", blueviolet: "8a2be2", brown: "a52a2a", burlywood: "deb887", cadetblue: "5f9ea0", chartreuse: "7fff00", chocolate: "d2691e", coral: "ff7f50", cornflowerblue: "6495ed", cornsilk: "fff8dc", crimson: "dc143c", cyan: "00ffff", darkblue: "00008b", darkcyan: "008b8b", darkgoldenrod: "b8860b", darkgray: "a9a9a9", darkgreen: "006400", darkkhaki: "bdb76b", darkmagenta: "8b008b", darkolivegreen: "556b2f", darkorange: "ff8c00", darkorchid: "9932cc", darkred: "8b0000", darksalmon: "e9967a", darkseagreen: "8fbc8f", darkslateblue: "483d8b", darkslategray: "2f4f4f", darkturquoise: "00ced1", darkviolet: "9400d3", deeppink: "ff1493", deepskyblue: "00bfff", dimgray: "696969", dodgerblue: "1e90ff", feldspar: "d19275", firebrick: "b22222", floralwhite: "fffaf0", forestgreen: "228b22", fuchsia: "ff00ff", gainsboro: "dcdcdc", ghostwhite: "f8f8ff", gold: "ffd700", goldenrod: "daa520", gray: "808080", green: "008000", greenyellow: "adff2f", honeydew: "f0fff0", hotpink: "ff69b4", indianred: "cd5c5c", indigo: "4b0082", ivory: "fffff0", khaki: "f0e68c", lavender: "e6e6fa", lavenderblush: "fff0f5", lawngreen: "7cfc00", lemonchiffon: "fffacd", lightblue: "add8e6", lightcoral: "f08080", lightcyan: "e0ffff", lightgoldenrodyellow: "fafad2", lightgrey: "d3d3d3", lightgreen: "90ee90", lightpink: "ffb6c1", lightsalmon: "ffa07a", lightseagreen: "20b2aa", lightskyblue: "87cefa", lightslateblue: "8470ff", lightslategray: "778899", lightsteelblue: "b0c4de", lightyellow: "ffffe0", lime: "00ff00", limegreen: "32cd32", linen: "faf0e6", magenta: "ff00ff", maroon: "800000", mediumaquamarine: "66cdaa", mediumblue: "0000cd", mediumorchid: "ba55d3", mediumpurple: "9370d8", mediumseagreen: "3cb371", mediumslateblue: "7b68ee", mediumspringgreen: "00fa9a", mediumturquoise: "48d1cc", mediumvioletred: "c71585", midnightblue: "191970", mintcream: "f5fffa", mistyrose: "ffe4e1", moccasin: "ffe4b5", navajowhite: "ffdead", navy: "000080", oldlace: "fdf5e6", olive: "808000", olivedrab: "6b8e23", orange: "ffa500", orangered: "ff4500", orchid: "da70d6", palegoldenrod: "eee8aa", palegreen: "98fb98", paleturquoise: "afeeee", palevioletred: "d87093", papayawhip: "ffefd5", peachpuff: "ffdab9", peru: "cd853f", pink: "ffc0cb", plum: "dda0dd", powderblue: "b0e0e6", purple: "800080", red: "ff0000", rosybrown: "bc8f8f", royalblue: "4169e1", saddlebrown: "8b4513", salmon: "fa8072", sandybrown: "f4a460", seagreen: "2e8b57", seashell: "fff5ee", sienna: "a0522d", silver: "c0c0c0", skyblue: "87ceeb", slateblue: "6a5acd", slategray: "708090", snow: "fffafa", springgreen: "00ff7f", steelblue: "4682b4", tan: "d2b48c", teal: "008080", thistle: "d8bfd8", tomato: "ff6347", turquoise: "40e0d0", violet: "ee82ee", violetred: "d02090", wheat: "f5deb3", white: "ffffff", whitesmoke: "f5f5f5", yellow: "ffff00", yellowgreen: "9acd32" }[n = (n = n.replace(/ /g, "")).toLowerCase()] || n;
  for (var e = [{ re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/, example: ["rgb(123, 234, 45)", "rgb(255,234,245)"], process: function(u) {
    return [parseInt(u[1]), parseInt(u[2]), parseInt(u[3])];
  } }, { re: /^(\w{2})(\w{2})(\w{2})$/, example: ["#00ff00", "336699"], process: function(u) {
    return [parseInt(u[1], 16), parseInt(u[2], 16), parseInt(u[3], 16)];
  } }, { re: /^(\w{1})(\w{1})(\w{1})$/, example: ["#fb0", "f0f"], process: function(u) {
    return [parseInt(u[1] + u[1], 16), parseInt(u[2] + u[2], 16), parseInt(u[3] + u[3], 16)];
  } }], i = 0; i < e.length; i++) {
    var o = e[i].re, s = e[i].process, f = o.exec(n);
    f && (t = s(f), this.r = t[0], this.g = t[1], this.b = t[2], this.ok = !0);
  }
  this.r = this.r < 0 || isNaN(this.r) ? 0 : this.r > 255 ? 255 : this.r, this.g = this.g < 0 || isNaN(this.g) ? 0 : this.g > 255 ? 255 : this.g, this.b = this.b < 0 || isNaN(this.b) ? 0 : this.b > 255 ? 255 : this.b, this.toRGB = function() {
    return "rgb(" + this.r + ", " + this.g + ", " + this.b + ")";
  }, this.toHex = function() {
    var u = this.r.toString(16), c = this.g.toString(16), d = this.b.toString(16);
    return u.length == 1 && (u = "0" + u), c.length == 1 && (c = "0" + c), d.length == 1 && (d = "0" + d), "#" + u + c + d;
  };
}
var ws = $t.atob.bind($t), iu = $t.btoa.bind($t);
function yo(n, t) {
  var e = n[0], i = n[1], o = n[2], s = n[3];
  e = pn(e, i, o, s, t[0], 7, -680876936), s = pn(s, e, i, o, t[1], 12, -389564586), o = pn(o, s, e, i, t[2], 17, 606105819), i = pn(i, o, s, e, t[3], 22, -1044525330), e = pn(e, i, o, s, t[4], 7, -176418897), s = pn(s, e, i, o, t[5], 12, 1200080426), o = pn(o, s, e, i, t[6], 17, -1473231341), i = pn(i, o, s, e, t[7], 22, -45705983), e = pn(e, i, o, s, t[8], 7, 1770035416), s = pn(s, e, i, o, t[9], 12, -1958414417), o = pn(o, s, e, i, t[10], 17, -42063), i = pn(i, o, s, e, t[11], 22, -1990404162), e = pn(e, i, o, s, t[12], 7, 1804603682), s = pn(s, e, i, o, t[13], 12, -40341101), o = pn(o, s, e, i, t[14], 17, -1502002290), e = gn(e, i = pn(i, o, s, e, t[15], 22, 1236535329), o, s, t[1], 5, -165796510), s = gn(s, e, i, o, t[6], 9, -1069501632), o = gn(o, s, e, i, t[11], 14, 643717713), i = gn(i, o, s, e, t[0], 20, -373897302), e = gn(e, i, o, s, t[5], 5, -701558691), s = gn(s, e, i, o, t[10], 9, 38016083), o = gn(o, s, e, i, t[15], 14, -660478335), i = gn(i, o, s, e, t[4], 20, -405537848), e = gn(e, i, o, s, t[9], 5, 568446438), s = gn(s, e, i, o, t[14], 9, -1019803690), o = gn(o, s, e, i, t[3], 14, -187363961), i = gn(i, o, s, e, t[8], 20, 1163531501), e = gn(e, i, o, s, t[13], 5, -1444681467), s = gn(s, e, i, o, t[2], 9, -51403784), o = gn(o, s, e, i, t[7], 14, 1735328473), e = mn(e, i = gn(i, o, s, e, t[12], 20, -1926607734), o, s, t[5], 4, -378558), s = mn(s, e, i, o, t[8], 11, -2022574463), o = mn(o, s, e, i, t[11], 16, 1839030562), i = mn(i, o, s, e, t[14], 23, -35309556), e = mn(e, i, o, s, t[1], 4, -1530992060), s = mn(s, e, i, o, t[4], 11, 1272893353), o = mn(o, s, e, i, t[7], 16, -155497632), i = mn(i, o, s, e, t[10], 23, -1094730640), e = mn(e, i, o, s, t[13], 4, 681279174), s = mn(s, e, i, o, t[0], 11, -358537222), o = mn(o, s, e, i, t[3], 16, -722521979), i = mn(i, o, s, e, t[6], 23, 76029189), e = mn(e, i, o, s, t[9], 4, -640364487), s = mn(s, e, i, o, t[12], 11, -421815835), o = mn(o, s, e, i, t[15], 16, 530742520), e = bn(e, i = mn(i, o, s, e, t[2], 23, -995338651), o, s, t[0], 6, -198630844), s = bn(s, e, i, o, t[7], 10, 1126891415), o = bn(o, s, e, i, t[14], 15, -1416354905), i = bn(i, o, s, e, t[5], 21, -57434055), e = bn(e, i, o, s, t[12], 6, 1700485571), s = bn(s, e, i, o, t[3], 10, -1894986606), o = bn(o, s, e, i, t[10], 15, -1051523), i = bn(i, o, s, e, t[1], 21, -2054922799), e = bn(e, i, o, s, t[8], 6, 1873313359), s = bn(s, e, i, o, t[15], 10, -30611744), o = bn(o, s, e, i, t[6], 15, -1560198380), i = bn(i, o, s, e, t[13], 21, 1309151649), e = bn(e, i, o, s, t[4], 6, -145523070), s = bn(s, e, i, o, t[11], 10, -1120210379), o = bn(o, s, e, i, t[2], 15, 718787259), i = bn(i, o, s, e, t[9], 21, -343485551), n[0] = Gr(e, n[0]), n[1] = Gr(i, n[1]), n[2] = Gr(o, n[2]), n[3] = Gr(s, n[3]);
}
function As(n, t, e, i, o, s) {
  return t = Gr(Gr(t, n), Gr(i, s)), Gr(t << o | t >>> 32 - o, e);
}
function pn(n, t, e, i, o, s, f) {
  return As(t & e | ~t & i, n, t, o, s, f);
}
function gn(n, t, e, i, o, s, f) {
  return As(t & i | e & ~i, n, t, o, s, f);
}
function mn(n, t, e, i, o, s, f) {
  return As(t ^ e ^ i, n, t, o, s, f);
}
function bn(n, t, e, i, o, s, f) {
  return As(e ^ (t | ~i), n, t, o, s, f);
}
function Xu(n) {
  var t, e = n.length, i = [1732584193, -271733879, -1732584194, 271733878];
  for (t = 64; t <= n.length; t += 64) yo(i, zf(n.substring(t - 64, t)));
  n = n.substring(t - 64);
  var o = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (t = 0; t < n.length; t++) o[t >> 2] |= n.charCodeAt(t) << (t % 4 << 3);
  if (o[t >> 2] |= 128 << (t % 4 << 3), t > 55) for (yo(i, o), t = 0; t < 16; t++) o[t] = 0;
  return o[14] = 8 * e, yo(i, o), i;
}
function zf(n) {
  var t, e = [];
  for (t = 0; t < 64; t += 4) e[t >> 2] = n.charCodeAt(t) + (n.charCodeAt(t + 1) << 8) + (n.charCodeAt(t + 2) << 16) + (n.charCodeAt(t + 3) << 24);
  return e;
}
var au = "0123456789abcdef".split("");
function Hf(n) {
  for (var t = "", e = 0; e < 4; e++) t += au[n >> 8 * e + 4 & 15] + au[n >> 8 * e & 15];
  return t;
}
function Wf(n) {
  return String.fromCharCode(255 & n, (65280 & n) >> 8, (16711680 & n) >> 16, (4278190080 & n) >> 24);
}
function Co(n) {
  return Xu(n).map(Wf).join("");
}
var Vf = (function(n) {
  for (var t = 0; t < n.length; t++) n[t] = Hf(n[t]);
  return n.join("");
})(Xu("hello")) != "5d41402abc4b2a76b9719d911017c592";
function Gr(n, t) {
  if (Vf) {
    var e = (65535 & n) + (65535 & t);
    return (n >> 16) + (t >> 16) + (e >> 16) << 16 | 65535 & e;
  }
  return n + t & 4294967295;
}
function Fo(n, t) {
  var e, i, o, s;
  if (n !== e) {
    for (var f = (o = n, s = 1 + (256 / n.length | 0), new Array(s + 1).join(o)), u = [], c = 0; c < 256; c++) u[c] = c;
    var d = 0;
    for (c = 0; c < 256; c++) {
      var m = u[c];
      d = (d + m + f.charCodeAt(c)) % 256, u[c] = u[d], u[d] = m;
    }
    e = n, i = u;
  } else u = i;
  var A = t.length, P = 0, p = 0, B = "";
  for (c = 0; c < A; c++) p = (p + (m = u[P = (P + 1) % 256])) % 256, u[P] = u[p], u[p] = m, f = u[(u[P] + u[p]) % 256], B += String.fromCharCode(t.charCodeAt(c) ^ f);
  return B;
}
var su = { print: 4, modify: 8, copy: 16, "annot-forms": 32 };
function $i(n, t, e, i) {
  this.v = 1, this.r = 2;
  var o = 192;
  n.forEach(function(u) {
    if (su.perm !== void 0) throw new Error("Invalid permission: " + u);
    o += su[u];
  }), this.padding = "(¿N^NuAd\0NVÿú\b..\0¶Ðh>/\f©þdSiz";
  var s = (t + this.padding).substr(0, 32), f = (e + this.padding).substr(0, 32);
  this.O = this.processOwnerPassword(s, f), this.P = -(1 + (255 ^ o)), this.encryptionKey = Co(s + this.O + this.lsbFirstWord(this.P) + this.hexToBytes(i)).substr(0, 5), this.U = Fo(this.encryptionKey, this.padding);
}
function Ki(n) {
  if (/[^\u0000-\u00ff]/.test(n)) throw new Error("Invalid PDF Name Object: " + n + ", Only accept ASCII characters.");
  for (var t = "", e = n.length, i = 0; i < e; i++) {
    var o = n.charCodeAt(i);
    t += o < 33 || o === 35 || o === 37 || o === 40 || o === 41 || o === 47 || o === 60 || o === 62 || o === 91 || o === 93 || o === 123 || o === 125 || o > 126 ? "#" + ("0" + o.toString(16)).slice(-2) : n[i];
  }
  return t;
}
function ou(n) {
  if (xe(n) !== "object") throw new Error("Invalid Context passed to initialize PubSub (jsPDF-module)");
  var t = {};
  this.subscribe = function(e, i, o) {
    if (o = o || !1, typeof e != "string" || typeof i != "function" || typeof o != "boolean") throw new Error("Invalid arguments passed to PubSub.subscribe (jsPDF-module)");
    t.hasOwnProperty(e) || (t[e] = {});
    var s = Math.random().toString(35);
    return t[e][s] = [i, !!o], s;
  }, this.unsubscribe = function(e) {
    for (var i in t) if (t[i][e]) return delete t[i][e], Object.keys(t[i]).length === 0 && delete t[i], !0;
    return !1;
  }, this.publish = function(e) {
    if (t.hasOwnProperty(e)) {
      var i = Array.prototype.slice.call(arguments, 1), o = [];
      for (var s in t[e]) {
        var f = t[e][s];
        try {
          f[0].apply(n, i);
        } catch (u) {
          $t.console && Le.error("jsPDF PubSub Error", u.message, u);
        }
        f[1] && o.push(s);
      }
      o.length && o.forEach(this.unsubscribe);
    }
  }, this.getTopics = function() {
    return t;
  };
}
function Pa(n) {
  if (!(this instanceof Pa)) return new Pa(n);
  var t = "opacity,stroke-opacity".split(",");
  for (var e in n) n.hasOwnProperty(e) && t.indexOf(e) >= 0 && (this[e] = n[e]);
  this.id = "", this.objectNumber = -1;
}
function Zu(n, t) {
  this.gState = n, this.matrix = t, this.id = "", this.objectNumber = -1;
}
function Vr(n, t, e, i, o) {
  if (!(this instanceof Vr)) return new Vr(n, t, e, i, o);
  this.type = n === "axial" ? 2 : 3, this.coords = t, this.colors = e, Zu.call(this, i, o);
}
function gi(n, t, e, i, o) {
  if (!(this instanceof gi)) return new gi(n, t, e, i, o);
  this.boundingBox = n, this.xStep = t, this.yStep = e, this.stream = "", this.cloneIndex = 0, Zu.call(this, i, o);
}
function Mt(n) {
  var t, e = typeof arguments[0] == "string" ? arguments[0] : "p", i = arguments[1], o = arguments[2], s = arguments[3], f = [], u = 1, c = 16, d = "S", m = null;
  xe(n = n || {}) === "object" && (e = n.orientation, i = n.unit || i, o = n.format || o, s = n.compress || n.compressPdf || s, (m = n.encryption || null) !== null && (m.userPassword = m.userPassword || "", m.ownerPassword = m.ownerPassword || "", m.userPermissions = m.userPermissions || []), u = typeof n.userUnit == "number" ? Math.abs(n.userUnit) : 1, n.precision !== void 0 && (t = n.precision), n.floatPrecision !== void 0 && (c = n.floatPrecision), d = n.defaultPathOperation || "S"), f = n.filters || (s === !0 ? ["FlateEncode"] : f), i = i || "mm", e = ("" + (e || "P")).toLowerCase();
  var A = n.putOnlyUsedFonts || !1, P = {}, p = { internal: {}, __private__: {} };
  p.__private__.PubSub = ou;
  var B = "1.3", O = p.__private__.getPdfVersion = function() {
    return B;
  };
  p.__private__.setPdfVersion = function(l) {
    B = l;
  };
  var M = { a0: [2383.94, 3370.39], a1: [1683.78, 2383.94], a2: [1190.55, 1683.78], a3: [841.89, 1190.55], a4: [595.28, 841.89], a5: [419.53, 595.28], a6: [297.64, 419.53], a7: [209.76, 297.64], a8: [147.4, 209.76], a9: [104.88, 147.4], a10: [73.7, 104.88], b0: [2834.65, 4008.19], b1: [2004.09, 2834.65], b2: [1417.32, 2004.09], b3: [1000.63, 1417.32], b4: [708.66, 1000.63], b5: [498.9, 708.66], b6: [354.33, 498.9], b7: [249.45, 354.33], b8: [175.75, 249.45], b9: [124.72, 175.75], b10: [87.87, 124.72], c0: [2599.37, 3676.54], c1: [1836.85, 2599.37], c2: [1298.27, 1836.85], c3: [918.43, 1298.27], c4: [649.13, 918.43], c5: [459.21, 649.13], c6: [323.15, 459.21], c7: [229.61, 323.15], c8: [161.57, 229.61], c9: [113.39, 161.57], c10: [79.37, 113.39], dl: [311.81, 623.62], letter: [612, 792], "government-letter": [576, 756], legal: [612, 1008], "junior-legal": [576, 360], ledger: [1224, 792], tabloid: [792, 1224], "credit-card": [153, 243] };
  p.__private__.getPageFormats = function() {
    return M;
  };
  var S = p.__private__.getPageFormat = function(l) {
    return M[l];
  };
  o = o || "a4";
  var Y = "compat", J = "advanced", D = Y;
  function lt() {
    this.saveGraphicsState(), k(new Gt(ne, 0, 0, -ne, 0, ei() * ne).toString() + " cm"), this.setFontSize(this.getFontSize() / ne), d = "n", D = J;
  }
  function yt() {
    this.restoreGraphicsState(), d = "S", D = Y;
  }
  var mt = p.__private__.combineFontStyleAndFontWeight = function(l, b) {
    if (l == "bold" && b == "normal" || l == "bold" && b == 400 || l == "normal" && b == "italic" || l == "bold" && b == "italic") throw new Error("Invalid Combination of fontweight and fontstyle");
    return b && (l = b == 400 || b === "normal" ? l === "italic" ? "italic" : "normal" : b != 700 && b !== "bold" || l !== "normal" ? (b == 700 ? "bold" : b) + "" + l : "bold"), l;
  };
  p.advancedAPI = function(l) {
    var b = D === Y;
    return b && lt.call(this), typeof l != "function" || (l(this), b && yt.call(this)), this;
  }, p.compatAPI = function(l) {
    var b = D === J;
    return b && yt.call(this), typeof l != "function" || (l(this), b && lt.call(this)), this;
  }, p.isAdvancedAPI = function() {
    return D === J;
  };
  var tt, z = function(l) {
    if (D !== J) throw new Error(l + " is only available in 'advanced' API mode. You need to call advancedAPI() first.");
  }, et = p.roundToPrecision = p.__private__.roundToPrecision = function(l, b) {
    var I = t || b;
    if (isNaN(l) || isNaN(I)) throw new Error("Invalid argument passed to jsPDF.roundToPrecision");
    return l.toFixed(I).replace(/0+$/, "");
  };
  tt = p.hpf = p.__private__.hpf = typeof c == "number" ? function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.hpf");
    return et(l, c);
  } : c === "smart" ? function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.hpf");
    return et(l, l > -1 && l < 1 ? 16 : 5);
  } : function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.hpf");
    return et(l, 16);
  };
  var N = p.f2 = p.__private__.f2 = function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.f2");
    return et(l, 2);
  }, E = p.__private__.f3 = function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.f3");
    return et(l, 3);
  }, q = p.scale = p.__private__.scale = function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.scale");
    return D === Y ? l * ne : D === J ? l : void 0;
  }, U = function(l) {
    return q((function(b) {
      return D === Y ? ei() - b : D === J ? b : void 0;
    })(l));
  };
  p.__private__.setPrecision = p.setPrecision = function(l) {
    typeof parseInt(l, 10) == "number" && (t = parseInt(l, 10));
  };
  var rt, ct = "00000000000000000000000000000000", pt = p.__private__.getFileId = function() {
    return ct;
  }, nt = p.__private__.setFileId = function(l) {
    return ct = l !== void 0 && /^[a-fA-F0-9]{32}$/.test(l) ? l.toUpperCase() : ct.split("").map(function() {
      return "ABCDEF0123456789".charAt(Math.floor(16 * Math.random()));
    }).join(""), m !== null && (an = new $i(m.userPermissions, m.userPassword, m.ownerPassword, ct)), ct;
  };
  p.setFileId = function(l) {
    return nt(l), this;
  }, p.getFileId = function() {
    return pt();
  };
  var ft = p.__private__.convertDateToPDFDate = function(l) {
    var b = l.getTimezoneOffset(), I = b < 0 ? "+" : "-", T = Math.floor(Math.abs(b / 60)), G = Math.abs(b % 60), st = [I, R(T), "'", R(G), "'"].join("");
    return ["D:", l.getFullYear(), R(l.getMonth() + 1), R(l.getDate()), R(l.getHours()), R(l.getMinutes()), R(l.getSeconds()), st].join("");
  }, At = p.__private__.convertPDFDateToDate = function(l) {
    var b = parseInt(l.substr(2, 4), 10), I = parseInt(l.substr(6, 2), 10) - 1, T = parseInt(l.substr(8, 2), 10), G = parseInt(l.substr(10, 2), 10), st = parseInt(l.substr(12, 2), 10), gt = parseInt(l.substr(14, 2), 10);
    return new Date(b, I, T, G, st, gt, 0);
  }, xt = p.__private__.setCreationDate = function(l) {
    var b;
    if (l === void 0 && (l = /* @__PURE__ */ new Date()), l instanceof Date) b = ft(l);
    else {
      if (!/^D:(20[0-2][0-9]|203[0-7]|19[7-9][0-9])(0[0-9]|1[0-2])([0-2][0-9]|3[0-1])(0[0-9]|1[0-9]|2[0-3])(0[0-9]|[1-5][0-9])(0[0-9]|[1-5][0-9])(\+0[0-9]|\+1[0-4]|-0[0-9]|-1[0-1])'(0[0-9]|[1-5][0-9])'?$/.test(l)) throw new Error("Invalid argument passed to jsPDF.setCreationDate");
      b = l;
    }
    return rt = b;
  }, x = p.__private__.getCreationDate = function(l) {
    var b = rt;
    return l === "jsDate" && (b = At(rt)), b;
  };
  p.setCreationDate = function(l) {
    return xt(l), this;
  }, p.getCreationDate = function(l) {
    return x(l);
  };
  var j, R = p.__private__.padd2 = function(l) {
    return ("0" + parseInt(l)).slice(-2);
  }, V = p.__private__.padd2Hex = function(l) {
    return ("00" + (l = l.toString())).substr(l.length);
  }, $ = 0, Q = [], it = [], at = 0, dt = [], _t = [], St = !1, kt = it;
  p.__private__.setCustomOutputDestination = function(l) {
    St = !0, kt = l;
  };
  var zt = function(l) {
    St || (kt = l);
  };
  p.__private__.resetCustomOutputDestination = function() {
    St = !1, kt = it;
  };
  var k = p.__private__.out = function(l) {
    return l = l.toString(), at += l.length + 1, kt.push(l), kt;
  }, Lt = p.__private__.write = function(l) {
    return k(arguments.length === 1 ? l.toString() : Array.prototype.join.call(arguments, " "));
  }, ae = p.__private__.getArrayBuffer = function(l) {
    for (var b = l.length, I = new ArrayBuffer(b), T = new Uint8Array(I); b--; ) T[b] = l.charCodeAt(b);
    return I;
  }, Ht = [["Helvetica", "helvetica", "normal", "WinAnsiEncoding"], ["Helvetica-Bold", "helvetica", "bold", "WinAnsiEncoding"], ["Helvetica-Oblique", "helvetica", "italic", "WinAnsiEncoding"], ["Helvetica-BoldOblique", "helvetica", "bolditalic", "WinAnsiEncoding"], ["Courier", "courier", "normal", "WinAnsiEncoding"], ["Courier-Bold", "courier", "bold", "WinAnsiEncoding"], ["Courier-Oblique", "courier", "italic", "WinAnsiEncoding"], ["Courier-BoldOblique", "courier", "bolditalic", "WinAnsiEncoding"], ["Times-Roman", "times", "normal", "WinAnsiEncoding"], ["Times-Bold", "times", "bold", "WinAnsiEncoding"], ["Times-Italic", "times", "italic", "WinAnsiEncoding"], ["Times-BoldItalic", "times", "bolditalic", "WinAnsiEncoding"], ["ZapfDingbats", "zapfdingbats", "normal", null], ["Symbol", "symbol", "normal", null]];
  p.__private__.getStandardFonts = function() {
    return Ht;
  };
  var vt = n.fontSize || 16;
  p.__private__.setFontSize = p.setFontSize = function(l) {
    return vt = D === J ? l / ne : l, this;
  };
  var Wt, Ct = p.__private__.getFontSize = p.getFontSize = function() {
    return D === Y ? vt : vt * ne;
  }, Ut = n.R2L || !1;
  p.__private__.setR2L = p.setR2L = function(l) {
    return Ut = l, this;
  }, p.__private__.getR2L = p.getR2L = function() {
    return Ut;
  };
  var Dt, be = p.__private__.setZoomMode = function(l) {
    if (/^(?:\d+\.\d*|\d*\.\d+|\d+)%$/.test(l)) Wt = l;
    else if (isNaN(l)) {
      if ([void 0, null, "fullwidth", "fullheight", "fullpage", "original"].indexOf(l) === -1) throw new Error('zoom must be Integer (e.g. 2), a percentage Value (e.g. 300%) or fullwidth, fullheight, fullpage, original. "' + l + '" is not recognized.');
      Wt = l;
    } else Wt = parseInt(l, 10);
  };
  p.__private__.getZoomMode = function() {
    return Wt;
  };
  var ue, Zt = p.__private__.setPageMode = function(l) {
    if ([void 0, null, "UseNone", "UseOutlines", "UseThumbs", "FullScreen"].indexOf(l) == -1) throw new Error('Page mode must be one of UseNone, UseOutlines, UseThumbs, or FullScreen. "' + l + '" is not recognized.');
    Dt = l;
  };
  p.__private__.getPageMode = function() {
    return Dt;
  };
  var ce = p.__private__.setLayoutMode = function(l) {
    if ([void 0, null, "continuous", "single", "twoleft", "tworight", "two"].indexOf(l) == -1) throw new Error('Layout mode must be one of continuous, single, twoleft, tworight. "' + l + '" is not recognized.');
    ue = l;
  };
  p.__private__.getLayoutMode = function() {
    return ue;
  }, p.__private__.setDisplayMode = p.setDisplayMode = function(l, b, I) {
    return be(l), ce(b), Zt(I), this;
  };
  var he = { title: "", subject: "", author: "", keywords: "", creator: "" };
  p.__private__.getDocumentProperty = function(l) {
    if (Object.keys(he).indexOf(l) === -1) throw new Error("Invalid argument passed to jsPDF.getDocumentProperty");
    return he[l];
  }, p.__private__.getDocumentProperties = function() {
    return he;
  }, p.__private__.setDocumentProperties = p.setProperties = p.setDocumentProperties = function(l) {
    for (var b in he) he.hasOwnProperty(b) && l[b] && (he[b] = l[b]);
    return this;
  }, p.__private__.setDocumentProperty = function(l, b) {
    if (Object.keys(he).indexOf(l) === -1) throw new Error("Invalid arguments passed to jsPDF.setDocumentProperty");
    return he[l] = b;
  };
  var Bt, ne, Tt, Ue, ge, se = {}, oe = {}, Ee = [], qt = {}, Se = {}, Yt = {}, Qt = {}, Oe = null, le = 0, Vt = [], ve = new ou(p), $r = n.hotfixes || [], un = {}, dr = {}, Qn = [], Gt = function l(b, I, T, G, st, gt) {
    if (!(this instanceof l)) return new l(b, I, T, G, st, gt);
    isNaN(b) && (b = 1), isNaN(I) && (I = 0), isNaN(T) && (T = 0), isNaN(G) && (G = 1), isNaN(st) && (st = 0), isNaN(gt) && (gt = 0), this._matrix = [b, I, T, G, st, gt];
  };
  Object.defineProperty(Gt.prototype, "sx", { get: function() {
    return this._matrix[0];
  }, set: function(l) {
    this._matrix[0] = l;
  } }), Object.defineProperty(Gt.prototype, "shy", { get: function() {
    return this._matrix[1];
  }, set: function(l) {
    this._matrix[1] = l;
  } }), Object.defineProperty(Gt.prototype, "shx", { get: function() {
    return this._matrix[2];
  }, set: function(l) {
    this._matrix[2] = l;
  } }), Object.defineProperty(Gt.prototype, "sy", { get: function() {
    return this._matrix[3];
  }, set: function(l) {
    this._matrix[3] = l;
  } }), Object.defineProperty(Gt.prototype, "tx", { get: function() {
    return this._matrix[4];
  }, set: function(l) {
    this._matrix[4] = l;
  } }), Object.defineProperty(Gt.prototype, "ty", { get: function() {
    return this._matrix[5];
  }, set: function(l) {
    this._matrix[5] = l;
  } }), Object.defineProperty(Gt.prototype, "a", { get: function() {
    return this._matrix[0];
  }, set: function(l) {
    this._matrix[0] = l;
  } }), Object.defineProperty(Gt.prototype, "b", { get: function() {
    return this._matrix[1];
  }, set: function(l) {
    this._matrix[1] = l;
  } }), Object.defineProperty(Gt.prototype, "c", { get: function() {
    return this._matrix[2];
  }, set: function(l) {
    this._matrix[2] = l;
  } }), Object.defineProperty(Gt.prototype, "d", { get: function() {
    return this._matrix[3];
  }, set: function(l) {
    this._matrix[3] = l;
  } }), Object.defineProperty(Gt.prototype, "e", { get: function() {
    return this._matrix[4];
  }, set: function(l) {
    this._matrix[4] = l;
  } }), Object.defineProperty(Gt.prototype, "f", { get: function() {
    return this._matrix[5];
  }, set: function(l) {
    this._matrix[5] = l;
  } }), Object.defineProperty(Gt.prototype, "rotation", { get: function() {
    return Math.atan2(this.shx, this.sx);
  } }), Object.defineProperty(Gt.prototype, "scaleX", { get: function() {
    return this.decompose().scale.sx;
  } }), Object.defineProperty(Gt.prototype, "scaleY", { get: function() {
    return this.decompose().scale.sy;
  } }), Object.defineProperty(Gt.prototype, "isIdentity", { get: function() {
    return this.sx === 1 && this.shy === 0 && this.shx === 0 && this.sy === 1 && this.tx === 0 && this.ty === 0;
  } }), Gt.prototype.join = function(l) {
    return [this.sx, this.shy, this.shx, this.sy, this.tx, this.ty].map(tt).join(l);
  }, Gt.prototype.multiply = function(l) {
    var b = l.sx * this.sx + l.shy * this.shx, I = l.sx * this.shy + l.shy * this.sy, T = l.shx * this.sx + l.sy * this.shx, G = l.shx * this.shy + l.sy * this.sy, st = l.tx * this.sx + l.ty * this.shx + this.tx, gt = l.tx * this.shy + l.ty * this.sy + this.ty;
    return new Gt(b, I, T, G, st, gt);
  }, Gt.prototype.decompose = function() {
    var l = this.sx, b = this.shy, I = this.shx, T = this.sy, G = this.tx, st = this.ty, gt = Math.sqrt(l * l + b * b), Et = (l /= gt) * I + (b /= gt) * T;
    I -= l * Et, T -= b * Et;
    var Ft = Math.sqrt(I * I + T * T);
    return Et /= Ft, l * (T /= Ft) < b * (I /= Ft) && (l = -l, b = -b, Et = -Et, gt = -gt), { scale: new Gt(gt, 0, 0, Ft, 0, 0), translate: new Gt(1, 0, 0, 1, G, st), rotate: new Gt(l, b, -b, l, 0, 0), skew: new Gt(1, 0, Et, 1, 0, 0) };
  }, Gt.prototype.toString = function(l) {
    return this.join(" ");
  }, Gt.prototype.inversed = function() {
    var l = this.sx, b = this.shy, I = this.shx, T = this.sy, G = this.tx, st = this.ty, gt = 1 / (l * T - b * I), Et = T * gt, Ft = -b * gt, Kt = -I * gt, te = l * gt;
    return new Gt(Et, Ft, Kt, te, -Et * G - Kt * st, -Ft * G - te * st);
  }, Gt.prototype.applyToPoint = function(l) {
    var b = l.x * this.sx + l.y * this.shx + this.tx, I = l.x * this.shy + l.y * this.sy + this.ty;
    return new ti(b, I);
  }, Gt.prototype.applyToRectangle = function(l) {
    var b = this.applyToPoint(l), I = this.applyToPoint(new ti(l.x + l.w, l.y + l.h));
    return new sa(b.x, b.y, I.x - b.x, I.y - b.y);
  }, Gt.prototype.clone = function() {
    var l = this.sx, b = this.shy, I = this.shx, T = this.sy, G = this.tx, st = this.ty;
    return new Gt(l, b, I, T, G, st);
  }, p.Matrix = Gt;
  var pr = p.matrixMult = function(l, b) {
    return b.multiply(l);
  }, gr = new Gt(1, 0, 0, 1, 0, 0);
  p.unitMatrix = p.identityMatrix = gr;
  var Bn = function(l, b) {
    if (!Se[l]) {
      var I = (b instanceof Vr ? "Sh" : "P") + (Object.keys(qt).length + 1).toString(10);
      b.id = I, Se[l] = I, qt[I] = b, ve.publish("addPattern", b);
    }
  };
  p.ShadingPattern = Vr, p.TilingPattern = gi, p.addShadingPattern = function(l, b) {
    return z("addShadingPattern()"), Bn(l, b), this;
  }, p.beginTilingPattern = function(l) {
    z("beginTilingPattern()"), oa(l.boundingBox[0], l.boundingBox[1], l.boundingBox[2] - l.boundingBox[0], l.boundingBox[3] - l.boundingBox[1], l.matrix);
  }, p.endTilingPattern = function(l, b) {
    z("endTilingPattern()"), b.stream = _t[j].join(`
`), Bn(l, b), ve.publish("endTilingPattern", b), Qn.pop().restore();
  };
  var Mn, Re = p.__private__.newObject = function() {
    var l = nn();
    return rn(l, !0), l;
  }, nn = p.__private__.newObjectDeferred = function() {
    return $++, Q[$] = function() {
      return at;
    }, $;
  }, rn = function(l, b) {
    return b = typeof b == "boolean" && b, Q[l] = at, b && k(l + " 0 obj"), l;
  }, Kr = p.__private__.newAdditionalObject = function() {
    var l = { objId: nn(), content: "" };
    return dt.push(l), l;
  }, Ir = nn(), Hn = nn(), tr = p.__private__.decodeColorString = function(l) {
    var b = l.split(" ");
    if (b.length !== 2 || b[1] !== "g" && b[1] !== "G") b.length !== 5 || b[4] !== "k" && b[4] !== "K" || (b = [(1 - b[0]) * (1 - b[3]), (1 - b[1]) * (1 - b[3]), (1 - b[2]) * (1 - b[3]), "r"]);
    else {
      var I = parseFloat(b[0]);
      b = [I, I, I, "r"];
    }
    for (var T = "#", G = 0; G < 3; G++) T += ("0" + Math.floor(255 * parseFloat(b[G])).toString(16)).slice(-2);
    return T;
  }, Wn = p.__private__.encodeColorString = function(l) {
    var b;
    typeof l == "string" && (l = { ch1: l });
    var I = l.ch1, T = l.ch2, G = l.ch3, st = l.ch4, gt = l.pdfColorType === "draw" ? ["G", "RG", "K"] : ["g", "rg", "k"];
    if (typeof I == "string" && I.charAt(0) !== "#") {
      var Et = new Ku(I);
      if (Et.ok) I = Et.toHex();
      else if (!/^\d*\.?\d*$/.test(I)) throw new Error('Invalid color "' + I + '" passed to jsPDF.encodeColorString.');
    }
    if (typeof I == "string" && /^#[0-9A-Fa-f]{3}$/.test(I) && (I = "#" + I[1] + I[1] + I[2] + I[2] + I[3] + I[3]), typeof I == "string" && /^#[0-9A-Fa-f]{6}$/.test(I)) {
      var Ft = parseInt(I.substr(1), 16);
      I = Ft >> 16 & 255, T = Ft >> 8 & 255, G = 255 & Ft;
    }
    if (T === void 0 || st === void 0 && I === T && T === G) b = typeof I == "string" ? I + " " + gt[0] : l.precision === 2 ? N(I / 255) + " " + gt[0] : E(I / 255) + " " + gt[0];
    else if (st === void 0 || xe(st) === "object") {
      if (st && !isNaN(st.a) && st.a === 0) return ["1.", "1.", "1.", gt[1]].join(" ");
      b = typeof I == "string" ? [I, T, G, gt[1]].join(" ") : l.precision === 2 ? [N(I / 255), N(T / 255), N(G / 255), gt[1]].join(" ") : [E(I / 255), E(T / 255), E(G / 255), gt[1]].join(" ");
    } else b = typeof I == "string" ? [I, T, G, st, gt[2]].join(" ") : l.precision === 2 ? [N(I), N(T), N(G), N(st), gt[2]].join(" ") : [E(I), E(T), E(G), E(st), gt[2]].join(" ");
    return b;
  }, Vn = p.__private__.getFilters = function() {
    return f;
  }, Rn = p.__private__.putStream = function(l) {
    var b = (l = l || {}).data || "", I = l.filters || Vn(), T = l.alreadyAppliedFilters || [], G = l.addLength1 || !1, st = b.length, gt = l.objectId, Et = function(Ce) {
      return Ce;
    };
    if (m !== null && gt === void 0) throw new Error("ObjectId must be passed to putStream for file encryption");
    m !== null && (Et = an.encryptor(gt, 0));
    var Ft = {};
    I === !0 && (I = ["FlateEncode"]);
    var Kt = l.additionalKeyValues || [], te = (Ft = Mt.API.processDataByFilters !== void 0 ? Mt.API.processDataByFilters(b, I) : { data: b, reverseChain: [] }).reverseChain + (Array.isArray(T) ? T.join(" ") : T.toString());
    if (Ft.data.length !== 0 && (Kt.push({ key: "Length", value: Ft.data.length }), G === !0 && Kt.push({ key: "Length1", value: st })), te.length != 0) if (te.split("/").length - 1 == 1) Kt.push({ key: "Filter", value: te });
    else {
      Kt.push({ key: "Filter", value: "[" + te + "]" });
      for (var de = 0; de < Kt.length; de += 1) if (Kt[de].key === "DecodeParms") {
        for (var $e = [], Ae = 0; Ae < Ft.reverseChain.split("/").length - 1; Ae += 1) $e.push("null");
        $e.push(Kt[de].value), Kt[de].value = "[" + $e.join(" ") + "]";
      }
    }
    k("<<");
    for (var _e = 0; _e < Kt.length; _e++) k("/" + Kt[_e].key + " " + Kt[_e].value);
    k(">>"), Ft.data.length !== 0 && (k("stream"), k(Et(Ft.data)), k("endstream"));
  }, Xr = p.__private__.putPage = function(l) {
    var b = l.number, I = l.data, T = l.objId, G = l.contentsObjId;
    rn(T, !0), k("<</Type /Page"), k("/Parent " + l.rootDictionaryObjId + " 0 R"), k("/Resources " + l.resourceDictionaryObjId + " 0 R"), k("/MediaBox [" + parseFloat(tt(l.mediaBox.bottomLeftX)) + " " + parseFloat(tt(l.mediaBox.bottomLeftY)) + " " + tt(l.mediaBox.topRightX) + " " + tt(l.mediaBox.topRightY) + "]"), l.cropBox !== null && k("/CropBox [" + tt(l.cropBox.bottomLeftX) + " " + tt(l.cropBox.bottomLeftY) + " " + tt(l.cropBox.topRightX) + " " + tt(l.cropBox.topRightY) + "]"), l.bleedBox !== null && k("/BleedBox [" + tt(l.bleedBox.bottomLeftX) + " " + tt(l.bleedBox.bottomLeftY) + " " + tt(l.bleedBox.topRightX) + " " + tt(l.bleedBox.topRightY) + "]"), l.trimBox !== null && k("/TrimBox [" + tt(l.trimBox.bottomLeftX) + " " + tt(l.trimBox.bottomLeftY) + " " + tt(l.trimBox.topRightX) + " " + tt(l.trimBox.topRightY) + "]"), l.artBox !== null && k("/ArtBox [" + tt(l.artBox.bottomLeftX) + " " + tt(l.artBox.bottomLeftY) + " " + tt(l.artBox.topRightX) + " " + tt(l.artBox.topRightY) + "]"), typeof l.userUnit == "number" && l.userUnit !== 1 && k("/UserUnit " + l.userUnit), ve.publish("putPage", { objId: T, pageContext: Vt[b], pageNumber: b, page: I }), k("/Contents " + G + " 0 R"), k(">>"), k("endobj");
    var st = I.join(`
`);
    return D === J && (st += `
Q`), rn(G, !0), Rn({ data: st, filters: Vn(), objectId: G }), k("endobj"), T;
  }, er = p.__private__.putPages = function() {
    var l, b, I = [];
    for (l = 1; l <= le; l++) Vt[l].objId = nn(), Vt[l].contentsObjId = nn();
    for (l = 1; l <= le; l++) I.push(Xr({ number: l, data: _t[l], objId: Vt[l].objId, contentsObjId: Vt[l].contentsObjId, mediaBox: Vt[l].mediaBox, cropBox: Vt[l].cropBox, bleedBox: Vt[l].bleedBox, trimBox: Vt[l].trimBox, artBox: Vt[l].artBox, userUnit: Vt[l].userUnit, rootDictionaryObjId: Ir, resourceDictionaryObjId: Hn }));
    rn(Ir, !0), k("<</Type /Pages");
    var T = "/Kids [";
    for (b = 0; b < le; b++) T += I[b] + " 0 R ";
    k(T + "]"), k("/Count " + le), k(">>"), k("endobj"), ve.publish("postPutPages");
  }, Zr = function(l) {
    ve.publish("putFont", { font: l, out: k, newObject: Re, putStream: Rn }), l.isAlreadyPutted !== !0 && (l.objectNumber = Re(), k("<<"), k("/Type /Font"), k("/BaseFont /" + Ki(l.postScriptName)), k("/Subtype /Type1"), typeof l.encoding == "string" && k("/Encoding /" + l.encoding), k("/FirstChar 32"), k("/LastChar 255"), k(">>"), k("endobj"));
  }, Ni = function(l) {
    l.objectNumber = Re();
    var b = [];
    b.push({ key: "Type", value: "/XObject" }), b.push({ key: "Subtype", value: "/Form" }), b.push({ key: "BBox", value: "[" + [tt(l.x), tt(l.y), tt(l.x + l.width), tt(l.y + l.height)].join(" ") + "]" }), b.push({ key: "Matrix", value: "[" + l.matrix.toString() + "]" });
    var I = l.pages[1].join(`
`);
    Rn({ data: I, additionalKeyValues: b, objectId: l.objectNumber }), k("endobj");
  }, Li = function(l, b) {
    b || (b = 21);
    var I = Re(), T = (function(gt, Et) {
      var Ft, Kt = [], te = 1 / (Et - 1);
      for (Ft = 0; Ft < 1; Ft += te) Kt.push(Ft);
      if (Kt.push(1), gt[0].offset != 0) {
        var de = { offset: 0, color: gt[0].color };
        gt.unshift(de);
      }
      if (gt[gt.length - 1].offset != 1) {
        var $e = { offset: 1, color: gt[gt.length - 1].color };
        gt.push($e);
      }
      for (var Ae = "", _e = 0, Ce = 0; Ce < Kt.length; Ce++) {
        for (Ft = Kt[Ce]; Ft > gt[_e + 1].offset; ) _e++;
        var Be = gt[_e].offset, Me = (Ft - Be) / (gt[_e + 1].offset - Be), hn = gt[_e].color, xr = gt[_e + 1].color;
        Ae += V(Math.round((1 - Me) * hn[0] + Me * xr[0]).toString(16)) + V(Math.round((1 - Me) * hn[1] + Me * xr[1]).toString(16)) + V(Math.round((1 - Me) * hn[2] + Me * xr[2]).toString(16));
      }
      return Ae.trim();
    })(l.colors, b), G = [];
    G.push({ key: "FunctionType", value: "0" }), G.push({ key: "Domain", value: "[0.0 1.0]" }), G.push({ key: "Size", value: "[" + b + "]" }), G.push({ key: "BitsPerSample", value: "8" }), G.push({ key: "Range", value: "[0.0 1.0 0.0 1.0 0.0 1.0]" }), G.push({ key: "Decode", value: "[0.0 1.0 0.0 1.0 0.0 1.0]" }), Rn({ data: T, additionalKeyValues: G, alreadyAppliedFilters: ["/ASCIIHexDecode"], objectId: I }), k("endobj"), l.objectNumber = Re(), k("<< /ShadingType " + l.type), k("/ColorSpace /DeviceRGB");
    var st = "/Coords [" + tt(parseFloat(l.coords[0])) + " " + tt(parseFloat(l.coords[1])) + " ";
    l.type === 2 ? st += tt(parseFloat(l.coords[2])) + " " + tt(parseFloat(l.coords[3])) : st += tt(parseFloat(l.coords[2])) + " " + tt(parseFloat(l.coords[3])) + " " + tt(parseFloat(l.coords[4])) + " " + tt(parseFloat(l.coords[5])), k(st += "]"), l.matrix && k("/Matrix [" + l.matrix.toString() + "]"), k("/Function " + I + " 0 R"), k("/Extend [true true]"), k(">>"), k("endobj");
  }, Si = function(l, b) {
    var I = nn(), T = Re();
    b.push({ resourcesOid: I, objectOid: T }), l.objectNumber = T;
    var G = [];
    G.push({ key: "Type", value: "/Pattern" }), G.push({ key: "PatternType", value: "1" }), G.push({ key: "PaintType", value: "1" }), G.push({ key: "TilingType", value: "1" }), G.push({ key: "BBox", value: "[" + l.boundingBox.map(tt).join(" ") + "]" }), G.push({ key: "XStep", value: tt(l.xStep) }), G.push({ key: "YStep", value: tt(l.yStep) }), G.push({ key: "Resources", value: I + " 0 R" }), l.matrix && G.push({ key: "Matrix", value: "[" + l.matrix.toString() + "]" }), Rn({ data: l.stream, additionalKeyValues: G, objectId: l.objectNumber }), k("endobj");
  }, Ns = function(l) {
    for (var b in l.objectNumber = Re(), k("<<"), l) switch (b) {
      case "opacity":
        k("/ca " + N(l[b]));
        break;
      case "stroke-opacity":
        k("/CA " + N(l[b]));
    }
    k(">>"), k("endobj");
  }, Zi = function(l) {
    rn(l.resourcesOid, !0), k("<<"), k("/ProcSet [/PDF /Text /ImageB /ImageC /ImageI]"), (function() {
      for (var b in k("/Font <<"), se) se.hasOwnProperty(b) && (A === !1 || A === !0 && P.hasOwnProperty(b)) && k("/" + b + " " + se[b].objectNumber + " 0 R");
      k(">>");
    })(), (function() {
      if (Object.keys(qt).length > 0) {
        for (var b in k("/Shading <<"), qt) qt.hasOwnProperty(b) && qt[b] instanceof Vr && qt[b].objectNumber >= 0 && k("/" + b + " " + qt[b].objectNumber + " 0 R");
        ve.publish("putShadingPatternDict"), k(">>");
      }
    })(), (function(b) {
      if (Object.keys(qt).length > 0) {
        for (var I in k("/Pattern <<"), qt) qt.hasOwnProperty(I) && qt[I] instanceof p.TilingPattern && qt[I].objectNumber >= 0 && qt[I].objectNumber < b && k("/" + I + " " + qt[I].objectNumber + " 0 R");
        ve.publish("putTilingPatternDict"), k(">>");
      }
    })(l.objectOid), (function() {
      if (Object.keys(Yt).length > 0) {
        var b;
        for (b in k("/ExtGState <<"), Yt) Yt.hasOwnProperty(b) && Yt[b].objectNumber >= 0 && k("/" + b + " " + Yt[b].objectNumber + " 0 R");
        ve.publish("putGStateDict"), k(">>");
      }
    })(), (function() {
      for (var b in k("/XObject <<"), un) un.hasOwnProperty(b) && un[b].objectNumber >= 0 && k("/" + b + " " + un[b].objectNumber + " 0 R");
      ve.publish("putXobjectDict"), k(">>");
    })(), k(">>"), k("endobj");
  }, Ca = function(l) {
    oe[l.fontName] = oe[l.fontName] || {}, oe[l.fontName][l.fontStyle] = l.id;
  }, Fa = function(l, b, I, T, G) {
    var st = { id: "F" + (Object.keys(se).length + 1).toString(10), postScriptName: l, fontName: b, fontStyle: I, encoding: T, isStandardFont: G || !1, metadata: {} };
    return ve.publish("addFont", { font: st, instance: this }), se[st.id] = st, Ca(st), st.id;
  }, Tn = p.__private__.pdfEscape = p.pdfEscape = function(l, b) {
    return (function(I, T) {
      var G, st, gt, Et, Ft, Kt, te, de, $e;
      if (gt = (T = T || {}).sourceEncoding || "Unicode", Ft = T.outputEncoding, (T.autoencode || Ft) && se[Bt].metadata && se[Bt].metadata[gt] && se[Bt].metadata[gt].encoding && (Et = se[Bt].metadata[gt].encoding, !Ft && se[Bt].encoding && (Ft = se[Bt].encoding), !Ft && Et.codePages && (Ft = Et.codePages[0]), typeof Ft == "string" && (Ft = Et[Ft]), Ft)) {
        for (te = !1, Kt = [], G = 0, st = I.length; G < st; G++) (de = Ft[I.charCodeAt(G)]) ? Kt.push(String.fromCharCode(de)) : Kt.push(I[G]), Kt[G].charCodeAt(0) >> 8 && (te = !0);
        I = Kt.join("");
      }
      for (G = I.length; te === void 0 && G !== 0; ) I.charCodeAt(G - 1) >> 8 && (te = !0), G--;
      if (!te) return I;
      for (Kt = T.noBOM ? [] : [254, 255], G = 0, st = I.length; G < st; G++) {
        if (($e = (de = I.charCodeAt(G)) >> 8) >> 8) throw new Error("Character at position " + G + " of string '" + I + "' exceeds 16bits. Cannot be encoded into UCS-2 BE");
        Kt.push($e), Kt.push(de - ($e << 8));
      }
      return String.fromCharCode.apply(void 0, Kt);
    })(l, b).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }, Qi = p.__private__.beginPage = function(l) {
    _t[++le] = [], Vt[le] = { objId: 0, contentsObjId: 0, userUnit: Number(u), artBox: null, bleedBox: null, cropBox: null, trimBox: null, mediaBox: { bottomLeftX: 0, bottomLeftY: 0, topRightX: Number(l[0]), topRightY: Number(l[1]) } }, Oa(le), zt(_t[j]);
  }, Ea = function(l, b) {
    var I, T, G;
    switch (e = b || e, typeof l == "string" && (I = S(l.toLowerCase()), Array.isArray(I) && (T = I[0], G = I[1])), Array.isArray(l) && (T = l[0] * ne, G = l[1] * ne), isNaN(T) && (T = o[0], G = o[1]), (T > 14400 || G > 14400) && (Le.warn("A page in a PDF can not be wider or taller than 14400 userUnit. jsPDF limits the width/height to 14400"), T = Math.min(14400, T), G = Math.min(14400, G)), o = [T, G], e.substr(0, 1)) {
      case "l":
        G > T && (o = [G, T]);
        break;
      case "p":
        T > G && (o = [G, T]);
    }
    Qi(o), js(Jt), k(Ei), ia !== 0 && k(ia + " J"), Er !== 0 && k(Er + " j"), ve.publish("addPage", { pageNumber: le });
  }, ta = function(l) {
    l > 0 && l <= le && (_t.splice(l, 1), Vt.splice(l, 1), le--, j > le && (j = le), this.setPage(j));
  }, Oa = function(l) {
    l > 0 && l <= le && (j = l);
  }, ja = p.__private__.getNumberOfPages = p.getNumberOfPages = function() {
    return _t.length - 1;
  }, Ba = function(l, b, I) {
    var T, G = void 0;
    return I = I || {}, l = l !== void 0 ? l : se[Bt].fontName, b = b !== void 0 ? b : se[Bt].fontStyle, T = l.toLowerCase(), oe[T] !== void 0 && oe[T][b] !== void 0 ? G = oe[T][b] : oe[l] !== void 0 && oe[l][b] !== void 0 ? G = oe[l][b] : I.disableWarning === !1 && Le.warn("Unable to look up font label for font '" + l + "', '" + b + "'. Refer to getFontList() for available fonts."), G || I.noFallback || (G = oe.times[b]) == null && (G = oe.times.normal), G;
  }, nr = p.__private__.putInfo = function() {
    var l = Re(), b = function(T) {
      return T;
    };
    for (var I in m !== null && (b = an.encryptor(l, 0)), k("<<"), k("/Producer (" + Tn(b("jsPDF " + Mt.version)) + ")"), he) he.hasOwnProperty(I) && he[I] && k("/" + I.substr(0, 1).toUpperCase() + I.substr(1) + " (" + Tn(b(he[I])) + ")");
    k("/CreationDate (" + Tn(b(rt)) + ")"), k(">>"), k("endobj");
  }, ki = p.__private__.putCatalog = function(l) {
    var b = (l = l || {}).rootDictionaryObjId || Ir;
    switch (Re(), k("<<"), k("/Type /Catalog"), k("/Pages " + b + " 0 R"), Wt || (Wt = "fullwidth"), Wt) {
      case "fullwidth":
        k("/OpenAction [3 0 R /FitH null]");
        break;
      case "fullheight":
        k("/OpenAction [3 0 R /FitV null]");
        break;
      case "fullpage":
        k("/OpenAction [3 0 R /Fit]");
        break;
      case "original":
        k("/OpenAction [3 0 R /XYZ null null 1]");
        break;
      default:
        var I = "" + Wt;
        I.substr(I.length - 1) === "%" && (Wt = parseInt(Wt) / 100), typeof Wt == "number" && k("/OpenAction [3 0 R /XYZ null null " + N(Wt) + "]");
    }
    switch (ue || (ue = "continuous"), ue) {
      case "continuous":
        k("/PageLayout /OneColumn");
        break;
      case "single":
        k("/PageLayout /SinglePage");
        break;
      case "two":
      case "twoleft":
        k("/PageLayout /TwoColumnLeft");
        break;
      case "tworight":
        k("/PageLayout /TwoColumnRight");
    }
    Dt && k("/PageMode /" + Dt), ve.publish("putCatalog"), k(">>"), k("endobj");
  }, Ls = p.__private__.putTrailer = function() {
    k("trailer"), k("<<"), k("/Size " + ($ + 1)), k("/Root " + $ + " 0 R"), k("/Info " + ($ - 1) + " 0 R"), m !== null && k("/Encrypt " + an.oid + " 0 R"), k("/ID [ <" + ct + "> <" + ct + "> ]"), k(">>");
  }, Je = p.__private__.putHeader = function() {
    k("%PDF-" + B), k("%ºß¬à");
  }, Ma = p.__private__.putXRef = function() {
    var l = "0000000000";
    k("xref"), k("0 " + ($ + 1)), k("0000000000 65535 f ");
    for (var b = 1; b <= $; b++) typeof Q[b] == "function" ? k((l + Q[b]()).slice(-10) + " 00000 n ") : Q[b] !== void 0 ? k((l + Q[b]).slice(-10) + " 00000 n ") : k("0000000000 00000 n ");
  }, rr = p.__private__.buildDocument = function() {
    var l;
    $ = 0, at = 0, it = [], Q = [], dt = [], Ir = nn(), Hn = nn(), zt(it), ve.publish("buildDocument"), Je(), er(), (function() {
      ve.publish("putAdditionalObjects");
      for (var I = 0; I < dt.length; I++) {
        var T = dt[I];
        rn(T.objId, !0), k(T.content), k("endobj");
      }
      ve.publish("postPutAdditionalObjects");
    })(), l = [], (function() {
      for (var I in se) se.hasOwnProperty(I) && (A === !1 || A === !0 && P.hasOwnProperty(I)) && Zr(se[I]);
    })(), (function() {
      var I;
      for (I in Yt) Yt.hasOwnProperty(I) && Ns(Yt[I]);
    })(), (function() {
      for (var I in un) un.hasOwnProperty(I) && Ni(un[I]);
    })(), (function(I) {
      var T;
      for (T in qt) qt.hasOwnProperty(T) && (qt[T] instanceof Vr ? Li(qt[T]) : qt[T] instanceof gi && Si(qt[T], I));
    })(l), ve.publish("putResources"), l.forEach(Zi), Zi({ resourcesOid: Hn, objectOid: Number.MAX_SAFE_INTEGER }), ve.publish("postPutResources"), m !== null && (an.oid = Re(), k("<<"), k("/Filter /Standard"), k("/V " + an.v), k("/R " + an.r), k("/U <" + an.toHexString(an.U) + ">"), k("/O <" + an.toHexString(an.O) + ">"), k("/P " + an.P), k(">>"), k("endobj")), nr(), ki();
    var b = at;
    return Ma(), Ls(), k("startxref"), k("" + b), k("%%EOF"), zt(_t[j]), it.join(`
`);
  }, Pi = p.__private__.getBlob = function(l) {
    return new Blob([ae(l)], { type: "application/pdf" });
  }, ea = function(l) {
    for (; l.firstChild; ) l.removeChild(l.firstChild);
  }, kn = function(l) {
    var b, I = l.document, T = I.documentElement, G = I.head, st = I.body;
    return G || (G = I.createElement("head"), T.appendChild(G)), st || (st = I.createElement("body"), T.appendChild(st)), ea(G), ea(st), (b = I.createElement("style")).appendChild(I.createTextNode("html, body { padding: 0; margin: 0; } iframe { width: 100%; height: 100%; border: 0;}")), G.appendChild(b), { document: I, body: st };
  }, Ii = p.output = p.__private__.output = (Mn = function(l, b) {
    switch (typeof (b = b || {}) == "string" ? b = { filename: b } : b.filename = b.filename || "generated.pdf", l) {
      case void 0:
        return rr();
      case "save":
        p.save(b.filename);
        break;
      case "arraybuffer":
        return ae(rr());
      case "blob":
        return Pi(rr());
      case "bloburi":
      case "bloburl":
        if ($t.URL !== void 0 && typeof $t.URL.createObjectURL == "function") return $t.URL && $t.URL.createObjectURL(Pi(rr())) || void 0;
        Le.warn("bloburl is not supported by your system, because URL.createObjectURL is not supported by your browser.");
        break;
      case "datauristring":
      case "dataurlstring":
        var I = "", T = rr();
        try {
          I = iu(T);
        } catch {
          I = iu(unescape(encodeURIComponent(T)));
        }
        return "data:application/pdf;filename=" + encodeURIComponent(b.filename) + ";base64," + I;
      case "pdfobjectnewwindow":
        if (Object.prototype.toString.call($t) === "[object Window]") {
          var G = "https://cdnjs.cloudflare.com/ajax/libs/pdfobject/2.1.1/pdfobject.min.js", st = !b.pdfObjectUrl;
          st || (G = b.pdfObjectUrl);
          var gt = $t.open();
          if (gt !== null) {
            var Et = kn(gt), Ft = Et.document.createElement("script"), Kt = this;
            Ft.src = G, st && (Ft.integrity = "sha512-4ze/a9/4jqu+tX9dfOqJYSvyYd5M6qum/3HpCLr+/Jqf0whc37VUbkpNGHR7/8pSnCFw47T1fmIpwBV7UySh3g==", Ft.crossOrigin = "anonymous"), Ft.onload = function() {
              gt.PDFObject.embed(Kt.output("dataurlstring"), b);
            }, Et.body.appendChild(Ft);
          }
          return gt;
        }
        throw new Error("The option pdfobjectnewwindow just works in a browser-environment.");
      case "pdfjsnewwindow":
        if (Object.prototype.toString.call($t) === "[object Window]") {
          var te = b.pdfJsUrl || "examples/PDF.js/web/viewer.html", de = $t.open();
          if (de !== null) {
            var $e = kn(de), Ae = $e.document.createElement("iframe"), _e = te.indexOf("?") === -1 ? "?" : "&";
            Kt = this, Ae.id = "pdfViewer", Ae.width = "500px", Ae.height = "400px", Ae.src = te + _e + "file=&downloadName=" + encodeURIComponent(b.filename), Ae.onload = function() {
              de.document.title = b.filename, Ae.contentWindow.PDFViewerApplication.open(Kt.output("bloburl"));
            }, $e.body.appendChild(Ae);
          }
          return de;
        }
        throw new Error("The option pdfjsnewwindow just works in a browser-environment.");
      case "dataurlnewwindow":
        if (Object.prototype.toString.call($t) !== "[object Window]") throw new Error("The option dataurlnewwindow just works in a browser-environment.");
        var Ce = $t.open();
        if (Ce !== null) {
          var Be = kn(Ce), Me = Be.document.createElement("iframe");
          Me.src = this.output("datauristring", b), Be.body.appendChild(Me), Ce.document.title = b.filename;
        }
        if (Ce || typeof safari > "u") return Ce;
        break;
      case "datauri":
      case "dataurl":
        return $t.document.location.href = this.output("datauristring", b);
      default:
        return null;
    }
  }, Mn.foo = function() {
    try {
      return Mn.apply(this, arguments);
    } catch (I) {
      var l = I.stack || "";
      ~l.indexOf(" at ") && (l = l.split(" at ")[1]);
      var b = "Error in function " + l.split(`
`)[0].split("<")[0] + ": " + I.message;
      if (!$t.console) throw new Error(b);
      $t.console.error(b, I), $t.alert && alert(b);
    }
  }, Mn.foo.bar = Mn, Mn.foo), mr = function(l) {
    return Array.isArray($r) === !0 && $r.indexOf(l) > -1;
  };
  switch (i) {
    case "pt":
      ne = 1;
      break;
    case "mm":
      ne = 72 / 25.4;
      break;
    case "cm":
      ne = 72 / 2.54;
      break;
    case "in":
      ne = 72;
      break;
    case "px":
      ne = mr("px_scaling") == 1 ? 0.75 : 96 / 72;
      break;
    case "pc":
    case "em":
      ne = 12;
      break;
    case "ex":
      ne = 6;
      break;
    default:
      if (typeof i != "number") throw new Error("Invalid unit: " + i);
      ne = i;
  }
  var an = null;
  xt(), nt();
  var Ra = p.__private__.getPageInfo = p.getPageInfo = function(l) {
    if (isNaN(l) || l % 1 != 0) throw new Error("Invalid argument passed to jsPDF.getPageInfo");
    return { objId: Vt[l].objId, pageNumber: l, pageContext: Vt[l] };
  }, Ss = p.__private__.getPageInfoByObjId = function(l) {
    if (isNaN(l) || l % 1 != 0) throw new Error("Invalid argument passed to jsPDF.getPageInfoByObjId");
    for (var b in Vt) if (Vt[b].objId === l) break;
    return Ra(b);
  }, ks = p.__private__.getCurrentPageInfo = p.getCurrentPageInfo = function() {
    return { objId: Vt[j].objId, pageNumber: j, pageContext: Vt[j] };
  };
  p.addPage = function() {
    return Ea.apply(this, arguments), this;
  }, p.setPage = function() {
    return Oa.apply(this, arguments), zt.call(this, _t[j]), this;
  }, p.insertPage = function(l) {
    return this.addPage(), this.movePage(j, l), this;
  }, p.movePage = function(l, b) {
    var I, T;
    if (l > b) {
      I = _t[l], T = Vt[l];
      for (var G = l; G > b; G--) _t[G] = _t[G - 1], Vt[G] = Vt[G - 1];
      _t[b] = I, Vt[b] = T, this.setPage(b);
    } else if (l < b) {
      I = _t[l], T = Vt[l];
      for (var st = l; st < b; st++) _t[st] = _t[st + 1], Vt[st] = Vt[st + 1];
      _t[b] = I, Vt[b] = T, this.setPage(b);
    }
    return this;
  }, p.deletePage = function() {
    return ta.apply(this, arguments), this;
  }, p.__private__.text = p.text = function(l, b, I, T, G) {
    var st, gt, Et, Ft, Kt, te, de, $e, Ae, _e = (T = T || {}).scope || this;
    if (typeof l == "number" && typeof b == "number" && (typeof I == "string" || Array.isArray(I))) {
      var Ce = I;
      I = b, b = l, l = Ce;
    }
    if (arguments[3] instanceof Gt == 0 ? (Et = arguments[4], Ft = arguments[5], xe(de = arguments[3]) === "object" && de !== null || (typeof Et == "string" && (Ft = Et, Et = null), typeof de == "string" && (Ft = de, de = null), typeof de == "number" && (Et = de, de = null), T = { flags: de, angle: Et, align: Ft })) : (z("The transform parameter of text() with a Matrix value"), Ae = G), isNaN(b) || isNaN(I) || l == null) throw new Error("Invalid arguments passed to jsPDF.text");
    if (l.length === 0) return _e;
    var Be, Me = "", hn = typeof T.lineHeightFactor == "number" ? T.lineHeightFactor : Qr, xr = _e.internal.scaleFactor;
    function la(ke) {
      return ke = ke.split("	").join(Array(T.TabLen || 9).join(" ")), Tn(ke, de);
    }
    function ni(ke) {
      for (var Pe, ze = ke.concat(), Xe = [], Ar = ze.length; Ar--; ) typeof (Pe = ze.shift()) == "string" ? Xe.push(Pe) : Array.isArray(ke) && (Pe.length === 1 || Pe[1] === void 0 && Pe[2] === void 0) ? Xe.push(Pe[0]) : Xe.push([Pe[0], Pe[1], Pe[2]]);
      return Xe;
    }
    function ri(ke, Pe) {
      var ze;
      if (typeof ke == "string") ze = Pe(ke)[0];
      else if (Array.isArray(ke)) {
        for (var Xe, Ar, pa = ke.concat(), Wi = [], Ya = pa.length; Ya--; ) typeof (Xe = pa.shift()) == "string" ? Wi.push(Pe(Xe)[0]) : Array.isArray(Xe) && typeof Xe[0] == "string" && (Ar = Pe(Xe[0], Xe[1], Xe[2]), Wi.push([Ar[0], Ar[1], Ar[2]]));
        ze = Wi;
      }
      return ze;
    }
    var Or = !1, ii = !0;
    if (typeof l == "string") Or = !0;
    else if (Array.isArray(l)) {
      var Mi = l.concat();
      gt = [];
      for (var Ri, cn = Mi.length; cn--; ) (typeof (Ri = Mi.shift()) != "string" || Array.isArray(Ri) && typeof Ri[0] != "string") && (ii = !1);
      Or = ii;
    }
    if (Or === !1) throw new Error('Type of text must be string or Array. "' + l + '" is not recognized.');
    typeof l == "string" && (l = l.match(/[\r?\n]/) ? l.split(/\r\n|\r|\n/g) : [l]);
    var ai = vt / _e.internal.scaleFactor, si = ai * (hn - 1);
    switch (T.baseline) {
      case "bottom":
        I -= si;
        break;
      case "top":
        I += ai - si;
        break;
      case "hanging":
        I += ai - 2 * si;
        break;
      case "middle":
        I += ai / 2 - si;
    }
    if ((te = T.maxWidth || 0) > 0 && (typeof l == "string" ? l = _e.splitTextToSize(l, te) : Object.prototype.toString.call(l) === "[object Array]" && (l = l.reduce(function(ke, Pe) {
      return ke.concat(_e.splitTextToSize(Pe, te));
    }, []))), st = { text: l, x: b, y: I, options: T, mutex: { pdfEscape: Tn, activeFontKey: Bt, fonts: se, activeFontSize: vt } }, ve.publish("preProcessText", st), l = st.text, Et = (T = st.options).angle, Ae instanceof Gt == 0 && Et && typeof Et == "number") {
      Et *= Math.PI / 180, T.rotationDirection === 0 && (Et = -Et), D === J && (Et = -Et);
      var ua = Math.cos(Et), sr = Math.sin(Et);
      Ae = new Gt(ua, sr, -sr, ua, 0, 0);
    } else Et && Et instanceof Gt && (Ae = Et);
    D !== J || Ae || (Ae = gr), (Kt = T.charSpace || Oi) !== void 0 && (Me += tt(q(Kt)) + ` Tc
`, this.setCharSpace(this.getCharSpace() || 0)), ($e = T.horizontalScale) !== void 0 && (Me += tt(100 * $e) + ` Tz
`), T.lang;
    var vn = -1, Va = T.renderingMode !== void 0 ? T.renderingMode : T.stroke, Ti = _e.internal.getCurrentPageInfo().pageContext;
    switch (Va) {
      case 0:
      case !1:
      case "fill":
        vn = 0;
        break;
      case 1:
      case !0:
      case "stroke":
        vn = 1;
        break;
      case 2:
      case "fillThenStroke":
        vn = 2;
        break;
      case 3:
      case "invisible":
        vn = 3;
        break;
      case 4:
      case "fillAndAddForClipping":
        vn = 4;
        break;
      case 5:
      case "strokeAndAddPathForClipping":
        vn = 5;
        break;
      case 6:
      case "fillThenStrokeAndAddToPathForClipping":
        vn = 6;
        break;
      case 7:
      case "addToPathForClipping":
        vn = 7;
    }
    var Ga = Ti.usedRenderingMode !== void 0 ? Ti.usedRenderingMode : -1;
    vn !== -1 ? Me += vn + ` Tr
` : Ga !== -1 && (Me += `0 Tr
`), vn !== -1 && (Ti.usedRenderingMode = vn), Ft = T.align || "left";
    var Dn, oi = vt * hn, ha = _e.internal.pageSize.getWidth(), Di = se[Bt];
    Kt = T.charSpace || Oi, te = T.maxWidth || 0, de = Object.assign({ autoencode: !0, noBOM: !0 }, T.flags);
    var li = [], ca = function(ke) {
      return _e.getStringUnitWidth(ke, { font: Di, charSpace: Kt, fontSize: vt, doKerning: !1 }) * vt / xr;
    };
    if (Object.prototype.toString.call(l) === "[object Array]") {
      var wn;
      gt = ni(l), Ft !== "left" && (Dn = gt.map(ca));
      var An, qi = 0;
      if (Ft === "right") {
        b -= Dn[0], l = [], cn = gt.length;
        for (var jr = 0; jr < cn; jr++) jr === 0 ? (An = br(b), wn = vr(I)) : (An = q(qi - Dn[jr]), wn = -oi), l.push([gt[jr], An, wn]), qi = Dn[jr];
      } else if (Ft === "center") {
        b -= Dn[0] / 2, l = [], cn = gt.length;
        for (var Br = 0; Br < cn; Br++) Br === 0 ? (An = br(b), wn = vr(I)) : (An = q((qi - Dn[Br]) / 2), wn = -oi), l.push([gt[Br], An, wn]), qi = Dn[Br];
      } else if (Ft === "left") {
        l = [], cn = gt.length;
        for (var Ui = 0; Ui < cn; Ui++) l.push(gt[Ui]);
      } else if (Ft === "justify" && Di.encoding === "Identity-H") {
        l = [], cn = gt.length, te = te !== 0 ? te : ha;
        for (var ui = 0, Ke = 0; Ke < cn; Ke++) if (wn = Ke === 0 ? vr(I) : -oi, An = Ke === 0 ? br(b) : ui, Ke < cn - 1) {
          var zs = q((te - Dn[Ke]) / (gt[Ke].split(" ").length - 1)), or = gt[Ke].split(" ");
          l.push([or[0] + " ", An, wn]), ui = 0;
          for (var Gn = 1; Gn < or.length; Gn++) {
            var hi = (ca(or[Gn - 1] + " " + or[Gn]) - ca(or[Gn])) * xr + zs;
            Gn == or.length - 1 ? l.push([or[Gn], hi, 0]) : l.push([or[Gn] + " ", hi, 0]), ui -= hi;
          }
        } else l.push([gt[Ke], An, wn]);
        l.push(["", ui, 0]);
      } else {
        if (Ft !== "justify") throw new Error('Unrecognized alignment option, use "left", "center", "right" or "justify".');
        for (l = [], cn = gt.length, te = te !== 0 ? te : ha, Ke = 0; Ke < cn; Ke++) {
          wn = Ke === 0 ? vr(I) : -oi, An = Ke === 0 ? br(b) : 0;
          var fa = gt[Ke].split(" ").length - 1, da = fa > 0 ? (te - Dn[Ke]) / fa : 0;
          Ke < cn - 1 ? li.push(tt(q(da))) : li.push(0), l.push([gt[Ke], An, wn]);
        }
      }
    }
    (typeof T.R2L == "boolean" ? T.R2L : Ut) === !0 && (l = ri(l, function(ke, Pe, ze) {
      return [ke.split("").reverse().join(""), Pe, ze];
    })), st = { text: l, x: b, y: I, options: T, mutex: { pdfEscape: Tn, activeFontKey: Bt, fonts: se, activeFontSize: vt } }, ve.publish("postProcessText", st), l = st.text, Be = st.mutex.isHex || !1;
    var zi = se[Bt].encoding;
    zi !== "WinAnsiEncoding" && zi !== "StandardEncoding" || (l = ri(l, function(ke, Pe, ze) {
      return [la(ke), Pe, ze];
    })), gt = ni(l), l = [];
    for (var ci, fi, Mr, _r = Array.isArray(gt[0]) ? 1 : 0, Rr = "", Hi = function(ke, Pe, ze) {
      var Xe = "";
      return ze instanceof Gt ? (ze = typeof T.angle == "number" ? pr(ze, new Gt(1, 0, 0, 1, ke, Pe)) : pr(new Gt(1, 0, 0, 1, ke, Pe), ze), D === J && (ze = pr(new Gt(1, 0, 0, -1, 0, 0), ze)), Xe = ze.join(" ") + ` Tm
`) : Xe = tt(ke) + " " + tt(Pe) + ` Td
`, Xe;
    }, fn = 0; fn < gt.length; fn++) {
      switch (Rr = "", _r) {
        case 1:
          Mr = (Be ? "<" : "(") + gt[fn][0] + (Be ? ">" : ")"), ci = parseFloat(gt[fn][1]), fi = parseFloat(gt[fn][2]);
          break;
        case 0:
          Mr = (Be ? "<" : "(") + gt[fn] + (Be ? ">" : ")"), ci = br(b), fi = vr(I);
      }
      li !== void 0 && li[fn] !== void 0 && (Rr = li[fn] + ` Tw
`), fn === 0 ? l.push(Rr + Hi(ci, fi, Ae) + Mr) : _r === 0 ? l.push(Rr + Mr) : _r === 1 && l.push(Rr + Hi(ci, fi, Ae) + Mr);
    }
    l = _r === 0 ? l.join(` Tj
T* `) : l.join(` Tj
`), l += ` Tj
`;
    var lr = `BT
/`;
    return lr += Bt + " " + vt + ` Tf
`, lr += tt(vt * hn) + ` TL
`, lr += ar + `
`, lr += Me, lr += l, k(lr += "ET"), P[Bt] = !0, _e;
  };
  var Ps = p.__private__.clip = p.clip = function(l) {
    return k(l === "evenodd" ? "W*" : "W"), this;
  };
  p.clipEvenOdd = function() {
    return Ps("evenodd");
  }, p.__private__.discardPath = p.discardPath = function() {
    return k("n"), this;
  };
  var ir = p.__private__.isValidStyle = function(l) {
    var b = !1;
    return [void 0, null, "S", "D", "F", "DF", "FD", "f", "f*", "B", "B*", "n"].indexOf(l) !== -1 && (b = !0), b;
  };
  p.__private__.setDefaultPathOperation = p.setDefaultPathOperation = function(l) {
    return ir(l) && (d = l), this;
  };
  var Ta = p.__private__.getStyle = p.getStyle = function(l) {
    var b = d;
    switch (l) {
      case "D":
      case "S":
        b = "S";
        break;
      case "F":
        b = "f";
        break;
      case "FD":
      case "DF":
        b = "B";
        break;
      case "f":
      case "f*":
      case "B":
      case "B*":
        b = l;
    }
    return b;
  }, Ci = p.close = function() {
    return k("h"), this;
  };
  p.stroke = function() {
    return k("S"), this;
  }, p.fill = function(l) {
    return Fi("f", l), this;
  }, p.fillEvenOdd = function(l) {
    return Fi("f*", l), this;
  }, p.fillStroke = function(l) {
    return Fi("B", l), this;
  }, p.fillStrokeEvenOdd = function(l) {
    return Fi("B*", l), this;
  };
  var Fi = function(l, b) {
    xe(b) === "object" ? Cs(b, l) : k(l);
  }, na = function(l) {
    l === null || D === J && l === void 0 || (l = Ta(l), k(l));
  };
  function Is(l, b, I, T, G) {
    var st = new gi(b || this.boundingBox, I || this.xStep, T || this.yStep, this.gState, G || this.matrix);
    st.stream = this.stream;
    var gt = l + "$$" + this.cloneIndex++ + "$$";
    return Bn(gt, st), st;
  }
  var Cs = function(l, b) {
    var I = Se[l.key], T = qt[I];
    if (T instanceof Vr) k("q"), k(Fs(b)), T.gState && p.setGState(T.gState), k(l.matrix.toString() + " cm"), k("/" + I + " sh"), k("Q");
    else if (T instanceof gi) {
      var G = new Gt(1, 0, 0, -1, 0, ei());
      l.matrix && (G = G.multiply(l.matrix || gr), I = Is.call(T, l.key, l.boundingBox, l.xStep, l.yStep, G).id), k("q"), k("/Pattern cs"), k("/" + I + " scn"), T.gState && p.setGState(T.gState), k(b), k("Q");
    }
  }, Fs = function(l) {
    switch (l) {
      case "f":
      case "F":
      case "n":
        return "W n";
      case "f*":
        return "W* n";
      case "B":
      case "S":
        return "W S";
      case "B*":
        return "W* S";
    }
  }, Cr = p.moveTo = function(l, b) {
    return k(tt(q(l)) + " " + tt(U(b)) + " m"), this;
  }, Da = p.lineTo = function(l, b) {
    return k(tt(q(l)) + " " + tt(U(b)) + " l"), this;
  }, Fr = p.curveTo = function(l, b, I, T, G, st) {
    return k([tt(q(l)), tt(U(b)), tt(q(I)), tt(U(T)), tt(q(G)), tt(U(st)), "c"].join(" ")), this;
  };
  p.__private__.line = p.line = function(l, b, I, T, G) {
    if (isNaN(l) || isNaN(b) || isNaN(I) || isNaN(T) || !ir(G)) throw new Error("Invalid arguments passed to jsPDF.line");
    return D === Y ? this.lines([[I - l, T - b]], l, b, [1, 1], G || "S") : this.lines([[I - l, T - b]], l, b, [1, 1]).stroke();
  }, p.__private__.lines = p.lines = function(l, b, I, T, G, st) {
    var gt, Et, Ft, Kt, te, de, $e, Ae, _e, Ce, Be, Me;
    if (typeof l == "number" && (Me = I, I = b, b = l, l = Me), T = T || [1, 1], st = st || !1, isNaN(b) || isNaN(I) || !Array.isArray(l) || !Array.isArray(T) || !ir(G) || typeof st != "boolean") throw new Error("Invalid arguments passed to jsPDF.lines");
    for (Cr(b, I), gt = T[0], Et = T[1], Kt = l.length, Ce = b, Be = I, Ft = 0; Ft < Kt; Ft++) (te = l[Ft]).length === 2 ? (Ce = te[0] * gt + Ce, Be = te[1] * Et + Be, Da(Ce, Be)) : (de = te[0] * gt + Ce, $e = te[1] * Et + Be, Ae = te[2] * gt + Ce, _e = te[3] * Et + Be, Ce = te[4] * gt + Ce, Be = te[5] * Et + Be, Fr(de, $e, Ae, _e, Ce, Be));
    return st && Ci(), na(G), this;
  }, p.path = function(l) {
    for (var b = 0; b < l.length; b++) {
      var I = l[b], T = I.c;
      switch (I.op) {
        case "m":
          Cr(T[0], T[1]);
          break;
        case "l":
          Da(T[0], T[1]);
          break;
        case "c":
          Fr.apply(this, T);
          break;
        case "h":
          Ci();
      }
    }
    return this;
  }, p.__private__.rect = p.rect = function(l, b, I, T, G) {
    if (isNaN(l) || isNaN(b) || isNaN(I) || isNaN(T) || !ir(G)) throw new Error("Invalid arguments passed to jsPDF.rect");
    return D === Y && (T = -T), k([tt(q(l)), tt(U(b)), tt(q(I)), tt(q(T)), "re"].join(" ")), na(G), this;
  }, p.__private__.triangle = p.triangle = function(l, b, I, T, G, st, gt) {
    if (isNaN(l) || isNaN(b) || isNaN(I) || isNaN(T) || isNaN(G) || isNaN(st) || !ir(gt)) throw new Error("Invalid arguments passed to jsPDF.triangle");
    return this.lines([[I - l, T - b], [G - I, st - T], [l - G, b - st]], l, b, [1, 1], gt, !0), this;
  }, p.__private__.roundedRect = p.roundedRect = function(l, b, I, T, G, st, gt) {
    if (isNaN(l) || isNaN(b) || isNaN(I) || isNaN(T) || isNaN(G) || isNaN(st) || !ir(gt)) throw new Error("Invalid arguments passed to jsPDF.roundedRect");
    var Et = 4 / 3 * (Math.SQRT2 - 1);
    return G = Math.min(G, 0.5 * I), st = Math.min(st, 0.5 * T), this.lines([[I - 2 * G, 0], [G * Et, 0, G, st - st * Et, G, st], [0, T - 2 * st], [0, st * Et, -G * Et, st, -G, st], [2 * G - I, 0], [-G * Et, 0, -G, -st * Et, -G, -st], [0, 2 * st - T], [0, -st * Et, G * Et, -st, G, -st]], l + G, b, [1, 1], gt, !0), this;
  }, p.__private__.ellipse = p.ellipse = function(l, b, I, T, G) {
    if (isNaN(l) || isNaN(b) || isNaN(I) || isNaN(T) || !ir(G)) throw new Error("Invalid arguments passed to jsPDF.ellipse");
    var st = 4 / 3 * (Math.SQRT2 - 1) * I, gt = 4 / 3 * (Math.SQRT2 - 1) * T;
    return Cr(l + I, b), Fr(l + I, b - gt, l + st, b - T, l, b - T), Fr(l - st, b - T, l - I, b - gt, l - I, b), Fr(l - I, b + gt, l - st, b + T, l, b + T), Fr(l + st, b + T, l + I, b + gt, l + I, b), na(G), this;
  }, p.__private__.circle = p.circle = function(l, b, I, T) {
    if (isNaN(l) || isNaN(b) || isNaN(I) || !ir(T)) throw new Error("Invalid arguments passed to jsPDF.circle");
    return this.ellipse(l, b, I, I, T);
  }, p.setFont = function(l, b, I) {
    return I && (b = mt(b, I)), Bt = Ba(l, b, { disableWarning: !1 }), this;
  };
  var Es = p.__private__.getFont = p.getFont = function() {
    return se[Ba.apply(p, arguments)];
  };
  p.__private__.getFontList = p.getFontList = function() {
    var l, b, I = {};
    for (l in oe) if (oe.hasOwnProperty(l)) for (b in I[l] = [], oe[l]) oe[l].hasOwnProperty(b) && I[l].push(b);
    return I;
  }, p.addFont = function(l, b, I, T, G) {
    var st = ["StandardEncoding", "MacRomanEncoding", "Identity-H", "WinAnsiEncoding"];
    return arguments[3] && st.indexOf(arguments[3]) !== -1 ? G = arguments[3] : arguments[3] && st.indexOf(arguments[3]) == -1 && (I = mt(I, T)), Fa.call(this, l, b, I, G = G || "Identity-H");
  };
  var Qr, Jt = n.lineWidth || 0.200025, Os = p.__private__.getLineWidth = p.getLineWidth = function() {
    return Jt;
  }, js = p.__private__.setLineWidth = p.setLineWidth = function(l) {
    return Jt = l, k(tt(q(l)) + " w"), this;
  };
  p.__private__.setLineDash = Mt.API.setLineDash = Mt.API.setLineDashPattern = function(l, b) {
    if (l = l || [], b = b || 0, isNaN(b) || !Array.isArray(l)) throw new Error("Invalid arguments passed to jsPDF.setLineDash");
    return l = l.map(function(I) {
      return tt(q(I));
    }).join(" "), b = tt(q(b)), k("[" + l + "] " + b + " d"), this;
  };
  var Bs = p.__private__.getLineHeight = p.getLineHeight = function() {
    return vt * Qr;
  };
  p.__private__.getLineHeight = p.getLineHeight = function() {
    return vt * Qr;
  };
  var Ms = p.__private__.setLineHeightFactor = p.setLineHeightFactor = function(l) {
    return typeof (l = l || 1.15) == "number" && (Qr = l), this;
  }, Rs = p.__private__.getLineHeightFactor = p.getLineHeightFactor = function() {
    return Qr;
  };
  Ms(n.lineHeight);
  var br = p.__private__.getHorizontalCoordinate = function(l) {
    return q(l);
  }, vr = p.__private__.getVerticalCoordinate = function(l) {
    return D === J ? l : Vt[j].mediaBox.topRightY - Vt[j].mediaBox.bottomLeftY - q(l);
  }, Ts = p.__private__.getHorizontalCoordinateString = p.getHorizontalCoordinateString = function(l) {
    return tt(br(l));
  }, Ds = p.__private__.getVerticalCoordinateString = p.getVerticalCoordinateString = function(l) {
    return tt(vr(l));
  }, Ei = n.strokeColor || "0 G";
  p.__private__.getStrokeColor = p.getDrawColor = function() {
    return tr(Ei);
  }, p.__private__.setStrokeColor = p.setDrawColor = function(l, b, I, T) {
    return Ei = Wn({ ch1: l, ch2: b, ch3: I, ch4: T, pdfColorType: "draw", precision: 2 }), k(Ei), this;
  };
  var ra = n.fillColor || "0 g";
  p.__private__.getFillColor = p.getFillColor = function() {
    return tr(ra);
  }, p.__private__.setFillColor = p.setFillColor = function(l, b, I, T) {
    return ra = Wn({ ch1: l, ch2: b, ch3: I, ch4: T, pdfColorType: "fill", precision: 2 }), k(ra), this;
  };
  var ar = n.textColor || "0 g", qs = p.__private__.getTextColor = p.getTextColor = function() {
    return tr(ar);
  };
  p.__private__.setTextColor = p.setTextColor = function(l, b, I, T) {
    return ar = Wn({ ch1: l, ch2: b, ch3: I, ch4: T, pdfColorType: "text", precision: 3 }), this;
  };
  var Oi = n.charSpace, Us = p.__private__.getCharSpace = p.getCharSpace = function() {
    return parseFloat(Oi || 0);
  };
  p.__private__.setCharSpace = p.setCharSpace = function(l) {
    if (isNaN(l)) throw new Error("Invalid argument passed to jsPDF.setCharSpace");
    return Oi = l, this;
  };
  var ia = 0;
  p.CapJoinStyles = { 0: 0, butt: 0, but: 0, miter: 0, 1: 1, round: 1, rounded: 1, circle: 1, 2: 2, projecting: 2, project: 2, square: 2, bevel: 2 }, p.__private__.setLineCap = p.setLineCap = function(l) {
    var b = p.CapJoinStyles[l];
    if (b === void 0) throw new Error("Line cap style of '" + l + "' is not recognized. See or extend .CapJoinStyles property for valid styles");
    return ia = b, k(b + " J"), this;
  };
  var Er = 0;
  p.__private__.setLineJoin = p.setLineJoin = function(l) {
    var b = p.CapJoinStyles[l];
    if (b === void 0) throw new Error("Line join style of '" + l + "' is not recognized. See or extend .CapJoinStyles property for valid styles");
    return Er = b, k(b + " j"), this;
  }, p.__private__.setLineMiterLimit = p.__private__.setMiterLimit = p.setLineMiterLimit = p.setMiterLimit = function(l) {
    if (l = l || 0, isNaN(l)) throw new Error("Invalid argument passed to jsPDF.setLineMiterLimit");
    return k(tt(q(l)) + " M"), this;
  }, p.GState = Pa, p.setGState = function(l) {
    (l = typeof l == "string" ? Yt[Qt[l]] : aa(null, l)).equals(Oe) || (k("/" + l.id + " gs"), Oe = l);
  };
  var aa = function(l, b) {
    if (!l || !Qt[l]) {
      var I = !1;
      for (var T in Yt) if (Yt.hasOwnProperty(T) && Yt[T].equals(b)) {
        I = !0;
        break;
      }
      if (I) b = Yt[T];
      else {
        var G = "GS" + (Object.keys(Yt).length + 1).toString(10);
        Yt[G] = b, b.id = G;
      }
      return l && (Qt[l] = b.id), ve.publish("addGState", b), b;
    }
  };
  p.addGState = function(l, b) {
    return aa(l, b), this;
  }, p.saveGraphicsState = function() {
    return k("q"), Ee.push({ key: Bt, size: vt, color: ar }), this;
  }, p.restoreGraphicsState = function() {
    k("Q");
    var l = Ee.pop();
    return Bt = l.key, vt = l.size, ar = l.color, Oe = null, this;
  }, p.setCurrentTransformationMatrix = function(l) {
    return k(l.toString() + " cm"), this;
  }, p.comment = function(l) {
    return k("#" + l), this;
  };
  var ti = function(l, b) {
    var I = l || 0;
    Object.defineProperty(this, "x", { enumerable: !0, get: function() {
      return I;
    }, set: function(st) {
      isNaN(st) || (I = parseFloat(st));
    } });
    var T = b || 0;
    Object.defineProperty(this, "y", { enumerable: !0, get: function() {
      return T;
    }, set: function(st) {
      isNaN(st) || (T = parseFloat(st));
    } });
    var G = "pt";
    return Object.defineProperty(this, "type", { enumerable: !0, get: function() {
      return G;
    }, set: function(st) {
      G = st.toString();
    } }), this;
  }, sa = function(l, b, I, T) {
    ti.call(this, l, b), this.type = "rect";
    var G = I || 0;
    Object.defineProperty(this, "w", { enumerable: !0, get: function() {
      return G;
    }, set: function(gt) {
      isNaN(gt) || (G = parseFloat(gt));
    } });
    var st = T || 0;
    return Object.defineProperty(this, "h", { enumerable: !0, get: function() {
      return st;
    }, set: function(gt) {
      isNaN(gt) || (st = parseFloat(gt));
    } }), this;
  }, ji = function() {
    this.page = le, this.currentPage = j, this.pages = _t.slice(0), this.pagesContext = Vt.slice(0), this.x = Tt, this.y = Ue, this.matrix = ge, this.width = qa(j), this.height = yr(j), this.outputDestination = kt, this.id = "", this.objectNumber = -1;
  };
  ji.prototype.restore = function() {
    le = this.page, j = this.currentPage, Vt = this.pagesContext, _t = this.pages, Tt = this.x, Ue = this.y, ge = this.matrix, wr(j, this.width), Ua(j, this.height), kt = this.outputDestination;
  };
  var oa = function(l, b, I, T, G) {
    Qn.push(new ji()), le = j = 0, _t = [], Tt = l, Ue = b, ge = G, Qi([I, T]);
  };
  for (var Bi in p.beginFormObject = function(l, b, I, T, G) {
    return oa(l, b, I, T, G), this;
  }, p.endFormObject = function(l) {
    return (function(b) {
      if (dr[b]) Qn.pop().restore();
      else {
        var I = new ji(), T = "Xo" + (Object.keys(un).length + 1).toString(10);
        I.id = T, dr[b] = T, un[T] = I, ve.publish("addFormObject", I), Qn.pop().restore();
      }
    })(l), this;
  }, p.doFormObject = function(l, b) {
    var I = un[dr[l]];
    return k("q"), k(b.toString() + " cm"), k("/" + I.id + " Do"), k("Q"), this;
  }, p.getFormObject = function(l) {
    var b = un[dr[l]];
    return { x: b.x, y: b.y, width: b.width, height: b.height, matrix: b.matrix };
  }, p.save = function(l, b) {
    return l = l || "generated.pdf", (b = b || {}).returnPromise = b.returnPromise || !1, b.returnPromise === !1 ? (pi(Pi(rr()), l), typeof pi.unload == "function" && $t.setTimeout && setTimeout(pi.unload, 911), this) : new Promise(function(I, T) {
      try {
        var G = pi(Pi(rr()), l);
        typeof pi.unload == "function" && $t.setTimeout && setTimeout(pi.unload, 911), I(G);
      } catch (st) {
        T(st.message);
      }
    });
  }, Mt.API) Mt.API.hasOwnProperty(Bi) && (Bi === "events" && Mt.API.events.length ? (function(l, b) {
    var I, T, G;
    for (G = b.length - 1; G !== -1; G--) I = b[G][0], T = b[G][1], l.subscribe.apply(l, [I].concat(typeof T == "function" ? [T] : T));
  })(ve, Mt.API.events) : p[Bi] = Mt.API[Bi]);
  function qa(l) {
    return Vt[l].mediaBox.topRightX - Vt[l].mediaBox.bottomLeftX;
  }
  function wr(l, b) {
    Vt[l].mediaBox.topRightX = b + Vt[l].mediaBox.bottomLeftX;
  }
  function yr(l) {
    return Vt[l].mediaBox.topRightY - Vt[l].mediaBox.bottomLeftY;
  }
  function Ua(l, b) {
    Vt[l].mediaBox.topRightY = b + Vt[l].mediaBox.bottomLeftY;
  }
  var za = p.getPageWidth = function(l) {
    return qa(l = l || j) / ne;
  }, Ha = p.setPageWidth = function(l, b) {
    wr(l, b * ne);
  }, ei = p.getPageHeight = function(l) {
    return yr(l = l || j) / ne;
  }, Wa = p.setPageHeight = function(l, b) {
    Ua(l, b * ne);
  };
  return p.internal = { pdfEscape: Tn, getStyle: Ta, getFont: Es, getFontSize: Ct, getCharSpace: Us, getTextColor: qs, getLineHeight: Bs, getLineHeightFactor: Rs, getLineWidth: Os, write: Lt, getHorizontalCoordinate: br, getVerticalCoordinate: vr, getCoordinateString: Ts, getVerticalCoordinateString: Ds, collections: {}, newObject: Re, newAdditionalObject: Kr, newObjectDeferred: nn, newObjectDeferredBegin: rn, getFilters: Vn, putStream: Rn, events: ve, scaleFactor: ne, pageSize: { getWidth: function() {
    return za(j);
  }, setWidth: function(l) {
    Ha(j, l);
  }, getHeight: function() {
    return ei(j);
  }, setHeight: function(l) {
    Wa(j, l);
  } }, encryptionOptions: m, encryption: an, getEncryptor: function(l) {
    return m !== null ? an.encryptor(l, 0) : function(b) {
      return b;
    };
  }, output: Ii, getNumberOfPages: ja, get pages() {
    return _t;
  }, out: k, f2: N, f3: E, getPageInfo: Ra, getPageInfoByObjId: Ss, getCurrentPageInfo: ks, getPDFVersion: O, Point: ti, Rectangle: sa, Matrix: Gt, hasHotfix: mr }, Object.defineProperty(p.internal.pageSize, "width", { get: function() {
    return za(j);
  }, set: function(l) {
    Ha(j, l);
  }, enumerable: !0, configurable: !0 }), Object.defineProperty(p.internal.pageSize, "height", { get: function() {
    return ei(j);
  }, set: function(l) {
    Wa(j, l);
  }, enumerable: !0, configurable: !0 }), (function(l) {
    for (var b = 0, I = Ht.length; b < I; b++) {
      var T = Fa.call(this, l[b][0], l[b][1], l[b][2], Ht[b][3], !0);
      A === !1 && (P[T] = !0);
      var G = l[b][0].split("-");
      Ca({ id: T, fontName: G[0], fontStyle: G[1] || "" });
    }
    ve.publish("addFonts", { fonts: se, dictionary: oe });
  }).call(p, Ht), Bt = "F1", Ea(o, e), ve.publish("initialized"), p;
}
$i.prototype.lsbFirstWord = function(n) {
  return String.fromCharCode(255 & n, n >> 8 & 255, n >> 16 & 255, n >> 24 & 255);
}, $i.prototype.toHexString = function(n) {
  return n.split("").map(function(t) {
    return ("0" + (255 & t.charCodeAt(0)).toString(16)).slice(-2);
  }).join("");
}, $i.prototype.hexToBytes = function(n) {
  for (var t = [], e = 0; e < n.length; e += 2) t.push(String.fromCharCode(parseInt(n.substr(e, 2), 16)));
  return t.join("");
}, $i.prototype.processOwnerPassword = function(n, t) {
  return Fo(Co(t).substr(0, 5), n);
}, $i.prototype.encryptor = function(n, t) {
  var e = Co(this.encryptionKey + String.fromCharCode(255 & n, n >> 8 & 255, n >> 16 & 255, 255 & t, t >> 8 & 255)).substr(0, 10);
  return function(i) {
    return Fo(e, i);
  };
}, Pa.prototype.equals = function(n) {
  var t, e = "id,objectNumber,equals";
  if (!n || xe(n) !== xe(this)) return !1;
  var i = 0;
  for (t in this) if (!(e.indexOf(t) >= 0)) {
    if (this.hasOwnProperty(t) && !n.hasOwnProperty(t) || this[t] !== n[t]) return !1;
    i++;
  }
  for (t in n) n.hasOwnProperty(t) && e.indexOf(t) < 0 && i--;
  return i === 0;
}, Mt.API = { events: [] }, Mt.version = "4.2.1";
var qe = Mt.API, Bo = 1, Ai = function(n) {
  return n.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}, Yi = function(n) {
  return n.replace(/\\\\/g, "\\").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}, xi = function(n) {
  return n.toString().replace(/#/g, "#23").replace(/[\s\n\r()<>[\]{}\/%]/g, function(t) {
    var e = t.charCodeAt(0).toString(16).toUpperCase();
    return "#" + (e.length === 1 ? "0" + e : e);
  });
}, Xt = function(n) {
  return n.toFixed(2);
}, Wr = function(n) {
  return n.toFixed(5);
};
qe.__acroform__ = {};
var Sn = function(n, t) {
  n.prototype = Object.create(t.prototype), n.prototype.constructor = n;
}, lu = function(n) {
  return n * Bo;
}, hr = function(n) {
  var t = new th(), e = It.internal.getHeight(n) || 0, i = It.internal.getWidth(n) || 0;
  return t.BBox = [0, 0, Number(Xt(i)), Number(Xt(e))], t;
}, Gf = qe.__acroform__.setBit = function(n, t) {
  if (n = n || 0, t = t || 0, isNaN(n) || isNaN(t)) throw new Error("Invalid arguments passed to jsPDF.API.__acroform__.setBit");
  return n | 1 << t;
}, Yf = qe.__acroform__.clearBit = function(n, t) {
  if (n = n || 0, t = t || 0, isNaN(n) || isNaN(t)) throw new Error("Invalid arguments passed to jsPDF.API.__acroform__.clearBit");
  return n & ~(1 << t);
}, Jf = qe.__acroform__.getBit = function(n, t) {
  if (isNaN(n) || isNaN(t)) throw new Error("Invalid arguments passed to jsPDF.API.__acroform__.getBit");
  return n & 1 << t ? 1 : 0;
}, Ve = qe.__acroform__.getBitForPdf = function(n, t) {
  if (isNaN(n) || isNaN(t)) throw new Error("Invalid arguments passed to jsPDF.API.__acroform__.getBitForPdf");
  return Jf(n, t - 1);
}, Ge = qe.__acroform__.setBitForPdf = function(n, t) {
  if (isNaN(n) || isNaN(t)) throw new Error("Invalid arguments passed to jsPDF.API.__acroform__.setBitForPdf");
  return Gf(n, t - 1);
}, Ye = qe.__acroform__.clearBitForPdf = function(n, t) {
  if (isNaN(n) || isNaN(t)) throw new Error("Invalid arguments passed to jsPDF.API.__acroform__.clearBitForPdf");
  return Yf(n, t - 1);
}, $f = qe.__acroform__.calculateCoordinates = function(n, t) {
  var e = t.internal.getHorizontalCoordinate, i = t.internal.getVerticalCoordinate, o = n[0], s = n[1], f = n[2], u = n[3], c = {};
  return c.lowerLeft_X = e(o) || 0, c.lowerLeft_Y = i(s + u) || 0, c.upperRight_X = e(o + f) || 0, c.upperRight_Y = i(s) || 0, [Number(Xt(c.lowerLeft_X)), Number(Xt(c.lowerLeft_Y)), Number(Xt(c.upperRight_X)), Number(Xt(c.upperRight_Y))];
}, Kf = function(n) {
  if (n.appearanceStreamContent) return n.appearanceStreamContent;
  if (n.V || n.DV) {
    var t = [], e = n._V || n.DV, i = Eo(n, e), o = n.scope.internal.getFont(n.fontName, n.fontStyle).id;
    t.push("/Tx BMC"), t.push("q"), t.push("BT"), t.push(n.scope.__private__.encodeColorString(n.color)), t.push("/" + o + " " + Xt(i.fontSize) + " Tf"), t.push("1 0 0 1 0 0 Tm"), t.push(i.text), t.push("ET"), t.push("Q"), t.push("EMC");
    var s = hr(n);
    return s.scope = n.scope, s.stream = t.join(`
`), s;
  }
}, Eo = function(n, t) {
  var e = n.fontSize === 0 ? n.maxFontSize : n.fontSize, i = { text: "", fontSize: "" }, o = (t = (t = t.substr(0, 1) == "(" ? t.substr(1) : t).substr(t.length - 1) == ")" ? t.substr(0, t.length - 1) : t).split(" ");
  o = n.multiline ? o.map(function(N) {
    return N.split(`
`);
  }) : o.map(function(N) {
    return [N];
  });
  var s = e, f = It.internal.getHeight(n) || 0;
  f = f < 0 ? -f : f;
  var u = It.internal.getWidth(n) || 0;
  u = u < 0 ? -u : u;
  var c = function(N, E, q) {
    if (N + 1 < o.length) {
      var U = E + " " + o[N + 1][0];
      return ms(U, n, q).width <= u - 4;
    }
    return !1;
  };
  s++;
  t: for (; s > 0; ) {
    t = "", s--;
    var d, m, A = ms("3", n, s).height, P = n.multiline ? f - s : (f - A) / 2, p = P += 2, B = 0, O = 0, M = 0;
    if (s <= 0) {
      t = `(...) Tj
`, t += "% Width of Text: " + ms(t, n, s = 12).width + ", FieldWidth:" + u + `
`;
      break;
    }
    for (var S = "", Y = 0, J = 0; J < o.length; J++) if (o.hasOwnProperty(J)) {
      var D = !1;
      if (o[J].length !== 1 && M !== o[J].length - 1) {
        if ((A + 2) * (Y + 2) + 2 > f) continue t;
        S += o[J][M], D = !0, O = J, J--;
      } else {
        S = (S += o[J][M] + " ").substr(S.length - 1) == " " ? S.substr(0, S.length - 1) : S;
        var lt = parseInt(J), yt = c(lt, S, s), mt = J >= o.length - 1;
        if (yt && !mt) {
          S += " ", M = 0;
          continue;
        }
        if (yt || mt) {
          if (mt) O = lt;
          else if (n.multiline && (A + 2) * (Y + 2) + 2 > f) continue t;
        } else {
          if (!n.multiline || (A + 2) * (Y + 2) + 2 > f) continue t;
          O = lt;
        }
      }
      for (var tt = "", z = B; z <= O; z++) {
        var et = o[z];
        if (n.multiline) {
          if (z === O) {
            tt += et[M] + " ", M = (M + 1) % et.length;
            continue;
          }
          if (z === B) {
            tt += et[et.length - 1] + " ";
            continue;
          }
        }
        tt += et[0] + " ";
      }
      switch (tt = tt.substr(tt.length - 1) == " " ? tt.substr(0, tt.length - 1) : tt, m = ms(tt, n, s).width, n.textAlign) {
        case "right":
          d = u - m - 2;
          break;
        case "center":
          d = (u - m) / 2;
          break;
        default:
          d = 2;
      }
      t += Xt(d) + " " + Xt(p) + ` Td
`, t += "(" + Ai(tt) + `) Tj
`, t += -Xt(d) + ` 0 Td
`, p = -(s + 2), m = 0, B = D ? O : O + 1, Y++, S = "";
    }
    break;
  }
  return i.text = t, i.fontSize = s, i;
}, ms = function(n, t, e) {
  var i = t.scope.internal.getFont(t.fontName, t.fontStyle), o = t.scope.getStringUnitWidth(n, { font: i, fontSize: parseFloat(e), charSpace: 0 }) * parseFloat(e);
  return { height: t.scope.getStringUnitWidth("3", { font: i, fontSize: parseFloat(e), charSpace: 0 }) * parseFloat(e) * 1.5, width: o };
}, Xf = { fields: [], xForms: [], acroFormDictionaryRoot: null, printedOut: !1, internal: null, isInitialized: !1 }, Zf = function(n, t) {
  var e = { type: "reference", object: n };
  t.internal.getPageInfo(n.page).pageContext.annotations.find(function(i) {
    return i.type === e.type && i.object === e.object;
  }) === void 0 && t.internal.getPageInfo(n.page).pageContext.annotations.push(e);
}, Qf = function(n, t) {
  if (t.scope = n, n.internal !== void 0 && (n.internal.acroformPlugin === void 0 || n.internal.acroformPlugin.isInitialized === !1)) {
    if (Xn.FieldNum = 0, n.internal.acroformPlugin = JSON.parse(JSON.stringify(Xf)), n.internal.acroformPlugin.acroFormDictionaryRoot) throw new Error("Exception while creating AcroformDictionary");
    Bo = n.internal.scaleFactor, n.internal.acroformPlugin.acroFormDictionaryRoot = new eh(), n.internal.acroformPlugin.acroFormDictionaryRoot.scope = n, n.internal.acroformPlugin.acroFormDictionaryRoot._eventID = n.internal.events.subscribe("postPutResources", function() {
      (function(e) {
        e.internal.events.unsubscribe(e.internal.acroformPlugin.acroFormDictionaryRoot._eventID), delete e.internal.acroformPlugin.acroFormDictionaryRoot._eventID, e.internal.acroformPlugin.printedOut = !0;
      })(n);
    }), n.internal.events.subscribe("buildDocument", function() {
      (function(e) {
        e.internal.acroformPlugin.acroFormDictionaryRoot.objId = void 0;
        var i = e.internal.acroformPlugin.acroFormDictionaryRoot.Fields;
        for (var o in i) if (i.hasOwnProperty(o)) {
          var s = i[o];
          s.objId = void 0, s.hasAnnotation && Zf(s, e);
        }
      })(n);
    }), n.internal.events.subscribe("putCatalog", function() {
      (function(e) {
        if (e.internal.acroformPlugin.acroFormDictionaryRoot === void 0) throw new Error("putCatalogCallback: Root missing.");
        e.internal.write("/AcroForm " + e.internal.acroformPlugin.acroFormDictionaryRoot.objId + " 0 R");
      })(n);
    }), n.internal.events.subscribe("postPutPages", function(e) {
      (function(i, o) {
        var s = !i;
        for (var f in i || (o.internal.newObjectDeferredBegin(o.internal.acroformPlugin.acroFormDictionaryRoot.objId, !0), o.internal.acroformPlugin.acroFormDictionaryRoot.putStream()), i = i || o.internal.acroformPlugin.acroFormDictionaryRoot.Kids) if (i.hasOwnProperty(f)) {
          var u = i[f], c = [], d = u.Rect;
          if (u.Rect && (u.Rect = $f(u.Rect, o)), o.internal.newObjectDeferredBegin(u.objId, !0), u.DA = It.createDefaultAppearanceStream(u), xe(u) === "object" && typeof u.getKeyValueListForStream == "function" && (c = u.getKeyValueListForStream()), u.Rect = d, u.hasAppearanceStream && !u.appearanceStreamContent) {
            var m = Kf(u);
            c.push({ key: "AP", value: "<</N " + m + ">>" }), o.internal.acroformPlugin.xForms.push(m);
          }
          if (u.appearanceStreamContent) {
            var A = "";
            for (var P in u.appearanceStreamContent) if (u.appearanceStreamContent.hasOwnProperty(P)) {
              var p = u.appearanceStreamContent[P];
              if (A += "/" + P + " ", A += "<<", Object.keys(p).length >= 1 || Array.isArray(p)) {
                for (var f in p) if (p.hasOwnProperty(f)) {
                  var B = p[f];
                  typeof B == "function" && (B = B.call(o, u)), A += "/" + f + " " + B + " ", o.internal.acroformPlugin.xForms.indexOf(B) >= 0 || o.internal.acroformPlugin.xForms.push(B);
                }
              } else typeof (B = p) == "function" && (B = B.call(o, u)), A += "/" + f + " " + B, o.internal.acroformPlugin.xForms.indexOf(B) >= 0 || o.internal.acroformPlugin.xForms.push(B);
              A += ">>";
            }
            c.push({ key: "AP", value: `<<
` + A + ">>" });
          }
          o.internal.putStream({ additionalKeyValues: c, objectId: u.objId }), o.internal.out("endobj");
        }
        s && (function(O, M) {
          for (var S in O) if (O.hasOwnProperty(S)) {
            var Y = S, J = O[S];
            M.internal.newObjectDeferredBegin(J.objId, !0), xe(J) === "object" && typeof J.putStream == "function" && J.putStream(), delete O[Y];
          }
        })(o.internal.acroformPlugin.xForms, o);
      })(e, n);
    }), n.internal.acroformPlugin.isInitialized = !0;
  }
}, Qu = qe.__acroform__.arrayToPdfArray = function(n, t, e) {
  var i = function(f) {
    return f;
  };
  if (Array.isArray(n)) {
    for (var o = "[", s = 0; s < n.length; s++) switch (s !== 0 && (o += " "), xe(n[s])) {
      case "boolean":
      case "number":
      case "object":
        o += n[s].toString();
        break;
      case "string":
        n[s].substr(0, 1) === "/" ? o += "/" + xi(n[s].substr(1)) : (t !== void 0 && e && (i = e.internal.getEncryptor(t)), o += "(" + Ai(i(n[s].toString())) + ")");
    }
    return o + "]";
  }
  throw new Error("Invalid argument passed to jsPDF.__acroform__.arrayToPdfArray");
}, xo = function(n, t, e) {
  var i = function(o) {
    return o;
  };
  return t !== void 0 && e && (i = e.internal.getEncryptor(t)), (n = n || "").toString(), "(" + Ai(i(n)) + ")";
}, cr = function() {
  this._objId = void 0, this._scope = void 0, Object.defineProperty(this, "objId", { get: function() {
    if (this._objId === void 0) {
      if (this.scope === void 0) return;
      this._objId = this.scope.internal.newObjectDeferred();
    }
    return this._objId;
  }, set: function(n) {
    this._objId = n;
  } }), Object.defineProperty(this, "scope", { value: this._scope, writable: !0 });
};
cr.prototype.toString = function() {
  return this.objId + " 0 R";
}, cr.prototype.putStream = function() {
  var n = this.getKeyValueListForStream();
  this.scope.internal.putStream({ data: this.stream, additionalKeyValues: n, objectId: this.objId }), this.scope.internal.out("endobj");
}, cr.prototype.getKeyValueListForStream = function() {
  var n = [], t = Object.getOwnPropertyNames(this).filter(function(s) {
    return s != "content" && s != "appearanceStreamContent" && s != "scope" && s != "objId" && s.substring(0, 1) != "_";
  });
  for (var e in t) if (Object.getOwnPropertyDescriptor(this, t[e]).configurable === !1) {
    var i = t[e], o = this[i];
    o && (Array.isArray(o) ? n.push({ key: i, value: Qu(o, this.objId, this.scope) }) : o instanceof cr ? (o.scope = this.scope, n.push({ key: i, value: o.objId + " 0 R" })) : typeof o != "function" && n.push({ key: i, value: o }));
  }
  return n;
};
var th = function() {
  cr.call(this), Object.defineProperty(this, "Type", { value: "/XObject", configurable: !1, writable: !0 }), Object.defineProperty(this, "Subtype", { value: "/Form", configurable: !1, writable: !0 }), Object.defineProperty(this, "FormType", { value: 1, configurable: !1, writable: !0 });
  var n, t = [];
  Object.defineProperty(this, "BBox", { configurable: !1, get: function() {
    return t;
  }, set: function(e) {
    t = e;
  } }), Object.defineProperty(this, "Resources", { value: "2 0 R", configurable: !1, writable: !0 }), Object.defineProperty(this, "stream", { enumerable: !1, configurable: !0, set: function(e) {
    n = e.trim();
  }, get: function() {
    return n || null;
  } });
};
Sn(th, cr);
var eh = function() {
  cr.call(this);
  var n, t = [];
  Object.defineProperty(this, "Kids", { enumerable: !1, configurable: !0, get: function() {
    return t.length > 0 ? t : void 0;
  } }), Object.defineProperty(this, "Fields", { enumerable: !1, configurable: !1, get: function() {
    return t;
  } }), Object.defineProperty(this, "DA", { enumerable: !1, configurable: !1, get: function() {
    if (n) {
      var e = function(i) {
        return i;
      };
      return this.scope && (e = this.scope.internal.getEncryptor(this.objId)), "(" + Ai(e(n)) + ")";
    }
  }, set: function(e) {
    n = e;
  } });
};
Sn(eh, cr);
var Xn = function n() {
  cr.call(this);
  var t = 4;
  Object.defineProperty(this, "F", { enumerable: !1, configurable: !1, get: function() {
    return t;
  }, set: function(S) {
    if (isNaN(S)) throw new Error('Invalid value "' + S + '" for attribute F supplied.');
    t = S;
  } }), Object.defineProperty(this, "showWhenPrinted", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(t, 3);
  }, set: function(S) {
    S ? this.F = Ge(t, 3) : this.F = Ye(t, 3);
  } });
  var e = 0;
  Object.defineProperty(this, "Ff", { enumerable: !1, configurable: !1, get: function() {
    return e;
  }, set: function(S) {
    if (isNaN(S)) throw new Error('Invalid value "' + S + '" for attribute Ff supplied.');
    e = S;
  } });
  var i = [];
  Object.defineProperty(this, "Rect", { enumerable: !1, configurable: !1, get: function() {
    if (i.length !== 0) return i;
  }, set: function(S) {
    i = S !== void 0 ? S : [];
  } }), Object.defineProperty(this, "x", { enumerable: !0, configurable: !0, get: function() {
    return !i || isNaN(i[0]) ? 0 : i[0];
  }, set: function(S) {
    i[0] = S;
  } }), Object.defineProperty(this, "y", { enumerable: !0, configurable: !0, get: function() {
    return !i || isNaN(i[1]) ? 0 : i[1];
  }, set: function(S) {
    i[1] = S;
  } }), Object.defineProperty(this, "width", { enumerable: !0, configurable: !0, get: function() {
    return !i || isNaN(i[2]) ? 0 : i[2];
  }, set: function(S) {
    i[2] = S;
  } }), Object.defineProperty(this, "height", { enumerable: !0, configurable: !0, get: function() {
    return !i || isNaN(i[3]) ? 0 : i[3];
  }, set: function(S) {
    i[3] = S;
  } });
  var o = "";
  Object.defineProperty(this, "FT", { enumerable: !0, configurable: !1, get: function() {
    return o;
  }, set: function(S) {
    switch (S) {
      case "/Btn":
      case "/Tx":
      case "/Ch":
      case "/Sig":
        o = S;
        break;
      default:
        throw new Error('Invalid value "' + S + '" for attribute FT supplied.');
    }
  } });
  var s = null;
  Object.defineProperty(this, "T", { enumerable: !0, configurable: !1, get: function() {
    if (!s || s.length < 1) {
      if (this instanceof xs) return;
      s = "FieldObject" + n.FieldNum++;
    }
    var S = function(Y) {
      return Y;
    };
    return this.scope && (S = this.scope.internal.getEncryptor(this.objId)), "(" + Ai(S(s)) + ")";
  }, set: function(S) {
    s = S.toString();
  } }), Object.defineProperty(this, "fieldName", { configurable: !0, enumerable: !0, get: function() {
    return s;
  }, set: function(S) {
    s = S;
  } });
  var f = "helvetica";
  Object.defineProperty(this, "fontName", { enumerable: !0, configurable: !0, get: function() {
    return f;
  }, set: function(S) {
    f = S;
  } });
  var u = "normal";
  Object.defineProperty(this, "fontStyle", { enumerable: !0, configurable: !0, get: function() {
    return u;
  }, set: function(S) {
    u = S;
  } });
  var c = 0;
  Object.defineProperty(this, "fontSize", { enumerable: !0, configurable: !0, get: function() {
    return c;
  }, set: function(S) {
    c = S;
  } });
  var d = void 0;
  Object.defineProperty(this, "maxFontSize", { enumerable: !0, configurable: !0, get: function() {
    return d === void 0 ? 50 / Bo : d;
  }, set: function(S) {
    d = S;
  } });
  var m = "black";
  Object.defineProperty(this, "color", { enumerable: !0, configurable: !0, get: function() {
    return m;
  }, set: function(S) {
    m = S;
  } });
  var A = "/F1 0 Tf 0 g";
  Object.defineProperty(this, "DA", { enumerable: !0, configurable: !1, get: function() {
    if (!(!A || this instanceof xs || this instanceof Yr)) return xo(A, this.objId, this.scope);
  }, set: function(S) {
    S = S.toString(), A = S;
  } });
  var P = null;
  Object.defineProperty(this, "DV", { enumerable: !1, configurable: !1, get: function() {
    if (P) return this instanceof en == 0 ? xo(P, this.objId, this.scope) : P;
  }, set: function(S) {
    S = S.toString(), P = this instanceof en == 0 ? S.substr(0, 1) === "(" ? Yi(S.substr(1, S.length - 2)) : Yi(S) : S;
  } }), Object.defineProperty(this, "defaultValue", { enumerable: !0, configurable: !0, get: function() {
    return this instanceof en == 1 ? Yi(P.substr(1, P.length - 1)) : P;
  }, set: function(S) {
    S = S.toString(), P = this instanceof en == 1 ? "/" + xi(S) : S;
  } });
  var p = null;
  Object.defineProperty(this, "_V", { enumerable: !1, configurable: !1, get: function() {
    if (p) return p;
  }, set: function(S) {
    this.V = S;
  } }), Object.defineProperty(this, "V", { enumerable: !1, configurable: !1, get: function() {
    if (p) return this instanceof en == 0 ? xo(p, this.objId, this.scope) : p;
  }, set: function(S) {
    S = S.toString(), p = this instanceof en == 0 ? S.substr(0, 1) === "(" ? Yi(S.substr(1, S.length - 2)) : Yi(S) : S;
  } }), Object.defineProperty(this, "value", { enumerable: !0, configurable: !0, get: function() {
    return this instanceof en == 1 ? Yi(p.substr(1, p.length - 1)) : p;
  }, set: function(S) {
    S = S.toString(), p = this instanceof en == 1 ? "/" + xi(S) : S;
  } }), Object.defineProperty(this, "hasAnnotation", { enumerable: !0, configurable: !0, get: function() {
    return this.Rect;
  } }), Object.defineProperty(this, "Type", { enumerable: !0, configurable: !1, get: function() {
    return this.hasAnnotation ? "/Annot" : null;
  } }), Object.defineProperty(this, "Subtype", { enumerable: !0, configurable: !1, get: function() {
    return this.hasAnnotation ? "/Widget" : null;
  } });
  var B, O = !1;
  Object.defineProperty(this, "hasAppearanceStream", { enumerable: !0, configurable: !0, get: function() {
    return O;
  }, set: function(S) {
    S = !!S, O = S;
  } }), Object.defineProperty(this, "page", { enumerable: !0, configurable: !0, get: function() {
    if (B) return B;
  }, set: function(S) {
    B = S;
  } }), Object.defineProperty(this, "readOnly", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 1);
  }, set: function(S) {
    S ? this.Ff = Ge(this.Ff, 1) : this.Ff = Ye(this.Ff, 1);
  } }), Object.defineProperty(this, "required", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 2);
  }, set: function(S) {
    S ? this.Ff = Ge(this.Ff, 2) : this.Ff = Ye(this.Ff, 2);
  } }), Object.defineProperty(this, "noExport", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 3);
  }, set: function(S) {
    S ? this.Ff = Ge(this.Ff, 3) : this.Ff = Ye(this.Ff, 3);
  } });
  var M = null;
  Object.defineProperty(this, "Q", { enumerable: !0, configurable: !1, get: function() {
    if (M !== null) return M;
  }, set: function(S) {
    if ([0, 1, 2].indexOf(S) === -1) throw new Error('Invalid value "' + S + '" for attribute Q supplied.');
    M = S;
  } }), Object.defineProperty(this, "textAlign", { get: function() {
    var S;
    switch (M) {
      case 0:
      default:
        S = "left";
        break;
      case 1:
        S = "center";
        break;
      case 2:
        S = "right";
    }
    return S;
  }, configurable: !0, enumerable: !0, set: function(S) {
    switch (S) {
      case "right":
      case 2:
        M = 2;
        break;
      case "center":
      case 1:
        M = 1;
        break;
      default:
        M = 0;
    }
  } });
};
Sn(Xn, cr);
var mi = function() {
  Xn.call(this), this.FT = "/Ch", this.V = "()", this.fontName = "zapfdingbats";
  var n = 0;
  Object.defineProperty(this, "TI", { enumerable: !0, configurable: !1, get: function() {
    return n;
  }, set: function(e) {
    n = e;
  } }), Object.defineProperty(this, "topIndex", { enumerable: !0, configurable: !0, get: function() {
    return n;
  }, set: function(e) {
    n = e;
  } });
  var t = [];
  Object.defineProperty(this, "Opt", { enumerable: !0, configurable: !1, get: function() {
    return Qu(t, this.objId, this.scope);
  }, set: function(e) {
    var i, o;
    o = [], typeof (i = e) == "string" && (o = (function(s, f, u) {
      u || (u = 1);
      for (var c, d = []; c = f.exec(s); ) d.push(c[u]);
      return d;
    })(i, /\((.*?)\)/g)), t = o;
  } }), this.getOptions = function() {
    return t;
  }, this.setOptions = function(e) {
    t = e, this.sort && t.sort();
  }, this.addOption = function(e) {
    e = (e = e || "").toString(), t.push(e), this.sort && t.sort();
  }, this.removeOption = function(e, i) {
    for (i = i || !1, e = (e = e || "").toString(); t.indexOf(e) !== -1 && (t.splice(t.indexOf(e), 1), i !== !1); ) ;
  }, Object.defineProperty(this, "combo", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 18);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 18) : this.Ff = Ye(this.Ff, 18);
  } }), Object.defineProperty(this, "edit", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 19);
  }, set: function(e) {
    this.combo === !0 && (e ? this.Ff = Ge(this.Ff, 19) : this.Ff = Ye(this.Ff, 19));
  } }), Object.defineProperty(this, "sort", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 20);
  }, set: function(e) {
    e ? (this.Ff = Ge(this.Ff, 20), t.sort()) : this.Ff = Ye(this.Ff, 20);
  } }), Object.defineProperty(this, "multiSelect", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 22);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 22) : this.Ff = Ye(this.Ff, 22);
  } }), Object.defineProperty(this, "doNotSpellCheck", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 23);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 23) : this.Ff = Ye(this.Ff, 23);
  } }), Object.defineProperty(this, "commitOnSelChange", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 27);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 27) : this.Ff = Ye(this.Ff, 27);
  } }), this.hasAppearanceStream = !1;
};
Sn(mi, Xn);
var bi = function() {
  mi.call(this), this.fontName = "helvetica", this.combo = !1;
};
Sn(bi, mi);
var vi = function() {
  bi.call(this), this.combo = !0;
};
Sn(vi, bi);
var _a = function() {
  vi.call(this), this.edit = !0;
};
Sn(_a, vi);
var en = function() {
  Xn.call(this), this.FT = "/Btn", Object.defineProperty(this, "noToggleToOff", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 15);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 15) : this.Ff = Ye(this.Ff, 15);
  } }), Object.defineProperty(this, "radio", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 16);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 16) : this.Ff = Ye(this.Ff, 16);
  } }), Object.defineProperty(this, "pushButton", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 17);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 17) : this.Ff = Ye(this.Ff, 17);
  } }), Object.defineProperty(this, "radioIsUnison", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 26);
  }, set: function(e) {
    e ? this.Ff = Ge(this.Ff, 26) : this.Ff = Ye(this.Ff, 26);
  } });
  var n, t = {};
  Object.defineProperty(this, "MK", { enumerable: !1, configurable: !1, get: function() {
    var e = function(s) {
      return s;
    };
    if (this.scope && (e = this.scope.internal.getEncryptor(this.objId)), Object.keys(t).length !== 0) {
      var i, o = [];
      for (i in o.push("<<"), t) o.push("/" + i + " (" + Ai(e(t[i])) + ")");
      return o.push(">>"), o.join(`
`);
    }
  }, set: function(e) {
    xe(e) === "object" && (t = e);
  } }), Object.defineProperty(this, "caption", { enumerable: !0, configurable: !0, get: function() {
    return t.CA || "";
  }, set: function(e) {
    typeof e == "string" && (t.CA = e);
  } }), Object.defineProperty(this, "AS", { enumerable: !1, configurable: !1, get: function() {
    return n;
  }, set: function(e) {
    var i = e == null ? "" : e.toString();
    i.substr(0, 1) === "/" && (i = i.substr(1)), n = "/" + xi(i);
  } }), Object.defineProperty(this, "appearanceState", { enumerable: !0, configurable: !0, get: function() {
    return n.substr(1, n.length - 1);
  }, set: function(e) {
    n = "/" + xi(e);
  } });
};
Sn(en, Xn);
var Aa = function() {
  en.call(this), this.pushButton = !0;
};
Sn(Aa, en);
var wi = function() {
  en.call(this), this.radio = !0, this.pushButton = !1;
  var n = [];
  Object.defineProperty(this, "Kids", { enumerable: !0, configurable: !1, get: function() {
    return n;
  }, set: function(t) {
    n = t !== void 0 ? t : [];
  } });
};
Sn(wi, en);
var xs = function() {
  var n, t;
  Xn.call(this), Object.defineProperty(this, "Parent", { enumerable: !1, configurable: !1, get: function() {
    return n;
  }, set: function(o) {
    n = o;
  } }), Object.defineProperty(this, "optionName", { enumerable: !1, configurable: !0, get: function() {
    return t;
  }, set: function(o) {
    t = o;
  } });
  var e, i = {};
  Object.defineProperty(this, "MK", { enumerable: !1, configurable: !1, get: function() {
    var o = function(u) {
      return u;
    };
    this.scope && (o = this.scope.internal.getEncryptor(this.objId));
    var s, f = [];
    for (s in f.push("<<"), i) f.push("/" + s + " (" + Ai(o(i[s])) + ")");
    return f.push(">>"), f.join(`
`);
  }, set: function(o) {
    xe(o) === "object" && (i = o);
  } }), Object.defineProperty(this, "caption", { enumerable: !0, configurable: !0, get: function() {
    return i.CA || "";
  }, set: function(o) {
    typeof o == "string" && (i.CA = o);
  } }), Object.defineProperty(this, "AS", { enumerable: !1, configurable: !1, get: function() {
    return e;
  }, set: function(o) {
    var s = o == null ? "" : o.toString();
    s.substr(0, 1) === "/" && (s = s.substr(1)), e = "/" + xi(s);
  } }), Object.defineProperty(this, "appearanceState", { enumerable: !0, configurable: !0, get: function() {
    return e.substr(1, e.length - 1);
  }, set: function(o) {
    var s = o == null ? "" : o.toString();
    s.substr(0, 1) === "/" && (s = s.substr(1)), e = "/" + xi(s);
  } }), this.caption = "l", this.appearanceState = "Off", this._AppearanceType = It.RadioButton.Circle, this.appearanceStreamContent = this._AppearanceType.createAppearanceStream(this.optionName);
};
Sn(xs, Xn), wi.prototype.setAppearance = function(n) {
  if (!("createAppearanceStream" in n) || !("getCA" in n)) throw new Error("Couldn't assign Appearance to RadioButton. Appearance was Invalid!");
  for (var t in this.Kids) if (this.Kids.hasOwnProperty(t)) {
    var e = this.Kids[t];
    e.appearanceStreamContent = n.createAppearanceStream(e.optionName), e.caption = n.getCA();
  }
}, wi.prototype.createOption = function(n) {
  var t = new xs();
  return t.Parent = this, t.optionName = n, this.Kids.push(t), t1.call(this.scope, t), t;
};
var Na = function() {
  en.call(this), this.fontName = "zapfdingbats", this.caption = "3", this.appearanceState = "On", this.value = "On", this.textAlign = "center", this.appearanceStreamContent = It.CheckBox.createAppearanceStream();
};
Sn(Na, en);
var Yr = function() {
  Xn.call(this), this.FT = "/Tx", Object.defineProperty(this, "multiline", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 13);
  }, set: function(t) {
    t ? this.Ff = Ge(this.Ff, 13) : this.Ff = Ye(this.Ff, 13);
  } }), Object.defineProperty(this, "fileSelect", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 21);
  }, set: function(t) {
    t ? this.Ff = Ge(this.Ff, 21) : this.Ff = Ye(this.Ff, 21);
  } }), Object.defineProperty(this, "doNotSpellCheck", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 23);
  }, set: function(t) {
    t ? this.Ff = Ge(this.Ff, 23) : this.Ff = Ye(this.Ff, 23);
  } }), Object.defineProperty(this, "doNotScroll", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 24);
  }, set: function(t) {
    t ? this.Ff = Ge(this.Ff, 24) : this.Ff = Ye(this.Ff, 24);
  } }), Object.defineProperty(this, "comb", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 25);
  }, set: function(t) {
    t ? this.Ff = Ge(this.Ff, 25) : this.Ff = Ye(this.Ff, 25);
  } }), Object.defineProperty(this, "richText", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 26);
  }, set: function(t) {
    t ? this.Ff = Ge(this.Ff, 26) : this.Ff = Ye(this.Ff, 26);
  } });
  var n = null;
  Object.defineProperty(this, "MaxLen", { enumerable: !0, configurable: !1, get: function() {
    return n;
  }, set: function(t) {
    n = t;
  } }), Object.defineProperty(this, "maxLength", { enumerable: !0, configurable: !0, get: function() {
    return n;
  }, set: function(t) {
    Number.isInteger(t) && (n = t);
  } }), Object.defineProperty(this, "hasAppearanceStream", { enumerable: !0, configurable: !0, get: function() {
    return this.V || this.DV;
  } });
};
Sn(Yr, Xn);
var La = function() {
  Yr.call(this), Object.defineProperty(this, "password", { enumerable: !0, configurable: !0, get: function() {
    return !!Ve(this.Ff, 14);
  }, set: function(n) {
    n ? this.Ff = Ge(this.Ff, 14) : this.Ff = Ye(this.Ff, 14);
  } }), this.password = !0;
};
Sn(La, Yr);
var It = { CheckBox: { createAppearanceStream: function() {
  return { N: { On: It.CheckBox.YesNormal }, D: { On: It.CheckBox.YesPushDown, Off: It.CheckBox.OffPushDown } };
}, YesPushDown: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [], i = n.scope.internal.getFont(n.fontName, n.fontStyle).id, o = n.scope.__private__.encodeColorString(n.color), s = Eo(n, n.caption);
  return e.push("0.749023 g"), e.push("0 0 " + Xt(It.internal.getWidth(n)) + " " + Xt(It.internal.getHeight(n)) + " re"), e.push("f"), e.push("BMC"), e.push("q"), e.push("0 0 1 rg"), e.push("/" + i + " " + Xt(s.fontSize) + " Tf " + o), e.push("BT"), e.push(s.text), e.push("ET"), e.push("Q"), e.push("EMC"), t.stream = e.join(`
`), t;
}, YesNormal: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = n.scope.internal.getFont(n.fontName, n.fontStyle).id, i = n.scope.__private__.encodeColorString(n.color), o = [], s = It.internal.getHeight(n), f = It.internal.getWidth(n), u = Eo(n, n.caption);
  return o.push("1 g"), o.push("0 0 " + Xt(f) + " " + Xt(s) + " re"), o.push("f"), o.push("q"), o.push("0 0 1 rg"), o.push("0 0 " + Xt(f - 1) + " " + Xt(s - 1) + " re"), o.push("W"), o.push("n"), o.push("0 g"), o.push("BT"), o.push("/" + e + " " + Xt(u.fontSize) + " Tf " + i), o.push(u.text), o.push("ET"), o.push("Q"), t.stream = o.join(`
`), t;
}, OffPushDown: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [];
  return e.push("0.749023 g"), e.push("0 0 " + Xt(It.internal.getWidth(n)) + " " + Xt(It.internal.getHeight(n)) + " re"), e.push("f"), t.stream = e.join(`
`), t;
} }, RadioButton: { Circle: { createAppearanceStream: function(n) {
  var t = { D: { Off: It.RadioButton.Circle.OffPushDown }, N: {} };
  return t.N[n] = It.RadioButton.Circle.YesNormal, t.D[n] = It.RadioButton.Circle.YesPushDown, t;
}, getCA: function() {
  return "l";
}, YesNormal: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [], i = It.internal.getWidth(n) <= It.internal.getHeight(n) ? It.internal.getWidth(n) / 4 : It.internal.getHeight(n) / 4;
  i = Number((0.9 * i).toFixed(5));
  var o = It.internal.Bezier_C, s = Number((i * o).toFixed(5));
  return e.push("q"), e.push("1 0 0 1 " + Wr(It.internal.getWidth(n) / 2) + " " + Wr(It.internal.getHeight(n) / 2) + " cm"), e.push(i + " 0 m"), e.push(i + " " + s + " " + s + " " + i + " 0 " + i + " c"), e.push("-" + s + " " + i + " -" + i + " " + s + " -" + i + " 0 c"), e.push("-" + i + " -" + s + " -" + s + " -" + i + " 0 -" + i + " c"), e.push(s + " -" + i + " " + i + " -" + s + " " + i + " 0 c"), e.push("f"), e.push("Q"), t.stream = e.join(`
`), t;
}, YesPushDown: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [], i = It.internal.getWidth(n) <= It.internal.getHeight(n) ? It.internal.getWidth(n) / 4 : It.internal.getHeight(n) / 4;
  i = Number((0.9 * i).toFixed(5));
  var o = Number((2 * i).toFixed(5)), s = Number((o * It.internal.Bezier_C).toFixed(5)), f = Number((i * It.internal.Bezier_C).toFixed(5));
  return e.push("0.749023 g"), e.push("q"), e.push("1 0 0 1 " + Wr(It.internal.getWidth(n) / 2) + " " + Wr(It.internal.getHeight(n) / 2) + " cm"), e.push(o + " 0 m"), e.push(o + " " + s + " " + s + " " + o + " 0 " + o + " c"), e.push("-" + s + " " + o + " -" + o + " " + s + " -" + o + " 0 c"), e.push("-" + o + " -" + s + " -" + s + " -" + o + " 0 -" + o + " c"), e.push(s + " -" + o + " " + o + " -" + s + " " + o + " 0 c"), e.push("f"), e.push("Q"), e.push("0 g"), e.push("q"), e.push("1 0 0 1 " + Wr(It.internal.getWidth(n) / 2) + " " + Wr(It.internal.getHeight(n) / 2) + " cm"), e.push(i + " 0 m"), e.push(i + " " + f + " " + f + " " + i + " 0 " + i + " c"), e.push("-" + f + " " + i + " -" + i + " " + f + " -" + i + " 0 c"), e.push("-" + i + " -" + f + " -" + f + " -" + i + " 0 -" + i + " c"), e.push(f + " -" + i + " " + i + " -" + f + " " + i + " 0 c"), e.push("f"), e.push("Q"), t.stream = e.join(`
`), t;
}, OffPushDown: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [], i = It.internal.getWidth(n) <= It.internal.getHeight(n) ? It.internal.getWidth(n) / 4 : It.internal.getHeight(n) / 4;
  i = Number((0.9 * i).toFixed(5));
  var o = Number((2 * i).toFixed(5)), s = Number((o * It.internal.Bezier_C).toFixed(5));
  return e.push("0.749023 g"), e.push("q"), e.push("1 0 0 1 " + Wr(It.internal.getWidth(n) / 2) + " " + Wr(It.internal.getHeight(n) / 2) + " cm"), e.push(o + " 0 m"), e.push(o + " " + s + " " + s + " " + o + " 0 " + o + " c"), e.push("-" + s + " " + o + " -" + o + " " + s + " -" + o + " 0 c"), e.push("-" + o + " -" + s + " -" + s + " -" + o + " 0 -" + o + " c"), e.push(s + " -" + o + " " + o + " -" + s + " " + o + " 0 c"), e.push("f"), e.push("Q"), t.stream = e.join(`
`), t;
} }, Cross: { createAppearanceStream: function(n) {
  var t = { D: { Off: It.RadioButton.Cross.OffPushDown }, N: {} };
  return t.N[n] = It.RadioButton.Cross.YesNormal, t.D[n] = It.RadioButton.Cross.YesPushDown, t;
}, getCA: function() {
  return "8";
}, YesNormal: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [], i = It.internal.calculateCross(n);
  return e.push("q"), e.push("1 1 " + Xt(It.internal.getWidth(n) - 2) + " " + Xt(It.internal.getHeight(n) - 2) + " re"), e.push("W"), e.push("n"), e.push(Xt(i.x1.x) + " " + Xt(i.x1.y) + " m"), e.push(Xt(i.x2.x) + " " + Xt(i.x2.y) + " l"), e.push(Xt(i.x4.x) + " " + Xt(i.x4.y) + " m"), e.push(Xt(i.x3.x) + " " + Xt(i.x3.y) + " l"), e.push("s"), e.push("Q"), t.stream = e.join(`
`), t;
}, YesPushDown: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = It.internal.calculateCross(n), i = [];
  return i.push("0.749023 g"), i.push("0 0 " + Xt(It.internal.getWidth(n)) + " " + Xt(It.internal.getHeight(n)) + " re"), i.push("f"), i.push("q"), i.push("1 1 " + Xt(It.internal.getWidth(n) - 2) + " " + Xt(It.internal.getHeight(n) - 2) + " re"), i.push("W"), i.push("n"), i.push(Xt(e.x1.x) + " " + Xt(e.x1.y) + " m"), i.push(Xt(e.x2.x) + " " + Xt(e.x2.y) + " l"), i.push(Xt(e.x4.x) + " " + Xt(e.x4.y) + " m"), i.push(Xt(e.x3.x) + " " + Xt(e.x3.y) + " l"), i.push("s"), i.push("Q"), t.stream = i.join(`
`), t;
}, OffPushDown: function(n) {
  var t = hr(n);
  t.scope = n.scope;
  var e = [];
  return e.push("0.749023 g"), e.push("0 0 " + Xt(It.internal.getWidth(n)) + " " + Xt(It.internal.getHeight(n)) + " re"), e.push("f"), t.stream = e.join(`
`), t;
} } }, createDefaultAppearanceStream: function(n) {
  var t = n.scope.internal.getFont(n.fontName, n.fontStyle).id, e = n.scope.__private__.encodeColorString(n.color);
  return "/" + t + " " + n.fontSize + " Tf " + e;
} };
It.internal = { Bezier_C: 0.551915024494, calculateCross: function(n) {
  var t = It.internal.getWidth(n), e = It.internal.getHeight(n), i = Math.min(t, e);
  return { x1: { x: (t - i) / 2, y: (e - i) / 2 + i }, x2: { x: (t - i) / 2 + i, y: (e - i) / 2 }, x3: { x: (t - i) / 2, y: (e - i) / 2 }, x4: { x: (t - i) / 2 + i, y: (e - i) / 2 + i } };
} }, It.internal.getWidth = function(n) {
  var t = 0;
  return xe(n) === "object" && (t = lu(n.Rect[2])), t;
}, It.internal.getHeight = function(n) {
  var t = 0;
  return xe(n) === "object" && (t = lu(n.Rect[3])), t;
};
var t1 = qe.addField = function(n) {
  if (Qf(this, n), !(n instanceof Xn)) throw new Error("Invalid argument passed to jsPDF.addField.");
  var t;
  return (t = n).scope.internal.acroformPlugin.printedOut && (t.scope.internal.acroformPlugin.printedOut = !1, t.scope.internal.acroformPlugin.acroFormDictionaryRoot = null), t.scope.internal.acroformPlugin.acroFormDictionaryRoot.Fields.push(t), n.page = n.scope.internal.getCurrentPageInfo().pageNumber, this;
};
qe.AcroFormChoiceField = mi, qe.AcroFormListBox = bi, qe.AcroFormComboBox = vi, qe.AcroFormEditBox = _a, qe.AcroFormButton = en, qe.AcroFormPushButton = Aa, qe.AcroFormRadioButton = wi, qe.AcroFormCheckBox = Na, qe.AcroFormTextField = Yr, qe.AcroFormPasswordField = La, qe.AcroFormAppearance = It, qe.AcroForm = { ChoiceField: mi, ListBox: bi, ComboBox: vi, EditBox: _a, Button: en, PushButton: Aa, RadioButton: wi, CheckBox: Na, TextField: Yr, PasswordField: La, Appearance: It }, Mt.AcroForm = { ChoiceField: mi, ListBox: bi, ComboBox: vi, EditBox: _a, Button: en, PushButton: Aa, RadioButton: wi, CheckBox: Na, TextField: Yr, PasswordField: La, Appearance: It };
var e1 = Mt.AcroForm;
function nh(n) {
  return n.reduce(function(t, e, i) {
    return t[e] = i, t;
  }, {});
}
(function(n) {
  var t = "addImage_";
  n.__addimage__ = {};
  var e = "UNKNOWN", i = { PNG: [[137, 80, 78, 71]], TIFF: [[77, 77, 0, 42], [73, 73, 42, 0]], JPEG: [[255, 216, 255, 224, void 0, void 0, 74, 70, 73, 70, 0], [255, 216, 255, 225, void 0, void 0, 69, 120, 105, 102, 0, 0], [255, 216, 255, 219], [255, 216, 255, 238]], JPEG2000: [[0, 0, 0, 12, 106, 80, 32, 32]], GIF87a: [[71, 73, 70, 56, 55, 97]], GIF89a: [[71, 73, 70, 56, 57, 97]], WEBP: [[82, 73, 70, 70, void 0, void 0, void 0, void 0, 87, 69, 66, 80]], BMP: [[66, 77], [66, 65], [67, 73], [67, 80], [73, 67], [80, 84]] }, o = n.__addimage__.getImageFileTypeByImageData = function(N, E) {
    var q, U, rt, ct, pt, nt = e;
    if ((E = E || e) === "RGBA" || N.data !== void 0 && N.data instanceof Uint8ClampedArray && "height" in N && "width" in N) return "RGBA";
    if (yt(N)) for (pt in i) for (rt = i[pt], q = 0; q < rt.length; q += 1) {
      for (ct = !0, U = 0; U < rt[q].length; U += 1) if (rt[q][U] !== void 0 && rt[q][U] !== N[U]) {
        ct = !1;
        break;
      }
      if (ct === !0) {
        nt = pt;
        break;
      }
    }
    else for (pt in i) for (rt = i[pt], q = 0; q < rt.length; q += 1) {
      for (ct = !0, U = 0; U < rt[q].length; U += 1) if (rt[q][U] !== void 0 && rt[q][U] !== N.charCodeAt(U)) {
        ct = !1;
        break;
      }
      if (ct === !0) {
        nt = pt;
        break;
      }
    }
    return nt === e && E !== e && (nt = E), nt;
  }, s = function N(E) {
    for (var q = this.internal.write, U = this.internal.putStream, rt = (0, this.internal.getFilters)(); rt.indexOf("FlateEncode") !== -1; ) rt.splice(rt.indexOf("FlateEncode"), 1);
    E.objectId = this.internal.newObject();
    var ct = [];
    if (ct.push({ key: "Type", value: "/XObject" }), ct.push({ key: "Subtype", value: "/Image" }), ct.push({ key: "Width", value: E.width }), ct.push({ key: "Height", value: E.height }), E.colorSpace === S.INDEXED ? ct.push({ key: "ColorSpace", value: "[/Indexed /DeviceRGB " + (E.palette.length / 3 - 1) + " " + ("sMask" in E && E.sMask !== void 0 ? E.objectId + 2 : E.objectId + 1) + " 0 R]" }) : (ct.push({ key: "ColorSpace", value: "/" + E.colorSpace }), E.colorSpace === S.DEVICE_CMYK && ct.push({ key: "Decode", value: "[1 0 1 0 1 0 1 0]" })), ct.push({ key: "BitsPerComponent", value: E.bitsPerComponent }), "decodeParameters" in E && E.decodeParameters !== void 0 && ct.push({ key: "DecodeParms", value: "<<" + E.decodeParameters + ">>" }), "transparency" in E && Array.isArray(E.transparency) && E.transparency.length > 0) {
      for (var pt = "", nt = 0, ft = E.transparency.length; nt < ft; nt++) pt += E.transparency[nt] + " " + E.transparency[nt] + " ";
      ct.push({ key: "Mask", value: "[" + pt + "]" });
    }
    E.sMask !== void 0 && ct.push({ key: "SMask", value: E.objectId + 1 + " 0 R" });
    var At = E.filter !== void 0 ? ["/" + E.filter] : void 0;
    if (U({ data: E.data, additionalKeyValues: ct, alreadyAppliedFilters: At, objectId: E.objectId }), q("endobj"), "sMask" in E && E.sMask !== void 0) {
      var xt, x = (xt = E.sMaskBitsPerComponent) !== null && xt !== void 0 ? xt : E.bitsPerComponent, j = { width: E.width, height: E.height, colorSpace: "DeviceGray", bitsPerComponent: x, data: E.sMask };
      "filter" in E && (j.decodeParameters = "/Predictor ".concat(E.predictor, " /Colors 1 /BitsPerComponent ").concat(x, " /Columns ").concat(E.width), j.filter = E.filter), N.call(this, j);
    }
    if (E.colorSpace === S.INDEXED) {
      var R = this.internal.newObject();
      U({ data: tt(new Uint8Array(E.palette)), objectId: R }), q("endobj");
    }
  }, f = function() {
    var N = this.internal.collections[t + "images"];
    for (var E in N) s.call(this, N[E]);
  }, u = function() {
    var N, E = this.internal.collections[t + "images"], q = this.internal.write;
    for (var U in E) q("/I" + (N = E[U]).index, N.objectId, "0", "R");
  }, c = function() {
    this.internal.collections[t + "images"] || (this.internal.collections[t + "images"] = {}, this.internal.events.subscribe("putResources", f), this.internal.events.subscribe("putXobjectDict", u));
  }, d = function() {
    var N = this.internal.collections[t + "images"];
    return c.call(this), N;
  }, m = function() {
    return Object.keys(this.internal.collections[t + "images"]).length;
  }, A = function(N) {
    return typeof n["process" + N.toUpperCase()] == "function";
  }, P = function(N) {
    return xe(N) === "object" && N.nodeType === 1;
  }, p = function(N, E) {
    if (N.nodeName === "IMG" && N.hasAttribute("src")) {
      var q = "" + N.getAttribute("src");
      if (q.indexOf("data:image/") === 0) return ws(unescape(q).split("base64,").pop());
      var U = n.loadFile(q, !0);
      if (U !== void 0) return U;
    }
    if (N.nodeName === "CANVAS") {
      if (N.width === 0 || N.height === 0) throw new Error("Given canvas must have data. Canvas width: " + N.width + ", height: " + N.height);
      var rt;
      switch (E) {
        case "PNG":
          rt = "image/png";
          break;
        case "WEBP":
          rt = "image/webp";
          break;
        default:
          rt = "image/jpeg";
      }
      return ws(N.toDataURL(rt, 1).split("base64,").pop());
    }
  }, B = function(N) {
    var E = this.internal.collections[t + "images"];
    if (E) {
      for (var q in E) if (N === E[q].alias) return E[q];
    }
  }, O = function(N, E, q) {
    return N || E || (N = -96, E = -96), N < 0 && (N = -1 * q.width * 72 / N / this.internal.scaleFactor), E < 0 && (E = -1 * q.height * 72 / E / this.internal.scaleFactor), N === 0 && (N = E * q.width / q.height), E === 0 && (E = N * q.height / q.width), [N, E];
  }, M = function(N, E, q, U, rt, ct) {
    var pt = O.call(this, q, U, rt), nt = this.internal.getCoordinateString, ft = this.internal.getVerticalCoordinateString, At = d.call(this);
    if (q = pt[0], U = pt[1], At[rt.index] = rt, ct) {
      ct *= Math.PI / 180;
      var xt = Math.cos(ct), x = Math.sin(ct), j = function(V) {
        return V.toFixed(4);
      }, R = [j(xt), j(x), j(-1 * x), j(xt), 0, 0, "cm"];
    }
    this.internal.write("q"), ct ? (this.internal.write([1, "0", "0", 1, nt(N), ft(E + U), "cm"].join(" ")), this.internal.write(R.join(" ")), this.internal.write([nt(q), "0", "0", nt(U), "0", "0", "cm"].join(" "))) : this.internal.write([nt(q), "0", "0", nt(U), nt(N), ft(E + U), "cm"].join(" ")), this.isAdvancedAPI() && this.internal.write([1, 0, 0, -1, 0, 0, "cm"].join(" ")), this.internal.write("/I" + rt.index + " Do"), this.internal.write("Q");
  }, S = n.color_spaces = { DEVICE_RGB: "DeviceRGB", DEVICE_GRAY: "DeviceGray", DEVICE_CMYK: "DeviceCMYK", CAL_GREY: "CalGray", CAL_RGB: "CalRGB", LAB: "Lab", ICC_BASED: "ICCBased", INDEXED: "Indexed", PATTERN: "Pattern", SEPARATION: "Separation", DEVICE_N: "DeviceN" };
  n.decode = { DCT_DECODE: "DCTDecode", FLATE_DECODE: "FlateDecode", LZW_DECODE: "LZWDecode", JPX_DECODE: "JPXDecode", JBIG2_DECODE: "JBIG2Decode", ASCII85_DECODE: "ASCII85Decode", ASCII_HEX_DECODE: "ASCIIHexDecode", RUN_LENGTH_DECODE: "RunLengthDecode", CCITT_FAX_DECODE: "CCITTFaxDecode" };
  var Y = n.image_compression = { NONE: "NONE", FAST: "FAST", MEDIUM: "MEDIUM", SLOW: "SLOW" }, J = n.__addimage__.sHashCode = function(N) {
    var E, q, U = 0;
    if (typeof N == "string") for (q = N.length, E = 0; E < q; E++) U = (U << 5) - U + N.charCodeAt(E), U |= 0;
    else if (yt(N)) for (q = N.byteLength / 2, E = 0; E < q; E++) U = (U << 5) - U + N[E], U |= 0;
    return U;
  }, D = n.__addimage__.validateStringAsBase64 = function(N) {
    (N = N || "").toString().trim();
    var E = !0;
    return N.length === 0 && (E = !1), N.length % 4 != 0 && (E = !1), /^[A-Za-z0-9+/]+$/.test(N.substr(0, N.length - 2)) === !1 && (E = !1), /^[A-Za-z0-9/][A-Za-z0-9+/]|[A-Za-z0-9+/]=|==$/.test(N.substr(-2)) === !1 && (E = !1), E;
  }, lt = n.__addimage__.extractImageFromDataUrl = function(N) {
    if (N == null || !(N = N.trim()).startsWith("data:")) return null;
    var E = N.indexOf(",");
    return E < 0 ? null : N.substring(0, E).trim().endsWith("base64") ? N.substring(E + 1) : null;
  };
  n.__addimage__.isArrayBuffer = function(N) {
    return N instanceof ArrayBuffer;
  };
  var yt = n.__addimage__.isArrayBufferView = function(N) {
    return N instanceof Int8Array || N instanceof Uint8Array || N instanceof Uint8ClampedArray || N instanceof Int16Array || N instanceof Uint16Array || N instanceof Int32Array || N instanceof Uint32Array || N instanceof Float32Array || N instanceof Float64Array;
  }, mt = n.__addimage__.binaryStringToUint8Array = function(N) {
    for (var E = N.length, q = new Uint8Array(E), U = 0; U < E; U++) q[U] = N.charCodeAt(U);
    return q;
  }, tt = n.__addimage__.arrayBufferToBinaryString = function(N) {
    for (var E = "", q = yt(N) ? N : new Uint8Array(N), U = 0; U < q.length; U += 8192) E += String.fromCharCode.apply(null, q.subarray(U, U + 8192));
    return E;
  };
  n.addImage = function() {
    var N, E, q, U, rt, ct, pt, nt, ft;
    if (typeof arguments[1] == "number" ? (E = e, q = arguments[1], U = arguments[2], rt = arguments[3], ct = arguments[4], pt = arguments[5], nt = arguments[6], ft = arguments[7]) : (E = arguments[1], q = arguments[2], U = arguments[3], rt = arguments[4], ct = arguments[5], pt = arguments[6], nt = arguments[7], ft = arguments[8]), xe(N = arguments[0]) === "object" && !P(N) && "imageData" in N) {
      var At = N;
      N = At.imageData, E = At.format || E || e, q = At.x || q || 0, U = At.y || U || 0, rt = At.w || At.width || rt, ct = At.h || At.height || ct, pt = At.alias || pt, nt = At.compression || nt, ft = At.rotation || At.angle || ft;
    }
    var xt = this.internal.getFilters();
    if (nt === void 0 && xt.indexOf("FlateEncode") !== -1 && (nt = "SLOW"), isNaN(q) || isNaN(U)) throw new Error("Invalid coordinates passed to jsPDF.addImage");
    c.call(this);
    var x = z.call(this, N, E, pt, nt);
    return M.call(this, q, U, rt, ct, x, ft), this;
  };
  var z = function(N, E, q, U) {
    var rt, ct, pt;
    if (typeof N == "string" && o(N) === e) {
      N = unescape(N);
      var nt = et(N, !1);
      (nt !== "" || (nt = n.loadFile(N, !0)) !== void 0) && (N = nt);
    }
    if (P(N) && (N = p(N, E)), E = o(N, E), !A(E)) throw new Error("addImage does not support files of type '" + E + "', please ensure that a plugin for '" + E + "' support is added.");
    if (((pt = q) == null || pt.length === 0) && (q = (function(ft) {
      return typeof ft == "string" || yt(ft) ? J(ft) : yt(ft.data) ? J(ft.data) : null;
    })(N)), (rt = B.call(this, q)) || (N instanceof Uint8Array || E === "RGBA" || (ct = N, N = mt(N)), rt = this["process" + E.toUpperCase()](N, m.call(this), q, (function(ft) {
      return ft && typeof ft == "string" && (ft = ft.toUpperCase()), ft in n.image_compression ? ft : Y.NONE;
    })(U), ct)), !rt) throw new Error("An unknown error occurred whilst processing the image.");
    return rt;
  }, et = n.__addimage__.convertBase64ToBinaryString = function(N, E) {
    E = typeof E != "boolean" || E;
    var q, U = "";
    if (typeof N == "string") {
      var rt;
      q = (rt = lt(N)) !== null && rt !== void 0 ? rt : N;
      try {
        U = ws(q);
      } catch (ct) {
        if (E) throw D(q) ? new Error("atob-Error in jsPDF.convertBase64ToBinaryString " + ct.message) : new Error("Supplied Data is not a valid base64-String jsPDF.convertBase64ToBinaryString ");
      }
    }
    return U;
  };
  n.getImageProperties = function(N) {
    var E, q, U = "";
    if (P(N) && (N = p(N)), typeof N == "string" && o(N) === e && ((U = et(N, !1)) === "" && (U = n.loadFile(N) || ""), N = U), q = o(N), !A(q)) throw new Error("addImage does not support files of type '" + q + "', please ensure that a plugin for '" + q + "' support is added.");
    if (N instanceof Uint8Array || (N = mt(N)), !(E = this["process" + q.toUpperCase()](N))) throw new Error("An unknown error occurred whilst processing the image");
    return E.fileType = q, E;
  };
})(Mt.API), /**
 * @license
 * Copyright (c) 2014 Steven Spungin (TwelveTone LLC)  steven@twelvetone.tv
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = function(e) {
    if (e !== void 0 && e != "") return !0;
  };
  Mt.API.events.push(["addPage", function(e) {
    this.internal.getPageInfo(e.pageNumber).pageContext.annotations = [];
  }]), n.events.push(["putPage", function(e) {
    for (var i, o, s, f = this.internal.getCoordinateString, u = this.internal.getVerticalCoordinateString, c = this.internal.getPageInfoByObjId(e.objId), d = e.pageContext.annotations, m = !1, A = 0; A < d.length && !m; A++) switch ((i = d[A]).type) {
      case "link":
        (t(i.options.url) || t(i.options.pageNumber)) && (m = !0);
        break;
      case "reference":
      case "text":
      case "freetext":
        m = !0;
    }
    if (m != 0) {
      this.internal.write("/Annots [");
      for (var P = 0; P < d.length; P++) {
        i = d[P];
        var p = this.internal.pdfEscape, B = this.internal.getEncryptor(e.objId);
        switch (i.type) {
          case "reference":
            this.internal.write(" " + i.object.objId + " 0 R ");
            break;
          case "text":
            var O = this.internal.newAdditionalObject(), M = this.internal.newAdditionalObject(), S = this.internal.getEncryptor(O.objId), Y = i.title || "Note";
            s = "<</Type /Annot /Subtype /Text " + (o = "/Rect [" + f(i.bounds.x) + " " + u(i.bounds.y + i.bounds.h) + " " + f(i.bounds.x + i.bounds.w) + " " + u(i.bounds.y) + "] ") + "/Contents (" + p(S(i.contents)) + ")", s += " /Popup " + M.objId + " 0 R", s += " /P " + c.objId + " 0 R", s += " /T (" + p(S(Y)) + ") >>", O.content = s;
            var J = O.objId + " 0 R";
            s = "<</Type /Annot /Subtype /Popup " + (o = "/Rect [" + f(i.bounds.x + 30) + " " + u(i.bounds.y + i.bounds.h) + " " + f(i.bounds.x + i.bounds.w + 30) + " " + u(i.bounds.y) + "] ") + " /Parent " + J, i.open && (s += " /Open true"), s += " >>", M.content = s, this.internal.write(O.objId, "0 R", M.objId, "0 R");
            break;
          case "freetext":
            o = "/Rect [" + f(i.bounds.x) + " " + u(i.bounds.y) + " " + f(i.bounds.x + i.bounds.w) + " " + u(i.bounds.y + i.bounds.h) + "] ";
            var D = "font: Helvetica,sans-serif 12.0pt; text-align:left; color:#" + (i.color || "#000000");
            s = "<</Type /Annot /Subtype /FreeText " + o + "/Contents (" + p(B(i.contents)) + ")", s += " /DS(" + p(B(D)) + ")", s += " /Border [0 0 0]", s += " >>", this.internal.write(s);
            break;
          case "link":
            if (i.options.name) {
              var lt = this.annotations._nameMap[i.options.name];
              i.options.pageNumber = lt.page, i.options.top = lt.y;
            } else i.options.top || (i.options.top = 0);
            if (o = "/Rect [" + i.finalBounds.x + " " + i.finalBounds.y + " " + i.finalBounds.w + " " + i.finalBounds.h + "] ", s = "", i.options.url) s = "<</Type /Annot /Subtype /Link " + o + "/Border [0 0 0] /A <</S /URI /URI (" + p(B(i.options.url)) + ") >>";
            else if (i.options.pageNumber) switch (s = "<</Type /Annot /Subtype /Link " + o + "/Border [0 0 0] /Dest [" + this.internal.getPageInfo(i.options.pageNumber).objId + " 0 R", i.options.magFactor = i.options.magFactor || "XYZ", i.options.magFactor) {
              case "Fit":
                s += " /Fit]";
                break;
              case "FitH":
                s += " /FitH " + i.options.top + "]";
                break;
              case "FitV":
                i.options.left = i.options.left || 0, s += " /FitV " + i.options.left + "]";
                break;
              default:
                var yt = u(i.options.top);
                i.options.left = i.options.left || 0, i.options.zoom === void 0 && (i.options.zoom = 0), s += " /XYZ " + i.options.left + " " + yt + " " + i.options.zoom + "]";
            }
            s != "" && (s += " >>", this.internal.write(s));
        }
      }
      this.internal.write("]");
    }
  }]), n.createAnnotation = function(e) {
    var i = this.internal.getCurrentPageInfo();
    switch (e.type) {
      case "link":
        this.link(e.bounds.x, e.bounds.y, e.bounds.w, e.bounds.h, e);
        break;
      case "text":
      case "freetext":
        i.pageContext.annotations.push(e);
    }
  }, n.link = function(e, i, o, s, f) {
    var u = this.internal.getCurrentPageInfo(), c = this.internal.getCoordinateString, d = this.internal.getVerticalCoordinateString;
    u.pageContext.annotations.push({ finalBounds: { x: c(e), y: d(i), w: c(e + o), h: d(i + s) }, options: f, type: "link" });
  }, n.textWithLink = function(e, i, o, s) {
    var f, u, c = this.getTextWidth(e), d = this.internal.getLineHeight() / this.internal.scaleFactor;
    if (s.maxWidth !== void 0) {
      u = s.maxWidth;
      var m = this.splitTextToSize(e, u).length;
      f = Math.ceil(d * m);
    } else u = c, f = d;
    return this.text(e, i, o, s), o += 0.2 * d, s.align === "center" && (i -= c / 2), s.align === "right" && (i -= c), this.link(i, o - d, u, f, s), c;
  }, n.getTextWidth = function(e) {
    var i = this.internal.getFontSize();
    return this.getStringUnitWidth(e) * i / this.internal.scaleFactor;
  };
})(Mt.API), /**
 * @license
 * Copyright (c) 2017 Aras Abbasi
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = { 1569: [65152], 1570: [65153, 65154], 1571: [65155, 65156], 1572: [65157, 65158], 1573: [65159, 65160], 1574: [65161, 65162, 65163, 65164], 1575: [65165, 65166], 1576: [65167, 65168, 65169, 65170], 1577: [65171, 65172], 1578: [65173, 65174, 65175, 65176], 1579: [65177, 65178, 65179, 65180], 1580: [65181, 65182, 65183, 65184], 1581: [65185, 65186, 65187, 65188], 1582: [65189, 65190, 65191, 65192], 1583: [65193, 65194], 1584: [65195, 65196], 1585: [65197, 65198], 1586: [65199, 65200], 1587: [65201, 65202, 65203, 65204], 1588: [65205, 65206, 65207, 65208], 1589: [65209, 65210, 65211, 65212], 1590: [65213, 65214, 65215, 65216], 1591: [65217, 65218, 65219, 65220], 1592: [65221, 65222, 65223, 65224], 1593: [65225, 65226, 65227, 65228], 1594: [65229, 65230, 65231, 65232], 1601: [65233, 65234, 65235, 65236], 1602: [65237, 65238, 65239, 65240], 1603: [65241, 65242, 65243, 65244], 1604: [65245, 65246, 65247, 65248], 1605: [65249, 65250, 65251, 65252], 1606: [65253, 65254, 65255, 65256], 1607: [65257, 65258, 65259, 65260], 1608: [65261, 65262], 1609: [65263, 65264, 64488, 64489], 1610: [65265, 65266, 65267, 65268], 1649: [64336, 64337], 1655: [64477], 1657: [64358, 64359, 64360, 64361], 1658: [64350, 64351, 64352, 64353], 1659: [64338, 64339, 64340, 64341], 1662: [64342, 64343, 64344, 64345], 1663: [64354, 64355, 64356, 64357], 1664: [64346, 64347, 64348, 64349], 1667: [64374, 64375, 64376, 64377], 1668: [64370, 64371, 64372, 64373], 1670: [64378, 64379, 64380, 64381], 1671: [64382, 64383, 64384, 64385], 1672: [64392, 64393], 1676: [64388, 64389], 1677: [64386, 64387], 1678: [64390, 64391], 1681: [64396, 64397], 1688: [64394, 64395], 1700: [64362, 64363, 64364, 64365], 1702: [64366, 64367, 64368, 64369], 1705: [64398, 64399, 64400, 64401], 1709: [64467, 64468, 64469, 64470], 1711: [64402, 64403, 64404, 64405], 1713: [64410, 64411, 64412, 64413], 1715: [64406, 64407, 64408, 64409], 1722: [64414, 64415], 1723: [64416, 64417, 64418, 64419], 1726: [64426, 64427, 64428, 64429], 1728: [64420, 64421], 1729: [64422, 64423, 64424, 64425], 1733: [64480, 64481], 1734: [64473, 64474], 1735: [64471, 64472], 1736: [64475, 64476], 1737: [64482, 64483], 1739: [64478, 64479], 1740: [64508, 64509, 64510, 64511], 1744: [64484, 64485, 64486, 64487], 1746: [64430, 64431], 1747: [64432, 64433] }, e = { 65247: { 65154: 65269, 65156: 65271, 65160: 65273, 65166: 65275 }, 65248: { 65154: 65270, 65156: 65272, 65160: 65274, 65166: 65276 }, 65165: { 65247: { 65248: { 65258: 65010 } } }, 1617: { 1612: 64606, 1613: 64607, 1614: 64608, 1615: 64609, 1616: 64610 } }, i = { 1612: 64606, 1613: 64607, 1614: 64608, 1615: 64609, 1616: 64610 }, o = [1570, 1571, 1573, 1575];
  n.__arabicParser__ = {};
  var s = n.__arabicParser__.isInArabicSubstitutionA = function(O) {
    return t[O.charCodeAt(0)] !== void 0;
  }, f = n.__arabicParser__.isArabicLetter = function(O) {
    return typeof O == "string" && /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+$/.test(O);
  }, u = n.__arabicParser__.isArabicEndLetter = function(O) {
    return f(O) && s(O) && t[O.charCodeAt(0)].length <= 2;
  }, c = n.__arabicParser__.isArabicAlfLetter = function(O) {
    return f(O) && o.indexOf(O.charCodeAt(0)) >= 0;
  };
  n.__arabicParser__.arabicLetterHasIsolatedForm = function(O) {
    return f(O) && s(O) && t[O.charCodeAt(0)].length >= 1;
  };
  var d = n.__arabicParser__.arabicLetterHasFinalForm = function(O) {
    return f(O) && s(O) && t[O.charCodeAt(0)].length >= 2;
  };
  n.__arabicParser__.arabicLetterHasInitialForm = function(O) {
    return f(O) && s(O) && t[O.charCodeAt(0)].length >= 3;
  };
  var m = n.__arabicParser__.arabicLetterHasMedialForm = function(O) {
    return f(O) && s(O) && t[O.charCodeAt(0)].length == 4;
  }, A = n.__arabicParser__.resolveLigatures = function(O) {
    var M = 0, S = e, Y = "", J = 0;
    for (M = 0; M < O.length; M += 1) S[O.charCodeAt(M)] !== void 0 ? (J++, typeof (S = S[O.charCodeAt(M)]) == "number" && (Y += String.fromCharCode(S), S = e, J = 0), M === O.length - 1 && (S = e, Y += O.charAt(M - (J - 1)), M -= J - 1, J = 0)) : (S = e, Y += O.charAt(M - J), M -= J, J = 0);
    return Y;
  };
  n.__arabicParser__.isArabicDiacritic = function(O) {
    return O !== void 0 && i[O.charCodeAt(0)] !== void 0;
  };
  var P = n.__arabicParser__.getCorrectForm = function(O, M, S) {
    return f(O) ? s(O) === !1 ? -1 : !d(O) || !f(M) && !f(S) || !f(S) && u(M) || u(O) && !f(M) || u(O) && c(M) || u(O) && u(M) ? 0 : m(O) && f(M) && !u(M) && f(S) && d(S) ? 3 : u(O) || !f(S) ? 1 : 2 : -1;
  }, p = function(O) {
    var M = 0, S = 0, Y = 0, J = "", D = "", lt = "", yt = (O = O || "").split("\\s+"), mt = [];
    for (M = 0; M < yt.length; M += 1) {
      for (mt.push(""), S = 0; S < yt[M].length; S += 1) J = yt[M][S], D = yt[M][S - 1], lt = yt[M][S + 1], f(J) ? (Y = P(J, D, lt), mt[M] += Y !== -1 ? String.fromCharCode(t[J.charCodeAt(0)][Y]) : J) : mt[M] += J;
      mt[M] = A(mt[M]);
    }
    return mt.join(" ");
  }, B = n.__arabicParser__.processArabic = n.processArabic = function() {
    var O, M = typeof arguments[0] == "string" ? arguments[0] : arguments[0].text, S = [];
    if (Array.isArray(M)) {
      var Y = 0;
      for (S = [], Y = 0; Y < M.length; Y += 1) Array.isArray(M[Y]) ? S.push([p(M[Y][0]), M[Y][1], M[Y][2]]) : S.push([p(M[Y])]);
      O = S;
    } else O = p(M);
    return typeof arguments[0] == "string" ? O : (arguments[0].text = O, arguments[0]);
  };
  n.events.push(["preProcessText", B]);
})(Mt.API), Mt.API.autoPrint = function(n) {
  var t;
  return (n = n || {}).variant = n.variant || "non-conform", n.variant === "javascript" ? this.addJS("print({});") : (this.internal.events.subscribe("postPutResources", function() {
    t = this.internal.newObject(), this.internal.out("<<"), this.internal.out("/S /Named"), this.internal.out("/Type /Action"), this.internal.out("/N /Print"), this.internal.out(">>"), this.internal.out("endobj");
  }), this.internal.events.subscribe("putCatalog", function() {
    this.internal.out("/OpenAction " + t + " 0 R");
  })), this;
}, /**
 * @license
 * Copyright (c) 2014 Steven Spungin (TwelveTone LLC)  steven@twelvetone.tv
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = function() {
    var e = void 0;
    Object.defineProperty(this, "pdf", { get: function() {
      return e;
    }, set: function(u) {
      e = u;
    } });
    var i = 150;
    Object.defineProperty(this, "width", { get: function() {
      return i;
    }, set: function(u) {
      i = isNaN(u) || Number.isInteger(u) === !1 || u < 0 ? 150 : u, this.getContext("2d").pageWrapXEnabled && (this.getContext("2d").pageWrapX = i + 1);
    } });
    var o = 300;
    Object.defineProperty(this, "height", { get: function() {
      return o;
    }, set: function(u) {
      o = isNaN(u) || Number.isInteger(u) === !1 || u < 0 ? 300 : u, this.getContext("2d").pageWrapYEnabled && (this.getContext("2d").pageWrapY = o + 1);
    } });
    var s = [];
    Object.defineProperty(this, "childNodes", { get: function() {
      return s;
    }, set: function(u) {
      s = u;
    } });
    var f = {};
    Object.defineProperty(this, "style", { get: function() {
      return f;
    }, set: function(u) {
      f = u;
    } }), Object.defineProperty(this, "parentNode", {});
  };
  t.prototype.getContext = function(e, i) {
    var o;
    if ((e = e || "2d") !== "2d") return null;
    for (o in i) this.pdf.context2d.hasOwnProperty(o) && (this.pdf.context2d[o] = i[o]);
    return this.pdf.context2d._canvas = this, this.pdf.context2d;
  }, t.prototype.toDataURL = function() {
    throw new Error("toDataURL is not implemented.");
  }, n.events.push(["initialized", function() {
    this.canvas = new t(), this.canvas.pdf = this;
  }]);
})(Mt.API), (function(n) {
  var t = { left: 0, top: 0, bottom: 0, right: 0 }, e = !1, i = function() {
    this.internal.__cell__ === void 0 && (this.internal.__cell__ = {}, this.internal.__cell__.padding = 3, this.internal.__cell__.headerFunction = void 0, this.internal.__cell__.margins = Object.assign({}, t), this.internal.__cell__.margins.width = this.getPageWidth(), o.call(this));
  }, o = function() {
    this.internal.__cell__.lastCell = new s(), this.internal.__cell__.pages = 1;
  }, s = function() {
    var c = arguments[0];
    Object.defineProperty(this, "x", { enumerable: !0, get: function() {
      return c;
    }, set: function(O) {
      c = O;
    } });
    var d = arguments[1];
    Object.defineProperty(this, "y", { enumerable: !0, get: function() {
      return d;
    }, set: function(O) {
      d = O;
    } });
    var m = arguments[2];
    Object.defineProperty(this, "width", { enumerable: !0, get: function() {
      return m;
    }, set: function(O) {
      m = O;
    } });
    var A = arguments[3];
    Object.defineProperty(this, "height", { enumerable: !0, get: function() {
      return A;
    }, set: function(O) {
      A = O;
    } });
    var P = arguments[4];
    Object.defineProperty(this, "text", { enumerable: !0, get: function() {
      return P;
    }, set: function(O) {
      P = O;
    } });
    var p = arguments[5];
    Object.defineProperty(this, "lineNumber", { enumerable: !0, get: function() {
      return p;
    }, set: function(O) {
      p = O;
    } });
    var B = arguments[6];
    return Object.defineProperty(this, "align", { enumerable: !0, get: function() {
      return B;
    }, set: function(O) {
      B = O;
    } }), this;
  };
  s.prototype.clone = function() {
    return new s(this.x, this.y, this.width, this.height, this.text, this.lineNumber, this.align);
  }, s.prototype.toArray = function() {
    return [this.x, this.y, this.width, this.height, this.text, this.lineNumber, this.align];
  }, n.setHeaderFunction = function(c) {
    return i.call(this), this.internal.__cell__.headerFunction = typeof c == "function" ? c : void 0, this;
  }, n.getTextDimensions = function(c, d) {
    i.call(this);
    var m = (d = d || {}).fontSize || this.getFontSize(), A = d.font || this.getFont(), P = d.scaleFactor || this.internal.scaleFactor, p = 0, B = 0, O = 0, M = this;
    if (!Array.isArray(c) && typeof c != "string") {
      if (typeof c != "number") throw new Error("getTextDimensions expects text-parameter to be of type String or type Number or an Array of Strings.");
      c = String(c);
    }
    var S = d.maxWidth;
    S > 0 ? typeof c == "string" ? c = this.splitTextToSize(c, S) : Object.prototype.toString.call(c) === "[object Array]" && (c = c.reduce(function(J, D) {
      return J.concat(M.splitTextToSize(D, S));
    }, [])) : c = Array.isArray(c) ? c : [c];
    for (var Y = 0; Y < c.length; Y++) p < (O = this.getStringUnitWidth(c[Y], { font: A }) * m) && (p = O);
    return p !== 0 && (B = c.length), { w: p /= P, h: Math.max((B * m * this.getLineHeightFactor() - m * (this.getLineHeightFactor() - 1)) / P, 0) };
  }, n.cellAddPage = function() {
    i.call(this), this.addPage();
    var c = this.internal.__cell__.margins || t;
    return this.internal.__cell__.lastCell = new s(c.left, c.top, void 0, void 0), this.internal.__cell__.pages += 1, this;
  };
  var f = n.cell = function() {
    var c;
    c = arguments[0] instanceof s ? arguments[0] : new s(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]), i.call(this);
    var d = this.internal.__cell__.lastCell, m = this.internal.__cell__.padding, A = this.internal.__cell__.margins || t, P = this.internal.__cell__.tableHeaderRow, p = this.internal.__cell__.printHeaders;
    return d.lineNumber !== void 0 && (d.lineNumber === c.lineNumber ? (c.x = (d.x || 0) + (d.width || 0), c.y = d.y || 0) : d.y + d.height + c.height + A.bottom > this.getPageHeight() ? (this.cellAddPage(), c.y = A.top, p && P && (this.printHeaderRow(c.lineNumber, !0), c.y += P[0].height)) : c.y = d.y + d.height || c.y), c.text[0] !== void 0 && (this.rect(c.x, c.y, c.width, c.height, e === !0 ? "FD" : void 0), c.align === "right" ? this.text(c.text, c.x + c.width - m, c.y + m, { align: "right", baseline: "top" }) : c.align === "center" ? this.text(c.text, c.x + c.width / 2, c.y + m, { align: "center", baseline: "top", maxWidth: c.width - m - m }) : this.text(c.text, c.x + m, c.y + m, { align: "left", baseline: "top", maxWidth: c.width - m - m })), this.internal.__cell__.lastCell = c, this;
  };
  n.table = function(c, d, m, A, P) {
    if (i.call(this), !m) throw new Error("No data for PDF table.");
    var p, B, O, M, S = [], Y = [], J = [], D = {}, lt = {}, yt = [], mt = [], tt = (P = P || {}).autoSize || !1, z = P.printHeaders !== !1, et = P.css && P.css["font-size"] !== void 0 ? 16 * P.css["font-size"] : P.fontSize || 12, N = P.margins || Object.assign({ width: this.getPageWidth() }, t), E = typeof P.padding == "number" ? P.padding : 3, q = P.headerBackgroundColor || "#c8c8c8", U = P.headerTextColor || "#000";
    if (o.call(this), this.internal.__cell__.printHeaders = z, this.internal.__cell__.margins = N, this.internal.__cell__.table_font_size = et, this.internal.__cell__.padding = E, this.internal.__cell__.headerBackgroundColor = q, this.internal.__cell__.headerTextColor = U, this.setFontSize(et), A == null) Y = S = Object.keys(m[0]), J = S.map(function() {
      return "left";
    });
    else if (Array.isArray(A) && xe(A[0]) === "object") for (S = A.map(function(At) {
      return At.name;
    }), Y = A.map(function(At) {
      return At.prompt || At.name || "";
    }), J = A.map(function(At) {
      return At.align || "left";
    }), p = 0; p < A.length; p += 1) lt[A[p].name] = 0.7499990551181103 * A[p].width;
    else Array.isArray(A) && typeof A[0] == "string" && (Y = S = A, J = S.map(function() {
      return "left";
    }));
    if (tt || Array.isArray(A) && typeof A[0] == "string") for (p = 0; p < S.length; p += 1) {
      for (D[M = S[p]] = m.map(function(At) {
        return At[M];
      }), this.setFont(void 0, "bold"), yt.push(this.getTextDimensions(Y[p], { fontSize: this.internal.__cell__.table_font_size, scaleFactor: this.internal.scaleFactor }).w), B = D[M], this.setFont(void 0, "normal"), O = 0; O < B.length; O += 1) yt.push(this.getTextDimensions(B[O], { fontSize: this.internal.__cell__.table_font_size, scaleFactor: this.internal.scaleFactor }).w);
      lt[M] = Math.max.apply(null, yt) + E + E, yt = [];
    }
    if (z) {
      var rt = {};
      for (p = 0; p < S.length; p += 1) rt[S[p]] = {}, rt[S[p]].text = Y[p], rt[S[p]].align = J[p];
      var ct = u.call(this, rt, lt);
      mt = S.map(function(At) {
        return new s(c, d, lt[At], ct, rt[At].text, void 0, rt[At].align);
      }), this.setTableHeaderRow(mt), this.printHeaderRow(1, !1);
    }
    var pt = A.reduce(function(At, xt) {
      return At[xt.name] = xt.align, At;
    }, {});
    for (p = 0; p < m.length; p += 1) {
      "rowStart" in P && P.rowStart instanceof Function && P.rowStart({ row: p, data: m[p] }, this);
      var nt = u.call(this, m[p], lt);
      for (O = 0; O < S.length; O += 1) {
        var ft = m[p][S[O]];
        "cellStart" in P && P.cellStart instanceof Function && P.cellStart({ row: p, col: O, data: ft }, this), f.call(this, new s(c, d, lt[S[O]], nt, ft, p + 2, pt[S[O]]));
      }
    }
    return this.internal.__cell__.table_x = c, this.internal.__cell__.table_y = d, this;
  };
  var u = function(c, d) {
    var m = this.internal.__cell__.padding, A = this.internal.__cell__.table_font_size, P = this.internal.scaleFactor;
    return Object.keys(c).map(function(p) {
      var B = c[p];
      return this.splitTextToSize(B.hasOwnProperty("text") ? B.text : B, d[p] - m - m);
    }, this).map(function(p) {
      return this.getLineHeightFactor() * p.length * A / P + m + m;
    }, this).reduce(function(p, B) {
      return Math.max(p, B);
    }, 0);
  };
  n.setTableHeaderRow = function(c) {
    i.call(this), this.internal.__cell__.tableHeaderRow = c;
  }, n.printHeaderRow = function(c, d) {
    if (i.call(this), !this.internal.__cell__.tableHeaderRow) throw new Error("Property tableHeaderRow does not exist.");
    var m;
    if (e = !0, typeof this.internal.__cell__.headerFunction == "function") {
      var A = this.internal.__cell__.headerFunction(this, this.internal.__cell__.pages);
      this.internal.__cell__.lastCell = new s(A[0], A[1], A[2], A[3], void 0, -1);
    }
    this.setFont(void 0, "bold");
    for (var P = [], p = 0; p < this.internal.__cell__.tableHeaderRow.length; p += 1) {
      m = this.internal.__cell__.tableHeaderRow[p].clone(), d && (m.y = this.internal.__cell__.margins.top || 0, P.push(m)), m.lineNumber = c;
      var B = this.getTextColor();
      this.setTextColor(this.internal.__cell__.headerTextColor), this.setFillColor(this.internal.__cell__.headerBackgroundColor), f.call(this, m), this.setTextColor(B);
    }
    P.length > 0 && this.setTableHeaderRow(P), this.setFont(void 0, "normal"), e = !1;
  };
})(Mt.API);
var rh = { italic: ["italic", "oblique", "normal"], oblique: ["oblique", "italic", "normal"], normal: ["normal", "oblique", "italic"] }, ih = ["ultra-condensed", "extra-condensed", "condensed", "semi-condensed", "normal", "semi-expanded", "expanded", "extra-expanded", "ultra-expanded"], Oo = nh(ih), ah = [100, 200, 300, 400, 500, 600, 700, 800, 900], n1 = nh(ah);
function _o(n) {
  var t = n.family.replace(/"|'/g, "").toLowerCase(), e = (function(s) {
    return rh[s = s || "normal"] ? s : "normal";
  })(n.style), i = (function(s) {
    return s ? typeof s == "number" ? s >= 100 && s <= 900 && s % 100 == 0 ? s : 400 : /^\d00$/.test(s) ? parseInt(s) : s === "bold" ? 700 : 400 : 400;
  })(n.weight), o = (function(s) {
    return typeof Oo[s = s || "normal"] == "number" ? s : "normal";
  })(n.stretch);
  return { family: t, style: e, weight: i, stretch: o, src: n.src || [], ref: n.ref || { name: t, style: [o, e, i].join(" ") } };
}
function uu(n, t, e, i) {
  var o;
  for (o = e; o >= 0 && o < t.length; o += i) if (n[t[o]]) return n[t[o]];
  for (o = e; o >= 0 && o < t.length; o -= i) if (n[t[o]]) return n[t[o]];
}
var r1 = { "sans-serif": "helvetica", fixed: "courier", monospace: "courier", terminal: "courier", cursive: "times", fantasy: "times", serif: "times" }, hu = { caption: "times", icon: "times", menu: "times", "message-box": "times", "small-caption": "times", "status-bar": "times" };
function cu(n) {
  return [n.stretch, n.style, n.weight, n.family].join(" ");
}
function fu(n) {
  return n.trimLeft();
}
function i1(n, t) {
  for (var e = 0; e < n.length; ) {
    if (n.charAt(e) === t) return [n.substring(0, e), n.substring(e + 1)];
    e += 1;
  }
  return null;
}
function a1(n) {
  var t = n.match(/^(-[a-z_]|[a-z_])[a-z0-9_-]*/i);
  return t === null ? null : [t[0], n.substring(t[0].length)];
}
var Ji, bs, du, pu, gu, Ao = ["times"];
function mu(n, t, e, i, o) {
  var s = 4, f = vu;
  switch (o) {
    case Mt.API.image_compression.FAST:
      s = 1, f = bu;
      break;
    case Mt.API.image_compression.MEDIUM:
      s = 6, f = wu;
      break;
    case Mt.API.image_compression.SLOW:
      s = 9, f = yu;
  }
  n = (function(c, d, m, A) {
    for (var P, p = c.length / d, B = new Uint8Array(c.length + p), O = [s1, bu, vu, wu, yu], M = 0; M < p; M += 1) {
      var S = M * d, Y = c.subarray(S, S + d);
      if (A) B.set(A(Y, m, P), S + M);
      else {
        for (var J = O.length, D = [], lt = 0; lt < J; lt += 1) D[lt] = O[lt](Y, m, P);
        var yt = l1(D.concat());
        B.set(D[yt], S + M);
      }
      P = Y;
    }
    return B;
  })(n, t, Math.ceil(e * i / 8), f);
  var u = So(n, { level: s });
  return Mt.API.__addimage__.arrayBufferToBinaryString(u);
}
function s1(n) {
  var t = Array.apply([], n);
  return t.unshift(0), t;
}
function bu(n, t) {
  var e = n.length, i = [];
  i[0] = 1;
  for (var o = 0; o < e; o += 1) {
    var s = n[o - t] || 0;
    i[o + 1] = n[o] - s + 256 & 255;
  }
  return i;
}
function vu(n, t, e) {
  var i = n.length, o = [];
  o[0] = 2;
  for (var s = 0; s < i; s += 1) {
    var f = e && e[s] || 0;
    o[s + 1] = n[s] - f + 256 & 255;
  }
  return o;
}
function wu(n, t, e) {
  var i = n.length, o = [];
  o[0] = 3;
  for (var s = 0; s < i; s += 1) {
    var f = n[s - t] || 0, u = e && e[s] || 0;
    o[s + 1] = n[s] + 256 - (f + u >>> 1) & 255;
  }
  return o;
}
function yu(n, t, e) {
  var i = n.length, o = [];
  o[0] = 4;
  for (var s = 0; s < i; s += 1) {
    var f = o1(n[s - t] || 0, e && e[s] || 0, e && e[s - t] || 0);
    o[s + 1] = n[s] - f + 256 & 255;
  }
  return o;
}
function o1(n, t, e) {
  if (n === t && t === e) return n;
  var i = Math.abs(t - e), o = Math.abs(n - e), s = Math.abs(n + t - e - e);
  return i <= o && i <= s ? n : o <= s ? t : e;
}
function l1(n) {
  var t = n.map(function(e) {
    return e.reduce(function(i, o) {
      return i + Math.abs(o);
    }, 0);
  });
  return t.indexOf(Math.min.apply(null, t));
}
function No(n, t, e) {
  var i = t * e, o = Math.floor(i / 8), s = 16 - (i - 8 * o + e), f = (1 << e) - 1;
  return sh(n, o) >> s & f;
}
function xu(n, t, e, i) {
  var o = e * i, s = Math.floor(o / 8), f = 16 - (o - 8 * s + i), u = (1 << i) - 1, c = (t & u) << f;
  (function(d, m, A) {
    if (m + 1 < d.byteLength) d.setUint16(m, A, !1);
    else {
      var P = A >> 8 & 255;
      d.setUint8(m, P);
    }
  })(n, s, sh(n, s) & ~(u << f) & 65535 | c);
}
function sh(n, t) {
  return t + 1 < n.byteLength ? n.getUint16(t, !1) : n.getUint8(t) << 8;
}
function u1(n) {
  var t = 0;
  if (n[t++] !== 71 || n[t++] !== 73 || n[t++] !== 70 || n[t++] !== 56 || (n[t++] + 1 & 253) != 56 || n[t++] !== 97) throw new Error("Invalid GIF 87a/89a header.");
  var e = n[t++] | n[t++] << 8, i = n[t++] | n[t++] << 8, o = n[t++], s = o >> 7, f = 1 << 1 + (7 & o);
  n[t++], n[t++];
  var u = null, c = null;
  s && (u = t, c = f, t += 3 * f);
  var d = !0, m = [], A = 0, P = null, p = 0, B = null;
  for (this.width = e, this.height = i; d && t < n.length; ) switch (n[t++]) {
    case 33:
      switch (n[t++]) {
        case 255:
          if (n[t] !== 11 || n[t + 1] == 78 && n[t + 2] == 69 && n[t + 3] == 84 && n[t + 4] == 83 && n[t + 5] == 67 && n[t + 6] == 65 && n[t + 7] == 80 && n[t + 8] == 69 && n[t + 9] == 50 && n[t + 10] == 46 && n[t + 11] == 48 && n[t + 12] == 3 && n[t + 13] == 1 && n[t + 16] == 0) t += 14, B = n[t++] | n[t++] << 8, t++;
          else for (t += 12; ; ) {
            if (!((N = n[t++]) >= 0)) throw Error("Invalid block size");
            if (N === 0) break;
            t += N;
          }
          break;
        case 249:
          if (n[t++] !== 4 || n[t + 4] !== 0) throw new Error("Invalid graphics extension block.");
          var O = n[t++];
          A = n[t++] | n[t++] << 8, P = n[t++], 1 & O || (P = null), p = O >> 2 & 7, t++;
          break;
        case 254:
          for (; ; ) {
            if (!((N = n[t++]) >= 0)) throw Error("Invalid block size");
            if (N === 0) break;
            t += N;
          }
          break;
        default:
          throw new Error("Unknown graphic control label: 0x" + n[t - 1].toString(16));
      }
      break;
    case 44:
      var M = n[t++] | n[t++] << 8, S = n[t++] | n[t++] << 8, Y = n[t++] | n[t++] << 8, J = n[t++] | n[t++] << 8, D = n[t++], lt = D >> 6 & 1, yt = 1 << 1 + (7 & D), mt = u, tt = c, z = !1;
      D >> 7 && (z = !0, mt = t, tt = yt, t += 3 * yt);
      var et = t;
      for (t++; ; ) {
        var N;
        if (!((N = n[t++]) >= 0)) throw Error("Invalid block size");
        if (N === 0) break;
        t += N;
      }
      m.push({ x: M, y: S, width: Y, height: J, has_local_palette: z, palette_offset: mt, palette_size: tt, data_offset: et, data_length: t - et, transparent_index: P, interlaced: !!lt, delay: A, disposal: p });
      break;
    case 59:
      d = !1;
      break;
    default:
      throw new Error("Unknown gif block: 0x" + n[t - 1].toString(16));
  }
  this.numFrames = function() {
    return m.length;
  }, this.loopCount = function() {
    return B;
  }, this.frameInfo = function(E) {
    if (E < 0 || E >= m.length) throw new Error("Frame index out of range.");
    return m[E];
  }, this.decodeAndBlitFrameBGRA = function(E, q) {
    var U = this.frameInfo(E), rt = U.width * U.height;
    if (rt > 536870912) throw new Error("Image dimensions exceed 512MB, which is too large.");
    var ct = new Uint8Array(rt);
    _u(n, U.data_offset, ct, rt);
    var pt = U.palette_offset, nt = U.transparent_index;
    nt === null && (nt = 256);
    var ft = U.width, At = e - ft, xt = ft, x = 4 * (U.y * e + U.x), j = 4 * ((U.y + U.height) * e + U.x), R = x, V = 4 * At;
    U.interlaced === !0 && (V += 4 * e * 7);
    for (var $ = 8, Q = 0, it = ct.length; Q < it; ++Q) {
      var at = ct[Q];
      if (xt === 0 && (xt = ft, (R += V) >= j && (V = 4 * At + 4 * e * ($ - 1), R = x + (ft + At) * ($ << 1), $ >>= 1)), at === nt) R += 4;
      else {
        var dt = n[pt + 3 * at], _t = n[pt + 3 * at + 1], St = n[pt + 3 * at + 2];
        q[R++] = St, q[R++] = _t, q[R++] = dt, q[R++] = 255;
      }
      --xt;
    }
  }, this.decodeAndBlitFrameRGBA = function(E, q) {
    var U = this.frameInfo(E), rt = U.width * U.height;
    if (rt > 536870912) throw new Error("Image dimensions exceed 512MB, which is too large.");
    var ct = new Uint8Array(rt);
    _u(n, U.data_offset, ct, rt);
    var pt = U.palette_offset, nt = U.transparent_index;
    nt === null && (nt = 256);
    var ft = U.width, At = e - ft, xt = ft, x = 4 * (U.y * e + U.x), j = 4 * ((U.y + U.height) * e + U.x), R = x, V = 4 * At;
    U.interlaced === !0 && (V += 4 * e * 7);
    for (var $ = 8, Q = 0, it = ct.length; Q < it; ++Q) {
      var at = ct[Q];
      if (xt === 0 && (xt = ft, (R += V) >= j && (V = 4 * At + 4 * e * ($ - 1), R = x + (ft + At) * ($ << 1), $ >>= 1)), at === nt) R += 4;
      else {
        var dt = n[pt + 3 * at], _t = n[pt + 3 * at + 1], St = n[pt + 3 * at + 2];
        q[R++] = dt, q[R++] = _t, q[R++] = St, q[R++] = 255;
      }
      --xt;
    }
  };
}
function _u(n, t, e, i) {
  for (var o = n[t++], s = 1 << o, f = s + 1, u = f + 1, c = o + 1, d = (1 << c) - 1, m = 0, A = 0, P = 0, p = n[t++], B = new Int32Array(4096), O = null; ; ) {
    for (; m < 16 && p !== 0; ) A |= n[t++] << m, m += 8, p === 1 ? p = n[t++] : --p;
    if (m < c) break;
    var M = A & d;
    if (A >>= c, m -= c, M !== s) {
      if (M === f) break;
      for (var S = M < u ? M : O, Y = 0, J = S; J > s; ) J = B[J] >> 8, ++Y;
      var D = J;
      if (P + Y + (S !== M ? 1 : 0) > i) return void Le.log("Warning, gif stream longer than expected.");
      e[P++] = D;
      var lt = P += Y;
      for (S !== M && (e[P++] = D), J = S; Y--; ) J = B[J], e[--lt] = 255 & J, J >>= 8;
      O !== null && u < 4096 && (B[u++] = O << 8 | D, u >= d + 1 && c < 12 && (++c, d = d << 1 | 1)), O = M;
    } else u = f + 1, d = (1 << (c = o + 1)) - 1, O = null;
  }
  return P !== i && Le.log("Warning, gif stream shorter than expected."), e;
}
function Lo(n) {
  var t, e, i, o, s, f = Math.floor, u = new Array(64), c = new Array(64), d = new Array(64), m = new Array(64), A = new Array(65535), P = new Array(65535), p = new Array(64), B = new Array(64), O = [], M = 0, S = 7, Y = new Array(64), J = new Array(64), D = new Array(64), lt = new Array(256), yt = new Array(2048), mt = [0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24, 31, 40, 44, 53, 10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59, 61, 35, 36, 48, 49, 57, 58, 62, 63], tt = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], z = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], et = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125], N = [1, 2, 3, 0, 4, 17, 5, 18, 33, 49, 65, 6, 19, 81, 97, 7, 34, 113, 20, 50, 129, 145, 161, 8, 35, 66, 177, 193, 21, 82, 209, 240, 36, 51, 98, 114, 130, 9, 10, 22, 23, 24, 25, 26, 37, 38, 39, 40, 41, 42, 52, 53, 54, 55, 56, 57, 58, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 131, 132, 133, 134, 135, 136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212, 213, 214, 215, 216, 217, 218, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250], E = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], q = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], U = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119], rt = [0, 1, 2, 3, 17, 4, 5, 33, 49, 6, 18, 65, 81, 7, 97, 113, 19, 34, 50, 129, 8, 20, 66, 145, 161, 177, 193, 9, 35, 51, 82, 240, 21, 98, 114, 209, 10, 22, 36, 52, 225, 37, 241, 23, 24, 25, 26, 38, 39, 40, 41, 42, 53, 54, 55, 56, 57, 58, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 130, 131, 132, 133, 134, 135, 136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163, 164, 165, 166, 167, 168, 169, 170, 178, 179, 180, 181, 182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212, 213, 214, 215, 216, 217, 218, 226, 227, 228, 229, 230, 231, 232, 233, 234, 242, 243, 244, 245, 246, 247, 248, 249, 250];
  function ct(x, j) {
    for (var R = 0, V = 0, $ = new Array(), Q = 1; Q <= 16; Q++) {
      for (var it = 1; it <= x[Q]; it++) $[j[V]] = [], $[j[V]][0] = R, $[j[V]][1] = Q, V++, R++;
      R *= 2;
    }
    return $;
  }
  function pt(x) {
    for (var j = x[0], R = x[1] - 1; R >= 0; ) j & 1 << R && (M |= 1 << S), R--, --S < 0 && (M == 255 ? (nt(255), nt(0)) : nt(M), S = 7, M = 0);
  }
  function nt(x) {
    O.push(x);
  }
  function ft(x) {
    nt(x >> 8 & 255), nt(255 & x);
  }
  function At(x, j, R, V, $) {
    for (var Q, it = $[0], at = $[240], dt = (function(vt, Wt) {
      var Ct, Ut, Dt, be, ue, Zt, ce, he, Bt, ne, Tt = 0;
      for (Bt = 0; Bt < 8; ++Bt) {
        Ct = vt[Tt], Ut = vt[Tt + 1], Dt = vt[Tt + 2], be = vt[Tt + 3], ue = vt[Tt + 4], Zt = vt[Tt + 5], ce = vt[Tt + 6];
        var Ue = Ct + (he = vt[Tt + 7]), ge = Ct - he, se = Ut + ce, oe = Ut - ce, Ee = Dt + Zt, qt = Dt - Zt, Se = be + ue, Yt = be - ue, Qt = Ue + Se, Oe = Ue - Se, le = se + Ee, Vt = se - Ee;
        vt[Tt] = Qt + le, vt[Tt + 4] = Qt - le;
        var ve = 0.707106781 * (Vt + Oe);
        vt[Tt + 2] = Oe + ve, vt[Tt + 6] = Oe - ve;
        var $r = 0.382683433 * ((Qt = Yt + qt) - (Vt = oe + ge)), un = 0.5411961 * Qt + $r, dr = 1.306562965 * Vt + $r, Qn = 0.707106781 * (le = qt + oe), Gt = ge + Qn, pr = ge - Qn;
        vt[Tt + 5] = pr + un, vt[Tt + 3] = pr - un, vt[Tt + 1] = Gt + dr, vt[Tt + 7] = Gt - dr, Tt += 8;
      }
      for (Tt = 0, Bt = 0; Bt < 8; ++Bt) {
        Ct = vt[Tt], Ut = vt[Tt + 8], Dt = vt[Tt + 16], be = vt[Tt + 24], ue = vt[Tt + 32], Zt = vt[Tt + 40], ce = vt[Tt + 48];
        var gr = Ct + (he = vt[Tt + 56]), Bn = Ct - he, Mn = Ut + ce, Re = Ut - ce, nn = Dt + Zt, rn = Dt - Zt, Kr = be + ue, Ir = be - ue, Hn = gr + Kr, tr = gr - Kr, Wn = Mn + nn, Vn = Mn - nn;
        vt[Tt] = Hn + Wn, vt[Tt + 32] = Hn - Wn;
        var Rn = 0.707106781 * (Vn + tr);
        vt[Tt + 16] = tr + Rn, vt[Tt + 48] = tr - Rn;
        var Xr = 0.382683433 * ((Hn = Ir + rn) - (Vn = Re + Bn)), er = 0.5411961 * Hn + Xr, Zr = 1.306562965 * Vn + Xr, Ni = 0.707106781 * (Wn = rn + Re), Li = Bn + Ni, Si = Bn - Ni;
        vt[Tt + 40] = Si + er, vt[Tt + 24] = Si - er, vt[Tt + 8] = Li + Zr, vt[Tt + 56] = Li - Zr, Tt++;
      }
      for (Bt = 0; Bt < 64; ++Bt) ne = vt[Bt] * Wt[Bt], p[Bt] = ne > 0 ? ne + 0.5 | 0 : ne - 0.5 | 0;
      return p;
    })(x, j), _t = 0; _t < 64; ++_t) B[mt[_t]] = dt[_t];
    var St = B[0] - R;
    R = B[0], St == 0 ? pt(V[0]) : (pt(V[P[Q = 32767 + St]]), pt(A[Q]));
    for (var kt = 63; kt > 0 && B[kt] == 0; ) kt--;
    if (kt == 0) return pt(it), R;
    for (var zt, k = 1; k <= kt; ) {
      for (var Lt = k; B[k] == 0 && k <= kt; ) ++k;
      var ae = k - Lt;
      if (ae >= 16) {
        zt = ae >> 4;
        for (var Ht = 1; Ht <= zt; ++Ht) pt(at);
        ae &= 15;
      }
      Q = 32767 + B[k], pt($[(ae << 4) + P[Q]]), pt(A[Q]), k++;
    }
    return kt != 63 && pt(it), R;
  }
  function xt(x) {
    x = Math.min(Math.max(x, 1), 100), s != x && ((function(j) {
      for (var R = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99], V = 0; V < 64; V++) {
        var $ = f((R[V] * j + 50) / 100);
        $ = Math.min(Math.max($, 1), 255), u[mt[V]] = $;
      }
      for (var Q = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47, 66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99], it = 0; it < 64; it++) {
        var at = f((Q[it] * j + 50) / 100);
        at = Math.min(Math.max(at, 1), 255), c[mt[it]] = at;
      }
      for (var dt = [1, 1.387039845, 1.306562965, 1.175875602, 1, 0.785694958, 0.5411961, 0.275899379], _t = 0, St = 0; St < 8; St++) for (var kt = 0; kt < 8; kt++) d[_t] = 1 / (u[mt[_t]] * dt[St] * dt[kt] * 8), m[_t] = 1 / (c[mt[_t]] * dt[St] * dt[kt] * 8), _t++;
    })(x < 50 ? Math.floor(5e3 / x) : Math.floor(200 - 2 * x)), s = x);
  }
  this.encode = function(x, j) {
    j && xt(j), O = new Array(), M = 0, S = 7, ft(65496), ft(65504), ft(16), nt(74), nt(70), nt(73), nt(70), nt(0), nt(1), nt(1), nt(0), ft(1), ft(1), nt(0), nt(0), (function() {
      ft(65499), ft(132), nt(0);
      for (var Ut = 0; Ut < 64; Ut++) nt(u[Ut]);
      nt(1);
      for (var Dt = 0; Dt < 64; Dt++) nt(c[Dt]);
    })(), (function(Ut, Dt) {
      ft(65472), ft(17), nt(8), ft(Dt), ft(Ut), nt(3), nt(1), nt(17), nt(0), nt(2), nt(17), nt(1), nt(3), nt(17), nt(1);
    })(x.width, x.height), (function() {
      ft(65476), ft(418), nt(0);
      for (var Ut = 0; Ut < 16; Ut++) nt(tt[Ut + 1]);
      for (var Dt = 0; Dt <= 11; Dt++) nt(z[Dt]);
      nt(16);
      for (var be = 0; be < 16; be++) nt(et[be + 1]);
      for (var ue = 0; ue <= 161; ue++) nt(N[ue]);
      nt(1);
      for (var Zt = 0; Zt < 16; Zt++) nt(E[Zt + 1]);
      for (var ce = 0; ce <= 11; ce++) nt(q[ce]);
      nt(17);
      for (var he = 0; he < 16; he++) nt(U[he + 1]);
      for (var Bt = 0; Bt <= 161; Bt++) nt(rt[Bt]);
    })(), ft(65498), ft(12), nt(3), nt(1), nt(0), nt(2), nt(17), nt(3), nt(17), nt(0), nt(63), nt(0);
    var R = 0, V = 0, $ = 0;
    M = 0, S = 7, this.encode.displayName = "_encode_";
    for (var Q, it, at, dt, _t, St, kt, zt, k, Lt = x.data, ae = x.width, Ht = x.height, vt = 4 * ae, Wt = 0; Wt < Ht; ) {
      for (Q = 0; Q < vt; ) {
        for (_t = vt * Wt + Q, kt = -1, zt = 0, k = 0; k < 64; k++) St = _t + (zt = k >> 3) * vt + (kt = 4 * (7 & k)), Wt + zt >= Ht && (St -= vt * (Wt + 1 + zt - Ht)), Q + kt >= vt && (St -= Q + kt - vt + 4), it = Lt[St++], at = Lt[St++], dt = Lt[St++], Y[k] = (yt[it] + yt[at + 256 | 0] + yt[dt + 512 | 0] >> 16) - 128, J[k] = (yt[it + 768 | 0] + yt[at + 1024 | 0] + yt[dt + 1280 | 0] >> 16) - 128, D[k] = (yt[it + 1280 | 0] + yt[at + 1536 | 0] + yt[dt + 1792 | 0] >> 16) - 128;
        R = At(Y, d, R, t, i), V = At(J, m, V, e, o), $ = At(D, m, $, e, o), Q += 32;
      }
      Wt += 8;
    }
    if (S >= 0) {
      var Ct = [];
      Ct[1] = S + 1, Ct[0] = (1 << S + 1) - 1, pt(Ct);
    }
    return ft(65497), new Uint8Array(O);
  }, n = n || 50, (function() {
    for (var x = String.fromCharCode, j = 0; j < 256; j++) lt[j] = x(j);
  })(), t = ct(tt, z), e = ct(E, q), i = ct(et, N), o = ct(U, rt), (function() {
    for (var x = 1, j = 2, R = 1; R <= 15; R++) {
      for (var V = x; V < j; V++) P[32767 + V] = R, A[32767 + V] = [], A[32767 + V][1] = R, A[32767 + V][0] = V;
      for (var $ = -(j - 1); $ <= -x; $++) P[32767 + $] = R, A[32767 + $] = [], A[32767 + $][1] = R, A[32767 + $][0] = j - 1 + $;
      x <<= 1, j <<= 1;
    }
  })(), (function() {
    for (var x = 0; x < 256; x++) yt[x] = 19595 * x, yt[x + 256 | 0] = 38470 * x, yt[x + 512 | 0] = 7471 * x + 32768, yt[x + 768 | 0] = -11059 * x, yt[x + 1024 | 0] = -21709 * x, yt[x + 1280 | 0] = 32768 * x + 8421375, yt[x + 1536 | 0] = -27439 * x, yt[x + 1792 | 0] = -5329 * x;
  })(), xt(n);
}
function Kn(n, t) {
  if (this.pos = 0, this.buffer = n, this.datav = new DataView(n.buffer), this.is_with_alpha = !!t, this.bottom_up = !0, this.flag = String.fromCharCode(this.buffer[0]) + String.fromCharCode(this.buffer[1]), this.pos += 2, ["BM", "BA", "CI", "CP", "IC", "PT"].indexOf(this.flag) === -1) throw new Error("Invalid BMP File");
  this.parseHeader(), this.parseBGR();
}
function Au(n) {
  function t(z) {
    if (!z) throw Error("assert :P");
  }
  function e(z, et, N) {
    for (var E = 0; 4 > E; E++) if (z[et + E] != N.charCodeAt(E)) return !0;
    return !1;
  }
  function i(z, et, N, E, q) {
    for (var U = 0; U < q; U++) z[et + U] = N[E + U];
  }
  function o(z, et, N, E) {
    for (var q = 0; q < E; q++) z[et + q] = N;
  }
  function s(z) {
    return new Int32Array(z);
  }
  function f(z, et) {
    for (var N = [], E = 0; E < z; E++) N.push(new et());
    return N;
  }
  function u(z, et) {
    var N = [];
    return (function E(q, U, rt) {
      for (var ct = rt[U], pt = 0; pt < ct && (q.push(rt.length > U + 1 ? [] : new et()), !(rt.length < U + 1)); pt++) E(q[pt], U + 1, rt);
    })(N, 0, z), N;
  }
  var c = function() {
    var z = this;
    function et(r, a) {
      for (var h = 1 << a - 1 >>> 0; r & h; ) h >>>= 1;
      return h ? (r & h - 1) + h : r;
    }
    function N(r, a, h, g, v) {
      t(!(g % h));
      do
        r[a + (g -= h)] = v;
      while (0 < g);
    }
    function E(r, a, h, g, v) {
      if (t(2328 >= v), 512 >= v) var w = s(512);
      else if ((w = s(v)) == null) return 0;
      return (function(y, _, L, C, H, Z) {
        var F, W, K = _, ot = 1 << L, X = s(16), ut = s(16);
        for (t(H != 0), t(C != null), t(y != null), t(0 < L), W = 0; W < H; ++W) {
          if (15 < C[W]) return 0;
          ++X[C[W]];
        }
        if (X[0] == H) return 0;
        for (ut[1] = 0, F = 1; 15 > F; ++F) {
          if (X[F] > 1 << F) return 0;
          ut[F + 1] = ut[F] + X[F];
        }
        for (W = 0; W < H; ++W) F = C[W], 0 < C[W] && (Z[ut[F]++] = W);
        if (ut[15] == 1) return (C = new q()).g = 0, C.value = Z[0], N(y, K, 1, ot, C), ot;
        var ht, wt = -1, bt = ot - 1, Rt = 0, Pt = 1, re = 1, Ot = 1 << L;
        for (W = 0, F = 1, H = 2; F <= L; ++F, H <<= 1) {
          if (Pt += re <<= 1, 0 > (re -= X[F])) return 0;
          for (; 0 < X[F]; --X[F]) (C = new q()).g = F, C.value = Z[W++], N(y, K + Rt, H, Ot, C), Rt = et(Rt, F);
        }
        for (F = L + 1, H = 2; 15 >= F; ++F, H <<= 1) {
          if (Pt += re <<= 1, 0 > (re -= X[F])) return 0;
          for (; 0 < X[F]; --X[F]) {
            if (C = new q(), (Rt & bt) != wt) {
              for (K += Ot, ht = 1 << (wt = F) - L; 15 > wt && !(0 >= (ht -= X[wt])); ) ++wt, ht <<= 1;
              ot += Ot = 1 << (ht = wt - L), y[_ + (wt = Rt & bt)].g = ht + L, y[_ + wt].value = K - _ - wt;
            }
            C.g = F - L, C.value = Z[W++], N(y, K + (Rt >> L), H, Ot, C), Rt = et(Rt, F);
          }
        }
        return Pt != 2 * ut[15] - 1 ? 0 : ot;
      })(r, a, h, g, v, w);
    }
    function q() {
      this.value = this.g = 0;
    }
    function U() {
      this.value = this.g = 0;
    }
    function rt() {
      this.G = f(5, q), this.H = s(5), this.jc = this.Qb = this.qb = this.nd = 0, this.pd = f(Di, U);
    }
    function ct(r, a, h, g) {
      t(r != null), t(a != null), t(2147483648 > g), r.Ca = 254, r.I = 0, r.b = -8, r.Ka = 0, r.oa = a, r.pa = h, r.Jd = a, r.Yc = h + g, r.Zc = 4 <= g ? h + g - 4 + 1 : h, it(r);
    }
    function pt(r, a) {
      for (var h = 0; 0 < a--; ) h |= dt(r, 128) << a;
      return h;
    }
    function nt(r, a) {
      var h = pt(r, a);
      return at(r) ? -h : h;
    }
    function ft(r, a, h, g) {
      var v, w = 0;
      for (t(r != null), t(a != null), t(4294967288 > g), r.Sb = g, r.Ra = 0, r.u = 0, r.h = 0, 4 < g && (g = 4), v = 0; v < g; ++v) w += a[h + v] << 8 * v;
      r.Ra = w, r.bb = g, r.oa = a, r.pa = h;
    }
    function At(r) {
      for (; 8 <= r.u && r.bb < r.Sb; ) r.Ra >>>= 8, r.Ra += r.oa[r.pa + r.bb] << wn - 8 >>> 0, ++r.bb, r.u -= 8;
      V(r) && (r.h = 1, r.u = 0);
    }
    function xt(r, a) {
      if (t(0 <= a), !r.h && a <= ca) {
        var h = R(r) & li[a];
        return r.u += a, At(r), h;
      }
      return r.h = 1, r.u = 0;
    }
    function x() {
      this.b = this.Ca = this.I = 0, this.oa = [], this.pa = 0, this.Jd = [], this.Yc = 0, this.Zc = [], this.Ka = 0;
    }
    function j() {
      this.Ra = 0, this.oa = [], this.h = this.u = this.bb = this.Sb = this.pa = 0;
    }
    function R(r) {
      return r.Ra >>> (r.u & wn - 1) >>> 0;
    }
    function V(r) {
      return t(r.bb <= r.Sb), r.h || r.bb == r.Sb && r.u > wn;
    }
    function $(r, a) {
      r.u = a, r.h = V(r);
    }
    function Q(r) {
      r.u >= An && (t(r.u >= An), At(r));
    }
    function it(r) {
      t(r != null && r.oa != null), r.pa < r.Zc ? (r.I = (r.oa[r.pa++] | r.I << 8) >>> 0, r.b += 8) : (t(r != null && r.oa != null), r.pa < r.Yc ? (r.b += 8, r.I = r.oa[r.pa++] | r.I << 8) : r.Ka ? r.b = 0 : (r.I <<= 8, r.b += 8, r.Ka = 1));
    }
    function at(r) {
      return pt(r, 1);
    }
    function dt(r, a) {
      var h = r.Ca;
      0 > r.b && it(r);
      var g = r.b, v = h * a >>> 8, w = (r.I >>> g > v) + 0;
      for (w ? (h -= v, r.I -= v + 1 << g >>> 0) : h = v + 1, g = h, v = 0; 256 <= g; ) v += 8, g >>= 8;
      return g = 7 ^ v + qi[g], r.b -= g, r.Ca = (h << g) - 1, w;
    }
    function _t(r, a, h) {
      r[a + 0] = h >> 24 & 255, r[a + 1] = h >> 16 & 255, r[a + 2] = h >> 8 & 255, r[a + 3] = 255 & h;
    }
    function St(r, a) {
      return r[a + 0] | r[a + 1] << 8;
    }
    function kt(r, a) {
      return St(r, a) | r[a + 2] << 16;
    }
    function zt(r, a) {
      return St(r, a) | St(r, a + 2) << 16;
    }
    function k(r, a) {
      var h = 1 << a;
      return t(r != null), t(0 < a), r.X = s(h), r.X == null ? 0 : (r.Mb = 32 - a, r.Xa = a, 1);
    }
    function Lt(r, a) {
      t(r != null), t(a != null), t(r.Xa == a.Xa), i(a.X, 0, r.X, 0, 1 << a.Xa);
    }
    function ae() {
      this.X = [], this.Xa = this.Mb = 0;
    }
    function Ht(r, a, h, g) {
      t(h != null), t(g != null);
      var v = h[0], w = g[0];
      return v == 0 && (v = (r * w + a / 2) / a), w == 0 && (w = (a * v + r / 2) / r), 0 >= v || 0 >= w ? 0 : (h[0] = v, g[0] = w, 1);
    }
    function vt(r, a) {
      return r + (1 << a) - 1 >>> a;
    }
    function Wt(r, a) {
      return ((4278255360 & r) + (4278255360 & a) >>> 0 & 4278255360) + ((16711935 & r) + (16711935 & a) >>> 0 & 16711935) >>> 0;
    }
    function Ct(r, a) {
      z[a] = function(h, g, v, w, y, _, L) {
        var C;
        for (C = 0; C < y; ++C) {
          var H = z[r](_[L + C - 1], v, w + C);
          _[L + C] = Wt(h[g + C], H);
        }
      };
    }
    function Ut() {
      this.ud = this.hd = this.jd = 0;
    }
    function Dt(r, a) {
      return ((4278124286 & (r ^ a)) >>> 1) + (r & a) >>> 0;
    }
    function be(r) {
      return 0 <= r && 256 > r ? r : 0 > r ? 0 : 255 < r ? 255 : void 0;
    }
    function ue(r, a) {
      return be(r + (r - a + 0.5 >> 1));
    }
    function Zt(r, a, h) {
      return Math.abs(a - h) - Math.abs(r - h);
    }
    function ce(r, a, h, g, v, w, y) {
      for (g = w[y - 1], h = 0; h < v; ++h) w[y + h] = g = Wt(r[a + h], g);
    }
    function he(r, a, h, g, v) {
      var w;
      for (w = 0; w < h; ++w) {
        var y = r[a + w], _ = y >> 8 & 255, L = 16711935 & (L = (L = 16711935 & y) + ((_ << 16) + _));
        g[v + w] = (4278255360 & y) + L >>> 0;
      }
    }
    function Bt(r, a) {
      a.jd = 255 & r, a.hd = r >> 8 & 255, a.ud = r >> 16 & 255;
    }
    function ne(r, a, h, g, v, w) {
      var y;
      for (y = 0; y < g; ++y) {
        var _ = a[h + y], L = _ >>> 8, C = _, H = 255 & (H = (H = _ >>> 16) + ((r.jd << 24 >> 24) * (L << 24 >> 24) >>> 5));
        C = 255 & (C = (C += (r.hd << 24 >> 24) * (L << 24 >> 24) >>> 5) + ((r.ud << 24 >> 24) * (H << 24 >> 24) >>> 5)), v[w + y] = (4278255360 & _) + (H << 16) + C;
      }
    }
    function Tt(r, a, h, g, v) {
      z[a] = function(w, y, _, L, C, H, Z, F, W) {
        for (L = Z; L < F; ++L) for (Z = 0; Z < W; ++Z) C[H++] = v(_[g(w[y++])]);
      }, z[r] = function(w, y, _, L, C, H, Z) {
        var F = 8 >> w.b, W = w.Ea, K = w.K[0], ot = w.w;
        if (8 > F) for (w = (1 << w.b) - 1, ot = (1 << F) - 1; y < _; ++y) {
          var X, ut = 0;
          for (X = 0; X < W; ++X) X & w || (ut = g(L[C++])), H[Z++] = v(K[ut & ot]), ut >>= F;
        }
        else z["VP8LMapColor" + h](L, C, K, ot, H, Z, y, _, W);
      };
    }
    function Ue(r, a, h, g, v) {
      for (h = a + h; a < h; ) {
        var w = r[a++];
        g[v++] = w >> 16 & 255, g[v++] = w >> 8 & 255, g[v++] = 255 & w;
      }
    }
    function ge(r, a, h, g, v) {
      for (h = a + h; a < h; ) {
        var w = r[a++];
        g[v++] = w >> 16 & 255, g[v++] = w >> 8 & 255, g[v++] = 255 & w, g[v++] = w >> 24 & 255;
      }
    }
    function se(r, a, h, g, v) {
      for (h = a + h; a < h; ) {
        var w = (y = r[a++]) >> 16 & 240 | y >> 12 & 15, y = 240 & y | y >> 28 & 15;
        g[v++] = w, g[v++] = y;
      }
    }
    function oe(r, a, h, g, v) {
      for (h = a + h; a < h; ) {
        var w = (y = r[a++]) >> 16 & 248 | y >> 13 & 7, y = y >> 5 & 224 | y >> 3 & 31;
        g[v++] = w, g[v++] = y;
      }
    }
    function Ee(r, a, h, g, v) {
      for (h = a + h; a < h; ) {
        var w = r[a++];
        g[v++] = 255 & w, g[v++] = w >> 8 & 255, g[v++] = w >> 16 & 255;
      }
    }
    function qt(r, a, h, g, v, w) {
      if (w == 0) for (h = a + h; a < h; ) _t(g, ((w = r[a++])[0] >> 24 | w[1] >> 8 & 65280 | w[2] << 8 & 16711680 | w[3] << 24) >>> 0), v += 32;
      else i(g, v, r, a, h);
    }
    function Se(r, a) {
      z[a][0] = z[r + "0"], z[a][1] = z[r + "1"], z[a][2] = z[r + "2"], z[a][3] = z[r + "3"], z[a][4] = z[r + "4"], z[a][5] = z[r + "5"], z[a][6] = z[r + "6"], z[a][7] = z[r + "7"], z[a][8] = z[r + "8"], z[a][9] = z[r + "9"], z[a][10] = z[r + "10"], z[a][11] = z[r + "11"], z[a][12] = z[r + "12"], z[a][13] = z[r + "13"], z[a][14] = z[r + "0"], z[a][15] = z[r + "0"];
    }
    function Yt(r) {
      return r == Vs || r == Gs || r == Qa || r == Ys;
    }
    function Qt() {
      this.eb = [], this.size = this.A = this.fb = 0;
    }
    function Oe() {
      this.y = [], this.f = [], this.ea = [], this.F = [], this.Tc = this.Ed = this.Cd = this.Fd = this.lb = this.Db = this.Ab = this.fa = this.J = this.W = this.N = this.O = 0;
    }
    function le() {
      this.Rd = this.height = this.width = this.S = 0, this.f = {}, this.f.RGBA = new Qt(), this.f.kb = new Oe(), this.sd = null;
    }
    function Vt() {
      this.width = [0], this.height = [0], this.Pd = [0], this.Qd = [0], this.format = [0];
    }
    function ve() {
      this.Id = this.fd = this.Md = this.hb = this.ib = this.da = this.bd = this.cd = this.j = this.v = this.Da = this.Sd = this.ob = 0;
    }
    function $r(r) {
      return alert("todo:WebPSamplerProcessPlane"), r.T;
    }
    function un(r, a) {
      var h = r.T, g = a.ba.f.RGBA, v = g.eb, w = g.fb + r.ka * g.A, y = Un[a.ba.S], _ = r.y, L = r.O, C = r.f, H = r.N, Z = r.ea, F = r.W, W = a.cc, K = a.dc, ot = a.Mc, X = a.Nc, ut = r.ka, ht = r.ka + r.T, wt = r.U, bt = wt + 1 >> 1;
      for (ut == 0 ? y(_, L, null, null, C, H, Z, F, C, H, Z, F, v, w, null, null, wt) : (y(a.ec, a.fc, _, L, W, K, ot, X, C, H, Z, F, v, w - g.A, v, w, wt), ++h); ut + 2 < ht; ut += 2) W = C, K = H, ot = Z, X = F, H += r.Rc, F += r.Rc, w += 2 * g.A, y(_, (L += 2 * r.fa) - r.fa, _, L, W, K, ot, X, C, H, Z, F, v, w - g.A, v, w, wt);
      return L += r.fa, r.j + ht < r.o ? (i(a.ec, a.fc, _, L, wt), i(a.cc, a.dc, C, H, bt), i(a.Mc, a.Nc, Z, F, bt), h--) : 1 & ht || y(_, L, null, null, C, H, Z, F, C, H, Z, F, v, w + g.A, null, null, wt), h;
    }
    function dr(r, a, h) {
      var g = r.F, v = [r.J];
      if (g != null) {
        var w = r.U, y = a.ba.S, _ = y == Za || y == Qa;
        a = a.ba.f.RGBA;
        var L = [0], C = r.ka;
        L[0] = r.T, r.Kb && (C == 0 ? --L[0] : (--C, v[0] -= r.width), r.j + r.ka + r.T == r.o && (L[0] = r.o - r.j - C));
        var H = a.eb;
        C = a.fb + C * a.A, r = Uo(g, v[0], r.width, w, L, H, C + (_ ? 0 : 3), a.A), t(h == L), r && Yt(y) && ga(H, C, _, w, L, a.A);
      }
      return 0;
    }
    function Qn(r) {
      var a = r.ma, h = a.ba.S, g = 11 > h, v = h == Ka || h == Xa || h == Za || h == Ws || h == 12 || Yt(h);
      if (a.memory = null, a.Ib = null, a.Jb = null, a.Nd = null, !Dn(a.Oa, r, v ? 11 : 12)) return 0;
      if (v && Yt(h) && xr(), r.da) alert("todo:use_scaling");
      else {
        if (g) {
          if (a.Ib = $r, r.Kb) {
            if (h = r.U + 1 >> 1, a.memory = s(r.U + 2 * h), a.memory == null) return 0;
            a.ec = a.memory, a.fc = 0, a.cc = a.ec, a.dc = a.fc + r.U, a.Mc = a.cc, a.Nc = a.dc + h, a.Ib = un, xr();
          }
        } else alert("todo:EmitYUV");
        v && (a.Jb = dr, g && Me());
      }
      if (g && !rl) {
        for (r = 0; 256 > r; ++r) kh[r] = 89858 * (r - 128) + es >> ts, Ch[r] = -22014 * (r - 128) + es, Ih[r] = -45773 * (r - 128), Ph[r] = 113618 * (r - 128) + es >> ts;
        for (r = ba; r < Ks; ++r) a = 76283 * (r - 16) + es >> ts, Fh[r - ba] = nr(a, 255), Eh[r - ba] = nr(a + 8 >> 4, 15);
        rl = 1;
      }
      return 1;
    }
    function Gt(r) {
      var a = r.ma, h = r.U, g = r.T;
      return t(!(1 & r.ka)), 0 >= h || 0 >= g ? 0 : (h = a.Ib(r, a), a.Jb != null && a.Jb(r, a, h), a.Dc += h, 1);
    }
    function pr(r) {
      r.ma.memory = null;
    }
    function gr(r, a, h, g) {
      return xt(r, 8) != 47 ? 0 : (a[0] = xt(r, 14) + 1, h[0] = xt(r, 14) + 1, g[0] = xt(r, 1), xt(r, 3) != 0 ? 0 : !r.h);
    }
    function Bn(r, a) {
      if (4 > r) return r + 1;
      var h = r - 2 >> 1;
      return (2 + (1 & r) << h) + xt(a, h) + 1;
    }
    function Mn(r, a) {
      return 120 < a ? a - 120 : 1 <= (h = ((h = dh[a - 1]) >> 4) * r + (8 - (15 & h))) ? h : 1;
      var h;
    }
    function Re(r, a, h) {
      var g = R(h), v = r[a += 255 & g].g - 8;
      return 0 < v && ($(h, h.u + 8), g = R(h), a += r[a].value, a += g & (1 << v) - 1), $(h, h.u + r[a].g), r[a].value;
    }
    function nn(r, a, h) {
      return h.g += r.g, h.value += r.value << a >>> 0, t(8 >= h.g), r.g;
    }
    function rn(r, a, h) {
      var g = r.xc;
      return t((a = g == 0 ? 0 : r.vc[r.md * (h >> g) + (a >> g)]) < r.Wb), r.Ya[a];
    }
    function Kr(r, a, h, g) {
      var v = r.ab, w = r.c * a, y = r.C;
      a = y + a;
      var _ = h, L = g;
      for (g = r.Ta, h = r.Ua; 0 < v--; ) {
        var C = r.gc[v], H = y, Z = a, F = _, W = L, K = (L = g, _ = h, C.Ea);
        switch (t(H < Z), t(Z <= C.nc), C.hc) {
          case 2:
            Ui(F, W, (Z - H) * K, L, _);
            break;
          case 0:
            var ot = H, X = Z, ut = L, ht = _, wt = (Ot = C).Ea;
            ot == 0 && (jr(F, W, null, null, 1, ut, ht), ce(F, W + 1, 0, 0, wt - 1, ut, ht + 1), W += wt, ht += wt, ++ot);
            for (var bt = 1 << Ot.b, Rt = bt - 1, Pt = vt(wt, Ot.b), re = Ot.K, Ot = Ot.w + (ot >> Ot.b) * Pt; ot < X; ) {
              var fe = re, Ze = Ot, ie = 1;
              for (Br(F, W, ut, ht - wt, 1, ut, ht); ie < wt; ) {
                var jt = (ie & ~Rt) + bt;
                jt > wt && (jt = wt), (0, Gn[fe[Ze++] >> 8 & 15])(F, W + +ie, ut, ht + ie - wt, jt - ie, ut, ht + ie), ie = jt;
              }
              W += wt, ht += wt, ++ot & Rt || (Ot += Pt);
            }
            Z != C.nc && i(L, _ - K, L, _ + (Z - H - 1) * K, K);
            break;
          case 1:
            for (K = F, X = W, wt = (F = C.Ea) - (ht = F & ~(ut = (W = 1 << C.b) - 1)), ot = vt(F, C.b), bt = C.K, C = C.w + (H >> C.b) * ot; H < Z; ) {
              for (Rt = bt, Pt = C, re = new Ut(), Ot = X + ht, fe = X + F; X < Ot; ) Bt(Rt[Pt++], re), hi(re, K, X, W, L, _), X += W, _ += W;
              X < fe && (Bt(Rt[Pt++], re), hi(re, K, X, wt, L, _), X += wt, _ += wt), ++H & ut || (C += ot);
            }
            break;
          case 3:
            if (F == L && W == _ && 0 < C.b) {
              for (X = L, F = K = _ + (Z - H) * K - (ht = (Z - H) * vt(C.Ea, C.b)), W = L, ut = _, ot = [], ht = (wt = ht) - 1; 0 <= ht; --ht) ot[ht] = W[ut + ht];
              for (ht = wt - 1; 0 <= ht; --ht) X[F + ht] = ot[ht];
              ui(C, H, Z, L, K, L, _);
            } else ui(C, H, Z, F, W, L, _);
        }
        _ = g, L = h;
      }
      L != h && i(g, h, _, L, w);
    }
    function Ir(r, a) {
      var h = r.V, g = r.Ba + r.c * r.C, v = a - r.C;
      if (t(a <= r.l.o), t(16 >= v), 0 < v) {
        var w = r.l, y = r.Ta, _ = r.Ua, L = w.width;
        if (Kr(r, v, h, g), v = _ = [_], t((h = r.C) < (g = a)), t(w.v < w.va), g > w.o && (g = w.o), h < w.j) {
          var C = w.j - h;
          h = w.j, v[0] += C * L;
        }
        if (h >= g ? h = 0 : (v[0] += 4 * w.v, w.ka = h - w.j, w.U = w.va - w.v, w.T = g - h, h = 1), h) {
          if (_ = _[0], 11 > (h = r.ca).S) {
            var H = h.f.RGBA, Z = (g = h.S, v = w.U, w = w.T, C = H.eb, H.A), F = w;
            for (H = H.fb + r.Ma * H.A; 0 < F--; ) {
              var W = y, K = _, ot = v, X = C, ut = H;
              switch (g) {
                case $a:
                  fa(W, K, ot, X, ut);
                  break;
                case Ka:
                  da(W, K, ot, X, ut);
                  break;
                case Vs:
                  da(W, K, ot, X, ut), ga(X, ut, 0, ot, 1, 0);
                  break;
                case Jo:
                  fi(W, K, ot, X, ut);
                  break;
                case Xa:
                  qt(W, K, ot, X, ut, 1);
                  break;
                case Gs:
                  qt(W, K, ot, X, ut, 1), ga(X, ut, 0, ot, 1, 0);
                  break;
                case Za:
                  qt(W, K, ot, X, ut, 0);
                  break;
                case Qa:
                  qt(W, K, ot, X, ut, 0), ga(X, ut, 1, ot, 1, 0);
                  break;
                case Ws:
                  zi(W, K, ot, X, ut);
                  break;
                case Ys:
                  zi(W, K, ot, X, ut), qo(X, ut, ot, 1, 0);
                  break;
                case $o:
                  ci(W, K, ot, X, ut);
                  break;
                default:
                  t(0);
              }
              _ += L, H += Z;
            }
            r.Ma += w;
          } else alert("todo:EmitRescaledRowsYUVA");
          t(r.Ma <= h.height);
        }
      }
      r.C = a, t(r.C <= r.i);
    }
    function Hn(r) {
      var a;
      if (0 < r.ua) return 0;
      for (a = 0; a < r.Wb; ++a) {
        var h = r.Ya[a].G, g = r.Ya[a].H;
        if (0 < h[1][g[1] + 0].g || 0 < h[2][g[2] + 0].g || 0 < h[3][g[3] + 0].g) return 0;
      }
      return 1;
    }
    function tr(r, a, h, g, v, w) {
      if (r.Z != 0) {
        var y = r.qd, _ = r.rd;
        for (t(Dr[r.Z] != null); a < h; ++a) Dr[r.Z](y, _, g, v, g, v, w), y = g, _ = v, v += w;
        r.qd = y, r.rd = _;
      }
    }
    function Wn(r, a) {
      var h = r.l.ma, g = h.Z == 0 || h.Z == 1 ? r.l.j : r.C;
      if (g = r.C < g ? g : r.C, t(a <= r.l.o), a > g) {
        var v = r.l.width, w = h.ca, y = h.tb + v * g, _ = r.V, L = r.Ba + r.c * g, C = r.gc;
        t(r.ab == 1), t(C[0].hc == 3), zs(C[0], g, a, _, L, w, y), tr(h, g, a, w, y, v);
      }
      r.C = r.Ma = a;
    }
    function Vn(r, a, h, g, v, w, y) {
      var _ = r.$ / g, L = r.$ % g, C = r.m, H = r.s, Z = h + r.$, F = Z;
      v = h + g * v;
      var W = h + g * w, K = 280 + H.ua, ot = r.Pb ? _ : 16777216, X = 0 < H.ua ? H.Wa : null, ut = H.wc, ht = Z < W ? rn(H, L, _) : null;
      t(r.C < w), t(W <= v);
      var wt = !1;
      t: for (; ; ) {
        for (; wt || Z < W; ) {
          var bt = 0;
          if (_ >= ot) {
            var Rt = Z - h;
            t((ot = r).Pb), ot.wd = ot.m, ot.xd = Rt, 0 < ot.s.ua && Lt(ot.s.Wa, ot.s.vb), ot = _ + gh;
          }
          if (L & ut || (ht = rn(H, L, _)), t(ht != null), ht.Qb && (a[Z] = ht.qb, wt = !0), !wt) if (Q(C), ht.jc) {
            bt = C, Rt = a;
            var Pt = Z, re = ht.pd[R(bt) & Di - 1];
            t(ht.jc), 256 > re.g ? ($(bt, bt.u + re.g), Rt[Pt] = re.value, bt = 0) : ($(bt, bt.u + re.g - 256), t(256 <= re.value), bt = re.value), bt == 0 && (wt = !0);
          } else bt = Re(ht.G[0], ht.H[0], C);
          if (C.h) break;
          if (wt || 256 > bt) {
            if (!wt) if (ht.nd) a[Z] = (ht.qb | bt << 8) >>> 0;
            else {
              if (Q(C), wt = Re(ht.G[1], ht.H[1], C), Q(C), Rt = Re(ht.G[2], ht.H[2], C), Pt = Re(ht.G[3], ht.H[3], C), C.h) break;
              a[Z] = (Pt << 24 | wt << 16 | bt << 8 | Rt) >>> 0;
            }
            if (wt = !1, ++Z, ++L >= g && (L = 0, ++_, y != null && _ <= w && !(_ % 16) && y(r, _), X != null)) for (; F < Z; ) bt = a[F++], X.X[(506832829 * bt & 4294967295) >>> X.Mb] = bt;
          } else if (280 > bt) {
            if (bt = Bn(bt - 256, C), Rt = Re(ht.G[4], ht.H[4], C), Q(C), Rt = Mn(g, Rt = Bn(Rt, C)), C.h) break;
            if (Z - h < Rt || v - Z < bt) break t;
            for (Pt = 0; Pt < bt; ++Pt) a[Z + Pt] = a[Z + Pt - Rt];
            for (Z += bt, L += bt; L >= g; ) L -= g, ++_, y != null && _ <= w && !(_ % 16) && y(r, _);
            if (t(Z <= v), L & ut && (ht = rn(H, L, _)), X != null) for (; F < Z; ) bt = a[F++], X.X[(506832829 * bt & 4294967295) >>> X.Mb] = bt;
          } else {
            if (!(bt < K)) break t;
            for (wt = bt - 280, t(X != null); F < Z; ) bt = a[F++], X.X[(506832829 * bt & 4294967295) >>> X.Mb] = bt;
            bt = Z, t(!(wt >>> (Rt = X).Xa)), a[bt] = Rt.X[wt], wt = !0;
          }
          wt || t(C.h == V(C));
        }
        if (r.Pb && C.h && Z < v) t(r.m.h), r.a = 5, r.m = r.wd, r.$ = r.xd, 0 < r.s.ua && Lt(r.s.vb, r.s.Wa);
        else {
          if (C.h) break t;
          y?.(r, _ > w ? w : _), r.a = 0, r.$ = Z - h;
        }
        return 1;
      }
      return r.a = 3, 0;
    }
    function Rn(r) {
      t(r != null), r.vc = null, r.yc = null, r.Ya = null;
      var a = r.Wa;
      a != null && (a.X = null), r.vb = null, t(r != null);
    }
    function Xr() {
      var r = new Et();
      return r == null ? null : (r.a = 0, r.xb = Zo, Se("Predictor", "VP8LPredictors"), Se("Predictor", "VP8LPredictors_C"), Se("PredictorAdd", "VP8LPredictorsAdd"), Se("PredictorAdd", "VP8LPredictorsAdd_C"), Ui = he, hi = ne, fa = Ue, da = ge, zi = se, ci = oe, fi = Ee, z.VP8LMapColor32b = Ke, z.VP8LMapColor8b = or, r);
    }
    function er(r, a, h, g, v) {
      var w = 1, y = [r], _ = [a], L = g.m, C = g.s, H = null, Z = 0;
      t: for (; ; ) {
        if (h) for (; w && xt(L, 1); ) {
          var F = y, W = _, K = g, ot = 1, X = K.m, ut = K.gc[K.ab], ht = xt(X, 2);
          if (K.Oc & 1 << ht) w = 0;
          else {
            switch (K.Oc |= 1 << ht, ut.hc = ht, ut.Ea = F[0], ut.nc = W[0], ut.K = [null], ++K.ab, t(4 >= K.ab), ht) {
              case 0:
              case 1:
                ut.b = xt(X, 3) + 2, ot = er(vt(ut.Ea, ut.b), vt(ut.nc, ut.b), 0, K, ut.K), ut.K = ut.K[0];
                break;
              case 3:
                var wt, bt = xt(X, 8) + 1, Rt = 16 < bt ? 0 : 4 < bt ? 1 : 2 < bt ? 2 : 3;
                if (F[0] = vt(ut.Ea, Rt), ut.b = Rt, wt = ot = er(bt, 1, 0, K, ut.K)) {
                  var Pt, re = bt, Ot = ut, fe = 1 << (8 >> Ot.b), Ze = s(fe);
                  if (Ze == null) wt = 0;
                  else {
                    var ie = Ot.K[0], jt = Ot.w;
                    for (Ze[0] = Ot.K[0][0], Pt = 1; Pt < 1 * re; ++Pt) Ze[Pt] = Wt(ie[jt + Pt], Ze[Pt - 1]);
                    for (; Pt < 4 * fe; ++Pt) Ze[Pt] = 0;
                    Ot.K[0] = null, Ot.K[0] = Ze, wt = 1;
                  }
                }
                ot = wt;
                break;
              case 2:
                break;
              default:
                t(0);
            }
            w = ot;
          }
        }
        if (y = y[0], _ = _[0], w && xt(L, 1) && !(w = 1 <= (Z = xt(L, 4)) && 11 >= Z)) {
          g.a = 3;
          break t;
        }
        var Nt;
        if (Nt = w) e: {
          var He, ee, pe, Fe = g, sn = y, yn = _, Te = Z, dn = h, xn = Fe.m, Qe = Fe.s, me = [null], we = 1, De = 0, ye = ph[Te];
          n: for (; ; ) {
            if (dn && xt(xn, 1)) {
              var on = xt(xn, 3) + 2, Jn = vt(sn, on), We = vt(yn, on), Nn = Jn * We;
              if (!er(Jn, We, 0, Fe, me)) break n;
              for (me = me[0], Qe.xc = on, He = 0; He < Nn; ++He) {
                var Ne = me[He] >> 8 & 65535;
                me[He] = Ne, Ne >= we && (we = Ne + 1);
              }
            }
            if (xn.h) break n;
            for (ee = 0; 5 > ee; ++ee) {
              var tn = Ko[ee];
              !ee && 0 < Te && (tn += 1 << Te), De < tn && (De = tn);
            }
            var In = f(we * ye, q), _n = we, Cn = f(_n, rt);
            if (Cn == null) var Fn = null;
            else t(65536 >= _n), Fn = Cn;
            var Ln = s(De);
            if (Fn == null || Ln == null || In == null) {
              Fe.a = 1;
              break n;
            }
            var En = In;
            for (He = pe = 0; He < we; ++He) {
              var Ie = Fn[He], On = Ie.G, $n = Ie.H, di = 0, Lr = 1, ln = 0;
              for (ee = 0; 5 > ee; ++ee) {
                tn = Ko[ee], On[ee] = En, $n[ee] = pe, !ee && 0 < Te && (tn += 1 << Te);
                i: {
                  var rs, Xs = tn, is = Fe, va = Ln, Bh = En, Mh = pe, Zs = 0, qr = is.m, Rh = xt(qr, 1);
                  if (o(va, 0, 0, Xs), Rh) {
                    var Th = xt(qr, 1) + 1, Dh = xt(qr, 1), sl = xt(qr, Dh == 0 ? 1 : 8);
                    va[sl] = 1, Th == 2 && (va[sl = xt(qr, 8)] = 1);
                    var as = 1;
                  } else {
                    var ol = s(19), ll = xt(qr, 4) + 4;
                    if (19 < ll) {
                      is.a = 3;
                      var ss = 0;
                      break i;
                    }
                    for (rs = 0; rs < ll; ++rs) ol[fh[rs]] = xt(qr, 3);
                    var Qs = void 0, wa = void 0, ul = is, qh = ol, os = Xs, hl = va, to = 0, Ur = ul.m, cl = 8, fl = f(128, q);
                    r: for (; E(fl, 0, 7, qh, 19); ) {
                      if (xt(Ur, 1)) {
                        var Uh = 2 + 2 * xt(Ur, 3);
                        if ((Qs = 2 + xt(Ur, Uh)) > os) break r;
                      } else Qs = os;
                      for (wa = 0; wa < os && Qs--; ) {
                        Q(Ur);
                        var dl = fl[0 + (127 & R(Ur))];
                        $(Ur, Ur.u + dl.g);
                        var Vi = dl.value;
                        if (16 > Vi) hl[wa++] = Vi, Vi != 0 && (cl = Vi);
                        else {
                          var zh = Vi == 16, pl = Vi - 16, Hh = hh[pl], gl = xt(Ur, uh[pl]) + Hh;
                          if (wa + gl > os) break r;
                          for (var Wh = zh ? cl : 0; 0 < gl--; ) hl[wa++] = Wh;
                        }
                      }
                      to = 1;
                      break r;
                    }
                    to || (ul.a = 3), as = to;
                  }
                  (as = as && !qr.h) && (Zs = E(Bh, Mh, 8, va, Xs)), as && Zs != 0 ? ss = Zs : (is.a = 3, ss = 0);
                }
                if (ss == 0) break n;
                if (Lr && ch[ee] == 1 && (Lr = En[pe].g == 0), di += En[pe].g, pe += ss, 3 >= ee) {
                  var ya, eo = Ln[0];
                  for (ya = 1; ya < tn; ++ya) Ln[ya] > eo && (eo = Ln[ya]);
                  ln += eo;
                }
              }
              if (Ie.nd = Lr, Ie.Qb = 0, Lr && (Ie.qb = (On[3][$n[3] + 0].value << 24 | On[1][$n[1] + 0].value << 16 | On[2][$n[2] + 0].value) >>> 0, di == 0 && 256 > On[0][$n[0] + 0].value && (Ie.Qb = 1, Ie.qb += On[0][$n[0] + 0].value << 8)), Ie.jc = !Ie.Qb && 6 > ln, Ie.jc) {
                var ls, Sr = Ie;
                for (ls = 0; ls < Di; ++ls) {
                  var zr = ls, Hr = Sr.pd[zr], us = Sr.G[0][Sr.H[0] + zr];
                  256 <= us.value ? (Hr.g = us.g + 256, Hr.value = us.value) : (Hr.g = 0, Hr.value = 0, zr >>= nn(us, 8, Hr), zr >>= nn(Sr.G[1][Sr.H[1] + zr], 16, Hr), zr >>= nn(Sr.G[2][Sr.H[2] + zr], 0, Hr), nn(Sr.G[3][Sr.H[3] + zr], 24, Hr));
                }
              }
            }
            Qe.vc = me, Qe.Wb = we, Qe.Ya = Fn, Qe.yc = In, Nt = 1;
            break e;
          }
          Nt = 0;
        }
        if (!(w = Nt)) {
          g.a = 3;
          break t;
        }
        if (0 < Z) {
          if (C.ua = 1 << Z, !k(C.Wa, Z)) {
            g.a = 1, w = 0;
            break t;
          }
        } else C.ua = 0;
        var no = g, ml = y, Vh = _, ro = no.s, io = ro.xc;
        if (no.c = ml, no.i = Vh, ro.md = vt(ml, io), ro.wc = io == 0 ? -1 : (1 << io) - 1, h) {
          g.xb = _h;
          break t;
        }
        if ((H = s(y * _)) == null) {
          g.a = 1, w = 0;
          break t;
        }
        w = (w = Vn(g, H, 0, y, _, _, null)) && !L.h;
        break t;
      }
      return w ? (v != null ? v[0] = H : (t(H == null), t(h)), g.$ = 0, h || Rn(C)) : Rn(C), w;
    }
    function Zr(r, a) {
      var h = r.c * r.i, g = h + a + 16 * a;
      return t(r.c <= a), r.V = s(g), r.V == null ? (r.Ta = null, r.Ua = 0, r.a = 1, 0) : (r.Ta = r.V, r.Ua = r.Ba + h + a, 1);
    }
    function Ni(r, a) {
      var h = r.C, g = a - h, v = r.V, w = r.Ba + r.c * h;
      for (t(a <= r.l.o); 0 < g; ) {
        var y = 16 < g ? 16 : g, _ = r.l.ma, L = r.l.width, C = L * y, H = _.ca, Z = _.tb + L * h, F = r.Ta, W = r.Ua;
        Kr(r, y, v, w), zo(F, W, H, Z, C), tr(_, h, h + y, H, Z, L), g -= y, v += y * r.c, h += y;
      }
      t(h == a), r.C = r.Ma = a;
    }
    function Li() {
      this.ub = this.yd = this.td = this.Rb = 0;
    }
    function Si() {
      this.Kd = this.Ld = this.Ud = this.Td = this.i = this.c = 0;
    }
    function Ns() {
      this.Fb = this.Bb = this.Cb = 0, this.Zb = s(4), this.Lb = s(4);
    }
    function Zi() {
      this.Yb = (function() {
        var r = [];
        return (function a(h, g, v) {
          for (var w = v[g], y = 0; y < w && (h.push(v.length > g + 1 ? [] : 0), !(v.length < g + 1)); y++) a(h[y], g + 1, v);
        })(r, 0, [3, 11]), r;
      })();
    }
    function Ca() {
      this.jb = s(3), this.Wc = u([4, 8], Zi), this.Xc = u([4, 17], Zi);
    }
    function Fa() {
      this.Pc = this.wb = this.Tb = this.zd = 0, this.vd = new s(4), this.od = new s(4);
    }
    function Tn() {
      this.ld = this.La = this.dd = this.tc = 0;
    }
    function Qi() {
      this.Na = this.la = 0;
    }
    function Ea() {
      this.Sc = [0, 0], this.Eb = [0, 0], this.Qc = [0, 0], this.ia = this.lc = 0;
    }
    function ta() {
      this.ad = s(384), this.Za = 0, this.Ob = s(16), this.$b = this.Ad = this.ia = this.Gc = this.Hc = this.Dd = 0;
    }
    function Oa() {
      this.uc = this.M = this.Nb = 0, this.wa = Array(new Tn()), this.Y = 0, this.ya = Array(new ta()), this.aa = 0, this.l = new ki();
    }
    function ja() {
      this.y = s(16), this.f = s(8), this.ea = s(8);
    }
    function Ba() {
      this.cb = this.a = 0, this.sc = "", this.m = new x(), this.Od = new Li(), this.Kc = new Si(), this.ed = new Fa(), this.Qa = new Ns(), this.Ic = this.$c = this.Aa = 0, this.D = new Oa(), this.Xb = this.Va = this.Hb = this.zb = this.yb = this.Ub = this.za = 0, this.Jc = f(8, x), this.ia = 0, this.pb = f(4, Ea), this.Pa = new Ca(), this.Bd = this.kc = 0, this.Ac = [], this.Bc = 0, this.zc = [0, 0, 0, 0], this.Gd = Array(new ja()), this.Hd = 0, this.rb = Array(new Qi()), this.sb = 0, this.wa = Array(new Tn()), this.Y = 0, this.oc = [], this.pc = 0, this.sa = [], this.ta = 0, this.qa = [], this.ra = 0, this.Ha = [], this.B = this.R = this.Ia = 0, this.Ec = [], this.M = this.ja = this.Vb = this.Fc = 0, this.ya = Array(new ta()), this.L = this.aa = 0, this.gd = u([4, 2], Tn), this.ga = null, this.Fa = [], this.Cc = this.qc = this.P = 0, this.Gb = [], this.Uc = 0, this.mb = [], this.nb = 0, this.rc = [], this.Ga = this.Vc = 0;
    }
    function nr(r, a) {
      return 0 > r ? 0 : r > a ? a : r;
    }
    function ki() {
      this.T = this.U = this.ka = this.height = this.width = 0, this.y = [], this.f = [], this.ea = [], this.Rc = this.fa = this.W = this.N = this.O = 0, this.ma = "void", this.put = "VP8IoPutHook", this.ac = "VP8IoSetupHook", this.bc = "VP8IoTeardownHook", this.ha = this.Kb = 0, this.data = [], this.hb = this.ib = this.da = this.o = this.j = this.va = this.v = this.Da = this.ob = this.w = 0, this.F = [], this.J = 0;
    }
    function Ls() {
      var r = new Ba();
      return r != null && (r.a = 0, r.sc = "OK", r.cb = 0, r.Xb = 0, ma || (ma = Pi)), r;
    }
    function Je(r, a, h) {
      return r.a == 0 && (r.a = a, r.sc = h, r.cb = 0), 0;
    }
    function Ma(r, a, h) {
      return 3 <= h && r[a + 0] == 157 && r[a + 1] == 1 && r[a + 2] == 42;
    }
    function rr(r, a) {
      if (r == null) return 0;
      if (r.a = 0, r.sc = "OK", a == null) return Je(r, 2, "null VP8Io passed to VP8GetHeaders()");
      var h = a.data, g = a.w, v = a.ha;
      if (4 > v) return Je(r, 7, "Truncated header.");
      var w = h[g + 0] | h[g + 1] << 8 | h[g + 2] << 16, y = r.Od;
      if (y.Rb = !(1 & w), y.td = w >> 1 & 7, y.yd = w >> 4 & 1, y.ub = w >> 5, 3 < y.td) return Je(r, 3, "Incorrect keyframe parameters.");
      if (!y.yd) return Je(r, 4, "Frame not displayable.");
      g += 3, v -= 3;
      var _ = r.Kc;
      if (y.Rb) {
        if (7 > v) return Je(r, 7, "cannot parse picture header");
        if (!Ma(h, g, v)) return Je(r, 3, "Bad code word");
        _.c = 16383 & (h[g + 4] << 8 | h[g + 3]), _.Td = h[g + 4] >> 6, _.i = 16383 & (h[g + 6] << 8 | h[g + 5]), _.Ud = h[g + 6] >> 6, g += 7, v -= 7, r.za = _.c + 15 >> 4, r.Ub = _.i + 15 >> 4, a.width = _.c, a.height = _.i, a.Da = 0, a.j = 0, a.v = 0, a.va = a.width, a.o = a.height, a.da = 0, a.ib = a.width, a.hb = a.height, a.U = a.width, a.T = a.height, o((w = r.Pa).jb, 0, 255, w.jb.length), t((w = r.Qa) != null), w.Cb = 0, w.Bb = 0, w.Fb = 1, o(w.Zb, 0, 0, w.Zb.length), o(w.Lb, 0, 0, w.Lb);
      }
      if (y.ub > v) return Je(r, 7, "bad partition length");
      ct(w = r.m, h, g, y.ub), g += y.ub, v -= y.ub, y.Rb && (_.Ld = at(w), _.Kd = at(w)), _ = r.Qa;
      var L, C = r.Pa;
      if (t(w != null), t(_ != null), _.Cb = at(w), _.Cb) {
        if (_.Bb = at(w), at(w)) {
          for (_.Fb = at(w), L = 0; 4 > L; ++L) _.Zb[L] = at(w) ? nt(w, 7) : 0;
          for (L = 0; 4 > L; ++L) _.Lb[L] = at(w) ? nt(w, 6) : 0;
        }
        if (_.Bb) for (L = 0; 3 > L; ++L) C.jb[L] = at(w) ? pt(w, 8) : 255;
      } else _.Bb = 0;
      if (w.Ka) return Je(r, 3, "cannot parse segment header");
      if ((_ = r.ed).zd = at(w), _.Tb = pt(w, 6), _.wb = pt(w, 3), _.Pc = at(w), _.Pc && at(w)) {
        for (C = 0; 4 > C; ++C) at(w) && (_.vd[C] = nt(w, 6));
        for (C = 0; 4 > C; ++C) at(w) && (_.od[C] = nt(w, 6));
      }
      if (r.L = _.Tb == 0 ? 0 : _.zd ? 1 : 2, w.Ka) return Je(r, 3, "cannot parse filter header");
      var H = v;
      if (v = L = g, g = L + H, _ = H, r.Xb = (1 << pt(r.m, 2)) - 1, H < 3 * (C = r.Xb)) h = 7;
      else {
        for (L += 3 * C, _ -= 3 * C, H = 0; H < C; ++H) {
          var Z = h[v + 0] | h[v + 1] << 8 | h[v + 2] << 16;
          Z > _ && (Z = _), ct(r.Jc[+H], h, L, Z), L += Z, _ -= Z, v += 3;
        }
        ct(r.Jc[+C], h, L, _), h = L < g ? 0 : 5;
      }
      if (h != 0) return Je(r, h, "cannot parse partitions");
      for (h = pt(L = r.m, 7), v = at(L) ? nt(L, 4) : 0, g = at(L) ? nt(L, 4) : 0, _ = at(L) ? nt(L, 4) : 0, C = at(L) ? nt(L, 4) : 0, L = at(L) ? nt(L, 4) : 0, H = r.Qa, Z = 0; 4 > Z; ++Z) {
        if (H.Cb) {
          var F = H.Zb[Z];
          H.Fb || (F += h);
        } else {
          if (0 < Z) {
            r.pb[Z] = r.pb[0];
            continue;
          }
          F = h;
        }
        var W = r.pb[Z];
        W.Sc[0] = Js[nr(F + v, 127)], W.Sc[1] = $s[nr(F + 0, 127)], W.Eb[0] = 2 * Js[nr(F + g, 127)], W.Eb[1] = 101581 * $s[nr(F + _, 127)] >> 16, 8 > W.Eb[1] && (W.Eb[1] = 8), W.Qc[0] = Js[nr(F + C, 117)], W.Qc[1] = $s[nr(F + L, 127)], W.lc = F + L;
      }
      if (!y.Rb) return Je(r, 4, "Not a key frame.");
      for (at(w), y = r.Pa, h = 0; 4 > h; ++h) {
        for (v = 0; 8 > v; ++v) for (g = 0; 3 > g; ++g) for (_ = 0; 11 > _; ++_) C = dt(w, yh[h][v][g][_]) ? pt(w, 8) : vh[h][v][g][_], y.Wc[h][v].Yb[g][_] = C;
        for (v = 0; 17 > v; ++v) y.Xc[h][v] = y.Wc[h][xh[v]];
      }
      return r.kc = at(w), r.kc && (r.Bd = pt(w, 8)), r.cb = 1;
    }
    function Pi(r, a, h, g, v, w, y) {
      var _ = a[v].Yb[h];
      for (h = 0; 16 > v; ++v) {
        if (!dt(r, _[h + 0])) return v;
        for (; !dt(r, _[h + 1]); ) if (_ = a[++v].Yb[0], h = 0, v == 16) return 16;
        var L = a[v + 1].Yb;
        if (dt(r, _[h + 2])) {
          var C = r, H = 0;
          if (dt(C, (F = _)[(Z = h) + 3])) if (dt(C, F[Z + 6])) {
            for (_ = 0, Z = 2 * (H = dt(C, F[Z + 8])) + (F = dt(C, F[Z + 9 + H])), H = 0, F = mh[Z]; F[_]; ++_) H += H + dt(C, F[_]);
            H += 3 + (8 << Z);
          } else dt(C, F[Z + 7]) ? (H = 7 + 2 * dt(C, 165), H += dt(C, 145)) : H = 5 + dt(C, 159);
          else H = dt(C, F[Z + 4]) ? 3 + dt(C, F[Z + 5]) : 2;
          _ = L[2];
        } else H = 1, _ = L[1];
        L = y + bh[v], 0 > (C = r).b && it(C);
        var Z, F = C.b, W = (Z = C.Ca >> 1) - (C.I >> F) >> 31;
        --C.b, C.Ca += W, C.Ca |= 1, C.I -= (Z + 1 & W) << F, w[L] = ((H ^ W) - W) * g[(0 < v) + 0];
      }
      return 16;
    }
    function ea(r) {
      var a = r.rb[r.sb - 1];
      a.la = 0, a.Na = 0, o(r.zc, 0, 0, r.zc.length), r.ja = 0;
    }
    function kn(r, a, h, g, v) {
      v = r[a + h + 32 * g] + (v >> 3), r[a + h + 32 * g] = -256 & v ? 0 > v ? 0 : 255 : v;
    }
    function Ii(r, a, h, g, v, w) {
      kn(r, a, 0, h, g + v), kn(r, a, 1, h, g + w), kn(r, a, 2, h, g - w), kn(r, a, 3, h, g - v);
    }
    function mr(r) {
      return (20091 * r >> 16) + r;
    }
    function an(r, a, h, g) {
      var v, w = 0, y = s(16);
      for (v = 0; 4 > v; ++v) {
        var _ = r[a + 0] + r[a + 8], L = r[a + 0] - r[a + 8], C = (35468 * r[a + 4] >> 16) - mr(r[a + 12]), H = mr(r[a + 4]) + (35468 * r[a + 12] >> 16);
        y[w + 0] = _ + H, y[w + 1] = L + C, y[w + 2] = L - C, y[w + 3] = _ - H, w += 4, a++;
      }
      for (v = w = 0; 4 > v; ++v) _ = (r = y[w + 0] + 4) + y[w + 8], L = r - y[w + 8], C = (35468 * y[w + 4] >> 16) - mr(y[w + 12]), kn(h, g, 0, 0, _ + (H = mr(y[w + 4]) + (35468 * y[w + 12] >> 16))), kn(h, g, 1, 0, L + C), kn(h, g, 2, 0, L - C), kn(h, g, 3, 0, _ - H), w++, g += 32;
    }
    function Ra(r, a, h, g) {
      var v = r[a + 0] + 4, w = 35468 * r[a + 4] >> 16, y = mr(r[a + 4]), _ = 35468 * r[a + 1] >> 16;
      Ii(h, g, 0, v + y, r = mr(r[a + 1]), _), Ii(h, g, 1, v + w, r, _), Ii(h, g, 2, v - w, r, _), Ii(h, g, 3, v - y, r, _);
    }
    function Ss(r, a, h, g, v) {
      an(r, a, h, g), v && an(r, a + 16, h, g + 4);
    }
    function ks(r, a, h, g) {
      _r(r, a + 0, h, g, 1), _r(r, a + 32, h, g + 128, 1);
    }
    function Ps(r, a, h, g) {
      var v;
      for (r = r[a + 0] + 4, v = 0; 4 > v; ++v) for (a = 0; 4 > a; ++a) kn(h, g, a, v, r);
    }
    function ir(r, a, h, g) {
      r[a + 0] && fn(r, a + 0, h, g), r[a + 16] && fn(r, a + 16, h, g + 4), r[a + 32] && fn(r, a + 32, h, g + 128), r[a + 48] && fn(r, a + 48, h, g + 128 + 4);
    }
    function Ta(r, a, h, g) {
      var v, w = s(16);
      for (v = 0; 4 > v; ++v) {
        var y = r[a + 0 + v] + r[a + 12 + v], _ = r[a + 4 + v] + r[a + 8 + v], L = r[a + 4 + v] - r[a + 8 + v], C = r[a + 0 + v] - r[a + 12 + v];
        w[0 + v] = y + _, w[8 + v] = y - _, w[4 + v] = C + L, w[12 + v] = C - L;
      }
      for (v = 0; 4 > v; ++v) y = (r = w[0 + 4 * v] + 3) + w[3 + 4 * v], _ = w[1 + 4 * v] + w[2 + 4 * v], L = w[1 + 4 * v] - w[2 + 4 * v], C = r - w[3 + 4 * v], h[g + 0] = y + _ >> 3, h[g + 16] = C + L >> 3, h[g + 32] = y - _ >> 3, h[g + 48] = C - L >> 3, g += 64;
    }
    function Ci(r, a, h) {
      var g, v = a - 32, w = Pn, y = 255 - r[v - 1];
      for (g = 0; g < h; ++g) {
        var _, L = w, C = y + r[a - 1];
        for (_ = 0; _ < h; ++_) r[a + _] = L[C + r[v + _]];
        a += 32;
      }
    }
    function Fi(r, a) {
      Ci(r, a, 4);
    }
    function na(r, a) {
      Ci(r, a, 8);
    }
    function Is(r, a) {
      Ci(r, a, 16);
    }
    function Cs(r, a) {
      var h;
      for (h = 0; 16 > h; ++h) i(r, a + 32 * h, r, a - 32, 16);
    }
    function Fs(r, a) {
      var h;
      for (h = 16; 0 < h; --h) o(r, a, r[a - 1], 16), a += 32;
    }
    function Cr(r, a, h) {
      var g;
      for (g = 0; 16 > g; ++g) o(a, h + 32 * g, r, 16);
    }
    function Da(r, a) {
      var h, g = 16;
      for (h = 0; 16 > h; ++h) g += r[a - 1 + 32 * h] + r[a + h - 32];
      Cr(g >> 5, r, a);
    }
    function Fr(r, a) {
      var h, g = 8;
      for (h = 0; 16 > h; ++h) g += r[a - 1 + 32 * h];
      Cr(g >> 4, r, a);
    }
    function Es(r, a) {
      var h, g = 8;
      for (h = 0; 16 > h; ++h) g += r[a + h - 32];
      Cr(g >> 4, r, a);
    }
    function Qr(r, a) {
      Cr(128, r, a);
    }
    function Jt(r, a, h) {
      return r + 2 * a + h + 2 >> 2;
    }
    function Os(r, a) {
      var h, g = a - 32;
      for (g = new Uint8Array([Jt(r[g - 1], r[g + 0], r[g + 1]), Jt(r[g + 0], r[g + 1], r[g + 2]), Jt(r[g + 1], r[g + 2], r[g + 3]), Jt(r[g + 2], r[g + 3], r[g + 4])]), h = 0; 4 > h; ++h) i(r, a + 32 * h, g, 0, g.length);
    }
    function js(r, a) {
      var h = r[a - 1], g = r[a - 1 + 32], v = r[a - 1 + 64], w = r[a - 1 + 96];
      _t(r, a + 0, 16843009 * Jt(r[a - 1 - 32], h, g)), _t(r, a + 32, 16843009 * Jt(h, g, v)), _t(r, a + 64, 16843009 * Jt(g, v, w)), _t(r, a + 96, 16843009 * Jt(v, w, w));
    }
    function Bs(r, a) {
      var h, g = 4;
      for (h = 0; 4 > h; ++h) g += r[a + h - 32] + r[a - 1 + 32 * h];
      for (g >>= 3, h = 0; 4 > h; ++h) o(r, a + 32 * h, g, 4);
    }
    function Ms(r, a) {
      var h = r[a - 1 + 0], g = r[a - 1 + 32], v = r[a - 1 + 64], w = r[a - 1 - 32], y = r[a + 0 - 32], _ = r[a + 1 - 32], L = r[a + 2 - 32], C = r[a + 3 - 32];
      r[a + 0 + 96] = Jt(g, v, r[a - 1 + 96]), r[a + 1 + 96] = r[a + 0 + 64] = Jt(h, g, v), r[a + 2 + 96] = r[a + 1 + 64] = r[a + 0 + 32] = Jt(w, h, g), r[a + 3 + 96] = r[a + 2 + 64] = r[a + 1 + 32] = r[a + 0 + 0] = Jt(y, w, h), r[a + 3 + 64] = r[a + 2 + 32] = r[a + 1 + 0] = Jt(_, y, w), r[a + 3 + 32] = r[a + 2 + 0] = Jt(L, _, y), r[a + 3 + 0] = Jt(C, L, _);
    }
    function Rs(r, a) {
      var h = r[a + 1 - 32], g = r[a + 2 - 32], v = r[a + 3 - 32], w = r[a + 4 - 32], y = r[a + 5 - 32], _ = r[a + 6 - 32], L = r[a + 7 - 32];
      r[a + 0 + 0] = Jt(r[a + 0 - 32], h, g), r[a + 1 + 0] = r[a + 0 + 32] = Jt(h, g, v), r[a + 2 + 0] = r[a + 1 + 32] = r[a + 0 + 64] = Jt(g, v, w), r[a + 3 + 0] = r[a + 2 + 32] = r[a + 1 + 64] = r[a + 0 + 96] = Jt(v, w, y), r[a + 3 + 32] = r[a + 2 + 64] = r[a + 1 + 96] = Jt(w, y, _), r[a + 3 + 64] = r[a + 2 + 96] = Jt(y, _, L), r[a + 3 + 96] = Jt(_, L, L);
    }
    function br(r, a) {
      var h = r[a - 1 + 0], g = r[a - 1 + 32], v = r[a - 1 + 64], w = r[a - 1 - 32], y = r[a + 0 - 32], _ = r[a + 1 - 32], L = r[a + 2 - 32], C = r[a + 3 - 32];
      r[a + 0 + 0] = r[a + 1 + 64] = w + y + 1 >> 1, r[a + 1 + 0] = r[a + 2 + 64] = y + _ + 1 >> 1, r[a + 2 + 0] = r[a + 3 + 64] = _ + L + 1 >> 1, r[a + 3 + 0] = L + C + 1 >> 1, r[a + 0 + 96] = Jt(v, g, h), r[a + 0 + 64] = Jt(g, h, w), r[a + 0 + 32] = r[a + 1 + 96] = Jt(h, w, y), r[a + 1 + 32] = r[a + 2 + 96] = Jt(w, y, _), r[a + 2 + 32] = r[a + 3 + 96] = Jt(y, _, L), r[a + 3 + 32] = Jt(_, L, C);
    }
    function vr(r, a) {
      var h = r[a + 0 - 32], g = r[a + 1 - 32], v = r[a + 2 - 32], w = r[a + 3 - 32], y = r[a + 4 - 32], _ = r[a + 5 - 32], L = r[a + 6 - 32], C = r[a + 7 - 32];
      r[a + 0 + 0] = h + g + 1 >> 1, r[a + 1 + 0] = r[a + 0 + 64] = g + v + 1 >> 1, r[a + 2 + 0] = r[a + 1 + 64] = v + w + 1 >> 1, r[a + 3 + 0] = r[a + 2 + 64] = w + y + 1 >> 1, r[a + 0 + 32] = Jt(h, g, v), r[a + 1 + 32] = r[a + 0 + 96] = Jt(g, v, w), r[a + 2 + 32] = r[a + 1 + 96] = Jt(v, w, y), r[a + 3 + 32] = r[a + 2 + 96] = Jt(w, y, _), r[a + 3 + 64] = Jt(y, _, L), r[a + 3 + 96] = Jt(_, L, C);
    }
    function Ts(r, a) {
      var h = r[a - 1 + 0], g = r[a - 1 + 32], v = r[a - 1 + 64], w = r[a - 1 + 96];
      r[a + 0 + 0] = h + g + 1 >> 1, r[a + 2 + 0] = r[a + 0 + 32] = g + v + 1 >> 1, r[a + 2 + 32] = r[a + 0 + 64] = v + w + 1 >> 1, r[a + 1 + 0] = Jt(h, g, v), r[a + 3 + 0] = r[a + 1 + 32] = Jt(g, v, w), r[a + 3 + 32] = r[a + 1 + 64] = Jt(v, w, w), r[a + 3 + 64] = r[a + 2 + 64] = r[a + 0 + 96] = r[a + 1 + 96] = r[a + 2 + 96] = r[a + 3 + 96] = w;
    }
    function Ds(r, a) {
      var h = r[a - 1 + 0], g = r[a - 1 + 32], v = r[a - 1 + 64], w = r[a - 1 + 96], y = r[a - 1 - 32], _ = r[a + 0 - 32], L = r[a + 1 - 32], C = r[a + 2 - 32];
      r[a + 0 + 0] = r[a + 2 + 32] = h + y + 1 >> 1, r[a + 0 + 32] = r[a + 2 + 64] = g + h + 1 >> 1, r[a + 0 + 64] = r[a + 2 + 96] = v + g + 1 >> 1, r[a + 0 + 96] = w + v + 1 >> 1, r[a + 3 + 0] = Jt(_, L, C), r[a + 2 + 0] = Jt(y, _, L), r[a + 1 + 0] = r[a + 3 + 32] = Jt(h, y, _), r[a + 1 + 32] = r[a + 3 + 64] = Jt(g, h, y), r[a + 1 + 64] = r[a + 3 + 96] = Jt(v, g, h), r[a + 1 + 96] = Jt(w, v, g);
    }
    function Ei(r, a) {
      var h;
      for (h = 0; 8 > h; ++h) i(r, a + 32 * h, r, a - 32, 8);
    }
    function ra(r, a) {
      var h;
      for (h = 0; 8 > h; ++h) o(r, a, r[a - 1], 8), a += 32;
    }
    function ar(r, a, h) {
      var g;
      for (g = 0; 8 > g; ++g) o(a, h + 32 * g, r, 8);
    }
    function qs(r, a) {
      var h, g = 8;
      for (h = 0; 8 > h; ++h) g += r[a + h - 32] + r[a - 1 + 32 * h];
      ar(g >> 4, r, a);
    }
    function Oi(r, a) {
      var h, g = 4;
      for (h = 0; 8 > h; ++h) g += r[a + h - 32];
      ar(g >> 3, r, a);
    }
    function Us(r, a) {
      var h, g = 4;
      for (h = 0; 8 > h; ++h) g += r[a - 1 + 32 * h];
      ar(g >> 3, r, a);
    }
    function ia(r, a) {
      ar(128, r, a);
    }
    function Er(r, a, h) {
      var g = r[a - h], v = r[a + 0], w = 3 * (v - g) + Hs[1020 + r[a - 2 * h] - r[a + h]], y = Ja[112 + (w + 4 >> 3)];
      r[a - h] = Pn[255 + g + Ja[112 + (w + 3 >> 3)]], r[a + 0] = Pn[255 + v - y];
    }
    function aa(r, a, h, g) {
      var v = r[a + 0], w = r[a + h];
      return qn[255 + r[a - 2 * h] - r[a - h]] > g || qn[255 + w - v] > g;
    }
    function ti(r, a, h, g) {
      return 4 * qn[255 + r[a - h] - r[a + 0]] + qn[255 + r[a - 2 * h] - r[a + h]] <= g;
    }
    function sa(r, a, h, g, v) {
      var w = r[a - 3 * h], y = r[a - 2 * h], _ = r[a - h], L = r[a + 0], C = r[a + h], H = r[a + 2 * h], Z = r[a + 3 * h];
      return 4 * qn[255 + _ - L] + qn[255 + y - C] > g ? 0 : qn[255 + r[a - 4 * h] - w] <= v && qn[255 + w - y] <= v && qn[255 + y - _] <= v && qn[255 + Z - H] <= v && qn[255 + H - C] <= v && qn[255 + C - L] <= v;
    }
    function ji(r, a, h, g) {
      var v = 2 * g + 1;
      for (g = 0; 16 > g; ++g) ti(r, a + g, h, v) && Er(r, a + g, h);
    }
    function oa(r, a, h, g) {
      var v = 2 * g + 1;
      for (g = 0; 16 > g; ++g) ti(r, a + g * h, 1, v) && Er(r, a + g * h, 1);
    }
    function Bi(r, a, h, g) {
      var v;
      for (v = 3; 0 < v; --v) ji(r, a += 4 * h, h, g);
    }
    function qa(r, a, h, g) {
      var v;
      for (v = 3; 0 < v; --v) oa(r, a += 4, h, g);
    }
    function wr(r, a, h, g, v, w, y, _) {
      for (w = 2 * w + 1; 0 < v--; ) {
        if (sa(r, a, h, w, y)) if (aa(r, a, h, _)) Er(r, a, h);
        else {
          var L = r, C = a, H = h, Z = L[C - 2 * H], F = L[C - H], W = L[C + 0], K = L[C + H], ot = L[C + 2 * H], X = 27 * (ht = Hs[1020 + 3 * (W - F) + Hs[1020 + Z - K]]) + 63 >> 7, ut = 18 * ht + 63 >> 7, ht = 9 * ht + 63 >> 7;
          L[C - 3 * H] = Pn[255 + L[C - 3 * H] + ht], L[C - 2 * H] = Pn[255 + Z + ut], L[C - H] = Pn[255 + F + X], L[C + 0] = Pn[255 + W - X], L[C + H] = Pn[255 + K - ut], L[C + 2 * H] = Pn[255 + ot - ht];
        }
        a += g;
      }
    }
    function yr(r, a, h, g, v, w, y, _) {
      for (w = 2 * w + 1; 0 < v--; ) {
        if (sa(r, a, h, w, y)) if (aa(r, a, h, _)) Er(r, a, h);
        else {
          var L = r, C = a, H = h, Z = L[C - H], F = L[C + 0], W = L[C + H], K = Ja[112 + (4 + (ot = 3 * (F - Z)) >> 3)], ot = Ja[112 + (ot + 3 >> 3)], X = K + 1 >> 1;
          L[C - 2 * H] = Pn[255 + L[C - 2 * H] + X], L[C - H] = Pn[255 + Z + ot], L[C + 0] = Pn[255 + F - K], L[C + H] = Pn[255 + W - X];
        }
        a += g;
      }
    }
    function Ua(r, a, h, g, v, w) {
      wr(r, a, h, 1, 16, g, v, w);
    }
    function za(r, a, h, g, v, w) {
      wr(r, a, 1, h, 16, g, v, w);
    }
    function Ha(r, a, h, g, v, w) {
      var y;
      for (y = 3; 0 < y; --y) yr(r, a += 4 * h, h, 1, 16, g, v, w);
    }
    function ei(r, a, h, g, v, w) {
      var y;
      for (y = 3; 0 < y; --y) yr(r, a += 4, 1, h, 16, g, v, w);
    }
    function Wa(r, a, h, g, v, w, y, _) {
      wr(r, a, v, 1, 8, w, y, _), wr(h, g, v, 1, 8, w, y, _);
    }
    function l(r, a, h, g, v, w, y, _) {
      wr(r, a, 1, v, 8, w, y, _), wr(h, g, 1, v, 8, w, y, _);
    }
    function b(r, a, h, g, v, w, y, _) {
      yr(r, a + 4 * v, v, 1, 8, w, y, _), yr(h, g + 4 * v, v, 1, 8, w, y, _);
    }
    function I(r, a, h, g, v, w, y, _) {
      yr(r, a + 4, 1, v, 8, w, y, _), yr(h, g + 4, 1, v, 8, w, y, _);
    }
    function T() {
      this.ba = new le(), this.ec = [], this.cc = [], this.Mc = [], this.Dc = this.Nc = this.dc = this.fc = 0, this.Oa = new ve(), this.memory = 0, this.Ib = "OutputFunc", this.Jb = "OutputAlphaFunc", this.Nd = "OutputRowFunc";
    }
    function G() {
      this.data = [], this.offset = this.kd = this.ha = this.w = 0, this.na = [], this.xa = this.gb = this.Ja = this.Sa = this.P = 0;
    }
    function st() {
      this.nc = this.Ea = this.b = this.hc = 0, this.K = [], this.w = 0;
    }
    function gt() {
      this.ua = 0, this.Wa = new ae(), this.vb = new ae(), this.md = this.xc = this.wc = 0, this.vc = [], this.Wb = 0, this.Ya = new rt(), this.yc = new q();
    }
    function Et() {
      this.xb = this.a = 0, this.l = new ki(), this.ca = new le(), this.V = [], this.Ba = 0, this.Ta = [], this.Ua = 0, this.m = new j(), this.Pb = 0, this.wd = new j(), this.Ma = this.$ = this.C = this.i = this.c = this.xd = 0, this.s = new gt(), this.ab = 0, this.gc = f(4, st), this.Oc = 0;
    }
    function Ft() {
      this.Lc = this.Z = this.$a = this.i = this.c = 0, this.l = new ki(), this.ic = 0, this.ca = [], this.tb = 0, this.qd = null, this.rd = 0;
    }
    function Kt(r, a, h, g, v, w, y) {
      for (r = r == null ? 0 : r[a + 0], a = 0; a < y; ++a) v[w + a] = r + h[g + a] & 255, r = v[w + a];
    }
    function te(r, a, h, g, v, w, y) {
      var _;
      if (r == null) Kt(null, null, h, g, v, w, y);
      else for (_ = 0; _ < y; ++_) v[w + _] = r[a + _] + h[g + _] & 255;
    }
    function de(r, a, h, g, v, w, y) {
      if (r == null) Kt(null, null, h, g, v, w, y);
      else {
        var _, L = r[a + 0], C = L, H = L;
        for (_ = 0; _ < y; ++_) C = H + (L = r[a + _]) - C, H = h[g + _] + (-256 & C ? 0 > C ? 0 : 255 : C) & 255, C = L, v[w + _] = H;
      }
    }
    function $e(r, a, h, g) {
      var v = a.width, w = a.o;
      if (t(r != null && a != null), 0 > h || 0 >= g || h + g > w) return null;
      if (!r.Cc) {
        if (r.ga == null) {
          var y;
          if (r.ga = new Ft(), (y = r.ga == null) || (y = a.width * a.o, t(r.Gb.length == 0), r.Gb = s(y), r.Uc = 0, r.Gb == null ? y = 0 : (r.mb = r.Gb, r.nb = r.Uc, r.rc = null, y = 1), y = !y), !y) {
            y = r.ga;
            var _ = r.Fa, L = r.P, C = r.qc, H = r.mb, Z = r.nb, F = L + 1, W = C - 1, K = y.l;
            if (t(_ != null && H != null && a != null), Dr[0] = null, Dr[1] = Kt, Dr[2] = te, Dr[3] = de, y.ca = H, y.tb = Z, y.c = a.width, y.i = a.height, t(0 < y.c && 0 < y.i), 1 >= C) a = 0;
            else if (y.$a = 3 & _[L + 0], y.Z = _[L + 0] >> 2 & 3, y.Lc = _[L + 0] >> 4 & 3, L = _[L + 0] >> 6 & 3, 0 > y.$a || 1 < y.$a || 4 <= y.Z || 1 < y.Lc || L) a = 0;
            else if (K.put = Gt, K.ac = Qn, K.bc = pr, K.ma = y, K.width = a.width, K.height = a.height, K.Da = a.Da, K.v = a.v, K.va = a.va, K.j = a.j, K.o = a.o, y.$a) t: {
              t(y.$a == 1), a = Xr();
              e: for (; ; ) {
                if (a == null) {
                  a = 0;
                  break t;
                }
                if (t(y != null), y.mc = a, a.c = y.c, a.i = y.i, a.l = y.l, a.l.ma = y, a.l.width = y.c, a.l.height = y.i, a.a = 0, ft(a.m, _, F, W), !er(y.c, y.i, 1, a, null) || (a.ab == 1 && a.gc[0].hc == 3 && Hn(a.s) ? (y.ic = 1, _ = a.c * a.i, a.Ta = null, a.Ua = 0, a.V = s(_), a.Ba = 0, a.V == null ? (a.a = 1, a = 0) : a = 1) : (y.ic = 0, a = Zr(a, y.c)), !a)) break e;
                a = 1;
                break t;
              }
              y.mc = null, a = 0;
            }
            else a = W >= y.c * y.i;
            y = !a;
          }
          if (y) return null;
          r.ga.Lc != 1 ? r.Ga = 0 : g = w - h;
        }
        t(r.ga != null), t(h + g <= w);
        t: {
          if (a = (_ = r.ga).c, w = _.l.o, _.$a == 0) {
            if (F = r.rc, W = r.Vc, K = r.Fa, L = r.P + 1 + h * a, C = r.mb, H = r.nb + h * a, t(L <= r.P + r.qc), _.Z != 0) for (t(Dr[_.Z] != null), y = 0; y < g; ++y) Dr[_.Z](F, W, K, L, C, H, a), F = C, W = H, H += a, L += a;
            else for (y = 0; y < g; ++y) i(C, H, K, L, a), F = C, W = H, H += a, L += a;
            r.rc = F, r.Vc = W;
          } else {
            if (t(_.mc != null), a = h + g, t((y = _.mc) != null), t(a <= y.i), y.C >= a) a = 1;
            else if (_.ic || Me(), _.ic) {
              _ = y.V, F = y.Ba, W = y.c;
              var ot = y.i, X = (K = 1, L = y.$ / W, C = y.$ % W, H = y.m, Z = y.s, y.$), ut = W * ot, ht = W * a, wt = Z.wc, bt = X < ht ? rn(Z, C, L) : null;
              t(X <= ut), t(a <= ot), t(Hn(Z));
              e: for (; ; ) {
                for (; !H.h && X < ht; ) {
                  if (C & wt || (bt = rn(Z, C, L)), t(bt != null), Q(H), 256 > (ot = Re(bt.G[0], bt.H[0], H))) _[F + X] = ot, ++X, ++C >= W && (C = 0, ++L <= a && !(L % 16) && Wn(y, L));
                  else {
                    if (!(280 > ot)) {
                      K = 0;
                      break e;
                    }
                    ot = Bn(ot - 256, H);
                    var Rt, Pt = Re(bt.G[4], bt.H[4], H);
                    if (Q(H), !(X >= (Pt = Mn(W, Pt = Bn(Pt, H))) && ut - X >= ot)) {
                      K = 0;
                      break e;
                    }
                    for (Rt = 0; Rt < ot; ++Rt) _[F + X + Rt] = _[F + X + Rt - Pt];
                    for (X += ot, C += ot; C >= W; ) C -= W, ++L <= a && !(L % 16) && Wn(y, L);
                    X < ht && C & wt && (bt = rn(Z, C, L));
                  }
                  t(H.h == V(H));
                }
                Wn(y, L > a ? a : L);
                break e;
              }
              !K || H.h && X < ut ? (K = 0, y.a = H.h ? 5 : 3) : y.$ = X, a = K;
            } else a = Vn(y, y.V, y.Ba, y.c, y.i, a, Ni);
            if (!a) {
              g = 0;
              break t;
            }
          }
          h + g >= w && (r.Cc = 1), g = 1;
        }
        if (!g) return null;
        if (r.Cc && ((g = r.ga) != null && (g.mc = null), r.ga = null, 0 < r.Ga)) return alert("todo:WebPDequantizeLevels"), null;
      }
      return r.nb + h * v;
    }
    function Ae(r, a, h, g, v, w) {
      for (; 0 < v--; ) {
        var y, _ = r, L = a + (h ? 1 : 0), C = r, H = a + (h ? 0 : 3);
        for (y = 0; y < g; ++y) {
          var Z = C[H + 4 * y];
          Z != 255 && (Z *= 32897, _[L + 4 * y + 0] = _[L + 4 * y + 0] * Z >> 23, _[L + 4 * y + 1] = _[L + 4 * y + 1] * Z >> 23, _[L + 4 * y + 2] = _[L + 4 * y + 2] * Z >> 23);
        }
        a += w;
      }
    }
    function _e(r, a, h, g, v) {
      for (; 0 < g--; ) {
        var w;
        for (w = 0; w < h; ++w) {
          var y = r[a + 2 * w + 0], _ = 15 & (C = r[a + 2 * w + 1]), L = 4369 * _, C = (240 & C | C >> 4) * L >> 16;
          r[a + 2 * w + 0] = (240 & y | y >> 4) * L >> 16 & 240 | (15 & y | y << 4) * L >> 16 >> 4 & 15, r[a + 2 * w + 1] = 240 & C | _;
        }
        a += v;
      }
    }
    function Ce(r, a, h, g, v, w, y, _) {
      var L, C, H = 255;
      for (C = 0; C < v; ++C) {
        for (L = 0; L < g; ++L) {
          var Z = r[a + L];
          w[y + 4 * L] = Z, H &= Z;
        }
        a += h, y += _;
      }
      return H != 255;
    }
    function Be(r, a, h, g, v) {
      var w;
      for (w = 0; w < v; ++w) h[g + w] = r[a + w] >> 8;
    }
    function Me() {
      ga = Ae, qo = _e, Uo = Ce, zo = Be;
    }
    function hn(r, a, h) {
      z[r] = function(g, v, w, y, _, L, C, H, Z, F, W, K, ot, X, ut, ht, wt) {
        var bt, Rt = wt - 1 >> 1, Pt = _[L + 0] | C[H + 0] << 16, re = Z[F + 0] | W[K + 0] << 16;
        t(g != null);
        var Ot = 3 * Pt + re + 131074 >> 2;
        for (a(g[v + 0], 255 & Ot, Ot >> 16, ot, X), w != null && (Ot = 3 * re + Pt + 131074 >> 2, a(w[y + 0], 255 & Ot, Ot >> 16, ut, ht)), bt = 1; bt <= Rt; ++bt) {
          var fe = _[L + bt] | C[H + bt] << 16, Ze = Z[F + bt] | W[K + bt] << 16, ie = Pt + fe + re + Ze + 524296, jt = ie + 2 * (fe + re) >> 3;
          Ot = jt + Pt >> 1, Pt = (ie = ie + 2 * (Pt + Ze) >> 3) + fe >> 1, a(g[v + 2 * bt - 1], 255 & Ot, Ot >> 16, ot, X + (2 * bt - 1) * h), a(g[v + 2 * bt - 0], 255 & Pt, Pt >> 16, ot, X + (2 * bt - 0) * h), w != null && (Ot = ie + re >> 1, Pt = jt + Ze >> 1, a(w[y + 2 * bt - 1], 255 & Ot, Ot >> 16, ut, ht + (2 * bt - 1) * h), a(w[y + 2 * bt + 0], 255 & Pt, Pt >> 16, ut, ht + (2 * bt + 0) * h)), Pt = fe, re = Ze;
        }
        1 & wt || (Ot = 3 * Pt + re + 131074 >> 2, a(g[v + wt - 1], 255 & Ot, Ot >> 16, ot, X + (wt - 1) * h), w != null && (Ot = 3 * re + Pt + 131074 >> 2, a(w[y + wt - 1], 255 & Ot, Ot >> 16, ut, ht + (wt - 1) * h)));
      };
    }
    function xr() {
      Un[$a] = Ah, Un[Ka] = Qo, Un[Jo] = Nh, Un[Xa] = tl, Un[Za] = el, Un[Ws] = nl, Un[$o] = Lh, Un[Vs] = Qo, Un[Gs] = tl, Un[Qa] = el, Un[Ys] = nl;
    }
    function la(r) {
      return r & -16384 ? 0 > r ? 0 : 255 : r >> Sh;
    }
    function ni(r, a) {
      return la((19077 * r >> 8) + (26149 * a >> 8) - 14234);
    }
    function ri(r, a, h) {
      return la((19077 * r >> 8) - (6419 * a >> 8) - (13320 * h >> 8) + 8708);
    }
    function Or(r, a) {
      return la((19077 * r >> 8) + (33050 * a >> 8) - 17685);
    }
    function ii(r, a, h, g, v) {
      g[v + 0] = ni(r, h), g[v + 1] = ri(r, a, h), g[v + 2] = Or(r, a);
    }
    function Mi(r, a, h, g, v) {
      g[v + 0] = Or(r, a), g[v + 1] = ri(r, a, h), g[v + 2] = ni(r, h);
    }
    function Ri(r, a, h, g, v) {
      var w = ri(r, a, h);
      a = w << 3 & 224 | Or(r, a) >> 3, g[v + 0] = 248 & ni(r, h) | w >> 5, g[v + 1] = a;
    }
    function cn(r, a, h, g, v) {
      var w = 240 & Or(r, a) | 15;
      g[v + 0] = 240 & ni(r, h) | ri(r, a, h) >> 4, g[v + 1] = w;
    }
    function ai(r, a, h, g, v) {
      g[v + 0] = 255, ii(r, a, h, g, v + 1);
    }
    function si(r, a, h, g, v) {
      Mi(r, a, h, g, v), g[v + 3] = 255;
    }
    function ua(r, a, h, g, v) {
      ii(r, a, h, g, v), g[v + 3] = 255;
    }
    function sr(r, a, h) {
      z[r] = function(g, v, w, y, _, L, C, H, Z) {
        for (var F = H + (-2 & Z) * h; H != F; ) a(g[v + 0], w[y + 0], _[L + 0], C, H), a(g[v + 1], w[y + 0], _[L + 0], C, H + h), v += 2, ++y, ++L, H += 2 * h;
        1 & Z && a(g[v + 0], w[y + 0], _[L + 0], C, H);
      };
    }
    function vn(r, a, h) {
      return h == 0 ? r == 0 ? a == 0 ? 6 : 5 : a == 0 ? 4 : 0 : h;
    }
    function Va(r, a, h, g, v) {
      switch (r >>> 30) {
        case 3:
          _r(a, h, g, v, 0);
          break;
        case 2:
          Rr(a, h, g, v);
          break;
        case 1:
          fn(a, h, g, v);
      }
    }
    function Ti(r, a) {
      var h, g, v = a.M, w = a.Nb, y = r.oc, _ = r.pc + 40, L = r.oc, C = r.pc + 584, H = r.oc, Z = r.pc + 600;
      for (h = 0; 16 > h; ++h) y[_ + 32 * h - 1] = 129;
      for (h = 0; 8 > h; ++h) L[C + 32 * h - 1] = 129, H[Z + 32 * h - 1] = 129;
      for (0 < v ? y[_ - 1 - 32] = L[C - 1 - 32] = H[Z - 1 - 32] = 129 : (o(y, _ - 32 - 1, 127, 21), o(L, C - 32 - 1, 127, 9), o(H, Z - 32 - 1, 127, 9)), g = 0; g < r.za; ++g) {
        var F = a.ya[a.aa + g];
        if (0 < g) {
          for (h = -1; 16 > h; ++h) i(y, _ + 32 * h - 4, y, _ + 32 * h + 12, 4);
          for (h = -1; 8 > h; ++h) i(L, C + 32 * h - 4, L, C + 32 * h + 4, 4), i(H, Z + 32 * h - 4, H, Z + 32 * h + 4, 4);
        }
        var W = r.Gd, K = r.Hd + g, ot = F.ad, X = F.Hc;
        if (0 < v && (i(y, _ - 32, W[K].y, 0, 16), i(L, C - 32, W[K].f, 0, 8), i(H, Z - 32, W[K].ea, 0, 8)), F.Za) {
          var ut = y, ht = _ - 32 + 16;
          for (0 < v && (g >= r.za - 1 ? o(ut, ht, W[K].y[15], 4) : i(ut, ht, W[K + 1].y, 0, 4)), h = 0; 4 > h; h++) ut[ht + 128 + h] = ut[ht + 256 + h] = ut[ht + 384 + h] = ut[ht + 0 + h];
          for (h = 0; 16 > h; ++h, X <<= 2) ut = y, ht = _ + il[h], Yn[F.Ob[h]](ut, ht), Va(X, ot, 16 * +h, ut, ht);
        } else if (ut = vn(g, v, F.Ob[0]), Tr[ut](y, _), X != 0) for (h = 0; 16 > h; ++h, X <<= 2) Va(X, ot, 16 * +h, y, _ + il[h]);
        for (h = F.Gc, ut = vn(g, v, F.Dd), Nr[ut](L, C), Nr[ut](H, Z), X = ot, ut = L, ht = C, 255 & (F = 0 | h) && (170 & F ? Hi(X, 256, ut, ht) : lr(X, 256, ut, ht)), F = H, X = Z, 255 & (h >>= 8) && (170 & h ? Hi(ot, 320, F, X) : lr(ot, 320, F, X)), v < r.Ub - 1 && (i(W[K].y, 0, y, _ + 480, 16), i(W[K].f, 0, L, C + 224, 8), i(W[K].ea, 0, H, Z + 224, 8)), h = 8 * w * r.B, W = r.sa, K = r.ta + 16 * g + 16 * w * r.R, ot = r.qa, F = r.ra + 8 * g + h, X = r.Ha, ut = r.Ia + 8 * g + h, h = 0; 16 > h; ++h) i(W, K + h * r.R, y, _ + 32 * h, 16);
        for (h = 0; 8 > h; ++h) i(ot, F + h * r.B, L, C + 32 * h, 8), i(X, ut + h * r.B, H, Z + 32 * h, 8);
      }
    }
    function Ga(r, a, h, g, v, w, y, _, L) {
      var C = [0], H = [0], Z = 0, F = L != null ? L.kd : 0, W = L ?? new G();
      if (r == null || 12 > h) return 7;
      W.data = r, W.w = a, W.ha = h, a = [a], h = [h], W.gb = [W.gb];
      t: {
        var K = a, ot = h, X = W.gb;
        if (t(r != null), t(ot != null), t(X != null), X[0] = 0, 12 <= ot[0] && !e(r, K[0], "RIFF")) {
          if (e(r, K[0] + 8, "WEBP")) {
            X = 3;
            break t;
          }
          var ut = zt(r, K[0] + 4);
          if (12 > ut || 4294967286 < ut) {
            X = 3;
            break t;
          }
          if (F && ut > ot[0] - 8) {
            X = 7;
            break t;
          }
          X[0] = ut, K[0] += 12, ot[0] -= 12;
        }
        X = 0;
      }
      if (X != 0) return X;
      for (ut = 0 < W.gb[0], h = h[0]; ; ) {
        t: {
          var ht = r;
          ot = a, X = h;
          var wt = C, bt = H, Rt = K = [0];
          if ((Ot = Z = [Z])[0] = 0, 8 > X[0]) X = 7;
          else {
            if (!e(ht, ot[0], "VP8X")) {
              if (zt(ht, ot[0] + 4) != 10) {
                X = 3;
                break t;
              }
              if (18 > X[0]) {
                X = 7;
                break t;
              }
              var Pt = zt(ht, ot[0] + 8), re = 1 + kt(ht, ot[0] + 12);
              if (2147483648 <= re * (ht = 1 + kt(ht, ot[0] + 15))) {
                X = 3;
                break t;
              }
              Rt != null && (Rt[0] = Pt), wt != null && (wt[0] = re), bt != null && (bt[0] = ht), ot[0] += 18, X[0] -= 18, Ot[0] = 1;
            }
            X = 0;
          }
        }
        if (Z = Z[0], K = K[0], X != 0) return X;
        if (ot = !!(2 & K), !ut && Z) return 3;
        if (w != null && (w[0] = !!(16 & K)), y != null && (y[0] = ot), _ != null && (_[0] = 0), y = C[0], K = H[0], Z && ot && L == null) {
          X = 0;
          break;
        }
        if (4 > h) {
          X = 7;
          break;
        }
        if (ut && Z || !ut && !Z && !e(r, a[0], "ALPH")) {
          h = [h], W.na = [W.na], W.P = [W.P], W.Sa = [W.Sa];
          t: {
            Pt = r, X = a, ut = h;
            var Ot = W.gb;
            wt = W.na, bt = W.P, Rt = W.Sa, re = 22, t(Pt != null), t(ut != null), ht = X[0];
            var fe = ut[0];
            for (t(wt != null), t(Rt != null), wt[0] = null, bt[0] = null, Rt[0] = 0; ; ) {
              if (X[0] = ht, ut[0] = fe, 8 > fe) {
                X = 7;
                break t;
              }
              var Ze = zt(Pt, ht + 4);
              if (4294967286 < Ze) {
                X = 3;
                break t;
              }
              var ie = 8 + Ze + 1 & -2;
              if (re += ie, 0 < Ot && re > Ot) {
                X = 3;
                break t;
              }
              if (!e(Pt, ht, "VP8 ") || !e(Pt, ht, "VP8L")) {
                X = 0;
                break t;
              }
              if (fe[0] < ie) {
                X = 7;
                break t;
              }
              e(Pt, ht, "ALPH") || (wt[0] = Pt, bt[0] = ht + 8, Rt[0] = Ze), ht += ie, fe -= ie;
            }
          }
          if (h = h[0], W.na = W.na[0], W.P = W.P[0], W.Sa = W.Sa[0], X != 0) break;
        }
        h = [h], W.Ja = [W.Ja], W.xa = [W.xa];
        t: if (Ot = r, X = a, ut = h, wt = W.gb[0], bt = W.Ja, Rt = W.xa, Pt = X[0], ht = !e(Ot, Pt, "VP8 "), re = !e(Ot, Pt, "VP8L"), t(Ot != null), t(ut != null), t(bt != null), t(Rt != null), 8 > ut[0]) X = 7;
        else {
          if (ht || re) {
            if (Ot = zt(Ot, Pt + 4), 12 <= wt && Ot > wt - 12) {
              X = 3;
              break t;
            }
            if (F && Ot > ut[0] - 8) {
              X = 7;
              break t;
            }
            bt[0] = Ot, X[0] += 8, ut[0] -= 8, Rt[0] = re;
          } else Rt[0] = 5 <= ut[0] && Ot[Pt + 0] == 47 && !(Ot[Pt + 4] >> 5), bt[0] = ut[0];
          X = 0;
        }
        if (h = h[0], W.Ja = W.Ja[0], W.xa = W.xa[0], a = a[0], X != 0) break;
        if (4294967286 < W.Ja) return 3;
        if (_ == null || ot || (_[0] = W.xa ? 2 : 1), y = [y], K = [K], W.xa) {
          if (5 > h) {
            X = 7;
            break;
          }
          _ = y, F = K, ot = w, r == null || 5 > h ? r = 0 : 5 <= h && r[a + 0] == 47 && !(r[a + 4] >> 5) ? (ut = [0], Ot = [0], wt = [0], ft(bt = new j(), r, a, h), gr(bt, ut, Ot, wt) ? (_ != null && (_[0] = ut[0]), F != null && (F[0] = Ot[0]), ot != null && (ot[0] = wt[0]), r = 1) : r = 0) : r = 0;
        } else {
          if (10 > h) {
            X = 7;
            break;
          }
          _ = K, r == null || 10 > h || !Ma(r, a + 3, h - 3) ? r = 0 : (F = r[a + 0] | r[a + 1] << 8 | r[a + 2] << 16, ot = 16383 & (r[a + 7] << 8 | r[a + 6]), r = 16383 & (r[a + 9] << 8 | r[a + 8]), 1 & F || 3 < (F >> 1 & 7) || !(F >> 4 & 1) || F >> 5 >= W.Ja || !ot || !r ? r = 0 : (y && (y[0] = ot), _ && (_[0] = r), r = 1));
        }
        if (!r || (y = y[0], K = K[0], Z && (C[0] != y || H[0] != K))) return 3;
        L != null && (L[0] = W, L.offset = a - L.w, t(4294967286 > a - L.w), t(L.offset == L.ha - h));
        break;
      }
      return X == 0 || X == 7 && Z && L == null ? (w != null && (w[0] |= W.na != null && 0 < W.na.length), g != null && (g[0] = y), v != null && (v[0] = K), 0) : X;
    }
    function Dn(r, a, h) {
      var g = a.width, v = a.height, w = 0, y = 0, _ = g, L = v;
      if (a.Da = r != null && 0 < r.Da, a.Da && (_ = r.cd, L = r.bd, w = r.v, y = r.j, 11 > h || (w &= -2, y &= -2), 0 > w || 0 > y || 0 >= _ || 0 >= L || w + _ > g || y + L > v)) return 0;
      if (a.v = w, a.j = y, a.va = w + _, a.o = y + L, a.U = _, a.T = L, a.da = r != null && 0 < r.da, a.da) {
        if (!Ht(_, L, h = [r.ib], w = [r.hb])) return 0;
        a.ib = h[0], a.hb = w[0];
      }
      return a.ob = r != null && r.ob, a.Kb = r == null || !r.Sd, a.da && (a.ob = a.ib < 3 * g / 4 && a.hb < 3 * v / 4, a.Kb = 0), 1;
    }
    function oi(r) {
      if (r == null) return 2;
      if (11 > r.S) {
        var a = r.f.RGBA;
        a.fb += (r.height - 1) * a.A, a.A = -a.A;
      } else a = r.f.kb, r = r.height, a.O += (r - 1) * a.fa, a.fa = -a.fa, a.N += (r - 1 >> 1) * a.Ab, a.Ab = -a.Ab, a.W += (r - 1 >> 1) * a.Db, a.Db = -a.Db, a.F != null && (a.J += (r - 1) * a.lb, a.lb = -a.lb);
      return 0;
    }
    function ha(r, a, h, g) {
      if (g == null || 0 >= r || 0 >= a) return 2;
      if (h != null) {
        if (h.Da) {
          var v = h.cd, w = h.bd, y = -2 & h.v, _ = -2 & h.j;
          if (0 > y || 0 > _ || 0 >= v || 0 >= w || y + v > r || _ + w > a) return 2;
          r = v, a = w;
        }
        if (h.da) {
          if (!Ht(r, a, v = [h.ib], w = [h.hb])) return 2;
          r = v[0], a = w[0];
        }
      }
      g.width = r, g.height = a;
      t: {
        var L = g.width, C = g.height;
        if (r = g.S, 0 >= L || 0 >= C || !(r >= $a && 13 > r)) r = 2;
        else {
          if (0 >= g.Rd && g.sd == null) {
            y = w = v = a = 0;
            var H = (_ = L * al[r]) * C;
            if (11 > r || (w = (C + 1) / 2 * (a = (L + 1) / 2), r == 12 && (y = (v = L) * C)), (C = s(H + 2 * w + y)) == null) {
              r = 1;
              break t;
            }
            g.sd = C, 11 > r ? ((L = g.f.RGBA).eb = C, L.fb = 0, L.A = _, L.size = H) : ((L = g.f.kb).y = C, L.O = 0, L.fa = _, L.Fd = H, L.f = C, L.N = 0 + H, L.Ab = a, L.Cd = w, L.ea = C, L.W = 0 + H + w, L.Db = a, L.Ed = w, r == 12 && (L.F = C, L.J = 0 + H + 2 * w), L.Tc = y, L.lb = v);
          }
          if (a = 1, v = g.S, w = g.width, y = g.height, v >= $a && 13 > v) if (11 > v) r = g.f.RGBA, a &= (_ = Math.abs(r.A)) * (y - 1) + w <= r.size, a &= _ >= w * al[v], a &= r.eb != null;
          else {
            r = g.f.kb, _ = (w + 1) / 2, H = (y + 1) / 2, L = Math.abs(r.fa), C = Math.abs(r.Ab);
            var Z = Math.abs(r.Db), F = Math.abs(r.lb), W = F * (y - 1) + w;
            a &= L * (y - 1) + w <= r.Fd, a &= C * (H - 1) + _ <= r.Cd, a = (a &= Z * (H - 1) + _ <= r.Ed) & L >= w & C >= _ & Z >= _, a &= r.y != null, a &= r.f != null, a &= r.ea != null, v == 12 && (a &= F >= w, a &= W <= r.Tc, a &= r.F != null);
          }
          else a = 0;
          r = a ? 0 : 2;
        }
      }
      return r != 0 || h != null && h.fd && (r = oi(g)), r;
    }
    var Di = 64, li = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535, 131071, 262143, 524287, 1048575, 2097151, 4194303, 8388607, 16777215], ca = 24, wn = 32, An = 8, qi = [0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7];
    Ct("Predictor0", "PredictorAdd0"), z.Predictor0 = function() {
      return 4278190080;
    }, z.Predictor1 = function(r) {
      return r;
    }, z.Predictor2 = function(r, a, h) {
      return a[h + 0];
    }, z.Predictor3 = function(r, a, h) {
      return a[h + 1];
    }, z.Predictor4 = function(r, a, h) {
      return a[h - 1];
    }, z.Predictor5 = function(r, a, h) {
      return Dt(Dt(r, a[h + 1]), a[h + 0]);
    }, z.Predictor6 = function(r, a, h) {
      return Dt(r, a[h - 1]);
    }, z.Predictor7 = function(r, a, h) {
      return Dt(r, a[h + 0]);
    }, z.Predictor8 = function(r, a, h) {
      return Dt(a[h - 1], a[h + 0]);
    }, z.Predictor9 = function(r, a, h) {
      return Dt(a[h + 0], a[h + 1]);
    }, z.Predictor10 = function(r, a, h) {
      return Dt(Dt(r, a[h - 1]), Dt(a[h + 0], a[h + 1]));
    }, z.Predictor11 = function(r, a, h) {
      var g = a[h + 0];
      return 0 >= Zt(g >> 24 & 255, r >> 24 & 255, (a = a[h - 1]) >> 24 & 255) + Zt(g >> 16 & 255, r >> 16 & 255, a >> 16 & 255) + Zt(g >> 8 & 255, r >> 8 & 255, a >> 8 & 255) + Zt(255 & g, 255 & r, 255 & a) ? g : r;
    }, z.Predictor12 = function(r, a, h) {
      var g = a[h + 0];
      return (be((r >> 24 & 255) + (g >> 24 & 255) - ((a = a[h - 1]) >> 24 & 255)) << 24 | be((r >> 16 & 255) + (g >> 16 & 255) - (a >> 16 & 255)) << 16 | be((r >> 8 & 255) + (g >> 8 & 255) - (a >> 8 & 255)) << 8 | be((255 & r) + (255 & g) - (255 & a))) >>> 0;
    }, z.Predictor13 = function(r, a, h) {
      var g = a[h - 1];
      return (ue((r = Dt(r, a[h + 0])) >> 24 & 255, g >> 24 & 255) << 24 | ue(r >> 16 & 255, g >> 16 & 255) << 16 | ue(r >> 8 & 255, g >> 8 & 255) << 8 | ue(255 & r, 255 & g)) >>> 0;
    };
    var jr = z.PredictorAdd0;
    z.PredictorAdd1 = ce, Ct("Predictor2", "PredictorAdd2"), Ct("Predictor3", "PredictorAdd3"), Ct("Predictor4", "PredictorAdd4"), Ct("Predictor5", "PredictorAdd5"), Ct("Predictor6", "PredictorAdd6"), Ct("Predictor7", "PredictorAdd7"), Ct("Predictor8", "PredictorAdd8"), Ct("Predictor9", "PredictorAdd9"), Ct("Predictor10", "PredictorAdd10"), Ct("Predictor11", "PredictorAdd11"), Ct("Predictor12", "PredictorAdd12"), Ct("Predictor13", "PredictorAdd13");
    var Br = z.PredictorAdd2;
    Tt("ColorIndexInverseTransform", "MapARGB", "32b", function(r) {
      return r >> 8 & 255;
    }, function(r) {
      return r;
    }), Tt("VP8LColorIndexInverseTransformAlpha", "MapAlpha", "8b", function(r) {
      return r;
    }, function(r) {
      return r >> 8 & 255;
    });
    var Ui, ui = z.ColorIndexInverseTransform, Ke = z.MapARGB, zs = z.VP8LColorIndexInverseTransformAlpha, or = z.MapAlpha, Gn = z.VP8LPredictorsAdd = [];
    Gn.length = 16, (z.VP8LPredictors = []).length = 16, (z.VP8LPredictorsAdd_C = []).length = 16, (z.VP8LPredictors_C = []).length = 16;
    var hi, fa, da, zi, ci, fi, Mr, _r, Rr, Hi, fn, lr, ke, Pe, ze, Xe, Ar, pa, Wi, Ya, Mo, Ro, To, Do, ga, qo, Uo, zo, Ho = s(511), Wo = s(2041), Vo = s(225), Go = s(767), Yo = 0, Hs = Wo, Ja = Vo, Pn = Go, qn = Ho, $a = 0, Ka = 1, Jo = 2, Xa = 3, Za = 4, Ws = 5, $o = 6, Vs = 7, Gs = 8, Qa = 9, Ys = 10, uh = [2, 3, 7], hh = [3, 3, 11], Ko = [280, 256, 256, 256, 40], ch = [0, 1, 1, 1, 0], fh = [17, 18, 0, 1, 2, 3, 4, 5, 16, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], dh = [24, 7, 23, 25, 40, 6, 39, 41, 22, 26, 38, 42, 56, 5, 55, 57, 21, 27, 54, 58, 37, 43, 72, 4, 71, 73, 20, 28, 53, 59, 70, 74, 36, 44, 88, 69, 75, 52, 60, 3, 87, 89, 19, 29, 86, 90, 35, 45, 68, 76, 85, 91, 51, 61, 104, 2, 103, 105, 18, 30, 102, 106, 34, 46, 84, 92, 67, 77, 101, 107, 50, 62, 120, 1, 119, 121, 83, 93, 17, 31, 100, 108, 66, 78, 118, 122, 33, 47, 117, 123, 49, 63, 99, 109, 82, 94, 0, 116, 124, 65, 79, 16, 32, 98, 110, 48, 115, 125, 81, 95, 64, 114, 126, 97, 111, 80, 113, 127, 96, 112], ph = [2954, 2956, 2958, 2962, 2970, 2986, 3018, 3082, 3212, 3468, 3980, 5004], gh = 8, Js = [4, 5, 6, 7, 8, 9, 10, 10, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 25, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 93, 95, 96, 98, 100, 101, 102, 104, 106, 108, 110, 112, 114, 116, 118, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 143, 145, 148, 151, 154, 157], $s = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 119, 122, 125, 128, 131, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 167, 170, 173, 177, 181, 185, 189, 193, 197, 201, 205, 209, 213, 217, 221, 225, 229, 234, 239, 245, 249, 254, 259, 264, 269, 274, 279, 284], ma = null, mh = [[173, 148, 140, 0], [176, 155, 140, 135, 0], [180, 157, 141, 134, 130, 0], [254, 254, 243, 230, 196, 177, 153, 140, 133, 130, 129, 0]], bh = [0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15], Xo = [-0, 1, -1, 2, -2, 3, 4, 6, -3, 5, -4, -5, -6, 7, -7, 8, -8, -9], vh = [[[[128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128], [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128], [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128]], [[253, 136, 254, 255, 228, 219, 128, 128, 128, 128, 128], [189, 129, 242, 255, 227, 213, 255, 219, 128, 128, 128], [106, 126, 227, 252, 214, 209, 255, 255, 128, 128, 128]], [[1, 98, 248, 255, 236, 226, 255, 255, 128, 128, 128], [181, 133, 238, 254, 221, 234, 255, 154, 128, 128, 128], [78, 134, 202, 247, 198, 180, 255, 219, 128, 128, 128]], [[1, 185, 249, 255, 243, 255, 128, 128, 128, 128, 128], [184, 150, 247, 255, 236, 224, 128, 128, 128, 128, 128], [77, 110, 216, 255, 236, 230, 128, 128, 128, 128, 128]], [[1, 101, 251, 255, 241, 255, 128, 128, 128, 128, 128], [170, 139, 241, 252, 236, 209, 255, 255, 128, 128, 128], [37, 116, 196, 243, 228, 255, 255, 255, 128, 128, 128]], [[1, 204, 254, 255, 245, 255, 128, 128, 128, 128, 128], [207, 160, 250, 255, 238, 128, 128, 128, 128, 128, 128], [102, 103, 231, 255, 211, 171, 128, 128, 128, 128, 128]], [[1, 152, 252, 255, 240, 255, 128, 128, 128, 128, 128], [177, 135, 243, 255, 234, 225, 128, 128, 128, 128, 128], [80, 129, 211, 255, 194, 224, 128, 128, 128, 128, 128]], [[1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128], [246, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128], [255, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128]]], [[[198, 35, 237, 223, 193, 187, 162, 160, 145, 155, 62], [131, 45, 198, 221, 172, 176, 220, 157, 252, 221, 1], [68, 47, 146, 208, 149, 167, 221, 162, 255, 223, 128]], [[1, 149, 241, 255, 221, 224, 255, 255, 128, 128, 128], [184, 141, 234, 253, 222, 220, 255, 199, 128, 128, 128], [81, 99, 181, 242, 176, 190, 249, 202, 255, 255, 128]], [[1, 129, 232, 253, 214, 197, 242, 196, 255, 255, 128], [99, 121, 210, 250, 201, 198, 255, 202, 128, 128, 128], [23, 91, 163, 242, 170, 187, 247, 210, 255, 255, 128]], [[1, 200, 246, 255, 234, 255, 128, 128, 128, 128, 128], [109, 178, 241, 255, 231, 245, 255, 255, 128, 128, 128], [44, 130, 201, 253, 205, 192, 255, 255, 128, 128, 128]], [[1, 132, 239, 251, 219, 209, 255, 165, 128, 128, 128], [94, 136, 225, 251, 218, 190, 255, 255, 128, 128, 128], [22, 100, 174, 245, 186, 161, 255, 199, 128, 128, 128]], [[1, 182, 249, 255, 232, 235, 128, 128, 128, 128, 128], [124, 143, 241, 255, 227, 234, 128, 128, 128, 128, 128], [35, 77, 181, 251, 193, 211, 255, 205, 128, 128, 128]], [[1, 157, 247, 255, 236, 231, 255, 255, 128, 128, 128], [121, 141, 235, 255, 225, 227, 255, 255, 128, 128, 128], [45, 99, 188, 251, 195, 217, 255, 224, 128, 128, 128]], [[1, 1, 251, 255, 213, 255, 128, 128, 128, 128, 128], [203, 1, 248, 255, 255, 128, 128, 128, 128, 128, 128], [137, 1, 177, 255, 224, 255, 128, 128, 128, 128, 128]]], [[[253, 9, 248, 251, 207, 208, 255, 192, 128, 128, 128], [175, 13, 224, 243, 193, 185, 249, 198, 255, 255, 128], [73, 17, 171, 221, 161, 179, 236, 167, 255, 234, 128]], [[1, 95, 247, 253, 212, 183, 255, 255, 128, 128, 128], [239, 90, 244, 250, 211, 209, 255, 255, 128, 128, 128], [155, 77, 195, 248, 188, 195, 255, 255, 128, 128, 128]], [[1, 24, 239, 251, 218, 219, 255, 205, 128, 128, 128], [201, 51, 219, 255, 196, 186, 128, 128, 128, 128, 128], [69, 46, 190, 239, 201, 218, 255, 228, 128, 128, 128]], [[1, 191, 251, 255, 255, 128, 128, 128, 128, 128, 128], [223, 165, 249, 255, 213, 255, 128, 128, 128, 128, 128], [141, 124, 248, 255, 255, 128, 128, 128, 128, 128, 128]], [[1, 16, 248, 255, 255, 128, 128, 128, 128, 128, 128], [190, 36, 230, 255, 236, 255, 128, 128, 128, 128, 128], [149, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128]], [[1, 226, 255, 128, 128, 128, 128, 128, 128, 128, 128], [247, 192, 255, 128, 128, 128, 128, 128, 128, 128, 128], [240, 128, 255, 128, 128, 128, 128, 128, 128, 128, 128]], [[1, 134, 252, 255, 255, 128, 128, 128, 128, 128, 128], [213, 62, 250, 255, 255, 128, 128, 128, 128, 128, 128], [55, 93, 255, 128, 128, 128, 128, 128, 128, 128, 128]], [[128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128], [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128], [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128]]], [[[202, 24, 213, 235, 186, 191, 220, 160, 240, 175, 255], [126, 38, 182, 232, 169, 184, 228, 174, 255, 187, 128], [61, 46, 138, 219, 151, 178, 240, 170, 255, 216, 128]], [[1, 112, 230, 250, 199, 191, 247, 159, 255, 255, 128], [166, 109, 228, 252, 211, 215, 255, 174, 128, 128, 128], [39, 77, 162, 232, 172, 180, 245, 178, 255, 255, 128]], [[1, 52, 220, 246, 198, 199, 249, 220, 255, 255, 128], [124, 74, 191, 243, 183, 193, 250, 221, 255, 255, 128], [24, 71, 130, 219, 154, 170, 243, 182, 255, 255, 128]], [[1, 182, 225, 249, 219, 240, 255, 224, 128, 128, 128], [149, 150, 226, 252, 216, 205, 255, 171, 128, 128, 128], [28, 108, 170, 242, 183, 194, 254, 223, 255, 255, 128]], [[1, 81, 230, 252, 204, 203, 255, 192, 128, 128, 128], [123, 102, 209, 247, 188, 196, 255, 233, 128, 128, 128], [20, 95, 153, 243, 164, 173, 255, 203, 128, 128, 128]], [[1, 222, 248, 255, 216, 213, 128, 128, 128, 128, 128], [168, 175, 246, 252, 235, 205, 255, 255, 128, 128, 128], [47, 116, 215, 255, 211, 212, 255, 255, 128, 128, 128]], [[1, 121, 236, 253, 212, 214, 255, 255, 128, 128, 128], [141, 84, 213, 252, 201, 202, 255, 219, 128, 128, 128], [42, 80, 160, 240, 162, 185, 255, 205, 128, 128, 128]], [[1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128], [244, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128], [238, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128]]]], wh = [[[231, 120, 48, 89, 115, 113, 120, 152, 112], [152, 179, 64, 126, 170, 118, 46, 70, 95], [175, 69, 143, 80, 85, 82, 72, 155, 103], [56, 58, 10, 171, 218, 189, 17, 13, 152], [114, 26, 17, 163, 44, 195, 21, 10, 173], [121, 24, 80, 195, 26, 62, 44, 64, 85], [144, 71, 10, 38, 171, 213, 144, 34, 26], [170, 46, 55, 19, 136, 160, 33, 206, 71], [63, 20, 8, 114, 114, 208, 12, 9, 226], [81, 40, 11, 96, 182, 84, 29, 16, 36]], [[134, 183, 89, 137, 98, 101, 106, 165, 148], [72, 187, 100, 130, 157, 111, 32, 75, 80], [66, 102, 167, 99, 74, 62, 40, 234, 128], [41, 53, 9, 178, 241, 141, 26, 8, 107], [74, 43, 26, 146, 73, 166, 49, 23, 157], [65, 38, 105, 160, 51, 52, 31, 115, 128], [104, 79, 12, 27, 217, 255, 87, 17, 7], [87, 68, 71, 44, 114, 51, 15, 186, 23], [47, 41, 14, 110, 182, 183, 21, 17, 194], [66, 45, 25, 102, 197, 189, 23, 18, 22]], [[88, 88, 147, 150, 42, 46, 45, 196, 205], [43, 97, 183, 117, 85, 38, 35, 179, 61], [39, 53, 200, 87, 26, 21, 43, 232, 171], [56, 34, 51, 104, 114, 102, 29, 93, 77], [39, 28, 85, 171, 58, 165, 90, 98, 64], [34, 22, 116, 206, 23, 34, 43, 166, 73], [107, 54, 32, 26, 51, 1, 81, 43, 31], [68, 25, 106, 22, 64, 171, 36, 225, 114], [34, 19, 21, 102, 132, 188, 16, 76, 124], [62, 18, 78, 95, 85, 57, 50, 48, 51]], [[193, 101, 35, 159, 215, 111, 89, 46, 111], [60, 148, 31, 172, 219, 228, 21, 18, 111], [112, 113, 77, 85, 179, 255, 38, 120, 114], [40, 42, 1, 196, 245, 209, 10, 25, 109], [88, 43, 29, 140, 166, 213, 37, 43, 154], [61, 63, 30, 155, 67, 45, 68, 1, 209], [100, 80, 8, 43, 154, 1, 51, 26, 71], [142, 78, 78, 16, 255, 128, 34, 197, 171], [41, 40, 5, 102, 211, 183, 4, 1, 221], [51, 50, 17, 168, 209, 192, 23, 25, 82]], [[138, 31, 36, 171, 27, 166, 38, 44, 229], [67, 87, 58, 169, 82, 115, 26, 59, 179], [63, 59, 90, 180, 59, 166, 93, 73, 154], [40, 40, 21, 116, 143, 209, 34, 39, 175], [47, 15, 16, 183, 34, 223, 49, 45, 183], [46, 17, 33, 183, 6, 98, 15, 32, 183], [57, 46, 22, 24, 128, 1, 54, 17, 37], [65, 32, 73, 115, 28, 128, 23, 128, 205], [40, 3, 9, 115, 51, 192, 18, 6, 223], [87, 37, 9, 115, 59, 77, 64, 21, 47]], [[104, 55, 44, 218, 9, 54, 53, 130, 226], [64, 90, 70, 205, 40, 41, 23, 26, 57], [54, 57, 112, 184, 5, 41, 38, 166, 213], [30, 34, 26, 133, 152, 116, 10, 32, 134], [39, 19, 53, 221, 26, 114, 32, 73, 255], [31, 9, 65, 234, 2, 15, 1, 118, 73], [75, 32, 12, 51, 192, 255, 160, 43, 51], [88, 31, 35, 67, 102, 85, 55, 186, 85], [56, 21, 23, 111, 59, 205, 45, 37, 192], [55, 38, 70, 124, 73, 102, 1, 34, 98]], [[125, 98, 42, 88, 104, 85, 117, 175, 82], [95, 84, 53, 89, 128, 100, 113, 101, 45], [75, 79, 123, 47, 51, 128, 81, 171, 1], [57, 17, 5, 71, 102, 57, 53, 41, 49], [38, 33, 13, 121, 57, 73, 26, 1, 85], [41, 10, 67, 138, 77, 110, 90, 47, 114], [115, 21, 2, 10, 102, 255, 166, 23, 6], [101, 29, 16, 10, 85, 128, 101, 196, 26], [57, 18, 10, 102, 102, 213, 34, 20, 43], [117, 20, 15, 36, 163, 128, 68, 1, 26]], [[102, 61, 71, 37, 34, 53, 31, 243, 192], [69, 60, 71, 38, 73, 119, 28, 222, 37], [68, 45, 128, 34, 1, 47, 11, 245, 171], [62, 17, 19, 70, 146, 85, 55, 62, 70], [37, 43, 37, 154, 100, 163, 85, 160, 1], [63, 9, 92, 136, 28, 64, 32, 201, 85], [75, 15, 9, 9, 64, 255, 184, 119, 16], [86, 6, 28, 5, 64, 255, 25, 248, 1], [56, 8, 17, 132, 137, 255, 55, 116, 128], [58, 15, 20, 82, 135, 57, 26, 121, 40]], [[164, 50, 31, 137, 154, 133, 25, 35, 218], [51, 103, 44, 131, 131, 123, 31, 6, 158], [86, 40, 64, 135, 148, 224, 45, 183, 128], [22, 26, 17, 131, 240, 154, 14, 1, 209], [45, 16, 21, 91, 64, 222, 7, 1, 197], [56, 21, 39, 155, 60, 138, 23, 102, 213], [83, 12, 13, 54, 192, 255, 68, 47, 28], [85, 26, 85, 85, 128, 128, 32, 146, 171], [18, 11, 7, 63, 144, 171, 4, 4, 246], [35, 27, 10, 146, 174, 171, 12, 26, 128]], [[190, 80, 35, 99, 180, 80, 126, 54, 45], [85, 126, 47, 87, 176, 51, 41, 20, 32], [101, 75, 128, 139, 118, 146, 116, 128, 85], [56, 41, 15, 176, 236, 85, 37, 9, 62], [71, 30, 17, 119, 118, 255, 17, 18, 138], [101, 38, 60, 138, 55, 70, 43, 26, 142], [146, 36, 19, 30, 171, 255, 97, 27, 20], [138, 45, 61, 62, 219, 1, 81, 188, 64], [32, 41, 20, 117, 151, 142, 20, 21, 163], [112, 19, 12, 61, 195, 128, 48, 4, 24]]], yh = [[[[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[176, 246, 255, 255, 255, 255, 255, 255, 255, 255, 255], [223, 241, 252, 255, 255, 255, 255, 255, 255, 255, 255], [249, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 244, 252, 255, 255, 255, 255, 255, 255, 255, 255], [234, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255], [253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 246, 254, 255, 255, 255, 255, 255, 255, 255, 255], [239, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255], [254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255], [251, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255], [251, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255], [254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 254, 253, 255, 254, 255, 255, 255, 255, 255, 255], [250, 255, 254, 255, 254, 255, 255, 255, 255, 255, 255], [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]]], [[[217, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [225, 252, 241, 253, 255, 255, 254, 255, 255, 255, 255], [234, 250, 241, 250, 253, 255, 253, 254, 255, 255, 255]], [[255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255], [223, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255], [238, 253, 254, 254, 255, 255, 255, 255, 255, 255, 255]], [[255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255], [249, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 253, 255, 255, 255, 255, 255, 255, 255, 255, 255], [247, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255], [252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255], [253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255], [250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]]], [[[186, 251, 250, 255, 255, 255, 255, 255, 255, 255, 255], [234, 251, 244, 254, 255, 255, 255, 255, 255, 255, 255], [251, 251, 243, 253, 254, 255, 254, 255, 255, 255, 255]], [[255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255], [236, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255], [251, 253, 253, 254, 254, 255, 255, 255, 255, 255, 255]], [[255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255], [254, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255], [254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255], [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]]], [[[248, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [250, 254, 252, 254, 255, 255, 255, 255, 255, 255, 255], [248, 254, 249, 253, 255, 255, 255, 255, 255, 255, 255]], [[255, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255], [246, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255], [252, 254, 251, 254, 254, 255, 255, 255, 255, 255, 255]], [[255, 254, 252, 255, 255, 255, 255, 255, 255, 255, 255], [248, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255], [253, 255, 254, 254, 255, 255, 255, 255, 255, 255, 255]], [[255, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255], [245, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255], [253, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 251, 253, 255, 255, 255, 255, 255, 255, 255, 255], [252, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255], [255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255], [249, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 253, 255, 255, 255, 255, 255, 255, 255, 255], [250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]], [[255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]]]], xh = [0, 1, 2, 3, 6, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0], Tr = [], Yn = [], Nr = [], _h = 1, Zo = 2, Dr = [], Un = [];
    hn("UpsampleRgbLinePair", ii, 3), hn("UpsampleBgrLinePair", Mi, 3), hn("UpsampleRgbaLinePair", ua, 4), hn("UpsampleBgraLinePair", si, 4), hn("UpsampleArgbLinePair", ai, 4), hn("UpsampleRgba4444LinePair", cn, 2), hn("UpsampleRgb565LinePair", Ri, 2);
    var Ah = z.UpsampleRgbLinePair, Nh = z.UpsampleBgrLinePair, Qo = z.UpsampleRgbaLinePair, tl = z.UpsampleBgraLinePair, el = z.UpsampleArgbLinePair, nl = z.UpsampleRgba4444LinePair, Lh = z.UpsampleRgb565LinePair, ts = 16, es = 1 << ts - 1, ba = -227, Ks = 482, Sh = 6, rl = 0, kh = s(256), Ph = s(256), Ih = s(256), Ch = s(256), Fh = s(Ks - ba), Eh = s(Ks - ba);
    sr("YuvToRgbRow", ii, 3), sr("YuvToBgrRow", Mi, 3), sr("YuvToRgbaRow", ua, 4), sr("YuvToBgraRow", si, 4), sr("YuvToArgbRow", ai, 4), sr("YuvToRgba4444Row", cn, 2), sr("YuvToRgb565Row", Ri, 2);
    var il = [0, 4, 8, 12, 128, 132, 136, 140, 256, 260, 264, 268, 384, 388, 392, 396], ns = [0, 2, 8], Oh = [8, 7, 6, 4, 4, 2, 2, 2, 1, 1, 1, 1], jh = 1;
    this.WebPDecodeRGBA = function(r, a, h, g, v) {
      var w = Ka, y = new T(), _ = new le();
      y.ba = _, _.S = w, _.width = [_.width], _.height = [_.height];
      var L = _.width, C = _.height, H = new Vt();
      if (H == null || r == null) var Z = 2;
      else t(H != null), Z = Ga(r, a, h, H.width, H.height, H.Pd, H.Qd, H.format, null);
      if (Z != 0 ? L = 0 : (L != null && (L[0] = H.width[0]), C != null && (C[0] = H.height[0]), L = 1), L) {
        _.width = _.width[0], _.height = _.height[0], g != null && (g[0] = _.width), v != null && (v[0] = _.height);
        t: {
          if (g = new ki(), (v = new G()).data = r, v.w = a, v.ha = h, v.kd = 1, a = [0], t(v != null), ((r = Ga(v.data, v.w, v.ha, null, null, null, a, null, v)) == 0 || r == 7) && a[0] && (r = 4), (a = r) == 0) {
            if (t(y != null), g.data = v.data, g.w = v.w + v.offset, g.ha = v.ha - v.offset, g.put = Gt, g.ac = Qn, g.bc = pr, g.ma = y, v.xa) {
              if ((r = Xr()) == null) {
                y = 1;
                break t;
              }
              if ((function(F, W) {
                var K = [0], ot = [0], X = [0];
                e: for (; ; ) {
                  if (F == null) return 0;
                  if (W == null) return F.a = 2, 0;
                  if (F.l = W, F.a = 0, ft(F.m, W.data, W.w, W.ha), !gr(F.m, K, ot, X)) {
                    F.a = 3;
                    break e;
                  }
                  if (F.xb = Zo, W.width = K[0], W.height = ot[0], !er(K[0], ot[0], 1, F, null)) break e;
                  return 1;
                }
                return t(F.a != 0), 0;
              })(r, g)) {
                if (g = (a = ha(g.width, g.height, y.Oa, y.ba)) == 0) {
                  e: {
                    g = r;
                    n: for (; ; ) {
                      if (g == null) {
                        g = 0;
                        break e;
                      }
                      if (t(g.s.yc != null), t(g.s.Ya != null), t(0 < g.s.Wb), t((h = g.l) != null), t((v = h.ma) != null), g.xb != 0) {
                        if (g.ca = v.ba, g.tb = v.tb, t(g.ca != null), !Dn(v.Oa, h, Xa)) {
                          g.a = 2;
                          break n;
                        }
                        if (!Zr(g, h.width) || h.da) break n;
                        if ((h.da || Yt(g.ca.S)) && Me(), 11 > g.ca.S || (alert("todo:WebPInitConvertARGBToYUV"), g.ca.f.kb.F != null && Me()), g.Pb && 0 < g.s.ua && g.s.vb.X == null && !k(g.s.vb, g.s.Wa.Xa)) {
                          g.a = 1;
                          break n;
                        }
                        g.xb = 0;
                      }
                      if (!Vn(g, g.V, g.Ba, g.c, g.i, h.o, Ir)) break n;
                      v.Dc = g.Ma, g = 1;
                      break e;
                    }
                    t(g.a != 0), g = 0;
                  }
                  g = !g;
                }
                g && (a = r.a);
              } else a = r.a;
            } else {
              if ((r = new Ls()) == null) {
                y = 1;
                break t;
              }
              if (r.Fa = v.na, r.P = v.P, r.qc = v.Sa, rr(r, g)) {
                if ((a = ha(g.width, g.height, y.Oa, y.ba)) == 0) {
                  if (r.Aa = 0, h = y.Oa, t((v = r) != null), h != null) {
                    if (0 < (L = 0 > (L = h.Md) ? 0 : 100 < L ? 255 : 255 * L / 100)) {
                      for (C = H = 0; 4 > C; ++C) 12 > (Z = v.pb[C]).lc && (Z.ia = L * Oh[0 > Z.lc ? 0 : Z.lc] >> 3), H |= Z.ia;
                      H && (alert("todo:VP8InitRandom"), v.ia = 1);
                    }
                    v.Ga = h.Id, 100 < v.Ga ? v.Ga = 100 : 0 > v.Ga && (v.Ga = 0);
                  }
                  (function(F, W) {
                    if (F == null) return 0;
                    if (W == null) return Je(F, 2, "NULL VP8Io parameter in VP8Decode().");
                    if (!F.cb && !rr(F, W)) return 0;
                    if (t(F.cb), W.ac == null || W.ac(W)) {
                      W.ob && (F.L = 0);
                      var K = ns[F.L];
                      if (F.L == 2 ? (F.yb = 0, F.zb = 0) : (F.yb = W.v - K >> 4, F.zb = W.j - K >> 4, 0 > F.yb && (F.yb = 0), 0 > F.zb && (F.zb = 0)), F.Va = W.o + 15 + K >> 4, F.Hb = W.va + 15 + K >> 4, F.Hb > F.za && (F.Hb = F.za), F.Va > F.Ub && (F.Va = F.Ub), 0 < F.L) {
                        var ot = F.ed;
                        for (K = 0; 4 > K; ++K) {
                          var X;
                          if (F.Qa.Cb) {
                            var ut = F.Qa.Lb[K];
                            F.Qa.Fb || (ut += ot.Tb);
                          } else ut = ot.Tb;
                          for (X = 0; 1 >= X; ++X) {
                            var ht = F.gd[K][X], wt = ut;
                            if (ot.Pc && (wt += ot.vd[0], X && (wt += ot.od[0])), 0 < (wt = 0 > wt ? 0 : 63 < wt ? 63 : wt)) {
                              var bt = wt;
                              0 < ot.wb && (bt = 4 < ot.wb ? bt >> 2 : bt >> 1) > 9 - ot.wb && (bt = 9 - ot.wb), 1 > bt && (bt = 1), ht.dd = bt, ht.tc = 2 * wt + bt, ht.ld = 40 <= wt ? 2 : 15 <= wt ? 1 : 0;
                            } else ht.tc = 0;
                            ht.La = X;
                          }
                        }
                      }
                      K = 0;
                    } else Je(F, 6, "Frame setup failed"), K = F.a;
                    if (K = K == 0) {
                      if (K) {
                        F.$c = 0, 0 < F.Aa || (F.Ic = jh);
                        e: {
                          K = F.Ic, ot = 4 * (bt = F.za);
                          var Rt = 32 * bt, Pt = bt + 1, re = 0 < F.L ? bt * (0 < F.Aa ? 2 : 1) : 0, Ot = (F.Aa == 2 ? 2 : 1) * bt;
                          if ((ht = ot + 832 + (X = 3 * (16 * K + ns[F.L]) / 2 * Rt) + (ut = F.Fa != null && 0 < F.Fa.length ? F.Kc.c * F.Kc.i : 0)) != ht) K = 0;
                          else {
                            if (ht > F.Vb) {
                              if (F.Vb = 0, F.Ec = s(ht), F.Fc = 0, F.Ec == null) {
                                K = Je(F, 1, "no memory during frame initialization.");
                                break e;
                              }
                              F.Vb = ht;
                            }
                            ht = F.Ec, wt = F.Fc, F.Ac = ht, F.Bc = wt, wt += ot, F.Gd = f(Rt, ja), F.Hd = 0, F.rb = f(Pt + 1, Qi), F.sb = 1, F.wa = re ? f(re, Tn) : null, F.Y = 0, F.D.Nb = 0, F.D.wa = F.wa, F.D.Y = F.Y, 0 < F.Aa && (F.D.Y += bt), t(!0), F.oc = ht, F.pc = wt, wt += 832, F.ya = f(Ot, ta), F.aa = 0, F.D.ya = F.ya, F.D.aa = F.aa, F.Aa == 2 && (F.D.aa += bt), F.R = 16 * bt, F.B = 8 * bt, bt = (Rt = ns[F.L]) * F.R, Rt = Rt / 2 * F.B, F.sa = ht, F.ta = wt + bt, F.qa = F.sa, F.ra = F.ta + 16 * K * F.R + Rt, F.Ha = F.qa, F.Ia = F.ra + 8 * K * F.B + Rt, F.$c = 0, wt += X, F.mb = ut ? ht : null, F.nb = ut ? wt : null, t(wt + ut <= F.Fc + F.Vb), ea(F), o(F.Ac, F.Bc, 0, ot), K = 1;
                          }
                        }
                        if (K) {
                          if (W.ka = 0, W.y = F.sa, W.O = F.ta, W.f = F.qa, W.N = F.ra, W.ea = F.Ha, W.Vd = F.Ia, W.fa = F.R, W.Rc = F.B, W.F = null, W.J = 0, !Yo) {
                            for (K = -255; 255 >= K; ++K) Ho[255 + K] = 0 > K ? -K : K;
                            for (K = -1020; 1020 >= K; ++K) Wo[1020 + K] = -128 > K ? -128 : 127 < K ? 127 : K;
                            for (K = -112; 112 >= K; ++K) Vo[112 + K] = -16 > K ? -16 : 15 < K ? 15 : K;
                            for (K = -255; 510 >= K; ++K) Go[255 + K] = 0 > K ? 0 : 255 < K ? 255 : K;
                            Yo = 1;
                          }
                          Mr = Ta, _r = Ss, Hi = ks, fn = Ps, lr = ir, Rr = Ra, ke = Ua, Pe = za, ze = Wa, Xe = l, Ar = Ha, pa = ei, Wi = b, Ya = I, Mo = ji, Ro = oa, To = Bi, Do = qa, Yn[0] = Bs, Yn[1] = Fi, Yn[2] = Os, Yn[3] = js, Yn[4] = Ms, Yn[5] = br, Yn[6] = Rs, Yn[7] = vr, Yn[8] = Ds, Yn[9] = Ts, Tr[0] = Da, Tr[1] = Is, Tr[2] = Cs, Tr[3] = Fs, Tr[4] = Fr, Tr[5] = Es, Tr[6] = Qr, Nr[0] = qs, Nr[1] = na, Nr[2] = Ei, Nr[3] = ra, Nr[4] = Us, Nr[5] = Oi, Nr[6] = ia, K = 1;
                        } else K = 0;
                      }
                      K && (K = (function(fe, Ze) {
                        for (fe.M = 0; fe.M < fe.Va; ++fe.M) {
                          var ie, jt = fe.Jc[fe.M & fe.Xb], Nt = fe.m, He = fe;
                          for (ie = 0; ie < He.za; ++ie) {
                            var ee = Nt, pe = He, Fe = pe.Ac, sn = pe.Bc + 4 * ie, yn = pe.zc, Te = pe.ya[pe.aa + ie];
                            if (pe.Qa.Bb ? Te.$b = dt(ee, pe.Pa.jb[0]) ? 2 + dt(ee, pe.Pa.jb[2]) : dt(ee, pe.Pa.jb[1]) : Te.$b = 0, pe.kc && (Te.Ad = dt(ee, pe.Bd)), Te.Za = !dt(ee, 145) + 0, Te.Za) {
                              var dn = Te.Ob, xn = 0;
                              for (pe = 0; 4 > pe; ++pe) {
                                var Qe, me = yn[0 + pe];
                                for (Qe = 0; 4 > Qe; ++Qe) {
                                  me = wh[Fe[sn + Qe]][me];
                                  for (var we = Xo[dt(ee, me[0])]; 0 < we; ) we = Xo[2 * we + dt(ee, me[we])];
                                  me = -we, Fe[sn + Qe] = me;
                                }
                                i(dn, xn, Fe, sn, 4), xn += 4, yn[0 + pe] = me;
                              }
                            } else me = dt(ee, 156) ? dt(ee, 128) ? 1 : 3 : dt(ee, 163) ? 2 : 0, Te.Ob[0] = me, o(Fe, sn, me, 4), o(yn, 0, me, 4);
                            Te.Dd = dt(ee, 142) ? dt(ee, 114) ? dt(ee, 183) ? 1 : 3 : 2 : 0;
                          }
                          if (He.m.Ka) return Je(fe, 7, "Premature end-of-partition0 encountered.");
                          for (; fe.ja < fe.za; ++fe.ja) {
                            if (He = jt, ee = (Nt = fe).rb[Nt.sb - 1], Fe = Nt.rb[Nt.sb + Nt.ja], ie = Nt.ya[Nt.aa + Nt.ja], sn = Nt.kc ? ie.Ad : 0) ee.la = Fe.la = 0, ie.Za || (ee.Na = Fe.Na = 0), ie.Hc = 0, ie.Gc = 0, ie.ia = 0;
                            else {
                              var De, ye;
                              if (ee = Fe, Fe = He, sn = Nt.Pa.Xc, yn = Nt.ya[Nt.aa + Nt.ja], Te = Nt.pb[yn.$b], pe = yn.ad, dn = 0, xn = Nt.rb[Nt.sb - 1], me = Qe = 0, o(pe, dn, 0, 384), yn.Za) var on = 0, Jn = sn[3];
                              else {
                                we = s(16);
                                var We = ee.Na + xn.Na;
                                if (We = ma(Fe, sn[1], We, Te.Eb, 0, we, 0), ee.Na = xn.Na = (0 < We) + 0, 1 < We) Mr(we, 0, pe, dn);
                                else {
                                  var Nn = we[0] + 3 >> 3;
                                  for (we = 0; 256 > we; we += 16) pe[dn + we] = Nn;
                                }
                                on = 1, Jn = sn[0];
                              }
                              var Ne = 15 & ee.la, tn = 15 & xn.la;
                              for (we = 0; 4 > we; ++we) {
                                var In = 1 & tn;
                                for (Nn = ye = 0; 4 > Nn; ++Nn) Ne = Ne >> 1 | (In = (We = ma(Fe, Jn, We = In + (1 & Ne), Te.Sc, on, pe, dn)) > on) << 7, ye = ye << 2 | (3 < We ? 3 : 1 < We ? 2 : pe[dn + 0] != 0), dn += 16;
                                Ne >>= 4, tn = tn >> 1 | In << 7, Qe = (Qe << 8 | ye) >>> 0;
                              }
                              for (Jn = Ne, on = tn >> 4, De = 0; 4 > De; De += 2) {
                                for (ye = 0, Ne = ee.la >> 4 + De, tn = xn.la >> 4 + De, we = 0; 2 > we; ++we) {
                                  for (In = 1 & tn, Nn = 0; 2 > Nn; ++Nn) We = In + (1 & Ne), Ne = Ne >> 1 | (In = 0 < (We = ma(Fe, sn[2], We, Te.Qc, 0, pe, dn))) << 3, ye = ye << 2 | (3 < We ? 3 : 1 < We ? 2 : pe[dn + 0] != 0), dn += 16;
                                  Ne >>= 2, tn = tn >> 1 | In << 5;
                                }
                                me |= ye << 4 * De, Jn |= Ne << 4 << De, on |= (240 & tn) << De;
                              }
                              ee.la = Jn, xn.la = on, yn.Hc = Qe, yn.Gc = me, yn.ia = 43690 & me ? 0 : Te.ia, sn = !(Qe | me);
                            }
                            if (0 < Nt.L && (Nt.wa[Nt.Y + Nt.ja] = Nt.gd[ie.$b][ie.Za], Nt.wa[Nt.Y + Nt.ja].La |= !sn), He.Ka) return Je(fe, 7, "Premature end-of-file encountered.");
                          }
                          if (ea(fe), Nt = Ze, He = 1, ie = (jt = fe).D, ee = 0 < jt.L && jt.M >= jt.zb && jt.M <= jt.Va, jt.Aa == 0) e: {
                            if (ie.M = jt.M, ie.uc = ee, Ti(jt, ie), He = 1, ie = (ye = jt.D).Nb, ee = (me = ns[jt.L]) * jt.R, Fe = me / 2 * jt.B, we = 16 * ie * jt.R, Nn = 8 * ie * jt.B, sn = jt.sa, yn = jt.ta - ee + we, Te = jt.qa, pe = jt.ra - Fe + Nn, dn = jt.Ha, xn = jt.Ia - Fe + Nn, tn = (Ne = ye.M) == 0, Qe = Ne >= jt.Va - 1, jt.Aa == 2 && Ti(jt, ye), ye.uc) for (In = (We = jt).D.M, t(We.D.uc), ye = We.yb; ye < We.Hb; ++ye) {
                              on = ye, Jn = In;
                              var _n = (Cn = (ln = We).D).Nb;
                              De = ln.R;
                              var Cn = Cn.wa[Cn.Y + on], Fn = ln.sa, Ln = ln.ta + 16 * _n * De + 16 * on, En = Cn.dd, Ie = Cn.tc;
                              if (Ie != 0) if (t(3 <= Ie), ln.L == 1) 0 < on && Ro(Fn, Ln, De, Ie + 4), Cn.La && Do(Fn, Ln, De, Ie), 0 < Jn && Mo(Fn, Ln, De, Ie + 4), Cn.La && To(Fn, Ln, De, Ie);
                              else {
                                var On = ln.B, $n = ln.qa, di = ln.ra + 8 * _n * On + 8 * on, Lr = ln.Ha, ln = ln.Ia + 8 * _n * On + 8 * on;
                                _n = Cn.ld, 0 < on && (Pe(Fn, Ln, De, Ie + 4, En, _n), Xe($n, di, Lr, ln, On, Ie + 4, En, _n)), Cn.La && (pa(Fn, Ln, De, Ie, En, _n), Ya($n, di, Lr, ln, On, Ie, En, _n)), 0 < Jn && (ke(Fn, Ln, De, Ie + 4, En, _n), ze($n, di, Lr, ln, On, Ie + 4, En, _n)), Cn.La && (Ar(Fn, Ln, De, Ie, En, _n), Wi($n, di, Lr, ln, On, Ie, En, _n));
                              }
                            }
                            if (jt.ia && alert("todo:DitherRow"), Nt.put != null) {
                              if (ye = 16 * Ne, Ne = 16 * (Ne + 1), tn ? (Nt.y = jt.sa, Nt.O = jt.ta + we, Nt.f = jt.qa, Nt.N = jt.ra + Nn, Nt.ea = jt.Ha, Nt.W = jt.Ia + Nn) : (ye -= me, Nt.y = sn, Nt.O = yn, Nt.f = Te, Nt.N = pe, Nt.ea = dn, Nt.W = xn), Qe || (Ne -= me), Ne > Nt.o && (Ne = Nt.o), Nt.F = null, Nt.J = null, jt.Fa != null && 0 < jt.Fa.length && ye < Ne && (Nt.J = $e(jt, Nt, ye, Ne - ye), Nt.F = jt.mb, Nt.F == null && Nt.F.length == 0)) {
                                He = Je(jt, 3, "Could not decode alpha data.");
                                break e;
                              }
                              ye < Nt.j && (me = Nt.j - ye, ye = Nt.j, t(!(1 & me)), Nt.O += jt.R * me, Nt.N += jt.B * (me >> 1), Nt.W += jt.B * (me >> 1), Nt.F != null && (Nt.J += Nt.width * me)), ye < Ne && (Nt.O += Nt.v, Nt.N += Nt.v >> 1, Nt.W += Nt.v >> 1, Nt.F != null && (Nt.J += Nt.v), Nt.ka = ye - Nt.j, Nt.U = Nt.va - Nt.v, Nt.T = Ne - ye, He = Nt.put(Nt));
                            }
                            ie + 1 != jt.Ic || Qe || (i(jt.sa, jt.ta - ee, sn, yn + 16 * jt.R, ee), i(jt.qa, jt.ra - Fe, Te, pe + 8 * jt.B, Fe), i(jt.Ha, jt.Ia - Fe, dn, xn + 8 * jt.B, Fe));
                          }
                          if (!He) return Je(fe, 6, "Output aborted.");
                        }
                        return 1;
                      })(F, W)), W.bc != null && W.bc(W), K &= 1;
                    }
                    return K ? (F.cb = 0, K) : 0;
                  })(r, g) || (a = r.a);
                }
              } else a = r.a;
            }
            a == 0 && y.Oa != null && y.Oa.fd && (a = oi(y.ba));
          }
          y = a;
        }
        w = y != 0 ? null : 11 > w ? _.f.RGBA.eb : _.f.kb.y;
      } else w = null;
      return w;
    };
    var al = [3, 4, 3, 4, 4, 2, 2, 4, 4, 4, 2, 1, 1];
  };
  function d(z, et) {
    for (var N = "", E = 0; E < 4; E++) N += String.fromCharCode(z[et++]);
    return N;
  }
  function m(z, et) {
    return z[et + 0] | z[et + 1] << 8;
  }
  function A(z, et) {
    return (z[et + 0] | z[et + 1] << 8 | z[et + 2] << 16) >>> 0;
  }
  function P(z, et) {
    return (z[et + 0] | z[et + 1] << 8 | z[et + 2] << 16 | z[et + 3] << 24) >>> 0;
  }
  new c();
  var p = [0], B = [0], O = [], M = new c(), S = n, Y = (function(z, et) {
    var N = {}, E = 0, q = !1, U = 0, rt = 0;
    if (N.frames = [], !/** @license
       * Copyright (c) 2017 Dominik Homberger
      Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
      The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
      https://webpjs.appspot.com
      WebPRiffParser dominikhlbg@gmail.com
      */
    (function(x, j) {
      for (var R = 0; R < 4; R++) if (x[j + R] != "RIFF".charCodeAt(R)) return !0;
      return !1;
    })(z, et)) {
      for (P(z, et += 4), et += 8; et < z.length; ) {
        var ct = d(z, et), pt = P(z, et += 4);
        et += 4;
        var nt = pt + (1 & pt);
        switch (ct) {
          case "VP8 ":
          case "VP8L":
            N.frames[E] === void 0 && (N.frames[E] = {}), (xt = N.frames[E]).src_off = q ? rt : et - 8, xt.src_size = U + pt + 8, E++, q && (q = !1, U = 0, rt = 0);
            break;
          case "VP8X":
            (xt = N.header = {}).feature_flags = z[et];
            var ft = et + 4;
            xt.canvas_width = 1 + A(z, ft), ft += 3, xt.canvas_height = 1 + A(z, ft), ft += 3;
            break;
          case "ALPH":
            q = !0, U = nt + 8, rt = et - 8;
            break;
          case "ANIM":
            (xt = N.header).bgcolor = P(z, et), ft = et + 4, xt.loop_count = m(z, ft), ft += 2;
            break;
          case "ANMF":
            var At, xt;
            (xt = N.frames[E] = {}).offset_x = 2 * A(z, et), et += 3, xt.offset_y = 2 * A(z, et), et += 3, xt.width = 1 + A(z, et), et += 3, xt.height = 1 + A(z, et), et += 3, xt.duration = A(z, et), et += 3, At = z[et++], xt.dispose = 1 & At, xt.blend = At >> 1 & 1;
        }
        ct != "ANMF" && (et += nt);
      }
      return N;
    }
  })(S, 0);
  Y.response = S, Y.rgbaoutput = !0, Y.dataurl = !1;
  var J = Y.header ? Y.header : null, D = Y.frames ? Y.frames : null;
  if (J) {
    J.loop_counter = J.loop_count, p = [J.canvas_height], B = [J.canvas_width];
    for (var lt = 0; lt < D.length && D[lt].blend != 0; lt++) ;
  }
  var yt = D[0], mt = M.WebPDecodeRGBA(S, yt.src_off, yt.src_size, B, p);
  yt.rgba = mt, yt.imgwidth = B[0], yt.imgheight = p[0];
  for (var tt = 0; tt < B[0] * p[0] * 4; tt++) O[tt] = mt[tt];
  return this.width = B, this.height = p, this.data = O, this;
}
function h1() {
  var n, t = this.internal.__metadata__.metadata, e = unescape(encodeURIComponent(t));
  n = this.internal.__metadata__.rawXml ? e : '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:jspdf="' + this.internal.__metadata__.namespaceUri + '"><jspdf:metadata>' + e.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;") + "</jspdf:metadata></rdf:Description></rdf:RDF></x:xmpmeta>", this.internal.__metadata__.metadataObjectNumber = this.internal.newObject(), this.internal.write("<< /Type /Metadata /Subtype /XML /Length " + n.length + " >>"), this.internal.write("stream"), this.internal.write(n), this.internal.write("endstream"), this.internal.write("endobj");
}
function c1() {
  this.internal.__metadata__.metadataObjectNumber && this.internal.write("/Metadata " + this.internal.__metadata__.metadataObjectNumber + " 0 R");
}
(function(n) {
  var t, e, i, o, s, f, u, c, d, m = function(x) {
    return x = x || {}, this.isStrokeTransparent = x.isStrokeTransparent || !1, this.strokeOpacity = x.strokeOpacity || 1, this.strokeStyle = x.strokeStyle || "#000000", this.fillStyle = x.fillStyle || "#000000", this.isFillTransparent = x.isFillTransparent || !1, this.fillOpacity = x.fillOpacity || 1, this.font = x.font || "10px sans-serif", this.textBaseline = x.textBaseline || "alphabetic", this.textAlign = x.textAlign || "left", this.lineWidth = x.lineWidth || 1, this.lineJoin = x.lineJoin || "miter", this.lineCap = x.lineCap || "butt", this.path = x.path || [], this.transform = x.transform !== void 0 ? x.transform.clone() : new c(), this.globalCompositeOperation = x.globalCompositeOperation || "normal", this.globalAlpha = x.globalAlpha || 1, this.clip_path = x.clip_path || [], this.currentPoint = x.currentPoint || new f(), this.miterLimit = x.miterLimit || 10, this.lastPoint = x.lastPoint || new f(), this.lineDashOffset = x.lineDashOffset || 0, this.lineDash = x.lineDash || [], this.margin = x.margin || [0, 0, 0, 0], this.prevPageLastElemOffset = x.prevPageLastElemOffset || 0, this.ignoreClearRect = typeof x.ignoreClearRect != "boolean" || x.ignoreClearRect, this;
  };
  n.events.push(["initialized", function() {
    this.context2d = new A(this), t = this.internal.f2, e = this.internal.getCoordinateString, i = this.internal.getVerticalCoordinateString, o = this.internal.getHorizontalCoordinate, s = this.internal.getVerticalCoordinate, f = this.internal.Point, u = this.internal.Rectangle, c = this.internal.Matrix, d = new m();
  }]);
  var A = function(x) {
    Object.defineProperty(this, "canvas", { get: function() {
      return { parentNode: !1, style: !1 };
    } });
    var j = x;
    Object.defineProperty(this, "pdf", { get: function() {
      return j;
    } });
    var R = !1;
    Object.defineProperty(this, "pageWrapXEnabled", { get: function() {
      return R;
    }, set: function(k) {
      R = !!k;
    } });
    var V = !1;
    Object.defineProperty(this, "pageWrapYEnabled", { get: function() {
      return V;
    }, set: function(k) {
      V = !!k;
    } });
    var $ = 0;
    Object.defineProperty(this, "posX", { get: function() {
      return $;
    }, set: function(k) {
      isNaN(k) || ($ = k);
    } });
    var Q = 0;
    Object.defineProperty(this, "posY", { get: function() {
      return Q;
    }, set: function(k) {
      isNaN(k) || (Q = k);
    } }), Object.defineProperty(this, "margin", { get: function() {
      return d.margin;
    }, set: function(k) {
      var Lt;
      typeof k == "number" ? Lt = [k, k, k, k] : ((Lt = new Array(4))[0] = k[0], Lt[1] = k.length >= 2 ? k[1] : Lt[0], Lt[2] = k.length >= 3 ? k[2] : Lt[0], Lt[3] = k.length >= 4 ? k[3] : Lt[1]), d.margin = Lt;
    } });
    var it = !1;
    Object.defineProperty(this, "autoPaging", { get: function() {
      return it;
    }, set: function(k) {
      it = k;
    } });
    var at = 0;
    Object.defineProperty(this, "lastBreak", { get: function() {
      return at;
    }, set: function(k) {
      at = k;
    } });
    var dt = [];
    Object.defineProperty(this, "pageBreaks", { get: function() {
      return dt;
    }, set: function(k) {
      dt = k;
    } }), Object.defineProperty(this, "ctx", { get: function() {
      return d;
    }, set: function(k) {
      k instanceof m && (d = k);
    } }), Object.defineProperty(this, "path", { get: function() {
      return d.path;
    }, set: function(k) {
      d.path = k;
    } });
    var _t = [];
    Object.defineProperty(this, "ctxStack", { get: function() {
      return _t;
    }, set: function(k) {
      _t = k;
    } }), Object.defineProperty(this, "fillStyle", { get: function() {
      return this.ctx.fillStyle;
    }, set: function(k) {
      var Lt;
      Lt = P(k), this.ctx.fillStyle = Lt.style, this.ctx.isFillTransparent = Lt.a === 0, this.ctx.fillOpacity = Lt.a, this.pdf.setFillColor(Lt.r, Lt.g, Lt.b, { a: Lt.a }), this.pdf.setTextColor(Lt.r, Lt.g, Lt.b, { a: Lt.a });
    } }), Object.defineProperty(this, "strokeStyle", { get: function() {
      return this.ctx.strokeStyle;
    }, set: function(k) {
      var Lt = P(k);
      this.ctx.strokeStyle = Lt.style, this.ctx.isStrokeTransparent = Lt.a === 0, this.ctx.strokeOpacity = Lt.a, Lt.a === 0 ? this.pdf.setDrawColor(255, 255, 255) : (Lt.a, this.pdf.setDrawColor(Lt.r, Lt.g, Lt.b));
    } }), Object.defineProperty(this, "lineCap", { get: function() {
      return this.ctx.lineCap;
    }, set: function(k) {
      ["butt", "round", "square"].indexOf(k) !== -1 && (this.ctx.lineCap = k, this.pdf.setLineCap(k));
    } }), Object.defineProperty(this, "lineWidth", { get: function() {
      return this.ctx.lineWidth;
    }, set: function(k) {
      isNaN(k) || (this.ctx.lineWidth = k, this.pdf.setLineWidth(k));
    } }), Object.defineProperty(this, "lineJoin", { get: function() {
      return this.ctx.lineJoin;
    }, set: function(k) {
      ["bevel", "round", "miter"].indexOf(k) !== -1 && (this.ctx.lineJoin = k, this.pdf.setLineJoin(k));
    } }), Object.defineProperty(this, "miterLimit", { get: function() {
      return this.ctx.miterLimit;
    }, set: function(k) {
      isNaN(k) || (this.ctx.miterLimit = k, this.pdf.setMiterLimit(k));
    } }), Object.defineProperty(this, "textBaseline", { get: function() {
      return this.ctx.textBaseline;
    }, set: function(k) {
      this.ctx.textBaseline = k;
    } }), Object.defineProperty(this, "textAlign", { get: function() {
      return this.ctx.textAlign;
    }, set: function(k) {
      ["right", "end", "center", "left", "start"].indexOf(k) !== -1 && (this.ctx.textAlign = k);
    } });
    var St = null, kt = null, zt = null;
    Object.defineProperty(this, "fontFaces", { get: function() {
      return zt;
    }, set: function(k) {
      St = null, kt = null, zt = k;
    } }), Object.defineProperty(this, "font", { get: function() {
      return this.ctx.font;
    }, set: function(k) {
      var Lt;
      if (this.ctx.font = k, (Lt = /^\s*(?=(?:(?:[-a-z]+\s*){0,2}(italic|oblique))?)(?=(?:(?:[-a-z]+\s*){0,2}(small-caps))?)(?=(?:(?:[-a-z]+\s*){0,2}(bold(?:er)?|lighter|[1-9]00))?)(?:(?:normal|\1|\2|\3)\s*){0,3}((?:xx?-)?(?:small|large)|medium|smaller|larger|[.\d]+(?:\%|in|[cem]m|ex|p[ctx]))(?:\s*\/\s*(normal|[.\d]+(?:\%|in|[cem]m|ex|p[ctx])))?\s*([-_,\"\'\sa-z0-9]+?)\s*$/i.exec(k)) !== null) {
        var ae = Lt[1];
        Lt[2];
        var Ht = Lt[3], vt = Lt[4];
        Lt[5];
        var Wt = Lt[6], Ct = /^([.\d]+)((?:%|in|[cem]m|ex|p[ctx]))$/i.exec(vt)[2];
        vt = Math.floor(Ct === "px" ? parseFloat(vt) * this.pdf.internal.scaleFactor : Ct === "em" ? parseFloat(vt) * this.pdf.getFontSize() : parseFloat(vt) * this.pdf.internal.scaleFactor), this.pdf.setFontSize(vt);
        var Ut = (function(Tt) {
          var Ue, ge, se = [], oe = Tt.trim();
          if (oe === "") return Ao;
          if (oe in hu) return [hu[oe]];
          for (; oe !== ""; ) {
            switch (ge = null, Ue = (oe = fu(oe)).charAt(0)) {
              case '"':
              case "'":
                ge = i1(oe.substring(1), Ue);
                break;
              default:
                ge = a1(oe);
            }
            if (ge === null || (se.push(ge[0]), (oe = fu(ge[1])) !== "" && oe.charAt(0) !== ",")) return Ao;
            oe = oe.replace(/^,/, "");
          }
          return se;
        })(Wt);
        if (this.fontFaces) {
          var Dt = (function(Tt, Ue) {
            var ge = Tt.getFontList(), se = JSON.stringify(ge);
            if (St === null || kt !== se) {
              var oe = (function(Ee) {
                var qt = [];
                return Object.keys(Ee).forEach(function(Se) {
                  Ee[Se].forEach(function(Yt) {
                    var Qt = null;
                    switch (Yt) {
                      case "bold":
                        Qt = { family: Se, weight: "bold" };
                        break;
                      case "italic":
                        Qt = { family: Se, style: "italic" };
                        break;
                      case "bolditalic":
                        Qt = { family: Se, weight: "bold", style: "italic" };
                        break;
                      case "":
                      case "normal":
                        Qt = { family: Se };
                    }
                    Qt !== null && (Qt.ref = { name: Se, style: Yt }, qt.push(Qt));
                  });
                }), qt;
              })(ge);
              St = (function(Ee) {
                for (var qt = {}, Se = 0; Se < Ee.length; ++Se) {
                  var Yt = _o(Ee[Se]), Qt = Yt.family, Oe = Yt.stretch, le = Yt.style, Vt = Yt.weight;
                  qt[Qt] = qt[Qt] || {}, qt[Qt][Oe] = qt[Qt][Oe] || {}, qt[Qt][Oe][le] = qt[Qt][Oe][le] || {}, qt[Qt][Oe][le][Vt] = Yt;
                }
                return qt;
              })(oe.concat(Ue)), kt = se;
            }
            return St;
          })(this.pdf, this.fontFaces), be = Ut.map(function(Tt) {
            return { family: Tt, stretch: "normal", weight: Ht, style: ae };
          }), ue = (function(Tt, Ue, ge) {
            for (var se = (ge = ge || {}).defaultFontFamily || "times", oe = Object.assign({}, r1, ge.genericFontFamilies || {}), Ee = null, qt = null, Se = 0; Se < Ue.length; ++Se) if (oe[(Ee = _o(Ue[Se])).family] && (Ee.family = oe[Ee.family]), Tt.hasOwnProperty(Ee.family)) {
              qt = Tt[Ee.family];
              break;
            }
            if (!(qt = qt || Tt[se])) throw new Error("Could not find a font-family for the rule '" + cu(Ee) + "' and default family '" + se + "'.");
            if (qt = (function(Yt, Qt) {
              if (Qt[Yt]) return Qt[Yt];
              var Oe = Oo[Yt], le = Oe <= Oo.normal ? -1 : 1, Vt = uu(Qt, ih, Oe, le);
              if (!Vt) throw new Error("Could not find a matching font-stretch value for " + Yt);
              return Vt;
            })(Ee.stretch, qt), qt = (function(Yt, Qt) {
              if (Qt[Yt]) return Qt[Yt];
              for (var Oe = rh[Yt], le = 0; le < Oe.length; ++le) if (Qt[Oe[le]]) return Qt[Oe[le]];
              throw new Error("Could not find a matching font-style for " + Yt);
            })(Ee.style, qt), !(qt = (function(Yt, Qt) {
              if (Qt[Yt]) return Qt[Yt];
              if (Yt === 400 && Qt[500]) return Qt[500];
              if (Yt === 500 && Qt[400]) return Qt[400];
              var Oe = n1[Yt], le = uu(Qt, ah, Oe, Yt < 400 ? -1 : 1);
              if (!le) throw new Error("Could not find a matching font-weight for value " + Yt);
              return le;
            })(Ee.weight, qt))) throw new Error("Failed to resolve a font for the rule '" + cu(Ee) + "'.");
            return qt;
          })(Dt, be);
          this.pdf.setFont(ue.ref.name, ue.ref.style);
        } else {
          var Zt = "";
          (Ht === "bold" || parseInt(Ht, 10) >= 700 || ae === "bold") && (Zt = "bold"), ae === "italic" && (Zt += "italic"), Zt.length === 0 && (Zt = "normal");
          for (var ce = "", he = { arial: "Helvetica", Arial: "Helvetica", verdana: "Helvetica", Verdana: "Helvetica", helvetica: "Helvetica", Helvetica: "Helvetica", "sans-serif": "Helvetica", fixed: "Courier", monospace: "Courier", terminal: "Courier", cursive: "Times", fantasy: "Times", serif: "Times" }, Bt = 0; Bt < Ut.length; Bt++) {
            if (this.pdf.internal.getFont(Ut[Bt], Zt, { noFallback: !0, disableWarning: !0 }) !== void 0) {
              ce = Ut[Bt];
              break;
            }
            if (Zt === "bolditalic" && this.pdf.internal.getFont(Ut[Bt], "bold", { noFallback: !0, disableWarning: !0 }) !== void 0) ce = Ut[Bt], Zt = "bold";
            else if (this.pdf.internal.getFont(Ut[Bt], "normal", { noFallback: !0, disableWarning: !0 }) !== void 0) {
              ce = Ut[Bt], Zt = "normal";
              break;
            }
          }
          if (ce === "") {
            for (var ne = 0; ne < Ut.length; ne++) if (he[Ut[ne]]) {
              ce = he[Ut[ne]];
              break;
            }
          }
          ce = ce === "" ? "Times" : ce, this.pdf.setFont(ce, Zt);
        }
      }
    } }), Object.defineProperty(this, "globalCompositeOperation", { get: function() {
      return this.ctx.globalCompositeOperation;
    }, set: function(k) {
      this.ctx.globalCompositeOperation = k;
    } }), Object.defineProperty(this, "globalAlpha", { get: function() {
      return this.ctx.globalAlpha;
    }, set: function(k) {
      this.ctx.globalAlpha = k;
    } }), Object.defineProperty(this, "lineDashOffset", { get: function() {
      return this.ctx.lineDashOffset;
    }, set: function(k) {
      this.ctx.lineDashOffset = k, xt.call(this);
    } }), Object.defineProperty(this, "lineDash", { get: function() {
      return this.ctx.lineDash;
    }, set: function(k) {
      this.ctx.lineDash = k, xt.call(this);
    } }), Object.defineProperty(this, "ignoreClearRect", { get: function() {
      return this.ctx.ignoreClearRect;
    }, set: function(k) {
      this.ctx.ignoreClearRect = !!k;
    } });
  };
  A.prototype.setLineDash = function(x) {
    this.lineDash = x;
  }, A.prototype.getLineDash = function() {
    return this.lineDash.length % 2 ? this.lineDash.concat(this.lineDash) : this.lineDash.slice();
  }, A.prototype.fill = function() {
    D.call(this, "fill", !1);
  }, A.prototype.stroke = function() {
    D.call(this, "stroke", !1);
  }, A.prototype.beginPath = function() {
    this.path = [{ type: "begin" }];
  }, A.prototype.moveTo = function(x, j) {
    if (isNaN(x) || isNaN(j)) throw Le.error("jsPDF.context2d.moveTo: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.moveTo");
    var R = this.ctx.transform.applyToPoint(new f(x, j));
    this.path.push({ type: "mt", x: R.x, y: R.y }), this.ctx.lastPoint = new f(x, j);
  }, A.prototype.closePath = function() {
    var x = new f(0, 0), j = 0;
    for (j = this.path.length - 1; j !== -1; j--) if (this.path[j].type === "begin" && xe(this.path[j + 1]) === "object" && typeof this.path[j + 1].x == "number") {
      x = new f(this.path[j + 1].x, this.path[j + 1].y);
      break;
    }
    this.path.push({ type: "close" }), this.ctx.lastPoint = new f(x.x, x.y);
  }, A.prototype.lineTo = function(x, j) {
    if (isNaN(x) || isNaN(j)) throw Le.error("jsPDF.context2d.lineTo: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.lineTo");
    var R = this.ctx.transform.applyToPoint(new f(x, j));
    this.path.push({ type: "lt", x: R.x, y: R.y }), this.ctx.lastPoint = new f(R.x, R.y);
  }, A.prototype.clip = function() {
    this.ctx.clip_path = JSON.parse(JSON.stringify(this.path)), D.call(this, null, !0);
  }, A.prototype.quadraticCurveTo = function(x, j, R, V) {
    if (isNaN(R) || isNaN(V) || isNaN(x) || isNaN(j)) throw Le.error("jsPDF.context2d.quadraticCurveTo: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.quadraticCurveTo");
    var $ = this.ctx.transform.applyToPoint(new f(R, V)), Q = this.ctx.transform.applyToPoint(new f(x, j));
    this.path.push({ type: "qct", x1: Q.x, y1: Q.y, x: $.x, y: $.y }), this.ctx.lastPoint = new f($.x, $.y);
  }, A.prototype.bezierCurveTo = function(x, j, R, V, $, Q) {
    if (isNaN($) || isNaN(Q) || isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V)) throw Le.error("jsPDF.context2d.bezierCurveTo: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.bezierCurveTo");
    var it = this.ctx.transform.applyToPoint(new f($, Q)), at = this.ctx.transform.applyToPoint(new f(x, j)), dt = this.ctx.transform.applyToPoint(new f(R, V));
    this.path.push({ type: "bct", x1: at.x, y1: at.y, x2: dt.x, y2: dt.y, x: it.x, y: it.y }), this.ctx.lastPoint = new f(it.x, it.y);
  }, A.prototype.arc = function(x, j, R, V, $, Q) {
    if (isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V) || isNaN($)) throw Le.error("jsPDF.context2d.arc: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.arc");
    if (Q = !!Q, !this.ctx.transform.isIdentity) {
      var it = this.ctx.transform.applyToPoint(new f(x, j));
      x = it.x, j = it.y;
      var at = this.ctx.transform.applyToPoint(new f(0, R)), dt = this.ctx.transform.applyToPoint(new f(0, 0));
      R = Math.sqrt(Math.pow(at.x - dt.x, 2) + Math.pow(at.y - dt.y, 2));
    }
    Math.abs($ - V) >= 2 * Math.PI && (V = 0, $ = 2 * Math.PI), this.path.push({ type: "arc", x, y: j, radius: R, startAngle: V, endAngle: $, counterclockwise: Q });
  }, A.prototype.arcTo = function(x, j, R, V, $) {
    throw new Error("arcTo not implemented.");
  }, A.prototype.rect = function(x, j, R, V) {
    if (isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V)) throw Le.error("jsPDF.context2d.rect: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.rect");
    this.moveTo(x, j), this.lineTo(x + R, j), this.lineTo(x + R, j + V), this.lineTo(x, j + V), this.lineTo(x, j), this.lineTo(x + R, j), this.lineTo(x, j);
  }, A.prototype.fillRect = function(x, j, R, V) {
    if (isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V)) throw Le.error("jsPDF.context2d.fillRect: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.fillRect");
    if (!p.call(this)) {
      var $ = {};
      this.lineCap !== "butt" && ($.lineCap = this.lineCap, this.lineCap = "butt"), this.lineJoin !== "miter" && ($.lineJoin = this.lineJoin, this.lineJoin = "miter"), this.beginPath(), this.rect(x, j, R, V), this.fill(), $.hasOwnProperty("lineCap") && (this.lineCap = $.lineCap), $.hasOwnProperty("lineJoin") && (this.lineJoin = $.lineJoin);
    }
  }, A.prototype.strokeRect = function(x, j, R, V) {
    if (isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V)) throw Le.error("jsPDF.context2d.strokeRect: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.strokeRect");
    B.call(this) || (this.beginPath(), this.rect(x, j, R, V), this.stroke());
  }, A.prototype.clearRect = function(x, j, R, V) {
    if (isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V)) throw Le.error("jsPDF.context2d.clearRect: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.clearRect");
    this.ignoreClearRect || (this.fillStyle = "#ffffff", this.fillRect(x, j, R, V));
  }, A.prototype.save = function(x) {
    x = typeof x != "boolean" || x;
    for (var j = this.pdf.internal.getCurrentPageInfo().pageNumber, R = 0; R < this.pdf.internal.getNumberOfPages(); R++) this.pdf.setPage(R + 1), this.pdf.internal.out("q");
    if (this.pdf.setPage(j), x) {
      this.ctx.fontSize = this.pdf.internal.getFontSize();
      var V = new m(this.ctx);
      this.ctxStack.push(this.ctx), this.ctx = V;
    }
  }, A.prototype.restore = function(x) {
    x = typeof x != "boolean" || x;
    for (var j = this.pdf.internal.getCurrentPageInfo().pageNumber, R = 0; R < this.pdf.internal.getNumberOfPages(); R++) this.pdf.setPage(R + 1), this.pdf.internal.out("Q");
    this.pdf.setPage(j), x && this.ctxStack.length !== 0 && (this.ctx = this.ctxStack.pop(), this.fillStyle = this.ctx.fillStyle, this.strokeStyle = this.ctx.strokeStyle, this.font = this.ctx.font, this.lineCap = this.ctx.lineCap, this.lineWidth = this.ctx.lineWidth, this.lineJoin = this.ctx.lineJoin, this.lineDash = this.ctx.lineDash, this.lineDashOffset = this.ctx.lineDashOffset);
  }, A.prototype.toDataURL = function() {
    throw new Error("toDataUrl not implemented.");
  };
  var P = function(x) {
    var j, R, V, $;
    if (x.isCanvasGradient === !0 && (x = x.getColor()), !x) return { r: 0, g: 0, b: 0, a: 0, style: x };
    if (/transparent|rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*0+\s*\)/.test(x)) j = 0, R = 0, V = 0, $ = 0;
    else {
      var Q = /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(x);
      if (Q !== null) j = parseInt(Q[1]), R = parseInt(Q[2]), V = parseInt(Q[3]), $ = 1;
      else if ((Q = /rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/.exec(x)) !== null) j = parseInt(Q[1]), R = parseInt(Q[2]), V = parseInt(Q[3]), $ = parseFloat(Q[4]);
      else {
        if ($ = 1, typeof x == "string" && x.charAt(0) !== "#") {
          var it = new Ku(x);
          x = it.ok ? it.toHex() : "#000000";
        }
        x.length === 4 ? (j = x.substring(1, 2), j += j, R = x.substring(2, 3), R += R, V = x.substring(3, 4), V += V) : (j = x.substring(1, 3), R = x.substring(3, 5), V = x.substring(5, 7)), j = parseInt(j, 16), R = parseInt(R, 16), V = parseInt(V, 16);
      }
    }
    return { r: j, g: R, b: V, a: $, style: x };
  }, p = function() {
    return this.ctx.isFillTransparent || this.globalAlpha == 0;
  }, B = function() {
    return !!(this.ctx.isStrokeTransparent || this.globalAlpha == 0);
  };
  A.prototype.fillText = function(x, j, R, V) {
    if (isNaN(j) || isNaN(R) || typeof x != "string") throw Le.error("jsPDF.context2d.fillText: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.fillText");
    if (V = isNaN(V) ? void 0 : V, !p.call(this)) {
      var $ = nt(this.ctx.transform.rotation), Q = this.ctx.transform.scaleX;
      E.call(this, { text: x, x: j, y: R, scale: Q, angle: $, align: this.textAlign, maxWidth: V });
    }
  }, A.prototype.strokeText = function(x, j, R, V) {
    if (isNaN(j) || isNaN(R) || typeof x != "string") throw Le.error("jsPDF.context2d.strokeText: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.strokeText");
    if (!B.call(this)) {
      V = isNaN(V) ? void 0 : V;
      var $ = nt(this.ctx.transform.rotation), Q = this.ctx.transform.scaleX;
      E.call(this, { text: x, x: j, y: R, scale: Q, renderingMode: "stroke", angle: $, align: this.textAlign, maxWidth: V });
    }
  }, A.prototype.measureText = function(x) {
    if (typeof x != "string") throw Le.error("jsPDF.context2d.measureText: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.measureText");
    var j = this.pdf, R = this.pdf.internal.scaleFactor, V = j.internal.getFontSize(), $ = j.getStringUnitWidth(x) * V / j.internal.scaleFactor;
    return new function(Q) {
      var it = (Q = Q || {}).width || 0;
      return Object.defineProperty(this, "width", { get: function() {
        return it;
      } }), this;
    }({ width: $ *= Math.round(96 * R / 72 * 1e4) / 1e4 });
  }, A.prototype.scale = function(x, j) {
    if (isNaN(x) || isNaN(j)) throw Le.error("jsPDF.context2d.scale: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.scale");
    var R = new c(x, 0, 0, j, 0, 0);
    this.ctx.transform = this.ctx.transform.multiply(R);
  }, A.prototype.rotate = function(x) {
    if (isNaN(x)) throw Le.error("jsPDF.context2d.rotate: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.rotate");
    var j = new c(Math.cos(x), Math.sin(x), -Math.sin(x), Math.cos(x), 0, 0);
    this.ctx.transform = this.ctx.transform.multiply(j);
  }, A.prototype.translate = function(x, j) {
    if (isNaN(x) || isNaN(j)) throw Le.error("jsPDF.context2d.translate: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.translate");
    var R = new c(1, 0, 0, 1, x, j);
    this.ctx.transform = this.ctx.transform.multiply(R);
  }, A.prototype.transform = function(x, j, R, V, $, Q) {
    if (isNaN(x) || isNaN(j) || isNaN(R) || isNaN(V) || isNaN($) || isNaN(Q)) throw Le.error("jsPDF.context2d.transform: Invalid arguments", arguments), new Error("Invalid arguments passed to jsPDF.context2d.transform");
    var it = new c(x, j, R, V, $, Q);
    this.ctx.transform = this.ctx.transform.multiply(it);
  }, A.prototype.setTransform = function(x, j, R, V, $, Q) {
    x = isNaN(x) ? 1 : x, j = isNaN(j) ? 0 : j, R = isNaN(R) ? 0 : R, V = isNaN(V) ? 1 : V, $ = isNaN($) ? 0 : $, Q = isNaN(Q) ? 0 : Q, this.ctx.transform = new c(x, j, R, V, $, Q);
  };
  var O = function() {
    return this.margin[0] > 0 || this.margin[1] > 0 || this.margin[2] > 0 || this.margin[3] > 0;
  };
  A.prototype.drawImage = function(x, j, R, V, $, Q, it, at, dt) {
    var _t = this.pdf.getImageProperties(x), St = 1, kt = 1, zt = 1, k = 1;
    V !== void 0 && at !== void 0 && (zt = at / V, k = dt / $, St = _t.width / V * at / V, kt = _t.height / $ * dt / $), Q === void 0 && (Q = j, it = R, j = 0, R = 0), V !== void 0 && at === void 0 && (at = V, dt = $), V === void 0 && at === void 0 && (at = _t.width, dt = _t.height);
    var Lt = this.ctx.transform.decompose(), ae = nt(Lt.rotate.shx), Ht = new c(), vt = (Ht = (Ht = (Ht = Ht.multiply(Lt.translate)).multiply(Lt.skew)).multiply(Lt.scale)).applyToRectangle(new u(Q - j * zt, it - R * k, V * St, $ * kt));
    if (this.autoPaging) {
      for (var Wt, Ct = M.call(this, vt), Ut = [], Dt = 0; Dt < Ct.length; Dt += 1) Ut.indexOf(Ct[Dt]) === -1 && Ut.push(Ct[Dt]);
      J(Ut);
      for (var be = Ut[0], ue = Ut[Ut.length - 1], Zt = be; Zt < ue + 1; Zt++) {
        this.pdf.setPage(Zt);
        var ce = this.pdf.internal.pageSize.width - this.margin[3] - this.margin[1], he = Zt === 1 ? this.posY + this.margin[0] : this.margin[0], Bt = this.pdf.internal.pageSize.height - this.posY - this.margin[0] - this.margin[2], ne = this.pdf.internal.pageSize.height - this.margin[0] - this.margin[2], Tt = Zt === 1 ? 0 : Bt + (Zt - 2) * ne;
        if (this.ctx.clip_path.length !== 0) {
          var Ue = this.path;
          Wt = JSON.parse(JSON.stringify(this.ctx.clip_path)), this.path = Y(Wt, this.posX + this.margin[3], -Tt + he + this.ctx.prevPageLastElemOffset), lt.call(this, "fill", !0), this.path = Ue;
        }
        var ge = JSON.parse(JSON.stringify(vt));
        ge = Y([ge], this.posX + this.margin[3], -Tt + he + this.ctx.prevPageLastElemOffset)[0];
        var se = (Zt > be || Zt < ue) && O.call(this);
        se && (this.pdf.saveGraphicsState(), this.pdf.rect(this.margin[3], this.margin[0], ce, ne, null).clip().discardPath()), this.pdf.addImage(x, "JPEG", ge.x, ge.y, ge.w, ge.h, null, null, ae), se && this.pdf.restoreGraphicsState();
      }
    } else this.pdf.addImage(x, "JPEG", vt.x, vt.y, vt.w, vt.h, null, null, ae);
  };
  var M = function(x, j, R) {
    var V = [];
    j = j || this.pdf.internal.pageSize.width, R = R || this.pdf.internal.pageSize.height - this.margin[0] - this.margin[2];
    var $ = this.posY + this.ctx.prevPageLastElemOffset;
    switch (x.type) {
      default:
      case "mt":
      case "lt":
        V.push(Math.floor((x.y + $) / R) + 1);
        break;
      case "arc":
        V.push(Math.floor((x.y + $ - x.radius) / R) + 1), V.push(Math.floor((x.y + $ + x.radius) / R) + 1);
        break;
      case "qct":
        var Q = ft(this.ctx.lastPoint.x, this.ctx.lastPoint.y, x.x1, x.y1, x.x, x.y);
        V.push(Math.floor((Q.y + $) / R) + 1), V.push(Math.floor((Q.y + Q.h + $) / R) + 1);
        break;
      case "bct":
        var it = At(this.ctx.lastPoint.x, this.ctx.lastPoint.y, x.x1, x.y1, x.x2, x.y2, x.x, x.y);
        V.push(Math.floor((it.y + $) / R) + 1), V.push(Math.floor((it.y + it.h + $) / R) + 1);
        break;
      case "rect":
        V.push(Math.floor((x.y + $) / R) + 1), V.push(Math.floor((x.y + x.h + $) / R) + 1);
    }
    for (var at = 0; at < V.length; at += 1) for (; this.pdf.internal.getNumberOfPages() < V[at]; ) S.call(this);
    return V;
  }, S = function() {
    var x = this.fillStyle, j = this.strokeStyle, R = this.font, V = this.lineCap, $ = this.lineWidth, Q = this.lineJoin;
    this.pdf.addPage(), this.fillStyle = x, this.strokeStyle = j, this.font = R, this.lineCap = V, this.lineWidth = $, this.lineJoin = Q;
  }, Y = function(x, j, R) {
    for (var V = 0; V < x.length; V++) switch (x[V].type) {
      case "bct":
        x[V].x2 += j, x[V].y2 += R;
      case "qct":
        x[V].x1 += j, x[V].y1 += R;
      default:
        x[V].x += j, x[V].y += R;
    }
    return x;
  }, J = function(x) {
    return x.sort(function(j, R) {
      return j - R;
    });
  }, D = function(x, j) {
    var R = this.fillStyle, V = this.strokeStyle, $ = this.lineCap, Q = this.lineWidth, it = Math.abs(Q * this.ctx.transform.scaleX), at = this.lineJoin;
    if (this.autoPaging) {
      for (var dt, _t, St = JSON.parse(JSON.stringify(this.path)), kt = JSON.parse(JSON.stringify(this.path)), zt = [], k = 0; k < kt.length; k++) if (kt[k].x !== void 0) for (var Lt = M.call(this, kt[k]), ae = 0; ae < Lt.length; ae += 1) zt.indexOf(Lt[ae]) === -1 && zt.push(Lt[ae]);
      for (var Ht = 0; Ht < zt.length; Ht++) for (; this.pdf.internal.getNumberOfPages() < zt[Ht]; ) S.call(this);
      J(zt);
      for (var vt = zt[0], Wt = zt[zt.length - 1], Ct = vt; Ct < Wt + 1; Ct++) {
        this.pdf.setPage(Ct), this.fillStyle = R, this.strokeStyle = V, this.lineCap = $, this.lineWidth = it, this.lineJoin = at;
        var Ut = this.pdf.internal.pageSize.width - this.margin[3] - this.margin[1], Dt = Ct === 1 ? this.posY + this.margin[0] : this.margin[0], be = this.pdf.internal.pageSize.height - this.posY - this.margin[0] - this.margin[2], ue = this.pdf.internal.pageSize.height - this.margin[0] - this.margin[2], Zt = Ct === 1 ? 0 : be + (Ct - 2) * ue;
        if (this.ctx.clip_path.length !== 0) {
          var ce = this.path;
          dt = JSON.parse(JSON.stringify(this.ctx.clip_path)), this.path = Y(dt, this.posX + this.margin[3], -Zt + Dt + this.ctx.prevPageLastElemOffset), lt.call(this, x, !0), this.path = ce;
        }
        if (_t = JSON.parse(JSON.stringify(St)), this.path = Y(_t, this.posX + this.margin[3], -Zt + Dt + this.ctx.prevPageLastElemOffset), j === !1 || Ct === 0) {
          var he = (Ct > vt || Ct < Wt) && O.call(this);
          he && (this.pdf.saveGraphicsState(), this.pdf.rect(this.margin[3], this.margin[0], Ut, ue, null).clip().discardPath()), lt.call(this, x, j), he && this.pdf.restoreGraphicsState();
        }
        this.lineWidth = Q;
      }
      this.path = St;
    } else this.lineWidth = it, lt.call(this, x, j), this.lineWidth = Q;
  }, lt = function(x, j) {
    if ((x !== "stroke" || j || !B.call(this)) && (x === "stroke" || j || !p.call(this))) {
      for (var R, V, $ = [], Q = this.path, it = 0; it < Q.length; it++) {
        var at = Q[it];
        switch (at.type) {
          case "begin":
            $.push({ begin: !0 });
            break;
          case "close":
            $.push({ close: !0 });
            break;
          case "mt":
            $.push({ start: at, deltas: [], abs: [] });
            break;
          case "lt":
            var dt = $.length;
            if (Q[it - 1] && !isNaN(Q[it - 1].x) && (R = [at.x - Q[it - 1].x, at.y - Q[it - 1].y], dt > 0)) {
              for (; dt >= 0; dt--) if ($[dt - 1].close !== !0 && $[dt - 1].begin !== !0) {
                $[dt - 1].deltas.push(R), $[dt - 1].abs.push(at);
                break;
              }
            }
            break;
          case "bct":
            R = [at.x1 - Q[it - 1].x, at.y1 - Q[it - 1].y, at.x2 - Q[it - 1].x, at.y2 - Q[it - 1].y, at.x - Q[it - 1].x, at.y - Q[it - 1].y], $[$.length - 1].deltas.push(R);
            break;
          case "qct":
            var _t = Q[it - 1].x + 2 / 3 * (at.x1 - Q[it - 1].x), St = Q[it - 1].y + 2 / 3 * (at.y1 - Q[it - 1].y), kt = at.x + 2 / 3 * (at.x1 - at.x), zt = at.y + 2 / 3 * (at.y1 - at.y), k = at.x, Lt = at.y;
            R = [_t - Q[it - 1].x, St - Q[it - 1].y, kt - Q[it - 1].x, zt - Q[it - 1].y, k - Q[it - 1].x, Lt - Q[it - 1].y], $[$.length - 1].deltas.push(R);
            break;
          case "arc":
            $.push({ deltas: [], abs: [], arc: !0 }), Array.isArray($[$.length - 1].abs) && $[$.length - 1].abs.push(at);
        }
      }
      V = j ? null : x === "stroke" ? "stroke" : "fill";
      for (var ae = !1, Ht = 0; Ht < $.length; Ht++) if ($[Ht].arc) for (var vt = $[Ht].abs, Wt = 0; Wt < vt.length; Wt++) {
        var Ct = vt[Wt];
        Ct.type === "arc" ? tt.call(this, Ct.x, Ct.y, Ct.radius, Ct.startAngle, Ct.endAngle, Ct.counterclockwise, void 0, j, !ae) : q.call(this, Ct.x, Ct.y), ae = !0;
      }
      else if ($[Ht].close === !0) this.pdf.internal.out("h"), ae = !1;
      else if ($[Ht].begin !== !0) {
        var Ut = $[Ht].start.x, Dt = $[Ht].start.y;
        U.call(this, $[Ht].deltas, Ut, Dt), ae = !0;
      }
      V && z.call(this, V), j && et.call(this);
    }
  }, yt = function(x) {
    var j = this.pdf.internal.getFontSize() / this.pdf.internal.scaleFactor, R = j * (this.pdf.internal.getLineHeightFactor() - 1);
    switch (this.ctx.textBaseline) {
      case "bottom":
        return x - R;
      case "top":
        return x + j - R;
      case "hanging":
        return x + j - 2 * R;
      case "middle":
        return x + j / 2 - R;
      default:
        return x;
    }
  }, mt = function(x) {
    return x + this.pdf.internal.getFontSize() / this.pdf.internal.scaleFactor * (this.pdf.internal.getLineHeightFactor() - 1);
  };
  A.prototype.createLinearGradient = function() {
    var x = function() {
    };
    return x.colorStops = [], x.addColorStop = function(j, R) {
      this.colorStops.push([j, R]);
    }, x.getColor = function() {
      return this.colorStops.length === 0 ? "#000000" : this.colorStops[0][1];
    }, x.isCanvasGradient = !0, x;
  }, A.prototype.createPattern = function() {
    return this.createLinearGradient();
  }, A.prototype.createRadialGradient = function() {
    return this.createLinearGradient();
  };
  var tt = function(x, j, R, V, $, Q, it, at, dt) {
    for (var _t = ct.call(this, R, V, $, Q), St = 0; St < _t.length; St++) {
      var kt = _t[St];
      St === 0 && (dt ? N.call(this, kt.x1 + x, kt.y1 + j) : q.call(this, kt.x1 + x, kt.y1 + j)), rt.call(this, x, j, kt.x2, kt.y2, kt.x3, kt.y3, kt.x4, kt.y4);
    }
    at ? et.call(this) : z.call(this, it);
  }, z = function(x) {
    switch (x) {
      case "stroke":
        this.pdf.internal.out("S");
        break;
      case "fill":
        this.pdf.internal.out("f");
    }
  }, et = function() {
    this.pdf.clip(), this.pdf.discardPath();
  }, N = function(x, j) {
    this.pdf.internal.out(e(x) + " " + i(j) + " m");
  }, E = function(x) {
    var j;
    switch (x.align) {
      case "right":
      case "end":
        j = "right";
        break;
      case "center":
        j = "center";
        break;
      default:
        j = "left";
    }
    var R, V, $, Q = this.pdf.getTextDimensions(x.text), it = yt.call(this, x.y), at = mt.call(this, it) - Q.h, dt = this.ctx.transform.applyToPoint(new f(x.x, it));
    if (this.autoPaging) {
      var _t = this.ctx.transform.decompose(), St = new c();
      St = (St = (St = St.multiply(_t.translate)).multiply(_t.skew)).multiply(_t.scale);
      for (var kt = this.ctx.transform.applyToRectangle(new u(x.x, it, Q.w, Q.h)), zt = St.applyToRectangle(new u(x.x, at, Q.w, Q.h)), k = M.call(this, zt), Lt = [], ae = 0; ae < k.length; ae += 1) Lt.indexOf(k[ae]) === -1 && Lt.push(k[ae]);
      J(Lt);
      for (var Ht = Lt[0], vt = Lt[Lt.length - 1], Wt = Ht; Wt < vt + 1; Wt++) {
        this.pdf.setPage(Wt);
        var Ct = Wt === 1 ? this.posY + this.margin[0] : this.margin[0], Ut = this.pdf.internal.pageSize.height - this.posY - this.margin[0] - this.margin[2], Dt = this.pdf.internal.pageSize.height - this.margin[2], be = Dt - this.margin[0], ue = this.pdf.internal.pageSize.width - this.margin[1], Zt = ue - this.margin[3], ce = Wt === 1 ? 0 : Ut + (Wt - 2) * be;
        if (this.ctx.clip_path.length !== 0) {
          var he = this.path;
          R = JSON.parse(JSON.stringify(this.ctx.clip_path)), this.path = Y(R, this.posX + this.margin[3], -1 * ce + Ct), lt.call(this, "fill", !0), this.path = he;
        }
        var Bt = Y([JSON.parse(JSON.stringify(zt))], this.posX + this.margin[3], -ce + Ct + this.ctx.prevPageLastElemOffset)[0];
        x.scale >= 0.01 && (V = this.pdf.internal.getFontSize(), this.pdf.setFontSize(V * x.scale), $ = this.lineWidth, this.lineWidth = $ * x.scale);
        var ne = this.autoPaging !== "text";
        if (ne || Bt.y + Bt.h <= Dt) {
          if (ne || Bt.y >= Ct && Bt.x <= ue) {
            var Tt = ne ? x.text : this.pdf.splitTextToSize(x.text, x.maxWidth || ue - Bt.x)[0], Ue = Y([JSON.parse(JSON.stringify(kt))], this.posX + this.margin[3], -ce + Ct + this.ctx.prevPageLastElemOffset)[0], ge = ne && (Wt > Ht || Wt < vt) && O.call(this);
            ge && (this.pdf.saveGraphicsState(), this.pdf.rect(this.margin[3], this.margin[0], Zt, be, null).clip().discardPath()), this.pdf.text(Tt, Ue.x, Ue.y, { angle: x.angle, align: j, renderingMode: x.renderingMode }), ge && this.pdf.restoreGraphicsState();
          }
        } else Bt.y < Dt && (this.ctx.prevPageLastElemOffset += Dt - Bt.y);
        x.scale >= 0.01 && (this.pdf.setFontSize(V), this.lineWidth = $);
      }
    } else x.scale >= 0.01 && (V = this.pdf.internal.getFontSize(), this.pdf.setFontSize(V * x.scale), $ = this.lineWidth, this.lineWidth = $ * x.scale), this.pdf.text(x.text, dt.x + this.posX, dt.y + this.posY, { angle: x.angle, align: j, renderingMode: x.renderingMode, maxWidth: x.maxWidth }), x.scale >= 0.01 && (this.pdf.setFontSize(V), this.lineWidth = $);
  }, q = function(x, j, R, V) {
    R = R || 0, V = V || 0, this.pdf.internal.out(e(x + R) + " " + i(j + V) + " l");
  }, U = function(x, j, R) {
    return this.pdf.lines(x, j, R, null, null);
  }, rt = function(x, j, R, V, $, Q, it, at) {
    this.pdf.internal.out([t(o(R + x)), t(s(V + j)), t(o($ + x)), t(s(Q + j)), t(o(it + x)), t(s(at + j)), "c"].join(" "));
  }, ct = function(x, j, R, V) {
    for (var $ = 2 * Math.PI, Q = Math.PI / 2; j > R; ) j -= $;
    var it = Math.abs(R - j);
    it < $ && V && (it = $ - it);
    for (var at = [], dt = V ? -1 : 1, _t = j; it > 1e-5; ) {
      var St = _t + dt * Math.min(it, Q);
      at.push(pt.call(this, x, _t, St)), it -= Math.abs(St - _t), _t = St;
    }
    return at;
  }, pt = function(x, j, R) {
    var V = (R - j) / 2, $ = x * Math.cos(V), Q = x * Math.sin(V), it = $, at = -Q, dt = it * it + at * at, _t = dt + it * $ + at * Q, St = 4 / 3 * (Math.sqrt(2 * dt * _t) - _t) / (it * Q - at * $), kt = it - St * at, zt = at + St * it, k = kt, Lt = -zt, ae = V + j, Ht = Math.cos(ae), vt = Math.sin(ae);
    return { x1: x * Math.cos(j), y1: x * Math.sin(j), x2: kt * Ht - zt * vt, y2: kt * vt + zt * Ht, x3: k * Ht - Lt * vt, y3: k * vt + Lt * Ht, x4: x * Math.cos(R), y4: x * Math.sin(R) };
  }, nt = function(x) {
    return 180 * x / Math.PI;
  }, ft = function(x, j, R, V, $, Q) {
    var it = x + 0.5 * (R - x), at = j + 0.5 * (V - j), dt = $ + 0.5 * (R - $), _t = Q + 0.5 * (V - Q), St = Math.min(x, $, it, dt), kt = Math.max(x, $, it, dt), zt = Math.min(j, Q, at, _t), k = Math.max(j, Q, at, _t);
    return new u(St, zt, kt - St, k - zt);
  }, At = function(x, j, R, V, $, Q, it, at) {
    var dt, _t, St, kt, zt, k, Lt, ae, Ht, vt, Wt, Ct, Ut, Dt, be = R - x, ue = V - j, Zt = $ - R, ce = Q - V, he = it - $, Bt = at - Q;
    for (_t = 0; _t < 41; _t++) Ht = (Lt = (St = x + (dt = _t / 40) * be) + dt * ((zt = R + dt * Zt) - St)) + dt * (zt + dt * ($ + dt * he - zt) - Lt), vt = (ae = (kt = j + dt * ue) + dt * ((k = V + dt * ce) - kt)) + dt * (k + dt * (Q + dt * Bt - k) - ae), _t == 0 ? (Wt = Ht, Ct = vt, Ut = Ht, Dt = vt) : (Wt = Math.min(Wt, Ht), Ct = Math.min(Ct, vt), Ut = Math.max(Ut, Ht), Dt = Math.max(Dt, vt));
    return new u(Math.round(Wt), Math.round(Ct), Math.round(Ut - Wt), Math.round(Dt - Ct));
  }, xt = function() {
    if (this.prevLineDash || this.ctx.lineDash.length || this.ctx.lineDashOffset) {
      var x, j, R = (x = this.ctx.lineDash, j = this.ctx.lineDashOffset, JSON.stringify({ lineDash: x, lineDashOffset: j }));
      this.prevLineDash !== R && (this.pdf.setLineDash(this.ctx.lineDash, this.ctx.lineDashOffset), this.prevLineDash = R);
    }
  };
})(Mt.API), /**
 * @license
 * jsPDF filters PlugIn
 * Copyright (c) 2014 Aras Abbasi
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = function(f) {
    var u, c, d, m, A, P, p, B, O, M;
    for (c = [], d = 0, m = (f += u = "\0\0\0\0".slice(f.length % 4 || 4)).length; m > d; d += 4) (A = (f.charCodeAt(d) << 24) + (f.charCodeAt(d + 1) << 16) + (f.charCodeAt(d + 2) << 8) + f.charCodeAt(d + 3)) !== 0 ? (P = (A = ((A = ((A = ((A = (A - (M = A % 85)) / 85) - (O = A % 85)) / 85) - (B = A % 85)) / 85) - (p = A % 85)) / 85) % 85, c.push(P + 33, p + 33, B + 33, O + 33, M + 33)) : c.push(122);
    return (function(S, Y) {
      for (var J = Y; J > 0; J--) S.pop();
    })(c, u.length), String.fromCharCode.apply(String, c) + "~>";
  }, e = function(f) {
    var u, c, d, m, A, P = String, p = "length", B = 255, O = "charCodeAt", M = "slice", S = "replace";
    for (f[M](-2), f = f[M](0, -2)[S](/\s/g, "")[S]("z", "!!!!!"), d = [], m = 0, A = (f += u = "uuuuu"[M](f[p] % 5 || 5))[p]; A > m; m += 5) c = 52200625 * (f[O](m) - 33) + 614125 * (f[O](m + 1) - 33) + 7225 * (f[O](m + 2) - 33) + 85 * (f[O](m + 3) - 33) + (f[O](m + 4) - 33), d.push(B & c >> 24, B & c >> 16, B & c >> 8, B & c);
    return (function(Y, J) {
      for (var D = J; D > 0; D--) Y.pop();
    })(d, u[p]), P.fromCharCode.apply(P, d);
  }, i = function(f) {
    return f.split("").map(function(u) {
      return ("0" + u.charCodeAt().toString(16)).slice(-2);
    }).join("") + ">";
  }, o = function(f) {
    var u = new RegExp(/^([0-9A-Fa-f]{2})+$/);
    if ((f = f.replace(/\s/g, "")).indexOf(">") !== -1 && (f = f.substr(0, f.indexOf(">"))), f.length % 2 && (f += "0"), u.test(f) === !1) return "";
    for (var c = "", d = 0; d < f.length; d += 2) c += String.fromCharCode("0x" + (f[d] + f[d + 1]));
    return c;
  }, s = function(f) {
    for (var u = new Uint8Array(f.length), c = f.length; c--; ) u[c] = f.charCodeAt(c);
    return (u = So(u)).reduce(function(d, m) {
      return d + String.fromCharCode(m);
    }, "");
  };
  n.processDataByFilters = function(f, u) {
    var c = 0, d = f || "", m = [];
    for (typeof (u = u || []) == "string" && (u = [u]), c = 0; c < u.length; c += 1) switch (u[c]) {
      case "ASCII85Decode":
      case "/ASCII85Decode":
        d = e(d), m.push("/ASCII85Encode");
        break;
      case "ASCII85Encode":
      case "/ASCII85Encode":
        d = t(d), m.push("/ASCII85Decode");
        break;
      case "ASCIIHexDecode":
      case "/ASCIIHexDecode":
        d = o(d), m.push("/ASCIIHexEncode");
        break;
      case "ASCIIHexEncode":
      case "/ASCIIHexEncode":
        d = i(d), m.push("/ASCIIHexDecode");
        break;
      case "FlateEncode":
      case "/FlateEncode":
        d = s(d), m.push("/FlateDecode");
        break;
      default:
        throw new Error('The filter: "' + u[c] + '" is not implemented');
    }
    return { data: d, reverseChain: m.reverse().join(" ") };
  };
})(Mt.API), /**
 * @license
 * jsPDF fileloading PlugIn
 * Copyright (c) 2018 Aras Abbasi (aras.abbasi@gmail.com)
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  n.loadFile = function(t, e, i) {
    return (function(o, s, f) {
      s = s !== !1, f = typeof f == "function" ? f : function() {
      };
      var u = void 0;
      try {
        u = (function(c, d, m) {
          var A = new XMLHttpRequest(), P = 0, p = function(B) {
            var O = B.length, M = [], S = String.fromCharCode;
            for (P = 0; P < O; P += 1) M.push(S(255 & B.charCodeAt(P)));
            return M.join("");
          };
          if (A.open("GET", c, !d), A.overrideMimeType("text/plain; charset=x-user-defined"), d === !1 && (A.onload = function() {
            A.status === 200 ? m(p(this.responseText)) : m(void 0);
          }), A.send(null), d && A.status === 200) return p(A.responseText);
        })(o, s, f);
      } catch {
      }
      return u;
    })(t, e, i);
  }, n.allowFsRead = void 0, n.loadImageFile = n.loadFile;
})(Mt.API), (function(n) {
  function t() {
    return ($t.html2canvas ? Promise.resolve($t.html2canvas) : import("./html2canvas.esm-BWVIUcAF.js")).catch(function(u) {
      return Promise.reject(new Error("Could not load html2canvas: " + u));
    }).then(function(u) {
      return u.default ? u.default : u;
    });
  }
  function e() {
    return ($t.DOMPurify ? Promise.resolve($t.DOMPurify) : import("./purify.es-B0KlbA1O.js")).catch(function(u) {
      return Promise.reject(new Error("Could not load dompurify: " + u));
    }).then(function(u) {
      return u.default ? u.default : u;
    });
  }
  var i = function(u) {
    var c = xe(u);
    return c === "undefined" ? "undefined" : c === "string" || u instanceof String ? "string" : c === "number" || u instanceof Number ? "number" : c === "function" || u instanceof Function ? "function" : u && u.constructor === Array ? "array" : u && u.nodeType === 1 ? "element" : c === "object" ? "object" : "unknown";
  }, o = function(u, c) {
    var d = document.createElement(u);
    for (var m in c.className && (d.className = c.className), c.innerHTML && c.dompurify && (d.innerHTML = c.dompurify.sanitize(c.innerHTML)), c.style) d.style[m] = c.style[m];
    return d;
  }, s = function u(c, d) {
    for (var m = c.nodeType === 3 ? document.createTextNode(c.nodeValue) : c.cloneNode(!1), A = c.firstChild; A; A = A.nextSibling) d !== !0 && A.nodeType === 1 && A.nodeName === "SCRIPT" || m.appendChild(u(A, d));
    return c.nodeType === 1 && (c.nodeName === "CANVAS" ? (m.width = c.width, m.height = c.height, m.getContext("2d").drawImage(c, 0, 0)) : c.nodeName !== "TEXTAREA" && c.nodeName !== "SELECT" || (m.value = c.value), m.addEventListener("load", function() {
      m.scrollTop = c.scrollTop, m.scrollLeft = c.scrollLeft;
    }, !0)), m;
  }, f = function u(c) {
    var d = Object.assign(u.convert(Promise.resolve()), JSON.parse(JSON.stringify(u.template))), m = u.convert(Promise.resolve(), d);
    return (m = m.setProgress(1, u, 1, [u])).set(c);
  };
  (f.prototype = Object.create(Promise.prototype)).constructor = f, f.convert = function(u, c) {
    return u.__proto__ = c || f.prototype, u;
  }, f.template = { prop: { src: null, container: null, overlay: null, canvas: null, img: null, pdf: null, pageSize: null, callback: function() {
  } }, progress: { val: 0, state: null, n: 0, stack: [] }, opt: { filename: "file.pdf", margin: [0, 0, 0, 0], enableLinks: !0, x: 0, y: 0, html2canvas: {}, jsPDF: {}, backgroundColor: "transparent" } }, f.prototype.from = function(u, c) {
    return this.then(function() {
      switch (c = c || (function(d) {
        switch (i(d)) {
          case "string":
            return "string";
          case "element":
            return d.nodeName.toLowerCase() === "canvas" ? "canvas" : "element";
          default:
            return "unknown";
        }
      })(u), c) {
        case "string":
          return this.then(e).then(function(d) {
            return this.set({ src: o("div", { innerHTML: u, dompurify: d }) });
          });
        case "element":
          return this.set({ src: u });
        case "canvas":
          return this.set({ canvas: u });
        case "img":
          return this.set({ img: u });
        default:
          return this.error("Unknown source type.");
      }
    });
  }, f.prototype.to = function(u) {
    switch (u) {
      case "container":
        return this.toContainer();
      case "canvas":
        return this.toCanvas();
      case "img":
        return this.toImg();
      case "pdf":
        return this.toPdf();
      default:
        return this.error("Invalid target.");
    }
  }, f.prototype.toContainer = function() {
    return this.thenList([function() {
      return this.prop.src || this.error("Cannot duplicate - no source HTML.");
    }, function() {
      return this.prop.pageSize || this.setPageSize();
    }]).then(function() {
      var u = { position: "relative", display: "inline-block", width: (typeof this.opt.width != "number" || isNaN(this.opt.width) || typeof this.opt.windowWidth != "number" || isNaN(this.opt.windowWidth) ? Math.max(this.prop.src.clientWidth, this.prop.src.scrollWidth, this.prop.src.offsetWidth) : this.opt.windowWidth) + "px", left: 0, right: 0, top: 0, margin: "auto", backgroundColor: this.opt.backgroundColor }, c = s(this.prop.src, this.opt.html2canvas.javascriptEnabled);
      c.tagName === "BODY" && (u.height = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight) + "px"), this.prop.overlay = o("div", { className: "html2pdf__overlay", style: { position: "fixed", overflow: "hidden", zIndex: 1e3, left: "-100000px", right: 0, bottom: 0, top: 0 } }), this.prop.container = o("div", { className: "html2pdf__container", style: u }), this.prop.container.appendChild(c), this.prop.container.firstChild.appendChild(o("div", { style: { clear: "both", border: "0 none transparent", margin: 0, padding: 0, height: 0 } })), this.prop.container.style.float = "none", this.prop.overlay.appendChild(this.prop.container), document.body.appendChild(this.prop.overlay), this.prop.container.firstChild.style.position = "relative", this.prop.container.height = Math.max(this.prop.container.firstChild.clientHeight, this.prop.container.firstChild.scrollHeight, this.prop.container.firstChild.offsetHeight) + "px";
    });
  }, f.prototype.toCanvas = function() {
    var u = [function() {
      return document.body.contains(this.prop.container) || this.toContainer();
    }];
    return this.thenList(u).then(t).then(function(c) {
      var d = Object.assign({}, this.opt.html2canvas);
      return delete d.onrendered, c(this.prop.container, d);
    }).then(function(c) {
      (this.opt.html2canvas.onrendered || function() {
      })(c), this.prop.canvas = c, document.body.removeChild(this.prop.overlay);
    });
  }, f.prototype.toContext2d = function() {
    var u = [function() {
      return document.body.contains(this.prop.container) || this.toContainer();
    }];
    return this.thenList(u).then(t).then(function(c) {
      var d = this.opt.jsPDF, m = this.opt.fontFaces, A = typeof this.opt.width != "number" || isNaN(this.opt.width) || typeof this.opt.windowWidth != "number" || isNaN(this.opt.windowWidth) ? 1 : this.opt.width / this.opt.windowWidth, P = Object.assign({ async: !0, allowTaint: !0, scale: A, scrollX: this.opt.scrollX || 0, scrollY: this.opt.scrollY || 0, backgroundColor: "#ffffff", imageTimeout: 15e3, logging: !0, proxy: null, removeContainer: !0, foreignObjectRendering: !1, useCORS: !1 }, this.opt.html2canvas);
      if (delete P.onrendered, d.context2d.autoPaging = this.opt.autoPaging === void 0 || this.opt.autoPaging, d.context2d.posX = this.opt.x, d.context2d.posY = this.opt.y, d.context2d.margin = this.opt.margin, d.context2d.fontFaces = m, m) for (var p = 0; p < m.length; ++p) {
        var B = m[p], O = B.src.find(function(M) {
          return M.format === "truetype";
        });
        O && d.addFont(O.url, B.ref.name, B.ref.style);
      }
      return P.windowHeight = P.windowHeight || 0, P.windowHeight = P.windowHeight == 0 ? Math.max(this.prop.container.clientHeight, this.prop.container.scrollHeight, this.prop.container.offsetHeight) : P.windowHeight, d.context2d.save(!0), c(this.prop.container, P);
    }).then(function(c) {
      this.opt.jsPDF.context2d.restore(!0), (this.opt.html2canvas.onrendered || function() {
      })(c), this.prop.canvas = c, document.body.removeChild(this.prop.overlay);
    });
  }, f.prototype.toImg = function() {
    return this.thenList([function() {
      return this.prop.canvas || this.toCanvas();
    }]).then(function() {
      var u = this.prop.canvas.toDataURL("image/" + this.opt.image.type, this.opt.image.quality);
      this.prop.img = document.createElement("img"), this.prop.img.src = u;
    });
  }, f.prototype.toPdf = function() {
    return this.thenList([function() {
      return this.toContext2d();
    }]).then(function() {
      this.prop.pdf = this.prop.pdf || this.opt.jsPDF;
    });
  }, f.prototype.output = function(u, c, d) {
    return (d = d || "pdf").toLowerCase() === "img" || d.toLowerCase() === "image" ? this.outputImg(u, c) : this.outputPdf(u, c);
  }, f.prototype.outputPdf = function(u, c) {
    return this.thenList([function() {
      return this.prop.pdf || this.toPdf();
    }]).then(function() {
      return this.prop.pdf.output(u, c);
    });
  }, f.prototype.outputImg = function(u) {
    return this.thenList([function() {
      return this.prop.img || this.toImg();
    }]).then(function() {
      switch (u) {
        case void 0:
        case "img":
          return this.prop.img;
        case "datauristring":
        case "dataurlstring":
          return this.prop.img.src;
        case "datauri":
        case "dataurl":
          return document.location.href = this.prop.img.src;
        default:
          throw 'Image output type "' + u + '" is not supported.';
      }
    });
  }, f.prototype.save = function(u) {
    return this.thenList([function() {
      return this.prop.pdf || this.toPdf();
    }]).set(u ? { filename: u } : null).then(function() {
      this.prop.pdf.save(this.opt.filename);
    });
  }, f.prototype.doCallback = function() {
    return this.thenList([function() {
      return this.prop.pdf || this.toPdf();
    }]).then(function() {
      this.prop.callback(this.prop.pdf);
    });
  }, f.prototype.set = function(u) {
    if (i(u) !== "object") return this;
    var c = Object.keys(u || {}).map(function(d) {
      if (d in f.template.prop) return function() {
        this.prop[d] = u[d];
      };
      switch (d) {
        case "margin":
          return this.setMargin.bind(this, u.margin);
        case "jsPDF":
          return function() {
            return this.opt.jsPDF = u.jsPDF, this.setPageSize();
          };
        case "pageSize":
          return this.setPageSize.bind(this, u.pageSize);
        default:
          return function() {
            this.opt[d] = u[d];
          };
      }
    }, this);
    return this.then(function() {
      return this.thenList(c);
    });
  }, f.prototype.get = function(u, c) {
    return this.then(function() {
      var d = u in f.template.prop ? this.prop[u] : this.opt[u];
      return c ? c(d) : d;
    });
  }, f.prototype.setMargin = function(u) {
    return this.then(function() {
      switch (i(u)) {
        case "number":
          u = [u, u, u, u];
        case "array":
          if (u.length === 2 && (u = [u[0], u[1], u[0], u[1]]), u.length === 4) break;
        default:
          return this.error("Invalid margin array.");
      }
      this.opt.margin = u;
    }).then(this.setPageSize);
  }, f.prototype.setPageSize = function(u) {
    function c(d, m) {
      return Math.floor(d * m / 72 * 96);
    }
    return this.then(function() {
      (u = u || Mt.getPageSize(this.opt.jsPDF)).hasOwnProperty("inner") || (u.inner = { width: u.width - this.opt.margin[1] - this.opt.margin[3], height: u.height - this.opt.margin[0] - this.opt.margin[2] }, u.inner.px = { width: c(u.inner.width, u.k), height: c(u.inner.height, u.k) }, u.inner.ratio = u.inner.height / u.inner.width), this.prop.pageSize = u;
    });
  }, f.prototype.setProgress = function(u, c, d, m) {
    return u != null && (this.progress.val = u), c != null && (this.progress.state = c), d != null && (this.progress.n = d), m != null && (this.progress.stack = m), this.progress.ratio = this.progress.val / this.progress.state, this;
  }, f.prototype.updateProgress = function(u, c, d, m) {
    return this.setProgress(u ? this.progress.val + u : null, c || null, d ? this.progress.n + d : null, m ? this.progress.stack.concat(m) : null);
  }, f.prototype.then = function(u, c) {
    var d = this;
    return this.thenCore(u, c, function(m, A) {
      return d.updateProgress(null, null, 1, [m]), Promise.prototype.then.call(this, function(P) {
        return d.updateProgress(null, m), P;
      }).then(m, A).then(function(P) {
        return d.updateProgress(1), P;
      });
    });
  }, f.prototype.thenCore = function(u, c, d) {
    d = d || Promise.prototype.then;
    var m = this;
    u && (u = u.bind(m)), c && (c = c.bind(m));
    var A = Promise.toString().indexOf("[native code]") !== -1 && Promise.name === "Promise" ? m : f.convert(Object.assign({}, m), Promise.prototype), P = d.call(A, u, c);
    return f.convert(P, m.__proto__);
  }, f.prototype.thenExternal = function(u, c) {
    return Promise.prototype.then.call(this, u, c);
  }, f.prototype.thenList = function(u) {
    var c = this;
    return u.forEach(function(d) {
      c = c.thenCore(d);
    }), c;
  }, f.prototype.catch = function(u) {
    u && (u = u.bind(this));
    var c = Promise.prototype.catch.call(this, u);
    return f.convert(c, this);
  }, f.prototype.catchExternal = function(u) {
    return Promise.prototype.catch.call(this, u);
  }, f.prototype.error = function(u) {
    return this.then(function() {
      throw new Error(u);
    });
  }, f.prototype.using = f.prototype.set, f.prototype.saveAs = f.prototype.save, f.prototype.export = f.prototype.output, f.prototype.run = f.prototype.then, Mt.getPageSize = function(u, c, d) {
    if (xe(u) === "object") {
      var m = u;
      u = m.orientation, c = m.unit || c, d = m.format || d;
    }
    c = c || "mm", d = d || "a4", u = ("" + (u || "P")).toLowerCase();
    var A, P = ("" + d).toLowerCase(), p = { a0: [2383.94, 3370.39], a1: [1683.78, 2383.94], a2: [1190.55, 1683.78], a3: [841.89, 1190.55], a4: [595.28, 841.89], a5: [419.53, 595.28], a6: [297.64, 419.53], a7: [209.76, 297.64], a8: [147.4, 209.76], a9: [104.88, 147.4], a10: [73.7, 104.88], b0: [2834.65, 4008.19], b1: [2004.09, 2834.65], b2: [1417.32, 2004.09], b3: [1000.63, 1417.32], b4: [708.66, 1000.63], b5: [498.9, 708.66], b6: [354.33, 498.9], b7: [249.45, 354.33], b8: [175.75, 249.45], b9: [124.72, 175.75], b10: [87.87, 124.72], c0: [2599.37, 3676.54], c1: [1836.85, 2599.37], c2: [1298.27, 1836.85], c3: [918.43, 1298.27], c4: [649.13, 918.43], c5: [459.21, 649.13], c6: [323.15, 459.21], c7: [229.61, 323.15], c8: [161.57, 229.61], c9: [113.39, 161.57], c10: [79.37, 113.39], dl: [311.81, 623.62], letter: [612, 792], "government-letter": [576, 756], legal: [612, 1008], "junior-legal": [576, 360], ledger: [1224, 792], tabloid: [792, 1224], "credit-card": [153, 243] };
    switch (c) {
      case "pt":
        A = 1;
        break;
      case "mm":
        A = 72 / 25.4;
        break;
      case "cm":
        A = 72 / 2.54;
        break;
      case "in":
        A = 72;
        break;
      case "px":
        A = 0.75;
        break;
      case "pc":
      case "em":
        A = 12;
        break;
      case "ex":
        A = 6;
        break;
      default:
        throw "Invalid unit: " + c;
    }
    var B, O = 0, M = 0;
    if (p.hasOwnProperty(P)) O = p[P][1] / A, M = p[P][0] / A;
    else try {
      O = d[1], M = d[0];
    } catch {
      throw new Error("Invalid format: " + d);
    }
    if (u === "p" || u === "portrait") u = "p", M > O && (B = M, M = O, O = B);
    else {
      if (u !== "l" && u !== "landscape") throw "Invalid orientation: " + u;
      u = "l", O > M && (B = M, M = O, O = B);
    }
    return { width: M, height: O, unit: c, k: A, orientation: u };
  }, n.html = function(u, c) {
    (c = c || {}).callback = c.callback || function() {
    }, c.html2canvas = c.html2canvas || {}, c.html2canvas.canvas = c.html2canvas.canvas || this.canvas, c.jsPDF = c.jsPDF || this, c.fontFaces = c.fontFaces ? c.fontFaces.map(_o) : null;
    var d = new f(c);
    return c.worker ? d : d.from(u).doCallback();
  };
})(Mt.API), Mt.API.addJS = function(n) {
  var t, e, i = (function(o) {
    for (var s = "", f = 0; f < o.length; f++) {
      var u = o[f];
      if (u === "(" || u === ")") {
        for (var c = 0, d = f - 1; d >= 0 && o[d] === "\\"; d--) c++;
        s += c % 2 == 0 ? "\\" + u : u;
      } else s += u;
    }
    return s;
  })(n);
  return this.internal.events.subscribe("postPutResources", function() {
    t = this.internal.newObject(), this.internal.out("<<"), this.internal.out("/Names [(EmbeddedJS) " + (t + 1) + " 0 R]"), this.internal.out(">>"), this.internal.out("endobj"), e = this.internal.newObject(), this.internal.out("<<"), this.internal.out("/S /JavaScript"), this.internal.out("/JS (" + i + ")"), this.internal.out(">>"), this.internal.out("endobj");
  }), this.internal.events.subscribe("putCatalog", function() {
    t !== void 0 && e !== void 0 && this.internal.out("/Names <</JavaScript " + t + " 0 R>>");
  }), this;
}, /**
 * @license
 * Copyright (c) 2014 Steven Spungin (TwelveTone LLC)  steven@twelvetone.tv
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t;
  n.events.push(["postPutResources", function() {
    var e = this, i = /^(\d+) 0 obj$/;
    if (this.outline.root.children.length > 0) for (var o = e.outline.render().split(/\r\n/), s = 0; s < o.length; s++) {
      var f = o[s], u = i.exec(f);
      if (u != null) {
        var c = u[1];
        e.internal.newObjectDeferredBegin(c, !1);
      }
      e.internal.write(f);
    }
    if (this.outline.createNamedDestinations) {
      var d = this.internal.pages.length, m = [];
      for (s = 0; s < d; s++) {
        var A = e.internal.newObject();
        m.push(A);
        var P = e.internal.getPageInfo(s + 1);
        e.internal.write("<< /D[" + P.objId + " 0 R /XYZ null null null]>> endobj");
      }
      var p = e.internal.newObject();
      for (e.internal.write("<< /Names [ "), s = 0; s < m.length; s++) e.internal.write("(page_" + (s + 1) + ")" + m[s] + " 0 R");
      e.internal.write(" ] >>", "endobj"), t = e.internal.newObject(), e.internal.write("<< /Dests " + p + " 0 R"), e.internal.write(">>", "endobj");
    }
  }]), n.events.push(["putCatalog", function() {
    var e = this;
    e.outline.root.children.length > 0 && (e.internal.write("/Outlines", this.outline.makeRef(this.outline.root)), this.outline.createNamedDestinations && e.internal.write("/Names " + t + " 0 R"));
  }]), n.events.push(["initialized", function() {
    var e = this;
    e.outline = { createNamedDestinations: !1, root: { children: [] } }, e.outline.add = function(i, o, s) {
      var f = { title: o, options: s, children: [] };
      return i == null && (i = this.root), i.children.push(f), f;
    }, e.outline.render = function() {
      return this.ctx = {}, this.ctx.val = "", this.ctx.pdf = e, this.genIds_r(this.root), this.renderRoot(this.root), this.renderItems(this.root), this.ctx.val;
    }, e.outline.genIds_r = function(i) {
      i.id = e.internal.newObjectDeferred();
      for (var o = 0; o < i.children.length; o++) this.genIds_r(i.children[o]);
    }, e.outline.renderRoot = function(i) {
      this.objStart(i), this.line("/Type /Outlines"), i.children.length > 0 && (this.line("/First " + this.makeRef(i.children[0])), this.line("/Last " + this.makeRef(i.children[i.children.length - 1]))), this.line("/Count " + this.count_r({ count: 0 }, i)), this.objEnd();
    }, e.outline.renderItems = function(i) {
      for (var o = this.ctx.pdf.internal.getVerticalCoordinateString, s = 0; s < i.children.length; s++) {
        var f = i.children[s];
        this.objStart(f), this.line("/Title " + this.makeString(f.title)), this.line("/Parent " + this.makeRef(i)), s > 0 && this.line("/Prev " + this.makeRef(i.children[s - 1])), s < i.children.length - 1 && this.line("/Next " + this.makeRef(i.children[s + 1])), f.children.length > 0 && (this.line("/First " + this.makeRef(f.children[0])), this.line("/Last " + this.makeRef(f.children[f.children.length - 1])));
        var u = this.count = this.count_r({ count: 0 }, f);
        if (u > 0 && this.line("/Count " + u), f.options && f.options.pageNumber) {
          var c = e.internal.getPageInfo(f.options.pageNumber);
          this.line("/Dest [" + c.objId + " 0 R /XYZ 0 " + o(0) + " 0]");
        }
        this.objEnd();
      }
      for (var d = 0; d < i.children.length; d++) this.renderItems(i.children[d]);
    }, e.outline.line = function(i) {
      this.ctx.val += i + `\r
`;
    }, e.outline.makeRef = function(i) {
      return i.id + " 0 R";
    }, e.outline.makeString = function(i) {
      return "(" + e.internal.pdfEscape(i) + ")";
    }, e.outline.objStart = function(i) {
      this.ctx.val += `\r
` + i.id + ` 0 obj\r
<<\r
`;
    }, e.outline.objEnd = function() {
      this.ctx.val += `>> \r
endobj\r
`;
    }, e.outline.count_r = function(i, o) {
      for (var s = 0; s < o.children.length; s++) i.count++, this.count_r(i, o.children[s]);
      return i.count;
    };
  }]);
})(Mt.API), /**
 * @license
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = [192, 193, 194, 195, 196, 197, 198, 199];
  n.processJPEG = function(e, i, o, s, f, u) {
    var c, d = this.decode.DCT_DECODE, m = null;
    if (typeof e == "string" || this.__addimage__.isArrayBuffer(e) || this.__addimage__.isArrayBufferView(e)) {
      switch (e = f || e, e = this.__addimage__.isArrayBuffer(e) ? new Uint8Array(e) : e, c = (function(A) {
        for (var P, p = 256 * A.charCodeAt(4) + A.charCodeAt(5), B = A.length, O = { width: 0, height: 0, numcomponents: 1 }, M = 4; M < B; M += 2) {
          if (M += p, t.indexOf(A.charCodeAt(M + 1)) !== -1) {
            P = 256 * A.charCodeAt(M + 5) + A.charCodeAt(M + 6), O = { width: 256 * A.charCodeAt(M + 7) + A.charCodeAt(M + 8), height: P, numcomponents: A.charCodeAt(M + 9) };
            break;
          }
          p = 256 * A.charCodeAt(M + 2) + A.charCodeAt(M + 3);
        }
        return O;
      })(e = this.__addimage__.isArrayBufferView(e) ? this.__addimage__.arrayBufferToBinaryString(e) : e), c.numcomponents) {
        case 1:
          u = this.color_spaces.DEVICE_GRAY;
          break;
        case 4:
          u = this.color_spaces.DEVICE_CMYK;
          break;
        case 3:
          u = this.color_spaces.DEVICE_RGB;
      }
      m = { data: e, width: c.width, height: c.height, colorSpace: u, bitsPerComponent: 8, filter: d, index: i, alias: o };
    }
    return m;
  };
})(Mt.API), Mt.API.processPNG = function(n, t, e, i) {
  if (this.__addimage__.isArrayBuffer(n) && (n = new Uint8Array(n)), this.__addimage__.isArrayBufferView(n)) {
    var o, s = Uf(n, { checkCrc: !0 }), f = s.width, u = s.height, c = s.channels, d = s.palette, m = s.depth;
    o = d && c === 1 ? (function(tt) {
      for (var z = tt.width, et = tt.height, N = tt.data, E = tt.palette, q = tt.depth, U = !1, rt = [], ct = [], pt = void 0, nt = !1, ft = 0, At = 0; At < E.length; At++) {
        var xt = vl(E[At], 4), x = xt[0], j = xt[1], R = xt[2], V = xt[3];
        rt.push(x, j, R), V != null && (V === 0 ? (ft++, ct.length < 1 && ct.push(At)) : V < 255 && (nt = !0));
      }
      if (nt || ft > 1) {
        U = !0, ct = void 0;
        var $ = z * et;
        pt = new Uint8Array($);
        for (var Q = new DataView(N.buffer), it = 0; it < $; it++) {
          var at = No(Q, it, q), dt = vl(E[at], 4)[3];
          pt[it] = dt;
        }
      } else ft === 0 && (ct = void 0);
      return { colorSpace: "Indexed", colorsPerPixel: 1, sMaskBitsPerComponent: U ? 8 : void 0, colorBytes: N, alphaBytes: pt, needSMask: U, palette: rt, mask: ct };
    })(s) : c === 2 || c === 4 ? (function(tt) {
      for (var z = tt.data, et = tt.width, N = tt.height, E = tt.channels, q = tt.depth, U = E === 2 ? "DeviceGray" : "DeviceRGB", rt = E - 1, ct = et * N, pt = rt, nt = ct * pt, ft = 1 * ct, At = Math.ceil(nt * q / 8), xt = Math.ceil(ft * q / 8), x = new Uint8Array(At), j = new Uint8Array(xt), R = new DataView(z.buffer), V = new DataView(x.buffer), $ = new DataView(j.buffer), Q = !1, it = 0; it < ct; it++) {
        for (var at = it * E, dt = 0; dt < pt; dt++) xu(V, No(R, at + dt, q), it * pt + dt, q);
        var _t = No(R, at + pt, q);
        _t < (1 << q) - 1 && (Q = !0), xu($, _t, 1 * it, q);
      }
      return { colorSpace: U, colorsPerPixel: rt, sMaskBitsPerComponent: Q ? q : void 0, colorBytes: x, alphaBytes: j, needSMask: Q };
    })(s) : (function(tt) {
      var z = tt.data, et = tt.channels === 1 ? "DeviceGray" : "DeviceRGB";
      return { colorSpace: et, colorsPerPixel: et === "DeviceGray" ? 1 : 3, colorBytes: z instanceof Uint16Array ? (function(N) {
        for (var E = N.length, q = new Uint8Array(2 * E), U = new DataView(q.buffer, q.byteOffset, q.byteLength), rt = 0; rt < E; rt++) U.setUint16(2 * rt, N[rt], !1);
        return q;
      })(z) : z, needSMask: !1 };
    })(s);
    var A, P, p, B = o, O = B.colorSpace, M = B.colorsPerPixel, S = B.sMaskBitsPerComponent, Y = B.colorBytes, J = B.alphaBytes, D = B.needSMask, lt = B.palette, yt = B.mask, mt = null;
    return i !== Mt.API.image_compression.NONE && typeof So == "function" ? (mt = (function(tt) {
      var z;
      switch (tt) {
        case Mt.API.image_compression.FAST:
          z = 11;
          break;
        case Mt.API.image_compression.MEDIUM:
          z = 13;
          break;
        case Mt.API.image_compression.SLOW:
          z = 14;
          break;
        default:
          z = 12;
      }
      return z;
    })(i), A = this.decode.FLATE_DECODE, P = "/Predictor ".concat(mt, " /Colors ").concat(M, " /BitsPerComponent ").concat(m, " /Columns ").concat(f), n = mu(Y, Math.ceil(f * M * m / 8), M, m, i), D && (p = mu(J, Math.ceil(f * S / 8), 1, S, i))) : (A = void 0, P = void 0, n = Y, D && (p = J)), (this.__addimage__.isArrayBuffer(n) || this.__addimage__.isArrayBufferView(n)) && (n = this.__addimage__.arrayBufferToBinaryString(n)), (p && this.__addimage__.isArrayBuffer(p) || this.__addimage__.isArrayBufferView(p)) && (p = this.__addimage__.arrayBufferToBinaryString(p)), { alias: e, data: n, index: t, filter: A, decodeParameters: P, transparency: yt, palette: lt, sMask: p, predictor: mt, width: f, height: u, bitsPerComponent: m, sMaskBitsPerComponent: S, colorSpace: O };
  }
}, (function(n) {
  n.processGIF89A = function(t, e, i, o) {
    var s = new u1(t), f = s.width, u = s.height, c = [];
    s.decodeAndBlitFrameRGBA(0, c);
    var d = { data: c, width: f, height: u }, m = new Lo(100).encode(d, 100);
    return n.processJPEG.call(this, m, e, i, o);
  }, n.processGIF87A = n.processGIF89A;
})(Mt.API), Kn.prototype.parseHeader = function() {
  if (this.fileSize = this.datav.getUint32(this.pos, !0), this.pos += 4, this.reserved = this.datav.getUint32(this.pos, !0), this.pos += 4, this.offset = this.datav.getUint32(this.pos, !0), this.pos += 4, this.headerSize = this.datav.getUint32(this.pos, !0), this.pos += 4, this.width = this.datav.getUint32(this.pos, !0), this.pos += 4, this.height = this.datav.getInt32(this.pos, !0), this.pos += 4, this.planes = this.datav.getUint16(this.pos, !0), this.pos += 2, this.bitPP = this.datav.getUint16(this.pos, !0), this.pos += 2, this.compress = this.datav.getUint32(this.pos, !0), this.pos += 4, this.rawSize = this.datav.getUint32(this.pos, !0), this.pos += 4, this.hr = this.datav.getUint32(this.pos, !0), this.pos += 4, this.vr = this.datav.getUint32(this.pos, !0), this.pos += 4, this.colors = this.datav.getUint32(this.pos, !0), this.pos += 4, this.importantColors = this.datav.getUint32(this.pos, !0), this.pos += 4, this.bitPP === 16 && this.is_with_alpha && (this.bitPP = 15), this.bitPP < 15) {
    var n = this.colors === 0 ? 1 << this.bitPP : this.colors;
    this.palette = new Array(n);
    for (var t = 0; t < n; t++) {
      var e = this.datav.getUint8(this.pos++, !0), i = this.datav.getUint8(this.pos++, !0), o = this.datav.getUint8(this.pos++, !0), s = this.datav.getUint8(this.pos++, !0);
      this.palette[t] = { red: o, green: i, blue: e, quad: s };
    }
  }
  this.height < 0 && (this.height *= -1, this.bottom_up = !1);
}, Kn.prototype.parseBGR = function() {
  this.pos = this.offset;
  var n = "bit" + this.bitPP, t = this.width * this.height * 4;
  if (t > 536870912) throw new Error("Image dimensions exceed 512MB, which is too large.");
  this.data = new Uint8Array(t);
  try {
    this[n]();
  } catch (e) {
    Le.log("bit decode error:" + e);
  }
}, Kn.prototype.bit1 = function() {
  var n, t = Math.ceil(this.width / 8), e = t % 4;
  for (n = this.height - 1; n >= 0; n--) {
    for (var i = this.bottom_up ? n : this.height - 1 - n, o = 0; o < t; o++) for (var s = this.datav.getUint8(this.pos++, !0), f = i * this.width * 4 + 8 * o * 4, u = 0; u < 8 && 8 * o + u < this.width; u++) {
      var c = this.palette[s >> 7 - u & 1];
      this.data[f + 4 * u] = c.blue, this.data[f + 4 * u + 1] = c.green, this.data[f + 4 * u + 2] = c.red, this.data[f + 4 * u + 3] = 255;
    }
    e !== 0 && (this.pos += 4 - e);
  }
}, Kn.prototype.bit4 = function() {
  for (var n = Math.ceil(this.width / 2), t = n % 4, e = this.height - 1; e >= 0; e--) {
    for (var i = this.bottom_up ? e : this.height - 1 - e, o = 0; o < n; o++) {
      var s = this.datav.getUint8(this.pos++, !0), f = i * this.width * 4 + 2 * o * 4, u = s >> 4, c = 15 & s, d = this.palette[u];
      if (this.data[f] = d.blue, this.data[f + 1] = d.green, this.data[f + 2] = d.red, this.data[f + 3] = 255, 2 * o + 1 >= this.width) break;
      d = this.palette[c], this.data[f + 4] = d.blue, this.data[f + 4 + 1] = d.green, this.data[f + 4 + 2] = d.red, this.data[f + 4 + 3] = 255;
    }
    t !== 0 && (this.pos += 4 - t);
  }
}, Kn.prototype.bit8 = function() {
  for (var n = this.width % 4, t = this.height - 1; t >= 0; t--) {
    for (var e = this.bottom_up ? t : this.height - 1 - t, i = 0; i < this.width; i++) {
      var o = this.datav.getUint8(this.pos++, !0), s = e * this.width * 4 + 4 * i;
      if (o < this.palette.length) {
        var f = this.palette[o];
        this.data[s] = f.red, this.data[s + 1] = f.green, this.data[s + 2] = f.blue, this.data[s + 3] = 255;
      } else this.data[s] = 255, this.data[s + 1] = 255, this.data[s + 2] = 255, this.data[s + 3] = 255;
    }
    n !== 0 && (this.pos += 4 - n);
  }
}, Kn.prototype.bit15 = function() {
  for (var n = this.width % 3, t = parseInt("11111", 2), e = this.height - 1; e >= 0; e--) {
    for (var i = this.bottom_up ? e : this.height - 1 - e, o = 0; o < this.width; o++) {
      var s = this.datav.getUint16(this.pos, !0);
      this.pos += 2;
      var f = (s & t) / t * 255 | 0, u = (s >> 5 & t) / t * 255 | 0, c = (s >> 10 & t) / t * 255 | 0, d = s >> 15 ? 255 : 0, m = i * this.width * 4 + 4 * o;
      this.data[m] = c, this.data[m + 1] = u, this.data[m + 2] = f, this.data[m + 3] = d;
    }
    this.pos += n;
  }
}, Kn.prototype.bit16 = function() {
  for (var n = this.width % 3, t = parseInt("11111", 2), e = parseInt("111111", 2), i = this.height - 1; i >= 0; i--) {
    for (var o = this.bottom_up ? i : this.height - 1 - i, s = 0; s < this.width; s++) {
      var f = this.datav.getUint16(this.pos, !0);
      this.pos += 2;
      var u = (f & t) / t * 255 | 0, c = (f >> 5 & e) / e * 255 | 0, d = (f >> 11) / t * 255 | 0, m = o * this.width * 4 + 4 * s;
      this.data[m] = d, this.data[m + 1] = c, this.data[m + 2] = u, this.data[m + 3] = 255;
    }
    this.pos += n;
  }
}, Kn.prototype.bit24 = function() {
  for (var n = this.height - 1; n >= 0; n--) {
    for (var t = this.bottom_up ? n : this.height - 1 - n, e = 0; e < this.width; e++) {
      var i = this.datav.getUint8(this.pos++, !0), o = this.datav.getUint8(this.pos++, !0), s = this.datav.getUint8(this.pos++, !0), f = t * this.width * 4 + 4 * e;
      this.data[f] = s, this.data[f + 1] = o, this.data[f + 2] = i, this.data[f + 3] = 255;
    }
    this.pos += this.width % 4;
  }
}, Kn.prototype.bit32 = function() {
  for (var n = this.height - 1; n >= 0; n--) for (var t = this.bottom_up ? n : this.height - 1 - n, e = 0; e < this.width; e++) {
    var i = this.datav.getUint8(this.pos++, !0), o = this.datav.getUint8(this.pos++, !0), s = this.datav.getUint8(this.pos++, !0), f = this.datav.getUint8(this.pos++, !0), u = t * this.width * 4 + 4 * e;
    this.data[u] = s, this.data[u + 1] = o, this.data[u + 2] = i, this.data[u + 3] = f;
  }
}, Kn.prototype.getData = function() {
  return this.data;
}, /**
 * @license
 * Copyright (c) 2018 Aras Abbasi
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  n.processBMP = function(t, e, i, o) {
    var s = new Kn(t, !1), f = s.width, u = s.height, c = { data: s.getData(), width: f, height: u }, d = new Lo(100).encode(c, 100);
    return n.processJPEG.call(this, d, e, i, o);
  };
})(Mt.API), Au.prototype.getData = function() {
  return this.data;
}, /**
 * @license
 * Copyright (c) 2019 Aras Abbasi
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  n.processWEBP = function(t, e, i, o) {
    var s = new Au(t), f = s.width, u = s.height, c = { data: s.getData(), width: f, height: u }, d = new Lo(100).encode(c, 100);
    return n.processJPEG.call(this, d, e, i, o);
  };
})(Mt.API), Mt.API.processRGBA = function(n, t, e) {
  for (var i = n.data, o = i.length, s = new Uint8Array(o / 4 * 3), f = new Uint8Array(o / 4), u = 0, c = 0, d = 0; d < o; d += 4) {
    var m = i[d], A = i[d + 1], P = i[d + 2], p = i[d + 3];
    s[u++] = m, s[u++] = A, s[u++] = P, f[c++] = p;
  }
  var B = this.__addimage__.arrayBufferToBinaryString(s);
  return { alpha: this.__addimage__.arrayBufferToBinaryString(f), data: B, index: t, alias: e, colorSpace: "DeviceRGB", bitsPerComponent: 8, width: n.width, height: n.height };
}, Mt.API.setLanguage = function(n) {
  return this.internal.languageSettings === void 0 && (this.internal.languageSettings = {}, this.internal.languageSettings.isSubscribed = !1), { af: "Afrikaans", sq: "Albanian", ar: "Arabic (Standard)", "ar-DZ": "Arabic (Algeria)", "ar-BH": "Arabic (Bahrain)", "ar-EG": "Arabic (Egypt)", "ar-IQ": "Arabic (Iraq)", "ar-JO": "Arabic (Jordan)", "ar-KW": "Arabic (Kuwait)", "ar-LB": "Arabic (Lebanon)", "ar-LY": "Arabic (Libya)", "ar-MA": "Arabic (Morocco)", "ar-OM": "Arabic (Oman)", "ar-QA": "Arabic (Qatar)", "ar-SA": "Arabic (Saudi Arabia)", "ar-SY": "Arabic (Syria)", "ar-TN": "Arabic (Tunisia)", "ar-AE": "Arabic (U.A.E.)", "ar-YE": "Arabic (Yemen)", an: "Aragonese", hy: "Armenian", as: "Assamese", ast: "Asturian", az: "Azerbaijani", eu: "Basque", be: "Belarusian", bn: "Bengali", bs: "Bosnian", br: "Breton", bg: "Bulgarian", my: "Burmese", ca: "Catalan", ch: "Chamorro", ce: "Chechen", zh: "Chinese", "zh-HK": "Chinese (Hong Kong)", "zh-CN": "Chinese (PRC)", "zh-SG": "Chinese (Singapore)", "zh-TW": "Chinese (Taiwan)", cv: "Chuvash", co: "Corsican", cr: "Cree", hr: "Croatian", cs: "Czech", da: "Danish", nl: "Dutch (Standard)", "nl-BE": "Dutch (Belgian)", en: "English", "en-AU": "English (Australia)", "en-BZ": "English (Belize)", "en-CA": "English (Canada)", "en-IE": "English (Ireland)", "en-JM": "English (Jamaica)", "en-NZ": "English (New Zealand)", "en-PH": "English (Philippines)", "en-ZA": "English (South Africa)", "en-TT": "English (Trinidad & Tobago)", "en-GB": "English (United Kingdom)", "en-US": "English (United States)", "en-ZW": "English (Zimbabwe)", eo: "Esperanto", et: "Estonian", fo: "Faeroese", fj: "Fijian", fi: "Finnish", fr: "French (Standard)", "fr-BE": "French (Belgium)", "fr-CA": "French (Canada)", "fr-FR": "French (France)", "fr-LU": "French (Luxembourg)", "fr-MC": "French (Monaco)", "fr-CH": "French (Switzerland)", fy: "Frisian", fur: "Friulian", gd: "Gaelic (Scots)", "gd-IE": "Gaelic (Irish)", gl: "Galacian", ka: "Georgian", de: "German (Standard)", "de-AT": "German (Austria)", "de-DE": "German (Germany)", "de-LI": "German (Liechtenstein)", "de-LU": "German (Luxembourg)", "de-CH": "German (Switzerland)", el: "Greek", gu: "Gujurati", ht: "Haitian", he: "Hebrew", hi: "Hindi", hu: "Hungarian", is: "Icelandic", id: "Indonesian", iu: "Inuktitut", ga: "Irish", it: "Italian (Standard)", "it-CH": "Italian (Switzerland)", ja: "Japanese", kn: "Kannada", ks: "Kashmiri", kk: "Kazakh", km: "Khmer", ky: "Kirghiz", tlh: "Klingon", ko: "Korean", "ko-KP": "Korean (North Korea)", "ko-KR": "Korean (South Korea)", la: "Latin", lv: "Latvian", lt: "Lithuanian", lb: "Luxembourgish", mk: "North Macedonia", ms: "Malay", ml: "Malayalam", mt: "Maltese", mi: "Maori", mr: "Marathi", mo: "Moldavian", nv: "Navajo", ng: "Ndonga", ne: "Nepali", no: "Norwegian", nb: "Norwegian (Bokmal)", nn: "Norwegian (Nynorsk)", oc: "Occitan", or: "Oriya", om: "Oromo", fa: "Persian", "fa-IR": "Persian/Iran", pl: "Polish", pt: "Portuguese", "pt-BR": "Portuguese (Brazil)", pa: "Punjabi", "pa-IN": "Punjabi (India)", "pa-PK": "Punjabi (Pakistan)", qu: "Quechua", rm: "Rhaeto-Romanic", ro: "Romanian", "ro-MO": "Romanian (Moldavia)", ru: "Russian", "ru-MO": "Russian (Moldavia)", sz: "Sami (Lappish)", sg: "Sango", sa: "Sanskrit", sc: "Sardinian", sd: "Sindhi", si: "Singhalese", sr: "Serbian", sk: "Slovak", sl: "Slovenian", so: "Somani", sb: "Sorbian", es: "Spanish", "es-AR": "Spanish (Argentina)", "es-BO": "Spanish (Bolivia)", "es-CL": "Spanish (Chile)", "es-CO": "Spanish (Colombia)", "es-CR": "Spanish (Costa Rica)", "es-DO": "Spanish (Dominican Republic)", "es-EC": "Spanish (Ecuador)", "es-SV": "Spanish (El Salvador)", "es-GT": "Spanish (Guatemala)", "es-HN": "Spanish (Honduras)", "es-MX": "Spanish (Mexico)", "es-NI": "Spanish (Nicaragua)", "es-PA": "Spanish (Panama)", "es-PY": "Spanish (Paraguay)", "es-PE": "Spanish (Peru)", "es-PR": "Spanish (Puerto Rico)", "es-ES": "Spanish (Spain)", "es-UY": "Spanish (Uruguay)", "es-VE": "Spanish (Venezuela)", sx: "Sutu", sw: "Swahili", sv: "Swedish", "sv-FI": "Swedish (Finland)", "sv-SV": "Swedish (Sweden)", ta: "Tamil", tt: "Tatar", te: "Teluga", th: "Thai", tig: "Tigre", ts: "Tsonga", tn: "Tswana", tr: "Turkish", tk: "Turkmen", uk: "Ukrainian", hsb: "Upper Sorbian", ur: "Urdu", ve: "Venda", vi: "Vietnamese", vo: "Volapuk", wa: "Walloon", cy: "Welsh", xh: "Xhosa", ji: "Yiddish", zu: "Zulu" }[n] !== void 0 && (this.internal.languageSettings.languageCode = n, this.internal.languageSettings.isSubscribed === !1 && (this.internal.events.subscribe("putCatalog", function() {
    this.internal.write("/Lang (" + this.internal.languageSettings.languageCode + ")");
  }), this.internal.languageSettings.isSubscribed = !0)), this;
}, Ji = Mt.API, bs = Ji.getCharWidthsArray = function(n, t) {
  var e, i, o = (t = t || {}).font || this.internal.getFont(), s = t.fontSize || this.internal.getFontSize(), f = t.charSpace || this.internal.getCharSpace(), u = t.widths ? t.widths : o.metadata.Unicode.widths, c = u.fof ? u.fof : 1, d = t.kerning ? t.kerning : o.metadata.Unicode.kerning, m = d.fof ? d.fof : 1, A = t.doKerning !== !1, P = 0, p = n.length, B = 0, O = u[0] || c, M = [];
  for (e = 0; e < p; e++) i = n.charCodeAt(e), typeof o.metadata.widthOfString == "function" ? M.push((o.metadata.widthOfGlyph(o.metadata.characterToGlyph(i)) + f * (1e3 / s) || 0) / 1e3) : (P = A && xe(d[i]) === "object" && !isNaN(parseInt(d[i][B], 10)) ? d[i][B] / m : 0, M.push((u[i] || O) / c + P)), B = i;
  return M;
}, du = Ji.getStringUnitWidth = function(n, t) {
  var e = (t = t || {}).fontSize || this.internal.getFontSize(), i = t.font || this.internal.getFont(), o = t.charSpace || this.internal.getCharSpace();
  return Ji.processArabic && (n = Ji.processArabic(n)), typeof i.metadata.widthOfString == "function" ? i.metadata.widthOfString(n, e, o) / e : bs.apply(this, arguments).reduce(function(s, f) {
    return s + f;
  }, 0);
}, pu = function(n, t, e, i) {
  for (var o = [], s = 0, f = n.length, u = 0; s !== f && u + t[s] < e; ) u += t[s], s++;
  o.push(n.slice(0, s));
  var c = s;
  for (u = 0; s !== f; ) u + t[s] > i && (o.push(n.slice(c, s)), u = 0, c = s), u += t[s], s++;
  return c !== s && o.push(n.slice(c, s)), o;
}, gu = function(n, t, e) {
  e || (e = {});
  var i, o, s, f, u, c, d, m = [], A = [m], P = e.textIndent || 0, p = 0, B = 0, O = n.split(" "), M = bs.apply(this, [" ", e])[0];
  if (c = e.lineIndent === -1 ? O[0].length + 2 : e.lineIndent || 0) {
    var S = Array(c).join(" "), Y = [];
    O.map(function(D) {
      (D = D.split(/\s*\n/)).length > 1 ? Y = Y.concat(D.map(function(lt, yt) {
        return (yt && lt.length ? `
` : "") + lt;
      })) : Y.push(D[0]);
    }), O = Y, c = du.apply(this, [S, e]);
  }
  for (s = 0, f = O.length; s < f; s++) {
    var J = 0;
    if (i = O[s], c && i[0] == `
` && (i = i.substr(1), J = 1), P + p + (B = (o = bs.apply(this, [i, e])).reduce(function(D, lt) {
      return D + lt;
    }, 0)) > t || J) {
      if (B > t) {
        for (u = pu.apply(this, [i, o, t - (P + p), t]), m.push(u.shift()), m = [u.pop()]; u.length; ) A.push([u.shift()]);
        B = o.slice(i.length - (m[0] ? m[0].length : 0)).reduce(function(D, lt) {
          return D + lt;
        }, 0);
      } else m = [i];
      A.push(m), P = B + c, p = M;
    } else m.push(i), P += p + B, p = M;
  }
  return d = c ? function(D, lt) {
    return (lt ? S : "") + D.join(" ");
  } : function(D) {
    return D.join(" ");
  }, A.map(d);
}, Ji.splitTextToSize = function(n, t, e) {
  var i, o = (e = e || {}).fontSize || this.internal.getFontSize(), s = (function(m) {
    if (m.widths && m.kerning) return { widths: m.widths, kerning: m.kerning };
    var A = this.internal.getFont(m.fontName, m.fontStyle), P = "Unicode";
    return A.metadata[P] ? { widths: A.metadata[P].widths || { 0: 1 }, kerning: A.metadata[P].kerning || {} } : { font: A.metadata, fontSize: this.internal.getFontSize(), charSpace: this.internal.getCharSpace() };
  }).call(this, e);
  i = Array.isArray(n) ? n : String(n).split(/\r?\n/);
  var f = 1 * this.internal.scaleFactor * t / o;
  s.textIndent = e.textIndent ? 1 * e.textIndent * this.internal.scaleFactor / o : 0, s.lineIndent = e.lineIndent;
  var u, c, d = [];
  for (u = 0, c = i.length; u < c; u++) d = d.concat(gu.apply(this, [i[u], f, s]));
  return d;
}, (function(n) {
  n.__fontmetrics__ = n.__fontmetrics__ || {};
  for (var t = "0123456789abcdef", e = "klmnopqrstuvwxyz", i = {}, o = {}, s = 0; s < 16; s++) i[e[s]] = t[s], o[t[s]] = e[s];
  var f = function(P) {
    return "0x" + parseInt(P, 10).toString(16);
  }, u = n.__fontmetrics__.compress = function(P) {
    var p, B, O, M, S = ["{"];
    for (var Y in P) {
      if (p = P[Y], isNaN(parseInt(Y, 10)) ? B = "'" + Y + "'" : (Y = parseInt(Y, 10), B = (B = f(Y).slice(2)).slice(0, -1) + o[B.slice(-1)]), typeof p == "number") p < 0 ? (O = f(p).slice(3), M = "-") : (O = f(p).slice(2), M = ""), O = M + O.slice(0, -1) + o[O.slice(-1)];
      else {
        if (xe(p) !== "object") throw new Error("Don't know what to do with value type " + xe(p) + ".");
        O = u(p);
      }
      S.push(B + O);
    }
    return S.push("}"), S.join("");
  }, c = n.__fontmetrics__.uncompress = function(P) {
    if (typeof P != "string") throw new Error("Invalid argument passed to uncompress.");
    for (var p, B, O, M, S = {}, Y = 1, J = S, D = [], lt = "", yt = "", mt = P.length - 1, tt = 1; tt < mt; tt += 1) (M = P[tt]) == "'" ? p ? (O = p.join(""), p = void 0) : p = [] : p ? p.push(M) : M == "{" ? (D.push([J, O]), J = {}, O = void 0) : M == "}" ? ((B = D.pop())[0][B[1]] = J, O = void 0, J = B[0]) : M == "-" ? Y = -1 : O === void 0 ? i.hasOwnProperty(M) ? (lt += i[M], O = parseInt(lt, 16) * Y, Y = 1, lt = "") : lt += M : i.hasOwnProperty(M) ? (yt += i[M], J[O] = parseInt(yt, 16) * Y, Y = 1, O = void 0, yt = "") : yt += M;
    return S;
  }, d = { codePages: ["WinAnsiEncoding"], WinAnsiEncoding: c("{19m8n201n9q201o9r201s9l201t9m201u8m201w9n201x9o201y8o202k8q202l8r202m9p202q8p20aw8k203k8t203t8v203u9v2cq8s212m9t15m8w15n9w2dw9s16k8u16l9u17s9z17x8y17y9y}") }, m = { Unicode: { Courier: d, "Courier-Bold": d, "Courier-BoldOblique": d, "Courier-Oblique": d, Helvetica: d, "Helvetica-Bold": d, "Helvetica-BoldOblique": d, "Helvetica-Oblique": d, "Times-Roman": d, "Times-Bold": d, "Times-BoldItalic": d, "Times-Italic": d } }, A = { Unicode: { "Courier-Oblique": c("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"), "Times-BoldItalic": c("{'widths'{k3o2q4ycx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2r202m2n2n3m2o3m2p5n202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5n4l4m4m4m4n4m4o4s4p4m4q4m4r4s4s4y4t2r4u3m4v4m4w3x4x5t4y4s4z4s5k3x5l4s5m4m5n3r5o3x5p4s5q4m5r5t5s4m5t3x5u3x5v2l5w1w5x2l5y3t5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q2l6r3m6s3r6t1w6u1w6v3m6w1w6x4y6y3r6z3m7k3m7l3m7m2r7n2r7o1w7p3r7q2w7r4m7s3m7t2w7u2r7v2n7w1q7x2n7y3t202l3mcl4mal2ram3man3mao3map3mar3mas2lat4uau1uav3maw3way4uaz2lbk2sbl3t'fof'6obo2lbp3tbq3mbr1tbs2lbu1ybv3mbz3mck4m202k3mcm4mcn4mco4mcp4mcq5ycr4mcs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz2w203k6o212m6o2dw2l2cq2l3t3m3u2l17s3x19m3m}'kerning'{cl{4qu5kt5qt5rs17ss5ts}201s{201ss}201t{cks4lscmscnscoscpscls2wu2yu201ts}201x{2wu2yu}2k{201ts}2w{4qx5kx5ou5qx5rs17su5tu}2x{17su5tu5ou}2y{4qx5kx5ou5qx5rs17ss5ts}'fof'-6ofn{17sw5tw5ou5qw5rs}7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qs}3v{17su5tu5os5qs}7p{17su5tu}ck{4qu5kt5qt5rs17ss5ts}4l{4qu5kt5qt5rs17ss5ts}cm{4qu5kt5qt5rs17ss5ts}cn{4qu5kt5qt5rs17ss5ts}co{4qu5kt5qt5rs17ss5ts}cp{4qu5kt5qt5rs17ss5ts}6l{4qu5ou5qw5rt17su5tu}5q{ckuclucmucnucoucpu4lu}5r{ckuclucmucnucoucpu4lu}7q{cksclscmscnscoscps4ls}6p{4qu5ou5qw5rt17sw5tw}ek{4qu5ou5qw5rt17su5tu}el{4qu5ou5qw5rt17su5tu}em{4qu5ou5qw5rt17su5tu}en{4qu5ou5qw5rt17su5tu}eo{4qu5ou5qw5rt17su5tu}ep{4qu5ou5qw5rt17su5tu}es{17ss5ts5qs4qu}et{4qu5ou5qw5rt17sw5tw}eu{4qu5ou5qw5rt17ss5ts}ev{17ss5ts5qs4qu}6z{17sw5tw5ou5qw5rs}fm{17sw5tw5ou5qw5rs}7n{201ts}fo{17sw5tw5ou5qw5rs}fp{17sw5tw5ou5qw5rs}fq{17sw5tw5ou5qw5rs}7r{cksclscmscnscoscps4ls}fs{17sw5tw5ou5qw5rs}ft{17su5tu}fu{17su5tu}fv{17su5tu}fw{17su5tu}fz{cksclscmscnscoscps4ls}}}"), "Helvetica-Bold": c("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"), Courier: c("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"), "Courier-BoldOblique": c("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"), "Times-Bold": c("{'widths'{k3q2q5ncx2r201n3m201o6o201s2l201t2l201u2l201w3m201x3m201y3m2k1t2l2l202m2n2n3m2o3m2p6o202q6o2r1w2s2l2t2l2u3m2v3t2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w3t3x3t3y3t3z3m4k5x4l4s4m4m4n4s4o4s4p4m4q3x4r4y4s4y4t2r4u3m4v4y4w4m4x5y4y4s4z4y5k3x5l4y5m4s5n3r5o4m5p4s5q4s5r6o5s4s5t4s5u4m5v2l5w1w5x2l5y3u5z3m6k2l6l3m6m3r6n2w6o3r6p2w6q2l6r3m6s3r6t1w6u2l6v3r6w1w6x5n6y3r6z3m7k3r7l3r7m2w7n2r7o2l7p3r7q3m7r4s7s3m7t3m7u2w7v2r7w1q7x2r7y3o202l3mcl4sal2lam3man3mao3map3mar3mas2lat4uau1yav3maw3tay4uaz2lbk2sbl3t'fof'6obo2lbp3rbr1tbs2lbu2lbv3mbz3mck4s202k3mcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw2r2m3rcy2rcz2rdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3rek3mel3mem3men3meo3mep3meq4ser2wes2wet2weu2wev2wew1wex1wey1wez1wfl3rfm3mfn3mfo3mfp3mfq3mfr3tfs3mft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3m3u2l17s4s19m3m}'kerning'{cl{4qt5ks5ot5qy5rw17sv5tv}201t{cks4lscmscnscoscpscls4wv}2k{201ts}2w{4qu5ku7mu5os5qx5ru17su5tu}2x{17su5tu5ou5qs}2y{4qv5kv7mu5ot5qz5ru17su5tu}'fof'-6o7t{cksclscmscnscoscps4ls}3u{17su5tu5os5qu}3v{17su5tu5os5qu}fu{17su5tu5ou5qu}7p{17su5tu5ou5qu}ck{4qt5ks5ot5qy5rw17sv5tv}4l{4qt5ks5ot5qy5rw17sv5tv}cm{4qt5ks5ot5qy5rw17sv5tv}cn{4qt5ks5ot5qy5rw17sv5tv}co{4qt5ks5ot5qy5rw17sv5tv}cp{4qt5ks5ot5qy5rw17sv5tv}6l{17st5tt5ou5qu}17s{ckuclucmucnucoucpu4lu4wu}5o{ckuclucmucnucoucpu4lu4wu}5q{ckzclzcmzcnzcozcpz4lz4wu}5r{ckxclxcmxcnxcoxcpx4lx4wu}5t{ckuclucmucnucoucpu4lu4wu}7q{ckuclucmucnucoucpu4lu}6p{17sw5tw5ou5qu}ek{17st5tt5qu}el{17st5tt5ou5qu}em{17st5tt5qu}en{17st5tt5qu}eo{17st5tt5qu}ep{17st5tt5ou5qu}es{17ss5ts5qu}et{17sw5tw5ou5qu}eu{17sw5tw5ou5qu}ev{17ss5ts5qu}6z{17sw5tw5ou5qu5rs}fm{17sw5tw5ou5qu5rs}fn{17sw5tw5ou5qu5rs}fo{17sw5tw5ou5qu5rs}fp{17sw5tw5ou5qu5rs}fq{17sw5tw5ou5qu5rs}7r{cktcltcmtcntcotcpt4lt5os}fs{17sw5tw5ou5qu5rs}ft{17su5tu5ou5qu}7m{5os}fv{17su5tu5ou5qu}fw{17su5tu5ou5qu}fz{cksclscmscnscoscps4ls}}}"), Symbol: c("{'widths'{k3uaw4r19m3m2k1t2l2l202m2y2n3m2p5n202q6o3k3m2s2l2t2l2v3r2w1t3m3m2y1t2z1wbk2sbl3r'fof'6o3n3m3o3m3p3m3q3m3r3m3s3m3t3m3u1w3v1w3w3r3x3r3y3r3z2wbp3t3l3m5v2l5x2l5z3m2q4yfr3r7v3k7w1o7x3k}'kerning'{'fof'-6o}}"), Helvetica: c("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}"), "Helvetica-BoldOblique": c("{'widths'{k3s2q4scx1w201n3r201o6o201s1w201t1w201u1w201w3m201x3m201y3m2k1w2l2l202m2n2n3r2o3r2p5t202q6o2r1s2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v2l3w3u3x3u3y3u3z3x4k6l4l4s4m4s4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3r4v4s4w3x4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v2l5w1w5x2l5y3u5z3r6k2l6l3r6m3x6n3r6o3x6p3r6q2l6r3x6s3x6t1w6u1w6v3r6w1w6x5t6y3x6z3x7k3x7l3x7m2r7n3r7o2l7p3x7q3r7r4y7s3r7t3r7u3m7v2r7w1w7x2r7y3u202l3rcl4sal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3xbq3rbr1wbs2lbu2obv3rbz3xck4s202k3rcm4scn4sco4scp4scq6ocr4scs4mct4mcu4mcv4mcw1w2m2zcy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3res3ret3reu3rev3rew1wex1wey1wez1wfl3xfm3xfn3xfo3xfp3xfq3xfr3ufs3xft3xfu3xfv3xfw3xfz3r203k6o212m6o2dw2l2cq2l3t3r3u2l17s4m19m3r}'kerning'{cl{4qs5ku5ot5qs17sv5tv}201t{2ww4wy2yw}201w{2ks}201x{2ww4wy2yw}2k{201ts201xs}2w{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}2x{5ow5qs}2y{7qs4qu5kw5os5qw5rs17su5tu7tsfzs}'fof'-6o7p{17su5tu5ot}ck{4qs5ku5ot5qs17sv5tv}4l{4qs5ku5ot5qs17sv5tv}cm{4qs5ku5ot5qs17sv5tv}cn{4qs5ku5ot5qs17sv5tv}co{4qs5ku5ot5qs17sv5tv}cp{4qs5ku5ot5qs17sv5tv}6l{17st5tt5os}17s{2kwclvcmvcnvcovcpv4lv4wwckv}5o{2kucltcmtcntcotcpt4lt4wtckt}5q{2ksclscmscnscoscps4ls4wvcks}5r{2ks4ws}5t{2kwclvcmvcnvcovcpv4lv4wwckv}eo{17st5tt5os}fu{17su5tu5ot}6p{17ss5ts}ek{17st5tt5os}el{17st5tt5os}em{17st5tt5os}en{17st5tt5os}6o{201ts}ep{17st5tt5os}es{17ss5ts}et{17ss5ts}eu{17ss5ts}ev{17ss5ts}6z{17su5tu5os5qt}fm{17su5tu5os5qt}fn{17su5tu5os5qt}fo{17su5tu5os5qt}fp{17su5tu5os5qt}fq{17su5tu5os5qt}fs{17su5tu5os5qt}ft{17su5tu5ot}7m{5os}fv{17su5tu5ot}fw{17su5tu5ot}}}"), ZapfDingbats: c("{'widths'{k4u2k1w'fof'6o}'kerning'{'fof'-6o}}"), "Courier-Bold": c("{'widths'{k3w'fof'6o}'kerning'{'fof'-6o}}"), "Times-Italic": c("{'widths'{k3n2q4ycx2l201n3m201o5t201s2l201t2l201u2l201w3r201x3r201y3r2k1t2l2l202m2n2n3m2o3m2p5n202q5t2r1p2s2l2t2l2u3m2v4n2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v2l3w4n3x4n3y4n3z3m4k5w4l3x4m3x4n4m4o4s4p3x4q3x4r4s4s4s4t2l4u2w4v4m4w3r4x5n4y4m4z4s5k3x5l4s5m3x5n3m5o3r5p4s5q3x5r5n5s3x5t3r5u3r5v2r5w1w5x2r5y2u5z3m6k2l6l3m6m3m6n2w6o3m6p2w6q1w6r3m6s3m6t1w6u1w6v2w6w1w6x4s6y3m6z3m7k3m7l3m7m2r7n2r7o1w7p3m7q2w7r4m7s2w7t2w7u2r7v2s7w1v7x2s7y3q202l3mcl3xal2ram3man3mao3map3mar3mas2lat4wau1vav3maw4nay4waz2lbk2sbl4n'fof'6obo2lbp3mbq3obr1tbs2lbu1zbv3mbz3mck3x202k3mcm3xcn3xco3xcp3xcq5tcr4mcs3xct3xcu3xcv3xcw2l2m2ucy2lcz2ldl4mdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek3mel3mem3men3meo3mep3meq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr4nfs3mft3mfu3mfv3mfw3mfz2w203k6o212m6m2dw2l2cq2l3t3m3u2l17s3r19m3m}'kerning'{cl{5kt4qw}201s{201sw}201t{201tw2wy2yy6q-t}201x{2wy2yy}2k{201tw}2w{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}2x{17ss5ts5os}2y{7qs4qy7rs5ky7mw5os5qx5ru17su5tu}'fof'-6o6t{17ss5ts5qs}7t{5os}3v{5qs}7p{17su5tu5qs}ck{5kt4qw}4l{5kt4qw}cm{5kt4qw}cn{5kt4qw}co{5kt4qw}cp{5kt4qw}6l{4qs5ks5ou5qw5ru17su5tu}17s{2ks}5q{ckvclvcmvcnvcovcpv4lv}5r{ckuclucmucnucoucpu4lu}5t{2ks}6p{4qs5ks5ou5qw5ru17su5tu}ek{4qs5ks5ou5qw5ru17su5tu}el{4qs5ks5ou5qw5ru17su5tu}em{4qs5ks5ou5qw5ru17su5tu}en{4qs5ks5ou5qw5ru17su5tu}eo{4qs5ks5ou5qw5ru17su5tu}ep{4qs5ks5ou5qw5ru17su5tu}es{5ks5qs4qs}et{4qs5ks5ou5qw5ru17su5tu}eu{4qs5ks5qw5ru17su5tu}ev{5ks5qs4qs}ex{17ss5ts5qs}6z{4qv5ks5ou5qw5ru17su5tu}fm{4qv5ks5ou5qw5ru17su5tu}fn{4qv5ks5ou5qw5ru17su5tu}fo{4qv5ks5ou5qw5ru17su5tu}fp{4qv5ks5ou5qw5ru17su5tu}fq{4qv5ks5ou5qw5ru17su5tu}7r{5os}fs{4qv5ks5ou5qw5ru17su5tu}ft{17su5tu5qs}fu{17su5tu5qs}fv{17su5tu5qs}fw{17su5tu5qs}}}"), "Times-Roman": c("{'widths'{k3n2q4ycx2l201n3m201o6o201s2l201t2l201u2l201w2w201x2w201y2w2k1t2l2l202m2n2n3m2o3m2p5n202q6o2r1m2s2l2t2l2u3m2v3s2w1t2x2l2y1t2z1w3k3m3l3m3m3m3n3m3o3m3p3m3q3m3r3m3s3m203t2l203u2l3v1w3w3s3x3s3y3s3z2w4k5w4l4s4m4m4n4m4o4s4p3x4q3r4r4s4s4s4t2l4u2r4v4s4w3x4x5t4y4s4z4s5k3r5l4s5m4m5n3r5o3x5p4s5q4s5r5y5s4s5t4s5u3x5v2l5w1w5x2l5y2z5z3m6k2l6l2w6m3m6n2w6o3m6p2w6q2l6r3m6s3m6t1w6u1w6v3m6w1w6x4y6y3m6z3m7k3m7l3m7m2l7n2r7o1w7p3m7q3m7r4s7s3m7t3m7u2w7v3k7w1o7x3k7y3q202l3mcl4sal2lam3man3mao3map3mar3mas2lat4wau1vav3maw3say4waz2lbk2sbl3s'fof'6obo2lbp3mbq2xbr1tbs2lbu1zbv3mbz2wck4s202k3mcm4scn4sco4scp4scq5tcr4mcs3xct3xcu3xcv3xcw2l2m2tcy2lcz2ldl4sdm4sdn4sdo4sdp4sdq4sds4sdt4sdu4sdv4sdw4sdz3mek2wel2wem2wen2weo2wep2weq4mer2wes2wet2weu2wev2wew1wex1wey1wez1wfl3mfm3mfn3mfo3mfp3mfq3mfr3sfs3mft3mfu3mfv3mfw3mfz3m203k6o212m6m2dw2l2cq2l3t3m3u1w17s4s19m3m}'kerning'{cl{4qs5ku17sw5ou5qy5rw201ss5tw201ws}201s{201ss}201t{ckw4lwcmwcnwcowcpwclw4wu201ts}2k{201ts}2w{4qs5kw5os5qx5ru17sx5tx}2x{17sw5tw5ou5qu}2y{4qs5kw5os5qx5ru17sx5tx}'fof'-6o7t{ckuclucmucnucoucpu4lu5os5rs}3u{17su5tu5qs}3v{17su5tu5qs}7p{17sw5tw5qs}ck{4qs5ku17sw5ou5qy5rw201ss5tw201ws}4l{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cm{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cn{4qs5ku17sw5ou5qy5rw201ss5tw201ws}co{4qs5ku17sw5ou5qy5rw201ss5tw201ws}cp{4qs5ku17sw5ou5qy5rw201ss5tw201ws}6l{17su5tu5os5qw5rs}17s{2ktclvcmvcnvcovcpv4lv4wuckv}5o{ckwclwcmwcnwcowcpw4lw4wu}5q{ckyclycmycnycoycpy4ly4wu5ms}5r{cktcltcmtcntcotcpt4lt4ws}5t{2ktclvcmvcnvcovcpv4lv4wuckv}7q{cksclscmscnscoscps4ls}6p{17su5tu5qw5rs}ek{5qs5rs}el{17su5tu5os5qw5rs}em{17su5tu5os5qs5rs}en{17su5qs5rs}eo{5qs5rs}ep{17su5tu5os5qw5rs}es{5qs}et{17su5tu5qw5rs}eu{17su5tu5qs5rs}ev{5qs}6z{17sv5tv5os5qx5rs}fm{5os5qt5rs}fn{17sv5tv5os5qx5rs}fo{17sv5tv5os5qx5rs}fp{5os5qt5rs}fq{5os5qt5rs}7r{ckuclucmucnucoucpu4lu5os}fs{17sv5tv5os5qx5rs}ft{17ss5ts5qs}fu{17sw5tw5qs}fv{17sw5tw5qs}fw{17ss5ts5qs}fz{ckuclucmucnucoucpu4lu5os5rs}}}"), "Helvetica-Oblique": c("{'widths'{k3p2q4mcx1w201n3r201o6o201s1q201t1q201u1q201w2l201x2l201y2l2k1w2l1w202m2n2n3r2o3r2p5t202q6o2r1n2s2l2t2l2u2r2v3u2w1w2x2l2y1w2z1w3k3r3l3r3m3r3n3r3o3r3p3r3q3r3r3r3s3r203t2l203u2l3v1w3w3u3x3u3y3u3z3r4k6p4l4m4m4m4n4s4o4s4p4m4q3x4r4y4s4s4t1w4u3m4v4m4w3r4x5n4y4s4z4y5k4m5l4y5m4s5n4m5o3x5p4s5q4m5r5y5s4m5t4m5u3x5v1w5w1w5x1w5y2z5z3r6k2l6l3r6m3r6n3m6o3r6p3r6q1w6r3r6s3r6t1q6u1q6v3m6w1q6x5n6y3r6z3r7k3r7l3r7m2l7n3m7o1w7p3r7q3m7r4s7s3m7t3m7u3m7v2l7w1u7x2l7y3u202l3rcl4mal2lam3ran3rao3rap3rar3ras2lat4tau2pav3raw3uay4taz2lbk2sbl3u'fof'6obo2lbp3rbr1wbs2lbu2obv3rbz3xck4m202k3rcm4mcn4mco4mcp4mcq6ocr4scs4mct4mcu4mcv4mcw1w2m2ncy1wcz1wdl4sdm4ydn4ydo4ydp4ydq4yds4ydt4sdu4sdv4sdw4sdz3xek3rel3rem3ren3reo3rep3req5ter3mes3ret3reu3rev3rew1wex1wey1wez1wfl3rfm3rfn3rfo3rfp3rfq3rfr3ufs3xft3rfu3rfv3rfw3rfz3m203k6o212m6o2dw2l2cq2l3t3r3u1w17s4m19m3r}'kerning'{5q{4wv}cl{4qs5kw5ow5qs17sv5tv}201t{2wu4w1k2yu}201x{2wu4wy2yu}17s{2ktclucmucnu4otcpu4lu4wycoucku}2w{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}2x{17sy5ty5oy5qs}2y{7qs4qz5k1m17sy5ow5qx5rsfsu5ty7tufzu}'fof'-6o7p{17sv5tv5ow}ck{4qs5kw5ow5qs17sv5tv}4l{4qs5kw5ow5qs17sv5tv}cm{4qs5kw5ow5qs17sv5tv}cn{4qs5kw5ow5qs17sv5tv}co{4qs5kw5ow5qs17sv5tv}cp{4qs5kw5ow5qs17sv5tv}6l{17sy5ty5ow}do{17st5tt}4z{17st5tt}7s{fst}dm{17st5tt}dn{17st5tt}5o{ckwclwcmwcnwcowcpw4lw4wv}dp{17st5tt}dq{17st5tt}7t{5ow}ds{17st5tt}5t{2ktclucmucnu4otcpu4lu4wycoucku}fu{17sv5tv5ow}6p{17sy5ty5ow5qs}ek{17sy5ty5ow}el{17sy5ty5ow}em{17sy5ty5ow}en{5ty}eo{17sy5ty5ow}ep{17sy5ty5ow}es{17sy5ty5qs}et{17sy5ty5ow5qs}eu{17sy5ty5ow5qs}ev{17sy5ty5ow5qs}6z{17sy5ty5ow5qs}fm{17sy5ty5ow5qs}fn{17sy5ty5ow5qs}fo{17sy5ty5ow5qs}fp{17sy5ty5qs}fq{17sy5ty5ow5qs}7r{5ow}fs{17sy5ty5ow5qs}ft{17sv5tv5ow}7m{5ow}fv{17sv5tv5ow}fw{17sv5tv5ow}}}") } };
  n.events.push(["addFont", function(P) {
    var p = P.font, B = A.Unicode[p.postScriptName];
    B && (p.metadata.Unicode = {}, p.metadata.Unicode.widths = B.widths, p.metadata.Unicode.kerning = B.kerning);
    var O = m.Unicode[p.postScriptName];
    O && (p.metadata.Unicode.encoding = O, p.encoding = O.codePages[0]);
  }]);
})(Mt.API), /**
 * @license
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = function(e) {
    for (var i = e.length, o = new Uint8Array(i), s = 0; s < i; s++) o[s] = e.charCodeAt(s);
    return o;
  };
  n.API.events.push(["addFont", function(e) {
    var i = void 0, o = e.font, s = e.instance;
    if (!o.isStandardFont) {
      if (s === void 0) throw new Error("Font does not exist in vFS, import fonts or remove declaration doc.addFont('" + o.postScriptName + "').");
      if (typeof (i = s.existsFileInVFS(o.postScriptName) === !1 ? s.loadFile(o.postScriptName) : s.getFileFromVFS(o.postScriptName)) != "string") throw new Error("Font is not stored as string-data in vFS, import fonts or remove declaration doc.addFont('" + o.postScriptName + "').");
      (function(f, u) {
        u = /^\x00\x01\x00\x00/.test(u) ? t(u) : t(ws(u)), f.metadata = n.API.TTFFont.open(u), f.metadata.Unicode = f.metadata.Unicode || { encoding: {}, kerning: {}, widths: [] }, f.metadata.glyIdsUsed = [0];
      })(o, i);
    }
  }]);
})(Mt), Mt.API.addSvgAsImage = function(n, t, e, i, o, s, f, u) {
  if (isNaN(t) || isNaN(e)) throw Le.error("jsPDF.addSvgAsImage: Invalid coordinates", arguments), new Error("Invalid coordinates passed to jsPDF.addSvgAsImage");
  if (isNaN(i) || isNaN(o)) throw Le.error("jsPDF.addSvgAsImage: Invalid measurements", arguments), new Error("Invalid measurements (width and/or height) passed to jsPDF.addSvgAsImage");
  var c = document.createElement("canvas");
  c.width = i, c.height = o;
  var d = c.getContext("2d");
  d.fillStyle = "#fff", d.fillRect(0, 0, c.width, c.height);
  var m = { ignoreMouse: !0, ignoreAnimation: !0, ignoreDimensions: !0 }, A = this;
  return ($t.canvg ? Promise.resolve($t.canvg) : import("./index.es-yTIj1Pnc.js")).catch(function(P) {
    return Promise.reject(new Error("Could not load canvg: " + P));
  }).then(function(P) {
    return P.default ? P.default : P;
  }).then(function(P) {
    return P.fromString(d, n, m);
  }, function() {
    return Promise.reject(new Error("Could not load canvg."));
  }).then(function(P) {
    return P.render(m);
  }).then(function() {
    A.addImage(c.toDataURL("image/jpeg", 1), t, e, i, o, f, u);
  });
}, Mt.API.putTotalPages = function(n) {
  var t, e = 0;
  parseInt(this.internal.getFont().id.substr(1), 10) < 15 ? (t = new RegExp(n, "g"), e = this.internal.getNumberOfPages()) : (t = new RegExp(this.pdfEscape16(n, this.internal.getFont()), "g"), e = this.pdfEscape16(this.internal.getNumberOfPages() + "", this.internal.getFont()));
  for (var i = 1; i <= this.internal.getNumberOfPages(); i++) for (var o = 0; o < this.internal.pages[i].length; o++) this.internal.pages[i][o] = this.internal.pages[i][o].replace(t, e);
  return this;
}, Mt.API.viewerPreferences = function(n, t) {
  var e;
  n = n || {}, t = t || !1;
  var i, o, s, f = { HideToolbar: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.3 }, HideMenubar: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.3 }, HideWindowUI: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.3 }, FitWindow: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.3 }, CenterWindow: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.3 }, DisplayDocTitle: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.4 }, NonFullScreenPageMode: { defaultValue: "UseNone", value: "UseNone", type: "name", explicitSet: !1, valueSet: ["UseNone", "UseOutlines", "UseThumbs", "UseOC"], pdfVersion: 1.3 }, Direction: { defaultValue: "L2R", value: "L2R", type: "name", explicitSet: !1, valueSet: ["L2R", "R2L"], pdfVersion: 1.3 }, ViewArea: { defaultValue: "CropBox", value: "CropBox", type: "name", explicitSet: !1, valueSet: ["MediaBox", "CropBox", "TrimBox", "BleedBox", "ArtBox"], pdfVersion: 1.4 }, ViewClip: { defaultValue: "CropBox", value: "CropBox", type: "name", explicitSet: !1, valueSet: ["MediaBox", "CropBox", "TrimBox", "BleedBox", "ArtBox"], pdfVersion: 1.4 }, PrintArea: { defaultValue: "CropBox", value: "CropBox", type: "name", explicitSet: !1, valueSet: ["MediaBox", "CropBox", "TrimBox", "BleedBox", "ArtBox"], pdfVersion: 1.4 }, PrintClip: { defaultValue: "CropBox", value: "CropBox", type: "name", explicitSet: !1, valueSet: ["MediaBox", "CropBox", "TrimBox", "BleedBox", "ArtBox"], pdfVersion: 1.4 }, PrintScaling: { defaultValue: "AppDefault", value: "AppDefault", type: "name", explicitSet: !1, valueSet: ["AppDefault", "None"], pdfVersion: 1.6 }, Duplex: { defaultValue: "", value: "none", type: "name", explicitSet: !1, valueSet: ["Simplex", "DuplexFlipShortEdge", "DuplexFlipLongEdge", "none"], pdfVersion: 1.7 }, PickTrayByPDFSize: { defaultValue: !1, value: !1, type: "boolean", explicitSet: !1, valueSet: [!0, !1], pdfVersion: 1.7 }, PrintPageRange: { defaultValue: "", value: "", type: "array", explicitSet: !1, valueSet: null, pdfVersion: 1.7 }, NumCopies: { defaultValue: 1, value: 1, type: "integer", explicitSet: !1, valueSet: null, pdfVersion: 1.7 } }, u = Object.keys(f), c = [], d = 0, m = 0, A = 0;
  function P(B, O) {
    var M, S = !1;
    for (M = 0; M < B.length; M += 1) B[M] === O && (S = !0);
    return S;
  }
  if (this.internal.viewerpreferences === void 0 && (this.internal.viewerpreferences = {}, this.internal.viewerpreferences.configuration = JSON.parse(JSON.stringify(f)), this.internal.viewerpreferences.isSubscribed = !1), e = this.internal.viewerpreferences.configuration, n === "reset" || t === !0) {
    var p = u.length;
    for (A = 0; A < p; A += 1) e[u[A]].value = e[u[A]].defaultValue, e[u[A]].explicitSet = !1;
  }
  if (xe(n) === "object") {
    for (o in n) if (s = n[o], P(u, o) && s !== void 0) {
      if (e[o].type === "boolean" && typeof s == "boolean") e[o].value = s;
      else if (e[o].type === "name" && P(e[o].valueSet, s)) e[o].value = s;
      else if (e[o].type === "integer" && Number.isInteger(s)) e[o].value = s;
      else if (e[o].type === "array") {
        for (d = 0; d < s.length; d += 1) if (i = !0, s[d].length === 1 && typeof s[d][0] == "number") c.push(String(s[d] - 1));
        else if (s[d].length > 1) {
          for (m = 0; m < s[d].length; m += 1) typeof s[d][m] != "number" && (i = !1);
          i === !0 && c.push([s[d][0] - 1, s[d][1] - 1].join(" "));
        }
        e[o].value = "[" + c.join(" ") + "]";
      } else e[o].value = e[o].defaultValue;
      e[o].explicitSet = !0;
    }
  }
  return this.internal.viewerpreferences.isSubscribed === !1 && (this.internal.events.subscribe("putCatalog", function() {
    var B, O = [];
    for (B in e) e[B].explicitSet === !0 && (e[B].type === "name" ? O.push("/" + B + " /" + e[B].value) : O.push("/" + B + " " + e[B].value));
    O.length !== 0 && this.internal.write(`/ViewerPreferences
<<
` + O.join(`
`) + `
>>`);
  }), this.internal.viewerpreferences.isSubscribed = !0), this.internal.viewerpreferences.configuration = e, this;
}, Mt.API.addMetadata = function(n, t) {
  return this.internal.__metadata__ === void 0 && (this.internal.__metadata__ = { metadata: n, namespaceUri: t ?? "http://jspdf.default.namespaceuri/", rawXml: typeof t == "boolean" && t }, this.internal.events.subscribe("putCatalog", c1), this.internal.events.subscribe("postPutResources", h1)), this;
}, (function(n) {
  var t = n.API, e = t.pdfEscape16 = function(s, f) {
    for (var u, c = f.metadata.Unicode.widths, d = ["", "0", "00", "000", "0000"], m = [""], A = 0, P = s.length; A < P; ++A) {
      if (u = f.metadata.characterToGlyph(s.charCodeAt(A)), f.metadata.glyIdsUsed.push(u), f.metadata.toUnicode[u] = s.charCodeAt(A), c.indexOf(u) == -1 && (c.push(u), c.push([parseInt(f.metadata.widthOfGlyph(u), 10)])), u == "0") return m.join("");
      u = u.toString(16), m.push(d[4 - u.length], u);
    }
    return m.join("");
  }, i = function(s) {
    var f, u, c, d, m, A, P;
    for (m = `/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
/CIDSystemInfo <<
  /Registry (Adobe)
  /Ordering (UCS)
  /Supplement 0
>> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<0000><ffff>
endcodespacerange`, c = [], A = 0, P = (u = Object.keys(s).sort(function(p, B) {
      return p - B;
    })).length; A < P; A++) f = u[A], c.length >= 100 && (m += `
` + c.length + ` beginbfchar
` + c.join(`
`) + `
endbfchar`, c = []), s[f] !== void 0 && s[f] !== null && typeof s[f].toString == "function" && (d = ("0000" + s[f].toString(16)).slice(-4), f = ("0000" + (+f).toString(16)).slice(-4), c.push("<" + f + "><" + d + ">"));
    return c.length && (m += `
` + c.length + ` beginbfchar
` + c.join(`
`) + `
endbfchar
`), m + `endcmap
CMapName currentdict /CMap defineresource pop
end
end`;
  };
  t.events.push(["putFont", function(s) {
    (function(f) {
      var u = f.font, c = f.out, d = f.newObject, m = f.putStream;
      if (u.metadata instanceof n.API.TTFFont && u.encoding === "Identity-H") {
        for (var A = u.metadata.Unicode.widths, P = u.metadata.subset.encode(u.metadata.glyIdsUsed, 1), p = "", B = 0; B < P.length; B++) p += String.fromCharCode(P[B]);
        var O = d();
        m({ data: p, addLength1: !0, objectId: O }), c("endobj");
        var M = d();
        m({ data: i(u.metadata.toUnicode), addLength1: !0, objectId: M }), c("endobj");
        var S = d();
        c("<<"), c("/Type /FontDescriptor"), c("/FontName /" + Ki(u.fontName)), c("/FontFile2 " + O + " 0 R"), c("/FontBBox " + n.API.PDFObject.convert(u.metadata.bbox)), c("/Flags " + u.metadata.flags), c("/StemV " + u.metadata.stemV), c("/ItalicAngle " + u.metadata.italicAngle), c("/Ascent " + u.metadata.ascender), c("/Descent " + u.metadata.decender), c("/CapHeight " + u.metadata.capHeight), c(">>"), c("endobj");
        var Y = d();
        c("<<"), c("/Type /Font"), c("/BaseFont /" + Ki(u.fontName)), c("/FontDescriptor " + S + " 0 R"), c("/W " + n.API.PDFObject.convert(A)), c("/CIDToGIDMap /Identity"), c("/DW 1000"), c("/Subtype /CIDFontType2"), c("/CIDSystemInfo"), c("<<"), c("/Supplement 0"), c("/Registry (Adobe)"), c("/Ordering (" + u.encoding + ")"), c(">>"), c(">>"), c("endobj"), u.objectNumber = d(), c("<<"), c("/Type /Font"), c("/Subtype /Type0"), c("/ToUnicode " + M + " 0 R"), c("/BaseFont /" + Ki(u.fontName)), c("/Encoding /" + u.encoding), c("/DescendantFonts [" + Y + " 0 R]"), c(">>"), c("endobj"), u.isAlreadyPutted = !0;
      }
    })(s);
  }]), t.events.push(["putFont", function(s) {
    (function(f) {
      var u = f.font, c = f.out, d = f.newObject, m = f.putStream;
      if (u.metadata instanceof n.API.TTFFont && u.encoding === "WinAnsiEncoding") {
        for (var A = u.metadata.rawData, P = "", p = 0; p < A.length; p++) P += String.fromCharCode(A[p]);
        var B = d();
        m({ data: P, addLength1: !0, objectId: B }), c("endobj");
        var O = d();
        m({ data: i(u.metadata.toUnicode), addLength1: !0, objectId: O }), c("endobj");
        var M = d();
        c("<<"), c("/Descent " + u.metadata.decender), c("/CapHeight " + u.metadata.capHeight), c("/StemV " + u.metadata.stemV), c("/Type /FontDescriptor"), c("/FontFile2 " + B + " 0 R"), c("/Flags 96"), c("/FontBBox " + n.API.PDFObject.convert(u.metadata.bbox)), c("/FontName /" + Ki(u.fontName)), c("/ItalicAngle " + u.metadata.italicAngle), c("/Ascent " + u.metadata.ascender), c(">>"), c("endobj"), u.objectNumber = d();
        for (var S = 0; S < u.metadata.hmtx.widths.length; S++) u.metadata.hmtx.widths[S] = parseInt(u.metadata.hmtx.widths[S] * (1e3 / u.metadata.head.unitsPerEm));
        c("<</Subtype/TrueType/Type/Font/ToUnicode " + O + " 0 R/BaseFont/" + Ki(u.fontName) + "/FontDescriptor " + M + " 0 R/Encoding/" + u.encoding + " /FirstChar 29 /LastChar 255 /Widths " + n.API.PDFObject.convert(u.metadata.hmtx.widths) + ">>"), c("endobj"), u.isAlreadyPutted = !0;
      }
    })(s);
  }]);
  var o = function(s) {
    var f, u = s.text || "", c = s.x, d = s.y, m = s.options || {}, A = s.mutex || {}, P = A.pdfEscape, p = A.activeFontKey, B = A.fonts, O = p, M = "", S = 0, Y = "", J = B[O].encoding;
    if (B[O].encoding !== "Identity-H") return { text: u, x: c, y: d, options: m, mutex: A };
    for (Y = u, O = p, Array.isArray(u) && (Y = u[0]), S = 0; S < Y.length; S += 1) B[O].metadata.hasOwnProperty("cmap") && (f = B[O].metadata.cmap.unicode.codeMap[Y[S].charCodeAt(0)]), f || Y[S].charCodeAt(0) < 256 && B[O].metadata.hasOwnProperty("Unicode") ? M += Y[S] : M += "";
    var D = "";
    return parseInt(O.slice(1)) < 14 || J === "WinAnsiEncoding" ? D = P(M, O).split("").map(function(lt) {
      return lt.charCodeAt(0).toString(16);
    }).join("") : J === "Identity-H" && (D = e(M, B[O])), A.isHex = !0, { text: D, x: c, y: d, options: m, mutex: A };
  };
  t.events.push(["postProcessText", function(s) {
    var f = s.text || "", u = [], c = { text: f, x: s.x, y: s.y, options: s.options, mutex: s.mutex };
    if (Array.isArray(f)) {
      var d = 0;
      for (d = 0; d < f.length; d += 1) Array.isArray(f[d]) && f[d].length === 3 ? u.push([o(Object.assign({}, c, { text: f[d][0] })).text, f[d][1], f[d][2]]) : u.push(o(Object.assign({}, c, { text: f[d] })).text);
      s.text = u;
    } else s.text = o(Object.assign({}, c, { text: f })).text;
  }]);
})(Mt), /**
 * @license
 * jsPDF virtual FileSystem functionality
 *
 * Licensed under the MIT License.
 * http://opensource.org/licenses/mit-license
 */
(function(n) {
  var t = function() {
    return this.internal.vFS === void 0 && (this.internal.vFS = {}), !0;
  };
  n.existsFileInVFS = function(e) {
    return t.call(this), this.internal.vFS[e] !== void 0;
  }, n.addFileToVFS = function(e, i) {
    return t.call(this), this.internal.vFS[e] = i, this;
  }, n.getFileFromVFS = function(e) {
    return t.call(this), this.internal.vFS[e] !== void 0 ? this.internal.vFS[e] : null;
  };
})(Mt.API), /**
 * @license
 * Unicode Bidi Engine based on the work of Alex Shensis (@asthensis)
 * MIT License
 */
(function(n) {
  n.__bidiEngine__ = n.prototype.__bidiEngine__ = function(i) {
    var o, s, f, u, c, d, m, A = t, P = [[0, 3, 0, 1, 0, 0, 0], [0, 3, 0, 1, 2, 2, 0], [0, 3, 0, 17, 2, 0, 1], [0, 3, 5, 5, 4, 1, 0], [0, 3, 21, 21, 4, 0, 1], [0, 3, 5, 5, 4, 2, 0]], p = [[2, 0, 1, 1, 0, 1, 0], [2, 0, 1, 1, 0, 2, 0], [2, 0, 2, 1, 3, 2, 0], [2, 0, 2, 33, 3, 1, 1]], B = { L: 0, R: 1, EN: 2, AN: 3, N: 4, B: 5, S: 6 }, O = { 0: 0, 5: 1, 6: 2, 7: 3, 32: 4, 251: 5, 254: 6, 255: 7 }, M = ["(", ")", "(", "<", ">", "<", "[", "]", "[", "{", "}", "{", "«", "»", "«", "‹", "›", "‹", "⁅", "⁆", "⁅", "⁽", "⁾", "⁽", "₍", "₎", "₍", "≤", "≥", "≤", "〈", "〉", "〈", "﹙", "﹚", "﹙", "﹛", "﹜", "﹛", "﹝", "﹞", "﹝", "﹤", "﹥", "﹤"], S = new RegExp(/^([1-4|9]|1[0-9]|2[0-9]|3[0168]|4[04589]|5[012]|7[78]|159|16[0-9]|17[0-2]|21[569]|22[03489]|250)$/), Y = !1, J = 0;
    this.__bidiEngine__ = {};
    var D = function(N) {
      var E = N.charCodeAt(), q = E >> 8, U = O[q];
      return U !== void 0 ? A[256 * U + (255 & E)] : q === 252 || q === 253 ? "AL" : S.test(q) ? "L" : q === 8 ? "R" : "N";
    }, lt = function(N) {
      for (var E, q = 0; q < N.length; q++) {
        if ((E = D(N.charAt(q))) === "L") return !1;
        if (E === "R") return !0;
      }
      return !1;
    }, yt = function(N, E, q, U) {
      var rt, ct, pt, nt, ft = E[U];
      switch (ft) {
        case "L":
        case "R":
        case "LRE":
        case "RLE":
        case "LRO":
        case "RLO":
        case "PDF":
          Y = !1;
          break;
        case "N":
        case "AN":
          break;
        case "EN":
          Y && (ft = "AN");
          break;
        case "AL":
          Y = !0, ft = "R";
          break;
        case "WS":
        case "BN":
          ft = "N";
          break;
        case "CS":
          U < 1 || U + 1 >= E.length || (rt = q[U - 1]) !== "EN" && rt !== "AN" || (ct = E[U + 1]) !== "EN" && ct !== "AN" ? ft = "N" : Y && (ct = "AN"), ft = ct === rt ? ct : "N";
          break;
        case "ES":
          ft = (rt = U > 0 ? q[U - 1] : "B") === "EN" && U + 1 < E.length && E[U + 1] === "EN" ? "EN" : "N";
          break;
        case "ET":
          if (U > 0 && q[U - 1] === "EN") {
            ft = "EN";
            break;
          }
          if (Y) {
            ft = "N";
            break;
          }
          for (pt = U + 1, nt = E.length; pt < nt && E[pt] === "ET"; ) pt++;
          ft = pt < nt && E[pt] === "EN" ? "EN" : "N";
          break;
        case "NSM":
          if (f && !u) {
            for (nt = E.length, pt = U + 1; pt < nt && E[pt] === "NSM"; ) pt++;
            if (pt < nt) {
              var At = N[U], xt = At >= 1425 && At <= 2303 || At === 64286;
              if (rt = E[pt], xt && (rt === "R" || rt === "AL")) {
                ft = "R";
                break;
              }
            }
          }
          ft = U < 1 || (rt = E[U - 1]) === "B" ? "N" : q[U - 1];
          break;
        case "B":
          Y = !1, o = !0, ft = J;
          break;
        case "S":
          s = !0, ft = "N";
      }
      return ft;
    }, mt = function(N, E, q) {
      var U = N.split("");
      return q && tt(U, q, { hiLevel: J }), U.reverse(), E && E.reverse(), U.join("");
    }, tt = function(N, E, q) {
      var U, rt, ct, pt, nt, ft = -1, At = N.length, xt = 0, x = [], j = J ? p : P, R = [];
      for (Y = !1, o = !1, s = !1, rt = 0; rt < At; rt++) R[rt] = D(N[rt]);
      for (ct = 0; ct < At; ct++) {
        if (nt = xt, x[ct] = yt(N, R, x, ct), U = 240 & (xt = j[nt][B[x[ct]]]), xt &= 15, E[ct] = pt = j[xt][5], U > 0) if (U === 16) {
          for (rt = ft; rt < ct; rt++) E[rt] = 1;
          ft = -1;
        } else ft = -1;
        if (j[xt][6]) ft === -1 && (ft = ct);
        else if (ft > -1) {
          for (rt = ft; rt < ct; rt++) E[rt] = pt;
          ft = -1;
        }
        R[ct] === "B" && (E[ct] = 0), q.hiLevel |= pt;
      }
      s && (function(V, $, Q) {
        for (var it = 0; it < Q; it++) if (V[it] === "S") {
          $[it] = J;
          for (var at = it - 1; at >= 0 && V[at] === "WS"; at--) $[at] = J;
        }
      })(R, E, At);
    }, z = function(N, E, q, U, rt) {
      if (!(rt.hiLevel < N)) {
        if (N === 1 && J === 1 && !o) return E.reverse(), void (q && q.reverse());
        for (var ct, pt, nt, ft, At = E.length, xt = 0; xt < At; ) {
          if (U[xt] >= N) {
            for (nt = xt + 1; nt < At && U[nt] >= N; ) nt++;
            for (ft = xt, pt = nt - 1; ft < pt; ft++, pt--) ct = E[ft], E[ft] = E[pt], E[pt] = ct, q && (ct = q[ft], q[ft] = q[pt], q[pt] = ct);
            xt = nt;
          }
          xt++;
        }
      }
    }, et = function(N, E, q) {
      var U = N.split(""), rt = { hiLevel: J };
      return q || (q = []), tt(U, q, rt), (function(ct, pt, nt) {
        if (nt.hiLevel !== 0 && m) for (var ft, At = 0; At < ct.length; At++) pt[At] === 1 && (ft = M.indexOf(ct[At])) >= 0 && (ct[At] = M[ft + 1]);
      })(U, q, rt), z(2, U, E, q, rt), z(1, U, E, q, rt), U.join("");
    };
    return this.__bidiEngine__.doBidiReorder = function(N, E, q) {
      if ((function(rt, ct) {
        if (ct) for (var pt = 0; pt < rt.length; pt++) ct[pt] = pt;
        u === void 0 && (u = lt(rt)), d === void 0 && (d = lt(rt));
      })(N, E), f || !c || d) if (f && c && u ^ d) J = u ? 1 : 0, N = mt(N, E, q);
      else if (!f && c && d) J = u ? 1 : 0, N = et(N, E, q), N = mt(N, E);
      else if (!f || u || c || d) {
        if (f && !c && u ^ d) N = mt(N, E), u ? (J = 0, N = et(N, E, q)) : (J = 1, N = et(N, E, q), N = mt(N, E));
        else if (f && u && !c && d) J = 1, N = et(N, E, q), N = mt(N, E);
        else if (!f && !c && u ^ d) {
          var U = m;
          u ? (J = 1, N = et(N, E, q), J = 0, m = !1, N = et(N, E, q), m = U) : (J = 0, N = et(N, E, q), N = mt(N, E), J = 1, m = !1, N = et(N, E, q), m = U, N = mt(N, E));
        }
      } else J = 0, N = et(N, E, q);
      else J = u ? 1 : 0, N = et(N, E, q);
      return N;
    }, this.__bidiEngine__.setOptions = function(N) {
      N && (f = N.isInputVisual, c = N.isOutputVisual, u = N.isInputRtl, d = N.isOutputRtl, m = N.isSymmetricSwapping);
    }, this.__bidiEngine__.setOptions(i), this.__bidiEngine__;
  };
  var t = ["BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "S", "B", "S", "WS", "B", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "B", "B", "B", "S", "WS", "N", "N", "ET", "ET", "ET", "N", "N", "N", "N", "N", "ES", "CS", "ES", "CS", "CS", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "CS", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "BN", "BN", "BN", "BN", "BN", "BN", "B", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "BN", "CS", "N", "ET", "ET", "ET", "ET", "N", "N", "N", "N", "L", "N", "N", "BN", "N", "N", "ET", "ET", "EN", "EN", "N", "L", "N", "N", "N", "EN", "L", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "L", "L", "L", "L", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "L", "N", "N", "N", "N", "N", "ET", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "R", "NSM", "R", "NSM", "NSM", "R", "NSM", "NSM", "R", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "N", "N", "N", "N", "N", "R", "R", "R", "R", "R", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "AN", "AN", "AN", "AN", "AN", "AN", "N", "N", "AL", "ET", "ET", "AL", "CS", "AL", "N", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "AN", "ET", "AN", "AN", "AL", "AL", "AL", "NSM", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AN", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "NSM", "NSM", "N", "NSM", "NSM", "NSM", "NSM", "AL", "AL", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "N", "AL", "AL", "NSM", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "AL", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "R", "R", "N", "N", "N", "N", "R", "N", "N", "N", "N", "N", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "WS", "BN", "BN", "BN", "L", "R", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "WS", "B", "LRE", "RLE", "PDF", "LRO", "RLO", "CS", "ET", "ET", "ET", "ET", "ET", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "CS", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "WS", "BN", "BN", "BN", "BN", "BN", "N", "LRI", "RLI", "FSI", "PDI", "BN", "BN", "BN", "BN", "BN", "BN", "EN", "L", "N", "N", "EN", "EN", "EN", "EN", "EN", "EN", "ES", "ES", "N", "N", "N", "L", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "ES", "ES", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "ET", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "R", "NSM", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "ES", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "N", "R", "R", "R", "R", "R", "N", "R", "N", "R", "R", "N", "R", "R", "N", "R", "R", "R", "R", "R", "R", "R", "R", "R", "R", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "NSM", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "CS", "N", "CS", "N", "N", "CS", "N", "N", "N", "N", "N", "N", "N", "N", "N", "ET", "N", "N", "ES", "ES", "N", "N", "N", "N", "N", "ET", "ET", "N", "N", "N", "N", "N", "AL", "AL", "AL", "AL", "AL", "N", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "AL", "N", "N", "BN", "N", "N", "N", "ET", "ET", "ET", "N", "N", "N", "N", "N", "ES", "CS", "ES", "CS", "CS", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "EN", "CS", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "N", "N", "N", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "L", "L", "L", "N", "N", "L", "L", "L", "N", "N", "N", "ET", "ET", "N", "N", "N", "ET", "ET", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N", "N"], e = new n.__bidiEngine__({ isInputVisual: !0 });
  n.API.events.push(["postProcessText", function(i) {
    var o = i.text;
    i.x, i.y;
    var s = i.options || {};
    i.mutex, s.lang;
    var f = [];
    if (s.isInputVisual = typeof s.isInputVisual != "boolean" || s.isInputVisual, e.setOptions(s), Object.prototype.toString.call(o) === "[object Array]") {
      var u = 0;
      for (f = [], u = 0; u < o.length; u += 1) Object.prototype.toString.call(o[u]) === "[object Array]" ? f.push([e.doBidiReorder(o[u][0]), o[u][1], o[u][2]]) : f.push([e.doBidiReorder(o[u])]);
      i.text = f;
    } else i.text = e.doBidiReorder(o);
    e.setOptions({ isInputVisual: !0 });
  }]);
})(Mt), Mt.API.TTFFont = (function() {
  function n(t) {
    var e;
    if (this.rawData = t, e = this.contents = new Jr(t), this.contents.pos = 4, e.readString(4) === "ttcf") throw new Error("TTCF not supported.");
    e.pos = 0, this.parse(), this.subset = new S1(this), this.registerTTF();
  }
  return n.open = function(t) {
    return new n(t);
  }, n.prototype.parse = function() {
    return this.directory = new f1(this.contents), this.head = new p1(this), this.name = new w1(this), this.cmap = new oh(this), this.toUnicode = {}, this.hhea = new g1(this), this.maxp = new y1(this), this.hmtx = new x1(this), this.post = new b1(this), this.os2 = new m1(this), this.loca = new L1(this), this.glyf = new _1(this), this.ascender = this.os2.exists && this.os2.ascender || this.hhea.ascender, this.decender = this.os2.exists && this.os2.decender || this.hhea.decender, this.lineGap = this.os2.exists && this.os2.lineGap || this.hhea.lineGap, this.bbox = [this.head.xMin, this.head.yMin, this.head.xMax, this.head.yMax];
  }, n.prototype.registerTTF = function() {
    var t, e, i, o, s;
    if (this.scaleFactor = 1e3 / this.head.unitsPerEm, this.bbox = (function() {
      var f, u, c, d;
      for (d = [], f = 0, u = (c = this.bbox).length; f < u; f++) t = c[f], d.push(Math.round(t * this.scaleFactor));
      return d;
    }).call(this), this.stemV = 0, this.post.exists ? (i = 255 & (o = this.post.italic_angle), 32768 & (e = o >> 16) && (e = -(1 + (65535 ^ e))), this.italicAngle = +(e + "." + i)) : this.italicAngle = 0, this.ascender = Math.round(this.ascender * this.scaleFactor), this.decender = Math.round(this.decender * this.scaleFactor), this.lineGap = Math.round(this.lineGap * this.scaleFactor), this.capHeight = this.os2.exists && this.os2.capHeight || this.ascender, this.xHeight = this.os2.exists && this.os2.xHeight || 0, this.familyClass = (this.os2.exists && this.os2.familyClass || 0) >> 8, this.isSerif = (s = this.familyClass) === 1 || s === 2 || s === 3 || s === 4 || s === 5 || s === 7, this.isScript = this.familyClass === 10, this.flags = 0, this.post.isFixedPitch && (this.flags |= 1), this.isSerif && (this.flags |= 2), this.isScript && (this.flags |= 8), this.italicAngle !== 0 && (this.flags |= 64), this.flags |= 32, !this.cmap.unicode) throw new Error("No unicode cmap for font");
  }, n.prototype.characterToGlyph = function(t) {
    var e;
    return ((e = this.cmap.unicode) != null ? e.codeMap[t] : void 0) || 0;
  }, n.prototype.widthOfGlyph = function(t) {
    var e;
    return e = 1e3 / this.head.unitsPerEm, this.hmtx.forGlyph(t).advance * e;
  }, n.prototype.widthOfString = function(t, e, i) {
    var o, s, f, u;
    for (f = 0, s = 0, u = (t = "" + t).length; 0 <= u ? s < u : s > u; s = 0 <= u ? ++s : --s) o = t.charCodeAt(s), f += this.widthOfGlyph(this.characterToGlyph(o)) + i * (1e3 / e) || 0;
    return f * (e / 1e3);
  }, n.prototype.lineHeight = function(t, e) {
    var i;
    return e == null && (e = !1), i = e ? this.lineGap : 0, (this.ascender + i - this.decender) / 1e3 * t;
  }, n;
})();
var Zn, Jr = (function() {
  function n(t) {
    this.data = t ?? [], this.pos = 0, this.length = this.data.length;
  }
  return n.prototype.readByte = function() {
    return this.data[this.pos++];
  }, n.prototype.writeByte = function(t) {
    return this.data[this.pos++] = t;
  }, n.prototype.readUInt32 = function() {
    return 16777216 * this.readByte() + (this.readByte() << 16) + (this.readByte() << 8) + this.readByte();
  }, n.prototype.writeUInt32 = function(t) {
    return this.writeByte(t >>> 24 & 255), this.writeByte(t >> 16 & 255), this.writeByte(t >> 8 & 255), this.writeByte(255 & t);
  }, n.prototype.readInt32 = function() {
    var t;
    return (t = this.readUInt32()) >= 2147483648 ? t - 4294967296 : t;
  }, n.prototype.writeInt32 = function(t) {
    return t < 0 && (t += 4294967296), this.writeUInt32(t);
  }, n.prototype.readUInt16 = function() {
    return this.readByte() << 8 | this.readByte();
  }, n.prototype.writeUInt16 = function(t) {
    return this.writeByte(t >> 8 & 255), this.writeByte(255 & t);
  }, n.prototype.readInt16 = function() {
    var t;
    return (t = this.readUInt16()) >= 32768 ? t - 65536 : t;
  }, n.prototype.writeInt16 = function(t) {
    return t < 0 && (t += 65536), this.writeUInt16(t);
  }, n.prototype.readString = function(t) {
    var e, i;
    for (i = [], e = 0; 0 <= t ? e < t : e > t; e = 0 <= t ? ++e : --e) i[e] = String.fromCharCode(this.readByte());
    return i.join("");
  }, n.prototype.writeString = function(t) {
    var e, i, o;
    for (o = [], e = 0, i = t.length; 0 <= i ? e < i : e > i; e = 0 <= i ? ++e : --e) o.push(this.writeByte(t.charCodeAt(e)));
    return o;
  }, n.prototype.readShort = function() {
    return this.readInt16();
  }, n.prototype.writeShort = function(t) {
    return this.writeInt16(t);
  }, n.prototype.readLongLong = function() {
    var t, e, i, o, s, f, u, c;
    return t = this.readByte(), e = this.readByte(), i = this.readByte(), o = this.readByte(), s = this.readByte(), f = this.readByte(), u = this.readByte(), c = this.readByte(), 128 & t ? -1 * (72057594037927940 * (255 ^ t) + 281474976710656 * (255 ^ e) + 1099511627776 * (255 ^ i) + 4294967296 * (255 ^ o) + 16777216 * (255 ^ s) + 65536 * (255 ^ f) + 256 * (255 ^ u) + (255 ^ c) + 1) : 72057594037927940 * t + 281474976710656 * e + 1099511627776 * i + 4294967296 * o + 16777216 * s + 65536 * f + 256 * u + c;
  }, n.prototype.writeLongLong = function(t) {
    var e, i;
    return e = Math.floor(t / 4294967296), i = 4294967295 & t, this.writeByte(e >> 24 & 255), this.writeByte(e >> 16 & 255), this.writeByte(e >> 8 & 255), this.writeByte(255 & e), this.writeByte(i >> 24 & 255), this.writeByte(i >> 16 & 255), this.writeByte(i >> 8 & 255), this.writeByte(255 & i);
  }, n.prototype.readInt = function() {
    return this.readInt32();
  }, n.prototype.writeInt = function(t) {
    return this.writeInt32(t);
  }, n.prototype.read = function(t) {
    var e, i;
    for (e = [], i = 0; 0 <= t ? i < t : i > t; i = 0 <= t ? ++i : --i) e.push(this.readByte());
    return e;
  }, n.prototype.write = function(t) {
    var e, i, o, s;
    for (s = [], i = 0, o = t.length; i < o; i++) e = t[i], s.push(this.writeByte(e));
    return s;
  }, n;
})(), f1 = (function() {
  var n;
  function t(e) {
    var i, o, s;
    for (this.scalarType = e.readInt(), this.tableCount = e.readShort(), this.searchRange = e.readShort(), this.entrySelector = e.readShort(), this.rangeShift = e.readShort(), this.tables = {}, o = 0, s = this.tableCount; 0 <= s ? o < s : o > s; o = 0 <= s ? ++o : --o) i = { tag: e.readString(4), checksum: e.readInt(), offset: e.readInt(), length: e.readInt() }, this.tables[i.tag] = i;
  }
  return t.prototype.encode = function(e) {
    var i, o, s, f, u, c, d, m, A, P, p, B, O;
    for (O in p = Object.keys(e).length, c = Math.log(2), A = 16 * Math.floor(Math.log(p) / c), f = Math.floor(A / c), m = 16 * p - A, (o = new Jr()).writeInt(this.scalarType), o.writeShort(p), o.writeShort(A), o.writeShort(f), o.writeShort(m), s = 16 * p, d = o.pos + s, u = null, B = [], e) for (P = e[O], o.writeString(O), o.writeInt(n(P)), o.writeInt(d), o.writeInt(P.length), B = B.concat(P), O === "head" && (u = d), d += P.length; d % 4; ) B.push(0), d++;
    return o.write(B), i = 2981146554 - n(o.data), o.pos = u + 8, o.writeUInt32(i), o.data;
  }, n = function(e) {
    var i, o, s, f;
    for (e = lh.call(e); e.length % 4; ) e.push(0);
    for (s = new Jr(e), o = 0, i = 0, f = e.length; i < f; i = i += 4) o += s.readUInt32();
    return 4294967295 & o;
  }, t;
})(), d1 = {}.hasOwnProperty, fr = function(n, t) {
  for (var e in t) d1.call(t, e) && (n[e] = t[e]);
  function i() {
    this.constructor = n;
  }
  return i.prototype = t.prototype, n.prototype = new i(), n.__super__ = t.prototype, n;
};
Zn = (function() {
  function n(t) {
    var e;
    this.file = t, e = this.file.directory.tables[this.tag], this.exists = !!e, e && (this.offset = e.offset, this.length = e.length, this.parse(this.file.contents));
  }
  return n.prototype.parse = function() {
  }, n.prototype.encode = function() {
  }, n.prototype.raw = function() {
    return this.exists ? (this.file.contents.pos = this.offset, this.file.contents.read(this.length)) : null;
  }, n;
})();
var p1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "head", n.prototype.parse = function(t) {
    return t.pos = this.offset, this.version = t.readInt(), this.revision = t.readInt(), this.checkSumAdjustment = t.readInt(), this.magicNumber = t.readInt(), this.flags = t.readShort(), this.unitsPerEm = t.readShort(), this.created = t.readLongLong(), this.modified = t.readLongLong(), this.xMin = t.readShort(), this.yMin = t.readShort(), this.xMax = t.readShort(), this.yMax = t.readShort(), this.macStyle = t.readShort(), this.lowestRecPPEM = t.readShort(), this.fontDirectionHint = t.readShort(), this.indexToLocFormat = t.readShort(), this.glyphDataFormat = t.readShort();
  }, n.prototype.encode = function(t) {
    var e;
    return (e = new Jr()).writeInt(this.version), e.writeInt(this.revision), e.writeInt(this.checkSumAdjustment), e.writeInt(this.magicNumber), e.writeShort(this.flags), e.writeShort(this.unitsPerEm), e.writeLongLong(this.created), e.writeLongLong(this.modified), e.writeShort(this.xMin), e.writeShort(this.yMin), e.writeShort(this.xMax), e.writeShort(this.yMax), e.writeShort(this.macStyle), e.writeShort(this.lowestRecPPEM), e.writeShort(this.fontDirectionHint), e.writeShort(t), e.writeShort(this.glyphDataFormat), e.data;
  }, n;
})(), Nu = (function() {
  function n(t, e) {
    var i, o, s, f, u, c, d, m, A, P, p, B, O, M, S, Y, J;
    switch (this.platformID = t.readUInt16(), this.encodingID = t.readShort(), this.offset = e + t.readInt(), A = t.pos, t.pos = this.offset, this.format = t.readUInt16(), this.length = t.readUInt16(), this.language = t.readUInt16(), this.isUnicode = this.platformID === 3 && this.encodingID === 1 && this.format === 4 || this.platformID === 0 && this.format === 4, this.codeMap = {}, this.format) {
      case 0:
        for (c = 0; c < 256; ++c) this.codeMap[c] = t.readByte();
        break;
      case 4:
        for (p = t.readUInt16(), P = p / 2, t.pos += 6, s = (function() {
          var D, lt;
          for (lt = [], c = D = 0; 0 <= P ? D < P : D > P; c = 0 <= P ? ++D : --D) lt.push(t.readUInt16());
          return lt;
        })(), t.pos += 2, O = (function() {
          var D, lt;
          for (lt = [], c = D = 0; 0 <= P ? D < P : D > P; c = 0 <= P ? ++D : --D) lt.push(t.readUInt16());
          return lt;
        })(), d = (function() {
          var D, lt;
          for (lt = [], c = D = 0; 0 <= P ? D < P : D > P; c = 0 <= P ? ++D : --D) lt.push(t.readUInt16());
          return lt;
        })(), m = (function() {
          var D, lt;
          for (lt = [], c = D = 0; 0 <= P ? D < P : D > P; c = 0 <= P ? ++D : --D) lt.push(t.readUInt16());
          return lt;
        })(), o = (this.length - t.pos + this.offset) / 2, u = (function() {
          var D, lt;
          for (lt = [], c = D = 0; 0 <= o ? D < o : D > o; c = 0 <= o ? ++D : --D) lt.push(t.readUInt16());
          return lt;
        })(), c = S = 0, J = s.length; S < J; c = ++S) for (M = s[c], i = Y = B = O[c]; B <= M ? Y <= M : Y >= M; i = B <= M ? ++Y : --Y) m[c] === 0 ? f = i + d[c] : (f = u[m[c] / 2 + (i - B) - (P - c)] || 0) !== 0 && (f += d[c]), this.codeMap[i] = 65535 & f;
    }
    t.pos = A;
  }
  return n.encode = function(t, e) {
    var i, o, s, f, u, c, d, m, A, P, p, B, O, M, S, Y, J, D, lt, yt, mt, tt, z, et, N, E, q, U, rt, ct, pt, nt, ft, At, xt, x, j, R, V, $, Q, it, at, dt, _t, St;
    switch (U = new Jr(), f = Object.keys(t).sort(function(kt, zt) {
      return kt - zt;
    }), e) {
      case "macroman":
        for (O = 0, M = (function() {
          var kt = [];
          for (B = 0; B < 256; ++B) kt.push(0);
          return kt;
        })(), Y = { 0: 0 }, s = {}, rt = 0, ft = f.length; rt < ft; rt++) Y[at = t[o = f[rt]]] == null && (Y[at] = ++O), s[o] = { old: t[o], new: Y[t[o]] }, M[o] = Y[t[o]];
        return U.writeUInt16(1), U.writeUInt16(0), U.writeUInt32(12), U.writeUInt16(0), U.writeUInt16(262), U.writeUInt16(0), U.write(M), { charMap: s, subtable: U.data, maxGlyphID: O + 1 };
      case "unicode":
        for (E = [], A = [], J = 0, Y = {}, i = {}, S = d = null, ct = 0, At = f.length; ct < At; ct++) Y[lt = t[o = f[ct]]] == null && (Y[lt] = ++J), i[o] = { old: lt, new: Y[lt] }, u = Y[lt] - o, S != null && u === d || (S && A.push(S), E.push(o), d = u), S = o;
        for (S && A.push(S), A.push(65535), E.push(65535), et = 2 * (z = E.length), tt = 2 * Math.pow(Math.log(z) / Math.LN2, 2), P = Math.log(tt / 2) / Math.LN2, mt = 2 * z - tt, c = [], yt = [], p = [], B = pt = 0, xt = E.length; pt < xt; B = ++pt) {
          if (N = E[B], m = A[B], N === 65535) {
            c.push(0), yt.push(0);
            break;
          }
          if (N - (q = i[N].new) >= 32768) for (c.push(0), yt.push(2 * (p.length + z - B)), o = nt = N; N <= m ? nt <= m : nt >= m; o = N <= m ? ++nt : --nt) p.push(i[o].new);
          else c.push(q - N), yt.push(0);
        }
        for (U.writeUInt16(3), U.writeUInt16(1), U.writeUInt32(12), U.writeUInt16(4), U.writeUInt16(16 + 8 * z + 2 * p.length), U.writeUInt16(0), U.writeUInt16(et), U.writeUInt16(tt), U.writeUInt16(P), U.writeUInt16(mt), Q = 0, x = A.length; Q < x; Q++) o = A[Q], U.writeUInt16(o);
        for (U.writeUInt16(0), it = 0, j = E.length; it < j; it++) o = E[it], U.writeUInt16(o);
        for (dt = 0, R = c.length; dt < R; dt++) u = c[dt], U.writeUInt16(u);
        for (_t = 0, V = yt.length; _t < V; _t++) D = yt[_t], U.writeUInt16(D);
        for (St = 0, $ = p.length; St < $; St++) O = p[St], U.writeUInt16(O);
        return { charMap: i, subtable: U.data, maxGlyphID: J + 1 };
    }
  }, n;
})(), oh = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "cmap", n.prototype.parse = function(t) {
    var e, i, o;
    for (t.pos = this.offset, this.version = t.readUInt16(), o = t.readUInt16(), this.tables = [], this.unicode = null, i = 0; 0 <= o ? i < o : i > o; i = 0 <= o ? ++i : --i) e = new Nu(t, this.offset), this.tables.push(e), e.isUnicode && this.unicode == null && (this.unicode = e);
    return !0;
  }, n.encode = function(t, e) {
    var i, o;
    return e == null && (e = "macroman"), i = Nu.encode(t, e), (o = new Jr()).writeUInt16(0), o.writeUInt16(1), i.table = o.data.concat(i.subtable), i;
  }, n;
})(), g1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "hhea", n.prototype.parse = function(t) {
    return t.pos = this.offset, this.version = t.readInt(), this.ascender = t.readShort(), this.decender = t.readShort(), this.lineGap = t.readShort(), this.advanceWidthMax = t.readShort(), this.minLeftSideBearing = t.readShort(), this.minRightSideBearing = t.readShort(), this.xMaxExtent = t.readShort(), this.caretSlopeRise = t.readShort(), this.caretSlopeRun = t.readShort(), this.caretOffset = t.readShort(), t.pos += 8, this.metricDataFormat = t.readShort(), this.numberOfMetrics = t.readUInt16();
  }, n;
})(), m1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "OS/2", n.prototype.parse = function(t) {
    if (t.pos = this.offset, this.version = t.readUInt16(), this.averageCharWidth = t.readShort(), this.weightClass = t.readUInt16(), this.widthClass = t.readUInt16(), this.type = t.readShort(), this.ySubscriptXSize = t.readShort(), this.ySubscriptYSize = t.readShort(), this.ySubscriptXOffset = t.readShort(), this.ySubscriptYOffset = t.readShort(), this.ySuperscriptXSize = t.readShort(), this.ySuperscriptYSize = t.readShort(), this.ySuperscriptXOffset = t.readShort(), this.ySuperscriptYOffset = t.readShort(), this.yStrikeoutSize = t.readShort(), this.yStrikeoutPosition = t.readShort(), this.familyClass = t.readShort(), this.panose = (function() {
      var e, i;
      for (i = [], e = 0; e < 10; ++e) i.push(t.readByte());
      return i;
    })(), this.charRange = (function() {
      var e, i;
      for (i = [], e = 0; e < 4; ++e) i.push(t.readInt());
      return i;
    })(), this.vendorID = t.readString(4), this.selection = t.readShort(), this.firstCharIndex = t.readShort(), this.lastCharIndex = t.readShort(), this.version > 0 && (this.ascent = t.readShort(), this.descent = t.readShort(), this.lineGap = t.readShort(), this.winAscent = t.readShort(), this.winDescent = t.readShort(), this.codePageRange = (function() {
      var e, i;
      for (i = [], e = 0; e < 2; e = ++e) i.push(t.readInt());
      return i;
    })(), this.version > 1)) return this.xHeight = t.readShort(), this.capHeight = t.readShort(), this.defaultChar = t.readShort(), this.breakChar = t.readShort(), this.maxContext = t.readShort();
  }, n;
})(), b1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "post", n.prototype.parse = function(t) {
    var e, i, o;
    switch (t.pos = this.offset, this.format = t.readInt(), this.italicAngle = t.readInt(), this.underlinePosition = t.readShort(), this.underlineThickness = t.readShort(), this.isFixedPitch = t.readInt(), this.minMemType42 = t.readInt(), this.maxMemType42 = t.readInt(), this.minMemType1 = t.readInt(), this.maxMemType1 = t.readInt(), this.format) {
      case 65536:
      case 196608:
        break;
      case 131072:
        var s;
        for (i = t.readUInt16(), this.glyphNameIndex = [], s = 0; 0 <= i ? s < i : s > i; s = 0 <= i ? ++s : --s) this.glyphNameIndex.push(t.readUInt16());
        for (this.names = [], o = []; t.pos < this.offset + this.length; ) e = t.readByte(), o.push(this.names.push(t.readString(e)));
        return o;
      case 151552:
        return i = t.readUInt16(), this.offsets = t.read(i);
      case 262144:
        return this.map = (function() {
          var f, u, c;
          for (c = [], s = f = 0, u = this.file.maxp.numGlyphs; 0 <= u ? f < u : f > u; s = 0 <= u ? ++f : --f) c.push(t.readUInt32());
          return c;
        }).call(this);
    }
  }, n;
})(), v1 = function(n, t) {
  this.raw = n, this.length = n.length, this.platformID = t.platformID, this.encodingID = t.encodingID, this.languageID = t.languageID;
}, w1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "name", n.prototype.parse = function(t) {
    var e, i, o, s, f, u, c, d, m, A, P;
    for (t.pos = this.offset, t.readShort(), e = t.readShort(), u = t.readShort(), i = [], s = 0; 0 <= e ? s < e : s > e; s = 0 <= e ? ++s : --s) i.push({ platformID: t.readShort(), encodingID: t.readShort(), languageID: t.readShort(), nameID: t.readShort(), length: t.readShort(), offset: this.offset + u + t.readShort() });
    for (c = {}, s = m = 0, A = i.length; m < A; s = ++m) o = i[s], t.pos = o.offset, d = t.readString(o.length), f = new v1(d, o), c[P = o.nameID] == null && (c[P] = []), c[o.nameID].push(f);
    this.strings = c, this.copyright = c[0], this.fontFamily = c[1], this.fontSubfamily = c[2], this.uniqueSubfamily = c[3], this.fontName = c[4], this.version = c[5];
    try {
      this.postscriptName = c[6][0].raw.replace(/[\x00-\x19\x80-\xff]/g, "");
    } catch {
      this.postscriptName = c[4][0].raw.replace(/[\x00-\x19\x80-\xff]/g, "");
    }
    return this.trademark = c[7], this.manufacturer = c[8], this.designer = c[9], this.description = c[10], this.vendorUrl = c[11], this.designerUrl = c[12], this.license = c[13], this.licenseUrl = c[14], this.preferredFamily = c[15], this.preferredSubfamily = c[17], this.compatibleFull = c[18], this.sampleText = c[19];
  }, n;
})(), y1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "maxp", n.prototype.parse = function(t) {
    return t.pos = this.offset, this.version = t.readInt(), this.numGlyphs = t.readUInt16(), this.maxPoints = t.readUInt16(), this.maxContours = t.readUInt16(), this.maxCompositePoints = t.readUInt16(), this.maxComponentContours = t.readUInt16(), this.maxZones = t.readUInt16(), this.maxTwilightPoints = t.readUInt16(), this.maxStorage = t.readUInt16(), this.maxFunctionDefs = t.readUInt16(), this.maxInstructionDefs = t.readUInt16(), this.maxStackElements = t.readUInt16(), this.maxSizeOfInstructions = t.readUInt16(), this.maxComponentElements = t.readUInt16(), this.maxComponentDepth = t.readUInt16();
  }, n;
})(), x1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "hmtx", n.prototype.parse = function(t) {
    var e, i, o, s, f, u, c;
    for (t.pos = this.offset, this.metrics = [], e = 0, u = this.file.hhea.numberOfMetrics; 0 <= u ? e < u : e > u; e = 0 <= u ? ++e : --e) this.metrics.push({ advance: t.readUInt16(), lsb: t.readInt16() });
    for (o = this.file.maxp.numGlyphs - this.file.hhea.numberOfMetrics, this.leftSideBearings = (function() {
      var d, m;
      for (m = [], e = d = 0; 0 <= o ? d < o : d > o; e = 0 <= o ? ++d : --d) m.push(t.readInt16());
      return m;
    })(), this.widths = (function() {
      var d, m, A, P;
      for (P = [], d = 0, m = (A = this.metrics).length; d < m; d++) s = A[d], P.push(s.advance);
      return P;
    }).call(this), i = this.widths[this.widths.length - 1], c = [], e = f = 0; 0 <= o ? f < o : f > o; e = 0 <= o ? ++f : --f) c.push(this.widths.push(i));
    return c;
  }, n.prototype.forGlyph = function(t) {
    return t in this.metrics ? this.metrics[t] : { advance: this.metrics[this.metrics.length - 1].advance, lsb: this.leftSideBearings[t - this.metrics.length] };
  }, n;
})(), lh = [].slice, _1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "glyf", n.prototype.parse = function() {
    return this.cache = {};
  }, n.prototype.glyphFor = function(t) {
    var e, i, o, s, f, u, c, d, m, A;
    return t in this.cache ? this.cache[t] : (s = this.file.loca, e = this.file.contents, i = s.indexOf(t), (o = s.lengthOf(t)) === 0 ? this.cache[t] = null : (e.pos = this.offset + i, f = (u = new Jr(e.read(o))).readShort(), d = u.readShort(), A = u.readShort(), c = u.readShort(), m = u.readShort(), this.cache[t] = f === -1 ? new N1(u, d, A, c, m) : new A1(u, f, d, A, c, m), this.cache[t]));
  }, n.prototype.encode = function(t, e, i) {
    var o, s, f, u, c;
    for (f = [], s = [], u = 0, c = e.length; u < c; u++) o = t[e[u]], s.push(f.length), o && (f = f.concat(o.encode(i)));
    return s.push(f.length), { table: f, offsets: s };
  }, n;
})(), A1 = (function() {
  function n(t, e, i, o, s, f) {
    this.raw = t, this.numberOfContours = e, this.xMin = i, this.yMin = o, this.xMax = s, this.yMax = f, this.compound = !1;
  }
  return n.prototype.encode = function() {
    return this.raw.data;
  }, n;
})(), N1 = (function() {
  function n(t, e, i, o, s) {
    var f, u;
    for (this.raw = t, this.xMin = e, this.yMin = i, this.xMax = o, this.yMax = s, this.compound = !0, this.glyphIDs = [], this.glyphOffsets = [], f = this.raw; u = f.readShort(), this.glyphOffsets.push(f.pos), this.glyphIDs.push(f.readUInt16()), 32 & u; ) f.pos += 1 & u ? 4 : 2, 128 & u ? f.pos += 8 : 64 & u ? f.pos += 4 : 8 & u && (f.pos += 2);
  }
  return n.prototype.encode = function() {
    var t, e, i;
    for (e = new Jr(lh.call(this.raw.data)), t = 0, i = this.glyphIDs.length; t < i; ++t) e.pos = this.glyphOffsets[t];
    return e.data;
  }, n;
})(), L1 = (function() {
  function n() {
    return n.__super__.constructor.apply(this, arguments);
  }
  return fr(n, Zn), n.prototype.tag = "loca", n.prototype.parse = function(t) {
    var e, i;
    return t.pos = this.offset, e = this.file.head.indexToLocFormat, this.offsets = e === 0 ? (function() {
      var o, s;
      for (s = [], i = 0, o = this.length; i < o; i += 2) s.push(2 * t.readUInt16());
      return s;
    }).call(this) : (function() {
      var o, s;
      for (s = [], i = 0, o = this.length; i < o; i += 4) s.push(t.readUInt32());
      return s;
    }).call(this);
  }, n.prototype.indexOf = function(t) {
    return this.offsets[t];
  }, n.prototype.lengthOf = function(t) {
    return this.offsets[t + 1] - this.offsets[t];
  }, n.prototype.encode = function(t, e) {
    for (var i = new Uint32Array(this.offsets.length), o = 0, s = 0, f = 0; f < i.length; ++f) if (i[f] = o, s < e.length && e[s] == f) {
      ++s, i[f] = o;
      var u = this.offsets[f], c = this.offsets[f + 1] - u;
      c > 0 && (o += c);
    }
    for (var d = new Array(4 * i.length), m = 0; m < i.length; ++m) d[4 * m + 3] = 255 & i[m], d[4 * m + 2] = (65280 & i[m]) >> 8, d[4 * m + 1] = (16711680 & i[m]) >> 16, d[4 * m] = (4278190080 & i[m]) >> 24;
    return d;
  }, n;
})(), S1 = (function() {
  function n(t) {
    this.font = t, this.subset = {}, this.unicodes = {}, this.next = 33;
  }
  return n.prototype.generateCmap = function() {
    var t, e, i, o, s;
    for (e in o = this.font.cmap.tables[0].codeMap, t = {}, s = this.subset) i = s[e], t[e] = o[i];
    return t;
  }, n.prototype.glyphsFor = function(t) {
    var e, i, o, s, f, u, c;
    for (o = {}, f = 0, u = t.length; f < u; f++) o[s = t[f]] = this.font.glyf.glyphFor(s);
    for (s in e = [], o) (i = o[s]) != null && i.compound && e.push.apply(e, i.glyphIDs);
    if (e.length > 0) for (s in c = this.glyphsFor(e)) i = c[s], o[s] = i;
    return o;
  }, n.prototype.encode = function(t, e) {
    var i, o, s, f, u, c, d, m, A, P, p, B, O, M, S;
    for (o in i = oh.encode(this.generateCmap(), "unicode"), f = this.glyphsFor(t), p = { 0: 0 }, S = i.charMap) p[(c = S[o]).old] = c.new;
    for (B in P = i.maxGlyphID, f) B in p || (p[B] = P++);
    return m = (function(Y) {
      var J, D;
      for (J in D = {}, Y) D[Y[J]] = J;
      return D;
    })(p), A = Object.keys(m).sort(function(Y, J) {
      return Y - J;
    }), O = (function() {
      var Y, J, D;
      for (D = [], Y = 0, J = A.length; Y < J; Y++) u = A[Y], D.push(m[u]);
      return D;
    })(), s = this.font.glyf.encode(f, O, p), d = this.font.loca.encode(s.offsets, O), M = { cmap: this.font.cmap.raw(), glyf: s.table, loca: d, hmtx: this.font.hmtx.raw(), hhea: this.font.hhea.raw(), maxp: this.font.maxp.raw(), post: this.font.post.raw(), name: this.font.name.raw(), head: this.font.head.encode(e) }, this.font.os2.exists && (M["OS/2"] = this.font.os2.raw()), this.font.directory.encode(M);
  }, n;
})();
Mt.API.PDFObject = (function() {
  var n;
  function t() {
  }
  return n = function(e, i) {
    return (Array(i + 1).join("0") + e).slice(-i);
  }, t.convert = function(e) {
    var i, o, s, f;
    if (Array.isArray(e)) return "[" + (function() {
      var u, c, d;
      for (d = [], u = 0, c = e.length; u < c; u++) i = e[u], d.push(t.convert(i));
      return d;
    })().join(" ") + "]";
    if (typeof e == "string") return "/" + e;
    if (e?.isString) return "(" + e + ")";
    if (e instanceof Date) return "(D:" + n(e.getUTCFullYear(), 4) + n(e.getUTCMonth(), 2) + n(e.getUTCDate(), 2) + n(e.getUTCHours(), 2) + n(e.getUTCMinutes(), 2) + n(e.getUTCSeconds(), 2) + "Z)";
    if ({}.toString.call(e) === "[object Object]") {
      for (o in s = ["<<"], e) f = e[o], s.push("/" + o + " " + t.convert(f));
      return s.push(">>"), s.join(`
`);
    }
    return "" + e;
  }, t;
})();
const P1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AcroForm: e1,
  AcroFormAppearance: It,
  AcroFormButton: en,
  AcroFormCheckBox: Na,
  AcroFormChoiceField: mi,
  AcroFormComboBox: vi,
  AcroFormEditBox: _a,
  AcroFormListBox: bi,
  AcroFormPasswordField: La,
  AcroFormPushButton: Aa,
  AcroFormRadioButton: wi,
  AcroFormTextField: Yr,
  GState: Pa,
  ShadingPattern: Vr,
  TilingPattern: gi,
  default: Mt,
  jsPDF: Mt
}, Symbol.toStringTag, { value: "Module" }));
export {
  Mt as E,
  Vr as M,
  Pa as O,
  xe as _,
  P1 as j,
  gi as q
};
