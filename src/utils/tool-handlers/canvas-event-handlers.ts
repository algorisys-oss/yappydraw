/**
 * Canvas Event Handlers
 * Handles drag-and-drop (color/image) and mouse wheel (zoom/pan) events.
 * Extracted from canvas.tsx handleDragOver/handleDrop/handleWheel.
 */

import type { DrawingElement } from '../../types';
import { store, setViewState, updateElement, pushToHistory, updateSlideBackground, isLayerVisible } from '../../store/app-store';
import { calculateAllAnimatedStates } from '../animation-utils';
import { hitTestElement } from '../hit-testing';

/**
 * Context needed by drop handler from canvas component closures.
 */
export interface CanvasEventContext {
    getWorldCoordinates: (cx: number, cy: number) => { x: number; y: number };
    canInteractWithElement: (el: DrawingElement) => boolean;
    applyMasterProjection: (el: DrawingElement) => DrawingElement;
}

// ─── Drag Over ───────────────────────────────────────────────────────

export function handleDragOver(e: DragEvent): void {
    if (e.dataTransfer) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
}

// ─── Drop Handler ────────────────────────────────────────────────────

export async function handleDrop(e: DragEvent, ctx: CanvasEventContext): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer?.getData('text/plain');
    if (!data) return;

    // Loosened color detection to be very inclusive for various color strings
    const isColor = data.startsWith('color(') ||
        data.startsWith('#') ||
        data.startsWith('rgba(') ||
        data.startsWith('rgb(') ||
        data.startsWith('oklch(') ||
        data.startsWith('hsl(') ||
        data.includes('display-p3') ||
        data.includes('oklch');
    const isImage = data.startsWith('http') || data.startsWith('data:image');

    if (!isColor && !isImage) return;

    const { x, y } = ctx.getWorldCoordinates(e.clientX, e.clientY);
    const threshold = 10 / store.viewState.scale;

    const elementMap = new Map<string, DrawingElement>();
    for (const el of store.elements) elementMap.set(el.id, el);

    const sortedElements = store.elements.map((el, index) => {
        const layer = store.layers.find(l => l.id === el.layerId);
        return { el, index, layerOrder: layer?.order ?? 999, layerVisible: isLayerVisible(el.layerId) };
    }).sort((a, b) => {
        if (a.layerOrder !== b.layerOrder) return b.layerOrder - a.layerOrder;
        return b.index - a.index;
    });

    const currentTime = (window as any).yappyGlobalTime || 0;
    const shouldAnimate = store.appMode === 'presentation' || store.isPreviewing;
    const animatedStates = calculateAllAnimatedStates(store.elements, currentTime, shouldAnimate);

    let hitId: string | null = null;
    for (const { el, layerVisible } of sortedElements) {
        if (!layerVisible || !ctx.canInteractWithElement(el)) continue;
        const animState = animatedStates.get(el.id);
        const testEl = ctx.applyMasterProjection(animState ? { ...el, x: animState.x, y: animState.y, angle: animState.angle } : el);
        if (hitTestElement(testEl, x, y, threshold, store.elements, elementMap)) {
            hitId = el.id;
            break;
        }
    }

    if (hitId) {
        pushToHistory();
        if (isColor) {
            updateElement(hitId, { backgroundColor: data, fillStyle: 'solid' });
        } else if (isImage) {
            updateElement(hitId, { type: 'image', dataURL: data });
        }
    } else if (store.docType === 'slides') {
        // Drop anywhere on the canvas (even outside slide bounds) updates the ACTIVE slide background
        const activeSlideIndex = store.activeSlideIndex;
        if (activeSlideIndex !== -1) {
            pushToHistory();
            if (isColor) {
                updateSlideBackground(activeSlideIndex, {
                    backgroundColor: data,
                    fillStyle: 'solid'
                });
            } else if (isImage) {
                updateSlideBackground(activeSlideIndex, {
                    backgroundImage: data,
                    fillStyle: 'image'
                });
            }
        } else if (store.slides.length > 0) {
            // Fallback to first slide if activeIndex is somehow -1
            pushToHistory();
            if (isColor) updateSlideBackground(0, { backgroundColor: data, fillStyle: 'solid' });
            else if (isImage) updateSlideBackground(0, { backgroundImage: data, fillStyle: 'image' });
        }
    }
}

// ─── Wheel Handler (Zoom & Pan) ─────────────────────────────────────

export function handleWheel(e: WheelEvent): void {
    if (store.appMode === 'presentation' && store.docType === 'slides') return;
    e.preventDefault();

    // Normalize delta values based on deltaMode
    // 0: Pixel, 1: Line, 2: Page
    const multiplier = e.deltaMode === 1 ? 33 : (e.deltaMode === 2 ? 400 : 1);
    const deltaX = e.deltaX * multiplier;
    const deltaY = e.deltaY * multiplier;

    if (e.ctrlKey || e.metaKey) {
        // Zoom Logic
        const zoomSensitivity = 0.001;
        const zoom = 1 - deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(store.viewState.scale * zoom, 0.1), 10);

        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const { scale, panX, panY } = store.viewState;

        const worldX = (mouseX - panX) / scale;
        const worldY = (mouseY - panY) / scale;

        const newPanX = mouseX - worldX * newScale;
        const newPanY = mouseY - worldY * newScale;

        setViewState({ scale: newScale, panX: newPanX, panY: newPanY });
    } else {
        // Pan
        if (e.shiftKey) {
            // Horizontal Scroll
            setViewState({
                panX: store.viewState.panX - (deltaY || deltaX),
                panY: store.viewState.panY
            });
        } else {
            setViewState({
                panX: store.viewState.panX - deltaX,
                panY: store.viewState.panY - deltaY
            });
        }
    }
}
