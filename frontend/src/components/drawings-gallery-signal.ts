/** Open-state for the "My Drawings" gallery — standalone so the menu and the
 *  welcome screen can open it without eagerly pulling the dialog and its
 *  storage imports. */
import { createSignal } from 'solid-js';
export const [showDrawingsGallery, setShowDrawingsGallery] = createSignal(false);
