import { type Component, Show, createSignal, onMount, onCleanup } from 'solid-js';
import { store, togglePresentationMode, setSelectedTool } from '../store/app-store';
import { MousePointer2, Zap, Highlighter, Brush, Eraser, X } from 'lucide-solid';
import { gifCapturing } from '../utils/recording-manager';
import { PresentationCaptureButtons } from './presentation-capture';

export const CanvasToolbar: Component = () => {
    const [isVisible, setIsVisible] = createSignal(true);
    let hideTimeout: number;

    const resetHideTimeout = () => {
        setIsVisible(true);
        window.clearTimeout(hideTimeout);
        hideTimeout = window.setTimeout(() => {
            // Never auto-hide mid-capture — Stop has to stay reachable while
            // recording, and the GIF countdown is the only progress signal.
            // Safe to leave on screen: capture reads the canvas surface, so this
            // toolbar is not in the output either way.
            if (store.appMode === 'presentation' && !store.isRecording && !gifCapturing()) setIsVisible(false);
        }, 3000);
    };

    onMount(() => {
        window.addEventListener('mousemove', resetHideTimeout);
        resetHideTimeout();
    });

    onCleanup(() => {
        window.removeEventListener('mousemove', resetHideTimeout);
        window.clearTimeout(hideTimeout);
    });

    const toolBtnStyle = (tool: string, activeColor: string) => ({
        background: store.selectedTool === tool ? `${activeColor}18` : 'none',
        border: 'none',
        color: store.selectedTool === tool ? activeColor : '#64748b',
        cursor: 'pointer',
        display: 'flex',
        padding: '8px',
        'border-radius': '8px',
        transition: 'all 0.2s'
    });

    return (
        <Show when={store.docType === 'infinite' && store.appMode === 'presentation' && store.showCanvasToolbar && !store.gameActive}>
            <Show when={isVisible()}>
                <div
                    style={{
                        position: 'fixed',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        'align-items': 'center',
                        gap: '4px',
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.8)',
                        'backdrop-filter': 'blur(12px)',
                        'border-radius': '100px',
                        'box-shadow': '0 10px 25px rgba(0, 0, 0, 0.2)',
                        'z-index': '10000',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        transition: 'opacity 0.3s ease',
                        'font-family': 'Inter, sans-serif'
                    }}
                >
                    <button
                        onClick={() => setSelectedTool('selection')}
                        style={toolBtnStyle('selection', '#3b82f6')}
                        title="Pointer / Pan"
                    >
                        <MousePointer2 size={18} />
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    <button
                        onClick={() => setSelectedTool('laser')}
                        style={toolBtnStyle('laser', '#f59e0b')}
                        title="Laser Pointer"
                    >
                        <Zap size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('ink')}
                        style={toolBtnStyle('ink', '#ef4444')}
                        title="Ink Highlighter"
                    >
                        <Highlighter size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('inkbrush')}
                        style={toolBtnStyle('inkbrush', '#8b5cf6')}
                        title="Ink Brush"
                    >
                        <Brush size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('eraser')}
                        style={toolBtnStyle('eraser', '#475569')}
                        title="Eraser"
                    >
                        <Eraser size={18} />
                    </button>

                    {/* Capture controls. On an infinite canvas these are the ONLY
                        route to a video or GIF: the offline page export needs page
                        bounds to frame itself to, and there are none here. */}
                    <PresentationCaptureButtons onInteract={resetHideTimeout} />

                    <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

                    <button
                        onClick={() => togglePresentationMode(false)}
                        style={{
                            background: '#f1f5f9',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '8px',
                            'border-radius': '50%',
                            transition: 'transform 0.2s'
                        }}
                        title="Exit Presentation"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <X size={18} />
                    </button>
                </div>
            </Show>
        </Show>
    );
};
