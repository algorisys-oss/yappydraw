/**
 * Deck → .pptx bytes. Pure: no DOM, no store.
 *
 * Writes the smallest package PowerPoint opens without a repair prompt — one slide master, one
 * blank layout, one theme, the slides and the three property parts — following the part list
 * DeckCraft's writer emits (crates/pptx/src/write.rs `export`, MIT/Apache). Every slide is built
 * on the blank layout, so nothing inherits placeholder text or positions: what the deck model
 * says is what PowerPoint shows.
 */
import type { Deck, Slide, Item, Paint, Color, Line, TextBody, TextRun, Paragraph, Geometry, Media, Transition, ShapeItem, ConnectorItem, PictureItem, GroupItem, DeckLink } from './deck';
import { custGeomXml, presetGeomXml } from './custgeom';
import { EMU_PER_PX, ang, esc, fontSz, pct, NS, REL, XML_DECL, relsXml, zipPackage, type Rel } from './ooxml';

/** ECMA-376 `ST_SlideSizeCoordinate` bounds (1″ … 56″). */
const MIN_SLIDE_EMU = 914400;
const MAX_SLIDE_EMU = 51206400;

const ROOT_NS = `xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"`;

const CT = {
    presentation: 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml',
    slide: 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml',
    slideLayout: 'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml',
    slideMaster: 'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml',
    theme: 'application/vnd.openxmlformats-officedocument.theme+xml',
    presProps: 'application/vnd.openxmlformats-officedocument.presentationml.presProps+xml',
    viewProps: 'application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml',
    tableStyles: 'application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml',
    notesMaster: 'application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml',
    notesSlide: 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml',
    core: 'application/vnd.openxmlformats-package.core-properties+xml',
    app: 'application/vnd.openxmlformats-officedocument.extended-properties+xml',
};

const MEDIA_CT: Record<Media['ext'], string> = {
    png: 'image/png', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', bmp: 'image/bmp',
    tiff: 'image/tiff', webp: 'image/webp', emf: 'image/x-emf', wmf: 'image/x-wmf',
};

// ── Paint / line / text ─────────────────────────────────────────────────────────────────────

const hex6 = (hex: string): string => {
    const h = String(hex || '').replace('#', '').toLowerCase();
    return /^[0-9a-f]{6}$/.test(h) ? h.toUpperCase() : '000000';
};

const clr = (c: Color): string => {
    const a = c.alpha;
    return a !== undefined && a < 1
        ? `<a:srgbClr val="${hex6(c.hex)}"><a:alpha val="${pct(a)}"/></a:srgbClr>`
        : `<a:srgbClr val="${hex6(c.hex)}"/>`;
};

const gsLst = (stops: { pos: number; color: Color }[]): string => {
    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    // DrawingML needs at least two stops; a one-stop gradient is a flat fill of that colour.
    const list = sorted.length === 1 ? [{ ...sorted[0], pos: 0 }, { ...sorted[0], pos: 1 }] : sorted;
    return '<a:gsLst>' + list.map(s => `<a:gs pos="${pct(s.pos)}">${clr(s.color)}</a:gs>`).join('') + '</a:gsLst>';
};

function paintXml(p: Paint | undefined): string {
    if (!p || p.kind === 'none') return '<a:noFill/>';
    switch (p.kind) {
        case 'solid': return `<a:solidFill>${clr(p.color)}</a:solidFill>`;
        case 'linear': return p.stops.length === 0 ? '<a:noFill/>'
            : `<a:gradFill rotWithShape="1">${gsLst(p.stops)}<a:lin ang="${ang(p.angle)}" scaled="${p.scaled ? 1 : 0}"/></a:gradFill>`;
        case 'radial': return p.stops.length === 0 ? '<a:noFill/>'
            : `<a:gradFill rotWithShape="1">${gsLst(p.stops)}<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill>`;
        case 'image': return '<a:noFill/>'; // import-only paint; the exporter never produces it
        case 'pattern': return `<a:pattFill prst="${esc(p.preset)}"><a:fgClr>${clr(p.color)}</a:fgClr><a:bgClr>${p.bg ? clr(p.bg) : '<a:srgbClr val="FFFFFF"><a:alpha val="0"/></a:srgbClr>'}</a:bgClr></a:pattFill>`;
    }
}

function lineXml(l: Line | null, s: number): string {
    if (!l || !(l.width > 0)) return '<a:ln><a:noFill/></a:ln>';
    const w = Math.max(0, Math.min(20116800, Math.round(l.width * s * EMU_PER_PX)));
    let x = `<a:ln w="${w}"${l.cap ? ` cap="${l.cap}"` : ''}><a:solidFill>${clr(l.color)}</a:solidFill>`;
    if (l.dash) x += `<a:prstDash val="${esc(l.dash)}"/>`;
    if (l.join === 'round') x += '<a:round/>';
    else if (l.join === 'bevel') x += '<a:bevel/>';
    else if (l.join === 'miter') x += '<a:miter lim="800000"/>';
    const end = (tag: string, e: Line['head']) => e ? `<a:${tag} type="${e.type}" w="${e.size ?? 'med'}" len="${e.size ?? 'med'}"/>` : '';
    x += end('headEnd', l.head) + end('tailEnd', l.tail);
    return x + '</a:ln>';
}

function rPr(r: Omit<TextRun, 'text' | 'br'>, s: number, tag = 'a:rPr'): string {
    const attrs = ['lang="en-US"'];
    if (r.size) attrs.push(`sz="${fontSz(r.size * s)}"`);
    if (r.bold !== undefined) attrs.push(`b="${r.bold ? 1 : 0}"`);
    if (r.italic !== undefined) attrs.push(`i="${r.italic ? 1 : 0}"`);
    if (r.underline) attrs.push('u="sng"');
    if (r.strike) attrs.push('strike="sngStrike"');
    attrs.push('dirty="0"');
    let inner = '';
    if (r.color) inner += `<a:solidFill>${clr(r.color)}</a:solidFill>`;
    if (r.font) {
        const f = esc(r.font);
        inner += `<a:latin typeface="${f}"/><a:ea typeface="${f}"/><a:cs typeface="${f}"/>`;
    }
    return inner ? `<${tag} ${attrs.join(' ')}>${inner}</${tag}>` : `<${tag} ${attrs.join(' ')}/>`;
}

const BULLET_INDENT_PX = 20; // the canvas list indent (LIST_INDENT_SIZE in rich-text-utils)

/** Glyphs Arial carries; anything else names a symbol font PowerPoint can draw it from. */
const ARIAL_BULLETS = new Set(['\u2022', '\u2013', '\u2014', '-', '\u00BB', '\u203A', '>', '*', '+', '\u00B7']);
const AUTONUM = /^(alphaLc|alphaUc|arabic|romanLc|romanUc)(ParenBoth|ParenR|Period|Plain)$/;

function paragraphXml(p: Paragraph, body: TextBody, s: number): string {
    const lvl = Math.max(0, Math.min(8, p.level ?? 0));
    const ppAttrs: string[] = [];
    if (p.align) ppAttrs.push(`algn="${p.align}"`);
    let ppInner = '';
    if (body.lineSpacing && Math.abs(body.lineSpacing - 1) > 1e-3) {
        ppInner += `<a:lnSpc><a:spcPct val="${Math.round(Math.max(0.1, Math.min(13.2, body.lineSpacing)) * 100000)}"/></a:lnSpc>`;
    }
    const spc = (tag: string, v: number | undefined) =>
        v && v > 0 ? `<a:${tag}><a:spcPts val="${Math.round(Math.min(1584, v * s * 0.75) * 100)}"/></a:${tag}>` : '';
    ppInner += spc('spcBef', p.spaceBefore) + spc('spcAft', p.spaceAfter);
    if (p.bullet) {
        const step = BULLET_INDENT_PX * s * EMU_PER_PX;
        const marL = p.marL !== undefined ? p.marL * s * EMU_PER_PX : step * (lvl + 1);
        const ind = p.indent !== undefined ? p.indent * s * EMU_PER_PX : -step;
        const clampE = (v: number, lo: number) => Math.round(Math.max(lo, Math.min(51206400, v)));
        ppAttrs.push(`marL="${clampE(marL, 0)}" indent="${clampE(ind, -51206400)}"`);
        if (lvl) ppAttrs.push(`lvl="${lvl}"`);
        // Schema order: buClr, buSzPct, buFont, then the bullet itself.
        if (p.bulletColor) ppInner += `<a:buClr>${clr(p.bulletColor)}</a:buClr>`;
        if (p.bulletScale && Math.abs(p.bulletScale - 1) > 1e-3) ppInner += `<a:buSzPct val="${Math.round(Math.max(0.25, Math.min(4, p.bulletScale)) * 100000)}"/>`;
        if (p.bullet === 'num') {
            const type = p.numType && AUTONUM.test(p.numType) ? p.numType : 'arabicPeriod';
            const start = p.startAt && p.startAt > 1 ? ` startAt="${Math.min(32767, Math.round(p.startAt))}"` : '';
            ppInner += `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="${type}"${start}/>`;
        } else {
            const ch = p.bulletChar || '\u2022';
            ppInner += `<a:buFont typeface="${ARIAL_BULLETS.has(ch) ? 'Arial' : 'Segoe UI Symbol'}"/><a:buChar char="${esc(ch)}"/>`;
        }
    } else {
        if (lvl) ppAttrs.push(`lvl="${lvl}"`);
        ppInner += '<a:buNone/>';
    }
    const pPr = `<a:pPr${ppAttrs.length ? ' ' + ppAttrs.join(' ') : ''}>${ppInner}</a:pPr>`;
    const d = body.defaults ?? {};
    let runs = '';
    for (const r of p.runs) {
        const merged = { ...d, ...stripUndef(r) };
        if (r.br) { runs += `<a:br>${rPr(merged, s)}</a:br>`; continue; }
        if (!r.text) continue;
        runs += `<a:r>${rPr(merged, s)}<a:t>${esc(r.text)}</a:t></a:r>`;
    }
    const endSize = p.endSize ?? d.size;
    return `<a:p>${pPr}${runs}${rPr({ ...d, size: endSize }, s, 'a:endParaRPr')}</a:p>`;
}

const stripUndef = <T extends object>(o: T): Partial<T> =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

function txBodyXml(t: TextBody | undefined, s: number, tag = 'p:txBody'): string {
    if (!t) return '';
    const ins = (v: number) => Math.max(0, Math.round(v * s * EMU_PER_PX));
    const bodyPr = `<a:bodyPr wrap="${t.wrap ? 'square' : 'none'}" lIns="${ins(t.insets.l)}" tIns="${ins(t.insets.t)}" rIns="${ins(t.insets.r)}" bIns="${ins(t.insets.b)}" anchor="${t.anchor}" rtlCol="0"><a:noAutofit/></a:bodyPr>`;
    const paras = t.paragraphs.length ? t.paragraphs : [{ runs: [] }];
    return `<${tag}>${bodyPr}<a:lstStyle/>${paras.map(p => paragraphXml(p, t, s)).join('')}</${tag}>`;
}

const geomXml = (g: Geometry, w: number, h: number): string =>
    g.kind === 'preset' ? presetGeomXml(g.prst, g.adj) : custGeomXml(g.paths, w, h);

// ── Slide items ─────────────────────────────────────────────────────────────────────────────

interface Ctx {
    s: number; dx: number; dy: number;   // slide fit
    rels: Rel[];
    media: (m: Media) => string;          // returns the rel id
    /** Slide number (1-based) for a slide link's key, when that slide is in the deck. */
    slideNumber?: (key: string) => number | null;
}

const JUMP: Record<string, string> = { next: 'nextslide', previous: 'previousslide', first: 'firstslide', last: 'lastslide', end: 'endshow' };

/** `a:hlinkClick` for an object's link, adding the relationship it needs. '' for none. */
function hlinkXml(link: DeckLink | undefined, c: Ctx): string {
    if (!link) return '';
    const rel = (type: string, target: string, external?: boolean) => {
        const known = c.rels.find(r => r.type === type && r.target === target);
        if (known) return known.id;
        const id = `rId${c.rels.length + 1}`;
        c.rels.push({ id, type, target, external });
        return id;
    };
    if (link.kind === 'url') return `<a:hlinkClick r:id="${rel(REL.hyperlink, link.url, true)}"/>`;
    if (link.kind === 'action') return `<a:hlinkClick r:id="" action="ppaction://hlinkshowjump?jump=${JUMP[link.action]}"/>`;
    const n = c.slideNumber?.(link.key);
    return n ? `<a:hlinkClick r:id="${rel(REL.slide, `slide${n}.xml`)}" action="ppaction://hlinksldjump"/>` : '';
}

const xfrmXml = (it: { x: number; y: number; w: number; h: number; rot?: number; flipH?: boolean; flipV?: boolean }, c: Ctx, tag = 'a:xfrm', group = false): string => {
    const x = Math.round((it.x * c.s + c.dx) * EMU_PER_PX), y = Math.round((it.y * c.s + c.dy) * EMU_PER_PX);
    const cx = Math.max(0, Math.round(Math.abs(it.w) * c.s * EMU_PER_PX)), cy = Math.max(0, Math.round(Math.abs(it.h) * c.s * EMU_PER_PX));
    const attrs = [
        it.rot ? `rot="${ang(it.rot)}"` : '',
        it.flipH ? 'flipH="1"' : '',
        it.flipV ? 'flipV="1"' : '',
    ].filter(Boolean).join(' ');
    // Children of a group keep slide coordinates: child space == group space (chOff/chExt = off/ext).
    const ch = group ? `<a:chOff x="${x}" y="${y}"/><a:chExt cx="${cx}" cy="${cy}"/>` : '';
    return `<${tag}${attrs ? ' ' + attrs : ''}><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/>${ch}</${tag}>`;
};

const cNvPr = (it: { id: number; name: string; link?: DeckLink }, c: Ctx, descr?: string) => {
    const head = `<p:cNvPr id="${it.id}" name="${esc(it.name)}"${descr ? ` descr="${esc(descr)}"` : ''}`;
    const link = hlinkXml(it.link, c);
    return link ? `${head}>${link}</p:cNvPr>` : `${head}/>`;
};

function shapeXml(it: ShapeItem, c: Ctx): string {
    const nv = `<p:nvSpPr>${cNvPr(it, c)}<p:cNvSpPr${it.textBox ? ' txBox="1"' : ''}/><p:nvPr/></p:nvSpPr>`;
    const sp = `<p:spPr>${xfrmXml(it, c)}${geomXml(it.geom, it.w, it.h)}${paintXml(it.fill)}${lineXml(it.line, c.s)}</p:spPr>`;
    const tx = it.text ? txBodyXml(it.text, c.s)
        // PowerPoint gives every shape a text body so the user can type into it.
        : `<p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="ctr"/><a:endParaRPr lang="en-US" dirty="0"/></a:p></p:txBody>`;
    return `<p:sp>${nv}${sp}${tx}</p:sp>`;
}

function connectorXml(it: ConnectorItem, c: Ctx): string {
    const glue = (tag: string, e?: { id: number; idx: number }) => e ? `<a:${tag} id="${e.id}" idx="${e.idx}"/>` : '';
    const nv = `<p:nvCxnSpPr>${cNvPr(it, c)}<p:cNvCxnSpPr>${glue('stCxn', it.start)}${glue('endCxn', it.end)}</p:cNvCxnSpPr><p:nvPr/></p:nvCxnSpPr>`;
    return `<p:cxnSp>${nv}<p:spPr>${xfrmXml(it, c)}${geomXml(it.geom, it.w, it.h)}<a:noFill/>${lineXml(it.line, c.s)}</p:spPr></p:cxnSp>`;
}

function pictureXml(it: PictureItem, c: Ctx): string {
    const rid = c.media(it.media);
    const nv = `<p:nvPicPr>${cNvPr(it, c, it.descr)}<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>`;
    const alpha = it.alpha !== undefined && it.alpha < 1 ? `<a:alphaModFix amt="${pct(it.alpha)}"/>` : '';
    const cr = it.crop;
    const src = cr ? `<a:srcRect l="${pct(cr.l)}" t="${pct(cr.t)}" r="${pct(cr.r)}" b="${pct(cr.b)}"/>` : '';
    const blip = `<p:blipFill><a:blip r:embed="${rid}">${alpha}</a:blip>${src}<a:stretch><a:fillRect/></a:stretch></p:blipFill>`;
    return `<p:pic>${nv}${blip}<p:spPr>${xfrmXml(it, c)}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function groupXml(it: GroupItem, c: Ctx): string {
    const nv = `<p:nvGrpSpPr>${cNvPr(it, c)}<p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>`;
    return `<p:grpSp>${nv}<p:grpSpPr>${xfrmXml(it, c, 'a:xfrm', true)}</p:grpSpPr>${it.children.map(ch => itemXml(ch, c)).join('')}</p:grpSp>`;
}

function itemXml(it: Item, c: Ctx): string {
    switch (it.kind) {
        case 'shape': return shapeXml(it, c);
        case 'connector': return connectorXml(it, c);
        case 'picture': return pictureXml(it, c);
        case 'group': return it.children.length ? groupXml(it, c) : '';
    }
}

const EMPTY_TREE_HEADER = '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';

function transitionXml(t: Transition | undefined, advanceAfterMs?: number): string {
    // `advTm`: advance by itself after this many ms, with or without a visual transition.
    const adv = advanceAfterMs && advanceAfterMs > 0 ? ` advTm="${Math.round(advanceAfterMs)}"` : '';
    // Even with no visual effect, PowerPoint writes the transition in its AlternateContent
    // wrapper — and LibreOffice ignores a bare <p:transition advTm> (checked against its import).
    if (!t) return adv ? `<mc:AlternateContent xmlns:mc="${NS.mc}">`
        + `<mc:Choice xmlns:p14="${NS.p14}" Requires="p14"><p:transition spd="fast" p14:dur="0"${adv}/></mc:Choice>`
        + `<mc:Fallback><p:transition spd="fast"${adv}/></mc:Fallback></mc:AlternateContent>` : '';
    const dur = Math.max(0, Math.min(60000, Math.round(t.durationMs)));
    const spd = dur <= 600 ? 'fast' : dur <= 900 ? 'med' : 'slow';
    const effect = t.kind === 'push' ? `<p:push dir="${t.dir ?? 'l'}"/>`
        : t.kind === 'zoom' ? `<p:zoom dir="${t.zoomIn === false ? 'out' : 'in'}"/>`
        : '<p:fade/>';
    // PowerPoint 2010+ reads the exact duration from p14:dur; older readers take the Fallback.
    return `<mc:AlternateContent xmlns:mc="${NS.mc}">`
        + `<mc:Choice xmlns:p14="${NS.p14}" Requires="p14"><p:transition spd="${spd}" p14:dur="${dur}"${adv}>${effect}</p:transition></mc:Choice>`
        + `<mc:Fallback><p:transition spd="${spd}"${adv}>${effect}</p:transition></mc:Fallback>`
        + '</mc:AlternateContent>';
}

function slideXml(slide: Slide, c: Ctx): string {
    let bg = '';
    const b = slide.background;
    if (b && b.kind === 'image') {
        const rid = c.media(b.media);
        bg = `<p:bg><p:bgPr><a:blipFill dpi="0" rotWithShape="1"><a:blip r:embed="${rid}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></a:blipFill><a:effectLst/></p:bgPr></p:bg>`;
    } else if (b && b.kind !== 'none') {
        bg = `<p:bg><p:bgPr>${paintXml(b)}<a:effectLst/></p:bgPr></p:bg>`;
    }
    const items = slide.items.map(it => itemXml(it, c)).join('');
    const name = slide.name ? ` name="${esc(slide.name)}"` : '';
    const show = slide.hidden ? ' show="0"' : '';
    return XML_DECL + `<p:sld ${ROOT_NS}${show}><p:cSld${name}>${bg}<p:spTree>${EMPTY_TREE_HEADER}${items}</p:spTree></p:cSld>`
        + `<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>${transitionXml(slide.transition, slide.advanceAfterMs)}</p:sld>`;
}

// ── Fixed parts ─────────────────────────────────────────────────────────────────────────────

const lvlStyle = (sz: number, extra = '') =>
    `<a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">${extra}<a:defRPr sz="${sz}" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr>`;

const THEME = XML_DECL + `<a:theme xmlns:a="${NS.a}" name="Yappy"><a:themeElements>`
    + '<a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
    + '<a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="4472C4"/></a:accent1>'
    + '<a:accent2><a:srgbClr val="ED7D31"/></a:accent2><a:accent3><a:srgbClr val="A5A5A5"/></a:accent3><a:accent4><a:srgbClr val="FFC000"/></a:accent4>'
    + '<a:accent5><a:srgbClr val="5B9BD5"/></a:accent5><a:accent6><a:srgbClr val="70AD47"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink>'
    + '<a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'
    + '<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
    + '<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>'
    + '<a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
    + '<a:solidFill><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:solidFill>'
    + '<a:solidFill><a:schemeClr val="phClr"><a:shade val="80000"/></a:schemeClr></a:solidFill></a:fillStyleLst>'
    + '<a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>'
    + '<a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>'
    + '<a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln></a:lnStyleLst>'
    + '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
    + '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"><a:tint val="95000"/></a:schemeClr></a:solidFill>'
    + '<a:solidFill><a:schemeClr val="phClr"><a:shade val="90000"/></a:schemeClr></a:solidFill></a:bgFillStyleLst></a:fmtScheme>'
    + '</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>';

const MASTER = XML_DECL + `<p:sldMaster ${ROOT_NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${EMPTY_TREE_HEADER}</p:spTree></p:cSld>`
    + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    + '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
    + `<p:txStyles><p:titleStyle>${lvlStyle(4400)}</p:titleStyle><p:bodyStyle>${lvlStyle(2800)}</p:bodyStyle><p:otherStyle>${lvlStyle(1800)}</p:otherStyle></p:txStyles>`
    + '</p:sldMaster>';

const LAYOUT = XML_DECL + `<p:sldLayout ${ROOT_NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree>${EMPTY_TREE_HEADER}</p:spTree></p:cSld>`
    + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>';

// ── Speaker notes ───────────────────────────────────────────────────────────────────────────
// A notes slide needs a notes master, and a notes master needs a theme. The master's placeholder
// layout (header, date, slide image, notes body, footer, number on a portrait 7.5″×10″ page) is
// PowerPoint's default, as DeckCraft writes it (crates/pptx/src/write.rs `notes_master_shapes`).

const NOTES_W = 6858000, NOTES_H = 9144000;

const notesPh = (id: number, name: string, type: string, idx: number, x: number, y: number, w: number, h: number, body = '') => {
    const xfrm = `<a:xfrm><a:off x="${Math.round(NOTES_W * x)}" y="${Math.round(NOTES_H * y)}"/><a:ext cx="${Math.round(NOTES_W * w)}" cy="${Math.round(NOTES_H * h)}"/></a:xfrm>`;
    const img = type === 'sldImg';
    const sz = img ? '' : ' sz="quarter"';
    const spPr = img
        ? `<p:spPr>${xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln></p:spPr>`
        : `<p:spPr>${xfrm}<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`;
    const locks = img ? '<a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/>' : '<a:spLocks noGrp="1"/>';
    const tx = img ? '' : `<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/>${body || '<a:p><a:endParaRPr lang="en-US"/></a:p>'}</p:txBody>`;
    return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr>${locks}</p:cNvSpPr><p:nvPr><p:ph type="${type}"${sz} idx="${idx}"/></p:nvPr></p:nvSpPr>${spPr}${tx}</p:sp>`;
};

const notesLvl = Array.from({ length: 9 }, (_, i) =>
    `<a:lvl${i + 1}pPr marL="${i * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl${i + 1}pPr>`).join('');

const NOTES_MASTER = XML_DECL + `<p:notesMaster ${ROOT_NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${EMPTY_TREE_HEADER}`
    + notesPh(2, 'Header Placeholder 1', 'hdr', 0, 0, 0, 0.43, 0.05)
    + notesPh(3, 'Date Placeholder 2', 'dt', 1, 0.57, 0, 0.43, 0.05)
    + notesPh(4, 'Slide Image Placeholder 3', 'sldImg', 2, 0.125, 0.125, 0.75, 0.375)
    + notesPh(5, 'Notes Placeholder 4', 'body', 3, 0.1, 0.53, 0.8, 0.36, '<a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>')
    + notesPh(6, 'Footer Placeholder 5', 'ftr', 4, 0, 0.95, 0.43, 0.05)
    + notesPh(7, 'Slide Number Placeholder 6', 'sldNum', 5, 0.57, 0.95, 0.43, 0.05)
    + '</p:spTree></p:cSld>'
    + '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    + `<p:notesStyle>${notesLvl}</p:notesStyle></p:notesMaster>`;

/** One paragraph per line of the notes; a blank line stays an empty paragraph, as PowerPoint keeps it. */
export function notesXml(notes: string): string {
    const paras = notes.replace(/\r\n?/g, '\n').split('\n')
        .map(line => line ? `<a:p><a:r><a:rPr lang="en-US" dirty="0"/><a:t>${esc(line)}</a:t></a:r></a:p>` : '<a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>')
        .join('');
    const img = '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Slide Image Placeholder 1"/><p:cNvSpPr><a:spLocks noGrp="1" noRot="1" noChangeAspect="1"/></p:cNvSpPr><p:nvPr><p:ph type="sldImg"/></p:nvPr></p:nvSpPr><p:spPr/></p:sp>';
    const body = '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Notes Placeholder 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/>'
        + `<p:txBody><a:bodyPr/><a:lstStyle/>${paras}</p:txBody></p:sp>`;
    return XML_DECL + `<p:notes ${ROOT_NS}><p:cSld><p:spTree>${EMPTY_TREE_HEADER}${img}${body}</p:spTree></p:cSld>`
        + '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>';
}

const PRES_PROPS = XML_DECL + `<p:presentationPr ${ROOT_NS}/>`;
/** "Loop continuously until Esc" (`p:showPr loop`). */
const PRES_PROPS_LOOP = XML_DECL + `<p:presentationPr ${ROOT_NS}><p:showPr loop="1" showNarration="1"><p:present/><p:sldAll/></p:showPr></p:presentationPr>`;

/**
 * Sections as PowerPoint 2010+ stores them (`p14:sectionLst` in the presentation's extLst). Every
 * slide must belong to a section once any exist, so slides before the first named one go into
 * PowerPoint's "Default Section". '' when the deck has no sections.
 */
function sectionListXml(slides: Slide[], sldIdOf: (i: number) => number): string {
    if (!slides.some(s => s.section)) return '';
    const groups: { name: string; ids: number[] }[] = [];
    slides.forEach((s, i) => {
        if (s.section || !groups.length) groups.push({ name: s.section || 'Default Section', ids: [] });
        groups[groups.length - 1].ids.push(sldIdOf(i));
    });
    const guid = (n: number) => `{8F3A1C2E-5B7D-4E9A-9C11-${(n + 1).toString(16).toUpperCase().padStart(12, '0')}}`;
    return `<p:extLst><p:ext uri="{521415D9-36F7-43E2-AB2F-B90AF26B5E84}"><p14:sectionLst xmlns:p14="${NS.p14}">`
        + groups.map((g, n) => `<p14:section name="${esc(g.name)}" id="${guid(n)}"><p14:sldIdLst>${g.ids.map(id => `<p14:sldId id="${id}"/>`).join('')}</p14:sldIdLst></p14:section>`).join('')
        + '</p14:sectionLst></p:ext></p:extLst>';
}
const VIEW_PROPS = XML_DECL + `<p:viewPr ${ROOT_NS}><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`;
const TABLE_STYLES = XML_DECL + `<a:tblStyleLst xmlns:a="${NS.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`;

const coreXml = (title: string, now: string) => XML_DECL
    + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
    + `<dc:title>${esc(title)}</dc:title><dc:creator>YappyDraw</dc:creator><cp:lastModifiedBy>YappyDraw</cp:lastModifiedBy>`
    + `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`;

const appXml = (n: number, notes: number) => XML_DECL
    + '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
    + `<Application>YappyDraw</Application><Slides>${n}</Slides><Notes>${notes}</Notes><PresentationFormat>Custom</PresentationFormat></Properties>`;

// ── Package ─────────────────────────────────────────────────────────────────────────────────

export interface WriteOptions {
    /** ISO timestamp for docProps (injectable so tests are deterministic). */
    now?: string;
}

/**
 * Build the .pptx. The slide size is the deck size in EMU; a deck outside PowerPoint's 1″–56″
 * range is scaled uniformly into it (an 8000-px poster is legal in Yappy, not in PowerPoint).
 */
export function buildPptx(deck: Deck, opts: WriteOptions = {}): Uint8Array {
    const dw = Math.max(1, deck.width), dh = Math.max(1, deck.height);
    const longest = Math.max(dw, dh) * EMU_PER_PX, shortest = Math.min(dw, dh) * EMU_PER_PX;
    const k = longest > MAX_SLIDE_EMU ? MAX_SLIDE_EMU / longest
        : shortest < MIN_SLIDE_EMU ? Math.min(MIN_SLIDE_EMU / shortest, MAX_SLIDE_EMU / longest)
        : 1;
    const sldCx = Math.max(MIN_SLIDE_EMU, Math.min(MAX_SLIDE_EMU, Math.round(dw * k * EMU_PER_PX)));
    const sldCy = Math.max(MIN_SLIDE_EMU, Math.min(MAX_SLIDE_EMU, Math.round(dh * k * EMU_PER_PX)));

    const parts = new Map<string, string | Uint8Array>();
    const overrides: [string, string][] = [];
    const mediaExts = new Set<Media['ext']>();
    let mediaN = 0;
    const slides = deck.slides.length ? deck.slides : [{ items: [] } as Slide];
    const slideNumberOf = new Map<string, number>();
    slides.forEach((sl, i) => { if (sl.key) slideNumberOf.set(sl.key, i + 1); });

    const presRels: Rel[] = [{ id: 'rId1', type: REL.slideMaster, target: 'slideMasters/slideMaster1.xml' }];
    const hasNotes = slides.some(sl => !!sl.notes?.trim());
    let sldIds = '';
    slides.forEach((slide, i) => {
        const n = i + 1;
        const rels: Rel[] = [{ id: 'rId1', type: REL.slideLayout, target: '../slideLayouts/slideLayout1.xml' }];
        const mediaRid = new Map<Media, string>();
        const fit = slide.fit ?? { scale: 1, dx: 0, dy: 0 };
        const ctx: Ctx = {
            s: fit.scale * k, dx: fit.dx * k, dy: fit.dy * k, rels,
            slideNumber: (key) => slideNumberOf.get(key) ?? null,
            media: (m) => {
                const known = mediaRid.get(m);
                if (known) return known;
                mediaN++;
                const name = `image${mediaN}.${m.ext}`;
                parts.set(`ppt/media/${name}`, m.bytes);
                mediaExts.add(m.ext);
                const id = `rId${rels.length + 1}`;
                rels.push({ id, type: REL.image, target: `../media/${name}` });
                mediaRid.set(m, id);
                return id;
            },
        };
        parts.set(`ppt/slides/slide${n}.xml`, slideXml(slide, ctx));
        if (slide.notes?.trim()) {
            rels.push({ id: `rId${rels.length + 1}`, type: REL.notesSlide, target: `../notesSlides/notesSlide${n}.xml` });
            parts.set(`ppt/notesSlides/notesSlide${n}.xml`, notesXml(slide.notes));
            parts.set(`ppt/notesSlides/_rels/notesSlide${n}.xml.rels`, relsXml([
                { id: 'rId1', type: REL.notesMaster, target: '../notesMasters/notesMaster1.xml' },
                { id: 'rId2', type: REL.slide, target: `../slides/slide${n}.xml` },
            ]));
            overrides.push([`/ppt/notesSlides/notesSlide${n}.xml`, CT.notesSlide]);
        }
        parts.set(`ppt/slides/_rels/slide${n}.xml.rels`, relsXml(rels));
        overrides.push([`/ppt/slides/slide${n}.xml`, CT.slide]);
        const rid = `rId${n + 1}`;
        presRels.push({ id: rid, type: REL.slide, target: `slides/slide${n}.xml` });
        sldIds += `<p:sldId id="${255 + n}" r:id="${rid}"/>`;
    });
    const base = slides.length + 2;
    presRels.push(
        { id: `rId${base}`, type: REL.theme, target: 'theme/theme1.xml' },
        { id: `rId${base + 1}`, type: REL.presProps, target: 'presProps.xml' },
        { id: `rId${base + 2}`, type: REL.viewProps, target: 'viewProps.xml' },
        { id: `rId${base + 3}`, type: REL.tableStyles, target: 'tableStyles.xml' },
    );
    const notesMasterRid = `rId${base + 4}`;
    if (hasNotes) {
        presRels.push({ id: notesMasterRid, type: REL.notesMaster, target: 'notesMasters/notesMaster1.xml' });
        parts.set('ppt/notesMasters/notesMaster1.xml', NOTES_MASTER);
        parts.set('ppt/notesMasters/_rels/notesMaster1.xml.rels', relsXml([
            { id: 'rId1', type: REL.theme, target: '../theme/theme2.xml' },
        ]));
        parts.set('ppt/theme/theme2.xml', THEME);
        overrides.push(['/ppt/notesMasters/notesMaster1.xml', CT.notesMaster], ['/ppt/theme/theme2.xml', CT.theme]);
    }

    const pres = XML_DECL + `<p:presentation ${ROOT_NS} saveSubsetFonts="1">`
        + '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        + (hasNotes ? `<p:notesMasterIdLst><p:notesMasterId r:id="${notesMasterRid}"/></p:notesMasterIdLst>` : '')
        + `<p:sldIdLst>${sldIds}</p:sldIdLst>`
        + `<p:sldSz cx="${sldCx}" cy="${sldCy}"/><p:notesSz cx="6858000" cy="9144000"/>`
        + `<p:defaultTextStyle>${lvlStyle(1800)}</p:defaultTextStyle>${sectionListXml(slides, i => 256 + i)}</p:presentation>`;

    parts.set('ppt/presentation.xml', pres);
    parts.set('ppt/_rels/presentation.xml.rels', relsXml(presRels));
    parts.set('ppt/slideMasters/slideMaster1.xml', MASTER);
    parts.set('ppt/slideMasters/_rels/slideMaster1.xml.rels', relsXml([
        { id: 'rId1', type: REL.slideLayout, target: '../slideLayouts/slideLayout1.xml' },
        { id: 'rId2', type: REL.theme, target: '../theme/theme1.xml' },
    ]));
    parts.set('ppt/slideLayouts/slideLayout1.xml', LAYOUT);
    parts.set('ppt/slideLayouts/_rels/slideLayout1.xml.rels', relsXml([
        { id: 'rId1', type: REL.slideMaster, target: '../slideMasters/slideMaster1.xml' },
    ]));
    parts.set('ppt/theme/theme1.xml', THEME);
    parts.set('ppt/presProps.xml', deck.loop ? PRES_PROPS_LOOP : PRES_PROPS);
    parts.set('ppt/viewProps.xml', VIEW_PROPS);
    parts.set('ppt/tableStyles.xml', TABLE_STYLES);
    const now = opts.now ?? new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    parts.set('docProps/core.xml', coreXml(deck.title || 'YappyDraw presentation', now));
    parts.set('docProps/app.xml', appXml(slides.length, slides.filter(sl => !!sl.notes?.trim()).length));
    parts.set('_rels/.rels', relsXml([
        { id: 'rId1', type: REL.officeDocument, target: 'ppt/presentation.xml' },
        { id: 'rId2', type: REL.coreProps, target: 'docProps/core.xml' },
        { id: 'rId3', type: REL.extProps, target: 'docProps/app.xml' },
    ]));

    overrides.push(
        ['/ppt/presentation.xml', CT.presentation],
        ['/ppt/slideMasters/slideMaster1.xml', CT.slideMaster],
        ['/ppt/slideLayouts/slideLayout1.xml', CT.slideLayout],
        ['/ppt/theme/theme1.xml', CT.theme],
        ['/ppt/presProps.xml', CT.presProps],
        ['/ppt/viewProps.xml', CT.viewProps],
        ['/ppt/tableStyles.xml', CT.tableStyles],
        ['/docProps/core.xml', CT.core],
        ['/docProps/app.xml', CT.app],
    );
    const ct = XML_DECL + `<Types xmlns="${NS.ct}">`
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + [...mediaExts].map(e => `<Default Extension="${e}" ContentType="${MEDIA_CT[e]}"/>`).join('')
        + overrides.map(([p, t]) => `<Override PartName="${p}" ContentType="${t}"/>`).join('')
        + '</Types>';
    parts.set('[Content_Types].xml', ct);
    return zipPackage(parts);
}
