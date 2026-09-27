import { type Component, For, Show, createMemo, createEffect, on } from 'solid-js';
import { store, setStore, toggleSceneTimeline } from '../store/app-store';
import { isPagedDocType } from '../types/slide-types';
import { tinyflyClipEnd } from '../utils/animation/tinyfly-clips';
import { getClip, CLIP_LIST, getFigureSequence, setFigureSequence, getFigureFaceKeys, moveFigureFaceKey, removeFigureFaceKey, faceHairSvg, FACE_STYLES, type FaceKey } from '../library/stick-figures';
import { t } from '../i18n';
import { Play, Pause, RotateCcw, Repeat, X, Film, MonitorPlay } from 'lucide-solid';
import './scene-timeline.css';

/** Block colour per motion clip. */
const CLIP_COLOR: Record<string, string> = {
    idle: '#94a3b8', walk: '#3b82f6', run: '#06b6d4', wave: '#22c55e', talk: '#8b5cf6',
    point: '#f59e0b', clap: '#ec4899', jump: '#ef4444', dance: '#d946ef', cheer: '#f97316',
};
const clipColor = (id: string) => CLIP_COLOR[id] || '#6366f1';
const clipName = (id: string) => CLIP_LIST.find(c => c.id === id)?.name || id;

interface FigTrack { id: string; label: string; steps: { clip: string; dur: number }[]; total: number; editable: boolean; faceKeys: FaceKey[]; }

/** A small head wearing a key's expression, for the timeline marker. */
const keyThumb = (k: FaceKey): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor"`
    + ` stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="50" r="40"/>`
    + faceHairSvg(50, 50, 40, { face: k.face ?? 'neutral', eyes: k.eyes, brows: k.brows, mouth: k.mouth, accent: k.accent }) + `</svg>`;
const keyName = (k: FaceKey): string => {
    const parts = (['eyes', 'brows', 'mouth', 'accent'] as const).filter(p => k[p] && k[p] !== 'auto').map(p => `${p}: ${k[p]}`);
    const face = k.face ? FACE_STYLES.find(f => f.id === k.face)?.name ?? k.face : t('stickFace.ownFace');
    return parts.length ? `${face} (${parts.join(', ')})` : face;
};

const SceneTimeline: Component = () => {
    /** Animated figures on the canvas → track rows. */
    const tracks = createMemo<FigTrack[]>(() => {
        const figs = store.elements.filter(e => e.type === 'stickRig');
        return figs.map((e, i) => {
            const r = e.stickRig!;
            let steps: { clip: string; dur: number }[];
            if (r.sequence?.length) steps = r.sequence as any;
            else if (r.path) steps = [{ clip: 'walk', dur: r.path.dur || 4 }];
            else steps = [{ clip: r.clip, dur: getClip(r.clip).duration }];
            const total = steps.reduce((s, a) => s + Math.max(0.1, a.dur), 0);
            return { id: e.id, label: `Figure ${i + 1}`, steps, total, editable: !!r.sequence?.length, faceKeys: getFigureFaceKeys(e.id) };
        });
    });

    /** Drag a block body to reorder that step within the sequence (live). */
    const reorderStep = (e: PointerEvent, figureId: string, index: number) => {
        e.preventDefault();
        const rowEl = (e.currentTarget as HTMLElement).closest('.st-row') as HTMLElement;
        if (!rowEl) return;
        const rect = rowEl.getBoundingClientRect();
        const pps = rect.width / Math.max(0.5, store.storyDuration);
        const startX = e.clientX;
        let di = index, moved = false;
        const move = (ev: PointerEvent) => {
            if (!moved && Math.abs(ev.clientX - startX) < 5) return;
            moved = true;
            const pt = (ev.clientX - rect.left) / pps;
            const cur = getFigureSequence(figureId);
            if (di < 0 || di >= cur.length) return;
            const dragged = cur[di];
            const rest = cur.filter((_, i) => i !== di);
            let acc = 0, ins = rest.length;
            for (let i = 0; i < rest.length; i++) { const c = acc + rest[i].dur / 2; if (pt < c) { ins = i; break; } acc += rest[i].dur; }
            if (ins !== di) { setFigureSequence(figureId, [...rest.slice(0, ins), dragged, ...rest.slice(ins)]); di = ins; }
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    /** Drag a sequence block's right edge to change that step's duration (snap 0.5s). */
    const resizeStep = (e: PointerEvent, figureId: string, stepIndex: number) => {
        e.stopPropagation(); e.preventDefault();
        const rowEl = (e.currentTarget as HTMLElement).closest('.st-row') as HTMLElement;
        if (!rowEl) return;
        const pps = rowEl.getBoundingClientRect().width / Math.max(0.5, store.storyDuration);
        const startX = e.clientX;
        const startDur = getFigureSequence(figureId)[stepIndex]?.dur ?? 2;
        const move = (ev: PointerEvent) => {
            const nd = Math.max(0.5, Math.round((startDur + (ev.clientX - startX) / pps) * 2) / 2);
            const cur = getFigureSequence(figureId);
            setFigureSequence(figureId, cur.map((s, i) => i === stepIndex ? { ...s, dur: nd } : s));
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    /** Drag an expression key along its row to retime it (snap 0.1 s). */
    const dragFaceKey = (e: PointerEvent, figureId: string, index: number) => {
        e.stopPropagation(); e.preventDefault();
        const rowEl = (e.currentTarget as HTMLElement).closest('.st-row') as HTMLElement;
        if (!rowEl) return;
        const rect = rowEl.getBoundingClientRect();
        const pps = rect.width / Math.max(0.5, store.storyDuration);
        const startX = e.clientX;
        const startT = getFigureFaceKeys(figureId)[index]?.t ?? 0;
        let moved = false;
        const move = (ev: PointerEvent) => {
            if (!moved && Math.abs(ev.clientX - startX) < 3) return;
            moved = true;
            const t = Math.max(0, Math.round((startT + (ev.clientX - startX) / pps) * 10) / 10);
            // Keys re-sort by time, so find this one again by its old time before each move.
            const keys = getFigureFaceKeys(figureId);
            const i = keys.findIndex(k => 1e-6 > Math.abs(k.t - lastT));
            if (i >= 0 && t !== lastT) { moveFigureFaceKey(figureId, i, t); lastT = t; }
        };
        let lastT = startT;
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // Scene duration and the play controller live in utils/animation/scene-clock.ts, so the
    // playhead moves (and loops) with this panel closed too.

    // Restart the scene from 0 when the active slide/page changes (if enabled).
    createEffect(on(() => store.activeSlideIndex, () => {
        if (store.showSceneTimeline && store.storySyncSlides) setStore({ storyTime: 0, storyPlaying: true } as any);
    }, { defer: true }));

    const paged = createMemo(() => isPagedDocType(store.docType));

    const dur = () => store.storyDuration;
    const pct = (v: number) => `${Math.max(0, Math.min(100, (v / dur()) * 100))}%`;

    const play = () => setStore('storyPlaying', !store.storyPlaying);
    const restart = () => setStore({ storyTime: 0, storyPlaying: true } as any);

    let rulerRef: HTMLDivElement | undefined;
    const seekFromEvent = (clientX: number) => {
        if (!rulerRef) return;
        const r = rulerRef.getBoundingClientRect();
        const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
        setStore({ storyTime: f * dur(), storyPlaying: false } as any);
    };
    const onRulerDown = (e: PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        seekFromEvent(e.clientX);
        const move = (ev: PointerEvent) => seekFromEvent(ev.clientX);
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const selectFigure = (id: string) => setStore('selection', [id]);

    return (
        <Show when={store.showSceneTimeline}>
            <div class="scene-timeline">
                <div class="st-bar">
                    <div class="st-title"><Film size={14} /> Scene Timeline</div>
                    <button class="st-btn" title="Restart" onClick={restart}><RotateCcw size={15} /></button>
                    <button class="st-btn st-play" title={store.storyPlaying ? 'Pause' : 'Play'} onClick={play}>
                        <Show when={store.storyPlaying} fallback={<Play size={16} />}><Pause size={16} /></Show>
                    </button>
                    <button class={`st-btn ${store.storyLoop ? 'active' : ''}`} title="Loop" onClick={() => setStore('storyLoop', !store.storyLoop)}><Repeat size={15} /></button>
                    <Show when={paged()}>
                        <button class={`st-btn ${store.storySyncSlides ? 'active' : ''}`}
                            title="Restart the scene when the slide/page changes" onClick={() => setStore('storySyncSlides', !store.storySyncSlides)}><MonitorPlay size={15} /></button>
                    </Show>
                    <span class="st-time">{store.storyTime.toFixed(1)} / {dur().toFixed(1)}s</span>
                    <div class="st-spacer" />
                    <button class="st-btn" title="Close" onClick={() => toggleSceneTimeline(false)}><X size={15} /></button>
                </div>

                <div class="st-body">
                    <Show when={tracks().length > 0 || store.tinyflyClips.length > 0 || store.compositionTracks.length > 0} fallback={
                        <div class="st-empty">Add animated figures (Stick Figures → Animated) — they'll appear here as tracks you can play and scrub together.</div>
                    }>
                        <div class="st-tracks">
                            <For each={tracks()}>
                                {(tk) => (
                                    <div class="st-track">
                                        <button class={`st-label ${store.selection.includes(tk.id) ? 'sel' : ''}`} onClick={() => selectFigure(tk.id)}>{tk.label}</button>
                                        <div class="st-row">
                                            <For each={(() => { let acc = 0; return tk.steps.map(s => { const start = acc; acc += Math.max(0.1, s.dur); return { ...s, start }; }); })()}>
                                                {(seg, i) => (
                                                    <div class="st-block" classList={{ editable: tk.editable }}
                                                        title={`${clipName(seg.clip)} · ${seg.dur}s${tk.editable ? ' — drag to reorder, drag the edge to resize' : ''}`}
                                                        style={{ left: pct(seg.start), width: pct(seg.dur), background: clipColor(seg.clip) }}
                                                        onPointerDown={(e) => { if (tk.editable) reorderStep(e, tk.id, i()); }}>
                                                        <span>{clipName(seg.clip)}</span>
                                                        <Show when={tk.editable}>
                                                            <div class="st-resize" onPointerDown={(e) => resizeStep(e, tk.id, i())} />
                                                        </Show>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                )}
                            </For>
                            {/* Expression keys: one Face row per figure that has any. The face
                                switches at each marker and holds until the next. */}
                            <For each={tracks().filter(tk => tk.faceKeys.length > 0)}>
                                {(tk) => (
                                    <div class="st-track st-faces">
                                        <button class={`st-label ${store.selection.includes(tk.id) ? 'sel' : ''}`}
                                            title={t('stickFace.faceRowHint')}
                                            onClick={() => selectFigure(tk.id)}>{t('stickFace.faceRow', { name: tk.label })}</button>
                                        <div class="st-row">
                                            <For each={tk.faceKeys}>
                                                {(k, i) => (
                                                    <div class="st-facekey" style={{ left: pct(k.t) }}
                                                        title={t('stickFace.faceKeyHint', { time: k.t.toFixed(1), name: keyName(k) })}
                                                        onPointerDown={(e) => dragFaceKey(e, tk.id, i())}
                                                        onDblClick={() => removeFigureFaceKey(tk.id, i())}
                                                        innerHTML={keyThumb(k)} />
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                )}
                            </For>
                            {/* tinyfly clips: one read-only row each, spanning where the clip plays.
                                An endless loop runs to the end of the scene. Click the name to
                                select the shapes it drives. */}
                            <For each={store.tinyflyClips}>
                                {(clip) => {
                                    const end = () => clip.definition?.config?.loop === -1 ? dur() : tinyflyClipEnd(clip);
                                    const ids = () => Object.values(clip.bindings ?? {});
                                    return (
                                        <div class="st-track st-tinyfly" classList={{ muted: clip.enabled === false }}>
                                            <button class={`st-label ${ids().length && ids().every(id => store.selection.includes(id)) ? 'sel' : ''}`}
                                                title={clip.name} onClick={() => setStore('selection', ids())}>{clip.name}</button>
                                            <div class="st-row">
                                                <div class="st-block" title={`${clip.name} · ${clip.start.toFixed(1)}–${end().toFixed(1)}s`}
                                                    style={{ left: pct(clip.start), width: pct(Math.max(0.1, end() - clip.start)) }}>
                                                    <span>{clip.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                        {/* Ruler + playhead overlaid on the track area */}
                        <div class="st-ruler" ref={rulerRef} onPointerDown={onRulerDown}>
                            <For each={Array.from({ length: Math.floor(dur()) + 1 })}>
                                {(_, i) => <div class="st-tick" style={{ left: pct(i()) }}><span>{i()}s</span></div>}
                            </For>
                        </div>
                        <div class="st-playhead" style={{ left: `calc(88px + (100% - 88px) * ${store.storyTime / dur()})` }} />
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default SceneTimeline;
