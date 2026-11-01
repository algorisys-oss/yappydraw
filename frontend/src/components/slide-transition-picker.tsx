import { onMount, onCleanup, Show, For } from "solid-js";
import { Portal } from "solid-js/web";
import { store, updateSlideTransition, setSlideAdvanceAfter, setSlideShowLoop, pushToHistory } from "../store/app-store";
import { t } from "../i18n";
import { slideTransitionManager } from "../utils/animation";
import type { SlideTransitionType, SlideTransitionEasing } from "../types/slide-types";
import { X, Play } from "lucide-solid";
import "./slide-transition-picker.css";

/** Transitions that show both slides at once; the arrow in each label is the way it moves. */
const COMPOSITE_TYPES: SlideTransitionType[] = [
    'wipe-left', 'wipe-right', 'wipe-up', 'wipe-down',
    'cover-left', 'cover-right', 'cover-up', 'cover-down',
    'uncover-left', 'uncover-right', 'uncover-up', 'uncover-down',
    'split-horizontal-out', 'split-horizontal-in', 'split-vertical-out', 'split-vertical-in',
];

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
        pushToHistory();
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
        pushToHistory();
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
                        <option value="morph">{t('morph.option')}</option>
                        <For each={COMPOSITE_TYPES}>{(k) => <option value={k}>{t(`transitionTypes.${k}` as any)}</option>}</For>
                    </select>
                </div>

                <div class="transition-field">
                    <label>Duration (ms)</label>
                    <input
                        type="number"
                        value={transition().duration}
                        onInput={handleDurationChange}
                        onFocus={() => pushToHistory()}
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

                {/* Show timing: slides documents only (a design document isn't presented). */}
                <Show when={store.docType === 'slides'}>
                    <div class="transition-field">
                        <label for="advance-after">{t('sections.advanceAfter')}</label>
                        <input
                            id="advance-after"
                            type="number"
                            min="0"
                            max="3600"
                            step="0.5"
                            placeholder={t('sections.onClick')}
                            value={slide()?.advanceAfter ? slide()!.advanceAfter! / 1000 : ''}
                            onChange={(e) => {
                                const v = e.currentTarget.value.trim();
                                setSlideAdvanceAfter(props.index, v === '' ? null : parseFloat(v) * 1000);
                            }}
                        />
                    </div>
                    <label class="transition-check">
                        <input
                            type="checkbox"
                            checked={!!store.globalSettings.slideShowLoop}
                            onChange={(e) => setSlideShowLoop(e.currentTarget.checked)}
                        />
                        {t('sections.loop')}
                    </label>
                </Show>

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
