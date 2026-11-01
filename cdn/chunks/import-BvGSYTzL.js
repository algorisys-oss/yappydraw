import { u as me, a as ge } from "./browser-DbZP-BrN.js";
import { e as xe, s as Ft, f as be } from "./anim-map-D7T1mIAM.js";
import { E as W, i as Tt, g as ye } from "./custgeom-DUHYX5Vs.js";
import { av as ke, aw as Dt, a1 as we, ax as Me, ay as ve, M as Ce, q as Se, K as Pe } from "./index-Bqlr2FLr.js";
const Te = 1e4, Ne = 1e5, Jt = 6e4, ot = (t) => t / Jt * (Math.PI / 180);
function te(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), c = Math.max(r, a), m = {
    w: r,
    h: a,
    l: 0,
    t: 0,
    r,
    b: a,
    hc: r / 2,
    vc: a / 2,
    ss: i,
    ls: c,
    cd2: 108e5,
    cd4: 54e5,
    cd8: 27e5,
    "3cd4": 162e5,
    "3cd8": 81e5,
    "5cd8": 135e5,
    "7cd8": 189e5
  };
  for (const [p, x] of Object.entries(m)) s.set(p, x);
  for (const p of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${p}`, r / p), s.set(`hd${p}`, a / p), s.set(`ssd${p}`, i / p);
  const b = (p) => {
    const x = s.get(p);
    if (x !== void 0) return x;
    const u = /^(wd|hd|ssd)(\d+)$/.exec(p);
    if (u) {
      const y = u[1] === "wd" ? r : u[1] === "hd" ? a : i, h = Number(u[2]);
      return h ? y / h : 0;
    }
    const d = Number(p);
    return Number.isFinite(d) ? d : 0;
  }, f = (p, x) => {
    s.size > Te || s.set(p, Ie(x, b));
  };
  for (const [p, x] of t.av ?? []) f(p, o[p] ?? x);
  for (const [p, x] of Object.entries(o)) s.has(p) || f(p, x);
  for (const [p, x] of t.gd ?? []) f(p, x);
  return s;
}
function Ie(t, n) {
  const e = String(t || "").trim().split(/\s+/), o = e[0], [s, r, a] = e.slice(1).map(n);
  let i;
  switch (o) {
    case "val":
      i = s;
      break;
    case "*/":
      i = a ? s * r / a : 0;
      break;
    case "+-":
      i = s + r - a;
      break;
    case "+/":
      i = a ? (s + r) / a : 0;
      break;
    case "?:":
      i = s > 0 ? r : a;
      break;
    case "abs":
      i = Math.abs(s);
      break;
    case "at2":
      i = Math.atan2(r, s) * 180 / Math.PI * Jt;
      break;
    case "cat2":
      i = s * Math.cos(Math.atan2(a, r));
      break;
    case "sat2":
      i = s * Math.sin(Math.atan2(a, r));
      break;
    case "cos":
      i = s * Math.cos(ot(r));
      break;
    case "sin":
      i = s * Math.sin(ot(r));
      break;
    case "tan":
      i = s * Math.tan(ot(r));
      break;
    case "max":
      i = Math.max(s, r);
      break;
    case "min":
      i = Math.min(s, r);
      break;
    case "mod":
      i = Math.sqrt(s * s + r * r + a * a);
      break;
    case "pin":
      i = r < s ? s : r > a ? a : r;
      break;
    case "sqrt":
      i = Math.sqrt(Math.max(0, s));
      break;
    default:
      i = 0;
  }
  return Number.isFinite(i) ? i : 0;
}
const $t = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function ut(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * W, r = Math.max(Math.abs(e), 0) * W, a = te(t, s, r, o), i = (b) => typeof b == "number" ? b : a.get(b) ?? (Number.isFinite(Number(b)) ? Number(b) : 0), c = [];
  let m = Ne;
  for (const b of t.paths) {
    const f = b.w ? s / b.w : 1, p = b.h ? r / b.h : 1, x = (g) => i(g) * f / W, u = (g) => i(g) * p / W, d = [];
    let y = { x: 0, y: 0 }, h = { x: 0, y: 0 };
    for (const g of b.d) {
      if (--m < 0) break;
      switch (g[0]) {
        case "M":
          y = { x: x(g[1]), y: u(g[2]) }, h = y, d.push({ op: "M", ...y });
          break;
        case "L":
          y = { x: x(g[1]), y: u(g[2]) }, d.push({ op: "L", ...y });
          break;
        case "C": {
          const w = x(g[1]), M = u(g[2]), C = x(g[3]), v = u(g[4]);
          y = { x: x(g[5]), y: u(g[6]) }, d.push({ op: "C", x1: w, y1: M, x2: C, y2: v, ...y });
          break;
        }
        case "Q": {
          const w = x(g[1]), M = u(g[2]), C = x(g[3]), v = u(g[4]);
          d.push({ op: "C", x1: y.x + 2 / 3 * (w - y.x), y1: y.y + 2 / 3 * (M - y.y), x2: C + 2 / 3 * (w - C), y2: v + 2 / 3 * (M - v), x: C, y: v }), y = { x: C, y: v };
          break;
        }
        case "A": {
          const w = i(g[1]) * f / W, M = i(g[2]) * p / W;
          y = Oe(d, y, w, M, i(g[3]), i(g[4]));
          break;
        }
        case "Z":
          d.push({ op: "Z" }), y = h;
          break;
      }
    }
    d.length && c.push({ cmds: d, fill: b.fill === "none" ? !1 : void 0, stroke: b.stroke === !1 ? !1 : void 0 });
  }
  return c;
}
function Oe(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const a = ot(s), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, ot(r))), c = $t(a, e, o);
  let m = $t(a + i, e, o);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) m = c + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && m < c; ) m += 2 * Math.PI;
    for (; i < 0 && m > c; ) m -= 2 * Math.PI;
  }
  const b = n.x - e * Math.cos(c), f = n.y - o * Math.sin(c), p = m - c, x = Math.max(1, Math.min(16, Math.ceil(Math.abs(p) / (Math.PI / 2)))), u = p / x, d = 4 / 3 * Math.tan(u / 4);
  let y = c, h = n;
  for (let g = 0; g < x; g++) {
    const w = y + u, M = Math.cos(y), C = Math.sin(y), v = Math.cos(w), I = Math.sin(w);
    h = { x: b + e * v, y: f + o * I }, t.push({ op: "C", x1: b + e * (M - d * C), y1: f + o * (C + d * M), x2: b + e * (v + d * I), y2: f + o * (I - d * v), ...h }), y = w;
  }
  return h;
}
function ee(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const a = te(t, s * W, r * W, o), i = (p) => (a.get(p) ?? (Number.isFinite(Number(p)) ? Number(p) : 0)) / W, [c, m, b, f] = t.rect.map(i);
  return { l: c, t: m, r: b, b: f };
}
let jt = null;
async function Ae() {
  return jt ??= (await import("./presets-DP49P8i2.js")).default, jt;
}
const Bt = 5e4, Le = 256 * 1024 * 1024, zt = 1024 * 1024 * 1024, Ee = 1e4, Re = 32, Fe = 2e4, O = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!n || o.localName === n) && e.push(o);
  return e;
}, l = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, L = (t, ...n) => {
  let e = t;
  for (const o of n) e = l(e, o);
  return e ?? null;
}, k = (t, n) => {
  if (!t) return null;
  const e = t.getAttribute(n);
  if (e !== null && e !== "") return e;
  const o = n.includes(":") ? n.split(":")[1] : n;
  for (let s = 0; s < (t.attributes?.length ?? 0); s++) {
    const r = t.attributes[s];
    if (r.localName === o && (n.includes(":") || !r.name.includes(":"))) return r.value;
  }
  return null;
}, S = (t, n, e = 0) => {
  const o = k(t, n), s = o === null ? NaN : Number(o);
  return Number.isFinite(s) ? s : e;
}, H = (t, n) => {
  const e = k(t, n);
  return e === null ? void 0 : e === "1" || e === "true" || e === "on";
}, F = (t) => t / W, De = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function $e(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = l(t, "Fallback");
  for (const e of O(t, "Choice"))
    if ((k(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => De.has(s))) return O(e);
  return O(n);
}
const Z = (t) => O(t).flatMap($e);
class je {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(n, e, o) {
    this.parseXml = e, this.warn = o, this.files = {};
    for (const [s, r] of Object.entries(n)) this.files[nt(s)] = r;
  }
  bytes(n) {
    return this.files[nt(n)];
  }
  xml(n) {
    const e = nt(n);
    if (!this.text.has(e)) {
      const o = this.files[e];
      let s = null;
      if (o) {
        try {
          const r = ge(o).replace(/^﻿/, "");
          s = /<!DOCTYPE/i.test(r.slice(0, 2048)) ? null : this.parseXml(r), s && s.getElementsByTagName("parsererror").length && (s = null);
        } catch {
          s = null;
        }
        s || this.warn(`Couldn't read ${e}`);
      }
      this.text.set(e, s);
    }
    return this.text.get(e)?.documentElement ?? null;
  }
  rels(n) {
    const e = nt(n);
    let o = this.relCache.get(e);
    if (o) return o;
    o = /* @__PURE__ */ new Map();
    const s = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), a = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const i of O(a, "Relationship")) {
      const c = k(i, "Id"), m = k(i, "Type") || "", b = k(i, "Target") || "";
      if (!c) continue;
      const f = k(i, "TargetMode") === "External";
      o.set(c, { type: m.slice(m.lastIndexOf("/") + 1), target: f ? b : Be(s, b), external: f });
    }
    return this.relCache.set(e, o), o;
  }
  relOfType(n, e) {
    for (const o of this.rels(n).values()) if (o.type === e && !o.external) return o.target;
    return null;
  }
}
const nt = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function Be(t, n) {
  let e = n.split("#")[0];
  try {
    e = decodeURIComponent(e);
  } catch {
  }
  if (e.startsWith("/")) return nt(e);
  const o = (t ? t.split("/") : []).concat(e.split("/")), s = [];
  for (const r of o)
    r === ".." ? s.pop() : r && r !== "." && s.push(r);
  return s.join("/");
}
const Nt = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function ne(t) {
  const n = {};
  for (const e of O(t)) {
    const o = O(e)[0];
    if (!o) continue;
    const s = o.localName === "sysClr" ? k(o, "lastClr") : k(o, "val");
    s && /^[0-9a-f]{6}$/i.test(s) && (n[e.localName] = "#" + s.toLowerCase());
  }
  return n;
}
function bt(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = l(t, "themeElements");
  n.colors = ne(l(e, "clrScheme"));
  const o = l(e, "fontScheme");
  n.major = k(L(o, "majorFont", "latin"), "typeface") || n.major, n.minor = k(L(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = l(e, "fmtScheme");
  return n.fills = O(l(s, "fillStyleLst")), n.lines = O(l(s, "lnStyleLst")), n.bgFills = O(l(s, "bgFillStyleLst")), n;
}
const ze = {
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
}, oe = (t) => {
  const n = t.replace("#", "");
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}, ft = (t, n, e) => "#" + [t, n, e].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), st = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), K = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function Xt(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const o = Math.max(t, n, e), s = Math.min(t, n, e), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const a = o - s, i = r > 0.5 ? a / (2 - o - s) : a / (o + s);
  return [(o === t ? (n - e) / a + (n < e ? 6 : 0) : o === n ? (e - t) / a + 2 : (t - n) / a + 4) * 60, i, r];
}
function yt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const o = e < 0.5 ? e * (1 + n) : e + n - e * n, s = 2 * e - o, r = (a) => (a = (a % 1 + 1) % 1, a < 1 / 6 ? s + (o - s) * 6 * a : a < 1 / 2 ? o : a < 2 / 3 ? s + (o - s) * (2 / 3 - a) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function $(t, n) {
  const e = O(t).find((o) => /Clr$/.test(o.localName));
  return e ? Xe(e, n) : null;
}
function Xe(t, n) {
  let e = null, o = 1;
  switch (t.localName) {
    case "srgbClr": {
      const c = k(t, "val");
      e = c && /^[0-9a-f]{6}$/i.test(c) ? "#" + c.toLowerCase() : null;
      break;
    }
    case "sysClr": {
      const c = k(t, "lastClr");
      e = c ? "#" + c.toLowerCase() : k(t, "val") === "window" ? "#ffffff" : "#000000";
      break;
    }
    case "prstClr":
      e = ze[k(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = ft(K(S(t, "r") / 1e5), K(S(t, "g") / 1e5), K(S(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [c, m, b] = yt(S(t, "hue") / 6e4, S(t, "sat") / 1e5, S(t, "lum") / 1e5);
      e = ft(c, m, b);
      break;
    }
    case "schemeClr": {
      const c = k(t, "val") || "";
      if (c === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const m = n.clrMap[c] ?? Nt[c] ?? c;
      e = n.theme.colors[m] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, a] = oe(e);
  for (const c of O(t)) {
    const m = S(c, "val") / 1e5;
    switch (c.localName) {
      case "alpha":
        o = m;
        break;
      case "alphaMod":
        o *= m;
        break;
      case "alphaOff":
        o += m;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [b, f, p] = Xt(s, r, a);
        c.localName === "lumMod" ? p *= m : c.localName === "lumOff" ? p += m : c.localName === "satMod" ? f *= m : c.localName === "satOff" ? f += m : c.localName === "hueMod" ? b *= m : b += S(c, "val") / 6e4, [s, r, a] = yt(b, Math.max(0, Math.min(1, f)), Math.max(0, Math.min(1, p)));
        break;
      }
      case "tint":
        [s, r, a] = [s, r, a].map((b) => K(st(b) * m + (1 - m)));
        break;
      case "shade":
        [s, r, a] = [s, r, a].map((b) => K(st(b) * m));
        break;
      case "comp": {
        const [b, f, p] = Xt(s, r, a);
        [s, r, a] = yt(b + 180, f, p);
        break;
      }
      case "inv":
        [s, r, a] = [255 - s, 255 - r, 255 - a];
        break;
      case "gray": {
        s = r = a = 0.299 * s + 0.587 * r + 0.114 * a;
        break;
      }
    }
  }
  o = Math.max(0, Math.min(1, o));
  const i = { hex: ft(s, r, a) };
  return o < 0.999 && (i.alpha = o), i;
}
function J(t, n) {
  for (const e of O(t)) {
    const o = It(e, n);
    if (o) return o;
  }
}
function It(t, n) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const e = $(t, n.ctx);
      return e ? { kind: "solid", color: e } : { kind: "none" };
    }
    case "gradFill": {
      const e = O(l(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: S(s, "pos") / 1e5, color: $(s, n.ctx) ?? { hex: "#000000" } }));
      if (!e.length) return { kind: "none" };
      const o = l(t, "lin");
      return l(t, "path") ? { kind: "radial", stops: e } : { kind: "linear", stops: e, angle: o ? S(o, "ang") / 6e4 : 90, scaled: H(o, "scaled") ?? !1 };
    }
    case "blipFill": {
      const e = se(t, n);
      if (!e) return;
      const o = { kind: "image", media: e }, s = l(t, "tile");
      s && (o.tile = { sx: Math.max(0.01, S(s, "sx", 1e5) / 1e5), sy: Math.max(0.01, S(s, "sy", 1e5) / 1e5) });
      const r = l(l(t, "blip"), "alphaModFix");
      return r && (o.alpha = Math.max(0, Math.min(1, S(r, "amt", 1e5) / 1e5))), l(l(t, "blip"), "grayscl") && (o.grayscale = !0), o;
    }
    case "pattFill": {
      const e = $(l(t, "fgClr"), n.ctx), o = $(l(t, "bgClr"), n.ctx);
      return e ? { kind: "pattern", preset: k(t, "prst") || "pct50", color: e, ...o ? { bg: o } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const He = {
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
function se(t, n) {
  const e = l(t, "blip"), o = k(e, "r:embed");
  if (!o) return null;
  const s = n.pkg.rels(n.part).get(o);
  if (!s || s.external) return null;
  const r = n.pkg.bytes(s.target), a = He[(s.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const Ye = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function Q(t, n) {
  if (!t) return;
  let e;
  for (const i of O(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = $(i, n.ctx)), i.localName === "gradFill" && (e = $(l(l(i, "gsLst"), "gs"), n.ctx));
  }
  const o = k(t, "w");
  if (e === void 0 && o === null && !l(t, "prstDash") && !l(t, "headEnd") && !l(t, "tailEnd")) return;
  const s = (i) => {
    const c = k(i, "type");
    if (!c || c === "none") return;
    const m = c === "triangle" || c === "stealth" || c === "arrow" || c === "oval" || c === "diamond" ? c : "triangle", b = k(i, "len") || k(i, "w");
    return { type: m, size: b === "sm" || b === "lg" ? b : "med" };
  }, r = Ye[k(l(t, "prstDash"), "val") || "solid"], a = k(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, F(Number(o) || 0)) : 1,
    color: e ?? { hex: "#000000" },
    dash: r || void 0,
    cap: a === "rnd" ? "rnd" : a === "sq" ? "sq" : a === "flat" ? "flat" : void 0,
    join: l(t, "round") ? "round" : l(t, "bevel") ? "bevel" : l(t, "miter") ? "miter" : void 0,
    head: s(l(t, "headEnd")),
    tail: s(l(t, "tailEnd"))
  };
}
function dt(t, n) {
  const e = l(t, "fillRef");
  if (!e) return;
  const o = S(e, "idx");
  if (o === 0) return { kind: "none" };
  const r = (o >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[o >= 1001 ? o - 1001 : o - 1];
  if (!r) return;
  const a = $(e, n.ctx) ?? void 0;
  return It(r, { ...n, ctx: { ...n.ctx, phClr: a } });
}
function Ot(t, n) {
  const e = l(t, "lnRef");
  if (!e) return;
  const o = S(e, "idx");
  if (o === 0) return null;
  const s = n.ctx.theme.lines[o - 1];
  if (!s) return;
  const r = $(e, n.ctx) ?? void 0;
  return Q(s, { ...n, ctx: { ...n.ctx, phClr: r } }) ?? void 0;
}
function V(t) {
  if (!t) return null;
  const n = l(t, "off"), e = l(t, "ext");
  return !n || !e ? null : {
    x: F(S(n, "x")),
    y: F(S(n, "y")),
    w: Math.max(0, F(S(e, "cx"))),
    h: Math.max(0, F(S(e, "cy"))),
    rot: S(t, "rot") / 6e4,
    flipH: !!H(t, "flipH"),
    flipV: !!H(t, "flipV")
  };
}
const kt = (t) => t;
function We(t, n) {
  const e = V(t);
  if (!e) return n;
  const o = l(t, "chOff"), s = l(t, "chExt"), r = o ? F(S(o, "x")) : e.x, a = o ? F(S(o, "y")) : e.y, i = s ? F(S(s, "cx")) : e.w, c = s ? F(S(s, "cy")) : e.h, m = i > 0 ? e.w / i : 1, b = c > 0 ? e.h / c : 1, f = e.x + e.w / 2, p = e.y + e.h / 2, x = e.rot * Math.PI / 180;
  return (u) => {
    let d = e.x + (u.x + u.w / 2 - r) * m, y = e.y + (u.y + u.h / 2 - a) * b, h = u.rot, g = u.flipH, w = u.flipV;
    if (e.flipH && (d = 2 * f - d, g = !g, h = -h), e.flipV && (y = 2 * p - y, w = !w, h = -h), x) {
      const v = d - f, I = y - p;
      d = f + v * Math.cos(x) - I * Math.sin(x), y = p + v * Math.sin(x) + I * Math.cos(x), h += e.rot;
    }
    const M = u.w * m, C = u.h * b;
    return n({ x: d - M / 2, y: y - C / 2, w: M, h: C, rot: (h % 360 + 360) % 360, flipH: g, flipV: w });
  };
}
function Ht(t) {
  const n = l(t, "spcPts"), e = l(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, S(n, "val") / 100)) * (Tt / W) };
  if (e) return { lines: Math.max(0, Math.min(13.2, S(e, "val") / 1e5)) };
}
function Yt(t, n, e) {
  const o = l(t, `lvl${n + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return o ? re(o, e) : {};
}
function re(t, n) {
  const e = {};
  if (k(t, "algn") && (e.algn = k(t, "algn")), k(t, "marL") !== null && (e.marL = F(S(t, "marL"))), k(t, "indent") !== null && (e.indent = F(S(t, "indent"))), l(t, "buNone")) e.bullet = "none";
  else if (l(t, "buAutoNum")) {
    const a = l(t, "buAutoNum");
    e.bullet = "num", e.numType = k(a, "type") || "arabicPeriod", e.startAt = k(a, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(S(a, "startAt", 1)))) : void 0;
  } else l(t, "buChar") ? (e.bullet = "char", e.buChar = k(l(t, "buChar"), "char") || void 0) : l(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (l(t, "buFont") ? e.buFont = k(l(t, "buFont"), "typeface") || null : l(t, "buFontTx") && (e.buFont = null), l(t, "buClr") ? e.buClr = $(l(t, "buClr"), n.ctx) : l(t, "buClrTx") && (e.buClr = null), l(t, "buSzPct")) {
    const a = k(l(t, "buSzPct"), "val") || "", i = a.endsWith("%") ? parseFloat(a) / 100 : Number(a) / 1e5;
    e.buSz = Number.isFinite(i) && i > 0 ? Math.max(0.25, Math.min(4, i)) : null;
  } else (l(t, "buSzTx") || l(t, "buSzPts")) && (e.buSz = null);
  const o = L(t, "lnSpc", "spcPct");
  o && (e.lnSpcPct = S(o, "val") / 1e5);
  const s = Ht(l(t, "spcBef")), r = Ht(l(t, "spcAft"));
  return s && (e.spcBef = s), r && (e.spcAft = r), Object.assign(e, ae(l(t, "defRPr"), n)), e;
}
function ae(t, n) {
  if (!t) return {};
  const e = {};
  k(t, "sz") !== null && (e.sz = S(t, "sz") / 100 * (Tt / W)), H(t, "b") !== void 0 && (e.b = H(t, "b")), H(t, "i") !== void 0 && (e.i = H(t, "i")), k(t, "u") && (e.u = k(t, "u") !== "none"), k(t, "strike") && (e.strike = k(t, "strike") !== "noStrike");
  const o = l(t, "solidFill");
  o ? e.color = $(o, n.ctx) : l(t, "noFill") && (e.color = null);
  const s = k(l(t, "latin"), "typeface");
  return s && (e.font = s), e;
}
const _e = {
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
}, Ue = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Ge(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const o = (n || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && _e[e] || "•" : o === "symbol" ? Ue[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const Wt = (...t) => {
  const n = {};
  for (const e of t) for (const [o, s] of Object.entries(e)) s !== void 0 && (n[o] = s);
  return n;
};
function Ve(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function At(t, n, e) {
  if (!t) return;
  const o = O(t, "p");
  if (!o.some((x) => O(x).some((u) => (u.localName === "r" || u.localName === "fld") && (L(u, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const x of [...n.bodyPr, l(t, "bodyPr")]) {
    if (!x) continue;
    for (let d = 0; d < x.attributes.length; d++) r[x.attributes[d].localName ?? x.attributes[d].name] = x.attributes[d].value;
    const u = l(x, "normAutofit");
    u && (a = k(u, "fontScale") !== null ? S(u, "fontScale") / 1e5 : 1), u && (i = 1 - Math.max(0, Math.min(0.9, S(u, "lnSpcReduction") / 1e5))), (l(x, "noAutofit") || l(x, "spAutoFit")) && (a = 1, i = 1);
  }
  const c = (x, u) => r[x] !== void 0 ? F(Number(r[x]) || 0) : F(u), m = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", b = l(t, "lstStyle"), f = [];
  let p;
  for (const x of o) {
    const u = l(x, "pPr"), d = Math.max(0, Math.min(8, S(u, "lvl"))), y = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, h = Wt(...n.levels.map((P) => Yt(P, d, e)), y, Yt(b, d, e), u ? re(u, e) : {});
    h.lnSpcPct !== void 0 && p === void 0 && (p = h.lnSpcPct);
    const g = { runs: [], align: h.algn === "ctr" ? "ctr" : h.algn === "r" ? "r" : (h.algn === "just", "l"), level: d };
    if (h.bullet === "char" || h.bullet === "num") {
      if (g.bullet = h.bullet, g.marL = h.marL ?? 0, g.indent = h.indent ?? 0, h.bullet === "char") {
        const P = Ge(h.buChar, h.buFont ?? void 0);
        P !== "•" && (g.bulletChar = P);
      } else
        h.numType && h.numType !== "arabicPeriod" && (g.numType = h.numType), h.startAt && h.startAt !== 1 && (g.startAt = h.startAt);
      h.buClr && (g.bulletColor = h.buClr), h.buSz && Math.abs(h.buSz - 1) > 1e-3 && (g.bulletScale = h.buSz);
    }
    const w = (P) => {
      const E = Wt(h, ae(P, e)), z = (E.sz ?? 18 * Tt / W) * a, j = E.color === null ? void 0 : E.color ?? ie("tx1", e);
      return {
        text: "",
        size: z,
        bold: E.b || void 0,
        italic: E.i || void 0,
        underline: E.u || void 0,
        strike: E.strike || void 0,
        color: j ?? void 0,
        font: Ve(E.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const P of O(x))
      if (P.localName === "r" || P.localName === "fld") {
        const E = L(P, "t")?.textContent ?? "";
        if (!E) continue;
        E.split(/[\v\n]/).forEach((z, j) => {
          j > 0 && g.runs.push({ ...w(l(P, "rPr")), br: !0 }), z && g.runs.push({ ...w(l(P, "rPr")), text: z });
        });
      } else P.localName === "br" && g.runs.push({ ...w(l(P, "rPr")), br: !0 });
    g.endSize = w(l(x, "endParaRPr")).size;
    const M = (g.runs.length ? Math.max(...g.runs.map((P) => P.size ?? 0)) : g.endSize ?? 0) * 1.2 * (h.lnSpcPct ?? 1), C = (P) => P ? ("px" in P ? P.px : P.lines * M) * i : 0, v = C(h.spcBef), I = C(h.spcAft);
    v > 0.05 && (g.spaceBefore = Math.round(v * 100) / 100), I > 0.05 && (g.spaceAfter = Math.round(I * 100) / 100), f.push(g);
  }
  return {
    paragraphs: f,
    anchor: m,
    insets: { l: c("lIns", 91440), t: c("tIns", 45720), r: c("rIns", 91440), b: c("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: p
  };
}
const ie = (t, n) => {
  const e = n.ctx.clrMap[t] ?? Nt[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, et = (t) => {
  const n = l(t, "ph");
  return n ? { type: k(n, "type") || "obj", idx: S(n, "idx") } : null;
}, rt = (t) => l(O(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), lt = /* @__PURE__ */ new Set(["title", "ctrTitle"]), _t = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Ut = (t, n) => t === n || lt.has(t) && lt.has(n) || !_t.has(t) && !_t.has(n);
function ht(t, n) {
  const e = qe(t);
  if (n.idx) {
    const o = e.find((s) => s.ph.idx === n.idx && Ut(s.ph.type, n.type));
    if (o) return o.el;
  }
  return (e.find((o) => o.ph.type === n.type && (o.ph.idx === n.idx || !n.idx || lt.has(n.type))) ?? e.find((o) => o.ph.type === n.type) ?? e.find((o) => Ut(o.ph.type, n.type)))?.el ?? null;
}
function qe(t) {
  const n = [];
  for (const e of Z(t)) {
    const o = et(rt(e));
    o && n.push({ el: e, ph: o });
  }
  return n;
}
const le = (t) => lt.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", Ze = (t) => {
  const n = {};
  for (const e of O(l(t, "avLst"), "gd")) {
    const o = k(e, "name"), s = k(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function Ke(t) {
  const n = (r) => O(r, "gd").slice(0, 1e4).map((a) => [k(a, "name") || "", k(a, "fmla") || "val 0"]), e = O(l(t, "cxnLst"), "cxn").map((r) => [k(r, "ang") || "0", k(l(r, "pos"), "x") || "0", k(l(r, "pos"), "y") || "0"]), o = l(t, "rect"), s = O(l(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const c of O(r)) {
      const m = O(c, "pt").map((b) => [k(b, "x") || "0", k(b, "y") || "0"]).flat();
      switch (c.localName) {
        case "moveTo":
          a.push(["M", ...m]);
          break;
        case "lnTo":
          a.push(["L", ...m]);
          break;
        case "quadBezTo":
          a.push(["Q", ...m]);
          break;
        case "cubicBezTo":
          a.push(["C", ...m]);
          break;
        case "arcTo":
          a.push(["A", k(c, "wR") || "0", k(c, "hR") || "0", k(c, "stAng") || "0", k(c, "swAng") || "0"]);
          break;
        case "close":
          a.push(["Z"]);
          break;
      }
    }
    const i = k(r, "fill");
    return { w: S(r, "w") || void 0, h: S(r, "h") || void 0, fill: i && i !== "norm" ? i : void 0, stroke: H(r, "stroke") === !1 ? !1 : void 0, d: a };
  });
  return {
    av: O(l(t, "avLst"), "gd").map((r) => [k(r, "name") || "", k(r, "fmla") || "val 0"]),
    gd: n(l(t, "gdLst")),
    cxn: e,
    rect: o ? [k(o, "l") || "l", k(o, "t") || "t", k(o, "r") || "r", k(o, "b") || "b"] : null,
    paths: s
  };
}
function at(t, n) {
  const e = l(t, "prstGeom");
  if (e) {
    const s = {};
    for (const [r, a] of Object.entries(Ze(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (s[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: k(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = l(t, "custGeom");
  if (o) {
    const s = Ke(o);
    return { geom: { kind: "custom", paths: ut(s, n.w, n.h) }, textRect: s.rect ? ee(s, n.w, n.h) : void 0 };
  }
}
function it(t, n, e, o, s, r) {
  const a = [];
  if (s > Re)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of Z(t)) {
    if (++e.count > Fe) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const c = tn(i, n, e, o, s, r);
      c && a.push(...Array.isArray(c) ? c : [c]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
}
const Qe = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function Je(t, n, e) {
  const o = l(t, "hlinkClick");
  if (!o) return;
  const s = k(o, "action") || "", r = e.rels(n).get(k(o, "r:id") || "");
  if (s.startsWith("ppaction://hlinkshowjump")) {
    const a = Qe[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return a ? { kind: "action", action: a } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function tn(t, n, e, o, s, r) {
  const a = O(t).find((m) => m.localName.startsWith("nv")), i = en(t, n, e, o, s, r), c = i ? Je(l(a ?? null, "cNvPr"), n.part, e.pkg) : void 0;
  if (c) for (const m of Array.isArray(i) ? i : [i]) m.link = c;
  return i;
}
function en(t, n, e, o, s, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = O(t).find((f) => f.localName.startsWith("nv")), c = l(i ?? null, "cNvPr"), m = S(c, "id"), b = k(c, "name") || t.localName;
  if (k(c, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return sn(t, n, e, o, m, b, r);
    case "cxnSp": {
      const f = l(t, "spPr"), p = V(l(f, "xfrm"));
      if (!p) return null;
      const x = o(p), u = l(t, "style"), d = Q(l(f, "ln"), a) ?? Ot(u, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!d) return null;
      const y = at(f, x) ?? { geom: { kind: "preset", prst: "line" } }, h = (w) => w ? { id: S(w, "id"), idx: S(w, "idx") } : void 0, g = l(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: m, name: b, ...x, geom: y.geom, line: d, start: h(l(g, "stCxn")), end: h(l(g, "endCxn")) };
    }
    case "pic": {
      const f = l(t, "spPr");
      let p = V(l(f, "xfrm"));
      const x = et(l(i ?? null, "nvPr"));
      if (!p && x && (p = nn(x, e)), !p) return null;
      const u = l(t, "blipFill"), d = u ? se(u, a) : null;
      if (!d)
        return e.warnings.push(`Picture "${b}" has no image the importer can read.`), null;
      const y = l(u, "srcRect"), h = y ? { l: S(y, "l") / 1e5, t: S(y, "t") / 1e5, r: S(y, "r") / 1e5, b: S(y, "b") / 1e5 } : void 0, g = k(L(u, "blip", "alphaModFix"), "amt"), w = o(p), M = at(f, w)?.geom, C = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: m, name: b, ...w, media: d, crop: h, alpha: g !== null ? Number(g) / 1e5 : void 0, descr: k(c, "descr") || void 0, geom: C, ...L(u, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const f = l(t, "grpSpPr"), p = l(f, "xfrm"), x = We(p, o), u = it(t, n, e, x, s + 1, r);
      if (!u.length) return null;
      const d = pt(u);
      return { kind: "group", id: m, name: b, ...d, children: u };
    }
    case "graphicFrame":
      return ln(t, n, e, o, m, b, s);
    default:
      return null;
  }
}
function pt(t) {
  let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
  for (const r of t)
    n = Math.min(n, r.x), e = Math.min(e, r.y), o = Math.max(o, r.x + r.w), s = Math.max(s, r.y + r.h);
  return { x: n, y: e, w: Math.max(0, o - n), h: Math.max(0, s - e) };
}
function nn(t, n) {
  const e = ht(n.layout?.tree ?? null, t), o = V(L(e, "spPr", "xfrm"));
  if (o) return o;
  const s = ht(n.master?.tree ?? null, { type: le(t.type), idx: 0 });
  return V(L(s, "spPr", "xfrm"));
}
function on(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function sn(t, n, e, o, s, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = rt(t), m = et(c);
  if (m && !a) return null;
  const b = l(t, "spPr"), f = l(t, "style"), p = k(L(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", x = m && e.layout ? ht(e.layout.tree, m) : null, u = m && e.master ? ht(e.master.tree, { type: le(x ? et(rt(x))?.type ?? m.type : m.type), idx: 0 }) : null, d = x && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, y = u && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let h = V(l(b, "xfrm")) ?? V(L(x, "spPr", "xfrm")) ?? V(L(u, "spPr", "xfrm"));
  if (!h) return null;
  h = o(h);
  const g = at(b, h) ?? (x ? at(l(x, "spPr"), h) : void 0) ?? (u ? at(l(u, "spPr"), h) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (H(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? J(b, i) ?? dt(f, i) ?? (d ? J(l(x, "spPr"), d) : void 0) ?? (y ? J(l(u, "spPr"), y) : void 0) ?? (d ? dt(l(x, "style"), d) : void 0) ?? { kind: "none" }, C = on(
    () => Q(l(b, "ln"), i),
    () => Ot(f, i),
    () => d ? Q(L(x, "spPr", "ln"), d) : void 0,
    () => y ? Q(L(u, "spPr", "ln"), y) : void 0
  ) ?? null, v = [];
  if (m) {
    const A = x ? et(rt(x))?.type ?? m.type : m.type;
    v.push(lt.has(A) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(A) ? e.masterTx.body : e.masterTx.other), v.push(L(u, "txBody", "lstStyle"), L(x, "txBody", "lstStyle"));
  } else
    v.push(e.defaultText);
  const I = l(f, "fontRef"), P = {
    levels: v,
    bodyPr: [L(u, "txBody", "bodyPr"), L(x, "txBody", "bodyPr")],
    fontRef: I ? { font: k(I, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: $(I, i.ctx) } : void 0
  }, E = At(l(t, "txBody"), P, i);
  if (!(M.kind !== "none" || !!C || !!E)) return null;
  let j = g.textRect;
  const N = V(l(b, "xfrm")), T = E ? V(l(t, "txXfrm")) : null;
  if (T && N && N.w > 0 && N.h > 0) {
    const A = h.w / N.w, B = h.h / N.h, R = { l: (T.x - N.x) * A, t: (T.y - N.y) * B, r: (T.x + T.w - N.x) * A, b: (T.y + T.h - N.y) * B };
    (Math.abs(R.l) > 0.5 || Math.abs(R.t) > 0.5 || Math.abs(R.r - h.w) > 0.5 || Math.abs(R.b - h.h) > 0.5) && (j = R);
  }
  return { kind: "shape", id: s, name: r, ...h, geom: g.geom, fill: M, line: C, text: E, textBox: p || void 0, textRect: j };
}
const Gt = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function rn(t, n) {
  const e = {};
  if (!t) return e;
  const o = l(t, "tcStyle"), s = l(t, "tcTxStyle"), r = l(o, "fill"), a = r ? J(r, n) : dt(o, n);
  a && (e.fill = a);
  const i = $(s, n.ctx) ?? $(l(s, "fontRef"), n.ctx);
  i && (e.text = i), k(s, "b") === "on" && (e.bold = !0);
  const c = l(o, "tcBdr");
  for (const m of ["insideH", "bottom", "top", "left"]) {
    const b = l(c, m);
    if (!b) continue;
    const f = Q(l(b, "ln"), n) ?? Ot(b, n);
    if (f !== void 0) {
      e.border = f;
      break;
    }
  }
  return e;
}
function an(t, n, e) {
  const o = ((l(t, "tableStyleId")?.textContent || "").trim() || k(e, "def") || Gt).toUpperCase(), s = (f) => H(t, f) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, a = O(e, "tblStyle").find((f) => (k(f, "styleId") || "").toUpperCase() === o);
  if (a) {
    const f = (y) => rn(l(a, y), n), p = l(a, "tblBg"), x = p ? l(p, "fill") ? J(l(p, "fill"), n) : dt(p, n) : void 0, u = {
      whole: f("wholeTbl"),
      b1H: f("band1H"),
      b2H: f("band2H"),
      b1V: f("band1V"),
      b2V: f("band2V"),
      firstRow: f("firstRow"),
      lastRow: f("lastRow"),
      firstCol: f("firstCol"),
      lastCol: f("lastCol")
    }, d = (y, h, g, w) => {
      const M = [u.whole], C = y - (r.firstRow ? 1 : 0), v = h - (r.firstCol ? 1 : 0);
      r.bandCol && v >= 0 && M.push(v % 2 === 0 ? u.b1V : u.b2V), r.bandRow && C >= 0 && M.push(C % 2 === 0 ? u.b1H : u.b2H), r.firstCol && h === 0 && M.push(u.firstCol), r.lastCol && h === w - 1 && M.push(u.lastCol), r.firstRow && y === 0 && M.push(u.firstRow), r.lastRow && y === g - 1 && M.push(u.lastRow);
      const I = {};
      for (const P of M)
        P.fill && (I.fill = P.fill), P.text && (I.text = P.text), P.bold && (I.bold = !0), P.border !== void 0 && (I.border = P.border);
      return I;
    };
    return x && x.kind !== "none" && (d.background = x), d;
  }
  if (o !== Gt) return null;
  const i = n.ctx.theme.colors.accent1 ?? "#4472c4", c = (f) => {
    const [p, x, u] = oe(i);
    return { hex: ft(K(st(p) * f + (1 - f)), K(st(x) * f + (1 - f)), K(st(u) * f + (1 - f))) };
  }, m = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, b = ie("tx1", n) ?? void 0;
  return (f) => {
    const p = r.firstRow && f === 0, x = r.bandRow && !p && (f - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: p ? { hex: i } : c(x ? 0.4 : 0.2) },
      text: p ? m : b,
      bold: p || void 0,
      border: { width: 1.33, color: m }
    };
  };
}
function ln(t, n, e, o, s, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = V(l(t, "xfrm"));
  if (!c) return null;
  const m = L(t, "graphic", "graphicData"), b = l(m, "tbl");
  if (b) {
    const x = O(l(b, "tblGrid"), "gridCol").map((w) => F(S(w, "w"))), u = an(l(b, "tblPr"), i, e.tableStyles), d = [];
    let y = c.y, h = 1e6 + s * 1e3;
    const g = O(b, "tr");
    if (g.forEach((w, M) => {
      const C = F(S(w, "h"));
      let v = c.x, I = 0;
      for (const P of O(w, "tc")) {
        const E = Math.max(1, S(P, "gridSpan", 1)), z = x.slice(I, I + E).reduce((U, q) => U + q, 0);
        if (I += E, H(P, "hMerge") || H(P, "vMerge")) {
          v += z;
          continue;
        }
        const j = Math.max(1, S(P, "rowSpan", 1)), N = l(P, "tcPr"), T = j > 1 ? C * j : C, A = u ? u(M, I - E, g.length, x.length) : null, B = A?.text ? { color: A.text } : void 0, R = At(l(P, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: B }, i);
        R && A?.bold && R.paragraphs.forEach((U) => U.runs.forEach((q) => {
          q.bold === void 0 && (q.bold = !0);
        })), R && (R.insets = { l: F(S(N, "marL", 91440)), r: F(S(N, "marR", 91440)), t: F(S(N, "marT", 45720)), b: F(S(N, "marB", 45720)) }, R.anchor = k(N, "anchor") === "ctr" ? "ctr" : k(N, "anchor") === "b" ? "b" : "t");
        const Y = Q(l(N, "lnB"), i) ?? Q(l(N, "lnT"), i) ?? (A ? A.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), _ = A?.fill;
        d.push({
          kind: "shape",
          id: h++,
          name: `${r} cell`,
          ...o({ x: v, y, w: z, h: T, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: J(N, i) ?? _ ?? { kind: "none" },
          line: Y,
          text: R
        }), v += z;
      }
      y += C;
    }), !d.length) return null;
    if (u?.background) {
      const w = pt(d);
      d.unshift({
        kind: "shape",
        id: h++,
        name: `${r} background`,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: u.background,
        line: null
      });
    }
    return { kind: "group", id: s, name: r, ...pt(d), children: d };
  }
  const f = k(m, "uri") || "";
  if (/diagram/.test(f)) {
    const x = fn(m, n, e, o, c, s, r, a);
    if (x) return x;
    const u = un(m, n, e, o, c, s, r, i);
    if (u) return u;
  }
  if (/drawingml\/2006\/chart$/.test(f)) {
    const x = cn(m, n, e);
    if (x) return { kind: "chart", id: s, name: r, ...o(c), chart: x };
  }
  const p = /chart/.test(f) ? "Chart" : /diagram/.test(f) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${p} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(c),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${p}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
const Vt = {
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
function cn(t, n, e) {
  const o = G(t, "chart", 2), s = o ? e.pkg.rels(n.part).get(k(o, "r:id") || "") : void 0, r = s && !s.external ? e.pkg.xml(s.target) : null, a = l(r, "chart"), i = l(a, "plotArea");
  if (!i) return null;
  const c = Z(i).find((T) => Vt[T.localName]);
  if (!c) return null;
  Z(i).filter((T) => /Chart$/.test(T.localName)).length > 1 && e.warnings.push("A combination chart came in as its first chart type only.");
  let b = Vt[c.localName];
  b === "column" && k(l(c, "barDir"), "val") === "bar" && (b = "bar");
  const f = k(l(c, "grouping"), "val") || "";
  f === "percentStacked" && e.warnings.push("A 100% stacked chart came in as a stacked chart.");
  let p = e.ctx;
  const x = e.pkg.relOfType(s.target, "themeOverride"), u = x ? l(e.pkg.xml(x), "clrScheme") : null;
  if (u) {
    const T = { ...p.theme.colors, ...ne(u) };
    p = { ...p, theme: { ...p.theme, colors: T } };
  }
  const d = l(r, "clrMapOvr");
  if (d && d.attributes.length) {
    const T = { ...p.clrMap };
    for (let A = 0; A < d.attributes.length; A++) T[d.attributes[A].localName ?? d.attributes[A].name] = d.attributes[A].value;
    p = { ...p, clrMap: T };
  }
  const y = (T, A) => {
    const B = G(T, "strCache", 3) ?? G(T, "numCache", 3) ?? G(T, "strLit", 2) ?? G(T, "numLit", 2) ?? l(G(T, "multiLvlStrCache", 3), "lvl");
    if (!B) return [];
    const R = Math.min(1e4, S(l(B, "ptCount"), "val")), Y = new Array(Math.max(0, R)).fill("");
    for (const _ of O(B, "pt")) {
      const U = S(_, "idx");
      U >= 0 && U < 1e4 && (Y[U] = l(_, "v")?.textContent ?? "");
    }
    return Y;
  }, h = O(c, "ser").slice(0, 64);
  if (!h.length) return null;
  const g = y(l(h[0], "cat")), w = h.map((T, A) => {
    const R = y(l(T, "val")).map((q) => q === "" ? null : Number.isFinite(Number(q)) ? Number(q) : null), Y = y(l(T, "tx"))[0] || l(T, "tx")?.textContent?.trim() || `Series ${A + 1}`, _ = l(T, "spPr"), U = $(l(_, "solidFill"), p) ?? $(l(l(_, "ln"), "solidFill"), p);
    return { name: Y, values: R, ...U && { color: U.hex } };
  }), M = Math.max(g.length, ...w.map((T) => T.values.length));
  for (; g.length < M; ) g.push(String(g.length + 1));
  const C = l(a, "title"), v = C ? mt(C, "t", 8).map((T) => T.textContent ?? "").join("").trim() || (w.length === 1 ? w[0].name : "") : "", I = k(L(a, "legend", "legendPos"), "val"), P = l(i, "valAx"), E = l(P, "scaling"), z = (T) => {
    const A = l(T, "dLbls");
    return !!A && (k(l(A, "showVal"), "val") === "1" || k(l(A, "showPercent"), "val") === "1");
  }, j = k(l(E, "max"), "val"), N = k(l(E, "min"), "val");
  return {
    kind: b,
    categories: g,
    series: w,
    ...v && { title: v },
    ...(f === "stacked" || f === "percentStacked") && { stacked: !0 },
    legend: l(a, "legend") ? I === "b" ? "bottom" : I === "t" ? "top" : "right" : "none",
    ...(z(c) || h.some(z)) && { dataLabels: !0 },
    gridlines: !!l(P, "majorGridlines"),
    ...j !== null && Number.isFinite(Number(j)) && { yMax: Number(j) },
    ...N !== null && Number.isFinite(Number(N)) && { yMin: Number(N) }
  };
}
function fn(t, n, e, o, s, r, a, i) {
  const c = e.pkg.rels(n.part), m = k(l(t, "relIds"), "r:dm"), b = m ? c.get(m) : void 0;
  let f;
  if (b && !b.external) {
    const h = G(e.pkg.xml(b.target), "dataModelExt", 6), g = h ? c.get(k(h, "relId") || "") : void 0;
    g && !g.external && (f = g.target);
  }
  if (!f) {
    const h = [...c.values()].filter((g) => g.type === "diagramDrawing" && !g.external);
    h.length === 1 && (f = h[0].target);
  }
  if (!f) return null;
  const p = l(e.pkg.xml(f), "spTree");
  if (!p) return null;
  const u = it(p, { part: f, tree: p }, e, (h) => o({ ...h, x: h.x + s.x, y: h.y + s.y }), i + 1, !0);
  if (!u.length) return null;
  let d = 2e6 + r * 1e3;
  const y = (h) => h.forEach((g) => {
    g.id = d++, g.kind === "group" && y(g.children);
  });
  return y(u), { kind: "group", id: r, name: a, ...pt(u), children: u };
}
function un(t, n, e, o, s, r, a, i) {
  const c = k(l(t, "relIds"), "r:dm"), m = c ? e.pkg.rels(n.part).get(c) : void 0;
  if (!m || m.external) return null;
  const b = e.pkg.xml(m.target), f = /* @__PURE__ */ new Map();
  for (const h of O(l(b, "ptLst"), "pt")) f.set(k(h, "modelId") || "", h);
  const p = /* @__PURE__ */ new Map();
  for (const h of O(l(b, "cxnLst"), "cxn")) {
    if ((k(h, "type") || "parOf") !== "parOf") continue;
    const g = k(h, "srcId") || "", w = k(h, "destId") || "";
    p.has(g) || p.set(g, []), p.get(g).push({ id: w, ord: S(h, "srcOrd") });
  }
  const x = [...f.values()].find((h) => k(h, "type") === "doc");
  if (!x) return null;
  const u = [], d = /* @__PURE__ */ new Set(), y = (h, g) => {
    if (!(d.has(h) || g > 16 || u.length > 500)) {
      d.add(h);
      for (const w of (p.get(h) ?? []).sort((M, C) => M.ord - C.ord)) {
        const M = f.get(w.id), C = k(M, "type") || "node";
        if (!M || C !== "node" && C !== "asst") continue;
        const v = At(l(M, "t"), { levels: [e.defaultText], bodyPr: [] }, i);
        for (const I of v?.paragraphs ?? [])
          I.runs.some((P) => !P.br && P.text.trim()) && u.push({
            ...I,
            align: "l",
            level: g,
            ...g > 0 ? { bullet: "char" } : {},
            runs: I.runs.map((P) => ({ ...P, size: P.size ?? (g > 0 ? 16 : 18), bold: P.bold ?? (g === 0 ? !0 : void 0) }))
          });
        y(w.id, g + 1);
      }
    }
  };
  return y(k(x, "modelId") || "", 0), u.length ? (e.warnings.push(`SmartArt diagram "${a}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: r,
    name: a,
    ...o(s),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: u, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function G(t, n, e) {
  if (!t || e < 0) return null;
  for (const o of Z(t)) {
    if (o.localName === n) return o;
    const s = G(o, n, e - 1);
    if (s) return s;
  }
  return null;
}
function wt(t, n) {
  const e = l(t, "bg");
  if (!e) return;
  const o = l(e, "bgPr");
  if (o)
    return J(o, n);
  const s = l(e, "bgRef");
  if (s) {
    const r = S(s, "idx"), i = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (i ? It(i, { ...n, ctx: { ...n.ctx, phClr: $(s, n.ctx) ?? void 0 } }) : void 0) ?? ($(s, n.ctx) ? { kind: "solid", color: $(s, n.ctx) } : void 0);
  }
}
function dn(t, n) {
  const e = t.relOfType(n, "notesSlide"), o = e ? L(t.xml(e), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (i) => {
    for (const c of Z(i)) {
      if (c.localName === "grpSp") {
        r(c);
        continue;
      }
      if (c.localName !== "sp") continue;
      const m = et(rt(c));
      if (!(!m || m.type !== "body" && m.type !== "obj"))
        for (const b of O(l(c, "txBody"), "p")) {
          let f = "";
          for (const p of O(b))
            p.localName === "r" || p.localName === "fld" ? f += l(p, "t")?.textContent ?? "" : p.localName === "br" && (f += `
`);
          s.push(f);
        }
    }
  };
  r(o);
  const a = s.join(`
`).replace(/\s+$/, "");
  return a.trim() ? a : void 0;
}
function hn(t) {
  for (const a of O(t, "AlternateContent"))
    for (const i of O(a, "Choice")) {
      const c = l(i, "transition");
      if (c && l(c, "morph")) {
        const m = k(c, "spd");
        return { kind: "morph", durationMs: k(c, "p14:dur") !== null ? S(c, "p14:dur") : m === "fast" ? 500 : m === "slow" ? 1e3 : 750 };
      }
    }
  const n = Z(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = O(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!e) return;
  const o = k(n, "spd"), s = k(n, "p14:dur") !== null ? S(n, "p14:dur") : o === "fast" ? 500 : o === "slow" ? 1e3 : 750, r = k(e, "dir");
  switch (e.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: "push", dir: r === "r" || r === "u" || r === "d" ? r : "l", durationMs: s };
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
function pn(t, n) {
  const e = L(t, "timing", "tnLst");
  if (!e) return [];
  const o = [];
  let s = 0;
  const r = [], a = (i, c) => {
    if (!(c > 40))
      for (const m of Z(i)) {
        if (m.localName === "seq") {
          const b = l(m, "cTn"), f = k(b, "nodeType");
          if (f && f !== "mainSeq") {
            s++;
            continue;
          }
        }
        if (m.localName === "cTn" && k(m, "presetClass")) {
          r.push(m);
          continue;
        }
        a(m, c + 1);
      }
  };
  a(e, 0);
  for (const i of r) {
    const c = k(i, "presetClass");
    if (c !== "entr" && c !== "exit" && c !== "emph") {
      s++;
      continue;
    }
    const m = S(i, "presetID"), b = S(i, "presetSubtype"), f = k(i, "nodeType"), p = f === "clickEffect" ? "click" : f === "afterEffect" ? "after" : "with", x = Number(k(L(i, "stCondLst", "cond"), "delay")), u = mt(l(i, "childTnLst"), "cBhvr", 4), d = u.map((I) => G(I, "spTgt", 2)).find(Boolean), y = d ? S(d, "spid") : NaN;
    if (!Number.isFinite(y) || G(d, "txEl", 1)) {
      s++;
      continue;
    }
    const h = u.map((I) => Number(k(l(I, "cTn"), "dur"))).filter((I) => Number.isFinite(I) && I > 1), g = h.length ? Math.max(...h) : 500, { effect: w, known: M } = xe(c, m);
    M || n(`An animation PowerPoint calls preset ${m} (${c}) came in as a plain ${w}.`);
    const C = mt(l(i, "childTnLst"), "animRot", 2)[0], v = k(i, "repeatCount");
    o.push({
      target: y,
      cls: c,
      effect: w,
      presetId: m,
      subtype: b,
      start: p,
      durationMs: g,
      delayMs: Number.isFinite(x) ? Math.max(0, x) : 0,
      ...Ft(b) && (w === "fly" || w === "wipe") && { dir: Ft(b) },
      ...w === "spin" && C && { degrees: S(C, "by") / 6e4 },
      ...v === "indefinite" ? { repeat: -1 } : v && Number(v) > 1e3 ? { repeat: Math.round(Number(v) / 1e3) } : {}
    });
  }
  return s && n(`${s} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), o;
}
function mt(t, n, e) {
  if (!t || e < 0) return [];
  const o = [];
  for (const s of Z(t))
    s.localName === n ? o.push(s) : o.push(...mt(s, n, e - 1));
  return o;
}
function qt(t) {
  const n = Z(t).find((s) => s.localName === "transition"), e = n ? k(n, "advTm") : null, o = e !== null ? Number(e) : NaN;
  return Number.isFinite(o) && o > 0 ? o : void 0;
}
function mn(t, n) {
  const e = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of O(l(t, "sldIdLst"), "sldId")) {
    const a = n.get(k(r, "r:id") || ""), i = k(r, "id");
    a && i && o.set(i, a.target);
  }
  const s = G(l(t, "extLst"), "sectionLst", 4);
  for (const r of O(s, "section")) {
    const a = (k(r, "name") || "").trim(), i = O(l(r, "sldIdLst"), "sldId")[0], c = i ? o.get(k(i, "id") || "") : void 0;
    a && c && !e.has(c) && e.set(c, a);
  }
  return e;
}
function gn(t, n = {}) {
  const e = [], o = (N) => {
    e.length < 200 && !e.includes(N) && e.push(N);
  }, s = n.parseXml ?? ((N) => new DOMParser().parseFromString(N, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = me(t, {
      filter: (N) => (a++, i += N.originalSize, a <= Bt && N.originalSize <= Le && i <= zt)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > Bt || i > zt) && o("The file is very large; some parts were skipped.");
  const c = new je(r, s, o), m = c.relOfType("", "officeDocument") ?? "ppt/presentation.xml", b = c.xml(m);
  if (!b || b.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const f = l(b, "sldSz"), p = f ? Math.max(1, F(S(f, "cx", 9144e3))) : 960, x = f ? Math.max(1, F(S(f, "cy", 5143500))) : 540, u = l(b, "defaultTextStyle"), d = c.rels(m), y = c.relOfType(m, "tableStyles"), h = y ? c.xml(y) : null, g = [], w = /* @__PURE__ */ new Set();
  for (const N of O(l(b, "sldIdLst"), "sldId")) {
    const T = d.get(k(N, "r:id") || "");
    T && !w.has(T.target) && g.length < Ee && (w.add(T.target), g.push(T.target));
  }
  const M = /* @__PURE__ */ new Map(), C = (N) => {
    const T = c.relOfType(N, "theme");
    return T ? (M.has(T) || M.set(T, bt(c.xml(T))), M.get(T)) : bt(null);
  }, v = (N) => {
    if (!N) return null;
    const T = {};
    for (let A = 0; A < N.attributes.length; A++) T[N.attributes[A].localName ?? N.attributes[A].name] = N.attributes[A].value;
    return T;
  }, I = mn(b, d), P = [];
  g.forEach((N, T) => {
    const A = c.xml(N);
    if (!A) {
      o(`Slide ${T + 1} couldn't be read and was skipped.`);
      return;
    }
    const B = c.relOfType(N, "slideLayout"), R = B ? c.xml(B) : null, Y = B ? c.relOfType(B, "slideMaster") : null, _ = Y ? c.xml(Y) : null, U = Y ? C(Y) : bt(null), q = v(L(A, "clrMapOvr", "overrideClrMapping")) ?? v(L(R, "clrMapOvr", "overrideClrMapping")) ?? v(l(_, "clrMap")) ?? Nt, Lt = { theme: U, clrMap: q }, gt = l(_, "txStyles"), X = {
      pkg: c,
      ctx: Lt,
      slide: { part: N, tree: L(A, "cSld", "spTree") },
      layout: B ? { part: B, tree: L(R, "cSld", "spTree") } : null,
      master: Y ? { part: Y, tree: L(_, "cSld", "spTree") } : null,
      masterTx: { title: l(gt, "titleStyle"), body: l(gt, "bodyStyle"), other: l(gt, "otherStyle") },
      defaultText: u,
      warnings: e,
      count: 0,
      tableStyles: h
    }, xt = (pe) => ({ pkg: c, part: pe?.part ?? N, ctx: Lt }), Et = wt(l(A, "cSld"), xt(X.slide)) ?? wt(l(R, "cSld"), xt(X.layout)) ?? wt(l(_, "cSld"), xt(X.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    X.background = Et;
    const ct = [], he = H(A, "showMasterSp") !== !1 && H(R, "showMasterSp") !== !1;
    X.master && he && ct.push(...it(X.master.tree, X.master, X, kt, 0, !1)), X.layout && H(A, "showMasterSp") !== !1 && ct.push(...it(X.layout.tree, X.layout, X, kt, 0, !1)), ct.push(...it(X.slide.tree, X.slide, X, kt, 0, !0)), P.push({
      items: ct,
      background: Et,
      transition: hn(A),
      name: k(l(A, "cSld"), "name") || void 0,
      notes: dn(c, N),
      key: N,
      ...k(A, "show") === "0" && { hidden: !0 },
      ...qt(A) && { advanceAfterMs: qt(A) },
      ...I.has(N) && { section: I.get(N) }
    });
    const Rt = pn(A, o);
    Rt.length && (P[P.length - 1].anims = Rt);
  }), P.length || o("The presentation has no slides.");
  const E = L(c.xml("docProps/core.xml"), "title")?.textContent || void 0, z = c.relOfType(m, "presProps"), j = k(l(z ? c.xml(z) : null, "showPr"), "loop");
  return { deck: { width: p, height: x, slides: P, title: E, ...(j === "1" || j === "true") && { loop: !0 } }, warnings: e };
}
const xn = 80, bn = "default-layer", D = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, yn = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, kn = /(courier|consolas|mono|menlo|code)/i;
function Zt(t) {
  if (!t) return "sans-serif";
  const n = Ce(t);
  return n || (kn.test(t) ? "monospace" : yn.test(t) ? "serif" : "sans-serif");
}
function wn(t) {
  const n = [];
  let e = [], o = !1;
  const s = () => {
    if (e.length >= 2) {
      const r = e[0], a = e[e.length - 1];
      o && Math.hypot(r.x - a.x, r.y - a.y) < 1e-6 && (r.inX = a.inX, r.inY = a.inY, e.pop()), n.push({ anchors: e, closed: o });
    }
    e = [], o = !1;
  };
  for (const r of t)
    if (r.op === "M")
      s(), e.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "L")
      e.length ? e.push({ x: r.x, y: r.y, kind: "corner" }) : e.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "C") {
      const a = e[e.length - 1];
      if (!a) {
        e.push({ x: r.x, y: r.y, kind: "corner" });
        continue;
      }
      a.outX = r.x1 - a.x, a.outY = r.y1 - a.y, e.push({ x: r.x, y: r.y, inX: r.x2 - r.x, inY: r.y2 - r.y, kind: "smooth" });
    } else r.op === "Z" && (o = !0, s());
  return s(), n;
}
const Mn = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
function vn(t, n, e) {
  let o = !1;
  t.forEach((s, r) => {
    s.start === "click" && (o = !0);
    const a = n.itemEls?.get(s.target);
    if (!a?.length) {
      n.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    a.forEach((i, c) => {
      const m = be(c === 0 ? s : { ...s, start: "with", delayMs: s.delayMs }, e("anim"), !o);
      m.order = r + c / (a.length + 1), (i.animations ??= []).push(m);
    });
  });
}
function Cn(t, n) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return Me(t.action);
  const e = n.slideIds?.get(t.key);
  return e ? ve(e) : null;
}
async function Sn(t) {
  if (!(typeof document > "u"))
    try {
      const n = new Image();
      n.src = t, await n.decode();
      const e = document.createElement("canvas");
      e.width = Math.max(1, Math.min(8192, n.naturalWidth)), e.height = Math.max(1, Math.min(8192, n.naturalHeight));
      const o = e.getContext("2d");
      return o ? (o.filter = "grayscale(1)", o.drawImage(n, 0, 0, e.width, e.height), e.toDataURL(/^data:image\/jpeg/.test(t) ? "image/jpeg" : "image/png", 0.92)) : void 0;
    } catch {
      return;
    }
}
async function Pn(t, n) {
  const e = /* @__PURE__ */ new Set(), o = (r) => {
    for (const a of r)
      if (a.kind === "group") o(a.children);
      else if (a.kind === "picture" && a.grayscale) {
        const i = n.get(a.media)?.url;
        i && e.add(i);
      } else if (a.kind === "shape" && a.fill.kind === "image" && a.fill.grayscale) {
        const i = n.get(a.fill.media)?.url;
        i && e.add(i);
      }
  };
  t.slides.forEach((r) => o(r.items));
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...e].map(async (r) => {
    const a = await Sn(r);
    a && s.set(r, a);
  })), s;
}
async function Tn(t, n, e, o) {
  if (!(typeof document > "u"))
    try {
      const s = new Image();
      s.src = t, await s.decode();
      const r = document.createElement("canvas");
      r.width = Math.max(1, Math.min(4096, Math.round(n))), r.height = Math.max(1, Math.min(4096, Math.round(e)));
      const a = r.getContext("2d");
      if (!a) return;
      if (o) {
        const i = a.createPattern(s, "repeat");
        if (!i) return;
        i.setTransform(new DOMMatrix().scale(o.sx, o.sy)), a.fillStyle = i, a.fillRect(0, 0, r.width, r.height);
      } else {
        if (Math.abs(s.naturalWidth / s.naturalHeight - n / e) < 0.01) return;
        a.drawImage(s, 0, 0, r.width, r.height);
      }
      return r.toDataURL(o ? "image/png" : "image/jpeg", 0.92);
    } catch {
      return;
    }
}
function tt(t, n, e, o) {
  return {
    id: t.nextId(n),
    type: n,
    x: e.x + t.ox,
    y: e.y + t.oy,
    width: Math.max(e.w, 1),
    height: Math.max(e.h, 1),
    angle: e.rot ? e.rot * Math.PI / 180 : 0,
    flipX: e.flipH || void 0,
    flipY: e.flipV || void 0,
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
    layerId: bn,
    groupIds: [...o].reverse(),
    // innermost first, the store's convention
    name: e.name
  };
}
function Kt(t, n, e) {
  switch (n.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = D(n.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = n.kind, t.backgroundColor = D(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: D(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
      break;
    case "pattern": {
      t.backgroundColor = D(n.color), t.fillStyle = "pattern", t.patternFill = jn(n.preset, D(n.color), n.bg ? D(n.bg) : "transparent");
      break;
    }
    case "image": {
      const o = e.images.get(n.media);
      o && (t.fillStyle = "image", t.backgroundImage = n.grayscale && e.gray.get(o.url) || o.url, t.backgroundColor = "#ffffff"), o && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
      break;
    }
  }
}
function Ct(t, n) {
  if (!n || !(n.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = D(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function Nn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function In(t, n) {
  const e = t.bullet === "num" ? Nn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && D(t.bulletColor) !== D(o) && (e.listMarkerColor = D(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const Mt = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function ce(t, n) {
  const e = t.paragraphs.flatMap((d) => d.runs.filter((y) => !y.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (d) => d.runs.reduce((y, h) => y + (h.br ? 0 : h.text.trim().length), 0);
  for (const d of t.paragraphs) {
    const y = a(d);
    y && r.set(d.align ?? "l", (r.get(d.align ?? "l") ?? 0) + y);
  }
  const i = [...r].sort((d, y) => y[1] - d[1])[0]?.[0] ?? t.paragraphs.find((d) => d.runs.length)?.align ?? "l", c = (d) => a(d) > 0 && (d.align ?? "l") !== i ? d.align === "ctr" ? "center" : d.align === "r" ? "right" : "left" : void 0, m = e.every((d) => d.size === o?.size && d.bold === o?.bold && d.italic === o?.italic && d.underline === o?.underline && d.strike === o?.strike && d.font === o?.font && D(d.color) === D(o?.color)) && !t.paragraphs.some((d) => d.bullet) && !t.paragraphs.some((d, y) => y > 0 && Mt(t, y) > 0) && !t.paragraphs.some(c), b = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Zt(o?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: D(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (b.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const f = t.paragraphs.map((d) => d.runs.map((y) => y.br ? `
` : y.text).join("")).join(`
`);
  if (m)
    return o?.bold && (b.fontWeight = 700), o?.italic && (b.fontStyle = "italic"), n ? b.containerText = f : b.text = f, { fields: b, rich: !1 };
  const p = [], x = [], u = [];
  return t.paragraphs.forEach((d, y) => {
    const h = d.level ?? 0;
    if (d.bullet === "num") {
      const M = d.numType ?? "arabicPeriod";
      (x[h] === void 0 || u[h] !== M) && (x[h] = (d.startAt ?? 1) - 1), x[h]++, u[h] = M, x.length = h + 1, u.length = h + 1;
    } else
      x.length = Math.min(x.length, h), u.length = x.length;
    const g = d.bullet ? { listType: d.bullet === "num" ? "ordered" : "bullet", listLevel: h, ...In(d, t) } : {};
    d.bullet === "num" && (g.listIndex = x[h]), (d.runs.length ? d.runs : [{ text: "" }]).forEach((M, C) => {
      const v = { text: M.br ? `
` : M.text, ...C === 0 ? g : {} };
      C === 0 && y > 0 && Mt(t, y) > 0 && (v.paragraphSpaceBefore = Mt(t, y));
      const I = c(d);
      I && (v.paragraphAlign = I), M.bold && (v.bold = !0), M.italic && (v.italic = !0), M.underline && (v.underline = !0), M.strike && (v.strikethrough = !0), M.color && (v.color = D(M.color)), M.size && (v.fontSize = Math.round(M.size * 10) / 10), M.font && (v.fontFamily = Zt(M.font)), p.push(v);
    }), y < t.paragraphs.length - 1 && p.push({ text: `
` });
  }), n ? (b.richContainerText = p, b.containerText = f) : (b.richText = p, b.text = f), { fields: b, rich: !0 };
}
function vt(t, n, e, o, s) {
  const { fields: r, rich: a } = ce(n, !1), i = 4, c = tt(t, a ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - i,
    y: e.y + n.insets.t - i,
    w: Math.max(e.w - n.insets.l - n.insets.r + i * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + i * 2, 8)
  }, o);
  return Object.assign(c, r, { autoResize: !n.wrap, strokeColor: r.textColor }), c;
}
const fe = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function ue(t, n, e) {
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return n.stats.elements++, [vt(n, t.text, t, e)];
  if (o.kind === "preset" && fe.has(o.prst)) return St({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((f) => !f.cmds.some((p) => p.op === "Z")))
    return St({ ...t, kind: "connector", line: t.line }, n, e);
  const s = An(t);
  if (s) {
    const f = tt(n, s.type, t, e);
    Object.assign(f, s.extra), Kt(f, t.fill, n), Ct(f, t.line), n.byPptId.set(t.id, { el: f, item: t }), n.stats.elements++;
    const p = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, x = t.text?.insets, u = Math.abs(p.l) > 0.5 || Math.abs(p.t) > 0.5 || Math.abs(p.r - t.w) > 0.5 || Math.abs(p.b - t.h) > 0.5, d = !!x && Math.max(x.l, x.r, x.t, x.b) > 16;
    if (t.text && (u || d)) {
      const y = n.nextId("group");
      return f.groupIds = [...e, y].reverse(), n.stats.elements++, [f, vt(n, t.text, { ...t, rot: 0, x: t.x + p.l, y: t.y + p.t, w: p.r - p.l, h: p.b - p.t }, [...e, y])];
    }
    if (t.text) {
      const { fields: y } = ce(t.text, !0);
      Object.assign(f, y);
    }
    return [f];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const f = n.presets[o.prst];
    if (!f)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), ut(n.presets.rect, t.w, t.h);
    const p = Object.fromEntries(Object.entries(o.adj ?? {}).map(([x, u]) => [x, `val ${u}`]));
    return ut(f, t.w, t.h, p);
  })(), a = [], i = (t.text || r.some((f) => f.fill === !1)) && r.some((f) => f.fill !== !1) ? n.nextId("group") : null, c = i ? [...e, i] : e, m = /* @__PURE__ */ new Map();
  for (const f of r) {
    const p = `${f.fill === !1 ? "nofill" : "fill"}|${f.stroke === !1 ? "nostroke" : "stroke"}`;
    m.has(p) || m.set(p, []), m.get(p).push(f);
  }
  let b = null;
  for (const [f, p] of m) {
    const x = p.flatMap((g) => g.cmds), u = ye(x);
    if (!u) continue;
    const d = wn(Mn(x, -u.minX, -u.minY));
    if (!d.length) continue;
    const y = tt(n, "path", { ...t, x: t.x + u.minX, y: t.y + u.minY, w: Math.max(u.maxX - u.minX, 1), h: Math.max(u.maxY - u.minY, 1) }, c);
    !(Math.abs(u.minX + u.maxX - t.w) < 0.5 && Math.abs(u.minY + u.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && On(y, d, t, u), y.pathSubpaths = d, y.pathAnchors = d[0].anchors, y.pathClosed = d[0].closed, f.startsWith("fill") ? Kt(y, t.fill, n) : y.backgroundColor = "transparent", f.endsWith("|stroke") ? Ct(y, t.line) : (y.strokeColor = "transparent", y.strokeWidth = 0), a.push(y), b ??= y, n.stats.paths++;
  }
  if (b && n.byPptId.set(t.id, { el: b, item: t }), t.text) {
    const f = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? ee(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(vt(n, t.text, { ...t, x: t.x + f.l, y: t.y + f.t, w: f.r - f.l, h: f.b - f.t }, c));
  }
  return n.stats.elements += a.length, a;
}
function On(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), c = Math.sin(a), m = e.flipH ? -1 : 1, b = e.flipV ? -1 : 1, f = (h, g) => {
    const w = (h + o.minX - s) * m, M = (g + o.minY - r) * b;
    return { x: s + w * i - M * c, y: r + w * c + M * i };
  }, p = (h, g) => {
    const w = h * m, M = g * b;
    return { x: w * i - M * c, y: w * c + M * i };
  };
  let x = 1 / 0, u = 1 / 0, d = -1 / 0, y = -1 / 0;
  for (const h of n) for (const g of h.anchors) {
    const w = f(g.x, g.y);
    if (g.x = w.x, g.y = w.y, g.inX !== void 0) {
      const M = p(g.inX, g.inY ?? 0);
      g.inX = M.x, g.inY = M.y;
    }
    if (g.outX !== void 0) {
      const M = p(g.outX, g.outY ?? 0);
      g.outX = M.x, g.outY = M.y;
    }
    x = Math.min(x, g.x), u = Math.min(u, g.y), d = Math.max(d, g.x), y = Math.max(y, g.y);
  }
  for (const h of n) for (const g of h.anchors)
    g.x -= x, g.y -= u;
  t.x = t.x - o.minX + x, t.y = t.y - o.minY + u, t.width = Math.max(d - x, 1), t.height = Math.max(y - u, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function An(t) {
  const n = t.geom;
  if (n.kind !== "preset") return null;
  const e = n.adj ?? {};
  switch (n.prst) {
    case "rect":
      return { type: "rectangle", extra: { borderRadius: 0 } };
    case "roundRect":
      return { type: "rectangle", extra: { borderRadius: Math.max(0, Math.min(50, (e.adj ?? 16667) / 1e3)) } };
    case "ellipse":
      return { type: "circle", extra: {} };
    case "diamond":
      return { type: "diamond", extra: { borderRadius: 0 } };
    case "triangle":
      return (e.adj ?? 5e4) === 5e4 ? { type: "triangle", extra: {} } : null;
    default:
      return null;
  }
}
const Qt = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function St(t, n, e) {
  const o = t.geom;
  let s;
  if (o.kind === "preset" && fe.has(o.prst)) s = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (o.kind === "custom") s = o.paths.flatMap((w) => w.cmds);
  else {
    const w = n.presets[o.prst], M = Object.fromEntries(Object.entries(o.adj ?? {}).map(([C, v]) => [C, `val ${v}`]));
    s = w ? ut(w, t.w, t.h, M).flatMap((C) => C.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, c = (w, M) => {
    let C = w - r, v = M - a;
    return t.flipH && (C = -C), t.flipV && (v = -v), { x: t.x + r + C * Math.cos(i) - v * Math.sin(i), y: t.y + a + C * Math.sin(i) + v * Math.cos(i) };
  }, m = [];
  let b = { x: 0, y: 0 };
  for (const w of s)
    if (w.op === "M" || w.op === "L")
      b = { x: w.x, y: w.y }, m.push(c(b.x, b.y));
    else if (w.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const C = M / 12, v = 1 - C, I = v * v * v * b.x + 3 * v * v * C * w.x1 + 3 * v * C * C * w.x2 + C * C * C * w.x, P = v * v * v * b.y + 3 * v * v * C * w.y1 + 3 * v * C * C * w.y2 + C * C * C * w.y;
        m.push(c(I, P));
      }
      b = { x: w.x, y: w.y };
    }
  if (m.length < 2) return [];
  const f = Math.min(...m.map((w) => w.x)), p = Math.min(...m.map((w) => w.y)), x = Math.max(...m.map((w) => w.x)), u = Math.max(...m.map((w) => w.y)), d = t.line.head && Qt[t.line.head.type], y = t.line.tail && Qt[t.line.tail.type], h = tt(n, d || y ? "arrow" : "line", { ...t, x: f, y: p, w: Math.max(x - f, 1), h: Math.max(u - p, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  h.points = m.map((w) => ({ x: w.x - f, y: w.y - p })), h.curveType = "straight", h.startArrowhead = d ?? null, h.endArrowhead = y ?? null, Ct(h, t.line);
  const g = (w, M) => {
    if (!w) return null;
    const C = n.byPptId.get(w.id);
    if (!C || !C.el.width || !C.el.height) return null;
    const v = C.el;
    return { elementId: v.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - v.x) / v.width, anchorFractionY: (M.y + n.oy - v.y) / v.height };
  };
  return n.glue.push(() => {
    h.startBinding = g(t.start, m[0]), h.endBinding = g(t.end, m[m.length - 1]);
  }), n.stats.elements++, [h];
}
function Ln(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const c = tt(n, "rectangle", t, e);
    return Object.assign(c, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [c];
  }
  const s = tt(n, "image", t, e);
  if (s.dataURL = t.grayscale && n.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = Pt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), t.descr && (s.altText = t.descr), n.stats.elements++, n.stats.pictures++, !t.geom) return [s];
  const r = n.nextId("group"), a = ue({
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
  }, n, [...e, r]);
  if (a.length !== 1)
    return n.stats.elements -= a.length, [s];
  const i = a[0];
  return i.isClipMask = !0, s.groupIds = [r, ...s.groupIds], s.clipMaskId = i.id, s.maskType = "clip", [s, i];
}
function de(t, n, e) {
  const o = [];
  for (const s of t)
    try {
      const r = [];
      switch (s.kind) {
        case "shape":
          r.push(...ue(s, n, e));
          break;
        case "connector":
          r.push(...St(s, n, e));
          break;
        case "picture":
          r.push(...Ln(s, n, e));
          break;
        case "group":
          r.push(...de(s.children, n, [...e, n.nextId("group")]));
          break;
        case "chart": {
          const i = tt(n, "chart", s, e);
          i.chart = we(s.chart), i.fontFamily = "sans-serif", n.stats.elements++, r.push(i);
          break;
        }
      }
      const a = Cn(s.link, n);
      if (a)
        for (const i of r) i.link || (i.link = a);
      n.itemEls?.set(s.id, r), o.push(...r);
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function En(t) {
  return t ? { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function Rn(t, n, e) {
  if (n)
    if (n.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = D(n.color);
    else if (n.kind === "linear" || n.kind === "radial")
      t.fillStyle = n.kind, t.backgroundColor = D(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: D(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
    else if (n.kind === "image") {
      const o = e.images.get(n.media), s = e.slideBg ?? o?.url;
      s && (t.fillStyle = "image", t.backgroundImage = s, t.backgroundColor = "#ffffff"), s && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
    } else n.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = D(n.color));
}
const Pt = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, Fn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Dn(t) {
  let n = "";
  for (let o = 0; o < t.length; o += 32768) n += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(n);
}
async function $n(t) {
  const n = /* @__PURE__ */ new Set(), e = (s) => {
    for (const r of s)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const s of t.slides)
    e(s.items), s.background?.kind === "image" && n.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (s) => {
    if (!Fn.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Pt[s.ext]};base64,${Dn(s.bytes)}`;
    let a = 0, i = 0;
    try {
      const c = await createImageBitmap(new Blob([s.bytes], { type: Pt[s.ext] }));
      a = c.width, i = c.height, c.close();
    } catch {
    }
    o.set(s, { url: r, w: a, h: i });
  })), o;
}
function jn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, a = /^pct(\d+)$/.exec(t);
  if (a) {
    const i = Math.max(1, Math.min(99, Number(a[1]))), c = i > 50, m = (c ? 100 - i : i) / 100;
    return { type: "dots", color: c ? e : n, background: c ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(m / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function Bn(t, n, e) {
  const o = await Ae(), s = await $n(t), r = Math.round(t.width), a = Math.round(t.height), i = ke(e ?? t.title, "slides", { width: r, height: a }), c = [], m = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  i.slides = [];
  const b = await Pn(t, s), f = await Promise.all(t.slides.map((u) => {
    const d = u.background, y = d?.kind === "image" ? s.get(d.media) : void 0;
    return d?.kind === "image" && y ? Tn(y.url, r, a, d.tile) : void 0;
  })), p = t.slides.map(() => n("slide")), x = /* @__PURE__ */ new Map();
  return t.slides.forEach((u, d) => {
    u.key && x.set(u.key, p[d]);
  }), t.slides.forEach((u, d) => {
    const y = d * (r + xn), h = Dt(p[d], u.name || `Slide ${d + 1}`, y, 0, { width: r, height: a });
    h.order = d;
    const g = { ox: y, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: c, stats: m, images: s, slideBg: f[d], gray: b, slideIds: x, itemEls: /* @__PURE__ */ new Map() };
    i.elements.push(...de(u.items, g, [])), vn(u.anims ?? [], g, n), g.glue.forEach((M) => M()), Rn(h, u.background, g);
    const w = En(u.transition);
    w && (h.transition = w), u.notes && (h.notes = u.notes), u.hidden && (h.hidden = !0), u.advanceAfterMs && (h.advanceAfter = u.advanceAfterMs), u.section && (h.section = u.section), i.slides.push(h), m.slides++;
  }), i.slides.length || i.slides.push(Dt(void 0, "Slide 1", 0, 0, { width: r, height: a })), t.loop && (i.globalSettings = { ...i.globalSettings || {}, slideShowLoop: !0 }), { doc: i, warnings: [...new Set(c)], stats: m };
}
const zn = 512 * 1024 * 1024;
async function _n(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > zn) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = gn(e), r = /* @__PURE__ */ new Set(), a = await Bn(o, (c) => Pe(c, r), n);
  Se(a.doc);
  const i = [...s, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  _n as importPptx
};
