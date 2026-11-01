/**
 * Data charts as PowerPoint charts: the chart part (`c:chartSpace`, DrawingML charts) and the
 * workbook embedded beside it, so PowerPoint's Edit Data opens the numbers in Excel. Pure.
 *
 * Element order follows ECMA-376 (CT_ChartSpace, CT_Chart, CT_BarChart, CT_BarSer …); the part
 * layout — one chart part per chart with its own embedded workbook — is what PowerPoint writes.
 * Series and data-point colours are written explicitly, so the chart doesn't depend on the theme.
 */
import { zipSync, strToU8 } from 'fflate';
import { esc, XML_DECL } from './ooxml';
import { normalizeChart, seriesColor, SERIES_COLORS, isRound, type ChartSpec } from '../chart/chart-layout';

export const NS_C = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_SS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

/** Spreadsheet column letters: 0 → A, 25 → Z, 26 → AA. */
export function colName(i: number): string {
    let s = '';
    for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
}

const num = (v: number) => (Number.isInteger(v) ? String(v) : String(Math.round(v * 1e10) / 1e10));
const hex = (c: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c.slice(1).toUpperCase() : /^#[0-9a-f]{3}$/i.test(c) ? c.slice(1).split('').map(x => x + x).join('').toUpperCase() : '4472C4');
const solid = (c: string) => `<c:spPr><a:solidFill><a:srgbClr val="${hex(c)}"/></a:solidFill></c:spPr>`;
const line = (c: string, w = 28575) => `<c:spPr><a:ln w="${w}" cap="rnd"><a:solidFill><a:srgbClr val="${hex(c)}"/></a:solidFill><a:round/></a:ln></c:spPr>`;

function strRef(f: string, vals: string[]): string {
    return `<c:strRef><c:f>${esc(f)}</c:f><c:strCache><c:ptCount val="${vals.length}"/>`
        + vals.map((v, i) => `<c:pt idx="${i}"><c:v>${esc(v)}</c:v></c:pt>`).join('') + '</c:strCache></c:strRef>';
}

function numRef(f: string, vals: (number | null)[]): string {
    return `<c:numRef><c:f>${esc(f)}</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="${vals.length}"/>`
        + vals.map((v, i) => (v === null ? '' : `<c:pt idx="${i}"><c:v>${num(v)}</c:v></c:pt>`)).join('') + '</c:numCache></c:numRef>';
}

const dLbls = (round: boolean) => `<c:dLbls><c:showLegendKey val="0"/><c:showVal val="${round ? 0 : 1}"/><c:showCatName val="0"/>`
    + `<c:showSerName val="0"/><c:showPercent val="${round ? 1 : 0}"/><c:showBubbleSize val="0"/></c:dLbls>`;

/** The chart part for a spec. */
export function chartXml(raw: ChartSpec): string {
    const spec = normalizeChart(raw);
    const n = spec.categories.length;
    const last = n + 1;
    const round = isRound(spec.kind);
    const series = round ? spec.series.slice(0, 1) : spec.series;
    const cat = `<c:cat>${strRef(`Sheet1!$A$2:$A$${last}`, spec.categories)}</c:cat>`;
    const ser = series.map((s, i) => {
        const col = colName(i + 1);
        const color = seriesColor(spec, i);
        const head = `<c:idx val="${i}"/><c:order val="${i}"/><c:tx>${strRef(`Sheet1!$${col}$1`, [s.name])}</c:tx>`;
        const val = `<c:val>${numRef(`Sheet1!$${col}$2:$${col}$${last}`, s.values)}</c:val>`;
        switch (spec.kind) {
            case 'line':
                return `<c:ser>${head}${line(color)}<c:marker><c:symbol val="circle"/><c:size val="5"/>${solid(color)}</c:marker>${cat}${val}<c:smooth val="0"/></c:ser>`;
            case 'area':
                return `<c:ser>${head}${solid(color)}${cat}${val}</c:ser>`;
            case 'pie': case 'doughnut': {
                const points = spec.categories.map((_, k) => `<c:dPt><c:idx val="${k}"/><c:bubble3D val="0"/>`
                    + `<c:spPr><a:solidFill><a:srgbClr val="${hex(SERIES_COLORS[k % SERIES_COLORS.length])}"/></a:solidFill><a:ln w="19050"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></c:spPr></c:dPt>`).join('');
                return `<c:ser>${head}${points}${cat}${val}</c:ser>`;
            }
            default:
                return `<c:ser>${head}${solid(color)}<c:invertIfNegative val="0"/>${cat}${val}</c:ser>`;
        }
    }).join('');
    const labels = spec.dataLabels ? dLbls(round) : '';
    const axIds = '<c:axId val="500000001"/><c:axId val="500000002"/>';
    let plot: string;
    switch (spec.kind) {
        case 'column': case 'bar':
            plot = `<c:barChart><c:barDir val="${spec.kind === 'bar' ? 'bar' : 'col'}"/><c:grouping val="${spec.stacked ? 'stacked' : 'clustered'}"/><c:varyColors val="0"/>`
                + `${ser}${labels}<c:gapWidth val="${spec.stacked ? 60 : 150}"/>${spec.stacked ? '<c:overlap val="100"/>' : ''}${axIds}</c:barChart>`;
            break;
        case 'line':
            plot = `<c:lineChart><c:grouping val="${spec.stacked ? 'stacked' : 'standard'}"/><c:varyColors val="0"/>${ser}${labels}<c:marker val="1"/>${axIds}</c:lineChart>`;
            break;
        case 'area':
            plot = `<c:areaChart><c:grouping val="${spec.stacked ? 'stacked' : 'standard'}"/><c:varyColors val="0"/>${ser}${labels}${axIds}</c:areaChart>`;
            break;
        case 'pie':
            plot = `<c:pieChart><c:varyColors val="1"/>${ser}${labels}<c:firstSliceAng val="0"/></c:pieChart>`;
            break;
        default:
            plot = `<c:doughnutChart><c:varyColors val="1"/>${ser}${labels}<c:firstSliceAng val="0"/><c:holeSize val="50"/></c:doughnutChart>`;
    }
    const horizontal = spec.kind === 'bar';
    const axisText = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"><a:solidFill><a:srgbClr val="595959"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>';
    const axisLine = '<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>';
    const axes = round ? '' :
        `<c:catAx><c:axId val="500000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'l' : 'b'}"/>`
        + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${axisLine}${axisText}`
        + `<c:crossAx val="500000002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`
        + `<c:valAx><c:axId val="500000002"/><c:scaling><c:orientation val="minMax"/>`
        + (spec.yMax !== undefined ? `<c:max val="${num(spec.yMax)}"/>` : '') + (spec.yMin !== undefined ? `<c:min val="${num(spec.yMin)}"/>` : '')
        + `</c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'b' : 'l'}"/>`
        + (spec.gridlines !== false ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : '')
        + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>`
        + `<c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${axisText}<c:crossAx val="500000001"/><c:crosses val="autoZero"/><c:crossBetween val="${spec.kind === 'area' ? 'midCat' : 'between'}"/></c:valAx>`;
    const title = spec.title
        ? `<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1800" b="1"/></a:pPr><a:r><a:rPr lang="en-US" sz="1800" b="1"/><a:t>${esc(spec.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`
        : '<c:autoTitleDeleted val="1"/>';
    const legendPos = { right: 'r', bottom: 'b', top: 't' }[spec.legend as 'right' | 'bottom' | 'top'];
    const legend = legendPos ? `<c:legend><c:legendPos val="${legendPos}"/><c:overlay val="0"/>${axisText}</c:legend>` : '';
    return XML_DECL + `<c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><c:date1904 val="0"/><c:roundedCorners val="0"/>`
        + `<c:chart>${title}<c:plotArea><c:layout/>${plot}${axes}</c:plotArea>${legend}<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart>`
        + '<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>'
        + '<c:externalData r:id="rId1"><c:autoUpdate val="0"/></c:externalData></c:chartSpace>';
}

/** The chart's data as a minimal workbook: categories down column A, a column per series. */
export function chartWorkbook(raw: ChartSpec): Uint8Array {
    const spec = normalizeChart(raw);
    const series = isRound(spec.kind) ? spec.series.slice(0, 1) : spec.series;
    const strCell = (ref: string, v: string) => `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
    const rows = [
        `<row r="1">${strCell('A1', '')}${series.map((s, j) => strCell(`${colName(j + 1)}1`, s.name)).join('')}</row>`,
        ...spec.categories.map((c, i) => `<row r="${i + 2}">${strCell(`A${i + 2}`, c)}`
            + series.map((s, j) => (s.values[i] === null ? '' : `<c r="${colName(j + 1)}${i + 2}"><v>${num(s.values[i]!)}</v></c>`)).join('') + '</row>'),
    ];
    const files: Record<string, string> = {
        '[Content_Types].xml': XML_DECL + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
            + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        '_rels/.rels': XML_DECL + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        'xl/workbook.xml': XML_DECL + `<workbook xmlns="${NS_SS}" xmlns:r="${NS_R}"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
        'xl/_rels/workbook.xml.rels': XML_DECL + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        'xl/worksheets/sheet1.xml': XML_DECL + `<worksheet xmlns="${NS_SS}"><sheetData>${rows.join('')}</sheetData></worksheet>`,
    };
    return zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])));
}
