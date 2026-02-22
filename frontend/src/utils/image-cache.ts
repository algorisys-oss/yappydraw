
const imageCache = new Map<string, HTMLImageElement>();
const pendingImages = new Set<string>();
let onImageLoadCallback: (() => void) | null = null;

export const setImageLoadCallback = (callback: () => void) => {
    onImageLoadCallback = callback;
};

export const getImage = (dataURL: string): HTMLImageElement | null => {
    if (imageCache.has(dataURL)) {
        return imageCache.get(dataURL)!;
    }

    if (!pendingImages.has(dataURL)) {
        pendingImages.add(dataURL);
        const img = new Image();
        img.src = dataURL;
        img.onload = () => {
            imageCache.set(dataURL, img);
            pendingImages.delete(dataURL);
            // Trigger redraw when image loads
            if (onImageLoadCallback) {
                onImageLoadCallback();
            }
        };
        img.onerror = () => {
            pendingImages.delete(dataURL);
        };
    }

    return null;
};
