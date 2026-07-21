/**
 * Image placement + replace actions shared by the toolbar, canvas (double-click), context menu,
 * and property panel. Placing an image with no file yet drops an empty PLACEHOLDER frame the user
 * can fill later; any image (or placeholder) can be replaced in place, keeping id/position/size.
 */
import type { DrawingElement } from "../types";
import { store, addElement, updateElement, setStore, setSelectedTool } from "../store/app-store";
import { generateId } from "./id-generator";
import { openImagePicker } from "./image-io";

const IMAGE_BASE = {
    strokeColor: 'transparent', backgroundColor: 'transparent', fillStyle: 'solid' as const,
    strokeWidth: 0, strokeStyle: 'solid' as const, roughness: 0, opacity: 100, angle: 0,
    renderStyle: 'architectural' as const, roundness: null, locked: false, link: null,
};

/** World coordinates of the current viewport centre (a sensible default drop point). */
export function viewportCenter(): { x: number; y: number } {
    const { scale, panX, panY } = store.viewState;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return { x: (w / 2 - panX) / scale, y: (h / 2 - panY) / scale };
}

/** Drop an empty image placeholder frame (centred on x,y) and select it. Returns the id. */
export function addImagePlaceholder(x?: number, y?: number, w = 260, h = 180): string {
    const c = (x === undefined || y === undefined) ? viewportCenter() : { x, y };
    const id = generateId('image');
    addElement({
        ...IMAGE_BASE, id, type: 'image',
        x: c.x - w / 2, y: c.y - h / 2, width: w, height: h,
        seed: Math.floor(Math.random() * 2 ** 31), layerId: store.activeLayerId,
    } as DrawingElement);
    setStore('selection', [id]);
    // Same reasoning as the upload path: leave the user with a selected frame,
    // not an armed Image tool.
    setSelectedTool('selection');
    return id;
}

/** Replace / fill an existing image (or placeholder) via the file picker, keeping its frame. */
export async function replaceImageOn(id: string): Promise<boolean> {
    const el = store.elements.find(e => e.id === id);
    if (!el || el.type !== 'image') return false;
    const picked = await openImagePicker();
    if (!picked) return false;
    // Keep the element's position/size (the new image fills the existing frame); drop any crop.
    updateElement(id, { dataURL: picked.dataURL, mimeType: picked.mimeType, crop: null }, true);
    return true;
}
