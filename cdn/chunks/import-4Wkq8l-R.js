import { u as Wo, a as Vo, b as Yo, c as Go, i as qo } from "./browser-BNJ-qm4Y.js";
import { e as Zo, s as qn, f as Ko } from "./anim-map-D7T1mIAM.js";
import { aF as We, aY as Jo, aZ as Zn, U as Qo, a_ as ti, a$ as ei, b0 as ni, b1 as si, b2 as oi, N as ii, q as ri, K as li } from "./index-DRPGudNX.js";
import { E as vt, i as $n, c as ai } from "./custgeom-CQJbz5YX.js";
const pe = (t, e) => `<a:ln w="${t}" cmpd="sng"><a:solidFill><a:schemeClr val="${e}"/></a:solidFill></a:ln>`, $e = "<a:ln><a:noFill/></a:ln>", jt = (t, e = "") => `<a:fill><a:solidFill><a:schemeClr val="${t}">${e}</a:schemeClr></a:solidFill></a:fill>`, se = (t, e = !1) => `<a:tcTxStyle${e ? ' b="on"' : ""}><a:fontRef idx="minor"><a:prstClr val="black"/></a:fontRef><a:schemeClr val="${t}"/></a:tcTxStyle>`, Gt = (t) => `<a:tcBdr>${Object.entries(t).map(([e, n]) => `<a:${e}>${n}</a:${e}>`).join("")}</a:tcBdr>`;
function ue(t, e) {
  const n = pe(12700, "lt1"), s = `${se("lt1", !0)}<a:tcStyle><a:tcBdr/>${jt(e)}</a:tcStyle>`;
  return `<a:tblStyle styleId="${t}" styleName="Medium Style 2"><a:wholeTbl>${se("dk1")}<a:tcStyle>${Gt({ left: n, right: n, top: n, bottom: n, insideH: n, insideV: n })}${jt(e, '<a:tint val="20000"/>')}</a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${jt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${jt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1V><a:band2V><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2V><a:lastCol>${s}</a:lastCol><a:firstCol>${s}</a:firstCol><a:lastRow>${se("lt1", !0)}<a:tcStyle>${Gt({ top: pe(38100, "lt1") })}${jt(e)}</a:tcStyle></a:lastRow><a:firstRow>${se("lt1", !0)}<a:tcStyle>${Gt({ bottom: pe(38100, "lt1") })}${jt(e)}</a:tcStyle></a:firstRow></a:tblStyle>`;
}
function Oe(t, e) {
  const n = pe(12700, e);
  return `<a:tblStyle styleId="${t}" styleName="Light Style 1"><a:wholeTbl>${se("tx1")}<a:tcStyle>${Gt({ left: $e, right: $e, top: n, bottom: n, insideH: $e, insideV: $e })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${jt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${jt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1V><a:lastCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:lastCol><a:firstCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:firstCol><a:lastRow><a:tcTxStyle b="on"/><a:tcStyle>${Gt({ top: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:lastRow><a:firstRow><a:tcTxStyle b="on"/><a:tcStyle>${Gt({ bottom: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:firstRow></a:tblStyle>`;
}
function ci(t) {
  const e = pe(12700, "tx1");
  return `<a:tblStyle styleId="${t}" styleName="No Style, Table Grid"><a:wholeTbl>${se("tx1")}<a:tcStyle>${Gt({ left: e, right: e, top: e, bottom: e, insideH: e, insideV: e })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle>`;
}
const ui = {
  "{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}": (t) => ue(t, "dk1"),
  "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}": (t) => ue(t, "accent1"),
  "{21E4AEA4-8DFA-4A89-87EB-49C32662AFE0}": (t) => ue(t, "accent2"),
  "{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}": (t) => ue(t, "accent3"),
  "{7DF18680-E054-41AD-8BC1-D1AEF772440D}": (t) => ue(t, "accent5"),
  "{9D7B26C5-4107-4FEC-AEDC-1716B250A1EF}": (t) => Oe(t, "tx1"),
  "{3B4B98B0-60AC-42C2-AFA5-B58CD77FA1E5}": (t) => Oe(t, "accent1"),
  "{0E3FDE45-AF77-4B5C-9715-49D594BDF05E}": (t) => Oe(t, "accent2"),
  "{C083E6E3-FA7D-4D7B-A595-EF9225AFEA82}": (t) => Oe(t, "accent3"),
  "{5940675A-B579-460E-94D1-54222C63F5DA}": ci
}, hi = "http://schemas.openxmlformats.org/drawingml/2006/main";
function fi(t) {
  const e = ui[t.toUpperCase()];
  return e ? `<a:tblStyleLst xmlns:a="${hi}">${e(t.toUpperCase())}</a:tblStyleLst>` : null;
}
const di = 1e4, pi = 1e5, Qs = 6e4, me = (t) => t / Qs * (Math.PI / 180);
function to(t, e, n, s = {}) {
  const o = /* @__PURE__ */ new Map(), i = Math.max(0, e), r = Math.max(0, n), l = Math.min(i, r), a = Math.max(i, r), c = {
    w: i,
    h: r,
    l: 0,
    t: 0,
    r: i,
    b: r,
    hc: i / 2,
    vc: r / 2,
    ss: l,
    ls: a,
    cd2: 108e5,
    cd4: 54e5,
    cd8: 27e5,
    "3cd4": 162e5,
    "3cd8": 81e5,
    "5cd8": 135e5,
    "7cd8": 189e5
  };
  for (const [d, m] of Object.entries(c)) o.set(d, m);
  for (const d of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    o.set(`wd${d}`, i / d), o.set(`hd${d}`, r / d), o.set(`ssd${d}`, l / d);
  const u = (d) => {
    const m = o.get(d);
    if (m !== void 0) return m;
    const f = /^(wd|hd|ssd)(\d+)$/.exec(d);
    if (f) {
      const g = f[1] === "wd" ? i : f[1] === "hd" ? r : l, b = Number(f[2]);
      return b ? g / b : 0;
    }
    const p = Number(d);
    return Number.isFinite(p) ? p : 0;
  }, h = (d, m) => {
    o.size > di || o.set(d, mi(m, u));
  };
  for (const [d, m] of t.av ?? []) h(d, s[d] ?? m);
  for (const [d, m] of Object.entries(s)) o.has(d) || h(d, m);
  for (const [d, m] of t.gd ?? []) h(d, m);
  return o;
}
function mi(t, e) {
  const n = String(t || "").trim().split(/\s+/), s = n[0], [o, i, r] = n.slice(1).map(e);
  let l;
  switch (s) {
    case "val":
      l = o;
      break;
    case "*/":
      l = r ? o * i / r : 0;
      break;
    case "+-":
      l = o + i - r;
      break;
    case "+/":
      l = r ? (o + i) / r : 0;
      break;
    case "?:":
      l = o > 0 ? i : r;
      break;
    case "abs":
      l = Math.abs(o);
      break;
    case "at2":
      l = Math.atan2(i, o) * 180 / Math.PI * Qs;
      break;
    case "cat2":
      l = o * Math.cos(Math.atan2(r, i));
      break;
    case "sat2":
      l = o * Math.sin(Math.atan2(r, i));
      break;
    case "cos":
      l = o * Math.cos(me(i));
      break;
    case "sin":
      l = o * Math.sin(me(i));
      break;
    case "tan":
      l = o * Math.tan(me(i));
      break;
    case "max":
      l = Math.max(o, i);
      break;
    case "min":
      l = Math.min(o, i);
      break;
    case "mod":
      l = Math.sqrt(o * o + i * i + r * r);
      break;
    case "pin":
      l = i < o ? o : i > r ? r : i;
      break;
    case "sqrt":
      l = Math.sqrt(Math.max(0, o));
      break;
    default:
      l = 0;
  }
  return Number.isFinite(l) ? l : 0;
}
const Kn = (t, e, n) => Math.atan2(e * Math.sin(t), n * Math.cos(t));
function Fe(t, e, n, s = {}) {
  const o = Math.max(Math.abs(e), 0) * vt, i = Math.max(Math.abs(n), 0) * vt, r = to(t, o, i, s), l = (u) => typeof u == "number" ? u : r.get(u) ?? (Number.isFinite(Number(u)) ? Number(u) : 0), a = [];
  let c = pi;
  for (const u of t.paths) {
    const h = u.w ? o / u.w : 1, d = u.h ? i / u.h : 1, m = (y) => l(y) * h / vt, f = (y) => l(y) * d / vt, p = [];
    let g = { x: 0, y: 0 }, b = { x: 0, y: 0 };
    for (const y of u.d) {
      if (--c < 0) break;
      switch (y[0]) {
        case "M":
          g = { x: m(y[1]), y: f(y[2]) }, b = g, p.push({ op: "M", ...g });
          break;
        case "L":
          g = { x: m(y[1]), y: f(y[2]) }, p.push({ op: "L", ...g });
          break;
        case "C": {
          const k = m(y[1]), w = f(y[2]), v = m(y[3]), S = f(y[4]);
          g = { x: m(y[5]), y: f(y[6]) }, p.push({ op: "C", x1: k, y1: w, x2: v, y2: S, ...g });
          break;
        }
        case "Q": {
          const k = m(y[1]), w = f(y[2]), v = m(y[3]), S = f(y[4]);
          p.push({ op: "C", x1: g.x + 2 / 3 * (k - g.x), y1: g.y + 2 / 3 * (w - g.y), x2: v + 2 / 3 * (k - v), y2: S + 2 / 3 * (w - S), x: v, y: S }), g = { x: v, y: S };
          break;
        }
        case "A": {
          const k = l(y[1]) * h / vt, w = l(y[2]) * d / vt;
          g = gi(p, g, k, w, l(y[3]), l(y[4]));
          break;
        }
        case "Z":
          p.push({ op: "Z" }), g = b;
          break;
      }
    }
    p.length && a.push({ cmds: p, fill: u.fill === "none" ? !1 : void 0, stroke: u.stroke === !1 ? !1 : void 0 });
  }
  return a;
}
function gi(t, e, n, s, o, i) {
  if (Math.abs(n) < 1e-9 || Math.abs(s) < 1e-9 || i === 0) return e;
  const r = me(o), l = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, me(i))), a = Kn(r, n, s);
  let c = Kn(r + l, n, s);
  if (Math.abs(l) >= 2 * Math.PI - 1e-9) c = a + Math.sign(l) * 2 * Math.PI;
  else {
    for (; l > 0 && c < a; ) c += 2 * Math.PI;
    for (; l < 0 && c > a; ) c -= 2 * Math.PI;
  }
  const u = e.x - n * Math.cos(a), h = e.y - s * Math.sin(a), d = c - a, m = Math.max(1, Math.min(16, Math.ceil(Math.abs(d) / (Math.PI / 2)))), f = d / m, p = 4 / 3 * Math.tan(f / 4);
  let g = a, b = e;
  for (let y = 0; y < m; y++) {
    const k = g + f, w = Math.cos(g), v = Math.sin(g), S = Math.cos(k), $ = Math.sin(k);
    b = { x: u + n * S, y: h + s * $ }, t.push({ op: "C", x1: u + n * (w - p * v), y1: h + s * (v + p * w), x2: u + n * (S + p * $), y2: h + s * ($ - p * S), ...b }), g = k;
  }
  return b;
}
function eo(t, e, n, s = {}) {
  const o = Math.abs(e), i = Math.abs(n);
  if (!t.rect) return { l: 0, t: 0, r: o, b: i };
  const r = to(t, o * vt, i * vt, s), l = (d) => (r.get(d) ?? (Number.isFinite(Number(d)) ? Number(d) : 0)) / vt, [a, c, u, h] = t.rect.map(l);
  return { l: a, t: c, r: u, b: h };
}
let Jn = null;
async function bi() {
  return Jn ??= (await import("./presets-DP49P8i2.js")).default, Jn;
}
const Qn = 5e4, xi = 256 * 1024 * 1024, ts = 1024 * 1024 * 1024, yi = 1e4, ki = 32, wi = 2e4, _ = (t, e) => {
  if (!t) return [];
  const n = [];
  for (let s = t.firstChild; s; s = s.nextSibling)
    s.nodeType === 1 && (!e || s.localName === e) && n.push(s);
  return n;
}, x = (t, e) => {
  if (!t) return null;
  for (let n = t.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && n.localName === e) return n;
  return null;
}, Z = (t, ...e) => {
  let n = t;
  for (const s of e) n = x(n, s);
  return n ?? null;
}, M = (t, e) => {
  if (!t) return null;
  const n = t.getAttribute(e);
  if (n !== null && n !== "") return n;
  const s = e.includes(":") ? e.split(":")[1] : e;
  for (let o = 0; o < (t.attributes?.length ?? 0); o++) {
    const i = t.attributes[o];
    if (i.localName === s && (e.includes(":") || !i.name.includes(":"))) return i.value;
  }
  return null;
}, N = (t, e, n = 0) => {
  const s = M(t, e), o = s === null ? NaN : Number(s);
  return Number.isFinite(o) ? o : n;
}, lt = (t, e) => {
  const n = M(t, e);
  return n === null ? void 0 : n === "1" || n === "true" || n === "on";
}, at = (t) => t / vt, Mi = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function vi(t) {
  if (t.localName !== "AlternateContent") return [t];
  const e = x(t, "Fallback");
  for (const n of _(t, "Choice"))
    if ((M(n, "Requires") || "").split(/\s+/).filter(Boolean).every((o) => Mi.has(o))) return _(n);
  return _(e);
}
const It = (t) => _(t).flatMap(vi);
class Si {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(e, n, s) {
    this.parseXml = n, this.warn = s, this.files = {};
    for (const [o, i] of Object.entries(e)) this.files[de(o)] = i;
  }
  bytes(e) {
    return this.files[de(e)];
  }
  /** Parse markup the importer itself supplies (built-in definitions), cached by text. */
  parse(e) {
    const n = `#inline:${e}`;
    if (!this.text.has(n)) {
      let s = null;
      try {
        s = this.parseXml(e), s.getElementsByTagName("parsererror").length && (s = null);
      } catch {
        s = null;
      }
      this.text.set(n, s);
    }
    return this.text.get(n)?.documentElement ?? null;
  }
  xml(e) {
    const n = de(e);
    if (!this.text.has(n)) {
      const s = this.files[n];
      let o = null;
      if (s) {
        try {
          const i = Vo(s).replace(/^﻿/, "");
          o = /<!DOCTYPE/i.test(i.slice(0, 2048)) ? null : this.parseXml(i), o && o.getElementsByTagName("parsererror").length && (o = null);
        } catch {
          o = null;
        }
        o || this.warn(`Couldn't read ${n}`);
      }
      this.text.set(n, o);
    }
    return this.text.get(n)?.documentElement ?? null;
  }
  rels(e) {
    const n = de(e);
    let s = this.relCache.get(n);
    if (s) return s;
    s = /* @__PURE__ */ new Map();
    const o = n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "", i = n.slice(n.lastIndexOf("/") + 1), r = this.xml(`${o ? o + "/" : ""}_rels/${i}.rels`);
    for (const l of _(r, "Relationship")) {
      const a = M(l, "Id"), c = M(l, "Type") || "", u = M(l, "Target") || "";
      if (!a) continue;
      const h = M(l, "TargetMode") === "External";
      s.set(a, { type: c.slice(c.lastIndexOf("/") + 1), target: h ? u : Ci(o, u), external: h });
    }
    return this.relCache.set(n, s), s;
  }
  relOfType(e, n) {
    for (const s of this.rels(e).values()) if (s.type === n && !s.external) return s.target;
    return null;
  }
}
const de = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function Ci(t, e) {
  let n = e.split("#")[0];
  try {
    n = decodeURIComponent(n);
  } catch {
  }
  if (n.startsWith("/")) return de(n);
  const s = (t ? t.split("/") : []).concat(n.split("/")), o = [];
  for (const i of s)
    i === ".." ? o.pop() : i && i !== "." && o.push(i);
  return o.join("/");
}
const On = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function no(t) {
  const e = {};
  for (const n of _(t)) {
    const s = _(n)[0];
    if (!s) continue;
    const o = s.localName === "sysClr" ? M(s, "lastClr") : M(s, "val");
    o && /^[0-9a-f]{6}$/i.test(o) && (e[n.localName] = "#" + o.toLowerCase());
  }
  return e;
}
function Ve(t) {
  const e = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, n = x(t, "themeElements");
  e.colors = no(x(n, "clrScheme"));
  const s = x(n, "fontScheme");
  e.major = M(Z(s, "majorFont", "latin"), "typeface") || e.major, e.minor = M(Z(s, "minorFont", "latin"), "typeface") || e.minor;
  const o = x(n, "fmtScheme");
  return e.fills = _(x(o, "fillStyleLst")), e.lines = _(x(o, "lnStyleLst")), e.bgFills = _(x(o, "bgFillStyleLst")), e;
}
const Pi = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  orange: "#ffa500",
  purple: "#800080",
  navy: "#000080",
  teal: "#008080",
  maroon: "#800000",
  lime: "#00ff00",
  aqua: "#00ffff",
  cyan: "#00ffff",
  fuchsia: "#ff00ff",
  magenta: "#ff00ff",
  olive: "#808000",
  darkGray: "#a9a9a9",
  lightGray: "#d3d3d3",
  dkGray: "#a9a9a9",
  ltGray: "#d3d3d3"
}, Ai = (t) => {
  const e = t.replace("#", "");
  return [parseInt(e.slice(0, 2), 16) || 0, parseInt(e.slice(2, 4), 16) || 0, parseInt(e.slice(4, 6), 16) || 0];
}, Ye = (t, e, n) => "#" + [t, e, n].map((s) => Math.max(0, Math.min(255, Math.round(s))).toString(16).padStart(2, "0")).join(""), es = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), he = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function ns(t, e, n) {
  t /= 255, e /= 255, n /= 255;
  const s = Math.max(t, e, n), o = Math.min(t, e, n), i = (s + o) / 2;
  if (s === o) return [0, 0, i];
  const r = s - o, l = i > 0.5 ? r / (2 - s - o) : r / (s + o);
  return [(s === t ? (e - n) / r + (e < n ? 6 : 0) : s === e ? (n - t) / r + 2 : (t - e) / r + 4) * 60, l, i];
}
function Ge(t, e, n) {
  if (t = (t % 360 + 360) % 360 / 360, e === 0) return [n * 255, n * 255, n * 255];
  const s = n < 0.5 ? n * (1 + e) : n + e - n * e, o = 2 * n - s, i = (r) => (r = (r % 1 + 1) % 1, r < 1 / 6 ? o + (s - o) * 6 * r : r < 1 / 2 ? s : r < 2 / 3 ? o + (s - o) * (2 / 3 - r) * 6 : o);
  return [i(t + 1 / 3) * 255, i(t) * 255, i(t - 1 / 3) * 255];
}
function ht(t, e) {
  const n = _(t).find((s) => /Clr$/.test(s.localName));
  return n ? $i(n, e) : null;
}
function $i(t, e) {
  let n = null, s = 1;
  switch (t.localName) {
    case "srgbClr": {
      const a = M(t, "val");
      n = a && /^[0-9a-f]{6}$/i.test(a) ? "#" + a.toLowerCase() : null;
      break;
    }
    case "sysClr": {
      const a = M(t, "lastClr");
      n = a ? "#" + a.toLowerCase() : M(t, "val") === "window" ? "#ffffff" : "#000000";
      break;
    }
    case "prstClr":
      n = Pi[M(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      n = Ye(he(N(t, "r") / 1e5), he(N(t, "g") / 1e5), he(N(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [a, c, u] = Ge(N(t, "hue") / 6e4, N(t, "sat") / 1e5, N(t, "lum") / 1e5);
      n = Ye(a, c, u);
      break;
    }
    case "schemeClr": {
      const a = M(t, "val") || "";
      if (a === "phClr") {
        e.phClr ? (n = e.phClr.hex, s = e.phClr.alpha ?? 1) : n = e.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const c = e.clrMap[a] ?? On[a] ?? a;
      n = e.theme.colors[c] ?? null;
      break;
    }
  }
  if (!n) return null;
  let [o, i, r] = Ai(n);
  for (const a of _(t)) {
    const c = N(a, "val") / 1e5;
    switch (a.localName) {
      case "alpha":
        s = c;
        break;
      case "alphaMod":
        s *= c;
        break;
      case "alphaOff":
        s += c;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [u, h, d] = ns(o, i, r);
        a.localName === "lumMod" ? d *= c : a.localName === "lumOff" ? d += c : a.localName === "satMod" ? h *= c : a.localName === "satOff" ? h += c : a.localName === "hueMod" ? u *= c : u += N(a, "val") / 6e4, [o, i, r] = Ge(u, Math.max(0, Math.min(1, h)), Math.max(0, Math.min(1, d)));
        break;
      }
      case "tint":
        [o, i, r] = [o, i, r].map((u) => he(es(u) * c + (1 - c)));
        break;
      case "shade":
        [o, i, r] = [o, i, r].map((u) => he(es(u) * c));
        break;
      case "comp": {
        const [u, h, d] = ns(o, i, r);
        [o, i, r] = Ge(u + 180, h, d);
        break;
      }
      case "inv":
        [o, i, r] = [255 - o, 255 - i, 255 - r];
        break;
      case "gray": {
        o = i = r = 0.299 * o + 0.587 * i + 0.114 * r;
        break;
      }
    }
  }
  s = Math.max(0, Math.min(1, s));
  const l = { hex: Ye(o, i, r) };
  return s < 0.999 && (l.alpha = s), l;
}
function _t(t, e) {
  for (const n of _(t)) {
    const s = Tn(n, e);
    if (s) return s;
  }
}
function Tn(t, e) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const n = ht(t, e.ctx);
      return n ? { kind: "solid", color: n } : { kind: "none" };
    }
    case "gradFill": {
      const n = _(x(t, "gsLst"), "gs").slice(0, 256).map((o) => ({ pos: N(o, "pos") / 1e5, color: ht(o, e.ctx) ?? { hex: "#000000" } }));
      if (!n.length) return { kind: "none" };
      const s = x(t, "lin");
      return x(t, "path") ? { kind: "radial", stops: n } : { kind: "linear", stops: n, angle: s ? N(s, "ang") / 6e4 : 90, scaled: lt(s, "scaled") ?? !1 };
    }
    case "blipFill": {
      const n = En(t, e);
      if (!n) return;
      const s = { kind: "image", media: n }, o = x(t, "tile");
      o && (s.tile = { sx: Math.max(0.01, N(o, "sx", 1e5) / 1e5), sy: Math.max(0.01, N(o, "sy", 1e5) / 1e5) });
      const i = x(x(t, "blip"), "alphaModFix");
      return i && (s.alpha = Math.max(0, Math.min(1, N(i, "amt", 1e5) / 1e5))), x(x(t, "blip"), "grayscl") && (s.grayscale = !0), s;
    }
    case "pattFill": {
      const n = ht(x(t, "fgClr"), e.ctx), s = ht(x(t, "bgClr"), e.ctx);
      return n ? { kind: "pattern", preset: M(t, "prst") || "pct50", color: n, ...s ? { bg: s } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Oi = {
  png: "png",
  jpg: "jpeg",
  jpeg: "jpeg",
  jpe: "jpeg",
  gif: "gif",
  svg: "svg",
  bmp: "bmp",
  tif: "tiff",
  tiff: "tiff",
  webp: "webp",
  emf: "emf",
  wmf: "wmf"
};
function En(t, e) {
  const n = x(t, "blip"), s = M(n, "r:embed");
  if (!s) return null;
  const o = e.pkg.rels(e.part).get(s);
  return !o || o.external ? null : so(e.pkg, o.target);
}
function Ti(t, e) {
  const n = x(t, "videoFile") ?? x(t, "quickTimeFile"), s = x(t, "audioFile") ?? x(t, "wavAudioFile"), o = bt(x(t, "extLst"), "media", 2);
  if (!n && !s && !o) return null;
  const i = !n && !!s;
  let r;
  for (const l of [M(o, "r:embed"), M(n ?? s, "r:link"), M(n ?? s, "r:embed")]) {
    const a = l ? e.pkg.rels(e.part).get(l) : void 0;
    if (!a) continue;
    if (a.external) {
      !r && /^https?:\/\//i.test(a.target) && (r = a.target);
      continue;
    }
    const c = e.pkg.bytes(a.target);
    if (c) return { audio: i, file: { bytes: c, ext: (a.target.split(".").pop() || "").toLowerCase() } };
  }
  return { audio: i, file: null, ...r ? { url: r } : {} };
}
function so(t, e) {
  const n = t.bytes(e), s = Oi[(e.split(".").pop() || "").toLowerCase()];
  return n && s ? { bytes: n, ext: s } : null;
}
const Ei = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function zt(t, e) {
  if (!t) return;
  let n;
  for (const l of _(t)) {
    if (l.localName === "noFill") return null;
    l.localName === "solidFill" && (n = ht(l, e.ctx)), l.localName === "gradFill" && (n = ht(x(x(l, "gsLst"), "gs"), e.ctx));
  }
  const s = M(t, "w");
  if (n === void 0 && s === null && !x(t, "prstDash") && !x(t, "headEnd") && !x(t, "tailEnd")) return;
  const o = (l) => {
    const a = M(l, "type");
    if (!a || a === "none") return;
    const c = a === "triangle" || a === "stealth" || a === "arrow" || a === "oval" || a === "diamond" ? a : "triangle", u = M(l, "len") || M(l, "w");
    return { type: c, size: u === "sm" || u === "lg" ? u : "med" };
  }, i = Ei[M(x(t, "prstDash"), "val") || "solid"], r = M(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: s !== null ? Math.max(0, at(Number(s) || 0)) : 1,
    color: n ?? { hex: "#000000" },
    dash: i || void 0,
    cap: r === "rnd" ? "rnd" : r === "sq" ? "sq" : r === "flat" ? "flat" : void 0,
    join: x(t, "round") ? "round" : x(t, "bevel") ? "bevel" : x(t, "miter") ? "miter" : void 0,
    head: o(x(t, "headEnd")),
    tail: o(x(t, "tailEnd"))
  };
}
function Be(t, e) {
  const n = x(t, "fillRef");
  if (!n) return;
  const s = N(n, "idx");
  if (s === 0) return { kind: "none" };
  const i = (s >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[s >= 1001 ? s - 1001 : s - 1];
  if (!i) return;
  const r = ht(n, e.ctx) ?? void 0;
  return Tn(i, { ...e, ctx: { ...e.ctx, phClr: r } });
}
function Nn(t, e) {
  const n = x(t, "lnRef");
  if (!n) return;
  const s = N(n, "idx");
  if (s === 0) return null;
  const o = e.ctx.theme.lines[s - 1];
  if (!o) return;
  const i = ht(n, e.ctx) ?? void 0;
  return zt(o, { ...e, ctx: { ...e.ctx, phClr: i } }) ?? void 0;
}
function Tt(t) {
  if (!t) return null;
  const e = x(t, "off"), n = x(t, "ext");
  return !e || !n ? null : {
    x: at(N(e, "x")),
    y: at(N(e, "y")),
    w: Math.max(0, at(N(n, "cx"))),
    h: Math.max(0, at(N(n, "cy"))),
    rot: N(t, "rot") / 6e4,
    flipH: !!lt(t, "flipH"),
    flipV: !!lt(t, "flipV")
  };
}
const qe = (t) => t;
function Ni(t, e) {
  const n = Tt(t);
  if (!n) return e;
  const s = x(t, "chOff"), o = x(t, "chExt"), i = s ? at(N(s, "x")) : n.x, r = s ? at(N(s, "y")) : n.y, l = o ? at(N(o, "cx")) : n.w, a = o ? at(N(o, "cy")) : n.h, c = l > 0 ? n.w / l : 1, u = a > 0 ? n.h / a : 1, h = n.x + n.w / 2, d = n.y + n.h / 2, m = n.rot * Math.PI / 180;
  return (f) => {
    let p = n.x + (f.x + f.w / 2 - i) * c, g = n.y + (f.y + f.h / 2 - r) * u, b = f.rot, y = f.flipH, k = f.flipV;
    if (n.flipH && (p = 2 * h - p, y = !y, b = -b), n.flipV && (g = 2 * d - g, k = !k, b = -b), m) {
      const S = p - h, $ = g - d;
      p = h + S * Math.cos(m) - $ * Math.sin(m), g = d + S * Math.sin(m) + $ * Math.cos(m), b += n.rot;
    }
    const w = f.w * c, v = f.h * u;
    return e({ x: p - w / 2, y: g - v / 2, w, h: v, rot: (b % 360 + 360) % 360, flipH: y, flipV: k });
  };
}
function ss(t) {
  const e = x(t, "spcPts"), n = x(t, "spcPct");
  if (e) return { px: Math.max(0, Math.min(1584, N(e, "val") / 100)) * ($n / vt) };
  if (n) return { lines: Math.max(0, Math.min(13.2, N(n, "val") / 1e5)) };
}
function os(t, e, n) {
  const s = x(t, `lvl${e + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return s ? oo(s, n) : {};
}
function oo(t, e) {
  const n = {};
  if (M(t, "algn") && (n.algn = M(t, "algn")), M(t, "marL") !== null && (n.marL = at(N(t, "marL"))), M(t, "indent") !== null && (n.indent = at(N(t, "indent"))), x(t, "buNone")) n.bullet = "none";
  else if (x(t, "buAutoNum")) {
    const r = x(t, "buAutoNum");
    n.bullet = "num", n.numType = M(r, "type") || "arabicPeriod", n.startAt = M(r, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(N(r, "startAt", 1)))) : void 0;
  } else x(t, "buChar") ? (n.bullet = "char", n.buChar = M(x(t, "buChar"), "char") || void 0) : x(t, "buBlip") && (n.bullet = "char", n.buChar = "•");
  if (x(t, "buFont") ? n.buFont = M(x(t, "buFont"), "typeface") || null : x(t, "buFontTx") && (n.buFont = null), x(t, "buClr") ? n.buClr = ht(x(t, "buClr"), e.ctx) : x(t, "buClrTx") && (n.buClr = null), x(t, "buSzPct")) {
    const r = M(x(t, "buSzPct"), "val") || "", l = r.endsWith("%") ? parseFloat(r) / 100 : Number(r) / 1e5;
    n.buSz = Number.isFinite(l) && l > 0 ? Math.max(0.25, Math.min(4, l)) : null;
  } else (x(t, "buSzTx") || x(t, "buSzPts")) && (n.buSz = null);
  const s = Z(t, "lnSpc", "spcPct");
  s && (n.lnSpcPct = N(s, "val") / 1e5);
  const o = ss(x(t, "spcBef")), i = ss(x(t, "spcAft"));
  return o && (n.spcBef = o), i && (n.spcAft = i), Object.assign(n, io(x(t, "defRPr"), e)), n;
}
function io(t, e) {
  if (!t) return {};
  const n = {};
  M(t, "sz") !== null && (n.sz = N(t, "sz") / 100 * ($n / vt)), lt(t, "b") !== void 0 && (n.b = lt(t, "b")), lt(t, "i") !== void 0 && (n.i = lt(t, "i")), M(t, "u") && (n.u = M(t, "u") !== "none"), M(t, "strike") && (n.strike = M(t, "strike") !== "noStrike");
  const s = x(t, "solidFill");
  s ? n.color = ht(s, e.ctx) : x(t, "noFill") && (n.color = null);
  const o = M(x(t, "latin"), "typeface");
  return o && (n.font = o), n;
}
const Ii = {
  108: "●",
  110: "■",
  111: "□",
  113: "❑",
  117: "◆",
  118: "❖",
  159: "•",
  167: "▪",
  168: "◻",
  216: "➢",
  252: "✔",
  251: "✗",
  254: "☑"
}, Ri = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Fi(t, e) {
  if (!t) return "•";
  let n = t.codePointAt(0);
  n >= 61440 && n <= 61695 && (n -= 61440);
  const s = (e || "").toLowerCase();
  return s.startsWith("wingdings") ? s === "wingdings" && Ii[n] || "•" : s === "symbol" ? Ri[n] ?? (n < 128 && n > 32 ? String.fromCharCode(n) : "•") : s.startsWith("webdings") || s.startsWith("marlett") ? "•" : s === "courier new" && t === "o" ? "◦" : /\s/.test(t) || n < 32 ? "•" : [...t][0];
}
const is = (...t) => {
  const e = {};
  for (const n of t) for (const [s, o] of Object.entries(n)) o !== void 0 && (e[s] = o);
  return e;
};
function Bi(t, e) {
  if (t)
    return t.startsWith("+mj") ? e.major : t.startsWith("+mn") ? e.minor : t;
}
function In(t, e, n) {
  if (!t) return;
  const s = _(t, "p");
  if (!s.some((p) => _(p).some((g) => (g.localName === "r" || g.localName === "fld") && (Z(g, "t")?.textContent ?? "") !== ""))) return;
  const i = {};
  let r = 1, l = 1, a = !1;
  for (const p of [...e.bodyPr, x(t, "bodyPr")]) {
    if (!p) continue;
    for (let b = 0; b < p.attributes.length; b++) i[p.attributes[b].localName ?? p.attributes[b].name] = p.attributes[b].value;
    const g = x(p, "normAutofit");
    g && (r = M(g, "fontScale") !== null ? N(g, "fontScale") / 1e5 : 1, a = !1), g && (l = 1 - Math.max(0, Math.min(0.9, N(g, "lnSpcReduction") / 1e5))), (x(p, "noAutofit") || x(p, "spAutoFit")) && (r = 1, l = 1, a = !0);
  }
  const c = !a && [...e.bodyPr, x(t, "bodyPr")].some((p) => p && x(p, "normAutofit")), u = (p, g) => i[p] !== void 0 ? at(Number(i[p]) || 0) : at(g), h = i.anchor === "ctr" ? "ctr" : i.anchor === "b" ? "b" : "t", d = x(t, "lstStyle"), m = [];
  let f;
  for (const p of s) {
    const g = x(p, "pPr"), b = Math.max(0, Math.min(8, N(g, "lvl"))), y = e.fontRef ? { color: e.fontRef.color ?? void 0, font: e.fontRef.font } : {}, k = is(...e.levels.map((O) => os(O, b, n)), y, os(d, b, n), g ? oo(g, n) : {});
    k.lnSpcPct !== void 0 && f === void 0 && (f = k.lnSpcPct);
    const w = { runs: [], align: k.algn === "ctr" ? "ctr" : k.algn === "r" ? "r" : (k.algn === "just", "l"), level: b };
    if (k.bullet === "char" || k.bullet === "num") {
      if (w.bullet = k.bullet, w.marL = k.marL ?? 0, w.indent = k.indent ?? 0, k.bullet === "char") {
        const O = Fi(k.buChar, k.buFont ?? void 0);
        O !== "•" && (w.bulletChar = O);
      } else
        k.numType && k.numType !== "arabicPeriod" && (w.numType = k.numType), k.startAt && k.startAt !== 1 && (w.startAt = k.startAt);
      k.buClr && (w.bulletColor = k.buClr), k.buSz && Math.abs(k.buSz - 1) > 1e-3 && (w.bulletScale = k.buSz);
    }
    const v = (O) => {
      const F = is(k, io(O, n)), T = (F.sz ?? 18 * $n / vt) * r, D = F.color === null ? void 0 : F.color ?? Di("tx1", n);
      return {
        text: "",
        size: T,
        bold: F.b || void 0,
        italic: F.i || void 0,
        underline: F.u || void 0,
        strike: F.strike || void 0,
        color: D ?? void 0,
        font: Bi(F.font ?? "+mn-lt", n.ctx.theme)
      };
    };
    for (const O of _(p))
      if (O.localName === "r" || O.localName === "fld") {
        const F = Z(O, "t")?.textContent ?? "";
        if (!F) continue;
        F.split(/[\v\n]/).forEach((T, D) => {
          D > 0 && w.runs.push({ ...v(x(O, "rPr")), br: !0 }), T && w.runs.push({ ...v(x(O, "rPr")), text: T });
        });
      } else O.localName === "br" && w.runs.push({ ...v(x(O, "rPr")), br: !0 });
    w.endSize = v(x(p, "endParaRPr")).size;
    const S = (w.runs.length ? Math.max(...w.runs.map((O) => O.size ?? 0)) : w.endSize ?? 0) * 1.2 * (k.lnSpcPct ?? 1), $ = (O) => O ? ("px" in O ? O.px : O.lines * S) * l : 0, I = $(k.spcBef), L = $(k.spcAft);
    I > 0.05 && (w.spaceBefore = Math.round(I * 100) / 100), L > 0.05 && (w.spaceAfter = Math.round(L * 100) / 100), m.push(w);
  }
  return {
    paragraphs: m,
    anchor: h,
    insets: { l: u("lIns", 91440), t: u("tIns", 45720), r: u("rIns", 91440), b: u("bIns", 45720) },
    wrap: i.wrap !== "none",
    lineSpacing: f,
    ...c && { shrink: 1 },
    ...hn(i.vert) && { vert: hn(i.vert) }
  };
}
function hn(t) {
  if (t === "vert" || t === "eaVert" || t === "mongolianVert") return "vert";
  if (t === "vert270") return "vert270";
  if (t === "wordArtVert" || t === "wordArtVertRtl") return "stacked";
}
const Di = (t, e) => {
  const n = e.ctx.clrMap[t] ?? On[t] ?? t, s = e.ctx.theme.colors[n];
  return s ? { hex: s } : null;
}, ie = (t) => {
  const e = x(t, "ph");
  return e ? { type: M(e, "type") || "obj", idx: N(e, "idx") } : null;
}, ge = (t) => x(_(t).find((e) => e.localName.startsWith("nv")) ?? null, "nvPr"), Me = /* @__PURE__ */ new Set(["title", "ctrTitle"]), rs = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), ls = (t, e) => t === e || Me.has(t) && Me.has(e) || !rs.has(t) && !rs.has(e);
function De(t, e) {
  const n = Li(t);
  if (e.idx) {
    const s = n.find((o) => o.ph.idx === e.idx && ls(o.ph.type, e.type));
    if (s) return s.el;
  }
  return (n.find((s) => s.ph.type === e.type && (s.ph.idx === e.idx || !e.idx || Me.has(e.type))) ?? n.find((s) => s.ph.type === e.type) ?? n.find((s) => ls(s.ph.type, e.type)))?.el ?? null;
}
function Li(t) {
  const e = [];
  for (const n of It(t)) {
    const s = ie(ge(n));
    s && e.push({ el: n, ph: s });
  }
  return e;
}
const ro = (t) => Me.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", ji = (t) => {
  const e = {};
  for (const n of _(x(t, "avLst"), "gd")) {
    const s = M(n, "name"), o = M(n, "fmla");
    s && o && (e[s] = o);
  }
  return e;
};
function Ui(t) {
  const e = (i) => _(i, "gd").slice(0, 1e4).map((r) => [M(r, "name") || "", M(r, "fmla") || "val 0"]), n = _(x(t, "cxnLst"), "cxn").map((i) => [M(i, "ang") || "0", M(x(i, "pos"), "x") || "0", M(x(i, "pos"), "y") || "0"]), s = x(t, "rect"), o = _(x(t, "pathLst"), "path").slice(0, 1e3).map((i) => {
    const r = [];
    for (const a of _(i)) {
      const c = _(a, "pt").map((u) => [M(u, "x") || "0", M(u, "y") || "0"]).flat();
      switch (a.localName) {
        case "moveTo":
          r.push(["M", ...c]);
          break;
        case "lnTo":
          r.push(["L", ...c]);
          break;
        case "quadBezTo":
          r.push(["Q", ...c]);
          break;
        case "cubicBezTo":
          r.push(["C", ...c]);
          break;
        case "arcTo":
          r.push(["A", M(a, "wR") || "0", M(a, "hR") || "0", M(a, "stAng") || "0", M(a, "swAng") || "0"]);
          break;
        case "close":
          r.push(["Z"]);
          break;
      }
    }
    const l = M(i, "fill");
    return { w: N(i, "w") || void 0, h: N(i, "h") || void 0, fill: l && l !== "norm" ? l : void 0, stroke: lt(i, "stroke") === !1 ? !1 : void 0, d: r };
  });
  return {
    av: _(x(t, "avLst"), "gd").map((i) => [M(i, "name") || "", M(i, "fmla") || "val 0"]),
    gd: e(x(t, "gdLst")),
    cxn: n,
    rect: s ? [M(s, "l") || "l", M(s, "t") || "t", M(s, "r") || "r", M(s, "b") || "b"] : null,
    paths: o
  };
}
function be(t, e) {
  const n = x(t, "prstGeom");
  if (n) {
    const o = {};
    for (const [i, r] of Object.entries(ji(n))) {
      const l = /^val\s+(-?\d+(\.\d+)?)/.exec(r);
      l && (o[i] = Number(l[1]));
    }
    return { geom: { kind: "preset", prst: M(n, "prst") || "rect", adj: Object.keys(o).length ? o : void 0 } };
  }
  const s = x(t, "custGeom");
  if (s) {
    const o = Ui(s);
    return { geom: { kind: "custom", paths: Fe(o, e.w, e.h) }, textRect: o.rect ? eo(o, e.w, e.h) : void 0 };
  }
}
function xe(t, e, n, s, o, i) {
  const r = [];
  if (o > ki)
    return n.warnings.push("Groups nested too deeply; the innermost were skipped."), r;
  for (const l of It(t)) {
    if (++n.count > wi) {
      n.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const a = Hi(l, e, n, s, o, i);
      a && r.push(...Array.isArray(a) ? a : [a]);
    } catch {
      n.warnings.push(`A ${l.localName} couldn't be read and was skipped.`);
    }
  }
  return r;
}
const _i = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function zi(t, e, n) {
  const s = x(t, "hlinkClick");
  if (!s) return;
  const o = M(s, "action") || "", i = n.rels(e).get(M(s, "r:id") || "");
  if (o.startsWith("ppaction://hlinkshowjump")) {
    const r = _i[(/jump=([a-z]+)/i.exec(o)?.[1] ?? "").toLowerCase()];
    return r ? { kind: "action", action: r } : void 0;
  }
  if (o.startsWith("ppaction://hlinksldjump")) return i && !i.external ? { kind: "slide", key: i.target } : void 0;
  if (!o)
    return i?.external && /^(https?:|mailto:|tel:)/i.test(i.target) ? { kind: "url", url: i.target } : void 0;
}
function Hi(t, e, n, s, o, i) {
  const r = _(t).find((u) => u.localName.startsWith("nv")), l = Xi(t, e, n, s, o, i), a = x(r ?? null, "cNvPr"), c = l ? zi(a, e.part, n.pkg) : void 0;
  if (c) for (const u of Array.isArray(l) ? l : [l]) u.link = c;
  if (l && !Array.isArray(l)) {
    const u = M(a, "descr")?.trim();
    u && (l.descr = u), M(bt(a, "decorative", 3), "val") === "1" && (l.decorative = !0);
  }
  return l;
}
function Xi(t, e, n, s, o, i) {
  const r = { pkg: n.pkg, part: e.part, ctx: n.ctx }, l = _(t).find((h) => h.localName.startsWith("nv")), a = x(l ?? null, "cNvPr"), c = N(a, "id"), u = M(a, "name") || t.localName;
  if (M(a, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Yi(t, e, n, s, c, u, i);
    case "cxnSp": {
      const h = x(t, "spPr"), d = Tt(x(h, "xfrm"));
      if (!d) return null;
      const m = s(d), f = x(t, "style"), p = zt(x(h, "ln"), r) ?? Nn(f, r) ?? { width: 1, color: { hex: "#000000" } };
      if (!p) return null;
      const g = be(h, m) ?? { geom: { kind: "preset", prst: "line" } }, b = (k) => k ? { id: N(k, "id"), idx: N(k, "idx") } : void 0, y = x(l ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: c, name: u, ...m, geom: g.geom, line: p, start: b(x(y, "stCxn")), end: b(x(y, "endCxn")) };
    }
    case "pic": {
      const h = x(t, "spPr");
      let d = Tt(x(h, "xfrm"));
      const m = ie(x(l ?? null, "nvPr"));
      if (!d && m && (d = Wi(m, n)), !d) return null;
      const f = x(t, "blipFill"), p = f ? En(f, r) : null, g = x(f, "srcRect"), b = g ? { l: N(g, "l") / 1e5, t: N(g, "t") / 1e5, r: N(g, "r") / 1e5, b: N(g, "b") / 1e5 } : void 0, y = Ti(x(l ?? null, "nvPr"), r);
      if (y)
        return !y.file && !y.url && n.warnings.push(`${y.audio ? "Audio" : "Video"} "${u}" is linked to a file on another computer; only its picture was imported.`), !y.file && !y.url && !p ? null : { kind: "media", id: c, name: u, ...s(d), ...y, ...p ? { poster: p } : {}, crop: b };
      if (!p)
        return n.warnings.push(`Picture "${u}" has no image the importer can read.`), null;
      const k = M(Z(f, "blip", "alphaModFix"), "amt"), w = s(d), v = be(h, w)?.geom, S = v && !(v.kind === "preset" && v.prst === "rect") ? v : void 0;
      return { kind: "picture", id: c, name: u, ...w, media: p, crop: b, alpha: k !== null ? Number(k) / 1e5 : void 0, geom: S, ...Z(f, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const h = x(t, "grpSpPr"), d = x(h, "xfrm"), m = Ni(d, s), f = xe(t, e, n, m, o + 1, i);
      if (!f.length) return null;
      const p = Le(f);
      return { kind: "group", id: c, name: u, ...p, children: f };
    }
    case "graphicFrame":
      return Ki(t, e, n, s, c, u, o);
    default:
      return null;
  }
}
function Le(t) {
  let e = 1 / 0, n = 1 / 0, s = -1 / 0, o = -1 / 0;
  for (const i of t)
    e = Math.min(e, i.x), n = Math.min(n, i.y), s = Math.max(s, i.x + i.w), o = Math.max(o, i.y + i.h);
  return { x: e, y: n, w: Math.max(0, s - e), h: Math.max(0, o - n) };
}
function Wi(t, e) {
  const n = De(e.layout?.tree ?? null, t), s = Tt(Z(n, "spPr", "xfrm"));
  if (s) return s;
  const o = De(e.master?.tree ?? null, { type: ro(t.type), idx: 0 });
  return Tt(Z(o, "spPr", "xfrm"));
}
function Vi(...t) {
  for (const e of t) {
    const n = e();
    if (n !== void 0) return n;
  }
}
function Yi(t, e, n, s, o, i, r) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = ge(t), c = ie(a);
  if (c && !r) return null;
  const u = x(t, "spPr"), h = x(t, "style"), d = M(Z(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", m = c && n.layout ? De(n.layout.tree, c) : null, f = c && n.master ? De(n.master.tree, { type: ro(m ? ie(ge(m))?.type ?? c.type : c.type), idx: 0 }) : null, p = m && n.layout ? { pkg: n.pkg, part: n.layout.part, ctx: n.ctx } : null, g = f && n.master ? { pkg: n.pkg, part: n.master.part, ctx: n.ctx } : null;
  let b = Tt(x(u, "xfrm")) ?? Tt(Z(m, "spPr", "xfrm")) ?? Tt(Z(f, "spPr", "xfrm"));
  if (!b) return null;
  b = s(b);
  const y = be(u, b) ?? (m ? be(x(m, "spPr"), b) : void 0) ?? (f ? be(x(f, "spPr"), b) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, w = (lt(t, "useBgFill") ? n.background?.kind === "image" ? { kind: "none" } : n.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? _t(u, l) ?? Be(h, l) ?? (p ? _t(x(m, "spPr"), p) : void 0) ?? (g ? _t(x(f, "spPr"), g) : void 0) ?? (p ? Be(x(m, "style"), p) : void 0) ?? { kind: "none" }, v = Vi(
    () => zt(x(u, "ln"), l),
    () => Nn(h, l),
    () => p ? zt(Z(m, "spPr", "ln"), p) : void 0,
    () => g ? zt(Z(f, "spPr", "ln"), g) : void 0
  ) ?? null, S = [];
  if (c) {
    const R = m ? ie(ge(m))?.type ?? c.type : c.type;
    S.push(Me.has(R) ? n.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(R) ? n.masterTx.body : n.masterTx.other), S.push(Z(f, "txBody", "lstStyle"), Z(m, "txBody", "lstStyle"));
  } else
    S.push(n.defaultText);
  const $ = x(h, "fontRef"), I = {
    levels: S,
    bodyPr: [Z(f, "txBody", "bodyPr"), Z(m, "txBody", "bodyPr")],
    fontRef: $ ? { font: M($, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: ht($, l.ctx) } : void 0
  }, L = In(x(t, "txBody"), I, l);
  if (!(w.kind !== "none" || !!v || !!L)) return null;
  let F = y.textRect;
  const T = Tt(x(u, "xfrm")), D = L ? Tt(x(t, "txXfrm")) : null;
  if (D && T && T.w > 0 && T.h > 0) {
    const R = b.w / T.w, B = b.h / T.h, C = { l: (D.x - T.x) * R, t: (D.y - T.y) * B, r: (D.x + D.w - T.x) * R, b: (D.y + D.h - T.y) * B };
    (Math.abs(C.l) > 0.5 || Math.abs(C.t) > 0.5 || Math.abs(C.r - b.w) > 0.5 || Math.abs(C.b - b.h) > 0.5) && (F = C);
  }
  return { kind: "shape", id: o, name: i, ...b, geom: y.geom, fill: w, line: v, text: L, textBox: d || void 0, textRect: F };
}
const Gi = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function qi(t, e) {
  const n = { bdr: {} };
  if (!t) return n;
  const s = x(t, "tcStyle"), o = x(t, "tcTxStyle"), i = x(s, "fill"), r = i ? _t(i, e) : Be(s, e);
  r && (n.fill = r);
  const l = ht(o, e.ctx) ?? ht(x(o, "fontRef"), e.ctx);
  l && (n.text = l), M(o, "b") === "on" && (n.bold = !0);
  const a = x(s, "tcBdr");
  for (const c of ["left", "right", "top", "bottom", "insideH", "insideV"]) {
    const u = x(a, c);
    if (!u) continue;
    const h = zt(x(u, "ln"), e) ?? Nn(u, e);
    h !== void 0 && (n.bdr[c] = h);
  }
  return n;
}
function Zi(t, e, n) {
  const s = ((x(t, "tableStyleId")?.textContent || "").trim() || M(n, "def") || Gi).toUpperCase(), o = (d) => lt(t, d) ?? !1, i = { firstRow: o("firstRow"), lastRow: o("lastRow"), firstCol: o("firstCol"), lastCol: o("lastCol"), bandRow: o("bandRow"), bandCol: o("bandCol") };
  let r = _(n, "tblStyle").find((d) => (M(d, "styleId") || "").toUpperCase() === s);
  if (!r) {
    const d = fi(s);
    r = d ? x(e.pkg.parse(d), "tblStyle") ?? void 0 : void 0;
  }
  if (!r) return null;
  const l = (d) => qi(x(r, d), e), a = x(r, "tblBg"), c = a ? x(a, "fill") ? _t(x(a, "fill"), e) : Be(a, e) : void 0, u = {
    whole: l("wholeTbl"),
    b1H: l("band1H"),
    b2H: l("band2H"),
    b1V: l("band1V"),
    b2V: l("band2V"),
    firstRow: l("firstRow"),
    lastRow: l("lastRow"),
    firstCol: l("firstCol"),
    lastCol: l("lastCol")
  }, h = (d, m, f, p) => {
    const g = [0, f - 1, 0, p - 1], b = [d, d, 0, p - 1], y = [0, f - 1, m, m], k = [[u.whole, g]], w = d - (i.firstRow ? 1 : 0), v = m - (i.firstCol ? 1 : 0), S = (!i.firstRow || d > 0) && (!i.lastRow || d < f - 1), $ = (!i.firstCol || m > 0) && (!i.lastCol || m < p - 1);
    i.bandCol && v >= 0 && $ && k.push([v % 2 === 0 ? u.b1V : u.b2V, y]), i.bandRow && w >= 0 && S && k.push([w % 2 === 0 ? u.b1H : u.b2H, b]), i.firstCol && m === 0 && k.push([u.firstCol, y]), i.lastCol && m === p - 1 && k.push([u.lastCol, y]), i.firstRow && d === 0 && k.push([u.firstRow, b]), i.lastRow && d === f - 1 && k.push([u.lastRow, b]);
    const I = { edges: {} };
    for (const [L, [O, F, T, D]] of k) {
      L.fill && (I.fill = L.fill), L.text && (I.text = L.text), L.bold && (I.bold = !0);
      const R = (C, P, E) => E ? L.bdr[C] : L.bdr[P], B = {
        t: R("top", "insideH", d === O),
        b: R("bottom", "insideH", d === F),
        l: R("left", "insideV", m === T),
        r: R("right", "insideV", m === D)
      };
      for (const C of ["t", "b", "l", "r"]) B[C] !== void 0 && (I.edges[C] = B[C]);
    }
    return I;
  };
  return c && c.kind !== "none" && (h.background = c), h;
}
function as(t, e) {
  if (!t) return 0;
  const n = Math.max(8, e - t.insets.l - t.insets.r);
  if (t.vert) {
    const o = (l) => Math.max(0, ...l.runs.filter((a) => !a.br && a.text).map((a) => a.size ?? t.defaults?.size ?? 0)) || 18, i = (l) => o(l) * 1.2 * (t.lineSpacing ?? 1);
    let r = 0;
    if (t.vert === "stacked")
      for (const l of t.paragraphs) r = Math.max(r, l.runs.reduce((a, c) => a + c.text.length, 0) * i(l));
    else {
      const l = Math.max(1, Math.floor(n / Math.max(...t.paragraphs.map(i), 1)));
      r = t.paragraphs.reduce((c, u) => c + u.runs.reduce((h, d) => h + d.text.length, 0) * o(u) * 0.5, 0) / Math.max(1, l - t.paragraphs.length + 1) * 1.15;
    }
    return r + t.insets.t + t.insets.b;
  }
  let s = 0;
  for (const o of t.paragraphs) {
    const i = o.runs.filter((u) => !u.br), l = Math.max(0, ...i.filter((u) => u.text).map((u) => u.size ?? t.defaults?.size ?? 0)) || (o.endSize ?? 0) || 18, a = i.reduce((u, h) => u + h.text.length, 0), c = Math.max(1, Math.ceil(a * l * 0.5 / n)) + o.runs.filter((u) => u.br).length;
    s += c * l * 1.2 * (t.lineSpacing ?? 1) + (o.spaceBefore ?? 0) + (o.spaceAfter ?? 0);
  }
  return s + t.insets.t + t.insets.b;
}
function Ki(t, e, n, s, o, i, r = 0) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = Tt(x(t, "xfrm"));
  if (!a) return null;
  const c = Z(t, "graphic", "graphicData"), u = x(c, "tbl");
  if (u) {
    const f = _(x(u, "tblGrid"), "gridCol").map((B) => at(N(B, "w"))), p = Zi(x(u, "tblPr"), l, n.tableStyles), g = [], b = [];
    let y = 1e6 + o * 1e3;
    const k = _(u, "tr"), w = k.map((B, C) => {
      const P = [];
      let E = 0, j = 0;
      for (const z of _(B, "tc")) {
        const Q = Math.max(1, N(z, "gridSpan", 1));
        !lt(z, "hMerge") && E < j && (E = j);
        const V = E, W = f.slice(V, V + Q).reduce((Y, q) => Y + q, 0);
        if (E += 1, lt(z, "hMerge") || (j = V + Q), lt(z, "hMerge") || lt(z, "vMerge")) {
          P.push({
            covered: { h: lt(z, "hMerge") || void 0, v: lt(z, "vMerge") || void 0 },
            span: Q,
            rowSpan: 1,
            col: V,
            w: W,
            fill: { kind: "none" },
            border: null,
            sides: { l: null, r: null, t: null, b: null }
          });
          continue;
        }
        const X = x(z, "tcPr"), it = p ? p(C, V, k.length, f.length) : null, ft = it?.text ? { color: it.text } : void 0, tt = In(x(z, "txBody"), { levels: [n.defaultText], bodyPr: [], fontRef: ft }, l);
        if (tt && it?.bold && tt.paragraphs.forEach((Y) => Y.runs.forEach((q) => {
          q.bold === void 0 && (q.bold = !0);
        })), tt) {
          tt.insets = { l: at(N(X, "marL", 91440)), r: at(N(X, "marR", 91440)), t: at(N(X, "marT", 45720)), b: at(N(X, "marB", 45720)) }, tt.anchor = M(X, "anchor") === "ctr" ? "ctr" : M(X, "anchor") === "b" ? "b" : "t";
          const Y = hn(M(X, "vert"));
          Y ? tt.vert = Y : delete tt.vert;
        }
        const A = _t(X, l) ?? it?.fill ?? { kind: "none" }, H = (Y, q) => {
          const gt = zt(x(X, Y), l);
          return gt !== void 0 ? gt : it ? it.edges[q] ?? null : { width: 1, color: { hex: "#bfbfbf" } };
        }, K = { l: H("lnL", "l"), r: H("lnR", "r"), t: H("lnT", "t"), b: H("lnB", "b") }, kt = (Y, q) => !Y && !q || !!Y && !!q && Y.width === q.width && Y.color.hex === q.color.hex && (Y.color.alpha ?? 1) === (q.color.alpha ?? 1) && Y.dash === q.dash, mt = [K.r, K.t, K.b].every((Y) => kt(Y, K.l)) ? K.l : null;
        P.push({
          span: Q,
          rowSpan: Math.max(1, N(z, "rowSpan", 1)),
          col: V,
          w: W,
          text: tt,
          fill: A,
          border: mt,
          sides: K,
          ...mt === null && Object.values(K).some(Boolean) && { split: !0 }
        });
      }
      return P;
    }), v = (B, C) => B < C * 0.7 ? C : B, S = k.map((B, C) => v(
      at(N(B, "h")),
      Math.max(0, ...w[C].filter((P) => !P.covered && P.rowSpan === 1).map((P) => as(P.text, P.w)))
    ));
    w.forEach((B, C) => B.forEach((P) => {
      if (P.covered || P.rowSpan < 2) return;
      const E = Math.min(k.length, C + P.rowSpan) - 1, j = S.slice(C, E + 1).reduce((Q, V) => Q + V, 0), z = as(P.text, P.w);
      v(j, z) > j && (S[E] += z - j);
    }));
    let $ = a.y;
    const I = [], L = /* @__PURE__ */ new Set();
    if (w.forEach((B, C) => {
      const P = [];
      b.push({ h: S[C], cells: P });
      for (const E of B) {
        if (E.covered) {
          P.push({ fill: E.fill, borders: E.sides, hMerge: E.covered.h, vMerge: E.covered.v });
          continue;
        }
        const j = a.x + f.slice(0, E.col).reduce((Q, V) => Q + V, 0), z = S.slice(C, C + E.rowSpan).reduce((Q, V) => Q + V, 0);
        if (g.push({
          kind: "shape",
          id: y++,
          name: `${i} cell`,
          ...s({ x: j, y: $, w: E.w, h: z, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: E.fill,
          line: E.border,
          text: E.text
        }), E.split) {
          const Q = (V, W, X, it, ft) => {
            if (!ft) return;
            const tt = [V, W, X, it].map((A) => Math.round(A * 10)).join(",");
            L.has(tt) || (L.add(tt), I.push({
              kind: "connector",
              id: y++,
              name: `${i} rule`,
              ...s({ x: V, y: W, w: X - V, h: it - W, rot: 0, flipH: !1, flipV: !1 }),
              geom: { kind: "preset", prst: "line" },
              line: ft
            }));
          };
          Q(j, $, j + E.w, $, E.sides.t), Q(j, $ + z, j + E.w, $ + z, E.sides.b), Q(j, $, j, $ + z, E.sides.l), Q(j + E.w, $, j + E.w, $ + z, E.sides.r);
        }
        P.push({
          text: E.text ?? void 0,
          fill: E.fill,
          borders: E.sides,
          gridSpan: E.span > 1 ? E.span : void 0,
          rowSpan: E.rowSpan > 1 ? E.rowSpan : void 0
        });
      }
      $ += S[C];
    }), !g.length) return null;
    if (g.push(...I), p?.background) {
      const B = Le(g);
      g.unshift({
        kind: "shape",
        id: y++,
        name: `${i} background`,
        x: B.x,
        y: B.y,
        w: B.w,
        h: B.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: p.background,
        line: null
      });
    }
    const O = { kind: "group", id: o, name: i, ...Le(g), children: g }, F = s({ ...a, w: f.reduce((B, C) => B + C, 0), h: b.reduce((B, C) => B + C.h, 0) });
    if (p?.background || F.rot || F.flipH || F.flipV || b.some((B) => B.cells.length !== f.length)) return O;
    const T = F.w / Math.max(1e-6, f.reduce((B, C) => B + C, 0)), D = F.h / Math.max(1e-6, b.reduce((B, C) => B + C.h, 0)), R = (B) => lt(x(u, "tblPr"), B) ?? !1;
    return {
      kind: "table",
      id: o,
      name: i,
      x: F.x,
      y: F.y,
      w: F.w,
      h: F.h,
      cols: f.map((B) => B * T),
      rows: b.map((B) => ({ ...B, h: B.h * D })),
      firstRow: R("firstRow") || void 0,
      bandRow: R("bandRow") || void 0,
      fallback: O
    };
  }
  const h = M(c, "uri") || "";
  if (/diagram/.test(h)) {
    const f = sr(c, e, n, s, a, o, i, r);
    if (f) return f;
    const p = or(c, e, n, s, a, o, i, l);
    if (p) return p;
  }
  if (/drawingml\/2006\/chart$/.test(h)) {
    const f = nr(c, e, n);
    if (f) return { kind: "chart", id: o, name: i, ...s(a), chart: f };
  }
  const d = Ji(c, l, n);
  if (d) return d(o, i, s(a));
  const m = /chart/.test(h) ? "Chart" : /diagram/.test(h) ? "SmartArt diagram" : "Embedded object";
  return n.warnings.push(`${m} "${i}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: o,
    name: i,
    ...s(a),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${m}: ${i}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function Ji(t, e, n) {
  const s = bt(t, "oleObj", 3), o = M(t, "uri") || "";
  if (!s && /chart|diagram/.test(o)) return null;
  const i = s ? x(s, "pic") : null, r = i ? x(i, "blipFill") : bt(t, "blip", 8)?.parentElement ?? null;
  let l = r ? En(r, e) : null;
  if (!l && s && (l = Qi(e, M(s, "spid"))), !l) return null;
  const a = s ? M(s, "progId") || M(s, "name") || "Object" : o.split("/").pop() || "Object";
  n.warnings.push(`Embedded object "${a}" was imported as its preview picture; the object itself can't be edited in Yappy.`);
  const c = i ? x(i, "spPr") : null, u = c ? _t(c, e) : void 0, h = c ? zt(x(c, "ln"), e) : void 0, d = r ? x(r, "srcRect") : null, m = d ? { l: N(d, "l") / 1e5, t: N(d, "t") / 1e5, r: N(d, "r") / 1e5, b: N(d, "b") / 1e5 } : void 0;
  return (f, p, g) => {
    const b = { kind: "picture", id: f, name: p, ...g, media: l, crop: m };
    if ((!u || u.kind === "none") && !h) return b;
    const y = { x: g.x, y: g.y, w: g.w, h: g.h }, k = {
      kind: "shape",
      id: 2e6 + f,
      name: `${p} frame`,
      ...y,
      geom: { kind: "preset", prst: "rect" },
      fill: u ?? { kind: "none" },
      line: h ?? null
    };
    return { kind: "group", id: f, name: p, ...g, children: [k, { ...b, id: 21e5 + f, ...y }] };
  };
}
function Qi(t, e) {
  if (!e) return null;
  for (const n of t.pkg.rels(t.part).values()) {
    if (n.type !== "vmlDrawing" && n.type !== "legacyDrawing" || n.external) continue;
    const s = t.pkg.xml(n.target);
    if (s)
      for (const o of Array.from(s.getElementsByTagName("*"))) {
        if (o.localName !== "shape" || M(o, "id") !== e) continue;
        const i = Array.from(o.getElementsByTagName("*")).find((a) => a.localName === "imagedata"), r = M(i, "o:relid") || M(i, "r:id"), l = r ? t.pkg.rels(n.target).get(r) : void 0;
        return !l || l.external ? null : so(t.pkg, l.target);
      }
  }
  return null;
}
const cs = {
  barChart: "column",
  bar3DChart: "column",
  lineChart: "line",
  line3DChart: "line",
  areaChart: "area",
  area3DChart: "area",
  pieChart: "pie",
  pie3DChart: "pie",
  ofPieChart: "pie",
  doughnutChart: "doughnut",
  scatterChart: "scatter",
  bubbleChart: "bubble",
  radarChart: "radar",
  stockChart: "stock"
};
function tr(t) {
  const e = t.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/\\./g, "");
  return !/^general$/i.test(e.trim()) && /[dmy]/i.test(e) && !/[#0?]/.test(e);
}
const us = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function er(t, e, n = !1) {
  const s = Date.UTC(1899, 11, 30) + (Math.floor(t) + (n ? 1462 : 0)) * 864e5, o = new Date(s);
  if (!Number.isFinite(o.getTime())) return String(t);
  const i = o.getUTCFullYear(), r = o.getUTCMonth(), l = o.getUTCDate();
  return e.replace(/\[[^\]]*\]/g, "").replace(/;.*$/, "").replace(/"([^"]*)"|\\(.)|yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d|[hs]+|AM\/PM|[:.]?[hs]/gi, (c, u, h) => {
    if (u !== void 0) return u;
    if (h !== void 0) return h;
    switch (c.toLowerCase()) {
      case "yyyy":
        return String(i);
      case "yy":
        return String(i % 100).padStart(2, "0");
      case "mmmm":
        return us[r];
      case "mmm":
        return us[r].slice(0, 3);
      case "mm":
        return String(r + 1).padStart(2, "0");
      case "m":
        return String(r + 1);
      case "dddd":
        return o.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      case "ddd":
        return o.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      case "dd":
        return String(l).padStart(2, "0");
      case "d":
        return String(l);
      default:
        return "";
    }
  }).replace(/\s+$/, "").replace(/[:.\s]+$/, "");
}
function nr(t, e, n) {
  const s = bt(t, "chart", 2), o = s ? n.pkg.rels(e.part).get(M(s, "r:id") || "") : void 0, i = o && !o.external ? n.pkg.xml(o.target) : null, r = x(i, "chart"), l = x(r, "plotArea");
  if (!l) return null;
  const a = It(l).find((A) => cs[A.localName]);
  if (!a) return null;
  const c = It(l).filter((A) => /Chart$/.test(A.localName)), u = (A) => {
    let H = cs[A.localName];
    return H === "column" && M(x(A, "barDir"), "val") === "bar" && (H = "bar"), H === "radar" && M(x(A, "radarStyle"), "val") === "filled" && (H = "filledRadar"), H;
  }, h = u(a), d = We(h), m = c.filter((A) => d ? We(u(A)) : A.localName === a.localName), f = c.filter((A) => !m.includes(A)).map((A) => A.localName.replace(/(3D)?Chart$/, ""));
  f.length && n.warnings.push(`A combination chart came in without its ${[...new Set(f)].join(" and ")} part.`);
  const p = new Set(_(l, "valAx").map((A) => M(x(A, "axId"), "val"))), g = (A) => _(A, "axId").map((H) => M(H, "val")).find((H) => p.has(H)) ?? null, b = g(m[0]), y = h === "scatter" || h === "bubble", k = M(x(i, "date1904"), "val") === "1", w = M(x(a, "grouping"), "val") || "";
  let v = n.ctx;
  const S = n.pkg.relOfType(o.target, "themeOverride"), $ = S ? x(n.pkg.xml(S), "clrScheme") : null;
  if ($) {
    const A = { ...v.theme.colors, ...no($) };
    v = { ...v, theme: { ...v.theme, colors: A } };
  }
  const I = x(i, "clrMapOvr");
  if (I && I.attributes.length) {
    const A = { ...v.clrMap };
    for (let H = 0; H < I.attributes.length; H++) A[I.attributes[H].localName ?? I.attributes[H].name] = I.attributes[H].value;
    v = { ...v, clrMap: A };
  }
  const L = (A, H = !1) => {
    const K = bt(A, "strCache", 3) ?? bt(A, "numCache", 3) ?? bt(A, "strLit", 2) ?? bt(A, "numLit", 2) ?? x(bt(A, "multiLvlStrCache", 3), "lvl");
    if (!K) return [];
    const kt = Math.min(1e4, N(x(K, "ptCount"), "val")), mt = new Array(Math.max(0, kt)).fill(""), Y = /num/.test(K.localName) ? x(K, "formatCode")?.textContent ?? "" : "", q = H && !!Y && tr(Y);
    for (const gt of _(K, "pt")) {
      const dt = N(gt, "idx");
      if (!(dt >= 0 && dt < 1e4)) continue;
      const st = x(gt, "v")?.textContent ?? "";
      mt[dt] = q && st.trim() && Number.isFinite(Number(st)) ? er(Number(st), M(gt, "formatCode") || Y, k) : st;
    }
    return mt;
  }, O = m.flatMap((A) => _(A, "ser").map((H) => ({ el: H, kind: u(A), secondary: d && g(A) !== b }))).slice(0, 64), F = O.map((A) => A.el);
  if (!F.length) return null;
  const T = (A) => L(A).map((H) => H === "" ? null : Number.isFinite(Number(H)) ? Number(H) : null), D = (A) => L(x(A, y ? "xVal" : "cat") ?? x(A, "cat"), !0);
  let R = D(F[0]), B = F.map((A, H) => {
    const K = T(x(A, y ? "yVal" : "val") ?? x(A, "val")), kt = h === "bubble" ? T(x(A, "bubbleSize")) : null, mt = L(x(A, "tx"))[0] || x(A, "tx")?.textContent?.trim() || `Series ${H + 1}`, Y = x(A, "spPr"), q = ht(x(Y, "solidFill"), v) ?? ht(x(x(Y, "ln"), "solidFill"), v) ?? ht(x(Z(A, "marker", "spPr"), "solidFill"), v), gt = O[H].kind;
    return {
      name: mt,
      values: K,
      ...kt && { sizes: kt },
      ...q && { color: q.hex },
      ...d && We(gt) && gt !== h && { kind: gt },
      ...O[H].secondary && { secondary: !0 }
    };
  });
  if (y && F.length > 1) {
    const A = F.map(D);
    if (!A.every((K) => !K.length || K.length === R.length && K.every((kt, mt) => kt === R[mt]))) {
      const K = B.map((Y, q) => {
        const gt = A[q].length ? A[q] : R;
        return Math.max(gt.length, Y.values.length);
      }), kt = K.reduce((Y, q) => Y + q, 0), mt = [];
      B = B.map((Y, q) => {
        const gt = A[q].length ? A[q] : R, dt = mt.length;
        for (let ot = 0; ot < K[q]; ot++) mt.push(gt[ot] ?? "");
        const st = new Array(kt).fill(null), et = Y.sizes ? new Array(kt).fill(null) : void 0;
        for (let ot = 0; ot < K[q]; ot++)
          st[dt + ot] = Y.values[ot] ?? null, et && (et[dt + ot] = Y.sizes?.[ot] ?? null);
        return { ...Y, values: st, ...et && { sizes: et } };
      }), R = mt, n.warnings.push("A scatter chart's series had their own X values; they were merged into one X column.");
    }
  }
  y && (R = R.map((A) => A.trim() && Number.isFinite(Number(A)) ? String(Number(Number(A).toPrecision(15))) : A));
  const C = Math.max(R.length, ...B.map((A) => Math.max(A.values.length, A.sizes?.length ?? 0)));
  for (; R.length < C; ) R.push(String(R.length + 1));
  const P = M(x(a, "scatterStyle"), "val") || "marker", E = h === "scatter" && /line|smooth/i.test(P) && F.some((A) => !x(x(x(A, "spPr"), "ln"), "noFill")), j = E && (/smooth/i.test(P) || F.some((A) => ["1", "true"].includes(M(x(A, "smooth"), "val") || ""))), z = x(r, "title"), Q = z ? je(z, "t", 8).map((A) => A.textContent ?? "").join("").trim() || (B.length === 1 ? B[0].name : "") : "", V = M(Z(r, "legend", "legendPos"), "val"), W = y && _(l, "valAx").find((A) => /^[lr]$/.test(M(x(A, "axPos"), "val") || "")) || b !== null && _(l, "valAx").find((A) => M(x(A, "axId"), "val") === b) || x(l, "valAx"), X = x(W, "scaling"), it = (A) => {
    const H = x(A, "dLbls");
    return !!H && (M(x(H, "showVal"), "val") === "1" || M(x(H, "showPercent"), "val") === "1");
  }, ft = M(x(X, "max"), "val"), tt = M(x(X, "min"), "val");
  return {
    kind: h,
    categories: R,
    series: B,
    ...Q && { title: Q },
    ...(w === "stacked" || w === "percentStacked") && { stacked: !0 },
    ...w === "percentStacked" && { percent: !0 },
    legend: x(r, "legend") ? V === "b" ? "bottom" : V === "t" ? "top" : "right" : "none",
    ...(it(a) || F.some(it)) && { dataLabels: !0 },
    gridlines: !!x(W, "majorGridlines"),
    ...ft !== null && Number.isFinite(Number(ft)) && { yMax: Number(ft) },
    ...tt !== null && Number.isFinite(Number(tt)) && { yMin: Number(tt) },
    ...E && { lines: !0 },
    ...j && { smooth: !0 }
  };
}
function sr(t, e, n, s, o, i, r, l) {
  const a = n.pkg.rels(e.part), c = M(x(t, "relIds"), "r:dm"), u = c ? a.get(c) : void 0;
  let h;
  if (u && !u.external) {
    const b = bt(n.pkg.xml(u.target), "dataModelExt", 6), y = b ? a.get(M(b, "relId") || "") : void 0;
    y && !y.external && (h = y.target);
  }
  if (!h) {
    const b = [...a.values()].filter((y) => y.type === "diagramDrawing" && !y.external);
    b.length === 1 && (h = b[0].target);
  }
  if (!h) return null;
  const d = x(n.pkg.xml(h), "spTree");
  if (!d) return null;
  const f = xe(d, { part: h, tree: d }, n, (b) => s({ ...b, x: b.x + o.x, y: b.y + o.y }), l + 1, !0);
  if (!f.length) return null;
  let p = 2e6 + i * 1e3;
  const g = (b) => b.forEach((y) => {
    y.id = p++, y.kind === "group" && g(y.children);
  });
  return g(f), { kind: "group", id: i, name: r, ...Le(f), children: f };
}
function or(t, e, n, s, o, i, r, l) {
  const a = M(x(t, "relIds"), "r:dm"), c = a ? n.pkg.rels(e.part).get(a) : void 0;
  if (!c || c.external) return null;
  const u = n.pkg.xml(c.target), h = /* @__PURE__ */ new Map();
  for (const b of _(x(u, "ptLst"), "pt")) h.set(M(b, "modelId") || "", b);
  const d = /* @__PURE__ */ new Map();
  for (const b of _(x(u, "cxnLst"), "cxn")) {
    if ((M(b, "type") || "parOf") !== "parOf") continue;
    const y = M(b, "srcId") || "", k = M(b, "destId") || "";
    d.has(y) || d.set(y, []), d.get(y).push({ id: k, ord: N(b, "srcOrd") });
  }
  const m = [...h.values()].find((b) => M(b, "type") === "doc");
  if (!m) return null;
  const f = [], p = /* @__PURE__ */ new Set(), g = (b, y) => {
    if (!(p.has(b) || y > 16 || f.length > 500)) {
      p.add(b);
      for (const k of (d.get(b) ?? []).sort((w, v) => w.ord - v.ord)) {
        const w = h.get(k.id), v = M(w, "type") || "node";
        if (!w || v !== "node" && v !== "asst") continue;
        const S = In(x(w, "t"), { levels: [n.defaultText], bodyPr: [] }, l);
        for (const $ of S?.paragraphs ?? [])
          $.runs.some((I) => !I.br && I.text.trim()) && f.push({
            ...$,
            align: "l",
            level: y,
            ...y > 0 ? { bullet: "char" } : {},
            runs: $.runs.map((I) => ({ ...I, size: I.size ?? (y > 0 ? 16 : 18), bold: I.bold ?? (y === 0 ? !0 : void 0) }))
          });
        g(k.id, y + 1);
      }
    }
  };
  return g(M(m, "modelId") || "", 0), f.length ? (n.warnings.push(`SmartArt diagram "${r}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: i,
    name: r,
    ...s(o),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: f, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function bt(t, e, n) {
  if (!t || n < 0) return null;
  for (const s of It(t)) {
    if (s.localName === e) return s;
    const o = bt(s, e, n - 1);
    if (o) return o;
  }
  return null;
}
function Ze(t, e) {
  const n = x(t, "bg");
  if (!n) return;
  const s = x(n, "bgPr");
  if (s)
    return _t(s, e);
  const o = x(n, "bgRef");
  if (o) {
    const i = N(o, "idx"), l = (i >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[i >= 1001 ? i - 1001 : i - 1];
    return (l ? Tn(l, { ...e, ctx: { ...e.ctx, phClr: ht(o, e.ctx) ?? void 0 } }) : void 0) ?? (ht(o, e.ctx) ? { kind: "solid", color: ht(o, e.ctx) } : void 0);
  }
}
function ir(t, e) {
  const n = t.relOfType(e, "notesSlide"), s = n ? Z(t.xml(n), "cSld", "spTree") : null;
  if (!s) return;
  const o = [], i = (l) => {
    for (const a of It(l)) {
      if (a.localName === "grpSp") {
        i(a);
        continue;
      }
      if (a.localName !== "sp") continue;
      const c = ie(ge(a));
      if (!(!c || c.type !== "body" && c.type !== "obj"))
        for (const u of _(x(a, "txBody"), "p")) {
          let h = "";
          for (const d of _(u))
            d.localName === "r" || d.localName === "fld" ? h += x(d, "t")?.textContent ?? "" : d.localName === "br" && (h += `
`);
          o.push(h);
        }
    }
  };
  i(s);
  const r = o.join(`
`).replace(/\s+$/, "");
  return r.trim() ? r : void 0;
}
function rr(t) {
  for (const l of _(t, "AlternateContent"))
    for (const a of _(l, "Choice")) {
      const c = x(a, "transition");
      if (c && x(c, "morph")) {
        const u = M(c, "spd");
        return { kind: "morph", durationMs: M(c, "p14:dur") !== null ? N(c, "p14:dur") : u === "fast" ? 500 : u === "slow" ? 1e3 : 750 };
      }
    }
  const e = It(t).find((l) => l.localName === "transition");
  if (!e) return;
  const n = _(e).find((l) => l.localName !== "sndAc" && l.localName !== "extLst");
  if (!n) return;
  const s = M(e, "spd"), o = M(e, "p14:dur") !== null ? N(e, "p14:dur") : s === "fast" ? 500 : s === "slow" ? 1e3 : 750, i = M(n, "dir"), r = (l) => l?.[0] === "r" || l?.[0] === "u" || l?.[0] === "d" ? l[0] : "l";
  switch (n.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: n.localName, dir: r(i), durationMs: o };
    case "split":
      return { kind: "split", orient: M(n, "orient") === "vert" ? "vert" : "horz", inward: i === "in" || void 0, durationMs: o };
    case "zoom":
      return { kind: "zoom", zoomIn: i !== "out", durationMs: o };
    case "morph":
      return { kind: "morph", durationMs: o };
    case "cut":
      return;
    default:
      return { kind: "fade", durationMs: o };
  }
}
function lr(t, e) {
  const n = Z(t, "timing", "tnLst");
  if (!n) return [];
  const s = [];
  let o = 0;
  const i = [], r = (l, a) => {
    if (!(a > 40))
      for (const c of It(l)) {
        if (c.localName === "seq") {
          const u = x(c, "cTn"), h = M(u, "nodeType");
          if (h && h !== "mainSeq") {
            ar(u) || o++;
            continue;
          }
        }
        if (!(c.localName === "cTn" && M(c, "presetClass") === "mediacall")) {
          if (c.localName === "cTn" && M(c, "presetClass")) {
            i.push(c);
            continue;
          }
          r(c, a + 1);
        }
      }
  };
  r(n, 0);
  for (const l of i) {
    const a = M(l, "presetClass");
    if (a !== "entr" && a !== "exit" && a !== "emph") {
      o++;
      continue;
    }
    const c = N(l, "presetID"), u = N(l, "presetSubtype"), h = M(l, "nodeType"), d = h === "clickEffect" ? "click" : h === "afterEffect" ? "after" : "with", m = Number(M(Z(l, "stCondLst", "cond"), "delay")), f = je(x(l, "childTnLst"), "cBhvr", 4), p = f.map(($) => bt($, "spTgt", 2)).find(Boolean), g = p ? N(p, "spid") : NaN;
    if (!Number.isFinite(g) || bt(p, "txEl", 1)) {
      o++;
      continue;
    }
    const b = f.map(($) => Number(M(x($, "cTn"), "dur"))).filter(($) => Number.isFinite($) && $ > 1), y = b.length ? Math.max(...b) : 500, { effect: k, known: w } = Zo(a, c);
    w || e(`An animation PowerPoint calls preset ${c} (${a}) came in as a plain ${k}.`);
    const v = je(x(l, "childTnLst"), "animRot", 2)[0], S = M(l, "repeatCount");
    s.push({
      target: g,
      cls: a,
      effect: k,
      presetId: c,
      subtype: u,
      start: d,
      durationMs: y,
      delayMs: Number.isFinite(m) ? Math.max(0, m) : 0,
      ...qn(u) && (k === "fly" || k === "wipe") && { dir: qn(u) },
      ...k === "spin" && v && { degrees: N(v, "by") / 6e4 },
      ...S === "indefinite" ? { repeat: -1 } : S && Number(S) > 1e3 ? { repeat: Math.round(Number(S) / 1e3) } : {}
    });
  }
  return o && e(`${o} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), s;
}
function ar(t) {
  const e = Vt(t, "cTn", 12).filter((n) => M(n, "presetClass"));
  return e.length > 0 && e.every((n) => M(n, "presetClass") === "mediacall");
}
function cr(t, e) {
  const n = Z(t, "timing", "tnLst");
  if (!n) return;
  const s = /* @__PURE__ */ new Map(), o = (l) => l.forEach((a) => {
    a.kind === "media" ? s.set(a.id, a) : a.kind === "group" && o(a.children);
  });
  if (o(e), !s.size) return;
  const i = (l) => {
    const a = bt(l, "spTgt", 6);
    return a ? N(a, "spid", NaN) : NaN;
  };
  for (const l of [...Vt(n, "video", 12), ...Vt(n, "audio", 12)]) {
    const a = x(l, "cMediaNode"), c = s.get(i(x(a, "tgtEl")));
    if (!a || !c) continue;
    const u = M(a, "vol");
    (lt(a, "mute") || u !== null && Number(u) === 0) && (c.muted = !0), M(x(a, "cTn"), "repeatCount") === "indefinite" && (c.loop = !0);
  }
  const r = Vt(n, "cTn", 8).find((l) => M(l, "nodeType") === "mainSeq");
  if (r)
    for (const l of Vt(r, "cTn", 40).filter((a) => M(a, "presetClass"))) {
      if (M(l, "nodeType") === "clickEffect") break;
      if (M(l, "presetClass") !== "mediacall") continue;
      const a = Vt(l, "cmd", 3)[0];
      if (!/^playFrom/.test(M(a, "cmd") || "")) continue;
      const c = s.get(i(a));
      c && (c.autoplay = !0);
    }
}
function Vt(t, e, n) {
  if (!t || n < 0) return [];
  const s = [];
  for (const o of It(t))
    o.localName === e && s.push(o), s.push(...Vt(o, e, n - 1));
  return s;
}
function je(t, e, n) {
  if (!t || n < 0) return [];
  const s = [];
  for (const o of It(t))
    o.localName === e ? s.push(o) : s.push(...je(o, e, n - 1));
  return s;
}
function hs(t) {
  const e = It(t).find((o) => o.localName === "transition"), n = e ? M(e, "advTm") : null, s = n !== null ? Number(n) : NaN;
  return Number.isFinite(s) && s > 0 ? s : void 0;
}
function ur(t, e) {
  const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  for (const i of _(x(t, "sldIdLst"), "sldId")) {
    const r = e.get(M(i, "r:id") || ""), l = M(i, "id");
    r && l && s.set(l, r.target);
  }
  const o = bt(x(t, "extLst"), "sectionLst", 4);
  for (const i of _(o, "section")) {
    const r = (M(i, "name") || "").trim(), l = _(x(i, "sldIdLst"), "sldId")[0], a = l ? s.get(M(l, "id") || "") : void 0;
    r && a && !n.has(a) && n.set(a, r);
  }
  return n;
}
function hr(t, e = {}) {
  const n = [], s = (T) => {
    n.length < 200 && !n.includes(T) && n.push(T);
  }, o = e.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let i, r = 0, l = 0;
  try {
    i = Wo(t, {
      filter: (T) => (r++, l += T.originalSize, r <= Qn && T.originalSize <= xi && l <= ts)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (r > Qn || l > ts) && s("The file is very large; some parts were skipped.");
  const a = new Si(i, o, s), c = a.relOfType("", "officeDocument") ?? "ppt/presentation.xml", u = a.xml(c);
  if (!u || u.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const h = x(u, "sldSz"), d = h ? Math.max(1, at(N(h, "cx", 9144e3))) : 960, m = h ? Math.max(1, at(N(h, "cy", 5143500))) : 540, f = x(u, "defaultTextStyle"), p = a.rels(c), g = a.relOfType(c, "tableStyles"), b = g ? a.xml(g) : null, y = [], k = /* @__PURE__ */ new Set();
  for (const T of _(x(u, "sldIdLst"), "sldId")) {
    const D = p.get(M(T, "r:id") || "");
    D && !k.has(D.target) && y.length < yi && (k.add(D.target), y.push(D.target));
  }
  const w = /* @__PURE__ */ new Map(), v = (T) => {
    const D = a.relOfType(T, "theme");
    return D ? (w.has(D) || w.set(D, Ve(a.xml(D))), w.get(D)) : Ve(null);
  }, S = (T) => {
    if (!T) return null;
    const D = {};
    for (let R = 0; R < T.attributes.length; R++) D[T.attributes[R].localName ?? T.attributes[R].name] = T.attributes[R].value;
    return D;
  }, $ = ur(u, p), I = [];
  y.forEach((T, D) => {
    const R = a.xml(T);
    if (!R) {
      s(`Slide ${D + 1} couldn't be read and was skipped.`);
      return;
    }
    const B = a.relOfType(T, "slideLayout"), C = B ? a.xml(B) : null, P = B ? a.relOfType(B, "slideMaster") : null, E = P ? a.xml(P) : null, j = P ? v(P) : Ve(null), z = S(Z(R, "clrMapOvr", "overrideClrMapping")) ?? S(Z(C, "clrMapOvr", "overrideClrMapping")) ?? S(x(E, "clrMap")) ?? On, Q = { theme: j, clrMap: z }, V = x(E, "txStyles"), W = {
      pkg: a,
      ctx: Q,
      slide: { part: T, tree: Z(R, "cSld", "spTree") },
      layout: B ? { part: B, tree: Z(C, "cSld", "spTree") } : null,
      master: P ? { part: P, tree: Z(E, "cSld", "spTree") } : null,
      masterTx: { title: x(V, "titleStyle"), body: x(V, "bodyStyle"), other: x(V, "otherStyle") },
      defaultText: f,
      warnings: n,
      count: 0,
      tableStyles: b
    }, X = (K) => ({ pkg: a, part: K?.part ?? T, ctx: Q }), it = Ze(x(R, "cSld"), X(W.slide)) ?? Ze(x(C, "cSld"), X(W.layout)) ?? Ze(x(E, "cSld"), X(W.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    W.background = it;
    const ft = [], tt = lt(R, "showMasterSp") !== !1 && lt(C, "showMasterSp") !== !1;
    W.master && tt && ft.push(...xe(W.master.tree, W.master, W, qe, 0, !1)), W.layout && lt(R, "showMasterSp") !== !1 && ft.push(...xe(W.layout.tree, W.layout, W, qe, 0, !1));
    const A = xe(W.slide.tree, W.slide, W, qe, 0, !0);
    cr(R, A), ft.push(...A), I.push({
      items: ft,
      background: it,
      transition: rr(R),
      name: M(x(R, "cSld"), "name") || void 0,
      notes: ir(a, T),
      key: T,
      ...M(R, "show") === "0" && { hidden: !0 },
      ...hs(R) && { advanceAfterMs: hs(R) },
      ...$.has(T) && { section: $.get(T) }
    });
    const H = lr(R, s);
    H.length && (I[I.length - 1].anims = H);
  }), I.length || s("The presentation has no slides.");
  const L = Z(a.xml("docProps/core.xml"), "title")?.textContent || void 0, O = a.relOfType(c, "presProps"), F = M(x(O ? a.xml(O) : null, "showPr"), "loop");
  return { deck: { width: d, height: m, slides: I, title: L, ...(F === "1" || F === "true") && { loop: !0 } }, warnings: n };
}
class lo extends Error {
  constructor() {
    super("short read");
  }
}
class Kt {
  b;
  view;
  constructor(e) {
    this.b = e, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
  }
  get length() {
    return this.b.length;
  }
  need(e, n) {
    if (!Number.isInteger(e) || e < 0 || n < 0 || e + n > this.b.length) throw new lo();
    return e;
  }
  /** `len` bytes at `off`. */
  slice(e, n) {
    return this.need(e, n), this.b.subarray(e, e + n);
  }
  /** Everything from `off`. */
  tail(e) {
    return this.need(e, 0), new Kt(this.b.subarray(e));
  }
  sub(e, n) {
    return new Kt(this.slice(e, n));
  }
  u8(e) {
    return this.b[this.need(e, 1)];
  }
  u16(e) {
    return this.view.getUint16(this.need(e, 2), !0);
  }
  i16(e) {
    return this.view.getInt16(this.need(e, 2), !0);
  }
  u32(e) {
    return this.view.getUint32(this.need(e, 4), !0);
  }
  i32(e) {
    return this.view.getInt32(this.need(e, 4), !0);
  }
  f32(e) {
    return this.view.getFloat32(this.need(e, 4), !0);
  }
  optU8(e) {
    return e >= 0 && e + 1 <= this.b.length ? this.b[e] : void 0;
  }
  optU16(e) {
    return e >= 0 && e + 2 <= this.b.length ? this.view.getUint16(e, !0) : void 0;
  }
  optI16(e) {
    return e >= 0 && e + 2 <= this.b.length ? this.view.getInt16(e, !0) : void 0;
  }
  optU32(e) {
    return e >= 0 && e + 4 <= this.b.length ? this.view.getUint32(e, !0) : void 0;
  }
  optI32(e) {
    return e >= 0 && e + 4 <= this.b.length ? this.view.getInt32(e, !0) : void 0;
  }
  /** `n` consecutive (x, y) pairs of 16- or 32-bit signed integers starting at `off`. */
  points(e, n, s) {
    const o = s ? 8 : 4;
    this.need(e, n * o);
    const i = new Array(n);
    for (let r = 0; r < n; r++) {
      const l = e + r * o;
      i[r] = s ? [this.view.getInt32(l, !0), this.view.getInt32(l + 4, !0)] : [this.view.getInt16(l, !0), this.view.getInt16(l + 2, !0)];
    }
    return i;
  }
}
function yt(t) {
  try {
    return t();
  } catch (e) {
    if (e instanceof lo) return;
    throw e;
  }
}
const nt = (t) => ({ k: "M", p: t }), ct = (t) => ({ k: "L", p: t }), St = (t, e, n) => ({ k: "C", a: t, b: e, p: n }), pt = { k: "Z" }, fn = Math.PI * 2, Wt = Math.PI / 2;
function Ht(t, e) {
  const n = t % e;
  return n < 0 ? n + Math.abs(e) : n;
}
function Ct(t, e, n, s) {
  return [nt([t, e]), ct([n, e]), ct([n, s]), ct([t, s]), pt];
}
function ao(t, e, n, s, o, i) {
  const r = Math.min(t, n), l = Math.max(t, n), a = Math.min(e, s), c = Math.max(e, s), u = Math.min(Math.abs(o / 2), (l - r) / 2), h = Math.min(Math.abs(i / 2), (c - a) / 2);
  return [
    nt([r + u, a]),
    ct([l - u, a]),
    ...Yt(l - u, a + h, u, h, -Wt, Wt),
    ct([l, c - h]),
    ...Yt(l - u, c - h, u, h, 0, Wt),
    ct([r + u, c]),
    ...Yt(r + u, c - h, u, h, Wt, Wt),
    ct([r, a + h]),
    ...Yt(r + u, a + h, u, h, Math.PI, Wt),
    pt
  ];
}
function co(t, e, n, s) {
  const [o, i, r, l] = ho(t, e, n, s);
  return [nt([o + r, i]), ...Yt(o, i, r, l, 0, fn), pt];
}
function uo(t, e, n, s, o, i, r, l = !1) {
  const [a, c, u, h] = ho(t, e, n, s), d = (k) => Math.atan2((k[1] - c) / Math.max(h, Number.MIN_VALUE), (k[0] - a) / Math.max(u, Number.MIN_VALUE)), m = d(o), f = d(i);
  let p = Ht(l ? f - m : m - f, fn);
  p < 1e-12 && (p = fn);
  const g = l ? p : -p, b = [a + u * Math.cos(m), c + h * Math.sin(m)], y = r === "pie" ? [nt([a, c]), ct(b)] : [nt(b)];
  return y.push(...Yt(a, c, u, h, m, g)), r === "chord" ? y.push(pt) : r === "pie" && y.push(ct([a, c]), pt), y;
}
function ho(t, e, n, s) {
  return [(t + n) / 2, (e + s) / 2, Math.abs(n - t) / 2, Math.abs(s - e) / 2];
}
function Yt(t, e, n, s, o, i) {
  const r = Math.min(8, Math.max(1, Math.ceil(Math.abs(i) / Wt))), l = i / r, a = 4 / 3 * Math.tan(l / 4), c = (h) => [t + n * Math.cos(h), e + s * Math.sin(h)], u = [];
  for (let h = 0; h < r; h++) {
    const d = o + l * h, m = d + l, f = c(d), p = c(m), g = [f[0] - a * n * Math.sin(d), f[1] + a * s * Math.cos(d)], b = [p[0] + a * n * Math.sin(m), p[1] - a * s * Math.cos(m)];
    u.push(St(g, b, p));
  }
  return u;
}
function dn(t, e, n) {
  const s = [];
  let o = 0;
  for (const i of e) {
    const r = Math.min(o + i, t.length);
    if (r > o) {
      s.push(nt(t[o]));
      for (let l = o + 1; l < r; l++) s.push(ct(t[l]));
      n && s.push(pt);
    }
    o = r;
  }
  return s;
}
const Jt = 64, fo = 1, fr = 2, dr = 3, pr = 4, po = 5;
function Et(t) {
  const [e, n, s, o] = t;
  if (![e, n, s, o].every(Number.isFinite)) return null;
  const i = Math.min(e, s), r = Math.max(e, s), l = Math.min(n, o), a = Math.max(n, o);
  return r - i > 1e-6 && a - l > 1e-6 ? [i, l, r, a] : null;
}
function Rn(t, e) {
  const n = Math.max(t[0], e[0]), s = Math.max(t[1], e[1]), o = Math.min(t[2], e[2]), i = Math.min(t[3], e[3]);
  return o - n > 1e-6 && i - s > 1e-6 && [n, s, o, i].every(Number.isFinite) ? [n, s, o, i] : null;
}
function mr(t, e) {
  const n = Rn(t, e);
  if (!n) return [t];
  const s = [], o = (i) => {
    i && s.push(i);
  };
  return n[1] > t[1] && o(Et([t[0], t[1], t[2], n[1]])), n[3] < t[3] && o(Et([t[0], n[3], t[2], t[3]])), n[0] > t[0] && o(Et([t[0], n[1], n[0], n[3]])), n[2] < t[2] && o(Et([n[2], n[1], t[2], n[3]])), s;
}
const pn = (t) => t.slice(0, Jt);
function oe(t, e) {
  let n = t;
  for (const s of e) {
    const o = [];
    for (const i of n)
      for (const r of mr(i, s)) {
        if (o.length >= Jt) return o;
        o.push(r);
      }
    n = o;
  }
  return n;
}
function gr(t, e) {
  const n = Et(e);
  return n ? t === null ? [n] : pn(t.map((s) => Rn(s, n)).filter((s) => s !== null)) : [];
}
function br(t, e, n) {
  const s = Et(e);
  if (!s) return t;
  if (t !== null) return oe(t, [s]);
  const o = n && Et(n);
  return o ? oe([o], [s]) : null;
}
function xr(t, e, n, s) {
  const o = pn(e.map(Et).filter((i) => i !== null));
  switch (n) {
    case po:
      return o;
    case fo: {
      if (t === null) return o;
      const i = [];
      for (const r of t)
        for (const l of o) {
          if (i.length >= Jt) return i;
          const a = Rn(r, l);
          a && i.push(a);
        }
      return i;
    }
    case fr:
      return t === null ? null : pn([...t, ...o]);
    case pr: {
      if (t !== null) return oe(t, o);
      const i = s && Et(s);
      return i ? oe([i], o) : null;
    }
    case dr: {
      if (t === null) return null;
      const i = oe(t, o);
      for (const r of oe(o, t)) {
        if (i.length >= Jt) break;
        i.push(r);
      }
      return i;
    }
    default:
      return t;
  }
}
const yr = 2e5, fs = 4096, mo = 4e7, kr = 1024, le = 2e6, mn = 256 * 1024 * 1024, ds = 56, wr = 0, Ke = 3, Mr = 256, vr = 8913094, Sr = 15597702, Cr = 6684742;
function go(t) {
  const e = t.u32(0), n = t.i32(4), s = t.i32(8), o = t.u16(14), i = t.u32(16), r = t.u32(32);
  if (e < 40 || n <= 0 || s === 0 || ![1, 4, 8, 16, 24, 32].includes(o) || i !== wr && i !== Ke) return null;
  const l = i === Ke ? [t.u32(40), t.u32(44), t.u32(48)] : o === 16 ? [31744, 992, 31] : [16711680, 65280, 255], c = e + (i === Ke && e === 40 ? 12 : 0), u = o <= 8 ? r === 0 ? 1 << o : Math.min(r, 1 << o) : Math.min(r, Mr);
  return { w: n, h: Math.abs(s), topDown: s < 0, bpp: o, masks: l, palOff: c, palN: u };
}
function Fn(t) {
  const e = go(t);
  return e ? e.palOff + e.palN * 4 : null;
}
function Ce(t, e, n) {
  const s = go(t);
  if (!s) return null;
  const o = s.w * s.h;
  if (o === 0 || o > mo) return null;
  const i = Math.floor((s.w * s.bpp + 31) / 32) * 4, r = e.slice(0, i * s.h), l = t.slice(s.palOff, s.palN * 4), a = new Uint8Array(o * 4), [c, u, h] = s.masks;
  for (let d = 0; d < s.h; d++) {
    const m = (s.topDown ? d : s.h - 1 - d) * i;
    for (let f = 0; f < s.w; f++) {
      const p = (d * s.w + f) * 4;
      let g = 0, b = 0, y = 0, k = 255;
      switch (s.bpp) {
        case 1:
          [g, b, y] = Je(l, r[m + (f >> 3)] >> 7 - f % 8 & 1);
          break;
        case 4: {
          const w = r[m + (f >> 1)];
          [g, b, y] = Je(l, f % 2 === 0 ? w >> 4 : w & 15);
          break;
        }
        case 8:
          [g, b, y] = Je(l, r[m + f]);
          break;
        case 24: {
          const w = m + f * 3;
          y = r[w], b = r[w + 1], g = r[w + 2];
          break;
        }
        case 16: {
          const w = m + f * 2, v = r[w] | r[w + 1] << 8;
          g = ee(v, c), b = ee(v, u), y = ee(v, h);
          break;
        }
        default: {
          const w = m + f * 4, v = (r[w] | r[w + 1] << 8 | r[w + 2] << 16 | r[w + 3] << 24) >>> 0;
          g = ee(v, c), b = ee(v, u), y = ee(v, h), k = n ? r[w + 3] : 255;
        }
      }
      a[p] = g, a[p + 1] = b, a[p + 2] = y, a[p + 3] = k;
    }
  }
  return { w: s.w, h: s.h, bottomUp: !s.topDown, px: a };
}
function Je(t, e) {
  const n = e * 4;
  return n + 4 <= t.length ? [t[n + 2], t[n + 1], t[n]] : [0, 0, 0];
}
function Pr(t) {
  let e = 0;
  for (; e < 32 && (t >>> e & 1) === 0; ) e++;
  return e;
}
function ee(t, e) {
  if (e === 0) return 0;
  const n = Pr(e), s = e >>> n, o = (t & e) >>> 0 >>> n;
  return Math.floor((o * 255 + Math.floor(s / 2)) / s);
}
function Bn(t, e, n) {
  const s = t.w, o = t.h, [i, r, l, a] = e[2] > 0 && e[3] > 0 ? e : [0, 0, s, o], c = t.bottomUp ? o - r - a : r, u = Math.max(i, 0), h = Math.min(i + l, s), d = Math.max(c, 0), m = Math.min(c + a, o);
  if (h <= u || m <= d) return null;
  const f = n[2] / l, p = n[3] / a, g = [n[0] + (u - i) * f, n[1] + (d - c) * p, (h - u) * f, (m - d) * p], b = h - u, y = m - d, k = new Uint8Array(b * y * 4);
  for (let w = d; w < m; w++) {
    const v = (w * t.w + u) * 4;
    if (v + b * 4 > t.px.length) return null;
    k.set(t.px.subarray(v, v + b * 4), (w - d) * b * 4);
  }
  return { img: { w: b, h: y, bottomUp: !1, px: k }, dst: g };
}
function bo(t, e) {
  const n = t.px;
  if (e.kind === "rop") {
    e.rop === vr ? ps(n, 255) : (e.rop === Sr || e.rop === Cr) && ps(n, 0);
    return;
  }
  for (let s = 0; s + 3 < n.length; s += 4)
    e.perPixel && Ar(n, s), n[s + 3] = Math.floor(n[s + 3] * e.constant / 255);
}
function ps(t, e) {
  for (let n = 0; n + 3 < t.length; n += 4) t[n] === e && t[n + 1] === e && t[n + 2] === e && (t[n + 3] = 0);
}
function Ar(t, e) {
  const n = t[e + 3];
  if (!(n === 0 || n === 255))
    for (let s = 0; s < 3; s++) t[e + s] = Math.min(255, Math.floor((t[e + s] * 255 + Math.floor(n / 2)) / n));
}
function Dn(t, e, n) {
  const { w: s, h: o, px: i } = t;
  if (s === 0 || o === 0) return;
  const r = s * 4, l = Math.min(o, Math.floor(i.length / r));
  if (e)
    for (let a = 0; a < l; a++) {
      const c = a * r;
      for (let u = 0; u < s >> 1; u++) {
        const h = c + u * 4, d = c + (s - 1 - u) * 4;
        for (let m = 0; m < 4; m++) {
          const f = i[h + m];
          i[h + m] = i[d + m], i[d + m] = f;
        }
      }
    }
  if (n) {
    const a = new Uint8Array(r);
    for (let c = 0; c < l >> 1; c++) {
      const u = c * r, h = (l - 1 - c) * r;
      a.set(i.subarray(u, u + r)), i.copyWithin(u, h, h + r), i.set(a, h);
    }
  }
}
const Ft = (t) => "mime" in t;
function $r(t) {
  return yt(() => {
    const e = new Kt(t);
    if (t.length > 24 && e.u32(0) === 1196314761 && e.u32(4) === 169478669) {
      const n = e.view.getUint32(16, !1), s = e.view.getUint32(20, !1);
      return n > 0 && s > 0 ? { mime: "image/png", bytes: t, w: n, h: s, crop: null } : null;
    }
    if (t.length > 10 && t[0] === 71 && t[1] === 73 && t[2] === 70) {
      const n = e.u16(6), s = e.u16(8);
      return n > 0 && s > 0 ? { mime: "image/gif", bytes: t, w: n, h: s, crop: null } : null;
    }
    if (t.length > 4 && t[0] === 255 && t[1] === 216) {
      const n = Or(e);
      return n ? { mime: "image/jpeg", bytes: t, w: n[0], h: n[1], crop: null } : null;
    }
    if (t.length > 54 && t[0] === 66 && t[1] === 77) {
      const n = e.tail(14), s = Fn(n);
      if (s === null) return null;
      const o = e.u32(10), i = Ce(n.sub(0, s), o >= 14 + s ? e.tail(o) : n.tail(s), !1);
      return i ? (i.bottomUp && (i.bottomUp = !1), i) : null;
    }
    return null;
  }) ?? null;
}
function Or(t) {
  let e = 2;
  for (let n = 0; n < 1e4 && e + 9 < t.length; n++) {
    if (t.b[e] !== 255) return null;
    const s = t.b[e + 1];
    if (s === 216 || s === 1 || s >= 208 && s <= 215) {
      e += 2;
      continue;
    }
    const o = t.view.getUint16(e + 2, !1);
    if (s >= 192 && s <= 207 && s !== 196 && s !== 200 && s !== 204) {
      const i = t.view.getUint16(e + 5, !1), r = t.view.getUint16(e + 7, !1);
      return r > 0 && i > 0 ? [r, i] : null;
    }
    e += 2 + o;
  }
  return null;
}
const ms = 16;
function Qt(t) {
  let e = null;
  const n = (s) => {
    e ? e = [Math.min(e[0], s[0]), Math.min(e[1], s[1]), Math.max(e[2], s[0]), Math.max(e[3], s[1])] : e = [s[0], s[1], s[0], s[1]];
  };
  for (const s of t)
    s.k === "M" || s.k === "L" ? n(s.p) : s.k === "C" && (n(s.a), n(s.b), n(s.p));
  return e;
}
function xo(t, e) {
  const n = [Math.max(t[0], e[0]), Math.max(t[1], e[1]), Math.min(t[2], e[2]), Math.min(t[3], e[3])];
  return n[2] < n[0] || n[3] < n[1] ? [n[0], n[1], n[0], n[1]] : n;
}
const ce = ([t, e, n, s]) => [[t, e], [n, e], [n, s], [t, s]];
function ze(t) {
  if (!t.length) return null;
  let e = [t[0][0], t[0][1], t[0][0], t[0][1]];
  for (const n of t) e = [Math.min(e[0], n[0]), Math.min(e[1], n[1]), Math.max(e[2], n[0]), Math.max(e[3], n[1])];
  return e;
}
const qt = (t, e, n) => (e[0] - t[0]) * (n[1] - t[1]) - (e[1] - t[1]) * (n[0] - t[0]);
function ve(t) {
  const e = [];
  for (const i of t) {
    if (!(Number.isFinite(i[0]) && Number.isFinite(i[1]))) return null;
    const r = e[e.length - 1];
    (!r || Math.abs(r[0] - i[0]) > 1e-9 || Math.abs(r[1] - i[1]) > 1e-9) && e.push(i);
  }
  for (; e.length > 1 && e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1]; ) e.pop();
  let n = 0;
  for (let i = 0; i < e.length; i++) n += qt([0, 0], e[i], e[(i + 1) % e.length]);
  if (e.length < 3 || Math.abs(n) < 1e-12) return null;
  n < 0 && e.reverse();
  const s = e.length, o = [];
  for (let i = 0; i < s; i++) {
    const r = qt(e[(i + s - 1) % s], e[i], e[(i + 1) % s]);
    if (r < -1e-9 * (1 + Math.abs(n))) return null;
    Math.abs(r) > 1e-12 && o.push(e[i]);
  }
  return o.length >= 3 ? o : null;
}
function yo(t, e) {
  for (let n = 0; n < t.length; n++) if (qt(t[n], t[(n + 1) % t.length], e) < -1e-9) return !1;
  return !0;
}
function Tr(t) {
  const e = ze(t);
  return !!e && t.length === 4 && t.every((n) => (n[0] === e[0] || n[0] === e[2]) && (n[1] === e[1] || n[1] === e[3]));
}
function Ln(t, e) {
  if (t.length * e.length > 1e6) return [];
  let n = t.slice();
  for (let s = 0; s < e.length; s++) {
    if (n.length * (e.length - s) > 1e6) return [];
    const o = e[s], i = e[(s + 1) % e.length], r = (c) => qt(o, i, c) >= 0, l = (c, u) => {
      const h = qt(o, i, c), d = qt(o, i, u), m = h / (h - d);
      return [c[0] + (u[0] - c[0]) * m, c[1] + (u[1] - c[1]) * m];
    }, a = [];
    for (let c = 0; c < n.length; c++) {
      const u = n[(c + n.length - 1) % n.length], h = n[c], d = r(u), m = r(h);
      d && m ? a.push(h) : d && !m ? a.push(l(u, h)) : !d && m && (a.push(l(u, h)), a.push(h));
    }
    if (n = a, !n.length) break;
  }
  return n;
}
const Ie = (t, e) => t[2] < e[0] || t[0] > e[2] || t[3] < e[1] || t[1] > e[3] || e[2] <= e[0] || e[3] <= e[1], gn = (t, e) => ce(t).every((n) => yo(e, n));
function Er(t, e) {
  const n = e.length >= 3 ? ze(e) : null;
  if (!n) return [];
  switch (t.kind) {
    case "path": {
      const s = Qt(t.ops);
      if (!s) return [];
      if (gn(s, e)) return [t];
      if (Ie(s, n)) return [];
      const o = Ue(t.ops), i = [];
      if (t.fill) {
        const r = gs(o, e);
        r.length && i.push({ ...t, ops: r, stroke: null });
      }
      if (t.stroke) {
        const r = Nr(o, e);
        r.length && i.push({ ...t, ops: r, fill: null });
      }
      return i;
    }
    case "pattern": {
      const s = Qt(t.ops);
      if (!s) return [];
      if (gn(s, e)) return [t];
      if (Ie(s, n)) return [];
      const o = gs(Ue(t.ops), e);
      return o.length ? [{ ...t, ops: o }] : [];
    }
    case "bitmap": {
      if (Ft(t.img)) {
        const [o, i, r, l] = t.rect;
        return Ie([o, i, o + r, i + l], n) ? [] : [t];
      }
      const s = Rr(t.rect, t.img, e);
      return s ? [{ ...t, rect: s.rect, img: s.img }] : [];
    }
    case "text": {
      const s = { ...t.text };
      return s.clip = s.clip ? xo(n, s.clip) : n, [{ ...t, text: s }];
    }
  }
}
function Ue(t) {
  const e = [];
  for (const n of t)
    if (n.k === "M") e.push([[n.p], !1]);
    else if (n.k === "L") {
      const s = e[e.length - 1];
      s ? s[0].push(n.p) : e.push([[n.p], !1]);
    } else if (n.k === "C") {
      const s = e[e.length - 1];
      if (!s || !s[0].length) continue;
      const o = s[0][s[0].length - 1];
      for (let i = 1; i <= ms; i++) {
        const r = i / ms, l = 1 - r, a = [l * l * l, 3 * l * l * r, 3 * l * r * r, r * r * r];
        s[0].push([a[0] * o[0] + a[1] * n.a[0] + a[2] * n.b[0] + a[3] * n.p[0], a[0] * o[1] + a[1] * n.a[1] + a[2] * n.b[1] + a[3] * n.p[1]]);
      }
    } else {
      const s = e[e.length - 1];
      s && (s[1] = !0, s[0].length && e.push([[s[0][0]], !1]));
    }
  return e.filter((n) => n[0].length > 1);
}
function gs(t, e) {
  const n = [];
  for (const [s] of t) {
    const o = Ln(s, e);
    if (o.length >= 3) {
      n.push(nt(o[0]));
      for (const i of o.slice(1)) n.push(ct(i));
      n.push(pt);
    }
  }
  return n;
}
function Nr(t, e) {
  const n = [];
  for (const [s, o] of t) {
    const i = o && s.length ? [...s, s[0]] : s;
    let r = null;
    for (let l = 0; l + 1 < i.length; l++) {
      const a = Ir(i[l], i[l + 1], e);
      if (!a) {
        r = null;
        continue;
      }
      const [c, u] = a;
      (!r || r[0] !== c[0] || r[1] !== c[1]) && n.push(nt(c)), n.push(ct(u)), r = u;
    }
  }
  return n;
}
function Ir(t, e, n) {
  const s = [e[0] - t[0], e[1] - t[1]];
  let o = 0, i = 1;
  for (let r = 0; r < n.length; r++) {
    const l = n[r], a = n[(r + 1) % n.length], c = qt(l, a, t), u = (a[0] - l[0]) * s[1] - (a[1] - l[1]) * s[0];
    if (u === 0) {
      if (c < 0) return null;
    } else {
      const h = -c / u;
      u > 0 ? o = Math.max(o, h) : i = Math.min(i, h);
    }
  }
  return o <= i ? [[t[0] + s[0] * o, t[1] + s[1] * o], [t[0] + s[0] * i, t[1] + s[1] * i]] : null;
}
function Rr(t, e, n) {
  const [s, o, i, r] = t, l = [s, o, s + i, o + r];
  if (gn(l, n)) return { rect: t, img: e };
  const a = ze(n);
  if (!a || Ie(l, a) || i <= 0 || r <= 0 || e.w === 0 || e.h === 0) return null;
  const c = xo(l, a), u = e.w / i, h = e.h / r, d = Math.min(Math.max(0, Math.floor((c[0] - s) * u)), e.w), m = Math.min(Math.max(0, Math.ceil((c[2] - s) * u)), e.w), f = Math.min(Math.max(0, Math.floor((c[1] - o) * h)), e.h), p = Math.min(Math.max(0, Math.ceil((c[3] - o) * h)), e.h);
  if (m <= d || p <= f) return null;
  const g = !Tr(n);
  if (g && (m - d) * (p - f) * n.length > 5e6) return null;
  const b = m - d, y = new Uint8Array(b * (p - f) * 4);
  for (let k = f; k < p; k++) {
    const v = ((e.bottomUp ? e.h - 1 - k : k) * e.w + d) * 4;
    if (v + b * 4 > e.px.length) return null;
    const S = (k - f) * b * 4;
    if (y.set(e.px.subarray(v, v + b * 4), S), g) {
      const $ = o + (k + 0.5) / h;
      for (let I = 0; I < b; I++) yo(n, [s + (d + I + 0.5) / u, $]) || (y[S + I * 4 + 3] = 0);
    }
  }
  return { rect: [s + d / u, o + f / h, b / u, (p - f) / h], img: { w: b, h: p - f, bottomUp: !1, px: y } };
}
const ko = () => ({ family: "", height: 0, width: 0, weight: 0, italic: !1, underline: !1, strike: !1, charset: 0 }), bs = 2, Fr = 1, wo = 2, jn = 4, Mo = 16, Br = 8192, He = 16384;
function Dr(t) {
  const e = (t & 6) === 6 ? "center" : (t & 6) === 2 ? "right" : "left", n = (t & 24) === 24 ? "baseline" : (t & 24) === 8 ? "bottom" : "top";
  return [e, n];
}
function Pe(t, e, n) {
  let s = "";
  const o = [], i = [128, 129, 130, 134, 136].includes(e);
  let r = 0;
  for (; r < t.length; ) {
    const l = t[r], a = i && l >= 129 && r + 1 < t.length ? 2 : 1;
    if (s += a === 2 ? " " : Lr(l, e), n.length) {
      let c = 0;
      for (let u = r; u < r + a; u++) u < n.length && (c += n[u]);
      o.push(c);
    }
    r += a;
  }
  return [s, o];
}
function ae(t, e) {
  let n = "";
  const s = [];
  let o = 0;
  for (; o < t.length; ) {
    const i = t[o];
    let r = 1, l = i;
    if (i >= 55296 && i <= 56319 && o + 1 < t.length && t[o + 1] >= 56320 && t[o + 1] <= 57343 ? (l = 65536 + (i - 55296 << 10) + (t[o + 1] - 56320), r = 2) : i >= 55296 && i <= 57343 && (l = 65533), n += String.fromCodePoint(l), e.length) {
      let a = 0;
      for (let c = o; c < o + r; c++) c < e.length && (a += e[c]);
      s.push(a);
    }
    o += r;
  }
  return [n, s];
}
function Lr(t, e) {
  if (t < 128 && e !== bs) return String.fromCharCode(t);
  let n;
  return e === bs ? n = 61440 | t : e === 238 ? n = Qe(t, Ur) : e === 204 ? n = Qe(t, _r) : n = Qe(t, jr), String.fromCodePoint(n);
}
function Qe(t, e) {
  const n = e[t - 128 & 255];
  return n || 65533;
}
const jr = (() => {
  const t = [
    8364,
    0,
    8218,
    402,
    8222,
    8230,
    8224,
    8225,
    710,
    8240,
    352,
    8249,
    338,
    0,
    381,
    0,
    0,
    8216,
    8217,
    8220,
    8221,
    8226,
    8211,
    8212,
    732,
    8482,
    353,
    8250,
    339,
    0,
    382,
    376
  ];
  return Array.from({ length: 128 }, (e, n) => n < 32 ? t[n] : 128 + n);
})(), Ur = [
  8364,
  0,
  8218,
  0,
  8222,
  8230,
  8224,
  8225,
  0,
  8240,
  352,
  8249,
  346,
  356,
  381,
  377,
  0,
  8216,
  8217,
  8220,
  8221,
  8226,
  8211,
  8212,
  0,
  8482,
  353,
  8250,
  347,
  357,
  382,
  378,
  160,
  711,
  728,
  321,
  164,
  260,
  166,
  167,
  168,
  169,
  350,
  171,
  172,
  173,
  174,
  379,
  176,
  177,
  731,
  322,
  180,
  181,
  182,
  183,
  184,
  261,
  351,
  187,
  317,
  733,
  318,
  380,
  340,
  193,
  194,
  258,
  196,
  313,
  262,
  199,
  268,
  201,
  280,
  203,
  282,
  205,
  206,
  270,
  272,
  323,
  327,
  211,
  212,
  336,
  214,
  215,
  344,
  366,
  218,
  368,
  220,
  221,
  354,
  223,
  341,
  225,
  226,
  259,
  228,
  314,
  263,
  231,
  269,
  233,
  281,
  235,
  283,
  237,
  238,
  271,
  273,
  324,
  328,
  243,
  244,
  337,
  246,
  247,
  345,
  367,
  250,
  369,
  252,
  253,
  355,
  729
], _r = (() => {
  const t = [
    1026,
    1027,
    8218,
    1107,
    8222,
    8230,
    8224,
    8225,
    8364,
    8240,
    1033,
    8249,
    1034,
    1036,
    1035,
    1039,
    1106,
    8216,
    8217,
    8220,
    8221,
    8226,
    8211,
    8212,
    0,
    8482,
    1113,
    8250,
    1114,
    1116,
    1115,
    1119,
    160,
    1038,
    1118,
    1032,
    164,
    1168,
    166,
    167,
    1025,
    169,
    1028,
    171,
    172,
    173,
    174,
    1031,
    176,
    177,
    1030,
    1110,
    1169,
    181,
    182,
    183,
    1105,
    8470,
    1108,
    187,
    1112,
    1029,
    1109,
    1111
  ];
  return Array.from({ length: 128 }, (e, n) => n < 64 ? t[n] : 1040 + (n - 64));
})(), xs = 1, ys = 7, vo = 8, Te = 2147483648, _e = 5, So = 15, Dt = 0, tn = 128, Un = 1, _n = 2, zr = 3, Hr = 5, Co = 6, Xr = 2, Wr = 7, ks = 9, Vr = 11, Yr = 13, Gr = 2, ws = 15728673, Ms = 66, vs = 16711778, Ss = 96 / 25.4, Cs = 256, wt = [1, 0, 0, 1, 0, 0];
function xt(t, e) {
  return [
    t[0] * e[0] + t[1] * e[2],
    t[0] * e[1] + t[1] * e[3],
    t[2] * e[0] + t[3] * e[2],
    t[2] * e[1] + t[3] * e[3],
    t[4] * e[0] + t[5] * e[2] + e[4],
    t[4] * e[1] + t[5] * e[3] + e[5]
  ];
}
const $t = (t, e) => ({ style: t, color: e, hatch: 0, pattern: null });
function Po(t, e) {
  return t.w === 0 || t.h === 0 || t.w > Cs || t.h > Cs || t.px.length !== t.w * t.h * 4 ? null : { style: Co, color: [0, 0, 0, 255], hatch: 0, pattern: { w: t.w, h: t.h, px: t.px, mono: e } };
}
const qr = (t) => [t & 255, t >>> 8 & 255, t >>> 16 & 255, 255];
function Zr(t) {
  switch (t) {
    case 2:
      return 0.1;
    case 3:
      return 0.01;
    case 4:
      return 25.4 / 100;
    case 5:
      return 25.4 / 1e3;
    case 6:
      return 25.4 / 1440;
    default:
      return null;
  }
}
const Ps = (t, e) => e === 0 ? 1 : t / e;
class zn {
  wo = [0, 0];
  we = [1, 1];
  vo = [0, 0];
  ve = [1, 1];
  mode = xs;
  world = wt;
  /** Device pixels per millimetre on each axis (EMF: from szlDevice and szlMillimeters). */
  pxMm = [Ss, Ss];
  /**
   * Whether a viewport extent was set (by the file, or by the WMF player). An EMF that picks an
   * extent-based mode and sets only the window would, by GDI's 1×1 default viewport, shrink to a
   * pixel, yet its own bounds say it drew full size: without a viewport the window is the scale
   * (1 logical unit per device unit), as WMF's rule already treats it. Beyond DeckCraft.
   */
  veSet = !1;
  clone() {
    const e = new zn();
    return Object.assign(e, this), e;
  }
  /** Logical point to device point: world transform, then window to viewport. */
  device(e) {
    const n = this.world, s = e[0] * n[0] + e[1] * n[2] + n[4], o = e[0] * n[1] + e[1] * n[3] + n[5], [i, r] = this.ratios();
    return [(s - this.wo[0]) * i + this.vo[0], (o - this.wo[1]) * r + this.vo[1]];
  }
  /**
   * Window-to-viewport scale per axis. MM_TEXT fixes the scale at 1; the metric modes use a fixed
   * scale with y up; MM_ISOTROPIC uses one scale on both axes (the smaller magnitude, each axis's
   * sign kept); anisotropic and unknown modes use the extents as given.
   */
  ratios() {
    if (this.mode === xs) return [1, 1];
    const e = Zr(this.mode);
    if (e !== null) return [e * this.pxMm[0], -e * this.pxMm[1]];
    if (!this.veSet) return [1, 1];
    const n = Ps(this.ve[0], this.we[0]), s = Ps(this.ve[1], this.we[1]);
    if (this.mode === ys) {
      const o = Math.min(Math.abs(n), Math.abs(s));
      return [n < 0 ? -o : o, s < 0 ? -o : o];
    }
    return [n, s];
  }
  /** Approximate device length per logical length, for pen widths. */
  scale() {
    const e = this.world, n = Math.sqrt(Math.abs(e[0] * e[3] - e[1] * e[2])), [s, o] = this.ratios();
    return n * (Math.abs(s) + Math.abs(o)) / 2;
  }
  /** True when the window-to-viewport extents set the scale (the isotropic and anisotropic modes). */
  usesExtents() {
    return this.mode === ys || this.mode === vo;
  }
  /** The window in device units as `[x, y, w, h]` with positive extents, used as the picture frame of a plain WMF. */
  windowRect() {
    const e = this.device(this.wo), n = this.device([this.wo[0] + this.we[0], this.wo[1] + this.we[1]]);
    return [Math.min(e[0], n[0]), Math.min(e[1], n[1]), Math.abs(n[0] - e[0]), Math.abs(n[1] - e[1])];
  }
}
class Ae {
  items = [];
  map = new zn();
  /** True once SETWINDOWEXT was seen, so a plain WMF has a frame to use. */
  windowSet = !1;
  /** True once the file set the viewport extent itself (not the player, see playInto). */
  viewportSet = !1;
  saved = [];
  /** Bytes held by the items so far (path ops and pixels), capped at MAX_BYTES. */
  used = 0;
  objects = [];
  pen = { style: 0, width: 0, color: [0, 0, 0, 255] };
  brush = $t(Dt, [255, 255, 255, 255]);
  evenOdd = !0;
  /** SETROP2 mix mode. */
  rop2 = Yr;
  /** The colour of the last fill drawn with R2_XORPEN, for the see-through shadow idiom. */
  xorColor = null;
  text = { color: [0, 0, 0, 255], bkColor: [255, 255, 255, 255], bkOpaque: !0, align: 0, font: null };
  /** Device units per pattern-brush pixel: brushes are laid out in 96-dpi pixels. */
  patternPx = 1;
  pos = [0, 0];
  inPath = !1;
  path = [];
  isFull = !1;
  /** Current clip in device units. null is the default (the whole surface); [] draws nothing. */
  clip = null;
  /** Device bounds of the picture, so excluding from the default clip has a surface to cut. */
  surface = null;
  /** EMF+ convex device clip polygon: drawing is cut to it geometrically. */
  plusClip = null;
  /** GDI clip path (SELECTCLIPPATH) as a convex device polygon, cut the same way. Beyond DeckCraft. */
  pathClip = null;
  /** SETARCDIRECTION: AD_CLOCKWISE arcs. Beyond DeckCraft. */
  arcClockwise = !1;
  /** The selected logical palette (PALETTEINDEX colours). Beyond DeckCraft. */
  palette = [];
  /** Device bounds `[x0, y0, x1, y1]` of the picture. Used when a clip record cuts the default clip. */
  setClipSurface(e) {
    this.surface = Et(e);
  }
  /** True once the item cap is hit; the readers stop there and keep what they have. */
  full() {
    return this.isFull;
  }
  push(e) {
    let n = [e];
    for (const s of [this.pathClip, this.plusClip]) s && (n = n.flatMap((o) => Er(o, s)));
    for (const s of n) this.pushRaw(s);
  }
  /**
   * A COLORREF in the current state: PALETTEINDEX (0x01 in the high byte) names an entry of the
   * selected palette (black past its end); PALETTERGB (0x02) and plain values are RGB.
   */
  colorOf(e) {
    return e >>> 24 === 1 ? this.palette[e & 65535] ?? [0, 0, 0, 255] : qr(e);
  }
  /** SELECTPALETTE. A stock palette (or anything that isn't one) selects none: indices read as black. */
  selectPalette(e) {
    const n = (e & Te) === 0 ? this.objects[e] : null;
    this.palette = n?.kind === "palette" ? n.colors : [];
  }
  /**
   * SELECTCLIPPATH: the open path bracket becomes the clip (RGN_COPY) or cuts it (RGN_AND). A
   * single convex figure clips exactly; anything else clips to its bounding box. Other modes keep
   * the clip as it was.
   */
  selectClipPath(e) {
    const n = this.path;
    this.path = [], this.inPath = !1;
    const s = Ue(n);
    let o = s.length === 1 ? ve(s[0][0]) : null;
    if (!o) {
      const i = Qt(n);
      o = i ? ce(i) : null;
    }
    o && (e === po ? this.pathClip = o : e === fo && (this.pathClip = this.pathClip ? ve(Ln(this.pathClip, o)) ?? [] : o));
  }
  /** Fills logical rectangles (a region's RGNDATA) with brush object `brushIndex`, or the current brush when null. FILLRGN, PAINTRGN. */
  fillRegion(e, n) {
    const s = this.brush;
    n !== null && this.select(n);
    for (const [o, i, r, l] of e) this.shape(Ct(o, i, r, l), !0, !1);
    this.brush = s;
  }
  /** FRAMERGN: outlines each rectangle of a region with brush object `brushIndex`'s colour, `w` × `h` logical units thick. */
  frameRegion(e, n, s, o) {
    const i = this.objects[n], r = i?.kind === "brush" ? i.brush.color : (n & Te) !== 0 && (n & 255) === 4 ? [0, 0, 0, 255] : null;
    if (!r) return;
    const l = this.brush;
    this.brush = $t(Dt, r);
    for (const [a, c, u, h] of e)
      this.shape(Ct(a, c, u, c + o), !0, !1), this.shape(Ct(a, h - o, u, h), !0, !1), this.shape(Ct(a, c, a + s, h), !0, !1), this.shape(Ct(u - s, c, u, h), !0, !1);
    this.brush = l;
  }
  /** The current position (ANGLEARC and POLYDRAW start from it). */
  currentPos() {
    return this.pos;
  }
  setCurrentPos(e) {
    this.pos = e;
  }
  pushRaw(e) {
    if (this.clip && this.clip.length === 0) return;
    e.region = this.clip ? this.clip.slice() : null;
    const n = this.clip ? this.clip.length * 32 : 0;
    let s;
    switch (e.kind) {
      case "path":
        s = e.ops.length * ds;
        break;
      // A tile shared with its brush is counted once (by the brush); one made for this fill counts here.
      case "pattern":
        s = e.ops.length * ds + 64 + (As.has(e.tile) ? 0 : e.tile.px.length);
        break;
      case "bitmap":
        s = Ft(e.img) ? e.img.bytes.length : e.img.px.length;
        break;
      case "text":
        s = e.text.text.length * 2 + e.text.dx.length * 4 + e.text.font.family.length + 128;
        break;
    }
    s += n, this.items.length >= yr || this.used + s > mn ? this.isFull = !0 : (this.used += s, this.items.push(e));
  }
  setWindowOrg(e) {
    this.map.wo = e;
  }
  setWindowExt(e) {
    this.map.we = e, this.windowSet = !0;
  }
  setViewportOrg(e) {
    this.map.vo = e;
  }
  setViewportExt(e) {
    this.map.ve = e, this.map.veSet = !0, this.viewportSet = !0;
  }
  /**
   * Sets up the mapping the way a player does before it plays a WMF into a target: anisotropic,
   * `window` (`[x, y, w, h]` in logical units) onto a viewport of `size` at the origin. The file's
   * own window records then replace the window; the viewport stays unless the file sets one.
   * Without a window (a plain WMF) only the viewport extent is set.
   */
  playInto(e, n) {
    if (e) {
      const [s, o, i, r] = e;
      this.map.mode = vo, this.map.wo = [s, o], this.map.we = [i, r], this.map.vo = [0, 0];
    }
    this.map.ve = n, this.map.veSet = !0;
  }
  setMapMode(e) {
    this.map.mode = e;
  }
  /** Device pixels per millimetre (x, y) for the metric map modes. Ignored unless both are positive. */
  setDeviceMm(e) {
    Number.isFinite(e[0]) && Number.isFinite(e[1]) && e[0] > 0 && e[1] > 0 && (this.map.pxMm = e);
  }
  setPolyfill(e) {
    this.evenOdd = e !== Xr;
  }
  /** SETROP2. R2_NOP draws nothing; R2_XORPEN and R2_MASKPEN are the see-through shadow idiom; the others draw as copy. */
  setRop2(e) {
    this.rop2 = e;
  }
  setTextColor(e) {
    this.text.color = this.colorOf(e);
  }
  setBkColor(e) {
    this.text.bkColor = this.colorOf(e);
  }
  setBkMode(e) {
    this.text.bkOpaque = e === Gr;
  }
  setTextAlign(e) {
    this.text.align = e;
  }
  /** The character set of the selected font (ANSI without one). */
  fontCharset() {
    return this.text.font?.font.charset ?? 0;
  }
  /** EMF SETWORLDTRANSFORM (`mode` 4) and MODIFYWORLDTRANSFORM (1 identity, 2 left, 3 right, 4 set). An unknown mode leaves the world transform as it was. */
  modifyWorld(e, n) {
    n === 1 ? this.map.world = wt : n === 2 ? this.map.world = xt(e, this.map.world) : n === 3 ? this.map.world = xt(this.map.world, e) : n === 4 && (this.map.world = e);
  }
  /** The current world transform (EMF+ draws through it). */
  world() {
    return this.map.world;
  }
  /** Sets the pen and brush directly (EMF+ records name their own pen and brush). */
  setPen(e) {
    this.pen = e;
  }
  setBrush(e) {
    this.brush = e;
  }
  /** Sets the EMF+ convex device clip polygon (null: unclipped). */
  setClip(e) {
    this.plusClip = e;
  }
  /** Logical to device as one affine transform (the mapping is affine). */
  deviceAffine() {
    const e = this.map.device([0, 0]), n = this.map.device([1, 0]), s = this.map.device([0, 1]);
    return [n[0] - e[0], n[1] - e[1], s[0] - e[0], s[1] - e[1], e[0], e[1]];
  }
  /** Text colour, font and alignment set directly (EMF+ strings name their own font and brush); the background is transparent. */
  setTextStyle(e, n, s) {
    this.text.color = e, this.text.bkOpaque = !1, this.text.align = s, this.text.font = n;
  }
  /** Pushes an item already in device units (a nested metafile's drawing). */
  pushDevice(e) {
    this.push(e);
  }
  /** Fills logical `ops` with a ready-made tile, laid from the device origin. */
  tileShape(e, n) {
    const s = e.map((o) => this.mapOp(o));
    s.length >= 2 && this.push({ kind: "pattern", ops: s, evenOdd: this.evenOdd, tile: n, region: null });
  }
  /**
   * Fills logical `ops` with a colour computed per device point (gradients, textures): a tile of at
   * most SHADE_RES cells on the longer side, laid out so that its one repeat covers the shape.
   */
  shadeShape(e, n) {
    const s = e.map((g) => this.mapOp(g)), o = Qt(s);
    if (!o) return;
    const [i, r, l, a] = o, c = Math.max(l - i, a - r);
    if (s.length < 2 || !(Number.isFinite(c) && c > 0)) return;
    const u = c / tn, h = Math.min(tn + 1, Math.max(1, Math.ceil((l - i) / u) + 1)), d = Math.min(tn + 1, Math.max(1, Math.ceil((a - r) / u) + 1)), m = h * u, f = d * u, p = new Uint8Array(h * d * 4);
    for (let g = 0; g < d; g++) {
      const b = r + Ht(g * u - r, f) + u / 2;
      for (let y = 0; y < h; y++) {
        const k = i + Ht(y * u - i, m) + u / 2;
        p.set(n([k, b]), (g * h + y) * 4);
      }
    }
    this.push({ kind: "pattern", ops: s, evenOdd: this.evenOdd, tile: { w: h, h: d, px: p, cell: u }, region: null });
  }
  /** Pushes the drawing state. Past MAX_STACK levels the parse stops, since later restores could no longer match the file. */
  saveDc() {
    this.saved.length < kr ? this.saved.push({ pathClip: this.pathClip, arcClockwise: this.arcClockwise, map: this.map.clone(), pen: { ...this.pen }, brush: { ...this.brush }, evenOdd: this.evenOdd, rop2: this.rop2, text: { ...this.text }, clip: this.clip ? this.clip.slice() : null }) : this.isFull = !0;
  }
  /** Negative `n` pops `-n` levels; positive `n` restores absolute level `n`. */
  restoreDc(e) {
    const n = e < 0 ? this.saved.length - Math.abs(e) : e - 1;
    if (n < 0 || n >= this.saved.length) return;
    const s = this.saved[n];
    this.saved.length = n, this.map = s.map, this.pen = s.pen, this.brush = s.brush, this.evenOdd = s.evenOdd, this.rop2 = s.rop2, this.text = s.text, this.clip = s.clip, this.pathClip = s.pathClip, this.arcClockwise = s.arcClockwise;
  }
  /** The logical rectangle as a device rectangle. A rotation stores the bounds of the rotated corners. */
  deviceRect([e, n, s, o]) {
    const i = [[e, n], [s, n], [e, o], [s, o]].map((u) => this.map.device(u));
    if (!i.every((u) => Number.isFinite(u[0]) && Number.isFinite(u[1]))) return null;
    let r = 1 / 0, l = 1 / 0, a = -1 / 0, c = -1 / 0;
    for (const u of i)
      r = Math.min(r, u[0]), l = Math.min(l, u[1]), a = Math.max(a, u[0]), c = Math.max(c, u[1]);
    return Et([r, l, a, c]);
  }
  /** INTERSECTCLIPRECT: later drawing is limited to this logical rectangle as well. */
  intersectClipRect(e) {
    const n = this.deviceRect(e);
    this.clip = n ? gr(this.clip, n) : [];
  }
  /** EXCLUDECLIPRECT: this logical rectangle is removed from the clip. */
  excludeClipRect(e) {
    const n = this.deviceRect(e);
    n && (this.clip = br(this.clip, n, this.surface));
  }
  /**
   * EXTSELECTCLIPRGN: combine these rectangles with the clip in a `RGN_*` mode. A GDI region is in
   * device units, so the window, viewport and world transform don't apply. (DeckCraft maps them as
   * logical units, which shifts the clip by any window origin: LibreOffice's TestNegativeWinOrg
   * cut its line of text in half.)
   */
  selectClipRects(e, n) {
    this.clip = xr(this.clip, e.slice(0, Jt), n, this.surface);
  }
  /** The default clip: later records are not limited by a region (nor a clip path). */
  resetClip() {
    this.clip = null, this.pathClip = null;
  }
  /** Stores an object in `slot` (EMF index), or in the first free slot (WMF handle table). */
  addObject(e, n) {
    if (n.kind === "brush" && n.brush.pattern) {
      const o = n.brush.pattern.px.length;
      if (this.used + o > mn) {
        this.isFull = !0;
        return;
      }
      this.used += o;
    }
    if (e !== null) {
      if (e < fs) {
        for (; this.objects.length <= e; ) this.objects.push(null);
        this.objects[e] = n;
      }
      return;
    }
    const s = this.objects.indexOf(null);
    s >= 0 ? this.objects[s] = n : this.objects.length < fs && this.objects.push(n);
  }
  deleteObject(e) {
    e < this.objects.length && (this.objects[e] = null);
  }
  /** Selects an object by index; indices with the high bit set are stock objects. */
  select(e) {
    if ((e & Te) !== 0) {
      this.selectStock((e & ~Te) >>> 0);
      return;
    }
    const n = this.objects[e] ?? null;
    n && (n.kind === "pen" ? this.pen = n.pen : n.kind === "brush" ? this.brush = n.brush : n.kind === "font" && (this.text.font = n.font));
  }
  selectStock(e) {
    const n = [255, 255, 255, 255], s = [0, 0, 0, 255], o = (i) => $t(Dt, [i, i, i, 255]);
    e === 0 || e === 18 ? this.brush = $t(Dt, n) : e === 1 ? this.brush = o(192) : e === 2 ? this.brush = o(128) : e === 3 ? this.brush = o(64) : e === 4 ? this.brush = $t(Dt, s) : e === 5 ? this.brush = $t(Un, s) : e === 6 ? this.pen = { style: 0, width: 0, color: n } : e === 7 || e === 19 ? this.pen = { style: 0, width: 0, color: s } : e === 8 ? this.pen = { style: _e, width: 0, color: s } : e >= 10 && e <= 17 && (this.text.font = null);
  }
  mapOp(e) {
    switch (e.k) {
      case "M":
        return nt(this.map.device(e.p));
      case "L":
        return ct(this.map.device(e.p));
      case "C":
        return St(this.map.device(e.a), this.map.device(e.b), this.map.device(e.p));
      default:
        return pt;
    }
  }
  /**
   * The current brush's paint. Hatch and monochrome brushes take the background colour (when the
   * background mode is opaque) and the text colour. Under R2_MASKPEN (destination AND brush) a
   * tile's white pixels keep what is below, and its black ones take the colour of the XOR fill
   * before it: XOR, AND, XOR again leaves that colour where the tile is black.
   */
  fillPaint() {
    const e = this.brush;
    if (e.style === Dt) return { kind: "solid", color: e.color };
    if (e.style === _n) {
      const n = Ao(e.hatch, e.color, this.text.bkOpaque ? this.text.bkColor : null);
      return n ? { kind: "tile", tile: { w: 8, h: 8, px: n, cell: this.patternPx } } : null;
    }
    if (e.style === zr || e.style === Hr || e.style === Co) {
      const n = e.pattern;
      if (!n) return null;
      if (!n.mono && this.rop2 !== ks)
        return n.plain || (n.plain = { w: n.w, h: n.h, px: n.px, cell: this.patternPx }, As.add(n.plain)), { kind: "tile", tile: n.plain };
      const s = n.px.slice();
      for (let o = 0; o + 3 < s.length; o += 4) {
        if (n.mono) {
          const r = s[o] + s[o + 1] + s[o + 2] >= 384 ? this.text.bkColor : this.text.color;
          s[o] = r[0], s[o + 1] = r[1], s[o + 2] = r[2], s[o + 3] = 255;
        }
        this.rop2 === ks && (s[o] === 255 && s[o + 1] === 255 && s[o + 2] === 255 ? s[o + 3] = 0 : s[o] === 0 && s[o + 1] === 0 && s[o + 2] === 0 && this.xorColor && s.set(this.xorColor, o));
      }
      return { kind: "tile", tile: { w: n.w, h: n.h, px: s, cell: this.patternPx } };
    }
    return null;
  }
  /** Pushes device ops filled with `fill` and stroked with `stroke`: a tile fill and its outline are two items. */
  pushShape(e, n, s) {
    const o = this.evenOdd;
    n?.kind === "tile" ? (this.push({ kind: "pattern", ops: e, evenOdd: o, tile: n.tile, region: null }), s && this.push({ kind: "path", ops: e, fill: null, stroke: s, evenOdd: o, region: null })) : n?.kind === "solid" ? this.push({ kind: "path", ops: e, fill: n.color, stroke: s, evenOdd: o, region: null }) : s && this.push({ kind: "path", ops: e, fill: null, stroke: s, evenOdd: o, region: null });
  }
  /**
   * Whether the mix mode suppresses drawing: R2_NOP draws nothing, and R2_XORPEN shapes only
   * remember their fill colour (an XOR pair cancels; the see-through shadow idiom draws its
   * pattern in that colour).
   */
  mixSkips(e) {
    return this.rop2 === Vr ? !0 : this.rop2 === Wr ? (e && this.brush.style === Dt && (this.xorColor = this.brush.color), !0) : !1;
  }
  strokePen() {
    if ((this.pen.style & So) === _e) return null;
    const e = this.pen.width === 0 ? 0 : Math.abs(this.pen.width) * this.map.scale();
    return [this.pen.color, e];
  }
  pushPathOps(e) {
    for (const n of e) {
      if (this.path.length >= le) return;
      this.path.push(n);
    }
  }
  /**
   * Draws logical-space ops with the current pen (`stroke`) and brush (`fill`), or appends them to
   * the open path bracket, where fill and stroke wait for FILLPATH/STROKEPATH.
   */
  shape(e, n, s) {
    const o = e.map((i) => this.mapOp(i));
    if (this.inPath) {
      this.pushPathOps(o);
      return;
    }
    this.mixSkips(n) || o.length < 2 || this.pushShape(o, n ? this.fillPaint() : null, s ? this.strokePen() : null);
  }
  moveTo(e) {
    this.inPath && this.pushPathOps([nt(this.map.device(e))]), this.pos = e;
  }
  /** LINETO from the current point, then moves the current point to `p`. */
  lineTo(e) {
    this.lineChain([e], !1, !0);
  }
  /** Lines from the current point through `pts` (POLYLINETO), or a polyline from the current point. */
  lineChain(e, n, s) {
    const o = this.inPath && this.path.length ? [] : [nt(this.pos)];
    for (const i of e) o.push(ct(i));
    e.length && (this.pos = e[e.length - 1]), this.shape(o, n, s);
  }
  /** POLYBEZIER: cubic segments that start a new figure at `from`. The current point is unchanged. */
  bezier(e, n) {
    this.shape([nt(e), ...$s(n)], !1, !0);
  }
  /** POLYBEZIERTO: cubic segments from the current point; the current point moves to the last point. */
  bezierTo(e) {
    const n = this.inPath && this.path.length ? [] : [nt(this.pos)];
    n.push(...$s(e)), e.length && (this.pos = e[e.length - 1]), this.shape(n, !1, !0);
  }
  poly(e, n, s, o) {
    if (!e.length) return;
    const i = [nt(e[0])];
    for (let r = 1; r < e.length; r++) i.push(ct(e[r]));
    n && i.push(pt), this.shape(i, s, o);
  }
  beginPath() {
    this.inPath = !0, this.path = [];
  }
  endPath() {
    this.inPath = !1;
  }
  closeFigure() {
    this.inPath && this.pushPathOps([pt]);
  }
  /** FILLPATH, STROKEPATH and STROKEANDFILLPATH: paints the bracketed path and empties it. */
  paintPath(e, n) {
    const s = this.path;
    this.path = [], !(this.mixSkips(e) || s.length < 2) && this.pushShape(s, e ? this.fillPaint() : null, n ? this.strokePen() : null);
  }
  /** Fills a logical rectangle `[l, t, r, b]` with the current brush (PATBLT, PATCOPY blits). */
  fillBrushRect([e, n, s, o]) {
    if (this.mixSkips(!0)) return;
    const i = this.fillPaint();
    this.pushShape(Ct(e, n, s, o).map((r) => this.mapOp(r)), i, null);
  }
  /** Fills a logical rectangle `[l, t, r, b]` with a solid colour (ROP fills such as BLACKNESS). */
  fillRectWith([e, n, s, o], i) {
    this.push({ kind: "path", ops: Ct(e, n, s, o).map((r) => this.mapOp(r)), fill: i, stroke: null, evenOdd: !0, region: null });
  }
  /** Whether a raster operation draws without a source bitmap (PATCOPY, BLACKNESS, WHITENESS). */
  static sourceless(e) {
    return e === ws || e === Ms || e === vs;
  }
  /** Fills a logical rectangle `[x, y, w, h]` for a source-less raster operation. PATCOPY uses the brush; the others fill black or white. */
  fillRop([e, n, s, o], i) {
    const r = [e, n, e + s, n + o];
    i === ws ? this.fillBrushRect(r) : i === Ms ? this.fillRectWith(r, [0, 0, 0, 255]) : i === vs && this.fillRectWith(r, [255, 255, 255, 255]);
  }
  /**
   * Draws `text` (one `dx` advance per character, or none) with the current font, colours and
   * alignment. The reference point is `at`, or the current position under TA_UPDATECP (which then
   * moves past the string). `rect` (logical `[l, t, r, b]`) is filled with the background colour
   * under ETO_OPAQUE and clips the text under ETO_CLIPPED. Text ignores the mix mode, as GDI's does.
   */
  drawText(e, n, s, o, i) {
    (o & wo) !== 0 && i && this.fillRectWith(i, this.text.bkColor);
    const r = this.text.font ?? { font: ko(), escapement: 0 }, l = (this.text.align & Fr) !== 0, a = l ? this.pos : e, [c, u] = Dr(this.text.align), h = this.map.device(a), d = this.map.device([a[0] + 1, a[1]]), m = this.map.device([a[0], a[1] + 1]), f = [d[0] - h[0], d[1] - h[1]], p = [m[0] - h[0], m[1] - h[1]];
    if (l) {
      let L = s.length ? s.reduce((D, R) => D + R, 0) : Math.max(Math.abs(r.font.height), 1) * 0.5 * [...n].length;
      L = c === "left" ? L : c === "right" ? -L : 0;
      const O = r.escapement / 10 * (Math.PI / 180), F = p[1] < 0 ? 1 : -1, T = [a[0] + L * Math.cos(O), a[1] + L * Math.sin(O) * F];
      Number.isFinite(T[0]) && Number.isFinite(T[1]) && (this.pos = T);
    }
    const g = Math.hypot(f[0], f[1]), b = Math.hypot(p[0], p[1]);
    if (!(n.length > 0 && [g, b, h[0], h[1]].every(Number.isFinite) && g > 0 && b > 0)) return;
    const v = (f[0] * p[1] - f[1] * p[0] > 0 ? Math.atan2(f[1], f[0]) : Math.atan2(f[1], Math.abs(f[0]))) - r.escapement / 10 * (Math.PI / 180), S = Math.cos(v), $ = Math.sin(v);
    let I = null;
    if ((o & jn) !== 0 && i) {
      const [L, O, F, T] = i, D = this.map.device([L, O]), R = this.map.device([F, T]);
      I = [Math.min(D[0], R[0]), Math.min(D[1], R[1]), Math.max(D[0], R[0]), Math.max(D[1], R[1])];
    }
    this.push({
      kind: "text",
      text: {
        transform: [g * S, g * $, -b * $, b * S, h[0], h[1]],
        text: n,
        dx: s,
        font: r.font,
        color: this.text.color,
        background: this.text.bkOpaque ? this.text.bkColor : null,
        hAlign: c,
        vAlign: u,
        clip: I,
        region: null
      },
      region: null
    });
  }
  /** A bitmap stretched into a logical rectangle `[x, y, w, h]`. A negative extent mirrors the bitmap, as the mapping does. */
  bitmap(e, n) {
    const [s, o, i, r] = e, l = this.map.device([s, o]), a = this.map.device([s + i, o + r]);
    let c = n;
    if (Ft(c)) {
      const u = l[0] > a[0], h = l[1] > a[1];
      (u || h) && (c = { ...c, flip: [!!c.flip?.[0] !== u, !!c.flip?.[1] !== h] });
    } else
      Dn(c, l[0] > a[0], l[1] > a[1]);
    this.push({ kind: "bitmap", rect: [Math.min(l[0], a[0]), Math.min(l[1], a[1]), Math.abs(a[0] - l[0]), Math.abs(a[1] - l[1])], img: c, region: null });
  }
}
const As = /* @__PURE__ */ new WeakSet();
function Ao(t, e, n) {
  if (t > 5 || t < 0) return null;
  const s = new Uint8Array(256);
  for (let o = 0; o < 8; o++)
    for (let i = 0; i < 8; i++) {
      const r = o === 7, l = i === 7, a = i === o, c = i + o === 7, u = t === 0 ? r : t === 1 ? l : t === 2 ? a : t === 3 ? c : t === 4 ? r || l : a || c;
      s.set(u ? e : n ?? [0, 0, 0, 0], (o * 8 + i) * 4);
    }
  return s;
}
function $s(t) {
  const e = [];
  for (let n = 0; n + 2 < t.length; n += 3) e.push(St(t[n], t[n + 1], t[n + 2]));
  return e;
}
const Kr = 726027589, Jr = 64, Qr = 64, te = 1e5, bn = 256, Os = 32768, tl = 64 * 1024 * 1024, el = 32, Ts = te, nl = 3, sl = 2, ol = 6, il = 8, rl = 24;
function xn(t) {
  switch (t.kind) {
    case "solid":
      return t.color;
    case "hatch":
      return t.fg;
    case "linear":
    case "radial":
      return yn(t.stops, 0.5);
    case "texture":
      return Ft(t.img) ? [128, 128, 128, 255] : t.img.px.length >= 4 ? [t.img.px[0], t.img.px[1], t.img.px[2], t.img.px[3]] : [0, 0, 0, 255];
  }
}
function ll(t, e) {
  switch (t.kind) {
    case "solid":
      return t.color;
    case "hatch":
      return t.fg;
    case "linear": {
      const n = t.rect[2] === 0 ? 0 : (e[0] - t.rect[0]) / t.rect[2];
      return yn(t.stops, cl(n, t.wrap));
    }
    case "radial": {
      const n = (e[0] - t.center[0]) / Math.max(t.radius[0], 1e-9), s = (e[1] - t.center[1]) / Math.max(t.radius[1], 1e-9);
      return yn(t.stops, Math.min(Math.hypot(n, s), 1));
    }
    case "texture": {
      const n = t.img;
      if (Ft(n)) return [128, 128, 128, 255];
      const s = n.w, o = n.h;
      if (s === 0 || o === 0) return [0, 0, 0, 0];
      if (t.wrap === 4 && !(e[0] >= 0 && e[0] < s && e[1] >= 0 && e[1] < o)) return [0, 0, 0, 0];
      const i = Math.min(Math.floor(Ht(e[0], s)), s - 1), l = (Math.min(Math.floor(Ht(e[1], o)), o - 1) * s + i) * 4;
      return l + 4 <= n.px.length ? [n.px[l], n.px[l + 1], n.px[l + 2], n.px[l + 3]] : [0, 0, 0, 0];
    }
  }
}
const al = (t) => t.kind === "linear" || t.kind === "radial" || t.kind === "texture" ? t.xf : wt;
function cl(t, e) {
  if (!Number.isFinite(t)) return 0;
  if (e === 1 || e === 3) {
    const n = Ht(t, 2);
    return n > 1 ? 2 - n : n;
  }
  return e === 4 ? Math.min(1, Math.max(0, t)) : Ht(t, 1);
}
function yn(t, e) {
  if (!t.length) return [0, 0, 0, 0];
  if (e <= t[0][0]) return t[0][1];
  for (let n = 0; n + 1 < t.length; n++) {
    const [s, o] = t[n], [i, r] = t[n + 1];
    if (e <= i) return Hn(o, r, i > s ? (e - s) / (i - s) : 0);
  }
  return t[t.length - 1][1];
}
function Hn(t, e, n) {
  return [0, 1, 2, 3].map((s) => Math.min(255, Math.max(0, Math.round(t[s] + (e[s] - t[s]) * n))));
}
class ul {
  /** An EMF+ header said the file is EMF+ only, so these records are the picture. */
  active = !1;
  dpi = 96;
  world = wt;
  page = 1;
  /** Convex device clip polygon; null is unclipped. */
  clip = null;
  objects = new Array(Jr).fill(null);
  objectBytes = 0;
  stack = [];
  partial = null;
  /** The picture frame in device units (`[x, y, w, h]`), what Clear paints. */
  frame = null;
  depth;
  /** Play EMF+ records even in a file whose header says dual (see emf.ts). */
  force;
  /** A dual header was seen and EMF+ drawing records followed it, unplayed. */
  skippedDual = !1;
  constructor(e = 0, n = !1) {
    this.depth = e, this.force = n;
  }
  /** Plays the EMF+ records of one EMR_COMMENT payload (after the identifier). */
  comment(e, n) {
    let s = 0;
    for (; !e.full(); ) {
      const o = n.optU16(s), i = n.optU16(s + 2), r = n.optU32(s + 4), l = n.optU32(s + 8);
      if (o === void 0 || i === void 0 || r === void 0 || l === void 0 || r < 12 || l > r - 12 || s + 12 + l > n.length) break;
      const a = n.sub(s + 12, l);
      yt(() => this.record(e, o, i, a)), s += r;
    }
  }
  /** World units to device pixels before the canvas's own mapping. */
  xf() {
    return xt(this.world, [this.page, 0, 0, this.page, 0, 0]);
  }
  painter() {
    return new Rs(this.xf(), this.clip ? this.clip.slice() : null);
  }
  record(e, n, s, o) {
    if (n === 16385) {
      this.active = (s & 1) === 0 || this.force;
      const i = o.optU32(8);
      i !== void 0 && i > 0 && i < 1e5 && (this.dpi = i);
      return;
    }
    if (!this.active) {
      n !== 16386 && (this.skippedDual = !0);
      return;
    }
    n === 16392 ? this.object(s, o) : n === 16393 || n === 16403 || n >= 16410 && n <= 16412 || n === 16438 ? this.recordImageTextRegion(e, n, s, o) : n >= 16421 && n <= 16437 ? this.recordState(e, n, s, o) : n >= 16400 && n <= 16402 || n >= 16406 && n <= 16409 ? this.recordCurve(e, n, s, o) : this.recordShape(e, n, s, o);
  }
  /** Rectangle, polygon, ellipse and path records. */
  recordShape(e, n, s, o) {
    const i = (s & 16384) !== 0, r = s & 255;
    switch (n) {
      case 16394: {
        const l = this.brushOf(s, o.u32(0));
        if (!l) return;
        const a = this.painter();
        for (const c of Xt(o, 8, o.u32(4), i)) {
          if (e.full()) break;
          a.fill(e, Ct(...c), l);
        }
        return;
      }
      case 16395: {
        const l = this.pen(r);
        if (!l) return;
        const a = this.painter();
        for (const c of Xt(o, 4, o.u32(0), i)) {
          if (e.full()) break;
          a.stroke(e, Ct(...c), l);
        }
        return;
      }
      case 16396: {
        const l = this.brushOf(s, o.u32(0));
        l && this.painter().fill(e, Re(At(o, 8, o.u32(4), i), !0), l);
        return;
      }
      case 16397: {
        const l = this.pen(r);
        l && this.painter().stroke(e, Re(At(o, 4, o.u32(0), i), (s & 8192) !== 0), l);
        return;
      }
      case 16398: {
        const l = this.brushOf(s, o.u32(0)), a = Xt(o, 4, 1, i)[0];
        l && a && this.painter().fill(e, Bs(a), l);
        return;
      }
      case 16399: {
        const l = this.pen(r), a = Xt(o, 0, 1, i)[0];
        l && a && this.painter().stroke(e, Bs(a), l);
        return;
      }
      case 16404: {
        const l = this.brushOf(s, o.u32(0)), a = this.path(r);
        l && a && this.painter().fill(e, a, l);
        return;
      }
      case 16405: {
        const l = this.path(r), a = this.pen(o.u32(0));
        l && a && this.painter().stroke(e, l, a);
        return;
      }
    }
  }
  /** Curve, bezier and arc records. */
  recordCurve(e, n, s, o) {
    const i = (s & 16384) !== 0, r = s & 255;
    switch (n) {
      case 16409: {
        const l = this.pen(r), a = At(o, 4, o.u32(0), i);
        if (!l || !a.length) return;
        const c = [nt(a[0])];
        for (let u = 1; u + 2 < a.length; u += 3) c.push(St(a[u], a[u + 1], a[u + 2]));
        this.painter().stroke(e, c, l);
        return;
      }
      // Cardinal splines: FillClosedCurve, DrawClosedCurve, DrawCurve.
      case 16406: {
        const l = this.brushOf(s, o.u32(0)), a = en(o.f32(4));
        if (!l || a === null) return;
        this.painter().fill(e, on(At(o, 12, o.u32(8), i), a, !0, 0, 1 / 0), l);
        return;
      }
      case 16407: {
        const l = this.pen(r), a = en(o.f32(0));
        if (!l || a === null) return;
        this.painter().stroke(e, on(At(o, 8, o.u32(4), i), a, !0, 0, 1 / 0), l);
        return;
      }
      case 16408: {
        const l = this.pen(r), a = en(o.f32(0));
        if (!l || a === null) return;
        const c = o.u32(4), u = o.u32(8);
        this.painter().stroke(e, on(At(o, 16, o.u32(12), i), a, !1, c, u), l);
        return;
      }
      case 16400: {
        const l = this.brushOf(s, o.u32(0)), a = Rt(o, 4, 2), c = Xt(o, 12, 1, i)[0];
        l && a && c && this.painter().fill(e, Fs(c, a[0], a[1], !0), l);
        return;
      }
      case 16401:
      case 16402: {
        const l = this.pen(r), a = Rt(o, 0, 2), c = Xt(o, 8, 1, i)[0];
        l && a && c && this.painter().stroke(e, Fs(c, a[0], a[1], n === 16401), l);
        return;
      }
    }
  }
  /** Clear, region fill, image and text records. */
  recordImageTextRegion(e, n, s, o) {
    const i = (s & 16384) !== 0, r = s & 255;
    switch (n) {
      // Clear: the whole picture in one colour, whatever the clip (a transparent clear leaves nothing to draw).
      case 16393: {
        const l = Nt(o.u32(0));
        if (!this.frame) return;
        const [a, c, u, h] = this.frame;
        if (l[3] === 0 || !(u > 0 && h > 0)) return;
        const d = $o(xt(e.world(), e.deviceAffine()));
        if (!d) return;
        new Rs(d, null).fill(e, Ct(a, c, a + u, c + h), { kind: "solid", color: l });
        return;
      }
      // FillRegion: the region's area (as the clip reads it).
      case 16403: {
        const l = this.brushOf(s, o.u32(0)), a = this.objects[r];
        if (!l || a?.kind !== "region" || !a.area || a.area.length < 3) return;
        this.painter().fill(e, Re(a.area, !0), l);
        return;
      }
      case 16410: {
        const l = this.image(r), a = Xt(o, 24, 1, i)[0];
        l && a && this.drawImage(e, l, o, [a[0], a[1], a[2] - a[0], a[3] - a[1]]);
        return;
      }
      case 16411: {
        const l = this.image(r), a = At(o, 28, 3, i);
        if (!l || a.length < 3) return;
        const [c, u, h] = a;
        this.drawImage(e, l, o, [c[0], c[1], u[0] - c[0] + (h[0] - c[0]), h[1] - c[1] + (u[1] - c[1])]);
        return;
      }
      case 16412:
        this.drawString(e, s, o);
        return;
      case 16438:
        this.drawDriverString(e, s, o);
        return;
    }
  }
  /** Save / restore, transform and clip records. */
  recordState(e, n, s, o) {
    const i = s & 255;
    switch (n) {
      case 16421:
      case 16424:
        this.push(o.u32(0));
        return;
      case 16423:
        this.push(o.u32(24));
        return;
      case 16422:
      case 16425:
        this.pop(o.u32(0));
        return;
      case 16426: {
        const r = re(o, 0);
        r && (this.world = r);
        return;
      }
      case 16427:
        this.world = wt;
        return;
      case 16428: {
        const r = re(o, 0);
        r && this.apply(r, s);
        return;
      }
      case 16429:
        this.apply([1, 0, 0, 1, o.f32(0), o.f32(4)], s);
        return;
      case 16430:
        this.apply([o.f32(0), 0, 0, o.f32(4), 0, 0], s);
        return;
      case 16431: {
        const r = o.f32(0) * Math.PI / 180;
        this.apply([Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0], s);
        return;
      }
      case 16432: {
        const r = o.f32(0) * Is(s & 255, this.dpi);
        Number.isFinite(r) && r > 0 && r < 1e6 && (this.page = r);
        return;
      }
      case 16433:
        this.clip = null;
        return;
      case 16434: {
        const r = Rt(o, 0, 4);
        if (!r) return;
        const [l, a, c, u] = r;
        this.combine(s, sn(ce([l, a, l + c, a + u]), xt(this.xf(), e.deviceAffine())));
        return;
      }
      case 16435: {
        const r = this.path(i);
        r && this.combine(s, sn(To(r), xt(this.xf(), e.deviceAffine())));
        return;
      }
      case 16436: {
        const r = this.objects[i];
        r?.kind === "region" && this.combine(s, sn(r.area, xt(this.xf(), e.deviceAffine())));
        return;
      }
      case 16437: {
        const r = Rt(o, 0, 2);
        if (!r) return;
        const l = xt(this.xf(), e.deviceAffine()), a = r[0] * l[0] + r[1] * l[2], c = r[0] * l[1] + r[1] * l[3];
        this.clip && (this.clip = this.clip.map((u) => [u[0] + a, u[1] + c]));
        return;
      }
    }
  }
  /** Without the `A` flag a transform is applied before the world transform (prepended). */
  apply(e, n) {
    e.every(Number.isFinite) && (this.world = (n & 8192) !== 0 ? xt(this.world, e) : xt(e, this.world));
  }
  push(e) {
    this.stack.length < Qr && this.stack.push({ id: e, world: this.world, page: this.page, clip: this.clip });
  }
  pop(e) {
    let n = -1;
    for (let o = this.stack.length - 1; o >= 0; o--) if (this.stack[o].id === e) {
      n = o;
      break;
    }
    if (n < 0) return;
    const s = this.stack[n];
    this.world = s.world, this.page = s.page, this.clip = s.clip, this.stack.length = n;
  }
  /** Combines a new clip area with the current one: replace, intersect and union (as the rectangle around both). XOR, exclude and complement leave the clip. */
  combine(e, n) {
    const s = e >> 8 & 15;
    s === 0 ? this.clip = n : s === 1 ? this.clip = Eo(this.clip, n) : s === 2 && (this.clip = No(this.clip, n));
  }
  object(e, n) {
    const s = e & 255, o = e >> 8 & 127;
    if ((e & 32768) !== 0) {
      const r = Math.min(n.u32(0), tl), l = n.tail(4).b;
      let a = this.partial;
      this.partial = null, (!a || a.id !== s || a.kind !== o || a.total !== r) && (a = { id: s, kind: o, total: r, chunks: [], len: 0 });
      const c = l.subarray(0, Math.min(l.length, Math.max(0, a.total - a.len)));
      a.chunks.push(c), a.len += c.length, a.len >= a.total ? this.store(a.id, yt(() => nn(a.kind, new Kt(Es(a.chunks, a.len)), this.depth)) ?? null) : this.partial = a;
      return;
    }
    const i = this.partial;
    if (this.partial = null, i && i.id === s && i.kind === o) {
      const r = n.b.subarray(0, Math.min(n.length, Math.max(0, i.total - i.len)));
      i.chunks.push(r), i.len += r.length, this.store(s, yt(() => nn(o, new Kt(Es(i.chunks, i.len)), this.depth)) ?? null);
      return;
    }
    this.store(s, yt(() => nn(o, n, this.depth)) ?? null);
  }
  store(e, n) {
    if (e >= this.objects.length) return;
    const s = this.objects[e];
    if (s && (this.objectBytes = Math.max(0, this.objectBytes - Ns(s))), this.objects[e] = null, n) {
      const o = Ns(n);
      this.objectBytes + o <= mn && (this.objectBytes += o, this.objects[e] = n);
    }
  }
  path(e) {
    const n = this.objects[e];
    return n?.kind === "path" ? n.ops : null;
  }
  pen(e) {
    const n = this.objects[e];
    return n?.kind === "pen" ? [n.color, n.width] : null;
  }
  image(e) {
    const n = this.objects[e];
    return n?.kind === "image" ? n.data : null;
  }
  font(e) {
    const n = this.objects[e];
    return n?.kind === "font" ? n.font : null;
  }
  /** The brush of a fill record: an ARGB value with the `S` flag, else a brush object. */
  brushOf(e, n) {
    if ((e & 32768) !== 0) return { kind: "solid", color: Nt(n) };
    const s = this.objects[n];
    return s?.kind === "brush" ? s.fill : null;
  }
  /** DrawImage and DrawImagePoints: the source rectangle (pixels) cut from the image, drawn into world rectangle `dst` = `[x, y, w, h]`. */
  drawImage(e, n, s, o) {
    if (n.kind === "meta") {
      this.painter().picture(e, o, n.pic);
      return;
    }
    const i = Rt(s, 8, 4);
    if (!i) return;
    const r = s.u32(4) === 2 ? i.map((a) => Math.min(1e9, Math.max(-1e9, Math.round(a)))) : [0, 0, 0, 0], l = Ft(n.img) ? yl(n.img, r, o) : Bn(n.img, r, o);
    l && this.painter().image(e, l.dst, l.img);
  }
  /** The font as a LOGFONT whose height is in world units. */
  logFont(e) {
    const n = e.unit === 0 ? e.em : e.em * Is(e.unit, this.dpi) / this.page;
    return {
      font: { ...ko(), family: e.family, height: -Math.min(1e6, Math.max(0, n)), weight: (e.style & 1) !== 0 ? 700 : 400, italic: (e.style & 2) !== 0, underline: (e.style & 4) !== 0, strike: (e.style & 8) !== 0 },
      escapement: 0
    };
  }
  /** DrawString: lines of text laid out in a rectangle by the string format's alignments. */
  drawString(e, n, s) {
    const o = this.font(n & 255), i = this.brushOf(n, s.u32(0));
    if (!o || !i) return;
    const r = xn(i), l = this.objects[s.u32(4)], a = l?.kind === "format" ? l.format : { flags: 0, align: 0, lineAlign: 0 }, c = Math.min(s.u32(8), Os), u = Rt(s, 12, 4);
    if (!u) return;
    const [h, d, m, f] = u, p = [];
    for (let D = 0; D < c; D++) p.push(s.u16(28 + D * 2));
    const g = this.logFont(o), b = -g.font.height, y = m > 0 && (a.flags & 4096) === 0, k = [];
    let w = [];
    const v = () => {
      const D = w.filter((R) => R !== 13);
      y ? k.push(...Ml(D, m, b)) : k.push(D), w = [];
    };
    for (const D of p)
      D === 10 ? v() : w.push(D);
    v();
    const S = b * 1.2, [$, I] = a.align === 1 ? [h + m / 2, ol] : a.align === 2 ? [h + m, sl] : [h, 0], L = S * k.length, O = a.lineAlign === 1 ? d + (f - L) / 2 : a.lineAlign === 2 ? d + f - L : d, F = m > 0 && f > 0 && (a.flags & 16384) === 0 ? [h, d, h + m, d + f] : null, T = this.painter();
    k.forEach((D, R) => {
      if (!D.length) return;
      const [B, C] = ae(D, []);
      let P = [$, O + S * R], E = I;
      a.lineAlign === 2 && k.length === 1 && (P = [$, d + f], E = I | il), T.text(e, P, B, C, { color: r, font: g, align: E, clip: F }, wt);
    });
  }
  /** DrawDriverString with character codes (CmapLookup): positioned glyphs on a baseline. */
  drawDriverString(e, n, s) {
    const o = this.font(n & 255), i = this.brushOf(n, s.u32(0));
    if (!o || !i) return;
    const r = xn(i), l = s.u32(4), a = Math.min(s.u32(12), Os);
    let c = [];
    for (let p = 0; p < a; p++) c.push(s.u16(16 + p * 2));
    if ((l & 1) === 0 && (c = wl(o.family, c), !c))
      return;
    const u = At(s, 16 + a * 2, a, !1), h = s.u32(8) !== 0 ? re(s, 16 + a * 10) : wt;
    if (!h || !u.length) return;
    const d = this.logFont(o);
    let m = [];
    if ((l & 4) === 0) {
      for (let p = 0; p + 1 < u.length; p++) m.push(u[p + 1][0] - u[p][0]);
      m.push(m.length ? m[m.length - 1] : -d.font.height * 0.5);
    }
    let f;
    [f, m] = ae(c, m), this.painter().text(e, u[0], f, m, { color: r, font: d, align: rl, clip: null }, h);
  }
}
function Es(t, e) {
  const n = new Uint8Array(e);
  let s = 0;
  for (const o of t)
    n.set(o, s), s += o.length;
  return n;
}
function Ns(t) {
  return t.kind === "image" ? t.data.kind === "bitmap" ? Ft(t.data.img) ? t.data.img.bytes.length : t.data.img.px.length : t.data.pic.items.length * 128 : t.kind === "brush" && t.fill.kind === "texture" ? Ft(t.fill.img) ? t.fill.img.bytes.length : t.fill.img.px.length : t.kind === "path" ? t.ops.length * 56 : 0;
}
function Is(t, e) {
  switch (t) {
    case 3:
      return e / 72;
    case 4:
      return e;
    case 5:
      return e / 300;
    case 6:
      return e / 25.4;
    default:
      return 1;
  }
}
class Rs {
  xf;
  clip;
  constructor(e, n) {
    this.xf = e, this.clip = n;
  }
  begin(e, n) {
    const s = e.world();
    e.saveDc(), e.modifyWorld(xt(xt(n, this.xf), s), 4), e.setClip(this.clip);
  }
  end(e) {
    e.restoreDc(-1), e.setClip(null);
  }
  fill(e, n, s) {
    if (this.begin(e, wt), e.setPen({ style: _e, width: 0, color: [0, 0, 0, 0] }), s.kind === "solid")
      e.setBrush($t(Dt, s.color)), e.shape(n, !0, !1);
    else if (s.kind === "hatch") {
      const o = Ao(s.style, s.fg, s.bg);
      o ? e.tileShape(n, { w: 8, h: 8, px: o, cell: e.patternPx }) : (e.setBrush($t(Dt, Hn(s.fg, s.bg, 0.5))), e.shape(n, !0, !1));
    } else {
      const o = $o(xt(al(s), e.deviceAffine()));
      o && e.shadeShape(n, (i) => ll(s, kn(o, i)));
    }
    this.end(e);
  }
  stroke(e, n, [s, o]) {
    this.begin(e, wt), e.setPen({ style: 0, width: o, color: s }), e.setBrush($t(Un, [0, 0, 0, 0])), e.shape(n, !1, !0), this.end(e);
  }
  image(e, n, s) {
    this.begin(e, wt), e.bitmap(n, s), this.end(e);
  }
  /** A nested metafile's picture stretched into world rectangle `dst` = `[x, y, w, h]`. */
  picture(e, [n, s, o, i], r) {
    this.begin(e, wt);
    const l = o / r.width, a = i / r.height, c = xt([l, 0, 0, a, n, s], e.deviceAffine()), u = Math.sqrt(Math.abs(c[0] * c[3] - c[1] * c[2])), h = (m, f) => kn(c, [m, f]), d = (m) => m.map((f) => f.k === "M" ? nt(h(f.x, f.y)) : f.k === "L" ? ct(h(f.x, f.y)) : f.k === "C" ? St(h(f.x1, f.y1), h(f.x2, f.y2), h(f.x, f.y)) : pt);
    for (const m of r.items) {
      if (e.full()) break;
      let f;
      if (m.kind === "path")
        f = { kind: "path", ops: d(m.segs), fill: m.fill, stroke: m.stroke ? [m.stroke[0], m.stroke[1] * u] : null, evenOdd: m.evenOdd, region: null };
      else if (m.kind === "pattern") {
        const p = m.tile, g = { w: p.width, h: p.height, px: p.rgba, cell: p.cell[0] * u };
        f = { kind: "pattern", ops: d(m.segs), evenOdd: m.evenOdd, tile: g, region: null };
      } else if (m.kind === "bitmap") {
        const p = h(m.rect[0], m.rect[1]), g = h(m.rect[0] + m.rect[2], m.rect[1] + m.rect[3]);
        let b = m.img;
        if (Ft(b)) {
          const y = p[0] > g[0], k = p[1] > g[1];
          (y || k) && (b = { ...b, flip: [!!b.flip?.[0] !== y, !!b.flip?.[1] !== k] });
        } else
          b = { ...b, px: b.px.slice() }, Dn(b, p[0] > g[0], p[1] > g[1]);
        f = { kind: "bitmap", rect: [Math.min(p[0], g[0]), Math.min(p[1], g[1]), Math.abs(g[0] - p[0]), Math.abs(g[1] - p[1])], img: b, region: null };
      } else {
        const p = { ...m.text };
        if (p.transform = xt(p.transform, c), p.clip) {
          const [g, b, y, k] = p.clip, w = h(g, b), v = h(y, k);
          p.clip = [Math.min(w[0], v[0]), Math.min(w[1], v[1]), Math.max(w[0], v[0]), Math.max(w[1], v[1])];
        }
        f = { kind: "text", text: p, region: null };
      }
      e.pushDevice(f);
    }
    this.end(e);
  }
  text(e, n, s, o, i, r) {
    this.begin(e, r), e.setTextStyle(i.color, i.font, i.align), e.drawText(n, s, o, i.clip ? jn : 0, i.clip), this.end(e);
  }
}
const kn = (t, e) => [e[0] * t[0] + e[1] * t[2] + t[4], e[0] * t[1] + e[1] * t[3] + t[5]];
function $o(t) {
  const e = t[0] * t[3] - t[1] * t[2];
  if (!Number.isFinite(e) || Math.abs(e) < 1e-12) return null;
  const n = t[3] / e, s = -t[1] / e, o = -t[2] / e, i = t[0] / e;
  return [n, s, o, i, -(t[4] * n + t[5] * o), -(t[4] * s + t[5] * i)];
}
const Nt = (t) => [t >>> 16 & 255, t >>> 8 & 255, t & 255, t >>> 24 & 255];
function Rt(t, e, n) {
  const s = [];
  for (let o = 0; o < n; o++) s.push(t.f32(e + o * 4));
  return s.every(Number.isFinite) ? s : null;
}
const re = (t, e) => Rt(t, e, 6), en = (t) => Number.isFinite(t) ? t : null;
function nn(t, e, n) {
  switch (t) {
    case 1: {
      const s = Oo(e, 0, n);
      return s ? { kind: "brush", fill: s } : null;
    }
    case 2:
      return dl(e, n);
    case 3: {
      const s = Xn(e);
      return s ? { kind: "path", ops: s } : null;
    }
    case 4:
      return pl(e);
    case 5: {
      const s = Io(e, n);
      return s ? { kind: "image", data: s } : null;
    }
    case 6:
      return ml(e);
    case 7:
      return { kind: "format", format: { flags: e.u32(4), align: e.u32(12), lineAlign: e.u32(16) } };
    default:
      return null;
  }
}
function Oo(t, e, n) {
  const s = t.tail(e + 8);
  switch (t.u32(e + 4)) {
    case 0:
      return { kind: "solid", color: Nt(s.u32(0)) };
    case 1:
      return { kind: "hatch", style: s.u32(0), fg: Nt(s.u32(4)), bg: Nt(s.u32(8)) };
    case 2: {
      const o = s.u32(0), i = s.u32(4);
      let r = wt, l = 8;
      if ((o & 2) !== 0) {
        const c = re(s, 8);
        if (!c) return null;
        r = c, l = 32;
      }
      const a = Io(s.tail(l), n);
      return !a || a.kind !== "bitmap" ? null : { kind: "texture", img: a.img, wrap: i, xf: r };
    }
    case 3:
      return fl(s);
    case 4:
      return hl(s);
    default:
      return null;
  }
}
function hl(t) {
  const e = t.u32(0), n = t.u32(4), s = Rt(t, 8, 4);
  if (!s) return null;
  const o = Nt(t.u32(24)), i = Nt(t.u32(28));
  let r = 40, l = wt;
  if ((e & 2) !== 0) {
    const c = re(t, r);
    if (!c) return null;
    l = c, r += 24;
  }
  let a = [[0, o], [1, i]];
  if ((e & 4) !== 0) {
    const c = Math.min(t.u32(r), bn);
    a = [];
    for (let u = 0; u < c; u++) a.push([t.f32(r + 4 + u * 4), Nt(t.u32(r + 4 + c * 4 + u * 4))]);
  } else if ((e & 8) !== 0) {
    const c = Math.min(t.u32(r), bn);
    a = [];
    for (let u = 0; u < c; u++) {
      const h = t.f32(r + 4 + c * 4 + u * 4);
      a.push([t.f32(r + 4 + u * 4), Hn(o, i, Math.min(1, Math.max(0, h)))]);
    }
  }
  return a = a.filter((c) => Number.isFinite(c[0])).sort((c, u) => c[0] - u[0]), a.length ? { kind: "linear", rect: s, stops: a, wrap: n, xf: l } : null;
}
function fl(t) {
  const e = t.u32(0), n = Nt(t.u32(8)), s = Rt(t, 12, 2);
  if (!s) return null;
  const o = Math.min(t.u32(20), bn), i = o > 0 ? Nt(t.u32(24)) : n;
  let r = 24 + o * 4, l;
  if ((e & 1) !== 0) {
    const c = t.u32(r), u = Xn(t.tail(r + 4));
    l = u ? Qt(u) : null, r += 4 + c;
  } else {
    const c = t.u32(r), u = At(t, r + 4, c, !1);
    l = Qt(Re(u, !0)), r += 4 + 8 * Math.min(c, te);
  }
  if (!l) return null;
  const a = (e & 2) !== 0 ? re(t, r) : wt;
  return a ? { kind: "radial", center: [s[0], s[1]], radius: [(l[2] - l[0]) / 2, (l[3] - l[1]) / 2], stops: [[0, n], [1, i]], xf: a } : null;
}
function dl(t, e) {
  const n = t.u32(8), s = t.f32(16);
  let o = 20;
  for (const [r, l] of [[1, 24], [2, 4], [4, 4], [8, 4], [16, 4], [32, 4], [64, 4], [128, 4]]) (n & r) !== 0 && (o += l);
  for (const r of [256, 512, 1024])
    (n & r) !== 0 && (o += r === 512 ? 4 : 4 + 4 * Math.min(t.u32(o), te));
  for (const r of [2048, 4096]) (n & r) !== 0 && (o += 4 + Math.min(t.u32(o), 1 << 20));
  const i = Oo(t, o, e);
  return i ? { kind: "pen", color: xn(i), width: Number.isFinite(s) ? Math.min(1e5, Math.max(0, s)) : 0 } : null;
}
function Xn(t) {
  const e = Math.min(t.u32(4), te), n = t.u32(8);
  if ((n & 6144) !== 0) return null;
  const s = (n & 16384) !== 0, o = At(t, 12, e, s), i = t.slice(12 + e * (s ? 4 : 8), e), r = [];
  let l = 0;
  for (; l < e; ) {
    const a = i[l], c = o[l];
    if ((a & 7) === 0) r.push(nt(c));
    else if ((a & 7) === 3 && l + 2 < e) {
      r.push(St(c, o[l + 1], o[l + 2])), (i[l + 2] & 128) !== 0 && r.push(pt), l += 3;
      continue;
    } else r.push(ct(c));
    (a & 128) !== 0 && r.push(pt), l++;
  }
  return r;
}
function pl(t) {
  const n = wn(t, 8, 0, { n: 0 });
  return n ? { kind: "region", area: n[0] } : null;
}
function wn(t, e, n, s) {
  if (s.n++, n > el || s.n > Ts) return null;
  const o = t.u32(e);
  if (o === 268435456) {
    const i = Rt(t, e + 4, 4);
    if (!i) return null;
    const [r, l, a, c] = i;
    return [ce([Math.min(r, r + a), Math.min(l, l + c), Math.max(r, r + a), Math.max(l, l + c)]), 20];
  }
  if (o === 268435457) {
    const i = t.u32(e + 4);
    if (i < 12) return null;
    const r = t.sub(e + 8, i);
    if (s.n += Math.min(r.u32(4), te), s.n > Ts) return null;
    const l = Xn(r);
    return l ? [To(l), 8 + i] : null;
  }
  if (o === 268435458) return [[], 4];
  if (o === 268435459) return [null, 4];
  if (o <= 5) {
    const i = wn(t, e + 4, n + 1, s);
    if (!i) return null;
    const r = wn(t, e + 4 + i[1], n + 1, s);
    return r ? [o === 0 ? r[0] : o === 1 ? Eo(i[0], r[0]) : o === 2 ? No(i[0], r[0]) : i[0], 4 + i[1] + r[1]] : null;
  }
  return null;
}
function To(t) {
  const e = Ue(t);
  if (e.length === 1) {
    const s = ve(e[0][0]);
    if (s) return s;
  }
  const n = Qt(t);
  return n ? ce(n) : [];
}
function Eo(t, e) {
  return t === null ? e : e === null ? t : t.length >= 3 && e.length >= 3 ? ve(Ln(t, e)) ?? [] : [];
}
function No(t, e) {
  if (t === null || e === null) return null;
  if (t.length < 3) return e;
  if (e.length < 3) return t;
  const n = ze([...t, ...e]);
  return n ? ce(n) : [];
}
function sn(t, e) {
  if (t === null) return null;
  const n = t.map((s) => kn(e, s));
  return n.length < 3 ? [] : ve(n) ?? [];
}
function Fs([t, e, n, s], o, i, r) {
  const l = (t + n) / 2, a = (e + s) / 2, c = (n - t) / 2, u = (s - e) / 2, h = Math.min(360, Math.max(-360, i)), d = (w) => {
    const v = w * Math.PI / 180;
    return Math.atan2(c * Math.sin(v), u * Math.cos(v));
  }, m = d(o);
  let f = Math.abs(h) >= 360 ? Math.sign(h) * Math.PI * 2 : d(o + h) - m;
  if (Math.abs(h) < 360) {
    for (; h > 0 && f < 0; ) f += Math.PI * 2;
    for (; h < 0 && f > 0; ) f -= Math.PI * 2;
  }
  const p = (w) => [l + c * Math.cos(w), a + u * Math.sin(w)], g = r ? [nt([l, a]), ct(p(m))] : [nt(p(m))], b = Math.min(4, Math.max(1, Math.ceil(Math.abs(f) / (Math.PI / 2)))), y = f / b, k = 4 / 3 * Math.tan(y / 4);
  for (let w = 0; w < b; w++) {
    const v = m + y * w, S = m + y * (w + 1), $ = p(v), I = p(S);
    g.push(St([$[0] - k * c * Math.sin(v), $[1] + k * u * Math.cos(v)], [I[0] + k * c * Math.sin(S), I[1] - k * u * Math.cos(S)], I));
  }
  return r && g.push(pt), g;
}
function ml(t) {
  const e = t.f32(4), n = Math.min(t.u32(20), 64), s = [];
  for (let i = 0; i < n; i++) s.push(t.u16(24 + i * 2));
  const o = ae(s, [])[0].replace(/\0+$/, "");
  return Number.isFinite(e) ? { kind: "font", font: { em: e, unit: t.u32(8), style: t.u32(12), family: o } } : null;
}
function Io(t, e) {
  const n = t.u32(4);
  if (n === 1) {
    const s = xl(t);
    return s ? { kind: "bitmap", img: s } : null;
  }
  if (n === 2) {
    const s = gl(t, e);
    return s ? { kind: "meta", pic: s } : null;
  }
  return null;
}
function gl(t, e) {
  if (e + 1 > nl) return null;
  const n = t.u32(12), s = yt(() => t.slice(16, n)) ?? t.tail(16).b;
  let o = null;
  try {
    o = Ro(s, e + 1);
  } catch {
    o = null;
  }
  return o && o.width > 0 && o.height > 0 ? o : null;
}
let Ro = () => {
  throw new Error("nested parse not set");
};
function bl(t) {
  Ro = t;
}
function xl(t) {
  const e = t.i32(8), n = t.i32(12), s = t.i32(16), o = t.u32(20), i = t.tail(28);
  if (t.u32(24) === 1) return $r(i.b);
  if (e <= 0 || n <= 0 || e * n > mo) return null;
  const r = o >>> 8 & 255;
  let l = [], a = i;
  if ((o & 65536) !== 0) {
    const m = Math.min(i.u32(4), 256);
    for (let f = 0; f < m; f++) l.push(Nt(i.u32(8 + f * 4)));
    a = i.tail(8 + m * 4);
  }
  const c = Math.ceil(e * r / 8), u = Math.max(Math.abs(s), c), h = new Uint8Array(e * n * 4);
  for (let m = 0; m < n; m++) {
    const f = a.slice(m * u, c);
    for (let p = 0; p < e; p++) {
      let g;
      if ((r === 1 || r === 4 || r === 8) && l.length) {
        const b = p * r, y = f[b >> 3] >> 8 - r - b % 8 & (1 << r) - 1;
        g = l[y] ?? [0, 0, 0, 255];
      } else if (r === 24) {
        const b = p * 3;
        g = [f[b + 2], f[b + 1], f[b], 255];
      } else if (o === 139273 && r === 32) {
        const b = p * 4;
        g = [f[b + 2], f[b + 1], f[b], 255];
      } else if (o === 925707 && r === 32) {
        const b = p * 4, y = f[b + 3], k = (w) => y === 0 ? w : Math.min(255, Math.floor((w * 255 + (y >> 1)) / y));
        g = [k(f[b + 2]), k(f[b + 1]), k(f[b]), y];
      } else if (r === 32) {
        const b = p * 4;
        g = [f[b + 2], f[b + 1], f[b], f[b + 3]];
      } else if (o === 135174 && r === 16) {
        const b = f[p * 2] | f[p * 2 + 1] << 8, y = (k, w) => Math.floor(k * 255 / ((1 << w) - 1));
        g = [y(b >> 11, 5), y(b >> 5 & 63, 6), y(b & 31, 5), 255];
      } else if (r === 16) {
        const b = f[p * 2] | f[p * 2 + 1] << 8, y = (k) => Math.floor((k & 31) * 255 / 31);
        g = [y(b >> 10), y(b >> 5), y(b), 255];
      } else
        return null;
      if (g.some((b) => b === void 0)) return null;
      h.set(g, (m * e + p) * 4);
    }
  }
  const d = { w: e, h: n, bottomUp: s < 0, px: h };
  return d.bottomUp && (Dn(d, !1, !0), d.bottomUp = !1), d;
}
function yl(t, e, n) {
  const [s, o, i, r] = e[2] > 0 && e[3] > 0 ? e : [0, 0, t.w, t.h], l = Math.max(s, 0), a = Math.min(s + i, t.w), c = Math.max(o, 0), u = Math.min(o + r, t.h);
  if (a <= l || u <= c) return null;
  const h = n[2] / i, d = n[3] / r, m = l === 0 && c === 0 && a === t.w && u === t.h;
  return { img: { ...t, crop: m ? null : [l, c, a - l, u - c] }, dst: [n[0] + (l - s) * h, n[1] + (c - o) * d, (a - l) * h, (u - c) * d] };
}
function At(t, e, n, s) {
  const o = Math.min(n, te), i = [];
  for (let r = 0; r < o; r++)
    if (s) i.push([t.i16(e + r * 4), t.i16(e + r * 4 + 2)]);
    else {
      const l = t.f32(e + r * 8), a = t.f32(e + r * 8 + 4);
      if (!Number.isFinite(l) || !Number.isFinite(a)) return [];
      i.push([l, a]);
    }
  return i;
}
function Xt(t, e, n, s) {
  const o = At(t, e, Math.min(n, te / 2) * 2, s), i = [];
  for (let r = 0; r + 1 < o.length; r += 2) i.push([o[r][0], o[r][1], o[r][0] + o[r + 1][0], o[r][1] + o[r + 1][1]]);
  return i;
}
function on(t, e, n, s, o) {
  const i = t.length;
  if (i < 2) return [];
  const r = Math.min(10, Math.max(0, e)) / 3, l = (h) => t[n ? Ht(h, i) : Math.min(i - 1, Math.max(0, h))] ?? [0, 0], a = n ? 0 : Math.min(s, i - 1), c = n ? i : Math.min(o, i - 1 - a), u = [nt(l(a))];
  for (let h = a; h < a + c; h++) {
    const d = l(h - 1), m = l(h), f = l(h + 1), p = l(h + 2);
    u.push(St([m[0] + (f[0] - d[0]) * r, m[1] + (f[1] - d[1]) * r], [f[0] - (p[0] - m[0]) * r, f[1] - (p[1] - m[1]) * r], f));
  }
  return n && u.push(pt), u;
}
function Re(t, e) {
  const n = t.map((s, o) => o === 0 ? nt(s) : ct(s));
  return e && n.push(pt), n;
}
function Bs([t, e, n, s]) {
  const o = (t + n) / 2, i = (e + s) / 2, r = (n - t) / 2, l = (s - e) / 2, a = 0.55228475, c = r * a, u = l * a;
  return [
    nt([o + r, i]),
    St([o + r, i + u], [o + c, i + l], [o, i + l]),
    St([o - c, i + l], [o - r, i + u], [o - r, i]),
    St([o - r, i - u], [o - c, i - l], [o, i - l]),
    St([o + c, i - l], [o + r, i - u], [o + r, i]),
    pt
  ];
}
const kl = ["arial", "arial black", "times new roman", "courier new", "verdana", "georgia", "tahoma", "trebuchet ms", "comic sans ms", "impact"];
function wl(t, e) {
  if (!kl.includes(t.trim().toLowerCase())) return null;
  const n = [];
  for (const s of e) {
    if (s < 3 || s > 97) return null;
    n.push(s + 29);
  }
  return n;
}
function Ds(t) {
  const e = String.fromCharCode(t);
  return " ilj.,:;'!|Iftr".includes(e) ? 0.3 : "mwMW".includes(e) ? 0.85 : /[A-Z0-9]/.test(e) ? 0.62 : t >= 11904 ? 1 : 0.52;
}
function Ml(t, e, n) {
  if (n <= 0 || !Number.isFinite(e)) return [t];
  const s = (u) => {
    let h = u.length;
    for (; h > 0 && u[h - 1] === 32; ) h--;
    return h;
  }, o = (u) => u.reduce((h, d) => h + Ds(d) * n, 0), i = [];
  let r = [], l = 0;
  const a = [];
  let c = [];
  for (const u of t)
    c.push(u), u === 32 && (a.push(c), c = []);
  c.length && a.push(c);
  for (const u of a) {
    const h = s(u), d = o(u.slice(0, h)), m = o(u);
    if (r.length) {
      if (l + d <= e) {
        r.push(...u), l += m;
        continue;
      }
    } else if (d <= e) {
      r.push(...u), l = m;
      continue;
    }
    if (r.length && (i.push(r.slice(0, s(r))), r = []), d <= e) {
      r.push(...u), l = m;
      continue;
    }
    let f = 0;
    for (const p of u) {
      const g = Ds(p) * n;
      r.length ? f + g <= e ? (r.push(p), f += g) : (i.push(r.slice(0, s(r))), r = [p], f = g) : (r.push(p), f = g);
    }
    l = f;
  }
  return i.push(r.slice(0, s(r))), i;
}
class Zt extends Error {
  kind;
  constructor(e) {
    super(e === "NotMetafile" ? "not a WMF or EMF file" : e === "BadHeader" ? "metafile header is truncated or invalid" : "metafile has no readable records"), this.kind = e;
  }
}
const Fo = 256, vl = 512, Sl = 1179469088, Ls = 72 / 2540, Cl = 13369376, Pl = 983040, Al = 0;
function Bo(t) {
  return t.optU32(0) === 1 && t.optU32(40) === Sl;
}
function Do(t, e = 0, n = !1) {
  if (!Bo(t)) throw new Zt("BadHeader");
  const s = t.optU32(4), o = yt(() => Pt(t, 8));
  if (s === void 0 || !o) throw new Zt("BadHeader");
  const [i, r, l, a] = o, c = $l(t) ?? (l > i && a > r ? { rect: [i, r, l - i, a - r], size: null } : null), u = new Ae();
  l > i && a > r && u.setClipSurface([i, r, l, a]);
  const h = Lo(t);
  h && u.setDeviceMm(h);
  const d = new ul(e, n);
  d.frame = c ? c.rect : null;
  let m = 0, f = Math.max(s, 88);
  for (; !u.full(); ) {
    const p = t.optU32(f), g = t.optU32(f + 4);
    if (p === void 0 || g === void 0 || g < 8 || g % 4 !== 0 || f + g > t.length) break;
    const b = t.sub(f, g);
    if (p === 14) break;
    p === 70 && b.optU32(12) === Kr ? b.length >= 16 && d.comment(u, b.tail(16)) : yt(() => Ol(u, p, b)), m++, f += g;
  }
  if (m === 0) throw new Zt("NoRecords");
  return !n && d.skippedDual && u.items.length === 0 ? Do(t, e, !0) : { cv: u, frame: c };
}
function Lo(t) {
  const e = t.optI32(72), n = t.optI32(76), s = t.optI32(80), o = t.optI32(84);
  return e === void 0 || n === void 0 || s === void 0 || o === void 0 ? null : e > 0 && n > 0 && s > 0 && o > 0 ? [e / s, n / o] : null;
}
function $l(t) {
  const e = yt(() => Pt(t, 24));
  if (!e) return null;
  const [n, s, o, i] = e;
  if (o <= n || i <= s) return null;
  const r = Lo(t);
  if (!r) return null;
  const l = r[0] / 100, a = r[1] / 100;
  return { rect: [n * l, s * a, (o - n) * l, (i - s) * a], size: [(o - n) * Ls, (i - s) * Ls] };
}
function Ol(t, e, n) {
  if (!t.full())
    switch (e) {
      case 9:
        t.setWindowExt(Ot(n, 8));
        break;
      case 10:
        t.setWindowOrg(Ot(n, 8));
        break;
      case 11:
        t.setViewportExt(Ot(n, 8));
        break;
      case 12:
        t.setViewportOrg(Ot(n, 8));
        break;
      case 17:
        t.setMapMode(n.u32(8));
        break;
      case 19:
        t.setPolyfill(n.u32(8));
        break;
      case 20:
        t.setRop2(n.u32(8));
        break;
      case 33:
        t.saveDc();
        break;
      case 34:
        t.restoreDc(n.i32(8));
        break;
      case 35:
        t.modifyWorld(js(n, 8), 4);
        break;
      case 36: {
        const s = js(n, 8);
        t.modifyWorld(s, n.u32(32));
        break;
      }
      case 37:
        t.select(n.u32(8));
        break;
      case 38:
        Fl(t, n);
        break;
      case 95:
        Bl(t, n);
        break;
      case 39:
        Dl(t, n);
        break;
      case 93:
      case 94:
        Ll(t, n, e === 93);
        break;
      case 82:
        jl(t, n);
        break;
      case 18:
        t.setBkMode(n.u32(8));
        break;
      case 22:
        t.setTextAlign(n.u32(8));
        break;
      case 24:
        t.setTextColor(n.u32(8));
        break;
      case 25:
        t.setBkColor(n.u32(8));
        break;
      case 83:
      case 84:
        _l(t, n, e === 84);
        break;
      case 108:
        zl(t, n);
        break;
      case 40:
        t.deleteObject(n.u32(8));
        break;
      case 29:
        t.excludeClipRect(Pt(n, 8));
        break;
      case 30:
        t.intersectClipRect(Pt(n, 8));
        break;
      case 75:
        Tl(t, n);
        break;
      case 27:
        t.moveTo(Ot(n, 8));
        break;
      case 54:
        t.lineTo(Ot(n, 8));
        break;
      case 42: {
        const [s, o, i, r] = Pt(n, 8);
        t.shape(co(s, o, i, r), !0, !0);
        break;
      }
      case 43: {
        const [s, o, i, r] = Pt(n, 8);
        t.shape(Ct(s, o, i, r), !0, !0);
        break;
      }
      case 44: {
        const s = n.i32(24), o = n.i32(28), [i, r, l, a] = Pt(n, 8);
        t.shape(ao(i, r, l, a, s, o), !0, !0);
        break;
      }
      case 45:
      case 46:
      case 47: {
        const [s, o, i] = Rl(n), r = e === 45 ? "arc" : e === 46 ? "chord" : "pie", [l, a, c, u] = s;
        t.shape(uo(l, a, c, u, o, i, r, t.arcClockwise), r !== "arc", !0);
        break;
      }
      // Beyond DeckCraft: arc direction, angle arcs, POLYDRAW, region fills, clip paths, palettes.
      case 57:
        t.arcClockwise = n.u32(8) === 2;
        break;
      case 41:
        El(t, n);
        break;
      case 56:
      case 92:
        Nl(t, n, e === 56);
        break;
      case 71: {
        const s = rn(n, 24, 32);
        t.fillRegion(s, n.u32(28));
        break;
      }
      case 74: {
        const s = rn(n, 24, 28);
        t.fillRegion(s, null);
        break;
      }
      case 72: {
        const s = rn(n, 24, 40);
        t.frameRegion(s, n.u32(28), n.i32(32), n.i32(36));
        break;
      }
      case 67:
        t.selectClipPath(n.u32(8));
        break;
      case 49:
        Il(t, n);
        break;
      case 48:
        t.selectPalette(n.u32(8));
        break;
      case 4:
      case 87:
        t.poly(fe(n, e === 4), !1, !1, !0);
        break;
      case 3:
      case 86:
        t.poly(fe(n, e === 3), !0, !0, !0);
        break;
      case 6:
      case 89:
        t.lineChain(fe(n, e === 6), !1, !0);
        break;
      // POLYBEZIER starts its own figure at the first point and leaves the current point alone;
      // POLYBEZIERTO continues from the current point.
      case 2:
      case 85: {
        const s = fe(n, e === 2);
        s.length && t.bezier(s[0], s.slice(1));
        break;
      }
      case 5:
      case 88:
        t.bezierTo(fe(n, e === 5));
        break;
      case 7:
      case 90: {
        const [s, o] = Us(n, e === 7);
        t.shape(dn(o, s, !1), !1, !0);
        break;
      }
      case 8:
      case 91: {
        const [s, o] = Us(n, e === 8);
        t.shape(dn(o, s, !0), !0, !0);
        break;
      }
      case 59:
        t.beginPath();
        break;
      case 60:
        t.endPath();
        break;
      case 61:
        t.closeFigure();
        break;
      case 62:
        t.paintPath(!0, !1);
        break;
      case 63:
        t.paintPath(!0, !0);
        break;
      case 64:
        t.paintPath(!1, !0);
        break;
      case 76:
      case 77:
        Hl(t, n, e === 77);
        break;
      case 80:
        Vl(t, n);
        break;
      case 81:
        Wl(t, n);
        break;
      case 114:
        Xl(t, n);
        break;
    }
}
function Tl(t, e) {
  const n = e.u32(8), s = e.u32(12);
  if (n === 0) {
    t.resetClip();
    return;
  }
  const o = 16;
  if (n < 32 || e.u32(o + 4) !== 1) return;
  const i = Math.min(e.u32(o + 8), Jt), r = o + n, l = [];
  for (let a = 0; a < i; a++) {
    const c = o + 32 + a * 16;
    if (c + 16 > r) break;
    l.push(Pt(e, c));
  }
  t.selectClipRects(l, s);
}
function rn(t, e, n) {
  const s = t.u32(e);
  if (s < 32 || t.u32(n + 4) !== 1) return [];
  const o = Math.min(t.u32(n + 8), Jt * 64), i = [];
  for (let r = 0; r < o && 32 + r * 16 + 16 <= s; r++) i.push(Pt(t, n + 32 + r * 16));
  return i;
}
function El(t, e) {
  const [n, s] = Ot(e, 8), o = e.u32(16), i = e.f32(20), r = e.f32(24);
  if (!Number.isFinite(i) || !Number.isFinite(r) || o > 1e7) return;
  const l = -(i * Math.PI) / 180, a = -(Math.max(-3600, Math.min(3600, r)) * Math.PI) / 180, c = [n + o * Math.cos(l), s + o * Math.sin(l)], u = [n + o * Math.cos(l + a), s + o * Math.sin(l + a)], h = [nt(t.currentPos()), ct(c), ...a !== 0 ? Yt(n, s, o, o, l, a) : []];
  t.setCurrentPos(u), t.shape(h, !1, !0);
}
function Nl(t, e, n) {
  const s = e.u32(24);
  if (s > le) return;
  const o = e.tail(28).points(0, s, n), i = e.slice(28 + s * (n ? 8 : 4), s), r = [nt(t.currentPos())];
  let l = t.currentPos();
  for (let a = 0; a < s; a++) {
    const c = i[a] & 6;
    c === 6 ? (r.push(nt(o[a])), l = o[a]) : c === 4 && a + 2 < s ? (r.push(St(o[a], o[a + 1], o[a + 2])), a += 2) : r.push(ct(o[a])), i[a] & 1 ? (r.push(pt), t.setCurrentPos(l)) : t.setCurrentPos(o[a]);
  }
  t.shape(r, !1, !0);
}
function Il(t, e) {
  const n = e.u32(8), s = Math.min(e.u16(14), 1024), o = [];
  for (let i = 0; i < s; i++) o.push([e.u8(16 + i * 4), e.u8(17 + i * 4), e.u8(18 + i * 4), 255]);
  t.addObject(n, { kind: "palette", colors: o });
}
const Ot = (t, e) => [t.i32(e), t.i32(e + 4)], Pt = (t, e) => [t.i32(e), t.i32(e + 4), t.i32(e + 8), t.i32(e + 12)], J = (t, e) => t.optI32(e) ?? 0;
function js(t, e) {
  return [0, 1, 2, 3, 4, 5].map((n) => t.f32(e + n * 4));
}
const Rl = (t) => [Pt(t, 8), Ot(t, 24), Ot(t, 32)];
function fe(t, e) {
  const n = t.u32(24);
  return n > le ? [] : t.tail(28).points(0, n, e);
}
function Us(t, e) {
  const n = t.u32(24);
  if (n > le) return [[], []];
  t.slice(32, n * 4);
  const s = [];
  for (let i = 0; i < n; i++) s.push(t.u32(32 + i * 4));
  const o = s.reduce((i, r) => i + r, 0);
  return o > le ? [[], []] : [s, t.tail(32 + n * 4).points(0, o, e)];
}
function Fl(t, e) {
  const n = e.u32(8), s = e.u32(12), o = e.i32(16), i = e.u32(24);
  t.addObject(n, { kind: "pen", pen: { style: s, width: o, color: t.colorOf(i) } });
}
function Bl(t, e) {
  const n = e.u32(8), s = e.u32(28), o = e.u32(32), i = e.u32(36), r = e.u32(40), l = (s & Pl) === Al ? 0 : o, a = i === Un ? _e : s & So;
  t.addObject(n, { kind: "pen", pen: { style: a, width: l, color: t.colorOf(r) } });
}
function Dl(t, e) {
  const n = e.u32(8), s = e.u32(12), o = e.u32(16), i = $t(s, t.colorOf(o));
  s === _n && (i.hatch = e.optU32(20) ?? 0), t.addObject(n, { kind: "brush", brush: i });
}
function Ll(t, e, n) {
  const s = e.u32(8), o = e.u32(12), i = e.u32(16), r = e.u32(20), l = e.u32(24), a = e.u32(28), c = Ce(e.sub(i, r), e.sub(l, a), !1), u = c && Po(c, n || o === 1);
  u && t.addObject(s, { kind: "brush", brush: u });
}
function jl(t, e) {
  const n = e.u32(8), s = e.i32(12), o = e.optI32(16) ?? 0, i = e.optI32(20) ?? 0, r = e.optI32(28) ?? 0, l = (h) => e.optU8(h) ?? 0, a = [];
  for (let h = 0; h < 32; h++) {
    const d = e.optU16(40 + 2 * h);
    if (d === void 0 || d === 0) break;
    a.push(d);
  }
  const [c] = ae(a, []), u = {
    family: c.trim(),
    height: s,
    width: o,
    weight: Math.min(1e3, Math.max(0, r)),
    italic: l(32) !== 0,
    underline: l(33) !== 0,
    strike: l(34) !== 0,
    charset: l(35)
  };
  t.addObject(n, { kind: "font", font: { font: u, escapement: i } });
}
function Ul(t, e, n, s) {
  const o = (s & Br) !== 0 ? 8 : 4;
  if (e === 0) return [];
  const i = [];
  for (let r = 0; r < n; r++) {
    const l = t.optI32(e + r * o);
    if (l === void 0) return [];
    i.push(l);
  }
  return i;
}
const jo = (t) => {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) e.push(t[n] | t[n + 1] << 8);
  return e;
};
function _l(t, e, n) {
  const s = Ot(e, 36), o = Math.min(e.u32(44), He), i = e.u32(48), r = e.u32(52), [l, a] = (r & Fo) !== 0 ? [null, e.u32(56)] : [yt(() => Pt(e, 56)) ?? null, e.u32(72)];
  if ((r & Mo) !== 0) return;
  const c = Ul(e, a, o, r), [u, h] = n ? ae(jo(e.slice(i, o * 2)), c) : Pe(e.slice(i, o), t.fontCharset(), c);
  t.drawText(s, u, h, r, l);
}
function zl(t, e) {
  const n = Ot(e, 8), s = Math.min(e.u32(16), He), o = e.u32(20);
  if ((o & Mo) !== 0) return;
  const [i, r] = (o & Fo) !== 0 ? [null, 36] : [yt(() => Pt(e, 36)) ?? null, 52], [l] = (o & vl) !== 0 ? Pe(e.slice(r, s), t.fontCharset(), []) : ae(jo(e.slice(r, s * 2)), []);
  t.drawText(n, l, [], o, i);
}
function Hl(t, e, n) {
  const s = [J(e, 24), J(e, 28), J(e, 32), J(e, 36)], o = e.u32(40);
  if (Ae.sourceless(o)) {
    t.fillRop(s, o);
    return;
  }
  const [i, r] = n ? [J(e, 100), J(e, 104)] : [s[2], s[3]];
  Xe(t, e, s, [J(e, 44), J(e, 48), i, r], [84, 92], { kind: "rop", rop: o });
}
function Xl(t, e) {
  const n = [J(e, 24), J(e, 28), J(e, 32), J(e, 36)], s = e.u8(42), o = (e.u8(43) & 1) !== 0;
  Xe(t, e, n, [J(e, 44), J(e, 48), J(e, 100), J(e, 104)], [84, 92], { kind: "alpha", constant: s, perPixel: o });
}
function Wl(t, e) {
  const n = [J(e, 24), J(e, 28), J(e, 72), J(e, 76)], s = [J(e, 32), J(e, 36), J(e, 40), J(e, 44)];
  Xe(t, e, n, s, [48, 56], { kind: "rop", rop: e.u32(68) });
}
function Vl(t, e) {
  const n = J(e, 40), s = J(e, 44);
  n <= 0 || s <= 0 || Xe(t, e, [J(e, 24), J(e, 28), n, s], [J(e, 32), J(e, 36) - e.u32(68), n, s], [48, 56], { kind: "rop", rop: Cl });
}
function Xe(t, e, n, s, o, i) {
  const r = e.u32(o[0]), l = e.u32(o[0] + 4), a = e.u32(o[1]), c = e.u32(o[1] + 4);
  if (c === 0) return;
  const u = Ce(e.sub(r, l), e.sub(a, c), i.kind === "alpha" && i.perPixel);
  if (!u) return;
  bo(u, i);
  const h = Bn(u, s.map(Math.trunc), n);
  h && t.bitmap(h.dst, h.img);
}
const Uo = 2596720087, Yl = 1440, Gl = 72 / 96;
function ql(t) {
  if (t.optU32(0) === Uo) return !0;
  const e = t.optU16(0), n = t.optU16(2), s = t.optU16(4);
  return (e === 1 || e === 2) && n === 9 && (s === 256 || s === 768);
}
function Zl(t) {
  const e = t.optU32(0) === Uo;
  let n = 0, s = null;
  if (e) {
    const u = [6, 8, 10, 12].map((k) => t.optI16(k));
    if (u.some((k) => k === void 0)) throw new Zt("BadHeader");
    const [h, d, m, f] = u, p = t.optU16(14), g = p && p > 0 ? p : Yl, b = m - h, y = f - d;
    s = b > 0 && y > 0 ? { c: [h, d, m, f], size: [b * 72 / g, y * 72 / g] } : null, n = 22;
  }
  const o = t.optU16(n + 2);
  if (o === void 0 || o < 9) throw new Zt("BadHeader");
  let i = n + o * 2;
  const r = new Ae();
  if (s) {
    const { c: u, size: h } = s;
    r.playInto([u[0], u[1], u[2] - u[0], u[3] - u[1]], h), r.setClipSurface([0, 0, h[0], h[1]]), r.patternPx = Gl;
  }
  let l = s !== null, a = 0;
  for (; !r.full(); ) {
    const u = t.optU32(i), h = t.optU16(i + 4);
    if (u === void 0 || h === void 0) break;
    const d = u * 2;
    if (d < 6 || i + d > t.length) break;
    const m = t.sub(i, d);
    if (h === 0) break;
    if (yt(() => Kl(r, h, m)), h === 524 && r.windowSet && !l && !r.viewportSet) {
      const f = r.map.we;
      r.playInto(null, [Math.abs(f[0]), Math.abs(f[1])]), l = !0;
    }
    a++, i += d;
  }
  if (a === 0) throw new Zt("NoRecords");
  let c;
  if (s && !r.viewportSet && r.map.usesExtents())
    c = { rect: [0, 0, s.size[0], s.size[1]], size: s.size };
  else if (s) {
    const u = s.c, h = r.map.device([u[0], u[1]]), d = r.map.device([u[2], u[3]]), m = [Math.min(h[0], d[0]), Math.min(h[1], d[1]), Math.abs(d[0] - h[0]), Math.abs(d[1] - h[1])];
    c = m[2] > 0 && m[3] > 0 ? { rect: m, size: s.size } : null;
  } else if (l && !r.viewportSet && r.map.usesExtents()) {
    const u = r.map.ve;
    c = { rect: [0, 0, u[0], u[1]], size: null };
  } else r.windowSet ? c = { rect: r.map.windowRect(), size: null } : c = null;
  return { cv: r, frame: c };
}
function Kl(t, e, n) {
  if (!t.full())
    switch (e) {
      case 259:
        t.setMapMode(n.u16(6));
        break;
      case 262:
        t.setPolyfill(n.u16(6));
        break;
      case 260:
        t.setRop2(n.u16(6));
        break;
      // Y is stored before X in these records.
      case 523:
        t.setWindowOrg(Ut(n, 6));
        break;
      case 524:
        t.setWindowExt(Ut(n, 6));
        break;
      case 525:
        t.setViewportOrg(Ut(n, 6));
        break;
      case 526:
        t.setViewportExt(Ut(n, 6));
        break;
      case 30:
        t.saveDc();
        break;
      case 295:
        t.restoreDc(n.i16(6));
        break;
      case 532:
        t.moveTo(Ut(n, 6));
        break;
      case 531:
        t.lineTo(Ut(n, 6));
        break;
      case 805:
        t.poly(zs(n), !1, !1, !0);
        break;
      case 804:
        t.poly(zs(n), !0, !0, !0);
        break;
      case 1336: {
        const s = ia(n);
        s && t.shape(s, !0, !0);
        break;
      }
      case 1051: {
        const [s, o, i, r] = ne(n, 6);
        t.shape(Ct(s, o, i, r), !0, !0);
        break;
      }
      case 1564: {
        const s = n.i16(8), o = n.i16(6), [i, r, l, a] = ne(n, 10);
        t.shape(ao(i, r, l, a, s, o), !0, !0);
        break;
      }
      case 1045:
        t.excludeClipRect(ne(n, 6));
        break;
      case 1046:
        t.intersectClipRect(ne(n, 6));
        break;
      case 1048: {
        const [s, o, i, r] = ne(n, 6);
        t.shape(co(s, o, i, r), !0, !0);
        break;
      }
      case 2071:
      case 2074:
      case 2096: {
        const [s, o, i] = oa(n), r = e === 2071 ? "arc" : e === 2074 ? "pie" : "chord", [l, a, c, u] = s;
        t.shape(uo(l, a, c, u, o, i, r, t.arcClockwise), r !== "arc", !0);
        break;
      }
      case 762:
        Jl(t, n);
        break;
      case 764:
        Ql(t, n);
        break;
      case 763:
        t.addObject(null, { kind: "font", font: yt(() => ea(n)) ?? { font: { family: "", height: 0, width: 0, weight: 0, italic: !1, underline: !1, strike: !1, charset: 0 }, escapement: 0 } });
        break;
      case 322: {
        const s = yt(() => ta(n)) ?? null;
        t.addObject(null, s ? { kind: "brush", brush: s } : { kind: "other" });
        break;
      }
      // A palette takes a handle slot; SELECTPALETTE makes PALETTEINDEX colours resolve against it.
      // (Beyond DeckCraft, which reads every palette colour as black.)
      case 247: {
        const s = yt(() => {
          const o = Math.min(n.u16(8), 1024), i = [];
          for (let r = 0; r < o; r++) i.push([n.u8(10 + r * 4), n.u8(11 + r * 4), n.u8(12 + r * 4), 255]);
          return i;
        });
        t.addObject(null, s ? { kind: "palette", colors: s } : { kind: "other" });
        break;
      }
      case 564:
        t.selectPalette(_s(n.u16(6)));
        break;
      // Old-style pattern brushes and regions take a handle slot too, so later SELECTOBJECT handles
      // count them; selecting one draws nothing.
      case 505:
      case 1791:
        t.addObject(null, { kind: "other" });
        break;
      case 521:
        t.setTextColor(n.u32(6));
        break;
      case 513:
        t.setBkColor(n.u32(6));
        break;
      case 258:
        t.setBkMode(n.u16(6));
        break;
      case 302:
        t.setTextAlign(n.u16(6));
        break;
      case 2610:
        na(t, n);
        break;
      case 1313:
        sa(t, n);
        break;
      // PATBLT: rop(4), height, width, y, x.
      case 1565:
        t.fillRop([G(n, 16), G(n, 14), G(n, 12), G(n, 10)], n.u32(6));
        break;
      case 301:
        t.select(_s(n.u16(6)));
        break;
      case 496:
        t.deleteObject(n.u16(6));
        break;
      // STRETCHDIB: rop(4) usage(2) srcH srcW ySrc xSrc destH destW yDest xDest, then the DIB.
      case 3907: {
        const s = n.optU32(6) ?? 0;
        Wn(t, n, 28, s, [G(n, 26), G(n, 24), G(n, 22), G(n, 20)], [G(n, 18), G(n, 16), G(n, 14), G(n, 12)]);
        break;
      }
      case 2881:
        la(t, n);
        break;
      case 2368:
        ra(t, n);
        break;
    }
}
const _s = (t) => (t & 32768) !== 0 ? (t & 32767 | 2147483648) >>> 0 : t, G = (t, e) => t.optI16(e) ?? 0;
function Jl(t, e) {
  const n = e.u16(6), s = e.i16(8), o = e.u32(12);
  t.addObject(null, { kind: "pen", pen: { style: n, width: s, color: t.colorOf(o) } });
}
function Ql(t, e) {
  const n = e.u16(6), s = e.u32(8), o = $t(n, t.colorOf(s));
  n === _n && (o.hatch = e.optU16(12) ?? 0), t.addObject(null, { kind: "brush", brush: o });
}
function ta(t) {
  const e = t.u16(8), n = t.tail(10), s = Fn(n);
  if (s === null) return null;
  const o = Ce(n.sub(0, s), n.tail(s), !1);
  return o ? Po(o, e === 1) : null;
}
function ea(t) {
  const e = t.i16(6), n = t.optI16(8) ?? 0, s = t.optI16(10) ?? 0, o = t.optI16(14) ?? 0, i = (u) => t.optU8(u) ?? 0, r = t.b.subarray(Math.min(24, t.length), Math.min(56, t.length)), l = r.indexOf(0), a = l >= 0 ? r.subarray(0, l) : r, [c] = Pe(a, 0, []);
  return {
    font: {
      family: c.trim(),
      height: e,
      width: n,
      weight: Math.min(1e3, Math.max(0, o)),
      italic: i(16) !== 0,
      underline: i(17) !== 0,
      strike: i(18) !== 0,
      charset: i(19)
    },
    escapement: s
  };
}
function na(t, e) {
  const n = e.i16(6), s = e.i16(8);
  let o = Math.min(e.u16(10), He);
  const i = e.u16(12), r = (i & (wo | jn)) !== 0, l = r ? [G(e, 14), G(e, 16), G(e, 18), G(e, 20)] : null, a = r ? 22 : 14;
  o = Math.min(o, Math.max(0, e.length - a));
  const c = e.slice(a, o), u = a + o + o % 2, h = [];
  if (e.length >= u + 2 * o) for (let f = 0; f < o; f++) h.push(e.i16(u + 2 * f));
  const [d, m] = Pe(c, t.fontCharset(), h);
  t.drawText([s, n], d, m, i, l);
}
function sa(t, e) {
  const n = Math.min(e.u16(6), He), s = e.slice(8, n), o = 8 + n + n % 2, i = e.i16(o), r = e.i16(o + 2), [l] = Pe(s, t.fontCharset(), []);
  t.drawText([r, i], l, [], 0, null);
}
const Ut = (t, e) => [t.i16(e + 2), t.i16(e)];
function ne(t, e) {
  const n = t.i16(e), s = t.i16(e + 2), o = t.i16(e + 4);
  return [t.i16(e + 6), o, s, n];
}
const oa = (t) => {
  const e = Ut(t, 6), n = Ut(t, 10);
  return [ne(t, 14), n, e];
}, zs = (t) => t.tail(8).points(0, t.u16(6), !1);
function ia(t) {
  const e = t.u16(6), n = [];
  for (let i = 0; i < e; i++) n.push(t.u16(8 + i * 2));
  const s = n.reduce((i, r) => i + r, 0);
  if (s > le) return null;
  const o = t.tail(8 + e * 2).points(0, s, !1);
  return dn(o, n, !0);
}
const _o = (t, e) => Math.floor(e.length / 2) > (t >> 8) + 3;
function ra(t, e) {
  const n = e.u32(6);
  if (!_o(2368, e)) {
    t.fillRop([G(e, 22), G(e, 20), G(e, 18), G(e, 16)], n);
    return;
  }
  const s = [G(e, 20), G(e, 18), G(e, 16), G(e, 14)];
  if (Ae.sourceless(n)) {
    t.fillRop(s, n);
    return;
  }
  Wn(t, e, 22, n, s, [G(e, 12), G(e, 10), s[2], s[3]]);
}
function la(t, e) {
  const n = e.u32(6);
  if (!_o(2881, e)) {
    t.fillRop([G(e, 26), G(e, 24), G(e, 22), G(e, 20)], n);
    return;
  }
  const s = [G(e, 24), G(e, 22), G(e, 20), G(e, 18)];
  if (Ae.sourceless(n)) {
    t.fillRop(s, n);
    return;
  }
  Wn(t, e, 26, n, s, [G(e, 16), G(e, 14), G(e, 12), G(e, 10)]);
}
function Wn(t, e, n, s, o, i) {
  const r = e.tail(n), l = Fn(r);
  if (l === null) return;
  const a = Ce(r.sub(0, l), r.tail(l), !1);
  if (!a) return;
  bo(a, { kind: "rop", rop: s });
  const c = Bn(a, i, o);
  c && t.bitmap(c.dst, c.img);
}
const aa = (() => {
  const t = new Uint32Array(256);
  for (let e = 0; e < 256; e++) {
    let n = e;
    for (let s = 0; s < 8; s++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    t[e] = n >>> 0;
  }
  return t;
})();
function ca(t, e, n) {
  let s = 4294967295;
  for (let o = e; o < n; o++) s = aa[(s ^ t[o]) & 255] ^ s >>> 8;
  return (s ^ 4294967295) >>> 0;
}
function ln(t, e) {
  const n = new Uint8Array(12 + e.length), s = new DataView(n.buffer);
  s.setUint32(0, e.length);
  for (let o = 0; o < 4; o++) n[4 + o] = t.charCodeAt(o);
  return n.set(e, 8), s.setUint32(8 + e.length, ca(n, 4, 8 + e.length)), n;
}
function Vn(t, e, n) {
  const s = new Uint8Array(13), o = new DataView(s.buffer);
  o.setUint32(0, t), o.setUint32(4, e), s[8] = 8, s[9] = 6;
  const i = new Uint8Array(e * (t * 4 + 1));
  for (let c = 0; c < e; c++) {
    const u = c * (t * 4 + 1);
    i[u] = 0, i.set(n.subarray(c * t * 4, (c + 1) * t * 4), u + 1);
  }
  const r = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), ln("IHDR", s), ln("IDAT", Yo(i, { level: 6 })), ln("IEND", new Uint8Array(0))], l = new Uint8Array(r.reduce((c, u) => c + u.length, 0));
  let a = 0;
  for (const c of r)
    l.set(c, a), a += c.length;
  return l;
}
function Se(t) {
  let e = "";
  for (let s = 0; s < t.length; s += 32768) e += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(e);
}
const Hs = 1854 / 2048, Xs = 434 / 2048, ua = 904 / 2048, ha = 12, U = (t) => {
  const e = Math.round(t * 1e3) / 1e3;
  return Object.is(e, -0) ? "0" : String(e);
}, an = (t) => t.replace(new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]", "g"), "").replace(/[&<>"]/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e]), ye = (t) => `rgb(${t[0]},${t[1]},${t[2]})`, ke = (t, e) => t[3] < 255 ? ` ${e}="${U(t[3] / 255)}"` : "";
function Ws(t) {
  let e = "";
  for (const n of t)
    n.k === "M" ? e += `M${U(n.x)} ${U(n.y)}` : n.k === "L" ? e += `L${U(n.x)} ${U(n.y)}` : n.k === "C" ? e += `C${U(n.x1)} ${U(n.y1)} ${U(n.x2)} ${U(n.y2)} ${U(n.x)} ${U(n.y)}` : e += "Z";
  return e;
}
function fa(t, e = {}) {
  const n = e.width ?? t.width * 96 / 72, s = e.height ?? t.height * 96 / 72, o = [], i = [], r = { clip: /* @__PURE__ */ new Map(), tile: /* @__PURE__ */ new Map(), tileByContent: /* @__PURE__ */ new Map(), next: 0 }, l = (h) => `${h}${r.next++}`, a = (h) => {
    if (!h) return null;
    const d = JSON.stringify(h);
    let m = r.clip.get(d);
    return m || (m = l("r"), r.clip.set(d, m), o.push(`<clipPath id="${m}">${h.map(([f, p, g, b]) => `<rect x="${U(f)}" y="${U(p)}" width="${U(g - f)}" height="${U(b - p)}"/>`).join("")}</clipPath>`)), m;
  }, c = (h, d) => {
    if (d && d.length === 0) return "";
    const m = a(d);
    return m ? `<g clip-path="url(#${m})">${h}</g>` : h;
  }, u = (h) => {
    let d = r.tile.get(h);
    if (!d) {
      const m = h.width * h.cell[0], f = h.height * h.cell[1], p = `data:image/png;base64,${Se(Vn(h.width, h.height, h.rgba))}`, g = `${U(h.origin[0])},${U(h.origin[1])},${U(m)},${U(f)},${p}`;
      if (d = r.tileByContent.get(g), d)
        return r.tile.set(h, d), d;
      d = l("p"), r.tile.set(h, d), r.tileByContent.set(g, d), o.push(`<pattern id="${d}" patternUnits="userSpaceOnUse" x="${U(h.origin[0])}" y="${U(h.origin[1])}" width="${U(m)}" height="${U(f)}"><image href="${p}" width="${U(m)}" height="${U(f)}" preserveAspectRatio="none" style="image-rendering:pixelated"/></pattern>`);
    }
    return d;
  };
  for (const h of t.items) i.push(da(h, c, u, l, o));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${U(n)}" height="${U(s)}" viewBox="0 0 ${U(t.width)} ${U(t.height)}" preserveAspectRatio="none">` + (o.length ? `<defs>${o.join("")}</defs>` : "") + i.join("") + "</svg>";
}
function da(t, e, n, s, o) {
  switch (t.kind) {
    case "path": {
      const i = t.fill ? `fill="${ye(t.fill)}"${ke(t.fill, "fill-opacity")}` : 'fill="none"';
      let r = "";
      if (t.stroke) {
        const [a, c] = t.stroke;
        r = c > 0 ? ` stroke="${ye(a)}"${ke(a, "stroke-opacity")} stroke-width="${U(c)}" stroke-linejoin="round" stroke-linecap="round"` : ` stroke="${ye(a)}"${ke(a, "stroke-opacity")} stroke-width="1" vector-effect="non-scaling-stroke"`;
      }
      const l = t.evenOdd && t.fill ? ' fill-rule="evenodd"' : "";
      return e(`<path d="${Ws(t.segs)}" ${i}${l}${r}/>`, t.region);
    }
    case "pattern":
      return e(`<path d="${Ws(t.segs)}" fill="url(#${n(t.tile)})"${t.evenOdd ? ' fill-rule="evenodd"' : ""}/>`, t.region);
    case "bitmap":
      return e(pa(t.rect, t.img), t.region);
    case "text":
      return e(ba(t.text, s, o), t.text.region);
  }
}
function pa([t, e, n, s], o) {
  if (n <= 0 || s <= 0) return "";
  if (!Ft(o)) {
    if (o.w < 1 || o.h < 1 || o.px.length !== o.w * o.h * 4) return "";
    const m = `data:image/png;base64,${Se(Vn(o.w, o.h, o.px))}`, f = n / o.w > 3 || s / o.h > 3 ? ' style="image-rendering:pixelated"' : "";
    return `<image href="${m}" x="${U(t)}" y="${U(e)}" width="${U(n)}" height="${U(s)}" preserveAspectRatio="none"${f}/>`;
  }
  const i = `data:${o.mime};base64,${Se(o.bytes)}`, [r, l, a, c] = o.crop ?? [0, 0, o.w, o.h], u = !!o.flip?.[0], h = !!o.flip?.[1], d = u || h ? ` transform="translate(${U(u ? 2 * r + a : 0)} ${U(h ? 2 * l + c : 0)}) scale(${u ? -1 : 1} ${h ? -1 : 1})"` : "";
  return `<svg x="${U(t)}" y="${U(e)}" width="${U(n)}" height="${U(s)}" viewBox="${U(r)} ${U(l)} ${U(a)} ${U(c)}" preserveAspectRatio="none" overflow="hidden"><g${d}><image href="${i}" width="${o.w}" height="${o.h}" preserveAspectRatio="none"/></g></svg>`;
}
function ma(t) {
  return /courier|consolas|mono|lucida console|fixedsys|terminal/i.test(t) ? "monospace" : /times|roman|georgia|garamond|cambria|book antiqua|palatino|serif/i.test(t) && !/sans/i.test(t) ? "serif" : "sans-serif";
}
function ga(t) {
  return " ilj.,:;'!|Iftr".includes(t) ? 0.28 : "mwMW".includes(t) ? 0.83 : /[A-Z0-9]/.test(t) ? 0.64 : (t.codePointAt(0) ?? 0) >= 11904 ? 1 : 0.53;
}
function ba(t, e, n) {
  const s = t.font, o = s.family.trim() || "Arial", i = s.height < 0 ? -s.height : s.height > 0 ? s.height / (Hs + Xs) : ha;
  if (!(i > 0) || !Number.isFinite(i)) return "";
  const r = [...t.text].map((L) => ka(o, L));
  if (!r.length) return "";
  const l = t.dx.length === r.length && t.dx.length > 0;
  let a, c = null, u = 1;
  if (l) {
    c = [];
    let L = 0;
    for (const O of t.dx)
      c.push(L), L += O;
    a = L;
  } else
    a = r.reduce((L, O) => L + ga(O) * i, 0), s.width > 0 && (u = Math.min(20, Math.max(0.05, s.width / (ua * i))), a *= u);
  const h = t.hAlign === "left" ? 0 : t.hAlign === "center" ? -a / 2 : -a, d = Hs * i, m = Xs * i, f = t.vAlign === "baseline" ? 0 : t.vAlign === "top" ? d : -m, [p, g, b, y, k, w] = t.transform;
  let v = "";
  t.background && a > 0 && (v += `<rect x="${U(h)}" y="${U(f - d)}" width="${U(a)}" height="${U(d + m)}" fill="${ye(t.background)}"${ke(t.background, "fill-opacity")}/>`);
  const S = [s.underline && "underline", s.strike && "line-through"].filter(Boolean).join(" "), $ = [
    `font-family="${an(`'${o.replace(/'/g, "")}', ${ma(o)}`)}"`,
    `font-size="${U(i)}"`,
    s.weight >= 600 ? 'font-weight="bold"' : "",
    s.italic ? 'font-style="italic"' : "",
    S ? `text-decoration="${S}"` : "",
    `fill="${ye(t.color)}"${ke(t.color, "fill-opacity")}`,
    'xml:space="preserve"'
  ].filter(Boolean).join(" ");
  if (c) {
    const L = c.map((O) => U(h + O)).join(" ");
    v += `<text x="${L}" y="${U(f)}" ${$}>${an(r.join(""))}</text>`;
  } else {
    const L = t.hAlign === "center" ? "middle" : t.hAlign === "right" ? "end" : "start", O = `<text x="0" y="${U(f)}" text-anchor="${L}" ${$}>${an(r.join(""))}</text>`;
    v += u !== 1 ? `<g transform="scale(${U(u)} 1)">${O}</g>` : O;
  }
  let I = `<g transform="matrix(${[p, g, b, y, k, w].map(U).join(" ")})">${v}</g>`;
  if (t.clip) {
    const L = e("c"), [O, F, T, D] = t.clip;
    n.push(`<clipPath id="${L}"><rect x="${U(O)}" y="${U(F)}" width="${U(T - O)}" height="${U(D - F)}"/></clipPath>`), I = `<g clip-path="url(#${L})">${I}</g>`;
  }
  return I;
}
const xa = (() => {
  const t = {
    34: 8704,
    36: 8707,
    39: 8715,
    42: 8727,
    45: 8722,
    64: 8773,
    92: 8756,
    94: 8869,
    126: 8764,
    161: 978,
    162: 8242,
    163: 8804,
    164: 8260,
    165: 8734,
    166: 402,
    167: 9827,
    168: 9830,
    169: 9829,
    170: 9824,
    171: 8596,
    172: 8592,
    173: 8593,
    174: 8594,
    175: 8595,
    176: 176,
    177: 177,
    178: 8243,
    179: 8805,
    180: 215,
    181: 8733,
    182: 8706,
    183: 8226,
    184: 247,
    185: 8800,
    186: 8801,
    187: 8776,
    188: 8230,
    192: 8501,
    193: 8465,
    194: 8476,
    195: 8472,
    196: 8855,
    197: 8853,
    198: 8709,
    199: 8745,
    200: 8746,
    201: 8835,
    202: 8839,
    203: 8836,
    204: 8834,
    205: 8838,
    206: 8712,
    207: 8713,
    208: 8736,
    209: 8711,
    210: 174,
    211: 169,
    212: 8482,
    213: 8719,
    214: 8730,
    215: 8901,
    216: 172,
    217: 8743,
    218: 8744,
    219: 8660,
    220: 8656,
    221: 8657,
    222: 8658,
    223: 8659,
    224: 9674,
    225: 9001,
    229: 8721,
    241: 9002,
    242: 8747
  }, e = [913, 914, 935, 916, 917, 934, 915, 919, 921, 977, 922, 923, 924, 925, 927, 928, 920, 929, 931, 932, 933, 962, 937, 926, 936, 918], n = [945, 946, 967, 948, 949, 966, 947, 951, 953, 981, 954, 955, 956, 957, 959, 960, 952, 961, 963, 964, 965, 982, 969, 958, 968, 950];
  return e.forEach((s, o) => {
    t[65 + o] = s;
  }), n.forEach((s, o) => {
    t[97 + o] = s;
  }), t;
})(), ya = {
  108: 9679,
  110: 9632,
  111: 9633,
  113: 10065,
  117: 9670,
  118: 10070,
  119: 11045,
  159: 8226,
  167: 9642,
  168: 9723,
  216: 10146,
  224: 8592,
  232: 8594,
  233: 8593,
  234: 8595,
  240: 8680,
  251: 10007,
  252: 10004,
  253: 9746,
  254: 9745,
  74: 9786,
  76: 9785,
  78: 9760,
  82: 9788,
  84: 10052,
  88: 10016,
  91: 9775,
  171: 9733,
  161: 9675,
  164: 9673
};
function ka(t, e) {
  const n = t.toLowerCase();
  let s = e.codePointAt(0) ?? 0;
  const o = s >= 61440 && s <= 61695;
  if (o && (s -= 61440), n === "symbol") {
    const i = xa[s];
    return i ? String.fromCodePoint(i) : o ? String.fromCodePoint(s) : e;
  }
  return n.startsWith("wingdings") || n.startsWith("webdings") ? s <= 32 ? " " : String.fromCodePoint(n === "wingdings" && ya[s] || 8226) : o ? String.fromCodePoint(s) : e;
}
function zo(t, e = 0) {
  const n = new Kt(t);
  let s;
  if (Bo(n)) s = Do(n, e);
  else if (ql(n)) s = Zl(n);
  else throw new Zt("NotMetafile");
  return Ma(s.cv.items, s.frame);
}
bl(zo);
function wa(t) {
  let e;
  try {
    e = zo(t);
  } catch {
    return null;
  }
  if (!e.items.length || !(e.width > 0) || !(e.height > 0)) return null;
  const n = Math.max(1, Math.round(e.width * 96 / 72)), s = Math.max(1, Math.round(e.height * 96 / 72)), o = fa(e, { width: n, height: s });
  return { url: `data:image/svg+xml;base64,${Se(new TextEncoder().encode(o))}`, w: n, h: s, svg: o };
}
const Mt = (t) => Number.isFinite(t);
function Ma(t, e) {
  const n = e && e.rect.every(Mt) && e.rect[2] > 0 && e.rect[3] > 0 ? e : null;
  let s, o;
  if (n)
    s = n.rect, o = n.size ?? [n.rect[2], n.rect[3]];
  else {
    const d = va(t);
    if (!d) return { width: 0, height: 0, items: [] };
    const [m, f, p, g] = d;
    s = [m, f, p - m, g - f], o = [p - m, g - f];
  }
  const i = s[2] > 0 ? o[0] / s[2] : 1, r = s[3] > 0 ? o[1] / s[3] : 1, l = (d) => [(d[0] - s[0]) * i, (d[1] - s[1]) * r], a = (i + r) / 2, c = Math.hypot(o[0], o[1]), u = /* @__PURE__ */ new Map(), h = [];
  for (const d of t)
    if (d.kind === "path") {
      const m = Vs(d.ops, l);
      if (!m || m.length < 2) continue;
      let f = null;
      if (d.stroke) {
        const g = Math.min(d.stroke[1] * a, c);
        if (!Mt(g)) continue;
        f = [d.stroke[0], g];
      }
      const p = Ee(d.region, l);
      if (p === void 0) continue;
      h.push({ kind: "path", segs: m, fill: d.fill, stroke: f, evenOdd: d.evenOdd, region: p });
    } else if (d.kind === "bitmap") {
      const [m, f] = l([d.rect[0], d.rect[1]]), p = [m, f, d.rect[2] * i, d.rect[3] * r], g = Ee(d.region, l);
      if (!p.every(Mt) || g === void 0) continue;
      h.push({ kind: "bitmap", rect: p, img: d.img, region: g });
    } else if (d.kind === "pattern") {
      const m = Vs(d.ops, l);
      if (!m || m.length < 2) continue;
      let f = u.get(d.tile);
      if (!f) {
        const [g, b] = l([0, 0]);
        if (f = { width: d.tile.w, height: d.tile.h, rgba: d.tile.px, cell: [d.tile.cell * i, d.tile.cell * r], origin: [g, b] }, ![...f.cell, ...f.origin].every(Mt)) continue;
        u.set(d.tile, f);
      }
      const p = Ee(d.region, l);
      if (p === void 0) continue;
      h.push({ kind: "pattern", segs: m, evenOdd: d.evenOdd, tile: f, region: p });
    } else {
      const m = { ...d.text }, [f, p, g, b, y, k] = m.transform, [w, v] = l([y, k]);
      if (m.transform = [f * i, p * r, g * i, b * r, w, v], !m.transform.every(Mt)) continue;
      if (m.clip) {
        const [$, I, L, O] = m.clip, F = l([$, I]), T = l([L, O]);
        if (m.clip = [Math.min(F[0], T[0]), Math.min(F[1], T[1]), Math.max(F[0], T[0]), Math.max(F[1], T[1])], !m.clip.every(Mt)) continue;
      }
      const S = Ee(d.region, l);
      if (S === void 0) continue;
      m.region = S, h.push({ kind: "text", text: m });
    }
  return { width: Mt(o[0]) ? o[0] : 0, height: Mt(o[1]) ? o[1] : 0, items: h };
}
function Ee(t, e) {
  if (!t) return null;
  const n = [];
  for (const [s, o, i, r] of t) {
    const l = e([s, o]), a = e([i, r]), c = [Math.min(l[0], a[0]), Math.min(l[1], a[1]), Math.max(l[0], a[0]), Math.max(l[1], a[1])];
    if (!c.every(Mt)) return;
    n.push(c);
  }
  return n;
}
function Vs(t, e) {
  const n = [];
  for (const s of t) {
    if (s.k === "Z") {
      n.push({ k: "Z" });
      continue;
    }
    if (s.k === "C") {
      const i = e(s.a), r = e(s.b), l = e(s.p);
      if (![...i, ...r, ...l].every(Mt)) return null;
      n.push({ k: "C", x1: i[0], y1: i[1], x2: r[0], y2: r[1], x: l[0], y: l[1] });
      continue;
    }
    const o = e(s.p);
    if (!o.every(Mt)) return null;
    n.push({ k: s.k, x: o[0], y: o[1] });
  }
  return n;
}
function va(t) {
  let e = null;
  const n = (s) => {
    !Mt(s[0]) || !Mt(s[1]) || (e = e ? [Math.min(e[0], s[0]), Math.min(e[1], s[1]), Math.max(e[2], s[0]), Math.max(e[3], s[1])] : [s[0], s[1], s[0], s[1]]);
  };
  for (const s of t)
    if (s.kind === "path" || s.kind === "pattern")
      for (const o of s.ops)
        o.k === "M" || o.k === "L" ? n(o.p) : o.k === "C" && (n(o.a), n(o.b), n(o.p));
    else s.kind === "bitmap" ? (n([s.rect[0], s.rect[1]]), n([s.rect[0] + s.rect[2], s.rect[1] + s.rect[3]])) : n([s.text.transform[4], s.text.transform[5]]);
  return e;
}
const Ys = 4e7, ut = {
  width: 256,
  height: 257,
  bits: 258,
  compression: 259,
  photometric: 262,
  stripOffsets: 273,
  samples: 277,
  rowsPerStrip: 278,
  stripBytes: 279,
  planar: 284,
  predictor: 317,
  colorMap: 320,
  tileW: 322,
  tileH: 323,
  tileOffsets: 324,
  tileBytes: 325,
  extra: 338,
  sampleFormat: 339
};
function Sa(t) {
  return t.length >= 8 && (t[0] === 73 && t[1] === 73 && t[2] === 42 && t[3] === 0 || t[0] === 77 && t[1] === 77 && t[2] === 0 && t[3] === 42);
}
function Ca(t) {
  try {
    return Aa(t);
  } catch {
    return null;
  }
}
function Pa(t) {
  const e = Ca(t);
  return e ? { url: `data:image/png;base64,${Se(Vn(e.w, e.h, e.rgba))}`, w: e.w, h: e.h } : null;
}
function Aa(t) {
  if (!Sa(t)) return null;
  const e = t[0] === 73, n = new DataView(t.buffer, t.byteOffset, t.byteLength), s = (j, z) => {
    if (j < 0 || j + z > t.length) throw new RangeError("short");
  }, o = (j) => (s(j, 2), n.getUint16(j, e)), i = (j) => (s(j, 4), n.getUint32(j, e)), r = i(4), l = o(r), a = /* @__PURE__ */ new Map(), c = { 1: 1, 2: 1, 3: 2, 4: 4, 6: 1, 7: 1, 8: 2, 9: 4, 16: 8 };
  for (let j = 0; j < l; j++) {
    const z = r + 2 + j * 12, Q = o(z), V = o(z + 2), W = i(z + 4), X = c[V];
    if (!X || W > 1 << 24) continue;
    const it = X * W, ft = it <= 4 ? z + 8 : i(z + 8);
    s(ft, it);
    const tt = new Array(W);
    for (let A = 0; A < W; A++) {
      const H = ft + A * X;
      tt[A] = X === 1 ? t[H] : X === 2 ? n.getUint16(H, e) : X === 4 ? n.getUint32(H, e) : Number(n.getBigUint64(H, e));
    }
    a.set(Q, tt);
  }
  const u = (j, z) => a.get(j)?.[0] ?? z, h = u(ut.width) ?? 0, d = u(ut.height) ?? 0;
  if (!h || !d || h * d > Ys) return null;
  const m = u(ut.samples, 1), f = a.get(ut.bits) ?? [1], p = f[0];
  if (f.some((j) => j !== p)) return null;
  const g = u(ut.compression, 1), b = u(ut.photometric), y = u(ut.predictor, 1);
  if ((u(ut.planar, 1) ?? 1) !== 1 && m > 1 || (a.get(ut.sampleFormat) ?? [1]).some((j) => j !== 1) || ![1, 5, 8, 32946, 32773].includes(g) || y !== 1 && y !== 2 || b === void 0) return null;
  const k = a.get(ut.extra) ?? [];
  let w, v;
  if (b === 0 || b === 1)
    w = "grey", v = 1;
  else if (b === 2)
    w = "rgb", v = 3;
  else if (b === 3)
    w = "palette", v = 1;
  else if (b === 5 && m >= 4)
    w = "cmyk", v = 4;
  else return null;
  if (m < v || (w === "palette" ? !(p >= 1 && p <= 8) : w === "grey" ? ![1, 2, 4, 8, 16].includes(p) : p !== 8 && p !== 16) || w === "cmyk" && p !== 8) return null;
  const S = m > v ? k[0] ?? 0 : 0, $ = S === 1 || S === 2;
  let I = null;
  if (w === "palette" && (I = a.get(ut.colorMap) ?? null, !I || I.length < 3 * (1 << p)))
    return null;
  const L = a.has(ut.tileOffsets), O = L ? u(ut.tileW, 0) : h, F = L ? u(ut.tileH, 0) : Math.min(d, u(ut.rowsPerStrip, d) || d);
  if (!O || !F || O * F > Ys) return null;
  const T = a.get(L ? ut.tileOffsets : ut.stripOffsets), D = a.get(L ? ut.tileBytes : ut.stripBytes);
  if (!T) return null;
  const R = Math.ceil(h / O), B = Math.ceil(d / F);
  if (T.length < R * B) return null;
  const C = Math.ceil(O * m * p / 8), P = new Uint8Array(h * d * 4), E = p === 16 ? 2 : 1;
  for (let j = 0; j < B; j++)
    for (let z = 0; z < R; z++) {
      const Q = j * R + z, V = T[Q], W = D?.[Q] ?? t.length - V;
      if (V >= t.length) continue;
      const X = t.subarray(V, Math.min(t.length, V + W)), it = L ? F : Math.min(F, d - j * F), ft = C * it, tt = Ta(X, g, ft);
      if (!tt) return null;
      y === 2 && Oa(tt, it, C, m, p, e);
      const A = z * O, H = j * F;
      for (let K = 0; K < it; K++) {
        const kt = H + K;
        if (kt >= d) break;
        const mt = K * C;
        if (mt >= tt.length) break;
        for (let Y = 0; Y < O; Y++) {
          const q = A + Y;
          if (q >= h) break;
          const gt = Y * m, dt = (et) => $a(tt, mt, gt + et, p, e), st = (kt * h + q) * 4;
          if (w === "grey") {
            const et = p === 16 ? 65535 : (1 << p) - 1;
            let ot = Math.round(dt(0) / et * 255);
            b === 0 && (ot = 255 - ot), P[st] = P[st + 1] = P[st + 2] = ot;
          } else if (w === "palette") {
            const et = dt(0), ot = 1 << p;
            P[st] = I[et] >> 8, P[st + 1] = I[ot + et] >> 8, P[st + 2] = I[2 * ot + et] >> 8;
          } else if (w === "rgb") {
            const et = E === 2 ? (ot) => dt(ot) >> 8 : dt;
            P[st] = et(0), P[st + 1] = et(1), P[st + 2] = et(2);
          } else {
            const et = dt(3);
            P[st] = (255 - dt(0)) * (255 - et) / 255 | 0, P[st + 1] = (255 - dt(1)) * (255 - et) / 255 | 0, P[st + 2] = (255 - dt(2)) * (255 - et) / 255 | 0;
          }
          if ($) {
            const et = p === 16 ? dt(v) >> 8 : p === 8 ? dt(v) : Math.round(dt(v) / ((1 << p) - 1) * 255);
            if (P[st + 3] = et, S === 1 && et > 0 && et < 255)
              for (let ot = 0; ot < 3; ot++) P[st + ot] = Math.min(255, Math.round(P[st + ot] * 255 / et));
          } else P[st + 3] = 255;
        }
      }
    }
  return { w: h, h: d, rgba: P };
}
function $a(t, e, n, s, o) {
  if (s === 8) return t[e + n] ?? 0;
  if (s === 16) {
    const l = e + n * 2, a = t[l] ?? 0, c = t[l + 1] ?? 0;
    return o ? a | c << 8 : a << 8 | c;
  }
  const i = n * s;
  return (t[e + (i >> 3)] ?? 0) >> 8 - s - (i & 7) & (1 << s) - 1;
}
function Oa(t, e, n, s, o, i) {
  if (o === 8)
    for (let r = 0; r < e; r++) {
      const l = r * n, a = Math.min(t.length, l + n);
      for (let c = l + s; c < a; c++) t[c] = t[c] + t[c - s] & 255;
    }
  else if (o === 16) {
    const r = new DataView(t.buffer, t.byteOffset, t.byteLength);
    for (let l = 0; l < e; l++) {
      const a = l * n, c = Math.min(t.length - 1, a + n - 1);
      for (let u = a + s * 2; u < c; u += 2) r.setUint16(u, r.getUint16(u, i) + r.getUint16(u - s * 2, i) & 65535, i);
    }
  }
}
function Ta(t, e, n) {
  let s;
  switch (e) {
    case 1:
      s = t;
      break;
    case 32773:
      s = Ea(t, n);
      break;
    case 5:
      s = Na(t, n);
      break;
    case 8:
    case 32946: {
      try {
        s = Go(t);
      } catch {
        try {
          s = qo(t);
        } catch {
          return null;
        }
      }
      break;
    }
    default:
      return null;
  }
  if (s.length >= n) return s.length === n ? s === t ? s.slice() : s : s.slice(0, n);
  const o = new Uint8Array(n);
  return o.set(s), o;
}
function Ea(t, e) {
  const n = new Uint8Array(e);
  let s = 0, o = 0;
  for (; s < t.length && o < e; ) {
    const i = t[s++] << 24 >> 24;
    if (i >= 0) {
      const r = Math.min(o + i + 1, e);
      for (; o < r && s < t.length; ) n[o++] = t[s++];
      if (o === e) break;
    } else if (i !== -128) {
      if (s >= t.length) break;
      const r = t[s++], l = Math.min(o + 1 - i, e);
      for (; o < l; ) n[o++] = r;
    }
  }
  return n.subarray(0, o);
}
function Na(t, e) {
  const n = new Uint8Array(e), s = new Int32Array(4096), o = new Uint8Array(4096), i = new Int32Array(4096);
  for (let f = 0; f < 256; f++)
    s[f] = -1, o[f] = f, i[f] = 1;
  let r = 258, l = 9, a = 0, c = -1, u = 0;
  const h = t.length * 8, d = () => {
    if (u + l > h) return 257;
    let f = 0;
    for (let p = 0; p < l; p++) {
      const g = u + p;
      f = f << 1 | t[g >> 3] >> 7 - (g & 7) & 1;
    }
    return u += l, f;
  }, m = (f) => {
    const p = i[f];
    let g = a + p, b = f;
    const y = (() => {
      let k = f;
      for (; s[k] >= 0; ) k = s[k];
      return o[k];
    })();
    if (g > e) {
      let k = g - e;
      for (g = e; k-- > 0; ) b = s[b];
    }
    for (let k = g - 1; k >= a && b >= 0; k--)
      n[k] = o[b], b = s[b];
    return a = g, y;
  };
  for (; a < e; ) {
    const f = d();
    if (f === 257) break;
    if (f === 256) {
      r = 258, l = 9, c = -1;
      continue;
    }
    if (c < 0) {
      if (f > 255) break;
      m(f), c = f;
      continue;
    }
    let p;
    if (f < r)
      p = m(f);
    else if (f === r) {
      let g = c;
      for (; s[g] >= 0; ) g = s[g];
      p = o[g], r < 4096 && (s[r] = c, o[r] = p, i[r] = i[c] + 1), m(r), r++, c = f, r + 1 >= 1 << l && l < 12 && l++;
      continue;
    } else break;
    r < 4096 && (s[r] = c, o[r] = p, i[r] = i[c] + 1, r++), c = f, r + 1 >= 1 << l && l < 12 && l++;
  }
  return n.subarray(0, a);
}
const Ia = 80, Ra = "default-layer", rt = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const e = t.hex.replace("#", "");
  return `rgba(${parseInt(e.slice(0, 2), 16)}, ${parseInt(e.slice(2, 4), 16)}, ${parseInt(e.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, Fa = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, Ba = /(courier|consolas|mono|menlo|code)/i;
function Mn(t) {
  if (!t) return "sans-serif";
  const e = ii(t);
  return e || (Ba.test(t) ? "monospace" : Fa.test(t) ? "serif" : "sans-serif");
}
function Da(t) {
  const e = [];
  let n = [], s = !1;
  const o = () => {
    if (n.length >= 2) {
      const i = n[0], r = n[n.length - 1];
      s && Math.hypot(i.x - r.x, i.y - r.y) < 1e-6 && (i.inX = r.inX, i.inY = r.inY, n.pop()), e.push({ anchors: n, closed: s });
    }
    n = [], s = !1;
  };
  for (const i of t)
    if (i.op === "M")
      o(), n.push({ x: i.x, y: i.y, kind: "corner" });
    else if (i.op === "L")
      n.length ? n.push({ x: i.x, y: i.y, kind: "corner" }) : n.push({ x: i.x, y: i.y, kind: "corner" });
    else if (i.op === "C") {
      const r = n[n.length - 1];
      if (!r) {
        n.push({ x: i.x, y: i.y, kind: "corner" });
        continue;
      }
      r.outX = i.x1 - r.x, r.outY = i.y1 - r.y, n.push({ x: i.x, y: i.y, inX: i.x2 - i.x, inY: i.y2 - i.y, kind: "smooth" });
    } else i.op === "Z" && (s = !0, o());
  return o(), e;
}
const La = (t, e, n) => t.map((s) => s.op === "Z" ? s : s.op === "C" ? { ...s, x1: s.x1 + e, y1: s.y1 + n, x2: s.x2 + e, y2: s.y2 + n, x: s.x + e, y: s.y + n } : { ...s, x: s.x + e, y: s.y + n });
function ja(t, e, n) {
  let s = !1;
  t.forEach((o, i) => {
    o.start === "click" && (s = !0);
    const r = e.itemEls?.get(o.target);
    if (!r?.length) {
      e.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    r.forEach((l, a) => {
      const c = Ko(a === 0 ? o : { ...o, start: "with", delayMs: o.delayMs }, n("anim"), !s);
      c.order = i + a / (r.length + 1), (l.animations ??= []).push(c);
    });
  });
}
function Ua(t, e) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return si(t.action);
  const n = e.slideIds?.get(t.key);
  return n ? oi(n) : null;
}
async function _a(t) {
  if (!(typeof document > "u"))
    try {
      const e = new Image();
      e.src = t, await e.decode();
      const n = document.createElement("canvas");
      n.width = Math.max(1, Math.min(8192, e.naturalWidth)), n.height = Math.max(1, Math.min(8192, e.naturalHeight));
      const s = n.getContext("2d");
      return s ? (s.filter = "grayscale(1)", s.drawImage(e, 0, 0, n.width, n.height), n.toDataURL(/^data:image\/jpeg/.test(t) ? "image/jpeg" : "image/png", 0.92)) : void 0;
    } catch {
      return;
    }
}
async function za(t, e) {
  const n = /* @__PURE__ */ new Set(), s = (i) => {
    for (const r of i)
      if (r.kind === "group") s(r.children);
      else if (r.kind === "picture" && r.grayscale) {
        const l = e.get(r.media)?.url;
        l && n.add(l);
      } else if (r.kind === "shape" && r.fill.kind === "image" && r.fill.grayscale) {
        const l = e.get(r.fill.media)?.url;
        l && n.add(l);
      }
  };
  t.slides.forEach((i) => s(i.items));
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (i) => {
    const r = await _a(i);
    r && o.set(i, r);
  })), o;
}
async function Ha(t, e, n, s) {
  if (!(typeof document > "u"))
    try {
      const o = new Image();
      o.src = t, await o.decode();
      const i = document.createElement("canvas");
      i.width = Math.max(1, Math.min(4096, Math.round(e))), i.height = Math.max(1, Math.min(4096, Math.round(n)));
      const r = i.getContext("2d");
      if (!r) return;
      if (s) {
        const l = r.createPattern(o, "repeat");
        if (!l) return;
        l.setTransform(new DOMMatrix().scale(s.sx, s.sy)), r.fillStyle = l, r.fillRect(0, 0, i.width, i.height);
      } else {
        if (Math.abs(o.naturalWidth / o.naturalHeight - e / n) < 0.01) return;
        r.drawImage(o, 0, 0, i.width, i.height);
      }
      return i.toDataURL(s ? "image/png" : "image/jpeg", 0.92);
    } catch {
      return;
    }
}
function Lt(t, e, n, s) {
  return {
    id: t.nextId(e),
    type: e,
    x: n.x + t.ox,
    y: n.y + t.oy,
    width: Math.max(n.w, 1),
    height: Math.max(n.h, 1),
    angle: n.rot ? n.rot * Math.PI / 180 : 0,
    flipX: n.flipH || void 0,
    flipY: n.flipV || void 0,
    strokeColor: "transparent",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 0,
    strokeStyle: "solid",
    roughness: 0,
    renderStyle: "architectural",
    opacity: 100,
    seed: 1,
    locked: !1,
    layerId: Ra,
    groupIds: [...s].reverse(),
    // innermost first, the store's convention
    name: n.name
  };
}
function Gs(t, e, n) {
  switch (e.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = rt(e.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = e.kind, t.backgroundColor = rt(e.stops[0]?.color), t.gradientStops = e.stops.map((s) => ({ offset: s.pos, color: rt(s.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
      break;
    case "pattern": {
      t.backgroundColor = rt(e.color), t.fillStyle = "pattern", t.patternFill = sc(e.preset, rt(e.color), e.bg ? rt(e.bg) : "transparent");
      break;
    }
    case "image": {
      const s = n.images.get(e.media);
      s && (t.fillStyle = "image", t.backgroundImage = e.grayscale && n.gray.get(s.url) || s.url, t.backgroundColor = "#ffffff"), s && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
      break;
    }
  }
}
function vn(t, e) {
  if (!e || !(e.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = rt(e.color), t.strokeWidth = Math.max(0.5, e.width), t.strokeStyle = e.dash === "sysDot" ? "dotted" : e.dash ? "dashed" : "solid", (e.join === "miter" || e.join === "bevel") && (t.strokeLineJoin = e.join), e.cap === "flat" ? t.strokeLineCap = "butt" : e.cap === "sq" && (t.strokeLineCap = "square");
}
function Xa(t) {
  const e = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!e) return {};
  const n = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[e[1]], s = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[e[2]], o = {};
  return n && (o.listNumberStyle = n), s && (o.listNumberSuffix = s), o;
}
function Wa(t, e) {
  const n = t.bullet === "num" ? Xa(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, s = t.runs.find((o) => !o.br)?.color ?? e.defaults?.color;
  return t.bulletColor && rt(t.bulletColor) !== rt(s) && (n.listMarkerColor = rt(t.bulletColor)), t.bulletScale && (n.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (n.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), n.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), n;
}
const cn = (t, e) => Math.round(((t.paragraphs[e - 1]?.spaceAfter ?? 0) + (t.paragraphs[e]?.spaceBefore ?? 0)) * 100) / 100;
function Ho(t, e) {
  const n = t.paragraphs.flatMap((p) => p.runs.filter((g) => !g.br)), s = n[0], o = s?.size ?? 24, i = /* @__PURE__ */ new Map(), r = (p) => p.runs.reduce((g, b) => g + (b.br ? 0 : b.text.trim().length), 0);
  for (const p of t.paragraphs) {
    const g = r(p);
    g && i.set(p.align ?? "l", (i.get(p.align ?? "l") ?? 0) + g);
  }
  const l = [...i].sort((p, g) => g[1] - p[1])[0]?.[0] ?? t.paragraphs.find((p) => p.runs.length)?.align ?? "l", a = (p) => r(p) > 0 && (p.align ?? "l") !== l ? p.align === "ctr" ? "center" : p.align === "r" ? "right" : "left" : void 0, c = n.every((p) => p.size === s?.size && p.bold === s?.bold && p.italic === s?.italic && p.underline === s?.underline && p.strike === s?.strike && p.font === s?.font && rt(p.color) === rt(s?.color)) && !t.paragraphs.some((p) => p.bullet) && !t.paragraphs.some((p, g) => g > 0 && cn(t, g) > 0) && !t.paragraphs.some(a), u = {
    fontSize: Math.round(o * 10) / 10,
    fontFamily: Mn(s?.font),
    textAlign: l === "ctr" ? "center" : l === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: rt(s?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (u.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2))), t.shrink !== void 0 && t.wrap && (u.textFit = "shrink");
  const h = t.paragraphs.map((p) => p.runs.map((g) => g.br ? `
` : g.text).join("")).join(`
`);
  if (c)
    return s?.bold && (u.fontWeight = 700), s?.italic && (u.fontStyle = "italic"), e ? u.containerText = h : u.text = h, { fields: u, rich: !1 };
  const d = [], m = [], f = [];
  return t.paragraphs.forEach((p, g) => {
    const b = p.level ?? 0;
    if (p.bullet === "num") {
      const w = p.numType ?? "arabicPeriod";
      (m[b] === void 0 || f[b] !== w) && (m[b] = (p.startAt ?? 1) - 1), m[b]++, f[b] = w, m.length = b + 1, f.length = b + 1;
    } else
      m.length = Math.min(m.length, b), f.length = m.length;
    const y = p.bullet ? { listType: p.bullet === "num" ? "ordered" : "bullet", listLevel: b, ...Wa(p, t) } : {};
    p.bullet === "num" && (y.listIndex = m[b]), (p.runs.length ? p.runs : [{ text: "" }]).forEach((w, v) => {
      const S = { text: w.br ? `
` : w.text, ...v === 0 ? y : {} };
      v === 0 && g > 0 && cn(t, g) > 0 && (S.paragraphSpaceBefore = cn(t, g));
      const $ = a(p);
      $ && (S.paragraphAlign = $), w.bold && (S.bold = !0), w.italic && (S.italic = !0), w.underline && (S.underline = !0), w.strike && (S.strikethrough = !0), w.color && (S.color = rt(w.color)), w.size && (S.fontSize = Math.round(w.size * 10) / 10), w.font && (S.fontFamily = Mn(w.font)), d.push(S);
    }), g < t.paragraphs.length - 1 && d.push({ text: `
` });
  }), e ? (u.richContainerText = d, u.containerText = h) : (u.richText = d, u.text = h), { fields: u, rich: !0 };
}
function Ne(t, e, n, s, o) {
  const { fields: i, rich: r } = Ho(e, !1), l = 4, a = Lt(t, r ? "richtext" : "text", {
    ...n,
    x: n.x + e.insets.l - l,
    y: n.y + e.insets.t - l,
    w: Math.max(n.w - e.insets.l - e.insets.r + l * 2, 8),
    h: Math.max(n.h - e.insets.t - e.insets.b + l * 2, 8)
  }, s);
  return Object.assign(a, i, { autoResize: !e.wrap, strokeColor: i.textColor }), a;
}
const Xo = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function Yn(t, e, n) {
  if (t.text?.vert) {
    const h = t.fill.kind !== "none" || !!t.line, d = h ? e.nextId("group") : null, m = d ? [...n, d] : n, f = h ? Yn({ ...t, text: void 0 }, e, m) : [], p = t.text, g = p.insets, b = p.vert === "vert" ? 90 : p.vert === "vert270" ? 270 : 0, y = t.x + t.w / 2, k = t.y + t.h / 2, w = p.vert === "vert" ? { l: g.t, r: g.b, t: g.r, b: g.l } : p.vert === "vert270" ? { l: g.b, r: g.t, t: g.l, b: g.r } : g, v = b ? { name: t.name, x: y - t.h / 2, y: k - t.w / 2, w: t.h, h: t.w, rot: (t.rot ?? 0) + b } : { name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot }, S = Ne(e, { ...p, insets: w }, v, m);
    return p.vert === "stacked" && (S.verticalText = !0), e.stats.elements++, [...f, S];
  }
  const s = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || s.kind === "preset" && s.prst === "rect"))
    return e.stats.elements++, [Ne(e, t.text, t, n)];
  if (s.kind === "preset" && Xo.has(s.prst)) return Sn({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, e, n);
  if (s.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && s.paths.every((h) => !h.cmds.some((d) => d.op === "Z")))
    return Sn({ ...t, kind: "connector", line: t.line }, e, n);
  const o = Ya(t);
  if (o) {
    const h = Lt(e, o.type, t, n);
    Object.assign(h, o.extra), Gs(h, t.fill, e), vn(h, t.line), e.byPptId.set(t.id, { el: h, item: t }), e.stats.elements++;
    const d = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, m = t.text?.insets, f = Math.abs(d.l) > 0.5 || Math.abs(d.t) > 0.5 || Math.abs(d.r - t.w) > 0.5 || Math.abs(d.b - t.h) > 0.5, p = !!m && Math.max(m.l, m.r, m.t, m.b) > 16;
    if (t.text && (f || p)) {
      const g = e.nextId("group");
      return h.groupIds = [...n, g].reverse(), e.stats.elements++, [h, Ne(e, t.text, { ...t, rot: 0, x: t.x + d.l, y: t.y + d.t, w: d.r - d.l, h: d.b - d.t }, [...n, g])];
    }
    if (t.text) {
      const { fields: g } = Ho(t.text, !0);
      Object.assign(h, g);
    }
    return [h];
  }
  const i = s.kind === "custom" ? s.paths : (() => {
    const h = e.presets[s.prst];
    if (!h)
      return e.warnings.push(`Unknown shape "${s.prst}" was imported as a rectangle.`), Fe(e.presets.rect, t.w, t.h);
    const d = Object.fromEntries(Object.entries(s.adj ?? {}).map(([m, f]) => [m, `val ${f}`]));
    return Fe(h, t.w, t.h, d);
  })(), r = [], l = (t.text || i.some((h) => h.fill === !1)) && i.some((h) => h.fill !== !1) ? e.nextId("group") : null, a = l ? [...n, l] : n, c = /* @__PURE__ */ new Map();
  for (const h of i) {
    const d = `${h.fill === !1 ? "nofill" : "fill"}|${h.stroke === !1 ? "nostroke" : "stroke"}`;
    c.has(d) || c.set(d, []), c.get(d).push(h);
  }
  let u = null;
  for (const [h, d] of c) {
    const m = d.flatMap((y) => y.cmds), f = ai(m);
    if (!f) continue;
    const p = Da(La(m, -f.minX, -f.minY));
    if (!p.length) continue;
    const g = Lt(e, "path", { ...t, x: t.x + f.minX, y: t.y + f.minY, w: Math.max(f.maxX - f.minX, 1), h: Math.max(f.maxY - f.minY, 1) }, a);
    !(Math.abs(f.minX + f.maxX - t.w) < 0.5 && Math.abs(f.minY + f.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && Va(g, p, t, f), g.pathSubpaths = p, g.pathAnchors = p[0].anchors, g.pathClosed = p[0].closed, h.startsWith("fill") ? Gs(g, t.fill, e) : g.backgroundColor = "transparent", h.endsWith("|stroke") ? vn(g, t.line) : (g.strokeColor = "transparent", g.strokeWidth = 0), r.push(g), u ??= g, e.stats.paths++;
  }
  if (u && e.byPptId.set(t.id, { el: u, item: t }), t.text) {
    const h = t.textRect ?? (s.kind === "preset" && e.presets[s.prst] ? eo(e.presets[s.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    r.push(Ne(e, t.text, { ...t, x: t.x + h.l, y: t.y + h.t, w: h.r - h.l, h: h.b - h.t }, a));
  }
  return e.stats.elements += r.length, r;
}
function Va(t, e, n, s) {
  const o = n.w / 2, i = n.h / 2, r = (n.rot || 0) * Math.PI / 180, l = Math.cos(r), a = Math.sin(r), c = n.flipH ? -1 : 1, u = n.flipV ? -1 : 1, h = (b, y) => {
    const k = (b + s.minX - o) * c, w = (y + s.minY - i) * u;
    return { x: o + k * l - w * a, y: i + k * a + w * l };
  }, d = (b, y) => {
    const k = b * c, w = y * u;
    return { x: k * l - w * a, y: k * a + w * l };
  };
  let m = 1 / 0, f = 1 / 0, p = -1 / 0, g = -1 / 0;
  for (const b of e) for (const y of b.anchors) {
    const k = h(y.x, y.y);
    if (y.x = k.x, y.y = k.y, y.inX !== void 0) {
      const w = d(y.inX, y.inY ?? 0);
      y.inX = w.x, y.inY = w.y;
    }
    if (y.outX !== void 0) {
      const w = d(y.outX, y.outY ?? 0);
      y.outX = w.x, y.outY = w.y;
    }
    m = Math.min(m, y.x), f = Math.min(f, y.y), p = Math.max(p, y.x), g = Math.max(g, y.y);
  }
  for (const b of e) for (const y of b.anchors)
    y.x -= m, y.y -= f;
  t.x = t.x - s.minX + m, t.y = t.y - s.minY + f, t.width = Math.max(p - m, 1), t.height = Math.max(g - f, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Ya(t) {
  const e = t.geom;
  if (e.kind !== "preset") return null;
  const n = e.adj ?? {};
  switch (e.prst) {
    case "rect":
      return { type: "rectangle", extra: { borderRadius: 0 } };
    case "roundRect":
      return { type: "rectangle", extra: { borderRadius: Math.max(0, Math.min(50, (n.adj ?? 16667) / 1e3)) } };
    case "ellipse":
      return { type: "circle", extra: {} };
    case "diamond":
      return { type: "diamond", extra: { borderRadius: 0 } };
    case "triangle":
      return (n.adj ?? 5e4) === 5e4 ? { type: "triangle", extra: {} } : null;
    default:
      return null;
  }
}
const qs = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function Sn(t, e, n) {
  const s = t.geom;
  let o;
  if (s.kind === "preset" && Xo.has(s.prst)) o = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (s.kind === "custom") o = s.paths.flatMap((k) => k.cmds);
  else {
    const k = e.presets[s.prst], w = Object.fromEntries(Object.entries(s.adj ?? {}).map(([v, S]) => [v, `val ${S}`]));
    o = k ? Fe(k, t.w, t.h, w).flatMap((v) => v.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const i = t.w / 2, r = t.h / 2, l = (t.rot || 0) * Math.PI / 180, a = (k, w) => {
    let v = k - i, S = w - r;
    return t.flipH && (v = -v), t.flipV && (S = -S), { x: t.x + i + v * Math.cos(l) - S * Math.sin(l), y: t.y + r + v * Math.sin(l) + S * Math.cos(l) };
  }, c = [];
  let u = { x: 0, y: 0 };
  for (const k of o)
    if (k.op === "M" || k.op === "L")
      u = { x: k.x, y: k.y }, c.push(a(u.x, u.y));
    else if (k.op === "C") {
      for (let w = 1; w <= 12; w++) {
        const v = w / 12, S = 1 - v, $ = S * S * S * u.x + 3 * S * S * v * k.x1 + 3 * S * v * v * k.x2 + v * v * v * k.x, I = S * S * S * u.y + 3 * S * S * v * k.y1 + 3 * S * v * v * k.y2 + v * v * v * k.y;
        c.push(a($, I));
      }
      u = { x: k.x, y: k.y };
    }
  if (c.length < 2) return [];
  const h = Math.min(...c.map((k) => k.x)), d = Math.min(...c.map((k) => k.y)), m = Math.max(...c.map((k) => k.x)), f = Math.max(...c.map((k) => k.y)), p = t.line.head && qs[t.line.head.type], g = t.line.tail && qs[t.line.tail.type], b = Lt(e, p || g ? "arrow" : "line", { ...t, x: h, y: d, w: Math.max(m - h, 1), h: Math.max(f - d, 1), rot: 0, flipH: !1, flipV: !1 }, n);
  b.points = c.map((k) => ({ x: k.x - h, y: k.y - d })), b.curveType = "straight", b.startArrowhead = p ?? null, b.endArrowhead = g ?? null, vn(b, t.line);
  const y = (k, w) => {
    if (!k) return null;
    const v = e.byPptId.get(k.id);
    if (!v || !v.el.width || !v.el.height) return null;
    const S = v.el;
    return { elementId: S.id, focus: 0, gap: 0, anchorFractionX: (w.x + e.ox - S.x) / S.width, anchorFractionY: (w.y + e.oy - S.y) / S.height };
  };
  return e.glue.push(() => {
    b.startBinding = y(t.start, c[0]), b.endBinding = y(t.end, c[c.length - 1]);
  }), e.stats.elements++, [b];
}
const Zs = 25 * 1024 * 1024, Ks = 50 * 1024 * 1024, Ga = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#4472c4"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#4472c4" stroke-width="1.8" stroke-linecap="round"/></svg>');
function qa(t, e, n, s) {
  if (!s || !e || !n || !s.l && !s.t && !s.r && !s.b) return t;
  const o = s.l * e, i = s.t * n, r = Math.max(1, (1 - s.l - s.r) * e), l = Math.max(1, (1 - s.t - s.b) * n), a = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${o} ${i} ${r} ${l}" width="${Math.round(r)}" height="${Math.round(l)}" preserveAspectRatio="none"><image width="${e}" height="${n}" preserveAspectRatio="none" xlink:href="${t}" href="${t}"/></svg>`;
  return `data:image/svg+xml;base64,${Gn(new TextEncoder().encode(a))}`;
}
function Za(t, e, n) {
  const s = t.audio ? "Audio" : "Video", o = (c) => {
    if (e.warnings.push(`${s} "${t.name}" ${c}; only its picture was imported.`), !t.poster) return [];
    const u = { id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot, flipH: t.flipH, flipV: t.flipV, media: t.poster, crop: t.crop };
    return Cn(u, e, n);
  };
  let i;
  if (t.file) {
    const c = ti(t.file.ext, t.audio), u = t.file.bytes.length, h = e.mediaBytes ??= { used: 0 }, d = t.file.ext.toUpperCase() || "media";
    if (!c) return o(`is ${/^[AEFHILMNORSX]/.test(d) ? "an" : "a"} ${d} file, which browsers can't play`);
    if (u > Zs) return o(`is ${(u / 1048576).toFixed(0)} MB, over the ${Zs / 1048576} MB a clip can be`);
    if (h.used + u > Ks) return o(`would take the presentation's clips over ${Ks / 1048576} MB in all`);
    h.used += u, i = `data:${c};base64,${Gn(t.file.bytes)}`;
  } else if (t.url)
    i = t.url;
  else
    return t.poster ? Cn({ id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot, flipH: t.flipH, flipV: t.flipV, media: t.poster, crop: t.crop }, e, n) : [];
  const r = Lt(e, "video", t, n), l = t.file ? "direct" : ei(i), a = t.poster ? e.images.get(t.poster) : null;
  return Object.assign(r, {
    backgroundColor: t.audio ? "transparent" : "#1a1a2e",
    videoURL: i,
    videoProvider: l,
    videoEmbedURL: ni(i, l) || void 0,
    videoPosterDataURL: a ? qa(a.url, a.w, a.h, t.crop) : t.audio ? Ga : void 0,
    videoAutoplay: !!t.autoplay,
    videoLoop: !!t.loop,
    videoMuted: !!t.muted,
    videoLocked: !1
  }), e.stats.elements++, [r];
}
function Cn(t, e, n) {
  const s = e.images.get(t.media);
  if (!s) {
    e.warnings.push(t.media.ext === "emf" || t.media.ext === "wmf" ? `Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image Yappy couldn't read (or that draws nothing); it was imported as a placeholder.` : t.media.ext === "tiff" ? `Picture "${t.name}" is a TIFF image in a form Yappy can't decode (such as JPEG-compressed TIFF); it was imported as a placeholder.` : `Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const a = Lt(e, "rectangle", t, n);
    return Object.assign(a, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), e.stats.elements++, [a];
  }
  const o = Lt(e, "image", t, n);
  if (o.dataURL = t.grayscale && e.gray.get(s.url) || s.url, o.status = "loaded", o.mimeType = /^data:([^;,]+)/.exec(s.url)?.[1] ?? An[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (o.crop = { x: t.crop.l * s.w, y: t.crop.t * s.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * s.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * s.h) }), t.alpha !== void 0 && t.alpha < 1 && (o.opacity = Math.round(t.alpha * 100)), e.stats.elements++, e.stats.pictures++, !t.geom) return [o];
  const i = e.nextId("group"), r = Yn({
    kind: "shape",
    id: t.id,
    name: `${t.name} outline`,
    x: t.x,
    y: t.y,
    w: t.w,
    h: t.h,
    rot: t.rot,
    flipH: t.flipH,
    flipV: t.flipV,
    geom: t.geom,
    fill: { kind: "solid", color: { hex: "#000000" } },
    line: null
  }, e, [...n, i]);
  if (r.length !== 1)
    return e.stats.elements -= r.length, [o];
  const l = r[0];
  return l.isClipMask = !0, o.groupIds = [i, ...o.groupIds], o.clipMaskId = l.id, o.maskType = "clip", [o, l];
}
const we = (t, e) => !t && !e || !!t && !!e && t.hex.toLowerCase() === e.hex.toLowerCase() && Math.abs((t.alpha ?? 1) - (e.alpha ?? 1)) < 0.01, un = (t, e) => t.kind === e.kind && (t.kind === "none" || t.kind === "solid" && e.kind === "solid" && we(t.color, e.color)), Ka = (t, e) => !t && !e || !!t && !!e && Math.abs(t.width - e.width) < 0.05 && we(t.color, e.color) && (t.dash ?? "solid") === (e.dash ?? "solid"), Bt = (t, e) => t.every((n) => e(n, t[0]));
function Ja(t, e, n) {
  const s = !!t.firstRow;
  return Js(t, s, e, n) ?? (t.rows.length < 2 ? null : Js(t, !s, e, n));
}
function Js(t, e, n, s) {
  const o = t.rows.length, i = t.cols.length;
  if (!o || !i) return null;
  const r = t.rows.map((C) => C.cells.map((P) => P.fill));
  if (r.flat().some((C) => C.kind !== "none" && C.kind !== "solid")) return null;
  const l = [], a = [], c = Array.from({ length: i }, () => []), u = [];
  for (let C = 0; C < o; C++) {
    const P = [];
    for (let E = 0; E < i; E++) {
      const j = t.rows[C].cells[E], z = j.text, Q = z ? z.paragraphs.map((W) => W.runs.map((X) => X.br ? `
` : X.text).join("")).join(`
`) : "";
      if (P.push(j.hMerge || j.vMerge ? "" : Q), j.hMerge || j.vMerge || !z || !Q.trim()) continue;
      if (u.push(z.anchor), z.paragraphs.some((W) => W.bullet) || z.vert) return null;
      const V = z.defaults ?? {};
      for (const W of z.paragraphs) {
        c[E].push(W.align ?? "l");
        for (const X of W.runs)
          if (!(X.br || !X.text.trim())) {
            if ((X.underline ?? V.underline) || (X.strike ?? V.strike)) return null;
            a.push({ row: C, col: E, p: { size: X.size ?? V.size ?? 18, font: X.font ?? V.font, bold: !!(X.bold ?? V.bold), italic: !!(X.italic ?? V.italic), color: X.color ?? V.color } });
          }
      }
    }
    l.push(P);
  }
  const h = a.map((C) => C.p);
  if (h.length && !Bt(h, (C, P) => Math.abs(C.size - P.size) < 0.5 && (C.font ?? "") === (P.font ?? "") && C.italic === P.italic)) return null;
  const d = a.filter((C) => e && C.row === 0).map((C) => C.p), m = a.filter((C) => !(e && C.row === 0)).map((C) => C.p);
  if (!Bt(m, (C, P) => C.bold === P.bold && we(C.color, P.color)) || !Bt(d, (C, P) => we(C.color, P.color))) return null;
  const f = m[0]?.bold ?? !1;
  if (d.some((C) => !C.bold) || !Bt(u, (C, P) => C === P)) return null;
  const p = [];
  for (const C of c) {
    if (!Bt(C, (P, E) => P === E)) return null;
    p.push(C[0] === "r" ? "right" : C[0] === "ctr" ? "center" : "left");
  }
  const g = (C, P) => !t.rows[C].cells[P].hMerge && !t.rows[C].cells[P].vMerge, b = (C) => {
    const P = r[C].filter((E, j) => g(C, j));
    return P.length && Bt(P, un) ? P[0] : P.length ? null : { kind: "none" };
  }, y = t.rows.map((C, P) => b(P));
  if (y.some((C) => !C)) return null;
  const k = y.slice(e ? 1 : 0), w = k.filter((C, P) => P % 2 === 0), v = k.filter((C, P) => P % 2 === 1);
  if (!Bt(w, un) || !Bt(v, un)) return null;
  const S = (C) => C && C.kind === "solid" ? rt(C.color) : "", $ = S(w[0]), I = v.length ? S(v[0]) : $;
  if (!$ && I) return null;
  const L = t.rows.flatMap((C, P) => C.cells.filter((E, j) => g(P, j)).flatMap((E) => [E.borders.l, E.borders.r, E.borders.t, E.borders.b]));
  if (!Bt(L, Ka)) return null;
  const O = L[0] ?? null, F = [];
  t.rows.forEach((C, P) => C.cells.forEach((E, j) => {
    ((E.gridSpan ?? 1) > 1 || (E.rowSpan ?? 1) > 1) && F.push({ startRow: P, startCol: j, endRow: Math.min(o - 1, P + (E.rowSpan ?? 1) - 1), endCol: Math.min(i - 1, j + (E.gridSpan ?? 1) - 1) });
  }));
  const T = t.cols.reduce((C, P) => C + P, 0), D = t.rows.reduce((C, P) => C + P.h, 0), R = Lt(n, "table", { ...t, w: T, h: D }, s), B = h[0];
  return Object.assign(R, {
    tableRows: e ? o - 1 : o,
    tableCols: i,
    tableHeaders: e,
    tableData: l,
    tableColWidths: t.cols.map((C) => C / (T || 1)),
    tableRowHeights: t.rows.map((C) => C.h / (D || 1)),
    tableHeaderColor: e ? S(y[0]) : "",
    tableHeaderTextColor: d[0]?.color && !we(d[0].color, m[0]?.color) ? rt(d[0].color) : "",
    tableRowColor: $,
    tableAltRowColor: I !== $ ? I : "",
    // A presentation table isn't a sortable list: no arrows in its header.
    tableColAlignments: p,
    tableSortCol: -1,
    tableSortDir: "asc",
    tableSortArrows: !1,
    ...u[0] && u[0] !== "ctr" && { tableVerticalAlign: u[0] === "t" ? "top" : "bottom" },
    ...F.length && { tableMergedCells: F },
    strokeColor: O ? rt(O.color) : "transparent",
    strokeWidth: O ? O.width : 1,
    fontSize: B?.size ?? 14,
    fontFamily: Mn(B?.font),
    textColor: rt(m[0]?.color ?? d[0]?.color ?? { hex: "#000000" }),
    ...f && { fontWeight: "bold" },
    ...B?.italic && { fontStyle: "italic" }
  }), O?.dash && O.dash !== "solid" && (R.strokeStyle = /dot/i.test(O.dash) ? "dotted" : "dashed"), R;
}
function Pn(t, e, n) {
  const s = [];
  for (const o of t)
    try {
      const i = [];
      switch (o.kind) {
        case "shape":
          i.push(...Yn(o, e, n));
          break;
        case "connector":
          i.push(...Sn(o, e, n));
          break;
        case "picture":
          i.push(...Cn(o, e, n));
          break;
        case "media":
          i.push(...Za(o, e, n));
          break;
        case "group":
          i.push(...Pn(o.children, e, [...n, e.nextId("group")]));
          break;
        case "table": {
          const l = Ja(o, e, n);
          l ? (e.stats.elements++, i.push(l)) : o.fallback && i.push(...Pn([o.fallback], e, n));
          break;
        }
        case "chart": {
          const l = Lt(e, "chart", o, n);
          l.chart = Qo(o.chart), l.fontFamily = "sans-serif", e.stats.elements++, i.push(l);
          break;
        }
      }
      if (o.descr && i[0] && !i[0].altText && (i[0].altText = o.descr), o.decorative) for (const l of i) l.decorative = !0;
      const r = Ua(o.link, e);
      if (r)
        for (const l of i) l.link || (l.link = r);
      e.itemEls?.set(o.id, i), s.push(...i);
    } catch {
      e.warnings.push(`"${o.name}" couldn't be converted and was skipped.`);
    }
  return s;
}
function Qa(t) {
  if (!t) return;
  const e = t.dir === "r" ? "right" : t.dir === "u" ? "up" : t.dir === "d" ? "down" : "left";
  return { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.kind === "split" ? `split-${t.orient === "vert" ? "vertical" : "horizontal"}-${t.inward ? "in" : "out"}` : t.kind === "wipe" ? `wipe-${e}` : t.kind === "cover" ? `cover-${e}` : t.kind === "pull" ? `uncover-${e}` : `slide-${e}`, duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" };
}
function tc(t, e, n) {
  if (e)
    if (e.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = rt(e.color);
    else if (e.kind === "linear" || e.kind === "radial")
      t.fillStyle = e.kind, t.backgroundColor = rt(e.stops[0]?.color), t.gradientStops = e.stops.map((s) => ({ offset: s.pos, color: rt(s.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
    else if (e.kind === "image") {
      const s = n.images.get(e.media), o = n.slideBg ?? s?.url;
      o && (t.fillStyle = "image", t.backgroundImage = o, t.backgroundColor = "#ffffff"), o && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
    } else e.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = rt(e.color));
}
const An = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, ec = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Gn(t) {
  let e = "";
  for (let s = 0; s < t.length; s += 32768) e += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(e);
}
async function nc(t) {
  const e = /* @__PURE__ */ new Set(), n = (o) => {
    for (const i of o)
      i.kind === "picture" ? e.add(i.media) : i.kind === "media" && i.poster ? e.add(i.poster) : i.kind === "group" ? n(i.children) : i.kind === "shape" && i.fill.kind === "image" && e.add(i.fill.media);
  };
  for (const o of t.slides)
    n(o.items), o.background?.kind === "image" && e.add(o.background.media);
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...e].map(async (o) => {
    if (o.ext === "emf" || o.ext === "wmf") {
      s.set(o, wa(o.bytes));
      return;
    }
    if (o.ext === "tiff") {
      s.set(o, Pa(o.bytes));
      return;
    }
    if (!ec.has(o.ext)) {
      s.set(o, null);
      return;
    }
    const i = `data:${An[o.ext]};base64,${Gn(o.bytes)}`;
    let r = 0, l = 0;
    try {
      const a = await createImageBitmap(new Blob([o.bytes], { type: An[o.ext] }));
      r = a.width, l = a.height, a.close();
    } catch {
    }
    s.set(o, { url: i, w: r, h: l });
  })), s;
}
function sc(t, e, n) {
  const s = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, o = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, i = { color: e, background: n, spacing: s, strokeWidth: o }, r = /^pct(\d+)$/.exec(t);
  if (r) {
    const l = Math.max(1, Math.min(99, Number(r[1]))), a = l > 50, c = (a ? 100 - l : l) / 100;
    return { type: "dots", color: a ? n : e, background: a ? e : n, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(c / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...i, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...i, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...i, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...i, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...i } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...i, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...i } : { type: "dots", ...i, strokeWidth: 1 };
}
async function oc(t, e, n) {
  const s = await bi(), o = await nc(t), i = Math.round(t.width), r = Math.round(t.height), l = Jo(n ?? t.title, "slides", { width: i, height: r }), a = [], c = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  l.slides = [];
  const u = await za(t, o), h = await Promise.all(t.slides.map((f) => {
    const p = f.background, g = p?.kind === "image" ? o.get(p.media) : void 0;
    return p?.kind === "image" && g ? Ha(g.url, i, r, p.tile) : void 0;
  })), d = t.slides.map(() => e("slide")), m = /* @__PURE__ */ new Map();
  return t.slides.forEach((f, p) => {
    f.key && m.set(f.key, d[p]);
  }), t.slides.forEach((f, p) => {
    const g = p * (i + Ia), b = Zn(d[p], f.name || `Slide ${p + 1}`, g, 0, { width: i, height: r });
    b.order = p;
    const y = { ox: g, oy: 0, presets: s, nextId: e, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: a, stats: c, images: o, slideBg: h[p], gray: u, slideIds: m, itemEls: /* @__PURE__ */ new Map() };
    l.elements.push(...Pn(f.items, y, [])), ja(f.anims ?? [], y, e), y.glue.forEach((w) => w()), tc(b, f.background, y);
    const k = Qa(f.transition);
    k && (b.transition = k), f.notes && (b.notes = f.notes), f.hidden && (b.hidden = !0), f.advanceAfterMs && (b.advanceAfter = f.advanceAfterMs), f.section && (b.section = f.section), l.slides.push(b), c.slides++;
  }), l.slides.length || l.slides.push(Zn(void 0, "Slide 1", 0, 0, { width: i, height: r })), t.loop && (l.globalSettings = { ...l.globalSettings || {}, slideShowLoop: !0 }), { doc: l, warnings: [...new Set(a)], stats: c };
}
const ic = 512 * 1024 * 1024;
async function uc(t, e) {
  const n = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (n.length > ic) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: s, warnings: o } = hr(n), i = /* @__PURE__ */ new Set(), r = await oc(s, (a) => li(a, i), e);
  ri(r.doc);
  const l = [...o, ...r.warnings];
  return l.length && console.warn("[pptx import]", l), { stats: r.stats, warnings: l };
}
export {
  uc as importPptx
};
