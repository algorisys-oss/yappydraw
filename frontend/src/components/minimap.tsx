import { createEffect, onCleanup, onMount } from 'solid-js';
import { store, setViewState, toggleMinimap } from '../store/app-store';
import { X } from 'lucide-solid';
import { renderElement, normalizePoints } from '../utils/render-element';
import rough from 'roughjs';
import type { RoughCanvas } from 'roughjs/bin/canvas';

interface MinimapProps {
    canvasWidth: number;
    canvasHeight: number;
}

export const Minimap = (props: MinimapProps) => {
    let canvasRef: HTMLCanvasElement | undefined;
    let containerRef: HTMLDivElement | undefined;
    let isDragging = false;

    const MINIMAP_WIDTH = 200;
    const MINIMAP_HEIGHT = 150;
    const PADDING = 10;

    // Calculate bounding box of all elements
    const getContentBounds = () => {
        if (store.elements.length === 0) {
            // Default bounds if no elements
            return { minX: 0, minY: 0, maxX: 1000, maxY: 800, width: 1000, height: 800 };
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        store.elements.forEach(el => {
            minX = Math.min(minX, el.x);
            maxX = Math.max(maxX, el.x + el.width);
            minY = Math.min(minY, el.y);
            maxY = Math.max(maxY, el.y + el.height);
        });

        // Add padding around content
        const paddingWorld = 50;
        minX -= paddingWorld;
        minY -= paddingWorld;
        maxX += paddingWorld;
        maxY += paddingWorld;

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    };

    // Calculate scale to fit content in minimap
    const getMinimapScale = (bounds: ReturnType<typeof getContentBounds>) => {
        const scaleX = (MINIMAP_WIDTH - PADDING * 2) / bounds.width;
        const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / bounds.height;
        return Math.min(scaleX, scaleY);
    };

    // Render minimap
    const renderMinimap = (rc: RoughCanvas) => {
        if (!canvasRef) return;

        const ctx = canvasRef.getContext('2d');
        if (!ctx) return;

        const bounds = getContentBounds();
        const scale = getMinimapScale(bounds);

        // Clear canvas
        ctx.clearRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Fill background — use actual stored color, not theme-dependent
        let bgColor = store.canvasBackgroundColor;
        if (!bgColor) {
            bgColor = "#fafafa";
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, MINIMAP_WIDTH, MINIMAP_HEIGHT);

        // Save context
        ctx.save();

        // Transform to minimap space
        ctx.translate(PADDING, PADDING);
        ctx.scale(scale, scale);
        ctx.translate(-bounds.minX, -bounds.minY);

        // Render elements using the same utility as the main canvas
        store.elements.forEach(el => {
            // Hidden in the object tree — the minimap is a picture of the canvas,
            // so it must not show what the canvas doesn't.
            if (el.visible === false) return;
            const layer = store.layers.find(l => l.id === el.layerId);
            if (!layer?.visible) return;

            renderElement(rc, ctx, el, store.theme !== 'light', layer?.opacity ?? 1);
        });

        ctx.restore();

        // Draw viewport rectangle
        const viewportWorldX = -store.viewState.panX / store.viewState.scale;
        const viewportWorldY = -store.viewState.panY / store.viewState.scale;
        const viewportWorldWidth = props.canvasWidth / store.viewState.scale;
        const viewportWorldHeight = props.canvasHeight / store.viewState.scale;

        // Convert to minimap space
        const vx = (viewportWorldX - bounds.minX) * scale + PADDING;
        const vy = (viewportWorldY - bounds.minY) * scale + PADDING;
        const vw = viewportWorldWidth * scale;
        const vh = viewportWorldHeight * scale;

        ctx.save();
        ctx.strokeStyle = store.theme !== 'light' ? '#60a5fa' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.fillStyle = store.theme !== 'light' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(vx, vy, vw, vh);
        ctx.strokeRect(vx, vy, vw, vh);
        ctx.restore();
    };

    // Handle click to navigate
    const handleClick = (e: MouseEvent) => {
        if (isDragging) return;

        const rect = canvasRef?.getBoundingClientRect();
        if (!rect) return;

        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const bounds = getContentBounds();
        const scale = getMinimapScale(bounds);

        // Convert click to world coordinates
        const worldX = (clickX - PADDING) / scale + bounds.minX;
        const worldY = (clickY - PADDING) / scale + bounds.minY;

        // Pan viewport to center on clicked position
        setViewState({
            panX: -worldX * store.viewState.scale + props.canvasWidth / 2,
            panY: -worldY * store.viewState.scale + props.canvasHeight / 2
        });
    };

    // Handle drag viewport
    const handlePointerDown = (e: PointerEvent) => {
        if (!canvasRef) return;
        const rect = canvasRef.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const bounds = getContentBounds();
        const scale = getMinimapScale(bounds);

        // Check if click is inside viewport rect
        const viewportWorldX = -store.viewState.panX / store.viewState.scale;
        const viewportWorldY = -store.viewState.panY / store.viewState.scale;
        const viewportWorldWidth = props.canvasWidth / store.viewState.scale;
        const viewportWorldHeight = props.canvasHeight / store.viewState.scale;

        const vx = (viewportWorldX - bounds.minX) * scale + PADDING;
        const vy = (viewportWorldY - bounds.minY) * scale + PADDING;
        const vw = viewportWorldWidth * scale;
        const vh = viewportWorldHeight * scale;

        if (clickX >= vx && clickX <= vx + vw && clickY >= vy && clickY <= vy + vh) {
            isDragging = true;
            canvasRef.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging || !canvasRef) return;

        const rect = canvasRef.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const bounds = getContentBounds();
        const scale = getMinimapScale(bounds);

        // Convert to world coordinates
        const worldX = (x - PADDING) / scale + bounds.minX;
        const worldY = (y - PADDING) / scale + bounds.minY;

        // Update viewport
        setViewState({
            panX: -worldX * store.viewState.scale + props.canvasWidth / 2,
            panY: -worldY * store.viewState.scale + props.canvasHeight / 2
        });
    };

    const handlePointerUp = (e: PointerEvent) => {
        if (isDragging && canvasRef) {
            canvasRef.releasePointerCapture(e.pointerId);
            isDragging = false;
        }
    };


    // Auto-update on changes
    createEffect(() => {
        if (!canvasRef) return;
        const rc = rough.canvas(canvasRef);

        // Track everything for real-time updates
        // Accessing store.elements and their internal properties ensures reactivity
        const track = () => {
            store.elements.forEach(el => {
                el.points?.length;
                el.x; el.y; el.width; el.height;
                el.opacity; el.layerId; el.visible;
                el.strokeColor; el.backgroundColor; el.renderStyle;
                // Add points content tracking if needed
                // Add points content tracking if needed
                if (el.points) {
                    const pts = normalizePoints(el.points);
                    if (pts.length > 0) {
                        const last = pts[pts.length - 1];
                        last.x; last.y;
                    }
                }
            });
            store.viewState.panX; store.viewState.panY; store.viewState.scale;
            store.theme;
            store.layers.forEach(l => { l.visible; l.opacity; });
        };

        track();

        // Use requestAnimationFrame for smooth and batched updates
        const handle = requestAnimationFrame(() => renderMinimap(rc));
        onCleanup(() => cancelAnimationFrame(handle));
    });

    onMount(() => {
        if (canvasRef) {
            canvasRef.addEventListener('click', handleClick);
            canvasRef.addEventListener('pointerdown', handlePointerDown);
            canvasRef.addEventListener('pointermove', handlePointerMove);
            canvasRef.addEventListener('pointerup', handlePointerUp);
            canvasRef.addEventListener('pointercancel', handlePointerUp);
        }

        onCleanup(() => {
            if (canvasRef) {
                canvasRef.removeEventListener('click', handleClick);
                canvasRef.removeEventListener('pointerdown', handlePointerDown);
                canvasRef.removeEventListener('pointermove', handlePointerMove);
                canvasRef.removeEventListener('pointerup', handlePointerUp);
                canvasRef.removeEventListener('pointercancel', handlePointerUp);
            }
        });

        if (canvasRef) {
            const rc = rough.canvas(canvasRef);
            renderMinimap(rc);
        }
    });

    return (
        <div ref={containerRef} class="minimap-container">
            <div class="minimap-header">
                <span class="minimap-title">Navigator</span>
                <button
                    class="minimap-close"
                    onClick={() => toggleMinimap(false)}
                    title="Close minimap (Alt+M)"
                >
                    <X size={14} />
                </button>
            </div>
            <canvas
                ref={canvasRef}
                width={MINIMAP_WIDTH}
                height={MINIMAP_HEIGHT}
                class="minimap-canvas"
            />
        </div>
    );
};
