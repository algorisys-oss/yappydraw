import { P as j, d as A, t as B, b as O } from "./pdf-cmyk-CqVZV2FF.js";
function u(t) {
  if (/^[\x20-\x7e]*$/.test(t)) return `(${t.replace(/[\\()]/g, (e) => "\\" + e)})`;
  let o = "FEFF";
  for (let e = 0; e < t.length; e++) o += t.charCodeAt(e).toString(16).padStart(4, "0").toUpperCase();
  return `<${o}>`;
}
const T = (t) => t.replace(/[<>&"']/g, (o) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[o]), d = (t, o = 2) => String(Math.abs(t)).padStart(o, "0");
function k(t) {
  const o = -t.getTimezoneOffset(), e = o >= 0 ? "+" : "-", r = d(Math.floor(Math.abs(o) / 60)), c = d(Math.abs(o) % 60), f = t.getFullYear(), i = d(t.getMonth() + 1), x = d(t.getDate()), l = d(t.getHours()), $ = d(t.getMinutes()), D = d(t.getSeconds());
  return {
    pdf: `D:${f}${i}${x}${l}${$}${D}${e}${r}'${c}'`,
    xmp: `${f}-${i}-${x}T${l}:${$}:${D}${e}${r}:${c}`
  };
}
function V(t) {
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
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${T(t.title)}</rdf:li></rdf:Alt></dc:title>
   <xmp:CreateDate>${t.xmpDate}</xmp:CreateDate>
   <xmp:ModifyDate>${t.xmpDate}</xmp:ModifyDate>
   <xmp:MetadataDate>${t.xmpDate}</xmp:MetadataDate>
   <xmp:CreatorTool>YappyDraw</xmp:CreatorTool>
   <pdf:Producer>${T(t.producer)}</pdf:Producer>
   <pdf:Trapped>False</pdf:Trapped>
   <xmpMM:DocumentID>${t.documentId}</xmpMM:DocumentID>
   <xmpMM:InstanceID>${t.instanceId}</xmpMM:InstanceID>
   <xmpMM:VersionID>1</xmpMM:VersionID>
   <xmpMM:RenditionClass>default</xmpMM:RenditionClass>
   <pdfxid:GTS_PDFXVersion>PDF/X-4</pdfxid:GTS_PDFXVersion>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
const C = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`, z = (t) => new Set([...t.matchAll(/\/(F\d+)\s+[\d.]+\s+Tf/g)].map((o) => o[1]));
async function U(t, o) {
  const e = new j(t), r = e.ref("Root"), c = e.ref("Info");
  if (!r || !c) throw new Error("PDF/X: no catalog or info dictionary");
  const f = e.get(r);
  if (/\/OutputIntents|\/Metadata/.test(f.dict)) throw new Error("PDF/X: catalog already has an output intent or metadata");
  const i = k(o.now ?? /* @__PURE__ */ new Date()), x = o.ids ?? { documentId: `uuid:${C()}`, instanceId: `uuid:${C()}` }, l = /\/Producer\s*\(([^)]*)\)/.exec(e.get(c).dict)?.[1] ?? "jsPDF", $ = e.add(`<<
/N 4
/Filter /FlateDecode
>>`, await A(o.profileBytes)), D = e.add(`<<
/Type /OutputIntent
/S /GTS_PDFX
/OutputConditionIdentifier ${u(o.profile.outputConditionIdentifier)}
/OutputCondition ${u(o.profile.outputCondition)}
/RegistryName (http://www.color.org)
/Info ${u(o.profile.label)}
/DestOutputProfile ${$} 0 R
>>`), R = new TextEncoder().encode(V({ title: o.title, xmpDate: i.xmp, producer: l, ...x })), N = e.add(`<<
/Type /Metadata
/Subtype /XML
>>`, R);
  e.set(r, f.dict.replace(/>>\s*$/, `/OutputIntents [${D} 0 R]
/Metadata ${N} 0 R
>>`)), e.set(c, `<<
/Producer ${u(l)}
/Creator (YappyDraw)
/Title ${u(o.title)}
/CreationDate (${i.pdf})
/ModDate (${i.pdf})
/Trapped /False
/GTS_PDFXVersion (PDF/X-4)
>>`);
  const h = /* @__PURE__ */ new Set();
  for (const a of e.objectNumbers()) {
    const n = e.get(a);
    if (/\/Type\s*\/Page\b/.test(n.dict) && !n.stream) {
      const p = /\/MediaBox\s*\[\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\]/.exec(n.dict);
      if (!p) throw new Error(`PDF/X: page ${a} has no MediaBox`);
      const [g, M, w, s] = p.slice(1).map(Number), P = o.bleedPt, y = (m) => `[${+(g + m).toFixed(3)} ${+(M + m).toFixed(3)} ${+(w - m).toFixed(3)} ${+(s - m).toFixed(3)}]`, X = (P > 0 ? `/BleedBox ${y(0)} ` : "") + `/TrimBox ${y(P)}`;
      e.set(a, n.dict.replace(/>>\s*$/, `${X}
>>`));
      const E = /\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/.exec(n.dict)?.[1] ?? "";
      for (const m of E.matchAll(/(\d+)\s+0\s+R/g)) h.add(parseInt(m[1], 10));
    }
    n.stream && /\/Subtype\s*\/Form/.test(n.dict) && h.add(a);
  }
  const b = [];
  for (const a of h) {
    const n = e.get(a);
    n?.stream && b.push(B(await O(n.dict, n.stream)));
  }
  const F = /* @__PURE__ */ new Set();
  b.forEach((a) => z(a).forEach((n) => F.add(n)));
  const S = /* @__PURE__ */ new Set(), I = /* @__PURE__ */ new Set();
  for (const a of e.objectNumbers()) {
    const n = e.get(a);
    if (n.stream || !/^<<\s*\/ProcSet/.test(n.dict)) continue;
    const p = /\/Font\s*<<([^>]*)>>/.exec(n.dict);
    if (!p) continue;
    const g = [...p[1].matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)], M = g.filter((s) => F.has(s[1]));
    g.forEach((s) => (F.has(s[1]) ? I : S).add(parseInt(s[2], 10)));
    const w = M.length ? `/Font << ${M.map((s) => `/${s[1]} ${s[2]} 0 R`).join(" ")} >>` : "";
    e.set(a, n.dict.replace(p[0], w));
  }
  for (const a of S) I.has(a) || e.remove(a);
  return e.setVersion("1.6"), e.toBytes();
}
export {
  U as applyPdfX4,
  k as pdfAndXmpDates,
  u as pdfString,
  V as xmpPacket
};
