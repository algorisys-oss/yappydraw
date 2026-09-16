/**
 * A modal with more than two answers, awaited like `confirm()`.
 *
 * Native `confirm()` has only OK/Cancel, so a three-way question had to be squeezed into it —
 * the layer-group delete used Cancel to mean "keep the contents", which left no way to back out:
 * dismissing the dialog still deleted the group. It is also suppressed outright in some
 * installed PWAs and on iPad. Escape, the backdrop and the ✕ all resolve `null`.
 *
 * State lives here; `choice-dialog.tsx` renders it.
 */
import { createSignal } from "solid-js";

export interface Choice {
    id: string;
    label: string;
    variant?: 'primary' | 'danger' | 'plain';
}

export interface PendingChoice {
    title: string;
    message: string;
    choices: Choice[];
    resolve: (id: string | null) => void;
}

const [pending, setPending] = createSignal<PendingChoice | null>(null);
export { pending as pendingChoice };

export function askChoice(title: string, message: string, choices: Choice[]): Promise<string | null> {
    pending()?.resolve(null); // a newer question supersedes an unanswered one
    return new Promise(resolve => setPending({ title, message, choices, resolve }));
}

export function answerChoice(id: string | null): void {
    const p = pending();
    setPending(null);
    p?.resolve(id);
}
