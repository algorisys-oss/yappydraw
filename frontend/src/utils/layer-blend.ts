/**
 * Layer blend modes, resolved for the render pipeline.
 *
 * A layer's blend mode applies to every object on it that doesn't set its own. This is the
 * model the rest of Yappy's layers already follow: layer opacity is also applied per object,
 * and exports treat objects, not layers, as the unit. It means canvas and PNG/JPG export stay
 * identical with no separate compositing pass. The one visible difference from Photoshop or
 * Affinity, which flatten a layer before blending it, is where objects on the SAME blended
 * layer overlap: they blend with each other too. For the common case, a texture or shading
 * layer over artwork, the result is the same.
 *
 * The pipeline doesn't import the store (it is shared with the embeddable SDK), so the store
 * registers a lookup here. Without one (the SDK) no layer blending applies.
 */
import type { BlendMode } from '../types';

let resolver: ((layerId: string) => BlendMode | undefined) | null = null;

export function registerLayerBlendResolver(fn: (layerId: string) => BlendMode | undefined): void {
    resolver = fn;
}

/**
 * The composite operation for an element: its own blend mode when it sets one other than
 * Normal, else its layer's. `undefined` means leave the context alone.
 */
export function effectiveBlendMode(el: { blendMode?: BlendMode; layerId?: string }): BlendMode | undefined {
    if (el.blendMode && el.blendMode !== 'normal') return el.blendMode;
    const layerMode = el.layerId && resolver ? resolver(el.layerId) : undefined;
    if (layerMode && layerMode !== 'normal') return layerMode;
    return el.blendMode;
}
