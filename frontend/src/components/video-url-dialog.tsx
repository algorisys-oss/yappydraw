import { type Component, Show, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Video, Play } from "lucide-solid";
import { isValidVideoURL, detectVideoProvider, getPosterURL, fetchVimeoPoster, type VideoProvider } from "../utils/video-utils";
import "./video-url-dialog.css";

export interface VideoUrlDialogProps {
    isOpen: boolean;
    onCancel: () => void;
    onSubmit: (url: string, provider: VideoProvider, posterURL: string | null) => void;
    initialURL?: string;
}

const VideoUrlDialog: Component<VideoUrlDialogProps> = (props) => {
    const [url, setUrl] = createSignal(props.initialURL || "");
    const [isValid, setIsValid] = createSignal(false);
    const [provider, setProvider] = createSignal<VideoProvider>("unknown");
    const [posterURL, setPosterURL] = createSignal<string | null>(null);
    let inputRef: HTMLInputElement | undefined;

    // Reset state when dialog opens
    createEffect(() => {
        if (props.isOpen) {
            setUrl(props.initialURL || "");
            setIsValid(false);
            setProvider("unknown");
            setPosterURL(null);
            setTimeout(() => inputRef?.focus(), 50);
        }
    });

    // Validate and detect provider on URL change
    createEffect(() => {
        const v = url();
        const valid = isValidVideoURL(v);
        setIsValid(valid);
        if (valid) {
            const p = detectVideoProvider(v);
            setProvider(p);
            // Fetch poster
            const poster = getPosterURL(v, p);
            if (poster) {
                setPosterURL(poster);
            } else if (p === 'vimeo') {
                fetchVimeoPoster(v).then(u => u && setPosterURL(u));
            } else {
                setPosterURL(null);
            }
        } else {
            setProvider("unknown");
            setPosterURL(null);
        }
    });

    const handleSubmit = () => {
        if (isValid()) {
            props.onSubmit(url(), provider(), posterURL());
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") props.onCancel();
        if (e.key === "Enter" && isValid()) handleSubmit();
    };

    return (
        // Render at <body> via a Portal: the toolbar that mounts this dialog uses a
        // CSS transform to centre itself, which would otherwise make the fixed
        // overlay resolve against (and get clipped by) the narrow toolbar.
        <Show when={props.isOpen}>
          <Portal>
            <div
                class="video-dialog-overlay"
                onClick={(e) => { if (e.target === e.currentTarget) props.onCancel(); }}
                onKeyDown={handleKeyDown}
            >
                <div class="video-dialog-modal" onClick={(e) => e.stopPropagation()}>
                    <div class="video-dialog-header">
                        <h2><Video size={18} /> Insert Video</h2>
                        <button class="close-btn" type="button" onClick={props.onCancel}>
                            <X size={20} />
                        </button>
                    </div>

                    <div class="video-dialog-body">
                        <label class="video-dialog-label">Video URL</label>
                        <div class="video-dialog-input-wrap">
                            <input
                                ref={el => inputRef = el}
                                type="url"
                                class="video-dialog-input"
                                classList={{ valid: isValid(), invalid: url().length > 0 && !isValid() }}
                                placeholder="Paste YouTube, Vimeo, or direct video URL..."
                                value={url()}
                                onInput={(e) => setUrl(e.currentTarget.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Show when={isValid()}>
                                <span class="video-dialog-provider">{provider()}</span>
                            </Show>
                        </div>

                        <Show when={posterURL()}>
                            <div class="video-dialog-preview">
                                <img src={posterURL()!} alt="Video thumbnail" />
                                <div class="video-dialog-preview-play"><Play size={24} /></div>
                            </div>
                        </Show>

                        <Show when={url().length > 0 && !isValid()}>
                            <p class="video-dialog-hint">Enter a YouTube, Vimeo, or direct video URL (.mp4, .webm)</p>
                        </Show>
                    </div>

                    <div class="video-dialog-actions">
                        <button class="video-dialog-btn video-dialog-btn-cancel" type="button" onClick={props.onCancel}>
                            Cancel
                        </button>
                        <button
                            class="video-dialog-btn video-dialog-btn-submit"
                            type="button"
                            disabled={!isValid()}
                            onClick={handleSubmit}
                        >
                            Insert Video
                        </button>
                    </div>
                </div>
            </div>
          </Portal>
        </Show>
    );
};

export default VideoUrlDialog;
