/**
 * Code view — the game's script. It is not a standalone thing: a game has ONE
 * script, and this is the code altitude of the same game the Simple / Graph /
 * Blueprint views edit.
 *
 * - Visual-authored game (default): the script is GENERATED from the blocks and
 *   shown read-only (a learning bridge). "Eject to code" freezes it as the source.
 * - Code-authored game (after eject, or "New Game → Advanced"): the textarea is
 *   the source of truth and the blocks are no longer compiled.
 */

import { type Component, Show, For, createSignal, createEffect } from "solid-js";
import { Portal } from "solid-js/web";
import { X, Play, Code, CornerUpRight, Lock } from "lucide-solid";
import { store, setGameScript, toggleGameScript, setGameAuthoringMode } from "../store/app-store";
import { generateGameScript } from "../game/behaviors-to-script";
import { startGame } from "../game/game-runtime";
import { GAME_TEMPLATES } from "../game/game-templates";
import { GameViewSwitcher } from "./game-view-switcher";
import { showToast } from "./toast";
import { onEscapeKey } from "../utils/use-escape";
import "./game-script-dialog.css";

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

const GameScriptDialog: Component = () => {
    const [draft, setDraft] = createSignal('');
    const isCode = () => store.gameAuthoringMode === 'code';
    /** The generated script for a visual game (read-only preview). */
    const generated = () => generateGameScript(store.elements, store.sceneBehaviors ?? [], store.gameVars ?? [], store.blueprints);

    createEffect(() => {
        if (store.showGameScript) setDraft(isCode() ? (store.gameScript || '') : (generated() || ''));
    });

    const close = () => toggleGameScript(false);
    onEscapeKey(() => store.showGameScript, close);

    /** One-way: freeze the generated script as the source and switch to code authoring. */
    const eject = (seed?: string) => {
        const code = seed ?? generated() ?? store.gameScript ?? '';
        setGameScript(code);
        setGameAuthoringMode('code');
        setDraft(code);
        showToast('Now code-authored — the script is the source (blocks are kept but no longer compiled)', 'info');
    };

    const applyTemplate = (script: string) => {
        if (!isCode()) { eject(script); return; }
        if (draft().trim() && draft() !== script && !confirm('Replace the current script with this template?')) return;
        setDraft(script);
    };

    const save = () => { if (isCode()) setGameScript(draft()); };

    const play = () => {
        const script = isCode() ? draft() : (generated() || '');
        save();
        close();
        if (script && startGame(script)) showToast('Playing — Esc or Stop to end', 'info');
    };

    return (
        <Show when={store.showGameScript}>
            <Portal>
                <div class="gs-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}
                    onKeyDown={(e) => { if (e.key === 'Escape') close(); }}>
                    <div class="gs-modal" onClick={(e) => e.stopPropagation()}>
                        <div class="gs-header">
                            <div class="gs-title"><Code size={18} /><h2>Code</h2><GameViewSwitcher current="code" /></div>
                            <button class="gs-close" type="button" onClick={close}><X size={18} /></button>
                        </div>

                        <Show when={!isCode()}>
                            <div class="gs-banner">
                                <Lock size={13} />
                                <span>Generated from your blocks — read-only. <strong>Eject to code</strong> to hand-edit it (the blocks stay but stop compiling).</span>
                                <button class="gs-eject" type="button" onClick={() => eject()}><CornerUpRight size={13} /> Eject to code</button>
                            </div>
                        </Show>

                        <Show when={isCode()}>
                            <div class="gs-templates">
                                <span class="gs-templates-label">Start from:</span>
                                <For each={GAME_TEMPLATES}>
                                    {(t) => <button class="gs-chip" type="button" onClick={() => applyTemplate(t.script)}>{t.name}</button>}
                                </For>
                            </div>
                        </Show>

                        <textarea
                            class="gs-editor"
                            spellcheck={false}
                            readonly={!isCode()}
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
                            <span class="gs-hint">{isCode() ? 'Code-authored · saved with the document · works in HTML export' : 'Visual game · edit the blocks in Simple / Graph / Blueprint'}</span>
                            <div class="gs-actions">
                                <Show when={isCode()}>
                                    <button class="gs-save" type="button" onClick={() => { save(); showToast('Game script saved', 'success'); }}>Save</button>
                                </Show>
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
