import { type Component, For, createSignal, Show } from 'solid-js';
import { store, updateElement, pushToHistory, updateSlideBackground, updateDefaultStyles } from '../store/app-store';
import { AdvancedP3Picker } from './advanced-p3-picker';
import { COLOR_PALETTES, getColorPalette } from '../config/color-palettes';

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
                store.selection.forEach(id => updateElement(id, { strokeColor: data }));
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
        } else if (store.docType === 'slides') {
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
                    <AdvancedP3Picker onSelect={applyAsset} />
                </div>
            }>
                <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', 'align-items': 'center', gap: '6px', 'margin-bottom': '8px' }}>
                        <span style={{ 'font-size': '10px', 'font-weight': 'bold', color: 'var(--text-secondary)', 'flex-shrink': 0 }}>PALETTE</span>
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        applyAsset(swatch.value, e.shiftKey ? 'fill' : 'stroke');
                                    }}
                                    title={`${swatch.label} — Click: set stroke • Shift+click: set fill • Drag: apply to shape/slide`}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        background: swatch.value === 'transparent' ? 'white' : swatch.value,
                                        'border-radius': '6px',
                                        cursor: 'grab',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        transition: 'transform 0.2s',
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
