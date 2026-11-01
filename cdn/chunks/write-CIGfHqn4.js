import { r as L, X as x, N as v, z as ie, e as S, E as $, a as ee, p as F, b as ce, c as de, R as o, f as me } from "./custgeom-gp_HWEYw.js";
const D = 914400, R = 51206400, b = `xmlns:a="${v.a}" xmlns:r="${v.r}" xmlns:p="${v.p}"`, f = {
  presentation: "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml",
  slide: "application/vnd.openxmlformats-officedocument.presentationml.slide+xml",
  slideLayout: "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml",
  slideMaster: "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml",
  theme: "application/vnd.openxmlformats-officedocument.theme+xml",
  presProps: "application/vnd.openxmlformats-officedocument.presentationml.presProps+xml",
  viewProps: "application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml",
  tableStyles: "application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml",
  notesMaster: "application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml",
  notesSlide: "application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml",
  core: "application/vnd.openxmlformats-package.core-properties+xml",
  app: "application/vnd.openxmlformats-officedocument.extended-properties+xml"
}, he = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, q = (e) => {
  const t = String(e || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(t) ? t.toUpperCase() : "000000";
}, k = (e) => {
  const t = e.alpha;
  return t !== void 0 && t < 1 ? `<a:srgbClr val="${q(e.hex)}"><a:alpha val="${F(t)}"/></a:srgbClr>` : `<a:srgbClr val="${q(e.hex)}"/>`;
}, Z = (e) => {
  const t = [...e].sort((a, l) => a.pos - l.pos);
  return "<a:gsLst>" + (t.length === 1 ? [{ ...t[0], pos: 0 }, { ...t[0], pos: 1 }] : t).map((a) => `<a:gs pos="${F(a.pos)}">${k(a.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function te(e) {
  if (!e || e.kind === "none") return "<a:noFill/>";
  switch (e.kind) {
    case "solid":
      return `<a:solidFill>${k(e.color)}</a:solidFill>`;
    case "linear":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${Z(e.stops)}<a:lin ang="${ee(e.angle)}" scaled="${e.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${Z(e.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${S(e.preset)}"><a:fgClr>${k(e.color)}</a:fgClr><a:bgClr>${e.bg ? k(e.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function ae(e, t) {
  if (!e || !(e.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let a = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(e.width * t * $)))}"${e.cap ? ` cap="${e.cap}"` : ""}><a:solidFill>${k(e.color)}</a:solidFill>`;
  e.dash && (a += `<a:prstDash val="${S(e.dash)}"/>`), e.join === "round" ? a += "<a:round/>" : e.join === "bevel" ? a += "<a:bevel/>" : e.join === "miter" && (a += '<a:miter lim="800000"/>');
  const l = (r, p) => p ? `<a:${r} type="${p.type}" w="${p.size ?? "med"}" len="${p.size ?? "med"}"/>` : "";
  return a += l("headEnd", e.head) + l("tailEnd", e.tail), a + "</a:ln>";
}
function O(e, t, s = "a:rPr") {
  const a = ['lang="en-US"'];
  e.size && a.push(`sz="${me(e.size * t)}"`), e.bold !== void 0 && a.push(`b="${e.bold ? 1 : 0}"`), e.italic !== void 0 && a.push(`i="${e.italic ? 1 : 0}"`), e.underline && a.push('u="sng"'), e.strike && a.push('strike="sngStrike"'), a.push('dirty="0"');
  let l = "";
  if (e.color && (l += `<a:solidFill>${k(e.color)}</a:solidFill>`), e.font) {
    const r = S(e.font);
    l += `<a:latin typeface="${r}"/><a:ea typeface="${r}"/><a:cs typeface="${r}"/>`;
  }
  return l ? `<${s} ${a.join(" ")}>${l}</${s}>` : `<${s} ${a.join(" ")}/>`;
}
const fe = 20, $e = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), xe = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function ue(e, t, s) {
  const a = Math.max(0, Math.min(8, e.level ?? 0)), l = [];
  e.align && l.push(`algn="${e.align}"`);
  let r = "";
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 1e-3 && (r += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, t.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const p = (c, h) => h && h > 0 ? `<a:${c}><a:spcPts val="${Math.round(Math.min(1584, h * s * 0.75) * 100)}"/></a:${c}>` : "";
  if (r += p("spcBef", e.spaceBefore) + p("spcAft", e.spaceAfter), e.bullet) {
    const c = fe * s * $, h = e.marL !== void 0 ? e.marL * s * $ : c * (a + 1), P = e.indent !== void 0 ? e.indent * s * $ : -c, M = (g, w) => Math.round(Math.max(w, Math.min(51206400, g)));
    if (l.push(`marL="${M(h, 0)}" indent="${M(P, -51206400)}"`), a && l.push(`lvl="${a}"`), e.bulletColor && (r += `<a:buClr>${k(e.bulletColor)}</a:buClr>`), e.bulletScale && Math.abs(e.bulletScale - 1) > 1e-3 && (r += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, e.bulletScale)) * 1e5)}"/>`), e.bullet === "num") {
      const g = e.numType && xe.test(e.numType) ? e.numType : "arabicPeriod", w = e.startAt && e.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(e.startAt))}"` : "";
      r += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${g}"${w}/>`;
    } else {
      const g = e.bulletChar || "•";
      r += `<a:buFont typeface="${$e.has(g) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${S(g)}"/>`;
    }
  } else
    a && l.push(`lvl="${a}"`), r += "<a:buNone/>";
  const d = `<a:pPr${l.length ? " " + l.join(" ") : ""}>${r}</a:pPr>`, m = t.defaults ?? {};
  let n = "";
  for (const c of e.runs) {
    const h = { ...m, ...ge(c) };
    if (c.br) {
      n += `<a:br>${O(h, s)}</a:br>`;
      continue;
    }
    c.text && (n += `<a:r>${O(h, s)}<a:t>${S(c.text)}</a:t></a:r>`);
  }
  const u = e.endSize ?? m.size;
  return `<a:p>${d}${n}${O({ ...m, size: u }, s, "a:endParaRPr")}</a:p>`;
}
const ge = (e) => Object.fromEntries(Object.entries(e).filter(([, t]) => t !== void 0));
function ye(e, t, s = "p:txBody") {
  if (!e) return "";
  const a = (p) => Math.max(0, Math.round(p * t * $)), l = `<a:bodyPr wrap="${e.wrap ? "square" : "none"}" lIns="${a(e.insets.l)}" tIns="${a(e.insets.t)}" rIns="${a(e.insets.r)}" bIns="${a(e.insets.b)}" anchor="${e.anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr>`, r = e.paragraphs.length ? e.paragraphs : [{ runs: [] }];
  return `<${s}>${l}<a:lstStyle/>${r.map((p) => ue(p, e, t)).join("")}</${s}>`;
}
const se = (e, t, s) => e.kind === "preset" ? ce(e.prst, e.adj) : de(e.paths, t, s), Pe = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function Se(e, t) {
  if (!e) return "";
  const s = (l, r, p) => {
    const d = t.rels.find((n) => n.type === l && n.target === r);
    if (d) return d.id;
    const m = `rId${t.rels.length + 1}`;
    return t.rels.push({ id: m, type: l, target: r, external: p }), m;
  };
  if (e.kind === "url") return `<a:hlinkClick r:id="${s(o.hyperlink, e.url, !0)}"/>`;
  if (e.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${Pe[e.action]}"/>`;
  const a = t.slideNumber?.(e.key);
  return a ? `<a:hlinkClick r:id="${s(o.slide, `slide${a}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const B = (e, t, s = "a:xfrm", a = !1) => {
  const l = Math.round((e.x * t.s + t.dx) * $), r = Math.round((e.y * t.s + t.dy) * $), p = Math.max(0, Math.round(Math.abs(e.w) * t.s * $)), d = Math.max(0, Math.round(Math.abs(e.h) * t.s * $)), m = [
    e.rot ? `rot="${ee(e.rot)}"` : "",
    e.flipH ? 'flipH="1"' : "",
    e.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), n = a ? `<a:chOff x="${l}" y="${r}"/><a:chExt cx="${p}" cy="${d}"/>` : "";
  return `<${s}${m ? " " + m : ""}><a:off x="${l}" y="${r}"/><a:ext cx="${p}" cy="${d}"/>${n}</${s}>`;
}, j = (e, t, s) => {
  const a = `<p:cNvPr id="${e.id}" name="${S(e.name)}"${s ? ` descr="${S(s)}"` : ""}`, l = Se(e.link, t);
  return l ? `${a}>${l}</p:cNvPr>` : `${a}/>`;
};
function ve(e, t) {
  const s = `<p:nvSpPr>${j(e, t)}<p:cNvSpPr${e.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, a = `<p:spPr>${B(e, t)}${se(e.geom, e.w, e.h)}${te(e.fill)}${ae(e.line, t.s)}</p:spPr>`, l = e.text ? ye(e.text, t.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${s}${a}${l}</p:sp>`;
}
function be(e, t) {
  const s = (l, r) => r ? `<a:${l} id="${r.id}" idx="${r.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${j(e, t)}<p:cNvCxnSpPr>${s("stCxn", e.start)}${s("endCxn", e.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${B(e, t)}${se(e.geom, e.w, e.h)}<a:noFill/>${ae(e.line, t.s)}</p:spPr></p:cxnSp>`;
}
function Me(e, t) {
  const s = t.media(e.media), a = `<p:nvPicPr>${j(e, t, e.descr)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, l = e.alpha !== void 0 && e.alpha < 1 ? `<a:alphaModFix amt="${F(e.alpha)}"/>` : "", r = e.crop, p = r ? `<a:srcRect l="${F(r.l)}" t="${F(r.t)}" r="${F(r.r)}" b="${F(r.b)}"/>` : "", d = `<p:blipFill><a:blip r:embed="${s}">${l}</a:blip>${p}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${a}${d}<p:spPr>${B(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function Ce(e, t) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${j(e, t)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${B(e, t, "a:xfrm", !0)}</p:grpSpPr>${e.children.map((a) => le(a, t)).join("")}</p:grpSp>`;
}
function le(e, t) {
  switch (e.kind) {
    case "shape":
      return ve(e, t);
    case "connector":
      return be(e, t);
    case "picture":
      return Me(e, t);
    case "group":
      return e.children.length ? Ce(e, t) : "";
  }
}
const A = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function Le(e) {
  if (!e) return "";
  const t = Math.max(0, Math.min(6e4, Math.round(e.durationMs))), s = t <= 600 ? "fast" : t <= 900 ? "med" : "slow", a = e.kind === "push" ? `<p:push dir="${e.dir ?? "l"}"/>` : e.kind === "zoom" ? `<p:zoom dir="${e.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return `<mc:AlternateContent xmlns:mc="${v.mc}"><mc:Choice xmlns:p14="${v.p14}" Requires="p14"><p:transition spd="${s}" p14:dur="${t}">${a}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${s}">${a}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
function Fe(e, t) {
  let s = "";
  const a = e.background;
  a && a.kind === "image" ? s = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${t.media(a.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : a && a.kind !== "none" && (s = `<p:bg><p:bgPr>${te(a)}<a:effectLst/></p:bgPr></p:bg>`);
  const l = e.items.map((p) => le(p, t)).join(""), r = e.name ? ` name="${S(e.name)}"` : "";
  return x + `<p:sld ${b}><p:cSld${r}>${s}<p:spTree>${A}${l}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${Le(e.transition)}</p:sld>`;
}
const _ = (e, t = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${t}<a:defRPr sz="${e}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, J = x + `<a:theme xmlns:a="${v.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, ke = x + `<p:sldMaster ${b}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${A}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${_(4400)}</p:titleStyle><p:bodyStyle>${_(2800)}</p:bodyStyle><p:otherStyle>${_(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, we = x + `<p:sldLayout ${b} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${A}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, K = 6858e3, Q = 9144e3, E = (e, t, s, a, l, r, p, d, m = "") => {
  const n = `<a:xfrm><a:off x="${Math.round(K * l)}" y="${Math.round(Q * r)}"/><a:ext cx="${Math.round(K * p)}" cy="${Math.round(Q * d)}"/></a:xfrm>`, u = s === "sldImg", c = u ? "" : ' sz="quarter"', h = u ? `<p:spPr>${n}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${n}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, P = u ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', M = u ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${m || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${e}" name="${t}"/><p:cNvSpPr>${P}</p:cNvSpPr><p:nvPr><p:ph type="${s}"${c} idx="${a}"/></p:nvPr></p:nvSpPr>${h}${M}</p:sp>`;
}, Ie = Array.from({ length: 9 }, (e, t) => `<a:lvl${t + 1}pPr marL="${t * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${t + 1}pPr>`).join(""), Ee = x + `<p:notesMaster ${b}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${A}` + E(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + E(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + E(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + E(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + E(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + E(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${Ie}</p:notesStyle></p:notesMaster>`;
function Te(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((l) => l ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${S(l)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), s = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', a = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${t}</p:txBody></p:sp>`;
  return x + `<p:notes ${b}><p:cSld><p:spTree>${A}${s}${a}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const Ne = x + `<p:presentationPr ${b}/>`, Re = x + `<p:viewPr ${b}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, Ae = x + `<a:tblStyleLst xmlns:a="${v.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, De = (e, t) => x + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${S(e)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${t}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${t}</dcterms:modified></cp:coreProperties>`, _e = (e, t) => x + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${e}</Slides><Notes>${t}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function je(e, t = {}) {
  const s = Math.max(1, e.width), a = Math.max(1, e.height), l = Math.max(s, a) * $, r = Math.min(s, a) * $, p = l > R ? R / l : r < D ? Math.min(D / r, R / l) : 1, d = Math.max(D, Math.min(R, Math.round(s * p * $))), m = Math.max(D, Math.min(R, Math.round(a * p * $))), n = /* @__PURE__ */ new Map(), u = [], c = /* @__PURE__ */ new Set();
  let h = 0;
  const P = e.slides.length ? e.slides : [{ items: [] }], M = /* @__PURE__ */ new Map();
  P.forEach((i, N) => {
    i.key && M.set(i.key, N + 1);
  });
  const g = [{ id: "rId1", type: o.slideMaster, target: "slideMasters/slideMaster1.xml" }], w = P.some((i) => !!i.notes?.trim());
  let U = "";
  P.forEach((i, N) => {
    const y = N + 1, I = [{ id: "rId1", type: o.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], H = /* @__PURE__ */ new Map(), z = i.fit ?? { scale: 1, dx: 0, dy: 0 }, oe = {
      s: z.scale * p,
      dx: z.dx * p,
      dy: z.dy * p,
      rels: I,
      slideNumber: (C) => M.get(C) ?? null,
      media: (C) => {
        const W = H.get(C);
        if (W) return W;
        h++;
        const V = `image${h}.${C.ext}`;
        n.set(`ppt/media/${V}`, C.bytes), c.add(C.ext);
        const X = `rId${I.length + 1}`;
        return I.push({ id: X, type: o.image, target: `../media/${V}` }), H.set(C, X), X;
      }
    };
    n.set(`ppt/slides/slide${y}.xml`, Fe(i, oe)), i.notes?.trim() && (I.push({ id: `rId${I.length + 1}`, type: o.notesSlide, target: `../notesSlides/notesSlide${y}.xml` }), n.set(`ppt/notesSlides/notesSlide${y}.xml`, Te(i.notes)), n.set(`ppt/notesSlides/_rels/notesSlide${y}.xml.rels`, L([
      { id: "rId1", type: o.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: o.slide, target: `../slides/slide${y}.xml` }
    ])), u.push([`/ppt/notesSlides/notesSlide${y}.xml`, f.notesSlide])), n.set(`ppt/slides/_rels/slide${y}.xml.rels`, L(I)), u.push([`/ppt/slides/slide${y}.xml`, f.slide]);
    const Y = `rId${y + 1}`;
    g.push({ id: Y, type: o.slide, target: `slides/slide${y}.xml` }), U += `<p:sldId id="${255 + y}" r:id="${Y}"/>`;
  });
  const T = P.length + 2;
  g.push(
    { id: `rId${T}`, type: o.theme, target: "theme/theme1.xml" },
    { id: `rId${T + 1}`, type: o.presProps, target: "presProps.xml" },
    { id: `rId${T + 2}`, type: o.viewProps, target: "viewProps.xml" },
    { id: `rId${T + 3}`, type: o.tableStyles, target: "tableStyles.xml" }
  );
  const G = `rId${T + 4}`;
  w && (g.push({ id: G, type: o.notesMaster, target: "notesMasters/notesMaster1.xml" }), n.set("ppt/notesMasters/notesMaster1.xml", Ee), n.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", L([
    { id: "rId1", type: o.theme, target: "../theme/theme2.xml" }
  ])), n.set("ppt/theme/theme2.xml", J), u.push(["/ppt/notesMasters/notesMaster1.xml", f.notesMaster], ["/ppt/theme/theme2.xml", f.theme]));
  const re = x + `<p:presentation ${b} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (w ? `<p:notesMasterIdLst><p:notesMasterId r:id="${G}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${U}</p:sldIdLst><p:sldSz cx="${d}" cy="${m}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${_(1800)}</p:defaultTextStyle></p:presentation>`;
  n.set("ppt/presentation.xml", re), n.set("ppt/_rels/presentation.xml.rels", L(g)), n.set("ppt/slideMasters/slideMaster1.xml", ke), n.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", L([
    { id: "rId1", type: o.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: o.theme, target: "../theme/theme1.xml" }
  ])), n.set("ppt/slideLayouts/slideLayout1.xml", we), n.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", L([
    { id: "rId1", type: o.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), n.set("ppt/theme/theme1.xml", J), n.set("ppt/presProps.xml", Ne), n.set("ppt/viewProps.xml", Re), n.set("ppt/tableStyles.xml", Ae);
  const ne = t.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  n.set("docProps/core.xml", De(e.title || "YappyDraw presentation", ne)), n.set("docProps/app.xml", _e(P.length, P.filter((i) => !!i.notes?.trim()).length)), n.set("_rels/.rels", L([
    { id: "rId1", type: o.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: o.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: o.extProps, target: "docProps/app.xml" }
  ])), u.push(
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
  const pe = x + `<Types xmlns="${v.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...c].map((i) => `<Default Extension="${i}" ContentType="${he[i]}"/>`).join("") + u.map(([i, N]) => `<Override PartName="${i}" ContentType="${N}"/>`).join("") + "</Types>";
  return n.set("[Content_Types].xml", pe), ie(n);
}
export {
  je as buildPptx,
  Te as notesXml
};
