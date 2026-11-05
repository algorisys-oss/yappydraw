import { Q as ct, R as O, S as St, T as $t, U as It, V as Tt, W as Rt, X as zt, Y as Pt, Z as Lt, _ as Ft, $ as Et, a0 as Ot, a1 as Xt, a2 as Ht, a3 as Dt, a4 as Bt, a5 as nt, a6 as Yt, a7 as Wt, a8 as Ut, a9 as Nt, aa as jt, ab as dt, ac as ft, ad as Zt, ae as Vt, af as Gt, ag as _t, ah as qt, ai as Jt, aj as Kt, ak as Qt, al as tn, am as nn } from "./index-CcU7GLMU.js";
import { t as en } from "./anim-map-D7T1mIAM.js";
import { p as B, c as q, t as X, a as rn } from "./custgeom-Cly4AfIX.js";
const Y = (t) => "#" + t.map((n) => n.toString(16).padStart(2, "0")).join("");
function on(t) {
  const n = t.trim().toLowerCase(), e = n.match(/^#([0-9a-f]{8})$/);
  if (e) return parseInt(e[1].slice(6), 16) / 255;
  const r = n.match(/^#([0-9a-f]{4})$/);
  if (r) return parseInt(r[1][3] + r[1][3], 16) / 255;
  const o = n.match(/^(?:rgba?|hsla?)\(([^)]*)\)$/);
  if (o) {
    const c = o[1].split(/[\s,/]+/).filter(Boolean);
    if (c.length >= 4) return et(c[3]);
  }
  const i = n.match(/\/\s*([\d.]+%?)\s*\)$/);
  return i ? et(i[1]) : 1;
}
const et = (t) => {
  const n = t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
};
function $(t, n = 1) {
  if (!t) return null;
  const e = O(t);
  if (!e) return null;
  const r = on(t) * n;
  return r <= 0 ? null : r < 0.999 ? { hex: Y(e), alpha: r } : { hex: Y(e) };
}
const ut = (t) => St(t).split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Calibri", V = {
  hachure: "ltUpDiag",
  zigzag: "ltUpDiag",
  "zigzag-line": "ltUpDiag",
  dashed: "dashUpDiag",
  "cross-hatch": "diagCross",
  dots: "pct20"
};
function sn(t, n) {
  const e = t.fillStyle || "solid";
  if ((e === "linear" || e === "radial" || e === "conic") && (t.gradientStops?.length ?? 0) > 0) {
    const o = t.gradientStops.map((i) => ({ pos: Math.max(0, Math.min(1, i.offset)), color: $(i.color, n) ?? { hex: "#000000", alpha: 0 } }));
    return e === "linear" ? { kind: "linear", stops: o, angle: t.gradientDirection ?? 45, scaled: !0 } : { kind: "radial", stops: o };
  }
  const r = $(t.backgroundColor, n);
  return r ? V[e] ? { kind: "pattern", preset: V[e], color: r } : { kind: "solid", color: r } : { kind: "none" };
}
function ht(t) {
  if (t.strokeStyle === "dotted") return "sysDot";
  if (t.strokeStyle === "dashed") return "dash";
  if (Array.isArray(t.strokeDashArray) && t.strokeDashArray.length >= 2) {
    const [n] = t.strokeDashArray;
    return n <= (t.strokeWidth || 2) * 1.5 ? "sysDot" : "dash";
  }
}
function N(t, n, e = !1) {
  const r = $(t.strokeColor, n);
  if (!r || !(t.strokeWidth > 0)) return null;
  const o = t.strokeLineCap === "butt" ? "flat" : t.strokeLineCap === "square" ? "sq" : "rnd";
  return {
    width: t.strokeWidth,
    color: r,
    dash: ht(t),
    cap: e ? o : void 0,
    join: t.strokeLineJoin === "miter" ? "miter" : t.strokeLineJoin === "bevel" ? "bevel" : "round"
  };
}
function rt(t, n, e) {
  if (!t) return;
  const r = n / Math.max(e, 0.5), o = r <= 2.5 ? "sm" : r <= 4 ? "med" : "lg";
  return { type: t === "triangle" ? "triangle" : t === "dot" || t === "circle" ? "oval" : t === "diamond" || t === "diamondFilled" ? "diamond" : "arrow", size: o };
}
const J = (t, n) => t === "center" ? "ctr" : t === "right" ? "r" : t === "left" ? "l" : n, pt = (t) => t === "top" ? "t" : t === "bottom" ? "b" : "ctr";
function K(t, n) {
  return t.split(`
`).map((e) => ({ runs: e ? [{ text: e }] : [], align: n }));
}
function an(t) {
  const n = { "lower-alpha": "alphaLc", "upper-alpha": "alphaUc", "lower-roman": "romanLc", "upper-roman": "romanUc" }[t.listNumberStyle ?? ""] ?? "arabic", e = { paren: "ParenR", parens: "ParenBoth", none: "Plain" }[t.listNumberSuffix ?? ""] ?? "Period";
  return n + e;
}
let E;
function ln(t, n) {
  if (E === void 0 && (E = typeof document < "u" ? document.createElement("canvas").getContext("2d") : null), E)
    return E.font = n, E.measureText(t).width;
  const e = Number(/(\d+(?:\.\d+)?)px/.exec(n)?.[1] ?? 16);
  return t.length * e * 0.6;
}
function cn(t, n, e, r) {
  const o = t.listLevel || 0, i = { bullet: t.listType === "ordered" ? "num" : "char", level: o };
  if (i.bullet === "num") {
    const a = an(t);
    a !== "arabicPeriod" && (i.numType = a), !(e && e.level === o && e.scheme === a && (t.listIndex || 1) === e.index + 1) && (t.listIndex || 1) > 1 && (i.startAt = t.listIndex);
  } else t.listMarker && t.listMarker !== "•" && (i.bulletChar = t.listMarker);
  if (t.listMarkerColor) {
    const a = $(t.listMarkerColor, n);
    a && (i.bulletColor = a);
  }
  t.listMarkerScale && t.listMarkerScale !== 1 && (i.bulletScale = t.listMarkerScale);
  const c = nn(t), d = r(t);
  return i.marL = d, i.indent = c - d, i;
}
function mt(t, n, e, r) {
  const o = [];
  let i = { runs: [], align: n }, c = !1, d = null;
  const a = Qt(ln, t, r), s = () => {
    o.push(i), i = { runs: [], align: n }, c = !1;
  };
  for (const l of t)
    String(l.text ?? "").split(`
`).forEach((p, u) => {
      if (u > 0 && s(), l.fontSize && !c && (i.endSize = l.fontSize), !p) return;
      c || (c = !0, l.paragraphSpaceBefore && (i.spaceBefore = l.paragraphSpaceBefore), l.paragraphAlign && (i.align = J(l.paragraphAlign, n ?? "l")), l.listType && l.listType !== "none" && Object.assign(i, cn(l, e, d, a)), d = i.bullet === "num" ? { level: i.level ?? 0, scheme: i.numType ?? "arabicPeriod", index: l.listIndex || 1 } : null);
      const h = { text: p };
      if (l.bold && (h.bold = !0), l.italic && (h.italic = !0), l.underline && (h.underline = !0), l.strikethrough && (h.strike = !0), l.color) {
        const g = $(l.color, e);
        g && (h.color = g);
      }
      l.fontSize && (h.size = l.fontSize), l.fontFamily && (h.font = ut(l.fontFamily)), i.runs.push(h);
    });
  return s(), o;
}
function Q(t, n, e) {
  const r = $(t.textColor || t.strokeColor || "#000000", n) ?? void 0;
  return {
    size: e,
    color: r,
    font: ut(t.fontFamily),
    bold: jt(t.fontWeight) >= 600 ? !0 : void 0,
    italic: Nt(t.fontStyle) === "italic" ? !0 : void 0
  };
}
const xt = (t) => Jt(t) / Kt;
function dn(t, n) {
  const e = t.richText && t.richText.length > 0, r = J(t.textAlign, e ? "ctr" : "l");
  return {
    paragraphs: e ? mt(t.richText, r, n, { fontSize: t.fontSize || 20, fontFamily: t.fontFamily || "sans-serif" }) : K(t.text || "", r),
    anchor: pt(t.verticalAlign),
    insets: { l: 4, t: 4, r: 4, b: 4 },
    wrap: !t.autoResize,
    lineSpacing: xt(t),
    defaults: Q(t, n, t.fontSize || 20),
    ...t.textFit === "shrink" && !t.autoResize && { shrink: dt(ft(), t, "text") }
  };
}
function gt(t, n) {
  const e = t.richContainerText && t.richContainerText.length > 0;
  if (!e && !t.containerText) return;
  const r = J(t.textAlign, "ctr");
  return {
    paragraphs: e ? mt(t.richContainerText, r, n, { fontSize: t.fontSize || 28, fontFamily: t.fontFamily || "hand-drawn" }) : K(t.containerText, r),
    anchor: pt(t.verticalAlign),
    insets: { l: 10, t: 4, r: 10, b: 4 },
    wrap: !0,
    lineSpacing: xt(t),
    defaults: Q(t, n, t.fontSize || 16),
    ...t.textFit === "shrink" && { shrink: dt(ft(), t, "label") }
  };
}
function fn(t, n, e) {
  const r = [], o = Math.abs(n) / 2, i = Math.abs(e) / 2, c = (a, s, l) => {
    const f = X(B(a), o, i);
    if (f.length === 0) return;
    const p = s, u = { fill: p.noFill ? !1 : void 0, stroke: p.noStroke ? !1 : void 0 };
    if (l) {
      r.push({ cmds: f, ...u });
      return;
    }
    let h = [];
    for (const g of f)
      g.op === "M" && h.length && (r.push({ cmds: h, ...u }), h = []), h.push(g);
    h.length && r.push({ cmds: h, ...u });
  }, d = (a) => {
    const s = (l) => Math.round(l * 1e3) / 1e3;
    switch (a.type) {
      case "rect": {
        const l = Math.min(Math.abs(a.w), Math.abs(a.h)) / 2, [f, p, u, h] = (Array.isArray(a.r) ? a.r : [a.r || 0, a.r || 0, a.r || 0, a.r || 0]).map((M) => Math.max(0, Math.min(M || 0, l))), g = (M, C, R) => M ? ` A ${s(M)} ${s(M)} 0 0 1 ${s(C)} ${s(R)}` : "", { x: y, y: v } = a, m = a.w, w = a.h;
        c(`M ${y + f} ${v} H ${y + m - p}${g(p, y + m, v + p)} V ${v + w - u}${g(u, y + m - u, v + w)} H ${y + h}${g(h, y, v + w - h)} V ${v + f}${g(f, y + f, v)} Z`, a, !1);
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
        a.shapes.forEach(d);
        break;
    }
  };
  return d(t), r;
}
function un(t) {
  if (t.warp || t.points && t.points.length) return null;
  if (t.type === "circle") return { kind: "preset", prst: "ellipse" };
  if (t.type === "rectangle") {
    const [n, e, r, o] = Zt(t);
    if (!n && !e && !r && !o) return { kind: "preset", prst: "rect" };
    if (n === e && e === r && r === o) {
      const i = Math.min(Math.abs(t.width), Math.abs(t.height));
      return i > 0 ? { kind: "preset", prst: "roundRect", adj: { adj: Math.min(5e4, n / i * 1e5) } } : null;
    }
  }
  return null;
}
const hn = /* @__PURE__ */ new Set(["umlClass", "umlInterface", "qrCode", "video", "codeBlock"]), pn = /* @__PURE__ */ new Set(["fineliner", "inkbrush", "marker", "ink"]), mn = /* @__PURE__ */ new Set(["text", "richtext", "image", "line", "arrow"]);
function xn(t) {
  const n = t;
  if (hn.has(t.type) || t.clipMaskId || t.shadowEnabled || t.glowEnabled || (t.featherRadius ?? 0) > 0 || t.blendMode && t.blendMode !== "normal" || t.shearX || t.shearY || zt(t) || Pt(t) || Lt(t) || Ft(t) || t.appearance && (t.appearance.fills?.length ?? 0) + (t.appearance.strokes?.length ?? 0) > 0) return !0;
  const e = t.fillStyle;
  if (e === "image" || e === "mesh" || e === "pattern" || t.backgroundImage || t.curvedText || (t.type === "text" || t.type === "richtext") && (t.verticalText || (n.charTransforms?.length ?? 0) > 0)) return !0;
  if (t.type === "image") {
    if (t.warp || t.pixelEffect) return !0;
    const r = t;
    if ((r.filterBrightness ?? 100) !== 100 || (r.filterContrast ?? 100) !== 100 || (r.filterSaturate ?? 100) !== 100 || (r.filterBlur ?? 0) || (r.filterHueRotate ?? 0) || (r.filterInvert ?? 0) || (r.filterSepia ?? 0) || (r.filterGrayscale ?? 0)) return !0;
  }
  return !1;
}
function G(t) {
  const n = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(t);
  if (!n) return null;
  try {
    const e = n[2] ? atob(n[3]) : decodeURIComponent(n[3]), r = new Uint8Array(e.length);
    for (let o = 0; o < e.length; o++) r[o] = e.charCodeAt(o) & 255;
    return { bytes: r, mime: (n[1] || "").toLowerCase() };
  } catch {
    return null;
  }
}
function H(t) {
  if (!t) return null;
  const n = G(t);
  if (n && n.mime === "image/png") return { bytes: n.bytes, ext: "png" };
  if (n && (n.mime === "image/jpeg" || n.mime === "image/jpg")) return { bytes: n.bytes, ext: "jpeg" };
  if (n && n.mime === "image/gif") return { bytes: n.bytes, ext: "gif" };
  const e = ct(t);
  if (!e || !e.naturalWidth) return null;
  try {
    const r = document.createElement("canvas");
    r.width = e.naturalWidth, r.height = e.naturalHeight, r.getContext("2d").drawImage(e, 0, 0);
    const o = G(r.toDataURL("image/png"));
    return o ? { bytes: o.bytes, ext: "png" } : null;
  } catch {
    return null;
  }
}
const S = (t) => t.name || t.type;
function F(t, n) {
  const e = Math.abs(t.width), r = Math.abs(t.height), o = Math.min(t.x, t.x + t.width) - n.ox, i = Math.min(t.y, t.y + t.height) - n.oy;
  return { x: o, y: i, w: e, h: r, rot: t.angle ? t.angle * 180 / Math.PI : void 0, flipH: !!t.flipX || void 0, flipV: !!t.flipY || void 0 };
}
function W(t, n, e) {
  const r = n.hooks.rasterize(t), o = r ? H(r.dataURL) : null;
  return !r || !o ? [] : (n.report.pictures++, [{ kind: "picture", id: n.nextId++, name: e, x: r.x - n.ox, y: r.y - n.oy, w: r.width, h: r.height, media: o }]);
}
function gn(t, n) {
  const e = H(t.dataURL);
  if (!e) return W([t], n, S(t));
  let r;
  if (t.crop) {
    const i = t.dataURL ? ct(t.dataURL) : null, c = i?.naturalWidth, d = i?.naturalHeight;
    if (c && d) {
      const a = t.crop;
      r = { l: a.x / c, t: a.y / d, r: 1 - (a.x + a.width) / c, b: 1 - (a.y + a.height) / d };
    }
  }
  const o = (t.opacity ?? 100) / 100;
  return n.report.native++, [{ kind: "picture", id: n.nextId++, name: S(t), ...F(t, n), media: e, crop: r, alpha: o < 1 ? o : void 0 }];
}
function yn(t, n, e, r) {
  const o = gt(t, r);
  if (!o) return [];
  const i = t.fontSize || 16, c = (t.containerText || "").split(`
`), d = Math.max(1, ...c.map((l) => l.length)), a = Math.max(40, d * i * 0.6 + 24), s = Math.max(i * 1.6, c.length * i * 1.25 + 8);
  return o.wrap = !1, o.anchor = "ctr", o.paragraphs.forEach((l) => {
    l.align = "ctr";
  }), [{
    kind: "shape",
    id: e.nextId++,
    name: `${S(t)} label`,
    textBox: !0,
    x: n.x - e.ox - a / 2,
    y: n.y - e.oy - s / 2,
    w: a,
    h: s,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: o
  }];
}
function kn(t, n, e) {
  const r = t.x + t.w / 2, o = t.y + t.h / 2, i = (t.rot || 0) * Math.PI / 180, c = [[0, -t.h / 2], [-t.w / 2, 0], [0, t.h / 2], [t.w / 2, 0]], d = n.x - e.ox, a = n.y - e.oy;
  for (let s = 0; s < 4; s++) {
    let [l, f] = c[s];
    t.flipH && (l = -l), t.flipV && (f = -f);
    const p = r + l * Math.cos(i) - f * Math.sin(i), u = o + l * Math.sin(i) + f * Math.cos(i);
    if (Math.hypot(p - d, u - a) <= 2) return s;
  }
  return -1;
}
function bn(t, n, e) {
  const r = e.x - n.x, o = e.y - n.y, i = Math.hypot(r, o);
  if (!(i > 0)) return !1;
  const c = (s, l) => Math.abs((s - n.x) * o - (l - n.y) * r) / i, d = (s, l) => ((s - n.x) * r + (l - n.y) * o) / (i * i), a = (s, l) => c(s, l) <= 0.5 && d(s, l) >= -0.01 && d(s, l) <= 1.01;
  return t.every((s) => s.op === "Z" ? !1 : s.op === "C" ? a(s.x1, s.y1) && a(s.x2, s.y2) && a(s.x, s.y) : a(s.x, s.y));
}
function wn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = N(t, e, !0), o = Bt(t), i = [];
  if (r) {
    const c = t.type === "arrow", d = c ? t.startArrowhead : null, a = c ? t.endArrowhead || (t.startArrowhead ? null : "arrow") : null, s = { ...r, head: rt(d, nt(t, "start"), t.strokeWidth), tail: rt(a, nt(t, "end"), t.strokeWidth) };
    if (!o.d || bn(B(o.d), o.start, o.end)) {
      const { start: l, end: f } = o, p = {
        kind: "connector",
        id: n.nextId++,
        name: S(t),
        x: Math.min(l.x, f.x) - n.ox,
        y: Math.min(l.y, f.y) - n.oy,
        w: Math.abs(f.x - l.x),
        h: Math.abs(f.y - l.y),
        flipH: f.x < l.x || void 0,
        flipV: f.y < l.y || void 0,
        geom: { kind: "preset", prst: "straightConnector1" },
        line: s
      }, u = (h, g) => {
        const y = h?.elementId ? n.ids.get(h.elementId) : void 0;
        if (!y) return;
        const v = kn(y.item, g, n);
        return v >= 0 ? { id: y.id, idx: v } : void 0;
      };
      n.glue.push(() => {
        p.start = u(t.startBinding, l), p.end = u(t.endBinding, f);
      }), i.push(p);
    } else {
      const l = B(o.d), f = q(l);
      if (f) {
        const p = Math.max(f.maxX - f.minX, 0.01), u = Math.max(f.maxY - f.minY, 0.01);
        i.push({
          kind: "shape",
          id: n.nextId++,
          name: S(t),
          x: f.minX - n.ox,
          y: f.minY - n.oy,
          w: p,
          h: u,
          geom: { kind: "custom", paths: [{ cmds: X(l, -f.minX, -f.minY), fill: !1 }] },
          fill: { kind: "none" },
          line: s
        });
      }
    }
    n.report.native++;
  }
  return i.push(...yn(t, o.mid, n, e)), i;
}
function vn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = Yt(t.points), o = N(t, e, !0);
  if (r.length < 2 || !o) return [];
  o.cap = "rnd", o.join = "round";
  const i = r.map((p) => p.x), c = r.map((p) => p.y), d = Math.min(...i), a = Math.min(...c), s = Math.max(Math.max(...i) - d, 0.01), l = Math.max(Math.max(...c) - a, 0.01), f = r.map((p, u) => ({ op: u ? "L" : "M", x: p.x - d, y: p.y - a }));
  return n.report.native++, [{
    kind: "shape",
    id: n.nextId++,
    name: S(t),
    x: t.x + d - n.ox,
    y: t.y + a - n.oy,
    w: s,
    h: l,
    rot: t.angle ? t.angle * 180 / Math.PI : void 0,
    geom: { kind: "custom", paths: [{ cmds: f, fill: !1 }] },
    fill: { kind: "none" },
    line: o
  }];
}
function Mn(t, n) {
  const e = (t.opacity ?? 100) / 100;
  if (!(t.text || t.richText && t.richText.length > 0)) return [];
  n.report.native++;
  const o = $(t.backgroundColor, e);
  return [{
    kind: "shape",
    id: n.nextId++,
    name: S(t),
    ...F(t, n),
    textBox: !0,
    geom: { kind: "preset", prst: "rect" },
    fill: o ? { kind: "solid", color: o } : { kind: "none" },
    line: null,
    text: dn(t, e)
  }];
}
const Cn = (t) => {
  const n = t && /matrix\(([^)]+)\)/.exec(t), e = n ? n[1].split(/[\s,]+/).map(Number) : [];
  return e.length === 6 && e.every(Number.isFinite) ? e : [1, 0, 0, 1, 0, 0];
}, ot = (t, n, e) => ({ x: t[0] * n + t[2] * e + t[4], y: t[1] * n + t[3] * e + t[5] });
function An(t) {
  const n = tn.generator(), e = (o) => {
    for (const i of n.toPaths(o))
      t.save(), i.fill && i.fill !== "none" && (!i.stroke || i.stroke === "none") ? (t.fillStyle = i.fill, t.fillPath(i.d)) : i.stroke && i.stroke !== "none" && i.strokeWidth > 0 && (t.strokeStyle = i.stroke, t.lineWidth = i.strokeWidth, t.strokePath(i.d)), t.restore();
    return o;
  }, r = { generator: n, draw: e, getDefaultOptions: () => n.defaultOptions };
  for (const o of ["line", "rectangle", "ellipse", "circle", "linearPath", "polygon", "arc", "curve", "path"])
    r[o] = (...i) => e(n[o](...i));
  return r;
}
function Sn(t) {
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
    fillStyle: V[n] ? "solid" : t.fillStyle
  }, r = new Vt();
  try {
    const s = document.createElement("canvas");
    Gt(An(r), s.getContext("2d"), e, !1, 1, r);
  } catch {
    return null;
  }
  if (r.failed) return null;
  const o = /* @__PURE__ */ new Map();
  for (const s of Array.from(r.defs.children)) s.id && o.set(s.id, s);
  const i = (s, l) => {
    const f = o.get(s.replace(/^url\(#|\)$/g, ""));
    if (!f) return null;
    const p = Array.from(f.children).map((u) => ({ pos: +(u.getAttribute("offset") || 0), color: $(u.getAttribute("stop-color")) ?? { hex: "#000000", alpha: 0 } }));
    if (!p.length) return null;
    if (f.tagName.toLowerCase() === "lineargradient") {
      const u = ot(l, +f.getAttribute("x1"), +f.getAttribute("y1")), h = ot(l, +f.getAttribute("x2"), +f.getAttribute("y2"));
      return { kind: "linear", x1: u.x, y1: u.y, x2: h.x, y2: h.y, stops: p };
    }
    return { kind: "radial", x1: 0, y1: 0, x2: 0, y2: 0, stops: p };
  }, c = [];
  let d = "ok";
  const a = (s) => {
    for (const l of Array.from(s.children)) {
      if (d !== "ok") return;
      const f = l.tagName.toLowerCase();
      if (f === "g") {
        if (l.getAttribute("clip-path")) {
          d = "picture";
          return;
        }
        a(l);
        continue;
      }
      if (f === "text" || f === "image") {
        d = "picture";
        return;
      }
      let p = null;
      if (f === "path") p = l.getAttribute("d");
      else if (f === "rect") {
        const M = +l.getAttribute("x"), C = +l.getAttribute("y"), R = +l.getAttribute("width"), I = +l.getAttribute("height");
        p = `M ${M} ${C} L ${M + R} ${C} L ${M + R} ${C + I} L ${M} ${C + I} Z`;
      } else {
        d = "fail";
        return;
      }
      const u = Cn(l.getAttribute("transform")), h = rn(B(p || ""), u);
      if (!h.length) continue;
      const g = l.getAttribute("fill"), y = l.getAttribute("stroke"), v = !!g && g.startsWith("url("), m = +(l.getAttribute("fill-opacity") ?? 1), w = +(l.getAttribute("stroke-opacity") ?? 1);
      c.push({
        cmds: h,
        fill: g && g !== "none" && !v ? g : null,
        grad: v ? i(g, u) : null,
        stroke: y && y !== "none" ? y : null,
        fillAlpha: Number.isFinite(m) ? m : 1,
        strokeAlpha: Number.isFinite(w) ? w : 1,
        width: +(l.getAttribute("stroke-width") || 1) * Math.sqrt(Math.abs(u[0] * u[3] - u[1] * u[2])),
        dash: !!l.getAttribute("stroke-dasharray"),
        evenOdd: l.getAttribute("fill-rule") === "evenodd"
      });
    }
  };
  return a(r.root), d === "ok" ? c : d === "picture" ? "picture" : null;
}
const it = (t, n) => {
  if (!t || !n) return !1;
  const e = O(t), r = O(n);
  return !!e && !!r && e[0] === r[0] && e[1] === r[1] && e[2] === r[2];
};
function $n(t, n, e) {
  const r = t.stops.map((h) => ({ pos: h.pos, color: e < 1 ? { ...h.color, alpha: (h.color.alpha ?? 1) * e } : h.color }));
  if (t.kind === "radial") return { kind: "radial", stops: r };
  const o = t.x2 - t.x1, i = t.y2 - t.y1, c = Math.hypot(o, i);
  if (!(c > 0)) return { kind: "solid", color: r[r.length - 1].color };
  const d = o / c, a = i / c, s = (n.minX + n.maxX) / 2, l = (n.minY + n.maxY) / 2, f = (Math.abs((n.maxX - n.minX) * d) + Math.abs((n.maxY - n.minY) * a)) / 2;
  if (!(f > 0)) return { kind: "solid", color: r[0].color };
  const p = (h) => ((t.x1 + o * h - s) * d + (t.y1 + i * h - l) * a + f) / (2 * f), u = [...r].sort((h, g) => h.pos - g.pos).map((h) => ({ pos: p(h.pos), color: h.color }));
  return { kind: "linear", angle: Math.atan2(i, o) * 180 / Math.PI, stops: yt(u) };
}
function yt(t) {
  if (t.length < 2) return t.map((e) => ({ ...e, pos: Math.max(0, Math.min(1, e.pos)) }));
  const n = (e) => {
    if (e <= t[0].pos) return t[0].color;
    for (let r = 1; r < t.length; r++) {
      const o = t[r - 1], i = t[r];
      if (e <= i.pos) return Xn(o.color, i.color, i.pos > o.pos ? (e - o.pos) / (i.pos - o.pos) : 0);
    }
    return t[t.length - 1].color;
  };
  return [{ pos: 0, color: n(0) }, ...t.filter((e) => e.pos > 0 && e.pos < 1), { pos: 1, color: n(1) }];
}
function _(t) {
  if (t.fill === !1) return [t];
  const n = [];
  for (const o of t.cmds)
    (o.op === "M" || !n.length) && n.push([]), n[n.length - 1].push(o);
  if (n.every((o) => o[o.length - 1].op === "Z")) return [t];
  const r = [{ cmds: n.flatMap((o) => o[o.length - 1].op === "Z" ? o : [...o, { op: "Z" }]), fill: t.fill, stroke: !1 }];
  return t.stroke !== !1 && r.push({ cmds: t.cmds, fill: !1, stroke: t.stroke }), r;
}
const U = (t) => JSON.stringify(t.cmds);
function In(t, n) {
  const e = (t.opacity ?? 100) / 100, r = F(t, n), o = gt(t, e);
  let i = un(t);
  if (!i) {
    const d = Wt(t), a = d ? fn(d, t.width, t.height) : [], s = Sn(t);
    if (s === "picture") return null;
    if (s && s.length) {
      const l = Math.min(t.x, t.x + t.width), f = Math.min(t.y, t.y + t.height), p = a.length ? a.filter((m) => m.fill !== !1).map((m) => X(m.cmds, l, f)) : null, u = !!ht(t), h = ["linear", "radial", "conic"].includes(t.fillStyle);
      if (!s.every((m) => (!m.grad || h) && m.fillAlpha >= 1 && m.strokeAlpha >= 1 && (!m.fill || it(m.fill, t.backgroundColor)) && (!m.stroke || it(m.stroke, t.strokeColor) && Math.abs(m.width - t.strokeWidth) < 0.75 && m.dash === u))) {
        const m = Rn(t, s, r, o, n, e, p);
        return m ? [m] : null;
      }
      const y = [], v = (m) => X(m, -l, -f);
      for (let m = 0; m < s.length; m++) {
        const w = s[m], M = s[m + 1], C = !!((w.fill || w.grad) && !w.stroke && M && M.stroke && !M.fill && !M.grad && U(M) === U(w)), R = !!w.stroke || C;
        if (w.fill || w.grad) {
          const I = kt(w, p);
          if (!I) return null;
          I.length === 1 && I[0] === w.cmds ? y.push(..._({ cmds: v(w.cmds), stroke: R ? void 0 : !1 })) : (y.push(...I.map((L) => ({ cmds: v(L), stroke: !1 }))), R && y.push({ cmds: v(w.cmds), fill: !1 }));
        } else
          y.push({ cmds: v(w.cmds), fill: !1, stroke: R ? void 0 : !1 });
        C && m++;
      }
      i = { kind: "custom", paths: y };
    } else if (a.length)
      i = { kind: "custom", paths: a.flatMap(_) };
    else return null;
  }
  const c = {
    kind: "shape",
    id: n.nextId++,
    name: S(t),
    ...r,
    geom: i,
    fill: sn(t, e),
    line: N(t, e),
    text: o
  };
  return n.ids.set(t.id, { id: c.id, item: c }), n.report.native++, [c];
}
const Tn = (t) => t.map((n) => n.op === "Z" ? "Z" : n.op === "C" ? `C ${n.x1} ${n.y1} ${n.x2} ${n.y2} ${n.x} ${n.y}` : `${n.op} ${n.x} ${n.y}`).join(" ");
let j = null;
const D = 28;
function Z(t, n, e) {
  j ??= document.createElement("canvas").getContext("2d");
  const r = [];
  if (!j) return r;
  const o = t.map((i) => new Path2D(Tn(i)));
  for (let i = 0; i < D; i++) for (let c = 0; c < D; c++) {
    const d = e.minX + (c + 0.5) / D * (e.maxX - e.minX), a = e.minY + (i + 0.5) / D * (e.maxY - e.minY);
    r.push(o.some((s) => j.isPointInPath(s, d, a, n)));
  }
  return r;
}
const st = (t, n) => t.reduce((e, r, o) => e + (r !== n[o] ? 1 : 0), 0) / Math.max(1, t.length);
function kt(t, n) {
  if (t.evenOdd) return [t.cmds];
  const e = q(t.cmds);
  if (!e) return [t.cmds];
  const r = Z([t.cmds], "nonzero", e);
  return st(r, Z([t.cmds], "evenodd", e)) === 0 ? [t.cmds] : n && st(r, Z(n, "evenodd", e)) <= 0.03 ? n : null;
}
function Rn(t, n, e, r, o, i, c) {
  const d = [];
  for (let a = 0; a < n.length; a++) {
    const s = n[a], l = n[a + 1], f = !!((s.fill || s.grad) && !s.stroke && l && l.stroke && !l.fill && !l.grad && U(l) === U(s)), p = f ? l : s, u = q(s.cmds);
    if (!u) continue;
    const h = Math.max(u.maxX - u.minX, 0.01), g = Math.max(u.maxY - u.minY, 0.01), y = $(s.fill, i * s.fillAlpha), v = s.grad ? $n(s.grad, u, i) : y ? { kind: "solid", color: y } : { kind: "none" }, m = $(p.stroke, i * p.strokeAlpha), w = m ? { width: p.width, color: m, dash: p.dash ? "dash" : void 0, join: "round", cap: "rnd" } : null, M = !!(s.fill || s.grad), C = (I) => X(I, -u.minX, -u.minY);
    let R;
    if (M) {
      const I = kt(s, c);
      if (!I) return null;
      R = I.length === 1 && I[0] === s.cmds ? _({ cmds: C(s.cmds), stroke: m ? void 0 : !1 }) : [...I.map((L) => ({ cmds: C(L), stroke: !1 })), ...m ? [{ cmds: C(s.cmds), fill: !1 }] : []];
    } else R = [{ cmds: C(s.cmds), fill: !1, stroke: m ? void 0 : !1 }];
    d.push({
      kind: "shape",
      id: o.nextId++,
      name: `${S(t)} part`,
      x: u.minX - o.ox,
      y: u.minY - o.oy,
      w: h,
      h: g,
      geom: { kind: "custom", paths: R },
      fill: v,
      line: w
    }), f && a++;
  }
  return r && d.push({
    kind: "shape",
    id: o.nextId++,
    name: `${S(t)} label`,
    textBox: !0,
    x: e.x,
    y: e.y,
    w: e.w,
    h: e.h,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: r
  }), o.report.native++, { kind: "group", id: o.nextId++, name: S(t), ...e, children: d };
}
const at = 6;
function zn(t, n) {
  if (t.angle || t.flipX || t.flipY) return null;
  const e = (t.opacity ?? 100) / 100, r = t.tableCols ?? 3, o = t.tableRows ?? 3, i = t.tableHeaders !== !1, c = i ? o + 1 : o, d = t.tableColWidths?.length === r ? t.tableColWidths : Et(r), a = t.tableRowHeights?.length === c ? t.tableRowHeights : Ot(c), s = t.tableColOrder?.length === r ? t.tableColOrder : Array.from({ length: r }, (x, b) => b), l = t.tableData ?? Xt(c, r), f = F(t, n), p = d.reduce((x, b) => x + b, 0) || 1, u = a.reduce((x, b) => x + b, 0) || 1, h = N(t, e), g = t.fontSize ?? 14, y = Q(t, e, g), v = $(t.tableHeaderTextColor, e) ?? y?.color, m = (x) => {
    const b = $(x, e);
    return b ? { kind: "solid", color: b } : { kind: "none" };
  }, w = (x) => {
    if (i && x === 0) return m(t.tableHeaderColor);
    const b = (i ? x - 1 : x) % 2 === 1;
    return m(b && t.tableAltRowColor ? t.tableAltRowColor : t.tableRowColor || t.tableAltRowColor);
  }, M = (x, b, T) => {
    const A = _t(t.tableCellBorders, x, b)?.[T], z = A ? qt(A.style) : 0, k = A && z > 0 ? $(A.color, e) : null;
    return k ? { width: z, color: k } : void 0;
  }, C = (x, b, T) => {
    const [A, z, k] = T === "top" ? [x - 1, b, "bottom"] : T === "bottom" ? [x + 1, b, "top"] : T === "left" ? [x, b - 1, "right"] : [x, b + 1, "left"];
    return M(x, b, T) ?? M(A, z, k) ?? h;
  }, R = t.tableMergedCells ?? [], I = (x, b) => R.find((T) => x >= T.startRow && x <= T.endRow && b >= T.startCol && b <= T.endCol), L = [];
  for (let x = 0; x < c; x++) {
    const b = i && x === 0, T = [];
    for (let A = 0; A < r; A++) {
      const z = s[A], k = I(x, A), wt = k ? k.startRow : x, vt = k ? k.endRow : x, Mt = k ? k.startCol : A, Ct = k ? k.endCol : A, P = {
        fill: w(k ? k.startRow : x),
        borders: { t: C(wt, A, "top"), b: C(vt, A, "bottom"), l: C(x, Mt, "left"), r: C(x, Ct, "right") }
      };
      if (k && (x !== k.startRow || A !== k.startCol)) {
        A > k.startCol && (P.hMerge = !0), x > k.startRow && (P.vMerge = !0), T.push(P);
        continue;
      }
      k && (P.gridSpan = k.endCol - k.startCol + 1, P.rowSpan = k.endRow - k.startRow + 1);
      const At = b ? l[0]?.[z] ?? `Col ${z + 1}` : Ht(l[x]?.[z] ?? "", Dt(t.tableCellFormats, x, A)), tt = t.tableColAlignments?.[z] ?? "center";
      P.text = {
        paragraphs: K(String(At), tt === "left" ? "l" : tt === "right" ? "r" : "ctr"),
        anchor: t.tableVerticalAlign === "top" ? "t" : t.tableVerticalAlign === "bottom" ? "b" : "ctr",
        insets: { l: at, r: at, t: 4, b: 4 },
        wrap: !0,
        defaults: b ? { ...y, bold: !0, color: v } : y
      }, T.push(P);
    }
    L.push({ h: a[x] / u * f.h, cells: T });
  }
  return n.report.native++, {
    kind: "table",
    id: n.nextId++,
    name: S(t),
    x: f.x,
    y: f.y,
    w: f.w,
    h: f.h,
    cols: s.map((x) => d[x] / p * f.w),
    rows: L,
    firstRow: i || void 0,
    bandRow: !!t.tableAltRowColor || void 0
  };
}
function Pn(t, n) {
  const e = t.videoURL;
  if (!e) return null;
  const r = Ut(e);
  let o;
  if (/^data:/i.test(e)) {
    const c = G(e), d = c ? Rt(c.mime) : null;
    if (!c || !d) return null;
    o = { file: { bytes: c.bytes, ext: d } };
  } else if (t.videoProvider === "direct" && /^https?:\/\//i.test(e))
    o = { file: null, url: e };
  else {
    if (!/^https?:\/\//i.test(e)) return null;
    const c = W([t], n, S(t));
    return c[0] && !c[0].link && (c[0].link = { kind: "url", url: e }), c;
  }
  let i = H(t.videoPosterDataURL || t.videoPosterURL) ?? void 0;
  if (!i) {
    const c = n.hooks.rasterize([t]);
    i = c && H(c.dataURL) || void 0;
  }
  return n.report.native++, [{
    kind: "media",
    id: n.nextId++,
    name: S(t),
    ...F(t, n),
    audio: r,
    ...o,
    poster: i,
    autoplay: t.videoAutoplay || void 0,
    loop: t.videoLoop || void 0,
    muted: t.videoMuted || void 0
  }];
}
function Ln(t, n) {
  if (t.type === "video") {
    const e = Pn(t, n);
    if (e) return e;
  }
  if (xn(t)) return W([t], n, S(t));
  try {
    if (t.type === "chart")
      return n.report.native++, [{ kind: "chart", id: n.nextId++, name: S(t), ...F(t, n), chart: It(t.chart) }];
    if (t.type === "table") {
      const e = zn(t, n);
      if (e) return [e];
    }
    if (t.type === "text" || t.type === "richtext") return Mn(t, n);
    if (t.type === "image") return gn(t, n);
    if (t.type === "line" || t.type === "arrow") return wn(t, n);
    if (pn.has(t.type)) return vn(t, n);
    if (!mn.has(t.type)) {
      const e = In(t, n);
      if (e) return e;
    }
  } catch {
  }
  return W([t], n, S(t));
}
function bt(t, n, e) {
  const r = [];
  let o = 0;
  const i = (c) => {
    const d = c.groupIds ?? [];
    return d.length > n ? d[d.length - 1 - n] : void 0;
  };
  for (; o < t.length; ) {
    const c = i(t[o]);
    if (!c) {
      let s = Ln(t[o], e);
      const l = Hn(t[o].link);
      if (l) for (const u of s) u.link = l;
      const f = t[o].altText?.trim(), p = !!t[o].decorative;
      s.length > 1 && (e.animTargets && t[o].animations?.length || f || p) && (s = [{ kind: "group", id: e.nextId++, name: S(t[o]), ...lt(s), children: s }]), s.length === 1 && (f && (s[0].descr = f), p && (s[0].decorative = !0)), e.animTargets && s.length === 1 && e.animTargets.set(t[o].id, s[0].id), r.push(...s), o++;
      continue;
    }
    let d = o;
    for (; d < t.length && i(t[d]) === c; ) d++;
    const a = bt(t.slice(o, d), n + 1, e);
    if (a.length > 1) {
      const s = lt(a), l = { kind: "group", id: e.nextId++, name: t[o].groupNames?.[c] || "Group", ...s, children: a };
      if (r.push(l), e.animTargets) for (const f of t.slice(o, d)) e.animTargets.set(f.id, l.id);
    } else r.push(...a);
    o = d;
  }
  return r;
}
function lt(t) {
  let n = 1 / 0, e = 1 / 0, r = -1 / 0, o = -1 / 0;
  for (const i of t)
    n = Math.min(n, i.x), e = Math.min(e, i.y), r = Math.max(r, i.x + i.w), o = Math.max(o, i.y + i.h);
  return { x: n, y: e, w: Math.max(0, r - n), h: Math.max(0, o - e) };
}
function Fn(t) {
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
    default: {
      const e = /^(wipe|cover|uncover)-(left|right|up|down)$/.exec(t.type);
      if (e) return { kind: e[1] === "uncover" ? "pull" : e[1], dir: e[2][0], durationMs: n };
      const r = /^split-(horizontal|vertical)-(out|in)$/.exec(t.type);
      return r ? { kind: "split", orient: r[1] === "vertical" ? "vert" : "horz", inward: r[2] === "in" || void 0, durationMs: n } : void 0;
    }
  }
}
function En(t, n) {
  const e = t.slide;
  if (!e) {
    const d = $(t.background);
    return d ? { kind: "solid", color: d } : void 0;
  }
  const r = e.fillStyle || "solid", o = !e.backgroundImage && (!e.canvasTexture || e.canvasTexture === "none");
  if (o && r === "solid")
    return { kind: "solid", color: $(e.backgroundColor === "transparent" ? "#ffffff" : e.backgroundColor || "#ffffff") ?? { hex: "#ffffff" } };
  if (o && (r === "linear" || r === "radial") && (e.gradientStops?.length ?? 0) > 0) {
    const d = e.gradientDirection || 0, a = e.gradientStops.map((s) => ({ pos: s.offset, color: $(s.color) ?? { hex: "#ffffff" } }));
    return r === "radial" ? { kind: "radial", stops: a } : { kind: "linear", stops: On(a, d, t.w, t.h), angle: d };
  }
  const i = n.rasterizeBackground?.(e), c = i ? H(i) : null;
  return c ? { kind: "image", media: c } : { kind: "solid", color: $(e.backgroundColor) ?? { hex: "#ffffff" } };
}
function On(t, n, e, r) {
  const o = n * Math.PI / 180, i = Math.hypot(e, r) / 2, c = (Math.abs(e * Math.cos(o)) + Math.abs(r * Math.sin(o))) / 2;
  if (!(c > 0) || t.length < 2) return t;
  const d = [...t].sort((a, s) => a.pos - s.pos).map((a) => ({ pos: (-i + 2 * i * a.pos + c) / (2 * c), color: a.color }));
  return yt(d);
}
function Xn(t, n, e) {
  const r = O(t.hex), o = O(n.hex), i = [0, 1, 2].map((s) => Math.round(r[s] + (o[s] - r[s]) * e)), c = t.alpha ?? 1, d = n.alpha ?? 1, a = c + (d - c) * e;
  return a < 0.999 ? { hex: Y(i), alpha: a } : { hex: Y(i) };
}
function Hn(t) {
  const n = Tt(t);
  if (n.kind === "url") return { kind: "url", url: n.url };
  if (n.kind === "slide") return { kind: "slide", key: n.slideId };
  if (n.kind === "action") return { kind: "action", action: n.action };
}
function Dn(t) {
  return {
    ...t?.hidden && { hidden: !0 },
    ...t?.advanceAfter && t.advanceAfter > 0 && { advanceAfterMs: t.advanceAfter },
    ...t?.section && { section: t.section }
  };
}
function Nn(t, n, e) {
  const r = { ox: t.x, oy: t.y, nextId: 2, ids: /* @__PURE__ */ new Map(), glue: [], hooks: n, report: e, ...t.layers && { animTargets: /* @__PURE__ */ new Map() } }, o = bt(t.elements, 0, r);
  r.glue.forEach((c) => c());
  const i = t.layers && r.animTargets ? Bn(t.elements, t.layers, r.animTargets, e) : [];
  return {
    name: t.name,
    items: o,
    background: En(t, n),
    transition: Fn(t.slide?.transition),
    notes: t.slide?.notes?.trim() ? t.slide.notes : void 0,
    key: t.slide?.id,
    ...Dn(t.slide),
    ...i.length && { anims: i }
  };
}
function Bn(t, n, e, r) {
  const o = $t(t.filter((a) => !a.id.includes("@page")), n), i = [];
  let c = 0;
  for (const a of o) {
    const s = a.animation.trigger;
    if (s === "with-prev" || s === "after-prev") {
      const l = i[i.length - 1];
      !l || l.skip ? c++ : l.steps.push(a);
    } else s === "on-load" || s === "on-click" ? i.push({ load: s === "on-load", skip: !1, steps: [a] }) : (i.push({ load: !1, skip: !0, steps: [] }), c++);
  }
  const d = [];
  for (const a of [...i.filter((s) => s.load && !s.skip), ...i.filter((s) => !s.load && !s.skip)]) {
    const s = /* @__PURE__ */ new Set();
    a.steps.forEach((l, f) => {
      const p = e.get(l.elementId), u = f === 0 ? a.load ? "with" : "click" : l.animation.trigger === "after-prev" ? "after" : "with", h = p !== void 0 ? en(l.animation, p, u) : null;
      if (!h) {
        c++;
        return;
      }
      const g = `${p}|${h.cls}|${h.effect}`;
      s.has(g) || (s.add(g), d.push(h));
    });
  }
  return c && (r.animsSkipped = (r.animsSkipped ?? 0) + c), d;
}
function jn(t, n, e, r) {
  const o = Math.min(e / Math.max(t, 1), r / Math.max(n, 1));
  return { scale: o, dx: (e - t * o) / 2, dy: (r - n * o) / 2 };
}
export {
  jn as fitInto,
  H as mediaOf,
  Nn as pageToSlide,
  On as remapPageStops,
  Dn as showFields,
  $ as toColor,
  Fn as transitionOf,
  ut as typefaceOf
};
