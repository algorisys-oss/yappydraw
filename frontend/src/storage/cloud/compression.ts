/**
 * Shared GZIP compression utilities for cloud storage.
 *
 * Uses the browser's CompressionStream / DecompressionStream APIs
 * (supported in all modern browsers). These same utilities are used
 * by both the Google Drive provider and the existing FileSystemStorage.
 */

import type { SlideDocument } from '../../types/slide-types';

/**
 * GZIP-compress a SlideDocument into a Blob.
 */
export async function compressDocument(doc: SlideDocument): Promise<Blob> {
    const json = JSON.stringify(doc);
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).blob();
}

/**
 * Decompress a GZIP blob back into a SlideDocument.
 */
export async function decompressToDocument(blob: Blob): Promise<SlideDocument> {
    const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return JSON.parse(text);
}
