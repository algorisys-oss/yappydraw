import { u as ae, a as ie } from "./browser-DbZP-BrN.js";
import { E as H, i as vt, g as le } from "./custgeom-gp_HWEYw.js";
import { aq as ce, ar as Nt, as as fe, at as ue, M as de, q as he, K as pe } from "./index-v2rH-W8-.js";
const me = 1e4, ge = 1e5, Wt = 6e4, Q = (t) => t / Wt * (Math.PI / 180);
function _t(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), c = Math.max(r, a), x = {
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
  for (const [m, g] of Object.entries(x)) s.set(m, g);
  for (const m of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${m}`, r / m), s.set(`hd${m}`, a / m), s.set(`ssd${m}`, i / m);
  const b = (m) => {
    const g = s.get(m);
    if (g !== void 0) return g;
    const u = /^(wd|hd|ssd)(\d+)$/.exec(m);
    if (u) {
      const y = u[1] === "wd" ? r : u[1] === "hd" ? a : i, d = Number(u[2]);
      return d ? y / d : 0;
    }
    const h = Number(m);
    return Number.isFinite(h) ? h : 0;
  }, f = (m, g) => {
    s.size > me || s.set(m, xe(g, b));
  };
  for (const [m, g] of t.av ?? []) f(m, o[m] ?? g);
  for (const [m, g] of Object.entries(o)) s.has(m) || f(m, g);
  for (const [m, g] of t.gd ?? []) f(m, g);
  return s;
}
function xe(t, n) {
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
      i = Math.atan2(r, s) * 180 / Math.PI * Wt;
      break;
    case "cat2":
      i = s * Math.cos(Math.atan2(a, r));
      break;
    case "sat2":
      i = s * Math.sin(Math.atan2(a, r));
      break;
    case "cos":
      i = s * Math.cos(Q(r));
      break;
    case "sin":
      i = s * Math.sin(Q(r));
      break;
    case "tan":
      i = s * Math.tan(Q(r));
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
const Ot = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function lt(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * H, r = Math.max(Math.abs(e), 0) * H, a = _t(t, s, r, o), i = (b) => typeof b == "number" ? b : a.get(b) ?? (Number.isFinite(Number(b)) ? Number(b) : 0), c = [];
  let x = ge;
  for (const b of t.paths) {
    const f = b.w ? s / b.w : 1, m = b.h ? r / b.h : 1, g = (p) => i(p) * f / H, u = (p) => i(p) * m / H, h = [];
    let y = { x: 0, y: 0 }, d = { x: 0, y: 0 };
    for (const p of b.d) {
      if (--x < 0) break;
      switch (p[0]) {
        case "M":
          y = { x: g(p[1]), y: u(p[2]) }, d = y, h.push({ op: "M", ...y });
          break;
        case "L":
          y = { x: g(p[1]), y: u(p[2]) }, h.push({ op: "L", ...y });
          break;
        case "C": {
          const k = g(p[1]), M = u(p[2]), S = g(p[3]), v = u(p[4]);
          y = { x: g(p[5]), y: u(p[6]) }, h.push({ op: "C", x1: k, y1: M, x2: S, y2: v, ...y });
          break;
        }
        case "Q": {
          const k = g(p[1]), M = u(p[2]), S = g(p[3]), v = u(p[4]);
          h.push({ op: "C", x1: y.x + 2 / 3 * (k - y.x), y1: y.y + 2 / 3 * (M - y.y), x2: S + 2 / 3 * (k - S), y2: v + 2 / 3 * (M - v), x: S, y: v }), y = { x: S, y: v };
          break;
        }
        case "A": {
          const k = i(p[1]) * f / H, M = i(p[2]) * m / H;
          y = be(h, y, k, M, i(p[3]), i(p[4]));
          break;
        }
        case "Z":
          h.push({ op: "Z" }), y = d;
          break;
      }
    }
    h.length && c.push({ cmds: h, fill: b.fill === "none" ? !1 : void 0, stroke: b.stroke === !1 ? !1 : void 0 });
  }
  return c;
}
function be(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const a = Q(s), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, Q(r))), c = Ot(a, e, o);
  let x = Ot(a + i, e, o);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) x = c + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && x < c; ) x += 2 * Math.PI;
    for (; i < 0 && x > c; ) x -= 2 * Math.PI;
  }
  const b = n.x - e * Math.cos(c), f = n.y - o * Math.sin(c), m = x - c, g = Math.max(1, Math.min(16, Math.ceil(Math.abs(m) / (Math.PI / 2)))), u = m / g, h = 4 / 3 * Math.tan(u / 4);
  let y = c, d = n;
  for (let p = 0; p < g; p++) {
    const k = y + u, M = Math.cos(y), S = Math.sin(y), v = Math.cos(k), N = Math.sin(k);
    d = { x: b + e * v, y: f + o * N }, t.push({ op: "C", x1: b + e * (M - h * S), y1: f + o * (S + h * M), x2: b + e * (v + h * N), y2: f + o * (N - h * v), ...d }), y = k;
  }
  return d;
}
function Ut(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const a = _t(t, s * H, r * H, o), i = (m) => (a.get(m) ?? (Number.isFinite(Number(m)) ? Number(m) : 0)) / H, [c, x, b, f] = t.rect.map(i);
  return { l: c, t: x, r: b, b: f };
}
let Rt = null;
async function ye() {
  return Rt ??= (await import("./presets-DP49P8i2.js")).default, Rt;
}
const At = 5e4, ke = 256 * 1024 * 1024, Et = 1024 * 1024 * 1024, we = 1e4, Me = 32, ve = 2e4, I = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!n || o.localName === n) && e.push(o);
  return e;
}, l = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, R = (t, ...n) => {
  let e = t;
  for (const o of n) e = l(e, o);
  return e ?? null;
}, w = (t, n) => {
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
  const o = w(t, n), s = o === null ? NaN : Number(o);
  return Number.isFinite(s) ? s : e;
}, B = (t, n) => {
  const e = w(t, n);
  return e === null ? void 0 : e === "1" || e === "true" || e === "on";
}, L = (t) => t / H, Se = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function Ce(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = l(t, "Fallback");
  for (const e of I(t, "Choice"))
    if ((w(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => Se.has(s))) return I(e);
  return I(n);
}
const st = (t) => I(t).flatMap(Ce);
class Pe {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(n, e, o) {
    this.parseXml = e, this.warn = o, this.files = {};
    for (const [s, r] of Object.entries(n)) this.files[K(s)] = r;
  }
  bytes(n) {
    return this.files[K(n)];
  }
  xml(n) {
    const e = K(n);
    if (!this.text.has(e)) {
      const o = this.files[e];
      let s = null;
      if (o) {
        try {
          const r = ie(o).replace(/^﻿/, "");
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
    const e = K(n);
    let o = this.relCache.get(e);
    if (o) return o;
    o = /* @__PURE__ */ new Map();
    const s = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), a = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const i of I(a, "Relationship")) {
      const c = w(i, "Id"), x = w(i, "Type") || "", b = w(i, "Target") || "";
      if (!c) continue;
      const f = w(i, "TargetMode") === "External";
      o.set(c, { type: x.slice(x.lastIndexOf("/") + 1), target: f ? b : Te(s, b), external: f });
    }
    return this.relCache.set(e, o), o;
  }
  relOfType(n, e) {
    for (const o of this.rels(n).values()) if (o.type === e && !o.external) return o.target;
    return null;
  }
}
const K = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function Te(t, n) {
  let e = n.split("#")[0];
  try {
    e = decodeURIComponent(e);
  } catch {
  }
  if (e.startsWith("/")) return K(e);
  const o = (t ? t.split("/") : []).concat(e.split("/")), s = [];
  for (const r of o)
    r === ".." ? s.pop() : r && r !== "." && s.push(r);
  return s.join("/");
}
const St = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function pt(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = l(t, "themeElements");
  for (const r of I(l(e, "clrScheme"))) {
    const a = I(r)[0];
    if (!a) continue;
    const i = a.localName === "sysClr" ? w(a, "lastClr") : w(a, "val");
    i && /^[0-9a-f]{6}$/i.test(i) && (n.colors[r.localName] = "#" + i.toLowerCase());
  }
  const o = l(e, "fontScheme");
  n.major = w(R(o, "majorFont", "latin"), "typeface") || n.major, n.minor = w(R(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = l(e, "fmtScheme");
  return n.fills = I(l(s, "fillStyleLst")), n.lines = I(l(s, "lnStyleLst")), n.bgFills = I(l(s, "bgFillStyleLst")), n;
}
const Ie = {
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
}, Gt = (t) => {
  const n = t.replace("#", "");
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}, it = (t, n, e) => "#" + [t, n, e].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), J = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), _ = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function Lt(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const o = Math.max(t, n, e), s = Math.min(t, n, e), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const a = o - s, i = r > 0.5 ? a / (2 - o - s) : a / (o + s);
  return [(o === t ? (n - e) / a + (n < e ? 6 : 0) : o === n ? (e - t) / a + 2 : (t - n) / a + 4) * 60, i, r];
}
function mt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const o = e < 0.5 ? e * (1 + n) : e + n - e * n, s = 2 * e - o, r = (a) => (a = (a % 1 + 1) % 1, a < 1 / 6 ? s + (o - s) * 6 * a : a < 1 / 2 ? o : a < 2 / 3 ? s + (o - s) * (2 / 3 - a) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function $(t, n) {
  const e = I(t).find((o) => /Clr$/.test(o.localName));
  return e ? Ne(e, n) : null;
}
function Ne(t, n) {
  let e = null, o = 1;
  switch (t.localName) {
    case "srgbClr": {
      const c = w(t, "val");
      e = c && /^[0-9a-f]{6}$/i.test(c) ? "#" + c.toLowerCase() : null;
      break;
    }
    case "sysClr": {
      const c = w(t, "lastClr");
      e = c ? "#" + c.toLowerCase() : w(t, "val") === "window" ? "#ffffff" : "#000000";
      break;
    }
    case "prstClr":
      e = Ie[w(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = it(_(C(t, "r") / 1e5), _(C(t, "g") / 1e5), _(C(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [c, x, b] = mt(C(t, "hue") / 6e4, C(t, "sat") / 1e5, C(t, "lum") / 1e5);
      e = it(c, x, b);
      break;
    }
    case "schemeClr": {
      const c = w(t, "val") || "";
      if (c === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const x = n.clrMap[c] ?? St[c] ?? c;
      e = n.theme.colors[x] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, a] = Gt(e);
  for (const c of I(t)) {
    const x = C(c, "val") / 1e5;
    switch (c.localName) {
      case "alpha":
        o = x;
        break;
      case "alphaMod":
        o *= x;
        break;
      case "alphaOff":
        o += x;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [b, f, m] = Lt(s, r, a);
        c.localName === "lumMod" ? m *= x : c.localName === "lumOff" ? m += x : c.localName === "satMod" ? f *= x : c.localName === "satOff" ? f += x : c.localName === "hueMod" ? b *= x : b += C(c, "val") / 6e4, [s, r, a] = mt(b, Math.max(0, Math.min(1, f)), Math.max(0, Math.min(1, m)));
        break;
      }
      case "tint":
        [s, r, a] = [s, r, a].map((b) => _(J(b) * x + (1 - x)));
        break;
      case "shade":
        [s, r, a] = [s, r, a].map((b) => _(J(b) * x));
        break;
      case "comp": {
        const [b, f, m] = Lt(s, r, a);
        [s, r, a] = mt(b + 180, f, m);
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
  const i = { hex: it(s, r, a) };
  return o < 0.999 && (i.alpha = o), i;
}
function V(t, n) {
  for (const e of I(t)) {
    const o = Ct(e, n);
    if (o) return o;
  }
}
function Ct(t, n) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const e = $(t, n.ctx);
      return e ? { kind: "solid", color: e } : { kind: "none" };
    }
    case "gradFill": {
      const e = I(l(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: C(s, "pos") / 1e5, color: $(s, n.ctx) ?? { hex: "#000000" } }));
      if (!e.length) return { kind: "none" };
      const o = l(t, "lin");
      return l(t, "path") ? { kind: "radial", stops: e } : { kind: "linear", stops: e, angle: o ? C(o, "ang") / 6e4 : 90, scaled: B(o, "scaled") ?? !1 };
    }
    case "blipFill": {
      const e = Vt(t, n);
      if (!e) return;
      const o = { kind: "image", media: e }, s = l(t, "tile");
      s && (o.tile = { sx: Math.max(0.01, C(s, "sx", 1e5) / 1e5), sy: Math.max(0.01, C(s, "sy", 1e5) / 1e5) });
      const r = l(l(t, "blip"), "alphaModFix");
      return r && (o.alpha = Math.max(0, Math.min(1, C(r, "amt", 1e5) / 1e5))), l(l(t, "blip"), "grayscl") && (o.grayscale = !0), o;
    }
    case "pattFill": {
      const e = $(l(t, "fgClr"), n.ctx), o = $(l(t, "bgClr"), n.ctx);
      return e ? { kind: "pattern", preset: w(t, "prst") || "pct50", color: e, ...o ? { bg: o } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Oe = {
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
function Vt(t, n) {
  const e = l(t, "blip"), o = w(e, "r:embed");
  if (!o) return null;
  const s = n.pkg.rels(n.part).get(o);
  if (!s || s.external) return null;
  const r = n.pkg.bytes(s.target), a = Oe[(s.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const Re = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function U(t, n) {
  if (!t) return;
  let e;
  for (const i of I(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = $(i, n.ctx)), i.localName === "gradFill" && (e = $(l(l(i, "gsLst"), "gs"), n.ctx));
  }
  const o = w(t, "w");
  if (e === void 0 && o === null && !l(t, "prstDash") && !l(t, "headEnd") && !l(t, "tailEnd")) return;
  const s = (i) => {
    const c = w(i, "type");
    if (!c || c === "none") return;
    const x = c === "triangle" || c === "stealth" || c === "arrow" || c === "oval" || c === "diamond" ? c : "triangle", b = w(i, "len") || w(i, "w");
    return { type: x, size: b === "sm" || b === "lg" ? b : "med" };
  }, r = Re[w(l(t, "prstDash"), "val") || "solid"], a = w(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, L(Number(o) || 0)) : 1,
    color: e ?? { hex: "#000000" },
    dash: r || void 0,
    cap: a === "rnd" ? "rnd" : a === "sq" ? "sq" : a === "flat" ? "flat" : void 0,
    join: l(t, "round") ? "round" : l(t, "bevel") ? "bevel" : l(t, "miter") ? "miter" : void 0,
    head: s(l(t, "headEnd")),
    tail: s(l(t, "tailEnd"))
  };
}
function ct(t, n) {
  const e = l(t, "fillRef");
  if (!e) return;
  const o = C(e, "idx");
  if (o === 0) return { kind: "none" };
  const r = (o >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[o >= 1001 ? o - 1001 : o - 1];
  if (!r) return;
  const a = $(e, n.ctx) ?? void 0;
  return Ct(r, { ...n, ctx: { ...n.ctx, phClr: a } });
}
function Pt(t, n) {
  const e = l(t, "lnRef");
  if (!e) return;
  const o = C(e, "idx");
  if (o === 0) return null;
  const s = n.ctx.theme.lines[o - 1];
  if (!s) return;
  const r = $(e, n.ctx) ?? void 0;
  return U(s, { ...n, ctx: { ...n.ctx, phClr: r } }) ?? void 0;
}
function Y(t) {
  if (!t) return null;
  const n = l(t, "off"), e = l(t, "ext");
  return !n || !e ? null : {
    x: L(C(n, "x")),
    y: L(C(n, "y")),
    w: Math.max(0, L(C(e, "cx"))),
    h: Math.max(0, L(C(e, "cy"))),
    rot: C(t, "rot") / 6e4,
    flipH: !!B(t, "flipH"),
    flipV: !!B(t, "flipV")
  };
}
const gt = (t) => t;
function Ae(t, n) {
  const e = Y(t);
  if (!e) return n;
  const o = l(t, "chOff"), s = l(t, "chExt"), r = o ? L(C(o, "x")) : e.x, a = o ? L(C(o, "y")) : e.y, i = s ? L(C(s, "cx")) : e.w, c = s ? L(C(s, "cy")) : e.h, x = i > 0 ? e.w / i : 1, b = c > 0 ? e.h / c : 1, f = e.x + e.w / 2, m = e.y + e.h / 2, g = e.rot * Math.PI / 180;
  return (u) => {
    let h = e.x + (u.x + u.w / 2 - r) * x, y = e.y + (u.y + u.h / 2 - a) * b, d = u.rot, p = u.flipH, k = u.flipV;
    if (e.flipH && (h = 2 * f - h, p = !p, d = -d), e.flipV && (y = 2 * m - y, k = !k, d = -d), g) {
      const v = h - f, N = y - m;
      h = f + v * Math.cos(g) - N * Math.sin(g), y = m + v * Math.sin(g) + N * Math.cos(g), d += e.rot;
    }
    const M = u.w * x, S = u.h * b;
    return n({ x: h - M / 2, y: y - S / 2, w: M, h: S, rot: (d % 360 + 360) % 360, flipH: p, flipV: k });
  };
}
function Ft(t) {
  const n = l(t, "spcPts"), e = l(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, C(n, "val") / 100)) * (vt / H) };
  if (e) return { lines: Math.max(0, Math.min(13.2, C(e, "val") / 1e5)) };
}
function jt(t, n, e) {
  const o = l(t, `lvl${n + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return o ? qt(o, e) : {};
}
function qt(t, n) {
  const e = {};
  if (w(t, "algn") && (e.algn = w(t, "algn")), w(t, "marL") !== null && (e.marL = L(C(t, "marL"))), w(t, "indent") !== null && (e.indent = L(C(t, "indent"))), l(t, "buNone")) e.bullet = "none";
  else if (l(t, "buAutoNum")) {
    const a = l(t, "buAutoNum");
    e.bullet = "num", e.numType = w(a, "type") || "arabicPeriod", e.startAt = w(a, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(C(a, "startAt", 1)))) : void 0;
  } else l(t, "buChar") ? (e.bullet = "char", e.buChar = w(l(t, "buChar"), "char") || void 0) : l(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (l(t, "buFont") ? e.buFont = w(l(t, "buFont"), "typeface") || null : l(t, "buFontTx") && (e.buFont = null), l(t, "buClr") ? e.buClr = $(l(t, "buClr"), n.ctx) : l(t, "buClrTx") && (e.buClr = null), l(t, "buSzPct")) {
    const a = w(l(t, "buSzPct"), "val") || "", i = a.endsWith("%") ? parseFloat(a) / 100 : Number(a) / 1e5;
    e.buSz = Number.isFinite(i) && i > 0 ? Math.max(0.25, Math.min(4, i)) : null;
  } else (l(t, "buSzTx") || l(t, "buSzPts")) && (e.buSz = null);
  const o = R(t, "lnSpc", "spcPct");
  o && (e.lnSpcPct = C(o, "val") / 1e5);
  const s = Ft(l(t, "spcBef")), r = Ft(l(t, "spcAft"));
  return s && (e.spcBef = s), r && (e.spcAft = r), Object.assign(e, Zt(l(t, "defRPr"), n)), e;
}
function Zt(t, n) {
  if (!t) return {};
  const e = {};
  w(t, "sz") !== null && (e.sz = C(t, "sz") / 100 * (vt / H)), B(t, "b") !== void 0 && (e.b = B(t, "b")), B(t, "i") !== void 0 && (e.i = B(t, "i")), w(t, "u") && (e.u = w(t, "u") !== "none"), w(t, "strike") && (e.strike = w(t, "strike") !== "noStrike");
  const o = l(t, "solidFill");
  o ? e.color = $(o, n.ctx) : l(t, "noFill") && (e.color = null);
  const s = w(l(t, "latin"), "typeface");
  return s && (e.font = s), e;
}
const Ee = {
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
}, Le = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Fe(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const o = (n || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && Ee[e] || "•" : o === "symbol" ? Le[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const Dt = (...t) => {
  const n = {};
  for (const e of t) for (const [o, s] of Object.entries(e)) s !== void 0 && (n[o] = s);
  return n;
};
function je(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function Tt(t, n, e) {
  if (!t) return;
  const o = I(t, "p");
  if (!o.some((g) => I(g).some((u) => (u.localName === "r" || u.localName === "fld") && (R(u, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const g of [...n.bodyPr, l(t, "bodyPr")]) {
    if (!g) continue;
    for (let h = 0; h < g.attributes.length; h++) r[g.attributes[h].localName ?? g.attributes[h].name] = g.attributes[h].value;
    const u = l(g, "normAutofit");
    u && (a = w(u, "fontScale") !== null ? C(u, "fontScale") / 1e5 : 1), u && (i = 1 - Math.max(0, Math.min(0.9, C(u, "lnSpcReduction") / 1e5))), (l(g, "noAutofit") || l(g, "spAutoFit")) && (a = 1, i = 1);
  }
  const c = (g, u) => r[g] !== void 0 ? L(Number(r[g]) || 0) : L(u), x = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", b = l(t, "lstStyle"), f = [];
  let m;
  for (const g of o) {
    const u = l(g, "pPr"), h = Math.max(0, Math.min(8, C(u, "lvl"))), y = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, d = Dt(...n.levels.map((P) => jt(P, h, e)), y, jt(b, h, e), u ? qt(u, e) : {});
    d.lnSpcPct !== void 0 && m === void 0 && (m = d.lnSpcPct);
    const p = { runs: [], align: d.algn === "ctr" ? "ctr" : d.algn === "r" ? "r" : (d.algn === "just", "l"), level: h };
    if (d.bullet === "char" || d.bullet === "num") {
      if (p.bullet = d.bullet, p.marL = d.marL ?? 0, p.indent = d.indent ?? 0, d.bullet === "char") {
        const P = Fe(d.buChar, d.buFont ?? void 0);
        P !== "•" && (p.bulletChar = P);
      } else
        d.numType && d.numType !== "arabicPeriod" && (p.numType = d.numType), d.startAt && d.startAt !== 1 && (p.startAt = d.startAt);
      d.buClr && (p.bulletColor = d.buClr), d.buSz && Math.abs(d.buSz - 1) > 1e-3 && (p.bulletScale = d.buSz);
    }
    const k = (P) => {
      const T = Dt(d, Zt(P, e)), A = (T.sz ?? 18 * vt / H) * a, E = T.color === null ? void 0 : T.color ?? Kt("tx1", e);
      return {
        text: "",
        size: A,
        bold: T.b || void 0,
        italic: T.i || void 0,
        underline: T.u || void 0,
        strike: T.strike || void 0,
        color: E ?? void 0,
        font: je(T.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const P of I(g))
      if (P.localName === "r" || P.localName === "fld") {
        const T = R(P, "t")?.textContent ?? "";
        if (!T) continue;
        T.split(/[\v\n]/).forEach((A, E) => {
          E > 0 && p.runs.push({ ...k(l(P, "rPr")), br: !0 }), A && p.runs.push({ ...k(l(P, "rPr")), text: A });
        });
      } else P.localName === "br" && p.runs.push({ ...k(l(P, "rPr")), br: !0 });
    p.endSize = k(l(g, "endParaRPr")).size;
    const M = (p.runs.length ? Math.max(...p.runs.map((P) => P.size ?? 0)) : p.endSize ?? 0) * 1.2 * (d.lnSpcPct ?? 1), S = (P) => P ? ("px" in P ? P.px : P.lines * M) * i : 0, v = S(d.spcBef), N = S(d.spcAft);
    v > 0.05 && (p.spaceBefore = Math.round(v * 100) / 100), N > 0.05 && (p.spaceAfter = Math.round(N * 100) / 100), f.push(p);
  }
  return {
    paragraphs: f,
    anchor: x,
    insets: { l: c("lIns", 91440), t: c("tIns", 45720), r: c("rIns", 91440), b: c("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: m
  };
}
const Kt = (t, n) => {
  const e = n.ctx.clrMap[t] ?? St[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, q = (t) => {
  const n = l(t, "ph");
  return n ? { type: w(n, "type") || "obj", idx: C(n, "idx") } : null;
}, tt = (t) => l(I(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), ot = /* @__PURE__ */ new Set(["title", "ctrTitle"]), $t = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Bt = (t, n) => t === n || ot.has(t) && ot.has(n) || !$t.has(t) && !$t.has(n);
function ft(t, n) {
  const e = De(t);
  if (n.idx) {
    const o = e.find((s) => s.ph.idx === n.idx && Bt(s.ph.type, n.type));
    if (o) return o.el;
  }
  return (e.find((o) => o.ph.type === n.type && (o.ph.idx === n.idx || !n.idx || ot.has(n.type))) ?? e.find((o) => o.ph.type === n.type) ?? e.find((o) => Bt(o.ph.type, n.type)))?.el ?? null;
}
function De(t) {
  const n = [];
  for (const e of st(t)) {
    const o = q(tt(e));
    o && n.push({ el: e, ph: o });
  }
  return n;
}
const Qt = (t) => ot.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", $e = (t) => {
  const n = {};
  for (const e of I(l(t, "avLst"), "gd")) {
    const o = w(e, "name"), s = w(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function Be(t) {
  const n = (r) => I(r, "gd").slice(0, 1e4).map((a) => [w(a, "name") || "", w(a, "fmla") || "val 0"]), e = I(l(t, "cxnLst"), "cxn").map((r) => [w(r, "ang") || "0", w(l(r, "pos"), "x") || "0", w(l(r, "pos"), "y") || "0"]), o = l(t, "rect"), s = I(l(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const c of I(r)) {
      const x = I(c, "pt").map((b) => [w(b, "x") || "0", w(b, "y") || "0"]).flat();
      switch (c.localName) {
        case "moveTo":
          a.push(["M", ...x]);
          break;
        case "lnTo":
          a.push(["L", ...x]);
          break;
        case "quadBezTo":
          a.push(["Q", ...x]);
          break;
        case "cubicBezTo":
          a.push(["C", ...x]);
          break;
        case "arcTo":
          a.push(["A", w(c, "wR") || "0", w(c, "hR") || "0", w(c, "stAng") || "0", w(c, "swAng") || "0"]);
          break;
        case "close":
          a.push(["Z"]);
          break;
      }
    }
    const i = w(r, "fill");
    return { w: C(r, "w") || void 0, h: C(r, "h") || void 0, fill: i && i !== "norm" ? i : void 0, stroke: B(r, "stroke") === !1 ? !1 : void 0, d: a };
  });
  return {
    av: I(l(t, "avLst"), "gd").map((r) => [w(r, "name") || "", w(r, "fmla") || "val 0"]),
    gd: n(l(t, "gdLst")),
    cxn: e,
    rect: o ? [w(o, "l") || "l", w(o, "t") || "t", w(o, "r") || "r", w(o, "b") || "b"] : null,
    paths: s
  };
}
function et(t, n) {
  const e = l(t, "prstGeom");
  if (e) {
    const s = {};
    for (const [r, a] of Object.entries($e(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (s[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: w(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = l(t, "custGeom");
  if (o) {
    const s = Be(o);
    return { geom: { kind: "custom", paths: lt(s, n.w, n.h) }, textRect: s.rect ? Ut(s, n.w, n.h) : void 0 };
  }
}
function nt(t, n, e, o, s, r) {
  const a = [];
  if (s > Me)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of st(t)) {
    if (++e.count > ve) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const c = He(i, n, e, o, s, r);
      c && a.push(...Array.isArray(c) ? c : [c]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
}
const ze = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function Xe(t, n, e) {
  const o = l(t, "hlinkClick");
  if (!o) return;
  const s = w(o, "action") || "", r = e.rels(n).get(w(o, "r:id") || "");
  if (s.startsWith("ppaction://hlinkshowjump")) {
    const a = ze[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return a ? { kind: "action", action: a } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function He(t, n, e, o, s, r) {
  const a = I(t).find((x) => x.localName.startsWith("nv")), i = Ye(t, n, e, o, s, r), c = i ? Xe(l(a ?? null, "cNvPr"), n.part, e.pkg) : void 0;
  if (c) for (const x of Array.isArray(i) ? i : [i]) x.link = c;
  return i;
}
function Ye(t, n, e, o, s, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = I(t).find((f) => f.localName.startsWith("nv")), c = l(i ?? null, "cNvPr"), x = C(c, "id"), b = w(c, "name") || t.localName;
  if (w(c, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Ue(t, n, e, o, x, b, r);
    case "cxnSp": {
      const f = l(t, "spPr"), m = Y(l(f, "xfrm"));
      if (!m) return null;
      const g = o(m), u = l(t, "style"), h = U(l(f, "ln"), a) ?? Pt(u, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!h) return null;
      const y = et(f, g) ?? { geom: { kind: "preset", prst: "line" } }, d = (k) => k ? { id: C(k, "id"), idx: C(k, "idx") } : void 0, p = l(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: x, name: b, ...g, geom: y.geom, line: h, start: d(l(p, "stCxn")), end: d(l(p, "endCxn")) };
    }
    case "pic": {
      const f = l(t, "spPr");
      let m = Y(l(f, "xfrm"));
      const g = q(l(i ?? null, "nvPr"));
      if (!m && g && (m = We(g, e)), !m) return null;
      const u = l(t, "blipFill"), h = u ? Vt(u, a) : null;
      if (!h)
        return e.warnings.push(`Picture "${b}" has no image the importer can read.`), null;
      const y = l(u, "srcRect"), d = y ? { l: C(y, "l") / 1e5, t: C(y, "t") / 1e5, r: C(y, "r") / 1e5, b: C(y, "b") / 1e5 } : void 0, p = w(R(u, "blip", "alphaModFix"), "amt"), k = o(m), M = et(f, k)?.geom, S = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: x, name: b, ...k, media: h, crop: d, alpha: p !== null ? Number(p) / 1e5 : void 0, descr: w(c, "descr") || void 0, geom: S, ...R(u, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const f = l(t, "grpSpPr"), m = l(f, "xfrm"), g = Ae(m, o), u = nt(t, n, e, g, s + 1, r);
      if (!u.length) return null;
      const h = ut(u);
      return { kind: "group", id: x, name: b, ...h, children: u };
    }
    case "graphicFrame":
      return qe(t, n, e, o, x, b, s);
    default:
      return null;
  }
}
function ut(t) {
  let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
  for (const r of t)
    n = Math.min(n, r.x), e = Math.min(e, r.y), o = Math.max(o, r.x + r.w), s = Math.max(s, r.y + r.h);
  return { x: n, y: e, w: Math.max(0, o - n), h: Math.max(0, s - e) };
}
function We(t, n) {
  const e = ft(n.layout?.tree ?? null, t), o = Y(R(e, "spPr", "xfrm"));
  if (o) return o;
  const s = ft(n.master?.tree ?? null, { type: Qt(t.type), idx: 0 });
  return Y(R(s, "spPr", "xfrm"));
}
function _e(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function Ue(t, n, e, o, s, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = tt(t), x = q(c);
  if (x && !a) return null;
  const b = l(t, "spPr"), f = l(t, "style"), m = w(R(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", g = x && e.layout ? ft(e.layout.tree, x) : null, u = x && e.master ? ft(e.master.tree, { type: Qt(g ? q(tt(g))?.type ?? x.type : x.type), idx: 0 }) : null, h = g && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, y = u && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let d = Y(l(b, "xfrm")) ?? Y(R(g, "spPr", "xfrm")) ?? Y(R(u, "spPr", "xfrm"));
  if (!d) return null;
  d = o(d);
  const p = et(b, d) ?? (g ? et(l(g, "spPr"), d) : void 0) ?? (u ? et(l(u, "spPr"), d) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (B(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? V(b, i) ?? ct(f, i) ?? (h ? V(l(g, "spPr"), h) : void 0) ?? (y ? V(l(u, "spPr"), y) : void 0) ?? (h ? ct(l(g, "style"), h) : void 0) ?? { kind: "none" }, S = _e(
    () => U(l(b, "ln"), i),
    () => Pt(f, i),
    () => h ? U(R(g, "spPr", "ln"), h) : void 0,
    () => y ? U(R(u, "spPr", "ln"), y) : void 0
  ) ?? null, v = [];
  if (x) {
    const j = g ? q(tt(g))?.type ?? x.type : x.type;
    v.push(ot.has(j) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(j) ? e.masterTx.body : e.masterTx.other), v.push(R(u, "txBody", "lstStyle"), R(g, "txBody", "lstStyle"));
  } else
    v.push(e.defaultText);
  const N = l(f, "fontRef"), P = {
    levels: v,
    bodyPr: [R(u, "txBody", "bodyPr"), R(g, "txBody", "bodyPr")],
    fontRef: N ? { font: w(N, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: $(N, i.ctx) } : void 0
  }, T = Tt(l(t, "txBody"), P, i);
  if (!(M.kind !== "none" || !!S || !!T)) return null;
  let E = p.textRect;
  const O = Y(l(b, "xfrm")), z = T ? Y(l(t, "txXfrm")) : null;
  if (z && O && O.w > 0 && O.h > 0) {
    const j = d.w / O.w, W = d.h / O.h, X = { l: (z.x - O.x) * j, t: (z.y - O.y) * W, r: (z.x + z.w - O.x) * j, b: (z.y + z.h - O.y) * W };
    (Math.abs(X.l) > 0.5 || Math.abs(X.t) > 0.5 || Math.abs(X.r - d.w) > 0.5 || Math.abs(X.b - d.h) > 0.5) && (E = X);
  }
  return { kind: "shape", id: s, name: r, ...d, geom: p.geom, fill: M, line: S, text: T, textBox: m || void 0, textRect: E };
}
const zt = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function Ge(t, n) {
  const e = {};
  if (!t) return e;
  const o = l(t, "tcStyle"), s = l(t, "tcTxStyle"), r = l(o, "fill"), a = r ? V(r, n) : ct(o, n);
  a && (e.fill = a);
  const i = $(s, n.ctx) ?? $(l(s, "fontRef"), n.ctx);
  i && (e.text = i), w(s, "b") === "on" && (e.bold = !0);
  const c = l(o, "tcBdr");
  for (const x of ["insideH", "bottom", "top", "left"]) {
    const b = l(c, x);
    if (!b) continue;
    const f = U(l(b, "ln"), n) ?? Pt(b, n);
    if (f !== void 0) {
      e.border = f;
      break;
    }
  }
  return e;
}
function Ve(t, n, e) {
  const o = ((l(t, "tableStyleId")?.textContent || "").trim() || w(e, "def") || zt).toUpperCase(), s = (f) => B(t, f) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, a = I(e, "tblStyle").find((f) => (w(f, "styleId") || "").toUpperCase() === o);
  if (a) {
    const f = (y) => Ge(l(a, y), n), m = l(a, "tblBg"), g = m ? l(m, "fill") ? V(l(m, "fill"), n) : ct(m, n) : void 0, u = {
      whole: f("wholeTbl"),
      b1H: f("band1H"),
      b2H: f("band2H"),
      b1V: f("band1V"),
      b2V: f("band2V"),
      firstRow: f("firstRow"),
      lastRow: f("lastRow"),
      firstCol: f("firstCol"),
      lastCol: f("lastCol")
    }, h = (y, d, p, k) => {
      const M = [u.whole], S = y - (r.firstRow ? 1 : 0), v = d - (r.firstCol ? 1 : 0);
      r.bandCol && v >= 0 && M.push(v % 2 === 0 ? u.b1V : u.b2V), r.bandRow && S >= 0 && M.push(S % 2 === 0 ? u.b1H : u.b2H), r.firstCol && d === 0 && M.push(u.firstCol), r.lastCol && d === k - 1 && M.push(u.lastCol), r.firstRow && y === 0 && M.push(u.firstRow), r.lastRow && y === p - 1 && M.push(u.lastRow);
      const N = {};
      for (const P of M)
        P.fill && (N.fill = P.fill), P.text && (N.text = P.text), P.bold && (N.bold = !0), P.border !== void 0 && (N.border = P.border);
      return N;
    };
    return g && g.kind !== "none" && (h.background = g), h;
  }
  if (o !== zt) return null;
  const i = n.ctx.theme.colors.accent1 ?? "#4472c4", c = (f) => {
    const [m, g, u] = Gt(i);
    return { hex: it(_(J(m) * f + (1 - f)), _(J(g) * f + (1 - f)), _(J(u) * f + (1 - f))) };
  }, x = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, b = Kt("tx1", n) ?? void 0;
  return (f) => {
    const m = r.firstRow && f === 0, g = r.bandRow && !m && (f - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: m ? { hex: i } : c(g ? 0.4 : 0.2) },
      text: m ? x : b,
      bold: m || void 0,
      border: { width: 1.33, color: x }
    };
  };
}
function qe(t, n, e, o, s, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = Y(l(t, "xfrm"));
  if (!c) return null;
  const x = R(t, "graphic", "graphicData"), b = l(x, "tbl");
  if (b) {
    const g = I(l(b, "tblGrid"), "gridCol").map((k) => L(C(k, "w"))), u = Ve(l(b, "tblPr"), i, e.tableStyles), h = [];
    let y = c.y, d = 1e6 + s * 1e3;
    const p = I(b, "tr");
    if (p.forEach((k, M) => {
      const S = L(C(k, "h"));
      let v = c.x, N = 0;
      for (const P of I(k, "tc")) {
        const T = Math.max(1, C(P, "gridSpan", 1)), A = g.slice(N, N + T).reduce((G, F) => G + F, 0);
        if (N += T, B(P, "hMerge") || B(P, "vMerge")) {
          v += A;
          continue;
        }
        const E = Math.max(1, C(P, "rowSpan", 1)), O = l(P, "tcPr"), z = E > 1 ? S * E : S, j = u ? u(M, N - T, p.length, g.length) : null, W = j?.text ? { color: j.text } : void 0, X = Tt(l(P, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: W }, i);
        X && j?.bold && X.paragraphs.forEach((G) => G.runs.forEach((F) => {
          F.bold === void 0 && (F.bold = !0);
        })), X && (X.insets = { l: L(C(O, "marL", 91440)), r: L(C(O, "marR", 91440)), t: L(C(O, "marT", 45720)), b: L(C(O, "marB", 45720)) }, X.anchor = w(O, "anchor") === "ctr" ? "ctr" : w(O, "anchor") === "b" ? "b" : "t");
        const dt = U(l(O, "lnB"), i) ?? U(l(O, "lnT"), i) ?? (j ? j.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), rt = j?.fill;
        h.push({
          kind: "shape",
          id: d++,
          name: `${r} cell`,
          ...o({ x: v, y, w: A, h: z, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: V(O, i) ?? rt ?? { kind: "none" },
          line: dt,
          text: X
        }), v += A;
      }
      y += S;
    }), !h.length) return null;
    if (u?.background) {
      const k = ut(h);
      h.unshift({
        kind: "shape",
        id: d++,
        name: `${r} background`,
        x: k.x,
        y: k.y,
        w: k.w,
        h: k.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: u.background,
        line: null
      });
    }
    return { kind: "group", id: s, name: r, ...ut(h), children: h };
  }
  const f = w(x, "uri") || "";
  if (/diagram/.test(f)) {
    const g = Ze(x, n, e, o, c, s, r, a);
    if (g) return g;
    const u = Ke(x, n, e, o, c, s, r, i);
    if (u) return u;
  }
  const m = /chart/.test(f) ? "Chart" : /diagram/.test(f) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${m} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(c),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${m}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function Ze(t, n, e, o, s, r, a, i) {
  const c = e.pkg.rels(n.part), x = w(l(t, "relIds"), "r:dm"), b = x ? c.get(x) : void 0;
  let f;
  if (b && !b.external) {
    const d = Jt(e.pkg.xml(b.target), "dataModelExt", 6), p = d ? c.get(w(d, "relId") || "") : void 0;
    p && !p.external && (f = p.target);
  }
  if (!f) {
    const d = [...c.values()].filter((p) => p.type === "diagramDrawing" && !p.external);
    d.length === 1 && (f = d[0].target);
  }
  if (!f) return null;
  const m = l(e.pkg.xml(f), "spTree");
  if (!m) return null;
  const u = nt(m, { part: f, tree: m }, e, (d) => o({ ...d, x: d.x + s.x, y: d.y + s.y }), i + 1, !0);
  if (!u.length) return null;
  let h = 2e6 + r * 1e3;
  const y = (d) => d.forEach((p) => {
    p.id = h++, p.kind === "group" && y(p.children);
  });
  return y(u), { kind: "group", id: r, name: a, ...ut(u), children: u };
}
function Ke(t, n, e, o, s, r, a, i) {
  const c = w(l(t, "relIds"), "r:dm"), x = c ? e.pkg.rels(n.part).get(c) : void 0;
  if (!x || x.external) return null;
  const b = e.pkg.xml(x.target), f = /* @__PURE__ */ new Map();
  for (const d of I(l(b, "ptLst"), "pt")) f.set(w(d, "modelId") || "", d);
  const m = /* @__PURE__ */ new Map();
  for (const d of I(l(b, "cxnLst"), "cxn")) {
    if ((w(d, "type") || "parOf") !== "parOf") continue;
    const p = w(d, "srcId") || "", k = w(d, "destId") || "";
    m.has(p) || m.set(p, []), m.get(p).push({ id: k, ord: C(d, "srcOrd") });
  }
  const g = [...f.values()].find((d) => w(d, "type") === "doc");
  if (!g) return null;
  const u = [], h = /* @__PURE__ */ new Set(), y = (d, p) => {
    if (!(h.has(d) || p > 16 || u.length > 500)) {
      h.add(d);
      for (const k of (m.get(d) ?? []).sort((M, S) => M.ord - S.ord)) {
        const M = f.get(k.id), S = w(M, "type") || "node";
        if (!M || S !== "node" && S !== "asst") continue;
        const v = Tt(l(M, "t"), { levels: [e.defaultText], bodyPr: [] }, i);
        for (const N of v?.paragraphs ?? [])
          N.runs.some((P) => !P.br && P.text.trim()) && u.push({
            ...N,
            align: "l",
            level: p,
            ...p > 0 ? { bullet: "char" } : {},
            runs: N.runs.map((P) => ({ ...P, size: P.size ?? (p > 0 ? 16 : 18), bold: P.bold ?? (p === 0 ? !0 : void 0) }))
          });
        y(k.id, p + 1);
      }
    }
  };
  return y(w(g, "modelId") || "", 0), u.length ? (e.warnings.push(`SmartArt diagram "${a}" had no saved drawing; its text was imported as a list.`), {
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
function Jt(t, n, e) {
  if (!t || e < 0) return null;
  for (const o of st(t)) {
    if (o.localName === n) return o;
    const s = Jt(o, n, e - 1);
    if (s) return s;
  }
  return null;
}
function xt(t, n) {
  const e = l(t, "bg");
  if (!e) return;
  const o = l(e, "bgPr");
  if (o)
    return V(o, n);
  const s = l(e, "bgRef");
  if (s) {
    const r = C(s, "idx"), i = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (i ? Ct(i, { ...n, ctx: { ...n.ctx, phClr: $(s, n.ctx) ?? void 0 } }) : void 0) ?? ($(s, n.ctx) ? { kind: "solid", color: $(s, n.ctx) } : void 0);
  }
}
function Qe(t, n) {
  const e = t.relOfType(n, "notesSlide"), o = e ? R(t.xml(e), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (i) => {
    for (const c of st(i)) {
      if (c.localName === "grpSp") {
        r(c);
        continue;
      }
      if (c.localName !== "sp") continue;
      const x = q(tt(c));
      if (!(!x || x.type !== "body" && x.type !== "obj"))
        for (const b of I(l(c, "txBody"), "p")) {
          let f = "";
          for (const m of I(b))
            m.localName === "r" || m.localName === "fld" ? f += l(m, "t")?.textContent ?? "" : m.localName === "br" && (f += `
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
function Je(t) {
  const n = st(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = I(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!e) return;
  const o = w(n, "spd"), s = w(n, "p14:dur") !== null ? C(n, "p14:dur") : o === "fast" ? 500 : o === "slow" ? 1e3 : 750, r = w(e, "dir");
  switch (e.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: "push", dir: r === "r" || r === "u" || r === "d" ? r : "l", durationMs: s };
    case "zoom":
      return { kind: "zoom", zoomIn: r !== "out", durationMs: s };
    case "cut":
      return;
    default:
      return { kind: "fade", durationMs: s };
  }
}
function tn(t, n = {}) {
  const e = [], o = (T) => {
    e.length < 200 && !e.includes(T) && e.push(T);
  }, s = n.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = ae(t, {
      filter: (T) => (a++, i += T.originalSize, a <= At && T.originalSize <= ke && i <= Et)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > At || i > Et) && o("The file is very large; some parts were skipped.");
  const c = new Pe(r, s, o), x = c.relOfType("", "officeDocument") ?? "ppt/presentation.xml", b = c.xml(x);
  if (!b || b.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const f = l(b, "sldSz"), m = f ? Math.max(1, L(C(f, "cx", 9144e3))) : 960, g = f ? Math.max(1, L(C(f, "cy", 5143500))) : 540, u = l(b, "defaultTextStyle"), h = c.rels(x), y = c.relOfType(x, "tableStyles"), d = y ? c.xml(y) : null, p = [], k = /* @__PURE__ */ new Set();
  for (const T of I(l(b, "sldIdLst"), "sldId")) {
    const A = h.get(w(T, "r:id") || "");
    A && !k.has(A.target) && p.length < we && (k.add(A.target), p.push(A.target));
  }
  const M = /* @__PURE__ */ new Map(), S = (T) => {
    const A = c.relOfType(T, "theme");
    return A ? (M.has(A) || M.set(A, pt(c.xml(A))), M.get(A)) : pt(null);
  }, v = (T) => {
    if (!T) return null;
    const A = {};
    for (let E = 0; E < T.attributes.length; E++) A[T.attributes[E].localName ?? T.attributes[E].name] = T.attributes[E].value;
    return A;
  }, N = [];
  p.forEach((T, A) => {
    const E = c.xml(T);
    if (!E) {
      o(`Slide ${A + 1} couldn't be read and was skipped.`);
      return;
    }
    const O = c.relOfType(T, "slideLayout"), z = O ? c.xml(O) : null, j = O ? c.relOfType(O, "slideMaster") : null, W = j ? c.xml(j) : null, X = j ? S(j) : pt(null), dt = v(R(E, "clrMapOvr", "overrideClrMapping")) ?? v(R(z, "clrMapOvr", "overrideClrMapping")) ?? v(l(W, "clrMap")) ?? St, rt = { theme: X, clrMap: dt }, G = l(W, "txStyles"), F = {
      pkg: c,
      ctx: rt,
      slide: { part: T, tree: R(E, "cSld", "spTree") },
      layout: O ? { part: O, tree: R(z, "cSld", "spTree") } : null,
      master: j ? { part: j, tree: R(W, "cSld", "spTree") } : null,
      masterTx: { title: l(G, "titleStyle"), body: l(G, "bodyStyle"), other: l(G, "otherStyle") },
      defaultText: u,
      warnings: e,
      count: 0,
      tableStyles: d
    }, ht = (re) => ({ pkg: c, part: re?.part ?? T, ctx: rt }), It = xt(l(E, "cSld"), ht(F.slide)) ?? xt(l(z, "cSld"), ht(F.layout)) ?? xt(l(W, "cSld"), ht(F.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    F.background = It;
    const at = [], se = B(E, "showMasterSp") !== !1 && B(z, "showMasterSp") !== !1;
    F.master && se && at.push(...nt(F.master.tree, F.master, F, gt, 0, !1)), F.layout && B(E, "showMasterSp") !== !1 && at.push(...nt(F.layout.tree, F.layout, F, gt, 0, !1)), at.push(...nt(F.slide.tree, F.slide, F, gt, 0, !0)), N.push({ items: at, background: It, transition: Je(E), name: w(l(E, "cSld"), "name") || void 0, notes: Qe(c, T), key: T });
  }), N.length || o("The presentation has no slides.");
  const P = R(c.xml("docProps/core.xml"), "title")?.textContent || void 0;
  return { deck: { width: m, height: g, slides: N, title: P }, warnings: e };
}
const en = 80, nn = "default-layer", D = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, on = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, sn = /(courier|consolas|mono|menlo|code)/i;
function Xt(t) {
  if (!t) return "sans-serif";
  const n = de(t);
  return n || (sn.test(t) ? "monospace" : on.test(t) ? "serif" : "sans-serif");
}
function rn(t) {
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
const an = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
function ln(t, n) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return fe(t.action);
  const e = n.slideIds?.get(t.key);
  return e ? ue(e) : null;
}
async function cn(t) {
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
async function fn(t, n) {
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
    const a = await cn(r);
    a && s.set(r, a);
  })), s;
}
async function un(t, n, e, o) {
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
function Z(t, n, e, o) {
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
    layerId: nn,
    groupIds: [...o].reverse(),
    // innermost first, the store's convention
    name: e.name
  };
}
function Ht(t, n, e) {
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
      t.backgroundColor = D(n.color), t.fillStyle = "pattern", t.patternFill = Mn(n.preset, D(n.color), n.bg ? D(n.bg) : "transparent");
      break;
    }
    case "image": {
      const o = e.images.get(n.media);
      o && (t.fillStyle = "image", t.backgroundImage = n.grayscale && e.gray.get(o.url) || o.url, t.backgroundColor = "#ffffff"), o && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
      break;
    }
  }
}
function kt(t, n) {
  if (!n || !(n.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = D(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function dn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function hn(t, n) {
  const e = t.bullet === "num" ? dn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && D(t.bulletColor) !== D(o) && (e.listMarkerColor = D(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const bt = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function te(t, n) {
  const e = t.paragraphs.flatMap((h) => h.runs.filter((y) => !y.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (h) => h.runs.reduce((y, d) => y + (d.br ? 0 : d.text.trim().length), 0);
  for (const h of t.paragraphs) {
    const y = a(h);
    y && r.set(h.align ?? "l", (r.get(h.align ?? "l") ?? 0) + y);
  }
  const i = [...r].sort((h, y) => y[1] - h[1])[0]?.[0] ?? t.paragraphs.find((h) => h.runs.length)?.align ?? "l", c = (h) => a(h) > 0 && (h.align ?? "l") !== i ? h.align === "ctr" ? "center" : h.align === "r" ? "right" : "left" : void 0, x = e.every((h) => h.size === o?.size && h.bold === o?.bold && h.italic === o?.italic && h.underline === o?.underline && h.strike === o?.strike && h.font === o?.font && D(h.color) === D(o?.color)) && !t.paragraphs.some((h) => h.bullet) && !t.paragraphs.some((h, y) => y > 0 && bt(t, y) > 0) && !t.paragraphs.some(c), b = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Xt(o?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: D(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (b.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const f = t.paragraphs.map((h) => h.runs.map((y) => y.br ? `
` : y.text).join("")).join(`
`);
  if (x)
    return o?.bold && (b.fontWeight = 700), o?.italic && (b.fontStyle = "italic"), n ? b.containerText = f : b.text = f, { fields: b, rich: !1 };
  const m = [], g = [], u = [];
  return t.paragraphs.forEach((h, y) => {
    const d = h.level ?? 0;
    if (h.bullet === "num") {
      const M = h.numType ?? "arabicPeriod";
      (g[d] === void 0 || u[d] !== M) && (g[d] = (h.startAt ?? 1) - 1), g[d]++, u[d] = M, g.length = d + 1, u.length = d + 1;
    } else
      g.length = Math.min(g.length, d), u.length = g.length;
    const p = h.bullet ? { listType: h.bullet === "num" ? "ordered" : "bullet", listLevel: d, ...hn(h, t) } : {};
    h.bullet === "num" && (p.listIndex = g[d]), (h.runs.length ? h.runs : [{ text: "" }]).forEach((M, S) => {
      const v = { text: M.br ? `
` : M.text, ...S === 0 ? p : {} };
      S === 0 && y > 0 && bt(t, y) > 0 && (v.paragraphSpaceBefore = bt(t, y));
      const N = c(h);
      N && (v.paragraphAlign = N), M.bold && (v.bold = !0), M.italic && (v.italic = !0), M.underline && (v.underline = !0), M.strike && (v.strikethrough = !0), M.color && (v.color = D(M.color)), M.size && (v.fontSize = Math.round(M.size * 10) / 10), M.font && (v.fontFamily = Xt(M.font)), m.push(v);
    }), y < t.paragraphs.length - 1 && m.push({ text: `
` });
  }), n ? (b.richContainerText = m, b.containerText = f) : (b.richText = m, b.text = f), { fields: b, rich: !0 };
}
function yt(t, n, e, o, s) {
  const { fields: r, rich: a } = te(n, !1), i = 4, c = Z(t, a ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - i,
    y: e.y + n.insets.t - i,
    w: Math.max(e.w - n.insets.l - n.insets.r + i * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + i * 2, 8)
  }, o);
  return Object.assign(c, r, { autoResize: !n.wrap, strokeColor: r.textColor }), c;
}
const ee = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function ne(t, n, e) {
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return n.stats.elements++, [yt(n, t.text, t, e)];
  if (o.kind === "preset" && ee.has(o.prst)) return wt({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((f) => !f.cmds.some((m) => m.op === "Z")))
    return wt({ ...t, kind: "connector", line: t.line }, n, e);
  const s = mn(t);
  if (s) {
    const f = Z(n, s.type, t, e);
    Object.assign(f, s.extra), Ht(f, t.fill, n), kt(f, t.line), n.byPptId.set(t.id, { el: f, item: t }), n.stats.elements++;
    const m = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, g = t.text?.insets, u = Math.abs(m.l) > 0.5 || Math.abs(m.t) > 0.5 || Math.abs(m.r - t.w) > 0.5 || Math.abs(m.b - t.h) > 0.5, h = !!g && Math.max(g.l, g.r, g.t, g.b) > 16;
    if (t.text && (u || h)) {
      const y = n.nextId("group");
      return f.groupIds = [...e, y].reverse(), n.stats.elements++, [f, yt(n, t.text, { ...t, rot: 0, x: t.x + m.l, y: t.y + m.t, w: m.r - m.l, h: m.b - m.t }, [...e, y])];
    }
    if (t.text) {
      const { fields: y } = te(t.text, !0);
      Object.assign(f, y);
    }
    return [f];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const f = n.presets[o.prst];
    if (!f)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), lt(n.presets.rect, t.w, t.h);
    const m = Object.fromEntries(Object.entries(o.adj ?? {}).map(([g, u]) => [g, `val ${u}`]));
    return lt(f, t.w, t.h, m);
  })(), a = [], i = (t.text || r.some((f) => f.fill === !1)) && r.some((f) => f.fill !== !1) ? n.nextId("group") : null, c = i ? [...e, i] : e, x = /* @__PURE__ */ new Map();
  for (const f of r) {
    const m = `${f.fill === !1 ? "nofill" : "fill"}|${f.stroke === !1 ? "nostroke" : "stroke"}`;
    x.has(m) || x.set(m, []), x.get(m).push(f);
  }
  let b = null;
  for (const [f, m] of x) {
    const g = m.flatMap((p) => p.cmds), u = le(g);
    if (!u) continue;
    const h = rn(an(g, -u.minX, -u.minY));
    if (!h.length) continue;
    const y = Z(n, "path", { ...t, x: t.x + u.minX, y: t.y + u.minY, w: Math.max(u.maxX - u.minX, 1), h: Math.max(u.maxY - u.minY, 1) }, c);
    !(Math.abs(u.minX + u.maxX - t.w) < 0.5 && Math.abs(u.minY + u.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && pn(y, h, t, u), y.pathSubpaths = h, y.pathAnchors = h[0].anchors, y.pathClosed = h[0].closed, f.startsWith("fill") ? Ht(y, t.fill, n) : y.backgroundColor = "transparent", f.endsWith("|stroke") ? kt(y, t.line) : (y.strokeColor = "transparent", y.strokeWidth = 0), a.push(y), b ??= y, n.stats.paths++;
  }
  if (b && n.byPptId.set(t.id, { el: b, item: t }), t.text) {
    const f = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? Ut(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(yt(n, t.text, { ...t, x: t.x + f.l, y: t.y + f.t, w: f.r - f.l, h: f.b - f.t }, c));
  }
  return n.stats.elements += a.length, a;
}
function pn(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), c = Math.sin(a), x = e.flipH ? -1 : 1, b = e.flipV ? -1 : 1, f = (d, p) => {
    const k = (d + o.minX - s) * x, M = (p + o.minY - r) * b;
    return { x: s + k * i - M * c, y: r + k * c + M * i };
  }, m = (d, p) => {
    const k = d * x, M = p * b;
    return { x: k * i - M * c, y: k * c + M * i };
  };
  let g = 1 / 0, u = 1 / 0, h = -1 / 0, y = -1 / 0;
  for (const d of n) for (const p of d.anchors) {
    const k = f(p.x, p.y);
    if (p.x = k.x, p.y = k.y, p.inX !== void 0) {
      const M = m(p.inX, p.inY ?? 0);
      p.inX = M.x, p.inY = M.y;
    }
    if (p.outX !== void 0) {
      const M = m(p.outX, p.outY ?? 0);
      p.outX = M.x, p.outY = M.y;
    }
    g = Math.min(g, p.x), u = Math.min(u, p.y), h = Math.max(h, p.x), y = Math.max(y, p.y);
  }
  for (const d of n) for (const p of d.anchors)
    p.x -= g, p.y -= u;
  t.x = t.x - o.minX + g, t.y = t.y - o.minY + u, t.width = Math.max(h - g, 1), t.height = Math.max(y - u, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function mn(t) {
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
const Yt = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function wt(t, n, e) {
  const o = t.geom;
  let s;
  if (o.kind === "preset" && ee.has(o.prst)) s = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (o.kind === "custom") s = o.paths.flatMap((k) => k.cmds);
  else {
    const k = n.presets[o.prst], M = Object.fromEntries(Object.entries(o.adj ?? {}).map(([S, v]) => [S, `val ${v}`]));
    s = k ? lt(k, t.w, t.h, M).flatMap((S) => S.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, c = (k, M) => {
    let S = k - r, v = M - a;
    return t.flipH && (S = -S), t.flipV && (v = -v), { x: t.x + r + S * Math.cos(i) - v * Math.sin(i), y: t.y + a + S * Math.sin(i) + v * Math.cos(i) };
  }, x = [];
  let b = { x: 0, y: 0 };
  for (const k of s)
    if (k.op === "M" || k.op === "L")
      b = { x: k.x, y: k.y }, x.push(c(b.x, b.y));
    else if (k.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const S = M / 12, v = 1 - S, N = v * v * v * b.x + 3 * v * v * S * k.x1 + 3 * v * S * S * k.x2 + S * S * S * k.x, P = v * v * v * b.y + 3 * v * v * S * k.y1 + 3 * v * S * S * k.y2 + S * S * S * k.y;
        x.push(c(N, P));
      }
      b = { x: k.x, y: k.y };
    }
  if (x.length < 2) return [];
  const f = Math.min(...x.map((k) => k.x)), m = Math.min(...x.map((k) => k.y)), g = Math.max(...x.map((k) => k.x)), u = Math.max(...x.map((k) => k.y)), h = t.line.head && Yt[t.line.head.type], y = t.line.tail && Yt[t.line.tail.type], d = Z(n, h || y ? "arrow" : "line", { ...t, x: f, y: m, w: Math.max(g - f, 1), h: Math.max(u - m, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  d.points = x.map((k) => ({ x: k.x - f, y: k.y - m })), d.curveType = "straight", d.startArrowhead = h ?? null, d.endArrowhead = y ?? null, kt(d, t.line);
  const p = (k, M) => {
    if (!k) return null;
    const S = n.byPptId.get(k.id);
    if (!S || !S.el.width || !S.el.height) return null;
    const v = S.el;
    return { elementId: v.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - v.x) / v.width, anchorFractionY: (M.y + n.oy - v.y) / v.height };
  };
  return n.glue.push(() => {
    d.startBinding = p(t.start, x[0]), d.endBinding = p(t.end, x[x.length - 1]);
  }), n.stats.elements++, [d];
}
function gn(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const c = Z(n, "rectangle", t, e);
    return Object.assign(c, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [c];
  }
  const s = Z(n, "image", t, e);
  if (s.dataURL = t.grayscale && n.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = Mt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), t.descr && (s.altText = t.descr), n.stats.elements++, n.stats.pictures++, !t.geom) return [s];
  const r = n.nextId("group"), a = ne({
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
function oe(t, n, e) {
  const o = [];
  for (const s of t)
    try {
      const r = [];
      switch (s.kind) {
        case "shape":
          r.push(...ne(s, n, e));
          break;
        case "connector":
          r.push(...wt(s, n, e));
          break;
        case "picture":
          r.push(...gn(s, n, e));
          break;
        case "group":
          r.push(...oe(s.children, n, [...e, n.nextId("group")]));
          break;
      }
      const a = ln(s.link, n);
      if (a)
        for (const i of r) i.link || (i.link = a);
      o.push(...r);
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function xn(t) {
  return t ? { type: t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function bn(t, n, e) {
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
const Mt = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, yn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function kn(t) {
  let n = "";
  for (let o = 0; o < t.length; o += 32768) n += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(n);
}
async function wn(t) {
  const n = /* @__PURE__ */ new Set(), e = (s) => {
    for (const r of s)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const s of t.slides)
    e(s.items), s.background?.kind === "image" && n.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (s) => {
    if (!yn.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Mt[s.ext]};base64,${kn(s.bytes)}`;
    let a = 0, i = 0;
    try {
      const c = await createImageBitmap(new Blob([s.bytes], { type: Mt[s.ext] }));
      a = c.width, i = c.height, c.close();
    } catch {
    }
    o.set(s, { url: r, w: a, h: i });
  })), o;
}
function Mn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, a = /^pct(\d+)$/.exec(t);
  if (a) {
    const i = Math.max(1, Math.min(99, Number(a[1]))), c = i > 50, x = (c ? 100 - i : i) / 100;
    return { type: "dots", color: c ? e : n, background: c ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(x / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function vn(t, n, e) {
  const o = await ye(), s = await wn(t), r = Math.round(t.width), a = Math.round(t.height), i = ce(e ?? t.title, "slides", { width: r, height: a }), c = [], x = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  i.slides = [];
  const b = await fn(t, s), f = await Promise.all(t.slides.map((u) => {
    const h = u.background, y = h?.kind === "image" ? s.get(h.media) : void 0;
    return h?.kind === "image" && y ? un(y.url, r, a, h.tile) : void 0;
  })), m = t.slides.map(() => n("slide")), g = /* @__PURE__ */ new Map();
  return t.slides.forEach((u, h) => {
    u.key && g.set(u.key, m[h]);
  }), t.slides.forEach((u, h) => {
    const y = h * (r + en), d = Nt(m[h], u.name || `Slide ${h + 1}`, y, 0, { width: r, height: a });
    d.order = h;
    const p = { ox: y, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: c, stats: x, images: s, slideBg: f[h], gray: b, slideIds: g };
    i.elements.push(...oe(u.items, p, [])), p.glue.forEach((M) => M()), bn(d, u.background, p);
    const k = xn(u.transition);
    k && (d.transition = k), u.notes && (d.notes = u.notes), i.slides.push(d), x.slides++;
  }), i.slides.length || i.slides.push(Nt(void 0, "Slide 1", 0, 0, { width: r, height: a })), { doc: i, warnings: [...new Set(c)], stats: x };
}
const Sn = 512 * 1024 * 1024;
async function In(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > Sn) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = tn(e), r = /* @__PURE__ */ new Set(), a = await vn(o, (c) => pe(c, r), n);
  he(a.doc);
  const i = [...s, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  In as importPptx
};
