import { type Component, Show } from "solid-js";
import { X } from "lucide-solid";
import "./unsaved-changes-dialog.css";

export interface UnsavedChangesDialogProps {
    isOpen: boolean;
    onCancel: () => void;
    onDiscard: () => void;
    onSave: () => void;
}

const UnsavedChangesDialog: Component<UnsavedChangesDialogProps> = (props) => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") props.onCancel();
    };

    return (
        <Show when={props.isOpen}>
            <div
                class="unsaved-overlay"
                onClick={(e) => { if (e.target === e.currentTarget) props.onCancel(); }}
                onKeyDown={handleKeyDown}
            >
                <div class="unsaved-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="unsaved-header">
                        <h2>Unsaved Changes</h2>
                        <button class="close-btn" type="button" onClick={props.onCancel}>
                            <X size={20} />
                        </button>
                    </div>

                    <p class="unsaved-body">
                        You have unsaved changes. Would you like to save before continuing?
                    </p>

                    <div class="unsaved-actions">
                        <button class="unsaved-btn unsaved-btn-cancel" type="button" onClick={props.onCancel}>
                            Cancel
                        </button>
                        <button class="unsaved-btn unsaved-btn-discard" type="button" onClick={props.onDiscard}>
                            Discard
                        </button>
                        <button class="unsaved-btn unsaved-btn-save" type="button" onClick={props.onSave}>
                            Save & Continue
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default UnsavedChangesDialog;
