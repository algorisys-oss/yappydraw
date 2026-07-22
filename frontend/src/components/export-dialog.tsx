import { type Component, createSignal, Show, createEffect, onCleanup, untrack } from "solid-js";
import { X } from "lucide-solid";
import { store, pageNoun } from "../store/app-store";
import { isPagedDocType } from "../types/slide-types";
import { exportToPng, exportToSvg, exportToPdf, exportToPptx, exportPageToPng, exportToJpg, ensureExportImages } from "../utils/export";
import { setRequestRecording } from "./canvas";
import "./export-dialog.css";

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const ExportDialog: Component<ExportDialogProps> = (props) => {
    const [format, setFormat] = createSignal<'png' | 'jpg' | 'svg' | 'pdf' | 'pptx' | 'webm' | 'mp4' | 'gif'>('png');
    const [scale, setScale] = createSignal<number>(2);
    const [hasBackground, setHasBackground] = createSignal(true);
    const [onlySelected, setOnlySelected] = createSignal(store.selection.length > 0);
    const [currentPageOnly, setCurrentPageOnly] = createSignal(false);
    const [videoSeconds, setVideoSeconds] = createSignal(5);
    // Matches exportPageGif's own default and its 5–30 clamp.
    const [gifFps, setGifFps] = createSignal(12);
    const isPaged = () => isPagedDocType(store.docType) && store.slides.length > 0;
    const isVideo = () => format() === 'webm' || format() === 'mp4' || format() === 'gif';

    // Reset "only selected" to match the CURRENT selection each time the dialog OPENS.
    // (untrack the selection read so this runs on the open-transition only, not on every
    // selection change while open.) Without the reset it stuck at `true` from a prior export,
    // so re-opening with nothing selected made the export a silent no-op — "works once".
    createEffect(() => {
        if (props.isOpen) {
            setOnlySelected(untrack(() => store.selection.length) > 0);
            // Animation docs: default to GIF at the timeline's own length and rate
            // (frameCount/fps), so "Export" means "export my animation" verbatim.
            untrack(() => {
                const tl = store.animTimeline;
                if (store.docType === 'animation' && tl) {
                    setFormat(f => (f === 'png' ? 'gif' : f));
                    setVideoSeconds(Math.max(1, Math.round((tl.frameCount / tl.fps) * 10) / 10));
                    setGifFps(Math.min(30, tl.fps));
                }
            });
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

    const handleExport = async () => {
        // Decode all images first so nothing exports blank (esp. exportPageToPng, which is sync).
        await ensureExportImages();
        if (format() === 'png') {
            if (currentPageOnly() && isPaged() && !onlySelected()) {
                exportPageToPng(store.activeSlideIndex, scale());
            } else {
                exportToPng(scale(), hasBackground(), onlySelected());
            }
        } else if (format() === 'jpg') {
            if (currentPageOnly() && isPaged() && !onlySelected()) {
                exportPageToPng(store.activeSlideIndex, scale(), true, 'jpeg');
            } else {
                exportToJpg(scale(), onlySelected());
            }
        } else if (format() === 'svg') {
            exportToSvg(onlySelected());
        } else if (format() === 'pdf') {
            exportToPdf(scale(), hasBackground(), onlySelected());
        } else if (format() === 'pptx') {
            exportToPptx(scale(), hasBackground(), onlySelected());
        } else if (format() === 'gif') {
            const { exportPageGif } = await import('../utils/recording-manager');
            exportPageGif({ seconds: videoSeconds(), fps: gifFps() });
        } else if (format() === 'webm' || format() === 'mp4') {
            const videoFormat = format() as 'webm' | 'mp4';
            if (isPaged()) {
                // Offline page-scoped export: renders JUST the page for N seconds
                // (animations included) — not a live capture of the screen.
                const { exportPageVideo } = await import('../utils/recording-manager');
                exportPageVideo({ seconds: videoSeconds(), format: videoFormat });
            } else {
                // Infinite canvas has no page bounds — record the live canvas.
                setRequestRecording({ start: true, format: videoFormat });
            }
        }
        props.onClose();
    };

    return (
        <Show when={props.isOpen}>
            <div class="export-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !window.getSelection()?.toString()) props.onClose(); }}>
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
                                    <input type="radio" name="format" checked={format() === 'jpg'} onChange={() => setFormat('jpg')} />
                                    JPG
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
                                    WebM Video
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="format" checked={format() === 'mp4'} onChange={() => setFormat('mp4')} />
                                    MP4 Video
                                </label>
                                <Show when={isPaged()}>
                                    <label class="radio-label">
                                        <input type="radio" name="format" checked={format() === 'gif'} onChange={() => setFormat('gif')} />
                                        Animated GIF
                                    </label>
                                </Show>
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

                        <Show when={isPaged() && (format() === 'png' || format() === 'jpg')}>
                            <div class="option-group">
                                <label class="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={currentPageOnly()}
                                        onChange={(e) => setCurrentPageOnly(e.currentTarget.checked)}
                                    />
                                    Current {pageNoun()} Only (exact {pageNoun().toLowerCase()} bounds)
                                </label>
                            </div>
                        </Show>

                        <Show when={isVideo()}>
                            <div class="option-group">
                                <Show when={isPaged()} fallback={
                                    <span class="hint">Records the live canvas — use the recording indicator's Stop, or it keeps going until stopped.</span>
                                }>
                                    <label>Duration (seconds)</label>
                                    <input type="number" min="1" max="120" step="1" value={videoSeconds()}
                                        style={{ width: '80px' }}
                                        onChange={(e) => setVideoSeconds(Math.max(1, Math.min(120, parseInt(e.currentTarget.value) || 5)))} />
                                    <span class="hint">Exports the current {pageNoun().toLowerCase()} exactly — animations play, no workspace around it.</span>
                                </Show>
                            </div>
                        </Show>

                        {/* GIF frame rate. Its own control because the trade-off is
                            GIF-specific: every frame is a full 256-colour image in
                            the file, so fps multiplies size directly — unlike the
                            video encoders, which are fixed at 60fps capture and
                            compress between frames. */}
                        <Show when={format() === 'gif' && isPaged()}>
                            <div class="option-group">
                                <label>Frame rate (fps)</label>
                                <input type="number" min="5" max="30" step="1" value={gifFps()}
                                    style={{ width: '80px' }}
                                    onChange={(e) => setGifFps(Math.max(5, Math.min(30, parseInt(e.currentTarget.value) || 12)))} />
                                <span class="hint">
                                    Higher is smoother but bigger — every frame is stored whole. 12 suits most
                                    animations; 20–24 is worth it for fast motion. Roughly {Math.round(videoSeconds() * gifFps())} frames.
                                </span>
                            </div>
                        </Show>

                        <Show when={format() === 'png' || format() === 'jpg' || format() === 'pdf' || format() === 'pptx'}>
                            <div class="option-group">
                                <label>Scale</label>
                                <div class="scale-group">
                                    <button class={`scale-btn ${scale() === 1 ? 'active' : ''}`} onClick={() => setScale(1)}>1x</button>
                                    <button class={`scale-btn ${scale() === 2 ? 'active' : ''}`} onClick={() => setScale(2)}>2x</button>
                                    <button class={`scale-btn ${scale() === 3 ? 'active' : ''}`} onClick={() => setScale(3)}>3x</button>
                                </div>
                            </div>

                            <Show when={format() !== 'jpg'}>
                                <div class="option-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" checked={hasBackground()} onChange={(e) => setHasBackground(e.currentTarget.checked)} />
                                        White Background
                                    </label>
                                </div>
                            </Show>
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
