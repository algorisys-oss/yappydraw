import { onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { store, updateSlideTransition } from "../store/app-store";
import { slideTransitionManager } from "../utils/animation";
import type { SlideTransitionType, SlideTransitionEasing } from "../types/slide-types";
import { X, Play } from "lucide-solid";
import "./slide-transition-picker.css";

interface SlideTransitionPickerProps {
    index: number;
    onClose: () => void;
    position: { top: number; left: number };
}

export const SlideTransitionPicker = (props: SlideTransitionPickerProps) => {
    const slide = () => store.slides[props.index];
    const transition = () => slide()?.transition || { type: 'none', duration: 500, easing: 'easeInOutQuad' as const };

    // Handle Escape key to close picker
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            props.onClose();
        }
    };

    onMount(() => {
        window.addEventListener('keydown', handleKeyDown);
    });

    onCleanup(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });

    const handleTypeChange = (e: Event) => {
        const type = (e.currentTarget as HTMLSelectElement).value as SlideTransitionType;
        updateSlideTransition(props.index, { type });
    };

    const handleDurationChange = (e: Event) => {
        const duration = parseInt((e.currentTarget as HTMLInputElement).value, 10);
        if (!isNaN(duration)) {
            updateSlideTransition(props.index, { duration });
        }
    };

    const handleEasingChange = (e: Event) => {
        const easing = (e.currentTarget as HTMLSelectElement).value as SlideTransitionEasing;
        updateSlideTransition(props.index, { easing });
    };

    const handlePreview = async () => {
        await slideTransitionManager.previewTransition(props.index);
    };

    return (
        <Portal>
            <div
                class="slide-transition-picker"
                onClick={(e) => e.stopPropagation()}
                style={{
                    top: `${props.position.top}px`,
                    left: `${props.position.left}px`
                }}
            >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h4>Transition</h4>
                    <button class="close-picker-btn" onClick={props.onClose} title="Close">
                        <X size={14} />
                    </button>
                </div>

                <div class="transition-field">
                    <label>Type</label>
                    <select value={transition().type} onChange={handleTypeChange}>
                        <option value="none">None</option>
                        <option value="fade">Fade</option>
                        <option value="slide-left">Slide Left</option>
                        <option value="slide-right">Slide Right</option>
                        <option value="slide-up">Slide Up</option>
                        <option value="slide-down">Slide Down</option>
                        <option value="zoom-in">Zoom In</option>
                        <option value="zoom-out">Zoom Out</option>
                    </select>
                </div>

                <div class="transition-field">
                    <label>Duration (ms)</label>
                    <input
                        type="number"
                        value={transition().duration}
                        onInput={handleDurationChange}
                        min="100"
                        max="5000"
                        step="100"
                    />
                </div>

                <div class="transition-field">
                    <label>Easing</label>
                    <select value={transition().easing} onChange={handleEasingChange}>
                        <option value="linear">Linear</option>
                        <option value="easeInQuad">Quad In</option>
                        <option value="easeOutQuad">Quad Out</option>
                        <option value="easeInOutQuad">Quad InOut</option>
                        <option value="easeInCubic">Cubic In</option>
                        <option value="easeOutCubic">Cubic Out</option>
                        <option value="easeInOutCubic">Cubic InOut</option>
                        <option value="easeOutBack">Back Out</option>
                        <option value="easeSpring">Spring</option>
                    </select>
                </div>

                <div class="transition-actions">
                    <button class="preview-btn" onClick={handlePreview} title="Preview Transition">
                        <Play size={14} style="margin-right: 4px;" />
                        Preview
                    </button>
                </div>
            </div>
        </Portal>
    );
};
