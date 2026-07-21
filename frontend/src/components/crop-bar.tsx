/**
 * On-screen Apply / Cancel for crop mode.
 *
 * Crop was keyboard-and-mouse only: apply with Enter or by clicking outside the
 * crop rectangle, cancel with Escape. On a tablet that leaves applying to an
 * undiscoverable tap-outside and makes cancelling impossible — there is no
 * Escape key. These buttons are the touch path, and they double as the
 * discoverable one on desktop.
 */

import { type Component, Show, onMount, onCleanup } from 'solid-js';
import { Check, X } from 'lucide-solid';
import { store, exitCropMode } from '../store/app-store';

const CropBar: Component = () => {
    // Lift toasts above the bar for as long as it's on screen — it sits at the
    // bottom centre, exactly where they appear (see the 0.8.132 collision).
    onMount(() => document.documentElement.style.setProperty('--toast-bottom', '96px'));
    onCleanup(() => document.documentElement.style.removeProperty('--toast-bottom'));

    const btn = (primary: boolean) => ({
        display: 'flex',
        'align-items': 'center',
        gap: '6px',
        padding: '8px 16px',
        'font-size': '13px',
        'font-weight': '600',
        'border-radius': '8px',
        cursor: 'pointer',
        border: primary ? 'none' : '1px solid var(--border-color)',
        background: primary ? 'var(--btn-primary-bg)' : 'var(--btn-bg)',
        color: primary ? 'var(--btn-primary-fg)' : 'var(--text-primary)',
    });

    return (
        <Show when={store.cropModeElementId}>
            <div
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '8px',
                    padding: '8px',
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border-color)',
                    'border-radius': '12px',
                    'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.2)',
                    'z-index': '10000',
                }}
            >
                <span style={{ 'font-size': '12px', color: 'var(--text-secondary)', padding: '0 6px' }}>
                    Drag the handles to crop
                </span>
                <button style={btn(false)} onClick={() => exitCropMode(false)} title="Cancel crop (Esc)">
                    <X size={16} /> Cancel
                </button>
                <button style={btn(true)} onClick={() => exitCropMode(true)} title="Apply crop (Enter)">
                    <Check size={16} /> Apply
                </button>
            </div>
        </Show>
    );
};

export default CropBar;
