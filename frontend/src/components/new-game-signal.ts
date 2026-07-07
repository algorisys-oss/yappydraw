/** Open-state for the New Game chooser — a standalone signal so the menu can open
 *  it without eagerly pulling the dialog (and its handleNew import) at load. */
import { createSignal } from 'solid-js';
export const [showNewGame, setShowNewGame] = createSignal(false);
