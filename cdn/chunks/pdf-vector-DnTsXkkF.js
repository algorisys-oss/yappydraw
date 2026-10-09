import { L as S, M as C, N as $ } from "./index-xELOblG8.js";
import { p as E, i as P, a as D, c as T } from "./pdf-cmyk-CqVZV2FF.js";
const b = (t, i) => {
  for (let n = t; n; n = n.parentElement) {
    const r = n.getAttribute(i);
    if (r !== null && r !== "" && r !== "inherit") return r;
  }
  return null;
}, B = (t) => {
  if (!t || t === "normal") return 400;
  if (t === "bold" || t === "bolder") return 700;
  if (t === "lighter") return 300;
  const i = parseInt(t, 10);
  return Number.isFinite(i) ? i : 400;
}, I = (t) => ({
  family: b(t, "font-family") ?? "sans-serif",
  weight: B(b(t, "font-weight")),
  italic: /italic|oblique/.test(b(t, "font-style") ?? "")
}), U = (t) => {
  const i = t.family.toLowerCase(), n = /monospace|mono\b|courier|code/.test(i) ? "courier" : /(^|,)\s*serif|merriweather|georgia|times/.test(i) ? "times" : "helvetica", r = t.weight >= 600, e = r && t.italic ? "bolditalic" : r ? "bold" : t.italic ? "italic" : "normal";
  return { family: n, style: e };
}, A = (t) => t.split(",")[0].trim().replace(/^['"]|['"]$/g, ""), L = async (t) => {
  const i = await fetch(t);
  if (!i.ok) throw new Error(`Font fetch failed: ${t} (${i.status})`);
  return i.arrayBuffer();
}, N = async (t) => {
  const i = new Blob([t]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(i).arrayBuffer());
}, q = async (t, i = N) => {
  const n = new DataView(t);
  if (t.byteLength < 44 || n.getUint32(0) !== 2001684038) return t;
  const r = n.getUint32(4), e = n.getUint16(12), s = [];
  for (let o = 0; o < e; o++) {
    const g = 44 + o * 20, m = n.getUint32(g), p = n.getUint32(g + 4), h = n.getUint32(g + 8), y = n.getUint32(g + 12), w = n.getUint32(g + 16), v = new Uint8Array(t, p, h), F = h < y ? await i(v) : v;
    if (F.length !== y) throw new Error("WOFF table decompressed to the wrong length");
    s.push({ tag: m, checksum: w, data: F });
  }
  s.sort((o, g) => o.tag - g.tag);
  let u = 12 + e * 16;
  for (const o of s) u += o.data.length + 3 & -4;
  const f = new Uint8Array(u), a = new DataView(f.buffer);
  let d = 1, l = 0;
  for (; d * 2 <= e; )
    d *= 2, l++;
  a.setUint32(0, r), a.setUint16(4, e), a.setUint16(6, d * 16), a.setUint16(8, l), a.setUint16(10, e * 16 - d * 16);
  let c = 12 + e * 16;
  return s.forEach((o, g) => {
    const m = 12 + g * 16;
    a.setUint32(m, o.tag), a.setUint32(m + 4, o.checksum), a.setUint32(m + 8, c), a.setUint32(m + 12, o.data.length), f.set(o.data, c), c += o.data.length + 3 & -4;
  }), f.buffer;
}, k = (t) => {
  if (t.byteLength < 4) return !1;
  const i = new DataView(t).getUint32(0);
  return i === 65536 || i === 1953658213;
}, M = (t) => {
  const i = t.slice(t.indexOf(",") + 1), n = atob(i), r = new Uint8Array(n.length);
  for (let e = 0; e < n.length; e++) r[e] = n.charCodeAt(e);
  return r.buffer;
}, x = (t) => {
  const i = A(t.family), n = S().find((u) => u.family === i);
  if (n)
    return n.kind === "google" || !n.dataUrl ? null : { id: `yd-${n.key}`, load: async () => M(n.dataUrl) };
  const r = C(t.family);
  if (!r) return null;
  const e = $(r, t.weight, t.italic);
  if (!e) return null;
  const s = "/";
  return { id: `yd-${e.file.replace(/\.(ttf|woff)$/, "")}`, load: () => L(`${s}fonts/outline/${e.file}`) };
}, V = (t) => {
  const i = new Uint8Array(t);
  let n = "";
  for (let r = 0; r < i.length; r += 32768) n += String.fromCharCode(...i.subarray(r, r + 32768));
  return btoa(n);
}, W = {
  helvetica: "Inter, sans-serif",
  times: "Merriweather, serif",
  courier: "Source Code Pro, monospace"
}, j = async (t, i, n = !1) => {
  const r = /* @__PURE__ */ new Map(), e = /* @__PURE__ */ new Set(), s = [...i.querySelectorAll("text, tspan")], u = s.map(I), f = (a) => {
    let d = r.get(a.id);
    return d || (d = a.load().then(q).then((l) => {
      if (!k(l)) return !1;
      const c = `${a.id}.ttf`;
      return t.addFileToVFS(c, V(l)), t.addFont(c, a.id, "normal"), !!t.getFontList()[a.id];
    }).catch(() => !1), r.set(a.id, d)), d;
  };
  return await Promise.all(s.map(async (a, d) => {
    const l = u[d];
    let c = x(l);
    if ((!c || !await f(c)) && n) {
      if (c = x({ ...l, family: W[U(l).family] }), !c || !await f(c)) throw new Error(`PDF/X: could not embed a font for “${l.family}”`);
      e.add(A(l.family));
    }
    if (c && await f(c))
      a.setAttribute("font-family", c.id), a.setAttribute("font-weight", "400"), a.setAttribute("font-style", "normal");
    else {
      const o = U(l);
      a.setAttribute("font-family", o.family), a.setAttribute("font-weight", o.style.includes("bold") ? "700" : "400"), a.setAttribute("font-style", o.style.includes("italic") ? "italic" : "normal"), e.add(A(l.family));
    }
    a.removeAttribute("font-stretch");
  })), [...e];
}, O = async (t) => {
  const i = [...t.querySelectorAll("image")].filter((n) => /filter\s*:/.test(n.getAttribute("style") ?? ""));
  await Promise.all(i.map(async (n) => {
    const r = (n.getAttribute("style") ?? "").match(/filter\s*:\s*([^;]+)/)?.[1]?.trim(), e = n.getAttribute("href") ?? n.getAttributeNS("http://www.w3.org/1999/xlink", "href");
    if (!(!r || !e))
      try {
        const s = new Image();
        s.src = e, await s.decode();
        const u = document.createElement("canvas");
        u.width = s.naturalWidth, u.height = s.naturalHeight;
        const f = u.getContext("2d");
        if (!f) return;
        f.filter = r, f.drawImage(s, 0, 0), n.setAttribute("href", u.toDataURL("image/png")), n.removeAttribute("style");
      } catch {
      }
  }));
}, X = (t, i, n, r) => {
  const e = t.cloneNode(!0);
  return e.setAttribute("width", `${r.width}`), e.setAttribute("height", `${r.height}`), e.setAttribute("viewBox", `${r.x - i} ${r.y - n} ${r.width} ${r.height}`), e.style.backgroundColor = "", r.keep && e.querySelectorAll("[data-yappy-id]").forEach((s) => {
    r.keep.has(s.getAttribute("data-yappy-id")) || s.remove();
  }), e.querySelectorAll("[data-yappy-page-bg]").forEach((s) => s.remove()), e.querySelectorAll("style").forEach((s) => {
    s.textContent?.includes("@import") && s.remove();
  }), e;
}, _ = (t) => {
  if (/^#[0-9a-f]{6}$/i.test(t)) return t;
  const i = document.createElement("canvas").getContext("2d");
  if (!i) return null;
  i.fillStyle = "#000001", i.fillStyle = t;
  const n = String(i.fillStyle);
  if (n === "#000001") return null;
  if (n.startsWith("#")) return n;
  const r = n.match(/rgba?\(([^)]+)\)/);
  if (!r) return null;
  const [e, s, u, f = "1"] = r[1].split(",").map((a) => a.trim());
  return parseFloat(f) === 0 ? null : "#" + [e, s, u].map((a) => (+a).toString(16).padStart(2, "0")).join("");
}, z = async (t, i, n, r, e) => {
  const [{ jsPDF: s }, { svg2pdf: u }] = await Promise.all([import("./jspdf.es.min-rJE95jGX.js").then((c) => c.j), import("./svg2pdf.es.min-BVaMJ-wC.js")]), f = r[0], a = new s({
    orientation: f.width >= f.height ? "landscape" : "portrait",
    unit: "px",
    format: [f.width, f.height],
    hotfixes: ["px_scaling"],
    // Flate-compress streams. Without it every embedded bitmap is stored raw — a 460×360
    // shadow halo was 650 kB — and content streams and fonts go uncompressed too.
    compress: !0
  }), d = t.cloneNode(!0), l = document.createElement("div");
  l.style.cssText = "position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none", document.body.appendChild(l);
  try {
    l.appendChild(d);
    const c = await j(a, d, !!e?.pdfx);
    await O(d), d.remove();
    let o = 0;
    const g = /* @__PURE__ */ new Set();
    if (e) {
      const p = await E(d, e.engine);
      P(a, e.engine, e.exact, e.spots, g), D(a, s.API, p, () => {
        o++;
      });
    }
    for (let p = 0; p < r.length; p++) {
      const h = r[p];
      p > 0 && a.addPage([h.width, h.height], h.width >= h.height ? "landscape" : "portrait");
      const y = h.background ? _(h.background) : null;
      y && (a.setFillColor(y), a.rect(0, 0, h.width, h.height, "F"));
      const w = X(d, i, n, h);
      l.appendChild(w);
      try {
        await u(w, a, { x: 0, y: 0, width: h.width, height: h.height });
      } finally {
        w.remove();
      }
    }
    let m = new Uint8Array(a.output("arraybuffer"));
    if (e && (m = await T(m, e.engine, e.exact, g)), e?.pdfx) {
      if (o > 0) throw new Error("PDF/X: an image could not be converted to CMYK");
      const { applyPdfX4: p } = await import("./pdf-x-317WCbxY.js");
      m = await p(m, {
        profile: e.engine.profile,
        profileBytes: e.engine.profileBytes,
        title: e.pdfx.title,
        bleedPt: e.pdfx.bleedPt
      });
    }
    return { bytes: m, substitutedFonts: c, rgbImages: o };
  } finally {
    l.remove();
  }
};
export {
  O as bakeImageFilters,
  _ as cssColorToHex,
  j as embedSvgFonts,
  x as embeddableFontFor,
  k as isTrueType,
  X as pageSvg,
  z as renderSvgPagesToPdf,
  U as standardPdfFont,
  I as textFaceOf,
  q as woffToSfnt
};
