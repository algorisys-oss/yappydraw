import { P as A, d as Y, t as B, b as E } from "./pdf-cmyk-CqVZV2FF.js";
function w(e) {
  if (/^[\x20-\x7e]*$/.test(e)) return `(${e.replace(/[\\()]/g, (s) => "\\" + s)})`;
  let t = "FEFF";
  for (let s = 0; s < e.length; s++) t += e.charCodeAt(s).toString(16).padStart(4, "0").toUpperCase();
  return `<${t}>`;
}
const X = (e) => e.replace(/[<>&"']/g, (t) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[t]), F = (e, t = 2) => String(Math.abs(e)).padStart(t, "0");
function _(e) {
  const t = -e.getTimezoneOffset(), s = t >= 0 ? "+" : "-", o = F(Math.floor(Math.abs(t) / 60)), n = F(Math.abs(t) % 60), p = e.getFullYear(), m = F(e.getMonth() + 1), l = F(e.getDate()), x = F(e.getHours()), D = F(e.getMinutes()), $ = F(e.getSeconds());
  return {
    pdf: `D:${p}${m}${l}${x}${D}${$}${s}${o}'${n}'`,
    xmp: `${p}-${m}-${l}T${x}:${D}:${$}${s}${o}:${n}`
  };
}
function K(e) {
  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:xmp="http://ns.adobe.com/xap/1.0/"
    xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
    xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"
    xmlns:pdfxid="http://www.npes.org/pdfx/ns/id/">
   <dc:format>application/pdf</dc:format>
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${X(e.title)}</rdf:li></rdf:Alt></dc:title>
   <xmp:CreateDate>${e.xmpDate}</xmp:CreateDate>
   <xmp:ModifyDate>${e.xmpDate}</xmp:ModifyDate>
   <xmp:MetadataDate>${e.xmpDate}</xmp:MetadataDate>
   <xmp:CreatorTool>YappyDraw</xmp:CreatorTool>
   <pdf:Producer>${X(e.producer)}</pdf:Producer>
   <pdf:Trapped>False</pdf:Trapped>
   <xmpMM:DocumentID>${e.documentId}</xmpMM:DocumentID>
   <xmpMM:InstanceID>${e.instanceId}</xmpMM:InstanceID>
   <xmpMM:VersionID>1</xmpMM:VersionID>
   <xmpMM:RenditionClass>default</xmpMM:RenditionClass>
   <pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
const j = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`, U = (e) => new Set([...e.matchAll(/\/(F\d+)\s+[\d.]+\s+Tf/g)].map((t) => t[1]));
async function W(e, t) {
  const s = new A(e), o = s.ref("Root"), n = s.ref("Info");
  if (!o || !n) throw new Error("PDF/X: no catalog or info dictionary");
  const p = s.get(o);
  if (/\/OutputIntents|\/Metadata/.test(p.dict)) throw new Error("PDF/X: catalog already has an output intent or metadata");
  const m = _(t.now ?? /* @__PURE__ */ new Date()), l = t.ids ?? { documentId: `uuid:${j()}`, instanceId: `uuid:${j()}` }, x = /\/Producer\s*\(([^)]*)\)/.exec(s.get(n).dict)?.[1] ?? "jsPDF", D = s.add(`<<
/N 4
/Filter /FlateDecode
>>`, await Y(t.profileBytes)), $ = s.add(`<<
/Type /OutputIntent
/S /GTS_PDFX
/OutputConditionIdentifier ${w(t.profile.outputConditionIdentifier)}
/OutputCondition ${w(t.profile.outputCondition)}
/RegistryName (http://www.color.org)
/Info ${w(t.profile.label)}
/DestOutputProfile ${D} 0 R
>>`), P = new TextEncoder().encode(K({ title: t.title, xmpDate: m.xmp, producer: x, ...l })), T = s.add(`<<
/Type /Metadata
/Subtype /XML
>>`, P), I = p.dict.replace(/\/OpenAction\s*\[[^\]]*\]\s*/, "");
  s.set(o, I.replace(/>>\s*$/, `/OutputIntents [${$} 0 R]
/Metadata ${T} 0 R
>>`)), s.set(n, `<<
/Producer ${w(x)}
/Creator (YappyDraw)
/Title ${w(t.title)}
/CreationDate (${m.pdf})
/ModDate (${m.pdf})
/Trapped /False
/GTS_PDFXVersion (PDF/X-4)
>>`);
  const S = /* @__PURE__ */ new Set();
  for (const a of s.objectNumbers()) {
    const c = s.get(a);
    if (/\/Type\s*\/Page\b/.test(c.dict) && !c.stream) {
      const u = /\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/.exec(c.dict);
      if (!u) throw new Error(`PDF/X: page ${a} has no MediaBox`);
      const [h, g, f, d] = u.slice(1).map(Number), N = t.bleedPt, G = (y) => `[${+(h + y).toFixed(3)} ${+(g + y).toFixed(3)} ${+(f - y).toFixed(3)} ${+(d - y).toFixed(3)}]`, v = (N > 0 ? `/BleedBox ${G(0)} ` : "") + `/TrimBox ${G(N)}`;
      s.set(a, c.dict.replace(/>>\s*$/, `${v}
>>`));
      const V = /\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(c.dict)?.[1] ?? "";
      for (const y of V.matchAll(/(\d+)\s+0\s+R/g)) S.add(parseInt(y[1], 10));
    }
    c.stream && /\/Subtype\s*\/Form/.test(c.dict) && S.add(a);
  }
  const C = [];
  for (const a of S) {
    const c = s.get(a);
    c?.stream && C.push(B(await E(c.dict, c.stream)));
  }
  const b = /* @__PURE__ */ new Set();
  C.forEach((a) => U(a).forEach((c) => b.add(c)));
  const M = /* @__PURE__ */ new Set(), R = /* @__PURE__ */ new Set();
  for (const a of s.objectNumbers()) {
    const c = s.get(a);
    if (c.stream || !/^<<\s*\/ProcSet/.test(c.dict)) continue;
    const u = /\/Font\s*<<([^>]*)>>/.exec(c.dict);
    if (!u) continue;
    const h = [...u[1].matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)], g = h.filter((d) => b.has(d[1]));
    h.forEach((d) => (b.has(d[1]) ? R : M).add(parseInt(d[2], 10)));
    const f = g.length ? `/Font << ${g.map((d) => `/${d[1]} ${d[2]} 0 R`).join(" ")} >>` : "";
    s.set(a, c.dict.replace(u[0], f));
  }
  for (const a of M) R.has(a) || s.remove(a);
  L(s), s.setVersion("1.6");
  const r = s.toBytes(), i = await H(r);
  if (i.length) throw new z(i);
  return r;
}
class z extends Error {
  problems;
  constructor(t) {
    super(`PDF/X-4 check failed: ${t.join("; ")}`), this.problems = t;
  }
}
function k(e) {
  const t = /* @__PURE__ */ new Set();
  for (const s of e.objectNumbers()) {
    const o = e.get(s);
    /\/Type\s*\/ExtGState/.test(o.dict) && t.add(s);
    const n = /\/ExtGState\s*<<([^>]*)>>/.exec(o.dict)?.[1] ?? "";
    for (const p of n.matchAll(/(\d+)\s+0\s+R/g)) t.add(parseInt(p[1], 10));
  }
  for (const s of e.objectNumbers()) {
    const o = e.get(s);
    if (t.has(s)) {
      const n = [...o.dict.matchAll(/\/(?:ca|CA)\s+([\d.]+)/g)].some((l) => parseFloat(l[1]) < 1), p = /\/SMask\s*(?!\/None)[<\d]/.test(o.dict), m = /\/BM\s*\/(?!Normal\b|Compatible\b)\w+/.test(o.dict);
      if (n || p || m) return !0;
    }
    if (/\/Subtype\s*\/Image/.test(o.dict) && /\/SMask\s+\d+\s+0\s+R/.test(o.dict)) return !0;
  }
  return !1;
}
function O(e) {
  const t = /* @__PURE__ */ new Set();
  for (const s of e.objectNumbers()) {
    const o = /\/S\s*\/Luminosity[\s\S]*?\/G\s+(\d+)\s+0\s+R/.exec(e.get(s).dict);
    o && t.add(parseInt(o[1], 10));
  }
  return t;
}
function L(e) {
  const t = O(e);
  for (const s of e.objectNumbers()) {
    const o = e.get(s);
    t.has(s) || !/\/Group\s*<<[^>]*\/CS\s*\/DeviceRGB/.test(o.dict) || e.set(s, o.dict.replace(/(\/Group\s*<<[^>]*\/CS\s*)\/DeviceRGB/, "$1/DeviceCMYK"), o.stream);
  }
  if (k(e))
    for (const s of e.objectNumbers()) {
      const o = e.get(s);
      o.stream || !/\/Type\s*\/Page\b/.test(o.dict) || /\/Group\s*</.test(o.dict) || e.set(s, o.dict.replace(/>>\s*$/, `/Group << /Type /Group /S /Transparency /CS /DeviceCMYK >>
>>`));
    }
}
async function H(e) {
  const t = [], s = B(e.subarray(0, 8)), o = /^%PDF-(\d\.\d)/.exec(s)?.[1];
  (!o || parseFloat(o) > 1.6) && t.push(`PDF version ${o ?? "?"} (PDF/X-4 is at most 1.6)`);
  let n;
  try {
    n = new A(e);
  } catch (r) {
    return [...t, `unreadable: ${r.message}`];
  }
  /\/Encrypt\b/.test(n.getTrailer()) && t.push("the file is encrypted"), /\/ID\s*\[/.test(n.getTrailer()) || t.push("no file /ID in the trailer");
  const p = n.get(n.ref("Root") ?? -1)?.dict ?? "";
  /\/OpenAction|\/AA\b/.test(p) && t.push("the catalog has document actions");
  const m = /\/OutputIntents\s*\[\s*(\d+)\s+0\s+R/.exec(p)?.[1], l = m ? n.get(+m)?.dict ?? "" : "";
  /\/S\s*\/GTS_PDFX/.test(l) || t.push("no GTS_PDFX output intent"), /\/OutputConditionIdentifier\s*[(<]/.test(l) || t.push("the output intent has no OutputConditionIdentifier");
  const x = /\/DestOutputProfile\s+(\d+)\s+0\s+R/.exec(l)?.[1], D = x ? n.get(+x) : null;
  (!D?.stream || !/\/N\s+4\b/.test(D.dict)) && t.push("the output intent has no embedded CMYK profile");
  const $ = /\/Metadata\s+(\d+)\s+0\s+R/.exec(p)?.[1], P = $ ? new TextDecoder().decode(n.get(+$)?.stream ?? new Uint8Array()) : "";
  /<pdfxid:GTS_PDFXVersion>PDF\/X-4<\/pdfxid:GTS_PDFXVersion>/.test(P) || t.push("XMP does not identify PDF/X-4");
  const T = n.get(n.ref("Info") ?? -1)?.dict ?? "";
  /\/Trapped\s*\/(True|False)/.test(T) || t.push("Info has no /Trapped True or False"), /\/Title\s*[(<]/.test(T) || t.push("Info has no /Title");
  const I = /\/CreationDate\s*\(D:(\d{14})/.exec(T)?.[1], S = /<xmp:CreateDate>(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/.exec(P)?.slice(1).join("");
  (!I || I !== S) && t.push("Info and XMP creation dates disagree"), /\/ModDate\s*\(D:/.test(T) || t.push("Info has no /ModDate");
  const C = k(n), b = /* @__PURE__ */ new Set();
  for (const r of n.objectNumbers()) {
    const i = n.get(r);
    if (i.stream || !/\/Type\s*\/Page\b/.test(i.dict)) continue;
    const a = (f) => {
      const d = new RegExp(`/${f}\\s*\\[\\s*([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)`).exec(i.dict);
      return d ? d.slice(1).map(Number) : null;
    }, c = a("MediaBox"), u = a("TrimBox"), h = a("BleedBox"), g = (f, d) => f[0] >= d[0] - 1e-3 && f[1] >= d[1] - 1e-3 && f[2] <= d[2] + 1e-3 && f[3] <= d[3] + 1e-3;
    c || t.push(`page ${r}: no MediaBox`), u || t.push(`page ${r}: no TrimBox`), c && u && !g(u, c) && t.push(`page ${r}: TrimBox outside the MediaBox`), h && c && u && !(g(u, h) && g(h, c)) && t.push(`page ${r}: BleedBox not between TrimBox and MediaBox`), C && !/\/Group\s*<<[^>]*\/S\s*\/Transparency[^>]*\/CS\s*\/DeviceCMYK/.test(i.dict) && t.push(`page ${r}: transparency without a CMYK page group`);
    for (const f of (/\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(i.dict)?.[1] ?? "").matchAll(/(\d+)\s+0\s+R/g)) b.add(+f[1]);
  }
  const M = [], R = O(n);
  for (const r of n.objectNumbers()) {
    const i = n.get(r);
    /\/Subtype\s*\/Form/.test(i.dict) && b.add(r), /\/DeviceRGB|\/CalRGB/.test(i.dict) && !R.has(r) && M.push(r);
  }
  M.length && t.push(`RGB colour space in object${M.length > 1 ? "s" : ""} ${M.join(", ")}`);
  for (const r of b) {
    const i = n.get(r);
    if (!i?.stream) continue;
    const a = B(await E(i.dict, i.stream));
    /(^|\s)[\d.]+\s+[\d.]+\s+[\d.]+\s+(rg|RG)(?=\s)/.test(a) && t.push(`RGB colour operators in content stream ${r}`);
  }
  for (const r of n.objectNumbers()) {
    const i = n.get(r);
    if (/\/Type\s*\/Font\b/.test(i.dict) && /\/Subtype\s*\/(Type1|TrueType|MMType1|CIDFontType[02])\b/.test(i.dict)) {
      const a = /\/FontDescriptor\s+(\d+)\s+0\s+R/.exec(i.dict)?.[1], c = a ? n.get(+a)?.dict ?? "" : "";
      /\/FontFile[23]?\s+\d+\s+0\s+R/.test(c) || t.push(`font ${/\/BaseFont\s*\/([^\s/]+)/.exec(i.dict)?.[1] ?? r} is not embedded`);
    }
  }
  return t;
}
export {
  z as PdfXError,
  W as applyPdfX4,
  _ as pdfAndXmpDates,
  w as pdfString,
  H as verifyPdfX4,
  K as xmpPacket
};
