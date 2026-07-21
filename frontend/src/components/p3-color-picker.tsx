import { type Component, For, createSignal, Show } from 'solid-js';
import { isPagedDocType } from '../types/slide-types';
import { Pin, PinOff } from 'lucide-solid';
import { store, updateElement, pushToHistory, updateSlideBackground, updateDefaultStyles, createSwatch } from '../store/app-store';
import { AdvancedP3Picker } from './advanced-p3-picker';
import { COLOR_PALETTES, getColorPalette } from '../config/color-palettes';
import { startColorDrop, moveColorDrop, commitColorDrop } from '../utils/color-drop';

const PALETTE_PINNED_KEY = 'palettePinned';
const [palettePinned, setPalettePinnedSignal] = createSignal<boolean>(
    (() => { try { return localStorage.getItem(PALETTE_PINNED_KEY) === '1'; } catch { return false; } })()
);

export const isPalettePinned = palettePinned;
export const setPalettePinned = (v: boolean) => {
    setPalettePinnedSignal(v);
    try { localStorage.setItem(PALETTE_PINNED_KEY, v ? '1' : '0'); } catch { /* ignore */ }
};

export const ColorPalettePicker: Component = () => {
    const [showAdvanced, setShowAdvanced] = createSignal(false);
    const [activePaletteId, setActivePaletteId] = createSignal<string>(
        store.globalSettings.colorPalette ?? 'p3'
    );
    const activePalette = () => getColorPalette(activePaletteId());

    const applyAsset = (data: string, mode: 'stroke' | 'fill' = 'fill') => {
        const isImage = data.startsWith('http') || data.startsWith('data:image');
        // Images only make sense as fill (replace element with image / slide bg)
        if (isImage) mode = 'fill';

        if (mode === 'stroke') {
            // Arm this color as the default stroke for future drawings,
            // and apply to any currently selected elements.
            updateDefaultStyles({ strokeColor: data });
            if (store.selection.length > 0) {
                pushToHistory();
                store.selection.forEach(id => {
                    const el = store.elements.find(e => e.id === id);
                    // For text the visible colour is `textColor || strokeColor`, so also set
                    // textColor — otherwise a baked-in textColor (from defaults) overrides it
                    // and the font colour never changes.
                    const patch = (el && (el.type === 'text' || el.type === 'richtext'))
                        ? { strokeColor: data, textColor: data } : { strokeColor: data };
                    updateElement(id, patch);
                });
            }
            return;
        }

        // Fill mode: apply to selection / slide background, and also arm the default fill.
        if (store.selection.length > 0) {
            pushToHistory();
            store.selection.forEach(id => {
                if (isImage) {
                    updateElement(id, { type: 'image', dataURL: data });
                } else {
                    updateElement(id, { backgroundColor: data, fillStyle: 'solid' });
                }
            });
        } else if (isPagedDocType(store.docType)) {
            pushToHistory();
            if (isImage) {
                updateSlideBackground(store.activeSlideIndex, { backgroundImage: data, fillStyle: 'image' });
            } else {
                updateSlideBackground(store.activeSlideIndex, { backgroundColor: data, fillStyle: 'solid' });
            }
        }
        if (!isImage) {
            updateDefaultStyles({ backgroundColor: data, fillStyle: 'solid' });
        }
    };

    // Touch/pen ColorDrop: drag a swatch onto a shape to fill it. Mouse keeps
    // the native HTML5 drag-and-drop + click-to-set-stroke below; we only take
    // over for touch/pen, where HTML5 DnD never fires. A short press that
    // doesn't move past SLOP stays a tap (→ onClick sets stroke).
    const DRAG_SLOP = 8;
    let drag: { id: number; x: number; y: number; color: string; active: boolean } | null = null;
    let suppressClick = false;

    const onSwatchPointerDown = (e: PointerEvent, color: string) => {
        if (e.pointerType === 'mouse') return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, color, active: false };
        try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onSwatchPointerMove = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) return;
        const moved = Math.hypot(e.clientX - drag.x, e.clientY - drag.y);
        if (!drag.active) {
            if (moved < DRAG_SLOP) return;
            drag.active = true;
            startColorDrop(drag.color, e.clientX, e.clientY);
        } else {
            moveColorDrop(e.clientX, e.clientY);
        }
        e.preventDefault();
    };
    const onSwatchPointerUp = (e: PointerEvent) => {
        if (!drag || e.pointerId !== drag.id) return;
        const wasActive = drag.active;
        drag = null;
        try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
        if (wasActive) {
            commitColorDrop(e.clientX, e.clientY);
            suppressClick = true; // the drop already acted — don't also set stroke
        }
    };

    const handleDragStart = (e: DragEvent, data: string) => {
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', data);
            e.dataTransfer.effectAllowed = 'copy';

            const isImage = data.startsWith('http') || data.startsWith('data:image');

            // Create a custom drag image
            const dragIcon = document.createElement('div');
            dragIcon.style.width = '32px';
            dragIcon.style.height = '32px';
            if (isImage) {
                dragIcon.style.backgroundImage = `url(${data})`;
                dragIcon.style.backgroundSize = 'cover';
            } else {
                dragIcon.style.background = data;
            }
            dragIcon.style.borderRadius = '4px';
            dragIcon.style.position = 'absolute';
            dragIcon.style.top = '-1000px';
            dragIcon.style.border = '1px solid white';
            document.body.appendChild(dragIcon);
            e.dataTransfer.setDragImage(dragIcon, 16, 16);
            setTimeout(() => document.body.removeChild(dragIcon), 0);
        }
    };

    return (
        <div>
            <Show when={!showAdvanced()} fallback={
                <div>
                    <div style={{ padding: '4px 8px', display: 'flex', 'justify-content': 'space-between', 'align-items': 'center' }}>
                        <span style={{ 'font-size': '12px', 'font-weight': 'bold' }}>OKLCH Picker</span>
                        <button
                            onClick={() => setShowAdvanced(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', 'font-size': '12px', color: 'var(--text-secondary)' }}
                        >
                            Back
                        </button>
                    </div>
                    <AdvancedP3Picker onSelect={applyAsset} onSaveSwatch={(c) => createSwatch(c)} />
                </div>
            }>
                <div style={{ padding: '8px' }}>
                    <div class="palette-drag-handle" style={{ display: 'flex', 'align-items': 'center', gap: '6px', 'margin-bottom': '8px' }}>
                        <span style={{ 'font-size': '10px', 'font-weight': 'bold', color: 'var(--text-secondary)', 'flex-shrink': 0, cursor: 'move' }} title="Drag to move">⠿ PALETTE</span>
                        <select
                            value={activePaletteId()}
                            onChange={(e) => setActivePaletteId(e.currentTarget.value)}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                                flex: 1,
                                'min-width': 0,
                                padding: '3px 6px',
                                'font-size': '11px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                'border-radius': '4px',
                                cursor: 'pointer',
                                'color-scheme': 'light dark'
                            }}
                        >
                            <For each={COLOR_PALETTES}>
                                {(p) => <option value={p.id}>{p.name}</option>}
                            </For>
                        </select>
                        <button
                            onClick={(e) => { e.stopPropagation(); setPalettePinned(!isPalettePinned()); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title={isPalettePinned() ? 'Unpin palette (will close on outside click)' : 'Pin palette (stays open; Esc to close)'}
                            style={{
                                background: 'none',
                                border: '1px solid var(--border-color)',
                                'border-radius': '4px',
                                padding: '3px',
                                cursor: 'pointer',
                                display: 'flex',
                                'align-items': 'center',
                                'justify-content': 'center',
                                color: isPalettePinned() ? 'var(--accent-color, #f43f5e)' : 'var(--text-secondary)',
                                'flex-shrink': 0
                            }}
                        >
                            {isPalettePinned() ? <Pin size={12} /> : <PinOff size={12} />}
                        </button>
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            'grid-template-columns': 'repeat(5, 1fr)',
                            gap: '8px',
                            'margin-bottom': '12px'
                        }}
                    >
                        <For each={activePalette().swatches}>
                            {(swatch) => (
                                <div
                                    draggable={true}
                                    onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(e, swatch.value);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => onSwatchPointerDown(e, swatch.value)}
                                    onPointerMove={onSwatchPointerMove}
                                    onPointerUp={onSwatchPointerUp}
                                    onPointerCancel={onSwatchPointerUp}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (suppressClick) { suppressClick = false; return; }
                                        applyAsset(swatch.value, e.shiftKey ? 'fill' : 'stroke');
                                    }}
                                    title={`${swatch.label} — Click: set stroke • Shift+click: set fill • Drag onto a shape: set its fill`}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        // `transparent` renders as a checkerboard (the standard "no
                                        // colour" convention) so it's distinguishable from White —
                                        // painting it solid white made the two swatches identical.
                                        background: swatch.value === 'transparent'
                                            ? 'repeating-conic-gradient(#c7ccd1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px'
                                            : swatch.value,
                                        'border-radius': '6px',
                                        cursor: 'grab',
                                        // Two-ring outline so near-white swatches (White / Off-White /
                                        // Light-Gray) get a crisp dark edge AND dark swatches separate
                                        // from the dark panel (outer light halo).
                                        border: '1px solid rgba(0,0,0,0.18)',
                                        'box-shadow': '0 0 0 1px rgba(255,255,255,0.10)',
                                        transition: 'transform 0.2s',
                                        'touch-action': 'none',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                />
                            )}
                        </For>
                        <Show when={activePaletteId() === 'p3'}>
                            <button
                                onClick={() => setShowAdvanced(true)}
                                title="Advanced OKLCH Picker"
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    background: 'var(--toolbar-bg)',
                                    'border-radius': '6px',
                                    cursor: 'pointer',
                                    border: '1px dashed var(--border-color)',
                                    display: 'flex',
                                    'align-items': 'center',
                                    'justify-content': 'center',
                                    'font-size': '14px',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                +
                            </button>
                        </Show>
                    </div>
                </div>
            </Show>
        </div>
    );
};
