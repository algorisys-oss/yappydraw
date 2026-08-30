/**
 * The Pen's construction overlay — the thin blue path you draw *against*, drawn on top of
 * the artwork while a vector path is being built.
 *
 * Until this existed, the only feedback the Pen gave was the element's own stroke. That is
 * fine when the armed stroke happens to be visible and useless the moment it is not: with
 * the stroke set to None — which is exactly what you do when the goal is a filled shape with
 * no outline — clicking out a path drew literally nothing on screen. "I do not see any path;
 * a blue rubberband kind of thing, like in Adobe software, is very helpful to see what we
 * are creating" (user feedback, Aug 2026).
 *
 * So the overlay is deliberately independent of the element's paint: it is a guide, not a
 * preview of the result, and it is drawn whatever the stroke and fill are set to. Every
 * dimension is divided by `scale` so it stays a constant size in screen pixels at any zoom —
 * a 1px guide that thickens as you zoom in stops reading as a guide.
 */
import { getPathSubpaths, subpathsToPathData } from "../utils/math/path-utils";
import type { PathAnchor } from "../types";

/** The one blue used by every Pen affordance (the resume ring, the anchors, the band). */
export const PEN_GUIDE_BLUE = '#4c8dff';

interface PenPathLike {
    x: number;
    y: number;
    pathSubpaths?: { anchors: PathAnchor[]; closed: boolean }[];
    pathAnchors?: PathAnchor[];
    pathClosed?: boolean;
}

/**
 * Draw the guide for the path currently under construction.
 *
 * `activeAnchor` is the index of the anchor being dragged (-1 when none): its Bézier
 * handles are drawn as arms with round ends, the way a vector editor shows the tangent you
 * are pulling. The trailing anchor is drawn hollow because it is the rubber-band preview —
 * it moves with the cursor and is not committed until the next click.
 */
export function renderPenConstruction(
    ctx: CanvasRenderingContext2D,
    el: PenPathLike,
    scale: number,
    activeAnchor = -1,
): void {
    const subs = getPathSubpaths(el);
    if (!subs.length) return;

    ctx.save();
    ctx.translate(el.x, el.y);            // anchors are stored relative to the element origin
    ctx.setLineDash([]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 1. The path itself, as a hairline. A white casing under the blue keeps it readable
    //    over dark artwork — without it the guide vanishes into anything navy or black,
    //    which is the same failure it exists to fix.
    const d = new Path2D(subpathsToPathData(subs));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 3 / scale;
    ctx.stroke(d);
    ctx.strokeStyle = PEN_GUIDE_BLUE;
    ctx.lineWidth = 1 / scale;
    ctx.stroke(d);

    // 2. Anchors, and the handles of the one being dragged.
    const r = 3 / scale;
    for (const sp of subs) {
        for (let i = 0; i < sp.anchors.length; i++) {
            const a = sp.anchors[i];
            const isLast = i === sp.anchors.length - 1;
            const isActive = i === activeAnchor;

            if (isActive) {
                for (const [hx, hy] of [[a.inX, a.inY], [a.outX, a.outY]] as const) {
                    if (hx === undefined || hy === undefined) continue;
                    if (hx === 0 && hy === 0) continue;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(a.x + hx, a.y + hy);
                    ctx.strokeStyle = PEN_GUIDE_BLUE;
                    ctx.lineWidth = 1 / scale;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(a.x + hx, a.y + hy, r, 0, Math.PI * 2);
                    ctx.fillStyle = PEN_GUIDE_BLUE;
                    ctx.fill();
                }
            }

            // Square anchors, hollow for the uncommitted trailing one.
            const s = r * 2;
            ctx.beginPath();
            ctx.rect(a.x - r, a.y - r, s, s);
            ctx.fillStyle = isLast && !sp.closed ? '#ffffff' : PEN_GUIDE_BLUE;
            ctx.fill();
            ctx.strokeStyle = PEN_GUIDE_BLUE;
            ctx.lineWidth = 1 / scale;
            ctx.stroke();
        }
    }

    ctx.restore();
}
