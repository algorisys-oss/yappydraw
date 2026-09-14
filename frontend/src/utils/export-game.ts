/**
 * Export the current document as a self-contained, playable HTML file.
 *
 * Shared by the menu's "Export HTML" and the game-mode bar's Export button so both
 * produce an identical build. For games this bakes in the *effective* game script
 * — `effectiveGameScript` compiles the visual behaviors AND the Blueprint graphs —
 * plus the player runtime (via `exportToHtml`), so a Blueprint game exports exactly
 * like a code game.
 */

import { saveActiveSlide } from '../store/app-store';
import { buildSlideDocument } from './document-io';
import { exportToHtml } from './export-to-html';

/** Build the current scene into a SlideDocument (game script + blueprints compiled
 *  in) and download it as an HTML file named `name`.
 *
 *  The document is the one Save writes (`buildSlideDocument`), not a field list of its own.
 *  This file used to keep its own list, and it fell behind: keyframes (`compositionTracks`)
 *  and tinyfly clips were saved with the document but never reached the exported HTML, so
 *  the file played a still of the first frame. */
export async function exportSceneAsHtml(name: string): Promise<void> {
    saveActiveSlide(); // flush any in-progress edits into the active slide
    await exportToHtml(buildSlideDocument(name), name);
}
