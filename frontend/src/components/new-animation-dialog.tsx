/**
 * New Animation chooser — stage size, frame rate and length for a fresh
 * frame-timeline document (docType 'animation'). An animation IS a document;
 * picking a card resets to a new doc with the timeline panel open.
 * Reuses the New Game dialog's ng-* styles.
 */

import { type Component, For, Show, createSignal } from 'solid-js';
import { Portal } from 'solid-js/web';
import { X, Clapperboard } from 'lucide-solid';
import { DEFAULT_ANIM_FRAME_COUNT } from '../types/anim-types';
import { handleNew } from './menu';
import { showNewAnimation, setShowNewAnimation } from './new-animation-signal';
import { onEscapeKey } from '../utils/use-escape';
import './new-game-dialog.css';

/** Stage presets — the animation's fixed frame (its page). */
const STAGES: { key: string; label: string; w: number; h: number }[] = [
    { key: 'hd', label: 'HD 16:9', w: 1920, h: 1080 },
    { key: 'wide', label: 'Wide 720p', w: 1280, h: 720 },
    { key: 'square', label: 'Square', w: 1080, h: 1080 },
    { key: 'portrait', label: 'Portrait 9:16', w: 1080, h: 1920 },
];

const FPS_CHOICES = [12, 24, 30];

const NewAnimationDialog: Component = () => {
    onEscapeKey(showNewAnimation, () => setShowNewAnimation(false));
    const [stage, setStage] = createSignal(STAGES[0]);
    const [fps, setFps] = createSignal(24);
    const [seconds, setSeconds] = createSignal(DEFAULT_ANIM_FRAME_COUNT / 24);
    const create = () => {
        setShowNewAnimation(false);
        const s = stage();
        const frameCount = Math.max(1, Math.round(seconds() * fps()));
        // An animation is a single-stage paged doc — the page is the fixed frame,
        // without the multi-page slide/present chrome (docType 'animation').
        handleNew('animation', { width: s.w, height: s.h }, undefined, { fps: fps(), frameCount });
    };
    return (
        <Show when={showNewAnimation()}>
            <Portal>
                <div class="ng-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewAnimation(false); }}>
                    <div class="ng-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="ng-header">
                            <h2>New Animation</h2>
                            <button class="ng-close" onClick={() => setShowNewAnimation(false)}><X size={18} /></button>
                        </div>
                        <p class="ng-lead">Pick a stage size, frame rate and length. Draw on the stage, add keyframes on the timeline, press Enter to play.</p>
                        <div class="ng-stage-row">
                            <span class="ng-stage-label">Stage</span>
                            <div class="ng-stage-chips">
                                <For each={STAGES}>
                                    {(s) => (
                                        <button class="ng-stage-chip" classList={{ active: stage().key === s.key }} onClick={() => setStage(s)}>
                                            {s.label} <span class="ng-stage-dim">{s.w}×{s.h}</span>
                                        </button>
                                    )}
                                </For>
                            </div>
                        </div>
                        <div class="ng-stage-row">
                            <span class="ng-stage-label">Frame rate</span>
                            <div class="ng-stage-chips">
                                <For each={FPS_CHOICES}>
                                    {(f) => (
                                        <button class="ng-stage-chip" classList={{ active: fps() === f }} onClick={() => setFps(f)}>
                                            {f} fps
                                        </button>
                                    )}
                                </For>
                            </div>
                            <span class="ng-stage-label">Length</span>
                            <div class="ng-stage-chips">
                                <For each={[1, 2, 5, 10]}>
                                    {(sec) => (
                                        <button class="ng-stage-chip" classList={{ active: seconds() === sec }} onClick={() => setSeconds(sec)}>
                                            {sec}s <span class="ng-stage-dim">{sec * fps()} frames</span>
                                        </button>
                                    )}
                                </For>
                            </div>
                        </div>
                        <div class="ng-grid">
                            <button class="ng-card" onClick={create}>
                                <span class="ng-card-icon"><Clapperboard size={22} /></span>
                                <span class="ng-card-title">Blank Animation</span>
                                <span class="ng-card-sub">An empty stage and timeline — keyframes, tweens, onion skin</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default NewAnimationDialog;
