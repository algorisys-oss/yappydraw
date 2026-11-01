/**
 * PowerPoint's built-in table styles, for files that name one without defining it. PowerPoint
 * writes the definition of every style a deck uses into `ppt/tableStyles.xml`, but other writers
 * (python-pptx, LibreOffice, hand-edited files) often only set `a:tableStyleId`, and the table
 * then came in plain.
 *
 * Each family is one definition in which only the colour changes, written here as PowerPoint
 * writes it, in theme colours, and read by the same code as a definition found in the file.
 * Only styles whose definition was checked against PowerPoint-written files (LibreOffice's test
 * corpus) are listed; an unknown id still comes in plain.
 */

const ln = (w: number, clr: string) => `<a:ln w="${w}" cmpd="sng"><a:solidFill><a:schemeClr val="${clr}"/></a:solidFill></a:ln>`;
const none = '<a:ln><a:noFill/></a:ln>';
const fill = (clr: string, mod = '') => `<a:fill><a:solidFill><a:schemeClr val="${clr}">${mod}</a:schemeClr></a:solidFill></a:fill>`;
const txt = (clr: string, bold = false) => `<a:tcTxStyle${bold ? ' b="on"' : ''}><a:fontRef idx="minor"><a:prstClr val="black"/></a:fontRef><a:schemeClr val="${clr}"/></a:tcTxStyle>`;
const bdr = (sides: Record<string, string>) => `<a:tcBdr>${Object.entries(sides).map(([k, v]) => `<a:${k}>${v}</a:${k}>`).join('')}</a:tcBdr>`;

/** Medium Style 2: tinted body with banding, solid header and edge rows/columns, white rules. */
function mediumStyle2(id: string, c: string): string {
    const white = ln(12700, 'lt1');
    const edge = `${txt('lt1', true)}<a:tcStyle><a:tcBdr/>${fill(c)}</a:tcStyle>`;
    return `<a:tblStyle styleId="${id}" styleName="Medium Style 2">`
        + `<a:wholeTbl>${txt('dk1')}<a:tcStyle>${bdr({ left: white, right: white, top: white, bottom: white, insideH: white, insideV: white })}${fill(c, '<a:tint val="20000"/>')}</a:tcStyle></a:wholeTbl>`
        + `<a:band1H><a:tcStyle><a:tcBdr/>${fill(c, '<a:tint val="40000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H>`
        + `<a:band1V><a:tcStyle><a:tcBdr/>${fill(c, '<a:tint val="40000"/>')}</a:tcStyle></a:band1V><a:band2V><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2V>`
        + `<a:lastCol>${edge}</a:lastCol><a:firstCol>${edge}</a:firstCol>`
        + `<a:lastRow>${txt('lt1', true)}<a:tcStyle>${bdr({ top: ln(38100, 'lt1') })}${fill(c)}</a:tcStyle></a:lastRow>`
        + `<a:firstRow>${txt('lt1', true)}<a:tcStyle>${bdr({ bottom: ln(38100, 'lt1') })}${fill(c)}</a:tcStyle></a:firstRow>`
        + '</a:tblStyle>';
}

/** Light Style 1: rules above and below the table and under the header, a light band, bold edges. */
function lightStyle1(id: string, c: string): string {
    const rule = ln(12700, c);
    return `<a:tblStyle styleId="${id}" styleName="Light Style 1">`
        + `<a:wholeTbl>${txt('tx1')}<a:tcStyle>${bdr({ left: none, right: none, top: rule, bottom: rule, insideH: none, insideV: none })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl>`
        + `<a:band1H><a:tcStyle><a:tcBdr/>${fill(c, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1H><a:band2H><a:tcStyle><a:tcBdr/></a:tcStyle></a:band2H>`
        + `<a:band1V><a:tcStyle><a:tcBdr/>${fill(c, '<a:alpha val="20000"/>')}</a:tcStyle></a:band1V>`
        + `<a:lastCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:lastCol><a:firstCol><a:tcTxStyle b="on"/><a:tcStyle><a:tcBdr/></a:tcStyle></a:firstCol>`
        + `<a:lastRow><a:tcTxStyle b="on"/><a:tcStyle>${bdr({ top: rule })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:lastRow>`
        + `<a:firstRow><a:tcTxStyle b="on"/><a:tcStyle>${bdr({ bottom: rule })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:firstRow>`
        + '</a:tblStyle>';
}

/** No Style, Table Grid: thin lines in the text colour on every edge, no fill. */
function tableGrid(id: string): string {
    const l = ln(12700, 'tx1');
    return `<a:tblStyle styleId="${id}" styleName="No Style, Table Grid"><a:wholeTbl>${txt('tx1')}<a:tcStyle>`
        + `${bdr({ left: l, right: l, top: l, bottom: l, insideH: l, insideV: l })}<a:fill><a:noFill/></a:fill></a:tcStyle></a:wholeTbl></a:tblStyle>`;
}

const STYLES: Record<string, (id: string) => string> = {
    '{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}': id => mediumStyle2(id, 'dk1'),
    '{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}': id => mediumStyle2(id, 'accent1'),
    '{21E4AEA4-8DFA-4A89-87EB-49C32662AFE0}': id => mediumStyle2(id, 'accent2'),
    '{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}': id => mediumStyle2(id, 'accent3'),
    '{7DF18680-E054-41AD-8BC1-D1AEF772440D}': id => mediumStyle2(id, 'accent5'),
    '{9D7B26C5-4107-4FEC-AEDC-1716B250A1EF}': id => lightStyle1(id, 'tx1'),
    '{3B4B98B0-60AC-42C2-AFA5-B58CD77FA1E5}': id => lightStyle1(id, 'accent1'),
    '{0E3FDE45-AF77-4B5C-9715-49D594BDF05E}': id => lightStyle1(id, 'accent2'),
    '{C083E6E3-FA7D-4D7B-A595-EF9225AFEA82}': id => lightStyle1(id, 'accent3'),
    '{5940675A-B579-460E-94D1-54222C63F5DA}': tableGrid,
};

const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

/** The built-in definition of a table style id, as a `tblStyleLst` document; null if unknown. */
export function builtinTableStyleXml(id: string): string | null {
    const make = STYLES[id.toUpperCase()];
    return make ? `<a:tblStyleLst xmlns:a="${NS_A}">${make(id.toUpperCase())}</a:tblStyleLst>` : null;
}
