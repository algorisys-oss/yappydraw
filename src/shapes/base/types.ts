import type { RoughCanvas } from "roughjs/bin/canvas";
import type { DrawingElement } from "../../types";

export interface RenderContext {
    rc: RoughCanvas;
    ctx: CanvasRenderingContext2D;
    element: DrawingElement;
    isDarkMode: boolean;
    layerOpacity: number;
}

export type RenderStyle = 'architectural' | 'sketch';
