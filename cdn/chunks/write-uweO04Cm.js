import { r as L, X as m, N as S, z as ie, e as v, E as x, a as ee, p as F, b as ce, c as de, R as o, f as me } from "./custgeom-CEAI2znd.js";
const D = 914400, A = 51206400, b = `xmlns:a="${S.a}" xmlns:r="${S.r}" xmlns:p="${S.p}"`, $ = {
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
      return `<a:pattFill prst="${v(e.preset)}"><a:fgClr>${k(e.color)}</a:fgClr><a:bgClr>${e.bg ? k(e.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function ae(e, t) {
  if (!e || !(e.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let a = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(e.width * t * x)))}"${e.cap ? ` cap="${e.cap}"` : ""}><a:solidFill>${k(e.color)}</a:solidFill>`;
  e.dash && (a += `<a:prstDash val="${v(e.dash)}"/>`), e.join === "round" ? a += "<a:round/>" : e.join === "bevel" ? a += "<a:bevel/>" : e.join === "miter" && (a += '<a:miter lim="800000"/>');
  const l = (n, p) => p ? `<a:${n} type="${p.type}" w="${p.size ?? "med"}" len="${p.size ?? "med"}"/>` : "";
  return a += l("headEnd", e.head) + l("tailEnd", e.tail), a + "</a:ln>";
}
function X(e, t, s = "a:rPr") {
  const a = ['lang="en-US"'];
  e.size && a.push(`sz="${me(e.size * t)}"`), e.bold !== void 0 && a.push(`b="${e.bold ? 1 : 0}"`), e.italic !== void 0 && a.push(`i="${e.italic ? 1 : 0}"`), e.underline && a.push('u="sng"'), e.strike && a.push('strike="sngStrike"'), a.push('dirty="0"');
  let l = "";
  if (e.color && (l += `<a:solidFill>${k(e.color)}</a:solidFill>`), e.font) {
    const n = v(e.font);
    l += `<a:latin typeface="${n}"/><a:ea typeface="${n}"/><a:cs typeface="${n}"/>`;
  }
  return l ? `<${s} ${a.join(" ")}>${l}</${s}>` : `<${s} ${a.join(" ")}/>`;
}
const fe = 20, $e = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), xe = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function ue(e, t, s) {
  const a = Math.max(0, Math.min(8, e.level ?? 0)), l = [];
  e.align && l.push(`algn="${e.align}"`);
  let n = "";
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 1e-3 && (n += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, t.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const p = (d, f) => f && f > 0 ? `<a:${d}><a:spcPts val="${Math.round(Math.min(1584, f * s * 0.75) * 100)}"/></a:${d}>` : "";
  if (n += p("spcBef", e.spaceBefore) + p("spcAft", e.spaceAfter), e.bullet) {
    const d = fe * s * x, f = e.marL !== void 0 ? e.marL * s * x : d * (a + 1), g = e.indent !== void 0 ? e.indent * s * x : -d, M = (P, w) => Math.round(Math.max(w, Math.min(51206400, P)));
    if (l.push(`marL="${M(f, 0)}" indent="${M(g, -51206400)}"`), a && l.push(`lvl="${a}"`), e.bulletColor && (n += `<a:buClr>${k(e.bulletColor)}</a:buClr>`), e.bulletScale && Math.abs(e.bulletScale - 1) > 1e-3 && (n += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, e.bulletScale)) * 1e5)}"/>`), e.bullet === "num") {
      const P = e.numType && xe.test(e.numType) ? e.numType : "arabicPeriod", w = e.startAt && e.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(e.startAt))}"` : "";
      n += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${P}"${w}/>`;
    } else {
      const P = e.bulletChar || "•";
      n += `<a:buFont typeface="${$e.has(P) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${v(P)}"/>`;
    }
  } else
    a && l.push(`lvl="${a}"`), n += "<a:buNone/>";
  const c = `<a:pPr${l.length ? " " + l.join(" ") : ""}>${n}</a:pPr>`, h = t.defaults ?? {};
  let r = "";
  for (const d of e.runs) {
    const f = { ...h, ...ge(d) };
    if (d.br) {
      r += `<a:br>${X(f, s)}</a:br>`;
      continue;
    }
    d.text && (r += `<a:r>${X(f, s)}<a:t>${v(d.text)}</a:t></a:r>`);
  }
  const u = e.endSize ?? h.size;
  return `<a:p>${c}${r}${X({ ...h, size: u }, s, "a:endParaRPr")}</a:p>`;
}
const ge = (e) => Object.fromEntries(Object.entries(e).filter(([, t]) => t !== void 0));
function Pe(e, t, s = "p:txBody") {
  if (!e) return "";
  const a = (p) => Math.max(0, Math.round(p * t * x)), l = `<a:bodyPr wrap="${e.wrap ? "square" : "none"}" lIns="${a(e.insets.l)}" tIns="${a(e.insets.t)}" rIns="${a(e.insets.r)}" bIns="${a(e.insets.b)}" anchor="${e.anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr>`, n = e.paragraphs.length ? e.paragraphs : [{ runs: [] }];
  return `<${s}>${l}<a:lstStyle/>${n.map((p) => ue(p, e, t)).join("")}</${s}>`;
}
const se = (e, t, s) => e.kind === "preset" ? ce(e.prst, e.adj) : de(e.paths, t, s), ye = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function Se(e, t) {
  if (!e) return "";
  const s = (l, n, p) => {
    const c = t.rels.find((r) => r.type === l && r.target === n);
    if (c) return c.id;
    const h = `rId${t.rels.length + 1}`;
    return t.rels.push({ id: h, type: l, target: n, external: p }), h;
  };
  if (e.kind === "url") return `<a:hlinkClick r:id="${s(o.hyperlink, e.url, !0)}"/>`;
  if (e.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${ye[e.action]}"/>`;
  const a = t.slideNumber?.(e.key);
  return a ? `<a:hlinkClick r:id="${s(o.slide, `slide${a}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const _ = (e, t, s = "a:xfrm", a = !1) => {
  const l = Math.round((e.x * t.s + t.dx) * x), n = Math.round((e.y * t.s + t.dy) * x), p = Math.max(0, Math.round(Math.abs(e.w) * t.s * x)), c = Math.max(0, Math.round(Math.abs(e.h) * t.s * x)), h = [
    e.rot ? `rot="${ee(e.rot)}"` : "",
    e.flipH ? 'flipH="1"' : "",
    e.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), r = a ? `<a:chOff x="${l}" y="${n}"/><a:chExt cx="${p}" cy="${c}"/>` : "";
  return `<${s}${h ? " " + h : ""}><a:off x="${l}" y="${n}"/><a:ext cx="${p}" cy="${c}"/>${r}</${s}>`;
}, j = (e, t, s) => {
  const a = `<p:cNvPr id="${e.id}" name="${v(e.name)}"${s ? ` descr="${v(s)}"` : ""}`, l = Se(e.link, t);
  return l ? `${a}>${l}</p:cNvPr>` : `${a}/>`;
};
function ve(e, t) {
  const s = `<p:nvSpPr>${j(e, t)}<p:cNvSpPr${e.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, a = `<p:spPr>${_(e, t)}${se(e.geom, e.w, e.h)}${te(e.fill)}${ae(e.line, t.s)}</p:spPr>`, l = e.text ? Pe(e.text, t.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${s}${a}${l}</p:sp>`;
}
function be(e, t) {
  const s = (l, n) => n ? `<a:${l} id="${n.id}" idx="${n.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${j(e, t)}<p:cNvCxnSpPr>${s("stCxn", e.start)}${s("endCxn", e.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${_(e, t)}${se(e.geom, e.w, e.h)}<a:noFill/>${ae(e.line, t.s)}</p:spPr></p:cxnSp>`;
}
function Me(e, t) {
  const s = t.media(e.media), a = `<p:nvPicPr>${j(e, t, e.descr)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, l = e.alpha !== void 0 && e.alpha < 1 ? `<a:alphaModFix amt="${F(e.alpha)}"/>` : "", n = e.crop, p = n ? `<a:srcRect l="${F(n.l)}" t="${F(n.t)}" r="${F(n.r)}" b="${F(n.b)}"/>` : "", c = `<p:blipFill><a:blip r:embed="${s}">${l}</a:blip>${p}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${a}${c}<p:spPr>${_(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function Ce(e, t) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${j(e, t)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${_(e, t, "a:xfrm", !0)}</p:grpSpPr>${e.children.map((a) => le(a, t)).join("")}</p:grpSp>`;
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
const R = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function Le(e, t) {
  const s = t && t > 0 ? ` advTm="${Math.round(t)}"` : "";
  if (!e) return s ? `<mc:AlternateContent xmlns:mc="${S.mc}"><mc:Choice xmlns:p14="${S.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${s}/></mc:Choice><mc:Fallback><p:transition spd="fast"${s}/></mc:Fallback></mc:AlternateContent>` : "";
  const a = Math.max(0, Math.min(6e4, Math.round(e.durationMs))), l = a <= 600 ? "fast" : a <= 900 ? "med" : "slow", n = e.kind === "push" ? `<p:push dir="${e.dir ?? "l"}"/>` : e.kind === "zoom" ? `<p:zoom dir="${e.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return `<mc:AlternateContent xmlns:mc="${S.mc}"><mc:Choice xmlns:p14="${S.p14}" Requires="p14"><p:transition spd="${l}" p14:dur="${a}"${s}>${n}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${l}"${s}>${n}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
function Fe(e, t) {
  let s = "";
  const a = e.background;
  a && a.kind === "image" ? s = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${t.media(a.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : a && a.kind !== "none" && (s = `<p:bg><p:bgPr>${te(a)}<a:effectLst/></p:bgPr></p:bg>`);
  const l = e.items.map((c) => le(c, t)).join(""), n = e.name ? ` name="${v(e.name)}"` : "", p = e.hidden ? ' show="0"' : "";
  return m + `<p:sld ${b}${p}><p:cSld${n}>${s}<p:spTree>${R}${l}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${Le(e.transition, e.advanceAfterMs)}</p:sld>`;
}
const B = (e, t = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${t}<a:defRPr sz="${e}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, J = m + `<a:theme xmlns:a="${S.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, ke = m + `<p:sldMaster ${b}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${R}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${B(4400)}</p:titleStyle><p:bodyStyle>${B(2800)}</p:bodyStyle><p:otherStyle>${B(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, we = m + `<p:sldLayout ${b} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${R}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, K = 6858e3, Q = 9144e3, E = (e, t, s, a, l, n, p, c, h = "") => {
  const r = `<a:xfrm><a:off x="${Math.round(K * l)}" y="${Math.round(Q * n)}"/><a:ext cx="${Math.round(K * p)}" cy="${Math.round(Q * c)}"/></a:xfrm>`, u = s === "sldImg", d = u ? "" : ' sz="quarter"', f = u ? `<p:spPr>${r}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${r}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, g = u ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', M = u ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${h || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${e}" name="${t}"/><p:cNvSpPr>${g}</p:cNvSpPr><p:nvPr><p:ph type="${s}"${d} idx="${a}"/></p:nvPr></p:nvSpPr>${f}${M}</p:sp>`;
}, Ie = Array.from({ length: 9 }, (e, t) => `<a:lvl${t + 1}pPr marL="${t * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${t + 1}pPr>`).join(""), Ee = m + `<p:notesMaster ${b}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${R}` + E(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + E(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + E(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + E(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + E(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + E(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${Ie}</p:notesStyle></p:notesMaster>`;
function Te(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((l) => l ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${v(l)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), s = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', a = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${t}</p:txBody></p:sp>`;
  return m + `<p:notes ${b}><p:cSld><p:spTree>${R}${s}${a}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const Ne = m + `<p:presentationPr ${b}/>`, Ae = m + `<p:presentationPr ${b}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;
function Re(e, t) {
  if (!e.some((l) => l.section)) return "";
  const s = [];
  e.forEach((l, n) => {
    (l.section || !s.length) && s.push({ name: l.section || "Default Section", ids: [] }), s[s.length - 1].ids.push(t(n));
  });
  const a = (l) => `{8F3A1C2E-5B7D-4E9A-9C11-${(l + 1).toString(16).toUpperCase().padStart(12, "0")}}`;
  return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${S.p14}">` + s.map((l, n) => `<p14:section name="${v(l.name)}" id="${a(n)}"><p14:sldIdLst>${l.ids.map((p) => `<p14:sldId id="${p}"/>`).join("")}</p14:sldIdLst></p14:section>`).join("") + "</p14:sectionLst></p:ext></p:extLst>";
}
const De = m + `<p:viewPr ${b}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, Be = m + `<a:tblStyleLst xmlns:a="${S.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, _e = (e, t) => m + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${v(e)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${t}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${t}</dcterms:modified></cp:coreProperties>`, je = (e, t) => m + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${e}</Slides><Notes>${t}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function ze(e, t = {}) {
  const s = Math.max(1, e.width), a = Math.max(1, e.height), l = Math.max(s, a) * x, n = Math.min(s, a) * x, p = l > A ? A / l : n < D ? Math.min(D / n, A / l) : 1, c = Math.max(D, Math.min(A, Math.round(s * p * x))), h = Math.max(D, Math.min(A, Math.round(a * p * x))), r = /* @__PURE__ */ new Map(), u = [], d = /* @__PURE__ */ new Set();
  let f = 0;
  const g = e.slides.length ? e.slides : [{ items: [] }], M = /* @__PURE__ */ new Map();
  g.forEach((i, N) => {
    i.key && M.set(i.key, N + 1);
  });
  const P = [{ id: "rId1", type: o.slideMaster, target: "slideMasters/slideMaster1.xml" }], w = g.some((i) => !!i.notes?.trim());
  let U = "";
  g.forEach((i, N) => {
    const y = N + 1, I = [{ id: "rId1", type: o.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], H = /* @__PURE__ */ new Map(), O = i.fit ?? { scale: 1, dx: 0, dy: 0 }, oe = {
      s: O.scale * p,
      dx: O.dx * p,
      dy: O.dy * p,
      rels: I,
      slideNumber: (C) => M.get(C) ?? null,
      media: (C) => {
        const W = H.get(C);
        if (W) return W;
        f++;
        const V = `image${f}.${C.ext}`;
        r.set(`ppt/media/${V}`, C.bytes), d.add(C.ext);
        const z = `rId${I.length + 1}`;
        return I.push({ id: z, type: o.image, target: `../media/${V}` }), H.set(C, z), z;
      }
    };
    r.set(`ppt/slides/slide${y}.xml`, Fe(i, oe)), i.notes?.trim() && (I.push({ id: `rId${I.length + 1}`, type: o.notesSlide, target: `../notesSlides/notesSlide${y}.xml` }), r.set(`ppt/notesSlides/notesSlide${y}.xml`, Te(i.notes)), r.set(`ppt/notesSlides/_rels/notesSlide${y}.xml.rels`, L([
      { id: "rId1", type: o.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: o.slide, target: `../slides/slide${y}.xml` }
    ])), u.push([`/ppt/notesSlides/notesSlide${y}.xml`, $.notesSlide])), r.set(`ppt/slides/_rels/slide${y}.xml.rels`, L(I)), u.push([`/ppt/slides/slide${y}.xml`, $.slide]);
    const Y = `rId${y + 1}`;
    P.push({ id: Y, type: o.slide, target: `slides/slide${y}.xml` }), U += `<p:sldId id="${255 + y}" r:id="${Y}"/>`;
  });
  const T = g.length + 2;
  P.push(
    { id: `rId${T}`, type: o.theme, target: "theme/theme1.xml" },
    { id: `rId${T + 1}`, type: o.presProps, target: "presProps.xml" },
    { id: `rId${T + 2}`, type: o.viewProps, target: "viewProps.xml" },
    { id: `rId${T + 3}`, type: o.tableStyles, target: "tableStyles.xml" }
  );
  const G = `rId${T + 4}`;
  w && (P.push({ id: G, type: o.notesMaster, target: "notesMasters/notesMaster1.xml" }), r.set("ppt/notesMasters/notesMaster1.xml", Ee), r.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", L([
    { id: "rId1", type: o.theme, target: "../theme/theme2.xml" }
  ])), r.set("ppt/theme/theme2.xml", J), u.push(["/ppt/notesMasters/notesMaster1.xml", $.notesMaster], ["/ppt/theme/theme2.xml", $.theme]));
  const ne = m + `<p:presentation ${b} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (w ? `<p:notesMasterIdLst><p:notesMasterId r:id="${G}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${U}</p:sldIdLst><p:sldSz cx="${c}" cy="${h}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${B(1800)}</p:defaultTextStyle>${Re(g, (i) => 256 + i)}</p:presentation>`;
  r.set("ppt/presentation.xml", ne), r.set("ppt/_rels/presentation.xml.rels", L(P)), r.set("ppt/slideMasters/slideMaster1.xml", ke), r.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", L([
    { id: "rId1", type: o.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: o.theme, target: "../theme/theme1.xml" }
  ])), r.set("ppt/slideLayouts/slideLayout1.xml", we), r.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", L([
    { id: "rId1", type: o.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), r.set("ppt/theme/theme1.xml", J), r.set("ppt/presProps.xml", e.loop ? Ae : Ne), r.set("ppt/viewProps.xml", De), r.set("ppt/tableStyles.xml", Be);
  const re = t.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  r.set("docProps/core.xml", _e(e.title || "YappyDraw presentation", re)), r.set("docProps/app.xml", je(g.length, g.filter((i) => !!i.notes?.trim()).length)), r.set("_rels/.rels", L([
    { id: "rId1", type: o.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: o.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: o.extProps, target: "docProps/app.xml" }
  ])), u.push(
    ["/ppt/presentation.xml", $.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", $.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", $.slideLayout],
    ["/ppt/theme/theme1.xml", $.theme],
    ["/ppt/presProps.xml", $.presProps],
    ["/ppt/viewProps.xml", $.viewProps],
    ["/ppt/tableStyles.xml", $.tableStyles],
    ["/docProps/core.xml", $.core],
    ["/docProps/app.xml", $.app]
  );
  const pe = m + `<Types xmlns="${S.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...d].map((i) => `<Default Extension="${i}" ContentType="${he[i]}"/>`).join("") + u.map(([i, N]) => `<Override PartName="${i}" ContentType="${N}"/>`).join("") + "</Types>";
  return r.set("[Content_Types].xml", pe), ie(r);
}
export {
  ze as buildPptx,
  Te as notesXml
};
