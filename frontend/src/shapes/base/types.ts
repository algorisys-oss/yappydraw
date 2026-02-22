import type { RoughCanvas } from "roughjs/bin/canvas";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";

export interface RenderContext {
    rc: RoughCanvas;
    renderer: IRenderer;
    element: DrawingElement;
    isDarkMode: boolean;
    layerOpacity: number;
}

export type RenderStyle = 'architectural' | 'sketch';
