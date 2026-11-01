/**
 * The order a slide's build steps play in: by layer, then by animation index within one element,
 * then by element id. The presentation (slide-build-manager.ts) and the PowerPoint exporter both
 * use this, so a deck builds in the same order in both. Pure.
 */
import type { DrawingElement } from '../types';
import type { ElementAnimation } from '../types/motion-types';

export interface BuildStepRef { elementId: string; animation: ElementAnimation }

export function buildOrder(elements: readonly DrawingElement[], layers: readonly { id: string; order?: number }[]): BuildStepRef[] {
    const steps: BuildStepRef[] = [];
    const byId = new Map(elements.map(e => [e.id, e]));
    for (const el of elements) for (const animation of el.animations ?? []) steps.push({ elementId: el.id, animation });
    const layerOrder = (id: string) => layers.find(l => l.id === id)?.order ?? 0;
    // An explicit order (PowerPoint import) comes first; steps without one follow, by the usual rule.
    const ord = (s: BuildStepRef) => (typeof s.animation.order === 'number' ? s.animation.order : Infinity);
    return steps.sort((a, b) => {
        const oa = ord(a), ob = ord(b);
        if (oa !== ob) return oa - ob;
        const ea = byId.get(a.elementId)!, eb = byId.get(b.elementId)!;
        if (ea.layerId !== eb.layerId) return layerOrder(ea.layerId) - layerOrder(eb.layerId);
        if (a.elementId === b.elementId) return (ea.animations?.indexOf(a.animation) ?? 0) - (eb.animations?.indexOf(b.animation) ?? 0);
        return a.elementId.localeCompare(b.elementId);
    });
}
