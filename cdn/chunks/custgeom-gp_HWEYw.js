import { am as w } from "./index-v2rH-W8-.js";
import { s as z, z as X } from "./browser-DbZP-BrN.js";
const Z = 9525, _ = 12700, U = (c) => {
  const o = ((Number.isFinite(c) ? c : 0) % 360 + 360) % 360;
  return Math.round(o * 6e4) % 216e5;
}, A = (c) => Math.max(100, Math.min(4e5, Math.round(c * (Z / _) * 100))), B = (c) => Math.round(Math.max(0, Math.min(1, c)) * 1e5), D = (c) => String(c).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), N = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
`, R = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  p14: "http://schemas.microsoft.com/office/powerpoint/2010/main",
  mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
  ct: "http://schemas.openxmlformats.org/package/2006/content-types"
}, j = {
  officeDocument: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
  coreProps: "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties",
  extProps: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties",
  slide: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide",
  slideLayout: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout",
  slideMaster: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster",
  theme: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme",
  image: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
  presProps: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps",
  viewProps: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps",
  tableStyles: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles",
  notesSlide: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide",
  notesMaster: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster",
  hyperlink: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"
}, Q = (c) => N + `<Relationships xmlns="${R.rel}">` + c.map((o) => `<Relationship Id="${D(o.id)}" Type="${o.type}" Target="${D(o.target)}"${o.external ? ' TargetMode="External"' : ""}/>`).join("") + "</Relationships>";
function Y(c) {
  const o = {}, i = [...c.keys()].sort((r, n) => r === "[Content_Types].xml" ? -1 : n === "[Content_Types].xml" ? 1 : 0);
  for (const r of i) {
    const n = c.get(r), e = typeof n == "string" ? z(n) : n, s = typeof n != "string" && /\.(png|jpe?g|gif|webp)$/i.test(r);
    o[r] = [e, { level: s ? 0 : 6 }];
  }
  return X(o);
}
const F = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;
function H(c) {
  const o = [], i = String(c).match(F);
  if (!i) return o;
  let r = 0, n = "", e = 0, s = 0, y = 0, d = 0, u = 0, a = 0, g = "", h = !1;
  const M = (f) => /^[A-Za-z]$/.test(f), l = () => {
    if (r >= i.length || M(i[r])) return null;
    const f = parseFloat(i[r++]);
    return Number.isFinite(f) ? f : null;
  }, $ = (f) => {
    const b = [];
    for (let p = 0; p < f; p++) {
      const m = l();
      if (m === null) return null;
      b.push(m);
    }
    return b;
  }, L = () => {
    h || (o.push({ op: "M", x: e, y: s }), h = !0, y = e, d = s);
  }, T = (f, b, p, m, x, t) => {
    L(), o.push({ op: "C", x1: f, y1: b, x2: p, y2: m, x, y: t }), u = p, a = m, e = x, s = t;
  }, S = (f, b, p, m) => {
    T(e + 2 / 3 * (f - e), s + 2 / 3 * (b - s), p + 2 / 3 * (f - p), m + 2 / 3 * (b - m), p, m), u = f, a = b;
  };
  for (; r < i.length; ) {
    if (M(i[r])) n = i[r++];
    else if (!n) {
      r++;
      continue;
    }
    const f = n === n.toLowerCase(), b = n.toUpperCase(), p = f ? e : 0, m = f ? s : 0;
    let x = !0;
    switch (b) {
      case "M": {
        const t = $(2);
        if (!t) {
          x = !1;
          break;
        }
        e = p + t[0], s = m + t[1], o.push({ op: "M", x: e, y: s }), h = !0, y = e, d = s, n = f ? "l" : "L";
        break;
      }
      case "L": {
        const t = $(2);
        if (!t) {
          x = !1;
          break;
        }
        L(), e = p + t[0], s = m + t[1], o.push({ op: "L", x: e, y: s });
        break;
      }
      case "H": {
        const t = $(1);
        if (!t) {
          x = !1;
          break;
        }
        L(), e = (f ? e : 0) + t[0], o.push({ op: "L", x: e, y: s });
        break;
      }
      case "V": {
        const t = $(1);
        if (!t) {
          x = !1;
          break;
        }
        L(), s = (f ? s : 0) + t[0], o.push({ op: "L", x: e, y: s });
        break;
      }
      case "C": {
        const t = $(6);
        if (!t) {
          x = !1;
          break;
        }
        T(p + t[0], m + t[1], p + t[2], m + t[3], p + t[4], m + t[5]);
        break;
      }
      case "S": {
        const t = $(4);
        if (!t) {
          x = !1;
          break;
        }
        const v = /[CS]/.test(g) ? { x: 2 * e - u, y: 2 * s - a } : { x: e, y: s };
        T(v.x, v.y, p + t[0], m + t[1], p + t[2], m + t[3]);
        break;
      }
      case "Q": {
        const t = $(4);
        if (!t) {
          x = !1;
          break;
        }
        S(p + t[0], m + t[1], p + t[2], m + t[3]);
        break;
      }
      case "T": {
        const t = $(2);
        if (!t) {
          x = !1;
          break;
        }
        const v = /[QT]/.test(g) ? { x: 2 * e - u, y: 2 * s - a } : { x: e, y: s };
        S(v.x, v.y, p + t[0], m + t[1]);
        break;
      }
      case "A": {
        const t = $(7);
        if (!t) {
          x = !1;
          break;
        }
        const v = p + t[5], k = m + t[6];
        L();
        const P = w.arcToCubics(e, s, t[0], t[1], t[2], t[3] !== 0, t[4] !== 0, v, k);
        if (P.length === 0)
          o.push({ op: "L", x: v, y: k }), e = v, s = k;
        else for (const C of P) T(C.c1.x, C.c1.y, C.c2.x, C.c2.y, C.end.x, C.end.y);
        break;
      }
      case "Z": {
        h && o.push({ op: "Z" }), e = y, s = d, h = !1;
        break;
      }
      default:
        x = !1;
    }
    if (g = b, !x) break;
    b === "Z" && (n = "");
  }
  return o;
}
function V(c, o, i, r = 1, n = 1) {
  return c.map((e) => e.op === "Z" ? e : e.op === "C" ? { op: "C", x1: e.x1 * r + o, y1: e.y1 * n + i, x2: e.x2 * r + o, y2: e.y2 * n + i, x: e.x * r + o, y: e.y * n + i } : { op: e.op, x: e.x * r + o, y: e.y * n + i });
}
function K(c, o) {
  const [i, r, n, e, s, y] = o, d = (a, g) => i * a + n * g + s, u = (a, g) => r * a + e * g + y;
  return c.map((a) => a.op === "Z" ? a : a.op === "C" ? { op: "C", x1: d(a.x1, a.y1), y1: u(a.x1, a.y1), x2: d(a.x2, a.y2), y2: u(a.x2, a.y2), x: d(a.x, a.y), y: u(a.x, a.y) } : { op: a.op, x: d(a.x, a.y), y: u(a.x, a.y) });
}
function q(c) {
  let o = 1 / 0, i = 1 / 0, r = -1 / 0, n = -1 / 0;
  const e = (s, y) => {
    s < o && (o = s), y < i && (i = y), s > r && (r = s), y > n && (n = y);
  };
  for (const s of c)
    s.op !== "Z" && (s.op === "C" && (e(s.x1, s.y1), e(s.x2, s.y2)), e(s.x, s.y));
  return Number.isFinite(o) ? { minX: o, minY: i, maxX: r, maxY: n } : null;
}
const G = 1e5, E = 2e9;
function J(c, o, i) {
  const r = Math.max(Math.abs(o), 1e-6), n = Math.max(Math.abs(i), 1e-6), e = Math.max(1, G / Math.max(r, n)), s = Math.max(1, Math.round(r * e)), y = Math.max(1, Math.round(n * e)), d = (h) => {
    const M = Math.round(h * e);
    return Number.isFinite(M) ? Math.max(-E, Math.min(E, M)) : 0;
  }, u = (h, M) => `<a:pt x="${d(h)}" y="${d(M)}"/>`;
  let a = "";
  for (const h of c) {
    if (!h.cmds.some((l) => l.op !== "M" && l.op !== "Z")) continue;
    const M = `w="${s}" h="${y}"${h.fill === !1 ? ' fill="none"' : ""}${h.stroke === !1 ? ' stroke="0"' : ""}`;
    a += `<a:path ${M}>`;
    for (const l of h.cmds)
      l.op === "M" ? a += `<a:moveTo>${u(l.x, l.y)}</a:moveTo>` : l.op === "L" ? a += `<a:lnTo>${u(l.x, l.y)}</a:lnTo>` : l.op === "C" ? a += `<a:cubicBezTo>${u(l.x1, l.y1)}${u(l.x2, l.y2)}${u(l.x, l.y)}</a:cubicBezTo>` : a += "<a:close/>";
    a += "</a:path>";
  }
  const g = (h, M) => `<a:cxn ang="0"><a:pos x="${h}" y="${M}"/></a:cxn>`;
  return `<a:custGeom><a:avLst/><a:gdLst/><a:ahLst/><a:cxnLst>${g("hc", "t")}${g("l", "vc")}${g("hc", "b")}${g("r", "vc")}</a:cxnLst><a:rect l="l" t="t" r="r" b="b"/><a:pathLst>${a}</a:pathLst></a:custGeom>`;
}
const W = (c, o) => {
  const i = o ? Object.entries(o).map(([r, n]) => `<a:gd name="${D(r)}" fmla="val ${Math.round(n)}"/>`).join("") : "";
  return `<a:prstGeom prst="${D(c)}"><a:avLst>${i}</a:avLst></a:prstGeom>`;
};
export {
  Z as E,
  R as N,
  j as R,
  N as X,
  U as a,
  W as b,
  J as c,
  H as d,
  D as e,
  A as f,
  q as g,
  K as h,
  _ as i,
  B as p,
  Q as r,
  V as t,
  Y as z
};
