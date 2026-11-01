import { a5 as pt, a6 as Tt, a7 as Rt, a1 as zt, a8 as Ft, a9 as Pt, aa as Lt, ab as Et, ac as Ot, ad as Xt, ae as Bt, af as Dt, ag as Ht, ah as Wt, ai as Yt, aj as ot, ak as jt, al as Nt, am as Ut, an as _t, ao as Zt, ap as Vt, aq as Gt, ar as qt, as as Jt, at as Kt, au as Qt, av as tn, aw as nn, ax as en } from "./index-CBVjKX8o.js";
import { t as rn } from "./anim-map-D7T1mIAM.js";
import { d as W, g as K, t as O, h as on } from "./custgeom-BD5l_5dV.js";
function sn(t) {
  const { l: n, c: e, h: r } = t, i = r * Math.PI / 180, o = e * Math.cos(i), c = e * Math.sin(i), f = n + 0.3963377774 * o + 0.2158037573 * c, a = n - 0.1055613458 * o - 0.0638541728 * c, s = n - 0.0894841775 * o - 1.291485548 * c, l = f * f * f, u = a * a * a, h = s * s * s, p = 1.2270138511 * l - 0.5577999807 * u + 0.2812561489 * h, d = -0.0405801784 * l + 1.1122568696 * u - 0.0716766787 * h, x = -0.0763812845 * l - 0.4214819787 * u + 1.5861632204 * h, y = 2.4039459 * p - 0.9898517 * d - 0.4141151 * x, w = -0.7797967 * p + 1.5445214 * d + 0.0352745 * x, m = 0.0384795 * p - 0.1141381 * d + 1.0756786 * x, k = (M) => {
    const C = Math.abs(M), S = C > 31308e-7 ? 1.055 * Math.pow(C, 1 / 2.4) - 0.055 : 12.92 * C;
    return M < 0 ? -S : S;
  };
  return {
    r: k(y),
    g: k(w),
    b: k(m)
  };
}
function U(t) {
  const n = Math.abs(t), e = n > 31308e-7 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : 12.92 * n;
  return t < 0 ? -e : e;
}
function _(t) {
  const n = Math.abs(t), e = n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
  return t < 0 ? -e : e;
}
function it(t, n, e) {
  const r = _(t), i = _(n), o = _(e);
  return {
    r: U(1.2249401762805083 * r - 0.2249401762805082 * i),
    g: U(-0.04205697751522136 * r + 1.0420569775152215 * i),
    b: U(-0.019637554590334 * r - 0.07863604555063188 * i + 1.0982736001409656 * o)
  };
}
function an(t) {
  return t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
}
function X(t) {
  if (!t) return null;
  const n = String(t).trim().toLowerCase();
  if (!n || n === "transparent" || n === "none" || n === "currentcolor") return null;
  if (n[0] === "#") {
    let o = n.slice(1);
    return (o.length === 3 || o.length === 4) && (o = o.slice(0, 3).split("").map((c) => c + c).join("")), o.length === 8 && (o = o.slice(0, 6)), /^[0-9a-f]{6}$/.test(o) ? [parseInt(o.slice(0, 2), 16), parseInt(o.slice(2, 4), 16), parseInt(o.slice(4, 6), 16)] : null;
  }
  const e = (o) => Math.round(Math.max(0, Math.min(1, o)) * 255), r = n.match(/^color\(\s*(display-p3|srgb)\s+([^/)]+?)\s*(?:\/[^)]*)?\)$/);
  if (r) {
    const o = r[2].split(/[\s,]+/).filter(Boolean).map(an);
    if (o.length < 3 || o.some((l) => !isFinite(l))) return null;
    const [c, f, a] = o;
    if (r[1] === "srgb") return [e(c), e(f), e(a)];
    const s = it(c, f, a);
    return [e(s.r), e(s.g), e(s.b)];
  }
  const i = n.match(/^oklch\(\s*([^/)]+?)\s*(?:\/[^)]*)?\)$/);
  if (i) {
    const o = i[1].split(/[\s,]+/).filter(Boolean);
    if (o.length < 3) return null;
    const c = o[0].endsWith("%") ? parseFloat(o[0]) / 100 : parseFloat(o[0]), f = parseFloat(o[1]), a = parseFloat(o[2]);
    if (![c, f, a].every(isFinite)) return null;
    const s = it(...(({ r: l, g: u, b: h }) => [l, u, h])(sn({ l: c, c: f, h: a })));
    return [e(s.r), e(s.g), e(s.b)];
  }
  return ln(n);
}
const D = /* @__PURE__ */ new Map();
let z;
function ln(t) {
  if (D.has(t)) return D.get(t);
  let n = null;
  try {
    if (z === void 0) {
      const e = typeof document < "u" ? document.createElement("canvas") : null;
      z = e ? e.getContext("2d", { willReadFrequently: !0 }) : null, z && (z.canvas.width = 1, z.canvas.height = 1);
    }
    if (z && (z.fillStyle = "#000000", z.fillStyle = t, z.fillStyle !== "#000000" || t === "#000000" || t === "black")) {
      z.clearRect(0, 0, 1, 1), z.fillRect(0, 0, 1, 1);
      const e = z.getImageData(0, 0, 1, 1).data;
      n = [e[0], e[1], e[2]];
    }
  } catch {
    n = null;
  }
  return D.size < 512 && D.set(t, n), n;
}
const Y = (t) => "#" + t.map((n) => n.toString(16).padStart(2, "0")).join("");
function cn(t) {
  const n = t.trim().toLowerCase(), e = n.match(/^#([0-9a-f]{8})$/);
  if (e) return parseInt(e[1].slice(6), 16) / 255;
  const r = n.match(/^#([0-9a-f]{4})$/);
  if (r) return parseInt(r[1][3] + r[1][3], 16) / 255;
  const i = n.match(/^(?:rgba?|hsla?)\(([^)]*)\)$/);
  if (i) {
    const c = i[1].split(/[\s,/]+/).filter(Boolean);
    if (c.length >= 4) return st(c[3]);
  }
  const o = n.match(/\/\s*([\d.]+%?)\s*\)$/);
  return o ? st(o[1]) : 1;
}
const st = (t) => {
  const n = t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
};
function I(t, n = 1) {
  if (!t) return null;
  const e = X(t);
  if (!e) return null;
  const r = cn(t) * n;
  return r <= 0 ? null : r < 0.999 ? { hex: Y(e), alpha: r } : { hex: Y(e) };
}
const mt = (t) => Tt(t).split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Calibri", G = {
  hachure: "ltUpDiag",
  zigzag: "ltUpDiag",
  "zigzag-line": "ltUpDiag",
  dashed: "dashUpDiag",
  "cross-hatch": "diagCross",
  dots: "pct20"
};
function fn(t, n) {
  const e = t.fillStyle || "solid";
  if ((e === "linear" || e === "radial" || e === "conic") && (t.gradientStops?.length ?? 0) > 0) {
    const i = t.gradientStops.map((o) => ({ pos: Math.max(0, Math.min(1, o.offset)), color: I(o.color, n) ?? { hex: "#000000", alpha: 0 } }));
    return e === "linear" ? { kind: "linear", stops: i, angle: t.gradientDirection ?? 45, scaled: !0 } : { kind: "radial", stops: i };
  }
  const r = I(t.backgroundColor, n);
  return r ? G[e] ? { kind: "pattern", preset: G[e], color: r } : { kind: "solid", color: r } : { kind: "none" };
}
function gt(t) {
  if (t.strokeStyle === "dotted") return "sysDot";
  if (t.strokeStyle === "dashed") return "dash";
  if (Array.isArray(t.strokeDashArray) && t.strokeDashArray.length >= 2) {
    const [n] = t.strokeDashArray;
    return n <= (t.strokeWidth || 2) * 1.5 ? "sysDot" : "dash";
  }
}
function N(t, n, e = !1) {
  const r = I(t.strokeColor, n);
  if (!r || !(t.strokeWidth > 0)) return null;
  const i = t.strokeLineCap === "butt" ? "flat" : t.strokeLineCap === "square" ? "sq" : "rnd";
  return {
    width: t.strokeWidth,
    color: r,
    dash: gt(t),
    cap: e ? i : void 0,
    join: t.strokeLineJoin === "miter" ? "miter" : t.strokeLineJoin === "bevel" ? "bevel" : "round"
  };
}
function at(t, n, e) {
  if (!t) return;
  const r = n / Math.max(e, 0.5), i = r <= 2.5 ? "sm" : r <= 4 ? "med" : "lg";
  return { type: t === "triangle" ? "triangle" : t === "dot" || t === "circle" ? "oval" : t === "diamond" || t === "diamondFilled" ? "diamond" : "arrow", size: i };
}
const Q = (t, n) => t === "center" ? "ctr" : t === "right" ? "r" : t === "left" ? "l" : n, xt = (t) => t === "top" ? "t" : t === "bottom" ? "b" : "ctr";
function tt(t, n) {
  return t.split(`
`).map((e) => ({ runs: e ? [{ text: e }] : [], align: n }));
}
function un(t) {
  const n = { "lower-alpha": "alphaLc", "upper-alpha": "alphaUc", "lower-roman": "romanLc", "upper-roman": "romanUc" }[t.listNumberStyle ?? ""] ?? "arabic", e = { paren: "ParenR", parens: "ParenBoth", none: "Plain" }[t.listNumberSuffix ?? ""] ?? "Period";
  return n + e;
}
let E;
function dn(t, n) {
  if (E === void 0 && (E = typeof document < "u" ? document.createElement("canvas").getContext("2d") : null), E)
    return E.font = n, E.measureText(t).width;
  const e = Number(/(\d+(?:\.\d+)?)px/.exec(n)?.[1] ?? 16);
  return t.length * e * 0.6;
}
function hn(t, n, e, r) {
  const i = t.listLevel || 0, o = { bullet: t.listType === "ordered" ? "num" : "char", level: i };
  if (o.bullet === "num") {
    const a = un(t);
    a !== "arabicPeriod" && (o.numType = a), !(e && e.level === i && e.scheme === a && (t.listIndex || 1) === e.index + 1) && (t.listIndex || 1) > 1 && (o.startAt = t.listIndex);
  } else t.listMarker && t.listMarker !== "•" && (o.bulletChar = t.listMarker);
  if (t.listMarkerColor) {
    const a = I(t.listMarkerColor, n);
    a && (o.bulletColor = a);
  }
  t.listMarkerScale && t.listMarkerScale !== 1 && (o.bulletScale = t.listMarkerScale);
  const c = en(t), f = r(t);
  return o.marL = f, o.indent = c - f, o;
}
function yt(t, n, e, r) {
  const i = [];
  let o = { runs: [], align: n }, c = !1, f = null;
  const a = tn(dn, t, r), s = () => {
    i.push(o), o = { runs: [], align: n }, c = !1;
  };
  for (const l of t)
    String(l.text ?? "").split(`
`).forEach((h, p) => {
      if (p > 0 && s(), l.fontSize && !c && (o.endSize = l.fontSize), !h) return;
      c || (c = !0, l.paragraphSpaceBefore && (o.spaceBefore = l.paragraphSpaceBefore), l.paragraphAlign && (o.align = Q(l.paragraphAlign, n ?? "l")), l.listType && l.listType !== "none" && Object.assign(o, hn(l, e, f, a)), f = o.bullet === "num" ? { level: o.level ?? 0, scheme: o.numType ?? "arabicPeriod", index: l.listIndex || 1 } : null);
      const d = { text: h };
      if (l.bold && (d.bold = !0), l.italic && (d.italic = !0), l.underline && (d.underline = !0), l.strikethrough && (d.strike = !0), l.color) {
        const x = I(l.color, e);
        x && (d.color = x);
      }
      l.fontSize && (d.size = l.fontSize), l.fontFamily && (d.font = mt(l.fontFamily)), o.runs.push(d);
    });
  return s(), i;
}
function nt(t, n, e) {
  const r = I(t.textColor || t.strokeColor || "#000000", n) ?? void 0;
  return {
    size: e,
    color: r,
    font: mt(t.fontFamily),
    bold: _t(t.fontWeight) >= 600 ? !0 : void 0,
    italic: Ut(t.fontStyle) === "italic" ? !0 : void 0
  };
}
const kt = (t) => Kt(t) / Qt;
function pn(t, n) {
  const e = t.richText && t.richText.length > 0, r = Q(t.textAlign, e ? "ctr" : "l");
  return {
    paragraphs: e ? yt(t.richText, r, n, { fontSize: t.fontSize || 20, fontFamily: t.fontFamily || "sans-serif" }) : tt(t.text || "", r),
    anchor: xt(t.verticalAlign),
    insets: { l: 4, t: 4, r: 4, b: 4 },
    wrap: !t.autoResize,
    lineSpacing: kt(t),
    defaults: nt(t, n, t.fontSize || 20)
  };
}
function bt(t, n) {
  const e = t.richContainerText && t.richContainerText.length > 0;
  if (!e && !t.containerText) return;
  const r = Q(t.textAlign, "ctr");
  return {
    paragraphs: e ? yt(t.richContainerText, r, n, { fontSize: t.fontSize || 28, fontFamily: t.fontFamily || "hand-drawn" }) : tt(t.containerText, r),
    anchor: xt(t.verticalAlign),
    insets: { l: 10, t: 4, r: 10, b: 4 },
    wrap: !0,
    lineSpacing: kt(t),
    defaults: nt(t, n, t.fontSize || 16)
  };
}
function mn(t, n, e) {
  const r = [], i = Math.abs(n) / 2, o = Math.abs(e) / 2, c = (a, s, l) => {
    const u = O(W(a), i, o);
    if (u.length === 0) return;
    const h = s, p = { fill: h.noFill ? !1 : void 0, stroke: h.noStroke ? !1 : void 0 };
    if (l) {
      r.push({ cmds: u, ...p });
      return;
    }
    let d = [];
    for (const x of u)
      x.op === "M" && d.length && (r.push({ cmds: d, ...p }), d = []), d.push(x);
    d.length && r.push({ cmds: d, ...p });
  }, f = (a) => {
    const s = (l) => Math.round(l * 1e3) / 1e3;
    switch (a.type) {
      case "rect": {
        const l = Math.min(Math.abs(a.w), Math.abs(a.h)) / 2, [u, h, p, d] = (Array.isArray(a.r) ? a.r : [a.r || 0, a.r || 0, a.r || 0, a.r || 0]).map((M) => Math.max(0, Math.min(M || 0, l))), x = (M, C, S) => M ? ` A ${s(M)} ${s(M)} 0 0 1 ${s(C)} ${s(S)}` : "", { x: y, y: w } = a, m = a.w, k = a.h;
        c(`M ${y + u} ${w} H ${y + m - h}${x(h, y + m, w + h)} V ${w + k - p}${x(p, y + m - p, w + k)} H ${y + d}${x(d, y, w + k - d)} V ${w + u}${x(u, y + u, w)} Z`, a, !1);
        break;
      }
      case "ellipse":
        c(`M ${a.cx - a.rx} ${a.cy} A ${a.rx} ${a.ry} 0 1 0 ${a.cx + a.rx} ${a.cy} A ${a.rx} ${a.ry} 0 1 0 ${a.cx - a.rx} ${a.cy} Z`, a, !1);
        break;
      case "points":
        a.points.length >= 2 && c(`M ${a.points.map((l) => `${l.x} ${l.y}`).join(" L ")}${a.isClosed !== !1 ? " Z" : ""}`, a, !1);
        break;
      case "path":
        c(a.path, a, !!a.evenOdd);
        break;
      case "multi":
        a.shapes.forEach(f);
        break;
    }
  };
  return f(t), r;
}
function gn(t) {
  if (t.warp || t.points && t.points.length) return null;
  if (t.type === "circle") return { kind: "preset", prst: "ellipse" };
  if (t.type === "rectangle") {
    const [n, e, r, i] = Zt(t);
    if (!n && !e && !r && !i) return { kind: "preset", prst: "rect" };
    if (n === e && e === r && r === i) {
      const o = Math.min(Math.abs(t.width), Math.abs(t.height));
      return o > 0 ? { kind: "preset", prst: "roundRect", adj: { adj: Math.min(5e4, n / o * 1e5) } } : null;
    }
  }
  return null;
}
const xn = /* @__PURE__ */ new Set(["umlClass", "umlInterface", "qrCode", "video", "codeBlock"]), yn = /* @__PURE__ */ new Set(["fineliner", "inkbrush", "marker", "ink"]), kn = /* @__PURE__ */ new Set(["text", "richtext", "image", "line", "arrow"]);
function bn(t) {
  const n = t;
  if (xn.has(t.type) || t.clipMaskId || t.shadowEnabled || t.glowEnabled || (t.featherRadius ?? 0) > 0 || t.blendMode && t.blendMode !== "normal" || t.shearX || t.shearY || Pt(t) || Lt(t) || Et(t) || Ot(t) || t.appearance && (t.appearance.fills?.length ?? 0) + (t.appearance.strokes?.length ?? 0) > 0) return !0;
  const e = t.fillStyle;
  if (e === "image" || e === "mesh" || e === "pattern" || t.backgroundImage || t.curvedText || (t.type === "text" || t.type === "richtext") && (t.verticalText || (n.charTransforms?.length ?? 0) > 0)) return !0;
  if (t.type === "image") {
    if (t.warp || t.pixelEffect) return !0;
    const r = t;
    if ((r.filterBrightness ?? 100) !== 100 || (r.filterContrast ?? 100) !== 100 || (r.filterSaturate ?? 100) !== 100 || (r.filterBlur ?? 0) || (r.filterHueRotate ?? 0) || (r.filterInvert ?? 0) || (r.filterSepia ?? 0) || (r.filterGrayscale ?? 0)) return !0;
  }
  return !1;
}
function lt(t) {
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
function et(t) {
  if (!t) return null;
  const n = lt(t);
  if (n && n.mime === "image/png") return { bytes: n.bytes, ext: "png" };
  if (n && (n.mime === "image/jpeg" || n.mime === "image/jpg")) return { bytes: n.bytes, ext: "jpeg" };
  if (n && n.mime === "image/gif") return { bytes: n.bytes, ext: "gif" };
  const e = pt(t);
  if (!e || !e.naturalWidth) return null;
  try {
    const r = document.createElement("canvas");
    r.width = e.naturalWidth, r.height = e.naturalHeight, r.getContext("2d").drawImage(e, 0, 0);
    const i = lt(r.toDataURL("image/png"));
    return i ? { bytes: i.bytes, ext: "png" } : null;
  } catch {
    return null;
  }
}
const T = (t) => t.name || t.type;
function B(t, n) {
  const e = Math.abs(t.width), r = Math.abs(t.height), i = Math.min(t.x, t.x + t.width) - n.ox, o = Math.min(t.y, t.y + t.height) - n.oy;
  return { x: i, y: o, w: e, h: r, rot: t.angle ? t.angle * 180 / Math.PI : void 0, flipH: !!t.flipX || void 0, flipV: !!t.flipY || void 0 };
}
function q(t, n, e) {
  const r = n.hooks.rasterize(t), i = r ? et(r.dataURL) : null;
  return !r || !i ? [] : (n.report.pictures++, [{ kind: "picture", id: n.nextId++, name: e, x: r.x - n.ox, y: r.y - n.oy, w: r.width, h: r.height, media: i }]);
}
function wn(t, n) {
  const e = et(t.dataURL);
  if (!e) return q([t], n, T(t));
  let r;
  if (t.crop) {
    const o = t.dataURL ? pt(t.dataURL) : null, c = o?.naturalWidth, f = o?.naturalHeight;
    if (c && f) {
      const a = t.crop;
      r = { l: a.x / c, t: a.y / f, r: 1 - (a.x + a.width) / c, b: 1 - (a.y + a.height) / f };
    }
  }
  const i = (t.opacity ?? 100) / 100;
  return n.report.native++, [{ kind: "picture", id: n.nextId++, name: T(t), ...B(t, n), media: e, crop: r, alpha: i < 1 ? i : void 0, descr: t.altText }];
}
function Mn(t, n, e, r) {
  const i = bt(t, r);
  if (!i) return [];
  const o = t.fontSize || 16, c = (t.containerText || "").split(`
`), f = Math.max(1, ...c.map((l) => l.length)), a = Math.max(40, f * o * 0.6 + 24), s = Math.max(o * 1.6, c.length * o * 1.25 + 8);
  return i.wrap = !1, i.anchor = "ctr", i.paragraphs.forEach((l) => {
    l.align = "ctr";
  }), [{
    kind: "shape",
    id: e.nextId++,
    name: `${T(t)} label`,
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
function vn(t, n, e) {
  const r = t.x + t.w / 2, i = t.y + t.h / 2, o = (t.rot || 0) * Math.PI / 180, c = [[0, -t.h / 2], [-t.w / 2, 0], [0, t.h / 2], [t.w / 2, 0]], f = n.x - e.ox, a = n.y - e.oy;
  for (let s = 0; s < 4; s++) {
    let [l, u] = c[s];
    t.flipH && (l = -l), t.flipV && (u = -u);
    const h = r + l * Math.cos(o) - u * Math.sin(o), p = i + l * Math.sin(o) + u * Math.cos(o);
    if (Math.hypot(h - f, p - a) <= 2) return s;
  }
  return -1;
}
function Cn(t, n, e) {
  const r = e.x - n.x, i = e.y - n.y, o = Math.hypot(r, i);
  if (!(o > 0)) return !1;
  const c = (s, l) => Math.abs((s - n.x) * i - (l - n.y) * r) / o, f = (s, l) => ((s - n.x) * r + (l - n.y) * i) / (o * o), a = (s, l) => c(s, l) <= 0.5 && f(s, l) >= -0.01 && f(s, l) <= 1.01;
  return t.every((s) => s.op === "Z" ? !1 : s.op === "C" ? a(s.x1, s.y1) && a(s.x2, s.y2) && a(s.x, s.y) : a(s.x, s.y));
}
function An(t, n) {
  const e = (t.opacity ?? 100) / 100, r = N(t, e, !0), i = Yt(t), o = [];
  if (r) {
    const c = t.type === "arrow", f = c ? t.startArrowhead : null, a = c ? t.endArrowhead || (t.startArrowhead ? null : "arrow") : null, s = { ...r, head: at(f, ot(t, "start"), t.strokeWidth), tail: at(a, ot(t, "end"), t.strokeWidth) };
    if (!i.d || Cn(W(i.d), i.start, i.end)) {
      const { start: l, end: u } = i, h = {
        kind: "connector",
        id: n.nextId++,
        name: T(t),
        x: Math.min(l.x, u.x) - n.ox,
        y: Math.min(l.y, u.y) - n.oy,
        w: Math.abs(u.x - l.x),
        h: Math.abs(u.y - l.y),
        flipH: u.x < l.x || void 0,
        flipV: u.y < l.y || void 0,
        geom: { kind: "preset", prst: "straightConnector1" },
        line: s
      }, p = (d, x) => {
        const y = d?.elementId ? n.ids.get(d.elementId) : void 0;
        if (!y) return;
        const w = vn(y.item, x, n);
        return w >= 0 ? { id: y.id, idx: w } : void 0;
      };
      n.glue.push(() => {
        h.start = p(t.startBinding, l), h.end = p(t.endBinding, u);
      }), o.push(h);
    } else {
      const l = W(i.d), u = K(l);
      if (u) {
        const h = Math.max(u.maxX - u.minX, 0.01), p = Math.max(u.maxY - u.minY, 0.01);
        o.push({
          kind: "shape",
          id: n.nextId++,
          name: T(t),
          x: u.minX - n.ox,
          y: u.minY - n.oy,
          w: h,
          h: p,
          geom: { kind: "custom", paths: [{ cmds: O(l, -u.minX, -u.minY), fill: !1 }] },
          fill: { kind: "none" },
          line: s
        });
      }
    }
    n.report.native++;
  }
  return o.push(...Mn(t, i.mid, n, e)), o;
}
function Sn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = jt(t.points), i = N(t, e, !0);
  if (r.length < 2 || !i) return [];
  i.cap = "rnd", i.join = "round";
  const o = r.map((h) => h.x), c = r.map((h) => h.y), f = Math.min(...o), a = Math.min(...c), s = Math.max(Math.max(...o) - f, 0.01), l = Math.max(Math.max(...c) - a, 0.01), u = r.map((h, p) => ({ op: p ? "L" : "M", x: h.x - f, y: h.y - a }));
  return n.report.native++, [{
    kind: "shape",
    id: n.nextId++,
    name: T(t),
    x: t.x + f - n.ox,
    y: t.y + a - n.oy,
    w: s,
    h: l,
    rot: t.angle ? t.angle * 180 / Math.PI : void 0,
    geom: { kind: "custom", paths: [{ cmds: u, fill: !1 }] },
    fill: { kind: "none" },
    line: i
  }];
}
function In(t, n) {
  const e = (t.opacity ?? 100) / 100;
  if (!(t.text || t.richText && t.richText.length > 0)) return [];
  n.report.native++;
  const i = I(t.backgroundColor, e);
  return [{
    kind: "shape",
    id: n.nextId++,
    name: T(t),
    ...B(t, n),
    textBox: !0,
    geom: { kind: "preset", prst: "rect" },
    fill: i ? { kind: "solid", color: i } : { kind: "none" },
    line: null,
    text: pn(t, e)
  }];
}
const $n = (t) => {
  const n = t && /matrix\(([^)]+)\)/.exec(t), e = n ? n[1].split(/[\s,]+/).map(Number) : [];
  return e.length === 6 && e.every(Number.isFinite) ? e : [1, 0, 0, 1, 0, 0];
}, ct = (t, n, e) => ({ x: t[0] * n + t[2] * e + t[4], y: t[1] * n + t[3] * e + t[5] });
function Tn(t) {
  const n = nn.generator(), e = (i) => {
    for (const o of n.toPaths(i))
      t.save(), o.fill && o.fill !== "none" && (!o.stroke || o.stroke === "none") ? (t.fillStyle = o.fill, t.fillPath(o.d)) : o.stroke && o.stroke !== "none" && o.strokeWidth > 0 && (t.strokeStyle = o.stroke, t.lineWidth = o.strokeWidth, t.strokePath(o.d)), t.restore();
    return i;
  }, r = { generator: n, draw: e, getDefaultOptions: () => n.defaultOptions };
  for (const i of ["line", "rectangle", "ellipse", "circle", "linearPath", "polygon", "arc", "curve", "path"])
    r[i] = (...o) => e(n[i](...o));
  return r;
}
function Rn(t) {
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
    fillStyle: G[n] ? "solid" : t.fillStyle
  }, r = new Vt();
  try {
    const s = document.createElement("canvas");
    Gt(Tn(r), s.getContext("2d"), e, !1, 1, r);
  } catch {
    return null;
  }
  if (r.failed) return null;
  const i = /* @__PURE__ */ new Map();
  for (const s of Array.from(r.defs.children)) s.id && i.set(s.id, s);
  const o = (s, l) => {
    const u = i.get(s.replace(/^url\(#|\)$/g, ""));
    if (!u) return null;
    const h = Array.from(u.children).map((p) => ({ pos: +(p.getAttribute("offset") || 0), color: I(p.getAttribute("stop-color")) ?? { hex: "#000000", alpha: 0 } }));
    if (!h.length) return null;
    if (u.tagName.toLowerCase() === "lineargradient") {
      const p = ct(l, +u.getAttribute("x1"), +u.getAttribute("y1")), d = ct(l, +u.getAttribute("x2"), +u.getAttribute("y2"));
      return { kind: "linear", x1: p.x, y1: p.y, x2: d.x, y2: d.y, stops: h };
    }
    return { kind: "radial", x1: 0, y1: 0, x2: 0, y2: 0, stops: h };
  }, c = [];
  let f = "ok";
  const a = (s) => {
    for (const l of Array.from(s.children)) {
      if (f !== "ok") return;
      const u = l.tagName.toLowerCase();
      if (u === "g") {
        if (l.getAttribute("clip-path")) {
          f = "picture";
          return;
        }
        a(l);
        continue;
      }
      if (u === "text" || u === "image") {
        f = "picture";
        return;
      }
      let h = null;
      if (u === "path") h = l.getAttribute("d");
      else if (u === "rect") {
        const M = +l.getAttribute("x"), C = +l.getAttribute("y"), S = +l.getAttribute("width"), $ = +l.getAttribute("height");
        h = `M ${M} ${C} L ${M + S} ${C} L ${M + S} ${C + $} L ${M} ${C + $} Z`;
      } else {
        f = "fail";
        return;
      }
      const p = $n(l.getAttribute("transform")), d = on(W(h || ""), p);
      if (!d.length) continue;
      const x = l.getAttribute("fill"), y = l.getAttribute("stroke"), w = !!x && x.startsWith("url("), m = +(l.getAttribute("fill-opacity") ?? 1), k = +(l.getAttribute("stroke-opacity") ?? 1);
      c.push({
        cmds: d,
        fill: x && x !== "none" && !w ? x : null,
        grad: w ? o(x, p) : null,
        stroke: y && y !== "none" ? y : null,
        fillAlpha: Number.isFinite(m) ? m : 1,
        strokeAlpha: Number.isFinite(k) ? k : 1,
        width: +(l.getAttribute("stroke-width") || 1) * Math.sqrt(Math.abs(p[0] * p[3] - p[1] * p[2])),
        dash: !!l.getAttribute("stroke-dasharray"),
        evenOdd: l.getAttribute("fill-rule") === "evenodd"
      });
    }
  };
  return a(r.root), f === "ok" ? c : f === "picture" ? "picture" : null;
}
const ft = (t, n) => {
  if (!t || !n) return !1;
  const e = X(t), r = X(n);
  return !!e && !!r && e[0] === r[0] && e[1] === r[1] && e[2] === r[2];
};
function zn(t, n, e) {
  const r = t.stops.map((d) => ({ pos: d.pos, color: e < 1 ? { ...d.color, alpha: (d.color.alpha ?? 1) * e } : d.color }));
  if (t.kind === "radial") return { kind: "radial", stops: r };
  const i = t.x2 - t.x1, o = t.y2 - t.y1, c = Math.hypot(i, o);
  if (!(c > 0)) return { kind: "solid", color: r[r.length - 1].color };
  const f = i / c, a = o / c, s = (n.minX + n.maxX) / 2, l = (n.minY + n.maxY) / 2, u = (Math.abs((n.maxX - n.minX) * f) + Math.abs((n.maxY - n.minY) * a)) / 2;
  if (!(u > 0)) return { kind: "solid", color: r[0].color };
  const h = (d) => ((t.x1 + i * d - s) * f + (t.y1 + o * d - l) * a + u) / (2 * u), p = [...r].sort((d, x) => d.pos - x.pos).map((d) => ({ pos: h(d.pos), color: d.color }));
  return { kind: "linear", angle: Math.atan2(o, i) * 180 / Math.PI, stops: wt(p) };
}
function wt(t) {
  if (t.length < 2) return t.map((e) => ({ ...e, pos: Math.max(0, Math.min(1, e.pos)) }));
  const n = (e) => {
    if (e <= t[0].pos) return t[0].color;
    for (let r = 1; r < t.length; r++) {
      const i = t[r - 1], o = t[r];
      if (e <= o.pos) return Hn(i.color, o.color, o.pos > i.pos ? (e - i.pos) / (o.pos - i.pos) : 0);
    }
    return t[t.length - 1].color;
  };
  return [{ pos: 0, color: n(0) }, ...t.filter((e) => e.pos > 0 && e.pos < 1), { pos: 1, color: n(1) }];
}
function J(t) {
  if (t.fill === !1) return [t];
  const n = [];
  for (const i of t.cmds)
    (i.op === "M" || !n.length) && n.push([]), n[n.length - 1].push(i);
  if (n.every((i) => i[i.length - 1].op === "Z")) return [t];
  const r = [{ cmds: n.flatMap((i) => i[i.length - 1].op === "Z" ? i : [...i, { op: "Z" }]), fill: t.fill, stroke: !1 }];
  return t.stroke !== !1 && r.push({ cmds: t.cmds, fill: !1, stroke: t.stroke }), r;
}
const j = (t) => JSON.stringify(t.cmds);
function Fn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = B(t, n), i = bt(t, e);
  let o = gn(t);
  if (!o) {
    const f = Nt(t), a = f ? mn(f, t.width, t.height) : [], s = Rn(t);
    if (s === "picture") return null;
    if (s && s.length) {
      const l = Math.min(t.x, t.x + t.width), u = Math.min(t.y, t.y + t.height), h = a.length ? a.filter((m) => m.fill !== !1).map((m) => O(m.cmds, l, u)) : null, p = !!gt(t), d = ["linear", "radial", "conic"].includes(t.fillStyle);
      if (!s.every((m) => (!m.grad || d) && m.fillAlpha >= 1 && m.strokeAlpha >= 1 && (!m.fill || ft(m.fill, t.backgroundColor)) && (!m.stroke || ft(m.stroke, t.strokeColor) && Math.abs(m.width - t.strokeWidth) < 0.75 && m.dash === p))) {
        const m = Ln(t, s, r, i, n, e, h);
        return m ? [m] : null;
      }
      const y = [], w = (m) => O(m, -l, -u);
      for (let m = 0; m < s.length; m++) {
        const k = s[m], M = s[m + 1], C = !!((k.fill || k.grad) && !k.stroke && M && M.stroke && !M.fill && !M.grad && j(M) === j(k)), S = !!k.stroke || C;
        if (k.fill || k.grad) {
          const $ = Mt(k, h);
          if (!$) return null;
          $.length === 1 && $[0] === k.cmds ? y.push(...J({ cmds: w(k.cmds), stroke: S ? void 0 : !1 })) : (y.push(...$.map((L) => ({ cmds: w(L), stroke: !1 }))), S && y.push({ cmds: w(k.cmds), fill: !1 }));
        } else
          y.push({ cmds: w(k.cmds), fill: !1, stroke: S ? void 0 : !1 });
        C && m++;
      }
      o = { kind: "custom", paths: y };
    } else if (a.length)
      o = { kind: "custom", paths: a.flatMap(J) };
    else return null;
  }
  const c = {
    kind: "shape",
    id: n.nextId++,
    name: T(t),
    ...r,
    geom: o,
    fill: fn(t, e),
    line: N(t, e),
    text: i
  };
  return n.ids.set(t.id, { id: c.id, item: c }), n.report.native++, [c];
}
const Pn = (t) => t.map((n) => n.op === "Z" ? "Z" : n.op === "C" ? `C ${n.x1} ${n.y1} ${n.x2} ${n.y2} ${n.x} ${n.y}` : `${n.op} ${n.x} ${n.y}`).join(" ");
let Z = null;
const H = 28;
function V(t, n, e) {
  Z ??= document.createElement("canvas").getContext("2d");
  const r = [];
  if (!Z) return r;
  const i = t.map((o) => new Path2D(Pn(o)));
  for (let o = 0; o < H; o++) for (let c = 0; c < H; c++) {
    const f = e.minX + (c + 0.5) / H * (e.maxX - e.minX), a = e.minY + (o + 0.5) / H * (e.maxY - e.minY);
    r.push(i.some((s) => Z.isPointInPath(s, f, a, n)));
  }
  return r;
}
const ut = (t, n) => t.reduce((e, r, i) => e + (r !== n[i] ? 1 : 0), 0) / Math.max(1, t.length);
function Mt(t, n) {
  if (t.evenOdd) return [t.cmds];
  const e = K(t.cmds);
  if (!e) return [t.cmds];
  const r = V([t.cmds], "nonzero", e);
  return ut(r, V([t.cmds], "evenodd", e)) === 0 ? [t.cmds] : n && ut(r, V(n, "evenodd", e)) <= 0.03 ? n : null;
}
function Ln(t, n, e, r, i, o, c) {
  const f = [];
  for (let a = 0; a < n.length; a++) {
    const s = n[a], l = n[a + 1], u = !!((s.fill || s.grad) && !s.stroke && l && l.stroke && !l.fill && !l.grad && j(l) === j(s)), h = u ? l : s, p = K(s.cmds);
    if (!p) continue;
    const d = Math.max(p.maxX - p.minX, 0.01), x = Math.max(p.maxY - p.minY, 0.01), y = I(s.fill, o * s.fillAlpha), w = s.grad ? zn(s.grad, p, o) : y ? { kind: "solid", color: y } : { kind: "none" }, m = I(h.stroke, o * h.strokeAlpha), k = m ? { width: h.width, color: m, dash: h.dash ? "dash" : void 0, join: "round", cap: "rnd" } : null, M = !!(s.fill || s.grad), C = ($) => O($, -p.minX, -p.minY);
    let S;
    if (M) {
      const $ = Mt(s, c);
      if (!$) return null;
      S = $.length === 1 && $[0] === s.cmds ? J({ cmds: C(s.cmds), stroke: m ? void 0 : !1 }) : [...$.map((L) => ({ cmds: C(L), stroke: !1 })), ...m ? [{ cmds: C(s.cmds), fill: !1 }] : []];
    } else S = [{ cmds: C(s.cmds), fill: !1, stroke: m ? void 0 : !1 }];
    f.push({
      kind: "shape",
      id: i.nextId++,
      name: `${T(t)} part`,
      x: p.minX - i.ox,
      y: p.minY - i.oy,
      w: d,
      h: x,
      geom: { kind: "custom", paths: S },
      fill: w,
      line: k
    }), u && a++;
  }
  return r && f.push({
    kind: "shape",
    id: i.nextId++,
    name: `${T(t)} label`,
    textBox: !0,
    x: e.x,
    y: e.y,
    w: e.w,
    h: e.h,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: r
  }), i.report.native++, { kind: "group", id: i.nextId++, name: T(t), ...e, children: f };
}
const dt = 6;
function En(t, n) {
  if (t.angle || t.flipX || t.flipY) return null;
  const e = (t.opacity ?? 100) / 100, r = t.tableCols ?? 3, i = t.tableRows ?? 3, o = t.tableHeaders !== !1, c = o ? i + 1 : i, f = t.tableColWidths?.length === r ? t.tableColWidths : Xt(r), a = t.tableRowHeights?.length === c ? t.tableRowHeights : Bt(c), s = t.tableColOrder?.length === r ? t.tableColOrder : Array.from({ length: r }, (g, v) => v), l = t.tableData ?? Dt(c, r), u = B(t, n), h = f.reduce((g, v) => g + v, 0) || 1, p = a.reduce((g, v) => g + v, 0) || 1, d = N(t, e), x = t.fontSize ?? 14, y = nt(t, e, x), w = I(t.tableHeaderTextColor, e) ?? y?.color, m = (g) => {
    const v = I(g, e);
    return v ? { kind: "solid", color: v } : { kind: "none" };
  }, k = (g) => {
    if (o && g === 0) return m(t.tableHeaderColor);
    const v = (o ? g - 1 : g) % 2 === 1;
    return m(v && t.tableAltRowColor ? t.tableAltRowColor : t.tableRowColor || t.tableAltRowColor);
  }, M = (g, v, R) => {
    const A = qt(t.tableCellBorders, g, v)?.[R], F = A ? Jt(A.style) : 0, b = A && F > 0 ? I(A.color, e) : null;
    return b ? { width: F, color: b } : void 0;
  }, C = (g, v, R) => {
    const [A, F, b] = R === "top" ? [g - 1, v, "bottom"] : R === "bottom" ? [g + 1, v, "top"] : R === "left" ? [g, v - 1, "right"] : [g, v + 1, "left"];
    return M(g, v, R) ?? M(A, F, b) ?? d;
  }, S = t.tableMergedCells ?? [], $ = (g, v) => S.find((R) => g >= R.startRow && g <= R.endRow && v >= R.startCol && v <= R.endCol), L = [];
  for (let g = 0; g < c; g++) {
    const v = o && g === 0, R = [];
    for (let A = 0; A < r; A++) {
      const F = s[A], b = $(g, A), Ct = b ? b.startRow : g, At = b ? b.endRow : g, St = b ? b.startCol : A, It = b ? b.endCol : A, P = {
        fill: k(b ? b.startRow : g),
        borders: { t: C(Ct, A, "top"), b: C(At, A, "bottom"), l: C(g, St, "left"), r: C(g, It, "right") }
      };
      if (b && (g !== b.startRow || A !== b.startCol)) {
        A > b.startCol && (P.hMerge = !0), g > b.startRow && (P.vMerge = !0), R.push(P);
        continue;
      }
      b && (P.gridSpan = b.endCol - b.startCol + 1, P.rowSpan = b.endRow - b.startRow + 1);
      const $t = v ? l[0]?.[F] ?? `Col ${F + 1}` : Ht(l[g]?.[F] ?? "", Wt(t.tableCellFormats, g, A)), rt = t.tableColAlignments?.[F] ?? "center";
      P.text = {
        paragraphs: tt(String($t), rt === "left" ? "l" : rt === "right" ? "r" : "ctr"),
        anchor: t.tableVerticalAlign === "top" ? "t" : t.tableVerticalAlign === "bottom" ? "b" : "ctr",
        insets: { l: dt, r: dt, t: 4, b: 4 },
        wrap: !0,
        defaults: v ? { ...y, bold: !0, color: w } : y
      }, R.push(P);
    }
    L.push({ h: a[g] / p * u.h, cells: R });
  }
  return n.report.native++, {
    kind: "table",
    id: n.nextId++,
    name: T(t),
    x: u.x,
    y: u.y,
    w: u.w,
    h: u.h,
    cols: s.map((g) => f[g] / h * u.w),
    rows: L,
    firstRow: o || void 0,
    bandRow: !!t.tableAltRowColor || void 0
  };
}
function On(t, n) {
  if (bn(t)) return q([t], n, T(t));
  try {
    if (t.type === "chart")
      return n.report.native++, [{ kind: "chart", id: n.nextId++, name: T(t), ...B(t, n), chart: zt(t.chart) }];
    if (t.type === "table") {
      const e = En(t, n);
      if (e) return [e];
    }
    if (t.type === "text" || t.type === "richtext") return In(t, n);
    if (t.type === "image") return wn(t, n);
    if (t.type === "line" || t.type === "arrow") return An(t, n);
    if (yn.has(t.type)) return Sn(t, n);
    if (!kn.has(t.type)) {
      const e = Fn(t, n);
      if (e) return e;
    }
  } catch {
  }
  return q([t], n, T(t));
}
function vt(t, n, e) {
  const r = [];
  let i = 0;
  const o = (c) => {
    const f = c.groupIds ?? [];
    return f.length > n ? f[f.length - 1 - n] : void 0;
  };
  for (; i < t.length; ) {
    const c = o(t[i]);
    if (!c) {
      let s = On(t[i], e);
      const l = Wn(t[i].link);
      if (l) for (const u of s) u.link = l;
      e.animTargets && t[i].animations?.length && s.length > 1 && (s = [{ kind: "group", id: e.nextId++, name: T(t[i]), ...ht(s), children: s }]), e.animTargets && s.length === 1 && e.animTargets.set(t[i].id, s[0].id), r.push(...s), i++;
      continue;
    }
    let f = i;
    for (; f < t.length && o(t[f]) === c; ) f++;
    const a = vt(t.slice(i, f), n + 1, e);
    if (a.length > 1) {
      const s = ht(a), l = { kind: "group", id: e.nextId++, name: t[i].groupNames?.[c] || "Group", ...s, children: a };
      if (r.push(l), e.animTargets) for (const u of t.slice(i, f)) e.animTargets.set(u.id, l.id);
    } else r.push(...a);
    i = f;
  }
  return r;
}
function ht(t) {
  let n = 1 / 0, e = 1 / 0, r = -1 / 0, i = -1 / 0;
  for (const o of t)
    n = Math.min(n, o.x), e = Math.min(e, o.y), r = Math.max(r, o.x + o.w), i = Math.max(i, o.y + o.h);
  return { x: n, y: e, w: Math.max(0, r - n), h: Math.max(0, i - e) };
}
function Xn(t) {
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
function Bn(t, n) {
  const e = t.slide;
  if (!e) {
    const f = I(t.background);
    return f ? { kind: "solid", color: f } : void 0;
  }
  const r = e.fillStyle || "solid", i = !e.backgroundImage && (!e.canvasTexture || e.canvasTexture === "none");
  if (i && r === "solid")
    return { kind: "solid", color: I(e.backgroundColor === "transparent" ? "#ffffff" : e.backgroundColor || "#ffffff") ?? { hex: "#ffffff" } };
  if (i && (r === "linear" || r === "radial") && (e.gradientStops?.length ?? 0) > 0) {
    const f = e.gradientDirection || 0, a = e.gradientStops.map((s) => ({ pos: s.offset, color: I(s.color) ?? { hex: "#ffffff" } }));
    return r === "radial" ? { kind: "radial", stops: a } : { kind: "linear", stops: Dn(a, f, t.w, t.h), angle: f };
  }
  const o = n.rasterizeBackground?.(e), c = o ? et(o) : null;
  return c ? { kind: "image", media: c } : { kind: "solid", color: I(e.backgroundColor) ?? { hex: "#ffffff" } };
}
function Dn(t, n, e, r) {
  const i = n * Math.PI / 180, o = Math.hypot(e, r) / 2, c = (Math.abs(e * Math.cos(i)) + Math.abs(r * Math.sin(i))) / 2;
  if (!(c > 0) || t.length < 2) return t;
  const f = [...t].sort((a, s) => a.pos - s.pos).map((a) => ({ pos: (-o + 2 * o * a.pos + c) / (2 * c), color: a.color }));
  return wt(f);
}
function Hn(t, n, e) {
  const r = X(t.hex), i = X(n.hex), o = [0, 1, 2].map((s) => Math.round(r[s] + (i[s] - r[s]) * e)), c = t.alpha ?? 1, f = n.alpha ?? 1, a = c + (f - c) * e;
  return a < 0.999 ? { hex: Y(o), alpha: a } : { hex: Y(o) };
}
function Wn(t) {
  const n = Ft(t);
  if (n.kind === "url") return { kind: "url", url: n.url };
  if (n.kind === "slide") return { kind: "slide", key: n.slideId };
  if (n.kind === "action") return { kind: "action", action: n.action };
}
function Yn(t) {
  return {
    ...t?.hidden && { hidden: !0 },
    ...t?.advanceAfter && t.advanceAfter > 0 && { advanceAfterMs: t.advanceAfter },
    ...t?.section && { section: t.section }
  };
}
function Zn(t, n, e) {
  const r = { ox: t.x, oy: t.y, nextId: 2, ids: /* @__PURE__ */ new Map(), glue: [], hooks: n, report: e, ...t.layers && { animTargets: /* @__PURE__ */ new Map() } }, i = vt(t.elements, 0, r);
  r.glue.forEach((c) => c());
  const o = t.layers && r.animTargets ? jn(t.elements, t.layers, r.animTargets, e) : [];
  return {
    name: t.name,
    items: i,
    background: Bn(t, n),
    transition: Xn(t.slide?.transition),
    notes: t.slide?.notes?.trim() ? t.slide.notes : void 0,
    key: t.slide?.id,
    ...Yn(t.slide),
    ...o.length && { anims: o }
  };
}
function jn(t, n, e, r) {
  const i = Rt(t.filter((a) => !a.id.includes("@page")), n), o = [];
  let c = 0;
  for (const a of i) {
    const s = a.animation.trigger;
    if (s === "with-prev" || s === "after-prev") {
      const l = o[o.length - 1];
      !l || l.skip ? c++ : l.steps.push(a);
    } else s === "on-load" || s === "on-click" ? o.push({ load: s === "on-load", skip: !1, steps: [a] }) : (o.push({ load: !1, skip: !0, steps: [] }), c++);
  }
  const f = [];
  for (const a of [...o.filter((s) => s.load && !s.skip), ...o.filter((s) => !s.load && !s.skip)]) {
    const s = /* @__PURE__ */ new Set();
    a.steps.forEach((l, u) => {
      const h = e.get(l.elementId), p = u === 0 ? a.load ? "with" : "click" : l.animation.trigger === "after-prev" ? "after" : "with", d = h !== void 0 ? rn(l.animation, h, p) : null;
      if (!d) {
        c++;
        return;
      }
      const x = `${h}|${d.cls}|${d.effect}`;
      s.has(x) || (s.add(x), f.push(d));
    });
  }
  return c && (r.animsSkipped = (r.animsSkipped ?? 0) + c), f;
}
function Vn(t, n, e, r) {
  const i = Math.min(e / Math.max(t, 1), r / Math.max(n, 1));
  return { scale: i, dx: (e - t * i) / 2, dy: (r - n * i) / 2 };
}
export {
  Vn as fitInto,
  et as mediaOf,
  Zn as pageToSlide,
  Dn as remapPageStops,
  Yn as showFields,
  I as toColor,
  Xn as transitionOf,
  mt as typefaceOf
};
