import { a5 as rt, a6 as mt, a7 as xt, a1 as gt, a8 as yt, a9 as kt, aa as bt, ab as Mt, ac as wt, ad as vt, ae as G, af as St, ag as At, ah as $t, ai as It, aj as Ct, ak as Tt, al as zt, am as Ft, an as Pt, ao as Lt, ap as Et, aq as Ot } from "./index-Bqlr2FLr.js";
import { t as Rt } from "./anim-map-D7T1mIAM.js";
import { d as P, g as N, t as C, h as Xt } from "./custgeom-DUHYX5Vs.js";
function Dt(t) {
  const { l: n, c: e, h: r } = t, i = r * Math.PI / 180, o = e * Math.cos(i), l = e * Math.sin(i), f = n + 0.3963377774 * o + 0.2158037573 * l, a = n - 0.1055613458 * o - 0.0638541728 * l, s = n - 0.0894841775 * o - 1.291485548 * l, c = f * f * f, u = a * a * a, h = s * s * s, p = 1.2270138511 * c - 0.5577999807 * u + 0.2812561489 * h, d = -0.0405801784 * c + 1.1122568696 * u - 0.0716766787 * h, x = -0.0763812845 * c - 0.4214819787 * u + 1.5861632204 * h, g = 2.4039459 * p - 0.9898517 * d - 0.4141151 * x, k = -0.7797967 * p + 1.5445214 * d + 0.0352745 * x, m = 0.0384795 * p - 0.1141381 * d + 1.0756786 * x, y = (b) => {
    const M = Math.abs(b), w = M > 31308e-7 ? 1.055 * Math.pow(M, 1 / 2.4) - 0.055 : 12.92 * M;
    return b < 0 ? -w : w;
  };
  return {
    r: y(g),
    g: y(k),
    b: y(m)
  };
}
function X(t) {
  const n = Math.abs(t), e = n > 31308e-7 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : 12.92 * n;
  return t < 0 ? -e : e;
}
function D(t) {
  const n = Math.abs(t), e = n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
  return t < 0 ? -e : e;
}
function q(t, n, e) {
  const r = D(t), i = D(n), o = D(e);
  return {
    r: X(1.2249401762805083 * r - 0.2249401762805082 * i),
    g: X(-0.04205697751522136 * r + 1.0420569775152215 * i),
    b: X(-0.019637554590334 * r - 0.07863604555063188 * i + 1.0982736001409656 * o)
  };
}
function Bt(t) {
  return t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
}
function T(t) {
  if (!t) return null;
  const n = String(t).trim().toLowerCase();
  if (!n || n === "transparent" || n === "none" || n === "currentcolor") return null;
  if (n[0] === "#") {
    let o = n.slice(1);
    return (o.length === 3 || o.length === 4) && (o = o.slice(0, 3).split("").map((l) => l + l).join("")), o.length === 8 && (o = o.slice(0, 6)), /^[0-9a-f]{6}$/.test(o) ? [parseInt(o.slice(0, 2), 16), parseInt(o.slice(2, 4), 16), parseInt(o.slice(4, 6), 16)] : null;
  }
  const e = (o) => Math.round(Math.max(0, Math.min(1, o)) * 255), r = n.match(/^color\(\s*(display-p3|srgb)\s+([^/)]+?)\s*(?:\/[^)]*)?\)$/);
  if (r) {
    const o = r[2].split(/[\s,]+/).filter(Boolean).map(Bt);
    if (o.length < 3 || o.some((c) => !isFinite(c))) return null;
    const [l, f, a] = o;
    if (r[1] === "srgb") return [e(l), e(f), e(a)];
    const s = q(l, f, a);
    return [e(s.r), e(s.g), e(s.b)];
  }
  const i = n.match(/^oklch\(\s*([^/)]+?)\s*(?:\/[^)]*)?\)$/);
  if (i) {
    const o = i[1].split(/[\s,]+/).filter(Boolean);
    if (o.length < 3) return null;
    const l = o[0].endsWith("%") ? parseFloat(o[0]) / 100 : parseFloat(o[0]), f = parseFloat(o[1]), a = parseFloat(o[2]);
    if (![l, f, a].every(isFinite)) return null;
    const s = q(...(({ r: c, g: u, b: h }) => [c, u, h])(Dt({ l, c: f, h: a })));
    return [e(s.r), e(s.g), e(s.b)];
  }
  return Yt(n);
}
const z = /* @__PURE__ */ new Map();
let $;
function Yt(t) {
  if (z.has(t)) return z.get(t);
  let n = null;
  try {
    if ($ === void 0) {
      const e = typeof document < "u" ? document.createElement("canvas") : null;
      $ = e ? e.getContext("2d", { willReadFrequently: !0 }) : null, $ && ($.canvas.width = 1, $.canvas.height = 1);
    }
    if ($ && ($.fillStyle = "#000000", $.fillStyle = t, $.fillStyle !== "#000000" || t === "#000000" || t === "black")) {
      $.clearRect(0, 0, 1, 1), $.fillRect(0, 0, 1, 1);
      const e = $.getImageData(0, 0, 1, 1).data;
      n = [e[0], e[1], e[2]];
    }
  } catch {
    n = null;
  }
  return z.size < 512 && z.set(t, n), n;
}
const L = (t) => "#" + t.map((n) => n.toString(16).padStart(2, "0")).join("");
function Wt(t) {
  const n = t.trim().toLowerCase(), e = n.match(/^#([0-9a-f]{8})$/);
  if (e) return parseInt(e[1].slice(6), 16) / 255;
  const r = n.match(/^#([0-9a-f]{4})$/);
  if (r) return parseInt(r[1][3] + r[1][3], 16) / 255;
  const i = n.match(/^(?:rgba?|hsla?)\(([^)]*)\)$/);
  if (i) {
    const l = i[1].split(/[\s,/]+/).filter(Boolean);
    if (l.length >= 4) return V(l[3]);
  }
  const o = n.match(/\/\s*([\d.]+%?)\s*\)$/);
  return o ? V(o[1]) : 1;
}
const V = (t) => {
  const n = t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
};
function A(t, n = 1) {
  if (!t) return null;
  const e = T(t);
  if (!e) return null;
  const r = Wt(t) * n;
  return r <= 0 ? null : r < 0.999 ? { hex: L(e), alpha: r } : { hex: L(e) };
}
const ot = (t) => mt(t).split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Calibri", W = {
  hachure: "ltUpDiag",
  zigzag: "ltUpDiag",
  "zigzag-line": "ltUpDiag",
  dashed: "dashUpDiag",
  "cross-hatch": "diagCross",
  dots: "pct20"
};
function Ht(t, n) {
  const e = t.fillStyle || "solid";
  if ((e === "linear" || e === "radial" || e === "conic") && (t.gradientStops?.length ?? 0) > 0) {
    const i = t.gradientStops.map((o) => ({ pos: Math.max(0, Math.min(1, o.offset)), color: A(o.color, n) ?? { hex: "#000000", alpha: 0 } }));
    return e === "linear" ? { kind: "linear", stops: i, angle: t.gradientDirection ?? 45, scaled: !0 } : { kind: "radial", stops: i };
  }
  const r = A(t.backgroundColor, n);
  return r ? W[e] ? { kind: "pattern", preset: W[e], color: r } : { kind: "solid", color: r } : { kind: "none" };
}
function it(t) {
  if (t.strokeStyle === "dotted") return "sysDot";
  if (t.strokeStyle === "dashed") return "dash";
  if (Array.isArray(t.strokeDashArray) && t.strokeDashArray.length >= 2) {
    const [n] = t.strokeDashArray;
    return n <= (t.strokeWidth || 2) * 1.5 ? "sysDot" : "dash";
  }
}
function U(t, n, e = !1) {
  const r = A(t.strokeColor, n);
  if (!r || !(t.strokeWidth > 0)) return null;
  const i = t.strokeLineCap === "butt" ? "flat" : t.strokeLineCap === "square" ? "sq" : "rnd";
  return {
    width: t.strokeWidth,
    color: r,
    dash: it(t),
    cap: e ? i : void 0,
    join: t.strokeLineJoin === "miter" ? "miter" : t.strokeLineJoin === "bevel" ? "bevel" : "round"
  };
}
function J(t, n, e) {
  if (!t) return;
  const r = n / Math.max(e, 0.5), i = r <= 2.5 ? "sm" : r <= 4 ? "med" : "lg";
  return { type: t === "triangle" ? "triangle" : t === "dot" || t === "circle" ? "oval" : t === "diamond" || t === "diamondFilled" ? "diamond" : "arrow", size: i };
}
const _ = (t, n) => t === "center" ? "ctr" : t === "right" ? "r" : t === "left" ? "l" : n, st = (t) => t === "top" ? "t" : t === "bottom" ? "b" : "ctr";
function at(t, n) {
  return t.split(`
`).map((e) => ({ runs: e ? [{ text: e }] : [], align: n }));
}
function jt(t) {
  const n = { "lower-alpha": "alphaLc", "upper-alpha": "alphaUc", "lower-roman": "romanLc", "upper-roman": "romanUc" }[t.listNumberStyle ?? ""] ?? "arabic", e = { paren: "ParenR", parens: "ParenBoth", none: "Plain" }[t.listNumberSuffix ?? ""] ?? "Period";
  return n + e;
}
let I;
function Nt(t, n) {
  if (I === void 0 && (I = typeof document < "u" ? document.createElement("canvas").getContext("2d") : null), I)
    return I.font = n, I.measureText(t).width;
  const e = Number(/(\d+(?:\.\d+)?)px/.exec(n)?.[1] ?? 16);
  return t.length * e * 0.6;
}
function Ut(t, n, e, r) {
  const i = t.listLevel || 0, o = { bullet: t.listType === "ordered" ? "num" : "char", level: i };
  if (o.bullet === "num") {
    const a = jt(t);
    a !== "arabicPeriod" && (o.numType = a), !(e && e.level === i && e.scheme === a && (t.listIndex || 1) === e.index + 1) && (t.listIndex || 1) > 1 && (o.startAt = t.listIndex);
  } else t.listMarker && t.listMarker !== "•" && (o.bulletChar = t.listMarker);
  if (t.listMarkerColor) {
    const a = A(t.listMarkerColor, n);
    a && (o.bulletColor = a);
  }
  t.listMarkerScale && t.listMarkerScale !== 1 && (o.bulletScale = t.listMarkerScale);
  const l = Ot(t), f = r(t);
  return o.marL = f, o.indent = l - f, o;
}
function ct(t, n, e, r) {
  const i = [];
  let o = { runs: [], align: n }, l = !1, f = null;
  const a = Lt(Nt, t, r), s = () => {
    i.push(o), o = { runs: [], align: n }, l = !1;
  };
  for (const c of t)
    String(c.text ?? "").split(`
`).forEach((h, p) => {
      if (p > 0 && s(), c.fontSize && !l && (o.endSize = c.fontSize), !h) return;
      l || (l = !0, c.paragraphSpaceBefore && (o.spaceBefore = c.paragraphSpaceBefore), c.paragraphAlign && (o.align = _(c.paragraphAlign, n ?? "l")), c.listType && c.listType !== "none" && Object.assign(o, Ut(c, e, f, a)), f = o.bullet === "num" ? { level: o.level ?? 0, scheme: o.numType ?? "arabicPeriod", index: c.listIndex || 1 } : null);
      const d = { text: h };
      if (c.bold && (d.bold = !0), c.italic && (d.italic = !0), c.underline && (d.underline = !0), c.strikethrough && (d.strike = !0), c.color) {
        const x = A(c.color, e);
        x && (d.color = x);
      }
      c.fontSize && (d.size = c.fontSize), c.fontFamily && (d.font = ot(c.fontFamily)), o.runs.push(d);
    });
  return s(), i;
}
function lt(t, n, e) {
  const r = A(t.textColor || t.strokeColor || "#000000", n) ?? void 0;
  return {
    size: e,
    color: r,
    font: ot(t.fontFamily),
    bold: zt(t.fontWeight) >= 600 ? !0 : void 0,
    italic: Tt(t.fontStyle) === "italic" ? !0 : void 0
  };
}
const ft = (t) => Ft(t) / Pt;
function _t(t, n) {
  const e = t.richText && t.richText.length > 0, r = _(t.textAlign, e ? "ctr" : "l");
  return {
    paragraphs: e ? ct(t.richText, r, n, { fontSize: t.fontSize || 20, fontFamily: t.fontFamily || "sans-serif" }) : at(t.text || "", r),
    anchor: st(t.verticalAlign),
    insets: { l: 4, t: 4, r: 4, b: 4 },
    wrap: !t.autoResize,
    lineSpacing: ft(t),
    defaults: lt(t, n, t.fontSize || 20)
  };
}
function ut(t, n) {
  const e = t.richContainerText && t.richContainerText.length > 0;
  if (!e && !t.containerText) return;
  const r = _(t.textAlign, "ctr");
  return {
    paragraphs: e ? ct(t.richContainerText, r, n, { fontSize: t.fontSize || 28, fontFamily: t.fontFamily || "hand-drawn" }) : at(t.containerText, r),
    anchor: st(t.verticalAlign),
    insets: { l: 10, t: 4, r: 10, b: 4 },
    wrap: !0,
    lineSpacing: ft(t),
    defaults: lt(t, n, t.fontSize || 16)
  };
}
function Zt(t, n, e) {
  const r = [], i = Math.abs(n) / 2, o = Math.abs(e) / 2, l = (a, s, c) => {
    const u = C(P(a), i, o);
    if (u.length === 0) return;
    const h = s, p = { fill: h.noFill ? !1 : void 0, stroke: h.noStroke ? !1 : void 0 };
    if (c) {
      r.push({ cmds: u, ...p });
      return;
    }
    let d = [];
    for (const x of u)
      x.op === "M" && d.length && (r.push({ cmds: d, ...p }), d = []), d.push(x);
    d.length && r.push({ cmds: d, ...p });
  }, f = (a) => {
    const s = (c) => Math.round(c * 1e3) / 1e3;
    switch (a.type) {
      case "rect": {
        const c = Math.min(Math.abs(a.w), Math.abs(a.h)) / 2, [u, h, p, d] = (Array.isArray(a.r) ? a.r : [a.r || 0, a.r || 0, a.r || 0, a.r || 0]).map((b) => Math.max(0, Math.min(b || 0, c))), x = (b, M, w) => b ? ` A ${s(b)} ${s(b)} 0 0 1 ${s(M)} ${s(w)}` : "", { x: g, y: k } = a, m = a.w, y = a.h;
        l(`M ${g + u} ${k} H ${g + m - h}${x(h, g + m, k + h)} V ${k + y - p}${x(p, g + m - p, k + y)} H ${g + d}${x(d, g, k + y - d)} V ${k + u}${x(u, g + u, k)} Z`, a, !1);
        break;
      }
      case "ellipse":
        l(`M ${a.cx - a.rx} ${a.cy} A ${a.rx} ${a.ry} 0 1 0 ${a.cx + a.rx} ${a.cy} A ${a.rx} ${a.ry} 0 1 0 ${a.cx - a.rx} ${a.cy} Z`, a, !1);
        break;
      case "points":
        a.points.length >= 2 && l(`M ${a.points.map((c) => `${c.x} ${c.y}`).join(" L ")}${a.isClosed !== !1 ? " Z" : ""}`, a, !1);
        break;
      case "path":
        l(a.path, a, !!a.evenOdd);
        break;
      case "multi":
        a.shapes.forEach(f);
        break;
    }
  };
  return f(t), r;
}
function Gt(t) {
  if (t.warp || t.points && t.points.length) return null;
  if (t.type === "circle") return { kind: "preset", prst: "ellipse" };
  if (t.type === "rectangle") {
    const [n, e, r, i] = $t(t);
    if (!n && !e && !r && !i) return { kind: "preset", prst: "rect" };
    if (n === e && e === r && r === i) {
      const o = Math.min(Math.abs(t.width), Math.abs(t.height));
      return o > 0 ? { kind: "preset", prst: "roundRect", adj: { adj: Math.min(5e4, n / o * 1e5) } } : null;
    }
  }
  return null;
}
const qt = /* @__PURE__ */ new Set(["umlClass", "umlInterface", "qrCode", "video", "codeBlock"]), Vt = /* @__PURE__ */ new Set(["fineliner", "inkbrush", "marker", "ink"]), Jt = /* @__PURE__ */ new Set(["text", "richtext", "image", "line", "arrow"]);
function Kt(t) {
  const n = t;
  if (qt.has(t.type) || t.clipMaskId || t.shadowEnabled || t.glowEnabled || (t.featherRadius ?? 0) > 0 || t.blendMode && t.blendMode !== "normal" || t.shearX || t.shearY || kt(t) || bt(t) || Mt(t) || wt(t) || t.appearance && (t.appearance.fills?.length ?? 0) + (t.appearance.strokes?.length ?? 0) > 0) return !0;
  const e = t.fillStyle;
  if (e === "image" || e === "mesh" || e === "pattern" || t.backgroundImage || t.curvedText || (t.type === "text" || t.type === "richtext") && (t.verticalText || (n.charTransforms?.length ?? 0) > 0)) return !0;
  if (t.type === "image") {
    if (t.warp || t.pixelEffect) return !0;
    const r = t;
    if ((r.filterBrightness ?? 100) !== 100 || (r.filterContrast ?? 100) !== 100 || (r.filterSaturate ?? 100) !== 100 || (r.filterBlur ?? 0) || (r.filterHueRotate ?? 0) || (r.filterInvert ?? 0) || (r.filterSepia ?? 0) || (r.filterGrayscale ?? 0)) return !0;
  }
  return !1;
}
function K(t) {
  const n = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(t);
  if (!n) return null;
  try {
    const e = n[2] ? atob(n[3]) : decodeURIComponent(n[3]), r = new Uint8Array(e.length);
    for (let i = 0; i < e.length; i++) r[i] = e.charCodeAt(i) & 255;
    return { bytes: r, mime: (n[1] || "").toLowerCase() };
  } catch {
    return null;
  }
}
function Z(t) {
  if (!t) return null;
  const n = K(t);
  if (n && n.mime === "image/png") return { bytes: n.bytes, ext: "png" };
  if (n && (n.mime === "image/jpeg" || n.mime === "image/jpg")) return { bytes: n.bytes, ext: "jpeg" };
  if (n && n.mime === "image/gif") return { bytes: n.bytes, ext: "gif" };
  const e = rt(t);
  if (!e || !e.naturalWidth) return null;
  try {
    const r = document.createElement("canvas");
    r.width = e.naturalWidth, r.height = e.naturalHeight, r.getContext("2d").drawImage(e, 0, 0);
    const i = K(r.toDataURL("image/png"));
    return i ? { bytes: i.bytes, ext: "png" } : null;
  } catch {
    return null;
  }
}
const v = (t) => t.name || t.type;
function O(t, n) {
  const e = Math.abs(t.width), r = Math.abs(t.height), i = Math.min(t.x, t.x + t.width) - n.ox, o = Math.min(t.y, t.y + t.height) - n.oy;
  return { x: i, y: o, w: e, h: r, rot: t.angle ? t.angle * 180 / Math.PI : void 0, flipH: !!t.flipX || void 0, flipV: !!t.flipY || void 0 };
}
function H(t, n, e) {
  const r = n.hooks.rasterize(t), i = r ? Z(r.dataURL) : null;
  return !r || !i ? [] : (n.report.pictures++, [{ kind: "picture", id: n.nextId++, name: e, x: r.x - n.ox, y: r.y - n.oy, w: r.width, h: r.height, media: i }]);
}
function Qt(t, n) {
  const e = Z(t.dataURL);
  if (!e) return H([t], n, v(t));
  let r;
  if (t.crop) {
    const o = t.dataURL ? rt(t.dataURL) : null, l = o?.naturalWidth, f = o?.naturalHeight;
    if (l && f) {
      const a = t.crop;
      r = { l: a.x / l, t: a.y / f, r: 1 - (a.x + a.width) / l, b: 1 - (a.y + a.height) / f };
    }
  }
  const i = (t.opacity ?? 100) / 100;
  return n.report.native++, [{ kind: "picture", id: n.nextId++, name: v(t), ...O(t, n), media: e, crop: r, alpha: i < 1 ? i : void 0, descr: t.altText }];
}
function tn(t, n, e, r) {
  const i = ut(t, r);
  if (!i) return [];
  const o = t.fontSize || 16, l = (t.containerText || "").split(`
`), f = Math.max(1, ...l.map((c) => c.length)), a = Math.max(40, f * o * 0.6 + 24), s = Math.max(o * 1.6, l.length * o * 1.25 + 8);
  return i.wrap = !1, i.anchor = "ctr", i.paragraphs.forEach((c) => {
    c.align = "ctr";
  }), [{
    kind: "shape",
    id: e.nextId++,
    name: `${v(t)} label`,
    textBox: !0,
    x: n.x - e.ox - a / 2,
    y: n.y - e.oy - s / 2,
    w: a,
    h: s,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: i
  }];
}
function nn(t, n, e) {
  const r = t.x + t.w / 2, i = t.y + t.h / 2, o = (t.rot || 0) * Math.PI / 180, l = [[0, -t.h / 2], [-t.w / 2, 0], [0, t.h / 2], [t.w / 2, 0]], f = n.x - e.ox, a = n.y - e.oy;
  for (let s = 0; s < 4; s++) {
    let [c, u] = l[s];
    t.flipH && (c = -c), t.flipV && (u = -u);
    const h = r + c * Math.cos(o) - u * Math.sin(o), p = i + c * Math.sin(o) + u * Math.cos(o);
    if (Math.hypot(h - f, p - a) <= 2) return s;
  }
  return -1;
}
function en(t, n, e) {
  const r = e.x - n.x, i = e.y - n.y, o = Math.hypot(r, i);
  if (!(o > 0)) return !1;
  const l = (s, c) => Math.abs((s - n.x) * i - (c - n.y) * r) / o, f = (s, c) => ((s - n.x) * r + (c - n.y) * i) / (o * o), a = (s, c) => l(s, c) <= 0.5 && f(s, c) >= -0.01 && f(s, c) <= 1.01;
  return t.every((s) => s.op === "Z" ? !1 : s.op === "C" ? a(s.x1, s.y1) && a(s.x2, s.y2) && a(s.x, s.y) : a(s.x, s.y));
}
function rn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = U(t, e, !0), i = vt(t), o = [];
  if (r) {
    const l = t.type === "arrow", f = l ? t.startArrowhead : null, a = l ? t.endArrowhead || (t.startArrowhead ? null : "arrow") : null, s = { ...r, head: J(f, G(t, "start"), t.strokeWidth), tail: J(a, G(t, "end"), t.strokeWidth) };
    if (!i.d || en(P(i.d), i.start, i.end)) {
      const { start: c, end: u } = i, h = {
        kind: "connector",
        id: n.nextId++,
        name: v(t),
        x: Math.min(c.x, u.x) - n.ox,
        y: Math.min(c.y, u.y) - n.oy,
        w: Math.abs(u.x - c.x),
        h: Math.abs(u.y - c.y),
        flipH: u.x < c.x || void 0,
        flipV: u.y < c.y || void 0,
        geom: { kind: "preset", prst: "straightConnector1" },
        line: s
      }, p = (d, x) => {
        const g = d?.elementId ? n.ids.get(d.elementId) : void 0;
        if (!g) return;
        const k = nn(g.item, x, n);
        return k >= 0 ? { id: g.id, idx: k } : void 0;
      };
      n.glue.push(() => {
        h.start = p(t.startBinding, c), h.end = p(t.endBinding, u);
      }), o.push(h);
    } else {
      const c = P(i.d), u = N(c);
      if (u) {
        const h = Math.max(u.maxX - u.minX, 0.01), p = Math.max(u.maxY - u.minY, 0.01);
        o.push({
          kind: "shape",
          id: n.nextId++,
          name: v(t),
          x: u.minX - n.ox,
          y: u.minY - n.oy,
          w: h,
          h: p,
          geom: { kind: "custom", paths: [{ cmds: C(c, -u.minX, -u.minY), fill: !1 }] },
          fill: { kind: "none" },
          line: s
        });
      }
    }
    n.report.native++;
  }
  return o.push(...tn(t, i.mid, n, e)), o;
}
function on(t, n) {
  const e = (t.opacity ?? 100) / 100, r = St(t.points), i = U(t, e, !0);
  if (r.length < 2 || !i) return [];
  i.cap = "rnd", i.join = "round";
  const o = r.map((h) => h.x), l = r.map((h) => h.y), f = Math.min(...o), a = Math.min(...l), s = Math.max(Math.max(...o) - f, 0.01), c = Math.max(Math.max(...l) - a, 0.01), u = r.map((h, p) => ({ op: p ? "L" : "M", x: h.x - f, y: h.y - a }));
  return n.report.native++, [{
    kind: "shape",
    id: n.nextId++,
    name: v(t),
    x: t.x + f - n.ox,
    y: t.y + a - n.oy,
    w: s,
    h: c,
    rot: t.angle ? t.angle * 180 / Math.PI : void 0,
    geom: { kind: "custom", paths: [{ cmds: u, fill: !1 }] },
    fill: { kind: "none" },
    line: i
  }];
}
function sn(t, n) {
  const e = (t.opacity ?? 100) / 100;
  if (!(t.text || t.richText && t.richText.length > 0)) return [];
  n.report.native++;
  const i = A(t.backgroundColor, e);
  return [{
    kind: "shape",
    id: n.nextId++,
    name: v(t),
    ...O(t, n),
    textBox: !0,
    geom: { kind: "preset", prst: "rect" },
    fill: i ? { kind: "solid", color: i } : { kind: "none" },
    line: null,
    text: _t(t, e)
  }];
}
const an = (t) => {
  const n = t && /matrix\(([^)]+)\)/.exec(t), e = n ? n[1].split(/[\s,]+/).map(Number) : [];
  return e.length === 6 && e.every(Number.isFinite) ? e : [1, 0, 0, 1, 0, 0];
}, Q = (t, n, e) => ({ x: t[0] * n + t[2] * e + t[4], y: t[1] * n + t[3] * e + t[5] });
function cn(t) {
  const n = Et.generator(), e = (i) => {
    for (const o of n.toPaths(i))
      t.save(), o.fill && o.fill !== "none" && (!o.stroke || o.stroke === "none") ? (t.fillStyle = o.fill, t.fillPath(o.d)) : o.stroke && o.stroke !== "none" && o.strokeWidth > 0 && (t.strokeStyle = o.stroke, t.lineWidth = o.strokeWidth, t.strokePath(o.d)), t.restore();
    return i;
  }, r = { generator: n, draw: e, getDefaultOptions: () => n.defaultOptions };
  for (const i of ["line", "rectangle", "ellipse", "circle", "linearPath", "polygon", "arc", "curve", "path"])
    r[i] = (...o) => e(n[i](...o));
  return r;
}
function ln(t) {
  const n = t.fillStyle, e = {
    ...t,
    renderStyle: "architectural",
    roughness: 0,
    angle: 0,
    flipX: !1,
    flipY: !1,
    opacity: 100,
    containerText: void 0,
    richContainerText: void 0,
    // Hatching is re-created as a pattern fill on the body; recording it would be hundreds of lines.
    fillStyle: W[n] ? "solid" : t.fillStyle
  }, r = new It();
  try {
    const s = document.createElement("canvas");
    Ct(cn(r), s.getContext("2d"), e, !1, 1, r);
  } catch {
    return null;
  }
  if (r.failed) return null;
  const i = /* @__PURE__ */ new Map();
  for (const s of Array.from(r.defs.children)) s.id && i.set(s.id, s);
  const o = (s, c) => {
    const u = i.get(s.replace(/^url\(#|\)$/g, ""));
    if (!u) return null;
    const h = Array.from(u.children).map((p) => ({ pos: +(p.getAttribute("offset") || 0), color: A(p.getAttribute("stop-color")) ?? { hex: "#000000", alpha: 0 } }));
    if (!h.length) return null;
    if (u.tagName.toLowerCase() === "lineargradient") {
      const p = Q(c, +u.getAttribute("x1"), +u.getAttribute("y1")), d = Q(c, +u.getAttribute("x2"), +u.getAttribute("y2"));
      return { kind: "linear", x1: p.x, y1: p.y, x2: d.x, y2: d.y, stops: h };
    }
    return { kind: "radial", x1: 0, y1: 0, x2: 0, y2: 0, stops: h };
  }, l = [];
  let f = "ok";
  const a = (s) => {
    for (const c of Array.from(s.children)) {
      if (f !== "ok") return;
      const u = c.tagName.toLowerCase();
      if (u === "g") {
        if (c.getAttribute("clip-path")) {
          f = "picture";
          return;
        }
        a(c);
        continue;
      }
      if (u === "text" || u === "image") {
        f = "picture";
        return;
      }
      let h = null;
      if (u === "path") h = c.getAttribute("d");
      else if (u === "rect") {
        const b = +c.getAttribute("x"), M = +c.getAttribute("y"), w = +c.getAttribute("width"), S = +c.getAttribute("height");
        h = `M ${b} ${M} L ${b + w} ${M} L ${b + w} ${M + S} L ${b} ${M + S} Z`;
      } else {
        f = "fail";
        return;
      }
      const p = an(c.getAttribute("transform")), d = Xt(P(h || ""), p);
      if (!d.length) continue;
      const x = c.getAttribute("fill"), g = c.getAttribute("stroke"), k = !!x && x.startsWith("url("), m = +(c.getAttribute("fill-opacity") ?? 1), y = +(c.getAttribute("stroke-opacity") ?? 1);
      l.push({
        cmds: d,
        fill: x && x !== "none" && !k ? x : null,
        grad: k ? o(x, p) : null,
        stroke: g && g !== "none" ? g : null,
        fillAlpha: Number.isFinite(m) ? m : 1,
        strokeAlpha: Number.isFinite(y) ? y : 1,
        width: +(c.getAttribute("stroke-width") || 1) * Math.sqrt(Math.abs(p[0] * p[3] - p[1] * p[2])),
        dash: !!c.getAttribute("stroke-dasharray"),
        evenOdd: c.getAttribute("fill-rule") === "evenodd"
      });
    }
  };
  return a(r.root), f === "ok" ? l : f === "picture" ? "picture" : null;
}
const tt = (t, n) => {
  if (!t || !n) return !1;
  const e = T(t), r = T(n);
  return !!e && !!r && e[0] === r[0] && e[1] === r[1] && e[2] === r[2];
};
function fn(t, n, e) {
  const r = t.stops.map((d) => ({ pos: d.pos, color: e < 1 ? { ...d.color, alpha: (d.color.alpha ?? 1) * e } : d.color }));
  if (t.kind === "radial") return { kind: "radial", stops: r };
  const i = t.x2 - t.x1, o = t.y2 - t.y1, l = Math.hypot(i, o);
  if (!(l > 0)) return { kind: "solid", color: r[r.length - 1].color };
  const f = i / l, a = o / l, s = (n.minX + n.maxX) / 2, c = (n.minY + n.maxY) / 2, u = (Math.abs((n.maxX - n.minX) * f) + Math.abs((n.maxY - n.minY) * a)) / 2;
  if (!(u > 0)) return { kind: "solid", color: r[0].color };
  const h = (d) => ((t.x1 + i * d - s) * f + (t.y1 + o * d - c) * a + u) / (2 * u), p = [...r].sort((d, x) => d.pos - x.pos).map((d) => ({ pos: h(d.pos), color: d.color }));
  return { kind: "linear", angle: Math.atan2(o, i) * 180 / Math.PI, stops: dt(p) };
}
function dt(t) {
  if (t.length < 2) return t.map((e) => ({ ...e, pos: Math.max(0, Math.min(1, e.pos)) }));
  const n = (e) => {
    if (e <= t[0].pos) return t[0].color;
    for (let r = 1; r < t.length; r++) {
      const i = t[r - 1], o = t[r];
      if (e <= o.pos) return yn(i.color, o.color, o.pos > i.pos ? (e - i.pos) / (o.pos - i.pos) : 0);
    }
    return t[t.length - 1].color;
  };
  return [{ pos: 0, color: n(0) }, ...t.filter((e) => e.pos > 0 && e.pos < 1), { pos: 1, color: n(1) }];
}
function j(t) {
  if (t.fill === !1) return [t];
  const n = [];
  for (const i of t.cmds)
    (i.op === "M" || !n.length) && n.push([]), n[n.length - 1].push(i);
  if (n.every((i) => i[i.length - 1].op === "Z")) return [t];
  const r = [{ cmds: n.flatMap((i) => i[i.length - 1].op === "Z" ? i : [...i, { op: "Z" }]), fill: t.fill, stroke: !1 }];
  return t.stroke !== !1 && r.push({ cmds: t.cmds, fill: !1, stroke: t.stroke }), r;
}
const E = (t) => JSON.stringify(t.cmds);
function un(t, n) {
  const e = (t.opacity ?? 100) / 100, r = O(t, n), i = ut(t, e);
  let o = Gt(t);
  if (!o) {
    const f = At(t), a = f ? Zt(f, t.width, t.height) : [], s = ln(t);
    if (s === "picture") return null;
    if (s && s.length) {
      const c = Math.min(t.x, t.x + t.width), u = Math.min(t.y, t.y + t.height), h = a.length ? a.filter((m) => m.fill !== !1).map((m) => C(m.cmds, c, u)) : null, p = !!it(t), d = ["linear", "radial", "conic"].includes(t.fillStyle);
      if (!s.every((m) => (!m.grad || d) && m.fillAlpha >= 1 && m.strokeAlpha >= 1 && (!m.fill || tt(m.fill, t.backgroundColor)) && (!m.stroke || tt(m.stroke, t.strokeColor) && Math.abs(m.width - t.strokeWidth) < 0.75 && m.dash === p))) {
        const m = hn(t, s, r, i, n, e, h);
        return m ? [m] : null;
      }
      const g = [], k = (m) => C(m, -c, -u);
      for (let m = 0; m < s.length; m++) {
        const y = s[m], b = s[m + 1], M = !!((y.fill || y.grad) && !y.stroke && b && b.stroke && !b.fill && !b.grad && E(b) === E(y)), w = !!y.stroke || M;
        if (y.fill || y.grad) {
          const S = ht(y, h);
          if (!S) return null;
          S.length === 1 && S[0] === y.cmds ? g.push(...j({ cmds: k(y.cmds), stroke: w ? void 0 : !1 })) : (g.push(...S.map((R) => ({ cmds: k(R), stroke: !1 }))), w && g.push({ cmds: k(y.cmds), fill: !1 }));
        } else
          g.push({ cmds: k(y.cmds), fill: !1, stroke: w ? void 0 : !1 });
        M && m++;
      }
      o = { kind: "custom", paths: g };
    } else if (a.length)
      o = { kind: "custom", paths: a.flatMap(j) };
    else return null;
  }
  const l = {
    kind: "shape",
    id: n.nextId++,
    name: v(t),
    ...r,
    geom: o,
    fill: Ht(t, e),
    line: U(t, e),
    text: i
  };
  return n.ids.set(t.id, { id: l.id, item: l }), n.report.native++, [l];
}
const dn = (t) => t.map((n) => n.op === "Z" ? "Z" : n.op === "C" ? `C ${n.x1} ${n.y1} ${n.x2} ${n.y2} ${n.x} ${n.y}` : `${n.op} ${n.x} ${n.y}`).join(" ");
let B = null;
const F = 28;
function Y(t, n, e) {
  B ??= document.createElement("canvas").getContext("2d");
  const r = [];
  if (!B) return r;
  const i = t.map((o) => new Path2D(dn(o)));
  for (let o = 0; o < F; o++) for (let l = 0; l < F; l++) {
    const f = e.minX + (l + 0.5) / F * (e.maxX - e.minX), a = e.minY + (o + 0.5) / F * (e.maxY - e.minY);
    r.push(i.some((s) => B.isPointInPath(s, f, a, n)));
  }
  return r;
}
const nt = (t, n) => t.reduce((e, r, i) => e + (r !== n[i] ? 1 : 0), 0) / Math.max(1, t.length);
function ht(t, n) {
  if (t.evenOdd) return [t.cmds];
  const e = N(t.cmds);
  if (!e) return [t.cmds];
  const r = Y([t.cmds], "nonzero", e);
  return nt(r, Y([t.cmds], "evenodd", e)) === 0 ? [t.cmds] : n && nt(r, Y(n, "evenodd", e)) <= 0.03 ? n : null;
}
function hn(t, n, e, r, i, o, l) {
  const f = [];
  for (let a = 0; a < n.length; a++) {
    const s = n[a], c = n[a + 1], u = !!((s.fill || s.grad) && !s.stroke && c && c.stroke && !c.fill && !c.grad && E(c) === E(s)), h = u ? c : s, p = N(s.cmds);
    if (!p) continue;
    const d = Math.max(p.maxX - p.minX, 0.01), x = Math.max(p.maxY - p.minY, 0.01), g = A(s.fill, o * s.fillAlpha), k = s.grad ? fn(s.grad, p, o) : g ? { kind: "solid", color: g } : { kind: "none" }, m = A(h.stroke, o * h.strokeAlpha), y = m ? { width: h.width, color: m, dash: h.dash ? "dash" : void 0, join: "round", cap: "rnd" } : null, b = !!(s.fill || s.grad), M = (S) => C(S, -p.minX, -p.minY);
    let w;
    if (b) {
      const S = ht(s, l);
      if (!S) return null;
      w = S.length === 1 && S[0] === s.cmds ? j({ cmds: M(s.cmds), stroke: m ? void 0 : !1 }) : [...S.map((R) => ({ cmds: M(R), stroke: !1 })), ...m ? [{ cmds: M(s.cmds), fill: !1 }] : []];
    } else w = [{ cmds: M(s.cmds), fill: !1, stroke: m ? void 0 : !1 }];
    f.push({
      kind: "shape",
      id: i.nextId++,
      name: `${v(t)} part`,
      x: p.minX - i.ox,
      y: p.minY - i.oy,
      w: d,
      h: x,
      geom: { kind: "custom", paths: w },
      fill: k,
      line: y
    }), u && a++;
  }
  return r && f.push({
    kind: "shape",
    id: i.nextId++,
    name: `${v(t)} label`,
    textBox: !0,
    x: e.x,
    y: e.y,
    w: e.w,
    h: e.h,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: r
  }), i.report.native++, { kind: "group", id: i.nextId++, name: v(t), ...e, children: f };
}
function pn(t, n) {
  if (Kt(t)) return H([t], n, v(t));
  try {
    if (t.type === "chart")
      return n.report.native++, [{ kind: "chart", id: n.nextId++, name: v(t), ...O(t, n), chart: gt(t.chart) }];
    if (t.type === "text" || t.type === "richtext") return sn(t, n);
    if (t.type === "image") return Qt(t, n);
    if (t.type === "line" || t.type === "arrow") return rn(t, n);
    if (Vt.has(t.type)) return on(t, n);
    if (!Jt.has(t.type)) {
      const e = un(t, n);
      if (e) return e;
    }
  } catch {
  }
  return H([t], n, v(t));
}
function pt(t, n, e) {
  const r = [];
  let i = 0;
  const o = (l) => {
    const f = l.groupIds ?? [];
    return f.length > n ? f[f.length - 1 - n] : void 0;
  };
  for (; i < t.length; ) {
    const l = o(t[i]);
    if (!l) {
      let s = pn(t[i], e);
      const c = kn(t[i].link);
      if (c) for (const u of s) u.link = c;
      e.animTargets && t[i].animations?.length && s.length > 1 && (s = [{ kind: "group", id: e.nextId++, name: v(t[i]), ...et(s), children: s }]), e.animTargets && s.length === 1 && e.animTargets.set(t[i].id, s[0].id), r.push(...s), i++;
      continue;
    }
    let f = i;
    for (; f < t.length && o(t[f]) === l; ) f++;
    const a = pt(t.slice(i, f), n + 1, e);
    if (a.length > 1) {
      const s = et(a), c = { kind: "group", id: e.nextId++, name: t[i].groupNames?.[l] || "Group", ...s, children: a };
      if (r.push(c), e.animTargets) for (const u of t.slice(i, f)) e.animTargets.set(u.id, c.id);
    } else r.push(...a);
    i = f;
  }
  return r;
}
function et(t) {
  let n = 1 / 0, e = 1 / 0, r = -1 / 0, i = -1 / 0;
  for (const o of t)
    n = Math.min(n, o.x), e = Math.min(e, o.y), r = Math.max(r, o.x + o.w), i = Math.max(i, o.y + o.h);
  return { x: n, y: e, w: Math.max(0, r - n), h: Math.max(0, i - e) };
}
function mn(t) {
  if (!t || t.type === "none") return;
  const n = t.duration ?? 500;
  switch (t.type) {
    case "fade":
      return { kind: "fade", durationMs: n };
    case "slide-left":
      return { kind: "push", dir: "l", durationMs: n };
    case "slide-right":
      return { kind: "push", dir: "r", durationMs: n };
    case "slide-up":
      return { kind: "push", dir: "u", durationMs: n };
    case "slide-down":
      return { kind: "push", dir: "d", durationMs: n };
    case "zoom-in":
      return { kind: "zoom", zoomIn: !0, durationMs: n };
    case "zoom-out":
      return { kind: "zoom", zoomIn: !1, durationMs: n };
    case "morph":
      return { kind: "morph", durationMs: n };
    default:
      return;
  }
}
function xn(t, n) {
  const e = t.slide;
  if (!e) {
    const f = A(t.background);
    return f ? { kind: "solid", color: f } : void 0;
  }
  const r = e.fillStyle || "solid", i = !e.backgroundImage && (!e.canvasTexture || e.canvasTexture === "none");
  if (i && r === "solid")
    return { kind: "solid", color: A(e.backgroundColor === "transparent" ? "#ffffff" : e.backgroundColor || "#ffffff") ?? { hex: "#ffffff" } };
  if (i && (r === "linear" || r === "radial") && (e.gradientStops?.length ?? 0) > 0) {
    const f = e.gradientDirection || 0, a = e.gradientStops.map((s) => ({ pos: s.offset, color: A(s.color) ?? { hex: "#ffffff" } }));
    return r === "radial" ? { kind: "radial", stops: a } : { kind: "linear", stops: gn(a, f, t.w, t.h), angle: f };
  }
  const o = n.rasterizeBackground?.(e), l = o ? Z(o) : null;
  return l ? { kind: "image", media: l } : { kind: "solid", color: A(e.backgroundColor) ?? { hex: "#ffffff" } };
}
function gn(t, n, e, r) {
  const i = n * Math.PI / 180, o = Math.hypot(e, r) / 2, l = (Math.abs(e * Math.cos(i)) + Math.abs(r * Math.sin(i))) / 2;
  if (!(l > 0) || t.length < 2) return t;
  const f = [...t].sort((a, s) => a.pos - s.pos).map((a) => ({ pos: (-o + 2 * o * a.pos + l) / (2 * l), color: a.color }));
  return dt(f);
}
function yn(t, n, e) {
  const r = T(t.hex), i = T(n.hex), o = [0, 1, 2].map((s) => Math.round(r[s] + (i[s] - r[s]) * e)), l = t.alpha ?? 1, f = n.alpha ?? 1, a = l + (f - l) * e;
  return a < 0.999 ? { hex: L(o), alpha: a } : { hex: L(o) };
}
function kn(t) {
  const n = yt(t);
  if (n.kind === "url") return { kind: "url", url: n.url };
  if (n.kind === "slide") return { kind: "slide", key: n.slideId };
  if (n.kind === "action") return { kind: "action", action: n.action };
}
function bn(t) {
  return {
    ...t?.hidden && { hidden: !0 },
    ...t?.advanceAfter && t.advanceAfter > 0 && { advanceAfterMs: t.advanceAfter },
    ...t?.section && { section: t.section }
  };
}
function An(t, n, e) {
  const r = { ox: t.x, oy: t.y, nextId: 2, ids: /* @__PURE__ */ new Map(), glue: [], hooks: n, report: e, ...t.layers && { animTargets: /* @__PURE__ */ new Map() } }, i = pt(t.elements, 0, r);
  r.glue.forEach((l) => l());
  const o = t.layers && r.animTargets ? Mn(t.elements, t.layers, r.animTargets, e) : [];
  return {
    name: t.name,
    items: i,
    background: xn(t, n),
    transition: mn(t.slide?.transition),
    notes: t.slide?.notes?.trim() ? t.slide.notes : void 0,
    key: t.slide?.id,
    ...bn(t.slide),
    ...o.length && { anims: o }
  };
}
function Mn(t, n, e, r) {
  const i = xt(t.filter((a) => !a.id.includes("@page")), n), o = [];
  let l = 0;
  for (const a of i) {
    const s = a.animation.trigger;
    if (s === "with-prev" || s === "after-prev") {
      const c = o[o.length - 1];
      !c || c.skip ? l++ : c.steps.push(a);
    } else s === "on-load" || s === "on-click" ? o.push({ load: s === "on-load", skip: !1, steps: [a] }) : (o.push({ load: !1, skip: !0, steps: [] }), l++);
  }
  const f = [];
  for (const a of [...o.filter((s) => s.load && !s.skip), ...o.filter((s) => !s.load && !s.skip)]) {
    const s = /* @__PURE__ */ new Set();
    a.steps.forEach((c, u) => {
      const h = e.get(c.elementId), p = u === 0 ? a.load ? "with" : "click" : c.animation.trigger === "after-prev" ? "after" : "with", d = h !== void 0 ? Rt(c.animation, h, p) : null;
      if (!d) {
        l++;
        return;
      }
      const x = `${h}|${d.cls}|${d.effect}`;
      s.has(x) || (s.add(x), f.push(d));
    });
  }
  return l && (r.animsSkipped = (r.animsSkipped ?? 0) + l), f;
}
function $n(t, n, e, r) {
  const i = Math.min(e / Math.max(t, 1), r / Math.max(n, 1));
  return { scale: i, dx: (e - t * i) / 2, dy: (r - n * i) / 2 };
}
export {
  $n as fitInto,
  Z as mediaOf,
  An as pageToSlide,
  gn as remapPageStops,
  bn as showFields,
  A as toColor,
  mn as transitionOf,
  ot as typefaceOf
};
