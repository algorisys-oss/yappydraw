import { O as ct, Q as E, R as St, S as $t, T as It, U as Tt, V as Rt, W as zt, X as Pt, Y as Ft, Z as Ot, _ as Et, $ as Lt, a0 as Xt, a1 as Ht, a2 as Bt, a3 as tt, a4 as Dt, a5 as Yt, a6 as Wt, a7 as Ut, a8 as dt, a9 as ft, aa as Nt, ab as jt, ac as Zt, ad as Vt, ae as Gt, af as _t, ag as qt, ah as Jt, ai as Kt, aj as Qt } from "./index-trzxrRhC.js";
import { t as tn } from "./anim-map-D7T1mIAM.js";
import { p as B, c as G, t as L, a as nn } from "./custgeom-BFpu9xFE.js";
const D = (t) => "#" + t.map((n) => n.toString(16).padStart(2, "0")).join("");
function en(t) {
  const n = t.trim().toLowerCase(), e = n.match(/^#([0-9a-f]{8})$/);
  if (e) return parseInt(e[1].slice(6), 16) / 255;
  const r = n.match(/^#([0-9a-f]{4})$/);
  if (r) return parseInt(r[1][3] + r[1][3], 16) / 255;
  const o = n.match(/^(?:rgba?|hsla?)\(([^)]*)\)$/);
  if (o) {
    const c = o[1].split(/[\s,/]+/).filter(Boolean);
    if (c.length >= 4) return nt(c[3]);
  }
  const i = n.match(/\/\s*([\d.]+%?)\s*\)$/);
  return i ? nt(i[1]) : 1;
}
const nt = (t) => {
  const n = t.endsWith("%") ? parseFloat(t) / 100 : parseFloat(t);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
};
function S(t, n = 1) {
  if (!t) return null;
  const e = E(t);
  if (!e) return null;
  const r = en(t) * n;
  return r <= 0 ? null : r < 0.999 ? { hex: D(e), alpha: r } : { hex: D(e) };
}
const ut = (t) => St(t).split(",")[0].trim().replace(/^['"]|['"]$/g, "") || "Calibri", j = {
  hachure: "ltUpDiag",
  zigzag: "ltUpDiag",
  "zigzag-line": "ltUpDiag",
  dashed: "dashUpDiag",
  "cross-hatch": "diagCross",
  dots: "pct20"
};
function rn(t, n) {
  const e = t.fillStyle || "solid";
  if ((e === "linear" || e === "radial" || e === "conic") && (t.gradientStops?.length ?? 0) > 0) {
    const o = t.gradientStops.map((i) => ({ pos: Math.max(0, Math.min(1, i.offset)), color: S(i.color, n) ?? { hex: "#000000", alpha: 0 } }));
    return e === "linear" ? { kind: "linear", stops: o, angle: t.gradientDirection ?? 45, scaled: !0 } : { kind: "radial", stops: o };
  }
  const r = S(t.backgroundColor, n);
  return r ? j[e] ? { kind: "pattern", preset: j[e], color: r } : { kind: "solid", color: r } : { kind: "none" };
}
function ht(t) {
  if (t.strokeStyle === "dotted") return "sysDot";
  if (t.strokeStyle === "dashed") return "dash";
  if (Array.isArray(t.strokeDashArray) && t.strokeDashArray.length >= 2) {
    const [n] = t.strokeDashArray;
    return n <= (t.strokeWidth || 2) * 1.5 ? "sysDot" : "dash";
  }
}
function W(t, n, e = !1) {
  const r = S(t.strokeColor, n);
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
function et(t, n, e) {
  if (!t) return;
  const r = n / Math.max(e, 0.5), o = r <= 2.5 ? "sm" : r <= 4 ? "med" : "lg";
  return { type: t === "triangle" ? "triangle" : t === "dot" || t === "circle" ? "oval" : t === "diamond" || t === "diamondFilled" ? "diamond" : "arrow", size: o };
}
const _ = (t, n) => t === "center" ? "ctr" : t === "right" ? "r" : t === "left" ? "l" : n, pt = (t) => t === "top" ? "t" : t === "bottom" ? "b" : "ctr";
function q(t, n) {
  return t.split(`
`).map((e) => ({ runs: e ? [{ text: e }] : [], align: n }));
}
function on(t) {
  const n = { "lower-alpha": "alphaLc", "upper-alpha": "alphaUc", "lower-roman": "romanLc", "upper-roman": "romanUc" }[t.listNumberStyle ?? ""] ?? "arabic", e = { paren: "ParenR", parens: "ParenBoth", none: "Plain" }[t.listNumberSuffix ?? ""] ?? "Period";
  return n + e;
}
let O;
function sn(t, n) {
  if (O === void 0 && (O = typeof document < "u" ? document.createElement("canvas").getContext("2d") : null), O)
    return O.font = n, O.measureText(t).width;
  const e = Number(/(\d+(?:\.\d+)?)px/.exec(n)?.[1] ?? 16);
  return t.length * e * 0.6;
}
function an(t, n, e, r) {
  const o = t.listLevel || 0, i = { bullet: t.listType === "ordered" ? "num" : "char", level: o };
  if (i.bullet === "num") {
    const a = on(t);
    a !== "arabicPeriod" && (i.numType = a), !(e && e.level === o && e.scheme === a && (t.listIndex || 1) === e.index + 1) && (t.listIndex || 1) > 1 && (i.startAt = t.listIndex);
  } else t.listMarker && t.listMarker !== "•" && (i.bulletChar = t.listMarker);
  if (t.listMarkerColor) {
    const a = S(t.listMarkerColor, n);
    a && (i.bulletColor = a);
  }
  t.listMarkerScale && t.listMarkerScale !== 1 && (i.bulletScale = t.listMarkerScale);
  const c = Qt(t), f = r(t);
  return i.marL = f, i.indent = c - f, i;
}
function mt(t, n, e, r) {
  const o = [];
  let i = { runs: [], align: n }, c = !1, f = null;
  const a = Jt(sn, t, r), s = () => {
    o.push(i), i = { runs: [], align: n }, c = !1;
  };
  for (const l of t)
    String(l.text ?? "").split(`
`).forEach((p, u) => {
      if (u > 0 && s(), l.fontSize && !c && (i.endSize = l.fontSize), !p) return;
      c || (c = !0, l.paragraphSpaceBefore && (i.spaceBefore = l.paragraphSpaceBefore), l.paragraphAlign && (i.align = _(l.paragraphAlign, n ?? "l")), l.listType && l.listType !== "none" && Object.assign(i, an(l, e, f, a)), f = i.bullet === "num" ? { level: i.level ?? 0, scheme: i.numType ?? "arabicPeriod", index: l.listIndex || 1 } : null);
      const h = { text: p };
      if (l.bold && (h.bold = !0), l.italic && (h.italic = !0), l.underline && (h.underline = !0), l.strikethrough && (h.strike = !0), l.color) {
        const g = S(l.color, e);
        g && (h.color = g);
      }
      l.fontSize && (h.size = l.fontSize), l.fontFamily && (h.font = ut(l.fontFamily)), i.runs.push(h);
    });
  return s(), o;
}
function J(t, n, e) {
  const r = S(t.textColor || t.strokeColor || "#000000", n) ?? void 0;
  return {
    size: e,
    color: r,
    font: ut(t.fontFamily),
    bold: Ut(t.fontWeight) >= 600 ? !0 : void 0,
    italic: Wt(t.fontStyle) === "italic" ? !0 : void 0
  };
}
const xt = (t) => _t(t) / qt;
function ln(t, n) {
  const e = t.richText && t.richText.length > 0, r = _(t.textAlign, e ? "ctr" : "l");
  return {
    paragraphs: e ? mt(t.richText, r, n, { fontSize: t.fontSize || 20, fontFamily: t.fontFamily || "sans-serif" }) : q(t.text || "", r),
    anchor: pt(t.verticalAlign),
    insets: { l: 4, t: 4, r: 4, b: 4 },
    wrap: !t.autoResize,
    lineSpacing: xt(t),
    defaults: J(t, n, t.fontSize || 20),
    ...t.textFit === "shrink" && !t.autoResize && { shrink: dt(ft(), t, "text") }
  };
}
function gt(t, n) {
  const e = t.richContainerText && t.richContainerText.length > 0;
  if (!e && !t.containerText) return;
  const r = _(t.textAlign, "ctr");
  return {
    paragraphs: e ? mt(t.richContainerText, r, n, { fontSize: t.fontSize || 28, fontFamily: t.fontFamily || "hand-drawn" }) : q(t.containerText, r),
    anchor: pt(t.verticalAlign),
    insets: { l: 10, t: 4, r: 10, b: 4 },
    wrap: !0,
    lineSpacing: xt(t),
    defaults: J(t, n, t.fontSize || 16),
    ...t.textFit === "shrink" && { shrink: dt(ft(), t, "label") }
  };
}
function cn(t, n, e) {
  const r = [], o = Math.abs(n) / 2, i = Math.abs(e) / 2, c = (a, s, l) => {
    const d = L(B(a), o, i);
    if (d.length === 0) return;
    const p = s, u = { fill: p.noFill ? !1 : void 0, stroke: p.noStroke ? !1 : void 0 };
    if (l) {
      r.push({ cmds: d, ...u });
      return;
    }
    let h = [];
    for (const g of d)
      g.op === "M" && h.length && (r.push({ cmds: h, ...u }), h = []), h.push(g);
    h.length && r.push({ cmds: h, ...u });
  }, f = (a) => {
    const s = (l) => Math.round(l * 1e3) / 1e3;
    switch (a.type) {
      case "rect": {
        const l = Math.min(Math.abs(a.w), Math.abs(a.h)) / 2, [d, p, u, h] = (Array.isArray(a.r) ? a.r : [a.r || 0, a.r || 0, a.r || 0, a.r || 0]).map((v) => Math.max(0, Math.min(v || 0, l))), g = (v, C, R) => v ? ` A ${s(v)} ${s(v)} 0 0 1 ${s(C)} ${s(R)}` : "", { x: y, y: M } = a, m = a.w, w = a.h;
        c(`M ${y + d} ${M} H ${y + m - p}${g(p, y + m, M + p)} V ${M + w - u}${g(u, y + m - u, M + w)} H ${y + h}${g(h, y, M + w - h)} V ${M + d}${g(d, y + d, M)} Z`, a, !1);
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
function dn(t) {
  if (t.warp || t.points && t.points.length) return null;
  if (t.type === "circle") return { kind: "preset", prst: "ellipse" };
  if (t.type === "rectangle") {
    const [n, e, r, o] = Nt(t);
    if (!n && !e && !r && !o) return { kind: "preset", prst: "rect" };
    if (n === e && e === r && r === o) {
      const i = Math.min(Math.abs(t.width), Math.abs(t.height));
      return i > 0 ? { kind: "preset", prst: "roundRect", adj: { adj: Math.min(5e4, n / i * 1e5) } } : null;
    }
  }
  return null;
}
const fn = /* @__PURE__ */ new Set(["umlClass", "umlInterface", "qrCode", "video", "codeBlock"]), un = /* @__PURE__ */ new Set(["fineliner", "inkbrush", "marker", "ink"]), hn = /* @__PURE__ */ new Set(["text", "richtext", "image", "line", "arrow"]);
function pn(t) {
  const n = t;
  if (fn.has(t.type) || t.clipMaskId || t.shadowEnabled || t.glowEnabled || (t.featherRadius ?? 0) > 0 || t.blendMode && t.blendMode !== "normal" || t.shearX || t.shearY || Rt(t) || zt(t) || Pt(t) || Ft(t) || t.appearance && (t.appearance.fills?.length ?? 0) + (t.appearance.strokes?.length ?? 0) > 0) return !0;
  const e = t.fillStyle;
  if (e === "image" || e === "mesh" || e === "pattern" || t.backgroundImage || t.curvedText || (t.type === "text" || t.type === "richtext") && (t.verticalText || (n.charTransforms?.length ?? 0) > 0)) return !0;
  if (t.type === "image") {
    if (t.warp || t.pixelEffect) return !0;
    const r = t;
    if ((r.filterBrightness ?? 100) !== 100 || (r.filterContrast ?? 100) !== 100 || (r.filterSaturate ?? 100) !== 100 || (r.filterBlur ?? 0) || (r.filterHueRotate ?? 0) || (r.filterInvert ?? 0) || (r.filterSepia ?? 0) || (r.filterGrayscale ?? 0)) return !0;
  }
  return !1;
}
function rt(t) {
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
function K(t) {
  if (!t) return null;
  const n = rt(t);
  if (n && n.mime === "image/png") return { bytes: n.bytes, ext: "png" };
  if (n && (n.mime === "image/jpeg" || n.mime === "image/jpg")) return { bytes: n.bytes, ext: "jpeg" };
  if (n && n.mime === "image/gif") return { bytes: n.bytes, ext: "gif" };
  const e = ct(t);
  if (!e || !e.naturalWidth) return null;
  try {
    const r = document.createElement("canvas");
    r.width = e.naturalWidth, r.height = e.naturalHeight, r.getContext("2d").drawImage(e, 0, 0);
    const o = rt(r.toDataURL("image/png"));
    return o ? { bytes: o.bytes, ext: "png" } : null;
  } catch {
    return null;
  }
}
const I = (t) => t.name || t.type;
function X(t, n) {
  const e = Math.abs(t.width), r = Math.abs(t.height), o = Math.min(t.x, t.x + t.width) - n.ox, i = Math.min(t.y, t.y + t.height) - n.oy;
  return { x: o, y: i, w: e, h: r, rot: t.angle ? t.angle * 180 / Math.PI : void 0, flipH: !!t.flipX || void 0, flipV: !!t.flipY || void 0 };
}
function Z(t, n, e) {
  const r = n.hooks.rasterize(t), o = r ? K(r.dataURL) : null;
  return !r || !o ? [] : (n.report.pictures++, [{ kind: "picture", id: n.nextId++, name: e, x: r.x - n.ox, y: r.y - n.oy, w: r.width, h: r.height, media: o }]);
}
function mn(t, n) {
  const e = K(t.dataURL);
  if (!e) return Z([t], n, I(t));
  let r;
  if (t.crop) {
    const i = t.dataURL ? ct(t.dataURL) : null, c = i?.naturalWidth, f = i?.naturalHeight;
    if (c && f) {
      const a = t.crop;
      r = { l: a.x / c, t: a.y / f, r: 1 - (a.x + a.width) / c, b: 1 - (a.y + a.height) / f };
    }
  }
  const o = (t.opacity ?? 100) / 100;
  return n.report.native++, [{ kind: "picture", id: n.nextId++, name: I(t), ...X(t, n), media: e, crop: r, alpha: o < 1 ? o : void 0 }];
}
function xn(t, n, e, r) {
  const o = gt(t, r);
  if (!o) return [];
  const i = t.fontSize || 16, c = (t.containerText || "").split(`
`), f = Math.max(1, ...c.map((l) => l.length)), a = Math.max(40, f * i * 0.6 + 24), s = Math.max(i * 1.6, c.length * i * 1.25 + 8);
  return o.wrap = !1, o.anchor = "ctr", o.paragraphs.forEach((l) => {
    l.align = "ctr";
  }), [{
    kind: "shape",
    id: e.nextId++,
    name: `${I(t)} label`,
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
function gn(t, n, e) {
  const r = t.x + t.w / 2, o = t.y + t.h / 2, i = (t.rot || 0) * Math.PI / 180, c = [[0, -t.h / 2], [-t.w / 2, 0], [0, t.h / 2], [t.w / 2, 0]], f = n.x - e.ox, a = n.y - e.oy;
  for (let s = 0; s < 4; s++) {
    let [l, d] = c[s];
    t.flipH && (l = -l), t.flipV && (d = -d);
    const p = r + l * Math.cos(i) - d * Math.sin(i), u = o + l * Math.sin(i) + d * Math.cos(i);
    if (Math.hypot(p - f, u - a) <= 2) return s;
  }
  return -1;
}
function yn(t, n, e) {
  const r = e.x - n.x, o = e.y - n.y, i = Math.hypot(r, o);
  if (!(i > 0)) return !1;
  const c = (s, l) => Math.abs((s - n.x) * o - (l - n.y) * r) / i, f = (s, l) => ((s - n.x) * r + (l - n.y) * o) / (i * i), a = (s, l) => c(s, l) <= 0.5 && f(s, l) >= -0.01 && f(s, l) <= 1.01;
  return t.every((s) => s.op === "Z" ? !1 : s.op === "C" ? a(s.x1, s.y1) && a(s.x2, s.y2) && a(s.x, s.y) : a(s.x, s.y));
}
function kn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = W(t, e, !0), o = Bt(t), i = [];
  if (r) {
    const c = t.type === "arrow", f = c ? t.startArrowhead : null, a = c ? t.endArrowhead || (t.startArrowhead ? null : "arrow") : null, s = { ...r, head: et(f, tt(t, "start"), t.strokeWidth), tail: et(a, tt(t, "end"), t.strokeWidth) };
    if (!o.d || yn(B(o.d), o.start, o.end)) {
      const { start: l, end: d } = o, p = {
        kind: "connector",
        id: n.nextId++,
        name: I(t),
        x: Math.min(l.x, d.x) - n.ox,
        y: Math.min(l.y, d.y) - n.oy,
        w: Math.abs(d.x - l.x),
        h: Math.abs(d.y - l.y),
        flipH: d.x < l.x || void 0,
        flipV: d.y < l.y || void 0,
        geom: { kind: "preset", prst: "straightConnector1" },
        line: s
      }, u = (h, g) => {
        const y = h?.elementId ? n.ids.get(h.elementId) : void 0;
        if (!y) return;
        const M = gn(y.item, g, n);
        return M >= 0 ? { id: y.id, idx: M } : void 0;
      };
      n.glue.push(() => {
        p.start = u(t.startBinding, l), p.end = u(t.endBinding, d);
      }), i.push(p);
    } else {
      const l = B(o.d), d = G(l);
      if (d) {
        const p = Math.max(d.maxX - d.minX, 0.01), u = Math.max(d.maxY - d.minY, 0.01);
        i.push({
          kind: "shape",
          id: n.nextId++,
          name: I(t),
          x: d.minX - n.ox,
          y: d.minY - n.oy,
          w: p,
          h: u,
          geom: { kind: "custom", paths: [{ cmds: L(l, -d.minX, -d.minY), fill: !1 }] },
          fill: { kind: "none" },
          line: s
        });
      }
    }
    n.report.native++;
  }
  return i.push(...xn(t, o.mid, n, e)), i;
}
function bn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = Dt(t.points), o = W(t, e, !0);
  if (r.length < 2 || !o) return [];
  o.cap = "rnd", o.join = "round";
  const i = r.map((p) => p.x), c = r.map((p) => p.y), f = Math.min(...i), a = Math.min(...c), s = Math.max(Math.max(...i) - f, 0.01), l = Math.max(Math.max(...c) - a, 0.01), d = r.map((p, u) => ({ op: u ? "L" : "M", x: p.x - f, y: p.y - a }));
  return n.report.native++, [{
    kind: "shape",
    id: n.nextId++,
    name: I(t),
    x: t.x + f - n.ox,
    y: t.y + a - n.oy,
    w: s,
    h: l,
    rot: t.angle ? t.angle * 180 / Math.PI : void 0,
    geom: { kind: "custom", paths: [{ cmds: d, fill: !1 }] },
    fill: { kind: "none" },
    line: o
  }];
}
function wn(t, n) {
  const e = (t.opacity ?? 100) / 100;
  if (!(t.text || t.richText && t.richText.length > 0)) return [];
  n.report.native++;
  const o = S(t.backgroundColor, e);
  return [{
    kind: "shape",
    id: n.nextId++,
    name: I(t),
    ...X(t, n),
    textBox: !0,
    geom: { kind: "preset", prst: "rect" },
    fill: o ? { kind: "solid", color: o } : { kind: "none" },
    line: null,
    text: ln(t, e)
  }];
}
const Mn = (t) => {
  const n = t && /matrix\(([^)]+)\)/.exec(t), e = n ? n[1].split(/[\s,]+/).map(Number) : [];
  return e.length === 6 && e.every(Number.isFinite) ? e : [1, 0, 0, 1, 0, 0];
}, ot = (t, n, e) => ({ x: t[0] * n + t[2] * e + t[4], y: t[1] * n + t[3] * e + t[5] });
function vn(t) {
  const n = Kt.generator(), e = (o) => {
    for (const i of n.toPaths(o))
      t.save(), i.fill && i.fill !== "none" && (!i.stroke || i.stroke === "none") ? (t.fillStyle = i.fill, t.fillPath(i.d)) : i.stroke && i.stroke !== "none" && i.strokeWidth > 0 && (t.strokeStyle = i.stroke, t.lineWidth = i.strokeWidth, t.strokePath(i.d)), t.restore();
    return o;
  }, r = { generator: n, draw: e, getDefaultOptions: () => n.defaultOptions };
  for (const o of ["line", "rectangle", "ellipse", "circle", "linearPath", "polygon", "arc", "curve", "path"])
    r[o] = (...i) => e(n[o](...i));
  return r;
}
function Cn(t) {
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
    fillStyle: j[n] ? "solid" : t.fillStyle
  }, r = new jt();
  try {
    const s = document.createElement("canvas");
    Zt(vn(r), s.getContext("2d"), e, !1, 1, r);
  } catch {
    return null;
  }
  if (r.failed) return null;
  const o = /* @__PURE__ */ new Map();
  for (const s of Array.from(r.defs.children)) s.id && o.set(s.id, s);
  const i = (s, l) => {
    const d = o.get(s.replace(/^url\(#|\)$/g, ""));
    if (!d) return null;
    const p = Array.from(d.children).map((u) => ({ pos: +(u.getAttribute("offset") || 0), color: S(u.getAttribute("stop-color")) ?? { hex: "#000000", alpha: 0 } }));
    if (!p.length) return null;
    if (d.tagName.toLowerCase() === "lineargradient") {
      const u = ot(l, +d.getAttribute("x1"), +d.getAttribute("y1")), h = ot(l, +d.getAttribute("x2"), +d.getAttribute("y2"));
      return { kind: "linear", x1: u.x, y1: u.y, x2: h.x, y2: h.y, stops: p };
    }
    return { kind: "radial", x1: 0, y1: 0, x2: 0, y2: 0, stops: p };
  }, c = [];
  let f = "ok";
  const a = (s) => {
    for (const l of Array.from(s.children)) {
      if (f !== "ok") return;
      const d = l.tagName.toLowerCase();
      if (d === "g") {
        if (l.getAttribute("clip-path")) {
          f = "picture";
          return;
        }
        a(l);
        continue;
      }
      if (d === "text" || d === "image") {
        f = "picture";
        return;
      }
      let p = null;
      if (d === "path") p = l.getAttribute("d");
      else if (d === "rect") {
        const v = +l.getAttribute("x"), C = +l.getAttribute("y"), R = +l.getAttribute("width"), $ = +l.getAttribute("height");
        p = `M ${v} ${C} L ${v + R} ${C} L ${v + R} ${C + $} L ${v} ${C + $} Z`;
      } else {
        f = "fail";
        return;
      }
      const u = Mn(l.getAttribute("transform")), h = nn(B(p || ""), u);
      if (!h.length) continue;
      const g = l.getAttribute("fill"), y = l.getAttribute("stroke"), M = !!g && g.startsWith("url("), m = +(l.getAttribute("fill-opacity") ?? 1), w = +(l.getAttribute("stroke-opacity") ?? 1);
      c.push({
        cmds: h,
        fill: g && g !== "none" && !M ? g : null,
        grad: M ? i(g, u) : null,
        stroke: y && y !== "none" ? y : null,
        fillAlpha: Number.isFinite(m) ? m : 1,
        strokeAlpha: Number.isFinite(w) ? w : 1,
        width: +(l.getAttribute("stroke-width") || 1) * Math.sqrt(Math.abs(u[0] * u[3] - u[1] * u[2])),
        dash: !!l.getAttribute("stroke-dasharray"),
        evenOdd: l.getAttribute("fill-rule") === "evenodd"
      });
    }
  };
  return a(r.root), f === "ok" ? c : f === "picture" ? "picture" : null;
}
const it = (t, n) => {
  if (!t || !n) return !1;
  const e = E(t), r = E(n);
  return !!e && !!r && e[0] === r[0] && e[1] === r[1] && e[2] === r[2];
};
function An(t, n, e) {
  const r = t.stops.map((h) => ({ pos: h.pos, color: e < 1 ? { ...h.color, alpha: (h.color.alpha ?? 1) * e } : h.color }));
  if (t.kind === "radial") return { kind: "radial", stops: r };
  const o = t.x2 - t.x1, i = t.y2 - t.y1, c = Math.hypot(o, i);
  if (!(c > 0)) return { kind: "solid", color: r[r.length - 1].color };
  const f = o / c, a = i / c, s = (n.minX + n.maxX) / 2, l = (n.minY + n.maxY) / 2, d = (Math.abs((n.maxX - n.minX) * f) + Math.abs((n.maxY - n.minY) * a)) / 2;
  if (!(d > 0)) return { kind: "solid", color: r[0].color };
  const p = (h) => ((t.x1 + o * h - s) * f + (t.y1 + i * h - l) * a + d) / (2 * d), u = [...r].sort((h, g) => h.pos - g.pos).map((h) => ({ pos: p(h.pos), color: h.color }));
  return { kind: "linear", angle: Math.atan2(i, o) * 180 / Math.PI, stops: yt(u) };
}
function yt(t) {
  if (t.length < 2) return t.map((e) => ({ ...e, pos: Math.max(0, Math.min(1, e.pos)) }));
  const n = (e) => {
    if (e <= t[0].pos) return t[0].color;
    for (let r = 1; r < t.length; r++) {
      const o = t[r - 1], i = t[r];
      if (e <= i.pos) return On(o.color, i.color, i.pos > o.pos ? (e - o.pos) / (i.pos - o.pos) : 0);
    }
    return t[t.length - 1].color;
  };
  return [{ pos: 0, color: n(0) }, ...t.filter((e) => e.pos > 0 && e.pos < 1), { pos: 1, color: n(1) }];
}
function V(t) {
  if (t.fill === !1) return [t];
  const n = [];
  for (const o of t.cmds)
    (o.op === "M" || !n.length) && n.push([]), n[n.length - 1].push(o);
  if (n.every((o) => o[o.length - 1].op === "Z")) return [t];
  const r = [{ cmds: n.flatMap((o) => o[o.length - 1].op === "Z" ? o : [...o, { op: "Z" }]), fill: t.fill, stroke: !1 }];
  return t.stroke !== !1 && r.push({ cmds: t.cmds, fill: !1, stroke: t.stroke }), r;
}
const Y = (t) => JSON.stringify(t.cmds);
function Sn(t, n) {
  const e = (t.opacity ?? 100) / 100, r = X(t, n), o = gt(t, e);
  let i = dn(t);
  if (!i) {
    const f = Yt(t), a = f ? cn(f, t.width, t.height) : [], s = Cn(t);
    if (s === "picture") return null;
    if (s && s.length) {
      const l = Math.min(t.x, t.x + t.width), d = Math.min(t.y, t.y + t.height), p = a.length ? a.filter((m) => m.fill !== !1).map((m) => L(m.cmds, l, d)) : null, u = !!ht(t), h = ["linear", "radial", "conic"].includes(t.fillStyle);
      if (!s.every((m) => (!m.grad || h) && m.fillAlpha >= 1 && m.strokeAlpha >= 1 && (!m.fill || it(m.fill, t.backgroundColor)) && (!m.stroke || it(m.stroke, t.strokeColor) && Math.abs(m.width - t.strokeWidth) < 0.75 && m.dash === u))) {
        const m = In(t, s, r, o, n, e, p);
        return m ? [m] : null;
      }
      const y = [], M = (m) => L(m, -l, -d);
      for (let m = 0; m < s.length; m++) {
        const w = s[m], v = s[m + 1], C = !!((w.fill || w.grad) && !w.stroke && v && v.stroke && !v.fill && !v.grad && Y(v) === Y(w)), R = !!w.stroke || C;
        if (w.fill || w.grad) {
          const $ = kt(w, p);
          if (!$) return null;
          $.length === 1 && $[0] === w.cmds ? y.push(...V({ cmds: M(w.cmds), stroke: R ? void 0 : !1 })) : (y.push(...$.map((F) => ({ cmds: M(F), stroke: !1 }))), R && y.push({ cmds: M(w.cmds), fill: !1 }));
        } else
          y.push({ cmds: M(w.cmds), fill: !1, stroke: R ? void 0 : !1 });
        C && m++;
      }
      i = { kind: "custom", paths: y };
    } else if (a.length)
      i = { kind: "custom", paths: a.flatMap(V) };
    else return null;
  }
  const c = {
    kind: "shape",
    id: n.nextId++,
    name: I(t),
    ...r,
    geom: i,
    fill: rn(t, e),
    line: W(t, e),
    text: o
  };
  return n.ids.set(t.id, { id: c.id, item: c }), n.report.native++, [c];
}
const $n = (t) => t.map((n) => n.op === "Z" ? "Z" : n.op === "C" ? `C ${n.x1} ${n.y1} ${n.x2} ${n.y2} ${n.x} ${n.y}` : `${n.op} ${n.x} ${n.y}`).join(" ");
let U = null;
const H = 28;
function N(t, n, e) {
  U ??= document.createElement("canvas").getContext("2d");
  const r = [];
  if (!U) return r;
  const o = t.map((i) => new Path2D($n(i)));
  for (let i = 0; i < H; i++) for (let c = 0; c < H; c++) {
    const f = e.minX + (c + 0.5) / H * (e.maxX - e.minX), a = e.minY + (i + 0.5) / H * (e.maxY - e.minY);
    r.push(o.some((s) => U.isPointInPath(s, f, a, n)));
  }
  return r;
}
const st = (t, n) => t.reduce((e, r, o) => e + (r !== n[o] ? 1 : 0), 0) / Math.max(1, t.length);
function kt(t, n) {
  if (t.evenOdd) return [t.cmds];
  const e = G(t.cmds);
  if (!e) return [t.cmds];
  const r = N([t.cmds], "nonzero", e);
  return st(r, N([t.cmds], "evenodd", e)) === 0 ? [t.cmds] : n && st(r, N(n, "evenodd", e)) <= 0.03 ? n : null;
}
function In(t, n, e, r, o, i, c) {
  const f = [];
  for (let a = 0; a < n.length; a++) {
    const s = n[a], l = n[a + 1], d = !!((s.fill || s.grad) && !s.stroke && l && l.stroke && !l.fill && !l.grad && Y(l) === Y(s)), p = d ? l : s, u = G(s.cmds);
    if (!u) continue;
    const h = Math.max(u.maxX - u.minX, 0.01), g = Math.max(u.maxY - u.minY, 0.01), y = S(s.fill, i * s.fillAlpha), M = s.grad ? An(s.grad, u, i) : y ? { kind: "solid", color: y } : { kind: "none" }, m = S(p.stroke, i * p.strokeAlpha), w = m ? { width: p.width, color: m, dash: p.dash ? "dash" : void 0, join: "round", cap: "rnd" } : null, v = !!(s.fill || s.grad), C = ($) => L($, -u.minX, -u.minY);
    let R;
    if (v) {
      const $ = kt(s, c);
      if (!$) return null;
      R = $.length === 1 && $[0] === s.cmds ? V({ cmds: C(s.cmds), stroke: m ? void 0 : !1 }) : [...$.map((F) => ({ cmds: C(F), stroke: !1 })), ...m ? [{ cmds: C(s.cmds), fill: !1 }] : []];
    } else R = [{ cmds: C(s.cmds), fill: !1, stroke: m ? void 0 : !1 }];
    f.push({
      kind: "shape",
      id: o.nextId++,
      name: `${I(t)} part`,
      x: u.minX - o.ox,
      y: u.minY - o.oy,
      w: h,
      h: g,
      geom: { kind: "custom", paths: R },
      fill: M,
      line: w
    }), d && a++;
  }
  return r && f.push({
    kind: "shape",
    id: o.nextId++,
    name: `${I(t)} label`,
    textBox: !0,
    x: e.x,
    y: e.y,
    w: e.w,
    h: e.h,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    text: r
  }), o.report.native++, { kind: "group", id: o.nextId++, name: I(t), ...e, children: f };
}
const at = 6;
function Tn(t, n) {
  if (t.angle || t.flipX || t.flipY) return null;
  const e = (t.opacity ?? 100) / 100, r = t.tableCols ?? 3, o = t.tableRows ?? 3, i = t.tableHeaders !== !1, c = i ? o + 1 : o, f = t.tableColWidths?.length === r ? t.tableColWidths : Ot(r), a = t.tableRowHeights?.length === c ? t.tableRowHeights : Et(c), s = t.tableColOrder?.length === r ? t.tableColOrder : Array.from({ length: r }, (x, b) => b), l = t.tableData ?? Lt(c, r), d = X(t, n), p = f.reduce((x, b) => x + b, 0) || 1, u = a.reduce((x, b) => x + b, 0) || 1, h = W(t, e), g = t.fontSize ?? 14, y = J(t, e, g), M = S(t.tableHeaderTextColor, e) ?? y?.color, m = (x) => {
    const b = S(x, e);
    return b ? { kind: "solid", color: b } : { kind: "none" };
  }, w = (x) => {
    if (i && x === 0) return m(t.tableHeaderColor);
    const b = (i ? x - 1 : x) % 2 === 1;
    return m(b && t.tableAltRowColor ? t.tableAltRowColor : t.tableRowColor || t.tableAltRowColor);
  }, v = (x, b, T) => {
    const A = Vt(t.tableCellBorders, x, b)?.[T], z = A ? Gt(A.style) : 0, k = A && z > 0 ? S(A.color, e) : null;
    return k ? { width: z, color: k } : void 0;
  }, C = (x, b, T) => {
    const [A, z, k] = T === "top" ? [x - 1, b, "bottom"] : T === "bottom" ? [x + 1, b, "top"] : T === "left" ? [x, b - 1, "right"] : [x, b + 1, "left"];
    return v(x, b, T) ?? v(A, z, k) ?? h;
  }, R = t.tableMergedCells ?? [], $ = (x, b) => R.find((T) => x >= T.startRow && x <= T.endRow && b >= T.startCol && b <= T.endCol), F = [];
  for (let x = 0; x < c; x++) {
    const b = i && x === 0, T = [];
    for (let A = 0; A < r; A++) {
      const z = s[A], k = $(x, A), wt = k ? k.startRow : x, Mt = k ? k.endRow : x, vt = k ? k.startCol : A, Ct = k ? k.endCol : A, P = {
        fill: w(k ? k.startRow : x),
        borders: { t: C(wt, A, "top"), b: C(Mt, A, "bottom"), l: C(x, vt, "left"), r: C(x, Ct, "right") }
      };
      if (k && (x !== k.startRow || A !== k.startCol)) {
        A > k.startCol && (P.hMerge = !0), x > k.startRow && (P.vMerge = !0), T.push(P);
        continue;
      }
      k && (P.gridSpan = k.endCol - k.startCol + 1, P.rowSpan = k.endRow - k.startRow + 1);
      const At = b ? l[0]?.[z] ?? `Col ${z + 1}` : Xt(l[x]?.[z] ?? "", Ht(t.tableCellFormats, x, A)), Q = t.tableColAlignments?.[z] ?? "center";
      P.text = {
        paragraphs: q(String(At), Q === "left" ? "l" : Q === "right" ? "r" : "ctr"),
        anchor: t.tableVerticalAlign === "top" ? "t" : t.tableVerticalAlign === "bottom" ? "b" : "ctr",
        insets: { l: at, r: at, t: 4, b: 4 },
        wrap: !0,
        defaults: b ? { ...y, bold: !0, color: M } : y
      }, T.push(P);
    }
    F.push({ h: a[x] / u * d.h, cells: T });
  }
  return n.report.native++, {
    kind: "table",
    id: n.nextId++,
    name: I(t),
    x: d.x,
    y: d.y,
    w: d.w,
    h: d.h,
    cols: s.map((x) => f[x] / p * d.w),
    rows: F,
    firstRow: i || void 0,
    bandRow: !!t.tableAltRowColor || void 0
  };
}
function Rn(t, n) {
  if (pn(t)) return Z([t], n, I(t));
  try {
    if (t.type === "chart")
      return n.report.native++, [{ kind: "chart", id: n.nextId++, name: I(t), ...X(t, n), chart: It(t.chart) }];
    if (t.type === "table") {
      const e = Tn(t, n);
      if (e) return [e];
    }
    if (t.type === "text" || t.type === "richtext") return wn(t, n);
    if (t.type === "image") return mn(t, n);
    if (t.type === "line" || t.type === "arrow") return kn(t, n);
    if (un.has(t.type)) return bn(t, n);
    if (!hn.has(t.type)) {
      const e = Sn(t, n);
      if (e) return e;
    }
  } catch {
  }
  return Z([t], n, I(t));
}
function bt(t, n, e) {
  const r = [];
  let o = 0;
  const i = (c) => {
    const f = c.groupIds ?? [];
    return f.length > n ? f[f.length - 1 - n] : void 0;
  };
  for (; o < t.length; ) {
    const c = i(t[o]);
    if (!c) {
      let s = Rn(t[o], e);
      const l = En(t[o].link);
      if (l) for (const u of s) u.link = l;
      const d = t[o].altText?.trim(), p = !!t[o].decorative;
      s.length > 1 && (e.animTargets && t[o].animations?.length || d || p) && (s = [{ kind: "group", id: e.nextId++, name: I(t[o]), ...lt(s), children: s }]), s.length === 1 && (d && (s[0].descr = d), p && (s[0].decorative = !0)), e.animTargets && s.length === 1 && e.animTargets.set(t[o].id, s[0].id), r.push(...s), o++;
      continue;
    }
    let f = o;
    for (; f < t.length && i(t[f]) === c; ) f++;
    const a = bt(t.slice(o, f), n + 1, e);
    if (a.length > 1) {
      const s = lt(a), l = { kind: "group", id: e.nextId++, name: t[o].groupNames?.[c] || "Group", ...s, children: a };
      if (r.push(l), e.animTargets) for (const d of t.slice(o, f)) e.animTargets.set(d.id, l.id);
    } else r.push(...a);
    o = f;
  }
  return r;
}
function lt(t) {
  let n = 1 / 0, e = 1 / 0, r = -1 / 0, o = -1 / 0;
  for (const i of t)
    n = Math.min(n, i.x), e = Math.min(e, i.y), r = Math.max(r, i.x + i.w), o = Math.max(o, i.y + i.h);
  return { x: n, y: e, w: Math.max(0, r - n), h: Math.max(0, o - e) };
}
function zn(t) {
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
function Pn(t, n) {
  const e = t.slide;
  if (!e) {
    const f = S(t.background);
    return f ? { kind: "solid", color: f } : void 0;
  }
  const r = e.fillStyle || "solid", o = !e.backgroundImage && (!e.canvasTexture || e.canvasTexture === "none");
  if (o && r === "solid")
    return { kind: "solid", color: S(e.backgroundColor === "transparent" ? "#ffffff" : e.backgroundColor || "#ffffff") ?? { hex: "#ffffff" } };
  if (o && (r === "linear" || r === "radial") && (e.gradientStops?.length ?? 0) > 0) {
    const f = e.gradientDirection || 0, a = e.gradientStops.map((s) => ({ pos: s.offset, color: S(s.color) ?? { hex: "#ffffff" } }));
    return r === "radial" ? { kind: "radial", stops: a } : { kind: "linear", stops: Fn(a, f, t.w, t.h), angle: f };
  }
  const i = n.rasterizeBackground?.(e), c = i ? K(i) : null;
  return c ? { kind: "image", media: c } : { kind: "solid", color: S(e.backgroundColor) ?? { hex: "#ffffff" } };
}
function Fn(t, n, e, r) {
  const o = n * Math.PI / 180, i = Math.hypot(e, r) / 2, c = (Math.abs(e * Math.cos(o)) + Math.abs(r * Math.sin(o))) / 2;
  if (!(c > 0) || t.length < 2) return t;
  const f = [...t].sort((a, s) => a.pos - s.pos).map((a) => ({ pos: (-i + 2 * i * a.pos + c) / (2 * c), color: a.color }));
  return yt(f);
}
function On(t, n, e) {
  const r = E(t.hex), o = E(n.hex), i = [0, 1, 2].map((s) => Math.round(r[s] + (o[s] - r[s]) * e)), c = t.alpha ?? 1, f = n.alpha ?? 1, a = c + (f - c) * e;
  return a < 0.999 ? { hex: D(i), alpha: a } : { hex: D(i) };
}
function En(t) {
  const n = Tt(t);
  if (n.kind === "url") return { kind: "url", url: n.url };
  if (n.kind === "slide") return { kind: "slide", key: n.slideId };
  if (n.kind === "action") return { kind: "action", action: n.action };
}
function Ln(t) {
  return {
    ...t?.hidden && { hidden: !0 },
    ...t?.advanceAfter && t.advanceAfter > 0 && { advanceAfterMs: t.advanceAfter },
    ...t?.section && { section: t.section }
  };
}
function Yn(t, n, e) {
  const r = { ox: t.x, oy: t.y, nextId: 2, ids: /* @__PURE__ */ new Map(), glue: [], hooks: n, report: e, ...t.layers && { animTargets: /* @__PURE__ */ new Map() } }, o = bt(t.elements, 0, r);
  r.glue.forEach((c) => c());
  const i = t.layers && r.animTargets ? Xn(t.elements, t.layers, r.animTargets, e) : [];
  return {
    name: t.name,
    items: o,
    background: Pn(t, n),
    transition: zn(t.slide?.transition),
    notes: t.slide?.notes?.trim() ? t.slide.notes : void 0,
    key: t.slide?.id,
    ...Ln(t.slide),
    ...i.length && { anims: i }
  };
}
function Xn(t, n, e, r) {
  const o = $t(t.filter((a) => !a.id.includes("@page")), n), i = [];
  let c = 0;
  for (const a of o) {
    const s = a.animation.trigger;
    if (s === "with-prev" || s === "after-prev") {
      const l = i[i.length - 1];
      !l || l.skip ? c++ : l.steps.push(a);
    } else s === "on-load" || s === "on-click" ? i.push({ load: s === "on-load", skip: !1, steps: [a] }) : (i.push({ load: !1, skip: !0, steps: [] }), c++);
  }
  const f = [];
  for (const a of [...i.filter((s) => s.load && !s.skip), ...i.filter((s) => !s.load && !s.skip)]) {
    const s = /* @__PURE__ */ new Set();
    a.steps.forEach((l, d) => {
      const p = e.get(l.elementId), u = d === 0 ? a.load ? "with" : "click" : l.animation.trigger === "after-prev" ? "after" : "with", h = p !== void 0 ? tn(l.animation, p, u) : null;
      if (!h) {
        c++;
        return;
      }
      const g = `${p}|${h.cls}|${h.effect}`;
      s.has(g) || (s.add(g), f.push(h));
    });
  }
  return c && (r.animsSkipped = (r.animsSkipped ?? 0) + c), f;
}
function Wn(t, n, e, r) {
  const o = Math.min(e / Math.max(t, 1), r / Math.max(n, 1));
  return { scale: o, dx: (e - t * o) / 2, dy: (r - n * o) / 2 };
}
export {
  Wn as fitInto,
  K as mediaOf,
  Yn as pageToSlide,
  Fn as remapPageStops,
  Ln as showFields,
  S as toColor,
  zn as transitionOf,
  ut as typefaceOf
};
