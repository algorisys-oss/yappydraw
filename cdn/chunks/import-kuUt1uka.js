import { u as ye, a as we } from "./browser-DbZP-BrN.js";
import { e as ke, s as Ht, f as Me } from "./anim-map-D7T1mIAM.js";
import { E as q, i as jt, g as ve } from "./custgeom-BD5l_5dV.js";
import { aC as Ce, aD as Wt, a1 as Se, aE as Pe, aF as Te, M as Ne, q as Ie, K as Ae } from "./index-CBVjKX8o.js";
const Oe = 1e4, Re = 1e5, ae = 6e4, ut = (t) => t / ae * (Math.PI / 180);
function ie(t, n, e, o = {}) {
  const s = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), c = Math.max(r, a), g = {
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
  for (const [p, x] of Object.entries(g)) s.set(p, x);
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
    s.size > Oe || s.set(p, Le(x, b));
  };
  for (const [p, x] of t.av ?? []) f(p, o[p] ?? x);
  for (const [p, x] of Object.entries(o)) s.has(p) || f(p, x);
  for (const [p, x] of t.gd ?? []) f(p, x);
  return s;
}
function Le(t, n) {
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
      i = Math.atan2(r, s) * 180 / Math.PI * ae;
      break;
    case "cat2":
      i = s * Math.cos(Math.atan2(a, r));
      break;
    case "sat2":
      i = s * Math.sin(Math.atan2(a, r));
      break;
    case "cos":
      i = s * Math.cos(ut(r));
      break;
    case "sin":
      i = s * Math.sin(ut(r));
      break;
    case "tan":
      i = s * Math.tan(ut(r));
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
const Yt = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function wt(t, n, e, o = {}) {
  const s = Math.max(Math.abs(n), 0) * q, r = Math.max(Math.abs(e), 0) * q, a = ie(t, s, r, o), i = (b) => typeof b == "number" ? b : a.get(b) ?? (Number.isFinite(Number(b)) ? Number(b) : 0), c = [];
  let g = Re;
  for (const b of t.paths) {
    const f = b.w ? s / b.w : 1, p = b.h ? r / b.h : 1, x = (m) => i(m) * f / q, u = (m) => i(m) * p / q, d = [];
    let y = { x: 0, y: 0 }, h = { x: 0, y: 0 };
    for (const m of b.d) {
      if (--g < 0) break;
      switch (m[0]) {
        case "M":
          y = { x: x(m[1]), y: u(m[2]) }, h = y, d.push({ op: "M", ...y });
          break;
        case "L":
          y = { x: x(m[1]), y: u(m[2]) }, d.push({ op: "L", ...y });
          break;
        case "C": {
          const k = x(m[1]), M = u(m[2]), C = x(m[3]), S = u(m[4]);
          y = { x: x(m[5]), y: u(m[6]) }, d.push({ op: "C", x1: k, y1: M, x2: C, y2: S, ...y });
          break;
        }
        case "Q": {
          const k = x(m[1]), M = u(m[2]), C = x(m[3]), S = u(m[4]);
          d.push({ op: "C", x1: y.x + 2 / 3 * (k - y.x), y1: y.y + 2 / 3 * (M - y.y), x2: C + 2 / 3 * (k - C), y2: S + 2 / 3 * (M - S), x: C, y: S }), y = { x: C, y: S };
          break;
        }
        case "A": {
          const k = i(m[1]) * f / q, M = i(m[2]) * p / q;
          y = Ee(d, y, k, M, i(m[3]), i(m[4]));
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
function Ee(t, n, e, o, s, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(o) < 1e-9 || r === 0) return n;
  const a = ut(s), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, ut(r))), c = Yt(a, e, o);
  let g = Yt(a + i, e, o);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) g = c + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && g < c; ) g += 2 * Math.PI;
    for (; i < 0 && g > c; ) g -= 2 * Math.PI;
  }
  const b = n.x - e * Math.cos(c), f = n.y - o * Math.sin(c), p = g - c, x = Math.max(1, Math.min(16, Math.ceil(Math.abs(p) / (Math.PI / 2)))), u = p / x, d = 4 / 3 * Math.tan(u / 4);
  let y = c, h = n;
  for (let m = 0; m < x; m++) {
    const k = y + u, M = Math.cos(y), C = Math.sin(y), S = Math.cos(k), O = Math.sin(k);
    h = { x: b + e * S, y: f + o * O }, t.push({ op: "C", x1: b + e * (M - d * C), y1: f + o * (C + d * M), x2: b + e * (S + d * O), y2: f + o * (O - d * S), ...h }), y = k;
  }
  return h;
}
function le(t, n, e, o = {}) {
  const s = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: s, b: r };
  const a = ie(t, s * q, r * q, o), i = (p) => (a.get(p) ?? (Number.isFinite(Number(p)) ? Number(p) : 0)) / q, [c, g, b, f] = t.rect.map(i);
  return { l: c, t: g, r: b, b: f };
}
let _t = null;
async function Fe() {
  return _t ??= (await import("./presets-DP49P8i2.js")).default, _t;
}
const Ut = 5e4, De = 256 * 1024 * 1024, Vt = 1024 * 1024 * 1024, je = 1e4, $e = 32, ze = 2e4, E = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let o = t.firstChild; o; o = o.nextSibling)
    o.nodeType === 1 && (!n || o.localName === n) && e.push(o);
  return e;
}, l = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, z = (t, ...n) => {
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
function Xe(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = l(t, "Fallback");
  for (const e of E(t, "Choice"))
    if ((w(e, "Requires") || "").split(/\s+/).filter(Boolean).every((s) => Be.has(s))) return E(e);
  return E(n);
}
const J = (t) => E(t).flatMap(Xe);
class He {
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
          const r = we(o).replace(/^﻿/, "");
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
    const s = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), a = this.xml(`${s ? s + "/" : ""}_rels/${r}.rels`);
    for (const i of E(a, "Relationship")) {
      const c = w(i, "Id"), g = w(i, "Type") || "", b = w(i, "Target") || "";
      if (!c) continue;
      const f = w(i, "TargetMode") === "External";
      o.set(c, { type: g.slice(g.lastIndexOf("/") + 1), target: f ? b : We(s, b), external: f });
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
const $t = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function ce(t) {
  const n = {};
  for (const e of E(t)) {
    const o = E(e)[0];
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
  n.major = w(z(o, "majorFont", "latin"), "typeface") || n.major, n.minor = w(z(o, "minorFont", "latin"), "typeface") || n.minor;
  const s = l(e, "fmtScheme");
  return n.fills = E(l(s, "fillStyleLst")), n.lines = E(l(s, "lnStyleLst")), n.bgFills = E(l(s, "bgFillStyleLst")), n;
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
function Gt(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const o = Math.max(t, n, e), s = Math.min(t, n, e), r = (o + s) / 2;
  if (o === s) return [0, 0, r];
  const a = o - s, i = r > 0.5 ? a / (2 - o - s) : a / (o + s);
  return [(o === t ? (n - e) / a + (n < e ? 6 : 0) : o === n ? (e - t) / a + 2 : (t - n) / a + 4) * 60, i, r];
}
function Pt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const o = e < 0.5 ? e * (1 + n) : e + n - e * n, s = 2 * e - o, r = (a) => (a = (a % 1 + 1) % 1, a < 1 / 6 ? s + (o - s) * 6 * a : a < 1 / 2 ? o : a < 2 / 3 ? s + (o - s) * (2 / 3 - a) * 6 : s);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function U(t, n) {
  const e = E(t).find((o) => /Clr$/.test(o.localName));
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
      const [c, g, b] = Pt(P(t, "hue") / 6e4, P(t, "sat") / 1e5, P(t, "lum") / 1e5);
      e = yt(c, g, b);
      break;
    }
    case "schemeClr": {
      const c = w(t, "val") || "";
      if (c === "phClr") {
        n.phClr ? (e = n.phClr.hex, o = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const g = n.clrMap[c] ?? $t[c] ?? c;
      e = n.theme.colors[g] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [s, r, a] = fe(e);
  for (const c of E(t)) {
    const g = P(c, "val") / 1e5;
    switch (c.localName) {
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
        let [b, f, p] = Gt(s, r, a);
        c.localName === "lumMod" ? p *= g : c.localName === "lumOff" ? p += g : c.localName === "satMod" ? f *= g : c.localName === "satOff" ? f += g : c.localName === "hueMod" ? b *= g : b += P(c, "val") / 6e4, [s, r, a] = Pt(b, Math.max(0, Math.min(1, f)), Math.max(0, Math.min(1, p)));
        break;
      }
      case "tint":
        [s, r, a] = [s, r, a].map((b) => st(dt(b) * g + (1 - g)));
        break;
      case "shade":
        [s, r, a] = [s, r, a].map((b) => st(dt(b) * g));
        break;
      case "comp": {
        const [b, f, p] = Gt(s, r, a);
        [s, r, a] = Pt(b + 180, f, p);
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
  const i = { hex: yt(s, r, a) };
  return o < 0.999 && (i.alpha = o), i;
}
function it(t, n) {
  for (const e of E(t)) {
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
      const e = E(l(t, "gsLst"), "gs").slice(0, 256).map((s) => ({ pos: P(s, "pos") / 1e5, color: U(s, n.ctx) ?? { hex: "#000000" } }));
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
  const r = n.pkg.bytes(s.target), a = Ue[(s.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const Ve = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function nt(t, n) {
  if (!t) return;
  let e;
  for (const i of E(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = U(i, n.ctx)), i.localName === "gradFill" && (e = U(l(l(i, "gsLst"), "gs"), n.ctx));
  }
  const o = w(t, "w");
  if (e === void 0 && o === null && !l(t, "prstDash") && !l(t, "headEnd") && !l(t, "tailEnd")) return;
  const s = (i) => {
    const c = w(i, "type");
    if (!c || c === "none") return;
    const g = c === "triangle" || c === "stealth" || c === "arrow" || c === "oval" || c === "diamond" ? c : "triangle", b = w(i, "len") || w(i, "w");
    return { type: g, size: b === "sm" || b === "lg" ? b : "med" };
  }, r = Ve[w(l(t, "prstDash"), "val") || "solid"], a = w(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: o !== null ? Math.max(0, W(Number(o) || 0)) : 1,
    color: e ?? { hex: "#000000" },
    dash: r || void 0,
    cap: a === "rnd" ? "rnd" : a === "sq" ? "sq" : a === "flat" ? "flat" : void 0,
    join: l(t, "round") ? "round" : l(t, "bevel") ? "bevel" : l(t, "miter") ? "miter" : void 0,
    head: s(l(t, "headEnd")),
    tail: s(l(t, "tailEnd"))
  };
}
function kt(t, n) {
  const e = l(t, "fillRef");
  if (!e) return;
  const o = P(e, "idx");
  if (o === 0) return { kind: "none" };
  const r = (o >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[o >= 1001 ? o - 1001 : o - 1];
  if (!r) return;
  const a = U(e, n.ctx) ?? void 0;
  return zt(r, { ...n, ctx: { ...n.ctx, phClr: a } });
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
function Ge(t, n) {
  const e = Q(t);
  if (!e) return n;
  const o = l(t, "chOff"), s = l(t, "chExt"), r = o ? W(P(o, "x")) : e.x, a = o ? W(P(o, "y")) : e.y, i = s ? W(P(s, "cx")) : e.w, c = s ? W(P(s, "cy")) : e.h, g = i > 0 ? e.w / i : 1, b = c > 0 ? e.h / c : 1, f = e.x + e.w / 2, p = e.y + e.h / 2, x = e.rot * Math.PI / 180;
  return (u) => {
    let d = e.x + (u.x + u.w / 2 - r) * g, y = e.y + (u.y + u.h / 2 - a) * b, h = u.rot, m = u.flipH, k = u.flipV;
    if (e.flipH && (d = 2 * f - d, m = !m, h = -h), e.flipV && (y = 2 * p - y, k = !k, h = -h), x) {
      const S = d - f, O = y - p;
      d = f + S * Math.cos(x) - O * Math.sin(x), y = p + S * Math.sin(x) + O * Math.cos(x), h += e.rot;
    }
    const M = u.w * g, C = u.h * b;
    return n({ x: d - M / 2, y: y - C / 2, w: M, h: C, rot: (h % 360 + 360) % 360, flipH: m, flipV: k });
  };
}
function qt(t) {
  const n = l(t, "spcPts"), e = l(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, P(n, "val") / 100)) * (jt / q) };
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
    const a = l(t, "buAutoNum");
    e.bullet = "num", e.numType = w(a, "type") || "arabicPeriod", e.startAt = w(a, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(P(a, "startAt", 1)))) : void 0;
  } else l(t, "buChar") ? (e.bullet = "char", e.buChar = w(l(t, "buChar"), "char") || void 0) : l(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (l(t, "buFont") ? e.buFont = w(l(t, "buFont"), "typeface") || null : l(t, "buFontTx") && (e.buFont = null), l(t, "buClr") ? e.buClr = U(l(t, "buClr"), n.ctx) : l(t, "buClrTx") && (e.buClr = null), l(t, "buSzPct")) {
    const a = w(l(t, "buSzPct"), "val") || "", i = a.endsWith("%") ? parseFloat(a) / 100 : Number(a) / 1e5;
    e.buSz = Number.isFinite(i) && i > 0 ? Math.max(0.25, Math.min(4, i)) : null;
  } else (l(t, "buSzTx") || l(t, "buSzPts")) && (e.buSz = null);
  const o = z(t, "lnSpc", "spcPct");
  o && (e.lnSpcPct = P(o, "val") / 1e5);
  const s = qt(l(t, "spcBef")), r = qt(l(t, "spcAft"));
  return s && (e.spcBef = s), r && (e.spcAft = r), Object.assign(e, he(l(t, "defRPr"), n)), e;
}
function he(t, n) {
  if (!t) return {};
  const e = {};
  w(t, "sz") !== null && (e.sz = P(t, "sz") / 100 * (jt / q)), _(t, "b") !== void 0 && (e.b = _(t, "b")), _(t, "i") !== void 0 && (e.i = _(t, "i")), w(t, "u") && (e.u = w(t, "u") !== "none"), w(t, "strike") && (e.strike = w(t, "strike") !== "noStrike");
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
function Xt(t, n, e) {
  if (!t) return;
  const o = E(t, "p");
  if (!o.some((x) => E(x).some((u) => (u.localName === "r" || u.localName === "fld") && (z(u, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const x of [...n.bodyPr, l(t, "bodyPr")]) {
    if (!x) continue;
    for (let d = 0; d < x.attributes.length; d++) r[x.attributes[d].localName ?? x.attributes[d].name] = x.attributes[d].value;
    const u = l(x, "normAutofit");
    u && (a = w(u, "fontScale") !== null ? P(u, "fontScale") / 1e5 : 1), u && (i = 1 - Math.max(0, Math.min(0.9, P(u, "lnSpcReduction") / 1e5))), (l(x, "noAutofit") || l(x, "spAutoFit")) && (a = 1, i = 1);
  }
  const c = (x, u) => r[x] !== void 0 ? W(Number(r[x]) || 0) : W(u), g = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", b = l(t, "lstStyle"), f = [];
  let p;
  for (const x of o) {
    const u = l(x, "pPr"), d = Math.max(0, Math.min(8, P(u, "lvl"))), y = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, h = Kt(...n.levels.map((T) => Zt(T, d, e)), y, Zt(b, d, e), u ? de(u, e) : {});
    h.lnSpcPct !== void 0 && p === void 0 && (p = h.lnSpcPct);
    const m = { runs: [], align: h.algn === "ctr" ? "ctr" : h.algn === "r" ? "r" : (h.algn === "just", "l"), level: d };
    if (h.bullet === "char" || h.bullet === "num") {
      if (m.bullet = h.bullet, m.marL = h.marL ?? 0, m.indent = h.indent ?? 0, h.bullet === "char") {
        const T = Ke(h.buChar, h.buFont ?? void 0);
        T !== "•" && (m.bulletChar = T);
      } else
        h.numType && h.numType !== "arabicPeriod" && (m.numType = h.numType), h.startAt && h.startAt !== 1 && (m.startAt = h.startAt);
      h.buClr && (m.bulletColor = h.buClr), h.buSz && Math.abs(h.buSz - 1) > 1e-3 && (m.bulletScale = h.buSz);
    }
    const k = (T) => {
      const A = Kt(h, he(T, e)), $ = (A.sz ?? 18 * jt / q) * a, X = A.color === null ? void 0 : A.color ?? pe("tx1", e);
      return {
        text: "",
        size: $,
        bold: A.b || void 0,
        italic: A.i || void 0,
        underline: A.u || void 0,
        strike: A.strike || void 0,
        color: X ?? void 0,
        font: Qe(A.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const T of E(x))
      if (T.localName === "r" || T.localName === "fld") {
        const A = z(T, "t")?.textContent ?? "";
        if (!A) continue;
        A.split(/[\v\n]/).forEach(($, X) => {
          X > 0 && m.runs.push({ ...k(l(T, "rPr")), br: !0 }), $ && m.runs.push({ ...k(l(T, "rPr")), text: $ });
        });
      } else T.localName === "br" && m.runs.push({ ...k(l(T, "rPr")), br: !0 });
    m.endSize = k(l(x, "endParaRPr")).size;
    const M = (m.runs.length ? Math.max(...m.runs.map((T) => T.size ?? 0)) : m.endSize ?? 0) * 1.2 * (h.lnSpcPct ?? 1), C = (T) => T ? ("px" in T ? T.px : T.lines * M) * i : 0, S = C(h.spcBef), O = C(h.spcAft);
    S > 0.05 && (m.spaceBefore = Math.round(S * 100) / 100), O > 0.05 && (m.spaceAfter = Math.round(O * 100) / 100), f.push(m);
  }
  return {
    paragraphs: f,
    anchor: g,
    insets: { l: c("lIns", 91440), t: c("tIns", 45720), r: c("rIns", 91440), b: c("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: p
  };
}
const pe = (t, n) => {
  const e = n.ctx.clrMap[t] ?? $t[t] ?? t, o = n.ctx.theme.colors[e];
  return o ? { hex: o } : null;
}, ct = (t) => {
  const n = l(t, "ph");
  return n ? { type: w(n, "type") || "obj", idx: P(n, "idx") } : null;
}, ht = (t) => l(E(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), xt = /* @__PURE__ */ new Set(["title", "ctrTitle"]), Qt = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Jt = (t, n) => t === n || xt.has(t) && xt.has(n) || !Qt.has(t) && !Qt.has(n);
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
  for (const e of E(l(t, "avLst"), "gd")) {
    const o = w(e, "name"), s = w(e, "fmla");
    o && s && (n[o] = s);
  }
  return n;
};
function en(t) {
  const n = (r) => E(r, "gd").slice(0, 1e4).map((a) => [w(a, "name") || "", w(a, "fmla") || "val 0"]), e = E(l(t, "cxnLst"), "cxn").map((r) => [w(r, "ang") || "0", w(l(r, "pos"), "x") || "0", w(l(r, "pos"), "y") || "0"]), o = l(t, "rect"), s = E(l(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const c of E(r)) {
      const g = E(c, "pt").map((b) => [w(b, "x") || "0", w(b, "y") || "0"]).flat();
      switch (c.localName) {
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
          a.push(["A", w(c, "wR") || "0", w(c, "hR") || "0", w(c, "stAng") || "0", w(c, "swAng") || "0"]);
          break;
        case "close":
          a.push(["Z"]);
          break;
      }
    }
    const i = w(r, "fill");
    return { w: P(r, "w") || void 0, h: P(r, "h") || void 0, fill: i && i !== "norm" ? i : void 0, stroke: _(r, "stroke") === !1 ? !1 : void 0, d: a };
  });
  return {
    av: E(l(t, "avLst"), "gd").map((r) => [w(r, "name") || "", w(r, "fmla") || "val 0"]),
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
    for (const [r, a] of Object.entries(tn(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (s[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: w(e, "prst") || "rect", adj: Object.keys(s).length ? s : void 0 } };
  }
  const o = l(t, "custGeom");
  if (o) {
    const s = en(o);
    return { geom: { kind: "custom", paths: wt(s, n.w, n.h) }, textRect: s.rect ? le(s, n.w, n.h) : void 0 };
  }
}
function mt(t, n, e, o, s, r) {
  const a = [];
  if (s > $e)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of J(t)) {
    if (++e.count > ze) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const c = sn(i, n, e, o, s, r);
      c && a.push(...Array.isArray(c) ? c : [c]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
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
    const a = nn[(/jump=([a-z]+)/i.exec(s)?.[1] ?? "").toLowerCase()];
    return a ? { kind: "action", action: a } : void 0;
  }
  if (s.startsWith("ppaction://hlinksldjump")) return r && !r.external ? { kind: "slide", key: r.target } : void 0;
  if (!s)
    return r?.external && /^(https?:|mailto:|tel:)/i.test(r.target) ? { kind: "url", url: r.target } : void 0;
}
function sn(t, n, e, o, s, r) {
  const a = E(t).find((g) => g.localName.startsWith("nv")), i = rn(t, n, e, o, s, r), c = i ? on(l(a ?? null, "cNvPr"), n.part, e.pkg) : void 0;
  if (c) for (const g of Array.isArray(i) ? i : [i]) g.link = c;
  return i;
}
function rn(t, n, e, o, s, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = E(t).find((f) => f.localName.startsWith("nv")), c = l(i ?? null, "cNvPr"), g = P(c, "id"), b = w(c, "name") || t.localName;
  if (w(c, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return cn(t, n, e, o, g, b, r);
    case "cxnSp": {
      const f = l(t, "spPr"), p = Q(l(f, "xfrm"));
      if (!p) return null;
      const x = o(p), u = l(t, "style"), d = nt(l(f, "ln"), a) ?? Bt(u, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!d) return null;
      const y = pt(f, x) ?? { geom: { kind: "preset", prst: "line" } }, h = (k) => k ? { id: P(k, "id"), idx: P(k, "idx") } : void 0, m = l(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: g, name: b, ...x, geom: y.geom, line: d, start: h(l(m, "stCxn")), end: h(l(m, "endCxn")) };
    }
    case "pic": {
      const f = l(t, "spPr");
      let p = Q(l(f, "xfrm"));
      const x = ct(l(i ?? null, "nvPr"));
      if (!p && x && (p = an(x, e)), !p) return null;
      const u = l(t, "blipFill"), d = u ? ue(u, a) : null;
      if (!d)
        return e.warnings.push(`Picture "${b}" has no image the importer can read.`), null;
      const y = l(u, "srcRect"), h = y ? { l: P(y, "l") / 1e5, t: P(y, "t") / 1e5, r: P(y, "r") / 1e5, b: P(y, "b") / 1e5 } : void 0, m = w(z(u, "blip", "alphaModFix"), "amt"), k = o(p), M = pt(f, k)?.geom, C = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: g, name: b, ...k, media: d, crop: h, alpha: m !== null ? Number(m) / 1e5 : void 0, descr: w(c, "descr") || void 0, geom: C, ...z(u, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const f = l(t, "grpSpPr"), p = l(f, "xfrm"), x = Ge(p, o), u = mt(t, n, e, x, s + 1, r);
      if (!u.length) return null;
      const d = vt(u);
      return { kind: "group", id: g, name: b, ...d, children: u };
    }
    case "graphicFrame":
      return dn(t, n, e, o, g, b, s);
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
  const e = Mt(n.layout?.tree ?? null, t), o = Q(z(e, "spPr", "xfrm"));
  if (o) return o;
  const s = Mt(n.master?.tree ?? null, { type: me(t.type), idx: 0 });
  return Q(z(s, "spPr", "xfrm"));
}
function ln(...t) {
  for (const n of t) {
    const e = n();
    if (e !== void 0) return e;
  }
}
function cn(t, n, e, o, s, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = ht(t), g = ct(c);
  if (g && !a) return null;
  const b = l(t, "spPr"), f = l(t, "style"), p = w(z(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", x = g && e.layout ? Mt(e.layout.tree, g) : null, u = g && e.master ? Mt(e.master.tree, { type: me(x ? ct(ht(x))?.type ?? g.type : g.type), idx: 0 }) : null, d = x && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, y = u && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let h = Q(l(b, "xfrm")) ?? Q(z(x, "spPr", "xfrm")) ?? Q(z(u, "spPr", "xfrm"));
  if (!h) return null;
  h = o(h);
  const m = pt(b, h) ?? (x ? pt(l(x, "spPr"), h) : void 0) ?? (u ? pt(l(u, "spPr"), h) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = (_(t, "useBgFill") ? e.background?.kind === "image" ? { kind: "none" } : e.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? it(b, i) ?? kt(f, i) ?? (d ? it(l(x, "spPr"), d) : void 0) ?? (y ? it(l(u, "spPr"), y) : void 0) ?? (d ? kt(l(x, "style"), d) : void 0) ?? { kind: "none" }, C = ln(
    () => nt(l(b, "ln"), i),
    () => Bt(f, i),
    () => d ? nt(z(x, "spPr", "ln"), d) : void 0,
    () => y ? nt(z(u, "spPr", "ln"), y) : void 0
  ) ?? null, S = [];
  if (g) {
    const L = x ? ct(ht(x))?.type ?? g.type : g.type;
    S.push(xt.has(L) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(L) ? e.masterTx.body : e.masterTx.other), S.push(z(u, "txBody", "lstStyle"), z(x, "txBody", "lstStyle"));
  } else
    S.push(e.defaultText);
  const O = l(f, "fontRef"), T = {
    levels: S,
    bodyPr: [z(u, "txBody", "bodyPr"), z(x, "txBody", "bodyPr")],
    fontRef: O ? { font: w(O, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: U(O, i.ctx) } : void 0
  }, A = Xt(l(t, "txBody"), T, i);
  if (!(M.kind !== "none" || !!C || !!A)) return null;
  let X = m.textRect;
  const R = Q(l(b, "xfrm")), N = A ? Q(l(t, "txXfrm")) : null;
  if (N && R && R.w > 0 && R.h > 0) {
    const L = h.w / R.w, B = h.h / R.h, v = { l: (N.x - R.x) * L, t: (N.y - R.y) * B, r: (N.x + N.w - R.x) * L, b: (N.y + N.h - R.y) * B };
    (Math.abs(v.l) > 0.5 || Math.abs(v.t) > 0.5 || Math.abs(v.r - h.w) > 0.5 || Math.abs(v.b - h.h) > 0.5) && (X = v);
  }
  return { kind: "shape", id: s, name: r, ...h, geom: m.geom, fill: M, line: C, text: A, textBox: p || void 0, textRect: X };
}
const te = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function fn(t, n) {
  const e = {};
  if (!t) return e;
  const o = l(t, "tcStyle"), s = l(t, "tcTxStyle"), r = l(o, "fill"), a = r ? it(r, n) : kt(o, n);
  a && (e.fill = a);
  const i = U(s, n.ctx) ?? U(l(s, "fontRef"), n.ctx);
  i && (e.text = i), w(s, "b") === "on" && (e.bold = !0);
  const c = l(o, "tcBdr");
  for (const g of ["insideH", "bottom", "top", "left"]) {
    const b = l(c, g);
    if (!b) continue;
    const f = nt(l(b, "ln"), n) ?? Bt(b, n);
    if (f !== void 0) {
      e.border = f;
      break;
    }
  }
  return e;
}
function un(t, n, e) {
  const o = ((l(t, "tableStyleId")?.textContent || "").trim() || w(e, "def") || te).toUpperCase(), s = (f) => _(t, f) ?? !1, r = { firstRow: s("firstRow"), lastRow: s("lastRow"), firstCol: s("firstCol"), lastCol: s("lastCol"), bandRow: s("bandRow"), bandCol: s("bandCol") }, a = E(e, "tblStyle").find((f) => (w(f, "styleId") || "").toUpperCase() === o);
  if (a) {
    const f = (y) => fn(l(a, y), n), p = l(a, "tblBg"), x = p ? l(p, "fill") ? it(l(p, "fill"), n) : kt(p, n) : void 0, u = {
      whole: f("wholeTbl"),
      b1H: f("band1H"),
      b2H: f("band2H"),
      b1V: f("band1V"),
      b2V: f("band2V"),
      firstRow: f("firstRow"),
      lastRow: f("lastRow"),
      firstCol: f("firstCol"),
      lastCol: f("lastCol")
    }, d = (y, h, m, k) => {
      const M = [u.whole], C = y - (r.firstRow ? 1 : 0), S = h - (r.firstCol ? 1 : 0);
      r.bandCol && S >= 0 && M.push(S % 2 === 0 ? u.b1V : u.b2V), r.bandRow && C >= 0 && M.push(C % 2 === 0 ? u.b1H : u.b2H), r.firstCol && h === 0 && M.push(u.firstCol), r.lastCol && h === k - 1 && M.push(u.lastCol), r.firstRow && y === 0 && M.push(u.firstRow), r.lastRow && y === m - 1 && M.push(u.lastRow);
      const O = {};
      for (const T of M)
        T.fill && (O.fill = T.fill), T.text && (O.text = T.text), T.bold && (O.bold = !0), T.border !== void 0 && (O.border = T.border);
      return O;
    };
    return x && x.kind !== "none" && (d.background = x), d;
  }
  if (o !== te) return null;
  const i = n.ctx.theme.colors.accent1 ?? "#4472c4", c = (f) => {
    const [p, x, u] = fe(i);
    return { hex: yt(st(dt(p) * f + (1 - f)), st(dt(x) * f + (1 - f)), st(dt(u) * f + (1 - f))) };
  }, g = { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" }, b = pe("tx1", n) ?? void 0;
  return (f) => {
    const p = r.firstRow && f === 0, x = r.bandRow && !p && (f - (r.firstRow ? 1 : 0)) % 2 === 0;
    return {
      fill: { kind: "solid", color: p ? { hex: i } : c(x ? 0.4 : 0.2) },
      text: p ? g : b,
      bold: p || void 0,
      border: { width: 1.33, color: g }
    };
  };
}
function dn(t, n, e, o, s, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, c = Q(l(t, "xfrm"));
  if (!c) return null;
  const g = z(t, "graphic", "graphicData"), b = l(g, "tbl");
  if (b) {
    const x = E(l(b, "tblGrid"), "gridCol").map((A) => W(P(A, "w"))), u = un(l(b, "tblPr"), i, e.tableStyles), d = [], y = [];
    let h = c.y, m = 1e6 + s * 1e3;
    const k = E(b, "tr");
    if (k.forEach((A, $) => {
      const X = W(P(A, "h")), R = [];
      y.push({ h: X, cells: R });
      let N = c.x, L = 0;
      for (const B of E(A, "tc")) {
        const v = Math.max(1, P(B, "gridSpan", 1)), I = x.slice(L, L + v).reduce((ot, tt) => ot + tt, 0);
        if (L += v, _(B, "hMerge") || _(B, "vMerge")) {
          R.push({ fill: { kind: "none" }, borders: { l: null, r: null, t: null, b: null }, hMerge: _(B, "hMerge") || void 0, vMerge: _(B, "vMerge") || void 0 }), N += I;
          continue;
        }
        const F = Math.max(1, P(B, "rowSpan", 1)), D = l(B, "tcPr"), V = F > 1 ? X * F : X, Z = u ? u($, L - v, k.length, x.length) : null, G = Z?.text ? { color: Z.text } : void 0, j = Xt(l(B, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: G }, i);
        j && Z?.bold && j.paragraphs.forEach((ot) => ot.runs.forEach((tt) => {
          tt.bold === void 0 && (tt.bold = !0);
        })), j && (j.insets = { l: W(P(D, "marL", 91440)), r: W(P(D, "marR", 91440)), t: W(P(D, "marT", 45720)), b: W(P(D, "marB", 45720)) }, j.anchor = w(D, "anchor") === "ctr" ? "ctr" : w(D, "anchor") === "b" ? "b" : "t");
        const Y = nt(l(D, "lnB"), i) ?? nt(l(D, "lnT"), i) ?? (Z ? Z.border ?? null : { width: 1, color: { hex: "#bfbfbf" } }), bt = Z?.fill, at = it(D, i) ?? bt ?? { kind: "none" };
        d.push({
          kind: "shape",
          id: m++,
          name: `${r} cell`,
          ...o({ x: N, y: h, w: I, h: V, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: at,
          line: Y,
          text: j
        });
        const lt = (ot) => {
          const tt = nt(l(D, ot), i);
          return tt !== void 0 ? tt : Y;
        };
        R.push({
          text: j ?? void 0,
          fill: at,
          borders: { l: lt("lnL"), r: lt("lnR"), t: lt("lnT"), b: lt("lnB") },
          gridSpan: v > 1 ? v : void 0,
          rowSpan: F > 1 ? F : void 0
        }), N += I;
      }
      h += X;
    }), !d.length) return null;
    if (u?.background) {
      const A = vt(d);
      d.unshift({
        kind: "shape",
        id: m++,
        name: `${r} background`,
        x: A.x,
        y: A.y,
        w: A.w,
        h: A.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: u.background,
        line: null
      });
    }
    const M = { kind: "group", id: s, name: r, ...vt(d), children: d }, C = o({ ...c, w: x.reduce((A, $) => A + $, 0), h: y.reduce((A, $) => A + $.h, 0) });
    if (u?.background || C.rot || C.flipH || C.flipV || y.some((A) => A.cells.length !== x.length)) return M;
    const S = C.w / Math.max(1e-6, x.reduce((A, $) => A + $, 0)), O = C.h / Math.max(1e-6, y.reduce((A, $) => A + $.h, 0)), T = (A) => _(l(b, "tblPr"), A) ?? !1;
    return {
      kind: "table",
      id: s,
      name: r,
      x: C.x,
      y: C.y,
      w: C.w,
      h: C.h,
      cols: x.map((A) => A * S),
      rows: y.map((A) => ({ ...A, h: A.h * O })),
      firstRow: T("firstRow") || void 0,
      bandRow: T("bandRow") || void 0,
      fallback: M
    };
  }
  const f = w(g, "uri") || "";
  if (/diagram/.test(f)) {
    const x = pn(g, n, e, o, c, s, r, a);
    if (x) return x;
    const u = mn(g, n, e, o, c, s, r, i);
    if (u) return u;
  }
  if (/drawingml\/2006\/chart$/.test(f)) {
    const x = hn(g, n, e);
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
  const o = K(t, "chart", 2), s = o ? e.pkg.rels(n.part).get(w(o, "r:id") || "") : void 0, r = s && !s.external ? e.pkg.xml(s.target) : null, a = l(r, "chart"), i = l(a, "plotArea");
  if (!i) return null;
  const c = J(i).find((N) => ee[N.localName]);
  if (!c) return null;
  J(i).filter((N) => /Chart$/.test(N.localName)).length > 1 && e.warnings.push("A combination chart came in as its first chart type only.");
  let b = ee[c.localName];
  b === "column" && w(l(c, "barDir"), "val") === "bar" && (b = "bar");
  const f = w(l(c, "grouping"), "val") || "";
  f === "percentStacked" && e.warnings.push("A 100% stacked chart came in as a stacked chart.");
  let p = e.ctx;
  const x = e.pkg.relOfType(s.target, "themeOverride"), u = x ? l(e.pkg.xml(x), "clrScheme") : null;
  if (u) {
    const N = { ...p.theme.colors, ...ce(u) };
    p = { ...p, theme: { ...p.theme, colors: N } };
  }
  const d = l(r, "clrMapOvr");
  if (d && d.attributes.length) {
    const N = { ...p.clrMap };
    for (let L = 0; L < d.attributes.length; L++) N[d.attributes[L].localName ?? d.attributes[L].name] = d.attributes[L].value;
    p = { ...p, clrMap: N };
  }
  const y = (N, L) => {
    const B = K(N, "strCache", 3) ?? K(N, "numCache", 3) ?? K(N, "strLit", 2) ?? K(N, "numLit", 2) ?? l(K(N, "multiLvlStrCache", 3), "lvl");
    if (!B) return [];
    const v = Math.min(1e4, P(l(B, "ptCount"), "val")), I = new Array(Math.max(0, v)).fill("");
    for (const F of E(B, "pt")) {
      const D = P(F, "idx");
      D >= 0 && D < 1e4 && (I[D] = l(F, "v")?.textContent ?? "");
    }
    return I;
  }, h = E(c, "ser").slice(0, 64);
  if (!h.length) return null;
  const m = y(l(h[0], "cat")), k = h.map((N, L) => {
    const v = y(l(N, "val")).map((V) => V === "" ? null : Number.isFinite(Number(V)) ? Number(V) : null), I = y(l(N, "tx"))[0] || l(N, "tx")?.textContent?.trim() || `Series ${L + 1}`, F = l(N, "spPr"), D = U(l(F, "solidFill"), p) ?? U(l(l(F, "ln"), "solidFill"), p);
    return { name: I, values: v, ...D && { color: D.hex } };
  }), M = Math.max(m.length, ...k.map((N) => N.values.length));
  for (; m.length < M; ) m.push(String(m.length + 1));
  const C = l(a, "title"), S = C ? Ct(C, "t", 8).map((N) => N.textContent ?? "").join("").trim() || (k.length === 1 ? k[0].name : "") : "", O = w(z(a, "legend", "legendPos"), "val"), T = l(i, "valAx"), A = l(T, "scaling"), $ = (N) => {
    const L = l(N, "dLbls");
    return !!L && (w(l(L, "showVal"), "val") === "1" || w(l(L, "showPercent"), "val") === "1");
  }, X = w(l(A, "max"), "val"), R = w(l(A, "min"), "val");
  return {
    kind: b,
    categories: m,
    series: k,
    ...S && { title: S },
    ...(f === "stacked" || f === "percentStacked") && { stacked: !0 },
    legend: l(a, "legend") ? O === "b" ? "bottom" : O === "t" ? "top" : "right" : "none",
    ...($(c) || h.some($)) && { dataLabels: !0 },
    gridlines: !!l(T, "majorGridlines"),
    ...X !== null && Number.isFinite(Number(X)) && { yMax: Number(X) },
    ...R !== null && Number.isFinite(Number(R)) && { yMin: Number(R) }
  };
}
function pn(t, n, e, o, s, r, a, i) {
  const c = e.pkg.rels(n.part), g = w(l(t, "relIds"), "r:dm"), b = g ? c.get(g) : void 0;
  let f;
  if (b && !b.external) {
    const h = K(e.pkg.xml(b.target), "dataModelExt", 6), m = h ? c.get(w(h, "relId") || "") : void 0;
    m && !m.external && (f = m.target);
  }
  if (!f) {
    const h = [...c.values()].filter((m) => m.type === "diagramDrawing" && !m.external);
    h.length === 1 && (f = h[0].target);
  }
  if (!f) return null;
  const p = l(e.pkg.xml(f), "spTree");
  if (!p) return null;
  const u = mt(p, { part: f, tree: p }, e, (h) => o({ ...h, x: h.x + s.x, y: h.y + s.y }), i + 1, !0);
  if (!u.length) return null;
  let d = 2e6 + r * 1e3;
  const y = (h) => h.forEach((m) => {
    m.id = d++, m.kind === "group" && y(m.children);
  });
  return y(u), { kind: "group", id: r, name: a, ...vt(u), children: u };
}
function mn(t, n, e, o, s, r, a, i) {
  const c = w(l(t, "relIds"), "r:dm"), g = c ? e.pkg.rels(n.part).get(c) : void 0;
  if (!g || g.external) return null;
  const b = e.pkg.xml(g.target), f = /* @__PURE__ */ new Map();
  for (const h of E(l(b, "ptLst"), "pt")) f.set(w(h, "modelId") || "", h);
  const p = /* @__PURE__ */ new Map();
  for (const h of E(l(b, "cxnLst"), "cxn")) {
    if ((w(h, "type") || "parOf") !== "parOf") continue;
    const m = w(h, "srcId") || "", k = w(h, "destId") || "";
    p.has(m) || p.set(m, []), p.get(m).push({ id: k, ord: P(h, "srcOrd") });
  }
  const x = [...f.values()].find((h) => w(h, "type") === "doc");
  if (!x) return null;
  const u = [], d = /* @__PURE__ */ new Set(), y = (h, m) => {
    if (!(d.has(h) || m > 16 || u.length > 500)) {
      d.add(h);
      for (const k of (p.get(h) ?? []).sort((M, C) => M.ord - C.ord)) {
        const M = f.get(k.id), C = w(M, "type") || "node";
        if (!M || C !== "node" && C !== "asst") continue;
        const S = Xt(l(M, "t"), { levels: [e.defaultText], bodyPr: [] }, i);
        for (const O of S?.paragraphs ?? [])
          O.runs.some((T) => !T.br && T.text.trim()) && u.push({
            ...O,
            align: "l",
            level: m,
            ...m > 0 ? { bullet: "char" } : {},
            runs: O.runs.map((T) => ({ ...T, size: T.size ?? (m > 0 ? 16 : 18), bold: T.bold ?? (m === 0 ? !0 : void 0) }))
          });
        y(k.id, m + 1);
      }
    }
  };
  return y(w(x, "modelId") || "", 0), u.length ? (e.warnings.push(`SmartArt diagram "${a}" had no saved drawing; its text was imported as a list.`), {
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
    const r = P(s, "idx"), i = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1];
    return (i ? zt(i, { ...n, ctx: { ...n.ctx, phClr: U(s, n.ctx) ?? void 0 } }) : void 0) ?? (U(s, n.ctx) ? { kind: "solid", color: U(s, n.ctx) } : void 0);
  }
}
function gn(t, n) {
  const e = t.relOfType(n, "notesSlide"), o = e ? z(t.xml(e), "cSld", "spTree") : null;
  if (!o) return;
  const s = [], r = (i) => {
    for (const c of J(i)) {
      if (c.localName === "grpSp") {
        r(c);
        continue;
      }
      if (c.localName !== "sp") continue;
      const g = ct(ht(c));
      if (!(!g || g.type !== "body" && g.type !== "obj"))
        for (const b of E(l(c, "txBody"), "p")) {
          let f = "";
          for (const p of E(b))
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
function xn(t) {
  for (const a of E(t, "AlternateContent"))
    for (const i of E(a, "Choice")) {
      const c = l(i, "transition");
      if (c && l(c, "morph")) {
        const g = w(c, "spd");
        return { kind: "morph", durationMs: w(c, "p14:dur") !== null ? P(c, "p14:dur") : g === "fast" ? 500 : g === "slow" ? 1e3 : 750 };
      }
    }
  const n = J(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = E(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!e) return;
  const o = w(n, "spd"), s = w(n, "p14:dur") !== null ? P(n, "p14:dur") : o === "fast" ? 500 : o === "slow" ? 1e3 : 750, r = w(e, "dir");
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
function bn(t, n) {
  const e = z(t, "timing", "tnLst");
  if (!e) return [];
  const o = [];
  let s = 0;
  const r = [], a = (i, c) => {
    if (!(c > 40))
      for (const g of J(i)) {
        if (g.localName === "seq") {
          const b = l(g, "cTn"), f = w(b, "nodeType");
          if (f && f !== "mainSeq") {
            s++;
            continue;
          }
        }
        if (g.localName === "cTn" && w(g, "presetClass")) {
          r.push(g);
          continue;
        }
        a(g, c + 1);
      }
  };
  a(e, 0);
  for (const i of r) {
    const c = w(i, "presetClass");
    if (c !== "entr" && c !== "exit" && c !== "emph") {
      s++;
      continue;
    }
    const g = P(i, "presetID"), b = P(i, "presetSubtype"), f = w(i, "nodeType"), p = f === "clickEffect" ? "click" : f === "afterEffect" ? "after" : "with", x = Number(w(z(i, "stCondLst", "cond"), "delay")), u = Ct(l(i, "childTnLst"), "cBhvr", 4), d = u.map((O) => K(O, "spTgt", 2)).find(Boolean), y = d ? P(d, "spid") : NaN;
    if (!Number.isFinite(y) || K(d, "txEl", 1)) {
      s++;
      continue;
    }
    const h = u.map((O) => Number(w(l(O, "cTn"), "dur"))).filter((O) => Number.isFinite(O) && O > 1), m = h.length ? Math.max(...h) : 500, { effect: k, known: M } = ke(c, g);
    M || n(`An animation PowerPoint calls preset ${g} (${c}) came in as a plain ${k}.`);
    const C = Ct(l(i, "childTnLst"), "animRot", 2)[0], S = w(i, "repeatCount");
    o.push({
      target: y,
      cls: c,
      effect: k,
      presetId: g,
      subtype: b,
      start: p,
      durationMs: m,
      delayMs: Number.isFinite(x) ? Math.max(0, x) : 0,
      ...Ht(b) && (k === "fly" || k === "wipe") && { dir: Ht(b) },
      ...k === "spin" && C && { degrees: P(C, "by") / 6e4 },
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
  for (const r of E(l(t, "sldIdLst"), "sldId")) {
    const a = n.get(w(r, "r:id") || ""), i = w(r, "id");
    a && i && o.set(i, a.target);
  }
  const s = K(l(t, "extLst"), "sectionLst", 4);
  for (const r of E(s, "section")) {
    const a = (w(r, "name") || "").trim(), i = E(l(r, "sldIdLst"), "sldId")[0], c = i ? o.get(w(i, "id") || "") : void 0;
    a && c && !e.has(c) && e.set(c, a);
  }
  return e;
}
function wn(t, n = {}) {
  const e = [], o = (R) => {
    e.length < 200 && !e.includes(R) && e.push(R);
  }, s = n.parseXml ?? ((R) => new DOMParser().parseFromString(R, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = ye(t, {
      filter: (R) => (a++, i += R.originalSize, a <= Ut && R.originalSize <= De && i <= Vt)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > Ut || i > Vt) && o("The file is very large; some parts were skipped.");
  const c = new He(r, s, o), g = c.relOfType("", "officeDocument") ?? "ppt/presentation.xml", b = c.xml(g);
  if (!b || b.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const f = l(b, "sldSz"), p = f ? Math.max(1, W(P(f, "cx", 9144e3))) : 960, x = f ? Math.max(1, W(P(f, "cy", 5143500))) : 540, u = l(b, "defaultTextStyle"), d = c.rels(g), y = c.relOfType(g, "tableStyles"), h = y ? c.xml(y) : null, m = [], k = /* @__PURE__ */ new Set();
  for (const R of E(l(b, "sldIdLst"), "sldId")) {
    const N = d.get(w(R, "r:id") || "");
    N && !k.has(N.target) && m.length < je && (k.add(N.target), m.push(N.target));
  }
  const M = /* @__PURE__ */ new Map(), C = (R) => {
    const N = c.relOfType(R, "theme");
    return N ? (M.has(N) || M.set(N, St(c.xml(N))), M.get(N)) : St(null);
  }, S = (R) => {
    if (!R) return null;
    const N = {};
    for (let L = 0; L < R.attributes.length; L++) N[R.attributes[L].localName ?? R.attributes[L].name] = R.attributes[L].value;
    return N;
  }, O = yn(b, d), T = [];
  m.forEach((R, N) => {
    const L = c.xml(R);
    if (!L) {
      o(`Slide ${N + 1} couldn't be read and was skipped.`);
      return;
    }
    const B = c.relOfType(R, "slideLayout"), v = B ? c.xml(B) : null, I = B ? c.relOfType(B, "slideMaster") : null, F = I ? c.xml(I) : null, D = I ? C(I) : St(null), V = S(z(L, "clrMapOvr", "overrideClrMapping")) ?? S(z(v, "clrMapOvr", "overrideClrMapping")) ?? S(l(F, "clrMap")) ?? $t, Z = { theme: D, clrMap: V }, G = l(F, "txStyles"), j = {
      pkg: c,
      ctx: Z,
      slide: { part: R, tree: z(L, "cSld", "spTree") },
      layout: B ? { part: B, tree: z(v, "cSld", "spTree") } : null,
      master: I ? { part: I, tree: z(F, "cSld", "spTree") } : null,
      masterTx: { title: l(G, "titleStyle"), body: l(G, "bodyStyle"), other: l(G, "otherStyle") },
      defaultText: u,
      warnings: e,
      count: 0,
      tableStyles: h
    }, Y = (tt) => ({ pkg: c, part: tt?.part ?? R, ctx: Z }), bt = Nt(l(L, "cSld"), Y(j.slide)) ?? Nt(l(v, "cSld"), Y(j.layout)) ?? Nt(l(F, "cSld"), Y(j.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    j.background = bt;
    const at = [], lt = _(L, "showMasterSp") !== !1 && _(v, "showMasterSp") !== !1;
    j.master && lt && at.push(...mt(j.master.tree, j.master, j, Tt, 0, !1)), j.layout && _(L, "showMasterSp") !== !1 && at.push(...mt(j.layout.tree, j.layout, j, Tt, 0, !1)), at.push(...mt(j.slide.tree, j.slide, j, Tt, 0, !0)), T.push({
      items: at,
      background: bt,
      transition: xn(L),
      name: w(l(L, "cSld"), "name") || void 0,
      notes: gn(c, R),
      key: R,
      ...w(L, "show") === "0" && { hidden: !0 },
      ...ne(L) && { advanceAfterMs: ne(L) },
      ...O.has(R) && { section: O.get(R) }
    });
    const ot = bn(L, o);
    ot.length && (T[T.length - 1].anims = ot);
  }), T.length || o("The presentation has no slides.");
  const A = z(c.xml("docProps/core.xml"), "title")?.textContent || void 0, $ = c.relOfType(g, "presProps"), X = w(l($ ? c.xml($) : null, "showPr"), "loop");
  return { deck: { width: p, height: x, slides: T, title: A, ...(X === "1" || X === "true") && { loop: !0 } }, warnings: e };
}
const kn = 80, Mn = "default-layer", H = (t) => {
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
const Pn = (t, n, e) => t.map((o) => o.op === "Z" ? o : o.op === "C" ? { ...o, x1: o.x1 + n, y1: o.y1 + e, x2: o.x2 + n, y2: o.y2 + e, x: o.x + n, y: o.y + e } : { ...o, x: o.x + n, y: o.y + e });
function Tn(t, n, e) {
  let o = !1;
  t.forEach((s, r) => {
    s.start === "click" && (o = !0);
    const a = n.itemEls?.get(s.target);
    if (!a?.length) {
      n.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    a.forEach((i, c) => {
      const g = Me(c === 0 ? s : { ...s, start: "with", delayMs: s.delayMs }, e("anim"), !o);
      g.order = r + c / (a.length + 1), (i.animations ??= []).push(g);
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
    const a = await In(r);
    a && s.set(r, a);
  })), s;
}
async function On(t, n, e, o) {
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
      t.backgroundColor = H(n.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = n.kind, t.backgroundColor = H(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: H(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
      break;
    case "pattern": {
      t.backgroundColor = H(n.color), t.fillStyle = "pattern", t.patternFill = Yn(n.preset, H(n.color), n.bg ? H(n.bg) : "transparent");
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
  t.strokeColor = H(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function Rn(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], o = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], s = {};
  return e && (s.listNumberStyle = e), o && (s.listNumberSuffix = o), s;
}
function Ln(t, n) {
  const e = t.bullet === "num" ? Rn(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, o = t.runs.find((s) => !s.br)?.color ?? n.defaults?.color;
  return t.bulletColor && H(t.bulletColor) !== H(o) && (e.listMarkerColor = H(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const It = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function ge(t, n) {
  const e = t.paragraphs.flatMap((d) => d.runs.filter((y) => !y.br)), o = e[0], s = o?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (d) => d.runs.reduce((y, h) => y + (h.br ? 0 : h.text.trim().length), 0);
  for (const d of t.paragraphs) {
    const y = a(d);
    y && r.set(d.align ?? "l", (r.get(d.align ?? "l") ?? 0) + y);
  }
  const i = [...r].sort((d, y) => y[1] - d[1])[0]?.[0] ?? t.paragraphs.find((d) => d.runs.length)?.align ?? "l", c = (d) => a(d) > 0 && (d.align ?? "l") !== i ? d.align === "ctr" ? "center" : d.align === "r" ? "right" : "left" : void 0, g = e.every((d) => d.size === o?.size && d.bold === o?.bold && d.italic === o?.italic && d.underline === o?.underline && d.strike === o?.strike && d.font === o?.font && H(d.color) === H(o?.color)) && !t.paragraphs.some((d) => d.bullet) && !t.paragraphs.some((d, y) => y > 0 && It(t, y) > 0) && !t.paragraphs.some(c), b = {
    fontSize: Math.round(s * 10) / 10,
    fontFamily: Rt(o?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: H(o?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (b.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const f = t.paragraphs.map((d) => d.runs.map((y) => y.br ? `
` : y.text).join("")).join(`
`);
  if (g)
    return o?.bold && (b.fontWeight = 700), o?.italic && (b.fontStyle = "italic"), n ? b.containerText = f : b.text = f, { fields: b, rich: !1 };
  const p = [], x = [], u = [];
  return t.paragraphs.forEach((d, y) => {
    const h = d.level ?? 0;
    if (d.bullet === "num") {
      const M = d.numType ?? "arabicPeriod";
      (x[h] === void 0 || u[h] !== M) && (x[h] = (d.startAt ?? 1) - 1), x[h]++, u[h] = M, x.length = h + 1, u.length = h + 1;
    } else
      x.length = Math.min(x.length, h), u.length = x.length;
    const m = d.bullet ? { listType: d.bullet === "num" ? "ordered" : "bullet", listLevel: h, ...Ln(d, t) } : {};
    d.bullet === "num" && (m.listIndex = x[h]), (d.runs.length ? d.runs : [{ text: "" }]).forEach((M, C) => {
      const S = { text: M.br ? `
` : M.text, ...C === 0 ? m : {} };
      C === 0 && y > 0 && It(t, y) > 0 && (S.paragraphSpaceBefore = It(t, y));
      const O = c(d);
      O && (S.paragraphAlign = O), M.bold && (S.bold = !0), M.italic && (S.italic = !0), M.underline && (S.underline = !0), M.strike && (S.strikethrough = !0), M.color && (S.color = H(M.color)), M.size && (S.fontSize = Math.round(M.size * 10) / 10), M.font && (S.fontFamily = Rt(M.font)), p.push(S);
    }), y < t.paragraphs.length - 1 && p.push({ text: `
` });
  }), n ? (b.richContainerText = p, b.containerText = f) : (b.richText = p, b.text = f), { fields: b, rich: !0 };
}
function At(t, n, e, o, s) {
  const { fields: r, rich: a } = ge(n, !1), i = 4, c = rt(t, a ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - i,
    y: e.y + n.insets.t - i,
    w: Math.max(e.w - n.insets.l - n.insets.r + i * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + i * 2, 8)
  }, o);
  return Object.assign(c, r, { autoResize: !n.wrap, strokeColor: r.textColor }), c;
}
const xe = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function be(t, n, e) {
  const o = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || o.kind === "preset" && o.prst === "rect"))
    return n.stats.elements++, [At(n, t.text, t, e)];
  if (o.kind === "preset" && xe.has(o.prst)) return Et({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (o.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && o.paths.every((f) => !f.cmds.some((p) => p.op === "Z")))
    return Et({ ...t, kind: "connector", line: t.line }, n, e);
  const s = Fn(t);
  if (s) {
    const f = rt(n, s.type, t, e);
    Object.assign(f, s.extra), oe(f, t.fill, n), Lt(f, t.line), n.byPptId.set(t.id, { el: f, item: t }), n.stats.elements++;
    const p = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, x = t.text?.insets, u = Math.abs(p.l) > 0.5 || Math.abs(p.t) > 0.5 || Math.abs(p.r - t.w) > 0.5 || Math.abs(p.b - t.h) > 0.5, d = !!x && Math.max(x.l, x.r, x.t, x.b) > 16;
    if (t.text && (u || d)) {
      const y = n.nextId("group");
      return f.groupIds = [...e, y].reverse(), n.stats.elements++, [f, At(n, t.text, { ...t, rot: 0, x: t.x + p.l, y: t.y + p.t, w: p.r - p.l, h: p.b - p.t }, [...e, y])];
    }
    if (t.text) {
      const { fields: y } = ge(t.text, !0);
      Object.assign(f, y);
    }
    return [f];
  }
  const r = o.kind === "custom" ? o.paths : (() => {
    const f = n.presets[o.prst];
    if (!f)
      return n.warnings.push(`Unknown shape "${o.prst}" was imported as a rectangle.`), wt(n.presets.rect, t.w, t.h);
    const p = Object.fromEntries(Object.entries(o.adj ?? {}).map(([x, u]) => [x, `val ${u}`]));
    return wt(f, t.w, t.h, p);
  })(), a = [], i = (t.text || r.some((f) => f.fill === !1)) && r.some((f) => f.fill !== !1) ? n.nextId("group") : null, c = i ? [...e, i] : e, g = /* @__PURE__ */ new Map();
  for (const f of r) {
    const p = `${f.fill === !1 ? "nofill" : "fill"}|${f.stroke === !1 ? "nostroke" : "stroke"}`;
    g.has(p) || g.set(p, []), g.get(p).push(f);
  }
  let b = null;
  for (const [f, p] of g) {
    const x = p.flatMap((m) => m.cmds), u = ve(x);
    if (!u) continue;
    const d = Sn(Pn(x, -u.minX, -u.minY));
    if (!d.length) continue;
    const y = rt(n, "path", { ...t, x: t.x + u.minX, y: t.y + u.minY, w: Math.max(u.maxX - u.minX, 1), h: Math.max(u.maxY - u.minY, 1) }, c);
    !(Math.abs(u.minX + u.maxX - t.w) < 0.5 && Math.abs(u.minY + u.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && En(y, d, t, u), y.pathSubpaths = d, y.pathAnchors = d[0].anchors, y.pathClosed = d[0].closed, f.startsWith("fill") ? oe(y, t.fill, n) : y.backgroundColor = "transparent", f.endsWith("|stroke") ? Lt(y, t.line) : (y.strokeColor = "transparent", y.strokeWidth = 0), a.push(y), b ??= y, n.stats.paths++;
  }
  if (b && n.byPptId.set(t.id, { el: b, item: t }), t.text) {
    const f = t.textRect ?? (o.kind === "preset" && n.presets[o.prst] ? le(n.presets[o.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(At(n, t.text, { ...t, x: t.x + f.l, y: t.y + f.t, w: f.r - f.l, h: f.b - f.t }, c));
  }
  return n.stats.elements += a.length, a;
}
function En(t, n, e, o) {
  const s = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), c = Math.sin(a), g = e.flipH ? -1 : 1, b = e.flipV ? -1 : 1, f = (h, m) => {
    const k = (h + o.minX - s) * g, M = (m + o.minY - r) * b;
    return { x: s + k * i - M * c, y: r + k * c + M * i };
  }, p = (h, m) => {
    const k = h * g, M = m * b;
    return { x: k * i - M * c, y: k * c + M * i };
  };
  let x = 1 / 0, u = 1 / 0, d = -1 / 0, y = -1 / 0;
  for (const h of n) for (const m of h.anchors) {
    const k = f(m.x, m.y);
    if (m.x = k.x, m.y = k.y, m.inX !== void 0) {
      const M = p(m.inX, m.inY ?? 0);
      m.inX = M.x, m.inY = M.y;
    }
    if (m.outX !== void 0) {
      const M = p(m.outX, m.outY ?? 0);
      m.outX = M.x, m.outY = M.y;
    }
    x = Math.min(x, m.x), u = Math.min(u, m.y), d = Math.max(d, m.x), y = Math.max(y, m.y);
  }
  for (const h of n) for (const m of h.anchors)
    m.x -= x, m.y -= u;
  t.x = t.x - o.minX + x, t.y = t.y - o.minY + u, t.width = Math.max(d - x, 1), t.height = Math.max(y - u, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
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
  else if (o.kind === "custom") s = o.paths.flatMap((k) => k.cmds);
  else {
    const k = n.presets[o.prst], M = Object.fromEntries(Object.entries(o.adj ?? {}).map(([C, S]) => [C, `val ${S}`]));
    s = k ? wt(k, t.w, t.h, M).flatMap((C) => C.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, c = (k, M) => {
    let C = k - r, S = M - a;
    return t.flipH && (C = -C), t.flipV && (S = -S), { x: t.x + r + C * Math.cos(i) - S * Math.sin(i), y: t.y + a + C * Math.sin(i) + S * Math.cos(i) };
  }, g = [];
  let b = { x: 0, y: 0 };
  for (const k of s)
    if (k.op === "M" || k.op === "L")
      b = { x: k.x, y: k.y }, g.push(c(b.x, b.y));
    else if (k.op === "C") {
      for (let M = 1; M <= 12; M++) {
        const C = M / 12, S = 1 - C, O = S * S * S * b.x + 3 * S * S * C * k.x1 + 3 * S * C * C * k.x2 + C * C * C * k.x, T = S * S * S * b.y + 3 * S * S * C * k.y1 + 3 * S * C * C * k.y2 + C * C * C * k.y;
        g.push(c(O, T));
      }
      b = { x: k.x, y: k.y };
    }
  if (g.length < 2) return [];
  const f = Math.min(...g.map((k) => k.x)), p = Math.min(...g.map((k) => k.y)), x = Math.max(...g.map((k) => k.x)), u = Math.max(...g.map((k) => k.y)), d = t.line.head && se[t.line.head.type], y = t.line.tail && se[t.line.tail.type], h = rt(n, d || y ? "arrow" : "line", { ...t, x: f, y: p, w: Math.max(x - f, 1), h: Math.max(u - p, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  h.points = g.map((k) => ({ x: k.x - f, y: k.y - p })), h.curveType = "straight", h.startArrowhead = d ?? null, h.endArrowhead = y ?? null, Lt(h, t.line);
  const m = (k, M) => {
    if (!k) return null;
    const C = n.byPptId.get(k.id);
    if (!C || !C.el.width || !C.el.height) return null;
    const S = C.el;
    return { elementId: S.id, focus: 0, gap: 0, anchorFractionX: (M.x + n.ox - S.x) / S.width, anchorFractionY: (M.y + n.oy - S.y) / S.height };
  };
  return n.glue.push(() => {
    h.startBinding = m(t.start, g[0]), h.endBinding = m(t.end, g[g.length - 1]);
  }), n.stats.elements++, [h];
}
function Dn(t, n, e) {
  const o = n.images.get(t.media);
  if (!o) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const c = rt(n, "rectangle", t, e);
    return Object.assign(c, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [c];
  }
  const s = rt(n, "image", t, e);
  if (s.dataURL = t.grayscale && n.gray.get(o.url) || o.url, s.status = "loaded", s.mimeType = Dt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (s.crop = { x: t.crop.l * o.w, y: t.crop.t * o.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * o.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * o.h) }), t.alpha !== void 0 && t.alpha < 1 && (s.opacity = Math.round(t.alpha * 100)), t.descr && (s.altText = t.descr), n.stats.elements++, n.stats.pictures++, !t.geom) return [s];
  const r = n.nextId("group"), a = be({
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
const gt = (t, n) => !t && !n || !!t && !!n && t.hex.toLowerCase() === n.hex.toLowerCase() && Math.abs((t.alpha ?? 1) - (n.alpha ?? 1)) < 0.01, Ot = (t, n) => t.kind === n.kind && (t.kind === "none" || t.kind === "solid" && n.kind === "solid" && gt(t.color, n.color)), jn = (t, n) => !t && !n || !!t && !!n && Math.abs(t.width - n.width) < 0.05 && gt(t.color, n.color) && (t.dash ?? "solid") === (n.dash ?? "solid"), et = (t, n) => t.every((e) => n(e, t[0]));
function $n(t, n, e) {
  const o = !!t.firstRow;
  return re(t, o, n, e) ?? (t.rows.length < 2 ? null : re(t, !o, n, e));
}
function re(t, n, e, o) {
  const s = t.rows.length, r = t.cols.length;
  if (!s || !r) return null;
  const a = t.rows.map((v) => v.cells.map((I) => I.fill));
  if (a.flat().some((v) => v.kind !== "none" && v.kind !== "solid")) return null;
  const i = [], c = [], g = Array.from({ length: r }, () => []), b = [];
  for (let v = 0; v < s; v++) {
    const I = [];
    for (let F = 0; F < r; F++) {
      const D = t.rows[v].cells[F], V = D.text, Z = V ? V.paragraphs.map((j) => j.runs.map((Y) => Y.br ? `
` : Y.text).join("")).join(`
`) : "";
      if (I.push(D.hMerge || D.vMerge ? "" : Z), D.hMerge || D.vMerge || !V || !Z.trim()) continue;
      if (b.push(V.anchor), V.paragraphs.some((j) => j.bullet)) return null;
      const G = V.defaults ?? {};
      for (const j of V.paragraphs) {
        g[F].push(j.align ?? "l");
        for (const Y of j.runs)
          if (!(Y.br || !Y.text.trim())) {
            if ((Y.underline ?? G.underline) || (Y.strike ?? G.strike)) return null;
            c.push({ row: v, col: F, p: { size: Y.size ?? G.size ?? 18, font: Y.font ?? G.font, bold: !!(Y.bold ?? G.bold), italic: !!(Y.italic ?? G.italic), color: Y.color ?? G.color } });
          }
      }
    }
    i.push(I);
  }
  const f = c.map((v) => v.p);
  if (f.length && !et(f, (v, I) => Math.abs(v.size - I.size) < 0.5 && (v.font ?? "") === (I.font ?? "") && v.italic === I.italic)) return null;
  const p = c.filter((v) => n && v.row === 0).map((v) => v.p), x = c.filter((v) => !(n && v.row === 0)).map((v) => v.p);
  if (!et(x, (v, I) => v.bold === I.bold && gt(v.color, I.color)) || !et(p, (v, I) => gt(v.color, I.color))) return null;
  const u = x[0]?.bold ?? !1;
  if (p.some((v) => !v.bold) || !et(b, (v, I) => v === I)) return null;
  const d = [];
  for (const v of g) {
    if (!et(v, (I, F) => I === F)) return null;
    d.push(v[0] === "r" ? "right" : v[0] === "ctr" ? "center" : "left");
  }
  const y = (v, I) => !t.rows[v].cells[I].hMerge && !t.rows[v].cells[I].vMerge, h = (v) => {
    const I = a[v].filter((F, D) => y(v, D));
    return I.length && et(I, Ot) ? I[0] : I.length ? null : { kind: "none" };
  }, m = t.rows.map((v, I) => h(I));
  if (m.some((v) => !v)) return null;
  const k = m.slice(n ? 1 : 0), M = k.filter((v, I) => I % 2 === 0), C = k.filter((v, I) => I % 2 === 1);
  if (!et(M, Ot) || !et(C, Ot)) return null;
  const S = (v) => v && v.kind === "solid" ? H(v.color) : "", O = S(M[0]), T = C.length ? S(C[0]) : O;
  if (!O && T) return null;
  const A = t.rows.flatMap((v, I) => v.cells.filter((F, D) => y(I, D)).flatMap((F) => [F.borders.l, F.borders.r, F.borders.t, F.borders.b]));
  if (!et(A, jn)) return null;
  const $ = A[0] ?? null, X = [];
  t.rows.forEach((v, I) => v.cells.forEach((F, D) => {
    ((F.gridSpan ?? 1) > 1 || (F.rowSpan ?? 1) > 1) && X.push({ startRow: I, startCol: D, endRow: Math.min(s - 1, I + (F.rowSpan ?? 1) - 1), endCol: Math.min(r - 1, D + (F.gridSpan ?? 1) - 1) });
  }));
  const R = t.cols.reduce((v, I) => v + I, 0), N = t.rows.reduce((v, I) => v + I.h, 0), L = rt(e, "table", { ...t, w: R, h: N }, o), B = f[0];
  return Object.assign(L, {
    tableRows: n ? s - 1 : s,
    tableCols: r,
    tableHeaders: n,
    tableData: i,
    tableColWidths: t.cols.map((v) => v / (R || 1)),
    tableRowHeights: t.rows.map((v) => v.h / (N || 1)),
    tableHeaderColor: n ? S(m[0]) : "",
    tableHeaderTextColor: p[0]?.color && !gt(p[0].color, x[0]?.color) ? H(p[0].color) : "",
    tableRowColor: O,
    tableAltRowColor: T !== O ? T : "",
    // A presentation table isn't a sortable list: no arrows in its header.
    tableColAlignments: d,
    tableSortCol: -1,
    tableSortDir: "asc",
    tableSortArrows: !1,
    ...b[0] && b[0] !== "ctr" && { tableVerticalAlign: b[0] === "t" ? "top" : "bottom" },
    ...X.length && { tableMergedCells: X },
    strokeColor: $ ? H($.color) : "transparent",
    strokeWidth: $ ? $.width : 1,
    fontSize: B?.size ?? 14,
    fontFamily: Rt(B?.font),
    textColor: H(x[0]?.color ?? p[0]?.color ?? { hex: "#000000" }),
    ...u && { fontWeight: "bold" },
    ...B?.italic && { fontStyle: "italic" }
  }), $?.dash && $.dash !== "solid" && (L.strokeStyle = /dot/i.test($.dash) ? "dotted" : "dashed"), L;
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
          const i = $n(s, n, e);
          i ? (n.stats.elements++, r.push(i)) : s.fallback && r.push(...Ft([s.fallback], n, e));
          break;
        }
        case "chart": {
          const i = rt(n, "chart", s, e);
          i.chart = Se(s.chart), i.fontFamily = "sans-serif", n.stats.elements++, r.push(i);
          break;
        }
      }
      const a = Nn(s.link, n);
      if (a)
        for (const i of r) i.link || (i.link = a);
      n.itemEls?.set(s.id, r), o.push(...r);
    } catch {
      n.warnings.push(`"${s.name}" couldn't be converted and was skipped.`);
    }
  return o;
}
function zn(t) {
  return t ? { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function Bn(t, n, e) {
  if (n)
    if (n.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = H(n.color);
    else if (n.kind === "linear" || n.kind === "radial")
      t.fillStyle = n.kind, t.backgroundColor = H(n.stops[0]?.color), t.gradientStops = n.stops.map((o) => ({ offset: o.pos, color: H(o.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
    else if (n.kind === "image") {
      const o = e.images.get(n.media), s = e.slideBg ?? o?.url;
      s && (t.fillStyle = "image", t.backgroundImage = s, t.backgroundColor = "#ffffff"), s && n.alpha !== void 0 && n.alpha < 1 && (t.backgroundOpacity = n.alpha);
    } else n.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = H(n.color));
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
}, Xn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function Hn(t) {
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
    if (!Xn.has(s.ext)) {
      o.set(s, null);
      return;
    }
    const r = `data:${Dt[s.ext]};base64,${Hn(s.bytes)}`;
    let a = 0, i = 0;
    try {
      const c = await createImageBitmap(new Blob([s.bytes], { type: Dt[s.ext] }));
      a = c.width, i = c.height, c.close();
    } catch {
    }
    o.set(s, { url: r, w: a, h: i });
  })), o;
}
function Yn(t, n, e) {
  const o = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, s = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, r = { color: n, background: e, spacing: o, strokeWidth: s }, a = /^pct(\d+)$/.exec(t);
  if (a) {
    const i = Math.max(1, Math.min(99, Number(a[1]))), c = i > 50, g = (c ? 100 - i : i) / 100;
    return { type: "dots", color: c ? e : n, background: c ? n : e, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(g / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...r, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...r, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...r, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...r, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...r } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...r, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...r } : { type: "dots", ...r, strokeWidth: 1 };
}
async function _n(t, n, e) {
  const o = await Fe(), s = await Wn(t), r = Math.round(t.width), a = Math.round(t.height), i = Ce(e ?? t.title, "slides", { width: r, height: a }), c = [], g = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  i.slides = [];
  const b = await An(t, s), f = await Promise.all(t.slides.map((u) => {
    const d = u.background, y = d?.kind === "image" ? s.get(d.media) : void 0;
    return d?.kind === "image" && y ? On(y.url, r, a, d.tile) : void 0;
  })), p = t.slides.map(() => n("slide")), x = /* @__PURE__ */ new Map();
  return t.slides.forEach((u, d) => {
    u.key && x.set(u.key, p[d]);
  }), t.slides.forEach((u, d) => {
    const y = d * (r + kn), h = Wt(p[d], u.name || `Slide ${d + 1}`, y, 0, { width: r, height: a });
    h.order = d;
    const m = { ox: y, oy: 0, presets: o, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: c, stats: g, images: s, slideBg: f[d], gray: b, slideIds: x, itemEls: /* @__PURE__ */ new Map() };
    i.elements.push(...Ft(u.items, m, [])), Tn(u.anims ?? [], m, n), m.glue.forEach((M) => M()), Bn(h, u.background, m);
    const k = zn(u.transition);
    k && (h.transition = k), u.notes && (h.notes = u.notes), u.hidden && (h.hidden = !0), u.advanceAfterMs && (h.advanceAfter = u.advanceAfterMs), u.section && (h.section = u.section), i.slides.push(h), g.slides++;
  }), i.slides.length || i.slides.push(Wt(void 0, "Slide 1", 0, 0, { width: r, height: a })), t.loop && (i.globalSettings = { ...i.globalSettings || {}, slideShowLoop: !0 }), { doc: i, warnings: [...new Set(c)], stats: g };
}
const Un = 512 * 1024 * 1024;
async function Kn(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > Un) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: o, warnings: s } = wn(e), r = /* @__PURE__ */ new Set(), a = await _n(o, (c) => Ae(c, r), n);
  Ie(a.doc);
  const i = [...s, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  Kn as importPptx
};
