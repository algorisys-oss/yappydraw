/**
 * Text fields: a text box whose text starts with `=` fills in
 *   ${slideNumber}  the slide it is shown on, from 1
 *   ${totalSlides}  how many slides the deck has
 *   ${date}         today's date, in the reader's own format (e.g. "1 November 2026")
 * Text starting `==` shows a literal `=`. Anything else is shown as typed.
 *
 * One resolver for the canvas, thumbnails, recordings and every export, so "Page 3 of 10" reads
 * the same everywhere. Pure, so it unit-tests under bun.
 */

export interface FieldContext {
    slideNumber: number;   // 1-based
    totalSlides: number;
    date?: Date;           // defaults to now
}

export const hasFields = (text: unknown): text is string => typeof text === 'string' && text.startsWith('=');

export function formatFieldDate(d: Date): string {
    try {
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return d.toDateString();
    }
}

/** The text as it should show on that slide. Text without a leading `=` comes back unchanged. */
export function resolveFieldText(text: string, ctx: FieldContext): string {
    if (!hasFields(text)) return text;
    if (text.startsWith('==')) return text.substring(1);
    return text.substring(1)
        .replace(/\$\{slideNumber\}/g, String(ctx.slideNumber))
        .replace(/\$\{totalSlides\}/g, String(ctx.totalSlides))
        .replace(/\$\{date\}/g, () => formatFieldDate(ctx.date ?? new Date()));
}
