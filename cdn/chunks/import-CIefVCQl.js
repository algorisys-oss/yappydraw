import { u as ii, b as ri, a as li, c as ai, i as ci } from "./browser-D4hpQp_u.js";
import { e as ui, s as ss, f as hi } from "./anim-map-D7T1mIAM.js";
import { aY as fi, aZ as Xt, aF as di, a_ as pi, aG as Ze, a$ as mi, b0 as os, U as gi, b1 as bi, b2 as xi, b3 as yi, b4 as ki, b5 as wi, N as Mi, q as vi, K as Si } from "./index-DEKxp5SH.js";
import { E as vt, i as Rn, c as Ci } from "./custgeom-yLdmoMSF.js";
const be = (t, e) => `<a:ln w="${t}" cmpd="sng"><a:solidFill><a:schemeClr val="${e}"/></a:solidFill></a:ln>`, Ee = "<a:ln><a:noFill/></a:ln>", jt = (t, e = "") => `<a:fill><a:solidFill><a:schemeClr val="${t}">${e}</a:schemeClr></a:solidFill></a:fill>`, ie = (t, e = !1) => `<a:tcTxStyle${e ? ' b="on"' : ""}><a:fontRef idx="minor"><a:prstClr val="black"/></a:fontRef><a:schemeClr val="${t}"/></a:tcTxStyle>`, Zt = (t) => `<a:tcBdr>${Object.entries(t).map(([e, n]) => `<a:${e}>${n}</a:${e}>`).join("")}</a:tcBdr>`;
function de(t, e) {
  const n = be(12700, "lt1"), s = `${ie("lt1", !0)}<a:tcStyle><a:tcBdr/>${jt(e)}</a:tcStyle>`;
  return `<a:tblStyle styleId="${t}" styleName="Medium Style 2"><a:wholeTbl>${ie("dk1")}<a:tcStyle>${Zt({ left: n, right: n, top: n, bottom: n, insideH: n, insideV: n })}${jt(e, '<a:tint val="20000"/>')}</a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${jt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${jt(e, '<a:tint val="40000"/>')}</a:tcStyle></a:band1V><a:band2V><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2V><a:lastCol>${s}</a:lastCol><a:firstCol>${s}</a:firstCol><a:lastRow>${ie("lt1", !0)}<a:tcStyle>${Zt({ top: be(38100, "lt1") })}${jt(e)}</a:tcStyle></a:lastRow><a:firstRow>${ie("lt1", !0)}<a:tcStyle>${Zt({ bottom: be(38100, "lt1") })}${jt(e)}</a:tcStyle></a:firstRow></a:tblStyle>`;
}
function Ne(t, e) {
  const n = be(12700, e);
  return `<a:tblStyle styleId="${t}" styleName="Light Style 1"><a:wholeTbl>${ie("tx1")}<a:tcStyle>${Zt({ left: Ee, right: Ee, top: n, bottom: n, insideH: Ee, insideV: Ee })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl><a:band1H><a:tcStyle><a:tcBdr/>${jt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H><a:band1V><a:tcStyle><a:tcBdr/>${jt(e, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1V><a:lastCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:lastCol><a:firstCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:firstCol><a:lastRow><a:tcTxStyle b="on"/><a:tcStyle>${Zt({ top: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:lastRow><a:firstRow><a:tcTxStyle b="on"/><a:tcStyle>${Zt({ bottom: n })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:firstRow></a:tblStyle>`;
}
function Pi(t) {
  const e = be(12700, "tx1");
  return `<a:tblStyle styleId="${t}" styleName="No Style, Table Grid"><a:wholeTbl>${ie("tx1")}<a:tcStyle>${Zt({ left: e, right: e, top: e, bottom: e, insideH: e, insideV: e })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle>`;
}
const Ai = {
  "{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}": (t) => de(t, "dk1"),
  "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}": (t) => de(t, "accent1"),
  "{21E4AEA4-8DFA-4A89-87EB-49C32662AFE0}": (t) => de(t, "accent2"),
  "{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}": (t) => de(t, "accent3"),
  "{7DF18680-E054-41AD-8BC1-D1AEF772440D}": (t) => de(t, "accent5"),
  "{9D7B26C5-4107-4FEC-AEDC-1716B250A1EF}": (t) => Ne(t, "tx1"),
  "{3B4B98B0-60AC-42C2-AFA5-B58CD77FA1E5}": (t) => Ne(t, "accent1"),
  "{0E3FDE45-AF77-4B5C-9715-49D594BDF05E}": (t) => Ne(t, "accent2"),
  "{C083E6E3-FA7D-4D7B-A595-EF9225AFEA82}": (t) => Ne(t, "accent3"),
  "{5940675A-B579-460E-94D1-54222C63F5DA}": Pi
}, $i = "http://schemas.openxmlformats.org/drawingml/2006/main";
function Oi(t) {
  const e = Ai[t.toUpperCase()];
  return e ? `<a:tblStyleLst xmlns:a="${$i}">${e(t.toUpperCase())}</a:tblStyleLst>` : null;
}
const Ie = (t) => t.colors?.length ? t.colors : di, St = (t, e) => Ie(t)[(e % Ie(t).length + Ie(t).length) % Ie(t).length];
function uo(t, e) {
  const n = /^#([0-9a-f]{6})$/i.exec(t);
  if (!n) return t;
  const s = parseInt(n[1], 16), o = Math.max(0, Math.min(0.85, e)), i = (r) => Math.round(r + (255 - r) * o).toString(16).padStart(2, "0");
  return `#${i(s >> 16 & 255)}${i(s >> 8 & 255)}${i(s & 255)}`;
}
function Ke(t, e, n) {
  const s = t.length;
  if (!s) return NaN;
  if (s === 1) return t[0];
  let o = n ? e * (s - 1) : e * (s + 1) - 1;
  o = Math.max(0, Math.min(s - 1, o));
  const i = Math.floor(o), r = o - i;
  return t[i] + (t[Math.min(s - 1, i + 1)] - t[i]) * r;
}
function Ti(t, e = !1) {
  const n = t.filter(Number.isFinite).sort((c, h) => c - h);
  if (!n.length) return null;
  const s = Ke(n, 0.25, e), o = Ke(n, 0.75, e), i = Ke(n, 0.5, !0), r = o - s, l = s - 1.5 * r, a = o + 1.5 * r, u = n.filter((c) => c >= l && c <= a);
  return { q1: s, median: i, q3: o, lo: u[0] ?? s, hi: u[u.length - 1] ?? o, mean: n.reduce((c, h) => c + h, 0) / n.length, outliers: n.filter((c) => c < l || c > a) };
}
function Ei(t, e = {}) {
  const n = t.filter(Number.isFinite);
  if (!n.length) return [];
  const s = Math.min(...n), o = Math.max(...n);
  let i;
  if (e.size && e.size > 0) i = e.size;
  else if (e.count && e.count > 0) i = (o - s) / e.count || 1;
  else {
    const a = n.reduce((c, h) => c + h, 0) / n.length;
    i = 3.5 * Math.sqrt(n.reduce((c, h) => c + (h - a) ** 2, 0) / Math.max(1, n.length - 1)) / Math.cbrt(n.length) || 1;
  }
  const r = Math.max(1, Math.min(500, e.count && !e.size ? e.count : Math.ceil((o - s) / i - 1e-9) || 1)), l = Array.from({ length: r }, (a, u) => {
    const c = s + i * u, h = s + i * (u + 1);
    return { label: `${u ? "(" : "["}${Xt(is(c))}, ${Xt(is(h))}]`, count: 0 };
  });
  for (const a of n) {
    let u = Math.ceil((a - s) / i - 1e-9) - 1;
    u = Math.max(0, Math.min(r - 1, u)), l[u].count++;
  }
  return l;
}
const is = (t) => Math.round(t * 1e6) / 1e6;
function Ni(t, e) {
  const n = /* @__PURE__ */ new Map();
  return e.forEach((s, o) => {
    const i = t[o] || String(o + 1);
    n.set(i, (n.get(i) ?? 0) + (s ?? 0));
  }), [...n].map(([s, o]) => ({ label: s, count: o }));
}
function Fn(t, e, n) {
  const o = [...e].reverse().map((r) => {
    let l = "";
    return t.map((a, u) => r[u] ? l = r[u] : l);
  }), i = [];
  return t.forEach((r, l) => {
    const a = n[l];
    if (a == null || !(a > 0)) return;
    const u = [...o.map((h) => h[l]), r].filter((h, d, m) => h !== "" || d < m.length - 1);
    for (; u.length > 1 && u[u.length - 1] === ""; ) u.pop();
    let c = i;
    for (const h of u) {
      let d = c.find((m) => m.name === h);
      d || (d = { name: h, value: 0, children: [] }, c.push(d)), d.value += a, c = d.children;
    }
  }), i;
}
function Ii(t, e) {
  const n = t.map(() => ({ x: e.x, y: e.y, w: 0, h: 0 })), s = t.reduce((u, c) => u + (c > 0 ? c : 0), 0);
  if (!(s > 0) || !(e.w > 0 && e.h > 0)) return n;
  const o = e.w * e.h / s, i = t.map((u, c) => c).filter((u) => t[u] > 0).sort((u, c) => t[c] - t[u]);
  let r = { ...e }, l = 0;
  const a = (u, c, h, d) => Math.max(d * c / (u * u), u * u / (d * h));
  for (; l < i.length; ) {
    const u = Math.min(r.w, r.h);
    if (!(u > 1e-9)) break;
    const c = u * u;
    let h = t[i[l]] * o, d = h, m = h, f = a(h, d, m, c), p = l + 1;
    for (; p < i.length; ) {
      const x = t[i[p]] * o, k = a(h + x, Math.max(d, x), Math.min(m, x), c);
      if (!(k <= f)) break;
      h += x, d = Math.max(d, x), m = Math.min(m, x), f = k, p++;
    }
    const g = h / u;
    let b = 0;
    for (const x of i.slice(l, p)) {
      const k = t[x] * o / g;
      n[x] = r.w >= r.h ? { x: r.x, y: r.y + b, w: g, h: k } : { x: r.x + b, y: r.y, w: k, h: g }, b += k;
    }
    r = r.w >= r.h ? { x: r.x + g, y: r.y, w: r.w - g, h: r.h } : { x: r.x, y: r.y + g, w: r.w, h: r.h - g }, l = p;
  }
  return n;
}
function Ri(t, e, n, s, o, i = fi) {
  const r = [];
  if (!(s > 4 && o > 4)) return r;
  const l = Math.max(8, Math.min(18, Math.min(s, o) * 0.045));
  let a = n + l * 0.6, u = n + o - l * 0.6;
  const c = e + l * 0.6, h = e + s - l * 0.6;
  t.title && (r.push({ op: "text", x: e + s / 2, y: a, text: t.title, size: l * 1.35, align: "center", baseline: "top", color: i.text, bold: !0 }), a += l * 2.1);
  const d = Fi(t);
  if (d.length && t.legend && t.legend !== "none") {
    const f = l * 0.8, p = l * 0.5, g = (w) => f + p + w.length * l * 0.55 + l, b = d.reduce((w, M) => w + g(M.label), 0), x = t.legend === "top" ? a : u - l * 1.5;
    let k = e + (s - b) / 2;
    for (const w of d)
      r.push({ op: "rect", x: k, y: x + (l * 1.5 - f) / 2, w: f, h: f, fill: w.color }), r.push({ op: "text", x: k + f + p, y: x + l * 0.75, text: w.label, size: l, align: "left", baseline: "middle", color: i.muted }), k += g(w.label);
    t.legend === "top" ? a += l * 2 : u -= l * 2;
  }
  const m = { l: c, t: a, r: h, b: u };
  switch (t.kind) {
    case "waterfall":
      Bi(t, r, m, l, i);
      break;
    case "funnel":
      Di(t, r, m, l, i);
      break;
    case "histogram":
    case "pareto":
      Li(t, r, m, l, i);
      break;
    case "boxWhisker":
      zi(t, r, m, l, i);
      break;
    case "treemap":
      ji(t, r, m, l);
      break;
    case "sunburst":
      Ui(t, r, m, l);
      break;
  }
  return r;
}
function Fi(t) {
  switch (t.kind) {
    case "waterfall":
      return [{ label: "Increase", color: St(t, 0) }, { label: "Decrease", color: St(t, 1) }, { label: "Total", color: St(t, 2) }];
    case "boxWhisker":
      return t.series.map((e, n) => ({ label: e.name || `Series ${n + 1}`, color: St(t, n) }));
    case "treemap":
    case "sunburst":
      return Fn(t.categories, t.levels ?? [], t.series[0]?.values ?? []).map((e, n) => ({ label: e.name, color: St(t, n) }));
    default:
      return [];
  }
}
function Bn(t, e, n, s, o, i, r, l = {}) {
  const a = pi(n, s), u = [];
  for (let M = a.min; M <= a.max + a.step * 1e-6 && u.length < 100; M += a.step) u.push(Math.round(M * 1e9) / 1e9);
  const c = Math.max(...u.map((M) => Xt(M).length)) * i * 0.6 + i * 0.6, h = { l: o.l + c, t: o.t + i * 0.5, r: o.r - (l.pct ? i * 2.8 : 0), b: o.b - i * 1.6 }, d = h.r - h.l, m = h.b - h.t, f = a.max - a.min || 1, p = (M) => h.b - (M - a.min) / f * m;
  for (const M of u)
    l.gridlines !== !1 && t.push({ op: "line", points: [[h.l, p(M)], [h.r, p(M)]], stroke: r.grid, width: 1 }), t.push({ op: "text", x: h.l - i * 0.4, y: p(M), text: Xt(M), size: i, align: "right", baseline: "middle", color: r.muted });
  if (l.pct) for (let M = 0; M <= 100; M += 20)
    t.push({ op: "text", x: h.r + i * 0.4, y: h.b - M / 100 * m, text: `${M}%`, size: i, align: "left", baseline: "middle", color: r.muted });
  const g = Math.max(1, e.length), b = d / g, x = Math.max(...e.map((M) => M.length), 1) * i * 0.55 + i * 0.6, k = Math.max(1, Math.ceil(x / Math.max(1, b)));
  e.forEach((M, S) => {
    S % k || t.push({ op: "text", x: h.l + b * (S + 0.5), y: h.b + i * 0.4, text: M, size: i, align: "center", baseline: "top", color: r.muted });
  });
  const w = p(Math.min(Math.max(0, a.min), a.max));
  return { plot: h, band: b, vpos: p, zero: w, ok: d > 4 && m > 4 };
}
function Bi(t, e, n, s, o) {
  const i = t.series[0]?.values ?? [], r = new Set(t.subtotals ?? []);
  let l = 0, a = 0, u = 0;
  const c = i.map((m, f) => {
    const p = m ?? 0, g = r.has(f) ? 0 : l, b = r.has(f) ? p : l + p;
    return l = b, a = Math.min(a, g, b), u = Math.max(u, g, b), { from: g, to: b, total: r.has(f), v: p };
  }), h = Bn(e, i.map((m, f) => t.categories[f] || String(f + 1)), a, u, n, s, o);
  if (!h.ok) return;
  const d = h.band * 0.2;
  c.forEach((m, f) => {
    const p = St(t, m.total ? 2 : m.to >= m.from ? 0 : 1), g = h.vpos(Math.max(m.from, m.to)), b = h.vpos(Math.min(m.from, m.to)), x = h.plot.l + h.band * f + d;
    if (e.push({ op: "rect", x, y: g, w: h.band - d * 2, h: Math.max(1, b - g), fill: p, series: f }), f < c.length - 1) {
      const k = h.vpos(m.to);
      e.push({ op: "line", points: [[x + h.band - d * 2, k], [x + h.band, k]], stroke: o.axis, width: 1 });
    }
    t.dataLabels && e.push({ op: "text", x: x + (h.band - d * 2) / 2, y: g - s * 0.2, text: Xt(m.v), size: s * 0.9, align: "center", baseline: "bottom", color: o.text });
  }), e.push({ op: "line", points: [[h.plot.l, h.zero], [h.plot.r, h.zero]], stroke: o.axis, width: 1 });
}
function Di(t, e, n, s, o) {
  const i = (t.series[0]?.values ?? []).map((d) => Math.max(0, d ?? 0)), r = Math.max(1e-9, ...i), l = Math.min((n.r - n.l) * 0.4, Math.max(0, ...t.categories.map((d) => d.length)) * s * 0.55 + s), a = n.l + l, u = n.r - a, c = (n.b - n.t) / Math.max(1, i.length), h = a + u / 2;
  i.forEach((d, m) => {
    const f = d / r * u, p = n.t + c * m;
    e.push({ op: "rect", x: h - f / 2, y: p + c * 0.05, w: f, h: c * 0.9, fill: St(t, 0), series: m }), t.categories[m] && e.push({ op: "text", x: a - s * 0.4, y: p + c / 2, text: t.categories[m], size: s, align: "right", baseline: "middle", color: o.muted }), e.push({ op: "text", x: h, y: p + c / 2, text: Xt(d), size: s, align: "center", baseline: "middle", color: "#ffffff" });
  });
}
function Li(t, e, n, s, o) {
  const i = t.series[0];
  if (!i) return;
  let r = t.binning ? Ei(i.values.filter((d) => d !== null), t.binning) : Ni(t.categories, i.values);
  const l = t.kind === "pareto";
  l && (r = [...r].sort((d, m) => m.count - d.count));
  const a = Math.max(0, ...r.map((d) => d.count)), u = Math.min(0, ...r.map((d) => d.count)), c = Bn(e, r.map((d) => d.label), u, a, n, s, o, { pct: l });
  if (!c.ok) return;
  const h = t.binning && !l ? 0 : c.band * 0.08;
  if (r.forEach((d, m) => {
    const f = c.vpos(Math.max(0, d.count)), p = c.vpos(Math.min(0, d.count));
    e.push({ op: "rect", x: c.plot.l + c.band * m + h, y: f, w: c.band - h * 2, h: Math.max(0, p - f), fill: St(t, 0), stroke: h ? void 0 : "#ffffff", series: 0 }), t.dataLabels && e.push({ op: "text", x: c.plot.l + c.band * (m + 0.5), y: f - s * 0.2, text: Xt(d.count), size: s * 0.9, align: "center", baseline: "bottom", color: o.text });
  }), l) {
    const d = r.reduce((g, b) => g + Math.max(0, b.count), 0) || 1;
    let m = 0;
    const f = c.plot.b - c.plot.t, p = r.map((g, b) => (m += Math.max(0, g.count), [c.plot.l + c.band * (b + 0.5), c.plot.b - m / d * f]));
    e.push({ op: "line", points: p, stroke: St(t, 1), width: Math.max(1.5, s * 0.18), series: 1 }), p.forEach(([g, b]) => e.push({ op: "dot", x: g, y: b, r: Math.max(2, s * 0.22), fill: St(t, 1) }));
  }
  e.push({ op: "line", points: [[c.plot.l, c.zero], [c.plot.r, c.zero]], stroke: o.axis, width: 1 });
}
function zi(t, e, n, s, o) {
  const i = [], r = (f) => f.categories ?? t.categories;
  for (const f of t.series) f.values.forEach((p, g) => {
    const b = r(f)[g] ?? "";
    i.includes(b) || i.push(b);
  });
  i.length || i.push("");
  const l = t.series.map((f) => i.map((p) => Ti(f.values.filter((g, b) => g !== null && (r(f)[b] ?? "") === p), t.inclusive)));
  let a = 1 / 0, u = -1 / 0;
  for (const f of l) for (const p of f) p && (a = Math.min(a, p.lo, ...p.outliers), u = Math.max(u, p.hi, ...p.outliers));
  if (!Number.isFinite(a)) return;
  const c = Bn(e, i, Math.min(0, a), u, n, s, o);
  if (!c.ok) return;
  const h = Math.max(1, t.series.length), d = c.band * 0.15, m = (c.band - d * 2) / h;
  l.forEach((f, p) => f.forEach((g, b) => {
    if (!g) return;
    const x = St(t, p), k = c.plot.l + c.band * b + d + m * p, w = k + m / 2, M = m * 0.12;
    e.push({ op: "line", points: [[w, c.vpos(g.hi)], [w, c.vpos(g.q3)]], stroke: o.text, width: 1 }), e.push({ op: "line", points: [[w, c.vpos(g.q1)], [w, c.vpos(g.lo)]], stroke: o.text, width: 1 });
    for (const $ of [g.hi, g.lo]) e.push({ op: "line", points: [[w - m * 0.2, c.vpos($)], [w + m * 0.2, c.vpos($)]], stroke: o.text, width: 1 });
    const S = c.vpos(g.q3), O = c.vpos(g.q1);
    e.push({ op: "rect", x: k + M, y: S, w: m - M * 2, h: Math.max(1, O - S), fill: x, stroke: x, series: p }), e.push({ op: "line", points: [[k + M, c.vpos(g.median)], [k + m - M, c.vpos(g.median)]], stroke: "#ffffff", width: 1.5 });
    const T = c.vpos(g.mean), E = Math.max(2, s * 0.25);
    e.push({ op: "line", points: [[w - E, T - E], [w + E, T + E]], stroke: "#ffffff", width: 1.5 }), e.push({ op: "line", points: [[w - E, T + E], [w + E, T - E]], stroke: "#ffffff", width: 1.5 });
    for (const $ of g.outliers) e.push({ op: "dot", x: w, y: c.vpos($), r: Math.max(2, s * 0.2), fill: x, series: p });
  })), e.push({ op: "line", points: [[c.plot.l, c.zero], [c.plot.r, c.zero]], stroke: o.axis, width: 1 });
}
function ji(t, e, n, s) {
  const o = Fn(t.categories, t.levels ?? [], t.series[0]?.values ?? []), i = (r, l, a, u) => {
    Ii(r.map((c) => c.value), l).forEach((c, h) => {
      const d = r[h];
      if (!(c.w > 0 && c.h > 0)) return;
      const m = a(h);
      if (d.children.length) {
        const f = Math.min(c.h * 0.3, s * 1.5);
        e.push({ op: "rect", x: c.x, y: c.y, w: c.w, h: c.h, fill: m, stroke: "#ffffff" }), c.w > s * 2 && e.push({ op: "text", x: c.x + s * 0.3, y: c.y + f / 2, text: d.name, size: s * 0.9, align: "left", baseline: "middle", color: "#ffffff", bold: !0 }), i(d.children, { x: c.x + 1, y: c.y + f, w: c.w - 2, h: c.h - f - 1 }, () => uo(m, 0.12 * (u + 1)), u + 1);
        return;
      }
      e.push({ op: "rect", x: c.x, y: c.y, w: c.w, h: c.h, fill: m, stroke: "#ffffff", series: h }), c.w > s * 2 && c.h > s * 1.4 && (e.push({ op: "text", x: c.x + s * 0.3, y: c.y + s * 0.3, text: d.name, size: s * 0.9, align: "left", baseline: "top", color: "#ffffff" }), t.dataLabels && c.h > s * 2.6 && e.push({ op: "text", x: c.x + s * 0.3, y: c.y + s * 1.4, text: Xt(d.value), size: s * 0.9, align: "left", baseline: "top", color: "#ffffff" }));
    });
  };
  i(o, { x: n.l, y: n.t, w: n.r - n.l, h: n.b - n.t }, (r) => St(t, r), 0);
}
function Ui(t, e, n, s) {
  const o = Fn(t.categories, t.levels ?? [], t.series[0]?.values ?? []), i = (f) => f.length ? 1 + Math.max(...f.map((p) => i(p.children))) : 0, r = Math.max(1, i(o)), l = (n.l + n.r) / 2, a = (n.t + n.b) / 2, u = Math.max(s, Math.min(n.r - n.l, n.b - n.t) / 2 * 0.95), c = u * 0.12, h = (u - c) / r;
  if (!(o.reduce((f, p) => f + p.value, 0) > 0)) return;
  const m = (f, p, g, b, x) => {
    const k = f.reduce((M, S) => M + S.value, 0) || 1;
    let w = p;
    f.forEach((M, S) => {
      const O = M.value / k * g, T = x ? uo(x, 0.18 * b) : St(t, S), E = c + h * b, $ = E + h;
      if (e.push({ op: "wedge", cx: l, cy: a, r: $, inner: E, a0: w, a1: w + O, fill: T, series: S }), O * ((E + $) / 2) > s * 2.5 && h > s * 1.2) {
        const R = w + O / 2, I = (E + $) / 2;
        e.push({ op: "text", x: l + Math.cos(R) * I, y: a + Math.sin(R) * I, text: M.name, size: s * 0.85, align: "center", baseline: "middle", color: "#ffffff" });
      }
      M.children.length && m(M.children, w, O, b + 1, x ?? T), w += O;
    });
  };
  m(o, -Math.PI / 2, Math.PI * 2, 0, null);
}
function _i(t) {
  const n = `${{ waterfall: "Waterfall", funnel: "Funnel", histogram: "Histogram", pareto: "Pareto", boxWhisker: "Box and whisker", treemap: "Treemap", sunburst: "Sunburst" }[t.kind]} chart${t.title ? `: ${t.title}` : ""}.`, s = t.series.map((o) => {
    const i = o.categories ?? t.categories, r = o.values.map((l, a) => l === null ? null : `${i[a] || a + 1} ${l}`).filter(Boolean).slice(0, 200);
    return `${o.name ? o.name + ": " : ""}${r.join(", ")}`;
  });
  return [n, ...s].join(" ").slice(0, 4e3);
}
const Re = (t, e) => ({ kind: "solid", color: { hex: t, ...e !== void 0 && e < 1 && { alpha: e } } }), Fe = (t, e) => ({ width: e, color: { hex: t }, cap: "rnd", join: "round" });
function Hi(t) {
  const e = Math.max(2, Math.ceil(Math.abs(t.a1 - t.a0) / (Math.PI / 45))), n = (s, o, i) => Array.from({ length: e + 1 }, (r, l) => {
    const a = o + (i - o) * l / e;
    return [t.cx + Math.cos(a) * s, t.cy + Math.sin(a) * s];
  });
  return t.inner > 0 ? [...n(t.r, t.a0, t.a1), ...n(t.inner, t.a1, t.a0)] : [[t.cx, t.cy], ...n(t.r, t.a0, t.a1)];
}
function rs(t, e, n, s, o, i) {
  if (n.length < 2) return null;
  const r = n.map((m) => m[0]), l = n.map((m) => m[1]), a = Math.min(...r), u = Math.min(...l), c = Math.max(0.01, Math.max(...r) - a), h = Math.max(0.01, Math.max(...l) - u), d = n.map(([m, f], p) => ({ op: p ? "L" : "M", x: m - a, y: f - u }));
  return s && d.push({ op: "Z" }), { kind: "shape", id: t, name: e, x: a, y: u, w: c, h, geom: { kind: "custom", paths: [{ cmds: d, fill: s && o.kind !== "none", stroke: !!i }] }, fill: o, line: i };
}
function Xi(t, e) {
  const n = e.text.length * e.size * 0.6 + e.size * 0.6, s = e.size * 1.35, o = e.align === "left" ? e.x : e.align === "right" ? e.x - n : e.x - n / 2, i = e.baseline === "top" ? e.y : e.baseline === "bottom" ? e.y - s : e.y - s / 2;
  return {
    kind: "shape",
    id: t,
    name: "Label",
    x: o,
    y: i,
    w: n,
    h: s,
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: {
      paragraphs: [{ runs: [{ text: e.text, size: e.size, color: { hex: e.color }, ...e.bold && { bold: !0 } }], align: e.align === "left" ? "l" : e.align === "right" ? "r" : "ctr" }],
      anchor: "ctr",
      insets: { l: 0, t: 0, r: 0, b: 0 },
      wrap: !1
    }
  };
}
function Wi(t, e, n, s, o) {
  const i = [];
  for (const r of t) {
    let l = null;
    switch (r.op) {
      case "rect":
        if (!(r.w > 0 && r.h > 0)) break;
        l = {
          kind: "shape",
          id: o(),
          name: "Bar",
          x: r.x,
          y: r.y,
          w: r.w,
          h: r.h,
          geom: { kind: "preset", prst: "rect" },
          fill: r.fill ? Re(r.fill) : { kind: "none" },
          line: r.stroke ? Fe(r.stroke, 1) : null
        };
        break;
      case "line":
        l = rs(o(), "Line", r.points, !!r.closed, r.fill ? Re(r.fill, 0.55) : { kind: "none" }, Fe(r.stroke, r.width));
        break;
      case "wedge":
        l = rs(o(), "Segment", Hi(r), !0, Re(r.fill), Fe("#ffffff", 1.5));
        break;
      case "dot":
        l = {
          kind: "shape",
          id: o(),
          name: "Point",
          x: r.x - r.r,
          y: r.y - r.r,
          w: r.r * 2,
          h: r.r * 2,
          geom: { kind: "preset", prst: "ellipse" },
          fill: Re(r.fill, r.opacity),
          line: r.stroke ? Fe(r.stroke, 1) : null
        };
        break;
      case "text":
        r.text && (l = Xi(o(), r));
        break;
    }
    l && i.push(l);
  }
  return i.length ? { kind: "group", id: e, name: n, ...s, children: i } : null;
}
const Vi = 1e4, Yi = 1e5, ho = 6e4, xe = (t) => t / ho * (Math.PI / 180);
function fo(t, e, n, s = {}) {
  const o = /* @__PURE__ */ new Map(), i = Math.max(0, e), r = Math.max(0, n), l = Math.min(i, r), a = Math.max(i, r), u = {
    w: i,
    h: r,
    l: 0,
    t: 0,
    r: i,
    b: r,
    hc: i / 2,
    vc: r / 2,
    ss: l,
    ls: a,
    cd2: 108e5,
    cd4: 54e5,
    cd8: 27e5,
    "3cd4": 162e5,
    "3cd8": 81e5,
    "5cd8": 135e5,
    "7cd8": 189e5
  };
  for (const [d, m] of Object.entries(u)) o.set(d, m);
  for (const d of [2, 3, 4, 5, 6, 8, 10, 12, 16, 32])
    o.set(`wd${d}`, i / d), o.set(`hd${d}`, r / d), o.set(`ssd${d}`, l / d);
  const c = (d) => {
    const m = o.get(d);
    if (m !== void 0) return m;
    const f = /^(wd|hd|ssd)(\d+)$/.exec(d);
    if (f) {
      const g = f[1] === "wd" ? i : f[1] === "hd" ? r : l, b = Number(f[2]);
      return b ? g / b : 0;
    }
    const p = Number(d);
    return Number.isFinite(p) ? p : 0;
  }, h = (d, m) => {
    o.size > Vi || o.set(d, Gi(m, c));
  };
  for (const [d, m] of t.av ?? []) h(d, s[d] ?? m);
  for (const [d, m] of Object.entries(s)) o.has(d) || h(d, m);
  for (const [d, m] of t.gd ?? []) h(d, m);
  return o;
}
function Gi(t, e) {
  const n = String(t || "").trim().split(/\s+/), s = n[0], [o, i, r] = n.slice(1).map(e);
  let l;
  switch (s) {
    case "val":
      l = o;
      break;
    case "*/":
      l = r ? o * i / r : 0;
      break;
    case "+-":
      l = o + i - r;
      break;
    case "+/":
      l = r ? (o + i) / r : 0;
      break;
    case "?:":
      l = o > 0 ? i : r;
      break;
    case "abs":
      l = Math.abs(o);
      break;
    case "at2":
      l = Math.atan2(i, o) * 180 / Math.PI * ho;
      break;
    case "cat2":
      l = o * Math.cos(Math.atan2(r, i));
      break;
    case "sat2":
      l = o * Math.sin(Math.atan2(r, i));
      break;
    case "cos":
      l = o * Math.cos(xe(i));
      break;
    case "sin":
      l = o * Math.sin(xe(i));
      break;
    case "tan":
      l = o * Math.tan(xe(i));
      break;
    case "max":
      l = Math.max(o, i);
      break;
    case "min":
      l = Math.min(o, i);
      break;
    case "mod":
      l = Math.sqrt(o * o + i * i + r * r);
      break;
    case "pin":
      l = i < o ? o : i > r ? r : i;
      break;
    case "sqrt":
      l = Math.sqrt(Math.max(0, o));
      break;
    default:
      l = 0;
  }
  return Number.isFinite(l) ? l : 0;
}
const ls = (t, e, n) => Math.atan2(e * Math.sin(t), n * Math.cos(t));
function Ue(t, e, n, s = {}) {
  const o = Math.max(Math.abs(e), 0) * vt, i = Math.max(Math.abs(n), 0) * vt, r = fo(t, o, i, s), l = (c) => typeof c == "number" ? c : r.get(c) ?? (Number.isFinite(Number(c)) ? Number(c) : 0), a = [];
  let u = Yi;
  for (const c of t.paths) {
    const h = c.w ? o / c.w : 1, d = c.h ? i / c.h : 1, m = (x) => l(x) * h / vt, f = (x) => l(x) * d / vt, p = [];
    let g = { x: 0, y: 0 }, b = { x: 0, y: 0 };
    for (const x of c.d) {
      if (--u < 0) break;
      switch (x[0]) {
        case "M":
          g = { x: m(x[1]), y: f(x[2]) }, b = g, p.push({ op: "M", ...g });
          break;
        case "L":
          g = { x: m(x[1]), y: f(x[2]) }, p.push({ op: "L", ...g });
          break;
        case "C": {
          const k = m(x[1]), w = f(x[2]), M = m(x[3]), S = f(x[4]);
          g = { x: m(x[5]), y: f(x[6]) }, p.push({ op: "C", x1: k, y1: w, x2: M, y2: S, ...g });
          break;
        }
        case "Q": {
          const k = m(x[1]), w = f(x[2]), M = m(x[3]), S = f(x[4]);
          p.push({ op: "C", x1: g.x + 2 / 3 * (k - g.x), y1: g.y + 2 / 3 * (w - g.y), x2: M + 2 / 3 * (k - M), y2: S + 2 / 3 * (w - S), x: M, y: S }), g = { x: M, y: S };
          break;
        }
        case "A": {
          const k = l(x[1]) * h / vt, w = l(x[2]) * d / vt;
          g = qi(p, g, k, w, l(x[3]), l(x[4]));
          break;
        }
        case "Z":
          p.push({ op: "Z" }), g = b;
          break;
      }
    }
    p.length && a.push({ cmds: p, fill: c.fill === "none" ? !1 : void 0, stroke: c.stroke === !1 ? !1 : void 0 });
  }
  return a;
}
function qi(t, e, n, s, o, i) {
  if (Math.abs(n) < 1e-9 || Math.abs(s) < 1e-9 || i === 0) return e;
  const r = xe(o), l = Math.max(-4 * Math.PI, Math.min(4 * Math.PI, xe(i))), a = ls(r, n, s);
  let u = ls(r + l, n, s);
  if (Math.abs(l) >= 2 * Math.PI - 1e-9) u = a + Math.sign(l) * 2 * Math.PI;
  else {
    for (; l > 0 && u < a; ) u += 2 * Math.PI;
    for (; l < 0 && u > a; ) u -= 2 * Math.PI;
  }
  const c = e.x - n * Math.cos(a), h = e.y - s * Math.sin(a), d = u - a, m = Math.max(1, Math.min(16, Math.ceil(Math.abs(d) / (Math.PI / 2)))), f = d / m, p = 4 / 3 * Math.tan(f / 4);
  let g = a, b = e;
  for (let x = 0; x < m; x++) {
    const k = g + f, w = Math.cos(g), M = Math.sin(g), S = Math.cos(k), O = Math.sin(k);
    b = { x: c + n * S, y: h + s * O }, t.push({ op: "C", x1: c + n * (w - p * M), y1: h + s * (M + p * w), x2: c + n * (S + p * O), y2: h + s * (O - p * S), ...b }), g = k;
  }
  return b;
}
function po(t, e, n, s = {}) {
  const o = Math.abs(e), i = Math.abs(n);
  if (!t.rect) return { l: 0, t: 0, r: o, b: i };
  const r = fo(t, o * vt, i * vt, s), l = (d) => (r.get(d) ?? (Number.isFinite(Number(d)) ? Number(d) : 0)) / vt, [a, u, c, h] = t.rect.map(l);
  return { l: a, t: u, r: c, b: h };
}
let as = null;
async function Zi() {
  return as ??= (await import("./presets-DP49P8i2.js")).default, as;
}
const cs = 5e4, Ki = 256 * 1024 * 1024, us = 1024 * 1024 * 1024, Ji = 1e4, Qi = 32, tr = 2e4, U = (t, e) => {
  if (!t) return [];
  const n = [];
  for (let s = t.firstChild; s; s = s.nextSibling)
    s.nodeType === 1 && (!e || s.localName === e) && n.push(s);
  return n;
}, y = (t, e) => {
  if (!t) return null;
  for (let n = t.firstChild; n; n = n.nextSibling) if (n.nodeType === 1 && n.localName === e) return n;
  return null;
}, q = (t, ...e) => {
  let n = t;
  for (const s of e) n = y(n, s);
  return n ?? null;
}, v = (t, e) => {
  if (!t) return null;
  const n = t.getAttribute(e);
  if (n !== null && n !== "") return n;
  const s = e.includes(":") ? e.split(":")[1] : e;
  for (let o = 0; o < (t.attributes?.length ?? 0); o++) {
    const i = t.attributes[o];
    if (i.localName === s && (e.includes(":") || !i.name.includes(":"))) return i.value;
  }
  return null;
}, N = (t, e, n = 0) => {
  const s = v(t, e), o = s === null ? NaN : Number(s);
  return Number.isFinite(o) ? o : n;
}, it = (t, e) => {
  const n = v(t, e);
  return n === null ? void 0 : n === "1" || n === "true" || n === "on";
}, at = (t) => t / vt, hs = /* @__PURE__ */ new Set(["p14", "a14", "a16"]);
function er(t) {
  if (t.localName !== "AlternateContent") return [t];
  const e = y(t, "Fallback");
  for (const n of U(t, "Choice")) {
    const s = (v(n, "Requires") || "").split(/\s+/).filter(Boolean);
    if (s.every((o) => hs.has(o))) return U(n);
    if (s.length && s.every((o) => hs.has(o) || /^cx\d*$/.test(o))) {
      const o = U(n);
      for (const i of o) mo.set(i, U(e));
      return o;
    }
  }
  return U(e);
}
const mo = /* @__PURE__ */ new WeakMap(), Rt = (t) => U(t).flatMap(er);
class nr {
  files;
  text = /* @__PURE__ */ new Map();
  relCache = /* @__PURE__ */ new Map();
  parseXml;
  warn;
  constructor(e, n, s) {
    this.parseXml = n, this.warn = s, this.files = {};
    for (const [o, i] of Object.entries(e)) this.files[ge(o)] = i;
  }
  bytes(e) {
    return this.files[ge(e)];
  }
  /** Parse markup the importer itself supplies (built-in definitions), cached by text. */
  parse(e) {
    const n = `#inline:${e}`;
    if (!this.text.has(n)) {
      let s = null;
      try {
        s = this.parseXml(e), s.getElementsByTagName("parsererror").length && (s = null);
      } catch {
        s = null;
      }
      this.text.set(n, s);
    }
    return this.text.get(n)?.documentElement ?? null;
  }
  xml(e) {
    const n = ge(e);
    if (!this.text.has(n)) {
      const s = this.files[n];
      let o = null;
      if (s) {
        try {
          const i = ri(s).replace(/^﻿/, "");
          o = /<!DOCTYPE/i.test(i.slice(0, 2048)) ? null : this.parseXml(i), o && o.getElementsByTagName("parsererror").length && (o = null);
        } catch {
          o = null;
        }
        o || this.warn(`Couldn't read ${n}`);
      }
      this.text.set(n, o);
    }
    return this.text.get(n)?.documentElement ?? null;
  }
  rels(e) {
    const n = ge(e);
    let s = this.relCache.get(n);
    if (s) return s;
    s = /* @__PURE__ */ new Map();
    const o = n.includes("/") ? n.slice(0, n.lastIndexOf("/")) : "", i = n.slice(n.lastIndexOf("/") + 1), r = this.xml(`${o ? o + "/" : ""}_rels/${i}.rels`);
    for (const l of U(r, "Relationship")) {
      const a = v(l, "Id"), u = v(l, "Type") || "", c = v(l, "Target") || "";
      if (!a) continue;
      const h = v(l, "TargetMode") === "External";
      s.set(a, { type: u.slice(u.lastIndexOf("/") + 1), target: h ? c : sr(o, c), external: h });
    }
    return this.relCache.set(n, s), s;
  }
  relOfType(e, n) {
    for (const s of this.rels(e).values()) if (s.type === n && !s.external) return s.target;
    return null;
  }
}
const ge = (t) => t.replace(/\\/g, "/").replace(/^\/+/, "");
function sr(t, e) {
  let n = e.split("#")[0];
  try {
    n = decodeURIComponent(n);
  } catch {
  }
  if (n.startsWith("/")) return ge(n);
  const s = (t ? t.split("/") : []).concat(n.split("/")), o = [];
  for (const i of s)
    i === ".." ? o.pop() : i && i !== "." && o.push(i);
  return o.join("/");
}
const Dn = { bg1: "lt1", tx1: "dk1", bg2: "lt2", tx2: "dk2" };
function go(t) {
  const e = {};
  for (const n of U(t)) {
    const s = U(n)[0];
    if (!s) continue;
    const o = s.localName === "sysClr" ? v(s, "lastClr") : v(s, "val");
    o && /^[0-9a-f]{6}$/i.test(o) && (e[n.localName] = "#" + o.toLowerCase());
  }
  return e;
}
function Je(t) {
  const e = { colors: {}, major: "Calibri Light", minor: "Calibri", fills: [], lines: [], bgFills: [] }, n = y(t, "themeElements");
  e.colors = go(y(n, "clrScheme"));
  const s = y(n, "fontScheme");
  e.major = v(q(s, "majorFont", "latin"), "typeface") || e.major, e.minor = v(q(s, "minorFont", "latin"), "typeface") || e.minor;
  const o = y(n, "fmtScheme");
  return e.fills = U(y(o, "fillStyleLst")), e.lines = U(y(o, "lnStyleLst")), e.bgFills = U(y(o, "bgFillStyleLst")), e;
}
const or = {
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
}, ir = (t) => {
  const e = t.replace("#", "");
  return [parseInt(e.slice(0, 2), 16) || 0, parseInt(e.slice(2, 4), 16) || 0, parseInt(e.slice(4, 6), 16) || 0];
}, Qe = (t, e, n) => "#" + [t, e, n].map((s) => Math.max(0, Math.min(255, Math.round(s))).toString(16).padStart(2, "0")).join(""), fs = (t) => (t /= 255, t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4)), pe = (t) => 255 * (t <= 31308e-7 ? t * 12.92 : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
function ds(t, e, n) {
  t /= 255, e /= 255, n /= 255;
  const s = Math.max(t, e, n), o = Math.min(t, e, n), i = (s + o) / 2;
  if (s === o) return [0, 0, i];
  const r = s - o, l = i > 0.5 ? r / (2 - s - o) : r / (s + o);
  return [(s === t ? (e - n) / r + (e < n ? 6 : 0) : s === e ? (n - t) / r + 2 : (t - e) / r + 4) * 60, l, i];
}
function tn(t, e, n) {
  if (t = (t % 360 + 360) % 360 / 360, e === 0) return [n * 255, n * 255, n * 255];
  const s = n < 0.5 ? n * (1 + e) : n + e - n * e, o = 2 * n - s, i = (r) => (r = (r % 1 + 1) % 1, r < 1 / 6 ? o + (s - o) * 6 * r : r < 1 / 2 ? s : r < 2 / 3 ? o + (s - o) * (2 / 3 - r) * 6 : o);
  return [i(t + 1 / 3) * 255, i(t) * 255, i(t - 1 / 3) * 255];
}
function ht(t, e) {
  const n = U(t).find((s) => /Clr$/.test(s.localName));
  return n ? rr(n, e) : null;
}
function rr(t, e) {
  let n = null, s = 1;
  switch (t.localName) {
    case "srgbClr": {
      const a = v(t, "val");
      n = a && /^[0-9a-f]{6}$/i.test(a) ? "#" + a.toLowerCase() : null;
      break;
    }
    case "sysClr": {
      const a = v(t, "lastClr");
      n = a ? "#" + a.toLowerCase() : v(t, "val") === "window" ? "#ffffff" : "#000000";
      break;
    }
    case "prstClr":
      n = or[v(t, "val") || ""] ?? "#000000";
      break;
    case "scrgbClr":
      n = Qe(pe(N(t, "r") / 1e5), pe(N(t, "g") / 1e5), pe(N(t, "b") / 1e5));
      break;
    case "hslClr": {
      const [a, u, c] = tn(N(t, "hue") / 6e4, N(t, "sat") / 1e5, N(t, "lum") / 1e5);
      n = Qe(a, u, c);
      break;
    }
    case "schemeClr": {
      const a = v(t, "val") || "";
      if (a === "phClr") {
        e.phClr ? (n = e.phClr.hex, s = e.phClr.alpha ?? 1) : n = e.theme.colors.accent1 ?? "#4472c4";
        break;
      }
      const u = e.clrMap[a] ?? Dn[a] ?? a;
      n = e.theme.colors[u] ?? null;
      break;
    }
  }
  if (!n) return null;
  let [o, i, r] = ir(n);
  for (const a of U(t)) {
    const u = N(a, "val") / 1e5;
    switch (a.localName) {
      case "alpha":
        s = u;
        break;
      case "alphaMod":
        s *= u;
        break;
      case "alphaOff":
        s += u;
        break;
      case "lumMod":
      case "lumOff":
      case "satMod":
      case "satOff":
      case "hueMod":
      case "hueOff": {
        let [c, h, d] = ds(o, i, r);
        a.localName === "lumMod" ? d *= u : a.localName === "lumOff" ? d += u : a.localName === "satMod" ? h *= u : a.localName === "satOff" ? h += u : a.localName === "hueMod" ? c *= u : c += N(a, "val") / 6e4, [o, i, r] = tn(c, Math.max(0, Math.min(1, h)), Math.max(0, Math.min(1, d)));
        break;
      }
      case "tint":
        [o, i, r] = [o, i, r].map((c) => pe(fs(c) * u + (1 - u)));
        break;
      case "shade":
        [o, i, r] = [o, i, r].map((c) => pe(fs(c) * u));
        break;
      case "comp": {
        const [c, h, d] = ds(o, i, r);
        [o, i, r] = tn(c + 180, h, d);
        break;
      }
      case "inv":
        [o, i, r] = [255 - o, 255 - i, 255 - r];
        break;
      case "gray": {
        o = i = r = 0.299 * o + 0.587 * i + 0.114 * r;
        break;
      }
    }
  }
  s = Math.max(0, Math.min(1, s));
  const l = { hex: Qe(o, i, r) };
  return s < 0.999 && (l.alpha = s), l;
}
function _t(t, e) {
  for (const n of U(t)) {
    const s = Ln(n, e);
    if (s) return s;
  }
}
function Ln(t, e) {
  switch (t.localName) {
    case "noFill":
      return { kind: "none" };
    case "solidFill": {
      const n = ht(t, e.ctx);
      return n ? { kind: "solid", color: n } : { kind: "none" };
    }
    case "gradFill": {
      const n = U(y(t, "gsLst"), "gs").slice(0, 256).map((o) => ({ pos: N(o, "pos") / 1e5, color: ht(o, e.ctx) ?? { hex: "#000000" } }));
      if (!n.length) return { kind: "none" };
      const s = y(t, "lin");
      return y(t, "path") ? { kind: "radial", stops: n } : { kind: "linear", stops: n, angle: s ? N(s, "ang") / 6e4 : 90, scaled: it(s, "scaled") ?? !1 };
    }
    case "blipFill": {
      const n = zn(t, e);
      if (!n) return;
      const s = { kind: "image", media: n }, o = y(t, "tile");
      o && (s.tile = { sx: Math.max(0.01, N(o, "sx", 1e5) / 1e5), sy: Math.max(0.01, N(o, "sy", 1e5) / 1e5) });
      const i = y(y(t, "blip"), "alphaModFix");
      return i && (s.alpha = Math.max(0, Math.min(1, N(i, "amt", 1e5) / 1e5))), y(y(t, "blip"), "grayscl") && (s.grayscale = !0), s;
    }
    case "pattFill": {
      const n = ht(y(t, "fgClr"), e.ctx), s = ht(y(t, "bgClr"), e.ctx);
      return n ? { kind: "pattern", preset: v(t, "prst") || "pct50", color: n, ...s ? { bg: s } : {} } : void 0;
    }
    case "grpFill":
      return;
  }
}
const lr = {
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
function zn(t, e) {
  const n = y(t, "blip"), s = v(n, "r:embed");
  if (!s) return null;
  const o = e.pkg.rels(e.part).get(s);
  return !o || o.external ? null : bo(e.pkg, o.target);
}
function ar(t, e) {
  const n = y(t, "videoFile") ?? y(t, "quickTimeFile"), s = y(t, "audioFile") ?? y(t, "wavAudioFile"), o = pt(y(t, "extLst"), "media", 2);
  if (!n && !s && !o) return null;
  const i = !n && !!s;
  let r;
  for (const l of [v(o, "r:embed"), v(n ?? s, "r:link"), v(n ?? s, "r:embed")]) {
    const a = l ? e.pkg.rels(e.part).get(l) : void 0;
    if (!a) continue;
    if (a.external) {
      !r && /^https?:\/\//i.test(a.target) && (r = a.target);
      continue;
    }
    const u = e.pkg.bytes(a.target);
    if (u) return { audio: i, file: { bytes: u, ext: (a.target.split(".").pop() || "").toLowerCase() } };
  }
  return { audio: i, file: null, ...r ? { url: r } : {} };
}
function bo(t, e) {
  const n = t.bytes(e), s = lr[(e.split(".").pop() || "").toLowerCase()];
  return n && s ? { bytes: n, ext: s } : null;
}
const cr = { solid: "", dot: "sysDot", sysDot: "sysDot", sysDash: "dash", dash: "dash", lgDash: "dash", dashDot: "dash", lgDashDot: "dash", lgDashDotDot: "dash", sysDashDot: "dash", sysDashDotDot: "dash" };
function Ht(t, e) {
  if (!t) return;
  let n;
  for (const l of U(t)) {
    if (l.localName === "noFill") return null;
    l.localName === "solidFill" && (n = ht(l, e.ctx)), l.localName === "gradFill" && (n = ht(y(y(l, "gsLst"), "gs"), e.ctx));
  }
  const s = v(t, "w");
  if (n === void 0 && s === null && !y(t, "prstDash") && !y(t, "headEnd") && !y(t, "tailEnd")) return;
  const o = (l) => {
    const a = v(l, "type");
    if (!a || a === "none") return;
    const u = a === "triangle" || a === "stealth" || a === "arrow" || a === "oval" || a === "diamond" ? a : "triangle", c = v(l, "len") || v(l, "w");
    return { type: u, size: c === "sm" || c === "lg" ? c : "med" };
  }, i = cr[v(y(t, "prstDash"), "val") || "solid"], r = v(t, "cap");
  return {
    // ECMA's default is 9525 EMU — 0.75 pt, one px.
    width: s !== null ? Math.max(0, at(Number(s) || 0)) : 1,
    color: n ?? { hex: "#000000" },
    dash: i || void 0,
    cap: r === "rnd" ? "rnd" : r === "sq" ? "sq" : r === "flat" ? "flat" : void 0,
    join: y(t, "round") ? "round" : y(t, "bevel") ? "bevel" : y(t, "miter") ? "miter" : void 0,
    head: o(y(t, "headEnd")),
    tail: o(y(t, "tailEnd"))
  };
}
function _e(t, e) {
  const n = y(t, "fillRef");
  if (!n) return;
  const s = N(n, "idx");
  if (s === 0) return { kind: "none" };
  const i = (s >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[s >= 1001 ? s - 1001 : s - 1];
  if (!i) return;
  const r = ht(n, e.ctx) ?? void 0;
  return Ln(i, { ...e, ctx: { ...e.ctx, phClr: r } });
}
function jn(t, e) {
  const n = y(t, "lnRef");
  if (!n) return;
  const s = N(n, "idx");
  if (s === 0) return null;
  const o = e.ctx.theme.lines[s - 1];
  if (!o) return;
  const i = ht(n, e.ctx) ?? void 0;
  return Ht(o, { ...e, ctx: { ...e.ctx, phClr: i } }) ?? void 0;
}
function Et(t) {
  if (!t) return null;
  const e = y(t, "off"), n = y(t, "ext");
  return !e || !n ? null : {
    x: at(N(e, "x")),
    y: at(N(e, "y")),
    w: Math.max(0, at(N(n, "cx"))),
    h: Math.max(0, at(N(n, "cy"))),
    rot: N(t, "rot") / 6e4,
    flipH: !!it(t, "flipH"),
    flipV: !!it(t, "flipV")
  };
}
const en = (t) => t;
function ur(t, e) {
  const n = Et(t);
  if (!n) return e;
  const s = y(t, "chOff"), o = y(t, "chExt"), i = s ? at(N(s, "x")) : n.x, r = s ? at(N(s, "y")) : n.y, l = o ? at(N(o, "cx")) : n.w, a = o ? at(N(o, "cy")) : n.h, u = l > 0 ? n.w / l : 1, c = a > 0 ? n.h / a : 1, h = n.x + n.w / 2, d = n.y + n.h / 2, m = n.rot * Math.PI / 180;
  return (f) => {
    let p = n.x + (f.x + f.w / 2 - i) * u, g = n.y + (f.y + f.h / 2 - r) * c, b = f.rot, x = f.flipH, k = f.flipV;
    if (n.flipH && (p = 2 * h - p, x = !x, b = -b), n.flipV && (g = 2 * d - g, k = !k, b = -b), m) {
      const S = p - h, O = g - d;
      p = h + S * Math.cos(m) - O * Math.sin(m), g = d + S * Math.sin(m) + O * Math.cos(m), b += n.rot;
    }
    const w = f.w * u, M = f.h * c;
    return e({ x: p - w / 2, y: g - M / 2, w, h: M, rot: (b % 360 + 360) % 360, flipH: x, flipV: k });
  };
}
function ps(t) {
  const e = y(t, "spcPts"), n = y(t, "spcPct");
  if (e) return { px: Math.max(0, Math.min(1584, N(e, "val") / 100)) * (Rn / vt) };
  if (n) return { lines: Math.max(0, Math.min(13.2, N(n, "val") / 1e5)) };
}
function ms(t, e, n) {
  const s = y(t, `lvl${e + 1}pPr`) ?? (t && t.localName.endsWith("pPr") ? t : null);
  return s ? xo(s, n) : {};
}
function xo(t, e) {
  const n = {};
  if (v(t, "algn") && (n.algn = v(t, "algn")), v(t, "marL") !== null && (n.marL = at(N(t, "marL"))), v(t, "indent") !== null && (n.indent = at(N(t, "indent"))), y(t, "buNone")) n.bullet = "none";
  else if (y(t, "buAutoNum")) {
    const r = y(t, "buAutoNum");
    n.bullet = "num", n.numType = v(r, "type") || "arabicPeriod", n.startAt = v(r, "startAt") !== null ? Math.max(1, Math.min(32767, Math.round(N(r, "startAt", 1)))) : void 0;
  } else y(t, "buChar") ? (n.bullet = "char", n.buChar = v(y(t, "buChar"), "char") || void 0) : y(t, "buBlip") && (n.bullet = "char", n.buChar = "•");
  if (y(t, "buFont") ? n.buFont = v(y(t, "buFont"), "typeface") || null : y(t, "buFontTx") && (n.buFont = null), y(t, "buClr") ? n.buClr = ht(y(t, "buClr"), e.ctx) : y(t, "buClrTx") && (n.buClr = null), y(t, "buSzPct")) {
    const r = v(y(t, "buSzPct"), "val") || "", l = r.endsWith("%") ? parseFloat(r) / 100 : Number(r) / 1e5;
    n.buSz = Number.isFinite(l) && l > 0 ? Math.max(0.25, Math.min(4, l)) : null;
  } else (y(t, "buSzTx") || y(t, "buSzPts")) && (n.buSz = null);
  const s = q(t, "lnSpc", "spcPct");
  s && (n.lnSpcPct = N(s, "val") / 1e5);
  const o = ps(y(t, "spcBef")), i = ps(y(t, "spcAft"));
  return o && (n.spcBef = o), i && (n.spcAft = i), Object.assign(n, yo(y(t, "defRPr"), e)), n;
}
function yo(t, e) {
  if (!t) return {};
  const n = {};
  v(t, "sz") !== null && (n.sz = N(t, "sz") / 100 * (Rn / vt)), it(t, "b") !== void 0 && (n.b = it(t, "b")), it(t, "i") !== void 0 && (n.i = it(t, "i")), v(t, "u") && (n.u = v(t, "u") !== "none"), v(t, "strike") && (n.strike = v(t, "strike") !== "noStrike");
  const s = y(t, "solidFill");
  s ? n.color = ht(s, e.ctx) : y(t, "noFill") && (n.color = null);
  const o = v(y(t, "latin"), "typeface");
  return o && (n.font = o), n;
}
const hr = {
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
}, fr = { 183: "•", 168: "♦", 174: "→", 222: "⇒", 45: "−", 42: "∗" };
function dr(t, e) {
  if (!t) return "•";
  let n = t.codePointAt(0);
  n >= 61440 && n <= 61695 && (n -= 61440);
  const s = (e || "").toLowerCase();
  return s.startsWith("wingdings") ? s === "wingdings" && hr[n] || "•" : s === "symbol" ? fr[n] ?? (n < 128 && n > 32 ? String.fromCharCode(n) : "•") : s.startsWith("webdings") || s.startsWith("marlett") ? "•" : s === "courier new" && t === "o" ? "◦" : /\s/.test(t) || n < 32 ? "•" : [...t][0];
}
const gs = (...t) => {
  const e = {};
  for (const n of t) for (const [s, o] of Object.entries(n)) o !== void 0 && (e[s] = o);
  return e;
};
function pr(t, e) {
  if (t)
    return t.startsWith("+mj") ? e.major : t.startsWith("+mn") ? e.minor : t;
}
function Un(t, e, n) {
  if (!t) return;
  const s = U(t, "p");
  if (!s.some((p) => U(p).some((g) => (g.localName === "r" || g.localName === "fld") && (q(g, "t")?.textContent ?? "") !== ""))) return;
  const i = {};
  let r = 1, l = 1, a = !1;
  for (const p of [...e.bodyPr, y(t, "bodyPr")]) {
    if (!p) continue;
    for (let b = 0; b < p.attributes.length; b++) i[p.attributes[b].localName ?? p.attributes[b].name] = p.attributes[b].value;
    const g = y(p, "normAutofit");
    g && (r = v(g, "fontScale") !== null ? N(g, "fontScale") / 1e5 : 1, a = !1), g && (l = 1 - Math.max(0, Math.min(0.9, N(g, "lnSpcReduction") / 1e5))), (y(p, "noAutofit") || y(p, "spAutoFit")) && (r = 1, l = 1, a = !0);
  }
  const u = !a && [...e.bodyPr, y(t, "bodyPr")].some((p) => p && y(p, "normAutofit")), c = (p, g) => i[p] !== void 0 ? at(Number(i[p]) || 0) : at(g), h = i.anchor === "ctr" ? "ctr" : i.anchor === "b" ? "b" : "t", d = y(t, "lstStyle"), m = [];
  let f;
  for (const p of s) {
    const g = y(p, "pPr"), b = Math.max(0, Math.min(8, N(g, "lvl"))), x = e.fontRef ? { color: e.fontRef.color ?? void 0, font: e.fontRef.font } : {}, k = gs(...e.levels.map(($) => ms($, b, n)), x, ms(d, b, n), g ? xo(g, n) : {});
    k.lnSpcPct !== void 0 && f === void 0 && (f = k.lnSpcPct);
    const w = { runs: [], align: k.algn === "ctr" ? "ctr" : k.algn === "r" ? "r" : (k.algn === "just", "l"), level: b };
    if (k.bullet === "char" || k.bullet === "num") {
      if (w.bullet = k.bullet, w.marL = k.marL ?? 0, w.indent = k.indent ?? 0, k.bullet === "char") {
        const $ = dr(k.buChar, k.buFont ?? void 0);
        $ !== "•" && (w.bulletChar = $);
      } else
        k.numType && k.numType !== "arabicPeriod" && (w.numType = k.numType), k.startAt && k.startAt !== 1 && (w.startAt = k.startAt);
      k.buClr && (w.bulletColor = k.buClr), k.buSz && Math.abs(k.buSz - 1) > 1e-3 && (w.bulletScale = k.buSz);
    }
    const M = ($) => {
      const R = gs(k, yo($, n)), I = (R.sz ?? 18 * Rn / vt) * r, L = R.color === null ? void 0 : R.color ?? mr("tx1", n);
      return {
        text: "",
        size: I,
        bold: R.b || void 0,
        italic: R.i || void 0,
        underline: R.u || void 0,
        strike: R.strike || void 0,
        color: L ?? void 0,
        font: pr(R.font ?? "+mn-lt", n.ctx.theme)
      };
    };
    for (const $ of U(p))
      if ($.localName === "r" || $.localName === "fld") {
        const R = q($, "t")?.textContent ?? "";
        if (!R) continue;
        R.split(/[\v\n]/).forEach((I, L) => {
          L > 0 && w.runs.push({ ...M(y($, "rPr")), br: !0 }), I && w.runs.push({ ...M(y($, "rPr")), text: I });
        });
      } else $.localName === "br" && w.runs.push({ ...M(y($, "rPr")), br: !0 });
    w.endSize = M(y(p, "endParaRPr")).size;
    const S = (w.runs.length ? Math.max(...w.runs.map(($) => $.size ?? 0)) : w.endSize ?? 0) * 1.2 * (k.lnSpcPct ?? 1), O = ($) => $ ? ("px" in $ ? $.px : $.lines * S) * l : 0, T = O(k.spcBef), E = O(k.spcAft);
    T > 0.05 && (w.spaceBefore = Math.round(T * 100) / 100), E > 0.05 && (w.spaceAfter = Math.round(E * 100) / 100), m.push(w);
  }
  return {
    paragraphs: m,
    anchor: h,
    insets: { l: c("lIns", 91440), t: c("tIns", 45720), r: c("rIns", 91440), b: c("bIns", 45720) },
    wrap: i.wrap !== "none",
    lineSpacing: f,
    ...u && { shrink: 1 },
    ...bn(i.vert) && { vert: bn(i.vert) }
  };
}
function bn(t) {
  if (t === "vert" || t === "eaVert" || t === "mongolianVert") return "vert";
  if (t === "vert270") return "vert270";
  if (t === "wordArtVert" || t === "wordArtVertRtl") return "stacked";
}
const mr = (t, e) => {
  const n = e.ctx.clrMap[t] ?? Dn[t] ?? t, s = e.ctx.theme.colors[n];
  return s ? { hex: s } : null;
}, le = (t) => {
  const e = y(t, "ph");
  return e ? { type: v(e, "type") || "obj", idx: N(e, "idx") } : null;
}, ye = (t) => y(U(t).find((e) => e.localName.startsWith("nv")) ?? null, "nvPr"), Ce = /* @__PURE__ */ new Set(["title", "ctrTitle"]), bs = /* @__PURE__ */ new Set(["title", "ctrTitle", "dt", "ftr", "sldNum", "hdr"]), xs = (t, e) => t === e || Ce.has(t) && Ce.has(e) || !bs.has(t) && !bs.has(e);
function He(t, e) {
  const n = gr(t);
  if (e.idx) {
    const s = n.find((o) => o.ph.idx === e.idx && xs(o.ph.type, e.type));
    if (s) return s.el;
  }
  return (n.find((s) => s.ph.type === e.type && (s.ph.idx === e.idx || !e.idx || Ce.has(e.type))) ?? n.find((s) => s.ph.type === e.type) ?? n.find((s) => xs(s.ph.type, e.type)))?.el ?? null;
}
function gr(t) {
  const e = [];
  for (const n of Rt(t)) {
    const s = le(ye(n));
    s && e.push({ el: n, ph: s });
  }
  return e;
}
const ko = (t) => Ce.has(t) ? "title" : ["dt", "ftr", "sldNum", "hdr"].includes(t) ? t : "body", br = (t) => {
  const e = {};
  for (const n of U(y(t, "avLst"), "gd")) {
    const s = v(n, "name"), o = v(n, "fmla");
    s && o && (e[s] = o);
  }
  return e;
};
function xr(t) {
  const e = (i) => U(i, "gd").slice(0, 1e4).map((r) => [v(r, "name") || "", v(r, "fmla") || "val 0"]), n = U(y(t, "cxnLst"), "cxn").map((i) => [v(i, "ang") || "0", v(y(i, "pos"), "x") || "0", v(y(i, "pos"), "y") || "0"]), s = y(t, "rect"), o = U(y(t, "pathLst"), "path").slice(0, 1e3).map((i) => {
    const r = [];
    for (const a of U(i)) {
      const u = U(a, "pt").map((c) => [v(c, "x") || "0", v(c, "y") || "0"]).flat();
      switch (a.localName) {
        case "moveTo":
          r.push(["M", ...u]);
          break;
        case "lnTo":
          r.push(["L", ...u]);
          break;
        case "quadBezTo":
          r.push(["Q", ...u]);
          break;
        case "cubicBezTo":
          r.push(["C", ...u]);
          break;
        case "arcTo":
          r.push(["A", v(a, "wR") || "0", v(a, "hR") || "0", v(a, "stAng") || "0", v(a, "swAng") || "0"]);
          break;
        case "close":
          r.push(["Z"]);
          break;
      }
    }
    const l = v(i, "fill");
    return { w: N(i, "w") || void 0, h: N(i, "h") || void 0, fill: l && l !== "norm" ? l : void 0, stroke: it(i, "stroke") === !1 ? !1 : void 0, d: r };
  });
  return {
    av: U(y(t, "avLst"), "gd").map((i) => [v(i, "name") || "", v(i, "fmla") || "val 0"]),
    gd: e(y(t, "gdLst")),
    cxn: n,
    rect: s ? [v(s, "l") || "l", v(s, "t") || "t", v(s, "r") || "r", v(s, "b") || "b"] : null,
    paths: o
  };
}
function ke(t, e) {
  const n = y(t, "prstGeom");
  if (n) {
    const o = {};
    for (const [i, r] of Object.entries(br(n))) {
      const l = /^val\s+(-?\d+(\.\d+)?)/.exec(r);
      l && (o[i] = Number(l[1]));
    }
    return { geom: { kind: "preset", prst: v(n, "prst") || "rect", adj: Object.keys(o).length ? o : void 0 } };
  }
  const s = y(t, "custGeom");
  if (s) {
    const o = xr(s);
    return { geom: { kind: "custom", paths: Ue(o, e.w, e.h) }, textRect: o.rect ? po(o, e.w, e.h) : void 0 };
  }
}
function we(t, e, n, s, o, i) {
  const r = [];
  if (o > Qi)
    return n.warnings.push("Groups nested too deeply; the innermost were skipped."), r;
  for (const l of Rt(t)) {
    if (++n.count > tr) {
      n.warnings.push("Too many shapes on one slide; the rest were skipped.");
      break;
    }
    try {
      const a = wo(l, e, n, s, o, i);
      a && r.push(...Array.isArray(a) ? a : [a]);
    } catch {
      n.warnings.push(`A ${l.localName} couldn't be read and was skipped.`);
    }
  }
  return r;
}
const yr = {
  nextslide: "next",
  previousslide: "previous",
  firstslide: "first",
  lastslide: "last",
  endshow: "end"
};
function kr(t, e, n) {
  const s = y(t, "hlinkClick");
  if (!s) return;
  const o = v(s, "action") || "", i = n.rels(e).get(v(s, "r:id") || "");
  if (o.startsWith("ppaction://hlinkshowjump")) {
    const r = yr[(/jump=([a-z]+)/i.exec(o)?.[1] ?? "").toLowerCase()];
    return r ? { kind: "action", action: r } : void 0;
  }
  if (o.startsWith("ppaction://hlinksldjump")) return i && !i.external ? { kind: "slide", key: i.target } : void 0;
  if (!o)
    return i?.external && /^(https?:|mailto:|tel:)/i.test(i.target) ? { kind: "url", url: i.target } : void 0;
}
function wo(t, e, n, s, o, i) {
  const r = U(t).find((c) => c.localName.startsWith("nv")), l = wr(t, e, n, s, o, i), a = y(r ?? null, "cNvPr"), u = l ? kr(a, e.part, n.pkg) : void 0;
  if (u) for (const c of Array.isArray(l) ? l : [l]) c.link = u;
  if (l && !Array.isArray(l)) {
    const c = v(a, "descr")?.trim();
    c && (l.descr = c), v(pt(a, "decorative", 3), "val") === "1" && (l.decorative = !0);
  }
  return l;
}
function wr(t, e, n, s, o, i) {
  const r = { pkg: n.pkg, part: e.part, ctx: n.ctx }, l = U(t).find((h) => h.localName.startsWith("nv")), a = y(l ?? null, "cNvPr"), u = N(a, "id"), c = v(a, "name") || t.localName;
  if (v(a, "hidden") === "1") return null;
  switch (t.localName) {
    case "sp":
      return Sr(t, e, n, s, u, c, i);
    case "cxnSp": {
      const h = y(t, "spPr"), d = Et(y(h, "xfrm"));
      if (!d) return null;
      const m = s(d), f = y(t, "style"), p = Ht(y(h, "ln"), r) ?? jn(f, r) ?? { width: 1, color: { hex: "#000000" } };
      if (!p) return null;
      const g = ke(h, m) ?? { geom: { kind: "preset", prst: "line" } }, b = (k) => k ? { id: N(k, "id"), idx: N(k, "idx") } : void 0, x = y(l ?? null, "cNvCxnSpPr");
      return { kind: "connector", id: u, name: c, ...m, geom: g.geom, line: p, start: b(y(x, "stCxn")), end: b(y(x, "endCxn")) };
    }
    case "pic": {
      const h = y(t, "spPr");
      let d = Et(y(h, "xfrm"));
      const m = le(y(l ?? null, "nvPr"));
      if (!d && m && (d = Mr(m, n)), !d) return null;
      const f = y(t, "blipFill"), p = f ? zn(f, r) : null, g = y(f, "srcRect"), b = g ? { l: N(g, "l") / 1e5, t: N(g, "t") / 1e5, r: N(g, "r") / 1e5, b: N(g, "b") / 1e5 } : void 0, x = ar(y(l ?? null, "nvPr"), r);
      if (x)
        return !x.file && !x.url && n.warnings.push(`${x.audio ? "Audio" : "Video"} "${c}" is linked to a file on another computer; only its picture was imported.`), !x.file && !x.url && !p ? null : { kind: "media", id: u, name: c, ...s(d), ...x, ...p ? { poster: p } : {}, crop: b };
      if (!p)
        return n.warnings.push(`Picture "${c}" has no image the importer can read.`), null;
      const k = v(q(f, "blip", "alphaModFix"), "amt"), w = s(d), M = ke(h, w)?.geom, S = M && !(M.kind === "preset" && M.prst === "rect") ? M : void 0;
      return { kind: "picture", id: u, name: c, ...w, media: p, crop: b, alpha: k !== null ? Number(k) / 1e5 : void 0, geom: S, ...q(f, "blip", "grayscl") ? { grayscale: !0 } : {} };
    }
    case "grpSp": {
      const h = y(t, "grpSpPr"), d = y(h, "xfrm"), m = ur(d, s), f = we(t, e, n, m, o + 1, i);
      if (!f.length) return null;
      const p = Xe(f);
      return { kind: "group", id: u, name: c, ...p, children: f };
    }
    case "graphicFrame":
      return $r(t, e, n, s, u, c, o);
    default:
      return null;
  }
}
function Xe(t) {
  let e = 1 / 0, n = 1 / 0, s = -1 / 0, o = -1 / 0;
  for (const i of t)
    e = Math.min(e, i.x), n = Math.min(n, i.y), s = Math.max(s, i.x + i.w), o = Math.max(o, i.y + i.h);
  return { x: e, y: n, w: Math.max(0, s - e), h: Math.max(0, o - n) };
}
function Mr(t, e) {
  const n = He(e.layout?.tree ?? null, t), s = Et(q(n, "spPr", "xfrm"));
  if (s) return s;
  const o = He(e.master?.tree ?? null, { type: ko(t.type), idx: 0 });
  return Et(q(o, "spPr", "xfrm"));
}
function vr(...t) {
  for (const e of t) {
    const n = e();
    if (n !== void 0) return n;
  }
}
function Sr(t, e, n, s, o, i, r) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = ye(t), u = le(a);
  if (u && !r) return null;
  const c = y(t, "spPr"), h = y(t, "style"), d = v(q(t, "nvSpPr", "cNvSpPr"), "txBox") === "1", m = u && n.layout ? He(n.layout.tree, u) : null, f = u && n.master ? He(n.master.tree, { type: ko(m ? le(ye(m))?.type ?? u.type : u.type), idx: 0 }) : null, p = m && n.layout ? { pkg: n.pkg, part: n.layout.part, ctx: n.ctx } : null, g = f && n.master ? { pkg: n.pkg, part: n.master.part, ctx: n.ctx } : null;
  let b = Et(y(c, "xfrm")) ?? Et(q(m, "spPr", "xfrm")) ?? Et(q(f, "spPr", "xfrm"));
  if (!b) return null;
  b = s(b);
  const x = ke(c, b) ?? (m ? ke(y(m, "spPr"), b) : void 0) ?? (f ? ke(y(f, "spPr"), b) : void 0) ?? { geom: { kind: "preset", prst: "rect" } }, w = (it(t, "useBgFill") ? n.background?.kind === "image" ? { kind: "none" } : n.background ?? { kind: "solid", color: { hex: "#ffffff" } } : void 0) ?? _t(c, l) ?? _e(h, l) ?? (p ? _t(y(m, "spPr"), p) : void 0) ?? (g ? _t(y(f, "spPr"), g) : void 0) ?? (p ? _e(y(m, "style"), p) : void 0) ?? { kind: "none" }, M = vr(
    () => Ht(y(c, "ln"), l),
    () => jn(h, l),
    () => p ? Ht(q(m, "spPr", "ln"), p) : void 0,
    () => g ? Ht(q(f, "spPr", "ln"), g) : void 0
  ) ?? null, S = [];
  if (u) {
    const B = m ? le(ye(m))?.type ?? u.type : u.type;
    S.push(Ce.has(B) ? n.masterTx.title : ["body", "obj", "subTitle", "tbl", "chart", "dgm", "media", "pic", "clipArt"].includes(B) ? n.masterTx.body : n.masterTx.other), S.push(q(f, "txBody", "lstStyle"), q(m, "txBody", "lstStyle"));
  } else
    S.push(n.defaultText);
  const O = y(h, "fontRef"), T = {
    levels: S,
    bodyPr: [q(f, "txBody", "bodyPr"), q(m, "txBody", "bodyPr")],
    fontRef: O ? { font: v(O, "idx") === "major" ? "+mj-lt" : "+mn-lt", color: ht(O, l.ctx) } : void 0
  }, E = Un(y(t, "txBody"), T, l);
  if (!(w.kind !== "none" || !!M || !!E)) return null;
  let R = x.textRect;
  const I = Et(y(c, "xfrm")), L = E ? Et(y(t, "txXfrm")) : null;
  if (L && I && I.w > 0 && I.h > 0) {
    const B = b.w / I.w, D = b.h / I.h, C = { l: (L.x - I.x) * B, t: (L.y - I.y) * D, r: (L.x + L.w - I.x) * B, b: (L.y + L.h - I.y) * D };
    (Math.abs(C.l) > 0.5 || Math.abs(C.t) > 0.5 || Math.abs(C.r - b.w) > 0.5 || Math.abs(C.b - b.h) > 0.5) && (R = C);
  }
  return { kind: "shape", id: o, name: i, ...b, geom: x.geom, fill: w, line: M, text: E, textBox: d || void 0, textRect: R };
}
const Cr = "{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}";
function Pr(t, e) {
  const n = { bdr: {} };
  if (!t) return n;
  const s = y(t, "tcStyle"), o = y(t, "tcTxStyle"), i = y(s, "fill"), r = i ? _t(i, e) : _e(s, e);
  r && (n.fill = r);
  const l = ht(o, e.ctx) ?? ht(y(o, "fontRef"), e.ctx);
  l && (n.text = l), v(o, "b") === "on" && (n.bold = !0);
  const a = y(s, "tcBdr");
  for (const u of ["left", "right", "top", "bottom", "insideH", "insideV"]) {
    const c = y(a, u);
    if (!c) continue;
    const h = Ht(y(c, "ln"), e) ?? jn(c, e);
    h !== void 0 && (n.bdr[u] = h);
  }
  return n;
}
function Ar(t, e, n) {
  const s = ((y(t, "tableStyleId")?.textContent || "").trim() || v(n, "def") || Cr).toUpperCase(), o = (d) => it(t, d) ?? !1, i = { firstRow: o("firstRow"), lastRow: o("lastRow"), firstCol: o("firstCol"), lastCol: o("lastCol"), bandRow: o("bandRow"), bandCol: o("bandCol") };
  let r = U(n, "tblStyle").find((d) => (v(d, "styleId") || "").toUpperCase() === s);
  if (!r) {
    const d = Oi(s);
    r = d ? y(e.pkg.parse(d), "tblStyle") ?? void 0 : void 0;
  }
  if (!r) return null;
  const l = (d) => Pr(y(r, d), e), a = y(r, "tblBg"), u = a ? y(a, "fill") ? _t(y(a, "fill"), e) : _e(a, e) : void 0, c = {
    whole: l("wholeTbl"),
    b1H: l("band1H"),
    b2H: l("band2H"),
    b1V: l("band1V"),
    b2V: l("band2V"),
    firstRow: l("firstRow"),
    lastRow: l("lastRow"),
    firstCol: l("firstCol"),
    lastCol: l("lastCol")
  }, h = (d, m, f, p) => {
    const g = [0, f - 1, 0, p - 1], b = [d, d, 0, p - 1], x = [0, f - 1, m, m], k = [[c.whole, g]], w = d - (i.firstRow ? 1 : 0), M = m - (i.firstCol ? 1 : 0), S = (!i.firstRow || d > 0) && (!i.lastRow || d < f - 1), O = (!i.firstCol || m > 0) && (!i.lastCol || m < p - 1);
    i.bandCol && M >= 0 && O && k.push([M % 2 === 0 ? c.b1V : c.b2V, x]), i.bandRow && w >= 0 && S && k.push([w % 2 === 0 ? c.b1H : c.b2H, b]), i.firstCol && m === 0 && k.push([c.firstCol, x]), i.lastCol && m === p - 1 && k.push([c.lastCol, x]), i.firstRow && d === 0 && k.push([c.firstRow, b]), i.lastRow && d === f - 1 && k.push([c.lastRow, b]);
    const T = { edges: {} };
    for (const [E, [$, R, I, L]] of k) {
      E.fill && (T.fill = E.fill), E.text && (T.text = E.text), E.bold && (T.bold = !0);
      const B = (C, P, F) => F ? E.bdr[C] : E.bdr[P], D = {
        t: B("top", "insideH", d === $),
        b: B("bottom", "insideH", d === R),
        l: B("left", "insideV", m === I),
        r: B("right", "insideV", m === L)
      };
      for (const C of ["t", "b", "l", "r"]) D[C] !== void 0 && (T.edges[C] = D[C]);
    }
    return T;
  };
  return u && u.kind !== "none" && (h.background = u), h;
}
function ys(t, e) {
  if (!t) return 0;
  const n = Math.max(8, e - t.insets.l - t.insets.r);
  if (t.vert) {
    const o = (l) => Math.max(0, ...l.runs.filter((a) => !a.br && a.text).map((a) => a.size ?? t.defaults?.size ?? 0)) || 18, i = (l) => o(l) * 1.2 * (t.lineSpacing ?? 1);
    let r = 0;
    if (t.vert === "stacked")
      for (const l of t.paragraphs) r = Math.max(r, l.runs.reduce((a, u) => a + u.text.length, 0) * i(l));
    else {
      const l = Math.max(1, Math.floor(n / Math.max(...t.paragraphs.map(i), 1)));
      r = t.paragraphs.reduce((u, c) => u + c.runs.reduce((h, d) => h + d.text.length, 0) * o(c) * 0.5, 0) / Math.max(1, l - t.paragraphs.length + 1) * 1.15;
    }
    return r + t.insets.t + t.insets.b;
  }
  let s = 0;
  for (const o of t.paragraphs) {
    const i = o.runs.filter((c) => !c.br), l = Math.max(0, ...i.filter((c) => c.text).map((c) => c.size ?? t.defaults?.size ?? 0)) || (o.endSize ?? 0) || 18, a = i.reduce((c, h) => c + h.text.length, 0), u = Math.max(1, Math.ceil(a * l * 0.5 / n)) + o.runs.filter((c) => c.br).length;
    s += u * l * 1.2 * (t.lineSpacing ?? 1) + (o.spaceBefore ?? 0) + (o.spaceAfter ?? 0);
  }
  return s + t.insets.t + t.insets.b;
}
function $r(t, e, n, s, o, i, r = 0) {
  const l = { pkg: n.pkg, part: e.part, ctx: n.ctx }, a = Et(y(t, "xfrm"));
  if (!a) return null;
  const u = q(t, "graphic", "graphicData"), c = y(u, "tbl");
  if (c) {
    const f = U(y(c, "tblGrid"), "gridCol").map((D) => at(N(D, "w"))), p = Ar(y(c, "tblPr"), l, n.tableStyles), g = [], b = [];
    let x = 1e6 + o * 1e3;
    const k = U(c, "tr"), w = k.map((D, C) => {
      const P = [];
      let F = 0, z = 0;
      for (const _ of U(D, "tc")) {
        const Q = Math.max(1, N(_, "gridSpan", 1));
        !it(_, "hMerge") && F < z && (F = z);
        const V = F, W = f.slice(V, V + Q).reduce((Y, Z) => Y + Z, 0);
        if (F += 1, it(_, "hMerge") || (z = V + Q), it(_, "hMerge") || it(_, "vMerge")) {
          P.push({
            covered: { h: it(_, "hMerge") || void 0, v: it(_, "vMerge") || void 0 },
            span: Q,
            rowSpan: 1,
            col: V,
            w: W,
            fill: { kind: "none" },
            border: null,
            sides: { l: null, r: null, t: null, b: null }
          });
          continue;
        }
        const X = y(_, "tcPr"), rt = p ? p(C, V, k.length, f.length) : null, ft = rt?.text ? { color: rt.text } : void 0, tt = Un(y(_, "txBody"), { levels: [n.defaultText], bodyPr: [], fontRef: ft }, l);
        if (tt && rt?.bold && tt.paragraphs.forEach((Y) => Y.runs.forEach((Z) => {
          Z.bold === void 0 && (Z.bold = !0);
        })), tt) {
          tt.insets = { l: at(N(X, "marL", 91440)), r: at(N(X, "marR", 91440)), t: at(N(X, "marT", 45720)), b: at(N(X, "marB", 45720)) }, tt.anchor = v(X, "anchor") === "ctr" ? "ctr" : v(X, "anchor") === "b" ? "b" : "t";
          const Y = bn(v(X, "vert"));
          Y ? tt.vert = Y : delete tt.vert;
        }
        const A = _t(X, l) ?? rt?.fill ?? { kind: "none" }, H = (Y, Z) => {
          const bt = Ht(y(X, Y), l);
          return bt !== void 0 ? bt : rt ? rt.edges[Z] ?? null : { width: 1, color: { hex: "#bfbfbf" } };
        }, K = { l: H("lnL", "l"), r: H("lnR", "r"), t: H("lnT", "t"), b: H("lnB", "b") }, kt = (Y, Z) => !Y && !Z || !!Y && !!Z && Y.width === Z.width && Y.color.hex === Z.color.hex && (Y.color.alpha ?? 1) === (Z.color.alpha ?? 1) && Y.dash === Z.dash, gt = [K.r, K.t, K.b].every((Y) => kt(Y, K.l)) ? K.l : null;
        P.push({
          span: Q,
          rowSpan: Math.max(1, N(_, "rowSpan", 1)),
          col: V,
          w: W,
          text: tt,
          fill: A,
          border: gt,
          sides: K,
          ...gt === null && Object.values(K).some(Boolean) && { split: !0 }
        });
      }
      return P;
    }), M = (D, C) => D < C * 0.7 ? C : D, S = k.map((D, C) => M(
      at(N(D, "h")),
      Math.max(0, ...w[C].filter((P) => !P.covered && P.rowSpan === 1).map((P) => ys(P.text, P.w)))
    ));
    w.forEach((D, C) => D.forEach((P) => {
      if (P.covered || P.rowSpan < 2) return;
      const F = Math.min(k.length, C + P.rowSpan) - 1, z = S.slice(C, F + 1).reduce((Q, V) => Q + V, 0), _ = ys(P.text, P.w);
      M(z, _) > z && (S[F] += _ - z);
    }));
    let O = a.y;
    const T = [], E = /* @__PURE__ */ new Set();
    if (w.forEach((D, C) => {
      const P = [];
      b.push({ h: S[C], cells: P });
      for (const F of D) {
        if (F.covered) {
          P.push({ fill: F.fill, borders: F.sides, hMerge: F.covered.h, vMerge: F.covered.v });
          continue;
        }
        const z = a.x + f.slice(0, F.col).reduce((Q, V) => Q + V, 0), _ = S.slice(C, C + F.rowSpan).reduce((Q, V) => Q + V, 0);
        if (g.push({
          kind: "shape",
          id: x++,
          name: `${i} cell`,
          ...s({ x: z, y: O, w: F.w, h: _, rot: 0, flipH: !1, flipV: !1 }),
          geom: { kind: "preset", prst: "rect" },
          fill: F.fill,
          line: F.border,
          text: F.text
        }), F.split) {
          const Q = (V, W, X, rt, ft) => {
            if (!ft) return;
            const tt = [V, W, X, rt].map((A) => Math.round(A * 10)).join(",");
            E.has(tt) || (E.add(tt), T.push({
              kind: "connector",
              id: x++,
              name: `${i} rule`,
              ...s({ x: V, y: W, w: X - V, h: rt - W, rot: 0, flipH: !1, flipV: !1 }),
              geom: { kind: "preset", prst: "line" },
              line: ft
            }));
          };
          Q(z, O, z + F.w, O, F.sides.t), Q(z, O + _, z + F.w, O + _, F.sides.b), Q(z, O, z, O + _, F.sides.l), Q(z + F.w, O, z + F.w, O + _, F.sides.r);
        }
        P.push({
          text: F.text ?? void 0,
          fill: F.fill,
          borders: F.sides,
          gridSpan: F.span > 1 ? F.span : void 0,
          rowSpan: F.rowSpan > 1 ? F.rowSpan : void 0
        });
      }
      O += S[C];
    }), !g.length) return null;
    if (g.push(...T), p?.background) {
      const D = Xe(g);
      g.unshift({
        kind: "shape",
        id: x++,
        name: `${i} background`,
        x: D.x,
        y: D.y,
        w: D.w,
        h: D.h,
        rot: 0,
        flipH: !1,
        flipV: !1,
        geom: { kind: "preset", prst: "rect" },
        fill: p.background,
        line: null
      });
    }
    const $ = { kind: "group", id: o, name: i, ...Xe(g), children: g }, R = s({ ...a, w: f.reduce((D, C) => D + C, 0), h: b.reduce((D, C) => D + C.h, 0) });
    if (p?.background || R.rot || R.flipH || R.flipV || b.some((D) => D.cells.length !== f.length)) return $;
    const I = R.w / Math.max(1e-6, f.reduce((D, C) => D + C, 0)), L = R.h / Math.max(1e-6, b.reduce((D, C) => D + C.h, 0)), B = (D) => it(y(c, "tblPr"), D) ?? !1;
    return {
      kind: "table",
      id: o,
      name: i,
      x: R.x,
      y: R.y,
      w: R.w,
      h: R.h,
      cols: f.map((D) => D * I),
      rows: b.map((D) => ({ ...D, h: D.h * L })),
      firstRow: B("firstRow") || void 0,
      bandRow: B("bandRow") || void 0,
      fallback: $
    };
  }
  const h = v(u, "uri") || "";
  if (/diagram/.test(h)) {
    const f = Br(u, e, n, s, a, o, i, r);
    if (f) return f;
    const p = Dr(u, e, n, s, a, o, i, l);
    if (p) return p;
  }
  if (/drawingml\/2006\/chart$/.test(h)) {
    const f = Ir(u, e, n);
    if (f) return { kind: "chart", id: o, name: i, ...s(a), chart: f };
  }
  if (/chartex$/i.test(h)) {
    const f = Fr(u, e, n), p = s(a);
    let g = 3e6 + o * 2e3;
    const b = f ? Wi(Ri(f, p.x, p.y, p.w, p.h), o, i, { x: p.x, y: p.y, w: p.w, h: p.h }, () => g++) : null;
    if (b && f)
      return b.descr = _i(f), b;
    for (const x of mo.get(t) ?? []) {
      const k = wo(x, e, n, s, r, !1), w = Array.isArray(k) ? k[0] : k;
      if (w) return w;
    }
  }
  const d = Or(u, l, n);
  if (d) return d(o, i, s(a));
  const m = /chart/.test(h) ? "Chart" : /diagram/.test(h) ? "SmartArt diagram" : "Embedded object";
  return n.warnings.push(`${m} "${i}" was imported as a placeholder frame.`), {
    kind: "shape",
    id: o,
    name: i,
    ...s(a),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "solid", color: { hex: "#f1f3f5" } },
    line: { width: 1, color: { hex: "#adb5bd" }, dash: "dash" },
    text: { paragraphs: [{ runs: [{ text: `${m}: ${i}`, size: 16, color: { hex: "#495057" } }], align: "ctr" }], anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  };
}
function Or(t, e, n) {
  const s = pt(t, "oleObj", 3), o = v(t, "uri") || "";
  if (!s && /chart|diagram/.test(o)) return null;
  const i = s ? y(s, "pic") : null, r = i ? y(i, "blipFill") : pt(t, "blip", 8)?.parentElement ?? null;
  let l = r ? zn(r, e) : null;
  if (!l && s && (l = Tr(e, v(s, "spid"))), !l) return null;
  const a = s ? v(s, "progId") || v(s, "name") || "Object" : o.split("/").pop() || "Object";
  n.warnings.push(`Embedded object "${a}" was imported as its preview picture; the object itself can't be edited in Yappy.`);
  const u = i ? y(i, "spPr") : null, c = u ? _t(u, e) : void 0, h = u ? Ht(y(u, "ln"), e) : void 0, d = r ? y(r, "srcRect") : null, m = d ? { l: N(d, "l") / 1e5, t: N(d, "t") / 1e5, r: N(d, "r") / 1e5, b: N(d, "b") / 1e5 } : void 0;
  return (f, p, g) => {
    const b = { kind: "picture", id: f, name: p, ...g, media: l, crop: m };
    if ((!c || c.kind === "none") && !h) return b;
    const x = { x: g.x, y: g.y, w: g.w, h: g.h }, k = {
      kind: "shape",
      id: 2e6 + f,
      name: `${p} frame`,
      ...x,
      geom: { kind: "preset", prst: "rect" },
      fill: c ?? { kind: "none" },
      line: h ?? null
    };
    return { kind: "group", id: f, name: p, ...g, children: [k, { ...b, id: 21e5 + f, ...x }] };
  };
}
function Tr(t, e) {
  if (!e) return null;
  for (const n of t.pkg.rels(t.part).values()) {
    if (n.type !== "vmlDrawing" && n.type !== "legacyDrawing" || n.external) continue;
    const s = t.pkg.xml(n.target);
    if (s)
      for (const o of Array.from(s.getElementsByTagName("*"))) {
        if (o.localName !== "shape" || v(o, "id") !== e) continue;
        const i = Array.from(o.getElementsByTagName("*")).find((a) => a.localName === "imagedata"), r = v(i, "o:relid") || v(i, "r:id"), l = r ? t.pkg.rels(n.target).get(r) : void 0;
        return !l || l.external ? null : bo(t.pkg, l.target);
      }
  }
  return null;
}
const ks = {
  barChart: "column",
  bar3DChart: "column",
  lineChart: "line",
  line3DChart: "line",
  areaChart: "area",
  area3DChart: "area",
  pieChart: "pie",
  pie3DChart: "pie",
  ofPieChart: "pie",
  doughnutChart: "doughnut",
  scatterChart: "scatter",
  bubbleChart: "bubble",
  radarChart: "radar",
  stockChart: "stock"
};
function Er(t) {
  const e = t.replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/\\./g, "");
  return !/^general$/i.test(e.trim()) && /[dmy]/i.test(e) && !/[#0?]/.test(e);
}
const ws = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function Nr(t, e, n = !1) {
  const s = Date.UTC(1899, 11, 30) + (Math.floor(t) + (n ? 1462 : 0)) * 864e5, o = new Date(s);
  if (!Number.isFinite(o.getTime())) return String(t);
  const i = o.getUTCFullYear(), r = o.getUTCMonth(), l = o.getUTCDate();
  return e.replace(/\[[^\]]*\]/g, "").replace(/;.*$/, "").replace(/"([^"]*)"|\\(.)|yyyy|yy|mmmm|mmm|mm|m|dddd|ddd|dd|d|[hs]+|AM\/PM|[:.]?[hs]/gi, (u, c, h) => {
    if (c !== void 0) return c;
    if (h !== void 0) return h;
    switch (u.toLowerCase()) {
      case "yyyy":
        return String(i);
      case "yy":
        return String(i % 100).padStart(2, "0");
      case "mmmm":
        return ws[r];
      case "mmm":
        return ws[r].slice(0, 3);
      case "mm":
        return String(r + 1).padStart(2, "0");
      case "m":
        return String(r + 1);
      case "dddd":
        return o.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      case "ddd":
        return o.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
      case "dd":
        return String(l).padStart(2, "0");
      case "d":
        return String(l);
      default:
        return "";
    }
  }).replace(/\s+$/, "").replace(/[:.\s]+$/, "");
}
function Ir(t, e, n) {
  const s = pt(t, "chart", 2), o = s ? n.pkg.rels(e.part).get(v(s, "r:id") || "") : void 0, i = o && !o.external ? n.pkg.xml(o.target) : null, r = y(i, "chart"), l = y(r, "plotArea");
  if (!l) return null;
  const a = Rt(l).find((A) => ks[A.localName]);
  if (!a) return null;
  const u = Rt(l).filter((A) => /Chart$/.test(A.localName)), c = (A) => {
    let H = ks[A.localName];
    return H === "column" && v(y(A, "barDir"), "val") === "bar" && (H = "bar"), H === "radar" && v(y(A, "radarStyle"), "val") === "filled" && (H = "filledRadar"), H;
  }, h = c(a), d = Ze(h), m = u.filter((A) => d ? Ze(c(A)) : A.localName === a.localName), f = u.filter((A) => !m.includes(A)).map((A) => A.localName.replace(/(3D)?Chart$/, ""));
  f.length && n.warnings.push(`A combination chart came in without its ${[...new Set(f)].join(" and ")} part.`);
  const p = new Set(U(l, "valAx").map((A) => v(y(A, "axId"), "val"))), g = (A) => U(A, "axId").map((H) => v(H, "val")).find((H) => p.has(H)) ?? null, b = g(m[0]), x = h === "scatter" || h === "bubble", k = v(y(i, "date1904"), "val") === "1", w = v(y(a, "grouping"), "val") || "";
  let M = n.ctx;
  const S = n.pkg.relOfType(o.target, "themeOverride"), O = S ? y(n.pkg.xml(S), "clrScheme") : null;
  if (O) {
    const A = { ...M.theme.colors, ...go(O) };
    M = { ...M, theme: { ...M.theme, colors: A } };
  }
  const T = y(i, "clrMapOvr");
  if (T && T.attributes.length) {
    const A = { ...M.clrMap };
    for (let H = 0; H < T.attributes.length; H++) A[T.attributes[H].localName ?? T.attributes[H].name] = T.attributes[H].value;
    M = { ...M, clrMap: A };
  }
  const E = (A, H = !1) => {
    const K = pt(A, "strCache", 3) ?? pt(A, "numCache", 3) ?? pt(A, "strLit", 2) ?? pt(A, "numLit", 2) ?? y(pt(A, "multiLvlStrCache", 3), "lvl");
    if (!K) return [];
    const kt = Math.min(1e4, N(y(K, "ptCount"), "val")), gt = new Array(Math.max(0, kt)).fill(""), Y = /num/.test(K.localName) ? y(K, "formatCode")?.textContent ?? "" : "", Z = H && !!Y && Er(Y);
    for (const bt of U(K, "pt")) {
      const dt = N(bt, "idx");
      if (!(dt >= 0 && dt < 1e4)) continue;
      const st = y(bt, "v")?.textContent ?? "";
      gt[dt] = Z && st.trim() && Number.isFinite(Number(st)) ? Nr(Number(st), v(bt, "formatCode") || Y, k) : st;
    }
    return gt;
  }, $ = m.flatMap((A) => U(A, "ser").map((H) => ({ el: H, kind: c(A), secondary: d && g(A) !== b }))).slice(0, 64), R = $.map((A) => A.el);
  if (!R.length) return null;
  const I = (A) => E(A).map((H) => H === "" ? null : Number.isFinite(Number(H)) ? Number(H) : null), L = (A) => E(y(A, x ? "xVal" : "cat") ?? y(A, "cat"), !0);
  let B = L(R[0]), D = R.map((A, H) => {
    const K = I(y(A, x ? "yVal" : "val") ?? y(A, "val")), kt = h === "bubble" ? I(y(A, "bubbleSize")) : null, gt = E(y(A, "tx"))[0] || y(A, "tx")?.textContent?.trim() || `Series ${H + 1}`, Y = y(A, "spPr"), Z = ht(y(Y, "solidFill"), M) ?? ht(y(y(Y, "ln"), "solidFill"), M) ?? ht(y(q(A, "marker", "spPr"), "solidFill"), M), bt = $[H].kind;
    return {
      name: gt,
      values: K,
      ...kt && { sizes: kt },
      ...Z && { color: Z.hex },
      ...d && Ze(bt) && bt !== h && { kind: bt },
      ...$[H].secondary && { secondary: !0 }
    };
  });
  if (x && R.length > 1) {
    const A = R.map(L);
    if (!A.every((K) => !K.length || K.length === B.length && K.every((kt, gt) => kt === B[gt]))) {
      const K = D.map((Y, Z) => {
        const bt = A[Z].length ? A[Z] : B;
        return Math.max(bt.length, Y.values.length);
      }), kt = K.reduce((Y, Z) => Y + Z, 0), gt = [];
      D = D.map((Y, Z) => {
        const bt = A[Z].length ? A[Z] : B, dt = gt.length;
        for (let ot = 0; ot < K[Z]; ot++) gt.push(bt[ot] ?? "");
        const st = new Array(kt).fill(null), et = Y.sizes ? new Array(kt).fill(null) : void 0;
        for (let ot = 0; ot < K[Z]; ot++)
          st[dt + ot] = Y.values[ot] ?? null, et && (et[dt + ot] = Y.sizes?.[ot] ?? null);
        return { ...Y, values: st, ...et && { sizes: et } };
      }), B = gt, n.warnings.push("A scatter chart's series had their own X values; they were merged into one X column.");
    }
  }
  x && (B = B.map((A) => A.trim() && Number.isFinite(Number(A)) ? String(Number(Number(A).toPrecision(15))) : A));
  const C = Math.max(B.length, ...D.map((A) => Math.max(A.values.length, A.sizes?.length ?? 0)));
  for (; B.length < C; ) B.push(String(B.length + 1));
  const P = v(y(a, "scatterStyle"), "val") || "marker", F = h === "scatter" && /line|smooth/i.test(P) && R.some((A) => !y(y(y(A, "spPr"), "ln"), "noFill")), z = F && (/smooth/i.test(P) || R.some((A) => ["1", "true"].includes(v(y(A, "smooth"), "val") || ""))), _ = y(r, "title"), Q = _ ? ce(_, "t", 8).map((A) => A.textContent ?? "").join("").trim() || (D.length === 1 ? D[0].name : "") : "", V = v(q(r, "legend", "legendPos"), "val"), W = x && U(l, "valAx").find((A) => /^[lr]$/.test(v(y(A, "axPos"), "val") || "")) || b !== null && U(l, "valAx").find((A) => v(y(A, "axId"), "val") === b) || y(l, "valAx"), X = y(W, "scaling"), rt = (A) => {
    const H = y(A, "dLbls");
    return !!H && (v(y(H, "showVal"), "val") === "1" || v(y(H, "showPercent"), "val") === "1");
  }, ft = v(y(X, "max"), "val"), tt = v(y(X, "min"), "val");
  return {
    kind: h,
    categories: B,
    series: D,
    ...Q && { title: Q },
    ...(w === "stacked" || w === "percentStacked") && { stacked: !0 },
    ...w === "percentStacked" && { percent: !0 },
    legend: y(r, "legend") ? V === "b" ? "bottom" : V === "t" ? "top" : "right" : "none",
    ...(rt(a) || R.some(rt)) && { dataLabels: !0 },
    gridlines: !!y(W, "majorGridlines"),
    ...ft !== null && Number.isFinite(Number(ft)) && { yMax: Number(ft) },
    ...tt !== null && Number.isFinite(Number(tt)) && { yMin: Number(tt) },
    ...F && { lines: !0 },
    ...z && { smooth: !0 }
  };
}
const Rr = {
  waterfall: "waterfall",
  funnel: "funnel",
  clusteredColumn: "histogram",
  boxWhisker: "boxWhisker",
  treemap: "treemap",
  sunburst: "sunburst"
};
function Fr(t, e, n) {
  const s = pt(t, "chart", 2), o = s ? n.pkg.rels(e.part).get(v(s, "r:id") || "") : void 0, i = o && !o.external ? n.pkg.xml(o.target) : null;
  if (!i || i.localName !== "chartSpace") return null;
  const r = 1e5, l = (b) => {
    if (!b) return [];
    const x = U(b, "pt").slice(0, r), k = Math.min(r, Math.max(N(b, "ptCount"), ...x.map((M) => N(M, "idx") + 1), 0)), w = new Array(k).fill("");
    for (const M of x) {
      const S = N(M, "idx");
      S >= 0 && S < k && (w[S] = M.textContent ?? "");
    }
    return w;
  }, a = /* @__PURE__ */ new Map();
  for (const b of U(y(i, "chartData"), "data").slice(0, 64)) {
    const x = { categories: [], levels: [], values: [] };
    for (const k of U(b)) {
      const w = U(k, "lvl"), M = v(k, "type") || "";
      k.localName === "strDim" || k.localName === "numDim" && M === "cat" ? (x.categories = l(w[0] ?? null), x.levels = w.slice(1, 8).map(l)) : k.localName === "numDim" && (M === "val" || M === "size" || !x.values.length) && (x.values = l(w[0] ?? null).map((S) => S.trim() && Number.isFinite(Number(S)) ? Number(S) : null));
    }
    a.set(v(b, "id") || "0", x);
  }
  const u = y(i, "chart"), c = q(u, "plotArea", "plotAreaRegion");
  if (!c) return null;
  let h = null, d = !1;
  const m = { kind: "funnel", categories: [], series: [] };
  for (const b of U(c, "series").slice(0, 256)) {
    const x = v(b, "layoutId") || "";
    if (x === "paretoLine") {
      d = !0;
      continue;
    }
    const k = Rr[x];
    if (!k) return null;
    if (it(b, "hidden")) continue;
    h ??= k;
    const w = a.get(v(y(b, "dataId"), "val") || "0");
    if (!w) continue;
    const M = pt(y(b, "tx"), "v", 3)?.textContent ?? "";
    !m.categories.length && (w.categories.length || w.levels.length) && (m.categories = w.categories, m.levels = w.levels), m.series.push({ name: M, values: w.values, ...k === "boxWhisker" && { categories: w.categories } });
    const S = y(b, "layoutPr"), O = U(y(S, "subtotals"), "idx").map(($) => N($, "val")).filter(($) => $ >= 0);
    O.length && (m.subtotals = O);
    const T = y(S, "binning");
    if (T) {
      const $ = N(y(T, "binCount"), "val"), R = Number(v(y(T, "binSize"), "val"));
      m.binning = { ...$ > 0 && { count: $ }, ...R > 0 && Number.isFinite(R) && { size: R } };
    }
    v(y(S, "statistics"), "quartileMethod") === "inclusive" && (m.inclusive = !0);
    const E = y(b, "dataLabels");
    E && !it(E, "hidden") && v(y(E, "visibility"), "value") !== "0" && (m.dataLabels = !0);
  }
  if (!h || !m.series.some((b) => b.values.some((x) => x !== null))) return null;
  m.kind = h === "histogram" && d ? "pareto" : h;
  const f = y(u, "title");
  if (f) {
    const b = ce(f, "v", 8).map((x) => x.textContent ?? "").join("").trim();
    m.title = b || ce(f, "t", 8).map((x) => x.textContent ?? "").join("").trim() || "Chart Title";
  }
  const p = y(u, "legend");
  m.legend = p ? v(p, "pos") === "b" ? "bottom" : "top" : "none";
  const g = ["accent1", "accent2", "accent3", "accent4", "accent5", "accent6"].map((b) => n.ctx.theme.colors[b]).filter((b) => !!b);
  return g.length === 6 && (m.colors = g), m;
}
function Br(t, e, n, s, o, i, r, l) {
  const a = n.pkg.rels(e.part), u = v(y(t, "relIds"), "r:dm"), c = u ? a.get(u) : void 0;
  let h;
  if (c && !c.external) {
    const b = pt(n.pkg.xml(c.target), "dataModelExt", 6), x = b ? a.get(v(b, "relId") || "") : void 0;
    x && !x.external && (h = x.target);
  }
  if (!h) {
    const b = [...a.values()].filter((x) => x.type === "diagramDrawing" && !x.external);
    b.length === 1 && (h = b[0].target);
  }
  if (!h) return null;
  const d = y(n.pkg.xml(h), "spTree");
  if (!d) return null;
  const f = we(d, { part: h, tree: d }, n, (b) => s({ ...b, x: b.x + o.x, y: b.y + o.y }), l + 1, !0);
  if (!f.length) return null;
  let p = 2e6 + i * 1e3;
  const g = (b) => b.forEach((x) => {
    x.id = p++, x.kind === "group" && g(x.children);
  });
  return g(f), { kind: "group", id: i, name: r, ...Xe(f), children: f };
}
function Dr(t, e, n, s, o, i, r, l) {
  const a = v(y(t, "relIds"), "r:dm"), u = a ? n.pkg.rels(e.part).get(a) : void 0;
  if (!u || u.external) return null;
  const c = n.pkg.xml(u.target), h = /* @__PURE__ */ new Map();
  for (const b of U(y(c, "ptLst"), "pt")) h.set(v(b, "modelId") || "", b);
  const d = /* @__PURE__ */ new Map();
  for (const b of U(y(c, "cxnLst"), "cxn")) {
    if ((v(b, "type") || "parOf") !== "parOf") continue;
    const x = v(b, "srcId") || "", k = v(b, "destId") || "";
    d.has(x) || d.set(x, []), d.get(x).push({ id: k, ord: N(b, "srcOrd") });
  }
  const m = [...h.values()].find((b) => v(b, "type") === "doc");
  if (!m) return null;
  const f = [], p = /* @__PURE__ */ new Set(), g = (b, x) => {
    if (!(p.has(b) || x > 16 || f.length > 500)) {
      p.add(b);
      for (const k of (d.get(b) ?? []).sort((w, M) => w.ord - M.ord)) {
        const w = h.get(k.id), M = v(w, "type") || "node";
        if (!w || M !== "node" && M !== "asst") continue;
        const S = Un(y(w, "t"), { levels: [n.defaultText], bodyPr: [] }, l);
        for (const O of S?.paragraphs ?? [])
          O.runs.some((T) => !T.br && T.text.trim()) && f.push({
            ...O,
            align: "l",
            level: x,
            ...x > 0 ? { bullet: "char" } : {},
            runs: O.runs.map((T) => ({ ...T, size: T.size ?? (x > 0 ? 16 : 18), bold: T.bold ?? (x === 0 ? !0 : void 0) }))
          });
        g(k.id, x + 1);
      }
    }
  };
  return g(v(m, "modelId") || "", 0), f.length ? (n.warnings.push(`SmartArt diagram "${r}" had no saved drawing; its text was imported as a list.`), {
    kind: "shape",
    id: i,
    name: r,
    ...s(o),
    geom: { kind: "preset", prst: "rect" },
    fill: { kind: "none" },
    line: null,
    textBox: !0,
    text: { paragraphs: f, anchor: "ctr", insets: { l: 8, t: 8, r: 8, b: 8 }, wrap: !0 }
  }) : null;
}
function pt(t, e, n) {
  if (!t || n < 0) return null;
  for (const s of Rt(t)) {
    if (s.localName === e) return s;
    const o = pt(s, e, n - 1);
    if (o) return o;
  }
  return null;
}
function nn(t, e) {
  const n = y(t, "bg");
  if (!n) return;
  const s = y(n, "bgPr");
  if (s)
    return _t(s, e);
  const o = y(n, "bgRef");
  if (o) {
    const i = N(o, "idx"), l = (i >= 1001 ? e.ctx.theme.bgFills : e.ctx.theme.fills)[i >= 1001 ? i - 1001 : i - 1];
    return (l ? Ln(l, { ...e, ctx: { ...e.ctx, phClr: ht(o, e.ctx) ?? void 0 } }) : void 0) ?? (ht(o, e.ctx) ? { kind: "solid", color: ht(o, e.ctx) } : void 0);
  }
}
function Lr(t, e) {
  const n = t.relOfType(e, "notesSlide"), s = n ? q(t.xml(n), "cSld", "spTree") : null;
  if (!s) return;
  const o = [], i = (l) => {
    for (const a of Rt(l)) {
      if (a.localName === "grpSp") {
        i(a);
        continue;
      }
      if (a.localName !== "sp") continue;
      const u = le(ye(a));
      if (!(!u || u.type !== "body" && u.type !== "obj"))
        for (const c of U(y(a, "txBody"), "p")) {
          let h = "";
          for (const d of U(c))
            d.localName === "r" || d.localName === "fld" ? h += y(d, "t")?.textContent ?? "" : d.localName === "br" && (h += `
`);
          o.push(h);
        }
    }
  };
  i(s);
  const r = o.join(`
`).replace(/\s+$/, "");
  return r.trim() ? r : void 0;
}
function zr(t) {
  for (const l of U(t, "AlternateContent"))
    for (const a of U(l, "Choice")) {
      const u = y(a, "transition");
      if (u && y(u, "morph")) {
        const c = v(u, "spd");
        return { kind: "morph", durationMs: v(u, "p14:dur") !== null ? N(u, "p14:dur") : c === "fast" ? 500 : c === "slow" ? 1e3 : 750 };
      }
    }
  const e = Rt(t).find((l) => l.localName === "transition");
  if (!e) return;
  const n = U(e).find((l) => l.localName !== "sndAc" && l.localName !== "extLst");
  if (!n) return;
  const s = v(e, "spd"), o = v(e, "p14:dur") !== null ? N(e, "p14:dur") : s === "fast" ? 500 : s === "slow" ? 1e3 : 750, i = v(n, "dir"), r = (l) => l?.[0] === "r" || l?.[0] === "u" || l?.[0] === "d" ? l[0] : "l";
  switch (n.localName) {
    case "push":
    case "cover":
    case "pull":
    case "wipe":
      return { kind: n.localName, dir: r(i), durationMs: o };
    case "split":
      return { kind: "split", orient: v(n, "orient") === "vert" ? "vert" : "horz", inward: i === "in" || void 0, durationMs: o };
    case "zoom":
      return { kind: "zoom", zoomIn: i !== "out", durationMs: o };
    case "morph":
      return { kind: "morph", durationMs: o };
    case "cut":
      return;
    default:
      return { kind: "fade", durationMs: o };
  }
}
function jr(t, e) {
  const n = q(t, "timing", "tnLst");
  if (!n) return [];
  const s = [];
  let o = 0;
  const i = [], r = (l, a) => {
    if (!(a > 40))
      for (const u of Rt(l)) {
        if (u.localName === "seq") {
          const c = y(u, "cTn"), h = v(c, "nodeType");
          if (h && h !== "mainSeq") {
            Ur(c) || o++;
            continue;
          }
        }
        if (!(u.localName === "cTn" && v(u, "presetClass") === "mediacall")) {
          if (u.localName === "cTn" && v(u, "presetClass")) {
            i.push(u);
            continue;
          }
          r(u, a + 1);
        }
      }
  };
  r(n, 0);
  for (const l of i) {
    const a = v(l, "presetClass");
    if (a !== "entr" && a !== "exit" && a !== "emph") {
      o++;
      continue;
    }
    const u = N(l, "presetID"), c = N(l, "presetSubtype"), h = v(l, "nodeType"), d = h === "clickEffect" ? "click" : h === "afterEffect" ? "after" : "with", m = Number(v(q(l, "stCondLst", "cond"), "delay")), f = ce(y(l, "childTnLst"), "cBhvr", 4), p = f.map((O) => pt(O, "spTgt", 2)).find(Boolean), g = p ? N(p, "spid") : NaN;
    if (!Number.isFinite(g) || pt(p, "txEl", 1)) {
      o++;
      continue;
    }
    const b = f.map((O) => Number(v(y(O, "cTn"), "dur"))).filter((O) => Number.isFinite(O) && O > 1), x = b.length ? Math.max(...b) : 500, { effect: k, known: w } = ui(a, u);
    w || e(`An animation PowerPoint calls preset ${u} (${a}) came in as a plain ${k}.`);
    const M = ce(y(l, "childTnLst"), "animRot", 2)[0], S = v(l, "repeatCount");
    s.push({
      target: g,
      cls: a,
      effect: k,
      presetId: u,
      subtype: c,
      start: d,
      durationMs: x,
      delayMs: Number.isFinite(m) ? Math.max(0, m) : 0,
      ...ss(c) && (k === "fly" || k === "wipe") && { dir: ss(c) },
      ...k === "spin" && M && { degrees: N(M, "by") / 6e4 },
      ...S === "indefinite" ? { repeat: -1 } : S && Number(S) > 1e3 ? { repeat: Math.round(Number(S) / 1e3) } : {}
    });
  }
  return o && e(`${o} animation(s) couldn't be imported (motion paths, triggered or by-paragraph effects).`), s;
}
function Ur(t) {
  const e = Gt(t, "cTn", 12).filter((n) => v(n, "presetClass"));
  return e.length > 0 && e.every((n) => v(n, "presetClass") === "mediacall");
}
function _r(t, e) {
  const n = q(t, "timing", "tnLst");
  if (!n) return;
  const s = /* @__PURE__ */ new Map(), o = (l) => l.forEach((a) => {
    a.kind === "media" ? s.set(a.id, a) : a.kind === "group" && o(a.children);
  });
  if (o(e), !s.size) return;
  const i = (l) => {
    const a = pt(l, "spTgt", 6);
    return a ? N(a, "spid", NaN) : NaN;
  };
  for (const l of [...Gt(n, "video", 12), ...Gt(n, "audio", 12)]) {
    const a = y(l, "cMediaNode"), u = s.get(i(y(a, "tgtEl")));
    if (!a || !u) continue;
    const c = v(a, "vol");
    (it(a, "mute") || c !== null && Number(c) === 0) && (u.muted = !0), v(y(a, "cTn"), "repeatCount") === "indefinite" && (u.loop = !0);
  }
  const r = Gt(n, "cTn", 8).find((l) => v(l, "nodeType") === "mainSeq");
  if (r)
    for (const l of Gt(r, "cTn", 40).filter((a) => v(a, "presetClass"))) {
      if (v(l, "nodeType") === "clickEffect") break;
      if (v(l, "presetClass") !== "mediacall") continue;
      const a = Gt(l, "cmd", 3)[0];
      if (!/^playFrom/.test(v(a, "cmd") || "")) continue;
      const u = s.get(i(a));
      u && (u.autoplay = !0);
    }
}
function Gt(t, e, n) {
  if (!t || n < 0) return [];
  const s = [];
  for (const o of Rt(t))
    o.localName === e && s.push(o), s.push(...Gt(o, e, n - 1));
  return s;
}
function ce(t, e, n) {
  if (!t || n < 0) return [];
  const s = [];
  for (const o of Rt(t))
    o.localName === e ? s.push(o) : s.push(...ce(o, e, n - 1));
  return s;
}
function Ms(t) {
  const e = Rt(t).find((o) => o.localName === "transition"), n = e ? v(e, "advTm") : null, s = n !== null ? Number(n) : NaN;
  return Number.isFinite(s) && s > 0 ? s : void 0;
}
function Hr(t, e) {
  const n = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
  for (const i of U(y(t, "sldIdLst"), "sldId")) {
    const r = e.get(v(i, "r:id") || ""), l = v(i, "id");
    r && l && s.set(l, r.target);
  }
  const o = pt(y(t, "extLst"), "sectionLst", 4);
  for (const i of U(o, "section")) {
    const r = (v(i, "name") || "").trim(), l = U(y(i, "sldIdLst"), "sldId")[0], a = l ? s.get(v(l, "id") || "") : void 0;
    r && a && !n.has(a) && n.set(a, r);
  }
  return n;
}
function Xr(t, e = {}) {
  const n = [], s = (I) => {
    n.length < 200 && !n.includes(I) && n.push(I);
  }, o = e.parseXml ?? ((I) => new DOMParser().parseFromString(I, "application/xml"));
  let i, r = 0, l = 0;
  try {
    i = ii(t, {
      filter: (I) => (r++, l += I.originalSize, r <= cs && I.originalSize <= Ki && l <= us)
    });
  } catch {
    throw new Error("This file is not a PowerPoint presentation (it is not a valid .pptx package).");
  }
  (r > cs || l > us) && s("The file is very large; some parts were skipped.");
  const a = new nr(i, o, s), u = a.relOfType("", "officeDocument") ?? "ppt/presentation.xml", c = a.xml(u);
  if (!c || c.localName !== "presentation") throw new Error("This file is not a PowerPoint presentation (no presentation part).");
  const h = y(c, "sldSz"), d = h ? Math.max(1, at(N(h, "cx", 9144e3))) : 960, m = h ? Math.max(1, at(N(h, "cy", 5143500))) : 540, f = y(c, "defaultTextStyle"), p = a.rels(u), g = a.relOfType(u, "tableStyles"), b = g ? a.xml(g) : null, x = [], k = /* @__PURE__ */ new Set();
  for (const I of U(y(c, "sldIdLst"), "sldId")) {
    const L = p.get(v(I, "r:id") || "");
    L && !k.has(L.target) && x.length < Ji && (k.add(L.target), x.push(L.target));
  }
  const w = /* @__PURE__ */ new Map(), M = (I) => {
    const L = a.relOfType(I, "theme");
    return L ? (w.has(L) || w.set(L, Je(a.xml(L))), w.get(L)) : Je(null);
  }, S = (I) => {
    if (!I) return null;
    const L = {};
    for (let B = 0; B < I.attributes.length; B++) L[I.attributes[B].localName ?? I.attributes[B].name] = I.attributes[B].value;
    return L;
  }, O = Hr(c, p), T = [];
  x.forEach((I, L) => {
    const B = a.xml(I);
    if (!B) {
      s(`Slide ${L + 1} couldn't be read and was skipped.`);
      return;
    }
    const D = a.relOfType(I, "slideLayout"), C = D ? a.xml(D) : null, P = D ? a.relOfType(D, "slideMaster") : null, F = P ? a.xml(P) : null, z = P ? M(P) : Je(null), _ = S(q(B, "clrMapOvr", "overrideClrMapping")) ?? S(q(C, "clrMapOvr", "overrideClrMapping")) ?? S(y(F, "clrMap")) ?? Dn, Q = { theme: z, clrMap: _ }, V = y(F, "txStyles"), W = {
      pkg: a,
      ctx: Q,
      slide: { part: I, tree: q(B, "cSld", "spTree") },
      layout: D ? { part: D, tree: q(C, "cSld", "spTree") } : null,
      master: P ? { part: P, tree: q(F, "cSld", "spTree") } : null,
      masterTx: { title: y(V, "titleStyle"), body: y(V, "bodyStyle"), other: y(V, "otherStyle") },
      defaultText: f,
      warnings: n,
      count: 0,
      tableStyles: b
    }, X = (K) => ({ pkg: a, part: K?.part ?? I, ctx: Q }), rt = nn(y(B, "cSld"), X(W.slide)) ?? nn(y(C, "cSld"), X(W.layout)) ?? nn(y(F, "cSld"), X(W.master)) ?? { kind: "solid", color: { hex: "#ffffff" } };
    W.background = rt;
    const ft = [], tt = it(B, "showMasterSp") !== !1 && it(C, "showMasterSp") !== !1;
    W.master && tt && ft.push(...we(W.master.tree, W.master, W, en, 0, !1)), W.layout && it(B, "showMasterSp") !== !1 && ft.push(...we(W.layout.tree, W.layout, W, en, 0, !1));
    const A = we(W.slide.tree, W.slide, W, en, 0, !0);
    _r(B, A), ft.push(...A), T.push({
      items: ft,
      background: rt,
      transition: zr(B),
      name: v(y(B, "cSld"), "name") || void 0,
      notes: Lr(a, I),
      key: I,
      ...v(B, "show") === "0" && { hidden: !0 },
      ...Ms(B) && { advanceAfterMs: Ms(B) },
      ...O.has(I) && { section: O.get(I) }
    });
    const H = jr(B, s);
    H.length && (T[T.length - 1].anims = H);
  }), T.length || s("The presentation has no slides.");
  const E = q(a.xml("docProps/core.xml"), "title")?.textContent || void 0, $ = a.relOfType(u, "presProps"), R = v(y($ ? a.xml($) : null, "showPr"), "loop");
  return { deck: { width: d, height: m, slides: T, title: E, ...(R === "1" || R === "true") && { loop: !0 } }, warnings: n };
}
class Mo extends Error {
  constructor() {
    super("short read");
  }
}
class Qt {
  b;
  view;
  constructor(e) {
    this.b = e, this.view = new DataView(e.buffer, e.byteOffset, e.byteLength);
  }
  get length() {
    return this.b.length;
  }
  need(e, n) {
    if (!Number.isInteger(e) || e < 0 || n < 0 || e + n > this.b.length) throw new Mo();
    return e;
  }
  /** `len` bytes at `off`. */
  slice(e, n) {
    return this.need(e, n), this.b.subarray(e, e + n);
  }
  /** Everything from `off`. */
  tail(e) {
    return this.need(e, 0), new Qt(this.b.subarray(e));
  }
  sub(e, n) {
    return new Qt(this.slice(e, n));
  }
  u8(e) {
    return this.b[this.need(e, 1)];
  }
  u16(e) {
    return this.view.getUint16(this.need(e, 2), !0);
  }
  i16(e) {
    return this.view.getInt16(this.need(e, 2), !0);
  }
  u32(e) {
    return this.view.getUint32(this.need(e, 4), !0);
  }
  i32(e) {
    return this.view.getInt32(this.need(e, 4), !0);
  }
  f32(e) {
    return this.view.getFloat32(this.need(e, 4), !0);
  }
  optU8(e) {
    return e >= 0 && e + 1 <= this.b.length ? this.b[e] : void 0;
  }
  optU16(e) {
    return e >= 0 && e + 2 <= this.b.length ? this.view.getUint16(e, !0) : void 0;
  }
  optI16(e) {
    return e >= 0 && e + 2 <= this.b.length ? this.view.getInt16(e, !0) : void 0;
  }
  optU32(e) {
    return e >= 0 && e + 4 <= this.b.length ? this.view.getUint32(e, !0) : void 0;
  }
  optI32(e) {
    return e >= 0 && e + 4 <= this.b.length ? this.view.getInt32(e, !0) : void 0;
  }
  /** `n` consecutive (x, y) pairs of 16- or 32-bit signed integers starting at `off`. */
  points(e, n, s) {
    const o = s ? 8 : 4;
    this.need(e, n * o);
    const i = new Array(n);
    for (let r = 0; r < n; r++) {
      const l = e + r * o;
      i[r] = s ? [this.view.getInt32(l, !0), this.view.getInt32(l + 4, !0)] : [this.view.getInt16(l, !0), this.view.getInt16(l + 2, !0)];
    }
    return i;
  }
}
function yt(t) {
  try {
    return t();
  } catch (e) {
    if (e instanceof Mo) return;
    throw e;
  }
}
const nt = (t) => ({ k: "M", p: t }), ct = (t) => ({ k: "L", p: t }), Ct = (t, e, n) => ({ k: "C", a: t, b: e, p: n }), mt = { k: "Z" }, xn = Math.PI * 2, Yt = Math.PI / 2;
function Wt(t, e) {
  const n = t % e;
  return n < 0 ? n + Math.abs(e) : n;
}
function Pt(t, e, n, s) {
  return [nt([t, e]), ct([n, e]), ct([n, s]), ct([t, s]), mt];
}
function vo(t, e, n, s, o, i) {
  const r = Math.min(t, n), l = Math.max(t, n), a = Math.min(e, s), u = Math.max(e, s), c = Math.min(Math.abs(o / 2), (l - r) / 2), h = Math.min(Math.abs(i / 2), (u - a) / 2);
  return [
    nt([r + c, a]),
    ct([l - c, a]),
    ...qt(l - c, a + h, c, h, -Yt, Yt),
    ct([l, u - h]),
    ...qt(l - c, u - h, c, h, 0, Yt),
    ct([r + c, u]),
    ...qt(r + c, u - h, c, h, Yt, Yt),
    ct([r, a + h]),
    ...qt(r + c, a + h, c, h, Math.PI, Yt),
    mt
  ];
}
function So(t, e, n, s) {
  const [o, i, r, l] = Po(t, e, n, s);
  return [nt([o + r, i]), ...qt(o, i, r, l, 0, xn), mt];
}
function Co(t, e, n, s, o, i, r, l = !1) {
  const [a, u, c, h] = Po(t, e, n, s), d = (k) => Math.atan2((k[1] - u) / Math.max(h, Number.MIN_VALUE), (k[0] - a) / Math.max(c, Number.MIN_VALUE)), m = d(o), f = d(i);
  let p = Wt(l ? f - m : m - f, xn);
  p < 1e-12 && (p = xn);
  const g = l ? p : -p, b = [a + c * Math.cos(m), u + h * Math.sin(m)], x = r === "pie" ? [nt([a, u]), ct(b)] : [nt(b)];
  return x.push(...qt(a, u, c, h, m, g)), r === "chord" ? x.push(mt) : r === "pie" && x.push(ct([a, u]), mt), x;
}
function Po(t, e, n, s) {
  return [(t + n) / 2, (e + s) / 2, Math.abs(n - t) / 2, Math.abs(s - e) / 2];
}
function qt(t, e, n, s, o, i) {
  const r = Math.min(8, Math.max(1, Math.ceil(Math.abs(i) / Yt))), l = i / r, a = 4 / 3 * Math.tan(l / 4), u = (h) => [t + n * Math.cos(h), e + s * Math.sin(h)], c = [];
  for (let h = 0; h < r; h++) {
    const d = o + l * h, m = d + l, f = u(d), p = u(m), g = [f[0] - a * n * Math.sin(d), f[1] + a * s * Math.cos(d)], b = [p[0] + a * n * Math.sin(m), p[1] - a * s * Math.cos(m)];
    c.push(Ct(g, b, p));
  }
  return c;
}
function yn(t, e, n) {
  const s = [];
  let o = 0;
  for (const i of e) {
    const r = Math.min(o + i, t.length);
    if (r > o) {
      s.push(nt(t[o]));
      for (let l = o + 1; l < r; l++) s.push(ct(t[l]));
      n && s.push(mt);
    }
    o = r;
  }
  return s;
}
const te = 64, Ao = 1, Wr = 2, Vr = 3, Yr = 4, $o = 5;
function Nt(t) {
  const [e, n, s, o] = t;
  if (![e, n, s, o].every(Number.isFinite)) return null;
  const i = Math.min(e, s), r = Math.max(e, s), l = Math.min(n, o), a = Math.max(n, o);
  return r - i > 1e-6 && a - l > 1e-6 ? [i, l, r, a] : null;
}
function _n(t, e) {
  const n = Math.max(t[0], e[0]), s = Math.max(t[1], e[1]), o = Math.min(t[2], e[2]), i = Math.min(t[3], e[3]);
  return o - n > 1e-6 && i - s > 1e-6 && [n, s, o, i].every(Number.isFinite) ? [n, s, o, i] : null;
}
function Gr(t, e) {
  const n = _n(t, e);
  if (!n) return [t];
  const s = [], o = (i) => {
    i && s.push(i);
  };
  return n[1] > t[1] && o(Nt([t[0], t[1], t[2], n[1]])), n[3] < t[3] && o(Nt([t[0], n[3], t[2], t[3]])), n[0] > t[0] && o(Nt([t[0], n[1], n[0], n[3]])), n[2] < t[2] && o(Nt([n[2], n[1], t[2], n[3]])), s;
}
const kn = (t) => t.slice(0, te);
function re(t, e) {
  let n = t;
  for (const s of e) {
    const o = [];
    for (const i of n)
      for (const r of Gr(i, s)) {
        if (o.length >= te) return o;
        o.push(r);
      }
    n = o;
  }
  return n;
}
function qr(t, e) {
  const n = Nt(e);
  return n ? t === null ? [n] : kn(t.map((s) => _n(s, n)).filter((s) => s !== null)) : [];
}
function Zr(t, e, n) {
  const s = Nt(e);
  if (!s) return t;
  if (t !== null) return re(t, [s]);
  const o = n && Nt(n);
  return o ? re([o], [s]) : null;
}
function Kr(t, e, n, s) {
  const o = kn(e.map(Nt).filter((i) => i !== null));
  switch (n) {
    case $o:
      return o;
    case Ao: {
      if (t === null) return o;
      const i = [];
      for (const r of t)
        for (const l of o) {
          if (i.length >= te) return i;
          const a = _n(r, l);
          a && i.push(a);
        }
      return i;
    }
    case Wr:
      return t === null ? null : kn([...t, ...o]);
    case Yr: {
      if (t !== null) return re(t, o);
      const i = s && Nt(s);
      return i ? re([i], o) : null;
    }
    case Vr: {
      if (t === null) return null;
      const i = re(t, o);
      for (const r of re(o, t)) {
        if (i.length >= te) break;
        i.push(r);
      }
      return i;
    }
    default:
      return t;
  }
}
const Jr = 2e5, vs = 4096, Oo = 4e7, Qr = 1024, ue = 2e6, wn = 256 * 1024 * 1024, Ss = 56, tl = 0, sn = 3, el = 256, nl = 8913094, sl = 15597702, ol = 6684742;
function To(t) {
  const e = t.u32(0), n = t.i32(4), s = t.i32(8), o = t.u16(14), i = t.u32(16), r = t.u32(32);
  if (e < 40 || n <= 0 || s === 0 || ![1, 4, 8, 16, 24, 32].includes(o) || i !== tl && i !== sn) return null;
  const l = i === sn ? [t.u32(40), t.u32(44), t.u32(48)] : o === 16 ? [31744, 992, 31] : [16711680, 65280, 255], u = e + (i === sn && e === 40 ? 12 : 0), c = o <= 8 ? r === 0 ? 1 << o : Math.min(r, 1 << o) : Math.min(r, el);
  return { w: n, h: Math.abs(s), topDown: s < 0, bpp: o, masks: l, palOff: u, palN: c };
}
function Hn(t) {
  const e = To(t);
  return e ? e.palOff + e.palN * 4 : null;
}
function $e(t, e, n) {
  const s = To(t);
  if (!s) return null;
  const o = s.w * s.h;
  if (o === 0 || o > Oo) return null;
  const i = Math.floor((s.w * s.bpp + 31) / 32) * 4, r = e.slice(0, i * s.h), l = t.slice(s.palOff, s.palN * 4), a = new Uint8Array(o * 4), [u, c, h] = s.masks;
  for (let d = 0; d < s.h; d++) {
    const m = (s.topDown ? d : s.h - 1 - d) * i;
    for (let f = 0; f < s.w; f++) {
      const p = (d * s.w + f) * 4;
      let g = 0, b = 0, x = 0, k = 255;
      switch (s.bpp) {
        case 1:
          [g, b, x] = on(l, r[m + (f >> 3)] >> 7 - f % 8 & 1);
          break;
        case 4: {
          const w = r[m + (f >> 1)];
          [g, b, x] = on(l, f % 2 === 0 ? w >> 4 : w & 15);
          break;
        }
        case 8:
          [g, b, x] = on(l, r[m + f]);
          break;
        case 24: {
          const w = m + f * 3;
          x = r[w], b = r[w + 1], g = r[w + 2];
          break;
        }
        case 16: {
          const w = m + f * 2, M = r[w] | r[w + 1] << 8;
          g = se(M, u), b = se(M, c), x = se(M, h);
          break;
        }
        default: {
          const w = m + f * 4, M = (r[w] | r[w + 1] << 8 | r[w + 2] << 16 | r[w + 3] << 24) >>> 0;
          g = se(M, u), b = se(M, c), x = se(M, h), k = n ? r[w + 3] : 255;
        }
      }
      a[p] = g, a[p + 1] = b, a[p + 2] = x, a[p + 3] = k;
    }
  }
  return { w: s.w, h: s.h, bottomUp: !s.topDown, px: a };
}
function on(t, e) {
  const n = e * 4;
  return n + 4 <= t.length ? [t[n + 2], t[n + 1], t[n]] : [0, 0, 0];
}
function il(t) {
  let e = 0;
  for (; e < 32 && (t >>> e & 1) === 0; ) e++;
  return e;
}
function se(t, e) {
  if (e === 0) return 0;
  const n = il(e), s = e >>> n, o = (t & e) >>> 0 >>> n;
  return Math.floor((o * 255 + Math.floor(s / 2)) / s);
}
function Xn(t, e, n) {
  const s = t.w, o = t.h, [i, r, l, a] = e[2] > 0 && e[3] > 0 ? e : [0, 0, s, o], u = t.bottomUp ? o - r - a : r, c = Math.max(i, 0), h = Math.min(i + l, s), d = Math.max(u, 0), m = Math.min(u + a, o);
  if (h <= c || m <= d) return null;
  const f = n[2] / l, p = n[3] / a, g = [n[0] + (c - i) * f, n[1] + (d - u) * p, (h - c) * f, (m - d) * p], b = h - c, x = m - d, k = new Uint8Array(b * x * 4);
  for (let w = d; w < m; w++) {
    const M = (w * t.w + c) * 4;
    if (M + b * 4 > t.px.length) return null;
    k.set(t.px.subarray(M, M + b * 4), (w - d) * b * 4);
  }
  return { img: { w: b, h: x, bottomUp: !1, px: k }, dst: g };
}
function Eo(t, e) {
  const n = t.px;
  if (e.kind === "rop") {
    e.rop === nl ? Cs(n, 255) : (e.rop === sl || e.rop === ol) && Cs(n, 0);
    return;
  }
  for (let s = 0; s + 3 < n.length; s += 4)
    e.perPixel && rl(n, s), n[s + 3] = Math.floor(n[s + 3] * e.constant / 255);
}
function Cs(t, e) {
  for (let n = 0; n + 3 < t.length; n += 4) t[n] === e && t[n + 1] === e && t[n + 2] === e && (t[n + 3] = 0);
}
function rl(t, e) {
  const n = t[e + 3];
  if (!(n === 0 || n === 255))
    for (let s = 0; s < 3; s++) t[e + s] = Math.min(255, Math.floor((t[e + s] * 255 + Math.floor(n / 2)) / n));
}
function Wn(t, e, n) {
  const { w: s, h: o, px: i } = t;
  if (s === 0 || o === 0) return;
  const r = s * 4, l = Math.min(o, Math.floor(i.length / r));
  if (e)
    for (let a = 0; a < l; a++) {
      const u = a * r;
      for (let c = 0; c < s >> 1; c++) {
        const h = u + c * 4, d = u + (s - 1 - c) * 4;
        for (let m = 0; m < 4; m++) {
          const f = i[h + m];
          i[h + m] = i[d + m], i[d + m] = f;
        }
      }
    }
  if (n) {
    const a = new Uint8Array(r);
    for (let u = 0; u < l >> 1; u++) {
      const c = u * r, h = (l - 1 - u) * r;
      a.set(i.subarray(c, c + r)), i.copyWithin(c, h, h + r), i.set(a, h);
    }
  }
}
const Bt = (t) => "mime" in t;
function ll(t) {
  return yt(() => {
    const e = new Qt(t);
    if (t.length > 24 && e.u32(0) === 1196314761 && e.u32(4) === 169478669) {
      const n = e.view.getUint32(16, !1), s = e.view.getUint32(20, !1);
      return n > 0 && s > 0 ? { mime: "image/png", bytes: t, w: n, h: s, crop: null } : null;
    }
    if (t.length > 10 && t[0] === 71 && t[1] === 73 && t[2] === 70) {
      const n = e.u16(6), s = e.u16(8);
      return n > 0 && s > 0 ? { mime: "image/gif", bytes: t, w: n, h: s, crop: null } : null;
    }
    if (t.length > 4 && t[0] === 255 && t[1] === 216) {
      const n = al(e);
      return n ? { mime: "image/jpeg", bytes: t, w: n[0], h: n[1], crop: null } : null;
    }
    if (t.length > 54 && t[0] === 66 && t[1] === 77) {
      const n = e.tail(14), s = Hn(n);
      if (s === null) return null;
      const o = e.u32(10), i = $e(n.sub(0, s), o >= 14 + s ? e.tail(o) : n.tail(s), !1);
      return i ? (i.bottomUp && (i.bottomUp = !1), i) : null;
    }
    return null;
  }) ?? null;
}
function al(t) {
  let e = 2;
  for (let n = 0; n < 1e4 && e + 9 < t.length; n++) {
    if (t.b[e] !== 255) return null;
    const s = t.b[e + 1];
    if (s === 216 || s === 1 || s >= 208 && s <= 215) {
      e += 2;
      continue;
    }
    const o = t.view.getUint16(e + 2, !1);
    if (s >= 192 && s <= 207 && s !== 196 && s !== 200 && s !== 204) {
      const i = t.view.getUint16(e + 5, !1), r = t.view.getUint16(e + 7, !1);
      return r > 0 && i > 0 ? [r, i] : null;
    }
    e += 2 + o;
  }
  return null;
}
const Ps = 16;
function ee(t) {
  let e = null;
  const n = (s) => {
    e ? e = [Math.min(e[0], s[0]), Math.min(e[1], s[1]), Math.max(e[2], s[0]), Math.max(e[3], s[1])] : e = [s[0], s[1], s[0], s[1]];
  };
  for (const s of t)
    s.k === "M" || s.k === "L" ? n(s.p) : s.k === "C" && (n(s.a), n(s.b), n(s.p));
  return e;
}
function No(t, e) {
  const n = [Math.max(t[0], e[0]), Math.max(t[1], e[1]), Math.min(t[2], e[2]), Math.min(t[3], e[3])];
  return n[2] < n[0] || n[3] < n[1] ? [n[0], n[1], n[0], n[1]] : n;
}
const fe = ([t, e, n, s]) => [[t, e], [n, e], [n, s], [t, s]];
function Ye(t) {
  if (!t.length) return null;
  let e = [t[0][0], t[0][1], t[0][0], t[0][1]];
  for (const n of t) e = [Math.min(e[0], n[0]), Math.min(e[1], n[1]), Math.max(e[2], n[0]), Math.max(e[3], n[1])];
  return e;
}
const Kt = (t, e, n) => (e[0] - t[0]) * (n[1] - t[1]) - (e[1] - t[1]) * (n[0] - t[0]);
function Pe(t) {
  const e = [];
  for (const i of t) {
    if (!(Number.isFinite(i[0]) && Number.isFinite(i[1]))) return null;
    const r = e[e.length - 1];
    (!r || Math.abs(r[0] - i[0]) > 1e-9 || Math.abs(r[1] - i[1]) > 1e-9) && e.push(i);
  }
  for (; e.length > 1 && e[0][0] === e[e.length - 1][0] && e[0][1] === e[e.length - 1][1]; ) e.pop();
  let n = 0;
  for (let i = 0; i < e.length; i++) n += Kt([0, 0], e[i], e[(i + 1) % e.length]);
  if (e.length < 3 || Math.abs(n) < 1e-12) return null;
  n < 0 && e.reverse();
  const s = e.length, o = [];
  for (let i = 0; i < s; i++) {
    const r = Kt(e[(i + s - 1) % s], e[i], e[(i + 1) % s]);
    if (r < -1e-9 * (1 + Math.abs(n))) return null;
    Math.abs(r) > 1e-12 && o.push(e[i]);
  }
  return o.length >= 3 ? o : null;
}
function Io(t, e) {
  for (let n = 0; n < t.length; n++) if (Kt(t[n], t[(n + 1) % t.length], e) < -1e-9) return !1;
  return !0;
}
function cl(t) {
  const e = Ye(t);
  return !!e && t.length === 4 && t.every((n) => (n[0] === e[0] || n[0] === e[2]) && (n[1] === e[1] || n[1] === e[3]));
}
function Vn(t, e) {
  if (t.length * e.length > 1e6) return [];
  let n = t.slice();
  for (let s = 0; s < e.length; s++) {
    if (n.length * (e.length - s) > 1e6) return [];
    const o = e[s], i = e[(s + 1) % e.length], r = (u) => Kt(o, i, u) >= 0, l = (u, c) => {
      const h = Kt(o, i, u), d = Kt(o, i, c), m = h / (h - d);
      return [u[0] + (c[0] - u[0]) * m, u[1] + (c[1] - u[1]) * m];
    }, a = [];
    for (let u = 0; u < n.length; u++) {
      const c = n[(u + n.length - 1) % n.length], h = n[u], d = r(c), m = r(h);
      d && m ? a.push(h) : d && !m ? a.push(l(c, h)) : !d && m && (a.push(l(c, h)), a.push(h));
    }
    if (n = a, !n.length) break;
  }
  return n;
}
const ze = (t, e) => t[2] < e[0] || t[0] > e[2] || t[3] < e[1] || t[1] > e[3] || e[2] <= e[0] || e[3] <= e[1], Mn = (t, e) => fe(t).every((n) => Io(e, n));
function ul(t, e) {
  const n = e.length >= 3 ? Ye(e) : null;
  if (!n) return [];
  switch (t.kind) {
    case "path": {
      const s = ee(t.ops);
      if (!s) return [];
      if (Mn(s, e)) return [t];
      if (ze(s, n)) return [];
      const o = We(t.ops), i = [];
      if (t.fill) {
        const r = As(o, e);
        r.length && i.push({ ...t, ops: r, stroke: null });
      }
      if (t.stroke) {
        const r = hl(o, e);
        r.length && i.push({ ...t, ops: r, fill: null });
      }
      return i;
    }
    case "pattern": {
      const s = ee(t.ops);
      if (!s) return [];
      if (Mn(s, e)) return [t];
      if (ze(s, n)) return [];
      const o = As(We(t.ops), e);
      return o.length ? [{ ...t, ops: o }] : [];
    }
    case "bitmap": {
      if (Bt(t.img)) {
        const [o, i, r, l] = t.rect;
        return ze([o, i, o + r, i + l], n) ? [] : [t];
      }
      const s = dl(t.rect, t.img, e);
      return s ? [{ ...t, rect: s.rect, img: s.img }] : [];
    }
    case "text": {
      const s = { ...t.text };
      return s.clip = s.clip ? No(n, s.clip) : n, [{ ...t, text: s }];
    }
  }
}
function We(t) {
  const e = [];
  for (const n of t)
    if (n.k === "M") e.push([[n.p], !1]);
    else if (n.k === "L") {
      const s = e[e.length - 1];
      s ? s[0].push(n.p) : e.push([[n.p], !1]);
    } else if (n.k === "C") {
      const s = e[e.length - 1];
      if (!s || !s[0].length) continue;
      const o = s[0][s[0].length - 1];
      for (let i = 1; i <= Ps; i++) {
        const r = i / Ps, l = 1 - r, a = [l * l * l, 3 * l * l * r, 3 * l * r * r, r * r * r];
        s[0].push([a[0] * o[0] + a[1] * n.a[0] + a[2] * n.b[0] + a[3] * n.p[0], a[0] * o[1] + a[1] * n.a[1] + a[2] * n.b[1] + a[3] * n.p[1]]);
      }
    } else {
      const s = e[e.length - 1];
      s && (s[1] = !0, s[0].length && e.push([[s[0][0]], !1]));
    }
  return e.filter((n) => n[0].length > 1);
}
function As(t, e) {
  const n = [];
  for (const [s] of t) {
    const o = Vn(s, e);
    if (o.length >= 3) {
      n.push(nt(o[0]));
      for (const i of o.slice(1)) n.push(ct(i));
      n.push(mt);
    }
  }
  return n;
}
function hl(t, e) {
  const n = [];
  for (const [s, o] of t) {
    const i = o && s.length ? [...s, s[0]] : s;
    let r = null;
    for (let l = 0; l + 1 < i.length; l++) {
      const a = fl(i[l], i[l + 1], e);
      if (!a) {
        r = null;
        continue;
      }
      const [u, c] = a;
      (!r || r[0] !== u[0] || r[1] !== u[1]) && n.push(nt(u)), n.push(ct(c)), r = c;
    }
  }
  return n;
}
function fl(t, e, n) {
  const s = [e[0] - t[0], e[1] - t[1]];
  let o = 0, i = 1;
  for (let r = 0; r < n.length; r++) {
    const l = n[r], a = n[(r + 1) % n.length], u = Kt(l, a, t), c = (a[0] - l[0]) * s[1] - (a[1] - l[1]) * s[0];
    if (c === 0) {
      if (u < 0) return null;
    } else {
      const h = -u / c;
      c > 0 ? o = Math.max(o, h) : i = Math.min(i, h);
    }
  }
  return o <= i ? [[t[0] + s[0] * o, t[1] + s[1] * o], [t[0] + s[0] * i, t[1] + s[1] * i]] : null;
}
function dl(t, e, n) {
  const [s, o, i, r] = t, l = [s, o, s + i, o + r];
  if (Mn(l, n)) return { rect: t, img: e };
  const a = Ye(n);
  if (!a || ze(l, a) || i <= 0 || r <= 0 || e.w === 0 || e.h === 0) return null;
  const u = No(l, a), c = e.w / i, h = e.h / r, d = Math.min(Math.max(0, Math.floor((u[0] - s) * c)), e.w), m = Math.min(Math.max(0, Math.ceil((u[2] - s) * c)), e.w), f = Math.min(Math.max(0, Math.floor((u[1] - o) * h)), e.h), p = Math.min(Math.max(0, Math.ceil((u[3] - o) * h)), e.h);
  if (m <= d || p <= f) return null;
  const g = !cl(n);
  if (g && (m - d) * (p - f) * n.length > 5e6) return null;
  const b = m - d, x = new Uint8Array(b * (p - f) * 4);
  for (let k = f; k < p; k++) {
    const M = ((e.bottomUp ? e.h - 1 - k : k) * e.w + d) * 4;
    if (M + b * 4 > e.px.length) return null;
    const S = (k - f) * b * 4;
    if (x.set(e.px.subarray(M, M + b * 4), S), g) {
      const O = o + (k + 0.5) / h;
      for (let T = 0; T < b; T++) Io(n, [s + (d + T + 0.5) / c, O]) || (x[S + T * 4 + 3] = 0);
    }
  }
  return { rect: [s + d / c, o + f / h, b / c, (p - f) / h], img: { w: b, h: p - f, bottomUp: !1, px: x } };
}
const Ro = () => ({ family: "", height: 0, width: 0, weight: 0, italic: !1, underline: !1, strike: !1, charset: 0 }), $s = 2, pl = 1, Fo = 2, Yn = 4, Bo = 16, ml = 8192, Ge = 16384;
function gl(t) {
  const e = (t & 6) === 6 ? "center" : (t & 6) === 2 ? "right" : "left", n = (t & 24) === 24 ? "baseline" : (t & 24) === 8 ? "bottom" : "top";
  return [e, n];
}
function Oe(t, e, n) {
  let s = "";
  const o = [], i = [128, 129, 130, 134, 136].includes(e);
  let r = 0;
  for (; r < t.length; ) {
    const l = t[r], a = i && l >= 129 && r + 1 < t.length ? 2 : 1;
    if (s += a === 2 ? " " : bl(l, e), n.length) {
      let u = 0;
      for (let c = r; c < r + a; c++) c < n.length && (u += n[c]);
      o.push(u);
    }
    r += a;
  }
  return [s, o];
}
function he(t, e) {
  let n = "";
  const s = [];
  let o = 0;
  for (; o < t.length; ) {
    const i = t[o];
    let r = 1, l = i;
    if (i >= 55296 && i <= 56319 && o + 1 < t.length && t[o + 1] >= 56320 && t[o + 1] <= 57343 ? (l = 65536 + (i - 55296 << 10) + (t[o + 1] - 56320), r = 2) : i >= 55296 && i <= 57343 && (l = 65533), n += String.fromCodePoint(l), e.length) {
      let a = 0;
      for (let u = o; u < o + r; u++) u < e.length && (a += e[u]);
      s.push(a);
    }
    o += r;
  }
  return [n, s];
}
function bl(t, e) {
  if (t < 128 && e !== $s) return String.fromCharCode(t);
  let n;
  return e === $s ? n = 61440 | t : e === 238 ? n = rn(t, yl) : e === 204 ? n = rn(t, kl) : n = rn(t, xl), String.fromCodePoint(n);
}
function rn(t, e) {
  const n = e[t - 128 & 255];
  return n || 65533;
}
const xl = (() => {
  const t = [
    8364,
    0,
    8218,
    402,
    8222,
    8230,
    8224,
    8225,
    710,
    8240,
    352,
    8249,
    338,
    0,
    381,
    0,
    0,
    8216,
    8217,
    8220,
    8221,
    8226,
    8211,
    8212,
    732,
    8482,
    353,
    8250,
    339,
    0,
    382,
    376
  ];
  return Array.from({ length: 128 }, (e, n) => n < 32 ? t[n] : 128 + n);
})(), yl = [
  8364,
  0,
  8218,
  0,
  8222,
  8230,
  8224,
  8225,
  0,
  8240,
  352,
  8249,
  346,
  356,
  381,
  377,
  0,
  8216,
  8217,
  8220,
  8221,
  8226,
  8211,
  8212,
  0,
  8482,
  353,
  8250,
  347,
  357,
  382,
  378,
  160,
  711,
  728,
  321,
  164,
  260,
  166,
  167,
  168,
  169,
  350,
  171,
  172,
  173,
  174,
  379,
  176,
  177,
  731,
  322,
  180,
  181,
  182,
  183,
  184,
  261,
  351,
  187,
  317,
  733,
  318,
  380,
  340,
  193,
  194,
  258,
  196,
  313,
  262,
  199,
  268,
  201,
  280,
  203,
  282,
  205,
  206,
  270,
  272,
  323,
  327,
  211,
  212,
  336,
  214,
  215,
  344,
  366,
  218,
  368,
  220,
  221,
  354,
  223,
  341,
  225,
  226,
  259,
  228,
  314,
  263,
  231,
  269,
  233,
  281,
  235,
  283,
  237,
  238,
  271,
  273,
  324,
  328,
  243,
  244,
  337,
  246,
  247,
  345,
  367,
  250,
  369,
  252,
  253,
  355,
  729
], kl = (() => {
  const t = [
    1026,
    1027,
    8218,
    1107,
    8222,
    8230,
    8224,
    8225,
    8364,
    8240,
    1033,
    8249,
    1034,
    1036,
    1035,
    1039,
    1106,
    8216,
    8217,
    8220,
    8221,
    8226,
    8211,
    8212,
    0,
    8482,
    1113,
    8250,
    1114,
    1116,
    1115,
    1119,
    160,
    1038,
    1118,
    1032,
    164,
    1168,
    166,
    167,
    1025,
    169,
    1028,
    171,
    172,
    173,
    174,
    1031,
    176,
    177,
    1030,
    1110,
    1169,
    181,
    182,
    183,
    1105,
    8470,
    1108,
    187,
    1112,
    1029,
    1109,
    1111
  ];
  return Array.from({ length: 128 }, (e, n) => n < 64 ? t[n] : 1040 + (n - 64));
})(), Os = 1, Ts = 7, Do = 8, Be = 2147483648, Ve = 5, Lo = 15, Lt = 0, ln = 128, Gn = 1, qn = 2, wl = 3, Ml = 5, zo = 6, vl = 2, Sl = 7, Es = 9, Cl = 11, Pl = 13, Al = 2, Ns = 15728673, Is = 66, Rs = 16711778, Fs = 96 / 25.4, Bs = 256, wt = [1, 0, 0, 1, 0, 0];
function xt(t, e) {
  return [
    t[0] * e[0] + t[1] * e[2],
    t[0] * e[1] + t[1] * e[3],
    t[2] * e[0] + t[3] * e[2],
    t[2] * e[1] + t[3] * e[3],
    t[4] * e[0] + t[5] * e[2] + e[4],
    t[4] * e[1] + t[5] * e[3] + e[5]
  ];
}
const Ot = (t, e) => ({ style: t, color: e, hatch: 0, pattern: null });
function jo(t, e) {
  return t.w === 0 || t.h === 0 || t.w > Bs || t.h > Bs || t.px.length !== t.w * t.h * 4 ? null : { style: zo, color: [0, 0, 0, 255], hatch: 0, pattern: { w: t.w, h: t.h, px: t.px, mono: e } };
}
const $l = (t) => [t & 255, t >>> 8 & 255, t >>> 16 & 255, 255];
function Ol(t) {
  switch (t) {
    case 2:
      return 0.1;
    case 3:
      return 0.01;
    case 4:
      return 25.4 / 100;
    case 5:
      return 25.4 / 1e3;
    case 6:
      return 25.4 / 1440;
    default:
      return null;
  }
}
const Ds = (t, e) => e === 0 ? 1 : t / e;
class Zn {
  wo = [0, 0];
  we = [1, 1];
  vo = [0, 0];
  ve = [1, 1];
  mode = Os;
  world = wt;
  /** Device pixels per millimetre on each axis (EMF: from szlDevice and szlMillimeters). */
  pxMm = [Fs, Fs];
  /**
   * Whether a viewport extent was set (by the file, or by the WMF player). An EMF that picks an
   * extent-based mode and sets only the window would, by GDI's 1×1 default viewport, shrink to a
   * pixel, yet its own bounds say it drew full size: without a viewport the window is the scale
   * (1 logical unit per device unit), as WMF's rule already treats it. Beyond DeckCraft.
   */
  veSet = !1;
  clone() {
    const e = new Zn();
    return Object.assign(e, this), e;
  }
  /** Logical point to device point: world transform, then window to viewport. */
  device(e) {
    const n = this.world, s = e[0] * n[0] + e[1] * n[2] + n[4], o = e[0] * n[1] + e[1] * n[3] + n[5], [i, r] = this.ratios();
    return [(s - this.wo[0]) * i + this.vo[0], (o - this.wo[1]) * r + this.vo[1]];
  }
  /**
   * Window-to-viewport scale per axis. MM_TEXT fixes the scale at 1; the metric modes use a fixed
   * scale with y up; MM_ISOTROPIC uses one scale on both axes (the smaller magnitude, each axis's
   * sign kept); anisotropic and unknown modes use the extents as given.
   */
  ratios() {
    if (this.mode === Os) return [1, 1];
    const e = Ol(this.mode);
    if (e !== null) return [e * this.pxMm[0], -e * this.pxMm[1]];
    if (!this.veSet) return [1, 1];
    const n = Ds(this.ve[0], this.we[0]), s = Ds(this.ve[1], this.we[1]);
    if (this.mode === Ts) {
      const o = Math.min(Math.abs(n), Math.abs(s));
      return [n < 0 ? -o : o, s < 0 ? -o : o];
    }
    return [n, s];
  }
  /** Approximate device length per logical length, for pen widths. */
  scale() {
    const e = this.world, n = Math.sqrt(Math.abs(e[0] * e[3] - e[1] * e[2])), [s, o] = this.ratios();
    return n * (Math.abs(s) + Math.abs(o)) / 2;
  }
  /** True when the window-to-viewport extents set the scale (the isotropic and anisotropic modes). */
  usesExtents() {
    return this.mode === Ts || this.mode === Do;
  }
  /** The window in device units as `[x, y, w, h]` with positive extents, used as the picture frame of a plain WMF. */
  windowRect() {
    const e = this.device(this.wo), n = this.device([this.wo[0] + this.we[0], this.wo[1] + this.we[1]]);
    return [Math.min(e[0], n[0]), Math.min(e[1], n[1]), Math.abs(n[0] - e[0]), Math.abs(n[1] - e[1])];
  }
}
class Te {
  items = [];
  map = new Zn();
  /** True once SETWINDOWEXT was seen, so a plain WMF has a frame to use. */
  windowSet = !1;
  /** True once the file set the viewport extent itself (not the player, see playInto). */
  viewportSet = !1;
  saved = [];
  /** Bytes held by the items so far (path ops and pixels), capped at MAX_BYTES. */
  used = 0;
  objects = [];
  pen = { style: 0, width: 0, color: [0, 0, 0, 255] };
  brush = Ot(Lt, [255, 255, 255, 255]);
  evenOdd = !0;
  /** SETROP2 mix mode. */
  rop2 = Pl;
  /** The colour of the last fill drawn with R2_XORPEN, for the see-through shadow idiom. */
  xorColor = null;
  text = { color: [0, 0, 0, 255], bkColor: [255, 255, 255, 255], bkOpaque: !0, align: 0, font: null };
  /** Device units per pattern-brush pixel: brushes are laid out in 96-dpi pixels. */
  patternPx = 1;
  pos = [0, 0];
  inPath = !1;
  path = [];
  isFull = !1;
  /** Current clip in device units. null is the default (the whole surface); [] draws nothing. */
  clip = null;
  /** Device bounds of the picture, so excluding from the default clip has a surface to cut. */
  surface = null;
  /** EMF+ convex device clip polygon: drawing is cut to it geometrically. */
  plusClip = null;
  /** GDI clip path (SELECTCLIPPATH) as a convex device polygon, cut the same way. Beyond DeckCraft. */
  pathClip = null;
  /** SETARCDIRECTION: AD_CLOCKWISE arcs. Beyond DeckCraft. */
  arcClockwise = !1;
  /** The selected logical palette (PALETTEINDEX colours). Beyond DeckCraft. */
  palette = [];
  /** Device bounds `[x0, y0, x1, y1]` of the picture. Used when a clip record cuts the default clip. */
  setClipSurface(e) {
    this.surface = Nt(e);
  }
  /** True once the item cap is hit; the readers stop there and keep what they have. */
  full() {
    return this.isFull;
  }
  push(e) {
    let n = [e];
    for (const s of [this.pathClip, this.plusClip]) s && (n = n.flatMap((o) => ul(o, s)));
    for (const s of n) this.pushRaw(s);
  }
  /**
   * A COLORREF in the current state: PALETTEINDEX (0x01 in the high byte) names an entry of the
   * selected palette (black past its end); PALETTERGB (0x02) and plain values are RGB.
   */
  colorOf(e) {
    return e >>> 24 === 1 ? this.palette[e & 65535] ?? [0, 0, 0, 255] : $l(e);
  }
  /** SELECTPALETTE. A stock palette (or anything that isn't one) selects none: indices read as black. */
  selectPalette(e) {
    const n = (e & Be) === 0 ? this.objects[e] : null;
    this.palette = n?.kind === "palette" ? n.colors : [];
  }
  /**
   * SELECTCLIPPATH: the open path bracket becomes the clip (RGN_COPY) or cuts it (RGN_AND). A
   * single convex figure clips exactly; anything else clips to its bounding box. Other modes keep
   * the clip as it was.
   */
  selectClipPath(e) {
    const n = this.path;
    this.path = [], this.inPath = !1;
    const s = We(n);
    let o = s.length === 1 ? Pe(s[0][0]) : null;
    if (!o) {
      const i = ee(n);
      o = i ? fe(i) : null;
    }
    o && (e === $o ? this.pathClip = o : e === Ao && (this.pathClip = this.pathClip ? Pe(Vn(this.pathClip, o)) ?? [] : o));
  }
  /** Fills logical rectangles (a region's RGNDATA) with brush object `brushIndex`, or the current brush when null. FILLRGN, PAINTRGN. */
  fillRegion(e, n) {
    const s = this.brush;
    n !== null && this.select(n);
    for (const [o, i, r, l] of e) this.shape(Pt(o, i, r, l), !0, !1);
    this.brush = s;
  }
  /** FRAMERGN: outlines each rectangle of a region with brush object `brushIndex`'s colour, `w` × `h` logical units thick. */
  frameRegion(e, n, s, o) {
    const i = this.objects[n], r = i?.kind === "brush" ? i.brush.color : (n & Be) !== 0 && (n & 255) === 4 ? [0, 0, 0, 255] : null;
    if (!r) return;
    const l = this.brush;
    this.brush = Ot(Lt, r);
    for (const [a, u, c, h] of e)
      this.shape(Pt(a, u, c, u + o), !0, !1), this.shape(Pt(a, h - o, c, h), !0, !1), this.shape(Pt(a, u, a + s, h), !0, !1), this.shape(Pt(c - s, u, c, h), !0, !1);
    this.brush = l;
  }
  /** The current position (ANGLEARC and POLYDRAW start from it). */
  currentPos() {
    return this.pos;
  }
  setCurrentPos(e) {
    this.pos = e;
  }
  pushRaw(e) {
    if (this.clip && this.clip.length === 0) return;
    e.region = this.clip ? this.clip.slice() : null;
    const n = this.clip ? this.clip.length * 32 : 0;
    let s;
    switch (e.kind) {
      case "path":
        s = e.ops.length * Ss;
        break;
      // A tile shared with its brush is counted once (by the brush); one made for this fill counts here.
      case "pattern":
        s = e.ops.length * Ss + 64 + (Ls.has(e.tile) ? 0 : e.tile.px.length);
        break;
      case "bitmap":
        s = Bt(e.img) ? e.img.bytes.length : e.img.px.length;
        break;
      case "text":
        s = e.text.text.length * 2 + e.text.dx.length * 4 + e.text.font.family.length + 128;
        break;
    }
    s += n, this.items.length >= Jr || this.used + s > wn ? this.isFull = !0 : (this.used += s, this.items.push(e));
  }
  setWindowOrg(e) {
    this.map.wo = e;
  }
  setWindowExt(e) {
    this.map.we = e, this.windowSet = !0;
  }
  setViewportOrg(e) {
    this.map.vo = e;
  }
  setViewportExt(e) {
    this.map.ve = e, this.map.veSet = !0, this.viewportSet = !0;
  }
  /**
   * Sets up the mapping the way a player does before it plays a WMF into a target: anisotropic,
   * `window` (`[x, y, w, h]` in logical units) onto a viewport of `size` at the origin. The file's
   * own window records then replace the window; the viewport stays unless the file sets one.
   * Without a window (a plain WMF) only the viewport extent is set.
   */
  playInto(e, n) {
    if (e) {
      const [s, o, i, r] = e;
      this.map.mode = Do, this.map.wo = [s, o], this.map.we = [i, r], this.map.vo = [0, 0];
    }
    this.map.ve = n, this.map.veSet = !0;
  }
  setMapMode(e) {
    this.map.mode = e;
  }
  /** Device pixels per millimetre (x, y) for the metric map modes. Ignored unless both are positive. */
  setDeviceMm(e) {
    Number.isFinite(e[0]) && Number.isFinite(e[1]) && e[0] > 0 && e[1] > 0 && (this.map.pxMm = e);
  }
  setPolyfill(e) {
    this.evenOdd = e !== vl;
  }
  /** SETROP2. R2_NOP draws nothing; R2_XORPEN and R2_MASKPEN are the see-through shadow idiom; the others draw as copy. */
  setRop2(e) {
    this.rop2 = e;
  }
  setTextColor(e) {
    this.text.color = this.colorOf(e);
  }
  setBkColor(e) {
    this.text.bkColor = this.colorOf(e);
  }
  setBkMode(e) {
    this.text.bkOpaque = e === Al;
  }
  setTextAlign(e) {
    this.text.align = e;
  }
  /** The character set of the selected font (ANSI without one). */
  fontCharset() {
    return this.text.font?.font.charset ?? 0;
  }
  /** EMF SETWORLDTRANSFORM (`mode` 4) and MODIFYWORLDTRANSFORM (1 identity, 2 left, 3 right, 4 set). An unknown mode leaves the world transform as it was. */
  modifyWorld(e, n) {
    n === 1 ? this.map.world = wt : n === 2 ? this.map.world = xt(e, this.map.world) : n === 3 ? this.map.world = xt(this.map.world, e) : n === 4 && (this.map.world = e);
  }
  /** The current world transform (EMF+ draws through it). */
  world() {
    return this.map.world;
  }
  /** Sets the pen and brush directly (EMF+ records name their own pen and brush). */
  setPen(e) {
    this.pen = e;
  }
  setBrush(e) {
    this.brush = e;
  }
  /** Sets the EMF+ convex device clip polygon (null: unclipped). */
  setClip(e) {
    this.plusClip = e;
  }
  /** Logical to device as one affine transform (the mapping is affine). */
  deviceAffine() {
    const e = this.map.device([0, 0]), n = this.map.device([1, 0]), s = this.map.device([0, 1]);
    return [n[0] - e[0], n[1] - e[1], s[0] - e[0], s[1] - e[1], e[0], e[1]];
  }
  /** Text colour, font and alignment set directly (EMF+ strings name their own font and brush); the background is transparent. */
  setTextStyle(e, n, s) {
    this.text.color = e, this.text.bkOpaque = !1, this.text.align = s, this.text.font = n;
  }
  /** Pushes an item already in device units (a nested metafile's drawing). */
  pushDevice(e) {
    this.push(e);
  }
  /** Fills logical `ops` with a ready-made tile, laid from the device origin. */
  tileShape(e, n) {
    const s = e.map((o) => this.mapOp(o));
    s.length >= 2 && this.push({ kind: "pattern", ops: s, evenOdd: this.evenOdd, tile: n, region: null });
  }
  /**
   * Fills logical `ops` with a colour computed per device point (gradients, textures): a tile of at
   * most SHADE_RES cells on the longer side, laid out so that its one repeat covers the shape.
   */
  shadeShape(e, n) {
    const s = e.map((g) => this.mapOp(g)), o = ee(s);
    if (!o) return;
    const [i, r, l, a] = o, u = Math.max(l - i, a - r);
    if (s.length < 2 || !(Number.isFinite(u) && u > 0)) return;
    const c = u / ln, h = Math.min(ln + 1, Math.max(1, Math.ceil((l - i) / c) + 1)), d = Math.min(ln + 1, Math.max(1, Math.ceil((a - r) / c) + 1)), m = h * c, f = d * c, p = new Uint8Array(h * d * 4);
    for (let g = 0; g < d; g++) {
      const b = r + Wt(g * c - r, f) + c / 2;
      for (let x = 0; x < h; x++) {
        const k = i + Wt(x * c - i, m) + c / 2;
        p.set(n([k, b]), (g * h + x) * 4);
      }
    }
    this.push({ kind: "pattern", ops: s, evenOdd: this.evenOdd, tile: { w: h, h: d, px: p, cell: c }, region: null });
  }
  /** Pushes the drawing state. Past MAX_STACK levels the parse stops, since later restores could no longer match the file. */
  saveDc() {
    this.saved.length < Qr ? this.saved.push({ pathClip: this.pathClip, arcClockwise: this.arcClockwise, map: this.map.clone(), pen: { ...this.pen }, brush: { ...this.brush }, evenOdd: this.evenOdd, rop2: this.rop2, text: { ...this.text }, clip: this.clip ? this.clip.slice() : null }) : this.isFull = !0;
  }
  /** Negative `n` pops `-n` levels; positive `n` restores absolute level `n`. */
  restoreDc(e) {
    const n = e < 0 ? this.saved.length - Math.abs(e) : e - 1;
    if (n < 0 || n >= this.saved.length) return;
    const s = this.saved[n];
    this.saved.length = n, this.map = s.map, this.pen = s.pen, this.brush = s.brush, this.evenOdd = s.evenOdd, this.rop2 = s.rop2, this.text = s.text, this.clip = s.clip, this.pathClip = s.pathClip, this.arcClockwise = s.arcClockwise;
  }
  /** The logical rectangle as a device rectangle. A rotation stores the bounds of the rotated corners. */
  deviceRect([e, n, s, o]) {
    const i = [[e, n], [s, n], [e, o], [s, o]].map((c) => this.map.device(c));
    if (!i.every((c) => Number.isFinite(c[0]) && Number.isFinite(c[1]))) return null;
    let r = 1 / 0, l = 1 / 0, a = -1 / 0, u = -1 / 0;
    for (const c of i)
      r = Math.min(r, c[0]), l = Math.min(l, c[1]), a = Math.max(a, c[0]), u = Math.max(u, c[1]);
    return Nt([r, l, a, u]);
  }
  /** INTERSECTCLIPRECT: later drawing is limited to this logical rectangle as well. */
  intersectClipRect(e) {
    const n = this.deviceRect(e);
    this.clip = n ? qr(this.clip, n) : [];
  }
  /** EXCLUDECLIPRECT: this logical rectangle is removed from the clip. */
  excludeClipRect(e) {
    const n = this.deviceRect(e);
    n && (this.clip = Zr(this.clip, n, this.surface));
  }
  /**
   * EXTSELECTCLIPRGN: combine these rectangles with the clip in a `RGN_*` mode. A GDI region is in
   * device units, so the window, viewport and world transform don't apply. (DeckCraft maps them as
   * logical units, which shifts the clip by any window origin: LibreOffice's TestNegativeWinOrg
   * cut its line of text in half.)
   */
  selectClipRects(e, n) {
    this.clip = Kr(this.clip, e.slice(0, te), n, this.surface);
  }
  /** The default clip: later records are not limited by a region (nor a clip path). */
  resetClip() {
    this.clip = null, this.pathClip = null;
  }
  /** Stores an object in `slot` (EMF index), or in the first free slot (WMF handle table). */
  addObject(e, n) {
    if (n.kind === "brush" && n.brush.pattern) {
      const o = n.brush.pattern.px.length;
      if (this.used + o > wn) {
        this.isFull = !0;
        return;
      }
      this.used += o;
    }
    if (e !== null) {
      if (e < vs) {
        for (; this.objects.length <= e; ) this.objects.push(null);
        this.objects[e] = n;
      }
      return;
    }
    const s = this.objects.indexOf(null);
    s >= 0 ? this.objects[s] = n : this.objects.length < vs && this.objects.push(n);
  }
  deleteObject(e) {
    e < this.objects.length && (this.objects[e] = null);
  }
  /** Selects an object by index; indices with the high bit set are stock objects. */
  select(e) {
    if ((e & Be) !== 0) {
      this.selectStock((e & ~Be) >>> 0);
      return;
    }
    const n = this.objects[e] ?? null;
    n && (n.kind === "pen" ? this.pen = n.pen : n.kind === "brush" ? this.brush = n.brush : n.kind === "font" && (this.text.font = n.font));
  }
  selectStock(e) {
    const n = [255, 255, 255, 255], s = [0, 0, 0, 255], o = (i) => Ot(Lt, [i, i, i, 255]);
    e === 0 || e === 18 ? this.brush = Ot(Lt, n) : e === 1 ? this.brush = o(192) : e === 2 ? this.brush = o(128) : e === 3 ? this.brush = o(64) : e === 4 ? this.brush = Ot(Lt, s) : e === 5 ? this.brush = Ot(Gn, s) : e === 6 ? this.pen = { style: 0, width: 0, color: n } : e === 7 || e === 19 ? this.pen = { style: 0, width: 0, color: s } : e === 8 ? this.pen = { style: Ve, width: 0, color: s } : e >= 10 && e <= 17 && (this.text.font = null);
  }
  mapOp(e) {
    switch (e.k) {
      case "M":
        return nt(this.map.device(e.p));
      case "L":
        return ct(this.map.device(e.p));
      case "C":
        return Ct(this.map.device(e.a), this.map.device(e.b), this.map.device(e.p));
      default:
        return mt;
    }
  }
  /**
   * The current brush's paint. Hatch and monochrome brushes take the background colour (when the
   * background mode is opaque) and the text colour. Under R2_MASKPEN (destination AND brush) a
   * tile's white pixels keep what is below, and its black ones take the colour of the XOR fill
   * before it: XOR, AND, XOR again leaves that colour where the tile is black.
   */
  fillPaint() {
    const e = this.brush;
    if (e.style === Lt) return { kind: "solid", color: e.color };
    if (e.style === qn) {
      const n = Uo(e.hatch, e.color, this.text.bkOpaque ? this.text.bkColor : null);
      return n ? { kind: "tile", tile: { w: 8, h: 8, px: n, cell: this.patternPx } } : null;
    }
    if (e.style === wl || e.style === Ml || e.style === zo) {
      const n = e.pattern;
      if (!n) return null;
      if (!n.mono && this.rop2 !== Es)
        return n.plain || (n.plain = { w: n.w, h: n.h, px: n.px, cell: this.patternPx }, Ls.add(n.plain)), { kind: "tile", tile: n.plain };
      const s = n.px.slice();
      for (let o = 0; o + 3 < s.length; o += 4) {
        if (n.mono) {
          const r = s[o] + s[o + 1] + s[o + 2] >= 384 ? this.text.bkColor : this.text.color;
          s[o] = r[0], s[o + 1] = r[1], s[o + 2] = r[2], s[o + 3] = 255;
        }
        this.rop2 === Es && (s[o] === 255 && s[o + 1] === 255 && s[o + 2] === 255 ? s[o + 3] = 0 : s[o] === 0 && s[o + 1] === 0 && s[o + 2] === 0 && this.xorColor && s.set(this.xorColor, o));
      }
      return { kind: "tile", tile: { w: n.w, h: n.h, px: s, cell: this.patternPx } };
    }
    return null;
  }
  /** Pushes device ops filled with `fill` and stroked with `stroke`: a tile fill and its outline are two items. */
  pushShape(e, n, s) {
    const o = this.evenOdd;
    n?.kind === "tile" ? (this.push({ kind: "pattern", ops: e, evenOdd: o, tile: n.tile, region: null }), s && this.push({ kind: "path", ops: e, fill: null, stroke: s, evenOdd: o, region: null })) : n?.kind === "solid" ? this.push({ kind: "path", ops: e, fill: n.color, stroke: s, evenOdd: o, region: null }) : s && this.push({ kind: "path", ops: e, fill: null, stroke: s, evenOdd: o, region: null });
  }
  /**
   * Whether the mix mode suppresses drawing: R2_NOP draws nothing, and R2_XORPEN shapes only
   * remember their fill colour (an XOR pair cancels; the see-through shadow idiom draws its
   * pattern in that colour).
   */
  mixSkips(e) {
    return this.rop2 === Cl ? !0 : this.rop2 === Sl ? (e && this.brush.style === Lt && (this.xorColor = this.brush.color), !0) : !1;
  }
  strokePen() {
    if ((this.pen.style & Lo) === Ve) return null;
    const e = this.pen.width === 0 ? 0 : Math.abs(this.pen.width) * this.map.scale();
    return [this.pen.color, e];
  }
  pushPathOps(e) {
    for (const n of e) {
      if (this.path.length >= ue) return;
      this.path.push(n);
    }
  }
  /**
   * Draws logical-space ops with the current pen (`stroke`) and brush (`fill`), or appends them to
   * the open path bracket, where fill and stroke wait for FILLPATH/STROKEPATH.
   */
  shape(e, n, s) {
    const o = e.map((i) => this.mapOp(i));
    if (this.inPath) {
      this.pushPathOps(o);
      return;
    }
    this.mixSkips(n) || o.length < 2 || this.pushShape(o, n ? this.fillPaint() : null, s ? this.strokePen() : null);
  }
  moveTo(e) {
    this.inPath && this.pushPathOps([nt(this.map.device(e))]), this.pos = e;
  }
  /** LINETO from the current point, then moves the current point to `p`. */
  lineTo(e) {
    this.lineChain([e], !1, !0);
  }
  /** Lines from the current point through `pts` (POLYLINETO), or a polyline from the current point. */
  lineChain(e, n, s) {
    const o = this.inPath && this.path.length ? [] : [nt(this.pos)];
    for (const i of e) o.push(ct(i));
    e.length && (this.pos = e[e.length - 1]), this.shape(o, n, s);
  }
  /** POLYBEZIER: cubic segments that start a new figure at `from`. The current point is unchanged. */
  bezier(e, n) {
    this.shape([nt(e), ...zs(n)], !1, !0);
  }
  /** POLYBEZIERTO: cubic segments from the current point; the current point moves to the last point. */
  bezierTo(e) {
    const n = this.inPath && this.path.length ? [] : [nt(this.pos)];
    n.push(...zs(e)), e.length && (this.pos = e[e.length - 1]), this.shape(n, !1, !0);
  }
  poly(e, n, s, o) {
    if (!e.length) return;
    const i = [nt(e[0])];
    for (let r = 1; r < e.length; r++) i.push(ct(e[r]));
    n && i.push(mt), this.shape(i, s, o);
  }
  beginPath() {
    this.inPath = !0, this.path = [];
  }
  endPath() {
    this.inPath = !1;
  }
  closeFigure() {
    this.inPath && this.pushPathOps([mt]);
  }
  /** FILLPATH, STROKEPATH and STROKEANDFILLPATH: paints the bracketed path and empties it. */
  paintPath(e, n) {
    const s = this.path;
    this.path = [], !(this.mixSkips(e) || s.length < 2) && this.pushShape(s, e ? this.fillPaint() : null, n ? this.strokePen() : null);
  }
  /** Fills a logical rectangle `[l, t, r, b]` with the current brush (PATBLT, PATCOPY blits). */
  fillBrushRect([e, n, s, o]) {
    if (this.mixSkips(!0)) return;
    const i = this.fillPaint();
    this.pushShape(Pt(e, n, s, o).map((r) => this.mapOp(r)), i, null);
  }
  /** Fills a logical rectangle `[l, t, r, b]` with a solid colour (ROP fills such as BLACKNESS). */
  fillRectWith([e, n, s, o], i) {
    this.push({ kind: "path", ops: Pt(e, n, s, o).map((r) => this.mapOp(r)), fill: i, stroke: null, evenOdd: !0, region: null });
  }
  /** Whether a raster operation draws without a source bitmap (PATCOPY, BLACKNESS, WHITENESS). */
  static sourceless(e) {
    return e === Ns || e === Is || e === Rs;
  }
  /** Fills a logical rectangle `[x, y, w, h]` for a source-less raster operation. PATCOPY uses the brush; the others fill black or white. */
  fillRop([e, n, s, o], i) {
    const r = [e, n, e + s, n + o];
    i === Ns ? this.fillBrushRect(r) : i === Is ? this.fillRectWith(r, [0, 0, 0, 255]) : i === Rs && this.fillRectWith(r, [255, 255, 255, 255]);
  }
  /**
   * Draws `text` (one `dx` advance per character, or none) with the current font, colours and
   * alignment. The reference point is `at`, or the current position under TA_UPDATECP (which then
   * moves past the string). `rect` (logical `[l, t, r, b]`) is filled with the background colour
   * under ETO_OPAQUE and clips the text under ETO_CLIPPED. Text ignores the mix mode, as GDI's does.
   */
  drawText(e, n, s, o, i) {
    (o & Fo) !== 0 && i && this.fillRectWith(i, this.text.bkColor);
    const r = this.text.font ?? { font: Ro(), escapement: 0 }, l = (this.text.align & pl) !== 0, a = l ? this.pos : e, [u, c] = gl(this.text.align), h = this.map.device(a), d = this.map.device([a[0] + 1, a[1]]), m = this.map.device([a[0], a[1] + 1]), f = [d[0] - h[0], d[1] - h[1]], p = [m[0] - h[0], m[1] - h[1]];
    if (l) {
      let E = s.length ? s.reduce((L, B) => L + B, 0) : Math.max(Math.abs(r.font.height), 1) * 0.5 * [...n].length;
      E = u === "left" ? E : u === "right" ? -E : 0;
      const $ = r.escapement / 10 * (Math.PI / 180), R = p[1] < 0 ? 1 : -1, I = [a[0] + E * Math.cos($), a[1] + E * Math.sin($) * R];
      Number.isFinite(I[0]) && Number.isFinite(I[1]) && (this.pos = I);
    }
    const g = Math.hypot(f[0], f[1]), b = Math.hypot(p[0], p[1]);
    if (!(n.length > 0 && [g, b, h[0], h[1]].every(Number.isFinite) && g > 0 && b > 0)) return;
    const M = (f[0] * p[1] - f[1] * p[0] > 0 ? Math.atan2(f[1], f[0]) : Math.atan2(f[1], Math.abs(f[0]))) - r.escapement / 10 * (Math.PI / 180), S = Math.cos(M), O = Math.sin(M);
    let T = null;
    if ((o & Yn) !== 0 && i) {
      const [E, $, R, I] = i, L = this.map.device([E, $]), B = this.map.device([R, I]);
      T = [Math.min(L[0], B[0]), Math.min(L[1], B[1]), Math.max(L[0], B[0]), Math.max(L[1], B[1])];
    }
    this.push({
      kind: "text",
      text: {
        transform: [g * S, g * O, -b * O, b * S, h[0], h[1]],
        text: n,
        dx: s,
        font: r.font,
        color: this.text.color,
        background: this.text.bkOpaque ? this.text.bkColor : null,
        hAlign: u,
        vAlign: c,
        clip: T,
        region: null
      },
      region: null
    });
  }
  /** A bitmap stretched into a logical rectangle `[x, y, w, h]`. A negative extent mirrors the bitmap, as the mapping does. */
  bitmap(e, n) {
    const [s, o, i, r] = e, l = this.map.device([s, o]), a = this.map.device([s + i, o + r]);
    let u = n;
    if (Bt(u)) {
      const c = l[0] > a[0], h = l[1] > a[1];
      (c || h) && (u = { ...u, flip: [!!u.flip?.[0] !== c, !!u.flip?.[1] !== h] });
    } else
      Wn(u, l[0] > a[0], l[1] > a[1]);
    this.push({ kind: "bitmap", rect: [Math.min(l[0], a[0]), Math.min(l[1], a[1]), Math.abs(a[0] - l[0]), Math.abs(a[1] - l[1])], img: u, region: null });
  }
}
const Ls = /* @__PURE__ */ new WeakSet();
function Uo(t, e, n) {
  if (t > 5 || t < 0) return null;
  const s = new Uint8Array(256);
  for (let o = 0; o < 8; o++)
    for (let i = 0; i < 8; i++) {
      const r = o === 7, l = i === 7, a = i === o, u = i + o === 7, c = t === 0 ? r : t === 1 ? l : t === 2 ? a : t === 3 ? u : t === 4 ? r || l : a || u;
      s.set(c ? e : n ?? [0, 0, 0, 0], (o * 8 + i) * 4);
    }
  return s;
}
function zs(t) {
  const e = [];
  for (let n = 0; n + 2 < t.length; n += 3) e.push(Ct(t[n], t[n + 1], t[n + 2]));
  return e;
}
const Tl = 726027589, El = 64, Nl = 64, ne = 1e5, vn = 256, js = 32768, Il = 64 * 1024 * 1024, Rl = 32, Us = ne, Fl = 3, Bl = 2, Dl = 6, Ll = 8, zl = 24;
function Sn(t) {
  switch (t.kind) {
    case "solid":
      return t.color;
    case "hatch":
      return t.fg;
    case "linear":
    case "radial":
      return Cn(t.stops, 0.5);
    case "texture":
      return Bt(t.img) ? [128, 128, 128, 255] : t.img.px.length >= 4 ? [t.img.px[0], t.img.px[1], t.img.px[2], t.img.px[3]] : [0, 0, 0, 255];
  }
}
function jl(t, e) {
  switch (t.kind) {
    case "solid":
      return t.color;
    case "hatch":
      return t.fg;
    case "linear": {
      const n = t.rect[2] === 0 ? 0 : (e[0] - t.rect[0]) / t.rect[2];
      return Cn(t.stops, _l(n, t.wrap));
    }
    case "radial": {
      const n = (e[0] - t.center[0]) / Math.max(t.radius[0], 1e-9), s = (e[1] - t.center[1]) / Math.max(t.radius[1], 1e-9);
      return Cn(t.stops, Math.min(Math.hypot(n, s), 1));
    }
    case "texture": {
      const n = t.img;
      if (Bt(n)) return [128, 128, 128, 255];
      const s = n.w, o = n.h;
      if (s === 0 || o === 0) return [0, 0, 0, 0];
      if (t.wrap === 4 && !(e[0] >= 0 && e[0] < s && e[1] >= 0 && e[1] < o)) return [0, 0, 0, 0];
      const i = Math.min(Math.floor(Wt(e[0], s)), s - 1), l = (Math.min(Math.floor(Wt(e[1], o)), o - 1) * s + i) * 4;
      return l + 4 <= n.px.length ? [n.px[l], n.px[l + 1], n.px[l + 2], n.px[l + 3]] : [0, 0, 0, 0];
    }
  }
}
const Ul = (t) => t.kind === "linear" || t.kind === "radial" || t.kind === "texture" ? t.xf : wt;
function _l(t, e) {
  if (!Number.isFinite(t)) return 0;
  if (e === 1 || e === 3) {
    const n = Wt(t, 2);
    return n > 1 ? 2 - n : n;
  }
  return e === 4 ? Math.min(1, Math.max(0, t)) : Wt(t, 1);
}
function Cn(t, e) {
  if (!t.length) return [0, 0, 0, 0];
  if (e <= t[0][0]) return t[0][1];
  for (let n = 0; n + 1 < t.length; n++) {
    const [s, o] = t[n], [i, r] = t[n + 1];
    if (e <= i) return Kn(o, r, i > s ? (e - s) / (i - s) : 0);
  }
  return t[t.length - 1][1];
}
function Kn(t, e, n) {
  return [0, 1, 2, 3].map((s) => Math.min(255, Math.max(0, Math.round(t[s] + (e[s] - t[s]) * n))));
}
class Hl {
  /** An EMF+ header said the file is EMF+ only, so these records are the picture. */
  active = !1;
  dpi = 96;
  world = wt;
  page = 1;
  /** Convex device clip polygon; null is unclipped. */
  clip = null;
  objects = new Array(El).fill(null);
  objectBytes = 0;
  stack = [];
  partial = null;
  /** The picture frame in device units (`[x, y, w, h]`), what Clear paints. */
  frame = null;
  depth;
  /** Play EMF+ records even in a file whose header says dual (see emf.ts). */
  force;
  /** A dual header was seen and EMF+ drawing records followed it, unplayed. */
  skippedDual = !1;
  constructor(e = 0, n = !1) {
    this.depth = e, this.force = n;
  }
  /** Plays the EMF+ records of one EMR_COMMENT payload (after the identifier). */
  comment(e, n) {
    let s = 0;
    for (; !e.full(); ) {
      const o = n.optU16(s), i = n.optU16(s + 2), r = n.optU32(s + 4), l = n.optU32(s + 8);
      if (o === void 0 || i === void 0 || r === void 0 || l === void 0 || r < 12 || l > r - 12 || s + 12 + l > n.length) break;
      const a = n.sub(s + 12, l);
      yt(() => this.record(e, o, i, a)), s += r;
    }
  }
  /** World units to device pixels before the canvas's own mapping. */
  xf() {
    return xt(this.world, [this.page, 0, 0, this.page, 0, 0]);
  }
  painter() {
    return new Ws(this.xf(), this.clip ? this.clip.slice() : null);
  }
  record(e, n, s, o) {
    if (n === 16385) {
      this.active = (s & 1) === 0 || this.force;
      const i = o.optU32(8);
      i !== void 0 && i > 0 && i < 1e5 && (this.dpi = i);
      return;
    }
    if (!this.active) {
      n !== 16386 && (this.skippedDual = !0);
      return;
    }
    n === 16392 ? this.object(s, o) : n === 16393 || n === 16403 || n >= 16410 && n <= 16412 || n === 16438 ? this.recordImageTextRegion(e, n, s, o) : n >= 16421 && n <= 16437 ? this.recordState(e, n, s, o) : n >= 16400 && n <= 16402 || n >= 16406 && n <= 16409 ? this.recordCurve(e, n, s, o) : this.recordShape(e, n, s, o);
  }
  /** Rectangle, polygon, ellipse and path records. */
  recordShape(e, n, s, o) {
    const i = (s & 16384) !== 0, r = s & 255;
    switch (n) {
      case 16394: {
        const l = this.brushOf(s, o.u32(0));
        if (!l) return;
        const a = this.painter();
        for (const u of Vt(o, 8, o.u32(4), i)) {
          if (e.full()) break;
          a.fill(e, Pt(...u), l);
        }
        return;
      }
      case 16395: {
        const l = this.pen(r);
        if (!l) return;
        const a = this.painter();
        for (const u of Vt(o, 4, o.u32(0), i)) {
          if (e.full()) break;
          a.stroke(e, Pt(...u), l);
        }
        return;
      }
      case 16396: {
        const l = this.brushOf(s, o.u32(0));
        l && this.painter().fill(e, je($t(o, 8, o.u32(4), i), !0), l);
        return;
      }
      case 16397: {
        const l = this.pen(r);
        l && this.painter().stroke(e, je($t(o, 4, o.u32(0), i), (s & 8192) !== 0), l);
        return;
      }
      case 16398: {
        const l = this.brushOf(s, o.u32(0)), a = Vt(o, 4, 1, i)[0];
        l && a && this.painter().fill(e, Ys(a), l);
        return;
      }
      case 16399: {
        const l = this.pen(r), a = Vt(o, 0, 1, i)[0];
        l && a && this.painter().stroke(e, Ys(a), l);
        return;
      }
      case 16404: {
        const l = this.brushOf(s, o.u32(0)), a = this.path(r);
        l && a && this.painter().fill(e, a, l);
        return;
      }
      case 16405: {
        const l = this.path(r), a = this.pen(o.u32(0));
        l && a && this.painter().stroke(e, l, a);
        return;
      }
    }
  }
  /** Curve, bezier and arc records. */
  recordCurve(e, n, s, o) {
    const i = (s & 16384) !== 0, r = s & 255;
    switch (n) {
      case 16409: {
        const l = this.pen(r), a = $t(o, 4, o.u32(0), i);
        if (!l || !a.length) return;
        const u = [nt(a[0])];
        for (let c = 1; c + 2 < a.length; c += 3) u.push(Ct(a[c], a[c + 1], a[c + 2]));
        this.painter().stroke(e, u, l);
        return;
      }
      // Cardinal splines: FillClosedCurve, DrawClosedCurve, DrawCurve.
      case 16406: {
        const l = this.brushOf(s, o.u32(0)), a = an(o.f32(4));
        if (!l || a === null) return;
        this.painter().fill(e, hn($t(o, 12, o.u32(8), i), a, !0, 0, 1 / 0), l);
        return;
      }
      case 16407: {
        const l = this.pen(r), a = an(o.f32(0));
        if (!l || a === null) return;
        this.painter().stroke(e, hn($t(o, 8, o.u32(4), i), a, !0, 0, 1 / 0), l);
        return;
      }
      case 16408: {
        const l = this.pen(r), a = an(o.f32(0));
        if (!l || a === null) return;
        const u = o.u32(4), c = o.u32(8);
        this.painter().stroke(e, hn($t(o, 16, o.u32(12), i), a, !1, u, c), l);
        return;
      }
      case 16400: {
        const l = this.brushOf(s, o.u32(0)), a = Ft(o, 4, 2), u = Vt(o, 12, 1, i)[0];
        l && a && u && this.painter().fill(e, Vs(u, a[0], a[1], !0), l);
        return;
      }
      case 16401:
      case 16402: {
        const l = this.pen(r), a = Ft(o, 0, 2), u = Vt(o, 8, 1, i)[0];
        l && a && u && this.painter().stroke(e, Vs(u, a[0], a[1], n === 16401), l);
        return;
      }
    }
  }
  /** Clear, region fill, image and text records. */
  recordImageTextRegion(e, n, s, o) {
    const i = (s & 16384) !== 0, r = s & 255;
    switch (n) {
      // Clear: the whole picture in one colour, whatever the clip (a transparent clear leaves nothing to draw).
      case 16393: {
        const l = It(o.u32(0));
        if (!this.frame) return;
        const [a, u, c, h] = this.frame;
        if (l[3] === 0 || !(c > 0 && h > 0)) return;
        const d = _o(xt(e.world(), e.deviceAffine()));
        if (!d) return;
        new Ws(d, null).fill(e, Pt(a, u, a + c, u + h), { kind: "solid", color: l });
        return;
      }
      // FillRegion: the region's area (as the clip reads it).
      case 16403: {
        const l = this.brushOf(s, o.u32(0)), a = this.objects[r];
        if (!l || a?.kind !== "region" || !a.area || a.area.length < 3) return;
        this.painter().fill(e, je(a.area, !0), l);
        return;
      }
      case 16410: {
        const l = this.image(r), a = Vt(o, 24, 1, i)[0];
        l && a && this.drawImage(e, l, o, [a[0], a[1], a[2] - a[0], a[3] - a[1]]);
        return;
      }
      case 16411: {
        const l = this.image(r), a = $t(o, 28, 3, i);
        if (!l || a.length < 3) return;
        const [u, c, h] = a;
        this.drawImage(e, l, o, [u[0], u[1], c[0] - u[0] + (h[0] - u[0]), h[1] - u[1] + (c[1] - u[1])]);
        return;
      }
      case 16412:
        this.drawString(e, s, o);
        return;
      case 16438:
        this.drawDriverString(e, s, o);
        return;
    }
  }
  /** Save / restore, transform and clip records. */
  recordState(e, n, s, o) {
    const i = s & 255;
    switch (n) {
      case 16421:
      case 16424:
        this.push(o.u32(0));
        return;
      case 16423:
        this.push(o.u32(24));
        return;
      case 16422:
      case 16425:
        this.pop(o.u32(0));
        return;
      case 16426: {
        const r = ae(o, 0);
        r && (this.world = r);
        return;
      }
      case 16427:
        this.world = wt;
        return;
      case 16428: {
        const r = ae(o, 0);
        r && this.apply(r, s);
        return;
      }
      case 16429:
        this.apply([1, 0, 0, 1, o.f32(0), o.f32(4)], s);
        return;
      case 16430:
        this.apply([o.f32(0), 0, 0, o.f32(4), 0, 0], s);
        return;
      case 16431: {
        const r = o.f32(0) * Math.PI / 180;
        this.apply([Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0], s);
        return;
      }
      case 16432: {
        const r = o.f32(0) * Xs(s & 255, this.dpi);
        Number.isFinite(r) && r > 0 && r < 1e6 && (this.page = r);
        return;
      }
      case 16433:
        this.clip = null;
        return;
      case 16434: {
        const r = Ft(o, 0, 4);
        if (!r) return;
        const [l, a, u, c] = r;
        this.combine(s, un(fe([l, a, l + u, a + c]), xt(this.xf(), e.deviceAffine())));
        return;
      }
      case 16435: {
        const r = this.path(i);
        r && this.combine(s, un(Xo(r), xt(this.xf(), e.deviceAffine())));
        return;
      }
      case 16436: {
        const r = this.objects[i];
        r?.kind === "region" && this.combine(s, un(r.area, xt(this.xf(), e.deviceAffine())));
        return;
      }
      case 16437: {
        const r = Ft(o, 0, 2);
        if (!r) return;
        const l = xt(this.xf(), e.deviceAffine()), a = r[0] * l[0] + r[1] * l[2], u = r[0] * l[1] + r[1] * l[3];
        this.clip && (this.clip = this.clip.map((c) => [c[0] + a, c[1] + u]));
        return;
      }
    }
  }
  /** Without the `A` flag a transform is applied before the world transform (prepended). */
  apply(e, n) {
    e.every(Number.isFinite) && (this.world = (n & 8192) !== 0 ? xt(this.world, e) : xt(e, this.world));
  }
  push(e) {
    this.stack.length < Nl && this.stack.push({ id: e, world: this.world, page: this.page, clip: this.clip });
  }
  pop(e) {
    let n = -1;
    for (let o = this.stack.length - 1; o >= 0; o--) if (this.stack[o].id === e) {
      n = o;
      break;
    }
    if (n < 0) return;
    const s = this.stack[n];
    this.world = s.world, this.page = s.page, this.clip = s.clip, this.stack.length = n;
  }
  /** Combines a new clip area with the current one: replace, intersect and union (as the rectangle around both). XOR, exclude and complement leave the clip. */
  combine(e, n) {
    const s = e >> 8 & 15;
    s === 0 ? this.clip = n : s === 1 ? this.clip = Wo(this.clip, n) : s === 2 && (this.clip = Vo(this.clip, n));
  }
  object(e, n) {
    const s = e & 255, o = e >> 8 & 127;
    if ((e & 32768) !== 0) {
      const r = Math.min(n.u32(0), Il), l = n.tail(4).b;
      let a = this.partial;
      this.partial = null, (!a || a.id !== s || a.kind !== o || a.total !== r) && (a = { id: s, kind: o, total: r, chunks: [], len: 0 });
      const u = l.subarray(0, Math.min(l.length, Math.max(0, a.total - a.len)));
      a.chunks.push(u), a.len += u.length, a.len >= a.total ? this.store(a.id, yt(() => cn(a.kind, new Qt(_s(a.chunks, a.len)), this.depth)) ?? null) : this.partial = a;
      return;
    }
    const i = this.partial;
    if (this.partial = null, i && i.id === s && i.kind === o) {
      const r = n.b.subarray(0, Math.min(n.length, Math.max(0, i.total - i.len)));
      i.chunks.push(r), i.len += r.length, this.store(s, yt(() => cn(o, new Qt(_s(i.chunks, i.len)), this.depth)) ?? null);
      return;
    }
    this.store(s, yt(() => cn(o, n, this.depth)) ?? null);
  }
  store(e, n) {
    if (e >= this.objects.length) return;
    const s = this.objects[e];
    if (s && (this.objectBytes = Math.max(0, this.objectBytes - Hs(s))), this.objects[e] = null, n) {
      const o = Hs(n);
      this.objectBytes + o <= wn && (this.objectBytes += o, this.objects[e] = n);
    }
  }
  path(e) {
    const n = this.objects[e];
    return n?.kind === "path" ? n.ops : null;
  }
  pen(e) {
    const n = this.objects[e];
    return n?.kind === "pen" ? [n.color, n.width] : null;
  }
  image(e) {
    const n = this.objects[e];
    return n?.kind === "image" ? n.data : null;
  }
  font(e) {
    const n = this.objects[e];
    return n?.kind === "font" ? n.font : null;
  }
  /** The brush of a fill record: an ARGB value with the `S` flag, else a brush object. */
  brushOf(e, n) {
    if ((e & 32768) !== 0) return { kind: "solid", color: It(n) };
    const s = this.objects[n];
    return s?.kind === "brush" ? s.fill : null;
  }
  /** DrawImage and DrawImagePoints: the source rectangle (pixels) cut from the image, drawn into world rectangle `dst` = `[x, y, w, h]`. */
  drawImage(e, n, s, o) {
    if (n.kind === "meta") {
      this.painter().picture(e, o, n.pic);
      return;
    }
    const i = Ft(s, 8, 4);
    if (!i) return;
    const r = s.u32(4) === 2 ? i.map((a) => Math.min(1e9, Math.max(-1e9, Math.round(a)))) : [0, 0, 0, 0], l = Bt(n.img) ? Jl(n.img, r, o) : Xn(n.img, r, o);
    l && this.painter().image(e, l.dst, l.img);
  }
  /** The font as a LOGFONT whose height is in world units. */
  logFont(e) {
    const n = e.unit === 0 ? e.em : e.em * Xs(e.unit, this.dpi) / this.page;
    return {
      font: { ...Ro(), family: e.family, height: -Math.min(1e6, Math.max(0, n)), weight: (e.style & 1) !== 0 ? 700 : 400, italic: (e.style & 2) !== 0, underline: (e.style & 4) !== 0, strike: (e.style & 8) !== 0 },
      escapement: 0
    };
  }
  /** DrawString: lines of text laid out in a rectangle by the string format's alignments. */
  drawString(e, n, s) {
    const o = this.font(n & 255), i = this.brushOf(n, s.u32(0));
    if (!o || !i) return;
    const r = Sn(i), l = this.objects[s.u32(4)], a = l?.kind === "format" ? l.format : { flags: 0, align: 0, lineAlign: 0 }, u = Math.min(s.u32(8), js), c = Ft(s, 12, 4);
    if (!c) return;
    const [h, d, m, f] = c, p = [];
    for (let L = 0; L < u; L++) p.push(s.u16(28 + L * 2));
    const g = this.logFont(o), b = -g.font.height, x = m > 0 && (a.flags & 4096) === 0, k = [];
    let w = [];
    const M = () => {
      const L = w.filter((B) => B !== 13);
      x ? k.push(...ea(L, m, b)) : k.push(L), w = [];
    };
    for (const L of p)
      L === 10 ? M() : w.push(L);
    M();
    const S = b * 1.2, [O, T] = a.align === 1 ? [h + m / 2, Dl] : a.align === 2 ? [h + m, Bl] : [h, 0], E = S * k.length, $ = a.lineAlign === 1 ? d + (f - E) / 2 : a.lineAlign === 2 ? d + f - E : d, R = m > 0 && f > 0 && (a.flags & 16384) === 0 ? [h, d, h + m, d + f] : null, I = this.painter();
    k.forEach((L, B) => {
      if (!L.length) return;
      const [D, C] = he(L, []);
      let P = [O, $ + S * B], F = T;
      a.lineAlign === 2 && k.length === 1 && (P = [O, d + f], F = T | Ll), I.text(e, P, D, C, { color: r, font: g, align: F, clip: R }, wt);
    });
  }
  /** DrawDriverString with character codes (CmapLookup): positioned glyphs on a baseline. */
  drawDriverString(e, n, s) {
    const o = this.font(n & 255), i = this.brushOf(n, s.u32(0));
    if (!o || !i) return;
    const r = Sn(i), l = s.u32(4), a = Math.min(s.u32(12), js);
    let u = [];
    for (let p = 0; p < a; p++) u.push(s.u16(16 + p * 2));
    if ((l & 1) === 0 && (u = ta(o.family, u), !u))
      return;
    const c = $t(s, 16 + a * 2, a, !1), h = s.u32(8) !== 0 ? ae(s, 16 + a * 10) : wt;
    if (!h || !c.length) return;
    const d = this.logFont(o);
    let m = [];
    if ((l & 4) === 0) {
      for (let p = 0; p + 1 < c.length; p++) m.push(c[p + 1][0] - c[p][0]);
      m.push(m.length ? m[m.length - 1] : -d.font.height * 0.5);
    }
    let f;
    [f, m] = he(u, m), this.painter().text(e, c[0], f, m, { color: r, font: d, align: zl, clip: null }, h);
  }
}
function _s(t, e) {
  const n = new Uint8Array(e);
  let s = 0;
  for (const o of t)
    n.set(o, s), s += o.length;
  return n;
}
function Hs(t) {
  return t.kind === "image" ? t.data.kind === "bitmap" ? Bt(t.data.img) ? t.data.img.bytes.length : t.data.img.px.length : t.data.pic.items.length * 128 : t.kind === "brush" && t.fill.kind === "texture" ? Bt(t.fill.img) ? t.fill.img.bytes.length : t.fill.img.px.length : t.kind === "path" ? t.ops.length * 56 : 0;
}
function Xs(t, e) {
  switch (t) {
    case 3:
      return e / 72;
    case 4:
      return e;
    case 5:
      return e / 300;
    case 6:
      return e / 25.4;
    default:
      return 1;
  }
}
class Ws {
  xf;
  clip;
  constructor(e, n) {
    this.xf = e, this.clip = n;
  }
  begin(e, n) {
    const s = e.world();
    e.saveDc(), e.modifyWorld(xt(xt(n, this.xf), s), 4), e.setClip(this.clip);
  }
  end(e) {
    e.restoreDc(-1), e.setClip(null);
  }
  fill(e, n, s) {
    if (this.begin(e, wt), e.setPen({ style: Ve, width: 0, color: [0, 0, 0, 0] }), s.kind === "solid")
      e.setBrush(Ot(Lt, s.color)), e.shape(n, !0, !1);
    else if (s.kind === "hatch") {
      const o = Uo(s.style, s.fg, s.bg);
      o ? e.tileShape(n, { w: 8, h: 8, px: o, cell: e.patternPx }) : (e.setBrush(Ot(Lt, Kn(s.fg, s.bg, 0.5))), e.shape(n, !0, !1));
    } else {
      const o = _o(xt(Ul(s), e.deviceAffine()));
      o && e.shadeShape(n, (i) => jl(s, Pn(o, i)));
    }
    this.end(e);
  }
  stroke(e, n, [s, o]) {
    this.begin(e, wt), e.setPen({ style: 0, width: o, color: s }), e.setBrush(Ot(Gn, [0, 0, 0, 0])), e.shape(n, !1, !0), this.end(e);
  }
  image(e, n, s) {
    this.begin(e, wt), e.bitmap(n, s), this.end(e);
  }
  /** A nested metafile's picture stretched into world rectangle `dst` = `[x, y, w, h]`. */
  picture(e, [n, s, o, i], r) {
    this.begin(e, wt);
    const l = o / r.width, a = i / r.height, u = xt([l, 0, 0, a, n, s], e.deviceAffine()), c = Math.sqrt(Math.abs(u[0] * u[3] - u[1] * u[2])), h = (m, f) => Pn(u, [m, f]), d = (m) => m.map((f) => f.k === "M" ? nt(h(f.x, f.y)) : f.k === "L" ? ct(h(f.x, f.y)) : f.k === "C" ? Ct(h(f.x1, f.y1), h(f.x2, f.y2), h(f.x, f.y)) : mt);
    for (const m of r.items) {
      if (e.full()) break;
      let f;
      if (m.kind === "path")
        f = { kind: "path", ops: d(m.segs), fill: m.fill, stroke: m.stroke ? [m.stroke[0], m.stroke[1] * c] : null, evenOdd: m.evenOdd, region: null };
      else if (m.kind === "pattern") {
        const p = m.tile, g = { w: p.width, h: p.height, px: p.rgba, cell: p.cell[0] * c };
        f = { kind: "pattern", ops: d(m.segs), evenOdd: m.evenOdd, tile: g, region: null };
      } else if (m.kind === "bitmap") {
        const p = h(m.rect[0], m.rect[1]), g = h(m.rect[0] + m.rect[2], m.rect[1] + m.rect[3]);
        let b = m.img;
        if (Bt(b)) {
          const x = p[0] > g[0], k = p[1] > g[1];
          (x || k) && (b = { ...b, flip: [!!b.flip?.[0] !== x, !!b.flip?.[1] !== k] });
        } else
          b = { ...b, px: b.px.slice() }, Wn(b, p[0] > g[0], p[1] > g[1]);
        f = { kind: "bitmap", rect: [Math.min(p[0], g[0]), Math.min(p[1], g[1]), Math.abs(g[0] - p[0]), Math.abs(g[1] - p[1])], img: b, region: null };
      } else {
        const p = { ...m.text };
        if (p.transform = xt(p.transform, u), p.clip) {
          const [g, b, x, k] = p.clip, w = h(g, b), M = h(x, k);
          p.clip = [Math.min(w[0], M[0]), Math.min(w[1], M[1]), Math.max(w[0], M[0]), Math.max(w[1], M[1])];
        }
        f = { kind: "text", text: p, region: null };
      }
      e.pushDevice(f);
    }
    this.end(e);
  }
  text(e, n, s, o, i, r) {
    this.begin(e, r), e.setTextStyle(i.color, i.font, i.align), e.drawText(n, s, o, i.clip ? Yn : 0, i.clip), this.end(e);
  }
}
const Pn = (t, e) => [e[0] * t[0] + e[1] * t[2] + t[4], e[0] * t[1] + e[1] * t[3] + t[5]];
function _o(t) {
  const e = t[0] * t[3] - t[1] * t[2];
  if (!Number.isFinite(e) || Math.abs(e) < 1e-12) return null;
  const n = t[3] / e, s = -t[1] / e, o = -t[2] / e, i = t[0] / e;
  return [n, s, o, i, -(t[4] * n + t[5] * o), -(t[4] * s + t[5] * i)];
}
const It = (t) => [t >>> 16 & 255, t >>> 8 & 255, t & 255, t >>> 24 & 255];
function Ft(t, e, n) {
  const s = [];
  for (let o = 0; o < n; o++) s.push(t.f32(e + o * 4));
  return s.every(Number.isFinite) ? s : null;
}
const ae = (t, e) => Ft(t, e, 6), an = (t) => Number.isFinite(t) ? t : null;
function cn(t, e, n) {
  switch (t) {
    case 1: {
      const s = Ho(e, 0, n);
      return s ? { kind: "brush", fill: s } : null;
    }
    case 2:
      return Vl(e, n);
    case 3: {
      const s = Jn(e);
      return s ? { kind: "path", ops: s } : null;
    }
    case 4:
      return Yl(e);
    case 5: {
      const s = Yo(e, n);
      return s ? { kind: "image", data: s } : null;
    }
    case 6:
      return Gl(e);
    case 7:
      return { kind: "format", format: { flags: e.u32(4), align: e.u32(12), lineAlign: e.u32(16) } };
    default:
      return null;
  }
}
function Ho(t, e, n) {
  const s = t.tail(e + 8);
  switch (t.u32(e + 4)) {
    case 0:
      return { kind: "solid", color: It(s.u32(0)) };
    case 1:
      return { kind: "hatch", style: s.u32(0), fg: It(s.u32(4)), bg: It(s.u32(8)) };
    case 2: {
      const o = s.u32(0), i = s.u32(4);
      let r = wt, l = 8;
      if ((o & 2) !== 0) {
        const u = ae(s, 8);
        if (!u) return null;
        r = u, l = 32;
      }
      const a = Yo(s.tail(l), n);
      return !a || a.kind !== "bitmap" ? null : { kind: "texture", img: a.img, wrap: i, xf: r };
    }
    case 3:
      return Wl(s);
    case 4:
      return Xl(s);
    default:
      return null;
  }
}
function Xl(t) {
  const e = t.u32(0), n = t.u32(4), s = Ft(t, 8, 4);
  if (!s) return null;
  const o = It(t.u32(24)), i = It(t.u32(28));
  let r = 40, l = wt;
  if ((e & 2) !== 0) {
    const u = ae(t, r);
    if (!u) return null;
    l = u, r += 24;
  }
  let a = [[0, o], [1, i]];
  if ((e & 4) !== 0) {
    const u = Math.min(t.u32(r), vn);
    a = [];
    for (let c = 0; c < u; c++) a.push([t.f32(r + 4 + c * 4), It(t.u32(r + 4 + u * 4 + c * 4))]);
  } else if ((e & 8) !== 0) {
    const u = Math.min(t.u32(r), vn);
    a = [];
    for (let c = 0; c < u; c++) {
      const h = t.f32(r + 4 + u * 4 + c * 4);
      a.push([t.f32(r + 4 + c * 4), Kn(o, i, Math.min(1, Math.max(0, h)))]);
    }
  }
  return a = a.filter((u) => Number.isFinite(u[0])).sort((u, c) => u[0] - c[0]), a.length ? { kind: "linear", rect: s, stops: a, wrap: n, xf: l } : null;
}
function Wl(t) {
  const e = t.u32(0), n = It(t.u32(8)), s = Ft(t, 12, 2);
  if (!s) return null;
  const o = Math.min(t.u32(20), vn), i = o > 0 ? It(t.u32(24)) : n;
  let r = 24 + o * 4, l;
  if ((e & 1) !== 0) {
    const u = t.u32(r), c = Jn(t.tail(r + 4));
    l = c ? ee(c) : null, r += 4 + u;
  } else {
    const u = t.u32(r), c = $t(t, r + 4, u, !1);
    l = ee(je(c, !0)), r += 4 + 8 * Math.min(u, ne);
  }
  if (!l) return null;
  const a = (e & 2) !== 0 ? ae(t, r) : wt;
  return a ? { kind: "radial", center: [s[0], s[1]], radius: [(l[2] - l[0]) / 2, (l[3] - l[1]) / 2], stops: [[0, n], [1, i]], xf: a } : null;
}
function Vl(t, e) {
  const n = t.u32(8), s = t.f32(16);
  let o = 20;
  for (const [r, l] of [[1, 24], [2, 4], [4, 4], [8, 4], [16, 4], [32, 4], [64, 4], [128, 4]]) (n & r) !== 0 && (o += l);
  for (const r of [256, 512, 1024])
    (n & r) !== 0 && (o += r === 512 ? 4 : 4 + 4 * Math.min(t.u32(o), ne));
  for (const r of [2048, 4096]) (n & r) !== 0 && (o += 4 + Math.min(t.u32(o), 1 << 20));
  const i = Ho(t, o, e);
  return i ? { kind: "pen", color: Sn(i), width: Number.isFinite(s) ? Math.min(1e5, Math.max(0, s)) : 0 } : null;
}
function Jn(t) {
  const e = Math.min(t.u32(4), ne), n = t.u32(8);
  if ((n & 6144) !== 0) return null;
  const s = (n & 16384) !== 0, o = $t(t, 12, e, s), i = t.slice(12 + e * (s ? 4 : 8), e), r = [];
  let l = 0;
  for (; l < e; ) {
    const a = i[l], u = o[l];
    if ((a & 7) === 0) r.push(nt(u));
    else if ((a & 7) === 3 && l + 2 < e) {
      r.push(Ct(u, o[l + 1], o[l + 2])), (i[l + 2] & 128) !== 0 && r.push(mt), l += 3;
      continue;
    } else r.push(ct(u));
    (a & 128) !== 0 && r.push(mt), l++;
  }
  return r;
}
function Yl(t) {
  const n = An(t, 8, 0, { n: 0 });
  return n ? { kind: "region", area: n[0] } : null;
}
function An(t, e, n, s) {
  if (s.n++, n > Rl || s.n > Us) return null;
  const o = t.u32(e);
  if (o === 268435456) {
    const i = Ft(t, e + 4, 4);
    if (!i) return null;
    const [r, l, a, u] = i;
    return [fe([Math.min(r, r + a), Math.min(l, l + u), Math.max(r, r + a), Math.max(l, l + u)]), 20];
  }
  if (o === 268435457) {
    const i = t.u32(e + 4);
    if (i < 12) return null;
    const r = t.sub(e + 8, i);
    if (s.n += Math.min(r.u32(4), ne), s.n > Us) return null;
    const l = Jn(r);
    return l ? [Xo(l), 8 + i] : null;
  }
  if (o === 268435458) return [[], 4];
  if (o === 268435459) return [null, 4];
  if (o <= 5) {
    const i = An(t, e + 4, n + 1, s);
    if (!i) return null;
    const r = An(t, e + 4 + i[1], n + 1, s);
    return r ? [o === 0 ? r[0] : o === 1 ? Wo(i[0], r[0]) : o === 2 ? Vo(i[0], r[0]) : i[0], 4 + i[1] + r[1]] : null;
  }
  return null;
}
function Xo(t) {
  const e = We(t);
  if (e.length === 1) {
    const s = Pe(e[0][0]);
    if (s) return s;
  }
  const n = ee(t);
  return n ? fe(n) : [];
}
function Wo(t, e) {
  return t === null ? e : e === null ? t : t.length >= 3 && e.length >= 3 ? Pe(Vn(t, e)) ?? [] : [];
}
function Vo(t, e) {
  if (t === null || e === null) return null;
  if (t.length < 3) return e;
  if (e.length < 3) return t;
  const n = Ye([...t, ...e]);
  return n ? fe(n) : [];
}
function un(t, e) {
  if (t === null) return null;
  const n = t.map((s) => Pn(e, s));
  return n.length < 3 ? [] : Pe(n) ?? [];
}
function Vs([t, e, n, s], o, i, r) {
  const l = (t + n) / 2, a = (e + s) / 2, u = (n - t) / 2, c = (s - e) / 2, h = Math.min(360, Math.max(-360, i)), d = (w) => {
    const M = w * Math.PI / 180;
    return Math.atan2(u * Math.sin(M), c * Math.cos(M));
  }, m = d(o);
  let f = Math.abs(h) >= 360 ? Math.sign(h) * Math.PI * 2 : d(o + h) - m;
  if (Math.abs(h) < 360) {
    for (; h > 0 && f < 0; ) f += Math.PI * 2;
    for (; h < 0 && f > 0; ) f -= Math.PI * 2;
  }
  const p = (w) => [l + u * Math.cos(w), a + c * Math.sin(w)], g = r ? [nt([l, a]), ct(p(m))] : [nt(p(m))], b = Math.min(4, Math.max(1, Math.ceil(Math.abs(f) / (Math.PI / 2)))), x = f / b, k = 4 / 3 * Math.tan(x / 4);
  for (let w = 0; w < b; w++) {
    const M = m + x * w, S = m + x * (w + 1), O = p(M), T = p(S);
    g.push(Ct([O[0] - k * u * Math.sin(M), O[1] + k * c * Math.cos(M)], [T[0] + k * u * Math.sin(S), T[1] - k * c * Math.cos(S)], T));
  }
  return r && g.push(mt), g;
}
function Gl(t) {
  const e = t.f32(4), n = Math.min(t.u32(20), 64), s = [];
  for (let i = 0; i < n; i++) s.push(t.u16(24 + i * 2));
  const o = he(s, [])[0].replace(/\0+$/, "");
  return Number.isFinite(e) ? { kind: "font", font: { em: e, unit: t.u32(8), style: t.u32(12), family: o } } : null;
}
function Yo(t, e) {
  const n = t.u32(4);
  if (n === 1) {
    const s = Kl(t);
    return s ? { kind: "bitmap", img: s } : null;
  }
  if (n === 2) {
    const s = ql(t, e);
    return s ? { kind: "meta", pic: s } : null;
  }
  return null;
}
function ql(t, e) {
  if (e + 1 > Fl) return null;
  const n = t.u32(12), s = yt(() => t.slice(16, n)) ?? t.tail(16).b;
  let o = null;
  try {
    o = Go(s, e + 1);
  } catch {
    o = null;
  }
  return o && o.width > 0 && o.height > 0 ? o : null;
}
let Go = () => {
  throw new Error("nested parse not set");
};
function Zl(t) {
  Go = t;
}
function Kl(t) {
  const e = t.i32(8), n = t.i32(12), s = t.i32(16), o = t.u32(20), i = t.tail(28);
  if (t.u32(24) === 1) return ll(i.b);
  if (e <= 0 || n <= 0 || e * n > Oo) return null;
  const r = o >>> 8 & 255;
  let l = [], a = i;
  if ((o & 65536) !== 0) {
    const m = Math.min(i.u32(4), 256);
    for (let f = 0; f < m; f++) l.push(It(i.u32(8 + f * 4)));
    a = i.tail(8 + m * 4);
  }
  const u = Math.ceil(e * r / 8), c = Math.max(Math.abs(s), u), h = new Uint8Array(e * n * 4);
  for (let m = 0; m < n; m++) {
    const f = a.slice(m * c, u);
    for (let p = 0; p < e; p++) {
      let g;
      if ((r === 1 || r === 4 || r === 8) && l.length) {
        const b = p * r, x = f[b >> 3] >> 8 - r - b % 8 & (1 << r) - 1;
        g = l[x] ?? [0, 0, 0, 255];
      } else if (r === 24) {
        const b = p * 3;
        g = [f[b + 2], f[b + 1], f[b], 255];
      } else if (o === 139273 && r === 32) {
        const b = p * 4;
        g = [f[b + 2], f[b + 1], f[b], 255];
      } else if (o === 925707 && r === 32) {
        const b = p * 4, x = f[b + 3], k = (w) => x === 0 ? w : Math.min(255, Math.floor((w * 255 + (x >> 1)) / x));
        g = [k(f[b + 2]), k(f[b + 1]), k(f[b]), x];
      } else if (r === 32) {
        const b = p * 4;
        g = [f[b + 2], f[b + 1], f[b], f[b + 3]];
      } else if (o === 135174 && r === 16) {
        const b = f[p * 2] | f[p * 2 + 1] << 8, x = (k, w) => Math.floor(k * 255 / ((1 << w) - 1));
        g = [x(b >> 11, 5), x(b >> 5 & 63, 6), x(b & 31, 5), 255];
      } else if (r === 16) {
        const b = f[p * 2] | f[p * 2 + 1] << 8, x = (k) => Math.floor((k & 31) * 255 / 31);
        g = [x(b >> 10), x(b >> 5), x(b), 255];
      } else
        return null;
      if (g.some((b) => b === void 0)) return null;
      h.set(g, (m * e + p) * 4);
    }
  }
  const d = { w: e, h: n, bottomUp: s < 0, px: h };
  return d.bottomUp && (Wn(d, !1, !0), d.bottomUp = !1), d;
}
function Jl(t, e, n) {
  const [s, o, i, r] = e[2] > 0 && e[3] > 0 ? e : [0, 0, t.w, t.h], l = Math.max(s, 0), a = Math.min(s + i, t.w), u = Math.max(o, 0), c = Math.min(o + r, t.h);
  if (a <= l || c <= u) return null;
  const h = n[2] / i, d = n[3] / r, m = l === 0 && u === 0 && a === t.w && c === t.h;
  return { img: { ...t, crop: m ? null : [l, u, a - l, c - u] }, dst: [n[0] + (l - s) * h, n[1] + (u - o) * d, (a - l) * h, (c - u) * d] };
}
function $t(t, e, n, s) {
  const o = Math.min(n, ne), i = [];
  for (let r = 0; r < o; r++)
    if (s) i.push([t.i16(e + r * 4), t.i16(e + r * 4 + 2)]);
    else {
      const l = t.f32(e + r * 8), a = t.f32(e + r * 8 + 4);
      if (!Number.isFinite(l) || !Number.isFinite(a)) return [];
      i.push([l, a]);
    }
  return i;
}
function Vt(t, e, n, s) {
  const o = $t(t, e, Math.min(n, ne / 2) * 2, s), i = [];
  for (let r = 0; r + 1 < o.length; r += 2) i.push([o[r][0], o[r][1], o[r][0] + o[r + 1][0], o[r][1] + o[r + 1][1]]);
  return i;
}
function hn(t, e, n, s, o) {
  const i = t.length;
  if (i < 2) return [];
  const r = Math.min(10, Math.max(0, e)) / 3, l = (h) => t[n ? Wt(h, i) : Math.min(i - 1, Math.max(0, h))] ?? [0, 0], a = n ? 0 : Math.min(s, i - 1), u = n ? i : Math.min(o, i - 1 - a), c = [nt(l(a))];
  for (let h = a; h < a + u; h++) {
    const d = l(h - 1), m = l(h), f = l(h + 1), p = l(h + 2);
    c.push(Ct([m[0] + (f[0] - d[0]) * r, m[1] + (f[1] - d[1]) * r], [f[0] - (p[0] - m[0]) * r, f[1] - (p[1] - m[1]) * r], f));
  }
  return n && c.push(mt), c;
}
function je(t, e) {
  const n = t.map((s, o) => o === 0 ? nt(s) : ct(s));
  return e && n.push(mt), n;
}
function Ys([t, e, n, s]) {
  const o = (t + n) / 2, i = (e + s) / 2, r = (n - t) / 2, l = (s - e) / 2, a = 0.55228475, u = r * a, c = l * a;
  return [
    nt([o + r, i]),
    Ct([o + r, i + c], [o + u, i + l], [o, i + l]),
    Ct([o - u, i + l], [o - r, i + c], [o - r, i]),
    Ct([o - r, i - c], [o - u, i - l], [o, i - l]),
    Ct([o + u, i - l], [o + r, i - c], [o + r, i]),
    mt
  ];
}
const Ql = ["arial", "arial black", "times new roman", "courier new", "verdana", "georgia", "tahoma", "trebuchet ms", "comic sans ms", "impact"];
function ta(t, e) {
  if (!Ql.includes(t.trim().toLowerCase())) return null;
  const n = [];
  for (const s of e) {
    if (s < 3 || s > 97) return null;
    n.push(s + 29);
  }
  return n;
}
function Gs(t) {
  const e = String.fromCharCode(t);
  return " ilj.,:;'!|Iftr".includes(e) ? 0.3 : "mwMW".includes(e) ? 0.85 : /[A-Z0-9]/.test(e) ? 0.62 : t >= 11904 ? 1 : 0.52;
}
function ea(t, e, n) {
  if (n <= 0 || !Number.isFinite(e)) return [t];
  const s = (c) => {
    let h = c.length;
    for (; h > 0 && c[h - 1] === 32; ) h--;
    return h;
  }, o = (c) => c.reduce((h, d) => h + Gs(d) * n, 0), i = [];
  let r = [], l = 0;
  const a = [];
  let u = [];
  for (const c of t)
    u.push(c), c === 32 && (a.push(u), u = []);
  u.length && a.push(u);
  for (const c of a) {
    const h = s(c), d = o(c.slice(0, h)), m = o(c);
    if (r.length) {
      if (l + d <= e) {
        r.push(...c), l += m;
        continue;
      }
    } else if (d <= e) {
      r.push(...c), l = m;
      continue;
    }
    if (r.length && (i.push(r.slice(0, s(r))), r = []), d <= e) {
      r.push(...c), l = m;
      continue;
    }
    let f = 0;
    for (const p of c) {
      const g = Gs(p) * n;
      r.length ? f + g <= e ? (r.push(p), f += g) : (i.push(r.slice(0, s(r))), r = [p], f = g) : (r.push(p), f = g);
    }
    l = f;
  }
  return i.push(r.slice(0, s(r))), i;
}
class Jt extends Error {
  kind;
  constructor(e) {
    super(e === "NotMetafile" ? "not a WMF or EMF file" : e === "BadHeader" ? "metafile header is truncated or invalid" : "metafile has no readable records"), this.kind = e;
  }
}
const qo = 256, na = 512, sa = 1179469088, qs = 72 / 2540, oa = 13369376, ia = 983040, ra = 0;
function Zo(t) {
  return t.optU32(0) === 1 && t.optU32(40) === sa;
}
function Ko(t, e = 0, n = !1) {
  if (!Zo(t)) throw new Jt("BadHeader");
  const s = t.optU32(4), o = yt(() => At(t, 8));
  if (s === void 0 || !o) throw new Jt("BadHeader");
  const [i, r, l, a] = o, u = la(t) ?? (l > i && a > r ? { rect: [i, r, l - i, a - r], size: null } : null), c = new Te();
  l > i && a > r && c.setClipSurface([i, r, l, a]);
  const h = Jo(t);
  h && c.setDeviceMm(h);
  const d = new Hl(e, n);
  d.frame = u ? u.rect : null;
  let m = 0, f = Math.max(s, 88);
  for (; !c.full(); ) {
    const p = t.optU32(f), g = t.optU32(f + 4);
    if (p === void 0 || g === void 0 || g < 8 || g % 4 !== 0 || f + g > t.length) break;
    const b = t.sub(f, g);
    if (p === 14) break;
    p === 70 && b.optU32(12) === Tl ? b.length >= 16 && d.comment(c, b.tail(16)) : yt(() => aa(c, p, b)), m++, f += g;
  }
  if (m === 0) throw new Jt("NoRecords");
  return !n && d.skippedDual && c.items.length === 0 ? Ko(t, e, !0) : { cv: c, frame: u };
}
function Jo(t) {
  const e = t.optI32(72), n = t.optI32(76), s = t.optI32(80), o = t.optI32(84);
  return e === void 0 || n === void 0 || s === void 0 || o === void 0 ? null : e > 0 && n > 0 && s > 0 && o > 0 ? [e / s, n / o] : null;
}
function la(t) {
  const e = yt(() => At(t, 24));
  if (!e) return null;
  const [n, s, o, i] = e;
  if (o <= n || i <= s) return null;
  const r = Jo(t);
  if (!r) return null;
  const l = r[0] / 100, a = r[1] / 100;
  return { rect: [n * l, s * a, (o - n) * l, (i - s) * a], size: [(o - n) * qs, (i - s) * qs] };
}
function aa(t, e, n) {
  if (!t.full())
    switch (e) {
      case 9:
        t.setWindowExt(Tt(n, 8));
        break;
      case 10:
        t.setWindowOrg(Tt(n, 8));
        break;
      case 11:
        t.setViewportExt(Tt(n, 8));
        break;
      case 12:
        t.setViewportOrg(Tt(n, 8));
        break;
      case 17:
        t.setMapMode(n.u32(8));
        break;
      case 19:
        t.setPolyfill(n.u32(8));
        break;
      case 20:
        t.setRop2(n.u32(8));
        break;
      case 33:
        t.saveDc();
        break;
      case 34:
        t.restoreDc(n.i32(8));
        break;
      case 35:
        t.modifyWorld(Zs(n, 8), 4);
        break;
      case 36: {
        const s = Zs(n, 8);
        t.modifyWorld(s, n.u32(32));
        break;
      }
      case 37:
        t.select(n.u32(8));
        break;
      case 38:
        pa(t, n);
        break;
      case 95:
        ma(t, n);
        break;
      case 39:
        ga(t, n);
        break;
      case 93:
      case 94:
        ba(t, n, e === 93);
        break;
      case 82:
        xa(t, n);
        break;
      case 18:
        t.setBkMode(n.u32(8));
        break;
      case 22:
        t.setTextAlign(n.u32(8));
        break;
      case 24:
        t.setTextColor(n.u32(8));
        break;
      case 25:
        t.setBkColor(n.u32(8));
        break;
      case 83:
      case 84:
        ka(t, n, e === 84);
        break;
      case 108:
        wa(t, n);
        break;
      case 40:
        t.deleteObject(n.u32(8));
        break;
      case 29:
        t.excludeClipRect(At(n, 8));
        break;
      case 30:
        t.intersectClipRect(At(n, 8));
        break;
      case 75:
        ca(t, n);
        break;
      case 27:
        t.moveTo(Tt(n, 8));
        break;
      case 54:
        t.lineTo(Tt(n, 8));
        break;
      case 42: {
        const [s, o, i, r] = At(n, 8);
        t.shape(So(s, o, i, r), !0, !0);
        break;
      }
      case 43: {
        const [s, o, i, r] = At(n, 8);
        t.shape(Pt(s, o, i, r), !0, !0);
        break;
      }
      case 44: {
        const s = n.i32(24), o = n.i32(28), [i, r, l, a] = At(n, 8);
        t.shape(vo(i, r, l, a, s, o), !0, !0);
        break;
      }
      case 45:
      case 46:
      case 47: {
        const [s, o, i] = da(n), r = e === 45 ? "arc" : e === 46 ? "chord" : "pie", [l, a, u, c] = s;
        t.shape(Co(l, a, u, c, o, i, r, t.arcClockwise), r !== "arc", !0);
        break;
      }
      // Beyond DeckCraft: arc direction, angle arcs, POLYDRAW, region fills, clip paths, palettes.
      case 57:
        t.arcClockwise = n.u32(8) === 2;
        break;
      case 41:
        ua(t, n);
        break;
      case 56:
      case 92:
        ha(t, n, e === 56);
        break;
      case 71: {
        const s = fn(n, 24, 32);
        t.fillRegion(s, n.u32(28));
        break;
      }
      case 74: {
        const s = fn(n, 24, 28);
        t.fillRegion(s, null);
        break;
      }
      case 72: {
        const s = fn(n, 24, 40);
        t.frameRegion(s, n.u32(28), n.i32(32), n.i32(36));
        break;
      }
      case 67:
        t.selectClipPath(n.u32(8));
        break;
      case 49:
        fa(t, n);
        break;
      case 48:
        t.selectPalette(n.u32(8));
        break;
      case 4:
      case 87:
        t.poly(me(n, e === 4), !1, !1, !0);
        break;
      case 3:
      case 86:
        t.poly(me(n, e === 3), !0, !0, !0);
        break;
      case 6:
      case 89:
        t.lineChain(me(n, e === 6), !1, !0);
        break;
      // POLYBEZIER starts its own figure at the first point and leaves the current point alone;
      // POLYBEZIERTO continues from the current point.
      case 2:
      case 85: {
        const s = me(n, e === 2);
        s.length && t.bezier(s[0], s.slice(1));
        break;
      }
      case 5:
      case 88:
        t.bezierTo(me(n, e === 5));
        break;
      case 7:
      case 90: {
        const [s, o] = Ks(n, e === 7);
        t.shape(yn(o, s, !1), !1, !0);
        break;
      }
      case 8:
      case 91: {
        const [s, o] = Ks(n, e === 8);
        t.shape(yn(o, s, !0), !0, !0);
        break;
      }
      case 59:
        t.beginPath();
        break;
      case 60:
        t.endPath();
        break;
      case 61:
        t.closeFigure();
        break;
      case 62:
        t.paintPath(!0, !1);
        break;
      case 63:
        t.paintPath(!0, !0);
        break;
      case 64:
        t.paintPath(!1, !0);
        break;
      case 76:
      case 77:
        Ma(t, n, e === 77);
        break;
      case 80:
        Ca(t, n);
        break;
      case 81:
        Sa(t, n);
        break;
      case 114:
        va(t, n);
        break;
    }
}
function ca(t, e) {
  const n = e.u32(8), s = e.u32(12);
  if (n === 0) {
    t.resetClip();
    return;
  }
  const o = 16;
  if (n < 32 || e.u32(o + 4) !== 1) return;
  const i = Math.min(e.u32(o + 8), te), r = o + n, l = [];
  for (let a = 0; a < i; a++) {
    const u = o + 32 + a * 16;
    if (u + 16 > r) break;
    l.push(At(e, u));
  }
  t.selectClipRects(l, s);
}
function fn(t, e, n) {
  const s = t.u32(e);
  if (s < 32 || t.u32(n + 4) !== 1) return [];
  const o = Math.min(t.u32(n + 8), te * 64), i = [];
  for (let r = 0; r < o && 32 + r * 16 + 16 <= s; r++) i.push(At(t, n + 32 + r * 16));
  return i;
}
function ua(t, e) {
  const [n, s] = Tt(e, 8), o = e.u32(16), i = e.f32(20), r = e.f32(24);
  if (!Number.isFinite(i) || !Number.isFinite(r) || o > 1e7) return;
  const l = -(i * Math.PI) / 180, a = -(Math.max(-3600, Math.min(3600, r)) * Math.PI) / 180, u = [n + o * Math.cos(l), s + o * Math.sin(l)], c = [n + o * Math.cos(l + a), s + o * Math.sin(l + a)], h = [nt(t.currentPos()), ct(u), ...a !== 0 ? qt(n, s, o, o, l, a) : []];
  t.setCurrentPos(c), t.shape(h, !1, !0);
}
function ha(t, e, n) {
  const s = e.u32(24);
  if (s > ue) return;
  const o = e.tail(28).points(0, s, n), i = e.slice(28 + s * (n ? 8 : 4), s), r = [nt(t.currentPos())];
  let l = t.currentPos();
  for (let a = 0; a < s; a++) {
    const u = i[a] & 6;
    u === 6 ? (r.push(nt(o[a])), l = o[a]) : u === 4 && a + 2 < s ? (r.push(Ct(o[a], o[a + 1], o[a + 2])), a += 2) : r.push(ct(o[a])), i[a] & 1 ? (r.push(mt), t.setCurrentPos(l)) : t.setCurrentPos(o[a]);
  }
  t.shape(r, !1, !0);
}
function fa(t, e) {
  const n = e.u32(8), s = Math.min(e.u16(14), 1024), o = [];
  for (let i = 0; i < s; i++) o.push([e.u8(16 + i * 4), e.u8(17 + i * 4), e.u8(18 + i * 4), 255]);
  t.addObject(n, { kind: "palette", colors: o });
}
const Tt = (t, e) => [t.i32(e), t.i32(e + 4)], At = (t, e) => [t.i32(e), t.i32(e + 4), t.i32(e + 8), t.i32(e + 12)], J = (t, e) => t.optI32(e) ?? 0;
function Zs(t, e) {
  return [0, 1, 2, 3, 4, 5].map((n) => t.f32(e + n * 4));
}
const da = (t) => [At(t, 8), Tt(t, 24), Tt(t, 32)];
function me(t, e) {
  const n = t.u32(24);
  return n > ue ? [] : t.tail(28).points(0, n, e);
}
function Ks(t, e) {
  const n = t.u32(24);
  if (n > ue) return [[], []];
  t.slice(32, n * 4);
  const s = [];
  for (let i = 0; i < n; i++) s.push(t.u32(32 + i * 4));
  const o = s.reduce((i, r) => i + r, 0);
  return o > ue ? [[], []] : [s, t.tail(32 + n * 4).points(0, o, e)];
}
function pa(t, e) {
  const n = e.u32(8), s = e.u32(12), o = e.i32(16), i = e.u32(24);
  t.addObject(n, { kind: "pen", pen: { style: s, width: o, color: t.colorOf(i) } });
}
function ma(t, e) {
  const n = e.u32(8), s = e.u32(28), o = e.u32(32), i = e.u32(36), r = e.u32(40), l = (s & ia) === ra ? 0 : o, a = i === Gn ? Ve : s & Lo;
  t.addObject(n, { kind: "pen", pen: { style: a, width: l, color: t.colorOf(r) } });
}
function ga(t, e) {
  const n = e.u32(8), s = e.u32(12), o = e.u32(16), i = Ot(s, t.colorOf(o));
  s === qn && (i.hatch = e.optU32(20) ?? 0), t.addObject(n, { kind: "brush", brush: i });
}
function ba(t, e, n) {
  const s = e.u32(8), o = e.u32(12), i = e.u32(16), r = e.u32(20), l = e.u32(24), a = e.u32(28), u = $e(e.sub(i, r), e.sub(l, a), !1), c = u && jo(u, n || o === 1);
  c && t.addObject(s, { kind: "brush", brush: c });
}
function xa(t, e) {
  const n = e.u32(8), s = e.i32(12), o = e.optI32(16) ?? 0, i = e.optI32(20) ?? 0, r = e.optI32(28) ?? 0, l = (h) => e.optU8(h) ?? 0, a = [];
  for (let h = 0; h < 32; h++) {
    const d = e.optU16(40 + 2 * h);
    if (d === void 0 || d === 0) break;
    a.push(d);
  }
  const [u] = he(a, []), c = {
    family: u.trim(),
    height: s,
    width: o,
    weight: Math.min(1e3, Math.max(0, r)),
    italic: l(32) !== 0,
    underline: l(33) !== 0,
    strike: l(34) !== 0,
    charset: l(35)
  };
  t.addObject(n, { kind: "font", font: { font: c, escapement: i } });
}
function ya(t, e, n, s) {
  const o = (s & ml) !== 0 ? 8 : 4;
  if (e === 0) return [];
  const i = [];
  for (let r = 0; r < n; r++) {
    const l = t.optI32(e + r * o);
    if (l === void 0) return [];
    i.push(l);
  }
  return i;
}
const Qo = (t) => {
  const e = [];
  for (let n = 0; n + 1 < t.length; n += 2) e.push(t[n] | t[n + 1] << 8);
  return e;
};
function ka(t, e, n) {
  const s = Tt(e, 36), o = Math.min(e.u32(44), Ge), i = e.u32(48), r = e.u32(52), [l, a] = (r & qo) !== 0 ? [null, e.u32(56)] : [yt(() => At(e, 56)) ?? null, e.u32(72)];
  if ((r & Bo) !== 0) return;
  const u = ya(e, a, o, r), [c, h] = n ? he(Qo(e.slice(i, o * 2)), u) : Oe(e.slice(i, o), t.fontCharset(), u);
  t.drawText(s, c, h, r, l);
}
function wa(t, e) {
  const n = Tt(e, 8), s = Math.min(e.u32(16), Ge), o = e.u32(20);
  if ((o & Bo) !== 0) return;
  const [i, r] = (o & qo) !== 0 ? [null, 36] : [yt(() => At(e, 36)) ?? null, 52], [l] = (o & na) !== 0 ? Oe(e.slice(r, s), t.fontCharset(), []) : he(Qo(e.slice(r, s * 2)), []);
  t.drawText(n, l, [], o, i);
}
function Ma(t, e, n) {
  const s = [J(e, 24), J(e, 28), J(e, 32), J(e, 36)], o = e.u32(40);
  if (Te.sourceless(o)) {
    t.fillRop(s, o);
    return;
  }
  const [i, r] = n ? [J(e, 100), J(e, 104)] : [s[2], s[3]];
  qe(t, e, s, [J(e, 44), J(e, 48), i, r], [84, 92], { kind: "rop", rop: o });
}
function va(t, e) {
  const n = [J(e, 24), J(e, 28), J(e, 32), J(e, 36)], s = e.u8(42), o = (e.u8(43) & 1) !== 0;
  qe(t, e, n, [J(e, 44), J(e, 48), J(e, 100), J(e, 104)], [84, 92], { kind: "alpha", constant: s, perPixel: o });
}
function Sa(t, e) {
  const n = [J(e, 24), J(e, 28), J(e, 72), J(e, 76)], s = [J(e, 32), J(e, 36), J(e, 40), J(e, 44)];
  qe(t, e, n, s, [48, 56], { kind: "rop", rop: e.u32(68) });
}
function Ca(t, e) {
  const n = J(e, 40), s = J(e, 44);
  n <= 0 || s <= 0 || qe(t, e, [J(e, 24), J(e, 28), n, s], [J(e, 32), J(e, 36) - e.u32(68), n, s], [48, 56], { kind: "rop", rop: oa });
}
function qe(t, e, n, s, o, i) {
  const r = e.u32(o[0]), l = e.u32(o[0] + 4), a = e.u32(o[1]), u = e.u32(o[1] + 4);
  if (u === 0) return;
  const c = $e(e.sub(r, l), e.sub(a, u), i.kind === "alpha" && i.perPixel);
  if (!c) return;
  Eo(c, i);
  const h = Xn(c, s.map(Math.trunc), n);
  h && t.bitmap(h.dst, h.img);
}
const ti = 2596720087, Pa = 1440, Aa = 72 / 96;
function $a(t) {
  if (t.optU32(0) === ti) return !0;
  const e = t.optU16(0), n = t.optU16(2), s = t.optU16(4);
  return (e === 1 || e === 2) && n === 9 && (s === 256 || s === 768);
}
function Oa(t) {
  const e = t.optU32(0) === ti;
  let n = 0, s = null;
  if (e) {
    const c = [6, 8, 10, 12].map((k) => t.optI16(k));
    if (c.some((k) => k === void 0)) throw new Jt("BadHeader");
    const [h, d, m, f] = c, p = t.optU16(14), g = p && p > 0 ? p : Pa, b = m - h, x = f - d;
    s = b > 0 && x > 0 ? { c: [h, d, m, f], size: [b * 72 / g, x * 72 / g] } : null, n = 22;
  }
  const o = t.optU16(n + 2);
  if (o === void 0 || o < 9) throw new Jt("BadHeader");
  let i = n + o * 2;
  const r = new Te();
  if (s) {
    const { c, size: h } = s;
    r.playInto([c[0], c[1], c[2] - c[0], c[3] - c[1]], h), r.setClipSurface([0, 0, h[0], h[1]]), r.patternPx = Aa;
  }
  let l = s !== null, a = 0;
  for (; !r.full(); ) {
    const c = t.optU32(i), h = t.optU16(i + 4);
    if (c === void 0 || h === void 0) break;
    const d = c * 2;
    if (d < 6 || i + d > t.length) break;
    const m = t.sub(i, d);
    if (h === 0) break;
    if (yt(() => Ta(r, h, m)), h === 524 && r.windowSet && !l && !r.viewportSet) {
      const f = r.map.we;
      r.playInto(null, [Math.abs(f[0]), Math.abs(f[1])]), l = !0;
    }
    a++, i += d;
  }
  if (a === 0) throw new Jt("NoRecords");
  let u;
  if (s && !r.viewportSet && r.map.usesExtents())
    u = { rect: [0, 0, s.size[0], s.size[1]], size: s.size };
  else if (s) {
    const c = s.c, h = r.map.device([c[0], c[1]]), d = r.map.device([c[2], c[3]]), m = [Math.min(h[0], d[0]), Math.min(h[1], d[1]), Math.abs(d[0] - h[0]), Math.abs(d[1] - h[1])];
    u = m[2] > 0 && m[3] > 0 ? { rect: m, size: s.size } : null;
  } else if (l && !r.viewportSet && r.map.usesExtents()) {
    const c = r.map.ve;
    u = { rect: [0, 0, c[0], c[1]], size: null };
  } else r.windowSet ? u = { rect: r.map.windowRect(), size: null } : u = null;
  return { cv: r, frame: u };
}
function Ta(t, e, n) {
  if (!t.full())
    switch (e) {
      case 259:
        t.setMapMode(n.u16(6));
        break;
      case 262:
        t.setPolyfill(n.u16(6));
        break;
      case 260:
        t.setRop2(n.u16(6));
        break;
      // Y is stored before X in these records.
      case 523:
        t.setWindowOrg(Ut(n, 6));
        break;
      case 524:
        t.setWindowExt(Ut(n, 6));
        break;
      case 525:
        t.setViewportOrg(Ut(n, 6));
        break;
      case 526:
        t.setViewportExt(Ut(n, 6));
        break;
      case 30:
        t.saveDc();
        break;
      case 295:
        t.restoreDc(n.i16(6));
        break;
      case 532:
        t.moveTo(Ut(n, 6));
        break;
      case 531:
        t.lineTo(Ut(n, 6));
        break;
      case 805:
        t.poly(Qs(n), !1, !1, !0);
        break;
      case 804:
        t.poly(Qs(n), !0, !0, !0);
        break;
      case 1336: {
        const s = La(n);
        s && t.shape(s, !0, !0);
        break;
      }
      case 1051: {
        const [s, o, i, r] = oe(n, 6);
        t.shape(Pt(s, o, i, r), !0, !0);
        break;
      }
      case 1564: {
        const s = n.i16(8), o = n.i16(6), [i, r, l, a] = oe(n, 10);
        t.shape(vo(i, r, l, a, s, o), !0, !0);
        break;
      }
      case 1045:
        t.excludeClipRect(oe(n, 6));
        break;
      case 1046:
        t.intersectClipRect(oe(n, 6));
        break;
      case 1048: {
        const [s, o, i, r] = oe(n, 6);
        t.shape(So(s, o, i, r), !0, !0);
        break;
      }
      case 2071:
      case 2074:
      case 2096: {
        const [s, o, i] = Da(n), r = e === 2071 ? "arc" : e === 2074 ? "pie" : "chord", [l, a, u, c] = s;
        t.shape(Co(l, a, u, c, o, i, r, t.arcClockwise), r !== "arc", !0);
        break;
      }
      case 762:
        Ea(t, n);
        break;
      case 764:
        Na(t, n);
        break;
      case 763:
        t.addObject(null, { kind: "font", font: yt(() => Ra(n)) ?? { font: { family: "", height: 0, width: 0, weight: 0, italic: !1, underline: !1, strike: !1, charset: 0 }, escapement: 0 } });
        break;
      case 322: {
        const s = yt(() => Ia(n)) ?? null;
        t.addObject(null, s ? { kind: "brush", brush: s } : { kind: "other" });
        break;
      }
      // A palette takes a handle slot; SELECTPALETTE makes PALETTEINDEX colours resolve against it.
      // (Beyond DeckCraft, which reads every palette colour as black.)
      case 247: {
        const s = yt(() => {
          const o = Math.min(n.u16(8), 1024), i = [];
          for (let r = 0; r < o; r++) i.push([n.u8(10 + r * 4), n.u8(11 + r * 4), n.u8(12 + r * 4), 255]);
          return i;
        });
        t.addObject(null, s ? { kind: "palette", colors: s } : { kind: "other" });
        break;
      }
      case 564:
        t.selectPalette(Js(n.u16(6)));
        break;
      // Old-style pattern brushes and regions take a handle slot too, so later SELECTOBJECT handles
      // count them; selecting one draws nothing.
      case 505:
      case 1791:
        t.addObject(null, { kind: "other" });
        break;
      case 521:
        t.setTextColor(n.u32(6));
        break;
      case 513:
        t.setBkColor(n.u32(6));
        break;
      case 258:
        t.setBkMode(n.u16(6));
        break;
      case 302:
        t.setTextAlign(n.u16(6));
        break;
      case 2610:
        Fa(t, n);
        break;
      case 1313:
        Ba(t, n);
        break;
      // PATBLT: rop(4), height, width, y, x.
      case 1565:
        t.fillRop([G(n, 16), G(n, 14), G(n, 12), G(n, 10)], n.u32(6));
        break;
      case 301:
        t.select(Js(n.u16(6)));
        break;
      case 496:
        t.deleteObject(n.u16(6));
        break;
      // STRETCHDIB: rop(4) usage(2) srcH srcW ySrc xSrc destH destW yDest xDest, then the DIB.
      case 3907: {
        const s = n.optU32(6) ?? 0;
        Qn(t, n, 28, s, [G(n, 26), G(n, 24), G(n, 22), G(n, 20)], [G(n, 18), G(n, 16), G(n, 14), G(n, 12)]);
        break;
      }
      case 2881:
        ja(t, n);
        break;
      case 2368:
        za(t, n);
        break;
    }
}
const Js = (t) => (t & 32768) !== 0 ? (t & 32767 | 2147483648) >>> 0 : t, G = (t, e) => t.optI16(e) ?? 0;
function Ea(t, e) {
  const n = e.u16(6), s = e.i16(8), o = e.u32(12);
  t.addObject(null, { kind: "pen", pen: { style: n, width: s, color: t.colorOf(o) } });
}
function Na(t, e) {
  const n = e.u16(6), s = e.u32(8), o = Ot(n, t.colorOf(s));
  n === qn && (o.hatch = e.optU16(12) ?? 0), t.addObject(null, { kind: "brush", brush: o });
}
function Ia(t) {
  const e = t.u16(8), n = t.tail(10), s = Hn(n);
  if (s === null) return null;
  const o = $e(n.sub(0, s), n.tail(s), !1);
  return o ? jo(o, e === 1) : null;
}
function Ra(t) {
  const e = t.i16(6), n = t.optI16(8) ?? 0, s = t.optI16(10) ?? 0, o = t.optI16(14) ?? 0, i = (c) => t.optU8(c) ?? 0, r = t.b.subarray(Math.min(24, t.length), Math.min(56, t.length)), l = r.indexOf(0), a = l >= 0 ? r.subarray(0, l) : r, [u] = Oe(a, 0, []);
  return {
    font: {
      family: u.trim(),
      height: e,
      width: n,
      weight: Math.min(1e3, Math.max(0, o)),
      italic: i(16) !== 0,
      underline: i(17) !== 0,
      strike: i(18) !== 0,
      charset: i(19)
    },
    escapement: s
  };
}
function Fa(t, e) {
  const n = e.i16(6), s = e.i16(8);
  let o = Math.min(e.u16(10), Ge);
  const i = e.u16(12), r = (i & (Fo | Yn)) !== 0, l = r ? [G(e, 14), G(e, 16), G(e, 18), G(e, 20)] : null, a = r ? 22 : 14;
  o = Math.min(o, Math.max(0, e.length - a));
  const u = e.slice(a, o), c = a + o + o % 2, h = [];
  if (e.length >= c + 2 * o) for (let f = 0; f < o; f++) h.push(e.i16(c + 2 * f));
  const [d, m] = Oe(u, t.fontCharset(), h);
  t.drawText([s, n], d, m, i, l);
}
function Ba(t, e) {
  const n = Math.min(e.u16(6), Ge), s = e.slice(8, n), o = 8 + n + n % 2, i = e.i16(o), r = e.i16(o + 2), [l] = Oe(s, t.fontCharset(), []);
  t.drawText([r, i], l, [], 0, null);
}
const Ut = (t, e) => [t.i16(e + 2), t.i16(e)];
function oe(t, e) {
  const n = t.i16(e), s = t.i16(e + 2), o = t.i16(e + 4);
  return [t.i16(e + 6), o, s, n];
}
const Da = (t) => {
  const e = Ut(t, 6), n = Ut(t, 10);
  return [oe(t, 14), n, e];
}, Qs = (t) => t.tail(8).points(0, t.u16(6), !1);
function La(t) {
  const e = t.u16(6), n = [];
  for (let i = 0; i < e; i++) n.push(t.u16(8 + i * 2));
  const s = n.reduce((i, r) => i + r, 0);
  if (s > ue) return null;
  const o = t.tail(8 + e * 2).points(0, s, !1);
  return yn(o, n, !0);
}
const ei = (t, e) => Math.floor(e.length / 2) > (t >> 8) + 3;
function za(t, e) {
  const n = e.u32(6);
  if (!ei(2368, e)) {
    t.fillRop([G(e, 22), G(e, 20), G(e, 18), G(e, 16)], n);
    return;
  }
  const s = [G(e, 20), G(e, 18), G(e, 16), G(e, 14)];
  if (Te.sourceless(n)) {
    t.fillRop(s, n);
    return;
  }
  Qn(t, e, 22, n, s, [G(e, 12), G(e, 10), s[2], s[3]]);
}
function ja(t, e) {
  const n = e.u32(6);
  if (!ei(2881, e)) {
    t.fillRop([G(e, 26), G(e, 24), G(e, 22), G(e, 20)], n);
    return;
  }
  const s = [G(e, 24), G(e, 22), G(e, 20), G(e, 18)];
  if (Te.sourceless(n)) {
    t.fillRop(s, n);
    return;
  }
  Qn(t, e, 26, n, s, [G(e, 16), G(e, 14), G(e, 12), G(e, 10)]);
}
function Qn(t, e, n, s, o, i) {
  const r = e.tail(n), l = Hn(r);
  if (l === null) return;
  const a = $e(r.sub(0, l), r.tail(l), !1);
  if (!a) return;
  Eo(a, { kind: "rop", rop: s });
  const u = Xn(a, i, o);
  u && t.bitmap(u.dst, u.img);
}
const Ua = (() => {
  const t = new Uint32Array(256);
  for (let e = 0; e < 256; e++) {
    let n = e;
    for (let s = 0; s < 8; s++) n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    t[e] = n >>> 0;
  }
  return t;
})();
function _a(t, e, n) {
  let s = 4294967295;
  for (let o = e; o < n; o++) s = Ua[(s ^ t[o]) & 255] ^ s >>> 8;
  return (s ^ 4294967295) >>> 0;
}
function dn(t, e) {
  const n = new Uint8Array(12 + e.length), s = new DataView(n.buffer);
  s.setUint32(0, e.length);
  for (let o = 0; o < 4; o++) n[4 + o] = t.charCodeAt(o);
  return n.set(e, 8), s.setUint32(8 + e.length, _a(n, 4, 8 + e.length)), n;
}
function ts(t, e, n) {
  const s = new Uint8Array(13), o = new DataView(s.buffer);
  o.setUint32(0, t), o.setUint32(4, e), s[8] = 8, s[9] = 6;
  const i = new Uint8Array(e * (t * 4 + 1));
  for (let u = 0; u < e; u++) {
    const c = u * (t * 4 + 1);
    i[c] = 0, i.set(n.subarray(u * t * 4, (u + 1) * t * 4), c + 1);
  }
  const r = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), dn("IHDR", s), dn("IDAT", li(i, { level: 6 })), dn("IEND", new Uint8Array(0))], l = new Uint8Array(r.reduce((u, c) => u + c.length, 0));
  let a = 0;
  for (const u of r)
    l.set(u, a), a += u.length;
  return l;
}
function Ae(t) {
  let e = "";
  for (let s = 0; s < t.length; s += 32768) e += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(e);
}
const to = 1854 / 2048, eo = 434 / 2048, Ha = 904 / 2048, Xa = 12, j = (t) => {
  const e = Math.round(t * 1e3) / 1e3;
  return Object.is(e, -0) ? "0" : String(e);
}, pn = (t) => t.replace(new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]", "g"), "").replace(/[&<>"]/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[e]), Me = (t) => `rgb(${t[0]},${t[1]},${t[2]})`, ve = (t, e) => t[3] < 255 ? ` ${e}="${j(t[3] / 255)}"` : "";
function no(t) {
  let e = "";
  for (const n of t)
    n.k === "M" ? e += `M${j(n.x)} ${j(n.y)}` : n.k === "L" ? e += `L${j(n.x)} ${j(n.y)}` : n.k === "C" ? e += `C${j(n.x1)} ${j(n.y1)} ${j(n.x2)} ${j(n.y2)} ${j(n.x)} ${j(n.y)}` : e += "Z";
  return e;
}
function Wa(t, e = {}) {
  const n = e.width ?? t.width * 96 / 72, s = e.height ?? t.height * 96 / 72, o = [], i = [], r = { clip: /* @__PURE__ */ new Map(), tile: /* @__PURE__ */ new Map(), tileByContent: /* @__PURE__ */ new Map(), next: 0 }, l = (h) => `${h}${r.next++}`, a = (h) => {
    if (!h) return null;
    const d = JSON.stringify(h);
    let m = r.clip.get(d);
    return m || (m = l("r"), r.clip.set(d, m), o.push(`<clipPath id="${m}">${h.map(([f, p, g, b]) => `<rect x="${j(f)}" y="${j(p)}" width="${j(g - f)}" height="${j(b - p)}"/>`).join("")}</clipPath>`)), m;
  }, u = (h, d) => {
    if (d && d.length === 0) return "";
    const m = a(d);
    return m ? `<g clip-path="url(#${m})">${h}</g>` : h;
  }, c = (h) => {
    let d = r.tile.get(h);
    if (!d) {
      const m = h.width * h.cell[0], f = h.height * h.cell[1], p = `data:image/png;base64,${Ae(ts(h.width, h.height, h.rgba))}`, g = `${j(h.origin[0])},${j(h.origin[1])},${j(m)},${j(f)},${p}`;
      if (d = r.tileByContent.get(g), d)
        return r.tile.set(h, d), d;
      d = l("p"), r.tile.set(h, d), r.tileByContent.set(g, d), o.push(`<pattern id="${d}" patternUnits="userSpaceOnUse" x="${j(h.origin[0])}" y="${j(h.origin[1])}" width="${j(m)}" height="${j(f)}"><image href="${p}" width="${j(m)}" height="${j(f)}" preserveAspectRatio="none" style="image-rendering:pixelated"/></pattern>`);
    }
    return d;
  };
  for (const h of t.items) i.push(Va(h, u, c, l, o));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${j(n)}" height="${j(s)}" viewBox="0 0 ${j(t.width)} ${j(t.height)}" preserveAspectRatio="none">` + (o.length ? `<defs>${o.join("")}</defs>` : "") + i.join("") + "</svg>";
}
function Va(t, e, n, s, o) {
  switch (t.kind) {
    case "path": {
      const i = t.fill ? `fill="${Me(t.fill)}"${ve(t.fill, "fill-opacity")}` : 'fill="none"';
      let r = "";
      if (t.stroke) {
        const [a, u] = t.stroke;
        r = u > 0 ? ` stroke="${Me(a)}"${ve(a, "stroke-opacity")} stroke-width="${j(u)}" stroke-linejoin="round" stroke-linecap="round"` : ` stroke="${Me(a)}"${ve(a, "stroke-opacity")} stroke-width="1" vector-effect="non-scaling-stroke"`;
      }
      const l = t.evenOdd && t.fill ? ' fill-rule="evenodd"' : "";
      return e(`<path d="${no(t.segs)}" ${i}${l}${r}/>`, t.region);
    }
    case "pattern":
      return e(`<path d="${no(t.segs)}" fill="url(#${n(t.tile)})"${t.evenOdd ? ' fill-rule="evenodd"' : ""}/>`, t.region);
    case "bitmap":
      return e(Ya(t.rect, t.img), t.region);
    case "text":
      return e(Za(t.text, s, o), t.text.region);
  }
}
function Ya([t, e, n, s], o) {
  if (n <= 0 || s <= 0) return "";
  if (!Bt(o)) {
    if (o.w < 1 || o.h < 1 || o.px.length !== o.w * o.h * 4) return "";
    const m = `data:image/png;base64,${Ae(ts(o.w, o.h, o.px))}`, f = n / o.w > 3 || s / o.h > 3 ? ' style="image-rendering:pixelated"' : "";
    return `<image href="${m}" x="${j(t)}" y="${j(e)}" width="${j(n)}" height="${j(s)}" preserveAspectRatio="none"${f}/>`;
  }
  const i = `data:${o.mime};base64,${Ae(o.bytes)}`, [r, l, a, u] = o.crop ?? [0, 0, o.w, o.h], c = !!o.flip?.[0], h = !!o.flip?.[1], d = c || h ? ` transform="translate(${j(c ? 2 * r + a : 0)} ${j(h ? 2 * l + u : 0)}) scale(${c ? -1 : 1} ${h ? -1 : 1})"` : "";
  return `<svg x="${j(t)}" y="${j(e)}" width="${j(n)}" height="${j(s)}" viewBox="${j(r)} ${j(l)} ${j(a)} ${j(u)}" preserveAspectRatio="none" overflow="hidden"><g${d}><image href="${i}" width="${o.w}" height="${o.h}" preserveAspectRatio="none"/></g></svg>`;
}
function Ga(t) {
  return /courier|consolas|mono|lucida console|fixedsys|terminal/i.test(t) ? "monospace" : /times|roman|georgia|garamond|cambria|book antiqua|palatino|serif/i.test(t) && !/sans/i.test(t) ? "serif" : "sans-serif";
}
function qa(t) {
  return " ilj.,:;'!|Iftr".includes(t) ? 0.28 : "mwMW".includes(t) ? 0.83 : /[A-Z0-9]/.test(t) ? 0.64 : (t.codePointAt(0) ?? 0) >= 11904 ? 1 : 0.53;
}
function Za(t, e, n) {
  const s = t.font, o = s.family.trim() || "Arial", i = s.height < 0 ? -s.height : s.height > 0 ? s.height / (to + eo) : Xa;
  if (!(i > 0) || !Number.isFinite(i)) return "";
  const r = [...t.text].map((E) => Qa(o, E));
  if (!r.length) return "";
  const l = t.dx.length === r.length && t.dx.length > 0;
  let a, u = null, c = 1;
  if (l) {
    u = [];
    let E = 0;
    for (const $ of t.dx)
      u.push(E), E += $;
    a = E;
  } else
    a = r.reduce((E, $) => E + qa($) * i, 0), s.width > 0 && (c = Math.min(20, Math.max(0.05, s.width / (Ha * i))), a *= c);
  const h = t.hAlign === "left" ? 0 : t.hAlign === "center" ? -a / 2 : -a, d = to * i, m = eo * i, f = t.vAlign === "baseline" ? 0 : t.vAlign === "top" ? d : -m, [p, g, b, x, k, w] = t.transform;
  let M = "";
  t.background && a > 0 && (M += `<rect x="${j(h)}" y="${j(f - d)}" width="${j(a)}" height="${j(d + m)}" fill="${Me(t.background)}"${ve(t.background, "fill-opacity")}/>`);
  const S = [s.underline && "underline", s.strike && "line-through"].filter(Boolean).join(" "), O = [
    `font-family="${pn(`'${o.replace(/'/g, "")}', ${Ga(o)}`)}"`,
    `font-size="${j(i)}"`,
    s.weight >= 600 ? 'font-weight="bold"' : "",
    s.italic ? 'font-style="italic"' : "",
    S ? `text-decoration="${S}"` : "",
    `fill="${Me(t.color)}"${ve(t.color, "fill-opacity")}`,
    'xml:space="preserve"'
  ].filter(Boolean).join(" ");
  if (u) {
    const E = u.map(($) => j(h + $)).join(" ");
    M += `<text x="${E}" y="${j(f)}" ${O}>${pn(r.join(""))}</text>`;
  } else {
    const E = t.hAlign === "center" ? "middle" : t.hAlign === "right" ? "end" : "start", $ = `<text x="0" y="${j(f)}" text-anchor="${E}" ${O}>${pn(r.join(""))}</text>`;
    M += c !== 1 ? `<g transform="scale(${j(c)} 1)">${$}</g>` : $;
  }
  let T = `<g transform="matrix(${[p, g, b, x, k, w].map(j).join(" ")})">${M}</g>`;
  if (t.clip) {
    const E = e("c"), [$, R, I, L] = t.clip;
    n.push(`<clipPath id="${E}"><rect x="${j($)}" y="${j(R)}" width="${j(I - $)}" height="${j(L - R)}"/></clipPath>`), T = `<g clip-path="url(#${E})">${T}</g>`;
  }
  return T;
}
const Ka = (() => {
  const t = {
    34: 8704,
    36: 8707,
    39: 8715,
    42: 8727,
    45: 8722,
    64: 8773,
    92: 8756,
    94: 8869,
    126: 8764,
    161: 978,
    162: 8242,
    163: 8804,
    164: 8260,
    165: 8734,
    166: 402,
    167: 9827,
    168: 9830,
    169: 9829,
    170: 9824,
    171: 8596,
    172: 8592,
    173: 8593,
    174: 8594,
    175: 8595,
    176: 176,
    177: 177,
    178: 8243,
    179: 8805,
    180: 215,
    181: 8733,
    182: 8706,
    183: 8226,
    184: 247,
    185: 8800,
    186: 8801,
    187: 8776,
    188: 8230,
    192: 8501,
    193: 8465,
    194: 8476,
    195: 8472,
    196: 8855,
    197: 8853,
    198: 8709,
    199: 8745,
    200: 8746,
    201: 8835,
    202: 8839,
    203: 8836,
    204: 8834,
    205: 8838,
    206: 8712,
    207: 8713,
    208: 8736,
    209: 8711,
    210: 174,
    211: 169,
    212: 8482,
    213: 8719,
    214: 8730,
    215: 8901,
    216: 172,
    217: 8743,
    218: 8744,
    219: 8660,
    220: 8656,
    221: 8657,
    222: 8658,
    223: 8659,
    224: 9674,
    225: 9001,
    229: 8721,
    241: 9002,
    242: 8747
  }, e = [913, 914, 935, 916, 917, 934, 915, 919, 921, 977, 922, 923, 924, 925, 927, 928, 920, 929, 931, 932, 933, 962, 937, 926, 936, 918], n = [945, 946, 967, 948, 949, 966, 947, 951, 953, 981, 954, 955, 956, 957, 959, 960, 952, 961, 963, 964, 965, 982, 969, 958, 968, 950];
  return e.forEach((s, o) => {
    t[65 + o] = s;
  }), n.forEach((s, o) => {
    t[97 + o] = s;
  }), t;
})(), Ja = {
  108: 9679,
  110: 9632,
  111: 9633,
  113: 10065,
  117: 9670,
  118: 10070,
  119: 11045,
  159: 8226,
  167: 9642,
  168: 9723,
  216: 10146,
  224: 8592,
  232: 8594,
  233: 8593,
  234: 8595,
  240: 8680,
  251: 10007,
  252: 10004,
  253: 9746,
  254: 9745,
  74: 9786,
  76: 9785,
  78: 9760,
  82: 9788,
  84: 10052,
  88: 10016,
  91: 9775,
  171: 9733,
  161: 9675,
  164: 9673
};
function Qa(t, e) {
  const n = t.toLowerCase();
  let s = e.codePointAt(0) ?? 0;
  const o = s >= 61440 && s <= 61695;
  if (o && (s -= 61440), n === "symbol") {
    const i = Ka[s];
    return i ? String.fromCodePoint(i) : o ? String.fromCodePoint(s) : e;
  }
  return n.startsWith("wingdings") || n.startsWith("webdings") ? s <= 32 ? " " : String.fromCodePoint(n === "wingdings" && Ja[s] || 8226) : o ? String.fromCodePoint(s) : e;
}
function ni(t, e = 0) {
  const n = new Qt(t);
  let s;
  if (Zo(n)) s = Ko(n, e);
  else if ($a(n)) s = Oa(n);
  else throw new Jt("NotMetafile");
  return ec(s.cv.items, s.frame);
}
Zl(ni);
function tc(t) {
  let e;
  try {
    e = ni(t);
  } catch {
    return null;
  }
  if (!e.items.length || !(e.width > 0) || !(e.height > 0)) return null;
  const n = Math.max(1, Math.round(e.width * 96 / 72)), s = Math.max(1, Math.round(e.height * 96 / 72)), o = Wa(e, { width: n, height: s });
  return { url: `data:image/svg+xml;base64,${Ae(new TextEncoder().encode(o))}`, w: n, h: s, svg: o };
}
const Mt = (t) => Number.isFinite(t);
function ec(t, e) {
  const n = e && e.rect.every(Mt) && e.rect[2] > 0 && e.rect[3] > 0 ? e : null;
  let s, o;
  if (n)
    s = n.rect, o = n.size ?? [n.rect[2], n.rect[3]];
  else {
    const d = nc(t);
    if (!d) return { width: 0, height: 0, items: [] };
    const [m, f, p, g] = d;
    s = [m, f, p - m, g - f], o = [p - m, g - f];
  }
  const i = s[2] > 0 ? o[0] / s[2] : 1, r = s[3] > 0 ? o[1] / s[3] : 1, l = (d) => [(d[0] - s[0]) * i, (d[1] - s[1]) * r], a = (i + r) / 2, u = Math.hypot(o[0], o[1]), c = /* @__PURE__ */ new Map(), h = [];
  for (const d of t)
    if (d.kind === "path") {
      const m = so(d.ops, l);
      if (!m || m.length < 2) continue;
      let f = null;
      if (d.stroke) {
        const g = Math.min(d.stroke[1] * a, u);
        if (!Mt(g)) continue;
        f = [d.stroke[0], g];
      }
      const p = De(d.region, l);
      if (p === void 0) continue;
      h.push({ kind: "path", segs: m, fill: d.fill, stroke: f, evenOdd: d.evenOdd, region: p });
    } else if (d.kind === "bitmap") {
      const [m, f] = l([d.rect[0], d.rect[1]]), p = [m, f, d.rect[2] * i, d.rect[3] * r], g = De(d.region, l);
      if (!p.every(Mt) || g === void 0) continue;
      h.push({ kind: "bitmap", rect: p, img: d.img, region: g });
    } else if (d.kind === "pattern") {
      const m = so(d.ops, l);
      if (!m || m.length < 2) continue;
      let f = c.get(d.tile);
      if (!f) {
        const [g, b] = l([0, 0]);
        if (f = { width: d.tile.w, height: d.tile.h, rgba: d.tile.px, cell: [d.tile.cell * i, d.tile.cell * r], origin: [g, b] }, ![...f.cell, ...f.origin].every(Mt)) continue;
        c.set(d.tile, f);
      }
      const p = De(d.region, l);
      if (p === void 0) continue;
      h.push({ kind: "pattern", segs: m, evenOdd: d.evenOdd, tile: f, region: p });
    } else {
      const m = { ...d.text }, [f, p, g, b, x, k] = m.transform, [w, M] = l([x, k]);
      if (m.transform = [f * i, p * r, g * i, b * r, w, M], !m.transform.every(Mt)) continue;
      if (m.clip) {
        const [O, T, E, $] = m.clip, R = l([O, T]), I = l([E, $]);
        if (m.clip = [Math.min(R[0], I[0]), Math.min(R[1], I[1]), Math.max(R[0], I[0]), Math.max(R[1], I[1])], !m.clip.every(Mt)) continue;
      }
      const S = De(d.region, l);
      if (S === void 0) continue;
      m.region = S, h.push({ kind: "text", text: m });
    }
  return { width: Mt(o[0]) ? o[0] : 0, height: Mt(o[1]) ? o[1] : 0, items: h };
}
function De(t, e) {
  if (!t) return null;
  const n = [];
  for (const [s, o, i, r] of t) {
    const l = e([s, o]), a = e([i, r]), u = [Math.min(l[0], a[0]), Math.min(l[1], a[1]), Math.max(l[0], a[0]), Math.max(l[1], a[1])];
    if (!u.every(Mt)) return;
    n.push(u);
  }
  return n;
}
function so(t, e) {
  const n = [];
  for (const s of t) {
    if (s.k === "Z") {
      n.push({ k: "Z" });
      continue;
    }
    if (s.k === "C") {
      const i = e(s.a), r = e(s.b), l = e(s.p);
      if (![...i, ...r, ...l].every(Mt)) return null;
      n.push({ k: "C", x1: i[0], y1: i[1], x2: r[0], y2: r[1], x: l[0], y: l[1] });
      continue;
    }
    const o = e(s.p);
    if (!o.every(Mt)) return null;
    n.push({ k: s.k, x: o[0], y: o[1] });
  }
  return n;
}
function nc(t) {
  let e = null;
  const n = (s) => {
    !Mt(s[0]) || !Mt(s[1]) || (e = e ? [Math.min(e[0], s[0]), Math.min(e[1], s[1]), Math.max(e[2], s[0]), Math.max(e[3], s[1])] : [s[0], s[1], s[0], s[1]]);
  };
  for (const s of t)
    if (s.kind === "path" || s.kind === "pattern")
      for (const o of s.ops)
        o.k === "M" || o.k === "L" ? n(o.p) : o.k === "C" && (n(o.a), n(o.b), n(o.p));
    else s.kind === "bitmap" ? (n([s.rect[0], s.rect[1]]), n([s.rect[0] + s.rect[2], s.rect[1] + s.rect[3]])) : n([s.text.transform[4], s.text.transform[5]]);
  return e;
}
const oo = 4e7, ut = {
  width: 256,
  height: 257,
  bits: 258,
  compression: 259,
  photometric: 262,
  stripOffsets: 273,
  samples: 277,
  rowsPerStrip: 278,
  stripBytes: 279,
  planar: 284,
  predictor: 317,
  colorMap: 320,
  tileW: 322,
  tileH: 323,
  tileOffsets: 324,
  tileBytes: 325,
  extra: 338,
  sampleFormat: 339
};
function sc(t) {
  return t.length >= 8 && (t[0] === 73 && t[1] === 73 && t[2] === 42 && t[3] === 0 || t[0] === 77 && t[1] === 77 && t[2] === 0 && t[3] === 42);
}
function oc(t) {
  try {
    return rc(t);
  } catch {
    return null;
  }
}
function ic(t) {
  const e = oc(t);
  return e ? { url: `data:image/png;base64,${Ae(ts(e.w, e.h, e.rgba))}`, w: e.w, h: e.h } : null;
}
function rc(t) {
  if (!sc(t)) return null;
  const e = t[0] === 73, n = new DataView(t.buffer, t.byteOffset, t.byteLength), s = (z, _) => {
    if (z < 0 || z + _ > t.length) throw new RangeError("short");
  }, o = (z) => (s(z, 2), n.getUint16(z, e)), i = (z) => (s(z, 4), n.getUint32(z, e)), r = i(4), l = o(r), a = /* @__PURE__ */ new Map(), u = { 1: 1, 2: 1, 3: 2, 4: 4, 6: 1, 7: 1, 8: 2, 9: 4, 16: 8 };
  for (let z = 0; z < l; z++) {
    const _ = r + 2 + z * 12, Q = o(_), V = o(_ + 2), W = i(_ + 4), X = u[V];
    if (!X || W > 1 << 24) continue;
    const rt = X * W, ft = rt <= 4 ? _ + 8 : i(_ + 8);
    s(ft, rt);
    const tt = new Array(W);
    for (let A = 0; A < W; A++) {
      const H = ft + A * X;
      tt[A] = X === 1 ? t[H] : X === 2 ? n.getUint16(H, e) : X === 4 ? n.getUint32(H, e) : Number(n.getBigUint64(H, e));
    }
    a.set(Q, tt);
  }
  const c = (z, _) => a.get(z)?.[0] ?? _, h = c(ut.width) ?? 0, d = c(ut.height) ?? 0;
  if (!h || !d || h * d > oo) return null;
  const m = c(ut.samples, 1), f = a.get(ut.bits) ?? [1], p = f[0];
  if (f.some((z) => z !== p)) return null;
  const g = c(ut.compression, 1), b = c(ut.photometric), x = c(ut.predictor, 1);
  if ((c(ut.planar, 1) ?? 1) !== 1 && m > 1 || (a.get(ut.sampleFormat) ?? [1]).some((z) => z !== 1) || ![1, 5, 8, 32946, 32773].includes(g) || x !== 1 && x !== 2 || b === void 0) return null;
  const k = a.get(ut.extra) ?? [];
  let w, M;
  if (b === 0 || b === 1)
    w = "grey", M = 1;
  else if (b === 2)
    w = "rgb", M = 3;
  else if (b === 3)
    w = "palette", M = 1;
  else if (b === 5 && m >= 4)
    w = "cmyk", M = 4;
  else return null;
  if (m < M || (w === "palette" ? !(p >= 1 && p <= 8) : w === "grey" ? ![1, 2, 4, 8, 16].includes(p) : p !== 8 && p !== 16) || w === "cmyk" && p !== 8) return null;
  const S = m > M ? k[0] ?? 0 : 0, O = S === 1 || S === 2;
  let T = null;
  if (w === "palette" && (T = a.get(ut.colorMap) ?? null, !T || T.length < 3 * (1 << p)))
    return null;
  const E = a.has(ut.tileOffsets), $ = E ? c(ut.tileW, 0) : h, R = E ? c(ut.tileH, 0) : Math.min(d, c(ut.rowsPerStrip, d) || d);
  if (!$ || !R || $ * R > oo) return null;
  const I = a.get(E ? ut.tileOffsets : ut.stripOffsets), L = a.get(E ? ut.tileBytes : ut.stripBytes);
  if (!I) return null;
  const B = Math.ceil(h / $), D = Math.ceil(d / R);
  if (I.length < B * D) return null;
  const C = Math.ceil($ * m * p / 8), P = new Uint8Array(h * d * 4), F = p === 16 ? 2 : 1;
  for (let z = 0; z < D; z++)
    for (let _ = 0; _ < B; _++) {
      const Q = z * B + _, V = I[Q], W = L?.[Q] ?? t.length - V;
      if (V >= t.length) continue;
      const X = t.subarray(V, Math.min(t.length, V + W)), rt = E ? R : Math.min(R, d - z * R), ft = C * rt, tt = cc(X, g, ft);
      if (!tt) return null;
      x === 2 && ac(tt, rt, C, m, p, e);
      const A = _ * $, H = z * R;
      for (let K = 0; K < rt; K++) {
        const kt = H + K;
        if (kt >= d) break;
        const gt = K * C;
        if (gt >= tt.length) break;
        for (let Y = 0; Y < $; Y++) {
          const Z = A + Y;
          if (Z >= h) break;
          const bt = Y * m, dt = (et) => lc(tt, gt, bt + et, p, e), st = (kt * h + Z) * 4;
          if (w === "grey") {
            const et = p === 16 ? 65535 : (1 << p) - 1;
            let ot = Math.round(dt(0) / et * 255);
            b === 0 && (ot = 255 - ot), P[st] = P[st + 1] = P[st + 2] = ot;
          } else if (w === "palette") {
            const et = dt(0), ot = 1 << p;
            P[st] = T[et] >> 8, P[st + 1] = T[ot + et] >> 8, P[st + 2] = T[2 * ot + et] >> 8;
          } else if (w === "rgb") {
            const et = F === 2 ? (ot) => dt(ot) >> 8 : dt;
            P[st] = et(0), P[st + 1] = et(1), P[st + 2] = et(2);
          } else {
            const et = dt(3);
            P[st] = (255 - dt(0)) * (255 - et) / 255 | 0, P[st + 1] = (255 - dt(1)) * (255 - et) / 255 | 0, P[st + 2] = (255 - dt(2)) * (255 - et) / 255 | 0;
          }
          if (O) {
            const et = p === 16 ? dt(M) >> 8 : p === 8 ? dt(M) : Math.round(dt(M) / ((1 << p) - 1) * 255);
            if (P[st + 3] = et, S === 1 && et > 0 && et < 255)
              for (let ot = 0; ot < 3; ot++) P[st + ot] = Math.min(255, Math.round(P[st + ot] * 255 / et));
          } else P[st + 3] = 255;
        }
      }
    }
  return { w: h, h: d, rgba: P };
}
function lc(t, e, n, s, o) {
  if (s === 8) return t[e + n] ?? 0;
  if (s === 16) {
    const l = e + n * 2, a = t[l] ?? 0, u = t[l + 1] ?? 0;
    return o ? a | u << 8 : a << 8 | u;
  }
  const i = n * s;
  return (t[e + (i >> 3)] ?? 0) >> 8 - s - (i & 7) & (1 << s) - 1;
}
function ac(t, e, n, s, o, i) {
  if (o === 8)
    for (let r = 0; r < e; r++) {
      const l = r * n, a = Math.min(t.length, l + n);
      for (let u = l + s; u < a; u++) t[u] = t[u] + t[u - s] & 255;
    }
  else if (o === 16) {
    const r = new DataView(t.buffer, t.byteOffset, t.byteLength);
    for (let l = 0; l < e; l++) {
      const a = l * n, u = Math.min(t.length - 1, a + n - 1);
      for (let c = a + s * 2; c < u; c += 2) r.setUint16(c, r.getUint16(c, i) + r.getUint16(c - s * 2, i) & 65535, i);
    }
  }
}
function cc(t, e, n) {
  let s;
  switch (e) {
    case 1:
      s = t;
      break;
    case 32773:
      s = uc(t, n);
      break;
    case 5:
      s = hc(t, n);
      break;
    case 8:
    case 32946: {
      try {
        s = ai(t);
      } catch {
        try {
          s = ci(t);
        } catch {
          return null;
        }
      }
      break;
    }
    default:
      return null;
  }
  if (s.length >= n) return s.length === n ? s === t ? s.slice() : s : s.slice(0, n);
  const o = new Uint8Array(n);
  return o.set(s), o;
}
function uc(t, e) {
  const n = new Uint8Array(e);
  let s = 0, o = 0;
  for (; s < t.length && o < e; ) {
    const i = t[s++] << 24 >> 24;
    if (i >= 0) {
      const r = Math.min(o + i + 1, e);
      for (; o < r && s < t.length; ) n[o++] = t[s++];
      if (o === e) break;
    } else if (i !== -128) {
      if (s >= t.length) break;
      const r = t[s++], l = Math.min(o + 1 - i, e);
      for (; o < l; ) n[o++] = r;
    }
  }
  return n.subarray(0, o);
}
function hc(t, e) {
  const n = new Uint8Array(e), s = new Int32Array(4096), o = new Uint8Array(4096), i = new Int32Array(4096);
  for (let f = 0; f < 256; f++)
    s[f] = -1, o[f] = f, i[f] = 1;
  let r = 258, l = 9, a = 0, u = -1, c = 0;
  const h = t.length * 8, d = () => {
    if (c + l > h) return 257;
    let f = 0;
    for (let p = 0; p < l; p++) {
      const g = c + p;
      f = f << 1 | t[g >> 3] >> 7 - (g & 7) & 1;
    }
    return c += l, f;
  }, m = (f) => {
    const p = i[f];
    let g = a + p, b = f;
    const x = (() => {
      let k = f;
      for (; s[k] >= 0; ) k = s[k];
      return o[k];
    })();
    if (g > e) {
      let k = g - e;
      for (g = e; k-- > 0; ) b = s[b];
    }
    for (let k = g - 1; k >= a && b >= 0; k--)
      n[k] = o[b], b = s[b];
    return a = g, x;
  };
  for (; a < e; ) {
    const f = d();
    if (f === 257) break;
    if (f === 256) {
      r = 258, l = 9, u = -1;
      continue;
    }
    if (u < 0) {
      if (f > 255) break;
      m(f), u = f;
      continue;
    }
    let p;
    if (f < r)
      p = m(f);
    else if (f === r) {
      let g = u;
      for (; s[g] >= 0; ) g = s[g];
      p = o[g], r < 4096 && (s[r] = u, o[r] = p, i[r] = i[u] + 1), m(r), r++, u = f, r + 1 >= 1 << l && l < 12 && l++;
      continue;
    } else break;
    r < 4096 && (s[r] = u, o[r] = p, i[r] = i[u] + 1, r++), u = f, r + 1 >= 1 << l && l < 12 && l++;
  }
  return n.subarray(0, a);
}
const fc = 80, dc = "default-layer", lt = (t) => {
  if (!t) return "transparent";
  if (t.alpha === void 0 || t.alpha >= 0.999) return t.hex;
  const e = t.hex.replace("#", "");
  return `rgba(${parseInt(e.slice(0, 2), 16)}, ${parseInt(e.slice(2, 4), 16)}, ${parseInt(e.slice(4, 6), 16)}, ${+t.alpha.toFixed(3)})`;
}, pc = /(times|georgia|garamond|cambria|book|serif|palatino|baskerville|merriweather)/i, mc = /(courier|consolas|mono|menlo|code)/i;
function $n(t) {
  if (!t) return "sans-serif";
  const e = Mi(t);
  return e || (mc.test(t) ? "monospace" : pc.test(t) ? "serif" : "sans-serif");
}
function gc(t) {
  const e = [];
  let n = [], s = !1;
  const o = () => {
    if (n.length >= 2) {
      const i = n[0], r = n[n.length - 1];
      s && Math.hypot(i.x - r.x, i.y - r.y) < 1e-6 && (i.inX = r.inX, i.inY = r.inY, n.pop()), e.push({ anchors: n, closed: s });
    }
    n = [], s = !1;
  };
  for (const i of t)
    if (i.op === "M")
      o(), n.push({ x: i.x, y: i.y, kind: "corner" });
    else if (i.op === "L")
      n.length ? n.push({ x: i.x, y: i.y, kind: "corner" }) : n.push({ x: i.x, y: i.y, kind: "corner" });
    else if (i.op === "C") {
      const r = n[n.length - 1];
      if (!r) {
        n.push({ x: i.x, y: i.y, kind: "corner" });
        continue;
      }
      r.outX = i.x1 - r.x, r.outY = i.y1 - r.y, n.push({ x: i.x, y: i.y, inX: i.x2 - i.x, inY: i.y2 - i.y, kind: "smooth" });
    } else i.op === "Z" && (s = !0, o());
  return o(), e;
}
const bc = (t, e, n) => t.map((s) => s.op === "Z" ? s : s.op === "C" ? { ...s, x1: s.x1 + e, y1: s.y1 + n, x2: s.x2 + e, y2: s.y2 + n, x: s.x + e, y: s.y + n } : { ...s, x: s.x + e, y: s.y + n });
function xc(t, e, n) {
  let s = !1;
  t.forEach((o, i) => {
    o.start === "click" && (s = !0);
    const r = e.itemEls?.get(o.target);
    if (!r?.length) {
      e.warnings.push("An animation on a shape that wasn't imported was skipped.");
      return;
    }
    r.forEach((l, a) => {
      const u = hi(a === 0 ? o : { ...o, start: "with", delayMs: o.delayMs }, n("anim"), !s);
      u.order = i + a / (r.length + 1), (l.animations ??= []).push(u);
    });
  });
}
function yc(t, e) {
  if (!t) return null;
  if (t.kind === "url") return t.url;
  if (t.kind === "action") return ki(t.action);
  const n = e.slideIds?.get(t.key);
  return n ? wi(n) : null;
}
async function kc(t) {
  if (!(typeof document > "u"))
    try {
      const e = new Image();
      e.src = t, await e.decode();
      const n = document.createElement("canvas");
      n.width = Math.max(1, Math.min(8192, e.naturalWidth)), n.height = Math.max(1, Math.min(8192, e.naturalHeight));
      const s = n.getContext("2d");
      return s ? (s.filter = "grayscale(1)", s.drawImage(e, 0, 0, n.width, n.height), n.toDataURL(/^data:image\/jpeg/.test(t) ? "image/jpeg" : "image/png", 0.92)) : void 0;
    } catch {
      return;
    }
}
async function wc(t, e) {
  const n = /* @__PURE__ */ new Set(), s = (i) => {
    for (const r of i)
      if (r.kind === "group") s(r.children);
      else if (r.kind === "picture" && r.grayscale) {
        const l = e.get(r.media)?.url;
        l && n.add(l);
      } else if (r.kind === "shape" && r.fill.kind === "image" && r.fill.grayscale) {
        const l = e.get(r.fill.media)?.url;
        l && n.add(l);
      }
  };
  t.slides.forEach((i) => s(i.items));
  const o = /* @__PURE__ */ new Map();
  return await Promise.all([...n].map(async (i) => {
    const r = await kc(i);
    r && o.set(i, r);
  })), o;
}
async function Mc(t, e, n, s) {
  if (!(typeof document > "u"))
    try {
      const o = new Image();
      o.src = t, await o.decode();
      const i = document.createElement("canvas");
      i.width = Math.max(1, Math.min(4096, Math.round(e))), i.height = Math.max(1, Math.min(4096, Math.round(n)));
      const r = i.getContext("2d");
      if (!r) return;
      if (s) {
        const l = r.createPattern(o, "repeat");
        if (!l) return;
        l.setTransform(new DOMMatrix().scale(s.sx, s.sy)), r.fillStyle = l, r.fillRect(0, 0, i.width, i.height);
      } else {
        if (Math.abs(o.naturalWidth / o.naturalHeight - e / n) < 0.01) return;
        r.drawImage(o, 0, 0, i.width, i.height);
      }
      return i.toDataURL(s ? "image/png" : "image/jpeg", 0.92);
    } catch {
      return;
    }
}
function zt(t, e, n, s) {
  return {
    id: t.nextId(e),
    type: e,
    x: n.x + t.ox,
    y: n.y + t.oy,
    width: Math.max(n.w, 1),
    height: Math.max(n.h, 1),
    angle: n.rot ? n.rot * Math.PI / 180 : 0,
    flipX: n.flipH || void 0,
    flipY: n.flipV || void 0,
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
    layerId: dc,
    groupIds: [...s].reverse(),
    // innermost first, the store's convention
    name: n.name
  };
}
function io(t, e, n) {
  switch (e.kind) {
    case "none":
      t.backgroundColor = "transparent";
      break;
    case "solid":
      t.backgroundColor = lt(e.color), t.fillStyle = "solid";
      break;
    case "linear":
    case "radial":
      t.fillStyle = e.kind, t.backgroundColor = lt(e.stops[0]?.color), t.gradientStops = e.stops.map((s) => ({ offset: s.pos, color: lt(s.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
      break;
    case "pattern": {
      t.backgroundColor = lt(e.color), t.fillStyle = "pattern", t.patternFill = Bc(e.preset, lt(e.color), e.bg ? lt(e.bg) : "transparent");
      break;
    }
    case "image": {
      const s = n.images.get(e.media);
      s && (t.fillStyle = "image", t.backgroundImage = e.grayscale && n.gray.get(s.url) || s.url, t.backgroundColor = "#ffffff"), s && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
      break;
    }
  }
}
function On(t, e) {
  if (!e || !(e.width > 0)) {
    t.strokeColor = "transparent", t.strokeWidth = 0;
    return;
  }
  t.strokeColor = lt(e.color), t.strokeWidth = Math.max(0.5, e.width), t.strokeStyle = e.dash === "sysDot" ? "dotted" : e.dash ? "dashed" : "solid", (e.join === "miter" || e.join === "bevel") && (t.strokeLineJoin = e.join), e.cap === "flat" ? t.strokeLineCap = "butt" : e.cap === "sq" && (t.strokeLineCap = "square");
}
function vc(t) {
  const e = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/.exec(t ?? "");
  if (!e) return {};
  const n = { alphaLc: "lower-alpha", alphaUc: "upper-alpha", romanLc: "lower-roman", romanUc: "upper-roman", arabic: void 0 }[e[1]], s = { ParenBoth: "parens", ParenR: "paren", Plain: "none", Period: void 0 }[e[2]], o = {};
  return n && (o.listNumberStyle = n), s && (o.listNumberSuffix = s), o;
}
function Sc(t, e) {
  const n = t.bullet === "num" ? vc(t.numType) : t.bulletChar ? { listMarker: t.bulletChar } : {}, s = t.runs.find((o) => !o.br)?.color ?? e.defaults?.color;
  return t.bulletColor && lt(t.bulletColor) !== lt(s) && (n.listMarkerColor = lt(t.bulletColor)), t.bulletScale && (n.listMarkerScale = Math.round(t.bulletScale * 100) / 100), t.marL !== void 0 && (n.listIndent = Math.max(0, Math.round(t.marL * 10) / 10), n.listMarkerIndent = Math.max(0, Math.round((t.marL + (t.indent ?? 0)) * 10) / 10)), n;
}
const mn = (t, e) => Math.round(((t.paragraphs[e - 1]?.spaceAfter ?? 0) + (t.paragraphs[e]?.spaceBefore ?? 0)) * 100) / 100;
function si(t, e) {
  const n = t.paragraphs.flatMap((p) => p.runs.filter((g) => !g.br)), s = n[0], o = s?.size ?? 24, i = /* @__PURE__ */ new Map(), r = (p) => p.runs.reduce((g, b) => g + (b.br ? 0 : b.text.trim().length), 0);
  for (const p of t.paragraphs) {
    const g = r(p);
    g && i.set(p.align ?? "l", (i.get(p.align ?? "l") ?? 0) + g);
  }
  const l = [...i].sort((p, g) => g[1] - p[1])[0]?.[0] ?? t.paragraphs.find((p) => p.runs.length)?.align ?? "l", a = (p) => r(p) > 0 && (p.align ?? "l") !== l ? p.align === "ctr" ? "center" : p.align === "r" ? "right" : "left" : void 0, u = n.every((p) => p.size === s?.size && p.bold === s?.bold && p.italic === s?.italic && p.underline === s?.underline && p.strike === s?.strike && p.font === s?.font && lt(p.color) === lt(s?.color)) && !t.paragraphs.some((p) => p.bullet) && !t.paragraphs.some((p, g) => g > 0 && mn(t, g) > 0) && !t.paragraphs.some(a), c = {
    fontSize: Math.round(o * 10) / 10,
    fontFamily: $n(s?.font),
    textAlign: l === "ctr" ? "center" : l === "r" ? "right" : "left",
    verticalAlign: t.anchor === "ctr" ? "middle" : t.anchor === "b" ? "bottom" : "top",
    textColor: lt(s?.color ?? { hex: "#000000" })
  };
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 0.01 && (c.lineHeight = Math.max(0.5, Math.min(4, t.lineSpacing * 1.2))), t.shrink !== void 0 && t.wrap && (c.textFit = "shrink");
  const h = t.paragraphs.map((p) => p.runs.map((g) => g.br ? `
` : g.text).join("")).join(`
`);
  if (u)
    return s?.bold && (c.fontWeight = 700), s?.italic && (c.fontStyle = "italic"), e ? c.containerText = h : c.text = h, { fields: c, rich: !1 };
  const d = [], m = [], f = [];
  return t.paragraphs.forEach((p, g) => {
    const b = p.level ?? 0;
    if (p.bullet === "num") {
      const w = p.numType ?? "arabicPeriod";
      (m[b] === void 0 || f[b] !== w) && (m[b] = (p.startAt ?? 1) - 1), m[b]++, f[b] = w, m.length = b + 1, f.length = b + 1;
    } else
      m.length = Math.min(m.length, b), f.length = m.length;
    const x = p.bullet ? { listType: p.bullet === "num" ? "ordered" : "bullet", listLevel: b, ...Sc(p, t) } : {};
    p.bullet === "num" && (x.listIndex = m[b]), (p.runs.length ? p.runs : [{ text: "" }]).forEach((w, M) => {
      const S = { text: w.br ? `
` : w.text, ...M === 0 ? x : {} };
      M === 0 && g > 0 && mn(t, g) > 0 && (S.paragraphSpaceBefore = mn(t, g));
      const O = a(p);
      O && (S.paragraphAlign = O), w.bold && (S.bold = !0), w.italic && (S.italic = !0), w.underline && (S.underline = !0), w.strike && (S.strikethrough = !0), w.color && (S.color = lt(w.color)), w.size && (S.fontSize = Math.round(w.size * 10) / 10), w.font && (S.fontFamily = $n(w.font)), d.push(S);
    }), g < t.paragraphs.length - 1 && d.push({ text: `
` });
  }), e ? (c.richContainerText = d, c.containerText = h) : (c.richText = d, c.text = h), { fields: c, rich: !0 };
}
function Le(t, e, n, s, o) {
  const { fields: i, rich: r } = si(e, !1), l = 4, a = zt(t, r ? "richtext" : "text", {
    ...n,
    x: n.x + e.insets.l - l,
    y: n.y + e.insets.t - l,
    w: Math.max(n.w - e.insets.l - e.insets.r + l * 2, 8),
    h: Math.max(n.h - e.insets.t - e.insets.b + l * 2, 8)
  }, s);
  return Object.assign(a, i, { autoResize: !e.wrap, strokeColor: i.textColor }), a;
}
const oi = /* @__PURE__ */ new Set(["line", "straightConnector1"]);
function es(t, e, n) {
  if (t.text?.vert) {
    const h = t.fill.kind !== "none" || !!t.line, d = h ? e.nextId("group") : null, m = d ? [...n, d] : n, f = h ? es({ ...t, text: void 0 }, e, m) : [], p = t.text, g = p.insets, b = p.vert === "vert" ? 90 : p.vert === "vert270" ? 270 : 0, x = t.x + t.w / 2, k = t.y + t.h / 2, w = p.vert === "vert" ? { l: g.t, r: g.b, t: g.r, b: g.l } : p.vert === "vert270" ? { l: g.b, r: g.t, t: g.l, b: g.r } : g, M = b ? { name: t.name, x: x - t.h / 2, y: k - t.w / 2, w: t.h, h: t.w, rot: (t.rot ?? 0) + b } : { name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot }, S = Le(e, { ...p, insets: w }, M, m);
    return p.vert === "stacked" && (S.verticalText = !0), e.stats.elements++, [...f, S];
  }
  const s = t.geom;
  if (t.text && t.fill.kind === "none" && !t.line && (t.textBox || s.kind === "preset" && s.prst === "rect"))
    return e.stats.elements++, [Le(e, t.text, t, n)];
  if (s.kind === "preset" && oi.has(s.prst)) return Tn({ ...t, kind: "connector", line: t.line ?? { width: 1, color: { hex: "#000000" } } }, e, n);
  if (s.kind === "custom" && t.line && (t.line.head || t.line.tail) && !t.text && s.paths.every((h) => !h.cmds.some((d) => d.op === "Z")))
    return Tn({ ...t, kind: "connector", line: t.line }, e, n);
  const o = Pc(t);
  if (o) {
    const h = zt(e, o.type, t, n);
    Object.assign(h, o.extra), io(h, t.fill, e), On(h, t.line), e.byPptId.set(t.id, { el: h, item: t }), e.stats.elements++;
    const d = t.textRect ?? { l: 0, t: 0, r: t.w, b: t.h }, m = t.text?.insets, f = Math.abs(d.l) > 0.5 || Math.abs(d.t) > 0.5 || Math.abs(d.r - t.w) > 0.5 || Math.abs(d.b - t.h) > 0.5, p = !!m && Math.max(m.l, m.r, m.t, m.b) > 16;
    if (t.text && (f || p)) {
      const g = e.nextId("group");
      return h.groupIds = [...n, g].reverse(), e.stats.elements++, [h, Le(e, t.text, { ...t, rot: 0, x: t.x + d.l, y: t.y + d.t, w: d.r - d.l, h: d.b - d.t }, [...n, g])];
    }
    if (t.text) {
      const { fields: g } = si(t.text, !0);
      Object.assign(h, g);
    }
    return [h];
  }
  const i = s.kind === "custom" ? s.paths : (() => {
    const h = e.presets[s.prst];
    if (!h)
      return e.warnings.push(`Unknown shape "${s.prst}" was imported as a rectangle.`), Ue(e.presets.rect, t.w, t.h);
    const d = Object.fromEntries(Object.entries(s.adj ?? {}).map(([m, f]) => [m, `val ${f}`]));
    return Ue(h, t.w, t.h, d);
  })(), r = [], l = (t.text || i.some((h) => h.fill === !1)) && i.some((h) => h.fill !== !1) ? e.nextId("group") : null, a = l ? [...n, l] : n, u = /* @__PURE__ */ new Map();
  for (const h of i) {
    const d = `${h.fill === !1 ? "nofill" : "fill"}|${h.stroke === !1 ? "nostroke" : "stroke"}`;
    u.has(d) || u.set(d, []), u.get(d).push(h);
  }
  let c = null;
  for (const [h, d] of u) {
    const m = d.flatMap((x) => x.cmds), f = Ci(m);
    if (!f) continue;
    const p = gc(bc(m, -f.minX, -f.minY));
    if (!p.length) continue;
    const g = zt(e, "path", { ...t, x: t.x + f.minX, y: t.y + f.minY, w: Math.max(f.maxX - f.minX, 1), h: Math.max(f.maxY - f.minY, 1) }, a);
    !(Math.abs(f.minX + f.maxX - t.w) < 0.5 && Math.abs(f.minY + f.maxY - t.h) < 0.5) && (t.rot || t.flipH || t.flipV) && Cc(g, p, t, f), g.pathSubpaths = p, g.pathAnchors = p[0].anchors, g.pathClosed = p[0].closed, h.startsWith("fill") ? io(g, t.fill, e) : g.backgroundColor = "transparent", h.endsWith("|stroke") ? On(g, t.line) : (g.strokeColor = "transparent", g.strokeWidth = 0), r.push(g), c ??= g, e.stats.paths++;
  }
  if (c && e.byPptId.set(t.id, { el: c, item: t }), t.text) {
    const h = t.textRect ?? (s.kind === "preset" && e.presets[s.prst] ? po(e.presets[s.prst], t.w, t.h) : { l: 0, t: 0, r: t.w, b: t.h });
    r.push(Le(e, t.text, { ...t, x: t.x + h.l, y: t.y + h.t, w: h.r - h.l, h: h.b - h.t }, a));
  }
  return e.stats.elements += r.length, r;
}
function Cc(t, e, n, s) {
  const o = n.w / 2, i = n.h / 2, r = (n.rot || 0) * Math.PI / 180, l = Math.cos(r), a = Math.sin(r), u = n.flipH ? -1 : 1, c = n.flipV ? -1 : 1, h = (b, x) => {
    const k = (b + s.minX - o) * u, w = (x + s.minY - i) * c;
    return { x: o + k * l - w * a, y: i + k * a + w * l };
  }, d = (b, x) => {
    const k = b * u, w = x * c;
    return { x: k * l - w * a, y: k * a + w * l };
  };
  let m = 1 / 0, f = 1 / 0, p = -1 / 0, g = -1 / 0;
  for (const b of e) for (const x of b.anchors) {
    const k = h(x.x, x.y);
    if (x.x = k.x, x.y = k.y, x.inX !== void 0) {
      const w = d(x.inX, x.inY ?? 0);
      x.inX = w.x, x.inY = w.y;
    }
    if (x.outX !== void 0) {
      const w = d(x.outX, x.outY ?? 0);
      x.outX = w.x, x.outY = w.y;
    }
    m = Math.min(m, x.x), f = Math.min(f, x.y), p = Math.max(p, x.x), g = Math.max(g, x.y);
  }
  for (const b of e) for (const x of b.anchors)
    x.x -= m, x.y -= f;
  t.x = t.x - s.minX + m, t.y = t.y - s.minY + f, t.width = Math.max(p - m, 1), t.height = Math.max(g - f, 1), t.angle = 0, t.flipX = void 0, t.flipY = void 0;
}
function Pc(t) {
  const e = t.geom;
  if (e.kind !== "preset") return null;
  const n = e.adj ?? {};
  switch (e.prst) {
    case "rect":
      return { type: "rectangle", extra: { borderRadius: 0 } };
    case "roundRect":
      return { type: "rectangle", extra: { borderRadius: Math.max(0, Math.min(50, (n.adj ?? 16667) / 1e3)) } };
    case "ellipse":
      return { type: "circle", extra: {} };
    case "diamond":
      return { type: "diamond", extra: { borderRadius: 0 } };
    case "triangle":
      return (n.adj ?? 5e4) === 5e4 ? { type: "triangle", extra: {} } : null;
    default:
      return null;
  }
}
const ro = { triangle: "triangle", stealth: "arrow", arrow: "arrow", oval: "dot", diamond: "diamondFilled" };
function Tn(t, e, n) {
  const s = t.geom;
  let o;
  if (s.kind === "preset" && oi.has(s.prst)) o = [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  else if (s.kind === "custom") o = s.paths.flatMap((k) => k.cmds);
  else {
    const k = e.presets[s.prst], w = Object.fromEntries(Object.entries(s.adj ?? {}).map(([M, S]) => [M, `val ${S}`]));
    o = k ? Ue(k, t.w, t.h, w).flatMap((M) => M.cmds) : [{ op: "M", x: 0, y: 0 }, { op: "L", x: t.w, y: t.h }];
  }
  const i = t.w / 2, r = t.h / 2, l = (t.rot || 0) * Math.PI / 180, a = (k, w) => {
    let M = k - i, S = w - r;
    return t.flipH && (M = -M), t.flipV && (S = -S), { x: t.x + i + M * Math.cos(l) - S * Math.sin(l), y: t.y + r + M * Math.sin(l) + S * Math.cos(l) };
  }, u = [];
  let c = { x: 0, y: 0 };
  for (const k of o)
    if (k.op === "M" || k.op === "L")
      c = { x: k.x, y: k.y }, u.push(a(c.x, c.y));
    else if (k.op === "C") {
      for (let w = 1; w <= 12; w++) {
        const M = w / 12, S = 1 - M, O = S * S * S * c.x + 3 * S * S * M * k.x1 + 3 * S * M * M * k.x2 + M * M * M * k.x, T = S * S * S * c.y + 3 * S * S * M * k.y1 + 3 * S * M * M * k.y2 + M * M * M * k.y;
        u.push(a(O, T));
      }
      c = { x: k.x, y: k.y };
    }
  if (u.length < 2) return [];
  const h = Math.min(...u.map((k) => k.x)), d = Math.min(...u.map((k) => k.y)), m = Math.max(...u.map((k) => k.x)), f = Math.max(...u.map((k) => k.y)), p = t.line.head && ro[t.line.head.type], g = t.line.tail && ro[t.line.tail.type], b = zt(e, p || g ? "arrow" : "line", { ...t, x: h, y: d, w: Math.max(m - h, 1), h: Math.max(f - d, 1), rot: 0, flipH: !1, flipV: !1 }, n);
  b.points = u.map((k) => ({ x: k.x - h, y: k.y - d })), b.curveType = "straight", b.startArrowhead = p ?? null, b.endArrowhead = g ?? null, On(b, t.line);
  const x = (k, w) => {
    if (!k) return null;
    const M = e.byPptId.get(k.id);
    if (!M || !M.el.width || !M.el.height) return null;
    const S = M.el;
    return { elementId: S.id, focus: 0, gap: 0, anchorFractionX: (w.x + e.ox - S.x) / S.width, anchorFractionY: (w.y + e.oy - S.y) / S.height };
  };
  return e.glue.push(() => {
    b.startBinding = x(t.start, u[0]), b.endBinding = x(t.end, u[u.length - 1]);
  }), e.stats.elements++, [b];
}
const lo = 25 * 1024 * 1024, ao = 50 * 1024 * 1024, Ac = "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96"><path d="M3 9h4l5-4v14l-5-4H3z" fill="#4472c4"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#4472c4" stroke-width="1.8" stroke-linecap="round"/></svg>');
function $c(t, e, n, s) {
  if (!s || !e || !n || !s.l && !s.t && !s.r && !s.b) return t;
  const o = s.l * e, i = s.t * n, r = Math.max(1, (1 - s.l - s.r) * e), l = Math.max(1, (1 - s.t - s.b) * n), a = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${o} ${i} ${r} ${l}" width="${Math.round(r)}" height="${Math.round(l)}" preserveAspectRatio="none"><image width="${e}" height="${n}" preserveAspectRatio="none" xlink:href="${t}" href="${t}"/></svg>`;
  return `data:image/svg+xml;base64,${ns(new TextEncoder().encode(a))}`;
}
function Oc(t, e, n) {
  const s = t.audio ? "Audio" : "Video", o = (u) => {
    if (e.warnings.push(`${s} "${t.name}" ${u}; only its picture was imported.`), !t.poster) return [];
    const c = { id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot, flipH: t.flipH, flipV: t.flipV, media: t.poster, crop: t.crop };
    return En(c, e, n);
  };
  let i;
  if (t.file) {
    const u = bi(t.file.ext, t.audio), c = t.file.bytes.length, h = e.mediaBytes ??= { used: 0 }, d = t.file.ext.toUpperCase() || "media";
    if (!u) return o(`is ${/^[AEFHILMNORSX]/.test(d) ? "an" : "a"} ${d} file, which browsers can't play`);
    if (c > lo) return o(`is ${(c / 1048576).toFixed(0)} MB, over the ${lo / 1048576} MB a clip can be`);
    if (h.used + c > ao) return o(`would take the presentation's clips over ${ao / 1048576} MB in all`);
    h.used += c, i = `data:${u};base64,${ns(t.file.bytes)}`;
  } else if (t.url)
    i = t.url;
  else
    return t.poster ? En({ id: t.id, name: t.name, x: t.x, y: t.y, w: t.w, h: t.h, rot: t.rot, flipH: t.flipH, flipV: t.flipV, media: t.poster, crop: t.crop }, e, n) : [];
  const r = zt(e, "video", t, n), l = t.file ? "direct" : xi(i), a = t.poster ? e.images.get(t.poster) : null;
  return Object.assign(r, {
    backgroundColor: t.audio ? "transparent" : "#1a1a2e",
    videoURL: i,
    videoProvider: l,
    videoEmbedURL: yi(i, l) || void 0,
    videoPosterDataURL: a ? $c(a.url, a.w, a.h, t.crop) : t.audio ? Ac : void 0,
    videoAutoplay: !!t.autoplay,
    videoLoop: !!t.loop,
    videoMuted: !!t.muted,
    videoLocked: !1
  }), e.stats.elements++, [r];
}
function En(t, e, n) {
  const s = e.images.get(t.media);
  if (!s) {
    e.warnings.push(t.media.ext === "emf" || t.media.ext === "wmf" ? `Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image Yappy couldn't read (or that draws nothing); it was imported as a placeholder.` : t.media.ext === "tiff" ? `Picture "${t.name}" is a TIFF image in a form Yappy can't decode (such as JPEG-compressed TIFF); it was imported as a placeholder.` : `Picture "${t.name}" is a ${t.media.ext.toUpperCase()} image, which browsers can't show; it was imported as a placeholder.`);
    const a = zt(e, "rectangle", t, n);
    return Object.assign(a, { backgroundColor: "#f1f3f5", strokeColor: "#adb5bd", strokeWidth: 1, strokeStyle: "dashed", containerText: `${t.media.ext.toUpperCase()} picture`, fontSize: 14, textColor: "#495057" }), e.stats.elements++, [a];
  }
  const o = zt(e, "image", t, n);
  if (o.dataURL = t.grayscale && e.gray.get(s.url) || s.url, o.status = "loaded", o.mimeType = /^data:([^;,]+)/.exec(s.url)?.[1] ?? In[t.media.ext], t.crop && (t.crop.l || t.crop.t || t.crop.r || t.crop.b) && (o.crop = { x: t.crop.l * s.w, y: t.crop.t * s.h, width: Math.max(1, (1 - t.crop.l - t.crop.r) * s.w), height: Math.max(1, (1 - t.crop.t - t.crop.b) * s.h) }), t.alpha !== void 0 && t.alpha < 1 && (o.opacity = Math.round(t.alpha * 100)), e.stats.elements++, e.stats.pictures++, !t.geom) return [o];
  const i = e.nextId("group"), r = es({
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
  }, e, [...n, i]);
  if (r.length !== 1)
    return e.stats.elements -= r.length, [o];
  const l = r[0];
  return l.isClipMask = !0, o.groupIds = [i, ...o.groupIds], o.clipMaskId = l.id, o.maskType = "clip", [o, l];
}
const Se = (t, e) => !t && !e || !!t && !!e && t.hex.toLowerCase() === e.hex.toLowerCase() && Math.abs((t.alpha ?? 1) - (e.alpha ?? 1)) < 0.01, gn = (t, e) => t.kind === e.kind && (t.kind === "none" || t.kind === "solid" && e.kind === "solid" && Se(t.color, e.color)), Tc = (t, e) => !t && !e || !!t && !!e && Math.abs(t.width - e.width) < 0.05 && Se(t.color, e.color) && (t.dash ?? "solid") === (e.dash ?? "solid"), Dt = (t, e) => t.every((n) => e(n, t[0]));
function Ec(t, e, n) {
  const s = !!t.firstRow;
  return co(t, s, e, n) ?? (t.rows.length < 2 ? null : co(t, !s, e, n));
}
function co(t, e, n, s) {
  const o = t.rows.length, i = t.cols.length;
  if (!o || !i) return null;
  const r = t.rows.map((C) => C.cells.map((P) => P.fill));
  if (r.flat().some((C) => C.kind !== "none" && C.kind !== "solid")) return null;
  const l = [], a = [], u = Array.from({ length: i }, () => []), c = [];
  for (let C = 0; C < o; C++) {
    const P = [];
    for (let F = 0; F < i; F++) {
      const z = t.rows[C].cells[F], _ = z.text, Q = _ ? _.paragraphs.map((W) => W.runs.map((X) => X.br ? `
` : X.text).join("")).join(`
`) : "";
      if (P.push(z.hMerge || z.vMerge ? "" : Q), z.hMerge || z.vMerge || !_ || !Q.trim()) continue;
      if (c.push(_.anchor), _.paragraphs.some((W) => W.bullet) || _.vert) return null;
      const V = _.defaults ?? {};
      for (const W of _.paragraphs) {
        u[F].push(W.align ?? "l");
        for (const X of W.runs)
          if (!(X.br || !X.text.trim())) {
            if ((X.underline ?? V.underline) || (X.strike ?? V.strike)) return null;
            a.push({ row: C, col: F, p: { size: X.size ?? V.size ?? 18, font: X.font ?? V.font, bold: !!(X.bold ?? V.bold), italic: !!(X.italic ?? V.italic), color: X.color ?? V.color } });
          }
      }
    }
    l.push(P);
  }
  const h = a.map((C) => C.p);
  if (h.length && !Dt(h, (C, P) => Math.abs(C.size - P.size) < 0.5 && (C.font ?? "") === (P.font ?? "") && C.italic === P.italic)) return null;
  const d = a.filter((C) => e && C.row === 0).map((C) => C.p), m = a.filter((C) => !(e && C.row === 0)).map((C) => C.p);
  if (!Dt(m, (C, P) => C.bold === P.bold && Se(C.color, P.color)) || !Dt(d, (C, P) => Se(C.color, P.color))) return null;
  const f = m[0]?.bold ?? !1;
  if (d.some((C) => !C.bold) || !Dt(c, (C, P) => C === P)) return null;
  const p = [];
  for (const C of u) {
    if (!Dt(C, (P, F) => P === F)) return null;
    p.push(C[0] === "r" ? "right" : C[0] === "ctr" ? "center" : "left");
  }
  const g = (C, P) => !t.rows[C].cells[P].hMerge && !t.rows[C].cells[P].vMerge, b = (C) => {
    const P = r[C].filter((F, z) => g(C, z));
    return P.length && Dt(P, gn) ? P[0] : P.length ? null : { kind: "none" };
  }, x = t.rows.map((C, P) => b(P));
  if (x.some((C) => !C)) return null;
  const k = x.slice(e ? 1 : 0), w = k.filter((C, P) => P % 2 === 0), M = k.filter((C, P) => P % 2 === 1);
  if (!Dt(w, gn) || !Dt(M, gn)) return null;
  const S = (C) => C && C.kind === "solid" ? lt(C.color) : "", O = S(w[0]), T = M.length ? S(M[0]) : O;
  if (!O && T) return null;
  const E = t.rows.flatMap((C, P) => C.cells.filter((F, z) => g(P, z)).flatMap((F) => [F.borders.l, F.borders.r, F.borders.t, F.borders.b]));
  if (!Dt(E, Tc)) return null;
  const $ = E[0] ?? null, R = [];
  t.rows.forEach((C, P) => C.cells.forEach((F, z) => {
    ((F.gridSpan ?? 1) > 1 || (F.rowSpan ?? 1) > 1) && R.push({ startRow: P, startCol: z, endRow: Math.min(o - 1, P + (F.rowSpan ?? 1) - 1), endCol: Math.min(i - 1, z + (F.gridSpan ?? 1) - 1) });
  }));
  const I = t.cols.reduce((C, P) => C + P, 0), L = t.rows.reduce((C, P) => C + P.h, 0), B = zt(n, "table", { ...t, w: I, h: L }, s), D = h[0];
  return Object.assign(B, {
    tableRows: e ? o - 1 : o,
    tableCols: i,
    tableHeaders: e,
    tableData: l,
    tableColWidths: t.cols.map((C) => C / (I || 1)),
    tableRowHeights: t.rows.map((C) => C.h / (L || 1)),
    tableHeaderColor: e ? S(x[0]) : "",
    tableHeaderTextColor: d[0]?.color && !Se(d[0].color, m[0]?.color) ? lt(d[0].color) : "",
    tableRowColor: O,
    tableAltRowColor: T !== O ? T : "",
    // A presentation table isn't a sortable list: no arrows in its header.
    tableColAlignments: p,
    tableSortCol: -1,
    tableSortDir: "asc",
    tableSortArrows: !1,
    ...c[0] && c[0] !== "ctr" && { tableVerticalAlign: c[0] === "t" ? "top" : "bottom" },
    ...R.length && { tableMergedCells: R },
    strokeColor: $ ? lt($.color) : "transparent",
    strokeWidth: $ ? $.width : 1,
    fontSize: D?.size ?? 14,
    fontFamily: $n(D?.font),
    textColor: lt(m[0]?.color ?? d[0]?.color ?? { hex: "#000000" }),
    ...f && { fontWeight: "bold" },
    ...D?.italic && { fontStyle: "italic" }
  }), $?.dash && $.dash !== "solid" && (B.strokeStyle = /dot/i.test($.dash) ? "dotted" : "dashed"), B;
}
function Nn(t, e, n) {
  const s = [];
  for (const o of t)
    try {
      const i = [];
      switch (o.kind) {
        case "shape":
          i.push(...es(o, e, n));
          break;
        case "connector":
          i.push(...Tn(o, e, n));
          break;
        case "picture":
          i.push(...En(o, e, n));
          break;
        case "media":
          i.push(...Oc(o, e, n));
          break;
        case "group":
          i.push(...Nn(o.children, e, [...n, e.nextId("group")]));
          break;
        case "table": {
          const l = Ec(o, e, n);
          l ? (e.stats.elements++, i.push(l)) : o.fallback && i.push(...Nn([o.fallback], e, n));
          break;
        }
        case "chart": {
          const l = zt(e, "chart", o, n);
          l.chart = gi(o.chart), l.fontFamily = "sans-serif", e.stats.elements++, i.push(l);
          break;
        }
      }
      if (o.descr && i[0] && !i[0].altText && (i[0].altText = o.descr), o.decorative) for (const l of i) l.decorative = !0;
      const r = yc(o.link, e);
      if (r)
        for (const l of i) l.link || (l.link = r);
      e.itemEls?.set(o.id, i), s.push(...i);
    } catch {
      e.warnings.push(`"${o.name}" couldn't be converted and was skipped.`);
    }
  return s;
}
function Nc(t) {
  if (!t) return;
  const e = t.dir === "r" ? "right" : t.dir === "u" ? "up" : t.dir === "d" ? "down" : "left";
  return { type: t.kind === "morph" ? "morph" : t.kind === "fade" ? "fade" : t.kind === "zoom" ? t.zoomIn === !1 ? "zoom-out" : "zoom-in" : t.kind === "split" ? `split-${t.orient === "vert" ? "vertical" : "horizontal"}-${t.inward ? "in" : "out"}` : t.kind === "wipe" ? `wipe-${e}` : t.kind === "cover" ? `cover-${e}` : t.kind === "pull" ? `uncover-${e}` : `slide-${e}`, duration: Math.max(100, Math.min(5e3, t.durationMs)), easing: "easeInOutQuad" };
}
function Ic(t, e, n) {
  if (e)
    if (e.kind === "solid")
      t.fillStyle = "solid", t.backgroundColor = lt(e.color);
    else if (e.kind === "linear" || e.kind === "radial")
      t.fillStyle = e.kind, t.backgroundColor = lt(e.stops[0]?.color), t.gradientStops = e.stops.map((s) => ({ offset: s.pos, color: lt(s.color) })), e.kind === "linear" && (t.gradientDirection = e.angle);
    else if (e.kind === "image") {
      const s = n.images.get(e.media), o = n.slideBg ?? s?.url;
      o && (t.fillStyle = "image", t.backgroundImage = o, t.backgroundColor = "#ffffff"), o && e.alpha !== void 0 && e.alpha < 1 && (t.backgroundOpacity = e.alpha);
    } else e.kind === "pattern" && (t.fillStyle = "solid", t.backgroundColor = lt(e.color));
}
const In = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, Rc = /* @__PURE__ */ new Set(["png", "jpeg", "gif", "svg", "bmp", "webp"]);
function ns(t) {
  let e = "";
  for (let s = 0; s < t.length; s += 32768) e += String.fromCharCode(...t.subarray(s, s + 32768));
  return btoa(e);
}
async function Fc(t) {
  const e = /* @__PURE__ */ new Set(), n = (o) => {
    for (const i of o)
      i.kind === "picture" ? e.add(i.media) : i.kind === "media" && i.poster ? e.add(i.poster) : i.kind === "group" ? n(i.children) : i.kind === "shape" && i.fill.kind === "image" && e.add(i.fill.media);
  };
  for (const o of t.slides)
    n(o.items), o.background?.kind === "image" && e.add(o.background.media);
  const s = /* @__PURE__ */ new Map();
  return await Promise.all([...e].map(async (o) => {
    if (o.ext === "emf" || o.ext === "wmf") {
      s.set(o, tc(o.bytes));
      return;
    }
    if (o.ext === "tiff") {
      s.set(o, ic(o.bytes));
      return;
    }
    if (!Rc.has(o.ext)) {
      s.set(o, null);
      return;
    }
    const i = `data:${In[o.ext]};base64,${ns(o.bytes)}`;
    let r = 0, l = 0;
    try {
      const a = await createImageBitmap(new Blob([o.bytes], { type: In[o.ext] }));
      r = a.width, l = a.height, a.close();
    } catch {
    }
    s.set(o, { url: i, w: r, h: l });
  })), s;
}
function Bc(t, e, n) {
  const s = /^(nar|sm)/.test(t) ? 4 : /^(wd|lg)/.test(t) ? 12 : 8, o = /^dk/.test(t) ? 3 : /^lt/.test(t) ? 1 : /^(wd)/.test(t) ? 3 : 1.5, i = { color: e, background: n, spacing: s, strokeWidth: o }, r = /^pct(\d+)$/.exec(t);
  if (r) {
    const l = Math.max(1, Math.min(99, Number(r[1]))), a = l > 50, u = (a ? 100 - l : l) / 100;
    return { type: "dots", color: a ? n : e, background: a ? e : n, spacing: 4, strokeWidth: Math.max(0.5, 4 * Math.sqrt(u / Math.PI)) };
  }
  return /Horz$|^horz|Brick$|^shingle$|^wave$|^zigZag$/.test(t) ? { type: "stripes", ...i, angle: 0 } : /Vert$|^vert$/.test(t) ? { type: "stripes", ...i, angle: 90 } : /DnDiag$|^dnDiag$/.test(t) ? { type: "stripes", ...i, angle: 45 } : /UpDiag$|^upDiag$/.test(t) ? { type: "stripes", ...i, angle: -45 } : /^(diagCross|trellis|openDmnd|weave)$/.test(t) ? { type: "crosshatch", ...i } : /Check$|^solidDmnd$/.test(t) ? { type: "checker", ...i, angle: t === "solidDmnd" ? 45 : 0 } : /^(cross|smGrid|lgGrid|dotGrid|plaid)$/.test(t) ? { type: "grid", ...i } : { type: "dots", ...i, strokeWidth: 1 };
}
async function Dc(t, e, n) {
  const s = await Zi(), o = await Fc(t), i = Math.round(t.width), r = Math.round(t.height), l = mi(n ?? t.title, "slides", { width: i, height: r }), a = [], u = { slides: 0, elements: 0, pictures: 0, paths: 0 };
  l.slides = [];
  const c = await wc(t, o), h = await Promise.all(t.slides.map((f) => {
    const p = f.background, g = p?.kind === "image" ? o.get(p.media) : void 0;
    return p?.kind === "image" && g ? Mc(g.url, i, r, p.tile) : void 0;
  })), d = t.slides.map(() => e("slide")), m = /* @__PURE__ */ new Map();
  return t.slides.forEach((f, p) => {
    f.key && m.set(f.key, d[p]);
  }), t.slides.forEach((f, p) => {
    const g = p * (i + fc), b = os(d[p], f.name || `Slide ${p + 1}`, g, 0, { width: i, height: r });
    b.order = p;
    const x = { ox: g, oy: 0, presets: s, nextId: e, out: [], byPptId: /* @__PURE__ */ new Map(), glue: [], warnings: a, stats: u, images: o, slideBg: h[p], gray: c, slideIds: m, itemEls: /* @__PURE__ */ new Map() };
    l.elements.push(...Nn(f.items, x, [])), xc(f.anims ?? [], x, e), x.glue.forEach((w) => w()), Ic(b, f.background, x);
    const k = Nc(f.transition);
    k && (b.transition = k), f.notes && (b.notes = f.notes), f.hidden && (b.hidden = !0), f.advanceAfterMs && (b.advanceAfter = f.advanceAfterMs), f.section && (b.section = f.section), l.slides.push(b), u.slides++;
  }), l.slides.length || l.slides.push(os(void 0, "Slide 1", 0, 0, { width: i, height: r })), t.loop && (l.globalSettings = { ...l.globalSettings || {}, slideShowLoop: !0 }), { doc: l, warnings: [...new Set(a)], stats: u };
}
const Lc = 512 * 1024 * 1024;
async function Hc(t, e) {
  const n = t instanceof Uint8Array ? t : t instanceof ArrayBuffer ? new Uint8Array(t) : new Uint8Array(await t.arrayBuffer());
  if (n.length > Lc) throw new Error("This presentation is too large to open (over 512 MB).");
  const { deck: s, warnings: o } = Xr(n), i = /* @__PURE__ */ new Set(), r = await Dc(s, (a) => Si(a, i), e);
  vi(r.doc);
  const l = [...o, ...r.warnings];
  return l.length && console.warn("[pptx import]", l), { stats: r.stats, warnings: l };
}
export {
  Hc as importPptx
};
