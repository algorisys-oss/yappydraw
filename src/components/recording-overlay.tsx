import { type Component, createSignal, onMount, onCleanup } from "solid-js";
import { Square } from "lucide-solid";
import "./recording-overlay.css";

interface Props {
    onStop: () => void;
}

const RecordingOverlay: Component<Props> = (props) => {
    const [duration, setDuration] = createSignal(0);

    onMount(() => {
        const interval = setInterval(() => {
            setDuration(d => d + 1);
        }, 1000);
        onCleanup(() => clearInterval(interval));
    });

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div class="recording-overlay">
            <div class="recording-indicator">
                <div class="pulse-dot"></div>
                <span class="recording-text">REC</span>
            </div>
            <div class="recording-timer">
                {formatTime(duration())}
            </div>
            <button class="stop-btn" onClick={props.onStop}>
                <Square size={16} fill="white" strokeWidth={0} />
                <span>Stop</span>
            </button>
        </div>
    );
};

export default RecordingOverlay;
