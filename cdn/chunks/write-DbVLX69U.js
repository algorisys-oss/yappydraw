import { r as E, X as m, N as y, z as ae, e as $, E as c, a as V, p as P, b as le, c as se, f as re, R as o } from "./custgeom-DK60FLyH.js";
const k = 914400, I = 51206400, M = `xmlns:a="${y.a}" xmlns:r="${y.r}" xmlns:p="${y.p}"`, f = {
  presentation: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  slide: "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
  slideLayout: "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",
  slideMaster: "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
  theme: "application/vnd.openxmlformats-officedocument.theme+xml",
  presProps: "application/vnd.openxmlformats-officedocument.presentationml.presProps+xml",
  viewProps: "application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml",
  tableStyles: "application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml",
  core: "application/vnd.openxmlformats-package.core-properties+xml",
  app: "application/vnd.openxmlformats-officedocument.extended-properties+xml"
}, ne = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, H = (e) => {
  const t = String(e || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(t) ? t.toUpperCase() : "000000";
}, C = (e) => {
  const t = e.alpha;
  return t !== void 0 && t < 1 ? `<a:srgbClr val="${H(e.hex)}"><a:alpha val="${P(t)}"/></a:srgbClr>` : `<a:srgbClr val="${H(e.hex)}"/>`;
}, Y = (e) => {
  const t = [...e].sort((a, r) => a.pos - r.pos);
  return "<a:gsLst>" + (t.length === 1 ? [{ ...t[0], pos: 0 }, { ...t[0], pos: 1 }] : t).map((a) => `<a:gs pos="${P(a.pos)}">${C(a.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function W(e) {
  if (!e || e.kind === "none") return "<a:noFill/>";
  switch (e.kind) {
    case "solid":
      return `<a:solidFill>${C(e.color)}</a:solidFill>`;
    case "linear":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${Y(e.stops)}<a:lin ang="${V(e.angle)}" scaled="${e.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${Y(e.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${$(e.preset)}"><a:fgClr>${C(e.color)}</a:fgClr><a:bgClr><a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr></a:bgClr></a:pattFill>`;
  }
}
function q(e, t) {
  if (!e || !(e.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let a = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(e.width * t * c)))}"${e.cap ? ` cap="${e.cap}"` : ""}><a:solidFill>${C(e.color)}</a:solidFill>`;
  e.dash && (a += `<a:prstDash val="${$(e.dash)}"/>`), e.join === "round" ? a += "<a:round/>" : e.join === "bevel" ? a += "<a:bevel/>" : e.join === "miter" && (a += '<a:miter lim="800000"/>');
  const r = (s, n) => n ? `<a:${s} type="${n.type}" w="${n.size ?? "med"}" len="${n.size ?? "med"}"/>` : "";
  return a += r("headEnd", e.head) + r("tailEnd", e.tail), a + "</a:ln>";
}
function z(e, t, l = "a:rPr") {
  const a = ['lang="en-US"'];
  e.size && a.push(`sz="${re(e.size * t)}"`), e.bold !== void 0 && a.push(`b="${e.bold ? 1 : 0}"`), e.italic !== void 0 && a.push(`i="${e.italic ? 1 : 0}"`), e.underline && a.push('u="sng"'), e.strike && a.push('strike="sngStrike"'), a.push('dirty="0"');
  let r = "";
  if (e.color && (r += `<a:solidFill>${C(e.color)}</a:solidFill>`), e.font) {
    const s = $(e.font);
    r += `<a:latin typeface="${s}"/><a:ea typeface="${s}"/><a:cs typeface="${s}"/>`;
  }
  return r ? `<${l} ${a.join(" ")}>${r}</${l}>` : `<${l} ${a.join(" ")}/>`;
}
const pe = 20, oe = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), ie = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function ce(e, t, l) {
  const a = Math.max(0, Math.min(8, e.level ?? 0)), r = [];
  e.align && r.push(`algn="${e.align}"`);
  let s = "";
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 1e-3 && (s += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, t.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const n = (i, d) => d && d > 0 ? `<a:${i}><a:spcPts val="${Math.round(Math.min(1584, d * l * 0.75) * 100)}"/></a:${i}>` : "";
  if (s += n("spcBef", e.spaceBefore) + n("spcAft", e.spaceAfter), e.bullet) {
    const i = pe * l * c, d = e.marL !== void 0 ? e.marL * l * c : i * (a + 1), L = e.indent !== void 0 ? e.indent * l * c : -i, S = (h, g) => Math.round(Math.max(g, Math.min(51206400, h)));
    if (r.push(`marL="${S(d, 0)}" indent="${S(L, -51206400)}"`), a && r.push(`lvl="${a}"`), e.bulletColor && (s += `<a:buClr>${C(e.bulletColor)}</a:buClr>`), e.bulletScale && Math.abs(e.bulletScale - 1) > 1e-3 && (s += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, e.bulletScale)) * 1e5)}"/>`), e.bullet === "num") {
      const h = e.numType && ie.test(e.numType) ? e.numType : "arabicPeriod", g = e.startAt && e.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(e.startAt))}"` : "";
      s += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${h}"${g}/>`;
    } else {
      const h = e.bulletChar || "•";
      s += `<a:buFont typeface="${oe.has(h) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${$(h)}"/>`;
    }
  } else
    a && r.push(`lvl="${a}"`), s += "<a:buNone/>";
  const x = `<a:pPr${r.length ? " " + r.join(" ") : ""}>${s}</a:pPr>`, u = t.defaults ?? {};
  let p = "";
  for (const i of e.runs) {
    const d = { ...u, ...de(i) };
    if (i.br) {
      p += `<a:br>${z(d, l)}</a:br>`;
      continue;
    }
    i.text && (p += `<a:r>${z(d, l)}<a:t>${$(i.text)}</a:t></a:r>`);
  }
  const F = e.endSize ?? u.size;
  return `<a:p>${x}${p}${z({ ...u, size: F }, l, "a:endParaRPr")}</a:p>`;
}
const de = (e) => Object.fromEntries(Object.entries(e).filter(([, t]) => t !== void 0));
function me(e, t, l = "p:txBody") {
  if (!e) return "";
  const a = (n) => Math.max(0, Math.round(n * t * c)), r = `<a:bodyPr wrap="${e.wrap ? "square" : "none"}" lIns="${a(e.insets.l)}" tIns="${a(e.insets.t)}" rIns="${a(e.insets.r)}" bIns="${a(e.insets.b)}" anchor="${e.anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr>`, s = e.paragraphs.length ? e.paragraphs : [{ runs: [] }];
  return `<${l}>${r}<a:lstStyle/>${s.map((n) => ce(n, e, t)).join("")}</${l}>`;
}
const Z = (e, t, l) => e.kind === "preset" ? le(e.prst, e.adj) : se(e.paths, t, l), D = (e, t, l = "a:xfrm", a = !1) => {
  const r = Math.round((e.x * t.s + t.dx) * c), s = Math.round((e.y * t.s + t.dy) * c), n = Math.max(0, Math.round(Math.abs(e.w) * t.s * c)), x = Math.max(0, Math.round(Math.abs(e.h) * t.s * c)), u = [
    e.rot ? `rot="${V(e.rot)}"` : "",
    e.flipH ? 'flipH="1"' : "",
    e.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), p = a ? `<a:chOff x="${r}" y="${s}"/><a:chExt cx="${n}" cy="${x}"/>` : "";
  return `<${l}${u ? " " + u : ""}><a:off x="${r}" y="${s}"/><a:ext cx="${n}" cy="${x}"/>${p}</${l}>`;
}, R = (e, t) => `<p:cNvPr id="${e.id}" name="${$(e.name)}"${t ? ` descr="${$(t)}"` : ""}/>`;
function fe(e, t) {
  const l = `<p:nvSpPr>${R(e)}<p:cNvSpPr${e.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, a = `<p:spPr>${D(e, t)}${Z(e.geom, e.w, e.h)}${W(e.fill)}${q(e.line, t.s)}</p:spPr>`, r = e.text ? me(e.text, t.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${l}${a}${r}</p:sp>`;
}
function he(e, t) {
  const l = (r, s) => s ? `<a:${r} id="${s.id}" idx="${s.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${R(e)}<p:cNvCxnSpPr>${l("stCxn", e.start)}${l("endCxn", e.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${D(e, t)}${Z(e.geom, e.w, e.h)}<a:noFill/>${q(e.line, t.s)}</p:spPr></p:cxnSp>`;
}
function $e(e, t) {
  const l = t.media(e.media), a = `<p:nvPicPr>${R(e, e.descr)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, r = e.alpha !== void 0 && e.alpha < 1 ? `<a:alphaModFix amt="${P(e.alpha)}"/>` : "", s = e.crop, n = s ? `<a:srcRect l="${P(s.l)}" t="${P(s.t)}" r="${P(s.r)}" b="${P(s.b)}"/>` : "", x = `<p:blipFill><a:blip r:embed="${l}">${r}</a:blip>${n}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${a}${x}<p:spPr>${D(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function xe(e, t) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${R(e)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${D(e, t, "a:xfrm", !0)}</p:grpSpPr>${e.children.map((a) => J(a, t)).join("")}</p:grpSp>`;
}
function J(e, t) {
  switch (e.kind) {
    case "shape":
      return fe(e, t);
    case "connector":
      return he(e, t);
    case "picture":
      return $e(e, t);
    case "group":
      return e.children.length ? xe(e, t) : "";
  }
}
const B = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function ue(e) {
  if (!e) return "";
  const t = Math.max(0, Math.min(6e4, Math.round(e.durationMs))), l = t <= 600 ? "fast" : t <= 900 ? "med" : "slow", a = e.kind === "push" ? `<p:push dir="${e.dir ?? "l"}"/>` : e.kind === "zoom" ? `<p:zoom dir="${e.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return `<mc:AlternateContent xmlns:mc="${y.mc}"><mc:Choice xmlns:p14="${y.p14}" Requires="p14"><p:transition spd="${l}" p14:dur="${t}">${a}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${l}">${a}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
function ge(e, t) {
  let l = "";
  const a = e.background;
  a && a.kind === "image" ? l = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${t.media(a.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : a && a.kind !== "none" && (l = `<p:bg><p:bgPr>${W(a)}<a:effectLst/></p:bgPr></p:bg>`);
  const r = e.items.map((n) => J(n, t)).join(""), s = e.name ? ` name="${$(e.name)}"` : "";
  return m + `<p:sld ${M}><p:cSld${s}>${l}<p:spTree>${B}${r}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${ue(e.transition)}</p:sld>`;
}
const A = (e, t = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${t}<a:defRPr sz="${e}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, ye = m + `<a:theme xmlns:a="${y.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, ve = m + `<p:sldMaster ${M}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${B}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${A(4400)}</p:titleStyle><p:bodyStyle>${A(2800)}</p:bodyStyle><p:otherStyle>${A(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, Pe = m + `<p:sldLayout ${M} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${B}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, Se = m + `<p:presentationPr ${M}/>`, be = m + `<p:viewPr ${M}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, Ce = m + `<a:tblStyleLst xmlns:a="${y.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, Me = (e, t) => m + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${$(e)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${t}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${t}</dcterms:modified></cp:coreProperties>`, Fe = (e) => m + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${e}</Slides><PresentationFormat>Custom</PresentationFormat></Properties>`;
function we(e, t = {}) {
  const l = Math.max(1, e.width), a = Math.max(1, e.height), r = Math.max(l, a) * c, s = Math.min(l, a) * c, n = r > I ? I / r : s < k ? Math.min(k / s, I / r) : 1, x = Math.max(k, Math.min(I, Math.round(l * n * c))), u = Math.max(k, Math.min(I, Math.round(a * n * c))), p = /* @__PURE__ */ new Map(), F = [], i = /* @__PURE__ */ new Set();
  let d = 0;
  const L = e.slides.length ? e.slides : [{ items: [] }], S = [{ id: "rId1", type: o.slideMaster, target: "slideMasters/slideMaster1.xml" }];
  let h = "";
  L.forEach((v, X) => {
    const b = X + 1, T = [{ id: "rId1", type: o.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], N = /* @__PURE__ */ new Map(), _ = v.fit ?? { scale: 1, dx: 0, dy: 0 }, te = {
      s: _.scale * n,
      dx: _.dx * n,
      dy: _.dy * n,
      rels: T,
      media: (w) => {
        const U = N.get(w);
        if (U) return U;
        d++;
        const G = `image${d}.${w.ext}`;
        p.set(`ppt/media/${G}`, w.bytes), i.add(w.ext);
        const j = `rId${T.length + 1}`;
        return T.push({ id: j, type: o.image, target: `../media/${G}` }), N.set(w, j), j;
      }
    };
    p.set(`ppt/slides/slide${b}.xml`, ge(v, te)), p.set(`ppt/slides/_rels/slide${b}.xml.rels`, E(T)), F.push([`/ppt/slides/slide${b}.xml`, f.slide]);
    const O = `rId${b + 1}`;
    S.push({ id: O, type: o.slide, target: `slides/slide${b}.xml` }), h += `<p:sldId id="${255 + b}" r:id="${O}"/>`;
  });
  const g = L.length + 2;
  S.push(
    { id: `rId${g}`, type: o.theme, target: "theme/theme1.xml" },
    { id: `rId${g + 1}`, type: o.presProps, target: "presProps.xml" },
    { id: `rId${g + 2}`, type: o.viewProps, target: "viewProps.xml" },
    { id: `rId${g + 3}`, type: o.tableStyles, target: "tableStyles.xml" }
  );
  const K = m + `<p:presentation ${M} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${h}</p:sldIdLst><p:sldSz cx="${x}" cy="${u}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${A(1800)}</p:defaultTextStyle></p:presentation>`;
  p.set("ppt/presentation.xml", K), p.set("ppt/_rels/presentation.xml.rels", E(S)), p.set("ppt/slideMasters/slideMaster1.xml", ve), p.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", E([
    { id: "rId1", type: o.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: o.theme, target: "../theme/theme1.xml" }
  ])), p.set("ppt/slideLayouts/slideLayout1.xml", Pe), p.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", E([
    { id: "rId1", type: o.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), p.set("ppt/theme/theme1.xml", ye), p.set("ppt/presProps.xml", Se), p.set("ppt/viewProps.xml", be), p.set("ppt/tableStyles.xml", Ce);
  const Q = t.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  p.set("docProps/core.xml", Me(e.title || "YappyDraw presentation", Q)), p.set("docProps/app.xml", Fe(L.length)), p.set("_rels/.rels", E([
    { id: "rId1", type: o.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: o.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: o.extProps, target: "docProps/app.xml" }
  ])), F.push(
    ["/ppt/presentation.xml", f.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", f.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", f.slideLayout],
    ["/ppt/theme/theme1.xml", f.theme],
    ["/ppt/presProps.xml", f.presProps],
    ["/ppt/viewProps.xml", f.viewProps],
    ["/ppt/tableStyles.xml", f.tableStyles],
    ["/docProps/core.xml", f.core],
    ["/docProps/app.xml", f.app]
  );
  const ee = m + `<Types xmlns="${y.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...i].map((v) => `<Default Extension="${v}" ContentType="${ne[v]}"/>`).join("") + F.map(([v, X]) => `<Override PartName="${v}" ContentType="${X}"/>`).join("") + "</Types>";
  return p.set("[Content_Types].xml", ee), ae(p);
}
export {
  we as buildPptx
};
