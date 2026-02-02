import { type Component, createSignal, Show, createEffect, onCleanup } from "solid-js";
import { X } from "lucide-solid";
import { store } from "../store/app-store";
import { exportToPng, exportToSvg, exportToPdf, exportToPptx } from "../utils/export";
import { setRequestRecording } from "./canvas";
import "./export-dialog.css";

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportDialog: Component<ExportDialogProps> = (props) => {
    const [format, setFormat] = createSignal<'png' | 'svg' | 'pdf' | 'pptx' | 'webm' | 'mp4'>('png');
    const [scale, setScale] = createSignal<number>(2);
    const [hasBackground, setHasBackground] = createSignal(true);
    const [onlySelected, setOnlySelected] = createSignal(store.selection.length > 0);

    // Auto-update onlySelected when dialog opens or selection changes
    createEffect(() => {
        if (props.isOpen) {
            if (store.selection.length > 0) {
                setOnlySelected(true);
            }
        }
    });

    // Handle Escape key to close dialog
    createEffect(() => {
        if (props.isOpen) {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    props.onClose();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
        }
    });

    const handleExport = () => {
        if (format() === 'png') {
            exportToPng(scale(), hasBackground(), onlySelected());
        } else if (format() === 'svg') {
            exportToSvg(onlySelected());
        } else if (format() === 'pdf') {
            exportToPdf(scale(), hasBackground(), onlySelected());
        } else if (format() === 'pptx') {
            exportToPptx(scale(), hasBackground(), onlySelected());
        } else if (format() === 'webm' || format() === 'mp4') {
            const videoFormat = format() as 'webm' | 'mp4';
            setRequestRecording({ start: true, format: videoFormat });
        }
        props.onClose();
    };

    return (
        <Show when={props.isOpen}>
            <div class="export-modal-overlay" onClick={props.onClose}>
                <div class="export-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="export-header">
                        <h3>Export</h3>
                        <button class="close-btn" onClick={props.onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="export-options">
                        <div class="option-group">
                            <label>Format</label>
                            <div class="radio-group" style={{ "flex-wrap": "wrap", "gap": "12px" }}>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'png'} onChange={() => setFormat('png')} />
                                    PNG
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'svg'} onChange={() => setFormat('svg')} />
                                    SVG
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'pdf'} onChange={() => setFormat('pdf')} />
                                    PDF
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'pptx'} onChange={() => setFormat('pptx')} />
                                    PPTX
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'webm'} onChange={() => setFormat('webm')} />
                                    WebM Monitor
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'mp4'} onChange={() => setFormat('mp4')} />
                                    MP4 Video
                                </label>
                            </div>
                        </div>

                        <div class="option-group">
                            <label class="checkbox-label" classList={{ disabled: store.selection.length === 0 }}>
                                <input
                                    type="checkbox"
                                    checked={onlySelected()}
                                    onChange={(e) => setOnlySelected(e.currentTarget.checked)}
                                    disabled={store.selection.length === 0}
                                />
                                Export Selection Only
                                {store.selection.length === 0 && <span class="hint">(No items selected)</span>}
                            </label>
                        </div>

                        <Show when={format() === 'png' || format() === 'pdf' || format() === 'pptx'}>
                            <div class="option-group">
                                <label>Scale</label>
                                <div class="scale-group">
                                    <button class={`scale-btn ${scale() === 1 ? 'active' : ''}`} onClick={() => setScale(1)}>1x</button>
                                    <button class={`scale-btn ${scale() === 2 ? 'active' : ''}`} onClick={() => setScale(2)}>2x</button>
                                    <button class={`scale-btn ${scale() === 3 ? 'active' : ''}`} onClick={() => setScale(3)}>3x</button>
                                </div>
                            </div>

                            <div class="option-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" checked={hasBackground()} onChange={(e) => setHasBackground(e.currentTarget.checked)} />
                                    White Background
                                </label>
                            </div>
                        </Show>
                    </div>

                    <div class="export-actions">
                        <button class="cancel-btn" onClick={props.onClose}>Cancel</button>
                        <button class="export-confirm-btn" onClick={handleExport}>
                            Export
                        </button>
                    </div>
                </div>
            </div>
        </Show>
    );
};

export default ExportDialog;
