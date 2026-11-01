/**
 * Alt text in PDF exports. Kept apart from pdf-vector.ts so the raster PDF path (in the main
 * export module) can use it without pulling the vector/CMYK machinery into the main bundle.
 */
import type { jsPDF as JsPdf } from 'jspdf';

export interface PdfAltText { x: number; y: number; w: number; h: number; text: string }

/** The alt text of the objects that have one (decorative objects have none to read), top to bottom. */
export const altTextsOf = (els: { x: number; y: number; width: number; height: number; altText?: string; decorative?: boolean }[]): PdfAltText[] =>
    els.filter(el => !el.decorative && el.altText?.trim())
        .map(el => ({ x: Math.min(el.x, el.x + el.width), y: Math.min(el.y, el.y + el.height), w: Math.abs(el.width), h: Math.abs(el.height), text: el.altText!.trim() }))
        .sort((a, b) => (Math.abs(a.y - b.y) < 12 ? a.x - b.x : a.y - b.y));

/**
 * Alt text into a PDF page: invisible text (rendering mode 3) over each object — the technique
 * scanned-document text layers use. jsPDF can't write a tagged PDF (a structure tree with /Alt),
 * so this is how the description reaches screen readers, search and copy in an untagged PDF.
 * `ox/oy` is the page's top-left in canvas coordinates. The standard font covers Latin text.
 */
export const writeAltTexts = (pdf: JsPdf, items: PdfAltText[] | undefined, ox: number, oy: number) => {
    if (!items?.length) return;
    pdf.setFont('helvetica', 'normal');
    for (const a of items) {
        const size = Math.max(6, Math.min(14, a.h / 3));
        pdf.setFontSize(size);
        pdf.text(a.text, a.x - ox, a.y - oy + size, { renderingMode: 'invisible', maxWidth: Math.max(20, a.w) } as any);
    }
};
