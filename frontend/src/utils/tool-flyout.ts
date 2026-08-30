import { createSignal } from 'solid-js';
import { placeFlyout } from './popover-placement';

/**
 * Shared positioning for the tool-group flyouts (Shapes, Pen, UML, BPMN, …).
 *
 * Seventeen components each carried a byte-identical `getDropdownPosition` that hard-coded
 * "below the button, left-aligned with it". That is only correct while the toolbar is docked
 * to the left or the top; docked right or bottom the panel opened off-screen and its tools
 * could not be reached at all. One helper now owns the geometry (and `placeFlyout` owns the
 * arithmetic, with its own tests), so the four dock edges cannot drift apart again.
 *
 * Why a signal rather than a plain function: the panel has to be MEASURED to be clamped —
 * these flyouts range from a 3-icon strip to a titled 4-column grid, and guessing the width
 * is exactly what leaves a wide one hanging over the right edge. The style is therefore
 * published in two passes: an estimate at first paint (already correct on the common edges,
 * so nothing flickers there) and the measured position as soon as the element exists.
 *
 * Usage in a component:
 *
 *     const flyout = createFlyoutPlacement(() => buttonRef);
 *     …
 *     <div ref={el => { dropdownRef = el; flyout.attach(el); }}
 *          class="pen-tool-dropdown" style={flyout.style()}>
 */

/** What an unmeasured panel is assumed to be: `.pen-tool-dropdown`'s min-width, and a
 *  height that keeps the initial guess from flipping a short panel above the button. */
const ESTIMATE = { width: 216, height: 120 };

/** Below this width the flyout opens centred ABOVE the button — a phone's toolbar is at the
 *  foot of the screen and its buttons are under the thumb, so anywhere else is covered. */
const PHONE_WIDTH = 768;

/** Every key the two layouts between them set, so switching layout clears the other's. */
type FlyoutStyle = {
    top: string | undefined;
    left: string | undefined;
    bottom: string | undefined;
    transform: string | undefined;
};

export interface FlyoutPlacement {
    /** `position: fixed` coordinates for the panel. Reactive — re-reads after `attach`. */
    style: () => FlyoutStyle;
    /** Call from the panel's `ref`: measures it and republishes the exact position. */
    attach: (el: HTMLElement | undefined) => void;
}

export function createFlyoutPlacement(anchor: () => HTMLElement | undefined): FlyoutPlacement {
    const [measured, setMeasured] = createSignal<{ width: number; height: number } | null>(null);

    const style = (): FlyoutStyle => {
        const btn = anchor();
        // No anchor yet — park it off the top-left corner rather than at (0,0), where it
        // would flash over the canvas for a frame.
        if (!btn) return { top: '-9999px', left: '-9999px', bottom: undefined, transform: undefined };
        const r = btn.getBoundingClientRect();
        if (window.innerWidth <= PHONE_WIDTH) {
            return {
                bottom: `${window.innerHeight - r.top + 8}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                top: undefined,
            };
        }
        const p = placeFlyout(
            { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
            measured() ?? ESTIMATE,
            { width: window.innerWidth, height: window.innerHeight },
        );
        return { top: `${p.top}px`, left: `${p.left}px`, bottom: undefined, transform: undefined };
    };

    const attach = (el: HTMLElement | undefined) => {
        if (!el) { setMeasured(null); return; }
        // After layout, not during it: the element is being inserted as this runs, so its
        // box is not final yet.
        requestAnimationFrame(() => {
            if (!el.isConnected) return;
            const r = el.getBoundingClientRect();
            if (r.width && r.height) setMeasured({ width: r.width, height: r.height });
        });
    };

    return { style, attach };
}
