import { type Component, createSignal, Show, createEffect } from "solid-js";
import { X } from "lucide-solid";
import { onEscapeKey } from "../utils/use-escape";
import "./save-dialog.css";

interface SaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (filename: string) => void;
    initialFilename?: string;
}

const SaveDialog: Component<SaveDialogProps> = (props) => {
    onEscapeKey(() => props.isOpen, () => props.onClose());
    const [filename, setFilename] = createSignal("");
    let inputRef: HTMLInputElement | undefined;

    createEffect(() => {
        if (props.isOpen) {
            setFilename(props.initialFilename || "untitled");
            // Pre-select the placeholder so typing replaces it. Without this the
            // caret lands after "Untitled" and naming a new drawing starts with
            // clearing a word you never chose. Deferred a frame — the input is
            // mounted by the same Show that this effect reacts to.
            requestAnimationFrame(() => inputRef?.select());
        }
    });

    const handleSave = () => {
        if (filename().trim()) {
            props.onSave(filename().trim());
            props.onClose();
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            props.onClose();
        }
    };

    return (
        <Show when={props.isOpen}>
            <div class="save-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
                <div class="save-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="save-header">
                        <h2>Save Drawing</h2>
                        <button class="close-btn" type="button" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div class="save-content">
                            <div class="input-group">
                                <label>Filename</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    class="filename-input"
                                    value={filename()}
                                    onInput={(e) => setFilename(e.currentTarget.value)}
                                    onKeyDown={handleKeyDown}
                                    autofocus
                                />
                            </div>

                            <div class="save-actions">
                                <button class="cancel-btn" type="button" onClick={props.onClose}>Cancel</button>
                                <button class="confirm-btn" type="submit">Save</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Show>
    );
};

export default SaveDialog;
