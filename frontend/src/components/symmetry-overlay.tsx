import { onMount, onCleanup, Show, For, createMemo } from 'solid-js';
import { store, setSymmetryCenter } from '../store/app-store';
import { symmetryAxisAngles, ringRadii } from '../utils/symmetry';
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
    // Ring guides outlive symmetry itself: you switch symmetry off to finish detail work
    // by hand, and the rings you spaced the mandala against must not vanish with it.
    const active = () => store.symmetry.mode !== 'off' || store.symmetry.rings > 0;

    const cx = () => worldToWindow(store.symmetry.cx, store.symmetry.cy).x;
    const cy = () => worldToWindow(store.symmetry.cx, store.symmetry.cy).y;

    /** Axis angles to draw (world and screen share orientation, so no conversion). */
    const angles = createMemo(() =>
        symmetryAxisAngles(store.symmetry.mode, store.symmetry.radialCount, store.symmetry.angle));

    // Long enough to cross any viewport at any rotation.
    const reach = () => Math.hypot(window.innerWidth, window.innerHeight);

    /**
     * Spokes have to get quieter as they get denser. A 36-sector kaleidoscope draws 72
     * rays; at the full mirror-axis weight that is a purple starburst you cannot draw
     * inside. Two mirror axes stay at full strength — the ramp only kicks in past 8.
     */
    const spokeOpacity = createMemo(() => {
        const n = angles().length;
        return n <= 8 ? 1 : Math.max(0.3, 8 / n);
    });

    /**
     * Rays start a short way out, leaving the centre clear. Every spoke converges there,
     * so without the gap the middle of the mandala — the part you detail most finely — is
     * hidden under the guides.
     */
    const HUB_GAP = 16;

    /**
     * Ring guides, in SCREEN px. A circle is rotation-invariant, so scaling the world
     * radius by the zoom is exact even with the view rotated — unlike the spokes above,
     * which read world angles as screen angles.
     */
    const rings = createMemo(() =>
        ringRadii(store.symmetry.rings, store.symmetry.ringSpacing)
            .map(r => r * store.viewState.scale)
            .filter(r => r >= 2));

    return (
        <Show when={active()}>
            <div style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', 'z-index': 37 }}>
                <svg
                    class="symmetry-overlay-svg"
                    width="100%" height="100%"
                    style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', overflow: 'visible' }}
                >
                    {/* Ring scaffold first, so the spokes read on top of it. */}
                    <For each={rings()}>{(r) => (
                        <circle
                            cx={cx()} cy={cy()} r={r}
                            fill="none" stroke={color} stroke-width="1" stroke-dasharray="4 6" opacity="0.55"
                        />
                    )}</For>

                    <For each={angles()}>{(a) => {
                        // Radial spokes run outward from the centre; mirror axes are full
                        // lines through it, so they extend both ways. Kaleidoscope already
                        // enumerates both rays of each mirror line, so it draws as rays too —
                        // as full lines every wedge boundary would be drawn twice.
                        const radial = store.symmetry.mode === 'radial' || store.symmetry.mode === 'kaleidoscope';
                        const ux = Math.cos(a);
                        const uy = Math.sin(a);
                        const dx = ux * reach();
                        const dy = uy * reach();
                        const gx = ux * HUB_GAP;
                        const gy = uy * HUB_GAP;
                        return (
                            <line
                                x1={radial ? cx() + gx : cx() - dx} y1={radial ? cy() + gy : cy() - dy}
                                x2={cx() + dx} y2={cy() + dy}
                                stroke={color} stroke-width="1.5" stroke-dasharray="6 5"
                                opacity={spokeOpacity()}
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
