import { For, Show } from "solid-js";
import { onEscapeKey } from "../utils/use-escape";
import { t } from "../i18n";
import { pendingChoice, answerChoice } from "./choice-dialog-state";
import "./save-dialog.css";
import "./choice-dialog.css";

function isOpen(): boolean { return pendingChoice() !== null; }
function cancel(): void { answerChoice(null); }

/** Renders the question raised by `askChoice` (see choice-dialog-state.ts). */
export default function ChoiceDialog() {
    onEscapeKey(isOpen, cancel);
    return (
        <Show when={pendingChoice()}>
            {(p) => (
                <div class="save-overlay choice-overlay" onClick={(e) => { if (e.target === e.currentTarget) answerChoice(null); }}>
                    <div class="save-modal choice-modal" role="alertdialog" aria-modal="true" aria-labelledby="choice-title" aria-describedby="choice-message">
                        <div class="save-header">
                            <h2 id="choice-title">{p().title}</h2>
                            <button class="close-btn" type="button" aria-label={t('layerDelete.close')} onClick={() => answerChoice(null)}>✕</button>
                        </div>
                        <p id="choice-message" class="choice-message">{p().message}</p>
                        <div class="choice-actions">
                            <For each={p().choices}>
                                {(c, i) => (
                                    <button
                                        type="button"
                                        class={c.variant === 'primary' ? 'confirm-btn' : c.variant === 'danger' ? 'confirm-btn choice-danger' : 'cancel-btn'}
                                        ref={el => { if (i() === 0) queueMicrotask(() => el.focus()); }}
                                        onClick={() => answerChoice(c.id)}
                                    >{c.label}</button>
                                )}
                            </For>
                        </div>
                    </div>
                </div>
            )}
        </Show>
    );
}
