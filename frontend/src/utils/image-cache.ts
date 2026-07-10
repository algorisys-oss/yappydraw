
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

/**
 * Ensure every given image dataURL is decoded and in the cache before rendering — used by the
 * exporters, which render synchronously and would otherwise draw nothing for images that aren't
 * already cached (off-screen, just added, or a freshly-loaded document). Resolves when all are
 * ready (or failed). Safe to call with duplicates / falsy entries.
 */
export const preloadImages = async (urls: (string | undefined | null)[]): Promise<void> => {
    const unique = Array.from(new Set(urls.filter((u): u is string => !!u)));
    await Promise.all(unique.map(url => new Promise<void>((resolve) => {
        if (imageCache.has(url)) return resolve();
        const img = new Image();
        img.onload = () => { imageCache.set(url, img); pendingImages.delete(url); resolve(); };
        img.onerror = () => { pendingImages.delete(url); resolve(); };
        img.src = url;
    })));
};
