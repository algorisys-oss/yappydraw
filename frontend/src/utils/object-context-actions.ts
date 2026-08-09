import {
    store, setStore, pushToHistory,
    deleteElements, updateElement, addElement
} from "../store/app-store";
import { mirrorGeometry } from "./geometry-mirror";
import { generateId } from "./id-generator";
import { hitTestElement } from "./hit-testing";
import type { DrawingElement } from "../types";

export const copyToClipboard = async () => {
    if (store.selection.length === 0) return;

    const elementsToCopy = JSON.parse(JSON.stringify(
        store.elements.filter(el => store.selection.includes(el.id))
    ));
    const clipboardData = {
        type: 'yappy-elements',
        elements: elementsToCopy
    };

    try {
        await navigator.clipboard.writeText(JSON.stringify(clipboardData));
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
};

export const cutToClipboard = async () => {
    await copyToClipboard();
    deleteElements(store.selection);
};

// ─── Viewport center helper ──────────────────────────────────────────
const getViewportCenter = () => ({
    x: -store.viewState.panX / store.viewState.scale + (window.innerWidth / 2) / store.viewState.scale,
    y: -store.viewState.panY / store.viewState.scale + (window.innerHeight / 2) / store.viewState.scale,
});

// ─── Paste image from blob (used by paste event + context menu) ──────
export const pasteImageFromBlob = (blob: Blob, offset = { dx: 0, dy: 0 }, position?: { x: number; y: number }): Promise<string | null> => {
    return new Promise((resolve) => {
        // Safety timeout — never hang forever
        const timeout = setTimeout(() => resolve(null), 15000);
        const done = (id: string | null) => { clearTimeout(timeout); resolve(id); };

        const reader = new FileReader();
        reader.onerror = () => done(null);
        reader.onload = (event) => {
            const dataURL = event.target?.result as string;
            if (!dataURL) { done(null); return; }

            const img = new Image();
            // Set handlers BEFORE src to avoid missing synchronous callbacks
            img.onerror = () => done(null);
            img.onload = () => {
                const MAX_DIMENSION = 1500;
                let width = img.width;
                let height = img.height;

                if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    const ratio = width / height;
                    if (width > height) { width = MAX_DIMENSION; height = width / ratio; }
                    else { height = MAX_DIMENSION; width = height * ratio; }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { done(null); return; }

                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataURL = canvas.toDataURL('image/webp', 0.8);

                const VISUAL_MAX = 500;
                let visualW = width;
                let visualH = height;
                if (visualW > VISUAL_MAX || visualH > VISUAL_MAX) {
                    const ratio = visualW / visualH;
                    if (visualW > visualH) { visualW = VISUAL_MAX; visualH = visualW / ratio; }
                    else { visualH = VISUAL_MAX; visualW = visualH * ratio; }
                }

                const anchor = position || getViewportCenter();
                const id = generateId('image');

                addElement({
                    id,
                    type: 'image',
                    x: anchor.x - visualW / 2 + offset.dx,
                    y: anchor.y - visualH / 2 + offset.dy,
                    width: visualW,
                    height: visualH,
                    strokeColor: 'transparent',
                    backgroundColor: 'transparent',
                    fillStyle: 'solid',
                    strokeWidth: 0,
                    strokeStyle: 'solid',
                    roughness: 0,
                    opacity: 100,
                    angle: 0,
                    renderStyle: 'sketch',
                    seed: Math.floor(Math.random() * 2 ** 31),
                    roundness: null,
                    locked: false,
                    link: null,
                    dataURL: compressedDataURL,
                    mimeType: 'image/webp',
                    layerId: store.activeLayerId,
                } as DrawingElement);

                done(id);
            };
            img.src = dataURL;
        };
        reader.readAsDataURL(blob);
    });
};

// ─── Paste plain text as text element ────────────────────────────────
export const pasteAsTextElement = (text: string): void => {
    const defaults = store.defaultElementStyles;
    const fontSize = defaults.fontSize ?? 28;
    const lines = text.split('\n');
    const maxLineLen = Math.max(...lines.map(l => l.length));
    const estimatedWidth = Math.max(100, Math.min(600, maxLineLen * fontSize * 0.6));
    const estimatedHeight = Math.max(fontSize * 1.5, lines.length * fontSize * 1.4);

    const center = getViewportCenter();
    const id = generateId('text');

    addElement({
        id,
        type: 'text',
        x: center.x - estimatedWidth / 2,
        y: center.y - estimatedHeight / 2,
        width: estimatedWidth,
        height: estimatedHeight,
        text,
        strokeColor: defaults.strokeColor ?? '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 0,
        strokeStyle: 'solid',
        roughness: 0,
        opacity: 100,
        angle: 0,
        renderStyle: 'architectural',
        seed: Math.floor(Math.random() * 2 ** 31),
        roundness: null,
        locked: false,
        link: null,
        fontSize,
        fontFamily: defaults.fontFamily ?? 'handwritten',
        layerId: store.activeLayerId,
    } as DrawingElement);

    setStore('selection', [id]);
};

// ─── Remap bindings and relationships for duplicated elements ─────────
export const remapElementBindings = (
    elements: DrawingElement[],
    idMap: Map<string, string>
): DrawingElement[] => {
    return elements.map(el => {
        const updates: Partial<DrawingElement> = {};

        // Remap startBinding if the target is in the selection, clear if not
        if (el.startBinding?.elementId) {
            if (idMap.has(el.startBinding.elementId)) {
                updates.startBinding = {
                    ...el.startBinding,
                    elementId: idMap.get(el.startBinding.elementId)!
                };
            } else {
                updates.startBinding = null;
            }
        }

        // Remap endBinding if the target is in the selection, clear if not
        if (el.endBinding?.elementId) {
            if (idMap.has(el.endBinding.elementId)) {
                updates.endBinding = {
                    ...el.endBinding,
                    elementId: idMap.get(el.endBinding.elementId)!
                };
            } else {
                updates.endBinding = null;
            }
        }

        // Remap boundElements if the referenced connectors are in the selection
        if (el.boundElements && Array.isArray(el.boundElements)) {
            const remappedBound: typeof el.boundElements = [];
            for (const be of el.boundElements) {
                if (idMap.has(be.id)) {
                    remappedBound.push({ ...be, id: idMap.get(be.id)! });
                }
                // Skip bindings to elements not in selection
            }
            updates.boundElements = remappedBound.length > 0 ? remappedBound : null;
        }

        // Remap parentId for mindmap hierarchy
        if (el.parentId && idMap.has(el.parentId)) {
            updates.parentId = idMap.get(el.parentId)!;
        } else if (el.parentId && !idMap.has(el.parentId)) {
            // Parent not in selection, clear parent to avoid broken reference
            updates.parentId = undefined;
        }

        // Remap poolContainerId for pool lane containment
        if (el.poolContainerId && idMap.has(el.poolContainerId)) {
            updates.poolContainerId = idMap.get(el.poolContainerId)!;
        } else if (el.poolContainerId && !idMap.has(el.poolContainerId)) {
            // Pool not in selection, clear containment to avoid broken reference
            updates.poolContainerId = null;
            updates.poolLaneIndex = undefined;
        }

        // Remap groupIds if they are part of the cloned groups
        if (el.groupIds && Array.isArray(el.groupIds)) {
            updates.groupIds = el.groupIds.map((gid: string) =>
                idMap.has(gid) ? idMap.get(gid)! : gid
            );
        }

        return Object.keys(updates).length > 0 ? { ...el, ...updates } : el;
    });
};

// ─── Paste internal Yappy elements ───────────────────────────────────
export const pasteYappyElements = (data: any): void => {
    pushToHistory();

    const center = getViewportCenter();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    data.elements.forEach((el: any) => {
        const w = el.width || 0;
        const h = el.height || 0;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + w);
        maxY = Math.max(maxY, el.y + h);
    });
    const contentCX = minX + (maxX - minX) / 2;
    const contentCY = minY + (maxY - minY) / 2;

    const dx = center.x - contentCX;
    const dy = center.y - contentCY;

    // Build ID mapping and group ID mapping
    const idMap = new Map<string, string>();
    const groupIdMap = new Map<string, string>();
    const batchIds = new Set<string>();

    // Collect all group IDs first
    data.elements.forEach((el: any) => {
        idMap.set(el.id, generateId(el.type, batchIds));
        el.groupIds?.forEach((gid: string) => {
            if (!groupIdMap.has(gid)) {
                groupIdMap.set(gid, generateId('group', batchIds));
            }
        });
    });

    // Merge group mappings into idMap for unified remapping
    groupIdMap.forEach((newId, oldId) => idMap.set(oldId, newId));

    // Create new elements with updated IDs and positions
    let newElements: DrawingElement[] = data.elements.map((el: any) => ({
        ...el,
        id: idMap.get(el.id)!,
        x: el.x + dx,
        y: el.y + dy,
        // controlPoints are absolute canvas coordinates — shift them by the same offset
        controlPoints: el.controlPoints
            ? el.controlPoints.map((cp: any) => ({ x: cp.x + dx, y: cp.y + dy }))
            : undefined,
        layerId: store.activeLayerId,
        groupIds: el.groupIds?.map((gid: string) => groupIdMap.get(gid) ?? gid) ?? [],
        boundElements: el.boundElements ?? null,
        seed: Math.floor(Math.random() * 2147483647)
    }));

    // Remap all bindings and relationships
    newElements = remapElementBindings(newElements, idMap);

    // Add elements to store
    setStore('elements', els => [...els, ...newElements]);
    setStore('selection', newElements.map(el => el.id));
};

// ─── Try parsing text as Yappy JSON, returns true if handled ─────────
const tryPasteYappyJson = (text: string): boolean => {
    try {
        const data = JSON.parse(text);
        if (data.type === 'yappy-elements' && Array.isArray(data.elements)) {
            pasteYappyElements(data);
            return true;
        }
    } catch { /* not JSON */ }
    return false;
};

// ─── Stagger offset for multiple pasted images ─────────────────────
const PASTE_STAGGER = 30;

// ─── Main paste (context menu / programmatic fallback) ───────────────
export const pasteFromClipboard = async () => {
    // 1. Try reading clipboard items for images (async Clipboard API)
    try {
        const items = await navigator.clipboard.read();
        const imageBlobs: Blob[] = [];
        for (const item of items) {
            const imageType = item.types.find((t: string) => t.startsWith('image/'));
            if (imageType) {
                imageBlobs.push(await item.getType(imageType));
            }
        }
        if (imageBlobs.length > 0) {
            const ids: string[] = [];
            for (let i = 0; i < imageBlobs.length; i++) {
                const id = await pasteImageFromBlob(imageBlobs[i], { dx: i * PASTE_STAGGER, dy: i * PASTE_STAGGER });
                if (id) ids.push(id);
            }
            if (ids.length > 0) setStore('selection', ids);
            return;
        }
    } catch { /* clipboard.read() not supported or permission denied */ }

    // 2. Fall back to text
    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        // 3. Try internal Yappy elements
        if (tryPasteYappyJson(text)) return;

        // 4. Plain text → create text element
        pasteAsTextElement(text);
    } catch (err) {
        console.error('Failed to paste:', err);
    }
};

export const flipSelected = (direction: 'horizontal' | 'vertical', axisValue?: number) => {
    if (store.selection.length === 0) return;
    pushToHistory();

    const isMulti = store.selection.length > 1;

    // For multi-selection, determine flip axis (center of selection bounding box)
    let min = Infinity, max = -Infinity;
    if (isMulti) {
        store.elements.forEach(el => {
            if (store.selection.includes(el.id)) {
                if (direction === 'horizontal') {
                    min = Math.min(min, el.x);
                    max = Math.max(max, el.x + el.width);
                } else {
                    min = Math.min(min, el.y);
                    max = Math.max(max, el.y + el.height);
                }
            }
        });
    }
    // Reflection axis: an explicit world value (e.g. the rotation pivot) wins; else the
    // multi-selection bbox centre. When undefined (single element, no axis) the element
    // flips in place about its own centre and isn't repositioned.
    const center = axisValue !== undefined ? axisValue : min + (max - min) / 2;
    const reposition = axisValue !== undefined || isMulti;

    store.selection.forEach(id => {
        const el = store.elements.find(e => e.id === id);
        if (!el) return;

        // Reflecting about the element's own centre is what "flip in place" means, so
        // the single-element case is just a different axis, not a different code path.
        const ownCentre = direction === 'horizontal' ? el.x + el.width / 2 : el.y + el.height / 2;
        const axisWorld = reposition ? center : ownCentre;

        updateElement(id, { seed: el.seed + 1, ...mirrorGeometry(el, direction, axisWorld) }, false);
    });
};

export const lockSelected = (locked: boolean) => {
    store.selection.forEach(id => {
        updateElement(id, { locked });
    });
};

/**
 * Unlocking, without needing to select first.
 *
 * Locking is a one-way door otherwise: hit testing skips locked elements
 * (`canInteractWithElement`), so a locked object can never enter `store.selection`, and
 * Lock/Unlock reads the selection — the command that would free it can never see it. The
 * only way out was Select All (which *does* include locked elements) followed by
 * Ctrl+Shift+L, which nobody discovers. These are the two ways out Illustrator gives you:
 * Object ▸ Unlock All, and picking a specific locked object out of the Layers panel.
 *
 * Both select what they unlock — you almost always locked it to get it out of the way of
 * something else, and are unlocking it because you now want to work on it.
 */

/** Locked elements under a world point, topmost first. Powers the right-click affordance. */
export const lockedElementsAt = (
    worldX: number, worldY: number, tolerance = 4,
): DrawingElement[] => {
    const map = new Map(store.elements.map(e => [e.id, e]));
    const hits: DrawingElement[] = [];
    for (let i = store.elements.length - 1; i >= 0; i--) {
        const el = store.elements[i];
        if (el.locked && hitTestElement(el, worldX, worldY, tolerance, store.elements, map)) hits.push(el);
    }
    return hits;
};

/** Unlock specific elements by id and select them. Returns how many were actually unlocked. */
export const unlockElements = (ids: string[]): number => {
    const locked = store.elements.filter(e => ids.includes(e.id) && e.locked);
    if (locked.length === 0) return 0;
    pushToHistory();
    locked.forEach(el => updateElement(el.id, { locked: false }));
    setStore('selection', locked.map(el => el.id));
    return locked.length;
};

/** Unlock every locked element on the canvas and select them. Returns how many. */
export const unlockAllElements = (): number =>
    unlockElements(store.elements.filter(e => e.locked).map(e => e.id));

/** How many elements are currently locked — for labelling the menu item. */
export const lockedElementCount = (): number => store.elements.filter(e => e.locked).length;

// Style Copy/Paste
let clipboardStyle: any = null;

/** The set of "style" properties copied by copy-style / the eyedropper. */
export const getStyleSnapshot = (el: DrawingElement): Partial<DrawingElement> => ({
    strokeColor: el.strokeColor,
    backgroundColor: el.backgroundColor,
    fillStyle: el.fillStyle,
    strokeWidth: el.strokeWidth,
    strokeStyle: el.strokeStyle,
    roughness: el.roughness,
    opacity: el.opacity,
    fontFamily: el.fontFamily,
    fontSize: el.fontSize,
    fontWeight: el.fontWeight,
    fontStyle: el.fontStyle,
    textAlign: el.textAlign,
    verticalAlign: el.verticalAlign,
    letterSpacing: el.letterSpacing,
    textColor: el.textColor,
    roundness: el.roundness,
    // Gradient Properties
    gradientStart: el.gradientStart,
    gradientEnd: el.gradientEnd,
    gradientDirection: el.gradientDirection,
    gradientStops: el.gradientStops ? JSON.parse(JSON.stringify(el.gradientStops)) : undefined,
    gradientType: el.gradientType,
    gradientHandlePositions: el.gradientHandlePositions ? JSON.parse(JSON.stringify(el.gradientHandlePositions)) : undefined,
    // Mesh gradient
    meshGradient: el.meshGradient ? JSON.parse(JSON.stringify(el.meshGradient)) : undefined,
    // Shadow Properties
    shadowEnabled: el.shadowEnabled,
    shadowColor: el.shadowColor,
    shadowBlur: el.shadowBlur,
    shadowOffsetX: el.shadowOffsetX,
    shadowOffsetY: el.shadowOffsetY,
    // Border & Fill extras
    drawInnerBorder: el.drawInnerBorder,
    innerBorderColor: el.innerBorderColor,
    innerBorderDistance: el.innerBorderDistance,
    strokeLineJoin: el.strokeLineJoin,
    fillDensity: el.fillDensity,
    renderStyle: el.renderStyle,
    // Appearance stack
    appearance: el.appearance ? JSON.parse(JSON.stringify(el.appearance)) : undefined,
    // Motion
    flowAnimation: el.flowAnimation,
    flowSpeed: el.flowSpeed,
    flowStyle: el.flowStyle,
});

export const copyStyle = () => {
    if (store.selection.length !== 1) return;
    const el = store.elements.find(e => e.id === store.selection[0]);
    if (el) clipboardStyle = getStyleSnapshot(el);
};

export const pasteStyle = () => {
    if (!clipboardStyle || store.selection.length === 0) return;
    pushToHistory();
    store.selection.forEach(id => {
        updateElement(id, clipboardStyle);
    });
};
