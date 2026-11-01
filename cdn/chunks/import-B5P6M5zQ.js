import { u as ye, a as ke } from "./browser-DbZP-BrN.js";
import { e as we, s as Xt, f as Me } from "./anim-map-D7T1mIAM.js";
import { E as q, i as $t, c as ve } from "./custgeom-BFpu9xFE.js";
import { aF as Ce, aG as Wt, T as Se, aH as Pe, aI as Te, M as Ne, q as Ie, K as Ae } from "./index-trzxrRhC.js";
const Oe = 1e4, Re = 1e5, ae = 6e4, ut = (t) => t / ae * (Math.PI / 180);
function ie(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), i = Math.max(0, e), a = Math.min(r, i), c = Math.max(r, i), p = {
    w: r,
    h: i,
    l: 0,
    t: 0,
    r,
    b: i,
    hc: r / 2,
    vc: i / 2,
    ss: a,
    ls: c,
    cd2: 108e5,
    cd4: 54e5,
    cd8: 27e5,
    "3cd4": 162e5,
    "3cd8": 81e5,
    "5cd8": 135e5,
    "7cd8": 189e5
  };
  for (const [h, y] of Object.entries(p)) s.set(h, y);
  for (const h of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    s.set(`wd${h}`, r / h), s.set(`hd${h}`, i / h), s.set(`ssd${h}`, a / h);
  const d = (h) => {
    const y = s.get(h);
    if (y !== void 0) return y;
    const m = /^(wd|hd|ssd)(\d+)$/.exec(h);
    if (m) {
      const g = m[1] === "wd" ? r : m[1] === "hd" ? i : a, x = Number(m[2]);
      return x ? g / x : 0;
    }
    const f = Number(h);
    return Number.isFinite(f) ? f : 0;
  }, u = (h, y) => {
    s.size > Oe || s.set(h, Le(y, d));
  };
  for (const [h, y] of t.av ?? []) u(h, o[h] ?? y);
  for (const [h, y] of Object.entries(o)) s.has(h) || u(h, y);
  for (const [h, y] of t.gd ?? []) u(h, y);
  return s;
}
function Le(t, n) {
  const e = String(t || "").trim().split(/\s+/), o = e[0], [s, r, i] = e.slice(1).map(n);
  let a;
  switch (o) {
    case "val":
      a = s;
      break;
    case "*/":
      a = i ? s * r / i : 0;
      break;
    case "+-":
      a = s + r - i;
      break;
    case "+/":
      a = i ? (s + r) / i : 0;
      break;
    case "?:":
      a = s > 0 ? r : i;
      break;
    case "abs":
      a = Math.abs(s);
      break;
    case "at2":
      a = Math.atan2(r, s) * 180 / Math.PI * ae;
      break;
    case "cat2":
      a = s * Math.cos(Math.atan2(i, r));
      break;
    case "sat2":
      a = s * Math.sin(Math.atan2(i, r));
      break;
    case "cos":
      a = s * Math.cos(ut(r));
      break;
    case "sin":
      a = s * Math.sin(ut(r));
      break;
    case "tan":
      a = s * Math.tan(ut(r));
      break;
    case "max":
      a = Math.max(s, r);
      break;
    case "min":
      a = Math.min(s, r);
      break;
    case "mod":
      a = Math.sqrt(s * s + r * r + i * i);
      break;
    case "pin":
      a = r < s ? s : r > i ? i : r;
      break;
    case "sqrt":
      a = Math.sqrt(Math.max(0, s));
      break;
    default:
      a = 0;
  }
  return Number.isFinite(a) ? a : 0;
}
const Yt = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function kt(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * q, r = Math.max(Math.abs(e), 0) * q, i = ie(t, s, r, o), a = (d) => typeof d == "number" ? d : i.get(d) ?? (Number.isFinite(Number(d)) ? Number(d) : 0), c = [];
  let p = Re;
  for (const d of t.paths) {
    const u = d.w ? s / d.w : 1, h = d.h ? r / d.h : 1, y = (k) => a(k) * u / q, m = (k) => a(k) * h / q, f = [];
    let g = { x: 0, y: 0 }, x = { x: 0, y: 0 };
    for (const k of d.d) {
      if (--p < 0) break;
      switch (k[0]) {
        case "M":
          g = { x: y(k[1]), y: m(k[2]) }, x = g, f.push({ op: "M", ...g });
          break;
        case "L":
          g = { x: y(k[1]), y: m(k[2]) }, f.push({ op: "L", ...g });
          break;
        case "C": {
          const b = y(k[1]), M = m(k[2]), C = y(k[3]), S = m(k[4]);
          g = { x: y(k[5]), y: m(k[6]) }, f.push({ op: "C", x1: b, y1: M, x2: C, y2: S, ...g });
          break;
        }
        case "Q": {
          const b = y(k[1]), M = m(k[2]), C = y(k[3]), S = m(k[4]);
          f.push({ op: "C", x1: g.x + 2 / 3 * (b - g.x), y1: g.y + 2 / 3 * (M - g.y), x2: C + 2 / 3 * (b - C), y2: S + 2 / 3 * (M - S), x: C, y: S }), g = { x: C, y: S };
          break;
        }
        case "A": {
          const b = a(k[1]) * u / q, M = a(k[2]) * h / q;
          g = Ee(f, g, b, M, a(k[3]), a(k[4]));
          break;
        }
        case "Z":
          f.push({ op: "Z" }), g = x;
          break;
      }
    }
    f.length && c.push({ cmds: f, fill: d.fill === "none" ? !1 : void 0, stroke: d.stroke === !1 ? !1 : void 0 });
  }
  return c;
}
function Ee(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const i = ut(s), a = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, ut(r))), c = Yt(i, e, o);
  let p = Yt(i + a, e, o);
  if (Math.abs(a) >= 2 * Math.PI - 1e-9) p = c + Math.sign(a) * 2 * Math.PI;
  else {
    for (; a > 0 && p < c; ) p += 2 * Math.PI;
    for (; a < 0 && p > c; ) p -= 2 * Math.PI;
  }
  const d = n.x - e * Math.cos(c), u = n.y - o * Math.sin(c), h = p - c, y = Math.max(1, Math.min(16, Math.ceil(Math.abs(h) / (Math.PI / 2)))), m = h / y, f = 4 / 3 * Math.tan(m / 4);
  let g = c, x = n;
  for (let k = 0; k < y; k++) {
    const b = g + m, M = Math.cos(g), C = Math.sin(g), S = Math.cos(b), A = Math.sin(b);
    x = { x: d + e * S, y: u + o * A }, t.push({ op: "C", x1: d + e * (M - f * C), y1: u + o * (C + f * M), x2: d + e * (S + f * A), y2: u + o * (A - f * S), ...x }), g = b;
  }
  return x;
}
function le(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const i = ie(t, s * q, r * q, o), a = (h) => (i.get(h) ?? (Number.isFinite(Number(h)) ? Number(h) : 0)) / q, [c, p, d, u] = t.rect.map(a);
  return { l: c, t: p, r: d, b: u };
}
let _t = null;
async function Fe() {
  return _t ??= (await import("./presets-DP49P8i2.js")).default, _t;
}
const Ut = 5e4, De = 256 * 1024 * 1024, Gt = 1024 * 1024 * 1024, $e = 1e4, je = 32, ze = 2e4, L = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!n || o.localName === n) && e.push(o);
  return e;
}, l = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, B = (t, ...n) => {
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
}, P = (t, n, e = 0) => {
  const o = w(t, n), s = o === null ? NaN : Number(o);
  return Number.isFinite(s) ? s : e;
}, _ = (t, n) => {
  const e = w(t, n);
  return e === null ? void 0 : e === "1" || e === "true" || e === "on";
}, W = (t) => t / q, Be = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function He(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = l(t, "Fallback");
  for (const e of L(t, "Choice"))
    if ((w(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => Be.has(s))) return L(e);
  return L(n);
}
const J = (t) => L(t).flatMap(He);
class Xe {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(n, e, o) {
    this.parseXml = e, this.warn = o, this.files = {};
    for (const [s, r] of Object.entries(n)) this.files[ft(s)] = r;
  }
  bytes(n) {
    return this.files[ft(n)];
  }
  xml(n) {
    const e = ft(n);
    if (!this.text.has(e)) {
      const o = this.files[e];
      let s = null;
      if (o) {
        try {
          const r = ke(o).replace(/^﻿/, "");
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
    const e = ft(n);
    let o = this.relCache.get(e);
    if (o) return o;
    o = /* @__PURE__ */ new Map();
    const s = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), i = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const a of L(i, "Relationship")) {
      const c = w(a, "Id"), p = w(a, "Type") || "", d = w(a, "Target") || "";
      if (!c) continue;
      const u = w(a, "TargetMode") === "External";
      o.set(c, { type: p.slice(p.lastIndexOf("/") + 1), target: u ? d : We(s, d), external: u });
    }
    return this.relCache.set(e, o), o;
  }
  relOfType(n, e) {
    for (const o of this.rels(n).values()) if (o.type === e && !o.external) return o.target;
    return null;
  }
}
const ft = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function We(t, n) {
  let e = n.split("#")[0];
  try {
    e = decodeURIComponent(e);
  } catch {
  }
  if (e.startsWith("/")) return ft(e);
  const o = (t ? t.split("/") : []).concat(e.split("/")), s = [];
  for (const r of o)
    r === ".." ? s.pop() : r && r !== "." && s.push(r);
  return s.join("/");
}
const jt = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function ce(t) {
  const n = {};
  for (const e of L(t)) {
    const o = L(e)[0];
    if (!o) continue;
    const s = o.localName === "sysClr" ? w(o, "lastClr") : w(o, "val");
    s && /^[0-9a-f]{6}$/i.test(s) && (n[e.localName] = "#" + s.toLowerCase());
  }
  return n;
}
function St(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = l(t, "themeElements");
  n.colors = ce(l(e, "clrScheme"));
  const o = l(e, "fontScheme");
  n.major = w(B(o, "majorFont", "latin"), "typeface") || n.major, n.minor = w(B(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = l(e, "fmtScheme");
  return n.fills = L(l(s, "fillStyleLst")), n.lines = L(l(s, "lnStyleLst")), n.bgFills = L(l(s, "bgFillStyleLst")), n;
}
const Ye = {
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
}, fe = (t) => {
  const n = t.replace("#", "");
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}, yt = (t, n, e) => "#" + [t, n, e].map((o) => Math.max(0, Math.min(255, Math.round(o))).toString(16).padStart(2, "0")).join(""), dt = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), st = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function Vt(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const o = Math.max(t, n, e), s = Math.min(t, n, e), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const i = o - s, a = r > 0.5 ? i / (2 - o - s) : i / (o + s);
  return [(o === t ? (n - e) / i + (n < e ? 6 : 0) : o === n ? (e - t) / i + 2 : (t - n) / i + 4) * 60, a, r];
}
function Pt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const o = e < 0.5 ? e * (1 + n) : e + n - e * n, s = 2 * e - o, r = (i) => (i = (i % 1 + 1) % 1, i < 1 / 6 ? s + (o - s) * 6 * i : i < 1 / 2 ? o : i < 2 / 3 ? s + (o - s) * (2 / 3 - i) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function U(t, n) {
  const e = L(t).find((o) => /Clr$/.test(o.localName));
  return e ? _e(e, n) : null;
}
function _e(t, n) {
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
      e = Ye[w(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = yt(st(P(t, "r") / 1e5), st(P(t, "g") / 1e5), st(P(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [c, p, d] = Pt(P(t, "hue") / 6e4, P(t, "sat") / 1e5, P(t, "lum") / 1e5);
      e = yt(c, p, d);
      break;
    }
    case "schemeClr": {
      const c = w(t, "val") || "";
      if (c === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const p = n.clrMap[c] ?? jt[c] ?? c;
      e = n.theme.colors[p] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, i] = fe(e);
  for (const c of L(t)) {
    const p = P(c, "val") / 1e5;
    switch (c.localName) {
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
        let [d, u, h] = Vt(s, r, i);
        c.localName === "lumMod" ? h *= p : c.localName === "lumOff" ? h += p : c.localName === "satMod" ? u *= p : c.localName === "satOff" ? u += p : c.localName === "hueMod" ? d *= p : d += P(c, "val") / 6e4, [s, r, i] = Pt(d, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, h)));
        break;
      }
      case "tint":
        [s, r, i] = [s, r, i].map((d) => st(dt(d) * p + (1 - p)));
        break;
      case "shade":
        [s, r, i] = [s, r, i].map((d) => st(dt(d) * p));
        break;
      case "comp": {
        const [d, u, h] = Vt(s, r, i);
        [s, r, i] = Pt(d + 180, u, h);
        break;
      }
      case "inv":
        [s, r, i] = [255 - s, 255 - r, 255 - i];
        break;
      case "gray": {
        s = r = i = 0.299 * s + 0.587 * r + 0.114 * i;
        break;
      }
    }
  }
  o = Math.max(0, Math.min(1, o));
  const a = { hex: yt(s, r, i) };
  return o < 0.999 && (a.alpha = o), a;
}
function it(t, n) {
  for (const e of L(t)) {
    const o = zt(e, n);
    if (o) return o;
  }
}
function zt(t, n) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const e = U(t, n.ctx);
      return e ? { kind: "solid", color: e } : { kind: "none" };
    }
    case "gradFill": {
      const e = L(l(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: P(s, "pos") / 1e5, color: U(s, n.ctx) ?? { hex: "#000000" } }));
      if (!e.length) return { kind: "none" };
      const o = l(t, "lin");
      return l(t, "path") ? { kind: "radial", stops: e } : { kind: "linear", stops: e, angle: o ? P(o, "ang") / 6e4 : 90, scaled: _(o, "scaled") ?? !1 };
    }
    case "blipFill": {
      const e = ue(t, n);
      if (!e) return;
      const o = { kind: "image", media: e }, s = l(t, "tile");
      s && (o.tile = { sx: Math.max(0.01, P(s, "sx", 1e5) / 1e5), sy: Math.max(0.01, P(s, "sy", 1e5) / 1e5) });
      const r = l(l(t, "blip"), "alphaModFix");
      return r && (o.alpha = Math.max(0, Math.min(1, P(r, "amt", 1e5) / 1e5))), l(l(t, "blip"), "grayscl") && (o.grayscale = !0), o;
    }
    case "pattFill": {
      const e = U(l(t, "fgClr"), n.ctx), o = U(l(t, "bgClr"), n.ctx);
      return e ? { kind: "pattern", preset: w(t, "prst") || "pct50", color: e, ...o ? { bg: o } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Ue = {
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
function ue(t, n) {
  const e = l(t, "blip"), o = w(e, "r:embed");
  if (!o) return null;
  const s = n.pkg.rels(n.part).get(o);
  if (!s || s.external) return null;
  const r = n.pkg.bytes(s.target), i = Ue[(s.target.split(".").pop() || "").toLowerCase()];
  return r && i ? { bytes: r, ext: i } : null;
}
const Ge = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function nt(t, n) {
  if (!t) return;
  let e;
  for (const a of L(t)) {
    if (a.localName === "noFill") return null;
    a.localName === "solidFill" && (e = U(a, n.ctx)), a.localName === "gradFill" && (e = U(l(l(a, "gsLst"), "gs"), n.ctx));
  }
  const o = w(t, "w");
  if (e === void 0 && o === null && !l(t, "prstDash") && !l(t, "headEnd") && !l(t, "tailEnd")) return;
  const s = (a) => {
    const c = w(a, "type");
    if (!c || c === "none") return;
    const p = c === "triangle" || c === "stealth" || c === "arrow" || c === "oval" || c === "diamond" ? c : "triangle", d = w(a, "len") || w(a, "w");
    return { type: p, size: d === "sm" || d === "lg" ? d : "med" };
  }, r = Ge[w(l(t, "prstDash"), "val") || "solid"], i = w(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, W(Number(o) || 0)) : 1,
    color: e ?? { hex: "#000000" },
    dash: r || void 0,
    cap: i === "rnd" ? "rnd" : i === "sq" ? "sq" : i === "flat" ? "flat" : void 0,
    join: l(t, "round") ? "round" : l(t, "bevel") ? "bevel" : l(t, "miter") ? "miter" : void 0,
    head: s(l(t, "headEnd")),
    tail: s(l(t, "tailEnd"))
  };
}
function wt(t, n) {
  const e = l(t, "fillRef");
  if (!e) return;
  const o = P(e, "idx");
  if (o === 0) return { kind: "none" };
  const r = (o >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[o >= 1001 ? o - 1001 : o - 1];
  if (!r) return;
  const i = U(e, n.ctx) ?? void 0;
  return zt(r, { ...n, ctx: { ...n.ctx, phClr: i } });
}
function Bt(t, n) {
  const e = l(t, "lnRef");
  if (!e) return;
  const o = P(e, "idx");
  if (o === 0) return null;
  const s = n.ctx.theme.lines[o - 1];
  if (!s) return;
  const r = U(e, n.ctx) ?? void 0;
  return nt(s, { ...n, ctx: { ...n.ctx, phClr: r } }) ?? void 0;
}
function Q(t) {
  if (!t) return null;
  const n = l(t, "off"), e = l(t, "ext");
  return !n || !e ? null : {
    x: W(P(n, "x")),
    y: W(P(n, "y")),
    w: Math.max(0, W(P(e, "cx"))),
    h: Math.max(0, W(P(e, "cy"))),
    rot: P(t, "rot") / 6e4,
    flipH: !!_(t, "flipH"),
    flipV: !!_(t, "flipV")
  };
}
const Tt = (t) => t;
function Ve(t, n) {
  const e = Q(t);
  if (!e) return n;
  const o = l(t, "chOff"), s = l(t, "chExt"), r = o ? W(P(o, "x")) : e.x, i = o ? W(P(o, "y")) : e.y, a = s ? W(P(s, "cx")) : e.w, c = s ? W(P(s, "cy")) : e.h, p = a > 0 ? e.w / a : 1, d = c > 0 ? e.h / c : 1, u = e.x + e.w / 2, h = e.y + e.h / 2, y = e.rot * Math.PI / 180;
  return (m) => {
    let f = e.x + (m.x + m.w / 2 - r) * p, g = e.y + (m.y + m.h / 2 - i) * d, x = m.rot, k = m.flipH, b = m.flipV;
    if (e.flipH && (f = 2 * u - f, k = !k, x = -x), e.flipV && (g = 2 * h - g, b = !b, x = -x), y) {
      const S = f - u, A = g - h;
      f = u + S * Math.cos(y) - A * Math.sin(y), g = h + S * Math.sin(y) + A * Math.cos(y), x += e.rot;
    }
    const M = m.w * p, C = m.h * d;
    return n({ x: f - M / 2, y: g - C / 2, w: M, h: C, rot: (x % 360 + 360) % 360, flipH: k, flipV: b });
  };
}
function qt(t) {
  const n = l(t, "spcPts"), e = l(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, P(n, "val") / 100)) * ($t / q) };
  if (e) return { lines: Math.max(0, Math.min(13.2, P(e, "val") / 1e5)) };
}
function Zt(t, n, e) {
  const o = l(t, `lvl${n + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return o ? de(o, e) : {};
}
function de(t, n) {
  const e = {};
  if (w(t, "algn") && (e.algn = w(t, "algn")), w(t, "marL") !== null && (e.marL = W(P(t, "marL"))), w(t, "indent") !== null && (e.indent = W(P(t, "indent"))), l(t, "buNone")) e.bullet = "none";
  else if (l(t, "buAutoNum")) {
    const i = l(t, "buAutoNum");
    e.bullet = "num", e.numType = w(i, "type") || "arabicPeriod", e.startAt = w(i, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(P(i, "startAt", 1)))) : void 0;
  } else l(t, "buChar") ? (e.bullet = "char", e.buChar = w(l(t, "buChar"), "char") || void 0) : l(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (l(t, "buFont") ? e.buFont = w(l(t, "buFont"), "typeface") || null : l(t, "buFontTx") && (e.buFont = null), l(t, "buClr") ? e.buClr = U(l(t, "buClr"), n.ctx) : l(t, "buClrTx") && (e.buClr = null), l(t, "buSzPct")) {
    const i = w(l(t, "buSzPct"), "val") || "", a = i.endsWith("%") ? parseFloat(i) / 100 : Number(i) / 1e5;
    e.buSz = Number.isFinite(a) && a > 0 ? Math.max(0.25, Math.min(4, a)) : null;
  } else (l(t, "buSzTx") || l(t, "buSzPts")) && (e.buSz = null);
  const o = B(t, "lnSpc", "spcPct");
  o && (e.lnSpcPct = P(o, "val") / 1e5);
  const s = qt(l(t, "spcBef")), r = qt(l(t, "spcAft"));
  return s && (e.spcBef = s), r && (e.spcAft = r), Object.assign(e, he(l(t, "defRPr"), n)), e;
}
function he(t, n) {
  if (!t) return {};
  const e = {};
  w(t, "sz") !== null && (e.sz = P(t, "sz") / 100 * ($t / q)), _(t, "b") !== void 0 && (e.b = _(t, "b")), _(t, "i") !== void 0 && (e.i = _(t, "i")), w(t, "u") && (e.u = w(t, "u") !== "none"), w(t, "strike") && (e.strike = w(t, "strike") !== "noStrike");
  const o = l(t, "solidFill");
  o ? e.color = U(o, n.ctx) : l(t, "noFill") && (e.color = null);
  const s = w(l(t, "latin"), "typeface");
  return s && (e.font = s), e;
}
const qe = {
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
}, Ze = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Ke(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const o = (n || "").toLowerCase();
  return o.startsWith("wingdings") ? o === "wingdings" && qe[e] || "•" : o === "symbol" ? Ze[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : o.startsWith("webdings") || o.startsWith("marlett") ? "•" : o === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const Kt = (...t) => {
  const n = {};
  for (const e of t) for (const [o, s] of Object.entries(e)) s !== void 0 && (n[o] = s);
  return n;
};
function Qe(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function Ht(t, n, e) {
  if (!t) return;
  const o = L(t, "p");
  if (!o.some((f) => L(f).some((g) => (g.localName === "r" || g.localName === "fld") && (B(g, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let i = 1, a = 1, c = !1;
  for (const f of [...n.bodyPr, l(t, "bodyPr")]) {
    if (!f) continue;
    for (let x = 0; x < f.attributes.length; x++) r[f.attributes[x].localName ?? f.attributes[x].name] = f.attributes[x].value;
    const g = l(f, "normAutofit");
    g && (i = w(g, "fontScale") !== null ? P(g, "fontScale") / 1e5 : 1, c = !1), g && (a = 1 - Math.max(0, Math.min(0.9, P(g, "lnSpcReduction") / 1e5))), (l(f, "noAutofit") || l(f, "spAutoFit")) && (i = 1, a = 1, c = !0);
  }
  const p = !c && [...n.bodyPr, l(t, "bodyPr")].some((f) => f && l(f, "normAutofit")), d = (f, g) => r[f] !== void 0 ? W(Number(r[f]) || 0) : W(g), u = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", h = l(t, "lstStyle"), y = [];
  let m;
  for (const f of o) {
    const g = l(f, "pPr"), x = Math.max(0, Math.min(8, P(g, "lvl"))), k = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, b = Kt(...n.levels.map((O) => Zt(O, x, e)), k, Zt(h, x, e), g ? de(g, e) : {});
    b.lnSpcPct !== void 0 && m === void 0 && (m = b.lnSpcPct);
    const M = { runs: [], align: b.algn === "ctr" ? "ctr" : b.algn === "r" ? "r" : (b.algn === "just", "l"), level: x };
    if (b.bullet === "char" || b.bullet === "num") {
      if (M.bullet = b.bullet, M.marL = b.marL ?? 0, M.indent = b.indent ?? 0, b.bullet === "char") {
        const O = Ke(b.buChar, b.buFont ?? void 0);
        O !== "•" && (M.bulletChar = O);
      } else
        b.numType && b.numType !== "arabicPeriod" && (M.numType = b.numType), b.startAt && b.startAt !== 1 && (M.startAt = b.startAt);
      b.buClr && (M.bulletColor = b.buClr), b.buSz && Math.abs(b.buSz - 1) > 1e-3 && (M.bulletScale = b.buSz);
    }
    const C = (O) => {
      const j = Kt(b, he(O, e)), I = (j.sz ?? 18 * $t / q) * i, T = j.color === null ? void 0 : j.color ?? pe("tx1", e);
      return {
        text: "",
        size: I,
        bold: j.b || void 0,
        italic: j.i || void 0,
        underline: j.u || void 0,
        strike: j.strike || void 0,
        color: T ?? void 0,
        font: Qe(j.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const O of L(f))
      if (O.localName === "r" || O.localName === "fld") {
        const j = B(O, "t")?.textContent ?? "";
        if (!j) continue;
        j.split(/[\v\n]/).forEach((I, T) => {
          T > 0 && M.runs.push({ ...C(l(O, "rPr")), br: !0 }), I && M.runs.push({ ...C(l(O, "rPr")), text: I });
        });
      } else O.localName === "br" && M.runs.push({ ...C(l(O, "rPr")), br: !0 });
    M.endSize = C(l(f, "endParaRPr")).size;
    const S = (M.runs.length ? Math.max(...M.runs.map((O) => O.size ?? 0)) : M.endSize ?? 0) * 1.2 * (b.lnSpcPct ?? 1), A = (O) => O ? ("px" in O ? O.px : O.lines * S) * a : 0, F = A(b.spcBef), E = A(b.spcAft);
    F > 0.05 && (M.spaceBefore = Math.round(F * 100) / 100), E > 0.05 && (M.spaceAfter = Math.round(E * 100) / 100), y.push(M);
  }
  return {
    paragraphs: y,
    anchor: u,
    insets: { l: d("lIns", 91440), t: d("tIns", 45720), r: d("rIns", 91440), b: d("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: m,
    ...p && { shrink: 1 }
  };
}
const pe = (t, n) => {
  const e = n.ctx.clrMap[t] ?? jt[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, ct = (t) => {
  const n = l(t, "ph");
  return n ? { type: w(n, "type") || "obj", idx: P(n, "idx") } : null;
}, ht = (t) => l(L(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), xt = /* @__PURE__ */ new Set(["title", "ctrTitle"]), Qt = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Jt = (t, n) => t === n || xt.has(t) && xt.has(n) || !Qt.has(t) && !Qt.has(n);
function Mt(t, n) {
  const e = Je(t);
  if (n.idx) {
    const o = e.find((s) => s.ph.idx === n.idx && Jt(s.ph.type, n.type));
    if (o) return o.el;
  }
  return (e.find((o) => o.ph.type === n.type && (o.ph.idx === n.idx || !n.idx || xt.has(n.type))) ?? e.find((o) => o.ph.type === n.type) ?? e.find((o) => Jt(o.ph.type, n.type)))?.el ?? null;
}
function Je(t) {
  const n = [];
  for (const e of J(t)) {
    const o = ct(ht(e));
    o && n.push({ el: e, ph: o });
  }
  return n;
}
const me = (t) => xt.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", tn = (t) => {
  const n = {};
  for (const e of L(l(t, "avLst"), "gd")) {
    const o = w(e, "name"), s = w(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function en(t) {
  const n = (r) => L(r, "gd").slice(0, 1e4).map((i) => [w(i, "name") || "", w(i, "fmla") || "val 0"]), e = L(l(t, "cxnLst"), "cxn").map((r) => [w(r, "ang") || "0", w(l(r, "pos"), "x") || "0", w(l(r, "pos"), "y") || "0"]), o = l(t, "rect"), s = L(l(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const i = [];
    for (const c of L(r)) {
      const p = L(c, "pt").map((d) => [w(d, "x") || "0", w(d, "y") || "0"]).flat();
      switch (c.localName) {
        case "moveTo":
          i.push(["M", ...p]);
          break;
        case "lnTo":
          i.push(["L", ...p]);
          break;
        case "quadBezTo":
          i.push(["Q", ...p]);
          break;
        case "cubicBezTo":
          i.push(["C", ...p]);
          break;
        case "arcTo":
          i.push(["A", w(c, "wR") || "0", w(c, "hR") || "0", w(c, "stAng") || "0", w(c, "swAng") || "0"]);
          break;
        case "close":
          i.push(["Z"]);
          break;
      }
    }
    const a = w(r, "fill");
    return { w: P(r, "w") || void 0, h: P(r, "h") || void 0, fill: a && a !== "norm" ? a : void 0, stroke: _(r, "stroke") === !1 ? !1 : void 0, d: i };
  });
  return {
    av: L(l(t, "avLst"), "gd").map((r) => [w(r, "name") || "", w(r, "fmla") || "val 0"]),
    gd: n(l(t, "gdLst")),
    cxn: e,
    rect: o ? [w(o, "l") || "l", w(o, "t") || "t", w(o, "r") || "r", w(o, "b") || "b"] : null,
    paths: s
  };
}
function pt(t, n) {
  const e = l(t, "prstGeom");
  if (e) {
    const s = {};
    for (const [r, i] of Object.entries(tn(e))) {
      const a = /^val\s+(-?\d+(\.\d+)?)/.exec(i);
      a && (s[r] = Number(a[1]));
    }
    return { geom: { kind: "preset", prst: w(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = l(t, "custGeom");
  if (o) {
    const s = en(o);
    return { geom: { kind: "custom", paths: kt(s, n.w, n.h) }, textRect: s.rect ? le(s, n.w, n.h) : void 0 };
  }
}
function mt(t, n, e, o, s, r) {
  const i = [];
  if (s > je)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), i;
  for (const a of J(t)) {
    if (++e.count > ze) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const c = sn(a, n, e, o, s, r);
      c && i.push(...Array.isArray(c) ? c : [c]);
    } catch {
      e.warnings.push(`A ${a.localName} couldn't be read and was skipped.`);
    }
  }
  return i;
}
const nn = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function on(t, n, e) {
  const o = l(t, "hlinkClick");
  if (!o) return;
  const s = w(o, "action") || "", r = e.rels(n).get(w(o, "r:id") || "");
  if (s.startsWith("ppaction://hlinkshowjump")) {
    const i = nn[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return i ? { kind: "action", action: i } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function sn(t, n, e, o, s, r) {
  const i = L(t).find((d) => d.localName.startsWith("nv")), a = rn(t, n, e, o, s, r), c = l(i ?? null, "cNvPr"), p = a ? on(c, n.part, e.pkg) : void 0;
  if (p) for (const d of Array.isArray(a) ? a : [a]) d.link = p;
  if (a && !Array.isArray(a)) {
    const d = w(c, "descr")?.trim();
    d && (a.descr = d), w(K(c, "decorative", 3), "val") === "1" && (a.decorative = !0);
  }
  return a;
}
function rn(t, n, e, o, s, r) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, a = L(t).find((u) => u.localName.startsWith("nv")), c = l(a ?? null, "cNvPr"), p = P(c, "id"), d = w(c, "name") || t.localName;
  if (w(c, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return cn(t, n, e, o, p, d, r);
    case "cxnSp": {
      const u = l(t, "spPr"), h = Q(l(u, "xfrm"));
      if (!h) return null;
      const y = o(h), m = l(t, "style"), f = nt(l(u, "ln"), i) ?? Bt(m, i) ?? { width: 1, color: { hex: "#000000" } };
      if (!f) return null;
      const g = pt(u, y) ?? { geom: { kind: "preset", prst: "line" } }, x = (b) => b ? { id: P(b, "id"), idx: P(b, "idx") } : void 0, k = l(a ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: p, name: d, ...y, geom: g.geom, line: f, start: x(l(k, "stCxn")), end: x(l(k, "endCxn")) };
    }
    case "pic": {
      const u = l(t, "spPr");
      let h = Q(l(u, "xfrm"));
      const y = ct(l(a ?? null, "nvPr"));
      if (!h && y && (h = an(y, e)), !h) return null;
      const m = l(t, "blipFill"), f = m ? ue(m, i) : null;
      if (!f)
        return e.warnings.push(`Picture "${d}" has no image the importer can read.`), null;
      const g = l(m, "srcRect"), x = g ? { l: P(g, "l") / 1e5, t: P(g, "t") / 1e5, r: P(g, "r") / 1e5, b: P(g, "b") / 1e5 } : void 0, k = w(B(m, "blip", "alphaModFix"), "amt"), b = o(h), M = pt(u, b)?.geom, C = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: p, name: d, ...b, media: f, crop: x, alpha: k !== null ? Number(k) / 1e5 : void 0, geom: C, ...B(m, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const u = l(t, "grpSpPr"), h = l(u, "xfrm"), y = Ve(h, o), m = mt(t, n, e, y, s + 1, r);
      if (!m.length) return null;
      const f = vt(m);
      return { kind: "group", id: p, name: d, ...f, children: m };
    }
    case "graphicFrame":
      return dn(t, n, e, o, p, d, s);
    default:
      return null;
  }
}
function vt(t) {
  let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
  for (const r of t)
    n = Math.min(n, r.x), e = Math.min(e, r.y), o = Math.max(o, r.x + r.w), s = Math.max(s, r.y + r.h);
  return { x: n, y: e, w: Math.max(0, o - n), h: Math.max(0, s - e) };
}
function an(t, n) {
  const e = Mt(n.layout?.tree ?? null, t), o = Q(B(e, "spPr", "xfrm"));
  if (o) return o;
  const s = Mt(n.master?.tree ?? null, { type: me(t.type), idx: 0 });
  return Q(B(s, "spPr", "xfrm"));
}
function ln(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function cn(t, n, e, o, s, r, i) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = ht(t), p = ct(c);
  if (p && !i) return null;
  const d = l(t, "spPr"), u = l(t, "style"), h = w(B(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", y = p && e.layout ? Mt(e.layout.tree, p) : null, m = p && e.master ? Mt(e.master.tree, { type: me(y ? ct(ht(y))?.type ?? p.type : p.type), idx: 0 }) : null, f = y && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, g = m && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let x = Q(l(d, "xfrm")) ?? Q(B(y, "spPr", "xfrm")) ?? Q(B(m, "spPr", "xfrm"));
  if (!x) return null;
  x = o(x);
  const k = pt(d, x) ?? (y ? pt(l(y, "spPr"), x) : void 0) ?? (m ? pt(l(m, "spPr"), x) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (_(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? it(d, a) ?? wt(u, a) ?? (f ? it(l(y, "spPr"), f) : void 0) ?? (g ? it(l(m, "spPr"), g) : void 0) ?? (f ? wt(l(y, "style"), f) : void 0) ?? { kind: "none" }, C = ln(
    () => nt(l(d, "ln"), a),
    () => Bt(u, a),
    () => f ? nt(B(y, "spPr", "ln"), f) : void 0,
    () => g ? nt(B(m, "spPr", "ln"), g) : void 0
  ) ?? null, S = [];
  if (p) {
    const R = y ? ct(ht(y))?.type ?? p.type : p.type;
    S.push(xt.has(R) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(R) ? e.masterTx.body : e.masterTx.other), S.push(B(m, "txBody", "lstStyle"), B(y, "txBody", "lstStyle"));
  } else
    S.push(e.defaultText);
  const A = l(u, "fontRef"), F = {
    levels: S,
    bodyPr: [B(m, "txBody", "bodyPr"), B(y, "txBody", "bodyPr")],
    fontRef: A ? { font: w(A, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: U(A, a.ctx) } : void 0
  }, E = Ht(l(t, "txBody"), F, a);
  if (!(M.kind !== "none" || !!C || !!E)) return null;
  let j = k.textRect;
  const I = Q(l(d, "xfrm")), T = E ? Q(l(t, "txXfrm")) : null;
  if (T && I && I.w > 0 && I.h > 0) {
    const R = x.w / I.w, H = x.h / I.h, v = { l: (T.x - I.x) * R, t: (T.y - I.y) * H, r: (T.x + T.w - I.x) * R, b: (T.y + T.h - I.y) * H };
    (Math.abs(v.l) > 0.5 || Math.abs(v.t) > 0.5 || Math.abs(v.r - x.w) > 0.5 || Math.abs(v.b - x.h) > 0.5) && (j = v);
  }
  return { kind: "shape", id: s, name: r, ...x, geom: k.geom, fill: M, line: C, text: E, textBox: h || void 0, textRect: j };
}
const te = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function fn(t, n) {
  const e = {};
  if (!t) return e;
  const o = l(t, "tcStyle"), s = l(t, "tcTxStyle"), r = l(o, "fill"), i = r ? it(r, n) : wt(o, n);
  i && (e.fill = i);
  const a = U(s, n.ctx) ?? U(l(s, "fontRef"), n.ctx);
  a && (e.text = a), w(s, "b") === "on" && (e.bold = !0);
  const c = l(o, "tcBdr");
  for (const p of ["insideH", "bottom", "top", "left"]) {
    const d = l(c, p);
    if (!d) continue;
    const u = nt(l(d, "ln"), n) ?? Bt(d, n);
    if (u !== void 0) {
      e.border = u;
      break;
    }
  }
  return e;
}
function un(t, n, e) {
  const o = ((l(t, "tableStyleId")?.textContent || "").trim() || w(e, "def") || te).toUpperCase(), s = (u) => _(t, u) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, i = L(e, "tblStyle").find((u) => (w(u, "styleId") || "").toUpperCase() === o);
  if (i) {
    const u = (g) => fn(l(i, g), n), h = l(i, "tblBg"), y = h ? l(h, "fill") ? it(l(h, "fill"), n) : wt(h, n) : void 0, m = {
      whole: u("wholeTbl"),
      b1H: u("band1H"),
      b2H: u("band2H"),
      b1V: u("band1V"),
      b2V: u("band2V"),
      firstRow: u("firstRow"),
      lastRow: u("lastRow"),
      firstCol: u("firstCol"),
      lastCol: u("lastCol")
    }, f = (g, x, k, b) => {
      const M = [m.whole], C = g - (r.firstRow ? 1 : 0), S = x - (r.firstCol ? 1 : 0);
      r.bandCol && S >= 0 && M.push(S % 2 === 0 ? m.b1V : m.b2V), r.bandRow && C >= 0 && M.push(C % 2 === 0 ? m.b1H : m.b2H), r.firstCol && x === 0 && M.push(m.firstCol), r.lastCol && x === b - 1 && M.push(m.lastCol), r.firstRow && g === 0 && M.push(m.firstRow), r.lastRow && g === k - 1 && M.push(m.lastRow);
      const A = {};
      for (const F of M)
        F.fill && (A.fill = F.fill), F.text && (A.text = F.text), F.bold && (A.bold = !0), F.border !== void 0 && (A.border = F.border);
      return A;
    };
    return y && y.kind !== "none" && (f.background = y), f;
  }
  if (o !== te) return null;
  const a = n.ctx.theme.colors.accent1 ?? "#4472c4", c = (u) => {
    const [h, y, m] = fe(a);
    return { hex: yt(st(dt(h) * u + (1 - u)), st(dt(y) * u + (1 - u)), st(dt(m) * u + (1 - u))) };
  }, p = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, d = pe("tx1", n) ?? void 0;
  return (u) => {
    const h = r.firstRow && u === 0, y = r.bandRow && !h && (u - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: h ? { hex: a } : c(y ? 0.4 : 0.2) },
      text: h ? p : d,
      bold: h || void 0,
      border: { width: 1.33, color: p }
    };
  };
}
function dn(t, n, e, o, s, r, i = 0) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = Q(l(t, "xfrm"));
  if (!c) return null;
  const p = B(t, "graphic", "graphicData"), d = l(p, "tbl");
  if (d) {
    const y = L(l(d, "tblGrid"), "gridCol").map((E) => W(P(E, "w"))), m = un(l(d, "tblPr"), a, e.tableStyles), f = [], g = [];
    let x = c.y, k = 1e6 + s * 1e3;
    const b = L(d, "tr");
    if (b.forEach((E, O) => {
      const j = W(P(E, "h")), I = [];
      g.push({ h: j, cells: I });
      let T = c.x, R = 0;
      for (const H of L(E, "tc")) {
        const v = Math.max(1, P(H, "gridSpan", 1)), N = y.slice(R, R + v).reduce((ot, tt) => ot + tt, 0);
        if (R += v, _(H, "hMerge") || _(H, "vMerge")) {
          I.push({ fill: { kind: "none" }, borders: { l: null, r: null, t: null, b: null }, hMerge: _(H, "hMerge") || void 0, vMerge: _(H, "vMerge") || void 0 }), T += N;
          continue;
        }
        const D = Math.max(1, P(H, "rowSpan", 1)), $ = l(H, "tcPr"), G = D > 1 ? j * D : j, Z = m ? m(O, R - v, b.length, y.length) : null, V = Z?.text ? { color: Z.text } : void 0, z = Ht(l(H, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: V }, a);
        z && Z?.bold && z.paragraphs.forEach((ot) => ot.runs.forEach((tt) => {
          tt.bold === void 0 && (tt.bold = !0);
        })), z && (z.insets = { l: W(P($, "marL", 91440)), r: W(P($, "marR", 91440)), t: W(P($, "marT", 45720)), b: W(P($, "marB", 45720)) }, z.anchor = w($, "anchor") === "ctr" ? "ctr" : w($, "anchor") === "b" ? "b" : "t");
        const Y = nt(l($, "lnB"), a) ?? nt(l($, "lnT"), a) ?? (Z ? Z.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), bt = Z?.fill, at = it($, a) ?? bt ?? { kind: "none" };
        f.push({
          kind: "shape",
          id: k++,
          name: `${r} cell`,
          ...o({ x: T, y: x, w: N, h: G, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: at,
          line: Y,
          text: z
        });
        const lt = (ot) => {
          const tt = nt(l($, ot), a);
          return tt !== void 0 ? tt : Y;
        };
        I.push({
          text: z ?? void 0,
          fill: at,
          borders: { l: lt("lnL"), r: lt("lnR"), t: lt("lnT"), b: lt("lnB") },
          gridSpan: v > 1 ? v : void 0,
          rowSpan: D > 1 ? D : void 0
        }), T += N;
      }
      x += j;
    }), !f.length) return null;
    if (m?.background) {
      const E = vt(f);
      f.unshift({
        kind: "shape",
        id: k++,
        name: `${r} background`,
        x: E.x,
        y: E.y,
        w: E.w,
        h: E.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: m.background,
        line: null
      });
    }
    const M = { kind: "group", id: s, name: r, ...vt(f), children: f }, C = o({ ...c, w: y.reduce((E, O) => E + O, 0), h: g.reduce((E, O) => E + O.h, 0) });
    if (m?.background || C.rot || C.flipH || C.flipV || g.some((E) => E.cells.length !== y.length)) return M;
    const S = C.w / Math.max(1e-6, y.reduce((E, O) => E + O, 0)), A = C.h / Math.max(1e-6, g.reduce((E, O) => E + O.h, 0)), F = (E) => _(l(d, "tblPr"), E) ?? !1;
    return {
      kind: "table",
      id: s,
      name: r,
      x: C.x,
      y: C.y,
      w: C.w,
      h: C.h,
      cols: y.map((E) => E * S),
      rows: g.map((E) => ({ ...E, h: E.h * A })),
      firstRow: F("firstRow") || void 0,
      bandRow: F("bandRow") || void 0,
      fallback: M
    };
  }
  const u = w(p, "uri") || "";
  if (/diagram/.test(u)) {
    const y = pn(p, n, e, o, c, s, r, i);
    if (y) return y;
    const m = mn(p, n, e, o, c, s, r, a);
    if (m) return m;
  }
  if (/drawingml\/2006\/chart$/.test(u)) {
    const y = hn(p, n, e);
    if (y) return { kind: "chart", id: s, name: r, ...o(c), chart: y };
  }
  const h = /chart/.test(u) ? "Chart" : /diagram/.test(u) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${h} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: s,
    name: r,
    ...o(c),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${h}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
const ee = {
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
function hn(t, n, e) {
  const o = K(t, "chart", 2), s = o ? e.pkg.rels(n.part).get(w(o, "r:id") || "") : void 0, r = s && !s.external ? e.pkg.xml(s.target) : null, i = l(r, "chart"), a = l(i, "plotArea");
  if (!a) return null;
  const c = J(a).find((T) => ee[T.localName]);
  if (!c) return null;
  J(a).filter((T) => /Chart$/.test(T.localName)).length > 1 && e.warnings.push("A combination chart came in as its first chart type only.");
  let d = ee[c.localName];
  d === "column" && w(l(c, "barDir"), "val") === "bar" && (d = "bar");
  const u = w(l(c, "grouping"), "val") || "";
  u === "percentStacked" && e.warnings.push("A 100% stacked chart came in as a stacked chart.");
  let h = e.ctx;
  const y = e.pkg.relOfType(s.target, "themeOverride"), m = y ? l(e.pkg.xml(y), "clrScheme") : null;
  if (m) {
    const T = { ...h.theme.colors, ...ce(m) };
    h = { ...h, theme: { ...h.theme, colors: T } };
  }
  const f = l(r, "clrMapOvr");
  if (f && f.attributes.length) {
    const T = { ...h.clrMap };
    for (let R = 0; R < f.attributes.length; R++) T[f.attributes[R].localName ?? f.attributes[R].name] = f.attributes[R].value;
    h = { ...h, clrMap: T };
  }
  const g = (T, R) => {
    const H = K(T, "strCache", 3) ?? K(T, "numCache", 3) ?? K(T, "strLit", 2) ?? K(T, "numLit", 2) ?? l(K(T, "multiLvlStrCache", 3), "lvl");
    if (!H) return [];
    const v = Math.min(1e4, P(l(H, "ptCount"), "val")), N = new Array(Math.max(0, v)).fill("");
    for (const D of L(H, "pt")) {
      const $ = P(D, "idx");
      $ >= 0 && $ < 1e4 && (N[$] = l(D, "v")?.textContent ?? "");
    }
    return N;
  }, x = L(c, "ser").slice(0, 64);
  if (!x.length) return null;
  const k = g(l(x[0], "cat")), b = x.map((T, R) => {
    const v = g(l(T, "val")).map((G) => G === "" ? null : Number.isFinite(Number(G)) ? Number(G) : null), N = g(l(T, "tx"))[0] || l(T, "tx")?.textContent?.trim() || `Series ${R + 1}`, D = l(T, "spPr"), $ = U(l(D, "solidFill"), h) ?? U(l(l(D, "ln"), "solidFill"), h);
    return { name: N, values: v, ...$ && { color: $.hex } };
  }), M = Math.max(k.length, ...b.map((T) => T.values.length));
  for (; k.length < M; ) k.push(String(k.length + 1));
  const C = l(i, "title"), S = C ? Ct(C, "t", 8).map((T) => T.textContent ?? "").join("").trim() || (b.length === 1 ? b[0].name : "") : "", A = w(B(i, "legend", "legendPos"), "val"), F = l(a, "valAx"), E = l(F, "scaling"), O = (T) => {
    const R = l(T, "dLbls");
    return !!R && (w(l(R, "showVal"), "val") === "1" || w(l(R, "showPercent"), "val") === "1");
  }, j = w(l(E, "max"), "val"), I = w(l(E, "min"), "val");
  return {
    kind: d,
    categories: k,
    series: b,
    ...S && { title: S },
    ...(u === "stacked" || u === "percentStacked") && { stacked: !0 },
    legend: l(i, "legend") ? A === "b" ? "bottom" : A === "t" ? "top" : "right" : "none",
    ...(O(c) || x.some(O)) && { dataLabels: !0 },
    gridlines: !!l(F, "majorGridlines"),
    ...j !== null && Number.isFinite(Number(j)) && { yMax: Number(j) },
    ...I !== null && Number.isFinite(Number(I)) && { yMin: Number(I) }
  };
}
function pn(t, n, e, o, s, r, i, a) {
  const c = e.pkg.rels(n.part), p = w(l(t, "relIds"), "r:dm"), d = p ? c.get(p) : void 0;
  let u;
  if (d && !d.external) {
    const x = K(e.pkg.xml(d.target), "dataModelExt", 6), k = x ? c.get(w(x, "relId") || "") : void 0;
    k && !k.external && (u = k.target);
  }
  if (!u) {
    const x = [...c.values()].filter((k) => k.type === "diagramDrawing" && !k.external);
    x.length === 1 && (u = x[0].target);
  }
  if (!u) return null;
  const h = l(e.pkg.xml(u), "spTree");
  if (!h) return null;
  const m = mt(h, { part: u, tree: h }, e, (x) => o({ ...x, x: x.x + s.x, y: x.y + s.y }), a + 1, !0);
  if (!m.length) return null;
  let f = 2e6 + r * 1e3;
  const g = (x) => x.forEach((k) => {
    k.id = f++, k.kind === "group" && g(k.children);
  });
  return g(m), { kind: "group", id: r, name: i, ...vt(m), children: m };
}
function mn(t, n, e, o, s, r, i, a) {
  const c = w(l(t, "relIds"), "r:dm"), p = c ? e.pkg.rels(n.part).get(c) : void 0;
  if (!p || p.external) return null;
  const d = e.pkg.xml(p.target), u = /* @__PURE__ */ new Map();
  for (const x of L(l(d, "ptLst"), "pt")) u.set(w(x, "modelId") || "", x);
  const h = /* @__PURE__ */ new Map();
  for (const x of L(l(d, "cxnLst"), "cxn")) {
    if ((w(x, "type") || "parOf") !== "parOf") continue;
    const k = w(x, "srcId") || "", b = w(x, "destId") || "";
    h.has(k) || h.set(k, []), h.get(k).push({ id: b, ord: P(x, "srcOrd") });
  }
  const y = [...u.values()].find((x) => w(x, "type") === "doc");
  if (!y) return null;
  const m = [], f = /* @__PURE__ */ new Set(), g = (x, k) => {
    if (!(f.has(x) || k > 16 || m.length > 500)) {
      f.add(x);
      for (const b of (h.get(x) ?? []).sort((M, C) => M.ord - C.ord)) {
        const M = u.get(b.id), C = w(M, "type") || "node";
        if (!M || C !== "node" && C !== "asst") continue;
        const S = Ht(l(M, "t"), { levels: [e.defaultText], bodyPr: [] }, a);
        for (const A of S?.paragraphs ?? [])
          A.runs.some((F) => !F.br && F.text.trim()) && m.push({
            ...A,
            align: "l",
            level: k,
            ...k > 0 ? { bullet: "char" } : {},
            runs: A.runs.map((F) => ({ ...F, size: F.size ?? (k > 0 ? 16 : 18), bold: F.bold ?? (k === 0 ? !0 : void 0) }))
          });
        g(b.id, k + 1);
      }
    }
  };
  return g(w(y, "modelId") || "", 0), m.length ? (e.warnings.push(`SmartArt diagram "${i}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: r,
    name: i,
    ...o(s),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: m, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function K(t, n, e) {
  if (!t || e < 0) return null;
  for (const o of J(t)) {
    if (o.localName === n) return o;
    const s = K(o, n, e - 1);
    if (s) return s;
  }
  return null;
}
function Nt(t, n) {
  const e = l(t, "bg");
  if (!e) return;
  const o = l(e, "bgPr");
  if (o)
    return it(o, n);
  const s = l(e, "bgRef");
  if (s) {
    const r = P(s, "idx"), a = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (a ? zt(a, { ...n, ctx: { ...n.ctx, phClr: U(s, n.ctx) ?? void 0 } }) : void 0) ?? (U(s, n.ctx) ? { kind: "solid", color: U(s, n.ctx) } : void 0);
  }
}
function gn(t, n) {
  const e = t.relOfType(n, "notesSlide"), o = e ? B(t.xml(e), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (a) => {
    for (const c of J(a)) {
      if (c.localName === "grpSp") {
        r(c);
        continue;
      }
      if (c.localName !== "sp") continue;
      const p = ct(ht(c));
      if (!(!p || p.type !== "body" && p.type !== "obj"))
        for (const d of L(l(c, "txBody"), "p")) {
          let u = "";
          for (const h of L(d))
            h.localName === "r" || h.localName === "fld" ? u += l(h, "t")?.textContent ?? "" : h.localName === "br" && (u += `
`);
          s.push(u);
        }
    }
  };
  r(o);
  const i = s.join(`
`).replace(/\s+$/, "");
  return i.trim() ? i : void 0;
}
function xn(t) {
  for (const a of L(t, "AlternateContent"))
    for (const c of L(a, "Choice")) {
      const p = l(c, "transition");
      if (p && l(p, "morph")) {
        const d = w(p, "spd");
        return { kind: "morph", durationMs: w(p, "p14:dur") !== null ? P(p, "p14:dur") : d === "fast" ? 500 : d === "slow" ? 1e3 : 750 };
      }
    }
  const n = J(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = L(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!e) return;
  const o = w(n, "spd"), s = w(n, "p14:dur") !== null ? P(n, "p14:dur") : o === "fast" ? 500 : o === "slow" ? 1e3 : 750, r = w(e, "dir"), i = (a) => a?.[0] === "r" || a?.[0] === "u" || a?.[0] === "d" ? a[0] : "l";
  switch (e.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: e.localName, dir: i(r), durationMs: s };
    case "split":
      return { kind: "split", orient: w(e, "orient") === "vert" ? "vert" : "horz", inward: r === "in" || void 0, durationMs: s };
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
function bn(t, n) {
  const e = B(t, "timing", "tnLst");
  if (!e) return [];
  const o = [];
  let s = 0;
  const r = [], i = (a, c) => {
    if (!(c > 40))
      for (const p of J(a)) {
        if (p.localName === "seq") {
          const d = l(p, "cTn"), u = w(d, "nodeType");
          if (u && u !== "mainSeq") {
            s++;
            continue;
          }
        }
        if (p.localName === "cTn" && w(p, "presetClass")) {
          r.push(p);
          continue;
        }
        i(p, c + 1);
      }
  };
  i(e, 0);
  for (const a of r) {
    const c = w(a, "presetClass");
    if (c !== "entr" && c !== "exit" && c !== "emph") {
      s++;
      continue;
    }
    const p = P(a, "presetID"), d = P(a, "presetSubtype"), u = w(a, "nodeType"), h = u === "clickEffect" ? "click" : u === "afterEffect" ? "after" : "with", y = Number(w(B(a, "stCondLst", "cond"), "delay")), m = Ct(l(a, "childTnLst"), "cBhvr", 4), f = m.map((A) => K(A, "spTgt", 2)).find(Boolean), g = f ? P(f, "spid") : NaN;
    if (!Number.isFinite(g) || K(f, "txEl", 1)) {
      s++;
      continue;
    }
    const x = m.map((A) => Number(w(l(A, "cTn"), "dur"))).filter((A) => Number.isFinite(A) && A > 1), k = x.length ? Math.max(...x) : 500, { effect: b, known: M } = we(c, p);
    M || n(`An animation PowerPoint calls preset ${p} (${c}) came in as a plain ${b}.`);
    const C = Ct(l(a, "childTnLst"), "animRot", 2)[0], S = w(a, "repeatCount");
    o.push({
      target: g,
      cls: c,
      effect: b,
      presetId: p,
      subtype: d,
      start: h,
      durationMs: k,
      delayMs: Number.isFinite(y) ? Math.max(0, y) : 0,
      ...Xt(d) && (b === "fly" || b === "wipe") && { dir: Xt(d) },
      ...b === "spin" && C && { degrees: P(C, "by") / 6e4 },
      ...S === "indefinite" ? { repeat: -1 } : S && Number(S) > 1e3 ? { repeat: Math.round(Number(S) / 1e3) } : {}
    });
  }
  return s && n(`${s} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), o;
}
function Ct(t, n, e) {
  if (!t || e < 0) return [];
  const o = [];
  for (const s of J(t))
    s.localName === n ? o.push(s) : o.push(...Ct(s, n, e - 1));
  return o;
}
function ne(t) {
  const n = J(t).find((s) => s.localName === "transition"), e = n ? w(n, "advTm") : null, o = e !== null ? Number(e) : NaN;
  return Number.isFinite(o) && o > 0 ? o : void 0;
}
function yn(t, n) {
  const e = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
  for (const r of L(l(t, "sldIdLst"), "sldId")) {
    const i = n.get(w(r, "r:id") || ""), a = w(r, "id");
    i && a && o.set(a, i.target);
  }
  const s = K(l(t, "extLst"), "sectionLst", 4);
  for (const r of L(s, "section")) {
    const i = (w(r, "name") || "").trim(), a = L(l(r, "sldIdLst"), "sldId")[0], c = a ? o.get(w(a, "id") || "") : void 0;
    i && c && !e.has(c) && e.set(c, i);
  }
  return e;
}
function kn(t, n = {}) {
  const e = [], o = (I) => {
    e.length < 200 && !e.includes(I) && e.push(I);
  }, s = n.parseXml ?? ((I) => new DOMParser().parseFromString(I, "application/xml"));
  let r, i = 0, a = 0;
  try {
    r = ye(t, {
      filter: (I) => (i++, a += I.originalSize, i <= Ut && I.originalSize <= De && a <= Gt)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (i > Ut || a > Gt) && o("The file is very large; some parts were skipped.");
  const c = new Xe(r, s, o), p = c.relOfType("", "officeDocument") ?? "ppt/presentation.xml", d = c.xml(p);
  if (!d || d.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const u = l(d, "sldSz"), h = u ? Math.max(1, W(P(u, "cx", 9144e3))) : 960, y = u ? Math.max(1, W(P(u, "cy", 5143500))) : 540, m = l(d, "defaultTextStyle"), f = c.rels(p), g = c.relOfType(p, "tableStyles"), x = g ? c.xml(g) : null, k = [], b = /* @__PURE__ */ new Set();
  for (const I of L(l(d, "sldIdLst"), "sldId")) {
    const T = f.get(w(I, "r:id") || "");
    T && !b.has(T.target) && k.length < $e && (b.add(T.target), k.push(T.target));
  }
  const M = /* @__PURE__ */ new Map(), C = (I) => {
    const T = c.relOfType(I, "theme");
    return T ? (M.has(T) || M.set(T, St(c.xml(T))), M.get(T)) : St(null);
  }, S = (I) => {
    if (!I) return null;
    const T = {};
    for (let R = 0; R < I.attributes.length; R++) T[I.attributes[R].localName ?? I.attributes[R].name] = I.attributes[R].value;
    return T;
  }, A = yn(d, f), F = [];
  k.forEach((I, T) => {
    const R = c.xml(I);
    if (!R) {
      o(`Slide ${T + 1} couldn't be read and was skipped.`);
      return;
    }
    const H = c.relOfType(I, "slideLayout"), v = H ? c.xml(H) : null, N = H ? c.relOfType(H, "slideMaster") : null, D = N ? c.xml(N) : null, $ = N ? C(N) : St(null), G = S(B(R, "clrMapOvr", "overrideClrMapping")) ?? S(B(v, "clrMapOvr", "overrideClrMapping")) ?? S(l(D, "clrMap")) ?? jt, Z = { theme: $, clrMap: G }, V = l(D, "txStyles"), z = {
      pkg: c,
      ctx: Z,
      slide: { part: I, tree: B(R, "cSld", "spTree") },
      layout: H ? { part: H, tree: B(v, "cSld", "spTree") } : null,
      master: N ? { part: N, tree: B(D, "cSld", "spTree") } : null,
      masterTx: { title: l(V, "titleStyle"), body: l(V, "bodyStyle"), other: l(V, "otherStyle") },
      defaultText: m,
      warnings: e,
      count: 0,
      tableStyles: x
    }, Y = (tt) => ({ pkg: c, part: tt?.part ?? I, ctx: Z }), bt = Nt(l(R, "cSld"), Y(z.slide)) ?? Nt(l(v, "cSld"), Y(z.layout)) ?? Nt(l(D, "cSld"), Y(z.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    z.background = bt;
    const at = [], lt = _(R, "showMasterSp") !== !1 && _(v, "showMasterSp") !== !1;
    z.master && lt && at.push(...mt(z.master.tree, z.master, z, Tt, 0, !1)), z.layout && _(R, "showMasterSp") !== !1 && at.push(...mt(z.layout.tree, z.layout, z, Tt, 0, !1)), at.push(...mt(z.slide.tree, z.slide, z, Tt, 0, !0)), F.push({
      items: at,
      background: bt,
      transition: xn(R),
      name: w(l(R, "cSld"), "name") || void 0,
      notes: gn(c, I),
      key: I,
      ...w(R, "show") === "0" && { hidden: !0 },
      ...ne(R) && { advanceAfterMs: ne(R) },
      ...A.has(I) && { section: A.get(I) }
    });
    const ot = bn(R, o);
    ot.length && (F[F.length - 1].anims = ot);
  }), F.length || o("The presentation has no slides.");
  const E = B(c.xml("docProps/core.xml"), "title")?.textContent || void 0, O = c.relOfType(p, "presProps"), j = w(l(O ? c.xml(O) : null, "showPr"), "loop");
  return { deck: { width: h, height: y, slides: F, title: E, ...(j === "1" || j === "true") && { loop: !0 } }, warnings: e };
}
const wn = 80, Mn = "default-layer", X = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, vn = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, Cn = /(courier|consolas|mono|menlo|code)/i;
function Rt(t) {
  if (!t) return "sans-serif";
  const n = Ne(t);
  return n || (Cn.test(t) ? "monospace" : vn.test(t) ? "serif" : "sans-serif");
}
function Sn(t) {
  const n = [];
  let e = [], o = !1;
  const s = () => {
    if (e.length >= 2) {
      const r = e[0], i = e[e.length - 1];
      o && Math.hypot(r.x - i.x, r.y - i.y) < 1e-6 && (r.inX = i.inX, r.inY = i.inY, e.pop()), n.push({ anchors: e, closed: o });
    }
    e = [], o = !1;
  };
  for (const r of t)
    if (r.op === "M")
      s(), e.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "L")
      e.length ? e.push({ x: r.x, y: r.y, kind: "corner" }) : e.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "C") {
      const i = e[e.length - 1];
      if (!i) {
        e.push({ x: r.x, y: r.y, kind: "corner" });
        continue;
      }
      i.outX = r.x1 - i.x, i.outY = r.y1 - i.y, e.push({ x: r.x, y: r.y, inX: r.x2 - r.x, inY: r.y2 - r.y, kind: "smooth" });
    } else r.op === "Z" && (o = !0, s());
  return s(), n;
}
const Pn = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
function Tn(t, n, e) {
  let o = !1;
  t.forEach((s, r) => {
    s.start === "click" && (o = !0);
    const i = n.itemEls?.get(s.target);
    if (!i?.length) {
      n.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    i.forEach((a, c) => {
      const p = Me(c === 0 ? s : { ...s, start: "with", delayMs: s.delayMs }, e("anim"), !o);
      p.order = r + c / (i.length + 1), (a.animations ??= []).push(p);
    });
  });
}
function Nn(t, n) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return Pe(t.action);
  const e = n.slideIds?.get(t.key);
  return e ? Te(e) : null;
}
async function In(t) {
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
async function An(t, n) {
  const e = /* @__PURE__ */ new Set(), o = (r) => {
    for (const i of r)
      if (i.kind === "group") o(i.children);
      else if (i.kind === "picture" && i.grayscale) {
        const a = n.get(i.media)?.url;
        a && e.add(a);
      } else if (i.kind === "shape" && i.fill.kind === "image" && i.fill.grayscale) {
        const a = n.get(i.fill.media)?.url;
        a && e.add(a);
      }
  };
  t.slides.forEach((r) => o(r.items));
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...e].map(async (r) => {
    const i = await In(r);
    i && s.set(r, i);
  })), s;
}
async function On(t, n, e, o) {
  if (!(typeof document > "u"))
    try {
      const s = new Image();
      s.src = t, await s.decode();
      const r = document.createElement("canvas");
      r.width = Math.max(1, Math.min(4096, Math.round(n))), r.height = Math.max(1, Math.min(4096, Math.round(e)));
      const i = r.getContext("2d");
      if (!i) return;
      if (o) {
        const a = i.createPattern(s, "repeat");
        if (!a) return;
        a.setTransform(new DOMMatrix().scale(o.sx, o.sy)), i.fillStyle = a, i.fillRect(0, 0, r.width, r.height);
      } else {
        if (Math.abs(s.naturalWidth / s.naturalHeight - n / e) < 0.01) return;
        i.drawImage(s, 0, 0, r.width, r.height);
      }
      return r.toDataURL(o ? "image/png" : "image/jpeg", 0.92);
    } catch {
      return;
    }
}
function rt(t, n, e, o) {
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
    layerId: Mn,
    groupIds: [...o].reverse(),
    // innermost first, the store's convention
    name: e.name
  };
}
function oe(t, n, e) {
  switch (n.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = X(n.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = n.kind, t.backgroundColor = X(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: X(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
      break;
    case "pattern": {
      t.backgroundColor = X(n.color), t.fillStyle = "pattern", t.patternFill = Yn(n.preset, X(n.color), n.bg ? X(n.bg) : "transparent");
      break;
    }
    case "image": {
      const o = e.images.get(n.media);
      o && (t.fillStyle = "image", t.backgroundImage = n.grayscale && e.gray.get(o.url) || o.url, t.backgroundColor = "#ffffff"), o && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
      break;
    }
  }
}
function Lt(t, n) {
  if (!n || !(n.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = X(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function Rn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function Ln(t, n) {
  const e = t.bullet === "num" ? Rn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && X(t.bulletColor) !== X(o) && (e.listMarkerColor = X(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const It = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function ge(t, n) {
  const e = t.paragraphs.flatMap((f) => f.runs.filter((g) => !g.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), i = (f) => f.runs.reduce((g, x) => g + (x.br ? 0 : x.text.trim().length), 0);
  for (const f of t.paragraphs) {
    const g = i(f);
    g && r.set(f.align ?? "l", (r.get(f.align ?? "l") ?? 0) + g);
  }
  const a = [...r].sort((f, g) => g[1] - f[1])[0]?.[0] ?? t.paragraphs.find((f) => f.runs.length)?.align ?? "l", c = (f) => i(f) > 0 && (f.align ?? "l") !== a ? f.align === "ctr" ? "center" : f.align === "r" ? "right" : "left" : void 0, p = e.every((f) => f.size === o?.size && f.bold === o?.bold && f.italic === o?.italic && f.underline === o?.underline && f.strike === o?.strike && f.font === o?.font && X(f.color) === X(o?.color)) && !t.paragraphs.some((f) => f.bullet) && !t.paragraphs.some((f, g) => g > 0 && It(t, g) > 0) && !t.paragraphs.some(c), d = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Rt(o?.font),
    textAlign: a === "ctr" ? "center" : a === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: X(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (d.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2))), t.shrink !== void 0 && t.wrap && (d.textFit = "shrink");
  const u = t.paragraphs.map((f) => f.runs.map((g) => g.br ? `
` : g.text).join("")).join(`
`);
  if (p)
    return o?.bold && (d.fontWeight = 700), o?.italic && (d.fontStyle = "italic"), n ? d.containerText = u : d.text = u, { fields: d, rich: !1 };
  const h = [], y = [], m = [];
  return t.paragraphs.forEach((f, g) => {
    const x = f.level ?? 0;
    if (f.bullet === "num") {
      const M = f.numType ?? "arabicPeriod";
      (y[x] === void 0 || m[x] !== M) && (y[x] = (f.startAt ?? 1) - 1), y[x]++, m[x] = M, y.length = x + 1, m.length = x + 1;
    } else
      y.length = Math.min(y.length, x), m.length = y.length;
    const k = f.bullet ? { listType: f.bullet === "num" ? "ordered" : "bullet", listLevel: x, ...Ln(f, t) } : {};
    f.bullet === "num" && (k.listIndex = y[x]), (f.runs.length ? f.runs : [{ text: "" }]).forEach((M, C) => {
      const S = { text: M.br ? `
` : M.text, ...C === 0 ? k : {} };
      C === 0 && g > 0 && It(t, g) > 0 && (S.paragraphSpaceBefore = It(t, g));
      const A = c(f);
      A && (S.paragraphAlign = A), M.bold && (S.bold = !0), M.italic && (S.italic = !0), M.underline && (S.underline = !0), M.strike && (S.strikethrough = !0), M.color && (S.color = X(M.color)), M.size && (S.fontSize = Math.round(M.size * 10) / 10), M.font && (S.fontFamily = Rt(M.font)), h.push(S);
    }), g < t.paragraphs.length - 1 && h.push({ text: `
` });
  }), n ? (d.richContainerText = h, d.containerText = u) : (d.richText = h, d.text = u), { fields: d, rich: !0 };
}
function At(t, n, e, o, s) {
  const { fields: r, rich: i } = ge(n, !1), a = 4, c = rt(t, i ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - a,
    y: e.y + n.insets.t - a,
    w: Math.max(e.w - n.insets.l - n.insets.r + a * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + a * 2, 8)
  }, o);
  return Object.assign(c, r, { autoResize: !n.wrap, strokeColor: r.textColor }), c;
}
const xe = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function be(t, n, e) {
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return n.stats.elements++, [At(n, t.text, t, e)];
  if (o.kind === "preset" && xe.has(o.prst)) return Et({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((u) => !u.cmds.some((h) => h.op === "Z")))
    return Et({ ...t, kind: "connector", line: t.line }, n, e);
  const s = Fn(t);
  if (s) {
    const u = rt(n, s.type, t, e);
    Object.assign(u, s.extra), oe(u, t.fill, n), Lt(u, t.line), n.byPptId.set(t.id, { el: u, item: t }), n.stats.elements++;
    const h = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, y = t.text?.insets, m = Math.abs(h.l) > 0.5 || Math.abs(h.t) > 0.5 || Math.abs(h.r - t.w) > 0.5 || Math.abs(h.b - t.h) > 0.5, f = !!y && Math.max(y.l, y.r, y.t, y.b) > 16;
    if (t.text && (m || f)) {
      const g = n.nextId("group");
      return u.groupIds = [...e, g].reverse(), n.stats.elements++, [u, At(n, t.text, { ...t, rot: 0, x: t.x + h.l, y: t.y + h.t, w: h.r - h.l, h: h.b - h.t }, [...e, g])];
    }
    if (t.text) {
      const { fields: g } = ge(t.text, !0);
      Object.assign(u, g);
    }
    return [u];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const u = n.presets[o.prst];
    if (!u)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), kt(n.presets.rect, t.w, t.h);
    const h = Object.fromEntries(Object.entries(o.adj ?? {}).map(([y, m]) => [y, `val ${m}`]));
    return kt(u, t.w, t.h, h);
  })(), i = [], a = (t.text || r.some((u) => u.fill === !1)) && r.some((u) => u.fill !== !1) ? n.nextId("group") : null, c = a ? [...e, a] : e, p = /* @__PURE__ */ new Map();
  for (const u of r) {
    const h = `${u.fill === !1 ? "nofill" : "fill"}|${u.stroke === !1 ? "nostroke" : "stroke"}`;
    p.has(h) || p.set(h, []), p.get(h).push(u);
  }
  let d = null;
  for (const [u, h] of p) {
    const y = h.flatMap((k) => k.cmds), m = ve(y);
    if (!m) continue;
    const f = Sn(Pn(y, -m.minX, -m.minY));
    if (!f.length) continue;
    const g = rt(n, "path", { ...t, x: t.x + m.minX, y: t.y + m.minY, w: Math.max(m.maxX - m.minX, 1), h: Math.max(m.maxY - m.minY, 1) }, c);
    !(Math.abs(m.minX + m.maxX - t.w) < 0.5 && Math.abs(m.minY + m.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && En(g, f, t, m), g.pathSubpaths = f, g.pathAnchors = f[0].anchors, g.pathClosed = f[0].closed, u.startsWith("fill") ? oe(g, t.fill, n) : g.backgroundColor = "transparent", u.endsWith("|stroke") ? Lt(g, t.line) : (g.strokeColor = "transparent", g.strokeWidth = 0), i.push(g), d ??= g, n.stats.paths++;
  }
  if (d && n.byPptId.set(t.id, { el: d, item: t }), t.text) {
    const u = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? le(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    i.push(At(n, t.text, { ...t, x: t.x + u.l, y: t.y + u.t, w: u.r - u.l, h: u.b - u.t }, c));
  }
  return n.stats.elements += i.length, i;
}
function En(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, i = (e.rot || 0) * Math.PI / 180, a = Math.cos(i), c = Math.sin(i), p = e.flipH ? -1 : 1, d = e.flipV ? -1 : 1, u = (x, k) => {
    const b = (x + o.minX - s) * p, M = (k + o.minY - r) * d;
    return { x: s + b * a - M * c, y: r + b * c + M * a };
  }, h = (x, k) => {
    const b = x * p, M = k * d;
    return { x: b * a - M * c, y: b * c + M * a };
  };
  let y = 1 / 0, m = 1 / 0, f = -1 / 0, g = -1 / 0;
  for (const x of n) for (const k of x.anchors) {
    const b = u(k.x, k.y);
    if (k.x = b.x, k.y = b.y, k.inX !== void 0) {
      const M = h(k.inX, k.inY ?? 0);
      k.inX = M.x, k.inY = M.y;
    }
    if (k.outX !== void 0) {
      const M = h(k.outX, k.outY ?? 0);
      k.outX = M.x, k.outY = M.y;
    }
    y = Math.min(y, k.x), m = Math.min(m, k.y), f = Math.max(f, k.x), g = Math.max(g, k.y);
  }
  for (const x of n) for (const k of x.anchors)
    k.x -= y, k.y -= m;
  t.x = t.x - o.minX + y, t.y = t.y - o.minY + m, t.width = Math.max(f - y, 1), t.height = Math.max(g - m, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Fn(t) {
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
const se = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function Et(t, n, e) {
  const o = t.geom;
  let s;
  if (o.kind === "preset" && xe.has(o.prst)) s = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (o.kind === "custom") s = o.paths.flatMap((b) => b.cmds);
  else {
    const b = n.presets[o.prst], M = Object.fromEntries(Object.entries(o.adj ?? {}).map(([C, S]) => [C, `val ${S}`]));
    s = b ? kt(b, t.w, t.h, M).flatMap((C) => C.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, i = t.h / 2, a = (t.rot || 0) * Math.PI / 180, c = (b, M) => {
    let C = b - r, S = M - i;
    return t.flipH && (C = -C), t.flipV && (S = -S), { x: t.x + r + C * Math.cos(a) - S * Math.sin(a), y: t.y + i + C * Math.sin(a) + S * Math.cos(a) };
  }, p = [];
  let d = { x: 0, y: 0 };
  for (const b of s)
    if (b.op === "M" || b.op === "L")
      d = { x: b.x, y: b.y }, p.push(c(d.x, d.y));
    else if (b.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const C = M / 12, S = 1 - C, A = S * S * S * d.x + 3 * S * S * C * b.x1 + 3 * S * C * C * b.x2 + C * C * C * b.x, F = S * S * S * d.y + 3 * S * S * C * b.y1 + 3 * S * C * C * b.y2 + C * C * C * b.y;
        p.push(c(A, F));
      }
      d = { x: b.x, y: b.y };
    }
  if (p.length < 2) return [];
  const u = Math.min(...p.map((b) => b.x)), h = Math.min(...p.map((b) => b.y)), y = Math.max(...p.map((b) => b.x)), m = Math.max(...p.map((b) => b.y)), f = t.line.head && se[t.line.head.type], g = t.line.tail && se[t.line.tail.type], x = rt(n, f || g ? "arrow" : "line", { ...t, x: u, y: h, w: Math.max(y - u, 1), h: Math.max(m - h, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  x.points = p.map((b) => ({ x: b.x - u, y: b.y - h })), x.curveType = "straight", x.startArrowhead = f ?? null, x.endArrowhead = g ?? null, Lt(x, t.line);
  const k = (b, M) => {
    if (!b) return null;
    const C = n.byPptId.get(b.id);
    if (!C || !C.el.width || !C.el.height) return null;
    const S = C.el;
    return { elementId: S.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - S.x) / S.width, anchorFractionY: (M.y + n.oy - S.y) / S.height };
  };
  return n.glue.push(() => {
    x.startBinding = k(t.start, p[0]), x.endBinding = k(t.end, p[p.length - 1]);
  }), n.stats.elements++, [x];
}
function Dn(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const c = rt(n, "rectangle", t, e);
    return Object.assign(c, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [c];
  }
  const s = rt(n, "image", t, e);
  if (s.dataURL = t.grayscale && n.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = Dt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), n.stats.elements++, n.stats.pictures++, !t.geom) return [s];
  const r = n.nextId("group"), i = be({
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
  if (i.length !== 1)
    return n.stats.elements -= i.length, [s];
  const a = i[0];
  return a.isClipMask = !0, s.groupIds = [r, ...s.groupIds], s.clipMaskId = a.id, s.maskType = "clip", [s, a];
}
const gt = (t, n) => !t && !n || !!t && !!n && t.hex.toLowerCase() === n.hex.toLowerCase() && Math.abs((t.alpha ?? 1) - (n.alpha ?? 1)) < 0.01, Ot = (t, n) => t.kind === n.kind && (t.kind === "none" || t.kind === "solid" && n.kind === "solid" && gt(t.color, n.color)), $n = (t, n) => !t && !n || !!t && !!n && Math.abs(t.width - n.width) < 0.05 && gt(t.color, n.color) && (t.dash ?? "solid") === (n.dash ?? "solid"), et = (t, n) => t.every((e) => n(e, t[0]));
function jn(t, n, e) {
  const o = !!t.firstRow;
  return re(t, o, n, e) ?? (t.rows.length < 2 ? null : re(t, !o, n, e));
}
function re(t, n, e, o) {
  const s = t.rows.length, r = t.cols.length;
  if (!s || !r) return null;
  const i = t.rows.map((v) => v.cells.map((N) => N.fill));
  if (i.flat().some((v) => v.kind !== "none" && v.kind !== "solid")) return null;
  const a = [], c = [], p = Array.from({ length: r }, () => []), d = [];
  for (let v = 0; v < s; v++) {
    const N = [];
    for (let D = 0; D < r; D++) {
      const $ = t.rows[v].cells[D], G = $.text, Z = G ? G.paragraphs.map((z) => z.runs.map((Y) => Y.br ? `
` : Y.text).join("")).join(`
`) : "";
      if (N.push($.hMerge || $.vMerge ? "" : Z), $.hMerge || $.vMerge || !G || !Z.trim()) continue;
      if (d.push(G.anchor), G.paragraphs.some((z) => z.bullet)) return null;
      const V = G.defaults ?? {};
      for (const z of G.paragraphs) {
        p[D].push(z.align ?? "l");
        for (const Y of z.runs)
          if (!(Y.br || !Y.text.trim())) {
            if ((Y.underline ?? V.underline) || (Y.strike ?? V.strike)) return null;
            c.push({ row: v, col: D, p: { size: Y.size ?? V.size ?? 18, font: Y.font ?? V.font, bold: !!(Y.bold ?? V.bold), italic: !!(Y.italic ?? V.italic), color: Y.color ?? V.color } });
          }
      }
    }
    a.push(N);
  }
  const u = c.map((v) => v.p);
  if (u.length && !et(u, (v, N) => Math.abs(v.size - N.size) < 0.5 && (v.font ?? "") === (N.font ?? "") && v.italic === N.italic)) return null;
  const h = c.filter((v) => n && v.row === 0).map((v) => v.p), y = c.filter((v) => !(n && v.row === 0)).map((v) => v.p);
  if (!et(y, (v, N) => v.bold === N.bold && gt(v.color, N.color)) || !et(h, (v, N) => gt(v.color, N.color))) return null;
  const m = y[0]?.bold ?? !1;
  if (h.some((v) => !v.bold) || !et(d, (v, N) => v === N)) return null;
  const f = [];
  for (const v of p) {
    if (!et(v, (N, D) => N === D)) return null;
    f.push(v[0] === "r" ? "right" : v[0] === "ctr" ? "center" : "left");
  }
  const g = (v, N) => !t.rows[v].cells[N].hMerge && !t.rows[v].cells[N].vMerge, x = (v) => {
    const N = i[v].filter((D, $) => g(v, $));
    return N.length && et(N, Ot) ? N[0] : N.length ? null : { kind: "none" };
  }, k = t.rows.map((v, N) => x(N));
  if (k.some((v) => !v)) return null;
  const b = k.slice(n ? 1 : 0), M = b.filter((v, N) => N % 2 === 0), C = b.filter((v, N) => N % 2 === 1);
  if (!et(M, Ot) || !et(C, Ot)) return null;
  const S = (v) => v && v.kind === "solid" ? X(v.color) : "", A = S(M[0]), F = C.length ? S(C[0]) : A;
  if (!A && F) return null;
  const E = t.rows.flatMap((v, N) => v.cells.filter((D, $) => g(N, $)).flatMap((D) => [D.borders.l, D.borders.r, D.borders.t, D.borders.b]));
  if (!et(E, $n)) return null;
  const O = E[0] ?? null, j = [];
  t.rows.forEach((v, N) => v.cells.forEach((D, $) => {
    ((D.gridSpan ?? 1) > 1 || (D.rowSpan ?? 1) > 1) && j.push({ startRow: N, startCol: $, endRow: Math.min(s - 1, N + (D.rowSpan ?? 1) - 1), endCol: Math.min(r - 1, $ + (D.gridSpan ?? 1) - 1) });
  }));
  const I = t.cols.reduce((v, N) => v + N, 0), T = t.rows.reduce((v, N) => v + N.h, 0), R = rt(e, "table", { ...t, w: I, h: T }, o), H = u[0];
  return Object.assign(R, {
    tableRows: n ? s - 1 : s,
    tableCols: r,
    tableHeaders: n,
    tableData: a,
    tableColWidths: t.cols.map((v) => v / (I || 1)),
    tableRowHeights: t.rows.map((v) => v.h / (T || 1)),
    tableHeaderColor: n ? S(k[0]) : "",
    tableHeaderTextColor: h[0]?.color && !gt(h[0].color, y[0]?.color) ? X(h[0].color) : "",
    tableRowColor: A,
    tableAltRowColor: F !== A ? F : "",
    // A presentation table isn't a sortable list: no arrows in its header.
    tableColAlignments: f,
    tableSortCol: -1,
    tableSortDir: "asc",
    tableSortArrows: !1,
    ...d[0] && d[0] !== "ctr" && { tableVerticalAlign: d[0] === "t" ? "top" : "bottom" },
    ...j.length && { tableMergedCells: j },
    strokeColor: O ? X(O.color) : "transparent",
    strokeWidth: O ? O.width : 1,
    fontSize: H?.size ?? 14,
    fontFamily: Rt(H?.font),
    textColor: X(y[0]?.color ?? h[0]?.color ?? { hex: "#000000" }),
    ...m && { fontWeight: "bold" },
    ...H?.italic && { fontStyle: "italic" }
  }), O?.dash && O.dash !== "solid" && (R.strokeStyle = /dot/i.test(O.dash) ? "dotted" : "dashed"), R;
}
function Ft(t, n, e) {
  const o = [];
  for (const s of t)
    try {
      const r = [];
      switch (s.kind) {
        case "shape":
          r.push(...be(s, n, e));
          break;
        case "connector":
          r.push(...Et(s, n, e));
          break;
        case "picture":
          r.push(...Dn(s, n, e));
          break;
        case "group":
          r.push(...Ft(s.children, n, [...e, n.nextId("group")]));
          break;
        case "table": {
          const a = jn(s, n, e);
          a ? (n.stats.elements++, r.push(a)) : s.fallback && r.push(...Ft([s.fallback], n, e));
          break;
        }
        case "chart": {
          const a = rt(n, "chart", s, e);
          a.chart = Se(s.chart), a.fontFamily = "sans-serif", n.stats.elements++, r.push(a);
          break;
        }
      }
      if (s.descr && r[0] && !r[0].altText && (r[0].altText = s.descr), s.decorative) for (const a of r) a.decorative = !0;
      const i = Nn(s.link, n);
      if (i)
        for (const a of r) a.link || (a.link = i);
      n.itemEls?.set(s.id, r), o.push(...r);
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function zn(t) {
  if (!t) return;
  const n = t.dir === "r" ? "right" : t.dir === "u" ? "up" : t.dir === "d" ? "down" : "left";
  return { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.kind === "split" ? `split-${t.orient === "vert" ? "vertical" : "horizontal"}-${t.inward ? "in" : "out"}` : t.kind === "wipe" ? `wipe-${n}` : t.kind === "cover" ? `cover-${n}` : t.kind === "pull" ? `uncover-${n}` : `slide-${n}`, duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" };
}
function Bn(t, n, e) {
  if (n)
    if (n.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = X(n.color);
    else if (n.kind === "linear" || n.kind === "radial")
      t.fillStyle = n.kind, t.backgroundColor = X(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: X(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
    else if (n.kind === "image") {
      const o = e.images.get(n.media), s = e.slideBg ?? o?.url;
      s && (t.fillStyle = "image", t.backgroundImage = s, t.backgroundColor = "#ffffff"), s && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
    } else n.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = X(n.color));
}
const Dt = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, Hn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Xn(t) {
  let n = "";
  for (let o = 0; o < t.length; o += 32768) n += String.fromCharCode(...t.subarray(o, o + 32768));
  return btoa(n);
}
async function Wn(t) {
  const n = /* @__PURE__ */ new Set(), e = (s) => {
    for (const r of s)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const s of t.slides)
    e(s.items), s.background?.kind === "image" && n.add(s.background.media);
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (s) => {
    if (!Hn.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Dt[s.ext]};base64,${Xn(s.bytes)}`;
    let i = 0, a = 0;
    try {
      const c = await createImageBitmap(new Blob([s.bytes], { type: Dt[s.ext] }));
      i = c.width, a = c.height, c.close();
    } catch {
    }
    o.set(s, { url: r, w: i, h: a });
  })), o;
}
function Yn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, i = /^pct(\d+)$/.exec(t);
  if (i) {
    const a = Math.max(1, Math.min(99, Number(i[1]))), c = a > 50, p = (c ? 100 - a : a) / 100;
    return { type: "dots", color: c ? e : n, background: c ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(p / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function _n(t, n, e) {
  const o = await Fe(), s = await Wn(t), r = Math.round(t.width), i = Math.round(t.height), a = Ce(e ?? t.title, "slides", { width: r, height: i }), c = [], p = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  a.slides = [];
  const d = await An(t, s), u = await Promise.all(t.slides.map((m) => {
    const f = m.background, g = f?.kind === "image" ? s.get(f.media) : void 0;
    return f?.kind === "image" && g ? On(g.url, r, i, f.tile) : void 0;
  })), h = t.slides.map(() => n("slide")), y = /* @__PURE__ */ new Map();
  return t.slides.forEach((m, f) => {
    m.key && y.set(m.key, h[f]);
  }), t.slides.forEach((m, f) => {
    const g = f * (r + wn), x = Wt(h[f], m.name || `Slide ${f + 1}`, g, 0, { width: r, height: i });
    x.order = f;
    const k = { ox: g, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: c, stats: p, images: s, slideBg: u[f], gray: d, slideIds: y, itemEls: /* @__PURE__ */ new Map() };
    a.elements.push(...Ft(m.items, k, [])), Tn(m.anims ?? [], k, n), k.glue.forEach((M) => M()), Bn(x, m.background, k);
    const b = zn(m.transition);
    b && (x.transition = b), m.notes && (x.notes = m.notes), m.hidden && (x.hidden = !0), m.advanceAfterMs && (x.advanceAfter = m.advanceAfterMs), m.section && (x.section = m.section), a.slides.push(x), p.slides++;
  }), a.slides.length || a.slides.push(Wt(void 0, "Slide 1", 0, 0, { width: r, height: i })), t.loop && (a.globalSettings = { ...a.globalSettings || {}, slideShowLoop: !0 }), { doc: a, warnings: [...new Set(c)], stats: p };
}
const Un = 512 * 1024 * 1024;
async function Kn(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > Un) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = kn(e), r = /* @__PURE__ */ new Set(), i = await _n(o, (c) => Ae(c, r), n);
  Ie(i.doc);
  const a = [...s, ...i.warnings];
  return a.length && console.warn("[pptx import]", a), { stats: i.stats, warnings: a };
}
export {
  Kn as importPptx
};
