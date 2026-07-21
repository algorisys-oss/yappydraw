/**
 * Capture controls for the presentation toolbars: record an MP4, or grab a
 * fixed-length looping GIF.
 *
 * Shared by BOTH presentation toolbars — `presentation-controls.tsx` (paged
 * docs: slide arrows + counter) and `canvas-toolbar.tsx` (infinite canvas).
 * They look alike but are separate components with no shared code, and a
 * capture button added to only one of them shipped broken once already. Adding
 * controls here, once, is what stops that recurring.
 */

import { type Component, Show, onMount, onCleanup } from 'solid-js';
import { Video, Square, Film } from 'lucide-solid';
import { store } from '../store/app-store';
import {
    setRequestRecording, startCanvasGif, stopCanvasGif,
    gifCapturing, gifElapsedMs, gifBytes,
} from '../utils/recording-manager';

// Height to lift toasts by while a presentation toolbar is docked at the
// bottom-centre: toolbar top edge (40px + ~50px tall) plus breathing room.
const TOOLBAR_CLEARANCE = '110px';

export const PresentationCaptureButtons: Component<{ onInteract?: () => void }> = (props) => {
    // Push toasts above the toolbar for as long as it's on screen. This lives
    // here because this component renders inside BOTH presentation toolbars and
    // unmounts with their auto-hide — so the offset tracks visibility for free,
    // and the two toolbars cannot drift apart on it the way their capture
    // buttons once did.
    onMount(() => document.documentElement.style.setProperty('--toast-bottom', TOOLBAR_CLEARANCE));
    onCleanup(() => document.documentElement.style.removeProperty('--toast-bottom'));

    const elapsed = () => {
        const s = Math.floor(gifElapsedMs() / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    const size = () => {
        const kb = gifBytes() / 1024;
        return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
    };

    const btn = (active: boolean, activeColor: string) => ({
        background: active ? `${activeColor}1f` : 'none',
        border: 'none',
        color: active ? activeColor : '#64748b',
        cursor: 'pointer',
        display: 'flex',
        'align-items': 'center',
        gap: '6px',
        padding: '8px',
        'border-radius': '8px',
        transition: 'all 0.2s',
        'white-space': 'nowrap',
        'flex-shrink': '0',
    });

    const toggleGif = () => {
        props.onInteract?.();
        if (gifCapturing()) stopCanvasGif();
        else void startCanvasGif({});
    };

    return (
        <>
            {/* MP4 — open-ended, because video has a scrubber and a pause button;
                stopping wherever you like is fine. */}
            <button
                onClick={() => {
                    setRequestRecording(store.isRecording ? { start: false } : { start: true, format: 'mp4' });
                    props.onInteract?.();
                }}
                disabled={gifCapturing()}
                style={{ ...btn(store.isRecording, '#ef4444'), opacity: gifCapturing() ? 0.4 : 1 }}
                title={store.isRecording ? 'Stop recording & download MP4' : 'Record as MP4'}
                aria-label={store.isRecording ? 'Stop recording' : 'Record video'}
            >
                <Show when={store.isRecording} fallback={<Video size={18} />}>
                    <Square size={18} fill="currentColor" strokeWidth={0} />
                </Show>
            </button>

            {/* GIF — start/stop, same as the video button beside it. Animations
                here fire on clicks, build steps and conditions, so there is no
                duration to pick up front; and stopping by hand is what lands a
                clean loop seam, since you can stop the instant the motion returns
                to where it started. The running time and file size show the cost
                accruing — a GIF stores every frame whole. */}
            <button
                onClick={toggleGif}
                disabled={store.isRecording}
                style={{ ...btn(gifCapturing(), '#0ea5e9'), opacity: store.isRecording ? 0.4 : 1 }}
                title={gifCapturing() ? 'Stop & save the looping GIF' : 'Capture a looping GIF'}
                aria-label={gifCapturing() ? 'Stop GIF capture' : 'Capture GIF'}
            >
                <Show when={gifCapturing()} fallback={<Film size={18} />}>
                    <Square size={18} fill="currentColor" strokeWidth={0} />
                </Show>
                <Show when={gifCapturing()}>
                    {/* nowrap: without it the readout breaks onto a second line
                        mid-capture and stretches the whole toolbar pill. */}
                    <span style={{
                        'font-size': '12px',
                        'font-weight': '700',
                        'font-variant-numeric': 'tabular-nums',
                        'white-space': 'nowrap',
                    }}>
                        {elapsed()} · {size()}
                    </span>
                </Show>
            </button>
        </>
    );
};
