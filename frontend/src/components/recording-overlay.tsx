import { type Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import { Square } from "lucide-solid";
import "./recording-overlay.css";

interface Props {
    onStop: () => void;
    /** Badge text. Defaults to the video recorder's "REC". */
    label?: string;
    /** Badge/dot colour. Defaults to the video recorder's red. */
    accent?: string;
    /**
     * Elapsed milliseconds. When omitted the overlay counts its own seconds —
     * fine for the video recorder, which publishes no clock of its own. The GIF
     * capture does, and its count is the authoritative one (it advances per
     * encoded frame), so it passes it in rather than running a second timer that
     * could disagree.
     */
    elapsedMs?: () => number;
    /** Extra readout beside the timer — the GIF capture reports bytes written. */
    detail?: () => string;
}

const RecordingOverlay: Component<Props> = (props) => {
    const [ticks, setTicks] = createSignal(0);

    onMount(() => {
        const interval = setInterval(() => {
            setTicks(d => d + 1);
        }, 1000);
        onCleanup(() => clearInterval(interval));
    });

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const elapsed = () => formatTime(
        props.elapsedMs ? Math.floor(props.elapsedMs() / 1000) : ticks(),
    );

    return (
        <div class="recording-overlay">
            <div class="recording-indicator">
                <div class="pulse-dot" style={props.accent ? { 'background-color': props.accent } : undefined}></div>
                <span class="recording-text" style={props.accent ? { color: props.accent } : undefined}>
                    {props.label ?? 'REC'}
                </span>
            </div>
            <div class="recording-timer">
                {elapsed()}
                <Show when={props.detail}>{d => <> · {d()()}</>}</Show>
            </div>
            <button class="stop-btn" onClick={props.onStop}>
                <Square size={16} fill="white" strokeWidth={0} />
                <span>Stop</span>
            </button>
        </div>
    );
};

export default RecordingOverlay;
