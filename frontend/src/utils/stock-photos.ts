/**
 * Stock photos — search and insert openly-licensed images via the
 * Wikimedia Commons API. No API key needed, anonymous CORS is officially
 * supported (`origin=*`), and images are served from upload.wikimedia.org
 * with open CORS. Results are CC-licensed / public domain; attribution
 * metadata is kept on the inserted element (`link` → file page,
 * `tag` → attribution string).
 */
import { store, setStore, pushToHistory, bumpDirtyRevision } from '../store/app-store';
import { showToast } from '../components/toast';
import type { DrawingElement } from '../types';

export interface StockPhoto {
    id: string;
    title: string;
    /** CORS-friendly preview served from Openverse's own domain */
    thumbnail: string;
    /** Full-size image on the origin host (CORS varies) */
    url: string;
    width: number;
    height: number;
    attribution: string;
    landingUrl: string;
    creator: string;
}

const API = 'https://commons.wikimedia.org/w/api.php';

/** Strip HTML from Commons metadata values (Artist is HTML). */
const stripHtml = (html?: string): string => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || '').trim();
};

export async function searchStockPhotos(query: string, page = 1): Promise<StockPhoto[]> {
    const PAGE_SIZE = 24;
    const params = new URLSearchParams({
        action: 'query',
        generator: 'search',
        gsrsearch: `filetype:bitmap ${query}`,
        gsrnamespace: '6', // File:
        gsrlimit: String(PAGE_SIZE),
        gsroffset: String((page - 1) * PAGE_SIZE),
        prop: 'imageinfo',
        iiprop: 'url|size|extmetadata',
        iiurlwidth: '1280', // rendered width — used for preview AND insertion
        format: 'json',
        origin: '*', // Wikimedia's official anonymous-CORS switch
    });
    let res: Response;
    try {
        res = await fetch(`${API}?${params}`);
    } catch {
        throw new Error('Photo search failed: network error. Check your connection.');
    }
    if (!res.ok) throw new Error(`Photo search failed (${res.status}) — try again in a moment.`);
    const data = await res.json();
    const pages = data?.query?.pages || {};

    return Object.values(pages)
        .map((p: any): StockPhoto | null => {
            const ii = p?.imageinfo?.[0];
            if (!ii?.thumburl) return null;
            const meta = ii.extmetadata || {};
            const creator = stripHtml(meta.Artist?.value);
            const license = stripHtml(meta.LicenseShortName?.value);
            const title = String(p.title || '').replace(/^File:/, '').replace(/\.[a-z]+$/i, '');
            return {
                id: String(p.pageid),
                title,
                thumbnail: ii.thumburl,
                url: ii.url,
                width: ii.width || 1024,
                height: ii.height || 768,
                attribution: [`"${title}"`, creator && `by ${creator}`, license && `(${license})`, 'via Wikimedia Commons']
                    .filter(Boolean).join(' '),
                landingUrl: ii.descriptionurl || ii.url,
                creator,
            };
        })
        .filter((p): p is StockPhoto => p !== null)
        .sort((a, b) => Number(a.id) - Number(b.id));
}

const blobToDataURL = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
});

/** MIME type used when dragging a stock photo result onto the canvas. */
export const STOCK_PHOTO_MIME = 'application/x-yappy-stock-photo';

/** Fetch the photo as a data URL. The sized thumbnail comes first — Commons
 *  originals can be enormous (50MB+), which would bloat the document. */
export async function fetchPhotoData(photo: StockPhoto): Promise<string | null> {
    for (const src of [photo.thumbnail, photo.url]) {
        if (!src) continue;
        try {
            const res = await fetch(src, { mode: 'cors' });
            if (!res.ok) continue;
            const blob = await res.blob();
            if (!blob.type.startsWith('image/')) continue;
            return await blobToDataURL(blob);
        } catch { /* CORS or network — try the next source */ }
    }
    return null;
}

/**
 * Insert a stock photo centered on the active page (or on `at`, a world-space
 * point — used by drag-and-drop). Returns the element id.
 * The element's `link` points to the source page (attribution).
 */
export async function insertStockPhoto(
    photo: StockPhoto,
    at?: { x: number; y: number },
    preloadedDataURL?: string,
): Promise<string | null> {
    if (!preloadedDataURL) showToast('Adding photo…', 'info');
    const dataURL = preloadedDataURL || await fetchPhotoData(photo);
    if (!dataURL) {
        showToast('Could not load that photo — try another', 'error');
        return null;
    }

    const page = store.slides[store.activeSlideIndex];
    const maxW = page ? page.dimensions.width * 0.6 : 512;
    const scale = Math.min(1, maxW / photo.width);
    const w = Math.round(photo.width * scale), h = Math.round(photo.height * scale);
    const x = at ? at.x - w / 2 : page ? page.spatialPosition.x + (page.dimensions.width - w) / 2 : 120;
    const y = at ? at.y - h / 2 : page ? page.spatialPosition.y + (page.dimensions.height - h) / 2 : 120;

    const el: DrawingElement = {
        id: `image-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        type: 'image', x, y, width: w, height: h,
        dataURL, status: 'loaded',
        link: photo.landingUrl,
        tag: photo.attribution || undefined,
        backgroundColor: 'transparent', fillStyle: 'solid',
        strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid',
        opacity: 100, angle: 0, roughness: 0, renderStyle: 'architectural',
        locked: false, layerId: store.activeLayerId || 'default-layer',
        seed: Math.floor(Math.random() * 2 ** 31), roundness: null,
    } as DrawingElement;

    pushToHistory();
    setStore('elements', prev => [...prev, el]);
    setStore('selection', [el.id]);
    bumpDirtyRevision();
    showToast('Photo added', 'success');
    return el.id;
}
