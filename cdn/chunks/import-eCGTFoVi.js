import { u as he, a as pe } from "./browser-DbZP-BrN.js";
import { e as me, s as Ft, f as ge } from "./anim-map-D7T1mIAM.js";
import { E as z, i as Tt, g as xe } from "./custgeom-N1NlyQKZ.js";
import { ar as be, as as Dt, at as ye, au as ke, M as we, q as Me, K as ve } from "./index-zg1eC33A.js";
const Se = 1e4, Ce = 1e5, Qt = 6e4, nt = (t) => t / Qt * (Math.PI / 180);
function Jt(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), l = Math.max(r, a), p = {
    w: r,
    h: a,
    l: 0,
    t: 0,
    r,
    b: a,
    hc: r / 2,
    vc: a / 2,
    ss: i,
    ls: l,
    cd2: 108e5,
    cd4: 54e5,
    cd8: 27e5,
    "3cd4": 162e5,
    "3cd8": 81e5,
    "5cd8": 135e5,
    "7cd8": 189e5
  };
  for (const [g, b] of Object.entries(p)) s.set(g, b);
  for (const g of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${g}`, r / g), s.set(`hd${g}`, a / g), s.set(`ssd${g}`, i / g);
  const x = (g) => {
    const b = s.get(g);
    if (b !== void 0) return b;
    const f = /^(wd|hd|ssd)(\d+)$/.exec(g);
    if (f) {
      const y = f[1] === "wd" ? r : f[1] === "hd" ? a : i, d = Number(f[2]);
      return d ? y / d : 0;
    }
    const h = Number(g);
    return Number.isFinite(h) ? h : 0;
  }, u = (g, b) => {
    s.size > Se || s.set(g, Pe(b, x));
  };
  for (const [g, b] of t.av ?? []) u(g, o[g] ?? b);
  for (const [g, b] of Object.entries(o)) s.has(g) || u(g, b);
  for (const [g, b] of t.gd ?? []) u(g, b);
  return s;
}
function Pe(t, n) {
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
      i = Math.atan2(r, s) * 180 / Math.PI * Qt;
      break;
    case "cat2":
      i = s * Math.cos(Math.atan2(a, r));
      break;
    case "sat2":
      i = s * Math.sin(Math.atan2(a, r));
      break;
    case "cos":
      i = s * Math.cos(nt(r));
      break;
    case "sin":
      i = s * Math.sin(nt(r));
      break;
    case "tan":
      i = s * Math.tan(nt(r));
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
const jt = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function ut(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * z, r = Math.max(Math.abs(e), 0) * z, a = Jt(t, s, r, o), i = (x) => typeof x == "number" ? x : a.get(x) ?? (Number.isFinite(Number(x)) ? Number(x) : 0), l = [];
  let p = Ce;
  for (const x of t.paths) {
    const u = x.w ? s / x.w : 1, g = x.h ? r / x.h : 1, b = (m) => i(m) * u / z, f = (m) => i(m) * g / z, h = [];
    let y = { x: 0, y: 0 }, d = { x: 0, y: 0 };
    for (const m of x.d) {
      if (--p < 0) break;
      switch (m[0]) {
        case "M":
          y = { x: b(m[1]), y: f(m[2]) }, d = y, h.push({ op: "M", ...y });
          break;
        case "L":
          y = { x: b(m[1]), y: f(m[2]) }, h.push({ op: "L", ...y });
          break;
        case "C": {
          const w = b(m[1]), M = f(m[2]), S = b(m[3]), v = f(m[4]);
          y = { x: b(m[5]), y: f(m[6]) }, h.push({ op: "C", x1: w, y1: M, x2: S, y2: v, ...y });
          break;
        }
        case "Q": {
          const w = b(m[1]), M = f(m[2]), S = b(m[3]), v = f(m[4]);
          h.push({ op: "C", x1: y.x + 2 / 3 * (w - y.x), y1: y.y + 2 / 3 * (M - y.y), x2: S + 2 / 3 * (w - S), y2: v + 2 / 3 * (M - v), x: S, y: v }), y = { x: S, y: v };
          break;
        }
        case "A": {
          const w = i(m[1]) * u / z, M = i(m[2]) * g / z;
          y = Te(h, y, w, M, i(m[3]), i(m[4]));
          break;
        }
        case "Z":
          h.push({ op: "Z" }), y = d;
          break;
      }
    }
    h.length && l.push({ cmds: h, fill: x.fill === "none" ? !1 : void 0, stroke: x.stroke === !1 ? !1 : void 0 });
  }
  return l;
}
function Te(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const a = nt(s), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, nt(r))), l = jt(a, e, o);
  let p = jt(a + i, e, o);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) p = l + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && p < l; ) p += 2 * Math.PI;
    for (; i < 0 && p > l; ) p -= 2 * Math.PI;
  }
  const x = n.x - e * Math.cos(l), u = n.y - o * Math.sin(l), g = p - l, b = Math.max(1, Math.min(16, Math.ceil(Math.abs(g) / (Math.PI / 2)))), f = g / b, h = 4 / 3 * Math.tan(f / 4);
  let y = l, d = n;
  for (let m = 0; m < b; m++) {
    const w = y + f, M = Math.cos(y), S = Math.sin(y), v = Math.cos(w), I = Math.sin(w);
    d = { x: x + e * v, y: u + o * I }, t.push({ op: "C", x1: x + e * (M - h * S), y1: u + o * (S + h * M), x2: x + e * (v + h * I), y2: u + o * (I - h * v), ...d }), y = w;
  }
  return d;
}
function te(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const a = Jt(t, s * z, r * z, o), i = (g) => (a.get(g) ?? (Number.isFinite(Number(g)) ? Number(g) : 0)) / z, [l, p, x, u] = t.rect.map(i);
  return { l, t: p, r: x, b: u };
}
let $t = null;
async function Ie() {
  return $t ??= (await import("./presets-DP49P8i2.js")).default, $t;
}
const Bt = 5e4, Ne = 256 * 1024 * 1024, zt = 1024 * 1024 * 1024, Oe = 1e4, Ae = 32, Le = 2e4, N = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!n || o.localName === n) && e.push(o);
  return e;
}, c = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, A = (t, ...n) => {
  let e = t;
  for (const o of n) e = c(e, o);
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
}, C = (t, n, e = 0) => {
  const o = k(t, n), s = o === null ? NaN : Number(o);
  return Number.isFinite(s) ? s : e;
}, B = (t, n) => {
  const e = k(t, n);
  return e === null ? void 0 : e === "1" || e === "true" || e === "on";
}, R = (t) => t / z, Ee = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function Re(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = c(t, "Fallback");
  for (const e of N(t, "Choice"))
    if ((k(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => Ee.has(s))) return N(e);
  return N(n);
}
const V = (t) => N(t).flatMap(Re);
class Fe {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(n, e, o) {
    this.parseXml = e, this.warn = o, this.files = {};
    for (const [s, r] of Object.entries(n)) this.files[et(s)] = r;
  }
  bytes(n) {
    return this.files[et(n)];
  }
  xml(n) {
    const e = et(n);
    if (!this.text.has(e)) {
      const o = this.files[e];
      let s = null;
      if (o) {
        try {
          const r = pe(o).replace(/^﻿/, "");
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
    const e = et(n);
    let o = this.relCache.get(e);
    if (o) return o;
    o = /* @__PURE__ */ new Map();
    const s = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), a = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const i of N(a, "Relationship")) {
      const l = k(i, "Id"), p = k(i, "Type") || "", x = k(i, "Target") || "";
      if (!l) continue;
      const u = k(i, "TargetMode") === "External";
      o.set(l, { type: p.slice(p.lastIndexOf("/") + 1), target: u ? x : De(s, x), external: u });
    }
    return this.relCache.set(e, o), o;
  }
  relOfType(n, e) {
    for (const o of this.rels(n).values()) if (o.type === e && !o.external) return o.target;
    return null;
  }
}
const et = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function De(t, n) {
  let e = n.split("#")[0];
  try {
    e = decodeURIComponent(e);
  } catch {
  }
  if (e.startsWith("/")) return et(e);
  const o = (t ? t.split("/") : []).concat(e.split("/")), s = [];
  for (const r of o)
    r === ".." ? s.pop() : r && r !== "." && s.push(r);
  return s.join("/");
}
const It = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function xt(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = c(t, "themeElements");
  for (const r of N(c(e, "clrScheme"))) {
    const a = N(r)[0];
    if (!a) continue;
    const i = a.localName === "sysClr" ? k(a, "lastClr") : k(a, "val");
    i && /^[0-9a-f]{6}$/i.test(i) && (n.colors[r.localName] = "#" + i.toLowerCase());
  }
  const o = c(e, "fontScheme");
  n.major = k(A(o, "majorFont", "latin"), "typeface") || n.major, n.minor = k(A(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = c(e, "fmtScheme");
  return n.fills = N(c(s, "fillStyleLst")), n.lines = N(c(s, "lnStyleLst")), n.bgFills = N(c(s, "bgFillStyleLst")), n;
}
const je = {
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
}, ee = (t) => {
  const n = t.replace("#", "");
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}, ft = (t, n, e) => "#" + [t, n, e].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), ot = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), U = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function Xt(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const o = Math.max(t, n, e), s = Math.min(t, n, e), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const a = o - s, i = r > 0.5 ? a / (2 - o - s) : a / (o + s);
  return [(o === t ? (n - e) / a + (n < e ? 6 : 0) : o === n ? (e - t) / a + 2 : (t - n) / a + 4) * 60, i, r];
}
function bt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const o = e < 0.5 ? e * (1 + n) : e + n - e * n, s = 2 * e - o, r = (a) => (a = (a % 1 + 1) % 1, a < 1 / 6 ? s + (o - s) * 6 * a : a < 1 / 2 ? o : a < 2 / 3 ? s + (o - s) * (2 / 3 - a) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function j(t, n) {
  const e = N(t).find((o) => /Clr$/.test(o.localName));
  return e ? $e(e, n) : null;
}
function $e(t, n) {
  let e = null, o = 1;
  switch (t.localName) {
    case "srgbClr": {
      const l = k(t, "val");
      e = l && /^[0-9a-f]{6}$/i.test(l) ? "#" + l.toLowerCase() : null;
      break;
    }
    case "sysClr": {
      const l = k(t, "lastClr");
      e = l ? "#" + l.toLowerCase() : k(t, "val") === "window" ? "#ffffff" : "#000000";
      break;
    }
    case "prstClr":
      e = je[k(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = ft(U(C(t, "r") / 1e5), U(C(t, "g") / 1e5), U(C(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [l, p, x] = bt(C(t, "hue") / 6e4, C(t, "sat") / 1e5, C(t, "lum") / 1e5);
      e = ft(l, p, x);
      break;
    }
    case "schemeClr": {
      const l = k(t, "val") || "";
      if (l === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const p = n.clrMap[l] ?? It[l] ?? l;
      e = n.theme.colors[p] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, a] = ee(e);
  for (const l of N(t)) {
    const p = C(l, "val") / 1e5;
    switch (l.localName) {
      case "alpha":
        o = p;
        break;
      case "alphaMod":
        o *= p;
        break;
      case "alphaOff":
        o += p;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [x, u, g] = Xt(s, r, a);
        l.localName === "lumMod" ? g *= p : l.localName === "lumOff" ? g += p : l.localName === "satMod" ? u *= p : l.localName === "satOff" ? u += p : l.localName === "hueMod" ? x *= p : x += C(l, "val") / 6e4, [s, r, a] = bt(x, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, g)));
        break;
      }
      case "tint":
        [s, r, a] = [s, r, a].map((x) => U(ot(x) * p + (1 - p)));
        break;
      case "shade":
        [s, r, a] = [s, r, a].map((x) => U(ot(x) * p));
        break;
      case "comp": {
        const [x, u, g] = Xt(s, r, a);
        [s, r, a] = bt(x + 180, u, g);
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
function q(t, n) {
  for (const e of N(t)) {
    const o = Nt(e, n);
    if (o) return o;
  }
}
function Nt(t, n) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const e = j(t, n.ctx);
      return e ? { kind: "solid", color: e } : { kind: "none" };
    }
    case "gradFill": {
      const e = N(c(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: C(s, "pos") / 1e5, color: j(s, n.ctx) ?? { hex: "#000000" } }));
      if (!e.length) return { kind: "none" };
      const o = c(t, "lin");
      return c(t, "path") ? { kind: "radial", stops: e } : { kind: "linear", stops: e, angle: o ? C(o, "ang") / 6e4 : 90, scaled: B(o, "scaled") ?? !1 };
    }
    case "blipFill": {
      const e = ne(t, n);
      if (!e) return;
      const o = { kind: "image", media: e }, s = c(t, "tile");
      s && (o.tile = { sx: Math.max(0.01, C(s, "sx", 1e5) / 1e5), sy: Math.max(0.01, C(s, "sy", 1e5) / 1e5) });
      const r = c(c(t, "blip"), "alphaModFix");
      return r && (o.alpha = Math.max(0, Math.min(1, C(r, "amt", 1e5) / 1e5))), c(c(t, "blip"), "grayscl") && (o.grayscale = !0), o;
    }
    case "pattFill": {
      const e = j(c(t, "fgClr"), n.ctx), o = j(c(t, "bgClr"), n.ctx);
      return e ? { kind: "pattern", preset: k(t, "prst") || "pct50", color: e, ...o ? { bg: o } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Be = {
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
function ne(t, n) {
  const e = c(t, "blip"), o = k(e, "r:embed");
  if (!o) return null;
  const s = n.pkg.rels(n.part).get(o);
  if (!s || s.external) return null;
  const r = n.pkg.bytes(s.target), a = Be[(s.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const ze = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function G(t, n) {
  if (!t) return;
  let e;
  for (const i of N(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = j(i, n.ctx)), i.localName === "gradFill" && (e = j(c(c(i, "gsLst"), "gs"), n.ctx));
  }
  const o = k(t, "w");
  if (e === void 0 && o === null && !c(t, "prstDash") && !c(t, "headEnd") && !c(t, "tailEnd")) return;
  const s = (i) => {
    const l = k(i, "type");
    if (!l || l === "none") return;
    const p = l === "triangle" || l === "stealth" || l === "arrow" || l === "oval" || l === "diamond" ? l : "triangle", x = k(i, "len") || k(i, "w");
    return { type: p, size: x === "sm" || x === "lg" ? x : "med" };
  }, r = ze[k(c(t, "prstDash"), "val") || "solid"], a = k(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, R(Number(o) || 0)) : 1,
    color: e ?? { hex: "#000000" },
    dash: r || void 0,
    cap: a === "rnd" ? "rnd" : a === "sq" ? "sq" : a === "flat" ? "flat" : void 0,
    join: c(t, "round") ? "round" : c(t, "bevel") ? "bevel" : c(t, "miter") ? "miter" : void 0,
    head: s(c(t, "headEnd")),
    tail: s(c(t, "tailEnd"))
  };
}
function dt(t, n) {
  const e = c(t, "fillRef");
  if (!e) return;
  const o = C(e, "idx");
  if (o === 0) return { kind: "none" };
  const r = (o >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[o >= 1001 ? o - 1001 : o - 1];
  if (!r) return;
  const a = j(e, n.ctx) ?? void 0;
  return Nt(r, { ...n, ctx: { ...n.ctx, phClr: a } });
}
function Ot(t, n) {
  const e = c(t, "lnRef");
  if (!e) return;
  const o = C(e, "idx");
  if (o === 0) return null;
  const s = n.ctx.theme.lines[o - 1];
  if (!s) return;
  const r = j(e, n.ctx) ?? void 0;
  return G(s, { ...n, ctx: { ...n.ctx, phClr: r } }) ?? void 0;
}
function W(t) {
  if (!t) return null;
  const n = c(t, "off"), e = c(t, "ext");
  return !n || !e ? null : {
    x: R(C(n, "x")),
    y: R(C(n, "y")),
    w: Math.max(0, R(C(e, "cx"))),
    h: Math.max(0, R(C(e, "cy"))),
    rot: C(t, "rot") / 6e4,
    flipH: !!B(t, "flipH"),
    flipV: !!B(t, "flipV")
  };
}
const yt = (t) => t;
function Xe(t, n) {
  const e = W(t);
  if (!e) return n;
  const o = c(t, "chOff"), s = c(t, "chExt"), r = o ? R(C(o, "x")) : e.x, a = o ? R(C(o, "y")) : e.y, i = s ? R(C(s, "cx")) : e.w, l = s ? R(C(s, "cy")) : e.h, p = i > 0 ? e.w / i : 1, x = l > 0 ? e.h / l : 1, u = e.x + e.w / 2, g = e.y + e.h / 2, b = e.rot * Math.PI / 180;
  return (f) => {
    let h = e.x + (f.x + f.w / 2 - r) * p, y = e.y + (f.y + f.h / 2 - a) * x, d = f.rot, m = f.flipH, w = f.flipV;
    if (e.flipH && (h = 2 * u - h, m = !m, d = -d), e.flipV && (y = 2 * g - y, w = !w, d = -d), b) {
      const v = h - u, I = y - g;
      h = u + v * Math.cos(b) - I * Math.sin(b), y = g + v * Math.sin(b) + I * Math.cos(b), d += e.rot;
    }
    const M = f.w * p, S = f.h * x;
    return n({ x: h - M / 2, y: y - S / 2, w: M, h: S, rot: (d % 360 + 360) % 360, flipH: m, flipV: w });
  };
}
function Ht(t) {
  const n = c(t, "spcPts"), e = c(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, C(n, "val") / 100)) * (Tt / z) };
  if (e) return { lines: Math.max(0, Math.min(13.2, C(e, "val") / 1e5)) };
}
function Yt(t, n, e) {
  const o = c(t, `lvl${n + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return o ? oe(o, e) : {};
}
function oe(t, n) {
  const e = {};
  if (k(t, "algn") && (e.algn = k(t, "algn")), k(t, "marL") !== null && (e.marL = R(C(t, "marL"))), k(t, "indent") !== null && (e.indent = R(C(t, "indent"))), c(t, "buNone")) e.bullet = "none";
  else if (c(t, "buAutoNum")) {
    const a = c(t, "buAutoNum");
    e.bullet = "num", e.numType = k(a, "type") || "arabicPeriod", e.startAt = k(a, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(C(a, "startAt", 1)))) : void 0;
  } else c(t, "buChar") ? (e.bullet = "char", e.buChar = k(c(t, "buChar"), "char") || void 0) : c(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (c(t, "buFont") ? e.buFont = k(c(t, "buFont"), "typeface") || null : c(t, "buFontTx") && (e.buFont = null), c(t, "buClr") ? e.buClr = j(c(t, "buClr"), n.ctx) : c(t, "buClrTx") && (e.buClr = null), c(t, "buSzPct")) {
    const a = k(c(t, "buSzPct"), "val") || "", i = a.endsWith("%") ? parseFloat(a) / 100 : Number(a) / 1e5;
    e.buSz = Number.isFinite(i) && i > 0 ? Math.max(0.25, Math.min(4, i)) : null;
  } else (c(t, "buSzTx") || c(t, "buSzPts")) && (e.buSz = null);
  const o = A(t, "lnSpc", "spcPct");
  o && (e.lnSpcPct = C(o, "val") / 1e5);
  const s = Ht(c(t, "spcBef")), r = Ht(c(t, "spcAft"));
  return s && (e.spcBef = s), r && (e.spcAft = r), Object.assign(e, se(c(t, "defRPr"), n)), e;
}
function se(t, n) {
  if (!t) return {};
  const e = {};
  k(t, "sz") !== null && (e.sz = C(t, "sz") / 100 * (Tt / z)), B(t, "b") !== void 0 && (e.b = B(t, "b")), B(t, "i") !== void 0 && (e.i = B(t, "i")), k(t, "u") && (e.u = k(t, "u") !== "none"), k(t, "strike") && (e.strike = k(t, "strike") !== "noStrike");
  const o = c(t, "solidFill");
  o ? e.color = j(o, n.ctx) : c(t, "noFill") && (e.color = null);
  const s = k(c(t, "latin"), "typeface");
  return s && (e.font = s), e;
}
const He = {
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
}, Ye = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function We(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const o = (n || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && He[e] || "•" : o === "symbol" ? Ye[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const Wt = (...t) => {
  const n = {};
  for (const e of t) for (const [o, s] of Object.entries(e)) s !== void 0 && (n[o] = s);
  return n;
};
function _e(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function At(t, n, e) {
  if (!t) return;
  const o = N(t, "p");
  if (!o.some((b) => N(b).some((f) => (f.localName === "r" || f.localName === "fld") && (A(f, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const b of [...n.bodyPr, c(t, "bodyPr")]) {
    if (!b) continue;
    for (let h = 0; h < b.attributes.length; h++) r[b.attributes[h].localName ?? b.attributes[h].name] = b.attributes[h].value;
    const f = c(b, "normAutofit");
    f && (a = k(f, "fontScale") !== null ? C(f, "fontScale") / 1e5 : 1), f && (i = 1 - Math.max(0, Math.min(0.9, C(f, "lnSpcReduction") / 1e5))), (c(b, "noAutofit") || c(b, "spAutoFit")) && (a = 1, i = 1);
  }
  const l = (b, f) => r[b] !== void 0 ? R(Number(r[b]) || 0) : R(f), p = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", x = c(t, "lstStyle"), u = [];
  let g;
  for (const b of o) {
    const f = c(b, "pPr"), h = Math.max(0, Math.min(8, C(f, "lvl"))), y = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, d = Wt(...n.levels.map((P) => Yt(P, h, e)), y, Yt(x, h, e), f ? oe(f, e) : {});
    d.lnSpcPct !== void 0 && g === void 0 && (g = d.lnSpcPct);
    const m = { runs: [], align: d.algn === "ctr" ? "ctr" : d.algn === "r" ? "r" : (d.algn === "just", "l"), level: h };
    if (d.bullet === "char" || d.bullet === "num") {
      if (m.bullet = d.bullet, m.marL = d.marL ?? 0, m.indent = d.indent ?? 0, d.bullet === "char") {
        const P = We(d.buChar, d.buFont ?? void 0);
        P !== "•" && (m.bulletChar = P);
      } else
        d.numType && d.numType !== "arabicPeriod" && (m.numType = d.numType), d.startAt && d.startAt !== 1 && (m.startAt = d.startAt);
      d.buClr && (m.bulletColor = d.buClr), d.buSz && Math.abs(d.buSz - 1) > 1e-3 && (m.bulletScale = d.buSz);
    }
    const w = (P) => {
      const E = Wt(d, se(P, e)), X = (E.sz ?? 18 * Tt / z) * a, H = E.color === null ? void 0 : E.color ?? re("tx1", e);
      return {
        text: "",
        size: X,
        bold: E.b || void 0,
        italic: E.i || void 0,
        underline: E.u || void 0,
        strike: E.strike || void 0,
        color: H ?? void 0,
        font: _e(E.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const P of N(b))
      if (P.localName === "r" || P.localName === "fld") {
        const E = A(P, "t")?.textContent ?? "";
        if (!E) continue;
        E.split(/[\v\n]/).forEach((X, H) => {
          H > 0 && m.runs.push({ ...w(c(P, "rPr")), br: !0 }), X && m.runs.push({ ...w(c(P, "rPr")), text: X });
        });
      } else P.localName === "br" && m.runs.push({ ...w(c(P, "rPr")), br: !0 });
    m.endSize = w(c(b, "endParaRPr")).size;
    const M = (m.runs.length ? Math.max(...m.runs.map((P) => P.size ?? 0)) : m.endSize ?? 0) * 1.2 * (d.lnSpcPct ?? 1), S = (P) => P ? ("px" in P ? P.px : P.lines * M) * i : 0, v = S(d.spcBef), I = S(d.spcAft);
    v > 0.05 && (m.spaceBefore = Math.round(v * 100) / 100), I > 0.05 && (m.spaceAfter = Math.round(I * 100) / 100), u.push(m);
  }
  return {
    paragraphs: u,
    anchor: p,
    insets: { l: l("lIns", 91440), t: l("tIns", 45720), r: l("rIns", 91440), b: l("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: g
  };
}
const re = (t, n) => {
  const e = n.ctx.clrMap[t] ?? It[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, Q = (t) => {
  const n = c(t, "ph");
  return n ? { type: k(n, "type") || "obj", idx: C(n, "idx") } : null;
}, st = (t) => c(N(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), it = /* @__PURE__ */ new Set(["title", "ctrTitle"]), _t = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Ut = (t, n) => t === n || it.has(t) && it.has(n) || !_t.has(t) && !_t.has(n);
function ht(t, n) {
  const e = Ue(t);
  if (n.idx) {
    const o = e.find((s) => s.ph.idx === n.idx && Ut(s.ph.type, n.type));
    if (o) return o.el;
  }
  return (e.find((o) => o.ph.type === n.type && (o.ph.idx === n.idx || !n.idx || it.has(n.type))) ?? e.find((o) => o.ph.type === n.type) ?? e.find((o) => Ut(o.ph.type, n.type)))?.el ?? null;
}
function Ue(t) {
  const n = [];
  for (const e of V(t)) {
    const o = Q(st(e));
    o && n.push({ el: e, ph: o });
  }
  return n;
}
const ae = (t) => it.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", Ge = (t) => {
  const n = {};
  for (const e of N(c(t, "avLst"), "gd")) {
    const o = k(e, "name"), s = k(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function Ve(t) {
  const n = (r) => N(r, "gd").slice(0, 1e4).map((a) => [k(a, "name") || "", k(a, "fmla") || "val 0"]), e = N(c(t, "cxnLst"), "cxn").map((r) => [k(r, "ang") || "0", k(c(r, "pos"), "x") || "0", k(c(r, "pos"), "y") || "0"]), o = c(t, "rect"), s = N(c(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const l of N(r)) {
      const p = N(l, "pt").map((x) => [k(x, "x") || "0", k(x, "y") || "0"]).flat();
      switch (l.localName) {
        case "moveTo":
          a.push(["M", ...p]);
          break;
        case "lnTo":
          a.push(["L", ...p]);
          break;
        case "quadBezTo":
          a.push(["Q", ...p]);
          break;
        case "cubicBezTo":
          a.push(["C", ...p]);
          break;
        case "arcTo":
          a.push(["A", k(l, "wR") || "0", k(l, "hR") || "0", k(l, "stAng") || "0", k(l, "swAng") || "0"]);
          break;
        case "close":
          a.push(["Z"]);
          break;
      }
    }
    const i = k(r, "fill");
    return { w: C(r, "w") || void 0, h: C(r, "h") || void 0, fill: i && i !== "norm" ? i : void 0, stroke: B(r, "stroke") === !1 ? !1 : void 0, d: a };
  });
  return {
    av: N(c(t, "avLst"), "gd").map((r) => [k(r, "name") || "", k(r, "fmla") || "val 0"]),
    gd: n(c(t, "gdLst")),
    cxn: e,
    rect: o ? [k(o, "l") || "l", k(o, "t") || "t", k(o, "r") || "r", k(o, "b") || "b"] : null,
    paths: s
  };
}
function rt(t, n) {
  const e = c(t, "prstGeom");
  if (e) {
    const s = {};
    for (const [r, a] of Object.entries(Ge(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (s[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: k(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = c(t, "custGeom");
  if (o) {
    const s = Ve(o);
    return { geom: { kind: "custom", paths: ut(s, n.w, n.h) }, textRect: s.rect ? te(s, n.w, n.h) : void 0 };
  }
}
function at(t, n, e, o, s, r) {
  const a = [];
  if (s > Ae)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of V(t)) {
    if (++e.count > Le) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const l = Ke(i, n, e, o, s, r);
      l && a.push(...Array.isArray(l) ? l : [l]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
}
const qe = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function Ze(t, n, e) {
  const o = c(t, "hlinkClick");
  if (!o) return;
  const s = k(o, "action") || "", r = e.rels(n).get(k(o, "r:id") || "");
  if (s.startsWith("ppaction://hlinkshowjump")) {
    const a = qe[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return a ? { kind: "action", action: a } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function Ke(t, n, e, o, s, r) {
  const a = N(t).find((p) => p.localName.startsWith("nv")), i = Qe(t, n, e, o, s, r), l = i ? Ze(c(a ?? null, "cNvPr"), n.part, e.pkg) : void 0;
  if (l) for (const p of Array.isArray(i) ? i : [i]) p.link = l;
  return i;
}
function Qe(t, n, e, o, s, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = N(t).find((u) => u.localName.startsWith("nv")), l = c(i ?? null, "cNvPr"), p = C(l, "id"), x = k(l, "name") || t.localName;
  if (k(l, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return en(t, n, e, o, p, x, r);
    case "cxnSp": {
      const u = c(t, "spPr"), g = W(c(u, "xfrm"));
      if (!g) return null;
      const b = o(g), f = c(t, "style"), h = G(c(u, "ln"), a) ?? Ot(f, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!h) return null;
      const y = rt(u, b) ?? { geom: { kind: "preset", prst: "line" } }, d = (w) => w ? { id: C(w, "id"), idx: C(w, "idx") } : void 0, m = c(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: p, name: x, ...b, geom: y.geom, line: h, start: d(c(m, "stCxn")), end: d(c(m, "endCxn")) };
    }
    case "pic": {
      const u = c(t, "spPr");
      let g = W(c(u, "xfrm"));
      const b = Q(c(i ?? null, "nvPr"));
      if (!g && b && (g = Je(b, e)), !g) return null;
      const f = c(t, "blipFill"), h = f ? ne(f, a) : null;
      if (!h)
        return e.warnings.push(`Picture "${x}" has no image the importer can read.`), null;
      const y = c(f, "srcRect"), d = y ? { l: C(y, "l") / 1e5, t: C(y, "t") / 1e5, r: C(y, "r") / 1e5, b: C(y, "b") / 1e5 } : void 0, m = k(A(f, "blip", "alphaModFix"), "amt"), w = o(g), M = rt(u, w)?.geom, S = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: p, name: x, ...w, media: h, crop: d, alpha: m !== null ? Number(m) / 1e5 : void 0, descr: k(l, "descr") || void 0, geom: S, ...A(f, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const u = c(t, "grpSpPr"), g = c(u, "xfrm"), b = Xe(g, o), f = at(t, n, e, b, s + 1, r);
      if (!f.length) return null;
      const h = pt(f);
      return { kind: "group", id: p, name: x, ...h, children: f };
    }
    case "graphicFrame":
      return sn(t, n, e, o, p, x, s);
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
function Je(t, n) {
  const e = ht(n.layout?.tree ?? null, t), o = W(A(e, "spPr", "xfrm"));
  if (o) return o;
  const s = ht(n.master?.tree ?? null, { type: ae(t.type), idx: 0 });
  return W(A(s, "spPr", "xfrm"));
}
function tn(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function en(t, n, e, o, s, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, l = st(t), p = Q(l);
  if (p && !a) return null;
  const x = c(t, "spPr"), u = c(t, "style"), g = k(A(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", b = p && e.layout ? ht(e.layout.tree, p) : null, f = p && e.master ? ht(e.master.tree, { type: ae(b ? Q(st(b))?.type ?? p.type : p.type), idx: 0 }) : null, h = b && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, y = f && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let d = W(c(x, "xfrm")) ?? W(A(b, "spPr", "xfrm")) ?? W(A(f, "spPr", "xfrm"));
  if (!d) return null;
  d = o(d);
  const m = rt(x, d) ?? (b ? rt(c(b, "spPr"), d) : void 0) ?? (f ? rt(c(f, "spPr"), d) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (B(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? q(x, i) ?? dt(u, i) ?? (h ? q(c(b, "spPr"), h) : void 0) ?? (y ? q(c(f, "spPr"), y) : void 0) ?? (h ? dt(c(b, "style"), h) : void 0) ?? { kind: "none" }, S = tn(
    () => G(c(x, "ln"), i),
    () => Ot(u, i),
    () => h ? G(A(b, "spPr", "ln"), h) : void 0,
    () => y ? G(A(f, "spPr", "ln"), y) : void 0
  ) ?? null, v = [];
  if (p) {
    const O = b ? Q(st(b))?.type ?? p.type : p.type;
    v.push(it.has(O) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(O) ? e.masterTx.body : e.masterTx.other), v.push(A(f, "txBody", "lstStyle"), A(b, "txBody", "lstStyle"));
  } else
    v.push(e.defaultText);
  const I = c(u, "fontRef"), P = {
    levels: v,
    bodyPr: [A(f, "txBody", "bodyPr"), A(b, "txBody", "bodyPr")],
    fontRef: I ? { font: k(I, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: j(I, i.ctx) } : void 0
  }, E = At(c(t, "txBody"), P, i);
  if (!(M.kind !== "none" || !!S || !!E)) return null;
  let H = m.textRect;
  const T = W(c(x, "xfrm")), L = E ? W(c(t, "txXfrm")) : null;
  if (L && T && T.w > 0 && T.h > 0) {
    const O = d.w / T.w, Y = d.h / T.h, D = { l: (L.x - T.x) * O, t: (L.y - T.y) * Y, r: (L.x + L.w - T.x) * O, b: (L.y + L.h - T.y) * Y };
    (Math.abs(D.l) > 0.5 || Math.abs(D.t) > 0.5 || Math.abs(D.r - d.w) > 0.5 || Math.abs(D.b - d.h) > 0.5) && (H = D);
  }
  return { kind: "shape", id: s, name: r, ...d, geom: m.geom, fill: M, line: S, text: E, textBox: g || void 0, textRect: H };
}
const Gt = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function nn(t, n) {
  const e = {};
  if (!t) return e;
  const o = c(t, "tcStyle"), s = c(t, "tcTxStyle"), r = c(o, "fill"), a = r ? q(r, n) : dt(o, n);
  a && (e.fill = a);
  const i = j(s, n.ctx) ?? j(c(s, "fontRef"), n.ctx);
  i && (e.text = i), k(s, "b") === "on" && (e.bold = !0);
  const l = c(o, "tcBdr");
  for (const p of ["insideH", "bottom", "top", "left"]) {
    const x = c(l, p);
    if (!x) continue;
    const u = G(c(x, "ln"), n) ?? Ot(x, n);
    if (u !== void 0) {
      e.border = u;
      break;
    }
  }
  return e;
}
function on(t, n, e) {
  const o = ((c(t, "tableStyleId")?.textContent || "").trim() || k(e, "def") || Gt).toUpperCase(), s = (u) => B(t, u) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, a = N(e, "tblStyle").find((u) => (k(u, "styleId") || "").toUpperCase() === o);
  if (a) {
    const u = (y) => nn(c(a, y), n), g = c(a, "tblBg"), b = g ? c(g, "fill") ? q(c(g, "fill"), n) : dt(g, n) : void 0, f = {
      whole: u("wholeTbl"),
      b1H: u("band1H"),
      b2H: u("band2H"),
      b1V: u("band1V"),
      b2V: u("band2V"),
      firstRow: u("firstRow"),
      lastRow: u("lastRow"),
      firstCol: u("firstCol"),
      lastCol: u("lastCol")
    }, h = (y, d, m, w) => {
      const M = [f.whole], S = y - (r.firstRow ? 1 : 0), v = d - (r.firstCol ? 1 : 0);
      r.bandCol && v >= 0 && M.push(v % 2 === 0 ? f.b1V : f.b2V), r.bandRow && S >= 0 && M.push(S % 2 === 0 ? f.b1H : f.b2H), r.firstCol && d === 0 && M.push(f.firstCol), r.lastCol && d === w - 1 && M.push(f.lastCol), r.firstRow && y === 0 && M.push(f.firstRow), r.lastRow && y === m - 1 && M.push(f.lastRow);
      const I = {};
      for (const P of M)
        P.fill && (I.fill = P.fill), P.text && (I.text = P.text), P.bold && (I.bold = !0), P.border !== void 0 && (I.border = P.border);
      return I;
    };
    return b && b.kind !== "none" && (h.background = b), h;
  }
  if (o !== Gt) return null;
  const i = n.ctx.theme.colors.accent1 ?? "#4472c4", l = (u) => {
    const [g, b, f] = ee(i);
    return { hex: ft(U(ot(g) * u + (1 - u)), U(ot(b) * u + (1 - u)), U(ot(f) * u + (1 - u))) };
  }, p = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, x = re("tx1", n) ?? void 0;
  return (u) => {
    const g = r.firstRow && u === 0, b = r.bandRow && !g && (u - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: g ? { hex: i } : l(b ? 0.4 : 0.2) },
      text: g ? p : x,
      bold: g || void 0,
      border: { width: 1.33, color: p }
    };
  };
}
function sn(t, n, e, o, s, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, l = W(c(t, "xfrm"));
  if (!l) return null;
  const p = A(t, "graphic", "graphicData"), x = c(p, "tbl");
  if (x) {
    const b = N(c(x, "tblGrid"), "gridCol").map((w) => R(C(w, "w"))), f = on(c(x, "tblPr"), i, e.tableStyles), h = [];
    let y = l.y, d = 1e6 + s * 1e3;
    const m = N(x, "tr");
    if (m.forEach((w, M) => {
      const S = R(C(w, "h"));
      let v = l.x, I = 0;
      for (const P of N(w, "tc")) {
        const E = Math.max(1, C(P, "gridSpan", 1)), X = b.slice(I, I + E).reduce((tt, K) => tt + K, 0);
        if (I += E, B(P, "hMerge") || B(P, "vMerge")) {
          v += X;
          continue;
        }
        const H = Math.max(1, C(P, "rowSpan", 1)), T = c(P, "tcPr"), L = H > 1 ? S * H : S, O = f ? f(M, I - E, m.length, b.length) : null, Y = O?.text ? { color: O.text } : void 0, D = At(c(P, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: Y }, i);
        D && O?.bold && D.paragraphs.forEach((tt) => tt.runs.forEach((K) => {
          K.bold === void 0 && (K.bold = !0);
        })), D && (D.insets = { l: R(C(T, "marL", 91440)), r: R(C(T, "marR", 91440)), t: R(C(T, "marT", 45720)), b: R(C(T, "marB", 45720)) }, D.anchor = k(T, "anchor") === "ctr" ? "ctr" : k(T, "anchor") === "b" ? "b" : "t");
        const _ = G(c(T, "lnB"), i) ?? G(c(T, "lnT"), i) ?? (O ? O.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), Z = O?.fill;
        h.push({
          kind: "shape",
          id: d++,
          name: `${r} cell`,
          ...o({ x: v, y, w: X, h: L, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: q(T, i) ?? Z ?? { kind: "none" },
          line: _,
          text: D
        }), v += X;
      }
      y += S;
    }), !h.length) return null;
    if (f?.background) {
      const w = pt(h);
      h.unshift({
        kind: "shape",
        id: d++,
        name: `${r} background`,
        x: w.x,
        y: w.y,
        w: w.w,
        h: w.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: f.background,
        line: null
      });
    }
    return { kind: "group", id: s, name: r, ...pt(h), children: h };
  }
  const u = k(p, "uri") || "";
  if (/diagram/.test(u)) {
    const b = rn(p, n, e, o, l, s, r, a);
    if (b) return b;
    const f = an(p, n, e, o, l, s, r, i);
    if (f) return f;
  }
  const g = /chart/.test(u) ? "Chart" : /diagram/.test(u) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${g} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(l),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${g}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function rn(t, n, e, o, s, r, a, i) {
  const l = e.pkg.rels(n.part), p = k(c(t, "relIds"), "r:dm"), x = p ? l.get(p) : void 0;
  let u;
  if (x && !x.external) {
    const d = lt(e.pkg.xml(x.target), "dataModelExt", 6), m = d ? l.get(k(d, "relId") || "") : void 0;
    m && !m.external && (u = m.target);
  }
  if (!u) {
    const d = [...l.values()].filter((m) => m.type === "diagramDrawing" && !m.external);
    d.length === 1 && (u = d[0].target);
  }
  if (!u) return null;
  const g = c(e.pkg.xml(u), "spTree");
  if (!g) return null;
  const f = at(g, { part: u, tree: g }, e, (d) => o({ ...d, x: d.x + s.x, y: d.y + s.y }), i + 1, !0);
  if (!f.length) return null;
  let h = 2e6 + r * 1e3;
  const y = (d) => d.forEach((m) => {
    m.id = h++, m.kind === "group" && y(m.children);
  });
  return y(f), { kind: "group", id: r, name: a, ...pt(f), children: f };
}
function an(t, n, e, o, s, r, a, i) {
  const l = k(c(t, "relIds"), "r:dm"), p = l ? e.pkg.rels(n.part).get(l) : void 0;
  if (!p || p.external) return null;
  const x = e.pkg.xml(p.target), u = /* @__PURE__ */ new Map();
  for (const d of N(c(x, "ptLst"), "pt")) u.set(k(d, "modelId") || "", d);
  const g = /* @__PURE__ */ new Map();
  for (const d of N(c(x, "cxnLst"), "cxn")) {
    if ((k(d, "type") || "parOf") !== "parOf") continue;
    const m = k(d, "srcId") || "", w = k(d, "destId") || "";
    g.has(m) || g.set(m, []), g.get(m).push({ id: w, ord: C(d, "srcOrd") });
  }
  const b = [...u.values()].find((d) => k(d, "type") === "doc");
  if (!b) return null;
  const f = [], h = /* @__PURE__ */ new Set(), y = (d, m) => {
    if (!(h.has(d) || m > 16 || f.length > 500)) {
      h.add(d);
      for (const w of (g.get(d) ?? []).sort((M, S) => M.ord - S.ord)) {
        const M = u.get(w.id), S = k(M, "type") || "node";
        if (!M || S !== "node" && S !== "asst") continue;
        const v = At(c(M, "t"), { levels: [e.defaultText], bodyPr: [] }, i);
        for (const I of v?.paragraphs ?? [])
          I.runs.some((P) => !P.br && P.text.trim()) && f.push({
            ...I,
            align: "l",
            level: m,
            ...m > 0 ? { bullet: "char" } : {},
            runs: I.runs.map((P) => ({ ...P, size: P.size ?? (m > 0 ? 16 : 18), bold: P.bold ?? (m === 0 ? !0 : void 0) }))
          });
        y(w.id, m + 1);
      }
    }
  };
  return y(k(b, "modelId") || "", 0), f.length ? (e.warnings.push(`SmartArt diagram "${a}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: r,
    name: a,
    ...o(s),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: f, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function lt(t, n, e) {
  if (!t || e < 0) return null;
  for (const o of V(t)) {
    if (o.localName === n) return o;
    const s = lt(o, n, e - 1);
    if (s) return s;
  }
  return null;
}
function kt(t, n) {
  const e = c(t, "bg");
  if (!e) return;
  const o = c(e, "bgPr");
  if (o)
    return q(o, n);
  const s = c(e, "bgRef");
  if (s) {
    const r = C(s, "idx"), i = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (i ? Nt(i, { ...n, ctx: { ...n.ctx, phClr: j(s, n.ctx) ?? void 0 } }) : void 0) ?? (j(s, n.ctx) ? { kind: "solid", color: j(s, n.ctx) } : void 0);
  }
}
function ln(t, n) {
  const e = t.relOfType(n, "notesSlide"), o = e ? A(t.xml(e), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (i) => {
    for (const l of V(i)) {
      if (l.localName === "grpSp") {
        r(l);
        continue;
      }
      if (l.localName !== "sp") continue;
      const p = Q(st(l));
      if (!(!p || p.type !== "body" && p.type !== "obj"))
        for (const x of N(c(l, "txBody"), "p")) {
          let u = "";
          for (const g of N(x))
            g.localName === "r" || g.localName === "fld" ? u += c(g, "t")?.textContent ?? "" : g.localName === "br" && (u += `
`);
          s.push(u);
        }
    }
  };
  r(o);
  const a = s.join(`
`).replace(/\s+$/, "");
  return a.trim() ? a : void 0;
}
function cn(t) {
  for (const a of N(t, "AlternateContent"))
    for (const i of N(a, "Choice")) {
      const l = c(i, "transition");
      if (l && c(l, "morph")) {
        const p = k(l, "spd");
        return { kind: "morph", durationMs: k(l, "p14:dur") !== null ? C(l, "p14:dur") : p === "fast" ? 500 : p === "slow" ? 1e3 : 750 };
      }
    }
  const n = V(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = N(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!e) return;
  const o = k(n, "spd"), s = k(n, "p14:dur") !== null ? C(n, "p14:dur") : o === "fast" ? 500 : o === "slow" ? 1e3 : 750, r = k(e, "dir");
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
function fn(t, n) {
  const e = A(t, "timing", "tnLst");
  if (!e) return [];
  const o = [];
  let s = 0;
  const r = [], a = (i, l) => {
    if (!(l > 40))
      for (const p of V(i)) {
        if (p.localName === "seq") {
          const x = c(p, "cTn"), u = k(x, "nodeType");
          if (u && u !== "mainSeq") {
            s++;
            continue;
          }
        }
        if (p.localName === "cTn" && k(p, "presetClass")) {
          r.push(p);
          continue;
        }
        a(p, l + 1);
      }
  };
  a(e, 0);
  for (const i of r) {
    const l = k(i, "presetClass");
    if (l !== "entr" && l !== "exit" && l !== "emph") {
      s++;
      continue;
    }
    const p = C(i, "presetID"), x = C(i, "presetSubtype"), u = k(i, "nodeType"), g = u === "clickEffect" ? "click" : u === "afterEffect" ? "after" : "with", b = Number(k(A(i, "stCondLst", "cond"), "delay")), f = vt(c(i, "childTnLst"), "cBhvr", 4), h = f.map((I) => lt(I, "spTgt", 2)).find(Boolean), y = h ? C(h, "spid") : NaN;
    if (!Number.isFinite(y) || lt(h, "txEl", 1)) {
      s++;
      continue;
    }
    const d = f.map((I) => Number(k(c(I, "cTn"), "dur"))).filter((I) => Number.isFinite(I) && I > 1), m = d.length ? Math.max(...d) : 500, { effect: w, known: M } = me(l, p);
    M || n(`An animation PowerPoint calls preset ${p} (${l}) came in as a plain ${w}.`);
    const S = vt(c(i, "childTnLst"), "animRot", 2)[0], v = k(i, "repeatCount");
    o.push({
      target: y,
      cls: l,
      effect: w,
      presetId: p,
      subtype: x,
      start: g,
      durationMs: m,
      delayMs: Number.isFinite(b) ? Math.max(0, b) : 0,
      ...Ft(x) && (w === "fly" || w === "wipe") && { dir: Ft(x) },
      ...w === "spin" && S && { degrees: C(S, "by") / 6e4 },
      ...v === "indefinite" ? { repeat: -1 } : v && Number(v) > 1e3 ? { repeat: Math.round(Number(v) / 1e3) } : {}
    });
  }
  return s && n(`${s} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), o;
}
function vt(t, n, e) {
  if (!t || e < 0) return [];
  const o = [];
  for (const s of V(t))
    s.localName === n ? o.push(s) : o.push(...vt(s, n, e - 1));
  return o;
}
function Vt(t) {
  const n = V(t).find((s) => s.localName === "transition"), e = n ? k(n, "advTm") : null, o = e !== null ? Number(e) : NaN;
  return Number.isFinite(o) && o > 0 ? o : void 0;
}
function un(t, n) {
  const e = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of N(c(t, "sldIdLst"), "sldId")) {
    const a = n.get(k(r, "r:id") || ""), i = k(r, "id");
    a && i && o.set(i, a.target);
  }
  const s = lt(c(t, "extLst"), "sectionLst", 4);
  for (const r of N(s, "section")) {
    const a = (k(r, "name") || "").trim(), i = N(c(r, "sldIdLst"), "sldId")[0], l = i ? o.get(k(i, "id") || "") : void 0;
    a && l && !e.has(l) && e.set(l, a);
  }
  return e;
}
function dn(t, n = {}) {
  const e = [], o = (T) => {
    e.length < 200 && !e.includes(T) && e.push(T);
  }, s = n.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = he(t, {
      filter: (T) => (a++, i += T.originalSize, a <= Bt && T.originalSize <= Ne && i <= zt)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > Bt || i > zt) && o("The file is very large; some parts were skipped.");
  const l = new Fe(r, s, o), p = l.relOfType("", "officeDocument") ?? "ppt/presentation.xml", x = l.xml(p);
  if (!x || x.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const u = c(x, "sldSz"), g = u ? Math.max(1, R(C(u, "cx", 9144e3))) : 960, b = u ? Math.max(1, R(C(u, "cy", 5143500))) : 540, f = c(x, "defaultTextStyle"), h = l.rels(p), y = l.relOfType(p, "tableStyles"), d = y ? l.xml(y) : null, m = [], w = /* @__PURE__ */ new Set();
  for (const T of N(c(x, "sldIdLst"), "sldId")) {
    const L = h.get(k(T, "r:id") || "");
    L && !w.has(L.target) && m.length < Oe && (w.add(L.target), m.push(L.target));
  }
  const M = /* @__PURE__ */ new Map(), S = (T) => {
    const L = l.relOfType(T, "theme");
    return L ? (M.has(L) || M.set(L, xt(l.xml(L))), M.get(L)) : xt(null);
  }, v = (T) => {
    if (!T) return null;
    const L = {};
    for (let O = 0; O < T.attributes.length; O++) L[T.attributes[O].localName ?? T.attributes[O].name] = T.attributes[O].value;
    return L;
  }, I = un(x, h), P = [];
  m.forEach((T, L) => {
    const O = l.xml(T);
    if (!O) {
      o(`Slide ${L + 1} couldn't be read and was skipped.`);
      return;
    }
    const Y = l.relOfType(T, "slideLayout"), D = Y ? l.xml(Y) : null, _ = Y ? l.relOfType(Y, "slideMaster") : null, Z = _ ? l.xml(_) : null, tt = _ ? S(_) : xt(null), K = v(A(O, "clrMapOvr", "overrideClrMapping")) ?? v(A(D, "clrMapOvr", "overrideClrMapping")) ?? v(c(Z, "clrMap")) ?? It, Lt = { theme: tt, clrMap: K }, mt = c(Z, "txStyles"), $ = {
      pkg: l,
      ctx: Lt,
      slide: { part: T, tree: A(O, "cSld", "spTree") },
      layout: Y ? { part: Y, tree: A(D, "cSld", "spTree") } : null,
      master: _ ? { part: _, tree: A(Z, "cSld", "spTree") } : null,
      masterTx: { title: c(mt, "titleStyle"), body: c(mt, "bodyStyle"), other: c(mt, "otherStyle") },
      defaultText: f,
      warnings: e,
      count: 0,
      tableStyles: d
    }, gt = (de) => ({ pkg: l, part: de?.part ?? T, ctx: Lt }), Et = kt(c(O, "cSld"), gt($.slide)) ?? kt(c(D, "cSld"), gt($.layout)) ?? kt(c(Z, "cSld"), gt($.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    $.background = Et;
    const ct = [], ue = B(O, "showMasterSp") !== !1 && B(D, "showMasterSp") !== !1;
    $.master && ue && ct.push(...at($.master.tree, $.master, $, yt, 0, !1)), $.layout && B(O, "showMasterSp") !== !1 && ct.push(...at($.layout.tree, $.layout, $, yt, 0, !1)), ct.push(...at($.slide.tree, $.slide, $, yt, 0, !0)), P.push({
      items: ct,
      background: Et,
      transition: cn(O),
      name: k(c(O, "cSld"), "name") || void 0,
      notes: ln(l, T),
      key: T,
      ...k(O, "show") === "0" && { hidden: !0 },
      ...Vt(O) && { advanceAfterMs: Vt(O) },
      ...I.has(T) && { section: I.get(T) }
    });
    const Rt = fn(O, o);
    Rt.length && (P[P.length - 1].anims = Rt);
  }), P.length || o("The presentation has no slides.");
  const E = A(l.xml("docProps/core.xml"), "title")?.textContent || void 0, X = l.relOfType(p, "presProps"), H = k(c(X ? l.xml(X) : null, "showPr"), "loop");
  return { deck: { width: g, height: b, slides: P, title: E, ...(H === "1" || H === "true") && { loop: !0 } }, warnings: e };
}
const hn = 80, pn = "default-layer", F = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, mn = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, gn = /(courier|consolas|mono|menlo|code)/i;
function qt(t) {
  if (!t) return "sans-serif";
  const n = we(t);
  return n || (gn.test(t) ? "monospace" : mn.test(t) ? "serif" : "sans-serif");
}
function xn(t) {
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
const bn = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
function yn(t, n, e) {
  let o = !1;
  t.forEach((s, r) => {
    s.start === "click" && (o = !0);
    const a = n.itemEls?.get(s.target);
    if (!a?.length) {
      n.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    a.forEach((i, l) => {
      const p = ge(l === 0 ? s : { ...s, start: "with", delayMs: s.delayMs }, e("anim"), !o);
      p.order = r + l / (a.length + 1), (i.animations ??= []).push(p);
    });
  });
}
function kn(t, n) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return ye(t.action);
  const e = n.slideIds?.get(t.key);
  return e ? ke(e) : null;
}
async function wn(t) {
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
async function Mn(t, n) {
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
    const a = await wn(r);
    a && s.set(r, a);
  })), s;
}
async function vn(t, n, e, o) {
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
function J(t, n, e, o) {
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
    layerId: pn,
    groupIds: [...o].reverse(),
    // innermost first, the store's convention
    name: e.name
  };
}
function Zt(t, n, e) {
  switch (n.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = F(n.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = n.kind, t.backgroundColor = F(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: F(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
      break;
    case "pattern": {
      t.backgroundColor = F(n.color), t.fillStyle = "pattern", t.patternFill = Rn(n.preset, F(n.color), n.bg ? F(n.bg) : "transparent");
      break;
    }
    case "image": {
      const o = e.images.get(n.media);
      o && (t.fillStyle = "image", t.backgroundImage = n.grayscale && e.gray.get(o.url) || o.url, t.backgroundColor = "#ffffff"), o && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
      break;
    }
  }
}
function St(t, n) {
  if (!n || !(n.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = F(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function Sn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function Cn(t, n) {
  const e = t.bullet === "num" ? Sn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && F(t.bulletColor) !== F(o) && (e.listMarkerColor = F(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const wt = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function ie(t, n) {
  const e = t.paragraphs.flatMap((h) => h.runs.filter((y) => !y.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (h) => h.runs.reduce((y, d) => y + (d.br ? 0 : d.text.trim().length), 0);
  for (const h of t.paragraphs) {
    const y = a(h);
    y && r.set(h.align ?? "l", (r.get(h.align ?? "l") ?? 0) + y);
  }
  const i = [...r].sort((h, y) => y[1] - h[1])[0]?.[0] ?? t.paragraphs.find((h) => h.runs.length)?.align ?? "l", l = (h) => a(h) > 0 && (h.align ?? "l") !== i ? h.align === "ctr" ? "center" : h.align === "r" ? "right" : "left" : void 0, p = e.every((h) => h.size === o?.size && h.bold === o?.bold && h.italic === o?.italic && h.underline === o?.underline && h.strike === o?.strike && h.font === o?.font && F(h.color) === F(o?.color)) && !t.paragraphs.some((h) => h.bullet) && !t.paragraphs.some((h, y) => y > 0 && wt(t, y) > 0) && !t.paragraphs.some(l), x = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: qt(o?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: F(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (x.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const u = t.paragraphs.map((h) => h.runs.map((y) => y.br ? `
` : y.text).join("")).join(`
`);
  if (p)
    return o?.bold && (x.fontWeight = 700), o?.italic && (x.fontStyle = "italic"), n ? x.containerText = u : x.text = u, { fields: x, rich: !1 };
  const g = [], b = [], f = [];
  return t.paragraphs.forEach((h, y) => {
    const d = h.level ?? 0;
    if (h.bullet === "num") {
      const M = h.numType ?? "arabicPeriod";
      (b[d] === void 0 || f[d] !== M) && (b[d] = (h.startAt ?? 1) - 1), b[d]++, f[d] = M, b.length = d + 1, f.length = d + 1;
    } else
      b.length = Math.min(b.length, d), f.length = b.length;
    const m = h.bullet ? { listType: h.bullet === "num" ? "ordered" : "bullet", listLevel: d, ...Cn(h, t) } : {};
    h.bullet === "num" && (m.listIndex = b[d]), (h.runs.length ? h.runs : [{ text: "" }]).forEach((M, S) => {
      const v = { text: M.br ? `
` : M.text, ...S === 0 ? m : {} };
      S === 0 && y > 0 && wt(t, y) > 0 && (v.paragraphSpaceBefore = wt(t, y));
      const I = l(h);
      I && (v.paragraphAlign = I), M.bold && (v.bold = !0), M.italic && (v.italic = !0), M.underline && (v.underline = !0), M.strike && (v.strikethrough = !0), M.color && (v.color = F(M.color)), M.size && (v.fontSize = Math.round(M.size * 10) / 10), M.font && (v.fontFamily = qt(M.font)), g.push(v);
    }), y < t.paragraphs.length - 1 && g.push({ text: `
` });
  }), n ? (x.richContainerText = g, x.containerText = u) : (x.richText = g, x.text = u), { fields: x, rich: !0 };
}
function Mt(t, n, e, o, s) {
  const { fields: r, rich: a } = ie(n, !1), i = 4, l = J(t, a ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - i,
    y: e.y + n.insets.t - i,
    w: Math.max(e.w - n.insets.l - n.insets.r + i * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + i * 2, 8)
  }, o);
  return Object.assign(l, r, { autoResize: !n.wrap, strokeColor: r.textColor }), l;
}
const le = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function ce(t, n, e) {
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return n.stats.elements++, [Mt(n, t.text, t, e)];
  if (o.kind === "preset" && le.has(o.prst)) return Ct({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((u) => !u.cmds.some((g) => g.op === "Z")))
    return Ct({ ...t, kind: "connector", line: t.line }, n, e);
  const s = Tn(t);
  if (s) {
    const u = J(n, s.type, t, e);
    Object.assign(u, s.extra), Zt(u, t.fill, n), St(u, t.line), n.byPptId.set(t.id, { el: u, item: t }), n.stats.elements++;
    const g = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, b = t.text?.insets, f = Math.abs(g.l) > 0.5 || Math.abs(g.t) > 0.5 || Math.abs(g.r - t.w) > 0.5 || Math.abs(g.b - t.h) > 0.5, h = !!b && Math.max(b.l, b.r, b.t, b.b) > 16;
    if (t.text && (f || h)) {
      const y = n.nextId("group");
      return u.groupIds = [...e, y].reverse(), n.stats.elements++, [u, Mt(n, t.text, { ...t, rot: 0, x: t.x + g.l, y: t.y + g.t, w: g.r - g.l, h: g.b - g.t }, [...e, y])];
    }
    if (t.text) {
      const { fields: y } = ie(t.text, !0);
      Object.assign(u, y);
    }
    return [u];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const u = n.presets[o.prst];
    if (!u)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), ut(n.presets.rect, t.w, t.h);
    const g = Object.fromEntries(Object.entries(o.adj ?? {}).map(([b, f]) => [b, `val ${f}`]));
    return ut(u, t.w, t.h, g);
  })(), a = [], i = (t.text || r.some((u) => u.fill === !1)) && r.some((u) => u.fill !== !1) ? n.nextId("group") : null, l = i ? [...e, i] : e, p = /* @__PURE__ */ new Map();
  for (const u of r) {
    const g = `${u.fill === !1 ? "nofill" : "fill"}|${u.stroke === !1 ? "nostroke" : "stroke"}`;
    p.has(g) || p.set(g, []), p.get(g).push(u);
  }
  let x = null;
  for (const [u, g] of p) {
    const b = g.flatMap((m) => m.cmds), f = xe(b);
    if (!f) continue;
    const h = xn(bn(b, -f.minX, -f.minY));
    if (!h.length) continue;
    const y = J(n, "path", { ...t, x: t.x + f.minX, y: t.y + f.minY, w: Math.max(f.maxX - f.minX, 1), h: Math.max(f.maxY - f.minY, 1) }, l);
    !(Math.abs(f.minX + f.maxX - t.w) < 0.5 && Math.abs(f.minY + f.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && Pn(y, h, t, f), y.pathSubpaths = h, y.pathAnchors = h[0].anchors, y.pathClosed = h[0].closed, u.startsWith("fill") ? Zt(y, t.fill, n) : y.backgroundColor = "transparent", u.endsWith("|stroke") ? St(y, t.line) : (y.strokeColor = "transparent", y.strokeWidth = 0), a.push(y), x ??= y, n.stats.paths++;
  }
  if (x && n.byPptId.set(t.id, { el: x, item: t }), t.text) {
    const u = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? te(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(Mt(n, t.text, { ...t, x: t.x + u.l, y: t.y + u.t, w: u.r - u.l, h: u.b - u.t }, l));
  }
  return n.stats.elements += a.length, a;
}
function Pn(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), l = Math.sin(a), p = e.flipH ? -1 : 1, x = e.flipV ? -1 : 1, u = (d, m) => {
    const w = (d + o.minX - s) * p, M = (m + o.minY - r) * x;
    return { x: s + w * i - M * l, y: r + w * l + M * i };
  }, g = (d, m) => {
    const w = d * p, M = m * x;
    return { x: w * i - M * l, y: w * l + M * i };
  };
  let b = 1 / 0, f = 1 / 0, h = -1 / 0, y = -1 / 0;
  for (const d of n) for (const m of d.anchors) {
    const w = u(m.x, m.y);
    if (m.x = w.x, m.y = w.y, m.inX !== void 0) {
      const M = g(m.inX, m.inY ?? 0);
      m.inX = M.x, m.inY = M.y;
    }
    if (m.outX !== void 0) {
      const M = g(m.outX, m.outY ?? 0);
      m.outX = M.x, m.outY = M.y;
    }
    b = Math.min(b, m.x), f = Math.min(f, m.y), h = Math.max(h, m.x), y = Math.max(y, m.y);
  }
  for (const d of n) for (const m of d.anchors)
    m.x -= b, m.y -= f;
  t.x = t.x - o.minX + b, t.y = t.y - o.minY + f, t.width = Math.max(h - b, 1), t.height = Math.max(y - f, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Tn(t) {
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
const Kt = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function Ct(t, n, e) {
  const o = t.geom;
  let s;
  if (o.kind === "preset" && le.has(o.prst)) s = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (o.kind === "custom") s = o.paths.flatMap((w) => w.cmds);
  else {
    const w = n.presets[o.prst], M = Object.fromEntries(Object.entries(o.adj ?? {}).map(([S, v]) => [S, `val ${v}`]));
    s = w ? ut(w, t.w, t.h, M).flatMap((S) => S.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, l = (w, M) => {
    let S = w - r, v = M - a;
    return t.flipH && (S = -S), t.flipV && (v = -v), { x: t.x + r + S * Math.cos(i) - v * Math.sin(i), y: t.y + a + S * Math.sin(i) + v * Math.cos(i) };
  }, p = [];
  let x = { x: 0, y: 0 };
  for (const w of s)
    if (w.op === "M" || w.op === "L")
      x = { x: w.x, y: w.y }, p.push(l(x.x, x.y));
    else if (w.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const S = M / 12, v = 1 - S, I = v * v * v * x.x + 3 * v * v * S * w.x1 + 3 * v * S * S * w.x2 + S * S * S * w.x, P = v * v * v * x.y + 3 * v * v * S * w.y1 + 3 * v * S * S * w.y2 + S * S * S * w.y;
        p.push(l(I, P));
      }
      x = { x: w.x, y: w.y };
    }
  if (p.length < 2) return [];
  const u = Math.min(...p.map((w) => w.x)), g = Math.min(...p.map((w) => w.y)), b = Math.max(...p.map((w) => w.x)), f = Math.max(...p.map((w) => w.y)), h = t.line.head && Kt[t.line.head.type], y = t.line.tail && Kt[t.line.tail.type], d = J(n, h || y ? "arrow" : "line", { ...t, x: u, y: g, w: Math.max(b - u, 1), h: Math.max(f - g, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  d.points = p.map((w) => ({ x: w.x - u, y: w.y - g })), d.curveType = "straight", d.startArrowhead = h ?? null, d.endArrowhead = y ?? null, St(d, t.line);
  const m = (w, M) => {
    if (!w) return null;
    const S = n.byPptId.get(w.id);
    if (!S || !S.el.width || !S.el.height) return null;
    const v = S.el;
    return { elementId: v.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - v.x) / v.width, anchorFractionY: (M.y + n.oy - v.y) / v.height };
  };
  return n.glue.push(() => {
    d.startBinding = m(t.start, p[0]), d.endBinding = m(t.end, p[p.length - 1]);
  }), n.stats.elements++, [d];
}
function In(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const l = J(n, "rectangle", t, e);
    return Object.assign(l, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [l];
  }
  const s = J(n, "image", t, e);
  if (s.dataURL = t.grayscale && n.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = Pt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), t.descr && (s.altText = t.descr), n.stats.elements++, n.stats.pictures++, !t.geom) return [s];
  const r = n.nextId("group"), a = ce({
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
function fe(t, n, e) {
  const o = [];
  for (const s of t)
    try {
      const r = [];
      switch (s.kind) {
        case "shape":
          r.push(...ce(s, n, e));
          break;
        case "connector":
          r.push(...Ct(s, n, e));
          break;
        case "picture":
          r.push(...In(s, n, e));
          break;
        case "group":
          r.push(...fe(s.children, n, [...e, n.nextId("group")]));
          break;
      }
      const a = kn(s.link, n);
      if (a)
        for (const i of r) i.link || (i.link = a);
      n.itemEls?.set(s.id, r), o.push(...r);
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function Nn(t) {
  return t ? { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function On(t, n, e) {
  if (n)
    if (n.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = F(n.color);
    else if (n.kind === "linear" || n.kind === "radial")
      t.fillStyle = n.kind, t.backgroundColor = F(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: F(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
    else if (n.kind === "image") {
      const o = e.images.get(n.media), s = e.slideBg ?? o?.url;
      s && (t.fillStyle = "image", t.backgroundImage = s, t.backgroundColor = "#ffffff"), s && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
    } else n.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = F(n.color));
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
}, An = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Ln(t) {
  let n = "";
  for (let o = 0; o < t.length; o += 32768) n += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(n);
}
async function En(t) {
  const n = /* @__PURE__ */ new Set(), e = (s) => {
    for (const r of s)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const s of t.slides)
    e(s.items), s.background?.kind === "image" && n.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (s) => {
    if (!An.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Pt[s.ext]};base64,${Ln(s.bytes)}`;
    let a = 0, i = 0;
    try {
      const l = await createImageBitmap(new Blob([s.bytes], { type: Pt[s.ext] }));
      a = l.width, i = l.height, l.close();
    } catch {
    }
    o.set(s, { url: r, w: a, h: i });
  })), o;
}
function Rn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, a = /^pct(\d+)$/.exec(t);
  if (a) {
    const i = Math.max(1, Math.min(99, Number(a[1]))), l = i > 50, p = (l ? 100 - i : i) / 100;
    return { type: "dots", color: l ? e : n, background: l ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(p / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function Fn(t, n, e) {
  const o = await Ie(), s = await En(t), r = Math.round(t.width), a = Math.round(t.height), i = be(e ?? t.title, "slides", { width: r, height: a }), l = [], p = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  i.slides = [];
  const x = await Mn(t, s), u = await Promise.all(t.slides.map((f) => {
    const h = f.background, y = h?.kind === "image" ? s.get(h.media) : void 0;
    return h?.kind === "image" && y ? vn(y.url, r, a, h.tile) : void 0;
  })), g = t.slides.map(() => n("slide")), b = /* @__PURE__ */ new Map();
  return t.slides.forEach((f, h) => {
    f.key && b.set(f.key, g[h]);
  }), t.slides.forEach((f, h) => {
    const y = h * (r + hn), d = Dt(g[h], f.name || `Slide ${h + 1}`, y, 0, { width: r, height: a });
    d.order = h;
    const m = { ox: y, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: l, stats: p, images: s, slideBg: u[h], gray: x, slideIds: b, itemEls: /* @__PURE__ */ new Map() };
    i.elements.push(...fe(f.items, m, [])), yn(f.anims ?? [], m, n), m.glue.forEach((M) => M()), On(d, f.background, m);
    const w = Nn(f.transition);
    w && (d.transition = w), f.notes && (d.notes = f.notes), f.hidden && (d.hidden = !0), f.advanceAfterMs && (d.advanceAfter = f.advanceAfterMs), f.section && (d.section = f.section), i.slides.push(d), p.slides++;
  }), i.slides.length || i.slides.push(Dt(void 0, "Slide 1", 0, 0, { width: r, height: a })), t.loop && (i.globalSettings = { ...i.globalSettings || {}, slideShowLoop: !0 }), { doc: i, warnings: [...new Set(l)], stats: p };
}
const Dn = 512 * 1024 * 1024;
async function Xn(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > Dn) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = dn(e), r = /* @__PURE__ */ new Set(), a = await Fn(o, (l) => ve(l, r), n);
  Me(a.doc);
  const i = [...s, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  Xn as importPptx
};
