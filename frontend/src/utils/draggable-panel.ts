import { dockInsets } from './dock-layout';

/**
 * Make a floating panel draggable by a handle (its header). Uses event
 * delegation — the pointerdown listener lives on the panel and a drag only
 * starts when the press lands inside an element matching `handleSelector` — so
 * it keeps working even if the header re-renders. On the first drag the panel
 * switches from edge-anchored (bottom/right) to free top/left positioning and
 * follows the pointer, clamped to stay on screen. Move/up listeners are added
 * only during a drag and removed on release; the panel's own pointerdown
 * listener is GC'd with the element on unmount — nothing leaks.
 */
export function makeDraggable(panel: HTMLElement, handleSelector: string): void {
    panel.addEventListener('pointerdown', (e: PointerEvent) => {
        const t = e.target as HTMLElement;
        const handle = t.closest(handleSelector);
        if (!handle || !panel.contains(handle)) return;            // press must be on the header
        if (t.closest('button, input, select, a, textarea')) return; // not on a control
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY;
        const r = panel.getBoundingClientRect();
        const ox = r.left, oy = r.top, w = r.width;
        panel.style.transition = 'none'; // a CSS transition on left/top would lag the drag
        panel.style.left = `${ox}px`; panel.style.top = `${oy}px`;
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
        const move = (ev: PointerEvent) => {
            // Clamp to the DRAWING AREA, not the window: with a docked toolbar or an
            // open property panel, clamping to 0..innerWidth lets a panel be dragged
            // underneath docked chrome, where part of it is unreachable.
            const i = dockInsets();
            const minX = i.left, maxX = window.innerWidth - i.right - Math.min(w, 60);
            const minY = i.top, maxY = window.innerHeight - i.bottom - 24;
            const nx = Math.max(minX, Math.min(maxX, ox + ev.clientX - sx));
            const ny = Math.max(minY, Math.min(maxY, oy + ev.clientY - sy));
            panel.style.left = `${nx}px`; panel.style.top = `${ny}px`;
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    });
}

/** Solid `ref` helper: make the element draggable by the child header matched by
 *  `handleSelector`. Also sets a move cursor on current matching headers for
 *  affordance. Use as `ref={draggablePanel('.my-header')}`. */
export function draggablePanel(handleSelector: string) {
    return (el: HTMLElement) => {
        makeDraggable(el, handleSelector);
        el.querySelectorAll(handleSelector).forEach(h => ((h as HTMLElement).style.cursor = 'move'));
    };
}
