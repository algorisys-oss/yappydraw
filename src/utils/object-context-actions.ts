import {
    store, setStore, pushToHistory,
    deleteElements, updateElement, addElement
} from "../store/app-store";
import { normalizePoints } from "./render-element";
import { generateId } from "./id-generator";
import type { DrawingElement } from "../types";

export const copyToClipboard = async () => {
    if (store.selection.length === 0) return;

    const elementsToCopy = store.elements.filter(el => store.selection.includes(el.id));
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
export const pasteImageFromBlob = (blob: Blob, offset = { dx: 0, dy: 0 }): Promise<string | null> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataURL = event.target?.result as string;
            if (!dataURL) { resolve(null); return; }

            const img = new Image();
            img.src = dataURL;
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
                if (!ctx) { resolve(null); return; }

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

                const center = getViewportCenter();
                const id = crypto.randomUUID();

                addElement({
                    id,
                    type: 'image',
                    x: center.x - visualW / 2 + offset.dx,
                    y: center.y - visualH / 2 + offset.dy,
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

                resolve(id);
            };
            img.onerror = () => resolve(null);
        };
        reader.onerror = () => resolve(null);
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
    const id = crypto.randomUUID();

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

        // Remap startBinding if the target is in the selection
        if (el.startBinding?.elementId && idMap.has(el.startBinding.elementId)) {
            updates.startBinding = {
                ...el.startBinding,
                elementId: idMap.get(el.startBinding.elementId)!
            };
        }

        // Remap endBinding if the target is in the selection
        if (el.endBinding?.elementId && idMap.has(el.endBinding.elementId)) {
            updates.endBinding = {
                ...el.endBinding,
                elementId: idMap.get(el.endBinding.elementId)!
            };
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
const pasteYappyElements = (data: any): void => {
    pushToHistory();

    const center = getViewportCenter();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    data.elements.forEach((el: any) => {
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + el.width);
        maxY = Math.max(maxY, el.y + el.height);
    });
    const contentCX = minX + (maxX - minX) / 2;
    const contentCY = minY + (maxY - minY) / 2;

    const dx = center.x - contentCX;
    const dy = center.y - contentCY;

    // Build ID mapping and group ID mapping
    const idMap = new Map<string, string>();
    const groupIdMap = new Map<string, string>();

    // Collect all group IDs first
    data.elements.forEach((el: any) => {
        idMap.set(el.id, generateId(el.type));
        el.groupIds?.forEach((gid: string) => {
            if (!groupIdMap.has(gid)) {
                groupIdMap.set(gid, crypto.randomUUID());
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

export const flipSelected = (direction: 'horizontal' | 'vertical') => {
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
    const center = min + (max - min) / 2;

    store.selection.forEach(id => {
        const el = store.elements.find(e => e.id === id);
        if (!el) return;

        const updates: Record<string, any> = { seed: el.seed + 1 };

        if (direction === 'horizontal') {
            // Reposition for multi-selection
            if (isMulti) {
                const elCenterX = el.x + el.width / 2;
                const dist = elCenterX - center;
                updates.x = center - dist - el.width / 2;
            }

            if (el.points) {
                // Point-based elements: flip the points directly
                const pts = normalizePoints(el.points);
                if (pts.length > 0) {
                    updates.points = pts.map(p => ({ x: el.width - p.x, y: p.y }));
                    updates.pointsEncoding = undefined;
                }
            } else {
                // Shape elements: toggle flipX for canvas-level mirroring
                updates.flipX = !el.flipX;
            }
        } else {
            // Reposition for multi-selection
            if (isMulti) {
                const elCenterY = el.y + el.height / 2;
                const dist = elCenterY - center;
                updates.y = center - dist - el.height / 2;
            }

            if (el.points) {
                const pts = normalizePoints(el.points);
                if (pts.length > 0) {
                    updates.points = pts.map(p => ({ x: p.x, y: el.height - p.y }));
                    updates.pointsEncoding = undefined;
                }
            } else {
                updates.flipY = !el.flipY;
            }
        }

        updateElement(id, updates, false);
    });
};

export const lockSelected = (locked: boolean) => {
    store.selection.forEach(id => {
        updateElement(id, { locked });
    });
};

// Style Copy/Paste
let clipboardStyle: any = null;

export const copyStyle = () => {
    if (store.selection.length !== 1) return;
    const el = store.elements.find(e => e.id === store.selection[0]);
    if (el) {
        clipboardStyle = {
            strokeColor: el.strokeColor,
            backgroundColor: el.backgroundColor,
            fillStyle: el.fillStyle,
            strokeWidth: el.strokeWidth,
            strokeStyle: el.strokeStyle,
            roughness: el.roughness,
            opacity: el.opacity,
            fontFamily: el.fontFamily,
            fontSize: el.fontSize,
            textAlign: el.textAlign,
            roundness: el.roundness,
            // Gradient Properties
            gradientStart: el.gradientStart,
            gradientEnd: el.gradientEnd,
            gradientDirection: el.gradientDirection,
            gradientStops: el.gradientStops ? JSON.parse(JSON.stringify(el.gradientStops)) : undefined,
            gradientType: el.gradientType,
            gradientHandlePositions: el.gradientHandlePositions ? JSON.parse(JSON.stringify(el.gradientHandlePositions)) : undefined,
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
            // Motion
            flowAnimation: el.flowAnimation,
            flowSpeed: el.flowSpeed,
            flowStyle: el.flowStyle
        };
    }
};

export const pasteStyle = () => {
    if (!clipboardStyle || store.selection.length === 0) return;
    pushToHistory();
    store.selection.forEach(id => {
        updateElement(id, clipboardStyle);
    });
};
