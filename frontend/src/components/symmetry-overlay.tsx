import { onMount, onCleanup, Show, For, createMemo } from 'solid-js';
import { store, setSymmetryCenter } from '../store/app-store';
import { symmetryAxisAngles } from '../utils/symmetry';

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

    const worldToScreenX = (wx: number) => wx * store.viewState.scale + store.viewState.panX;
    const worldToScreenY = (wy: number) => wy * store.viewState.scale + store.viewState.panY;
    const screenToWorldX = (sx: number) => (sx - store.viewState.panX) / store.viewState.scale;
    const screenToWorldY = (sy: number) => (sy - store.viewState.panY) / store.viewState.scale;

    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        setSymmetryCenter(screenToWorldX(e.clientX), screenToWorldY(e.clientY));
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

    const cx = () => worldToScreenX(store.symmetry.cx);
    const cy = () => worldToScreenY(store.symmetry.cy);

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
