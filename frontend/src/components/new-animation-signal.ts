/** Open-state for the New Animation chooser — a standalone signal so the menu can
 *  open it without eagerly pulling the dialog (and its handleNew import) at load. */
import { createSignal } from 'solid-js';
export const [showNewAnimation, setShowNewAnimation] = createSignal(false);
