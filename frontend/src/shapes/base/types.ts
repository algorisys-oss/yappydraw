import type { RoughCanvas } from "roughjs/bin/canvas";
import type { DrawingElement } from "../../types";
import type { IRenderer } from "../../rendering/IRenderer";

export interface RenderContext {
    rc: RoughCanvas;
    renderer: IRenderer;
    element: DrawingElement;
    isDarkMode: boolean;
    layerOpacity: number;
    /** Set while capturing a shape's sketch geometry for the drawIn reveal. Labels are
     *  drawn straight to the renderer rather than through `rc`, so without this they'd
     *  paint at full opacity during the capture pass. */
    suppressText?: boolean;
}

export type RenderStyle = 'architectural' | 'sketch';
