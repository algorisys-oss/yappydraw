import { z as Ie, s as Ee } from "./browser-BNJ-qm4Y.js";
import { e as P, X as y, r as G, N as A, z as Ne, E as L, b as Se, d as _, f as Re, g as _e, R as $, h as Be } from "./custgeom-Cly4AfIX.js";
import { U as Le, aB as ke, aC as De, aD as he } from "./index-CcU7GLMU.js";
const le = "http://schemas.openxmlformats.org/drawingml/2006/chart", je = "http://schemas.openxmlformats.org/drawingml/2006/main", we = "http://schemas.openxmlformats.org/officeDocument/2006/relationships", $e = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
function pe(e) {
  let t = "";
  for (let n = e + 1; n > 0; n = Math.floor((n - 1) / 26)) t = String.fromCharCode(65 + (n - 1) % 26) + t;
  return t;
}
const te = (e) => Number.isInteger(e) ? String(e) : String(Math.round(e * 1e10) / 1e10), oe = (e) => /^#[0-9a-f]{6}$/i.test(e) ? e.slice(1).toUpperCase() : /^#[0-9a-f]{3}$/i.test(e) ? e.slice(1).split("").map((t) => t + t).join("").toUpperCase() : "4472C4", ne = (e) => `<c:spPr><a:solidFill><a:srgbClr val="${oe(e)}"/></a:solidFill></c:spPr>`, Oe = (e, t = 28575) => `<c:spPr><a:ln w="${t}" cap="rnd"><a:solidFill><a:srgbClr val="${oe(e)}"/></a:solidFill><a:round/></a:ln></c:spPr>`;
function fe(e, t) {
  return `<c:strRef><c:f>${P(e)}</c:f><c:strCache><c:ptCount val="${t.length}"/>` + t.map((n, a) => `<c:pt idx="${a}"><c:v>${P(n)}</c:v></c:pt>`).join("") + "</c:strCache></c:strRef>";
}
function ze(e, t) {
  return `<c:numRef><c:f>${P(e)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${t.length}"/>` + t.map((n, a) => n === null ? "" : `<c:pt idx="${a}"><c:v>${te(n)}</c:v></c:pt>`).join("") + "</c:numCache></c:numRef>";
}
const Ge = (e) => `<c:dLbls><c:showLegendKey val="0"/><c:showVal val="${e ? 0 : 1}"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="${e ? 1 : 0}"/><c:showBubbleSize val="0"/></c:dLbls>`;
function Xe(e) {
  const t = Le(e), a = t.categories.length + 1, l = ke(t.kind), p = l ? t.series.slice(0, 1) : t.series, o = `<c:cat>${fe(`Sheet1!$A$2:$A$${a}`, t.categories)}</c:cat>`, i = p.map((H, E) => {
    const N = pe(E + 1), D = De(t, E), j = `<c:idx val="${E}"/><c:order val="${E}"/><c:tx>${fe(`Sheet1!$${N}$1`, [H.name])}</c:tx>`, F = `<c:val>${ze(`Sheet1!$${N}$2:$${N}$${a}`, H.values)}</c:val>`;
    switch (t.kind) {
      case "line":
        return `<c:ser>${j}${Oe(D)}<c:marker><c:symbol val="circle"/><c:size val="5"/>${ne(D)}</c:marker>${o}${F}<c:smooth val="0"/></c:ser>`;
      case "area":
        return `<c:ser>${j}${ne(D)}${o}${F}</c:ser>`;
      case "pie":
      case "doughnut": {
        const X = t.categories.map((ae, U) => `<c:dPt><c:idx val="${U}"/><c:bubble3D val="0"/><c:spPr><a:solidFill><a:srgbClr val="${oe(he[U % he.length])}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`).join("");
        return `<c:ser>${j}${X}${o}${F}</c:ser>`;
      }
      default:
        return `<c:ser>${j}${ne(D)}<c:invertIfNegative val="0"/>${o}${F}</c:ser>`;
    }
  }).join(""), m = t.dataLabels ? Ge(l) : "", c = '<c:axId val="500000001"/><c:axId val="500000002"/>';
  let u;
  switch (t.kind) {
    case "column":
    case "bar":
      u = `<c:barChart><c:barDir val="${t.kind === "bar" ? "bar" : "col"}"/><c:grouping val="${t.stacked ? "stacked" : "clustered"}"/><c:varyColors val="0"/>${i}${m}<c:gapWidth val="${t.stacked ? 60 : 150}"/>${t.stacked ? '<c:overlap val="100"/>' : ""}${c}</c:barChart>`;
      break;
    case "line":
      u = `<c:lineChart><c:grouping val="${t.stacked ? "stacked" : "standard"}"/><c:varyColors val="0"/>${i}${m}<c:marker val="1"/>${c}</c:lineChart>`;
      break;
    case "area":
      u = `<c:areaChart><c:grouping val="${t.stacked ? "stacked" : "standard"}"/><c:varyColors val="0"/>${i}${m}${c}</c:areaChart>`;
      break;
    case "pie":
      u = `<c:pieChart><c:varyColors val="1"/>${i}${m}<c:firstSliceAng val="0"/></c:pieChart>`;
      break;
    default:
      u = `<c:doughnutChart><c:varyColors val="1"/>${i}${m}<c:firstSliceAng val="0"/><c:holeSize val="50"/></c:doughnutChart>`;
  }
  const x = t.kind === "bar", b = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"><a:solidFill><a:srgbClr val="595959"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>', M = l ? "" : `<c:catAx><c:axId val="500000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${x ? "l" : "b"}"/><c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>${b}<c:crossAx val="500000002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="500000002"/><c:scaling><c:orientation val="minMax"/>` + (t.yMax !== void 0 ? `<c:max val="${te(t.yMax)}"/>` : "") + (t.yMin !== void 0 ? `<c:min val="${te(t.yMin)}"/>` : "") + `</c:scaling><c:delete val="0"/><c:axPos val="${x ? "b" : "l"}"/>` + (t.gridlines !== !1 ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : "") + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${b}<c:crossAx val="500000001"/><c:crosses val="autoZero"/><c:crossBetween val="${t.kind === "area" ? "midCat" : "between"}"/></c:valAx>`, k = t.title ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1800" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1800" b="1"/><a:t>${P(t.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>` : '<c:autoTitleDeleted val="1"/>', C = { right: "r", bottom: "b", top: "t" }[t.legend], I = C ? `<c:legend><c:legendPos val="${C}"/><c:overlay val="0"/>${b}</c:legend>` : "";
  return y + `<c:chartSpace xmlns:c="${le}" xmlns:a="${je}" xmlns:r="${we}"><c:date1904 val="0"/><c:roundedCorners val="0"/><c:chart>${k}<c:plotArea><c:layout/>${u}${M}</c:plotArea>${I}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart><c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr><c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>`;
}
function Ue(e) {
  const t = Le(e), n = ke(t.kind) ? t.series.slice(0, 1) : t.series, a = (o, i) => `<c r="${o}" t="inlineStr"><is><t>${P(i)}</t></is></c>`, l = [
    `<row r="1">${a("A1", "")}${n.map((o, i) => a(`${pe(i + 1)}1`, o.name)).join("")}</row>`,
    ...t.categories.map((o, i) => `<row r="${i + 2}">${a(`A${i + 2}`, o)}` + n.map((m, c) => m.values[i] === null ? "" : `<c r="${pe(c + 1)}${i + 2}"><v>${te(m.values[i])}</v></c>`).join("") + "</row>")
  ], p = {
    "[Content_Types].xml": y + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels": y + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": y + `<workbook xmlns="${$e}" xmlns:r="${we}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": y + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": y + `<worksheet xmlns="${$e}"><sheetData>${l.join("")}</sheetData></worksheet>`
  };
  return Ie(Object.fromEntries(Object.entries(p).map(([o, i]) => [o, Ee(i)])));
}
const Q = 914400, Z = 51206400, Ve = "http://schemas.microsoft.com/office/powerpoint/2015/09/main", O = `xmlns:a="${A.a}" xmlns:r="${A.r}" xmlns:p="${A.p}"`, w = {
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
}, qe = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, He = {
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
}, ue = (e) => {
  const t = String(e || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(t) ? t.toUpperCase() : "000000";
}, V = (e) => {
  const t = e.alpha;
  return t !== void 0 && t < 1 ? `<a:srgbClr val="${ue(e.hex)}"><a:alpha val="${_(t)}"/></a:srgbClr>` : `<a:srgbClr val="${ue(e.hex)}"/>`;
}, xe = (e) => {
  const t = [...e].sort((a, l) => a.pos - l.pos);
  return "<a:gsLst>" + (t.length === 1 ? [{ ...t[0], pos: 0 }, { ...t[0], pos: 1 }] : t).map((a) => `<a:gs pos="${_(a.pos)}">${V(a.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function ce(e) {
  if (!e || e.kind === "none") return "<a:noFill/>";
  switch (e.kind) {
    case "solid":
      return `<a:solidFill>${V(e.color)}</a:solidFill>`;
    case "linear":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${xe(e.stops)}<a:lin ang="${Se(e.angle)}" scaled="${e.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return e.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${xe(e.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${P(e.preset)}"><a:fgClr>${V(e.color)}</a:fgClr><a:bgClr>${e.bg ? V(e.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function ie(e, t) {
  if (!e || !(e.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let a = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(e.width * t * L)))}"${e.cap ? ` cap="${e.cap}"` : ""}><a:solidFill>${V(e.color)}</a:solidFill>`;
  e.dash && (a += `<a:prstDash val="${P(e.dash)}"/>`), e.join === "round" ? a += "<a:round/>" : e.join === "bevel" ? a += "<a:bevel/>" : e.join === "miter" && (a += '<a:miter lim="800000"/>');
  const l = (p, o) => o ? `<a:${p} type="${o.type}" w="${o.size ?? "med"}" len="${o.size ?? "med"}"/>` : "";
  return a += l("headEnd", e.head) + l("tailEnd", e.tail), a + "</a:ln>";
}
function re(e, t, n = "a:rPr") {
  const a = ['lang="en-US"'];
  e.size && a.push(`sz="${Be(e.size * t)}"`), e.bold !== void 0 && a.push(`b="${e.bold ? 1 : 0}"`), e.italic !== void 0 && a.push(`i="${e.italic ? 1 : 0}"`), e.underline && a.push('u="sng"'), e.strike && a.push('strike="sngStrike"'), a.push('dirty="0"');
  let l = "";
  if (e.color && (l += `<a:solidFill>${V(e.color)}</a:solidFill>`), e.font) {
    const p = P(e.font);
    l += `<a:latin typeface="${p}"/><a:ea typeface="${p}"/><a:cs typeface="${p}"/>`;
  }
  return l ? `<${n} ${a.join(" ")}>${l}</${n}>` : `<${n} ${a.join(" ")}/>`;
}
const Ye = 20, We = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), Ke = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function Ze(e, t, n) {
  const a = Math.max(0, Math.min(8, e.level ?? 0)), l = [];
  e.align && l.push(`algn="${e.align}"`);
  let p = "";
  t.lineSpacing && Math.abs(t.lineSpacing - 1) > 1e-3 && (p += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, t.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const o = (x, b) => b && b > 0 ? `<a:${x}><a:spcPts val="${Math.round(Math.min(1584, b * n * 0.75) * 100)}"/></a:${x}>` : "";
  if (p += o("spcBef", e.spaceBefore) + o("spcAft", e.spaceAfter), e.bullet) {
    const x = Ye * n * L, b = e.marL !== void 0 ? e.marL * n * L : x * (a + 1), B = e.indent !== void 0 ? e.indent * n * L : -x, M = (k, C) => Math.round(Math.max(C, Math.min(51206400, k)));
    if (l.push(`marL="${M(b, 0)}" indent="${M(B, -51206400)}"`), a && l.push(`lvl="${a}"`), e.bulletColor && (p += `<a:buClr>${V(e.bulletColor)}</a:buClr>`), e.bulletScale && Math.abs(e.bulletScale - 1) > 1e-3 && (p += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, e.bulletScale)) * 1e5)}"/>`), e.bullet === "num") {
      const k = e.numType && Ke.test(e.numType) ? e.numType : "arabicPeriod", C = e.startAt && e.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(e.startAt))}"` : "";
      p += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${k}"${C}/>`;
    } else {
      const k = e.bulletChar || "•";
      p += `<a:buFont typeface="${We.has(k) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${P(k)}"/>`;
    }
  } else
    a && l.push(`lvl="${a}"`), p += "<a:buNone/>";
  const i = `<a:pPr${l.length ? " " + l.join(" ") : ""}>${p}</a:pPr>`, m = t.defaults ?? {};
  let c = "";
  for (const x of e.runs) {
    const b = { ...m, ...Je(x) };
    if (x.br) {
      c += `<a:br>${re(b, n)}</a:br>`;
      continue;
    }
    x.text && (c += `<a:r>${re(b, n)}<a:t>${P(x.text)}</a:t></a:r>`);
  }
  const u = e.endSize ?? m.size;
  return `<a:p>${i}${c}${re({ ...m, size: u }, n, "a:endParaRPr")}</a:p>`;
}
const Je = (e) => Object.fromEntries(Object.entries(e).filter(([, t]) => t !== void 0)), Qe = (e) => {
  if (e === void 0) return "<a:noAutofit/>";
  const t = Math.max(0.25, Math.min(1, e));
  return t < 0.9995 ? `<a:normAutofit fontScale="${Math.round(t * 1e5)}"/>` : "<a:normAutofit/>";
};
function Me(e, t, n = "p:txBody") {
  if (!e) return "";
  const a = (o) => Math.max(0, Math.round(o * t * L)), l = `<a:bodyPr wrap="${e.wrap ? "square" : "none"}" lIns="${a(e.insets.l)}" tIns="${a(e.insets.t)}" rIns="${a(e.insets.r)}" bIns="${a(e.insets.b)}" anchor="${e.anchor}" rtlCol="0">${Qe(e.shrink)}</a:bodyPr>`, p = e.paragraphs.length ? e.paragraphs : [{ runs: [] }];
  return `<${n}>${l}<a:lstStyle/>${p.map((o) => Ze(o, e, t)).join("")}</${n}>`;
}
const Fe = (e, t, n) => e.kind === "preset" ? Re(e.prst, e.adj) : _e(e.paths, t, n), et = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function tt(e, t) {
  if (!e) return "";
  const n = (l, p, o) => {
    const i = t.rels.find((c) => c.type === l && c.target === p);
    if (i) return i.id;
    const m = `rId${t.rels.length + 1}`;
    return t.rels.push({ id: m, type: l, target: p, external: o }), m;
  };
  if (e.kind === "url") return `<a:hlinkClick r:id="${n($.hyperlink, e.url, !0)}"/>`;
  if (e.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${et[e.action]}"/>`;
  const a = t.slideNumber?.(e.key);
  return a ? `<a:hlinkClick r:id="${n($.slide, `slide${a}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const q = (e, t, n = "a:xfrm", a = !1) => {
  const l = Math.round((e.x * t.s + t.dx) * L), p = Math.round((e.y * t.s + t.dy) * L), o = Math.max(0, Math.round(Math.abs(e.w) * t.s * L)), i = Math.max(0, Math.round(Math.abs(e.h) * t.s * L)), m = [
    e.rot ? `rot="${Se(e.rot)}"` : "",
    e.flipH ? 'flipH="1"' : "",
    e.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), c = a ? `<a:chOff x="${l}" y="${p}"/><a:chExt cx="${o}" cy="${i}"/>` : "";
  return `<${n}${m ? " " + m : ""}><a:off x="${l}" y="${p}"/><a:ext cx="${o}" cy="${i}"/>${c}</${n}>`;
}, at = '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/></a:ext></a:extLst>', K = (e, t) => {
  const n = e.descr?.trim(), a = `<p:cNvPr id="${e.id}" name="${P(e.name)}"${n ? ` descr="${P(n)}"` : ""}`, l = tt(e.link, t) + (e.decorative ? at : "");
  return l ? `${a}>${l}</p:cNvPr>` : `${a}/>`;
};
function st(e, t) {
  const n = `<p:nvSpPr>${K(e, t)}<p:cNvSpPr${e.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, a = `<p:spPr>${q(e, t)}${Fe(e.geom, e.w, e.h)}${ce(e.fill)}${ie(e.line, t.s)}</p:spPr>`, l = e.text ? Me(e.text, t.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${n}${a}${l}</p:sp>`;
}
function nt(e, t) {
  const n = (l, p) => p ? `<a:${l} id="${p.id}" idx="${p.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${K(e, t)}<p:cNvCxnSpPr>${n("stCxn", e.start)}${n("endCxn", e.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${q(e, t)}${Fe(e.geom, e.w, e.h)}<a:noFill/>${ie(e.line, t.s)}</p:spPr></p:cxnSp>`;
}
function Te(e, t) {
  const n = t.media(e.media), a = `<p:nvPicPr>${K(e, t)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, l = e.alpha !== void 0 && e.alpha < 1 ? `<a:alphaModFix amt="${_(e.alpha)}"/>` : "", p = e.crop, o = p ? `<a:srcRect l="${_(p.l)}" t="${_(p.t)}" r="${_(p.r)}" b="${_(p.b)}"/>` : "", i = `<p:blipFill><a:blip r:embed="${n}">${l}</a:blip>${o}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${a}${i}<p:spPr>${q(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
const ge = { ext: "png", bytes: Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), (e) => e.charCodeAt(0)) };
function rt(e, t) {
  const n = e.audio ? "a:audioFile" : "a:videoFile";
  let a = "";
  if (e.file && t.clip) {
    const c = t.clip(e.file, e.audio);
    a = `<${n} r:link="${c.link}"/><p:extLst><p:ext uri="{DAA4B4D4-6D71-4841-9C94-3DE7FCFB9230}"><p14:media xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" r:embed="${c.embed}"/></p:ext></p:extLst>`;
  } else if (e.url && t.clipLink)
    a = `<${n} r:link="${t.clipLink(e.url, e.audio)}"/>`;
  else
    return Te({ ...e, media: e.poster ?? ge }, t);
  const l = e.descr?.trim(), p = `<p:nvPicPr><p:cNvPr id="${e.id}" name="${P(e.name)}"${l ? ` descr="${P(l)}"` : ""}><a:hlinkClick r:id="" action="ppaction://media"/></p:cNvPr><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr>${a}</p:nvPr></p:nvPicPr>`, o = e.crop, i = o ? `<a:srcRect l="${_(o.l)}" t="${_(o.t)}" r="${_(o.r)}" b="${_(o.b)}"/>` : "", m = `<p:blipFill><a:blip r:embed="${t.media(e.poster ?? ge)}"/>${i}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${p}${m}<p:spPr>${q(e, t)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function lt(e, t) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${K(e, t)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${q(e, t, "a:xfrm", !0)}</p:grpSpPr>${e.children.map((a) => Ae(a, t)).join("")}</p:grpSp>`;
}
function pt(e, t) {
  const n = t.chart?.(e.chart);
  return n ? `<p:graphicFrame><p:nvGraphicFramePr>${K(e, t)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + q(e, t, "p:xfrm") + `<a:graphic><a:graphicData uri="${le}"><c:chart xmlns:c="${le}" r:id="${n}"/></a:graphicData></a:graphic></p:graphicFrame>` : "";
}
const ot = "http://schemas.openxmlformats.org/drawingml/2006/table", ct = "{2D5ABB26-0587-4C30-8999-92F81FD0307C}";
function ve(e, t) {
  let n = 0, a = 0;
  return e.map((l) => {
    n += l * t * L;
    const p = Math.round(n), o = Math.max(0, p - a);
    return a = p, o;
  });
}
function it(e, t) {
  const n = [
    e.gridSpan && e.gridSpan > 1 ? `gridSpan="${e.gridSpan}"` : "",
    e.rowSpan && e.rowSpan > 1 ? `rowSpan="${e.rowSpan}"` : "",
    e.hMerge ? 'hMerge="1"' : "",
    e.vMerge ? 'vMerge="1"' : ""
  ].filter(Boolean).join(" "), a = e.text ?? { paragraphs: [], anchor: "ctr", insets: { l: 0, t: 0, r: 0, b: 0 }, wrap: !0 }, l = (m) => Math.max(0, Math.round(m * t.s * L)), p = (m, c) => ie(c, t.s).replace(/^<a:ln\b/, `<a:${m}`).replace(/<\/a:ln>$/, `</a:${m}>`), o = e.borders, i = `<a:tcPr marL="${l(a.insets.l)}" marR="${l(a.insets.r)}" marT="${l(a.insets.t)}" marB="${l(a.insets.b)}" anchor="${a.anchor}">` + p("lnL", o.l) + p("lnR", o.r) + p("lnT", o.t) + p("lnB", o.b) + ce(e.fill) + "</a:tcPr>";
  return `<a:tc${n ? " " + n : ""}>${Me(a, t.s, "a:txBody")}${i}</a:tc>`;
}
function dt(e, t) {
  if (!e.cols.length || !e.rows.length) return "";
  const n = [e.firstRow ? 'firstRow="1"' : "", e.bandRow ? 'bandRow="1"' : ""].filter(Boolean).join(" "), a = ve(e.cols, t.s).map((o) => `<a:gridCol w="${o}"/>`).join(""), l = ve(e.rows.map((o) => o.h), t.s), p = e.rows.map((o, i) => `<a:tr h="${l[i]}">${o.cells.map((m) => it(m, t)).join("")}</a:tr>`).join("");
  return `<p:graphicFrame><p:nvGraphicFramePr>${K(e, t)}<p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr>` + q({ x: e.x, y: e.y, w: e.w, h: e.h }, t, "p:xfrm") + `<a:graphic><a:graphicData uri="${ot}"><a:tbl><a:tblPr${n ? " " + n : ""}><a:tableStyleId>${ct}</a:tableStyleId></a:tblPr><a:tblGrid>${a}</a:tblGrid>${p}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`;
}
function Ae(e, t) {
  switch (e.kind) {
    case "table":
      return dt(e, t);
    case "chart":
      return pt(e, t);
    case "shape":
      return st(e, t);
    case "connector":
      return nt(e, t);
    case "picture":
      return Te(e, t);
    case "media":
      return rt(e, t);
    case "group":
      return e.children.length ? lt(e, t) : "";
  }
}
const J = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function mt(e, t) {
  const n = t && t > 0 ? ` advTm="${Math.round(t)}"` : "";
  if (!e) return n ? `<mc:AlternateContent xmlns:mc="${A.mc}"><mc:Choice xmlns:p14="${A.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${n}/></mc:Choice><mc:Fallback><p:transition spd="fast"${n}/></mc:Fallback></mc:AlternateContent>` : "";
  const a = Math.max(0, Math.min(6e4, Math.round(e.durationMs))), l = a <= 600 ? "fast" : a <= 900 ? "med" : "slow", p = e.kind === "push" || e.kind === "wipe" || e.kind === "cover" || e.kind === "pull" ? `<p:${e.kind} dir="${e.dir ?? "l"}"/>` : e.kind === "split" ? `<p:split orient="${e.orient ?? "horz"}" dir="${e.inward ? "in" : "out"}"/>` : e.kind === "zoom" ? `<p:zoom dir="${e.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return e.kind === "morph" ? `<mc:AlternateContent xmlns:mc="${A.mc}"><mc:Choice xmlns:p159="${Ve}" xmlns:p14="${A.p14}" Requires="p159"><p:transition spd="${l}" p14:dur="${a}"${n}><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="${l}"${n}><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>` : `<mc:AlternateContent xmlns:mc="${A.mc}"><mc:Choice xmlns:p14="${A.p14}" Requires="p14"><p:transition spd="${l}" p14:dur="${a}"${n}>${p}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${l}"${n}>${p}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
const ht = { l: ["0-#ppt_w/2", "#ppt_y"], r: ["1+#ppt_w/2", "#ppt_y"], t: ["#ppt_x", "0-#ppt_h/2"], b: ["#ppt_x", "1+#ppt_h/2"] }, $t = { l: "wipe(right)", r: "wipe(left)", t: "wipe(down)", b: "wipe(up)" }, ye = (e) => "play" in e;
function ft(e, t) {
  const n = [], a = (s) => s.forEach((r) => {
    r.kind === "media" && (r.file || r.url) ? n.push(r) : r.kind === "group" && a(r.children);
  });
  if (a(t), !e.length && !n.length) return "";
  let l = 0;
  const p = () => ++l, o = (s) => `<p:tgtEl><p:spTgt spid="${s}"/></p:tgtEl>`, i = (s, r, d = [], h, g) => `<p:cBhvr${g ? ` additive="${g}"` : ""}>` + (h !== void 0 ? `<p:cTn id="${p()}" dur="${Math.max(1, r)}" fill="hold"><p:stCondLst><p:cond delay="${h}"/></p:stCondLst></p:cTn>` : `<p:cTn id="${p()}" dur="${Math.max(1, r)}" fill="hold"/>`) + o(s.target) + (d.length ? `<p:attrNameLst>${d.map((T) => `<p:attrName>${T}</p:attrName>`).join("")}</p:attrNameLst>` : "") + "</p:cBhvr>", m = (s, r, d) => `<p:set>${i(s, 1, ["style.visibility"], r)}<p:to><p:strVal val="${d ? "visible" : "hidden"}"/></p:to></p:set>`, c = (s, r, d, h, g) => `<p:anim calcmode="lin" valueType="num">${i(s, r, [d], void 0, "base")}<p:tavLst><p:tav tm="0"><p:val><p:strVal val="${h}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${g}"/></p:val></p:tav></p:tavLst></p:anim>`, u = (s, r, d, h) => `<p:animEffect transition="${h ? "out" : "in"}" filter="${d}">${i(s, r)}</p:animEffect>`, x = (s, r, d) => `<p:animRot by="${Math.round(Math.max(-36e3, Math.min(36e3, d)) * 6e4)}">${i(s, r, ["r"])}</p:animRot>`, b = (s, r, d) => `<p:animScale>${i(s, r)}<p:by x="${d * 1e3}" y="${d * 1e3}"/></p:animScale>`, B = (s) => {
    const r = Math.max(1, Math.min(36e5, s.durationMs)), d = s.dir ?? "b";
    if (s.cls === "emph")
      return s.effect === "spin" ? x(s, r, s.degrees ?? 360) : s.effect === "teeter" ? x(s, r, 4) : b(s, r, s.effect === "growShrink" ? 150 : 105);
    const h = s.cls === "exit";
    let g = h ? "" : m(s, 0, !0);
    switch (s.effect) {
      case "appear":
        break;
      case "fly": {
        const [T, z] = ht[d];
        g += h ? c(s, r, "ppt_x", "#ppt_x", T) + c(s, r, "ppt_y", "#ppt_y", z) : c(s, r, "ppt_x", T, "#ppt_x") + c(s, r, "ppt_y", z, "#ppt_y");
        break;
      }
      case "zoom":
      case "grow":
      case "spinner":
      case "bounce":
      case "swivel": {
        const T = s.effect === "swivel" ? c(s, r, "ppt_w", h ? "#ppt_w" : "0", h ? "0" : "#ppt_w") : c(s, r, "ppt_w", h ? "#ppt_w" : "0", h ? "0" : "#ppt_w") + c(s, r, "ppt_h", h ? "#ppt_h" : "0", h ? "0" : "#ppt_h");
        g += T, s.effect === "spinner" && (g += x(s, r, h ? -360 : 360)), g += u(s, r, "fade", h);
        break;
      }
      case "wipe":
        g += u(s, r, $t[s.dir ?? "l"], h);
        break;
      default:
        g += u(s, r, "fade", h);
    }
    return h ? g + m(s, s.effect === "appear" ? 0 : r - 1, !1) : g;
  }, M = /* @__PURE__ */ new Map(), k = /* @__PURE__ */ new Map();
  for (const s of e) {
    const r = M.get(s.target) ?? 0;
    k.set(s, r), M.set(s.target, r + 1);
  }
  const C = (s) => {
    if (ye(s))
      return `<p:par><p:cTn id="${p()}" presetID="1" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="${s.start === "with" ? "withEffect" : "afterEffect"}"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="${p()}" dur="1" fill="hold"/>${o(s.play.id)}</p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par>`;
    const r = s, d = r.start === "click" ? "clickEffect" : r.start === "with" ? "withEffect" : "afterEffect", h = r.repeat === -1 ? ' repeatCount="indefinite"' : r.repeat && r.repeat > 1 ? ` repeatCount="${Math.min(1e4, r.repeat) * 1e3}"` : "", g = r.cls === "emph" && (r.effect === "pulse" || r.effect === "growShrink") ? ' autoRev="1"' : "";
    return `<p:par><p:cTn id="${p()}" presetID="${r.presetId}" presetClass="${r.cls}" presetSubtype="${r.subtype}"${h}${g} fill="hold" grpId="${k.get(r)}" nodeType="${d}"><p:stCondLst><p:cond delay="${Math.min(36e5, r.delayMs)}"/></p:stCondLst><p:childTnLst>${B(r)}</p:childTnLst></p:cTn></p:par>`;
  }, I = (s) => ye(s) ? 0 : s.delayMs + s.durationMs * (s.repeat && s.repeat > 1 ? Math.min(100, s.repeat) : 1), E = [...n.filter((s) => s.autoplay).map((s, r) => ({ play: s, start: r === 0 ? "after" : "with", delayMs: 0 })), ...e], N = [];
  for (const s of E) {
    const r = N[N.length - 1];
    s.start === "click" || !r ? N.push({ auto: s.start !== "click", groups: [[s]] }) : s.start === "with" ? r.groups[r.groups.length - 1].push(s) : r.groups.push([s]);
  }
  const D = p(), j = p(), F = N.map((s) => {
    const r = s.auto ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : '<p:cond delay="indefinite"/>', d = p();
    let h = 0;
    const g = s.groups.map((T) => {
      const v = `<p:par><p:cTn id="${p()}" fill="hold"><p:stCondLst><p:cond delay="${h}"/></p:stCondLst><p:childTnLst>${T.map(C).join("")}</p:childTnLst></p:cTn></p:par>`;
      return h += Math.max(...T.map(I)), v;
    }).join("");
    return `<p:par><p:cTn id="${d}" fill="hold"><p:stCondLst>${r}</p:stCondLst><p:childTnLst>${g}</p:childTnLst></p:cTn></p:par>`;
  }).join(""), X = /* @__PURE__ */ new Set();
  ((s) => s.forEach((r) => {
    r.kind === "shape" && X.add(r.id);
  }))(t);
  const U = [...new Set(e.map((s) => s.target))].filter((s) => X.has(s)).flatMap((s) => Array.from({ length: M.get(s) ?? 1 }, (r, d) => `<p:bldP spid="${s}" grpId="${d}" animBg="1"/>`)).join(""), se = n.map((s) => {
    const r = s.audio ? "p:audio" : "p:video", d = `<${r}><p:cMediaNode vol="80000"${s.muted ? ' mute="1"' : ""}><p:cTn id="${p()}"${s.loop ? ' repeatCount="indefinite"' : ""} fill="hold" display="0"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn>${o(s.id)}</p:cMediaNode></${r}>`, h = p(), g = p(), T = p(), z = p(), v = p(), R = `<p:seq concurrent="1" nextAc="seek"><p:cTn id="${h}" restart="whenNotActive" fill="hold" evtFilter="cancelBubble" nodeType="interactiveSeq"><p:stCondLst><p:cond evt="onClick" delay="0">${o(s.id)}</p:cond></p:stCondLst><p:endSync evt="end" delay="0"><p:rtn val="all"/></p:endSync><p:childTnLst><p:par><p:cTn id="${g}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${T}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="${z}" presetID="2" presetClass="mediacall" presetSubtype="0" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:cmd type="call" cmd="togglePause"><p:cBhvr><p:cTn id="${v}" dur="1" fill="hold"/>${o(s.id)}</p:cBhvr></p:cmd></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn><p:nextCondLst><p:cond evt="onClick" delay="0">${o(s.id)}</p:cond></p:nextCondLst></p:seq>`;
    return d + R;
  }).join(""), f = F ? `<p:seq concurrent="1" nextAc="seek"><p:cTn id="${j}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${F}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>` : "";
  return `<p:timing><p:tnLst><p:par><p:cTn id="${D}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>` + f + se + `</p:childTnLst></p:cTn></p:par></p:tnLst>${U ? `<p:bldLst>${U}</p:bldLst>` : ""}</p:timing>`;
}
function ut(e, t) {
  let n = "";
  const a = e.background;
  a && a.kind === "image" ? n = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${t.media(a.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : a && a.kind !== "none" && (n = `<p:bg><p:bgPr>${ce(a)}<a:effectLst/></p:bgPr></p:bg>`);
  const l = e.items.map((i) => Ae(i, t)).join(""), p = e.name ? ` name="${P(e.name)}"` : "", o = e.hidden ? ' show="0"' : "";
  return y + `<p:sld ${O}${o}><p:cSld${p}>${n}<p:spTree>${J}${l}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${mt(e.transition, e.advanceAfterMs)}${ft(e.anims ?? [], e.items)}</p:sld>`;
}
const ee = (e, t = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${t}<a:defRPr sz="${e}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, be = y + `<a:theme xmlns:a="${A.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, xt = y + `<p:sldMaster ${O}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${J}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${ee(4400)}</p:titleStyle><p:bodyStyle>${ee(2800)}</p:bodyStyle><p:otherStyle>${ee(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, gt = y + `<p:sldLayout ${O} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${J}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, Pe = 6858e3, Ce = 9144e3, W = (e, t, n, a, l, p, o, i, m = "") => {
  const c = `<a:xfrm><a:off x="${Math.round(Pe * l)}" y="${Math.round(Ce * p)}"/><a:ext cx="${Math.round(Pe * o)}" cy="${Math.round(Ce * i)}"/></a:xfrm>`, u = n === "sldImg", x = u ? "" : ' sz="quarter"', b = u ? `<p:spPr>${c}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${c}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, B = u ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', M = u ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${m || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${e}" name="${t}"/><p:cNvSpPr>${B}</p:cNvSpPr><p:nvPr><p:ph type="${n}"${x} idx="${a}"/></p:nvPr></p:nvSpPr>${b}${M}</p:sp>`;
}, vt = Array.from({ length: 9 }, (e, t) => `<a:lvl${t + 1}pPr marL="${t * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${t + 1}pPr>`).join(""), yt = y + `<p:notesMaster ${O}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${J}` + W(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + W(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + W(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + W(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + W(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + W(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${vt}</p:notesStyle></p:notesMaster>`;
function bt(e) {
  const t = e.replace(/\r\n?/g, `
`).split(`
`).map((l) => l ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${P(l)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), n = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', a = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${t}</p:txBody></p:sp>`;
  return y + `<p:notes ${O}><p:cSld><p:spTree>${J}${n}${a}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const Pt = y + `<p:presentationPr ${O}/>`, Ct = y + `<p:presentationPr ${O}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;
function St(e, t) {
  if (!e.some((l) => l.section)) return "";
  const n = [];
  e.forEach((l, p) => {
    (l.section || !n.length) && n.push({ name: l.section || "Default Section", ids: [] }), n[n.length - 1].ids.push(t(p));
  });
  const a = (l) => `{8F3A1C2E-5B7D-4E9A-9C11-${(l + 1).toString(16).toUpperCase().padStart(12, "0")}}`;
  return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${A.p14}">` + n.map((l, p) => `<p14:section name="${P(l.name)}" id="${a(p)}"><p14:sldIdLst>${l.ids.map((o) => `<p14:sldId id="${o}"/>`).join("")}</p14:sldIdLst></p14:section>`).join("") + "</p14:sectionLst></p:ext></p:extLst>";
}
const Lt = y + `<p:viewPr ${O}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, kt = y + `<a:tblStyleLst xmlns:a="${A.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, wt = (e, t) => y + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${P(e)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${t}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${t}</dcterms:modified></cp:coreProperties>`, Mt = (e, t) => y + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${e}</Slides><Notes>${t}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function It(e, t = {}) {
  const n = Math.max(1, e.width), a = Math.max(1, e.height), l = Math.max(n, a) * L, p = Math.min(n, a) * L, o = l > Z ? Z / l : p < Q ? Math.min(Q / p, Z / l) : 1, i = Math.max(Q, Math.min(Z, Math.round(n * o * L))), m = Math.max(Q, Math.min(Z, Math.round(a * o * L))), c = /* @__PURE__ */ new Map(), u = [], x = /* @__PURE__ */ new Set();
  let b = 0;
  const B = /* @__PURE__ */ new Set(), M = /* @__PURE__ */ new Map();
  let k = 0, C = 0;
  const I = e.slides.length ? e.slides : [{ items: [] }], H = /* @__PURE__ */ new Map();
  I.forEach((f, s) => {
    f.key && H.set(f.key, s + 1);
  });
  const E = [{ id: "rId1", type: $.slideMaster, target: "slideMasters/slideMaster1.xml" }], N = I.some((f) => !!f.notes?.trim());
  let D = !1, j = "";
  I.forEach((f, s) => {
    const r = s + 1, d = [{ id: "rId1", type: $.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], h = /* @__PURE__ */ new Map(), g = f.fit ?? { scale: 1, dx: 0, dy: 0 }, T = {
      s: g.scale * o,
      dx: g.dx * o,
      dy: g.dy * o,
      rels: d,
      slideNumber: (v) => H.get(v) ?? null,
      chart: (v) => {
        C++;
        const R = `Microsoft_Excel_Worksheet${C}.xlsx`;
        c.set(`ppt/charts/chart${C}.xml`, Xe(v)), c.set(`ppt/charts/_rels/chart${C}.xml.rels`, G([{ id: "rId1", type: $.package, target: `../embeddings/${R}` }])), c.set(`ppt/embeddings/${R}`, Ue(v)), u.push([`/ppt/charts/chart${C}.xml`, w.chart]), D = !0;
        const S = `rId${d.length + 1}`;
        return d.push({ id: S, type: $.chart, target: `../charts/chart${C}.xml` }), S;
      },
      clip: (v, R) => {
        let S = M.get(v);
        if (!S) {
          k++;
          const me = /^[a-z0-9]{1,5}$/.test(v.ext) ? v.ext : "bin";
          S = `media${k}.${me}`, c.set(`ppt/media/${S}`, v.bytes), B.add(me), M.set(v, S);
        }
        const Y = `rId${d.length + 1}`;
        d.push({ id: Y, type: R ? $.audio : $.video, target: `../media/${S}` });
        const de = `rId${d.length + 1}`;
        return d.push({ id: de, type: $.media, target: `../media/${S}` }), { link: Y, embed: de };
      },
      clipLink: (v, R) => {
        const S = `rId${d.length + 1}`;
        return d.push({ id: S, type: R ? $.audio : $.video, target: v, external: !0 }), S;
      },
      media: (v) => {
        const R = h.get(v);
        if (R) return R;
        b++;
        const S = `image${b}.${v.ext}`;
        c.set(`ppt/media/${S}`, v.bytes), x.add(v.ext);
        const Y = `rId${d.length + 1}`;
        return d.push({ id: Y, type: $.image, target: `../media/${S}` }), h.set(v, Y), Y;
      }
    };
    c.set(`ppt/slides/slide${r}.xml`, ut(f, T)), f.notes?.trim() && (d.push({ id: `rId${d.length + 1}`, type: $.notesSlide, target: `../notesSlides/notesSlide${r}.xml` }), c.set(`ppt/notesSlides/notesSlide${r}.xml`, bt(f.notes)), c.set(`ppt/notesSlides/_rels/notesSlide${r}.xml.rels`, G([
      { id: "rId1", type: $.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: $.slide, target: `../slides/slide${r}.xml` }
    ])), u.push([`/ppt/notesSlides/notesSlide${r}.xml`, w.notesSlide])), c.set(`ppt/slides/_rels/slide${r}.xml.rels`, G(d)), u.push([`/ppt/slides/slide${r}.xml`, w.slide]);
    const z = `rId${r + 1}`;
    E.push({ id: z, type: $.slide, target: `slides/slide${r}.xml` }), j += `<p:sldId id="${255 + r}" r:id="${z}"/>`;
  });
  const F = I.length + 2;
  E.push(
    { id: `rId${F}`, type: $.theme, target: "theme/theme1.xml" },
    { id: `rId${F + 1}`, type: $.presProps, target: "presProps.xml" },
    { id: `rId${F + 2}`, type: $.viewProps, target: "viewProps.xml" },
    { id: `rId${F + 3}`, type: $.tableStyles, target: "tableStyles.xml" }
  );
  const X = `rId${F + 4}`;
  N && (E.push({ id: X, type: $.notesMaster, target: "notesMasters/notesMaster1.xml" }), c.set("ppt/notesMasters/notesMaster1.xml", yt), c.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", G([
    { id: "rId1", type: $.theme, target: "../theme/theme2.xml" }
  ])), c.set("ppt/theme/theme2.xml", be), u.push(["/ppt/notesMasters/notesMaster1.xml", w.notesMaster], ["/ppt/theme/theme2.xml", w.theme]));
  const ae = y + `<p:presentation ${O} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (N ? `<p:notesMasterIdLst><p:notesMasterId r:id="${X}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${j}</p:sldIdLst><p:sldSz cx="${i}" cy="${m}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${ee(1800)}</p:defaultTextStyle>${St(I, (f) => 256 + f)}</p:presentation>`;
  c.set("ppt/presentation.xml", ae), c.set("ppt/_rels/presentation.xml.rels", G(E)), c.set("ppt/slideMasters/slideMaster1.xml", xt), c.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", G([
    { id: "rId1", type: $.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: $.theme, target: "../theme/theme1.xml" }
  ])), c.set("ppt/slideLayouts/slideLayout1.xml", gt), c.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", G([
    { id: "rId1", type: $.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), c.set("ppt/theme/theme1.xml", be), c.set("ppt/presProps.xml", e.loop ? Ct : Pt), c.set("ppt/viewProps.xml", Lt), c.set("ppt/tableStyles.xml", kt);
  const U = t.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  c.set("docProps/core.xml", wt(e.title || "YappyDraw presentation", U)), c.set("docProps/app.xml", Mt(I.length, I.filter((f) => !!f.notes?.trim()).length)), c.set("_rels/.rels", G([
    { id: "rId1", type: $.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: $.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: $.extProps, target: "docProps/app.xml" }
  ])), u.push(
    ["/ppt/presentation.xml", w.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", w.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", w.slideLayout],
    ["/ppt/theme/theme1.xml", w.theme],
    ["/ppt/presProps.xml", w.presProps],
    ["/ppt/viewProps.xml", w.viewProps],
    ["/ppt/tableStyles.xml", w.tableStyles],
    ["/docProps/core.xml", w.core],
    ["/docProps/app.xml", w.app]
  );
  const se = y + `<Types xmlns="${A.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...x].map((f) => `<Default Extension="${f}" ContentType="${qe[f]}"/>`).join("") + [...B].filter((f) => !x.has(f)).map((f) => `<Default Extension="${f}" ContentType="${He[f] ?? "application/octet-stream"}"/>`).join("") + (D ? '<Default Extension="xlsx" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>' : "") + u.map(([f, s]) => `<Override PartName="${f}" ContentType="${s}"/>`).join("") + "</Types>";
  return c.set("[Content_Types].xml", se), Ne(c);
}
export {
  It as buildPptx,
  bt as notesXml
};
