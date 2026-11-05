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
import { normalizeChart, seriesColor, SERIES_COLORS, isRound, isXY, xValue, canCombine, seriesKind, onSecondary, type ChartSpec, type ChartKind } from '../chart/chart-layout';

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

/**
 * The spec as it is written: a stock chart PowerPoint can't open (it needs 3 or 4 series — high,
 * low, close, with open first) goes as a line chart; pies keep their first series.
 */
function writable(raw: ChartSpec): ChartSpec {
    const spec = normalizeChart(raw);
    if (spec.kind === 'stock' && spec.series.length !== 3 && spec.series.length !== 4) spec.kind = 'line';
    if (isRound(spec.kind)) spec.series = spec.series.slice(0, 1);
    return spec;
}

/** Workbook column of series `i`'s values (and, for bubbles, its sizes in the next column). */
const valueCol = (spec: ChartSpec, i: number) => colName(spec.kind === 'bubble' ? 1 + i * 2 : 1 + i);
/** Every category is a number: the X column is written as numbers, else as text (PowerPoint numbers the points). */
const numericX = (spec: ChartSpec) => isXY(spec.kind) && spec.categories.length > 0 && spec.categories.every(c => xValue(c) !== null);

/** The chart part for a spec. */
export function chartXml(raw: ChartSpec): string {
    const spec = writable(raw);
    const n = spec.categories.length;
    const last = n + 1;
    const round = isRound(spec.kind);
    const series = spec.series;
    const catRange = `Sheet1!$A$2:$A$${last}`;
    const cat = `<c:cat>${strRef(catRange, spec.categories)}</c:cat>`;
    const xVal = `<c:xVal>${numericX(spec) ? numRef(catRange, spec.categories.map(xValue)) : strRef(catRange, spec.categories)}</c:xVal>`;
    const noLine = '<c:spPr><a:ln w="19050"><a:noFill/></a:ln></c:spPr>';
    const serXml = series.map((s, i) => {
        const col = valueCol(spec, i);
        const color = seriesColor(spec, i);
        const head = `<c:idx val="${i}"/><c:order val="${i}"/><c:tx>${strRef(`Sheet1!$${col}$1`, [s.name])}</c:tx>`;
        const val = `<c:val>${numRef(`Sheet1!$${col}$2:$${col}$${last}`, s.values)}</c:val>`;
        const marker = (size = 5) => `<c:marker><c:symbol val="circle"/><c:size val="${size}"/>${solid(color)}</c:marker>`;
        switch (seriesKind(spec, s)) {
            case 'scatter':
                return `<c:ser>${head}${spec.lines ? line(color) : noLine}${marker(7)}${xVal}`
                    + `<c:yVal>${numRef(`Sheet1!$${col}$2:$${col}$${last}`, s.values)}</c:yVal><c:smooth val="${spec.smooth && spec.lines ? 1 : 0}"/></c:ser>`;
            case 'bubble': {
                const sc = colName(2 + i * 2);
                return `<c:ser>${head}${solid(color)}<c:invertIfNegative val="0"/>${xVal}`
                    + `<c:yVal>${numRef(`Sheet1!$${col}$2:$${col}$${last}`, s.values)}</c:yVal>`
                    + `<c:bubbleSize>${numRef(`Sheet1!$${sc}$2:$${sc}$${last}`, s.sizes ?? s.values.map(() => null))}</c:bubbleSize><c:bubble3D val="0"/></c:ser>`;
            }
            case 'radar':
                return `<c:ser>${head}${line(color)}${marker()}${cat}${val}</c:ser>`;
            case 'filledRadar':
                return `<c:ser>${head}${solid(color)}<c:marker><c:symbol val="none"/></c:marker>${cat}${val}</c:ser>`;
            case 'stock': {
                // The series draw nothing themselves: the high-low lines and up/down bars are the
                // chart. With high-low-close, the close shows as a dash.
                const close = series.length === 3 && i === 2;
                return `<c:ser>${head}${noLine}<c:marker><c:symbol val="${close ? 'dash' : 'none'}"/>`
                    + `${close ? `<c:size val="7"/>${solid(color)}` : ''}</c:marker>${cat}${val}<c:smooth val="0"/></c:ser>`;
            }
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
    });
    const ser = serXml.join('');
    const labels = spec.dataLabels ? dLbls(round) : '';
    const axIds = '<c:axId val="500000001"/><c:axId val="500000002"/>';
    // Column, bar, line and area plot groups: `stacked` for the chart's own type (only its series
    // stack in a combination chart), and the axis pair the group is measured on.
    const group = (kind: ChartKind, sers: string, stack: boolean, ids: string) => {
        const grouping = (base: string) => (stack ? (spec.percent ? 'percentStacked' : 'stacked') : base);
        switch (kind) {
            case 'line':
                return `<c:lineChart><c:grouping val="${grouping('standard')}"/><c:varyColors val="0"/>${sers}${labels}<c:marker val="1"/>${ids}</c:lineChart>`;
            case 'area':
                return `<c:areaChart><c:grouping val="${grouping('standard')}"/><c:varyColors val="0"/>${sers}${labels}${ids}</c:areaChart>`;
            default:
                return `<c:barChart><c:barDir val="${kind === 'bar' ? 'bar' : 'col'}"/><c:grouping val="${grouping('clustered')}"/><c:varyColors val="0"/>`
                    + `${sers}${labels}<c:gapWidth val="${stack ? 60 : 150}"/>${stack ? '<c:overlap val="100"/>' : ''}${ids}</c:barChart>`;
        }
    };
    const secondaryIds = '<c:axId val="500000003"/><c:axId val="500000004"/>';
    const dual = canCombine(spec.kind) && series.some(x => onSecondary(spec, x));
    let plot: string;
    switch (spec.kind) {
        case 'column': case 'bar': case 'line': case 'area': {
            // A group per type and axis, the chart's own type first, series keeping their order and indices.
            const keys: string[] = [];
            const members = new Map<string, number[]>();
            const keyOf = (i: number) => `${seriesKind(spec, series[i])}|${onSecondary(spec, series[i]) ? 1 : 0}`;
            for (const k of [`${spec.kind}|0`, ...series.map((_, i) => keyOf(i))]) if (!keys.includes(k)) keys.push(k);
            series.forEach((_, i) => { const k = keyOf(i); members.set(k, [...(members.get(k) ?? []), i]); });
            plot = keys.filter(k => members.has(k)).map(k => {
                const [kind, axis] = k.split('|');
                return group(kind as ChartKind, members.get(k)!.map(i => serXml[i]).join(''), !!spec.stacked && kind === spec.kind, axis === '1' ? secondaryIds : axIds);
            }).join('');
            break;
        }
        case 'pie':
            plot = `<c:pieChart><c:varyColors val="1"/>${ser}${labels}<c:firstSliceAng val="0"/></c:pieChart>`;
            break;
        case 'scatter':
            plot = `<c:scatterChart><c:scatterStyle val="lineMarker"/><c:varyColors val="0"/>${ser}${labels}${axIds}</c:scatterChart>`;
            break;
        case 'bubble':
            plot = `<c:bubbleChart><c:varyColors val="0"/>${ser}${labels}<c:bubbleScale val="100"/><c:showNegBubbles val="0"/>${axIds}</c:bubbleChart>`;
            break;
        case 'radar': case 'filledRadar':
            plot = `<c:radarChart><c:radarStyle val="${spec.kind === 'filledRadar' ? 'filled' : 'marker'}"/><c:varyColors val="0"/>${ser}${labels}${axIds}</c:radarChart>`;
            break;
        case 'stock': {
            const inkLine = '<a:ln w="9525"><a:solidFill><a:srgbClr val="404040"/></a:solidFill></a:ln>';
            const bars = series.length === 4
                ? `<c:upDownBars><c:gapWidth val="150"/><c:upBars><c:spPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>${inkLine}</c:spPr></c:upBars>`
                    + `<c:downBars><c:spPr><a:solidFill><a:srgbClr val="404040"/></a:solidFill>${inkLine}</c:spPr></c:downBars></c:upDownBars>`
                : '';
            plot = `<c:stockChart>${ser}${labels}<c:hiLowLines><c:spPr>${inkLine}</c:spPr></c:hiLowLines>${bars}${axIds}</c:stockChart>`;
            break;
        }
        default:
            plot = `<c:doughnutChart><c:varyColors val="1"/>${ser}${labels}<c:firstSliceAng val="0"/><c:holeSize val="50"/></c:doughnutChart>`;
    }
    const horizontal = spec.kind === 'bar';
    const axisText = '<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1200"><a:solidFill><a:srgbClr val="595959"/></a:solidFill></a:defRPr></a:pPr><a:endParaRPr lang="en-US"/></a:p></c:txPr>';
    const axisLine = '<c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="BFBFBF"/></a:solidFill></a:ln></c:spPr>';
    // Scatter and bubble: X is a value axis too (along the bottom), and only Y takes the range.
    const valAxis = (id: number, cross: number, pos: string, grid: boolean, range: boolean) =>
        `<c:valAx><c:axId val="${id}"/><c:scaling><c:orientation val="minMax"/>`
        + (range && spec.yMax !== undefined ? `<c:max val="${num(spec.yMax)}"/>` : '') + (range && spec.yMin !== undefined ? `<c:min val="${num(spec.yMin)}"/>` : '')
        + `</c:scaling><c:delete val="0"/><c:axPos val="${pos}"/>`
        + (grid ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : '')
        + '<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>'
        + `${axisLine}${axisText}<c:crossAx val="${cross}"/><c:crosses val="autoZero"/><c:crossBetween val="midCat"/></c:valAx>`;
    const axes = round ? '' : isXY(spec.kind)
        ? valAxis(500000001, 500000002, 'b', false, false) + valAxis(500000002, 500000001, 'l', spec.gridlines !== false, true)
        : `<c:catAx><c:axId val="500000001"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'l' : 'b'}"/>`
        + `<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${axisLine}${axisText}`
        + `<c:crossAx val="500000002"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`
        + `<c:valAx><c:axId val="500000002"/><c:scaling><c:orientation val="minMax"/>`
        + (spec.yMax !== undefined ? `<c:max val="${num(spec.yMax)}"/>` : '') + (spec.yMin !== undefined ? `<c:min val="${num(spec.yMin)}"/>` : '')
        + `</c:scaling><c:delete val="0"/><c:axPos val="${horizontal ? 'b' : 'l'}"/>`
        + (spec.gridlines !== false ? '<c:majorGridlines><c:spPr><a:ln w="9525"><a:solidFill><a:srgbClr val="E5E7EB"/></a:solidFill></a:ln></c:spPr></c:majorGridlines>' : '')
        + `<c:numFmt formatCode="${spec.percent ? '0%' : 'General'}" sourceLinked="${spec.percent ? 0 : 1}"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>`
        + `<c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${axisText}<c:crossAx val="500000001"/><c:crosses val="autoZero"/><c:crossBetween val="${spec.kind === 'area' ? 'midCat' : 'between'}"/></c:valAx>`
        // The secondary axis pair: a hidden category axis, and a value axis on the right.
        + (dual ? '<c:catAx><c:axId val="500000003"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="1"/><c:axPos val="b"/>'
            + '<c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="500000004"/><c:crosses val="autoZero"/>'
            + '<c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>'
            + '<c:valAx><c:axId val="500000004"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="r"/>'
            + '<c:numFmt formatCode="General" sourceLinked="1"/><c:majorTickMark val="none"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>'
            + `<c:spPr><a:ln><a:noFill/></a:ln></c:spPr>${axisText}<c:crossAx val="500000003"/><c:crosses val="max"/><c:crossBetween val="between"/></c:valAx>` : '');
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
    const spec = writable(raw);
    const series = spec.series;
    const bubble = spec.kind === 'bubble';
    const xNum = numericX(spec);
    const strCell = (ref: string, v: string) => `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
    const numCell = (ref: string, v: number | null | undefined) => (v === null || v === undefined ? '' : `<c r="${ref}"><v>${num(v)}</v></c>`);
    const rows = [
        `<row r="1">${strCell('A1', isXY(spec.kind) ? 'X' : '')}${series.map((s, j) => strCell(`${valueCol(spec, j)}1`, s.name)
            + (bubble ? strCell(`${colName(2 + j * 2)}1`, `${s.name} size`) : '')).join('')}</row>`,
        ...spec.categories.map((c, i) => `<row r="${i + 2}">${xNum ? numCell(`A${i + 2}`, xValue(c)) : strCell(`A${i + 2}`, c)}`
            + series.map((s, j) => numCell(`${valueCol(spec, j)}${i + 2}`, s.values[i])
                + (bubble ? numCell(`${colName(2 + j * 2)}${i + 2}`, s.sizes?.[i]) : '')).join('') + '</row>'),
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
