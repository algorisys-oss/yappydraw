/**
 * Which "My Drawings" gallery entry the live document belongs to.
 *
 * Its own module, rather than living in `drawings-store`, so `app-store` can
 * clear it when a document is replaced. `drawings-store` imports `app-store`
 * (for `loadDocument`), so the dependency can only run the other way through a
 * leaf like this one.
 *
 * The invariant it exists to protect: loading or resetting a document DETACHES
 * from the gallery entry, and only `openDrawing` re-attaches. Without that, a
 * File → New kept pointing at the last saved drawing, and the next save
 * overwrote and renamed that entry instead of creating a new one — so the
 * gallery only ever held the most recent drawing.
 */

import { createSignal } from 'solid-js';

const ACTIVE_KEY = 'yappy:drawings:active';

function readActive(): string | null {
    try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; }
}

const [activeDrawingId, _setActiveDrawingId] = createSignal<string | null>(readActive());
export { activeDrawingId };

export function setActiveDrawingId(id: string | null): void {
    _setActiveDrawingId(id);
    try {
        if (id) localStorage.setItem(ACTIVE_KEY, id);
        else localStorage.removeItem(ACTIVE_KEY);
    } catch { /* ignore */ }
}
