/**
 * Shrink text on overflow (`textFit: 'shrink'`, PowerPoint's "Shrink text on overflow"): when the
 * text doesn't fit its box at its own size, draw it at the largest scale that does, down to
 * MIN_SCALE. The stored sizes never change, so the text grows back as it gets shorter or the box
 * gets bigger, and the renderers just draw a scaled copy of the element (`fittedElement`).
 *
 * Each kind of text is measured the way its renderer lays it out: a text box (plain or rich) in
 * its width less 4px padding a side, a shape's label (plain or rich) in the label width less 10px.
 */
import type { DrawingElement, RichTextSpan } from '../types';
import type { IRenderer } from '../rendering/IRenderer';
import { wrapText, measureContainerText, containerTextAvailableWidth, resolveFontFamily } from './text-utils';
import { layoutRichText } from './rich-text-utils';
import { lineHeightPx } from './text-line-height';
import { fontShorthand } from './font-variants';

export const MIN_SCALE = 0.25;

/** Text boxes and shape labels draw at different default sizes. */
const DEFAULT_SIZE = { text: 20, label: 28, richLabel: 28 } as const;
export type FitKind = 'text' | 'label';

const scaleSpans = (spans: RichTextSpan[] | undefined, s: number) =>
    spans?.map(sp => (sp.fontSize ? { ...sp, fontSize: sp.fontSize * s } : sp));

/** `el` with every font size (its own and its spans') times `s`. */
export function withTextScale(el: DrawingElement, s: number, kind: FitKind): DrawingElement {
    if (s >= 1) return el;
    const base = el.fontSize || (kind === 'text' ? DEFAULT_SIZE.text : DEFAULT_SIZE.label);
    return {
        ...el,
        fontSize: base * s,
        ...(el.richText && { richText: scaleSpans(el.richText, s) }),
        ...(el.richContainerText && { richContainerText: scaleSpans(el.richContainerText, s) }),
        ...(el.letterSpacing && { letterSpacing: el.letterSpacing * s }),
    };
}

/** How tall the text is when drawn as `el` (already scaled), and the room it has. */
function measure(renderer: IRenderer, el: DrawingElement, kind: FitKind): { need: number; room: number } {
    if (kind === 'text') {
        const pad = 4;
        const width = Math.max(el.width - pad * 2, 20);
        const room = el.height - pad * 2;
        if (el.richText && el.richText.length) {
            const layout = layoutRichText(renderer, el.richText, width,
                { fontSize: el.fontSize || DEFAULT_SIZE.text, fontFamily: el.fontFamily || 'sans-serif', lineHeight: el.lineHeight });
            return { need: layout.totalHeight, room };
        }
        const size = el.fontSize || DEFAULT_SIZE.text;
        renderer.save();
        renderer.font = fontShorthand(el.fontWeight, el.fontStyle, size, resolveFontFamily(el.fontFamily), el.fontStretch);
        renderer.letterSpacing = el.letterSpacing ? `${el.letterSpacing}px` : '0px';
        const lines = (el.text || '').split('\n').flatMap(p => (p === '' ? [''] : wrapText(renderer, p, width)));
        renderer.restore();
        return { need: lines.length ? (lines.length - 1) * lineHeightPx(size, el) + size : 0, room };
    }
    const room = el.height - 20;
    if (el.richContainerText && el.richContainerText.length) {
        const layout = layoutRichText(renderer, el.richContainerText, el.width - 20,
            { fontSize: el.fontSize || DEFAULT_SIZE.richLabel, fontFamily: el.fontFamily || 'hand-drawn', lineHeight: el.lineHeight });
        return { need: layout.totalHeight, room };
    }
    const text = el.containerText || el.text || '';
    return { need: measureContainerText(renderer, el, text, containerTextAvailableWidth(el)).textHeight, room };
}

const cache = new Map<string, number>();
const keyOf = (el: DrawingElement, kind: FitKind) => JSON.stringify([kind, el.type, el.width, el.height, el.fontSize, el.fontFamily,
    el.fontWeight, el.fontStyle, el.fontStretch, el.letterSpacing, el.lineHeight,
    kind === 'text' ? [el.text, el.richText] : [el.containerText ?? el.text, el.richContainerText]]);

/** The scale (MIN_SCALE…1) at which `el`'s text fits its box; 1 when it already fits. */
export function fitScale(renderer: IRenderer, el: DrawingElement, kind: FitKind): number {
    if (el.textFit !== 'shrink' || !(el.height > 0) || !(el.width > 0)) return 1;
    const key = keyOf(el, kind);
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    const fits = (s: number) => { const m = measure(renderer, withTextScale(el, s, kind), kind); return m.need <= m.room + 0.5; };
    let s = 1;
    if (!fits(1)) {
        // Wrapping makes height a step function of the size: bisect to 1 % rather than solve.
        let lo = MIN_SCALE, hi = 1;
        if (!fits(lo)) s = lo;
        else {
            while (hi - lo > 0.01) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
            s = lo;
        }
    }
    if (cache.size > 2000) cache.clear();
    cache.set(key, s);
    return s;
}

/** The element as it should be drawn: scaled down to fit when `textFit` asks for it. */
export const fittedElement = (renderer: IRenderer, el: DrawingElement, kind: FitKind): DrawingElement =>
    el.textFit === 'shrink' ? withTextScale(el, fitScale(renderer, el, kind), kind) : el;
