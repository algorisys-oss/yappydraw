/**
 * Arcade — a Flash-style game runtime over the Yappy canvas.
 *
 * A game script is plain JavaScript that receives a `game` object. Press Play:
 * the document is snapshotted, the script runs against the LIVE canvas
 * (sprites are ordinary Yappy elements), a requestAnimationFrame loop drives
 * `game.onTick` handlers, and input comes from the keyboard and the on-screen
 * touch gamepad. Stop restores the document exactly as it was.
 *
 * Design constraints:
 *  - Ticks never touch undo history or the dirty/autosave pipeline — the
 *    pre-play snapshot is the single source of restoration.
 *  - The same module runs in the editor and in the exported HTML player
 *    (player-app reuses the app store + Canvas).
 */

import { batch } from 'solid-js';
import { store, setStore, zoomToFitSlide, applyDisplayState, setActiveSlide } from '../store/app-store';
import { showToast } from '../components/toast';
import type { DrawingElement } from '../types';

// ─── Input state (keyboard + virtual gamepad write here) ────

/** Logical game buttons. Arrows/WASD and the touch pad map onto these. */
export type GameButton = 'left' | 'right' | 'up' | 'down' | 'a' | 'b';

const held = new Set<GameButton>();
const keyHandlers: { button: GameButton; fn: () => void }[] = [];

const KEY_MAP: Record<string, GameButton> = {
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ' ': 'a', z: 'a', Z: 'a', Enter: 'a',
    x: 'b', X: 'b', Shift: 'b',
};

/** The touch gamepad presses/releases logical buttons through this. */
export const padPress = (b: GameButton) => { if (!held.has(b)) { held.add(b); fireKey(b); } };
export const padRelease = (b: GameButton) => { held.delete(b); };

const fireKey = (b: GameButton) => {
    for (const h of keyHandlers) if (h.button === b) safely(h.fn);
};

// ─── Pointer state (game overlay writes here) ───────────────

const pointer = { x: 0, y: 0, down: false };
const pointerDownHandlers: ((x: number, y: number) => void)[] = [];

export const gamePointerMove = (wx: number, wy: number) => { pointer.x = wx; pointer.y = wy; };
export const gamePointerDown = (wx: number, wy: number) => {
    pointer.x = wx; pointer.y = wy; pointer.down = true;
    for (const fn of pointerDownHandlers) safely(() => fn(wx, wy));
};
export const gamePointerUp = () => { pointer.down = false; };

// ─── Sprite handle ───────────────────────────────────────────

/** Live view over a canvas element: getters read the store, setters patch it
 *  (without history — the pre-play snapshot owns restoration). */
export class Sprite {
    readonly id: string;
    constructor(id: string) { this.id = id; }
    private el(): DrawingElement | undefined { return store.elements.find(e => e.id === this.id); }
    get alive(): boolean { return !!this.el(); }
    get x(): number { return this.el()?.x ?? 0; }
    get y(): number { return this.el()?.y ?? 0; }
    get width(): number { return this.el()?.width ?? 0; }
    get height(): number { return this.el()?.height ?? 0; }
    get angle(): number { return this.el()?.angle ?? 0; }
    get text(): string { return this.el()?.text ?? ''; }
    /** Center coordinates. */
    get cx(): number { const e = this.el(); return e ? e.x + e.width / 2 : 0; }
    get cy(): number { const e = this.el(); return e ? e.y + e.height / 2 : 0; }

    set(props: Partial<DrawingElement>): this { patchElement(this.id, props); return this; }
    moveTo(x: number, y: number): this { return this.set({ x, y }); }
    moveBy(dx: number, dy: number): this { return this.set({ x: this.x + dx, y: this.y + dy }); }
    centerAt(cx: number, cy: number): this { return this.set({ x: cx - this.width / 2, y: cy - this.height / 2 }); }
    rotateBy(deg: number): this { return this.set({ angle: this.angle + (deg * Math.PI) / 180 }); }
    color(c: string): this { return this.set({ backgroundColor: c, fillStyle: 'solid' } as Partial<DrawingElement>); }
    setText(t: string): this { return this.set({ text: t }); }
    hide(): this { return this.set({ opacity: 0 }); }
    show(): this { return this.set({ opacity: 100 }); }
    destroy(): void { removeElement(this.id); }
}

const patchElement = (id: string, props: Partial<DrawingElement>) => {
    setStore('elements', e => e.id === id, props as any);
};
const removeElement = (id: string) => {
    setStore('elements', els => els.filter(e => e.id !== id));
};

// ─── The `game` API handed to scripts ────────────────────────

export interface GameApi {
    /** Playfield (the active page rect, world coordinates). */
    x: number; y: number; width: number; height: number;
    /** Register a per-frame handler: fn(dtSeconds, elapsedSeconds). */
    onTick(fn: (dt: number, t: number) => void): void;
    /** Fires once per press of a logical button (left/right/up/down/a/b). */
    onKey(button: GameButton, fn: () => void): void;
    /** Is a logical button currently held? */
    key(button: GameButton): boolean;
    /** Pointer/touch position in world coordinates + pressed state. */
    pointer(): { x: number; y: number; down: boolean };
    onPointerDown(fn: (x: number, y: number) => void): void;
    /** Find one element by id, tag, or exact text. */
    find(query: string): Sprite | null;
    findAll(query: string): Sprite[];
    /** Spawn a shape ('rectangle' | 'circle' | 'star' | 'triangle' | …). */
    spawn(type: string, x: number, y: number, w: number, h: number, opts?: Partial<DrawingElement>): Sprite;
    /** Spawn a text element. */
    spawnText(text: string, x: number, y: number, fontSize?: number, opts?: Partial<DrawingElement>): Sprite;
    /** Axis-aligned overlap test between two sprites. */
    hit(a: Sprite, b: Sprite): boolean;
    /** Big center-screen heads-up text (scoreboards, "GAME OVER"). */
    hud(text: string): void;
    /** Built-in score: change by `delta` (updates the score HUD). */
    score(delta: number): number;
    /** Read the current score. */
    getScore(): number;
    /** Reuse a saved Display State (morph tween) by name. */
    goToState(name: string): void;
    /** Play a one-shot animation preset (bounce/pulse/shakeX/…) on a sprite. */
    playAnim(sprite: Sprite | null, preset: string): void;
    /** Jump to another page/slide by index. */
    goToPage(index: number): void;
    /** Stop the game loop (the Stop button restores the document). */
    end(message?: string): void;
    /** Show/hide the on-screen touch gamepad regardless of device default. */
    pad(visible: boolean): void;
    random(min: number, max: number): number;
    clamp(v: number, min: number, max: number): number;
}

// ─── Runtime lifecycle ───────────────────────────────────────

interface Snapshot {
    elements: string;
    selection: string[];
    activeSlideIndex: number;
    appMode: string;
}

let snapshot: Snapshot | null = null;
let rafId: number | null = null;
let tickHandlers: ((dt: number, t: number) => void)[] = [];
let startTime = 0;
let lastTime = 0;
let hudId: string | null = null;
let ended = false;
let lastScript = '';
let scoreValue = 0;
const scoreLabel = 'SCORE ';

/** Overridable by the UI (game-overlay) to reflect `game.pad()` requests. */
export let padVisibleOverride: boolean | null = null;
/** True once the script called game.end() — the overlay shows Replay/Exit. */
export let gameEnded = false;

// Tiny pub-sub so the overlay re-renders on runtime UI state (pad, ended).
let uiSignalBump = () => {};
export const onGameUiSignal = (fn: () => void) => { uiSignalBump = fn; };
const setPadOverride = (v: boolean) => { padVisibleOverride = v; uiSignalBump(); };
const setEnded = (v: boolean) => { ended = v; gameEnded = v; uiSignalBump(); };

const safely = (fn: () => void) => {
    try { fn(); } catch (e: any) {
        console.error('[arcade] script error:', e);
        showToast(`Game error: ${e?.message || e}`, 'error');
        stopGame();
    }
};

const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { stopGame(); return; }
    const b = KEY_MAP[e.key];
    if (!b) return;
    e.preventDefault();
    if (!held.has(b)) { held.add(b); fireKey(b); }
};
const onKeyUp = (e: KeyboardEvent) => {
    const b = KEY_MAP[e.key];
    if (b) held.delete(b);
};

let spawnCounter = 0;

function pageRect(): { x: number; y: number; width: number; height: number } {
    const s = store.slides[store.activeSlideIndex] || store.slides[0];
    if (s) return { x: s.spatialPosition.x, y: s.spatialPosition.y, width: s.dimensions.width, height: s.dimensions.height };
    return { x: 0, y: 0, width: 800, height: 600 };
}

function buildApi(): GameApi {
    const page = pageRect();
    const baseProps = {
        strokeColor: 'transparent', strokeWidth: 0, strokeStyle: 'solid' as const,
        fillStyle: 'solid' as const, opacity: 100, angle: 0, roughness: 0,
        renderStyle: 'architectural' as const, locked: false,
        layerId: store.activeLayerId || 'default-layer', roundness: null,
    };
    const makeElement = (type: string, x: number, y: number, w: number, h: number, opts?: Partial<DrawingElement>): Sprite => {
        const el = {
            id: `game-${Date.now()}-${++spawnCounter}`,
            type, x, y, width: w, height: h,
            backgroundColor: '#3b82f6',
            seed: 1, ...baseProps, ...opts,
        } as DrawingElement;
        setStore('elements', prev => [...prev, el]);
        return new Sprite(el.id);
    };

    return {
        x: page.x, y: page.y, width: page.width, height: page.height,
        onTick: (fn) => { tickHandlers.push(fn); },
        onKey: (button, fn) => { keyHandlers.push({ button, fn }); },
        key: (b) => held.has(b),
        pointer: () => ({ ...pointer }),
        onPointerDown: (fn) => { pointerDownHandlers.push(fn); },
        find: (q) => {
            const el = store.elements.find(e => e.id === q || e.tag === q || e.text === q);
            return el ? new Sprite(el.id) : null;
        },
        findAll: (q) => store.elements
            .filter(e => e.id === q || e.tag === q || e.text === q)
            .map(e => new Sprite(e.id)),
        spawn: (type, x, y, w, h, opts) => makeElement(type, x, y, w, h, opts),
        spawnText: (text, x, y, fontSize = 32, opts) => makeElement('text', x, y, Math.max(60, text.length * fontSize * 0.6), fontSize * 1.4, {
            text, fontSize, textColor: '#111827', textAlign: 'center',
            backgroundColor: 'transparent', fontFamily: 'poppins' as any, ...opts,
        }),
        hit: (a, b) => {
            if (!a?.alive || !b?.alive) return false;
            return a.x < b.x + b.width && a.x + a.width > b.x &&
                   a.y < b.y + b.height && a.y + a.height > b.y;
        },
        hud: (text) => {
            if (hudId && store.elements.some(e => e.id === hudId)) {
                patchElement(hudId, { text });
            } else {
                const fs = Math.round(page.width / 18);
                const s = makeElement('text', page.x + page.width * 0.1, page.y + 16, page.width * 0.8, fs * 1.5, {
                    text, fontSize: fs, textColor: '#111827', textAlign: 'center',
                    backgroundColor: 'transparent', fontFamily: 'poppins' as any, fontWeight: 'bold' as any,
                });
                hudId = s.id;
            }
        },
        score: (delta) => {
            scoreValue += delta;
            const label = scoreLabel + scoreValue;
            if (hudId && store.elements.some(e => e.id === hudId)) {
                patchElement(hudId, { text: label });
            } else {
                const fs = Math.round(page.width / 18);
                const s = makeElement('text', page.x + page.width * 0.1, page.y + 16, page.width * 0.8, fs * 1.5, {
                    text: label, fontSize: fs, textColor: '#111827', textAlign: 'center',
                    backgroundColor: 'transparent', fontFamily: 'poppins' as any, fontWeight: 'bold' as any,
                });
                hudId = s.id;
            }
            return scoreValue;
        },
        getScore: () => scoreValue,
        goToState: (name) => {
            const st = store.states.find(s => s.name === name || s.id === name);
            if (st) void applyDisplayState(st.id);
        },
        playAnim: (sprite, preset) => {
            if (!sprite?.alive) return;
            void import('../utils/animation/sequence-animator').then(m =>
                m.sequenceAnimator.playAnimation(sprite.id, { id: `bhv-${Date.now()}`, type: 'preset', name: preset, trigger: 'programmatic' } as any, () => {}));
        },
        goToPage: (index) => { if (index >= 0 && index < store.slides.length) setActiveSlide(index); },
        end: (message) => {
            setEnded(true);
            if (message) {
                const fs = Math.round(page.width / 10);
                makeElement('text', page.x, page.y + page.height / 2 - fs, page.width, fs * 2, {
                    text: message, fontSize: fs, textColor: '#dc2626', textAlign: 'center',
                    backgroundColor: 'transparent', fontFamily: 'poppins' as any, fontWeight: 'bold' as any,
                });
            }
        },
        pad: (visible) => setPadOverride(visible),
        random: (min, max) => min + Math.random() * (max - min),
        clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    };
}

/** True while a game is running. */
export const isGameRunning = () => store.gameActive;

/**
 * Start the game: snapshot the document, compile + run the script (its
 * top-level code is the setup, like frame-1 ActionScript), start the loop.
 * Returns false if the script failed to compile/run.
 */
export function startGame(script?: string): boolean {
    if (store.gameActive) stopGame();
    const src = script ?? store.gameScript;
    if (!src?.trim()) {
        showToast('No game script yet — open Menu → Game Script…', 'info');
        return false;
    }

    snapshot = {
        elements: JSON.stringify(store.elements),
        selection: [...store.selection],
        activeSlideIndex: store.activeSlideIndex,
        appMode: store.appMode,
    };
    lastScript = src;
    tickHandlers = [];
    keyHandlers.length = 0;
    pointerDownHandlers.length = 0;
    held.clear();
    hudId = null;
    scoreValue = 0;
    setEnded(false);
    padVisibleOverride = null;

    let fn: (game: GameApi) => void;
    try {
        fn = new Function('game', `'use strict';\n${src}`) as (game: GameApi) => void;
    } catch (e: any) {
        showToast(`Game script error: ${e?.message || e}`, 'error');
        snapshot = null;
        return false;
    }

    batch(() => {
        setStore('selection', []);
        setStore('gameActive', true);
        // A clean stage: presentation mode hides all editor chrome and the
        // page-frame border. Restored from the snapshot on stop.
        setStore('appMode', 'presentation' as any);
    });
    zoomToFitSlide(); // frame the stage

    try {
        fn(buildApi());
    } catch (e: any) {
        showToast(`Game error: ${e?.message || e}`, 'error');
        stopGame();
        return false;
    }

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);

    startTime = performance.now();
    lastTime = startTime;
    const loop = (now: number) => {
        rafId = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp long frames
        lastTime = now;
        if (ended) return; // frozen finale — Stop restores
        const t = (now - startTime) / 1000;
        try {
            batch(() => { for (const h of tickHandlers) h(dt, t); });
        } catch (e: any) {
            console.error('[arcade] tick error:', e);
            showToast(`Game error: ${e?.message || e}`, 'error');
            stopGame();
        }
    };
    rafId = requestAnimationFrame(loop);
    return true;
}

/** Stop the loop and restore the document exactly as it was before Play. */
export function stopGame(): void {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('keyup', onKeyUp, true);
    held.clear();
    tickHandlers = [];
    keyHandlers.length = 0;
    pointerDownHandlers.length = 0;

    if (snapshot) {
        const snap = snapshot;
        snapshot = null;
        batch(() => {
            setStore('elements', JSON.parse(snap.elements));
            setStore('selection', snap.selection);
            setStore('activeSlideIndex', snap.activeSlideIndex);
            setStore('appMode', snap.appMode as any);
            setStore('gameActive', false);
        });
    } else {
        setStore('gameActive', false);
    }
    setEnded(false);
}

/** Restore the document and immediately play the same script again. */
export function restartGame(): void {
    const src = lastScript;
    stopGame();
    if (src) startGame(src);
}
