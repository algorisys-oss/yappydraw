import { onMount, onCleanup, Show, For, createMemo } from 'solid-js';
import { store, setSymmetryCenter } from '../store/app-store';
import { symmetryAxisAngles } from '../utils/symmetry';
import { worldToWindow, windowToWorld } from '../utils/overlay-transform';

/**
 * Symmetry overlay — the mirror / quadrant / mandala axes you draw against,
 * plus a centre handle for repositioning them.
 *
 * Mirrors HappyPaint's guides overlay: axes are drawn through the centre at the
 * mode's angles, and the centre handle only appears (and only accepts drags)
 * while `symmetry.editing` is on, so it never competes with the drawing tools.
 */
export const SymmetryOverlay = () => {
    let dragging = false;

    // World↔window via the shared overlay transform: this layer is window-fixed, while
    // `viewport-transforms` speaks canvas-local px. See utils/overlay-transform.ts — getting that
    // offset wrong is what drew the axis 46px left of the line strokes actually mirrored about.
    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        const w = windowToWorld(e.clientX, e.clientY);
        setSymmetryCenter(w.x, w.y);
    };
    const onUp = () => { dragging = false; };

    onMount(() => {
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        onCleanup(() => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        });
    });

    const color = '#b14cff';
    const active = () => store.symmetry.mode !== 'off';

    const cx = () => worldToWindow(store.symmetry.cx, store.symmetry.cy).x;
    const cy = () => worldToWindow(store.symmetry.cx, store.symmetry.cy).y;

    /** Axis angles to draw (world and screen share orientation, so no conversion). */
    const angles = createMemo(() =>
        symmetryAxisAngles(store.symmetry.mode, store.symmetry.radialCount, store.symmetry.angle));

    // Long enough to cross any viewport at any rotation.
    const reach = () => Math.hypot(window.innerWidth, window.innerHeight);

    return (
        <Show when={active()}>
            <div style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', 'z-index': 37 }}>
                <svg
                    width="100%" height="100%"
                    style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', overflow: 'visible' }}
                >
                    <For each={angles()}>{(a) => {
                        // Radial spokes run outward from the centre; mirror axes are full
                        // lines through it, so they extend both ways.
                        const radial = store.symmetry.mode === 'radial';
                        const dx = Math.cos(a) * reach();
                        const dy = Math.sin(a) * reach();
                        return (
                            <line
                                x1={radial ? cx() : cx() - dx} y1={radial ? cy() : cy() - dy}
                                x2={cx() + dx} y2={cy() + dy}
                                stroke={color} stroke-width="1.5" stroke-dasharray="6 5"
                            />
                        );
                    }}</For>
                </svg>

                {/* Centre handle — only while editing, so it can't intercept drawing. */}
                <Show when={store.symmetry.editing}>
                    <div
                        title="Symmetry centre — drag to move"
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); dragging = true; }}
                        style={{
                            position: 'fixed',
                            left: `${cx() - 9}px`,
                            top: `${cy() - 9}px`,
                            width: '18px',
                            height: '18px',
                            // Without border-box the 2px border sits OUTSIDE the 18px, making the
                            // handle 22px wide — so its visual centre landed 2px off the axis it
                            // is supposed to mark (and drags started from 2px off).
                            'box-sizing': 'border-box',
                            'border-radius': '50%',
                            background: color,
                            border: '2px solid #fff',
                            'box-shadow': '0 1px 4px rgba(0,0,0,.4)',
                            cursor: 'move',
                            'pointer-events': 'auto',
                        }}
                    />
                </Show>
            </div>
        </Show>
    );
};
