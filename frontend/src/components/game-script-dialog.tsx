/**
 * Game Script editor — write/paste a game script, start from a template, and
 * press Play. Big touch targets; the cheat-sheet documents the whole game API.
 */

import { type Component, Show, For, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Play, Gamepad2 } from "lucide-solid";
import { store, setGameScript } from "../store/app-store";
import { startGame } from "../game/game-runtime";
import { GAME_TEMPLATES } from "../game/game-templates";
import { showToast } from "./toast";
import "./game-script-dialog.css";

interface GameScriptDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const CHEATSHEET = `game.width / height / x / y      the page = your stage
game.onTick((dt, t) => …)        every frame; dt seconds since last
game.onKey('a', () => …)         once per press: left right up down a b
game.key('left')                 is a button held?
game.pointer()                   {x, y, down} in stage coordinates
game.onPointerDown((x, y) => …)  taps / clicks
game.spawn('circle', x, y, w, h, {backgroundColor: '#f00'})
game.spawnText('Hello', x, y, 32)
game.find('name')                by element id, tag, or its text
sprite.moveBy(dx, dy) / moveTo / centerAt / rotateBy / color / setText
sprite.x .y .width .height .cx .cy .destroy() .hide() .show()
game.hit(a, b)                   do two sprites overlap?
game.hud('SCORE 3')              big top text
game.end('GAME OVER')            freeze with a message (Stop restores)
game.pad(true/false)             force the touch gamepad on/off
game.random(min, max) · game.clamp(v, min, max)`;

const GameScriptDialog: Component<GameScriptDialogProps> = (props) => {
    const [draft, setDraft] = createSignal('');

    createEffect(() => {
        if (props.isOpen) setDraft(store.gameScript || '');
    });

    const applyTemplate = (script: string) => {
        if (draft().trim() && draft() !== script && !confirm('Replace the current script with this template?')) return;
        setDraft(script);
    };

    const save = () => { setGameScript(draft()); };

    const play = () => {
        save();
        props.onClose();
        if (startGame(draft())) showToast('Playing — Esc or Stop to end', 'info');
    };

    return (
        <Show when={props.isOpen}>
            <Portal>
                <div class="gs-overlay" onClick={(e) => { if (e.target === e.currentTarget) props.onClose(); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') props.onClose(); }}>
                    <div class="gs-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="gs-header">
                            <div class="gs-title"><Gamepad2 size={18} /><h2>Game Script</h2></div>
                            <button class="gs-close" type="button" onClick={props.onClose}><X size={18} /></button>
                        </div>

                        <div class="gs-templates">
                            <span class="gs-templates-label">Start from:</span>
                            <For each={GAME_TEMPLATES}>
                                {(t) => (
                                    <button class="gs-chip" type="button" onClick={() => applyTemplate(t.script)}>
                                        {t.name}
                                    </button>
                                )}
                            </For>
                        </div>

                        <textarea
                            class="gs-editor"
                            spellcheck={false}
                            placeholder="// Write your game here, or pick a template above.\n// The script runs once on Play (like Flash's frame 1); game.onTick is your loop."
                            value={draft()}
                            onInput={(e) => setDraft(e.currentTarget.value)}
                            onKeyDown={(e) => e.stopPropagation()}
                        />

                        <details class="gs-cheatsheet">
                            <summary>game.* cheat sheet</summary>
                            <pre>{CHEATSHEET}</pre>
                        </details>

                        <div class="gs-footer">
                            <span class="gs-hint">Saved with the document · works in HTML export · Esc stops play</span>
                            <div class="gs-actions">
                                <button class="gs-save" type="button" onClick={() => { save(); showToast('Game script saved', 'success'); }}>Save</button>
                                <button class="gs-play" type="button" onClick={play}><Play size={16} /> Play</button>
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        </Show>
    );
};

export default GameScriptDialog;
