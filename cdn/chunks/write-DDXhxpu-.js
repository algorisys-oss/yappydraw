import { z as be, s as Se } from "./browser-DbZP-BrN.js";
import { e as S, X as v, r as N, N as L, z as Ce, E as w, a as he, p as D, b as Me, c as ke, R as f, f as Le } from "./custgeom-DUHYX5Vs.js";
import { a1 as $e, a2 as fe, a3 as we, a4 as re } from "./index-Bqlr2FLr.js";
const te = "http://schemas.openxmlformats.org/drawingml/2006/chart", Fe = "http://schemas.openxmlformats.org/drawingml/2006/main", ue = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", le = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function ae(e) {
  let t = "";
  for (let n = e + 1; n > 0; n = Math.floor((n - 1) / 26)) t = String.fromCharCode(65 + (n - 1) % 26) + t;
  return t;
}
const J = (e) => Number.isInteger(e) ? String(e) : String(Math.round(e * 1e10) / 1e10), se = (e) => /^#[0-9a-f]{6}$/i.test(e) ? e.slice(1).toUpperCase() : /^#[0-9a-f]{3}$/i.test(e) ? e.slice(1).split("").map((t) => t + t).join("").toUpperCase() : "4472C4", Q = (e) => `<c:spPr><a:solidFill><a:srgbClr val="${se(e)}"/></a:solidFill></c:spPr>`, Te = (e, t = 28575) => `<c:spPr><a:ln w="${t}" cap="rnd"><a:solidFill><a:srgbClr val="${se(e)}"/></a:solidFill><a:round/></a:ln></c:spPr>`;
function pe(e, t) {
  return `<c:strRef><c:f>${S(e)}</c:f><c:strCache><c:ptCount val="${t.length}"/>` + t.map((n, s) => `<c:pt idx="${s}"><c:v>${S(n)}</c:v></c:pt>`).join("") + "</c:strCache></c:strRef>";
}
function Ie(e, t) {
  return `<c:numRef><c:f>${S(e)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${t.length}"/>` + t.map((n, s) => n === null ? "" : `<c:pt idx="${s}"><c:v>${J(n)}</c:v></c:pt>`).join("") + "</c:numCache></c:numRef>";
}
const Ee = (e) => `<c:dLbls><c:showLegendKey val="0"/><c:showVal val="${e ? 0 : 1}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${e ? 1 : 0}"/><c:showBubbleSize val="0"/></c:dLbls>`;
function _e(e) {
  const t = $e(e), s = t.categories.length + 1, r = fe(t.kind), l = r ? t.series.slice(0, 1) : t.series, c = `<c:cat>${pe(`Sheet1!$A$2:$A$${s}`, t.categories)}</c:cat>`, i = l.map((A, I) => {
    const F = ae(I + 1), R = we(t, I), E = `<c:idx val="${I}"/><c:order val="${I}"/><c:tx>${pe(`Sheet1!$${F}$1`, [A.name])}</c:tx>`, a = `<c:val>${Ie(`Sheet1!$${F}$2:$${F}$${s}`, A.values)}</c:val>`;
    switch (t.kind) {
      case "line":
        return `<c:ser>${E}${Te(R)}<c:marker><c:symbol val="circle"/><c:size val="5"/>${Q(R)}</c:marker>${c}${a}<c:smooth val="0"/></c:ser>`;
      case "area":
        return `<c:ser>${E}${Q(R)}${c}${a}</c:ser>`;
      case "pie":
      case "doughnut": {
        const o = t.categories.map((d, m) => `<c:dPt><c:idx val="${m}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${se(re[m % re.length])}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`).join("");
        return `<c:ser>${E}${o}${c}${a}</c:ser>`;
      }
      default:
        return `<c:ser>${E}${Q(R)}<c:invertIfNegative val="0"/>${c}${a}</c:ser>`;
    }
  }).join(""), $ = t.dataLabels ? Ee(r) : "", p = '<c:axId val="500000001"/><c:axId val="500000002"/>';
  let u;
  switch (t.kind) {
    case "column":
    case "bar":
      u = `<c:barChart><c:barDir val="${t.kind === "bar" ? "bar" : "col"}"/><c:grouping val="${t.stacked ? "stacked" : "clustered"}"/><c:varyColors val="0"/>${i}${$}<c:gapWidth val="${t.stacked ? 60 : 150}"/>${t.stacked ? '<c:overlap val="100"/>' : ""}${p}</c:barChart>`;
      break;
    case "line":
      u = `<c:lineChart><c:grouping val="${t.stacked ? "stacked" : "standard"}"/><c:varyColors val="0"/>${i}${$}<c:marker val="1"/>${p}</c:lineChart>`;
      break;
    case "area":
      u = `<c:areaChart><c:grouping val="${t.stacked ? "stacked" : "standard"}"/><c:varyColors val="0"/>${i}${$}${p}</c:areaChart>`;
      break;
    case "pie":
      u = `<c:pieChart><c:varyColors val="1"/>${i}${$}<c:firstSliceAng val="0"/></c:pieChart>`;
      break;
    default:
      u = `<c:doughnutChart><c:varyColors val="1"/>${i}${$}<c:firstSliceAng val="0"/><c:holeSize val="50"/></c:doughnutChart>`;
  }
  const g = t.kind === "bar", x = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"><a:solidFill><a:srgbClr val="595959"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>', P = r ? "" : `<c:catAx><c:axId val="500000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${g ? "l" : "b"}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>${x}<c:crossAx val="500000002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="500000002"/><c:scaling><c:orientation val="minMax"/>` + (t.yMax !== void 0 ? `<c:max val="${J(t.yMax)}"/>` : "") + (t.yMin !== void 0 ? `<c:min val="${J(t.yMin)}"/>` : "") + `</c:scaling><c:delete val="0"/><c:axPos val="${g ? "b" : "l"}"/>` + (t.gridlines !== !1 ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : "") + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${x}<c:crossAx val="500000001"/><c:crosses val="autoZero"/><c:crossBetween val="${t.kind === "area" ? "midCat" : "between"}"/></c:valAx>`, k = t.title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1800" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1800" b="1"/><a:t>${S(t.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>` : '<c:autoTitleDeleted val="1"/>', b = { right: "r", bottom: "b", top: "t" }[t.legend], B = b ? `<c:legend><c:legendPos val="${b}"/><c:overlay val="0"/>${x}</c:legend>` : "";
  return v + `<c:chartSpace xmlns:c="${te}" xmlns:a="${Fe}" xmlns:r="${ue}"><c:date1904 val="0"/><c:roundedCorners val="0"/><c:chart>${k}<c:plotArea><c:layout/>${u}${P}</c:plotArea>${B}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;
}
function Re(e) {
  const t = $e(e), n = fe(t.kind) ? t.series.slice(0, 1) : t.series, s = (c, i) => `<c r="${c}" t="inlineStr"><is><t>${S(i)}</t></is></c>`, r = [
    `<row r="1">${s("A1", "")}${n.map((c, i) => s(`${ae(i + 1)}1`, c.name)).join("")}</row>`,
    ...t.categories.map((c, i) => `<row r="${i + 2}">${s(`A${i + 2}`, c)}` + n.map(($, p) => $.values[i] === null ? "" : `<c r="${ae(p + 1)}${i + 2}"><v>${J($.values[i])}</v></c>`).join("") + "</row>")
  ], l = {
    "[Content_Types].xml": v + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels": v + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": v + `<workbook xmlns="${le}" xmlns:r="${ue}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": v + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": v + `<worksheet xmlns="${le}"><sheetData>${r.join("")}</sheetData></worksheet>`
  };
  return be(Object.fromEntries(Object.entries(l).map(([c, i]) => [c, Se(i)])));
}
const Y = 914400, H = 51206400, Ne = "http://schemas.microsoft.com/office/powerpoint/2015/09/main", _ = `xmlns:a="${L.a}" xmlns:r="${L.r}" xmlns:p="${L.p}"`, M = {
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
}, Ae = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, oe = (e) => {
  const t = String(e || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(t) ? t.toUpperCase() : "000000";
}, j = (e) => {
  const t = e.alpha;
  return t !== void 0 && t < 1 ? `<a:srgbClr val="${oe(e.hex)}"><a:alpha val="${D(t)}"/></a:srgbClr>` : `<a:srgbClr val="${oe(e.hex)}"/>`;
}, ce = (e) => {
  const t = [...e].sort((s, r) => s.pos - r.pos);
  return "<a:gsLst>" + (t.length === 1 ? [{ ...t[0], pos: 0 }, { ...t[0], pos: 1 }] : t).map((s) => `<a:gs pos="${D(s.pos)}">${j(s.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function xe(e) {
  if (!e || e.kind === "none") return "<a:noFill/>";
  switch (e.kind) {
    case "solid":
      return `<a:solidFill>${j(e.color)}</a:solidFill>`;
    case "linear":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${ce(e.stops)}<a:lin ang="${he(e.angle)}" scaled="${e.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${ce(e.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${S(e.preset)}"><a:fgClr>${j(e.color)}</a:fgClr><a:bgClr>${e.bg ? j(e.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function ge(e, t) {
  if (!e || !(e.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let s = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(e.width * t * w)))}"${e.cap ? ` cap="${e.cap}"` : ""}><a:solidFill>${j(e.color)}</a:solidFill>`;
  e.dash && (s += `<a:prstDash val="${S(e.dash)}"/>`), e.join === "round" ? s += "<a:round/>" : e.join === "bevel" ? s += "<a:bevel/>" : e.join === "miter" && (s += '<a:miter lim="800000"/>');
  const r = (l, c) => c ? `<a:${l} type="${c.type}" w="${c.size ?? "med"}" len="${c.size ?? "med"}"/>` : "";
  return s += r("headEnd", e.head) + r("tailEnd", e.tail), s + "</a:ln>";
}
function ee(e, t, n = "a:rPr") {
  const s = ['lang="en-US"'];
  e.size && s.push(`sz="${Le(e.size * t)}"`), e.bold !== void 0 && s.push(`b="${e.bold ? 1 : 0}"`), e.italic !== void 0 && s.push(`i="${e.italic ? 1 : 0}"`), e.underline && s.push('u="sng"'), e.strike && s.push('strike="sngStrike"'), s.push('dirty="0"');
  let r = "";
  if (e.color && (r += `<a:solidFill>${j(e.color)}</a:solidFill>`), e.font) {
    const l = S(e.font);
    r += `<a:latin typeface="${l}"/><a:ea typeface="${l}"/><a:cs typeface="${l}"/>`;
  }
  return r ? `<${n} ${s.join(" ")}>${r}</${n}>` : `<${n} ${s.join(" ")}/>`;
}
const De = 20, je = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), Be = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function Oe(e, t, n) {
  const s = Math.max(0, Math.min(8, e.level ?? 0)), r = [];
  e.align && r.push(`algn="${e.align}"`);
  let l = "";
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 1e-3 && (l += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, t.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const c = (g, x) => x && x > 0 ? `<a:${g}><a:spcPts val="${Math.round(Math.min(1584, x * n * 0.75) * 100)}"/></a:${g}>` : "";
  if (l += c("spcBef", e.spaceBefore) + c("spcAft", e.spaceAfter), e.bullet) {
    const g = De * n * w, x = e.marL !== void 0 ? e.marL * n * w : g * (s + 1), C = e.indent !== void 0 ? e.indent * n * w : -g, P = (k, b) => Math.round(Math.max(b, Math.min(51206400, k)));
    if (r.push(`marL="${P(x, 0)}" indent="${P(C, -51206400)}"`), s && r.push(`lvl="${s}"`), e.bulletColor && (l += `<a:buClr>${j(e.bulletColor)}</a:buClr>`), e.bulletScale && Math.abs(e.bulletScale - 1) > 1e-3 && (l += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, e.bulletScale)) * 1e5)}"/>`), e.bullet === "num") {
      const k = e.numType && Be.test(e.numType) ? e.numType : "arabicPeriod", b = e.startAt && e.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(e.startAt))}"` : "";
      l += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${k}"${b}/>`;
    } else {
      const k = e.bulletChar || "•";
      l += `<a:buFont typeface="${je.has(k) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${S(k)}"/>`;
    }
  } else
    s && r.push(`lvl="${s}"`), l += "<a:buNone/>";
  const i = `<a:pPr${r.length ? " " + r.join(" ") : ""}>${l}</a:pPr>`, $ = t.defaults ?? {};
  let p = "";
  for (const g of e.runs) {
    const x = { ...$, ...ze(g) };
    if (g.br) {
      p += `<a:br>${ee(x, n)}</a:br>`;
      continue;
    }
    g.text && (p += `<a:r>${ee(x, n)}<a:t>${S(g.text)}</a:t></a:r>`);
  }
  const u = e.endSize ?? $.size;
  return `<a:p>${i}${p}${ee({ ...$, size: u }, n, "a:endParaRPr")}</a:p>`;
}
const ze = (e) => Object.fromEntries(Object.entries(e).filter(([, t]) => t !== void 0));
function Xe(e, t, n = "p:txBody") {
  if (!e) return "";
  const s = (c) => Math.max(0, Math.round(c * t * w)), r = `<a:bodyPr wrap="${e.wrap ? "square" : "none"}" lIns="${s(e.insets.l)}" tIns="${s(e.insets.t)}" rIns="${s(e.insets.r)}" bIns="${s(e.insets.b)}" anchor="${e.anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr>`, l = e.paragraphs.length ? e.paragraphs : [{ runs: [] }];
  return `<${n}>${r}<a:lstStyle/>${l.map((c) => Oe(c, e, t)).join("")}</${n}>`;
}
const ve = (e, t, n) => e.kind === "preset" ? Me(e.prst, e.adj) : ke(e.paths, t, n), Ge = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function Ue(e, t) {
  if (!e) return "";
  const n = (r, l, c) => {
    const i = t.rels.find((p) => p.type === r && p.target === l);
    if (i) return i.id;
    const $ = `rId${t.rels.length + 1}`;
    return t.rels.push({ id: $, type: r, target: l, external: c }), $;
  };
  if (e.kind === "url") return `<a:hlinkClick r:id="${n(f.hyperlink, e.url, !0)}"/>`;
  if (e.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${Ge[e.action]}"/>`;
  const s = t.slideNumber?.(e.key);
  return s ? `<a:hlinkClick r:id="${n(f.slide, `slide${s}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const V = (e, t, n = "a:xfrm", s = !1) => {
  const r = Math.round((e.x * t.s + t.dx) * w), l = Math.round((e.y * t.s + t.dy) * w), c = Math.max(0, Math.round(Math.abs(e.w) * t.s * w)), i = Math.max(0, Math.round(Math.abs(e.h) * t.s * w)), $ = [
    e.rot ? `rot="${he(e.rot)}"` : "",
    e.flipH ? 'flipH="1"' : "",
    e.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), p = s ? `<a:chOff x="${r}" y="${l}"/><a:chExt cx="${c}" cy="${i}"/>` : "";
  return `<${n}${$ ? " " + $ : ""}><a:off x="${r}" y="${l}"/><a:ext cx="${c}" cy="${i}"/>${p}</${n}>`;
}, W = (e, t, n) => {
  const s = `<p:cNvPr id="${e.id}" name="${S(e.name)}"${n ? ` descr="${S(n)}"` : ""}`, r = Ue(e.link, t);
  return r ? `${s}>${r}</p:cNvPr>` : `${s}/>`;
};
function He(e, t) {
  const n = `<p:nvSpPr>${W(e, t)}<p:cNvSpPr${e.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, s = `<p:spPr>${V(e, t)}${ve(e.geom, e.w, e.h)}${xe(e.fill)}${ge(e.line, t.s)}</p:spPr>`, r = e.text ? Xe(e.text, t.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${n}${s}${r}</p:sp>`;
}
function Ve(e, t) {
  const n = (r, l) => l ? `<a:${r} id="${l.id}" idx="${l.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${W(e, t)}<p:cNvCxnSpPr>${n("stCxn", e.start)}${n("endCxn", e.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${V(e, t)}${ve(e.geom, e.w, e.h)}<a:noFill/>${ge(e.line, t.s)}</p:spPr></p:cxnSp>`;
}
function We(e, t) {
  const n = t.media(e.media), s = `<p:nvPicPr>${W(e, t, e.descr)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, r = e.alpha !== void 0 && e.alpha < 1 ? `<a:alphaModFix amt="${D(e.alpha)}"/>` : "", l = e.crop, c = l ? `<a:srcRect l="${D(l.l)}" t="${D(l.t)}" r="${D(l.r)}" b="${D(l.b)}"/>` : "", i = `<p:blipFill><a:blip r:embed="${n}">${r}</a:blip>${c}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${s}${i}<p:spPr>${V(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function qe(e, t) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${W(e, t)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${V(e, t, "a:xfrm", !0)}</p:grpSpPr>${e.children.map((s) => ye(s, t)).join("")}</p:grpSp>`;
}
function Ye(e, t) {
  const n = t.chart?.(e.chart);
  return n ? `<p:graphicFrame><p:nvGraphicFramePr>${W(e, t)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + V(e, t, "p:xfrm") + `<a:graphic><a:graphicData uri="${te}"><c:chart xmlns:c="${te}" r:id="${n}"/></a:graphicData></a:graphic></p:graphicFrame>` : "";
}
function ye(e, t) {
  switch (e.kind) {
    case "chart":
      return Ye(e, t);
    case "shape":
      return He(e, t);
    case "connector":
      return Ve(e, t);
    case "picture":
      return We(e, t);
    case "group":
      return e.children.length ? qe(e, t) : "";
  }
}
const q = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function Ze(e, t) {
  const n = t && t > 0 ? ` advTm="${Math.round(t)}"` : "";
  if (!e) return n ? `<mc:AlternateContent xmlns:mc="${L.mc}"><mc:Choice xmlns:p14="${L.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${n}/></mc:Choice><mc:Fallback><p:transition spd="fast"${n}/></mc:Fallback></mc:AlternateContent>` : "";
  const s = Math.max(0, Math.min(6e4, Math.round(e.durationMs))), r = s <= 600 ? "fast" : s <= 900 ? "med" : "slow", l = e.kind === "push" ? `<p:push dir="${e.dir ?? "l"}"/>` : e.kind === "zoom" ? `<p:zoom dir="${e.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return e.kind === "morph" ? `<mc:AlternateContent xmlns:mc="${L.mc}"><mc:Choice xmlns:p159="${Ne}" xmlns:p14="${L.p14}" Requires="p159"><p:transition spd="${r}" p14:dur="${s}"${n}><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="${r}"${n}><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>` : `<mc:AlternateContent xmlns:mc="${L.mc}"><mc:Choice xmlns:p14="${L.p14}" Requires="p14"><p:transition spd="${r}" p14:dur="${s}"${n}>${l}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${r}"${n}>${l}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
const Je = { l: ["0-#ppt_w/2", "#ppt_y"], r: ["1+#ppt_w/2", "#ppt_y"], t: ["#ppt_x", "0-#ppt_h/2"], b: ["#ppt_x", "1+#ppt_h/2"] }, Ke = { l: "wipe(right)", r: "wipe(left)", t: "wipe(down)", b: "wipe(up)" };
function Qe(e, t) {
  if (!e.length) return "";
  let n = 0;
  const s = () => ++n, r = (a) => `<p:tgtEl><p:spTgt spid="${a}"/></p:tgtEl>`, l = (a, o, d = [], m, h) => `<p:cBhvr${h ? ` additive="${h}"` : ""}>` + (m !== void 0 ? `<p:cTn id="${s()}" dur="${Math.max(1, o)}" fill="hold"><p:stCondLst><p:cond delay="${m}"/></p:stCondLst></p:cTn>` : `<p:cTn id="${s()}" dur="${Math.max(1, o)}" fill="hold"/>`) + r(a.target) + (d.length ? `<p:attrNameLst>${d.map((y) => `<p:attrName>${y}</p:attrName>`).join("")}</p:attrNameLst>` : "") + "</p:cBhvr>", c = (a, o, d) => `<p:set>${l(a, 1, ["style.visibility"], o)}<p:to><p:strVal val="${d ? "visible" : "hidden"}"/></p:to></p:set>`, i = (a, o, d, m, h) => `<p:anim calcmode="lin" valueType="num">${l(a, o, [d], void 0, "base")}<p:tavLst><p:tav tm="0"><p:val><p:strVal val="${m}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${h}"/></p:val></p:tav></p:tavLst></p:anim>`, $ = (a, o, d, m) => `<p:animEffect transition="${m ? "out" : "in"}" filter="${d}">${l(a, o)}</p:animEffect>`, p = (a, o, d) => `<p:animRot by="${Math.round(Math.max(-36e3, Math.min(36e3, d)) * 6e4)}">${l(a, o, ["r"])}</p:animRot>`, u = (a, o, d) => `<p:animScale>${l(a, o)}<p:by x="${d * 1e3}" y="${d * 1e3}"/></p:animScale>`, g = (a) => {
    const o = Math.max(1, Math.min(36e5, a.durationMs)), d = a.dir ?? "b";
    if (a.cls === "emph")
      return a.effect === "spin" ? p(a, o, a.degrees ?? 360) : a.effect === "teeter" ? p(a, o, 4) : u(a, o, a.effect === "growShrink" ? 150 : 105);
    const m = a.cls === "exit";
    let h = m ? "" : c(a, 0, !0);
    switch (a.effect) {
      case "appear":
        break;
      case "fly": {
        const [y, O] = Je[d];
        h += m ? i(a, o, "ppt_x", "#ppt_x", y) + i(a, o, "ppt_y", "#ppt_y", O) : i(a, o, "ppt_x", y, "#ppt_x") + i(a, o, "ppt_y", O, "#ppt_y");
        break;
      }
      case "zoom":
      case "grow":
      case "spinner":
      case "bounce":
      case "swivel": {
        const y = a.effect === "swivel" ? i(a, o, "ppt_w", m ? "#ppt_w" : "0", m ? "0" : "#ppt_w") : i(a, o, "ppt_w", m ? "#ppt_w" : "0", m ? "0" : "#ppt_w") + i(a, o, "ppt_h", m ? "#ppt_h" : "0", m ? "0" : "#ppt_h");
        h += y, a.effect === "spinner" && (h += p(a, o, m ? -360 : 360)), h += $(a, o, "fade", m);
        break;
      }
      case "wipe":
        h += $(a, o, Ke[a.dir ?? "l"], m);
        break;
      default:
        h += $(a, o, "fade", m);
    }
    return m ? h + c(a, a.effect === "appear" ? 0 : o - 1, !1) : h;
  }, x = /* @__PURE__ */ new Map(), C = /* @__PURE__ */ new Map();
  for (const a of e) {
    const o = x.get(a.target) ?? 0;
    C.set(a, o), x.set(a.target, o + 1);
  }
  const P = (a) => {
    const o = a.start === "click" ? "clickEffect" : a.start === "with" ? "withEffect" : "afterEffect", d = a.repeat === -1 ? ' repeatCount="indefinite"' : a.repeat && a.repeat > 1 ? ` repeatCount="${Math.min(1e4, a.repeat) * 1e3}"` : "", m = a.cls === "emph" && (a.effect === "pulse" || a.effect === "growShrink") ? ' autoRev="1"' : "";
    return `<p:par><p:cTn id="${s()}" presetID="${a.presetId}" presetClass="${a.cls}" presetSubtype="${a.subtype}"${d}${m} fill="hold" grpId="${C.get(a)}" nodeType="${o}"><p:stCondLst><p:cond delay="${Math.min(36e5, a.delayMs)}"/></p:stCondLst><p:childTnLst>${g(a)}</p:childTnLst></p:cTn></p:par>`;
  }, k = (a) => a.delayMs + a.durationMs * (a.repeat && a.repeat > 1 ? Math.min(100, a.repeat) : 1), b = [];
  for (const a of e) {
    const o = b[b.length - 1];
    a.start === "click" || !o ? b.push({ auto: a.start !== "click", groups: [[a]] }) : a.start === "with" ? o.groups[o.groups.length - 1].push(a) : o.groups.push([a]);
  }
  const B = s(), A = s(), I = b.map((a) => {
    const o = a.auto ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : '<p:cond delay="indefinite"/>', d = s();
    let m = 0;
    const h = a.groups.map((y) => {
      const X = `<p:par><p:cTn id="${s()}" fill="hold"><p:stCondLst><p:cond delay="${m}"/></p:stCondLst><p:childTnLst>${y.map(P).join("")}</p:childTnLst></p:cTn></p:par>`;
      return m += Math.max(...y.map(k)), X;
    }).join("");
    return `<p:par><p:cTn id="${d}" fill="hold"><p:stCondLst>${o}</p:stCondLst><p:childTnLst>${h}</p:childTnLst></p:cTn></p:par>`;
  }).join(""), F = /* @__PURE__ */ new Set();
  ((a) => a.forEach((o) => {
    o.kind === "shape" && F.add(o.id);
  }))(t);
  const E = [...new Set(e.map((a) => a.target))].filter((a) => F.has(a)).flatMap((a) => Array.from({ length: x.get(a) ?? 1 }, (o, d) => `<p:bldP spid="${a}" grpId="${d}" animBg="1"/>`)).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="${B}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="${A}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${I}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${E ? `<p:bldLst>${E}</p:bldLst>` : ""}</p:timing>`;
}
function et(e, t) {
  let n = "";
  const s = e.background;
  s && s.kind === "image" ? n = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${t.media(s.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : s && s.kind !== "none" && (n = `<p:bg><p:bgPr>${xe(s)}<a:effectLst/></p:bgPr></p:bg>`);
  const r = e.items.map((i) => ye(i, t)).join(""), l = e.name ? ` name="${S(e.name)}"` : "", c = e.hidden ? ' show="0"' : "";
  return v + `<p:sld ${_}${c}><p:cSld${l}>${n}<p:spTree>${q}${r}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${Ze(e.transition, e.advanceAfterMs)}${Qe(e.anims ?? [], e.items)}</p:sld>`;
}
const Z = (e, t = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${t}<a:defRPr sz="${e}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, ie = v + `<a:theme xmlns:a="${L.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, tt = v + `<p:sldMaster ${_}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${q}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${Z(4400)}</p:titleStyle><p:bodyStyle>${Z(2800)}</p:bodyStyle><p:otherStyle>${Z(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, at = v + `<p:sldLayout ${_} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${q}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, de = 6858e3, me = 9144e3, z = (e, t, n, s, r, l, c, i, $ = "") => {
  const p = `<a:xfrm><a:off x="${Math.round(de * r)}" y="${Math.round(me * l)}"/><a:ext cx="${Math.round(de * c)}" cy="${Math.round(me * i)}"/></a:xfrm>`, u = n === "sldImg", g = u ? "" : ' sz="quarter"', x = u ? `<p:spPr>${p}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${p}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, C = u ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', P = u ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${$ || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${e}" name="${t}"/><p:cNvSpPr>${C}</p:cNvSpPr><p:nvPr><p:ph type="${n}"${g} idx="${s}"/></p:nvPr></p:nvSpPr>${x}${P}</p:sp>`;
}, st = Array.from({ length: 9 }, (e, t) => `<a:lvl${t + 1}pPr marL="${t * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${t + 1}pPr>`).join(""), nt = v + `<p:notesMaster ${_}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${q}` + z(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + z(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + z(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + z(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + z(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + z(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${st}</p:notesStyle></p:notesMaster>`;
function rt(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((r) => r ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${S(r)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), n = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', s = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${t}</p:txBody></p:sp>`;
  return v + `<p:notes ${_}><p:cSld><p:spTree>${q}${n}${s}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const lt = v + `<p:presentationPr ${_}/>`, pt = v + `<p:presentationPr ${_}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;
function ot(e, t) {
  if (!e.some((r) => r.section)) return "";
  const n = [];
  e.forEach((r, l) => {
    (r.section || !n.length) && n.push({ name: r.section || "Default Section", ids: [] }), n[n.length - 1].ids.push(t(l));
  });
  const s = (r) => `{8F3A1C2E-5B7D-4E9A-9C11-${(r + 1).toString(16).toUpperCase().padStart(12, "0")}}`;
  return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${L.p14}">` + n.map((r, l) => `<p14:section name="${S(r.name)}" id="${s(l)}"><p14:sldIdLst>${r.ids.map((c) => `<p14:sldId id="${c}"/>`).join("")}</p14:sldIdLst></p14:section>`).join("") + "</p14:sectionLst></p:ext></p:extLst>";
}
const ct = v + `<p:viewPr ${_}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, it = v + `<a:tblStyleLst xmlns:a="${L.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, dt = (e, t) => v + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${S(e)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${t}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${t}</dcterms:modified></cp:coreProperties>`, mt = (e, t) => v + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${e}</Slides><Notes>${t}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function ut(e, t = {}) {
  const n = Math.max(1, e.width), s = Math.max(1, e.height), r = Math.max(n, s) * w, l = Math.min(n, s) * w, c = r > H ? H / r : l < Y ? Math.min(Y / l, H / r) : 1, i = Math.max(Y, Math.min(H, Math.round(n * c * w))), $ = Math.max(Y, Math.min(H, Math.round(s * c * w))), p = /* @__PURE__ */ new Map(), u = [], g = /* @__PURE__ */ new Set();
  let x = 0, C = 0;
  const P = e.slides.length ? e.slides : [{ items: [] }], k = /* @__PURE__ */ new Map();
  P.forEach((d, m) => {
    d.key && k.set(d.key, m + 1);
  });
  const b = [{ id: "rId1", type: f.slideMaster, target: "slideMasters/slideMaster1.xml" }], B = P.some((d) => !!d.notes?.trim());
  let A = !1, I = "";
  P.forEach((d, m) => {
    const h = m + 1, y = [{ id: "rId1", type: f.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], O = /* @__PURE__ */ new Map(), X = d.fit ?? { scale: 1, dx: 0, dy: 0 }, Pe = {
      s: X.scale * c,
      dx: X.dx * c,
      dy: X.dy * c,
      rels: y,
      slideNumber: (T) => k.get(T) ?? null,
      chart: (T) => {
        C++;
        const G = `Microsoft_Excel_Worksheet${C}.xlsx`;
        p.set(`ppt/charts/chart${C}.xml`, _e(T)), p.set(`ppt/charts/_rels/chart${C}.xml.rels`, N([{ id: "rId1", type: f.package, target: `../embeddings/${G}` }])), p.set(`ppt/embeddings/${G}`, Re(T)), u.push([`/ppt/charts/chart${C}.xml`, M.chart]), A = !0;
        const U = `rId${y.length + 1}`;
        return y.push({ id: U, type: f.chart, target: `../charts/chart${C}.xml` }), U;
      },
      media: (T) => {
        const G = O.get(T);
        if (G) return G;
        x++;
        const U = `image${x}.${T.ext}`;
        p.set(`ppt/media/${U}`, T.bytes), g.add(T.ext);
        const K = `rId${y.length + 1}`;
        return y.push({ id: K, type: f.image, target: `../media/${U}` }), O.set(T, K), K;
      }
    };
    p.set(`ppt/slides/slide${h}.xml`, et(d, Pe)), d.notes?.trim() && (y.push({ id: `rId${y.length + 1}`, type: f.notesSlide, target: `../notesSlides/notesSlide${h}.xml` }), p.set(`ppt/notesSlides/notesSlide${h}.xml`, rt(d.notes)), p.set(`ppt/notesSlides/_rels/notesSlide${h}.xml.rels`, N([
      { id: "rId1", type: f.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: f.slide, target: `../slides/slide${h}.xml` }
    ])), u.push([`/ppt/notesSlides/notesSlide${h}.xml`, M.notesSlide])), p.set(`ppt/slides/_rels/slide${h}.xml.rels`, N(y)), u.push([`/ppt/slides/slide${h}.xml`, M.slide]);
    const ne = `rId${h + 1}`;
    b.push({ id: ne, type: f.slide, target: `slides/slide${h}.xml` }), I += `<p:sldId id="${255 + h}" r:id="${ne}"/>`;
  });
  const F = P.length + 2;
  b.push(
    { id: `rId${F}`, type: f.theme, target: "theme/theme1.xml" },
    { id: `rId${F + 1}`, type: f.presProps, target: "presProps.xml" },
    { id: `rId${F + 2}`, type: f.viewProps, target: "viewProps.xml" },
    { id: `rId${F + 3}`, type: f.tableStyles, target: "tableStyles.xml" }
  );
  const R = `rId${F + 4}`;
  B && (b.push({ id: R, type: f.notesMaster, target: "notesMasters/notesMaster1.xml" }), p.set("ppt/notesMasters/notesMaster1.xml", nt), p.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", N([
    { id: "rId1", type: f.theme, target: "../theme/theme2.xml" }
  ])), p.set("ppt/theme/theme2.xml", ie), u.push(["/ppt/notesMasters/notesMaster1.xml", M.notesMaster], ["/ppt/theme/theme2.xml", M.theme]));
  const E = v + `<p:presentation ${_} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (B ? `<p:notesMasterIdLst><p:notesMasterId r:id="${R}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${I}</p:sldIdLst><p:sldSz cx="${i}" cy="${$}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${Z(1800)}</p:defaultTextStyle>${ot(P, (d) => 256 + d)}</p:presentation>`;
  p.set("ppt/presentation.xml", E), p.set("ppt/_rels/presentation.xml.rels", N(b)), p.set("ppt/slideMasters/slideMaster1.xml", tt), p.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", N([
    { id: "rId1", type: f.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: f.theme, target: "../theme/theme1.xml" }
  ])), p.set("ppt/slideLayouts/slideLayout1.xml", at), p.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", N([
    { id: "rId1", type: f.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), p.set("ppt/theme/theme1.xml", ie), p.set("ppt/presProps.xml", e.loop ? pt : lt), p.set("ppt/viewProps.xml", ct), p.set("ppt/tableStyles.xml", it);
  const a = t.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  p.set("docProps/core.xml", dt(e.title || "YappyDraw presentation", a)), p.set("docProps/app.xml", mt(P.length, P.filter((d) => !!d.notes?.trim()).length)), p.set("_rels/.rels", N([
    { id: "rId1", type: f.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: f.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: f.extProps, target: "docProps/app.xml" }
  ])), u.push(
    ["/ppt/presentation.xml", M.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", M.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", M.slideLayout],
    ["/ppt/theme/theme1.xml", M.theme],
    ["/ppt/presProps.xml", M.presProps],
    ["/ppt/viewProps.xml", M.viewProps],
    ["/ppt/tableStyles.xml", M.tableStyles],
    ["/docProps/core.xml", M.core],
    ["/docProps/app.xml", M.app]
  );
  const o = v + `<Types xmlns="${L.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...g].map((d) => `<Default Extension="${d}" ContentType="${Ae[d]}"/>`).join("") + (A ? '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>' : "") + u.map(([d, m]) => `<Override PartName="${d}" ContentType="${m}"/>`).join("") + "</Types>";
  return p.set("[Content_Types].xml", o), Ce(p);
}
export {
  ut as buildPptx,
  rt as notesXml
};
