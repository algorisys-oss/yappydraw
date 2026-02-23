import type { ElementType } from "../types";
import type { ShapeRenderer } from "./base/shape-renderer";

class ShapeRegistry {
    private renderers = new Map<ElementType, ShapeRenderer>();

    register(type: ElementType, renderer: ShapeRenderer) {
        this.renderers.set(type, renderer);
    }

    getRenderer(type: ElementType): ShapeRenderer | undefined {
        return this.renderers.get(type);
    }
}

export const shapeRegistry = new ShapeRegistry();
