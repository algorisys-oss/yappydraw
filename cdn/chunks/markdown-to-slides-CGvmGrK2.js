import { F as I, G as L, H as j, P as x, I as v, J as A, K as P } from "./index-zg1eC33A.js";
function G(u, w) {
  const h = x[w || "minimalist"] || x.minimalist, c = u.split(`
`), f = [];
  let t = null, m = [], p = !1;
  const g = (e) => {
    t || s(""), (t.notes ??= []).push(e);
  }, d = () => {
    p = !1, t && (m.length > 0 && !t.bullets?.length && !t.body && !t.quoteText && (t.body = m.join(`
`).trim()), m = [], f.push(t), t = null);
  }, s = (e, o = "content") => {
    d(), t = { title: e, type: o };
  };
  for (let e = 0; e < c.length; e++) {
    const o = c[e], n = o.trim();
    if (n.startsWith("<!--")) {
      const i = [n.slice(4)];
      for (; !i[i.length - 1].includes("-->") && e + 1 < c.length; ) i.push(c[++e].trim());
      const a = i.length - 1;
      i[a] = i[a].slice(0, i[a].includes("-->") ? i[a].indexOf("-->") : void 0);
      const r = i.join(`
`).trim();
      r && g(r);
      continue;
    }
    if (/^---+\s*$/.test(n)) {
      d();
      continue;
    }
    const l = n.match(/^#\s+(.+)$/);
    if (l) {
      f.length === 0 && !t ? s(l[1], "title") : s(l[1]);
      continue;
    }
    const b = n.match(/^##\s+(.+)$/);
    if (b) {
      s(b[1]);
      continue;
    }
    const y = n.match(/^notes?:\s*(.*)$/i);
    if (y) {
      y[1] ? g(y[1]) : t || s(""), p = !0;
      continue;
    }
    if (p) {
      g(o.trimEnd());
      continue;
    }
    const $ = n.match(/^###\s+(.+)$/);
    if ($) {
      t ? m.push($[1]) : s($[1]);
      continue;
    }
    const k = n.match(/^>\s*(.+)$/);
    if (k) {
      const i = [k[1]];
      for (; e + 1 < c.length && /^>\s*/.test(c[e + 1].trim()); )
        e++, i.push(c[e].trim().replace(/^>\s*/, ""));
      const a = i.join(" ").trim(), r = a.match(/^(.+?)\s*[—–-]{1,2}\s*(.+)$/);
      t && t.type !== "title" && d(), t || (t = { title: "", type: "quote" }), r ? (t.type = "quote", t.quoteText = r[1].trim(), t.quoteAttribution = r[2].trim()) : (t.type = "quote", t.quoteText = a);
      continue;
    }
    const T = n.match(/^[-*]\s+(.+)$/);
    if (T) {
      t || s(""), t.bullets || (t.bullets = []), t.bullets.push(E(T[1]));
      continue;
    }
    const S = n.match(/^\d+\.\s+(.+)$/);
    if (S) {
      t || s(""), t.bullets || (t.bullets = []), t.bullets.push(E(S[1]));
      continue;
    }
    n !== "" && (t || s(""), m.push(E(n)));
  }
  d(), f.length === 0 && f.push({ title: "Untitled", type: "content", body: u.trim() });
  const C = 2e3, q = [], M = [];
  return f.forEach((e, o) => {
    const n = o * C;
    let l;
    switch (e.type) {
      case "title":
        l = v(e.title, e.body || e.bullets?.[0], h);
        break;
      case "quote":
        l = j(e.quoteText || "", e.quoteAttribution, h);
        break;
      case "closing":
        l = L(e.title, e.body, h);
        break;
      default:
        l = I(e.title, e.bullets, e.body, h);
        break;
    }
    const b = A(l, n, 0);
    q.push(...b), M.push({
      id: P("slide"),
      name: e.title || `Slide ${o + 1}`,
      spatialPosition: { x: n, y: 0 },
      dimensions: { width: 1920, height: 1080 },
      order: o,
      backgroundColor: h.background,
      ..._(e.notes) && { notes: _(e.notes) }
    });
  }), {
    version: 4,
    metadata: { name: "Markdown Import", docType: "slides" },
    elements: q,
    layers: [{ id: "default-layer", name: "Layer 1", visible: !0, locked: !1, opacity: 1, order: 0, backgroundColor: "transparent" }],
    slides: M,
    globalSettings: {}
  };
}
function _(u) {
  return (u ?? []).join(`
`).replace(/^\s*\n/, "").trimEnd();
}
function E(u) {
  return u.replace(/\*\*(.+?)\*\*/g, "$1").replace(/__(.+?)__/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/_(.+?)_/g, "$1").replace(/`(.+?)`/g, "$1").replace(/\[(.+?)\]\(.+?\)/g, "$1").trim();
}
export {
  G as parseMarkdownToSlides
};
