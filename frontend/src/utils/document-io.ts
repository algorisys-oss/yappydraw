/**
 * Document (de)serialization shared by every save and load path.
 * A Yappy document is a `SlideDocument` v4; `.yappy` files are GZIP-compressed JSON of it,
 * `.json` files are the plain JSON.
 *
 * `buildSlideDocument` is the ONLY place the live store is snapshotted into a document.
 * Save to file, workspace, gallery/autosave, cloud, templates, the desktop bridge and the
 * API all call it. They used to keep their own field lists, which drifted: Save to file
 * lost the animation timeline and pattern swatches, cloud save lost the game script too.
 * `document-io.test.ts` fails if a second hand-built copy appears.
 */
import { store, saveActiveSlide } from "../store/app-store";
import type { SlideDocument } from "../types/slide-types";
import { effectiveGameScript } from "../game/behaviors-to-script";
import { isSlideDocument, migrateToSlideFormat, getDocumentExtras, CURRENT_DOC_VERSION, DocumentTooNewError } from "./migration";

export { CURRENT_DOC_VERSION, DocumentTooNewError };

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Snapshot the current store as a SlideDocument (the on-disk / workspace format). */
export function buildSlideDocument(name = 'Untitled'): SlideDocument {
    // Sync the canvas background/dimensions into the slides array first.
    saveActiveSlide();
    return {
        // Keys a newer build wrote that this one doesn't know — written back unchanged.
        // Spread first so a known key always comes from the live store.
        ...getDocumentExtras(),
        version: CURRENT_DOC_VERSION,
        metadata: { name, updatedAt: new Date().toISOString(), docType: store.docType },
        elements: copy(store.elements ?? []),
        layers: copy(store.layers ?? []),
        slides: copy(store.slides ?? []),
        globalSettings: copy(store.globalSettings ?? {}),
        gridSettings: copy(store.gridSettings ?? {}),
        guides: copy(store.guides ?? []),
        // `editing` is intentionally dropped — see SlideDocument.symmetry.
        symmetry: {
            mode: store.symmetry.mode, cx: store.symmetry.cx, cy: store.symmetry.cy,
            radialCount: store.symmetry.radialCount, angle: store.symmetry.angle,
            rings: store.symmetry.rings, ringSpacing: store.symmetry.ringSpacing,
        },
        states: copy(store.states ?? []),
        symbols: copy(store.symbols ?? []),
        graphicStyles: copy(store.graphicStyles ?? []),
        swatches: copy(store.swatches ?? []),
        patterns: copy(store.patterns ?? []),
        artboards: copy(store.artboards ?? []),
        dimensionAnnotations: store.dimensionAnnotations?.length ? copy(store.dimensionAnnotations) : undefined,
        compositionTracks: store.compositionTracks?.length ? copy(store.compositionTracks) : undefined,
        tinyflyClips: store.tinyflyClips?.length ? copy(store.tinyflyClips) : undefined,
        animTimeline: store.animTimeline ? copy(store.animTimeline) : undefined,
        // Multi-scene: every scene keyed by slide id (active one folded back in).
        animScenes: store.animTimeline && Object.keys(store.animScenes).length
            ? copy({ ...store.animScenes, [store.slides[store.activeSlideIndex]?.id ?? '']: store.animTimeline })
            : undefined,
        gameScript: effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode),
        sceneBehaviors: store.sceneBehaviors?.length ? copy(store.sceneBehaviors) : undefined,
        gameVars: store.gameVars?.length ? copy(store.gameVars) : undefined,
        blueprints: store.blueprints && Object.keys(store.blueprints).length ? copy(store.blueprints) : undefined,
        gameAuthoringMode: store.gameAuthoringMode === 'code' ? 'code' : undefined,
    };
}

/** Parse a raw document object (any version) into a normalized SlideDocument.
 *  Throws `DocumentTooNewError` for a document from a newer Yappy. */
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
