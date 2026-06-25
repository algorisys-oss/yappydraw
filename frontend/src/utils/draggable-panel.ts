/**
 * Make a floating panel draggable by a handle (its header). On the first drag it
 * switches from edge-anchored (bottom/right) to free top/left positioning and
 * follows the pointer, clamped to stay on screen. Move/up listeners are added
 * only during a drag and removed on release, and the pointerdown listener lives
 * on the handle element — so nothing leaks when the panel unmounts.
 */
export function makeDraggable(panel: HTMLElement, handle: HTMLElement): void {
    handle.style.cursor = 'move';
    handle.addEventListener('pointerdown', (e: PointerEvent) => {
        const t = e.target as HTMLElement;
        if (t.closest('button, input, select, a, textarea')) return; // don't drag from controls
        e.preventDefault();
        const sx = e.clientX, sy = e.clientY;
        const r = panel.getBoundingClientRect();
        const ox = r.left, oy = r.top, w = r.width, h = r.height;
        panel.style.left = `${ox}px`; panel.style.top = `${oy}px`;
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
        const move = (ev: PointerEvent) => {
            const nx = Math.max(0, Math.min(window.innerWidth - Math.min(w, 60), ox + ev.clientX - sx));
            const ny = Math.max(0, Math.min(window.innerHeight - 24, oy + ev.clientY - sy));
            panel.style.left = `${nx}px`; panel.style.top = `${ny}px`;
            void h;
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
 *  `handleSelector`. Use as `ref={draggablePanel('.my-header')}`. */
export function draggablePanel(handleSelector: string) {
    return (el: HTMLElement) => {
        // Children are in the DOM by the time the parent ref fires.
        const handle = el.querySelector(handleSelector) as HTMLElement | null;
        if (handle) makeDraggable(el, handle);
    };
}
