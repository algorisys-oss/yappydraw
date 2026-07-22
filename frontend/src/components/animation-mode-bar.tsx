/**
 * AnimationModeBar — the transport strip for Animation mode (docType
 * 'animation'): play/pause/stop, frame readout, fps, loop, onion-skin
 * controls and the timeline toggle. Hides while the bottom timeline panel is
 * open (the panel carries its own transport) and while presenting.
 */

import { type Component, Show } from 'solid-js';
import { Play, Pause, Square, Repeat, Layers3, Download } from 'lucide-solid';
import { store, setStore, setIsExportOpen } from '../store/app-store';
import { setAnimFps, stepFrame } from '../store/anim-ops';
import { playAnimation, pauseAnimation, stopAnimation } from '../utils/animation/anim-playback';
import './animation-mode-bar.css';

const OnionGhost: Component<{ size?: number }> = (p) => (
    // Two offset circles — the classic onion-skin glyph (lucide has none).
    <svg width={p.size ?? 14} height={p.size ?? 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="9" cy="12" r="6" opacity="0.45" />
        <circle cx="15" cy="12" r="6" />
    </svg>
);

export const AnimationModeBar: Component = () => {
    const tl = () => store.animTimeline;
    return (
        <Show when={store.docType === 'animation' && tl() && store.appMode !== 'presentation' && !store.showAnimTimeline}>
            <div class="anim-mode-bar" role="toolbar" aria-label="Animation playback">
                <button class="amb-btn" title="Stop (rewind to frame 1)" onClick={stopAnimation}><Square size={13} /></button>
                <button class="amb-btn amb-play" title={store.animPlaying ? 'Pause (Enter)' : 'Play (Enter)'}
                    onClick={() => (store.animPlaying ? pauseAnimation() : playAnimation())}>
                    <Show when={store.animPlaying} fallback={<Play size={14} />}><Pause size={14} /></Show>
                </button>
                <span class="amb-frame" title="Current frame / total frames — step with , and .">
                    <button class="amb-step" onClick={() => stepFrame(-1)}>‹</button>
                    {store.animCurrentFrame + 1} / {tl()!.frameCount}
                    <button class="amb-step" onClick={() => stepFrame(1)}>›</button>
                </span>
                <label class="amb-fps" title="Frames per second">
                    <input type="number" min="1" max="120" value={tl()!.fps}
                        onChange={(e) => setAnimFps(Number(e.currentTarget.value))} />
                    fps
                </label>
                <button class="amb-btn" classList={{ active: store.animLoop }} title="Loop playback"
                    onClick={() => setStore('animLoop', v => !v)}><Repeat size={13} /></button>
                <button class="amb-btn" classList={{ active: store.animOnion.enabled }} title="Onion skin (ghost neighboring frames)"
                    onClick={() => setStore('animOnion', 'enabled', v => !v)}><OnionGhost /></button>
                <Show when={store.animOnion.enabled}>
                    <label class="amb-fps" title="Ghost frames before the playhead">
                        <input type="number" min="0" max="10" value={store.animOnion.before}
                            onChange={(e) => setStore('animOnion', 'before', Math.max(0, Math.min(10, Number(e.currentTarget.value))))} />
                    </label>
                    <label class="amb-fps" title="Ghost frames after the playhead">
                        <input type="number" min="0" max="10" value={store.animOnion.after}
                            onChange={(e) => setStore('animOnion', 'after', Math.max(0, Math.min(10, Number(e.currentTarget.value))))} />
                    </label>
                </Show>
                <button class="amb-btn" title="Show timeline" onClick={() => setStore('showAnimTimeline', true)}><Layers3 size={13} /> Timeline</button>
                <button class="amb-btn" title="Export as GIF / video" onClick={() => setIsExportOpen(true)}><Download size={13} /></button>
            </div>
        </Show>
    );
};

export default AnimationModeBar;
