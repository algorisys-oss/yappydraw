/**
 * Image Crop Overlay Utilities
 * Renders the crop overlay (dimmed area, crop handles) and handles hit-testing for crop handles.
 * Crop rect is in element-local coordinates (0,0 = element top-left, el.width/el.height = bottom-right).
 */

import type { DrawingElement } from '../types';
import { getImage } from './image-cache';

export type CropHandle = 'tl' | 'tr' | 'br' | 'bl' | 'tm' | 'rm' | 'bm' | 'lm' | 'move' | null;

/**
 * Convert element-local crop rect to source image pixel coordinates.
 */
export function cropToSourcePixels(
    crop: { x: number; y: number; width: number; height: number },
    el: DrawingElement,
    img: HTMLImageElement
): { x: number; y: number; width: number; height: number } {
    const sx = img.naturalWidth / el.width;
    const sy = img.naturalHeight / el.height;
    return {
        x: crop.x * sx,
        y: crop.y * sy,
        width: crop.width * sx,
        height: crop.height * sy,
    };
}

/**
 * Convert source image pixel crop to element-local coordinates.
 */
export function sourceToCropLocal(
    sourceCrop: { x: number; y: number; width: number; height: number },
    el: DrawingElement,
    img: HTMLImageElement
): { x: number; y: number; width: number; height: number } {
    const sx = el.width / img.naturalWidth;
    const sy = el.height / img.naturalHeight;
    return {
        x: sourceCrop.x * sx,
        y: sourceCrop.y * sy,
        width: sourceCrop.width * sx,
        height: sourceCrop.height * sy,
    };
}

/**
 * Initialize crop rect for an element — either from existing crop or full element bounds.
 */
export function initCropRect(el: DrawingElement): { x: number; y: number; width: number; height: number } {
    if (el.crop && el.dataURL) {
        const img = getImage(el.dataURL);
        if (img) {
            return sourceToCropLocal(el.crop, el, img);
        }
    }
    // Full element (no crop)
    return { x: 0, y: 0, width: el.width, height: el.height };
}

/**
 * Convert element-local crop rect to final source pixel crop for storage.
 */
export function finalizeCropRect(
    localCrop: { x: number; y: number; width: number; height: number },
    el: DrawingElement
): { x: number; y: number; width: number; height: number } | null {
    if (!el.dataURL) return null;
    const img = getImage(el.dataURL);
    if (!img) return null;

    // If crop covers the full element, return null (no crop needed)
    if (localCrop.x <= 0.5 && localCrop.y <= 0.5 &&
        Math.abs(localCrop.width - el.width) < 1 &&
        Math.abs(localCrop.height - el.height) < 1) {
        return null;
    }

    return cropToSourcePixels(localCrop, el, img);
}

/**
 * Draw the crop overlay on the canvas.
 */
export function renderCropOverlay(
    ctx: CanvasRenderingContext2D,
    el: DrawingElement,
    cropRect: { x: number; y: number; width: number; height: number },
    scale: number
): void {
    const ex = el.x;
    const ey = el.y;

    // Draw the full image (uncropped) with reduced opacity
    if (el.dataURL) {
        const img = getImage(el.dataURL);
        if (img) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.drawImage(img, ex, ey, el.width, el.height);
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
    }

    // Dim overlay — draw dark rectangles around the crop area (the 4 border regions)
    const cx = ex + cropRect.x;
    const cy = ey + cropRect.y;
    const cw = cropRect.width;
    const ch = cropRect.height;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';

    // Top strip
    ctx.fillRect(ex, ey, el.width, cropRect.y);
    // Bottom strip
    ctx.fillRect(ex, cy + ch, el.width, el.height - cropRect.y - ch);
    // Left strip
    ctx.fillRect(ex, cy, cropRect.x, ch);
    // Right strip
    ctx.fillRect(cx + cw, cy, el.width - cropRect.x - cw, ch);

    ctx.restore();

    // Draw the cropped region at full opacity
    if (el.dataURL) {
        const img = getImage(el.dataURL);
        if (img) {
            const sx = img.naturalWidth / el.width;
            const sy = img.naturalHeight / el.height;
            ctx.drawImage(
                img,
                cropRect.x * sx, cropRect.y * sy, cropRect.width * sx, cropRect.height * sy,
                cx, cy, cw, ch
            );
        }
    }

    // Draw crop border
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 / scale;
    ctx.setLineDash([]);
    ctx.strokeRect(cx, cy, cw, ch);

    // Draw inner grid (rule of thirds)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1 / scale;
    // Vertical thirds
    ctx.beginPath();
    ctx.moveTo(cx + cw / 3, cy);
    ctx.lineTo(cx + cw / 3, cy + ch);
    ctx.moveTo(cx + 2 * cw / 3, cy);
    ctx.lineTo(cx + 2 * cw / 3, cy + ch);
    // Horizontal thirds
    ctx.moveTo(cx, cy + ch / 3);
    ctx.lineTo(cx + cw, cy + ch / 3);
    ctx.moveTo(cx, cy + 2 * ch / 3);
    ctx.lineTo(cx + cw, cy + 2 * ch / 3);
    ctx.stroke();

    // Draw 8 crop handles
    const handleSize = 8 / scale;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2 / scale;

    const handles = getCropHandlePositions(cropRect, ex, ey);
    for (const pos of Object.values(handles)) {
        ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
    }

    ctx.restore();
}

/**
 * Get the world-space positions of the 8 crop handles.
 */
function getCropHandlePositions(
    cropRect: { x: number; y: number; width: number; height: number },
    elX: number,
    elY: number
): Record<string, { x: number; y: number }> {
    const cx = elX + cropRect.x;
    const cy = elY + cropRect.y;
    const cw = cropRect.width;
    const ch = cropRect.height;
    return {
        tl: { x: cx, y: cy },
        tr: { x: cx + cw, y: cy },
        br: { x: cx + cw, y: cy + ch },
        bl: { x: cx, y: cy + ch },
        tm: { x: cx + cw / 2, y: cy },
        rm: { x: cx + cw, y: cy + ch / 2 },
        bm: { x: cx + cw / 2, y: cy + ch },
        lm: { x: cx, y: cy + ch / 2 },
    };
}

/**
 * Hit-test crop handles. Returns the handle name or 'move' if inside crop rect, null if outside.
 */
export function hitTestCropHandle(
    worldX: number,
    worldY: number,
    el: DrawingElement,
    cropRect: { x: number; y: number; width: number; height: number },
    scale: number
): CropHandle {
    const threshold = 10 / scale;
    const handles = getCropHandlePositions(cropRect, el.x, el.y);

    // Check handles first (corners, then edges)
    const handleOrder: CropHandle[] = ['tl', 'tr', 'br', 'bl', 'tm', 'rm', 'bm', 'lm'];
    for (const name of handleOrder) {
        const h = handles[name!];
        if (Math.abs(worldX - h.x) < threshold && Math.abs(worldY - h.y) < threshold) {
            return name;
        }
    }

    // Check if inside crop rect (move)
    const cx = el.x + cropRect.x;
    const cy = el.y + cropRect.y;
    if (worldX >= cx && worldX <= cx + cropRect.width &&
        worldY >= cy && worldY <= cy + cropRect.height) {
        return 'move';
    }

    return null;
}

/**
 * Apply a drag delta to the crop rect based on the active handle.
 * Returns a new crop rect clamped to the element bounds.
 */
export function applyCropDrag(
    handle: CropHandle,
    startCrop: { x: number; y: number; width: number; height: number },
    dx: number,
    dy: number,
    elWidth: number,
    elHeight: number,
    minSize = 20
): { x: number; y: number; width: number; height: number } {
    let { x, y, width, height } = startCrop;

    switch (handle) {
        case 'move':
            x += dx;
            y += dy;
            // Clamp position
            x = Math.max(0, Math.min(x, elWidth - width));
            y = Math.max(0, Math.min(y, elHeight - height));
            break;
        case 'tl':
            x += dx;
            y += dy;
            width -= dx;
            height -= dy;
            break;
        case 'tr':
            y += dy;
            width += dx;
            height -= dy;
            break;
        case 'br':
            width += dx;
            height += dy;
            break;
        case 'bl':
            x += dx;
            width -= dx;
            height += dy;
            break;
        case 'tm':
            y += dy;
            height -= dy;
            break;
        case 'rm':
            width += dx;
            break;
        case 'bm':
            height += dy;
            break;
        case 'lm':
            x += dx;
            width -= dx;
            break;
    }

    // Enforce minimum size
    if (width < minSize) {
        if (handle === 'tl' || handle === 'bl' || handle === 'lm') {
            x = x + width - minSize;
        }
        width = minSize;
    }
    if (height < minSize) {
        if (handle === 'tl' || handle === 'tr' || handle === 'tm') {
            y = y + height - minSize;
        }
        height = minSize;
    }

    // Clamp to element bounds
    if (x < 0) { width += x; x = 0; }
    if (y < 0) { height += y; y = 0; }
    if (x + width > elWidth) width = elWidth - x;
    if (y + height > elHeight) height = elHeight - y;

    return { x, y, width, height };
}

/**
 * Constrain a dragged crop rect to a locked aspect ratio (w/h). The corner or
 * edge opposite the dragged handle stays anchored; the rect shrinks to fit
 * element bounds without breaking the ratio.
 */
export function constrainCropToAspect(
    rect: { x: number; y: number; width: number; height: number },
    handle: CropHandle,
    aspect: number,
    elWidth: number,
    elHeight: number,
    minSize = 20
): { x: number; y: number; width: number; height: number } {
    if (!handle || handle === 'move' || aspect <= 0) return rect;
    const { x, y, width, height } = rect;
    const right = x + width, bottom = y + height;
    const cx = x + width / 2, cy = y + height / 2;

    const heightDriven = handle === 'tm' || handle === 'bm';
    let w = heightDriven ? height * aspect : width;
    let h = heightDriven ? height : width / aspect;

    let maxW: number, maxH: number;
    switch (handle) {
        case 'br': maxW = elWidth - x; maxH = elHeight - y; break;
        case 'tr': maxW = elWidth - x; maxH = bottom; break;
        case 'bl': maxW = right; maxH = elHeight - y; break;
        case 'tl': maxW = right; maxH = bottom; break;
        case 'rm': maxW = elWidth - x; maxH = 2 * Math.min(cy, elHeight - cy); break;
        case 'lm': maxW = right; maxH = 2 * Math.min(cy, elHeight - cy); break;
        case 'bm': maxH = elHeight - y; maxW = 2 * Math.min(cx, elWidth - cx); break;
        case 'tm': maxH = bottom; maxW = 2 * Math.min(cx, elWidth - cx); break;
        default: return rect;
    }
    const s = Math.min(1, maxW / w, maxH / h);
    w = Math.max(minSize, w * s);
    h = w / aspect;

    let nx: number, ny: number;
    switch (handle) {
        case 'br': nx = x; ny = y; break;
        case 'tr': nx = x; ny = bottom - h; break;
        case 'bl': nx = right - w; ny = y; break;
        case 'tl': nx = right - w; ny = bottom - h; break;
        case 'rm': nx = x; ny = cy - h / 2; break;
        case 'lm': nx = right - w; ny = cy - h / 2; break;
        case 'bm': nx = cx - w / 2; ny = y; break;
        case 'tm': nx = cx - w / 2; ny = bottom - h; break;
        default: return rect;
    }
    nx = Math.max(0, Math.min(nx, elWidth - w));
    ny = Math.max(0, Math.min(ny, elHeight - h));
    return { x: nx, y: ny, width: w, height: h };
}

/**
 * Get the CSS cursor for a crop handle.
 */
export function getCropHandleCursor(handle: CropHandle): string {
    switch (handle) {
        case 'tl': case 'br': return 'nwse-resize';
        case 'tr': case 'bl': return 'nesw-resize';
        case 'tm': case 'bm': return 'ns-resize';
        case 'lm': case 'rm': return 'ew-resize';
        case 'move': return 'move';
        default: return 'crosshair';
    }
}
