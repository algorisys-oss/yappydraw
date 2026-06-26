import { type Component } from "solid-js";
import { Square, Film } from "lucide-solid";
import { store } from "../store/app-store";
import { toggleTimelapse } from "../utils/timelapse-manager";
import "./timelapse-overlay.css";

/**
 * On-screen indicator shown while a time-lapse is being captured. Sits top-left
 * so it never collides with the real-time video RecordingOverlay (top-centre).
 * Frame count comes from store.timelapseFrameCount (bumped by the manager).
 */
const TimelapseOverlay: Component = () => {
    return (
        <div class="timelapse-overlay">
            <div class="timelapse-indicator">
                <Film size={14} />
                <span class="timelapse-text">TIME-LAPSE</span>
            </div>
            <div class="timelapse-count">
                {store.timelapseFrameCount} {store.timelapseFrameCount === 1 ? 'frame' : 'frames'}
            </div>
            <button class="timelapse-stop-btn" onClick={() => toggleTimelapse()}>
                <Square size={14} fill="white" strokeWidth={0} />
                <span>Stop</span>
            </button>
        </div>
    );
};

export default TimelapseOverlay;
