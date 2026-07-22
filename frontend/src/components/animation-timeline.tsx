/**
 * AnimationTimeline — the Animate-class frame timeline for docType 'animation'.
 *
 * Bottom-fixed primary chrome: transport header, a DOM layer column on the
 * left, and a single-canvas frame grid on the right (ruler, keyframe dots,
 * span bars, tween arrows, playhead). The grid is canvas-rendered because
 * hundreds of frames × dozens of layers as DOM cells fights scroll-sync and
 * GC; one redraw of the strip is trivially cheap.
 *
 * Interactions: click/drag ruler = scrub · click cell = select + seek + focus
 * layer · drag a keyframe dot = move it · right-click = frame ops (F5/F6/F7…).
 */

import { type Component, For, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { Play, Pause, Square, Repeat, X, Plus, Eye, EyeOff, Lock, LockOpen, Trash2, Download } from 'lucide-solid';
import { store, setStore, setActiveLayer, updateLayer, addLayer, deleteLayer, setIsExportOpen, updateElement } from '../store/app-store';
import {
    gotoFrame, stepFrame, setAnimFps, setAnimFrameCount, ensureAnimRows,
    insertFrame, insertKeyframe, insertBlankKeyframe, clearKeyframe, removeFrames,
    moveKeyframe, setTween, setFrameLabel, setFrameEase,
} from '../store/anim-ops';
import type { EasingName } from '../utils/animation/animation-types';
import { playAnimation, pauseAnimation, stopAnimation } from '../utils/animation/anim-playback';
import { activeKeyframeIndex } from '../utils/animation/frame-timeline-evaluator';
import type { AnimLayer } from '../types/anim-types';
import type { Layer } from '../types';
import ContextMenu, { type MenuItem } from './context-menu';
import { showToast } from './toast';
import './animation-timeline.css';

const CELL_W = 12;
const ROW_H = 26;
const RULER_H = 22;

const AnimationTimeline: Component = () => {
    let gridWrap: HTMLDivElement | undefined;
    let gridCanvas: HTMLCanvasElement | undefined;
    let panelRef: HTMLDivElement | undefined;
    const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; layerId: string; frame: number } | null>(null);
    const [dragKf, setDragKf] = createSignal<{ layerId: string; from: number; to: number } | null>(null);
    const [renamingId, setRenamingId] = createSignal<string | null>(null);
    /** User-resizable body height (drag the panel's top edge; persisted). */
    const [bodyMax, setBodyMax] = createSignal<number>(Number(localStorage.getItem('animTimelineHeight')) || 230);
    const [resizing, setResizing] = createSignal(false);

    const onResizeDown = (e: PointerEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startH = bodyMax();
        setResizing(true);
        const move = (ev: PointerEvent) => {
            // Dragging UP grows the panel; clamp between one row and most of the window.
            setBodyMax(Math.min(Math.max(48, startH + (startY - ev.clientY)), Math.round(window.innerHeight * 0.7)));
        };
        const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            setResizing(false);
            try { localStorage.setItem('animTimelineHeight', String(bodyMax())); } catch { /* ignore */ }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    const tl = () => store.animTimeline;
    const open = () => store.docType === 'animation' && !!tl() && store.showAnimTimeline && store.appMode !== 'presentation';

    /** Top row = topmost layer (highest order), like Animate. */
    const displayLayers = (): Layer[] => [...store.layers].sort((a, b) => b.order - a.order);
    const rowFor = (layerId: string): AnimLayer | undefined => tl()?.layers.find(r => r.layerId === layerId);

    // Older docs / externally-added layers: make sure every layer has a row.
    createEffect(() => {
        if (!open()) return;
        store.layers.length;
        ensureAnimRows();
    });

    // ------------------------------------------------------------------ grid
    const colors = () => {
        const dark = store.resolvedTheme === 'dark' || store.resolvedTheme === 'focus';
        return dark ? {
            bg: '#17171e', line: 'rgba(255,255,255,0.07)', line5: 'rgba(255,255,255,0.14)',
            rulerText: '#9ca3af', span: 'rgba(99,102,241,0.16)', spanEdge: 'rgba(99,102,241,0.4)',
            dot: '#e5e7eb', hollow: '#9ca3af', tween: '#a5b4fc', playhead: '#ef4444',
            sel: 'rgba(99,102,241,0.30)', label: '#fbbf24', off: 'rgba(255,255,255,0.03)',
        } : {
            bg: '#fafafa', line: 'rgba(0,0,0,0.07)', line5: 'rgba(0,0,0,0.16)',
            rulerText: '#6b7280', span: 'rgba(99,102,241,0.12)', spanEdge: 'rgba(99,102,241,0.35)',
            dot: '#1f2937', hollow: '#6b7280', tween: '#6366f1', playhead: '#dc2626',
            sel: 'rgba(99,102,241,0.25)', label: '#d97706', off: 'rgba(0,0,0,0.03)',
        };
    };

    const drawGrid = () => {
        const t = tl();
        if (!t || !gridCanvas) return;
        const layers = displayLayers();
        const c = colors();
        const w = t.frameCount * CELL_W + 2;
        const h = RULER_H + layers.length * ROW_H;
        const dpr = window.devicePixelRatio || 1;
        if (gridCanvas.width !== w * dpr || gridCanvas.height !== h * dpr) {
            gridCanvas.width = w * dpr;
            gridCanvas.height = h * dpr;
            gridCanvas.style.width = `${w}px`;
            gridCanvas.style.height = `${h}px`;
        }
        const ctx = gridCanvas.getContext('2d')!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, w, h);

        const drag = dragKf();
        const sel = store.animFrameSelection;

        // Row backgrounds + spans + keyframes
        layers.forEach((layer, li) => {
            const y = RULER_H + li * ROW_H;
            const row = rowFor(layer.id);
            if (!layer.visible) { ctx.fillStyle = c.off; ctx.fillRect(0, y, w, ROW_H); }
            if (!row) return;

            // Selection highlight
            if (sel && sel.layerId === layer.id) {
                ctx.fillStyle = c.sel;
                for (const f of sel.frames) ctx.fillRect(f * CELL_W, y, CELL_W, ROW_H);
            }

            row.keyframes.forEach((kf, ki) => {
                const kfFrame = drag && drag.layerId === layer.id && drag.from === kf.frame ? drag.to : kf.frame;
                const next = row.keyframes[ki + 1];
                const spanEnd = (next ? next.frame - 1 : row.endFrame);
                const x = kfFrame * CELL_W;
                // Span shading (from the kf's real frame span, not the drag ghost)
                if (spanEnd >= kf.frame) {
                    ctx.fillStyle = c.span;
                    ctx.fillRect(kf.frame * CELL_W, y + 2, (spanEnd - kf.frame + 1) * CELL_W, ROW_H - 4);
                    // End tick
                    ctx.fillStyle = c.spanEdge;
                    ctx.fillRect((spanEnd + 1) * CELL_W - 2, y + 4, 2, ROW_H - 8);
                }
                // Tween arrow across the span
                if (kf.tween && next) {
                    const y0 = y + ROW_H / 2;
                    ctx.strokeStyle = c.tween;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(kf.frame * CELL_W + CELL_W, y0);
                    ctx.lineTo(next.frame * CELL_W - 3, y0);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(next.frame * CELL_W - 7, y0 - 3.5);
                    ctx.lineTo(next.frame * CELL_W - 3, y0);
                    ctx.lineTo(next.frame * CELL_W - 7, y0 + 3.5);
                    ctx.stroke();
                }
                // Keyframe dot: filled = has content, hollow = blank cel
                const cx = x + CELL_W / 2;
                const cy = y + ROW_H / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
                if (kf.elementIds.length > 0) { ctx.fillStyle = c.dot; ctx.fill(); }
                else { ctx.strokeStyle = c.hollow; ctx.lineWidth = 1.4; ctx.stroke(); }
                // Label flag
                if (kf.label) {
                    ctx.fillStyle = c.label;
                    ctx.fillRect(x + 1, y + 2, 2, 8);
                    ctx.font = '9px sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(kf.label, x + 5, y + 9);
                }
            });
        });

        // Vertical gridlines + ruler
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        for (let f = 0; f <= t.frameCount; f++) {
            const x = f * CELL_W;
            const fifth = f % 5 === 0;
            ctx.strokeStyle = fifth ? c.line5 : c.line;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, fifth ? 4 : RULER_H - 5);
            ctx.lineTo(x + 0.5, h);
            ctx.stroke();
            if (fifth && f < t.frameCount) {
                ctx.fillStyle = c.rulerText;
                ctx.fillText(String(f + 1), x + CELL_W / 2, 11);
            }
        }
        // Ruler baseline
        ctx.strokeStyle = c.line5;
        ctx.beginPath();
        ctx.moveTo(0, RULER_H - 0.5);
        ctx.lineTo(w, RULER_H - 0.5);
        ctx.stroke();

        // Playhead
        const px = store.animCurrentFrame * CELL_W;
        ctx.fillStyle = c.playhead;
        ctx.globalAlpha = 0.14;
        ctx.fillRect(px, RULER_H, CELL_W, h - RULER_H);
        ctx.globalAlpha = 1;
        ctx.fillRect(px, 0, CELL_W, RULER_H);
        ctx.beginPath();
        ctx.moveTo(px + 0.5, 0);
        ctx.lineTo(px + 0.5, h);
        ctx.moveTo(px + CELL_W - 0.5, 0);
        ctx.lineTo(px + CELL_W - 0.5, h);
        ctx.strokeStyle = c.playhead;
        ctx.stroke();
    };

    createEffect(() => {
        if (!open()) return;
        // Reactive deps: timeline edits, playhead, selection, drag ghost, layers, theme
        tl();
        store.animCurrentFrame;
        store.animFrameSelection;
        dragKf();
        store.layers.forEach(l => { l.visible; l.order; });
        store.layers.length;
        store.resolvedTheme;
        requestAnimationFrame(drawGrid);
    });

    // Keep the playhead in view while playing/scrubbing.
    createEffect(() => {
        const f = store.animCurrentFrame;
        if (!open() || !gridWrap) return;
        const x = f * CELL_W;
        if (x < gridWrap.scrollLeft || x > gridWrap.scrollLeft + gridWrap.clientWidth - CELL_W * 2) {
            gridWrap.scrollLeft = Math.max(0, x - gridWrap.clientWidth / 2);
        }
    });

    // ---------------------------------------------------------- interactions
    const hit = (e: PointerEvent | MouseEvent): { frame: number; layerId: string | null; onRuler: boolean } => {
        const rect = gridCanvas!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const t = tl()!;
        const frame = Math.min(Math.max(0, Math.floor(x / CELL_W)), t.frameCount - 1);
        if (y < RULER_H) return { frame, layerId: null, onRuler: true };
        const li = Math.floor((y - RULER_H) / ROW_H);
        const layer = displayLayers()[li];
        return { frame, layerId: layer?.id ?? null, onRuler: false };
    };

    const onGridPointerDown = (e: PointerEvent) => {
        if (e.button === 2) return; // context menu handles right-click
        const t = tl();
        if (!t || !gridCanvas) return;
        const h0 = hit(e);
        e.preventDefault();
        gridCanvas.setPointerCapture(e.pointerId);

        if (h0.onRuler) {
            pauseAnimation();
            gotoFrame(h0.frame);
            const move = (ev: PointerEvent) => gotoFrame(hit(ev).frame);
            const up = () => { gridCanvas!.removeEventListener('pointermove', move); gridCanvas!.removeEventListener('pointerup', up); };
            gridCanvas.addEventListener('pointermove', move);
            gridCanvas.addEventListener('pointerup', up);
            return;
        }
        if (!h0.layerId) return;

        setActiveLayer(h0.layerId);
        pauseAnimation();
        gotoFrame(h0.frame);
        // Shift-click extends the frame range on the same layer.
        const prev = store.animFrameSelection;
        if (e.shiftKey && prev && prev.layerId === h0.layerId && prev.frames.length > 0) {
            const a = Math.min(prev.frames[0], h0.frame);
            const b = Math.max(prev.frames[0], h0.frame);
            const frames: number[] = [];
            for (let f = a; f <= b; f++) frames.push(f);
            setStore('animFrameSelection', { layerId: h0.layerId, frames });
        } else {
            setStore('animFrameSelection', { layerId: h0.layerId, frames: [h0.frame] });
        }

        // Dragging a keyframe dot moves it (applied once on release).
        const row = rowFor(h0.layerId);
        if (row?.keyframes.some(k => k.frame === h0.frame)) {
            const move = (ev: PointerEvent) => {
                const f = hit(ev).frame;
                if (f !== h0.frame) setDragKf({ layerId: h0.layerId!, from: h0.frame, to: f });
                else setDragKf(null);
            };
            const up = () => {
                gridCanvas!.removeEventListener('pointermove', move);
                gridCanvas!.removeEventListener('pointerup', up);
                const d = dragKf();
                setDragKf(null);
                if (d) {
                    moveKeyframe(d.layerId, d.from, d.to);
                    setStore('animFrameSelection', { layerId: d.layerId, frames: [d.to] });
                    gotoFrame(d.to);
                }
            };
            gridCanvas.addEventListener('pointermove', move);
            gridCanvas.addEventListener('pointerup', up);
        }
    };

    const onGridContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const h0 = hit(e);
        if (!h0.layerId) return;
        setActiveLayer(h0.layerId);
        gotoFrame(h0.frame);
        setStore('animFrameSelection', { layerId: h0.layerId, frames: [h0.frame] });
        setCtxMenu({ x: e.clientX, y: e.clientY, layerId: h0.layerId, frame: h0.frame });
    };

    /** Create a motion tween; nudge toward one-object-per-layer (Animate's rule). */
    const createTween = (layerId: string, frame: number) => {
        const row = rowFor(layerId);
        const ki = row ? activeKeyframeIndex(row, frame) : -1;
        const kf = ki === -1 ? null : row!.keyframes[ki];
        if (!kf) return;
        if (kf.elementIds.length > 1) {
            showToast('Tip: motion tweens work best with ONE object per layer — matching objects tween, the rest hold', 'info');
        }
        setTween(layerId, kf.frame, 'motion');
    };

    const menuItems = (): MenuItem[] => {
        const m = ctxMenu();
        if (!m) return [];
        const row = rowFor(m.layerId);
        const ki = row ? activeKeyframeIndex(row, m.frame) : -1;
        const activeKf = ki === -1 ? null : row!.keyframes[ki];
        const isKf = activeKf?.frame === m.frame;
        const hasTween = !!activeKf?.tween;
        return [
            { label: 'Insert Frame', shortcut: 'F5', onClick: () => insertFrame(m.layerId, m.frame) },
            { label: 'Insert Keyframe', shortcut: 'F6', onClick: () => insertKeyframe(m.layerId, m.frame) },
            { label: 'Insert Blank Keyframe', shortcut: 'F7', onClick: () => insertBlankKeyframe(m.layerId, m.frame) },
            { separator: true },
            hasTween
                ? { label: 'Remove Motion Tween', onClick: () => activeKf && setTween(m.layerId, activeKf.frame, 'none') }
                : { label: 'Create Motion Tween', disabled: !activeKf, onClick: () => activeKf && createTween(m.layerId, activeKf.frame) },
            { separator: true },
            {
                label: 'Insert Label…', disabled: !isKf, onClick: () => {
                    const cur = activeKf?.label ?? '';
                    const label = prompt('Frame label', cur);
                    if (label !== null) setFrameLabel(m.layerId, m.frame, label.trim());
                }
            },
            { separator: true },
            { label: 'Clear Keyframe', shortcut: 'Shift+F6', disabled: !isKf, onClick: () => clearKeyframe(m.layerId, m.frame) },
            { label: 'Remove Frame', shortcut: 'Shift+F5', onClick: () => removeFrames(m.layerId, m.frame) },
        ];
    };

    onCleanup(() => pauseAnimation());

    // Publish the panel's height as --anim-timeline-h so fixed bottom-anchored
    // chrome (the Settings/Properties/Help cluster) can lift itself above the
    // panel instead of floating on top of the layer column.
    let panelRO: ResizeObserver | undefined;
    const setPanelHeightVar = () =>
        document.documentElement.style.setProperty('--anim-timeline-h', `${panelRef?.offsetHeight ?? 0}px`);
    createEffect(() => {
        if (open() && panelRef) {
            setPanelHeightVar();
            panelRO = new ResizeObserver(setPanelHeightVar);
            panelRO.observe(panelRef);
        } else {
            panelRO?.disconnect();
            panelRO = undefined;
            document.documentElement.style.removeProperty('--anim-timeline-h');
        }
    });
    onCleanup(() => {
        panelRO?.disconnect();
        document.documentElement.style.removeProperty('--anim-timeline-h');
    });

    // ------------------------------------------------- frame properties bar
    /** The keyframe governing the selected frame (its span contains it). */
    const selectedKf = () => {
        const sel = store.animFrameSelection;
        if (!sel || sel.frames.length === 0) return null;
        const row = rowFor(sel.layerId);
        if (!row) return null;
        const ki = activeKeyframeIndex(row, sel.frames[0]);
        if (ki === -1) return null;
        return { layerId: sel.layerId, kf: row.keyframes[ki], exact: row.keyframes[ki].frame === sel.frames[0] };
    };

    const EASINGS: EasingName[] = ['linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
        'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInExpo', 'easeOutExpo', 'easeInOutExpo', 'easeOutBounce'];

    /** The selected element, when it's a single movie-clip instance. */
    const selectedClipInst = () => {
        if (store.selection.length !== 1) return null;
        const el = store.elements.find(e => e.id === store.selection[0]);
        if (el?.type !== 'symbolInstance') return null;
        const sym = store.symbols.find(s => s.id === el.symbolId);
        return sym?.kind === 'movieclip' ? el : null;
    };

    // ----------------------------------------------------------------- view
    return (
        <Show when={open()}>
            <div class="atl-panel" ref={panelRef} style={{ '--atl-body-max': `${bodyMax()}px` }}>
                <div class="atl-resize" classList={{ dragging: resizing() }} title="Drag to resize the timeline" onPointerDown={onResizeDown} />
                <div class="atl-header">
                    <button class="atl-btn" title="Stop (rewind to frame 1)" onClick={stopAnimation}><Square size={12} /></button>
                    <button class="atl-btn atl-play" title={store.animPlaying ? 'Pause (Enter)' : 'Play (Enter)'}
                        onClick={() => (store.animPlaying ? pauseAnimation() : playAnimation())}>
                        <Show when={store.animPlaying} fallback={<Play size={13} />}><Pause size={13} /></Show>
                    </button>
                    <span class="atl-frame" title="Current frame / total — step with , and .">
                        <button class="atl-step" onClick={() => stepFrame(-1)}>‹</button>
                        {store.animCurrentFrame + 1} / {tl()!.frameCount}
                        <button class="atl-step" onClick={() => stepFrame(1)}>›</button>
                    </span>
                    <label class="atl-num" title="Frames per second">
                        <input type="number" min="1" max="120" value={tl()!.fps}
                            onChange={(e) => setAnimFps(Number(e.currentTarget.value))} /> fps
                    </label>
                    <label class="atl-num" title="Timeline length in frames">
                        <input type="number" min="1" max="9999" value={tl()!.frameCount}
                            onChange={(e) => setAnimFrameCount(Number(e.currentTarget.value))} /> frames
                    </label>
                    <button class="atl-btn" classList={{ active: store.animLoop }} title="Loop playback"
                        onClick={() => setStore('animLoop', v => !v)}><Repeat size={12} /></button>
                    <button class="atl-btn" classList={{ active: store.animOnion.enabled }} title="Onion skin"
                        onClick={() => setStore('animOnion', 'enabled', v => !v)}>Onion</button>
                    <Show when={store.animOnion.enabled}>
                        <label class="atl-num" title="Ghost frames before">
                            <input type="number" min="0" max="10" value={store.animOnion.before}
                                onChange={(e) => setStore('animOnion', 'before', Math.max(0, Math.min(10, Number(e.currentTarget.value))))} />
                        </label>
                        <label class="atl-num" title="Ghost frames after">
                            <input type="number" min="0" max="10" value={store.animOnion.after}
                                onChange={(e) => setStore('animOnion', 'after', Math.max(0, Math.min(10, Number(e.currentTarget.value))))} />
                        </label>
                    </Show>
                    <div class="atl-spacer" />
                    {/* Movie-clip instance properties (single clip instance selected) */}
                    <Show when={selectedClipInst()}>
                        {(inst) => (
                            <span class="atl-frameprops">
                                <span class="atl-fp-title">Clip</span>
                                <select class="atl-select" title="How the clip's timeline plays" value={inst().loopMode ?? 'loop'}
                                    onChange={(e) => updateElement(inst().id, { loopMode: e.currentTarget.value as any })}>
                                    <option value="loop">loop</option>
                                    <option value="once">play once</option>
                                    <option value="single">single frame</option>
                                </select>
                                <label class="atl-num" title="Clip-local frame playback starts at (1-based)">
                                    <input type="number" min="1" value={(inst().firstFrame ?? 0) + 1}
                                        onChange={(e) => updateElement(inst().id, { firstFrame: Math.max(0, Number(e.currentTarget.value) - 1) })} />
                                </label>
                            </span>
                        )}
                    </Show>
                    {/* Frame properties: the keyframe governing the selected frame */}
                    <Show when={selectedKf()}>
                        {(s) => (
                            <span class="atl-frameprops">
                                <span class="atl-fp-title">Keyframe {s().kf.frame + 1}</span>
                                <label class="atl-num" title="Motion-tween the span leaving this keyframe">
                                    <input type="checkbox" checked={s().kf.tween === 'motion'}
                                        onChange={(e) => e.currentTarget.checked ? createTween(s().layerId, s().kf.frame) : setTween(s().layerId, s().kf.frame, 'none')} />
                                    Tween
                                </label>
                                <Show when={s().kf.tween === 'motion'}>
                                    <select class="atl-select" title="Tween easing" value={s().kf.easing ?? 'linear'}
                                        onChange={(e) => setFrameEase(s().layerId, s().kf.frame, undefined, e.currentTarget.value as EasingName)}>
                                        <For each={EASINGS}>{(name) => <option value={name}>{name}</option>}</For>
                                    </select>
                                </Show>
                                <Show when={s().exact}>
                                    <input class="atl-label-input" placeholder="label" value={s().kf.label ?? ''}
                                        onChange={(e) => setFrameLabel(s().layerId, s().kf.frame, e.currentTarget.value.trim())} />
                                </Show>
                            </span>
                        )}
                    </Show>
                    <button class="atl-btn" title="Export as GIF / video" onClick={() => setIsExportOpen(true)}><Download size={12} /></button>
                    <button class="atl-btn" title="Hide timeline" onClick={() => setStore('showAnimTimeline', false)}><X size={13} /></button>
                </div>
                <div class="atl-body">
                    <div class="atl-layers">
                        <div class="atl-layers-head">
                            <span>Layers</span>
                            <button class="atl-icon" title="New layer" onClick={() => addLayer()}><Plus size={13} /></button>
                        </div>
                        <For each={displayLayers()}>
                            {(layer) => (
                                <div class="atl-layer-row" classList={{ active: store.activeLayerId === layer.id }}
                                    onClick={() => setActiveLayer(layer.id)}>
                                    <Show when={renamingId() === layer.id} fallback={
                                        <span class="atl-layer-name" onDblClick={() => setRenamingId(layer.id)} title="Double-click to rename">{layer.name}</span>
                                    }>
                                        <input class="atl-rename" value={layer.name} autofocus
                                            onBlur={(e) => { updateLayer(layer.id, { name: e.currentTarget.value || layer.name }); setRenamingId(null); }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); if (e.key === 'Escape') setRenamingId(null); }} />
                                    </Show>
                                    <button class="atl-icon" title={layer.visible ? 'Hide layer' : 'Show layer'}
                                        onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}>
                                        <Show when={layer.visible} fallback={<EyeOff size={12} />}><Eye size={12} /></Show>
                                    </button>
                                    <button class="atl-icon" title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                                        onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}>
                                        <Show when={layer.locked} fallback={<LockOpen size={12} />}><Lock size={12} /></Show>
                                    </button>
                                    <button class="atl-icon atl-danger" title="Delete layer (and its frames)"
                                        onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}><Trash2 size={12} /></button>
                                </div>
                            )}
                        </For>
                    </div>
                    <div class="atl-gridwrap" ref={gridWrap}>
                        <canvas ref={gridCanvas} class="atl-grid"
                            onPointerDown={onGridPointerDown}
                            onContextMenu={onGridContextMenu} />
                    </div>
                </div>
            </div>
            <Show when={ctxMenu()}>
                <ContextMenu x={ctxMenu()!.x} y={ctxMenu()!.y} items={menuItems()} onClose={() => setCtxMenu(null)} />
            </Show>
        </Show>
    );
};

export default AnimationTimeline;
