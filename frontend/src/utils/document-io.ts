/**
 * Document (de)serialization shared by the web save/load flow and the desktop bridge.
 * A Yappy document is a `SlideDocument` v4; `.yappy` files are GZIP-compressed JSON of it,
 * `.json` files are the plain JSON.
 */
import { store } from "../store/app-store";
import type { SlideDocument } from "../types/slide-types";
import { effectiveGameScript } from "../game/behaviors-to-script";
import { isSlideDocument, migrateToSlideFormat } from "./migration";

/** Snapshot the current store as a SlideDocument v4 (the on-disk / workspace format). */
export function buildSlideDocument(name = 'Untitled'): SlideDocument {
    return {
        version: 4,
        metadata: { name, updatedAt: new Date().toISOString(), docType: store.docType },
        elements: JSON.parse(JSON.stringify(store.elements)),
        layers: JSON.parse(JSON.stringify(store.layers)),
        slides: JSON.parse(JSON.stringify(store.slides)),
        globalSettings: JSON.parse(JSON.stringify(store.globalSettings)),
        gridSettings: JSON.parse(JSON.stringify(store.gridSettings)),
        states: JSON.parse(JSON.stringify(store.states)),
        symbols: JSON.parse(JSON.stringify(store.symbols)),
        graphicStyles: JSON.parse(JSON.stringify(store.graphicStyles)),
        swatches: JSON.parse(JSON.stringify(store.swatches)),
        artboards: JSON.parse(JSON.stringify(store.artboards)),
        gameScript: effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode),
        sceneBehaviors: store.sceneBehaviors?.length ? JSON.parse(JSON.stringify(store.sceneBehaviors)) : undefined,
        gameVars: store.gameVars?.length ? JSON.parse(JSON.stringify(store.gameVars)) : undefined,
        blueprints: store.blueprints && Object.keys(store.blueprints).length ? JSON.parse(JSON.stringify(store.blueprints)) : undefined,
        gameAuthoringMode: store.gameAuthoringMode === 'code' ? 'code' : undefined,
    };
}

/** Parse a raw document object (any version) into a normalized SlideDocument. */
export function normalizeDocument(data: any): SlideDocument {
    return isSlideDocument(data) ? data : migrateToSlideFormat(data);
}

/** GZIP a string → bytes (the `.yappy` format). */
export async function gzipString(str: string): Promise<Uint8Array> {
    const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** GUNZIP bytes → string. */
export async function gunzipBytes(bytes: Uint8Array): Promise<string> {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
}

/** Decode document bytes (GZIP `.yappy` or plain-JSON `.json`) into a SlideDocument. */
export async function decodeDocumentBytes(bytes: Uint8Array): Promise<SlideDocument> {
    const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
    const text = isGzip ? await gunzipBytes(bytes) : new TextDecoder().decode(bytes);
    return normalizeDocument(JSON.parse(text));
}
