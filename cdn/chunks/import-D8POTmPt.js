import { u as ne, a as se } from "./browser-DbZP-BrN.js";
import { E as B, i as Mt, g as oe } from "./custgeom-DK60FLyH.js";
import { ap as re, aq as St, M as ae, q as ie, K as le } from "./index-Dxj5fgvO.js";
const ce = 1e4, fe = 1e5, Xt = 6e4, J = (t) => t / Xt * (Math.PI / 180);
function Bt(t, n, e, s = {}) {
  const o = /* @__PURE__ */ new Map(), r = Math.max(0, n), a = Math.max(0, e), i = Math.min(r, a), l = Math.max(r, a), y = {
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
  for (const [g, h] of Object.entries(y)) o.set(g, h);
  for (const g of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    o.set(`wd${g}`, r / g), o.set(`hd${g}`, a / g), o.set(`ssd${g}`, i / g);
  const p = (g) => {
    const h = o.get(g);
    if (h !== void 0) return h;
    const f = /^(wd|hd|ssd)(\d+)$/.exec(g);
    if (f) {
      const b = f[1] === "wd" ? r : f[1] === "hd" ? a : i, d = Number(f[2]);
      return d ? b / d : 0;
    }
    const u = Number(g);
    return Number.isFinite(u) ? u : 0;
  }, x = (g, h) => {
    o.size > ce || o.set(g, ue(h, p));
  };
  for (const [g, h] of t.av ?? []) x(g, s[g] ?? h);
  for (const [g, h] of Object.entries(s)) o.has(g) || x(g, h);
  for (const [g, h] of t.gd ?? []) x(g, h);
  return o;
}
function ue(t, n) {
  const e = String(t || "").trim().split(/\s+/), s = e[0], [o, r, a] = e.slice(1).map(n);
  let i;
  switch (s) {
    case "val":
      i = o;
      break;
    case "*/":
      i = a ? o * r / a : 0;
      break;
    case "+-":
      i = o + r - a;
      break;
    case "+/":
      i = a ? (o + r) / a : 0;
      break;
    case "?:":
      i = o > 0 ? r : a;
      break;
    case "abs":
      i = Math.abs(o);
      break;
    case "at2":
      i = Math.atan2(r, o) * 180 / Math.PI * Xt;
      break;
    case "cat2":
      i = o * Math.cos(Math.atan2(a, r));
      break;
    case "sat2":
      i = o * Math.sin(Math.atan2(a, r));
      break;
    case "cos":
      i = o * Math.cos(J(r));
      break;
    case "sin":
      i = o * Math.sin(J(r));
      break;
    case "tan":
      i = o * Math.tan(J(r));
      break;
    case "max":
      i = Math.max(o, r);
      break;
    case "min":
      i = Math.min(o, r);
      break;
    case "mod":
      i = Math.sqrt(o * o + r * r + a * a);
      break;
    case "pin":
      i = r < o ? o : r > a ? a : r;
      break;
    case "sqrt":
      i = Math.sqrt(Math.max(0, o));
      break;
    default:
      i = 0;
  }
  return Number.isFinite(i) ? i : 0;
}
const Pt = (t, n, e) => Math.atan2(n * Math.sin(t), e * Math.cos(t));
function lt(t, n, e, s = {}) {
  const o = Math.max(Math.abs(n), 0) * B, r = Math.max(Math.abs(e), 0) * B, a = Bt(t, o, r, s), i = (p) => typeof p == "number" ? p : a.get(p) ?? (Number.isFinite(Number(p)) ? Number(p) : 0), l = [];
  let y = fe;
  for (const p of t.paths) {
    const x = p.w ? o / p.w : 1, g = p.h ? r / p.h : 1, h = (m) => i(m) * x / B, f = (m) => i(m) * g / B, u = [];
    let b = { x: 0, y: 0 }, d = { x: 0, y: 0 };
    for (const m of p.d) {
      if (--y < 0) break;
      switch (m[0]) {
        case "M":
          b = { x: h(m[1]), y: f(m[2]) }, d = b, u.push({ op: "M", ...b });
          break;
        case "L":
          b = { x: h(m[1]), y: f(m[2]) }, u.push({ op: "L", ...b });
          break;
        case "C": {
          const M = h(m[1]), v = f(m[2]), S = h(m[3]), w = f(m[4]);
          b = { x: h(m[5]), y: f(m[6]) }, u.push({ op: "C", x1: M, y1: v, x2: S, y2: w, ...b });
          break;
        }
        case "Q": {
          const M = h(m[1]), v = f(m[2]), S = h(m[3]), w = f(m[4]);
          u.push({ op: "C", x1: b.x + 2 / 3 * (M - b.x), y1: b.y + 2 / 3 * (v - b.y), x2: S + 2 / 3 * (M - S), y2: w + 2 / 3 * (v - w), x: S, y: w }), b = { x: S, y: w };
          break;
        }
        case "A": {
          const M = i(m[1]) * x / B, v = i(m[2]) * g / B;
          b = de(u, b, M, v, i(m[3]), i(m[4]));
          break;
        }
        case "Z":
          u.push({ op: "Z" }), b = d;
          break;
      }
    }
    u.length && l.push({ cmds: u, fill: p.fill === "none" ? !1 : void 0, stroke: p.stroke === !1 ? !1 : void 0 });
  }
  return l;
}
function de(t, n, e, s, o, r) {
  if (Math.abs(e) < 1e-9 || Math.abs(s) < 1e-9 || r === 0) return n;
  const a = J(o), i = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, J(r))), l = Pt(a, e, s);
  let y = Pt(a + i, e, s);
  if (Math.abs(i) >= 2 * Math.PI - 1e-9) y = l + Math.sign(i) * 2 * Math.PI;
  else {
    for (; i > 0 && y < l; ) y += 2 * Math.PI;
    for (; i < 0 && y > l; ) y -= 2 * Math.PI;
  }
  const p = n.x - e * Math.cos(l), x = n.y - s * Math.sin(l), g = y - l, h = Math.max(1, Math.min(16, Math.ceil(Math.abs(g) / (Math.PI / 2)))), f = g / h, u = 4 / 3 * Math.tan(f / 4);
  let b = l, d = n;
  for (let m = 0; m < h; m++) {
    const M = b + f, v = Math.cos(b), S = Math.sin(b), w = Math.cos(M), T = Math.sin(M);
    d = { x: p + e * w, y: x + s * T }, t.push({ op: "C", x1: p + e * (v - u * S), y1: x + s * (S + u * v), x2: p + e * (w + u * T), y2: x + s * (T - u * w), ...d }), b = M;
  }
  return d;
}
function $t(t, n, e, s = {}) {
  const o = Math.abs(n), r = Math.abs(e);
  if (!t.rect) return { l: 0, t: 0, r: o, b: r };
  const a = Bt(t, o * B, r * B, s), i = (g) => (a.get(g) ?? (Number.isFinite(Number(g)) ? Number(g) : 0)) / B, [l, y, p, x] = t.rect.map(i);
  return { l, t: y, r: p, b: x };
}
let Ct = null;
async function he() {
  return Ct ??= (await import("./presets-DP49P8i2.js")).default, Ct;
}
const Tt = 5e4, pe = 256 * 1024 * 1024, It = 1024 * 1024 * 1024, me = 1e4, xe = 32, ge = 2e4, N = (t, n) => {
  if (!t) return [];
  const e = [];
  for (let s = t.firstChild; s; s = s.nextSibling)
    s.nodeType === 1 && (!n || s.localName === n) && e.push(s);
  return e;
}, c = (t, n) => {
  if (!t) return null;
  for (let e = t.firstChild; e; e = e.nextSibling) if (e.nodeType === 1 && e.localName === n) return e;
  return null;
}, O = (t, ...n) => {
  let e = t;
  for (const s of n) e = c(e, s);
  return e ?? null;
}, k = (t, n) => {
  if (!t) return null;
  const e = t.getAttribute(n);
  if (e !== null && e !== "") return e;
  const s = n.includes(":") ? n.split(":")[1] : n;
  for (let o = 0; o < (t.attributes?.length ?? 0); o++) {
    const r = t.attributes[o];
    if (r.localName === s && (n.includes(":") || !r.name.includes(":"))) return r.value;
  }
  return null;
}, P = (t, n, e = 0) => {
  const s = k(t, n), o = s === null ? NaN : Number(s);
  return Number.isFinite(o) ? o : e;
}, j = (t, n) => {
  const e = k(t, n);
  return e === null ? void 0 : e === "1" || e === "true" || e === "on";
}, E = (t) => t / B, be = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function ye(t) {
  if (t.localName !== "AlternateContent") return [t];
  const n = c(t, "Fallback");
  for (const e of N(t, "Choice"))
    if ((k(e, "Requires") || "").split(/\s+/).filter(Boolean).every((o) => be.has(o))) return N(e);
  return N(n);
}
const ft = (t) => N(t).flatMap(ye);
class Me {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(n, e, s) {
    this.parseXml = e, this.warn = s, this.files = {};
    for (const [o, r] of Object.entries(n)) this.files[Q(o)] = r;
  }
  bytes(n) {
    return this.files[Q(n)];
  }
  xml(n) {
    const e = Q(n);
    if (!this.text.has(e)) {
      const s = this.files[e];
      let o = null;
      if (s) {
        try {
          const r = se(s).replace(/^﻿/, "");
          o = /<!DOCTYPE/i.test(r.slice(0, 2048)) ? null : this.parseXml(r), o && o.getElementsByTagName("parsererror").length && (o = null);
        } catch {
          o = null;
        }
        o || this.warn(`Couldn't read ${e}`);
      }
      this.text.set(e, o);
    }
    return this.text.get(e)?.documentElement ?? null;
  }
  rels(n) {
    const e = Q(n);
    let s = this.relCache.get(e);
    if (s) return s;
    s = /* @__PURE__ */ new Map();
    const o = e.includes("/") ? e.slice(0, e.lastIndexOf("/")) : "", r = e.slice(e.lastIndexOf("/") + 1), a = this.xml(`${o ? o + "/" : ""}_rels/${r}.rels`);
    for (const i of N(a, "Relationship")) {
      const l = k(i, "Id"), y = k(i, "Type") || "", p = k(i, "Target") || "";
      if (!l) continue;
      const x = k(i, "TargetMode") === "External";
      s.set(l, { type: y.slice(y.lastIndexOf("/") + 1), target: x ? p : ke(o, p), external: x });
    }
    return this.relCache.set(e, s), s;
  }
  relOfType(n, e) {
    for (const s of this.rels(n).values()) if (s.type === e && !s.external) return s.target;
    return null;
  }
}
const Q = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function ke(t, n) {
  let e = n.split("#")[0];
  try {
    e = decodeURIComponent(e);
  } catch {
  }
  if (e.startsWith("/")) return Q(e);
  const s = (t ? t.split("/") : []).concat(e.split("/")), o = [];
  for (const r of s)
    r === ".." ? o.pop() : r && r !== "." && o.push(r);
  return o.join("/");
}
const kt = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function ut(t) {
  const n = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, e = c(t, "themeElements");
  for (const r of N(c(e, "clrScheme"))) {
    const a = N(r)[0];
    if (!a) continue;
    const i = a.localName === "sysClr" ? k(a, "lastClr") : k(a, "val");
    i && /^[0-9a-f]{6}$/i.test(i) && (n.colors[r.localName] = "#" + i.toLowerCase());
  }
  const s = c(e, "fontScheme");
  n.major = k(O(s, "majorFont", "latin"), "typeface") || n.major, n.minor = k(O(s, "minorFont", "latin"), "typeface") || n.minor;
  const o = c(e, "fmtScheme");
  return n.fills = N(c(o, "fillStyleLst")), n.lines = N(c(o, "lnStyleLst")), n.bgFills = N(c(o, "bgFillStyleLst")), n;
}
const we = {
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
}, Yt = (t) => {
  const n = t.replace("#", "");
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0];
}, rt = (t, n, e) => "#" + [t, n, e].map((s) => Math.max(0, Math.min(255, Math.round(s))).toString(16).padStart(2, "0")).join(""), tt = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), G = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function Nt(t, n, e) {
  t /= 255, n /= 255, e /= 255;
  const s = Math.max(t, n, e), o = Math.min(t, n, e), r = (s + o) / 2;
  if (s === o) return [0, 0, r];
  const a = s - o, i = r > 0.5 ? a / (2 - s - o) : a / (s + o);
  return [(s === t ? (n - e) / a + (n < e ? 6 : 0) : s === n ? (e - t) / a + 2 : (t - n) / a + 4) * 60, i, r];
}
function dt(t, n, e) {
  if (t = (t % 360 + 360) % 360 / 360, n === 0) return [e * 255, e * 255, e * 255];
  const s = e < 0.5 ? e * (1 + n) : e + n - e * n, o = 2 * e - s, r = (a) => (a = (a % 1 + 1) % 1, a < 1 / 6 ? o + (s - o) * 6 * a : a < 1 / 2 ? s : a < 2 / 3 ? o + (s - o) * (2 / 3 - a) * 6 : o);
  return [r(t + 1 / 3) * 255, r(t) * 255, r(t - 1 / 3) * 255];
}
function $(t, n) {
  const e = N(t).find((s) => /Clr$/.test(s.localName));
  return e ? ve(e, n) : null;
}
function ve(t, n) {
  let e = null, s = 1;
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
      e = we[k(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      e = rt(G(P(t, "r") / 1e5), G(P(t, "g") / 1e5), G(P(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [l, y, p] = dt(P(t, "hue") / 6e4, P(t, "sat") / 1e5, P(t, "lum") / 1e5);
      e = rt(l, y, p);
      break;
    }
    case "schemeClr": {
      const l = k(t, "val") || "";
      if (l === "phClr") {
        n.phClr ? (e = n.phClr.hex, s = n.phClr.alpha ?? 1) : e = n.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const y = n.clrMap[l] ?? kt[l] ?? l;
      e = n.theme.colors[y] ?? null;
      break;
    }
  }
  if (!e) return null;
  let [o, r, a] = Yt(e);
  for (const l of N(t)) {
    const y = P(l, "val") / 1e5;
    switch (l.localName) {
      case "alpha":
        s = y;
        break;
      case "alphaMod":
        s *= y;
        break;
      case "alphaOff":
        s += y;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [p, x, g] = Nt(o, r, a);
        l.localName === "lumMod" ? g *= y : l.localName === "lumOff" ? g += y : l.localName === "satMod" ? x *= y : l.localName === "satOff" ? x += y : l.localName === "hueMod" ? p *= y : p += P(l, "val") / 6e4, [o, r, a] = dt(p, Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, g)));
        break;
      }
      case "tint":
        [o, r, a] = [o, r, a].map((p) => G(tt(p) * y + (1 - y)));
        break;
      case "shade":
        [o, r, a] = [o, r, a].map((p) => G(tt(p) * y));
        break;
      case "comp": {
        const [p, x, g] = Nt(o, r, a);
        [o, r, a] = dt(p + 180, x, g);
        break;
      }
      case "inv":
        [o, r, a] = [255 - o, 255 - r, 255 - a];
        break;
      case "gray": {
        o = r = a = 0.299 * o + 0.587 * r + 0.114 * a;
        break;
      }
    }
  }
  s = Math.max(0, Math.min(1, s));
  const i = { hex: rt(o, r, a) };
  return s < 0.999 && (i.alpha = s), i;
}
function et(t, n) {
  for (const e of N(t)) {
    const s = wt(e, n);
    if (s) return s;
  }
}
function wt(t, n) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const e = $(t, n.ctx);
      return e ? { kind: "solid", color: e } : { kind: "none" };
    }
    case "gradFill": {
      const e = N(c(t, "gsLst"), "gs").slice(0, 256).map((o) => ({ pos: P(o, "pos") / 1e5, color: $(o, n.ctx) ?? { hex: "#000000" } }));
      if (!e.length) return { kind: "none" };
      const s = c(t, "lin");
      return c(t, "path") ? { kind: "radial", stops: e } : { kind: "linear", stops: e, angle: s ? P(s, "ang") / 6e4 : 90, scaled: j(s, "scaled") ?? !1 };
    }
    case "blipFill": {
      const e = Ht(t, n);
      return e ? { kind: "image", media: e } : void 0;
    }
    case "pattFill": {
      const e = $(c(t, "fgClr"), n.ctx);
      return e ? { kind: "pattern", preset: k(t, "prst") || "pct50", color: e } : void 0;
    }
    case "grpFill":
      return;
  }
}
const Se = {
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
function Ht(t, n) {
  const e = c(t, "blip"), s = k(e, "r:embed");
  if (!s) return null;
  const o = n.pkg.rels(n.part).get(s);
  if (!o || o.external) return null;
  const r = n.pkg.bytes(o.target), a = Se[(o.target.split(".").pop() || "").toLowerCase()];
  return r && a ? { bytes: r, ext: a } : null;
}
const Pe = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function q(t, n) {
  if (!t) return;
  let e;
  for (const i of N(t)) {
    if (i.localName === "noFill") return null;
    i.localName === "solidFill" && (e = $(i, n.ctx)), i.localName === "gradFill" && (e = $(c(c(i, "gsLst"), "gs"), n.ctx));
  }
  const s = k(t, "w");
  if (e === void 0 && s === null && !c(t, "prstDash") && !c(t, "headEnd") && !c(t, "tailEnd")) return;
  const o = (i) => {
    const l = k(i, "type");
    if (!l || l === "none") return;
    const y = l === "triangle" || l === "stealth" || l === "arrow" || l === "oval" || l === "diamond" ? l : "triangle", p = k(i, "len") || k(i, "w");
    return { type: y, size: p === "sm" || p === "lg" ? p : "med" };
  }, r = Pe[k(c(t, "prstDash"), "val") || "solid"], a = k(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: s !== null ? Math.max(0, E(Number(s) || 0)) : 1,
    color: e ?? { hex: "#000000" },
    dash: r || void 0,
    cap: a === "rnd" ? "rnd" : a === "sq" ? "sq" : a === "flat" ? "flat" : void 0,
    join: c(t, "round") ? "round" : c(t, "bevel") ? "bevel" : c(t, "miter") ? "miter" : void 0,
    head: o(c(t, "headEnd")),
    tail: o(c(t, "tailEnd"))
  };
}
function At(t, n) {
  const e = c(t, "fillRef");
  if (!e) return;
  const s = P(e, "idx");
  if (s === 0) return { kind: "none" };
  const r = (s >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[s >= 1001 ? s - 1001 : s - 1];
  if (!r) return;
  const a = $(e, n.ctx) ?? void 0;
  return wt(r, { ...n, ctx: { ...n.ctx, phClr: a } });
}
function _t(t, n) {
  const e = c(t, "lnRef");
  if (!e) return;
  const s = P(e, "idx");
  if (s === 0) return null;
  const o = n.ctx.theme.lines[s - 1];
  if (!o) return;
  const r = $(e, n.ctx) ?? void 0;
  return q(o, { ...n, ctx: { ...n.ctx, phClr: r } }) ?? void 0;
}
function Y(t) {
  if (!t) return null;
  const n = c(t, "off"), e = c(t, "ext");
  return !n || !e ? null : {
    x: E(P(n, "x")),
    y: E(P(n, "y")),
    w: Math.max(0, E(P(e, "cx"))),
    h: Math.max(0, E(P(e, "cy"))),
    rot: P(t, "rot") / 6e4,
    flipH: !!j(t, "flipH"),
    flipV: !!j(t, "flipV")
  };
}
const ht = (t) => t;
function Ce(t, n) {
  const e = Y(t);
  if (!e) return n;
  const s = c(t, "chOff"), o = c(t, "chExt"), r = s ? E(P(s, "x")) : e.x, a = s ? E(P(s, "y")) : e.y, i = o ? E(P(o, "cx")) : e.w, l = o ? E(P(o, "cy")) : e.h, y = i > 0 ? e.w / i : 1, p = l > 0 ? e.h / l : 1, x = e.x + e.w / 2, g = e.y + e.h / 2, h = e.rot * Math.PI / 180;
  return (f) => {
    let u = e.x + (f.x + f.w / 2 - r) * y, b = e.y + (f.y + f.h / 2 - a) * p, d = f.rot, m = f.flipH, M = f.flipV;
    if (e.flipH && (u = 2 * x - u, m = !m, d = -d), e.flipV && (b = 2 * g - b, M = !M, d = -d), h) {
      const w = u - x, T = b - g;
      u = x + w * Math.cos(h) - T * Math.sin(h), b = g + w * Math.sin(h) + T * Math.cos(h), d += e.rot;
    }
    const v = f.w * y, S = f.h * p;
    return n({ x: u - v / 2, y: b - S / 2, w: v, h: S, rot: (d % 360 + 360) % 360, flipH: m, flipV: M });
  };
}
function Ot(t) {
  const n = c(t, "spcPts"), e = c(t, "spcPct");
  if (n) return { px: Math.max(0, Math.min(1584, P(n, "val") / 100)) * (Mt / B) };
  if (e) return { lines: Math.max(0, Math.min(13.2, P(e, "val") / 1e5)) };
}
function Et(t, n, e) {
  const s = c(t, `lvl${n + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return s ? Wt(s, e) : {};
}
function Wt(t, n) {
  const e = {};
  if (k(t, "algn") && (e.algn = k(t, "algn")), k(t, "marL") !== null && (e.marL = E(P(t, "marL"))), k(t, "indent") !== null && (e.indent = E(P(t, "indent"))), c(t, "buNone")) e.bullet = "none";
  else if (c(t, "buAutoNum")) {
    const a = c(t, "buAutoNum");
    e.bullet = "num", e.numType = k(a, "type") || "arabicPeriod", e.startAt = k(a, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(P(a, "startAt", 1)))) : void 0;
  } else c(t, "buChar") ? (e.bullet = "char", e.buChar = k(c(t, "buChar"), "char") || void 0) : c(t, "buBlip") && (e.bullet = "char", e.buChar = "•");
  if (c(t, "buFont") ? e.buFont = k(c(t, "buFont"), "typeface") || null : c(t, "buFontTx") && (e.buFont = null), c(t, "buClr") ? e.buClr = $(c(t, "buClr"), n.ctx) : c(t, "buClrTx") && (e.buClr = null), c(t, "buSzPct")) {
    const a = k(c(t, "buSzPct"), "val") || "", i = a.endsWith("%") ? parseFloat(a) / 100 : Number(a) / 1e5;
    e.buSz = Number.isFinite(i) && i > 0 ? Math.max(0.25, Math.min(4, i)) : null;
  } else (c(t, "buSzTx") || c(t, "buSzPts")) && (e.buSz = null);
  const s = O(t, "lnSpc", "spcPct");
  s && (e.lnSpcPct = P(s, "val") / 1e5);
  const o = Ot(c(t, "spcBef")), r = Ot(c(t, "spcAft"));
  return o && (e.spcBef = o), r && (e.spcAft = r), Object.assign(e, Gt(c(t, "defRPr"), n)), e;
}
function Gt(t, n) {
  if (!t) return {};
  const e = {};
  k(t, "sz") !== null && (e.sz = P(t, "sz") / 100 * (Mt / B)), j(t, "b") !== void 0 && (e.b = j(t, "b")), j(t, "i") !== void 0 && (e.i = j(t, "i")), k(t, "u") && (e.u = k(t, "u") !== "none"), k(t, "strike") && (e.strike = k(t, "strike") !== "noStrike");
  const s = c(t, "solidFill");
  s ? e.color = $(s, n.ctx) : c(t, "noFill") && (e.color = null);
  const o = k(c(t, "latin"), "typeface");
  return o && (e.font = o), e;
}
const Te = {
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
}, Ie = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function Ne(t, n) {
  if (!t) return "•";
  let e = t.codePointAt(0);
  e >= 61440 && e <= 61695 && (e -= 61440);
  const s = (n || "").toLowerCase();
  return s.startsWith("wingdings") ? s === "wingdings" && Te[e] || "•" : s === "symbol" ? Ie[e] ?? (e < 128 && e > 32 ? String.fromCharCode(e) : "•") : s.startsWith("webdings") || s.startsWith("marlett") ? "•" : s === "courier new" && t === "o" ? "◦" : /\s/.test(t) || e < 32 ? "•" : [...t][0];
}
const Rt = (...t) => {
  const n = {};
  for (const e of t) for (const [s, o] of Object.entries(e)) o !== void 0 && (n[s] = o);
  return n;
};
function Ae(t, n) {
  if (t)
    return t.startsWith("+mj") ? n.major : t.startsWith("+mn") ? n.minor : t;
}
function Ut(t, n, e) {
  if (!t) return;
  const s = N(t, "p");
  if (!s.some((h) => N(h).some((f) => (f.localName === "r" || f.localName === "fld") && (O(f, "t")?.textContent ?? "") !== ""))) return;
  const r = {};
  let a = 1, i = 1;
  for (const h of [...n.bodyPr, c(t, "bodyPr")]) {
    if (!h) continue;
    for (let u = 0; u < h.attributes.length; u++) r[h.attributes[u].localName ?? h.attributes[u].name] = h.attributes[u].value;
    const f = c(h, "normAutofit");
    f && (a = k(f, "fontScale") !== null ? P(f, "fontScale") / 1e5 : 1), f && (i = 1 - Math.max(0, Math.min(0.9, P(f, "lnSpcReduction") / 1e5))), (c(h, "noAutofit") || c(h, "spAutoFit")) && (a = 1, i = 1);
  }
  const l = (h, f) => r[h] !== void 0 ? E(Number(r[h]) || 0) : E(f), y = r.anchor === "ctr" ? "ctr" : r.anchor === "b" ? "b" : "t", p = c(t, "lstStyle"), x = [];
  let g;
  for (const h of s) {
    const f = c(h, "pPr"), u = Math.max(0, Math.min(8, P(f, "lvl"))), b = n.fontRef ? { color: n.fontRef.color ?? void 0, font: n.fontRef.font } : {}, d = Rt(...n.levels.map((C) => Et(C, u, e)), b, Et(p, u, e), f ? Wt(f, e) : {});
    d.lnSpcPct !== void 0 && g === void 0 && (g = d.lnSpcPct);
    const m = { runs: [], align: d.algn === "ctr" ? "ctr" : d.algn === "r" ? "r" : (d.algn === "just", "l"), level: u };
    if (d.bullet === "char" || d.bullet === "num") {
      if (m.bullet = d.bullet, m.marL = d.marL ?? 0, m.indent = d.indent ?? 0, d.bullet === "char") {
        const C = Ne(d.buChar, d.buFont ?? void 0);
        C !== "•" && (m.bulletChar = C);
      } else
        d.numType && d.numType !== "arabicPeriod" && (m.numType = d.numType), d.startAt && d.startAt !== 1 && (m.startAt = d.startAt);
      d.buClr && (m.bulletColor = d.buClr), d.buSz && Math.abs(d.buSz - 1) > 1e-3 && (m.bulletScale = d.buSz);
    }
    const M = (C) => {
      const I = Rt(d, Gt(C, e)), R = (I.sz ?? 18 * Mt / B) * a, D = I.color === null ? void 0 : I.color ?? qt("tx1", e);
      return {
        text: "",
        size: R,
        bold: I.b || void 0,
        italic: I.i || void 0,
        underline: I.u || void 0,
        strike: I.strike || void 0,
        color: D ?? void 0,
        font: Ae(I.font ?? "+mn-lt", e.ctx.theme)
      };
    };
    for (const C of N(h))
      if (C.localName === "r" || C.localName === "fld") {
        const I = O(C, "t")?.textContent ?? "";
        if (!I) continue;
        I.split(/[\v\n]/).forEach((R, D) => {
          D > 0 && m.runs.push({ ...M(c(C, "rPr")), br: !0 }), R && m.runs.push({ ...M(c(C, "rPr")), text: R });
        });
      } else C.localName === "br" && m.runs.push({ ...M(c(C, "rPr")), br: !0 });
    m.endSize = M(c(h, "endParaRPr")).size;
    const v = (m.runs.length ? Math.max(...m.runs.map((C) => C.size ?? 0)) : m.endSize ?? 0) * 1.2 * (d.lnSpcPct ?? 1), S = (C) => C ? ("px" in C ? C.px : C.lines * v) * i : 0, w = S(d.spcBef), T = S(d.spcAft);
    w > 0.05 && (m.spaceBefore = Math.round(w * 100) / 100), T > 0.05 && (m.spaceAfter = Math.round(T * 100) / 100), x.push(m);
  }
  return {
    paragraphs: x,
    anchor: y,
    insets: { l: l("lIns", 91440), t: l("tIns", 45720), r: l("rIns", 91440), b: l("bIns", 45720) },
    wrap: r.wrap !== "none",
    lineSpacing: g
  };
}
const qt = (t, n) => {
  const e = n.ctx.clrMap[t] ?? kt[t] ?? t, s = n.ctx.theme.colors[e];
  return s ? { hex: s } : null;
}, nt = (t) => {
  const n = c(t, "ph");
  return n ? { type: k(n, "type") || "obj", idx: P(n, "idx") } : null;
}, at = (t) => c(N(t).find((n) => n.localName.startsWith("nv")) ?? null, "nvPr"), ot = /* @__PURE__ */ new Set(["title", "ctrTitle"]), Lt = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), Ft = (t, n) => t === n || ot.has(t) && ot.has(n) || !Lt.has(t) && !Lt.has(n);
function ct(t, n) {
  const e = Oe(t);
  if (n.idx) {
    const s = e.find((o) => o.ph.idx === n.idx && Ft(o.ph.type, n.type));
    if (s) return s.el;
  }
  return (e.find((s) => s.ph.type === n.type && (s.ph.idx === n.idx || !n.idx || ot.has(n.type))) ?? e.find((s) => s.ph.type === n.type) ?? e.find((s) => Ft(s.ph.type, n.type)))?.el ?? null;
}
function Oe(t) {
  const n = [];
  for (const e of ft(t)) {
    const s = nt(at(e));
    s && n.push({ el: e, ph: s });
  }
  return n;
}
const Vt = (t) => ot.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", Ee = (t) => {
  const n = {};
  for (const e of N(c(t, "avLst"), "gd")) {
    const s = k(e, "name"), o = k(e, "fmla");
    s && o && (n[s] = o);
  }
  return n;
};
function Re(t) {
  const n = (r) => N(r, "gd").slice(0, 1e4).map((a) => [k(a, "name") || "", k(a, "fmla") || "val 0"]), e = N(c(t, "cxnLst"), "cxn").map((r) => [k(r, "ang") || "0", k(c(r, "pos"), "x") || "0", k(c(r, "pos"), "y") || "0"]), s = c(t, "rect"), o = N(c(t, "pathLst"), "path").slice(0, 1e3).map((r) => {
    const a = [];
    for (const l of N(r)) {
      const y = N(l, "pt").map((p) => [k(p, "x") || "0", k(p, "y") || "0"]).flat();
      switch (l.localName) {
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
          a.push(["A", k(l, "wR") || "0", k(l, "hR") || "0", k(l, "stAng") || "0", k(l, "swAng") || "0"]);
          break;
        case "close":
          a.push(["Z"]);
          break;
      }
    }
    const i = k(r, "fill");
    return { w: P(r, "w") || void 0, h: P(r, "h") || void 0, fill: i && i !== "norm" ? i : void 0, stroke: j(r, "stroke") === !1 ? !1 : void 0, d: a };
  });
  return {
    av: N(c(t, "avLst"), "gd").map((r) => [k(r, "name") || "", k(r, "fmla") || "val 0"]),
    gd: n(c(t, "gdLst")),
    cxn: e,
    rect: s ? [k(s, "l") || "l", k(s, "t") || "t", k(s, "r") || "r", k(s, "b") || "b"] : null,
    paths: o
  };
}
function it(t, n) {
  const e = c(t, "prstGeom");
  if (e) {
    const o = {};
    for (const [r, a] of Object.entries(Ee(e))) {
      const i = /^val\s+(-?\d+(\.\d+)?)/.exec(a);
      i && (o[r] = Number(i[1]));
    }
    return { geom: { kind: "preset", prst: k(e, "prst") || "rect", adj: Object.keys(o).length ? o : void 0 } };
  }
  const s = c(t, "custGeom");
  if (s) {
    const o = Re(s);
    return { geom: { kind: "custom", paths: lt(o, n.w, n.h) }, textRect: o.rect ? $t(o, n.w, n.h) : void 0 };
  }
}
function st(t, n, e, s, o, r) {
  const a = [];
  if (o > xe)
    return e.warnings.push("Groups nested too deeply; the innermost were skipped."), a;
  for (const i of ft(t)) {
    if (++e.count > ge) {
      e.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const l = Le(i, n, e, s, o, r);
      l && a.push(...Array.isArray(l) ? l : [l]);
    } catch {
      e.warnings.push(`A ${i.localName} couldn't be read and was skipped.`);
    }
  }
  return a;
}
function Le(t, n, e, s, o, r) {
  const a = { pkg: e.pkg, part: n.part, ctx: e.ctx }, i = N(t).find((x) => x.localName.startsWith("nv")), l = c(i ?? null, "cNvPr"), y = P(l, "id"), p = k(l, "name") || t.localName;
  if (k(l, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return je(t, n, e, s, y, p, r);
    case "cxnSp": {
      const x = c(t, "spPr"), g = Y(c(x, "xfrm"));
      if (!g) return null;
      const h = s(g), f = c(t, "style"), u = q(c(x, "ln"), a) ?? _t(f, a) ?? { width: 1, color: { hex: "#000000" } };
      if (!u) return null;
      const b = it(x, h) ?? { geom: { kind: "preset", prst: "line" } }, d = (M) => M ? { id: P(M, "id"), idx: P(M, "idx") } : void 0, m = c(i ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: y, name: p, ...h, geom: b.geom, line: u, start: d(c(m, "stCxn")), end: d(c(m, "endCxn")) };
    }
    case "pic": {
      const x = c(t, "spPr");
      let g = Y(c(x, "xfrm"));
      const h = nt(c(i ?? null, "nvPr"));
      if (!g && h && (g = Fe(h, e)), !g) return null;
      const f = c(t, "blipFill"), u = f ? Ht(f, a) : null;
      if (!u)
        return e.warnings.push(`Picture "${p}" has no image the importer can read.`), null;
      const b = c(f, "srcRect"), d = b ? { l: P(b, "l") / 1e5, t: P(b, "t") / 1e5, r: P(b, "r") / 1e5, b: P(b, "b") / 1e5 } : void 0, m = k(O(f, "blip", "alphaModFix"), "amt");
      return { kind: "picture", id: y, name: p, ...s(g), media: u, crop: d, alpha: m !== null ? Number(m) / 1e5 : void 0, descr: k(l, "descr") || void 0 };
    }
    case "grpSp": {
      const x = c(t, "grpSpPr"), g = c(x, "xfrm"), h = Ce(g, s), f = st(t, n, e, h, o + 1, r);
      if (!f.length) return null;
      const u = vt(f);
      return { kind: "group", id: y, name: p, ...u, children: f };
    }
    case "graphicFrame":
      return ze(t, n, e, s, y, p, o);
    default:
      return null;
  }
}
function vt(t) {
  let n = 1 / 0, e = 1 / 0, s = -1 / 0, o = -1 / 0;
  for (const r of t)
    n = Math.min(n, r.x), e = Math.min(e, r.y), s = Math.max(s, r.x + r.w), o = Math.max(o, r.y + r.h);
  return { x: n, y: e, w: Math.max(0, s - n), h: Math.max(0, o - e) };
}
function Fe(t, n) {
  const e = ct(n.layout?.tree ?? null, t), s = Y(O(e, "spPr", "xfrm"));
  if (s) return s;
  const o = ct(n.master?.tree ?? null, { type: Vt(t.type), idx: 0 });
  return Y(O(o, "spPr", "xfrm"));
}
function je(t, n, e, s, o, r, a) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, l = at(t), y = nt(l);
  if (y && !a) return null;
  const p = c(t, "spPr"), x = c(t, "style"), g = k(O(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", h = y && e.layout ? ct(e.layout.tree, y) : null, f = y && e.master ? ct(e.master.tree, { type: Vt(h ? nt(at(h))?.type ?? y.type : y.type), idx: 0 }) : null, u = h && e.layout ? { pkg: e.pkg, part: e.layout.part, ctx: e.ctx } : null, b = f && e.master ? { pkg: e.pkg, part: e.master.part, ctx: e.ctx } : null;
  let d = Y(c(p, "xfrm")) ?? Y(O(h, "spPr", "xfrm")) ?? Y(O(f, "spPr", "xfrm"));
  if (!d) return null;
  d = s(d);
  const m = it(p, d) ?? (h ? it(c(h, "spPr"), d) : void 0) ?? (f ? it(c(f, "spPr"), d) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, M = et(p, i) ?? (u ? et(c(h, "spPr"), u) : void 0) ?? (b ? et(c(f, "spPr"), b) : void 0) ?? At(x, i) ?? (u ? At(c(h, "style"), u) : void 0) ?? { kind: "none" }, v = q(c(p, "ln"), i), S = v !== void 0 ? v : (u ? q(O(h, "spPr", "ln"), u) : void 0) ?? (b ? q(O(f, "spPr", "ln"), b) : void 0) ?? _t(x, i) ?? null, w = [];
  if (y) {
    const X = h ? nt(at(h))?.type ?? y.type : y.type;
    w.push(ot.has(X) ? e.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(X) ? e.masterTx.body : e.masterTx.other), w.push(O(f, "txBody", "lstStyle"), O(h, "txBody", "lstStyle"));
  } else
    w.push(e.defaultText);
  const T = c(x, "fontRef"), C = {
    levels: w,
    bodyPr: [O(f, "txBody", "bodyPr"), O(h, "txBody", "bodyPr")],
    fontRef: T ? { font: k(T, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: $(T, i.ctx) } : void 0
  }, I = Ut(c(t, "txBody"), C, i);
  if (!(M.kind !== "none" || !!S || !!I)) return null;
  let D = m.textRect;
  const A = Y(c(p, "xfrm")), z = I ? Y(c(t, "txXfrm")) : null;
  if (z && A && A.w > 0 && A.h > 0) {
    const X = d.w / A.w, U = d.h / A.h, H = { l: (z.x - A.x) * X, t: (z.y - A.y) * U, r: (z.x + z.w - A.x) * X, b: (z.y + z.h - A.y) * U };
    (Math.abs(H.l) > 0.5 || Math.abs(H.t) > 0.5 || Math.abs(H.r - d.w) > 0.5 || Math.abs(H.b - d.h) > 0.5) && (D = H);
  }
  return { kind: "shape", id: o, name: r, ...d, geom: m.geom, fill: M, line: S, text: I, textBox: g || void 0, textRect: D };
}
function De(t, n) {
  const e = (c(t, "tableStyleId")?.textContent || "").trim().toUpperCase();
  if (e && e !== "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}") return null;
  const s = n.ctx.theme.colors.accent1 ?? "#4472c4", o = (r) => {
    const [a, i, l] = Yt(s);
    return { hex: rt(G(tt(a) * r + (1 - r)), G(tt(i) * r + (1 - r)), G(tt(l) * r + (1 - r))) };
  };
  return {
    firstRow: j(t, "firstRow") ?? !1,
    bandRow: j(t, "bandRow") ?? !1,
    header: { hex: s },
    band1: o(0.4),
    band2: o(0.2),
    border: { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" },
    headerText: { hex: n.ctx.theme.colors.lt1 ?? "#ffffff" },
    bodyText: qt("tx1", n)
  };
}
function ze(t, n, e, s, o, r, a = 0) {
  const i = { pkg: e.pkg, part: n.part, ctx: e.ctx }, l = Y(c(t, "xfrm"));
  if (!l) return null;
  const y = O(t, "graphic", "graphicData"), p = c(y, "tbl");
  if (p) {
    const h = N(c(p, "tblGrid"), "gridCol").map((M) => E(P(M, "w"))), f = De(c(p, "tblPr"), i), u = [];
    let b = l.y, d = 1e6 + o * 1e3;
    return N(p, "tr").forEach((M, v) => {
      const S = E(P(M, "h"));
      let w = l.x, T = 0;
      for (const C of N(M, "tc")) {
        const I = Math.max(1, P(C, "gridSpan", 1)), R = h.slice(T, T + I).reduce((K, W) => K + W, 0);
        if (T += I, j(C, "hMerge") || j(C, "vMerge")) {
          w += R;
          continue;
        }
        const D = Math.max(1, P(C, "rowSpan", 1)), A = c(C, "tcPr"), z = D > 1 ? S * D : S, X = f && f.firstRow && v === 0, U = f && f.bandRow && !X && (v - (f.firstRow ? 1 : 0)) % 2 === 0, H = X ? { color: f.headerText } : f ? { color: f.bodyText } : void 0, _ = Ut(c(C, "txBody"), { levels: [e.defaultText], bodyPr: [], fontRef: H }, i);
        _ && X && _.paragraphs.forEach((K) => K.runs.forEach((W) => {
          W.bold === void 0 && (W.bold = !0);
        })), _ && (_.insets = { l: E(P(A, "marL", 91440)), r: E(P(A, "marR", 91440)), t: E(P(A, "marT", 45720)), b: E(P(A, "marB", 45720)) }, _.anchor = k(A, "anchor") === "ctr" ? "ctr" : k(A, "anchor") === "b" ? "b" : "t");
        const L = q(c(A, "lnB"), i) ?? q(c(A, "lnT"), i) ?? (f ? { width: 1.33, color: f.border } : { width: 1, color: { hex: "#bfbfbf" } }), V = f ? { kind: "solid", color: X ? f.header : U ? f.band1 : f.band2 } : void 0;
        u.push({
          kind: "shape",
          id: d++,
          name: `${r} cell`,
          ...s({ x: w, y: b, w: R, h: z, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: et(A, i) ?? V ?? { kind: "none" },
          line: L,
          text: _
        }), w += R;
      }
      b += S;
    }), u.length ? { kind: "group", id: o, name: r, ...vt(u), children: u } : null;
  }
  const x = k(y, "uri") || "";
  if (/diagram/.test(x)) {
    const h = Xe(y, n, e, s, l, o, r, a);
    if (h) return h;
  }
  const g = /chart/.test(x) ? "Chart" : /diagram/.test(x) ? "SmartArt diagram" : "Embedded object";
  return e.warnings.push(`${g} "${r}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: o,
    name: r,
    ...s(l),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${g}: ${r}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function Xe(t, n, e, s, o, r, a, i) {
  const l = e.pkg.rels(n.part), y = k(c(t, "relIds"), "r:dm"), p = y ? l.get(y) : void 0;
  let x;
  if (p && !p.external) {
    const d = Zt(e.pkg.xml(p.target), "dataModelExt", 6), m = d ? l.get(k(d, "relId") || "") : void 0;
    m && !m.external && (x = m.target);
  }
  if (!x) {
    const d = [...l.values()].filter((m) => m.type === "diagramDrawing" && !m.external);
    d.length === 1 && (x = d[0].target);
  }
  if (!x) return null;
  const g = c(e.pkg.xml(x), "spTree");
  if (!g) return null;
  const f = st(g, { part: x, tree: g }, e, (d) => s({ ...d, x: d.x + o.x, y: d.y + o.y }), i + 1, !0);
  if (!f.length) return null;
  let u = 2e6 + r * 1e3;
  const b = (d) => d.forEach((m) => {
    m.id = u++, m.kind === "group" && b(m.children);
  });
  return b(f), { kind: "group", id: r, name: a, ...vt(f), children: f };
}
function Zt(t, n, e) {
  if (!t || e < 0) return null;
  for (const s of ft(t)) {
    if (s.localName === n) return s;
    const o = Zt(s, n, e - 1);
    if (o) return o;
  }
  return null;
}
function pt(t, n) {
  const e = c(t, "bg");
  if (!e) return;
  const s = c(e, "bgPr");
  if (s) {
    const r = et(s, n);
    return r?.kind === "image" ? { kind: "image", media: r.media } : r;
  }
  const o = c(e, "bgRef");
  if (o) {
    const r = P(o, "idx"), i = (r >= 1001 ? n.ctx.theme.bgFills : n.ctx.theme.fills)[r >= 1001 ? r - 1001 : r - 1], l = i ? wt(i, { ...n, ctx: { ...n.ctx, phClr: $(o, n.ctx) ?? void 0 } }) : void 0;
    return l?.kind === "image" ? { kind: "image", media: l.media } : l ?? ($(o, n.ctx) ? { kind: "solid", color: $(o, n.ctx) } : void 0);
  }
}
function Be(t) {
  const n = ft(t).find((a) => a.localName === "transition");
  if (!n) return;
  const e = N(n).find((a) => a.localName !== "sndAc" && a.localName !== "extLst");
  if (!e) return;
  const s = k(n, "spd"), o = k(n, "p14:dur") !== null ? P(n, "p14:dur") : s === "fast" ? 500 : s === "slow" ? 1e3 : 750, r = k(e, "dir");
  switch (e.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: "push", dir: r === "r" || r === "u" || r === "d" ? r : "l", durationMs: o };
    case "zoom":
      return { kind: "zoom", zoomIn: r !== "out", durationMs: o };
    case "cut":
      return;
    default:
      return { kind: "fade", durationMs: o };
  }
}
function $e(t, n = {}) {
  const e = [], s = (T) => {
    e.length < 200 && !e.includes(T) && e.push(T);
  }, o = n.parseXml ?? ((T) => new DOMParser().parseFromString(T, "application/xml"));
  let r, a = 0, i = 0;
  try {
    r = ne(t, {
      filter: (T) => (a++, i += T.originalSize, a <= Tt && T.originalSize <= pe && i <= It)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (a > Tt || i > It) && s("The file is very large; some parts were skipped.");
  const l = new Me(r, o, s), y = l.relOfType("", "officeDocument") ?? "ppt/presentation.xml", p = l.xml(y);
  if (!p || p.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const x = c(p, "sldSz"), g = x ? Math.max(1, E(P(x, "cx", 9144e3))) : 960, h = x ? Math.max(1, E(P(x, "cy", 5143500))) : 540, f = c(p, "defaultTextStyle"), u = l.rels(y), b = [], d = /* @__PURE__ */ new Set();
  for (const T of N(c(p, "sldIdLst"), "sldId")) {
    const C = u.get(k(T, "r:id") || "");
    C && !d.has(C.target) && b.length < me && (d.add(C.target), b.push(C.target));
  }
  const m = /* @__PURE__ */ new Map(), M = (T) => {
    const C = l.relOfType(T, "theme");
    return C ? (m.has(C) || m.set(C, ut(l.xml(C))), m.get(C)) : ut(null);
  }, v = (T) => {
    if (!T) return null;
    const C = {};
    for (let I = 0; I < T.attributes.length; I++) C[T.attributes[I].localName ?? T.attributes[I].name] = T.attributes[I].value;
    return C;
  }, S = [];
  b.forEach((T, C) => {
    const I = l.xml(T);
    if (!I) {
      s(`Slide ${C + 1} couldn't be read and was skipped.`);
      return;
    }
    const R = l.relOfType(T, "slideLayout"), D = R ? l.xml(R) : null, A = R ? l.relOfType(R, "slideMaster") : null, z = A ? l.xml(A) : null, X = A ? M(A) : ut(null), U = v(O(I, "clrMapOvr", "overrideClrMapping")) ?? v(O(D, "clrMapOvr", "overrideClrMapping")) ?? v(c(z, "clrMap")) ?? kt, H = { theme: X, clrMap: U }, _ = c(z, "txStyles"), L = {
      pkg: l,
      ctx: H,
      slide: { part: T, tree: O(I, "cSld", "spTree") },
      layout: R ? { part: R, tree: O(D, "cSld", "spTree") } : null,
      master: A ? { part: A, tree: O(z, "cSld", "spTree") } : null,
      masterTx: { title: c(_, "titleStyle"), body: c(_, "bodyStyle"), other: c(_, "otherStyle") },
      defaultText: f,
      warnings: e,
      count: 0
    }, V = [], K = j(I, "showMasterSp") !== !1 && j(D, "showMasterSp") !== !1;
    L.master && K && V.push(...st(L.master.tree, L.master, L, ht, 0, !1)), L.layout && j(I, "showMasterSp") !== !1 && V.push(...st(L.layout.tree, L.layout, L, ht, 0, !1)), V.push(...st(L.slide.tree, L.slide, L, ht, 0, !0));
    const W = (ee) => ({ pkg: l, part: ee?.part ?? T, ctx: H }), te = pt(c(I, "cSld"), W(L.slide)) ?? pt(c(D, "cSld"), W(L.layout)) ?? pt(c(z, "cSld"), W(L.master)) ?? { kind: "solid", color: { hex: X.colors[U.bg1 ?? "lt1"] ?? "#ffffff" } };
    S.push({ items: V, background: te, transition: Be(I), name: k(c(I, "cSld"), "name") || void 0 });
  }), S.length || s("The presentation has no slides.");
  const w = O(l.xml("docProps/core.xml"), "title")?.textContent || void 0;
  return { deck: { width: g, height: h, slides: S, title: w }, warnings: e };
}
const Ye = 80, He = "default-layer", F = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const n = t.hex.replace("#", "");
  return `rgba(${parseInt(n.slice(0, 2), 16)}, ${parseInt(n.slice(2, 4), 16)}, ${parseInt(n.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, _e = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, We = /(courier|consolas|mono|menlo|code)/i;
function jt(t) {
  if (!t) return "sans-serif";
  const n = ae(t);
  return n || (We.test(t) ? "monospace" : _e.test(t) ? "serif" : "sans-serif");
}
function Ge(t) {
  const n = [];
  let e = [], s = !1;
  const o = () => {
    if (e.length >= 2) {
      const r = e[0], a = e[e.length - 1];
      s && Math.hypot(r.x - a.x, r.y - a.y) < 1e-6 && (r.inX = a.inX, r.inY = a.inY, e.pop()), n.push({ anchors: e, closed: s });
    }
    e = [], s = !1;
  };
  for (const r of t)
    if (r.op === "M")
      o(), e.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "L")
      e.length ? e.push({ x: r.x, y: r.y, kind: "corner" }) : e.push({ x: r.x, y: r.y, kind: "corner" });
    else if (r.op === "C") {
      const a = e[e.length - 1];
      if (!a) {
        e.push({ x: r.x, y: r.y, kind: "corner" });
        continue;
      }
      a.outX = r.x1 - a.x, a.outY = r.y1 - a.y, e.push({ x: r.x, y: r.y, inX: r.x2 - r.x, inY: r.y2 - r.y, kind: "smooth" });
    } else r.op === "Z" && (s = !0, o());
  return o(), n;
}
const Ue = (t, n, e) => t.map((s) => s.op === "Z" ? s : s.op === "C" ? { ...s, x1: s.x1 + n, y1: s.y1 + e, x2: s.x2 + n, y2: s.y2 + e, x: s.x + n, y: s.y + e } : { ...s, x: s.x + n, y: s.y + e });
function Z(t, n, e, s) {
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
    layerId: He,
    groupIds: [...s].reverse(),
    // innermost first, the store's convention
    name: e.name
  };
}
function Dt(t, n, e) {
  switch (n.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = F(n.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = n.kind, t.backgroundColor = F(n.stops[0]?.color), t.gradientStops = n.stops.map((s) => ({ offset: s.pos, color: F(s.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
      break;
    case "pattern": {
      const s = n.preset;
      t.backgroundColor = F(n.color), t.fillStyle = /Cross|cross|Grid|grid|weave|trellis/.test(s) ? "cross-hatch" : /^pct|dot/i.test(s) ? "dots" : "hachure";
      break;
    }
    case "image": {
      const s = e.images.get(n.media);
      s && (t.fillStyle = "image", t.backgroundImage = s.url, t.backgroundColor = "#ffffff");
      break;
    }
  }
}
function gt(t, n) {
  if (!n || !(n.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = F(n.color), t.strokeWidth = Math.max(0.5, n.width), t.strokeStyle = n.dash === "sysDot" ? "dotted" : n.dash ? "dashed" : "solid", (n.join === "miter" || n.join === "bevel") && (t.strokeLineJoin = n.join), n.cap === "flat" ? t.strokeLineCap = "butt" : n.cap === "sq" && (t.strokeLineCap = "square");
}
function qe(t) {
  const n = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!n) return {};
  const e = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[n[1]], s = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[n[2]], o = {};
  return e && (o.listNumberStyle = e), s && (o.listNumberSuffix = s), o;
}
function Ve(t, n) {
  const e = t.bullet === "num" ? qe(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, s = t.runs.find((o) => !o.br)?.color ?? n.defaults?.color;
  return t.bulletColor && F(t.bulletColor) !== F(s) && (e.listMarkerColor = F(t.bulletColor)), t.bulletScale && (e.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (e.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), e.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), e;
}
const mt = (t, n) => Math.round(((t.paragraphs[n - 1]?.spaceAfter ?? 0) + (t.paragraphs[n]?.spaceBefore ?? 0)) * 100) / 100;
function Kt(t, n) {
  const e = t.paragraphs.flatMap((u) => u.runs.filter((b) => !b.br)), s = e[0], o = s?.size ?? 24, r = /* @__PURE__ */ new Map(), a = (u) => u.runs.reduce((b, d) => b + (d.br ? 0 : d.text.trim().length), 0);
  for (const u of t.paragraphs) {
    const b = a(u);
    b && r.set(u.align ?? "l", (r.get(u.align ?? "l") ?? 0) + b);
  }
  const i = [...r].sort((u, b) => b[1] - u[1])[0]?.[0] ?? t.paragraphs.find((u) => u.runs.length)?.align ?? "l", l = (u) => a(u) > 0 && (u.align ?? "l") !== i ? u.align === "ctr" ? "center" : u.align === "r" ? "right" : "left" : void 0, y = e.every((u) => u.size === s?.size && u.bold === s?.bold && u.italic === s?.italic && u.underline === s?.underline && u.strike === s?.strike && u.font === s?.font && F(u.color) === F(s?.color)) && !t.paragraphs.some((u) => u.bullet) && !t.paragraphs.some((u, b) => b > 0 && mt(t, b) > 0) && !t.paragraphs.some(l), p = {
    fontSize: Math.round(o * 10) / 10,
    fontFamily: jt(s?.font),
    textAlign: i === "ctr" ? "center" : i === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: F(s?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (p.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2)));
  const x = t.paragraphs.map((u) => u.runs.map((b) => b.br ? `
` : b.text).join("")).join(`
`);
  if (y)
    return s?.bold && (p.fontWeight = 700), s?.italic && (p.fontStyle = "italic"), n ? p.containerText = x : p.text = x, { fields: p, rich: !1 };
  const g = [], h = [], f = [];
  return t.paragraphs.forEach((u, b) => {
    const d = u.level ?? 0;
    if (u.bullet === "num") {
      const v = u.numType ?? "arabicPeriod";
      (h[d] === void 0 || f[d] !== v) && (h[d] = (u.startAt ?? 1) - 1), h[d]++, f[d] = v, h.length = d + 1, f.length = d + 1;
    } else
      h.length = Math.min(h.length, d), f.length = h.length;
    const m = u.bullet ? { listType: u.bullet === "num" ? "ordered" : "bullet", listLevel: d, ...Ve(u, t) } : {};
    u.bullet === "num" && (m.listIndex = h[d]), (u.runs.length ? u.runs : [{ text: "" }]).forEach((v, S) => {
      const w = { text: v.br ? `
` : v.text, ...S === 0 ? m : {} };
      S === 0 && b > 0 && mt(t, b) > 0 && (w.paragraphSpaceBefore = mt(t, b));
      const T = l(u);
      T && (w.paragraphAlign = T), v.bold && (w.bold = !0), v.italic && (w.italic = !0), v.underline && (w.underline = !0), v.strike && (w.strikethrough = !0), v.color && (w.color = F(v.color)), v.size && (w.fontSize = Math.round(v.size * 10) / 10), v.font && (w.fontFamily = jt(v.font)), g.push(w);
    }), b < t.paragraphs.length - 1 && g.push({ text: `
` });
  }), n ? (p.richContainerText = g, p.containerText = x) : (p.richText = g, p.text = x), { fields: p, rich: !0 };
}
function xt(t, n, e, s, o) {
  const { fields: r, rich: a } = Kt(n, !1), i = 4, l = Z(t, a ? "richtext" : "text", {
    ...e,
    x: e.x + n.insets.l - i,
    y: e.y + n.insets.t - i,
    w: Math.max(e.w - n.insets.l - n.insets.r + i * 2, 8),
    h: Math.max(e.h - n.insets.t - n.insets.b + i * 2, 8)
  }, s);
  return Object.assign(l, r, { autoResize: !n.wrap, strokeColor: r.textColor }), l;
}
const Qt = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function Ze(t, n, e) {
  const s = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || s.kind === "preset" && s.prst === "rect"))
    return n.stats.elements++, [xt(n, t.text, t, e)];
  if (s.kind === "preset" && Qt.has(s.prst)) return bt({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, n, e);
  if (s.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && s.paths.every((x) => !x.cmds.some((g) => g.op === "Z")))
    return bt({ ...t, kind: "connector", line: t.line }, n, e);
  const o = Qe(t);
  if (o) {
    const x = Z(n, o.type, t, e);
    Object.assign(x, o.extra), Dt(x, t.fill, n), gt(x, t.line), n.byPptId.set(t.id, { el: x, item: t }), n.stats.elements++;
    const g = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, h = t.text?.insets, f = Math.abs(g.l) > 0.5 || Math.abs(g.t) > 0.5 || Math.abs(g.r - t.w) > 0.5 || Math.abs(g.b - t.h) > 0.5, u = !!h && Math.max(h.l, h.r, h.t, h.b) > 16;
    if (t.text && (f || u)) {
      const b = n.nextId("group");
      return x.groupIds = [...e, b].reverse(), n.stats.elements++, [x, xt(n, t.text, { ...t, rot: 0, x: t.x + g.l, y: t.y + g.t, w: g.r - g.l, h: g.b - g.t }, [...e, b])];
    }
    if (t.text) {
      const { fields: b } = Kt(t.text, !0);
      Object.assign(x, b);
    }
    return [x];
  }
  const r = s.kind === "custom" ? s.paths : (() => {
    const x = n.presets[s.prst];
    if (!x)
      return n.warnings.push(`Unknown shape "${s.prst}" was imported as a rectangle.`), lt(n.presets.rect, t.w, t.h);
    const g = Object.fromEntries(Object.entries(s.adj ?? {}).map(([h, f]) => [h, `val ${f}`]));
    return lt(x, t.w, t.h, g);
  })(), a = [], i = (t.text || r.some((x) => x.fill === !1)) && r.some((x) => x.fill !== !1) ? n.nextId("group") : null, l = i ? [...e, i] : e, y = /* @__PURE__ */ new Map();
  for (const x of r) {
    const g = `${x.fill === !1 ? "nofill" : "fill"}|${x.stroke === !1 ? "nostroke" : "stroke"}`;
    y.has(g) || y.set(g, []), y.get(g).push(x);
  }
  let p = null;
  for (const [x, g] of y) {
    const h = g.flatMap((m) => m.cmds), f = oe(h);
    if (!f) continue;
    const u = Ge(Ue(h, -f.minX, -f.minY));
    if (!u.length) continue;
    const b = Z(n, "path", { ...t, x: t.x + f.minX, y: t.y + f.minY, w: Math.max(f.maxX - f.minX, 1), h: Math.max(f.maxY - f.minY, 1) }, l);
    !(Math.abs(f.minX + f.maxX - t.w) < 0.5 && Math.abs(f.minY + f.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && Ke(b, u, t, f), b.pathSubpaths = u, b.pathAnchors = u[0].anchors, b.pathClosed = u[0].closed, x.startsWith("fill") ? Dt(b, t.fill, n) : b.backgroundColor = "transparent", x.endsWith("|stroke") ? gt(b, t.line) : (b.strokeColor = "transparent", b.strokeWidth = 0), a.push(b), p ??= b, n.stats.paths++;
  }
  if (p && n.byPptId.set(t.id, { el: p, item: t }), t.text) {
    const x = t.textRect ?? (s.kind === "preset" && n.presets[s.prst] ? $t(n.presets[s.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    a.push(xt(n, t.text, { ...t, x: t.x + x.l, y: t.y + x.t, w: x.r - x.l, h: x.b - x.t }, l));
  }
  return n.stats.elements += a.length, a;
}
function Ke(t, n, e, s) {
  const o = e.w / 2, r = e.h / 2, a = (e.rot || 0) * Math.PI / 180, i = Math.cos(a), l = Math.sin(a), y = e.flipH ? -1 : 1, p = e.flipV ? -1 : 1, x = (d, m) => {
    const M = (d + s.minX - o) * y, v = (m + s.minY - r) * p;
    return { x: o + M * i - v * l, y: r + M * l + v * i };
  }, g = (d, m) => {
    const M = d * y, v = m * p;
    return { x: M * i - v * l, y: M * l + v * i };
  };
  let h = 1 / 0, f = 1 / 0, u = -1 / 0, b = -1 / 0;
  for (const d of n) for (const m of d.anchors) {
    const M = x(m.x, m.y);
    if (m.x = M.x, m.y = M.y, m.inX !== void 0) {
      const v = g(m.inX, m.inY ?? 0);
      m.inX = v.x, m.inY = v.y;
    }
    if (m.outX !== void 0) {
      const v = g(m.outX, m.outY ?? 0);
      m.outX = v.x, m.outY = v.y;
    }
    h = Math.min(h, m.x), f = Math.min(f, m.y), u = Math.max(u, m.x), b = Math.max(b, m.y);
  }
  for (const d of n) for (const m of d.anchors)
    m.x -= h, m.y -= f;
  t.x = t.x - s.minX + h, t.y = t.y - s.minY + f, t.width = Math.max(u - h, 1), t.height = Math.max(b - f, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Qe(t) {
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
const zt = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function bt(t, n, e) {
  const s = t.geom;
  let o;
  if (s.kind === "preset" && Qt.has(s.prst)) o = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (s.kind === "custom") o = s.paths.flatMap((M) => M.cmds);
  else {
    const M = n.presets[s.prst], v = Object.fromEntries(Object.entries(s.adj ?? {}).map(([S, w]) => [S, `val ${w}`]));
    o = M ? lt(M, t.w, t.h, v).flatMap((S) => S.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const r = t.w / 2, a = t.h / 2, i = (t.rot || 0) * Math.PI / 180, l = (M, v) => {
    let S = M - r, w = v - a;
    return t.flipH && (S = -S), t.flipV && (w = -w), { x: t.x + r + S * Math.cos(i) - w * Math.sin(i), y: t.y + a + S * Math.sin(i) + w * Math.cos(i) };
  }, y = [];
  let p = { x: 0, y: 0 };
  for (const M of o)
    if (M.op === "M" || M.op === "L")
      p = { x: M.x, y: M.y }, y.push(l(p.x, p.y));
    else if (M.op === "C") {
      for (let v = 1; v <= 12; v++) {
        const S = v / 12, w = 1 - S, T = w * w * w * p.x + 3 * w * w * S * M.x1 + 3 * w * S * S * M.x2 + S * S * S * M.x, C = w * w * w * p.y + 3 * w * w * S * M.y1 + 3 * w * S * S * M.y2 + S * S * S * M.y;
        y.push(l(T, C));
      }
      p = { x: M.x, y: M.y };
    }
  if (y.length < 2) return [];
  const x = Math.min(...y.map((M) => M.x)), g = Math.min(...y.map((M) => M.y)), h = Math.max(...y.map((M) => M.x)), f = Math.max(...y.map((M) => M.y)), u = t.line.head && zt[t.line.head.type], b = t.line.tail && zt[t.line.tail.type], d = Z(n, u || b ? "arrow" : "line", { ...t, x, y: g, w: Math.max(h - x, 1), h: Math.max(f - g, 1), rot: 0, flipH: !1, flipV: !1 }, e);
  d.points = y.map((M) => ({ x: M.x - x, y: M.y - g })), d.curveType = "straight", d.startArrowhead = u ?? null, d.endArrowhead = b ?? null, gt(d, t.line);
  const m = (M, v) => {
    if (!M) return null;
    const S = n.byPptId.get(M.id);
    if (!S || !S.el.width || !S.el.height) return null;
    const w = S.el;
    return { elementId: w.id, focus: 0, gap: 0, anchorFractionX: (v.x + n.ox - w.x) / w.width, anchorFractionY: (v.y + n.oy - w.y) / w.height };
  };
  return n.glue.push(() => {
    d.startBinding = m(t.start, y[0]), d.endBinding = m(t.end, y[y.length - 1]);
  }), n.stats.elements++, [d];
}
function Je(t, n, e) {
  const s = n.images.get(t.media);
  if (!s) {
    n.warnings.push(`Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const r = Z(n, "rectangle", t, e);
    return Object.assign(r, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), n.stats.elements++, [r];
  }
  const o = Z(n, "image", t, e);
  return o.dataURL = s.url, o.status = "loaded", o.mimeType = yt[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (o.crop = { x: t.crop.l * s.w, y: t.crop.t * s.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * s.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * s.h) }), t.alpha !== void 0 && t.alpha < 1 && (o.opacity = Math.round(t.alpha * 100)), t.descr && (o.altText = t.descr), n.stats.elements++, n.stats.pictures++, [o];
}
function Jt(t, n, e) {
  const s = [];
  for (const o of t)
    try {
      switch (o.kind) {
        case "shape":
          s.push(...Ze(o, n, e));
          break;
        case "connector":
          s.push(...bt(o, n, e));
          break;
        case "picture":
          s.push(...Je(o, n, e));
          break;
        case "group":
          s.push(...Jt(o.children, n, [...e, n.nextId("group")]));
          break;
      }
    } catch {
      n.warnings.push(`"${o.name}" couldn't be converted and was skipped.`);
    }
  return s;
}
function tn(t) {
  return t ? { type: t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.dir === "r" ? "slide-right" : t.dir === "u" ? "slide-up" : t.dir === "d" ? "slide-down" : "slide-left", duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" } : void 0;
}
function en(t, n, e) {
  if (n)
    if (n.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = F(n.color);
    else if (n.kind === "linear" || n.kind === "radial")
      t.fillStyle = n.kind, t.backgroundColor = F(n.stops[0]?.color), t.gradientStops = n.stops.map((s) => ({ offset: s.pos, color: F(s.color) })), n.kind === "linear" && (t.gradientDirection = n.angle);
    else if (n.kind === "image") {
      const s = e.images.get(n.media);
      s && (t.fillStyle = "image", t.backgroundImage = s.url, t.backgroundColor = "#ffffff");
    } else n.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = F(n.color));
}
const yt = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, nn = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function sn(t) {
  let n = "";
  for (let s = 0; s < t.length; s += 32768) n += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(n);
}
async function on(t) {
  const n = /* @__PURE__ */ new Set(), e = (o) => {
    for (const r of o)
      r.kind === "picture" ? n.add(r.media) : r.kind === "group" ? e(r.children) : r.kind === "shape" && r.fill.kind === "image" && n.add(r.fill.media);
  };
  for (const o of t.slides)
    e(o.items), o.background?.kind === "image" && n.add(o.background.media);
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (o) => {
    if (!nn.has(o.ext)) {
      s.set(o, null);
      return;
    }
    const r = `data:${yt[o.ext]};base64,${sn(o.bytes)}`;
    let a = 0, i = 0;
    try {
      const l = await createImageBitmap(new Blob([o.bytes], { type: yt[o.ext] }));
      a = l.width, i = l.height, l.close();
    } catch {
    }
    s.set(o, { url: r, w: a, h: i });
  })), s;
}
async function rn(t, n, e) {
  const s = await he(), o = await on(t), r = Math.round(t.width), a = Math.round(t.height), i = re(e ?? t.title, "slides", { width: r, height: a }), l = [], y = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  return i.slides = [], t.slides.forEach((p, x) => {
    const g = x * (r + Ye), h = St(void 0, p.name || `Slide ${x + 1}`, g, 0, { width: r, height: a });
    h.order = x;
    const f = { ox: g, oy: 0, presets: s, nextId: n, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: l, stats: y, images: o };
    i.elements.push(...Jt(p.items, f, [])), f.glue.forEach((b) => b()), en(h, p.background, f);
    const u = tn(p.transition);
    u && (h.transition = u), i.slides.push(h), y.slides++;
  }), i.slides.length || i.slides.push(St(void 0, "Slide 1", 0, 0, { width: r, height: a })), { doc: i, warnings: [...new Set(l)], stats: y };
}
const an = 512 * 1024 * 1024;
async function un(t, n) {
  const e = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (e.length > an) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: s, warnings: o } = $e(e), r = /* @__PURE__ */ new Set(), a = await rn(s, (l) => le(l, r), n);
  ie(a.doc);
  const i = [...o, ...a.warnings];
  return i.length && console.warn("[pptx import]", i), { stats: a.stats, warnings: i };
}
export {
  un as importPptx
};
