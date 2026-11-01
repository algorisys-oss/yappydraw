import { r as E, X as v, N as M, z as it, e as w, E as C, a as nt, p as _, b as ct, c as dt, R as h, f as mt } from "./custgeom-N1NlyQKZ.js";
const G = 914400, B = 51206400, ht = "http://schemas.microsoft.com/office/powerpoint/2015/09/main", k = `xmlns:a="${M.a}" xmlns:r="${M.r}" xmlns:p="${M.p}"`, b = {
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
}, ft = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tiff: "image/tiff",
  webp: "image/webp",
  emf: "image/x-emf",
  wmf: "image/x-wmf"
}, Q = (t) => {
  const a = String(t || "").replace("#", "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(a) ? a.toUpperCase() : "000000";
}, N = (t) => {
  const a = t.alpha;
  return a !== void 0 && a < 1 ? `<a:srgbClr val="${Q(t.hex)}"><a:alpha val="${_(a)}"/></a:srgbClr>` : `<a:srgbClr val="${Q(t.hex)}"/>`;
}, tt = (t) => {
  const a = [...t].sort((s, p) => s.pos - p.pos);
  return "<a:gsLst>" + (a.length === 1 ? [{ ...a[0], pos: 0 }, { ...a[0], pos: 1 }] : a).map((s) => `<a:gs pos="${_(s.pos)}">${N(s.color)}</a:gs>`).join("") + "</a:gsLst>";
};
function pt(t) {
  if (!t || t.kind === "none") return "<a:noFill/>";
  switch (t.kind) {
    case "solid":
      return `<a:solidFill>${N(t.color)}</a:solidFill>`;
    case "linear":
      return t.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${tt(t.stops)}<a:lin ang="${nt(t.angle)}" scaled="${t.scaled ? 1 : 0}"/></a:gradFill>`;
    case "radial":
      return t.stops.length === 0 ? "<a:noFill/>" : `<a:gradFill rotWithShape="1">${tt(t.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
    case "image":
      return "<a:noFill/>";
    // import-only paint; the exporter never produces it
    case "pattern":
      return `<a:pattFill prst="${w(t.preset)}"><a:fgClr>${N(t.color)}</a:fgClr><a:bgClr>${t.bg ? N(t.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
  }
}
function lt(t, a) {
  if (!t || !(t.width > 0)) return "<a:ln><a:noFill/></a:ln>";
  let s = `<a:ln w="${Math.max(0, Math.min(20116800, Math.round(t.width * a * C)))}"${t.cap ? ` cap="${t.cap}"` : ""}><a:solidFill>${N(t.color)}</a:solidFill>`;
  t.dash && (s += `<a:prstDash val="${w(t.dash)}"/>`), t.join === "round" ? s += "<a:round/>" : t.join === "bevel" ? s += "<a:bevel/>" : t.join === "miter" && (s += '<a:miter lim="800000"/>');
  const p = (l, i) => i ? `<a:${l} type="${i.type}" w="${i.size ?? "med"}" len="${i.size ?? "med"}"/>` : "";
  return s += p("headEnd", t.head) + p("tailEnd", t.tail), s + "</a:ln>";
}
function Y(t, a, n = "a:rPr") {
  const s = ['lang="en-US"'];
  t.size && s.push(`sz="${mt(t.size * a)}"`), t.bold !== void 0 && s.push(`b="${t.bold ? 1 : 0}"`), t.italic !== void 0 && s.push(`i="${t.italic ? 1 : 0}"`), t.underline && s.push('u="sng"'), t.strike && s.push('strike="sngStrike"'), s.push('dirty="0"');
  let p = "";
  if (t.color && (p += `<a:solidFill>${N(t.color)}</a:solidFill>`), t.font) {
    const l = w(t.font);
    p += `<a:latin typeface="${l}"/><a:ea typeface="${l}"/><a:cs typeface="${l}"/>`;
  }
  return p ? `<${n} ${s.join(" ")}>${p}</${n}>` : `<${n} ${s.join(" ")}/>`;
}
const $t = 20, ut = /* @__PURE__ */ new Set(["•", "–", "—", "-", "»", "›", ">", "*", "+", "·"]), xt = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;
function gt(t, a, n) {
  const s = Math.max(0, Math.min(8, t.level ?? 0)), p = [];
  t.align && p.push(`algn="${t.align}"`);
  let l = "";
  a.lineSpacing && Math.abs(a.lineSpacing - 1) > 1e-3 && (l += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, a.lineSpacing)) * 1e5)}"/></a:lnSpc>`);
  const i = (u, x) => x && x > 0 ? `<a:${u}><a:spcPts val="${Math.round(Math.min(1584, x * n * 0.75) * 100)}"/></a:${u}>` : "";
  if (l += i("spcBef", t.spaceBefore) + i("spcAft", t.spaceAfter), t.bullet) {
    const u = $t * n * C, x = t.marL !== void 0 ? t.marL * n * C : u * (s + 1), y = t.indent !== void 0 ? t.indent * n * C : -u, F = (P, L) => Math.round(Math.max(L, Math.min(51206400, P)));
    if (p.push(`marL="${F(x, 0)}" indent="${F(y, -51206400)}"`), s && p.push(`lvl="${s}"`), t.bulletColor && (l += `<a:buClr>${N(t.bulletColor)}</a:buClr>`), t.bulletScale && Math.abs(t.bulletScale - 1) > 1e-3 && (l += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, t.bulletScale)) * 1e5)}"/>`), t.bullet === "num") {
      const P = t.numType && xt.test(t.numType) ? t.numType : "arabicPeriod", L = t.startAt && t.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(t.startAt))}"` : "";
      l += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${P}"${L}/>`;
    } else {
      const P = t.bulletChar || "•";
      l += `<a:buFont typeface="${ut.has(P) ? "Arial" : "Segoe UI Symbol"}"/><a:buChar char="${w(P)}"/>`;
    }
  } else
    s && p.push(`lvl="${s}"`), l += "<a:buNone/>";
  const m = `<a:pPr${p.length ? " " + p.join(" ") : ""}>${l}</a:pPr>`, $ = a.defaults ?? {};
  let o = "";
  for (const u of t.runs) {
    const x = { ...$, ...yt(u) };
    if (u.br) {
      o += `<a:br>${Y(x, n)}</a:br>`;
      continue;
    }
    u.text && (o += `<a:r>${Y(x, n)}<a:t>${w(u.text)}</a:t></a:r>`);
  }
  const g = t.endSize ?? $.size;
  return `<a:p>${m}${o}${Y({ ...$, size: g }, n, "a:endParaRPr")}</a:p>`;
}
const yt = (t) => Object.fromEntries(Object.entries(t).filter(([, a]) => a !== void 0));
function vt(t, a, n = "p:txBody") {
  if (!t) return "";
  const s = (i) => Math.max(0, Math.round(i * a * C)), p = `<a:bodyPr wrap="${t.wrap ? "square" : "none"}" lIns="${s(t.insets.l)}" tIns="${s(t.insets.t)}" rIns="${s(t.insets.r)}" bIns="${s(t.insets.b)}" anchor="${t.anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr>`, l = t.paragraphs.length ? t.paragraphs : [{ runs: [] }];
  return `<${n}>${p}<a:lstStyle/>${l.map((i) => gt(i, t, a)).join("")}</${n}>`;
}
const rt = (t, a, n) => t.kind === "preset" ? ct(t.prst, t.adj) : dt(t.paths, a, n), Pt = { next: "nextslide", previous: "previousslide", first: "firstslide", last: "lastslide", end: "endshow" };
function St(t, a) {
  if (!t) return "";
  const n = (p, l, i) => {
    const m = a.rels.find((o) => o.type === p && o.target === l);
    if (m) return m.id;
    const $ = `rId${a.rels.length + 1}`;
    return a.rels.push({ id: $, type: p, target: l, external: i }), $;
  };
  if (t.kind === "url") return `<a:hlinkClick r:id="${n(h.hyperlink, t.url, !0)}"/>`;
  if (t.kind === "action") return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${Pt[t.action]}"/>`;
  const s = a.slideNumber?.(t.key);
  return s ? `<a:hlinkClick r:id="${n(h.slide, `slide${s}.xml`)}" action="ppaction://hlinksldjump"/>` : "";
}
const V = (t, a, n = "a:xfrm", s = !1) => {
  const p = Math.round((t.x * a.s + a.dx) * C), l = Math.round((t.y * a.s + a.dy) * C), i = Math.max(0, Math.round(Math.abs(t.w) * a.s * C)), m = Math.max(0, Math.round(Math.abs(t.h) * a.s * C)), $ = [
    t.rot ? `rot="${nt(t.rot)}"` : "",
    t.flipH ? 'flipH="1"' : "",
    t.flipV ? 'flipV="1"' : ""
  ].filter(Boolean).join(" "), o = s ? `<a:chOff x="${p}" y="${l}"/><a:chExt cx="${i}" cy="${m}"/>` : "";
  return `<${n}${$ ? " " + $ : ""}><a:off x="${p}" y="${l}"/><a:ext cx="${i}" cy="${m}"/>${o}</${n}>`;
}, q = (t, a, n) => {
  const s = `<p:cNvPr id="${t.id}" name="${w(t.name)}"${n ? ` descr="${w(n)}"` : ""}`, p = St(t.link, a);
  return p ? `${s}>${p}</p:cNvPr>` : `${s}/>`;
};
function bt(t, a) {
  const n = `<p:nvSpPr>${q(t, a)}<p:cNvSpPr${t.textBox ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr>`, s = `<p:spPr>${V(t, a)}${rt(t.geom, t.w, t.h)}${pt(t.fill)}${lt(t.line, a.s)}</p:spPr>`, p = t.text ? vt(t.text, a.s) : '<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>';
  return `<p:sp>${n}${s}${p}</p:sp>`;
}
function Mt(t, a) {
  const n = (p, l) => l ? `<a:${p} id="${l.id}" idx="${l.idx}"/>` : "";
  return `<p:cxnSp>${`<p:nvCxnSpPr>${q(t, a)}<p:cNvCxnSpPr>${n("stCxn", t.start)}${n("endCxn", t.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`}<p:spPr>${V(t, a)}${rt(t.geom, t.w, t.h)}<a:noFill/>${lt(t.line, a.s)}</p:spPr></p:cxnSp>`;
}
function Ct(t, a) {
  const n = a.media(t.media), s = `<p:nvPicPr>${q(t, a, t.descr)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`, p = t.alpha !== void 0 && t.alpha < 1 ? `<a:alphaModFix amt="${_(t.alpha)}"/>` : "", l = t.crop, i = l ? `<a:srcRect l="${_(l.l)}" t="${_(l.t)}" r="${_(l.r)}" b="${_(l.b)}"/>` : "", m = `<p:blipFill><a:blip r:embed="${n}">${p}</a:blip>${i}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
  return `<p:pic>${s}${m}<p:spPr>${V(t, a)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}
function Lt(t, a) {
  return `<p:grpSp>${`<p:nvGrpSpPr>${q(t, a)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`}<p:grpSpPr>${V(t, a, "a:xfrm", !0)}</p:grpSpPr>${t.children.map((s) => ot(s, a)).join("")}</p:grpSp>`;
}
function ot(t, a) {
  switch (t.kind) {
    case "shape":
      return bt(t, a);
    case "connector":
      return Mt(t, a);
    case "picture":
      return Ct(t, a);
    case "group":
      return t.children.length ? Lt(t, a) : "";
  }
}
const D = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
function wt(t, a) {
  const n = a && a > 0 ? ` advTm="${Math.round(a)}"` : "";
  if (!t) return n ? `<mc:AlternateContent xmlns:mc="${M.mc}"><mc:Choice xmlns:p14="${M.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${n}/></mc:Choice><mc:Fallback><p:transition spd="fast"${n}/></mc:Fallback></mc:AlternateContent>` : "";
  const s = Math.max(0, Math.min(6e4, Math.round(t.durationMs))), p = s <= 600 ? "fast" : s <= 900 ? "med" : "slow", l = t.kind === "push" ? `<p:push dir="${t.dir ?? "l"}"/>` : t.kind === "zoom" ? `<p:zoom dir="${t.zoomIn === !1 ? "out" : "in"}"/>` : "<p:fade/>";
  return t.kind === "morph" ? `<mc:AlternateContent xmlns:mc="${M.mc}"><mc:Choice xmlns:p159="${ht}" xmlns:p14="${M.p14}" Requires="p159"><p:transition spd="${p}" p14:dur="${s}"${n}><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="${p}"${n}><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>` : `<mc:AlternateContent xmlns:mc="${M.mc}"><mc:Choice xmlns:p14="${M.p14}" Requires="p14"><p:transition spd="${p}" p14:dur="${s}"${n}>${l}</p:transition></mc:Choice><mc:Fallback><p:transition spd="${p}"${n}>${l}</p:transition></mc:Fallback></mc:AlternateContent>`;
}
const Ft = { l: ["0-#ppt_w/2", "#ppt_y"], r: ["1+#ppt_w/2", "#ppt_y"], t: ["#ppt_x", "0-#ppt_h/2"], b: ["#ppt_x", "1+#ppt_h/2"] }, kt = { l: "wipe(right)", r: "wipe(left)", t: "wipe(down)", b: "wipe(up)" };
function Tt(t, a) {
  if (!t.length) return "";
  let n = 0;
  const s = () => ++n, p = (e) => `<p:tgtEl><p:spTgt spid="${e}"/></p:tgtEl>`, l = (e, r, c = [], d, f) => `<p:cBhvr${f ? ` additive="${f}"` : ""}>` + (d !== void 0 ? `<p:cTn id="${s()}" dur="${Math.max(1, r)}" fill="hold"><p:stCondLst><p:cond delay="${d}"/></p:stCondLst></p:cTn>` : `<p:cTn id="${s()}" dur="${Math.max(1, r)}" fill="hold"/>`) + p(e.target) + (c.length ? `<p:attrNameLst>${c.map((S) => `<p:attrName>${S}</p:attrName>`).join("")}</p:attrNameLst>` : "") + "</p:cBhvr>", i = (e, r, c) => `<p:set>${l(e, 1, ["style.visibility"], r)}<p:to><p:strVal val="${c ? "visible" : "hidden"}"/></p:to></p:set>`, m = (e, r, c, d, f) => `<p:anim calcmode="lin" valueType="num">${l(e, r, [c], void 0, "base")}<p:tavLst><p:tav tm="0"><p:val><p:strVal val="${d}"/></p:val></p:tav><p:tav tm="100000"><p:val><p:strVal val="${f}"/></p:val></p:tav></p:tavLst></p:anim>`, $ = (e, r, c, d) => `<p:animEffect transition="${d ? "out" : "in"}" filter="${c}">${l(e, r)}</p:animEffect>`, o = (e, r, c) => `<p:animRot by="${Math.round(Math.max(-36e3, Math.min(36e3, c)) * 6e4)}">${l(e, r, ["r"])}</p:animRot>`, g = (e, r, c) => `<p:animScale>${l(e, r)}<p:by x="${c * 1e3}" y="${c * 1e3}"/></p:animScale>`, u = (e) => {
    const r = Math.max(1, Math.min(36e5, e.durationMs)), c = e.dir ?? "b";
    if (e.cls === "emph")
      return e.effect === "spin" ? o(e, r, e.degrees ?? 360) : e.effect === "teeter" ? o(e, r, 4) : g(e, r, e.effect === "growShrink" ? 150 : 105);
    const d = e.cls === "exit";
    let f = d ? "" : i(e, 0, !0);
    switch (e.effect) {
      case "appear":
        break;
      case "fly": {
        const [S, A] = Ft[c];
        f += d ? m(e, r, "ppt_x", "#ppt_x", S) + m(e, r, "ppt_y", "#ppt_y", A) : m(e, r, "ppt_x", S, "#ppt_x") + m(e, r, "ppt_y", A, "#ppt_y");
        break;
      }
      case "zoom":
      case "grow":
      case "spinner":
      case "bounce":
      case "swivel": {
        const S = e.effect === "swivel" ? m(e, r, "ppt_w", d ? "#ppt_w" : "0", d ? "0" : "#ppt_w") : m(e, r, "ppt_w", d ? "#ppt_w" : "0", d ? "0" : "#ppt_w") + m(e, r, "ppt_h", d ? "#ppt_h" : "0", d ? "0" : "#ppt_h");
        f += S, e.effect === "spinner" && (f += o(e, r, d ? -360 : 360)), f += $(e, r, "fade", d);
        break;
      }
      case "wipe":
        f += $(e, r, kt[e.dir ?? "l"], d);
        break;
      default:
        f += $(e, r, "fade", d);
    }
    return d ? f + i(e, e.effect === "appear" ? 0 : r - 1, !1) : f;
  }, x = /* @__PURE__ */ new Map(), y = /* @__PURE__ */ new Map();
  for (const e of t) {
    const r = x.get(e.target) ?? 0;
    y.set(e, r), x.set(e.target, r + 1);
  }
  const F = (e) => {
    const r = e.start === "click" ? "clickEffect" : e.start === "with" ? "withEffect" : "afterEffect", c = e.repeat === -1 ? ' repeatCount="indefinite"' : e.repeat && e.repeat > 1 ? ` repeatCount="${Math.min(1e4, e.repeat) * 1e3}"` : "", d = e.cls === "emph" && (e.effect === "pulse" || e.effect === "growShrink") ? ' autoRev="1"' : "";
    return `<p:par><p:cTn id="${s()}" presetID="${e.presetId}" presetClass="${e.cls}" presetSubtype="${e.subtype}"${c}${d} fill="hold" grpId="${y.get(e)}" nodeType="${r}"><p:stCondLst><p:cond delay="${Math.min(36e5, e.delayMs)}"/></p:stCondLst><p:childTnLst>${u(e)}</p:childTnLst></p:cTn></p:par>`;
  }, P = (e) => e.delayMs + e.durationMs * (e.repeat && e.repeat > 1 ? Math.min(100, e.repeat) : 1), L = [];
  for (const e of t) {
    const r = L[L.length - 1];
    e.start === "click" || !r ? L.push({ auto: e.start !== "click", groups: [[e]] }) : e.start === "with" ? r.groups[r.groups.length - 1].push(e) : r.groups.push([e]);
  }
  const j = s(), T = s(), O = L.map((e) => {
    const r = e.auto ? '<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>' : '<p:cond delay="indefinite"/>', c = s();
    let d = 0;
    const f = e.groups.map((S) => {
      const U = `<p:par><p:cTn id="${s()}" fill="hold"><p:stCondLst><p:cond delay="${d}"/></p:stCondLst><p:childTnLst>${S.map(F).join("")}</p:childTnLst></p:cTn></p:par>`;
      return d += Math.max(...S.map(P)), U;
    }).join("");
    return `<p:par><p:cTn id="${c}" fill="hold"><p:stCondLst>${r}</p:stCondLst><p:childTnLst>${f}</p:childTnLst></p:cTn></p:par>`;
  }).join(""), z = /* @__PURE__ */ new Set();
  ((e) => e.forEach((r) => {
    r.kind === "shape" && z.add(r.id);
  }))(a);
  const X = [...new Set(t.map((e) => e.target))].filter((e) => z.has(e)).flatMap((e) => Array.from({ length: x.get(e) ?? 1 }, (r, c) => `<p:bldP spid="${e}" grpId="${c}" animBg="1"/>`)).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="${j}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="${T}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${O}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst>${X ? `<p:bldLst>${X}</p:bldLst>` : ""}</p:timing>`;
}
function It(t, a) {
  let n = "";
  const s = t.background;
  s && s.kind === "image" ? n = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${a.media(s.media)}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>` : s && s.kind !== "none" && (n = `<p:bg><p:bgPr>${pt(s)}<a:effectLst/></p:bgPr></p:bg>`);
  const p = t.items.map((m) => ot(m, a)).join(""), l = t.name ? ` name="${w(t.name)}"` : "", i = t.hidden ? ' show="0"' : "";
  return v + `<p:sld ${k}${i}><p:cSld${l}>${n}<p:spTree>${D}${p}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${wt(t.transition, t.advanceAfterMs)}${Tt(t.anims ?? [], t.items)}</p:sld>`;
}
const H = (t, a = "") => `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${a}<a:defRPr sz="${t}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`, et = v + `<a:theme xmlns:a="${M.a}" name="Yappy"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1><a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4><a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`, Et = v + `<p:sldMaster ${k}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${D}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle>${H(4400)}</p:titleStyle><p:bodyStyle>${H(2800)}</p:bodyStyle><p:otherStyle>${H(1800)}</p:otherStyle></p:txStyles></p:sldMaster>`, _t = v + `<p:sldLayout ${k} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${D}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`, at = 6858e3, st = 9144e3, R = (t, a, n, s, p, l, i, m, $ = "") => {
  const o = `<a:xfrm><a:off x="${Math.round(at * p)}" y="${Math.round(st * l)}"/><a:ext cx="${Math.round(at * i)}" cy="${Math.round(st * m)}"/></a:xfrm>`, g = n === "sldImg", u = g ? "" : ' sz="quarter"', x = g ? `<p:spPr>${o}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>` : `<p:spPr>${o}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`, y = g ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>', F = g ? "" : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${$ || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
  return `<p:sp><p:nvSpPr><p:cNvPr id="${t}" name="${a}"/><p:cNvSpPr>${y}</p:cNvSpPr><p:nvPr><p:ph type="${n}"${u} idx="${s}"/></p:nvPr></p:nvSpPr>${x}${F}</p:sp>`;
}, Nt = Array.from({ length: 9 }, (t, a) => `<a:lvl${a + 1}pPr marL="${a * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${a + 1}pPr>`).join(""), Rt = v + `<p:notesMaster ${k}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${D}` + R(2, "Header Placeholder 1", "hdr", 0, 0, 0, 0.43, 0.05) + R(3, "Date Placeholder 2", "dt", 1, 0.57, 0, 0.43, 0.05) + R(4, "Slide Image Placeholder 3", "sldImg", 2, 0.125, 0.125, 0.75, 0.375) + R(5, "Notes Placeholder 4", "body", 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>') + R(6, "Footer Placeholder 5", "ftr", 4, 0, 0.95, 0.43, 0.05) + R(7, "Slide Number Placeholder 6", "sldNum", 5, 0.57, 0.95, 0.43, 0.05) + `</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:notesStyle>${Nt}</p:notesStyle></p:notesMaster>`;
function At(t) {
  const a = t.replace(/\r\n?/g, `
`).split(`
`).map((p) => p ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${w(p)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>').join(""), n = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>', s = `<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${a}</p:txBody></p:sp>`;
  return v + `<p:notes ${k}><p:cSld><p:spTree>${D}${n}${s}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>`;
}
const Bt = v + `<p:presentationPr ${k}/>`, Dt = v + `<p:presentationPr ${k}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;
function jt(t, a) {
  if (!t.some((p) => p.section)) return "";
  const n = [];
  t.forEach((p, l) => {
    (p.section || !n.length) && n.push({ name: p.section || "Default Section", ids: [] }), n[n.length - 1].ids.push(a(l));
  });
  const s = (p) => `{8F3A1C2E-5B7D-4E9A-9C11-${(p + 1).toString(16).toUpperCase().padStart(12, "0")}}`;
  return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${M.p14}">` + n.map((p, l) => `<p14:section name="${w(p.name)}" id="${s(l)}"><p14:sldIdLst>${p.ids.map((i) => `<p14:sldId id="${i}"/>`).join("")}</p14:sldIdLst></p14:section>`).join("") + "</p14:sectionLst></p:ext></p:extLst>";
}
const Ot = v + `<p:viewPr ${k}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`, zt = v + `<a:tblStyleLst xmlns:a="${M.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`, Xt = (t, a) => v + `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${w(t)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${a}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${a}</dcterms:modified></cp:coreProperties>`, Ut = (t, a) => v + `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>YappyDraw</Application><Slides>${t}</Slides><Notes>${a}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;
function Ht(t, a = {}) {
  const n = Math.max(1, t.width), s = Math.max(1, t.height), p = Math.max(n, s) * C, l = Math.min(n, s) * C, i = p > B ? B / p : l < G ? Math.min(G / l, B / p) : 1, m = Math.max(G, Math.min(B, Math.round(n * i * C))), $ = Math.max(G, Math.min(B, Math.round(s * i * C))), o = /* @__PURE__ */ new Map(), g = [], u = /* @__PURE__ */ new Set();
  let x = 0;
  const y = t.slides.length ? t.slides : [{ items: [] }], F = /* @__PURE__ */ new Map();
  y.forEach((e, r) => {
    e.key && F.set(e.key, r + 1);
  });
  const P = [{ id: "rId1", type: h.slideMaster, target: "slideMasters/slideMaster1.xml" }], L = y.some((e) => !!e.notes?.trim());
  let j = "";
  y.forEach((e, r) => {
    const c = r + 1, d = [{ id: "rId1", type: h.slideLayout, target: "../slideLayouts/slideLayout1.xml" }], f = /* @__PURE__ */ new Map(), S = e.fit ?? { scale: 1, dx: 0, dy: 0 }, A = {
      s: S.scale * i,
      dx: S.dx * i,
      dy: S.dy * i,
      rels: d,
      slideNumber: (I) => F.get(I) ?? null,
      media: (I) => {
        const Z = f.get(I);
        if (Z) return Z;
        x++;
        const K = `image${x}.${I.ext}`;
        o.set(`ppt/media/${K}`, I.bytes), u.add(I.ext);
        const W = `rId${d.length + 1}`;
        return d.push({ id: W, type: h.image, target: `../media/${K}` }), f.set(I, W), W;
      }
    };
    o.set(`ppt/slides/slide${c}.xml`, It(e, A)), e.notes?.trim() && (d.push({ id: `rId${d.length + 1}`, type: h.notesSlide, target: `../notesSlides/notesSlide${c}.xml` }), o.set(`ppt/notesSlides/notesSlide${c}.xml`, At(e.notes)), o.set(`ppt/notesSlides/_rels/notesSlide${c}.xml.rels`, E([
      { id: "rId1", type: h.notesMaster, target: "../notesMasters/notesMaster1.xml" },
      { id: "rId2", type: h.slide, target: `../slides/slide${c}.xml` }
    ])), g.push([`/ppt/notesSlides/notesSlide${c}.xml`, b.notesSlide])), o.set(`ppt/slides/_rels/slide${c}.xml.rels`, E(d)), g.push([`/ppt/slides/slide${c}.xml`, b.slide]);
    const U = `rId${c + 1}`;
    P.push({ id: U, type: h.slide, target: `slides/slide${c}.xml` }), j += `<p:sldId id="${255 + c}" r:id="${U}"/>`;
  });
  const T = y.length + 2;
  P.push(
    { id: `rId${T}`, type: h.theme, target: "theme/theme1.xml" },
    { id: `rId${T + 1}`, type: h.presProps, target: "presProps.xml" },
    { id: `rId${T + 2}`, type: h.viewProps, target: "viewProps.xml" },
    { id: `rId${T + 3}`, type: h.tableStyles, target: "tableStyles.xml" }
  );
  const O = `rId${T + 4}`;
  L && (P.push({ id: O, type: h.notesMaster, target: "notesMasters/notesMaster1.xml" }), o.set("ppt/notesMasters/notesMaster1.xml", Rt), o.set("ppt/notesMasters/_rels/notesMaster1.xml.rels", E([
    { id: "rId1", type: h.theme, target: "../theme/theme2.xml" }
  ])), o.set("ppt/theme/theme2.xml", et), g.push(["/ppt/notesMasters/notesMaster1.xml", b.notesMaster], ["/ppt/theme/theme2.xml", b.theme]));
  const z = v + `<p:presentation ${k} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` + (L ? `<p:notesMasterIdLst><p:notesMasterId r:id="${O}"/></p:notesMasterIdLst>` : "") + `<p:sldIdLst>${j}</p:sldIdLst><p:sldSz cx="${m}" cy="${$}"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle>${H(1800)}</p:defaultTextStyle>${jt(y, (e) => 256 + e)}</p:presentation>`;
  o.set("ppt/presentation.xml", z), o.set("ppt/_rels/presentation.xml.rels", E(P)), o.set("ppt/slideMasters/slideMaster1.xml", Et), o.set("ppt/slideMasters/_rels/slideMaster1.xml.rels", E([
    { id: "rId1", type: h.slideLayout, target: "../slideLayouts/slideLayout1.xml" },
    { id: "rId2", type: h.theme, target: "../theme/theme1.xml" }
  ])), o.set("ppt/slideLayouts/slideLayout1.xml", _t), o.set("ppt/slideLayouts/_rels/slideLayout1.xml.rels", E([
    { id: "rId1", type: h.slideMaster, target: "../slideMasters/slideMaster1.xml" }
  ])), o.set("ppt/theme/theme1.xml", et), o.set("ppt/presProps.xml", t.loop ? Dt : Bt), o.set("ppt/viewProps.xml", Ot), o.set("ppt/tableStyles.xml", zt);
  const J = a.now ?? (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z");
  o.set("docProps/core.xml", Xt(t.title || "YappyDraw presentation", J)), o.set("docProps/app.xml", Ut(y.length, y.filter((e) => !!e.notes?.trim()).length)), o.set("_rels/.rels", E([
    { id: "rId1", type: h.officeDocument, target: "ppt/presentation.xml" },
    { id: "rId2", type: h.coreProps, target: "docProps/core.xml" },
    { id: "rId3", type: h.extProps, target: "docProps/app.xml" }
  ])), g.push(
    ["/ppt/presentation.xml", b.presentation],
    ["/ppt/slideMasters/slideMaster1.xml", b.slideMaster],
    ["/ppt/slideLayouts/slideLayout1.xml", b.slideLayout],
    ["/ppt/theme/theme1.xml", b.theme],
    ["/ppt/presProps.xml", b.presProps],
    ["/ppt/viewProps.xml", b.viewProps],
    ["/ppt/tableStyles.xml", b.tableStyles],
    ["/docProps/core.xml", b.core],
    ["/docProps/app.xml", b.app]
  );
  const X = v + `<Types xmlns="${M.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` + [...u].map((e) => `<Default Extension="${e}" ContentType="${ft[e]}"/>`).join("") + g.map(([e, r]) => `<Override PartName="${e}" ContentType="${r}"/>`).join("") + "</Types>";
  return o.set("[Content_Types].xml", X), it(o);
}
export {
  Ht as buildPptx,
  At as notesXml
};
