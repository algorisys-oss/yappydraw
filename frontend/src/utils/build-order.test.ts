import { describe, it, expect } from "bun:test";
import { buildOrder } from "./build-order";

const el = (id: string, layerId: string, anims: any[]) => ({ id, layerId, animations: anims }) as any;
const a = (name: string, order?: number) => ({ id: name, type: 'preset', name, trigger: 'on-click', duration: 1, delay: 0, easing: 'linear', ...(order !== undefined && { order }) });

describe("buildOrder", () => {
    const layers = [{ id: 'L1', order: 0 }, { id: 'L2', order: 1 }];
    it("without an order: layer, then animation index, then element id", () => {
        const steps = buildOrder([el('z', 'L1', [a('z1'), a('z2')]), el('b', 'L2', [a('b1')]), el('a', 'L1', [a('a1')])], layers);
        expect(steps.map(s => (s.animation as any).name)).toEqual(['a1', 'z1', 'z2', 'b1']);
    });
    it("an explicit order (PowerPoint import) wins across objects and layers", () => {
        const steps = buildOrder([el('z', 'L1', [a('z1', 0)]), el('b', 'L2', [a('b1', 1)]), el('a', 'L1', [a('a1', 2)])], layers);
        expect(steps.map(s => (s.animation as any).name)).toEqual(['z1', 'b1', 'a1']);
    });
});
