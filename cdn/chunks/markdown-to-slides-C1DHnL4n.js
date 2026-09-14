import { a5 as _, a6 as w, a7 as C, a3 as M, a8 as L, a2 as x, a4 as A } from "./index-CUI7LOoj.js";
function v(r, T) {
  const o = M[T || "minimalist"] || M.minimalist, a = r.split(`
`), c = [];
  let t = null, u = [];
  const h = () => {
    t && (u.length > 0 && !t.bullets?.length && !t.body && !t.quoteText && (t.body = u.join(`
`).trim()), u = [], c.push(t), t = null);
  }, n = (e, s = "content") => {
    h(), t = { title: e, type: s };
  };
  for (let e = 0; e < a.length; e++) {
    const i = a[e].trim();
    if (/^---+\s*$/.test(i)) {
      h();
      continue;
    }
    const l = i.match(/^#\s+(.+)$/);
    if (l) {
      c.length === 0 && !t ? n(l[1], "title") : n(l[1]);
      continue;
    }
    const m = i.match(/^##\s+(.+)$/);
    if (m) {
      n(m[1]);
      continue;
    }
    const f = i.match(/^###\s+(.+)$/);
    if (f) {
      t ? u.push(f[1]) : n(f[1]);
      continue;
    }
    const y = i.match(/^>\s*(.+)$/);
    if (y) {
      const E = [y[1]];
      for (; e + 1 < a.length && /^>\s*/.test(a[e + 1].trim()); )
        e++, E.push(a[e].trim().replace(/^>\s*/, ""));
      const k = E.join(" ").trim(), b = k.match(/^(.+?)\s*[—–-]{1,2}\s*(.+)$/);
      t && t.type !== "title" && h(), t || (t = { title: "", type: "quote" }), b ? (t.type = "quote", t.quoteText = b[1].trim(), t.quoteAttribution = b[2].trim()) : (t.type = "quote", t.quoteText = k);
      continue;
    }
    const $ = i.match(/^[-*]\s+(.+)$/);
    if ($) {
      t || n(""), t.bullets || (t.bullets = []), t.bullets.push(d($[1]));
      continue;
    }
    const q = i.match(/^\d+\.\s+(.+)$/);
    if (q) {
      t || n(""), t.bullets || (t.bullets = []), t.bullets.push(d(q[1]));
      continue;
    }
    i !== "" && (t || n(""), u.push(d(i)));
  }
  h(), c.length === 0 && c.push({ title: "Untitled", type: "content", body: r.trim() });
  const S = 2e3, p = [], g = [];
  return c.forEach((e, s) => {
    const i = s * S;
    let l;
    switch (e.type) {
      case "title":
        l = L(e.title, e.body || e.bullets?.[0], o);
        break;
      case "quote":
        l = C(e.quoteText || "", e.quoteAttribution, o);
        break;
      case "closing":
        l = w(e.title, e.body, o);
        break;
      default:
        l = _(e.title, e.bullets, e.body, o);
        break;
    }
    const m = x(l, i, 0);
    p.push(...m), g.push({
      id: A("slide"),
      name: e.title || `Slide ${s + 1}`,
      spatialPosition: { x: i, y: 0 },
      dimensions: { width: 1920, height: 1080 },
      order: s,
      backgroundColor: o.background
    });
  }), {
    version: 4,
    metadata: { name: "Markdown Import", docType: "slides" },
    elements: p,
    layers: [{ id: "default-layer", name: "Layer 1", visible: !0, locked: !1, opacity: 1, order: 0, backgroundColor: "transparent" }],
    slides: g,
    globalSettings: {}
  };
}
function d(r) {
  return r.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/_(.+?)_/g, "$1").replace(/`(.+?)`/g, "$1").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();
}
export {
  v as parseMarkdownToSlides
};
