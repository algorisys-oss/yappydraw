/**
 * Game play overlay — mounted while a game runs. A full-viewport layer that:
 *  - captures ALL pointer input (the editor beneath is untouchable) and
 *    forwards it to the runtime in world coordinates,
 *  - shows the Stop pill (top-center, above all chrome; Esc also stops),
 *  - shows the on-screen touch gamepad (D-pad left, A/B right) on coarse-pointer
 *    devices by default; scripts can force it via game.pad(true/false),
 *  - after game.end(): a Replay / Exit panel.
 */

import { type Component, Show, createSignal, onMount, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { Square, RotateCcw } from "lucide-solid";
import { store } from "../store/app-store";
import { screenToWorld } from "../utils/viewport-transforms";
import {
    stopGame, restartGame, padPress, padRelease, onGameUiSignal,
    padVisibleOverride, gameEnded,
    gamePointerMove, gamePointerDown, gamePointerUp, type GameButton,
} from "../game/game-runtime";
import "./game-overlay.css";

const GameOverlay: Component = () => {
    const [uiBump, setUiBump] = createSignal(0);
    onMount(() => { onGameUiSignal(() => setUiBump(v => v + 1)); });

    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const padVisible = () => {
        uiBump();
        return (padVisibleOverride ?? coarse) && !ended();
    };
    const ended = () => { uiBump(); return gameEnded; };

    const toWorld = (e: PointerEvent) => screenToWorld(e.clientX, e.clientY, store.viewState as any);

    const onDown = (e: PointerEvent) => {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        const { x, y } = toWorld(e);
        gamePointerDown(x, y);
    };
    const onMove = (e: PointerEvent) => {
        const { x, y } = toWorld(e);
        gamePointerMove(x, y);
    };
    const onUp = () => gamePointerUp();

    // A gamepad button: press on pointerdown, release on up/cancel/leave —
    // pointer capture keeps multi-touch (move + jump simultaneously) working.
    const PadBtn: Component<{ b: GameButton; label: string; cls?: string }> = (p) => (
        <button
            class={`gp-btn ${p.cls ?? ''}`}
            onPointerDown={(e) => { e.stopPropagation(); (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); padPress(p.b); }}
            onPointerUp={(e) => { e.stopPropagation(); padRelease(p.b); }}
            onPointerCancel={() => padRelease(p.b)}
            onLostPointerCapture={() => padRelease(p.b)}
            onContextMenu={(e) => e.preventDefault()}
        >
            {p.label}
        </button>
    );

    onCleanup(() => gamePointerUp());

    return (
        <Show when={store.gameActive}>
            <Portal>
                <div
                    class="game-overlay"
                    onPointerDown={onDown}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <button class="game-stop" title="Stop game (Esc)" onPointerDown={(e) => e.stopPropagation()} onClick={stopGame}>
                        <Square size={14} /> Stop
                    </button>

                    <Show when={ended()}>
                        <div class="game-ended" onPointerDown={(e) => e.stopPropagation()}>
                            <button class="game-replay" onClick={restartGame}>
                                <RotateCcw size={18} /> Play again
                            </button>
                            <button class="game-exit" onClick={stopGame}>
                                <Square size={16} /> Exit
                            </button>
                        </div>
                    </Show>

                    <Show when={padVisible()}>
                        <div class="gp-dpad" onPointerDown={(e) => e.stopPropagation()}>
                            <PadBtn b="up" label="▲" cls="gp-up" />
                            <PadBtn b="left" label="◀" cls="gp-left" />
                            <PadBtn b="right" label="▶" cls="gp-right" />
                            <PadBtn b="down" label="▼" cls="gp-down" />
                        </div>
                        <div class="gp-actions" onPointerDown={(e) => e.stopPropagation()}>
                            <PadBtn b="b" label="B" cls="gp-b" />
                            <PadBtn b="a" label="A" cls="gp-a" />
                        </div>
                    </Show>
                </div>
            </Portal>
        </Show>
    );
};

export default GameOverlay;
