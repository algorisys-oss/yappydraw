import { u as Ho, a as Xo, b as Wo, c as Vo, i as Yo } from "./browser-BNJ-qm4Y.js";
import { e as Go, s as Gn, f as qo } from "./anim-map-D7T1mIAM.js";
import { E as yt, i as An, c as Zo } from "./custgeom-Cly4AfIX.js";
import { aT as Ko, aU as qn, U as Jo, aV as Qo, aW as ti, aX as ei, aY as ni, aZ as si, N as oi, q as ii, K as ri } from "./index-CcU7GLMU.js";
const fe = (t, e) => `<a:ln w="${t}" cmpd="sng"><a:solidFill><a:schemeClr val="${e}"/></a:solidFill></a:ln>`, Oe = "<a:ln><a:noFill/></a:ln>", Bt = (t, e = "") => `<a:fill><a:solidFill><a:schemeClr val="${t}">${e}</a:schemeClr></a:solidFill></a:fill>`, te = (t, e = !1) => `<a:tcTxStyle${e ? ' b="on"' : ""}><a:fontRef idx="minor"><a:prstClr val="black"/></a:fontRef><a:schemeClr val="${t}"/></a:tcTxStyle>`, Wt = (t) => `<a:tcBdr>${Object.entries(t).map(([e, n]) => `<a:${e}>${n}</a:${e}>`).join("")}</a:tcBdr>`;
function ae(t, e) {
  const n = fe(12700, "lt1"), s = `${te("lt1", !0)}<a:tcStyle><a:tcBdr/>${Bt(e)}</a:tcStyle>`;
  return `<a:tblStyle styleId="${t}" styleName="Medium Style 2"><a:wholeTbl>${te("dk1")}<a:tcStyle>${Wt({ left: n, right: n, top: n, bottom: n, insideH: n, insideV: n })}${Bt(e, '<a:tint val="20000"/>')}</a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${Bt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${Bt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1V><a:band2V><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2V><a:lastCol>${s}</a:lastCol><a:firstCol>${s}</a:firstCol><a:lastRow>${te("lt1", !0)}<a:tcStyle>${Wt({ top: fe(38100, "lt1") })}${Bt(e)}</a:tcStyle></a:lastRow><a:firstRow>${te("lt1", !0)}<a:tcStyle>${Wt({ bottom: fe(38100, "lt1") })}${Bt(e)}</a:tcStyle></a:firstRow></a:tblStyle>`;
}
function $e(t, e) {
  const n = fe(12700, e);
  return `<a:tblStyle styleId="${t}" styleName="Light Style 1"><a:wholeTbl>${te("tx1")}<a:tcStyle>${Wt({ left: Oe, right: Oe, top: n, bottom: n, insideH: Oe, insideV: Oe })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${Bt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${Bt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1V><a:lastCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:lastCol><a:firstCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:firstCol><a:lastRow><a:tcTxStyle b="on"/><a:tcStyle>${Wt({ top: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:lastRow><a:firstRow><a:tcTxStyle b="on"/><a:tcStyle>${Wt({ bottom: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:firstRow></a:tblStyle>`;
}
function li(t) {
  const e = fe(12700, "tx1");
  return `<a:tblStyle styleId="${t}" styleName="No Style, Table Grid"><a:wholeTbl>${te("tx1")}<a:tcStyle>${Wt({ left: e, right: e, top: e, bottom: e, insideH: e, insideV: e })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle>`;
}
const ai = {
  "{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}": (t) => ae(t, "dk1"),
  "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}": (t) => ae(t, "accent1"),
  "{21E4AEA4-8DFA-4A89-87EB-49C32662AFE0}": (t) => ae(t, "accent2"),
  "{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}": (t) => ae(t, "accent3"),
  "{7DF18680-E054-41AD-8BC1-D1AEF772440D}": (t) => ae(t, "accent5"),
  "{9D7B26C5-4107-4FEC-AEDC-1716B250A1EF}": (t) => $e(t, "tx1"),
  "{3B4B98B0-60AC-42C2-AFA5-B58CD77FA1E5}": (t) => $e(t, "accent1"),
  "{0E3FDE45-AF77-4B5C-9715-49D594BDF05E}": (t) => $e(t, "accent2"),
  "{C083E6E3-FA7D-4D7B-A595-EF9225AFEA82}": (t) => $e(t, "accent3"),
  "{5940675A-B579-460E-94D1-54222C63F5DA}": li
}, ci = "http://schemas.openxmlformats.org/drawingml/2006/main";
function ui(t) {
  const e = ai[t.toUpperCase()];
  return e ? `<a:tblStyleLst xmlns:a="${ci}">${e(t.toUpperCase())}</a:tblStyleLst>` : null;
}
const hi = 1e4, fi = 1e5, Ks = 6e4, de = (t) => t / Ks * (Math.PI / 180);
function Js(t, e, n, s = {}) {
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
  for (const [f, m] of Object.entries(c)) o.set(f, m);
  for (const f of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    o.set(`wd${f}`, i / f), o.set(`hd${f}`, r / f), o.set(`ssd${f}`, l / f);
  const u = (f) => {
    const m = o.get(f);
    if (m !== void 0) return m;
    const d = /^(wd|hd|ssd)(\d+)$/.exec(f);
    if (d) {
      const g = d[1] === "wd" ? i : d[1] === "hd" ? r : l, b = Number(d[2]);
      return b ? g / b : 0;
    }
    const p = Number(f);
    return Number.isFinite(p) ? p : 0;
  }, h = (f, m) => {
    o.size > hi || o.set(f, di(m, u));
  };
  for (const [f, m] of t.av ?? []) h(f, s[f] ?? m);
  for (const [f, m] of Object.entries(s)) o.has(f) || h(f, m);
  for (const [f, m] of t.gd ?? []) h(f, m);
  return o;
}
function di(t, e) {
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
      l = Math.atan2(i, o) * 180 / Math.PI * Ks;
      break;
    case "cat2":
      l = o * Math.cos(Math.atan2(r, i));
      break;
    case "sat2":
      l = o * Math.sin(Math.atan2(r, i));
      break;
    case "cos":
      l = o * Math.cos(de(i));
      break;
    case "sin":
      l = o * Math.sin(de(i));
      break;
    case "tan":
      l = o * Math.tan(de(i));
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
const Zn = (t, e, n) => Math.atan2(e * Math.sin(t), n * Math.cos(t));
function Fe(t, e, n, s = {}) {
  const o = Math.max(Math.abs(e), 0) * yt, i = Math.max(Math.abs(n), 0) * yt, r = Js(t, o, i, s), l = (u) => typeof u == "number" ? u : r.get(u) ?? (Number.isFinite(Number(u)) ? Number(u) : 0), a = [];
  let c = fi;
  for (const u of t.paths) {
    const h = u.w ? o / u.w : 1, f = u.h ? i / u.h : 1, m = (k) => l(k) * h / yt, d = (k) => l(k) * f / yt, p = [];
    let g = { x: 0, y: 0 }, b = { x: 0, y: 0 };
    for (const k of u.d) {
      if (--c < 0) break;
      switch (k[0]) {
        case "M":
          g = { x: m(k[1]), y: d(k[2]) }, b = g, p.push({ op: "M", ...g });
          break;
        case "L":
          g = { x: m(k[1]), y: d(k[2]) }, p.push({ op: "L", ...g });
          break;
        case "C": {
          const y = m(k[1]), w = d(k[2]), v = m(k[3]), S = d(k[4]);
          g = { x: m(k[5]), y: d(k[6]) }, p.push({ op: "C", x1: y, y1: w, x2: v, y2: S, ...g });
          break;
        }
        case "Q": {
          const y = m(k[1]), w = d(k[2]), v = m(k[3]), S = d(k[4]);
          p.push({ op: "C", x1: g.x + 2 / 3 * (y - g.x), y1: g.y + 2 / 3 * (w - g.y), x2: v + 2 / 3 * (y - v), y2: S + 2 / 3 * (w - S), x: v, y: S }), g = { x: v, y: S };
          break;
        }
        case "A": {
          const y = l(k[1]) * h / yt, w = l(k[2]) * f / yt;
          g = pi(p, g, y, w, l(k[3]), l(k[4]));
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
function pi(t, e, n, s, o, i) {
  if (Math.abs(n) < 1e-9 || Math.abs(s) < 1e-9 || i === 0) return e;
  const r = de(o), l = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, de(i))), a = Zn(r, n, s);
  let c = Zn(r + l, n, s);
  if (Math.abs(l) >= 2 * Math.PI - 1e-9) c = a + Math.sign(l) * 2 * Math.PI;
  else {
    for (; l > 0 && c < a; ) c += 2 * Math.PI;
    for (; l < 0 && c > a; ) c -= 2 * Math.PI;
  }
  const u = e.x - n * Math.cos(a), h = e.y - s * Math.sin(a), f = c - a, m = Math.max(1, Math.min(16, Math.ceil(Math.abs(f) / (Math.PI / 2)))), d = f / m, p = 4 / 3 * Math.tan(d / 4);
  let g = a, b = e;
  for (let k = 0; k < m; k++) {
    const y = g + d, w = Math.cos(g), v = Math.sin(g), S = Math.cos(y), $ = Math.sin(y);
    b = { x: u + n * S, y: h + s * $ }, t.push({ op: "C", x1: u + n * (w - p * v), y1: h + s * (v + p * w), x2: u + n * (S + p * $), y2: h + s * ($ - p * S), ...b }), g = y;
  }
  return b;
}
function Qs(t, e, n, s = {}) {
  const o = Math.abs(e), i = Math.abs(n);
  if (!t.rect) return { l: 0, t: 0, r: o, b: i };
  const r = Js(t, o * yt, i * yt, s), l = (f) => (r.get(f) ?? (Number.isFinite(Number(f)) ? Number(f) : 0)) / yt, [a, c, u, h] = t.rect.map(l);
  return { l: a, t: c, r: u, b: h };
}
let Kn = null;
async function mi() {
  return Kn ??= (await import("./presets-DP49P8i2.js")).default, Kn;
}
const Jn = 5e4, gi = 256 * 1024 * 1024, Qn = 1024 * 1024 * 1024, bi = 1e4, xi = 32, yi = 2e4, _ = (t, e) => {
  if (!t) return [];
  const n = [];
  for (let s = t.firstChild; s; s = s.nextSibling)
    s.nodeType === 1 && (!e || s.localName === e) && n.push(s);
  return n;
}, x = (t, e) => {
  if (!t) return null;
  for (let n = t.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && n.localName === e) return n;
  return null;
}, V = (t, ...e) => {
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
}, Q = (t, e) => {
  const n = M(t, e);
  return n === null ? void 0 : n === "1" || n === "true" || n === "on";
}, tt = (t) => t / yt, ki = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function wi(t) {
  if (t.localName !== "AlternateContent") return [t];
  const e = x(t, "Fallback");
  for (const n of _(t, "Choice"))
    if ((M(n, "Requires") || "").split(/\s+/).filter(Boolean).every((o) => ki.has(o))) return _(n);
  return _(e);
}
const Tt = (t) => _(t).flatMap(wi);
class Mi {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(e, n, s) {
    this.parseXml = n, this.warn = s, this.files = {};
    for (const [o, i] of Object.entries(e)) this.files[he(o)] = i;
  }
  bytes(e) {
    return this.files[he(e)];
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
    const n = he(e);
    if (!this.text.has(n)) {
      const s = this.files[n];
      let o = null;
      if (s) {
        try {
          const i = Xo(s).replace(/^﻿/, "");
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
    const n = he(e);
    let s = this.relCache.get(n);
    if (s) return s;
    s = /* @__PURE__ */ new Map();
    const o = n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "", i = n.slice(n.lastIndexOf("/") + 1), r = this.xml(`${o ? o + "/" : ""}_rels/${i}.rels`);
    for (const l of _(r, "Relationship")) {
      const a = M(l, "Id"), c = M(l, "Type") || "", u = M(l, "Target") || "";
      if (!a) continue;
      const h = M(l, "TargetMode") === "External";
      s.set(a, { type: c.slice(c.lastIndexOf("/") + 1), target: h ? u : vi(o, u), external: h });
    }
    return this.relCache.set(n, s), s;
  }
  relOfType(e, n) {
    for (const s of this.rels(e).values()) if (s.type === n && !s.external) return s.target;
    return null;
  }
}
const he = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function vi(t, e) {
  let n = e.split("#")[0];
  try {
    n = decodeURIComponent(n);
  } catch {
  }
  if (n.startsWith("/")) return he(n);
  const s = (t ? t.split("/") : []).concat(n.split("/")), o = [];
  for (const i of s)
    i === ".." ? o.pop() : i && i !== "." && o.push(i);
  return o.join("/");
}
const On = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function to(t) {
  const e = {};
  for (const n of _(t)) {
    const s = _(n)[0];
    if (!s) continue;
    const o = s.localName === "sysClr" ? M(s, "lastClr") : M(s, "val");
    o && /^[0-9a-f]{6}$/i.test(o) && (e[n.localName] = "#" + o.toLowerCase());
  }
  return e;
}
function We(t) {
  const e = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, n = x(t, "themeElements");
  e.colors = to(x(n, "clrScheme"));
  const s = x(n, "fontScheme");
  e.major = M(V(s, "majorFont", "latin"), "typeface") || e.major, e.minor = M(V(s, "minorFont", "latin"), "typeface") || e.minor;
  const o = x(n, "fmtScheme");
  return e.fills = _(x(o, "fillStyleLst")), e.lines = _(x(o, "lnStyleLst")), e.bgFills = _(x(o, "bgFillStyleLst")), e;
}
const Ci = {
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
}, Si = (t) => {
  const e = t.replace("#", "");
  return [parseInt(e.slice(0, 2), 16) || 0, parseInt(e.slice(2, 4), 16) || 0, parseInt(e.slice(4, 6), 16) || 0];
}, Ve = (t, e, n) => "#" + [t, e, n].map((s) => Math.max(0, Math.min(255, Math.round(s))).toString(16).padStart(2, "0")).join(""), ts = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), ce = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function es(t, e, n) {
  t /= 255, e /= 255, n /= 255;
  const s = Math.max(t, e, n), o = Math.min(t, e, n), i = (s + o) / 2;
  if (s === o) return [0, 0, i];
  const r = s - o, l = i > 0.5 ? r / (2 - s - o) : r / (s + o);
  return [(s === t ? (e - n) / r + (e < n ? 6 : 0) : s === e ? (n - t) / r + 2 : (t - e) / r + 4) * 60, l, i];
}
function Ye(t, e, n) {
  if (t = (t % 360 + 360) % 360 / 360, e === 0) return [n * 255, n * 255, n * 255];
  const s = n < 0.5 ? n * (1 + e) : n + e - n * e, o = 2 * n - s, i = (r) => (r = (r % 1 + 1) % 1, r < 1 / 6 ? o + (s - o) * 6 * r : r < 1 / 2 ? s : r < 2 / 3 ? o + (s - o) * (2 / 3 - r) * 6 : o);
  return [i(t + 1 / 3) * 255, i(t) * 255, i(t - 1 / 3) * 255];
}
function it(t, e) {
  const n = _(t).find((s) => /Clr$/.test(s.localName));
  return n ? Pi(n, e) : null;
}
function Pi(t, e) {
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
      n = Ci[M(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      n = Ve(ce(N(t, "r") / 1e5), ce(N(t, "g") / 1e5), ce(N(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [a, c, u] = Ye(N(t, "hue") / 6e4, N(t, "sat") / 1e5, N(t, "lum") / 1e5);
      n = Ve(a, c, u);
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
  let [o, i, r] = Si(n);
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
        let [u, h, f] = es(o, i, r);
        a.localName === "lumMod" ? f *= c : a.localName === "lumOff" ? f += c : a.localName === "satMod" ? h *= c : a.localName === "satOff" ? h += c : a.localName === "hueMod" ? u *= c : u += N(a, "val") / 6e4, [o, i, r] = Ye(u, Math.max(0, Math.min(1, h)), Math.max(0, Math.min(1, f)));
        break;
      }
      case "tint":
        [o, i, r] = [o, i, r].map((u) => ce(ts(u) * c + (1 - c)));
        break;
      case "shade":
        [o, i, r] = [o, i, r].map((u) => ce(ts(u) * c));
        break;
      case "comp": {
        const [u, h, f] = es(o, i, r);
        [o, i, r] = Ye(u + 180, h, f);
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
  const l = { hex: Ve(o, i, r) };
  return s < 0.999 && (l.alpha = s), l;
}
function Lt(t, e) {
  for (const n of _(t)) {
    const s = $n(n, e);
    if (s) return s;
  }
}
function $n(t, e) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const n = it(t, e.ctx);
      return n ? { kind: "solid", color: n } : { kind: "none" };
    }
    case "gradFill": {
      const n = _(x(t, "gsLst"), "gs").slice(0, 256).map((o) => ({ pos: N(o, "pos") / 1e5, color: it(o, e.ctx) ?? { hex: "#000000" } }));
      if (!n.length) return { kind: "none" };
      const s = x(t, "lin");
      return x(t, "path") ? { kind: "radial", stops: n } : { kind: "linear", stops: n, angle: s ? N(s, "ang") / 6e4 : 90, scaled: Q(s, "scaled") ?? !1 };
    }
    case "blipFill": {
      const n = Tn(t, e);
      if (!n) return;
      const s = { kind: "image", media: n }, o = x(t, "tile");
      o && (s.tile = { sx: Math.max(0.01, N(o, "sx", 1e5) / 1e5), sy: Math.max(0.01, N(o, "sy", 1e5) / 1e5) });
      const i = x(x(t, "blip"), "alphaModFix");
      return i && (s.alpha = Math.max(0, Math.min(1, N(i, "amt", 1e5) / 1e5))), x(x(t, "blip"), "grayscl") && (s.grayscale = !0), s;
    }
    case "pattFill": {
      const n = it(x(t, "fgClr"), e.ctx), s = it(x(t, "bgClr"), e.ctx);
      return n ? { kind: "pattern", preset: M(t, "prst") || "pct50", color: n, ...s ? { bg: s } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Ai = {
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
function Tn(t, e) {
  const n = x(t, "blip"), s = M(n, "r:embed");
  if (!s) return null;
  const o = e.pkg.rels(e.part).get(s);
  return !o || o.external ? null : eo(e.pkg, o.target);
}
function Oi(t, e) {
  const n = x(t, "videoFile") ?? x(t, "quickTimeFile"), s = x(t, "audioFile") ?? x(t, "wavAudioFile"), o = ct(x(t, "extLst"), "media", 2);
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
function eo(t, e) {
  const n = t.bytes(e), s = Ai[(e.split(".").pop() || "").toLowerCase()];
  return n && s ? { bytes: n, ext: s } : null;
}
const $i = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function jt(t, e) {
  if (!t) return;
  let n;
  for (const l of _(t)) {
    if (l.localName === "noFill") return null;
    l.localName === "solidFill" && (n = it(l, e.ctx)), l.localName === "gradFill" && (n = it(x(x(l, "gsLst"), "gs"), e.ctx));
  }
  const s = M(t, "w");
  if (n === void 0 && s === null && !x(t, "prstDash") && !x(t, "headEnd") && !x(t, "tailEnd")) return;
  const o = (l) => {
    const a = M(l, "type");
    if (!a || a === "none") return;
    const c = a === "triangle" || a === "stealth" || a === "arrow" || a === "oval" || a === "diamond" ? a : "triangle", u = M(l, "len") || M(l, "w");
    return { type: c, size: u === "sm" || u === "lg" ? u : "med" };
  }, i = $i[M(x(t, "prstDash"), "val") || "solid"], r = M(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: s !== null ? Math.max(0, tt(Number(s) || 0)) : 1,
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
  const r = it(n, e.ctx) ?? void 0;
  return $n(i, { ...e, ctx: { ...e.ctx, phClr: r } });
}
function En(t, e) {
  const n = x(t, "lnRef");
  if (!n) return;
  const s = N(n, "idx");
  if (s === 0) return null;
  const o = e.ctx.theme.lines[s - 1];
  if (!o) return;
  const i = it(n, e.ctx) ?? void 0;
  return jt(o, { ...e, ctx: { ...e.ctx, phClr: i } }) ?? void 0;
}
function At(t) {
  if (!t) return null;
  const e = x(t, "off"), n = x(t, "ext");
  return !e || !n ? null : {
    x: tt(N(e, "x")),
    y: tt(N(e, "y")),
    w: Math.max(0, tt(N(n, "cx"))),
    h: Math.max(0, tt(N(n, "cy"))),
    rot: N(t, "rot") / 6e4,
    flipH: !!Q(t, "flipH"),
    flipV: !!Q(t, "flipV")
  };
}
const Ge = (t) => t;
function Ti(t, e) {
  const n = At(t);
  if (!n) return e;
  const s = x(t, "chOff"), o = x(t, "chExt"), i = s ? tt(N(s, "x")) : n.x, r = s ? tt(N(s, "y")) : n.y, l = o ? tt(N(o, "cx")) : n.w, a = o ? tt(N(o, "cy")) : n.h, c = l > 0 ? n.w / l : 1, u = a > 0 ? n.h / a : 1, h = n.x + n.w / 2, f = n.y + n.h / 2, m = n.rot * Math.PI / 180;
  return (d) => {
    let p = n.x + (d.x + d.w / 2 - i) * c, g = n.y + (d.y + d.h / 2 - r) * u, b = d.rot, k = d.flipH, y = d.flipV;
    if (n.flipH && (p = 2 * h - p, k = !k, b = -b), n.flipV && (g = 2 * f - g, y = !y, b = -b), m) {
      const S = p - h, $ = g - f;
      p = h + S * Math.cos(m) - $ * Math.sin(m), g = f + S * Math.sin(m) + $ * Math.cos(m), b += n.rot;
    }
    const w = d.w * c, v = d.h * u;
    return e({ x: p - w / 2, y: g - v / 2, w, h: v, rot: (b % 360 + 360) % 360, flipH: k, flipV: y });
  };
}
function ns(t) {
  const e = x(t, "spcPts"), n = x(t, "spcPct");
  if (e) return { px: Math.max(0, Math.min(1584, N(e, "val") / 100)) * (An / yt) };
  if (n) return { lines: Math.max(0, Math.min(13.2, N(n, "val") / 1e5)) };
}
function ss(t, e, n) {
  const s = x(t, `lvl${e + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return s ? no(s, n) : {};
}
function no(t, e) {
  const n = {};
  if (M(t, "algn") && (n.algn = M(t, "algn")), M(t, "marL") !== null && (n.marL = tt(N(t, "marL"))), M(t, "indent") !== null && (n.indent = tt(N(t, "indent"))), x(t, "buNone")) n.bullet = "none";
  else if (x(t, "buAutoNum")) {
    const r = x(t, "buAutoNum");
    n.bullet = "num", n.numType = M(r, "type") || "arabicPeriod", n.startAt = M(r, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(N(r, "startAt", 1)))) : void 0;
  } else x(t, "buChar") ? (n.bullet = "char", n.buChar = M(x(t, "buChar"), "char") || void 0) : x(t, "buBlip") && (n.bullet = "char", n.buChar = "•");
  if (x(t, "buFont") ? n.buFont = M(x(t, "buFont"), "typeface") || null : x(t, "buFontTx") && (n.buFont = null), x(t, "buClr") ? n.buClr = it(x(t, "buClr"), e.ctx) : x(t, "buClrTx") && (n.buClr = null), x(t, "buSzPct")) {
    const r = M(x(t, "buSzPct"), "val") || "", l = r.endsWith("%") ? parseFloat(r) / 100 : Number(r) / 1e5;
    n.buSz = Number.isFinite(l) && l > 0 ? Math.max(0.25, Math.min(4, l)) : null;
  } else (x(t, "buSzTx") || x(t, "buSzPts")) && (n.buSz = null);
  const s = V(t, "lnSpc", "spcPct");
  s && (n.lnSpcPct = N(s, "val") / 1e5);
  const o = ns(x(t, "spcBef")), i = ns(x(t, "spcAft"));
  return o && (n.spcBef = o), i && (n.spcAft = i), Object.assign(n, so(x(t, "defRPr"), e)), n;
}
function so(t, e) {
  if (!t) return {};
  const n = {};
  M(t, "sz") !== null && (n.sz = N(t, "sz") / 100 * (An / yt)), Q(t, "b") !== void 0 && (n.b = Q(t, "b")), Q(t, "i") !== void 0 && (n.i = Q(t, "i")), M(t, "u") && (n.u = M(t, "u") !== "none"), M(t, "strike") && (n.strike = M(t, "strike") !== "noStrike");
  const s = x(t, "solidFill");
  s ? n.color = it(s, e.ctx) : x(t, "noFill") && (n.color = null);
  const o = M(x(t, "latin"), "typeface");
  return o && (n.font = o), n;
}
const Ei = {
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
}, Ni = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Ii(t, e) {
  if (!t) return "•";
  let n = t.codePointAt(0);
  n >= 61440 && n <= 61695 && (n -= 61440);
  const s = (e || "").toLowerCase();
  return s.startsWith("wingdings") ? s === "wingdings" && Ei[n] || "•" : s === "symbol" ? Ni[n] ?? (n < 128 && n > 32 ? String.fromCharCode(n) : "•") : s.startsWith("webdings") || s.startsWith("marlett") ? "•" : s === "courier new" && t === "o" ? "◦" : /\s/.test(t) || n < 32 ? "•" : [...t][0];
}
const os = (...t) => {
  const e = {};
  for (const n of t) for (const [s, o] of Object.entries(n)) o !== void 0 && (e[s] = o);
  return e;
};
function Ri(t, e) {
  if (t)
    return t.startsWith("+mj") ? e.major : t.startsWith("+mn") ? e.minor : t;
}
function Nn(t, e, n) {
  if (!t) return;
  const s = _(t, "p");
  if (!s.some((p) => _(p).some((g) => (g.localName === "r" || g.localName === "fld") && (V(g, "t")?.textContent ?? "") !== ""))) return;
  const i = {};
  let r = 1, l = 1, a = !1;
  for (const p of [...e.bodyPr, x(t, "bodyPr")]) {
    if (!p) continue;
    for (let b = 0; b < p.attributes.length; b++) i[p.attributes[b].localName ?? p.attributes[b].name] = p.attributes[b].value;
    const g = x(p, "normAutofit");
    g && (r = M(g, "fontScale") !== null ? N(g, "fontScale") / 1e5 : 1, a = !1), g && (l = 1 - Math.max(0, Math.min(0.9, N(g, "lnSpcReduction") / 1e5))), (x(p, "noAutofit") || x(p, "spAutoFit")) && (r = 1, l = 1, a = !0);
  }
  const c = !a && [...e.bodyPr, x(t, "bodyPr")].some((p) => p && x(p, "normAutofit")), u = (p, g) => i[p] !== void 0 ? tt(Number(i[p]) || 0) : tt(g), h = i.anchor === "ctr" ? "ctr" : i.anchor === "b" ? "b" : "t", f = x(t, "lstStyle"), m = [];
  let d;
  for (const p of s) {
    const g = x(p, "pPr"), b = Math.max(0, Math.min(8, N(g, "lvl"))), k = e.fontRef ? { color: e.fontRef.color ?? void 0, font: e.fontRef.font } : {}, y = os(...e.levels.map((E) => ss(E, b, n)), k, ss(f, b, n), g ? no(g, n) : {});
    y.lnSpcPct !== void 0 && d === void 0 && (d = y.lnSpcPct);
    const w = { runs: [], align: y.algn === "ctr" ? "ctr" : y.algn === "r" ? "r" : (y.algn === "just", "l"), level: b };
    if (y.bullet === "char" || y.bullet === "num") {
      if (w.bullet = y.bullet, w.marL = y.marL ?? 0, w.indent = y.indent ?? 0, y.bullet === "char") {
        const E = Ii(y.buChar, y.buFont ?? void 0);
        E !== "•" && (w.bulletChar = E);
      } else
        y.numType && y.numType !== "arabicPeriod" && (w.numType = y.numType), y.startAt && y.startAt !== 1 && (w.startAt = y.startAt);
      y.buClr && (w.bulletColor = y.buClr), y.buSz && Math.abs(y.buSz - 1) > 1e-3 && (w.bulletScale = y.buSz);
    }
    const v = (E) => {
      const L = os(y, so(E, n)), T = (L.sz ?? 18 * An / yt) * r, A = L.color === null ? void 0 : L.color ?? Fi("tx1", n);
      return {
        text: "",
        size: T,
        bold: L.b || void 0,
        italic: L.i || void 0,
        underline: L.u || void 0,
        strike: L.strike || void 0,
        color: A ?? void 0,
        font: Ri(L.font ?? "+mn-lt", n.ctx.theme)
      };
    };
    for (const E of _(p))
      if (E.localName === "r" || E.localName === "fld") {
        const L = V(E, "t")?.textContent ?? "";
        if (!L) continue;
        L.split(/[\v\n]/).forEach((T, A) => {
          A > 0 && w.runs.push({ ...v(x(E, "rPr")), br: !0 }), T && w.runs.push({ ...v(x(E, "rPr")), text: T });
        });
      } else E.localName === "br" && w.runs.push({ ...v(x(E, "rPr")), br: !0 });
    w.endSize = v(x(p, "endParaRPr")).size;
    const S = (w.runs.length ? Math.max(...w.runs.map((E) => E.size ?? 0)) : w.endSize ?? 0) * 1.2 * (y.lnSpcPct ?? 1), $ = (E) => E ? ("px" in E ? E.px : E.lines * S) * l : 0, F = $(y.spcBef), D = $(y.spcAft);
    F > 0.05 && (w.spaceBefore = Math.round(F * 100) / 100), D > 0.05 && (w.spaceAfter = Math.round(D * 100) / 100), m.push(w);
  }
  return {
    paragraphs: m,
    anchor: h,
    insets: { l: u("lIns", 91440), t: u("tIns", 45720), r: u("rIns", 91440), b: u("bIns", 45720) },
    wrap: i.wrap !== "none",
    lineSpacing: d,
    ...c && { shrink: 1 },
    ...un(i.vert) && { vert: un(i.vert) }
  };
}
function un(t) {
  if (t === "vert" || t === "eaVert" || t === "mongolianVert") return "vert";
  if (t === "vert270") return "vert270";
  if (t === "wordArtVert" || t === "wordArtVertRtl") return "stacked";
}
const Fi = (t, e) => {
  const n = e.ctx.clrMap[t] ?? On[t] ?? t, s = e.ctx.theme.colors[n];
  return s ? { hex: s } : null;
}, ne = (t) => {
  const e = x(t, "ph");
  return e ? { type: M(e, "type") || "obj", idx: N(e, "idx") } : null;
}, pe = (t) => x(_(t).find((e) => e.localName.startsWith("nv")) ?? null, "nvPr"), ke = /* @__PURE__ */ new Set(["title", "ctrTitle"]), is = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), rs = (t, e) => t === e || ke.has(t) && ke.has(e) || !is.has(t) && !is.has(e);
function De(t, e) {
  const n = Bi(t);
  if (e.idx) {
    const s = n.find((o) => o.ph.idx === e.idx && rs(o.ph.type, e.type));
    if (s) return s.el;
  }
  return (n.find((s) => s.ph.type === e.type && (s.ph.idx === e.idx || !e.idx || ke.has(e.type))) ?? n.find((s) => s.ph.type === e.type) ?? n.find((s) => rs(s.ph.type, e.type)))?.el ?? null;
}
function Bi(t) {
  const e = [];
  for (const n of Tt(t)) {
    const s = ne(pe(n));
    s && e.push({ el: n, ph: s });
  }
  return e;
}
const oo = (t) => ke.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", Di = (t) => {
  const e = {};
  for (const n of _(x(t, "avLst"), "gd")) {
    const s = M(n, "name"), o = M(n, "fmla");
    s && o && (e[s] = o);
  }
  return e;
};
function Li(t) {
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
    return { w: N(i, "w") || void 0, h: N(i, "h") || void 0, fill: l && l !== "norm" ? l : void 0, stroke: Q(i, "stroke") === !1 ? !1 : void 0, d: r };
  });
  return {
    av: _(x(t, "avLst"), "gd").map((i) => [M(i, "name") || "", M(i, "fmla") || "val 0"]),
    gd: e(x(t, "gdLst")),
    cxn: n,
    rect: s ? [M(s, "l") || "l", M(s, "t") || "t", M(s, "r") || "r", M(s, "b") || "b"] : null,
    paths: o
  };
}
function me(t, e) {
  const n = x(t, "prstGeom");
  if (n) {
    const o = {};
    for (const [i, r] of Object.entries(Di(n))) {
      const l = /^val\s+(-?\d+(\.\d+)?)/.exec(r);
      l && (o[i] = Number(l[1]));
    }
    return { geom: { kind: "preset", prst: M(n, "prst") || "rect", adj: Object.keys(o).length ? o : void 0 } };
  }
  const s = x(t, "custGeom");
  if (s) {
    const o = Li(s);
    return { geom: { kind: "custom", paths: Fe(o, e.w, e.h) }, textRect: o.rect ? Qs(o, e.w, e.h) : void 0 };
  }
}
function ge(t, e, n, s, o, i) {
  const r = [];
  if (o > xi)
    return n.warnings.push("Groups nested too deeply; the innermost were skipped."), r;
  for (const l of Tt(t)) {
    if (++n.count > yi) {
      n.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const a = _i(l, e, n, s, o, i);
      a && r.push(...Array.isArray(a) ? a : [a]);
    } catch {
      n.warnings.push(`A ${l.localName} couldn't be read and was skipped.`);
    }
  }
  return r;
}
const ji = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function Ui(t, e, n) {
  const s = x(t, "hlinkClick");
  if (!s) return;
  const o = M(s, "action") || "", i = n.rels(e).get(M(s, "r:id") || "");
  if (o.startsWith("ppaction://hlinkshowjump")) {
    const r = ji[(/jump=([a-z]+)/i.exec(o)?.[1] ?? "").toLowerCase()];
    return r ? { kind: "action", action: r } : void 0;
  }
  if (o.startsWith("ppaction://hlinksldjump")) return i && !i.external ? { kind: "slide", key: i.target } : void 0;
  if (!o)
    return i?.external && /^(https?:|mailto:|tel:)/i.test(i.target) ? { kind: "url", url: i.target } : void 0;
}
function _i(t, e, n, s, o, i) {
  const r = _(t).find((u) => u.localName.startsWith("nv")), l = zi(t, e, n, s, o, i), a = x(r ?? null, "cNvPr"), c = l ? Ui(a, e.part, n.pkg) : void 0;
  if (c) for (const u of Array.isArray(l) ? l : [l]) u.link = c;
  if (l && !Array.isArray(l)) {
    const u = M(a, "descr")?.trim();
    u && (l.descr = u), M(ct(a, "decorative", 3), "val") === "1" && (l.decorative = !0);
  }
  return l;
}
function zi(t, e, n, s, o, i) {
  const r = { pkg: n.pkg, part: e.part, ctx: n.ctx }, l = _(t).find((h) => h.localName.startsWith("nv")), a = x(l ?? null, "cNvPr"), c = N(a, "id"), u = M(a, "name") || t.localName;
  if (M(a, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Wi(t, e, n, s, c, u, i);
    case "cxnSp": {
      const h = x(t, "spPr"), f = At(x(h, "xfrm"));
      if (!f) return null;
      const m = s(f), d = x(t, "style"), p = jt(x(h, "ln"), r) ?? En(d, r) ?? { width: 1, color: { hex: "#000000" } };
      if (!p) return null;
      const g = me(h, m) ?? { geom: { kind: "preset", prst: "line" } }, b = (y) => y ? { id: N(y, "id"), idx: N(y, "idx") } : void 0, k = x(l ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: c, name: u, ...m, geom: g.geom, line: p, start: b(x(k, "stCxn")), end: b(x(k, "endCxn")) };
    }
    case "pic": {
      const h = x(t, "spPr");
      let f = At(x(h, "xfrm"));
      const m = ne(x(l ?? null, "nvPr"));
      if (!f && m && (f = Hi(m, n)), !f) return null;
      const d = x(t, "blipFill"), p = d ? Tn(d, r) : null, g = x(d, "srcRect"), b = g ? { l: N(g, "l") / 1e5, t: N(g, "t") / 1e5, r: N(g, "r") / 1e5, b: N(g, "b") / 1e5 } : void 0, k = Oi(x(l ?? null, "nvPr"), r);
      if (k)
        return !k.file && !k.url && n.warnings.push(`${k.audio ? "Audio" : "Video"} "${u}" is linked to a file on another computer; only its picture was imported.`), !k.file && !k.url && !p ? null : { kind: "media", id: c, name: u, ...s(f), ...k, ...p ? { poster: p } : {}, crop: b };
      if (!p)
        return n.warnings.push(`Picture "${u}" has no image the importer can read.`), null;
      const y = M(V(d, "blip", "alphaModFix"), "amt"), w = s(f), v = me(h, w)?.geom, S = v && !(v.kind === "preset" && v.prst === "rect") ? v : void 0;
      return { kind: "picture", id: c, name: u, ...w, media: p, crop: b, alpha: y !== null ? Number(y) / 1e5 : void 0, geom: S, ...V(d, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const h = x(t, "grpSpPr"), f = x(h, "xfrm"), m = Ti(f, s), d = ge(t, e, n, m, o + 1, i);
      if (!d.length) return null;
      const p = Le(d);
      return { kind: "group", id: c, name: u, ...p, children: d };
    }
    case "graphicFrame":
      return qi(t, e, n, s, c, u, o);
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
function Hi(t, e) {
  const n = De(e.layout?.tree ?? null, t), s = At(V(n, "spPr", "xfrm"));
  if (s) return s;
  const o = De(e.master?.tree ?? null, { type: oo(t.type), idx: 0 });
  return At(V(o, "spPr", "xfrm"));
}
function Xi(...t) {
  for (const e of t) {
    const n = e();
    if (n !== void 0) return n;
  }
}
function Wi(t, e, n, s, o, i, r) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = pe(t), c = ne(a);
  if (c && !r) return null;
  const u = x(t, "spPr"), h = x(t, "style"), f = M(V(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", m = c && n.layout ? De(n.layout.tree, c) : null, d = c && n.master ? De(n.master.tree, { type: oo(m ? ne(pe(m))?.type ?? c.type : c.type), idx: 0 }) : null, p = m && n.layout ? { pkg: n.pkg, part: n.layout.part, ctx: n.ctx } : null, g = d && n.master ? { pkg: n.pkg, part: n.master.part, ctx: n.ctx } : null;
  let b = At(x(u, "xfrm")) ?? At(V(m, "spPr", "xfrm")) ?? At(V(d, "spPr", "xfrm"));
  if (!b) return null;
  b = s(b);
  const k = me(u, b) ?? (m ? me(x(m, "spPr"), b) : void 0) ?? (d ? me(x(d, "spPr"), b) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, w = (Q(t, "useBgFill") ? n.background?.kind === "image" ? { kind: "none" } : n.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? Lt(u, l) ?? Be(h, l) ?? (p ? Lt(x(m, "spPr"), p) : void 0) ?? (g ? Lt(x(d, "spPr"), g) : void 0) ?? (p ? Be(x(m, "style"), p) : void 0) ?? { kind: "none" }, v = Xi(
    () => jt(x(u, "ln"), l),
    () => En(h, l),
    () => p ? jt(V(m, "spPr", "ln"), p) : void 0,
    () => g ? jt(V(d, "spPr", "ln"), g) : void 0
  ) ?? null, S = [];
  if (c) {
    const I = m ? ne(pe(m))?.type ?? c.type : c.type;
    S.push(ke.has(I) ? n.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(I) ? n.masterTx.body : n.masterTx.other), S.push(V(d, "txBody", "lstStyle"), V(m, "txBody", "lstStyle"));
  } else
    S.push(n.defaultText);
  const $ = x(h, "fontRef"), F = {
    levels: S,
    bodyPr: [V(d, "txBody", "bodyPr"), V(m, "txBody", "bodyPr")],
    fontRef: $ ? { font: M($, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: it($, l.ctx) } : void 0
  }, D = Nn(x(t, "txBody"), F, l);
  if (!(w.kind !== "none" || !!v || !!D)) return null;
  let L = k.textRect;
  const T = At(x(u, "xfrm")), A = D ? At(x(t, "txXfrm")) : null;
  if (A && T && T.w > 0 && T.h > 0) {
    const I = b.w / T.w, B = b.h / T.h, C = { l: (A.x - T.x) * I, t: (A.y - T.y) * B, r: (A.x + A.w - T.x) * I, b: (A.y + A.h - T.y) * B };
    (Math.abs(C.l) > 0.5 || Math.abs(C.t) > 0.5 || Math.abs(C.r - b.w) > 0.5 || Math.abs(C.b - b.h) > 0.5) && (L = C);
  }
  return { kind: "shape", id: o, name: i, ...b, geom: k.geom, fill: w, line: v, text: D, textBox: f || void 0, textRect: L };
}
const Vi = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function Yi(t, e) {
  const n = { bdr: {} };
  if (!t) return n;
  const s = x(t, "tcStyle"), o = x(t, "tcTxStyle"), i = x(s, "fill"), r = i ? Lt(i, e) : Be(s, e);
  r && (n.fill = r);
  const l = it(o, e.ctx) ?? it(x(o, "fontRef"), e.ctx);
  l && (n.text = l), M(o, "b") === "on" && (n.bold = !0);
  const a = x(s, "tcBdr");
  for (const c of ["left", "right", "top", "bottom", "insideH", "insideV"]) {
    const u = x(a, c);
    if (!u) continue;
    const h = jt(x(u, "ln"), e) ?? En(u, e);
    h !== void 0 && (n.bdr[c] = h);
  }
  return n;
}
function Gi(t, e, n) {
  const s = ((x(t, "tableStyleId")?.textContent || "").trim() || M(n, "def") || Vi).toUpperCase(), o = (f) => Q(t, f) ?? !1, i = { firstRow: o("firstRow"), lastRow: o("lastRow"), firstCol: o("firstCol"), lastCol: o("lastCol"), bandRow: o("bandRow"), bandCol: o("bandCol") };
  let r = _(n, "tblStyle").find((f) => (M(f, "styleId") || "").toUpperCase() === s);
  if (!r) {
    const f = ui(s);
    r = f ? x(e.pkg.parse(f), "tblStyle") ?? void 0 : void 0;
  }
  if (!r) return null;
  const l = (f) => Yi(x(r, f), e), a = x(r, "tblBg"), c = a ? x(a, "fill") ? Lt(x(a, "fill"), e) : Be(a, e) : void 0, u = {
    whole: l("wholeTbl"),
    b1H: l("band1H"),
    b2H: l("band2H"),
    b1V: l("band1V"),
    b2V: l("band2V"),
    firstRow: l("firstRow"),
    lastRow: l("lastRow"),
    firstCol: l("firstCol"),
    lastCol: l("lastCol")
  }, h = (f, m, d, p) => {
    const g = [0, d - 1, 0, p - 1], b = [f, f, 0, p - 1], k = [0, d - 1, m, m], y = [[u.whole, g]], w = f - (i.firstRow ? 1 : 0), v = m - (i.firstCol ? 1 : 0), S = (!i.firstRow || f > 0) && (!i.lastRow || f < d - 1), $ = (!i.firstCol || m > 0) && (!i.lastCol || m < p - 1);
    i.bandCol && v >= 0 && $ && y.push([v % 2 === 0 ? u.b1V : u.b2V, k]), i.bandRow && w >= 0 && S && y.push([w % 2 === 0 ? u.b1H : u.b2H, b]), i.firstCol && m === 0 && y.push([u.firstCol, k]), i.lastCol && m === p - 1 && y.push([u.lastCol, k]), i.firstRow && f === 0 && y.push([u.firstRow, b]), i.lastRow && f === d - 1 && y.push([u.lastRow, b]);
    const F = { edges: {} };
    for (const [D, [E, L, T, A]] of y) {
      D.fill && (F.fill = D.fill), D.text && (F.text = D.text), D.bold && (F.bold = !0);
      const I = (C, P, O) => O ? D.bdr[C] : D.bdr[P], B = {
        t: I("top", "insideH", f === E),
        b: I("bottom", "insideH", f === L),
        l: I("left", "insideV", m === T),
        r: I("right", "insideV", m === A)
      };
      for (const C of ["t", "b", "l", "r"]) B[C] !== void 0 && (F.edges[C] = B[C]);
    }
    return F;
  };
  return c && c.kind !== "none" && (h.background = c), h;
}
function ls(t, e) {
  if (!t) return 0;
  const n = Math.max(8, e - t.insets.l - t.insets.r);
  if (t.vert) {
    const o = (l) => Math.max(0, ...l.runs.filter((a) => !a.br && a.text).map((a) => a.size ?? t.defaults?.size ?? 0)) || 18, i = (l) => o(l) * 1.2 * (t.lineSpacing ?? 1);
    let r = 0;
    if (t.vert === "stacked")
      for (const l of t.paragraphs) r = Math.max(r, l.runs.reduce((a, c) => a + c.text.length, 0) * i(l));
    else {
      const l = Math.max(1, Math.floor(n / Math.max(...t.paragraphs.map(i), 1)));
      r = t.paragraphs.reduce((c, u) => c + u.runs.reduce((h, f) => h + f.text.length, 0) * o(u) * 0.5, 0) / Math.max(1, l - t.paragraphs.length + 1) * 1.15;
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
function qi(t, e, n, s, o, i, r = 0) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = At(x(t, "xfrm"));
  if (!a) return null;
  const c = V(t, "graphic", "graphicData"), u = x(c, "tbl");
  if (u) {
    const d = _(x(u, "tblGrid"), "gridCol").map((B) => tt(N(B, "w"))), p = Gi(x(u, "tblPr"), l, n.tableStyles), g = [], b = [];
    let k = 1e6 + o * 1e3;
    const y = _(u, "tr"), w = y.map((B, C) => {
      const P = [];
      let O = 0, R = 0;
      for (const U of _(B, "tc")) {
        const G = Math.max(1, N(U, "gridSpan", 1));
        !Q(U, "hMerge") && O < R && (O = R);
        const W = O, X = d.slice(W, W + G).reduce((Z, lt) => Z + lt, 0);
        if (O += 1, Q(U, "hMerge") || (R = W + G), Q(U, "hMerge") || Q(U, "vMerge")) {
          P.push({
            covered: { h: Q(U, "hMerge") || void 0, v: Q(U, "vMerge") || void 0 },
            span: G,
            rowSpan: 1,
            col: W,
            w: X,
            fill: { kind: "none" },
            border: null,
            sides: { l: null, r: null, t: null, b: null }
          });
          continue;
        }
        const z = x(U, "tcPr"), st = p ? p(C, W, y.length, d.length) : null, ft = st?.text ? { color: st.text } : void 0, J = Nn(x(U, "txBody"), { levels: [n.defaultText], bodyPr: [], fontRef: ft }, l);
        if (J && st?.bold && J.paragraphs.forEach((Z) => Z.runs.forEach((lt) => {
          lt.bold === void 0 && (lt.bold = !0);
        })), J) {
          J.insets = { l: tt(N(z, "marL", 91440)), r: tt(N(z, "marR", 91440)), t: tt(N(z, "marT", 45720)), b: tt(N(z, "marB", 45720)) }, J.anchor = M(z, "anchor") === "ctr" ? "ctr" : M(z, "anchor") === "b" ? "b" : "t";
          const Z = un(M(z, "vert"));
          Z ? J.vert = Z : delete J.vert;
        }
        const gt = Lt(z, l) ?? st?.fill ?? { kind: "none" }, dt = (Z, lt) => {
          const Ae = jt(x(z, Z), l);
          return Ae !== void 0 ? Ae : st ? st.edges[lt] ?? null : { width: 1, color: { hex: "#bfbfbf" } };
        }, pt = { l: dt("lnL", "l"), r: dt("lnR", "r"), t: dt("lnT", "t"), b: dt("lnB", "b") }, Pe = (Z, lt) => !Z && !lt || !!Z && !!lt && Z.width === lt.width && Z.color.hex === lt.color.hex && (Z.color.alpha ?? 1) === (lt.color.alpha ?? 1) && Z.dash === lt.dash, le = [pt.r, pt.t, pt.b].every((Z) => Pe(Z, pt.l)) ? pt.l : null;
        P.push({
          span: G,
          rowSpan: Math.max(1, N(U, "rowSpan", 1)),
          col: W,
          w: X,
          text: J,
          fill: gt,
          border: le,
          sides: pt,
          ...le === null && Object.values(pt).some(Boolean) && { split: !0 }
        });
      }
      return P;
    }), v = (B, C) => B < C * 0.7 ? C : B, S = y.map((B, C) => v(
      tt(N(B, "h")),
      Math.max(0, ...w[C].filter((P) => !P.covered && P.rowSpan === 1).map((P) => ls(P.text, P.w)))
    ));
    w.forEach((B, C) => B.forEach((P) => {
      if (P.covered || P.rowSpan < 2) return;
      const O = Math.min(y.length, C + P.rowSpan) - 1, R = S.slice(C, O + 1).reduce((G, W) => G + W, 0), U = ls(P.text, P.w);
      v(R, U) > R && (S[O] += U - R);
    }));
    let $ = a.y;
    const F = [], D = /* @__PURE__ */ new Set();
    if (w.forEach((B, C) => {
      const P = [];
      b.push({ h: S[C], cells: P });
      for (const O of B) {
        if (O.covered) {
          P.push({ fill: O.fill, borders: O.sides, hMerge: O.covered.h, vMerge: O.covered.v });
          continue;
        }
        const R = a.x + d.slice(0, O.col).reduce((G, W) => G + W, 0), U = S.slice(C, C + O.rowSpan).reduce((G, W) => G + W, 0);
        if (g.push({
          kind: "shape",
          id: k++,
          name: `${i} cell`,
          ...s({ x: R, y: $, w: O.w, h: U, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: O.fill,
          line: O.border,
          text: O.text
        }), O.split) {
          const G = (W, X, z, st, ft) => {
            if (!ft) return;
            const J = [W, X, z, st].map((gt) => Math.round(gt * 10)).join(",");
            D.has(J) || (D.add(J), F.push({
              kind: "connector",
              id: k++,
              name: `${i} rule`,
              ...s({ x: W, y: X, w: z - W, h: st - X, rot: 0, flipH: !1, flipV: !1 }),
              geom: { kind: "preset", prst: "line" },
              line: ft
            }));
          };
          G(R, $, R + O.w, $, O.sides.t), G(R, $ + U, R + O.w, $ + U, O.sides.b), G(R, $, R, $ + U, O.sides.l), G(R + O.w, $, R + O.w, $ + U, O.sides.r);
        }
        P.push({
          text: O.text ?? void 0,
          fill: O.fill,
          borders: O.sides,
          gridSpan: O.span > 1 ? O.span : void 0,
          rowSpan: O.rowSpan > 1 ? O.rowSpan : void 0
        });
      }
      $ += S[C];
    }), !g.length) return null;
    if (g.push(...F), p?.background) {
      const B = Le(g);
      g.unshift({
        kind: "shape",
        id: k++,
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
    const E = { kind: "group", id: o, name: i, ...Le(g), children: g }, L = s({ ...a, w: d.reduce((B, C) => B + C, 0), h: b.reduce((B, C) => B + C.h, 0) });
    if (p?.background || L.rot || L.flipH || L.flipV || b.some((B) => B.cells.length !== d.length)) return E;
    const T = L.w / Math.max(1e-6, d.reduce((B, C) => B + C, 0)), A = L.h / Math.max(1e-6, b.reduce((B, C) => B + C.h, 0)), I = (B) => Q(x(u, "tblPr"), B) ?? !1;
    return {
      kind: "table",
      id: o,
      name: i,
      x: L.x,
      y: L.y,
      w: L.w,
      h: L.h,
      cols: d.map((B) => B * T),
      rows: b.map((B) => ({ ...B, h: B.h * A })),
      firstRow: I("firstRow") || void 0,
      bandRow: I("bandRow") || void 0,
      fallback: E
    };
  }
  const h = M(c, "uri") || "";
  if (/diagram/.test(h)) {
    const d = Qi(c, e, n, s, a, o, i, r);
    if (d) return d;
    const p = tr(c, e, n, s, a, o, i, l);
    if (p) return p;
  }
  if (/drawingml\/2006\/chart$/.test(h)) {
    const d = Ji(c, e, n);
    if (d) return { kind: "chart", id: o, name: i, ...s(a), chart: d };
  }
  const f = Zi(c, l, n);
  if (f) return f(o, i, s(a));
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
function Zi(t, e, n) {
  const s = ct(t, "oleObj", 3), o = M(t, "uri") || "";
  if (!s && /chart|diagram/.test(o)) return null;
  const i = s ? x(s, "pic") : null, r = i ? x(i, "blipFill") : ct(t, "blip", 8)?.parentElement ?? null;
  let l = r ? Tn(r, e) : null;
  if (!l && s && (l = Ki(e, M(s, "spid"))), !l) return null;
  const a = s ? M(s, "progId") || M(s, "name") || "Object" : o.split("/").pop() || "Object";
  n.warnings.push(`Embedded object "${a}" was imported as its preview picture; the object itself can't be edited in Yappy.`);
  const c = i ? x(i, "spPr") : null, u = c ? Lt(c, e) : void 0, h = c ? jt(x(c, "ln"), e) : void 0, f = r ? x(r, "srcRect") : null, m = f ? { l: N(f, "l") / 1e5, t: N(f, "t") / 1e5, r: N(f, "r") / 1e5, b: N(f, "b") / 1e5 } : void 0;
  return (d, p, g) => {
    const b = { kind: "picture", id: d, name: p, ...g, media: l, crop: m };
    if ((!u || u.kind === "none") && !h) return b;
    const k = { x: g.x, y: g.y, w: g.w, h: g.h }, y = {
      kind: "shape",
      id: 2e6 + d,
      name: `${p} frame`,
      ...k,
      geom: { kind: "preset", prst: "rect" },
      fill: u ?? { kind: "none" },
      line: h ?? null
    };
    return { kind: "group", id: d, name: p, ...g, children: [y, { ...b, id: 21e5 + d, ...k }] };
  };
}
function Ki(t, e) {
  if (!e) return null;
  for (const n of t.pkg.rels(t.part).values()) {
    if (n.type !== "vmlDrawing" && n.type !== "legacyDrawing" || n.external) continue;
    const s = t.pkg.xml(n.target);
    if (s)
      for (const o of Array.from(s.getElementsByTagName("*"))) {
        if (o.localName !== "shape" || M(o, "id") !== e) continue;
        const i = Array.from(o.getElementsByTagName("*")).find((a) => a.localName === "imagedata"), r = M(i, "o:relid") || M(i, "r:id"), l = r ? t.pkg.rels(n.target).get(r) : void 0;
        return !l || l.external ? null : eo(t.pkg, l.target);
      }
  }
  return null;
}
const as = {
  barChart: "column",
  bar3DChart: "column",
  lineChart: "line",
  line3DChart: "line",
  areaChart: "area",
  area3DChart: "area",
  pieChart: "pie",
  pie3DChart: "pie",
  ofPieChart: "pie",
  doughnutChart: "doughnut"
};
function Ji(t, e, n) {
  const s = ct(t, "chart", 2), o = s ? n.pkg.rels(e.part).get(M(s, "r:id") || "") : void 0, i = o && !o.external ? n.pkg.xml(o.target) : null, r = x(i, "chart"), l = x(r, "plotArea");
  if (!l) return null;
  const a = Tt(l).find((A) => as[A.localName]);
  if (!a) return null;
  Tt(l).filter((A) => /Chart$/.test(A.localName)).length > 1 && n.warnings.push("A combination chart came in as its first chart type only.");
  let u = as[a.localName];
  u === "column" && M(x(a, "barDir"), "val") === "bar" && (u = "bar");
  const h = M(x(a, "grouping"), "val") || "";
  h === "percentStacked" && n.warnings.push("A 100% stacked chart came in as a stacked chart.");
  let f = n.ctx;
  const m = n.pkg.relOfType(o.target, "themeOverride"), d = m ? x(n.pkg.xml(m), "clrScheme") : null;
  if (d) {
    const A = { ...f.theme.colors, ...to(d) };
    f = { ...f, theme: { ...f.theme, colors: A } };
  }
  const p = x(i, "clrMapOvr");
  if (p && p.attributes.length) {
    const A = { ...f.clrMap };
    for (let I = 0; I < p.attributes.length; I++) A[p.attributes[I].localName ?? p.attributes[I].name] = p.attributes[I].value;
    f = { ...f, clrMap: A };
  }
  const g = (A, I) => {
    const B = ct(A, "strCache", 3) ?? ct(A, "numCache", 3) ?? ct(A, "strLit", 2) ?? ct(A, "numLit", 2) ?? x(ct(A, "multiLvlStrCache", 3), "lvl");
    if (!B) return [];
    const C = Math.min(1e4, N(x(B, "ptCount"), "val")), P = new Array(Math.max(0, C)).fill("");
    for (const O of _(B, "pt")) {
      const R = N(O, "idx");
      R >= 0 && R < 1e4 && (P[R] = x(O, "v")?.textContent ?? "");
    }
    return P;
  }, b = _(a, "ser").slice(0, 64);
  if (!b.length) return null;
  const k = g(x(b[0], "cat")), y = b.map((A, I) => {
    const C = g(x(A, "val")).map((U) => U === "" ? null : Number.isFinite(Number(U)) ? Number(U) : null), P = g(x(A, "tx"))[0] || x(A, "tx")?.textContent?.trim() || `Series ${I + 1}`, O = x(A, "spPr"), R = it(x(O, "solidFill"), f) ?? it(x(x(O, "ln"), "solidFill"), f);
    return { name: P, values: C, ...R && { color: R.hex } };
  }), w = Math.max(k.length, ...y.map((A) => A.values.length));
  for (; k.length < w; ) k.push(String(k.length + 1));
  const v = x(r, "title"), S = v ? je(v, "t", 8).map((A) => A.textContent ?? "").join("").trim() || (y.length === 1 ? y[0].name : "") : "", $ = M(V(r, "legend", "legendPos"), "val"), F = x(l, "valAx"), D = x(F, "scaling"), E = (A) => {
    const I = x(A, "dLbls");
    return !!I && (M(x(I, "showVal"), "val") === "1" || M(x(I, "showPercent"), "val") === "1");
  }, L = M(x(D, "max"), "val"), T = M(x(D, "min"), "val");
  return {
    kind: u,
    categories: k,
    series: y,
    ...S && { title: S },
    ...(h === "stacked" || h === "percentStacked") && { stacked: !0 },
    legend: x(r, "legend") ? $ === "b" ? "bottom" : $ === "t" ? "top" : "right" : "none",
    ...(E(a) || b.some(E)) && { dataLabels: !0 },
    gridlines: !!x(F, "majorGridlines"),
    ...L !== null && Number.isFinite(Number(L)) && { yMax: Number(L) },
    ...T !== null && Number.isFinite(Number(T)) && { yMin: Number(T) }
  };
}
function Qi(t, e, n, s, o, i, r, l) {
  const a = n.pkg.rels(e.part), c = M(x(t, "relIds"), "r:dm"), u = c ? a.get(c) : void 0;
  let h;
  if (u && !u.external) {
    const b = ct(n.pkg.xml(u.target), "dataModelExt", 6), k = b ? a.get(M(b, "relId") || "") : void 0;
    k && !k.external && (h = k.target);
  }
  if (!h) {
    const b = [...a.values()].filter((k) => k.type === "diagramDrawing" && !k.external);
    b.length === 1 && (h = b[0].target);
  }
  if (!h) return null;
  const f = x(n.pkg.xml(h), "spTree");
  if (!f) return null;
  const d = ge(f, { part: h, tree: f }, n, (b) => s({ ...b, x: b.x + o.x, y: b.y + o.y }), l + 1, !0);
  if (!d.length) return null;
  let p = 2e6 + i * 1e3;
  const g = (b) => b.forEach((k) => {
    k.id = p++, k.kind === "group" && g(k.children);
  });
  return g(d), { kind: "group", id: i, name: r, ...Le(d), children: d };
}
function tr(t, e, n, s, o, i, r, l) {
  const a = M(x(t, "relIds"), "r:dm"), c = a ? n.pkg.rels(e.part).get(a) : void 0;
  if (!c || c.external) return null;
  const u = n.pkg.xml(c.target), h = /* @__PURE__ */ new Map();
  for (const b of _(x(u, "ptLst"), "pt")) h.set(M(b, "modelId") || "", b);
  const f = /* @__PURE__ */ new Map();
  for (const b of _(x(u, "cxnLst"), "cxn")) {
    if ((M(b, "type") || "parOf") !== "parOf") continue;
    const k = M(b, "srcId") || "", y = M(b, "destId") || "";
    f.has(k) || f.set(k, []), f.get(k).push({ id: y, ord: N(b, "srcOrd") });
  }
  const m = [...h.values()].find((b) => M(b, "type") === "doc");
  if (!m) return null;
  const d = [], p = /* @__PURE__ */ new Set(), g = (b, k) => {
    if (!(p.has(b) || k > 16 || d.length > 500)) {
      p.add(b);
      for (const y of (f.get(b) ?? []).sort((w, v) => w.ord - v.ord)) {
        const w = h.get(y.id), v = M(w, "type") || "node";
        if (!w || v !== "node" && v !== "asst") continue;
        const S = Nn(x(w, "t"), { levels: [n.defaultText], bodyPr: [] }, l);
        for (const $ of S?.paragraphs ?? [])
          $.runs.some((F) => !F.br && F.text.trim()) && d.push({
            ...$,
            align: "l",
            level: k,
            ...k > 0 ? { bullet: "char" } : {},
            runs: $.runs.map((F) => ({ ...F, size: F.size ?? (k > 0 ? 16 : 18), bold: F.bold ?? (k === 0 ? !0 : void 0) }))
          });
        g(y.id, k + 1);
      }
    }
  };
  return g(M(m, "modelId") || "", 0), d.length ? (n.warnings.push(`SmartArt diagram "${r}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: i,
    name: r,
    ...s(o),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: d, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function ct(t, e, n) {
  if (!t || n < 0) return null;
  for (const s of Tt(t)) {
    if (s.localName === e) return s;
    const o = ct(s, e, n - 1);
    if (o) return o;
  }
  return null;
}
function qe(t, e) {
  const n = x(t, "bg");
  if (!n) return;
  const s = x(n, "bgPr");
  if (s)
    return Lt(s, e);
  const o = x(n, "bgRef");
  if (o) {
    const i = N(o, "idx"), l = (i >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[i >= 1001 ? i - 1001 : i - 1];
    return (l ? $n(l, { ...e, ctx: { ...e.ctx, phClr: it(o, e.ctx) ?? void 0 } }) : void 0) ?? (it(o, e.ctx) ? { kind: "solid", color: it(o, e.ctx) } : void 0);
  }
}
function er(t, e) {
  const n = t.relOfType(e, "notesSlide"), s = n ? V(t.xml(n), "cSld", "spTree") : null;
  if (!s) return;
  const o = [], i = (l) => {
    for (const a of Tt(l)) {
      if (a.localName === "grpSp") {
        i(a);
        continue;
      }
      if (a.localName !== "sp") continue;
      const c = ne(pe(a));
      if (!(!c || c.type !== "body" && c.type !== "obj"))
        for (const u of _(x(a, "txBody"), "p")) {
          let h = "";
          for (const f of _(u))
            f.localName === "r" || f.localName === "fld" ? h += x(f, "t")?.textContent ?? "" : f.localName === "br" && (h += `
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
function nr(t) {
  for (const l of _(t, "AlternateContent"))
    for (const a of _(l, "Choice")) {
      const c = x(a, "transition");
      if (c && x(c, "morph")) {
        const u = M(c, "spd");
        return { kind: "morph", durationMs: M(c, "p14:dur") !== null ? N(c, "p14:dur") : u === "fast" ? 500 : u === "slow" ? 1e3 : 750 };
      }
    }
  const e = Tt(t).find((l) => l.localName === "transition");
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
function sr(t, e) {
  const n = V(t, "timing", "tnLst");
  if (!n) return [];
  const s = [];
  let o = 0;
  const i = [], r = (l, a) => {
    if (!(a > 40))
      for (const c of Tt(l)) {
        if (c.localName === "seq") {
          const u = x(c, "cTn"), h = M(u, "nodeType");
          if (h && h !== "mainSeq") {
            or(u) || o++;
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
    const c = N(l, "presetID"), u = N(l, "presetSubtype"), h = M(l, "nodeType"), f = h === "clickEffect" ? "click" : h === "afterEffect" ? "after" : "with", m = Number(M(V(l, "stCondLst", "cond"), "delay")), d = je(x(l, "childTnLst"), "cBhvr", 4), p = d.map(($) => ct($, "spTgt", 2)).find(Boolean), g = p ? N(p, "spid") : NaN;
    if (!Number.isFinite(g) || ct(p, "txEl", 1)) {
      o++;
      continue;
    }
    const b = d.map(($) => Number(M(x($, "cTn"), "dur"))).filter(($) => Number.isFinite($) && $ > 1), k = b.length ? Math.max(...b) : 500, { effect: y, known: w } = Go(a, c);
    w || e(`An animation PowerPoint calls preset ${c} (${a}) came in as a plain ${y}.`);
    const v = je(x(l, "childTnLst"), "animRot", 2)[0], S = M(l, "repeatCount");
    s.push({
      target: g,
      cls: a,
      effect: y,
      presetId: c,
      subtype: u,
      start: f,
      durationMs: k,
      delayMs: Number.isFinite(m) ? Math.max(0, m) : 0,
      ...Gn(u) && (y === "fly" || y === "wipe") && { dir: Gn(u) },
      ...y === "spin" && v && { degrees: N(v, "by") / 6e4 },
      ...S === "indefinite" ? { repeat: -1 } : S && Number(S) > 1e3 ? { repeat: Math.round(Number(S) / 1e3) } : {}
    });
  }
  return o && e(`${o} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), s;
}
function or(t) {
  const e = Ht(t, "cTn", 12).filter((n) => M(n, "presetClass"));
  return e.length > 0 && e.every((n) => M(n, "presetClass") === "mediacall");
}
function ir(t, e) {
  const n = V(t, "timing", "tnLst");
  if (!n) return;
  const s = /* @__PURE__ */ new Map(), o = (l) => l.forEach((a) => {
    a.kind === "media" ? s.set(a.id, a) : a.kind === "group" && o(a.children);
  });
  if (o(e), !s.size) return;
  const i = (l) => {
    const a = ct(l, "spTgt", 6);
    return a ? N(a, "spid", NaN) : NaN;
  };
  for (const l of [...Ht(n, "video", 12), ...Ht(n, "audio", 12)]) {
    const a = x(l, "cMediaNode"), c = s.get(i(x(a, "tgtEl")));
    if (!a || !c) continue;
    const u = M(a, "vol");
    (Q(a, "mute") || u !== null && Number(u) === 0) && (c.muted = !0), M(x(a, "cTn"), "repeatCount") === "indefinite" && (c.loop = !0);
  }
  const r = Ht(n, "cTn", 8).find((l) => M(l, "nodeType") === "mainSeq");
  if (r)
    for (const l of Ht(r, "cTn", 40).filter((a) => M(a, "presetClass"))) {
      if (M(l, "nodeType") === "clickEffect") break;
      if (M(l, "presetClass") !== "mediacall") continue;
      const a = Ht(l, "cmd", 3)[0];
      if (!/^playFrom/.test(M(a, "cmd") || "")) continue;
      const c = s.get(i(a));
      c && (c.autoplay = !0);
    }
}
function Ht(t, e, n) {
  if (!t || n < 0) return [];
  const s = [];
  for (const o of Tt(t))
    o.localName === e && s.push(o), s.push(...Ht(o, e, n - 1));
  return s;
}
function je(t, e, n) {
  if (!t || n < 0) return [];
  const s = [];
  for (const o of Tt(t))
    o.localName === e ? s.push(o) : s.push(...je(o, e, n - 1));
  return s;
}
function cs(t) {
  const e = Tt(t).find((o) => o.localName === "transition"), n = e ? M(e, "advTm") : null, s = n !== null ? Number(n) : NaN;
  return Number.isFinite(s) && s > 0 ? s : void 0;
}
function rr(t, e) {
  const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  for (const i of _(x(t, "sldIdLst"), "sldId")) {
    const r = e.get(M(i, "r:id") || ""), l = M(i, "id");
    r && l && s.set(l, r.target);
  }
  const o = ct(x(t, "extLst"), "sectionLst", 4);
  for (const i of _(o, "section")) {
    const r = (M(i, "name") || "").trim(), l = _(x(i, "sldIdLst"), "sldId")[0], a = l ? s.get(M(l, "id") || "") : void 0;
    r && a && !n.has(a) && n.set(a, r);
  }
  return n;
}
function lr(t, e = {}) {
  const n = [], s = (T) => {
    n.length < 200 && !n.includes(T) && n.push(T);
  }, o = e.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let i, r = 0, l = 0;
  try {
    i = Ho(t, {
      filter: (T) => (r++, l += T.originalSize, r <= Jn && T.originalSize <= gi && l <= Qn)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (r > Jn || l > Qn) && s("The file is very large; some parts were skipped.");
  const a = new Mi(i, o, s), c = a.relOfType("", "officeDocument") ?? "ppt/presentation.xml", u = a.xml(c);
  if (!u || u.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const h = x(u, "sldSz"), f = h ? Math.max(1, tt(N(h, "cx", 9144e3))) : 960, m = h ? Math.max(1, tt(N(h, "cy", 5143500))) : 540, d = x(u, "defaultTextStyle"), p = a.rels(c), g = a.relOfType(c, "tableStyles"), b = g ? a.xml(g) : null, k = [], y = /* @__PURE__ */ new Set();
  for (const T of _(x(u, "sldIdLst"), "sldId")) {
    const A = p.get(M(T, "r:id") || "");
    A && !y.has(A.target) && k.length < bi && (y.add(A.target), k.push(A.target));
  }
  const w = /* @__PURE__ */ new Map(), v = (T) => {
    const A = a.relOfType(T, "theme");
    return A ? (w.has(A) || w.set(A, We(a.xml(A))), w.get(A)) : We(null);
  }, S = (T) => {
    if (!T) return null;
    const A = {};
    for (let I = 0; I < T.attributes.length; I++) A[T.attributes[I].localName ?? T.attributes[I].name] = T.attributes[I].value;
    return A;
  }, $ = rr(u, p), F = [];
  k.forEach((T, A) => {
    const I = a.xml(T);
    if (!I) {
      s(`Slide ${A + 1} couldn't be read and was skipped.`);
      return;
    }
    const B = a.relOfType(T, "slideLayout"), C = B ? a.xml(B) : null, P = B ? a.relOfType(B, "slideMaster") : null, O = P ? a.xml(P) : null, R = P ? v(P) : We(null), U = S(V(I, "clrMapOvr", "overrideClrMapping")) ?? S(V(C, "clrMapOvr", "overrideClrMapping")) ?? S(x(O, "clrMap")) ?? On, G = { theme: R, clrMap: U }, W = x(O, "txStyles"), X = {
      pkg: a,
      ctx: G,
      slide: { part: T, tree: V(I, "cSld", "spTree") },
      layout: B ? { part: B, tree: V(C, "cSld", "spTree") } : null,
      master: P ? { part: P, tree: V(O, "cSld", "spTree") } : null,
      masterTx: { title: x(W, "titleStyle"), body: x(W, "bodyStyle"), other: x(W, "otherStyle") },
      defaultText: d,
      warnings: n,
      count: 0,
      tableStyles: b
    }, z = (pt) => ({ pkg: a, part: pt?.part ?? T, ctx: G }), st = qe(x(I, "cSld"), z(X.slide)) ?? qe(x(C, "cSld"), z(X.layout)) ?? qe(x(O, "cSld"), z(X.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    X.background = st;
    const ft = [], J = Q(I, "showMasterSp") !== !1 && Q(C, "showMasterSp") !== !1;
    X.master && J && ft.push(...ge(X.master.tree, X.master, X, Ge, 0, !1)), X.layout && Q(I, "showMasterSp") !== !1 && ft.push(...ge(X.layout.tree, X.layout, X, Ge, 0, !1));
    const gt = ge(X.slide.tree, X.slide, X, Ge, 0, !0);
    ir(I, gt), ft.push(...gt), F.push({
      items: ft,
      background: st,
      transition: nr(I),
      name: M(x(I, "cSld"), "name") || void 0,
      notes: er(a, T),
      key: T,
      ...M(I, "show") === "0" && { hidden: !0 },
      ...cs(I) && { advanceAfterMs: cs(I) },
      ...$.has(T) && { section: $.get(T) }
    });
    const dt = sr(I, s);
    dt.length && (F[F.length - 1].anims = dt);
  }), F.length || s("The presentation has no slides.");
  const D = V(a.xml("docProps/core.xml"), "title")?.textContent || void 0, E = a.relOfType(c, "presProps"), L = M(x(E ? a.xml(E) : null, "showPr"), "loop");
  return { deck: { width: f, height: m, slides: F, title: D, ...(L === "1" || L === "true") && { loop: !0 } }, warnings: n };
}
class io extends Error {
  constructor() {
    super("short read");
  }
}
class Gt {
  b;
  view;
  constructor(e) {
    this.b = e, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
  }
  get length() {
    return this.b.length;
  }
  need(e, n) {
    if (!Number.isInteger(e) || e < 0 || n < 0 || e + n > this.b.length) throw new io();
    return e;
  }
  /** `len` bytes at `off`. */
  slice(e, n) {
    return this.need(e, n), this.b.subarray(e, e + n);
  }
  /** Everything from `off`. */
  tail(e) {
    return this.need(e, 0), new Gt(this.b.subarray(e));
  }
  sub(e, n) {
    return new Gt(this.slice(e, n));
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
function ht(t) {
  try {
    return t();
  } catch (e) {
    if (e instanceof io) return;
    throw e;
  }
}
const q = (t) => ({ k: "M", p: t }), et = (t) => ({ k: "L", p: t }), kt = (t, e, n) => ({ k: "C", a: t, b: e, p: n }), rt = { k: "Z" }, hn = Math.PI * 2, zt = Math.PI / 2;
function Ut(t, e) {
  const n = t % e;
  return n < 0 ? n + Math.abs(e) : n;
}
function wt(t, e, n, s) {
  return [q([t, e]), et([n, e]), et([n, s]), et([t, s]), rt];
}
function ro(t, e, n, s, o, i) {
  const r = Math.min(t, n), l = Math.max(t, n), a = Math.min(e, s), c = Math.max(e, s), u = Math.min(Math.abs(o / 2), (l - r) / 2), h = Math.min(Math.abs(i / 2), (c - a) / 2);
  return [
    q([r + u, a]),
    et([l - u, a]),
    ...Xt(l - u, a + h, u, h, -zt, zt),
    et([l, c - h]),
    ...Xt(l - u, c - h, u, h, 0, zt),
    et([r + u, c]),
    ...Xt(r + u, c - h, u, h, zt, zt),
    et([r, a + h]),
    ...Xt(r + u, a + h, u, h, Math.PI, zt),
    rt
  ];
}
function lo(t, e, n, s) {
  const [o, i, r, l] = co(t, e, n, s);
  return [q([o + r, i]), ...Xt(o, i, r, l, 0, hn), rt];
}
function ao(t, e, n, s, o, i, r, l = !1) {
  const [a, c, u, h] = co(t, e, n, s), f = (y) => Math.atan2((y[1] - c) / Math.max(h, Number.MIN_VALUE), (y[0] - a) / Math.max(u, Number.MIN_VALUE)), m = f(o), d = f(i);
  let p = Ut(l ? d - m : m - d, hn);
  p < 1e-12 && (p = hn);
  const g = l ? p : -p, b = [a + u * Math.cos(m), c + h * Math.sin(m)], k = r === "pie" ? [q([a, c]), et(b)] : [q(b)];
  return k.push(...Xt(a, c, u, h, m, g)), r === "chord" ? k.push(rt) : r === "pie" && k.push(et([a, c]), rt), k;
}
function co(t, e, n, s) {
  return [(t + n) / 2, (e + s) / 2, Math.abs(n - t) / 2, Math.abs(s - e) / 2];
}
function Xt(t, e, n, s, o, i) {
  const r = Math.min(8, Math.max(1, Math.ceil(Math.abs(i) / zt))), l = i / r, a = 4 / 3 * Math.tan(l / 4), c = (h) => [t + n * Math.cos(h), e + s * Math.sin(h)], u = [];
  for (let h = 0; h < r; h++) {
    const f = o + l * h, m = f + l, d = c(f), p = c(m), g = [d[0] - a * n * Math.sin(f), d[1] + a * s * Math.cos(f)], b = [p[0] + a * n * Math.sin(m), p[1] - a * s * Math.cos(m)];
    u.push(kt(g, b, p));
  }
  return u;
}
function fn(t, e, n) {
  const s = [];
  let o = 0;
  for (const i of e) {
    const r = Math.min(o + i, t.length);
    if (r > o) {
      s.push(q(t[o]));
      for (let l = o + 1; l < r; l++) s.push(et(t[l]));
      n && s.push(rt);
    }
    o = r;
  }
  return s;
}
const qt = 64, uo = 1, ar = 2, cr = 3, ur = 4, ho = 5;
function Ot(t) {
  const [e, n, s, o] = t;
  if (![e, n, s, o].every(Number.isFinite)) return null;
  const i = Math.min(e, s), r = Math.max(e, s), l = Math.min(n, o), a = Math.max(n, o);
  return r - i > 1e-6 && a - l > 1e-6 ? [i, l, r, a] : null;
}
function In(t, e) {
  const n = Math.max(t[0], e[0]), s = Math.max(t[1], e[1]), o = Math.min(t[2], e[2]), i = Math.min(t[3], e[3]);
  return o - n > 1e-6 && i - s > 1e-6 && [n, s, o, i].every(Number.isFinite) ? [n, s, o, i] : null;
}
function hr(t, e) {
  const n = In(t, e);
  if (!n) return [t];
  const s = [], o = (i) => {
    i && s.push(i);
  };
  return n[1] > t[1] && o(Ot([t[0], t[1], t[2], n[1]])), n[3] < t[3] && o(Ot([t[0], n[3], t[2], t[3]])), n[0] > t[0] && o(Ot([t[0], n[1], n[0], n[3]])), n[2] < t[2] && o(Ot([n[2], n[1], t[2], n[3]])), s;
}
const dn = (t) => t.slice(0, qt);
function ee(t, e) {
  let n = t;
  for (const s of e) {
    const o = [];
    for (const i of n)
      for (const r of hr(i, s)) {
        if (o.length >= qt) return o;
        o.push(r);
      }
    n = o;
  }
  return n;
}
function fr(t, e) {
  const n = Ot(e);
  return n ? t === null ? [n] : dn(t.map((s) => In(s, n)).filter((s) => s !== null)) : [];
}
function dr(t, e, n) {
  const s = Ot(e);
  if (!s) return t;
  if (t !== null) return ee(t, [s]);
  const o = n && Ot(n);
  return o ? ee([o], [s]) : null;
}
function pr(t, e, n, s) {
  const o = dn(e.map(Ot).filter((i) => i !== null));
  switch (n) {
    case ho:
      return o;
    case uo: {
      if (t === null) return o;
      const i = [];
      for (const r of t)
        for (const l of o) {
          if (i.length >= qt) return i;
          const a = In(r, l);
          a && i.push(a);
        }
      return i;
    }
    case ar:
      return t === null ? null : dn([...t, ...o]);
    case ur: {
      if (t !== null) return ee(t, o);
      const i = s && Ot(s);
      return i ? ee([i], o) : null;
    }
    case cr: {
      if (t === null) return null;
      const i = ee(t, o);
      for (const r of ee(o, t)) {
        if (i.length >= qt) break;
        i.push(r);
      }
      return i;
    }
    default:
      return t;
  }
}
const mr = 2e5, us = 4096, fo = 4e7, gr = 1024, oe = 2e6, pn = 256 * 1024 * 1024, hs = 56, br = 0, Ze = 3, xr = 256, yr = 8913094, kr = 15597702, wr = 6684742;
function po(t) {
  const e = t.u32(0), n = t.i32(4), s = t.i32(8), o = t.u16(14), i = t.u32(16), r = t.u32(32);
  if (e < 40 || n <= 0 || s === 0 || ![1, 4, 8, 16, 24, 32].includes(o) || i !== br && i !== Ze) return null;
  const l = i === Ze ? [t.u32(40), t.u32(44), t.u32(48)] : o === 16 ? [31744, 992, 31] : [16711680, 65280, 255], c = e + (i === Ze && e === 40 ? 12 : 0), u = o <= 8 ? r === 0 ? 1 << o : Math.min(r, 1 << o) : Math.min(r, xr);
  return { w: n, h: Math.abs(s), topDown: s < 0, bpp: o, masks: l, palOff: c, palN: u };
}
function Rn(t) {
  const e = po(t);
  return e ? e.palOff + e.palN * 4 : null;
}
function ve(t, e, n) {
  const s = po(t);
  if (!s) return null;
  const o = s.w * s.h;
  if (o === 0 || o > fo) return null;
  const i = Math.floor((s.w * s.bpp + 31) / 32) * 4, r = e.slice(0, i * s.h), l = t.slice(s.palOff, s.palN * 4), a = new Uint8Array(o * 4), [c, u, h] = s.masks;
  for (let f = 0; f < s.h; f++) {
    const m = (s.topDown ? f : s.h - 1 - f) * i;
    for (let d = 0; d < s.w; d++) {
      const p = (f * s.w + d) * 4;
      let g = 0, b = 0, k = 0, y = 255;
      switch (s.bpp) {
        case 1:
          [g, b, k] = Ke(l, r[m + (d >> 3)] >> 7 - d % 8 & 1);
          break;
        case 4: {
          const w = r[m + (d >> 1)];
          [g, b, k] = Ke(l, d % 2 === 0 ? w >> 4 : w & 15);
          break;
        }
        case 8:
          [g, b, k] = Ke(l, r[m + d]);
          break;
        case 24: {
          const w = m + d * 3;
          k = r[w], b = r[w + 1], g = r[w + 2];
          break;
        }
        case 16: {
          const w = m + d * 2, v = r[w] | r[w + 1] << 8;
          g = Jt(v, c), b = Jt(v, u), k = Jt(v, h);
          break;
        }
        default: {
          const w = m + d * 4, v = (r[w] | r[w + 1] << 8 | r[w + 2] << 16 | r[w + 3] << 24) >>> 0;
          g = Jt(v, c), b = Jt(v, u), k = Jt(v, h), y = n ? r[w + 3] : 255;
        }
      }
      a[p] = g, a[p + 1] = b, a[p + 2] = k, a[p + 3] = y;
    }
  }
  return { w: s.w, h: s.h, bottomUp: !s.topDown, px: a };
}
function Ke(t, e) {
  const n = e * 4;
  return n + 4 <= t.length ? [t[n + 2], t[n + 1], t[n]] : [0, 0, 0];
}
function Mr(t) {
  let e = 0;
  for (; e < 32 && (t >>> e & 1) === 0; ) e++;
  return e;
}
function Jt(t, e) {
  if (e === 0) return 0;
  const n = Mr(e), s = e >>> n, o = (t & e) >>> 0 >>> n;
  return Math.floor((o * 255 + Math.floor(s / 2)) / s);
}
function Fn(t, e, n) {
  const s = t.w, o = t.h, [i, r, l, a] = e[2] > 0 && e[3] > 0 ? e : [0, 0, s, o], c = t.bottomUp ? o - r - a : r, u = Math.max(i, 0), h = Math.min(i + l, s), f = Math.max(c, 0), m = Math.min(c + a, o);
  if (h <= u || m <= f) return null;
  const d = n[2] / l, p = n[3] / a, g = [n[0] + (u - i) * d, n[1] + (f - c) * p, (h - u) * d, (m - f) * p], b = h - u, k = m - f, y = new Uint8Array(b * k * 4);
  for (let w = f; w < m; w++) {
    const v = (w * t.w + u) * 4;
    if (v + b * 4 > t.px.length) return null;
    y.set(t.px.subarray(v, v + b * 4), (w - f) * b * 4);
  }
  return { img: { w: b, h: k, bottomUp: !1, px: y }, dst: g };
}
function mo(t, e) {
  const n = t.px;
  if (e.kind === "rop") {
    e.rop === yr ? fs(n, 255) : (e.rop === kr || e.rop === wr) && fs(n, 0);
    return;
  }
  for (let s = 0; s + 3 < n.length; s += 4)
    e.perPixel && vr(n, s), n[s + 3] = Math.floor(n[s + 3] * e.constant / 255);
}
function fs(t, e) {
  for (let n = 0; n + 3 < t.length; n += 4) t[n] === e && t[n + 1] === e && t[n + 2] === e && (t[n + 3] = 0);
}
function vr(t, e) {
  const n = t[e + 3];
  if (!(n === 0 || n === 255))
    for (let s = 0; s < 3; s++) t[e + s] = Math.min(255, Math.floor((t[e + s] * 255 + Math.floor(n / 2)) / n));
}
function Bn(t, e, n) {
  const { w: s, h: o, px: i } = t;
  if (s === 0 || o === 0) return;
  const r = s * 4, l = Math.min(o, Math.floor(i.length / r));
  if (e)
    for (let a = 0; a < l; a++) {
      const c = a * r;
      for (let u = 0; u < s >> 1; u++) {
        const h = c + u * 4, f = c + (s - 1 - u) * 4;
        for (let m = 0; m < 4; m++) {
          const d = i[h + m];
          i[h + m] = i[f + m], i[f + m] = d;
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
const Nt = (t) => "mime" in t;
function Cr(t) {
  return ht(() => {
    const e = new Gt(t);
    if (t.length > 24 && e.u32(0) === 1196314761 && e.u32(4) === 169478669) {
      const n = e.view.getUint32(16, !1), s = e.view.getUint32(20, !1);
      return n > 0 && s > 0 ? { mime: "image/png", bytes: t, w: n, h: s, crop: null } : null;
    }
    if (t.length > 10 && t[0] === 71 && t[1] === 73 && t[2] === 70) {
      const n = e.u16(6), s = e.u16(8);
      return n > 0 && s > 0 ? { mime: "image/gif", bytes: t, w: n, h: s, crop: null } : null;
    }
    if (t.length > 4 && t[0] === 255 && t[1] === 216) {
      const n = Sr(e);
      return n ? { mime: "image/jpeg", bytes: t, w: n[0], h: n[1], crop: null } : null;
    }
    if (t.length > 54 && t[0] === 66 && t[1] === 77) {
      const n = e.tail(14), s = Rn(n);
      if (s === null) return null;
      const o = e.u32(10), i = ve(n.sub(0, s), o >= 14 + s ? e.tail(o) : n.tail(s), !1);
      return i ? (i.bottomUp && (i.bottomUp = !1), i) : null;
    }
    return null;
  }) ?? null;
}
function Sr(t) {
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
const ds = 16;
function Zt(t) {
  let e = null;
  const n = (s) => {
    e ? e = [Math.min(e[0], s[0]), Math.min(e[1], s[1]), Math.max(e[2], s[0]), Math.max(e[3], s[1])] : e = [s[0], s[1], s[0], s[1]];
  };
  for (const s of t)
    s.k === "M" || s.k === "L" ? n(s.p) : s.k === "C" && (n(s.a), n(s.b), n(s.p));
  return e;
}
function go(t, e) {
  const n = [Math.max(t[0], e[0]), Math.max(t[1], e[1]), Math.min(t[2], e[2]), Math.min(t[3], e[3])];
  return n[2] < n[0] || n[3] < n[1] ? [n[0], n[1], n[0], n[1]] : n;
}
const re = ([t, e, n, s]) => [[t, e], [n, e], [n, s], [t, s]];
function ze(t) {
  if (!t.length) return null;
  let e = [t[0][0], t[0][1], t[0][0], t[0][1]];
  for (const n of t) e = [Math.min(e[0], n[0]), Math.min(e[1], n[1]), Math.max(e[2], n[0]), Math.max(e[3], n[1])];
  return e;
}
const Vt = (t, e, n) => (e[0] - t[0]) * (n[1] - t[1]) - (e[1] - t[1]) * (n[0] - t[0]);
function we(t) {
  const e = [];
  for (const i of t) {
    if (!(Number.isFinite(i[0]) && Number.isFinite(i[1]))) return null;
    const r = e[e.length - 1];
    (!r || Math.abs(r[0] - i[0]) > 1e-9 || Math.abs(r[1] - i[1]) > 1e-9) && e.push(i);
  }
  for (; e.length > 1 && e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1]; ) e.pop();
  let n = 0;
  for (let i = 0; i < e.length; i++) n += Vt([0, 0], e[i], e[(i + 1) % e.length]);
  if (e.length < 3 || Math.abs(n) < 1e-12) return null;
  n < 0 && e.reverse();
  const s = e.length, o = [];
  for (let i = 0; i < s; i++) {
    const r = Vt(e[(i + s - 1) % s], e[i], e[(i + 1) % s]);
    if (r < -1e-9 * (1 + Math.abs(n))) return null;
    Math.abs(r) > 1e-12 && o.push(e[i]);
  }
  return o.length >= 3 ? o : null;
}
function bo(t, e) {
  for (let n = 0; n < t.length; n++) if (Vt(t[n], t[(n + 1) % t.length], e) < -1e-9) return !1;
  return !0;
}
function Pr(t) {
  const e = ze(t);
  return !!e && t.length === 4 && t.every((n) => (n[0] === e[0] || n[0] === e[2]) && (n[1] === e[1] || n[1] === e[3]));
}
function Dn(t, e) {
  if (t.length * e.length > 1e6) return [];
  let n = t.slice();
  for (let s = 0; s < e.length; s++) {
    if (n.length * (e.length - s) > 1e6) return [];
    const o = e[s], i = e[(s + 1) % e.length], r = (c) => Vt(o, i, c) >= 0, l = (c, u) => {
      const h = Vt(o, i, c), f = Vt(o, i, u), m = h / (h - f);
      return [c[0] + (u[0] - c[0]) * m, c[1] + (u[1] - c[1]) * m];
    }, a = [];
    for (let c = 0; c < n.length; c++) {
      const u = n[(c + n.length - 1) % n.length], h = n[c], f = r(u), m = r(h);
      f && m ? a.push(h) : f && !m ? a.push(l(u, h)) : !f && m && (a.push(l(u, h)), a.push(h));
    }
    if (n = a, !n.length) break;
  }
  return n;
}
const Ie = (t, e) => t[2] < e[0] || t[0] > e[2] || t[3] < e[1] || t[1] > e[3] || e[2] <= e[0] || e[3] <= e[1], mn = (t, e) => re(t).every((n) => bo(e, n));
function Ar(t, e) {
  const n = e.length >= 3 ? ze(e) : null;
  if (!n) return [];
  switch (t.kind) {
    case "path": {
      const s = Zt(t.ops);
      if (!s) return [];
      if (mn(s, e)) return [t];
      if (Ie(s, n)) return [];
      const o = Ue(t.ops), i = [];
      if (t.fill) {
        const r = ps(o, e);
        r.length && i.push({ ...t, ops: r, stroke: null });
      }
      if (t.stroke) {
        const r = Or(o, e);
        r.length && i.push({ ...t, ops: r, fill: null });
      }
      return i;
    }
    case "pattern": {
      const s = Zt(t.ops);
      if (!s) return [];
      if (mn(s, e)) return [t];
      if (Ie(s, n)) return [];
      const o = ps(Ue(t.ops), e);
      return o.length ? [{ ...t, ops: o }] : [];
    }
    case "bitmap": {
      if (Nt(t.img)) {
        const [o, i, r, l] = t.rect;
        return Ie([o, i, o + r, i + l], n) ? [] : [t];
      }
      const s = Tr(t.rect, t.img, e);
      return s ? [{ ...t, rect: s.rect, img: s.img }] : [];
    }
    case "text": {
      const s = { ...t.text };
      return s.clip = s.clip ? go(n, s.clip) : n, [{ ...t, text: s }];
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
      for (let i = 1; i <= ds; i++) {
        const r = i / ds, l = 1 - r, a = [l * l * l, 3 * l * l * r, 3 * l * r * r, r * r * r];
        s[0].push([a[0] * o[0] + a[1] * n.a[0] + a[2] * n.b[0] + a[3] * n.p[0], a[0] * o[1] + a[1] * n.a[1] + a[2] * n.b[1] + a[3] * n.p[1]]);
      }
    } else {
      const s = e[e.length - 1];
      s && (s[1] = !0, s[0].length && e.push([[s[0][0]], !1]));
    }
  return e.filter((n) => n[0].length > 1);
}
function ps(t, e) {
  const n = [];
  for (const [s] of t) {
    const o = Dn(s, e);
    if (o.length >= 3) {
      n.push(q(o[0]));
      for (const i of o.slice(1)) n.push(et(i));
      n.push(rt);
    }
  }
  return n;
}
function Or(t, e) {
  const n = [];
  for (const [s, o] of t) {
    const i = o && s.length ? [...s, s[0]] : s;
    let r = null;
    for (let l = 0; l + 1 < i.length; l++) {
      const a = $r(i[l], i[l + 1], e);
      if (!a) {
        r = null;
        continue;
      }
      const [c, u] = a;
      (!r || r[0] !== c[0] || r[1] !== c[1]) && n.push(q(c)), n.push(et(u)), r = u;
    }
  }
  return n;
}
function $r(t, e, n) {
  const s = [e[0] - t[0], e[1] - t[1]];
  let o = 0, i = 1;
  for (let r = 0; r < n.length; r++) {
    const l = n[r], a = n[(r + 1) % n.length], c = Vt(l, a, t), u = (a[0] - l[0]) * s[1] - (a[1] - l[1]) * s[0];
    if (u === 0) {
      if (c < 0) return null;
    } else {
      const h = -c / u;
      u > 0 ? o = Math.max(o, h) : i = Math.min(i, h);
    }
  }
  return o <= i ? [[t[0] + s[0] * o, t[1] + s[1] * o], [t[0] + s[0] * i, t[1] + s[1] * i]] : null;
}
function Tr(t, e, n) {
  const [s, o, i, r] = t, l = [s, o, s + i, o + r];
  if (mn(l, n)) return { rect: t, img: e };
  const a = ze(n);
  if (!a || Ie(l, a) || i <= 0 || r <= 0 || e.w === 0 || e.h === 0) return null;
  const c = go(l, a), u = e.w / i, h = e.h / r, f = Math.min(Math.max(0, Math.floor((c[0] - s) * u)), e.w), m = Math.min(Math.max(0, Math.ceil((c[2] - s) * u)), e.w), d = Math.min(Math.max(0, Math.floor((c[1] - o) * h)), e.h), p = Math.min(Math.max(0, Math.ceil((c[3] - o) * h)), e.h);
  if (m <= f || p <= d) return null;
  const g = !Pr(n);
  if (g && (m - f) * (p - d) * n.length > 5e6) return null;
  const b = m - f, k = new Uint8Array(b * (p - d) * 4);
  for (let y = d; y < p; y++) {
    const v = ((e.bottomUp ? e.h - 1 - y : y) * e.w + f) * 4;
    if (v + b * 4 > e.px.length) return null;
    const S = (y - d) * b * 4;
    if (k.set(e.px.subarray(v, v + b * 4), S), g) {
      const $ = o + (y + 0.5) / h;
      for (let F = 0; F < b; F++) bo(n, [s + (f + F + 0.5) / u, $]) || (k[S + F * 4 + 3] = 0);
    }
  }
  return { rect: [s + f / u, o + d / h, b / u, (p - d) / h], img: { w: b, h: p - d, bottomUp: !1, px: k } };
}
const xo = () => ({ family: "", height: 0, width: 0, weight: 0, italic: !1, underline: !1, strike: !1, charset: 0 }), ms = 2, Er = 1, yo = 2, Ln = 4, ko = 16, Nr = 8192, He = 16384;
function Ir(t) {
  const e = (t & 6) === 6 ? "center" : (t & 6) === 2 ? "right" : "left", n = (t & 24) === 24 ? "baseline" : (t & 24) === 8 ? "bottom" : "top";
  return [e, n];
}
function Ce(t, e, n) {
  let s = "";
  const o = [], i = [128, 129, 130, 134, 136].includes(e);
  let r = 0;
  for (; r < t.length; ) {
    const l = t[r], a = i && l >= 129 && r + 1 < t.length ? 2 : 1;
    if (s += a === 2 ? " " : Rr(l, e), n.length) {
      let c = 0;
      for (let u = r; u < r + a; u++) u < n.length && (c += n[u]);
      o.push(c);
    }
    r += a;
  }
  return [s, o];
}
function ie(t, e) {
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
function Rr(t, e) {
  if (t < 128 && e !== ms) return String.fromCharCode(t);
  let n;
  return e === ms ? n = 61440 | t : e === 238 ? n = Je(t, Br) : e === 204 ? n = Je(t, Dr) : n = Je(t, Fr), String.fromCodePoint(n);
}
function Je(t, e) {
  const n = e[t - 128 & 255];
  return n || 65533;
}
const Fr = (() => {
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
})(), Br = [
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
], Dr = (() => {
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
})(), gs = 1, bs = 7, wo = 8, Te = 2147483648, _e = 5, Mo = 15, Rt = 0, Qe = 128, jn = 1, Un = 2, Lr = 3, jr = 5, vo = 6, Ur = 2, _r = 7, xs = 9, zr = 11, Hr = 13, Xr = 2, ys = 15728673, ks = 66, ws = 16711778, Ms = 96 / 25.4, vs = 256, mt = [1, 0, 0, 1, 0, 0];
function ut(t, e) {
  return [
    t[0] * e[0] + t[1] * e[2],
    t[0] * e[1] + t[1] * e[3],
    t[2] * e[0] + t[3] * e[2],
    t[2] * e[1] + t[3] * e[3],
    t[4] * e[0] + t[5] * e[2] + e[4],
    t[4] * e[1] + t[5] * e[3] + e[5]
  ];
}
const St = (t, e) => ({ style: t, color: e, hatch: 0, pattern: null });
function Co(t, e) {
  return t.w === 0 || t.h === 0 || t.w > vs || t.h > vs || t.px.length !== t.w * t.h * 4 ? null : { style: vo, color: [0, 0, 0, 255], hatch: 0, pattern: { w: t.w, h: t.h, px: t.px, mono: e } };
}
const Wr = (t) => [t & 255, t >>> 8 & 255, t >>> 16 & 255, 255];
function Vr(t) {
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
const Cs = (t, e) => e === 0 ? 1 : t / e;
class _n {
  wo = [0, 0];
  we = [1, 1];
  vo = [0, 0];
  ve = [1, 1];
  mode = gs;
  world = mt;
  /** Device pixels per millimetre on each axis (EMF: from szlDevice and szlMillimeters). */
  pxMm = [Ms, Ms];
  /**
   * Whether a viewport extent was set (by the file, or by the WMF player). An EMF that picks an
   * extent-based mode and sets only the window would, by GDI's 1×1 default viewport, shrink to a
   * pixel, yet its own bounds say it drew full size: without a viewport the window is the scale
   * (1 logical unit per device unit), as WMF's rule already treats it. Beyond DeckCraft.
   */
  veSet = !1;
  clone() {
    const e = new _n();
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
    if (this.mode === gs) return [1, 1];
    const e = Vr(this.mode);
    if (e !== null) return [e * this.pxMm[0], -e * this.pxMm[1]];
    if (!this.veSet) return [1, 1];
    const n = Cs(this.ve[0], this.we[0]), s = Cs(this.ve[1], this.we[1]);
    if (this.mode === bs) {
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
    return this.mode === bs || this.mode === wo;
  }
  /** The window in device units as `[x, y, w, h]` with positive extents, used as the picture frame of a plain WMF. */
  windowRect() {
    const e = this.device(this.wo), n = this.device([this.wo[0] + this.we[0], this.wo[1] + this.we[1]]);
    return [Math.min(e[0], n[0]), Math.min(e[1], n[1]), Math.abs(n[0] - e[0]), Math.abs(n[1] - e[1])];
  }
}
class Se {
  items = [];
  map = new _n();
  /** True once SETWINDOWEXT was seen, so a plain WMF has a frame to use. */
  windowSet = !1;
  /** True once the file set the viewport extent itself (not the player, see playInto). */
  viewportSet = !1;
  saved = [];
  /** Bytes held by the items so far (path ops and pixels), capped at MAX_BYTES. */
  used = 0;
  objects = [];
  pen = { style: 0, width: 0, color: [0, 0, 0, 255] };
  brush = St(Rt, [255, 255, 255, 255]);
  evenOdd = !0;
  /** SETROP2 mix mode. */
  rop2 = Hr;
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
    this.surface = Ot(e);
  }
  /** True once the item cap is hit; the readers stop there and keep what they have. */
  full() {
    return this.isFull;
  }
  push(e) {
    let n = [e];
    for (const s of [this.pathClip, this.plusClip]) s && (n = n.flatMap((o) => Ar(o, s)));
    for (const s of n) this.pushRaw(s);
  }
  /**
   * A COLORREF in the current state: PALETTEINDEX (0x01 in the high byte) names an entry of the
   * selected palette (black past its end); PALETTERGB (0x02) and plain values are RGB.
   */
  colorOf(e) {
    return e >>> 24 === 1 ? this.palette[e & 65535] ?? [0, 0, 0, 255] : Wr(e);
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
    let o = s.length === 1 ? we(s[0][0]) : null;
    if (!o) {
      const i = Zt(n);
      o = i ? re(i) : null;
    }
    o && (e === ho ? this.pathClip = o : e === uo && (this.pathClip = this.pathClip ? we(Dn(this.pathClip, o)) ?? [] : o));
  }
  /** Fills logical rectangles (a region's RGNDATA) with brush object `brushIndex`, or the current brush when null. FILLRGN, PAINTRGN. */
  fillRegion(e, n) {
    const s = this.brush;
    n !== null && this.select(n);
    for (const [o, i, r, l] of e) this.shape(wt(o, i, r, l), !0, !1);
    this.brush = s;
  }
  /** FRAMERGN: outlines each rectangle of a region with brush object `brushIndex`'s colour, `w` × `h` logical units thick. */
  frameRegion(e, n, s, o) {
    const i = this.objects[n], r = i?.kind === "brush" ? i.brush.color : (n & Te) !== 0 && (n & 255) === 4 ? [0, 0, 0, 255] : null;
    if (!r) return;
    const l = this.brush;
    this.brush = St(Rt, r);
    for (const [a, c, u, h] of e)
      this.shape(wt(a, c, u, c + o), !0, !1), this.shape(wt(a, h - o, u, h), !0, !1), this.shape(wt(a, c, a + s, h), !0, !1), this.shape(wt(u - s, c, u, h), !0, !1);
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
        s = e.ops.length * hs;
        break;
      // A tile shared with its brush is counted once (by the brush); one made for this fill counts here.
      case "pattern":
        s = e.ops.length * hs + 64 + (Ss.has(e.tile) ? 0 : e.tile.px.length);
        break;
      case "bitmap":
        s = Nt(e.img) ? e.img.bytes.length : e.img.px.length;
        break;
      case "text":
        s = e.text.text.length * 2 + e.text.dx.length * 4 + e.text.font.family.length + 128;
        break;
    }
    s += n, this.items.length >= mr || this.used + s > pn ? this.isFull = !0 : (this.used += s, this.items.push(e));
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
      this.map.mode = wo, this.map.wo = [s, o], this.map.we = [i, r], this.map.vo = [0, 0];
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
    this.evenOdd = e !== Ur;
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
    this.text.bkOpaque = e === Xr;
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
    n === 1 ? this.map.world = mt : n === 2 ? this.map.world = ut(e, this.map.world) : n === 3 ? this.map.world = ut(this.map.world, e) : n === 4 && (this.map.world = e);
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
    const s = e.map((g) => this.mapOp(g)), o = Zt(s);
    if (!o) return;
    const [i, r, l, a] = o, c = Math.max(l - i, a - r);
    if (s.length < 2 || !(Number.isFinite(c) && c > 0)) return;
    const u = c / Qe, h = Math.min(Qe + 1, Math.max(1, Math.ceil((l - i) / u) + 1)), f = Math.min(Qe + 1, Math.max(1, Math.ceil((a - r) / u) + 1)), m = h * u, d = f * u, p = new Uint8Array(h * f * 4);
    for (let g = 0; g < f; g++) {
      const b = r + Ut(g * u - r, d) + u / 2;
      for (let k = 0; k < h; k++) {
        const y = i + Ut(k * u - i, m) + u / 2;
        p.set(n([y, b]), (g * h + k) * 4);
      }
    }
    this.push({ kind: "pattern", ops: s, evenOdd: this.evenOdd, tile: { w: h, h: f, px: p, cell: u }, region: null });
  }
  /** Pushes the drawing state. Past MAX_STACK levels the parse stops, since later restores could no longer match the file. */
  saveDc() {
    this.saved.length < gr ? this.saved.push({ pathClip: this.pathClip, arcClockwise: this.arcClockwise, map: this.map.clone(), pen: { ...this.pen }, brush: { ...this.brush }, evenOdd: this.evenOdd, rop2: this.rop2, text: { ...this.text }, clip: this.clip ? this.clip.slice() : null }) : this.isFull = !0;
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
    return Ot([r, l, a, c]);
  }
  /** INTERSECTCLIPRECT: later drawing is limited to this logical rectangle as well. */
  intersectClipRect(e) {
    const n = this.deviceRect(e);
    this.clip = n ? fr(this.clip, n) : [];
  }
  /** EXCLUDECLIPRECT: this logical rectangle is removed from the clip. */
  excludeClipRect(e) {
    const n = this.deviceRect(e);
    n && (this.clip = dr(this.clip, n, this.surface));
  }
  /**
   * EXTSELECTCLIPRGN: combine these rectangles with the clip in a `RGN_*` mode. A GDI region is in
   * device units, so the window, viewport and world transform don't apply. (DeckCraft maps them as
   * logical units, which shifts the clip by any window origin: LibreOffice's TestNegativeWinOrg
   * cut its line of text in half.)
   */
  selectClipRects(e, n) {
    this.clip = pr(this.clip, e.slice(0, qt), n, this.surface);
  }
  /** The default clip: later records are not limited by a region (nor a clip path). */
  resetClip() {
    this.clip = null, this.pathClip = null;
  }
  /** Stores an object in `slot` (EMF index), or in the first free slot (WMF handle table). */
  addObject(e, n) {
    if (n.kind === "brush" && n.brush.pattern) {
      const o = n.brush.pattern.px.length;
      if (this.used + o > pn) {
        this.isFull = !0;
        return;
      }
      this.used += o;
    }
    if (e !== null) {
      if (e < us) {
        for (; this.objects.length <= e; ) this.objects.push(null);
        this.objects[e] = n;
      }
      return;
    }
    const s = this.objects.indexOf(null);
    s >= 0 ? this.objects[s] = n : this.objects.length < us && this.objects.push(n);
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
    const n = [255, 255, 255, 255], s = [0, 0, 0, 255], o = (i) => St(Rt, [i, i, i, 255]);
    e === 0 || e === 18 ? this.brush = St(Rt, n) : e === 1 ? this.brush = o(192) : e === 2 ? this.brush = o(128) : e === 3 ? this.brush = o(64) : e === 4 ? this.brush = St(Rt, s) : e === 5 ? this.brush = St(jn, s) : e === 6 ? this.pen = { style: 0, width: 0, color: n } : e === 7 || e === 19 ? this.pen = { style: 0, width: 0, color: s } : e === 8 ? this.pen = { style: _e, width: 0, color: s } : e >= 10 && e <= 17 && (this.text.font = null);
  }
  mapOp(e) {
    switch (e.k) {
      case "M":
        return q(this.map.device(e.p));
      case "L":
        return et(this.map.device(e.p));
      case "C":
        return kt(this.map.device(e.a), this.map.device(e.b), this.map.device(e.p));
      default:
        return rt;
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
    if (e.style === Rt) return { kind: "solid", color: e.color };
    if (e.style === Un) {
      const n = So(e.hatch, e.color, this.text.bkOpaque ? this.text.bkColor : null);
      return n ? { kind: "tile", tile: { w: 8, h: 8, px: n, cell: this.patternPx } } : null;
    }
    if (e.style === Lr || e.style === jr || e.style === vo) {
      const n = e.pattern;
      if (!n) return null;
      if (!n.mono && this.rop2 !== xs)
        return n.plain || (n.plain = { w: n.w, h: n.h, px: n.px, cell: this.patternPx }, Ss.add(n.plain)), { kind: "tile", tile: n.plain };
      const s = n.px.slice();
      for (let o = 0; o + 3 < s.length; o += 4) {
        if (n.mono) {
          const r = s[o] + s[o + 1] + s[o + 2] >= 384 ? this.text.bkColor : this.text.color;
          s[o] = r[0], s[o + 1] = r[1], s[o + 2] = r[2], s[o + 3] = 255;
        }
        this.rop2 === xs && (s[o] === 255 && s[o + 1] === 255 && s[o + 2] === 255 ? s[o + 3] = 0 : s[o] === 0 && s[o + 1] === 0 && s[o + 2] === 0 && this.xorColor && s.set(this.xorColor, o));
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
    return this.rop2 === zr ? !0 : this.rop2 === _r ? (e && this.brush.style === Rt && (this.xorColor = this.brush.color), !0) : !1;
  }
  strokePen() {
    if ((this.pen.style & Mo) === _e) return null;
    const e = this.pen.width === 0 ? 0 : Math.abs(this.pen.width) * this.map.scale();
    return [this.pen.color, e];
  }
  pushPathOps(e) {
    for (const n of e) {
      if (this.path.length >= oe) return;
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
    this.inPath && this.pushPathOps([q(this.map.device(e))]), this.pos = e;
  }
  /** LINETO from the current point, then moves the current point to `p`. */
  lineTo(e) {
    this.lineChain([e], !1, !0);
  }
  /** Lines from the current point through `pts` (POLYLINETO), or a polyline from the current point. */
  lineChain(e, n, s) {
    const o = this.inPath && this.path.length ? [] : [q(this.pos)];
    for (const i of e) o.push(et(i));
    e.length && (this.pos = e[e.length - 1]), this.shape(o, n, s);
  }
  /** POLYBEZIER: cubic segments that start a new figure at `from`. The current point is unchanged. */
  bezier(e, n) {
    this.shape([q(e), ...Ps(n)], !1, !0);
  }
  /** POLYBEZIERTO: cubic segments from the current point; the current point moves to the last point. */
  bezierTo(e) {
    const n = this.inPath && this.path.length ? [] : [q(this.pos)];
    n.push(...Ps(e)), e.length && (this.pos = e[e.length - 1]), this.shape(n, !1, !0);
  }
  poly(e, n, s, o) {
    if (!e.length) return;
    const i = [q(e[0])];
    for (let r = 1; r < e.length; r++) i.push(et(e[r]));
    n && i.push(rt), this.shape(i, s, o);
  }
  beginPath() {
    this.inPath = !0, this.path = [];
  }
  endPath() {
    this.inPath = !1;
  }
  closeFigure() {
    this.inPath && this.pushPathOps([rt]);
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
    this.pushShape(wt(e, n, s, o).map((r) => this.mapOp(r)), i, null);
  }
  /** Fills a logical rectangle `[l, t, r, b]` with a solid colour (ROP fills such as BLACKNESS). */
  fillRectWith([e, n, s, o], i) {
    this.push({ kind: "path", ops: wt(e, n, s, o).map((r) => this.mapOp(r)), fill: i, stroke: null, evenOdd: !0, region: null });
  }
  /** Whether a raster operation draws without a source bitmap (PATCOPY, BLACKNESS, WHITENESS). */
  static sourceless(e) {
    return e === ys || e === ks || e === ws;
  }
  /** Fills a logical rectangle `[x, y, w, h]` for a source-less raster operation. PATCOPY uses the brush; the others fill black or white. */
  fillRop([e, n, s, o], i) {
    const r = [e, n, e + s, n + o];
    i === ys ? this.fillBrushRect(r) : i === ks ? this.fillRectWith(r, [0, 0, 0, 255]) : i === ws && this.fillRectWith(r, [255, 255, 255, 255]);
  }
  /**
   * Draws `text` (one `dx` advance per character, or none) with the current font, colours and
   * alignment. The reference point is `at`, or the current position under TA_UPDATECP (which then
   * moves past the string). `rect` (logical `[l, t, r, b]`) is filled with the background colour
   * under ETO_OPAQUE and clips the text under ETO_CLIPPED. Text ignores the mix mode, as GDI's does.
   */
  drawText(e, n, s, o, i) {
    (o & yo) !== 0 && i && this.fillRectWith(i, this.text.bkColor);
    const r = this.text.font ?? { font: xo(), escapement: 0 }, l = (this.text.align & Er) !== 0, a = l ? this.pos : e, [c, u] = Ir(this.text.align), h = this.map.device(a), f = this.map.device([a[0] + 1, a[1]]), m = this.map.device([a[0], a[1] + 1]), d = [f[0] - h[0], f[1] - h[1]], p = [m[0] - h[0], m[1] - h[1]];
    if (l) {
      let D = s.length ? s.reduce((A, I) => A + I, 0) : Math.max(Math.abs(r.font.height), 1) * 0.5 * [...n].length;
      D = c === "left" ? D : c === "right" ? -D : 0;
      const E = r.escapement / 10 * (Math.PI / 180), L = p[1] < 0 ? 1 : -1, T = [a[0] + D * Math.cos(E), a[1] + D * Math.sin(E) * L];
      Number.isFinite(T[0]) && Number.isFinite(T[1]) && (this.pos = T);
    }
    const g = Math.hypot(d[0], d[1]), b = Math.hypot(p[0], p[1]);
    if (!(n.length > 0 && [g, b, h[0], h[1]].every(Number.isFinite) && g > 0 && b > 0)) return;
    const v = (d[0] * p[1] - d[1] * p[0] > 0 ? Math.atan2(d[1], d[0]) : Math.atan2(d[1], Math.abs(d[0]))) - r.escapement / 10 * (Math.PI / 180), S = Math.cos(v), $ = Math.sin(v);
    let F = null;
    if ((o & Ln) !== 0 && i) {
      const [D, E, L, T] = i, A = this.map.device([D, E]), I = this.map.device([L, T]);
      F = [Math.min(A[0], I[0]), Math.min(A[1], I[1]), Math.max(A[0], I[0]), Math.max(A[1], I[1])];
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
        clip: F,
        region: null
      },
      region: null
    });
  }
  /** A bitmap stretched into a logical rectangle `[x, y, w, h]`. A negative extent mirrors the bitmap, as the mapping does. */
  bitmap(e, n) {
    const [s, o, i, r] = e, l = this.map.device([s, o]), a = this.map.device([s + i, o + r]);
    let c = n;
    if (Nt(c)) {
      const u = l[0] > a[0], h = l[1] > a[1];
      (u || h) && (c = { ...c, flip: [!!c.flip?.[0] !== u, !!c.flip?.[1] !== h] });
    } else
      Bn(c, l[0] > a[0], l[1] > a[1]);
    this.push({ kind: "bitmap", rect: [Math.min(l[0], a[0]), Math.min(l[1], a[1]), Math.abs(a[0] - l[0]), Math.abs(a[1] - l[1])], img: c, region: null });
  }
}
const Ss = /* @__PURE__ */ new WeakSet();
function So(t, e, n) {
  if (t > 5 || t < 0) return null;
  const s = new Uint8Array(256);
  for (let o = 0; o < 8; o++)
    for (let i = 0; i < 8; i++) {
      const r = o === 7, l = i === 7, a = i === o, c = i + o === 7, u = t === 0 ? r : t === 1 ? l : t === 2 ? a : t === 3 ? c : t === 4 ? r || l : a || c;
      s.set(u ? e : n ?? [0, 0, 0, 0], (o * 8 + i) * 4);
    }
  return s;
}
function Ps(t) {
  const e = [];
  for (let n = 0; n + 2 < t.length; n += 3) e.push(kt(t[n], t[n + 1], t[n + 2]));
  return e;
}
const Yr = 726027589, Gr = 64, qr = 64, Kt = 1e5, gn = 256, As = 32768, Zr = 64 * 1024 * 1024, Kr = 32, Os = Kt, Jr = 3, Qr = 2, tl = 6, el = 8, nl = 24;
function bn(t) {
  switch (t.kind) {
    case "solid":
      return t.color;
    case "hatch":
      return t.fg;
    case "linear":
    case "radial":
      return xn(t.stops, 0.5);
    case "texture":
      return Nt(t.img) ? [128, 128, 128, 255] : t.img.px.length >= 4 ? [t.img.px[0], t.img.px[1], t.img.px[2], t.img.px[3]] : [0, 0, 0, 255];
  }
}
function sl(t, e) {
  switch (t.kind) {
    case "solid":
      return t.color;
    case "hatch":
      return t.fg;
    case "linear": {
      const n = t.rect[2] === 0 ? 0 : (e[0] - t.rect[0]) / t.rect[2];
      return xn(t.stops, il(n, t.wrap));
    }
    case "radial": {
      const n = (e[0] - t.center[0]) / Math.max(t.radius[0], 1e-9), s = (e[1] - t.center[1]) / Math.max(t.radius[1], 1e-9);
      return xn(t.stops, Math.min(Math.hypot(n, s), 1));
    }
    case "texture": {
      const n = t.img;
      if (Nt(n)) return [128, 128, 128, 255];
      const s = n.w, o = n.h;
      if (s === 0 || o === 0) return [0, 0, 0, 0];
      if (t.wrap === 4 && !(e[0] >= 0 && e[0] < s && e[1] >= 0 && e[1] < o)) return [0, 0, 0, 0];
      const i = Math.min(Math.floor(Ut(e[0], s)), s - 1), l = (Math.min(Math.floor(Ut(e[1], o)), o - 1) * s + i) * 4;
      return l + 4 <= n.px.length ? [n.px[l], n.px[l + 1], n.px[l + 2], n.px[l + 3]] : [0, 0, 0, 0];
    }
  }
}
const ol = (t) => t.kind === "linear" || t.kind === "radial" || t.kind === "texture" ? t.xf : mt;
function il(t, e) {
  if (!Number.isFinite(t)) return 0;
  if (e === 1 || e === 3) {
    const n = Ut(t, 2);
    return n > 1 ? 2 - n : n;
  }
  return e === 4 ? Math.min(1, Math.max(0, t)) : Ut(t, 1);
}
function xn(t, e) {
  if (!t.length) return [0, 0, 0, 0];
  if (e <= t[0][0]) return t[0][1];
  for (let n = 0; n + 1 < t.length; n++) {
    const [s, o] = t[n], [i, r] = t[n + 1];
    if (e <= i) return zn(o, r, i > s ? (e - s) / (i - s) : 0);
  }
  return t[t.length - 1][1];
}
function zn(t, e, n) {
  return [0, 1, 2, 3].map((s) => Math.min(255, Math.max(0, Math.round(t[s] + (e[s] - t[s]) * n))));
}
class rl {
  /** An EMF+ header said the file is EMF+ only, so these records are the picture. */
  active = !1;
  dpi = 96;
  world = mt;
  page = 1;
  /** Convex device clip polygon; null is unclipped. */
  clip = null;
  objects = new Array(Gr).fill(null);
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
      ht(() => this.record(e, o, i, a)), s += r;
    }
  }
  /** World units to device pixels before the canvas's own mapping. */
  xf() {
    return ut(this.world, [this.page, 0, 0, this.page, 0, 0]);
  }
  painter() {
    return new Ns(this.xf(), this.clip ? this.clip.slice() : null);
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
        for (const c of _t(o, 8, o.u32(4), i)) {
          if (e.full()) break;
          a.fill(e, wt(...c), l);
        }
        return;
      }
      case 16395: {
        const l = this.pen(r);
        if (!l) return;
        const a = this.painter();
        for (const c of _t(o, 4, o.u32(0), i)) {
          if (e.full()) break;
          a.stroke(e, wt(...c), l);
        }
        return;
      }
      case 16396: {
        const l = this.brushOf(s, o.u32(0));
        l && this.painter().fill(e, Re(Ct(o, 8, o.u32(4), i), !0), l);
        return;
      }
      case 16397: {
        const l = this.pen(r);
        l && this.painter().stroke(e, Re(Ct(o, 4, o.u32(0), i), (s & 8192) !== 0), l);
        return;
      }
      case 16398: {
        const l = this.brushOf(s, o.u32(0)), a = _t(o, 4, 1, i)[0];
        l && a && this.painter().fill(e, Rs(a), l);
        return;
      }
      case 16399: {
        const l = this.pen(r), a = _t(o, 0, 1, i)[0];
        l && a && this.painter().stroke(e, Rs(a), l);
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
        const l = this.pen(r), a = Ct(o, 4, o.u32(0), i);
        if (!l || !a.length) return;
        const c = [q(a[0])];
        for (let u = 1; u + 2 < a.length; u += 3) c.push(kt(a[u], a[u + 1], a[u + 2]));
        this.painter().stroke(e, c, l);
        return;
      }
      // Cardinal splines: FillClosedCurve, DrawClosedCurve, DrawCurve.
      case 16406: {
        const l = this.brushOf(s, o.u32(0)), a = tn(o.f32(4));
        if (!l || a === null) return;
        this.painter().fill(e, sn(Ct(o, 12, o.u32(8), i), a, !0, 0, 1 / 0), l);
        return;
      }
      case 16407: {
        const l = this.pen(r), a = tn(o.f32(0));
        if (!l || a === null) return;
        this.painter().stroke(e, sn(Ct(o, 8, o.u32(4), i), a, !0, 0, 1 / 0), l);
        return;
      }
      case 16408: {
        const l = this.pen(r), a = tn(o.f32(0));
        if (!l || a === null) return;
        const c = o.u32(4), u = o.u32(8);
        this.painter().stroke(e, sn(Ct(o, 16, o.u32(12), i), a, !1, c, u), l);
        return;
      }
      case 16400: {
        const l = this.brushOf(s, o.u32(0)), a = Et(o, 4, 2), c = _t(o, 12, 1, i)[0];
        l && a && c && this.painter().fill(e, Is(c, a[0], a[1], !0), l);
        return;
      }
      case 16401:
      case 16402: {
        const l = this.pen(r), a = Et(o, 0, 2), c = _t(o, 8, 1, i)[0];
        l && a && c && this.painter().stroke(e, Is(c, a[0], a[1], n === 16401), l);
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
        const l = $t(o.u32(0));
        if (!this.frame) return;
        const [a, c, u, h] = this.frame;
        if (l[3] === 0 || !(u > 0 && h > 0)) return;
        const f = Po(ut(e.world(), e.deviceAffine()));
        if (!f) return;
        new Ns(f, null).fill(e, wt(a, c, a + u, c + h), { kind: "solid", color: l });
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
        const l = this.image(r), a = _t(o, 24, 1, i)[0];
        l && a && this.drawImage(e, l, o, [a[0], a[1], a[2] - a[0], a[3] - a[1]]);
        return;
      }
      case 16411: {
        const l = this.image(r), a = Ct(o, 28, 3, i);
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
        const r = se(o, 0);
        r && (this.world = r);
        return;
      }
      case 16427:
        this.world = mt;
        return;
      case 16428: {
        const r = se(o, 0);
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
        const r = o.f32(0) * Es(s & 255, this.dpi);
        Number.isFinite(r) && r > 0 && r < 1e6 && (this.page = r);
        return;
      }
      case 16433:
        this.clip = null;
        return;
      case 16434: {
        const r = Et(o, 0, 4);
        if (!r) return;
        const [l, a, c, u] = r;
        this.combine(s, nn(re([l, a, l + c, a + u]), ut(this.xf(), e.deviceAffine())));
        return;
      }
      case 16435: {
        const r = this.path(i);
        r && this.combine(s, nn(Oo(r), ut(this.xf(), e.deviceAffine())));
        return;
      }
      case 16436: {
        const r = this.objects[i];
        r?.kind === "region" && this.combine(s, nn(r.area, ut(this.xf(), e.deviceAffine())));
        return;
      }
      case 16437: {
        const r = Et(o, 0, 2);
        if (!r) return;
        const l = ut(this.xf(), e.deviceAffine()), a = r[0] * l[0] + r[1] * l[2], c = r[0] * l[1] + r[1] * l[3];
        this.clip && (this.clip = this.clip.map((u) => [u[0] + a, u[1] + c]));
        return;
      }
    }
  }
  /** Without the `A` flag a transform is applied before the world transform (prepended). */
  apply(e, n) {
    e.every(Number.isFinite) && (this.world = (n & 8192) !== 0 ? ut(this.world, e) : ut(e, this.world));
  }
  push(e) {
    this.stack.length < qr && this.stack.push({ id: e, world: this.world, page: this.page, clip: this.clip });
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
    s === 0 ? this.clip = n : s === 1 ? this.clip = $o(this.clip, n) : s === 2 && (this.clip = To(this.clip, n));
  }
  object(e, n) {
    const s = e & 255, o = e >> 8 & 127;
    if ((e & 32768) !== 0) {
      const r = Math.min(n.u32(0), Zr), l = n.tail(4).b;
      let a = this.partial;
      this.partial = null, (!a || a.id !== s || a.kind !== o || a.total !== r) && (a = { id: s, kind: o, total: r, chunks: [], len: 0 });
      const c = l.subarray(0, Math.min(l.length, Math.max(0, a.total - a.len)));
      a.chunks.push(c), a.len += c.length, a.len >= a.total ? this.store(a.id, ht(() => en(a.kind, new Gt($s(a.chunks, a.len)), this.depth)) ?? null) : this.partial = a;
      return;
    }
    const i = this.partial;
    if (this.partial = null, i && i.id === s && i.kind === o) {
      const r = n.b.subarray(0, Math.min(n.length, Math.max(0, i.total - i.len)));
      i.chunks.push(r), i.len += r.length, this.store(s, ht(() => en(o, new Gt($s(i.chunks, i.len)), this.depth)) ?? null);
      return;
    }
    this.store(s, ht(() => en(o, n, this.depth)) ?? null);
  }
  store(e, n) {
    if (e >= this.objects.length) return;
    const s = this.objects[e];
    if (s && (this.objectBytes = Math.max(0, this.objectBytes - Ts(s))), this.objects[e] = null, n) {
      const o = Ts(n);
      this.objectBytes + o <= pn && (this.objectBytes += o, this.objects[e] = n);
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
    if ((e & 32768) !== 0) return { kind: "solid", color: $t(n) };
    const s = this.objects[n];
    return s?.kind === "brush" ? s.fill : null;
  }
  /** DrawImage and DrawImagePoints: the source rectangle (pixels) cut from the image, drawn into world rectangle `dst` = `[x, y, w, h]`. */
  drawImage(e, n, s, o) {
    if (n.kind === "meta") {
      this.painter().picture(e, o, n.pic);
      return;
    }
    const i = Et(s, 8, 4);
    if (!i) return;
    const r = s.u32(4) === 2 ? i.map((a) => Math.min(1e9, Math.max(-1e9, Math.round(a)))) : [0, 0, 0, 0], l = Nt(n.img) ? ml(n.img, r, o) : Fn(n.img, r, o);
    l && this.painter().image(e, l.dst, l.img);
  }
  /** The font as a LOGFONT whose height is in world units. */
  logFont(e) {
    const n = e.unit === 0 ? e.em : e.em * Es(e.unit, this.dpi) / this.page;
    return {
      font: { ...xo(), family: e.family, height: -Math.min(1e6, Math.max(0, n)), weight: (e.style & 1) !== 0 ? 700 : 400, italic: (e.style & 2) !== 0, underline: (e.style & 4) !== 0, strike: (e.style & 8) !== 0 },
      escapement: 0
    };
  }
  /** DrawString: lines of text laid out in a rectangle by the string format's alignments. */
  drawString(e, n, s) {
    const o = this.font(n & 255), i = this.brushOf(n, s.u32(0));
    if (!o || !i) return;
    const r = bn(i), l = this.objects[s.u32(4)], a = l?.kind === "format" ? l.format : { flags: 0, align: 0, lineAlign: 0 }, c = Math.min(s.u32(8), As), u = Et(s, 12, 4);
    if (!u) return;
    const [h, f, m, d] = u, p = [];
    for (let A = 0; A < c; A++) p.push(s.u16(28 + A * 2));
    const g = this.logFont(o), b = -g.font.height, k = m > 0 && (a.flags & 4096) === 0, y = [];
    let w = [];
    const v = () => {
      const A = w.filter((I) => I !== 13);
      k ? y.push(...xl(A, m, b)) : y.push(A), w = [];
    };
    for (const A of p)
      A === 10 ? v() : w.push(A);
    v();
    const S = b * 1.2, [$, F] = a.align === 1 ? [h + m / 2, tl] : a.align === 2 ? [h + m, Qr] : [h, 0], D = S * y.length, E = a.lineAlign === 1 ? f + (d - D) / 2 : a.lineAlign === 2 ? f + d - D : f, L = m > 0 && d > 0 && (a.flags & 16384) === 0 ? [h, f, h + m, f + d] : null, T = this.painter();
    y.forEach((A, I) => {
      if (!A.length) return;
      const [B, C] = ie(A, []);
      let P = [$, E + S * I], O = F;
      a.lineAlign === 2 && y.length === 1 && (P = [$, f + d], O = F | el), T.text(e, P, B, C, { color: r, font: g, align: O, clip: L }, mt);
    });
  }
  /** DrawDriverString with character codes (CmapLookup): positioned glyphs on a baseline. */
  drawDriverString(e, n, s) {
    const o = this.font(n & 255), i = this.brushOf(n, s.u32(0));
    if (!o || !i) return;
    const r = bn(i), l = s.u32(4), a = Math.min(s.u32(12), As);
    let c = [];
    for (let p = 0; p < a; p++) c.push(s.u16(16 + p * 2));
    if ((l & 1) === 0 && (c = bl(o.family, c), !c))
      return;
    const u = Ct(s, 16 + a * 2, a, !1), h = s.u32(8) !== 0 ? se(s, 16 + a * 10) : mt;
    if (!h || !u.length) return;
    const f = this.logFont(o);
    let m = [];
    if ((l & 4) === 0) {
      for (let p = 0; p + 1 < u.length; p++) m.push(u[p + 1][0] - u[p][0]);
      m.push(m.length ? m[m.length - 1] : -f.font.height * 0.5);
    }
    let d;
    [d, m] = ie(c, m), this.painter().text(e, u[0], d, m, { color: r, font: f, align: nl, clip: null }, h);
  }
}
function $s(t, e) {
  const n = new Uint8Array(e);
  let s = 0;
  for (const o of t)
    n.set(o, s), s += o.length;
  return n;
}
function Ts(t) {
  return t.kind === "image" ? t.data.kind === "bitmap" ? Nt(t.data.img) ? t.data.img.bytes.length : t.data.img.px.length : t.data.pic.items.length * 128 : t.kind === "brush" && t.fill.kind === "texture" ? Nt(t.fill.img) ? t.fill.img.bytes.length : t.fill.img.px.length : t.kind === "path" ? t.ops.length * 56 : 0;
}
function Es(t, e) {
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
class Ns {
  xf;
  clip;
  constructor(e, n) {
    this.xf = e, this.clip = n;
  }
  begin(e, n) {
    const s = e.world();
    e.saveDc(), e.modifyWorld(ut(ut(n, this.xf), s), 4), e.setClip(this.clip);
  }
  end(e) {
    e.restoreDc(-1), e.setClip(null);
  }
  fill(e, n, s) {
    if (this.begin(e, mt), e.setPen({ style: _e, width: 0, color: [0, 0, 0, 0] }), s.kind === "solid")
      e.setBrush(St(Rt, s.color)), e.shape(n, !0, !1);
    else if (s.kind === "hatch") {
      const o = So(s.style, s.fg, s.bg);
      o ? e.tileShape(n, { w: 8, h: 8, px: o, cell: e.patternPx }) : (e.setBrush(St(Rt, zn(s.fg, s.bg, 0.5))), e.shape(n, !0, !1));
    } else {
      const o = Po(ut(ol(s), e.deviceAffine()));
      o && e.shadeShape(n, (i) => sl(s, yn(o, i)));
    }
    this.end(e);
  }
  stroke(e, n, [s, o]) {
    this.begin(e, mt), e.setPen({ style: 0, width: o, color: s }), e.setBrush(St(jn, [0, 0, 0, 0])), e.shape(n, !1, !0), this.end(e);
  }
  image(e, n, s) {
    this.begin(e, mt), e.bitmap(n, s), this.end(e);
  }
  /** A nested metafile's picture stretched into world rectangle `dst` = `[x, y, w, h]`. */
  picture(e, [n, s, o, i], r) {
    this.begin(e, mt);
    const l = o / r.width, a = i / r.height, c = ut([l, 0, 0, a, n, s], e.deviceAffine()), u = Math.sqrt(Math.abs(c[0] * c[3] - c[1] * c[2])), h = (m, d) => yn(c, [m, d]), f = (m) => m.map((d) => d.k === "M" ? q(h(d.x, d.y)) : d.k === "L" ? et(h(d.x, d.y)) : d.k === "C" ? kt(h(d.x1, d.y1), h(d.x2, d.y2), h(d.x, d.y)) : rt);
    for (const m of r.items) {
      if (e.full()) break;
      let d;
      if (m.kind === "path")
        d = { kind: "path", ops: f(m.segs), fill: m.fill, stroke: m.stroke ? [m.stroke[0], m.stroke[1] * u] : null, evenOdd: m.evenOdd, region: null };
      else if (m.kind === "pattern") {
        const p = m.tile, g = { w: p.width, h: p.height, px: p.rgba, cell: p.cell[0] * u };
        d = { kind: "pattern", ops: f(m.segs), evenOdd: m.evenOdd, tile: g, region: null };
      } else if (m.kind === "bitmap") {
        const p = h(m.rect[0], m.rect[1]), g = h(m.rect[0] + m.rect[2], m.rect[1] + m.rect[3]);
        let b = m.img;
        if (Nt(b)) {
          const k = p[0] > g[0], y = p[1] > g[1];
          (k || y) && (b = { ...b, flip: [!!b.flip?.[0] !== k, !!b.flip?.[1] !== y] });
        } else
          b = { ...b, px: b.px.slice() }, Bn(b, p[0] > g[0], p[1] > g[1]);
        d = { kind: "bitmap", rect: [Math.min(p[0], g[0]), Math.min(p[1], g[1]), Math.abs(g[0] - p[0]), Math.abs(g[1] - p[1])], img: b, region: null };
      } else {
        const p = { ...m.text };
        if (p.transform = ut(p.transform, c), p.clip) {
          const [g, b, k, y] = p.clip, w = h(g, b), v = h(k, y);
          p.clip = [Math.min(w[0], v[0]), Math.min(w[1], v[1]), Math.max(w[0], v[0]), Math.max(w[1], v[1])];
        }
        d = { kind: "text", text: p, region: null };
      }
      e.pushDevice(d);
    }
    this.end(e);
  }
  text(e, n, s, o, i, r) {
    this.begin(e, r), e.setTextStyle(i.color, i.font, i.align), e.drawText(n, s, o, i.clip ? Ln : 0, i.clip), this.end(e);
  }
}
const yn = (t, e) => [e[0] * t[0] + e[1] * t[2] + t[4], e[0] * t[1] + e[1] * t[3] + t[5]];
function Po(t) {
  const e = t[0] * t[3] - t[1] * t[2];
  if (!Number.isFinite(e) || Math.abs(e) < 1e-12) return null;
  const n = t[3] / e, s = -t[1] / e, o = -t[2] / e, i = t[0] / e;
  return [n, s, o, i, -(t[4] * n + t[5] * o), -(t[4] * s + t[5] * i)];
}
const $t = (t) => [t >>> 16 & 255, t >>> 8 & 255, t & 255, t >>> 24 & 255];
function Et(t, e, n) {
  const s = [];
  for (let o = 0; o < n; o++) s.push(t.f32(e + o * 4));
  return s.every(Number.isFinite) ? s : null;
}
const se = (t, e) => Et(t, e, 6), tn = (t) => Number.isFinite(t) ? t : null;
function en(t, e, n) {
  switch (t) {
    case 1: {
      const s = Ao(e, 0, n);
      return s ? { kind: "brush", fill: s } : null;
    }
    case 2:
      return cl(e, n);
    case 3: {
      const s = Hn(e);
      return s ? { kind: "path", ops: s } : null;
    }
    case 4:
      return ul(e);
    case 5: {
      const s = Eo(e, n);
      return s ? { kind: "image", data: s } : null;
    }
    case 6:
      return hl(e);
    case 7:
      return { kind: "format", format: { flags: e.u32(4), align: e.u32(12), lineAlign: e.u32(16) } };
    default:
      return null;
  }
}
function Ao(t, e, n) {
  const s = t.tail(e + 8);
  switch (t.u32(e + 4)) {
    case 0:
      return { kind: "solid", color: $t(s.u32(0)) };
    case 1:
      return { kind: "hatch", style: s.u32(0), fg: $t(s.u32(4)), bg: $t(s.u32(8)) };
    case 2: {
      const o = s.u32(0), i = s.u32(4);
      let r = mt, l = 8;
      if ((o & 2) !== 0) {
        const c = se(s, 8);
        if (!c) return null;
        r = c, l = 32;
      }
      const a = Eo(s.tail(l), n);
      return !a || a.kind !== "bitmap" ? null : { kind: "texture", img: a.img, wrap: i, xf: r };
    }
    case 3:
      return al(s);
    case 4:
      return ll(s);
    default:
      return null;
  }
}
function ll(t) {
  const e = t.u32(0), n = t.u32(4), s = Et(t, 8, 4);
  if (!s) return null;
  const o = $t(t.u32(24)), i = $t(t.u32(28));
  let r = 40, l = mt;
  if ((e & 2) !== 0) {
    const c = se(t, r);
    if (!c) return null;
    l = c, r += 24;
  }
  let a = [[0, o], [1, i]];
  if ((e & 4) !== 0) {
    const c = Math.min(t.u32(r), gn);
    a = [];
    for (let u = 0; u < c; u++) a.push([t.f32(r + 4 + u * 4), $t(t.u32(r + 4 + c * 4 + u * 4))]);
  } else if ((e & 8) !== 0) {
    const c = Math.min(t.u32(r), gn);
    a = [];
    for (let u = 0; u < c; u++) {
      const h = t.f32(r + 4 + c * 4 + u * 4);
      a.push([t.f32(r + 4 + u * 4), zn(o, i, Math.min(1, Math.max(0, h)))]);
    }
  }
  return a = a.filter((c) => Number.isFinite(c[0])).sort((c, u) => c[0] - u[0]), a.length ? { kind: "linear", rect: s, stops: a, wrap: n, xf: l } : null;
}
function al(t) {
  const e = t.u32(0), n = $t(t.u32(8)), s = Et(t, 12, 2);
  if (!s) return null;
  const o = Math.min(t.u32(20), gn), i = o > 0 ? $t(t.u32(24)) : n;
  let r = 24 + o * 4, l;
  if ((e & 1) !== 0) {
    const c = t.u32(r), u = Hn(t.tail(r + 4));
    l = u ? Zt(u) : null, r += 4 + c;
  } else {
    const c = t.u32(r), u = Ct(t, r + 4, c, !1);
    l = Zt(Re(u, !0)), r += 4 + 8 * Math.min(c, Kt);
  }
  if (!l) return null;
  const a = (e & 2) !== 0 ? se(t, r) : mt;
  return a ? { kind: "radial", center: [s[0], s[1]], radius: [(l[2] - l[0]) / 2, (l[3] - l[1]) / 2], stops: [[0, n], [1, i]], xf: a } : null;
}
function cl(t, e) {
  const n = t.u32(8), s = t.f32(16);
  let o = 20;
  for (const [r, l] of [[1, 24], [2, 4], [4, 4], [8, 4], [16, 4], [32, 4], [64, 4], [128, 4]]) (n & r) !== 0 && (o += l);
  for (const r of [256, 512, 1024])
    (n & r) !== 0 && (o += r === 512 ? 4 : 4 + 4 * Math.min(t.u32(o), Kt));
  for (const r of [2048, 4096]) (n & r) !== 0 && (o += 4 + Math.min(t.u32(o), 1 << 20));
  const i = Ao(t, o, e);
  return i ? { kind: "pen", color: bn(i), width: Number.isFinite(s) ? Math.min(1e5, Math.max(0, s)) : 0 } : null;
}
function Hn(t) {
  const e = Math.min(t.u32(4), Kt), n = t.u32(8);
  if ((n & 6144) !== 0) return null;
  const s = (n & 16384) !== 0, o = Ct(t, 12, e, s), i = t.slice(12 + e * (s ? 4 : 8), e), r = [];
  let l = 0;
  for (; l < e; ) {
    const a = i[l], c = o[l];
    if ((a & 7) === 0) r.push(q(c));
    else if ((a & 7) === 3 && l + 2 < e) {
      r.push(kt(c, o[l + 1], o[l + 2])), (i[l + 2] & 128) !== 0 && r.push(rt), l += 3;
      continue;
    } else r.push(et(c));
    (a & 128) !== 0 && r.push(rt), l++;
  }
  return r;
}
function ul(t) {
  const n = kn(t, 8, 0, { n: 0 });
  return n ? { kind: "region", area: n[0] } : null;
}
function kn(t, e, n, s) {
  if (s.n++, n > Kr || s.n > Os) return null;
  const o = t.u32(e);
  if (o === 268435456) {
    const i = Et(t, e + 4, 4);
    if (!i) return null;
    const [r, l, a, c] = i;
    return [re([Math.min(r, r + a), Math.min(l, l + c), Math.max(r, r + a), Math.max(l, l + c)]), 20];
  }
  if (o === 268435457) {
    const i = t.u32(e + 4);
    if (i < 12) return null;
    const r = t.sub(e + 8, i);
    if (s.n += Math.min(r.u32(4), Kt), s.n > Os) return null;
    const l = Hn(r);
    return l ? [Oo(l), 8 + i] : null;
  }
  if (o === 268435458) return [[], 4];
  if (o === 268435459) return [null, 4];
  if (o <= 5) {
    const i = kn(t, e + 4, n + 1, s);
    if (!i) return null;
    const r = kn(t, e + 4 + i[1], n + 1, s);
    return r ? [o === 0 ? r[0] : o === 1 ? $o(i[0], r[0]) : o === 2 ? To(i[0], r[0]) : i[0], 4 + i[1] + r[1]] : null;
  }
  return null;
}
function Oo(t) {
  const e = Ue(t);
  if (e.length === 1) {
    const s = we(e[0][0]);
    if (s) return s;
  }
  const n = Zt(t);
  return n ? re(n) : [];
}
function $o(t, e) {
  return t === null ? e : e === null ? t : t.length >= 3 && e.length >= 3 ? we(Dn(t, e)) ?? [] : [];
}
function To(t, e) {
  if (t === null || e === null) return null;
  if (t.length < 3) return e;
  if (e.length < 3) return t;
  const n = ze([...t, ...e]);
  return n ? re(n) : [];
}
function nn(t, e) {
  if (t === null) return null;
  const n = t.map((s) => yn(e, s));
  return n.length < 3 ? [] : we(n) ?? [];
}
function Is([t, e, n, s], o, i, r) {
  const l = (t + n) / 2, a = (e + s) / 2, c = (n - t) / 2, u = (s - e) / 2, h = Math.min(360, Math.max(-360, i)), f = (w) => {
    const v = w * Math.PI / 180;
    return Math.atan2(c * Math.sin(v), u * Math.cos(v));
  }, m = f(o);
  let d = Math.abs(h) >= 360 ? Math.sign(h) * Math.PI * 2 : f(o + h) - m;
  if (Math.abs(h) < 360) {
    for (; h > 0 && d < 0; ) d += Math.PI * 2;
    for (; h < 0 && d > 0; ) d -= Math.PI * 2;
  }
  const p = (w) => [l + c * Math.cos(w), a + u * Math.sin(w)], g = r ? [q([l, a]), et(p(m))] : [q(p(m))], b = Math.min(4, Math.max(1, Math.ceil(Math.abs(d) / (Math.PI / 2)))), k = d / b, y = 4 / 3 * Math.tan(k / 4);
  for (let w = 0; w < b; w++) {
    const v = m + k * w, S = m + k * (w + 1), $ = p(v), F = p(S);
    g.push(kt([$[0] - y * c * Math.sin(v), $[1] + y * u * Math.cos(v)], [F[0] + y * c * Math.sin(S), F[1] - y * u * Math.cos(S)], F));
  }
  return r && g.push(rt), g;
}
function hl(t) {
  const e = t.f32(4), n = Math.min(t.u32(20), 64), s = [];
  for (let i = 0; i < n; i++) s.push(t.u16(24 + i * 2));
  const o = ie(s, [])[0].replace(/\0+$/, "");
  return Number.isFinite(e) ? { kind: "font", font: { em: e, unit: t.u32(8), style: t.u32(12), family: o } } : null;
}
function Eo(t, e) {
  const n = t.u32(4);
  if (n === 1) {
    const s = pl(t);
    return s ? { kind: "bitmap", img: s } : null;
  }
  if (n === 2) {
    const s = fl(t, e);
    return s ? { kind: "meta", pic: s } : null;
  }
  return null;
}
function fl(t, e) {
  if (e + 1 > Jr) return null;
  const n = t.u32(12), s = ht(() => t.slice(16, n)) ?? t.tail(16).b;
  let o = null;
  try {
    o = No(s, e + 1);
  } catch {
    o = null;
  }
  return o && o.width > 0 && o.height > 0 ? o : null;
}
let No = () => {
  throw new Error("nested parse not set");
};
function dl(t) {
  No = t;
}
function pl(t) {
  const e = t.i32(8), n = t.i32(12), s = t.i32(16), o = t.u32(20), i = t.tail(28);
  if (t.u32(24) === 1) return Cr(i.b);
  if (e <= 0 || n <= 0 || e * n > fo) return null;
  const r = o >>> 8 & 255;
  let l = [], a = i;
  if ((o & 65536) !== 0) {
    const m = Math.min(i.u32(4), 256);
    for (let d = 0; d < m; d++) l.push($t(i.u32(8 + d * 4)));
    a = i.tail(8 + m * 4);
  }
  const c = Math.ceil(e * r / 8), u = Math.max(Math.abs(s), c), h = new Uint8Array(e * n * 4);
  for (let m = 0; m < n; m++) {
    const d = a.slice(m * u, c);
    for (let p = 0; p < e; p++) {
      let g;
      if ((r === 1 || r === 4 || r === 8) && l.length) {
        const b = p * r, k = d[b >> 3] >> 8 - r - b % 8 & (1 << r) - 1;
        g = l[k] ?? [0, 0, 0, 255];
      } else if (r === 24) {
        const b = p * 3;
        g = [d[b + 2], d[b + 1], d[b], 255];
      } else if (o === 139273 && r === 32) {
        const b = p * 4;
        g = [d[b + 2], d[b + 1], d[b], 255];
      } else if (o === 925707 && r === 32) {
        const b = p * 4, k = d[b + 3], y = (w) => k === 0 ? w : Math.min(255, Math.floor((w * 255 + (k >> 1)) / k));
        g = [y(d[b + 2]), y(d[b + 1]), y(d[b]), k];
      } else if (r === 32) {
        const b = p * 4;
        g = [d[b + 2], d[b + 1], d[b], d[b + 3]];
      } else if (o === 135174 && r === 16) {
        const b = d[p * 2] | d[p * 2 + 1] << 8, k = (y, w) => Math.floor(y * 255 / ((1 << w) - 1));
        g = [k(b >> 11, 5), k(b >> 5 & 63, 6), k(b & 31, 5), 255];
      } else if (r === 16) {
        const b = d[p * 2] | d[p * 2 + 1] << 8, k = (y) => Math.floor((y & 31) * 255 / 31);
        g = [k(b >> 10), k(b >> 5), k(b), 255];
      } else
        return null;
      if (g.some((b) => b === void 0)) return null;
      h.set(g, (m * e + p) * 4);
    }
  }
  const f = { w: e, h: n, bottomUp: s < 0, px: h };
  return f.bottomUp && (Bn(f, !1, !0), f.bottomUp = !1), f;
}
function ml(t, e, n) {
  const [s, o, i, r] = e[2] > 0 && e[3] > 0 ? e : [0, 0, t.w, t.h], l = Math.max(s, 0), a = Math.min(s + i, t.w), c = Math.max(o, 0), u = Math.min(o + r, t.h);
  if (a <= l || u <= c) return null;
  const h = n[2] / i, f = n[3] / r, m = l === 0 && c === 0 && a === t.w && u === t.h;
  return { img: { ...t, crop: m ? null : [l, c, a - l, u - c] }, dst: [n[0] + (l - s) * h, n[1] + (c - o) * f, (a - l) * h, (u - c) * f] };
}
function Ct(t, e, n, s) {
  const o = Math.min(n, Kt), i = [];
  for (let r = 0; r < o; r++)
    if (s) i.push([t.i16(e + r * 4), t.i16(e + r * 4 + 2)]);
    else {
      const l = t.f32(e + r * 8), a = t.f32(e + r * 8 + 4);
      if (!Number.isFinite(l) || !Number.isFinite(a)) return [];
      i.push([l, a]);
    }
  return i;
}
function _t(t, e, n, s) {
  const o = Ct(t, e, Math.min(n, Kt / 2) * 2, s), i = [];
  for (let r = 0; r + 1 < o.length; r += 2) i.push([o[r][0], o[r][1], o[r][0] + o[r + 1][0], o[r][1] + o[r + 1][1]]);
  return i;
}
function sn(t, e, n, s, o) {
  const i = t.length;
  if (i < 2) return [];
  const r = Math.min(10, Math.max(0, e)) / 3, l = (h) => t[n ? Ut(h, i) : Math.min(i - 1, Math.max(0, h))] ?? [0, 0], a = n ? 0 : Math.min(s, i - 1), c = n ? i : Math.min(o, i - 1 - a), u = [q(l(a))];
  for (let h = a; h < a + c; h++) {
    const f = l(h - 1), m = l(h), d = l(h + 1), p = l(h + 2);
    u.push(kt([m[0] + (d[0] - f[0]) * r, m[1] + (d[1] - f[1]) * r], [d[0] - (p[0] - m[0]) * r, d[1] - (p[1] - m[1]) * r], d));
  }
  return n && u.push(rt), u;
}
function Re(t, e) {
  const n = t.map((s, o) => o === 0 ? q(s) : et(s));
  return e && n.push(rt), n;
}
function Rs([t, e, n, s]) {
  const o = (t + n) / 2, i = (e + s) / 2, r = (n - t) / 2, l = (s - e) / 2, a = 0.55228475, c = r * a, u = l * a;
  return [
    q([o + r, i]),
    kt([o + r, i + u], [o + c, i + l], [o, i + l]),
    kt([o - c, i + l], [o - r, i + u], [o - r, i]),
    kt([o - r, i - u], [o - c, i - l], [o, i - l]),
    kt([o + c, i - l], [o + r, i - u], [o + r, i]),
    rt
  ];
}
const gl = ["arial", "arial black", "times new roman", "courier new", "verdana", "georgia", "tahoma", "trebuchet ms", "comic sans ms", "impact"];
function bl(t, e) {
  if (!gl.includes(t.trim().toLowerCase())) return null;
  const n = [];
  for (const s of e) {
    if (s < 3 || s > 97) return null;
    n.push(s + 29);
  }
  return n;
}
function Fs(t) {
  const e = String.fromCharCode(t);
  return " ilj.,:;'!|Iftr".includes(e) ? 0.3 : "mwMW".includes(e) ? 0.85 : /[A-Z0-9]/.test(e) ? 0.62 : t >= 11904 ? 1 : 0.52;
}
function xl(t, e, n) {
  if (n <= 0 || !Number.isFinite(e)) return [t];
  const s = (u) => {
    let h = u.length;
    for (; h > 0 && u[h - 1] === 32; ) h--;
    return h;
  }, o = (u) => u.reduce((h, f) => h + Fs(f) * n, 0), i = [];
  let r = [], l = 0;
  const a = [];
  let c = [];
  for (const u of t)
    c.push(u), u === 32 && (a.push(c), c = []);
  c.length && a.push(c);
  for (const u of a) {
    const h = s(u), f = o(u.slice(0, h)), m = o(u);
    if (r.length) {
      if (l + f <= e) {
        r.push(...u), l += m;
        continue;
      }
    } else if (f <= e) {
      r.push(...u), l = m;
      continue;
    }
    if (r.length && (i.push(r.slice(0, s(r))), r = []), f <= e) {
      r.push(...u), l = m;
      continue;
    }
    let d = 0;
    for (const p of u) {
      const g = Fs(p) * n;
      r.length ? d + g <= e ? (r.push(p), d += g) : (i.push(r.slice(0, s(r))), r = [p], d = g) : (r.push(p), d = g);
    }
    l = d;
  }
  return i.push(r.slice(0, s(r))), i;
}
class Yt extends Error {
  kind;
  constructor(e) {
    super(e === "NotMetafile" ? "not a WMF or EMF file" : e === "BadHeader" ? "metafile header is truncated or invalid" : "metafile has no readable records"), this.kind = e;
  }
}
const Io = 256, yl = 512, kl = 1179469088, Bs = 72 / 2540, wl = 13369376, Ml = 983040, vl = 0;
function Ro(t) {
  return t.optU32(0) === 1 && t.optU32(40) === kl;
}
function Fo(t, e = 0, n = !1) {
  if (!Ro(t)) throw new Yt("BadHeader");
  const s = t.optU32(4), o = ht(() => Mt(t, 8));
  if (s === void 0 || !o) throw new Yt("BadHeader");
  const [i, r, l, a] = o, c = Cl(t) ?? (l > i && a > r ? { rect: [i, r, l - i, a - r], size: null } : null), u = new Se();
  l > i && a > r && u.setClipSurface([i, r, l, a]);
  const h = Bo(t);
  h && u.setDeviceMm(h);
  const f = new rl(e, n);
  f.frame = c ? c.rect : null;
  let m = 0, d = Math.max(s, 88);
  for (; !u.full(); ) {
    const p = t.optU32(d), g = t.optU32(d + 4);
    if (p === void 0 || g === void 0 || g < 8 || g % 4 !== 0 || d + g > t.length) break;
    const b = t.sub(d, g);
    if (p === 14) break;
    p === 70 && b.optU32(12) === Yr ? b.length >= 16 && f.comment(u, b.tail(16)) : ht(() => Sl(u, p, b)), m++, d += g;
  }
  if (m === 0) throw new Yt("NoRecords");
  return !n && f.skippedDual && u.items.length === 0 ? Fo(t, e, !0) : { cv: u, frame: c };
}
function Bo(t) {
  const e = t.optI32(72), n = t.optI32(76), s = t.optI32(80), o = t.optI32(84);
  return e === void 0 || n === void 0 || s === void 0 || o === void 0 ? null : e > 0 && n > 0 && s > 0 && o > 0 ? [e / s, n / o] : null;
}
function Cl(t) {
  const e = ht(() => Mt(t, 24));
  if (!e) return null;
  const [n, s, o, i] = e;
  if (o <= n || i <= s) return null;
  const r = Bo(t);
  if (!r) return null;
  const l = r[0] / 100, a = r[1] / 100;
  return { rect: [n * l, s * a, (o - n) * l, (i - s) * a], size: [(o - n) * Bs, (i - s) * Bs] };
}
function Sl(t, e, n) {
  if (!t.full())
    switch (e) {
      case 9:
        t.setWindowExt(Pt(n, 8));
        break;
      case 10:
        t.setWindowOrg(Pt(n, 8));
        break;
      case 11:
        t.setViewportExt(Pt(n, 8));
        break;
      case 12:
        t.setViewportOrg(Pt(n, 8));
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
        t.modifyWorld(Ds(n, 8), 4);
        break;
      case 36: {
        const s = Ds(n, 8);
        t.modifyWorld(s, n.u32(32));
        break;
      }
      case 37:
        t.select(n.u32(8));
        break;
      case 38:
        El(t, n);
        break;
      case 95:
        Nl(t, n);
        break;
      case 39:
        Il(t, n);
        break;
      case 93:
      case 94:
        Rl(t, n, e === 93);
        break;
      case 82:
        Fl(t, n);
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
        Dl(t, n, e === 84);
        break;
      case 108:
        Ll(t, n);
        break;
      case 40:
        t.deleteObject(n.u32(8));
        break;
      case 29:
        t.excludeClipRect(Mt(n, 8));
        break;
      case 30:
        t.intersectClipRect(Mt(n, 8));
        break;
      case 75:
        Pl(t, n);
        break;
      case 27:
        t.moveTo(Pt(n, 8));
        break;
      case 54:
        t.lineTo(Pt(n, 8));
        break;
      case 42: {
        const [s, o, i, r] = Mt(n, 8);
        t.shape(lo(s, o, i, r), !0, !0);
        break;
      }
      case 43: {
        const [s, o, i, r] = Mt(n, 8);
        t.shape(wt(s, o, i, r), !0, !0);
        break;
      }
      case 44: {
        const s = n.i32(24), o = n.i32(28), [i, r, l, a] = Mt(n, 8);
        t.shape(ro(i, r, l, a, s, o), !0, !0);
        break;
      }
      case 45:
      case 46:
      case 47: {
        const [s, o, i] = Tl(n), r = e === 45 ? "arc" : e === 46 ? "chord" : "pie", [l, a, c, u] = s;
        t.shape(ao(l, a, c, u, o, i, r, t.arcClockwise), r !== "arc", !0);
        break;
      }
      // Beyond DeckCraft: arc direction, angle arcs, POLYDRAW, region fills, clip paths, palettes.
      case 57:
        t.arcClockwise = n.u32(8) === 2;
        break;
      case 41:
        Al(t, n);
        break;
      case 56:
      case 92:
        Ol(t, n, e === 56);
        break;
      case 71: {
        const s = on(n, 24, 32);
        t.fillRegion(s, n.u32(28));
        break;
      }
      case 74: {
        const s = on(n, 24, 28);
        t.fillRegion(s, null);
        break;
      }
      case 72: {
        const s = on(n, 24, 40);
        t.frameRegion(s, n.u32(28), n.i32(32), n.i32(36));
        break;
      }
      case 67:
        t.selectClipPath(n.u32(8));
        break;
      case 49:
        $l(t, n);
        break;
      case 48:
        t.selectPalette(n.u32(8));
        break;
      case 4:
      case 87:
        t.poly(ue(n, e === 4), !1, !1, !0);
        break;
      case 3:
      case 86:
        t.poly(ue(n, e === 3), !0, !0, !0);
        break;
      case 6:
      case 89:
        t.lineChain(ue(n, e === 6), !1, !0);
        break;
      // POLYBEZIER starts its own figure at the first point and leaves the current point alone;
      // POLYBEZIERTO continues from the current point.
      case 2:
      case 85: {
        const s = ue(n, e === 2);
        s.length && t.bezier(s[0], s.slice(1));
        break;
      }
      case 5:
      case 88:
        t.bezierTo(ue(n, e === 5));
        break;
      case 7:
      case 90: {
        const [s, o] = Ls(n, e === 7);
        t.shape(fn(o, s, !1), !1, !0);
        break;
      }
      case 8:
      case 91: {
        const [s, o] = Ls(n, e === 8);
        t.shape(fn(o, s, !0), !0, !0);
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
        jl(t, n, e === 77);
        break;
      case 80:
        zl(t, n);
        break;
      case 81:
        _l(t, n);
        break;
      case 114:
        Ul(t, n);
        break;
    }
}
function Pl(t, e) {
  const n = e.u32(8), s = e.u32(12);
  if (n === 0) {
    t.resetClip();
    return;
  }
  const o = 16;
  if (n < 32 || e.u32(o + 4) !== 1) return;
  const i = Math.min(e.u32(o + 8), qt), r = o + n, l = [];
  for (let a = 0; a < i; a++) {
    const c = o + 32 + a * 16;
    if (c + 16 > r) break;
    l.push(Mt(e, c));
  }
  t.selectClipRects(l, s);
}
function on(t, e, n) {
  const s = t.u32(e);
  if (s < 32 || t.u32(n + 4) !== 1) return [];
  const o = Math.min(t.u32(n + 8), qt * 64), i = [];
  for (let r = 0; r < o && 32 + r * 16 + 16 <= s; r++) i.push(Mt(t, n + 32 + r * 16));
  return i;
}
function Al(t, e) {
  const [n, s] = Pt(e, 8), o = e.u32(16), i = e.f32(20), r = e.f32(24);
  if (!Number.isFinite(i) || !Number.isFinite(r) || o > 1e7) return;
  const l = -(i * Math.PI) / 180, a = -(Math.max(-3600, Math.min(3600, r)) * Math.PI) / 180, c = [n + o * Math.cos(l), s + o * Math.sin(l)], u = [n + o * Math.cos(l + a), s + o * Math.sin(l + a)], h = [q(t.currentPos()), et(c), ...a !== 0 ? Xt(n, s, o, o, l, a) : []];
  t.setCurrentPos(u), t.shape(h, !1, !0);
}
function Ol(t, e, n) {
  const s = e.u32(24);
  if (s > oe) return;
  const o = e.tail(28).points(0, s, n), i = e.slice(28 + s * (n ? 8 : 4), s), r = [q(t.currentPos())];
  let l = t.currentPos();
  for (let a = 0; a < s; a++) {
    const c = i[a] & 6;
    c === 6 ? (r.push(q(o[a])), l = o[a]) : c === 4 && a + 2 < s ? (r.push(kt(o[a], o[a + 1], o[a + 2])), a += 2) : r.push(et(o[a])), i[a] & 1 ? (r.push(rt), t.setCurrentPos(l)) : t.setCurrentPos(o[a]);
  }
  t.shape(r, !1, !0);
}
function $l(t, e) {
  const n = e.u32(8), s = Math.min(e.u16(14), 1024), o = [];
  for (let i = 0; i < s; i++) o.push([e.u8(16 + i * 4), e.u8(17 + i * 4), e.u8(18 + i * 4), 255]);
  t.addObject(n, { kind: "palette", colors: o });
}
const Pt = (t, e) => [t.i32(e), t.i32(e + 4)], Mt = (t, e) => [t.i32(e), t.i32(e + 4), t.i32(e + 8), t.i32(e + 12)], Y = (t, e) => t.optI32(e) ?? 0;
function Ds(t, e) {
  return [0, 1, 2, 3, 4, 5].map((n) => t.f32(e + n * 4));
}
const Tl = (t) => [Mt(t, 8), Pt(t, 24), Pt(t, 32)];
function ue(t, e) {
  const n = t.u32(24);
  return n > oe ? [] : t.tail(28).points(0, n, e);
}
function Ls(t, e) {
  const n = t.u32(24);
  if (n > oe) return [[], []];
  t.slice(32, n * 4);
  const s = [];
  for (let i = 0; i < n; i++) s.push(t.u32(32 + i * 4));
  const o = s.reduce((i, r) => i + r, 0);
  return o > oe ? [[], []] : [s, t.tail(32 + n * 4).points(0, o, e)];
}
function El(t, e) {
  const n = e.u32(8), s = e.u32(12), o = e.i32(16), i = e.u32(24);
  t.addObject(n, { kind: "pen", pen: { style: s, width: o, color: t.colorOf(i) } });
}
function Nl(t, e) {
  const n = e.u32(8), s = e.u32(28), o = e.u32(32), i = e.u32(36), r = e.u32(40), l = (s & Ml) === vl ? 0 : o, a = i === jn ? _e : s & Mo;
  t.addObject(n, { kind: "pen", pen: { style: a, width: l, color: t.colorOf(r) } });
}
function Il(t, e) {
  const n = e.u32(8), s = e.u32(12), o = e.u32(16), i = St(s, t.colorOf(o));
  s === Un && (i.hatch = e.optU32(20) ?? 0), t.addObject(n, { kind: "brush", brush: i });
}
function Rl(t, e, n) {
  const s = e.u32(8), o = e.u32(12), i = e.u32(16), r = e.u32(20), l = e.u32(24), a = e.u32(28), c = ve(e.sub(i, r), e.sub(l, a), !1), u = c && Co(c, n || o === 1);
  u && t.addObject(s, { kind: "brush", brush: u });
}
function Fl(t, e) {
  const n = e.u32(8), s = e.i32(12), o = e.optI32(16) ?? 0, i = e.optI32(20) ?? 0, r = e.optI32(28) ?? 0, l = (h) => e.optU8(h) ?? 0, a = [];
  for (let h = 0; h < 32; h++) {
    const f = e.optU16(40 + 2 * h);
    if (f === void 0 || f === 0) break;
    a.push(f);
  }
  const [c] = ie(a, []), u = {
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
function Bl(t, e, n, s) {
  const o = (s & Nr) !== 0 ? 8 : 4;
  if (e === 0) return [];
  const i = [];
  for (let r = 0; r < n; r++) {
    const l = t.optI32(e + r * o);
    if (l === void 0) return [];
    i.push(l);
  }
  return i;
}
const Do = (t) => {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) e.push(t[n] | t[n + 1] << 8);
  return e;
};
function Dl(t, e, n) {
  const s = Pt(e, 36), o = Math.min(e.u32(44), He), i = e.u32(48), r = e.u32(52), [l, a] = (r & Io) !== 0 ? [null, e.u32(56)] : [ht(() => Mt(e, 56)) ?? null, e.u32(72)];
  if ((r & ko) !== 0) return;
  const c = Bl(e, a, o, r), [u, h] = n ? ie(Do(e.slice(i, o * 2)), c) : Ce(e.slice(i, o), t.fontCharset(), c);
  t.drawText(s, u, h, r, l);
}
function Ll(t, e) {
  const n = Pt(e, 8), s = Math.min(e.u32(16), He), o = e.u32(20);
  if ((o & ko) !== 0) return;
  const [i, r] = (o & Io) !== 0 ? [null, 36] : [ht(() => Mt(e, 36)) ?? null, 52], [l] = (o & yl) !== 0 ? Ce(e.slice(r, s), t.fontCharset(), []) : ie(Do(e.slice(r, s * 2)), []);
  t.drawText(n, l, [], o, i);
}
function jl(t, e, n) {
  const s = [Y(e, 24), Y(e, 28), Y(e, 32), Y(e, 36)], o = e.u32(40);
  if (Se.sourceless(o)) {
    t.fillRop(s, o);
    return;
  }
  const [i, r] = n ? [Y(e, 100), Y(e, 104)] : [s[2], s[3]];
  Xe(t, e, s, [Y(e, 44), Y(e, 48), i, r], [84, 92], { kind: "rop", rop: o });
}
function Ul(t, e) {
  const n = [Y(e, 24), Y(e, 28), Y(e, 32), Y(e, 36)], s = e.u8(42), o = (e.u8(43) & 1) !== 0;
  Xe(t, e, n, [Y(e, 44), Y(e, 48), Y(e, 100), Y(e, 104)], [84, 92], { kind: "alpha", constant: s, perPixel: o });
}
function _l(t, e) {
  const n = [Y(e, 24), Y(e, 28), Y(e, 72), Y(e, 76)], s = [Y(e, 32), Y(e, 36), Y(e, 40), Y(e, 44)];
  Xe(t, e, n, s, [48, 56], { kind: "rop", rop: e.u32(68) });
}
function zl(t, e) {
  const n = Y(e, 40), s = Y(e, 44);
  n <= 0 || s <= 0 || Xe(t, e, [Y(e, 24), Y(e, 28), n, s], [Y(e, 32), Y(e, 36) - e.u32(68), n, s], [48, 56], { kind: "rop", rop: wl });
}
function Xe(t, e, n, s, o, i) {
  const r = e.u32(o[0]), l = e.u32(o[0] + 4), a = e.u32(o[1]), c = e.u32(o[1] + 4);
  if (c === 0) return;
  const u = ve(e.sub(r, l), e.sub(a, c), i.kind === "alpha" && i.perPixel);
  if (!u) return;
  mo(u, i);
  const h = Fn(u, s.map(Math.trunc), n);
  h && t.bitmap(h.dst, h.img);
}
const Lo = 2596720087, Hl = 1440, Xl = 72 / 96;
function Wl(t) {
  if (t.optU32(0) === Lo) return !0;
  const e = t.optU16(0), n = t.optU16(2), s = t.optU16(4);
  return (e === 1 || e === 2) && n === 9 && (s === 256 || s === 768);
}
function Vl(t) {
  const e = t.optU32(0) === Lo;
  let n = 0, s = null;
  if (e) {
    const u = [6, 8, 10, 12].map((y) => t.optI16(y));
    if (u.some((y) => y === void 0)) throw new Yt("BadHeader");
    const [h, f, m, d] = u, p = t.optU16(14), g = p && p > 0 ? p : Hl, b = m - h, k = d - f;
    s = b > 0 && k > 0 ? { c: [h, f, m, d], size: [b * 72 / g, k * 72 / g] } : null, n = 22;
  }
  const o = t.optU16(n + 2);
  if (o === void 0 || o < 9) throw new Yt("BadHeader");
  let i = n + o * 2;
  const r = new Se();
  if (s) {
    const { c: u, size: h } = s;
    r.playInto([u[0], u[1], u[2] - u[0], u[3] - u[1]], h), r.setClipSurface([0, 0, h[0], h[1]]), r.patternPx = Xl;
  }
  let l = s !== null, a = 0;
  for (; !r.full(); ) {
    const u = t.optU32(i), h = t.optU16(i + 4);
    if (u === void 0 || h === void 0) break;
    const f = u * 2;
    if (f < 6 || i + f > t.length) break;
    const m = t.sub(i, f);
    if (h === 0) break;
    if (ht(() => Yl(r, h, m)), h === 524 && r.windowSet && !l && !r.viewportSet) {
      const d = r.map.we;
      r.playInto(null, [Math.abs(d[0]), Math.abs(d[1])]), l = !0;
    }
    a++, i += f;
  }
  if (a === 0) throw new Yt("NoRecords");
  let c;
  if (s && !r.viewportSet && r.map.usesExtents())
    c = { rect: [0, 0, s.size[0], s.size[1]], size: s.size };
  else if (s) {
    const u = s.c, h = r.map.device([u[0], u[1]]), f = r.map.device([u[2], u[3]]), m = [Math.min(h[0], f[0]), Math.min(h[1], f[1]), Math.abs(f[0] - h[0]), Math.abs(f[1] - h[1])];
    c = m[2] > 0 && m[3] > 0 ? { rect: m, size: s.size } : null;
  } else if (l && !r.viewportSet && r.map.usesExtents()) {
    const u = r.map.ve;
    c = { rect: [0, 0, u[0], u[1]], size: null };
  } else r.windowSet ? c = { rect: r.map.windowRect(), size: null } : c = null;
  return { cv: r, frame: c };
}
function Yl(t, e, n) {
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
        t.setWindowOrg(Dt(n, 6));
        break;
      case 524:
        t.setWindowExt(Dt(n, 6));
        break;
      case 525:
        t.setViewportOrg(Dt(n, 6));
        break;
      case 526:
        t.setViewportExt(Dt(n, 6));
        break;
      case 30:
        t.saveDc();
        break;
      case 295:
        t.restoreDc(n.i16(6));
        break;
      case 532:
        t.moveTo(Dt(n, 6));
        break;
      case 531:
        t.lineTo(Dt(n, 6));
        break;
      case 805:
        t.poly(Us(n), !1, !1, !0);
        break;
      case 804:
        t.poly(Us(n), !0, !0, !0);
        break;
      case 1336: {
        const s = ea(n);
        s && t.shape(s, !0, !0);
        break;
      }
      case 1051: {
        const [s, o, i, r] = Qt(n, 6);
        t.shape(wt(s, o, i, r), !0, !0);
        break;
      }
      case 1564: {
        const s = n.i16(8), o = n.i16(6), [i, r, l, a] = Qt(n, 10);
        t.shape(ro(i, r, l, a, s, o), !0, !0);
        break;
      }
      case 1045:
        t.excludeClipRect(Qt(n, 6));
        break;
      case 1046:
        t.intersectClipRect(Qt(n, 6));
        break;
      case 1048: {
        const [s, o, i, r] = Qt(n, 6);
        t.shape(lo(s, o, i, r), !0, !0);
        break;
      }
      case 2071:
      case 2074:
      case 2096: {
        const [s, o, i] = ta(n), r = e === 2071 ? "arc" : e === 2074 ? "pie" : "chord", [l, a, c, u] = s;
        t.shape(ao(l, a, c, u, o, i, r, t.arcClockwise), r !== "arc", !0);
        break;
      }
      case 762:
        Gl(t, n);
        break;
      case 764:
        ql(t, n);
        break;
      case 763:
        t.addObject(null, { kind: "font", font: ht(() => Kl(n)) ?? { font: { family: "", height: 0, width: 0, weight: 0, italic: !1, underline: !1, strike: !1, charset: 0 }, escapement: 0 } });
        break;
      case 322: {
        const s = ht(() => Zl(n)) ?? null;
        t.addObject(null, s ? { kind: "brush", brush: s } : { kind: "other" });
        break;
      }
      // A palette takes a handle slot; SELECTPALETTE makes PALETTEINDEX colours resolve against it.
      // (Beyond DeckCraft, which reads every palette colour as black.)
      case 247: {
        const s = ht(() => {
          const o = Math.min(n.u16(8), 1024), i = [];
          for (let r = 0; r < o; r++) i.push([n.u8(10 + r * 4), n.u8(11 + r * 4), n.u8(12 + r * 4), 255]);
          return i;
        });
        t.addObject(null, s ? { kind: "palette", colors: s } : { kind: "other" });
        break;
      }
      case 564:
        t.selectPalette(js(n.u16(6)));
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
        Jl(t, n);
        break;
      case 1313:
        Ql(t, n);
        break;
      // PATBLT: rop(4), height, width, y, x.
      case 1565:
        t.fillRop([H(n, 16), H(n, 14), H(n, 12), H(n, 10)], n.u32(6));
        break;
      case 301:
        t.select(js(n.u16(6)));
        break;
      case 496:
        t.deleteObject(n.u16(6));
        break;
      // STRETCHDIB: rop(4) usage(2) srcH srcW ySrc xSrc destH destW yDest xDest, then the DIB.
      case 3907: {
        const s = n.optU32(6) ?? 0;
        Xn(t, n, 28, s, [H(n, 26), H(n, 24), H(n, 22), H(n, 20)], [H(n, 18), H(n, 16), H(n, 14), H(n, 12)]);
        break;
      }
      case 2881:
        sa(t, n);
        break;
      case 2368:
        na(t, n);
        break;
    }
}
const js = (t) => (t & 32768) !== 0 ? (t & 32767 | 2147483648) >>> 0 : t, H = (t, e) => t.optI16(e) ?? 0;
function Gl(t, e) {
  const n = e.u16(6), s = e.i16(8), o = e.u32(12);
  t.addObject(null, { kind: "pen", pen: { style: n, width: s, color: t.colorOf(o) } });
}
function ql(t, e) {
  const n = e.u16(6), s = e.u32(8), o = St(n, t.colorOf(s));
  n === Un && (o.hatch = e.optU16(12) ?? 0), t.addObject(null, { kind: "brush", brush: o });
}
function Zl(t) {
  const e = t.u16(8), n = t.tail(10), s = Rn(n);
  if (s === null) return null;
  const o = ve(n.sub(0, s), n.tail(s), !1);
  return o ? Co(o, e === 1) : null;
}
function Kl(t) {
  const e = t.i16(6), n = t.optI16(8) ?? 0, s = t.optI16(10) ?? 0, o = t.optI16(14) ?? 0, i = (u) => t.optU8(u) ?? 0, r = t.b.subarray(Math.min(24, t.length), Math.min(56, t.length)), l = r.indexOf(0), a = l >= 0 ? r.subarray(0, l) : r, [c] = Ce(a, 0, []);
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
function Jl(t, e) {
  const n = e.i16(6), s = e.i16(8);
  let o = Math.min(e.u16(10), He);
  const i = e.u16(12), r = (i & (yo | Ln)) !== 0, l = r ? [H(e, 14), H(e, 16), H(e, 18), H(e, 20)] : null, a = r ? 22 : 14;
  o = Math.min(o, Math.max(0, e.length - a));
  const c = e.slice(a, o), u = a + o + o % 2, h = [];
  if (e.length >= u + 2 * o) for (let d = 0; d < o; d++) h.push(e.i16(u + 2 * d));
  const [f, m] = Ce(c, t.fontCharset(), h);
  t.drawText([s, n], f, m, i, l);
}
function Ql(t, e) {
  const n = Math.min(e.u16(6), He), s = e.slice(8, n), o = 8 + n + n % 2, i = e.i16(o), r = e.i16(o + 2), [l] = Ce(s, t.fontCharset(), []);
  t.drawText([r, i], l, [], 0, null);
}
const Dt = (t, e) => [t.i16(e + 2), t.i16(e)];
function Qt(t, e) {
  const n = t.i16(e), s = t.i16(e + 2), o = t.i16(e + 4);
  return [t.i16(e + 6), o, s, n];
}
const ta = (t) => {
  const e = Dt(t, 6), n = Dt(t, 10);
  return [Qt(t, 14), n, e];
}, Us = (t) => t.tail(8).points(0, t.u16(6), !1);
function ea(t) {
  const e = t.u16(6), n = [];
  for (let i = 0; i < e; i++) n.push(t.u16(8 + i * 2));
  const s = n.reduce((i, r) => i + r, 0);
  if (s > oe) return null;
  const o = t.tail(8 + e * 2).points(0, s, !1);
  return fn(o, n, !0);
}
const jo = (t, e) => Math.floor(e.length / 2) > (t >> 8) + 3;
function na(t, e) {
  const n = e.u32(6);
  if (!jo(2368, e)) {
    t.fillRop([H(e, 22), H(e, 20), H(e, 18), H(e, 16)], n);
    return;
  }
  const s = [H(e, 20), H(e, 18), H(e, 16), H(e, 14)];
  if (Se.sourceless(n)) {
    t.fillRop(s, n);
    return;
  }
  Xn(t, e, 22, n, s, [H(e, 12), H(e, 10), s[2], s[3]]);
}
function sa(t, e) {
  const n = e.u32(6);
  if (!jo(2881, e)) {
    t.fillRop([H(e, 26), H(e, 24), H(e, 22), H(e, 20)], n);
    return;
  }
  const s = [H(e, 24), H(e, 22), H(e, 20), H(e, 18)];
  if (Se.sourceless(n)) {
    t.fillRop(s, n);
    return;
  }
  Xn(t, e, 26, n, s, [H(e, 16), H(e, 14), H(e, 12), H(e, 10)]);
}
function Xn(t, e, n, s, o, i) {
  const r = e.tail(n), l = Rn(r);
  if (l === null) return;
  const a = ve(r.sub(0, l), r.tail(l), !1);
  if (!a) return;
  mo(a, { kind: "rop", rop: s });
  const c = Fn(a, i, o);
  c && t.bitmap(c.dst, c.img);
}
const oa = (() => {
  const t = new Uint32Array(256);
  for (let e = 0; e < 256; e++) {
    let n = e;
    for (let s = 0; s < 8; s++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    t[e] = n >>> 0;
  }
  return t;
})();
function ia(t, e, n) {
  let s = 4294967295;
  for (let o = e; o < n; o++) s = oa[(s ^ t[o]) & 255] ^ s >>> 8;
  return (s ^ 4294967295) >>> 0;
}
function rn(t, e) {
  const n = new Uint8Array(12 + e.length), s = new DataView(n.buffer);
  s.setUint32(0, e.length);
  for (let o = 0; o < 4; o++) n[4 + o] = t.charCodeAt(o);
  return n.set(e, 8), s.setUint32(8 + e.length, ia(n, 4, 8 + e.length)), n;
}
function Wn(t, e, n) {
  const s = new Uint8Array(13), o = new DataView(s.buffer);
  o.setUint32(0, t), o.setUint32(4, e), s[8] = 8, s[9] = 6;
  const i = new Uint8Array(e * (t * 4 + 1));
  for (let c = 0; c < e; c++) {
    const u = c * (t * 4 + 1);
    i[u] = 0, i.set(n.subarray(c * t * 4, (c + 1) * t * 4), u + 1);
  }
  const r = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), rn("IHDR", s), rn("IDAT", Wo(i, { level: 6 })), rn("IEND", new Uint8Array(0))], l = new Uint8Array(r.reduce((c, u) => c + u.length, 0));
  let a = 0;
  for (const c of r)
    l.set(c, a), a += c.length;
  return l;
}
function Me(t) {
  let e = "";
  for (let s = 0; s < t.length; s += 32768) e += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(e);
}
const _s = 1854 / 2048, zs = 434 / 2048, ra = 904 / 2048, la = 12, j = (t) => {
  const e = Math.round(t * 1e3) / 1e3;
  return Object.is(e, -0) ? "0" : String(e);
}, ln = (t) => t.replace(new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]", "g"), "").replace(/[&<>"]/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e]), be = (t) => `rgb(${t[0]},${t[1]},${t[2]})`, xe = (t, e) => t[3] < 255 ? ` ${e}="${j(t[3] / 255)}"` : "";
function Hs(t) {
  let e = "";
  for (const n of t)
    n.k === "M" ? e += `M${j(n.x)} ${j(n.y)}` : n.k === "L" ? e += `L${j(n.x)} ${j(n.y)}` : n.k === "C" ? e += `C${j(n.x1)} ${j(n.y1)} ${j(n.x2)} ${j(n.y2)} ${j(n.x)} ${j(n.y)}` : e += "Z";
  return e;
}
function aa(t, e = {}) {
  const n = e.width ?? t.width * 96 / 72, s = e.height ?? t.height * 96 / 72, o = [], i = [], r = { clip: /* @__PURE__ */ new Map(), tile: /* @__PURE__ */ new Map(), tileByContent: /* @__PURE__ */ new Map(), next: 0 }, l = (h) => `${h}${r.next++}`, a = (h) => {
    if (!h) return null;
    const f = JSON.stringify(h);
    let m = r.clip.get(f);
    return m || (m = l("r"), r.clip.set(f, m), o.push(`<clipPath id="${m}">${h.map(([d, p, g, b]) => `<rect x="${j(d)}" y="${j(p)}" width="${j(g - d)}" height="${j(b - p)}"/>`).join("")}</clipPath>`)), m;
  }, c = (h, f) => {
    if (f && f.length === 0) return "";
    const m = a(f);
    return m ? `<g clip-path="url(#${m})">${h}</g>` : h;
  }, u = (h) => {
    let f = r.tile.get(h);
    if (!f) {
      const m = h.width * h.cell[0], d = h.height * h.cell[1], p = `data:image/png;base64,${Me(Wn(h.width, h.height, h.rgba))}`, g = `${j(h.origin[0])},${j(h.origin[1])},${j(m)},${j(d)},${p}`;
      if (f = r.tileByContent.get(g), f)
        return r.tile.set(h, f), f;
      f = l("p"), r.tile.set(h, f), r.tileByContent.set(g, f), o.push(`<pattern id="${f}" patternUnits="userSpaceOnUse" x="${j(h.origin[0])}" y="${j(h.origin[1])}" width="${j(m)}" height="${j(d)}"><image href="${p}" width="${j(m)}" height="${j(d)}" preserveAspectRatio="none" style="image-rendering:pixelated"/></pattern>`);
    }
    return f;
  };
  for (const h of t.items) i.push(ca(h, c, u, l, o));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${j(n)}" height="${j(s)}" viewBox="0 0 ${j(t.width)} ${j(t.height)}" preserveAspectRatio="none">` + (o.length ? `<defs>${o.join("")}</defs>` : "") + i.join("") + "</svg>";
}
function ca(t, e, n, s, o) {
  switch (t.kind) {
    case "path": {
      const i = t.fill ? `fill="${be(t.fill)}"${xe(t.fill, "fill-opacity")}` : 'fill="none"';
      let r = "";
      if (t.stroke) {
        const [a, c] = t.stroke;
        r = c > 0 ? ` stroke="${be(a)}"${xe(a, "stroke-opacity")} stroke-width="${j(c)}" stroke-linejoin="round" stroke-linecap="round"` : ` stroke="${be(a)}"${xe(a, "stroke-opacity")} stroke-width="1" vector-effect="non-scaling-stroke"`;
      }
      const l = t.evenOdd && t.fill ? ' fill-rule="evenodd"' : "";
      return e(`<path d="${Hs(t.segs)}" ${i}${l}${r}/>`, t.region);
    }
    case "pattern":
      return e(`<path d="${Hs(t.segs)}" fill="url(#${n(t.tile)})"${t.evenOdd ? ' fill-rule="evenodd"' : ""}/>`, t.region);
    case "bitmap":
      return e(ua(t.rect, t.img), t.region);
    case "text":
      return e(da(t.text, s, o), t.text.region);
  }
}
function ua([t, e, n, s], o) {
  if (n <= 0 || s <= 0) return "";
  if (!Nt(o)) {
    if (o.w < 1 || o.h < 1 || o.px.length !== o.w * o.h * 4) return "";
    const m = `data:image/png;base64,${Me(Wn(o.w, o.h, o.px))}`, d = n / o.w > 3 || s / o.h > 3 ? ' style="image-rendering:pixelated"' : "";
    return `<image href="${m}" x="${j(t)}" y="${j(e)}" width="${j(n)}" height="${j(s)}" preserveAspectRatio="none"${d}/>`;
  }
  const i = `data:${o.mime};base64,${Me(o.bytes)}`, [r, l, a, c] = o.crop ?? [0, 0, o.w, o.h], u = !!o.flip?.[0], h = !!o.flip?.[1], f = u || h ? ` transform="translate(${j(u ? 2 * r + a : 0)} ${j(h ? 2 * l + c : 0)}) scale(${u ? -1 : 1} ${h ? -1 : 1})"` : "";
  return `<svg x="${j(t)}" y="${j(e)}" width="${j(n)}" height="${j(s)}" viewBox="${j(r)} ${j(l)} ${j(a)} ${j(c)}" preserveAspectRatio="none" overflow="hidden"><g${f}><image href="${i}" width="${o.w}" height="${o.h}" preserveAspectRatio="none"/></g></svg>`;
}
function ha(t) {
  return /courier|consolas|mono|lucida console|fixedsys|terminal/i.test(t) ? "monospace" : /times|roman|georgia|garamond|cambria|book antiqua|palatino|serif/i.test(t) && !/sans/i.test(t) ? "serif" : "sans-serif";
}
function fa(t) {
  return " ilj.,:;'!|Iftr".includes(t) ? 0.28 : "mwMW".includes(t) ? 0.83 : /[A-Z0-9]/.test(t) ? 0.64 : (t.codePointAt(0) ?? 0) >= 11904 ? 1 : 0.53;
}
function da(t, e, n) {
  const s = t.font, o = s.family.trim() || "Arial", i = s.height < 0 ? -s.height : s.height > 0 ? s.height / (_s + zs) : la;
  if (!(i > 0) || !Number.isFinite(i)) return "";
  const r = [...t.text].map((D) => ga(o, D));
  if (!r.length) return "";
  const l = t.dx.length === r.length && t.dx.length > 0;
  let a, c = null, u = 1;
  if (l) {
    c = [];
    let D = 0;
    for (const E of t.dx)
      c.push(D), D += E;
    a = D;
  } else
    a = r.reduce((D, E) => D + fa(E) * i, 0), s.width > 0 && (u = Math.min(20, Math.max(0.05, s.width / (ra * i))), a *= u);
  const h = t.hAlign === "left" ? 0 : t.hAlign === "center" ? -a / 2 : -a, f = _s * i, m = zs * i, d = t.vAlign === "baseline" ? 0 : t.vAlign === "top" ? f : -m, [p, g, b, k, y, w] = t.transform;
  let v = "";
  t.background && a > 0 && (v += `<rect x="${j(h)}" y="${j(d - f)}" width="${j(a)}" height="${j(f + m)}" fill="${be(t.background)}"${xe(t.background, "fill-opacity")}/>`);
  const S = [s.underline && "underline", s.strike && "line-through"].filter(Boolean).join(" "), $ = [
    `font-family="${ln(`'${o.replace(/'/g, "")}', ${ha(o)}`)}"`,
    `font-size="${j(i)}"`,
    s.weight >= 600 ? 'font-weight="bold"' : "",
    s.italic ? 'font-style="italic"' : "",
    S ? `text-decoration="${S}"` : "",
    `fill="${be(t.color)}"${xe(t.color, "fill-opacity")}`,
    'xml:space="preserve"'
  ].filter(Boolean).join(" ");
  if (c) {
    const D = c.map((E) => j(h + E)).join(" ");
    v += `<text x="${D}" y="${j(d)}" ${$}>${ln(r.join(""))}</text>`;
  } else {
    const D = t.hAlign === "center" ? "middle" : t.hAlign === "right" ? "end" : "start", E = `<text x="0" y="${j(d)}" text-anchor="${D}" ${$}>${ln(r.join(""))}</text>`;
    v += u !== 1 ? `<g transform="scale(${j(u)} 1)">${E}</g>` : E;
  }
  let F = `<g transform="matrix(${[p, g, b, k, y, w].map(j).join(" ")})">${v}</g>`;
  if (t.clip) {
    const D = e("c"), [E, L, T, A] = t.clip;
    n.push(`<clipPath id="${D}"><rect x="${j(E)}" y="${j(L)}" width="${j(T - E)}" height="${j(A - L)}"/></clipPath>`), F = `<g clip-path="url(#${D})">${F}</g>`;
  }
  return F;
}
const pa = (() => {
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
})(), ma = {
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
function ga(t, e) {
  const n = t.toLowerCase();
  let s = e.codePointAt(0) ?? 0;
  const o = s >= 61440 && s <= 61695;
  if (o && (s -= 61440), n === "symbol") {
    const i = pa[s];
    return i ? String.fromCodePoint(i) : o ? String.fromCodePoint(s) : e;
  }
  return n.startsWith("wingdings") || n.startsWith("webdings") ? s <= 32 ? " " : String.fromCodePoint(n === "wingdings" && ma[s] || 8226) : o ? String.fromCodePoint(s) : e;
}
function Uo(t, e = 0) {
  const n = new Gt(t);
  let s;
  if (Ro(n)) s = Fo(n, e);
  else if (Wl(n)) s = Vl(n);
  else throw new Yt("NotMetafile");
  return xa(s.cv.items, s.frame);
}
dl(Uo);
function ba(t) {
  let e;
  try {
    e = Uo(t);
  } catch {
    return null;
  }
  if (!e.items.length || !(e.width > 0) || !(e.height > 0)) return null;
  const n = Math.max(1, Math.round(e.width * 96 / 72)), s = Math.max(1, Math.round(e.height * 96 / 72)), o = aa(e, { width: n, height: s });
  return { url: `data:image/svg+xml;base64,${Me(new TextEncoder().encode(o))}`, w: n, h: s, svg: o };
}
const xt = (t) => Number.isFinite(t);
function xa(t, e) {
  const n = e && e.rect.every(xt) && e.rect[2] > 0 && e.rect[3] > 0 ? e : null;
  let s, o;
  if (n)
    s = n.rect, o = n.size ?? [n.rect[2], n.rect[3]];
  else {
    const f = ya(t);
    if (!f) return { width: 0, height: 0, items: [] };
    const [m, d, p, g] = f;
    s = [m, d, p - m, g - d], o = [p - m, g - d];
  }
  const i = s[2] > 0 ? o[0] / s[2] : 1, r = s[3] > 0 ? o[1] / s[3] : 1, l = (f) => [(f[0] - s[0]) * i, (f[1] - s[1]) * r], a = (i + r) / 2, c = Math.hypot(o[0], o[1]), u = /* @__PURE__ */ new Map(), h = [];
  for (const f of t)
    if (f.kind === "path") {
      const m = Xs(f.ops, l);
      if (!m || m.length < 2) continue;
      let d = null;
      if (f.stroke) {
        const g = Math.min(f.stroke[1] * a, c);
        if (!xt(g)) continue;
        d = [f.stroke[0], g];
      }
      const p = Ee(f.region, l);
      if (p === void 0) continue;
      h.push({ kind: "path", segs: m, fill: f.fill, stroke: d, evenOdd: f.evenOdd, region: p });
    } else if (f.kind === "bitmap") {
      const [m, d] = l([f.rect[0], f.rect[1]]), p = [m, d, f.rect[2] * i, f.rect[3] * r], g = Ee(f.region, l);
      if (!p.every(xt) || g === void 0) continue;
      h.push({ kind: "bitmap", rect: p, img: f.img, region: g });
    } else if (f.kind === "pattern") {
      const m = Xs(f.ops, l);
      if (!m || m.length < 2) continue;
      let d = u.get(f.tile);
      if (!d) {
        const [g, b] = l([0, 0]);
        if (d = { width: f.tile.w, height: f.tile.h, rgba: f.tile.px, cell: [f.tile.cell * i, f.tile.cell * r], origin: [g, b] }, ![...d.cell, ...d.origin].every(xt)) continue;
        u.set(f.tile, d);
      }
      const p = Ee(f.region, l);
      if (p === void 0) continue;
      h.push({ kind: "pattern", segs: m, evenOdd: f.evenOdd, tile: d, region: p });
    } else {
      const m = { ...f.text }, [d, p, g, b, k, y] = m.transform, [w, v] = l([k, y]);
      if (m.transform = [d * i, p * r, g * i, b * r, w, v], !m.transform.every(xt)) continue;
      if (m.clip) {
        const [$, F, D, E] = m.clip, L = l([$, F]), T = l([D, E]);
        if (m.clip = [Math.min(L[0], T[0]), Math.min(L[1], T[1]), Math.max(L[0], T[0]), Math.max(L[1], T[1])], !m.clip.every(xt)) continue;
      }
      const S = Ee(f.region, l);
      if (S === void 0) continue;
      m.region = S, h.push({ kind: "text", text: m });
    }
  return { width: xt(o[0]) ? o[0] : 0, height: xt(o[1]) ? o[1] : 0, items: h };
}
function Ee(t, e) {
  if (!t) return null;
  const n = [];
  for (const [s, o, i, r] of t) {
    const l = e([s, o]), a = e([i, r]), c = [Math.min(l[0], a[0]), Math.min(l[1], a[1]), Math.max(l[0], a[0]), Math.max(l[1], a[1])];
    if (!c.every(xt)) return;
    n.push(c);
  }
  return n;
}
function Xs(t, e) {
  const n = [];
  for (const s of t) {
    if (s.k === "Z") {
      n.push({ k: "Z" });
      continue;
    }
    if (s.k === "C") {
      const i = e(s.a), r = e(s.b), l = e(s.p);
      if (![...i, ...r, ...l].every(xt)) return null;
      n.push({ k: "C", x1: i[0], y1: i[1], x2: r[0], y2: r[1], x: l[0], y: l[1] });
      continue;
    }
    const o = e(s.p);
    if (!o.every(xt)) return null;
    n.push({ k: s.k, x: o[0], y: o[1] });
  }
  return n;
}
function ya(t) {
  let e = null;
  const n = (s) => {
    !xt(s[0]) || !xt(s[1]) || (e = e ? [Math.min(e[0], s[0]), Math.min(e[1], s[1]), Math.max(e[2], s[0]), Math.max(e[3], s[1])] : [s[0], s[1], s[0], s[1]]);
  };
  for (const s of t)
    if (s.kind === "path" || s.kind === "pattern")
      for (const o of s.ops)
        o.k === "M" || o.k === "L" ? n(o.p) : o.k === "C" && (n(o.a), n(o.b), n(o.p));
    else s.kind === "bitmap" ? (n([s.rect[0], s.rect[1]]), n([s.rect[0] + s.rect[2], s.rect[1] + s.rect[3]])) : n([s.text.transform[4], s.text.transform[5]]);
  return e;
}
const Ws = 4e7, ot = {
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
function ka(t) {
  return t.length >= 8 && (t[0] === 73 && t[1] === 73 && t[2] === 42 && t[3] === 0 || t[0] === 77 && t[1] === 77 && t[2] === 0 && t[3] === 42);
}
function wa(t) {
  try {
    return va(t);
  } catch {
    return null;
  }
}
function Ma(t) {
  const e = wa(t);
  return e ? { url: `data:image/png;base64,${Me(Wn(e.w, e.h, e.rgba))}`, w: e.w, h: e.h } : null;
}
function va(t) {
  if (!ka(t)) return null;
  const e = t[0] === 73, n = new DataView(t.buffer, t.byteOffset, t.byteLength), s = (R, U) => {
    if (R < 0 || R + U > t.length) throw new RangeError("short");
  }, o = (R) => (s(R, 2), n.getUint16(R, e)), i = (R) => (s(R, 4), n.getUint32(R, e)), r = i(4), l = o(r), a = /* @__PURE__ */ new Map(), c = { 1: 1, 2: 1, 3: 2, 4: 4, 6: 1, 7: 1, 8: 2, 9: 4, 16: 8 };
  for (let R = 0; R < l; R++) {
    const U = r + 2 + R * 12, G = o(U), W = o(U + 2), X = i(U + 4), z = c[W];
    if (!z || X > 1 << 24) continue;
    const st = z * X, ft = st <= 4 ? U + 8 : i(U + 8);
    s(ft, st);
    const J = new Array(X);
    for (let gt = 0; gt < X; gt++) {
      const dt = ft + gt * z;
      J[gt] = z === 1 ? t[dt] : z === 2 ? n.getUint16(dt, e) : z === 4 ? n.getUint32(dt, e) : Number(n.getBigUint64(dt, e));
    }
    a.set(G, J);
  }
  const u = (R, U) => a.get(R)?.[0] ?? U, h = u(ot.width) ?? 0, f = u(ot.height) ?? 0;
  if (!h || !f || h * f > Ws) return null;
  const m = u(ot.samples, 1), d = a.get(ot.bits) ?? [1], p = d[0];
  if (d.some((R) => R !== p)) return null;
  const g = u(ot.compression, 1), b = u(ot.photometric), k = u(ot.predictor, 1);
  if ((u(ot.planar, 1) ?? 1) !== 1 && m > 1 || (a.get(ot.sampleFormat) ?? [1]).some((R) => R !== 1) || ![1, 5, 8, 32946, 32773].includes(g) || k !== 1 && k !== 2 || b === void 0) return null;
  const y = a.get(ot.extra) ?? [];
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
  const S = m > v ? y[0] ?? 0 : 0, $ = S === 1 || S === 2;
  let F = null;
  if (w === "palette" && (F = a.get(ot.colorMap) ?? null, !F || F.length < 3 * (1 << p)))
    return null;
  const D = a.has(ot.tileOffsets), E = D ? u(ot.tileW, 0) : h, L = D ? u(ot.tileH, 0) : Math.min(f, u(ot.rowsPerStrip, f) || f);
  if (!E || !L || E * L > Ws) return null;
  const T = a.get(D ? ot.tileOffsets : ot.stripOffsets), A = a.get(D ? ot.tileBytes : ot.stripBytes);
  if (!T) return null;
  const I = Math.ceil(h / E), B = Math.ceil(f / L);
  if (T.length < I * B) return null;
  const C = Math.ceil(E * m * p / 8), P = new Uint8Array(h * f * 4), O = p === 16 ? 2 : 1;
  for (let R = 0; R < B; R++)
    for (let U = 0; U < I; U++) {
      const G = R * I + U, W = T[G], X = A?.[G] ?? t.length - W;
      if (W >= t.length) continue;
      const z = t.subarray(W, Math.min(t.length, W + X)), st = D ? L : Math.min(L, f - R * L), ft = C * st, J = Pa(z, g, ft);
      if (!J) return null;
      k === 2 && Sa(J, st, C, m, p, e);
      const gt = U * E, dt = R * L;
      for (let pt = 0; pt < st; pt++) {
        const Pe = dt + pt;
        if (Pe >= f) break;
        const le = pt * C;
        if (le >= J.length) break;
        for (let Z = 0; Z < E; Z++) {
          const lt = gt + Z;
          if (lt >= h) break;
          const Ae = Z * m, vt = (nt) => Ca(J, le, Ae + nt, p, e), at = (Pe * h + lt) * 4;
          if (w === "grey") {
            const nt = p === 16 ? 65535 : (1 << p) - 1;
            let bt = Math.round(vt(0) / nt * 255);
            b === 0 && (bt = 255 - bt), P[at] = P[at + 1] = P[at + 2] = bt;
          } else if (w === "palette") {
            const nt = vt(0), bt = 1 << p;
            P[at] = F[nt] >> 8, P[at + 1] = F[bt + nt] >> 8, P[at + 2] = F[2 * bt + nt] >> 8;
          } else if (w === "rgb") {
            const nt = O === 2 ? (bt) => vt(bt) >> 8 : vt;
            P[at] = nt(0), P[at + 1] = nt(1), P[at + 2] = nt(2);
          } else {
            const nt = vt(3);
            P[at] = (255 - vt(0)) * (255 - nt) / 255 | 0, P[at + 1] = (255 - vt(1)) * (255 - nt) / 255 | 0, P[at + 2] = (255 - vt(2)) * (255 - nt) / 255 | 0;
          }
          if ($) {
            const nt = p === 16 ? vt(v) >> 8 : p === 8 ? vt(v) : Math.round(vt(v) / ((1 << p) - 1) * 255);
            if (P[at + 3] = nt, S === 1 && nt > 0 && nt < 255)
              for (let bt = 0; bt < 3; bt++) P[at + bt] = Math.min(255, Math.round(P[at + bt] * 255 / nt));
          } else P[at + 3] = 255;
        }
      }
    }
  return { w: h, h: f, rgba: P };
}
function Ca(t, e, n, s, o) {
  if (s === 8) return t[e + n] ?? 0;
  if (s === 16) {
    const l = e + n * 2, a = t[l] ?? 0, c = t[l + 1] ?? 0;
    return o ? a | c << 8 : a << 8 | c;
  }
  const i = n * s;
  return (t[e + (i >> 3)] ?? 0) >> 8 - s - (i & 7) & (1 << s) - 1;
}
function Sa(t, e, n, s, o, i) {
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
function Pa(t, e, n) {
  let s;
  switch (e) {
    case 1:
      s = t;
      break;
    case 32773:
      s = Aa(t, n);
      break;
    case 5:
      s = Oa(t, n);
      break;
    case 8:
    case 32946: {
      try {
        s = Vo(t);
      } catch {
        try {
          s = Yo(t);
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
function Aa(t, e) {
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
function Oa(t, e) {
  const n = new Uint8Array(e), s = new Int32Array(4096), o = new Uint8Array(4096), i = new Int32Array(4096);
  for (let d = 0; d < 256; d++)
    s[d] = -1, o[d] = d, i[d] = 1;
  let r = 258, l = 9, a = 0, c = -1, u = 0;
  const h = t.length * 8, f = () => {
    if (u + l > h) return 257;
    let d = 0;
    for (let p = 0; p < l; p++) {
      const g = u + p;
      d = d << 1 | t[g >> 3] >> 7 - (g & 7) & 1;
    }
    return u += l, d;
  }, m = (d) => {
    const p = i[d];
    let g = a + p, b = d;
    const k = (() => {
      let y = d;
      for (; s[y] >= 0; ) y = s[y];
      return o[y];
    })();
    if (g > e) {
      let y = g - e;
      for (g = e; y-- > 0; ) b = s[b];
    }
    for (let y = g - 1; y >= a && b >= 0; y--)
      n[y] = o[b], b = s[b];
    return a = g, k;
  };
  for (; a < e; ) {
    const d = f();
    if (d === 257) break;
    if (d === 256) {
      r = 258, l = 9, c = -1;
      continue;
    }
    if (c < 0) {
      if (d > 255) break;
      m(d), c = d;
      continue;
    }
    let p;
    if (d < r)
      p = m(d);
    else if (d === r) {
      let g = c;
      for (; s[g] >= 0; ) g = s[g];
      p = o[g], r < 4096 && (s[r] = c, o[r] = p, i[r] = i[c] + 1), m(r), r++, c = d, r + 1 >= 1 << l && l < 12 && l++;
      continue;
    } else break;
    r < 4096 && (s[r] = c, o[r] = p, i[r] = i[c] + 1, r++), c = d, r + 1 >= 1 << l && l < 12 && l++;
  }
  return n.subarray(0, a);
}
const $a = 80, Ta = "default-layer", K = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const e = t.hex.replace("#", "");
  return `rgba(${parseInt(e.slice(0, 2), 16)}, ${parseInt(e.slice(2, 4), 16)}, ${parseInt(e.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, Ea = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, Na = /(courier|consolas|mono|menlo|code)/i;
function wn(t) {
  if (!t) return "sans-serif";
  const e = oi(t);
  return e || (Na.test(t) ? "monospace" : Ea.test(t) ? "serif" : "sans-serif");
}
function Ia(t) {
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
const Ra = (t, e, n) => t.map((s) => s.op === "Z" ? s : s.op === "C" ? { ...s, x1: s.x1 + e, y1: s.y1 + n, x2: s.x2 + e, y2: s.y2 + n, x: s.x + e, y: s.y + n } : { ...s, x: s.x + e, y: s.y + n });
function Fa(t, e, n) {
  let s = !1;
  t.forEach((o, i) => {
    o.start === "click" && (s = !0);
    const r = e.itemEls?.get(o.target);
    if (!r?.length) {
      e.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    r.forEach((l, a) => {
      const c = qo(a === 0 ? o : { ...o, start: "with", delayMs: o.delayMs }, n("anim"), !s);
      c.order = i + a / (r.length + 1), (l.animations ??= []).push(c);
    });
  });
}
function Ba(t, e) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return ni(t.action);
  const n = e.slideIds?.get(t.key);
  return n ? si(n) : null;
}
async function Da(t) {
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
async function La(t, e) {
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
    const r = await Da(i);
    r && o.set(i, r);
  })), o;
}
async function ja(t, e, n, s) {
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
function Ft(t, e, n, s) {
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
    layerId: Ta,
    groupIds: [...s].reverse(),
    // innermost first, the store's convention
    name: n.name
  };
}
function Vs(t, e, n) {
  switch (e.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = K(e.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = e.kind, t.backgroundColor = K(e.stops[0]?.color), t.gradientStops = e.stops.map((s) => ({ offset: s.pos, color: K(s.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
      break;
    case "pattern": {
      t.backgroundColor = K(e.color), t.fillStyle = "pattern", t.patternFill = Qa(e.preset, K(e.color), e.bg ? K(e.bg) : "transparent");
      break;
    }
    case "image": {
      const s = n.images.get(e.media);
      s && (t.fillStyle = "image", t.backgroundImage = e.grayscale && n.gray.get(s.url) || s.url, t.backgroundColor = "#ffffff"), s && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
      break;
    }
  }
}
function Mn(t, e) {
  if (!e || !(e.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = K(e.color), t.strokeWidth = Math.max(0.5, e.width), t.strokeStyle = e.dash === "sysDot" ? "dotted" : e.dash ? "dashed" : "solid", (e.join === "miter" || e.join === "bevel") && (t.strokeLineJoin = e.join), e.cap === "flat" ? t.strokeLineCap = "butt" : e.cap === "sq" && (t.strokeLineCap = "square");
}
function Ua(t) {
  const e = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!e) return {};
  const n = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[e[1]], s = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[e[2]], o = {};
  return n && (o.listNumberStyle = n), s && (o.listNumberSuffix = s), o;
}
function _a(t, e) {
  const n = t.bullet === "num" ? Ua(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, s = t.runs.find((o) => !o.br)?.color ?? e.defaults?.color;
  return t.bulletColor && K(t.bulletColor) !== K(s) && (n.listMarkerColor = K(t.bulletColor)), t.bulletScale && (n.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (n.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), n.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), n;
}
const an = (t, e) => Math.round(((t.paragraphs[e - 1]?.spaceAfter ?? 0) + (t.paragraphs[e]?.spaceBefore ?? 0)) * 100) / 100;
function _o(t, e) {
  const n = t.paragraphs.flatMap((p) => p.runs.filter((g) => !g.br)), s = n[0], o = s?.size ?? 24, i = /* @__PURE__ */ new Map(), r = (p) => p.runs.reduce((g, b) => g + (b.br ? 0 : b.text.trim().length), 0);
  for (const p of t.paragraphs) {
    const g = r(p);
    g && i.set(p.align ?? "l", (i.get(p.align ?? "l") ?? 0) + g);
  }
  const l = [...i].sort((p, g) => g[1] - p[1])[0]?.[0] ?? t.paragraphs.find((p) => p.runs.length)?.align ?? "l", a = (p) => r(p) > 0 && (p.align ?? "l") !== l ? p.align === "ctr" ? "center" : p.align === "r" ? "right" : "left" : void 0, c = n.every((p) => p.size === s?.size && p.bold === s?.bold && p.italic === s?.italic && p.underline === s?.underline && p.strike === s?.strike && p.font === s?.font && K(p.color) === K(s?.color)) && !t.paragraphs.some((p) => p.bullet) && !t.paragraphs.some((p, g) => g > 0 && an(t, g) > 0) && !t.paragraphs.some(a), u = {
    fontSize: Math.round(o * 10) / 10,
    fontFamily: wn(s?.font),
    textAlign: l === "ctr" ? "center" : l === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: K(s?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (u.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2))), t.shrink !== void 0 && t.wrap && (u.textFit = "shrink");
  const h = t.paragraphs.map((p) => p.runs.map((g) => g.br ? `
` : g.text).join("")).join(`
`);
  if (c)
    return s?.bold && (u.fontWeight = 700), s?.italic && (u.fontStyle = "italic"), e ? u.containerText = h : u.text = h, { fields: u, rich: !1 };
  const f = [], m = [], d = [];
  return t.paragraphs.forEach((p, g) => {
    const b = p.level ?? 0;
    if (p.bullet === "num") {
      const w = p.numType ?? "arabicPeriod";
      (m[b] === void 0 || d[b] !== w) && (m[b] = (p.startAt ?? 1) - 1), m[b]++, d[b] = w, m.length = b + 1, d.length = b + 1;
    } else
      m.length = Math.min(m.length, b), d.length = m.length;
    const k = p.bullet ? { listType: p.bullet === "num" ? "ordered" : "bullet", listLevel: b, ..._a(p, t) } : {};
    p.bullet === "num" && (k.listIndex = m[b]), (p.runs.length ? p.runs : [{ text: "" }]).forEach((w, v) => {
      const S = { text: w.br ? `
` : w.text, ...v === 0 ? k : {} };
      v === 0 && g > 0 && an(t, g) > 0 && (S.paragraphSpaceBefore = an(t, g));
      const $ = a(p);
      $ && (S.paragraphAlign = $), w.bold && (S.bold = !0), w.italic && (S.italic = !0), w.underline && (S.underline = !0), w.strike && (S.strikethrough = !0), w.color && (S.color = K(w.color)), w.size && (S.fontSize = Math.round(w.size * 10) / 10), w.font && (S.fontFamily = wn(w.font)), f.push(S);
    }), g < t.paragraphs.length - 1 && f.push({ text: `
` });
  }), e ? (u.richContainerText = f, u.containerText = h) : (u.richText = f, u.text = h), { fields: u, rich: !0 };
}
function Ne(t, e, n, s, o) {
  const { fields: i, rich: r } = _o(e, !1), l = 4, a = Ft(t, r ? "richtext" : "text", {
    ...n,
    x: n.x + e.insets.l - l,
    y: n.y + e.insets.t - l,
    w: Math.max(n.w - e.insets.l - e.insets.r + l * 2, 8),
    h: Math.max(n.h - e.insets.t - e.insets.b + l * 2, 8)
  }, s);
  return Object.assign(a, i, { autoResize: !e.wrap, strokeColor: i.textColor }), a;
}
const zo = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function Vn(t, e, n) {
  if (t.text?.vert) {
    const h = t.fill.kind !== "none" || !!t.line, f = h ? e.nextId("group") : null, m = f ? [...n, f] : n, d = h ? Vn({ ...t, text: void 0 }, e, m) : [], p = t.text, g = p.insets, b = p.vert === "vert" ? 90 : p.vert === "vert270" ? 270 : 0, k = t.x + t.w / 2, y = t.y + t.h / 2, w = p.vert === "vert" ? { l: g.t, r: g.b, t: g.r, b: g.l } : p.vert === "vert270" ? { l: g.b, r: g.t, t: g.l, b: g.r } : g, v = b ? { name: t.name, x: k - t.h / 2, y: y - t.w / 2, w: t.h, h: t.w, rot: (t.rot ?? 0) + b } : { name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot }, S = Ne(e, { ...p, insets: w }, v, m);
    return p.vert === "stacked" && (S.verticalText = !0), e.stats.elements++, [...d, S];
  }
  const s = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || s.kind === "preset" && s.prst === "rect"))
    return e.stats.elements++, [Ne(e, t.text, t, n)];
  if (s.kind === "preset" && zo.has(s.prst)) return vn({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, e, n);
  if (s.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && s.paths.every((h) => !h.cmds.some((f) => f.op === "Z")))
    return vn({ ...t, kind: "connector", line: t.line }, e, n);
  const o = Ha(t);
  if (o) {
    const h = Ft(e, o.type, t, n);
    Object.assign(h, o.extra), Vs(h, t.fill, e), Mn(h, t.line), e.byPptId.set(t.id, { el: h, item: t }), e.stats.elements++;
    const f = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, m = t.text?.insets, d = Math.abs(f.l) > 0.5 || Math.abs(f.t) > 0.5 || Math.abs(f.r - t.w) > 0.5 || Math.abs(f.b - t.h) > 0.5, p = !!m && Math.max(m.l, m.r, m.t, m.b) > 16;
    if (t.text && (d || p)) {
      const g = e.nextId("group");
      return h.groupIds = [...n, g].reverse(), e.stats.elements++, [h, Ne(e, t.text, { ...t, rot: 0, x: t.x + f.l, y: t.y + f.t, w: f.r - f.l, h: f.b - f.t }, [...n, g])];
    }
    if (t.text) {
      const { fields: g } = _o(t.text, !0);
      Object.assign(h, g);
    }
    return [h];
  }
  const i = s.kind === "custom" ? s.paths : (() => {
    const h = e.presets[s.prst];
    if (!h)
      return e.warnings.push(`Unknown shape "${s.prst}" was imported as a rectangle.`), Fe(e.presets.rect, t.w, t.h);
    const f = Object.fromEntries(Object.entries(s.adj ?? {}).map(([m, d]) => [m, `val ${d}`]));
    return Fe(h, t.w, t.h, f);
  })(), r = [], l = (t.text || i.some((h) => h.fill === !1)) && i.some((h) => h.fill !== !1) ? e.nextId("group") : null, a = l ? [...n, l] : n, c = /* @__PURE__ */ new Map();
  for (const h of i) {
    const f = `${h.fill === !1 ? "nofill" : "fill"}|${h.stroke === !1 ? "nostroke" : "stroke"}`;
    c.has(f) || c.set(f, []), c.get(f).push(h);
  }
  let u = null;
  for (const [h, f] of c) {
    const m = f.flatMap((k) => k.cmds), d = Zo(m);
    if (!d) continue;
    const p = Ia(Ra(m, -d.minX, -d.minY));
    if (!p.length) continue;
    const g = Ft(e, "path", { ...t, x: t.x + d.minX, y: t.y + d.minY, w: Math.max(d.maxX - d.minX, 1), h: Math.max(d.maxY - d.minY, 1) }, a);
    !(Math.abs(d.minX + d.maxX - t.w) < 0.5 && Math.abs(d.minY + d.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && za(g, p, t, d), g.pathSubpaths = p, g.pathAnchors = p[0].anchors, g.pathClosed = p[0].closed, h.startsWith("fill") ? Vs(g, t.fill, e) : g.backgroundColor = "transparent", h.endsWith("|stroke") ? Mn(g, t.line) : (g.strokeColor = "transparent", g.strokeWidth = 0), r.push(g), u ??= g, e.stats.paths++;
  }
  if (u && e.byPptId.set(t.id, { el: u, item: t }), t.text) {
    const h = t.textRect ?? (s.kind === "preset" && e.presets[s.prst] ? Qs(e.presets[s.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    r.push(Ne(e, t.text, { ...t, x: t.x + h.l, y: t.y + h.t, w: h.r - h.l, h: h.b - h.t }, a));
  }
  return e.stats.elements += r.length, r;
}
function za(t, e, n, s) {
  const o = n.w / 2, i = n.h / 2, r = (n.rot || 0) * Math.PI / 180, l = Math.cos(r), a = Math.sin(r), c = n.flipH ? -1 : 1, u = n.flipV ? -1 : 1, h = (b, k) => {
    const y = (b + s.minX - o) * c, w = (k + s.minY - i) * u;
    return { x: o + y * l - w * a, y: i + y * a + w * l };
  }, f = (b, k) => {
    const y = b * c, w = k * u;
    return { x: y * l - w * a, y: y * a + w * l };
  };
  let m = 1 / 0, d = 1 / 0, p = -1 / 0, g = -1 / 0;
  for (const b of e) for (const k of b.anchors) {
    const y = h(k.x, k.y);
    if (k.x = y.x, k.y = y.y, k.inX !== void 0) {
      const w = f(k.inX, k.inY ?? 0);
      k.inX = w.x, k.inY = w.y;
    }
    if (k.outX !== void 0) {
      const w = f(k.outX, k.outY ?? 0);
      k.outX = w.x, k.outY = w.y;
    }
    m = Math.min(m, k.x), d = Math.min(d, k.y), p = Math.max(p, k.x), g = Math.max(g, k.y);
  }
  for (const b of e) for (const k of b.anchors)
    k.x -= m, k.y -= d;
  t.x = t.x - s.minX + m, t.y = t.y - s.minY + d, t.width = Math.max(p - m, 1), t.height = Math.max(g - d, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Ha(t) {
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
const Ys = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function vn(t, e, n) {
  const s = t.geom;
  let o;
  if (s.kind === "preset" && zo.has(s.prst)) o = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (s.kind === "custom") o = s.paths.flatMap((y) => y.cmds);
  else {
    const y = e.presets[s.prst], w = Object.fromEntries(Object.entries(s.adj ?? {}).map(([v, S]) => [v, `val ${S}`]));
    o = y ? Fe(y, t.w, t.h, w).flatMap((v) => v.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const i = t.w / 2, r = t.h / 2, l = (t.rot || 0) * Math.PI / 180, a = (y, w) => {
    let v = y - i, S = w - r;
    return t.flipH && (v = -v), t.flipV && (S = -S), { x: t.x + i + v * Math.cos(l) - S * Math.sin(l), y: t.y + r + v * Math.sin(l) + S * Math.cos(l) };
  }, c = [];
  let u = { x: 0, y: 0 };
  for (const y of o)
    if (y.op === "M" || y.op === "L")
      u = { x: y.x, y: y.y }, c.push(a(u.x, u.y));
    else if (y.op === "C") {
      for (let w = 1; w <= 12; w++) {
        const v = w / 12, S = 1 - v, $ = S * S * S * u.x + 3 * S * S * v * y.x1 + 3 * S * v * v * y.x2 + v * v * v * y.x, F = S * S * S * u.y + 3 * S * S * v * y.y1 + 3 * S * v * v * y.y2 + v * v * v * y.y;
        c.push(a($, F));
      }
      u = { x: y.x, y: y.y };
    }
  if (c.length < 2) return [];
  const h = Math.min(...c.map((y) => y.x)), f = Math.min(...c.map((y) => y.y)), m = Math.max(...c.map((y) => y.x)), d = Math.max(...c.map((y) => y.y)), p = t.line.head && Ys[t.line.head.type], g = t.line.tail && Ys[t.line.tail.type], b = Ft(e, p || g ? "arrow" : "line", { ...t, x: h, y: f, w: Math.max(m - h, 1), h: Math.max(d - f, 1), rot: 0, flipH: !1, flipV: !1 }, n);
  b.points = c.map((y) => ({ x: y.x - h, y: y.y - f })), b.curveType = "straight", b.startArrowhead = p ?? null, b.endArrowhead = g ?? null, Mn(b, t.line);
  const k = (y, w) => {
    if (!y) return null;
    const v = e.byPptId.get(y.id);
    if (!v || !v.el.width || !v.el.height) return null;
    const S = v.el;
    return { elementId: S.id, focus: 0, gap: 0, anchorFractionX: (w.x + e.ox - S.x) / S.width, anchorFractionY: (w.y + e.oy - S.y) / S.height };
  };
  return e.glue.push(() => {
    b.startBinding = k(t.start, c[0]), b.endBinding = k(t.end, c[c.length - 1]);
  }), e.stats.elements++, [b];
}
const Gs = 25 * 1024 * 1024, qs = 50 * 1024 * 1024, Xa = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#4472c4"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#4472c4" stroke-width="1.8" stroke-linecap="round"/></svg>');
function Wa(t, e, n, s) {
  if (!s || !e || !n || !s.l && !s.t && !s.r && !s.b) return t;
  const o = s.l * e, i = s.t * n, r = Math.max(1, (1 - s.l - s.r) * e), l = Math.max(1, (1 - s.t - s.b) * n), a = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${o} ${i} ${r} ${l}" width="${Math.round(r)}" height="${Math.round(l)}" preserveAspectRatio="none"><image width="${e}" height="${n}" preserveAspectRatio="none" xlink:href="${t}" href="${t}"/></svg>`;
  return `data:image/svg+xml;base64,${Yn(new TextEncoder().encode(a))}`;
}
function Va(t, e, n) {
  const s = t.audio ? "Audio" : "Video", o = (c) => {
    if (e.warnings.push(`${s} "${t.name}" ${c}; only its picture was imported.`), !t.poster) return [];
    const u = { id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot, flipH: t.flipH, flipV: t.flipV, media: t.poster, crop: t.crop };
    return Cn(u, e, n);
  };
  let i;
  if (t.file) {
    const c = Qo(t.file.ext, t.audio), u = t.file.bytes.length, h = e.mediaBytes ??= { used: 0 }, f = t.file.ext.toUpperCase() || "media";
    if (!c) return o(`is ${/^[AEFHILMNORSX]/.test(f) ? "an" : "a"} ${f} file, which browsers can't play`);
    if (u > Gs) return o(`is ${(u / 1048576).toFixed(0)} MB, over the ${Gs / 1048576} MB a clip can be`);
    if (h.used + u > qs) return o(`would take the presentation's clips over ${qs / 1048576} MB in all`);
    h.used += u, i = `data:${c};base64,${Yn(t.file.bytes)}`;
  } else if (t.url)
    i = t.url;
  else
    return t.poster ? Cn({ id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot, flipH: t.flipH, flipV: t.flipV, media: t.poster, crop: t.crop }, e, n) : [];
  const r = Ft(e, "video", t, n), l = t.file ? "direct" : ti(i), a = t.poster ? e.images.get(t.poster) : null;
  return Object.assign(r, {
    backgroundColor: t.audio ? "transparent" : "#1a1a2e",
    videoURL: i,
    videoProvider: l,
    videoEmbedURL: ei(i, l) || void 0,
    videoPosterDataURL: a ? Wa(a.url, a.w, a.h, t.crop) : t.audio ? Xa : void 0,
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
    const a = Ft(e, "rectangle", t, n);
    return Object.assign(a, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), e.stats.elements++, [a];
  }
  const o = Ft(e, "image", t, n);
  if (o.dataURL = t.grayscale && e.gray.get(s.url) || s.url, o.status = "loaded", o.mimeType = /^data:([^;,]+)/.exec(s.url)?.[1] ?? Pn[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (o.crop = { x: t.crop.l * s.w, y: t.crop.t * s.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * s.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * s.h) }), t.alpha !== void 0 && t.alpha < 1 && (o.opacity = Math.round(t.alpha * 100)), e.stats.elements++, e.stats.pictures++, !t.geom) return [o];
  const i = e.nextId("group"), r = Vn({
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
const ye = (t, e) => !t && !e || !!t && !!e && t.hex.toLowerCase() === e.hex.toLowerCase() && Math.abs((t.alpha ?? 1) - (e.alpha ?? 1)) < 0.01, cn = (t, e) => t.kind === e.kind && (t.kind === "none" || t.kind === "solid" && e.kind === "solid" && ye(t.color, e.color)), Ya = (t, e) => !t && !e || !!t && !!e && Math.abs(t.width - e.width) < 0.05 && ye(t.color, e.color) && (t.dash ?? "solid") === (e.dash ?? "solid"), It = (t, e) => t.every((n) => e(n, t[0]));
function Ga(t, e, n) {
  const s = !!t.firstRow;
  return Zs(t, s, e, n) ?? (t.rows.length < 2 ? null : Zs(t, !s, e, n));
}
function Zs(t, e, n, s) {
  const o = t.rows.length, i = t.cols.length;
  if (!o || !i) return null;
  const r = t.rows.map((C) => C.cells.map((P) => P.fill));
  if (r.flat().some((C) => C.kind !== "none" && C.kind !== "solid")) return null;
  const l = [], a = [], c = Array.from({ length: i }, () => []), u = [];
  for (let C = 0; C < o; C++) {
    const P = [];
    for (let O = 0; O < i; O++) {
      const R = t.rows[C].cells[O], U = R.text, G = U ? U.paragraphs.map((X) => X.runs.map((z) => z.br ? `
` : z.text).join("")).join(`
`) : "";
      if (P.push(R.hMerge || R.vMerge ? "" : G), R.hMerge || R.vMerge || !U || !G.trim()) continue;
      if (u.push(U.anchor), U.paragraphs.some((X) => X.bullet) || U.vert) return null;
      const W = U.defaults ?? {};
      for (const X of U.paragraphs) {
        c[O].push(X.align ?? "l");
        for (const z of X.runs)
          if (!(z.br || !z.text.trim())) {
            if ((z.underline ?? W.underline) || (z.strike ?? W.strike)) return null;
            a.push({ row: C, col: O, p: { size: z.size ?? W.size ?? 18, font: z.font ?? W.font, bold: !!(z.bold ?? W.bold), italic: !!(z.italic ?? W.italic), color: z.color ?? W.color } });
          }
      }
    }
    l.push(P);
  }
  const h = a.map((C) => C.p);
  if (h.length && !It(h, (C, P) => Math.abs(C.size - P.size) < 0.5 && (C.font ?? "") === (P.font ?? "") && C.italic === P.italic)) return null;
  const f = a.filter((C) => e && C.row === 0).map((C) => C.p), m = a.filter((C) => !(e && C.row === 0)).map((C) => C.p);
  if (!It(m, (C, P) => C.bold === P.bold && ye(C.color, P.color)) || !It(f, (C, P) => ye(C.color, P.color))) return null;
  const d = m[0]?.bold ?? !1;
  if (f.some((C) => !C.bold) || !It(u, (C, P) => C === P)) return null;
  const p = [];
  for (const C of c) {
    if (!It(C, (P, O) => P === O)) return null;
    p.push(C[0] === "r" ? "right" : C[0] === "ctr" ? "center" : "left");
  }
  const g = (C, P) => !t.rows[C].cells[P].hMerge && !t.rows[C].cells[P].vMerge, b = (C) => {
    const P = r[C].filter((O, R) => g(C, R));
    return P.length && It(P, cn) ? P[0] : P.length ? null : { kind: "none" };
  }, k = t.rows.map((C, P) => b(P));
  if (k.some((C) => !C)) return null;
  const y = k.slice(e ? 1 : 0), w = y.filter((C, P) => P % 2 === 0), v = y.filter((C, P) => P % 2 === 1);
  if (!It(w, cn) || !It(v, cn)) return null;
  const S = (C) => C && C.kind === "solid" ? K(C.color) : "", $ = S(w[0]), F = v.length ? S(v[0]) : $;
  if (!$ && F) return null;
  const D = t.rows.flatMap((C, P) => C.cells.filter((O, R) => g(P, R)).flatMap((O) => [O.borders.l, O.borders.r, O.borders.t, O.borders.b]));
  if (!It(D, Ya)) return null;
  const E = D[0] ?? null, L = [];
  t.rows.forEach((C, P) => C.cells.forEach((O, R) => {
    ((O.gridSpan ?? 1) > 1 || (O.rowSpan ?? 1) > 1) && L.push({ startRow: P, startCol: R, endRow: Math.min(o - 1, P + (O.rowSpan ?? 1) - 1), endCol: Math.min(i - 1, R + (O.gridSpan ?? 1) - 1) });
  }));
  const T = t.cols.reduce((C, P) => C + P, 0), A = t.rows.reduce((C, P) => C + P.h, 0), I = Ft(n, "table", { ...t, w: T, h: A }, s), B = h[0];
  return Object.assign(I, {
    tableRows: e ? o - 1 : o,
    tableCols: i,
    tableHeaders: e,
    tableData: l,
    tableColWidths: t.cols.map((C) => C / (T || 1)),
    tableRowHeights: t.rows.map((C) => C.h / (A || 1)),
    tableHeaderColor: e ? S(k[0]) : "",
    tableHeaderTextColor: f[0]?.color && !ye(f[0].color, m[0]?.color) ? K(f[0].color) : "",
    tableRowColor: $,
    tableAltRowColor: F !== $ ? F : "",
    // A presentation table isn't a sortable list: no arrows in its header.
    tableColAlignments: p,
    tableSortCol: -1,
    tableSortDir: "asc",
    tableSortArrows: !1,
    ...u[0] && u[0] !== "ctr" && { tableVerticalAlign: u[0] === "t" ? "top" : "bottom" },
    ...L.length && { tableMergedCells: L },
    strokeColor: E ? K(E.color) : "transparent",
    strokeWidth: E ? E.width : 1,
    fontSize: B?.size ?? 14,
    fontFamily: wn(B?.font),
    textColor: K(m[0]?.color ?? f[0]?.color ?? { hex: "#000000" }),
    ...d && { fontWeight: "bold" },
    ...B?.italic && { fontStyle: "italic" }
  }), E?.dash && E.dash !== "solid" && (I.strokeStyle = /dot/i.test(E.dash) ? "dotted" : "dashed"), I;
}
function Sn(t, e, n) {
  const s = [];
  for (const o of t)
    try {
      const i = [];
      switch (o.kind) {
        case "shape":
          i.push(...Vn(o, e, n));
          break;
        case "connector":
          i.push(...vn(o, e, n));
          break;
        case "picture":
          i.push(...Cn(o, e, n));
          break;
        case "media":
          i.push(...Va(o, e, n));
          break;
        case "group":
          i.push(...Sn(o.children, e, [...n, e.nextId("group")]));
          break;
        case "table": {
          const l = Ga(o, e, n);
          l ? (e.stats.elements++, i.push(l)) : o.fallback && i.push(...Sn([o.fallback], e, n));
          break;
        }
        case "chart": {
          const l = Ft(e, "chart", o, n);
          l.chart = Jo(o.chart), l.fontFamily = "sans-serif", e.stats.elements++, i.push(l);
          break;
        }
      }
      if (o.descr && i[0] && !i[0].altText && (i[0].altText = o.descr), o.decorative) for (const l of i) l.decorative = !0;
      const r = Ba(o.link, e);
      if (r)
        for (const l of i) l.link || (l.link = r);
      e.itemEls?.set(o.id, i), s.push(...i);
    } catch {
      e.warnings.push(`"${o.name}" couldn't be converted and was skipped.`);
    }
  return s;
}
function qa(t) {
  if (!t) return;
  const e = t.dir === "r" ? "right" : t.dir === "u" ? "up" : t.dir === "d" ? "down" : "left";
  return { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.kind === "split" ? `split-${t.orient === "vert" ? "vertical" : "horizontal"}-${t.inward ? "in" : "out"}` : t.kind === "wipe" ? `wipe-${e}` : t.kind === "cover" ? `cover-${e}` : t.kind === "pull" ? `uncover-${e}` : `slide-${e}`, duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" };
}
function Za(t, e, n) {
  if (e)
    if (e.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = K(e.color);
    else if (e.kind === "linear" || e.kind === "radial")
      t.fillStyle = e.kind, t.backgroundColor = K(e.stops[0]?.color), t.gradientStops = e.stops.map((s) => ({ offset: s.pos, color: K(s.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
    else if (e.kind === "image") {
      const s = n.images.get(e.media), o = n.slideBg ?? s?.url;
      o && (t.fillStyle = "image", t.backgroundImage = o, t.backgroundColor = "#ffffff"), o && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
    } else e.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = K(e.color));
}
const Pn = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, Ka = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Yn(t) {
  let e = "";
  for (let s = 0; s < t.length; s += 32768) e += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(e);
}
async function Ja(t) {
  const e = /* @__PURE__ */ new Set(), n = (o) => {
    for (const i of o)
      i.kind === "picture" ? e.add(i.media) : i.kind === "media" && i.poster ? e.add(i.poster) : i.kind === "group" ? n(i.children) : i.kind === "shape" && i.fill.kind === "image" && e.add(i.fill.media);
  };
  for (const o of t.slides)
    n(o.items), o.background?.kind === "image" && e.add(o.background.media);
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...e].map(async (o) => {
    if (o.ext === "emf" || o.ext === "wmf") {
      s.set(o, ba(o.bytes));
      return;
    }
    if (o.ext === "tiff") {
      s.set(o, Ma(o.bytes));
      return;
    }
    if (!Ka.has(o.ext)) {
      s.set(o, null);
      return;
    }
    const i = `data:${Pn[o.ext]};base64,${Yn(o.bytes)}`;
    let r = 0, l = 0;
    try {
      const a = await createImageBitmap(new Blob([o.bytes], { type: Pn[o.ext] }));
      r = a.width, l = a.height, a.close();
    } catch {
    }
    s.set(o, { url: i, w: r, h: l });
  })), s;
}
function Qa(t, e, n) {
  const s = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, o = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, i = { color: e, background: n, spacing: s, strokeWidth: o }, r = /^pct(\d+)$/.exec(t);
  if (r) {
    const l = Math.max(1, Math.min(99, Number(r[1]))), a = l > 50, c = (a ? 100 - l : l) / 100;
    return { type: "dots", color: a ? n : e, background: a ? e : n, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(c / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...i, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...i, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...i, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...i, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...i } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...i, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...i } : { type: "dots", ...i, strokeWidth: 1 };
}
async function tc(t, e, n) {
  const s = await mi(), o = await Ja(t), i = Math.round(t.width), r = Math.round(t.height), l = Ko(n ?? t.title, "slides", { width: i, height: r }), a = [], c = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  l.slides = [];
  const u = await La(t, o), h = await Promise.all(t.slides.map((d) => {
    const p = d.background, g = p?.kind === "image" ? o.get(p.media) : void 0;
    return p?.kind === "image" && g ? ja(g.url, i, r, p.tile) : void 0;
  })), f = t.slides.map(() => e("slide")), m = /* @__PURE__ */ new Map();
  return t.slides.forEach((d, p) => {
    d.key && m.set(d.key, f[p]);
  }), t.slides.forEach((d, p) => {
    const g = p * (i + $a), b = qn(f[p], d.name || `Slide ${p + 1}`, g, 0, { width: i, height: r });
    b.order = p;
    const k = { ox: g, oy: 0, presets: s, nextId: e, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: a, stats: c, images: o, slideBg: h[p], gray: u, slideIds: m, itemEls: /* @__PURE__ */ new Map() };
    l.elements.push(...Sn(d.items, k, [])), Fa(d.anims ?? [], k, e), k.glue.forEach((w) => w()), Za(b, d.background, k);
    const y = qa(d.transition);
    y && (b.transition = y), d.notes && (b.notes = d.notes), d.hidden && (b.hidden = !0), d.advanceAfterMs && (b.advanceAfter = d.advanceAfterMs), d.section && (b.section = d.section), l.slides.push(b), c.slides++;
  }), l.slides.length || l.slides.push(qn(void 0, "Slide 1", 0, 0, { width: i, height: r })), t.loop && (l.globalSettings = { ...l.globalSettings || {}, slideShowLoop: !0 }), { doc: l, warnings: [...new Set(a)], stats: c };
}
const ec = 512 * 1024 * 1024;
async function rc(t, e) {
  const n = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (n.length > ec) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: s, warnings: o } = lr(n), i = /* @__PURE__ */ new Set(), r = await tc(s, (a) => ri(a, i), e);
  ii(r.doc);
  const l = [...o, ...r.warnings];
  return l.length && console.warn("[pptx import]", l), { stats: r.stats, warnings: l };
}
export {
  rc as importPptx
};
