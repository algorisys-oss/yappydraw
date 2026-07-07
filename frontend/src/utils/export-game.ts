/**
 * Export the current document as a self-contained, playable HTML file.
 *
 * Shared by the menu's "Export HTML" and the game-mode bar's Export button so both
 * produce an identical build. For games this bakes in the *effective* game script
 * — `effectiveGameScript` compiles the visual behaviors AND the Blueprint graphs —
 * plus the player runtime (via `exportToHtml`), so a Blueprint game exports exactly
 * like a code game.
 */

import { store, saveActiveSlide } from '../store/app-store';
import { effectiveGameScript } from '../game/behaviors-to-script';
import { exportToHtml } from './export-to-html';
import type { SlideDocument } from '../types/slide-types';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** Build the current scene into a SlideDocument (game script + blueprints compiled
 *  in) and download it as an HTML file named `name`. */
export async function exportSceneAsHtml(name: string): Promise<void> {
    saveActiveSlide(); // flush any in-progress edits into the active slide
    const doc: SlideDocument = {
        version: 4,
        metadata: { name, updatedAt: new Date().toISOString(), docType: store.docType },
        elements: clone(store.elements),
        layers: clone(store.layers),
        slides: clone(store.slides),
        globalSettings: clone(store.globalSettings),
        gridSettings: clone(store.gridSettings),
        states: clone(store.states),
        symbols: clone(store.symbols),
        graphicStyles: clone(store.graphicStyles),
        swatches: clone(store.swatches),
        artboards: clone(store.artboards),
        gameScript: effectiveGameScript(store.elements, store.sceneBehaviors ?? [], store.gameScript, store.gameVars ?? [], store.blueprints, store.gameAuthoringMode),
        sceneBehaviors: store.sceneBehaviors?.length ? clone(store.sceneBehaviors) : undefined,
        gameVars: store.gameVars?.length ? clone(store.gameVars) : undefined,
        blueprints: store.blueprints && Object.keys(store.blueprints).length ? clone(store.blueprints) : undefined,
        gameAuthoringMode: store.gameAuthoringMode === 'code' ? 'code' : undefined,
    } as SlideDocument;
    await exportToHtml(doc, name);
}
