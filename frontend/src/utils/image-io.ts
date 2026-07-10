/**
 * Shared image picking + compression, callable from anywhere (toolbar, canvas double-click,
 * context menu, property panel) — so "add / replace image" has one implementation.
 */

export interface PickedImage {
    dataURL: string;      // compressed webp data URL
    mimeType: string;     // 'image/webp'
    width: number;        // intrinsic (compressed) pixel width
    height: number;       // intrinsic (compressed) pixel height
    visualW: number;      // suggested on-canvas width (capped)
    visualH: number;      // suggested on-canvas height
}

const MAX_DIMENSION = 1500; // downscale huge uploads before storing
const VISUAL_MAX = 500;     // default on-canvas size cap

/** Compress a raw image data URL to webp and compute intrinsic + suggested visual size. */
export function compressImageDataUrl(rawDataUrl: string): Promise<PickedImage | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width, height = img.height;
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                const ratio = width / height;
                if (width > height) { width = MAX_DIMENSION; height = width / ratio; }
                else { height = MAX_DIMENSION; width = height * ratio; }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0, width, height);
            const dataURL = canvas.toDataURL('image/webp', 0.8);
            let visualW = width, visualH = height;
            if (visualW > VISUAL_MAX || visualH > VISUAL_MAX) {
                const ratio = visualW / visualH;
                if (visualW > visualH) { visualW = VISUAL_MAX; visualH = visualW / ratio; }
                else { visualH = VISUAL_MAX; visualW = visualH * ratio; }
            }
            resolve({ dataURL, mimeType: 'image/webp', width, height, visualW, visualH });
        };
        img.onerror = () => resolve(null);
        img.src = rawDataUrl;
    });
}

/**
 * Open the native file picker and return the picked+compressed image, or null if cancelled.
 * Self-contained (temporary input), so any component can call it.
 */
export function openImagePicker(): Promise<PickedImage | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        let settled = false;
        const done = (v: PickedImage | null) => { if (settled) return; settled = true; input.remove(); resolve(v); };
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return done(null);
            const reader = new FileReader();
            reader.onload = (e) => { compressImageDataUrl(e.target?.result as string).then(done); };
            reader.onerror = () => done(null);
            reader.readAsDataURL(file);
        });
        // Modern browsers fire `cancel` when the dialog is dismissed with no selection.
        input.addEventListener('cancel', () => done(null));
        document.body.appendChild(input);
        input.click();
    });
}
