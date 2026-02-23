import { type Component, For, createSignal, Show } from 'solid-js';
import { store, updateElement, pushToHistory, updateSlideBackground } from '../store/app-store';
import { AdvancedP3Picker } from './advanced-p3-picker';

const P3_COLORS = [
    { name: 'P3 Red', value: 'color(display-p3 1 0 0)' },
    { name: 'P3 Green', value: 'color(display-p3 0 1 0)' },
    { name: 'P3 Blue', value: 'color(display-p3 0 0 1)' },
    { name: 'P3 Yellow', value: 'color(display-p3 1 1 0)' },
    { name: 'P3 Magenta', value: 'color(display-p3 1 0 1)' },
    { name: 'P3 Cyan', value: 'color(display-p3 0 1 1)' },
    { name: 'P3 Orange', value: 'color(display-p3 1 0.5 0)' },
    { name: 'P3 Purple', value: 'color(display-p3 0.5 0 1)' },
    { name: 'P3 Pink', value: 'color(display-p3 1 0 0.5)' },
];


export const P3ColorPicker: Component = () => {
    const [showAdvanced, setShowAdvanced] = createSignal(false);

    const applyAsset = (data: string) => {
        const isImage = data.startsWith('http') || data.startsWith('data:image');
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
                    <div style={{ 'font-size': '10px', 'font-weight': 'bold', color: 'var(--text-secondary)', 'margin-bottom': '4px' }}>P3 COLORS</div>
                    <div
                        style={{
                            display: 'grid',
                            'grid-template-columns': 'repeat(5, 1fr)',
                            gap: '8px',
                            'margin-bottom': '12px'
                        }}
                    >
                        <For each={P3_COLORS}>
                            {(color) => (
                                <div
                                    draggable={true}
                                    onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleDragStart(e, color.value);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        applyAsset(color.value);
                                    }}
                                    title={`${color.name} (Drag to shape/slide)`}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        background: color.value,
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
                        <button
                            onClick={() => setShowAdvanced(true)}
                            title="Advanced Picker"
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
                    </div>

                </div>
            </Show>
        </div>
    );
};

