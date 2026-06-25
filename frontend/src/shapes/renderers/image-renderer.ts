import { ShapeRenderer } from "../base/shape-renderer";
import type { RenderContext } from "../base/types";
import type { IRenderer } from "../../rendering/IRenderer";
import { getImage } from "../../utils/image-cache";
import { generatePixelMask, applyPixelMaskToImage } from "../../utils/image-pixel-effects";
import { getEffectiveGrid, meshWarpPoint } from "../../utils/envelope-warp";

type Pt = { x: number; y: number };

/** Affine matrix (canvas `transform` form) mapping source triangle s0..s2 → dest d0..d2. */
function affineFromTriangles(s0: Pt, s1: Pt, s2: Pt, d0: Pt, d1: Pt, d2: Pt) {
    // Solve S·[a c e]ᵀ = dx and S·[b d f]ᵀ = dy, where S rows are [sx, sy, 1].
    const a00 = s0.x, a01 = s0.y, a10 = s1.x, a11 = s1.y, a20 = s2.x, a21 = s2.y;
    const det = a00 * (a11 - a21) - a01 * (a10 - a20) + (a10 * a21 - a20 * a11);
    if (Math.abs(det) < 1e-9) return null;
    const id = 1 / det;
    const i00 = (a11 - a21) * id, i01 = (a21 - a01) * id, i02 = (a01 - a11) * id;
    const i10 = (a20 - a10) * id, i11 = (a00 - a20) * id, i12 = (a10 - a00) * id;
    const i20 = (a10 * a21 - a20 * a11) * id, i21 = (a20 * a01 - a00 * a21) * id, i22 = (a00 * a11 - a10 * a01) * id;
    return {
        a: i00 * d0.x + i01 * d1.x + i02 * d2.x,
        c: i10 * d0.x + i11 * d1.x + i12 * d2.x,
        e: i20 * d0.x + i21 * d1.x + i22 * d2.x,
        b: i00 * d0.y + i01 * d1.y + i02 * d2.y,
        d: i10 * d0.y + i11 * d1.y + i12 * d2.y,
        f: i20 * d0.y + i21 * d1.y + i22 * d2.y,
    };
}

/** Inflate a triangle slightly around its centroid to hide hairline seams between cells. */
function inflate(d0: Pt, d1: Pt, d2: Pt, px = 0.5): [Pt, Pt, Pt] {
    const gx = (d0.x + d1.x + d2.x) / 3, gy = (d0.y + d1.y + d2.y) / 3;
    const out = (p: Pt): Pt => {
        const dx = p.x - gx, dy = p.y - gy, len = Math.hypot(dx, dy) || 1;
        return { x: p.x + (dx / len) * px, y: p.y + (dy / len) * px };
    };
    return [out(d0), out(d1), out(d2)];
}

export class ImageRenderer extends ShapeRenderer {
    protected renderArchitectural(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    protected renderSketch(context: RenderContext, _cx: number, _cy: number): void {
        this.renderCommon(context);
    }

    private renderCommon(context: RenderContext): void {
        const { renderer, element: el } = context;
        if (!el.dataURL) return;

        const img = getImage(el.dataURL);
        if (img) {
            // Envelope / mesh warp: texture-map the bitmap through the control grid.
            if (el.warp && this.renderWarped(context, img)) {
                return;
            }
            // Check if pixel effect is active
            if (el.pixelEffect && el.pixelEffectProgress !== undefined) {
                this.renderWithPixelEffect(context, img);
            } else {
                // Normal rendering without pixel effects
                if (el.crop) {
                    // Draw cropped region: source rect → destination rect
                    renderer.drawImageCropped(
                        img,
                        el.crop.x, el.crop.y, el.crop.width, el.crop.height,
                        el.x, el.y, el.width, el.height
                    );
                } else {
                    renderer.drawImage(img, el.x, el.y, el.width, el.height);
                }
            }
        } else {
            // Placeholder while loading
            renderer.save();
            renderer.fillStyle = "#e5e5e5";
            renderer.fillRect(el.x, el.y, el.width, el.height);
            renderer.fillStyle = "#999";
            renderer.font = "12px sans-serif";
            renderer.fillText("Loading image...", el.x + 10, el.y + 20);
            renderer.restore();
        }
    }

    /**
     * Warp the image through its `el.warp` mesh by tessellating a fine triangle grid and
     * affine-mapping each source-image triangle onto its warped destination triangle.
     * Returns false (caller falls back to a normal draw) if the canvas ctx isn't available.
     */
    private renderWarped(context: RenderContext, img: HTMLImageElement): boolean {
        const { renderer, element: el } = context;
        const ctx: CanvasRenderingContext2D | undefined = (renderer as any).ctx;
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) return false;
        const grid = getEffectiveGrid(el.warp);
        if (!grid) return false;

        const w = el.width, h = el.height, mw = w / 2, mh = h / 2;
        const cx = el.x + mw, cy = el.y + mh;
        const srcX = el.crop?.x ?? 0, srcY = el.crop?.y ?? 0;
        const srcW = el.crop?.width ?? (img.naturalWidth || img.width);
        const srcH = el.crop?.height ?? (img.naturalHeight || img.height);

        // Tessellate the unit square; warp each vertex (dest in world coords, pre-CTM).
        const N = 24;
        const src: Pt[] = [], dest: Pt[] = [];
        for (let j = 0; j <= N; j++) {
            for (let i = 0; i <= N; i++) {
                const u = i / N, v = j / N;
                src.push({ x: srcX + u * srcW, y: srcY + v * srcH });
                const wc = meshWarpPoint(u * w - mw, v * h - mh, w, h, grid);
                dest.push({ x: cx + wc.x, y: cy + wc.y });
            }
        }
        const idx = (i: number, j: number) => j * (N + 1) + i;
        const drawTri = (s0: Pt, s1: Pt, s2: Pt, d0: Pt, d1: Pt, d2: Pt) => {
            const m = affineFromTriangles(s0, s1, s2, d0, d1, d2);
            if (!m) return;
            const [e0, e1, e2] = inflate(d0, d1, d2);
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(e0.x, e0.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.closePath();
            ctx.clip();
            ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
            ctx.drawImage(img, 0, 0);
            ctx.restore();
        };
        for (let j = 0; j < N; j++) {
            for (let i = 0; i < N; i++) {
                const a = idx(i, j), b = idx(i + 1, j), c = idx(i + 1, j + 1), d = idx(i, j + 1);
                drawTri(src[a], src[b], src[c], dest[a], dest[b], dest[c]);
                drawTri(src[a], src[c], src[d], dest[a], dest[c], dest[d]);
            }
        }
        return true;
    }

    private renderWithPixelEffect(context: RenderContext, img: HTMLImageElement): void {
        const { renderer, element: el } = context;

        // Get the underlying canvas context (only works with canvas renderer)
        const ctx = (renderer as any).ctx;
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
            // Fallback to normal rendering if not canvas
            renderer.drawImage(img, el.x, el.y, el.width, el.height);
            return;
        }

        try {
            // Create temporary canvas for processing
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = Math.floor(el.width);
            tempCanvas.height = Math.floor(el.height);
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) return;

            // Draw image to temp canvas (with crop if specified)
            if (el.crop) {
                tempCtx.drawImage(
                    img,
                    el.crop.x, el.crop.y, el.crop.width, el.crop.height,
                    0, 0, tempCanvas.width, tempCanvas.height
                );
            } else {
                tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            }

            // Get image data
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            // Generate pixel mask based on effect type and progress
            const maskData = generatePixelMask(
                tempCanvas.width,
                tempCanvas.height,
                el.pixelEffectProgress ?? 0,
                el.pixelEffect!,
                el.pixelEffectParams
            );

            // Apply mask to image
            const maskedImage = applyPixelMaskToImage(imageData, maskData);

            // Put masked image back
            tempCtx.putImageData(maskedImage, 0, 0);

            // Draw to main canvas
            ctx.drawImage(tempCanvas, el.x, el.y);

        } catch (error) {
            console.error('Error applying pixel effect:', error);
            // Fallback to normal rendering
            renderer.drawImage(img, el.x, el.y, el.width, el.height);
        }
    }

    protected definePath(renderer: IRenderer, el: any): void {
        renderer.rect(el.x, el.y, el.width, el.height);
    }
}
