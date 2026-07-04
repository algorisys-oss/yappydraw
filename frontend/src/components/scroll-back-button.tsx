/**
 * Scroll-Back Button
 * Shows a floating button when canvas content is out of view.
 * Clicking centers the viewport on content or fits the active slide.
 * Extracted from canvas.tsx.
 */

import { type Component, createEffect, createSignal, Show } from "solid-js";
import { isPagedDocType } from '../types/slide-types';
import { store, setViewState, zoomToFitSlide } from "../store/app-store";

interface ScrollBackButtonProps {
    canvasRef?: HTMLCanvasElement;
}

const ScrollBackButton: Component<ScrollBackButtonProps> = (props) => {
    const [showScrollBack, setShowScrollBack] = createSignal(false);

    // Check if content is visible
    createEffect(() => {
        const { scale, panX, panY } = store.viewState;
        if (!props.canvasRef) {
            setShowScrollBack(false);
            return;
        }

        // Viewport in World Coords
        const vpX = -panX / scale;
        const vpY = -panY / scale;
        const vpW = props.canvasRef.width / scale;
        const vpH = props.canvasRef.height / scale;

        let minX: number, minY: number, maxX: number, maxY: number;

        if (isPagedDocType(store.docType)) {
            // In slide mode, check visibility of the active slide region
            const slide = store.slides[store.activeSlideIndex];
            if (!slide) { setShowScrollBack(false); return; }
            minX = slide.spatialPosition.x;
            minY = slide.spatialPosition.y;
            maxX = minX + slide.dimensions.width;
            maxY = minY + slide.dimensions.height;
        } else {
            // In infinite canvas mode, check visibility of all elements
            if (store.elements.length === 0) { setShowScrollBack(false); return; }
            minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
            store.elements.forEach(el => {
                const x1 = el.x;
                const x2 = el.x + el.width;
                const y1 = el.y;
                const y2 = el.y + el.height;
                minX = Math.min(minX, x1, x2);
                maxX = Math.max(maxX, x1, x2);
                minY = Math.min(minY, y1, y2);
                maxY = Math.max(maxY, y1, y2);
            });
        }

        // Check if Viewport intersects Content
        const isContentVisible = !(minX > vpX + vpW || maxX < vpX || minY > vpY + vpH || maxY < vpY);

        setShowScrollBack(!isContentVisible);
    });

    const handleScrollBack = () => {
        // In slide mode, fit the active slide into view
        if (isPagedDocType(store.docType)) {
            zoomToFitSlide();
            return;
        }

        if (store.elements.length === 0) return;

        // Calculate center of content
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        store.elements.forEach(el => {
            const x1 = el.x;
            const x2 = el.x + el.width;
            const y1 = el.y;
            const y2 = el.y + el.height;

            minX = Math.min(minX, x1, x2);
            maxX = Math.max(maxX, x1, x2);
            minY = Math.min(minY, y1, y2);
            maxY = Math.max(maxY, y1, y2);
        });

        const contentW = maxX - minX;
        const contentH = maxY - minY;
        const contentCX = minX + contentW / 2;
        const contentCY = minY + contentH / 2;

        // Center viewport on content center
        const { scale } = store.viewState;
        const screenCX = window.innerWidth / 2;
        const screenCY = window.innerHeight / 2;

        const newPanX = -contentCX * scale + screenCX;
        const newPanY = -contentCY * scale + screenCY;

        setViewState({ panX: newPanX, panY: newPanY });
    };

    return (
        <Show when={showScrollBack()}>
            <div style={{
                position: 'fixed',
                bottom: store.appMode === 'presentation' && store.docType === 'infinite' && store.showCanvasToolbar ? '100px' : '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                "z-index": 100,
                transition: 'bottom 0.3s ease'
            }}>
                <button
                    onClick={handleScrollBack}
                    style={{
                        "background-color": "white",
                        border: "1px solid #e5e7eb",
                        padding: "8px 16px",
                        "border-radius": "9999px",
                        "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        cursor: "pointer",
                        color: "#3b82f6",
                        "font-weight": "500",
                        "font-size": "14px",
                        transition: "all 0.2s"
                    }}
                >
                    Scroll back to content
                </button>
            </div>
        </Show>
    );
};

export default ScrollBackButton;
