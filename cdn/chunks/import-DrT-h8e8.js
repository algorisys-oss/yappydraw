import { u as Ee, a as Fe } from "./browser-DbZP-BrN.js";
import { e as $e, s as te, f as Ie } from "./anim-map-D7T1mIAM.js";
import { E as J, i as _t, c as Re } from "./custgeom-CiffYXci.js";
import { aR as Oe, aS as ee, U as Le, aT as Be, aU as De, N as ze, q as je, K as He } from "./index-D4fubUK0.js";
const bt = (t, e) => `<a:ln w="${t}" cmpd="sng"><a:solidFill><a:schemeClr val="${e}"/></a:solidFill></a:ln>`, Ct = "<a:ln><a:noFill/></a:ln>", rt = (t, e = "") => `<a:fill><a:solidFill><a:schemeClr val="${t}">${e}</a:schemeClr></a:solidFill></a:fill>`, ut = (t, e = !1) => `<a:tcTxStyle${e ? ' b="on"' : ""}><a:fontRef idx="minor"><a:prstClr val="black"/></a:fontRef><a:schemeClr val="${t}"/></a:tcTxStyle>`, ct = (t) => `<a:tcBdr>${Object.entries(t).map(([e, n]) => `<a:${e}>${n}</a:${e}>`).join("")}</a:tcBdr>`;
function mt(t, e) {
  const n = bt(12700, "lt1"), o = `${ut("lt1", !0)}<a:tcStyle><a:tcBdr/>${rt(e)}</a:tcStyle>`;
  return `<a:tblStyle styleId="${t}" styleName="Medium Style 2"><a:wholeTbl>${ut("dk1")}<a:tcStyle>${ct({ left: n, right: n, top: n, bottom: n, insideH: n, insideV: n })}${rt(e, '<a:tint val="20000"/>')}</a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${rt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${rt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1V><a:band2V><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2V><a:lastCol>${o}</a:lastCol><a:firstCol>${o}</a:firstCol><a:lastRow>${ut("lt1", !0)}<a:tcStyle>${ct({ top: bt(38100, "lt1") })}${rt(e)}</a:tcStyle></a:lastRow><a:firstRow>${ut("lt1", !0)}<a:tcStyle>${ct({ bottom: bt(38100, "lt1") })}${rt(e)}</a:tcStyle></a:firstRow></a:tblStyle>`;
}
function Pt(t, e) {
  const n = bt(12700, e);
  return `<a:tblStyle styleId="${t}" styleName="Light Style 1"><a:wholeTbl>${ut("tx1")}<a:tcStyle>${ct({ left: Ct, right: Ct, top: n, bottom: n, insideH: Ct, insideV: Ct })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${rt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${rt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1V><a:lastCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:lastCol><a:firstCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:firstCol><a:lastRow><a:tcTxStyle b="on"/><a:tcStyle>${ct({ top: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:lastRow><a:firstRow><a:tcTxStyle b="on"/><a:tcStyle>${ct({ bottom: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:firstRow></a:tblStyle>`;
}
function Xe(t) {
  const e = bt(12700, "tx1");
  return `<a:tblStyle styleId="${t}" styleName="No Style, Table Grid"><a:wholeTbl>${ut("tx1")}<a:tcStyle>${ct({ left: e, right: e, top: e, bottom: e, insideH: e, insideV: e })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle>`;
}
const Ve = {
  "{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}": (t) => mt(t, "dk1"),
  "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}": (t) => mt(t, "accent1"),
  "{21E4AEA4-8DFA-4A89-87EB-49C32662AFE0}": (t) => mt(t, "accent2"),
  "{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}": (t) => mt(t, "accent3"),
  "{7DF18680-E054-41AD-8BC1-D1AEF772440D}": (t) => mt(t, "accent5"),
  "{9D7B26C5-4107-4FEC-AEDC-1716B250A1EF}": (t) => Pt(t, "tx1"),
  "{3B4B98B0-60AC-42C2-AFA5-B58CD77FA1E5}": (t) => Pt(t, "accent1"),
  "{0E3FDE45-AF77-4B5C-9715-49D594BDF05E}": (t) => Pt(t, "accent2"),
  "{C083E6E3-FA7D-4D7B-A595-EF9225AFEA82}": (t) => Pt(t, "accent3"),
  "{5940675A-B579-460E-94D1-54222C63F5DA}": Xe
}, We = "http://schemas.openxmlformats.org/drawingml/2006/main";
function Ye(t) {
  const e = Ve[t.toUpperCase()];
  return e ? `<a:tblStyleLst xmlns:a="${We}">${e(t.toUpperCase())}</a:tblStyleLst>` : null;
}
const _e = 1e4, Ue = 1e5, ye = 6e4, yt = (t) => t / ye * (Math.PI / 180);
function we(t, e, n, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, e), l = Math.max(0, n), a = Math.min(r, l), i = Math.max(r, l), h = {
    w: r,
    h: l,
    l: 0,
    t: 0,
    r,
    b: l,
    hc: r / 2,
    vc: l / 2,
    ss: a,
    ls: i,
    cd2: 108e5,
    cd4: 54e5,
    cd8: 27e5,
    "3cd4": 162e5,
    "3cd8": 81e5,
    "5cd8": 135e5,
    "7cd8": 189e5
  };
  for (const [u, y] of Object.entries(h)) s.set(u, y);
  for (const u of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${u}`, r / u), s.set(`hd${u}`, l / u), s.set(`ssd${u}`, a / u);
  const d = (u) => {
    const y = s.get(u);
    if (y !== void 0) return y;
    const g = /^(wd|hd|ssd)(\d+)$/.exec(u);
    if (g) {
      const p = g[1] === "wd" ? r : g[1] === "hd" ? l : a, b = Number(g[2]);
      return b ? p / b : 0;
    }
    const f = Number(u);
    return Number.isFinite(f) ? f : 0;
  }, m = (u, y) => {
    s.size > _e || s.set(u, Ge(y, d));
  };
  for (const [u, y] of t.av ?? []) m(u, o[u] ?? y);
  for (const [u, y] of Object.entries(o)) s.has(u) || m(u, y);
  for (const [u, y] of t.gd ?? []) m(u, y);
  return s;
}
function Ge(t, e) {
  const n = String(t || "").trim().split(/\s+/), o = n[0], [s, r, l] = n.slice(1).map(e);
  let a;
  switch (o) {
    case "val":
      a = s;
      break;
    case "*/":
      a = l ? s * r / l : 0;
      break;
    case "+-":
      a = s + r - l;
      break;
    case "+/":
      a = l ? (s + r) / l : 0;
      break;
    case "?:":
      a = s > 0 ? r : l;
      break;
    case "abs":
      a = Math.abs(s);
      break;
    case "at2":
      a = Math.atan2(r, s) * 180 / Math.PI * ye;
      break;
    case "cat2":
      a = s * Math.cos(Math.atan2(l, r));
      break;
    case "sat2":
      a = s * Math.sin(Math.atan2(l, r));
      break;
    case "cos":
      a = s * Math.cos(yt(r));
      break;
    case "sin":
      a = s * Math.sin(yt(r));
      break;
    case "tan":
      a = s * Math.tan(yt(r));
      break;
    case "max":
      a = Math.max(s, r);
      break;
    case "min":
      a = Math.min(s, r);
      break;
    case "mod":
      a = Math.sqrt(s * s + r * r + l * l);
      break;
    case "pin":
      a = r < s ? s : r > l ? l : r;
      break;
    case "sqrt":
      a = Math.sqrt(Math.max(0, s));
      break;
    default:
      a = 0;
  }
  return Number.isFinite(a) ? a : 0;
}
const ne = (t, e, n) => Math.atan2(e * Math.sin(t), n * Math.cos(t));
function At(t, e, n, o = {}) {
  const s = Math.max(Math.abs(e), 0) * J, r = Math.max(Math.abs(n), 0) * J, l = we(t, s, r, o), a = (d) => typeof d == "number" ? d : l.get(d) ?? (Number.isFinite(Number(d)) ? Number(d) : 0), i = [];
  let h = Ue;
  for (const d of t.paths) {
    const m = d.w ? s / d.w : 1, u = d.h ? r / d.h : 1, y = (w) => a(w) * m / J, g = (w) => a(w) * u / J, f = [];
    let p = { x: 0, y: 0 }, b = { x: 0, y: 0 };
    for (const w of d.d) {
      if (--h < 0) break;
      switch (w[0]) {
        case "M":
          p = { x: y(w[1]), y: g(w[2]) }, b = p, f.push({ op: "M", ...p });
          break;
        case "L":
          p = { x: y(w[1]), y: g(w[2]) }, f.push({ op: "L", ...p });
          break;
        case "C": {
          const x = y(w[1]), v = g(w[2]), P = y(w[3]), S = g(w[4]);
          p = { x: y(w[5]), y: g(w[6]) }, f.push({ op: "C", x1: x, y1: v, x2: P, y2: S, ...p });
          break;
        }
        case "Q": {
          const x = y(w[1]), v = g(w[2]), P = y(w[3]), S = g(w[4]);
          f.push({ op: "C", x1: p.x + 2 / 3 * (x - p.x), y1: p.y + 2 / 3 * (v - p.y), x2: P + 2 / 3 * (x - P), y2: S + 2 / 3 * (v - S), x: P, y: S }), p = { x: P, y: S };
          break;
        }
        case "A": {
          const x = a(w[1]) * m / J, v = a(w[2]) * u / J;
          p = qe(f, p, x, v, a(w[3]), a(w[4]));
          break;
        }
        case "Z":
          f.push({ op: "Z" }), p = b;
          break;
      }
    }
    f.length && i.push({ cmds: f, fill: d.fill === "none" ? !1 : void 0, stroke: d.stroke === !1 ? !1 : void 0 });
  }
  return i;
}
function qe(t, e, n, o, s, r) {
  if (Math.abs(n) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return e;
  const l = yt(s), a = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, yt(r))), i = ne(l, n, o);
  let h = ne(l + a, n, o);
  if (Math.abs(a) >= 2 * Math.PI - 1e-9) h = i + Math.sign(a) * 2 * Math.PI;
  else {
    for (; a > 0 && h < i; ) h += 2 * Math.PI;
    for (; a < 0 && h > i; ) h -= 2 * Math.PI;
  }
  const d = e.x - n * Math.cos(i), m = e.y - o * Math.sin(i), u = h - i, y = Math.max(1, Math.min(16, Math.ceil(Math.abs(u) / (Math.PI / 2)))), g = u / y, f = 4 / 3 * Math.tan(g / 4);
  let p = i, b = e;
  for (let w = 0; w < y; w++) {
    const x = p + g, v = Math.cos(p), P = Math.sin(p), S = Math.cos(x), I = Math.sin(x);
    b = { x: d + n * S, y: m + o * I }, t.push({ op: "C", x1: d + n * (v - f * P), y1: m + o * (P + f * v), x2: d + n * (S + f * I), y2: m + o * (I - f * S), ...b }), p = x;
  }
  return b;
}
function ke(t, e, n, o = {}) {
  const s = Math.abs(e), r = Math.abs(n);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const l = we(t, s * J, r * J, o), a = (u) => (l.get(u) ?? (Number.isFinite(Number(u)) ? Number(u) : 0)) / J, [i, h, d, m] = t.rect.map(a);
  return { l: i, t: h, r: d, b: m };
}
let oe = null;
async function Ze() {
  return oe ??= (await import("./presets-DP49P8i2.js")).default, oe;
}
const se = 5e4, Ke = 256 * 1024 * 1024, re = 1024 * 1024 * 1024, Qe = 1e4, Je = 32, tn = 2e4, R = (t, e) => {
  if (!t) return [];
  const n = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!e || o.localName === e) && n.push(o);
  return n;
}, c = (t, e) => {
  if (!t) return null;
  for (let n = t.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && n.localName === e) return n;
  return null;
}, H = (t, ...e) => {
  let n = t;
  for (const o of e) n = c(n, o);
  return n ?? null;
}, k = (t, e) => {
  if (!t) return null;
  const n = t.getAttribute(e);
  if (n !== null && n !== "") return n;
  const o = e.includes(":") ? e.split(":")[1] : e;
  for (let s = 0; s < (t.attributes?.length ?? 0); s++) {
    const r = t.attributes[s];
    if (r.localName === o && (e.includes(":") || !r.name.includes(":"))) return r.value;
  }
  return null;
}, A = (t, e, n = 0) => {
  const o = k(t, e), s = o === null ? NaN : Number(o);
  return Number.isFinite(s) ? s : n;
}, U = (t, e) => {
  const n = k(t, e);
  return n === null ? void 0 : n === "1" || n === "true" || n === "on";
}, _ = (t) => t / J, en = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function nn(t) {
  if (t.localName !== "AlternateContent") return [t];
  const e = c(t, "Fallback");
  for (const n of R(t, "Choice"))
    if ((k(n, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => en.has(s))) return R(n);
  return R(e);
}
const nt = (t) => R(t).flatMap(nn);
class on {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(e, n, o) {
    this.parseXml = n, this.warn = o, this.files = {};
    for (const [s, r] of Object.entries(e)) this.files[xt(s)] = r;
  }
  bytes(e) {
    return this.files[xt(e)];
  }
  /** Parse markup the importer itself supplies (built-in definitions), cached by text. */
  parse(e) {
    const n = `#inline:${e}`;
    if (!this.text.has(n)) {
      let o = null;
      try {
        o = this.parseXml(e), o.getElementsByTagName("parsererror").length && (o = null);
      } catch {
        o = null;
      }
      this.text.set(n, o);
    }
    return this.text.get(n)?.documentElement ?? null;
  }
  xml(e) {
    const n = xt(e);
    if (!this.text.has(n)) {
      const o = this.files[n];
      let s = null;
      if (o) {
        try {
          const r = Fe(o).replace(/^﻿/, "");
          s = /<!DOCTYPE/i.test(r.slice(0, 2048)) ? null : this.parseXml(r), s && s.getElementsByTagName("parsererror").length && (s = null);
        } catch {
          s = null;
        }
        s || this.warn(`Couldn't read ${n}`);
      }
      this.text.set(n, s);
    }
    return this.text.get(n)?.documentElement ?? null;
  }
  rels(e) {
    const n = xt(e);
    let o = this.relCache.get(n);
    if (o) return o;
    o = /* @__PURE__ */ new Map();
    const s = n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "", r = n.slice(n.lastIndexOf("/") + 1), l = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const a of R(l, "Relationship")) {
      const i = k(a, "Id"), h = k(a, "Type") || "", d = k(a, "Target") || "";
      if (!i) continue;
      const m = k(a, "TargetMode") === "External";
      o.set(i, { type: h.slice(h.lastIndexOf("/") + 1), target: m ? d : sn(s, d), external: m });
    }
    return this.relCache.set(n, o), o;
  }
  relOfType(e, n) {
    for (const o of this.rels(e).values()) if (o.type === n && !o.external) return o.target;
    return null;
  }
}
const xt = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function sn(t, e) {
  let n = e.split("#")[0];
  try {
    n = decodeURIComponent(n);
  } catch {
  }
  if (n.startsWith("/")) return xt(n);
  const o = (t ? t.split("/") : []).concat(n.split("/")), s = [];
  for (const r of o)
    r === ".." ? s.pop() : r && r !== "." && s.push(r);
  return s.join("/");
}
const Ut = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function ve(t) {
  const e = {};
  for (const n of R(t)) {
    const o = R(n)[0];
    if (!o) continue;
    const s = o.localName === "sysClr" ? k(o, "lastClr") : k(o, "val");
    s && /^[0-9a-f]{6}$/i.test(s) && (e[n.localName] = "#" + s.toLowerCase());
  }
  return e;
}
function It(t) {
  const e = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, n = c(t, "themeElements");
  e.colors = ve(c(n, "clrScheme"));
  const o = c(n, "fontScheme");
  e.major = k(H(o, "majorFont", "latin"), "typeface") || e.major, e.minor = k(H(o, "minorFont", "latin"), "typeface") || e.minor;
  const s = c(n, "fmtScheme");
  return e.fills = R(c(s, "fillStyleLst")), e.lines = R(c(s, "lnStyleLst")), e.bgFills = R(c(s, "bgFillStyleLst")), e;
}
const rn = {
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
}, an = (t) => {
  const e = t.replace("#", "");
  return [parseInt(e.slice(0, 2), 16) || 0, parseInt(e.slice(2, 4), 16) || 0, parseInt(e.slice(4, 6), 16) || 0];
}, Rt = (t, e, n) => "#" + [t, e, n].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), ae = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), gt = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function le(t, e, n) {
  t /= 255, e /= 255, n /= 255;
  const o = Math.max(t, e, n), s = Math.min(t, e, n), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const l = o - s, a = r > 0.5 ? l / (2 - o - s) : l / (o + s);
  return [(o === t ? (e - n) / l + (e < n ? 6 : 0) : o === e ? (n - t) / l + 2 : (t - e) / l + 4) * 60, a, r];
}
function Ot(t, e, n) {
  if (t = (t % 360 + 360) % 360 / 360, e === 0) return [n * 255, n * 255, n * 255];
  const o = n < 0.5 ? n * (1 + e) : n + e - n * e, s = 2 * n - o, r = (l) => (l = (l % 1 + 1) % 1, l < 1 / 6 ? s + (o - s) * 6 * l : l < 1 / 2 ? o : l < 2 / 3 ? s + (o - s) * (2 / 3 - l) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function q(t, e) {
  const n = R(t).find((o) => /Clr$/.test(o.localName));
  return n ? ln(n, e) : null;
}
function ln(t, e) {
  let n = null, o = 1;
  switch (t.localName) {
    case "srgbClr": {
      const i = k(t, "val");
      n = i && /^[0-9a-f]{6}$/i.test(i) ? "#" + i.toLowerCase() : null;
      break;
    }
    case "sysClr": {
      const i = k(t, "lastClr");
      n = i ? "#" + i.toLowerCase() : k(t, "val") === "window" ? "#ffffff" : "#000000";
      break;
    }
    case "prstClr":
      n = rn[k(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      n = Rt(gt(A(t, "r") / 1e5), gt(A(t, "g") / 1e5), gt(A(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [i, h, d] = Ot(A(t, "hue") / 6e4, A(t, "sat") / 1e5, A(t, "lum") / 1e5);
      n = Rt(i, h, d);
      break;
    }
    case "schemeClr": {
      const i = k(t, "val") || "";
      if (i === "phClr") {
        e.phClr ? (n = e.phClr.hex, o = e.phClr.alpha ?? 1) : n = e.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const h = e.clrMap[i] ?? Ut[i] ?? i;
      n = e.theme.colors[h] ?? null;
      break;
    }
  }
  if (!n) return null;
  let [s, r, l] = an(n);
  for (const i of R(t)) {
    const h = A(i, "val") / 1e5;
    switch (i.localName) {
      case "alpha":
        o = h;
        break;
      case "alphaMod":
        o *= h;
        break;
      case "alphaOff":
        o += h;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [d, m, u] = le(s, r, l);
        i.localName === "lumMod" ? u *= h : i.localName === "lumOff" ? u += h : i.localName === "satMod" ? m *= h : i.localName === "satOff" ? m += h : i.localName === "hueMod" ? d *= h : d += A(i, "val") / 6e4, [s, r, l] = Ot(d, Math.max(0, Math.min(1, m)), Math.max(0, Math.min(1, u)));
        break;
      }
      case "tint":
        [s, r, l] = [s, r, l].map((d) => gt(ae(d) * h + (1 - h)));
        break;
      case "shade":
        [s, r, l] = [s, r, l].map((d) => gt(ae(d) * h));
        break;
      case "comp": {
        const [d, m, u] = le(s, r, l);
        [s, r, l] = Ot(d + 180, m, u);
        break;
      }
      case "inv":
        [s, r, l] = [255 - s, 255 - r, 255 - l];
        break;
      case "gray": {
        s = r = l = 0.299 * s + 0.587 * r + 0.114 * l;
        break;
      }
    }
  }
  o = Math.max(0, Math.min(1, o));
  const a = { hex: Rt(s, r, l) };
  return o < 0.999 && (a.alpha = o), a;
}
function ft(t, e) {
  for (const n of R(t)) {
    const o = Gt(n, e);
    if (o) return o;
  }
}
function Gt(t, e) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const n = q(t, e.ctx);
      return n ? { kind: "solid", color: n } : { kind: "none" };
    }
    case "gradFill": {
      const n = R(c(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: A(s, "pos") / 1e5, color: q(s, e.ctx) ?? { hex: "#000000" } }));
      if (!n.length) return { kind: "none" };
      const o = c(t, "lin");
      return c(t, "path") ? { kind: "radial", stops: n } : { kind: "linear", stops: n, angle: o ? A(o, "ang") / 6e4 : 90, scaled: U(o, "scaled") ?? !1 };
    }
    case "blipFill": {
      const n = Me(t, e);
      if (!n) return;
      const o = { kind: "image", media: n }, s = c(t, "tile");
      s && (o.tile = { sx: Math.max(0.01, A(s, "sx", 1e5) / 1e5), sy: Math.max(0.01, A(s, "sy", 1e5) / 1e5) });
      const r = c(c(t, "blip"), "alphaModFix");
      return r && (o.alpha = Math.max(0, Math.min(1, A(r, "amt", 1e5) / 1e5))), c(c(t, "blip"), "grayscl") && (o.grayscale = !0), o;
    }
    case "pattFill": {
      const n = q(c(t, "fgClr"), e.ctx), o = q(c(t, "bgClr"), e.ctx);
      return n ? { kind: "pattern", preset: k(t, "prst") || "pct50", color: n, ...o ? { bg: o } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const cn = {
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
function Me(t, e) {
  const n = c(t, "blip"), o = k(n, "r:embed");
  if (!o) return null;
  const s = e.pkg.rels(e.part).get(o);
  if (!s || s.external) return null;
  const r = e.pkg.bytes(s.target), l = cn[(s.target.split(".").pop() || "").toLowerCase()];
  return r && l ? { bytes: r, ext: l } : null;
}
const fn = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function dt(t, e) {
  if (!t) return;
  let n;
  for (const a of R(t)) {
    if (a.localName === "noFill") return null;
    a.localName === "solidFill" && (n = q(a, e.ctx)), a.localName === "gradFill" && (n = q(c(c(a, "gsLst"), "gs"), e.ctx));
  }
  const o = k(t, "w");
  if (n === void 0 && o === null && !c(t, "prstDash") && !c(t, "headEnd") && !c(t, "tailEnd")) return;
  const s = (a) => {
    const i = k(a, "type");
    if (!i || i === "none") return;
    const h = i === "triangle" || i === "stealth" || i === "arrow" || i === "oval" || i === "diamond" ? i : "triangle", d = k(a, "len") || k(a, "w");
    return { type: h, size: d === "sm" || d === "lg" ? d : "med" };
  }, r = fn[k(c(t, "prstDash"), "val") || "solid"], l = k(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, _(Number(o) || 0)) : 1,
    color: n ?? { hex: "#000000" },
    dash: r || void 0,
    cap: l === "rnd" ? "rnd" : l === "sq" ? "sq" : l === "flat" ? "flat" : void 0,
    join: c(t, "round") ? "round" : c(t, "bevel") ? "bevel" : c(t, "miter") ? "miter" : void 0,
    head: s(c(t, "headEnd")),
    tail: s(c(t, "tailEnd"))
  };
}
function Nt(t, e) {
  const n = c(t, "fillRef");
  if (!n) return;
  const o = A(n, "idx");
  if (o === 0) return { kind: "none" };
  const r = (o >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[o >= 1001 ? o - 1001 : o - 1];
  if (!r) return;
  const l = q(n, e.ctx) ?? void 0;
  return Gt(r, { ...e, ctx: { ...e.ctx, phClr: l } });
}
function qt(t, e) {
  const n = c(t, "lnRef");
  if (!n) return;
  const o = A(n, "idx");
  if (o === 0) return null;
  const s = e.ctx.theme.lines[o - 1];
  if (!s) return;
  const r = q(n, e.ctx) ?? void 0;
  return dt(s, { ...e, ctx: { ...e.ctx, phClr: r } }) ?? void 0;
}
function et(t) {
  if (!t) return null;
  const e = c(t, "off"), n = c(t, "ext");
  return !e || !n ? null : {
    x: _(A(e, "x")),
    y: _(A(e, "y")),
    w: Math.max(0, _(A(n, "cx"))),
    h: Math.max(0, _(A(n, "cy"))),
    rot: A(t, "rot") / 6e4,
    flipH: !!U(t, "flipH"),
    flipV: !!U(t, "flipV")
  };
}
const Lt = (t) => t;
function dn(t, e) {
  const n = et(t);
  if (!n) return e;
  const o = c(t, "chOff"), s = c(t, "chExt"), r = o ? _(A(o, "x")) : n.x, l = o ? _(A(o, "y")) : n.y, a = s ? _(A(s, "cx")) : n.w, i = s ? _(A(s, "cy")) : n.h, h = a > 0 ? n.w / a : 1, d = i > 0 ? n.h / i : 1, m = n.x + n.w / 2, u = n.y + n.h / 2, y = n.rot * Math.PI / 180;
  return (g) => {
    let f = n.x + (g.x + g.w / 2 - r) * h, p = n.y + (g.y + g.h / 2 - l) * d, b = g.rot, w = g.flipH, x = g.flipV;
    if (n.flipH && (f = 2 * m - f, w = !w, b = -b), n.flipV && (p = 2 * u - p, x = !x, b = -b), y) {
      const S = f - m, I = p - u;
      f = m + S * Math.cos(y) - I * Math.sin(y), p = u + S * Math.sin(y) + I * Math.cos(y), b += n.rot;
    }
    const v = g.w * h, P = g.h * d;
    return e({ x: f - v / 2, y: p - P / 2, w: v, h: P, rot: (b % 360 + 360) % 360, flipH: w, flipV: x });
  };
}
function ie(t) {
  const e = c(t, "spcPts"), n = c(t, "spcPct");
  if (e) return { px: Math.max(0, Math.min(1584, A(e, "val") / 100)) * (_t / J) };
  if (n) return { lines: Math.max(0, Math.min(13.2, A(n, "val") / 1e5)) };
}
function ce(t, e, n) {
  const o = c(t, `lvl${e + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return o ? Se(o, n) : {};
}
function Se(t, e) {
  const n = {};
  if (k(t, "algn") && (n.algn = k(t, "algn")), k(t, "marL") !== null && (n.marL = _(A(t, "marL"))), k(t, "indent") !== null && (n.indent = _(A(t, "indent"))), c(t, "buNone")) n.bullet = "none";
  else if (c(t, "buAutoNum")) {
    const l = c(t, "buAutoNum");
    n.bullet = "num", n.numType = k(l, "type") || "arabicPeriod", n.startAt = k(l, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(A(l, "startAt", 1)))) : void 0;
  } else c(t, "buChar") ? (n.bullet = "char", n.buChar = k(c(t, "buChar"), "char") || void 0) : c(t, "buBlip") && (n.bullet = "char", n.buChar = "•");
  if (c(t, "buFont") ? n.buFont = k(c(t, "buFont"), "typeface") || null : c(t, "buFontTx") && (n.buFont = null), c(t, "buClr") ? n.buClr = q(c(t, "buClr"), e.ctx) : c(t, "buClrTx") && (n.buClr = null), c(t, "buSzPct")) {
    const l = k(c(t, "buSzPct"), "val") || "", a = l.endsWith("%") ? parseFloat(l) / 100 : Number(l) / 1e5;
    n.buSz = Number.isFinite(a) && a > 0 ? Math.max(0.25, Math.min(4, a)) : null;
  } else (c(t, "buSzTx") || c(t, "buSzPts")) && (n.buSz = null);
  const o = H(t, "lnSpc", "spcPct");
  o && (n.lnSpcPct = A(o, "val") / 1e5);
  const s = ie(c(t, "spcBef")), r = ie(c(t, "spcAft"));
  return s && (n.spcBef = s), r && (n.spcAft = r), Object.assign(n, Ce(c(t, "defRPr"), e)), n;
}
function Ce(t, e) {
  if (!t) return {};
  const n = {};
  k(t, "sz") !== null && (n.sz = A(t, "sz") / 100 * (_t / J)), U(t, "b") !== void 0 && (n.b = U(t, "b")), U(t, "i") !== void 0 && (n.i = U(t, "i")), k(t, "u") && (n.u = k(t, "u") !== "none"), k(t, "strike") && (n.strike = k(t, "strike") !== "noStrike");
  const o = c(t, "solidFill");
  o ? n.color = q(o, e.ctx) : c(t, "noFill") && (n.color = null);
  const s = k(c(t, "latin"), "typeface");
  return s && (n.font = s), n;
}
const un = {
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
}, hn = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function pn(t, e) {
  if (!t) return "•";
  let n = t.codePointAt(0);
  n >= 61440 && n <= 61695 && (n -= 61440);
  const o = (e || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && un[n] || "•" : o === "symbol" ? hn[n] ?? (n < 128 && n > 32 ? String.fromCharCode(n) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || n < 32 ? "•" : [...t][0];
}
const fe = (...t) => {
  const e = {};
  for (const n of t) for (const [o, s] of Object.entries(n)) s !== void 0 && (e[o] = s);
  return e;
};
function mn(t, e) {
  if (t)
    return t.startsWith("+mj") ? e.major : t.startsWith("+mn") ? e.minor : t;
}
function Zt(t, e, n) {
  if (!t) return;
  const o = R(t, "p");
  if (!o.some((f) => R(f).some((p) => (p.localName === "r" || p.localName === "fld") && (H(p, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let l = 1, a = 1, i = !1;
  for (const f of [...e.bodyPr, c(t, "bodyPr")]) {
    if (!f) continue;
    for (let b = 0; b < f.attributes.length; b++) r[f.attributes[b].localName ?? f.attributes[b].name] = f.attributes[b].value;
    const p = c(f, "normAutofit");
    p && (l = k(p, "fontScale") !== null ? A(p, "fontScale") / 1e5 : 1, i = !1), p && (a = 1 - Math.max(0, Math.min(0.9, A(p, "lnSpcReduction") / 1e5))), (c(f, "noAutofit") || c(f, "spAutoFit")) && (l = 1, a = 1, i = !0);
  }
  const h = !i && [...e.bodyPr, c(t, "bodyPr")].some((f) => f && c(f, "normAutofit")), d = (f, p) => r[f] !== void 0 ? _(Number(r[f]) || 0) : _(p), m = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", u = c(t, "lstStyle"), y = [];
  let g;
  for (const f of o) {
    const p = c(f, "pPr"), b = Math.max(0, Math.min(8, A(p, "lvl"))), w = e.fontRef ? { color: e.fontRef.color ?? void 0, font: e.fontRef.font } : {}, x = fe(...e.levels.map(($) => ce($, b, n)), w, ce(u, b, n), p ? Se(p, n) : {});
    x.lnSpcPct !== void 0 && g === void 0 && (g = x.lnSpcPct);
    const v = { runs: [], align: x.algn === "ctr" ? "ctr" : x.algn === "r" ? "r" : (x.algn === "just", "l"), level: b };
    if (x.bullet === "char" || x.bullet === "num") {
      if (v.bullet = x.bullet, v.marL = x.marL ?? 0, v.indent = x.indent ?? 0, x.bullet === "char") {
        const $ = pn(x.buChar, x.buFont ?? void 0);
        $ !== "•" && (v.bulletChar = $);
      } else
        x.numType && x.numType !== "arabicPeriod" && (v.numType = x.numType), x.startAt && x.startAt !== 1 && (v.startAt = x.startAt);
      x.buClr && (v.bulletColor = x.buClr), x.buSz && Math.abs(x.buSz - 1) > 1e-3 && (v.bulletScale = x.buSz);
    }
    const P = ($) => {
      const j = fe(x, Ce($, n)), E = (j.sz ?? 18 * _t / J) * l, N = j.color === null ? void 0 : j.color ?? gn("tx1", n);
      return {
        text: "",
        size: E,
        bold: j.b || void 0,
        italic: j.i || void 0,
        underline: j.u || void 0,
        strike: j.strike || void 0,
        color: N ?? void 0,
        font: mn(j.font ?? "+mn-lt", n.ctx.theme)
      };
    };
    for (const $ of R(f))
      if ($.localName === "r" || $.localName === "fld") {
        const j = H($, "t")?.textContent ?? "";
        if (!j) continue;
        j.split(/[\v\n]/).forEach((E, N) => {
          N > 0 && v.runs.push({ ...P(c($, "rPr")), br: !0 }), E && v.runs.push({ ...P(c($, "rPr")), text: E });
        });
      } else $.localName === "br" && v.runs.push({ ...P(c($, "rPr")), br: !0 });
    v.endSize = P(c(f, "endParaRPr")).size;
    const S = (v.runs.length ? Math.max(...v.runs.map(($) => $.size ?? 0)) : v.endSize ?? 0) * 1.2 * (x.lnSpcPct ?? 1), I = ($) => $ ? ("px" in $ ? $.px : $.lines * S) * a : 0, B = I(x.spcBef), V = I(x.spcAft);
    B > 0.05 && (v.spaceBefore = Math.round(B * 100) / 100), V > 0.05 && (v.spaceAfter = Math.round(V * 100) / 100), y.push(v);
  }
  return {
    paragraphs: y,
    anchor: m,
    insets: { l: d("lIns", 91440), t: d("tIns", 45720), r: d("rIns", 91440), b: d("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: g,
    ...h && { shrink: 1 },
    ...jt(r.vert) && { vert: jt(r.vert) }
  };
}
function jt(t) {
  if (t === "vert" || t === "eaVert" || t === "mongolianVert") return "vert";
  if (t === "vert270") return "vert270";
  if (t === "wordArtVert" || t === "wordArtVertRtl") return "stacked";
}
const gn = (t, e) => {
  const n = e.ctx.clrMap[t] ?? Ut[t] ?? t, o = e.ctx.theme.colors[n];
  return o ? { hex: o } : null;
}, ht = (t) => {
  const e = c(t, "ph");
  return e ? { type: k(e, "type") || "obj", idx: A(e, "idx") } : null;
}, wt = (t) => c(R(t).find((e) => e.localName.startsWith("nv")) ?? null, "nvPr"), St = /* @__PURE__ */ new Set(["title", "ctrTitle"]), de = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), ue = (t, e) => t === e || St.has(t) && St.has(e) || !de.has(t) && !de.has(e);
function Et(t, e) {
  const n = xn(t);
  if (e.idx) {
    const o = n.find((s) => s.ph.idx === e.idx && ue(s.ph.type, e.type));
    if (o) return o.el;
  }
  return (n.find((o) => o.ph.type === e.type && (o.ph.idx === e.idx || !e.idx || St.has(e.type))) ?? n.find((o) => o.ph.type === e.type) ?? n.find((o) => ue(o.ph.type, e.type)))?.el ?? null;
}
function xn(t) {
  const e = [];
  for (const n of nt(t)) {
    const o = ht(wt(n));
    o && e.push({ el: n, ph: o });
  }
  return e;
}
const Pe = (t) => St.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", bn = (t) => {
  const e = {};
  for (const n of R(c(t, "avLst"), "gd")) {
    const o = k(n, "name"), s = k(n, "fmla");
    o && s && (e[o] = s);
  }
  return e;
};
function yn(t) {
  const e = (r) => R(r, "gd").slice(0, 1e4).map((l) => [k(l, "name") || "", k(l, "fmla") || "val 0"]), n = R(c(t, "cxnLst"), "cxn").map((r) => [k(r, "ang") || "0", k(c(r, "pos"), "x") || "0", k(c(r, "pos"), "y") || "0"]), o = c(t, "rect"), s = R(c(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const l = [];
    for (const i of R(r)) {
      const h = R(i, "pt").map((d) => [k(d, "x") || "0", k(d, "y") || "0"]).flat();
      switch (i.localName) {
        case "moveTo":
          l.push(["M", ...h]);
          break;
        case "lnTo":
          l.push(["L", ...h]);
          break;
        case "quadBezTo":
          l.push(["Q", ...h]);
          break;
        case "cubicBezTo":
          l.push(["C", ...h]);
          break;
        case "arcTo":
          l.push(["A", k(i, "wR") || "0", k(i, "hR") || "0", k(i, "stAng") || "0", k(i, "swAng") || "0"]);
          break;
        case "close":
          l.push(["Z"]);
          break;
      }
    }
    const a = k(r, "fill");
    return { w: A(r, "w") || void 0, h: A(r, "h") || void 0, fill: a && a !== "norm" ? a : void 0, stroke: U(r, "stroke") === !1 ? !1 : void 0, d: l };
  });
  return {
    av: R(c(t, "avLst"), "gd").map((r) => [k(r, "name") || "", k(r, "fmla") || "val 0"]),
    gd: e(c(t, "gdLst")),
    cxn: n,
    rect: o ? [k(o, "l") || "l", k(o, "t") || "t", k(o, "r") || "r", k(o, "b") || "b"] : null,
    paths: s
  };
}
function kt(t, e) {
  const n = c(t, "prstGeom");
  if (n) {
    const s = {};
    for (const [r, l] of Object.entries(bn(n))) {
      const a = /^val\s+(-?\d+(\.\d+)?)/.exec(l);
      a && (s[r] = Number(a[1]));
    }
    return { geom: { kind: "preset", prst: k(n, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = c(t, "custGeom");
  if (o) {
    const s = yn(o);
    return { geom: { kind: "custom", paths: At(s, e.w, e.h) }, textRect: s.rect ? ke(s, e.w, e.h) : void 0 };
  }
}
function vt(t, e, n, o, s, r) {
  const l = [];
  if (s > Je)
    return n.warnings.push("Groups nested too deeply; the innermost were skipped."), l;
  for (const a of nt(t)) {
    if (++n.count > tn) {
      n.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const i = vn(a, e, n, o, s, r);
      i && l.push(...Array.isArray(i) ? i : [i]);
    } catch {
      n.warnings.push(`A ${a.localName} couldn't be read and was skipped.`);
    }
  }
  return l;
}
const wn = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function kn(t, e, n) {
  const o = c(t, "hlinkClick");
  if (!o) return;
  const s = k(o, "action") || "", r = n.rels(e).get(k(o, "r:id") || "");
  if (s.startsWith("ppaction://hlinkshowjump")) {
    const l = wn[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return l ? { kind: "action", action: l } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function vn(t, e, n, o, s, r) {
  const l = R(t).find((d) => d.localName.startsWith("nv")), a = Mn(t, e, n, o, s, r), i = c(l ?? null, "cNvPr"), h = a ? kn(i, e.part, n.pkg) : void 0;
  if (h) for (const d of Array.isArray(a) ? a : [a]) d.link = h;
  if (a && !Array.isArray(a)) {
    const d = k(i, "descr")?.trim();
    d && (a.descr = d), k(tt(i, "decorative", 3), "val") === "1" && (a.decorative = !0);
  }
  return a;
}
function Mn(t, e, n, o, s, r) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = R(t).find((m) => m.localName.startsWith("nv")), i = c(a ?? null, "cNvPr"), h = A(i, "id"), d = k(i, "name") || t.localName;
  if (k(i, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Pn(t, e, n, o, h, d, r);
    case "cxnSp": {
      const m = c(t, "spPr"), u = et(c(m, "xfrm"));
      if (!u) return null;
      const y = o(u), g = c(t, "style"), f = dt(c(m, "ln"), l) ?? qt(g, l) ?? { width: 1, color: { hex: "#000000" } };
      if (!f) return null;
      const p = kt(m, y) ?? { geom: { kind: "preset", prst: "line" } }, b = (x) => x ? { id: A(x, "id"), idx: A(x, "idx") } : void 0, w = c(a ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: h, name: d, ...y, geom: p.geom, line: f, start: b(c(w, "stCxn")), end: b(c(w, "endCxn")) };
    }
    case "pic": {
      const m = c(t, "spPr");
      let u = et(c(m, "xfrm"));
      const y = ht(c(a ?? null, "nvPr"));
      if (!u && y && (u = Sn(y, n)), !u) return null;
      const g = c(t, "blipFill"), f = g ? Me(g, l) : null;
      if (!f)
        return n.warnings.push(`Picture "${d}" has no image the importer can read.`), null;
      const p = c(g, "srcRect"), b = p ? { l: A(p, "l") / 1e5, t: A(p, "t") / 1e5, r: A(p, "r") / 1e5, b: A(p, "b") / 1e5 } : void 0, w = k(H(g, "blip", "alphaModFix"), "amt"), x = o(u), v = kt(m, x)?.geom, P = v && !(v.kind === "preset" && v.prst === "rect") ? v : void 0;
      return { kind: "picture", id: h, name: d, ...x, media: f, crop: b, alpha: w !== null ? Number(w) / 1e5 : void 0, geom: P, ...H(g, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const m = c(t, "grpSpPr"), u = c(m, "xfrm"), y = dn(u, o), g = vt(t, e, n, y, s + 1, r);
      if (!g.length) return null;
      const f = Ft(g);
      return { kind: "group", id: h, name: d, ...f, children: g };
    }
    case "graphicFrame":
      return En(t, e, n, o, h, d, s);
    default:
      return null;
  }
}
function Ft(t) {
  let e = 1 / 0, n = 1 / 0, o = -1 / 0, s = -1 / 0;
  for (const r of t)
    e = Math.min(e, r.x), n = Math.min(n, r.y), o = Math.max(o, r.x + r.w), s = Math.max(s, r.y + r.h);
  return { x: e, y: n, w: Math.max(0, o - e), h: Math.max(0, s - n) };
}
function Sn(t, e) {
  const n = Et(e.layout?.tree ?? null, t), o = et(H(n, "spPr", "xfrm"));
  if (o) return o;
  const s = Et(e.master?.tree ?? null, { type: Pe(t.type), idx: 0 });
  return et(H(s, "spPr", "xfrm"));
}
function Cn(...t) {
  for (const e of t) {
    const n = e();
    if (n !== void 0) return n;
  }
}
function Pn(t, e, n, o, s, r, l) {
  const a = { pkg: n.pkg, part: e.part, ctx: n.ctx }, i = wt(t), h = ht(i);
  if (h && !l) return null;
  const d = c(t, "spPr"), m = c(t, "style"), u = k(H(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", y = h && n.layout ? Et(n.layout.tree, h) : null, g = h && n.master ? Et(n.master.tree, { type: Pe(y ? ht(wt(y))?.type ?? h.type : h.type), idx: 0 }) : null, f = y && n.layout ? { pkg: n.pkg, part: n.layout.part, ctx: n.ctx } : null, p = g && n.master ? { pkg: n.pkg, part: n.master.part, ctx: n.ctx } : null;
  let b = et(c(d, "xfrm")) ?? et(H(y, "spPr", "xfrm")) ?? et(H(g, "spPr", "xfrm"));
  if (!b) return null;
  b = o(b);
  const w = kt(d, b) ?? (y ? kt(c(y, "spPr"), b) : void 0) ?? (g ? kt(c(g, "spPr"), b) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, v = (U(t, "useBgFill") ? n.background?.kind === "image" ? { kind: "none" } : n.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? ft(d, a) ?? Nt(m, a) ?? (f ? ft(c(y, "spPr"), f) : void 0) ?? (p ? ft(c(g, "spPr"), p) : void 0) ?? (f ? Nt(c(y, "style"), f) : void 0) ?? { kind: "none" }, P = Cn(
    () => dt(c(d, "ln"), a),
    () => qt(m, a),
    () => f ? dt(H(y, "spPr", "ln"), f) : void 0,
    () => p ? dt(H(g, "spPr", "ln"), p) : void 0
  ) ?? null, S = [];
  if (h) {
    const T = y ? ht(wt(y))?.type ?? h.type : h.type;
    S.push(St.has(T) ? n.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(T) ? n.masterTx.body : n.masterTx.other), S.push(H(g, "txBody", "lstStyle"), H(y, "txBody", "lstStyle"));
  } else
    S.push(n.defaultText);
  const I = c(m, "fontRef"), B = {
    levels: S,
    bodyPr: [H(g, "txBody", "bodyPr"), H(y, "txBody", "bodyPr")],
    fontRef: I ? { font: k(I, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: q(I, a.ctx) } : void 0
  }, V = Zt(c(t, "txBody"), B, a);
  if (!(v.kind !== "none" || !!P || !!V)) return null;
  let j = w.textRect;
  const E = et(c(d, "xfrm")), N = V ? et(c(t, "txXfrm")) : null;
  if (N && E && E.w > 0 && E.h > 0) {
    const T = b.w / E.w, O = b.h / E.h, M = { l: (N.x - E.x) * T, t: (N.y - E.y) * O, r: (N.x + N.w - E.x) * T, b: (N.y + N.h - E.y) * O };
    (Math.abs(M.l) > 0.5 || Math.abs(M.t) > 0.5 || Math.abs(M.r - b.w) > 0.5 || Math.abs(M.b - b.h) > 0.5) && (j = M);
  }
  return { kind: "shape", id: s, name: r, ...b, geom: w.geom, fill: v, line: P, text: V, textBox: u || void 0, textRect: j };
}
const Tn = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function An(t, e) {
  const n = { bdr: {} };
  if (!t) return n;
  const o = c(t, "tcStyle"), s = c(t, "tcTxStyle"), r = c(o, "fill"), l = r ? ft(r, e) : Nt(o, e);
  l && (n.fill = l);
  const a = q(s, e.ctx) ?? q(c(s, "fontRef"), e.ctx);
  a && (n.text = a), k(s, "b") === "on" && (n.bold = !0);
  const i = c(o, "tcBdr");
  for (const h of ["left", "right", "top", "bottom", "insideH", "insideV"]) {
    const d = c(i, h);
    if (!d) continue;
    const m = dt(c(d, "ln"), e) ?? qt(d, e);
    m !== void 0 && (n.bdr[h] = m);
  }
  return n;
}
function Nn(t, e, n) {
  const o = ((c(t, "tableStyleId")?.textContent || "").trim() || k(n, "def") || Tn).toUpperCase(), s = (u) => U(t, u) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") };
  let l = R(n, "tblStyle").find((u) => (k(u, "styleId") || "").toUpperCase() === o);
  if (!l) {
    const u = Ye(o);
    l = u ? c(e.pkg.parse(u), "tblStyle") ?? void 0 : void 0;
  }
  if (!l) return null;
  const a = (u) => An(c(l, u), e), i = c(l, "tblBg"), h = i ? c(i, "fill") ? ft(c(i, "fill"), e) : Nt(i, e) : void 0, d = {
    whole: a("wholeTbl"),
    b1H: a("band1H"),
    b2H: a("band2H"),
    b1V: a("band1V"),
    b2V: a("band2V"),
    firstRow: a("firstRow"),
    lastRow: a("lastRow"),
    firstCol: a("firstCol"),
    lastCol: a("lastCol")
  }, m = (u, y, g, f) => {
    const p = [0, g - 1, 0, f - 1], b = [u, u, 0, f - 1], w = [0, g - 1, y, y], x = [[d.whole, p]], v = u - (r.firstRow ? 1 : 0), P = y - (r.firstCol ? 1 : 0), S = (!r.firstRow || u > 0) && (!r.lastRow || u < g - 1), I = (!r.firstCol || y > 0) && (!r.lastCol || y < f - 1);
    r.bandCol && P >= 0 && I && x.push([P % 2 === 0 ? d.b1V : d.b2V, w]), r.bandRow && v >= 0 && S && x.push([v % 2 === 0 ? d.b1H : d.b2H, b]), r.firstCol && y === 0 && x.push([d.firstCol, w]), r.lastCol && y === f - 1 && x.push([d.lastCol, w]), r.firstRow && u === 0 && x.push([d.firstRow, b]), r.lastRow && u === g - 1 && x.push([d.lastRow, b]);
    const B = { edges: {} };
    for (const [V, [$, j, E, N]] of x) {
      V.fill && (B.fill = V.fill), V.text && (B.text = V.text), V.bold && (B.bold = !0);
      const T = (M, C, F) => F ? V.bdr[M] : V.bdr[C], O = {
        t: T("top", "insideH", u === $),
        b: T("bottom", "insideH", u === j),
        l: T("left", "insideV", y === E),
        r: T("right", "insideV", y === N)
      };
      for (const M of ["t", "b", "l", "r"]) O[M] !== void 0 && (B.edges[M] = O[M]);
    }
    return B;
  };
  return h && h.kind !== "none" && (m.background = h), m;
}
function he(t, e) {
  if (!t) return 0;
  const n = Math.max(8, e - t.insets.l - t.insets.r);
  if (t.vert) {
    const s = (a) => Math.max(0, ...a.runs.filter((i) => !i.br && i.text).map((i) => i.size ?? t.defaults?.size ?? 0)) || 18, r = (a) => s(a) * 1.2 * (t.lineSpacing ?? 1);
    let l = 0;
    if (t.vert === "stacked")
      for (const a of t.paragraphs) l = Math.max(l, a.runs.reduce((i, h) => i + h.text.length, 0) * r(a));
    else {
      const a = Math.max(1, Math.floor(n / Math.max(...t.paragraphs.map(r), 1)));
      l = t.paragraphs.reduce((h, d) => h + d.runs.reduce((m, u) => m + u.text.length, 0) * s(d) * 0.5, 0) / Math.max(1, a - t.paragraphs.length + 1) * 1.15;
    }
    return l + t.insets.t + t.insets.b;
  }
  let o = 0;
  for (const s of t.paragraphs) {
    const r = s.runs.filter((d) => !d.br), a = Math.max(0, ...r.filter((d) => d.text).map((d) => d.size ?? t.defaults?.size ?? 0)) || (s.endSize ?? 0) || 18, i = r.reduce((d, m) => d + m.text.length, 0), h = Math.max(1, Math.ceil(i * a * 0.5 / n)) + s.runs.filter((d) => d.br).length;
    o += h * a * 1.2 * (t.lineSpacing ?? 1) + (s.spaceBefore ?? 0) + (s.spaceAfter ?? 0);
  }
  return o + t.insets.t + t.insets.b;
}
function En(t, e, n, o, s, r, l = 0) {
  const a = { pkg: n.pkg, part: e.part, ctx: n.ctx }, i = et(c(t, "xfrm"));
  if (!i) return null;
  const h = H(t, "graphic", "graphicData"), d = c(h, "tbl");
  if (d) {
    const y = R(c(d, "tblGrid"), "gridCol").map((T) => _(A(T, "w"))), g = Nn(c(d, "tblPr"), a, n.tableStyles), f = [], p = [];
    let b = 1e6 + s * 1e3;
    const w = R(d, "tr"), x = w.map((T, O) => {
      const M = [];
      let C = 0, F = 0;
      for (const L of R(T, "tc")) {
        const z = Math.max(1, A(L, "gridSpan", 1));
        !U(L, "hMerge") && C < F && (C = F);
        const W = C, G = y.slice(W, W + z).reduce((Z, Q) => Z + Q, 0);
        if (C += 1, U(L, "hMerge") || (F = W + z), U(L, "hMerge") || U(L, "vMerge")) {
          M.push({
            covered: { h: U(L, "hMerge") || void 0, v: U(L, "vMerge") || void 0 },
            span: z,
            rowSpan: 1,
            col: W,
            w: G,
            fill: { kind: "none" },
            border: null,
            sides: { l: null, r: null, t: null, b: null }
          });
          continue;
        }
        const D = c(L, "tcPr"), X = g ? g(O, W, w.length, y.length) : null, lt = X?.text ? { color: X.text } : void 0, K = Zt(c(L, "txBody"), { levels: [n.defaultText], bodyPr: [], fontRef: lt }, a);
        if (K && X?.bold && K.paragraphs.forEach((Z) => Z.runs.forEach((Q) => {
          Q.bold === void 0 && (Q.bold = !0);
        })), K) {
          K.insets = { l: _(A(D, "marL", 91440)), r: _(A(D, "marR", 91440)), t: _(A(D, "marT", 45720)), b: _(A(D, "marB", 45720)) }, K.anchor = k(D, "anchor") === "ctr" ? "ctr" : k(D, "anchor") === "b" ? "b" : "t";
          const Z = jt(k(D, "vert"));
          Z ? K.vert = Z : delete K.vert;
        }
        const pt = ft(D, a) ?? X?.fill ?? { kind: "none" }, it = (Z, Q) => {
          const Jt = dt(c(D, Z), a);
          return Jt !== void 0 ? Jt : X ? X.edges[Q] ?? null : { width: 1, color: { hex: "#bfbfbf" } };
        }, ot = { l: it("lnL", "l"), r: it("lnR", "r"), t: it("lnT", "t"), b: it("lnB", "b") }, Ne = (Z, Q) => !Z && !Q || !!Z && !!Q && Z.width === Q.width && Z.color.hex === Q.color.hex && (Z.color.alpha ?? 1) === (Q.color.alpha ?? 1) && Z.dash === Q.dash, Qt = [ot.r, ot.t, ot.b].every((Z) => Ne(Z, ot.l)) ? ot.l : null;
        M.push({
          span: z,
          rowSpan: Math.max(1, A(L, "rowSpan", 1)),
          col: W,
          w: G,
          text: K,
          fill: pt,
          border: Qt,
          sides: ot,
          ...Qt === null && Object.values(ot).some(Boolean) && { split: !0 }
        });
      }
      return M;
    }), v = (T, O) => T < O * 0.7 ? O : T, P = w.map((T, O) => v(
      _(A(T, "h")),
      Math.max(0, ...x[O].filter((M) => !M.covered && M.rowSpan === 1).map((M) => he(M.text, M.w)))
    ));
    x.forEach((T, O) => T.forEach((M) => {
      if (M.covered || M.rowSpan < 2) return;
      const C = Math.min(w.length, O + M.rowSpan) - 1, F = P.slice(O, C + 1).reduce((z, W) => z + W, 0), L = he(M.text, M.w);
      v(F, L) > F && (P[C] += L - F);
    }));
    let S = i.y;
    const I = [], B = /* @__PURE__ */ new Set();
    if (x.forEach((T, O) => {
      const M = [];
      p.push({ h: P[O], cells: M });
      for (const C of T) {
        if (C.covered) {
          M.push({ fill: C.fill, borders: C.sides, hMerge: C.covered.h, vMerge: C.covered.v });
          continue;
        }
        const F = i.x + y.slice(0, C.col).reduce((z, W) => z + W, 0), L = P.slice(O, O + C.rowSpan).reduce((z, W) => z + W, 0);
        if (f.push({
          kind: "shape",
          id: b++,
          name: `${r} cell`,
          ...o({ x: F, y: S, w: C.w, h: L, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: C.fill,
          line: C.border,
          text: C.text
        }), C.split) {
          const z = (W, G, D, X, lt) => {
            if (!lt) return;
            const K = [W, G, D, X].map((pt) => Math.round(pt * 10)).join(",");
            B.has(K) || (B.add(K), I.push({
              kind: "connector",
              id: b++,
              name: `${r} rule`,
              ...o({ x: W, y: G, w: D - W, h: X - G, rot: 0, flipH: !1, flipV: !1 }),
              geom: { kind: "preset", prst: "line" },
              line: lt
            }));
          };
          z(F, S, F + C.w, S, C.sides.t), z(F, S + L, F + C.w, S + L, C.sides.b), z(F, S, F, S + L, C.sides.l), z(F + C.w, S, F + C.w, S + L, C.sides.r);
        }
        M.push({
          text: C.text ?? void 0,
          fill: C.fill,
          borders: C.sides,
          gridSpan: C.span > 1 ? C.span : void 0,
          rowSpan: C.rowSpan > 1 ? C.rowSpan : void 0
        });
      }
      S += P[O];
    }), !f.length) return null;
    if (f.push(...I), g?.background) {
      const T = Ft(f);
      f.unshift({
        kind: "shape",
        id: b++,
        name: `${r} background`,
        x: T.x,
        y: T.y,
        w: T.w,
        h: T.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: g.background,
        line: null
      });
    }
    const V = { kind: "group", id: s, name: r, ...Ft(f), children: f }, $ = o({ ...i, w: y.reduce((T, O) => T + O, 0), h: p.reduce((T, O) => T + O.h, 0) });
    if (g?.background || $.rot || $.flipH || $.flipV || p.some((T) => T.cells.length !== y.length)) return V;
    const j = $.w / Math.max(1e-6, y.reduce((T, O) => T + O, 0)), E = $.h / Math.max(1e-6, p.reduce((T, O) => T + O.h, 0)), N = (T) => U(c(d, "tblPr"), T) ?? !1;
    return {
      kind: "table",
      id: s,
      name: r,
      x: $.x,
      y: $.y,
      w: $.w,
      h: $.h,
      cols: y.map((T) => T * j),
      rows: p.map((T) => ({ ...T, h: T.h * E })),
      firstRow: N("firstRow") || void 0,
      bandRow: N("bandRow") || void 0,
      fallback: V
    };
  }
  const m = k(h, "uri") || "";
  if (/diagram/.test(m)) {
    const y = $n(h, e, n, o, i, s, r, l);
    if (y) return y;
    const g = In(h, e, n, o, i, s, r, a);
    if (g) return g;
  }
  if (/drawingml\/2006\/chart$/.test(m)) {
    const y = Fn(h, e, n);
    if (y) return { kind: "chart", id: s, name: r, ...o(i), chart: y };
  }
  const u = /chart/.test(m) ? "Chart" : /diagram/.test(m) ? "SmartArt diagram" : "Embedded object";
  return n.warnings.push(`${u} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(i),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${u}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
const pe = {
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
function Fn(t, e, n) {
  const o = tt(t, "chart", 2), s = o ? n.pkg.rels(e.part).get(k(o, "r:id") || "") : void 0, r = s && !s.external ? n.pkg.xml(s.target) : null, l = c(r, "chart"), a = c(l, "plotArea");
  if (!a) return null;
  const i = nt(a).find((N) => pe[N.localName]);
  if (!i) return null;
  nt(a).filter((N) => /Chart$/.test(N.localName)).length > 1 && n.warnings.push("A combination chart came in as its first chart type only.");
  let d = pe[i.localName];
  d === "column" && k(c(i, "barDir"), "val") === "bar" && (d = "bar");
  const m = k(c(i, "grouping"), "val") || "";
  m === "percentStacked" && n.warnings.push("A 100% stacked chart came in as a stacked chart.");
  let u = n.ctx;
  const y = n.pkg.relOfType(s.target, "themeOverride"), g = y ? c(n.pkg.xml(y), "clrScheme") : null;
  if (g) {
    const N = { ...u.theme.colors, ...ve(g) };
    u = { ...u, theme: { ...u.theme, colors: N } };
  }
  const f = c(r, "clrMapOvr");
  if (f && f.attributes.length) {
    const N = { ...u.clrMap };
    for (let T = 0; T < f.attributes.length; T++) N[f.attributes[T].localName ?? f.attributes[T].name] = f.attributes[T].value;
    u = { ...u, clrMap: N };
  }
  const p = (N, T) => {
    const O = tt(N, "strCache", 3) ?? tt(N, "numCache", 3) ?? tt(N, "strLit", 2) ?? tt(N, "numLit", 2) ?? c(tt(N, "multiLvlStrCache", 3), "lvl");
    if (!O) return [];
    const M = Math.min(1e4, A(c(O, "ptCount"), "val")), C = new Array(Math.max(0, M)).fill("");
    for (const F of R(O, "pt")) {
      const L = A(F, "idx");
      L >= 0 && L < 1e4 && (C[L] = c(F, "v")?.textContent ?? "");
    }
    return C;
  }, b = R(i, "ser").slice(0, 64);
  if (!b.length) return null;
  const w = p(c(b[0], "cat")), x = b.map((N, T) => {
    const M = p(c(N, "val")).map((z) => z === "" ? null : Number.isFinite(Number(z)) ? Number(z) : null), C = p(c(N, "tx"))[0] || c(N, "tx")?.textContent?.trim() || `Series ${T + 1}`, F = c(N, "spPr"), L = q(c(F, "solidFill"), u) ?? q(c(c(F, "ln"), "solidFill"), u);
    return { name: C, values: M, ...L && { color: L.hex } };
  }), v = Math.max(w.length, ...x.map((N) => N.values.length));
  for (; w.length < v; ) w.push(String(w.length + 1));
  const P = c(l, "title"), S = P ? $t(P, "t", 8).map((N) => N.textContent ?? "").join("").trim() || (x.length === 1 ? x[0].name : "") : "", I = k(H(l, "legend", "legendPos"), "val"), B = c(a, "valAx"), V = c(B, "scaling"), $ = (N) => {
    const T = c(N, "dLbls");
    return !!T && (k(c(T, "showVal"), "val") === "1" || k(c(T, "showPercent"), "val") === "1");
  }, j = k(c(V, "max"), "val"), E = k(c(V, "min"), "val");
  return {
    kind: d,
    categories: w,
    series: x,
    ...S && { title: S },
    ...(m === "stacked" || m === "percentStacked") && { stacked: !0 },
    legend: c(l, "legend") ? I === "b" ? "bottom" : I === "t" ? "top" : "right" : "none",
    ...($(i) || b.some($)) && { dataLabels: !0 },
    gridlines: !!c(B, "majorGridlines"),
    ...j !== null && Number.isFinite(Number(j)) && { yMax: Number(j) },
    ...E !== null && Number.isFinite(Number(E)) && { yMin: Number(E) }
  };
}
function $n(t, e, n, o, s, r, l, a) {
  const i = n.pkg.rels(e.part), h = k(c(t, "relIds"), "r:dm"), d = h ? i.get(h) : void 0;
  let m;
  if (d && !d.external) {
    const b = tt(n.pkg.xml(d.target), "dataModelExt", 6), w = b ? i.get(k(b, "relId") || "") : void 0;
    w && !w.external && (m = w.target);
  }
  if (!m) {
    const b = [...i.values()].filter((w) => w.type === "diagramDrawing" && !w.external);
    b.length === 1 && (m = b[0].target);
  }
  if (!m) return null;
  const u = c(n.pkg.xml(m), "spTree");
  if (!u) return null;
  const g = vt(u, { part: m, tree: u }, n, (b) => o({ ...b, x: b.x + s.x, y: b.y + s.y }), a + 1, !0);
  if (!g.length) return null;
  let f = 2e6 + r * 1e3;
  const p = (b) => b.forEach((w) => {
    w.id = f++, w.kind === "group" && p(w.children);
  });
  return p(g), { kind: "group", id: r, name: l, ...Ft(g), children: g };
}
function In(t, e, n, o, s, r, l, a) {
  const i = k(c(t, "relIds"), "r:dm"), h = i ? n.pkg.rels(e.part).get(i) : void 0;
  if (!h || h.external) return null;
  const d = n.pkg.xml(h.target), m = /* @__PURE__ */ new Map();
  for (const b of R(c(d, "ptLst"), "pt")) m.set(k(b, "modelId") || "", b);
  const u = /* @__PURE__ */ new Map();
  for (const b of R(c(d, "cxnLst"), "cxn")) {
    if ((k(b, "type") || "parOf") !== "parOf") continue;
    const w = k(b, "srcId") || "", x = k(b, "destId") || "";
    u.has(w) || u.set(w, []), u.get(w).push({ id: x, ord: A(b, "srcOrd") });
  }
  const y = [...m.values()].find((b) => k(b, "type") === "doc");
  if (!y) return null;
  const g = [], f = /* @__PURE__ */ new Set(), p = (b, w) => {
    if (!(f.has(b) || w > 16 || g.length > 500)) {
      f.add(b);
      for (const x of (u.get(b) ?? []).sort((v, P) => v.ord - P.ord)) {
        const v = m.get(x.id), P = k(v, "type") || "node";
        if (!v || P !== "node" && P !== "asst") continue;
        const S = Zt(c(v, "t"), { levels: [n.defaultText], bodyPr: [] }, a);
        for (const I of S?.paragraphs ?? [])
          I.runs.some((B) => !B.br && B.text.trim()) && g.push({
            ...I,
            align: "l",
            level: w,
            ...w > 0 ? { bullet: "char" } : {},
            runs: I.runs.map((B) => ({ ...B, size: B.size ?? (w > 0 ? 16 : 18), bold: B.bold ?? (w === 0 ? !0 : void 0) }))
          });
        p(x.id, w + 1);
      }
    }
  };
  return p(k(y, "modelId") || "", 0), g.length ? (n.warnings.push(`SmartArt diagram "${l}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: r,
    name: l,
    ...o(s),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: g, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function tt(t, e, n) {
  if (!t || n < 0) return null;
  for (const o of nt(t)) {
    if (o.localName === e) return o;
    const s = tt(o, e, n - 1);
    if (s) return s;
  }
  return null;
}
function Bt(t, e) {
  const n = c(t, "bg");
  if (!n) return;
  const o = c(n, "bgPr");
  if (o)
    return ft(o, e);
  const s = c(n, "bgRef");
  if (s) {
    const r = A(s, "idx"), a = (r >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (a ? Gt(a, { ...e, ctx: { ...e.ctx, phClr: q(s, e.ctx) ?? void 0 } }) : void 0) ?? (q(s, e.ctx) ? { kind: "solid", color: q(s, e.ctx) } : void 0);
  }
}
function Rn(t, e) {
  const n = t.relOfType(e, "notesSlide"), o = n ? H(t.xml(n), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (a) => {
    for (const i of nt(a)) {
      if (i.localName === "grpSp") {
        r(i);
        continue;
      }
      if (i.localName !== "sp") continue;
      const h = ht(wt(i));
      if (!(!h || h.type !== "body" && h.type !== "obj"))
        for (const d of R(c(i, "txBody"), "p")) {
          let m = "";
          for (const u of R(d))
            u.localName === "r" || u.localName === "fld" ? m += c(u, "t")?.textContent ?? "" : u.localName === "br" && (m += `
`);
          s.push(m);
        }
    }
  };
  r(o);
  const l = s.join(`
`).replace(/\s+$/, "");
  return l.trim() ? l : void 0;
}
function On(t) {
  for (const a of R(t, "AlternateContent"))
    for (const i of R(a, "Choice")) {
      const h = c(i, "transition");
      if (h && c(h, "morph")) {
        const d = k(h, "spd");
        return { kind: "morph", durationMs: k(h, "p14:dur") !== null ? A(h, "p14:dur") : d === "fast" ? 500 : d === "slow" ? 1e3 : 750 };
      }
    }
  const e = nt(t).find((a) => a.localName === "transition");
  if (!e) return;
  const n = R(e).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!n) return;
  const o = k(e, "spd"), s = k(e, "p14:dur") !== null ? A(e, "p14:dur") : o === "fast" ? 500 : o === "slow" ? 1e3 : 750, r = k(n, "dir"), l = (a) => a?.[0] === "r" || a?.[0] === "u" || a?.[0] === "d" ? a[0] : "l";
  switch (n.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: n.localName, dir: l(r), durationMs: s };
    case "split":
      return { kind: "split", orient: k(n, "orient") === "vert" ? "vert" : "horz", inward: r === "in" || void 0, durationMs: s };
    case "zoom":
      return { kind: "zoom", zoomIn: r !== "out", durationMs: s };
    case "morph":
      return { kind: "morph", durationMs: s };
    case "cut":
      return;
    default:
      return { kind: "fade", durationMs: s };
  }
}
function Ln(t, e) {
  const n = H(t, "timing", "tnLst");
  if (!n) return [];
  const o = [];
  let s = 0;
  const r = [], l = (a, i) => {
    if (!(i > 40))
      for (const h of nt(a)) {
        if (h.localName === "seq") {
          const d = c(h, "cTn"), m = k(d, "nodeType");
          if (m && m !== "mainSeq") {
            s++;
            continue;
          }
        }
        if (h.localName === "cTn" && k(h, "presetClass")) {
          r.push(h);
          continue;
        }
        l(h, i + 1);
      }
  };
  l(n, 0);
  for (const a of r) {
    const i = k(a, "presetClass");
    if (i !== "entr" && i !== "exit" && i !== "emph") {
      s++;
      continue;
    }
    const h = A(a, "presetID"), d = A(a, "presetSubtype"), m = k(a, "nodeType"), u = m === "clickEffect" ? "click" : m === "afterEffect" ? "after" : "with", y = Number(k(H(a, "stCondLst", "cond"), "delay")), g = $t(c(a, "childTnLst"), "cBhvr", 4), f = g.map((I) => tt(I, "spTgt", 2)).find(Boolean), p = f ? A(f, "spid") : NaN;
    if (!Number.isFinite(p) || tt(f, "txEl", 1)) {
      s++;
      continue;
    }
    const b = g.map((I) => Number(k(c(I, "cTn"), "dur"))).filter((I) => Number.isFinite(I) && I > 1), w = b.length ? Math.max(...b) : 500, { effect: x, known: v } = $e(i, h);
    v || e(`An animation PowerPoint calls preset ${h} (${i}) came in as a plain ${x}.`);
    const P = $t(c(a, "childTnLst"), "animRot", 2)[0], S = k(a, "repeatCount");
    o.push({
      target: p,
      cls: i,
      effect: x,
      presetId: h,
      subtype: d,
      start: u,
      durationMs: w,
      delayMs: Number.isFinite(y) ? Math.max(0, y) : 0,
      ...te(d) && (x === "fly" || x === "wipe") && { dir: te(d) },
      ...x === "spin" && P && { degrees: A(P, "by") / 6e4 },
      ...S === "indefinite" ? { repeat: -1 } : S && Number(S) > 1e3 ? { repeat: Math.round(Number(S) / 1e3) } : {}
    });
  }
  return s && e(`${s} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), o;
}
function $t(t, e, n) {
  if (!t || n < 0) return [];
  const o = [];
  for (const s of nt(t))
    s.localName === e ? o.push(s) : o.push(...$t(s, e, n - 1));
  return o;
}
function me(t) {
  const e = nt(t).find((s) => s.localName === "transition"), n = e ? k(e, "advTm") : null, o = n !== null ? Number(n) : NaN;
  return Number.isFinite(o) && o > 0 ? o : void 0;
}
function Bn(t, e) {
  const n = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of R(c(t, "sldIdLst"), "sldId")) {
    const l = e.get(k(r, "r:id") || ""), a = k(r, "id");
    l && a && o.set(a, l.target);
  }
  const s = tt(c(t, "extLst"), "sectionLst", 4);
  for (const r of R(s, "section")) {
    const l = (k(r, "name") || "").trim(), a = R(c(r, "sldIdLst"), "sldId")[0], i = a ? o.get(k(a, "id") || "") : void 0;
    l && i && !n.has(i) && n.set(i, l);
  }
  return n;
}
function Dn(t, e = {}) {
  const n = [], o = (E) => {
    n.length < 200 && !n.includes(E) && n.push(E);
  }, s = e.parseXml ?? ((E) => new DOMParser().parseFromString(E, "application/xml"));
  let r, l = 0, a = 0;
  try {
    r = Ee(t, {
      filter: (E) => (l++, a += E.originalSize, l <= se && E.originalSize <= Ke && a <= re)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (l > se || a > re) && o("The file is very large; some parts were skipped.");
  const i = new on(r, s, o), h = i.relOfType("", "officeDocument") ?? "ppt/presentation.xml", d = i.xml(h);
  if (!d || d.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const m = c(d, "sldSz"), u = m ? Math.max(1, _(A(m, "cx", 9144e3))) : 960, y = m ? Math.max(1, _(A(m, "cy", 5143500))) : 540, g = c(d, "defaultTextStyle"), f = i.rels(h), p = i.relOfType(h, "tableStyles"), b = p ? i.xml(p) : null, w = [], x = /* @__PURE__ */ new Set();
  for (const E of R(c(d, "sldIdLst"), "sldId")) {
    const N = f.get(k(E, "r:id") || "");
    N && !x.has(N.target) && w.length < Qe && (x.add(N.target), w.push(N.target));
  }
  const v = /* @__PURE__ */ new Map(), P = (E) => {
    const N = i.relOfType(E, "theme");
    return N ? (v.has(N) || v.set(N, It(i.xml(N))), v.get(N)) : It(null);
  }, S = (E) => {
    if (!E) return null;
    const N = {};
    for (let T = 0; T < E.attributes.length; T++) N[E.attributes[T].localName ?? E.attributes[T].name] = E.attributes[T].value;
    return N;
  }, I = Bn(d, f), B = [];
  w.forEach((E, N) => {
    const T = i.xml(E);
    if (!T) {
      o(`Slide ${N + 1} couldn't be read and was skipped.`);
      return;
    }
    const O = i.relOfType(E, "slideLayout"), M = O ? i.xml(O) : null, C = O ? i.relOfType(O, "slideMaster") : null, F = C ? i.xml(C) : null, L = C ? P(C) : It(null), z = S(H(T, "clrMapOvr", "overrideClrMapping")) ?? S(H(M, "clrMapOvr", "overrideClrMapping")) ?? S(c(F, "clrMap")) ?? Ut, W = { theme: L, clrMap: z }, G = c(F, "txStyles"), D = {
      pkg: i,
      ctx: W,
      slide: { part: E, tree: H(T, "cSld", "spTree") },
      layout: O ? { part: O, tree: H(M, "cSld", "spTree") } : null,
      master: C ? { part: C, tree: H(F, "cSld", "spTree") } : null,
      masterTx: { title: c(G, "titleStyle"), body: c(G, "bodyStyle"), other: c(G, "otherStyle") },
      defaultText: g,
      warnings: n,
      count: 0,
      tableStyles: b
    }, X = (ot) => ({ pkg: i, part: ot?.part ?? E, ctx: W }), lt = Bt(c(T, "cSld"), X(D.slide)) ?? Bt(c(M, "cSld"), X(D.layout)) ?? Bt(c(F, "cSld"), X(D.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    D.background = lt;
    const K = [], pt = U(T, "showMasterSp") !== !1 && U(M, "showMasterSp") !== !1;
    D.master && pt && K.push(...vt(D.master.tree, D.master, D, Lt, 0, !1)), D.layout && U(T, "showMasterSp") !== !1 && K.push(...vt(D.layout.tree, D.layout, D, Lt, 0, !1)), K.push(...vt(D.slide.tree, D.slide, D, Lt, 0, !0)), B.push({
      items: K,
      background: lt,
      transition: On(T),
      name: k(c(T, "cSld"), "name") || void 0,
      notes: Rn(i, E),
      key: E,
      ...k(T, "show") === "0" && { hidden: !0 },
      ...me(T) && { advanceAfterMs: me(T) },
      ...I.has(E) && { section: I.get(E) }
    });
    const it = Ln(T, o);
    it.length && (B[B.length - 1].anims = it);
  }), B.length || o("The presentation has no slides.");
  const V = H(i.xml("docProps/core.xml"), "title")?.textContent || void 0, $ = i.relOfType(h, "presProps"), j = k(c($ ? i.xml($) : null, "showPr"), "loop");
  return { deck: { width: u, height: y, slides: B, title: V, ...(j === "1" || j === "true") && { loop: !0 } }, warnings: n };
}
const zn = 80, jn = "default-layer", Y = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const e = t.hex.replace("#", "");
  return `rgba(${parseInt(e.slice(0, 2), 16)}, ${parseInt(e.slice(2, 4), 16)}, ${parseInt(e.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, Hn = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, Xn = /(courier|consolas|mono|menlo|code)/i;
function Ht(t) {
  if (!t) return "sans-serif";
  const e = ze(t);
  return e || (Xn.test(t) ? "monospace" : Hn.test(t) ? "serif" : "sans-serif");
}
function Vn(t) {
  const e = [];
  let n = [], o = !1;
  const s = () => {
    if (n.length >= 2) {
      const r = n[0], l = n[n.length - 1];
      o && Math.hypot(r.x - l.x, r.y - l.y) < 1e-6 && (r.inX = l.inX, r.inY = l.inY, n.pop()), e.push({ anchors: n, closed: o });
    }
    n = [], o = !1;
  };
  for (const r of t)
    if (r.op === "M")
      s(), n.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "L")
      n.length ? n.push({ x: r.x, y: r.y, kind: "corner" }) : n.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "C") {
      const l = n[n.length - 1];
      if (!l) {
        n.push({ x: r.x, y: r.y, kind: "corner" });
        continue;
      }
      l.outX = r.x1 - l.x, l.outY = r.y1 - l.y, n.push({ x: r.x, y: r.y, inX: r.x2 - r.x, inY: r.y2 - r.y, kind: "smooth" });
    } else r.op === "Z" && (o = !0, s());
  return s(), e;
}
const Wn = (t, e, n) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + e, y1: o.y1 + n, x2: o.x2 + e, y2: o.y2 + n, x: o.x + e, y: o.y + n } : { ...o, x: o.x + e, y: o.y + n });
function Yn(t, e, n) {
  let o = !1;
  t.forEach((s, r) => {
    s.start === "click" && (o = !0);
    const l = e.itemEls?.get(s.target);
    if (!l?.length) {
      e.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    l.forEach((a, i) => {
      const h = Ie(i === 0 ? s : { ...s, start: "with", delayMs: s.delayMs }, n("anim"), !o);
      h.order = r + i / (l.length + 1), (a.animations ??= []).push(h);
    });
  });
}
function _n(t, e) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return Be(t.action);
  const n = e.slideIds?.get(t.key);
  return n ? De(n) : null;
}
async function Un(t) {
  if (!(typeof document > "u"))
    try {
      const e = new Image();
      e.src = t, await e.decode();
      const n = document.createElement("canvas");
      n.width = Math.max(1, Math.min(8192, e.naturalWidth)), n.height = Math.max(1, Math.min(8192, e.naturalHeight));
      const o = n.getContext("2d");
      return o ? (o.filter = "grayscale(1)", o.drawImage(e, 0, 0, n.width, n.height), n.toDataURL(/^data:image\/jpeg/.test(t) ? "image/jpeg" : "image/png", 0.92)) : void 0;
    } catch {
      return;
    }
}
async function Gn(t, e) {
  const n = /* @__PURE__ */ new Set(), o = (r) => {
    for (const l of r)
      if (l.kind === "group") o(l.children);
      else if (l.kind === "picture" && l.grayscale) {
        const a = e.get(l.media)?.url;
        a && n.add(a);
      } else if (l.kind === "shape" && l.fill.kind === "image" && l.fill.grayscale) {
        const a = e.get(l.fill.media)?.url;
        a && n.add(a);
      }
  };
  t.slides.forEach((r) => o(r.items));
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (r) => {
    const l = await Un(r);
    l && s.set(r, l);
  })), s;
}
async function qn(t, e, n, o) {
  if (!(typeof document > "u"))
    try {
      const s = new Image();
      s.src = t, await s.decode();
      const r = document.createElement("canvas");
      r.width = Math.max(1, Math.min(4096, Math.round(e))), r.height = Math.max(1, Math.min(4096, Math.round(n)));
      const l = r.getContext("2d");
      if (!l) return;
      if (o) {
        const a = l.createPattern(s, "repeat");
        if (!a) return;
        a.setTransform(new DOMMatrix().scale(o.sx, o.sy)), l.fillStyle = a, l.fillRect(0, 0, r.width, r.height);
      } else {
        if (Math.abs(s.naturalWidth / s.naturalHeight - e / n) < 0.01) return;
        l.drawImage(s, 0, 0, r.width, r.height);
      }
      return r.toDataURL(o ? "image/png" : "image/jpeg", 0.92);
    } catch {
      return;
    }
}
function at(t, e, n, o) {
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
    layerId: jn,
    groupIds: [...o].reverse(),
    // innermost first, the store's convention
    name: n.name
  };
}
function ge(t, e, n) {
  switch (e.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = Y(e.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = e.kind, t.backgroundColor = Y(e.stops[0]?.color), t.gradientStops = e.stops.map((o) => ({ offset: o.pos, color: Y(o.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
      break;
    case "pattern": {
      t.backgroundColor = Y(e.color), t.fillStyle = "pattern", t.patternFill = io(e.preset, Y(e.color), e.bg ? Y(e.bg) : "transparent");
      break;
    }
    case "image": {
      const o = n.images.get(e.media);
      o && (t.fillStyle = "image", t.backgroundImage = e.grayscale && n.gray.get(o.url) || o.url, t.backgroundColor = "#ffffff"), o && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
      break;
    }
  }
}
function Xt(t, e) {
  if (!e || !(e.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = Y(e.color), t.strokeWidth = Math.max(0.5, e.width), t.strokeStyle = e.dash === "sysDot" ? "dotted" : e.dash ? "dashed" : "solid", (e.join === "miter" || e.join === "bevel") && (t.strokeLineJoin = e.join), e.cap === "flat" ? t.strokeLineCap = "butt" : e.cap === "sq" && (t.strokeLineCap = "square");
}
function Zn(t) {
  const e = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!e) return {};
  const n = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[e[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[e[2]], s = {};
  return n && (s.listNumberStyle = n), o && (s.listNumberSuffix = o), s;
}
function Kn(t, e) {
  const n = t.bullet === "num" ? Zn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? e.defaults?.color;
  return t.bulletColor && Y(t.bulletColor) !== Y(o) && (n.listMarkerColor = Y(t.bulletColor)), t.bulletScale && (n.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (n.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), n.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), n;
}
const Dt = (t, e) => Math.round(((t.paragraphs[e - 1]?.spaceAfter ?? 0) + (t.paragraphs[e]?.spaceBefore ?? 0)) * 100) / 100;
function Te(t, e) {
  const n = t.paragraphs.flatMap((f) => f.runs.filter((p) => !p.br)), o = n[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), l = (f) => f.runs.reduce((p, b) => p + (b.br ? 0 : b.text.trim().length), 0);
  for (const f of t.paragraphs) {
    const p = l(f);
    p && r.set(f.align ?? "l", (r.get(f.align ?? "l") ?? 0) + p);
  }
  const a = [...r].sort((f, p) => p[1] - f[1])[0]?.[0] ?? t.paragraphs.find((f) => f.runs.length)?.align ?? "l", i = (f) => l(f) > 0 && (f.align ?? "l") !== a ? f.align === "ctr" ? "center" : f.align === "r" ? "right" : "left" : void 0, h = n.every((f) => f.size === o?.size && f.bold === o?.bold && f.italic === o?.italic && f.underline === o?.underline && f.strike === o?.strike && f.font === o?.font && Y(f.color) === Y(o?.color)) && !t.paragraphs.some((f) => f.bullet) && !t.paragraphs.some((f, p) => p > 0 && Dt(t, p) > 0) && !t.paragraphs.some(i), d = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Ht(o?.font),
    textAlign: a === "ctr" ? "center" : a === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: Y(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (d.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2))), t.shrink !== void 0 && t.wrap && (d.textFit = "shrink");
  const m = t.paragraphs.map((f) => f.runs.map((p) => p.br ? `
` : p.text).join("")).join(`
`);
  if (h)
    return o?.bold && (d.fontWeight = 700), o?.italic && (d.fontStyle = "italic"), e ? d.containerText = m : d.text = m, { fields: d, rich: !1 };
  const u = [], y = [], g = [];
  return t.paragraphs.forEach((f, p) => {
    const b = f.level ?? 0;
    if (f.bullet === "num") {
      const v = f.numType ?? "arabicPeriod";
      (y[b] === void 0 || g[b] !== v) && (y[b] = (f.startAt ?? 1) - 1), y[b]++, g[b] = v, y.length = b + 1, g.length = b + 1;
    } else
      y.length = Math.min(y.length, b), g.length = y.length;
    const w = f.bullet ? { listType: f.bullet === "num" ? "ordered" : "bullet", listLevel: b, ...Kn(f, t) } : {};
    f.bullet === "num" && (w.listIndex = y[b]), (f.runs.length ? f.runs : [{ text: "" }]).forEach((v, P) => {
      const S = { text: v.br ? `
` : v.text, ...P === 0 ? w : {} };
      P === 0 && p > 0 && Dt(t, p) > 0 && (S.paragraphSpaceBefore = Dt(t, p));
      const I = i(f);
      I && (S.paragraphAlign = I), v.bold && (S.bold = !0), v.italic && (S.italic = !0), v.underline && (S.underline = !0), v.strike && (S.strikethrough = !0), v.color && (S.color = Y(v.color)), v.size && (S.fontSize = Math.round(v.size * 10) / 10), v.font && (S.fontFamily = Ht(v.font)), u.push(S);
    }), p < t.paragraphs.length - 1 && u.push({ text: `
` });
  }), e ? (d.richContainerText = u, d.containerText = m) : (d.richText = u, d.text = m), { fields: d, rich: !0 };
}
function Tt(t, e, n, o, s) {
  const { fields: r, rich: l } = Te(e, !1), a = 4, i = at(t, l ? "richtext" : "text", {
    ...n,
    x: n.x + e.insets.l - a,
    y: n.y + e.insets.t - a,
    w: Math.max(n.w - e.insets.l - e.insets.r + a * 2, 8),
    h: Math.max(n.h - e.insets.t - e.insets.b + a * 2, 8)
  }, o);
  return Object.assign(i, r, { autoResize: !e.wrap, strokeColor: r.textColor }), i;
}
const Ae = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function Kt(t, e, n) {
  if (t.text?.vert) {
    const m = t.fill.kind !== "none" || !!t.line, u = m ? e.nextId("group") : null, y = u ? [...n, u] : n, g = m ? Kt({ ...t, text: void 0 }, e, y) : [], f = t.text, p = f.insets, b = f.vert === "vert" ? 90 : f.vert === "vert270" ? 270 : 0, w = t.x + t.w / 2, x = t.y + t.h / 2, v = f.vert === "vert" ? { l: p.t, r: p.b, t: p.r, b: p.l } : f.vert === "vert270" ? { l: p.b, r: p.t, t: p.l, b: p.r } : p, P = b ? { name: t.name, x: w - t.h / 2, y: x - t.w / 2, w: t.h, h: t.w, rot: (t.rot ?? 0) + b } : { name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot }, S = Tt(e, { ...f, insets: v }, P, y);
    return f.vert === "stacked" && (S.verticalText = !0), e.stats.elements++, [...g, S];
  }
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return e.stats.elements++, [Tt(e, t.text, t, n)];
  if (o.kind === "preset" && Ae.has(o.prst)) return Vt({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, e, n);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((m) => !m.cmds.some((u) => u.op === "Z")))
    return Vt({ ...t, kind: "connector", line: t.line }, e, n);
  const s = Jn(t);
  if (s) {
    const m = at(e, s.type, t, n);
    Object.assign(m, s.extra), ge(m, t.fill, e), Xt(m, t.line), e.byPptId.set(t.id, { el: m, item: t }), e.stats.elements++;
    const u = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, y = t.text?.insets, g = Math.abs(u.l) > 0.5 || Math.abs(u.t) > 0.5 || Math.abs(u.r - t.w) > 0.5 || Math.abs(u.b - t.h) > 0.5, f = !!y && Math.max(y.l, y.r, y.t, y.b) > 16;
    if (t.text && (g || f)) {
      const p = e.nextId("group");
      return m.groupIds = [...n, p].reverse(), e.stats.elements++, [m, Tt(e, t.text, { ...t, rot: 0, x: t.x + u.l, y: t.y + u.t, w: u.r - u.l, h: u.b - u.t }, [...n, p])];
    }
    if (t.text) {
      const { fields: p } = Te(t.text, !0);
      Object.assign(m, p);
    }
    return [m];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const m = e.presets[o.prst];
    if (!m)
      return e.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), At(e.presets.rect, t.w, t.h);
    const u = Object.fromEntries(Object.entries(o.adj ?? {}).map(([y, g]) => [y, `val ${g}`]));
    return At(m, t.w, t.h, u);
  })(), l = [], a = (t.text || r.some((m) => m.fill === !1)) && r.some((m) => m.fill !== !1) ? e.nextId("group") : null, i = a ? [...n, a] : n, h = /* @__PURE__ */ new Map();
  for (const m of r) {
    const u = `${m.fill === !1 ? "nofill" : "fill"}|${m.stroke === !1 ? "nostroke" : "stroke"}`;
    h.has(u) || h.set(u, []), h.get(u).push(m);
  }
  let d = null;
  for (const [m, u] of h) {
    const y = u.flatMap((w) => w.cmds), g = Re(y);
    if (!g) continue;
    const f = Vn(Wn(y, -g.minX, -g.minY));
    if (!f.length) continue;
    const p = at(e, "path", { ...t, x: t.x + g.minX, y: t.y + g.minY, w: Math.max(g.maxX - g.minX, 1), h: Math.max(g.maxY - g.minY, 1) }, i);
    !(Math.abs(g.minX + g.maxX - t.w) < 0.5 && Math.abs(g.minY + g.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && Qn(p, f, t, g), p.pathSubpaths = f, p.pathAnchors = f[0].anchors, p.pathClosed = f[0].closed, m.startsWith("fill") ? ge(p, t.fill, e) : p.backgroundColor = "transparent", m.endsWith("|stroke") ? Xt(p, t.line) : (p.strokeColor = "transparent", p.strokeWidth = 0), l.push(p), d ??= p, e.stats.paths++;
  }
  if (d && e.byPptId.set(t.id, { el: d, item: t }), t.text) {
    const m = t.textRect ?? (o.kind === "preset" && e.presets[o.prst] ? ke(e.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    l.push(Tt(e, t.text, { ...t, x: t.x + m.l, y: t.y + m.t, w: m.r - m.l, h: m.b - m.t }, i));
  }
  return e.stats.elements += l.length, l;
}
function Qn(t, e, n, o) {
  const s = n.w / 2, r = n.h / 2, l = (n.rot || 0) * Math.PI / 180, a = Math.cos(l), i = Math.sin(l), h = n.flipH ? -1 : 1, d = n.flipV ? -1 : 1, m = (b, w) => {
    const x = (b + o.minX - s) * h, v = (w + o.minY - r) * d;
    return { x: s + x * a - v * i, y: r + x * i + v * a };
  }, u = (b, w) => {
    const x = b * h, v = w * d;
    return { x: x * a - v * i, y: x * i + v * a };
  };
  let y = 1 / 0, g = 1 / 0, f = -1 / 0, p = -1 / 0;
  for (const b of e) for (const w of b.anchors) {
    const x = m(w.x, w.y);
    if (w.x = x.x, w.y = x.y, w.inX !== void 0) {
      const v = u(w.inX, w.inY ?? 0);
      w.inX = v.x, w.inY = v.y;
    }
    if (w.outX !== void 0) {
      const v = u(w.outX, w.outY ?? 0);
      w.outX = v.x, w.outY = v.y;
    }
    y = Math.min(y, w.x), g = Math.min(g, w.y), f = Math.max(f, w.x), p = Math.max(p, w.y);
  }
  for (const b of e) for (const w of b.anchors)
    w.x -= y, w.y -= g;
  t.x = t.x - o.minX + y, t.y = t.y - o.minY + g, t.width = Math.max(f - y, 1), t.height = Math.max(p - g, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Jn(t) {
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
const xe = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function Vt(t, e, n) {
  const o = t.geom;
  let s;
  if (o.kind === "preset" && Ae.has(o.prst)) s = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (o.kind === "custom") s = o.paths.flatMap((x) => x.cmds);
  else {
    const x = e.presets[o.prst], v = Object.fromEntries(Object.entries(o.adj ?? {}).map(([P, S]) => [P, `val ${S}`]));
    s = x ? At(x, t.w, t.h, v).flatMap((P) => P.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, l = t.h / 2, a = (t.rot || 0) * Math.PI / 180, i = (x, v) => {
    let P = x - r, S = v - l;
    return t.flipH && (P = -P), t.flipV && (S = -S), { x: t.x + r + P * Math.cos(a) - S * Math.sin(a), y: t.y + l + P * Math.sin(a) + S * Math.cos(a) };
  }, h = [];
  let d = { x: 0, y: 0 };
  for (const x of s)
    if (x.op === "M" || x.op === "L")
      d = { x: x.x, y: x.y }, h.push(i(d.x, d.y));
    else if (x.op === "C") {
      for (let v = 1; v <= 12; v++) {
        const P = v / 12, S = 1 - P, I = S * S * S * d.x + 3 * S * S * P * x.x1 + 3 * S * P * P * x.x2 + P * P * P * x.x, B = S * S * S * d.y + 3 * S * S * P * x.y1 + 3 * S * P * P * x.y2 + P * P * P * x.y;
        h.push(i(I, B));
      }
      d = { x: x.x, y: x.y };
    }
  if (h.length < 2) return [];
  const m = Math.min(...h.map((x) => x.x)), u = Math.min(...h.map((x) => x.y)), y = Math.max(...h.map((x) => x.x)), g = Math.max(...h.map((x) => x.y)), f = t.line.head && xe[t.line.head.type], p = t.line.tail && xe[t.line.tail.type], b = at(e, f || p ? "arrow" : "line", { ...t, x: m, y: u, w: Math.max(y - m, 1), h: Math.max(g - u, 1), rot: 0, flipH: !1, flipV: !1 }, n);
  b.points = h.map((x) => ({ x: x.x - m, y: x.y - u })), b.curveType = "straight", b.startArrowhead = f ?? null, b.endArrowhead = p ?? null, Xt(b, t.line);
  const w = (x, v) => {
    if (!x) return null;
    const P = e.byPptId.get(x.id);
    if (!P || !P.el.width || !P.el.height) return null;
    const S = P.el;
    return { elementId: S.id, focus: 0, gap: 0, anchorFractionX: (v.x + e.ox - S.x) / S.width, anchorFractionY: (v.y + e.oy - S.y) / S.height };
  };
  return e.glue.push(() => {
    b.startBinding = w(t.start, h[0]), b.endBinding = w(t.end, h[h.length - 1]);
  }), e.stats.elements++, [b];
}
function to(t, e, n) {
  const o = e.images.get(t.media);
  if (!o) {
    e.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const i = at(e, "rectangle", t, n);
    return Object.assign(i, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), e.stats.elements++, [i];
  }
  const s = at(e, "image", t, n);
  if (s.dataURL = t.grayscale && e.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = Yt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), e.stats.elements++, e.stats.pictures++, !t.geom) return [s];
  const r = e.nextId("group"), l = Kt({
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
  }, e, [...n, r]);
  if (l.length !== 1)
    return e.stats.elements -= l.length, [s];
  const a = l[0];
  return a.isClipMask = !0, s.groupIds = [r, ...s.groupIds], s.clipMaskId = a.id, s.maskType = "clip", [s, a];
}
const Mt = (t, e) => !t && !e || !!t && !!e && t.hex.toLowerCase() === e.hex.toLowerCase() && Math.abs((t.alpha ?? 1) - (e.alpha ?? 1)) < 0.01, zt = (t, e) => t.kind === e.kind && (t.kind === "none" || t.kind === "solid" && e.kind === "solid" && Mt(t.color, e.color)), eo = (t, e) => !t && !e || !!t && !!e && Math.abs(t.width - e.width) < 0.05 && Mt(t.color, e.color) && (t.dash ?? "solid") === (e.dash ?? "solid"), st = (t, e) => t.every((n) => e(n, t[0]));
function no(t, e, n) {
  const o = !!t.firstRow;
  return be(t, o, e, n) ?? (t.rows.length < 2 ? null : be(t, !o, e, n));
}
function be(t, e, n, o) {
  const s = t.rows.length, r = t.cols.length;
  if (!s || !r) return null;
  const l = t.rows.map((M) => M.cells.map((C) => C.fill));
  if (l.flat().some((M) => M.kind !== "none" && M.kind !== "solid")) return null;
  const a = [], i = [], h = Array.from({ length: r }, () => []), d = [];
  for (let M = 0; M < s; M++) {
    const C = [];
    for (let F = 0; F < r; F++) {
      const L = t.rows[M].cells[F], z = L.text, W = z ? z.paragraphs.map((D) => D.runs.map((X) => X.br ? `
` : X.text).join("")).join(`
`) : "";
      if (C.push(L.hMerge || L.vMerge ? "" : W), L.hMerge || L.vMerge || !z || !W.trim()) continue;
      if (d.push(z.anchor), z.paragraphs.some((D) => D.bullet) || z.vert) return null;
      const G = z.defaults ?? {};
      for (const D of z.paragraphs) {
        h[F].push(D.align ?? "l");
        for (const X of D.runs)
          if (!(X.br || !X.text.trim())) {
            if ((X.underline ?? G.underline) || (X.strike ?? G.strike)) return null;
            i.push({ row: M, col: F, p: { size: X.size ?? G.size ?? 18, font: X.font ?? G.font, bold: !!(X.bold ?? G.bold), italic: !!(X.italic ?? G.italic), color: X.color ?? G.color } });
          }
      }
    }
    a.push(C);
  }
  const m = i.map((M) => M.p);
  if (m.length && !st(m, (M, C) => Math.abs(M.size - C.size) < 0.5 && (M.font ?? "") === (C.font ?? "") && M.italic === C.italic)) return null;
  const u = i.filter((M) => e && M.row === 0).map((M) => M.p), y = i.filter((M) => !(e && M.row === 0)).map((M) => M.p);
  if (!st(y, (M, C) => M.bold === C.bold && Mt(M.color, C.color)) || !st(u, (M, C) => Mt(M.color, C.color))) return null;
  const g = y[0]?.bold ?? !1;
  if (u.some((M) => !M.bold) || !st(d, (M, C) => M === C)) return null;
  const f = [];
  for (const M of h) {
    if (!st(M, (C, F) => C === F)) return null;
    f.push(M[0] === "r" ? "right" : M[0] === "ctr" ? "center" : "left");
  }
  const p = (M, C) => !t.rows[M].cells[C].hMerge && !t.rows[M].cells[C].vMerge, b = (M) => {
    const C = l[M].filter((F, L) => p(M, L));
    return C.length && st(C, zt) ? C[0] : C.length ? null : { kind: "none" };
  }, w = t.rows.map((M, C) => b(C));
  if (w.some((M) => !M)) return null;
  const x = w.slice(e ? 1 : 0), v = x.filter((M, C) => C % 2 === 0), P = x.filter((M, C) => C % 2 === 1);
  if (!st(v, zt) || !st(P, zt)) return null;
  const S = (M) => M && M.kind === "solid" ? Y(M.color) : "", I = S(v[0]), B = P.length ? S(P[0]) : I;
  if (!I && B) return null;
  const V = t.rows.flatMap((M, C) => M.cells.filter((F, L) => p(C, L)).flatMap((F) => [F.borders.l, F.borders.r, F.borders.t, F.borders.b]));
  if (!st(V, eo)) return null;
  const $ = V[0] ?? null, j = [];
  t.rows.forEach((M, C) => M.cells.forEach((F, L) => {
    ((F.gridSpan ?? 1) > 1 || (F.rowSpan ?? 1) > 1) && j.push({ startRow: C, startCol: L, endRow: Math.min(s - 1, C + (F.rowSpan ?? 1) - 1), endCol: Math.min(r - 1, L + (F.gridSpan ?? 1) - 1) });
  }));
  const E = t.cols.reduce((M, C) => M + C, 0), N = t.rows.reduce((M, C) => M + C.h, 0), T = at(n, "table", { ...t, w: E, h: N }, o), O = m[0];
  return Object.assign(T, {
    tableRows: e ? s - 1 : s,
    tableCols: r,
    tableHeaders: e,
    tableData: a,
    tableColWidths: t.cols.map((M) => M / (E || 1)),
    tableRowHeights: t.rows.map((M) => M.h / (N || 1)),
    tableHeaderColor: e ? S(w[0]) : "",
    tableHeaderTextColor: u[0]?.color && !Mt(u[0].color, y[0]?.color) ? Y(u[0].color) : "",
    tableRowColor: I,
    tableAltRowColor: B !== I ? B : "",
    // A presentation table isn't a sortable list: no arrows in its header.
    tableColAlignments: f,
    tableSortCol: -1,
    tableSortDir: "asc",
    tableSortArrows: !1,
    ...d[0] && d[0] !== "ctr" && { tableVerticalAlign: d[0] === "t" ? "top" : "bottom" },
    ...j.length && { tableMergedCells: j },
    strokeColor: $ ? Y($.color) : "transparent",
    strokeWidth: $ ? $.width : 1,
    fontSize: O?.size ?? 14,
    fontFamily: Ht(O?.font),
    textColor: Y(y[0]?.color ?? u[0]?.color ?? { hex: "#000000" }),
    ...g && { fontWeight: "bold" },
    ...O?.italic && { fontStyle: "italic" }
  }), $?.dash && $.dash !== "solid" && (T.strokeStyle = /dot/i.test($.dash) ? "dotted" : "dashed"), T;
}
function Wt(t, e, n) {
  const o = [];
  for (const s of t)
    try {
      const r = [];
      switch (s.kind) {
        case "shape":
          r.push(...Kt(s, e, n));
          break;
        case "connector":
          r.push(...Vt(s, e, n));
          break;
        case "picture":
          r.push(...to(s, e, n));
          break;
        case "group":
          r.push(...Wt(s.children, e, [...n, e.nextId("group")]));
          break;
        case "table": {
          const a = no(s, e, n);
          a ? (e.stats.elements++, r.push(a)) : s.fallback && r.push(...Wt([s.fallback], e, n));
          break;
        }
        case "chart": {
          const a = at(e, "chart", s, n);
          a.chart = Le(s.chart), a.fontFamily = "sans-serif", e.stats.elements++, r.push(a);
          break;
        }
      }
      if (s.descr && r[0] && !r[0].altText && (r[0].altText = s.descr), s.decorative) for (const a of r) a.decorative = !0;
      const l = _n(s.link, e);
      if (l)
        for (const a of r) a.link || (a.link = l);
      e.itemEls?.set(s.id, r), o.push(...r);
    } catch {
      e.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function oo(t) {
  if (!t) return;
  const e = t.dir === "r" ? "right" : t.dir === "u" ? "up" : t.dir === "d" ? "down" : "left";
  return { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.kind === "split" ? `split-${t.orient === "vert" ? "vertical" : "horizontal"}-${t.inward ? "in" : "out"}` : t.kind === "wipe" ? `wipe-${e}` : t.kind === "cover" ? `cover-${e}` : t.kind === "pull" ? `uncover-${e}` : `slide-${e}`, duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" };
}
function so(t, e, n) {
  if (e)
    if (e.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = Y(e.color);
    else if (e.kind === "linear" || e.kind === "radial")
      t.fillStyle = e.kind, t.backgroundColor = Y(e.stops[0]?.color), t.gradientStops = e.stops.map((o) => ({ offset: o.pos, color: Y(o.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
    else if (e.kind === "image") {
      const o = n.images.get(e.media), s = n.slideBg ?? o?.url;
      s && (t.fillStyle = "image", t.backgroundImage = s, t.backgroundColor = "#ffffff"), s && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
    } else e.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = Y(e.color));
}
const Yt = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, ro = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function ao(t) {
  let e = "";
  for (let o = 0; o < t.length; o += 32768) e += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(e);
}
async function lo(t) {
  const e = /* @__PURE__ */ new Set(), n = (s) => {
    for (const r of s)
      r.kind === "picture" ? e.add(r.media) : r.kind === "group" ? n(r.children) : r.kind === "shape" && r.fill.kind === "image" && e.add(r.fill.media);
  };
  for (const s of t.slides)
    n(s.items), s.background?.kind === "image" && e.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...e].map(async (s) => {
    if (!ro.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Yt[s.ext]};base64,${ao(s.bytes)}`;
    let l = 0, a = 0;
    try {
      const i = await createImageBitmap(new Blob([s.bytes], { type: Yt[s.ext] }));
      l = i.width, a = i.height, i.close();
    } catch {
    }
    o.set(s, { url: r, w: l, h: a });
  })), o;
}
function io(t, e, n) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: e, background: n, spacing: o, strokeWidth: s }, l = /^pct(\d+)$/.exec(t);
  if (l) {
    const a = Math.max(1, Math.min(99, Number(l[1]))), i = a > 50, h = (i ? 100 - a : a) / 100;
    return { type: "dots", color: i ? n : e, background: i ? e : n, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(h / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function co(t, e, n) {
  const o = await Ze(), s = await lo(t), r = Math.round(t.width), l = Math.round(t.height), a = Oe(n ?? t.title, "slides", { width: r, height: l }), i = [], h = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  a.slides = [];
  const d = await Gn(t, s), m = await Promise.all(t.slides.map((g) => {
    const f = g.background, p = f?.kind === "image" ? s.get(f.media) : void 0;
    return f?.kind === "image" && p ? qn(p.url, r, l, f.tile) : void 0;
  })), u = t.slides.map(() => e("slide")), y = /* @__PURE__ */ new Map();
  return t.slides.forEach((g, f) => {
    g.key && y.set(g.key, u[f]);
  }), t.slides.forEach((g, f) => {
    const p = f * (r + zn), b = ee(u[f], g.name || `Slide ${f + 1}`, p, 0, { width: r, height: l });
    b.order = f;
    const w = { ox: p, oy: 0, presets: o, nextId: e, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: i, stats: h, images: s, slideBg: m[f], gray: d, slideIds: y, itemEls: /* @__PURE__ */ new Map() };
    a.elements.push(...Wt(g.items, w, [])), Yn(g.anims ?? [], w, e), w.glue.forEach((v) => v()), so(b, g.background, w);
    const x = oo(g.transition);
    x && (b.transition = x), g.notes && (b.notes = g.notes), g.hidden && (b.hidden = !0), g.advanceAfterMs && (b.advanceAfter = g.advanceAfterMs), g.section && (b.section = g.section), a.slides.push(b), h.slides++;
  }), a.slides.length || a.slides.push(ee(void 0, "Slide 1", 0, 0, { width: r, height: l })), t.loop && (a.globalSettings = { ...a.globalSettings || {}, slideShowLoop: !0 }), { doc: a, warnings: [...new Set(i)], stats: h };
}
const fo = 512 * 1024 * 1024;
async function go(t, e) {
  const n = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (n.length > fo) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = Dn(n), r = /* @__PURE__ */ new Set(), l = await co(o, (i) => He(i, r), e);
  je(l.doc);
  const a = [...s, ...l.warnings];
  return a.length && console.warn("[pptx import]", a), { stats: l.stats, warnings: a };
}
export {
  go as importPptx
};
