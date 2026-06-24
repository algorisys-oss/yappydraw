import { onMount, onCleanup, Show } from 'solid-js';
import { store, setSymmetryPos } from '../store/app-store';

/**
 * Symmetry guide overlay — a draggable dashed axis line (vertical or horizontal)
 * shown while `store.symmetry.enabled`. Drag it to reposition; use "Mirror Across
 * Guide" to reflect the selection across it. Pure overlay; never touches drawing.
 */
export const SymmetryOverlay = () => {
    let dragging = false;

    const worldToScreenX = (wx: number) => wx * store.viewState.scale + store.viewState.panX;
    const worldToScreenY = (wy: number) => wy * store.viewState.scale + store.viewState.panY;
    const screenToWorldX = (sx: number) => (sx - store.viewState.panX) / store.viewState.scale;
    const screenToWorldY = (sy: number) => (sy - store.viewState.panY) / store.viewState.scale;

    const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        if (store.symmetry.axis === 'vertical') setSymmetryPos(screenToWorldX(e.clientX));
        else setSymmetryPos(screenToWorldY(e.clientY));
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
    const screen = () => store.symmetry.axis === 'vertical'
        ? worldToScreenX(store.symmetry.pos)
        : worldToScreenY(store.symmetry.pos);

    return (
        <Show when={store.symmetry.enabled}>
            <div style={{ position: 'fixed', inset: '0', 'pointer-events': 'none', 'z-index': 37 }}>
                <div
                    title="Symmetry axis — drag to move"
                    onPointerDown={(e) => { e.preventDefault(); dragging = true; }}
                    style={store.symmetry.axis === 'vertical' ? {
                        position: 'fixed', top: '0', bottom: '0', left: `${screen() - 4}px`, width: '9px',
                        cursor: 'col-resize', 'pointer-events': 'auto',
                        display: 'flex', 'justify-content': 'center',
                    } : {
                        position: 'fixed', left: '0', right: '0', top: `${screen() - 4}px`, height: '9px',
                        cursor: 'row-resize', 'pointer-events': 'auto',
                        display: 'flex', 'align-items': 'center',
                    }}
                >
                    <div style={store.symmetry.axis === 'vertical'
                        ? { height: '100%', width: '0', 'border-left': `1.5px dashed ${color}` }
                        : { width: '100%', height: '0', 'border-top': `1.5px dashed ${color}` }} />
                </div>
            </div>
        </Show>
    );
};
