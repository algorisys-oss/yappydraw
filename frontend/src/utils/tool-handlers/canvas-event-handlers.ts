/**
 * Canvas Event Handlers
 * Handles drag-and-drop (color/image) and mouse wheel (zoom/pan) events.
 * Extracted from canvas.tsx handleDragOver/handleDrop/handleWheel.
 */

import type { DrawingElement } from '../../types';
import { isPagedDocType } from '../../types/slide-types';
import { store, setViewState, updateElement, pushToHistory, updateSlideBackground, isLayerVisible } from '../../store/app-store';
import { calculateAllAnimatedStates } from '../animation-utils';
import { hitTestElement } from '../hit-testing';
import { screenToWorld } from '../viewport-transforms';
import { calculateUmlClassLayout, calculateUml2SectionLayout } from '../uml-layout-utils';
import { IMAGE_FILL_EXCLUDED } from '../../config/properties';
import { STOCK_PHOTO_MIME, fetchPhotoData, insertStockPhoto, type StockPhoto } from '../stock-photos';
import { STICK_FIGURE_MIME, insertStickFigure, STICK_DEFAULT_WIDTH } from '../../library/stick-figures';
import type { IRenderer } from '../../rendering/IRenderer';

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
    e.preventDefault();
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
    }
}

// ─── Drop Handler ────────────────────────────────────────────────────

export async function handleDrop(e: DragEvent, ctx: CanvasEventContext): Promise<void> {
    // Image file drops are handled by the global capture handler in app.tsx
    // This handler only processes color/URL drops onto canvas elements
    const dt = e.dataTransfer;
    const files = dt?.files;
    const hasFileItems = dt?.items ? Array.from(dt.items).some(item => item.kind === 'file') : false;
    if ((files && files.length > 0) || hasFileItems) {
        const hasImages = files && files.length > 0
            ? Array.from(files).some(f => f.type.startsWith('image/'))
            : hasFileItems; // If items has files, assume images and let global handler sort it out
        if (hasImages) return; // Let global handler handle it
    }

    e.preventDefault();
    e.stopPropagation();

    // Stock-photo drag from the Elements panel: fill the shape/image under the
    // pointer, or insert a new image element at the drop point on a miss.
    const stockJson = dt?.getData(STOCK_PHOTO_MIME);
    if (stockJson) {
        try {
            const photo = JSON.parse(stockJson) as StockPhoto;
            const dataURL = await fetchPhotoData(photo);
            if (!dataURL) return;
            const applied = applyAssetAtClientPoint(e.clientX, e.clientY, dataURL, ctx, { onMiss: 'skip' });
            if (!applied) {
                const { x, y } = ctx.getWorldCoordinates(e.clientX, e.clientY);
                await insertStockPhoto(photo, { x, y }, dataURL);
            }
        } catch { /* malformed drag payload — ignore */ }
        return;
    }

    // Stick-figure drag from the Stick Figures panel: drop as an editable group,
    // centered on the cursor.
    const stickId = dt?.getData(STICK_FIGURE_MIME);
    if (stickId) {
        const TARGET_W = STICK_DEFAULT_WIDTH;
        const TARGET_H = TARGET_W * (260 / 140); // figure viewBox aspect ratio
        const { x, y } = ctx.getWorldCoordinates(e.clientX, e.clientY);
        insertStickFigure(stickId, { x: x - TARGET_W / 2, y: y - TARGET_H / 2, targetWidth: TARGET_W });
        return;
    }

    const data = e.dataTransfer?.getData('text/plain');
    if (!data) return;
    applyAssetAtClientPoint(e.clientX, e.clientY, data, ctx);
}

/**
 * Apply a color/image asset to the element under a client-space point (or the
 * slide background if nothing is hit). Shared by the desktop HTML5 drop handler
 * and the touch/pen ColorDrop drag (drag a palette swatch onto a shape).
 * Returns true if it recognised the data as a color/image (regardless of hit).
 */
export function applyAssetAtClientPoint(
    clientX: number,
    clientY: number,
    data: string,
    ctx: CanvasEventContext,
    opts?: { onMiss?: 'background' | 'skip' },
): boolean {
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

    if (!isColor && !isImage) return false;

    const { x, y } = ctx.getWorldCoordinates(clientX, clientY);
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
            const hitEl = elementMap.get(hitId);
            if (hitEl?.type === 'image') {
                // Dropping onto an existing image element swaps its source
                updateElement(hitId, { dataURL: data });
            } else if (hitEl && IMAGE_FILL_EXCLUDED.includes(hitEl.type as any)) {
                // 3D shapes can't display an image fill — replace with a standalone image
                updateElement(hitId, { type: 'image', dataURL: data });
            } else {
                // Fill the shape with the image, clipped to its outline
                updateElement(hitId, { fillStyle: 'image', backgroundImage: data });
            }
        }
    } else if (opts?.onMiss === 'skip') {
        return false;
    } else if (isPagedDocType(store.docType)) {
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
    return true;
}

// ─── UML Section Scroll Context ──────────────────────────────────────

export interface WheelContext {
    getWorldCoordinates: (cx: number, cy: number) => { x: number; y: number };
    renderer: IRenderer;
}

const TWO_SECTION_UML_TYPES = new Set(['umlInterface', 'umlEnum', 'umlState']);

function handleUmlSectionScroll(e: WheelEvent, ctx: WheelContext): boolean {
    if (e.ctrlKey || e.metaKey) return false;

    const { x, y } = ctx.getWorldCoordinates(e.clientX, e.clientY);

    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (x < el.x || x > el.x + el.width || y < el.y || y > el.y + el.height) continue;

        // 3-section: umlClass
        if (el.type === 'umlClass') {
            const layout = calculateUmlClassLayout(ctx.renderer, el);
            const relY = y - el.y;

            if (relY < layout.headerHeight) return false;

            const multiplier = e.deltaMode === 1 ? 33 : (e.deltaMode === 2 ? 400 : 1);
            const delta = e.deltaY * multiplier * 0.5;

            // Attributes section
            if (relY < layout.headerHeight + layout.attrHeight) {
                if (!layout.attrOverflows) return false;
                const maxScroll = Math.max(0, layout.attrContentHeight - layout.attrHeight);
                const cur = el.umlAttrScrollY || 0;
                const next = Math.max(0, Math.min(maxScroll, cur + delta));
                if (Math.abs(next - cur) > 0.5) {
                    updateElement(el.id, { umlAttrScrollY: next });
                    return true;
                }
                return false;
            }

            // Methods section
            if (!layout.methodsOverflows) return false;
            const maxScroll = Math.max(0, layout.methodsContentHeight - layout.methodsHeight);
            const cur = el.umlMethodsScrollY || 0;
            const next = Math.max(0, Math.min(maxScroll, cur + delta));
            if (Math.abs(next - cur) > 0.5) {
                updateElement(el.id, { umlMethodsScrollY: next });
                return true;
            }
            return false;
        }

        // 2-section: umlInterface, umlEnum, umlState
        if (TWO_SECTION_UML_TYPES.has(el.type)) {
            const bodyProp = el.type === 'umlInterface' ? 'methodsText' : 'attributesText';
            const scrollProp = el.type === 'umlInterface' ? 'umlMethodsScrollY' : 'umlAttrScrollY';
            const layout = calculateUml2SectionLayout(ctx.renderer, el, bodyProp as any);
            const relY = y - el.y;

            if (relY < layout.headerHeight) return false;
            if (!layout.bodyOverflows) return false;

            const multiplier = e.deltaMode === 1 ? 33 : (e.deltaMode === 2 ? 400 : 1);
            const delta = e.deltaY * multiplier * 0.5;
            const maxScroll = Math.max(0, layout.bodyContentHeight - layout.bodyHeight);
            const cur = (el as any)[scrollProp] || 0;
            const next = Math.max(0, Math.min(maxScroll, cur + delta));
            if (Math.abs(next - cur) > 0.5) {
                updateElement(el.id, { [scrollProp]: next });
                return true;
            }
            return false;
        }
    }
    return false;
}

// ─── Wheel Handler (Zoom & Pan) ─────────────────────────────────────

export function handleWheel(e: WheelEvent, wheelCtx?: WheelContext): void {
    if (store.appMode === 'presentation' && isPagedDocType(store.docType)) return;

    // UML section scroll interception
    if (wheelCtx && handleUmlSectionScroll(e, wheelCtx)) {
        e.preventDefault();
        return;
    }

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

        const { x: worldX, y: worldY } = screenToWorld(mouseX, mouseY, store.viewState);

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
