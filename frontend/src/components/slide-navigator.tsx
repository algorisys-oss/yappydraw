import { For, Show, createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { store, setActiveSlide, addSlide, deleteSlide, duplicateSlide, reorderSlides, insertNewSlide } from "../store/app-store";
import { X, Zap, Copy } from "lucide-solid";
import { SlideTransitionPicker } from "./slide-transition-picker";
import "./slide-navigator.css";

export const SlideNavigator = () => {
    let listContainerRef: HTMLDivElement | undefined;
    const [activePickerIndex, setActivePickerIndex] = createSignal<number | null>(null);
    const [pickerPosition, setPickerPosition] = createSignal({ top: 0, left: 0 });
    const [dragOverIndex, setDragOverIndex] = createSignal<number | null>(null);
    const [draggedIndex, setDraggedIndex] = createSignal<number | null>(null);
    const [contextMenu, setContextMenu] = createSignal<{ visible: boolean; x: number; y: number; index: number } | null>(null);

    // Auto-scroll to active slide in the navigator
    createEffect(() => {
        const idx = store.activeSlideIndex;
        if (!listContainerRef) return;
        const child = listContainerRef.children[idx] as HTMLElement | undefined;
        child?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    const handleDragStart = (e: DragEvent, index: number) => {
        e.dataTransfer!.effectAllowed = "move";
        e.dataTransfer!.setData("text/plain", index.toString());
        setDraggedIndex(index);
    };

    const handleDragOver = (e: DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
        // Prevent highlighting the dragged item itself
        if (draggedIndex() === index) return;
        setDragOverIndex(index);
    };

    const handleDrop = (e: DragEvent, toIndex: number) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer!.getData("text/plain"));
        setDragOverIndex(null);

        if (!isNaN(fromIndex) && fromIndex !== toIndex) {
            reorderSlides(fromIndex, toIndex);
        }
    };

    const handleDragEnd = () => {
        setDragOverIndex(null);
        setDraggedIndex(null);
    };

    const getDragClass = (index: number) => {
        if (dragOverIndex() !== index) return '';
        const from = draggedIndex();
        if (from === null) return '';
        return from < index ? 'drag-over-bottom' : 'drag-over-top';
    };

    const togglePicker = (e: MouseEvent, index: number) => {
        e.stopPropagation();
        if (activePickerIndex() === index) {
            setActivePickerIndex(null);
        } else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setPickerPosition({
                top: rect.top,
                left: rect.right + 10
            });
            setActivePickerIndex(index);
        }
    };

    const handleContextMenu = (e: MouseEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            index: index
        });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    // Close context menu on global click
    onMount(() => {
        document.addEventListener('click', closeContextMenu);
    });

    onCleanup(() => {
        document.removeEventListener('click', closeContextMenu);
    });

    return (
        <Show when={store.docType === 'slides'}>
            <div class="slide-navigator" id="slide-navigator" onClick={() => setActivePickerIndex(null)}>
                <div class="slide-navigator-header">Slides</div>
                <div class="slide-list-container" ref={listContainerRef}>
                    <For each={store.slides}>
                        {(slide, index) => (
                            <div
                                class={`slide-thumbnail-wrapper ${getDragClass(index())}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, index())}
                                onDragOver={(e) => handleDragOver(e, index())}
                                onDrop={(e) => handleDrop(e, index())}
                                onDragEnd={handleDragEnd}
                                onContextMenu={(e) => handleContextMenu(e, index())}
                            >
                                <div class="slide-index">{index() + 1}</div>
                                <div
                                    class={`slide-thumbnail ${store.activeSlideIndex === index() ? 'active' : ''}`}
                                    onClick={() => setActiveSlide(index())}
                                >
                                    <button
                                        class="slide-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete Slide ${index() + 1}?`)) {
                                                deleteSlide(index());
                                            }
                                        }}
                                        title="Delete Slide"
                                    >
                                        <X size={14} />
                                    </button>

                                    <button
                                        class={`transition-toggle-btn ${activePickerIndex() === index() ? 'active' : ''}`}
                                        onClick={(e) => togglePicker(e, index())}
                                        title="Slide Transition"
                                    >
                                        <Zap size={14} />
                                    </button>

                                    <button
                                        class="slide-duplicate-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            duplicateSlide(index());
                                        }}
                                        title="Duplicate Slide"
                                    >
                                        <Copy size={14} />
                                    </button>

                                    <div class="slide-preview">
                                        <Show when={slide.thumbnail} fallback={
                                            <div class="slide-name-tag">{slide.name || `Slide ${index() + 1}`}</div>
                                        }>
                                            <img src={slide.thumbnail} class="slide-thumbnail-img" />
                                        </Show>
                                    </div>
                                </div>

                                <Show when={activePickerIndex() === index()}>
                                    <SlideTransitionPicker
                                        index={index()}
                                        onClose={() => setActivePickerIndex(null)}
                                        position={pickerPosition()}
                                    />
                                </Show>
                            </div>
                        )}
                    </For>
                </div>
                <div class="add-slide-container">
                    <button
                        class="add-slide-btn"
                        onClick={() => addSlide()}
                        title="Add Slide (Ctrl+M)"
                    >
                        <span class="icon">+ Add Slide</span>
                    </button>
                </div>

                <Show when={contextMenu() && contextMenu()!.visible}>
                    <div
                        class="slide-context-menu"
                        style={{
                            top: `${contextMenu()!.y}px`,
                            left: `${contextMenu()!.x}px`
                        }}
                    >
                        <div class="menu-item" onClick={(e) => {
                            console.log('Insert Above clicked');
                            e.stopPropagation();
                            insertNewSlide(contextMenu()!.index, 'before');
                            closeContextMenu();
                        }}>
                            Insert Slide Above
                        </div>
                        <div class="menu-item" onClick={(e) => {
                            console.log('Insert Below clicked');
                            e.stopPropagation();
                            insertNewSlide(contextMenu()!.index, 'after');
                            closeContextMenu();
                        }}>
                            Insert Slide Below
                        </div>
                    </div>
                </Show>
            </div >
        </Show >
    );
};
