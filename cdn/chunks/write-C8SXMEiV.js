import { z as Ct, s as Mt } from "./browser-DbZP-BrN.js";
import { e as S, X as v, r as A, N as L, z as kt, E as C, b as ut, d as D, f as wt, g as Lt, R as f, h as Ft } from "./custgeom-BFwOU69u.js";
import { U as xt, az as gt, aA as Tt, aB as ot } from "./index-CJI9hlId.js";
const et = "http://schemas.openxmlformats.org/drawingml/2006/chart", It = "http://schemas.openxmlformats.org/drawingml/2006/main", vt = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", pt = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function at(t) {
  let e = "";
  for (let r = t + 1; r > 0; r = Math.floor((r - 1) / 26)) e = String.fromCharCode(65 + (r - 1) % 26) + e;
  return e;
}
const J = (t) => Number.isInteger(t) ? String(t) : String(Math.round(t * 1e10) / 1e10), st = (t) => /^#[0-9a-f]{6}$/i.test(t) ? t.slice(1).toUpperCase() : /^#[0-9a-f]{3}$/i.test(t) ? t.slice(1).split("").map((e) => e + e).join("").toUpperCase() : "4472C4", Q = (t) => `<c:spPr><a:solidFill><a:srgbClr val="${st(t)}"/></a:solidFill></c:spPr>`, Et = (t, e = 28575) => `<c:spPr><a:ln w="${e}" cap="rnd"><a:solidFill><a:srgbClr val="${st(t)}"/></a:solidFill><a:round/></a:ln></c:spPr>`;
function ct(t, e) {
  return `<c:strRef><c:f>${S(t)}</c:f><c:strCache><c:ptCount val="${e.length}"/>` + e.map((r, a) => `<c:pt idx="${a}"><c:v>${S(r)}</c:v></c:pt>`).join("") + "</c:strCache></c:strRef>";
}
function _t(t, e) {
  return `<c:numRef><c:f>${S(t)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${e.length}"/>` + e.map((r, a) => r === null ? "" : `<c:pt idx="${a}"><c:v>${J(r)}</c:v></c:pt>`).join("") + "</c:numCache></c:numRef>";
}
const Rt = (t) => `<c:dLbls><c:showLegendKey val="0"/><c:showVal val="${t ? 0 : 1}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${t ? 1 : 0}"/><c:showBubbleSize val="0"/></c:dLbls>`;
function At(t) {
  const e = xt(t), a = e.categories.length + 1, n = gt(e.kind), l = n ? e.series.slice(0, 1) : e.series, o = `<c:cat>${ct(`Sheet1!$A$2:$A$${a}`, e.categories)}</c:cat>`, i = l.map((N, I) => {
    const F = at(I + 1), R = Tt(e, I), E = `<c:idx val="${I}"/><c:order val="${I}"/><c:tx>${ct(`Sheet1!$${F}$1`, [N.name])}</c:tx>`, s = `<c:val>${_t(`Sheet1!$${F}$2:$${F}$${a}`, N.values)}</c:val>`;
    switch (e.kind) {
      case "line":
        return `<c:ser>${E}${Et(R)}<c:marker><c:symbol val="circle"/><c:size val="5"/>${Q(R)}</c:marker>${o}${s}<c:smooth val="0"/></c:ser>`;
      case "area":
        return `<c:ser>${E}${Q(R)}${o}${s}</c:ser>`;
      case "pie":
      case "doughnut": {
        const c = e.categories.map((d, m) => `<c:dPt><c:idx val="${m}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${st(ot[m % ot.length])}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`).join("");
        return `<c:ser>${E}${c}${o}${s}</c:ser>`;
      }
      default:
        return `<c:ser>${E}${Q(R)}<c:invertIfNegative val="0"/>${o}${s}</c:ser>`;
    }
  }).join(""), h = e.dataLabels ? Rt(n) : "", p = '<c:axId val="500000001"/><c:axId val="500000002"/>';
  let u;
  switch (e.kind) {
    case "column":
    case "bar":
      u = `<c:barChart><c:barDir val="${e.kind === "bar" ? "bar" : "col"}"/><c:grouping val="${e.stacked ? "stacked" : "clustered"}"/><c:varyColors val="0"/>${i}${h}<c:gapWidth val="${e.stacked ? 60 : 150}"/>${e.stacked ? '<c:overlap val="100"/>' : ""}${p}</c:barChart>`;
      break;
    case "line":
      u = `<c:lineChart><c:grouping val="${e.stacked ? "stacked" : "standard"}"/><c:varyColors val="0"/>${i}${h}<c:marker val="1"/>${p}</c:lineChart>`;
      break;
    case "area":
      u = `<c:areaChart><c:grouping val="${e.stacked ? "stacked" : "standard"}"/><c:varyColors val="0"/>${i}${h}${p}</c:areaChart>`;
      break;
    case "pie":
      u = `<c:pieChart><c:varyColors val="1"/>${i}${h}<c:firstSliceAng val="0"/></c:pieChart>`;
      break;
    default:
      u = `<c:doughnutChart><c:varyColors val="1"/>${i}${h}<c:firstSliceAng val="0"/><c:holeSize val="50"/></c:doughnutChart>`;
  }
  const g = e.kind === "bar", x = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"><a:solidFill><a:srgbClr val="595959"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>', b = n ? "" : `<c:catAx><c:axId val="500000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${g ? "l" : "b"}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>${x}<c:crossAx val="500000002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="500000002"/><c:scaling><c:orientation val="minMax"/>` + (e.yMax !== void 0 ? `<c:max val="${J(e.yMax)}"/>` : "") + (e.yMin !== void 0 ? `<c:min val="${J(e.yMin)}"/>` : "") + `</c:scaling><c:delete val="0"/><c:axPos val="${g ? "b" : "l"}"/>` + (e.gridlines !== !1 ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : "") + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${x}<c:crossAx val="500000001"/><c:crosses val="autoZero"/><c:crossBetween val="${e.kind === "area" ? "midCat" : "between"}"/></c:valAx>`, w = e.title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1800" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1800" b="1"/><a:t>${S(e.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>` : '<c:autoTitleDeleted val="1"/>', P = { right: "r", bottom: "b", top: "t" }[e.legend], j = P ? `<c:legend><c:legendPos val="${P}"/><c:overlay val="0"/>${x}</c:legend>` : "";
  return v + `<c:chartSpace xmlns:c="${et}" xmlns:a="${It}" xmlns:r="${vt}"><c:date1904 val="0"/><c:roundedCorners val="0"/><c:chart>${w}<c:plotArea><c:layout/>${u}${b}</c:plotArea>${j}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;
}
function Nt(t) {
  const e = xt(t), r = gt(e.kind) ? e.series.slice(0, 1) : e.series, a = (o, i) => `<c r="${o}" t="inlineStr"><is><t>${S(i)}</t></is></c>`, n = [
    `<row r="1">${a("A1", "")}${r.map((o, i) => a(`${at(i + 1)}1`, o.name)).join("")}</row>`,
    ...e.categories.map((o, i) => `<row r="${i + 2}">${a(`A${i + 2}`, o)}` + r.map((h, p) => h.values[i] === null ? "" : `<c r="${at(p + 1)}${i + 2}"><v>${J(h.values[i])}</v></c>`).join("") + "</row>")
  ], l = {
    "[Content_Types].xml": v + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels": v + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": v + `<workbook xmlns="${pt}" xmlns:r="${vt}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": v + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": v + `<worksheet xmlns="${pt}"><sheetData>${n.join("")}</sheetData></worksheet>`
  };
  return Ct(Object.fromEntries(Object.entries(l).map(([o, i]) => [o, Mt(i)])));
}
const q = 914400, W = 51206400, Dt = "http://schemas.microsoft.com/office/powerpoint/2015/09/main", _ = `xmlns:a="${L.a}" xmlns:r="${L.r}" xmlns:p="${L.p}"`, k = {
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
  chart: "application/vnd.openxmlformats-officedocument.drawingml.chart+xml",
  core: "application/vnd.openxmlformats-package.core-properties+xml",
  app: "application/vnd.openxmlformats-officedocument.extended-properties+xml"
}, Bt = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, it = (t) => {
  const e = String(t || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(e) ? e.toUpperCase() : "000000";
}, B = (t) => {
  const e = t.alpha;
  return e !== void 0 && e < 1 ? `<a:srgbClr val="${it(t.hex)}"><a:alpha val="${D(e)}"/></a:srgbClr>` : `<a:srgbClr val="${it(t.hex)}"/>`;
}, dt = (t) => {
  const e = [...t].sort((a, n) => a.pos - n.pos);
  return "<a:gsLst>" + (e.length === 1 ? [{ ...e[0], pos: 0 }, { ...e[0], pos: 1 }] : e).map((a) => `<a:gs pos="${D(a.pos)}">${B(a.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function rt(t) {
  if (!t || t.kind === "none") return "<a:noFill/>";
  switch (t.kind) {
    case "solid":
      return `<a:solidFill>${B(t.color)}</a:solidFill>`;
    case "linear":
      return t.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${dt(t.stops)}<a:lin ang="${ut(t.angle)}" scaled="${t.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return t.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${dt(t.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${S(t.preset)}"><a:fgClr>${B(t.color)}</a:fgClr><a:bgClr>${t.bg ? B(t.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function nt(t, e) {
  if (!t || !(t.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let a = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(t.width * e * C)))}"${t.cap ? ` cap="${t.cap}"` : ""}><a:solidFill>${B(t.color)}</a:solidFill>`;
  t.dash && (a += `<a:prstDash val="${S(t.dash)}"/>`), t.join === "round" ? a += "<a:round/>" : t.join === "bevel" ? a += "<a:bevel/>" : t.join === "miter" && (a += '<a:miter lim="800000"/>');
  const n = (l, o) => o ? `<a:${l} type="${o.type}" w="${o.size ?? "med"}" len="${o.size ?? "med"}"/>` : "";
  return a += n("headEnd", t.head) + n("tailEnd", t.tail), a + "</a:ln>";
}
function tt(t, e, r = "a:rPr") {
  const a = ['lang="en-US"'];
  t.size && a.push(`sz="${Ft(t.size * e)}"`), t.bold !== void 0 && a.push(`b="${t.bold ? 1 : 0}"`), t.italic !== void 0 && a.push(`i="${t.italic ? 1 : 0}"`), t.underline && a.push('u="sng"'), t.strike && a.push('strike="sngStrike"'), a.push('dirty="0"');
  let n = "";
  if (t.color && (n += `<a:solidFill>${B(t.color)}</a:solidFill>`), t.font) {
    const l = S(t.font);
    n += `<a:latin typeface="${l}"/><a:ea typeface="${l}"/><a:cs typeface="${l}"/>`;
  }
  return n ? `<${r} ${a.join(" ")}>${n}</${r}>` : `<${r} ${a.join(" ")}/>`;
}
const jt = 20, Ot = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), zt = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function Gt(t, e, r) {
  const a = Math.max(0, Math.min(8, t.level ?? 0)), n = [];
  t.align && n.push(`algn="${t.align}"`);
  let l = "";
  e.lineSpacing && Math.abs(e.lineSpacing - 1) > 1e-3 && (l += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, e.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const o = (g, x) => x && x > 0 ? `<a:${g}><a:spcPts val="${Math.round(Math.min(1584, x * r * 0.75) * 100)}"/></a:${g}>` : "";
  if (l += o("spcBef", t.spaceBefore) + o("spcAft", t.spaceAfter), t.bullet) {
    const g = jt * r * C, x = t.marL !== void 0 ? t.marL * r * C : g * (a + 1), M = t.indent !== void 0 ? t.indent * r * C : -g, b = (w, P) => Math.round(Math.max(P, Math.min(51206400, w)));
    if (n.push(`marL="${b(x, 0)}" indent="${b(M, -51206400)}"`), a && n.push(`lvl="${a}"`), t.bulletColor && (l += `<a:buClr>${B(t.bulletColor)}</a:buClr>`), t.bulletScale && Math.abs(t.bulletScale - 1) > 1e-3 && (l += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, t.bulletScale)) * 1e5)}"/>`), t.bullet === "num") {
      const w = t.numType && zt.test(t.numType) ? t.numType : "arabicPeriod", P = t.startAt && t.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(t.startAt))}"` : "";
      l += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${w}"${P}/>`;
    } else {
      const w = t.bulletChar || "•";
      l += `<a:buFont typeface="${Ot.has(w) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${S(w)}"/>`;
    }
  } else
    a && n.push(`lvl="${a}"`), l += "<a:buNone/>";
  const i = `<a:pPr${n.length ? " " + n.join(" ") : ""}>${l}</a:pPr>`, h = e.defaults ?? {};
  let p = "";
  for (const g of t.runs) {
    const x = { ...h, ...Xt(g) };
    if (g.br) {
      p += `<a:br>${tt(x, r)}</a:br>`;
      continue;
    }
    g.text && (p += `<a:r>${tt(x, r)}<a:t>${S(g.text)}</a:t></a:r>`);
  }
  const u = t.endSize ?? h.size;
  return `<a:p>${i}${p}${tt({ ...h, size: u }, r, "a:endParaRPr")}</a:p>`;
}
const Xt = (t) => Object.fromEntries(Object.entries(t).filter(([, e]) => e !== void 0)), Ut = (t) => {
  if (t === void 0) return "<a:noAutofit/>";
  const e = Math.max(0.25, Math.min(1, t));
  return e < 0.9995 ? `<a:normAutofit fontScale="${Math.round(e * 1e5)}"/>` : "<a:normAutofit/>";
};
function yt(t, e, r = "p:txBody") {
  if (!t) return "";
  const a = (o) => Math.max(0, Math.round(o * e * C)), n = `<a:bodyPr wrap="${t.wrap ? "square" : "none"}" lIns="${a(t.insets.l)}" tIns="${a(t.insets.t)}" rIns="${a(t.insets.r)}" bIns="${a(t.insets.b)}" anchor="${t.anchor}" rtlCol="0">${Ut(t.shrink)}</a:bodyPr>`, l = t.paragraphs.length ? t.paragraphs : [{ runs: [] }];
  return `<${r}>${n}<a:lstStyle/>${l.map((o) => Gt(o, t, e)).join("")}</${r}>`;
}
const bt = (t, e, r) => t.kind === "preset" ? wt(t.prst, t.adj) : Lt(t.paths, e, r), Vt = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function Ht(t, e) {
  if (!t) return "";
  const r = (n, l, o) => {
    const i = e.rels.find((p) => p.type === n && p.target === l);
    if (i) return i.id;
    const h = `rId${e.rels.length + 1}`;
    return e.rels.push({ id: h, type: n, target: l, external: o }), h;
  };
  if (t.kind === "url") return `<a:hlinkClick r:id="${r(f.hyperlink, t.url, !0)}"/>`;
  if (t.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${Vt[t.action]}"/>`;
  const a = e.slideNumber?.(t.key);
  return a ? `<a:hlinkClick r:id="${r(f.slide, `slide${a}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const G = (t, e, r = "a:xfrm", a = !1) => {
  const n = Math.round((t.x * e.s + e.dx) * C), l = Math.round((t.y * e.s + e.dy) * C), o = Math.max(0, Math.round(Math.abs(t.w) * e.s * C)), i = Math.max(0, Math.round(Math.abs(t.h) * e.s * C)), h = [
    t.rot ? `rot="${ut(t.rot)}"` : "",
    t.flipH ? 'flipH="1"' : "",
    t.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), p = a ? `<a:chOff x="${n}" y="${l}"/><a:chExt cx="${o}" cy="${i}"/>` : "";
  return `<${r}${h ? " " + h : ""}><a:off x="${n}" y="${l}"/><a:ext cx="${o}" cy="${i}"/>${p}</${r}>`;
}, Wt = '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/></a:ext></a:extLst>', X = (t, e) => {
  const r = t.descr?.trim(), a = `<p:cNvPr id="${t.id}" name="${S(t.name)}"${r ? ` descr="${S(r)}"` : ""}`, n = Ht(t.link, e) + (t.decorative ? Wt : "");
  return n ? `${a}>${n}</p:cNvPr>` : `${a}/>`;
};
function Yt(t, e) {
  const r = `<p:nvSpPr>${X(t, e)}<p:cNvSpPr${t.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, a = `<p:spPr>${G(t, e)}${bt(t.geom, t.w, t.h)}${rt(t.fill)}${nt(t.line, e.s)}</p:spPr>`, n = t.text ? yt(t.text, e.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${r}${a}${n}</p:sp>`;
}
function qt(t, e) {
  const r = (n, l) => l ? `<a:${n} id="${l.id}" idx="${l.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${X(t, e)}<p:cNvCxnSpPr>${r("stCxn", t.start)}${r("endCxn", t.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${G(t, e)}${bt(t.geom, t.w, t.h)}<a:noFill/>${nt(t.line, e.s)}</p:spPr></p:cxnSp>`;
}
function Zt(t, e) {
  const r = e.media(t.media), a = `<p:nvPicPr>${X(t, e)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, n = t.alpha !== void 0 && t.alpha < 1 ? `<a:alphaModFix amt="${D(t.alpha)}"/>` : "", l = t.crop, o = l ? `<a:srcRect l="${D(l.l)}" t="${D(l.t)}" r="${D(l.r)}" b="${D(l.b)}"/>` : "", i = `<p:blipFill><a:blip r:embed="${r}">${n}</a:blip>${o}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${a}${i}<p:spPr>${G(t, e)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function Jt(t, e) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${X(t, e)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${G(t, e, "a:xfrm", !0)}</p:grpSpPr>${t.children.map((a) => Pt(a, e)).join("")}</p:grpSp>`;
}
function Kt(t, e) {
  const r = e.chart?.(t.chart);
  return r ? `<p:graphicFrame><p:nvGraphicFramePr>${X(t, e)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + G(t, e, "p:xfrm") + `<a:graphic><a:graphicData uri="${et}"><c:chart xmlns:c="${et}" r:id="${r}"/></a:graphicData></a:graphic></p:graphicFrame>` : "";
}
const Qt = "http://schemas.openxmlformats.org/drawingml/2006/table", te = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}";
function mt(t, e) {
  let r = 0, a = 0;
  return t.map((n) => {
    r += n * e * C;
    const l = Math.round(r), o = Math.max(0, l - a);
    return a = l, o;
  });
}
function ee(t, e) {
  const r = [
    t.gridSpan && t.gridSpan > 1 ? `gridSpan="${t.gridSpan}"` : "",
    t.rowSpan && t.rowSpan > 1 ? `rowSpan="${t.rowSpan}"` : "",
    t.hMerge ? 'hMerge="1"' : "",
    t.vMerge ? 'vMerge="1"' : ""
  ].filter(Boolean).join(" "), a = t.text ?? { paragraphs: [], anchor: "ctr", insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: !0 }, n = (h) => Math.max(0, Math.round(h * e.s * C)), l = (h, p) => nt(p, e.s).replace(/^<a:ln\b/, `<a:${h}`).replace(/<\/a:ln>$/, `</a:${h}>`), o = t.borders, i = `<a:tcPr marL="${n(a.insets.l)}" marR="${n(a.insets.r)}" marT="${n(a.insets.t)}" marB="${n(a.insets.b)}" anchor="${a.anchor}">` + l("lnL", o.l) + l("lnR", o.r) + l("lnT", o.t) + l("lnB", o.b) + rt(t.fill) + "</a:tcPr>";
  return `<a:tc${r ? " " + r : ""}>${yt(a, e.s, "a:txBody")}${i}</a:tc>`;
}
function ae(t, e) {
  if (!t.cols.length || !t.rows.length) return "";
  const r = [t.firstRow ? 'firstRow="1"' : "", t.bandRow ? 'bandRow="1"' : ""].filter(Boolean).join(" "), a = mt(t.cols, e.s).map((o) => `<a:gridCol w="${o}"/>`).join(""), n = mt(t.rows.map((o) => o.h), e.s), l = t.rows.map((o, i) => `<a:tr h="${n[i]}">${o.cells.map((h) => ee(h, e)).join("")}</a:tr>`).join("");
  return `<p:graphicFrame><p:nvGraphicFramePr>${X(t, e)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + G({ x: t.x, y: t.y, w: t.w, h: t.h }, e, "p:xfrm") + `<a:graphic><a:graphicData uri="${Qt}"><a:tbl><a:tblPr${r ? " " + r : ""}><a:tableStyleId>${te}</a:tableStyleId></a:tblPr><a:tblGrid>${a}</a:tblGrid>${l}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}
function Pt(t, e) {
  switch (t.kind) {
    case "table":
      return ae(t, e);
    case "chart":
      return Kt(t, e);
    case "shape":
      return Yt(t, e);
    case "connector":
      return qt(t, e);
    case "picture":
      return Zt(t, e);
    case "group":
      return t.children.length ? Jt(t, e) : "";
  }
}
const Y = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function se(t, e) {
  const r = e && e > 0 ? ` advTm="${Math.round(e)}"` : "";
  if (!t) return r ? `<mc:AlternateContent xmlns:mc="${L.mc}"><mc:Choice xmlns:p14="${L.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${r}/></mc:Choice><mc:Fallback><p:transition spd="fast"${r}/></mc:Fallback></mc:AlternateContent>` : "";
  const a = Math.max(0, Math.min(6e4, Math.round(t.durationMs))), n = a <= 600 ? "fast" : a <= 900 ? "med" : "slow", l = t.kind === "push" || t.kind === "wipe" || t.kind === "cover" || t.kind === "pull" ? `<p:${t.kind} dir="${t.dir ?? "l"}"/>` : t.kind === "split" ? `<p:split orient="${t.orient ?? "horz"}" dir="${t.inward ? "in" : "out"}"/>` : t.kind === "zoom" ? `<p:zoom dir="${t.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return t.kind === "morph" ? `<mc:AlternateContent xmlns:mc="${L.mc}"><mc:Choice xmlns:p159="${Dt}" xmlns:p14="${L.p14}" Requires="p159"><p:transition spd="${n}" p14:dur="${a}"${r}><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="${n}"${r}><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>` : `<mc:AlternateContent xmlns:mc="${L.mc}"><mc:Choice xmlns:p14="${L.p14}" Requires="p14"><p:transition spd="${n}" p14:dur="${a}"${r}>${l}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${n}"${r}>${l}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
const re = { l: ["0-#ppt_w/2", "#ppt_y"], r: ["1+#ppt_w/2", "#ppt_y"], t: ["#ppt_x", "0-#ppt_h/2"], b: ["#ppt_x", "1+#ppt_h/2"] }, ne = { l: "wipe(right)", r: "wipe(left)", t: "wipe(down)", b: "wipe(up)" };
function le(t, e) {
  if (!t.length) return "";
  let r = 0;
  const a = () => ++r, n = (s) => `<p:tgtEl><p:spTgt spid="${s}"/></p:tgtEl>`, l = (s, c, d = [], m, $) => `<p:cBhvr${$ ? ` additive="${$}"` : ""}>` + (m !== void 0 ? `<p:cTn id="${a()}" dur="${Math.max(1, c)}" fill="hold"><p:stCondLst><p:cond delay="${m}"/></p:stCondLst></p:cTn>` : `<p:cTn id="${a()}" dur="${Math.max(1, c)}" fill="hold"/>`) + n(s.target) + (d.length ? `<p:attrNameLst>${d.map((y) => `<p:attrName>${y}</p:attrName>`).join("")}</p:attrNameLst>` : "") + "</p:cBhvr>", o = (s, c, d) => `<p:set>${l(s, 1, ["style.visibility"], c)}<p:to><p:strVal val="${d ? "visible" : "hidden"}"/></p:to></p:set>`, i = (s, c, d, m, $) => `<p:anim calcmode="lin" valueType="num">${l(s, c, [d], void 0, "base")}<p:tavLst><p:tav tm="0"><p:val><p:strVal val="${m}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${$}"/></p:val></p:tav></p:tavLst></p:anim>`, h = (s, c, d, m) => `<p:animEffect transition="${m ? "out" : "in"}" filter="${d}">${l(s, c)}</p:animEffect>`, p = (s, c, d) => `<p:animRot by="${Math.round(Math.max(-36e3, Math.min(36e3, d)) * 6e4)}">${l(s, c, ["r"])}</p:animRot>`, u = (s, c, d) => `<p:animScale>${l(s, c)}<p:by x="${d * 1e3}" y="${d * 1e3}"/></p:animScale>`, g = (s) => {
    const c = Math.max(1, Math.min(36e5, s.durationMs)), d = s.dir ?? "b";
    if (s.cls === "emph")
      return s.effect === "spin" ? p(s, c, s.degrees ?? 360) : s.effect === "teeter" ? p(s, c, 4) : u(s, c, s.effect === "growShrink" ? 150 : 105);
    const m = s.cls === "exit";
    let $ = m ? "" : o(s, 0, !0);
    switch (s.effect) {
      case "appear":
        break;
      case "fly": {
        const [y, O] = re[d];
        $ += m ? i(s, c, "ppt_x", "#ppt_x", y) + i(s, c, "ppt_y", "#ppt_y", O) : i(s, c, "ppt_x", y, "#ppt_x") + i(s, c, "ppt_y", O, "#ppt_y");
        break;
      }
      case "zoom":
      case "grow":
      case "spinner":
      case "bounce":
      case "swivel": {
        const y = s.effect === "swivel" ? i(s, c, "ppt_w", m ? "#ppt_w" : "0", m ? "0" : "#ppt_w") : i(s, c, "ppt_w", m ? "#ppt_w" : "0", m ? "0" : "#ppt_w") + i(s, c, "ppt_h", m ? "#ppt_h" : "0", m ? "0" : "#ppt_h");
        $ += y, s.effect === "spinner" && ($ += p(s, c, m ? -360 : 360)), $ += h(s, c, "fade", m);
        break;
      }
      case "wipe":
        $ += h(s, c, ne[s.dir ?? "l"], m);
        break;
      default:
        $ += h(s, c, "fade", m);
    }
    return m ? $ + o(s, s.effect === "appear" ? 0 : c - 1, !1) : $;
  }, x = /* @__PURE__ */ new Map(), M = /* @__PURE__ */ new Map();
  for (const s of t) {
    const c = x.get(s.target) ?? 0;
    M.set(s, c), x.set(s.target, c + 1);
  }
  const b = (s) => {
    const c = s.start === "click" ? "clickEffect" : s.start === "with" ? "withEffect" : "afterEffect", d = s.repeat === -1 ? ' repeatCount="indefinite"' : s.repeat && s.repeat > 1 ? ` repeatCount="${Math.min(1e4, s.repeat) * 1e3}"` : "", m = s.cls === "emph" && (s.effect === "pulse" || s.effect === "growShrink") ? ' autoRev="1"' : "";
    return `<p:par><p:cTn id="${a()}" presetID="${s.presetId}" presetClass="${s.cls}" presetSubtype="${s.subtype}"${d}${m} fill="hold" grpId="${M.get(s)}" nodeType="${c}"><p:stCondLst><p:cond delay="${Math.min(36e5, s.delayMs)}"/></p:stCondLst><p:childTnLst>${g(s)}</p:childTnLst></p:cTn></p:par>`;
  }, w = (s) => s.delayMs + s.durationMs * (s.repeat && s.repeat > 1 ? Math.min(100, s.repeat) : 1), P = [];
  for (const s of t) {
    const c = P[P.length - 1];
    s.start === "click" || !c ? P.push({ auto: s.start !== "click", groups: [[s]] }) : s.start === "with" ? c.groups[c.groups.length - 1].push(s) : c.groups.push([s]);
  }
  const j = a(), N = a(), I = P.map((s) => {
    const c = s.auto ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : '<p:cond delay="indefinite"/>', d = a();
    let m = 0;
    const $ = s.groups.map((y) => {
      const U = `<p:par><p:cTn id="${a()}" fill="hold"><p:stCondLst><p:cond delay="${m}"/></p:stCondLst><p:childTnLst>${y.map(b).join("")}</p:childTnLst></p:cTn></p:par>`;
      return m += Math.max(...y.map(w)), U;
    }).join("");
    return `<p:par><p:cTn id="${d}" fill="hold"><p:stCondLst>${c}</p:stCondLst><p:childTnLst>${$}</p:childTnLst></p:cTn></p:par>`;
  }).join(""), F = /* @__PURE__ */ new Set();
  ((s) => s.forEach((c) => {
    c.kind === "shape" && F.add(c.id);
  }))(e);
  const E = [...new Set(t.map((s) => s.target))].filter((s) => F.has(s)).flatMap((s) => Array.from({ length: x.get(s) ?? 1 }, (c, d) => `<p:bldP spid="${s}" grpId="${d}" animBg="1"/>`)).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="${j}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="${N}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${I}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${E ? `<p:bldLst>${E}</p:bldLst>` : ""}</p:timing>`;
}
function oe(t, e) {
  let r = "";
  const a = t.background;
  a && a.kind === "image" ? r = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${e.media(a.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : a && a.kind !== "none" && (r = `<p:bg><p:bgPr>${rt(a)}<a:effectLst/></p:bgPr></p:bg>`);
  const n = t.items.map((i) => Pt(i, e)).join(""), l = t.name ? ` name="${S(t.name)}"` : "", o = t.hidden ? ' show="0"' : "";
  return v + `<p:sld ${_}${o}><p:cSld${l}>${r}<p:spTree>${Y}${n}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${se(t.transition, t.advanceAfterMs)}${le(t.anims ?? [], t.items)}</p:sld>`;
}
const Z = (t, e = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${e}<a:defRPr sz="${t}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, ht = v + `<a:theme xmlns:a="${L.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, pe = v + `<p:sldMaster ${_}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${Y}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${Z(4400)}</p:titleStyle><p:bodyStyle>${Z(2800)}</p:bodyStyle><p:otherStyle>${Z(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, ce = v + `<p:sldLayout ${_} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${Y}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, $t = 6858e3, ft = 9144e3, z = (t, e, r, a, n, l, o, i, h = "") => {
  const p = `<a:xfrm><a:off x="${Math.round($t * n)}" y="${Math.round(ft * l)}"/><a:ext cx="${Math.round($t * o)}" cy="${Math.round(ft * i)}"/></a:xfrm>`, u = r === "sldImg", g = u ? "" : ' sz="quarter"', x = u ? `<p:spPr>${p}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${p}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, M = u ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', b = u ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${h || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${t}" name="${e}"/><p:cNvSpPr>${M}</p:cNvSpPr><p:nvPr><p:ph type="${r}"${g} idx="${a}"/></p:nvPr></p:nvSpPr>${x}${b}</p:sp>`;
}, ie = Array.from({ length: 9 }, (t, e) => `<a:lvl${e + 1}pPr marL="${e * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${e + 1}pPr>`).join(""), de = v + `<p:notesMaster ${_}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${Y}` + z(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + z(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + z(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + z(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + z(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + z(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${ie}</p:notesStyle></p:notesMaster>`;
function me(t) {
  const e = t.replace(/\r\n?/g, `
`).split(`
`).map((n) => n ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${S(n)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), r = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', a = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${e}</p:txBody></p:sp>`;
  return v + `<p:notes ${_}><p:cSld><p:spTree>${Y}${r}${a}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const he = v + `<p:presentationPr ${_}/>`, $e = v + `<p:presentationPr ${_}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;
function fe(t, e) {
  if (!t.some((n) => n.section)) return "";
  const r = [];
  t.forEach((n, l) => {
    (n.section || !r.length) && r.push({ name: n.section || "Default Section", ids: [] }), r[r.length - 1].ids.push(e(l));
  });
  const a = (n) => `{8F3A1C2E-5B7D-4E9A-9C11-${(n + 1).toString(16).toUpperCase().padStart(12, "0")}}`;
  return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${L.p14}">` + r.map((n, l) => `<p14:section name="${S(n.name)}" id="${a(l)}"><p14:sldIdLst>${n.ids.map((o) => `<p14:sldId id="${o}"/>`).join("")}</p14:sldIdLst></p14:section>`).join("") + "</p14:sectionLst></p:ext></p:extLst>";
}
const ue = v + `<p:viewPr ${_}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, xe = v + `<a:tblStyleLst xmlns:a="${L.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, ge = (t, e) => v + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${S(t)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${e}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${e}</dcterms:modified></cp:coreProperties>`, ve = (t, e) => v + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${t}</Slides><Notes>${e}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function Se(t, e = {}) {
  const r = Math.max(1, t.width), a = Math.max(1, t.height), n = Math.max(r, a) * C, l = Math.min(r, a) * C, o = n > W ? W / n : l < q ? Math.min(q / l, W / n) : 1, i = Math.max(q, Math.min(W, Math.round(r * o * C))), h = Math.max(q, Math.min(W, Math.round(a * o * C))), p = /* @__PURE__ */ new Map(), u = [], g = /* @__PURE__ */ new Set();
  let x = 0, M = 0;
  const b = t.slides.length ? t.slides : [{ items: [] }], w = /* @__PURE__ */ new Map();
  b.forEach((d, m) => {
    d.key && w.set(d.key, m + 1);
  });
  const P = [{ id: "rId1", type: f.slideMaster, target: "slideMasters/slideMaster1.xml" }], j = b.some((d) => !!d.notes?.trim());
  let N = !1, I = "";
  b.forEach((d, m) => {
    const $ = m + 1, y = [{ id: "rId1", type: f.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], O = /* @__PURE__ */ new Map(), U = d.fit ?? { scale: 1, dx: 0, dy: 0 }, St = {
      s: U.scale * o,
      dx: U.dx * o,
      dy: U.dy * o,
      rels: y,
      slideNumber: (T) => w.get(T) ?? null,
      chart: (T) => {
        M++;
        const V = `Microsoft_Excel_Worksheet${M}.xlsx`;
        p.set(`ppt/charts/chart${M}.xml`, At(T)), p.set(`ppt/charts/_rels/chart${M}.xml.rels`, A([{ id: "rId1", type: f.package, target: `../embeddings/${V}` }])), p.set(`ppt/embeddings/${V}`, Nt(T)), u.push([`/ppt/charts/chart${M}.xml`, k.chart]), N = !0;
        const H = `rId${y.length + 1}`;
        return y.push({ id: H, type: f.chart, target: `../charts/chart${M}.xml` }), H;
      },
      media: (T) => {
        const V = O.get(T);
        if (V) return V;
        x++;
        const H = `image${x}.${T.ext}`;
        p.set(`ppt/media/${H}`, T.bytes), g.add(T.ext);
        const K = `rId${y.length + 1}`;
        return y.push({ id: K, type: f.image, target: `../media/${H}` }), O.set(T, K), K;
      }
    };
    p.set(`ppt/slides/slide${$}.xml`, oe(d, St)), d.notes?.trim() && (y.push({ id: `rId${y.length + 1}`, type: f.notesSlide, target: `../notesSlides/notesSlide${$}.xml` }), p.set(`ppt/notesSlides/notesSlide${$}.xml`, me(d.notes)), p.set(`ppt/notesSlides/_rels/notesSlide${$}.xml.rels`, A([
      { id: "rId1", type: f.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: f.slide, target: `../slides/slide${$}.xml` }
    ])), u.push([`/ppt/notesSlides/notesSlide${$}.xml`, k.notesSlide])), p.set(`ppt/slides/_rels/slide${$}.xml.rels`, A(y)), u.push([`/ppt/slides/slide${$}.xml`, k.slide]);
    const lt = `rId${$ + 1}`;
    P.push({ id: lt, type: f.slide, target: `slides/slide${$}.xml` }), I += `<p:sldId id="${255 + $}" r:id="${lt}"/>`;
  });
  const F = b.length + 2;
  P.push(
    { id: `rId${F}`, type: f.theme, target: "theme/theme1.xml" },
    { id: `rId${F + 1}`, type: f.presProps, target: "presProps.xml" },
    { id: `rId${F + 2}`, type: f.viewProps, target: "viewProps.xml" },
    { id: `rId${F + 3}`, type: f.tableStyles, target: "tableStyles.xml" }
  );
  const R = `rId${F + 4}`;
  j && (P.push({ id: R, type: f.notesMaster, target: "notesMasters/notesMaster1.xml" }), p.set("ppt/notesMasters/notesMaster1.xml", de), p.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", A([
    { id: "rId1", type: f.theme, target: "../theme/theme2.xml" }
  ])), p.set("ppt/theme/theme2.xml", ht), u.push(["/ppt/notesMasters/notesMaster1.xml", k.notesMaster], ["/ppt/theme/theme2.xml", k.theme]));
  const E = v + `<p:presentation ${_} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (j ? `<p:notesMasterIdLst><p:notesMasterId r:id="${R}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${I}</p:sldIdLst><p:sldSz cx="${i}" cy="${h}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${Z(1800)}</p:defaultTextStyle>${fe(b, (d) => 256 + d)}</p:presentation>`;
  p.set("ppt/presentation.xml", E), p.set("ppt/_rels/presentation.xml.rels", A(P)), p.set("ppt/slideMasters/slideMaster1.xml", pe), p.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", A([
    { id: "rId1", type: f.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: f.theme, target: "../theme/theme1.xml" }
  ])), p.set("ppt/slideLayouts/slideLayout1.xml", ce), p.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", A([
    { id: "rId1", type: f.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), p.set("ppt/theme/theme1.xml", ht), p.set("ppt/presProps.xml", t.loop ? $e : he), p.set("ppt/viewProps.xml", ue), p.set("ppt/tableStyles.xml", xe);
  const s = e.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  p.set("docProps/core.xml", ge(t.title || "YappyDraw presentation", s)), p.set("docProps/app.xml", ve(b.length, b.filter((d) => !!d.notes?.trim()).length)), p.set("_rels/.rels", A([
    { id: "rId1", type: f.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: f.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: f.extProps, target: "docProps/app.xml" }
  ])), u.push(
    ["/ppt/presentation.xml", k.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", k.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", k.slideLayout],
    ["/ppt/theme/theme1.xml", k.theme],
    ["/ppt/presProps.xml", k.presProps],
    ["/ppt/viewProps.xml", k.viewProps],
    ["/ppt/tableStyles.xml", k.tableStyles],
    ["/docProps/core.xml", k.core],
    ["/docProps/app.xml", k.app]
  );
  const c = v + `<Types xmlns="${L.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...g].map((d) => `<Default Extension="${d}" ContentType="${Bt[d]}"/>`).join("") + (N ? '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>' : "") + u.map(([d, m]) => `<Override PartName="${d}" ContentType="${m}"/>`).join("") + "</Types>";
  return p.set("[Content_Types].xml", c), kt(p);
}
export {
  Se as buildPptx,
  me as notesXml
};
