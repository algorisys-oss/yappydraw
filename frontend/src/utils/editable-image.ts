/**
 * Editable images from the live drawing: render it as an SVG or PNG and embed the drawing
 * inside (see `embedded-scene.ts` for the file format). Used by the VS Code editor to save
 * `.yappy.svg` / `.yappy.png` files and by `Yappy.exportEditableImage`.
 */
import { buildSlideDocument, gzipString, decodeDocumentBytes } from './document-io';
import { embedSceneInPng, embedSceneInSvg, extractScene } from './embedded-scene';
import { renderSvgString, renderPngCanvas } from './export';
import { loadDocument } from '../store/app-store';

/** The current drawing as `.yappy` bytes (gzip-compressed SlideDocument JSON). */
export async function currentDrawingBytes(name = 'Untitled'): Promise<Uint8Array> {
    return gzipString(JSON.stringify(buildSlideDocument(name)));
}

/**
 * The drawing as an image that carries the drawing. SVG is the vector export; PNG is the PNG
 * export at 2×, on the document background. An empty drawing still yields a valid (1×1) image,
 * so the file always displays.
 */
export async function renderEditableImage(kind: 'svg' | 'png', name = 'Untitled'): Promise<Uint8Array> {
    const yappy = await currentDrawingBytes(name);
    if (kind === 'svg') {
        const svg = renderSvgString(false) ?? '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
        return new TextEncoder().encode(embedSceneInSvg(svg, yappy));
    }
    let canvas = await renderPngCanvas(2, true, false);
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
    }
    const blob = await new Promise<Blob | null>(res => canvas!.toBlob(res, 'image/png'));
    if (!blob) throw new Error('Could not render the PNG.');
    return embedSceneInPng(new Uint8Array(await blob.arrayBuffer()), yappy);
}

/**
 * Open the drawing inside an editable SVG/PNG, replacing the current document. Resolves false
 * when the image carries no drawing (nothing is changed then).
 */
export async function openEditableImage(bytes: Uint8Array): Promise<boolean> {
    const scene = extractScene(bytes);
    if (!scene) return false;
    loadDocument(await decodeDocumentBytes(scene));
    return true;
}
