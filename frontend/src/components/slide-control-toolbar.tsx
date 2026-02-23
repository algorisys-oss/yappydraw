import { type Component, createSignal, createEffect, Show } from 'solid-js';
import {
    store, togglePresentationMode, toggleSlideToolbar,
    setSlideToolbarPosition, setIsPreviewing, setActiveSlide
} from '../store/app-store';
import { sequenceAnimator } from '../utils/animation/sequence-animator';
import { getElementsOnSlide } from '../utils/slide-utils';
import {
    Zap, GripVertical, X,
    MonitorPlay, ChevronLeft, ChevronRight
} from 'lucide-solid';

export const SlideControlToolbar: Component = () => {
    let toolbarRef: HTMLDivElement | undefined;
    const [isDragging, setIsDragging] = createSignal(false);
    const [slideInput, setSlideInput] = createSignal('');
    let offset = { x: 0, y: 0 };

    // Keep input in sync with active slide
    createEffect(() => {
        setSlideInput(String(store.activeSlideIndex + 1));
    });

    const handlePointerDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
            const rect = toolbarRef!.getBoundingClientRect();
            offset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging()) return;

        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;

        setSlideToolbarPosition(x, y);
    };

    const handlePointerUp = (_: PointerEvent) => {
        setIsDragging(false);
    };

    const handlePlayAnimations = () => {
        const slideElements = getElementsOnSlide(store.activeSlideIndex, store.elements, store.slides);
        const elementIds = slideElements.map(el => el.id);

        // Enable persistent animations for the preview
        setIsPreviewing(true);
        sequenceAnimator.playAll('on-load', elementIds);

        // Auto-disable preview after a reasonable time (e.g. 10s or when stopped)
        // For simplicity, let's just allow it until they interact or mode changes
        setTimeout(() => setIsPreviewing(false), 10000);
    };

    const handleSlideInputCommit = () => {
        const parsed = parseInt(slideInput(), 10);
        if (!isNaN(parsed)) {
            const clamped = Math.max(1, Math.min(parsed, store.slides.length));
            setActiveSlide(clamped - 1);
        }
        // Reset to current value in case of invalid input
        setSlideInput(String(store.activeSlideIndex + 1));
    };

    const handleSlideInputKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSlideInputCommit();
            (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
            setSlideInput(String(store.activeSlideIndex + 1));
            (e.target as HTMLInputElement).blur();
        }
        // Stop propagation so canvas shortcuts don't fire while typing
        e.stopPropagation();
    };

    return (
        <Show when={store.docType === 'slides' && store.showSlideToolbar && store.appMode !== 'presentation'}>
            <div
                ref={toolbarRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                    position: 'fixed',
                    left: `${store.slideToolbarPosition.x}px`,
                    top: `${store.slideToolbarPosition.y}px`,
                    display: 'flex',
                    'align-items': 'center',
                    gap: '4px',
                    padding: '6px',
                    background: 'rgba(255, 255, 255, 0.7)',
                    'backdrop-filter': 'blur(12px) saturate(180%)',
                    '-webkit-backdrop-filter': 'blur(12px) saturate(180%)',
                    'border-radius': '12px',
                    'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    'z-index': '10002',
                    transition: isDragging() ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    cursor: isDragging() ? 'grabbing' : 'default',
                    'user-select': 'none'
                }}
            >
                {/* Drag Handle */}
                <div
                    class="drag-handle"
                    style={{
                        padding: '8px 4px',
                        cursor: 'grab',
                        color: '#94a3b8',
                        display: 'flex',
                        'align-items': 'center'
                    }}
                >
                    <GripVertical size={16} />
                </div>

                {/* Slide Navigation */}
                <div style={{ display: 'flex', 'align-items': 'center', gap: '2px' }}>
                    <ToolbarButton
                        onClick={() => setActiveSlide(store.activeSlideIndex - 1)}
                        icon={<ChevronLeft size={18} />}
                        label="Previous Slide"
                        color="#6366f1"
                        disabled={store.activeSlideIndex === 0}
                    />

                    <div style={{ display: 'flex', 'align-items': 'center', gap: '2px', padding: '0 2px' }}>
                        <input
                            type="text"
                            value={slideInput()}
                            onInput={(e) => setSlideInput(e.currentTarget.value)}
                            onBlur={handleSlideInputCommit}
                            onKeyDown={handleSlideInputKeyDown}
                            onFocus={(e) => e.currentTarget.select()}
                            style={{
                                width: '28px',
                                'text-align': 'center',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                'border-radius': '4px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                padding: '2px 0',
                                'font-size': '13px',
                                color: '#334155',
                                outline: 'none',
                                'font-family': 'inherit'
                            }}
                        />
                        <span style={{
                            'font-size': '13px',
                            color: '#94a3b8',
                            'white-space': 'nowrap'
                        }}>/ {store.slides.length}</span>
                    </div>

                    <ToolbarButton
                        onClick={() => setActiveSlide(store.activeSlideIndex + 1)}
                        icon={<ChevronRight size={18} />}
                        label="Next Slide"
                        color="#6366f1"
                        disabled={store.activeSlideIndex >= store.slides.length - 1}
                    />
                </div>

                {/* Separator */}
                <div style={{
                    width: '1px',
                    height: '20px',
                    background: 'rgba(0, 0, 0, 0.1)',
                    margin: '0 4px'
                }} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: '2px' }}>
                    <ToolbarButton
                        onClick={() => togglePresentationMode(true)}
                        icon={<MonitorPlay size={18} />}
                        label="Play Presentation"
                        color="#3b82f6"
                    />
                    <ToolbarButton
                        onClick={handlePlayAnimations}
                        icon={<Zap size={18} />}
                        label="Preview Animations"
                        color="#f59e0b"
                    />
                </div>

                {/* Close */}
                <button
                    onClick={() => toggleSlideToolbar(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '6px',
                        cursor: 'pointer',
                        'border-radius': '6px',
                        display: 'flex',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 44, 44, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                    <X size={16} />
                </button>
            </div>
        </Show>
    );
};

interface ToolbarButtonProps {
    onClick: () => void;
    icon: any;
    label: string;
    color: string;
    disabled?: boolean;
}

const ToolbarButton: Component<ToolbarButtonProps> = (props) => {
    const [isHovered, setIsHovered] = createSignal(false);

    return (
        <button
            onClick={props.onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            disabled={props.disabled}
            title={props.label}
            style={{
                background: isHovered() && !props.disabled ? 'rgba(0, 0, 0, 0.05)' : 'none',
                border: 'none',
                color: props.disabled ? '#cbd5e1' : isHovered() ? props.color : '#475569',
                padding: '8px',
                'border-radius': '8px',
                cursor: props.disabled ? 'default' : 'pointer',
                display: 'flex',
                'align-items': 'center',
                gap: '8px',
                opacity: props.disabled ? '0.5' : '1',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered() && !props.disabled ? 'translateY(-1px)' : 'none'
            }}
        >
            {props.icon}
        </button>
    );
};
