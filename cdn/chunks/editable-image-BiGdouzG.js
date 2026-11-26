import { q as S, ap as E, aq as b, ar as N, as as C, at as v } from "./index-wrSYjMGC.js";
const U = "https://yappydraw.com/ns/scene", x = /<metadata>\s*<yappy:scene\b[^>]*>([\s\S]*?)<\/yappy:scene>\s*<\/metadata>/, D = /<yappy:scene\b[^>]*>([\s\S]*?)<\/yappy:scene>/, s = "yappy-scene", A = [137, 80, 78, 71, 13, 10, 26, 10];
function g(t) {
  let n = "";
  for (let r = 0; r < t.length; r += 32768)
    n += String.fromCharCode.apply(null, t.subarray(r, r + 32768));
  return btoa(n);
}
function y(t) {
  try {
    const n = atob(t.replace(/\s+/g, "")), e = new Uint8Array(n.length);
    for (let r = 0; r < n.length; r++) e[r] = n.charCodeAt(r);
    return e;
  } catch {
    return null;
  }
}
function I(t, n) {
  const e = t.replace(x, ""), r = e.lastIndexOf("</svg>");
  if (r < 0) throw new Error("Not an SVG document (no closing </svg>).");
  const a = `<metadata><yappy:scene xmlns:yappy="${U}" encoding="gzip+base64">` + g(n) + "</yappy:scene></metadata>";
  return e.slice(0, r) + a + e.slice(r);
}
function P(t) {
  const n = D.exec(t);
  return n ? y(n[1]) : null;
}
let i;
function G(t) {
  if (!i) {
    i = new Uint32Array(256);
    for (let e = 0; e < 256; e++) {
      let r = e;
      for (let a = 0; a < 8; a++) r = r & 1 ? 3988292384 ^ r >>> 1 : r >>> 1;
      i[e] = r >>> 0;
    }
  }
  let n = 4294967295;
  for (let e = 0; e < t.length; e++) n = i[(n ^ t[e]) & 255] ^ n >>> 8;
  return (n ^ 4294967295) >>> 0;
}
function l(t) {
  return t.length >= 8 && A.every((n, e) => t[e] === n);
}
function* w(t) {
  const n = new DataView(t.buffer, t.byteOffset, t.byteLength);
  let e = 8;
  for (; e + 12 <= t.length; ) {
    const r = n.getUint32(e), a = e + 12 + r;
    if (a > t.length) return;
    const o = String.fromCharCode(t[e + 4], t[e + 5], t[e + 6], t[e + 7]);
    if (yield { type: o, start: e, end: a, data: t.subarray(e + 8, e + 8 + r) }, o === "IEND") return;
    e = a;
  }
}
const h = (t) => Uint8Array.from(t, (n) => n.charCodeAt(0) & 255), m = (t) => {
  if (t.type !== "tEXt" || t.data.length <= s.length) return !1;
  for (let n = 0; n < s.length; n++) if (t.data[n] !== s.charCodeAt(n)) return !1;
  return t.data[s.length] === 0;
};
function _(t, n) {
  if (!l(t)) throw new Error("Not a PNG image.");
  const e = [t.subarray(0, 8)];
  let r;
  for (const c of w(t)) {
    if (c.type === "IEND") {
      r = c;
      break;
    }
    m(c) || e.push(t.subarray(c.start, c.end));
  }
  if (!r) throw new Error("PNG has no IEND chunk.");
  const a = h(`${s}\0${g(n)}`), o = new Uint8Array(12 + a.length), u = new DataView(o.buffer);
  u.setUint32(0, a.length), o.set(h("tEXt"), 4), o.set(a, 8), u.setUint32(8 + a.length, G(o.subarray(4, 8 + a.length))), e.push(o, t.subarray(r.start, r.end));
  const f = new Uint8Array(e.reduce((c, p) => c + p.length, 0));
  let d = 0;
  for (const c of e)
    f.set(c, d), d += c.length;
  return f;
}
function k(t) {
  if (!l(t)) return null;
  for (const n of w(t))
    if (m(n)) {
      let e = "";
      for (let r = s.length + 1; r < n.data.length; r++) e += String.fromCharCode(n.data[r]);
      return y(e);
    }
  return null;
}
function B(t) {
  return l(t) ? k(t) : t.length === 0 ? null : P(new TextDecoder().decode(t));
}
async function R(t = "Untitled") {
  return C(JSON.stringify(v(t)));
}
async function K(t, n = "Untitled") {
  const e = await R(n);
  if (t === "svg") {
    const o = b(!1) ?? '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
    return new TextEncoder().encode(I(o, e));
  }
  let r = await N(2);
  r || (r = document.createElement("canvas"), r.width = r.height = 1);
  const a = await new Promise((o) => r.toBlob(o, "image/png"));
  if (!a) throw new Error("Could not render the PNG.");
  return _(new Uint8Array(await a.arrayBuffer()), e);
}
async function O(t) {
  const n = B(t);
  return n ? (S(await E(n)), !0) : !1;
}
export {
  R as currentDrawingBytes,
  O as openEditableImage,
  K as renderEditableImage
};
