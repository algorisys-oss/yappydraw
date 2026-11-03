import { getFontString, getMeasurementContext } from "./text-utils";

/**
 * Layout of a UML combined fragment's pentagon tab, sized to fit its operator ("alt",
 * "loop", "par" …). The operator is drawn smaller than the shape's font so the tab stays
 * a corner tag rather than a header.
 *
 * Shared by the renderer (which draws the tab, the operator in it and the guard under
 * it) and the double-click handler (which edits the operator when the click lands in the
 * tab, the guard otherwise) — the two must agree on where the tab is.
 */
export function umlFragmentLayout(el: { width: number; height: number; fontSize?: number; containerText?: string; fontFamily?: any }): { tabW: number; tabH: number; fontSize: number } {
    const w = el.width, h = el.height;
    const fontSize = Math.max(10, Math.min(el.fontSize || 16, 16));
    const op = String(el.containerText || '').split('\n')[0];
    let textW = 0;
    if (op) {
        const ctx = getMeasurementContext();
        ctx.font = getFontString({ ...(el as any), fontSize });
        textW = ctx.measureText(op).width;
    }
    const tabW = Math.min(w * 0.9, Math.max(Math.min(w * 0.3, 60), textW + 20));
    const tabH = Math.min(h * 0.4, Math.max(Math.min(h * 0.12, 22), fontSize * 1.3));
    return { tabW, tabH, fontSize };
}
