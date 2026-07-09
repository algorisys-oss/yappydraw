import { createEffect, onCleanup, type Accessor } from 'solid-js';

/**
 * Close-on-Escape for a dialog / overlay.
 *
 * While `isOpen()` is true, a window-level `keydown` listener invokes `handler`
 * (the dialog's close/cancel) when Escape is pressed, and is torn down as soon as
 * the dialog closes or the component unmounts. A window listener is used
 * deliberately — an `onKeyDown` on the overlay `<div>` only fires when that div has
 * focus, which it usually doesn't, so those never actually closed on Escape.
 */
export function onEscapeKey(isOpen: Accessor<boolean>, handler: () => void): void {
    createEffect(() => {
        if (!isOpen()) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handler();
            }
        };
        window.addEventListener('keydown', onKey);
        onCleanup(() => window.removeEventListener('keydown', onKey));
    });
}
