import { z as ze, s as Oe } from "./browser-D4hpQp_u.js";
import { e as k, X as C, r as X, N as R, z as Ge, E as w, b as Ae, d as D, f as Xe, g as Ue, R as g, h as Ve } from "./custgeom-yLdmoMSF.js";
import { aB as Ie, aC as me, aD as qe, aE as ge, aF as be, aG as He, aH as ye, aI as he, U as Ye } from "./index-DEKxp5SH.js";
const ie = "http://schemas.openxmlformats.org/drawingml/2006/chart", We = "http://schemas.openxmlformats.org/drawingml/2006/main", Ee = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", Pe = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function le(e) {
  let t = "";
  for (let r = e + 1; r > 0; r = Math.floor((r - 1) / 26)) t = String.fromCharCode(65 + (r - 1) % 26) + t;
  return t;
}
const J = (e) => Number.isInteger(e) ? String(e) : String(Math.round(e * 1e10) / 1e10), $e = (e) => /^#[0-9a-f]{6}$/i.test(e) ? e.slice(1).toUpperCase() : /^#[0-9a-f]{3}$/i.test(e) ? e.slice(1).split("").map((t) => t + t).join("").toUpperCase() : "4472C4", V = (e) => `<c:spPr><a:solidFill><a:srgbClr val="${$e(e)}"/></a:solidFill></c:spPr>`, oe = (e, t = 28575) => `<c:spPr><a:ln w="${t}" cap="rnd"><a:solidFill><a:srgbClr val="${$e(e)}"/></a:solidFill><a:round/></a:ln></c:spPr>`;
function ce(e, t) {
  return `<c:strRef><c:f>${k(e)}</c:f><c:strCache><c:ptCount val="${t.length}"/>` + t.map((r, n) => `<c:pt idx="${n}"><c:v>${k(r)}</c:v></c:pt>`).join("") + "</c:strCache></c:strRef>";
}
function ee(e, t) {
  return `<c:numRef><c:f>${k(e)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${t.length}"/>` + t.map((r, n) => r === null ? "" : `<c:pt idx="${n}"><c:v>${J(r)}</c:v></c:pt>`).join("") + "</c:numCache></c:numRef>";
}
const Ze = (e) => `<c:dLbls><c:showLegendKey val="0"/><c:showVal val="${e ? 0 : 1}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${e ? 1 : 0}"/><c:showBubbleSize val="0"/></c:dLbls>`;
function Re(e) {
  const t = Ye(e);
  return t.kind === "stock" && t.series.length !== 3 && t.series.length !== 4 && (t.kind = "line"), Ie(t.kind) && (t.series = t.series.slice(0, 1)), t;
}
const de = (e, t) => le(e.kind === "bubble" ? 1 + t * 2 : 1 + t), Ne = (e) => he(e.kind) && e.categories.length > 0 && e.categories.every((t) => me(t) !== null);
function Ke(e) {
  const t = Re(e), n = t.categories.length + 1, o = Ie(t.kind), l = t.series, p = `Sheet1!$A$2:$A$${n}`, h = `<c:cat>${ce(p, t.categories)}</c:cat>`, u = `<c:xVal>${Ne(t) ? ee(p, t.categories.map(me)) : ce(p, t.categories)}</c:xVal>`, c = '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>', m = l.map((b, y) => {
    const d = de(t, y), a = qe(t, y), s = `<c:idx val="${y}"/><c:order val="${y}"/><c:tx>${ce(`Sheet1!$${d}$1`, [b.name])}</c:tx>`, i = `<c:val>${ee(`Sheet1!$${d}$2:$${d}$${n}`, b.values)}</c:val>`, $ = (f = 5) => `<c:marker><c:symbol val="circle"/><c:size val="${f}"/>${V(a)}</c:marker>`;
    switch (ge(t, b)) {
      case "scatter":
        return `<c:ser>${s}${t.lines ? oe(a) : c}${$(7)}${u}<c:yVal>${ee(`Sheet1!$${d}$2:$${d}$${n}`, b.values)}</c:yVal><c:smooth val="${t.smooth && t.lines ? 1 : 0}"/></c:ser>`;
      case "bubble": {
        const f = le(2 + y * 2);
        return `<c:ser>${s}${V(a)}<c:invertIfNegative val="0"/>${u}<c:yVal>${ee(`Sheet1!$${d}$2:$${d}$${n}`, b.values)}</c:yVal><c:bubbleSize>${ee(`Sheet1!$${f}$2:$${f}$${n}`, b.sizes ?? b.values.map(() => null))}</c:bubbleSize><c:bubble3D val="0"/></c:ser>`;
      }
      case "radar":
        return `<c:ser>${s}${oe(a)}${$()}${h}${i}</c:ser>`;
      case "filledRadar":
        return `<c:ser>${s}${V(a)}<c:marker><c:symbol val="none"/></c:marker>${h}${i}</c:ser>`;
      case "stock": {
        const f = l.length === 3 && y === 2;
        return `<c:ser>${s}${c}<c:marker><c:symbol val="${f ? "dash" : "none"}"/>${f ? `<c:size val="7"/>${V(a)}` : ""}</c:marker>${h}${i}<c:smooth val="0"/></c:ser>`;
      }
      case "line":
        return `<c:ser>${s}${oe(a)}<c:marker><c:symbol val="circle"/><c:size val="5"/>${V(a)}</c:marker>${h}${i}<c:smooth val="0"/></c:ser>`;
      case "area":
        return `<c:ser>${s}${V(a)}${h}${i}</c:ser>`;
      case "pie":
      case "doughnut": {
        const f = t.categories.map((A, _) => `<c:dPt><c:idx val="${_}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${$e(be[_ % be.length])}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`).join("");
        return `<c:ser>${s}${f}${h}${i}</c:ser>`;
      }
      default:
        return `<c:ser>${s}${V(a)}<c:invertIfNegative val="0"/>${h}${i}</c:ser>`;
    }
  }), v = m.join(""), x = t.dataLabels ? Ze(o) : "", M = '<c:axId val="500000001"/><c:axId val="500000002"/>', E = (b, y, d, a) => {
    const s = (i) => d ? t.percent ? "percentStacked" : "stacked" : i;
    switch (b) {
      case "line":
        return `<c:lineChart><c:grouping val="${s("standard")}"/><c:varyColors val="0"/>${y}${x}<c:marker val="1"/>${a}</c:lineChart>`;
      case "area":
        return `<c:areaChart><c:grouping val="${s("standard")}"/><c:varyColors val="0"/>${y}${x}${a}</c:areaChart>`;
      default:
        return `<c:barChart><c:barDir val="${b === "bar" ? "bar" : "col"}"/><c:grouping val="${s("clustered")}"/><c:varyColors val="0"/>${y}${x}<c:gapWidth val="${d ? 60 : 150}"/>${d ? '<c:overlap val="100"/>' : ""}${a}</c:barChart>`;
    }
  }, F = '<c:axId val="500000003"/><c:axId val="500000004"/>', T = He(t.kind) && l.some((b) => ye(t, b));
  let S;
  switch (t.kind) {
    case "column":
    case "bar":
    case "line":
    case "area": {
      const b = [], y = /* @__PURE__ */ new Map(), d = (a) => `${ge(t, l[a])}|${ye(t, l[a]) ? 1 : 0}`;
      for (const a of [`${t.kind}|0`, ...l.map((s, i) => d(i))]) b.includes(a) || b.push(a);
      l.forEach((a, s) => {
        const i = d(s);
        y.set(i, [...y.get(i) ?? [], s]);
      }), S = b.filter((a) => y.has(a)).map((a) => {
        const [s, i] = a.split("|");
        return E(s, y.get(a).map(($) => m[$]).join(""), !!t.stacked && s === t.kind, i === "1" ? F : M);
      }).join("");
      break;
    }
    case "pie":
      S = `<c:pieChart><c:varyColors val="1"/>${v}${x}<c:firstSliceAng val="0"/></c:pieChart>`;
      break;
    case "scatter":
      S = `<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/>${v}${x}${M}</c:scatterChart>`;
      break;
    case "bubble":
      S = `<c:bubbleChart><c:varyColors val="0"/>${v}${x}<c:bubbleScale val="100"/><c:showNegBubbles val="0"/>${M}</c:bubbleChart>`;
      break;
    case "radar":
    case "filledRadar":
      S = `<c:radarChart><c:radarStyle val="${t.kind === "filledRadar" ? "filled" : "marker"}"/><c:varyColors val="0"/>${v}${x}${M}</c:radarChart>`;
      break;
    case "stock": {
      const b = '<a:ln w="9525"><a:solidFill><a:srgbClr val="404040"/></a:solidFill></a:ln>', y = l.length === 4 ? `<c:upDownBars><c:gapWidth val="150"/><c:upBars><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>${b}</c:spPr></c:upBars><c:downBars><c:spPr><a:solidFill><a:srgbClr val="404040"/></a:solidFill>${b}</c:spPr></c:downBars></c:upDownBars>` : "";
      S = `<c:stockChart>${v}${x}<c:hiLowLines><c:spPr>${b}</c:spPr></c:hiLowLines>${y}${M}</c:stockChart>`;
      break;
    }
    default:
      S = `<c:doughnutChart><c:varyColors val="1"/>${v}${x}<c:firstSliceAng val="0"/><c:holeSize val="50"/></c:doughnutChart>`;
  }
  const Y = t.kind === "bar", N = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"><a:solidFill><a:srgbClr val="595959"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>', j = '<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>', U = (b, y, d, a, s) => `<c:valAx><c:axId val="${b}"/><c:scaling><c:orientation val="minMax"/>` + (s && t.yMax !== void 0 ? `<c:max val="${J(t.yMax)}"/>` : "") + (s && t.yMin !== void 0 ? `<c:min val="${J(t.yMin)}"/>` : "") + `</c:scaling><c:delete val="0"/><c:axPos val="${d}"/>` + (a ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : "") + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${j}${N}<c:crossAx val="${y}"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:valAx>`, W = o ? "" : he(t.kind) ? U(500000001, 500000002, "b", !1, !1) + U(500000002, 500000001, "l", t.gridlines !== !1, !0) : `<c:catAx><c:axId val="500000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${Y ? "l" : "b"}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${j}${N}<c:crossAx val="500000002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="500000002"/><c:scaling><c:orientation val="minMax"/>` + (t.yMax !== void 0 ? `<c:max val="${J(t.yMax)}"/>` : "") + (t.yMin !== void 0 ? `<c:min val="${J(t.yMin)}"/>` : "") + `</c:scaling><c:delete val="0"/><c:axPos val="${Y ? "b" : "l"}"/>` + (t.gridlines !== !1 ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : "") + `<c:numFmt formatCode="${t.percent ? "0%" : "General"}" sourceLinked="${t.percent ? 0 : 1}"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${N}<c:crossAx val="500000001"/><c:crosses val="autoZero"/><c:crossBetween val="${t.kind === "area" ? "midCat" : "between"}"/></c:valAx>` + (T ? `<c:catAx><c:axId val="500000003"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="1"/><c:axPos val="b"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="500000004"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="500000004"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="r"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${N}<c:crossAx val="500000003"/><c:crosses val="max"/><c:crossBetween val="between"/></c:valAx>` : ""), z = t.title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1800" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1800" b="1"/><a:t>${k(t.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>` : '<c:autoTitleDeleted val="1"/>', G = { right: "r", bottom: "b", top: "t" }[t.legend], se = G ? `<c:legend><c:legendPos val="${G}"/><c:overlay val="0"/>${N}</c:legend>` : "";
  return C + `<c:chartSpace xmlns:c="${ie}" xmlns:a="${We}" xmlns:r="${Ee}"><c:date1904 val="0"/><c:roundedCorners val="0"/><c:chart>${z}<c:plotArea><c:layout/>${S}${W}</c:plotArea>${se}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;
}
function Je(e) {
  const t = Re(e), r = t.series, n = t.kind === "bubble", o = Ne(t), l = (c, m) => `<c r="${c}" t="inlineStr"><is><t>${k(m)}</t></is></c>`, p = (c, m) => m == null ? "" : `<c r="${c}"><v>${J(m)}</v></c>`, h = [
    `<row r="1">${l("A1", he(t.kind) ? "X" : "")}${r.map((c, m) => l(`${de(t, m)}1`, c.name) + (n ? l(`${le(2 + m * 2)}1`, `${c.name} size`) : "")).join("")}</row>`,
    ...t.categories.map((c, m) => `<row r="${m + 2}">${o ? p(`A${m + 2}`, me(c)) : l(`A${m + 2}`, c)}` + r.map((v, x) => p(`${de(t, x)}${m + 2}`, v.values[m]) + (n ? p(`${le(2 + x * 2)}${m + 2}`, v.sizes?.[m]) : "")).join("") + "</row>")
  ], u = {
    "[Content_Types].xml": C + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels": C + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": C + `<workbook xmlns="${Pe}" xmlns:r="${Ee}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": C + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": C + `<worksheet xmlns="${Pe}"><sheetData>${h.join("")}</sheetData></worksheet>`
  };
  return ze(Object.fromEntries(Object.entries(u).map(([c, m]) => [c, Oe(m)])));
}
const ne = 914400, te = 51206400, Qe = "http://schemas.microsoft.com/office/powerpoint/2015/09/main", O = `xmlns:a="${R.a}" xmlns:r="${R.r}" xmlns:p="${R.p}"`, I = {
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
}, et = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, tt = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
  wmv: "video/x-ms-wmv",
  avi: "video/x-msvideo",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  weba: "audio/webm",
  flac: "audio/flac",
  wma: "audio/x-ms-wma"
}, Ce = (e) => {
  const t = String(e || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(t) ? t.toUpperCase() : "000000";
}, q = (e) => {
  const t = e.alpha;
  return t !== void 0 && t < 1 ? `<a:srgbClr val="${Ce(e.hex)}"><a:alpha val="${D(t)}"/></a:srgbClr>` : `<a:srgbClr val="${Ce(e.hex)}"/>`;
}, Se = (e) => {
  const t = [...e].sort((n, o) => n.pos - o.pos);
  return "<a:gsLst>" + (t.length === 1 ? [{ ...t[0], pos: 0 }, { ...t[0], pos: 1 }] : t).map((n) => `<a:gs pos="${D(n.pos)}">${q(n.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function fe(e) {
  if (!e || e.kind === "none") return "<a:noFill/>";
  switch (e.kind) {
    case "solid":
      return `<a:solidFill>${q(e.color)}</a:solidFill>`;
    case "linear":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${Se(e.stops)}<a:lin ang="${Ae(e.angle)}" scaled="${e.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${Se(e.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${k(e.preset)}"><a:fgClr>${q(e.color)}</a:fgClr><a:bgClr>${e.bg ? q(e.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function ue(e, t) {
  if (!e || !(e.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let n = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(e.width * t * w)))}"${e.cap ? ` cap="${e.cap}"` : ""}><a:solidFill>${q(e.color)}</a:solidFill>`;
  e.dash && (n += `<a:prstDash val="${k(e.dash)}"/>`), e.join === "round" ? n += "<a:round/>" : e.join === "bevel" ? n += "<a:bevel/>" : e.join === "miter" && (n += '<a:miter lim="800000"/>');
  const o = (l, p) => p ? `<a:${l} type="${p.type}" w="${p.size ?? "med"}" len="${p.size ?? "med"}"/>` : "";
  return n += o("headEnd", e.head) + o("tailEnd", e.tail), n + "</a:ln>";
}
function pe(e, t, r = "a:rPr") {
  const n = ['lang="en-US"'];
  e.size && n.push(`sz="${Ve(e.size * t)}"`), e.bold !== void 0 && n.push(`b="${e.bold ? 1 : 0}"`), e.italic !== void 0 && n.push(`i="${e.italic ? 1 : 0}"`), e.underline && n.push('u="sng"'), e.strike && n.push('strike="sngStrike"'), n.push('dirty="0"');
  let o = "";
  if (e.color && (o += `<a:solidFill>${q(e.color)}</a:solidFill>`), e.font) {
    const l = k(e.font);
    o += `<a:latin typeface="${l}"/><a:ea typeface="${l}"/><a:cs typeface="${l}"/>`;
  }
  return o ? `<${r} ${n.join(" ")}>${o}</${r}>` : `<${r} ${n.join(" ")}/>`;
}
const at = 20, st = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), nt = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function rt(e, t, r) {
  const n = Math.max(0, Math.min(8, e.level ?? 0)), o = [];
  e.align && o.push(`algn="${e.align}"`);
  let l = "";
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 1e-3 && (l += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, t.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const p = (v, x) => x && x > 0 ? `<a:${v}><a:spcPts val="${Math.round(Math.min(1584, x * r * 0.75) * 100)}"/></a:${v}>` : "";
  if (l += p("spcBef", e.spaceBefore) + p("spcAft", e.spaceAfter), e.bullet) {
    const v = at * r * w, x = e.marL !== void 0 ? e.marL * r * w : v * (n + 1), M = e.indent !== void 0 ? e.indent * r * w : -v, E = (F, T) => Math.round(Math.max(T, Math.min(51206400, F)));
    if (o.push(`marL="${E(x, 0)}" indent="${E(M, -51206400)}"`), n && o.push(`lvl="${n}"`), e.bulletColor && (l += `<a:buClr>${q(e.bulletColor)}</a:buClr>`), e.bulletScale && Math.abs(e.bulletScale - 1) > 1e-3 && (l += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, e.bulletScale)) * 1e5)}"/>`), e.bullet === "num") {
      const F = e.numType && nt.test(e.numType) ? e.numType : "arabicPeriod", T = e.startAt && e.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(e.startAt))}"` : "";
      l += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${F}"${T}/>`;
    } else {
      const F = e.bulletChar || "•";
      l += `<a:buFont typeface="${st.has(F) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${k(F)}"/>`;
    }
  } else
    n && o.push(`lvl="${n}"`), l += "<a:buNone/>";
  const h = `<a:pPr${o.length ? " " + o.join(" ") : ""}>${l}</a:pPr>`, u = t.defaults ?? {};
  let c = "";
  for (const v of e.runs) {
    const x = { ...u, ...lt(v) };
    if (v.br) {
      c += `<a:br>${pe(x, r)}</a:br>`;
      continue;
    }
    v.text && (c += `<a:r>${pe(x, r)}<a:t>${k(v.text)}</a:t></a:r>`);
  }
  const m = e.endSize ?? u.size;
  return `<a:p>${h}${c}${pe({ ...u, size: m }, r, "a:endParaRPr")}</a:p>`;
}
const lt = (e) => Object.fromEntries(Object.entries(e).filter(([, t]) => t !== void 0)), ot = (e) => {
  if (e === void 0) return "<a:noAutofit/>";
  const t = Math.max(0.25, Math.min(1, e));
  return t < 0.9995 ? `<a:normAutofit fontScale="${Math.round(t * 1e5)}"/>` : "<a:normAutofit/>";
};
function _e(e, t, r = "p:txBody") {
  if (!e) return "";
  const n = (p) => Math.max(0, Math.round(p * t * w)), o = `<a:bodyPr wrap="${e.wrap ? "square" : "none"}" lIns="${n(e.insets.l)}" tIns="${n(e.insets.t)}" rIns="${n(e.insets.r)}" bIns="${n(e.insets.b)}" anchor="${e.anchor}" rtlCol="0">${ot(e.shrink)}</a:bodyPr>`, l = e.paragraphs.length ? e.paragraphs : [{ runs: [] }];
  return `<${r}>${o}<a:lstStyle/>${l.map((p) => rt(p, e, t)).join("")}</${r}>`;
}
const Be = (e, t, r) => e.kind === "preset" ? Xe(e.prst, e.adj) : Ue(e.paths, t, r), ct = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function pt(e, t) {
  if (!e) return "";
  const r = (o, l, p) => {
    const h = t.rels.find((c) => c.type === o && c.target === l);
    if (h) return h.id;
    const u = `rId${t.rels.length + 1}`;
    return t.rels.push({ id: u, type: o, target: l, external: p }), u;
  };
  if (e.kind === "url") return `<a:hlinkClick r:id="${r(g.hyperlink, e.url, !0)}"/>`;
  if (e.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${ct[e.action]}"/>`;
  const n = t.slideNumber?.(e.key);
  return n ? `<a:hlinkClick r:id="${r(g.slide, `slide${n}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const H = (e, t, r = "a:xfrm", n = !1) => {
  const o = Math.round((e.x * t.s + t.dx) * w), l = Math.round((e.y * t.s + t.dy) * w), p = Math.max(0, Math.round(Math.abs(e.w) * t.s * w)), h = Math.max(0, Math.round(Math.abs(e.h) * t.s * w)), u = [
    e.rot ? `rot="${Ae(e.rot)}"` : "",
    e.flipH ? 'flipH="1"' : "",
    e.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), c = n ? `<a:chOff x="${o}" y="${l}"/><a:chExt cx="${p}" cy="${h}"/>` : "";
  return `<${r}${u ? " " + u : ""}><a:off x="${o}" y="${l}"/><a:ext cx="${p}" cy="${h}"/>${c}</${r}>`;
}, it = '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/></a:ext></a:extLst>', Q = (e, t) => {
  const r = e.descr?.trim(), n = `<p:cNvPr id="${e.id}" name="${k(e.name)}"${r ? ` descr="${k(r)}"` : ""}`, o = pt(e.link, t) + (e.decorative ? it : "");
  return o ? `${n}>${o}</p:cNvPr>` : `${n}/>`;
};
function dt(e, t) {
  const r = `<p:nvSpPr>${Q(e, t)}<p:cNvSpPr${e.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, n = `<p:spPr>${H(e, t)}${Be(e.geom, e.w, e.h)}${fe(e.fill)}${ue(e.line, t.s)}</p:spPr>`, o = e.text ? _e(e.text, t.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${r}${n}${o}</p:sp>`;
}
function mt(e, t) {
  const r = (o, l) => l ? `<a:${o} id="${l.id}" idx="${l.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${Q(e, t)}<p:cNvCxnSpPr>${r("stCxn", e.start)}${r("endCxn", e.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${H(e, t)}${Be(e.geom, e.w, e.h)}<a:noFill/>${ue(e.line, t.s)}</p:spPr></p:cxnSp>`;
}
function De(e, t) {
  const r = t.media(e.media), n = `<p:nvPicPr>${Q(e, t)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, o = e.alpha !== void 0 && e.alpha < 1 ? `<a:alphaModFix amt="${D(e.alpha)}"/>` : "", l = e.crop, p = l ? `<a:srcRect l="${D(l.l)}" t="${D(l.t)}" r="${D(l.r)}" b="${D(l.b)}"/>` : "", h = `<p:blipFill><a:blip r:embed="${r}">${o}</a:blip>${p}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${n}${h}<p:spPr>${H(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
const ke = { ext: "png", bytes: Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), (e) => e.charCodeAt(0)) };
function ht(e, t) {
  const r = e.audio ? "a:audioFile" : "a:videoFile";
  let n = "";
  if (e.file && t.clip) {
    const c = t.clip(e.file, e.audio);
    n = `<${r} r:link="${c.link}"/><p:extLst><p:ext uri="{DAA4B4D4-6D71-4841-9C94-3DE7FCFB9230}"><p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="${c.embed}"/></p:ext></p:extLst>`;
  } else if (e.url && t.clipLink)
    n = `<${r} r:link="${t.clipLink(e.url, e.audio)}"/>`;
  else
    return De({ ...e, media: e.poster ?? ke }, t);
  const o = e.descr?.trim(), l = `<p:nvPicPr><p:cNvPr id="${e.id}" name="${k(e.name)}"${o ? ` descr="${k(o)}"` : ""}><a:hlinkClick r:id="" action="ppaction://media"/></p:cNvPr><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr>${n}</p:nvPr></p:nvPicPr>`, p = e.crop, h = p ? `<a:srcRect l="${D(p.l)}" t="${D(p.t)}" r="${D(p.r)}" b="${D(p.b)}"/>` : "", u = `<p:blipFill><a:blip r:embed="${t.media(e.poster ?? ke)}"/>${h}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${l}${u}<p:spPr>${H(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function $t(e, t) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${Q(e, t)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${H(e, t, "a:xfrm", !0)}</p:grpSpPr>${e.children.map((n) => je(n, t)).join("")}</p:grpSp>`;
}
function ft(e, t) {
  const r = t.chart?.(e.chart);
  return r ? `<p:graphicFrame><p:nvGraphicFramePr>${Q(e, t)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + H(e, t, "p:xfrm") + `<a:graphic><a:graphicData uri="${ie}"><c:chart xmlns:c="${ie}" r:id="${r}"/></a:graphicData></a:graphic></p:graphicFrame>` : "";
}
const ut = "http://schemas.openxmlformats.org/drawingml/2006/table", vt = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}";
function Le(e, t) {
  let r = 0, n = 0;
  return e.map((o) => {
    r += o * t * w;
    const l = Math.round(r), p = Math.max(0, l - n);
    return n = l, p;
  });
}
function xt(e, t) {
  const r = [
    e.gridSpan && e.gridSpan > 1 ? `gridSpan="${e.gridSpan}"` : "",
    e.rowSpan && e.rowSpan > 1 ? `rowSpan="${e.rowSpan}"` : "",
    e.hMerge ? 'hMerge="1"' : "",
    e.vMerge ? 'vMerge="1"' : ""
  ].filter(Boolean).join(" "), n = e.text ?? { paragraphs: [], anchor: "ctr", insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: !0 }, o = (u) => Math.max(0, Math.round(u * t.s * w)), l = (u, c) => ue(c, t.s).replace(/^<a:ln\b/, `<a:${u}`).replace(/<\/a:ln>$/, `</a:${u}>`), p = e.borders, h = `<a:tcPr marL="${o(n.insets.l)}" marR="${o(n.insets.r)}" marT="${o(n.insets.t)}" marB="${o(n.insets.b)}" anchor="${n.anchor}">` + l("lnL", p.l) + l("lnR", p.r) + l("lnT", p.t) + l("lnB", p.b) + fe(e.fill) + "</a:tcPr>";
  return `<a:tc${r ? " " + r : ""}>${_e(n, t.s, "a:txBody")}${h}</a:tc>`;
}
function gt(e, t) {
  if (!e.cols.length || !e.rows.length) return "";
  const r = [e.firstRow ? 'firstRow="1"' : "", e.bandRow ? 'bandRow="1"' : ""].filter(Boolean).join(" "), n = Le(e.cols, t.s).map((p) => `<a:gridCol w="${p}"/>`).join(""), o = Le(e.rows.map((p) => p.h), t.s), l = e.rows.map((p, h) => `<a:tr h="${o[h]}">${p.cells.map((u) => xt(u, t)).join("")}</a:tr>`).join("");
  return `<p:graphicFrame><p:nvGraphicFramePr>${Q(e, t)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + H({ x: e.x, y: e.y, w: e.w, h: e.h }, t, "p:xfrm") + `<a:graphic><a:graphicData uri="${ut}"><a:tbl><a:tblPr${r ? " " + r : ""}><a:tableStyleId>${vt}</a:tableStyleId></a:tblPr><a:tblGrid>${n}</a:tblGrid>${l}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}
function je(e, t) {
  switch (e.kind) {
    case "table":
      return gt(e, t);
    case "chart":
      return ft(e, t);
    case "shape":
      return dt(e, t);
    case "connector":
      return mt(e, t);
    case "picture":
      return De(e, t);
    case "media":
      return ht(e, t);
    case "group":
      return e.children.length ? $t(e, t) : "";
  }
}
const ae = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function bt(e, t) {
  const r = t && t > 0 ? ` advTm="${Math.round(t)}"` : "";
  if (!e) return r ? `<mc:AlternateContent xmlns:mc="${R.mc}"><mc:Choice xmlns:p14="${R.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${r}/></mc:Choice><mc:Fallback><p:transition spd="fast"${r}/></mc:Fallback></mc:AlternateContent>` : "";
  const n = Math.max(0, Math.min(6e4, Math.round(e.durationMs))), o = n <= 600 ? "fast" : n <= 900 ? "med" : "slow", l = e.kind === "push" || e.kind === "wipe" || e.kind === "cover" || e.kind === "pull" ? `<p:${e.kind} dir="${e.dir ?? "l"}"/>` : e.kind === "split" ? `<p:split orient="${e.orient ?? "horz"}" dir="${e.inward ? "in" : "out"}"/>` : e.kind === "zoom" ? `<p:zoom dir="${e.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return e.kind === "morph" ? `<mc:AlternateContent xmlns:mc="${R.mc}"><mc:Choice xmlns:p159="${Qe}" xmlns:p14="${R.p14}" Requires="p159"><p:transition spd="${o}" p14:dur="${n}"${r}><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="${o}"${r}><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>` : `<mc:AlternateContent xmlns:mc="${R.mc}"><mc:Choice xmlns:p14="${R.p14}" Requires="p14"><p:transition spd="${o}" p14:dur="${n}"${r}>${l}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${o}"${r}>${l}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
const yt = { l: ["0-#ppt_w/2", "#ppt_y"], r: ["1+#ppt_w/2", "#ppt_y"], t: ["#ppt_x", "0-#ppt_h/2"], b: ["#ppt_x", "1+#ppt_h/2"] }, Pt = { l: "wipe(right)", r: "wipe(left)", t: "wipe(down)", b: "wipe(up)" }, we = (e) => "play" in e;
function Ct(e, t) {
  const r = [], n = (a) => a.forEach((s) => {
    s.kind === "media" && (s.file || s.url) ? r.push(s) : s.kind === "group" && n(s.children);
  });
  if (n(t), !e.length && !r.length) return "";
  let o = 0;
  const l = () => ++o, p = (a) => `<p:tgtEl><p:spTgt spid="${a}"/></p:tgtEl>`, h = (a, s, i = [], $, f) => `<p:cBhvr${f ? ` additive="${f}"` : ""}>` + ($ !== void 0 ? `<p:cTn id="${l()}" dur="${Math.max(1, s)}" fill="hold"><p:stCondLst><p:cond delay="${$}"/></p:stCondLst></p:cTn>` : `<p:cTn id="${l()}" dur="${Math.max(1, s)}" fill="hold"/>`) + p(a.target) + (i.length ? `<p:attrNameLst>${i.map((A) => `<p:attrName>${A}</p:attrName>`).join("")}</p:attrNameLst>` : "") + "</p:cBhvr>", u = (a, s, i) => `<p:set>${h(a, 1, ["style.visibility"], s)}<p:to><p:strVal val="${i ? "visible" : "hidden"}"/></p:to></p:set>`, c = (a, s, i, $, f) => `<p:anim calcmode="lin" valueType="num">${h(a, s, [i], void 0, "base")}<p:tavLst><p:tav tm="0"><p:val><p:strVal val="${$}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${f}"/></p:val></p:tav></p:tavLst></p:anim>`, m = (a, s, i, $) => `<p:animEffect transition="${$ ? "out" : "in"}" filter="${i}">${h(a, s)}</p:animEffect>`, v = (a, s, i) => `<p:animRot by="${Math.round(Math.max(-36e3, Math.min(36e3, i)) * 6e4)}">${h(a, s, ["r"])}</p:animRot>`, x = (a, s, i) => `<p:animScale>${h(a, s)}<p:by x="${i * 1e3}" y="${i * 1e3}"/></p:animScale>`, M = (a) => {
    const s = Math.max(1, Math.min(36e5, a.durationMs)), i = a.dir ?? "b";
    if (a.cls === "emph")
      return a.effect === "spin" ? v(a, s, a.degrees ?? 360) : a.effect === "teeter" ? v(a, s, 4) : x(a, s, a.effect === "growShrink" ? 150 : 105);
    const $ = a.cls === "exit";
    let f = $ ? "" : u(a, 0, !0);
    switch (a.effect) {
      case "appear":
        break;
      case "fly": {
        const [A, _] = yt[i];
        f += $ ? c(a, s, "ppt_x", "#ppt_x", A) + c(a, s, "ppt_y", "#ppt_y", _) : c(a, s, "ppt_x", A, "#ppt_x") + c(a, s, "ppt_y", _, "#ppt_y");
        break;
      }
      case "zoom":
      case "grow":
      case "spinner":
      case "bounce":
      case "swivel": {
        const A = a.effect === "swivel" ? c(a, s, "ppt_w", $ ? "#ppt_w" : "0", $ ? "0" : "#ppt_w") : c(a, s, "ppt_w", $ ? "#ppt_w" : "0", $ ? "0" : "#ppt_w") + c(a, s, "ppt_h", $ ? "#ppt_h" : "0", $ ? "0" : "#ppt_h");
        f += A, a.effect === "spinner" && (f += v(a, s, $ ? -360 : 360)), f += m(a, s, "fade", $);
        break;
      }
      case "wipe":
        f += m(a, s, Pt[a.dir ?? "l"], $);
        break;
      default:
        f += m(a, s, "fade", $);
    }
    return $ ? f + u(a, a.effect === "appear" ? 0 : s - 1, !1) : f;
  }, E = /* @__PURE__ */ new Map(), F = /* @__PURE__ */ new Map();
  for (const a of e) {
    const s = E.get(a.target) ?? 0;
    F.set(a, s), E.set(a.target, s + 1);
  }
  const T = (a) => {
    if (we(a))
      return `<p:par><p:cTn id="${l()}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="${a.start === "with" ? "withEffect" : "afterEffect"}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="${l()}" dur="1" fill="hold"/>${p(a.play.id)}</p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>`;
    const s = a, i = s.start === "click" ? "clickEffect" : s.start === "with" ? "withEffect" : "afterEffect", $ = s.repeat === -1 ? ' repeatCount="indefinite"' : s.repeat && s.repeat > 1 ? ` repeatCount="${Math.min(1e4, s.repeat) * 1e3}"` : "", f = s.cls === "emph" && (s.effect === "pulse" || s.effect === "growShrink") ? ' autoRev="1"' : "";
    return `<p:par><p:cTn id="${l()}" presetID="${s.presetId}" presetClass="${s.cls}" presetSubtype="${s.subtype}"${$}${f} fill="hold" grpId="${F.get(s)}" nodeType="${i}"><p:stCondLst><p:cond delay="${Math.min(36e5, s.delayMs)}"/></p:stCondLst><p:childTnLst>${M(s)}</p:childTnLst></p:cTn></p:par>`;
  }, S = (a) => we(a) ? 0 : a.delayMs + a.durationMs * (a.repeat && a.repeat > 1 ? Math.min(100, a.repeat) : 1), N = [...r.filter((a) => a.autoplay).map((a, s) => ({ play: a, start: s === 0 ? "after" : "with", delayMs: 0 })), ...e], j = [];
  for (const a of N) {
    const s = j[j.length - 1];
    a.start === "click" || !s ? j.push({ auto: a.start !== "click", groups: [[a]] }) : a.start === "with" ? s.groups[s.groups.length - 1].push(a) : s.groups.push([a]);
  }
  const U = l(), W = l(), z = j.map((a) => {
    const s = a.auto ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : '<p:cond delay="indefinite"/>', i = l();
    let $ = 0;
    const f = a.groups.map((A) => {
      const P = `<p:par><p:cTn id="${l()}" fill="hold"><p:stCondLst><p:cond delay="${$}"/></p:stCondLst><p:childTnLst>${A.map(T).join("")}</p:childTnLst></p:cTn></p:par>`;
      return $ += Math.max(...A.map(S)), P;
    }).join("");
    return `<p:par><p:cTn id="${i}" fill="hold"><p:stCondLst>${s}</p:stCondLst><p:childTnLst>${f}</p:childTnLst></p:cTn></p:par>`;
  }).join(""), G = /* @__PURE__ */ new Set();
  ((a) => a.forEach((s) => {
    s.kind === "shape" && G.add(s.id);
  }))(t);
  const b = [...new Set(e.map((a) => a.target))].filter((a) => G.has(a)).flatMap((a) => Array.from({ length: E.get(a) ?? 1 }, (s, i) => `<p:bldP spid="${a}" grpId="${i}" animBg="1"/>`)).join(""), y = r.map((a) => {
    const s = a.audio ? "p:audio" : "p:video", i = `<${s}><p:cMediaNode vol="80000"${a.muted ? ' mute="1"' : ""}><p:cTn id="${l()}"${a.loop ? ' repeatCount="indefinite"' : ""} fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>${p(a.id)}</p:cMediaNode></${s}>`, $ = l(), f = l(), A = l(), _ = l(), P = l(), B = `<p:seq concurrent="1" nextAc="seek"><p:cTn id="${$}" restart="whenNotActive" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq"><p:stCondLst><p:cond evt="onClick" delay="0">${p(a.id)}</p:cond></p:stCondLst><p:endSync evt="end" delay="0"><p:rtn val="all"/></p:endSync><p:childTnLst><p:par><p:cTn id="${f}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${A}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${_}" presetID="2" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="togglePause"><p:cBhvr><p:cTn id="${P}" dur="1" fill="hold"/>${p(a.id)}</p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:nextCondLst><p:cond evt="onClick" delay="0">${p(a.id)}</p:cond></p:nextCondLst></p:seq>`;
    return i + B;
  }).join(""), d = z ? `<p:seq concurrent="1" nextAc="seek"><p:cTn id="${W}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${z}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` : "";
  return `<p:timing><p:tnLst><p:par><p:cTn id="${U}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` + d + y + `</p:childTnLst></p:cTn></p:par></p:tnLst>${b ? `<p:bldLst>${b}</p:bldLst>` : ""}</p:timing>`;
}
function St(e, t) {
  let r = "";
  const n = e.background;
  n && n.kind === "image" ? r = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${t.media(n.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : n && n.kind !== "none" && (r = `<p:bg><p:bgPr>${fe(n)}<a:effectLst/></p:bgPr></p:bg>`);
  const o = e.items.map((h) => je(h, t)).join(""), l = e.name ? ` name="${k(e.name)}"` : "", p = e.hidden ? ' show="0"' : "";
  return C + `<p:sld ${O}${p}><p:cSld${l}>${r}<p:spTree>${ae}${o}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${bt(e.transition, e.advanceAfterMs)}${Ct(e.anims ?? [], e.items)}</p:sld>`;
}
const re = (e, t = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${t}<a:defRPr sz="${e}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, Me = C + `<a:theme xmlns:a="${R.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, kt = C + `<p:sldMaster ${O}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${ae}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${re(4400)}</p:titleStyle><p:bodyStyle>${re(2800)}</p:bodyStyle><p:otherStyle>${re(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, Lt = C + `<p:sldLayout ${O} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${ae}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, Fe = 6858e3, Te = 9144e3, K = (e, t, r, n, o, l, p, h, u = "") => {
  const c = `<a:xfrm><a:off x="${Math.round(Fe * o)}" y="${Math.round(Te * l)}"/><a:ext cx="${Math.round(Fe * p)}" cy="${Math.round(Te * h)}"/></a:xfrm>`, m = r === "sldImg", v = m ? "" : ' sz="quarter"', x = m ? `<p:spPr>${c}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${c}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, M = m ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', E = m ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${u || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${e}" name="${t}"/><p:cNvSpPr>${M}</p:cNvSpPr><p:nvPr><p:ph type="${r}"${v} idx="${n}"/></p:nvPr></p:nvSpPr>${x}${E}</p:sp>`;
}, wt = Array.from({ length: 9 }, (e, t) => `<a:lvl${t + 1}pPr marL="${t * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${t + 1}pPr>`).join(""), Mt = C + `<p:notesMaster ${O}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${ae}` + K(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + K(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + K(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + K(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + K(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + K(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${wt}</p:notesStyle></p:notesMaster>`;
function Ft(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((o) => o ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${k(o)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), r = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', n = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${t}</p:txBody></p:sp>`;
  return C + `<p:notes ${O}><p:cSld><p:spTree>${ae}${r}${n}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const Tt = C + `<p:presentationPr ${O}/>`, At = C + `<p:presentationPr ${O}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;
function It(e, t) {
  if (!e.some((o) => o.section)) return "";
  const r = [];
  e.forEach((o, l) => {
    (o.section || !r.length) && r.push({ name: o.section || "Default Section", ids: [] }), r[r.length - 1].ids.push(t(l));
  });
  const n = (o) => `{8F3A1C2E-5B7D-4E9A-9C11-${(o + 1).toString(16).toUpperCase().padStart(12, "0")}}`;
  return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${R.p14}">` + r.map((o, l) => `<p14:section name="${k(o.name)}" id="${n(l)}"><p14:sldIdLst>${o.ids.map((p) => `<p14:sldId id="${p}"/>`).join("")}</p14:sldIdLst></p14:section>`).join("") + "</p14:sectionLst></p:ext></p:extLst>";
}
const Et = C + `<p:viewPr ${O}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, Rt = C + `<a:tblStyleLst xmlns:a="${R.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, Nt = (e, t) => C + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${k(e)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${t}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${t}</dcterms:modified></cp:coreProperties>`, _t = (e, t) => C + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${e}</Slides><Notes>${t}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function zt(e, t = {}) {
  const r = Math.max(1, e.width), n = Math.max(1, e.height), o = Math.max(r, n) * w, l = Math.min(r, n) * w, p = o > te ? te / o : l < ne ? Math.min(ne / l, te / o) : 1, h = Math.max(ne, Math.min(te, Math.round(r * p * w))), u = Math.max(ne, Math.min(te, Math.round(n * p * w))), c = /* @__PURE__ */ new Map(), m = [], v = /* @__PURE__ */ new Set();
  let x = 0;
  const M = /* @__PURE__ */ new Set(), E = /* @__PURE__ */ new Map();
  let F = 0, T = 0;
  const S = e.slides.length ? e.slides : [{ items: [] }], Y = /* @__PURE__ */ new Map();
  S.forEach((d, a) => {
    d.key && Y.set(d.key, a + 1);
  });
  const N = [{ id: "rId1", type: g.slideMaster, target: "slideMasters/slideMaster1.xml" }], j = S.some((d) => !!d.notes?.trim());
  let U = !1, W = "";
  S.forEach((d, a) => {
    const s = a + 1, i = [{ id: "rId1", type: g.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], $ = /* @__PURE__ */ new Map(), f = d.fit ?? { scale: 1, dx: 0, dy: 0 }, A = {
      s: f.scale * p,
      dx: f.dx * p,
      dy: f.dy * p,
      rels: i,
      slideNumber: (P) => Y.get(P) ?? null,
      chart: (P) => {
        T++;
        const B = `Microsoft_Excel_Worksheet${T}.xlsx`;
        c.set(`ppt/charts/chart${T}.xml`, Ke(P)), c.set(`ppt/charts/_rels/chart${T}.xml.rels`, X([{ id: "rId1", type: g.package, target: `../embeddings/${B}` }])), c.set(`ppt/embeddings/${B}`, Je(P)), m.push([`/ppt/charts/chart${T}.xml`, I.chart]), U = !0;
        const L = `rId${i.length + 1}`;
        return i.push({ id: L, type: g.chart, target: `../charts/chart${T}.xml` }), L;
      },
      clip: (P, B) => {
        let L = E.get(P);
        if (!L) {
          F++;
          const xe = /^[a-z0-9]{1,5}$/.test(P.ext) ? P.ext : "bin";
          L = `media${F}.${xe}`, c.set(`ppt/media/${L}`, P.bytes), M.add(xe), E.set(P, L);
        }
        const Z = `rId${i.length + 1}`;
        i.push({ id: Z, type: B ? g.audio : g.video, target: `../media/${L}` });
        const ve = `rId${i.length + 1}`;
        return i.push({ id: ve, type: g.media, target: `../media/${L}` }), { link: Z, embed: ve };
      },
      clipLink: (P, B) => {
        const L = `rId${i.length + 1}`;
        return i.push({ id: L, type: B ? g.audio : g.video, target: P, external: !0 }), L;
      },
      media: (P) => {
        const B = $.get(P);
        if (B) return B;
        x++;
        const L = `image${x}.${P.ext}`;
        c.set(`ppt/media/${L}`, P.bytes), v.add(P.ext);
        const Z = `rId${i.length + 1}`;
        return i.push({ id: Z, type: g.image, target: `../media/${L}` }), $.set(P, Z), Z;
      }
    };
    c.set(`ppt/slides/slide${s}.xml`, St(d, A)), d.notes?.trim() && (i.push({ id: `rId${i.length + 1}`, type: g.notesSlide, target: `../notesSlides/notesSlide${s}.xml` }), c.set(`ppt/notesSlides/notesSlide${s}.xml`, Ft(d.notes)), c.set(`ppt/notesSlides/_rels/notesSlide${s}.xml.rels`, X([
      { id: "rId1", type: g.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: g.slide, target: `../slides/slide${s}.xml` }
    ])), m.push([`/ppt/notesSlides/notesSlide${s}.xml`, I.notesSlide])), c.set(`ppt/slides/_rels/slide${s}.xml.rels`, X(i)), m.push([`/ppt/slides/slide${s}.xml`, I.slide]);
    const _ = `rId${s + 1}`;
    N.push({ id: _, type: g.slide, target: `slides/slide${s}.xml` }), W += `<p:sldId id="${255 + s}" r:id="${_}"/>`;
  });
  const z = S.length + 2;
  N.push(
    { id: `rId${z}`, type: g.theme, target: "theme/theme1.xml" },
    { id: `rId${z + 1}`, type: g.presProps, target: "presProps.xml" },
    { id: `rId${z + 2}`, type: g.viewProps, target: "viewProps.xml" },
    { id: `rId${z + 3}`, type: g.tableStyles, target: "tableStyles.xml" }
  );
  const G = `rId${z + 4}`;
  j && (N.push({ id: G, type: g.notesMaster, target: "notesMasters/notesMaster1.xml" }), c.set("ppt/notesMasters/notesMaster1.xml", Mt), c.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", X([
    { id: "rId1", type: g.theme, target: "../theme/theme2.xml" }
  ])), c.set("ppt/theme/theme2.xml", Me), m.push(["/ppt/notesMasters/notesMaster1.xml", I.notesMaster], ["/ppt/theme/theme2.xml", I.theme]));
  const se = C + `<p:presentation ${O} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (j ? `<p:notesMasterIdLst><p:notesMasterId r:id="${G}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${W}</p:sldIdLst><p:sldSz cx="${h}" cy="${u}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${re(1800)}</p:defaultTextStyle>${It(S, (d) => 256 + d)}</p:presentation>`;
  c.set("ppt/presentation.xml", se), c.set("ppt/_rels/presentation.xml.rels", X(N)), c.set("ppt/slideMasters/slideMaster1.xml", kt), c.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", X([
    { id: "rId1", type: g.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: g.theme, target: "../theme/theme1.xml" }
  ])), c.set("ppt/slideLayouts/slideLayout1.xml", Lt), c.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", X([
    { id: "rId1", type: g.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), c.set("ppt/theme/theme1.xml", Me), c.set("ppt/presProps.xml", e.loop ? At : Tt), c.set("ppt/viewProps.xml", Et), c.set("ppt/tableStyles.xml", Rt);
  const b = t.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  c.set("docProps/core.xml", Nt(e.title || "YappyDraw presentation", b)), c.set("docProps/app.xml", _t(S.length, S.filter((d) => !!d.notes?.trim()).length)), c.set("_rels/.rels", X([
    { id: "rId1", type: g.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: g.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: g.extProps, target: "docProps/app.xml" }
  ])), m.push(
    ["/ppt/presentation.xml", I.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", I.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", I.slideLayout],
    ["/ppt/theme/theme1.xml", I.theme],
    ["/ppt/presProps.xml", I.presProps],
    ["/ppt/viewProps.xml", I.viewProps],
    ["/ppt/tableStyles.xml", I.tableStyles],
    ["/docProps/core.xml", I.core],
    ["/docProps/app.xml", I.app]
  );
  const y = C + `<Types xmlns="${R.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...v].map((d) => `<Default Extension="${d}" ContentType="${et[d]}"/>`).join("") + [...M].filter((d) => !v.has(d)).map((d) => `<Default Extension="${d}" ContentType="${tt[d] ?? "application/octet-stream"}"/>`).join("") + (U ? '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>' : "") + m.map(([d, a]) => `<Override PartName="${d}" ContentType="${a}"/>`).join("") + "</Types>";
  return c.set("[Content_Types].xml", y), Ge(c);
}
export {
  zt as buildPptx,
  Ft as notesXml
};
