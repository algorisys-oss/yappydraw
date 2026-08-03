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
    insertFrame, insertKeyframeAndSelect, insertBlankKeyframe, clearKeyframe, removeFrames,
    moveKeyframe, setTween, setFrameLabel, setFrameEase, setFrameGuide, setFrameAction,
    addAudioClip, removeAudioClip, moveAudioClip, setCameraKeyFromView, clearCameraKey,
    addAnimScene, setActiveAnimScene, deleteAnimScene,
} from '../store/anim-ops';
import { SFX, playSfx } from '../game/sound-engine';
import { pushToHistory } from '../store/app-store';
import type { EasingName } from '../utils/animation/animation-types';
import type { BezierEase } from '../types/motion-types';
import { playAnimation, pauseAnimation, stopAnimation } from '../utils/animation/anim-playback';
import { activeKeyframeIndex } from '../utils/animation/frame-timeline-evaluator';
import type { AnimLayer } from '../types/anim-types';
import type { Layer } from '../types';
import ContextMenu, { type MenuItem } from './context-menu';
import { showToast } from './toast';
import { CLIP_LIST } from '../library/stick-figures/anim/clips';
import './animation-timeline.css';

const CELL_W = 12;
const ROW_H = 26;
const RULER_H = 22;
const AUDIO_H = 20; // the audio row, between the ruler and the layer rows

/** Rough synth-SFX durations (seconds) — drives the audio block width. */
const SFX_DUR: Record<string, number> = {
    coin: 0.2, jump: 0.15, hit: 0.15, powerup: 0.35, explosion: 0.45,
    blip: 0.06, win: 0.6, lose: 0.75, click: 0.05,
};

const AnimationTimeline: Component = () => {
    let gridWrap: HTMLDivElement | undefined;
    let gridCanvas: HTMLCanvasElement | undefined;
    let panelRef: HTMLDivElement | undefined;
    const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; layerId: string; frame: number } | null>(null);
    const [audioMenu, setAudioMenu] = createSignal<{ x: number; y: number; frame: number; clipId: string | null } | null>(null);
    const [dragAudio, setDragAudio] = createSignal<{ id: string; to: number } | null>(null);
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
            dot: '#e5e7eb', hollow: '#9ca3af', tween: '#a5b4fc', tweenShape: '#4ade80', playhead: '#ef4444',
            sel: 'rgba(99,102,241,0.30)', label: '#fbbf24', off: 'rgba(255,255,255,0.03)',
        } : {
            bg: '#fafafa', line: 'rgba(0,0,0,0.07)', line5: 'rgba(0,0,0,0.16)',
            rulerText: '#6b7280', span: 'rgba(99,102,241,0.12)', spanEdge: 'rgba(99,102,241,0.35)',
            dot: '#1f2937', hollow: '#6b7280', tween: '#6366f1', tweenShape: '#16a34a', playhead: '#dc2626',
            sel: 'rgba(99,102,241,0.25)', label: '#d97706', off: 'rgba(0,0,0,0.03)',
        };
    };

    const drawGrid = () => {
        const t = tl();
        if (!t || !gridCanvas) return;
        const layers = displayLayers();
        const c = colors();
        const w = t.frameCount * CELL_W + 2;
        const h = RULER_H + AUDIO_H + layers.length * ROW_H;
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

        // Audio row (between ruler and layer rows): amber sound blocks
        {
            const ay = RULER_H;
            ctx.fillStyle = c.off;
            ctx.fillRect(0, ay, w, AUDIO_H);
            const dragA = dragAudio();
            for (const clip of (t.audio ?? [])) {
                const f = dragA?.id === clip.id ? dragA.to : clip.frame;
                const durSec = clip.durationSec ?? (clip.sfx ? (SFX_DUR[clip.sfx] ?? 0.2) : 0.5);
                const bw = Math.max(CELL_W * 1.5, durSec * t.fps * CELL_W);
                const bx = f * CELL_W;
                ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
                ctx.fillRect(bx, ay + 2, bw, AUDIO_H - 4);
                ctx.strokeStyle = '#f59e0b';
                ctx.strokeRect(bx + 0.5, ay + 2.5, bw - 1, AUDIO_H - 5);
                ctx.fillStyle = c.rulerText;
                ctx.font = '9px sans-serif';
                ctx.textAlign = 'left';
                ctx.save();
                ctx.beginPath();
                ctx.rect(bx, ay, bw, AUDIO_H);
                ctx.clip();
                ctx.fillText(`♪ ${clip.name}`, bx + 3, ay + 13);
                ctx.restore();
            }
        }

        // Row backgrounds + spans + keyframes
        layers.forEach((layer, li) => {
            const y = RULER_H + AUDIO_H + li * ROW_H;
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
                // Tween arrow across the span (indigo = motion, green = shape morph)
                if (kf.tween && next) {
                    const y0 = y + ROW_H / 2;
                    ctx.strokeStyle = kf.tween === 'shape' ? c.tweenShape : c.tween;
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
                // Frame action glyph (Animate's little "a" above the dot)
                if (kf.action) {
                    ctx.fillStyle = c.label;
                    ctx.font = 'bold 9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('a', x + CELL_W / 2, y + 8);
                }
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
        dragAudio();
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
    const hit = (e: PointerEvent | MouseEvent): { frame: number; layerId: string | null; onRuler: boolean; onAudio: boolean } => {
        const rect = gridCanvas!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const t = tl()!;
        const frame = Math.min(Math.max(0, Math.floor(x / CELL_W)), t.frameCount - 1);
        if (y < RULER_H) return { frame, layerId: null, onRuler: true, onAudio: false };
        if (y < RULER_H + AUDIO_H) return { frame, layerId: null, onRuler: false, onAudio: true };
        const li = Math.floor((y - RULER_H - AUDIO_H) / ROW_H);
        const layer = displayLayers()[li];
        return { frame, layerId: layer?.id ?? null, onRuler: false, onAudio: false };
    };

    /** The audio clip whose block covers `frame` (topmost = latest-starting). */
    const audioClipAt = (frame: number) => {
        const t = tl();
        if (!t?.audio) return null;
        for (let i = t.audio.length - 1; i >= 0; i--) {
            const clip = t.audio[i];
            const durSec = clip.durationSec ?? (clip.sfx ? (SFX_DUR[clip.sfx] ?? 0.2) : 0.5);
            const span = Math.max(1.5, durSec * t.fps);
            if (frame >= clip.frame && frame <= clip.frame + span) return clip;
        }
        return null;
    };

    const onGridPointerDown = (e: PointerEvent) => {
        if (e.button === 2) return; // context menu handles right-click
        const t = tl();
        if (!t || !gridCanvas) return;
        const h0 = hit(e);
        e.preventDefault();
        gridCanvas.setPointerCapture(e.pointerId);
        // Touch/pen only — starts the hold that opens the frame menu. Armed before the
        // per-branch drag handlers below so it covers the ruler and audio rows too, and
        // cancelled by its own move/up listeners the moment the press turns into a drag.
        armLongPress(e);

        // Audio row: drag a sound block to move its start frame.
        if (h0.onAudio) {
            const clip = audioClipAt(h0.frame);
            if (!clip) return;
            const move = (ev: PointerEvent) => {
                const f = hit(ev).frame;
                setDragAudio(f !== clip.frame ? { id: clip.id, to: f } : null);
            };
            const up = () => {
                gridCanvas!.removeEventListener('pointermove', move);
                gridCanvas!.removeEventListener('pointerup', up);
                const d = dragAudio();
                setDragAudio(null);
                if (d) moveAudioClip(d.id, d.to);
            };
            gridCanvas.addEventListener('pointermove', move);
            gridCanvas.addEventListener('pointerup', up);
            return;
        }

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

    /**
     * Open the frame (or audio) menu for a point on the grid. Shared by the mouse
     * right-click and the touch long-press below, so a tablet gets byte-identical
     * behaviour rather than a reduced second implementation.
     */
    const openGridMenuAt = (clientX: number, clientY: number, h0: ReturnType<typeof hit>) => {
        if (h0.onAudio) {
            setAudioMenu({ x: clientX, y: clientY, frame: h0.frame, clipId: audioClipAt(h0.frame)?.id ?? null });
            return;
        }
        if (!h0.layerId) return;
        setActiveLayer(h0.layerId);
        gotoFrame(h0.frame);
        setStore('animFrameSelection', { layerId: h0.layerId, frames: [h0.frame] });
        setCtxMenu({ x: clientX, y: clientY, layerId: h0.layerId, frame: h0.frame });
    };

    const onGridContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        openGridMenuAt(e.clientX, e.clientY, hit(e));
    };

    // ── Long-press → the frame menu (touch / pen) ────────────────────────────
    // iPad and Android don't reliably fire `contextmenu` on a touch or pen long-press
    // (canvas.tsx carries the same note and hand-rolls the same detector). The grid only
    // bound onContextMenu, so on a keyboard-less tablet the ENTIRE frame vocabulary —
    // Insert Keyframe, Insert Blank Keyframe, motion/shape tweens, frame labels, frame
    // actions, Clear Keyframe, Remove Frame — had no route at all: no F-keys, no menu.
    // Detect the hold ourselves. Mouse is excluded; it already has a real right-click.
    const LONG_PRESS_MS = 500;
    const LONG_PRESS_SLOP = 10; // client px — a scrub drag must not fire the menu
    let lpTimer: number | null = null;

    const armLongPress = (e: PointerEvent) => {
        if (e.pointerType === 'mouse' || !gridCanvas) return;
        const ox = e.clientX, oy = e.clientY;
        const h0 = hit(e);
        const teardown = () => {
            if (lpTimer !== null) { clearTimeout(lpTimer); lpTimer = null; }
            gridCanvas?.removeEventListener('pointermove', onMove);
            gridCanvas?.removeEventListener('pointerup', teardown);
            gridCanvas?.removeEventListener('pointercancel', teardown);
        };
        const onMove = (ev: PointerEvent) => {
            if (Math.hypot(ev.clientX - ox, ev.clientY - oy) > LONG_PRESS_SLOP) teardown();
        };
        if (lpTimer !== null) clearTimeout(lpTimer);
        lpTimer = window.setTimeout(() => {
            teardown();
            openGridMenuAt(ox, oy, h0);
        }, LONG_PRESS_MS);
        gridCanvas.addEventListener('pointermove', onMove);
        gridCanvas.addEventListener('pointerup', teardown);
        gridCanvas.addEventListener('pointercancel', teardown);
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
            // Same behaviour as the F6 key — this menu IS the F6 route on a tablet.
            { label: 'Insert Keyframe', shortcut: 'F6', onClick: () => insertKeyframeAndSelect(m.layerId, m.frame) },
            { label: 'Insert Blank Keyframe', shortcut: 'F7', onClick: () => insertBlankKeyframe(m.layerId, m.frame) },
            { separator: true },
            hasTween
                ? { label: `Remove ${activeKf!.tween === 'shape' ? 'Shape' : 'Motion'} Tween`, onClick: () => activeKf && setTween(m.layerId, activeKf.frame, 'none') }
                : { label: 'Create Motion Tween', disabled: !activeKf, onClick: () => activeKf && createTween(m.layerId, activeKf.frame) },
            ...(!hasTween ? [{ label: 'Create Shape Tween', disabled: !activeKf, onClick: () => activeKf && setTween(m.layerId, activeKf.frame, 'shape') }] : []),
            { separator: true },
            {
                label: 'Insert Label…', disabled: !isKf, onClick: () => {
                    const cur = activeKf?.label ?? '';
                    const label = prompt('Frame label', cur);
                    if (label !== null) setFrameLabel(m.layerId, m.frame, label.trim());
                }
            },
            {
                label: 'Frame Action', disabled: !isKf, submenu: [
                    { label: 'None', checked: !activeKf?.action, onClick: () => setFrameAction(m.layerId, m.frame, null) },
                    { label: 'Stop', checked: activeKf?.action?.kind === 'stop', onClick: () => setFrameAction(m.layerId, m.frame, { kind: 'stop' }) },
                    { label: 'Loop to Frame 1', checked: activeKf?.action?.kind === 'goto' && activeKf.action.frame === 0, onClick: () => setFrameAction(m.layerId, m.frame, { kind: 'goto', frame: 0 }) },
                    {
                        label: 'Go to Frame…', onClick: () => {
                            const v = prompt('Go to frame (1-based):', '1');
                            if (v === null) return;
                            const f = Math.max(1, Number(v) || 1) - 1;
                            setFrameAction(m.layerId, m.frame, { kind: 'goto', frame: f });
                        }
                    },
                    { label: 'Next Scene', checked: activeKf?.action?.kind === 'nextScene', onClick: () => setFrameAction(m.layerId, m.frame, { kind: 'nextScene' }) },
                ]
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

    // ------------------------------------------------------------ audio row
    let audioFileInput: HTMLInputElement | undefined;

    /** Import an audio file → data URL + decoded duration → clip at `frame`. */
    const importAudioAt = (frame: number) => {
        if (!audioFileInput) return;
        audioFileInput.onchange = async () => {
            const file = audioFileInput!.files?.[0];
            audioFileInput!.value = '';
            if (!file) return;
            if (file.size > 4 * 1024 * 1024) { showToast('Audio file too large (4 MB max — it is stored inside the document)', 'error'); return; }
            const dataURL = await new Promise<string>((res, rej) => {
                const r = new FileReader();
                r.onload = () => res(String(r.result));
                r.onerror = rej;
                r.readAsDataURL(file);
            });
            let durationSec: number | undefined;
            try {
                const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
                const actx = new AC();
                const buf = await actx.decodeAudioData(await (await fetch(dataURL)).arrayBuffer());
                durationSec = buf.duration;
                void actx.close();
            } catch { /* unknown duration — block gets the default width */ }
            addAudioClip({ name: file.name.replace(/\.[a-z0-9]+$/i, ''), dataURL, durationSec, frame });
        };
        audioFileInput.click();
    };

    const audioMenuItems = (): MenuItem[] => {
        const m = audioMenu();
        if (!m) return [];
        return [
            ...(m.clipId ? [
                { label: 'Remove Sound', onClick: () => removeAudioClip(m.clipId!) },
                { separator: true } as MenuItem,
            ] : []),
            {
                label: 'Add Sound', submenu: SFX.map(s => ({
                    label: s, onClick: () => { playSfx(s); addAudioClip({ name: s, sfx: s, durationSec: SFX_DUR[s], frame: m.frame }); },
                })),
            },
            { label: 'Import Audio File…', onClick: () => importAudioAt(m.frame) },
        ];
    };

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

    // ------------------------------------------------ ease curve editor
    const LINEAR_EASE: BezierEase = { ox: 0, oy: 0, ix: 1, iy: 1 };
    const EASE_PRESETS: { key: string; label: string; ease: BezierEase }[] = [
        { key: 'linear', label: 'Linear', ease: { ox: 0, oy: 0, ix: 1, iy: 1 } },
        { key: 'in', label: 'In', ease: { ox: 0.42, oy: 0, ix: 1, iy: 1 } },
        { key: 'out', label: 'Out', ease: { ox: 0, oy: 0, ix: 0.58, iy: 1 } },
        { key: 'inout', label: 'In-Out', ease: { ox: 0.42, oy: 0, ix: 0.58, iy: 1 } },
        { key: 'overshoot', label: 'Overshoot', ease: { ox: 0.34, oy: 1.3, ix: 0.64, iy: 1 } },
        { key: 'anticipate', label: 'Anticipate', ease: { ox: 0.36, oy: -0.3, ix: 0.66, iy: 1 } },
    ];
    const [showEase, setShowEase] = createSignal(false);
    let easeSvg: SVGSVGElement | undefined;
    const GPAD = 0.12;
    const vx = (n: number) => GPAD * 100 + n * (100 - 2 * GPAD * 100);
    const vy = (n: number) => GPAD * 100 + (1 - n) * (100 - 2 * GPAD * 100);
    const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const curEase = (): BezierEase => selectedKf()?.kf.ease ?? LINEAR_EASE;
    const dragEaseHandle = (e: PointerEvent, which: 'o' | 'i') => {
        e.stopPropagation();
        e.preventDefault();
        const s = selectedKf();
        if (!easeSvg || !s) return;
        const rect = easeSvg.getBoundingClientRect();
        pushToHistory(); // one entry per drag gesture; streamed updates below skip history
        const move = (ev: PointerEvent) => {
            const nx = clampN(((ev.clientX - rect.left) / rect.width - GPAD) / (1 - 2 * GPAD), 0, 1);
            const ny = clampN(1 - ((ev.clientY - rect.top) / rect.height - GPAD) / (1 - 2 * GPAD), -0.5, 1.5);
            const cur = curEase();
            const ease: BezierEase = which === 'o' ? { ...cur, ox: nx, oy: ny } : { ...cur, ix: nx, iy: ny };
            setFrameEase(s.layerId, s.kf.frame, ease, undefined, false);
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
    };

    // ------------------------------------------------ motion guide picker
    /** The single selected element, when it can serve as a guide path. */
    const guideCandidate = () => {
        if (store.selection.length !== 1) return null;
        const el = store.elements.find(e => e.id === store.selection[0]);
        return el && ['line', 'arrow', 'polyline', 'draw', 'ink', 'bezier', 'path', 'curve'].includes(el.type) ? el : null;
    };

    // ------------------------------------------------ stick-figure pose (bones/IK)
    /** The single selected element, when it's a poseable stick figure. */
    const selectedFigure = () => {
        if (store.selection.length !== 1) return null;
        const el = store.elements.find(e => e.id === store.selection[0]);
        return el?.type === 'stickRig' ? el : null;
    };
    /** Pin the figure's pose on this cel: clip + phase, playback frozen. */
    const setFigurePose = (el: import('../types').DrawingElement, patch: { clip?: string; previewPhase?: number; facing?: 1 | -1 }) => {
        updateElement(el.id, { stickRig: { ...(el.stickRig ?? { clip: 'idle' }), playing: false, ...patch } } as any);
    };

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
                {/* Ease-curve editor popover (per-span bezier; overrides the named easing) */}
                <Show when={showEase() && selectedKf() && (selectedKf()!.kf.tween === 'motion' || selectedKf()!.kf.tween === 'shape')}>
                    <div class="atl-ease" onPointerDown={(e) => e.stopPropagation()}>
                        <div class="atl-ease-head">Ease curve — span from keyframe {selectedKf()!.kf.frame + 1}
                            <button class="atl-icon" title="Close" onClick={() => setShowEase(false)}><X size={12} /></button>
                        </div>
                        <div class="atl-ease-presets">
                            <For each={EASE_PRESETS}>
                                {(p) => (
                                    <button class="atl-btn" title={p.label}
                                        onClick={() => setFrameEase(selectedKf()!.layerId, selectedKf()!.kf.frame, { ...p.ease })}>
                                        {p.label}
                                    </button>
                                )}
                            </For>
                            <button class="atl-btn" title="Remove the custom curve (fall back to the named easing)"
                                onClick={() => setFrameEase(selectedKf()!.layerId, selectedKf()!.kf.frame, undefined, selectedKf()!.kf.easing)}>Clear</button>
                        </div>
                        <svg class="atl-ease-graph" ref={easeSvg} viewBox="0 0 100 100" width="160" height="160">
                            <rect class="atl-ease-box" x={vx(0)} y={vy(1)} width={vx(1) - vx(0)} height={vy(0) - vy(1)} />
                            <line class="atl-ease-ref" x1={vx(0)} y1={vy(0)} x2={vx(1)} y2={vy(1)} />
                            <line class="atl-ease-stem" x1={vx(0)} y1={vy(0)} x2={vx(curEase().ox)} y2={vy(curEase().oy)} />
                            <line class="atl-ease-stem" x1={vx(1)} y1={vy(1)} x2={vx(curEase().ix)} y2={vy(curEase().iy)} />
                            <path class="atl-ease-curve"
                                d={`M ${vx(0)} ${vy(0)} C ${vx(curEase().ox)} ${vy(curEase().oy)}, ${vx(curEase().ix)} ${vy(curEase().iy)}, ${vx(1)} ${vy(1)}`} />
                            <circle class="atl-ease-handle" cx={vx(curEase().ox)} cy={vy(curEase().oy)} r="4.5"
                                onPointerDown={(e) => dragEaseHandle(e, 'o')} />
                            <circle class="atl-ease-handle" cx={vx(curEase().ix)} cy={vy(curEase().iy)} r="4.5"
                                onPointerDown={(e) => dragEaseHandle(e, 'i')} />
                        </svg>
                    </div>
                </Show>
                <div class="atl-header">
                    {/* Scenes: each slide is a scene with its own timeline */}
                    <select class="atl-select" title="Scene (each has its own stage + timeline)"
                        value={store.activeSlideIndex}
                        onChange={(e) => setActiveAnimScene(Number(e.currentTarget.value))}>
                        <For each={store.slides}>{(s, i) => <option value={i()}>{s.name}</option>}</For>
                    </select>
                    <button class="atl-icon" title="New scene" onClick={addAnimScene}><Plus size={13} /></button>
                    <Show when={store.slides.length > 1}>
                        <button class="atl-icon atl-danger" title="Delete this scene (and its contents)"
                            onClick={() => deleteAnimScene(store.activeSlideIndex)}><Trash2 size={12} /></button>
                    </Show>
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
                    <button class="atl-btn" title="Camera: capture the current view as a camera keyframe at the playhead (plays back as a zoom/pan move)"
                        onClick={() => { setCameraKeyFromView(); showToast('Camera keyframe set from the current view', 'success'); }}>📷</button>
                    <Show when={tl()!.camera?.some(k => k.frame === store.animCurrentFrame)}>
                        <button class="atl-btn" title="Remove the camera keyframe at the playhead" onClick={() => clearCameraKey()}>📷✕</button>
                    </Show>
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
                    {/* Stick-figure pose (bones/IK): pin clip + cycle phase on this cel;
                        tweens glide the phase or blend across clips. */}
                    <Show when={selectedFigure()}>
                        {(fig) => (
                            <span class="atl-frameprops">
                                <span class="atl-fp-title">Pose</span>
                                <select class="atl-select" title="Motion clip for this keyframe's pose"
                                    value={fig().stickRig?.clip ?? 'idle'}
                                    onChange={(e) => setFigurePose(fig(), { clip: e.currentTarget.value })}>
                                    <For each={CLIP_LIST}>{(c) => <option value={c.id}>{c.name}</option>}</For>
                                </select>
                                <input type="range" min="0" max="0.99" step="0.01" class="atl-pose-phase"
                                    title="Cycle phase — the exact moment of the clip this cel holds"
                                    value={fig().stickRig?.previewPhase ?? 0}
                                    onInput={(e) => setFigurePose(fig(), { previewPhase: Number(e.currentTarget.value) })} />
                                <button class="atl-btn" title="Flip the figure's facing"
                                    onClick={() => setFigurePose(fig(), { facing: (fig().stickRig?.facing ?? 1) === 1 ? -1 : 1 })}>flip</button>
                            </span>
                        )}
                    </Show>
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
                                <select class="atl-select" title="Tween the span leaving this keyframe (shape = morph the outline too)"
                                    value={s().kf.tween ?? 'none'}
                                    onChange={(e) => {
                                        const v = e.currentTarget.value as 'none' | 'motion' | 'shape';
                                        if (v === 'motion') createTween(s().layerId, s().kf.frame);
                                        else setTween(s().layerId, s().kf.frame, v);
                                    }}>
                                    <option value="none">no tween</option>
                                    <option value="motion">motion tween</option>
                                    <option value="shape">shape tween</option>
                                </select>
                                <Show when={s().kf.tween === 'motion' || s().kf.tween === 'shape'}>
                                    <select class="atl-select" title="Tween easing (a custom curve overrides this)" value={s().kf.easing ?? 'linear'}
                                        onChange={(e) => setFrameEase(s().layerId, s().kf.frame, undefined, e.currentTarget.value as EasingName)}>
                                        <For each={EASINGS}>{(name) => <option value={name}>{name}</option>}</For>
                                    </select>
                                    <button class="atl-btn" classList={{ active: !!s().kf.ease || showEase() }}
                                        title="Custom ease curve (drag the bezier handles)"
                                        onClick={() => setShowEase(v => !v)}>curve</button>
                                    <Show when={s().kf.guideId} fallback={
                                        <Show when={guideCandidate()}>
                                            <button class="atl-btn" title="Make the tween follow the selected line/path (its start → end)"
                                                onClick={() => setFrameGuide(s().layerId, s().kf.frame, guideCandidate()!.id)}>guide: use selection</button>
                                        </Show>
                                    }>
                                        <label class="atl-num" title="Rotate along the guide path's direction">
                                            <input type="checkbox" checked={!!s().kf.guideOrient}
                                                onChange={(e) => setFrameGuide(s().layerId, s().kf.frame, s().kf.guideId!, e.currentTarget.checked)} />
                                            orient
                                        </label>
                                        <button class="atl-btn" title="Stop following the guide path"
                                            onClick={() => setFrameGuide(s().layerId, s().kf.frame, null)}>guide ✕</button>
                                    </Show>
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
                        {/* Aligns with the grid's audio row; the + opens the sound menu at the playhead. */}
                        <div class="atl-audio-head">
                            <span>♪ Audio</span>
                            <button class="atl-icon" title="Add a sound at the playhead (or right-click the audio row)"
                                onClick={(e) => setAudioMenu({ x: e.clientX, y: e.clientY, frame: store.animCurrentFrame, clipId: null })}>
                                <Plus size={12} />
                            </button>
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
            <input type="file" accept="audio/*" style={{ display: 'none' }} ref={audioFileInput} />
            <Show when={ctxMenu()}>
                <ContextMenu x={ctxMenu()!.x} y={ctxMenu()!.y} items={menuItems()} onClose={() => setCtxMenu(null)} />
            </Show>
            <Show when={audioMenu()}>
                <ContextMenu x={audioMenu()!.x} y={audioMenu()!.y} items={audioMenuItems()} onClose={() => setAudioMenu(null)} />
            </Show>
        </Show>
    );
};

export default AnimationTimeline;
