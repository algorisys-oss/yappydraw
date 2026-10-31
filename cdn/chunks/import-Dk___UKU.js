import { u as ae, a as ie } from "./browser-DbZP-BrN.js";
import { E as H, i as vt, g as le } from "./custgeom-BeeylhzV.js";
import { ap as ce, aq as Rt, M as fe, q as ue, K as de } from "./index-OCtbNe3Y.js";
const he = 1e4, pe = 1e5, Wt = 6e4, K = (t) => t / Wt * (Math.PI / 180);
function _t(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), c = Math.max(r, a), y = {
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
  for (const [g, h] of Object.entries(y)) s.set(g, h);
  for (const g of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${g}`, r / g), s.set(`hd${g}`, a / g), s.set(`ssd${g}`, i / g);
  const x = (g) => {
    const h = s.get(g);
    if (h !== void 0) return h;
    const u = /^(wd|hd|ssd)(\d+)$/.exec(g);
    if (u) {
      const b = u[1] === "wd" ? r : u[1] === "hd" ? a : i, d = Number(u[2]);
      return d ? b / d : 0;
    }
    const p = Number(g);
    return Number.isFinite(p) ? p : 0;
  }, f = (g, h) => {
    s.size > he || s.set(g, me(h, x));
  };
  for (const [g, h] of t.av ?? []) f(g, o[g] ?? h);
  for (const [g, h] of Object.entries(o)) s.has(g) || f(g, h);
  for (const [g, h] of t.gd ?? []) f(g, h);
  return s;
}
function me(t, n) {
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
      i = s * Math.cos(K(r));
      break;
    case "sin":
      i = s * Math.sin(K(r));
      break;
    case "tan":
      i = s * Math.tan(K(r));
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
const Nt = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function it(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * H, r = Math.max(Math.abs(e), 0) * H, a = _t(t, s, r, o), i = (x) => typeof x == "number" ? x : a.get(x) ?? (Number.isFinite(Number(x)) ? Number(x) : 0), c = [];
  let y = pe;
  for (const x of t.paths) {
    const f = x.w ? s / x.w : 1, g = x.h ? r / x.h : 1, h = (m) => i(m) * f / H, u = (m) => i(m) * g / H, p = [];
    let b = { x: 0, y: 0 }, d = { x: 0, y: 0 };
    for (const m of x.d) {
      if (--y < 0) break;
      switch (m[0]) {
        case "M":
          b = { x: h(m[1]), y: u(m[2]) }, d = b, p.push({ op: "M", ...b });
          break;
        case "L":
          b = { x: h(m[1]), y: u(m[2]) }, p.push({ op: "L", ...b });
          break;
        case "C": {
          const k = h(m[1]), M = u(m[2]), S = h(m[3]), v = u(m[4]);
          b = { x: h(m[5]), y: u(m[6]) }, p.push({ op: "C", x1: k, y1: M, x2: S, y2: v, ...b });
          break;
        }
        case "Q": {
          const k = h(m[1]), M = u(m[2]), S = h(m[3]), v = u(m[4]);
          p.push({ op: "C", x1: b.x + 2 / 3 * (k - b.x), y1: b.y + 2 / 3 * (M - b.y), x2: S + 2 / 3 * (k - S), y2: v + 2 / 3 * (M - v), x: S, y: v }), b = { x: S, y: v };
          break;
        }
        case "A": {
          const k = i(m[1]) * f / H, M = i(m[2]) * g / H;
          b = ge(p, b, k, M, i(m[3]), i(m[4]));
          break;
        }
        case "Z":
          p.push({ op: "Z" }), b = d;
          break;
      }
    }
    p.length && c.push({ cmds: p, fill: x.fill === "none" ? !1 : void 0, stroke: x.stroke === !1 ? !1 : void 0 });
  }
  return c;
}
function ge(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const a = K(s), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, K(r))), c = Nt(a, e, o);
  let y = Nt(a + i, e, o);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) y = c + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && y < c; ) y += 2 * Math.PI;
    for (; i < 0 && y > c; ) y -= 2 * Math.PI;
  }
  const x = n.x - e * Math.cos(c), f = n.y - o * Math.sin(c), g = y - c, h = Math.max(1, Math.min(16, Math.ceil(Math.abs(g) / (Math.PI / 2)))), u = g / h, p = 4 / 3 * Math.tan(u / 4);
  let b = c, d = n;
  for (let m = 0; m < h; m++) {
    const k = b + u, M = Math.cos(b), S = Math.sin(b), v = Math.cos(k), I = Math.sin(k);
    d = { x: x + e * v, y: f + o * I }, t.push({ op: "C", x1: x + e * (M - p * S), y1: f + o * (S + p * M), x2: x + e * (v + p * I), y2: f + o * (I - p * v), ...d }), b = k;
  }
  return d;
}
function Ut(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const a = _t(t, s * H, r * H, o), i = (g) => (a.get(g) ?? (Number.isFinite(Number(g)) ? Number(g) : 0)) / H, [c, y, x, f] = t.rect.map(i);
  return { l: c, t: y, r: x, b: f };
}
let Ot = null;
async function xe() {
  return Ot ??= (await import("./presets-DP49P8i2.js")).default, Ot;
}
const Et = 5e4, be = 256 * 1024 * 1024, At = 1024 * 1024 * 1024, ye = 1e4, ke = 32, we = 2e4, R = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!n || o.localName === n) && e.push(o);
  return e;
}, l = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, E = (t, ...n) => {
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
}, L = (t) => t / H, Me = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function ve(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = l(t, "Fallback");
  for (const e of R(t, "Choice"))
    if ((w(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => Me.has(s))) return R(e);
  return R(n);
}
const ut = (t) => R(t).flatMap(ve);
class Se {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(n, e, o) {
    this.parseXml = e, this.warn = o, this.files = {};
    for (const [s, r] of Object.entries(n)) this.files[Z(s)] = r;
  }
  bytes(n) {
    return this.files[Z(n)];
  }
  xml(n) {
    const e = Z(n);
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
    const e = Z(n);
    let o = this.relCache.get(e);
    if (o) return o;
    o = /* @__PURE__ */ new Map();
    const s = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), a = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const i of R(a, "Relationship")) {
      const c = w(i, "Id"), y = w(i, "Type") || "", x = w(i, "Target") || "";
      if (!c) continue;
      const f = w(i, "TargetMode") === "External";
      o.set(c, { type: y.slice(y.lastIndexOf("/") + 1), target: f ? x : Ce(s, x), external: f });
    }
    return this.relCache.set(e, o), o;
  }
  relOfType(n, e) {
    for (const o of this.rels(n).values()) if (o.type === e && !o.external) return o.target;
    return null;
  }
}
const Z = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function Ce(t, n) {
  let e = n.split("#")[0];
  try {
    e = decodeURIComponent(e);
  } catch {
  }
  if (e.startsWith("/")) return Z(e);
  const o = (t ? t.split("/") : []).concat(e.split("/")), s = [];
  for (const r of o)
    r === ".." ? s.pop() : r && r !== "." && s.push(r);
  return s.join("/");
}
const St = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function pt(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = l(t, "themeElements");
  for (const r of R(l(e, "clrScheme"))) {
    const a = R(r)[0];
    if (!a) continue;
    const i = a.localName === "sysClr" ? w(a, "lastClr") : w(a, "val");
    i && /^[0-9a-f]{6}$/i.test(i) && (n.colors[r.localName] = "#" + i.toLowerCase());
  }
  const o = l(e, "fontScheme");
  n.major = w(E(o, "majorFont", "latin"), "typeface") || n.major, n.minor = w(E(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = l(e, "fmtScheme");
  return n.fills = R(l(s, "fillStyleLst")), n.lines = R(l(s, "lnStyleLst")), n.bgFills = R(l(s, "bgFillStyleLst")), n;
}
const Pe = {
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
}, rt = (t, n, e) => "#" + [t, n, e].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), Q = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), _ = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
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
  const e = R(t).find((o) => /Clr$/.test(o.localName));
  return e ? Te(e, n) : null;
}
function Te(t, n) {
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
      e = Pe[w(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = rt(_(C(t, "r") / 1e5), _(C(t, "g") / 1e5), _(C(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [c, y, x] = mt(C(t, "hue") / 6e4, C(t, "sat") / 1e5, C(t, "lum") / 1e5);
      e = rt(c, y, x);
      break;
    }
    case "schemeClr": {
      const c = w(t, "val") || "";
      if (c === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const y = n.clrMap[c] ?? St[c] ?? c;
      e = n.theme.colors[y] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, a] = Gt(e);
  for (const c of R(t)) {
    const y = C(c, "val") / 1e5;
    switch (c.localName) {
      case "alpha":
        o = y;
        break;
      case "alphaMod":
        o *= y;
        break;
      case "alphaOff":
        o += y;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [x, f, g] = Lt(s, r, a);
        c.localName === "lumMod" ? g *= y : c.localName === "lumOff" ? g += y : c.localName === "satMod" ? f *= y : c.localName === "satOff" ? f += y : c.localName === "hueMod" ? x *= y : x += C(c, "val") / 6e4, [s, r, a] = mt(x, Math.max(0, Math.min(1, f)), Math.max(0, Math.min(1, g)));
        break;
      }
      case "tint":
        [s, r, a] = [s, r, a].map((x) => _(Q(x) * y + (1 - y)));
        break;
      case "shade":
        [s, r, a] = [s, r, a].map((x) => _(Q(x) * y));
        break;
      case "comp": {
        const [x, f, g] = Lt(s, r, a);
        [s, r, a] = mt(x + 180, f, g);
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
  const i = { hex: rt(s, r, a) };
  return o < 0.999 && (i.alpha = o), i;
}
function V(t, n) {
  for (const e of R(t)) {
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
      const e = R(l(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: C(s, "pos") / 1e5, color: $(s, n.ctx) ?? { hex: "#000000" } }));
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
const Ie = {
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
  const r = n.pkg.bytes(s.target), a = Ie[(s.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const Re = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function U(t, n) {
  if (!t) return;
  let e;
  for (const i of R(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = $(i, n.ctx)), i.localName === "gradFill" && (e = $(l(l(i, "gsLst"), "gs"), n.ctx));
  }
  const o = w(t, "w");
  if (e === void 0 && o === null && !l(t, "prstDash") && !l(t, "headEnd") && !l(t, "tailEnd")) return;
  const s = (i) => {
    const c = w(i, "type");
    if (!c || c === "none") return;
    const y = c === "triangle" || c === "stealth" || c === "arrow" || c === "oval" || c === "diamond" ? c : "triangle", x = w(i, "len") || w(i, "w");
    return { type: y, size: x === "sm" || x === "lg" ? x : "med" };
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
function lt(t, n) {
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
function Ne(t, n) {
  const e = Y(t);
  if (!e) return n;
  const o = l(t, "chOff"), s = l(t, "chExt"), r = o ? L(C(o, "x")) : e.x, a = o ? L(C(o, "y")) : e.y, i = s ? L(C(s, "cx")) : e.w, c = s ? L(C(s, "cy")) : e.h, y = i > 0 ? e.w / i : 1, x = c > 0 ? e.h / c : 1, f = e.x + e.w / 2, g = e.y + e.h / 2, h = e.rot * Math.PI / 180;
  return (u) => {
    let p = e.x + (u.x + u.w / 2 - r) * y, b = e.y + (u.y + u.h / 2 - a) * x, d = u.rot, m = u.flipH, k = u.flipV;
    if (e.flipH && (p = 2 * f - p, m = !m, d = -d), e.flipV && (b = 2 * g - b, k = !k, d = -d), h) {
      const v = p - f, I = b - g;
      p = f + v * Math.cos(h) - I * Math.sin(h), b = g + v * Math.sin(h) + I * Math.cos(h), d += e.rot;
    }
    const M = u.w * y, S = u.h * x;
    return n({ x: p - M / 2, y: b - S / 2, w: M, h: S, rot: (d % 360 + 360) % 360, flipH: m, flipV: k });
  };
}
function Ft(t) {
  const n = l(t, "spcPts"), e = l(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, C(n, "val") / 100)) * (vt / H) };
  if (e) return { lines: Math.max(0, Math.min(13.2, C(e, "val") / 1e5)) };
}
function Dt(t, n, e) {
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
  const o = E(t, "lnSpc", "spcPct");
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
const Oe = {
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
}, Ee = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Ae(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const o = (n || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && Oe[e] || "•" : o === "symbol" ? Ee[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const jt = (...t) => {
  const n = {};
  for (const e of t) for (const [o, s] of Object.entries(e)) s !== void 0 && (n[o] = s);
  return n;
};
function Le(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function Tt(t, n, e) {
  if (!t) return;
  const o = R(t, "p");
  if (!o.some((h) => R(h).some((u) => (u.localName === "r" || u.localName === "fld") && (E(u, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const h of [...n.bodyPr, l(t, "bodyPr")]) {
    if (!h) continue;
    for (let p = 0; p < h.attributes.length; p++) r[h.attributes[p].localName ?? h.attributes[p].name] = h.attributes[p].value;
    const u = l(h, "normAutofit");
    u && (a = w(u, "fontScale") !== null ? C(u, "fontScale") / 1e5 : 1), u && (i = 1 - Math.max(0, Math.min(0.9, C(u, "lnSpcReduction") / 1e5))), (l(h, "noAutofit") || l(h, "spAutoFit")) && (a = 1, i = 1);
  }
  const c = (h, u) => r[h] !== void 0 ? L(Number(r[h]) || 0) : L(u), y = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", x = l(t, "lstStyle"), f = [];
  let g;
  for (const h of o) {
    const u = l(h, "pPr"), p = Math.max(0, Math.min(8, C(u, "lvl"))), b = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, d = jt(...n.levels.map((P) => Dt(P, p, e)), b, Dt(x, p, e), u ? qt(u, e) : {});
    d.lnSpcPct !== void 0 && g === void 0 && (g = d.lnSpcPct);
    const m = { runs: [], align: d.algn === "ctr" ? "ctr" : d.algn === "r" ? "r" : (d.algn === "just", "l"), level: p };
    if (d.bullet === "char" || d.bullet === "num") {
      if (m.bullet = d.bullet, m.marL = d.marL ?? 0, m.indent = d.indent ?? 0, d.bullet === "char") {
        const P = Ae(d.buChar, d.buFont ?? void 0);
        P !== "•" && (m.bulletChar = P);
      } else
        d.numType && d.numType !== "arabicPeriod" && (m.numType = d.numType), d.startAt && d.startAt !== 1 && (m.startAt = d.startAt);
      d.buClr && (m.bulletColor = d.buClr), d.buSz && Math.abs(d.buSz - 1) > 1e-3 && (m.bulletScale = d.buSz);
    }
    const k = (P) => {
      const T = jt(d, Zt(P, e)), O = (T.sz ?? 18 * vt / H) * a, A = T.color === null ? void 0 : T.color ?? Kt("tx1", e);
      return {
        text: "",
        size: O,
        bold: T.b || void 0,
        italic: T.i || void 0,
        underline: T.u || void 0,
        strike: T.strike || void 0,
        color: A ?? void 0,
        font: Le(T.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const P of R(h))
      if (P.localName === "r" || P.localName === "fld") {
        const T = E(P, "t")?.textContent ?? "";
        if (!T) continue;
        T.split(/[\v\n]/).forEach((O, A) => {
          A > 0 && m.runs.push({ ...k(l(P, "rPr")), br: !0 }), O && m.runs.push({ ...k(l(P, "rPr")), text: O });
        });
      } else P.localName === "br" && m.runs.push({ ...k(l(P, "rPr")), br: !0 });
    m.endSize = k(l(h, "endParaRPr")).size;
    const M = (m.runs.length ? Math.max(...m.runs.map((P) => P.size ?? 0)) : m.endSize ?? 0) * 1.2 * (d.lnSpcPct ?? 1), S = (P) => P ? ("px" in P ? P.px : P.lines * M) * i : 0, v = S(d.spcBef), I = S(d.spcAft);
    v > 0.05 && (m.spaceBefore = Math.round(v * 100) / 100), I > 0.05 && (m.spaceAfter = Math.round(I * 100) / 100), f.push(m);
  }
  return {
    paragraphs: f,
    anchor: y,
    insets: { l: c("lIns", 91440), t: c("tIns", 45720), r: c("rIns", 91440), b: c("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: g
  };
}
const Kt = (t, n) => {
  const e = n.ctx.clrMap[t] ?? St[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, J = (t) => {
  const n = l(t, "ph");
  return n ? { type: w(n, "type") || "obj", idx: C(n, "idx") } : null;
}, at = (t) => l(R(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), nt = /* @__PURE__ */ new Set(["title", "ctrTitle"]), $t = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Bt = (t, n) => t === n || nt.has(t) && nt.has(n) || !$t.has(t) && !$t.has(n);
function ct(t, n) {
  const e = Fe(t);
  if (n.idx) {
    const o = e.find((s) => s.ph.idx === n.idx && Bt(s.ph.type, n.type));
    if (o) return o.el;
  }
  return (e.find((o) => o.ph.type === n.type && (o.ph.idx === n.idx || !n.idx || nt.has(n.type))) ?? e.find((o) => o.ph.type === n.type) ?? e.find((o) => Bt(o.ph.type, n.type)))?.el ?? null;
}
function Fe(t) {
  const n = [];
  for (const e of ut(t)) {
    const o = J(at(e));
    o && n.push({ el: e, ph: o });
  }
  return n;
}
const Qt = (t) => nt.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", De = (t) => {
  const n = {};
  for (const e of R(l(t, "avLst"), "gd")) {
    const o = w(e, "name"), s = w(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function je(t) {
  const n = (r) => R(r, "gd").slice(0, 1e4).map((a) => [w(a, "name") || "", w(a, "fmla") || "val 0"]), e = R(l(t, "cxnLst"), "cxn").map((r) => [w(r, "ang") || "0", w(l(r, "pos"), "x") || "0", w(l(r, "pos"), "y") || "0"]), o = l(t, "rect"), s = R(l(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const c of R(r)) {
      const y = R(c, "pt").map((x) => [w(x, "x") || "0", w(x, "y") || "0"]).flat();
      switch (c.localName) {
        case "moveTo":
          a.push(["M", ...y]);
          break;
        case "lnTo":
          a.push(["L", ...y]);
          break;
        case "quadBezTo":
          a.push(["Q", ...y]);
          break;
        case "cubicBezTo":
          a.push(["C", ...y]);
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
    av: R(l(t, "avLst"), "gd").map((r) => [w(r, "name") || "", w(r, "fmla") || "val 0"]),
    gd: n(l(t, "gdLst")),
    cxn: e,
    rect: o ? [w(o, "l") || "l", w(o, "t") || "t", w(o, "r") || "r", w(o, "b") || "b"] : null,
    paths: s
  };
}
function tt(t, n) {
  const e = l(t, "prstGeom");
  if (e) {
    const s = {};
    for (const [r, a] of Object.entries(De(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (s[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: w(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = l(t, "custGeom");
  if (o) {
    const s = je(o);
    return { geom: { kind: "custom", paths: it(s, n.w, n.h) }, textRect: s.rect ? Ut(s, n.w, n.h) : void 0 };
  }
}
function et(t, n, e, o, s, r) {
  const a = [];
  if (s > ke)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of ut(t)) {
    if (++e.count > we) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const c = $e(i, n, e, o, s, r);
      c && a.push(...Array.isArray(c) ? c : [c]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
}
function $e(t, n, e, o, s, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = R(t).find((f) => f.localName.startsWith("nv")), c = l(i ?? null, "cNvPr"), y = C(c, "id"), x = w(c, "name") || t.localName;
  if (w(c, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Xe(t, n, e, o, y, x, r);
    case "cxnSp": {
      const f = l(t, "spPr"), g = Y(l(f, "xfrm"));
      if (!g) return null;
      const h = o(g), u = l(t, "style"), p = U(l(f, "ln"), a) ?? Pt(u, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!p) return null;
      const b = tt(f, h) ?? { geom: { kind: "preset", prst: "line" } }, d = (k) => k ? { id: C(k, "id"), idx: C(k, "idx") } : void 0, m = l(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: y, name: x, ...h, geom: b.geom, line: p, start: d(l(m, "stCxn")), end: d(l(m, "endCxn")) };
    }
    case "pic": {
      const f = l(t, "spPr");
      let g = Y(l(f, "xfrm"));
      const h = J(l(i ?? null, "nvPr"));
      if (!g && h && (g = Be(h, e)), !g) return null;
      const u = l(t, "blipFill"), p = u ? Vt(u, a) : null;
      if (!p)
        return e.warnings.push(`Picture "${x}" has no image the importer can read.`), null;
      const b = l(u, "srcRect"), d = b ? { l: C(b, "l") / 1e5, t: C(b, "t") / 1e5, r: C(b, "r") / 1e5, b: C(b, "b") / 1e5 } : void 0, m = w(E(u, "blip", "alphaModFix"), "amt"), k = o(g), M = tt(f, k)?.geom, S = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: y, name: x, ...k, media: p, crop: d, alpha: m !== null ? Number(m) / 1e5 : void 0, descr: w(c, "descr") || void 0, geom: S, ...E(u, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const f = l(t, "grpSpPr"), g = l(f, "xfrm"), h = Ne(g, o), u = et(t, n, e, h, s + 1, r);
      if (!u.length) return null;
      const p = ft(u);
      return { kind: "group", id: y, name: x, ...p, children: u };
    }
    case "graphicFrame":
      return We(t, n, e, o, y, x, s);
    default:
      return null;
  }
}
function ft(t) {
  let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
  for (const r of t)
    n = Math.min(n, r.x), e = Math.min(e, r.y), o = Math.max(o, r.x + r.w), s = Math.max(s, r.y + r.h);
  return { x: n, y: e, w: Math.max(0, o - n), h: Math.max(0, s - e) };
}
function Be(t, n) {
  const e = ct(n.layout?.tree ?? null, t), o = Y(E(e, "spPr", "xfrm"));
  if (o) return o;
  const s = ct(n.master?.tree ?? null, { type: Qt(t.type), idx: 0 });
  return Y(E(s, "spPr", "xfrm"));
}
function ze(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function Xe(t, n, e, o, s, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = at(t), y = J(c);
  if (y && !a) return null;
  const x = l(t, "spPr"), f = l(t, "style"), g = w(E(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", h = y && e.layout ? ct(e.layout.tree, y) : null, u = y && e.master ? ct(e.master.tree, { type: Qt(h ? J(at(h))?.type ?? y.type : y.type), idx: 0 }) : null, p = h && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, b = u && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let d = Y(l(x, "xfrm")) ?? Y(E(h, "spPr", "xfrm")) ?? Y(E(u, "spPr", "xfrm"));
  if (!d) return null;
  d = o(d);
  const m = tt(x, d) ?? (h ? tt(l(h, "spPr"), d) : void 0) ?? (u ? tt(l(u, "spPr"), d) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (B(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? V(x, i) ?? lt(f, i) ?? (p ? V(l(h, "spPr"), p) : void 0) ?? (b ? V(l(u, "spPr"), b) : void 0) ?? (p ? lt(l(h, "style"), p) : void 0) ?? { kind: "none" }, S = ze(
    () => U(l(x, "ln"), i),
    () => Pt(f, i),
    () => p ? U(E(h, "spPr", "ln"), p) : void 0,
    () => b ? U(E(u, "spPr", "ln"), b) : void 0
  ) ?? null, v = [];
  if (y) {
    const D = h ? J(at(h))?.type ?? y.type : y.type;
    v.push(nt.has(D) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(D) ? e.masterTx.body : e.masterTx.other), v.push(E(u, "txBody", "lstStyle"), E(h, "txBody", "lstStyle"));
  } else
    v.push(e.defaultText);
  const I = l(f, "fontRef"), P = {
    levels: v,
    bodyPr: [E(u, "txBody", "bodyPr"), E(h, "txBody", "bodyPr")],
    fontRef: I ? { font: w(I, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: $(I, i.ctx) } : void 0
  }, T = Tt(l(t, "txBody"), P, i);
  if (!(M.kind !== "none" || !!S || !!T)) return null;
  let A = m.textRect;
  const N = Y(l(x, "xfrm")), z = T ? Y(l(t, "txXfrm")) : null;
  if (z && N && N.w > 0 && N.h > 0) {
    const D = d.w / N.w, W = d.h / N.h, X = { l: (z.x - N.x) * D, t: (z.y - N.y) * W, r: (z.x + z.w - N.x) * D, b: (z.y + z.h - N.y) * W };
    (Math.abs(X.l) > 0.5 || Math.abs(X.t) > 0.5 || Math.abs(X.r - d.w) > 0.5 || Math.abs(X.b - d.h) > 0.5) && (A = X);
  }
  return { kind: "shape", id: s, name: r, ...d, geom: m.geom, fill: M, line: S, text: T, textBox: g || void 0, textRect: A };
}
const zt = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function He(t, n) {
  const e = {};
  if (!t) return e;
  const o = l(t, "tcStyle"), s = l(t, "tcTxStyle"), r = l(o, "fill"), a = r ? V(r, n) : lt(o, n);
  a && (e.fill = a);
  const i = $(s, n.ctx) ?? $(l(s, "fontRef"), n.ctx);
  i && (e.text = i), w(s, "b") === "on" && (e.bold = !0);
  const c = l(o, "tcBdr");
  for (const y of ["insideH", "bottom", "top", "left"]) {
    const x = l(c, y);
    if (!x) continue;
    const f = U(l(x, "ln"), n) ?? Pt(x, n);
    if (f !== void 0) {
      e.border = f;
      break;
    }
  }
  return e;
}
function Ye(t, n, e) {
  const o = ((l(t, "tableStyleId")?.textContent || "").trim() || w(e, "def") || zt).toUpperCase(), s = (f) => B(t, f) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, a = R(e, "tblStyle").find((f) => (w(f, "styleId") || "").toUpperCase() === o);
  if (a) {
    const f = (b) => He(l(a, b), n), g = l(a, "tblBg"), h = g ? l(g, "fill") ? V(l(g, "fill"), n) : lt(g, n) : void 0, u = {
      whole: f("wholeTbl"),
      b1H: f("band1H"),
      b2H: f("band2H"),
      b1V: f("band1V"),
      b2V: f("band2V"),
      firstRow: f("firstRow"),
      lastRow: f("lastRow"),
      firstCol: f("firstCol"),
      lastCol: f("lastCol")
    }, p = (b, d, m, k) => {
      const M = [u.whole], S = b - (r.firstRow ? 1 : 0), v = d - (r.firstCol ? 1 : 0);
      r.bandCol && v >= 0 && M.push(v % 2 === 0 ? u.b1V : u.b2V), r.bandRow && S >= 0 && M.push(S % 2 === 0 ? u.b1H : u.b2H), r.firstCol && d === 0 && M.push(u.firstCol), r.lastCol && d === k - 1 && M.push(u.lastCol), r.firstRow && b === 0 && M.push(u.firstRow), r.lastRow && b === m - 1 && M.push(u.lastRow);
      const I = {};
      for (const P of M)
        P.fill && (I.fill = P.fill), P.text && (I.text = P.text), P.bold && (I.bold = !0), P.border !== void 0 && (I.border = P.border);
      return I;
    };
    return h && h.kind !== "none" && (p.background = h), p;
  }
  if (o !== zt) return null;
  const i = n.ctx.theme.colors.accent1 ?? "#4472c4", c = (f) => {
    const [g, h, u] = Gt(i);
    return { hex: rt(_(Q(g) * f + (1 - f)), _(Q(h) * f + (1 - f)), _(Q(u) * f + (1 - f))) };
  }, y = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, x = Kt("tx1", n) ?? void 0;
  return (f) => {
    const g = r.firstRow && f === 0, h = r.bandRow && !g && (f - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: g ? { hex: i } : c(h ? 0.4 : 0.2) },
      text: g ? y : x,
      bold: g || void 0,
      border: { width: 1.33, color: y }
    };
  };
}
function We(t, n, e, o, s, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = Y(l(t, "xfrm"));
  if (!c) return null;
  const y = E(t, "graphic", "graphicData"), x = l(y, "tbl");
  if (x) {
    const h = R(l(x, "tblGrid"), "gridCol").map((k) => L(C(k, "w"))), u = Ye(l(x, "tblPr"), i, e.tableStyles), p = [];
    let b = c.y, d = 1e6 + s * 1e3;
    const m = R(x, "tr");
    if (m.forEach((k, M) => {
      const S = L(C(k, "h"));
      let v = c.x, I = 0;
      for (const P of R(k, "tc")) {
        const T = Math.max(1, C(P, "gridSpan", 1)), O = h.slice(I, I + T).reduce((G, F) => G + F, 0);
        if (I += T, B(P, "hMerge") || B(P, "vMerge")) {
          v += O;
          continue;
        }
        const A = Math.max(1, C(P, "rowSpan", 1)), N = l(P, "tcPr"), z = A > 1 ? S * A : S, D = u ? u(M, I - T, m.length, h.length) : null, W = D?.text ? { color: D.text } : void 0, X = Tt(l(P, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: W }, i);
        X && D?.bold && X.paragraphs.forEach((G) => G.runs.forEach((F) => {
          F.bold === void 0 && (F.bold = !0);
        })), X && (X.insets = { l: L(C(N, "marL", 91440)), r: L(C(N, "marR", 91440)), t: L(C(N, "marT", 45720)), b: L(C(N, "marB", 45720)) }, X.anchor = w(N, "anchor") === "ctr" ? "ctr" : w(N, "anchor") === "b" ? "b" : "t");
        const dt = U(l(N, "lnB"), i) ?? U(l(N, "lnT"), i) ?? (D ? D.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), ot = D?.fill;
        p.push({
          kind: "shape",
          id: d++,
          name: `${r} cell`,
          ...o({ x: v, y: b, w: O, h: z, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: V(N, i) ?? ot ?? { kind: "none" },
          line: dt,
          text: X
        }), v += O;
      }
      b += S;
    }), !p.length) return null;
    if (u?.background) {
      const k = ft(p);
      p.unshift({
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
    return { kind: "group", id: s, name: r, ...ft(p), children: p };
  }
  const f = w(y, "uri") || "";
  if (/diagram/.test(f)) {
    const h = _e(y, n, e, o, c, s, r, a);
    if (h) return h;
    const u = Ue(y, n, e, o, c, s, r, i);
    if (u) return u;
  }
  const g = /chart/.test(f) ? "Chart" : /diagram/.test(f) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${g} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(c),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${g}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function _e(t, n, e, o, s, r, a, i) {
  const c = e.pkg.rels(n.part), y = w(l(t, "relIds"), "r:dm"), x = y ? c.get(y) : void 0;
  let f;
  if (x && !x.external) {
    const d = Jt(e.pkg.xml(x.target), "dataModelExt", 6), m = d ? c.get(w(d, "relId") || "") : void 0;
    m && !m.external && (f = m.target);
  }
  if (!f) {
    const d = [...c.values()].filter((m) => m.type === "diagramDrawing" && !m.external);
    d.length === 1 && (f = d[0].target);
  }
  if (!f) return null;
  const g = l(e.pkg.xml(f), "spTree");
  if (!g) return null;
  const u = et(g, { part: f, tree: g }, e, (d) => o({ ...d, x: d.x + s.x, y: d.y + s.y }), i + 1, !0);
  if (!u.length) return null;
  let p = 2e6 + r * 1e3;
  const b = (d) => d.forEach((m) => {
    m.id = p++, m.kind === "group" && b(m.children);
  });
  return b(u), { kind: "group", id: r, name: a, ...ft(u), children: u };
}
function Ue(t, n, e, o, s, r, a, i) {
  const c = w(l(t, "relIds"), "r:dm"), y = c ? e.pkg.rels(n.part).get(c) : void 0;
  if (!y || y.external) return null;
  const x = e.pkg.xml(y.target), f = /* @__PURE__ */ new Map();
  for (const d of R(l(x, "ptLst"), "pt")) f.set(w(d, "modelId") || "", d);
  const g = /* @__PURE__ */ new Map();
  for (const d of R(l(x, "cxnLst"), "cxn")) {
    if ((w(d, "type") || "parOf") !== "parOf") continue;
    const m = w(d, "srcId") || "", k = w(d, "destId") || "";
    g.has(m) || g.set(m, []), g.get(m).push({ id: k, ord: C(d, "srcOrd") });
  }
  const h = [...f.values()].find((d) => w(d, "type") === "doc");
  if (!h) return null;
  const u = [], p = /* @__PURE__ */ new Set(), b = (d, m) => {
    if (!(p.has(d) || m > 16 || u.length > 500)) {
      p.add(d);
      for (const k of (g.get(d) ?? []).sort((M, S) => M.ord - S.ord)) {
        const M = f.get(k.id), S = w(M, "type") || "node";
        if (!M || S !== "node" && S !== "asst") continue;
        const v = Tt(l(M, "t"), { levels: [e.defaultText], bodyPr: [] }, i);
        for (const I of v?.paragraphs ?? [])
          I.runs.some((P) => !P.br && P.text.trim()) && u.push({
            ...I,
            align: "l",
            level: m,
            ...m > 0 ? { bullet: "char" } : {},
            runs: I.runs.map((P) => ({ ...P, size: P.size ?? (m > 0 ? 16 : 18), bold: P.bold ?? (m === 0 ? !0 : void 0) }))
          });
        b(k.id, m + 1);
      }
    }
  };
  return b(w(h, "modelId") || "", 0), u.length ? (e.warnings.push(`SmartArt diagram "${a}" had no saved drawing; its text was imported as a list.`), {
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
  for (const o of ut(t)) {
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
function Ge(t) {
  const n = ut(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = R(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
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
function Ve(t, n = {}) {
  const e = [], o = (T) => {
    e.length < 200 && !e.includes(T) && e.push(T);
  }, s = n.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = ae(t, {
      filter: (T) => (a++, i += T.originalSize, a <= Et && T.originalSize <= be && i <= At)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > Et || i > At) && o("The file is very large; some parts were skipped.");
  const c = new Se(r, s, o), y = c.relOfType("", "officeDocument") ?? "ppt/presentation.xml", x = c.xml(y);
  if (!x || x.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const f = l(x, "sldSz"), g = f ? Math.max(1, L(C(f, "cx", 9144e3))) : 960, h = f ? Math.max(1, L(C(f, "cy", 5143500))) : 540, u = l(x, "defaultTextStyle"), p = c.rels(y), b = c.relOfType(y, "tableStyles"), d = b ? c.xml(b) : null, m = [], k = /* @__PURE__ */ new Set();
  for (const T of R(l(x, "sldIdLst"), "sldId")) {
    const O = p.get(w(T, "r:id") || "");
    O && !k.has(O.target) && m.length < ye && (k.add(O.target), m.push(O.target));
  }
  const M = /* @__PURE__ */ new Map(), S = (T) => {
    const O = c.relOfType(T, "theme");
    return O ? (M.has(O) || M.set(O, pt(c.xml(O))), M.get(O)) : pt(null);
  }, v = (T) => {
    if (!T) return null;
    const O = {};
    for (let A = 0; A < T.attributes.length; A++) O[T.attributes[A].localName ?? T.attributes[A].name] = T.attributes[A].value;
    return O;
  }, I = [];
  m.forEach((T, O) => {
    const A = c.xml(T);
    if (!A) {
      o(`Slide ${O + 1} couldn't be read and was skipped.`);
      return;
    }
    const N = c.relOfType(T, "slideLayout"), z = N ? c.xml(N) : null, D = N ? c.relOfType(N, "slideMaster") : null, W = D ? c.xml(D) : null, X = D ? S(D) : pt(null), dt = v(E(A, "clrMapOvr", "overrideClrMapping")) ?? v(E(z, "clrMapOvr", "overrideClrMapping")) ?? v(l(W, "clrMap")) ?? St, ot = { theme: X, clrMap: dt }, G = l(W, "txStyles"), F = {
      pkg: c,
      ctx: ot,
      slide: { part: T, tree: E(A, "cSld", "spTree") },
      layout: N ? { part: N, tree: E(z, "cSld", "spTree") } : null,
      master: D ? { part: D, tree: E(W, "cSld", "spTree") } : null,
      masterTx: { title: l(G, "titleStyle"), body: l(G, "bodyStyle"), other: l(G, "otherStyle") },
      defaultText: u,
      warnings: e,
      count: 0,
      tableStyles: d
    }, ht = (re) => ({ pkg: c, part: re?.part ?? T, ctx: ot }), It = xt(l(A, "cSld"), ht(F.slide)) ?? xt(l(z, "cSld"), ht(F.layout)) ?? xt(l(W, "cSld"), ht(F.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    F.background = It;
    const st = [], se = B(A, "showMasterSp") !== !1 && B(z, "showMasterSp") !== !1;
    F.master && se && st.push(...et(F.master.tree, F.master, F, gt, 0, !1)), F.layout && B(A, "showMasterSp") !== !1 && st.push(...et(F.layout.tree, F.layout, F, gt, 0, !1)), st.push(...et(F.slide.tree, F.slide, F, gt, 0, !0)), I.push({ items: st, background: It, transition: Ge(A), name: w(l(A, "cSld"), "name") || void 0 });
  }), I.length || o("The presentation has no slides.");
  const P = E(c.xml("docProps/core.xml"), "title")?.textContent || void 0;
  return { deck: { width: g, height: h, slides: I, title: P }, warnings: e };
}
const qe = 80, Ze = "default-layer", j = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, Ke = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, Qe = /(courier|consolas|mono|menlo|code)/i;
function Xt(t) {
  if (!t) return "sans-serif";
  const n = fe(t);
  return n || (Qe.test(t) ? "monospace" : Ke.test(t) ? "serif" : "sans-serif");
}
function Je(t) {
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
const tn = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
async function en(t) {
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
async function nn(t, n) {
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
    const a = await en(r);
    a && s.set(r, a);
  })), s;
}
async function on(t, n, e, o) {
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
function q(t, n, e, o) {
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
    layerId: Ze,
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
      t.backgroundColor = j(n.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = n.kind, t.backgroundColor = j(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: j(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
      break;
    case "pattern": {
      t.backgroundColor = j(n.color), t.fillStyle = "pattern", t.patternFill = mn(n.preset, j(n.color), n.bg ? j(n.bg) : "transparent");
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
  t.strokeColor = j(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function sn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function rn(t, n) {
  const e = t.bullet === "num" ? sn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && j(t.bulletColor) !== j(o) && (e.listMarkerColor = j(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const bt = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function te(t, n) {
  const e = t.paragraphs.flatMap((p) => p.runs.filter((b) => !b.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (p) => p.runs.reduce((b, d) => b + (d.br ? 0 : d.text.trim().length), 0);
  for (const p of t.paragraphs) {
    const b = a(p);
    b && r.set(p.align ?? "l", (r.get(p.align ?? "l") ?? 0) + b);
  }
  const i = [...r].sort((p, b) => b[1] - p[1])[0]?.[0] ?? t.paragraphs.find((p) => p.runs.length)?.align ?? "l", c = (p) => a(p) > 0 && (p.align ?? "l") !== i ? p.align === "ctr" ? "center" : p.align === "r" ? "right" : "left" : void 0, y = e.every((p) => p.size === o?.size && p.bold === o?.bold && p.italic === o?.italic && p.underline === o?.underline && p.strike === o?.strike && p.font === o?.font && j(p.color) === j(o?.color)) && !t.paragraphs.some((p) => p.bullet) && !t.paragraphs.some((p, b) => b > 0 && bt(t, b) > 0) && !t.paragraphs.some(c), x = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Xt(o?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: j(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (x.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const f = t.paragraphs.map((p) => p.runs.map((b) => b.br ? `
` : b.text).join("")).join(`
`);
  if (y)
    return o?.bold && (x.fontWeight = 700), o?.italic && (x.fontStyle = "italic"), n ? x.containerText = f : x.text = f, { fields: x, rich: !1 };
  const g = [], h = [], u = [];
  return t.paragraphs.forEach((p, b) => {
    const d = p.level ?? 0;
    if (p.bullet === "num") {
      const M = p.numType ?? "arabicPeriod";
      (h[d] === void 0 || u[d] !== M) && (h[d] = (p.startAt ?? 1) - 1), h[d]++, u[d] = M, h.length = d + 1, u.length = d + 1;
    } else
      h.length = Math.min(h.length, d), u.length = h.length;
    const m = p.bullet ? { listType: p.bullet === "num" ? "ordered" : "bullet", listLevel: d, ...rn(p, t) } : {};
    p.bullet === "num" && (m.listIndex = h[d]), (p.runs.length ? p.runs : [{ text: "" }]).forEach((M, S) => {
      const v = { text: M.br ? `
` : M.text, ...S === 0 ? m : {} };
      S === 0 && b > 0 && bt(t, b) > 0 && (v.paragraphSpaceBefore = bt(t, b));
      const I = c(p);
      I && (v.paragraphAlign = I), M.bold && (v.bold = !0), M.italic && (v.italic = !0), M.underline && (v.underline = !0), M.strike && (v.strikethrough = !0), M.color && (v.color = j(M.color)), M.size && (v.fontSize = Math.round(M.size * 10) / 10), M.font && (v.fontFamily = Xt(M.font)), g.push(v);
    }), b < t.paragraphs.length - 1 && g.push({ text: `
` });
  }), n ? (x.richContainerText = g, x.containerText = f) : (x.richText = g, x.text = f), { fields: x, rich: !0 };
}
function yt(t, n, e, o, s) {
  const { fields: r, rich: a } = te(n, !1), i = 4, c = q(t, a ? "richtext" : "text", {
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
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((f) => !f.cmds.some((g) => g.op === "Z")))
    return wt({ ...t, kind: "connector", line: t.line }, n, e);
  const s = ln(t);
  if (s) {
    const f = q(n, s.type, t, e);
    Object.assign(f, s.extra), Ht(f, t.fill, n), kt(f, t.line), n.byPptId.set(t.id, { el: f, item: t }), n.stats.elements++;
    const g = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, h = t.text?.insets, u = Math.abs(g.l) > 0.5 || Math.abs(g.t) > 0.5 || Math.abs(g.r - t.w) > 0.5 || Math.abs(g.b - t.h) > 0.5, p = !!h && Math.max(h.l, h.r, h.t, h.b) > 16;
    if (t.text && (u || p)) {
      const b = n.nextId("group");
      return f.groupIds = [...e, b].reverse(), n.stats.elements++, [f, yt(n, t.text, { ...t, rot: 0, x: t.x + g.l, y: t.y + g.t, w: g.r - g.l, h: g.b - g.t }, [...e, b])];
    }
    if (t.text) {
      const { fields: b } = te(t.text, !0);
      Object.assign(f, b);
    }
    return [f];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const f = n.presets[o.prst];
    if (!f)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), it(n.presets.rect, t.w, t.h);
    const g = Object.fromEntries(Object.entries(o.adj ?? {}).map(([h, u]) => [h, `val ${u}`]));
    return it(f, t.w, t.h, g);
  })(), a = [], i = (t.text || r.some((f) => f.fill === !1)) && r.some((f) => f.fill !== !1) ? n.nextId("group") : null, c = i ? [...e, i] : e, y = /* @__PURE__ */ new Map();
  for (const f of r) {
    const g = `${f.fill === !1 ? "nofill" : "fill"}|${f.stroke === !1 ? "nostroke" : "stroke"}`;
    y.has(g) || y.set(g, []), y.get(g).push(f);
  }
  let x = null;
  for (const [f, g] of y) {
    const h = g.flatMap((m) => m.cmds), u = le(h);
    if (!u) continue;
    const p = Je(tn(h, -u.minX, -u.minY));
    if (!p.length) continue;
    const b = q(n, "path", { ...t, x: t.x + u.minX, y: t.y + u.minY, w: Math.max(u.maxX - u.minX, 1), h: Math.max(u.maxY - u.minY, 1) }, c);
    !(Math.abs(u.minX + u.maxX - t.w) < 0.5 && Math.abs(u.minY + u.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && an(b, p, t, u), b.pathSubpaths = p, b.pathAnchors = p[0].anchors, b.pathClosed = p[0].closed, f.startsWith("fill") ? Ht(b, t.fill, n) : b.backgroundColor = "transparent", f.endsWith("|stroke") ? kt(b, t.line) : (b.strokeColor = "transparent", b.strokeWidth = 0), a.push(b), x ??= b, n.stats.paths++;
  }
  if (x && n.byPptId.set(t.id, { el: x, item: t }), t.text) {
    const f = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? Ut(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(yt(n, t.text, { ...t, x: t.x + f.l, y: t.y + f.t, w: f.r - f.l, h: f.b - f.t }, c));
  }
  return n.stats.elements += a.length, a;
}
function an(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), c = Math.sin(a), y = e.flipH ? -1 : 1, x = e.flipV ? -1 : 1, f = (d, m) => {
    const k = (d + o.minX - s) * y, M = (m + o.minY - r) * x;
    return { x: s + k * i - M * c, y: r + k * c + M * i };
  }, g = (d, m) => {
    const k = d * y, M = m * x;
    return { x: k * i - M * c, y: k * c + M * i };
  };
  let h = 1 / 0, u = 1 / 0, p = -1 / 0, b = -1 / 0;
  for (const d of n) for (const m of d.anchors) {
    const k = f(m.x, m.y);
    if (m.x = k.x, m.y = k.y, m.inX !== void 0) {
      const M = g(m.inX, m.inY ?? 0);
      m.inX = M.x, m.inY = M.y;
    }
    if (m.outX !== void 0) {
      const M = g(m.outX, m.outY ?? 0);
      m.outX = M.x, m.outY = M.y;
    }
    h = Math.min(h, m.x), u = Math.min(u, m.y), p = Math.max(p, m.x), b = Math.max(b, m.y);
  }
  for (const d of n) for (const m of d.anchors)
    m.x -= h, m.y -= u;
  t.x = t.x - o.minX + h, t.y = t.y - o.minY + u, t.width = Math.max(p - h, 1), t.height = Math.max(b - u, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function ln(t) {
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
    s = k ? it(k, t.w, t.h, M).flatMap((S) => S.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, c = (k, M) => {
    let S = k - r, v = M - a;
    return t.flipH && (S = -S), t.flipV && (v = -v), { x: t.x + r + S * Math.cos(i) - v * Math.sin(i), y: t.y + a + S * Math.sin(i) + v * Math.cos(i) };
  }, y = [];
  let x = { x: 0, y: 0 };
  for (const k of s)
    if (k.op === "M" || k.op === "L")
      x = { x: k.x, y: k.y }, y.push(c(x.x, x.y));
    else if (k.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const S = M / 12, v = 1 - S, I = v * v * v * x.x + 3 * v * v * S * k.x1 + 3 * v * S * S * k.x2 + S * S * S * k.x, P = v * v * v * x.y + 3 * v * v * S * k.y1 + 3 * v * S * S * k.y2 + S * S * S * k.y;
        y.push(c(I, P));
      }
      x = { x: k.x, y: k.y };
    }
  if (y.length < 2) return [];
  const f = Math.min(...y.map((k) => k.x)), g = Math.min(...y.map((k) => k.y)), h = Math.max(...y.map((k) => k.x)), u = Math.max(...y.map((k) => k.y)), p = t.line.head && Yt[t.line.head.type], b = t.line.tail && Yt[t.line.tail.type], d = q(n, p || b ? "arrow" : "line", { ...t, x: f, y: g, w: Math.max(h - f, 1), h: Math.max(u - g, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  d.points = y.map((k) => ({ x: k.x - f, y: k.y - g })), d.curveType = "straight", d.startArrowhead = p ?? null, d.endArrowhead = b ?? null, kt(d, t.line);
  const m = (k, M) => {
    if (!k) return null;
    const S = n.byPptId.get(k.id);
    if (!S || !S.el.width || !S.el.height) return null;
    const v = S.el;
    return { elementId: v.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - v.x) / v.width, anchorFractionY: (M.y + n.oy - v.y) / v.height };
  };
  return n.glue.push(() => {
    d.startBinding = m(t.start, y[0]), d.endBinding = m(t.end, y[y.length - 1]);
  }), n.stats.elements++, [d];
}
function cn(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const c = q(n, "rectangle", t, e);
    return Object.assign(c, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [c];
  }
  const s = q(n, "image", t, e);
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
      switch (s.kind) {
        case "shape":
          o.push(...ne(s, n, e));
          break;
        case "connector":
          o.push(...wt(s, n, e));
          break;
        case "picture":
          o.push(...cn(s, n, e));
          break;
        case "group":
          o.push(...oe(s.children, n, [...e, n.nextId("group")]));
          break;
      }
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function fn(t) {
  return t ? { type: t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function un(t, n, e) {
  if (n)
    if (n.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = j(n.color);
    else if (n.kind === "linear" || n.kind === "radial")
      t.fillStyle = n.kind, t.backgroundColor = j(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: j(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
    else if (n.kind === "image") {
      const o = e.images.get(n.media), s = e.slideBg ?? o?.url;
      s && (t.fillStyle = "image", t.backgroundImage = s, t.backgroundColor = "#ffffff"), s && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
    } else n.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = j(n.color));
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
}, dn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function hn(t) {
  let n = "";
  for (let o = 0; o < t.length; o += 32768) n += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(n);
}
async function pn(t) {
  const n = /* @__PURE__ */ new Set(), e = (s) => {
    for (const r of s)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const s of t.slides)
    e(s.items), s.background?.kind === "image" && n.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (s) => {
    if (!dn.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Mt[s.ext]};base64,${hn(s.bytes)}`;
    let a = 0, i = 0;
    try {
      const c = await createImageBitmap(new Blob([s.bytes], { type: Mt[s.ext] }));
      a = c.width, i = c.height, c.close();
    } catch {
    }
    o.set(s, { url: r, w: a, h: i });
  })), o;
}
function mn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, a = /^pct(\d+)$/.exec(t);
  if (a) {
    const i = Math.max(1, Math.min(99, Number(a[1]))), c = i > 50, y = (c ? 100 - i : i) / 100;
    return { type: "dots", color: c ? e : n, background: c ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(y / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function gn(t, n, e) {
  const o = await xe(), s = await pn(t), r = Math.round(t.width), a = Math.round(t.height), i = ce(e ?? t.title, "slides", { width: r, height: a }), c = [], y = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  i.slides = [];
  const x = await nn(t, s), f = await Promise.all(t.slides.map((g) => {
    const h = g.background, u = h?.kind === "image" ? s.get(h.media) : void 0;
    return h?.kind === "image" && u ? on(u.url, r, a, h.tile) : void 0;
  }));
  return t.slides.forEach((g, h) => {
    const u = h * (r + qe), p = Rt(void 0, g.name || `Slide ${h + 1}`, u, 0, { width: r, height: a });
    p.order = h;
    const b = { ox: u, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: c, stats: y, images: s, slideBg: f[h], gray: x };
    i.elements.push(...oe(g.items, b, [])), b.glue.forEach((m) => m()), un(p, g.background, b);
    const d = fn(g.transition);
    d && (p.transition = d), i.slides.push(p), y.slides++;
  }), i.slides.length || i.slides.push(Rt(void 0, "Slide 1", 0, 0, { width: r, height: a })), { doc: i, warnings: [...new Set(c)], stats: y };
}
const xn = 512 * 1024 * 1024;
async function wn(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > xn) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = Ve(e), r = /* @__PURE__ */ new Set(), a = await gn(o, (c) => de(c, r), n);
  ue(a.doc);
  const i = [...s, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  wn as importPptx
};
