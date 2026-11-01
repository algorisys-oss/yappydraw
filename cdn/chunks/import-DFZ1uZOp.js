import { u as fe, a as de } from "./browser-DbZP-BrN.js";
import { E as z, i as Ct, g as ue } from "./custgeom-DThQ1Qnp.js";
import { aq as he, ar as Lt, as as pe, at as me, M as ge, q as xe, K as be } from "./index-NbpsufU1.js";
const ye = 1e4, ke = 1e5, qt = 6e4, nt = (t) => t / qt * (Math.PI / 180);
function Zt(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), l = Math.max(r, a), g = {
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
  for (const [m, x] of Object.entries(g)) s.set(m, x);
  for (const m of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${m}`, r / m), s.set(`hd${m}`, a / m), s.set(`ssd${m}`, i / m);
  const b = (m) => {
    const x = s.get(m);
    if (x !== void 0) return x;
    const f = /^(wd|hd|ssd)(\d+)$/.exec(m);
    if (f) {
      const y = f[1] === "wd" ? r : f[1] === "hd" ? a : i, u = Number(f[2]);
      return u ? y / u : 0;
    }
    const h = Number(m);
    return Number.isFinite(h) ? h : 0;
  }, d = (m, x) => {
    s.size > ye || s.set(m, we(x, b));
  };
  for (const [m, x] of t.av ?? []) d(m, o[m] ?? x);
  for (const [m, x] of Object.entries(o)) s.has(m) || d(m, x);
  for (const [m, x] of t.gd ?? []) d(m, x);
  return s;
}
function we(t, n) {
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
      i = Math.atan2(r, s) * 180 / Math.PI * qt;
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
const Et = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function ft(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * z, r = Math.max(Math.abs(e), 0) * z, a = Zt(t, s, r, o), i = (b) => typeof b == "number" ? b : a.get(b) ?? (Number.isFinite(Number(b)) ? Number(b) : 0), l = [];
  let g = ke;
  for (const b of t.paths) {
    const d = b.w ? s / b.w : 1, m = b.h ? r / b.h : 1, x = (p) => i(p) * d / z, f = (p) => i(p) * m / z, h = [];
    let y = { x: 0, y: 0 }, u = { x: 0, y: 0 };
    for (const p of b.d) {
      if (--g < 0) break;
      switch (p[0]) {
        case "M":
          y = { x: x(p[1]), y: f(p[2]) }, u = y, h.push({ op: "M", ...y });
          break;
        case "L":
          y = { x: x(p[1]), y: f(p[2]) }, h.push({ op: "L", ...y });
          break;
        case "C": {
          const w = x(p[1]), M = f(p[2]), S = x(p[3]), v = f(p[4]);
          y = { x: x(p[5]), y: f(p[6]) }, h.push({ op: "C", x1: w, y1: M, x2: S, y2: v, ...y });
          break;
        }
        case "Q": {
          const w = x(p[1]), M = f(p[2]), S = x(p[3]), v = f(p[4]);
          h.push({ op: "C", x1: y.x + 2 / 3 * (w - y.x), y1: y.y + 2 / 3 * (M - y.y), x2: S + 2 / 3 * (w - S), y2: v + 2 / 3 * (M - v), x: S, y: v }), y = { x: S, y: v };
          break;
        }
        case "A": {
          const w = i(p[1]) * d / z, M = i(p[2]) * m / z;
          y = Me(h, y, w, M, i(p[3]), i(p[4]));
          break;
        }
        case "Z":
          h.push({ op: "Z" }), y = u;
          break;
      }
    }
    h.length && l.push({ cmds: h, fill: b.fill === "none" ? !1 : void 0, stroke: b.stroke === !1 ? !1 : void 0 });
  }
  return l;
}
function Me(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const a = nt(s), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, nt(r))), l = Et(a, e, o);
  let g = Et(a + i, e, o);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) g = l + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && g < l; ) g += 2 * Math.PI;
    for (; i < 0 && g > l; ) g -= 2 * Math.PI;
  }
  const b = n.x - e * Math.cos(l), d = n.y - o * Math.sin(l), m = g - l, x = Math.max(1, Math.min(16, Math.ceil(Math.abs(m) / (Math.PI / 2)))), f = m / x, h = 4 / 3 * Math.tan(f / 4);
  let y = l, u = n;
  for (let p = 0; p < x; p++) {
    const w = y + f, M = Math.cos(y), S = Math.sin(y), v = Math.cos(w), N = Math.sin(w);
    u = { x: b + e * v, y: d + o * N }, t.push({ op: "C", x1: b + e * (M - h * S), y1: d + o * (S + h * M), x2: b + e * (v + h * N), y2: d + o * (N - h * v), ...u }), y = w;
  }
  return u;
}
function Kt(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const a = Zt(t, s * z, r * z, o), i = (m) => (a.get(m) ?? (Number.isFinite(Number(m)) ? Number(m) : 0)) / z, [l, g, b, d] = t.rect.map(i);
  return { l, t: g, r: b, b: d };
}
let Ft = null;
async function ve() {
  return Ft ??= (await import("./presets-DP49P8i2.js")).default, Ft;
}
const jt = 5e4, Se = 256 * 1024 * 1024, Dt = 1024 * 1024 * 1024, Ce = 1e4, Pe = 32, Te = 2e4, I = (t, n) => {
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
}, E = (t) => t / z, Ie = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function Ne(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = c(t, "Fallback");
  for (const e of I(t, "Choice"))
    if ((k(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => Ie.has(s))) return I(e);
  return I(n);
}
const J = (t) => I(t).flatMap(Ne);
class Oe {
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
          const r = de(o).replace(/^﻿/, "");
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
    for (const i of I(a, "Relationship")) {
      const l = k(i, "Id"), g = k(i, "Type") || "", b = k(i, "Target") || "";
      if (!l) continue;
      const d = k(i, "TargetMode") === "External";
      o.set(l, { type: g.slice(g.lastIndexOf("/") + 1), target: d ? b : Ae(s, b), external: d });
    }
    return this.relCache.set(e, o), o;
  }
  relOfType(n, e) {
    for (const o of this.rels(n).values()) if (o.type === e && !o.external) return o.target;
    return null;
  }
}
const et = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function Ae(t, n) {
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
const Pt = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function gt(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = c(t, "themeElements");
  for (const r of I(c(e, "clrScheme"))) {
    const a = I(r)[0];
    if (!a) continue;
    const i = a.localName === "sysClr" ? k(a, "lastClr") : k(a, "val");
    i && /^[0-9a-f]{6}$/i.test(i) && (n.colors[r.localName] = "#" + i.toLowerCase());
  }
  const o = c(e, "fontScheme");
  n.major = k(A(o, "majorFont", "latin"), "typeface") || n.major, n.minor = k(A(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = c(e, "fmtScheme");
  return n.fills = I(c(s, "fillStyleLst")), n.lines = I(c(s, "lnStyleLst")), n.bgFills = I(c(s, "bgFillStyleLst")), n;
}
const Re = {
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
}, Qt = (t) => {
  const n = t.replace("#", "");
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}, ct = (t, n, e) => "#" + [t, n, e].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), ot = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), U = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function $t(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const o = Math.max(t, n, e), s = Math.min(t, n, e), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const a = o - s, i = r > 0.5 ? a / (2 - o - s) : a / (o + s);
  return [(o === t ? (n - e) / a + (n < e ? 6 : 0) : o === n ? (e - t) / a + 2 : (t - n) / a + 4) * 60, i, r];
}
function xt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const o = e < 0.5 ? e * (1 + n) : e + n - e * n, s = 2 * e - o, r = (a) => (a = (a % 1 + 1) % 1, a < 1 / 6 ? s + (o - s) * 6 * a : a < 1 / 2 ? o : a < 2 / 3 ? s + (o - s) * (2 / 3 - a) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function D(t, n) {
  const e = I(t).find((o) => /Clr$/.test(o.localName));
  return e ? Le(e, n) : null;
}
function Le(t, n) {
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
      e = Re[k(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = ct(U(C(t, "r") / 1e5), U(C(t, "g") / 1e5), U(C(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [l, g, b] = xt(C(t, "hue") / 6e4, C(t, "sat") / 1e5, C(t, "lum") / 1e5);
      e = ct(l, g, b);
      break;
    }
    case "schemeClr": {
      const l = k(t, "val") || "";
      if (l === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const g = n.clrMap[l] ?? Pt[l] ?? l;
      e = n.theme.colors[g] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, a] = Qt(e);
  for (const l of I(t)) {
    const g = C(l, "val") / 1e5;
    switch (l.localName) {
      case "alpha":
        o = g;
        break;
      case "alphaMod":
        o *= g;
        break;
      case "alphaOff":
        o += g;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [b, d, m] = $t(s, r, a);
        l.localName === "lumMod" ? m *= g : l.localName === "lumOff" ? m += g : l.localName === "satMod" ? d *= g : l.localName === "satOff" ? d += g : l.localName === "hueMod" ? b *= g : b += C(l, "val") / 6e4, [s, r, a] = xt(b, Math.max(0, Math.min(1, d)), Math.max(0, Math.min(1, m)));
        break;
      }
      case "tint":
        [s, r, a] = [s, r, a].map((b) => U(ot(b) * g + (1 - g)));
        break;
      case "shade":
        [s, r, a] = [s, r, a].map((b) => U(ot(b) * g));
        break;
      case "comp": {
        const [b, d, m] = $t(s, r, a);
        [s, r, a] = xt(b + 180, d, m);
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
  const i = { hex: ct(s, r, a) };
  return o < 0.999 && (i.alpha = o), i;
}
function V(t, n) {
  for (const e of I(t)) {
    const o = Tt(e, n);
    if (o) return o;
  }
}
function Tt(t, n) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const e = D(t, n.ctx);
      return e ? { kind: "solid", color: e } : { kind: "none" };
    }
    case "gradFill": {
      const e = I(c(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: C(s, "pos") / 1e5, color: D(s, n.ctx) ?? { hex: "#000000" } }));
      if (!e.length) return { kind: "none" };
      const o = c(t, "lin");
      return c(t, "path") ? { kind: "radial", stops: e } : { kind: "linear", stops: e, angle: o ? C(o, "ang") / 6e4 : 90, scaled: B(o, "scaled") ?? !1 };
    }
    case "blipFill": {
      const e = Jt(t, n);
      if (!e) return;
      const o = { kind: "image", media: e }, s = c(t, "tile");
      s && (o.tile = { sx: Math.max(0.01, C(s, "sx", 1e5) / 1e5), sy: Math.max(0.01, C(s, "sy", 1e5) / 1e5) });
      const r = c(c(t, "blip"), "alphaModFix");
      return r && (o.alpha = Math.max(0, Math.min(1, C(r, "amt", 1e5) / 1e5))), c(c(t, "blip"), "grayscl") && (o.grayscale = !0), o;
    }
    case "pattFill": {
      const e = D(c(t, "fgClr"), n.ctx), o = D(c(t, "bgClr"), n.ctx);
      return e ? { kind: "pattern", preset: k(t, "prst") || "pct50", color: e, ...o ? { bg: o } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Ee = {
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
function Jt(t, n) {
  const e = c(t, "blip"), o = k(e, "r:embed");
  if (!o) return null;
  const s = n.pkg.rels(n.part).get(o);
  if (!s || s.external) return null;
  const r = n.pkg.bytes(s.target), a = Ee[(s.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const Fe = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function G(t, n) {
  if (!t) return;
  let e;
  for (const i of I(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = D(i, n.ctx)), i.localName === "gradFill" && (e = D(c(c(i, "gsLst"), "gs"), n.ctx));
  }
  const o = k(t, "w");
  if (e === void 0 && o === null && !c(t, "prstDash") && !c(t, "headEnd") && !c(t, "tailEnd")) return;
  const s = (i) => {
    const l = k(i, "type");
    if (!l || l === "none") return;
    const g = l === "triangle" || l === "stealth" || l === "arrow" || l === "oval" || l === "diamond" ? l : "triangle", b = k(i, "len") || k(i, "w");
    return { type: g, size: b === "sm" || b === "lg" ? b : "med" };
  }, r = Fe[k(c(t, "prstDash"), "val") || "solid"], a = k(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, E(Number(o) || 0)) : 1,
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
  const a = D(e, n.ctx) ?? void 0;
  return Tt(r, { ...n, ctx: { ...n.ctx, phClr: a } });
}
function It(t, n) {
  const e = c(t, "lnRef");
  if (!e) return;
  const o = C(e, "idx");
  if (o === 0) return null;
  const s = n.ctx.theme.lines[o - 1];
  if (!s) return;
  const r = D(e, n.ctx) ?? void 0;
  return G(s, { ...n, ctx: { ...n.ctx, phClr: r } }) ?? void 0;
}
function W(t) {
  if (!t) return null;
  const n = c(t, "off"), e = c(t, "ext");
  return !n || !e ? null : {
    x: E(C(n, "x")),
    y: E(C(n, "y")),
    w: Math.max(0, E(C(e, "cx"))),
    h: Math.max(0, E(C(e, "cy"))),
    rot: C(t, "rot") / 6e4,
    flipH: !!B(t, "flipH"),
    flipV: !!B(t, "flipV")
  };
}
const bt = (t) => t;
function je(t, n) {
  const e = W(t);
  if (!e) return n;
  const o = c(t, "chOff"), s = c(t, "chExt"), r = o ? E(C(o, "x")) : e.x, a = o ? E(C(o, "y")) : e.y, i = s ? E(C(s, "cx")) : e.w, l = s ? E(C(s, "cy")) : e.h, g = i > 0 ? e.w / i : 1, b = l > 0 ? e.h / l : 1, d = e.x + e.w / 2, m = e.y + e.h / 2, x = e.rot * Math.PI / 180;
  return (f) => {
    let h = e.x + (f.x + f.w / 2 - r) * g, y = e.y + (f.y + f.h / 2 - a) * b, u = f.rot, p = f.flipH, w = f.flipV;
    if (e.flipH && (h = 2 * d - h, p = !p, u = -u), e.flipV && (y = 2 * m - y, w = !w, u = -u), x) {
      const v = h - d, N = y - m;
      h = d + v * Math.cos(x) - N * Math.sin(x), y = m + v * Math.sin(x) + N * Math.cos(x), u += e.rot;
    }
    const M = f.w * g, S = f.h * b;
    return n({ x: h - M / 2, y: y - S / 2, w: M, h: S, rot: (u % 360 + 360) % 360, flipH: p, flipV: w });
  };
}
function Bt(t) {
  const n = c(t, "spcPts"), e = c(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, C(n, "val") / 100)) * (Ct / z) };
  if (e) return { lines: Math.max(0, Math.min(13.2, C(e, "val") / 1e5)) };
}
function zt(t, n, e) {
  const o = c(t, `lvl${n + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return o ? te(o, e) : {};
}
function te(t, n) {
  const e = {};
  if (k(t, "algn") && (e.algn = k(t, "algn")), k(t, "marL") !== null && (e.marL = E(C(t, "marL"))), k(t, "indent") !== null && (e.indent = E(C(t, "indent"))), c(t, "buNone")) e.bullet = "none";
  else if (c(t, "buAutoNum")) {
    const a = c(t, "buAutoNum");
    e.bullet = "num", e.numType = k(a, "type") || "arabicPeriod", e.startAt = k(a, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(C(a, "startAt", 1)))) : void 0;
  } else c(t, "buChar") ? (e.bullet = "char", e.buChar = k(c(t, "buChar"), "char") || void 0) : c(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (c(t, "buFont") ? e.buFont = k(c(t, "buFont"), "typeface") || null : c(t, "buFontTx") && (e.buFont = null), c(t, "buClr") ? e.buClr = D(c(t, "buClr"), n.ctx) : c(t, "buClrTx") && (e.buClr = null), c(t, "buSzPct")) {
    const a = k(c(t, "buSzPct"), "val") || "", i = a.endsWith("%") ? parseFloat(a) / 100 : Number(a) / 1e5;
    e.buSz = Number.isFinite(i) && i > 0 ? Math.max(0.25, Math.min(4, i)) : null;
  } else (c(t, "buSzTx") || c(t, "buSzPts")) && (e.buSz = null);
  const o = A(t, "lnSpc", "spcPct");
  o && (e.lnSpcPct = C(o, "val") / 1e5);
  const s = Bt(c(t, "spcBef")), r = Bt(c(t, "spcAft"));
  return s && (e.spcBef = s), r && (e.spcAft = r), Object.assign(e, ee(c(t, "defRPr"), n)), e;
}
function ee(t, n) {
  if (!t) return {};
  const e = {};
  k(t, "sz") !== null && (e.sz = C(t, "sz") / 100 * (Ct / z)), B(t, "b") !== void 0 && (e.b = B(t, "b")), B(t, "i") !== void 0 && (e.i = B(t, "i")), k(t, "u") && (e.u = k(t, "u") !== "none"), k(t, "strike") && (e.strike = k(t, "strike") !== "noStrike");
  const o = c(t, "solidFill");
  o ? e.color = D(o, n.ctx) : c(t, "noFill") && (e.color = null);
  const s = k(c(t, "latin"), "typeface");
  return s && (e.font = s), e;
}
const De = {
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
}, $e = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Be(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const o = (n || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && De[e] || "•" : o === "symbol" ? $e[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const Xt = (...t) => {
  const n = {};
  for (const e of t) for (const [o, s] of Object.entries(e)) s !== void 0 && (n[o] = s);
  return n;
};
function ze(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function Nt(t, n, e) {
  if (!t) return;
  const o = I(t, "p");
  if (!o.some((x) => I(x).some((f) => (f.localName === "r" || f.localName === "fld") && (A(f, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const x of [...n.bodyPr, c(t, "bodyPr")]) {
    if (!x) continue;
    for (let h = 0; h < x.attributes.length; h++) r[x.attributes[h].localName ?? x.attributes[h].name] = x.attributes[h].value;
    const f = c(x, "normAutofit");
    f && (a = k(f, "fontScale") !== null ? C(f, "fontScale") / 1e5 : 1), f && (i = 1 - Math.max(0, Math.min(0.9, C(f, "lnSpcReduction") / 1e5))), (c(x, "noAutofit") || c(x, "spAutoFit")) && (a = 1, i = 1);
  }
  const l = (x, f) => r[x] !== void 0 ? E(Number(r[x]) || 0) : E(f), g = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", b = c(t, "lstStyle"), d = [];
  let m;
  for (const x of o) {
    const f = c(x, "pPr"), h = Math.max(0, Math.min(8, C(f, "lvl"))), y = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, u = Xt(...n.levels.map((P) => zt(P, h, e)), y, zt(b, h, e), f ? te(f, e) : {});
    u.lnSpcPct !== void 0 && m === void 0 && (m = u.lnSpcPct);
    const p = { runs: [], align: u.algn === "ctr" ? "ctr" : u.algn === "r" ? "r" : (u.algn === "just", "l"), level: h };
    if (u.bullet === "char" || u.bullet === "num") {
      if (p.bullet = u.bullet, p.marL = u.marL ?? 0, p.indent = u.indent ?? 0, u.bullet === "char") {
        const P = Be(u.buChar, u.buFont ?? void 0);
        P !== "•" && (p.bulletChar = P);
      } else
        u.numType && u.numType !== "arabicPeriod" && (p.numType = u.numType), u.startAt && u.startAt !== 1 && (p.startAt = u.startAt);
      u.buClr && (p.bulletColor = u.buClr), u.buSz && Math.abs(u.buSz - 1) > 1e-3 && (p.bulletScale = u.buSz);
    }
    const w = (P) => {
      const L = Xt(u, ee(P, e)), X = (L.sz ?? 18 * Ct / z) * a, H = L.color === null ? void 0 : L.color ?? ne("tx1", e);
      return {
        text: "",
        size: X,
        bold: L.b || void 0,
        italic: L.i || void 0,
        underline: L.u || void 0,
        strike: L.strike || void 0,
        color: H ?? void 0,
        font: ze(L.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const P of I(x))
      if (P.localName === "r" || P.localName === "fld") {
        const L = A(P, "t")?.textContent ?? "";
        if (!L) continue;
        L.split(/[\v\n]/).forEach((X, H) => {
          H > 0 && p.runs.push({ ...w(c(P, "rPr")), br: !0 }), X && p.runs.push({ ...w(c(P, "rPr")), text: X });
        });
      } else P.localName === "br" && p.runs.push({ ...w(c(P, "rPr")), br: !0 });
    p.endSize = w(c(x, "endParaRPr")).size;
    const M = (p.runs.length ? Math.max(...p.runs.map((P) => P.size ?? 0)) : p.endSize ?? 0) * 1.2 * (u.lnSpcPct ?? 1), S = (P) => P ? ("px" in P ? P.px : P.lines * M) * i : 0, v = S(u.spcBef), N = S(u.spcAft);
    v > 0.05 && (p.spaceBefore = Math.round(v * 100) / 100), N > 0.05 && (p.spaceAfter = Math.round(N * 100) / 100), d.push(p);
  }
  return {
    paragraphs: d,
    anchor: g,
    insets: { l: l("lIns", 91440), t: l("tIns", 45720), r: l("rIns", 91440), b: l("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: m
  };
}
const ne = (t, n) => {
  const e = n.ctx.clrMap[t] ?? Pt[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, K = (t) => {
  const n = c(t, "ph");
  return n ? { type: k(n, "type") || "obj", idx: C(n, "idx") } : null;
}, st = (t) => c(I(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), it = /* @__PURE__ */ new Set(["title", "ctrTitle"]), Ht = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Yt = (t, n) => t === n || it.has(t) && it.has(n) || !Ht.has(t) && !Ht.has(n);
function ut(t, n) {
  const e = Xe(t);
  if (n.idx) {
    const o = e.find((s) => s.ph.idx === n.idx && Yt(s.ph.type, n.type));
    if (o) return o.el;
  }
  return (e.find((o) => o.ph.type === n.type && (o.ph.idx === n.idx || !n.idx || it.has(n.type))) ?? e.find((o) => o.ph.type === n.type) ?? e.find((o) => Yt(o.ph.type, n.type)))?.el ?? null;
}
function Xe(t) {
  const n = [];
  for (const e of J(t)) {
    const o = K(st(e));
    o && n.push({ el: e, ph: o });
  }
  return n;
}
const oe = (t) => it.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", He = (t) => {
  const n = {};
  for (const e of I(c(t, "avLst"), "gd")) {
    const o = k(e, "name"), s = k(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function Ye(t) {
  const n = (r) => I(r, "gd").slice(0, 1e4).map((a) => [k(a, "name") || "", k(a, "fmla") || "val 0"]), e = I(c(t, "cxnLst"), "cxn").map((r) => [k(r, "ang") || "0", k(c(r, "pos"), "x") || "0", k(c(r, "pos"), "y") || "0"]), o = c(t, "rect"), s = I(c(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const l of I(r)) {
      const g = I(l, "pt").map((b) => [k(b, "x") || "0", k(b, "y") || "0"]).flat();
      switch (l.localName) {
        case "moveTo":
          a.push(["M", ...g]);
          break;
        case "lnTo":
          a.push(["L", ...g]);
          break;
        case "quadBezTo":
          a.push(["Q", ...g]);
          break;
        case "cubicBezTo":
          a.push(["C", ...g]);
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
    av: I(c(t, "avLst"), "gd").map((r) => [k(r, "name") || "", k(r, "fmla") || "val 0"]),
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
    for (const [r, a] of Object.entries(He(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (s[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: k(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = c(t, "custGeom");
  if (o) {
    const s = Ye(o);
    return { geom: { kind: "custom", paths: ft(s, n.w, n.h) }, textRect: s.rect ? Kt(s, n.w, n.h) : void 0 };
  }
}
function at(t, n, e, o, s, r) {
  const a = [];
  if (s > Pe)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of J(t)) {
    if (++e.count > Te) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const l = Ue(i, n, e, o, s, r);
      l && a.push(...Array.isArray(l) ? l : [l]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
}
const We = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function _e(t, n, e) {
  const o = c(t, "hlinkClick");
  if (!o) return;
  const s = k(o, "action") || "", r = e.rels(n).get(k(o, "r:id") || "");
  if (s.startsWith("ppaction://hlinkshowjump")) {
    const a = We[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return a ? { kind: "action", action: a } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function Ue(t, n, e, o, s, r) {
  const a = I(t).find((g) => g.localName.startsWith("nv")), i = Ge(t, n, e, o, s, r), l = i ? _e(c(a ?? null, "cNvPr"), n.part, e.pkg) : void 0;
  if (l) for (const g of Array.isArray(i) ? i : [i]) g.link = l;
  return i;
}
function Ge(t, n, e, o, s, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = I(t).find((d) => d.localName.startsWith("nv")), l = c(i ?? null, "cNvPr"), g = C(l, "id"), b = k(l, "name") || t.localName;
  if (k(l, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Ze(t, n, e, o, g, b, r);
    case "cxnSp": {
      const d = c(t, "spPr"), m = W(c(d, "xfrm"));
      if (!m) return null;
      const x = o(m), f = c(t, "style"), h = G(c(d, "ln"), a) ?? It(f, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!h) return null;
      const y = rt(d, x) ?? { geom: { kind: "preset", prst: "line" } }, u = (w) => w ? { id: C(w, "id"), idx: C(w, "idx") } : void 0, p = c(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: g, name: b, ...x, geom: y.geom, line: h, start: u(c(p, "stCxn")), end: u(c(p, "endCxn")) };
    }
    case "pic": {
      const d = c(t, "spPr");
      let m = W(c(d, "xfrm"));
      const x = K(c(i ?? null, "nvPr"));
      if (!m && x && (m = Ve(x, e)), !m) return null;
      const f = c(t, "blipFill"), h = f ? Jt(f, a) : null;
      if (!h)
        return e.warnings.push(`Picture "${b}" has no image the importer can read.`), null;
      const y = c(f, "srcRect"), u = y ? { l: C(y, "l") / 1e5, t: C(y, "t") / 1e5, r: C(y, "r") / 1e5, b: C(y, "b") / 1e5 } : void 0, p = k(A(f, "blip", "alphaModFix"), "amt"), w = o(m), M = rt(d, w)?.geom, S = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: g, name: b, ...w, media: h, crop: u, alpha: p !== null ? Number(p) / 1e5 : void 0, descr: k(l, "descr") || void 0, geom: S, ...A(f, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const d = c(t, "grpSpPr"), m = c(d, "xfrm"), x = je(m, o), f = at(t, n, e, x, s + 1, r);
      if (!f.length) return null;
      const h = ht(f);
      return { kind: "group", id: g, name: b, ...h, children: f };
    }
    case "graphicFrame":
      return Je(t, n, e, o, g, b, s);
    default:
      return null;
  }
}
function ht(t) {
  let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
  for (const r of t)
    n = Math.min(n, r.x), e = Math.min(e, r.y), o = Math.max(o, r.x + r.w), s = Math.max(s, r.y + r.h);
  return { x: n, y: e, w: Math.max(0, o - n), h: Math.max(0, s - e) };
}
function Ve(t, n) {
  const e = ut(n.layout?.tree ?? null, t), o = W(A(e, "spPr", "xfrm"));
  if (o) return o;
  const s = ut(n.master?.tree ?? null, { type: oe(t.type), idx: 0 });
  return W(A(s, "spPr", "xfrm"));
}
function qe(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function Ze(t, n, e, o, s, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, l = st(t), g = K(l);
  if (g && !a) return null;
  const b = c(t, "spPr"), d = c(t, "style"), m = k(A(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", x = g && e.layout ? ut(e.layout.tree, g) : null, f = g && e.master ? ut(e.master.tree, { type: oe(x ? K(st(x))?.type ?? g.type : g.type), idx: 0 }) : null, h = x && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, y = f && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let u = W(c(b, "xfrm")) ?? W(A(x, "spPr", "xfrm")) ?? W(A(f, "spPr", "xfrm"));
  if (!u) return null;
  u = o(u);
  const p = rt(b, u) ?? (x ? rt(c(x, "spPr"), u) : void 0) ?? (f ? rt(c(f, "spPr"), u) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (B(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? V(b, i) ?? dt(d, i) ?? (h ? V(c(x, "spPr"), h) : void 0) ?? (y ? V(c(f, "spPr"), y) : void 0) ?? (h ? dt(c(x, "style"), h) : void 0) ?? { kind: "none" }, S = qe(
    () => G(c(b, "ln"), i),
    () => It(d, i),
    () => h ? G(A(x, "spPr", "ln"), h) : void 0,
    () => y ? G(A(f, "spPr", "ln"), y) : void 0
  ) ?? null, v = [];
  if (g) {
    const O = x ? K(st(x))?.type ?? g.type : g.type;
    v.push(it.has(O) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(O) ? e.masterTx.body : e.masterTx.other), v.push(A(f, "txBody", "lstStyle"), A(x, "txBody", "lstStyle"));
  } else
    v.push(e.defaultText);
  const N = c(d, "fontRef"), P = {
    levels: v,
    bodyPr: [A(f, "txBody", "bodyPr"), A(x, "txBody", "bodyPr")],
    fontRef: N ? { font: k(N, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: D(N, i.ctx) } : void 0
  }, L = Nt(c(t, "txBody"), P, i);
  if (!(M.kind !== "none" || !!S || !!L)) return null;
  let H = p.textRect;
  const T = W(c(b, "xfrm")), R = L ? W(c(t, "txXfrm")) : null;
  if (R && T && T.w > 0 && T.h > 0) {
    const O = u.w / T.w, Y = u.h / T.h, j = { l: (R.x - T.x) * O, t: (R.y - T.y) * Y, r: (R.x + R.w - T.x) * O, b: (R.y + R.h - T.y) * Y };
    (Math.abs(j.l) > 0.5 || Math.abs(j.t) > 0.5 || Math.abs(j.r - u.w) > 0.5 || Math.abs(j.b - u.h) > 0.5) && (H = j);
  }
  return { kind: "shape", id: s, name: r, ...u, geom: p.geom, fill: M, line: S, text: L, textBox: m || void 0, textRect: H };
}
const Wt = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function Ke(t, n) {
  const e = {};
  if (!t) return e;
  const o = c(t, "tcStyle"), s = c(t, "tcTxStyle"), r = c(o, "fill"), a = r ? V(r, n) : dt(o, n);
  a && (e.fill = a);
  const i = D(s, n.ctx) ?? D(c(s, "fontRef"), n.ctx);
  i && (e.text = i), k(s, "b") === "on" && (e.bold = !0);
  const l = c(o, "tcBdr");
  for (const g of ["insideH", "bottom", "top", "left"]) {
    const b = c(l, g);
    if (!b) continue;
    const d = G(c(b, "ln"), n) ?? It(b, n);
    if (d !== void 0) {
      e.border = d;
      break;
    }
  }
  return e;
}
function Qe(t, n, e) {
  const o = ((c(t, "tableStyleId")?.textContent || "").trim() || k(e, "def") || Wt).toUpperCase(), s = (d) => B(t, d) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, a = I(e, "tblStyle").find((d) => (k(d, "styleId") || "").toUpperCase() === o);
  if (a) {
    const d = (y) => Ke(c(a, y), n), m = c(a, "tblBg"), x = m ? c(m, "fill") ? V(c(m, "fill"), n) : dt(m, n) : void 0, f = {
      whole: d("wholeTbl"),
      b1H: d("band1H"),
      b2H: d("band2H"),
      b1V: d("band1V"),
      b2V: d("band2V"),
      firstRow: d("firstRow"),
      lastRow: d("lastRow"),
      firstCol: d("firstCol"),
      lastCol: d("lastCol")
    }, h = (y, u, p, w) => {
      const M = [f.whole], S = y - (r.firstRow ? 1 : 0), v = u - (r.firstCol ? 1 : 0);
      r.bandCol && v >= 0 && M.push(v % 2 === 0 ? f.b1V : f.b2V), r.bandRow && S >= 0 && M.push(S % 2 === 0 ? f.b1H : f.b2H), r.firstCol && u === 0 && M.push(f.firstCol), r.lastCol && u === w - 1 && M.push(f.lastCol), r.firstRow && y === 0 && M.push(f.firstRow), r.lastRow && y === p - 1 && M.push(f.lastRow);
      const N = {};
      for (const P of M)
        P.fill && (N.fill = P.fill), P.text && (N.text = P.text), P.bold && (N.bold = !0), P.border !== void 0 && (N.border = P.border);
      return N;
    };
    return x && x.kind !== "none" && (h.background = x), h;
  }
  if (o !== Wt) return null;
  const i = n.ctx.theme.colors.accent1 ?? "#4472c4", l = (d) => {
    const [m, x, f] = Qt(i);
    return { hex: ct(U(ot(m) * d + (1 - d)), U(ot(x) * d + (1 - d)), U(ot(f) * d + (1 - d))) };
  }, g = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, b = ne("tx1", n) ?? void 0;
  return (d) => {
    const m = r.firstRow && d === 0, x = r.bandRow && !m && (d - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: m ? { hex: i } : l(x ? 0.4 : 0.2) },
      text: m ? g : b,
      bold: m || void 0,
      border: { width: 1.33, color: g }
    };
  };
}
function Je(t, n, e, o, s, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, l = W(c(t, "xfrm"));
  if (!l) return null;
  const g = A(t, "graphic", "graphicData"), b = c(g, "tbl");
  if (b) {
    const x = I(c(b, "tblGrid"), "gridCol").map((w) => E(C(w, "w"))), f = Qe(c(b, "tblPr"), i, e.tableStyles), h = [];
    let y = l.y, u = 1e6 + s * 1e3;
    const p = I(b, "tr");
    if (p.forEach((w, M) => {
      const S = E(C(w, "h"));
      let v = l.x, N = 0;
      for (const P of I(w, "tc")) {
        const L = Math.max(1, C(P, "gridSpan", 1)), X = x.slice(N, N + L).reduce((tt, Z) => tt + Z, 0);
        if (N += L, B(P, "hMerge") || B(P, "vMerge")) {
          v += X;
          continue;
        }
        const H = Math.max(1, C(P, "rowSpan", 1)), T = c(P, "tcPr"), R = H > 1 ? S * H : S, O = f ? f(M, N - L, p.length, x.length) : null, Y = O?.text ? { color: O.text } : void 0, j = Nt(c(P, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: Y }, i);
        j && O?.bold && j.paragraphs.forEach((tt) => tt.runs.forEach((Z) => {
          Z.bold === void 0 && (Z.bold = !0);
        })), j && (j.insets = { l: E(C(T, "marL", 91440)), r: E(C(T, "marR", 91440)), t: E(C(T, "marT", 45720)), b: E(C(T, "marB", 45720)) }, j.anchor = k(T, "anchor") === "ctr" ? "ctr" : k(T, "anchor") === "b" ? "b" : "t");
        const _ = G(c(T, "lnB"), i) ?? G(c(T, "lnT"), i) ?? (O ? O.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), q = O?.fill;
        h.push({
          kind: "shape",
          id: u++,
          name: `${r} cell`,
          ...o({ x: v, y, w: X, h: R, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: V(T, i) ?? q ?? { kind: "none" },
          line: _,
          text: j
        }), v += X;
      }
      y += S;
    }), !h.length) return null;
    if (f?.background) {
      const w = ht(h);
      h.unshift({
        kind: "shape",
        id: u++,
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
    return { kind: "group", id: s, name: r, ...ht(h), children: h };
  }
  const d = k(g, "uri") || "";
  if (/diagram/.test(d)) {
    const x = tn(g, n, e, o, l, s, r, a);
    if (x) return x;
    const f = en(g, n, e, o, l, s, r, i);
    if (f) return f;
  }
  const m = /chart/.test(d) ? "Chart" : /diagram/.test(d) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${m} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(l),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${m}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function tn(t, n, e, o, s, r, a, i) {
  const l = e.pkg.rels(n.part), g = k(c(t, "relIds"), "r:dm"), b = g ? l.get(g) : void 0;
  let d;
  if (b && !b.external) {
    const u = Ot(e.pkg.xml(b.target), "dataModelExt", 6), p = u ? l.get(k(u, "relId") || "") : void 0;
    p && !p.external && (d = p.target);
  }
  if (!d) {
    const u = [...l.values()].filter((p) => p.type === "diagramDrawing" && !p.external);
    u.length === 1 && (d = u[0].target);
  }
  if (!d) return null;
  const m = c(e.pkg.xml(d), "spTree");
  if (!m) return null;
  const f = at(m, { part: d, tree: m }, e, (u) => o({ ...u, x: u.x + s.x, y: u.y + s.y }), i + 1, !0);
  if (!f.length) return null;
  let h = 2e6 + r * 1e3;
  const y = (u) => u.forEach((p) => {
    p.id = h++, p.kind === "group" && y(p.children);
  });
  return y(f), { kind: "group", id: r, name: a, ...ht(f), children: f };
}
function en(t, n, e, o, s, r, a, i) {
  const l = k(c(t, "relIds"), "r:dm"), g = l ? e.pkg.rels(n.part).get(l) : void 0;
  if (!g || g.external) return null;
  const b = e.pkg.xml(g.target), d = /* @__PURE__ */ new Map();
  for (const u of I(c(b, "ptLst"), "pt")) d.set(k(u, "modelId") || "", u);
  const m = /* @__PURE__ */ new Map();
  for (const u of I(c(b, "cxnLst"), "cxn")) {
    if ((k(u, "type") || "parOf") !== "parOf") continue;
    const p = k(u, "srcId") || "", w = k(u, "destId") || "";
    m.has(p) || m.set(p, []), m.get(p).push({ id: w, ord: C(u, "srcOrd") });
  }
  const x = [...d.values()].find((u) => k(u, "type") === "doc");
  if (!x) return null;
  const f = [], h = /* @__PURE__ */ new Set(), y = (u, p) => {
    if (!(h.has(u) || p > 16 || f.length > 500)) {
      h.add(u);
      for (const w of (m.get(u) ?? []).sort((M, S) => M.ord - S.ord)) {
        const M = d.get(w.id), S = k(M, "type") || "node";
        if (!M || S !== "node" && S !== "asst") continue;
        const v = Nt(c(M, "t"), { levels: [e.defaultText], bodyPr: [] }, i);
        for (const N of v?.paragraphs ?? [])
          N.runs.some((P) => !P.br && P.text.trim()) && f.push({
            ...N,
            align: "l",
            level: p,
            ...p > 0 ? { bullet: "char" } : {},
            runs: N.runs.map((P) => ({ ...P, size: P.size ?? (p > 0 ? 16 : 18), bold: P.bold ?? (p === 0 ? !0 : void 0) }))
          });
        y(w.id, p + 1);
      }
    }
  };
  return y(k(x, "modelId") || "", 0), f.length ? (e.warnings.push(`SmartArt diagram "${a}" had no saved drawing; its text was imported as a list.`), {
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
function Ot(t, n, e) {
  if (!t || e < 0) return null;
  for (const o of J(t)) {
    if (o.localName === n) return o;
    const s = Ot(o, n, e - 1);
    if (s) return s;
  }
  return null;
}
function yt(t, n) {
  const e = c(t, "bg");
  if (!e) return;
  const o = c(e, "bgPr");
  if (o)
    return V(o, n);
  const s = c(e, "bgRef");
  if (s) {
    const r = C(s, "idx"), i = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (i ? Tt(i, { ...n, ctx: { ...n.ctx, phClr: D(s, n.ctx) ?? void 0 } }) : void 0) ?? (D(s, n.ctx) ? { kind: "solid", color: D(s, n.ctx) } : void 0);
  }
}
function nn(t, n) {
  const e = t.relOfType(n, "notesSlide"), o = e ? A(t.xml(e), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (i) => {
    for (const l of J(i)) {
      if (l.localName === "grpSp") {
        r(l);
        continue;
      }
      if (l.localName !== "sp") continue;
      const g = K(st(l));
      if (!(!g || g.type !== "body" && g.type !== "obj"))
        for (const b of I(c(l, "txBody"), "p")) {
          let d = "";
          for (const m of I(b))
            m.localName === "r" || m.localName === "fld" ? d += c(m, "t")?.textContent ?? "" : m.localName === "br" && (d += `
`);
          s.push(d);
        }
    }
  };
  r(o);
  const a = s.join(`
`).replace(/\s+$/, "");
  return a.trim() ? a : void 0;
}
function on(t) {
  for (const a of I(t, "AlternateContent"))
    for (const i of I(a, "Choice")) {
      const l = c(i, "transition");
      if (l && c(l, "morph")) {
        const g = k(l, "spd");
        return { kind: "morph", durationMs: k(l, "p14:dur") !== null ? C(l, "p14:dur") : g === "fast" ? 500 : g === "slow" ? 1e3 : 750 };
      }
    }
  const n = J(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = I(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
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
function _t(t) {
  const n = J(t).find((s) => s.localName === "transition"), e = n ? k(n, "advTm") : null, o = e !== null ? Number(e) : NaN;
  return Number.isFinite(o) && o > 0 ? o : void 0;
}
function sn(t, n) {
  const e = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of I(c(t, "sldIdLst"), "sldId")) {
    const a = n.get(k(r, "r:id") || ""), i = k(r, "id");
    a && i && o.set(i, a.target);
  }
  const s = Ot(c(t, "extLst"), "sectionLst", 4);
  for (const r of I(s, "section")) {
    const a = (k(r, "name") || "").trim(), i = I(c(r, "sldIdLst"), "sldId")[0], l = i ? o.get(k(i, "id") || "") : void 0;
    a && l && !e.has(l) && e.set(l, a);
  }
  return e;
}
function rn(t, n = {}) {
  const e = [], o = (T) => {
    e.length < 200 && !e.includes(T) && e.push(T);
  }, s = n.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = fe(t, {
      filter: (T) => (a++, i += T.originalSize, a <= jt && T.originalSize <= Se && i <= Dt)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > jt || i > Dt) && o("The file is very large; some parts were skipped.");
  const l = new Oe(r, s, o), g = l.relOfType("", "officeDocument") ?? "ppt/presentation.xml", b = l.xml(g);
  if (!b || b.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const d = c(b, "sldSz"), m = d ? Math.max(1, E(C(d, "cx", 9144e3))) : 960, x = d ? Math.max(1, E(C(d, "cy", 5143500))) : 540, f = c(b, "defaultTextStyle"), h = l.rels(g), y = l.relOfType(g, "tableStyles"), u = y ? l.xml(y) : null, p = [], w = /* @__PURE__ */ new Set();
  for (const T of I(c(b, "sldIdLst"), "sldId")) {
    const R = h.get(k(T, "r:id") || "");
    R && !w.has(R.target) && p.length < Ce && (w.add(R.target), p.push(R.target));
  }
  const M = /* @__PURE__ */ new Map(), S = (T) => {
    const R = l.relOfType(T, "theme");
    return R ? (M.has(R) || M.set(R, gt(l.xml(R))), M.get(R)) : gt(null);
  }, v = (T) => {
    if (!T) return null;
    const R = {};
    for (let O = 0; O < T.attributes.length; O++) R[T.attributes[O].localName ?? T.attributes[O].name] = T.attributes[O].value;
    return R;
  }, N = sn(b, h), P = [];
  p.forEach((T, R) => {
    const O = l.xml(T);
    if (!O) {
      o(`Slide ${R + 1} couldn't be read and was skipped.`);
      return;
    }
    const Y = l.relOfType(T, "slideLayout"), j = Y ? l.xml(Y) : null, _ = Y ? l.relOfType(Y, "slideMaster") : null, q = _ ? l.xml(_) : null, tt = _ ? S(_) : gt(null), Z = v(A(O, "clrMapOvr", "overrideClrMapping")) ?? v(A(j, "clrMapOvr", "overrideClrMapping")) ?? v(c(q, "clrMap")) ?? Pt, At = { theme: tt, clrMap: Z }, pt = c(q, "txStyles"), $ = {
      pkg: l,
      ctx: At,
      slide: { part: T, tree: A(O, "cSld", "spTree") },
      layout: Y ? { part: Y, tree: A(j, "cSld", "spTree") } : null,
      master: _ ? { part: _, tree: A(q, "cSld", "spTree") } : null,
      masterTx: { title: c(pt, "titleStyle"), body: c(pt, "bodyStyle"), other: c(pt, "otherStyle") },
      defaultText: f,
      warnings: e,
      count: 0,
      tableStyles: u
    }, mt = (ce) => ({ pkg: l, part: ce?.part ?? T, ctx: At }), Rt = yt(c(O, "cSld"), mt($.slide)) ?? yt(c(j, "cSld"), mt($.layout)) ?? yt(c(q, "cSld"), mt($.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    $.background = Rt;
    const lt = [], le = B(O, "showMasterSp") !== !1 && B(j, "showMasterSp") !== !1;
    $.master && le && lt.push(...at($.master.tree, $.master, $, bt, 0, !1)), $.layout && B(O, "showMasterSp") !== !1 && lt.push(...at($.layout.tree, $.layout, $, bt, 0, !1)), lt.push(...at($.slide.tree, $.slide, $, bt, 0, !0)), P.push({
      items: lt,
      background: Rt,
      transition: on(O),
      name: k(c(O, "cSld"), "name") || void 0,
      notes: nn(l, T),
      key: T,
      ...k(O, "show") === "0" && { hidden: !0 },
      ..._t(O) && { advanceAfterMs: _t(O) },
      ...N.has(T) && { section: N.get(T) }
    });
  }), P.length || o("The presentation has no slides.");
  const L = A(l.xml("docProps/core.xml"), "title")?.textContent || void 0, X = l.relOfType(g, "presProps"), H = k(c(X ? l.xml(X) : null, "showPr"), "loop");
  return { deck: { width: m, height: x, slides: P, title: L, ...(H === "1" || H === "true") && { loop: !0 } }, warnings: e };
}
const an = 80, ln = "default-layer", F = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, cn = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, fn = /(courier|consolas|mono|menlo|code)/i;
function Ut(t) {
  if (!t) return "sans-serif";
  const n = ge(t);
  return n || (fn.test(t) ? "monospace" : cn.test(t) ? "serif" : "sans-serif");
}
function dn(t) {
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
const un = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
function hn(t, n) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return pe(t.action);
  const e = n.slideIds?.get(t.key);
  return e ? me(e) : null;
}
async function pn(t) {
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
async function mn(t, n) {
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
    const a = await pn(r);
    a && s.set(r, a);
  })), s;
}
async function gn(t, n, e, o) {
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
function Q(t, n, e, o) {
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
    layerId: ln,
    groupIds: [...o].reverse(),
    // innermost first, the store's convention
    name: e.name
  };
}
function Gt(t, n, e) {
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
      t.backgroundColor = F(n.color), t.fillStyle = "pattern", t.patternFill = Tn(n.preset, F(n.color), n.bg ? F(n.bg) : "transparent");
      break;
    }
    case "image": {
      const o = e.images.get(n.media);
      o && (t.fillStyle = "image", t.backgroundImage = n.grayscale && e.gray.get(o.url) || o.url, t.backgroundColor = "#ffffff"), o && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
      break;
    }
  }
}
function Mt(t, n) {
  if (!n || !(n.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = F(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function xn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function bn(t, n) {
  const e = t.bullet === "num" ? xn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && F(t.bulletColor) !== F(o) && (e.listMarkerColor = F(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const kt = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function se(t, n) {
  const e = t.paragraphs.flatMap((h) => h.runs.filter((y) => !y.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (h) => h.runs.reduce((y, u) => y + (u.br ? 0 : u.text.trim().length), 0);
  for (const h of t.paragraphs) {
    const y = a(h);
    y && r.set(h.align ?? "l", (r.get(h.align ?? "l") ?? 0) + y);
  }
  const i = [...r].sort((h, y) => y[1] - h[1])[0]?.[0] ?? t.paragraphs.find((h) => h.runs.length)?.align ?? "l", l = (h) => a(h) > 0 && (h.align ?? "l") !== i ? h.align === "ctr" ? "center" : h.align === "r" ? "right" : "left" : void 0, g = e.every((h) => h.size === o?.size && h.bold === o?.bold && h.italic === o?.italic && h.underline === o?.underline && h.strike === o?.strike && h.font === o?.font && F(h.color) === F(o?.color)) && !t.paragraphs.some((h) => h.bullet) && !t.paragraphs.some((h, y) => y > 0 && kt(t, y) > 0) && !t.paragraphs.some(l), b = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Ut(o?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: F(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (b.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const d = t.paragraphs.map((h) => h.runs.map((y) => y.br ? `
` : y.text).join("")).join(`
`);
  if (g)
    return o?.bold && (b.fontWeight = 700), o?.italic && (b.fontStyle = "italic"), n ? b.containerText = d : b.text = d, { fields: b, rich: !1 };
  const m = [], x = [], f = [];
  return t.paragraphs.forEach((h, y) => {
    const u = h.level ?? 0;
    if (h.bullet === "num") {
      const M = h.numType ?? "arabicPeriod";
      (x[u] === void 0 || f[u] !== M) && (x[u] = (h.startAt ?? 1) - 1), x[u]++, f[u] = M, x.length = u + 1, f.length = u + 1;
    } else
      x.length = Math.min(x.length, u), f.length = x.length;
    const p = h.bullet ? { listType: h.bullet === "num" ? "ordered" : "bullet", listLevel: u, ...bn(h, t) } : {};
    h.bullet === "num" && (p.listIndex = x[u]), (h.runs.length ? h.runs : [{ text: "" }]).forEach((M, S) => {
      const v = { text: M.br ? `
` : M.text, ...S === 0 ? p : {} };
      S === 0 && y > 0 && kt(t, y) > 0 && (v.paragraphSpaceBefore = kt(t, y));
      const N = l(h);
      N && (v.paragraphAlign = N), M.bold && (v.bold = !0), M.italic && (v.italic = !0), M.underline && (v.underline = !0), M.strike && (v.strikethrough = !0), M.color && (v.color = F(M.color)), M.size && (v.fontSize = Math.round(M.size * 10) / 10), M.font && (v.fontFamily = Ut(M.font)), m.push(v);
    }), y < t.paragraphs.length - 1 && m.push({ text: `
` });
  }), n ? (b.richContainerText = m, b.containerText = d) : (b.richText = m, b.text = d), { fields: b, rich: !0 };
}
function wt(t, n, e, o, s) {
  const { fields: r, rich: a } = se(n, !1), i = 4, l = Q(t, a ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - i,
    y: e.y + n.insets.t - i,
    w: Math.max(e.w - n.insets.l - n.insets.r + i * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + i * 2, 8)
  }, o);
  return Object.assign(l, r, { autoResize: !n.wrap, strokeColor: r.textColor }), l;
}
const re = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function ae(t, n, e) {
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return n.stats.elements++, [wt(n, t.text, t, e)];
  if (o.kind === "preset" && re.has(o.prst)) return vt({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((d) => !d.cmds.some((m) => m.op === "Z")))
    return vt({ ...t, kind: "connector", line: t.line }, n, e);
  const s = kn(t);
  if (s) {
    const d = Q(n, s.type, t, e);
    Object.assign(d, s.extra), Gt(d, t.fill, n), Mt(d, t.line), n.byPptId.set(t.id, { el: d, item: t }), n.stats.elements++;
    const m = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, x = t.text?.insets, f = Math.abs(m.l) > 0.5 || Math.abs(m.t) > 0.5 || Math.abs(m.r - t.w) > 0.5 || Math.abs(m.b - t.h) > 0.5, h = !!x && Math.max(x.l, x.r, x.t, x.b) > 16;
    if (t.text && (f || h)) {
      const y = n.nextId("group");
      return d.groupIds = [...e, y].reverse(), n.stats.elements++, [d, wt(n, t.text, { ...t, rot: 0, x: t.x + m.l, y: t.y + m.t, w: m.r - m.l, h: m.b - m.t }, [...e, y])];
    }
    if (t.text) {
      const { fields: y } = se(t.text, !0);
      Object.assign(d, y);
    }
    return [d];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const d = n.presets[o.prst];
    if (!d)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), ft(n.presets.rect, t.w, t.h);
    const m = Object.fromEntries(Object.entries(o.adj ?? {}).map(([x, f]) => [x, `val ${f}`]));
    return ft(d, t.w, t.h, m);
  })(), a = [], i = (t.text || r.some((d) => d.fill === !1)) && r.some((d) => d.fill !== !1) ? n.nextId("group") : null, l = i ? [...e, i] : e, g = /* @__PURE__ */ new Map();
  for (const d of r) {
    const m = `${d.fill === !1 ? "nofill" : "fill"}|${d.stroke === !1 ? "nostroke" : "stroke"}`;
    g.has(m) || g.set(m, []), g.get(m).push(d);
  }
  let b = null;
  for (const [d, m] of g) {
    const x = m.flatMap((p) => p.cmds), f = ue(x);
    if (!f) continue;
    const h = dn(un(x, -f.minX, -f.minY));
    if (!h.length) continue;
    const y = Q(n, "path", { ...t, x: t.x + f.minX, y: t.y + f.minY, w: Math.max(f.maxX - f.minX, 1), h: Math.max(f.maxY - f.minY, 1) }, l);
    !(Math.abs(f.minX + f.maxX - t.w) < 0.5 && Math.abs(f.minY + f.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && yn(y, h, t, f), y.pathSubpaths = h, y.pathAnchors = h[0].anchors, y.pathClosed = h[0].closed, d.startsWith("fill") ? Gt(y, t.fill, n) : y.backgroundColor = "transparent", d.endsWith("|stroke") ? Mt(y, t.line) : (y.strokeColor = "transparent", y.strokeWidth = 0), a.push(y), b ??= y, n.stats.paths++;
  }
  if (b && n.byPptId.set(t.id, { el: b, item: t }), t.text) {
    const d = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? Kt(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(wt(n, t.text, { ...t, x: t.x + d.l, y: t.y + d.t, w: d.r - d.l, h: d.b - d.t }, l));
  }
  return n.stats.elements += a.length, a;
}
function yn(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), l = Math.sin(a), g = e.flipH ? -1 : 1, b = e.flipV ? -1 : 1, d = (u, p) => {
    const w = (u + o.minX - s) * g, M = (p + o.minY - r) * b;
    return { x: s + w * i - M * l, y: r + w * l + M * i };
  }, m = (u, p) => {
    const w = u * g, M = p * b;
    return { x: w * i - M * l, y: w * l + M * i };
  };
  let x = 1 / 0, f = 1 / 0, h = -1 / 0, y = -1 / 0;
  for (const u of n) for (const p of u.anchors) {
    const w = d(p.x, p.y);
    if (p.x = w.x, p.y = w.y, p.inX !== void 0) {
      const M = m(p.inX, p.inY ?? 0);
      p.inX = M.x, p.inY = M.y;
    }
    if (p.outX !== void 0) {
      const M = m(p.outX, p.outY ?? 0);
      p.outX = M.x, p.outY = M.y;
    }
    x = Math.min(x, p.x), f = Math.min(f, p.y), h = Math.max(h, p.x), y = Math.max(y, p.y);
  }
  for (const u of n) for (const p of u.anchors)
    p.x -= x, p.y -= f;
  t.x = t.x - o.minX + x, t.y = t.y - o.minY + f, t.width = Math.max(h - x, 1), t.height = Math.max(y - f, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function kn(t) {
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
const Vt = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function vt(t, n, e) {
  const o = t.geom;
  let s;
  if (o.kind === "preset" && re.has(o.prst)) s = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (o.kind === "custom") s = o.paths.flatMap((w) => w.cmds);
  else {
    const w = n.presets[o.prst], M = Object.fromEntries(Object.entries(o.adj ?? {}).map(([S, v]) => [S, `val ${v}`]));
    s = w ? ft(w, t.w, t.h, M).flatMap((S) => S.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, l = (w, M) => {
    let S = w - r, v = M - a;
    return t.flipH && (S = -S), t.flipV && (v = -v), { x: t.x + r + S * Math.cos(i) - v * Math.sin(i), y: t.y + a + S * Math.sin(i) + v * Math.cos(i) };
  }, g = [];
  let b = { x: 0, y: 0 };
  for (const w of s)
    if (w.op === "M" || w.op === "L")
      b = { x: w.x, y: w.y }, g.push(l(b.x, b.y));
    else if (w.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const S = M / 12, v = 1 - S, N = v * v * v * b.x + 3 * v * v * S * w.x1 + 3 * v * S * S * w.x2 + S * S * S * w.x, P = v * v * v * b.y + 3 * v * v * S * w.y1 + 3 * v * S * S * w.y2 + S * S * S * w.y;
        g.push(l(N, P));
      }
      b = { x: w.x, y: w.y };
    }
  if (g.length < 2) return [];
  const d = Math.min(...g.map((w) => w.x)), m = Math.min(...g.map((w) => w.y)), x = Math.max(...g.map((w) => w.x)), f = Math.max(...g.map((w) => w.y)), h = t.line.head && Vt[t.line.head.type], y = t.line.tail && Vt[t.line.tail.type], u = Q(n, h || y ? "arrow" : "line", { ...t, x: d, y: m, w: Math.max(x - d, 1), h: Math.max(f - m, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  u.points = g.map((w) => ({ x: w.x - d, y: w.y - m })), u.curveType = "straight", u.startArrowhead = h ?? null, u.endArrowhead = y ?? null, Mt(u, t.line);
  const p = (w, M) => {
    if (!w) return null;
    const S = n.byPptId.get(w.id);
    if (!S || !S.el.width || !S.el.height) return null;
    const v = S.el;
    return { elementId: v.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - v.x) / v.width, anchorFractionY: (M.y + n.oy - v.y) / v.height };
  };
  return n.glue.push(() => {
    u.startBinding = p(t.start, g[0]), u.endBinding = p(t.end, g[g.length - 1]);
  }), n.stats.elements++, [u];
}
function wn(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const l = Q(n, "rectangle", t, e);
    return Object.assign(l, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [l];
  }
  const s = Q(n, "image", t, e);
  if (s.dataURL = t.grayscale && n.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = St[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), t.descr && (s.altText = t.descr), n.stats.elements++, n.stats.pictures++, !t.geom) return [s];
  const r = n.nextId("group"), a = ae({
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
function ie(t, n, e) {
  const o = [];
  for (const s of t)
    try {
      const r = [];
      switch (s.kind) {
        case "shape":
          r.push(...ae(s, n, e));
          break;
        case "connector":
          r.push(...vt(s, n, e));
          break;
        case "picture":
          r.push(...wn(s, n, e));
          break;
        case "group":
          r.push(...ie(s.children, n, [...e, n.nextId("group")]));
          break;
      }
      const a = hn(s.link, n);
      if (a)
        for (const i of r) i.link || (i.link = a);
      o.push(...r);
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function Mn(t) {
  return t ? { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function vn(t, n, e) {
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
const St = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, Sn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Cn(t) {
  let n = "";
  for (let o = 0; o < t.length; o += 32768) n += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(n);
}
async function Pn(t) {
  const n = /* @__PURE__ */ new Set(), e = (s) => {
    for (const r of s)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const s of t.slides)
    e(s.items), s.background?.kind === "image" && n.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (s) => {
    if (!Sn.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${St[s.ext]};base64,${Cn(s.bytes)}`;
    let a = 0, i = 0;
    try {
      const l = await createImageBitmap(new Blob([s.bytes], { type: St[s.ext] }));
      a = l.width, i = l.height, l.close();
    } catch {
    }
    o.set(s, { url: r, w: a, h: i });
  })), o;
}
function Tn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, a = /^pct(\d+)$/.exec(t);
  if (a) {
    const i = Math.max(1, Math.min(99, Number(a[1]))), l = i > 50, g = (l ? 100 - i : i) / 100;
    return { type: "dots", color: l ? e : n, background: l ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(g / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function In(t, n, e) {
  const o = await ve(), s = await Pn(t), r = Math.round(t.width), a = Math.round(t.height), i = he(e ?? t.title, "slides", { width: r, height: a }), l = [], g = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  i.slides = [];
  const b = await mn(t, s), d = await Promise.all(t.slides.map((f) => {
    const h = f.background, y = h?.kind === "image" ? s.get(h.media) : void 0;
    return h?.kind === "image" && y ? gn(y.url, r, a, h.tile) : void 0;
  })), m = t.slides.map(() => n("slide")), x = /* @__PURE__ */ new Map();
  return t.slides.forEach((f, h) => {
    f.key && x.set(f.key, m[h]);
  }), t.slides.forEach((f, h) => {
    const y = h * (r + an), u = Lt(m[h], f.name || `Slide ${h + 1}`, y, 0, { width: r, height: a });
    u.order = h;
    const p = { ox: y, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: l, stats: g, images: s, slideBg: d[h], gray: b, slideIds: x };
    i.elements.push(...ie(f.items, p, [])), p.glue.forEach((M) => M()), vn(u, f.background, p);
    const w = Mn(f.transition);
    w && (u.transition = w), f.notes && (u.notes = f.notes), f.hidden && (u.hidden = !0), f.advanceAfterMs && (u.advanceAfter = f.advanceAfterMs), f.section && (u.section = f.section), i.slides.push(u), g.slides++;
  }), i.slides.length || i.slides.push(Lt(void 0, "Slide 1", 0, 0, { width: r, height: a })), t.loop && (i.globalSettings = { ...i.globalSettings || {}, slideShowLoop: !0 }), { doc: i, warnings: [...new Set(l)], stats: g };
}
const Nn = 512 * 1024 * 1024;
async function Ln(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > Nn) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = rn(e), r = /* @__PURE__ */ new Set(), a = await In(o, (l) => be(l, r), n);
  xe(a.doc);
  const i = [...s, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  Ln as importPptx
};
