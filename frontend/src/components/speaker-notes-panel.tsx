import { type Component, Show, createSignal, createEffect, on } from "solid-js";
import { X } from "lucide-solid";
import { store, updateSlideNotes, toggleSpeakerNotes, pushToHistory } from "../store/app-store";
import { t } from "../i18n";
import "./speaker-notes-panel.css";

/**
 * The speaker-notes strip under the canvas (slides documents only). Edits the active slide's
 * `notes`; the presenter view and the PowerPoint export read the same field.
 *
 * The textarea keeps its own value while it has focus: the store normalises blank notes to
 * absent, and writing that back into the box mid-typing would swallow a leading space or an
 * Enter. It re-reads the store when the slide changes or when the notes change underneath it
 * (undo, the API) while it is not being typed in.
 */
export const SpeakerNotesPanel: Component = () => {
    let area: HTMLTextAreaElement | undefined;
    const [value, setValue] = createSignal("");
    const [focused, setFocused] = createSignal(false);
    // One undo step per typing session, not one per keystroke.
    let pushedThisSession = false;

    const storeNotes = () => store.slides[store.activeSlideIndex]?.notes ?? "";

    createEffect(on(() => store.activeSlideIndex, () => setValue(storeNotes())));
    createEffect(() => {
        const notes = storeNotes();
        if (!focused() && notes !== value()) setValue(notes);
    });

    const onInput = (e: InputEvent & { currentTarget: HTMLTextAreaElement }) => {
        const text = e.currentTarget.value;
        setValue(text);
        if (!pushedThisSession) { pushToHistory(); pushedThisSession = true; }
        updateSlideNotes(store.activeSlideIndex, text, false);
    };

    return (
        <Show when={store.docType === 'slides' && store.showSpeakerNotes && store.appMode !== 'presentation' && !store.zenMode}>
            <div class="speaker-notes-panel" role="region" aria-label={t('speakerNotes.region')}
                style={{ '--notes-left-min': store.showSlideNavigator ? 'calc(var(--toolbar-left, 0px) + 240px)' : '0px' }}>
                <div class="speaker-notes-header">
                    <span>{t('speakerNotes.title', { n: store.activeSlideIndex + 1 })}</span>
                    <button class="speaker-notes-close" onClick={() => toggleSpeakerNotes(false)}
                        title={t('speakerNotes.hide')} aria-label={t('speakerNotes.hide')}>
                        <X size={14} />
                    </button>
                </div>
                <textarea
                    ref={area}
                    class="speaker-notes-text"
                    value={value()}
                    placeholder={t('speakerNotes.placeholder')}
                    spellcheck={true}
                    onInput={onInput}
                    onFocus={() => { setFocused(true); pushedThisSession = false; }}
                    onBlur={() => { setFocused(false); setValue(storeNotes()); }}
                    // Typing here must not reach the canvas shortcuts (Delete, letters, Ctrl+Z…).
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') { area?.blur(); }
                        e.stopPropagation();
                    }}
                />
            </div>
        </Show>
    );
};
