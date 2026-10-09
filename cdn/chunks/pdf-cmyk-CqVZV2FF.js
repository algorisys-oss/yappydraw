import { p as S } from "./__vite-browser-external-BsdCVVos.js";
const m = (r) => {
  let t = "";
  for (let e = 0; e < r.length; e += 32768) t += String.fromCharCode(...r.subarray(e, e + 32768));
  return t;
}, w = (r) => {
  const t = new Uint8Array(r.length);
  for (let e = 0; e < r.length; e++) t[e] = r.charCodeAt(e) & 255;
  return t;
}, F = (r) => {
  const t = new Uint8Array(r.reduce((n, o) => n + o.length, 0));
  let e = 0;
  for (const n of r)
    t.set(n, e), e += n.length;
  return t;
};
class z {
  header;
  /** Object bodies in file order: everything from `N 0 obj` through `endobj\n`. */
  bodies = /* @__PURE__ */ new Map();
  order = [];
  trailer;
  size;
  constructor(t) {
    const e = m(t), n = e.lastIndexOf("startxref");
    if (n < 0) throw new Error("PDF: no startxref");
    const o = parseInt(e.slice(n + 9).trim(), 10);
    if (e.slice(o, o + 4) !== "xref") throw new Error("PDF: startxref does not point at a classic xref table");
    const s = /^xref\s+(\d+)\s+(\d+)\s*\r?\n/.exec(e.slice(o));
    if (!s || s[1] !== "0") throw new Error("PDF: unsupported xref layout");
    const a = parseInt(s[2], 10), i = o + s[0].length, c = [];
    for (let l = 1; l < a; l++) {
      const h = e.slice(i + l * 20, i + l * 20 + 18), f = /^(\d{10}) (\d{5}) ([nf])/.exec(h);
      if (!f) throw new Error(`PDF: bad xref entry ${l}`);
      f[3] === "n" && c.push([l, parseInt(f[1], 10)]);
    }
    const d = e.indexOf("trailer", i + a * 20 - 20);
    if (e.indexOf("xref", i) !== -1 && e.indexOf("xref", i) < d) throw new Error("PDF: multiple xref sections");
    this.trailer = e.slice(e.indexOf("<<", d), e.lastIndexOf(">>", n) + 2), this.size = a, c.sort((l, h) => l[1] - h[1]), this.header = t.subarray(0, c[0][1]), c.forEach(([l, h], f) => {
      const p = f + 1 < c.length ? c[f + 1][1] : o;
      if (!e.startsWith(`${l} 0 obj`, h)) throw new Error(`PDF: object ${l} not at its xref offset`);
      this.bodies.set(l, t.subarray(h, p)), this.order.push(l);
    });
  }
  objectNumbers() {
    return [...this.order];
  }
  get(t) {
    const e = this.bodies.get(t);
    if (!e) return null;
    const n = m(e), o = n.indexOf("obj") + 3, s = n.indexOf("stream", o);
    if (s === -1 || n.lastIndexOf("endobj") < s) return { num: t, dict: n.slice(o, n.lastIndexOf("endobj")).trim(), stream: null };
    let a = s + 6;
    n[a] === "\r" && a++, n[a] === `
` && a++;
    const i = /\/Length (\d+)/.exec(n.slice(o, s)), c = i ? a + parseInt(i[1], 10) : n.lastIndexOf("endstream");
    return { num: t, dict: n.slice(o, s).trim(), stream: e.subarray(a, c) };
  }
  /** Replace an object. `stream` given → `/Length` is set from it (any old one is dropped). */
  set(t, e, n = null) {
    this.bodies.has(t) || this.order.push(t), this.size = Math.max(this.size, t + 1);
    let o = e.trim();
    n ? (o = o.replace(/\/Length \d+\s*/g, ""), o = o.replace(/>>\s*$/, `/Length ${n.length}
>>`), this.bodies.set(t, F([w(`${t} 0 obj
${o}
stream
`), n, w(`
endstream
endobj
`)]))) : this.bodies.set(t, w(`${t} 0 obj
${o}
endobj
`));
  }
  /** Drop an object; its xref entry becomes free. The caller removes any references to it. */
  remove(t) {
    this.bodies.delete(t), this.order = this.order.filter((e) => e !== t);
  }
  /** Append a new object and return its number. */
  add(t, e = null) {
    const n = this.size;
    return this.set(n, t, e), n;
  }
  /** The trailer dictionary text (`<< /Size … /Root … >>`), editable. */
  getTrailer() {
    return this.trailer;
  }
  setTrailer(t) {
    this.trailer = t;
  }
  /** Replace the `%PDF-x.y` version in the header. */
  setVersion(t) {
    const e = m(this.header).replace(/^%PDF-\d\.\d/, `%PDF-${t}`);
    this.header = w(e);
  }
  /** The object number the trailer's `/Root` (catalog) or `/Info` points at. */
  ref(t) {
    const e = new RegExp(`/${t} (\\d+) 0 R`).exec(this.trailer);
    return e ? parseInt(e[1], 10) : null;
  }
  toBytes() {
    const t = [this.header], e = /* @__PURE__ */ new Map();
    let n = this.header.length;
    for (const a of this.order) {
      const i = this.bodies.get(a);
      e.set(a, n), t.push(i), n += i.length;
    }
    let o = `xref
0 ${this.size}
0000000000 65535 f 
`;
    for (let a = 1; a < this.size; a++) {
      const i = e.get(a);
      o += i === void 0 ? `0000000000 65535 f 
` : `${String(i).padStart(10, "0")} 00000 n 
`;
    }
    const s = this.trailer.replace(/\/Size \d+/, `/Size ${this.size}`);
    return t.push(w(`${o}trailer
${s}
startxref
${n}
%%EOF
`)), F(t);
  }
}
const M = async (r, t) => new Uint8Array(await new Response(new Blob([r]).stream().pipeThrough(t)).arrayBuffer()), T = (r) => M(r, new DecompressionStream("deflate")), C = (r) => M(r, new CompressionStream("deflate")), v = (r) => {
  const t = m(r).replace(/[^0-9a-fA-F]/g, ""), e = new Uint8Array(t.length >> 1);
  for (let n = 0; n < e.length; n++) e[n] = parseInt(t.substr(n * 2, 2), 16);
  return e;
};
async function R(r, t) {
  const e = /\/Filter\s*(\[[^\]]*\]|\/\w+)/.exec(r), n = e ? e[1].match(/\/\w+/g) ?? [] : [];
  let o = t;
  for (const s of n)
    if (s === "/FlateDecode") o = await T(o);
    else if (s === "/ASCIIHexDecode") o = v(o);
    else throw new Error(`PDF: unsupported filter ${s}`);
  return o;
}
const y = (r) => "#" + r.map((t) => t.toString(16).padStart(2, "0")).join("");
function U(r) {
  const t = /* @__PURE__ */ new Map();
  for (const e of r) {
    const n = e.cmyk && S(e.color);
    n && !t.has(y(n)) && t.set(y(n), e.cmyk);
  }
  return t;
}
const $ = (r, t, e) => t.get(y(e)) ?? r.rgbToCmyk(e);
function A(r) {
  const t = r.filter((e) => typeof e == "number");
  return r.length >= 4 && typeof r[3] == "number" ? null : typeof r[0] == "string" ? S(r[0]) : t.length >= 3 && typeof r[3] != "number" ? [t[0], t[1], t[2]].map((e) => Math.round(e)) : t.length === 1 ? [t[0], t[0], t[0]].map((e) => Math.round(e)) : null;
}
function B(r) {
  const t = /* @__PURE__ */ new Map(), e = /* @__PURE__ */ new Map();
  for (const n of r) {
    const o = n.spot?.name && n.cmyk ? S(n.color) : null;
    if (!o) continue;
    const s = n.spot.name.trim();
    let a = e.get(s);
    a || (a = { name: s, cmyk: n.cmyk, res: `YDSpot${e.size}` }, e.set(s, a)), t.has(y(o)) || t.set(y(o), a);
  }
  return t;
}
function I(r) {
  let t = "";
  for (const e of new TextEncoder().encode(r)) {
    const n = String.fromCharCode(e);
    t += e < 33 || e > 126 || "()<>[]{}/%#".includes(n) ? "#" + e.toString(16).padStart(2, "0") : n;
  }
  return t;
}
const j = (r) => `[/Separation /${I(r.name)} /DeviceCMYK << /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [${r.cmyk.map((t) => +(t / 100).toFixed(4)).join(" ")}] /N 1 >>]`;
function K(r, t, e, n = /* @__PURE__ */ new Map(), o) {
  const s = { setFillColor: "cs 1 scn", setDrawColor: "CS 1 SCN" }, a = r.internal.write;
  for (const i of ["setFillColor", "setDrawColor", "setTextColor"]) {
    const c = r[i].bind(r);
    r[i] = (...d) => {
      const l = A(d);
      if (!l) return c(...d);
      const h = i !== "setTextColor" ? n.get(y(l)) : void 0;
      if (h) {
        o?.add(h);
        const [g, , O] = s[i].split(" ");
        return a(`/${h.res} ${g} 1 ${O}`), r;
      }
      const [f, p, u, b] = $(t, e, l);
      return c(f / 100, p / 100, u / 100, b / 100);
    };
  }
}
const D = [89, 68, 67, 75], x = "YDCMYK", k = /* @__PURE__ */ new Map(), P = (r) => {
  let t = 2166136261;
  for (let e = 0; e < r.length; e++)
    t ^= r.charCodeAt(e), t = Math.imul(t, 16777619);
  return `${(t >>> 0).toString(36)}-${r.length}`;
}, E = (r) => {
  const t = /^data:[^;,]*(;base64)?,(.*)$/s.exec(r);
  if (!t) return null;
  try {
    return t[1] ? atob(t[2]) : decodeURIComponent(t[2]);
  } catch {
    return null;
  }
};
async function N(r, t) {
  const e = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set();
  return r.querySelectorAll("image").forEach((o) => {
    const s = o.getAttribute("href") ?? o.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    s && s.startsWith("data:image/") && !s.startsWith("data:image/svg") && n.add(s);
  }), await Promise.all([...n].map(async (o) => {
    const s = E(o);
    if (!s) return;
    const a = P(s);
    if (e.has(a)) return;
    const i = new Image();
    i.src = o, await i.decode();
    const c = document.createElement("canvas");
    c.width = i.naturalWidth, c.height = i.naturalHeight;
    const d = c.getContext("2d");
    if (!d || !c.width || !c.height) return;
    d.drawImage(i, 0, 0);
    const { data: l } = d.getImageData(0, 0, c.width, c.height), { cmyk: h, alpha: f } = t.imageToCmyk(l), p = new Uint8Array(h.length);
    for (let u = 0; u < h.length; u++) p[u] = 255 - h[u];
    e.set(a, {
      width: c.width,
      height: c.height,
      data: m(await C(p)),
      sMask: f ? m(await C(f)) : null
    });
  })), e;
}
function Y(r, t, e, n) {
  {
    const s = function(a, i, c) {
      const d = m(a.subarray(D.length)), l = k.get(d);
      if (!l) throw new Error("CMYK image not prepared");
      return {
        alias: c,
        index: i,
        data: l.data,
        width: l.width,
        height: l.height,
        colorSpace: "DeviceCMYK",
        bitsPerComponent: 8,
        // Already deflated: jsPDF strips the document filter for images, so without this
        // every converted bitmap would be stored raw (4 bytes a pixel).
        filter: "FlateDecode",
        // jsPDF writes the SMask's DecodeParms from `predictor` whenever `filter` is set;
        // 1 is "no prediction", which is what the data is.
        predictor: 1,
        ...l.sMask ? { sMask: l.sMask } : {}
      };
    };
    t[`process${x}`] = s, r[`process${x}`] = s;
  }
  const o = r.addImage.bind(r);
  r.addImage = (...s) => {
    const a = s[0], i = typeof a == "string" ? E(a) : null, c = i ? P(i) : null, d = c ? e.get(c) : void 0;
    if (!d || !c)
      return n(), o(...s);
    k.set(c, d);
    const l = new Uint8Array([...D, ...w(c)]), [, , h, f, p, u] = s;
    return o(l, x, h, f, p, u, `cmyk-${c}`);
  };
}
async function L(r, t, e, n = []) {
  const o = new z(r);
  let s = W(o, [...n]);
  for (const a of o.objectNumbers()) {
    const i = o.get(a);
    if (!i || i.stream || !/\/ShadingType\s+\d/.test(i.dict) || !/\/ColorSpace\s*\/DeviceRGB/.test(i.dict)) continue;
    const c = /\/Function\s+(\d+)\s+0\s+R/.exec(i.dict), d = c ? o.get(parseInt(c[1], 10)) : null;
    if (!d || !d.stream || !/\/FunctionType\s+0/.test(d.dict)) throw new Error(`PDF: shading ${a} has no sampled function`);
    const l = await R(d.dict, d.stream), h = Math.floor(l.length / 3), f = new Uint8Array(h * 4);
    for (let u = 0; u < h; u++) {
      const b = $(t, e, [l[u * 3], l[u * 3 + 1], l[u * 3 + 2]]);
      for (let g = 0; g < 4; g++) f[u * 4 + g] = Math.round(b[g] * 2.55);
    }
    const p = /\/Size\s*\[[^\]]*\]/.exec(d.dict)?.[0] ?? `/Size [${h}]`;
    o.set(
      d.num,
      `<<
/FunctionType 0
/Domain [0.0 1.0]
${p}
/BitsPerSample 8
/Range [0 1 0 1 0 1 0 1]
/Decode [0 1 0 1 0 1 0 1]
/Filter /FlateDecode
>>`,
      await C(f)
    ), o.set(a, i.dict.replace(/\/ColorSpace\s*\/DeviceRGB/, "/ColorSpace /DeviceCMYK")), s = !0;
  }
  return s ? o.toBytes() : r;
}
function W(r, t) {
  if (t.length === 0) return !1;
  const e = t.map((o) => `/${o.res} ${j(o)}`).join(`
`);
  let n = 0;
  for (const o of r.objectNumbers()) {
    const s = r.get(o);
    if (!(!s || s.stream || !/^<<\s*\/ProcSet/.test(s.dict))) {
      if (/\/ColorSpace/.test(s.dict)) throw new Error(`PDF: resource dictionary ${o} already has a /ColorSpace`);
      r.set(o, s.dict.replace(/>>\s*$/, `/ColorSpace <<
${e}
>>
>>`)), n++;
    }
  }
  if (n === 0) throw new Error("PDF: no resource dictionary to declare the spot inks in");
  return !0;
}
const H = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  cmykFor: $,
  convertShadingsToCmyk: L,
  exactCmykFromSwatches: U,
  installCmykColors: K,
  installCmykImages: Y,
  pdfName: I,
  prepareCmykImages: N,
  rgbFromColorArgs: A,
  separationArray: j,
  spotsFromSwatches: B
}, Symbol.toStringTag, { value: "Module" }));
export {
  z as P,
  Y as a,
  R as b,
  L as c,
  C as d,
  H as e,
  K as i,
  N as p,
  m as t
};
