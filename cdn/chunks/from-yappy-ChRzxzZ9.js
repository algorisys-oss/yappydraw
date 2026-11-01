import { a1 as et, a2 as pt, a3 as mt, a4 as xt, a5 as gt, a6 as yt, a7 as kt, a8 as bt, a9 as G, aa as Mt, ab as wt, ac as vt, ad as St, ae as At, af as $t, ag as It, ah as Ct, ai as Tt, aj as Pt, ak as zt, al as Ft } from "./index-v2rH-W8-.js";
import { d as F, g as j, t as C, h as Lt } from "./custgeom-gp_HWEYw.js";
function Et(t) {
  const { l: n, c: e, h: r } = t, i = r * Math.PI / 180, o = e * Math.cos(i), l = e * Math.sin(i), f = n + 0.3963377774 * o + 0.2158037573 * l, s = n - 0.1055613458 * o - 0.0638541728 * l, a = n - 0.0894841775 * o - 1.291485548 * l, c = f * f * f, u = s * s * s, p = a * a * a, d = 1.2270138511 * c - 0.5577999807 * u + 0.2812561489 * p, h = -0.0405801784 * c + 1.1122568696 * u - 0.0716766787 * p, x = -0.0763812845 * c - 0.4214819787 * u + 1.5861632204 * p, g = 2.4039459 * d - 0.9898517 * h - 0.4141151 * x, k = -0.7797967 * d + 1.5445214 * h + 0.0352745 * x, m = 0.0384795 * d - 0.1141381 * h + 1.0756786 * x, y = (b) => {
    const M = Math.abs(b), w = M > 31308e-7 ? 1.055 * Math.pow(M, 1 / 2.4) - 0.055 : 12.92 * M;
    return b < 0 ? -w : w;
  };
  return {
    r: y(g),
    g: y(k),
    b: y(m)
  };
}
function R(t) {
  const n = Math.abs(t), e = n > 31308e-7 ? 1.055 * Math.pow(n, 1 / 2.4) - 0.055 : 12.92 * n;
  return t < 0 ? -e : e;
}
function X(t) {
  const n = Math.abs(t), e = n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92;
  return t < 0 ? -e : e;
}
function V(t, n, e) {
  const r = X(t), i = X(n), o = X(e);
  return {
    r: R(1.2249401762805083 * r - 0.2249401762805082 * i),
    g: R(-0.04205697751522136 * r + 1.0420569775152215 * i),
    b: R(-0.019637554590334 * r - 0.07863604555063188 * i + 1.0982736001409656 * o)
  };
}
function Ot(t) {
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
    const o = r[2].split(/[\s,]+/).filter(Boolean).map(Ot);
    if (o.length < 3 || o.some((c) => !isFinite(c))) return null;
    const [l, f, s] = o;
    if (r[1] === "srgb") return [e(l), e(f), e(s)];
    const a = V(l, f, s);
    return [e(a.r), e(a.g), e(a.b)];
  }
  const i = n.match(/^oklch\(\s*([^/)]+?)\s*(?:\/[^)]*)?\)$/);
  if (i) {
    const o = i[1].split(/[\s,]+/).filter(Boolean);
    if (o.length < 3) return null;
    const l = o[0].endsWith("%") ? parseFloat(o[0]) / 100 : parseFloat(o[0]), f = parseFloat(o[1]), s = parseFloat(o[2]);
    if (![l, f, s].every(isFinite)) return null;
    const a = V(...(({ r: c, g: u, b: p }) => [c, u, p])(Et({ l, c: f, h: s })));
    return [e(a.r), e(a.g), e(a.b)];
  }
  return Rt(n);
}
const P = /* @__PURE__ */ new Map();
let $;
function Rt(t) {
  if (P.has(t)) return P.get(t);
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
  return P.size < 512 && P.set(t, n), n;
}
const L = (t) => "#" + t.map((n) => n.toString(16).padStart(2, "0")).join("");
function Xt(t) {
  const n = t.trim().toLowerCase(), e = n.match(/^#([0-9a-f]{8})$/);
  if (e) return parseInt(e[1].slice(6), 16) / 255;
  const r = n.match(/^#([0-9a-f]{4})$/);
  if (r) return parseInt(r[1][3] + r[1][3], 16) / 255;
  const i = n.match(/^(?:rgba?|hsla?)\(([^)]*)\)$/);
  if (i) {
    const l = i[1].split(/[\s,/]+/).filter(Boolean);
    if (l.length >= 4) return q(l[3]);
  }
  const o = n.match(/\/\s*([\d.]+%?)\s*\)$/);
  return o ? q(o[1]) : 1;
}
const q = (t) => {
  const n = t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
};
function S(t, n = 1) {
  if (!t) return null;
  const e = T(t);
  if (!e) return null;
  const r = Xt(t) * n;
  return r <= 0 ? null : r < 0.999 ? { hex: L(e), alpha: r } : { hex: L(e) };
}
const rt = (t) => pt(t).split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Calibri", Y = {
  hachure: "ltUpDiag",
  zigzag: "ltUpDiag",
  "zigzag-line": "ltUpDiag",
  dashed: "dashUpDiag",
  "cross-hatch": "diagCross",
  dots: "pct20"
};
function Bt(t, n) {
  const e = t.fillStyle || "solid";
  if ((e === "linear" || e === "radial" || e === "conic") && (t.gradientStops?.length ?? 0) > 0) {
    const i = t.gradientStops.map((o) => ({ pos: Math.max(0, Math.min(1, o.offset)), color: S(o.color, n) ?? { hex: "#000000", alpha: 0 } }));
    return e === "linear" ? { kind: "linear", stops: i, angle: t.gradientDirection ?? 45, scaled: !0 } : { kind: "radial", stops: i };
  }
  const r = S(t.backgroundColor, n);
  return r ? Y[e] ? { kind: "pattern", preset: Y[e], color: r } : { kind: "solid", color: r } : { kind: "none" };
}
function ot(t) {
  if (t.strokeStyle === "dotted") return "sysDot";
  if (t.strokeStyle === "dashed") return "dash";
  if (Array.isArray(t.strokeDashArray) && t.strokeDashArray.length >= 2) {
    const [n] = t.strokeDashArray;
    return n <= (t.strokeWidth || 2) * 1.5 ? "sysDot" : "dash";
  }
}
function N(t, n, e = !1) {
  const r = S(t.strokeColor, n);
  if (!r || !(t.strokeWidth > 0)) return null;
  const i = t.strokeLineCap === "butt" ? "flat" : t.strokeLineCap === "square" ? "sq" : "rnd";
  return {
    width: t.strokeWidth,
    color: r,
    dash: ot(t),
    cap: e ? i : void 0,
    join: t.strokeLineJoin === "miter" ? "miter" : t.strokeLineJoin === "bevel" ? "bevel" : "round"
  };
}
function J(t, n, e) {
  if (!t) return;
  const r = n / Math.max(e, 0.5), i = r <= 2.5 ? "sm" : r <= 4 ? "med" : "lg";
  return { type: t === "triangle" ? "triangle" : t === "dot" || t === "circle" ? "oval" : t === "diamond" || t === "diamondFilled" ? "diamond" : "arrow", size: i };
}
const U = (t, n) => t === "center" ? "ctr" : t === "right" ? "r" : t === "left" ? "l" : n, it = (t) => t === "top" ? "t" : t === "bottom" ? "b" : "ctr";
function st(t, n) {
  return t.split(`
`).map((e) => ({ runs: e ? [{ text: e }] : [], align: n }));
}
function Dt(t) {
  const n = { "lower-alpha": "alphaLc", "upper-alpha": "alphaUc", "lower-roman": "romanLc", "upper-roman": "romanUc" }[t.listNumberStyle ?? ""] ?? "arabic", e = { paren: "ParenR", parens: "ParenBoth", none: "Plain" }[t.listNumberSuffix ?? ""] ?? "Period";
  return n + e;
}
let I;
function Yt(t, n) {
  if (I === void 0 && (I = typeof document < "u" ? document.createElement("canvas").getContext("2d") : null), I)
    return I.font = n, I.measureText(t).width;
  const e = Number(/(\d+(?:\.\d+)?)px/.exec(n)?.[1] ?? 16);
  return t.length * e * 0.6;
}
function Wt(t, n, e, r) {
  const i = t.listLevel || 0, o = { bullet: t.listType === "ordered" ? "num" : "char", level: i };
  if (o.bullet === "num") {
    const s = Dt(t);
    s !== "arabicPeriod" && (o.numType = s), !(e && e.level === i && e.scheme === s && (t.listIndex || 1) === e.index + 1) && (t.listIndex || 1) > 1 && (o.startAt = t.listIndex);
  } else t.listMarker && t.listMarker !== "•" && (o.bulletChar = t.listMarker);
  if (t.listMarkerColor) {
    const s = S(t.listMarkerColor, n);
    s && (o.bulletColor = s);
  }
  t.listMarkerScale && t.listMarkerScale !== 1 && (o.bulletScale = t.listMarkerScale);
  const l = Ft(t), f = r(t);
  return o.marL = f, o.indent = l - f, o;
}
function at(t, n, e, r) {
  const i = [];
  let o = { runs: [], align: n }, l = !1, f = null;
  const s = Pt(Yt, t, r), a = () => {
    i.push(o), o = { runs: [], align: n }, l = !1;
  };
  for (const c of t)
    String(c.text ?? "").split(`
`).forEach((p, d) => {
      if (d > 0 && a(), c.fontSize && !l && (o.endSize = c.fontSize), !p) return;
      l || (l = !0, c.paragraphSpaceBefore && (o.spaceBefore = c.paragraphSpaceBefore), c.paragraphAlign && (o.align = U(c.paragraphAlign, n ?? "l")), c.listType && c.listType !== "none" && Object.assign(o, Wt(c, e, f, s)), f = o.bullet === "num" ? { level: o.level ?? 0, scheme: o.numType ?? "arabicPeriod", index: c.listIndex || 1 } : null);
      const h = { text: p };
      if (c.bold && (h.bold = !0), c.italic && (h.italic = !0), c.underline && (h.underline = !0), c.strikethrough && (h.strike = !0), c.color) {
        const x = S(c.color, e);
        x && (h.color = x);
      }
      c.fontSize && (h.size = c.fontSize), c.fontFamily && (h.font = rt(c.fontFamily)), o.runs.push(h);
    });
  return a(), i;
}
function ct(t, n, e) {
  const r = S(t.textColor || t.strokeColor || "#000000", n) ?? void 0;
  return {
    size: e,
    color: r,
    font: rt(t.fontFamily),
    bold: It(t.fontWeight) >= 600 ? !0 : void 0,
    italic: $t(t.fontStyle) === "italic" ? !0 : void 0
  };
}
const lt = (t) => Ct(t) / Tt;
function Ht(t, n) {
  const e = t.richText && t.richText.length > 0, r = U(t.textAlign, e ? "ctr" : "l");
  return {
    paragraphs: e ? at(t.richText, r, n, { fontSize: t.fontSize || 20, fontFamily: t.fontFamily || "sans-serif" }) : st(t.text || "", r),
    anchor: it(t.verticalAlign),
    insets: { l: 4, t: 4, r: 4, b: 4 },
    wrap: !t.autoResize,
    lineSpacing: lt(t),
    defaults: ct(t, n, t.fontSize || 20)
  };
}
function ft(t, n) {
  const e = t.richContainerText && t.richContainerText.length > 0;
  if (!e && !t.containerText) return;
  const r = U(t.textAlign, "ctr");
  return {
    paragraphs: e ? at(t.richContainerText, r, n, { fontSize: t.fontSize || 28, fontFamily: t.fontFamily || "hand-drawn" }) : st(t.containerText, r),
    anchor: it(t.verticalAlign),
    insets: { l: 10, t: 4, r: 10, b: 4 },
    wrap: !0,
    lineSpacing: lt(t),
    defaults: ct(t, n, t.fontSize || 16)
  };
}
function jt(t, n, e) {
  const r = [], i = Math.abs(n) / 2, o = Math.abs(e) / 2, l = (s, a, c) => {
    const u = C(F(s), i, o);
    if (u.length === 0) return;
    const p = a, d = { fill: p.noFill ? !1 : void 0, stroke: p.noStroke ? !1 : void 0 };
    if (c) {
      r.push({ cmds: u, ...d });
      return;
    }
    let h = [];
    for (const x of u)
      x.op === "M" && h.length && (r.push({ cmds: h, ...d }), h = []), h.push(x);
    h.length && r.push({ cmds: h, ...d });
  }, f = (s) => {
    const a = (c) => Math.round(c * 1e3) / 1e3;
    switch (s.type) {
      case "rect": {
        const c = Math.min(Math.abs(s.w), Math.abs(s.h)) / 2, [u, p, d, h] = (Array.isArray(s.r) ? s.r : [s.r || 0, s.r || 0, s.r || 0, s.r || 0]).map((b) => Math.max(0, Math.min(b || 0, c))), x = (b, M, w) => b ? ` A ${a(b)} ${a(b)} 0 0 1 ${a(M)} ${a(w)}` : "", { x: g, y: k } = s, m = s.w, y = s.h;
        l(`M ${g + u} ${k} H ${g + m - p}${x(p, g + m, k + p)} V ${k + y - d}${x(d, g + m - d, k + y)} H ${g + h}${x(h, g, k + y - h)} V ${k + u}${x(u, g + u, k)} Z`, s, !1);
        break;
      }
      case "ellipse":
        l(`M ${s.cx - s.rx} ${s.cy} A ${s.rx} ${s.ry} 0 1 0 ${s.cx + s.rx} ${s.cy} A ${s.rx} ${s.ry} 0 1 0 ${s.cx - s.rx} ${s.cy} Z`, s, !1);
        break;
      case "points":
        s.points.length >= 2 && l(`M ${s.points.map((c) => `${c.x} ${c.y}`).join(" L ")}${s.isClosed !== !1 ? " Z" : ""}`, s, !1);
        break;
      case "path":
        l(s.path, s, !!s.evenOdd);
        break;
      case "multi":
        s.shapes.forEach(f);
        break;
    }
  };
  return f(t), r;
}
function Nt(t) {
  if (t.warp || t.points && t.points.length) return null;
  if (t.type === "circle") return { kind: "preset", prst: "ellipse" };
  if (t.type === "rectangle") {
    const [n, e, r, i] = vt(t);
    if (!n && !e && !r && !i) return { kind: "preset", prst: "rect" };
    if (n === e && e === r && r === i) {
      const o = Math.min(Math.abs(t.width), Math.abs(t.height));
      return o > 0 ? { kind: "preset", prst: "roundRect", adj: { adj: Math.min(5e4, n / o * 1e5) } } : null;
    }
  }
  return null;
}
const Ut = /* @__PURE__ */ new Set(["umlClass", "umlInterface", "qrCode", "video", "codeBlock"]), _t = /* @__PURE__ */ new Set(["fineliner", "inkbrush", "marker", "ink"]), Zt = /* @__PURE__ */ new Set(["text", "richtext", "image", "line", "arrow"]);
function Gt(t) {
  const n = t;
  if (Ut.has(t.type) || t.clipMaskId || t.shadowEnabled || t.glowEnabled || (t.featherRadius ?? 0) > 0 || t.blendMode && t.blendMode !== "normal" || t.shearX || t.shearY || xt(t) || gt(t) || yt(t) || kt(t) || t.appearance && (t.appearance.fills?.length ?? 0) + (t.appearance.strokes?.length ?? 0) > 0) return !0;
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
function _(t) {
  if (!t) return null;
  const n = K(t);
  if (n && n.mime === "image/png") return { bytes: n.bytes, ext: "png" };
  if (n && (n.mime === "image/jpeg" || n.mime === "image/jpg")) return { bytes: n.bytes, ext: "jpeg" };
  if (n && n.mime === "image/gif") return { bytes: n.bytes, ext: "gif" };
  const e = et(t);
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
const A = (t) => t.name || t.type;
function Z(t, n) {
  const e = Math.abs(t.width), r = Math.abs(t.height), i = Math.min(t.x, t.x + t.width) - n.ox, o = Math.min(t.y, t.y + t.height) - n.oy;
  return { x: i, y: o, w: e, h: r, rot: t.angle ? t.angle * 180 / Math.PI : void 0, flipH: !!t.flipX || void 0, flipV: !!t.flipY || void 0 };
}
function W(t, n, e) {
  const r = n.hooks.rasterize(t), i = r ? _(r.dataURL) : null;
  return !r || !i ? [] : (n.report.pictures++, [{ kind: "picture", id: n.nextId++, name: e, x: r.x - n.ox, y: r.y - n.oy, w: r.width, h: r.height, media: i }]);
}
function Vt(t, n) {
  const e = _(t.dataURL);
  if (!e) return W([t], n, A(t));
  let r;
  if (t.crop) {
    const o = t.dataURL ? et(t.dataURL) : null, l = o?.naturalWidth, f = o?.naturalHeight;
    if (l && f) {
      const s = t.crop;
      r = { l: s.x / l, t: s.y / f, r: 1 - (s.x + s.width) / l, b: 1 - (s.y + s.height) / f };
    }
  }
  const i = (t.opacity ?? 100) / 100;
  return n.report.native++, [{ kind: "picture", id: n.nextId++, name: A(t), ...Z(t, n), media: e, crop: r, alpha: i < 1 ? i : void 0, descr: t.altText }];
}
function qt(t, n, e, r) {
  const i = ft(t, r);
  if (!i) return [];
  const o = t.fontSize || 16, l = (t.containerText || "").split(`
`), f = Math.max(1, ...l.map((c) => c.length)), s = Math.max(40, f * o * 0.6 + 24), a = Math.max(o * 1.6, l.length * o * 1.25 + 8);
  return i.wrap = !1, i.anchor = "ctr", i.paragraphs.forEach((c) => {
    c.align = "ctr";
  }), [{
    kind: "shape",
    id: e.nextId++,
    name: `${A(t)} label`,
    textBox: !0,
    x: n.x - e.ox - s / 2,
    y: n.y - e.oy - a / 2,
    w: s,
    h: a,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: i
  }];
}
function Jt(t, n, e) {
  const r = t.x + t.w / 2, i = t.y + t.h / 2, o = (t.rot || 0) * Math.PI / 180, l = [[0, -t.h / 2], [-t.w / 2, 0], [0, t.h / 2], [t.w / 2, 0]], f = n.x - e.ox, s = n.y - e.oy;
  for (let a = 0; a < 4; a++) {
    let [c, u] = l[a];
    t.flipH && (c = -c), t.flipV && (u = -u);
    const p = r + c * Math.cos(o) - u * Math.sin(o), d = i + c * Math.sin(o) + u * Math.cos(o);
    if (Math.hypot(p - f, d - s) <= 2) return a;
  }
  return -1;
}
function Kt(t, n, e) {
  const r = e.x - n.x, i = e.y - n.y, o = Math.hypot(r, i);
  if (!(o > 0)) return !1;
  const l = (a, c) => Math.abs((a - n.x) * i - (c - n.y) * r) / o, f = (a, c) => ((a - n.x) * r + (c - n.y) * i) / (o * o), s = (a, c) => l(a, c) <= 0.5 && f(a, c) >= -0.01 && f(a, c) <= 1.01;
  return t.every((a) => a.op === "Z" ? !1 : a.op === "C" ? s(a.x1, a.y1) && s(a.x2, a.y2) && s(a.x, a.y) : s(a.x, a.y));
}
function Qt(t, n) {
  const e = (t.opacity ?? 100) / 100, r = N(t, e, !0), i = bt(t), o = [];
  if (r) {
    const l = t.type === "arrow", f = l ? t.startArrowhead : null, s = l ? t.endArrowhead || (t.startArrowhead ? null : "arrow") : null, a = { ...r, head: J(f, G(t, "start"), t.strokeWidth), tail: J(s, G(t, "end"), t.strokeWidth) };
    if (!i.d || Kt(F(i.d), i.start, i.end)) {
      const { start: c, end: u } = i, p = {
        kind: "connector",
        id: n.nextId++,
        name: A(t),
        x: Math.min(c.x, u.x) - n.ox,
        y: Math.min(c.y, u.y) - n.oy,
        w: Math.abs(u.x - c.x),
        h: Math.abs(u.y - c.y),
        flipH: u.x < c.x || void 0,
        flipV: u.y < c.y || void 0,
        geom: { kind: "preset", prst: "straightConnector1" },
        line: a
      }, d = (h, x) => {
        const g = h?.elementId ? n.ids.get(h.elementId) : void 0;
        if (!g) return;
        const k = Jt(g.item, x, n);
        return k >= 0 ? { id: g.id, idx: k } : void 0;
      };
      n.glue.push(() => {
        p.start = d(t.startBinding, c), p.end = d(t.endBinding, u);
      }), o.push(p);
    } else {
      const c = F(i.d), u = j(c);
      if (u) {
        const p = Math.max(u.maxX - u.minX, 0.01), d = Math.max(u.maxY - u.minY, 0.01);
        o.push({
          kind: "shape",
          id: n.nextId++,
          name: A(t),
          x: u.minX - n.ox,
          y: u.minY - n.oy,
          w: p,
          h: d,
          geom: { kind: "custom", paths: [{ cmds: C(c, -u.minX, -u.minY), fill: !1 }] },
          fill: { kind: "none" },
          line: a
        });
      }
    }
    n.report.native++;
  }
  return o.push(...qt(t, i.mid, n, e)), o;
}
function tn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = Mt(t.points), i = N(t, e, !0);
  if (r.length < 2 || !i) return [];
  i.cap = "rnd", i.join = "round";
  const o = r.map((p) => p.x), l = r.map((p) => p.y), f = Math.min(...o), s = Math.min(...l), a = Math.max(Math.max(...o) - f, 0.01), c = Math.max(Math.max(...l) - s, 0.01), u = r.map((p, d) => ({ op: d ? "L" : "M", x: p.x - f, y: p.y - s }));
  return n.report.native++, [{
    kind: "shape",
    id: n.nextId++,
    name: A(t),
    x: t.x + f - n.ox,
    y: t.y + s - n.oy,
    w: a,
    h: c,
    rot: t.angle ? t.angle * 180 / Math.PI : void 0,
    geom: { kind: "custom", paths: [{ cmds: u, fill: !1 }] },
    fill: { kind: "none" },
    line: i
  }];
}
function nn(t, n) {
  const e = (t.opacity ?? 100) / 100;
  if (!(t.text || t.richText && t.richText.length > 0)) return [];
  n.report.native++;
  const i = S(t.backgroundColor, e);
  return [{
    kind: "shape",
    id: n.nextId++,
    name: A(t),
    ...Z(t, n),
    textBox: !0,
    geom: { kind: "preset", prst: "rect" },
    fill: i ? { kind: "solid", color: i } : { kind: "none" },
    line: null,
    text: Ht(t, e)
  }];
}
const en = (t) => {
  const n = t && /matrix\(([^)]+)\)/.exec(t), e = n ? n[1].split(/[\s,]+/).map(Number) : [];
  return e.length === 6 && e.every(Number.isFinite) ? e : [1, 0, 0, 1, 0, 0];
}, Q = (t, n, e) => ({ x: t[0] * n + t[2] * e + t[4], y: t[1] * n + t[3] * e + t[5] });
function rn(t) {
  const n = zt.generator(), e = (i) => {
    for (const o of n.toPaths(i))
      t.save(), o.fill && o.fill !== "none" && (!o.stroke || o.stroke === "none") ? (t.fillStyle = o.fill, t.fillPath(o.d)) : o.stroke && o.stroke !== "none" && o.strokeWidth > 0 && (t.strokeStyle = o.stroke, t.lineWidth = o.strokeWidth, t.strokePath(o.d)), t.restore();
    return i;
  }, r = { generator: n, draw: e, getDefaultOptions: () => n.defaultOptions };
  for (const i of ["line", "rectangle", "ellipse", "circle", "linearPath", "polygon", "arc", "curve", "path"])
    r[i] = (...o) => e(n[i](...o));
  return r;
}
function on(t) {
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
    fillStyle: Y[n] ? "solid" : t.fillStyle
  }, r = new St();
  try {
    const a = document.createElement("canvas");
    At(rn(r), a.getContext("2d"), e, !1, 1, r);
  } catch {
    return null;
  }
  if (r.failed) return null;
  const i = /* @__PURE__ */ new Map();
  for (const a of Array.from(r.defs.children)) a.id && i.set(a.id, a);
  const o = (a, c) => {
    const u = i.get(a.replace(/^url\(#|\)$/g, ""));
    if (!u) return null;
    const p = Array.from(u.children).map((d) => ({ pos: +(d.getAttribute("offset") || 0), color: S(d.getAttribute("stop-color")) ?? { hex: "#000000", alpha: 0 } }));
    if (!p.length) return null;
    if (u.tagName.toLowerCase() === "lineargradient") {
      const d = Q(c, +u.getAttribute("x1"), +u.getAttribute("y1")), h = Q(c, +u.getAttribute("x2"), +u.getAttribute("y2"));
      return { kind: "linear", x1: d.x, y1: d.y, x2: h.x, y2: h.y, stops: p };
    }
    return { kind: "radial", x1: 0, y1: 0, x2: 0, y2: 0, stops: p };
  }, l = [];
  let f = "ok";
  const s = (a) => {
    for (const c of Array.from(a.children)) {
      if (f !== "ok") return;
      const u = c.tagName.toLowerCase();
      if (u === "g") {
        if (c.getAttribute("clip-path")) {
          f = "picture";
          return;
        }
        s(c);
        continue;
      }
      if (u === "text" || u === "image") {
        f = "picture";
        return;
      }
      let p = null;
      if (u === "path") p = c.getAttribute("d");
      else if (u === "rect") {
        const b = +c.getAttribute("x"), M = +c.getAttribute("y"), w = +c.getAttribute("width"), v = +c.getAttribute("height");
        p = `M ${b} ${M} L ${b + w} ${M} L ${b + w} ${M + v} L ${b} ${M + v} Z`;
      } else {
        f = "fail";
        return;
      }
      const d = en(c.getAttribute("transform")), h = Lt(F(p || ""), d);
      if (!h.length) continue;
      const x = c.getAttribute("fill"), g = c.getAttribute("stroke"), k = !!x && x.startsWith("url("), m = +(c.getAttribute("fill-opacity") ?? 1), y = +(c.getAttribute("stroke-opacity") ?? 1);
      l.push({
        cmds: h,
        fill: x && x !== "none" && !k ? x : null,
        grad: k ? o(x, d) : null,
        stroke: g && g !== "none" ? g : null,
        fillAlpha: Number.isFinite(m) ? m : 1,
        strokeAlpha: Number.isFinite(y) ? y : 1,
        width: +(c.getAttribute("stroke-width") || 1) * Math.sqrt(Math.abs(d[0] * d[3] - d[1] * d[2])),
        dash: !!c.getAttribute("stroke-dasharray"),
        evenOdd: c.getAttribute("fill-rule") === "evenodd"
      });
    }
  };
  return s(r.root), f === "ok" ? l : f === "picture" ? "picture" : null;
}
const tt = (t, n) => {
  if (!t || !n) return !1;
  const e = T(t), r = T(n);
  return !!e && !!r && e[0] === r[0] && e[1] === r[1] && e[2] === r[2];
};
function sn(t, n, e) {
  const r = t.stops.map((h) => ({ pos: h.pos, color: e < 1 ? { ...h.color, alpha: (h.color.alpha ?? 1) * e } : h.color }));
  if (t.kind === "radial") return { kind: "radial", stops: r };
  const i = t.x2 - t.x1, o = t.y2 - t.y1, l = Math.hypot(i, o);
  if (!(l > 0)) return { kind: "solid", color: r[r.length - 1].color };
  const f = i / l, s = o / l, a = (n.minX + n.maxX) / 2, c = (n.minY + n.maxY) / 2, u = (Math.abs((n.maxX - n.minX) * f) + Math.abs((n.maxY - n.minY) * s)) / 2;
  if (!(u > 0)) return { kind: "solid", color: r[0].color };
  const p = (h) => ((t.x1 + i * h - a) * f + (t.y1 + o * h - c) * s + u) / (2 * u), d = [...r].sort((h, x) => h.pos - x.pos).map((h) => ({ pos: p(h.pos), color: h.color }));
  return { kind: "linear", angle: Math.atan2(o, i) * 180 / Math.PI, stops: ut(d) };
}
function ut(t) {
  if (t.length < 2) return t.map((e) => ({ ...e, pos: Math.max(0, Math.min(1, e.pos)) }));
  const n = (e) => {
    if (e <= t[0].pos) return t[0].color;
    for (let r = 1; r < t.length; r++) {
      const i = t[r - 1], o = t[r];
      if (e <= o.pos) return mn(i.color, o.color, o.pos > i.pos ? (e - i.pos) / (o.pos - i.pos) : 0);
    }
    return t[t.length - 1].color;
  };
  return [{ pos: 0, color: n(0) }, ...t.filter((e) => e.pos > 0 && e.pos < 1), { pos: 1, color: n(1) }];
}
function H(t) {
  if (t.fill === !1) return [t];
  const n = [];
  for (const i of t.cmds)
    (i.op === "M" || !n.length) && n.push([]), n[n.length - 1].push(i);
  if (n.every((i) => i[i.length - 1].op === "Z")) return [t];
  const r = [{ cmds: n.flatMap((i) => i[i.length - 1].op === "Z" ? i : [...i, { op: "Z" }]), fill: t.fill, stroke: !1 }];
  return t.stroke !== !1 && r.push({ cmds: t.cmds, fill: !1, stroke: t.stroke }), r;
}
const E = (t) => JSON.stringify(t.cmds);
function an(t, n) {
  const e = (t.opacity ?? 100) / 100, r = Z(t, n), i = ft(t, e);
  let o = Nt(t);
  if (!o) {
    const f = wt(t), s = f ? jt(f, t.width, t.height) : [], a = on(t);
    if (a === "picture") return null;
    if (a && a.length) {
      const c = Math.min(t.x, t.x + t.width), u = Math.min(t.y, t.y + t.height), p = s.length ? s.filter((m) => m.fill !== !1).map((m) => C(m.cmds, c, u)) : null, d = !!ot(t), h = ["linear", "radial", "conic"].includes(t.fillStyle);
      if (!a.every((m) => (!m.grad || h) && m.fillAlpha >= 1 && m.strokeAlpha >= 1 && (!m.fill || tt(m.fill, t.backgroundColor)) && (!m.stroke || tt(m.stroke, t.strokeColor) && Math.abs(m.width - t.strokeWidth) < 0.75 && m.dash === d))) {
        const m = ln(t, a, r, i, n, e, p);
        return m ? [m] : null;
      }
      const g = [], k = (m) => C(m, -c, -u);
      for (let m = 0; m < a.length; m++) {
        const y = a[m], b = a[m + 1], M = !!((y.fill || y.grad) && !y.stroke && b && b.stroke && !b.fill && !b.grad && E(b) === E(y)), w = !!y.stroke || M;
        if (y.fill || y.grad) {
          const v = dt(y, p);
          if (!v) return null;
          v.length === 1 && v[0] === y.cmds ? g.push(...H({ cmds: k(y.cmds), stroke: w ? void 0 : !1 })) : (g.push(...v.map((O) => ({ cmds: k(O), stroke: !1 }))), w && g.push({ cmds: k(y.cmds), fill: !1 }));
        } else
          g.push({ cmds: k(y.cmds), fill: !1, stroke: w ? void 0 : !1 });
        M && m++;
      }
      o = { kind: "custom", paths: g };
    } else if (s.length)
      o = { kind: "custom", paths: s.flatMap(H) };
    else return null;
  }
  const l = {
    kind: "shape",
    id: n.nextId++,
    name: A(t),
    ...r,
    geom: o,
    fill: Bt(t, e),
    line: N(t, e),
    text: i
  };
  return n.ids.set(t.id, { id: l.id, item: l }), n.report.native++, [l];
}
const cn = (t) => t.map((n) => n.op === "Z" ? "Z" : n.op === "C" ? `C ${n.x1} ${n.y1} ${n.x2} ${n.y2} ${n.x} ${n.y}` : `${n.op} ${n.x} ${n.y}`).join(" ");
let B = null;
const z = 28;
function D(t, n, e) {
  B ??= document.createElement("canvas").getContext("2d");
  const r = [];
  if (!B) return r;
  const i = t.map((o) => new Path2D(cn(o)));
  for (let o = 0; o < z; o++) for (let l = 0; l < z; l++) {
    const f = e.minX + (l + 0.5) / z * (e.maxX - e.minX), s = e.minY + (o + 0.5) / z * (e.maxY - e.minY);
    r.push(i.some((a) => B.isPointInPath(a, f, s, n)));
  }
  return r;
}
const nt = (t, n) => t.reduce((e, r, i) => e + (r !== n[i] ? 1 : 0), 0) / Math.max(1, t.length);
function dt(t, n) {
  if (t.evenOdd) return [t.cmds];
  const e = j(t.cmds);
  if (!e) return [t.cmds];
  const r = D([t.cmds], "nonzero", e);
  return nt(r, D([t.cmds], "evenodd", e)) === 0 ? [t.cmds] : n && nt(r, D(n, "evenodd", e)) <= 0.03 ? n : null;
}
function ln(t, n, e, r, i, o, l) {
  const f = [];
  for (let s = 0; s < n.length; s++) {
    const a = n[s], c = n[s + 1], u = !!((a.fill || a.grad) && !a.stroke && c && c.stroke && !c.fill && !c.grad && E(c) === E(a)), p = u ? c : a, d = j(a.cmds);
    if (!d) continue;
    const h = Math.max(d.maxX - d.minX, 0.01), x = Math.max(d.maxY - d.minY, 0.01), g = S(a.fill, o * a.fillAlpha), k = a.grad ? sn(a.grad, d, o) : g ? { kind: "solid", color: g } : { kind: "none" }, m = S(p.stroke, o * p.strokeAlpha), y = m ? { width: p.width, color: m, dash: p.dash ? "dash" : void 0, join: "round", cap: "rnd" } : null, b = !!(a.fill || a.grad), M = (v) => C(v, -d.minX, -d.minY);
    let w;
    if (b) {
      const v = dt(a, l);
      if (!v) return null;
      w = v.length === 1 && v[0] === a.cmds ? H({ cmds: M(a.cmds), stroke: m ? void 0 : !1 }) : [...v.map((O) => ({ cmds: M(O), stroke: !1 })), ...m ? [{ cmds: M(a.cmds), fill: !1 }] : []];
    } else w = [{ cmds: M(a.cmds), fill: !1, stroke: m ? void 0 : !1 }];
    f.push({
      kind: "shape",
      id: i.nextId++,
      name: `${A(t)} part`,
      x: d.minX - i.ox,
      y: d.minY - i.oy,
      w: h,
      h: x,
      geom: { kind: "custom", paths: w },
      fill: k,
      line: y
    }), u && s++;
  }
  return r && f.push({
    kind: "shape",
    id: i.nextId++,
    name: `${A(t)} label`,
    textBox: !0,
    x: e.x,
    y: e.y,
    w: e.w,
    h: e.h,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: r
  }), i.report.native++, { kind: "group", id: i.nextId++, name: A(t), ...e, children: f };
}
function fn(t, n) {
  if (Gt(t)) return W([t], n, A(t));
  try {
    if (t.type === "text" || t.type === "richtext") return nn(t, n);
    if (t.type === "image") return Vt(t, n);
    if (t.type === "line" || t.type === "arrow") return Qt(t, n);
    if (_t.has(t.type)) return tn(t, n);
    if (!Zt.has(t.type)) {
      const e = an(t, n);
      if (e) return e;
    }
  } catch {
  }
  return W([t], n, A(t));
}
function ht(t, n, e) {
  const r = [];
  let i = 0;
  const o = (l) => {
    const f = l.groupIds ?? [];
    return f.length > n ? f[f.length - 1 - n] : void 0;
  };
  for (; i < t.length; ) {
    const l = o(t[i]);
    if (!l) {
      const a = fn(t[i], e), c = xn(t[i].link);
      if (c) for (const u of a) u.link = c;
      r.push(...a), i++;
      continue;
    }
    let f = i;
    for (; f < t.length && o(t[f]) === l; ) f++;
    const s = ht(t.slice(i, f), n + 1, e);
    if (s.length > 1) {
      const a = un(s), c = { kind: "group", id: e.nextId++, name: t[i].groupNames?.[l] || "Group", ...a, children: s };
      r.push(c);
    } else r.push(...s);
    i = f;
  }
  return r;
}
function un(t) {
  let n = 1 / 0, e = 1 / 0, r = -1 / 0, i = -1 / 0;
  for (const o of t)
    n = Math.min(n, o.x), e = Math.min(e, o.y), r = Math.max(r, o.x + o.w), i = Math.max(i, o.y + o.h);
  return { x: n, y: e, w: Math.max(0, r - n), h: Math.max(0, i - e) };
}
function dn(t) {
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
    default:
      return;
  }
}
function hn(t, n) {
  const e = t.slide;
  if (!e) {
    const f = S(t.background);
    return f ? { kind: "solid", color: f } : void 0;
  }
  const r = e.fillStyle || "solid", i = !e.backgroundImage && (!e.canvasTexture || e.canvasTexture === "none");
  if (i && r === "solid")
    return { kind: "solid", color: S(e.backgroundColor === "transparent" ? "#ffffff" : e.backgroundColor || "#ffffff") ?? { hex: "#ffffff" } };
  if (i && (r === "linear" || r === "radial") && (e.gradientStops?.length ?? 0) > 0) {
    const f = e.gradientDirection || 0, s = e.gradientStops.map((a) => ({ pos: a.offset, color: S(a.color) ?? { hex: "#ffffff" } }));
    return r === "radial" ? { kind: "radial", stops: s } : { kind: "linear", stops: pn(s, f, t.w, t.h), angle: f };
  }
  const o = n.rasterizeBackground?.(e), l = o ? _(o) : null;
  return l ? { kind: "image", media: l } : { kind: "solid", color: S(e.backgroundColor) ?? { hex: "#ffffff" } };
}
function pn(t, n, e, r) {
  const i = n * Math.PI / 180, o = Math.hypot(e, r) / 2, l = (Math.abs(e * Math.cos(i)) + Math.abs(r * Math.sin(i))) / 2;
  if (!(l > 0) || t.length < 2) return t;
  const f = [...t].sort((s, a) => s.pos - a.pos).map((s) => ({ pos: (-o + 2 * o * s.pos + l) / (2 * l), color: s.color }));
  return ut(f);
}
function mn(t, n, e) {
  const r = T(t.hex), i = T(n.hex), o = [0, 1, 2].map((a) => Math.round(r[a] + (i[a] - r[a]) * e)), l = t.alpha ?? 1, f = n.alpha ?? 1, s = l + (f - l) * e;
  return s < 0.999 ? { hex: L(o), alpha: s } : { hex: L(o) };
}
function xn(t) {
  const n = mt(t);
  if (n.kind === "url") return { kind: "url", url: n.url };
  if (n.kind === "slide") return { kind: "slide", key: n.slideId };
  if (n.kind === "action") return { kind: "action", action: n.action };
}
function kn(t, n, e) {
  const r = { ox: t.x, oy: t.y, nextId: 2, ids: /* @__PURE__ */ new Map(), glue: [], hooks: n, report: e }, i = ht(t.elements, 0, r);
  return r.glue.forEach((o) => o()), {
    name: t.name,
    items: i,
    background: hn(t, n),
    transition: dn(t.slide?.transition),
    notes: t.slide?.notes?.trim() ? t.slide.notes : void 0,
    key: t.slide?.id
  };
}
function bn(t, n, e, r) {
  const i = Math.min(e / Math.max(t, 1), r / Math.max(n, 1));
  return { scale: i, dx: (e - t * i) / 2, dy: (r - n * i) / 2 };
}
export {
  bn as fitInto,
  _ as mediaOf,
  kn as pageToSlide,
  pn as remapPageStops,
  S as toColor,
  dn as transitionOf,
  rt as typefaceOf
};
