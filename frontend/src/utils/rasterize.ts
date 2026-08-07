/**
 * Object ▸ Rasterize — replace vector artwork with an equivalent bitmap.
 *
 * Lives outside `app-store` on purpose: the raster is produced by
 * `utils/export`, which itself imports the store, so putting the action in the
 * store would close an import cycle. `ai/turntable-ai` sits the same way.
 */
import { batch } from "solid-js";
import { store, setStore, pushToHistory, bumpDirtyRevision } from "../store/app-store";
import { rasterizeElements } from "./export";
import { showToast } from "../components/toast";
import type { DrawingElement } from "../types";

export interface RasterizeOptions {
    /** Pixels per world unit. 1 = screen, 2 = retina (default), 4 = print-ish. */
    scale?: number;
    /** Solid backdrop behind the artwork; omitted (default) keeps transparency. */
    background?: string;
    /** Keep the vector source and place the bitmap on top instead of replacing it. */
    keepSource?: boolean;
}

/**
 * Rasterize the selection (or `ids`) into a single image element.
 *
 * The bitmap replaces its sources in place — same layer, same stacking slot, so
 * nothing jumps in front of or behind its neighbours. Returns the new element's
 * id, or null if nothing could be rasterized.
 */
export const rasterizeSelection = async (
    ids?: string[], options: RasterizeOptions = {},
): Promise<string | null> => {
    const { scale = 2, background, keepSource = false } = options;

    const requested = ids ?? store.selection;
    const idSet = new Set(requested);
    const sources = store.elements.filter(el => idSet.has(el.id));
    if (sources.length === 0) {
        showToast('Select artwork to rasterize', 'info');
        return null;
    }

    const result = await rasterizeElements(sources.map(el => el.id), scale, background);
    if (!result) {
        showToast('Could not rasterize the selection', 'error');
        return null;
    }

    const top = sources[sources.length - 1];   // topmost source in document order

    // Stay in the group only if the group survives — i.e. some member isn't
    // being consumed. Rasterizing a whole group leaves a group of one, so the
    // bitmap comes out ungrouped.
    const sharedGroups = (top.groupIds ?? []).filter(g => sources.every(s => (s.groupIds ?? []).includes(g)));
    const survivingGroups = keepSource
        ? sharedGroups
        : sharedGroups.filter(g => store.elements.some(e => !idSet.has(e.id) && (e.groupIds ?? []).includes(g)));

    const img: DrawingElement = {
        id: `image-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        type: 'image',
        x: result.x, y: result.y, width: result.width, height: result.height,
        dataURL: result.dataURL, status: 'loaded',
        backgroundColor: 'transparent', fillStyle: 'solid',
        strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid',
        // Rotation, opacity and effects are already baked into the pixels.
        opacity: 100, angle: 0, roughness: 0, renderStyle: 'architectural',
        locked: false, layerId: top.layerId,
        seed: Math.floor(Math.random() * 2 ** 31), roundness: null,
        ...(survivingGroups.length ? { groupIds: survivingGroups } : {}),
    } as DrawingElement;

    pushToHistory();
    batch(() => {
        setStore('elements', els => {
            if (keepSource) {
                // Sit directly above the topmost source.
                const at = els.findIndex(el => el.id === top.id);
                if (at === -1) return [...els, img];
                return [...els.slice(0, at + 1), img, ...els.slice(at + 1)];
            }
            const next: DrawingElement[] = [];
            for (const el of els) {
                if (el.id === top.id) next.push(img);          // take the topmost source's slot
                if (!idSet.has(el.id)) next.push(el);
            }
            return next;
        });
        setStore('selection', [img.id]);
    });
    bumpDirtyRevision();

    const px = `${result.pixelWidth}×${result.pixelHeight}`;
    showToast(`Rasterized ${sources.length} object${sources.length === 1 ? '' : 's'} (${px}px)`, 'success');
    return img.id;
};
