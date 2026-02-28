import { type Component, Show, For, createMemo, createSignal, onCleanup, createEffect } from "solid-js";
import { store, stopVideoPlayback, updateElement, pushToHistory } from "../store/app-store";
import { X, Lock, LockOpen, GripHorizontal } from "lucide-solid";
import "./video-overlay.css";

/** Single video player overlay — one per playing video */
const SingleVideoOverlay: Component<{ elementId: string }> = (props) => {
    const [isDragging, setIsDragging] = createSignal(false);
    const [debouncedSrc, setDebouncedSrc] = createSignal('');
    const [debouncedIsEmbed, setDebouncedIsEmbed] = createSignal(false);
    let dragStartX = 0, dragStartY = 0;
    let elemStartX = 0, elemStartY = 0;
    let srcDebounceTimer: number | undefined;

    const videoEl = createMemo(() =>
        store.elements.find(e => e.id === props.elementId) || null
    );

    const screenRect = createMemo(() => {
        const el = videoEl();
        if (!el) return null;
        const { scale, panX, panY } = store.viewState;
        return {
            x: el.x * scale + panX,
            y: el.y * scale + panY,
            width: el.width * scale,
            height: el.height * scale,
        };
    });

    const isLocked = createMemo(() => videoEl()?.videoLocked ?? false);

    const rawVideoSrc = createMemo(() => {
        const el = videoEl();
        if (!el) return '';
        if (el.videoProvider === 'youtube' || el.videoProvider === 'vimeo') {
            return el.videoEmbedURL || el.videoURL || '';
        }
        return el.videoURL || '';
    });

    const rawIsEmbed = createMemo(() => {
        const el = videoEl();
        return el?.videoProvider === 'youtube' || el?.videoProvider === 'vimeo';
    });

    // Debounce src to prevent iframe reload on every keystroke
    createEffect(() => {
        const src = rawVideoSrc();
        const embed = rawIsEmbed();
        clearTimeout(srcDebounceTimer);
        srcDebounceTimer = window.setTimeout(() => {
            setDebouncedSrc(src);
            setDebouncedIsEmbed(embed);
        }, 600);
    });

    // Set initial src immediately
    createEffect(() => {
        if (!debouncedSrc() && rawVideoSrc()) {
            setDebouncedSrc(rawVideoSrc());
            setDebouncedIsEmbed(rawIsEmbed());
        }
    });

    // --- Drag handlers ---
    const onDragStart = (e: MouseEvent) => {
        const el = videoEl();
        if (!el || isLocked()) return;
        e.preventDefault();
        e.stopPropagation();
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        elemStartX = el.x;
        elemStartY = el.y;
        setIsDragging(true);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
    };

    const onDragMove = (e: MouseEvent) => {
        const el = videoEl();
        if (!el || !isDragging()) return;
        const dx = (e.clientX - dragStartX) / store.viewState.scale;
        const dy = (e.clientY - dragStartY) / store.viewState.scale;
        updateElement(el.id, { x: elemStartX + dx, y: elemStartY + dy }, false);
    };

    const onDragEnd = () => {
        if (isDragging()) pushToHistory();
        setIsDragging(false);
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
    };

    const toggleLock = () => {
        const el = videoEl();
        if (!el) return;
        updateElement(el.id, { videoLocked: !el.videoLocked }, true);
    };

    const close = () => stopVideoPlayback(props.elementId);

    onCleanup(() => {
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragEnd);
        clearTimeout(srcDebounceTimer);
    });

    return (
        <Show when={videoEl() && screenRect()}>
            <div
                class="video-overlay-container"
                classList={{ dragging: isDragging() }}
                style={{
                    left: `${screenRect()!.x}px`,
                    top: `${screenRect()!.y}px`,
                    width: `${screenRect()!.width}px`,
                }}
            >
                <div
                    class="video-overlay-titlebar"
                    onMouseDown={!isLocked() ? onDragStart : undefined}
                    style={{ cursor: isLocked() ? 'default' : 'grab' }}
                >
                    <Show when={!isLocked()}>
                        <div class="video-overlay-drag-hint">
                            <GripHorizontal size={14} />
                        </div>
                    </Show>
                    <div class="video-overlay-titlebar-spacer" />
                    <button
                        class="video-overlay-titlebar-btn"
                        onClick={toggleLock}
                        title={isLocked() ? 'Unlock position' : 'Lock position'}
                    >
                        {isLocked() ? <Lock size={13} /> : <LockOpen size={13} />}
                    </button>
                    <button
                        class="video-overlay-titlebar-btn"
                        onClick={close}
                        title="Close (Escape)"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div class="video-overlay-content" style={{ height: `${screenRect()!.height}px` }}>
                    <Show when={debouncedSrc()}>
                        <Show when={debouncedIsEmbed()} fallback={
                            <video
                                class="video-overlay-player"
                                src={debouncedSrc()}
                                controls
                                autoplay
                                loop={videoEl()!.videoLoop || false}
                                muted={videoEl()!.videoMuted || false}
                            />
                        }>
                            <iframe
                                src={debouncedSrc()}
                                class="video-overlay-iframe"
                                allow="autoplay; encrypted-media; fullscreen"
                                allowfullscreen
                            />
                        </Show>
                    </Show>
                </div>
            </div>
        </Show>
    );
};

/** Container that renders one overlay per playing video */
const VideoOverlay: Component = () => {
    // Escape closes all playing videos
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && store.activeVideoElementIds.length > 0) {
            stopVideoPlayback(); // stop all
        }
    };

    createEffect(() => {
        if (store.activeVideoElementIds.length > 0) {
            window.addEventListener("keydown", handleKeyDown);
        } else {
            window.removeEventListener("keydown", handleKeyDown);
        }
    });

    onCleanup(() => {
        window.removeEventListener("keydown", handleKeyDown);
    });

    return (
        <For each={store.activeVideoElementIds}>
            {(id) => <SingleVideoOverlay elementId={id} />}
        </For>
    );
};

export default VideoOverlay;
