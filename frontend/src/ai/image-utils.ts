/**
 * Image Utilities — Preprocessing for Vision API consumption.
 * Resizes, compresses, and converts images to base64 for LLM vision calls.
 */

export interface ProcessedImage {
    /** base64-encoded image data (without the data:image/... prefix) */
    base64: string;
    /** MIME type, e.g. 'image/jpeg' */
    mediaType: string;
    width: number;
    height: number;
}

const MAX_BASE64_BYTES = 4 * 1024 * 1024; // 4MB — safe for all providers

/**
 * Process an image file for vision API consumption.
 * Resizes to maxDimension, compresses to JPEG, returns base64 + metadata.
 * If the result exceeds 4MB, retries at a smaller dimension.
 */
export async function processImageForVision(
    file: File | Blob,
    maxDimension: number = 2048,
): Promise<ProcessedImage> {
    const dataURL = await readFileAsDataURL(file);
    const img = await loadImage(dataURL);

    let result = resizeAndCompress(img, maxDimension);

    // If too large, retry at smaller dimension
    if (result.base64.length > MAX_BASE64_BYTES && maxDimension > 1024) {
        result = resizeAndCompress(img, 1024);
    }

    return result;
}

/**
 * Strip "data:image/...;base64," prefix from a data URL.
 */
export function parseDataURL(dataURL: string): { base64: string; mediaType: string } {
    const match = dataURL.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error('Invalid data URL');
    return { mediaType: match[1], base64: match[2] };
}

// ── Internals ───────────────────────────────────────────────

function readFileAsDataURL(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

function resizeAndCompress(img: HTMLImageElement, maxDim: number): ProcessedImage {
    let { naturalWidth: w, naturalHeight: h } = img;

    // Scale down if needed, preserving aspect ratio
    if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const dataURL = canvas.toDataURL('image/jpeg', 0.85);
    const { base64, mediaType } = parseDataURL(dataURL);

    return { base64, mediaType, width: w, height: h };
}
