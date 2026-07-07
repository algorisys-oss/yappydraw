/** Open-state for the My Games library — standalone so the menu can open it
 *  without eagerly pulling the dialog and its storage/runtime imports. */
import { createSignal } from 'solid-js';
export const [showMyGames, setShowMyGames] = createSignal(false);
