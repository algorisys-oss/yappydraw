import { createSignal, Show } from 'solid-js';
import { radialRepeat, gridRepeat, store } from '../store/app-store';
import { onEscapeKey } from '../utils/use-escape';

// Global open state so the command palette / context menu can launch the dialog.
const [isOpen, setIsOpen] = createSignal(false);
export const openRepeatDialog = () => setIsOpen(true);
export const repeatDialogOpen = isOpen;

/**
 * Radial / Grid repeat parameter dialog. Operates on the current selection;
 * radial arranges N copies around the selection centre (radius pushes them into
 * a ring, faceCenter orients each outward), grid tiles rows × cols.
 */
export const RepeatDialog = () => {
    onEscapeKey(isOpen, () => setIsOpen(false));
    const [mode, setMode] = createSignal<'radial' | 'grid'>('radial');
    const [count, setCount] = createSignal(6);
    const [radius, setRadius] = createSignal(120);
    const [faceCenter, setFaceCenter] = createSignal(true);
    const [rows, setRows] = createSignal(3);
    const [cols, setCols] = createSignal(3);
    const [gap, setGap] = createSignal(20);

    const close = () => setIsOpen(false);
    const apply = () => {
        if (store.selection.length === 0) { close(); return; }
        if (mode() === 'radial') radialRepeat(count(), { radius: radius(), faceCenter: faceCenter() });
        else gridRepeat(rows(), cols(), { gapX: gap(), gapY: gap() });
        close();
    };

    const label = { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: '10px', 'font-size': '13px', color: 'var(--text-primary, #1f2937)' } as const;
    const input = { width: '90px', padding: '4px 6px', 'border-radius': '6px', border: '1px solid var(--border-color, #d1d5db)', background: 'var(--bg-secondary, #fff)', color: 'inherit' } as const;

    return (
        <Show when={isOpen()}>
            <div
                onClick={(e) => { if (e.target === e.currentTarget) close(); }}
                style={{
                    position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.35)',
                    display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'z-index': 20000,
                }}
            >
                <div style={{
                    width: '320px', background: 'var(--bg-panel, #fff)', color: 'var(--text-primary, #1f2937)',
                    'border-radius': '12px', padding: '16px', 'box-shadow': '0 12px 40px rgba(0,0,0,0.25)',
                    display: 'flex', 'flex-direction': 'column', gap: '12px',
                }}>
                    <div style={{ 'font-weight': 600, 'font-size': '15px' }}>Repeat</div>

                    {/* mode toggle */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button class="icon-btn" onClick={() => setMode('radial')}
                            style={{ flex: 1, padding: '6px', 'border-radius': '6px', border: '1px solid var(--border-color,#d1d5db)', background: mode() === 'radial' ? 'var(--accent,#3b82f6)' : 'transparent', color: mode() === 'radial' ? '#fff' : 'inherit', cursor: 'pointer' }}>Radial</button>
                        <button class="icon-btn" onClick={() => setMode('grid')}
                            style={{ flex: 1, padding: '6px', 'border-radius': '6px', border: '1px solid var(--border-color,#d1d5db)', background: mode() === 'grid' ? 'var(--accent,#3b82f6)' : 'transparent', color: mode() === 'grid' ? '#fff' : 'inherit', cursor: 'pointer' }}>Grid</button>
                    </div>

                    <Show when={mode() === 'radial'}>
                        <label style={label}>Count
                            <input style={input} type="number" min="2" max="200" value={count()} onInput={(e) => setCount(Math.max(2, parseInt(e.currentTarget.value) || 2))} />
                        </label>
                        <label style={label}>Radius
                            <input style={input} type="number" min="0" step="10" value={radius()} onInput={(e) => setRadius(Math.max(0, parseInt(e.currentTarget.value) || 0))} />
                        </label>
                        <label style={label}>Face center
                            <input type="checkbox" checked={faceCenter()} onChange={(e) => setFaceCenter(e.currentTarget.checked)} />
                        </label>
                    </Show>

                    <Show when={mode() === 'grid'}>
                        <label style={label}>Rows
                            <input style={input} type="number" min="1" max="100" value={rows()} onInput={(e) => setRows(Math.max(1, parseInt(e.currentTarget.value) || 1))} />
                        </label>
                        <label style={label}>Columns
                            <input style={input} type="number" min="1" max="100" value={cols()} onInput={(e) => setCols(Math.max(1, parseInt(e.currentTarget.value) || 1))} />
                        </label>
                        <label style={label}>Gap
                            <input style={input} type="number" min="0" step="5" value={gap()} onInput={(e) => setGap(Math.max(0, parseInt(e.currentTarget.value) || 0))} />
                        </label>
                    </Show>

                    <div style={{ display: 'flex', 'justify-content': 'flex-end', gap: '8px', 'margin-top': '4px' }}>
                        <button onClick={close} style={{ padding: '6px 14px', 'border-radius': '6px', border: '1px solid var(--border-color,#d1d5db)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={apply} style={{ padding: '6px 14px', 'border-radius': '6px', border: 'none', background: 'var(--accent,#3b82f6)', color: '#fff', cursor: 'pointer' }}>Apply</button>
                    </div>
                </div>
            </div>
        </Show>
    );
};
