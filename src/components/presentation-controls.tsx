import { type Component, Show, createSignal, onMount, onCleanup, createMemo } from 'solid-js';
import { store, togglePresentationMode, advancePresentation, retreatPresentation, setSelectedTool } from '../store/app-store';
import { ChevronLeft, ChevronRight, X, MousePointer2, Zap, Highlighter, Eraser } from 'lucide-solid';

export const PresentationControls: Component = () => {
    const [isVisible, setIsVisible] = createSignal(true);
    let hideTimeout: number;

    const resetHideTimeout = () => {
        setIsVisible(true);
        window.clearTimeout(hideTimeout);
        hideTimeout = window.setTimeout(() => {
            if (store.appMode === 'presentation') setIsVisible(false);
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

    const slideInfo = createMemo(() => {
        return `Slide ${store.activeSlideIndex + 1} of ${store.slides.length}`;
    });

    const handleNext = async () => {
        await advancePresentation();
        resetHideTimeout();
    };

    const handlePrev = async () => {
        await retreatPresentation();
        resetHideTimeout();
    };

    return (
        <Show when={isVisible()}>
            <div
                class="presentation-hud"
                style={{
                    position: 'fixed',
                    bottom: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    'align-items': 'center',
                    gap: '12px',
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
                    onClick={handlePrev}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '8px',
                        'border-radius': '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <ChevronLeft size={20} />
                </button>

                <div style={{
                    color: '#64748b',
                    'font-size': '13px',
                    'font-weight': '600',
                    'min-width': '100px',
                    'text-align': 'center',
                    'user-select': 'none'
                }}>
                    {slideInfo()}
                </div>

                <button
                    onClick={handleNext}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '8px',
                        'border-radius': '50%',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <ChevronRight size={20} />
                </button>

                <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', 'margin': '0 8px' }}></div>

                {/* Tool Selection Toolbox */}
                <div style={{ display: 'flex', 'align-items': 'center', gap: '4px' }}>
                    <button
                        onClick={() => setSelectedTool('selection')}
                        style={{
                            background: store.selectedTool === 'selection' ? 'rgba(59, 130, 246, 0.1)' : 'none',
                            border: 'none',
                            color: store.selectedTool === 'selection' ? '#3b82f6' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '8px',
                            'border-radius': '8px',
                            transition: 'all 0.2s'
                        }}
                        title="Pointer (Advance Slides)"
                    >
                        <MousePointer2 size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('laser')}
                        style={{
                            background: store.selectedTool === 'laser' ? 'rgba(245, 158, 11, 0.1)' : 'none',
                            border: 'none',
                            color: store.selectedTool === 'laser' ? '#f59e0b' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '8px',
                            'border-radius': '8px',
                            transition: 'all 0.2s'
                        }}
                        title="Laser Pointer"
                    >
                        <Zap size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('ink')}
                        style={{
                            background: store.selectedTool === 'ink' ? 'rgba(239, 68, 68, 0.1)' : 'none',
                            border: 'none',
                            color: store.selectedTool === 'ink' ? '#ef4444' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '8px',
                            'border-radius': '8px',
                            transition: 'all 0.2s'
                        }}
                        title="Ink Highlighter"
                    >
                        <Highlighter size={18} />
                    </button>
                    <button
                        onClick={() => setSelectedTool('eraser')}
                        style={{
                            background: store.selectedTool === 'eraser' ? 'rgba(100, 116, 139, 0.1)' : 'none',
                            border: 'none',
                            color: store.selectedTool === 'eraser' ? '#475569' : '#64748b',
                            cursor: 'pointer',
                            display: 'flex',
                            padding: '8px',
                            'border-radius': '8px',
                            transition: 'all 0.2s'
                        }}
                        title="Eraser"
                    >
                        <Eraser size={18} />
                    </button>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', 'margin': '0 8px' }}></div>

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
    );
};
