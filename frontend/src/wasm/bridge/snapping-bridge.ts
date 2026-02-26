// Phase 4: Snapping bridge — marshals elements to WASM for snap computation
// Element filtering (activeIds, layerId) and guide reconstruction (string IDs)
// stay in JS; the two-pass numeric comparison runs in WASM.

import type { DrawingElement } from '../../types';
import type { SnappingGuide, SnappedResult } from '../../utils/object-snapping';
import { getWasmExports } from './wasm-loader';
import { getElementBufferPtr } from './memory-pool';

const ELEMENT_FIELDS = 6;
const MAX_ELEMENTS = 2048;

/**
 * WASM-accelerated snapping guide computation.
 * Returns null if WASM is unavailable (caller should fall back to JS).
 */
export function wasmGetSnappingGuides(
  activeIds: string[],
  allElements: DrawingElement[],
  dx: number,
  dy: number,
  threshold: number,
): SnappedResult | null {
  const w = getWasmExports();
  if (!w) return null;

  // --- Filter active elements, compute bounding box ---
  const activeIdSet = new Set(activeIds);
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let activeLayer: string | null = null;

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (!activeIdSet.has(el.id)) continue;
    if (activeLayer === null) activeLayer = el.layerId;
    if (el.x < minX) minX = el.x;
    if (el.x + el.width > maxX) maxX = el.x + el.width;
    if (el.y < minY) minY = el.y;
    if (el.y + el.height > maxY) maxY = el.y + el.height;
  }

  if (activeLayer === null) return { dx, dy, guides: [] };

  // Apply current drag delta
  minX += dx;
  maxX += dx;
  minY += dy;
  maxY += dy;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // --- Marshal other elements into elementBuffer ---
  const elemPtr = getElementBufferPtr();
  const mem = w.memory;
  const bufView = new Float64Array(mem.buffer, elemPtr, MAX_ELEMENTS * ELEMENT_FIELDS);
  const otherIds: string[] = [];
  let otherCount = 0;

  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (activeIdSet.has(el.id)) continue;
    if (el.layerId !== activeLayer) continue;
    if (otherCount >= MAX_ELEMENTS) break;

    const base = otherCount * ELEMENT_FIELDS;
    bufView[base]     = el.x;
    bufView[base + 1] = el.y;
    bufView[base + 2] = el.width;
    bufView[base + 3] = el.height;
    bufView[base + 4] = 0.0;
    bufView[base + 5] = 0.0;

    otherIds.push(el.id);
    otherCount++;
  }

  if (otherCount === 0) return { dx, dy, guides: [] };

  // --- Call WASM ---
  const guideCount: number = (w as any).computeSnappingGuides(
    minX, centerX, maxX,
    minY, centerY, maxY,
    elemPtr, otherCount,
    threshold,
  );

  const snappedDx = dx + ((w as any).getSnappingDeltaX() as number);
  const snappedDy = dy + ((w as any).getSnappingDeltaY() as number);

  // --- Read guide results ---
  const guides: SnappingGuide[] = [];
  for (let i = 0; i < guideCount; i++) {
    const elemIndex: number = (w as any).getGuideElementIndex(i);
    const coordinate: number = (w as any).getGuideCoordinate(i);
    const guideType: number = (w as any).getGuideType(i);

    if (elemIndex >= 0 && elemIndex < otherCount) {
      guides.push({
        type: guideType === 0 ? 'vertical' : 'horizontal',
        coordinate,
        elementIds: [otherIds[elemIndex]],
      });
    }
  }

  return { dx: snappedDx, dy: snappedDy, guides };
}
